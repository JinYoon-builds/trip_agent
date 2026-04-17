# Payments MVP

## 현재 기준

현재 프로덕션 기준 결제 플로우는 `WeChat Pay` 수동 결제입니다. 사용자는 설문 제출 후 완료 페이지에서 QR 코드와 입금 안내를 보고 직접 송금하고, 운영팀이 제출 내역을 확인해 후속 처리합니다.

이 문서는 현재 운영 기준 결제 방식만 설명합니다. PayPal 관련 코드는 레포에 남아 있지만 현재 기본 사용자 플로우는 아닙니다.

## 현재 결제 플로우

1. 사용자가 설문을 제출합니다.
2. 서버가 `guideDates` 기준으로 금액을 계산합니다.
3. `survey_submissions.payment_status`는 `awaiting_manual_payment`로 저장됩니다.
4. 완료 페이지에서 아래 정보를 보여줍니다.
   - 여행 요약
   - 계산된 결제 금액
   - `WeChat Pay` 수단명
   - QR 이미지
   - 입금자명 가이드
5. 운영팀은 admin API 또는 DB에서 제출 내역을 확인하고 수동으로 후속 처리합니다.

## 가격 계산

가격 계산의 단일 기준은 `lib/pricing.js`입니다.

- 기본 일일 요금: `CNY 600`
- 2일: 일일 `CNY 540`
- 3일 이상: 일일 `CNY 480`

즉, 할인 규칙은 다음과 같습니다.

- 1일: 할인 없음
- 2일: 10% 할인
- 3일 이상: 20% 할인

서버는 `answers.guideDates`를 기준으로 총액을 다시 계산합니다.

## 환경변수

### 현재 수동 결제에 직접 관련된 값

- `NEXT_PUBLIC_MANUAL_PAYMENT_QR_IMAGE`
  - 비어 있으면 `/manual-payment-qr.png`

### 운영 알림에 관련된 값

- `RESEND_API_KEY`
- `EMAIL_FROM`
- `NOTIFICATION_EMAIL`

## 운영 관점에서 중요한 필드

- `payment_status`
  - 현재 기준 기본값: `awaiting_manual_payment`
- `payment_amount`
  - 서버 계산 총액
- `payment_currency`
  - 현재 `CNY`
- `payment_display_label`
  - UI 표시 문자열

## 레거시 PayPal 상태

레포에는 아래 PayPal API가 남아 있습니다.

- `POST /api/paypal/create-order`
- `POST /api/paypal/capture-order`

이 경로들은 아래 이유로 레거시로 봅니다.

- 현재 완료 페이지 기본 UX가 PayPal 버튼 중심이 아님
- 현재 README와 운영 기준이 수동 결제를 메인으로 삼음
- 운영 후속 처리도 수동 입금 확인 전제를 따름

즉, PayPal은 삭제되지 않았지만 현재 운영 메인 경로로 문서화하지 않습니다.

## 현재 공백

- 수동 입금 확인 상태를 admin이 업데이트하는 공식 mutation API가 없습니다.
- 결제 완료/확인 이후 운영 후속 처리 절차도 시스템으로 완전히 모델링되어 있지는 않습니다.
