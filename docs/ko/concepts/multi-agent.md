---
read_when: You want multiple agents with separate workspaces, auth, and sessions in one Gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: '멀티 에이전트 라우팅: 에이전트 경계, 채널 계정 및 바인딩'
title: 멀티 에이전트 라우팅
x-i18n:
    generated_at: "2026-07-12T15:08:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 265a1f3d9d9b4957c99c71f391ce4f5abba6b70561570f8bbe8cb9964ece1cfc
    source_path: concepts/multi-agent.md
    workflow: 16
---

  하나의 Gateway 프로세스에서 여러 _격리된_ 에이전트를 실행합니다. 각 에이전트는 자체 워크스페이스, 상태 디렉터리(`agentDir`), SQLite 기반 세션 기록을 가지며, 여러 채널 계정(예: 두 개의 WhatsApp 번호)도 사용할 수 있습니다. 수신 메시지는 **바인딩**을 통해 올바른 에이전트로 라우팅됩니다.

  **에이전트**는 워크스페이스 파일, 인증 프로필, 모델 레지스트리, 세션 저장소를 포함하는 페르소나별 전체 범위입니다. **바인딩**은 채널 계정(Slack 워크스페이스, WhatsApp 번호 등)을 이러한 에이전트 중 하나에 매핑합니다.

  ## 에이전트란 무엇인가

  각 에이전트에는 다음 항목이 개별적으로 제공됩니다.

  - **워크스페이스**: 파일, `AGENTS.md`/`SOUL.md`/`USER.md`, 로컬 메모, 페르소나 규칙.
  - **상태 디렉터리**(`agentDir`): 인증 프로필, 모델 레지스트리, 에이전트별 구성.
  - **세션 저장소**: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`에 저장되는 채팅 기록 및 라우팅 상태.

  인증 프로필은 에이전트별로 관리되며 다음 위치에서 읽습니다.

  ```text
  ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
  ```

  <Note>
  `sessions_history`는 더 안전한 세션 간 회상 경로입니다. 원시 대화 기록 덤프가 아니라 범위가 제한되고 민감 정보가 제거된 보기를 반환합니다. 사고 블록 서명, 도구 결과 페이로드 세부 정보, `<relevant-memories>` 스캐폴딩, 도구 호출 XML 태그(`<tool_call>`, `<function_call>` 및 각각의 복수형/하위 호환 형식), MiniMax 도구 호출 XML을 제거한 다음, 출력을 자르고 바이트 크기로 제한합니다.
  </Note>

  <Warning>
  여러 에이전트에서 `agentDir`을 절대 재사용하지 마십시오. 인증/세션 상태 충돌이 발생합니다. 보조 에이전트의 로컬 OAuth 자격 증명이 만료되거나 갱신에 실패하면 OpenClaw는 동일한 프로필 ID에 해당하는 기본/main 에이전트의 자격 증명까지 읽어 가장 최신 토큰을 채택하며, 갱신 토큰은 보조 에이전트의 저장소에 복사하지 않습니다. 완전히 독립적인 OAuth 계정을 사용하려면 해당 에이전트에서 로그인하십시오. 자격 증명을 수동으로 복사하는 경우 이식 가능한 정적 `api_key` 또는 `token` 프로필만 복사하십시오. OAuth 갱신 자료는 기본적으로 이식할 수 없습니다(`copyToAgents`를 사용하면 프로필을 명시적으로 포함할 수 있습니다).
  </Warning>

  Skills는 각 에이전트 워크스페이스와 `~/.openclaw/skills` 같은 공유 루트에서 로드된 다음, 적용되는 에이전트 Skills 허용 목록에 따라 필터링됩니다. 공유 기준에는 `agents.defaults.skills`를 사용하고, 에이전트별 대체 항목에는 `agents.list[].skills`를 사용하십시오(명시적 항목은 기본값을 대체하며 병합되지 않습니다). [Skills: 에이전트별 및 공유](/ko/tools/skills#per-agent-vs-shared-skills) 및 [Skills: 에이전트 허용 목록](/ko/tools/skills#agent-allowlists)을 참조하십시오.

  Plugin 소유 저장소는 해당 Plugin의 구성을 따릅니다. 두 번째 에이전트를 추가해도 모든 전역 Plugin 저장소가 자동으로 분리되지는 않습니다. 예를 들어 페르소나 간에 컴파일된 위키 지식을 공유하지 않아야 하는 경우 [에이전트별 Memory Wiki 볼트](/ko/concepts/multi-agent#per-agent-memory-wiki-vaults)를 구성하십시오.

  <Note>
  **워크스페이스 참고:** 각 에이전트의 워크스페이스는 **기본 cwd**이며 강제 샌드박스가 아닙니다. 상대 경로는 워크스페이스 내부에서 해석되지만, 샌드박싱을 활성화하지 않으면 절대 경로를 통해 호스트의 다른 위치에 접근할 수 있습니다. [샌드박싱](/ko/gateway/sandboxing)을 참조하십시오.
  </Note>

  ## 경로

  | 항목                             | 기본값                                                                                | 재정의                                                                                 |
  | -------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
  | 구성                           | `~/.openclaw/openclaw.json`                                                            | `OPENCLAW_CONFIG_PATH`                                                                   |
  | 상태 디렉터리                        | `~/.openclaw`                                                                          | `OPENCLAW_STATE_DIR`                                                                     |
  | 기본 에이전트의 워크스페이스        | `~/.openclaw/workspace` (`OPENCLAW_PROFILE`이 설정된 경우 `workspace-<profile>`)      | `agents.list[].workspace`, 그다음 `agents.defaults.workspace` 또는 `OPENCLAW_WORKSPACE_DIR` |
  | 기타 에이전트의 워크스페이스          | `<stateDir>/workspace-<agentId>` (설정된 경우 `<agents.defaults.workspace>/<agentId>`) | `agents.list[].workspace`                                                                |
  | 에이전트 디렉터리                        | `~/.openclaw/agents/<agentId>/agent`                                                   | `agents.list[].agentDir`                                                                 |
  | 세션 및 대화 기록         | `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`                             | —                                                                                        |
  | 레거시/보관 세션 아티팩트 | `~/.openclaw/agents/<agentId>/sessions`                                                | —                                                                                        |

  ### 단일 에이전트 모드(기본값)

  아무것도 구성하지 않으면 OpenClaw는 하나의 에이전트를 실행합니다.

  - `agentId`의 기본값은 `main`입니다.
  - 세션 키는 `agent:main:<mainKey>` 형식입니다(기본 `mainKey`는 `main`).
  - 워크스페이스의 기본값은 `~/.openclaw/workspace`입니다(`OPENCLAW_PROFILE`이 `default` 이외의 값으로 설정된 경우 `workspace-<profile>`).
  - 상태의 기본값은 `~/.openclaw/agents/main/agent`입니다.

  ## 에이전트 도우미

  격리된 새 에이전트를 추가합니다.

  ```bash
  openclaw agents add work
  ```

  플래그: `--workspace <dir>`, `--model <id>`, `--agent-dir <dir>`, `--bind <channel[:accountId]>`(반복 가능), `--non-interactive`(`--workspace` 필요).

  수신 메시지를 라우팅하도록 `bindings`를 추가한 다음(마법사가 이 작업을 제안합니다) 확인합니다.

  ```bash
  openclaw agents list --bindings
  ```

  ## 빠른 시작

  <Steps>
  <Step title="각 에이전트 워크스페이스 생성">
    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    각 에이전트에는 `SOUL.md`, `AGENTS.md`, 선택적 `USER.md`가 포함된 자체 워크스페이스와 전용 `agentDir`, 그리고 `~/.openclaw/agents/<agentId>` 아래의 세션 저장소가 제공됩니다.

  </Step>
  <Step title="채널 계정 생성">
    선호하는 채널에서 에이전트마다 계정을 하나씩 생성하십시오.

    - Discord: 에이전트마다 봇 하나를 사용하고, Message Content Intent를 활성화한 다음 각 토큰을 복사합니다.
    - Telegram: BotFather를 통해 에이전트마다 봇 하나를 만들고 각 토큰을 복사합니다.
    - WhatsApp: 계정마다 각 전화번호를 연결합니다.

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    채널 가이드를 참조하십시오: [Discord](/ko/channels/discord), [Telegram](/ko/channels/telegram), [WhatsApp](/ko/channels/whatsapp).

  </Step>
  <Step title="에이전트, 계정 및 바인딩 추가">
    `agents.list` 아래에 에이전트를, `channels.<channel>.accounts` 아래에 채널 계정을 추가하고, `bindings`로 연결합니다(아래 예시 참조).
  </Step>
  <Step title="재시작 및 확인">
    ```bash
    openclaw gateway restart
    openclaw agents list --bindings
    openclaw channels status --probe
    ```
  </Step>
</Steps>

## 여러 에이전트, 여러 페르소나

구성된 각 `agentId`는 핵심 에이전트 상태에 대해 서로 구분되는 페르소나 경계입니다.

- 채널별로 서로 다른 계정(`accountId`별).
- 서로 다른 성격(에이전트별 `AGENTS.md`/`SOUL.md`).
- 별도의 인증 및 세션. 에이전트 간 접근은 명시적 기능이나 Plugin 구성을 통해서만 활성화됩니다.

이를 통해 여러 사람이 하나의 Gateway를 공유하면서 핵심 에이전트 상태를 서로 분리할 수 있습니다.

## 에이전트별 Memory Wiki 볼트

Memory Wiki는 기본적으로 하나의 전역 볼트를 사용합니다. 지원 에이전트가
컴파일한 지식을 마케팅 에이전트의 지식과 분리하려면
`plugins.entries.memory-wiki.config.vault.scope`를 `agent`로 설정합니다.

```json5
{
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vault: {
            scope: "agent",
            path: "~/.openclaw/wiki",
          },
        },
      },
    },
  },
}
```

구성된 경로는 상위 디렉터리입니다. OpenClaw는 정규화된
에이전트 ID를 추가하여 `~/.openclaw/wiki/support` 및
`~/.openclaw/wiki/marketing`과 같은 경로를 생성합니다. 여러 에이전트가 구성된 경우
에이전트 범위 CLI 및 Gateway 작업에는 에이전트를 명시적으로 지정해야 합니다.
브리지 필터링, 마이그레이션 및 신뢰 경계에 관한 자세한 내용은
[Memory Wiki 에이전트별 볼트](/ko/plugins/memory-wiki#per-agent-vaults)를 참조하십시오.

## 에이전트 간 QMD 메모리 검색

한 에이전트가 다른 에이전트의 QMD 세션 트랜스크립트를 검색할 수 있도록 하려면 `agents.list[].memorySearch.qmd.extraCollections` 아래에 추가 컬렉션을 추가합니다. 모든 에이전트가 동일한 컬렉션을 공유해야 하는 경우 `agents.defaults.memorySearch.qmd.extraCollections`를 사용합니다.

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
            extraCollections: [{ path: "notes" }], // 워크스페이스 내부에서 해석됨 -> "notes-main"이라는 이름의 컬렉션
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

추가 컬렉션 경로는 에이전트 간에 공유할 수 있지만, 경로가 에이전트 워크스페이스 외부에 있으면 `name`을 명시적으로 유지해야 합니다. 워크스페이스 내부의 경로는 에이전트 범위로 유지되므로 각 에이전트가 자체 트랜스크립트 검색 세트를 보유합니다.

## 하나의 WhatsApp 번호, 여러 사용자(DM 분리)

**하나의** WhatsApp 계정에서 발신자의 E.164(`+15551234567`)를 `peer.kind: "direct"`와 일치시켜 서로 다른 WhatsApp DM을 서로 다른 에이전트로 라우팅합니다. 응답은 여전히 동일한 WhatsApp 번호에서 전송되며, 에이전트별 발신자 ID는 없습니다.

<Note>
직접 채팅은 기본적으로 에이전트의 기본 세션 키로 통합되므로, 완전한 격리를 위해서는 사용자마다 에이전트 하나가 필요합니다.
</Note>

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

DM 접근 제어(페어링/허용 목록)는 에이전트별이 아니라 WhatsApp 계정별로 전역 적용됩니다. 공유 그룹의 경우 그룹을 하나의 에이전트에 바인딩하거나 [브로드캐스트 그룹](/ko/channels/broadcast-groups)을 사용합니다.

## 라우팅 규칙

바인딩은 결정론적이며 가장 구체적인 항목이 우선합니다. 전체 계층 순서(정확한 피어, 상위 피어, 피어 와일드카드, 길드+역할, 길드, 팀, 계정, 채널, 기본 에이전트)는 [채널 라우팅](/ko/channels/channel-routing#routing-rules-how-an-agent-is-chosen)을 참조하십시오. 여기서 강조할 만한 몇 가지 규칙은 다음과 같습니다.

- 동일한 계층에서 여러 바인딩이 일치하면 구성 순서상 첫 번째 바인딩이 우선합니다.
- 바인딩에 여러 일치 필드(예: `peer` + `guildId`)가 설정되어 있으면 지정된 모든 필드가 일치해야 합니다(`AND` 의미 체계).
- `accountId`가 생략된 바인딩은 모든 계정이 아니라 기본 계정에만 일치합니다. 채널 전체 대체 경로에는 `accountId: "*"`를, 하나의 계정에는 `accountId: "<name>"`을 사용합니다. 동일한 바인딩을 명시적 계정 ID와 함께 다시 추가하면 기존 채널 전용 바인딩을 중복 생성하지 않고 업그레이드합니다.

## 여러 계정/전화번호

여러 계정을 지원하는 채널(예: WhatsApp)은 `accountId`를 사용하여 각 로그인을 식별합니다. 각 `accountId`는 자체 에이전트로 라우팅되므로 하나의 서버에서 세션을 혼합하지 않고 여러 전화번호를 호스팅할 수 있습니다.

`accountId`가 생략될 때 사용할 계정을 선택하려면 `channels.<channel>.defaultAccount`를 설정합니다. 설정하지 않으면 OpenClaw는 `default`가 있는 경우 이를 사용하고, 그렇지 않으면 구성된 첫 번째 계정 ID(정렬 기준)를 사용합니다.

여러 계정을 지원하는 채널: `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `mattermost`, `matrix`, `nextcloud-talk`, `nostr`, `signal`, `slack`, `telegram`, `whatsapp`, `zalo`, `zalouser`.

## 개념

- `agentId`: 하나의 "두뇌"(워크스페이스, 에이전트별 인증, 에이전트별 세션 저장소).
- `accountId`: 하나의 채널 계정 인스턴스(예: WhatsApp 계정 `personal`과 `biz`).
- `binding`: `(channel, accountId, peer)` 및 선택적으로 길드/팀 ID를 기준으로 수신 메시지를 `agentId`에 라우팅합니다.
- 직접 채팅은 `agent:<agentId>:<mainKey>`로 통합됩니다(에이전트별 "메인", `session.mainKey` 참조).

## 플랫폼 예시

<AccordionGroup>
  <Accordion title="에이전트별 Discord 봇">
    각 Discord 봇 계정은 고유한 `accountId`에 매핑됩니다. 각 계정을 에이전트에 바인딩하고 봇별 허용 목록을 유지하십시오.

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

    - 각 봇을 길드에 초대하고 Message Content Intent를 활성화하십시오.
    - 토큰은 `channels.discord.accounts.<id>.token`에 저장됩니다(기본 계정은 `DISCORD_BOT_TOKEN`을 사용할 수 있습니다).

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

    - BotFather에서 에이전트마다 봇을 하나씩 만들고 각 토큰을 복사하십시오.
    - 토큰은 `channels.telegram.accounts.<id>.botToken`에 저장됩니다(기본 계정은 `TELEGRAM_BOT_TOKEN`을 사용할 수 있습니다).
    - 동일한 Telegram 그룹에서 여러 봇을 사용하는 경우 각 봇을 초대한 뒤 응답해야 하는 봇을 멘션하십시오.
    - 각 그룹 봇의 BotFather Privacy Mode를 비활성화하고(`/setprivacy` -> Disable), Telegram에서 설정을 적용할 수 있도록 봇을 제거한 후 다시 추가하십시오.
    - `channels.telegram.groups`로 그룹을 허용하거나, 신뢰할 수 있는 그룹 배포에만 `groupPolicy: "open"`을 사용하십시오.
    - 발신자 사용자 ID는 `groupAllowFrom`에 넣으십시오. 그룹 및 슈퍼그룹 ID는 `groupAllowFrom`이 아니라 `channels.telegram.groups`에 속합니다.
    - 각 봇이 자체 에이전트로 라우팅되도록 `accountId`를 기준으로 바인딩하십시오.

  </Accordion>
  <Accordion title="에이전트별 WhatsApp 번호">
    Gateway를 시작하기 전에 각 계정을 연결하십시오.

    ```bash
    openclaw channels login --channel whatsapp --account personal
    openclaw channels login --channel whatsapp --account biz
    ```

    `~/.openclaw/openclaw.json`(JSON5):

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

      // 결정론적 라우팅: 첫 번째 일치 항목이 우선합니다(가장 구체적인 항목부터).
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

        // 선택적 피어별 재정의(예: 특정 그룹을 업무용 에이전트로 전송).
        {
          agentId: "work",
          match: {
            channel: "whatsapp",
            accountId: "personal",
            peer: { kind: "group", id: "1203630...@g.us" },
          },
        },
      ],

      // 기본적으로 꺼짐: 에이전트 간 메시징은 명시적으로 활성화하고 허용 목록에 추가해야 합니다.
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
  <Tab title="일상용 WhatsApp + 심층 작업용 Telegram">
    채널별로 분리합니다. WhatsApp은 빠른 일상용 에이전트로, Telegram은 Opus 에이전트로 라우팅합니다.

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
        { agentId: "chat", match: { channel: "whatsapp", accountId: "*" } },
        { agentId: "opus", match: { channel: "telegram", accountId: "*" } },
      ],
    }
    ```

    이 예시에서는 `accountId: "*"`을 사용하므로 나중에 계정을 추가해도 바인딩이 계속 작동합니다. 나머지는 채팅 에이전트에 유지하면서 단일 DM/그룹을 Opus로 라우팅하려면 해당 피어에 대한 `match.peer` 바인딩을 추가하십시오. 피어 일치는 항상 채널 전체 규칙보다 우선합니다.

  </Tab>
  <Tab title="동일한 채널에서 하나의 피어만 Opus로 라우팅">
    WhatsApp은 빠른 에이전트에 유지하되 하나의 DM만 Opus로 라우팅합니다.

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
          match: { channel: "whatsapp", accountId: "*", peer: { kind: "direct", id: "+15551234567" } },
        },
        { agentId: "chat", match: { channel: "whatsapp", accountId: "*" } },
      ],
    }
    ```

    피어 바인딩은 항상 우선하므로 채널 전체 규칙보다 위에 두십시오.

  </Tab>
  <Tab title="WhatsApp 그룹에 바인딩된 가족 에이전트">
    전용 가족 에이전트를 단일 WhatsApp 그룹에 바인딩하고, 멘션 게이트와 더 엄격한 도구 정책을 적용합니다.

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

    도구 허용/거부 목록은 Skills가 아니라 **도구**입니다. Skills에서 바이너리를 실행해야 한다면 `exec`가 허용되어 있고 해당 바이너리가 샌드박스에 존재하는지 확인하십시오. 더 엄격하게 제한하려면 `agents.list[].groupChat.mentionPatterns`를 설정하고 채널의 그룹 허용 목록을 활성화된 상태로 유지하십시오.

  </Tab>
</Tabs>

## 에이전트별 샌드박스 및 도구 구성

각 에이전트는 자체 샌드박스 및 도구 제한을 가질 수 있습니다.

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // 개인 에이전트에는 샌드박스 없음
        },
        // 도구 제한 없음 - 모든 도구 사용 가능
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // 항상 샌드박스에서 실행
          scope: "agent",  // 에이전트당 컨테이너 하나
          docker: {
            // 컨테이너 생성 후 선택적으로 한 번만 설정
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // 읽기 도구만 허용
          deny: ["exec", "write", "edit", "apply_patch"],    // 그 외 도구 거부
        },
      },
    ],
  },
}
```

<Note>
`setupCommand`는 `sandbox.docker` 아래에 있으며 컨테이너 생성 시 한 번 실행됩니다. 확인된 범위가 `"shared"`이면 에이전트별 `sandbox.docker.*` 재정의는 무시됩니다.
</Note>

이 구성은 다음과 같은 이점을 제공합니다.

- **보안 격리**: 신뢰할 수 없는 에이전트의 도구를 제한합니다.
- **리소스 제어**: 일부 에이전트는 샌드박스에서 실행하면서 나머지는 호스트에서 유지합니다.
- **유연한 정책**: 에이전트마다 서로 다른 권한을 적용합니다.

<Note>
`tools.elevated`에는 전역 게이트(`tools.elevated.enabled`/`allowFrom`)와 에이전트별 게이트(`agents.list[].tools.elevated.enabled`/`allowFrom`)가 모두 있습니다. 에이전트별 게이트는 전역 게이트보다 더 제한할 수만 있습니다. 상승된 권한 명령을 실행하려면 두 게이트 모두 발신자를 허용해야 합니다. 그룹을 대상으로 지정하려면 `agents.list[].groupChat.mentionPatterns`를 사용하여 @멘션이 의도한 에이전트에 명확하게 매핑되도록 하십시오.
</Note>

자세한 예시는 [다중 에이전트 샌드박스 및 도구](/ko/tools/multi-agent-sandbox-tools)를 참조하십시오.

## 관련 항목

- [ACP 에이전트](/ko/tools/acp-agents) — 외부 코딩 하네스 실행
- [채널 라우팅](/ko/channels/channel-routing) — 메시지가 에이전트로 라우팅되는 방식
- [프레즌스](/ko/concepts/presence) — 에이전트의 프레즌스 및 가용성
- [세션](/ko/concepts/session) — 세션 격리 및 라우팅
- [하위 에이전트](/ko/tools/subagents) — 백그라운드 에이전트 실행 생성
