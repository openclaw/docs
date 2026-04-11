---
read_when:
    - 어떤 채널에서든 반응 작업하기
    - 플랫폼마다 이모지 반응이 어떻게 다른지 이해하기
summary: 지원되는 모든 채널에서의 반응 도구 의미 체계
title: 반응ებები
x-i18n:
    generated_at: "2026-04-11T02:48:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: cfac31b7f0effc89cc696e3cf34cd89503ccdbb28996723945025e4b6e159986
    source_path: tools/reactions.md
    workflow: 15
---

# 반응

에이전트는 `message`
도구의 `react` 작업을 사용해 메시지에 이모지 반응을 추가하거나 제거할 수 있습니다. 반응 동작은 채널마다 다릅니다.

## 동작 방식

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- 반응을 추가할 때는 `emoji`가 필수입니다.
- 봇의 반응을 제거하려면 `emoji`를 빈 문자열(`""`)로 설정하세요.
- 특정 이모지만 제거하려면 `remove: true`를 설정하세요(비어 있지 않은 `emoji` 필요).

## 채널별 동작

<AccordionGroup>
  <Accordion title="Discord and Slack">
    - 빈 `emoji`는 해당 메시지에서 봇의 모든 반응을 제거합니다.
    - `remove: true`는 지정한 이모지만 제거합니다.
  </Accordion>

  <Accordion title="Google Chat">
    - 빈 `emoji`는 해당 메시지에서 앱의 반응을 제거합니다.
    - `remove: true`는 지정한 이모지만 제거합니다.
  </Accordion>

  <Accordion title="Telegram">
    - 빈 `emoji`는 봇의 반응을 제거합니다.
    - `remove: true`도 반응을 제거하지만, 도구 검증을 위해 여전히 비어 있지 않은 `emoji`가 필요합니다.
  </Accordion>

  <Accordion title="WhatsApp">
    - 빈 `emoji`는 봇 반응을 제거합니다.
    - `remove: true`는 내부적으로 빈 이모지로 매핑됩니다(그래도 도구 호출에는 `emoji`가 필요함).
  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - 비어 있지 않은 `emoji`가 필요합니다.
    - `remove: true`는 해당 특정 이모지 반응을 제거합니다.
  </Accordion>

  <Accordion title="Feishu/Lark">
    - 작업 `add`, `remove`, `list`가 있는 `feishu_reaction` 도구를 사용하세요.
    - 추가/제거에는 `emoji_type`이 필요하고, 제거에는 `reaction_id`도 필요합니다.
  </Accordion>

  <Accordion title="Signal">
    - 수신 반응 알림은 `channels.signal.reactionNotifications`로 제어됩니다: `"off"`는 이를 비활성화하고, `"own"`(기본값)은 사용자가 봇 메시지에 반응할 때 이벤트를 발생시키며, `"all"`은 모든 반응에 대해 이벤트를 발생시킵니다.
  </Accordion>
</AccordionGroup>

## 반응 수준

채널별 `reactionLevel` config는 에이전트가 반응을 얼마나 폭넓게 사용하는지 제어합니다. 값은 일반적으로 `off`, `ack`, `minimal`, `extensive`입니다.

- [Telegram reactionLevel](/ko/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/ko/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

각 채널에서 `reactionLevel`을 설정해 에이전트가 해당 플랫폼의 메시지에 얼마나 적극적으로 반응할지 조정하세요.

## 관련 항목

- [Agent Send](/ko/tools/agent-send) — `react`를 포함하는 `message` 도구
- [Channels](/ko/channels) — 채널별 구성
