---
read_when:
    - 將 OpenClaw 連接至 ClickClack 工作區
    - 測試 ClickClack 機器人身分識別
summary: ClickClack 機器人權杖頻道設定與目標語法
title: ClickClack
x-i18n:
    generated_at: "2026-07-11T21:05:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a1fee023fd87a7b00333c18a24edfb028b231540724ba6092cf7d2b663643641
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack 透過第一級 ClickClack 機器人權杖，將 OpenClaw 連接至自架的 ClickClack 工作區。

當您希望 OpenClaw 代理程式以 ClickClack 機器人使用者的身分出現時，請使用此功能。ClickClack 支援獨立服務機器人與使用者擁有的機器人；使用者擁有的機器人會保留 `owner_user_id`，且只會取得您授予的權杖範圍。

## 快速設定

在 ClickClack 伺服器上建立機器人權杖：

```bash
clickclack admin bot create \
  --workspace <workspace_id> \
  --name "OpenClaw" \
  --handle openclaw \
  --scopes bot:write \
  --plain
```

若是使用者擁有的機器人，請加入 `--owner <user_id>`。

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

只有在 `baseUrl`、`token` 與 `workspace` 全部設定後，帳戶才算設定完成。`workspace` 接受工作區 ID（`wsp_...`）、短代稱或名稱；閘道會在啟動時將其解析為 ID。

### 帳戶設定鍵

| 鍵                      | 預設值              | 備註                                                                                    |
| ----------------------- | ------------------- | --------------------------------------------------------------------------------------- |
| `baseUrl`               | 無（必要）          | ClickClack 伺服器 URL。                                                                 |
| `token`                 | 無（必要）          | 純文字字串或密鑰參照（`source: "env" \| "file" \| "exec"`）。                           |
| `workspace`             | 無（必要）          | 工作區 ID、短代稱或名稱。                                                               |
| `replyMode`             | `"agent"`           | `"agent"` 執行完整代理程式管線；`"model"` 傳送簡短的直接模型補全。                       |
| `defaultTo`             | `"channel:general"` | 當傳出路徑未指定目標時使用的目標。                                                      |
| `allowFrom`             | `["*"]`             | 傳入私訊與頻道訊息的使用者 ID 允許清單。                                                |
| `botUserId`             | 自動偵測            | 啟動時從機器人權杖身分解析。                                                            |
| `agentId`               | 路由預設值          | 將此帳戶的傳入訊息固定傳送至單一代理程式。                                              |
| `toolsAllow`            | 無                  | 此帳戶代理程式回覆可使用的工具允許清單。                                                |
| `model`, `systemPrompt` | 無                  | 供 `replyMode: "model"` 補全使用。                                                      |
| `reconnectMs`           | `1500`              | 即時連線重新連線延遲（100 至 60000）。                                                  |

如果 `plugins.allow` 是非空的限制性清單，在頻道設定中明確選取
ClickClack，或執行 `openclaw plugins enable clickclack`，會將
`clickclack` 附加至該清單。初始設定安裝使用相同的明確選取行為。
這些路徑不會覆寫 `plugins.deny` 或全域 `plugins.enabled: false`
設定。直接執行 `openclaw plugins install @openclaw/clickclack`
會遵循一般外掛安裝政策，並且也會在現有允許清單中記錄 ClickClack。

## 多個機器人

每個帳戶都會建立自己的 ClickClack 即時連線，並使用各自的機器人權杖。

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
- `replyMode: "model"` 會略過代理程式管線，並使用外掛執行階段的 `llm.complete` 產生簡短的直接機器人回覆（可選擇以 `model` 與 `systemPrompt` 調整）。

模型模式會針對已解析的機器人代理程式 ID 執行補全，因此需要明確啟用
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

如果您只使用預設的 `agent` 回覆模式，請保持關閉此信任位元；該模式
不需要它。

請使用 `agent` 模式取得跨服務關聯證據。對於採用標準
`msg_<ulid>` 格式的權威 ClickClack 訊息 ID，頻道會衍生出
確定性的 OpenClaw 執行 ID `clickclack:<message-id>`。之後每次模型呼叫
都會在診斷資訊中顯示為 `clickclack:<message-id>:model:<n>`；該回合使用
ClawRouter 時，相同的模型呼叫 ID 會以 `X-Request-ID` 傳送。
`model` 模式會略過一般代理程式執行／工作階段診斷，因此不適用於
此證據路徑。

當即時事件包含已驗證的 `payload.correlation_id` 時，
頻道會在權威訊息擷取及其產生的 ClickClack 回覆請求中，將其作為
`X-Correlation-ID` 傳遞。值使用 ClickClack 的安全
128 字元集合（`A-Z`、`a-z`、`0-9`、`.`、`_`、`:` 和 `-`）；無效值
會被省略。這些關聯只包含識別碼，絕不包含訊息本文、
提示詞、補全內容、憑證或工具輸出。

## 代理程式活動列

根據預設，代理程式回合執行期間，ClickClack 頻道不會顯示任何內容；只有最終回覆會送達。在帳戶上設定 `agentActivity: true`，即可在回合進行期間發布持久的 `agent_commentary` 與 `agent_tool` 訊息列：

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

要求與行為：

- **預設關閉。**標準設定與較舊的 ClickClack 伺服器不受影響。
- **需要 `agent_activity:write` 權杖範圍。**此範圍與 `bot:write` 分開，且不會由後者繼承；啟用此選項前，請使用 `--scopes bot:write,agent_activity:write` 建立機器人權杖（或將此範圍授予現有權杖）。
- **盡力降級。**如果權杖缺少 `agent_activity:write`，或伺服器拒絕寫入活動，系統會記錄失敗，而最終回覆仍會正常傳送；不會出現活動列。
- 記錄列會依回合（`turn_id`）分組並進行合併，使一個邏輯步驟對應一列；工具列使用與 Discord／Slack／Telegram 相同的進度格式（工具名稱加上命令詳細資料）。
- **歸屬中繼資料。**代理程式撰寫的貼文（活動列與最終回覆）會攜帶從該回合實際使用模型解析出的 `author_model` 與 `author_thinking` 欄位（包括發生備援後）。未定義這些欄位的伺服器會忽略未知的 JSON 欄位；保存這些欄位的伺服器則能逐則訊息回答「哪個模型在何種思考層級下說了這一行」。

## 目標

- `channel:<name-or-id>` 傳送至工作區頻道。未加前綴的目標預設為 `channel:`。
- `dm:<user_id>` 建立或重複使用與該使用者的直接對話。
- `thread:<message_id>` 在以該訊息為根的討論串中回覆。

明確指定的傳出目標也可以帶有 `clickclack:` 或 `cc:` 提供者前綴。

範例：

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## 權限

ClickClack API 會強制執行 ClickClack 權杖範圍。

- `bot:read`：讀取工作區／頻道／訊息／討論串／私訊／即時連線／個人資料。
- `bot:write`：包含 `bot:read`，並可傳送頻道訊息、討論串回覆、私訊及上傳內容。
- `bot:admin`：包含 `bot:write`，並可建立頻道。
- `agent_activity:write`：持久的代理程式活動列（`agent_commentary`／`agent_tool`）。不會由 `bot:write` 或 `bot:admin` 繼承；僅在設定 `agentActivity: true` 時需要。

OpenClaw 的一般代理程式聊天只需要 `bot:write`。啟用[代理程式活動列](#agent-activity-rows)時，請加入 `agent_activity:write`。

## 疑難排解

- `ClickClack is not configured for account "<id>"`：為該帳戶設定 `baseUrl`、`token`（例如透過 `CLICKCLACK_BOT_TOKEN`）與 `workspace`。
- `ClickClack workspace not found: <value>`：將 `workspace` 設為 ClickClack 傳回的工作區 ID、短代稱或名稱。
- 沒有傳入回覆：確認權杖具有即時讀取存取權，並注意機器人會忽略自己及其他機器人的訊息。
- 頻道傳送失敗：確認機器人是工作區成員，且具有 `bot:write`。
