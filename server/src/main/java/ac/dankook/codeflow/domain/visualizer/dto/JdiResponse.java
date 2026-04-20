package ac.dankook.codeflow.domain.visualizer.dto;

import lombok.Getter;

@Getter
public class JdiResponse {

    private String traceJson;

    public JdiResponse(String traceJson) {
        this.traceJson = traceJson;
    }
}
