package ac.dankook.codeflow.domain.visualizer.dto;

import lombok.Getter;

@Getter
public class TraceResponse {

    private final AnswerCheckResponse answerCheck;
    private final JdiResponse jdi;

    public TraceResponse(AnswerCheckResponse answerCheck, JdiResponse jdi) {
        this.answerCheck = answerCheck;
        this.jdi = jdi;
    }
}
