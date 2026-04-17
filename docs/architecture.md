# Architecture

## 개요

이 앱은 Next.js App Router 기반의 단일 웹앱입니다. 사용자 설문 응답을 Supabase에 저장하고, 완료 페이지에서 수동 결제 안내를 보여주며, 운영자는 admin API로 제출 내역을 확인합니다.

## 주요 구성 요소

### 페이지 레이어

- `app/page.js`
  - 랜딩 페이지 엔트리
  - `lang` 쿼리를 받아 초기 언어를 정규화
- `app/survey/page.js`
  - 설문 페이지 엔트리
- `app/survey/complete/page.js`
  - 완료 페이지 엔트리
  - `id`, `lang` 쿼리를 받아 클라이언트 컴포넌트에 전달

### 클라이언트 레이어

- `app/home-client.js`
  - 랜딩 UI
- `app/survey/survey-client.js`
  - 설문 상태, 입력, 요약, 제출 흐름
- `app/survey/complete/survey-complete-client.js`
  - 제출 결과 조회 및 수동 결제 안내 UI
- `lib/submission-client.js`
  - `/api/submissions`, `/api/paypal/*` 호출 래퍼

### 서버/API 레이어

- `app/api/submissions/route.js`
  - 설문 생성
- `app/api/submissions/[id]/route.js`
  - 제출자 본인 또는 admin의 상세 조회
- `app/api/admin/submissions/route.js`
  - admin 목록 조회
- `app/api/admin/submissions/[id]/route.js`
  - admin 상세 조회
- `app/api/paypal/*`
  - 남아 있는 레거시 PayPal 결제 경로

### 도메인/유틸 레이어

- `lib/language.js`
  - `ko`, `zh`, `en` 정규화
- `lib/pricing.js`
  - 가이드 날짜 수 기준 가격 계산
- `lib/manual-payment.js`
  - 수동 결제 수단명과 QR 이미지 경로
- `lib/submission-utils.js`
  - 제출 payload 검증, summary 정리, DB insert 데이터 생성, 응답 serialize
- `lib/request-auth.js`
  - Bearer token 또는 Supabase auth cookie 기반 사용자 확인
- `lib/integration-config.js`
  - Supabase, Resend, PayPal 설정 해석

### 데이터 접근 레이어

- `lib/supabase-admin.js`
  - service role key로 Supabase REST API 호출
  - 제출 생성/조회/수정과 프로필 조회 담당

## 인증 경계

### 일반 사용자

- 설문 생성은 인증된 사용자만 가능
- 제출 상세 조회는 본인 제출만 가능

### 관리자

- `profiles.role = 'admin'`인 사용자만 admin API 접근 가능
- admin은 제출 목록과 개별 제출 상세를 조회할 수 있음

### 인증 방식

- `Authorization: Bearer <token>`
- 또는 Supabase auth cookie

서버는 토큰을 읽은 뒤 Supabase `auth/v1/user`로 현재 사용자를 확인합니다.

## 설문 제출 흐름

1. 클라이언트가 설문 answers, summary, contact email을 정리합니다.
2. `/api/submissions`가 payload를 검증합니다.
3. 서버가 `guideDates` 기준으로 가격을 계산합니다.
4. `survey_submissions`에 저장합니다.
5. Resend 설정이 있으면 운영 알림 메일을 보냅니다.
6. 클라이언트는 생성된 submission id로 완료 페이지를 엽니다.

## 완료 페이지 및 수동 결제 흐름

1. 완료 페이지는 `id` 쿼리로 제출 데이터를 조회합니다.
2. 서버는 접근 권한을 검사합니다.
3. 클라이언트는 여행 요약, 계산된 결제 금액, `WeChat Pay` QR 이미지를 보여줍니다.
4. QR 이미지는 `NEXT_PUBLIC_MANUAL_PAYMENT_QR_IMAGE`가 있으면 그 값을 사용하고, 없으면 `/manual-payment-qr.png`를 사용합니다.

## 운영 알림 메일 흐름

1. 제출 생성 직후 Resend 설정 유무를 확인합니다.
2. 설정이 완전하면 운영팀에게 알림 메일을 보냅니다.
3. 메일 발송 결과는 API 응답에 포함되고, 실패 시 에러 문자열도 함께 반환됩니다.

## 운영자 제출 조회 흐름

1. admin 사용자가 `/api/admin/submissions` 또는 `/api/admin/submissions/[id]`를 호출합니다.
2. 서버가 `profiles.role`을 확인합니다.
3. Supabase admin REST 호출로 제출 데이터를 읽어옵니다.
4. 응답은 `serializeSubmission()`을 거친 JSON 형태로 반환됩니다.

## 현재 구조상 유의사항

- DB 스키마의 `survey_submissions.language` 제약은 `ko`, `zh`만 허용하지만 런타임 언어 정규화는 `en`도 허용합니다.
- PayPal 경로는 일부 업데이트 로직까지 남아 있지만 현재 완료 페이지의 기본 UX는 수동 결제입니다.
- admin 목록/상세 조회는 구현되어 있지만 수동 입금 상태를 변경하는 admin mutation API는 아직 없습니다.
