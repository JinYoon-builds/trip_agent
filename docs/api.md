# API Reference

이 문서는 현재 구현된 서버 API를 코드 기준으로 정리합니다.  
현재 운영 기준 인터페이스는 `인증 세션 조회`, `설문 제출/조회`, `admin 조회 API`입니다.

## 인증

모든 보호 API는 아래 두 방식 중 하나로 현재 사용자를 식별합니다.

- `Authorization: Bearer <access_token>`
- Supabase auth cookie

추가 규칙:

- `POST /api/submissions`는 `로그인 + 이메일 인증 완료`가 필요합니다.
- admin API는 `로그인 + 이메일 인증 완료 + profiles.role = 'admin'`이 필요합니다.

## `GET /api/auth/session`

현재 세션 사용자와 role 정보를 조회합니다.

### 권한

- 로그인 필요

### 성공 응답

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "emailConfirmedAt": "2026-04-17T12:00:00.000Z",
    "isEmailVerified": true
  },
  "profile": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "customer"
  },
  "isEmailVerified": true
}
```

### 주요 에러

- `401`: 로그인 안 됨
- `403`: `profiles` row 없음

## `POST /api/submissions`

설문 제출을 생성합니다.

### 권한

- 로그인 사용자 필요
- 이메일 인증 완료 필요

### 요청 본문

```json
{
  "language": "ko",
  "contactEmail": "user@example.com",
  "answers": {
    "fullName": "홍길동",
    "contactEmail": "user@example.com",
    "contactEmailConfirmed": true,
    "guideDates": ["2026-04-18", "2026-04-19"]
  },
  "summary": [
    { "label": "여행 일정", "value": "2026-04-18 ~ 2026-04-20" }
  ]
}
```

### 서버 동작

- payload 유효성 검사
- `contactEmail` 확인
- `contactEmailConfirmed === true` 확인
- `answers.guideDates` 기준 견적 계산
- `survey_submissions` row 생성
- `user_id`, `applicant_name`, `submission_status`, `quoted_*` 저장
- Resend 설정이 있으면 운영 알림 메일 발송

### 성공 응답

```json
{
  "submission": {
    "id": "uuid",
    "userId": "uuid",
    "language": "ko",
    "contactEmail": "user@example.com",
    "applicantName": "홍길동",
    "answers": {},
    "summary": [],
    "submissionStatus": "awaiting_transfer",
    "guideDayCount": 2,
    "quotedAmount": "1080",
    "quotedCurrency": "CNY",
    "quotedDisplayLabel": "CNY 1,080",
    "emailSentAt": null,
    "emailSendError": null,
    "submittedAt": "2026-04-17T12:00:00.000Z",
    "updatedAt": "2026-04-17T12:00:00.000Z"
  },
  "emailSent": true,
  "emailSendError": null
}
```

### 주요 에러

- `401`: 로그인 안 됨
- `403`: 이메일 인증 안 됨
- `400`: answers 형식 오류
- `400`: 유효한 이메일 없음
- `400`: 이메일 확인 체크 누락
- `400`: summary 누락
- `500`: Supabase 또는 메일 연동 문제

## `GET /api/submissions/[id]`

개별 제출을 조회합니다.

### 권한

- 제출자 본인 또는 admin

### 성공 응답

```json
{
  "submission": {
    "id": "uuid",
    "userId": "uuid",
    "language": "ko",
    "contactEmail": "user@example.com",
    "applicantName": "홍길동",
    "answers": {},
    "summary": [],
    "submissionStatus": "awaiting_transfer",
    "guideDayCount": 2,
    "quotedAmount": "1080",
    "quotedCurrency": "CNY",
    "quotedDisplayLabel": "CNY 1,080",
    "emailSentAt": null,
    "emailSendError": null,
    "submittedAt": "2026-04-17T12:00:00.000Z",
    "updatedAt": "2026-04-17T12:00:00.000Z"
  }
}
```

### 주요 에러

- `401`: 로그인 안 됨
- `404`: 제출 없음 또는 접근 권한 없음

## `GET /api/admin/submissions`

운영자가 제출 목록을 조회합니다.

### 권한

- admin 필요
- 이메일 인증 완료 필요

### 쿼리 파라미터

- `limit`
  - 기본값: `100`
  - 최대값: `200`
- `offset`
  - 기본값: `0`

### 성공 응답

```json
{
  "submissions": [],
  "limit": 100,
  "offset": 0
}
```

### 주요 에러

- `401`: 로그인 안 됨
- `403`: admin 아님 또는 이메일 인증 안 됨
- `400`: `limit > 200`

## `GET /api/admin/submissions/[id]`

운영자가 개별 제출 상세를 조회합니다.

### 권한

- admin 필요
- 이메일 인증 완료 필요

### 성공 응답

```json
{
  "submission": {
    "id": "uuid"
  }
}
```

### 주요 에러

- `401`: 로그인 안 됨
- `403`: admin 아님 또는 이메일 인증 안 됨
- `404`: 제출 없음

## 미구현 API

현재 아래 admin mutation API는 구현되어 있지 않습니다.

- `PATCH /api/admin/submissions/[id]`

즉, 운영자가 수동 입금 확인 상태를 서버에서 변경하는 공식 API는 아직 없습니다.
