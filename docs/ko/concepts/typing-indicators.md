---
read_when:
    - 입력 중 표시기 동작 또는 기본값 변경하기
summary: OpenClaw가 입력 중 표시를 보여 주는 시점과 이를 조정하는 방법
title: 입력 중 표시기
x-i18n:
    generated_at: "2026-07-12T15:13:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 55e5ec38f47e0612b25b5561790e9b8a17ea4e215c4038bb89af83f861089e03
    source_path: concepts/typing-indicators.md
    workflow: 16
---

실행이 활성 상태인 동안 채팅 채널에 입력 중 표시기가 전송됩니다. `agents.defaults.typingMode`를 사용하여 입력이 **언제** 시작되는지 제어하고, `typingIntervalSeconds`를 사용하여 **얼마나 자주** 새로 고치는지 제어합니다(연결 유지 주기, 기본값 6초).

## 기본값

`agents.defaults.typingMode`가 **설정되지 않은** 경우:

- **다이렉트 채팅**: 모델 루프가 시작되는 즉시 입력 표시가 시작됩니다.
- **멘션이 있는 그룹 채팅**: 입력 표시가 즉시 시작됩니다.
- **멘션이 없는 그룹 채팅**: 허용된 실행에서 하네스 실행 활동이나 메시지 텍스트처럼 사용자에게 표시되는 활동이 발생하면 입력 표시가 시작됩니다.
- **Heartbeat 실행**: 확인된 Heartbeat 대상이 입력 표시를 지원하는 채팅이고 입력 표시가 비활성화되지 않은 경우, Heartbeat 실행이 시작될 때 입력 표시가 시작됩니다.

## 모드

`agents.defaults.typingMode`를 다음 중 하나로 설정합니다.

- `never` - 입력 표시기를 전혀 표시하지 않습니다.
- `instant` - 실행이 나중에 무응답 토큰만 반환하더라도 **모델 루프가 시작되는 즉시** 입력 표시를 시작합니다.
- `thinking` - **첫 번째 추론 델타**에서 또는 턴이 수락된 후 활성 하네스 실행이 시작될 때 입력 표시를 시작합니다.
- `message` - 활성 하네스 실행이나 무응답이 아닌 텍스트 델타처럼 **사용자에게 표시되는 첫 번째 응답 활동**에서 입력 표시를 시작합니다. `NO_REPLY`와 같은 무응답 토큰은 텍스트 활동으로 간주되지 않습니다.

"얼마나 일찍 작동하는지"의 순서: `never` -> `message`/`thinking` -> `instant`.

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

- `message` 모드는 무응답 토큰으로 인해 시작되지 않지만, 활성 실행 중에는 어시스턴트 텍스트가 제공되기 전에도 입력 표시가 나타날 수 있습니다.
- `thinking`은 스트리밍된 추론(`reasoningLevel: "stream"`)에 계속 반응하며, 추론 델타가 도착하기 전에도 활성 실행으로 인해 시작될 수 있습니다.
- Heartbeat 입력 표시는 확인된 전송 대상에 대한 활성 상태 신호입니다. `message` 또는 `thinking`의 스트림 타이밍을 따르지 않고 Heartbeat 실행이 시작될 때 표시됩니다. 비활성화하려면 `typingMode: "never"`로 설정하십시오.
- Heartbeat 대상이 `"none"`이거나, 대상을 확인할 수 없거나, Heartbeat의 채팅 전송이 비활성화되어 있거나, 채널이 입력 표시를 지원하지 않는 경우 Heartbeat는 입력 표시를 나타내지 않습니다.
- `typingIntervalSeconds`는 시작 시간이 아니라 **새로 고침 주기**를 제어합니다. 기본값: 6초.

## 관련 항목

<CardGroup cols={2}>
  <Card title="프레즌스" href="/ko/concepts/presence" icon="signal">
    Gateway가 Control UI의 Devices 페이지와 macOS Instances 탭을 위해 연결된 클라이언트를 추적하는 방식입니다.
  </Card>
  <Card title="스트리밍 및 청킹" href="/ko/concepts/streaming" icon="bars-staggered">
    아웃바운드 스트리밍 동작, 청크 경계 및 채널별 전송 방식입니다.
  </Card>
</CardGroup>
