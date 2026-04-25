---
read_when:
    - 그룹 메시지 규칙 또는 멘션 변경
summary: WhatsApp 그룹 메시지 처리의 동작 및 구성(`mentionPatterns`는 여러 표면에서 공유됨)
title: 그룹 메시지
x-i18n:
    generated_at: "2026-04-25T05:56:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 740eee61d15a24b09b4b896613ff9e0235457708d9dcbe0c3b1d5e136cefb975
    source_path: channels/group-messages.md
    workflow: 15
---

목표: Clawd가 WhatsApp 그룹에 참여해 있다가 핑을 받을 때만 깨어나고, 그 스레드를 개인 DM 세션과 분리해서 유지하도록 합니다.

참고: `agents.list[].groupChat.mentionPatterns`는 이제 Telegram/Discord/Slack/iMessage에서도 사용됩니다. 이 문서는 WhatsApp 전용 동작에 초점을 맞춥니다. 멀티 에이전트 구성에서는 에이전트별로 `agents.list[].groupChat.mentionPatterns`를 설정하거나, 전역 대체값으로 `messages.groupChat.mentionPatterns`를 사용하세요.

## 현재 구현(2025-12-03)

- 활성화 모드: `mention`(기본값) 또는 `always`. `mention`은 핑이 필요합니다(실제 WhatsApp @멘션(`mentionedJids`), 안전한 정규식 패턴, 또는 텍스트 내 어디에나 있는 봇의 E.164). `always`는 모든 메시지에서 에이전트를 깨우지만, 의미 있는 가치를 더할 수 있을 때만 응답해야 합니다. 그렇지 않으면 정확히 `NO_REPLY` / `no_reply` 무응답 토큰을 반환합니다. 기본값은 config의 `channels.whatsapp.groups`에서 설정할 수 있고, 그룹별로 `/activation`으로 재정의할 수 있습니다. `channels.whatsapp.groups`가 설정되면 그룹 허용 목록 역할도 합니다(모두 허용하려면 `"*"` 포함).
- 그룹 정책: `channels.whatsapp.groupPolicy`는 그룹 메시지 수락 여부를 제어합니다(`open|disabled|allowlist`). `allowlist`는 `channels.whatsapp.groupAllowFrom`을 사용합니다(대체값: 명시적 `channels.whatsapp.allowFrom`). 기본값은 `allowlist`입니다(발신자를 추가할 때까지 차단).
- 그룹별 세션: 세션 키는 `agent:<agentId>:whatsapp:group:<jid>` 형태이므로 `/verbose on`, `/trace on`, `/think high` 같은 명령어(독립 실행형 메시지로 전송)는 해당 그룹에만 범위가 적용됩니다. 개인 DM 상태는 영향을 받지 않습니다. Heartbeat는 그룹 스레드에서 건너뜁니다.
- 컨텍스트 주입: 실행을 트리거하지 *않은* **보류 중인 전용** 그룹 메시지(기본값 50개)는 `[Chat messages since your last reply - for context]` 아래에 접두되어 들어가고, 트리거한 줄은 `[Current message - respond to this]` 아래에 들어갑니다. 이미 세션에 있는 메시지는 다시 주입되지 않습니다.
- 발신자 표시: 이제 모든 그룹 배치 끝에는 `[from: Sender Name (+E164)]`가 붙으므로 Pi가 누가 말하고 있는지 알 수 있습니다.
- 일회성 보기/사라지는 메시지: 텍스트/멘션을 추출하기 전에 이를 언래핑하므로, 그 안의 핑도 계속 트리거됩니다.
- 그룹 시스템 프롬프트: 그룹 세션의 첫 턴(그리고 `/activation`이 모드를 바꿀 때마다)에 시스템 프롬프트에 짧은 설명이 주입됩니다. 예: `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` 메타데이터를 사용할 수 없더라도 에이전트에 그룹 채팅이라는 점은 계속 알려줍니다.

## config 예시(WhatsApp)

WhatsApp이 텍스트 본문에서 시각적 `@`를 제거하더라도 표시 이름 핑이 작동하도록 `~/.openclaw/openclaw.json`에 `groupChat` 블록을 추가하세요:

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

- 정규식은 대소문자를 구분하지 않으며, 다른 config 정규식 표면과 동일한 safe-regex 가드레일을 사용합니다. 잘못된 패턴과 안전하지 않은 중첩 반복은 무시됩니다.
- 누군가 연락처를 탭하면 WhatsApp은 여전히 `mentionedJids`를 통해 정식 멘션을 보내므로, 번호 대체값은 거의 필요하지 않지만 유용한 안전장치입니다.

### 활성화 명령어(소유자 전용)

그룹 채팅 명령어를 사용하세요:

- `/activation mention`
- `/activation always`

이것은 소유자 번호(`channels.whatsapp.allowFrom`, 미설정 시 봇 자신의 E.164)만 변경할 수 있습니다. 현재 활성화 모드를 보려면 그룹에 `/status`를 독립 실행형 메시지로 보내세요.

## 사용 방법

1. WhatsApp 계정(OpenClaw를 실행 중인 계정)을 그룹에 추가합니다.
2. `@openclaw …`라고 말하거나 번호를 포함합니다. `groupPolicy: "open"`으로 설정하지 않은 한, 허용 목록에 있는 발신자만 이를 트리거할 수 있습니다.
3. 에이전트 프롬프트에는 최근 그룹 컨텍스트와 뒤따르는 `[from: …]` 마커가 포함되므로, 올바른 사람에게 응답할 수 있습니다.
4. 세션 수준 지시어(`/verbose on`, `/trace on`, `/think high`, `/new` 또는 `/reset`, `/compact`)는 해당 그룹의 세션에만 적용됩니다. 등록되도록 독립 실행형 메시지로 보내세요. 개인 DM 세션은 독립적으로 유지됩니다.

## 테스트 / 검증

- 수동 스모크:
  - 그룹에서 `@openclaw` 핑을 보내고 발신자 이름을 참조하는 응답이 오는지 확인합니다.
  - 두 번째 핑을 보내고 기록 블록이 포함되었다가 다음 턴에 지워지는지 확인합니다.
- Gateway 로그(`--verbose`로 실행)를 확인하여 `from: <groupJid>`와 `[from: …]` 접미사가 표시된 `inbound web message` 항목을 봅니다.

## 알려진 고려 사항

- Heartbeat는 시끄러운 브로드캐스트를 피하기 위해 그룹에서 의도적으로 건너뜁니다.
- 에코 억제는 결합된 배치 문자열을 사용합니다. 멘션 없이 동일한 텍스트를 두 번 보내면 첫 번째에만 응답합니다.
- 세션 저장소 항목은 세션 저장소(기본값: `~/.openclaw/agents/<agentId>/sessions/sessions.json`)에 `agent:<agentId>:whatsapp:group:<jid>`로 표시됩니다. 항목이 없다는 것은 아직 해당 그룹이 실행을 트리거하지 않았다는 의미일 뿐입니다.
- 그룹의 입력 중 표시기는 `agents.defaults.typingMode`를 따릅니다(기본값: 멘션되지 않은 경우 `message`).

## 관련 항목

- [그룹](/ko/channels/groups)
- [채널 라우팅](/ko/channels/channel-routing)
- [브로드캐스트 그룹](/ko/channels/broadcast-groups)
