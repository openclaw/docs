---
read_when:
    - 입력 중 표시기 동작 또는 기본값 변경
summary: OpenClaw가 입력 중 표시기를 표시하는 시점과 조정 방법
title: 입력 중 표시기
x-i18n:
    generated_at: "2026-06-27T17:26:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fa76889d0f6262f1092abefee02aee8fe944651dc89d3a697ccc86e16558ed60
    source_path: concepts/typing-indicators.md
    workflow: 16
---

실행이 활성 상태인 동안 채팅 채널로 입력 중 표시가 전송됩니다. 입력이 **언제** 시작되는지는
`agents.defaults.typingMode`로 제어하고, **얼마나 자주** 새로 고침되는지는
`typingIntervalSeconds`로 제어합니다.

## 기본값

`agents.defaults.typingMode`가 **설정되지 않은** 경우 OpenClaw는 기존 동작을 유지합니다.

- **직접 채팅**: 모델 루프가 시작되면 입력이 즉시 시작됩니다.
- **멘션이 있는 그룹 채팅**: 입력이 즉시 시작됩니다.
- **멘션이 없는 그룹 채팅**: 승인된 실행에 하네스 실행 활동이나 메시지 텍스트처럼
  사용자에게 보이는 활동이 있을 때 입력이 시작됩니다.
- **Heartbeat 실행**: 확인된 Heartbeat 대상이 입력 기능을 지원하는 채팅이고 입력이 비활성화되어 있지 않으면
  Heartbeat 실행이 시작될 때 입력이 시작됩니다.

## 모드

`agents.defaults.typingMode`를 다음 중 하나로 설정합니다.

- `never` - 입력 중 표시를 절대 표시하지 않습니다.
- `instant` - 실행이 나중에 무음 응답 토큰만 반환하더라도
  **모델 루프가 시작되자마자** 입력을 시작합니다.
- `thinking` - 턴이 수락된 뒤 **첫 번째 추론 델타** 또는 활성
  하네스 실행에서 입력을 시작합니다.
- `message` - 활성 하네스 실행이나 무음이 아닌 텍스트 델타처럼
  **사용자에게 보이는 첫 응답 활동**에서 입력을 시작합니다. `NO_REPLY` 같은 무음 응답 토큰은
  텍스트 활동으로 계산되지 않습니다.

"얼마나 빨리 실행되는지"의 순서:
`never` → `message`/`thinking` → `instant`

## 구성

에이전트 수준 기본값을 설정합니다.

```json5
{
  agents: {
    defaults: {
      typingMode: "thinking",
      typingIntervalSeconds: 6,
    },
  },
}
```

세션별로 모드 또는 주기를 재정의합니다.

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## 참고

- `message` 모드는 무음 응답 토큰에서 시작하지 않지만, 활성 실행은
  어시스턴트 텍스트가 제공되기 전에도 입력 중 표시를 보여줄 수 있습니다.
- `thinking`은 여전히 스트리밍된 추론(`reasoningLevel: "stream"`)에 반응하며,
  추론 델타가 도착하기 전에도 활성 실행에서 시작될 수 있습니다.
- Heartbeat 입력은 확인된 전달 대상에 대한 활성 상태 신호입니다. 이는
  `message` 또는 `thinking` 스트림 타이밍을 따르는 대신 Heartbeat 실행 시작 시점에
  시작됩니다. 비활성화하려면 `typingMode: "never"`를 설정합니다.
- Heartbeat는 `target: "none"`일 때, 대상을 확인할 수 없을 때,
  Heartbeat에 대해 채팅 전달이 비활성화되어 있을 때, 또는
  채널이 입력을 지원하지 않을 때 입력을 표시하지 않습니다.
- `typingIntervalSeconds`는 시작 시간이 아니라 **새로 고침 주기**를 제어합니다.
  기본값은 6초입니다.

## 관련 항목

<CardGroup cols={2}>
  <Card title="Presence" href="/ko/concepts/presence" icon="signal">
    Gateway가 연결된 클라이언트를 추적하고 macOS 인스턴스 탭에 표시하는 방식입니다.
  </Card>
  <Card title="스트리밍 및 청크 처리" href="/ko/concepts/streaming" icon="bars-staggered">
    아웃바운드 스트리밍 동작, 청크 경계, 채널별 전달입니다.
  </Card>
</CardGroup>
