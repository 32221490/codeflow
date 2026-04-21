package ac.dankook.codeflow.domain.problem.service;

import ac.dankook.codeflow.domain.problem.dto.MappedPromptResposeDto;
import ac.dankook.codeflow.domain.problem.dto.ProblemRequestDto;

public interface ProblemService {
    MappedPromptResposeDto mapToPrompt(ProblemRequestDto requestDto);
    String generateProblem(ProblemRequestDto requestDto);
}
