---
read_when:
    - 將 Codex、Claude Code 或其他 MCP 用戶端連接到 OpenClaw 支援的頻道
    - 執行 `openclaw mcp serve`
    - 管理 OpenClaw 儲存的 MCP 伺服器定義
sidebarTitle: MCP
summary: 透過 MCP 公開 OpenClaw 頻道對話並管理已儲存的 MCP 伺服器定義
title: MCP
x-i18n:
    generated_at: "2026-07-05T11:08:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 569540aefe6700c82b00249183fd09e35ea41055a7e7fc0622a811bb2055488b
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` 有兩項工作：

- 使用 `openclaw mcp serve` 將 OpenClaw 作為 MCP 伺服器執行
- 使用 `list`、`show`、`status`、`doctor`、`probe`、`add`、`set`、`configure`、`tools`、`login`、`logout`、`reload` 和 `unset` 管理由 OpenClaw 管理的對外 MCP 伺服器定義

`serve` 是 OpenClaw 作為 MCP 伺服器運作。其他子命令則是 OpenClaw 作為 MCP 用戶端側伺服器登錄檔運作，供它自己的執行階段稍後使用。

<Note>
  `list`、`show`、`set` 和 `unset` 只會讀寫 OpenClaw 設定中由 OpenClaw 管理的 `mcp.servers` 項目。它們不包含來自 `config/mcporter.json` 的 mcporter 伺服器；該登錄檔請使用 `mcporter list`。
</Note>

當 OpenClaw 應自行託管編碼工具框架工作階段，並透過 ACP 路由該執行階段時，請使用 [`openclaw acp`](/zh-TW/cli/acp)。

## 選擇正確的 MCP 路徑

| 目標                                                                | 使用                                                                 | 原因                                                                                                            |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 讓外部 MCP 用戶端讀取/傳送 OpenClaw 通道對話 | `openclaw mcp serve`                                                 | OpenClaw 是 MCP 伺服器，並透過 stdio 暴露由閘道支援的對話。                                 |
| 儲存第三方 MCP 伺服器，以供 OpenClaw 管理的代理執行使用        | `openclaw mcp add`、`set`、`configure`、`tools`、`login`             | OpenClaw 是 MCP 用戶端側登錄檔，之後會將這些伺服器投射到符合資格的執行階段。               |
| 不執行代理輪次也能檢查已儲存的伺服器                  | `openclaw mcp status`、`doctor`、`probe`                             | `status` 和 `doctor` 會檢查設定；`probe` 會開啟即時 MCP 連線並列出能力。               |
| 從瀏覽器編輯 MCP 設定                                      | 控制 UI `/mcp`                                                    | 該頁面會顯示清單、啟用狀態、OAuth/篩選器摘要、命令提示，以及作用域限定的 `mcp` 編輯器。         |
| 為 Codex app-server 提供作用域限定的原生 MCP 伺服器                    | `mcp.servers.<name>.codex`                                           | `codex` 區塊只影響 Codex app-server 執行緒投射，並會在交給原生設定前移除。 |
| 執行由 ACP 託管的工具框架工作階段                                     | [`openclaw acp`](/zh-TW/cli/acp) 和 [ACP 代理](/zh-TW/tools/acp-agents-setup) | ACP 橋接模式不接受每個工作階段的 MCP 伺服器注入；請改為設定閘道/外掛橋接。     |

<Tip>
如果你不確定需要哪條路徑，請從 `openclaw mcp status --verbose` 開始。它會顯示 OpenClaw 已儲存的內容，而不會啟動任何 MCP 伺服器。
</Tip>

## OpenClaw 作為 MCP 伺服器

這是 `openclaw mcp serve` 路徑。

### 何時使用 serve

在以下情況使用 `openclaw mcp serve`：

- Codex、Claude Code 或其他 MCP 用戶端應直接與 OpenClaw 支援的通道對話通訊
- 你已經有具備已路由工作階段的本機或遠端 OpenClaw 閘道
- 你想要一個可跨 OpenClaw 通道後端運作的 MCP 伺服器，而不是為每個通道分別執行橋接

如果 OpenClaw 應自行託管編碼執行階段，並將代理工作階段保留在 OpenClaw 內，請改用 [`openclaw acp`](/zh-TW/cli/acp)。

### 運作方式

`openclaw mcp serve` 會啟動 stdio MCP 伺服器。MCP 用戶端擁有該程序。當用戶端保持 stdio 工作階段開啟時，橋接會透過 WebSocket 連線到本機或遠端 OpenClaw 閘道，並透過 MCP 暴露已路由的通道對話。

<Steps>
  <Step title="用戶端產生橋接">
    MCP 用戶端會產生 `openclaw mcp serve`。
  </Step>
  <Step title="橋接連線到閘道">
    橋接會透過 WebSocket 連線到 OpenClaw 閘道。
  </Step>
  <Step title="工作階段成為 MCP 對話">
    已路由的工作階段會成為 MCP 對話與逐字稿/歷史工具。
  </Step>
  <Step title="即時事件佇列">
    橋接連線期間，即時事件會排入記憶體佇列。
  </Step>
  <Step title="選用的 Claude 推送">
    如果啟用 Claude 通道模式，同一個工作階段也可以接收 Claude 專用的推播通知。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="重要行為">
    - 即時佇列狀態會在橋接連線時開始
    - 較舊的逐字稿歷史會使用 `messages_read` 讀取
    - Claude 推播通知只在 MCP 工作階段存活期間存在
    - 當用戶端中斷連線時，橋接會結束，而即時佇列也會消失
    - `openclaw agent` 和 `openclaw infer model run` 等一次性代理進入點，會在回覆完成時停用它們開啟的任何內建 MCP 執行階段，因此重複的腳本化執行不會累積 stdio MCP 子程序
    - 由 OpenClaw 啟動的 stdio MCP 伺服器（內建或使用者設定）會在關閉時以程序樹形式拆除，因此伺服器啟動的子程序不會在父 stdio 用戶端結束後繼續存活
    - 刪除或重設工作階段會透過共用執行階段清理路徑處置該工作階段的 MCP 用戶端，因此不會有殘留的 stdio 連線綁定到已移除的工作階段

  </Accordion>
</AccordionGroup>

### 選擇用戶端模式

<Tabs>
  <Tab title="通用 MCP 用戶端">
    僅標準 MCP 工具。使用 `conversations_list`、`messages_read`、`events_poll`、`events_wait`、`messages_send` 和核准工具。
  </Tab>
  <Tab title="Claude Code">
    標準 MCP 工具加上 Claude 專用通道配接器。啟用 `--claude-channel-mode on`，或保留預設值 `auto`。
  </Tab>
</Tabs>

<Note>
目前，`auto` 的行為與 `on` 相同。尚未有用戶端能力偵測。
</Note>

### serve 暴露的內容

橋接會使用現有的閘道工作階段路由中繼資料來暴露由通道支援的對話。當 OpenClaw 已有具備已知路由的工作階段狀態時，會出現對話，例如：

- `channel`
- 接收者或目的地中繼資料
- 選用的 `accountId`
- 選用的 `threadId`

這會讓 MCP 用戶端有一個地方可以：

- 列出最近已路由的對話
- 讀取最近的逐字稿歷史
- 等待新的傳入事件
- 透過相同路由送回回覆
- 查看橋接連線期間抵達的核准請求

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
  <Tab title="詳細 / 關閉 Claude">
    ```bash
    openclaw mcp serve --verbose
    openclaw mcp serve --claude-channel-mode off
    ```
  </Tab>
</Tabs>

### 橋接工具

<AccordionGroup>
  <Accordion title="conversations_list">
    列出最近由工作階段支援，且閘道工作階段狀態中已具備路由中繼資料的對話。

    篩選器：`limit`（最大 500）、`search`、`channel`、`includeDerivedTitles`、`includeLastMessage`。

  </Accordion>
  <Accordion title="conversation_get">
    使用直接的閘道工作階段查詢，依 `session_key` 傳回一個對話。
  </Accordion>
  <Accordion title="messages_read">
    讀取一個由工作階段支援的對話最近逐字稿訊息。`limit` 預設為 20，最大 200。
  </Accordion>
  <Accordion title="attachments_fetch">
    從一則逐字稿訊息擷取非文字訊息內容區塊。這是逐字稿內容上的中繼資料檢視，不是獨立的持久附件 Blob 存放區。
  </Accordion>
  <Accordion title="events_poll">
    讀取自數值游標以來排入佇列的即時事件。`limit` 最大 200。
  </Accordion>
  <Accordion title="events_wait">
    長輪詢直到下一個相符的佇列事件抵達，或逾時到期（預設 30 秒，最大 300 秒）。

    當通用 MCP 用戶端需要接近即時的交付，且不使用 Claude 專用推播協定時，請使用此工具。

  </Accordion>
  <Accordion title="messages_send">
    透過工作階段上已記錄的相同路由送回文字。

    目前行為：

    - 需要現有對話路由
    - 使用工作階段的通道、接收者、帳號 ID 和執行緒 ID
    - 只傳送文字

  </Accordion>
  <Accordion title="permissions_list_open">
    列出橋接自連線到閘道以來觀察到的待處理 exec/外掛核准請求。
  </Accordion>
  <Accordion title="permissions_respond">
    使用以下其中一項解析一個待處理 exec/外掛核准請求：

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### 事件模型

橋接在連線期間會保留記憶體內事件佇列。

目前事件類型：

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- 佇列僅限即時；它會在 MCP 橋接啟動時開始
- `events_poll` 和 `events_wait` 本身不會重播較舊的閘道歷史
- 持久待處理記錄應使用 `messages_read` 讀取

</Warning>

### Claude 通道通知

橋接也可以暴露 Claude 專用通道通知。這是 Claude Code 通道配接器的 OpenClaw 等效項：標準 MCP 工具仍可使用，但即時傳入訊息也可以作為 Claude 專用 MCP 通知抵達。

<Tabs>
  <Tab title="關閉">
    `--claude-channel-mode off`：僅標準 MCP 工具。
  </Tab>
  <Tab title="開啟">
    `--claude-channel-mode on`：啟用 Claude 通道通知。
  </Tab>
  <Tab title="auto（預設）">
    `--claude-channel-mode auto`：目前預設值；橋接行為與 `on` 相同。
  </Tab>
</Tabs>

啟用 Claude 通道模式時，伺服器會公告 Claude 實驗性能力，並可發出：

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

目前橋接行為：

- 傳入的 `user` 逐字稿訊息會轉送為 `notifications/claude/channel`
- 透過 MCP 收到的 Claude 權限請求會在記憶體中追蹤
- 如果連結對話中的命令擁有者稍後傳送 `yes <id>` 或 `no <id>`（`<id>` 是 5 個字母的請求 ID，不含 `l`），橋接會將其轉換為 `notifications/claude/channel/permission`
- 這些通知僅限即時工作階段；如果 MCP 用戶端中斷連線，就沒有推送目標

這是刻意針對用戶端的行為。通用 MCP 用戶端應依賴標準輪詢工具。

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

對於大多數通用 MCP 用戶端，請從標準工具介面開始，並忽略 Claude 模式。只有在用戶端確實理解 Claude 專用通知方法時，才開啟 Claude 模式。

### 選項

`openclaw mcp serve` 支援：

<ParamField path="--url" type="string">
  閘道 WebSocket URL。已設定時，預設為 `gateway.remote.url`。
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
  在 stderr 顯示詳細記錄。
</ParamField>

<Tip>
可行時，優先使用 `--token-file` 或 `--password-file`，而不是內嵌祕密。
</Tip>

### 安全性與信任邊界

橋接器不會憑空建立路由。它只公開閘道已知道如何路由的對話。

這表示：

- 寄件者允許清單、配對與通道層級信任仍屬於底層 OpenClaw 通道設定
- `messages_send` 只能透過既有已儲存路由回覆
- 核准狀態只在目前橋接器工作階段中即時／記憶體內有效
- 橋接器驗證應使用你會信任給任何其他遠端閘道用戶端的相同閘道權杖或密碼控制

如果某個對話未出現在 `conversations_list` 中，通常原因不是 MCP 設定，而是底層閘道工作階段中缺少或不完整的路由中繼資料。

### 測試

OpenClaw 隨附此橋接器的確定性 Docker 煙霧測試：

```bash
pnpm test:docker:mcp-channels
```

該煙霧測試會執行單一容器：它植入對話狀態、啟動閘道，接著將 `openclaw mcp serve` 產生為 stdio 子程序，並以 MCP 用戶端驅動它。它會透過真實的 stdio MCP 橋接器，驗證對話探索、逐字稿讀取、附件中繼資料讀取、即時事件佇列行為，以及 Claude 風格的通道與權限通知。外送傳送路由（`messages_send` 重用已儲存的對話路由）則由 `src/mcp/channel-server.test.ts` 中的單元測試另行涵蓋。

這是不必把真實 Telegram、Discord 或 iMessage 帳號接入測試執行，也能證明橋接器正常運作的最快方式。

如需更廣泛的測試脈絡，請參閱[測試](/zh-TW/help/testing)。

### 疑難排解

<AccordionGroup>
  <Accordion title="No conversations returned">
    通常表示閘道工作階段尚不可路由。確認底層工作階段已儲存通道／提供者、收件者，以及選用的帳號／討論串路由中繼資料。
  </Accordion>
  <Accordion title="events_poll or events_wait misses older messages">
    這是預期行為。即時佇列會在橋接器連線時開始。請使用 `messages_read` 讀取較舊的逐字稿歷史。
  </Accordion>
  <Accordion title="Claude notifications do not show up">
    請檢查以下所有項目：

    - 用戶端保持 stdio MCP 工作階段開啟
    - `--claude-channel-mode` 為 `on` 或 `auto`
    - 用戶端確實理解 Claude 專用通知方法
    - 傳入訊息發生在橋接器連線之後

  </Accordion>
  <Accordion title="Approvals are missing">
    `permissions_list_open` 只會顯示橋接器連線期間觀察到的核准請求。它不是持久化的核准歷史 API。
  </Accordion>
</AccordionGroup>

## OpenClaw 作為 MCP 用戶端登錄

這是 `openclaw mcp list`、`show`、`status`、`doctor`、`probe`、`add`、`set`、
`configure`、`tools`、`login`、`logout`、`reload` 與 `unset` 路徑。

這些命令不會透過 MCP 公開 OpenClaw。它們會管理 OpenClaw 設定中 `mcp.servers` 下由 OpenClaw 管理的 MCP 伺服器定義。它們不會從 `config/mcporter.json` 讀取 mcporter 伺服器。

這些已儲存定義供 OpenClaw 稍後啟動或設定的執行階段使用，例如嵌入式 OpenClaw 與其他執行階段配接器。OpenClaw 會集中儲存這些定義，讓那些執行階段不需要保留自己的重複 MCP 伺服器清單。

<AccordionGroup>
  <Accordion title="Important behavior">
    - 這些命令只會讀取或寫入 OpenClaw 設定
    - `status`、`list`、`show`、不含 `--probe` 的 `doctor`、`set`、`configure`、`tools`、`logout`、`reload` 與 `unset` 不會連線到目標 MCP 伺服器
    - `login` 會針對已設定的 HTTP 伺服器執行 MCP OAuth 網路流程，並儲存產生的本機認證
    - `status --verbose` 會在不連線的情況下列印已解析的傳輸、驗證、逾時、篩選器與平行工具呼叫提示
    - `doctor` 會檢查已儲存定義的本機設定問題，例如缺少 stdio 命令、無效工作目錄、缺少 TLS 檔案、已停用伺服器、字面敏感標頭／環境值，以及未完成的 OAuth 授權
    - `doctor --probe` 會在靜態檢查通過後，加入與 `probe` 相同的即時連線證明
    - `probe` 會連線到所選伺服器或所有已設定伺服器、列出工具，並回報能力／診斷
    - `add` 會從旗標建立定義並在儲存前進行探測，除非已設定 `--no-probe`，或需要先完成 OAuth 授權
    - 執行階段配接器會在執行時決定它們實際支援哪些傳輸形狀
    - `enabled: false` 會保留伺服器的儲存狀態，但將它排除於嵌入式執行階段探索之外
    - `timeout` 與 `connectTimeout` 會以秒為單位設定每個伺服器的請求與連線逾時
    - `supportsParallelToolCalls: true` 會標記配接器可並行呼叫的伺服器
    - HTTP 伺服器可使用靜態標頭、OAuth 登入、TLS 驗證控制，以及 mTLS 憑證／金鑰路徑
    - 嵌入式 OpenClaw 會在一般 `coding` 與 `messaging` 工具設定檔中公開已設定的 MCP 工具；`minimal` 仍會隱藏它們，而 `tools.deny: ["bundle-mcp"]` 會明確停用它們
    - 每個伺服器的 `toolFilter.include` 與 `toolFilter.exclude` 會在探索到的 MCP 工具成為 OpenClaw 工具前進行篩選
    - 宣告資源或提示的伺服器，也會公開用於列出／讀取資源以及列出／擷取提示的工具；這些產生的工具名稱（`resources_list`、`resources_read`、`prompts_list`、`prompts_get`）使用相同的包含／排除篩選器
    - 動態 MCP 工具清單變更會使該工作階段的快取目錄失效；下一次探索／使用會從伺服器重新整理
    - 重複的 MCP 工具請求／通訊協定失敗會短暫暫停該伺服器，避免單一故障伺服器耗盡整個回合
    - 工作階段範圍的 bundled MCP 執行階段會在閒置 `mcp.sessionIdleTtlMs` 毫秒後被回收（預設 10 分鐘；設為 `0` 可停用），一次性嵌入式執行會在執行結束時清理它們

  </Accordion>
</AccordionGroup>

執行階段配接器可將這個共享登錄正規化為其下游用戶端預期的形狀。例如，嵌入式 OpenClaw 會直接取用 OpenClaw `transport` 值，而 Claude Code 與 Gemini 會接收命令列介面原生的 `type` 值，例如 `http`、`sse` 或 `stdio`。

Codex app-server 也會遵循每個伺服器上的選用 `codex` 區塊。這是僅供 Codex app-server 討論串使用的 OpenClaw 投影中繼資料；它不會變更 ACP 工作階段、一般 Codex harness 設定或其他執行階段配接器。使用非空的 `codex.agents` 可將伺服器只投影到特定 OpenClaw agent ids。空白、空字串或無效的 agent 清單會被設定驗證拒絕，並由執行階段投影路徑省略，而不會變成全域。使用 `codex.defaultToolsApprovalMode`（`auto`、`prompt` 或 `approve`）可為受信任伺服器發出 Codex 原生的 `default_tools_approval_mode`。OpenClaw 會先移除 `codex` 中繼資料，再將原生 `mcp_servers` 設定交給 Codex。

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
- 不帶名稱的 `show` 會列印完整已設定的 MCP 伺服器物件。
- `status` 會在不連線的情況下分類已設定的傳輸。`--verbose` 會包含已解析的啟動、逾時、OAuth、篩選器與平行呼叫詳細資訊。
- `doctor` 會在不連線的情況下執行靜態檢查。當命令也應驗證已啟用伺服器可連線時，加入 `--probe`。
- `probe` 會連線並回報工具數量、資源／提示支援、清單變更支援與診斷。
- `add` 接受 stdio 旗標，例如 `--command`、`--arg`、`--env` 與 `--cwd`，或 HTTP 旗標，例如 `--url`、`--transport`、`--header`、`--auth oauth`、TLS、逾時與工具選擇旗標。
- `set` 預期命令列上有一個 JSON 物件值。
- `configure` 會更新啟用狀態、工具篩選器、逾時、OAuth、TLS 與平行工具呼叫提示，而不取代整個伺服器定義。加入 `--probe` 可在儲存前驗證更新後的伺服器。
- `tools` 會更新每個伺服器的工具篩選器。包含／排除項目是 MCP 工具名稱與簡單的 `*` glob。
- `login` 會針對設定為 `auth: "oauth"` 的 HTTP 伺服器執行 OAuth 流程。第一次執行會列印授權 URL；核准後使用 `--code` 重新執行。
- `logout` 會清除具名伺服器已儲存的 OAuth 認證，而不移除已儲存的伺服器定義。
- `reload` 只會針對目前命令列介面處理程序處置快取的程序內 MCP 執行階段。另一個處理程序中的閘道或 agent 處理程序仍需要自己的重新載入或重新啟動路徑。
- 對 Streamable HTTP MCP 伺服器使用 `transport: "streamable-http"`。`openclaw mcp set` 也會將命令列介面原生的 `type: "http"` 正規化為相同的標準設定形狀以維持相容性。
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

### 常見伺服器配方

這些範例只會儲存伺服器定義。之後執行 `openclaw mcp doctor --probe`，以證明伺服器可啟動並公開工具。

<Tabs>
  <Tab title="Filesystem">
    ```bash
    openclaw mcp add files \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-filesystem \
      --arg "$HOME/Documents" \
      --include 'read_file,list_directory,search_files'
    openclaw mcp doctor files --probe
    ```

    將檔案系統伺服器範圍限制在 agent 應讀取或編輯的最小目錄樹。

  </Tab>
  <Tab title="Memory">
    ```bash
    openclaw mcp add memory \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-memory
    openclaw mcp probe memory --json
    ```

    如果伺服器公開不應提供給一般 agent 的寫入工具，請使用工具篩選器。

  </Tab>
  <Tab title="Local script">
    ```bash
    openclaw mcp add local-tools \
      --command node \
      --arg ./dist/mcp-server.js \
      --cwd /srv/openclaw-tools \
      --env API_BASE=https://internal.example
    openclaw mcp status --verbose
    ```

    `doctor` 會檢查 `cwd` 是否存在，以及命令是否能從已設定的環境解析。

  </Tab>
  <Tab title="Remote HTTP">
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

    當遠端伺服器支援 OAuth 時使用 OAuth。如果伺服器需要靜態標頭，請避免提交字面承載權杖。

  </Tab>
  <Tab title="Desktop/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,observe,click,type'
    openclaw mcp doctor cua-driver --probe
    ```

    直接的桌面控制伺服器會繼承其啟動程序的權限。請使用範圍較窄的工具篩選器與作業系統層級權限提示。

  </Tab>
</Tabs>

### JSON 輸出形狀

對指令碼與儀表板使用 `--json`。欄位集合可能會隨時間增加，因此消費端應忽略未知鍵。

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
              "message": "OAuth credentials are not authorized; run openclaw mcp login docs"
            }
          ]
        }
      ]
    }
    ```

    當任何已啟用且已檢查的伺服器有 `error` 層級問題時，`doctor --json` 會以非零狀態結束。`warning` 與 `info` 問題會被回報，但本身不會讓命令失敗。

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

    `probe --json` 會開啟即時 MCP 用戶端工作階段並直接列印結果；不同於 `status`/`doctor`，輸出沒有最上層的 `path` 欄位。只有當伺服器實際宣告該能力時，才會出現 `resources` 與 `prompts` 鍵（沒有 prompts 的伺服器會省略 `prompts` 鍵，而不是回報 `false`）。請使用 `probe` 證明可連通性與能力，而不是用於靜態設定稽核。

  </Accordion>
</AccordionGroup>

設定形狀範例：

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

| 欄位                       | 說明                         |
| -------------------------- | ---------------------------- |
| `command`                  | 要產生的可執行檔（必填）     |
| `args`                     | 命令列引數陣列               |
| `env`                      | 額外環境變數                 |
| `cwd` / `workingDirectory` | 程序的工作目錄               |

<Warning>
**Stdio env 安全篩選器**

OpenClaw 會在產生 stdio MCP 伺服器之前拒絕直譯器啟動、載入器劫持與 shell 初始化 env 鍵，即使它們出現在伺服器的 `env` 區塊中也一樣。這會使用與其他由 OpenClaw 產生程序相同的主機環境安全政策：它會阻擋已知的直譯器啟動掛鉤（例如 `NODE_OPTIONS`、`PYTHONSTARTUP`、`PERL5OPT`、`RUBYOPT`、`BASHOPTS`、`KSH_ENV`）、共享函式庫與函式注入前綴（`DYLD_*`、`LD_*`、`BASH_FUNC_*`），以及類似的執行階段控制變數。啟動時會靜默丟棄這些項目並記錄警告，因此它們無法注入隱含前置程式、替換直譯器、啟用除錯器，或針對 stdio 程序劫持動態連結器。明確允許清單會保留一般 MCP 憑證 env 變數可用（`GITHUB_TOKEN`、`GH_TOKEN`、`GITLAB_TOKEN`、`NPM_TOKEN`、`NODE_AUTH_TOKEN`、`DATABASE_URL`、`MONGODB_URI`、`REDIS_URL`、`AMQP_URL`、`AWS_ACCESS_KEY_ID`、`AWS_SECRET_ACCESS_KEY`、`AWS_SESSION_TOKEN`、`AZURE_CLIENT_ID`、`AZURE_CLIENT_SECRET`），以及一般代理與伺服器特定 env 變數（`HTTP_PROXY`、自訂 `*_API_KEY` 等）。其他 `AWS_*` 鍵，例如 `AWS_CONFIG_FILE` 與 `AWS_SHARED_CREDENTIALS_FILE`，仍會被阻擋，因為它們指向憑證檔案，而不是直接攜帶憑證值。

如果你的 MCP 伺服器確實需要其中一個被阻擋的變數，請在閘道主機程序上設定，而不是在 stdio 伺服器的 `env` 底下設定。
</Warning>

### SSE / HTTP 傳輸

透過 HTTP Server-Sent Events 連線到遠端 MCP 伺服器。

| 欄位                           | 說明                                                     |
| ------------------------------ | -------------------------------------------------------- |
| `url`                          | 遠端伺服器的 HTTP 或 HTTPS URL（必填）                   |
| `headers`                      | HTTP 標頭的選用鍵值對應表（例如驗證權杖）                |
| `connectionTimeoutMs`          | 每個伺服器的連線逾時，單位為 ms（選用）                  |
| `connectTimeout`               | 每個伺服器的連線逾時，單位為秒（選用）                   |
| `timeout` / `requestTimeoutMs` | 每個伺服器的 MCP 請求逾時，單位為秒或 ms                 |
| `auth: "oauth"`                | 使用 MCP OAuth 權杖儲存與 `openclaw mcp login`           |
| `sslVerify`                    | 只有對明確信任的私有 HTTPS 端點才設為 false              |
| `clientCert` / `clientKey`     | mTLS 用戶端憑證與金鑰路徑                                |
| `supportsParallelToolCalls`    | 提示此伺服器可安全執行並行呼叫                           |

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

`url`（userinfo）與 `headers` 中的敏感值會在日誌與狀態輸出中遮蔽。當看似敏感的 `headers` 或 `env` 項目包含字面值時，`openclaw mcp doctor` 會發出警告，讓操作員可以將這些值移出已提交的設定。

### OAuth 工作流程

OAuth 適用於宣告 MCP OAuth 流程的 HTTP MCP 伺服器。當伺服器啟用 `auth: "oauth"` 時，靜態 `Authorization` 標頭會被忽略。

<Steps>
  <Step title="Save the server">
    使用 `auth: "oauth"` 與任何選用 OAuth 中繼資料新增或更新伺服器。

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

  </Step>
  <Step title="Start login">
    執行 login 以建立授權請求。

    ```bash
    openclaw mcp login docs
    ```

    OpenClaw 會列印授權 URL，並將暫時 OAuth 驗證器狀態儲存在 OpenClaw 狀態目錄底下。

  </Step>
  <Step title="Finish with the code">
    在瀏覽器中核准後，將傳回的 code 傳回 OpenClaw。

    ```bash
    openclaw mcp login docs --code abc123
    ```

  </Step>
  <Step title="Check authorization">
    使用 status 或 doctor 確認權杖存在。

    ```bash
    openclaw mcp status --verbose
    openclaw mcp doctor docs --probe
    ```

  </Step>
  <Step title="Clear credentials">
    Logout 會移除已儲存的 OAuth 憑證，但保留已儲存的伺服器定義。

    ```bash
    openclaw mcp logout docs
    ```

  </Step>
</Steps>

如果提供者輪替權杖或授權狀態卡住，請執行 `openclaw mcp logout <name>`，然後重複 `login`。只要伺服器名稱與 URL 仍可識別憑證儲存項目，即使已從設定移除 `auth: "oauth"`，`logout` 仍可清除已儲存 HTTP 伺服器的憑證。

### Streamable HTTP 傳輸

`streamable-http` 是與 `sse` 和 `stdio` 並列的額外傳輸選項。它使用 HTTP 串流與遠端 MCP 伺服器進行雙向通訊。

| 欄位                           | 說明                                                                                   |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| `url`                          | 遠端伺服器的 HTTP 或 HTTPS URL（必填）                                                  |
| `transport`                    | 設為 `"streamable-http"` 以選取此傳輸；省略時，OpenClaw 會使用 `sse`                   |
| `headers`                      | HTTP 標頭的選用鍵值對應表（例如驗證權杖）                                               |
| `connectionTimeoutMs`          | 每個伺服器的連線逾時，單位為 ms（選用）                                                 |
| `connectTimeout`               | 每個伺服器的連線逾時，單位為秒（選用）                                                  |
| `timeout` / `requestTimeoutMs` | 每個伺服器的 MCP 請求逾時，單位為秒或 ms                                                |
| `auth: "oauth"`                | 使用 MCP OAuth 權杖儲存與 `openclaw mcp login`                                          |
| `sslVerify`                    | 只有對明確信任的私有 HTTPS 端點才設為 false                                             |
| `clientCert` / `clientKey`     | mTLS 用戶端憑證與金鑰路徑                                                               |
| `supportsParallelToolCalls`    | 提示此伺服器可安全執行並行呼叫                                                          |

OpenClaw 設定使用 `transport: "streamable-http"` 作為標準拼法。透過 `openclaw mcp set` 儲存時會接受命令列介面原生 MCP `type: "http"` 值，且既有設定會由 `openclaw doctor --fix` 修復，但嵌入式 OpenClaw 會直接消耗 `transport`。

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
登錄命令不會啟動通道橋接。只有 `probe` 與 `doctor --probe` 會開啟即時 MCP 用戶端工作階段，以證明目標伺服器可連線。
</Note>

## 控制 UI

瀏覽器控制 UI 在 `/mcp` 提供專用的 MCP 設定頁面。它會顯示已設定的伺服器數量、已啟用/OAuth/篩選摘要、各伺服器的傳輸列、啟用/停用控制項、常用命令列介面命令，以及 `mcp` 設定區段的範圍限定編輯器。

使用此頁面進行操作者編輯與快速盤點。當你需要即時伺服器證明時，請使用 `openclaw mcp doctor --probe` 或 `openclaw mcp probe`。

操作者工作流程：

1. 開啟控制 UI 並選擇 **MCP**。
2. 檢視總數、已啟用、OAuth 與已篩選伺服器的摘要卡片。
3. 使用各伺服器列查看傳輸、驗證、篩選、逾時與命令提示。
4. 當你想保留定義但將其排除在執行階段探索之外時，切換啟用狀態。
5. 編輯範圍限定的 `mcp` 設定區段，以進行新增伺服器、標頭、TLS、OAuth 中繼資料或工具篩選器等結構性變更。
6. 選擇 **儲存** 以僅持久化設定，或選擇 **儲存並發布** 以透過閘道設定路徑套用。
7. 當你需要即時證明已編輯的伺服器可啟動並列出工具時，請執行 `openclaw mcp doctor --probe`。

注意事項：

- 命令片段會引用伺服器名稱，讓不尋常的名稱仍可在 shell 中複製使用
- 顯示的類 URL 值若包含嵌入式憑證，會在轉譯前先經過遮蔽
- 此頁面本身不會啟動 MCP 傳輸
- 作用中的執行階段可能需要 `openclaw mcp reload`、閘道設定發布或程序重新啟動，取決於哪個程序擁有 MCP 用戶端

## 目前限制

此頁面記錄目前已發布的橋接器。

目前限制：

- 對話探索取決於現有的閘道工作階段路由中繼資料
- 除了 Claude 專用配接器之外，沒有通用推送協定
- 尚無訊息編輯或反應工具
- HTTP/SSE/streamable-http 傳輸會連線到單一遠端伺服器；尚無多工上游
- `permissions_list_open` 只包含橋接器連線期間觀察到的核准

## 相關

- [命令列介面參考](/zh-TW/cli)
- [外掛](/zh-TW/cli/plugins)
