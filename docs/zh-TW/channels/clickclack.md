---
read_when:
    - 將 OpenClaw 連接至 ClickClack 工作區
    - 測試 ClickClack 機器人身分識別
summary: ClickClack 機器人權杖頻道設定與目標語法
title: ClickClack
x-i18n:
    generated_at: "2026-07-14T13:27:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 76068c71c0d6cdb5153e74d69ec1a01a75f1bc6a5bcba636f5e41a1293c20139
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack 透過第一級支援的 ClickClack Bot 權杖，將 OpenClaw 連接至自架的 ClickClack 工作區。

當你希望 OpenClaw 代理程式以 ClickClack Bot 使用者身分出現時，請使用此功能。ClickClack 支援獨立服務 Bot 與使用者擁有的 Bot；使用者擁有的 Bot 會保留 `owner_user_id`，且只會取得你授予的權杖範圍。

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

若為使用者擁有的 Bot，請加入 `--owner <user_id>`。

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

只有在 `baseUrl`、`token` 與 `workspace` 全部設定後，帳號才算已完成設定。`workspace` 可接受工作區 ID（`wsp_...`）、代稱或名稱；閘道會在啟動時將其解析為 ID。

### 帳號設定鍵

| 鍵                      | 預設值              | 備註                                                                                    |
| ----------------------- | ------------------- | --------------------------------------------------------------------------------------- |
| `baseUrl`               | 無（必填）          | ClickClack 伺服器 URL。                                                                 |
| `token`                 | 無（必填）          | 純文字字串或祕密參照（`source: "env" \| "file" \| "exec"`）。                            |
| `workspace`             | 無（必填）          | 工作區 ID、代稱或名稱。                                                                 |
| `replyMode`             | `"agent"`           | `"agent"` 會執行完整的代理程式管線；`"model"` 會傳送簡短的直接模型補全。 |
| `defaultTo`             | `"channel:general"` | 當傳出路徑未提供目標時使用的目標。                                                       |
| `allowFrom`             | `["*"]`             | 傳入私訊與頻道訊息的使用者 ID 允許清單。                                                |
| `botUserId`             | 自動偵測            | 啟動時從 Bot 權杖身分解析。                                                              |
| `agentId`               | 路由預設值          | 將此帳號的傳入訊息固定交由單一代理程式處理。                                             |
| `toolsAllow`            | 無                  | 此帳號的代理程式回覆可使用的工具允許清單。                                               |
| `model`、`systemPrompt` | 無                  | 供 `replyMode: "model"` 補全使用。                                                      |
| `reconnectMs`           | `1500`              | 即時連線的重新連線延遲（100 至 60000）。                                                 |

如果 `plugins.allow` 是非空的限制性清單，在頻道設定中明確選取 ClickClack 或執行 `openclaw plugins enable clickclack`，都會將 `clickclack` 附加至該清單。導入安裝採用相同的明確選取行為。這些路徑不會覆寫 `plugins.deny` 或全域 `plugins.enabled: false` 設定。直接執行 `openclaw plugins install @openclaw/clickclack` 會遵循一般的外掛安裝政策，並且也會將 ClickClack 記錄至現有的允許清單中。

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

- `replyMode: "agent"`（預設）會透過一般代理程式管線分派傳入訊息，包括工作階段記錄與工具政策。
- `replyMode: "model"` 會略過代理程式管線，並使用外掛執行階段的 `llm.complete` 直接產生 Bot 回覆，可選擇透過 `model` 與 `systemPrompt` 調整其形式。所選的供應商與模型負責補全預算。

模型模式會使用解析後的 Bot 代理程式 ID 執行補全，因此必須明確啟用 `plugins.entries.clickclack.llm.allowAgentIdOverride: true` 信任位元：

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

如果你只使用預設的 `agent` 回覆模式，請保持關閉此信任位元；該模式不需要此設定。

若需要跨服務關聯證據，請使用 `agent` 模式。對於採用標準 `msg_<ulid>` 形式的權威 ClickClack 訊息 ID，頻道會衍生出具確定性的 OpenClaw 執行 ID `clickclack:<message-id>`。之後每次模型呼叫都會在診斷資訊中顯示為 `clickclack:<message-id>:model:<n>`；當該輪次使用 ClawRouter 時，系統也會將相同的模型呼叫 ID 當作 `X-Request-ID` 傳送。`model` 模式會略過一般的代理程式執行／工作階段診斷，因此不適合此證據路徑。

當即時事件包含經驗證的 `payload.correlation_id` 時，頻道會在權威訊息擷取及產生的 ClickClack 回覆要求中，將其作為 `X-Correlation-ID` 傳遞。值使用 ClickClack 的安全 128 字元集合（`A-Z`、`a-z`、`0-9`、`.`、`_`、`:` 與 `-`）；無效值會被省略。這些關聯僅包含識別碼，絕不包含訊息本文、提示、補全、認證資訊或工具輸出。

## 持久媒體傳遞

包含媒體的代理程式回覆會使用必要的持久傳遞。OpenClaw 會在第一次寫入 ClickClack 前，為每個部分的訊息與上傳項目指派穩定的 nonce，因此重試時會重複使用相同的上傳項目與訊息，而不會消耗儲存空間配額或發布重複內容。如果重新啟動後上傳項目已存在，OpenClaw 不會重新讀取原始本機路徑或遠端媒體 URL。

此復原合約需要 ClickClack 伺服器支援：

- `GET /api/uploads/by-nonce`，並在找到及未找到結果時提供 `X-ClickClack-Upload-Nonce: supported`。
- `GET /api/messages/by-nonce`，並在找到及未找到結果時提供 `X-ClickClack-Message-Nonce: supported`。
- 針對相同擁有者範圍 nonce 與上傳項目，提供冪等的訊息建立與附件關聯。

舊版伺服器的一般 404 不會被視為傳送不存在的證明。OpenClaw 會讓傳遞保持未解決，而不冒產生重複內容的風險；請先更新 ClickClack，再啟用會產生媒體的代理程式回覆。

## 代理程式活動列

預設情況下，代理程式輪次執行期間，ClickClack 頻道不會顯示任何內容；只會送達最終回覆。在帳號上設定 `agentActivity: true`，即可在輪次進行期間發布持久的 `agent_commentary` 與 `agent_tool` 訊息列：

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

- **預設關閉。** 標準設定與舊版 ClickClack 伺服器不受影響。
- **需要 `agent_activity:write` 權杖範圍。** 此範圍與 `bot:write` 分開，且不會由後者繼承；啟用此選項前，請使用 `--scopes bot:write,agent_activity:write` 建立 Bot 權杖（或將此範圍授予現有權杖）。
- **盡力降級。** 如果權杖缺少 `agent_activity:write`，或伺服器拒絕活動寫入，系統會記錄失敗，而最終回覆仍會正常傳遞；不會顯示活動列。
- 各列會依輪次（`turn_id`）分組並合併，使一個邏輯步驟對應一列；工具列採用與 Discord／Slack／Telegram 相同的進度格式（工具名稱加上命令詳細資料）。
- **歸屬中繼資料。** 代理程式撰寫的貼文（活動列與最終回覆）會包含根據該輪次實際使用模型（包括發生備援後）解析出的 `author_model` 與 `author_thinking` 欄位。未定義這些欄位的伺服器會忽略未知的 JSON 欄位；保存這些欄位的伺服器則可逐則訊息回答「哪個模型以何種思考層級說出這一行」。

## 目標

- `channel:<name-or-id>` 會傳送至工作區頻道。未加前綴的目標預設為 `channel:`。
- `dm:<user_id>` 會建立或重複使用與該使用者的直接對話。
- `thread:<message_id>` 會在以該訊息為根的討論串中回覆。

明確的傳出目標也可包含 `clickclack:` 或 `cc:` 供應商前綴。

傳出媒體會使用 ClickClack 的上傳 API，接著將持久上傳項目附加至建立的頻道訊息、討論串回覆或私訊。本機檔案與支援的遠端媒體 URL 會遵循 OpenClaw 的一般媒體存取政策，每個檔案的限制為 64 MiB。持久佇列傳送會為每個上傳項目及訊息部分使用不同的擁有者範圍 nonce，接著以相同物件重試附件關聯。如需伺服器合約與復原行為的詳細資訊，請參閱[持久媒體傳遞](#durable-media-delivery)。

範例：

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## 權限

ClickClack 權杖範圍由 ClickClack API 強制執行。

- `bot:read`：讀取工作區／頻道／訊息／討論串／私訊／即時連線／個人資料。
- `bot:write`：`bot:read`，以及頻道訊息、討論串回覆、私訊與上傳。
- `bot:admin`：`bot:write`，以及建立頻道。
- `agent_activity:write`：持久代理程式活動列（`agent_commentary`／`agent_tool`）。不會由 `bot:write` 或 `bot:admin` 繼承；僅在設定 `agentActivity: true` 時需要。

一般代理程式聊天只需要 `bot:write`。啟用[代理程式活動列](#agent-activity-rows)時，請加入 `agent_activity:write`。

## 疑難排解

- `ClickClack is not configured for account "<id>"`：請為該帳號設定 `baseUrl`、`token`（例如透過 `CLICKCLACK_BOT_TOKEN`）與 `workspace`。
- `ClickClack workspace not found: <value>`：將 `workspace` 設為 ClickClack 傳回的工作區 ID、代稱或名稱。
- 沒有傳入回覆：確認權杖具有即時讀取存取權，並注意 Bot 會忽略自己的訊息及其他 Bot 的訊息。
- 頻道傳送失敗：確認 Bot 是工作區成員，且具有 `bot:write`。
