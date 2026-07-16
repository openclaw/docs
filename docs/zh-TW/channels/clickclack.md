---
read_when:
    - 將 OpenClaw 連接至 ClickClack 工作區
    - 測試 ClickClack 機器人身分識別
summary: ClickClack 機器人權杖頻道設定與目標語法
title: ClickClack
x-i18n:
    generated_at: "2026-07-16T11:21:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2c422664ecdc9e41eb1810ca61654b886f1c51357fb9f48054d30c20a86ea8bc
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack 透過原生支援的 ClickClack 機器人權杖，將 OpenClaw 連接至自行託管的 ClickClack 工作區。

當你希望 OpenClaw 代理程式以 ClickClack 機器人使用者身分出現時，請使用此功能。ClickClack 支援獨立的服務機器人與使用者擁有的機器人；使用者擁有的機器人會保留 `owner_user_id`，且只會取得你授予的權杖範圍。

## 快速設定

在 ClickClack 中，開啟 **Workspace settings → Integrations → OpenClaw**，建立
機器人並複製其權杖。然後設定頻道：

```bash
openclaw channels add clickclack --base-url https://clickclack.example.com --token ccb_... --workspace default
```

`workspace` 接受工作區 ID（`wsp_...`）、代稱或顯示名稱。
`channels add` 會在儲存後驗證伺服器、權杖與工作區，接著
回報執行中的閘道是否已載入新帳號。如果 OpenClaw
已在執行，ClickClack 會自動連線，無須執行第二個命令。
否則，請使用下列命令啟動：

```bash
openclaw gateway
```

若要使用引導式設定，請執行：

```bash
openclaw onboard
```

選取 ClickClack，然後在提示時輸入伺服器 URL、機器人權杖與工作區。
引導式設定會在儲存後檢查伺服器、權杖與工作區；即使
檢查失敗，也不會捨棄設定。

### 替代方式：以環境變數提供權杖

預設帳號可讀取 `CLICKCLACK_BOT_TOKEN`，而不將權杖
儲存在設定中：

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw channels add clickclack --base-url https://clickclack.example.com --workspace default --use-env
openclaw gateway
```

具名帳號必須使用已設定的權杖或權杖檔案；共用環境變數
刻意僅限預設帳號使用。

### JSON5 參考

對應的設定結構如下：

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

只有在 `baseUrl`、權杖來源與
`workspace` 均已設定時，帳號才視為已完成設定。預設帳號的權杖來源可以是 `token`、`tokenFile` 或
`CLICKCLACK_BOT_TOKEN`。`workspace` 接受工作區
ID（`wsp_...`）、代稱或名稱；閘道會在啟動時將其解析為 ID。

### 帳號設定鍵

| 鍵                      | 預設值              | 備註                                                                                    |
| ----------------------- | ------------------- | --------------------------------------------------------------------------------------- |
| `baseUrl`               | 無（必填）          | ClickClack 伺服器 URL。                                                                 |
| `token`                 | 無                  | 純文字字串或秘密參照（`source: "env" \| "file" \| "exec"`）形式的機器人權杖。        |
| `tokenFile`             | 無                  | 機器人權杖檔案的路徑；優先於 `token`。                                |
| `workspace`             | 無（必填）          | 工作區 ID、代稱或名稱。                                                                 |
| `replyMode`             | `"agent"`           | `"agent"` 會執行完整的代理程式管線；`"model"` 會傳送簡短的直接模型補全。 |
| `defaultTo`             | `"channel:general"` | 當傳出路徑未提供目標時使用的目標。                                                      |
| `allowFrom`             | `["*"]`             | 傳入私訊與頻道訊息的使用者 ID 允許清單。                                               |
| `botUserId`             | 自動偵測            | 啟動時從機器人權杖身分解析。                                                            |
| `agentId`               | 路由預設值          | 將此帳號的傳入訊息固定交由單一代理程式處理。                                            |
| `toolsAllow`            | 無                  | 此帳號之代理程式回覆可使用的工具允許清單。                                              |
| `model`、`systemPrompt` | 無                  | 供 `replyMode: "model"` 補全使用。                                               |
| `commandMenu`           | `true`              | 將原生命令發布至 ClickClack 撰寫器的自動完成。                                          |
| `reconnectMs`           | `1500`              | 即時連線重新連線延遲（100 至 60000）。                                                  |

如果 `plugins.allow` 是非空的限制性清單，則在頻道設定中明確選取
ClickClack，或執行 `openclaw plugins enable clickclack`，
都會將 `clickclack` 附加至該清單。引導安裝也採用相同的
明確選取行為。這些路徑不會覆寫 `plugins.deny` 或
全域 `plugins.enabled: false` 設定。直接執行
`openclaw plugins install @openclaw/clickclack` 會遵循一般的
外掛安裝政策，並且也會在現有允許清單中記錄 ClickClack。

## 多個機器人

每個帳號都會開啟自己的 ClickClack 即時連線，並使用自己的機器人權杖。

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
- `replyMode: "model"` 會略過代理程式管線，並使用外掛執行階段的 `llm.complete` 直接產生機器人回覆，並可選擇以 `model` 與 `systemPrompt` 調整其形式。補全額度由所選提供者與模型負責。

模型模式會針對解析後的機器人代理程式 ID 執行補全，因此需要
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

如果只使用預設的 `agent` 回覆模式，請關閉信任位元；
該模式不需要此設定。

## 命令選單

閘道啟動時，每個已設定的帳號都會將 OpenClaw 的原生
命令發布至 ClickClack。這些命令會顯示在撰寫器的自動完成中，並以
機器人的代號標示。每次啟動都會完整取代已發布的命令集，
包括在原生命令目錄為空時清除過時的選單。

命令選單同步預設為啟用。請在帳號上設定 `commandMenu: false`
以停用：

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      commandMenu: false,
    },
  },
}
```

權杖需要 `commands:write`。目前 ClickClack 的 `bot:write` 與
`bot:admin` 套件包含此範圍，也可以
個別授予。於命令選單推出前建立的權杖，可能需要
新增該範圍或更換權杖。

同步會盡力執行，且每次閘道啟動只執行一次。缺少範圍或網路
故障時會記錄警告；若較舊的 ClickClack 伺服器沒有該端點，則會以
偵錯層級記錄。這些故障都不會阻止即時連線啟動。選單在
代理程式離線時仍可使用，並會在機器人離開
工作區時移除。

此版本僅發布原生命令規格。別名以及
Skill、外掛或自訂命令目錄不會加入選單。如果某個
名稱也註冊為 HTTP 斜線命令，ClickClack 會先分派該
註冊項目；其他選單命令則繼續透過一般訊息
傳遞。

請使用 `agent` 模式取得跨服務關聯證據。對於採用標準 `msg_<ulid>` 格式的權威
ClickClack 訊息 ID，頻道會衍生出
確定性的 OpenClaw 執行 ID `clickclack:<message-id>`。之後，每次模型呼叫
都會在診斷中顯示為 `clickclack:<message-id>:model:<n>`；當該
輪次使用 ClawRouter 時，相同的模型呼叫 ID 會以 `X-Request-ID` 傳送。
`model` 模式會略過一般的代理程式執行／工作階段診斷，因此
不適用於此證據路徑。

當即時事件包含已驗證的 `payload.correlation_id` 時，
頻道會在權威訊息擷取與
所產生的 ClickClack 回覆請求中，將其帶入為 `X-Correlation-ID`。值會使用 ClickClack 的安全
128 字元集合（`A-Z`、`a-z`、`0-9`、`.`、`_`、`:` 與 `-`）；無效值
會被省略。這些關聯只包含識別碼，絕不包含訊息本文、
提示詞、補全、認證資訊或工具輸出。

## 持久化媒體傳遞

包含媒體的代理程式回覆會使用必要的持久化傳遞。OpenClaw 會在
第一次寫入 ClickClack 前，為每個部分指派穩定的訊息與上傳 nonce，因此
重試時會重複使用相同的上傳與訊息，而不會耗用儲存空間配額
或發布重複內容。如果重新啟動後上傳已存在，
OpenClaw 不會重新讀取原始本機路徑或遠端媒體 URL。

此復原合約需要 ClickClack 伺服器支援：

- `GET /api/uploads/by-nonce`，並在
  找到與找不到的結果中包含 `X-ClickClack-Upload-Nonce: supported`。
- `GET /api/messages/by-nonce`，並在
  找到與找不到的結果中包含 `X-ClickClack-Message-Nonce: supported`。
- 針對相同擁有者範圍的 nonce 與上傳，提供具冪等性的訊息建立與附件關聯。

較舊伺服器的一般 404 不會被視為傳送不存在的證據。
OpenClaw 會讓傳遞保持未解決狀態，而不冒著產生重複內容的風險；啟用
會產生媒體的代理程式回覆前，請先更新
ClickClack。

## 代理程式活動列

根據預設，代理程式輪次執行期間，ClickClack 頻道不會顯示任何內容；只會送達最終回覆。在帳號上設定 `agentActivity: true`，即可在輪次進行期間發布持久化的 `agent_commentary` 與 `agent_tool` 訊息列：

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

- **預設關閉。** 標準設定與較舊的 ClickClack 伺服器不受影響。
- **需要 `agent_activity:write` 權杖範圍。** 此範圍與 `bot:write` 分開，且不會繼承後者；啟用此選項前，請使用 `--scopes bot:write,agent_activity:write` 建立機器人權杖（或將該範圍授予現有權杖）。
- **盡力降級。** 如果權杖缺少 `agent_activity:write`，或伺服器拒絕活動寫入，系統會記錄故障，而最終回覆仍會正常傳遞；不會出現活動列。
- 各列會依輪次（`turn_id`）分組並合併，讓一個邏輯步驟對應一列；工具列使用與 Discord／Slack／Telegram 相同的進度格式（工具名稱加上命令詳細資料）。
- **歸屬中繼資料。** 由代理程式撰寫的貼文（活動列與最終回覆）會帶有根據該輪次實際使用的模型解析出的 `author_model` 與 `author_thinking` 欄位（包括備援後）。未定義這些欄的伺服器會忽略未知的 JSON 欄位；保存這些欄位的伺服器則可逐則訊息回答「這一行是哪個模型以哪種思考層級所說」。

## 目標

- `channel:<name-or-id>` 會傳送至工作區頻道。未加前綴的目標預設為 `channel:`。
- `dm:<user_id>` 會建立或重複使用與該使用者的直接對話。
- `thread:<message_id>` 會在以該訊息為起點的討論串中回覆。

明確指定的傳出目標也可以帶有 `clickclack:` 或 `cc:` 提供者前綴。

傳出媒體會使用 ClickClack 的上傳 API，然後將持久化的上傳內容附加至所建立的頻道訊息、討論串回覆或私訊。本機檔案與支援的遠端媒體 URL 遵循 OpenClaw 的一般媒體存取政策，每個檔案上限為 64 MiB。持久化佇列傳送會針對每個上傳與訊息部分使用各自依擁有者限定範圍的 nonce，然後使用相同物件重試附件關聯。伺服器合約與復原行為請參閱[持久化媒體傳遞](#durable-media-delivery)。

範例：

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## 權限

ClickClack 權杖的範圍由 ClickClack API 強制執行。

- `bot:read`：讀取工作區／頻道／訊息／討論串／私訊／即時／個人資料。
- `bot:write`：`bot:read`，另加頻道訊息、討論串回覆、私訊、上傳及指令選單發布。
- `bot:admin`：`bot:write`，另加建立頻道。
- `commands:write`：發布機器人的指令選單。已包含在目前的 `bot:write` 與 `bot:admin` 套組中，也可個別授予。
- `agent_activity:write`：持久化代理程式活動資料列（`agent_commentary`／`agent_tool`）。不會由 `bot:write` 或 `bot:admin` 繼承；僅在設定 `agentActivity: true` 時需要。

一般代理程式聊天與指令選單同步只需要目前的 `bot:write`。啟用[代理程式活動資料列](#agent-activity-rows)時，請加入 `agent_activity:write`。

## 疑難排解

- `ClickClack is not configured for account "<id>"`：為該帳號設定 `baseUrl`、`token`（例如透過 `CLICKCLACK_BOT_TOKEN`）及 `workspace`。
- `ClickClack workspace not found: <value>`：將 `workspace` 設為 ClickClack 傳回的工作區 ID、slug 或名稱。
- 沒有傳入回覆：確認權杖具有即時讀取存取權，並注意機器人會忽略自己的訊息以及其他機器人的訊息。
- 頻道傳送失敗：確認機器人是該工作區的成員，且具有 `bot:write`。
- 沒有指令選單：確認 `commandMenu` 不是 `false`、ClickClack 伺服器支援 `PUT /api/bots/self/commands`，且權杖具有 `commands:write`。
