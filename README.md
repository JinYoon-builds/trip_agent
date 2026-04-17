# 刘Unnie (`trip_agent`)

중국인 관광객을 위한 현지 대학생 가이드 매칭 MVP입니다. 현재 프로덕션 기준 사용자 플로우는 설문 제출 후 `WeChat Pay` 수동 결제 안내를 보여주고, 운영팀이 제출 내역과 입금 여부를 확인한 뒤 후속 연락을 진행하는 방식입니다.

이 문서는 이 레포의 공식 시작점입니다. 현재 제품 상태, 실행 방법, 환경설정, 라우트, 운영 방향은 이 문서를 기준으로 봅니다.

## 현재 MVP 범위

- 랜딩 페이지
- 다국어 설문 플로우: `ko`, `zh`, `en`
- 인증 사용자 기준 설문 제출 API
- Supabase 저장
- 완료 페이지의 수동 결제 안내
- Resend 운영 알림 메일
- 운영자 제출 목록/상세 조회 API

현재 결제 메인은 `WeChat Pay` 수동 결제입니다. PayPal 관련 코드는 레포에 남아 있지만 현재 운영 기준 플로우는 아닙니다.

## 사용자 플로우

1. 사용자가 `/`에서 서비스를 확인하고 `/survey`로 진입합니다.
2. 설문에서 여행 정보, 연락처, 가이드 필요 날짜를 입력합니다.
3. 프론트엔드가 `/api/submissions`로 제출하고 서버가 Supabase에 저장합니다.
4. 서버 설정이 되어 있으면 운영팀에 제출 알림 메일을 보냅니다.
5. 사용자는 `/survey/complete?id=...`에서 요약 정보와 `WeChat Pay` QR 결제 안내를 확인합니다.
6. 운영팀은 admin API로 제출 목록을 조회하고 수동으로 후속 처리합니다.

## 스택

- Next.js App Router
- React
- Supabase
- Resend
- Vercel

## 주요 페이지

- `/`
  - 랜딩 페이지
  - `?lang=ko|zh|en` 지원
- `/survey`
  - 다국어 설문 페이지
  - `?lang=ko|zh|en` 지원
- `/survey/complete`
  - 제출 요약 및 수동 결제 안내 페이지
  - `id` 쿼리 파라미터로 제출 조회

## 주요 API

- `POST /api/submissions`
  - 인증된 사용자만 설문 제출 가능
  - Supabase 저장 후 선택적으로 운영 알림 메일 발송
- `GET /api/submissions/[id]`
  - 제출자 본인 또는 admin만 조회 가능
- `GET /api/admin/submissions`
  - admin 전용 제출 목록 조회
- `GET /api/admin/submissions/[id]`
  - admin 전용 제출 상세 조회

참고:

- `POST /api/paypal/create-order`
- `POST /api/paypal/capture-order`

위 두 라우트는 레포에 남아 있는 레거시 PayPal 경로입니다. 현재 프로덕션 기본 플로우는 아닙니다.

## 로컬 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

`.env.example`를 `.env.local`로 복사해서 값을 채웁니다.

```bash
cp .env.example .env.local
```

필수 여부와 변수 의미는 [docs/setup.md](/Users/apple/Documents/100%20Project/trip_agent/docs/setup.md)에서 정리합니다.

### 3. 개발 서버 실행

```bash
npm run dev
```

기본 로컬 URL:

- Landing: `http://localhost:3000/?lang=ko`
- Survey: `http://localhost:3000/survey?lang=ko`

### 4. 프로덕션 빌드 확인

```bash
npm run build
npm run start
```

## 데이터베이스 설정

Supabase SQL Editor에서 [`supabase/schema.sql`](/Users/apple/Documents/100%20Project/trip_agent/supabase/schema.sql)을 실행합니다.

이 스키마는 아래를 포함합니다.

- `profiles`
- `survey_submissions`
- `updated_at` 트리거
- auth user 생성/이메일 변경 시 프로필 동기화 트리거
- customer/admin 접근 모델용 RLS 정책

자세한 내용은 [docs/data-model.md](/Users/apple/Documents/100%20Project/trip_agent/docs/data-model.md)를 봅니다.

## 환경설정 요약

### 앱/분석

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_GTM_ID`
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`

### Supabase

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 수동 결제

- `NEXT_PUBLIC_MANUAL_PAYMENT_QR_IMAGE`
  - 비어 있으면 `/manual-payment-qr.png` 사용

### Resend

- `RESEND_API_KEY`
- `EMAIL_FROM`
- `NOTIFICATION_EMAIL`

### 레거시 PayPal

- `NEXT_PUBLIC_PAYPAL_CLIENT_ID`
- `NEXT_PUBLIC_PAYPAL_CURRENCY`
- `PAYPAL_ENV`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_ORDER_DESCRIPTION`

세부 설명은 [docs/setup.md](/Users/apple/Documents/100%20Project/trip_agent/docs/setup.md)에 있습니다.

## 추가 문서

- [docs/setup.md](/Users/apple/Documents/100%20Project/trip_agent/docs/setup.md)
- [docs/architecture.md](/Users/apple/Documents/100%20Project/trip_agent/docs/architecture.md)
- [docs/api.md](/Users/apple/Documents/100%20Project/trip_agent/docs/api.md)
- [docs/data-model.md](/Users/apple/Documents/100%20Project/trip_agent/docs/data-model.md)
- [docs/payments-mvp.md](/Users/apple/Documents/100%20Project/trip_agent/docs/payments-mvp.md)

과거 인수인계 메모는 [docs/next-session.md](/Users/apple/Documents/100%20Project/trip_agent/docs/next-session.md)에 남아 있지만, 현재 상태의 공식 기준 문서는 아닙니다.

## 현재 공백 / 다음 우선순위

- 운영자가 수동 입금 확인 상태를 직접 변경하는 admin mutation API는 아직 없습니다.
- 레포에는 PayPal 코드가 남아 있지만 운영 기준은 수동 결제입니다. 방향이 확정되면 제거 또는 완전 비활성화 정리가 필요합니다.
- DB 스키마의 `survey_submissions.language` 제약은 현재 `ko`, `zh`만 허용하는데, UI와 서버 언어 정규화는 `en`도 지원합니다. 스키마와 런타임 동작을 맞추는 후속 정리가 필요합니다.
