package ac.dankook.codeflow.domain.visualizer.test;

/**
 * 시각화 대상 샘플 코드. DockerTracker가 이 파일을 읽어 Docker 컨테이너 안에서 실행한다. Docker 전송 시 package 선언은 자동으로 제거된다.
 */
public class Sample {
    public static void main(String[] args) {
        int sum = 0;
        for (int i = 1; i <= 5; i++) {
            sum += i;
        }

        int[] arr = {10, 20, 30};
        int max = arr[0];
        for (int val : arr) {
            if (val > max) {
                max = val;
            }
        }

        System.out.println("sum=" + sum + ", max=" + max);
    }
}
