# Architecture

## 개요

이 앱은 Next.js App Router 기반의 단일 웹앱입니다.  
사용자는 랜딩에서 설문으로 진입하고, 설문 마지막 제출 직전에 로그인/회원가입을 거친 뒤 제출을 완료합니다. 제출 데이터는 Supabase에 저장되고, 완료 페이지에서는 `WeChat Pay` 수동 입금 안내를 보여줍니다. 운영자는 admin 페이지에서 제출 목록과 상세를 조회합니다.

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
- `lib/submission-utils.js`
  - 제출 payload 검증
  - summary 정리
  - DB insert 데이터 생성
  - API 응답 serialize
- `lib/request-auth.js`
  - Bearer token 또는 Supabase auth cookie 기반 사용자 확인
  - `requireVerifiedUser`, `requireAdmin`, 제출 접근 제어
- `lib/integration-config.js`
  - Supabase, Resend, 수동 결제 관련 설정 해석
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
6. `survey_submissions`에 `submission_status = awaiting_transfer`로 저장합니다.
7. Resend 설정이 있으면 운영 알림 메일을 보냅니다.
8. 클라이언트는 생성된 submission id로 완료 페이지를 엽니다.

## 완료 페이지 및 수동 결제 흐름

1. 완료 페이지는 `id` 쿼리로 제출 데이터를 조회합니다.
2. 서버는 접근 권한을 검사합니다.
3. 클라이언트는 여행 요약, 계산된 견적 금액, `WeChat Pay` QR 이미지를 보여줍니다.
4. QR 이미지는 `NEXT_PUBLIC_MANUAL_PAYMENT_QR_IMAGE`가 있으면 그 값을 사용하고, 없으면 `/manual-payment-qr.png`를 사용합니다.
5. 현재 완료 페이지는 상태 변경 UI 없이 읽기 전용 안내 화면입니다.

## 운영 알림 메일 흐름

1. 제출 생성 직후 Resend 설정 유무를 확인합니다.
2. 설정이 완전하면 운영팀에게 알림 메일을 보냅니다.
3. 메일 제목에는 견적 금액과 입금자명이 포함됩니다.
4. 메일 발송 결과는 API 응답에 포함되고, 실패 시 에러 문자열도 함께 반환됩니다.

## 운영자 제출 조회 흐름

1. admin 사용자가 `/api/admin/submissions` 또는 `/api/admin/submissions/[id]`를 호출합니다.
2. 서버가 `profiles.role`과 이메일 인증 여부를 확인합니다.
3. Supabase admin REST 호출로 제출 데이터를 읽어옵니다.
4. 응답은 `serializeSubmission()`을 거친 JSON 형태로 반환됩니다.

## 현재 구조상 유의사항

- admin 목록/상세 조회는 구현되어 있지만 수동 입금 상태를 변경하는 admin mutation API는 아직 없습니다.
- 수동 입금 확인 이후 `matched` 전환까지의 운영 워크플로는 아직 서버 액션/API로 자동화되지 않았습니다.
- 현재 인증 UI는 공용 로그인 흐름 하나를 공유하며, 관리자 전용 별도 로그인 화면은 없습니다.
