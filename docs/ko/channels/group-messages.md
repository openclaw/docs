---
read_when:
    - WhatsApp 그룹을 구체적으로 구성하기
    - WhatsApp 활성화 모드 변경(`mention` 대 `always`)
    - WhatsApp 그룹 세션 키 또는 보류 중인 메시지 컨텍스트 조정
sidebarTitle: WhatsApp groups
summary: WhatsApp 그룹 메시지 처리 — 활성화, 허용 목록, 세션 및 컨텍스트 주입
title: WhatsApp 그룹 메시지
x-i18n:
    generated_at: "2026-06-27T17:10:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 790866fd959b43d94b745082f3c90920b81c0a016492e9e164c600663f1b2eee
    source_path: channels/group-messages.md
    workflow: 16
---

교차 채널 그룹 모델(Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo)은 [그룹](/ko/channels/groups)을 참조하세요. 이 페이지에서는 해당 모델 위에 더해지는 WhatsApp 전용 동작을 다룹니다. 활성화, 그룹 허용 목록, 그룹별 세션 키, 대기 메시지 컨텍스트 주입입니다.

목표: OpenClaw가 WhatsApp 그룹에 들어가 있다가 호출될 때만 깨어나고, 해당 스레드를 개인 DM 세션과 분리해 유지하도록 합니다.

<Note>
`agents.list[].groupChat.mentionPatterns`는 Telegram, Discord, Slack, iMessage에서도 사용됩니다. 다중 에이전트 구성에서는 에이전트별로 설정하거나, 전역 폴백으로 `messages.groupChat.mentionPatterns`를 사용하세요.
</Note>

## 동작

- 활성화 모드: `mention`(기본값) 또는 `always`. `mention`에는 호출이 필요합니다. `mentionedJids`를 통한 실제 WhatsApp @멘션, 안전한 정규식 패턴, 또는 텍스트 어디에든 있는 봇의 E.164 번호가 해당합니다. `always`는 모든 메시지에서 에이전트를 깨우지만, 의미 있는 가치를 더할 수 있을 때만 응답해야 합니다. 그렇지 않으면 정확한 무응답 토큰 `NO_REPLY` / `no_reply`를 반환합니다. 기본값은 설정(`channels.whatsapp.groups`)에서 지정할 수 있고, `/activation`으로 그룹별 재정의할 수 있습니다. `channels.whatsapp.groups`가 설정되면 그룹 허용 목록으로도 동작합니다. 모두 허용하려면 `"*"`를 포함하세요.
- 그룹 정책: `channels.whatsapp.groupPolicy`는 그룹 메시지를 수락할지 제어합니다(`open|disabled|allowlist`). `allowlist`는 `channels.whatsapp.groupAllowFrom`을 사용합니다(폴백: 명시적 `channels.whatsapp.allowFrom`). 기본값은 `allowlist`입니다(발신자를 추가할 때까지 차단).
- 그룹별 세션: 세션 키는 `agent:<agentId>:whatsapp:group:<jid>` 형식이므로 독립 메시지로 보낸 `/verbose on`, `/trace on`, `/think high` 같은 명령은 해당 그룹에만 적용됩니다. 개인 DM 상태는 건드리지 않습니다. 그룹 스레드에서는 Heartbeat를 건너뜁니다.
- 컨텍스트 주입: 실행을 트리거하지 않은 **대기 중인 메시지만** 기본 50개까지 `[Chat messages since your last reply - for context]` 아래에 접두어로 추가되고, 트리거한 줄은 `[Current message - respond to this]` 아래에 들어갑니다. 이미 세션에 있는 메시지는 다시 주입되지 않습니다.
- 발신자 표시: 이제 모든 그룹 배치는 `[from: Sender Name (+E164)]`로 끝나므로 OpenClaw가 누가 말하는지 알 수 있습니다.
- 임시/1회 보기: 텍스트와 멘션을 추출하기 전에 이를 풀어내므로, 그 안의 호출도 여전히 트리거됩니다.
- 그룹 시스템 프롬프트: 그룹 세션의 첫 턴에서, 그리고 `/activation`이 모드를 변경할 때마다 `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), ... Activation: trigger-only ... Address the specific sender noted in the message context.` 같은 짧은 설명을 시스템 프롬프트에 주입합니다. 메타데이터를 사용할 수 없어도 에이전트에게 그룹 채팅임을 알려줍니다.

## 설정 예시(WhatsApp)

WhatsApp이 텍스트 본문에서 시각적 `@`를 제거하더라도 표시 이름 호출이 동작하도록 `~/.openclaw/openclaw.json`에 `groupChat` 블록을 추가하세요.

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          historyLimit: 50,
          mentionPatterns: ["@?openclaw", "\\+?15555550123"],
        },
      },
    ],
  },
}
```

참고:

- 정규식은 대소문자를 구분하지 않으며, 다른 설정 정규식 표면과 동일한 안전 정규식 보호 장치를 사용합니다. 잘못된 패턴과 안전하지 않은 중첩 반복은 무시됩니다.
- 누군가 연락처를 탭하면 WhatsApp은 여전히 `mentionedJids`를 통해 정식 멘션을 보내므로, 번호 폴백은 거의 필요하지 않지만 유용한 안전망입니다.

### 활성화 명령(소유자 전용)

그룹 채팅 명령을 사용하세요.

- `/activation mention`
- `/activation always`

소유자 번호(`channels.whatsapp.allowFrom`에서 가져오며, 설정되지 않은 경우 봇 자신의 E.164)만 이를 변경할 수 있습니다. 현재 활성화 모드를 보려면 그룹에서 `/status`를 독립 메시지로 보내세요.

## 사용 방법

1. WhatsApp 계정(OpenClaw를 실행하는 계정)을 그룹에 추가합니다.
2. `@openclaw …`라고 말하거나 번호를 포함합니다. `groupPolicy: "open"`을 설정하지 않는 한 허용 목록에 있는 발신자만 트리거할 수 있습니다.
3. 에이전트 프롬프트에는 최근 그룹 컨텍스트와 뒤따르는 `[from: …]` 표시가 포함되어 올바른 사람에게 응답할 수 있습니다.
4. 세션 수준 지시문(`/verbose on`, `/trace on`, `/think high`, `/new` 또는 `/reset`, `/compact`)은 해당 그룹의 세션에만 적용됩니다. 등록되도록 독립 메시지로 보내세요. 개인 DM 세션은 독립적으로 유지됩니다.

## 테스트 / 검증

- 수동 스모크 테스트:
  - 그룹에서 `@openclaw` 호출을 보내고 발신자 이름을 언급하는 응답을 확인합니다.
  - 두 번째 호출을 보내 기록 블록이 포함된 뒤 다음 턴에서 지워지는지 확인합니다.
- Gateway 로그(`--verbose`로 실행)를 확인해 `from: <groupJid>`와 `[from: …]` 접미사를 보여 주는 `inbound web message` 항목을 확인합니다.

## 알려진 고려 사항

- 시끄러운 브로드캐스트를 피하기 위해 그룹에서는 의도적으로 Heartbeat를 건너뜁니다.
- 에코 억제는 결합된 배치 문자열을 사용합니다. 멘션 없이 동일한 텍스트를 두 번 보내면 첫 번째만 응답을 받습니다.
- 세션 저장소 항목은 세션 저장소(기본값: `~/.openclaw/agents/<agentId>/sessions/sessions.json`)에 `agent:<agentId>:whatsapp:group:<jid>`로 표시됩니다. 항목이 없다는 것은 해당 그룹이 아직 실행을 트리거하지 않았다는 뜻일 뿐입니다.
- 그룹의 입력 표시기는 `agents.defaults.typingMode`를 따릅니다. 표시되는 응답이 메시지 도구 전용 모드로 선택된 경우, 자동 최종 응답이 게시되지 않더라도 그룹 구성원이 에이전트가 작업 중임을 볼 수 있도록 기본적으로 입력 표시가 즉시 시작됩니다. 명시적 입력 모드 설정이 있으면 여전히 그 설정이 우선합니다.

## 관련 항목

- [그룹](/ko/channels/groups)
- [채널 라우팅](/ko/channels/channel-routing)
- [브로드캐스트 그룹](/ko/channels/broadcast-groups)
