package ac.dankook.codeflow.dockerapi;

import java.nio.file.Path;

/**
 * DockerTracker 단독 실행용 테스트 진입점.
 * Spring Boot 없이 main()으로 직접 실행한다.
 *
 * 나중에 웹 버튼 연동 시 DockerTracker는 그대로 두고
 * Controller에서 dockerTracker.runAndTrace(filePath) 를 호출하면 된다.
 */
public class DockerTrackerRunner {

    public static void main(String[] args) throws Exception {
        // Sample.java 절대 경로 — 프로젝트 루트 기준으로 계산
        Path sampleFile = Path.of("server/src/main/java/ac/dankook/codeflow/dockerapi/Sample.java")
                .toAbsolutePath();

        System.out.println("=== 대상 파일: " + sampleFile);
        System.out.println("=== Docker 실행 시작...\n");

        DockerTracker tracker = new DockerTracker();
        DockerTracker.TraceResult result = tracker.runAndTrace(sampleFile.toString());

        System.out.println("\n== 출력 결과 ==");
        System.out.println(result.programOutput());

        System.out.println("\n== 코드 실행 흐름 ==");
        System.out.println(result.traceJson());
    }
}
