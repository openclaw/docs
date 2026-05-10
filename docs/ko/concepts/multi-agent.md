---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: '다중 에이전트 라우팅: 격리된 에이전트, 채널 계정 및 바인딩'
title: 다중 에이전트 라우팅
x-i18n:
    generated_at: "2026-05-10T19:31:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7fd194cbe0938cc6ef6dd9b9803d2b1fe6f3e0777f4df7c407c692fd9f743c59
    source_path: concepts/multi-agent.md
    workflow: 16
---

실행 중인 하나의 Gateway에서 여러 _격리된_ 에이전트(각각 자체 워크스페이스, 상태 디렉터리(`agentDir`), 세션 기록 포함)와 여러 채널 계정(예: WhatsApp 두 개)을 실행합니다. 인바운드 메시지는 바인딩을 통해 올바른 에이전트로 라우팅됩니다.

여기서 **에이전트**는 워크스페이스 파일, 인증 프로필, 모델 레지스트리, 세션 저장소를 포함하는 전체 페르소나별 범위입니다. `agentDir`은 이 에이전트별 구성을 `~/.openclaw/agents/<agentId>/`에 보관하는 온디스크 상태 디렉터리입니다. **바인딩**은 채널 계정(예: Slack 워크스페이스 또는 WhatsApp 번호)을 이러한 에이전트 중 하나에 매핑합니다.

## "하나의 에이전트"란 무엇인가요?

**에이전트**는 자체 범위를 완전히 갖춘 두뇌이며 다음을 포함합니다.

- **워크스페이스**(파일, AGENTS.md/SOUL.md/USER.md, 로컬 노트, 페르소나 규칙).
- 인증 프로필, 모델 레지스트리, 에이전트별 구성을 위한 **상태 디렉터리**(`agentDir`).
- `~/.openclaw/agents/<agentId>/sessions` 아래의 **세션 저장소**(채팅 기록 + 라우팅 상태).

인증 프로필은 **에이전트별**입니다. 각 에이전트는 자체 파일에서 읽습니다.

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
여기에서도 `sessions_history`가 더 안전한 크로스 세션 회상 경로입니다. 원시 트랜스크립트 덤프가 아니라 제한되고 정리된 뷰를 반환합니다. Assistant 회상은 수정/잘라내기 전에 thinking 태그, `<relevant-memories>` 스캐폴딩, 일반 텍스트 도구 호출 XML 페이로드(`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, 잘린 도구 호출 블록 포함), 다운그레이드된 도구 호출 스캐폴딩, 유출된 ASCII/전각 모델 제어 토큰, 잘못된 MiniMax 도구 호출 XML을 제거합니다.
</Note>

<Warning>
여러 에이전트에서 `agentDir`을 재사용하지 마세요. 인증/세션 충돌을 일으킵니다. 에이전트는 로컬 프로필이 없을 때 기본/메인 에이전트의 인증 프로필을 읽을 수 있지만, OpenClaw는 OAuth 새로 고침 토큰을 보조 에이전트 저장소로 복제하지 않습니다. 독립 OAuth 계정을 원한다면 해당 에이전트에서 로그인하세요. 자격 증명을 수동으로 복사하는 경우에는 이식 가능한 정적 `api_key` 또는 `token` 프로필만 복사하세요.
</Warning>

Skills는 각 에이전트 워크스페이스와 `~/.openclaw/skills` 같은 공유 루트에서 로드된 뒤, 구성된 경우 유효 에이전트 Skills 허용 목록으로 필터링됩니다. 공유 기준선에는 `agents.defaults.skills`를 사용하고 에이전트별 교체에는 `agents.list[].skills`를 사용하세요. [Skills: 에이전트별 vs 공유](/ko/tools/skills#per-agent-vs-shared-skills) 및 [Skills: 에이전트 Skills 허용 목록](/ko/tools/skills#agent-skill-allowlists)을 참고하세요.

Gateway는 **하나의 에이전트**(기본값) 또는 **여러 에이전트**를 나란히 호스팅할 수 있습니다.

<Note>
**워크스페이스 참고:** 각 에이전트의 워크스페이스는 **기본 cwd**이지 강제 샌드박스가 아닙니다. 상대 경로는 워크스페이스 안에서 해석되지만, 샌드박싱이 활성화되지 않은 경우 절대 경로는 다른 호스트 위치에 접근할 수 있습니다. [샌드박싱](/ko/gateway/sandboxing)을 참고하세요.
</Note>

## 경로(빠른 맵)

- 구성: `~/.openclaw/openclaw.json`(또는 `OPENCLAW_CONFIG_PATH`)
- 상태 디렉터리: `~/.openclaw`(또는 `OPENCLAW_STATE_DIR`)
- 워크스페이스: `~/.openclaw/workspace`(또는 `~/.openclaw/workspace-<agentId>`)
- 에이전트 디렉터리: `~/.openclaw/agents/<agentId>/agent`(또는 `agents.list[].agentDir`)
- 세션: `~/.openclaw/agents/<agentId>/sessions`

### 단일 에이전트 모드(기본값)

아무 작업도 하지 않으면 OpenClaw는 단일 에이전트를 실행합니다.

- `agentId`의 기본값은 **`main`**입니다.
- 세션 키는 `agent:main:<mainKey>` 형식입니다.
- 워크스페이스 기본값은 `~/.openclaw/workspace`입니다(`OPENCLAW_PROFILE`이 설정된 경우 `~/.openclaw/workspace-<profile>`).
- 상태 기본값은 `~/.openclaw/agents/main/agent`입니다.

## 에이전트 헬퍼

에이전트 마법사를 사용하여 새 격리 에이전트를 추가하세요.

```bash
openclaw agents add work
```

그런 다음 인바운드 메시지를 라우팅하도록 `bindings`를 추가하세요(또는 마법사가 처리하게 하세요).

다음으로 확인하세요.

```bash
openclaw agents list --bindings
```

## 빠른 시작

<Steps>
  <Step title="각 에이전트 워크스페이스 만들기">
    마법사를 사용하거나 워크스페이스를 수동으로 만드세요.

    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    각 에이전트는 `SOUL.md`, `AGENTS.md`, 선택적 `USER.md`가 포함된 자체 워크스페이스와 전용 `agentDir`, 그리고 `~/.openclaw/agents/<agentId>` 아래의 세션 저장소를 갖습니다.

  </Step>
  <Step title="채널 계정 만들기">
    선호하는 채널에서 에이전트별로 계정을 하나씩 만드세요.

    - Discord: 에이전트별로 봇 하나를 만들고 Message Content Intent를 활성화한 뒤 각 토큰을 복사합니다.
    - Telegram: BotFather를 통해 에이전트별로 봇 하나를 만들고 각 토큰을 복사합니다.
    - WhatsApp: 계정별로 각 전화번호를 연결합니다.

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    채널 가이드를 참고하세요: [Discord](/ko/channels/discord), [Telegram](/ko/channels/telegram), [WhatsApp](/ko/channels/whatsapp).

  </Step>
  <Step title="에이전트, 계정, 바인딩 추가하기">
    `agents.list` 아래에 에이전트를, `channels.<channel>.accounts` 아래에 채널 계정을 추가하고, `bindings`로 연결하세요(예시는 아래 참고).
  </Step>
  <Step title="재시작하고 확인하기">
    ```bash
    openclaw gateway restart
    openclaw agents list --bindings
    openclaw channels status --probe
    ```
  </Step>
</Steps>

## 여러 에이전트 = 여러 사람, 여러 성격

**여러 에이전트**를 사용하면 각 `agentId`가 **완전히 격리된 페르소나**가 됩니다.

- **서로 다른 전화번호/계정**(채널별 `accountId`).
- **서로 다른 성격**(`AGENTS.md`, `SOUL.md` 같은 에이전트별 워크스페이스 파일).
- **분리된 인증 + 세션**(명시적으로 활성화하지 않는 한 상호 간섭 없음).

이를 통해 **여러 사람**이 하나의 Gateway 서버를 공유하면서도 각자의 AI "두뇌"와 데이터를 격리할 수 있습니다.

## 크로스 에이전트 QMD 메모리 검색

한 에이전트가 다른 에이전트의 QMD 세션 트랜스크립트를 검색해야 하는 경우 `agents.list[].memorySearch.qmd.extraCollections` 아래에 추가 컬렉션을 넣으세요. 모든 에이전트가 동일한 공유 트랜스크립트 컬렉션을 상속해야 할 때만 `agents.defaults.memorySearch.qmd.extraCollections`를 사용하세요.

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
            extraCollections: [{ path: "notes" }], // resolves inside workspace -> collection named "notes-main"
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

추가 컬렉션 경로는 에이전트 간에 공유할 수 있지만, 경로가 에이전트 워크스페이스 밖에 있으면 컬렉션 이름은 명시적으로 유지됩니다. 워크스페이스 안의 경로는 에이전트 범위로 유지되므로 각 에이전트가 자체 트랜스크립트 검색 세트를 보관합니다.

## 하나의 WhatsApp 번호, 여러 사람(DM 분할)

**하나의 WhatsApp 계정**을 유지하면서 **서로 다른 WhatsApp DM**을 서로 다른 에이전트로 라우팅할 수 있습니다. `peer.kind: "direct"`로 발신자 E.164(예: `+15551234567`)를 매칭하세요. 답장은 여전히 같은 WhatsApp 번호에서 전송됩니다(에이전트별 발신자 ID 없음).

<Note>
다이렉트 채팅은 에이전트의 **메인 세션 키**로 합쳐지므로, 진정한 격리에는 **사람별로 하나의 에이전트**가 필요합니다.
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
- 공유 그룹의 경우 그룹을 하나의 에이전트에 바인딩하거나 [브로드캐스트 그룹](/ko/channels/broadcast-groups)을 사용하세요.

## 라우팅 규칙(메시지가 에이전트를 선택하는 방식)

바인딩은 **결정적**이며 **가장 구체적인 항목이 우선**합니다.

<Steps>
  <Step title="peer 매칭">
    정확한 DM/그룹/채널 id입니다.
  </Step>
  <Step title="parentPeer 매칭">
    스레드 상속입니다.
  </Step>
  <Step title="guildId + 역할">
    Discord 역할 라우팅입니다.
  </Step>
  <Step title="guildId">
    Discord입니다.
  </Step>
  <Step title="teamId">
    Slack입니다.
  </Step>
  <Step title="채널의 accountId 매칭">
    계정별 대체 경로입니다.
  </Step>
  <Step title="채널 수준 매칭">
    `accountId: "*"`.
  </Step>
  <Step title="기본 에이전트">
    `agents.list[].default`로 대체하고, 없으면 첫 번째 목록 항목으로 대체합니다. 기본값: `main`.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="동률 처리와 AND 의미론">
    - 같은 단계에서 여러 바인딩이 매칭되면 구성 순서상 첫 번째 항목이 우선합니다.
    - 바인딩이 여러 매칭 필드(예: `peer` + `guildId`)를 설정하면, 지정된 모든 필드가 필요합니다(`AND` 의미론).

  </Accordion>
  <Accordion title="계정 범위 세부 정보">
    - `accountId`를 생략한 바인딩은 기본 계정에만 매칭됩니다.
    - 모든 계정에 걸친 채널 전체 대체 경로에는 `accountId: "*"`를 사용하세요.
    - 나중에 같은 에이전트에 대해 명시적 계정 id로 같은 바인딩을 추가하면 OpenClaw는 기존 채널 전용 바인딩을 중복 생성하는 대신 계정 범위로 업그레이드합니다.

  </Accordion>
</AccordionGroup>

## 여러 계정/전화번호

**여러 계정**(예: WhatsApp)을 지원하는 채널은 `accountId`를 사용하여 각 로그인을 식별합니다. 각 `accountId`는 서로 다른 에이전트로 라우팅할 수 있으므로, 하나의 서버가 세션을 섞지 않고 여러 전화번호를 호스팅할 수 있습니다.

`accountId`가 생략되었을 때 채널 전체 기본 계정을 원한다면 `channels.<channel>.defaultAccount`를 설정하세요(선택 사항). 설정하지 않으면 OpenClaw는 `default`가 있을 경우 이를 사용하고, 없으면 구성된 첫 번째 계정 id(정렬됨)로 대체합니다.

이 패턴을 지원하는 일반적인 채널은 다음과 같습니다.

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `zalo`, `zalouser`, `nostr`, `feishu`

## 개념

- `agentId`: 하나의 "두뇌"(워크스페이스, 에이전트별 인증, 에이전트별 세션 저장소).
- `accountId`: 하나의 채널 계정 인스턴스(예: WhatsApp 계정 `"personal"` vs `"biz"`).
- `binding`: `(channel, accountId, peer)` 및 선택적 guild/team id를 기준으로 인바운드 메시지를 `agentId`로 라우팅합니다.
- 다이렉트 채팅은 `agent:<agentId>:<mainKey>`로 합쳐집니다(에이전트별 "main"; `session.mainKey`).

## 플랫폼 예시

<AccordionGroup>
  <Accordion title="에이전트별 Discord 봇">
    각 Discord 봇 계정은 고유한 `accountId`에 매핑됩니다. 각 계정을 에이전트에 바인딩하고 봇별 허용 목록을 유지하세요.

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

    - 각 bot을 길드에 초대하고 Message Content Intent를 활성화합니다.
    - token은 `channels.discord.accounts.<id>.token`에 있습니다. 기본 계정은 `DISCORD_BOT_TOKEN`을 사용할 수 있습니다.

  </Accordion>
  <Accordion title="Telegram bots per agent">
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

    - BotFather로 agent마다 bot을 하나씩 만들고 각 token을 복사합니다.
    - token은 `channels.telegram.accounts.<id>.botToken`에 있습니다. 기본 계정은 `TELEGRAM_BOT_TOKEN`을 사용할 수 있습니다.

  </Accordion>
  <Accordion title="WhatsApp numbers per agent">
    Gateway를 시작하기 전에 각 계정을 연결합니다.

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

      // Deterministic routing: first match wins (most-specific first).
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

        // Optional per-peer override (example: send a specific group to work agent).
        {
          agentId: "work",
          match: {
            channel: "whatsapp",
            accountId: "personal",
            peer: { kind: "group", id: "1203630...@g.us" },
          },
        },
      ],

      // Off by default: agent-to-agent messaging must be explicitly enabled + allowlisted.
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
              // Optional override. Default: ~/.openclaw/credentials/whatsapp/personal
              // authDir: "~/.openclaw/credentials/whatsapp/personal",
            },
            biz: {
              // Optional override. Default: ~/.openclaw/credentials/whatsapp/biz
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
  <Tab title="WhatsApp daily + Telegram deep work">
    channel별로 분리합니다. WhatsApp은 빠른 일상용 agent로 라우팅하고 Telegram은 Opus agent로 라우팅합니다.

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

    - 한 channel에 여러 계정이 있다면 binding에 `accountId`를 추가합니다. 예: `{ channel: "whatsapp", accountId: "personal" }`.
    - 나머지는 chat에 유지하면서 단일 DM/group만 Opus로 라우팅하려면 해당 peer에 대한 `match.peer` binding을 추가합니다. peer 일치는 항상 channel 전체 규칙보다 우선합니다.

  </Tab>
  <Tab title="Same channel, one peer to Opus">
    WhatsApp은 빠른 agent에 유지하되, 하나의 DM만 Opus로 라우팅합니다.

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

    peer binding은 항상 우선하므로 channel 전체 규칙 위에 둡니다.

  </Tab>
  <Tab title="Family agent bound to a WhatsApp group">
    전용 가족 agent를 단일 WhatsApp group에 바인딩하고 mention gating과 더 엄격한 tool 정책을 적용합니다.

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

    - tool allow/deny 목록은 **tools**이며 skills가 아닙니다. skill이 바이너리를 실행해야 한다면 `exec`가 허용되어 있고 해당 바이너리가 sandbox에 존재하는지 확인하세요.
    - 더 엄격한 gating을 위해 `agents.list[].groupChat.mentionPatterns`를 설정하고 channel에 group allowlist를 활성화된 상태로 유지합니다.

  </Tab>
</Tabs>

## agent별 sandbox 및 tool 구성

각 agent는 자체 sandbox와 tool 제한을 가질 수 있습니다.

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // No sandbox for personal agent
        },
        // No tool restrictions - all tools available
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // Always sandboxed
          scope: "agent",  // One container per agent
          docker: {
            // Optional one-time setup after container creation
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // Only read tool
          deny: ["exec", "write", "edit", "apply_patch"],    // Deny others
        },
      },
    ],
  },
}
```

<Note>
`setupCommand`는 `sandbox.docker` 아래에 있으며 container 생성 시 한 번 실행됩니다. resolved scope가 `"shared"`이면 agent별 `sandbox.docker.*` override는 무시됩니다.
</Note>

**장점:**

- **보안 격리**: 신뢰할 수 없는 agent의 tool을 제한합니다.
- **리소스 제어**: 특정 agent는 sandbox에 두고 다른 agent는 host에 유지합니다.
- **유연한 정책**: agent별로 서로 다른 권한을 적용합니다.

<Note>
`tools.elevated`는 **global**이며 sender 기반입니다. agent별로 구성할 수 없습니다. agent별 경계가 필요하다면 `agents.list[].tools`를 사용해 `exec`를 거부하세요. group targeting에는 `agents.list[].groupChat.mentionPatterns`를 사용해 @mention이 의도한 agent로 깔끔하게 매핑되도록 합니다.
</Note>

자세한 예시는 [Multi-agent sandbox and tools](/ko/tools/multi-agent-sandbox-tools)를 참조하세요.

## 관련 항목

- [ACP agents](/ko/tools/acp-agents) — 외부 coding harness 실행
- [Channel routing](/ko/channels/channel-routing) — message가 agent로 라우팅되는 방식
- [Presence](/ko/concepts/presence) — agent presence와 availability
- [Session](/ko/concepts/session) — session 격리 및 라우팅
- [Sub-agents](/ko/tools/subagents) — 백그라운드 agent run 생성
