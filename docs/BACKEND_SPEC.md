# CodeFlow 백엔드 기능 명세

## 팀 구성

| 이름 | 담당 도메인 |
|---|---|
| A | 회원 / Security (Spring Security, JWT, OAuth2) |
| B | Execution Engine (Docker, JDI, SSE) |
| C | Problem / AI (문제 DB, AI 생성, 추천) |

---

## 공통 계약

### SnapshotEvent (B ↔ A 프론트 연결 기준)

```json
{
  "line": 5,
  "stack": [
    { "name": "i", "type": "int", "value": "3" },
    { "name": "sum", "type": "int", "value": "6" }
  ],
  "heap": [],
  "output": "6",
  "status": "active",
  "errorLine": null,
  "errorMsg": null
}
```

### 공통 응답 포맷

```json
{
  "success": true,
  "data": {},
  "message": "ok"
}
```

### 인증 방식

모든 보호된 API는 Authorization 헤더에 JWT 토큰 필요

```
Authorization: Bearer {token}
```

---

## 1. 회원 / Security 도메인

### 개요

Spring Security + JWT 기반 인증. 로그인 방식 2가지를 지원한다.

| 방식 | 설명 |
|---|---|
| 이메일 로그인 | 회원가입 → 이메일 인증 → 로그인 → JWT 발급 |
| GitHub OAuth2 | GitHub App 연동 → 콜백 처리 → JWT 발급 |

---

### Member 엔티티

| 필드 | 타입 | 설명 |
|---|---|---|
| id | Long | PK |
| email | String | 이메일 (unique) |
| password | String | 비밀번호 (이메일 로그인만 사용, BCrypt 암호화) |
| nickname | String | 닉네임 |
| provider | String | `local` / `github` |
| providerId | String | GitHub 유저 ID (GitHub 로그인만 사용) |
| emailVerified | Boolean | 이메일 인증 여부 |
| role | Enum | `USER` / `ADMIN` |
| createdAt | LocalDateTime | 가입일 |

---

### API 명세

#### 이메일 회원가입

```
POST /api/auth/signup
```

Request Body

```json
{
  "email": "user@example.com",
  "password": "password1234",
  "nickname": "홍길동"
}
```

Response

```json
{
  "success": true,
  "message": "인증 메일을 발송했습니다."
}
```

처리 흐름

```
회원가입 요청
  → 이메일 중복 확인
  → 비밀번호 BCrypt 암호화
  → Member 저장 (emailVerified = false)
  → 인증 토큰 생성 (UUID)
  → 인증 링크 이메일 발송
```

---

#### 이메일 인증

```
GET /api/auth/verify?token={token}
```

처리 흐름

```
토큰 유효성 확인
  → emailVerified = true 업데이트
  → 인증 완료 응답
```

---

#### 이메일 로그인

```
POST /api/auth/login
```

Request Body

```json
{
  "email": "user@example.com",
  "password": "password1234"
}
```

Response

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci..."
  }
}
```

---

#### GitHub OAuth2 로그인

```
GET /oauth2/authorization/github
```

처리 흐름

```
GitHub 로그인 페이지로 리다이렉트
  → GitHub 인증 완료
  → 콜백: GET /login/oauth2/code/github
  → GitHub 유저 정보 조회 (email, id, name)
  → 신규 유저면 자동 가입 (provider = github)
  → JWT 발급
  → 프론트로 리다이렉트 (토큰 포함)
```

---

#### 토큰 재발급

```
POST /api/auth/refresh
```

Request Body

```json
{
  "refreshToken": "eyJhbGci..."
}
```

---

#### 내 정보 조회

```
GET /api/members/me
Authorization: Bearer {token}
```

Response

```json
{
  "id": 1,
  "email": "user@example.com",
  "nickname": "홍길동",
  "provider": "local",
  "emailVerified": true
}
```

---

### 기술 스택

| 항목 | 내용 |
|---|---|
| 인증 | Spring Security + JWT |
| OAuth2 | Spring Security OAuth2 Client |
| 이메일 발송 | Spring Boot Mail (Gmail SMTP or Mailgun) |
| 비밀번호 암호화 | BCryptPasswordEncoder |
| 토큰 저장 | Redis (RefreshToken 블랙리스트 관리) |

---

## 2. Execution Engine 도메인

### 개요

사용자가 제출한 코드를 Docker 컨테이너에서 안전하게 실행하고, JDI를 통해 라인별 실행 상태를 추출해 SSE로 프론트에 스트리밍한다.

---

### 실행 흐름

```
코드 제출 (POST /api/execute)
  → 임시 파일 생성
  → Docker 컨테이너 실행 (컴파일 + JDI 디버그 모드)
  → JDI 연결
  → 라인별 BreakpointEvent 캡처
  → SnapshotEvent 생성 (현재 라인, 변수, 스택, 출력)
  → SSE로 프론트에 스트리밍
  → 실행 완료 or 에러 이벤트 전송
```

---

### API 명세

#### 코드 제출

```
POST /api/execute
Authorization: Bearer {token}
```

Request Body

```json
{
  "code": "public class Main { ... }",
  "language": "java"
}
```

Response

```json
{
  "sessionId": "exec-uuid-1234"
}
```

---

#### 실행 스트리밍

```
GET /api/execute/{sessionId}/stream
Content-Type: text/event-stream
```

Response (SSE)

```
data: {"line":3,"stack":[{"name":"i","type":"int","value":"0"}],"heap":[],"output":null,"status":"active"}

data: {"line":5,"stack":[{"name":"i","type":"int","value":"1"}],"heap":[],"output":null,"status":"active"}

data: {"line":10,"stack":[],"heap":[],"output":"55","status":"done"}
```

---

### SnapshotEvent 구조

| 필드 | 타입 | 설명 |
|---|---|---|
| line | int | 현재 실행 중인 라인 번호 |
| stack | StackVar[] | 로컬 변수 목록 |
| heap | HeapItem[] | 힙 객체 목록 |
| output | String | 현재까지의 출력값 |
| status | Enum | `active` / `done` / `error` |
| errorLine | Integer | 에러 발생 라인 (에러 시) |
| errorMsg | String | 에러 메시지 (에러 시) |

---

### 샌드박스 제한

| 항목 | 제한 |
|---|---|
| 실행 시간 | 최대 10초 |
| 메모리 | 최대 256MB |
| 네트워크 | 차단 |
| 파일 시스템 | 읽기 전용 |

---

### 지원 언어 (단계별)

| 단계 | 언어 | 방식 |
|---|---|---|
| 1단계 | Java | JDI (Java Debug Interface) |
| 2단계 | Python | sys.settrace |
| 추후 검토 | C | - |

---

## 3. Problem / AI 도메인

### 개요

검증된 기본 문제를 DB에서 제공하고, AI가 다음 단계 문제를 생성/검증/추천한다.

---

### 데이터 모델

#### Problem

| 필드 | 타입 | 설명 |
|---|---|---|
| id | Long | PK |
| title | String | 문제 제목 |
| description | String | 문제 설명 |
| topic | Enum | `ARRAY` / `TWO_POINTER` / `RECURSION` / `DP` |
| difficulty | Enum | `BEGINNER` / `BASIC` / `ADVANCED` |
| language | Enum | `JAVA` / `PYTHON` |
| starterCode | String | 작성 시작 코드 |
| solutionCode | String | 정답 코드 |
| source | Enum | `DB` / `AI` |
| createdAt | LocalDateTime | 생성일 |

#### TestCase

| 필드 | 타입 | 설명 |
|---|---|---|
| id | Long | PK |
| problemId | Long | FK |
| input | String | 입력값 |
| expectedOutput | String | 기대 출력값 |
| isExample | Boolean | 예제 노출 여부 |

---

### API 명세

#### 문제 목록 조회

```
GET /api/problems?topic=ARRAY&difficulty=BEGINNER&language=JAVA
```

Response

```json
{
  "data": [
    {
      "id": 1,
      "title": "배열 최댓값 찾기",
      "topic": "ARRAY",
      "difficulty": "BEGINNER",
      "language": "JAVA"
    }
  ]
}
```

---

#### 문제 상세 조회

```
GET /api/problems/{id}
```

Response

```json
{
  "data": {
    "id": 1,
    "title": "배열 최댓값 찾기",
    "description": "정수 배열이 주어졌을 때 최댓값을 반환하시오.",
    "starterCode": "public class Main {\n  public static void main...",
    "testCases": [
      { "input": "[3, 1, 4, 1, 5]", "expectedOutput": "5", "isExample": true }
    ]
  }
}
```

---

#### AI 문제 생성

```
POST /api/problems/generate
Authorization: Bearer {token}
```

Request Body

```json
{
  "topic": "TWO_POINTER",
  "difficulty": "BASIC",
  "language": "JAVA",
  "baseProblemId": 3
}
```

처리 흐름

```
AI에 문제 생성 요청
  → 문제 설명 + 테스트케이스 생성
  → 자동 검증 (중복, 일관성, 예제 정확성)
  → 검증 통과 → DB 저장 후 반환
  → 검증 실패 → 재생성 (최대 3회)
  → 재생성 실패 → DB fallback 문제 반환
```

---

#### 다음 문제 추천

```
GET /api/problems/{id}/next
Authorization: Bearer {token}
```

Response

```json
{
  "data": {
    "id": 7,
    "title": "두 수의 합 (투 포인터)",
    "reason": "배열 최댓값을 학습했으니 포인터 이동 개념으로 확장합니다."
  }
}
```

---

#### AI 실행 설명

```
POST /api/problems/{id}/explain
Authorization: Bearer {token}
```

Request Body

```json
{
  "snapshot": {
    "line": 5,
    "stack": [{"name": "left", "type": "int", "value": "2"}],
    "output": null,
    "status": "active"
  }
}
```

Response

```json
{
  "data": {
    "explanation": "현재 left 포인터가 2로 이동했습니다. 조건 arr[left] < target을 만족하기 때문에..."
  }
}
```

---

### AI 검증 기준 (Safety Layer)

| 항목 | 기준 |
|---|---|
| 중복 여부 | 기존 문제와 80% 이상 유사하면 재생성 |
| 내부 일관성 | 문제 설명과 제약이 모순되지 않는가 |
| 예제 정확성 | 정답 코드로 실행 시 테스트케이스 통과 여부 |
| 모호성 | 정답이 여러 개일 경우 명시 여부 |

---

## 전체 API 목록 요약

### 회원 / Security

| Method | Endpoint | 설명 | 인증 |
|---|---|---|---|
| POST | /api/auth/signup | 이메일 회원가입 | - |
| GET | /api/auth/verify | 이메일 인증 | - |
| POST | /api/auth/login | 이메일 로그인 | - |
| POST | /api/auth/refresh | 토큰 재발급 | - |
| GET | /oauth2/authorization/github | GitHub 로그인 | - |
| GET | /api/members/me | 내 정보 조회 | 필요 |

### Execution Engine

| Method | Endpoint | 설명 | 인증 |
|---|---|---|---|
| POST | /api/execute | 코드 제출 | 필요 |
| GET | /api/execute/{sessionId}/stream | 실행 SSE 스트리밍 | 필요 |

### Problem / AI

| Method | Endpoint | 설명 | 인증 |
|---|---|---|---|
| GET | /api/problems | 문제 목록 조회 | - |
| GET | /api/problems/{id} | 문제 상세 조회 | - |
| POST | /api/problems/generate | AI 문제 생성 | 필요 |
| GET | /api/problems/{id}/next | 다음 문제 추천 | 필요 |
| POST | /api/problems/{id}/explain | AI 실행 설명 | 필요 |

---

## 개발 환경

```
Java 17
Spring Boot 3.x
Spring Security 6.x
JPA + MySQL
Redis (RefreshToken)
Docker
```
