# 🌿 Contributing Guide

> Codehive 팀원들을 위한 Git 규칙 및 협업 가이드

---

## 📌 브랜치 규칙

### 브랜치 구조

```
main
  ├── dongwoo
  ├── gyeonghyeon
  └── minhyeok
```

| 브랜치     | 설명                            |
| ---------- | ------------------------------- |
| `main`     | 최종 배포 브랜치 — 직접 push ❌ |
| `본인이름` | 개인 작업 브랜치                |

### 규칙

```
# 1. main 브랜치로 이동
git checkout main

# 2. main 최신 내용 가져오기
git pull origin main

# 3. 내 브랜치로 이동
git checkout 본인이름

# 4. main 내용을 내 브랜치에 합치기
git merge main
```

---

### 타입 종류

| 타입       | 설명             | 예시                                |
| ---------- | ---------------- | ----------------------------------- |
| `feat`     | 새로운 기능 추가 | `feat: 로그인 API 구현`             |
| `fix`      | 버그 수정        | `fix: 토큰 만료 오류 수정`          |
| `refactor` | 코드 리팩토링    | `refactor: ReviewService 코드 정리` |
| `docs`     | 문서 수정        | `docs: README 업데이트`             |
| `style`    | 코드 포맷 변경   | `style: 들여쓰기 정리`              |
| `chore`    | 설정 파일 변경   | `chore: .gitignore 추가`            |

### 예시

```bash
git commit -m "feat: 게시글 작성 API 구현"
git commit -m "fix: 댓글 삭제 권한 오류 수정"
git commit -m "docs: API 명세 추가"
```

---

## 🔀 PR (Pull Request) 방법

### PR 올리는 순서

```
1. 본인 브랜치에서 작업 완료
2. GitHub에서 PR 생성
3. 리뷰 후 Approve → Merge
```

### PR 제목 형식

```
[타입] 작업 내용
```

```
예시)
[feat] 로그인 API 구현
[fix] 게시글 조회 오류 수정
```

### PR 올리기 전 체크리스트

```
✅ 본인 브랜치에서 작업했는가
✅ develop 최신 내용을 merge 했는가
✅ 빌드 오류가 없는가
✅ API 키 등 민감한 정보가 포함되지 않았는가
```

---

## ⚠️ 주의사항

- `application.properties` 또는 `application-prod.properties`는 **절대 GitHub에 올리지 말 것**
- API 키, DB 비밀번호 등 민감한 정보는 `.gitignore`에 추가
- 충돌(conflict) 발생 시 회의방에 알리기

---

<div align="center">
  <sub>🐝 Codehive Team</sub>
</div>
