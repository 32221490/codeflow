# CodeFlow Claude Code Handoff

이 문서는 현재 CodeFlow 프론트 작업 상태를 Claude Code에게 빠르게 전달하기 위한 핸드오프 문서입니다.

## 1) 프로젝트 위치

- 루트: `/workspace/codeflow`
- 프론트엔드 앱: `/workspace/codeflow/client` (Next.js + TypeScript + Tailwind CSS)
- 기존 목업 파일: `/workspace/codeflow/codeflow-mockup.html`

## 2) 현재 완료 상태

- 랜딩 페이지 컴포넌트화 완료
  - `client/components/Navbar.tsx`
  - `client/components/Hero.tsx`
  - `client/components/VisualizerPreview.tsx`
  - `client/components/Features.tsx`
  - `client/components/HowItWorks.tsx`
  - `client/components/Cta.tsx`
  - 조립: `client/app/page.tsx`
- 디자인 토큰 및 폰트 반영
  - 색상: `blue`, `purple`, `cyan`, `bg`, `bg2` (`client/tailwind.config.ts`)
  - 폰트: Pretendard 중심, 코드 영역만 JetBrains Mono 사용
- 애니메이션/호버 인터랙션 적용
  - 히어로/섹션 reveal, 카드 hover lift, 진행 바 shimmer 등
- 학습 테스트 화면 추가
  - 경로: `/study`
  - 파일: `client/app/study/page.tsx`, `client/components/TestLab.tsx`
  - 기능: 더미 케이스 선택, 실행/일시정지, 스텝, 리셋, 속도 변경, 코드 라인 하이라이트 + Stack/Heap/Output 동기 표시
- 이전 경로 `/test`는 `/study`로 리다이렉트
  - `client/app/test/page.tsx`

## 3) 라우팅 정책

- 메인 랜딩: `/`
- 학습 테스트: `/study`
- 레거시 진입점: `/test` -> `/study` 리다이렉트
- 랜딩의 주요 CTA(`시작하기`, `무료로 시작하기`)는 모두 `/study`로 연결되어 있음

## 4) 실행 명령어

`/workspace/codeflow/client`에서 실행:

```bash
npm install
npm run dev
npm run lint
npm run build
```

## 5) Claude Code에게 바로 줄 요청 예시

아래 프롬프트를 그대로 복사해서 시작하면 된다.

```text
프로젝트는 /workspace/codeflow/client 에 있는 Next.js + TypeScript + Tailwind 앱입니다.
현재 /study 페이지에서 더미 데이터 기반 시각화 테스트 화면까지 구현되어 있습니다.

다음 작업을 진행해주세요:
1) /study 화면에 "입력값 편집 패널"을 추가해서 더미 배열/타깃값을 직접 수정 가능하게 만들기
2) 실행 결과에 성공/실패 배지를 추가하고, 조건 불충족 시 원인 메시지를 표시하기
3) 모바일(<=768px)에서 코드/메모리 패널이 세로 스택으로 자연스럽게 보이도록 반응형 보강하기

제약:
- 기존 색상/폰트/톤 유지
- 기존 파일 구조 최대한 유지
- 변경 후 npm run lint, npm run build 통과시켜 주세요
```

## 6) 참고

- 브랜드/기획 컨텍스트는 루트 `Readme.md` 참고
- 원본 UI 의도는 `codeflow-mockup.html` 참고
