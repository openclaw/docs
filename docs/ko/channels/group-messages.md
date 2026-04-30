---
read_when:
    - 그룹 메시지 규칙 또는 멘션 변경
summary: WhatsApp 그룹 메시지 처리의 동작 및 구성(mentionPatterns는 여러 서피스에서 공유됨)
title: 그룹 메시지
x-i18n:
    generated_at: "2026-04-30T06:17:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: eb7713f83b3bf309336c4b09add17835b13facb17a5a1e3db48c25d892988ee4
    source_path: channels/group-messages.md
    workflow: 16
---

목표: Clawd가 WhatsApp 그룹에 머물다가 호출될 때만 깨어나고, 해당 스레드를 개인 다이렉트 메시지 세션과 분리해 유지하도록 합니다.

<Note>
`agents.list[].groupChat.mentionPatterns`는 Telegram, Discord, Slack, iMessage에서도 사용됩니다. 이 문서는 WhatsApp 전용 동작에 초점을 맞춥니다. 다중 에이전트 구성에서는 에이전트별로 `agents.list[].groupChat.mentionPatterns`를 설정하거나, 전역 대체값으로 `messages.groupChat.mentionPatterns`를 사용하세요.
</Note>

## 현재 구현 (2025-12-03)

- 활성화 모드: `mention`(기본값) 또는 `always`. `mention`은 호출이 필요합니다(실제 WhatsApp @멘션 via `mentionedJids`, 안전한 정규식 패턴, 또는 텍스트 어디에든 포함된 봇의 E.164). `always`는 모든 메시지에서 에이전트를 깨우지만, 의미 있는 가치를 더할 수 있을 때만 답해야 합니다. 그렇지 않으면 정확한 무응답 토큰 `NO_REPLY` / `no_reply`를 반환합니다. 기본값은 구성(`channels.whatsapp.groups`)에서 설정할 수 있고, `/activation`을 통해 그룹별로 재정의할 수 있습니다. `channels.whatsapp.groups`가 설정되면 그룹 허용 목록으로도 동작합니다(전체 허용은 `"*"` 포함).
- 그룹 정책: `channels.whatsapp.groupPolicy`는 그룹 메시지를 수락할지 제어합니다(`open|disabled|allowlist`). `allowlist`는 `channels.whatsapp.groupAllowFrom`을 사용합니다(대체값: 명시적 `channels.whatsapp.allowFrom`). 기본값은 `allowlist`입니다(발신자를 추가할 때까지 차단).
- 그룹별 세션: 세션 키는 `agent:<agentId>:whatsapp:group:<jid>` 형태이므로 `/verbose on`, `/trace on`, `/think high` 같은 명령(독립 메시지로 전송)은 해당 그룹에만 범위가 지정됩니다. 개인 다이렉트 메시지 상태는 변경되지 않습니다. 그룹 스레드에서는 Heartbeat를 건너뜁니다.
- 컨텍스트 주입: 실행을 트리거하지 _않은_ **대기 중인 항목만** 포함한 그룹 메시지(기본 50개)는 `[Chat messages since your last reply - for context]` 아래에 접두되며, 트리거한 줄은 `[Current message - respond to this]` 아래에 배치됩니다. 이미 세션에 있는 메시지는 다시 주입되지 않습니다.
- 발신자 표시: 이제 모든 그룹 배치는 `[from: Sender Name (+E164)]`로 끝나므로 Pi가 누가 말하고 있는지 알 수 있습니다.
- 일시적/한 번만 보기: 텍스트/멘션을 추출하기 전에 이를 풀어내므로, 그 안의 호출도 여전히 트리거됩니다.
- 그룹 시스템 프롬프트: 그룹 세션의 첫 번째 턴(그리고 `/activation`이 모드를 변경할 때마다)에 `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` 같은 짧은 설명을 시스템 프롬프트에 주입합니다. 메타데이터를 사용할 수 없어도 에이전트에게 그룹 채팅임을 알려줍니다.

## 구성 예시 (WhatsApp)

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

- 정규식은 대소문자를 구분하지 않으며, 다른 구성 정규식 표면과 동일한 안전 정규식 보호 규칙을 사용합니다. 잘못된 패턴과 안전하지 않은 중첩 반복은 무시됩니다.
- 누군가 연락처를 탭하면 WhatsApp은 여전히 `mentionedJids`를 통해 정식 멘션을 보내므로, 번호 대체값은 거의 필요하지 않지만 유용한 안전망입니다.

### 활성화 명령(소유자 전용)

그룹 채팅 명령을 사용하세요.

- `/activation mention`
- `/activation always`

소유자 번호(`channels.whatsapp.allowFrom`, 또는 설정되지 않은 경우 봇 자체의 E.164)만 이를 변경할 수 있습니다. 그룹에서 독립 메시지로 `/status`를 보내 현재 활성화 모드를 확인하세요.

## 사용 방법

1. WhatsApp 계정(OpenClaw를 실행 중인 계정)을 그룹에 추가합니다.
2. `@openclaw …`라고 말합니다(또는 번호를 포함합니다). `groupPolicy: "open"`을 설정하지 않는 한 허용 목록에 있는 발신자만 트리거할 수 있습니다.
3. 에이전트 프롬프트에는 최근 그룹 컨텍스트와 뒤따르는 `[from: …]` 마커가 포함되어 올바른 사람에게 응답할 수 있습니다.
4. 세션 수준 지시문(`/verbose on`, `/trace on`, `/think high`, `/new` 또는 `/reset`, `/compact`)은 해당 그룹의 세션에만 적용됩니다. 등록되도록 독립 메시지로 보내세요. 개인 다이렉트 메시지 세션은 독립적으로 유지됩니다.

## 테스트 / 검증

- 수동 스모크:
  - 그룹에서 `@openclaw` 호출을 보내고 발신자 이름을 참조하는 응답이 오는지 확인합니다.
  - 두 번째 호출을 보내 히스토리 블록이 포함된 다음 다음 턴에서 지워지는지 확인합니다.
- Gateway 로그(`--verbose`로 실행)를 확인하여 `from: <groupJid>`와 `[from: …]` 접미사를 표시하는 `inbound web message` 항목을 확인합니다.

## 알려진 고려 사항

- 그룹에서는 시끄러운 브로드캐스트를 피하기 위해 의도적으로 Heartbeat를 건너뜁니다.
- 에코 억제는 결합된 배치 문자열을 사용합니다. 멘션 없이 동일한 텍스트를 두 번 보내면 첫 번째만 응답을 받습니다.
- 세션 저장소 항목은 기본적으로 세션 저장소(`~/.openclaw/agents/<agentId>/sessions/sessions.json`)에 `agent:<agentId>:whatsapp:group:<jid>`로 표시됩니다. 항목이 없다는 것은 해당 그룹이 아직 실행을 트리거하지 않았다는 뜻일 뿐입니다.
- 그룹의 입력 표시기는 `agents.defaults.typingMode`를 따릅니다. 보이는 응답이 기본 메시지 도구 전용 모드를 사용할 때, 기본적으로 입력이 즉시 시작되므로 자동 최종 응답이 게시되지 않더라도 그룹 구성원은 에이전트가 작업 중임을 볼 수 있습니다. 명시적 입력 모드 구성이 여전히 우선합니다.

## 관련 항목

- [그룹](/ko/channels/groups)
- [채널 라우팅](/ko/channels/channel-routing)
- [브로드캐스트 그룹](/ko/channels/broadcast-groups)
