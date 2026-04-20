package ac.dankook.codeflow.domain.visualizer.controller;

import ac.dankook.codeflow.domain.visualizer.dto.JdiResponse;
import ac.dankook.codeflow.domain.visualizer.dto.TraceRequest;
import ac.dankook.codeflow.domain.visualizer.service.DockerTracker;
import ac.dankook.codeflow.global.response.CommonResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "DockerTracker", description = "DockerTracker API")
@RestController
@RequestMapping("/api/dockertracker")
@RequiredArgsConstructor
public class VisualizerController {

    private final DockerTracker dockerTracker;

    @Operation(summary = "코드 실행 추적", description = "Java 소스 코드를 Docker에서 실행하고 라인별 실행 흐름을 반환합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "추적 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청 (소스 코드 누락)"),
            @ApiResponse(responseCode = "500", description = "실행 오류 (컴파일 실패, Docker 오류 등)")
    })
    @PostMapping("/trace")
    public ResponseEntity<CommonResponse<JdiResponse>> trace(
            @Valid @RequestBody TraceRequest request) throws Exception {
        DockerTracker.TraceResult result = dockerTracker.runAndTrace(request.getSourceCode());
        return ResponseEntity.ok(CommonResponse.success(new JdiResponse(result.traceJson())));
    }
}
