---
read_when:
    - 입력 중 표시기 동작 또는 기본값 변경
summary: OpenClaw가 입력 표시기를 표시하는 경우와 이를 조정하는 방법
title: 입력 중 표시기
x-i18n:
    generated_at: "2026-05-10T19:33:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: e26b4008f165527098ffcbf9c39ee7179149063842cc5c6aacb5b7c606eedc26
    source_path: concepts/typing-indicators.md
    workflow: 16
---

입력 중 표시는 실행이 활성 상태인 동안 채팅 채널로 전송됩니다.
`agents.defaults.typingMode`를 사용해 입력 중 표시가 **언제** 시작되는지 제어하고, `typingIntervalSeconds`로 **얼마나 자주** 새로 고침되는지 제어합니다.

## 기본값

`agents.defaults.typingMode`가 **설정되지 않은** 경우, OpenClaw는 기존 동작을 유지합니다.

- **직접 채팅**: 모델 루프가 시작되면 입력 중 표시가 즉시 시작됩니다.
- **멘션이 있는 그룹 채팅**: 입력 중 표시가 즉시 시작됩니다.
- **멘션이 없는 그룹 채팅**: 메시지 텍스트 스트리밍이 시작될 때만 입력 중 표시가 시작됩니다.
- **Heartbeat 실행**: 확정된 Heartbeat 대상이 입력 중 표시를 지원하는 채팅이고 입력 중 표시가 비활성화되어 있지 않으면, Heartbeat 실행이 시작될 때 입력 중 표시가 시작됩니다.

## 모드

`agents.defaults.typingMode`를 다음 중 하나로 설정하세요.

- `never` - 입력 중 표시를 전혀 표시하지 않습니다.
- `instant` - 실행이 나중에 무음 응답 토큰만 반환하더라도, **모델 루프가 시작되는 즉시** 입력 중 표시를 시작합니다.
- `thinking` - **첫 번째 추론 델타**에서 입력 중 표시를 시작합니다(해당 실행에 `reasoningLevel: "stream"` 필요).
- `message` - **첫 번째 무음이 아닌 텍스트 델타**에서 입력 중 표시를 시작합니다(`NO_REPLY` 무음 토큰은 무시).

"얼마나 일찍 발생하는지"의 순서:
`never` → `message` → `thinking` → `instant`

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

- `message` 모드는 전체 페이로드가 정확한 무음 토큰인 경우(예: `NO_REPLY` / `no_reply`, 대소문자 구분 없이 일치) 무음 전용 응답에 대해 입력 중 표시를 표시하지 않습니다.
- `thinking`은 실행이 추론을 스트리밍하는 경우(`reasoningLevel: "stream"`)에만 발생합니다.
  모델이 추론 델타를 내보내지 않으면 입력 중 표시가 시작되지 않습니다.
- Heartbeat 입력 중 표시는 확정된 전달 대상에 대한 활성 상태 신호입니다. `message` 또는 `thinking` 스트림 타이밍을 따르는 대신 Heartbeat 실행 시작 시점에 시작됩니다. 비활성화하려면 `typingMode: "never"`를 설정하세요.
- `target: "none"`인 경우, 대상을 확정할 수 없는 경우, Heartbeat의 채팅 전달이 비활성화된 경우, 또는 채널이 입력 중 표시를 지원하지 않는 경우 Heartbeat는 입력 중 표시를 표시하지 않습니다.
- `typingIntervalSeconds`는 시작 시간이 아니라 **새로 고침 주기**를 제어합니다.
  기본값은 6초입니다.

## 관련 항목

<CardGroup cols={2}>
  <Card title="Presence" href="/ko/concepts/presence" icon="signal">
    Gateway가 연결된 클라이언트를 추적하고 macOS Instances 탭에 표시하는 방식입니다.
  </Card>
  <Card title="스트리밍 및 청킹" href="/ko/concepts/streaming" icon="bars-staggered">
    아웃바운드 스트리밍 동작, 청크 경계, 채널별 전달입니다.
  </Card>
</CardGroup>
