package ac.dankook.codeflow.domain.problem;

import static org.assertj.core.api.Assertions.assertThat;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;
import com.fasterxml.jackson.databind.ObjectMapper;
import ac.dankook.codeflow.domain.problem.dto.GeminiResponse;

@DisplayName("Gemini API 응답 확인 (수동 실행)")
class GeminiApiTest {

        private static final String API_KEY = System.getenv("GOOGLE_GEMINI_API_KEY");
        private static final String BASE_URL =
                        "https://generativelanguage.googleapis.com/v1beta/models";

        @Test
        @Disabled("API 키 필요 — 수동으로 실행")
        @DisplayName("Gemini 응답 raw JSON 출력")
        void printRawResponse() throws Exception {
                RestClient restClient = RestClient.builder().baseUrl(BASE_URL).build();

                Map<String, Object> requestBody = Map.of("contents", List.of(Map.of("parts",
                                List.of(Map.of("text", "Java에서 배열과 리스트의 차이를 설명해줘.")))),
                                "system_instruction", Map.of("parts", List.of(Map.of("text",
                                                "You are a professional coding tutor."))));

                String rawJson = restClient.post()
                                .uri(uri -> uri.path("/gemini-1.5-flash:generateContent")
                                                .queryParam("key", API_KEY).build())
                                .contentType(MediaType.APPLICATION_JSON).body(requestBody)
                                .retrieve().body(String.class);

                System.out.println("=== RAW JSON ===");
                System.out.println(new ObjectMapper().writerWithDefaultPrettyPrinter()
                                .writeValueAsString(new ObjectMapper().readTree(rawJson)));
        }

        @Test
        @Disabled("API 키 필요 — 수동으로 실행")
        @DisplayName("GeminiResponse record로 파싱 확인")
        void parsedResponse() {
                RestClient restClient = RestClient.builder().baseUrl(BASE_URL).build();

                Map<String, Object> requestBody = Map.of("contents", List.of(Map.of("parts",
                                List.of(Map.of("text", "Java ArrayList 사용법을 예제와 함께 알려줘.")))),
                                "system_instruction", Map.of("parts", List.of(Map.of("text",
                                                "You are a professional coding tutor. Provide structured coding problems."))));

                GeminiResponse response = restClient.post()
                                .uri(uri -> uri.path("/gemini-1.5-flash:generateContent")
                                                .queryParam("key", API_KEY).build())
                                .contentType(MediaType.APPLICATION_JSON).body(requestBody)
                                .retrieve().body(GeminiResponse.class);

                assertThat(response).isNotNull();
                assertThat(response.candidates()).isNotEmpty();

                String text = response.candidates().get(0).content().parts().get(0).text();
                System.out.println("=== PARSED TEXT ===");
                System.out.println(text);

                assertThat(text).isNotBlank();
        }
}
