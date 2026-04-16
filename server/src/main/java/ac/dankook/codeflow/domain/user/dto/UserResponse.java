package ac.dankook.codeflow.domain.user.dto;

import ac.dankook.codeflow.domain.user.dto.type.LoginType;
import ac.dankook.codeflow.domain.user.entity.User;
import lombok.Getter;

@Getter
public class UserResponse {

    private final Long id;
    private final String email;
    private final String nickname;
    private final String profileImage;
    private final LoginType loginType;

    private UserResponse(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.nickname = user.getNickname();
        this.profileImage = user.getProfileImage();
        this.loginType = user.getLoginType();
    }

    public static UserResponse from(User user) {
        return new UserResponse(user);
    }
}
