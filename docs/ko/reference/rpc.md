---
read_when:
    - 외부 CLI 통합 추가 또는 변경
    - RPC 어댑터 디버깅(signal-cli, imsg)
summary: 외부 CLI(signal-cli, imsg)용 RPC 어댑터 및 Gateway 패턴
title: RPC 어댑터
x-i18n:
    generated_at: "2026-07-12T15:44:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6ddb3fb741c90fe7b01ba35376b71865584b1e507cf610705392452790fb76f5
    source_path: reference/rpc.md
    workflow: 16
---

OpenClaw은 JSON-RPC를 통해 외부 CLI를 통합합니다. 현재 두 가지 패턴을 사용합니다.

## 패턴 A: HTTP 데몬(signal-cli)

- `signal-cli`는 HTTP를 통한 JSON-RPC 데몬으로 실행됩니다.
- 이벤트 스트림은 SSE(`/api/v1/events`)입니다.
- 상태 점검: `/api/v1/check`.
- `channels.signal.autoStart=true`이면 OpenClaw이 수명 주기를 관리합니다.

설정 및 엔드포인트는 [Signal](/ko/channels/signal)을 참조하십시오.

## 패턴 B: stdio 자식 프로세스(imsg)

- OpenClaw은 [iMessage](/ko/channels/imessage)를 위해 `imsg rpc`를 자식 프로세스로 실행합니다.
- JSON-RPC는 stdin/stdout을 통해 줄 단위로 구분됩니다(줄마다 JSON 객체 하나).
- TCP 포트가 없으며 데몬도 필요하지 않습니다.

사용되는 핵심 메서드는 다음과 같습니다.

- `watch.subscribe` → 알림(`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list`(점검/진단)

설정 및 주소 지정은 [iMessage](/ko/channels/imessage)를 참조하십시오(표시 문자열보다 `chat_id` 사용 권장).

## 어댑터 지침

- Gateway가 프로세스를 관리합니다(시작/중지는 제공자 수명 주기에 연동됨).
- RPC 클라이언트의 복원력을 유지하십시오. 시간 제한을 설정하고 종료 시 다시 시작해야 합니다.
- 표시 문자열보다 안정적인 ID(예: `chat_id`)를 우선 사용하십시오.

## 관련 문서

- [Gateway 프로토콜](/ko/gateway/protocol)
