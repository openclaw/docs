---
read_when:
    - 외부 CLI 통합 추가 또는 변경
    - RPC 어댑터 디버깅 (signal-cli, imsg)
summary: 외부 CLI(signal-cli, imsg)를 위한 RPC 어댑터 및 Gateway 패턴
title: RPC 어댑터
x-i18n:
    generated_at: "2026-05-10T19:50:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63556f140bee55821fa0a09ff9808e163728049f8db4c58f7bb4ceca6e1cac1a
    source_path: reference/rpc.md
    workflow: 16
---

OpenClaw은 JSON-RPC를 통해 외부 CLI와 통합됩니다. 현재 두 가지 패턴이 사용됩니다.

## 패턴 A: HTTP 데몬(signal-cli)

- `signal-cli`는 HTTP 기반 JSON-RPC를 사용하는 데몬으로 실행됩니다.
- 이벤트 스트림은 SSE(`/api/v1/events`)입니다.
- 상태 프로브: `/api/v1/check`.
- `channels.signal.autoStart=true`일 때 OpenClaw가 수명 주기를 담당합니다.

설정 및 엔드포인트는 [Signal](/ko/channels/signal)을 참고하세요.

## 패턴 B: stdio 자식 프로세스(imsg)

- OpenClaw는 [iMessage](/ko/channels/imessage)를 위해 `imsg rpc`를 자식 프로세스로 생성합니다.
- JSON-RPC는 stdin/stdout을 통해 줄 단위로 구분됩니다(줄마다 JSON 객체 하나).
- TCP 포트가 없고, 데몬도 필요하지 않습니다.

사용되는 핵심 메서드:

- `watch.subscribe` → 알림(`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list`(프로브/진단)

레거시 설정 및 주소 지정(`chat_id` 권장)은 [iMessage](/ko/channels/imessage)를 참고하세요.

## 어댑터 지침

- Gateway가 프로세스를 담당합니다(시작/중지는 프로바이더 수명 주기에 연결됨).
- RPC 클라이언트를 복원력 있게 유지하세요: 타임아웃, 종료 시 재시작.
- 표시 문자열보다 안정적인 ID(예: `chat_id`)를 선호하세요.

## 관련 항목

- [Gateway 프로토콜](/ko/gateway/protocol)
