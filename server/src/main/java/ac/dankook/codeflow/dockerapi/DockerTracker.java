package ac.dankook.codeflow.dockerapi;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.*;
import java.net.Socket;
import java.nio.file.*;

/**
 * Java 소스 파일을 Docker 컨테이너 안에서 실행하고,
 * JDI(ExecutionTracer)를 통해 실행 흐름을 추적하여 JSON으로 반환한다.
 *
 * 실행 순서:
 *   1. Docker 컨테이너 기동 (JDWP 포트 5005 노출)
 *   2. 소스 파일을 컨테이너로 복사 (docker cp) — package 선언 자동 제거
 *   3. javac로 컴파일
 *   4. JDWP suspend=y 옵션으로 JVM 기동
 *   5. JDWP 포트 준비 확인 후 ExecutionTracer 연결
 *   6. 추적 완료 후 컨테이너 정리
 */
@Slf4j
@Service
public class DockerTracker {

    private static final int    JDWP_PORT       = 5005;
    private static final String DOCKER_IMAGE    = "eclipse-temurin:21-jdk-jammy";
    private static final int    PORT_WAIT_MS    = 15_000;  // JDWP 포트 대기 최대 시간
    private static final int    CONTAINER_TTL_S = 120;     // 컨테이너 최대 수명 (초)

    /** 실행 결과 + 코드 실행 흐름을 함께 담는 반환 타입 */
    public record TraceResult(String programOutput, String traceJson) {}

    /**
     * 지정한 Java 파일을 Docker 안에서 실행하고, stdout 출력과 실행 흐름 JSON을 함께 반환한다.
     *
     * @param javaFilePath 추적할 .java 파일의 절대 경로
     * @return programOutput(실행 출력) + traceJson(스텝별 실행 흐름)
     */
    public TraceResult runAndTrace(String javaFilePath) throws Exception {
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

            log.info("[DockerTracker] ExecutionTracer 시작");
            ExecutionTracer tracer = new ExecutionTracer("localhost", JDWP_PORT);
            String traceJson = tracer.trace();

            return new TraceResult(programOutput, traceJson);

        } finally {
            log.info("[DockerTracker] 컨테이너 정리: {}", containerName);
            stopAndRemove(containerName);
        }
    }

    /** 컨테이너 안에서 프로그램을 일반 실행하여 stdout을 캡처한다. */
    private String captureOutput(String name) throws Exception {
        Process p = new ProcessBuilder(
                "docker", "exec", name,
                "java", "-cp", "/workspace", "Sample"
        ).redirectErrorStream(true).start();

        String output = new String(p.getInputStream().readAllBytes());
        p.waitFor();
        return output.trim();
    }

    // -------------------------------------------------------------------------
    // Docker 컨테이너 관리
    // -------------------------------------------------------------------------

    /** 컨테이너를 백그라운드로 기동한다. JDWP 포트(5005)를 호스트에 바인딩한다. */
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

    /**
     * 소스 파일을 컨테이너의 /workspace/Sample.java 로 복사한다.
     * package 선언이 있으면 제거하여 독립 실행 가능한 형태로 변환한다.
     */
    private void copySourceToContainer(String name, String javaFilePath) throws Exception {
        // 1) 파일 읽기 + package 선언 제거
        String source = Files.readString(Path.of(javaFilePath));
        String stripped = stripPackageDeclaration(source);

        // 2) 임시 파일에 저장
        Path tmp = Files.createTempFile("codeflow-", "-Sample.java");
        try {
            Files.writeString(tmp, stripped);

            // 3) 컨테이너 안에 /workspace 디렉터리 생성
            exec(name, "mkdir", "-p", "/workspace");

            // 4) docker cp 로 파일 전송
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

    /** 컨테이너 안에서 javac로 컴파일한다. 실패 시 컴파일 오류 메시지를 포함해 예외 발생. */
    private void compileInContainer(String name) throws Exception {
        Process p = new ProcessBuilder(
                "docker", "exec", name,
                "javac", "-g",              // -g : 디버그 정보 포함 (JDI 변수 추적에 필요)
                "-cp", "/workspace",
                "/workspace/Sample.java"
        ).redirectErrorStream(true).start();

        String output = new String(p.getInputStream().readAllBytes());
        int exit = p.waitFor();
        if (exit != 0) {
            throw new RuntimeException("컴파일 오류:\n" + output);
        }
    }

    /**
     * JDWP(suspend=y) 옵션으로 JVM을 백그라운드 기동한다.
     * suspend=y 이므로 JDI가 연결되기 전까지 JVM은 대기 상태를 유지한다.
     */
    private void runWithJdwp(String name) throws Exception {
        new ProcessBuilder(
                "docker", "exec", "-d", name,
                "java",
                "-agentlib:jdwp=transport=dt_socket,server=y,suspend=y,address=*:" + JDWP_PORT,
                "-cp", "/workspace",
                "Sample"
        ).start();
        // docker exec -d 는 즉시 반환 — JDWP 포트 준비는 waitForPort()에서 확인
    }

    /** 컨테이너를 중지하고 삭제한다. 실패해도 경고만 출력한다. */
    private void stopAndRemove(String name) {
        try {
            new ProcessBuilder("docker", "stop", name).start().waitFor();
            new ProcessBuilder("docker", "rm",   name).start().waitFor();
        } catch (Exception e) {
            log.warn("[DockerTracker] 컨테이너 정리 실패 ({}): {}", name, e.getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // 포트 대기
    // -------------------------------------------------------------------------

    /**
     * 지정한 포트가 열릴 때까지 폴링한다.
     * timeoutMs 안에 열리지 않으면 예외를 던진다.
     */
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

    // -------------------------------------------------------------------------
    // 유틸리티
    // -------------------------------------------------------------------------

    /** docker exec 래퍼 — 반환값이 필요 없는 단순 명령용 */
    private void exec(String containerName, String... command) throws Exception {
        String[] full = new String[command.length + 3];
        full[0] = "docker";
        full[1] = "exec";
        full[2] = containerName;
        System.arraycopy(command, 0, full, 3, command.length);
        new ProcessBuilder(full).start().waitFor();
    }

    /**
     * Java 소스에서 package 선언을 제거한다.
     * Docker 컨테이너 안에서 기본 패키지 클래스로 실행하기 위해 필요하다.
     */
    private String stripPackageDeclaration(String source) {
        // "package xxx.yyy.zzz;" 한 줄 전체 제거
        return source.replaceAll("(?m)^\\s*package\\s+[\\w.]+;\\s*\\r?\\n?", "");
    }
}
