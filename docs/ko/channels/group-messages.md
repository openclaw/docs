---
read_when:
    - WhatsApp 그룹만 별도로 구성하기
    - WhatsApp 활성화 모드 변경(`mention` 및 `always`)
    - WhatsApp 그룹 세션 키 또는 보류 중인 메시지 컨텍스트 조정
sidebarTitle: WhatsApp groups
summary: WhatsApp 그룹 메시지 처리 — 활성화, 허용 목록, 세션 및 컨텍스트 주입
title: WhatsApp 그룹 메시지
x-i18n:
    generated_at: "2026-07-12T14:58:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: bd1adb379a4cae4ee9b4b9950d7519e62e1fc0e72ece25ec1b337ee3cb803cda
    source_path: channels/group-messages.md
    workflow: 16
---

교차 채널 그룹 모델(Discord, iMessage, Matrix, Microsoft Teams, QQBot, Signal, Slack, Telegram, WhatsApp, Zalo)은 [그룹](/ko/channels/groups)을 참조하십시오. 이 페이지에서는 해당 모델에 추가되는 WhatsApp 고유 동작인 활성화, 그룹 허용 목록, 그룹별 세션 키, 대기 메시지 컨텍스트 삽입을 다룹니다.

목표: OpenClaw가 WhatsApp 그룹에 참여하되 호출될 때만 활성화되고, 해당 대화를 개인 DM 세션과 별도로 유지하도록 합니다.

<Note>
`agents.list[].groupChat.mentionPatterns`는 다른 채널의 멘션 게이팅과 공유됩니다. 다중 에이전트 구성에서는 에이전트별로 설정하거나 `messages.groupChat.mentionPatterns`를 전역 대체 설정으로 사용하십시오. 둘 다 설정하지 않으면 에이전트 ID의 이름/이모지에서 패턴을 파생합니다.
</Note>

## 동작

- 활성화 모드: `mention`(기본값) 또는 `always`입니다. `mention`에는 호출이 필요합니다. 실제 WhatsApp @멘션(`mentionedJids`), 구성된 정규식 패턴, 텍스트 어디에나 포함된 봇의 E.164 숫자 또는 봇 메시지 중 하나에 대한 인용 답장(번호 공유 셀프 채팅 구성 제외)이 호출로 인정됩니다. `always`는 모든 메시지에서 에이전트를 활성화하지만, 삽입되는 그룹 프롬프트는 가치가 있을 때만 답하고 그렇지 않으면 정확한 무응답 토큰 `NO_REPLY`(대소문자 구분 없음)를 반환하도록 지시합니다. 기본값은 구성(`channels.whatsapp.groups`의 `requireMention`)에서 가져오며, `/activation`을 통해 그룹별로 재정의할 수 있습니다.
- 그룹 허용 목록: `channels.whatsapp.groups`가 설정된 경우 나열된 그룹 JID만 허용됩니다(모두 허용하려면 `"*"` 포함). 목록에 없는 그룹의 메시지는 로그 안내와 함께 삭제됩니다.
- 그룹 정책: `channels.whatsapp.groupPolicy`는 그룹 메시지 허용 여부(`open|disabled|allowlist`)를 제어합니다. `allowlist`는 `channels.whatsapp.groupAllowFrom`을 사용합니다(대체 설정: 명시적인 `channels.whatsapp.allowFrom`). 기본값은 `allowlist`입니다(발신자를 추가할 때까지 차단됨).
- 그룹별 세션: 세션 키는 `agent:<agentId>:whatsapp:group:<jid>` 형식입니다(기본값이 아닌 계정에는 `:thread:whatsapp-account-<accountId>` 추가). 따라서 독립 실행형 메시지로 전송된 `/verbose on`, `/trace on`, `/think high` 등의 지시문은 해당 그룹에만 적용되며 개인 DM 상태는 변경되지 않습니다.
- 컨텍스트 삽입: 실행을 트리거하지 _않은_ **대기 중인 메시지만**(기본값 50개) `[Chat messages since your last reply - for context]` 아래에 접두되어 삽입되며, 트리거 메시지 줄은 `[Current message - respond to this]` 아래에 배치됩니다. 실행 후 대기 창은 지워지며, 세션에 이미 포함된 메시지는 다시 삽입되지 않습니다.
- 발신자 귀속: 각 그룹 메시지 줄에는 메시지 엔벌로프 안에 발신자 레이블이 포함됩니다. 예: `[WhatsApp <groupJid> <timestamp>] Alice (+447700900123): text`. 발신자 ID와 그룹 제목/구성원 정보도 신뢰할 수 없는 대화 메타데이터 블록에 함께 포함됩니다.
- 임시/한 번 보기: 텍스트/멘션을 추출하기 전에 래퍼를 해제하므로, 래퍼 내부의 호출도 계속 트리거됩니다.
- 그룹 시스템 프롬프트: 그룹 세션의 첫 번째 턴(및 `/activation`으로 모드를 변경한 후의 모든 턴)에는 활성화 안내가 시스템 프롬프트에 삽입됩니다(`Activation: trigger-only ...` 또는 `Activation: always-on ...`과 "특정 발신자에게 응답하십시오" 안내). 지속적인 그룹 채팅 전송 안내("WhatsApp 그룹 채팅에 참여하고 있습니다...")는 항상 포함됩니다.

## 구성 예시(WhatsApp)

WhatsApp이 텍스트 본문에서 시각적 `@`를 제거해도 표시 이름 호출이 작동하도록 합니다.

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
      historyLimit: 50, // 대기 중인 그룹 컨텍스트 창(기본값 50)
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@?openclaw", "\\+?15555550123"],
        },
      },
    ],
  },
}
```

참고:

- 정규식은 대소문자를 구분하지 않으며 다른 구성 정규식 표면과 동일한 안전 정규식 보호 장치를 사용합니다. 유효하지 않은 패턴과 안전하지 않은 중첩 반복은 무시됩니다.
- 사용자가 연락처를 탭하면 WhatsApp은 계속해서 `mentionedJids`를 통해 정규화된 멘션을 전송하므로 숫자 대체 설정이 필요한 경우는 드물지만, 유용한 안전망이 됩니다.
- 대기 컨텍스트 창은 `channels.whatsapp.accounts.<id>.historyLimit` → `channels.whatsapp.historyLimit` → `messages.groupChat.historyLimit` → 50 순으로 결정됩니다.

### 활성화 명령(소유자 전용)

그룹 채팅 명령을 사용하십시오.

- `/activation mention`
- `/activation always`

소유자 번호(`channels.whatsapp.allowFrom`에서 가져오며, 설정되지 않은 경우 봇 자체의 E.164)만 이를 변경할 수 있습니다. 다른 사용자가 보낸 `/activation`은 무시되고 컨텍스트로만 저장됩니다. 현재 활성화 모드를 확인하려면 그룹에서 `/status`를 독립 실행형 메시지로 보내십시오.

## 사용 방법

1. WhatsApp 계정(OpenClaw를 실행하는 계정)을 그룹에 추가합니다.
2. `@openclaw ...`이라고 말하거나 번호를 포함합니다. `groupPolicy: "open"`을 설정하지 않으면 허용 목록에 있는 발신자만 트리거할 수 있습니다.
3. 에이전트 프롬프트에는 대기 중인 그룹 컨텍스트와 발신자 레이블이 지정된 줄이 포함되므로 올바른 사람에게 응답할 수 있습니다.
4. 세션 지시문(`/verbose on`, `/trace on`, `/think high`, `/new` 또는 `/reset`, `/compact`)은 해당 그룹의 세션에만 적용됩니다. 지시문이 등록되도록 독립 실행형 메시지로 보내십시오. 개인 DM 세션은 독립적으로 유지됩니다.

## 테스트/검증

- 수동 스모크 테스트:
  - 그룹에서 `@openclaw` 호출을 보내고 발신자 이름을 언급하는 답변이 오는지 확인합니다.
  - 두 번째 호출을 보내 기록 블록이 포함되는지 확인한 다음, 다음 턴에서 지워지는지 확인합니다.
- Gateway 로그(`--verbose`로 실행)에서 `from: <groupJid>`와 발신자 레이블이 지정된 본문을 표시하는 `inbound web message` 항목을 확인합니다.

## 알려진 고려 사항

- Heartbeat는 에이전트의 기본 세션에서 실행되며, 그룹 세션에서는 Heartbeat 실행이 발생하지 않습니다.
- 에코 억제는 세션별로 결합된 프롬프트(기록 + 현재 메시지)를 기억하므로, 봇 자체에서 전송된 메시지가 봇을 다시 트리거하지 않습니다. 동일한 배치가 반복되면 에코로 간주되어 건너뛸 수 있습니다.
- 세션 저장소 항목은 에이전트별 SQLite 세션 저장소에 `agent:<agentId>:whatsapp:group:<jid>` 형식으로 표시됩니다. 항목이 없다는 것은 해당 그룹이 아직 실행을 트리거하지 않았다는 의미일 뿐입니다.
- 입력 표시기는 `session.typingMode` / `agents.defaults.typingMode`를 따릅니다. 표시되는 답변에 메시지 도구 전용 모드가 적용된 경우, 자동 최종 답변이 게시되지 않더라도 그룹 구성원이 에이전트의 작업 상태를 볼 수 있도록 기본적으로 입력 표시가 즉시 시작됩니다. 명시적인 입력 모드 구성이 있으면 해당 구성이 우선합니다.

## 관련 항목

- [그룹](/ko/channels/groups)
- [채널 라우팅](/ko/channels/channel-routing)
- [브로드캐스트 그룹](/ko/channels/broadcast-groups)
