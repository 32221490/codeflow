package ac.dankook.codeflow.domain.problem.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ac.dankook.codeflow.domain.problem.dto.ProblemRequestDto;
import ac.dankook.codeflow.domain.problem.service.ProblemService;
import lombok.RequiredArgsConstructor;


@RestController
@RequestMapping("/api/v1/problems")
@RequiredArgsConstructor
public class ProblemController {
    private final ProblemService problemService;

    @PostMapping("/generate")
    public String generate(@RequestBody ProblemRequestDto requestDto) {
        return problemService.generateProblem(requestDto);
    }

}
