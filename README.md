# 刘Unnie

중국인 관광객을 위한 현지 대학생 가이드 매칭 MVP입니다.  
현재는 설문 제출 후 `WeChat Pay` 수동 입금 안내로 이어지고, 운영팀이 입금을 확인한 뒤 가이드가 직접 연락하는 흐름으로 구성되어 있습니다.

## Live

- Production: `https://liu-unnie.com`
- Survey: `https://liu-unnie.com/survey?lang=ko`
- Completion example: `https://liu-unnie.com/survey/complete?id=653381b1-0e16-4736-a6bf-9d9bfd8ab180&lang=ko`

## Current Flow

1. 사용자가 다국어 설문을 작성합니다.
2. 설문 마지막 제출 직전에는 로그인과 이메일 인증이 필요합니다.
3. 서버에 설문이 저장되고 운영팀에게 제출 알림 메일이 발송됩니다.
4. 완료 페이지에서 `WeChat Pay` QR과 입금자명 안내를 확인합니다.
5. 운영팀이 입금을 확인한 뒤 현지 대학생 가이드가 직접 연락합니다.

## Screenshot

프로덕션 완료 페이지 기준 캡처입니다.

<img src="./docs/assets/production-complete-page-qr-fixed.png" alt="刘Unnie completion page" width="360" />

## What Works

- `ko / zh / en` 언어 전환
- Supabase Auth 기반 로그인 / 회원가입
- 회원가입 후 이메일 인증 요구
- 랜딩 / 설문 상단 공용 인증 모달
- 로그인 후 헤더 계정 상태 표시
- Supabase 기반 설문 저장
- 제출자 소유권 기반 설문 조회 보호
- `customer / admin` 역할 분리
- 관리자용 제출 목록 / 상세 조회 페이지
- 가이드 날짜 기반 동적 견적 계산
- 완료 페이지 `WeChat Pay` 수동 결제 안내
- 설문 제출 시 운영팀 알림 메일 발송
- 프로덕션 배포 완료

## Stack

- Next.js
- React
- Supabase
- Resend
- Vercel

## Local Dev

```bash
npm install
npm run dev
```

추가로 Supabase SQL Editor에서 [`supabase/schema.sql`](/Users/apple/Documents/100%20Project/trip_agent/supabase/schema.sql)를 먼저 적용해야 인증/권한/제출 스키마가 현재 코드와 맞습니다.

## Build

```bash
npm run build
```

## Notes

- 결제 연동은 `PayPal` 없이 `WeChat Pay` 수동 입금 기준으로만 동작합니다.
- `survey_submissions`는 설문 원본 `answers`, 운영용 `summary`, 견적 `quoted_*`, 상태 `submission_status`를 함께 저장합니다.
- 관리자 페이지는 현재 읽기 전용이며, 수동 입금 상태를 변경하는 admin mutation API는 아직 없습니다.
- Supabase Auth에서는 이메일 인증을 켜 두는 것을 전제로 동작합니다.
