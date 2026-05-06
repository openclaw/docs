---
read_when:
    - 채널 라우팅 또는 받은편지함 동작 변경
summary: 채널별(WhatsApp, Telegram, Discord, Slack) 라우팅 규칙 및 공유 컨텍스트
title: 채널 라우팅
x-i18n:
    generated_at: "2026-05-06T06:16:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92b14cf02b00312121bec2f0f8ec784f36364babd6085d684e71f425dd82715e
    source_path: channels/channel-routing.md
    workflow: 16
---

# 채널 및 라우팅

OpenClaw는 응답을 **메시지가 온 채널로 다시** 라우팅합니다. 모델은 채널을 선택하지 않으며, 라우팅은 결정적이고 호스트 구성으로 제어됩니다.

## 주요 용어

- **채널**: `telegram`, `whatsapp`, `discord`, `irc`, `googlechat`, `slack`, `signal`, `imessage`, `line` 및 Plugin 채널. `webchat`은 내부 WebChat UI 채널이며 구성 가능한 아웃바운드 채널이 아닙니다.
- **AccountId**: 채널별 계정 인스턴스(지원되는 경우).
- 선택적 채널 기본 계정: `channels.<channel>.defaultAccount`는 아웃바운드 경로가 `accountId`를 지정하지 않을 때 사용할 계정을 선택합니다.
  - 다중 계정 설정에서는 계정이 두 개 이상 구성된 경우 명시적 기본값(`defaultAccount` 또는 `accounts.default`)을 설정하세요. 없으면 대체 라우팅이 정규화된 첫 번째 계정 ID를 선택할 수 있습니다.
- **AgentId**: 격리된 작업 공간 + 세션 저장소("브레인").
- **SessionKey**: 컨텍스트를 저장하고 동시성을 제어하는 데 사용되는 버킷 키.

## 아웃바운드 대상 접두사

명시적 아웃바운드 대상에는 `telegram:123` 또는 `tg:123` 같은 공급자 접두사가 포함될 수 있습니다. 코어는 선택된 채널이 `last`이거나 그 외에 확인되지 않은 경우, 그리고 로드된 Plugin이 해당 접두사를 광고하는 경우에만 그 접두사를 채널 선택 힌트로 취급합니다. 호출자가 이미 명시적 채널을 선택했다면 공급자 접두사는 해당 채널과 일치해야 합니다. `telegram:123`으로 WhatsApp 전송을 시도하는 것 같은 교차 채널 조합은 Plugin별 대상 정규화 전에 실패합니다.

`channel:<id>`, `user:<id>`, `room:<id>`, `thread:<id>`, `imessage:<handle>`, `sms:<number>` 같은 대상 종류 및 서비스 접두사는 선택된 채널의 문법 안에 머뭅니다. 이것들만으로는 공급자를 선택하지 않습니다.

## 세션 키 형태(예시)

직접 메시지는 기본적으로 에이전트의 **기본** 세션으로 합쳐집니다.

- `agent:<agentId>:<mainKey>` (기본값: `agent:main:main`)

직접 메시지 대화 기록이 기본 세션과 공유되는 경우에도, 샌드박스와 도구 정책은 외부 DM에 대해 계정별 직접 채팅 런타임 키를 파생해 사용하므로 채널에서 시작된 메시지가 로컬 기본 세션 실행처럼 취급되지 않습니다.

그룹과 채널은 채널별로 계속 격리됩니다.

- 그룹: `agent:<agentId>:<channel>:group:<id>`
- 채널/룸: `agent:<agentId>:<channel>:channel:<id>`

스레드:

- Slack/Discord 스레드는 기본 키에 `:thread:<threadId>`를 추가합니다.
- Telegram 포럼 주제는 그룹 키에 `:topic:<topicId>`를 포함합니다.

예시:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## 기본 DM 경로 고정

`session.dmScope`가 `main`이면 직접 메시지가 하나의 기본 세션을 공유할 수 있습니다. 소유자가 아닌 DM에 의해 세션의 `lastRoute`가 덮어써지는 것을 방지하기 위해, 다음 조건이 모두 참일 때 OpenClaw는 `allowFrom`에서 고정된 소유자를 추론합니다.

- `allowFrom`에 와일드카드가 아닌 항목이 정확히 하나 있습니다.
- 해당 항목을 그 채널의 구체적인 발신자 ID로 정규화할 수 있습니다.
- 인바운드 DM 발신자가 고정된 소유자와 일치하지 않습니다.

이 불일치 상황에서도 OpenClaw는 인바운드 세션 메타데이터를 계속 기록하지만, 기본 세션 `lastRoute` 업데이트는 건너뜁니다.

## 보호된 인바운드 기록

보호된 경로가 새 OpenClaw 세션을 만들면 안 되는 경우, 채널 Plugin은 인바운드 세션 레코드를 `createIfMissing: false`로 표시할 수 있습니다. 이 모드에서 OpenClaw는 기존 세션의 메타데이터와 `lastRoute`를 업데이트할 수 있지만, 메시지가 관찰되었다는 이유만으로 경로 전용 세션 항목을 만들지는 않습니다.

## 라우팅 규칙(에이전트 선택 방식)

라우팅은 각 인바운드 메시지에 대해 **하나의 에이전트**를 선택합니다.

1. **정확한 피어 일치**(`peer.kind` + `peer.id`가 있는 `bindings`).
2. **상위 피어 일치**(스레드 상속).
3. **길드 + 역할 일치**(Discord): `guildId` + `roles` 사용.
4. **길드 일치**(Discord): `guildId` 사용.
5. **팀 일치**(Slack): `teamId` 사용.
6. **계정 일치**(채널의 `accountId`).
7. **채널 일치**(해당 채널의 모든 계정, `accountId: "*"`).
8. **기본 에이전트**(`agents.list[].default`, 없으면 첫 번째 목록 항목, 대체값은 `main`).

바인딩에 여러 일치 필드(`peer`, `guildId`, `teamId`, `roles`)가 포함된 경우, 해당 바인딩이 적용되려면 **제공된 모든 필드가 일치해야 합니다**.

일치한 에이전트가 사용할 작업 공간과 세션 저장소를 결정합니다.

## 브로드캐스트 그룹(여러 에이전트 실행)

브로드캐스트 그룹을 사용하면 OpenClaw가 일반적으로 응답하는 경우(예: WhatsApp 그룹에서 멘션/활성화 게이팅 이후) 같은 피어에 대해 **여러 에이전트**를 실행할 수 있습니다.

구성:

```json5
{
  broadcast: {
    strategy: "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"],
    "+15555550123": ["support", "logger"],
  },
}
```

참조: [브로드캐스트 그룹](/ko/channels/broadcast-groups).

## 구성 개요

- `agents.list`: 이름이 지정된 에이전트 정의(작업 공간, 모델 등).
- `bindings`: 인바운드 채널/계정/피어를 에이전트에 매핑합니다.

예시:

```json5
{
  agents: {
    list: [{ id: "support", name: "Support", workspace: "~/.openclaw/workspace-support" }],
  },
  bindings: [
    { match: { channel: "slack", teamId: "T123" }, agentId: "support" },
    { match: { channel: "telegram", peer: { kind: "group", id: "-100123" } }, agentId: "support" },
  ],
}
```

## 세션 저장소

세션 저장소는 상태 디렉터리(기본값 `~/.openclaw`) 아래에 있습니다.

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- JSONL 트랜스크립트는 저장소와 같은 위치에 있습니다.

`session.store`와 `{agentId}` 템플릿을 통해 저장소 경로를 재정의할 수 있습니다.

Gateway 및 ACP 세션 검색도 기본 `agents/` 루트와 템플릿화된 `session.store` 루트 아래에서 디스크 기반 에이전트 저장소를 스캔합니다. 검색된 저장소는 확인된 해당 에이전트 루트 안에 있어야 하며 일반 `sessions.json` 파일을 사용해야 합니다. 심볼릭 링크와 루트 밖 경로는 무시됩니다.

## WebChat 동작

WebChat은 **선택된 에이전트**에 연결되며 기본적으로 에이전트의 기본 세션을 사용합니다. 이 때문에 WebChat에서는 해당 에이전트의 교차 채널 컨텍스트를 한곳에서 볼 수 있습니다.

## 응답 컨텍스트

인바운드 응답에는 다음이 포함됩니다.

- 사용 가능한 경우 `ReplyToId`, `ReplyToBody`, `ReplyToSender`.
- 인용된 컨텍스트는 `[Replying to ...]` 블록으로 `Body`에 추가됩니다.

이는 채널 전반에서 일관됩니다.

## 관련 항목

- [그룹](/ko/channels/groups)
- [브로드캐스트 그룹](/ko/channels/broadcast-groups)
- [페어링](/ko/channels/pairing)
