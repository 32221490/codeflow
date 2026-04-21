package ac.dankook.codeflow.domain.problem.service;

import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import ac.dankook.codeflow.domain.problem.dto.GeminiResponse;
import ac.dankook.codeflow.domain.problem.dto.MappedPromptResposeDto;
import ac.dankook.codeflow.domain.problem.dto.ProblemRequestDto;
import ac.dankook.codeflow.global.exception.BusinessException;
import ac.dankook.codeflow.global.exception.ErrorCode;

@Service
public class ProblemServiceImpl implements ProblemService {
    private final RestClient restClient;

    @Value("${GOOGLE_GEMINI_API_KEY}")
    private String apiKey;

    public ProblemServiceImpl(RestClient.Builder restClientBuilder) {
        this.restClient = restClientBuilder
                .baseUrl("https://generativelanguage.googleapis.com/v1beta/models").build();
    }

    private MappedPromptResposeDto mapToPrompt(ProblemRequestDto requestDto) {
        String systemInstruction =
                "You are a professional coding tutor. Provide structured coding problems.";

        String userPrompt;
        if ("언어 개념".equals(requestDto.studyType())) {
            userPrompt = String.format(
                    "언어: %s, 주제: %s, 난이도: %s, 추가 조건: %s\n위 조건으로 문법 학습용 문제를 생성하고 해설 포인트를 포함해줘.",
                    requestDto.language(), requestDto.topic(), requestDto.difficulty(),
                    requestDto.detail());
        } else {
            userPrompt = String.format(
                    "언어: %s, 주제: %s, 난이도: %s, 추가 조건: %s\n위 조건으로 알고리즘 문제와 정답 코드를 생성해줘.",
                    requestDto.language(), requestDto.topic(), requestDto.difficulty(),
                    requestDto.detail());
        }

        return new MappedPromptResposeDto(systemInstruction, userPrompt);
    }

    @Override
    public String generateProblem(ProblemRequestDto requestDto) {
        MappedPromptResposeDto mapped = mapToPrompt(requestDto);

        Map<String, Object> requestBody = Map.of("contents",
                List.of(Map.of("parts", List.of(Map.of("text", mapped.userPrompt())))),
                "system_instruction",
                Map.of("parts", List.of(Map.of("text", mapped.systemInstruction()))));

        GeminiResponse response = restClient.post()
                .uri(uriBuilder -> uriBuilder.path("/gemini-flash-latest:generateContent")
                        .queryParam("key", apiKey).build())
                .contentType(MediaType.APPLICATION_JSON).body(requestBody).retrieve()
                .body(GeminiResponse.class);

        if (response == null || response.candidates() == null || response.candidates().isEmpty()) {
            throw new BusinessException(ErrorCode.AI_RESPONSE_FAILURE);
        }

        return response.candidates().get(0).content().parts().get(0).text();
    }
}
