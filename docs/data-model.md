# Data Model

## 개요

이 앱은 Supabase의 `auth.users`와 연동되는 `profiles`, 실제 설문 데이터가 저장되는 `survey_submissions` 두 테이블을 중심으로 동작합니다.

스키마 원본은 [`supabase/schema.sql`](/Users/apple/Documents/100%20Project/trip_agent/supabase/schema.sql)입니다.

## `profiles`

인증 사용자별 역할 정보를 저장합니다.

### 컬럼

- `id`
  - `auth.users.id`를 참조하는 PK
- `email`
  - 사용자 이메일
- `role`
  - 기본값 `customer`
  - 허용값: `customer`, `admin`
- `created_at`
- `updated_at`

### 목적

- 일반 사용자와 운영자 권한 구분
- admin API 접근 제어

### 동기화 방식

- auth user 생성 시 profile 자동 생성
- auth user 이메일 변경 시 profile 이메일 동기화

## `survey_submissions`

설문 응답과 결제 상태를 저장합니다.

### 핵심 컬럼

- `id`
  - UUID PK
- `user_id`
  - 제출자 사용자 ID
- `language`
  - 스키마 제약상 `ko`, `zh`
- `contact_email`
  - 주요 연락 이메일
- `answers`
  - 원본 설문 답변 JSON
- `summary`
  - 완료 페이지 및 메일용 요약 배열 JSON
- `payment_status`
  - 결제/후속 처리 상태
- `payment_amount`
  - 계산된 금액
- `payment_currency`
  - 현재 가격 계산 통화
- `payment_display_label`
  - UI 노출용 문자열
- `paypal_order_id`
  - 레거시 PayPal 주문 ID
- `paypal_capture_id`
  - 레거시 PayPal 캡처 ID
- `email_sent_at`
  - 결제 완료 메일 등 후속 메일 발송 시간 기록용
- `email_send_error`
  - 메일 발송 실패 메시지
- `created_at`
- `updated_at`

## `payment_status` 의미

현재 스키마에는 enum 제약이 없고 문자열로 저장됩니다. 코드상 확인되는 주요 값은 아래와 같습니다.

- `awaiting_manual_payment`
  - 설문 저장 직후 기본값
  - 현재 운영 기준 기본 상태
- `payment_created`
  - 레거시 PayPal 주문 생성 후 상태
- `payment_pending`
  - PayPal 캡처 응답이 완료 상태가 아닐 때
- `paid`
  - PayPal 캡처 완료 상태

현재 운영 기준은 수동 결제이므로 `awaiting_manual_payment`가 가장 중요한 상태입니다.

## 가격 관련 필드 의미

### `payment_amount`

- 서버가 `answers.guideDates`를 기준으로 계산한 총액
- 현재 `lib/pricing.js` 기준 통화는 `CNY`

### `payment_currency`

- 현재 가격 계산 통화 코드
- 런타임 기준 `CNY`

### `payment_display_label`

- 언어/locale 기준으로 포맷된 UI용 표시 문자열
- 예: `CNY 1,080`

## PayPal 관련 컬럼

현재 프로덕션 기본 플로우는 아니지만, 레거시 PayPal 경로와의 호환을 위해 아래 컬럼이 남아 있습니다.

- `paypal_order_id`
- `paypal_capture_id`

두 컬럼은 각각 partial unique index를 가집니다.

## 인덱스

주요 인덱스:

- `survey_submissions_contact_email_idx`
- `survey_submissions_user_id_idx`
- `survey_submissions_payment_status_idx`
- `profiles_role_idx`

## `updated_at` 처리

두 테이블 모두 update 시 `updated_at = now()`를 넣는 trigger를 사용합니다.

## 접근 제어와 RLS

### `survey_submissions`

- insert
  - authenticated user만 가능
  - `auth.uid() = user_id`여야 함
- select
  - authenticated user가 자기 own row만 조회 가능

### `profiles`

- select
  - authenticated user가 자기 profile만 조회 가능

### admin 접근

admin API는 DB RLS만으로 해결하지 않고, 서버가 service role key로 Supabase REST를 호출한 뒤 `profiles.role`을 확인하는 방식으로 구현되어 있습니다.

## 현재 주의사항

- 런타임 언어 정규화는 `ko`, `zh`, `en`을 지원하지만 DB `language` 제약은 `ko`, `zh`만 허용합니다.
- 수동 결제 운영 기준에 비해 `payment_status` 정의가 아직 PayPal 상태 전이를 일부 포함하고 있습니다.
