package ac.dankook.codeflow.domain.auth.dto;

import ac.dankook.codeflow.domain.user.dto.type.LoginType;
import ac.dankook.codeflow.domain.user.dto.type.Role;
import ac.dankook.codeflow.domain.user.entity.User;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class LoginResponse {
    private String email;
    private String nickname;
    private String profileImage;
    private LoginType loginType;
    private Role role;
    private String accessToken;

    public static LoginResponse of(User user, String accessToken) {
        return new LoginResponse(
                user.getEmail(),
                user.getNickname(),
                user.getProfileImage(),
                user.getLoginType(),
                user.getRole(),
                accessToken
        );
    }
}
