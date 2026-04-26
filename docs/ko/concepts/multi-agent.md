---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: '다중 에이전트 라우팅: 격리된 에이전트, 채널 계정 및 바인딩'
title: 다중 에이전트 라우팅
x-i18n:
    generated_at: "2026-04-26T11:27:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 845149ac1076d4746cc5038bd4444c2fc6117710f724b8cabdc31dc9ef6abbe8
    source_path: concepts/multi-agent.md
    workflow: 15
---

하나의 실행 중인 Gateway에서 여러 개의 **격리된** 에이전트(각각 자체 작업공간, 상태 디렉터리 `agentDir`, 세션 기록 보유)를 실행하고, 여러 채널 계정(예: WhatsApp 두 개)도 함께 운영할 수 있습니다. 인바운드 메시지는 바인딩을 통해 올바른 에이전트로 라우팅됩니다.

여기서 **에이전트**는 전체 페르소나 범위를 뜻합니다. 즉 작업공간 파일, 인증 프로필, 모델 레지스트리, 세션 저장소를 포함합니다. `agentDir`는 `~/.openclaw/agents/<agentId>/`에 있는 이 에이전트별 구성을 담는 온디스크 상태 디렉터리입니다. **바인딩**은 채널 계정(예: Slack 작업공간 또는 WhatsApp 번호)을 이러한 에이전트 중 하나에 매핑합니다.

## "하나의 에이전트"란?

**에이전트**는 다음을 각각 별도로 가진 완전히 범위가 구분된 브레인입니다.

- **작업공간** (파일, AGENTS.md/SOUL.md/USER.md, 로컬 노트, 페르소나 규칙).
- 인증 프로필, 모델 레지스트리, 에이전트별 구성을 위한 **상태 디렉터리**(`agentDir`).
- `~/.openclaw/agents/<agentId>/sessions` 아래의 **세션 저장소** (채팅 기록 + 라우팅 상태).

인증 프로필은 **에이전트별**입니다. 각 에이전트는 자체 다음 경로를 읽습니다.

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
여기에서도 `sessions_history`는 더 안전한 세션 간 회상 경로입니다. 원시 전사 덤프가 아니라 제한되고 정제된 뷰를 반환합니다. Assistant 회상은 사고 태그, `<relevant-memories>` 스캐폴딩, 일반 텍스트 도구 호출 XML 페이로드(`\<tool_call>...\</tool_call>`, `\<function_call>...\</function_call>`, `\<tool_calls>...\</tool_calls>`, `\<function_calls>...\</function_calls>`, 잘린 도구 호출 블록 포함), 다운그레이드된 도구 호출 스캐폴딩, 유출된 ASCII/전각 모델 제어 토큰, 잘못된 MiniMax 도구 호출 XML을 마스킹/잘라내기 전에 제거합니다.
</Note>

<Warning>
메인 에이전트 자격 증명은 자동으로 공유되지 **않습니다**. 에이전트 간에 `agentDir`를 절대 재사용하지 마세요(인증/세션 충돌이 발생합니다). 자격 증명을 공유하려면 다른 에이전트의 `agentDir`에 `auth-profiles.json`을 복사하세요.
</Warning>

Skills는 각 에이전트 작업공간과 `~/.openclaw/skills` 같은 공유 루트에서 로드된 뒤, 구성된 경우 유효한 에이전트 Skill 허용 목록으로 필터링됩니다. 공유 기본값에는 `agents.defaults.skills`를 사용하고, 에이전트별 교체에는 `agents.list[].skills`를 사용하세요. [Skills: per-agent vs shared](/ko/tools/skills#per-agent-vs-shared-skills) 및 [Skills: agent skill allowlists](/ko/tools/skills#agent-skill-allowlists)를 참조하세요.

Gateway는 **하나의 에이전트**(기본값) 또는 여러 에이전트를 나란히 호스팅할 수 있습니다.

<Note>
**작업공간 참고:** 각 에이전트의 작업공간은 강제 샌드박스가 아니라 **기본 cwd**입니다. 상대 경로는 작업공간 내부에서 해석되지만, 절대 경로는 샌드박싱이 활성화되지 않은 한 호스트의 다른 위치에 도달할 수 있습니다. [샌드박싱](/ko/gateway/sandboxing)을 참조하세요.
</Note>

## 경로 (빠른 맵)

- Config: `~/.openclaw/openclaw.json` (또는 `OPENCLAW_CONFIG_PATH`)
- 상태 디렉터리: `~/.openclaw` (또는 `OPENCLAW_STATE_DIR`)
- 작업공간: `~/.openclaw/workspace` (또는 `~/.openclaw/workspace-<agentId>`)
- Agent 디렉터리: `~/.openclaw/agents/<agentId>/agent` (또는 `agents.list[].agentDir`)
- 세션: `~/.openclaw/agents/<agentId>/sessions`

### 단일 에이전트 모드 (기본값)

아무 작업도 하지 않으면 OpenClaw는 단일 에이전트를 실행합니다.

- `agentId`의 기본값은 **`main`**입니다.
- 세션 키는 `agent:main:<mainKey>` 형식입니다.
- 작업공간 기본값은 `~/.openclaw/workspace`입니다(`OPENCLAW_PROFILE`이 설정된 경우 `~/.openclaw/workspace-<profile>`).
- 상태 기본값은 `~/.openclaw/agents/main/agent`입니다.

## 에이전트 도우미

에이전트 마법사를 사용해 새 격리 에이전트를 추가하세요.

```bash
openclaw agents add work
```

그런 다음 `bindings`를 추가해 인바운드 메시지를 라우팅하세요(또는 마법사에 맡기세요).

다음으로 확인합니다.

```bash
openclaw agents list --bindings
```

## 빠른 시작

<Steps>
  <Step title="각 에이전트 작업공간 만들기">
    마법사를 사용하거나 수동으로 작업공간을 만드세요.

    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    각 에이전트는 `SOUL.md`, `AGENTS.md`, 선택적 `USER.md`가 있는 자체 작업공간과 전용 `agentDir`, 그리고 `~/.openclaw/agents/<agentId>` 아래의 세션 저장소를 갖습니다.

  </Step>
  <Step title="채널 계정 만들기">
    선호하는 채널에서 에이전트당 하나의 계정을 만드세요.

    - Discord: 에이전트당 봇 하나, Message Content Intent 활성화, 각 토큰 복사.
    - Telegram: BotFather를 통해 에이전트당 봇 하나, 각 토큰 복사.
    - WhatsApp: 계정별로 각 전화번호 연결.

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    채널 가이드 참조: [Discord](/ko/channels/discord), [Telegram](/ko/channels/telegram), [WhatsApp](/ko/channels/whatsapp).

  </Step>
  <Step title="에이전트, 계정, 바인딩 추가">
    `agents.list` 아래에 에이전트를, `channels.<channel>.accounts` 아래에 채널 계정을 추가하고, `bindings`로 이를 연결하세요(예시는 아래 참조).
  </Step>
  <Step title="재시작하고 확인">
    ```bash
    openclaw gateway restart
    openclaw agents list --bindings
    openclaw channels status --probe
    ```
  </Step>
</Steps>

## 여러 에이전트 = 여러 사람, 여러 페르소나

**여러 에이전트**를 사용하면 각 `agentId`는 **완전히 격리된 페르소나**가 됩니다.

- **서로 다른 전화번호/계정** (채널별 `accountId`).
- **서로 다른 페르소나** (`AGENTS.md`, `SOUL.md` 같은 에이전트별 작업공간 파일).
- **분리된 인증 + 세션** (명시적으로 활성화하지 않는 한 상호 간섭 없음).

이를 통해 **여러 사람**이 하나의 Gateway 서버를 공유하면서도 각자의 AI "브레인"과 데이터를 격리해서 유지할 수 있습니다.

## 에이전트 간 QMD 메모리 검색

한 에이전트가 다른 에이전트의 QMD 세션 전사를 검색해야 한다면 `agents.list[].memorySearch.qmd.extraCollections` 아래에 추가 컬렉션을 넣으세요. 모든 에이전트가 동일한 공유 전사 컬렉션을 상속해야 하는 경우에만 `agents.defaults.memorySearch.qmd.extraCollections`를 사용하세요.

```json5
{
  agents: {
    defaults: {
      workspace: "~/workspaces/main",
      memorySearch: {
        qmd: {
          extraCollections: [{ path: "~/agents/family/sessions", name: "family-sessions" }],
        },
      },
    },
    list: [
      {
        id: "main",
        workspace: "~/workspaces/main",
        memorySearch: {
          qmd: {
            extraCollections: [{ path: "notes" }], // 작업공간 내부에서 해석됨 -> 컬렉션 이름 "notes-main"
          },
        },
      },
      { id: "family", workspace: "~/workspaces/family" },
    ],
  },
  memory: {
    backend: "qmd",
    qmd: { includeDefaultMemory: false },
  },
}
```

추가 컬렉션 경로는 에이전트 간에 공유될 수 있지만, 경로가 에이전트 작업공간 밖에 있으면 컬렉션 이름은 명시적으로 유지됩니다. 작업공간 내부 경로는 에이전트 범위로 유지되므로 각 에이전트는 자체 전사 검색 세트를 유지합니다.

## 하나의 WhatsApp 번호, 여러 사람 (DM 분기)

**하나의 WhatsApp 계정**을 유지한 채 서로 다른 WhatsApp **DM**을 서로 다른 에이전트로 라우팅할 수 있습니다. `peer.kind: "direct"`와 함께 발신자 E.164(예: `+15551234567`) 기준으로 매칭하세요. 답장은 여전히 같은 WhatsApp 번호에서 옵니다(에이전트별 발신자 ID 없음).

<Note>
다이렉트 채팅은 에이전트의 **메인 세션 키**로 축소되므로, 진정한 격리를 위해서는 **사람당 하나의 에이전트**가 필요합니다.
</Note>

예시:

```json5
{
  agents: {
    list: [
      { id: "alex", workspace: "~/.openclaw/workspace-alex" },
      { id: "mia", workspace: "~/.openclaw/workspace-mia" },
    ],
  },
  bindings: [
    {
      agentId: "alex",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230001" } },
    },
    {
      agentId: "mia",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230002" } },
    },
  ],
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551230001", "+15551230002"],
    },
  },
}
```

참고:

- DM 접근 제어는 에이전트별이 아니라 **WhatsApp 계정별 전역**입니다(페어링/허용 목록).
- 공유 그룹의 경우 그룹을 하나의 에이전트에 바인딩하거나 [Broadcast groups](/ko/channels/broadcast-groups)를 사용하세요.

## 라우팅 규칙 (메시지가 에이전트를 선택하는 방식)

바인딩은 **결정적**이며 **가장 구체적인 항목이 우선**합니다.

<Steps>
  <Step title="peer match">
    정확한 DM/그룹/채널 id.
  </Step>
  <Step title="parentPeer match">
    스레드 상속.
  </Step>
  <Step title="guildId + roles">
    Discord 역할 라우팅.
  </Step>
  <Step title="guildId">
    Discord.
  </Step>
  <Step title="teamId">
    Slack.
  </Step>
  <Step title="채널의 accountId 일치">
    계정별 대체.
  </Step>
  <Step title="채널 수준 일치">
    `accountId: "*"`.
  </Step>
  <Step title="기본 에이전트">
    `agents.list[].default`로 대체, 없으면 첫 번째 목록 항목, 기본값: `main`.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="타이브레이킹 및 AND 의미론">
    - 같은 계층에서 여러 바인딩이 일치하면 config 순서상 첫 번째 항목이 우선합니다.
    - 바인딩이 여러 match 필드(예: `peer` + `guildId`)를 설정하면, 지정된 모든 필드가 필요합니다(`AND` 의미론).
  </Accordion>
  <Accordion title="계정 범위 세부 사항">
    - `accountId`를 생략한 바인딩은 기본 계정에만 일치합니다.
    - 모든 계정에 대한 채널 전체 대체에는 `accountId: "*"`를 사용하세요.
    - 나중에 같은 에이전트에 대해 같은 바인딩을 명시적 account id와 함께 추가하면, OpenClaw는 기존의 채널 전용 바인딩을 복제하는 대신 계정 범위 바인딩으로 업그레이드합니다.
  </Accordion>
</AccordionGroup>

## 여러 계정 / 여러 전화번호

**여러 계정**(예: WhatsApp)을 지원하는 채널은 각 로그인 식별에 `accountId`를 사용합니다. 각 `accountId`는 서로 다른 에이전트로 라우팅할 수 있으므로, 하나의 서버에서 여러 전화번호를 호스팅하면서도 세션이 섞이지 않게 할 수 있습니다.

`accountId`가 생략되었을 때 채널 전체 기본 계정을 원한다면 `channels.<channel>.defaultAccount`를 설정하세요(선택 사항). 설정하지 않으면 OpenClaw는 `default`가 있으면 그것으로, 없으면 정렬된 첫 번째 구성 계정 id로 대체합니다.

이 패턴을 지원하는 일반적인 채널은 다음과 같습니다.

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `bluebubbles`, `zalo`, `zalouser`, `nostr`, `feishu`

## 개념

- `agentId`: 하나의 "브레인" (작업공간, 에이전트별 인증, 에이전트별 세션 저장소).
- `accountId`: 하나의 채널 계정 인스턴스 (예: WhatsApp 계정 `"personal"` 대 `"biz"`).
- `binding`: `(channel, accountId, peer)`와 선택적 guild/team id로 인바운드 메시지를 `agentId`로 라우팅합니다.
- 다이렉트 채팅은 `agent:<agentId>:<mainKey>`로 축소됩니다(에이전트별 "main"; `session.mainKey`).

## 플랫폼 예시

<AccordionGroup>
  <Accordion title="에이전트별 Discord 봇">
    각 Discord 봇 계정은 고유한 `accountId`에 매핑됩니다. 각 계정을 하나의 에이전트에 바인딩하고 봇별 허용 목록을 유지하세요.

    ```json5
    {
      agents: {
        list: [
          { id: "main", workspace: "~/.openclaw/workspace-main" },
          { id: "coding", workspace: "~/.openclaw/workspace-coding" },
        ],
      },
      bindings: [
        { agentId: "main", match: { channel: "discord", accountId: "default" } },
        { agentId: "coding", match: { channel: "discord", accountId: "coding" } },
      ],
      channels: {
        discord: {
          groupPolicy: "allowlist",
          accounts: {
            default: {
              token: "DISCORD_BOT_TOKEN_MAIN",
              guilds: {
                "123456789012345678": {
                  channels: {
                    "222222222222222222": { allow: true, requireMention: false },
                  },
                },
              },
            },
            coding: {
              token: "DISCORD_BOT_TOKEN_CODING",
              guilds: {
                "123456789012345678": {
                  channels: {
                    "333333333333333333": { allow: true, requireMention: false },
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

    - 각 봇을 guild에 초대하고 Message Content Intent를 활성화하세요.
    - 토큰은 `channels.discord.accounts.<id>.token`에 저장됩니다(기본 계정은 `DISCORD_BOT_TOKEN` 사용 가능).

  </Accordion>
  <Accordion title="에이전트별 Telegram 봇">
    ```json5
    {
      agents: {
        list: [
          { id: "main", workspace: "~/.openclaw/workspace-main" },
          { id: "alerts", workspace: "~/.openclaw/workspace-alerts" },
        ],
      },
      bindings: [
        { agentId: "main", match: { channel: "telegram", accountId: "default" } },
        { agentId: "alerts", match: { channel: "telegram", accountId: "alerts" } },
      ],
      channels: {
        telegram: {
          accounts: {
            default: {
              botToken: "123456:ABC...",
              dmPolicy: "pairing",
            },
            alerts: {
              botToken: "987654:XYZ...",
              dmPolicy: "allowlist",
              allowFrom: ["tg:123456789"],
            },
          },
        },
      },
    }
    ```

    - BotFather로 에이전트마다 봇 하나를 만들고 각 토큰을 복사하세요.
    - 토큰은 `channels.telegram.accounts.<id>.botToken`에 저장됩니다(기본 계정은 `TELEGRAM_BOT_TOKEN` 사용 가능).

  </Accordion>
  <Accordion title="에이전트별 WhatsApp 번호">
    Gateway를 시작하기 전에 각 계정을 연결하세요.

    ```bash
    openclaw channels login --channel whatsapp --account personal
    openclaw channels login --channel whatsapp --account biz
    ```

    `~/.openclaw/openclaw.json` (JSON5):

    ```js
    {
      agents: {
        list: [
          {
            id: "home",
            default: true,
            name: "Home",
            workspace: "~/.openclaw/workspace-home",
            agentDir: "~/.openclaw/agents/home/agent",
          },
          {
            id: "work",
            name: "Work",
            workspace: "~/.openclaw/workspace-work",
            agentDir: "~/.openclaw/agents/work/agent",
          },
        ],
      },

      // 결정적 라우팅: 첫 번째 일치 항목이 우선(가장 구체적인 항목 우선).
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

        // 선택적 peer별 재정의(예: 특정 그룹 하나를 work 에이전트로 보냄).
        {
          agentId: "work",
          match: {
            channel: "whatsapp",
            accountId: "personal",
            peer: { kind: "group", id: "1203630...@g.us" },
          },
        },
      ],

      // 기본적으로 비활성화됨: 에이전트 간 메시징은 명시적으로 활성화 + 허용 목록 지정이 필요함.
      tools: {
        agentToAgent: {
          enabled: false,
          allow: ["home", "work"],
        },
      },

      channels: {
        whatsapp: {
          accounts: {
            personal: {
              // 선택적 재정의. 기본값: ~/.openclaw/credentials/whatsapp/personal
              // authDir: "~/.openclaw/credentials/whatsapp/personal",
            },
            biz: {
              // 선택적 재정의. 기본값: ~/.openclaw/credentials/whatsapp/biz
              // authDir: "~/.openclaw/credentials/whatsapp/biz",
            },
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## 일반적인 패턴

<Tabs>
  <Tab title="WhatsApp 일상 + Telegram 딥 워크">
    채널별로 분리하세요. WhatsApp은 빠른 일상용 에이전트로, Telegram은 Opus 에이전트로 라우팅합니다.

    ```json5
    {
      agents: {
        list: [
          {
            id: "chat",
            name: "Everyday",
            workspace: "~/.openclaw/workspace-chat",
            model: "anthropic/claude-sonnet-4-6",
          },
          {
            id: "opus",
            name: "Deep Work",
            workspace: "~/.openclaw/workspace-opus",
            model: "anthropic/claude-opus-4-6",
          },
        ],
      },
      bindings: [
        { agentId: "chat", match: { channel: "whatsapp" } },
        { agentId: "opus", match: { channel: "telegram" } },
      ],
    }
    ```

    참고:

    - 채널에 여러 계정이 있다면 바인딩에 `accountId`를 추가하세요(예: `{ channel: "whatsapp", accountId: "personal" }`).
    - 나머지는 chat에 두고 단일 DM/그룹만 Opus로 라우팅하려면 해당 peer에 대한 `match.peer` 바인딩을 추가하세요. peer 일치는 항상 채널 전체 규칙보다 우선합니다.

  </Tab>
  <Tab title="같은 채널, 하나의 peer만 Opus로">
    WhatsApp은 빠른 에이전트에 두고, 하나의 DM만 Opus로 라우팅합니다.

    ```json5
    {
      agents: {
        list: [
          {
            id: "chat",
            name: "Everyday",
            workspace: "~/.openclaw/workspace-chat",
            model: "anthropic/claude-sonnet-4-6",
          },
          {
            id: "opus",
            name: "Deep Work",
            workspace: "~/.openclaw/workspace-opus",
            model: "anthropic/claude-opus-4-6",
          },
        ],
      },
      bindings: [
        {
          agentId: "opus",
          match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551234567" } },
        },
        { agentId: "chat", match: { channel: "whatsapp" } },
      ],
    }
    ```

    peer 바인딩이 항상 우선하므로 채널 전체 규칙보다 위에 두세요.

  </Tab>
  <Tab title="WhatsApp 그룹에 바인딩된 가족 에이전트">
    멘션 게이팅과 더 엄격한 도구 정책을 사용해 전용 가족 에이전트를 하나의 WhatsApp 그룹에 바인딩합니다.

    ```json5
    {
      agents: {
        list: [
          {
            id: "family",
            name: "Family",
            workspace: "~/.openclaw/workspace-family",
            identity: { name: "Family Bot" },
            groupChat: {
              mentionPatterns: ["@family", "@familybot", "@Family Bot"],
            },
            sandbox: {
              mode: "all",
              scope: "agent",
            },
            tools: {
              allow: [
                "exec",
                "read",
                "sessions_list",
                "sessions_history",
                "sessions_send",
                "sessions_spawn",
                "session_status",
              ],
              deny: ["write", "edit", "apply_patch", "browser", "canvas", "nodes", "cron"],
            },
          },
        ],
      },
      bindings: [
        {
          agentId: "family",
          match: {
            channel: "whatsapp",
            peer: { kind: "group", id: "120363999999999999@g.us" },
          },
        },
      ],
    }
    ```

    참고:

    - 도구 허용/거부 목록은 **도구**이지 Skills가 아닙니다. Skill이 바이너리를 실행해야 한다면 `exec`가 허용되어 있고 해당 바이너리가 샌드박스에 존재하는지 확인하세요.
    - 더 엄격한 게이팅을 원하면 `agents.list[].groupChat.mentionPatterns`를 설정하고 채널에 대해 그룹 허용 목록을 활성화된 상태로 유지하세요.

  </Tab>
</Tabs>

## 에이전트별 샌드박스 및 도구 구성

각 에이전트는 자체 샌드박스와 도구 제한을 가질 수 있습니다.

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // personal 에이전트에는 샌드박스 없음
        },
        // 도구 제한 없음 - 모든 도구 사용 가능
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // 항상 샌드박싱
          scope: "agent",  // 에이전트당 하나의 컨테이너
          docker: {
            // 컨테이너 생성 후 선택적 1회 설정
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // read 도구만 허용
          deny: ["exec", "write", "edit", "apply_patch"],    // 나머지는 거부
        },
      },
    ],
  },
}
```

<Note>
`setupCommand`는 `sandbox.docker` 아래에 있으며 컨테이너 생성 시 한 번 실행됩니다. 해석된 범위가 `"shared"`일 때 에이전트별 `sandbox.docker.*` 재정의는 무시됩니다.
</Note>

**장점:**

- **보안 격리**: 신뢰할 수 없는 에이전트에 대해 도구를 제한합니다.
- **리소스 제어**: 특정 에이전트는 샌드박스에서 실행하고 다른 에이전트는 호스트에 유지합니다.
- **유연한 정책**: 에이전트별로 서로 다른 권한을 부여합니다.

<Note>
`tools.elevated`는 **전역**이며 발신자 기반입니다. 에이전트별로 구성할 수 없습니다. 에이전트별 경계가 필요하다면 `agents.list[].tools`를 사용해 `exec`를 거부하세요. 그룹 타기팅에는 `agents.list[].groupChat.mentionPatterns`를 사용하면 @멘션이 의도한 에이전트에 깔끔하게 매핑됩니다.
</Note>

자세한 예시는 [다중 에이전트 샌드박스 및 도구](/ko/tools/multi-agent-sandbox-tools)를 참조하세요.

## 관련 문서

- [ACP 에이전트](/ko/tools/acp-agents) — 외부 코딩 하니스 실행
- [채널 라우팅](/ko/channels/channel-routing) — 메시지가 에이전트로 라우팅되는 방식
- [Presence](/ko/concepts/presence) — 에이전트 상태 및 가용성
- [세션](/ko/concepts/session) — 세션 격리 및 라우팅
- [하위 에이전트](/ko/tools/subagents) — 백그라운드 에이전트 실행 생성
