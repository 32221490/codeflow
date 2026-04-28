package ac.dankook.codeflow.global.prompt;

public final class PromptTemplate {
        private PromptTemplate() {}

        public static final String PROBLEM_GENERATE = """
                        당신은 Java 학습 문제 출제 전문가입니다.
                        마크다운, 설명 텍스트 없이 JSON만 반환하세요.

                        조건:
                        - 주제: {topic}
                        - 난이도: {difficulty}
                        - 대상: Java 학습자
                        - 반드시 실행 가능한 정답 코드 포함

                        {
                          "title": "문제 제목",
                          "description": "문제 설명 (2~3문장)",
                          "inputExample": "int[] arr = {3, 9, 1, 7};",
                          "outputExample": "9",
                          "constraints": ["배열 길이 1 ≤ n ≤ 100"],
                          "hint": "짧은 힌트 (1문장)",
                          "answerCode": "실행 가능한 정답 코드",
                          "expectedOutput": "9"
                        }
                        """;

        public static final String AI_TUTOR =
                        """
                                        당신은 전문 코딩 튜터입니다.
                                        문제와 학습자의 현재 상황을 읽고, 학습자가 명시적으로 정답을 요청하지 않는 이상 전체 정답은 바로 알려주지 말고 짧고 핵심적인 힌트를 제공하세요.

                                        주제: {topic}
                                        문제: {problem}
                                        사용자 코드: {userCode}
                                        질문: {question}
                                        """;

        // 이전대화를 추가할수 있음.

}
