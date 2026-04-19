# API Reference

이 문서는 현재 구현된 서버 API를 코드 기준으로 정리합니다.  
현재 운영 기준 인터페이스는 `인증 세션 조회`, `설문 제출/조회/수정`, `PayPal 주문/캡처 API`, `admin 조회/상태 변경 API`입니다.

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
- `answers.guideDates` + `language` 기준 견적 계산
- `survey_submissions` row 생성
- `user_id`, `applicant_name`, `submission_status`, `payment_method`, `quoted_*` 저장

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
    "paymentMethod": "paypal",
    "guideDayCount": 2,
    "quotedAmount": "90.00",
    "quotedCurrency": "USD",
    "quotedDisplayLabel": "USD 90",
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

## `GET /api/submissions`

현재 로그인한 사용자의 제출 목록을 조회합니다.

### 권한

- 로그인 사용자 필요

### 쿼리 파라미터

- `limit`
  - 기본값: `100`
  - 최대값: `200`
- `offset`
  - 기본값: `0`

### 성공 응답

```json
{
  "submissions": [
    {
      "id": "uuid",
      "submissionStatus": "awaiting_transfer",
      "isEditable": true
    }
  ],
  "limit": 100,
  "offset": 0
}
```

### 주요 에러

- `401`: 로그인 안 됨
- `403`: `profiles` row 없음

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
    "paymentMethod": "paypal",
    "guideDayCount": 2,
    "quotedAmount": "90.00",
    "quotedCurrency": "USD",
    "quotedDisplayLabel": "USD 90",
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

## `PATCH /api/submissions/[id]`

제출자 본인이 자신의 제출을 수정합니다.

### 권한

- 제출자 본인만 가능
- 현재는 `awaiting_transfer` 상태만 수정 가능

### 요청 본문

- `POST /api/submissions`와 동일한 전체 설문 payload

### 서버 동작

- owner 권한 확인
- 현재 제출 상태가 수정 가능한 상태인지 검사
- payload 재검증
- `answers.guideDates` + `language` 기준 견적 재계산
- 기존 row 업데이트

### 주요 에러

- `401`: 로그인 안 됨
- `403`: owner 아님 또는 admin 경로 오용
- `404`: 제출 없음 또는 접근 권한 없음
- `409`: 현재 상태에서는 수정 불가
- `400`: payload 형식 오류

## `POST /api/submissions/[id]/paypal/order`

PayPal 주문을 생성합니다. `ko / en` 제출만 허용합니다.

### 권한

- 제출자 본인 또는 admin

### 서버 동작

- 제출 접근 권한 검사
- `payment_method = paypal`인지 확인
- 서버에서 USD 견적 재계산
- PayPal Orders API로 `intent=CAPTURE` 주문 생성
- `payment_provider_order_id` 저장

### 성공 응답

```json
{
  "orderId": "5O190127TN364715T",
  "submission": {
    "id": "uuid",
    "paymentMethod": "paypal"
  }
}
```

## `POST /api/submissions/[id]/paypal/capture`

PayPal 주문을 캡처하고 제출을 `paid`로 전환합니다.

### 권한

- 제출자 본인 또는 admin

### 요청 본문

```json
{
  "orderId": "5O190127TN364715T"
}
```

### 서버 동작

- 제출 접근 권한 검사
- 주문 ID 매칭 확인
- PayPal Orders API로 캡처 수행
- 성공 시 `submission_status = paid`
- `payment_provider_capture_id`, `paid_at` 저장
- 고객 + 운영팀 결제 완료 메일 발송 시도

### 성공 응답

```json
{
  "submission": {
    "id": "uuid",
    "submissionStatus": "paid",
    "paymentMethod": "paypal",
    "paymentProviderCaptureId": "3C679366HH908993F"
  },
  "paymentCompletedEmailSent": true,
  "paymentCompletedEmailError": null
}
```

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

## `PATCH /api/admin/submissions/[id]`

운영자가 제출 상태를 변경합니다.

### 권한

- admin 필요
- 이메일 인증 완료 필요

### 요청 본문

```json
{
  "submissionStatus": "paid"
}
```

허용 상태값:

- `payment_review`
- `paid`
- `matched`
- `cancelled`

현재 서버는 아래 전이만 허용합니다.

- `awaiting_transfer` -> `payment_review`, `paid`, `cancelled`
- `payment_review` -> `paid`, `cancelled`
- `paid` -> `matched`, `cancelled`

### 성공 응답

```json
{
  "submission": {
    "id": "uuid",
    "submissionStatus": "paid"
  }
}
```

### 주요 에러

- `401`: 로그인 안 됨
- `403`: admin 아님 또는 이메일 인증 안 됨
- `404`: 제출 없음
- `400`: 허용되지 않은 상태값
