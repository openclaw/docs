---
read_when:
    - 將 OpenClaw 連接到 ClickClack 工作區
    - 測試 ClickClack 機器人身分
summary: ClickClack bot-token 頻道設定與目標語法
title: ClickClack
x-i18n:
    generated_at: "2026-07-05T17:39:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 164f6ee2e41092adf26d753c835ca82b2eb730e1fa93e987f07b7346441dff09
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack 會透過第一級 ClickClack bot token，將 OpenClaw 連接到自託管的 ClickClack 工作區。

當你希望 OpenClaw 代理顯示為 ClickClack bot 使用者時，請使用此功能。ClickClack 支援獨立服務 bot 和使用者擁有的 bot；使用者擁有的 bot 會保留 `owner_user_id`，且只會取得你授予的 token 範圍。

## 快速設定

在 ClickClack 伺服器上建立 bot token：

```bash
clickclack admin bot create \
  --workspace <workspace_id> \
  --name "OpenClaw" \
  --handle openclaw \
  --scopes bot:write \
  --plain
```

若是使用者擁有的 bot，請加入 `--owner <user_id>`。

設定 OpenClaw：

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      defaultTo: "channel:general",
    },
  },
}
```

然後執行：

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw gateway
```

只有在 `baseUrl`、`token` 和 `workspace` 都已設定時，帳戶才會視為已設定。`workspace` 接受工作區 id（`wsp_...`）、slug 或名稱；閘道會在啟動時將其解析為 id。

### 帳戶設定鍵

| 鍵                     | 預設值             | 備註                                                                                   |
| ----------------------- | ------------------- | --------------------------------------------------------------------------------------- |
| `baseUrl`               | 無（必要）     | ClickClack 伺服器 URL。                                                                  |
| `token`                 | 無（必要）     | 純字串或祕密參照（`source: "env" \| "file" \| "exec"`）。                       |
| `workspace`             | 無（必要）     | 工作區 id、slug 或名稱。                                                            |
| `replyMode`             | `"agent"`           | `"agent"` 會執行完整代理管線；`"model"` 會傳送簡短的直接模型補全。 |
| `defaultTo`             | `"channel:general"` | 當外送路徑未提供目標時使用的目標。                                      |
| `allowFrom`             | `["*"]`             | 傳入 DM 和頻道訊息的使用者 id 允許清單。                                 |
| `botUserId`             | 自動偵測       | 啟動時從 bot token 身分解析。                                        |
| `agentId`               | 路由預設值       | 將此帳戶的傳入訊息固定到一個代理。                                       |
| `toolsAllow`            | 無                | 此帳戶代理回覆的工具允許清單。                                     |
| `model`, `systemPrompt` | 無                | 由 `replyMode: "model"` 補全使用。                                               |
| `reconnectMs`           | `1500`              | 即時重新連線延遲（100 到 60000）。                                                |

如果 `plugins.allow` 是非空的限制性清單，在頻道設定中明確選取
ClickClack，或執行 `openclaw plugins enable clickclack`，
會將 `clickclack` 附加到該清單。入門安裝會使用相同的
明確選取行為。這些路徑不會覆寫 `plugins.deny` 或
全域 `plugins.enabled: false` 設定。直接執行
`openclaw plugins install @openclaw/clickclack` 會遵循一般的
外掛安裝政策，並且也會將 ClickClack 記錄到現有的允許清單中。

## 多個 bot

每個帳戶會開啟自己的 ClickClack 即時連線，並使用自己的 bot token。

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      defaultAccount: "service",
      accounts: {
        service: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SERVICE_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "channel:general",
          agentId: "service-bot",
        },
        support: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SUPPORT_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "dm:usr_...",
          agentId: "support-bot",
        },
      },
    },
  },
}
```

## 回覆模式

- `replyMode: "agent"`（預設）會透過一般代理管線派送傳入訊息，包括工作階段記錄和工具政策。
- `replyMode: "model"` 會略過代理管線，並使用外掛 runtime 的 `llm.complete` 進行簡短的直接 bot 回覆（可選擇由 `model` 和 `systemPrompt` 調整）。

模型模式會針對已解析的 bot 代理 id 執行補全，這需要
明確的 `plugins.entries.clickclack.llm.allowAgentIdOverride: true` 信任
位元：

```json5
{
  plugins: {
    entries: {
      clickclack: {
        llm: {
          allowAgentIdOverride: true,
        },
      },
    },
  },
}
```

如果你只使用預設的 `agent` 回覆模式，請保持信任位元關閉；那裡
不需要它。

## 代理活動列

預設情況下，ClickClack 頻道在代理回合執行期間不會顯示任何內容；只會送出最終回覆。在帳戶上設定 `agentActivity: true`，可在回合進行中發布持久的 `agent_commentary` 和 `agent_tool` 訊息列：

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      agentActivity: true,
    },
  },
}
```

需求和行為：

- **預設關閉。** 標準設定和舊版 ClickClack 伺服器不受影響。
- **需要 `agent_activity:write` token 範圍。** 此範圍與 `bot:write` 分開，且不會由它繼承；啟用此選項前，請用 `--scopes bot:write,agent_activity:write` 建立 bot token（或將該範圍授予現有 token）。
- **盡力降級。** 如果 token 缺少 `agent_activity:write`，或伺服器拒絕活動寫入，失敗會被記錄，且最終回覆仍會正常傳送；不會顯示活動列。
- 列會依回合分組（`turn_id`）、合併為一個邏輯步驟一列，且工具列使用與 Discord/Slack/Telegram 相同的進度格式（工具名稱加上命令詳細資料）。
- **歸屬中繼資料。** 代理撰寫的貼文（活動列和最終回覆）會帶有 `author_model` 和 `author_thinking` 欄位，這些欄位會從該回合實際使用的模型解析（包括 fallback 之後）。未定義這些欄位的伺服器會忽略未知的 JSON 欄位；持久化它們的伺服器可以針對每則訊息回答「這一行是哪個模型在什麼思考層級說的」。

## 目標

- `channel:<name-or-id>` 會傳送到工作區頻道。裸目標預設為 `channel:`。
- `dm:<user_id>` 會建立或重用與該使用者的直接對話。
- `thread:<message_id>` 會在以該訊息為根的討論串中回覆。

明確的外送目標也可以帶有 `clickclack:` 或 `cc:` provider 前綴。

範例：

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## 權限

ClickClack token 範圍由 ClickClack API 強制執行。

- `bot:read`：讀取工作區/頻道/訊息/討論串/DM/即時/profile 資料。
- `bot:write`：`bot:read` 加上頻道訊息、討論串回覆、DM 和上傳。
- `bot:admin`：`bot:write` 加上頻道建立。
- `agent_activity:write`：持久代理活動列（`agent_commentary` / `agent_tool`）。不會由 `bot:write` 或 `bot:admin` 繼承；只有在設定 `agentActivity: true` 時才需要。

OpenClaw 一般代理聊天只需要 `bot:write`。啟用[代理活動列](#agent-activity-rows)時，請加入 `agent_activity:write`。

## 疑難排解

- `ClickClack is not configured for account "<id>"`：為該帳戶設定 `baseUrl`、`token`（例如透過 `CLICKCLACK_BOT_TOKEN`）和 `workspace`。
- `ClickClack workspace not found: <value>`：將 `workspace` 設為 ClickClack 傳回的工作區 id、slug 或名稱。
- 沒有傳入回覆：確認 token 具有即時讀取存取權，並注意 bot 會忽略自己的訊息和其他 bot 的訊息。
- 頻道傳送失敗：確認 bot 是工作區成員，且具有 `bot:write`。
