package ac.dankook.codeflow.domain.problem.service;

import ac.dankook.codeflow.domain.problem.dto.ProblemRequestDto;

public interface ProblemService {
    String generateProblem(ProblemRequestDto requestDto);
}
