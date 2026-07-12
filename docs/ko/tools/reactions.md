---
read_when:
    - 모든 채널에서 반응 처리하기
    - 플랫폼별 이모지 반응의 차이 이해하기
summary: 지원되는 모든 채널에서의 반응 도구 의미 체계
title: 반응
x-i18n:
    generated_at: "2026-07-12T15:50:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e148a93edbcfbe997075f6e9e191667ec257f76fa48162688fd1f333479661f0
    source_path: tools/reactions.md
    workflow: 16
---

에이전트는 `message` 도구의 `react` 작업을 사용하여 이모지 반응을 추가하고 제거합니다. 동작은 채널마다 다릅니다.

## 작동 방식

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- 반응을 추가할 때는 `emoji`가 필수입니다.
- 이를 지원하는 채널에서 봇의 반응을 제거하려면 `emoji`를 빈 문자열(`""`)로 설정하십시오.
- 특정 이모지 하나를 제거하려면 `remove: true`를 설정하십시오(`emoji`는 비어 있지 않아야 합니다).
- 상태 반응을 지원하는 채널에서 반응에 `trackToolCalls: true`를 설정하면 런타임이 같은 턴에서 이후 도구 진행 상황 반응에 해당 반응 메시지를 재사용할 수 있습니다.

## 채널별 동작

<AccordionGroup>
  <Accordion title="Discord 및 Slack">
    - 빈 `emoji`는 메시지에서 봇의 모든 반응을 제거합니다.
    - `remove: true`는 지정한 이모지만 제거합니다.

  </Accordion>

  <Accordion title="Nextcloud Talk">
    - 반응 추가만 지원합니다. `emoji`는 필수이며 비어 있지 않아야 합니다.
    - 반응 제거는 아직 삭제 호출에 연결되어 있지 않습니다. `remove: true`는 아무 동작 없이 무시되는 대신 명시적인 오류와 함께 거부됩니다.
    - `reaction` 기능으로 등록된 Talk 봇이 필요합니다([Nextcloud Talk 채널 문서](/ko/channels/nextcloud-talk) 참조).

  </Accordion>

  <Accordion title="Telegram">
    - 빈 `emoji`는 봇의 반응을 제거합니다.
    - `remove: true`도 반응을 제거하지만, 도구 유효성 검사를 위해 `emoji`가 비어 있지 않아야 합니다.

  </Accordion>

  <Accordion title="WhatsApp">
    - 빈 `emoji`는 봇 반응을 제거합니다.
    - `remove: true`는 내부적으로 빈 이모지에 매핑됩니다(도구 호출에는 여전히 `emoji`가 필요합니다).
    - WhatsApp에는 메시지당 봇 반응 슬롯이 하나만 있습니다. 새 반응을 보내면 여러 이모지가 누적되지 않고 기존 반응을 대체합니다.

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - 추가와 제거 모두 `emoji`가 비어 있지 않아야 합니다.
    - `remove: true`는 해당하는 특정 이모지 반응을 제거합니다.

  </Accordion>

  <Accordion title="Feishu/Lark">
    - 별도 도구가 아니라 다른 채널과 동일한 `react` 작업을 사용합니다(메시지 반응 ID를 통해 추가/제거/목록 조회).
    - 추가하려면 비어 있지 않은 `emoji`가 필요합니다(Feishu `emoji_type`으로 매핑됨, 예: `SMILE`, `THUMBSUP`, `HEART`).
    - `remove: true`에는 비어 있지 않은 `emoji`가 필요하며, 해당 이모지 유형과 일치하는 봇 자체의 반응을 제거합니다.
    - 빈 `emoji`와 함께 `clearAll: true`를 설정하면 메시지에서 봇의 모든 반응을 제거합니다.

  </Accordion>

  <Accordion title="Signal">
    - 수신 반응 알림은 `channels.signal.reactionNotifications`로 제어합니다. `"off"`는 알림을 비활성화하고, `"own"`(기본값)은 사용자가 봇 메시지에 반응할 때 이벤트를 내보내며, `"all"`은 모든 반응에 대해 이벤트를 내보내고, `"allowlist"`는 `channels.signal.reactionAllowlist`에 있는 발신자에 대해서만 이벤트를 내보냅니다.

  </Accordion>

  <Accordion title="iMessage">
    - 발신 반응은 iMessage 탭백(`love`, `like`, `dislike`, `laugh`, `emphasize`, `question`)입니다. 반응을 추가하려면 `emoji`가 이 유형 중 하나에 매핑되어야 합니다.
    - 인식되는 탭백 유형 없이 `remove: true`를 설정하면 모든 탭백 유형을 제거하고, 인식되는 유형과 함께 설정하면 해당 유형만 제거합니다.

  </Accordion>
</AccordionGroup>

## 반응 수준

채널별 `reactionLevel`은 에이전트가 자체 반응을 보내는 빈도를 제한합니다. 값은 `off`, `ack`, `minimal`, `extensive`입니다.

- [Telegram 반응 알림](/ko/channels/telegram#feature-reference) - `channels.telegram.reactionLevel`(기본값 `minimal`)
- [WhatsApp 반응 수준](/ko/channels/whatsapp#reaction-level) - `channels.whatsapp.reactionLevel`(기본값 `minimal`)
- [Signal 반응](/ko/channels/signal#reactions-message-tool) - `channels.signal.reactionLevel`(기본값 `minimal`)

## 관련 항목

- [에이전트 전송](/ko/tools/agent-send) - `react`를 포함하는 `message` 도구
- [채널](/ko/channels) - 채널별 구성
