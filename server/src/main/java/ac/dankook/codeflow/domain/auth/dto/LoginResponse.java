package ac.dankook.codeflow.domain.auth.dto;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class LoginResponse {
    private String accessToken;

    public static LoginResponse of(String accessToken) {
        return new LoginResponse(accessToken);
    }
}
