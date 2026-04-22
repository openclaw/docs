---
read_when:
    - 입력 중 표시 동작 또는 기본값 변경하기
summary: OpenClaw가 입력 중 표시를 보여주는 경우와 이를 조정하는 방법
title: 입력 중 표시
x-i18n:
    generated_at: "2026-04-22T06:00:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2e7e8ca448b6706b6f53fcb6a582be6d4a84715c82dfde3d53abe4268af3ae0d
    source_path: concepts/typing-indicators.md
    workflow: 15
---

# 입력 중 표시

실행이 활성화되어 있는 동안 입력 중 표시는 채팅 채널로 전송됩니다.  
입력이 **언제** 시작되는지는 `agents.defaults.typingMode`로 제어하고, **얼마나 자주** 새로 고침되는지는 `typingIntervalSeconds`로 제어합니다.

## 기본값

`agents.defaults.typingMode`가 **설정되지 않은 경우**, OpenClaw는 기존 동작을 유지합니다.

- **개인 채팅**: 모델 루프가 시작되면 즉시 입력이 시작됩니다.
- **멘션이 있는 그룹 채팅**: 즉시 입력이 시작됩니다.
- **멘션이 없는 그룹 채팅**: 메시지 텍스트 스트리밍이 시작될 때만 입력이 시작됩니다.
- **Heartbeat 실행**: 확인된 Heartbeat 대상이 입력 중 표시를 지원하는 채팅이고 입력 중 표시가 비활성화되어 있지 않으면, Heartbeat 실행이 시작될 때 입력이 시작됩니다.

## 모드

`agents.defaults.typingMode`를 다음 중 하나로 설정합니다.

- `never` — 입력 중 표시를 전혀 보내지 않습니다.
- `instant` — 실행이 나중에 무음 응답 토큰만 반환하더라도, **모델 루프가 시작되자마자** 입력을 시작합니다.
- `thinking` — **첫 번째 reasoning delta**에서 입력을 시작합니다(이 실행에 `reasoningLevel: "stream"` 필요).
- `message` — **첫 번째 비무음 텍스트 delta**에서 입력을 시작합니다(`NO_REPLY` 무음 토큰은 무시).

“얼마나 빨리 시작되는지” 순서:
`never` → `message` → `thinking` → `instant`

## 구성

```json5
{
  agent: {
    typingMode: "thinking",
    typingIntervalSeconds: 6,
  },
}
```

세션별로 모드나 주기를 재정의할 수 있습니다.

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## 참고

- `message` 모드에서는 전체 페이로드가 정확히 무음 토큰인 경우 무음 전용 응답에 대해 입력 중 표시가 나타나지 않습니다(예: `NO_REPLY` / `no_reply`, 대소문자 구분 없이 일치).
- `thinking`은 실행이 reasoning을 스트리밍하는 경우에만 작동합니다(`reasoningLevel: "stream"`). 모델이 reasoning delta를 내보내지 않으면 입력이 시작되지 않습니다.
- Heartbeat 입력 중 표시는 확인된 전송 대상에 대한 활성 상태 신호입니다. `message` 또는 `thinking` 스트림 타이밍을 따르지 않고 Heartbeat 실행 시작 시 시작됩니다. 이를 비활성화하려면 `typingMode: "never"`로 설정하세요.
- `target: "none"`인 경우, 대상을 확인할 수 없는 경우, Heartbeat에 대해 채팅 전송이 비활성화된 경우, 또는 채널이 입력 중 표시를 지원하지 않는 경우 Heartbeat는 입력 중 표시를 보여주지 않습니다.
- `typingIntervalSeconds`는 시작 시간이 아니라 **새로 고침 주기**를 제어합니다. 기본값은 6초입니다.
