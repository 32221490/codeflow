package ac.dankook.codeflow.domain.visualizer.controller;

import ac.dankook.codeflow.domain.visualizer.dto.AnswerCheckResponse;
import ac.dankook.codeflow.domain.visualizer.dto.JdiResponse;
import ac.dankook.codeflow.domain.visualizer.service.DockerTracker;
import ac.dankook.codeflow.global.response.CommonResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.Map;

@Tag(name = "DockerTracker", description = "DockerTracker API")
@RestController
@RequestMapping("/api/dockertracker")
@RequiredArgsConstructor
public class VisualizerController {

    private static final String SAMPLE_PATH = "server/src/main/java/ac/dankook/codeflow/domain/visualizer/test/Sample.java";

    private final DockerTracker dockerTracker;

    @Operation(summary = "샘플 코드 실행", description = "Sample.java를 Docker에서 실행하고 출력과 JDI 트레이스를 반환합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "실행 성공"),
            @ApiResponse(responseCode = "500", description = "실행 오류 (컴파일 실패, Docker 오류 등)")
    })
    @PostMapping("/trace")
    public ResponseEntity<CommonResponse<Map<String, Object>>> trace() throws Exception {
        String sourceCode = Files.readString(Path.of(SAMPLE_PATH).toAbsolutePath());

        DockerTracker.TraceResult result = dockerTracker.runAndTrace(sourceCode);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("answerCheck", new AnswerCheckResponse(result.programOutput()));
        data.put("jdi", new JdiResponse(result.traceJson()));

        return ResponseEntity.ok(CommonResponse.success(data));
    }
}
