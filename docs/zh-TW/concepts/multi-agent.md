---
read_when: You want multiple agents with separate workspaces, auth, and sessions in one Gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 多代理程式路由：代理程式邊界、頻道帳號與繫結
title: 多代理路由
x-i18n:
    generated_at: "2026-07-12T14:28:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 265a1f3d9d9b4957c99c71f391ce4f5abba6b70561570f8bbe8cb9964ece1cfc
    source_path: concepts/multi-agent.md
    workflow: 16
---

在單一閘道程序中執行多個彼此_隔離_的代理，每個代理都有自己的工作區、狀態目錄（`agentDir`）及以 SQLite 為後端的工作階段歷程，並可搭配多個頻道帳號（例如兩個 WhatsApp 號碼）。傳入訊息會透過**繫結**路由至正確的代理。

**代理**是每個角色的完整範圍：工作區檔案、驗證設定檔、模型登錄檔及工作階段儲存區。**繫結**會將頻道帳號（Slack 工作區、WhatsApp 號碼等）對應至其中一個代理。

## 什麼是一個代理

每個代理都有自己的：

- **工作區**：檔案、`AGENTS.md`/`SOUL.md`/`USER.md`、本機筆記、角色規則。
- **狀態目錄**（`agentDir`）：驗證設定檔、模型登錄檔、每個代理的設定。
- **工作階段儲存區**：位於 `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite` 的聊天歷程與路由狀態。

驗證設定檔各代理獨立，讀取自：

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` 是較安全的跨工作階段回想途徑：它傳回的是有界且經過遮蔽的檢視，而非原始逐字記錄傾印。它會移除思考區塊簽章、工具結果承載內容的詳細資料、`<relevant-memories>` 輔助結構、工具呼叫 XML 標籤（`<tool_call>`、`<function_call>` 及其複數／降級形式）與 MiniMax 工具呼叫 XML，接著截斷輸出並依位元組大小限制上限。
</Note>

<Warning>
切勿讓多個代理重複使用 `agentDir`，否則會造成驗證／工作階段狀態衝突。當次要代理的本機 OAuth 認證資訊過期或重新整理失敗時，OpenClaw 會改讀取預設／主要代理中具有相同設定檔 ID 的認證資訊，並採用最新的權杖，但不會將重新整理權杖複製到次要代理的儲存區。如果你需要完全獨立的 OAuth 帳號，請從該代理登入。如果要手動複製認證資訊，請僅複製可攜式的靜態 `api_key` 或 `token` 設定檔；OAuth 重新整理資料預設不可攜（可使用 `copyToAgents` 明確選擇加入某個設定檔）。
</Warning>

Skills 會從各代理的工作區及 `~/.openclaw/skills` 等共用根目錄載入，接著依代理實際生效的 Skills 允許清單進行篩選。使用 `agents.defaults.skills` 設定共用基準，並使用 `agents.list[].skills` 設定每個代理的替代項目（明確設定的項目會取代預設值，而不會合併）。請參閱 [Skills：各代理與共用 Skills](/zh-TW/tools/skills#per-agent-vs-shared-skills)及 [Skills：代理允許清單](/zh-TW/tools/skills#agent-allowlists)。

由外掛擁有的儲存空間會遵循該外掛的設定；新增第二個代理
不會自動分割所有全域外掛儲存區。例如，當不同角色不得共用已編譯的 Wiki 知識時，請設定
[Memory Wiki 各代理資料保險箱](/zh-TW/concepts/multi-agent#per-agent-memory-wiki-vaults)。

<Note>
**工作區注意事項：**每個代理的工作區是**預設 cwd**，而非強制沙箱。相對路徑會在工作區內解析，但除非啟用沙箱，否則絕對路徑仍可存取主機上的其他位置。請參閱[沙箱](/zh-TW/gateway/sandboxing)。
</Note>

## 路徑

| 項目                             | 預設值                                                                                | 覆寫方式                                                                                 |
| -------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 設定                             | `~/.openclaw/openclaw.json`                                                            | `OPENCLAW_CONFIG_PATH`                                                                   |
| 狀態目錄                         | `~/.openclaw`                                                                          | `OPENCLAW_STATE_DIR`                                                                     |
| 預設代理的工作區                 | `~/.openclaw/workspace`（設定 `OPENCLAW_PROFILE` 時則為 `workspace-<profile>`）      | `agents.list[].workspace`，接著是 `agents.defaults.workspace`，或 `OPENCLAW_WORKSPACE_DIR` |
| 其他代理的工作區                 | `<stateDir>/workspace-<agentId>`（設定時則為 `<agents.defaults.workspace>/<agentId>`） | `agents.list[].workspace`                                                                |
| 代理目錄                         | `~/.openclaw/agents/<agentId>/agent`                                                   | `agents.list[].agentDir`                                                                 |
| 工作階段與逐字記錄               | `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`                             | —                                                                                        |
| 舊版／封存的工作階段成品         | `~/.openclaw/agents/<agentId>/sessions`                                                | —                                                                                        |

### 單一代理模式（預設）

若你未進行任何設定，OpenClaw 會執行一個代理：

- `agentId` 預設為 `main`。
- 工作階段鍵為 `agent:main:<mainKey>`（`mainKey` 預設為 `main`）。
- 工作區預設為 `~/.openclaw/workspace`（當 `OPENCLAW_PROFILE` 設為 `default` 以外的值時，則為 `workspace-<profile>`）。
- 狀態預設位於 `~/.openclaw/agents/main/agent`。

## 代理輔助工具

新增一個隔離的代理：

```bash
openclaw agents add work
```

旗標：`--workspace <dir>`、`--model <id>`、`--agent-dir <dir>`、`--bind <channel[:accountId]>`（可重複使用）、`--non-interactive`（需要 `--workspace`）。

新增 `bindings` 以路由傳入訊息（精靈會詢問是否要代你執行），接著驗證：

```bash
openclaw agents list --bindings
```

## 快速開始

<Steps>
  <Step title="建立各代理的工作區">
    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    每個代理都會取得自己的工作區，其中包含 `SOUL.md`、`AGENTS.md` 及選用的 `USER.md`，並在 `~/.openclaw/agents/<agentId>` 下擁有專屬的 `agentDir` 和工作階段儲存區。

  </Step>
  <Step title="建立頻道帳號">
    在你偏好的頻道上為每個代理建立一個帳號：

    - Discord：每個代理使用一個機器人，啟用 Message Content Intent，並複製各個權杖。
    - Telegram：每個代理透過 BotFather 建立一個機器人，並複製各個權杖。
    - WhatsApp：為每個帳號連結各自的電話號碼。

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    請參閱頻道指南：[Discord](/zh-TW/channels/discord)、[Telegram](/zh-TW/channels/telegram)、[WhatsApp](/zh-TW/channels/whatsapp)。

  </Step>
  <Step title="新增代理、帳號與繫結">
    在 `agents.list` 下新增代理、在 `channels.<channel>.accounts` 下新增頻道帳號，並使用 `bindings` 將兩者連接（範例如下）。
  </Step>
  <Step title="重新啟動並驗證">
    ```bash
    openclaw gateway restart
    openclaw agents list --bindings
    openclaw channels status --probe
    ```
  </Step>
</Steps>

## 多個代理、多種角色

每個已設定的 `agentId` 都是核心代理狀態中彼此獨立的角色邊界：

- 各頻道使用不同帳號（依 `accountId` 區分）。
- 不同的個性（每個代理各自擁有 `AGENTS.md`/`SOUL.md`）。
- 驗證與工作階段彼此分離；只有透過明確功能或外掛設定，才會啟用跨代理存取。

如此一來，多人便可共用一個閘道，同時將核心代理狀態彼此分離。

## 各代理的 Memory Wiki 資料保險箱

Memory Wiki 預設使用一個全域資料保險箱。若要讓支援代理的
已編譯知識與行銷代理分開，請將
`plugins.entries.memory-wiki.config.vault.scope` 設為 `agent`：

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

設定的路徑是父目錄。OpenClaw 會附加正規化後的
代理 ID，產生如 `~/.openclaw/wiki/support` 和
`~/.openclaw/wiki/marketing` 的路徑。設定多個代理時，代理範圍的命令列介面與閘道操作需要
明確指定代理。關於橋接
篩選、遷移與信任邊界的詳細資訊，請參閱
[Memory Wiki 各代理資料保險箱](/zh-TW/plugins/memory-wiki#per-agent-vaults)。

## 跨代理 QMD 記憶搜尋

若要讓一個代理搜尋另一個代理的 QMD 工作階段逐字記錄，請在 `agents.list[].memorySearch.qmd.extraCollections` 下新增額外集合。當每個代理都應共用相同集合時，請使用 `agents.defaults.memorySearch.qmd.extraCollections`。

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
            extraCollections: [{ path: "notes" }], // 在工作區內解析 -> 名為 "notes-main" 的集合
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

額外集合路徑可由多個代理共用，但當路徑位於代理工作區之外時，其 `name` 仍須明確指定。工作區內的路徑維持代理範圍，讓每個代理保有自己的逐字記錄搜尋集合。

## 一個 WhatsApp 號碼，多位使用者（私訊分流）

在**同一個** WhatsApp 帳號上，藉由比對傳送者的 E.164（`+15551234567`）與 `peer.kind: "direct"`，將不同的 WhatsApp 私訊路由至不同代理。回覆仍會從同一個 WhatsApp 號碼送出，並不存在各代理專屬的傳送者身分。

<Note>
直接聊天預設會收斂至代理的主要工作階段鍵，因此若要真正隔離，每位使用者都需要一個代理。
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

私訊存取控制（配對／允許清單）是每個 WhatsApp 帳號的全域設定，而非每個代理各自設定。對於共用群組，請將群組繫結至一個代理，或使用[廣播群組](/zh-TW/channels/broadcast-groups)。

## 路由規則

繫結是確定性的，並以最具體的比對為優先。完整的層級順序（精確對等端、父對等端、對等端萬用字元、伺服器＋角色、伺服器、團隊、帳號、頻道、預設代理）請參閱[頻道路由](/zh-TW/channels/channel-routing#routing-rules-how-an-agent-is-chosen)。以下是幾項值得特別說明的規則：

- 若同一層級內有多個繫結相符，設定順序中的第一個會勝出。
- 若一個繫結設定多個比對欄位（例如 `peer` + `guildId`），所有指定欄位都必須相符（`AND` 語意）。
- 未指定 `accountId` 的繫結只會比對預設帳號，而非所有帳號。頻道範圍的後援請使用 `accountId: "*"`，特定帳號則使用 `accountId: "<name>"`。再次新增相同繫結並明確指定帳號 ID 時，會升級現有的僅限頻道繫結，而非建立重複項目。

## 多個帳號／電話號碼

支援多帳號的頻道（例如 WhatsApp）使用 `accountId` 識別各次登入。每個 `accountId` 都會路由至自己的代理，因此單一伺服器可託管多個電話號碼，而不會混合工作階段。

設定 `channels.<channel>.defaultAccount`，以選擇省略 `accountId` 時使用的帳號。若未設定，OpenClaw 會優先使用 `default`（若存在）；否則使用排序後的第一個已設定帳號 ID。

支援多個帳號的頻道：`discord`、`feishu`、`googlechat`、`imessage`、`irc`、`line`、`mattermost`、`matrix`、`nextcloud-talk`、`nostr`、`signal`、`slack`、`telegram`、`whatsapp`、`zalo`、`zalouser`。

## 概念

- `agentId`：一個「大腦」（工作區、各代理程式的驗證、各代理程式的工作階段儲存區）。
- `accountId`：一個頻道帳號執行個體（例如 WhatsApp 帳號 `personal` 與 `biz`）。
- `binding`：依據 `(channel, accountId, peer)` 將傳入訊息路由至 `agentId`，並可選擇性納入 guild/team ID。
- 私訊會彙整至 `agent:<agentId>:<mainKey>`（各代理程式的「主要」工作階段；請參閱 `session.mainKey`）。

## 平台範例

<AccordionGroup>
  <Accordion title="每個代理程式各自使用 Discord 機器人">
    每個 Discord 機器人帳號都會對應至唯一的 `accountId`。將每個帳號繫結至一個代理程式，並為各機器人分別維護允許清單。

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
    - 權杖位於 `channels.discord.accounts.<id>.token`（預設帳號可以使用 `DISCORD_BOT_TOKEN`）。

  </Accordion>
  <Accordion title="每個代理程式各自使用 Telegram 機器人">
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

    - 使用 BotFather 為每個代理程式建立一個機器人，並複製各自的權杖。
    - 權杖位於 `channels.telegram.accounts.<id>.botToken`（預設帳號可以使用 `TELEGRAM_BOT_TOKEN`）。
    - 若同一個 Telegram 群組中有多個機器人，請邀請每個機器人，並提及應回覆的那一個。
    - 為每個群組機器人停用 BotFather Privacy Mode（`/setprivacy` -> Disable），接著移除並重新加入機器人，讓 Telegram 套用此設定。
    - 使用 `channels.telegram.groups` 允許群組，或僅在受信任的群組部署中使用 `groupPolicy: "open"`。
    - 將傳送者的使用者 ID 放入 `groupAllowFrom`。群組與超級群組 ID 應放在 `channels.telegram.groups`，而非 `groupAllowFrom`。
    - 依 `accountId` 繫結，讓每個機器人都路由至自己的代理程式。

  </Accordion>
  <Accordion title="每個代理程式各自使用 WhatsApp 號碼">
    啟動閘道前，先連結每個帳號：

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
            name: "家庭",
            workspace: "~/.openclaw/workspace-home",
            agentDir: "~/.openclaw/agents/home/agent",
          },
          {
            id: "work",
            name: "工作",
            workspace: "~/.openclaw/workspace-work",
            agentDir: "~/.openclaw/agents/work/agent",
          },
        ],
      },

      // 確定性路由：第一個相符項目優先（最具體的項目排在最前面）。
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

        // 選用的個別對話方覆寫（範例：將特定群組傳送至工作代理程式）。
        {
          agentId: "work",
          match: {
            channel: "whatsapp",
            accountId: "personal",
            peer: { kind: "group", id: "1203630...@g.us" },
          },
        },
      ],

      // 預設關閉：必須明確啟用代理程式間訊息，並將其加入允許清單。
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
              // 選用覆寫。預設值：~/.openclaw/credentials/whatsapp/personal
              // authDir: "~/.openclaw/credentials/whatsapp/personal",
            },
            biz: {
              // 選用覆寫。預設值：~/.openclaw/credentials/whatsapp/biz
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
  <Tab title="WhatsApp 日常對話 + Telegram 深度工作">
    依頻道拆分：將 WhatsApp 路由至快速的日常代理程式，並將 Telegram 路由至 Opus 代理程式。

    ```json5
    {
      agents: {
        list: [
          {
            id: "chat",
            name: "日常",
            workspace: "~/.openclaw/workspace-chat",
            model: "anthropic/claude-sonnet-4-6",
          },
          {
            id: "opus",
            name: "深度工作",
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

    這些範例使用 `accountId: "*"`，因此即使稍後新增帳號，繫結仍會繼續運作。若要將單一私訊／群組路由至 Opus，同時讓其餘對話保留在聊天代理程式，請為該對話方新增 `match.peer` 繫結——對話方比對一律優先於整個頻道的規則。

  </Tab>
  <Tab title="同一頻道，將一個對話方交給 Opus">
    讓 WhatsApp 保留在快速代理程式上，但將一個私訊路由至 Opus：

    ```json5
    {
      agents: {
        list: [
          {
            id: "chat",
            name: "日常",
            workspace: "~/.openclaw/workspace-chat",
            model: "anthropic/claude-sonnet-4-6",
          },
          {
            id: "opus",
            name: "深度工作",
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

    對話方繫結一律優先，因此請將它們放在整個頻道的規則之前。

  </Tab>
  <Tab title="繫結至 WhatsApp 群組的家庭代理程式">
    將專用的家庭代理程式繫結至單一 WhatsApp 群組，並設定提及限制及更嚴格的工具政策：

    ```json5
    {
      agents: {
        list: [
          {
            id: "family",
            name: "家庭",
            workspace: "~/.openclaw/workspace-family",
            identity: { name: "家庭機器人" },
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

    工具允許／拒絕清單所列的是**工具**，而不是 Skills。若某個 Skill 需要執行二進位檔，請確認允許 `exec`，且該二進位檔存在於沙箱中。若要採用更嚴格的限制，請設定 `agents.list[].groupChat.mentionPatterns`，並保持啟用該頻道的群組允許清單。

  </Tab>
</Tabs>

## 各代理程式的沙箱與工具設定

每個代理程式都可以有自己的沙箱與工具限制：

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // 個人代理程式不使用沙箱
        },
        // 不限制工具——所有工具皆可使用
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // 一律在沙箱中執行
          scope: "agent",  // 每個代理程式使用一個容器
          docker: {
            // 容器建立後可選擇執行一次性的設定
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // 僅允許讀取工具
          deny: ["exec", "write", "edit", "apply_patch"],    // 拒絕其他工具
        },
      },
    ],
  },
}
```

<Note>
`setupCommand` 位於 `sandbox.docker` 下，並會在建立容器時執行一次。當解析後的範圍為 `"shared"` 時，會忽略各代理程式的 `sandbox.docker.*` 覆寫。
</Note>

這會提供：

- **安全隔離**：限制不受信任代理程式可使用的工具。
- **資源控制**：讓特定代理程式在沙箱中執行，同時讓其他代理程式保留在主機上。
- **彈性政策**：為每個代理程式設定不同權限。

<Note>
`tools.elevated` 同時具有全域閘門（`tools.elevated.enabled`／`allowFrom`）與各代理程式閘門（`agents.list[].tools.elevated.enabled`／`allowFrom`）。各代理程式閘門只能進一步限制全域閘門——兩者都必須允許某位傳送者，才能執行提升權限的命令。若要指定群組目標，請使用 `agents.list[].groupChat.mentionPatterns`，讓 @提及能明確對應至預期的代理程式。
</Note>

如需詳細範例，請參閱[多代理程式沙箱與工具](/zh-TW/tools/multi-agent-sandbox-tools)。

## 相關內容

- [ACP 代理程式](/zh-TW/tools/acp-agents) — 執行外部程式設計框架
- [頻道路由](/zh-TW/channels/channel-routing) — 訊息如何路由至代理程式
- [上線狀態](/zh-TW/concepts/presence) — 代理程式的上線狀態與可用性
- [工作階段](/zh-TW/concepts/session) — 工作階段隔離與路由
- [子代理程式](/zh-TW/tools/subagents) — 產生背景代理程式執行作業
