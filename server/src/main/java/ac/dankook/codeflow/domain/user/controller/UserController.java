package ac.dankook.codeflow.domain.user.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ac.dankook.codeflow.domain.user.dto.UserResponse;
import ac.dankook.codeflow.domain.user.service.UserService;
import ac.dankook.codeflow.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getMe(@AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(ApiResponse.success(userService.getMe(Long.parseLong(userId))));
    }
}
