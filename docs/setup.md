# Setup Guide

이 문서는 로컬 개발과 배포 환경에서 필요한 환경변수와 Supabase 설정을 정리합니다.

## 기본 원칙

- 로컬 개발: `.env.local` 사용
- 프로덕션: Vercel 환경변수 사용
- `.env.example`는 샘플 키 목록이며 비밀값은 커밋하지 않습니다

## 필수 준비

코드만 내려받아서는 현재 구조가 완전히 동작하지 않습니다. 아래 두 가지가 먼저 맞아야 합니다.

1. Supabase SQL Editor에서 [supabase/schema.sql](/Users/apple/Documents/100%20Project/trip_agent/supabase/schema.sql) 실행
2. Supabase Auth에서 이메일 인증을 켜 둔 상태 유지

## 앱 공용 / 분석

### `NEXT_PUBLIC_APP_URL`

- 권장값: 로컬에서는 `http://localhost:3000`
- 용도: 앱 기준 URL이 필요한 클라이언트/서버 로직의 기본값
- 필수 여부: 권장

### `NEXT_PUBLIC_GTM_ID`

- 용도: Google Tag Manager 연결
- 필수 여부: 선택
- 비어 있을 때: GTM 비활성

### `NEXT_PUBLIC_GA_MEASUREMENT_ID`

- 용도: Google Analytics 측정 ID
- 필수 여부: 선택
- 비어 있을 때: GA 비활성

## Supabase

### `NEXT_PUBLIC_SUPABASE_URL`

- 용도: 브라우저 auth client와 서버 auth 확인 로직에서 사용하는 Supabase URL
- 필수 여부: 사실상 필수
- 비어 있을 때: `SUPABASE_URL`로 fallback 가능

### `NEXT_PUBLIC_SUPABASE_ANON_KEY`

- 용도: 브라우저 auth client와 auth 확인용 public key
- 필수 여부: 사실상 필수
- 비어 있을 때: `SUPABASE_ANON_KEY`로 fallback 가능

### `SUPABASE_URL`

- 용도: 서버 측 Supabase REST 접근 URL
- 필수 여부: `NEXT_PUBLIC_SUPABASE_URL`가 없다면 필수
- 비어 있을 때: 서버는 `NEXT_PUBLIC_SUPABASE_URL`을 대신 사용

### `SUPABASE_ANON_KEY`

- 용도: 서버 auth 확인용 anon key fallback
- 필수 여부: `NEXT_PUBLIC_SUPABASE_ANON_KEY`가 없다면 필수
- 비어 있을 때: 서버는 `NEXT_PUBLIC_SUPABASE_ANON_KEY`를 대신 사용

### `SUPABASE_SERVICE_ROLE_KEY`

- 용도: 서버에서 `survey_submissions`, `profiles`를 조회/생성할 때 사용
- 필수 여부: 서버 기능 기준 필수
- 비어 있을 때:
  - 설문 저장 불가
  - admin API 동작 불가
  - 제출 상세 조회 불가

## Supabase Auth 권장 설정

### 이메일 인증

- 회원가입 후 이메일 인증을 필수로 둡니다
- 현재 프론트/백엔드는 이 정책을 전제로 구현돼 있습니다

### Redirect URL

- 로컬 테스트용: `http://localhost:3000`
- 프로덕션용: `https://liu-unnie.com`

회원가입 모달은 `emailRedirectTo = window.location.origin`을 사용하므로, Auth 설정에도 해당 origin이 허용돼 있어야 합니다.

## 수동 결제

### `NEXT_PUBLIC_MANUAL_PAYMENT_QR_IMAGE`

- 용도: 완료 페이지에서 보여줄 수동 결제 QR 이미지 경로
- 필수 여부: 선택
- 비어 있을 때: `/manual-payment-qr.png` 사용
- 권장값:
  - 정적 자산이면 `/manual-payment-qr.png`
  - 외부 CDN이면 절대 URL 사용 가능

## PayPal

### `PAYPAL_ENV`

- 용도: PayPal 서버 API 환경 선택
- 허용값: `sandbox`, `live`
- 필수 여부: `ko / en` PayPal 결제를 쓰려면 필수

### `PAYPAL_CLIENT_ID`

- 용도: 서버에서 PayPal Orders API 토큰 발급/주문 생성/캡처 호출에 사용
- 필수 여부: `ko / en` PayPal 결제를 쓰려면 필수

### `PAYPAL_CLIENT_SECRET`

- 용도: 서버에서 PayPal OAuth 토큰 발급에 사용
- 필수 여부: `ko / en` PayPal 결제를 쓰려면 필수
- 주의: 절대 public env로 노출하지 않습니다

### `NEXT_PUBLIC_PAYPAL_CLIENT_ID`

- 용도: 완료 페이지 PayPal JS SDK 로드
- 필수 여부: `ko / en` PayPal 결제를 쓰려면 필수
- 주의: PayPal `Client ID`와 동일 값 사용 가능

## Resend

### `RESEND_API_KEY`

- 용도: 운영 알림 메일 발송
- 필수 여부: 메일 발송을 쓰려면 필수
- 비어 있을 때: 설문 저장은 가능하지만 알림 메일은 보내지지 않음

### `EMAIL_FROM`

- 용도: 발신자 주소
- 필수 여부: 메일 발송을 쓰려면 필수
- 비어 있을 때: Resend 설정 미완료로 간주

### `NOTIFICATION_EMAIL`

- 용도: 운영 알림 수신 주소
- 형식: 쉼표로 구분된 이메일 목록
- 필수 여부: 메일 발송을 쓰려면 필수
- 비어 있을 때: Resend 설정 미완료로 간주

## 최소 로컬 실행 조합

설문 저장과 인증 UI까지 포함해 로컬에서 실제 흐름을 보려면 아래 값들이 필요합니다.

- `NEXT_PUBLIC_SUPABASE_URL` 또는 `SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` 또는 `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

결제 완료 메일까지 확인하려면 아래도 추가합니다.

- `RESEND_API_KEY`
- `EMAIL_FROM`
- `NOTIFICATION_EMAIL`

완료 페이지의 QR 이미지를 별도 교체하려면 아래도 설정합니다.

- `NEXT_PUBLIC_MANUAL_PAYMENT_QR_IMAGE`

`ko / en` PayPal 결제까지 로컬에서 보려면 아래도 추가합니다.

- `PAYPAL_ENV`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `NEXT_PUBLIC_PAYPAL_CLIENT_ID`

## 로컬 테스트 체크리스트

1. `npm install`
2. `.env.local` 작성
3. Supabase SQL Editor에서 `supabase/schema.sql` 실행
4. Supabase Auth 이메일 인증 설정 확인
5. `npm run dev`
6. 회원가입 -> 이메일 인증 -> 로그인 -> 설문 제출 -> 완료 페이지 확인
7. `zh`: QR 수동 결제 UI 확인
8. `ko / en`: PayPal 결제 UI 확인
