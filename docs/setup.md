# Setup Guide

이 문서는 로컬 개발과 배포 환경에서 필요한 환경변수를 정리합니다. 값이 `.env.local`에 있어야 하는지, 프로덕션에서 어떤 기능에 영향을 주는지, 비어 있을 때 어떤 동작을 하는지를 기준으로 설명합니다.

## 기본 원칙

- 로컬 개발: `.env.local` 사용
- 프로덕션: Vercel 환경변수 사용
- `.env.example`는 샘플 키 목록이며 비밀값은 커밋하지 않습니다

## 앱 공용 / 분석

### `NEXT_PUBLIC_APP_URL`

- 권장값: 로컬에서는 `http://localhost:3000`
- 용도: 앱 기준 URL이 필요한 클라이언트/서버 로직의 기본값
- 필수 여부: 권장
- 비어 있을 때: 일부 절대 URL 생성 로직이 있으면 불안정해질 수 있음

### `NEXT_PUBLIC_GTM_ID`

- 용도: Google Tag Manager 연결
- 필수 여부: 선택
- 비어 있을 때: GTM이 비활성 상태로 동작

### `NEXT_PUBLIC_GA_MEASUREMENT_ID`

- 용도: Google Analytics 측정 ID
- 필수 여부: 선택
- 비어 있을 때: GA 이벤트 전송이 비활성 상태로 동작

## Supabase

### `NEXT_PUBLIC_SUPABASE_URL`

- 용도: 클라이언트와 auth 확인 로직에서 사용하는 Supabase URL
- 필수 여부: 사실상 필수
- 비어 있을 때: `SUPABASE_URL`로 fallback 가능

### `NEXT_PUBLIC_SUPABASE_ANON_KEY`

- 용도: 인증 사용자 확인용 anon key
- 필수 여부: 사실상 필수
- 비어 있을 때: `SUPABASE_ANON_KEY`로 fallback 가능

### `SUPABASE_URL`

- 용도: 서버 측 Supabase REST 접근 URL
- 필수 여부: `NEXT_PUBLIC_SUPABASE_URL`가 없다면 필수
- 비어 있을 때: 서버는 `NEXT_PUBLIC_SUPABASE_URL`을 대신 사용

### `SUPABASE_ANON_KEY`

- 용도: auth 확인용 anon key의 서버 fallback
- 필수 여부: `NEXT_PUBLIC_SUPABASE_ANON_KEY`가 없다면 필수
- 비어 있을 때: 서버는 `NEXT_PUBLIC_SUPABASE_ANON_KEY`를 대신 사용

### `SUPABASE_SERVICE_ROLE_KEY`

- 용도: 서버에서 `survey_submissions`, `profiles`를 조회/생성/수정할 때 사용
- 필수 여부: 서버 기능 기준 필수
- 비어 있을 때:
  - 설문 저장 불가
  - admin API 동작 불가
  - 제출 상세 조회 불가

## 수동 결제

### `NEXT_PUBLIC_MANUAL_PAYMENT_QR_IMAGE`

- 용도: 완료 페이지에서 보여줄 수동 결제 QR 이미지 경로
- 필수 여부: 선택
- 비어 있을 때: `/manual-payment-qr.png` 사용
- 권장값:
  - 정적 자산이면 `/manual-payment-qr.png`
  - 외부 CDN이면 절대 URL 사용 가능

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

## 레거시 PayPal

현재 프로덕션 기본 플로우는 수동 결제이므로 아래 변수들은 레거시 경로용입니다.

### `NEXT_PUBLIC_PAYPAL_CLIENT_ID`

- 용도: 클라이언트 PayPal SDK 초기화
- 필수 여부: PayPal UI를 다시 연결할 때만 필요
- 비어 있을 때: PayPal 클라이언트 결제 UI 비활성

### `NEXT_PUBLIC_PAYPAL_CURRENCY`

- 용도: 클라이언트 PayPal 통화 표시
- 필수 여부: 선택
- 비어 있을 때: 앱 기본값 또는 서버 계산값 기준 사용

### `PAYPAL_ENV`

- 허용값: `sandbox`, `live`
- 용도: PayPal API base URL 선택
- 필수 여부: 선택
- 비어 있을 때: `sandbox`

### `PAYPAL_CLIENT_ID`

- 용도: PayPal 서버 API 인증
- 필수 여부: PayPal 서버 경로 사용 시 필수
- 비어 있을 때: `isPayPalConfigured()`가 false가 됨

### `PAYPAL_CLIENT_SECRET`

- 용도: PayPal 서버 API 인증
- 필수 여부: PayPal 서버 경로 사용 시 필수
- 비어 있을 때: `isPayPalConfigured()`가 false가 됨

### `PAYPAL_ORDER_DESCRIPTION`

- 용도: 주문 설명 문구
- 필수 여부: 선택
- 비어 있을 때: 기본 설명 문자열 사용

## 최소 로컬 실행 조합

설문 저장과 제출 상세 조회까지 포함해 로컬에서 실제 흐름을 보려면 아래 값들이 필요합니다.

- `NEXT_PUBLIC_SUPABASE_URL` 또는 `SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` 또는 `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

운영 알림 메일까지 확인하려면 아래도 추가합니다.

- `RESEND_API_KEY`
- `EMAIL_FROM`
- `NOTIFICATION_EMAIL`

완료 페이지의 QR 이미지를 별도 교체하려면 아래도 설정합니다.

- `NEXT_PUBLIC_MANUAL_PAYMENT_QR_IMAGE`
