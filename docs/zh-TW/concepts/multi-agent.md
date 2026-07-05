---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 多代理路由：隔離的代理、頻道帳號與繫結
title: 多代理路由
x-i18n:
    generated_at: "2026-07-05T11:14:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 48e32d9e8ac2b68fdceb9a84d95bae2a73ab10f9c5fd177b72e8e452954329e9
    source_path: concepts/multi-agent.md
    workflow: 16
---

在一個閘道程序中執行多個_隔離的_代理，每個代理都有自己的工作區、狀態目錄（`agentDir`）和工作階段儲存區，並可搭配多個頻道帳號（例如兩個 WhatsApp 號碼）。傳入訊息會透過**繫結**路由到正確的代理。

**代理**是完整的每個人格範圍：工作區檔案、驗證設定檔、模型登錄檔和工作階段儲存區。**繫結**會將頻道帳號（Slack 工作區、WhatsApp 號碼等）對應到其中一個代理。

## 什麼是一個代理

每個代理都有自己的：

- **工作區**：檔案、`AGENTS.md`/`SOUL.md`/`USER.md`、本機筆記、人格規則。
- **狀態目錄**（`agentDir`）：驗證設定檔、模型登錄檔、每個代理的設定。
- **工作階段儲存區**：位於 `~/.openclaw/agents/<agentId>/sessions` 下的聊天記錄和路由狀態。

驗證設定檔是每個代理各自獨立，讀取自：

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` 是更安全的跨工作階段回憶路徑：它會傳回有界且已遮罩的檢視，而不是原始逐字稿傾印。它會移除思考區塊簽章、工具結果酬載細節、`<relevant-memories>` 鷹架、工具呼叫 XML 標籤（`<tool_call>`、`<function_call>` 及其複數/降級形式），以及 MiniMax 工具呼叫 XML，然後依位元組大小截斷並限制輸出。
</Note>

<Warning>
切勿在多個代理之間重複使用 `agentDir`，否則會造成驗證/工作階段狀態衝突。當次要代理的本機 OAuth 憑證已過期或重新整理失敗時，OpenClaw 會讀取同一設定檔 ID 的預設/主要代理憑證，並採用較新的權杖，而不會將重新整理權杖複製到次要代理的儲存區。如果你想要完全獨立的 OAuth 帳號，請從該代理登入。如果你手動複製憑證，請只複製可攜式的靜態 `api_key` 或 `token` 設定檔，OAuth 重新整理資料預設不可攜（`copyToAgents` 可明確選擇讓某個設定檔加入）。
</Warning>

Skills 會從每個代理工作區加上共享根目錄載入，例如 `~/.openclaw/skills`，然後依有效的代理 Skills 允許清單篩選。使用 `agents.defaults.skills` 作為共享基準，並使用 `agents.list[].skills` 作為每個代理的替換項目（明確項目會取代預設值，不會合併）。請參閱 [Skills：每個代理與共享](/zh-TW/tools/skills#per-agent-vs-shared-skills) 和 [Skills：代理允許清單](/zh-TW/tools/skills#agent-allowlists)。

<Note>
**工作區注意事項：**每個代理的工作區是**預設 cwd**，不是硬性沙箱。相對路徑會在工作區內解析，但除非啟用沙箱，否則絕對路徑可以存取其他主機位置。請參閱[沙箱](/zh-TW/gateway/sandboxing)。
</Note>

## 路徑

| 項目                      | 預設值                                                                                | 覆寫                                                                                 |
| ------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 設定                    | `~/.openclaw/openclaw.json`                                                            | `OPENCLAW_CONFIG_PATH`                                                                   |
| 狀態目錄                 | `~/.openclaw`                                                                          | `OPENCLAW_STATE_DIR`                                                                     |
| 預設代理的工作區 | `~/.openclaw/workspace`（或在設定 `OPENCLAW_PROFILE` 時為 `workspace-<profile>`）      | `agents.list[].workspace`，然後是 `agents.defaults.workspace`，或 `OPENCLAW_WORKSPACE_DIR` |
| 其他代理的工作區   | `<stateDir>/workspace-<agentId>`（或在設定時為 `<agents.defaults.workspace>/<agentId>`） | `agents.list[].workspace`                                                                |
| 代理目錄                 | `~/.openclaw/agents/<agentId>/agent`                                                   | `agents.list[].agentDir`                                                                 |
| 工作階段                  | `~/.openclaw/agents/<agentId>/sessions`                                                | —                                                                                        |

### 單代理模式（預設）

如果你未設定任何內容，OpenClaw 會執行一個代理：

- `agentId` 預設為 `main`。
- 工作階段鍵為 `agent:main:<mainKey>`（預設 `mainKey` 是 `main`）。
- 工作區預設為 `~/.openclaw/workspace`（或當 `OPENCLAW_PROFILE` 設為 `default` 以外的值時為 `workspace-<profile>`）。
- 狀態預設為 `~/.openclaw/agents/main/agent`。

## 代理輔助工具

新增一個隔離的代理：

```bash
openclaw agents add work
```

旗標：`--workspace <dir>`、`--model <id>`、`--agent-dir <dir>`、`--bind <channel[:accountId]>`（可重複）、`--non-interactive`（需要 `--workspace`）。

新增 `bindings` 以路由傳入訊息（精靈會主動提供協助），然後驗證：

```bash
openclaw agents list --bindings
```

## 快速開始

<Steps>
  <Step title="建立每個代理工作區">
    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    每個代理都會取得自己的工作區，其中包含 `SOUL.md`、`AGENTS.md` 和選用的 `USER.md`，並在 `~/.openclaw/agents/<agentId>` 下有專屬的 `agentDir` 和工作階段儲存區。

  </Step>
  <Step title="建立頻道帳號">
    在你偏好的頻道上為每個代理建立一個帳號：

    - Discord：每個代理一個機器人，啟用 Message Content Intent，複製每個權杖。
    - Telegram：透過 BotFather 為每個代理建立一個機器人，複製每個權杖。
    - WhatsApp：為每個帳號連結每個電話號碼。

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    請參閱頻道指南：[Discord](/zh-TW/channels/discord)、[Telegram](/zh-TW/channels/telegram)、[WhatsApp](/zh-TW/channels/whatsapp)。

  </Step>
  <Step title="新增代理、帳號和繫結">
    在 `agents.list` 下新增代理，在 `channels.<channel>.accounts` 下新增頻道帳號，並使用 `bindings` 將它們連接（範例如下）。
  </Step>
  <Step title="重新啟動並驗證">
    ```bash
    openclaw gateway restart
    openclaw agents list --bindings
    openclaw channels status --probe
    ```
  </Step>
</Steps>

## 多個代理，多個人格

每個已設定的 `agentId` 都是完全隔離的人格：

- 每個頻道有不同帳號（依 `accountId`）。
- 不同個性（每個代理的 `AGENTS.md`/`SOUL.md`）。
- 分離的驗證和工作階段，除非明確啟用，否則不會互相串話。

這讓多人可以共享一個閘道，同時保持各自的代理狀態隔離。

## 跨代理 QMD 記憶搜尋

若要讓一個代理搜尋另一個代理的 QMD 工作階段逐字稿，請在 `agents.list[].memorySearch.qmd.extraCollections` 下新增額外集合。當每個代理都應共享相同集合時，請使用 `agents.defaults.memorySearch.qmd.extraCollections`。

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

額外集合路徑可以在代理之間共享，但當路徑位於代理工作區之外時，其 `name` 仍會保持明確。工作區內的路徑會保留在代理範圍內，讓每個代理保有自己的逐字稿搜尋集合。

## 一個 WhatsApp 號碼，多個人（DM 分流）

透過比對傳送者 E.164（`+15551234567`）與 `peer.kind: "direct"`，可在**同一個** WhatsApp 帳號上將不同 WhatsApp DM 路由到不同代理。回覆仍會來自同一個 WhatsApp 號碼，沒有每個代理各自的傳送者身分。

<Note>
直接聊天預設會折疊到代理的主要工作階段鍵，因此真正隔離需要每人一個代理。
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

DM 存取控制（配對/允許清單）是每個 WhatsApp 帳號的全域設定，不是每個代理各自設定。對於共享群組，請將群組繫結到一個代理，或使用[廣播群組](/zh-TW/channels/broadcast-groups)。

## 路由規則

繫結是確定性的，且最具體者優先。完整層級順序（精確同儕、父同儕、同儕萬用字元、公會+角色、公會、團隊、帳號、頻道、預設代理）請參閱[頻道路由](/zh-TW/channels/channel-routing#routing-rules-how-an-agent-is-chosen)。此處值得特別指出幾條規則：

- 如果多個繫結在同一層級相符，設定順序中的第一個會勝出。
- 如果某個繫結設定了多個比對欄位（例如 `peer` + `guildId`），所有指定欄位都必須相符（`AND` 語意）。
- 省略 `accountId` 的繫結只會比對預設帳號，不會比對每個帳號。使用 `accountId: "*"` 作為整個頻道的後備，或使用 `accountId: "<name>"` 指定一個帳號。再次新增相同繫結並帶有明確帳號 ID 時，會升級既有的僅頻道繫結，而不是建立重複項。

## 多個帳號 / 電話號碼

支援多帳號的頻道（例如 WhatsApp）會使用 `accountId` 識別每次登入。每個 `accountId` 都會路由到自己的代理，因此一台伺服器可以託管多個電話號碼而不混用工作階段。

設定 `channels.<channel>.defaultAccount` 可選擇省略 `accountId` 時使用的帳號。未設定時，OpenClaw 會在存在 `default` 時退回到它，否則使用第一個已設定的帳號 ID（排序後）。

支援多帳號的頻道：`discord`、`feishu`、`googlechat`、`imessage`、`irc`、`line`、`mattermost`、`matrix`、`nextcloud-talk`、`nostr`、`signal`、`slack`、`telegram`、`whatsapp`、`zalo`、`zalouser`。

## 概念

- `agentId`：一個「大腦」（工作區、每個代理的驗證、每個代理的工作階段儲存區）。
- `accountId`：一個頻道帳號執行個體（例如 WhatsApp 帳號 `personal` 與 `biz`）。
- `binding`：依 `(channel, accountId, peer)` 以及選用的公會/團隊 ID，將傳入訊息路由到 `agentId`。
- 直接聊天會折疊到 `agent:<agentId>:<mainKey>`（每個代理的「main」；請參閱 `session.mainKey`）。

## 平台範例

<AccordionGroup>
  <Accordion title="每個代理的 Discord 機器人">
    每個 Discord 機器人帳號都會對應到唯一的 `accountId`。將每個帳號繫結到一個代理，並為每個機器人保留允許清單。

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

    - 邀請每個機器人加入 guild，並啟用訊息內容意圖。
    - 權杖位於 `channels.discord.accounts.<id>.token`（預設帳號可以使用 `DISCORD_BOT_TOKEN`）。

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

    - 使用 BotFather 為每個代理建立一個機器人，並複製每個權杖。
    - 權杖位於 `channels.telegram.accounts.<id>.botToken`（預設帳號可以使用 `TELEGRAM_BOT_TOKEN`）。
    - 若同一個 Telegram 群組中有多個機器人，請邀請每個機器人，並提及應該回覆的那一個。
    - 對每個群組機器人停用 BotFather Privacy Mode（`/setprivacy` -> Disable），然後移除並重新加入機器人，讓 Telegram 套用該設定。
    - 使用 `channels.telegram.groups` 允許群組，或僅對受信任的群組部署使用 `groupPolicy: "open"`。
    - 將傳送者使用者 ID 放入 `groupAllowFrom`。群組和超級群組 ID 屬於 `channels.telegram.groups`，而不是 `groupAllowFrom`。
    - 依 `accountId` 繫結，讓每個機器人路由到自己的代理。

  </Accordion>
  <Accordion title="WhatsApp numbers per agent">
    啟動閘道前，先連結每個帳號：

    ```bash
    openclaw channels login --channel whatsapp --account personal
    openclaw channels login --channel whatsapp --account biz
    ```

    `~/.openclaw/openclaw.json` (JSON5)：

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

## 常見模式

<Tabs>
  <Tab title="WhatsApp daily + Telegram deep work">
    依頻道路由：將 WhatsApp 路由到快速的日常代理，並將 Telegram 路由到 Opus 代理。

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

    這些範例使用 `accountId: "*"`，因此如果稍後新增帳號，繫結仍會繼續運作。若要將單一私訊/群組路由到 Opus，同時讓其餘項目維持在 chat，請為該 peer 新增 `match.peer` 繫結；peer 符合一律優先於整個頻道的規則。

  </Tab>
  <Tab title="Same channel, one peer to Opus">
    將 WhatsApp 保持在快速代理上，但將一個私訊路由到 Opus：

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

    Peer 繫結一律優先，因此請將它們保留在通道範圍規則之上。

  </Tab>
  <Tab title="Family agent bound to a WhatsApp group">
    將專用家庭代理繫結到單一 WhatsApp 群組，並搭配提及門控與更嚴格的工具政策：

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

    工具允許/拒絕清單是**工具**，不是 Skills。如果某個 Skill 需要執行二進位檔，請確保允許 `exec`，且該二進位檔存在於沙盒中。若要更嚴格的門控，請設定 `agents.list[].groupChat.mentionPatterns`，並為通道保持群組允許清單啟用。

  </Tab>
</Tabs>

## 個別代理的沙盒與工具設定

每個代理都可以有自己的沙盒與工具限制：

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
`setupCommand` 位於 `sandbox.docker` 底下，並在容器建立時執行一次。解析後的範圍為 `"shared"` 時，會忽略個別代理的 `sandbox.docker.*` 覆寫。
</Note>

這會提供：

- **安全隔離**：限制不受信任代理的工具。
- **資源控制**：將特定代理放入沙盒，同時讓其他代理保留在主機上。
- **彈性政策**：每個代理使用不同權限。

<Note>
`tools.elevated` 同時有全域門控（`tools.elevated.enabled`/`allowFrom`）與個別代理門控（`agents.list[].tools.elevated.enabled`/`allowFrom`）。個別代理門控只能進一步限制全域門控 — 兩者都必須允許某個傳送者，提升權限命令才會執行。若要針對群組，請使用 `agents.list[].groupChat.mentionPatterns`，讓 @提及能清楚對應到預期的代理。
</Note>

請參閱[多代理沙盒與工具](/zh-TW/tools/multi-agent-sandbox-tools)以取得詳細範例。

## 相關

- [ACP 代理](/zh-TW/tools/acp-agents) — 執行外部編碼工具鏈
- [通道路由](/zh-TW/channels/channel-routing) — 訊息如何路由到代理
- [存在狀態](/zh-TW/concepts/presence) — 代理存在狀態與可用性
- [工作階段](/zh-TW/concepts/session) — 工作階段隔離與路由
- [子代理](/zh-TW/tools/subagents) — 產生背景代理執行
