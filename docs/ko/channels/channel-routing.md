---
read_when:
    - 채널 라우팅 또는 수신함 동작 변경하기
summary: 채널별(WhatsApp, Telegram, Discord, Slack) 라우팅 규칙 및 공유 컨텍스트
title: 채널 라우팅
x-i18n:
    generated_at: "2026-07-12T14:56:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4836671840e8c7919e7def8140d4a54fdeea17ddbe8c7a348ab5a23ff8b4213c
    source_path: channels/channel-routing.md
    workflow: 16
---

# 채널 및 라우팅

OpenClaw는 답장을 **메시지가 들어온 채널로 다시** 라우팅합니다. 모델은 채널을 선택하지 않으며, 라우팅은 결정론적으로 이루어지고 호스트 구성에 의해 제어됩니다.

## 주요 용어

- **채널**: `discord`, `googlechat`, `imessage`, `irc`, `line`, `signal`, `slack`, `telegram`, `whatsapp` 같은 번들 채널 Plugin과 설치된 Plugin 채널입니다. `webchat`은 내부 WebChat UI 채널이며 구성 가능한 아웃바운드 채널이 아닙니다.
- **AccountId**: 채널별 계정 인스턴스입니다(지원되는 경우).
- 선택적 채널 기본 계정: `channels.<channel>.defaultAccount`는 아웃바운드 경로에서 `accountId`를 지정하지 않았을 때 사용할 계정을 선택합니다.
  - 다중 계정 설정에서 계정을 두 개 이상 구성한 경우 명시적인 기본값(`defaultAccount` 또는 이름이 `default`인 계정)을 설정하십시오. 설정하지 않으면 대체 라우팅에서 정규화된 첫 번째 계정 ID를 선택할 수 있습니다.
- **AgentId**: 격리된 워크스페이스와 세션 저장소("두뇌")입니다.
- **SessionKey**: 컨텍스트를 저장하고 동시성을 제어하는 데 사용하는 버킷 키입니다.

## 아웃바운드 대상 접두사

명시적인 아웃바운드 대상에는 `telegram:123` 또는 `tg:123` 같은 제공자 접두사가 포함될 수 있습니다. 코어는 선택한 채널이 `last`이거나 달리 결정되지 않은 경우에만, 그리고 로드된 Plugin이 해당 접두사를 지원한다고 명시한 경우에만 이 접두사를 채널 선택 힌트로 취급합니다. 호출자가 이미 명시적 채널을 선택했다면 제공자 접두사가 해당 채널과 일치해야 합니다. WhatsApp 전송과 `telegram:123`을 결합하는 것처럼 채널이 서로 다른 조합은 Plugin별 대상 정규화 전에 실패합니다.

`channel:<id>`, `user:<id>`, `room:<id>`, `thread:<id>`, `imessage:<handle>`, `sms:<number>` 같은 대상 종류 및 서비스 접두사는 선택한 채널의 문법 안에 유지됩니다. 이러한 접두사만으로 제공자를 선택하지는 않습니다.

## 세션 키 형식(예시)

다이렉트 메시지는 기본적으로 에이전트의 **기본** 세션으로 통합됩니다.

- `agent:<agentId>:<mainKey>`(기본값: `agent:main:main`)

`session.dmScope`는 DM 통합 방식을 제어합니다. `main`(기본값)은 하나의 기본 세션을 공유하고, `per-peer`, `per-channel-peer`, `per-account-channel-peer`는 DM을 별도 세션에 유지합니다. 라우트 바인딩은 `bindings[].session.dmScope`를 통해 일치한 피어의 범위를 재정의할 수 있습니다.

다이렉트 메시지 대화 기록을 기본 세션과 공유하는 경우에도 외부 DM의 샌드박스 및 도구 정책에는 계정별 다이렉트 채팅 런타임 키를 파생하여 사용하므로, 채널에서 시작된 메시지가 로컬 기본 세션 실행처럼 취급되지 않습니다.

그룹과 채널은 채널별로 계속 격리됩니다.

- 그룹: `agent:<agentId>:<channel>:group:<id>`
- 채널/방: `agent:<agentId>:<channel>:channel:<id>`

스레드:

- Slack/Discord 스레드는 기본 키에 `:thread:<threadId>`를 추가합니다.
- Telegram 포럼 주제는 그룹 키에 `:topic:<topicId>`를 포함합니다.

예시:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## 기본 DM 라우트 고정

`session.dmScope`가 `main`이면 다이렉트 메시지가 하나의 기본 세션을 공유할 수 있습니다. 소유자가 아닌 사용자의 DM으로 인해 세션의 `lastRoute`가 덮어써지는 것을 방지하기 위해, 다음 조건이 모두 충족되면 OpenClaw는 `allowFrom`에서 고정 소유자를 추론합니다.

- `allowFrom`에 와일드카드가 아닌 항목이 정확히 하나 있습니다.
- 해당 항목을 그 채널의 구체적인 발신자 ID로 정규화할 수 있습니다.
- 인바운드 DM 발신자가 해당 고정 소유자와 일치하지 않습니다.

이처럼 일치하지 않는 경우에도 OpenClaw는 인바운드 세션 메타데이터를 기록하지만, 기본 세션의 `lastRoute` 업데이트는 건너뜁니다.

## 보호된 인바운드 기록

보호된 경로에서 새 OpenClaw 세션을 생성하면 안 되는 경우, 채널 Plugin은 인바운드 세션 레코드를 `createIfMissing: false`로 표시할 수 있습니다. 이 모드에서 OpenClaw는 기존 세션의 메타데이터와 `lastRoute`를 업데이트할 수 있지만, 단지 메시지가 감지되었다는 이유만으로 라우트 전용 세션 항목을 생성하지는 않습니다.

## 라우팅 규칙(에이전트 선택 방식)

라우팅은 각 인바운드 메시지에 대해 **하나의 에이전트**를 선택합니다.

1. **정확한 피어 일치**(`peer.kind` + `peer.id`가 포함된 `bindings`).
2. **상위 피어 일치**(스레드 상속).
3. **피어 와일드카드 일치**(피어 종류에 대해 `peer.id: "*"`).
4. **길드 + 역할 일치**(Discord): `guildId` + `roles`.
5. **길드 일치**(Discord): `guildId`.
6. **팀 일치**(Slack): `teamId`.
7. **계정 일치**(채널의 `accountId`).
8. **채널 일치**(해당 채널의 모든 계정, `accountId: "*"`).
9. **기본 에이전트**(`agents.list[].default`, 없으면 목록의 첫 번째 항목, 최종적으로 `main` 사용).

바인딩에 여러 일치 필드(`peer`, `guildId`, `teamId`, `roles`)가 포함된 경우 해당 바인딩을 적용하려면 **제공된 모든 필드가 일치해야 합니다**.

일치한 에이전트에 따라 사용할 워크스페이스와 세션 저장소가 결정됩니다.

## 브로드캐스트 그룹(여러 에이전트 실행)

브로드캐스트 그룹을 사용하면 **OpenClaw가 일반적으로 답장하는 경우**(예: WhatsApp 그룹에서 멘션/활성화 조건을 통과한 후)에 동일한 피어에 대해 **여러 에이전트**를 실행할 수 있습니다.

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

참고: [브로드캐스트 그룹](/ko/channels/broadcast-groups).

## 구성 개요

- `agents.list`: 이름이 지정된 에이전트 정의(워크스페이스, 모델 등).
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

런타임 세션 행은 상태 디렉터리(기본값 `~/.openclaw`) 아래의 각 에이전트 SQLite 데이터베이스에 있습니다.

- `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`

이전 설치에는 레거시 트랜스크립트 JSONL 파일과 `~/.openclaw/agents/<agentId>/sessions/` 아래의 `sessions.json` 행 저장소가 있을 수 있습니다. Gateway 시작 및 `openclaw doctor --fix`는 사용 중인 레거시 행/기록을 SQLite로 자동으로 가져옵니다. 명시적인 마이그레이션 증거가 필요한 경우 `openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents`와 [Doctor](/ko/cli/doctor#session-sqlite-migration) 검증 절차를 사용하십시오.
마이그레이션 및 오프라인 유지 관리 워크플로에서는 `session.store`와 `{agentId}` 템플릿을 통해 레거시 저장소 경로를 계속 선택할 수 있습니다.

Gateway 및 ACP 세션 검색은 기본 `agents/` 루트와 템플릿화된 `session.store` 루트 아래에서 디스크 기반 에이전트 저장소도 검색합니다. 검색된 저장소는 확인된 에이전트 루트 안에 있어야 하며 일반 레거시 `sessions.json` 파일을 사용해야 합니다. 심볼릭 링크와 루트 외부 경로는 무시됩니다.

## WebChat 동작

WebChat은 **선택된 에이전트**에 연결되며 기본적으로 해당 에이전트의 기본 세션을 사용합니다. 따라서 WebChat에서는 해당 에이전트의 채널 간 컨텍스트를 한곳에서 확인할 수 있습니다.

## 답장 컨텍스트

인바운드 답장에는 다음이 포함됩니다.

- 사용 가능한 경우 `ReplyToId`, `ReplyToBody`, `ReplyToSender`.
- 인용된 컨텍스트는 `[Replying to ...]` 블록으로 `Body`에 추가됩니다.

이는 모든 채널에서 일관되게 적용됩니다.

## 관련 항목

- [그룹](/ko/channels/groups)
- [브로드캐스트 그룹](/ko/channels/broadcast-groups)
- [페어링](/ko/channels/pairing)
