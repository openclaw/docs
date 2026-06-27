---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 多代理路由：隔離代理、通道帳號與綁定
title: 多代理路由
x-i18n:
    generated_at: "2026-06-27T19:12:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4c1c55188cd27ea786cf65dcabd356a602e1e6da5f842532b189df59195274db
    source_path: concepts/multi-agent.md
    workflow: 16
---

執行多個_隔離的_代理：每個代理都有自己的工作區、狀態目錄（`agentDir`）和工作階段歷史，並且可在同一個執行中的閘道內搭配多個通道帳號（例如兩個 WhatsApp）。傳入訊息會透過繫結路由到正確的代理。

這裡的**代理**是完整的每 persona 範圍：工作區檔案、驗證設定檔、模型登錄和工作階段儲存區。`agentDir` 是磁碟上的狀態目錄，會在 `~/.openclaw/agents/<agentId>/` 保存此每代理設定。**繫結**會將通道帳號（例如 Slack 工作區或 WhatsApp 號碼）對應到其中一個代理。

## 什麼是「一個代理」？

**代理**是一個完整範圍的腦，擁有自己的：

- **工作區**（檔案、AGENTS.md/SOUL.md/USER.md、本機筆記、persona 規則）。
- **狀態目錄**（`agentDir`），用於驗證設定檔、模型登錄和每代理設定。
- **工作階段儲存區**（聊天歷史 + 路由狀態），位於 `~/.openclaw/agents/<agentId>/sessions` 下。

驗證設定檔是**每代理**的。每個代理都會從自己的位置讀取：

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` 在這裡也是較安全的跨工作階段回想路徑：它會回傳有界限且已清理的檢視，而不是原始逐字稿傾印。Assistant 回想會在遮蔽/截斷之前，移除思考標籤、`<relevant-memories>` 骨架、純文字工具呼叫 XML 酬載（包含 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 和被截斷的工具呼叫區塊）、降級的工具呼叫骨架、外洩的 ASCII/全形模型控制權杖，以及格式錯誤的 MiniMax 工具呼叫 XML。
</Note>

<Warning>
切勿跨代理重複使用 `agentDir`（這會造成驗證/工作階段衝突）。當代理沒有本機設定檔時，可以讀取預設/主要代理的驗證設定檔，但 OpenClaw 不會將 OAuth 重新整理權杖複製到次要代理儲存區。如果你想要獨立的 OAuth 帳號，請從該代理登入；如果你手動複製認證，請只複製可攜式靜態 `api_key` 或 `token` 設定檔。
</Warning>

Skills 會從每個代理工作區加上共享根目錄（例如 `~/.openclaw/skills`）載入，然後在已設定時由有效代理 Skills 允許清單篩選。使用 `agents.defaults.skills` 作為共享基準，並使用 `agents.list[].skills` 作為每代理替換。請參閱 [Skills：每代理與共享](/zh-TW/tools/skills#per-agent-vs-shared-skills) 和 [Skills：代理 Skills 允許清單](/zh-TW/tools/skills#agent-allowlists)。

閘道可以並排託管**一個代理**（預設）或**多個代理**。

<Note>
**工作區注意事項：**每個代理的工作區是**預設 cwd**，不是硬性沙箱。相對路徑會在工作區內解析，但除非已啟用沙箱，否則絕對路徑可以到達主機上的其他位置。請參閱[沙箱](/zh-TW/gateway/sandboxing)。
</Note>

## 路徑（快速對照）

- 設定：`~/.openclaw/openclaw.json`（或 `OPENCLAW_CONFIG_PATH`）
- 狀態目錄：`~/.openclaw`（或 `OPENCLAW_STATE_DIR`）
- 工作區：`~/.openclaw/workspace`（或 `~/.openclaw/workspace-<agentId>`）
- 代理目錄：`~/.openclaw/agents/<agentId>/agent`（或 `agents.list[].agentDir`）
- 工作階段：`~/.openclaw/agents/<agentId>/sessions`

### 單代理模式（預設）

如果你什麼都不做，OpenClaw 會執行單一代理：

- `agentId` 預設為 **`main`**。
- 工作階段會以 `agent:main:<mainKey>` 作為鍵。
- 工作區預設為 `~/.openclaw/workspace`（或在設定 `OPENCLAW_PROFILE` 時為 `~/.openclaw/workspace-<profile>`）。
- 狀態預設為 `~/.openclaw/agents/main/agent`。

## 代理輔助工具

使用代理精靈新增一個隔離代理：

```bash
openclaw agents add work
```

接著新增 `bindings`（或讓精靈完成）以路由傳入訊息。

使用下列指令驗證：

```bash
openclaw agents list --bindings
```

## 快速開始

<Steps>
  <Step title="Create each agent workspace">
    使用精靈或手動建立工作區：

    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    每個代理都會取得自己的工作區，內含 `SOUL.md`、`AGENTS.md` 和選用的 `USER.md`，以及專用的 `agentDir` 和位於 `~/.openclaw/agents/<agentId>` 下的工作階段儲存區。

  </Step>
  <Step title="Create channel accounts">
    在你偏好的通道上為每個代理建立一個帳號：

    - Discord：每個代理一個 Bot，啟用 Message Content Intent，複製每個權杖。
    - Telegram：每個代理透過 BotFather 建立一個 Bot，複製每個權杖。
    - WhatsApp：每個帳號連結各自的電話號碼。

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    請參閱通道指南：[Discord](/zh-TW/channels/discord)、[Telegram](/zh-TW/channels/telegram)、[WhatsApp](/zh-TW/channels/whatsapp)。

  </Step>
  <Step title="Add agents, accounts, and bindings">
    在 `agents.list` 下新增代理，在 `channels.<channel>.accounts` 下新增通道帳號，並使用 `bindings` 將它們連接起來（範例如下）。
  </Step>
  <Step title="Restart and verify">
    ```bash
    openclaw gateway restart
    openclaw agents list --bindings
    openclaw channels status --probe
    ```
  </Step>
</Steps>

## 多個代理 = 多個人、多種個性

使用**多個代理**時，每個 `agentId` 都會成為**完全隔離的 persona**：

- **不同電話號碼/帳號**（每通道 `accountId`）。
- **不同個性**（每代理工作區檔案，例如 `AGENTS.md` 和 `SOUL.md`）。
- **分離的驗證 + 工作階段**（除非明確啟用，否則不會互相干擾）。

這讓**多個人**可以共用一台閘道伺服器，同時保持他們的 AI「腦」和資料隔離。

## 跨代理 QMD 記憶搜尋

如果一個代理應該搜尋另一個代理的 QMD 工作階段逐字稿，請在 `agents.list[].memorySearch.qmd.extraCollections` 下新增額外集合。只有在每個代理都應該繼承相同共享逐字稿集合時，才使用 `agents.defaults.memorySearch.qmd.extraCollections`。

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

額外集合路徑可以跨代理共享，但當路徑位於代理工作區外時，集合名稱仍會保持明確。工作區內的路徑會維持代理範圍，因此每個代理都保有自己的逐字稿搜尋集。

## 一個 WhatsApp 號碼，多個人（DM 拆分）

你可以在維持**一個 WhatsApp 帳號**的同時，將**不同 WhatsApp DM** 路由到不同代理。使用 `peer.kind: "direct"` 比對寄件者 E.164（例如 `+15551234567`）。回覆仍會來自同一個 WhatsApp 號碼（沒有每代理寄件者身分）。

<Note>
直接聊天會收斂到代理的**主要工作階段鍵**，因此真正的隔離需要**每人一個代理**。
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

- DM 存取控制是**每個 WhatsApp 帳號全域**的（配對/允許清單），不是每代理。
- 對於共享群組，請將群組繫結到一個代理，或使用[廣播群組](/zh-TW/channels/broadcast-groups)。

## 路由規則（訊息如何選擇代理）

繫結是**決定性的**，且**最具體者優先**：

<Steps>
  <Step title="peer match">
    精確的 DM/群組/通道 ID。
  </Step>
  <Step title="parentPeer match">
    執行緒繼承。
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
  <Step title="accountId match for a channel">
    每帳號後援。
  </Step>
  <Step title="Channel-level match">
    `accountId: "*"`。
  </Step>
  <Step title="Default agent">
    後援至 `agents.list[].default`，否則為第一個清單項目，預設：`main`。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Tie-breaking and AND semantics">
    - 如果同一層級有多個繫結符合，設定順序中的第一個會勝出。
    - 如果繫結設定了多個比對欄位（例如 `peer` + `guildId`），所有指定欄位都是必需的（`AND` 語意）。

  </Accordion>
  <Accordion title="Account-scope detail">
    - 省略 `accountId` 的繫結只會符合預設帳號。它不會符合所有帳號。
    - 使用 `accountId: "*"` 作為跨所有帳號的通道範圍後援。
    - 使用 `accountId: "<name>"` 來符合一個帳號。
    - 如果你稍後為同一個代理新增相同繫結但帶有明確帳號 ID，OpenClaw 會將既有的僅通道繫結升級為帳號範圍，而不是複製它。

  </Accordion>
</AccordionGroup>

## 多個帳號 / 電話號碼

支援**多個帳號**的通道（例如 WhatsApp）使用 `accountId` 識別每次登入。每個 `accountId` 都可以路由到不同代理，因此一台伺服器可以託管多個電話號碼，而不會混合工作階段。

如果你希望在省略 `accountId` 時使用通道範圍的預設帳號，請設定 `channels.<channel>.defaultAccount`（選用）。未設定時，OpenClaw 會在存在 `default` 時後援至 `default`，否則使用第一個已設定的帳號 ID（排序後）。

支援此模式的常見通道包括：

- `whatsapp`、`telegram`、`discord`、`slack`、`signal`、`imessage`
- `irc`、`line`、`googlechat`、`mattermost`、`matrix`、`nextcloud-talk`
- `zalo`、`zalouser`、`nostr`、`feishu`

## 概念

- `agentId`：一個「腦」（工作區、每代理驗證、每代理工作階段儲存區）。
- `accountId`：一個通道帳號執行個體（例如 WhatsApp 帳號 `"personal"` 與 `"biz"`）。
- `binding`：透過 `(channel, accountId, peer)` 以及選用的公會/團隊 ID，將傳入訊息路由到 `agentId`。
- 直接聊天會收斂到 `agent:<agentId>:<mainKey>`（每代理「main」；`session.mainKey`）。

## 平台範例

<AccordionGroup>
  <Accordion title="Discord bots per agent">
    每個 Discord Bot 帳號會對應到唯一的 `accountId`。將每個帳號繫結到一個代理，並為每個 Bot 保留允許清單。

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

    - 邀請每個機器人加入 guild，並啟用 Message Content Intent。
    - 權杖位於 `channels.discord.accounts.<id>.token`（預設帳號可使用 `DISCORD_BOT_TOKEN`）。

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

    - 使用 BotFather 為每個代理程式建立一個機器人，並複製每個權杖。
    - 權杖位於 `channels.telegram.accounts.<id>.botToken`（預設帳號可使用 `TELEGRAM_BOT_TOKEN`）。
    - 若同一個 Telegram 群組中有多個機器人，請邀請每個機器人，並提及應該回應的機器人。
    - 為每個群組機器人停用 BotFather Privacy Mode，然後重新加入該機器人，讓 Telegram 套用設定。
    - 使用 `channels.telegram.groups` 允許群組，或僅在受信任的群組部署中使用 `groupPolicy: "open"`。
    - 將寄件者使用者 ID 放在 `groupAllowFrom`。群組與超級群組 ID 應放在 `channels.telegram.groups`，而不是 `groupAllowFrom`。
    - 依 `accountId` 綁定，讓每個機器人路由到自己的代理程式。

  </Accordion>
  <Accordion title="WhatsApp numbers per agent">
    啟動閘道前先連結每個帳號：

    ```bash
    openclaw channels login --channel whatsapp --account personal
    openclaw channels login --channel whatsapp --account biz
    ```

    `~/.openclaw/openclaw.json`（JSON5）：

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
    依頻道路由：將 WhatsApp 路由到快速的日常代理程式，並將 Telegram 路由到 Opus 代理程式。

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

    備註：

    - 這些範例使用 `accountId: "*"`，因此日後新增帳號時，綁定仍會繼續運作。
    - 若要將單一 DM/群組路由到 Opus，同時讓其餘維持在聊天代理程式上，請為該 peer 新增 `match.peer` 綁定；peer 比對一律優先於全頻道規則。

  </Tab>
  <Tab title="Same channel, one peer to Opus">
    讓 WhatsApp 維持在快速代理程式上，但將一個 DM 路由到 Opus：

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

    Peer 綁定一律優先，因此請將它們放在全頻道規則上方。

  </Tab>
  <Tab title="Family agent bound to a WhatsApp group">
    將專用的家庭代理程式綁定到單一 WhatsApp 群組，並搭配提及閘控與更嚴格的工具政策：

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

    備註：

    - 工具允許/拒絕清單是**工具**，不是 Skills。如果某個 skill 需要執行二進位檔，請確認允許 `exec`，且該二進位檔存在於沙箱中。
    - 若要更嚴格的閘控，請設定 `agents.list[].groupChat.mentionPatterns`，並讓該頻道保持啟用群組允許清單。

  </Tab>
</Tabs>

## 每個代理程式的沙箱與工具設定

每個代理程式都可以有自己的沙箱與工具限制：

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
`setupCommand` 位於 `sandbox.docker` 底下，並在容器建立時執行一次。當解析後的 scope 為 `"shared"` 時，會忽略每個代理程式的 `sandbox.docker.*` 覆寫。
</Note>

**優點：**

- **安全隔離**：限制不受信任代理程式的工具。
- **資源控制**：將特定代理程式放入沙箱，同時讓其他代理程式留在主機上。
- **彈性政策**：每個代理程式使用不同權限。

<Note>
`tools.elevated` 是**全域**且以寄件者為基準；它無法針對每個代理程式設定。如果需要每個代理程式的邊界，請使用 `agents.list[].tools` 拒絕 `exec`。針對群組目標，請使用 `agents.list[].groupChat.mentionPatterns`，讓 @mentions 能乾淨地對應到預期的代理程式。
</Note>

詳細範例請參閱[多代理程式沙箱與工具](/zh-TW/tools/multi-agent-sandbox-tools)。

## 相關

- [ACP 代理程式](/zh-TW/tools/acp-agents) — 執行外部編碼 harness
- [頻道路由](/zh-TW/channels/channel-routing) — 訊息如何路由到代理程式
- [狀態顯示](/zh-TW/concepts/presence) — 代理程式狀態顯示與可用性
- [工作階段](/zh-TW/concepts/session) — 工作階段隔離與路由
- [子代理程式](/zh-TW/tools/subagents) — 產生背景代理程式執行
