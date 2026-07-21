---
read_when:
    - 將 Codex、Claude Code 或其他 MCP 用戶端連接至由 OpenClaw 支援的頻道
    - 執行 `openclaw mcp serve`
    - 管理 OpenClaw 儲存的 MCP 伺服器定義
sidebarTitle: MCP
summary: 透過 MCP 公開 OpenClaw 頻道對話，並管理已儲存的 MCP 伺服器定義
title: MCP
x-i18n:
    generated_at: "2026-07-21T08:58:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ee6146bbc0181d10997336094d1bd693d0afb0985f1febef8e8c6b0d6e656cf9
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` 有兩項工作：

- 使用 `openclaw mcp serve` 將 OpenClaw 作為 MCP 伺服器執行
- 使用 `list`、`show`、`status`、`doctor`、`probe`、`add`、`set`、`configure`、`tools`、`login`、`logout`、`reload` 和 `unset` 管理由 OpenClaw 管理的對外 MCP 伺服器定義

`serve` 是由 OpenClaw 作為 MCP 伺服器運作。其他子命令則由 OpenClaw 作為 MCP 用戶端側登錄檔，用於登錄其自身執行階段稍後可能使用的伺服器。

<Note>
  `list`、`show`、`set` 和 `unset` 只會讀寫 OpenClaw 設定中由 OpenClaw 管理的 `mcp.servers` 項目。它們不包含來自 `config/mcporter.json` 的 mcporter 伺服器；該登錄檔請使用 `mcporter list`。
</Note>

當 OpenClaw 應自行託管程式設計工具框架工作階段，並透過 ACP 路由該執行階段時，請使用 [`openclaw acp`](/zh-TW/cli/acp)。

## 選擇正確的 MCP 路徑

| 目標                                                                | 使用                                                                  | 原因                                                                                                             |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 讓外部 MCP 用戶端讀取／傳送 OpenClaw 頻道對話 | `openclaw mcp serve`                                                 | OpenClaw 是 MCP 伺服器，並透過 stdio 公開由閘道支援的對話。                                 |
| 儲存第三方 MCP 伺服器，供 OpenClaw 管理的代理程式執行使用        | `openclaw mcp add`、`set`、`configure`、`tools`、`login`             | OpenClaw 是 MCP 用戶端側登錄檔，稍後會將這些伺服器投射至符合條件的執行階段。               |
| 不執行代理程式回合，直接檢查已儲存的伺服器                  | `openclaw mcp status`、`doctor`、`probe`                             | `status` 和 `doctor` 會檢查設定；`probe` 會開啟即時 MCP 連線並列出功能。               |
| 從瀏覽器編輯 MCP 設定                                      | 控制介面 `/settings/mcp`（`/mcp` 別名）                            | 此頁面會顯示清單、啟用狀態、OAuth／篩選器摘要、命令提示，以及有範圍限制的 `mcp` 編輯器。         |
| 為 Codex app-server 提供範圍受限的原生 MCP 伺服器                    | `mcp.servers.<name>.codex`                                           | `codex` 區塊只會影響 Codex app-server 執行緒投射，並會在原生設定移交前移除。 |
| 執行由 ACP 託管的工具框架工作階段                                     | [`openclaw acp`](/zh-TW/cli/acp) 和 [ACP 代理程式](/zh-TW/tools/acp-agents-setup) | ACP 橋接模式不接受每工作階段的 MCP 伺服器注入；請改為設定閘道／外掛橋接器。     |

<Tip>
如果不確定需要哪一條路徑，請先使用 `openclaw mcp status --verbose`。它會顯示 OpenClaw 已儲存的內容，而不會啟動任何 MCP 伺服器。
</Tip>

## 將 OpenClaw 作為 MCP 伺服器

這是 `openclaw mcp serve` 路徑。

### 何時使用 serve

在以下情況使用 `openclaw mcp serve`：

- Codex、Claude Code 或其他 MCP 用戶端應直接與由 OpenClaw 支援的頻道對話通訊
- 你已有具備路由工作階段的本機或遠端 OpenClaw 閘道
- 你希望使用一個可跨 OpenClaw 頻道後端運作的 MCP 伺服器，而非為每個頻道分別執行橋接器

當 OpenClaw 應自行託管程式設計執行階段，並將代理程式工作階段保留在 OpenClaw 內時，請改用 [`openclaw acp`](/zh-TW/cli/acp)。

### 運作方式

`openclaw mcp serve` 會啟動 stdio MCP 伺服器。MCP 用戶端擁有該程序。當用戶端維持 stdio 工作階段開啟時，橋接器會透過 WebSocket 連線至本機或遠端 OpenClaw 閘道，並透過 MCP 公開已路由的頻道對話。

<Steps>
  <Step title="用戶端產生橋接器">
    MCP 用戶端會產生 `openclaw mcp serve`。
  </Step>
  <Step title="橋接器連線至閘道">
    橋接器會透過 WebSocket 連線至 OpenClaw 閘道。
  </Step>
  <Step title="工作階段成為 MCP 對話">
    已路由的工作階段會成為 MCP 對話及逐字稿／歷程記錄工具。
  </Step>
  <Step title="即時事件進入佇列">
    橋接器連線期間，即時事件會排入記憶體中的佇列。
  </Step>
  <Step title="選用的 Claude 推播">
    如果啟用 Claude 頻道模式，同一工作階段也能接收 Claude 專用推播通知。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="重要行為">
    - 即時佇列狀態會在橋接器連線時開始
    - 較舊的逐字稿歷程記錄會使用 `messages_read` 讀取
    - Claude 推播通知只會在 MCP 工作階段存續期間存在
    - 用戶端中斷連線時，橋接器會結束，即時佇列也會消失
    - 像 `openclaw agent` 和 `openclaw infer model run` 這類一次性代理程式進入點，會在回覆完成後終止其開啟的所有隨附 MCP 執行階段，因此重複的指令碼執行不會累積 stdio MCP 子程序
    - 由 OpenClaw 啟動的 stdio MCP 伺服器（無論是隨附或使用者設定）會在關閉時以程序樹方式終止，因此伺服器啟動的子程序不會在父 stdio 用戶端結束後繼續存留
    - 刪除或重設工作階段時，會透過共用的執行階段清理路徑處置該工作階段的 MCP 用戶端，因此不會留下繫結至已移除工作階段的 stdio 連線

  </Accordion>
</AccordionGroup>

### 選擇用戶端模式

<Tabs>
  <Tab title="一般 MCP 用戶端">
    僅使用標準 MCP 工具。請使用 `conversations_list`、`messages_read`、`events_poll`、`events_wait`、`messages_send` 和核准工具。
  </Tab>
  <Tab title="Claude Code">
    標準 MCP 工具加上 Claude 專用頻道配接器。啟用 `--claude-channel-mode on`，或保留預設的 `auto`。
  </Tab>
</Tabs>

<Note>
目前，`auto` 的行為與 `on` 相同。尚未提供用戶端功能偵測。
</Note>

### serve 公開的內容

橋接器使用現有的閘道工作階段路由中繼資料，公開以頻道為後端的對話。當 OpenClaw 已有包含已知路由的工作階段狀態時，對話就會出現，例如：

- `channel`
- 收件者或目的地中繼資料
- 選用的 `accountId`
- 選用的 `threadId`

這讓 MCP 用戶端可在單一位置：

- 列出近期已路由的對話
- 讀取近期逐字稿歷程記錄
- 等待新的傳入事件
- 透過相同路由傳送回覆
- 查看橋接器連線期間送達的核准要求

### 用法

<Tabs>
  <Tab title="本機閘道">
    ```bash
    openclaw mcp serve
    ```
  </Tab>
  <Tab title="遠端閘道（權杖）">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
    ```
  </Tab>
  <Tab title="遠端閘道（密碼）">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password
    ```
  </Tab>
  <Tab title="詳細輸出／關閉 Claude">
    ```bash
    openclaw mcp serve --verbose
    openclaw mcp serve --claude-channel-mode off
    ```
  </Tab>
</Tabs>

### 橋接器工具

<AccordionGroup>
  <Accordion title="conversations_list">
    列出閘道工作階段狀態中已有路由中繼資料的近期工作階段後端對話。

    篩選器：`limit`（上限 500）、`search`、`channel`、`includeDerivedTitles`、`includeLastMessage`。

  </Accordion>
  <Accordion title="conversation_get">
    使用直接的閘道工作階段查詢，依 `session_key` 傳回一則對話。
  </Accordion>
  <Accordion title="messages_read">
    讀取一則工作階段後端對話的近期逐字稿訊息。`limit` 預設為 20，上限為 200。
  </Accordion>
  <Accordion title="attachments_fetch">
    從一則逐字稿訊息擷取非文字訊息內容區塊。這是逐字稿內容的中繼資料檢視，而非獨立的持久附件 Blob 儲存區。
  </Accordion>
  <Accordion title="events_poll">
    從數字游標之後讀取已排入佇列的即時事件。`limit` 上限為 200。
  </Accordion>
  <Accordion title="events_wait">
    長輪詢直到下一個符合條件的佇列事件抵達或逾時（預設 30s，上限 300s）。

    當一般 MCP 用戶端需要近即時傳遞，而不使用 Claude 專用推播通訊協定時，請使用此工具。

  </Accordion>
  <Accordion title="messages_send">
    透過工作階段上已記錄的相同路由傳回文字。

    目前的行為：

    - 需要現有的對話路由
    - 使用工作階段的頻道、收件者、帳戶 ID 和執行緒 ID
    - 僅傳送文字

  </Accordion>
  <Accordion title="permissions_list_open">
    列出橋接器自連線至閘道後觀察到的待處理執行／外掛核准要求。
  </Accordion>
  <Accordion title="permissions_respond">
    使用下列其中一項解析待處理的執行／外掛核准要求：

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### 事件模型

橋接器連線期間，會維持記憶體內事件佇列。

目前的事件類型：

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- 佇列僅供即時使用；它會在 MCP 橋接器啟動時開始
- `events_poll` 和 `events_wait` 本身不會重播較舊的閘道歷程記錄
- 持久待處理記錄應使用 `messages_read` 讀取

</Warning>

### Claude 頻道通知

橋接器也能公開 Claude 專用頻道通知。這相當於 OpenClaw 的 Claude Code 頻道配接器：標準 MCP 工具仍然可用，但即時傳入訊息也能以 Claude 專用 MCP 通知的形式送達。

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`：僅使用標準 MCP 工具。
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on`：啟用 Claude 頻道通知。
  </Tab>
  <Tab title="auto（預設）">
    `--claude-channel-mode auto`：目前的預設值；橋接器行為與 `on` 相同。
  </Tab>
</Tabs>

啟用 Claude 頻道模式時，伺服器會宣告 Claude 實驗性功能，並可發出：

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

目前的橋接器行為：

- 傳入的 `user` 逐字稿訊息會轉送為 `notifications/claude/channel`
- 透過 MCP 收到的 Claude 權限要求會在記憶體中追蹤
- 如果連結對話中的命令擁有者稍後傳送 `yes <id>` 或 `no <id>`（`<id>` 是不含 `l` 的 5 字母要求 ID），橋接器會將其轉換為 `notifications/claude/channel/permission`
- 這些通知僅限即時工作階段；如果 MCP 用戶端中斷連線，就沒有推播目標

這是刻意設計為用戶端專用的行為。一般 MCP 用戶端應使用標準輪詢工具。

### MCP 用戶端設定

stdio 用戶端設定範例：

```json
{
  "mcpServers": {
    "openclaw": {
      "command": "openclaw",
      "args": [
        "mcp",
        "serve",
        "--url",
        "wss://gateway-host:18789",
        "--token-file",
        "/path/to/gateway.token"
      ]
    }
  }
}
```

對於大多數通用 MCP 用戶端，請先使用標準工具介面，並忽略 Claude 模式。僅針對確實支援 Claude 特定通知方法的用戶端開啟 Claude 模式。

### 選項

`openclaw mcp serve` 支援：

<ParamField path="--url" type="string">
  閘道 WebSocket URL。設定後預設為 `gateway.remote.url`。
</ParamField>
<ParamField path="--token" type="string">
  閘道權杖。
</ParamField>
<ParamField path="--token-file" type="string">
  從檔案讀取權杖。
</ParamField>
<ParamField path="--password" type="string">
  閘道密碼。
</ParamField>
<ParamField path="--password-file" type="string">
  從檔案讀取密碼。
</ParamField>
<ParamField path="--claude-channel-mode" type='"auto" | "on" | "off"'>
  Claude 通知模式。預設為 `auto`。
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  在 stderr 輸出詳細記錄。
</ParamField>

<Tip>
可能的話，請優先使用 `--token-file` 或 `--password-file`，而不要直接內嵌秘密資訊。
</Tip>

### 安全性與信任邊界

橋接器不會自行建立路由。它只會公開閘道已知道如何路由的對話。

這表示：

- 傳送者允許清單、配對及頻道層級信任仍由底層 OpenClaw 頻道設定負責
- `messages_send` 只能透過既有的已儲存路由回覆
- 核准狀態僅在目前的橋接器工作階段中即時存在於記憶體內
- 橋接器驗證應使用你願意信任任何其他遠端閘道用戶端使用的相同閘道權杖或密碼控制措施

如果 `conversations_list` 中缺少某個對話，通常原因並非 MCP 設定，而是底層閘道工作階段缺少路由中繼資料或其中的資料不完整。

### 測試

OpenClaw 隨附此橋接器的確定性 Docker 煙霧測試：

```bash
pnpm test:docker:mcp-channels
```

此煙霧測試會執行單一容器：先植入對話狀態並啟動閘道，接著將 `openclaw mcp serve` 產生為 stdio 子程序，並以 MCP 用戶端的方式驅動它。它會透過實際的 stdio MCP 橋接器，驗證對話探索、逐字稿讀取、附件中繼資料讀取、即時事件佇列行為，以及 Claude 樣式的頻道與權限通知。對外傳送路由（`messages_send` 重複使用已儲存的對話路由）則由 `src/mcp/channel-server.test.ts` 中的單元測試另行涵蓋。

若不想在測試執行中接入真實的 Telegram、Discord 或 iMessage 帳號，這是證明橋接器正常運作最快的方法。

如需更廣泛的測試背景資訊，請參閱[測試](/zh-TW/help/testing)。

### 疑難排解

<AccordionGroup>
  <Accordion title="未傳回任何對話">
    通常表示閘道工作階段尚無法路由。請確認底層工作階段已儲存頻道／供應商、收件者，以及選用的帳號／討論串路由中繼資料。
  </Accordion>
  <Accordion title="events_poll 或 events_wait 遺漏較舊的訊息">
    這是預期行為。即時佇列會在橋接器連線時開始運作。請使用 `messages_read` 讀取較舊的逐字稿歷史記錄。
  </Accordion>
  <Accordion title="未顯示 Claude 通知">
    請檢查以下所有項目：

    - 用戶端持續開啟 stdio MCP 工作階段
    - `--claude-channel-mode` 為 `on` 或 `auto`
    - 用戶端確實支援 Claude 特定通知方法
    - 輸入訊息是在橋接器連線後才發生

  </Accordion>
  <Accordion title="缺少核准">
    `permissions_list_open` 只會顯示橋接器連線期間觀察到的核准要求。它不是持久性核准歷史記錄 API。
  </Accordion>
</AccordionGroup>

## 將 OpenClaw 作為 MCP 用戶端登錄檔

這是 `openclaw mcp list`、`show`、`status`、`doctor`、`probe`、`add`、`set`、
`configure`、`tools`、`login`、`logout`、`reload` 及 `unset` 路徑。

這些命令不會透過 MCP 公開 OpenClaw。它們會管理 OpenClaw 設定中 `mcp.servers` 下由 OpenClaw 管理的 MCP 伺服器定義。它們不會從 `config/mcporter.json` 讀取 mcporter 伺服器。

這些儲存的定義供 OpenClaw 稍後啟動或設定的執行階段使用，例如內嵌 OpenClaw 與其他執行階段配接器。OpenClaw 會集中儲存這些定義，讓這些執行階段不必各自維護重複的 MCP 伺服器清單。

<AccordionGroup>
  <Accordion title="重要行為">
    - 這些命令只會讀取或寫入 OpenClaw 設定
    - `status`、`list`、`show`、不含 `--probe` 的 `doctor`、`set`、`configure`、`tools`、`logout`、`reload` 及 `unset` 不會連線到目標 MCP 伺服器
    - `login` 會為已設定的 HTTP 伺服器執行 MCP OAuth 網路流程，並儲存產生的本機認證資訊
    - `status --verbose` 會輸出解析後的傳輸、驗證、逾時、篩選器及平行工具呼叫提示，而不會進行連線
    - `doctor` 會檢查已儲存的定義是否存在本機設定問題，例如缺少 stdio 命令、工作目錄無效、缺少 TLS 檔案、伺服器已停用、敏感標頭／環境變數使用常值，以及 OAuth 授權不完整
    - `doctor --probe` 會在靜態檢查通過後，加入與 `probe` 相同的即時連線證明
    - `probe` 會連線到所選伺服器或所有已設定的伺服器、列出工具，並回報功能／診斷資訊
    - `add` 會根據旗標建立定義，並在儲存前進行探測，除非已設定 `--no-probe`，或必須先完成 OAuth 授權
    - 執行階段配接器會在執行時決定其實際支援的傳輸形式
    - `enabled: false` 會保留已儲存的伺服器，但將其排除在內嵌執行階段探索之外
    - `requestTimeoutMs` 與 `connectionTimeoutMs` 會以毫秒為單位設定各伺服器的要求與連線逾時
    - `supportsParallelToolCalls: true` 會標記配接器可並行呼叫的伺服器
    - HTTP 伺服器可使用靜態標頭、OAuth 登入、TLS 驗證控制，以及 mTLS 憑證／金鑰路徑
    - 內嵌 OpenClaw 會在一般的 `coding` 與 `messaging` 工具設定檔中公開已設定的 MCP 工具；`minimal` 仍會隱藏它們，而 `tools.deny: ["bundle-mcp"]` 則會明確停用它們
    - 各伺服器的 `toolFilter.include` 與 `toolFilter.exclude` 會在探索到的 MCP 工具成為 OpenClaw 工具之前進行篩選
    - 公告資源或提示詞的伺服器也會公開公用程式工具，用於列出／讀取資源及列出／擷取提示詞；這些產生的公用程式名稱（`resources_list`、`resources_read`、`prompts_list`、`prompts_get`）會使用相同的包含／排除篩選器
    - 動態 MCP 工具清單變更會使該工作階段的快取目錄失效；下一次探索／使用時會從伺服器重新整理
    - 重複發生 MCP 工具要求／通訊協定失敗時，會暫停該伺服器一小段時間，以免單一故障伺服器耗盡整個回合
    - 工作階段範圍內的隨附 MCP 執行階段會在閒置 10 分鐘後回收，而單次內嵌執行會在執行結束時清理它們

  </Accordion>
</AccordionGroup>

執行階段配接器可以將此共用登錄檔正規化為其下游用戶端預期的形式。例如，內嵌 OpenClaw 會直接使用 OpenClaw 的 `transport` 值，而 Claude Code 與 Gemini 則會接收命令列介面原生的 `type` 值，例如 `http`、`sse` 或 `stdio`。

Codex app-server 也支援每個伺服器上的選用 `codex` 區塊。這僅是 Codex app-server 討論串所使用的
OpenClaw 投影中繼資料；它不會
變更 ACP 工作階段、通用 Codex 控制框架設定或其他執行階段配接器。
使用非空白的 `codex.agents`，可僅將伺服器投影至特定 OpenClaw
代理程式 ID。空白、僅含空格或無效的代理程式清單會被設定
驗證拒絕，並由執行階段投影路徑省略，而不會變成
全域設定。對於受信任的伺服器，請使用 `codex.defaultToolsApprovalMode`（`auto`、`prompt` 或 `approve`）
來產生 Codex 原生的 `default_tools_approval_mode`。
OpenClaw 會先移除 `codex` 中繼資料，再將原生 `mcp_servers`
設定交給 Codex。

### 已儲存的 MCP 伺服器定義

命令：

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp status [--verbose]`
- `openclaw mcp doctor [name] [--probe]`
- `openclaw mcp probe [name]`
- `openclaw mcp add <name> [flags]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp configure <name> [flags]`
- `openclaw mcp tools <name> [--include csv] [--exclude csv] [--clear]`
- `openclaw mcp login <name> [--code code]`
- `openclaw mcp logout <name>`
- `openclaw mcp reload`
- `openclaw mcp unset <name>`

注意事項：

- `list` 會排序伺服器名稱。
- `show` 未指定名稱時，會輸出完整的已設定 MCP 伺服器物件。
- `status` 會在不連線的情況下分類已設定的傳輸方式。`--verbose` 包含解析後的啟動、逾時、OAuth、篩選器及平行呼叫詳細資料，包括已儲存的 OAuth 權杖需要額外授權的情況。含有認證資訊的 stdio 引數會在文字與 JSON 輸出中遮蔽。
- `doctor` 會在不連線的情況下執行靜態檢查。如果命令也應驗證已啟用的伺服器能否連線，請加入 `--probe`。
- `probe` 會連線並回報工具數量、資源／提示詞支援、清單變更支援及診斷資訊。
- `add` 接受 stdio 旗標，例如 `--command`、`--arg`、`--env` 與 `--cwd`；或 HTTP 旗標，例如 `--url`、`--transport`、`--header`、`--auth oauth`，以及 TLS、逾時和工具選擇旗標。
- `set` 預期命令列上有一個 JSON 物件值。
- `configure` 會更新啟用狀態、工具篩選器、逾時、OAuth、TLS 及平行工具呼叫提示，而不會取代整個伺服器定義。加入 `--probe` 可在儲存前驗證更新後的伺服器。
- `tools` 會更新各伺服器的工具篩選器。包含／排除項目是 MCP 工具名稱與簡單的 `*` glob 模式。
- `login` 會針對使用 `auth: "oauth"` 設定的 HTTP 伺服器執行 OAuth 流程。第一次執行會輸出授權 URL；核准後請使用 `--code` 重新執行。
- `logout` 會清除具名伺服器已儲存的 OAuth 認證資訊，但不會移除已儲存的伺服器定義。
- `reload` 只會處置目前命令列介面程序中快取的同程序 MCP 執行階段。位於其他程序中的閘道或代理程式程序仍需透過各自的重新載入或重新啟動路徑處理。
- Streamable HTTP MCP 伺服器請使用 `transport: "streamable-http"`。為了相容性，`openclaw mcp set` 也會將命令列介面原生的 `type: "http"` 正規化為相同的標準設定形式。
- 如果具名伺服器不存在，`unset` 會失敗。

範例：

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp status --verbose
openclaw mcp doctor --probe
openclaw mcp probe context7 --json
openclaw mcp add memory --command npx --arg -y --arg @modelcontextprotocol/server-memory
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp tools context7 --include 'resolve-library-id,get-library-docs'
openclaw mcp set docs '{"url":"https://mcp.example.com","transport":"streamable-http"}'
openclaw mcp configure docs --timeout 20 --connect-timeout 5 --include 'search,read_*'
openclaw mcp configure docs --auth oauth --oauth-scope 'docs.read'
openclaw mcp login docs
openclaw mcp logout docs
openclaw mcp unset context7
```

### 常見伺服器設定範例

這些範例只會儲存伺服器定義。之後執行 `openclaw mcp doctor --probe`，以確認伺服器能啟動並公開工具。

<Tabs>
  <Tab title="檔案系統">
    ```bash
    openclaw mcp add files \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-filesystem \
      --arg "$HOME/Documents" \
      --include 'read_file,list_directory,search_files'
    openclaw mcp doctor files --probe
    ```

    將檔案系統伺服器的範圍限制在代理程式應讀取或編輯的最小目錄樹。

  </Tab>
  <Tab title="記憶體">
    ```bash
    openclaw mcp add memory \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-memory
    openclaw mcp probe memory --json
    ```

    如果伺服器公開了不應讓一般代理程式使用的寫入工具，請使用工具篩選器。

  </Tab>
  <Tab title="本機指令碼">
    ```bash
    openclaw mcp add local-tools \
      --command node \
      --arg ./dist/mcp-server.js \
      --cwd /srv/openclaw-tools \
      --env API_BASE=https://internal.example
    openclaw mcp status --verbose
    ```

    `doctor` 會檢查 `cwd` 是否存在，以及該命令能否從已設定的環境中解析。

  </Tab>
  <Tab title="遠端 HTTP">
    ```bash
    openclaw mcp add docs \
      --url https://mcp.example.com/mcp \
      --transport streamable-http \
      --auth oauth \
      --oauth-scope docs.read \
      --timeout 20 \
      --connect-timeout 5 \
      --include 'search,read_*'
    openclaw mcp doctor docs --probe
    ```

    遠端伺服器支援 OAuth 時，請使用 OAuth。如果伺服器需要靜態標頭，請避免提交明文 Bearer 權杖。

  </Tab>
  <Tab title="桌面/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,get_window_state,click,type_text'
    openclaw mcp doctor cua-driver --probe
    ```

    直接控制桌面的伺服器會繼承其啟動程序的權限。請使用嚴格的工具篩選器與作業系統層級的權限提示。

  </Tab>
</Tabs>

### JSON 輸出格式

指令碼與儀表板請使用 `--json`。欄位集合可能會隨時間增加，因此使用端應忽略未知的鍵。

<AccordionGroup>
  <Accordion title="status --json">
    ```json
    {
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "configured": true,
          "enabled": true,
          "ok": true,
          "transport": "streamable-http",
          "launch": "streamable-http https://mcp.example.com/mcp",
          "auth": "oauth",
          "authStatus": {
            "hasTokens": true,
            "requiresAuthorization": false,
            "hasClientInformation": true,
            "hasCodeVerifier": false,
            "hasDiscoveryState": true,
            "hasLastAuthorizationUrl": false
          },
          "requestTimeoutMs": 20000,
          "connectionTimeoutMs": 5000,
          "toolFilter": {
            "include": ["search", "read_*"],
            "exclude": []
          },
          "supportsParallelToolCalls": true
        }
      ]
    }
    ```
  </Accordion>
  <Accordion title="doctor --json">
    ```json
    {
      "ok": true,
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "ok": true,
          "issues": [
            {
              "level": "warning",
              "message": "OAuth 認證資訊尚未授權；請執行 openclaw mcp login docs"
            }
          ]
        }
      ]
    }
    ```

    當任何已啟用且受檢查的伺服器出現 `error` 層級的問題時，`doctor --json` 會以非零狀態結束。`warning` 與 `info` 問題會回報，但本身不會導致命令失敗。

  </Accordion>
  <Accordion title="probe --json">
    ```json
    {
      "generatedAt": "2026-05-31T09:00:00.000Z",
      "servers": {
        "docs": {
          "launch": "streamable-http https://mcp.example.com/mcp",
          "tools": 2,
          "resources": true,
          "listChanged": {
            "tools": true,
            "resources": false,
            "prompts": false
          }
        }
      },
      "tools": ["docs__read_page", "docs__search"],
      "diagnostics": []
    }
    ```

    `probe --json` 會開啟即時 MCP 用戶端工作階段，並直接列印其結果；與 `status`/`doctor` 不同，輸出沒有頂層 `path` 欄位。只有在伺服器確實宣告該功能時，才會出現 `resources` 與 `prompts` 鍵（沒有提示功能的伺服器會省略 `prompts` 鍵，而不是回報 `false`）。請使用 `probe` 證明連線能力與功能，不要用於靜態設定稽核。

  </Accordion>
</AccordionGroup>

設定格式範例：

```json
{
  "mcp": {
    "servers": {
      "context7": {
        "command": "uvx",
        "args": ["context7-mcp"]
      },
      "docs": {
        "url": "https://mcp.example.com",
        "transport": "streamable-http",
        "requestTimeoutMs": 20000,
        "connectionTimeoutMs": 5000,
        "supportsParallelToolCalls": true,
        "auth": "oauth",
        "oauth": {
          "scope": "docs.read"
        },
        "sslVerify": true,
        "clientCert": "/path/to/client.crt",
        "clientKey": "/path/to/client.key",
        "toolFilter": {
          "include": ["search_*"],
          "exclude": ["admin_*"]
        }
      }
    }
  }
}
```

### Stdio 傳輸

啟動本機子程序，並透過 stdin/stdout 通訊。

| 欄位                       | 說明                         |
| -------------------------- | --------------------------------- |
| `command`                  | 要啟動的可執行檔（必填）     |
| `args`                     | 命令列引數陣列                 |
| `env`                      | 額外的環境變數                 |
| `cwd` / `workingDirectory` | 程序的工作目錄                 |

<Warning>
**Stdio 環境變數安全篩選器**

OpenClaw 在啟動 stdio MCP 伺服器前，會拒絕直譯器啟動、載入器劫持及 shell 初始化環境變數鍵，即使它們出現在伺服器的 `env` 區塊中也是如此。這會採用與其他由 OpenClaw 啟動之程序相同的主機環境安全政策：封鎖已知的直譯器啟動掛鉤（例如 `NODE_OPTIONS`、`PYTHONSTARTUP`、`PERL5OPT`、`RUBYOPT`、`BASHOPTS`、`KSH_ENV`）、共享程式庫與函式注入前綴（`DYLD_*`、`LD_*`、`BASH_FUNC_*`），以及類似的執行階段控制變數。啟動時會靜默捨棄這些變數並記錄警告，使其無法注入隱含前置程式碼、替換直譯器、啟用偵錯工具，或劫持 stdio 程序的動態連結器。明確的允許清單可讓一般 MCP 認證資訊環境變數繼續使用（`GITHUB_TOKEN`、`GH_TOKEN`、`GITLAB_TOKEN`、`NPM_TOKEN`、`NODE_AUTH_TOKEN`、`DATABASE_URL`、`MONGODB_URI`、`REDIS_URL`、`AMQP_URL`、`AWS_ACCESS_KEY_ID`、`AWS_SECRET_ACCESS_KEY`、`AWS_SESSION_TOKEN`、`AZURE_CLIENT_ID`、`AZURE_CLIENT_SECRET`），以及一般 Proxy 和伺服器專用環境變數（`HTTP_PROXY`、自訂 `*_API_KEY` 等）。其他 `AWS_*` 鍵（例如 `AWS_CONFIG_FILE` 與 `AWS_SHARED_CREDENTIALS_FILE`）仍會遭到封鎖，因為它們指向認證資訊檔案，而不是直接承載認證資訊值。

如果你的 MCP 伺服器確實需要其中一個遭封鎖的變數，請在閘道主機程序上設定，而不要設於 stdio 伺服器的 `env` 下。
</Warning>

### SSE / HTTP 傳輸

透過 HTTP Server-Sent Events 連線至遠端 MCP 伺服器。

| 欄位                        | 說明                                                             |
| --------------------------- | ---------------------------------------------------------------- |
| `url`                       | 遠端伺服器的 HTTP 或 HTTPS URL（必填）                           |
| `headers`                   | 選用的 HTTP 標頭鍵值對映射（例如驗證權杖）                       |
| `connectionTimeoutMs`       | 每部伺服器的連線逾時，以毫秒為單位（選填）                       |
| `requestTimeoutMs`          | 每部伺服器的 MCP 請求逾時，以毫秒為單位                          |
| `auth: "oauth"`             | 使用由 `openclaw mcp login` 儲存的 MCP OAuth 認證資訊            |
| `sslVerify`                 | 僅針對明確信任的私人 HTTPS 端點設為 false                        |
| `clientCert` / `clientKey`  | mTLS 用戶端憑證與金鑰路徑                                        |
| `supportsParallelToolCalls` | 提示此伺服器可安全執行並行呼叫                                   |

範例：

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "auth": "oauth",
        "requestTimeoutMs": 20000,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

`url`（使用者資訊）與 `headers` 中的敏感值會在記錄與狀態輸出中遮蔽。當疑似敏感的 `headers` 或 `env` 項目包含明文值時，`openclaw mcp doctor` 會發出警告，讓操作人員能將這些值移出已提交的設定。

### OAuth 工作流程

OAuth 適用於宣告 MCP OAuth 流程的 HTTP MCP 伺服器。啟用 `auth: "oauth"` 時，該伺服器的靜態 `Authorization` 標頭會被忽略。由 `openclaw mcp login` 儲存的認證資訊可用於嵌入式 MCP、命令列介面執行器與本機 Codex 應用程式伺服器。

原生 MCP OAuth 工作階段儲存在 `<state-dir>/state/openclaw.sqlite`（`mcp_oauth_stores`）中僅限擁有者存取的共享 SQLite 資料庫。資料列可包含存取與重新整理權杖、動態用戶端註冊密鑰、探索中繼資料，以及暫時的 PKCE 驗證器。重新整理、登入與登出會使用相同的 SQLite 租約，因此並行的 OpenClaw 程序無法同時消耗同一個重新整理權杖，也無法讓已登出的工作階段復原。

從已淘汰的 `<state-dir>/mcp-oauth/*.json` 儲存區升級，只能由 `openclaw doctor --fix` 處理。執行階段程式碼絕不會讀取、寫入這些檔案，或退回使用它們。

在認證資訊可用之前，OpenClaw 只會從代理程式執行階段中略過該 MCP 伺服器，而不會讓代理程式回合失敗。操作人員或具有 shell 存取權的代理程式之後可以執行 `openclaw mcp login <name>`，並在後續回合中使用該伺服器。

如果伺服器以 `insufficient_scope` 拒絕權杖，OpenClaw 會保留要求的範圍，並要求執行 `openclaw mcp login <name>`，而不會重複執行無法授予新範圍的重新整理。該登入會啟動新的授權要求，同時保留先前的權杖，直到替代認證資訊儲存完成。

當遠端 MCP 服務已由另一個具備重新整理功能的 OpenClaw 驗證設定檔支援時，可以選擇設定 `oauth.authProfileId`。OpenClaw 會在投影至執行階段前重新整理任一認證資訊來源，並只將目前的存取權杖傳遞給下游 MCP 用戶端。

<Steps>
  <Step title="儲存伺服器">
    使用 `auth: "oauth"` 及任何選用的 OAuth 中繼資料新增或更新伺服器。

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

    若要使用由認證設定檔支援的 bearer，請儲存設定檔繫結：

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"authProfileId":"docs:mcp"}}'
    ```

  </Step>
  <Step title="開始登入">
    執行登入以建立授權要求。

    ```bash
    openclaw mcp login docs
    ```

    OpenClaw 會印出授權 URL，並將暫時的 OAuth 驗證器狀態儲存在共用 SQLite 中。

  </Step>
  <Step title="使用代碼完成">
    在瀏覽器中核准後，將傳回的代碼交回 OpenClaw。

    ```bash
    openclaw mcp login docs --code abc123
    ```

  </Step>
  <Step title="檢查授權">
    使用狀態或 doctor 確認權杖存在且不需要額外授權。如果狀態回報 `authorization-required`，或 doctor 要求額外授權，請再次執行 `openclaw mcp login <name>`。

    ```bash
    openclaw mcp status --verbose
    openclaw mcp doctor docs --probe
    ```

  </Step>
  <Step title="清除認證資訊">
    登出會移除已儲存的 OAuth 認證資訊，但保留已儲存的伺服器定義。

    ```bash
    openclaw mcp logout docs
    ```

  </Step>
</Steps>

如果提供者輪替權杖或授權狀態卡住，請執行 `openclaw mcp logout <name>`，然後重複 `login`。即使 `auth: "oauth"` 已從設定中移除，只要伺服器名稱和 URL 仍可識別認證資訊儲存區項目，`logout` 仍可清除已儲存 HTTP 伺服器的認證資訊。

### 可串流 HTTP 傳輸

`streamable-http` 是與 `sse` 和 `stdio` 並列的額外傳輸選項。它使用 HTTP 串流與遠端 MCP 伺服器進行雙向通訊。

| 欄位                       | 說明                                                                            |
| --------------------------- | -------------------------------------------------------------------------------------- |
| `url`                       | 遠端伺服器的 HTTP 或 HTTPS URL（必填）                                      |
| `transport`                 | 設為 `"streamable-http"` 以選取此傳輸；省略時，OpenClaw 使用 `sse` |
| `headers`                   | 選用的 HTTP 標頭鍵值對映射（例如驗證權杖）                       |
| `connectionTimeoutMs`       | 每部伺服器的連線逾時，單位為 ms（選用）                                         |
| `requestTimeoutMs`          | 每部伺服器的 MCP 要求逾時，單位為毫秒                                         |
| `auth: "oauth"`             | 使用由 `openclaw mcp login` 儲存的 MCP OAuth 認證資訊                                |
| `sslVerify`                 | 僅對明確信任的私人 HTTPS 端點設為 false                          |
| `clientCert` / `clientKey`  | mTLS 用戶端憑證與金鑰路徑                                                  |
| `supportsParallelToolCalls` | 指示此伺服器可安全進行並行呼叫                                    |

OpenClaw 設定使用 `transport: "streamable-http"` 作為標準拼法。透過 `openclaw mcp set` 儲存時，會接受命令列介面原生 MCP 的 `type: "http"` 值，且現有設定中的值會由 `openclaw doctor --fix` 修復；但內嵌的 OpenClaw 直接使用的是 `transport`。

範例：

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectionTimeoutMs": 10000,
        "requestTimeoutMs": 30000,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

<Note>
登錄命令不會啟動頻道橋接。只有 `probe` 和 `doctor --probe` 會開啟即時 MCP 用戶端工作階段，以證明目標伺服器可連線。
</Note>

## 控制介面

瀏覽器控制介面在 `/settings/mcp` 提供專用的 MCP 設定頁面；先前的 `/mcp` 路徑仍作為別名保留。此頁面顯示已設定伺服器數量、已啟用/OAuth/篩選摘要、各伺服器的傳輸列、啟用/停用控制項、常用命令列介面命令，以及 `mcp` 設定區段的限定範圍編輯器。

使用此頁面進行操作員編輯和快速盤點。需要即時伺服器證明時，請使用 `openclaw mcp doctor --probe` 或 `openclaw mcp probe`。

操作員工作流程：

1. 開啟控制介面並選擇 **MCP**。
2. 檢視摘要卡片中的伺服器總數、已啟用、OAuth 和已篩選伺服器。
3. 使用每個伺服器列檢視傳輸、驗證、篩選器、逾時和命令提示。
4. 如果想保留定義但將其排除於執行階段探索之外，請切換啟用狀態。
5. 編輯限定範圍的 `mcp` 設定區段，以進行新增伺服器、標頭、TLS、OAuth 中繼資料或工具篩選器等結構性變更。
6. 選擇 **Save** 僅保存設定，或選擇 **Save & Publish** 透過閘道設定路徑套用。
7. 需要即時證明已編輯的伺服器可啟動並列出工具時，請執行 `openclaw mcp doctor --probe`。

注意事項：

- 命令片段會為伺服器名稱加上引號，讓特殊名稱仍可複製到 shell 中
- 顯示的類 URL 值若包含內嵌認證資訊，會在呈現前遮蔽
- 此頁面本身不會啟動 MCP 傳輸
- 視擁有 MCP 用戶端的程序而定，作用中的執行階段可能需要 `openclaw mcp reload`、發布閘道設定或重新啟動程序

## MCP Apps

OpenClaw 可呈現實作穩定版 [MCP Apps 擴充功能](https://modelcontextprotocol.io/extensions/apps)的工具。Apps 預設不啟用，因為其 HTML 來自已設定的 MCP 伺服器，並且可向同一部伺服器要求 Apps 可見的工具或資源。

啟用主機橋接：

```bash
openclaw config set mcp.apps.enabled true --strict-json
```

變更此設定後，請重新啟動閘道。啟用後，OpenClaw 會在閘道連接埠加一的連接埠上啟動僅限沙箱的 HTTP(S) 接聽器（預設閘道為 `18790`）。控制介面會從該獨立來源載入 Apps；此接聽器絕不提供控制介面、已驗證的閘道路由或使用者資料。

直接閘道連線需要能存取兩個連接埠。如果反向 Proxy 或 TLS 終止器公開控制介面，請為 Apps 提供專用的公開來源，並僅將該來源 Proxy 至沙箱接聽器：

```json5
{
  mcp: {
    apps: {
      enabled: true,
      sandboxOrigin: "https://mcp-apps.example.com",
      sandboxPort: 18790,
    },
  },
}
```

沙箱來源必須與控制介面來源不同。請勿在其上託管其他已驗證或敏感內容。

例如，官方基本 React 示範可設定如下：

```json5
{
  mcp: {
    apps: { enabled: true },
    servers: {
      "basic-react": {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-basic-react", "--stdio"],
      },
    },
  },
}
```

行為與安全界線：

- OpenClaw 僅在 Apps 已啟用時公告 `io.modelcontextprotocol/ui` 擴充功能。
- 僅呈現 MIME 類型完全符合 `text/html;profile=mcp-app` 的 `ui://` 資源。
- UI 資源上限為 2 MiB，置於專用外層來源上的雙 iframe Proxy 後方，載入至不透明的內層 App 來源，並受到依資源中繼資料衍生的 CSP 限制。
- 僅供 App 使用的工具（`_meta.ui.visibility: ["app"]`）不會出現在模型工具清單中。Apps 只能呼叫其所屬伺服器上對 App 可見，且同時通過建立該檢視之執行作業的有效 OpenClaw 工具原則的工具。
- 當內層 App 文件使用不透明來源進行跨 App 隔離時，不會授予相機、麥克風和地理位置等與來源綁定的 App 權限。
- App HTML、完整工具引數和原始結果會保留在有界限的十分鐘記憶體內檢視租約中，不會寫入磁碟或複製到逐字記錄預覽中繼資料。逐字記錄僅儲存與原始工具呼叫 ID 綁定的有界限伺服器/工具/資源描述元。閘道重新啟動後，控制介面可根據已驗證的工作階段逐字記錄確認該描述元，並重新擷取 `ui://` 資源；在新的執行作業建立目前工具權限前，重建的檢視為唯讀。
- 在頻道對話中，一個回合內最新成功的 App 檢視會在最終助理回覆中加入一個 **Open App** 樣式的動作。Telegram 私訊使用原生 Mini App 按鈕；Slack 和 Discord 將相同的可攜式動作呈現為連結。其他頻道保留原始回覆文字，並附加可理解的 HTTPS 連結。
- 只有在閘道 Tailscale 公開方式已準備好已發布的 HTTPS 來源時，頻道啟動連結才可使用。`gateway.tailscale.mode: "serve"` 只能從 tailnet 存取；`"funnel"` 可從公用網際網路存取。由 `gateway.tailscale.preserveFunnel` 保留的外部管理 Funnel 也視為可從網際網路存取。請參閱 [Tailscale](/zh-TW/gateway/tailscale)。
- 啟動票證是不透明的，僅在具體化最終頻道回覆時鑄造，並會在最多兩分鐘後或基礎檢視租約到期時失效，以較早者為準。URL 不包含閘道 bearer 認證資訊、工作階段金鑰、檢視中繼資料、App HTML、工具輸入或工具結果。
- 如果沒有可用的已發布來源或票證容量、檢視或票證已到期，或傳輸無法呈現原生控制項，原始助理文字仍可使用。控制介面會保留其現有的行內 App 畫布，且不會收到重複的啟動動作。
- `openclaw security audit` 會在橋接啟用時發出警告。不需要時，請使用 `openclaw config set mcp.apps.enabled false --strict-json` 將其停用。

## 目前限制

本頁記錄目前已發布橋接的行為。

目前限制：

- 對話探索依賴現有的閘道工作階段路由中繼資料
- 除了 Claude 專用轉接器之外，沒有通用的推送通訊協定
- 目前尚無訊息編輯或回應工具
- HTTP/SSE/streamable-http 傳輸會連線至單一遠端伺服器；目前尚無多工上游
- `permissions_list_open` 僅包含橋接連線期間觀察到的核准

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [外掛](/zh-TW/cli/plugins)
