# AGENT.md

이 문서는 레포 구조와 작업 기준만 담는 보조 문서입니다. 현재 제품 상태, 기능 범위, 운영 방향의 공식 기준은 [`README.md`](/Users/apple/Documents/100%20Project/trip_agent/README.md)입니다.

## 레포 기준 문서

- 현재 상태 및 실행 방법: [`README.md`](/Users/apple/Documents/100%20Project/trip_agent/README.md)
- 환경변수: [`docs/setup.md`](/Users/apple/Documents/100%20Project/trip_agent/docs/setup.md)
- 구조 설명: [`docs/architecture.md`](/Users/apple/Documents/100%20Project/trip_agent/docs/architecture.md)
- API: [`docs/api.md`](/Users/apple/Documents/100%20Project/trip_agent/docs/api.md)
- 데이터 모델: [`docs/data-model.md`](/Users/apple/Documents/100%20Project/trip_agent/docs/data-model.md)
- 결제 운영 메모: [`docs/payments-mvp.md`](/Users/apple/Documents/100%20Project/trip_agent/docs/payments-mvp.md)

## 주요 경로

- 앱 페이지: `app/`
- API 라우트: `app/api/`
- 공용 로직: `lib/`
- 정적 자산: `public/`
- Supabase 스키마: `supabase/schema.sql`
- 추가 문서: `docs/`

## 작업 시 주의

- 현재 운영 기준 결제 플로우는 `WeChat Pay` 수동 결제입니다.
- PayPal 코드는 레포에 남아 있지만 문서와 구현 모두 레거시 경로로 취급해야 합니다.
- 과거 구현/운영 메모는 [`docs/next-session.md`](/Users/apple/Documents/100%20Project/trip_agent/docs/next-session.md)에 보관되어 있으며, 현재 상태의 단일 기준 문서가 아닙니다.
