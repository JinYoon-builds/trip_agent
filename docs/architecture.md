# Architecture

## 개요

이 앱은 Next.js App Router 기반의 단일 웹앱입니다.  
사용자는 랜딩에서 설문으로 진입하고, 설문 마지막 제출 직전에 로그인/회원가입을 거친 뒤 제출을 완료합니다. 제출 데이터는 Supabase에 저장되고, 완료 페이지에서는 언어에 따라 `WeChat Pay` 수동 결제 또는 `PayPal` 결제를 보여줍니다. 운영자는 admin 페이지에서 제출 목록과 상세를 조회합니다.

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
- `app/admin/page.js`
  - 관리자 페이지 엔트리

### 클라이언트 레이어

- `app/home-client.js`
  - 랜딩 UI
  - 언어 전환과 로그인/회원가입 버튼 표시
- `app/survey/survey-client.js`
  - 설문 상태, 입력, 요약, 제출 흐름
  - 제출 직전 로그인 / 이메일 인증 게이트 처리
- `app/survey/complete/survey-complete-client.js`
  - 제출 결과 조회 및 수동 결제 안내 UI
- `app/admin/page-client.js`
  - 관리자 제출 목록 UI
  - admin 권한 검사 후 목록 로드
- `components/auth-provider.js`
  - 전역 auth 상태 관리
  - Supabase browser client 세션 동기화
- `components/auth-modal.js`
  - 공용 로그인/회원가입 모달
  - 이메일 인증 안내 / 재전송 상태 포함
- `components/auth-buttons.js`
  - 비로그인 시 `로그인 / 회원가입`
  - 로그인 시 계정 배지 및 로그아웃 메뉴

### 서버/API 레이어

- `app/api/auth/session/route.js`
  - 현재 세션 사용자 / profile / 이메일 인증 여부 반환
- `app/api/submissions/route.js`
  - 설문 생성
  - 이메일 인증 완료 사용자만 허용
- `app/api/submissions/[id]/route.js`
  - 제출자 본인 또는 admin의 상세 조회
- `app/api/submissions/[id]/paypal/order/route.js`
  - ko/en 제출용 PayPal 주문 생성
- `app/api/submissions/[id]/paypal/capture/route.js`
  - ko/en 제출용 PayPal 캡처 및 `paid` 전환
- `app/api/admin/submissions/route.js`
  - admin 목록 조회
- `app/api/admin/submissions/[id]/route.js`
  - admin 상세 조회

### 도메인/유틸 레이어

- `lib/language.js`
  - `ko`, `zh`, `en` 정규화
- `lib/pricing.js`
  - 가이드 날짜 수 기준 견적 계산
- `lib/manual-payment.js`
  - 수동 결제 수단명과 QR 이미지 경로
- `lib/payment.js`
  - 언어별 결제 수단 결정
- `lib/paypal.js`
  - PayPal 토큰 / 주문 생성 / 주문 캡처
- `lib/submission-utils.js`
  - 제출 payload 검증
  - summary 정리
  - DB insert 데이터 생성
  - API 응답 serialize
- `lib/request-auth.js`
  - Bearer token 또는 Supabase auth cookie 기반 사용자 확인
  - `requireVerifiedUser`, `requireAdmin`, 제출 접근 제어
- `lib/integration-config.js`
  - Supabase, Resend, 수동 결제, PayPal 관련 설정 해석
- `lib/submission-client.js`
  - `/api/submissions`, `/api/auth/session`, admin 호출 래퍼

### 데이터 접근 레이어

- `lib/supabase-admin.js`
  - service role key로 Supabase REST API 호출
  - 제출 생성/조회와 profile 조회 담당

## 인증 경계

### 일반 사용자

- 랜딩과 설문 1/2 페이지는 비로그인 상태로 접근 가능
- 설문 제출은 로그인 + 이메일 인증 완료 사용자만 가능
- 제출 상세 조회는 본인 제출만 가능

### 관리자

- `profiles.role = 'admin'`인 사용자만 admin API 접근 가능
- admin도 이메일 인증 완료 상태여야 함
- admin은 제출 목록과 개별 제출 상세를 조회할 수 있음

### 인증 방식

- `Authorization: Bearer <token>`
- 또는 Supabase auth cookie

서버는 토큰을 읽은 뒤 Supabase `auth/v1/user`로 현재 사용자를 확인합니다.

## 인증 UX 흐름

1. 랜딩과 설문 상단에서 공용 auth modal을 열 수 있습니다.
2. 회원가입 시 Supabase Auth로 계정을 생성합니다.
3. 인증 메일 발송 후 즉시 로그인 상태로 보지 않고, 이메일 인증 안내 상태를 보여줍니다.
4. 로그인 시에도 `email_confirmed_at`이 없으면 세션을 해제하고 인증 안내 상태로 돌립니다.
5. 로그인된 사용자는 헤더에서 `아이콘 + 이메일/계정 라벨`로 현재 계정을 확인할 수 있습니다.

## 설문 제출 흐름

1. 클라이언트가 answers, summary, contact email을 정리합니다.
2. 제출 직전 로그인 여부를 확인합니다.
3. 로그인돼 있어도 이메일 인증이 안 됐으면 제출을 막고 auth modal을 다시 엽니다.
4. `/api/submissions`가 payload를 검증합니다.
5. 서버가 `guideDates` 기준으로 견적을 계산합니다.
6. `survey_submissions`에 언어별 견적과 결제 수단을 함께 저장합니다.
7. 클라이언트는 생성된 submission id로 완료 페이지를 엽니다.

## 완료 페이지 및 결제 흐름

1. 완료 페이지는 `id` 쿼리로 제출 데이터를 조회합니다.
2. 서버는 접근 권한을 검사합니다.
3. `zh` 제출이면 여행 요약, 계산된 견적 금액, `WeChat Pay` QR 이미지를 보여줍니다.
4. `ko / en` 제출이면 PayPal JS SDK 버튼을 로드하고, 서버에서 PayPal 주문 생성/캡처를 수행합니다.
5. `ko / en` 결제가 성공하면 서버가 제출을 `paid`로 바꾸고 완료 메일을 보냅니다.
6. QR 이미지는 `NEXT_PUBLIC_MANUAL_PAYMENT_QR_IMAGE`가 있으면 그 값을 사용하고, 없으면 `/manual-payment-qr.png`를 사용합니다.

## 결제 완료 메일 흐름

1. 제출이 `paid`가 되는 시점에 Resend 설정 유무를 확인합니다.
2. 설정이 완전하면 고객과 운영팀 모두에게 결제 완료 메일을 보냅니다.
3. `ko / en`은 PayPal 캡처 성공 시 자동 발송됩니다.
4. `zh`는 운영자가 상태를 `paid`로 변경할 때 발송됩니다.
5. 발송 결과는 `survey_submissions.payment_completed_email_*` 필드에 기록됩니다.

## 운영자 제출 조회/상태 변경 흐름

1. admin 사용자가 `/api/admin/submissions` 또는 `/api/admin/submissions/[id]`를 호출합니다.
2. 서버가 `profiles.role`과 이메일 인증 여부를 확인합니다.
3. Supabase admin REST 호출로 제출 데이터를 읽어옵니다.
4. 응답은 `serializeSubmission()`을 거친 JSON 형태로 반환됩니다.
5. 상태 변경 시에는 `PATCH /api/admin/submissions/[id]`가 허용된 상태값만 받아 기존 row를 업데이트합니다.

## 사용자 마이페이지 / 제출 수정 흐름

1. 로그인 사용자가 `/api/submissions`를 호출해 자신의 제출 목록을 조회합니다.
2. 각 제출은 `serializeSubmission()` 기준으로 상태와 `isEditable` 값을 함께 받습니다.
3. 사용자가 수정 가능한 제출을 열면 기존 설문 데이터를 불러와 같은 설문 폼을 edit mode로 다시 보여줍니다.
4. 저장 시 `PATCH /api/submissions/[id]`를 호출하고, 서버가 payload 검증과 견적 재계산을 수행합니다.

## 현재 구조상 유의사항

- admin 목록/상세 조회와 상태 변경 API가 모두 존재하지만, 상태 이력(audit trail)은 아직 남기지 않습니다.
- 사용자 수정 가능 여부는 현재 `awaiting_transfer` 상태 기준으로 판정합니다.
- 현재 인증 UI는 공용 로그인 흐름 하나를 공유하며, 관리자 전용 별도 로그인 화면은 없습니다.
