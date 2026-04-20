package ac.dankook.codeflow.domain.visualizer.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.*;
import java.net.Socket;
import java.nio.file.*;

/**
 * Java 소스 코드를 Docker 컨테이너 안에서 실행하고,
 * JDI(ExecutionTracker)를 통해 실행 흐름을 추적하여 JSON으로 반환한다.
 *
 * 실행 순서:
 *   1. 소스 코드를 임시 파일로 저장
 *   2. Docker 컨테이너 기동 (JDWP 포트 5005 노출)
 *   3. 소스 파일을 컨테이너로 복사 (docker cp) — package 선언 자동 제거
 *   4. javac로 컴파일
 *   5. JDWP suspend=y 옵션으로 JVM 기동
 *   6. JDWP 포트 준비 확인 후 ExecutionTracker 연결
 *   7. 추적 완료 후 컨테이너 정리
 */
@Service
public class DockerTracker {

    private static final Logger log = LoggerFactory.getLogger(DockerTracker.class);

    private static final int    JDWP_PORT       = 5005;
    private static final String DOCKER_IMAGE    = "eclipse-temurin:21-jdk-jammy";
    private static final int    PORT_WAIT_MS    = 15_000;
    private static final int    CONTAINER_TTL_S = 120;

    /** 실행 결과 + 코드 실행 흐름을 함께 담는 반환 타입 */
    public record TraceResult(String programOutput, String traceJson) {}

    /**
     * Java 소스 코드를 Docker 안에서 실행하고, stdout 출력과 실행 흐름 JSON을 함께 반환한다.
     *
     * @param sourceCode 추적할 Java 소스 코드 문자열
     * @return programOutput(실행 출력) + traceJson(스텝별 실행 흐름)
     */
    public TraceResult runAndTrace(String sourceCode) throws Exception {
        Path tmpFile = Files.createTempFile("codeflow-trace-", ".java");
        try {
            Files.writeString(tmpFile, sourceCode);
            return runAndTraceFile(tmpFile.toString());
        } finally {
            Files.deleteIfExists(tmpFile);
        }
    }

    private TraceResult runAndTraceFile(String javaFilePath) throws Exception {
        String containerName = "codeflow-" + System.currentTimeMillis();

        log.info("[DockerTracker] 컨테이너 시작: {}", containerName);
        startContainer(containerName);

        try {
            log.info("[DockerTracker] 소스 파일 복사: {}", javaFilePath);
            copySourceToContainer(containerName, javaFilePath);

            log.info("[DockerTracker] javac 컴파일");
            compileInContainer(containerName);

            log.info("[DockerTracker] 프로그램 실행 (stdout 캡처)");
            String programOutput = captureOutput(containerName);

            log.info("[DockerTracker] JDWP 모드로 JVM 기동");
            runWithJdwp(containerName);

            log.info("[DockerTracker] JDWP 포트 대기 중...");
            waitForPort(JDWP_PORT, PORT_WAIT_MS);

            log.info("[DockerTracker] ExecutionTracker 시작");
            ExecutionTracker tracker = new ExecutionTracker("localhost", JDWP_PORT);
            String traceJson = tracker.trace();

            return new TraceResult(programOutput, traceJson);

        } finally {
            log.info("[DockerTracker] 컨테이너 정리: {}", containerName);
            stopAndRemove(containerName);
        }
    }

    private String captureOutput(String name) throws Exception {
        Process p = new ProcessBuilder(
                "docker", "exec", name,
                "java", "-cp", "/workspace", "Sample"
        ).redirectErrorStream(true).start();

        String output = new String(p.getInputStream().readAllBytes());
        p.waitFor();
        return output.trim();
    }

    private void startContainer(String name) throws Exception {
        Process p = new ProcessBuilder(
                "docker", "run", "-d",
                "-p", JDWP_PORT + ":" + JDWP_PORT,
                "--name", name,
                DOCKER_IMAGE,
                "sleep", String.valueOf(CONTAINER_TTL_S)
        ).redirectErrorStream(true).start();

        String output = new String(p.getInputStream().readAllBytes());
        int exit = p.waitFor();
        if (exit != 0) {
            throw new RuntimeException("컨테이너 기동 실패:\n" + output);
        }
    }

    private void copySourceToContainer(String name, String javaFilePath) throws Exception {
        String source = Files.readString(Path.of(javaFilePath));
        String stripped = stripPackageDeclaration(source);

        Path tmp = Files.createTempFile("codeflow-", "-Sample.java");
        try {
            Files.writeString(tmp, stripped);
            exec(name, "mkdir", "-p", "/workspace");

            Process p = new ProcessBuilder(
                    "docker", "cp", tmp.toString(), name + ":/workspace/Sample.java"
            ).redirectErrorStream(true).start();

            String output = new String(p.getInputStream().readAllBytes());
            int exit = p.waitFor();
            if (exit != 0) {
                throw new RuntimeException("파일 복사 실패:\n" + output);
            }
        } finally {
            Files.deleteIfExists(tmp);
        }
    }

    private void compileInContainer(String name) throws Exception {
        Process p = new ProcessBuilder(
                "docker", "exec", name,
                "javac", "-g",
                "-cp", "/workspace",
                "/workspace/Sample.java"
        ).redirectErrorStream(true).start();

        String output = new String(p.getInputStream().readAllBytes());
        int exit = p.waitFor();
        if (exit != 0) {
            throw new RuntimeException("컴파일 오류:\n" + output);
        }
    }

    private void runWithJdwp(String name) throws Exception {
        new ProcessBuilder(
                "docker", "exec", "-d", name,
                "java",
                "-agentlib:jdwp=transport=dt_socket,server=y,suspend=y,address=*:" + JDWP_PORT,
                "-cp", "/workspace",
                "Sample"
        ).start();
    }

    private void stopAndRemove(String name) {
        try {
            new ProcessBuilder("docker", "stop", name).start().waitFor();
            new ProcessBuilder("docker", "rm",   name).start().waitFor();
        } catch (Exception e) {
            log.warn("[DockerTracker] 컨테이너 정리 실패 ({}): {}", name, e.getMessage());
        }
    }

    private void waitForPort(int port, int timeoutMs) throws Exception {
        long deadline = System.currentTimeMillis() + timeoutMs;
        while (System.currentTimeMillis() < deadline) {
            try (Socket ignored = new Socket("localhost", port)) {
                log.info("[DockerTracker] JDWP 포트 {} 준비 완료", port);
                return;
            } catch (IOException e) {
                //noinspection BusyWait
                Thread.sleep(300);
            }
        }
        throw new RuntimeException("JDWP 포트가 " + timeoutMs + "ms 내에 열리지 않았습니다.");
    }

    private void exec(String containerName, String... command) throws Exception {
        String[] full = new String[command.length + 3];
        full[0] = "docker";
        full[1] = "exec";
        full[2] = containerName;
        System.arraycopy(command, 0, full, 3, command.length);
        new ProcessBuilder(full).start().waitFor();
    }

    private String stripPackageDeclaration(String source) {
        return source.replaceAll("(?m)^\\s*package\\s+[\\w.]+;\\s*\\r?\\n?", "");
    }
}
