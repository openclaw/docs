---
read_when:
    - 모든 채널에서 반응 처리하기
    - 플랫폼별 이모지 반응의 차이 이해하기
summary: 지원되는 모든 채널에서의 반응 도구 의미 체계
title: 반응
x-i18n:
    generated_at: "2026-06-27T18:16:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2dc9575eaeb79a56ca82ee491c2974e9984b1a12999762b1532ca9affdbbd72f
    source_path: tools/reactions.md
    workflow: 16
---

에이전트는 `react` 작업과 함께 `message`
도구를 사용하여 메시지에 이모지 반응을 추가하고 제거할 수 있습니다. 반응 동작은 채널과 전송 방식에 따라 달라집니다.

## 작동 방식

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- 반응을 추가할 때는 `emoji`가 필요합니다.
- 봇의 반응을 제거하려면 `emoji`를 빈 문자열(`""`)로 설정합니다.
- 특정 이모지를 제거하려면 `remove: true`를 설정합니다(비어 있지 않은 `emoji` 필요).
- 상태 반응을 지원하는 채널에서는 반응의 `trackToolCalls: true`를 통해 런타임이 같은 턴 동안 이후 도구 진행 반응에 해당 반응이 달린 메시지를 사용할 수 있습니다.

## 채널 동작

<AccordionGroup>
  <Accordion title="Discord 및 Slack">
    - 빈 `emoji`는 메시지에서 봇의 모든 반응을 제거합니다.
    - `remove: true`는 지정된 이모지만 제거합니다.

  </Accordion>

  <Accordion title="Google Chat">
    - 빈 `emoji`는 메시지에서 앱의 반응을 제거합니다.
    - `remove: true`는 지정된 이모지만 제거합니다.

  </Accordion>

  <Accordion title="Nextcloud Talk">
    - 반응 추가만 가능: `emoji`가 필요하며 비어 있으면 안 됩니다.
    - 반응 제거는 아직 지원되지 않습니다. `remove: true`(또는 빈 `emoji`)를 사용한 호출은 조용히 아무 작업도 하지 않는 대신 명확한 오류와 함께 거부됩니다.
    - Talk 봇이 `reaction` 기능으로 등록되어 있어야 합니다([Nextcloud Talk 채널 문서](/ko/channels/nextcloud-talk) 참조).

  </Accordion>

  <Accordion title="Telegram">
    - 빈 `emoji`는 봇의 반응을 제거합니다.
    - `remove: true`도 반응을 제거하지만, 도구 검증을 위해 여전히 비어 있지 않은 `emoji`가 필요합니다.

  </Accordion>

  <Accordion title="WhatsApp">
    - 빈 `emoji`는 봇 반응을 제거합니다.
    - `remove: true`는 내부적으로 빈 이모지에 매핑됩니다(그래도 도구 호출에는 `emoji`가 필요함).
    - WhatsApp은 메시지당 봇 반응 슬롯이 하나입니다. 상태 반응 업데이트는 여러 이모지를 쌓지 않고 해당 슬롯을 대체합니다.

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - 비어 있지 않은 `emoji`가 필요합니다.
    - `remove: true`는 해당 특정 이모지 반응을 제거합니다.

  </Accordion>

  <Accordion title="Feishu/Lark">
    - `add`, `remove`, `list` 작업과 함께 `feishu_reaction` 도구를 사용합니다.
    - 추가/제거에는 `emoji_type`이 필요하며, 제거에는 `reaction_id`도 필요합니다.

  </Accordion>

  <Accordion title="Signal">
    - 수신 반응 알림은 `channels.signal.reactionNotifications`로 제어됩니다. `"off"`는 이를 비활성화하고, `"own"`(기본값)은 사용자가 봇 메시지에 반응할 때 이벤트를 내보내며, `"all"`은 모든 반응에 대해 이벤트를 내보냅니다.

  </Accordion>

  <Accordion title="iMessage">
    - 발신 반응은 iMessage 탭백(`love`, `like`, `dislike`, `laugh`, `emphasize`, `question`)입니다.
    - 수신 탭백 알림은 `channels.imessage.reactionNotifications`로 제어됩니다. `"off"`는 이를 비활성화하고, `"own"`(기본값)은 사용자가 봇이 작성한 메시지에 반응할 때 이벤트를 내보내며, `"all"`은 승인된 발신자의 모든 탭백에 대해 이벤트를 내보냅니다.

  </Accordion>
</AccordionGroup>

## 반응 수준

채널별 `reactionLevel` 구성은 에이전트가 반응을 얼마나 폭넓게 사용하는지 제어합니다. 값은 일반적으로 `off`, `ack`, `minimal` 또는 `extensive`입니다.

- [Telegram reactionLevel](/ko/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/ko/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

각 플랫폼에서 에이전트가 메시지에 얼마나 적극적으로 반응할지 조정하려면 개별 채널에 `reactionLevel`을 설정합니다.

## 관련 항목

- [에이전트 전송](/ko/tools/agent-send) — `react`를 포함하는 `message` 도구
- [채널](/ko/channels) — 채널별 구성
