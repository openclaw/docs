---
read_when:
    - 將 OpenClaw 連接至 ClickClack 工作區
    - 測試 ClickClack 機器人身分識別資訊
summary: ClickClack 機器人權杖頻道設定與目標語法
title: ClickClack
x-i18n:
    generated_at: "2026-07-21T08:57:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 761538cdd7a916415719131b9ff2f40bf3e3e0eab0f7bda450250886acde8a64
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack 透過一級支援的 ClickClack Bot Token，將 OpenClaw 連接至自託管的 ClickClack 工作區。

若要讓 OpenClaw 代理程式以 ClickClack Bot 使用者的身分出現，請使用此功能。ClickClack 支援獨立服務 Bot 與使用者擁有的 Bot；使用者擁有的 Bot 會保留 `owner_user_id`，且只會取得你授予的 Token 範圍。

## 快速設定

在 ClickClack 中，開啟 **Workspace settings → Integrations → OpenClaw**，使用 **Setup code (recommended)** 建立
Bot，然後複製產生的命令：

```bash
openclaw channels add clickclack --code 'https://clickclack.example.com/#XXXX-XXXX-XXXX'
```

若前端與 API 使用不同來源，或 API 掛載於某個路徑下，ClickClack 會改為產生
確切的認領端點：

```bash
openclaw channels add clickclack --code 'https://api.example.com/services/clickclack/api/bot-setup-codes/claim#XXXX-XXXX-XXXX'
```

設定碼僅能使用一次，並會在 10 分鐘後到期。OpenClaw 會認領該設定碼、
接收新建立的 Bot Token 與工作區設定、儲存帳號、
驗證連線，並回報執行中的閘道是否已載入該帳號。
對於含版本的確切端點，OpenClaw 會驗證並儲存 ClickClack 傳回的標準 API
基底，包括任何路徑前綴。設定碼本身
不會儲存在 OpenClaw 設定中。

公開伺服器的設定碼認領會使用 HTTPS。對於位於
迴路位址（例如 `localhost` 和 `127.0.0.1`）的本機安裝，也支援純 HTTP。

若 OpenClaw 已在執行中，ClickClack 會自動連線，無須執行第二個
命令。否則，請使用以下命令啟動：

```bash
openclaw gateway
```

你也可以將設定碼與伺服器 URL 分開傳入：

```bash
openclaw channels add clickclack --code XXXX-XXXX-XXXX --base-url https://clickclack.example.com
```

若要使用引導式設定，請執行：

```bash
openclaw onboard
```

選取 ClickClack，然後在提示時輸入伺服器 URL、Bot Token 和工作區。
引導式設定會在儲存後檢查伺服器、Token 和工作區；即使
檢查失敗，也不會捨棄設定。

### 替代方式：手動 Token

設定非 OpenClaw 用戶端，或明確需要自行管理 Token 時，
請在 ClickClack 中選擇 **Manual token**：

```bash
openclaw channels add clickclack --base-url https://clickclack.example.com --token ccb_... --workspace default
```

`workspace` 接受工作區 ID（`wsp_...`）、Slug 或顯示名稱。
`--code` 無法與 `--token`、`--token-file` 或 `--use-env` 搭配使用。

### 替代方式：環境變數 Token

預設帳號可以讀取 `CLICKCLACK_BOT_TOKEN`，而不將 Token
儲存在設定中：

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw channels add clickclack --base-url https://clickclack.example.com --workspace default --use-env
openclaw gateway
```

具名帳號必須使用已設定的 Token 或 Token 檔案；共用環境
變數刻意僅限預設帳號使用。

### JSON5 參考

等效的設定結構如下：

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

只有在 `baseUrl`、Token 來源和
`workspace` 全部設定完成時，帳號才會視為已設定。預設帳號的 Token 來源可以是 `token`、`tokenFile` 或
`CLICKCLACK_BOT_TOKEN`。`workspace` 接受工作區
ID（`wsp_...`）、Slug 或名稱；閘道會在啟動時將其解析為 ID。

### 帳號設定鍵

| 鍵                      | 預設值              | 備註                                                                                    |
| ----------------------- | ------------------- | --------------------------------------------------------------------------------------- |
| `baseUrl`               | 無（必填）          | 用於瀏覽器端連結的公開 ClickClack URL。                                                 |
| `apiBaseUrl`            | `baseUrl`           | 用於 REST 與即時 WebSocket 流量的選用伺服器間端點。                                     |
| `token`                 | 無                  | 純文字字串或機密參照（`source: "env" \| "file" \| "exec"`）形式的 Bot Token。                            |
| `tokenFile`             | 無                  | Bot Token 檔案的路徑；優先於 `token`。                                       |
| `workspace`             | 無（必填）          | 工作區 ID、Slug 或名稱。                                                                |
| `replyMode`             | `"agent"`           | `"agent"` 會執行完整的代理程式流水線；`"model"` 會傳送簡短的直接模型補全。 |
| `defaultTo`             | `"channel:general"` | 當輸出路徑未提供目標時使用的目標。                                                      |
| `allowFrom`             | `["*"]`             | 輸入私人訊息與頻道訊息的使用者 ID 允許清單。                                            |
| `botUserId`             | 自動偵測            | 啟動時從 Bot Token 身分解析。                                                           |
| `agentId`               | 路由預設值          | 將此帳號的輸入訊息固定至單一代理程式。                                                  |
| `toolsAllow`            | 無                  | 此帳號之代理程式回覆可使用的工具允許清單。                                              |
| `model`、`systemPrompt` | 無                  | 由 `replyMode: "model"` 補全使用。                                                        |
| `commandMenu`           | `true`              | 將原生命令發布至 ClickClack 編輯器的自動完成。                                          |
| `reconnectMs`           | `1500`              | 即時連線的重新連線延遲（100 至 60000）。                                                |
| `discussions`           | 已停用              | 每個工作階段的受管理頻道設定；請參閱[工作階段討論](#session-discussions)。               |

### 保留受驗證保護的公開主機名稱

當 ClickClack 與 OpenClaw 閘道在同一主機上執行，
但公開 ClickClack 主機名稱受到 Cloudflare Access 等驗證閘道保護時，
請使用 `apiBaseUrl`：

```json5
{
  channels: {
    clickclack: {
      baseUrl: "https://clack.openclaw.ai",
      apiBaseUrl: "http://127.0.0.1:8484",
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
    },
  },
}
```

公開主機名稱可繼續對瀏覽器使用者完整套用驗證限制。OpenClaw
會將迴路端點用於 REST 請求、設定驗證及
即時 WebSocket，而討論的 `embedUrl` 和 `openUrl` 連結則繼續
使用公開的 `baseUrl`。若省略 `apiBaseUrl`，所有流量都會使用
`baseUrl`，以保留既有行為。

若 `plugins.allow` 是非空白的限制性清單，在頻道設定中明確選取
ClickClack，或執行 `openclaw plugins enable clickclack`，
會將 `clickclack` 附加至該清單。上線引導安裝也會使用相同的
明確選取行為。這些路徑不會覆寫 `plugins.deny` 或全域
`plugins.enabled: false` 設定。直接執行
`openclaw plugins install @openclaw/clickclack` 會遵循一般
外掛安裝政策，並且也會將 ClickClack 記錄至現有的允許清單。

## 多個 Bot

每個帳號都會開啟自己的 ClickClack 即時連線，並使用自己的 Bot Token。

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

## 工作階段討論

在一個 ClickClack 帳號上啟用討論，即可為每個 OpenClaw 工作階段提供
專屬的 ClickClack 頻道。帳號 Token 必須包含
`channels:write`（`bot:admin` 套件包含此範圍）；一般的 `bot:write`
設定 Token 無法建立或同步頻道。

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      discussions: {
        enabled: true,
        workspace: "default",
        controlUrlBase: "https://team.openclaw.ai",
        section: "Sessions",
      },
    },
  },
}
```

`discussions.workspace` 接受與帳號層級 `workspace` 相同的工作區 ID、Slug 或顯示名稱，
並以該值為預設值。`section` 控制
ClickClack 側邊欄區段，預設為 `Sessions`。設定
`controlUrlBase` 後，受管理頻道會連回實際的控制介面
工作階段路由 `/chat?session=<encoded-session-key>`。

只能在一個 ClickClack 帳號上啟用討論。閘道提供者
沒有帳號選擇器，因此會拒絕多個已啟用討論的帳號，
而不是依設定順序選擇其中一個。

開啟討論會建立標記為由外部管理的公開 ClickClack 頻道。
外掛會同步工作階段標籤、類別與封存狀態。
還原工作階段會還原其頻道；清除工作階段類別
會將頻道移回已設定的預設區段。刪除
OpenClaw 工作階段時，會封存 ClickClack 頻道而非將其刪除，因此其
歷史記錄仍可使用。使用討論 RPC 時，以及存在任何繫結期間大約每分鐘一次，
外掛都會協調繫結狀態。

受管理頻道中的輸入訊息會使用確定性的側邊工作階段，
其代理程式 ID 與所附加的主要工作階段相同。系統會告知側邊代理程式
要觀察哪個主要工作階段，且它可以使用 `sessions_history` 和 `session_status`
（`changesSince` 適合用於增量檢查）。只有在討論中的人員
要求它轉送或引導主要工作階段時，它才會使用 `sessions_send`。
繫結、受管理的擁有權參照和側邊工作階段對等身分，除了包含固定的 ClickClack 伺服器與
頻道外，也會包含具體的 OpenClaw 工作階段 ID。重設可重複使用的工作階段鍵，
或重新指定帳號目標，會在本機撤銷舊頻道；若舊認證資訊仍可使用，
則會將其封存，且無法重複使用其側邊逐字稿。透過
已封存、重設、停用或重新指定目標的繫結傳入的訊息會被捨棄，而不會
退回至帳號的一般頻道路由。已釋放的繫結會留下永久保存的
已撤銷頻道標記，讓延遲的即時事件繼續採取失敗時關閉的處理。遠端
擁有權以 ClickClack 伺服器和頻道 ID 為鍵，因此重新命名本機
帳號不會將受管理頻道變成一般頻道。

將 `tools.sessions.visibility` 保持為較安全的預設值 `tree`。外掛
只會在每個側邊工作階段及其附加的主要工作階段之間安裝主機範圍授權，
另加一個封鎖工作階段探索與跨工作階段目標的工具政策掛鉤。
它只允許對所附加的主要工作階段使用 `sessions_history`、`session_status` 和
`sessions_send`，並防止狀態呼叫
變更該工作階段的模型。這些工具仍必須存在於
代理程式的有效工具允許清單中。系統提示詞僅供引導；主機授權
與掛鉤才是授權邊界。

ClickClack 伺服器在建立與更新頻道時，必須支援受管理頻道欄位（`external_managed`、
`external_ref`、`external_url` 和 `sidebar_section`），
並在頻道回應中傳回這些欄位。OpenClaw 會先驗證該合約，
再持久化繫結。如果建立回應遺失，下次開啟時會依據伺服器強制執行的
`external_ref` 採用該頻道，而不是另建一個頻道。
在該結果完成協調之前，待處理的保留項目會隔離目標工作區中
原本未繫結的事件。粗粒度協調器會在同一工作階段仍有效時
採用該頻道，或在重設後將其封存；若未建立遠端頻道，
則會清除保留項目。
該參照包含每個 OpenClaw 安裝的持久命名空間，以及
工作階段金鑰、具體工作階段 ID、ClickClack 目的地和持久
繫結世代的雜湊。不同的閘道無法採用彼此的頻道，
重設後的工作階段無法繼承舊頻道歷程，而帳戶或工作區
往返變更也無法重新採用先前的頻道。繫結也會固定至
已設定的 ClickClack 伺服器 URL；若帳戶改指向其他伺服器，
繫結便會失效。變更或移除 `controlUrlBase`，會在下次協調時
更新或清除受管理頻道連結。變更
`discussions.workspace` 時，若舊工作區的認證資訊仍有設定，
系統會先封存並釋放舊繫結，才能在新工作區中開啟頻道。
如果權杖已替換為無法存取舊工作區的工作區範圍認證資訊，
OpenClaw 會將舊頻道記錄為已撤銷，並直接釋放繫結，
不會嘗試使用替代權杖；請從 ClickClack 封存該殘留頻道。

附加的主要工作階段也會收到一個僅供提取的 `discussion` 工具。它會將
最新訊息和近期討論串回覆讀取為每則訊息一筆經逸出處理且標明來源的記錄，
並且不會產生任何寫入或生命週期副作用。頻道根訊息與討論串
查詢具有固定的請求預算；當該安全界限可能遺漏較舊但仍活躍的討論串時，
結果會明確發出警告。

## 回覆模式

- `replyMode: "agent"`（預設）會透過一般代理程式流水線分派傳入訊息，包括工作階段記錄與工具政策。
- `replyMode: "model"` 會略過代理程式流水線，並使用外掛執行階段的 `llm.complete` 直接產生機器人回覆，亦可選擇透過 `model` 和 `systemPrompt` 調整其形式。完成內容的預算由所選供應商與模型決定。

模型模式會針對解析後的機器人代理程式 ID 執行完成要求，因此必須明確啟用
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

如果只使用預設的 `agent` 回覆模式，請保持關閉信任位元；
該模式不需要此設定。

## 命令選單

閘道啟動時，每個已設定的帳戶都會將 OpenClaw 的原生命令
發布到 ClickClack。這些命令會出現在撰寫器的自動完成中，並以
機器人的代號標示。每次啟動都會整批取代已發布的命令集；
若原生命令目錄為空，也會清除過時的選單。

命令選單同步預設為啟用。若要停用，請在帳戶上設定
`commandMenu: false`：

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

權杖需要 `commands:write`。目前的 ClickClack `bot:write` 和
`bot:admin` 套件均包含該範圍，也可以個別授予。
在命令選單推出前建立的權杖，可能需要新增該範圍或更換權杖。

同步會盡力執行，且每次閘道啟動僅執行一次。缺少範圍或發生網路
故障時會記錄警告；若舊版 ClickClack 伺服器沒有該端點，
則會以偵錯層級記錄。這些失敗都不會阻止即時服務啟動。代理程式
離線時選單仍可使用，而機器人離開工作區時則會移除選單。

此版本只發布原生命令規格。別名以及
Skills、外掛或自訂命令目錄不會加入選單。如果某個
名稱也註冊為 HTTP 斜線命令，ClickClack 會優先分派該
註冊項目；其他選單命令仍會透過一般訊息傳遞處理。

請使用 `agent` 模式取得跨服務關聯證據。對於採用標準
`msg_<ulid>` 格式的權威 ClickClack 訊息 ID，頻道會衍生出
確定性的 OpenClaw 執行 ID `clickclack:<message-id>`。之後每次模型呼叫
都會在診斷資訊中顯示為 `clickclack:<message-id>:model:<n>`；該
回合使用 ClawRouter 時，系統也會將相同的模型呼叫 ID 作為 `X-Request-ID` 傳送。
`model` 模式會略過一般代理程式執行／工作階段診斷，因此
不適用於此證據路徑。

即時事件包含已驗證的 `payload.correlation_id` 時，
頻道會在權威訊息擷取及產生的 ClickClack 回覆請求中，
將其攜帶為 `X-Correlation-ID`。值使用 ClickClack 的安全
128 字元集合（`A-Z`、`a-z`、`0-9`、`.`、`_`、`:` 和 `-`）；
無效值會被省略。這些關聯只包含識別碼，絕不包含訊息本文、
提示、完成內容、認證資訊或工具輸出。

## 持久媒體傳遞

包含媒體的代理程式回覆會使用必要的持久傳遞。OpenClaw 會在
第一次寫入 ClickClack 前，為每個部分指派穩定的訊息與上傳隨機數，因此
重試時會重複使用相同的上傳與訊息，而不會消耗儲存空間配額
或發布重複內容。若重新啟動後上傳已存在，
OpenClaw 不會重新讀取原始本機路徑或遠端媒體 URL。

此復原合約要求 ClickClack 伺服器支援：

- `GET /api/uploads/by-nonce`，且在
  找到與未找到的結果中包含 `X-ClickClack-Upload-Nonce: supported`。
- `GET /api/messages/by-nonce`，且在
  找到與未找到的結果中包含 `X-ClickClack-Message-Nonce: supported`。
- 針對相同擁有者範圍隨機數與上傳，以冪等方式建立訊息並建立附件關聯。

舊版伺服器的一般 404 不會被視為傳送不存在的證明。
OpenClaw 會讓傳遞保持未解決狀態，而不是冒險產生重複項目；
啟用會產生媒體的代理程式回覆前，請先更新 ClickClack。

## 代理程式活動列

預設情況下，代理程式回合執行時 ClickClack 頻道不會顯示任何內容；只有最終回覆會送達。請在帳戶上設定 `agentActivity: true`，以在回合進行期間發布持久的 `agent_commentary` 和 `agent_tool` 訊息列：

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
- **需要 `agent_activity:write` 權杖範圍。** 此範圍與 `bot:write` 分開，且不會從後者繼承；啟用此選項前，請使用 `--scopes bot:write,agent_activity:write` 建立機器人權杖（或將該範圍授予現有權杖）。
- **盡力降級。** 如果權杖缺少 `agent_activity:write`，或伺服器拒絕活動寫入，系統會記錄失敗，而最終回覆仍會正常傳遞；不會出現活動列。
- 資料列會依每個回合（`turn_id`）分組並合併，使一個邏輯步驟對應一列；工具列會使用與 Discord／Slack／Telegram 相同的進度格式（工具名稱加上命令詳細資料）。
- **歸屬中繼資料。** 代理程式撰寫的貼文（活動列與最終回覆）會包含依該回合實際使用模型（包括後援後）解析出的 `author_model` 和 `author_thinking` 欄位。未定義這些欄位的伺服器會忽略未知的 JSON 欄位；持久保存這些欄位的伺服器，則可逐則訊息回答「哪個模型以哪種思考層級說了這一行」。

## 目標

- `channel:<name-or-id>` 會傳送至工作區頻道。未加前綴的目標預設為 `channel:`。
- `dm:<user_id>` 會建立或重複使用與該使用者的直接對話。
- `thread:<message_id>` 會在以該訊息為根的討論串中回覆。

明確的輸出目標也可以帶有 `clickclack:` 或 `cc:` 供應商前綴。

輸出媒體會使用 ClickClack 的上傳 API，然後將持久上傳項目
附加到所建立的頻道訊息、討論串回覆或私訊。本機檔案與支援的
遠端媒體 URL 會遵循 OpenClaw 的一般媒體存取政策，每個檔案上限為 64 MiB。
持久佇列傳送會為每個上傳與訊息部分使用不同的擁有者範圍隨機數，
然後使用相同物件重試附件關聯。伺服器
合約與復原行為請參閱[持久媒體傳遞](#durable-media-delivery)。

範例：

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## 權限

ClickClack 權杖範圍由 ClickClack API 強制執行。

- `bot:read`：讀取工作區／頻道／訊息／討論串／私訊／即時／個人資料。
- `bot:write`：`bot:read`，另加頻道訊息、討論串回覆、私訊、上傳及命令選單發布。
- `bot:admin`：`bot:write`，另加頻道建立。
- `commands:write`：發布機器人的命令選單。包含在目前的 `bot:write` 和 `bot:admin` 套件中，也可個別授予。
- `agent_activity:write`：持久代理程式活動列（`agent_commentary`／`agent_tool`）。不會從 `bot:write` 或 `bot:admin` 繼承；只有設定 `agentActivity: true` 時才需要。

OpenClaw 進行一般代理程式聊天及命令選單同步時，只需要目前的 `bot:write`。啟用[代理程式活動列](#agent-activity-rows)時，請新增 `agent_activity:write`。

## 疑難排解

- `ClickClack is not configured for account "<id>"`：請為該帳戶設定 `baseUrl`、`token`（例如透過 `CLICKCLACK_BOT_TOKEN`）及 `workspace`。
- `ClickClack workspace not found: <value>`：將 `workspace` 設為 ClickClack 傳回的工作區 ID、slug 或名稱。
- 沒有傳入回覆：請確認權杖具有即時讀取存取權，並注意機器人會忽略自己的訊息及其他機器人的訊息。
- 頻道傳送失敗：請確認機器人是工作區成員，且具有 `bot:write`。
- 沒有命令選單：請確認 `commandMenu` 不是 `false`、ClickClack 伺服器支援 `PUT /api/bots/self/commands`，且權杖具有 `commands:write`。
