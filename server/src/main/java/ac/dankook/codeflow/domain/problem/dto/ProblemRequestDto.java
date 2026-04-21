package ac.dankook.codeflow.domain.problem.dto;

public record ProblemRequestDto(
    String language,
    String studyType,
    String topic,
    String difficulty,
    String detail
) {}
