---
read_when:
    - 您想安裝與 Codex、Claude 或 Cursor 相容的套件包
    - 您需要了解 OpenClaw 如何將套件內容對應到原生功能
    - 您正在偵錯套件組合偵測或缺少的功能
summary: 將 Codex、Claude 和 Cursor 套件作為 OpenClaw Plugin 安裝並使用
title: Plugin 套件包
x-i18n:
    generated_at: "2026-05-05T01:47:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5bc06300e765e2faaf51800462003e242d29d4102ac9feaa47f86d4ad35bf157
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw 可以從三個外部生態系安裝 Plugin：**Codex**、**Claude**，
以及 **Cursor**。這些稱為 **套件包**，也就是內容與中介資料套件，
OpenClaw 會將其對應到 Skills、hook 和 MCP 工具等原生功能。

<Info>
  套件包與 OpenClaw 原生 Plugin **不同**。原生 Plugin 會在程序內執行，
  並且可以註冊任何能力。套件包是內容套件，具有選擇性的功能對應，
  並且信任邊界較窄。
</Info>

## 為什麼存在套件包

許多實用 Plugin 會以 Codex、Claude 或 Cursor 格式發布。OpenClaw 不要求
作者將它們重寫成 OpenClaw 原生 Plugin，而是偵測這些格式，並將其支援的
內容對應到原生功能集。這代表你可以安裝 Claude 指令套件或 Codex skill
套件包，並立即使用。

## 安裝套件包

<Steps>
  <Step title="從目錄、封存檔或市集安裝">
    ```bash
    # Local directory
    openclaw plugins install ./my-bundle

    # Archive
    openclaw plugins install ./my-bundle.tgz

    # Claude marketplace
    openclaw plugins marketplace list <marketplace-name>
    openclaw plugins install <plugin-name>@<marketplace-name>
    ```

  </Step>

  <Step title="驗證偵測結果">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    套件包會顯示為 `Format: bundle`，並帶有 `codex`、`claude` 或 `cursor` 子類型。

  </Step>

  <Step title="重新啟動並使用">
    ```bash
    openclaw gateway restart
    ```

    對應後的功能（Skills、hook、MCP 工具、LSP 預設值）會在下一個工作階段可用。

  </Step>
</Steps>

## OpenClaw 從套件包對應哪些內容

並非所有套件包功能目前都會在 OpenClaw 中執行。以下列出哪些可用，
以及哪些已偵測但尚未接線。

### 目前支援

| 功能          | 對應方式                                                                                    | 適用於         |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| Skill 內容    | 套件包 skill 根目錄會以一般 OpenClaw Skills 載入                                           | 所有格式       |
| 指令          | `commands/` 和 `.cursor/commands/` 會被視為 skill 根目錄                                   | Claude、Cursor |
| Hook 套件     | OpenClaw 風格的 `HOOK.md` + `handler.ts` 版面配置                                           | Codex          |
| MCP 工具      | 套件包 MCP 設定會合併到內嵌 Pi 設定；支援的 stdio 和 HTTP 伺服器會被載入                   | 所有格式       |
| LSP 伺服器    | Claude `.lsp.json` 和 manifest 宣告的 `lspServers` 會合併到內嵌 Pi LSP 預設值              | Claude         |
| 設定          | Claude `settings.json` 會匯入為內嵌 Pi 預設值                                               | Claude         |

#### Skill 內容

- 套件包 skill 根目錄會以一般 OpenClaw skill 根目錄載入
- Claude `commands` 根目錄會被視為額外的 skill 根目錄
- Cursor `.cursor/commands` 根目錄會被視為額外的 skill 根目錄

這代表 Claude Markdown 指令檔會透過一般 OpenClaw skill 載入器運作。
Cursor 指令 Markdown 也會透過同一路徑運作。

#### Hook 套件

- 套件包 hook 根目錄**只有**在使用一般 OpenClaw hook 套件版面配置時才會運作。
  目前這主要是與 Codex 相容的情況：
  - `HOOK.md`
  - `handler.ts` 或 `handler.js`

#### Pi 的 MCP

- 啟用的套件包可以提供 MCP 伺服器設定
- OpenClaw 會將套件包 MCP 設定合併到有效的內嵌 Pi 設定中，作為
  `mcpServers`
- OpenClaw 會在內嵌 Pi agent 回合期間，透過啟動 stdio 伺服器或連線到 HTTP 伺服器，
  公開支援的套件包 MCP 工具
- `coding` 和 `messaging` 工具設定檔預設包含套件包 MCP 工具；
  若要讓 agent 或 gateway 停用，請使用 `tools.deny: ["bundle-mcp"]`
- 專案本機 Pi 設定仍會在套件包預設值之後套用，因此工作區設定可以在需要時覆寫套件包 MCP 項目
- 套件包 MCP 工具目錄會在註冊前以確定性方式排序，因此上游 `listTools()` 順序變更不會造成提示快取工具區塊反覆變動

##### 傳輸

MCP 伺服器可以使用 stdio 或 HTTP 傳輸：

**Stdio** 會啟動子程序：

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "command": "node",
        "args": ["server.js"],
        "env": { "PORT": "3000" }
      }
    }
  }
}
```

**HTTP** 預設會透過 `sse` 連線到執行中的 MCP 伺服器，或在要求時使用 `streamable-http`：

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "url": "http://localhost:3100/mcp",
        "transport": "streamable-http",
        "headers": {
          "Authorization": "Bearer ${MY_SECRET_TOKEN}"
        },
        "connectionTimeoutMs": 30000
      }
    }
  }
}
```

- `transport` 可以設為 `"streamable-http"` 或 `"sse"`；省略時，OpenClaw 會使用 `sse`
- `type: "http"` 是 CLI 原生的下游形狀；在 OpenClaw 設定中請使用 `transport: "streamable-http"`。`openclaw mcp set` 和 `openclaw doctor --fix` 會正規化常見別名。
- 只允許 `http:` 和 `https:` URL scheme
- `headers` 值支援 `${ENV_VAR}` 插值
- 同時具有 `command` 和 `url` 的伺服器項目會被拒絕
- URL 憑證（使用者資訊和查詢參數）會從工具說明和日誌中遮蔽
- `connectionTimeoutMs` 會覆寫 stdio 和 HTTP 傳輸的預設 30 秒連線逾時

##### 工具命名

OpenClaw 會以供應商安全名稱註冊套件包 MCP 工具，格式為
`serverName__toolName`。例如，鍵名為 `"vigil-harbor"` 的伺服器公開
`memory_search` 工具時，會註冊為 `vigil-harbor__memory_search`。

- `A-Za-z0-9_-` 以外的字元會替換為 `-`
- 伺服器前綴上限為 30 個字元
- 完整工具名稱上限為 64 個字元
- 空的伺服器名稱會退回使用 `mcp`
- 發生衝突的清理後名稱會以數字後綴消除歧義
- 最終公開的工具順序會依安全名稱確定性排序，以保持重複 Pi 回合的快取穩定
- 設定檔篩選會將同一個套件包 MCP 伺服器中的所有工具視為由 `bundle-mcp` 擁有的 Plugin，
  因此設定檔允許清單和拒絕清單可以包含個別公開的工具名稱，或 `bundle-mcp` Plugin 鍵

#### 內嵌 Pi 設定

- 啟用套件包時，Claude `settings.json` 會匯入為預設內嵌 Pi 設定
- OpenClaw 會先清理 shell 覆寫鍵，再套用它們

清理後的鍵：

- `shellPath`
- `shellCommandPrefix`

#### 內嵌 Pi LSP

- 啟用的 Claude 套件包可以提供 LSP 伺服器設定
- OpenClaw 會載入 `.lsp.json` 以及任何 manifest 宣告的 `lspServers` 路徑
- 套件包 LSP 設定會合併到有效的內嵌 Pi LSP 預設值中
- 目前只有支援的 stdio 後端 LSP 伺服器可執行；不支援的傳輸仍會顯示在 `openclaw plugins inspect <id>` 中

### 已偵測但不執行

以下項目會被辨識並顯示在診斷中，但 OpenClaw 不會執行它們：

- Claude `agents`、`hooks.json` 自動化、`outputStyles`
- Cursor `.cursor/agents`、`.cursor/hooks.json`、`.cursor/rules`
- Codex 行內/app 中介資料，能力回報以外的部分

## 套件包格式

<AccordionGroup>
  <Accordion title="Codex 套件包">
    標記：`.codex-plugin/plugin.json`

    選用內容：`skills/`、`hooks/`、`.mcp.json`、`.app.json`

    當 Codex 套件包使用 skill 根目錄和 OpenClaw 風格的 hook 套件目錄
    （`HOOK.md` + `handler.ts`）時，最適合 OpenClaw。

  </Accordion>

  <Accordion title="Claude 套件包">
    兩種偵測模式：

    - **以 Manifest 為基礎：** `.claude-plugin/plugin.json`
    - **無 Manifest：** 預設 Claude 版面配置（`skills/`、`commands/`、`agents/`、`hooks/`、`.mcp.json`、`.lsp.json`、`settings.json`）

    Claude 專屬行為：

    - `commands/` 會被視為 skill 內容
    - `settings.json` 會匯入到內嵌 Pi 設定（shell 覆寫鍵會被清理）
    - `.mcp.json` 會向內嵌 Pi 公開支援的 stdio 工具
    - `.lsp.json` 以及 manifest 宣告的 `lspServers` 路徑會載入到內嵌 Pi LSP 預設值
    - `hooks/hooks.json` 會被偵測，但不會執行
    - manifest 中的自訂元件路徑是累加式的（它們會擴充預設值，而不是取代預設值）

  </Accordion>

  <Accordion title="Cursor 套件包">
    標記：`.cursor-plugin/plugin.json`

    選用內容：`skills/`、`.cursor/commands/`、`.cursor/agents/`、`.cursor/rules/`、`.cursor/hooks.json`、`.mcp.json`

    - `.cursor/commands/` 會被視為 skill 內容
    - `.cursor/rules/`、`.cursor/agents/` 和 `.cursor/hooks.json` 只會被偵測

  </Accordion>
</AccordionGroup>

## 偵測優先順序

OpenClaw 會先檢查原生 Plugin 格式：

1. `openclaw.plugin.json` 或具有 `openclaw.extensions` 的有效 `package.json` — 視為**原生 Plugin**
2. 套件包標記（`.codex-plugin/`、`.claude-plugin/`，或預設 Claude/Cursor 版面配置）— 視為**套件包**

如果目錄同時包含兩者，OpenClaw 會使用原生路徑。這可避免雙格式套件被部分安裝為套件包。

## 執行階段相依性與清理

- 第三方相容套件包不會取得啟動時的 `npm install` 修復。它們應透過 `openclaw plugins install` 安裝，
  並在已安裝的 Plugin 目錄中附帶所需的一切。
- OpenClaw 擁有的套裝 Plugin 會以輕量形式隨核心出貨，或可透過 Plugin 安裝程式下載。
  Gateway 啟動時永遠不會為它們執行套件管理器。
- `openclaw doctor --fix` 會移除舊版暫存相依性目錄，並且在設定引用本機 Plugin 索引中缺少的可下載 Plugin 時，
  可以復原這些 Plugin。

## 安全性

套件包的信任邊界比原生 Plugin 更窄：

- OpenClaw **不會**在程序內載入任意套件包執行階段模組
- Skills 和 hook 套件路徑必須留在 Plugin 根目錄內（會檢查邊界）
- 設定檔會以相同的邊界檢查讀取
- 支援的 stdio MCP 伺服器可以作為子程序啟動

這讓套件包預設更安全，但你仍應將第三方套件包視為其公開功能的可信內容。

## 疑難排解

<AccordionGroup>
  <Accordion title="已偵測到套件包，但能力未執行">
    執行 `openclaw plugins inspect <id>`。如果某項能力已列出但標示為
    尚未接線，那是產品限制，而不是安裝損壞。
  </Accordion>

  <Accordion title="Claude 指令檔未出現">
    請確認套件包已啟用，且 Markdown 檔案位於已偵測到的
    `commands/` 或 `skills/` 根目錄內。
  </Accordion>

  <Accordion title="Claude 設定未套用">
    只支援來自 `settings.json` 的內嵌 Pi 設定。OpenClaw 不會將套件包設定
    視為原始設定修補。
  </Accordion>

  <Accordion title="Claude hook 未執行">
    `hooks/hooks.json` 只會被偵測。如果你需要可執行的 hook，請使用
    OpenClaw hook 套件版面配置，或出貨原生 Plugin。
  </Accordion>
</AccordionGroup>

## 相關內容

- [安裝和設定 Plugin](/zh-TW/tools/plugin)
- [建置 Plugin](/zh-TW/plugins/building-plugins) — 建立原生 Plugin
- [Plugin Manifest](/zh-TW/plugins/manifest) — 原生 manifest schema
