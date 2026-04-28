---
read_when:
    - 모든 채널에서 리액션 작업하기
    - 플랫폼마다 이모지 리액션이 어떻게 다른지 이해하기
summary: 지원되는 모든 채널에서의 reaction 도구 의미 체계
title: 리액션
x-i18n:
    generated_at: "2026-04-24T06:41:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 58d9a85114e715fd1813a4d662b02a6b8b9cad9a8eea9c63d024a933ba573a65
    source_path: tools/reactions.md
    workflow: 15
---

에이전트는 `message`
도구의 `react` 작업을 사용해 메시지에 이모지 리액션을 추가하거나 제거할 수 있습니다. 리액션 동작은 채널마다 다릅니다.

## 작동 방식

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- 리액션을 추가할 때는 `emoji`가 필요합니다.
- 봇의 리액션을 제거하려면 `emoji`를 빈 문자열(`""`)로 설정하세요.
- 특정 이모지를 제거하려면 `remove: true`를 설정하세요(`emoji`는 비어 있지 않아야 함).

## 채널별 동작

<AccordionGroup>
  <Accordion title="Discord 및 Slack">
    - 빈 `emoji`는 해당 메시지에서 봇의 모든 리액션을 제거합니다.
    - `remove: true`는 지정한 이모지만 제거합니다.

  </Accordion>

  <Accordion title="Google Chat">
    - 빈 `emoji`는 메시지에서 앱의 리액션을 제거합니다.
    - `remove: true`는 지정한 이모지만 제거합니다.

  </Accordion>

  <Accordion title="Telegram">
    - 빈 `emoji`는 봇의 리액션을 제거합니다.
    - `remove: true`도 리액션을 제거하지만, 도구 검증을 위해 여전히 비어 있지 않은 `emoji`가 필요합니다.

  </Accordion>

  <Accordion title="WhatsApp">
    - 빈 `emoji`는 봇 리액션을 제거합니다.
    - `remove: true`는 내부적으로 빈 이모지로 매핑됩니다(여전히 도구 호출에는 `emoji`가 필요함).

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - 비어 있지 않은 `emoji`가 필요합니다.
    - `remove: true`는 해당 특정 이모지 리액션을 제거합니다.

  </Accordion>

  <Accordion title="Feishu/Lark">
    - 작업 `add`, `remove`, `list`가 있는 `feishu_reaction` 도구를 사용하세요.
    - 추가/제거에는 `emoji_type`이 필요하고, 제거에는 `reaction_id`도 필요합니다.

  </Accordion>

  <Accordion title="Signal">
    - 인바운드 리액션 알림은 `channels.signal.reactionNotifications`로 제어됩니다. `"off"`는 이를 비활성화하고, `"own"`(기본값)은 사용자가 봇 메시지에 리액션할 때 이벤트를 발생시키며, `"all"`은 모든 리액션에 대해 이벤트를 발생시킵니다.

  </Accordion>
</AccordionGroup>

## 리액션 수준

채널별 `reactionLevel` 구성은 에이전트가 리액션을 얼마나 넓게 사용하는지 제어합니다. 값은 일반적으로 `off`, `ack`, `minimal`, `extensive`입니다.

- [Telegram reactionLevel](/ko/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/ko/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

각 채널에서 `reactionLevel`을 설정해 에이전트가 각 플랫폼의 메시지에 얼마나 적극적으로 리액션할지 조정하세요.

## 관련

- [에이전트 전송](/ko/tools/agent-send) — `react`를 포함하는 `message` 도구
- [채널](/ko/channels) — 채널별 구성
