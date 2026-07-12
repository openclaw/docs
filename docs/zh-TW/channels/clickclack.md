---
read_when:
    - 將 OpenClaw 連線至 ClickClack 工作區
    - 測試 ClickClack 機器人身分識別
summary: ClickClack 機器人權杖頻道設定與目標語法
title: ClickClack
x-i18n:
    generated_at: "2026-07-12T14:17:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a1fee023fd87a7b00333c18a24edfb028b231540724ba6092cf7d2b663643641
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack 透過一級支援的 ClickClack Bot 權杖，將 OpenClaw 連接至自行託管的 ClickClack 工作區。

若你希望 OpenClaw 代理程式以 ClickClack Bot 使用者身分出現，請使用此功能。ClickClack 支援獨立服務 Bot 與使用者擁有的 Bot；使用者擁有的 Bot 會保留 `owner_user_id`，且只會取得你授予的權杖範圍。

## 快速設定

在 ClickClack 伺服器上建立 Bot 權杖：

```bash
clickclack admin bot create \
  --workspace <workspace_id> \
  --name "OpenClaw" \
  --handle openclaw \
  --scopes bot:write \
  --plain
```

若為使用者擁有的 Bot，請加上 `--owner <user_id>`。

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

接著執行：

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw gateway
```

只有在 `baseUrl`、`token` 和 `workspace` 全部設定後，帳號才會視為已設定。`workspace` 接受工作區 ID（`wsp_...`）、代稱或名稱；閘道會在啟動時將其解析為 ID。

### 帳號設定鍵

| 鍵                      | 預設值              | 說明                                                                                    |
| ----------------------- | ------------------- | --------------------------------------------------------------------------------------- |
| `baseUrl`               | 無（必填）          | ClickClack 伺服器 URL。                                                                 |
| `token`                 | 無（必填）          | 純文字字串或祕密參照（`source: "env" \| "file" \| "exec"`）。                           |
| `workspace`             | 無（必填）          | 工作區 ID、代稱或名稱。                                                                 |
| `replyMode`             | `"agent"`           | `"agent"` 執行完整的代理程式管線；`"model"` 傳送簡短的直接模型完成結果。                |
| `defaultTo`             | `"channel:general"` | 當輸出路徑未提供目標時使用的目標。                                                      |
| `allowFrom`             | `["*"]`             | 傳入私訊與頻道訊息的使用者 ID 允許清單。                                                |
| `botUserId`             | 自動偵測            | 啟動時從 Bot 權杖身分解析。                                                              |
| `agentId`               | 路由預設值          | 將此帳號的傳入訊息固定傳送至一個代理程式。                                              |
| `toolsAllow`            | 無                  | 此帳號代理程式回覆的工具允許清單。                                                      |
| `model`, `systemPrompt` | 無                  | 供 `replyMode: "model"` 完成結果使用。                                                  |
| `reconnectMs`           | `1500`              | 即時連線重新連線延遲（100 至 60000）。                                                  |

若 `plugins.allow` 是非空的限制性清單，在頻道設定中明確選取
ClickClack，或執行 `openclaw plugins enable clickclack`，都會將
`clickclack` 附加至該清單。新手設定安裝採用相同的明確選取行為。
這些路徑不會覆寫 `plugins.deny` 或全域 `plugins.enabled: false`
設定。直接執行 `openclaw plugins install @openclaw/clickclack`
會遵循一般的外掛安裝政策，並且也會在現有允許清單中記錄 ClickClack。

## 多個 Bot

每個帳號都會開啟自己的 ClickClack 即時連線，並使用自己的 Bot 權杖。

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

- `replyMode: "agent"`（預設）會透過一般代理程式管線分派傳入訊息，包括工作階段記錄和工具政策。
- `replyMode: "model"` 會略過代理程式管線，並使用外掛執行階段的 `llm.complete` 產生簡短的直接 Bot 回覆（可選擇透過 `model` 和 `systemPrompt` 調整）。

模型模式會針對解析後的 Bot 代理程式 ID 執行完成作業，因此必須明確設定
`plugins.entries.clickclack.llm.allowAgentIdOverride: true` 信任
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

若你只使用預設的 `agent` 回覆模式，請保持關閉此信任位元；該模式
不需要此設定。

跨服務關聯證據請使用 `agent` 模式。對於符合標準 `msg_<ulid>`
格式的權威 ClickClack 訊息 ID，頻道會衍生出確定性的 OpenClaw
執行 ID `clickclack:<message-id>`。每次模型呼叫隨後都會在診斷中顯示為
`clickclack:<message-id>:model:<n>`；當該輪使用 ClawRouter 時，
相同的模型呼叫 ID 會以 `X-Request-ID` 傳送。`model` 模式會略過
一般代理程式執行／工作階段診斷，因此不適用於此證據路徑。

當即時事件包含經驗證的 `payload.correlation_id` 時，頻道會在
權威訊息擷取及產生的 ClickClack 回覆請求中，將其作為
`X-Correlation-ID` 傳遞。值使用 ClickClack 的安全
128 字元集合（`A-Z`、`a-z`、`0-9`、`.`、`_`、`:` 和 `-`）；
無效值會被省略。這些關聯僅包含識別碼，絕不包含訊息本文、
提示、完成結果、認證資訊或工具輸出。

## 代理程式活動列

預設情況下，代理程式回合執行期間，ClickClack 頻道不會顯示任何內容；只會顯示最終回覆。在帳號上設定 `agentActivity: true`，即可在回合進行期間發布持久的 `agent_commentary` 和 `agent_tool` 訊息列：

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

需求與行為：

- **預設關閉。**標準設定與舊版 ClickClack 伺服器不受影響。
- **需要 `agent_activity:write` 權杖範圍。**此範圍與 `bot:write` 分開，且不會繼承自該範圍；啟用此選項前，請使用 `--scopes bot:write,agent_activity:write` 建立 Bot 權杖（或將該範圍授予現有權杖）。
- **盡力降級。**若權杖缺少 `agent_activity:write`，或伺服器拒絕活動寫入，系統會記錄失敗，而最終回覆仍會正常傳送；不會出現活動列。
- 每個回合（`turn_id`）的列會分組，並進行合併，使一個邏輯步驟對應一列；工具列使用與 Discord／Slack／Telegram 相同的進度格式（工具名稱加上命令詳細資訊）。
- **歸屬中繼資料。**代理程式撰寫的貼文（活動列和最終回覆）會帶有根據該回合實際使用的模型解析出的 `author_model` 和 `author_thinking` 欄位（包括後援切換後）。未定義這些欄位的伺服器會忽略未知的 JSON 欄位；保留這些欄位的伺服器則可針對每則訊息回答“哪個模型以哪個思考層級說了這一行”。

## 目標

- `channel:<name-or-id>` 傳送至工作區頻道。未加前綴的目標預設為 `channel:`。
- `dm:<user_id>` 建立或重複使用與該使用者的直接對話。
- `thread:<message_id>` 在以該訊息為根的討論串中回覆。

明確的輸出目標也可包含 `clickclack:` 或 `cc:` 提供者前綴。

範例：

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## 權限

ClickClack 權杖範圍由 ClickClack API 強制執行。

- `bot:read`：讀取工作區／頻道／訊息／討論串／私訊／即時／個人資料資料。
- `bot:write`：`bot:read`，加上頻道訊息、討論串回覆、私訊和上傳。
- `bot:admin`：`bot:write`，加上建立頻道。
- `agent_activity:write`：持久的代理程式活動列（`agent_commentary`／`agent_tool`）。不會繼承自 `bot:write` 或 `bot:admin`；只有設定 `agentActivity: true` 時才需要。

OpenClaw 的一般代理程式聊天只需要 `bot:write`。啟用[代理程式活動列](#agent-activity-rows)時，請加上 `agent_activity:write`。

## 疑難排解

- `ClickClack is not configured for account "<id>"`：請為該帳號設定 `baseUrl`、`token`（例如透過 `CLICKCLACK_BOT_TOKEN`）和 `workspace`。
- `ClickClack workspace not found: <value>`：請將 `workspace` 設為 ClickClack 傳回的工作區 ID、代稱或名稱。
- 沒有傳入回覆：確認權杖具有即時讀取存取權，並注意 Bot 會忽略自己的訊息和其他 Bot 的訊息。
- 頻道傳送失敗：確認 Bot 是工作區成員，且具有 `bot:write`。
