# API Reference

이 문서는 현재 구현된 주요 API를 정리합니다. 현재 운영 기준의 공개 인터페이스는 제출 생성/조회와 admin 조회 API입니다.

## 인증

모든 주요 API는 인증된 사용자를 전제로 합니다.

- 지원 방식:
  - `Authorization: Bearer <token>`
  - Supabase auth cookie
- admin API는 추가로 `profiles.role = 'admin'`이 필요합니다.

## `POST /api/submissions`

설문 제출을 생성합니다.

### 권한

- 인증 사용자 필요

### 요청 본문

```json
{
  "language": "ko",
  "contactEmail": "user@example.com",
  "answers": {
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
- `guideDates` 기준 가격 계산
- `survey_submissions` row 생성
- Resend 설정이 있으면 운영 알림 메일 발송

### 성공 응답

```json
{
  "submission": {
    "id": "uuid",
    "language": "ko",
    "contactEmail": "user@example.com",
    "paymentStatus": "awaiting_manual_payment",
    "paymentAmount": "1080",
    "paymentCurrency": "CNY",
    "paymentDisplayLabel": "CNY 1,080",
    "submittedAt": "2026-04-17T12:00:00.000Z"
  },
  "emailSent": true,
  "emailSendError": null
}
```

### 주요 에러

- `401`: 인증 없음
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
    "answers": {},
    "summary": [],
    "paymentStatus": "awaiting_manual_payment",
    "paymentAmount": "1080",
    "paymentCurrency": "CNY",
    "paymentDisplayLabel": "CNY 1,080",
    "paypalOrderId": null,
    "paypalCaptureId": null,
    "emailSentAt": null,
    "emailSendError": null,
    "submittedAt": "2026-04-17T12:00:00.000Z",
    "updatedAt": "2026-04-17T12:00:00.000Z"
  }
}
```

### 주요 에러

- `401`: 인증 없음
- `404`: 제출 없음 또는 접근 권한 없음

## `GET /api/admin/submissions`

운영자가 제출 목록을 조회합니다.

### 권한

- admin 필요

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

- `401`: 인증 없음
- `403`: admin 아님
- `400`: `limit > 200`

## `GET /api/admin/submissions/[id]`

운영자가 개별 제출 상세를 조회합니다.

### 권한

- admin 필요

### 성공 응답

```json
{
  "submission": {
    "id": "uuid"
  }
}
```

### 주요 에러

- `401`: 인증 없음
- `403`: admin 아님
- `404`: 제출 없음

## 미구현 API

현재 아래 admin mutation API는 구현되어 있지 않습니다.

- `PATCH /api/admin/submissions/[id]`

즉, 운영자가 수동 입금 확인 상태를 서버에서 변경하는 공식 API는 아직 없습니다.

## 레거시 PayPal API

현재 프로덕션 기본 플로우는 아니지만 아래 라우트는 레포에 남아 있습니다.

- `POST /api/paypal/create-order`
  - 제출 기반으로 PayPal 주문 생성
  - `payment_status`를 `payment_created`로 변경 가능
- `POST /api/paypal/capture-order`
  - PayPal 결제 캡처
  - 상태를 `paid` 또는 `payment_pending`으로 변경 가능

이 경로들은 현재 완료 페이지 기본 UX에서 사용되지 않습니다.
