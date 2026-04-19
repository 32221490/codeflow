package ac.dankook.codeflow.domain.auth;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import ac.dankook.codeflow.domain.auth.dto.LoginRequest;
import ac.dankook.codeflow.domain.auth.dto.LoginResponse;
import ac.dankook.codeflow.domain.auth.dto.SignupRequest;
import ac.dankook.codeflow.domain.auth.dto.SignupResponse;
import ac.dankook.codeflow.global.response.CommonResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@Tag(name = "Auth", description = "인증 API")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "회원가입", description = "이메일 인증이 완료된 계정으로 회원가입합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "201",
                    description = "회원가입 성공"),
            @ApiResponse(responseCode = "400",
                    description = "유효성 검사 실패 또는 이메일 미인증"),
            @ApiResponse(responseCode = "409",
                    description = "이미 존재하는 이메일")})
    @PostMapping("/signup")
    public ResponseEntity<CommonResponse<SignupResponse>> signup(@RequestBody SignupRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(CommonResponse.success(authService.signup(request)));
    }

    @Operation(summary = "이메일 인증 코드 발송", description = "입력한 이메일로 6자리 인증 코드를 발송합니다. (유효시간 5분)")
    @ApiResponses({
            @ApiResponse(responseCode = "200",
                    description = "발송 성공"),
            @ApiResponse(responseCode = "400",
                    description = "잘못된 이메일 형식")})
    @PostMapping("/email/send")
    public ResponseEntity<?> sendVerificationCode(@Parameter(description = "인증 코드를 받을 이메일",
            example = "user@example.com") @RequestParam String email) {
        authService.sendVerificationCode(email);
        return ResponseEntity.ok(CommonResponse.success(null));
    }

    @Operation(summary = "이메일 인증 코드 확인", description = "발송된 인증 코드를 검증합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200",
                    description = "인증 성공"),
            @ApiResponse(responseCode = "400",
                    description = "코드 불일치 또는 만료")})
    @PostMapping("/email/verify")
    public ResponseEntity<?> verifyCode(
            @Parameter(description = "인증할 이메일",
                    example = "user@example.com") @RequestParam String email,
            @Parameter(description = "인증 코드 6자리", example = "123456") @RequestParam String code) {
        authService.verifyCode(email, code);
        return ResponseEntity.ok(CommonResponse.success(null));
    }

    @Operation(summary = "로그인", description = "로그인하고 액세스 토큰을 반환합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200",
                    description = "로그인 성공"),
            @ApiResponse(responseCode = "401",
                    description = "이메일 또는 비밀번호 불일치")})
    @PostMapping("/login")
    public ResponseEntity<CommonResponse<LoginResponse>> login(@RequestBody LoginRequest request) {
        return ResponseEntity.status(200).body(CommonResponse.success(authService.login(request)));
    }
}
