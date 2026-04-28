package ac.dankook.codeflow.domain.problem.dto;

public record ProblemResponseDto(
        String title,
        String description,
        String inputExample,
        String outputExample,
        String hint,
        String answer) {
}
