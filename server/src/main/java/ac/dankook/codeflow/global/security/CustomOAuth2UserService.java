package ac.dankook.codeflow.global.security;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        // 기본 GitHub 유저 정보 로드 (login, avatar_url, email 등)
        OAuth2User oAuth2User = super.loadUser(userRequest);

        // email이 public이면 그대로 반환
        if (oAuth2User.getAttribute("email") != null) {
            return oAuth2User;
        }

        // email이 private 설정이라 null인 경우
        // → GitHub /user/emails API를 액세스 토큰으로 직접 호출해서 primary 이메일 가져오기
        String token = userRequest.getAccessToken().getTokenValue();
        String email = fetchPrimaryEmail(token);

        // 기존 attributes는 불변(unmodifiableMap)이라 새 Map으로 복사 후 email 추가
        Map<String, Object> attributes = new HashMap<>(oAuth2User.getAttributes());
        attributes.put("email", email);

        return new DefaultOAuth2User(
                oAuth2User.getAuthorities(),
                attributes,
                "login" // GitHub의 유저명 필드 (nameAttributeKey)
        );
    }

    /**
     * GitHub /user/emails API 호출
     * 응답 예시: [{ "email": "xxx@gmail.com", "primary": true, "verified": true }, ...]
     * primary이고 verified인 이메일을 반환
     */
    private String fetchPrimaryEmail(String token) {
        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.set("Accept", "application/vnd.github+json");

        ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                "https://api.github.com/user/emails",
                HttpMethod.GET,
                new HttpEntity<>(headers),
                new ParameterizedTypeReference<>() {}
        );

        if (response.getBody() == null) return null;

        return response.getBody().stream()
                .filter(e -> Boolean.TRUE.equals(e.get("primary")) && Boolean.TRUE.equals(e.get("verified")))
                .map(e -> (String) e.get("email"))
                .findFirst()
                .orElse(null);
    }
}
