package ac.dankook.codeflow.domain.problem.dto;

public record MappedPromptResposeDto(
    String systemInstruction,
    String userPrompt
) {}
