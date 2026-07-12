---
read_when:
    - 將 Codex、Claude Code 或其他 MCP 用戶端連線至 OpenClaw 支援的頻道
    - 正在執行 `openclaw mcp serve`
    - 管理 OpenClaw 儲存的 MCP 伺服器定義
sidebarTitle: MCP
summary: 透過 MCP 公開 OpenClaw 頻道對話，並管理已儲存的 MCP 伺服器定義
title: MCP
x-i18n:
    generated_at: "2026-07-12T14:23:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 5753ffb716794edcdfa2c3cdd370bd33173b6d30785f135e84933dcd628bbe54
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` 有兩項工作：

- 使用 `openclaw mcp serve` 將 OpenClaw 作為 MCP 伺服器執行
- 使用 `list`、`show`、`status`、`doctor`、`probe`、`add`、`set`、`configure`、`tools`、`login`、`logout`、`reload` 和 `unset`，管理由 OpenClaw 管理的對外 MCP 伺服器定義

`serve` 是由 OpenClaw 充當 MCP 伺服器。其他子命令則是由 OpenClaw 充當 MCP 用戶端登錄庫，供其自身執行階段稍後使用其中的伺服器。

<Note>
  `list`、`show`、`set` 和 `unset` 只會讀寫 OpenClaw 設定中由 OpenClaw 管理的 `mcp.servers` 項目。它們不包含 `config/mcporter.json` 中的 mcporter 伺服器；請使用 `mcporter list` 查看該登錄庫。
</Note>

當 OpenClaw 應自行託管程式設計工具鏈工作階段，並透過 ACP 路由該執行階段時，請使用 [`openclaw acp`](/zh-TW/cli/acp)。

## 選擇正確的 MCP 路徑

| 目標                                                                | 使用                                                                  | 原因                                                                                                             |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 讓外部 MCP 用戶端讀取／傳送 OpenClaw 頻道對話 | `openclaw mcp serve`                                                 | OpenClaw 是 MCP 伺服器，並透過 stdio 公開以閘道為後端的對話。                                 |
| 儲存第三方 MCP 伺服器，供 OpenClaw 管理的代理程式執行使用        | `openclaw mcp add`、`set`、`configure`、`tools`、`login`             | OpenClaw 是 MCP 用戶端登錄庫，之後會將這些伺服器投射到符合資格的執行階段。               |
| 在不執行代理程式回合的情況下檢查已儲存的伺服器                  | `openclaw mcp status`、`doctor`、`probe`                             | `status` 和 `doctor` 會檢查設定；`probe` 會開啟即時 MCP 連線並列出功能。               |
| 從瀏覽器編輯 MCP 設定                                      | 控制介面 `/settings/mcp`（別名 `/mcp`）                            | 此頁面會顯示清單、啟用狀態、OAuth／篩選摘要、命令提示，以及限定範圍的 `mcp` 編輯器。         |
| 為 Codex app-server 提供限定範圍的原生 MCP 伺服器                    | `mcp.servers.<name>.codex`                                           | `codex` 區塊只會影響 Codex app-server 執行緒投射，並會在移交原生設定前移除。 |
| 執行由 ACP 託管的工具鏈工作階段                                     | [`openclaw acp`](/zh-TW/cli/acp) 和 [ACP 代理程式](/zh-TW/tools/acp-agents-setup) | ACP 橋接模式不接受個別工作階段的 MCP 伺服器注入；請改為設定閘道／外掛橋接。     |

<Tip>
如果你不確定需要哪一條路徑，請先使用 `openclaw mcp status --verbose`。它會顯示 OpenClaw 已儲存的內容，而不會啟動任何 MCP 伺服器。
</Tip>

## 將 OpenClaw 作為 MCP 伺服器

這是 `openclaw mcp serve` 路徑。

### 何時使用 serve

請在以下情況使用 `openclaw mcp serve`：

- Codex、Claude Code 或其他 MCP 用戶端應直接與由 OpenClaw 支援的頻道對話通訊
- 你已有具備路由工作階段的本機或遠端 OpenClaw 閘道
- 你想要一個可跨 OpenClaw 頻道後端運作的 MCP 伺服器，而不是為每個頻道分別執行橋接

如果 OpenClaw 應自行託管程式設計執行階段，並將代理程式工作階段保留在 OpenClaw 中，請改用 [`openclaw acp`](/zh-TW/cli/acp)。

### 運作方式

`openclaw mcp serve` 會啟動 stdio MCP 伺服器。MCP 用戶端擁有該程序。當用戶端保持 stdio 工作階段開啟時，橋接器會透過 WebSocket 連線至本機或遠端 OpenClaw 閘道，並透過 MCP 公開已路由的頻道對話。

<Steps>
  <Step title="用戶端啟動橋接器">
    MCP 用戶端會啟動 `openclaw mcp serve`。
  </Step>
  <Step title="橋接器連線至閘道">
    橋接器會透過 WebSocket 連線至 OpenClaw 閘道。
  </Step>
  <Step title="工作階段成為 MCP 對話">
    已路由的工作階段會成為 MCP 對話及逐字記錄／歷程工具。
  </Step>
  <Step title="即時事件排入佇列">
    橋接器連線期間，即時事件會排入記憶體中的佇列。
  </Step>
  <Step title="選用的 Claude 推播">
    如果已啟用 Claude 頻道模式，同一工作階段也可以接收 Claude 專屬推播通知。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="重要行為">
    - 即時佇列狀態會在橋接器連線時開始
    - 使用 `messages_read` 讀取較舊的逐字記錄歷程
    - Claude 推播通知只會在 MCP 工作階段存續期間存在
    - 用戶端中斷連線時，橋接器會結束，而即時佇列也會消失
    - `openclaw agent` 和 `openclaw infer model run` 等單次代理程式進入點，會在回覆完成時終止其開啟的任何內建 MCP 執行階段，因此重複的指令碼執行不會累積 stdio MCP 子程序
    - OpenClaw 啟動的 stdio MCP 伺服器（無論是內建或使用者設定）會在關閉時以程序樹為單位終止，因此伺服器啟動的子程序不會在父 stdio 用戶端結束後繼續存活
    - 刪除或重設工作階段時，會透過共用執行階段清理路徑處置該工作階段的 MCP 用戶端，因此不會有與已移除工作階段繫結的 stdio 連線殘留

  </Accordion>
</AccordionGroup>

### 選擇用戶端模式

<Tabs>
  <Tab title="一般 MCP 用戶端">
    僅提供標準 MCP 工具。請使用 `conversations_list`、`messages_read`、`events_poll`、`events_wait`、`messages_send` 和核准工具。
  </Tab>
  <Tab title="Claude Code">
    提供標準 MCP 工具及 Claude 專屬頻道配接器。啟用 `--claude-channel-mode on`，或保留預設值 `auto`。
  </Tab>
</Tabs>

<Note>
目前，`auto` 的行為與 `on` 相同。尚未提供用戶端功能偵測。
</Note>

### serve 公開的內容

橋接器使用現有的閘道工作階段路由中繼資料，公開由頻道支援的對話。當 OpenClaw 已有具備已知路由的工作階段狀態時，就會出現對話，例如：

- `channel`
- 收件者或目的地中繼資料
- 選用的 `accountId`
- 選用的 `threadId`

這讓 MCP 用戶端可在同一處：

- 列出最近已路由的對話
- 讀取最近的逐字記錄歷程
- 等待新的傳入事件
- 透過相同路由傳送回覆
- 查看橋接器連線期間收到的核准要求

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

### 橋接工具

<AccordionGroup>
  <Accordion title="conversations_list">
    列出閘道工作階段狀態中已有路由中繼資料的近期工作階段型對話。

    篩選條件：`limit`（上限 500）、`search`、`channel`、`includeDerivedTitles`、`includeLastMessage`。

  </Accordion>
  <Accordion title="conversation_get">
    使用直接的閘道工作階段查詢，依 `session_key` 傳回一個對話。
  </Accordion>
  <Accordion title="messages_read">
    讀取一個工作階段型對話最近的逐字記錄訊息。`limit` 預設為 20，上限為 200。
  </Accordion>
  <Accordion title="attachments_fetch">
    從一則逐字記錄訊息中擷取非文字訊息內容區塊。這是逐字記錄內容的中繼資料檢視，而不是獨立且持久的附件 Blob 儲存區。
  </Accordion>
  <Accordion title="events_poll">
    讀取自數字游標之後排入佇列的即時事件。`limit` 上限為 200。
  </Accordion>
  <Accordion title="events_wait">
    長輪詢直到下一個相符的佇列事件到達或逾時（預設 30s，上限 300s）。

    當一般 MCP 用戶端需要近乎即時的傳遞，但不使用 Claude 專屬推播協定時，請使用此工具。

  </Accordion>
  <Accordion title="messages_send">
    透過工作階段上已記錄的相同路由傳回文字。

    目前行為：

    - 需要現有的對話路由
    - 使用工作階段的頻道、收件者、帳戶 ID 和討論串 ID
    - 僅傳送文字

  </Accordion>
  <Accordion title="permissions_list_open">
    列出橋接器自連線至閘道後觀察到的待處理執行／外掛核准要求。
  </Accordion>
  <Accordion title="permissions_respond">
    使用下列其中一項結果，解決一個待處理的執行／外掛核准要求：

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### 事件模型

橋接器在連線期間會保留記憶體內事件佇列。

目前的事件類型：

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- 此佇列僅限即時事件；它會在 MCP 橋接器啟動時開始
- `events_poll` 和 `events_wait` 本身不會重播較舊的閘道歷程
- 持久保存的待處理訊息應使用 `messages_read` 讀取

</Warning>

### Claude 頻道通知

橋接器也可以公開 Claude 專屬頻道通知。這相當於 OpenClaw 的 Claude Code 頻道配接器：標準 MCP 工具仍然可用，但即時傳入訊息也可以 Claude 專屬 MCP 通知的形式抵達。

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`：僅提供標準 MCP 工具。
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

- 傳入的 `user` 逐字記錄訊息會轉送為 `notifications/claude/channel`
- 透過 MCP 收到的 Claude 權限要求會在記憶體中追蹤
- 如果已連結對話中的命令擁有者之後傳送 `yes <id>` 或 `no <id>`（`<id>` 是不含 `l` 的 5 個字母要求 ID），橋接器會將其轉換為 `notifications/claude/channel/permission`
- 這些通知僅限即時工作階段；如果 MCP 用戶端中斷連線，就沒有推播目標

這是刻意針對特定用戶端設計的行為。一般 MCP 用戶端應使用標準輪詢工具。

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

對大多數一般 MCP 用戶端，請先使用標準工具介面並忽略 Claude 模式。只有在用戶端確實理解 Claude 專屬通知方法時，才開啟 Claude 模式。

### 選項

`openclaw mcp serve` 支援：

<ParamField path="--url" type="string">
  閘道 WebSocket URL。設定時預設使用 `gateway.remote.url`。
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
  在 stderr 輸出詳細日誌。
</ParamField>

<Tip>
可行時，請優先使用 `--token-file` 或 `--password-file`，而非內嵌祕密資訊。
</Tip>

### 安全性與信任邊界

橋接器不會自行建立路由。它只會公開閘道已經知道如何路由的對話。

這表示：

- 傳送者允許清單、配對及頻道層級信任仍由底層 OpenClaw 頻道設定負責
- `messages_send` 只能透過現有的已儲存路由回覆
- 核准狀態僅存在於目前橋接工作階段的即時記憶體中
- 橋接器驗證應使用你信任且可供任何其他遠端閘道用戶端使用的相同閘道權杖或密碼控制

如果 `conversations_list` 中缺少某個對話，通常原因並非 MCP 設定，而是底層閘道工作階段中的路由中繼資料缺失或不完整。

### 測試

OpenClaw 為此橋接器提供確定性的 Docker 冒煙測試：

```bash
pnpm test:docker:mcp-channels
```

此冒煙測試會執行單一容器：植入對話狀態、啟動閘道，接著以 stdio 子處理程序產生 `openclaw mcp serve`，並將其作為 MCP 用戶端驅動。它會透過實際的 stdio MCP 橋接器，驗證對話探索、逐字記錄讀取、附件中繼資料讀取、即時事件佇列行為，以及 Claude 風格的頻道與權限通知。輸出傳送路由（`messages_send` 重複使用已儲存的對話路由）則由 `src/mcp/channel-server.test.ts` 中的單元測試另行涵蓋。

這是在測試執行中不必連接真實 Telegram、Discord 或 iMessage 帳號，即可證明橋接器運作正常的最快方式。

如需更完整的測試背景資訊，請參閱[測試](/zh-TW/help/testing)。

### 疑難排解

<AccordionGroup>
  <Accordion title="未傳回任何對話">
    通常表示閘道工作階段尚無法路由。請確認底層工作階段已儲存頻道／供應商、收件者，以及選用的帳號／討論串路由中繼資料。
  </Accordion>
  <Accordion title="events_poll 或 events_wait 遺漏較舊的訊息">
    這是預期行為。即時佇列會在橋接器連線時開始運作。請使用 `messages_read` 讀取較舊的逐字記錄歷程。
  </Accordion>
  <Accordion title="未顯示 Claude 通知">
    請檢查下列所有項目：

    - 用戶端持續開啟 stdio MCP 工作階段
    - `--claude-channel-mode` 為 `on` 或 `auto`
    - 用戶端確實支援 Claude 專用通知方法
    - 輸入訊息是在橋接器連線之後才發生

  </Accordion>
  <Accordion title="缺少核准項目">
    `permissions_list_open` 只會顯示橋接器連線期間觀察到的核准請求。它不是持久化的核准歷程 API。
  </Accordion>
</AccordionGroup>

## 將 OpenClaw 作為 MCP 用戶端登錄檔

這是 `openclaw mcp list`、`show`、`status`、`doctor`、`probe`、`add`、`set`、
`configure`、`tools`、`login`、`logout`、`reload` 與 `unset` 路徑。

這些命令不會透過 MCP 公開 OpenClaw。它們管理 OpenClaw 設定中 `mcp.servers` 下由 OpenClaw 管理的 MCP 伺服器定義。它們不會從 `config/mcporter.json` 讀取 mcporter 伺服器。

這些已儲存的定義供 OpenClaw 稍後啟動或設定的執行環境使用，例如內嵌 OpenClaw 及其他執行環境配接器。OpenClaw 會集中儲存這些定義，因此這些執行環境不必各自維護重複的 MCP 伺服器清單。

<AccordionGroup>
  <Accordion title="重要行為">
    - 這些命令只會讀取或寫入 OpenClaw 設定
    - `status`、`list`、`show`、未指定 `--probe` 的 `doctor`、`set`、`configure`、`tools`、`logout`、`reload` 與 `unset` 不會連線至目標 MCP 伺服器
    - `login` 會對已設定的 HTTP 伺服器執行 MCP OAuth 網路流程，並儲存產生的本機認證資訊
    - `status --verbose` 會輸出已解析的傳輸、驗證、逾時、篩選器及平行工具呼叫提示，而不會建立連線
    - `doctor` 會檢查已儲存的定義是否有本機設定問題，例如缺少 stdio 命令、無效的工作目錄、缺少 TLS 檔案、已停用的伺服器、以常值表示的敏感標頭／環境變數值，以及不完整的 OAuth 授權
    - `doctor --probe` 會在靜態檢查通過後，加入與 `probe` 相同的即時連線證明
    - `probe` 會連線至選取的伺服器或所有已設定的伺服器、列出工具，並回報功能／診斷資訊
    - `add` 會根據旗標建立定義，並在儲存前進行探測，除非已設定 `--no-probe` 或必須先完成 OAuth 授權
    - 執行環境配接器會在執行時決定實際支援哪些傳輸形式
    - `enabled: false` 會保留已儲存的伺服器，但將其排除於內嵌執行環境探索之外
    - `timeout` 與 `connectTimeout` 會分別設定每個伺服器的請求與連線逾時秒數
    - `supportsParallelToolCalls: true` 會標示配接器可並行呼叫的伺服器
    - HTTP 伺服器可使用靜態標頭、OAuth 登入、TLS 驗證控制，以及 mTLS 憑證／金鑰路徑
    - 內嵌 OpenClaw 會在一般 `coding` 與 `messaging` 工具設定檔中公開已設定的 MCP 工具；`minimal` 仍會隱藏這些工具，而 `tools.deny: ["bundle-mcp"]` 會明確停用這些工具
    - 每個伺服器的 `toolFilter.include` 與 `toolFilter.exclude` 會在探索到的 MCP 工具成為 OpenClaw 工具之前加以篩選
    - 宣告資源或提示詞的伺服器也會公開公用工具，以列出／讀取資源及列出／擷取提示詞；這些產生的公用工具名稱（`resources_list`、`resources_read`、`prompts_list`、`prompts_get`）會使用相同的包含／排除篩選器
    - 動態 MCP 工具清單變更會使該工作階段的快取目錄失效；下次探索／使用時會從伺服器重新整理
    - 重複發生 MCP 工具請求／通訊協定失敗時，會暫時停用該伺服器，避免單一故障伺服器耗盡整個回合
    - 工作階段範圍的綑綁 MCP 執行環境會在閒置 `mcp.sessionIdleTtlMs` 毫秒後回收（預設 10 分鐘；設為 `0` 可停用），而單次內嵌執行會在執行結束時清理這些環境

  </Accordion>
</AccordionGroup>

執行環境配接器可將此共用登錄檔正規化為下游用戶端預期的形式。例如，內嵌 OpenClaw 會直接使用 OpenClaw 的 `transport` 值，而 Claude Code 與 Gemini 則會收到命令列介面原生的 `type` 值，例如 `http`、`sse` 或 `stdio`。

Codex app-server 也會採用每個伺服器上的選用 `codex` 區塊。這是
僅供 Codex app-server 討論串使用的 OpenClaw 投影中繼資料；它不會
變更 ACP 工作階段、一般 Codex 控制框架設定或其他執行環境配接器。
使用非空白的 `codex.agents`，可將伺服器僅投影至特定 OpenClaw
代理程式 ID。空的、空白的或無效的代理程式清單會遭設定
驗證拒絕，並由執行環境投影路徑省略，而不會轉為
全域設定。使用 `codex.defaultToolsApprovalMode`（`auto`、`prompt` 或 `approve`）
可為受信任的伺服器輸出 Codex 原生的 `default_tools_approval_mode`。
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
- 未指定名稱的 `show` 會輸出完整的已設定 MCP 伺服器物件。
- `status` 會在不建立連線的情況下分類已設定的傳輸。`--verbose` 會包含已解析的啟動、逾時、OAuth、篩選器及平行呼叫詳細資料。
- `doctor` 會在不建立連線的情況下執行靜態檢查。若命令也應驗證已啟用的伺服器能否連線，請加入 `--probe`。
- `probe` 會建立連線並回報工具數量、資源／提示詞支援、清單變更支援及診斷資訊。
- `add` 接受 stdio 旗標，例如 `--command`、`--arg`、`--env` 與 `--cwd`；或 HTTP 旗標，例如 `--url`、`--transport`、`--header`、`--auth oauth`、TLS、逾時及工具選取旗標。
- `set` 預期在命令列上接收一個 JSON 物件值。
- `configure` 會更新啟用狀態、工具篩選器、逾時、OAuth、TLS 及平行工具呼叫提示，而不會取代整個伺服器定義。加入 `--probe` 可在儲存前驗證更新後的伺服器。
- `tools` 會更新每個伺服器的工具篩選器。包含／排除項目是 MCP 工具名稱及簡單的 `*` glob。
- `login` 會針對設定了 `auth: "oauth"` 的 HTTP 伺服器執行 OAuth 流程。第一次執行會輸出授權 URL；核准後請使用 `--code` 重新執行。
- `logout` 會清除指定伺服器已儲存的 OAuth 認證資訊，但不會移除已儲存的伺服器定義。
- `reload` 只會處置目前命令列介面處理程序中已快取的處理程序內 MCP 執行環境。其他處理程序中的閘道或代理程式處理程序仍需使用各自的重新載入或重新啟動路徑。
- Streamable HTTP MCP 伺服器請使用 `transport: "streamable-http"`。為了相容性，`openclaw mcp set` 也會將命令列介面原生的 `type: "http"` 正規化為相同的標準設定形式。
- 如果指定的伺服器不存在，`unset` 會失敗。

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

這些範例只會儲存伺服器定義。之後請執行 `openclaw mcp doctor --probe`，以證明伺服器能啟動並公開工具。

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

    請將檔案系統伺服器的範圍限制於代理程式應讀取或編輯的最小目錄樹。

  </Tab>
  <Tab title="記憶體">
    ```bash
    openclaw mcp add memory \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-memory
    openclaw mcp probe memory --json
    ```

    如果伺服器公開的寫入工具不應供一般代理程式使用，請使用工具篩選器。

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

    `doctor` 會檢查 `cwd` 是否存在，以及能否從已設定的環境解析命令。

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

    當遠端伺服器支援 OAuth 時，請使用 OAuth。若伺服器需要靜態標頭，請避免提交字面值的持有者權杖。

  </Tab>
  <Tab title="桌面/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,observe,click,type'
    openclaw mcp doctor cua-driver --probe
    ```

    直接控制桌面的伺服器會繼承其啟動程序的權限。請使用範圍嚴格的工具篩選器與作業系統層級的權限提示。

  </Tab>
</Tabs>

### JSON 輸出結構

腳本與儀表板請使用 `--json`。欄位集合可能會隨時間增加，因此使用端應忽略未知的鍵。

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

    當任何已啟用且受檢查的伺服器有 `error` 層級的問題時，`doctor --json` 會以非零狀態結束。系統會回報 `warning` 與 `info` 問題，但這些問題本身不會導致命令失敗。

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

    `probe --json` 會開啟即時 MCP 用戶端工作階段並直接輸出結果；與 `status`/`doctor` 不同，輸出中沒有頂層 `path` 欄位。只有在伺服器實際宣告該功能時，才會出現 `resources` 與 `prompts` 鍵（沒有提示詞功能的伺服器會省略 `prompts` 鍵，而不是回報 `false`）。請使用 `probe` 證明可連線性與功能，不要用於靜態設定稽核。

  </Accordion>
</AccordionGroup>

設定結構範例：

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
        "timeout": 20,
        "connectTimeout": 5,
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

| 欄位                       | 說明                     |
| -------------------------- | ------------------------ |
| `command`                  | 要啟動的執行檔（必填）   |
| `args`                     | 命令列引數陣列           |
| `env`                      | 額外的環境變數           |
| `cwd` / `workingDirectory` | 程序的工作目錄           |

<Warning>
**Stdio 環境變數安全篩選器**

即使直譯器啟動、載入器劫持及殼層初始化環境變數鍵出現在伺服器的 `env` 區塊中，OpenClaw 也會在啟動 stdio MCP 伺服器前拒絕這些鍵。這會使用與其他由 OpenClaw 啟動的程序相同的主機環境安全政策：封鎖已知的直譯器啟動掛鉤（例如 `NODE_OPTIONS`、`PYTHONSTARTUP`、`PERL5OPT`、`RUBYOPT`、`BASHOPTS`、`KSH_ENV`）、共享函式庫與函式注入前綴（`DYLD_*`、`LD_*`、`BASH_FUNC_*`），以及類似的執行階段控制變數。啟動時會無提示地捨棄這些變數並記錄警告，使其無法對 stdio 程序注入隱含的前置程式、替換直譯器、啟用偵錯工具或劫持動態連結器。明確的允許清單讓一般 MCP 認證資訊環境變數仍可使用（`GITHUB_TOKEN`、`GH_TOKEN`、`GITLAB_TOKEN`、`NPM_TOKEN`、`NODE_AUTH_TOKEN`、`DATABASE_URL`、`MONGODB_URI`、`REDIS_URL`、`AMQP_URL`、`AWS_ACCESS_KEY_ID`、`AWS_SECRET_ACCESS_KEY`、`AWS_SESSION_TOKEN`、`AZURE_CLIENT_ID`、`AZURE_CLIENT_SECRET`），一般代理伺服器和伺服器專用的環境變數（`HTTP_PROXY`、自訂 `*_API_KEY` 等）也可使用。`AWS_CONFIG_FILE` 和 `AWS_SHARED_CREDENTIALS_FILE` 等其他 `AWS_*` 鍵仍會被封鎖，因為它們指向認證資訊檔案，而非直接攜帶認證資訊值。

如果你的 MCP 伺服器確實需要其中一個被封鎖的變數，請在閘道主機程序上設定，而不是放在 stdio 伺服器的 `env` 下。
</Warning>

### SSE / HTTP 傳輸

透過 HTTP 伺服器傳送事件連線至遠端 MCP 伺服器。

| 欄位                           | 說明                                                      |
| ------------------------------ | --------------------------------------------------------- |
| `url`                          | 遠端伺服器的 HTTP 或 HTTPS URL（必填）                    |
| `headers`                      | 選用的 HTTP 標頭鍵值對映（例如驗證權杖）                  |
| `connectionTimeoutMs`          | 每部伺服器的連線逾時時間，單位為毫秒（選用）              |
| `connectTimeout`               | 每部伺服器的連線逾時時間，單位為秒（選用）                |
| `timeout` / `requestTimeoutMs` | 每部伺服器的 MCP 請求逾時時間，單位為秒或毫秒             |
| `auth: "oauth"`                | 使用由 `openclaw mcp login` 儲存的 MCP OAuth 認證資訊      |
| `sslVerify`                    | 僅針對明確信任的私人 HTTPS 端點設為 false                 |
| `clientCert` / `clientKey`     | mTLS 用戶端憑證與金鑰路徑                                 |
| `supportsParallelToolCalls`    | 提示此伺服器可安全地進行並行呼叫                          |

範例：

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "auth": "oauth",
        "timeout": 20,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

`url`（使用者資訊）與 `headers` 中的敏感值會在記錄與狀態輸出中遮蔽。當看似敏感的 `headers` 或 `env` 項目包含字面值時，`openclaw mcp doctor` 會發出警告，讓操作人員能將這些值移出已提交的設定。

### OAuth 工作流程

OAuth 適用於宣告 MCP OAuth 流程的 HTTP MCP 伺服器。啟用 `auth: "oauth"` 時，該伺服器的靜態 `Authorization` 標頭會被忽略。由 `openclaw mcp login` 儲存的認證資訊可搭配嵌入式 MCP、命令列介面執行器與本機 Codex 應用程式伺服器使用。

在認證資訊可用之前，OpenClaw 只會從代理程式執行階段中省略該 MCP 伺服器，而不會導致代理程式回合失敗。之後，操作人員或具有殼層存取權的代理程式可以執行 `openclaw mcp login <name>`，並在後續回合使用該伺服器。

當遠端 MCP 服務已由另一個具備重新整理能力的 OpenClaw 驗證設定檔支援時，你可以選擇設定 `oauth.authProfileId`。OpenClaw 會在投影至執行階段前重新整理任一認證資訊來源，並只將目前的存取權杖傳遞給下游 MCP 用戶端。

<Steps>
  <Step title="儲存伺服器">
    使用 `auth: "oauth"` 與任何選用的 OAuth 中繼資料新增或更新伺服器。

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

    若要使用驗證設定檔支援的持有者權杖，請儲存設定檔繫結：

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"authProfileId":"docs:mcp"}}'
    ```

  </Step>
  <Step title="開始登入">
    執行登入以建立授權要求。

    ```bash
    openclaw mcp login docs
    ```

    OpenClaw 會輸出授權 URL，並將暫時的 OAuth 驗證器狀態儲存在 OpenClaw 狀態目錄下。

  </Step>
  <Step title="使用代碼完成">
    在瀏覽器中核准後，將傳回的代碼傳回 OpenClaw。

    ```bash
    openclaw mcp login docs --code abc123
    ```

  </Step>
  <Step title="檢查授權">
    使用狀態或診斷確認權杖已存在。

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

如果提供者輪替權杖或授權狀態卡住，請執行 `openclaw mcp logout <name>`，然後重複 `login`。只要伺服器名稱與 URL 仍可識別認證資訊儲存區項目，即使已從設定中移除 `auth: "oauth"`，`logout` 仍可清除已儲存 HTTP 伺服器的認證資訊。

### 可串流 HTTP 傳輸

`streamable-http` 是與 `sse` 和 `stdio` 並列的額外傳輸選項。它使用 HTTP 串流與遠端 MCP 伺服器進行雙向通訊。

| 欄位                           | 說明                                                                                     |
| ------------------------------ | ---------------------------------------------------------------------------------------- |
| `url`                          | 遠端伺服器的 HTTP 或 HTTPS URL（必填）                                                    |
| `transport`                    | 設為 `"streamable-http"` 以選取此傳輸方式；省略時，OpenClaw 使用 `sse`                    |
| `headers`                      | 選用的 HTTP 標頭鍵值對映射（例如驗證權杖）                                                |
| `connectionTimeoutMs`          | 每個伺服器的連線逾時時間，單位為 ms（選填）                                                |
| `connectTimeout`               | 每個伺服器的連線逾時時間，單位為秒（選填）                                                 |
| `timeout` / `requestTimeoutMs` | 每個伺服器的 MCP 請求逾時時間，單位為秒或 ms                                               |
| `auth: "oauth"`                | 使用由 `openclaw mcp login` 儲存的 MCP OAuth 認證資訊                                      |
| `sslVerify`                    | 只有明確信任的私人 HTTPS 端點才能設為 false                                                |
| `clientCert` / `clientKey`     | mTLS 用戶端憑證與金鑰路徑                                                                 |
| `supportsParallelToolCalls`    | 提示此伺服器可安全執行並行呼叫                                                             |

OpenClaw 設定使用 `transport: "streamable-http"` 作為標準拼法。透過 `openclaw mcp set` 儲存時，接受命令列介面原生的 MCP `type: "http"` 值，且現有設定中的值會由 `openclaw doctor --fix` 修復；但嵌入式 OpenClaw 直接取用的是 `transport`。

範例：

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectTimeout": 10,
        "timeout": 30,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

<Note>
登錄命令不會啟動頻道橋接器。只有 `probe` 和 `doctor --probe` 會開啟即時 MCP 用戶端工作階段，以證明目標伺服器可連線。
</Note>

## 控制介面

瀏覽器控制介面在 `/settings/mcp` 提供專用的 MCP 設定頁面；先前的 `/mcp` 路徑仍保留為別名。此頁面會顯示已設定的伺服器數量、已啟用/OAuth/篩選器摘要、各伺服器的傳輸方式列、啟用/停用控制項、常用命令列介面命令，以及限定於 `mcp` 設定區段的編輯器。

使用此頁面進行操作員編輯及快速盤點。需要即時伺服器證明時，請使用 `openclaw mcp doctor --probe` 或 `openclaw mcp probe`。

操作員工作流程：

1. 開啟控制介面並選擇 **MCP**。
2. 查看摘要卡片中的伺服器總數、已啟用、OAuth 與已篩選數量。
3. 使用各伺服器列查看傳輸方式、驗證、篩選器、逾時與命令提示。
4. 若要保留定義但將其排除於執行階段探索之外，請切換啟用狀態。
5. 編輯限定範圍的 `mcp` 設定區段，以進行新增伺服器、標頭、TLS、OAuth 中繼資料或工具篩選器等結構性變更。
6. 選擇 **Save** 僅保存設定，或選擇 **Save & Publish** 透過閘道設定路徑套用。
7. 需要證明編輯後的伺服器能啟動並列出工具時，請執行 `openclaw mcp doctor --probe`。

注意事項：

- 命令片段會以引號括住伺服器名稱，讓特殊名稱仍可複製到殼層中使用
- 顯示的類 URL 值若包含內嵌認證資訊，會在算繪前遮蔽
- 此頁面本身不會啟動 MCP 傳輸
- 視哪個處理程序擁有 MCP 用戶端而定，作用中的執行階段可能需要執行 `openclaw mcp reload`、發布閘道設定或重新啟動處理程序

## MCP Apps

OpenClaw 可以算繪實作穩定版 [MCP Apps 擴充功能](https://modelcontextprotocol.io/extensions/apps)的工具。Apps 採選擇性啟用，因為其 HTML 來自已設定的 MCP 伺服器，並且可以向同一部伺服器請求 App 可見的工具或資源。

啟用主機橋接器：

```bash
openclaw config set mcp.apps.enabled true --strict-json
```

變更此設定後，請重新啟動閘道。啟用後，OpenClaw 會在閘道連接埠加一的連接埠上啟動僅供沙箱使用的 HTTP(S) 監聽器（預設閘道為 `18790`）。控制介面會從該獨立來源載入 Apps；此監聽器絕不會提供控制介面、經驗證的閘道路由或使用者資料。

直接連線至閘道時，需要能存取這兩個連接埠。若反向 Proxy 或 TLS 終止器對外提供控制介面，請為 Apps 指定專用的公開來源，並且只將該來源 Proxy 到沙箱監聽器：

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

沙箱來源必須與控制介面來源不同。請勿在其上託管其他經驗證或敏感內容。

例如，官方基本 React 示範可以設定為：

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

- OpenClaw 只會在啟用 Apps 時宣告 `io.modelcontextprotocol/ui` 擴充功能。
- 只有 MIME 類型完全符合 `text/html;profile=mcp-app` 的 `ui://` 資源會被算繪。
- UI 資源上限為 2 MiB，會置於專用外層來源上的雙 iframe Proxy 後方，載入至不透明的內層 App 來源，並受根據資源中繼資料衍生的 CSP 約束。
- 僅供 App 使用的工具（`_meta.ui.visibility: ["app"]`）不會出現在模型工具清單中。Apps 只能呼叫其所屬伺服器上對 App 可見的工具。
- 當內層 App 文件使用不透明來源進行跨 App 隔離時，不會授予攝影機、麥克風和地理位置等綁定來源的 App 權限。
- App HTML、完整工具引數與原始結果會保存在有界限的十分鐘記憶體內檢視租約中。它們不會寫入磁碟或複製到逐字稿預覽中繼資料，而且過期的檢視不會重新啟動其 MCP 執行階段。
- 啟用橋接器時，`openclaw security audit` 會發出警告。不需要時，請使用 `openclaw config set mcp.apps.enabled false --strict-json` 停用。

## 目前限制

此頁面記錄目前已發布的橋接器狀態。

目前限制：

- 對話探索依賴現有的閘道工作階段路由中繼資料
- 除 Claude 專用轉接器外，尚無通用推送協定
- 尚未提供訊息編輯或回應工具
- HTTP/SSE/streamable-http 傳輸會連線至單一遠端伺服器；尚不支援多工上游
- `permissions_list_open` 僅包含橋接器連線期間觀察到的核准項目

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [外掛](/zh-TW/cli/plugins)
