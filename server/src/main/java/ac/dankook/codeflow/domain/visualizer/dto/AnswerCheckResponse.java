package ac.dankook.codeflow.domain.visualizer.dto;

import lombok.Getter;

@Getter
public class AnswerCheckResponse {

    private String programOutput;

    public AnswerCheckResponse(String programOutput) {
        this.programOutput = programOutput;
    }
}
