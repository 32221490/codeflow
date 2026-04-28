package ac.dankook.codeflow.domain.problem.service;

import org.springframework.stereotype.Service;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import ac.dankook.codeflow.domain.problem.dto.ProblemRequestDto;
import ac.dankook.codeflow.global.exception.BusinessException;
import ac.dankook.codeflow.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProblemServiceImpl implements ProblemService {
    private final GeminiService geminiService;
    private final ObjectMapper objectMapper;

    @Override
    public String generateProblem(ProblemRequestDto requestDto) {
        try {
            return objectMapper.writeValueAsString(
                    geminiService.generateProblem(requestDto.topic(), requestDto.difficulty()));
        } catch (JsonProcessingException e) {
            throw new BusinessException(ErrorCode.AI_RESPONSE_FAILURE);
        }
    }

    



}
