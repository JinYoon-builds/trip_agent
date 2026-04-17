# Data Model

## 개요

이 앱은 Supabase의 `auth.users`와 연동되는 `profiles`, 실제 설문 데이터가 저장되는 `survey_submissions` 두 테이블을 중심으로 동작합니다.

스키마 원본은 [supabase/schema.sql](/Users/apple/Documents/100%20Project/trip_agent/supabase/schema.sql)입니다.

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

설문 응답, 견적, 수동 입금 추적 상태를 저장합니다.

### 핵심 컬럼

- `id`
  - UUID PK
- `user_id`
  - 제출자 사용자 ID
- `language`
  - 허용값: `ko`, `zh`, `en`
- `contact_email`
  - 주요 연락 이메일
- `applicant_name`
  - 신청자명
- `answers`
  - 원본 설문 답변 JSON
- `summary`
  - 완료 페이지 및 운영 메일용 요약 배열 JSON
- `submission_status`
  - 제출 후속 처리 상태
- `guide_day_count`
  - 선택된 가이드 일수
- `quoted_amount`
  - 서버 계산 견적 금액
- `quoted_currency`
  - 현재 견적 통화
- `quoted_display_label`
  - UI 노출용 문자열
- `email_sent_at`
  - 운영 알림 메일 발송 시간 기록
- `email_send_error`
  - 메일 발송 실패 메시지
- `created_at`
- `updated_at`

## `submission_status` 의미

현재 스키마는 아래 상태값을 허용합니다.

- `awaiting_transfer`
  - 설문 저장 직후 기본 상태
  - 사용자가 수동 입금을 아직 완료하지 않았거나, 운영팀이 확인하지 않은 상태
- `payment_review`
  - 사용자가 입금했다고 알려졌거나 운영팀 확인 중인 상태
- `paid`
  - 입금 확인 완료 상태
- `matched`
  - 가이드 매칭 후 후속 프로세스가 진행 중인 상태
- `cancelled`
  - 취소 또는 종료된 상태

현재 실제 사용자 플로우에서 가장 중요한 기본 상태는 `awaiting_transfer`입니다.

현재 코드 기준 사용자 수정 가능 여부는 `awaiting_transfer`, `payment_review` 상태로 제한됩니다.

## 견적 관련 필드 의미

### `guide_day_count`

- `answers.guideDates` 길이 기준으로 계산
- 최소값 `1`

### `quoted_amount`

- 서버가 `answers.guideDates` 기준으로 계산한 총 견적
- 현재 `lib/pricing.js` 기준 통화는 `CNY`

### `quoted_currency`

- 현재 가격 계산 통화 코드
- 런타임 기준 `CNY`

### `quoted_display_label`

- 언어/locale 기준으로 포맷된 UI용 표시 문자열
- 예: `CNY 1,080`

## JSON 필드 역할

### `answers`

- 설문 원본 전체 입력값을 저장
- 운영/분석/추후 매칭 로직에서 상세 원본이 필요할 때 사용

### `summary`

- 완료 페이지와 운영 메일에서 바로 보여줄 수 있는 label/value 배열
- 사용자-facing 요약 스냅샷 역할

## 이전 PayPal 컬럼 정리

현재 스키마는 PayPal 관련 컬럼을 더 이상 사용하지 않습니다.

제거 대상:

- `payment_status`
- `payment_amount`
- `payment_currency`
- `payment_display_label`
- `paypal_order_id`
- `paypal_capture_id`

마이그레이션 SQL은 기존 값이 있으면 이를 `submission_status`, `quoted_*`로 옮긴 뒤 구 컬럼을 삭제하도록 작성되어 있습니다.

## 인덱스

주요 인덱스:

- `survey_submissions_contact_email_idx`
- `survey_submissions_user_id_idx`
- `survey_submissions_submission_status_idx`
- `survey_submissions_created_at_idx`
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

admin API는 DB RLS만으로 해결하지 않고, 서버가 service role key로 Supabase REST를 호출한 뒤 `profiles.role`과 이메일 인증 여부를 확인하는 방식으로 구현되어 있습니다.

## 현재 주의사항

- `survey_submissions`는 설문 원본 `answers`와 운영용 `summary`를 함께 저장하는 하이브리드 모델입니다.
- admin mutation API는 `payment_review`, `paid`, `matched`, `cancelled` 상태 변경을 지원하며, 전이는 워크플로 순서에 맞게 제한됩니다.
