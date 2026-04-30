---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 多代理路由：隔離的代理、通道帳號與綁定
title: 多代理路由
x-i18n:
    generated_at: "2026-04-30T03:00:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67adea74d5f97feff3f816cc4c34c9429e7659289013e5a7c7623bd185a50a31
    source_path: concepts/multi-agent.md
    workflow: 16
---

執行多個_隔離_代理——每個代理都有自己的工作區、狀態目錄（`agentDir`）和工作階段歷史——以及多個頻道帳號（例如兩個 WhatsApp 帳號）於同一個執行中的 Gateway。傳入訊息會透過綁定路由到正確的代理。

這裡的 **代理** 是完整的每個角色範圍：工作區檔案、驗證設定檔、模型登錄檔和工作階段儲存區。`agentDir` 是磁碟上的狀態目錄，在 `~/.openclaw/agents/<agentId>/` 保存每個代理的設定。**綁定**會將頻道帳號（例如 Slack 工作區或 WhatsApp 號碼）對應到其中一個代理。

## 什麼是「一個代理」？

**代理**是一個完整限定範圍的大腦，具有自己的：

- **工作區**（檔案、AGENTS.md/SOUL.md/USER.md、本機筆記、角色規則）。
- **狀態目錄**（`agentDir`），用於驗證設定檔、模型登錄檔，以及每個代理的設定。
- **工作階段儲存區**（聊天歷史 + 路由狀態），位於 `~/.openclaw/agents/<agentId>/sessions` 之下。

驗證設定檔是**每個代理各自擁有**。每個代理都會從自己的以下位置讀取：

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` 在這裡也是更安全的跨工作階段回憶路徑：它會回傳有界限、已清理的檢視，而不是原始逐字稿傾印。Assistant 回憶會在遮蔽/截斷前移除思考標籤、`<relevant-memories>` 鷹架、純文字工具呼叫 XML 承載（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`，以及被截斷的工具呼叫區塊）、降級的工具呼叫鷹架、洩漏的 ASCII/全形模型控制權杖，以及格式錯誤的 MiniMax 工具呼叫 XML。
</Note>

<Warning>
切勿在多個代理之間重複使用 `agentDir`（這會造成驗證/工作階段衝突）。當代理沒有本機設定檔時，可以讀取預設/主要代理的驗證設定檔，但 OpenClaw 不會將 OAuth 重新整理權杖複製到次要代理儲存區。如果你想要獨立的 OAuth 帳號，請從該代理登入；如果你手動複製認證，只複製可攜式的靜態 `api_key` 或 `token` 設定檔。
</Warning>

Skills 會從每個代理工作區以及共享根目錄（例如 `~/.openclaw/skills`）載入，然後在有設定時依有效代理 Skills 允許清單篩選。使用 `agents.defaults.skills` 作為共享基線，並使用 `agents.list[].skills` 作為每個代理的替換。請參閱 [Skills：每個代理與共享](/zh-TW/tools/skills#per-agent-vs-shared-skills) 和 [Skills：代理 Skills 允許清單](/zh-TW/tools/skills#agent-skill-allowlists)。

Gateway 可以並排託管**一個代理**（預設）或**多個代理**。

<Note>
**工作區注意事項：**每個代理的工作區是**預設 cwd**，不是硬性沙盒。相對路徑會在工作區內解析，但除非已啟用沙盒，否則絕對路徑可以觸及其他主機位置。請參閱[沙盒](/zh-TW/gateway/sandboxing)。
</Note>

## 路徑（快速對照）

- 設定：`~/.openclaw/openclaw.json`（或 `OPENCLAW_CONFIG_PATH`）
- 狀態目錄：`~/.openclaw`（或 `OPENCLAW_STATE_DIR`）
- 工作區：`~/.openclaw/workspace`（或 `~/.openclaw/workspace-<agentId>`）
- 代理目錄：`~/.openclaw/agents/<agentId>/agent`（或 `agents.list[].agentDir`）
- 工作階段：`~/.openclaw/agents/<agentId>/sessions`

### 單一代理模式（預設）

如果你什麼都不做，OpenClaw 會執行單一代理：

- `agentId` 預設為 **`main`**。
- 工作階段會以 `agent:main:<mainKey>` 作為鍵。
- 工作區預設為 `~/.openclaw/workspace`（或在設定 `OPENCLAW_PROFILE` 時為 `~/.openclaw/workspace-<profile>`）。
- 狀態預設為 `~/.openclaw/agents/main/agent`。

## 代理輔助工具

使用代理精靈新增一個新的隔離代理：

```bash
openclaw agents add work
```

然後新增 `bindings`（或讓精靈處理）以路由傳入訊息。

使用以下命令驗證：

```bash
openclaw agents list --bindings
```

## 快速開始

<Steps>
  <Step title="建立每個代理工作區">
    使用精靈或手動建立工作區：

    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    每個代理都會取得自己的工作區，其中包含 `SOUL.md`、`AGENTS.md` 和選用的 `USER.md`，以及專用的 `agentDir` 和位於 `~/.openclaw/agents/<agentId>` 之下的工作階段儲存區。

  </Step>
  <Step title="建立頻道帳號">
    在你偏好的頻道上為每個代理建立一個帳號：

    - Discord：每個代理一個 bot，啟用 Message Content Intent，複製每個權杖。
    - Telegram：透過 BotFather 為每個代理建立一個 bot，複製每個權杖。
    - WhatsApp：每個帳號連結一個電話號碼。

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    請參閱頻道指南：[Discord](/zh-TW/channels/discord)、[Telegram](/zh-TW/channels/telegram)、[WhatsApp](/zh-TW/channels/whatsapp)。

  </Step>
  <Step title="新增代理、帳號和綁定">
    在 `agents.list` 之下新增代理，在 `channels.<channel>.accounts` 之下新增頻道帳號，並使用 `bindings` 將它們連接起來（範例如下）。
  </Step>
  <Step title="重新啟動並驗證">
    ```bash
    openclaw gateway restart
    openclaw agents list --bindings
    openclaw channels status --probe
    ```
  </Step>
</Steps>

## 多個代理 = 多個人、多種人格

使用**多個代理**時，每個 `agentId` 都會成為一個**完全隔離的角色**：

- **不同的電話號碼/帳號**（每個頻道的 `accountId`）。
- **不同的人格**（每個代理的工作區檔案，例如 `AGENTS.md` 和 `SOUL.md`）。
- **分離的驗證 + 工作階段**（除非明確啟用，否則不會互相干擾）。

這讓**多個人**可以共享一台 Gateway 伺服器，同時保持他們的 AI「大腦」和資料彼此隔離。

## 跨代理 QMD 記憶搜尋

如果一個代理應該搜尋另一個代理的 QMD 工作階段逐字稿，請在 `agents.list[].memorySearch.qmd.extraCollections` 之下新增額外集合。只有在每個代理都應該繼承相同共享逐字稿集合時，才使用 `agents.defaults.memorySearch.qmd.extraCollections`。

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

額外集合路徑可以在代理之間共享，但當路徑位於代理工作區之外時，集合名稱仍會保持明確。工作區內的路徑會維持代理範圍，因此每個代理都會保有自己的逐字稿搜尋集。

## 一個 WhatsApp 號碼，多個人（DM 分流）

你可以在維持**一個 WhatsApp 帳號**的同時，將**不同的 WhatsApp DM** 路由到不同代理。使用 `peer.kind: "direct"` 依傳送者 E.164（例如 `+15551234567`）比對。回覆仍會來自同一個 WhatsApp 號碼（沒有每個代理各自的傳送者身分）。

<Note>
直接聊天會收斂到代理的**主要工作階段鍵**，因此真正隔離需要**每個人一個代理**。
</Note>

範例：

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

注意事項：

- DM 存取控制是**每個 WhatsApp 帳號的全域設定**（配對/允許清單），不是每個代理各自設定。
- 對於共享群組，將群組綁定到一個代理，或使用[廣播群組](/zh-TW/channels/broadcast-groups)。

## 路由規則（訊息如何選擇代理）

綁定是**決定性的**，且**最具體者優先**：

<Steps>
  <Step title="peer 比對">
    精確的 DM/群組/頻道 ID。
  </Step>
  <Step title="parentPeer 比對">
    討論串繼承。
  </Step>
  <Step title="guildId + roles">
    Discord 角色路由。
  </Step>
  <Step title="guildId">
    Discord。
  </Step>
  <Step title="teamId">
    Slack。
  </Step>
  <Step title="頻道的 accountId 比對">
    每個帳號的備援。
  </Step>
  <Step title="頻道層級比對">
    `accountId: "*"`。
  </Step>
  <Step title="預設代理">
    備援到 `agents.list[].default`，否則使用清單第一個項目，預設值：`main`。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="平手決勝與 AND 語意">
    - 如果同一層級中有多個綁定符合，設定順序中的第一個會勝出。
    - 如果綁定設定了多個比對欄位（例如 `peer` + `guildId`），所有指定欄位都必須符合（`AND` 語意）。

  </Accordion>
  <Accordion title="帳號範圍詳細資訊">
    - 省略 `accountId` 的綁定只會比對預設帳號。
    - 使用 `accountId: "*"` 作為跨所有帳號的頻道範圍備援。
    - 如果你稍後為同一代理新增相同綁定並使用明確的帳號 ID，OpenClaw 會將現有的僅頻道綁定升級為帳號範圍，而不是建立重複綁定。

  </Accordion>
</AccordionGroup>

## 多個帳號 / 電話號碼

支援**多個帳號**的頻道（例如 WhatsApp）會使用 `accountId` 識別每次登入。每個 `accountId` 都可以路由到不同代理，因此一台伺服器可以託管多個電話號碼，而不會混合工作階段。

如果你想在省略 `accountId` 時使用頻道範圍的預設帳號，請設定 `channels.<channel>.defaultAccount`（選用）。未設定時，OpenClaw 會在存在 `default` 時回退到 `default`，否則使用第一個已設定的帳號 ID（排序後）。

常見支援此模式的頻道包括：

- `whatsapp`、`telegram`、`discord`、`slack`、`signal`、`imessage`
- `irc`、`line`、`googlechat`、`mattermost`、`matrix`、`nextcloud-talk`
- `bluebubbles`、`zalo`、`zalouser`、`nostr`、`feishu`

## 概念

- `agentId`：一個「大腦」（工作區、每個代理的驗證、每個代理的工作階段儲存區）。
- `accountId`：一個頻道帳號執行個體（例如 WhatsApp 帳號 `"personal"` 與 `"biz"`）。
- `binding`：依 `(channel, accountId, peer)`，以及選用的 guild/team ID，將傳入訊息路由到 `agentId`。
- 直接聊天會收斂到 `agent:<agentId>:<mainKey>`（每個代理的「main」；`session.mainKey`）。

## 平台範例

<AccordionGroup>
  <Accordion title="每個代理的 Discord bot">
    每個 Discord bot 帳號都會對應到唯一的 `accountId`。將每個帳號綁定到一個代理，並為每個 bot 保留允許清單。

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

    - 邀請每個 bot 加入 guild，並啟用 Message Content Intent。
    - 權杖位於 `channels.discord.accounts.<id>.token`（預設帳戶可使用 `DISCORD_BOT_TOKEN`）。

  </Accordion>
  <Accordion title="每個 agent 使用不同的 Telegram bot">
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

    - 使用 BotFather 為每個 agent 建立一個 bot，並複製各自的權杖。
    - 權杖位於 `channels.telegram.accounts.<id>.botToken`（預設帳戶可使用 `TELEGRAM_BOT_TOKEN`）。

  </Accordion>
  <Accordion title="每個 agent 使用不同的 WhatsApp 號碼">
    啟動 Gateway 前，請先連結每個帳戶：

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
  <Tab title="WhatsApp 日常 + Telegram 深度工作">
    依 channel 分流：將 WhatsApp 路由到快速的日常 agent，並將 Telegram 路由到 Opus agent。

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

    注意事項：

    - 如果某個 channel 有多個帳戶，請在繫結中加入 `accountId`（例如 `{ channel: "whatsapp", accountId: "personal" }`）。
    - 若要將單一 DM/group 路由到 Opus，同時讓其餘都留在 chat，請為該 peer 新增 `match.peer` 繫結；peer 符合項目一律優先於整個 channel 的規則。

  </Tab>
  <Tab title="相同 channel，將一個 peer 路由到 Opus">
    讓 WhatsApp 保持使用快速 agent，但將一個 DM 路由到 Opus：

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

    Peer 繫結一律優先，因此請將它們放在整個 channel 規則上方。

  </Tab>
  <Tab title="繫結到 WhatsApp 群組的家庭 agent">
    將專用的家庭 agent 繫結到單一 WhatsApp 群組，並設定 mention 閘控與更嚴格的工具政策：

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

    注意事項：

    - 工具允許/拒絕清單是**工具**，不是 Skills。如果某個 skill 需要執行二進位檔，請確認已允許 `exec`，且該二進位檔存在於 sandbox 中。
    - 如需更嚴格的閘控，請設定 `agents.list[].groupChat.mentionPatterns`，並讓該 channel 的群組允許清單保持啟用。

  </Tab>
</Tabs>

## 每個 agent 的 sandbox 與工具設定

每個 agent 都可以有自己的 sandbox 與工具限制：

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
`setupCommand` 位於 `sandbox.docker` 底下，並會在容器建立時執行一次。當解析後的範圍為 `"shared"` 時，每個 agent 的 `sandbox.docker.*` 覆寫會被忽略。
</Note>

**優點：**

- **安全隔離**：限制不受信任 agent 的工具。
- **資源控制**：將特定 agent 放入 sandbox，同時讓其他 agent 保持在主機上。
- **彈性政策**：為每個 agent 設定不同權限。

<Note>
`tools.elevated` 是**全域**且以傳送者為基準；它無法按 agent 設定。如果需要每個 agent 的邊界，請使用 `agents.list[].tools` 來拒絕 `exec`。若要鎖定群組，請使用 `agents.list[].groupChat.mentionPatterns`，讓 @mentions 能清楚對應到預期的 agent。
</Note>

詳細範例請參閱[多 agent sandbox 與工具](/zh-TW/tools/multi-agent-sandbox-tools)。

## 相關

- [ACP agents](/zh-TW/tools/acp-agents) — 執行外部程式設計工具鏈
- [Channel 路由](/zh-TW/channels/channel-routing) — 訊息如何路由到 agent
- [Presence](/zh-TW/concepts/presence) — agent 的 presence 與可用性
- [Session](/zh-TW/concepts/session) — session 隔離與路由
- [Sub-agents](/zh-TW/tools/subagents) — 產生背景 agent 執行
