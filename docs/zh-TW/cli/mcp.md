---
read_when:
    - 將 Codex、Claude Code 或其他 MCP 用戶端連接到 OpenClaw 支援的頻道
    - 正在執行 `openclaw mcp serve`
    - 管理 OpenClaw 儲存的 MCP 伺服器定義
sidebarTitle: MCP
summary: 透過 MCP 公開 OpenClaw 頻道對話，並管理已儲存的 MCP 伺服器定義
title: MCP
x-i18n:
    generated_at: "2026-04-30T02:54:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: d66ec20b81ab3894c7202ee1c1c6666bd9cdeffc8d48a280b1f298bb358887ef
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` 有兩項工作：

- 使用 `openclaw mcp serve` 將 OpenClaw 作為 MCP 伺服器執行
- 使用 `list`、`show`、`set` 和 `unset` 管理 OpenClaw 擁有的外送 MCP 伺服器定義

換句話說：

- `serve` 是 OpenClaw 作為 MCP 伺服器運作
- `list` / `show` / `set` / `unset` 是 OpenClaw 作為 MCP 用戶端側登錄檔運作，供其執行階段稍後可能取用的其他 MCP 伺服器使用

當 OpenClaw 應自行託管編碼工具組工作階段，並透過 ACP 路由該執行階段時，請使用 [`openclaw acp`](/zh-TW/cli/acp)。

## OpenClaw 作為 MCP 伺服器

這是 `openclaw mcp serve` 路徑。

### 何時使用 `serve`

在下列情況使用 `openclaw mcp serve`：

- Codex、Claude Code 或其他 MCP 用戶端應直接與 OpenClaw 支援的頻道對話溝通
- 你已經有本機或遠端 OpenClaw Gateway，且其中有已路由的工作階段
- 你想要一個可跨 OpenClaw 頻道後端運作的 MCP 伺服器，而不是執行各頻道各自的橋接器

當 OpenClaw 應自行託管編碼執行階段，並將代理程式工作階段保留在 OpenClaw 內時，請改用 [`openclaw acp`](/zh-TW/cli/acp)。

### 運作方式

`openclaw mcp serve` 會啟動 stdio MCP 伺服器。MCP 用戶端擁有該程序。只要用戶端保持 stdio 工作階段開啟，橋接器就會透過 WebSocket 連線至本機或遠端 OpenClaw Gateway，並透過 MCP 暴露已路由的頻道對話。

<Steps>
  <Step title="用戶端產生橋接器">
    MCP 用戶端會產生 `openclaw mcp serve`。
  </Step>
  <Step title="橋接器連線至 Gateway">
    橋接器會透過 WebSocket 連線至 OpenClaw Gateway。
  </Step>
  <Step title="工作階段成為 MCP 對話">
    已路由的工作階段會成為 MCP 對話與逐字稿/歷史工具。
  </Step>
  <Step title="即時事件佇列">
    橋接器連線期間，即時事件會在記憶體中排入佇列。
  </Step>
  <Step title="選用 Claude 推送">
    如果啟用 Claude 頻道模式，同一個工作階段也可以接收 Claude 專用推送通知。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="重要行為">
    - 即時佇列狀態會在橋接器連線時開始
    - 較舊的逐字稿歷史會透過 `messages_read` 讀取
    - Claude 推送通知只會在 MCP 工作階段存活期間存在
    - 當用戶端中斷連線時，橋接器會結束，且即時佇列會消失
    - `openclaw agent` 和 `openclaw infer model run` 等一次性代理程式進入點會在回覆完成時淘汰其開啟的任何內建 MCP 執行階段，因此重複的腳本化執行不會累積 stdio MCP 子程序
    - 由 OpenClaw 啟動的 stdio MCP 伺服器（內建或使用者設定）會在關閉時以程序樹形式拆除，因此伺服器啟動的子程序不會在父 stdio 用戶端結束後存活
    - 刪除或重設工作階段會透過共用執行階段清理路徑處置該工作階段的 MCP 用戶端，因此不會有綁定至已移除工作階段的殘留 stdio 連線

  </Accordion>
</AccordionGroup>

### 選擇用戶端模式

以兩種不同方式使用相同橋接器：

<Tabs>
  <Tab title="通用 MCP 用戶端">
    僅標準 MCP 工具。使用 `conversations_list`、`messages_read`、`events_poll`、`events_wait`、`messages_send` 和核准工具。
  </Tab>
  <Tab title="Claude Code">
    標準 MCP 工具加上 Claude 專用頻道配接器。啟用 `--claude-channel-mode on`，或保留預設值 `auto`。
  </Tab>
</Tabs>

<Note>
目前，`auto` 的行為與 `on` 相同。尚未有用戶端能力偵測。
</Note>

### `serve` 暴露的內容

橋接器會使用現有 Gateway 工作階段路由中繼資料來暴露頻道支援的對話。當 OpenClaw 已有含已知路由的工作階段狀態時，對話就會出現，例如：

- `channel`
- 接收者或目的地中繼資料
- 選用 `accountId`
- 選用 `threadId`

這讓 MCP 用戶端能在一處：

- 列出最近已路由的對話
- 讀取最近的逐字稿歷史
- 等待新的入站事件
- 透過相同路由傳送回覆
- 查看橋接器連線期間到達的核准要求

### 用法

<Tabs>
  <Tab title="本機 Gateway">
    ```bash
    openclaw mcp serve
    ```
  </Tab>
  <Tab title="遠端 Gateway（權杖）">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
    ```
  </Tab>
  <Tab title="遠端 Gateway（密碼）">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password
    ```
  </Tab>
  <Tab title="詳細 / Claude 關閉">
    ```bash
    openclaw mcp serve --verbose
    openclaw mcp serve --claude-channel-mode off
    ```
  </Tab>
</Tabs>

### 橋接工具

目前橋接器會暴露這些 MCP 工具：

<AccordionGroup>
  <Accordion title="conversations_list">
    列出最近已有 Gateway 工作階段狀態中路由中繼資料的工作階段支援對話。

    實用篩選器：

    - `limit`
    - `search`
    - `channel`
    - `includeDerivedTitles`
    - `includeLastMessage`

  </Accordion>
  <Accordion title="conversation_get">
    依 `session_key` 傳回一個對話。
  </Accordion>
  <Accordion title="messages_read">
    讀取一個工作階段支援對話的最近逐字稿訊息。
  </Accordion>
  <Accordion title="attachments_fetch">
    從一則逐字稿訊息擷取非文字訊息內容區塊。這是逐字稿內容上的中繼資料檢視，不是獨立的持久附件 blob 儲存庫。
  </Accordion>
  <Accordion title="events_poll">
    讀取自數值游標以來已排入佇列的即時事件。
  </Accordion>
  <Accordion title="events_wait">
    長輪詢直到下一個相符的已排入佇列事件到達，或逾時到期。

    當通用 MCP 用戶端需要接近即時的傳遞，但沒有 Claude 專用推送通訊協定時，請使用此工具。

  </Accordion>
  <Accordion title="messages_send">
    透過工作階段上已記錄的相同路由傳回文字。

    目前行為：

    - 需要現有對話路由
    - 使用工作階段的頻道、接收者、帳號 ID 和討論串 ID
    - 僅傳送文字

  </Accordion>
  <Accordion title="permissions_list_open">
    列出橋接器自連線至 Gateway 以來觀察到的待處理 exec/Plugin 核准要求。
  </Accordion>
  <Accordion title="permissions_respond">
    使用以下其中一項解決一個待處理 exec/Plugin 核准要求：

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### 事件模型

橋接器在連線期間會保留記憶體內事件佇列。

目前事件類型：

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- 佇列僅限即時；它會在 MCP 橋接器啟動時開始
- `events_poll` 和 `events_wait` 本身不會重播較舊的 Gateway 歷史
- 持久待處理記錄應使用 `messages_read` 讀取

</Warning>

### Claude 頻道通知

橋接器也可以暴露 Claude 專用頻道通知。這是 OpenClaw 中對應 Claude Code 頻道配接器的功能：標準 MCP 工具仍然可用，但即時入站訊息也可以作為 Claude 專用 MCP 通知到達。

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`：僅標準 MCP 工具。
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on`：啟用 Claude 頻道通知。
  </Tab>
  <Tab title="auto（預設）">
    `--claude-channel-mode auto`：目前預設值；橋接器行為與 `on` 相同。
  </Tab>
</Tabs>

啟用 Claude 頻道模式時，伺服器會宣告 Claude 實驗性能力，並可發出：

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

目前橋接器行為：

- 入站 `user` 逐字稿訊息會轉送為 `notifications/claude/channel`
- 透過 MCP 接收的 Claude 權限要求會在記憶體中追蹤
- 如果連結的對話稍後傳送 `yes abcde` 或 `no abcde`，橋接器會將其轉換為 `notifications/claude/channel/permission`
- 這些通知僅限即時工作階段；如果 MCP 用戶端中斷連線，就沒有推送目標

這是刻意為特定用戶端設計。通用 MCP 用戶端應依賴標準輪詢工具。

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

對大多數通用 MCP 用戶端，請從標準工具介面開始，並忽略 Claude 模式。只有在用戶端實際理解 Claude 專用通知方法時，才開啟 Claude 模式。

### 選項

`openclaw mcp serve` 支援：

<ParamField path="--url" type="string">
  Gateway WebSocket URL。
</ParamField>
<ParamField path="--token" type="string">
  Gateway 權杖。
</ParamField>
<ParamField path="--token-file" type="string">
  從檔案讀取權杖。
</ParamField>
<ParamField path="--password" type="string">
  Gateway 密碼。
</ParamField>
<ParamField path="--password-file" type="string">
  從檔案讀取密碼。
</ParamField>
<ParamField path="--claude-channel-mode" type='"auto" | "on" | "off"'>
  Claude 通知模式。
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  stderr 上的詳細記錄。
</ParamField>

<Tip>
可行時，偏好使用 `--token-file` 或 `--password-file`，而不是行內祕密。
</Tip>

### 安全性與信任邊界

橋接器不會自行發明路由。它只會暴露 Gateway 已知如何路由的對話。

這表示：

- 傳送者允許清單、配對和頻道層級信任仍屬於底層 OpenClaw 頻道設定
- `messages_send` 只能透過現有已儲存路由回覆
- 核准狀態僅對目前橋接器工作階段即時/記憶體內有效
- 橋接器驗證應使用你會信任任何其他遠端 Gateway 用戶端的相同 Gateway 權杖或密碼控制

如果某個對話未出現在 `conversations_list` 中，通常原因不是 MCP 設定，而是底層 Gateway 工作階段中的路由中繼資料缺失或不完整。

### 測試

OpenClaw 隨附此橋接器的確定性 Docker smoke：

```bash
pnpm test:docker:mcp-channels
```

該 smoke 會：

- 啟動已植入資料的 Gateway 容器
- 啟動第二個容器，並產生 `openclaw mcp serve`
- 驗證對話探索、逐字稿讀取、附件中繼資料讀取、即時事件佇列行為，以及外送傳送路由
- 透過真實 stdio MCP 橋接器驗證 Claude 風格的頻道與權限通知

這是在不將真實 Telegram、Discord 或 iMessage 帳號接入測試執行的情況下，證明橋接器可運作的最快方式。

如需更廣泛的測試背景，請參閱 [測試](/zh-TW/help/testing)。

### 疑難排解

<AccordionGroup>
  <Accordion title="未傳回任何對話">
    通常表示 Gateway 工作階段尚不可路由。確認底層工作階段已儲存頻道/供應者、接收者，以及選用帳號/討論串路由中繼資料。
  </Accordion>
  <Accordion title="events_poll 或 events_wait 遺漏較舊訊息">
    預期行為。即時佇列會在橋接器連線時開始。使用 `messages_read` 讀取較舊的逐字稿歷史。
  </Accordion>
  <Accordion title="Claude 通知未顯示">
    檢查以下所有項目：

    - 用戶端保持 stdio MCP 工作階段開啟
    - `--claude-channel-mode` 為 `on` 或 `auto`
    - 用戶端實際理解 Claude 專用通知方法
    - 入站訊息發生在橋接器連線之後

  </Accordion>
  <Accordion title="核准缺失">
    `permissions_list_open` 只會顯示橋接器連線期間觀察到的核准要求。它不是持久核准歷史 API。
  </Accordion>
</AccordionGroup>

## OpenClaw 作為 MCP 用戶端登錄檔

這是 `openclaw mcp list`、`show`、`set` 和 `unset` 路徑。

這些命令不會透過 MCP 公開 OpenClaw。它們會管理 OpenClaw 設定中 `mcp.servers` 底下由 OpenClaw 擁有的 MCP 伺服器定義。

這些已儲存的定義用於 OpenClaw 稍後啟動或設定的執行階段，例如嵌入式 Pi 和其他執行階段轉接器。OpenClaw 會集中儲存這些定義，讓那些執行階段不需要維護自己的重複 MCP 伺服器清單。

<AccordionGroup>
  <Accordion title="重要行為">
    - 這些命令只會讀取或寫入 OpenClaw 設定
    - 它們不會連線到目標 MCP 伺服器
    - 它們不會驗證命令、URL 或遠端傳輸目前是否可連線
    - 執行階段轉接器會在執行時決定它們實際支援哪些傳輸形狀
    - 嵌入式 Pi 會在一般 `coding` 和 `messaging` 工具設定檔中公開已設定的 MCP 工具；`minimal` 仍會隱藏它們，而 `tools.deny: ["bundle-mcp"]` 會明確停用它們
    - 工作階段範圍的 bundled MCP 執行階段會在閒置 `mcp.sessionIdleTtlMs` 毫秒後被清理（預設 10 分鐘；設為 `0` 可停用），而一次性的嵌入式執行會在執行結束時清理它們

  </Accordion>
</AccordionGroup>

執行階段轉接器可能會將這個共用登錄正規化為其下游用戶端預期的形狀。例如，嵌入式 Pi 會直接使用 OpenClaw `transport` 值，而 Claude Code 和 Gemini 會接收 CLI 原生的 `type` 值，例如 `http`、`sse` 或 `stdio`。

### 已儲存的 MCP 伺服器定義

OpenClaw 也會在設定中儲存輕量級 MCP 伺服器登錄，供需要由 OpenClaw 管理 MCP 定義的介面使用。

命令：

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

注意事項：

- `list` 會排序伺服器名稱。
- 未指定名稱的 `show` 會印出完整設定的 MCP 伺服器物件。
- `set` 需要在命令列上提供一個 JSON 物件值。
- 對 Streamable HTTP MCP 伺服器使用 `transport: "streamable-http"`。`openclaw mcp set` 也會將 CLI 原生的 `type: "http"` 正規化為相同的標準設定形狀，以維持相容性。
- 如果具名伺服器不存在，`unset` 會失敗。

範例：

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com","transport":"streamable-http"}'
openclaw mcp unset context7
```

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
        "transport": "streamable-http"
      }
    }
  }
}
```

### Stdio 傳輸

啟動本機子程序，並透過 stdin/stdout 通訊。

| 欄位                       | 說明                         |
| -------------------------- | ---------------------------- |
| `command`                  | 要產生的可執行檔（必要）     |
| `args`                     | 命令列引數陣列               |
| `env`                      | 額外環境變數                 |
| `cwd` / `workingDirectory` | 程序的工作目錄               |

<Warning>
**Stdio env 安全篩選器**

OpenClaw 會拒絕可在第一個 RPC 之前改變 stdio MCP 伺服器啟動方式的直譯器啟動 env 鍵，即使它們出現在伺服器的 `env` 區塊中也一樣。封鎖的鍵包含 `NODE_OPTIONS`、`PYTHONSTARTUP`、`PYTHONPATH`、`PERL5OPT`、`RUBYOPT`、`SHELLOPTS`、`PS4` 以及類似的執行階段控制變數。啟動時會以設定錯誤拒絕這些鍵，因此它們無法注入隱含前置內容、替換直譯器，或針對 stdio 程序啟用偵錯器。一般憑證、Proxy 和伺服器專用 env 變數（`GITHUB_TOKEN`、`HTTP_PROXY`、自訂 `*_API_KEY` 等）不受影響。

如果你的 MCP 伺服器確實需要其中一個被封鎖的變數，請在 gateway 主機程序上設定它，而不是放在 stdio 伺服器的 `env` 底下。
</Warning>

### SSE / HTTP 傳輸

透過 HTTP Server-Sent Events 連線到遠端 MCP 伺服器。

| 欄位                  | 說明                                           |
| --------------------- | ---------------------------------------------- |
| `url`                 | 遠端伺服器的 HTTP 或 HTTPS URL（必要）         |
| `headers`             | 選用的 HTTP 標頭鍵值對應（例如驗證 token）     |
| `connectionTimeoutMs` | 每個伺服器的連線逾時時間，以 ms 為單位（選用） |

範例：

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

`url`（userinfo）和 `headers` 中的敏感值會在記錄和狀態輸出中遮蔽。

### Streamable HTTP 傳輸

`streamable-http` 是 `sse` 和 `stdio` 之外的另一個傳輸選項。它使用 HTTP 串流與遠端 MCP 伺服器進行雙向通訊。

| 欄位                  | 說明                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------ |
| `url`                 | 遠端伺服器的 HTTP 或 HTTPS URL（必要）                                               |
| `transport`           | 設為 `"streamable-http"` 以選取此傳輸；省略時，OpenClaw 會使用 `sse`                |
| `headers`             | 選用的 HTTP 標頭鍵值對應（例如驗證 token）                                           |
| `connectionTimeoutMs` | 每個伺服器的連線逾時時間，以 ms 為單位（選用）                                       |

OpenClaw 設定會使用 `transport: "streamable-http"` 作為標準拼法。透過 `openclaw mcp set` 儲存時會接受 CLI 原生的 MCP `type: "http"` 值，且現有設定會由 `openclaw doctor --fix` 修復，但 `transport` 才是嵌入式 Pi 直接使用的值。

範例：

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectionTimeoutMs": 10000,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

<Note>
這些命令只管理已儲存的設定。它們不會啟動頻道橋接器、開啟即時 MCP 用戶端工作階段，或證明目標伺服器可連線。
</Note>

## 目前限制

本頁記錄的是目前已發布的橋接器。

目前限制：

- 對話探索取決於既有的 Gateway 工作階段路由中繼資料
- 除了 Claude 專用轉接器之外，沒有通用推送協定
- 尚無訊息編輯或反應工具
- HTTP/SSE/streamable-http 傳輸會連線到單一遠端伺服器；尚無多工上游
- `permissions_list_open` 只包含橋接器連線期間觀察到的核准

## 相關

- [CLI 參考](/zh-TW/cli)
- [Plugin](/zh-TW/cli/plugins)
