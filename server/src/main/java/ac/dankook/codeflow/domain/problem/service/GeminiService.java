package ac.dankook.codeflow.domain.problem.service;

import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import ac.dankook.codeflow.domain.problem.dto.GeminiResponse;
import ac.dankook.codeflow.domain.problem.dto.ProblemResponseDto;
import ac.dankook.codeflow.global.exception.BusinessException;
import ac.dankook.codeflow.global.exception.ErrorCode;
import ac.dankook.codeflow.global.prompt.PromptFiller;
import ac.dankook.codeflow.global.prompt.PromptTemplate;

@Service
public class GeminiService {
    private final RestClient restClient;
    private final PromptFiller promptFiller;
    private final ObjectMapper objectMapper;

    @Value("${GOOGLE_GEMINI_API_KEY}")
    private String apiKey;

    public GeminiService(RestClient.Builder restClientBuilder, PromptFiller promptFiller,
            ObjectMapper objectMapper) {
        this.restClient = restClientBuilder
                .baseUrl("https://generativelanguage.googleapis.com/v1beta/models").build();
        this.promptFiller = promptFiller;
        this.objectMapper = objectMapper;
    }


    // 문제 생성 부분
    public ProblemResponseDto generateProblem(String topic, String difficulty) {
        String prompt = promptFiller.fill(PromptTemplate.PROBLEM_GENERATE,
                Map.of("topic", defaultString(topic), "difficulty", defaultString(difficulty)));
        String response = callGemini(prompt);

        try {
            return objectMapper.readValue(response, ProblemResponseDto.class);
        } catch (JsonProcessingException e) {
            throw new BusinessException(ErrorCode.AI_RESPONSE_FAILURE);
        }
    }



    // 제미나이 호출 부분
    private String callGemini(String prompt) {
        Map<String, Object> requestBody =
                Map.of("contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))));

        GeminiResponse response = restClient.post()
                .uri(uriBuilder -> uriBuilder.path("/gemini-flash-latest:generateContent")
                        .queryParam("key", apiKey).build())
                .contentType(MediaType.APPLICATION_JSON).body(requestBody).retrieve()
                .body(GeminiResponse.class);

        if (response == null || response.candidates() == null || response.candidates().isEmpty()
                || response.candidates().get(0).content() == null
                || response.candidates().get(0).content().parts() == null
                || response.candidates().get(0).content().parts().isEmpty()
                || response.candidates().get(0).content().parts().get(0).text() == null) {
            throw new BusinessException(ErrorCode.AI_RESPONSE_FAILURE);
        }

        return stripJsonMarkdown(response.candidates().get(0).content().parts().get(0).text());
    }

    private String stripJsonMarkdown(String responseText) {
        String trimmed = responseText.trim();

        if (trimmed.startsWith("```json")) {
            trimmed = trimmed.substring(7).trim();
        } else if (trimmed.startsWith("```")) {
            trimmed = trimmed.substring(3).trim();
        }

        if (trimmed.endsWith("```")) {
            trimmed = trimmed.substring(0, trimmed.length() - 3).trim();
        }

        return trimmed;
    }

    private String defaultString(String value) {
        return value == null ? "" : value;
    }
}
