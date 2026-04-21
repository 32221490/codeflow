package ac.dankook.codeflow.domain.problem.service;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import ac.dankook.codeflow.domain.problem.dto.MappedPromptResposeDto;
import ac.dankook.codeflow.domain.problem.dto.ProblemRequestDto;

@Service
public class ProblemServiceImpl implements ProblemService {
    private final RestClient restClient;

    @Value("&{AIzaSyBTKGKBYroPXdVBqRO-829y_R3BXT9dV9k}")        // gemini api key
    private String apiKey;

    public ProblemServiceImpl(RestClient.Builder restClientBuilder) {
        this.restClient = restClientBuilder.baseUrl("https://generativelanguage.googleapis.com/v1beta/models").build();
    }

    //              generateProblem 이후 텍스트 추출
    private String extractText(Map response) {
        if (response != null && response.containsKey("candidates")) {
            List<Map> candidates = (List<Map>) response.get("candidates");
            if (!candidates.isEmpty()) {
                Map content = (Map) candidates.get(0).get("content");
                List<Map> parts = (List<Map>) content.get("parts");

                return (String) parts.get(0).get("text");
            }
        }

        return "RESPONSE FAILURE";
    }
    
    @Override       // 프롬프트화
    public MappedPromptResposeDto mapToPrompt(ProblemRequestDto requestDto) {
        String systemInstruction = "You are a professional coding tutor. Provide structed coding problems.";

        String userPrompt;
        if ("언어 개념".equals(requestDto.studyType())) {
            userPrompt = String.format(
                "언어 %s, 주제: %s, 난이도: %s, 추가 조건: %s\n" +
                "위 조건으로 문법 학습용 문제를 생성하고 해설 포인트를 포함해줘.",
                requestDto.language(), requestDto.topic(), requestDto.difficulty(), requestDto.detail()
            );
        }
        else {
            userPrompt = String.format(
                "언어: %s, 주제: %s, 난이도: %s, 추가 조건: %s\n" +
                "위 조건으로 알고리즘 문제와 정답 코드를 생성해줘.", 
                requestDto.language(), requestDto.topic(), requestDto.difficulty(), requestDto.detail()
            );
        }

        return new MappedPromptResposeDto(systemInstruction, userPrompt);
    }

    @Override       // 실제 문제 생성
    public String generateProblem(ProblemRequestDto requestDto) {
        MappedPromptResposeDto mapped = mapToPrompt(requestDto);

        Map<String, Object> requestBody = Map.of(
            "contents", List.of(
                Map.of("parts", List.of(Map.of("text", mapped.userPrompt())))
            ),
            "system_instruction", Map.of(
                "parts", List.of(Map.of("text", mapped.systemInstruction()))
            )
        );

        var response = restClient.post()
                                 .uri(uriBuilder -> uriBuilder.path("/gemini-1.5-flash:generateContent")
                                                              .queryParam("key", apiKey)
                                                              .build())
                                 .contentType(MediaType.APPLICATION_JSON)
                                 .body(requestBody)
                                 .retrieve()
                                 .body(Map.class);
                                 
        return extractText(response);
    }
}
