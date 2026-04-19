package ac.dankook.codeflow.domain.user.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ac.dankook.codeflow.domain.user.dto.UserResponse;
import ac.dankook.codeflow.domain.user.service.UserService;
import ac.dankook.codeflow.global.response.CommonResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@Tag(name = "User", description = "사용자 API")
@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @Operation(summary = "내 정보 조회", description = "JWT 토큰으로 인증된 사용자의 정보를 반환합니다.",
            security = @SecurityRequirement(name = "Bearer"))
    @ApiResponses({
            @ApiResponse(responseCode = "200",
                    description = "조회 성공"),
            @ApiResponse(responseCode = "401",
                    description = "인증 필요")})
    @GetMapping("/me")
    public ResponseEntity<CommonResponse<UserResponse>> getMe(@AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(CommonResponse.success(userService.getMe(Long.parseLong(userId))));
    }
}
