---
read_when:
    - 你想要安裝與 Codex、Claude 或 Cursor 相容的套件組合
    - 你需要瞭解 OpenClaw 如何將套件組合內容對應至原生功能
    - 你正在偵錯套件組合偵測或功能缺失問題
summary: 將 Codex、Claude 與 Cursor 套件組安裝並作為 OpenClaw 外掛使用
title: 外掛套件組合
x-i18n:
    generated_at: "2026-07-11T21:33:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d44006866238f53ee2e3e8126cc4f7ed6f7413534257775f7904c9b877778c59
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw 可以從三個外部生態系統安裝外掛：**Codex**、**Claude**
和 **Cursor**。這些稱為**套件組合**，也就是內容與中繼資料套件；
OpenClaw 會將其對應至 Skills、鉤子及 MCP 工具等原生功能。

<Info>
  套件組合與原生 OpenClaw 外掛**並不相同**。原生外掛會在處理程序內執行，
  並可註冊任何功能。套件組合是採用選擇性功能對應且信任邊界較窄的內容套件。
</Info>

## 為何需要套件組合

許多實用的外掛是以 Codex、Claude 或 Cursor 格式發布。OpenClaw
不要求作者將它們重寫為原生 OpenClaw 外掛，而是偵測這些格式，
並將其支援的內容對應至原生功能集。你可以安裝 Claude 命令套件或
Codex Skills 套件組合，並立即使用。

## 安裝套件組合

<Steps>
  <Step title="從目錄、封存檔或市集安裝">
    ```bash
    # 本機目錄
    openclaw plugins install ./my-bundle

    # 封存檔
    openclaw plugins install ./my-bundle.tgz

    # Claude 市集
    openclaw plugins marketplace list <source>
    openclaw plugins install <plugin> --marketplace <source>
    ```

    `<source>` 是本機市集路徑／儲存庫，或 git／GitHub 來源。

  </Step>

  <Step title="驗證偵測結果">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    套件組合會顯示 `Format: bundle`，並附有值為 `codex`、
    `claude` 或 `cursor` 的 `Bundle format:`。

  </Step>

  <Step title="重新啟動並使用">
    ```bash
    openclaw gateway restart
    ```

    對應後的功能（Skills、鉤子、MCP 工具、LSP 預設值）會在下一個工作階段中可用。

  </Step>
</Steps>

## OpenClaw 會從套件組合對應哪些內容

目前並非每項套件組合功能都能在 OpenClaw 中執行。以下列出目前可運作的功能，
以及已偵測但尚未接線的功能。

### 目前支援

| 功能          | 對應方式                                                                                          | 適用格式       |
| ------------- | ------------------------------------------------------------------------------------------------- | -------------- |
| Skills 內容   | 套件組合的 Skills 根目錄會載入為一般 OpenClaw Skills                                              | 所有格式       |
| 命令          | 將 `commands/` 和 `.cursor/commands/` 視為 Skills 根目錄                                          | Claude、Cursor |
| 鉤子套件      | OpenClaw 風格的 `HOOK.md` + `handler.ts` 配置                                                     | Codex          |
| MCP 工具      | 將套件組合的 MCP 設定合併至內嵌 OpenClaw 設定；載入受支援的 stdio 和 HTTP 伺服器                  | 所有格式       |
| LSP 伺服器    | 將 Claude `.lsp.json` 和資訊清單宣告的 `lspServers` 合併至內嵌 OpenClaw LSP 預設值                | Claude         |
| 設定          | 將 Claude `settings.json` 匯入為內嵌 OpenClaw 預設值                                              | Claude         |

#### Skills 內容

- 套件組合的 Skills 根目錄會載入為一般 OpenClaw Skills 根目錄。
- Claude `commands/` 根目錄會被視為額外的 Skills 根目錄。
- Cursor `.cursor/commands/` 根目錄會被視為額外的 Skills 根目錄。

Claude Markdown 命令檔與 Cursor 命令 Markdown 都能透過一般的
OpenClaw Skills 載入器運作。

#### 鉤子套件

套件組合的鉤子根目錄**只有**在使用一般 OpenClaw 鉤子套件配置時才能運作：
`HOOK.md` 加上 `handler.ts` 或 `handler.js`。目前這主要適用於
與 Codex 相容的情況。

#### 內嵌 OpenClaw 的 MCP

- 已啟用的套件組合可提供 MCP 伺服器設定。
- OpenClaw 會將套件組合的 MCP 設定以 `mcpServers` 合併至實際生效的
  內嵌 OpenClaw 設定。
- OpenClaw 會在內嵌 OpenClaw 代理程式回合期間，透過啟動 stdio
  伺服器或連線至 HTTP 伺服器，公開受支援的套件組合 MCP 工具。
- `coding` 和 `messaging` 工具設定檔預設包含套件組合 MCP 工具；
  若要讓代理程式或閘道停用，請使用 `tools.deny: ["bundle-mcp"]`。
- 專案本機的內嵌代理程式設定仍會在套件組合預設值之後套用，因此有需要時，
  工作區設定可覆寫套件組合 MCP 項目。
- 套件組合 MCP 工具目錄會在註冊前以確定性方式排序，因此上游
  `listTools()` 順序變更不會反覆擾動提示快取的工具區塊。

##### 傳輸方式

MCP 伺服器可使用 stdio 或 HTTP 傳輸方式。

**Stdio** 會啟動子處理程序：

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

**HTTP** 會連線至執行中的 MCP 伺服器；除非要求使用
`streamable-http`，否則預設為 `sse`：

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

- `transport` 接受 `"streamable-http"` 或 `"sse"`；省略時預設為 `sse`。
- `type: "http"` 是命令列介面原生的下游格式；在 OpenClaw 設定中請使用 `transport: "streamable-http"`。`openclaw mcp set` 和 `openclaw doctor --fix` 會正規化此常見別名。
- 僅允許 `http:` 和 `https:` URL 配置。
- `headers` 值支援 `${ENV_VAR}` 插值。
- 同時包含 `command` 和 `url` 的伺服器項目會遭拒絕。
- URL 憑證（使用者資訊與查詢參數）會從工具說明和日誌中遮蔽。
- `connectionTimeoutMs` 會覆寫 stdio 與 HTTP 傳輸方式預設的 30 秒連線逾時。
  請求逾時預設為 60 秒，並可使用 `requestTimeoutMs` 覆寫。

##### 工具命名

OpenClaw 會以 `serverName__toolName` 格式，使用供應商安全的名稱來註冊
套件組合 MCP 工具。例如，索引鍵為 `"vigil-harbor"` 的伺服器公開
`memory_search` 工具時，會註冊為 `vigil-harbor__memory_search`。

- `A-Za-z0-9_-` 以外的字元會替換為 `-`。
- 開頭不是字母的片段會加上字母前綴，因此 `12306` 等數字伺服器索引鍵
  會轉換為供應商安全的工具前綴。
- 伺服器前綴長度上限為 30 個字元。
- 完整工具名稱長度上限為 64 個字元。
- 空白伺服器名稱會退回使用 `mcp`。
- 經清理後發生衝突的名稱會以數字後綴區分。
- 最終公開的工具會依安全名稱採用確定性順序，使重複的內嵌代理程式回合
  保持快取穩定。
- 設定檔篩選會將同一套件組合 MCP 伺服器中的所有工具視為由
  `bundle-mcp` 外掛擁有，因此設定檔允許／拒絕清單可引用個別公開工具名稱，
  或 `bundle-mcp` 外掛索引鍵。

#### 內嵌 OpenClaw 設定

套件組合啟用時，Claude `settings.json` 會匯入為預設的內嵌 OpenClaw 設定。
OpenClaw 會先清理下列 shell 覆寫索引鍵，再套用設定：

- `shellPath`
- `shellCommandPrefix`

#### 內嵌 OpenClaw LSP

- 已啟用的 Claude 套件組合可提供 LSP 伺服器設定。
- OpenClaw 會載入 `.lsp.json`，以及資訊清單宣告的任何 `lspServers` 路徑。
- 套件組合 LSP 設定會合併至實際生效的內嵌 OpenClaw LSP 預設值。
- 目前只有受支援且以 stdio 為基礎的 LSP 伺服器可執行；不受支援的
  傳輸方式仍會顯示在 `openclaw plugins inspect <id>` 中。

### 已偵測但不執行

下列項目可被辨識並顯示於診斷資訊中，但 OpenClaw 不會執行：

- Claude `agents`、`hooks/hooks.json` 自動化、`outputStyles`
- Cursor `.cursor/agents`、`.cursor/hooks.json`、`.cursor/rules`
- Codex `.app.json` 中超出功能回報範圍的中繼資料

## 套件組合格式

<AccordionGroup>
  <Accordion title="Codex 套件組合">
    標記：`.codex-plugin/plugin.json`

    選用內容：`skills/`、`hooks/`、`.mcp.json`、`.app.json`

    Codex 套件組合使用 Skills 根目錄和 OpenClaw 風格的鉤子套件目錄
    （`HOOK.md` + `handler.ts`）時，最能契合 OpenClaw。

  </Accordion>

  <Accordion title="Claude 套件組合">
    兩種偵測模式：

    - **以資訊清單為基礎：**`.claude-plugin/plugin.json`
    - **無資訊清單：**預設 Claude 配置（`skills/`、`commands/`、`agents/`、`hooks/`、`.mcp.json`、`.lsp.json`、`settings.json`）

    Claude 特有行為：

    - `commands/` 會被視為 Skills 內容
    - `settings.json` 會匯入至內嵌 OpenClaw 設定（shell 覆寫索引鍵會經過清理）
    - `.mcp.json` 會向內嵌 OpenClaw 公開受支援的 stdio 工具
    - `.lsp.json` 與資訊清單宣告的 `lspServers` 路徑會載入至內嵌 OpenClaw LSP 預設值
    - `hooks/hooks.json` 會被偵測但不執行
    - 資訊清單中的自訂元件路徑為附加性質；它們會擴充而非取代預設值

  </Accordion>

  <Accordion title="Cursor 套件組合">
    標記：`.cursor-plugin/plugin.json`

    選用內容：`skills/`、`.cursor/commands/`、`.cursor/agents/`、`.cursor/rules/`、`.cursor/hooks.json`、`.mcp.json`

    - `.cursor/commands/` 會被視為 Skills 內容
    - `.cursor/rules/`、`.cursor/agents/` 和 `.cursor/hooks.json` 僅供偵測

  </Accordion>
</AccordionGroup>

## 偵測優先順序

OpenClaw 會先檢查原生外掛格式：

1. `openclaw.plugin.json`，或具有 `openclaw.extensions` 的有效 `package.json`——視為**原生外掛**
2. 套件組合標記（`.codex-plugin/`、`.claude-plugin/` 或預設 Claude／Cursor 配置）——視為**套件組合**

若目錄同時包含兩者，OpenClaw 會使用原生路徑。這可防止雙格式套件
被部分安裝為套件組合。

## 執行階段相依性與清理

- 第三方相容套件組合不會在啟動時進行 `npm install` 修復。它們應透過
  `openclaw plugins install` 安裝，並在已安裝的外掛目錄中隨附所需的一切。
- OpenClaw 擁有的內建外掛會以輕量形式隨核心提供，或可透過外掛安裝程式下載。
  閘道啟動時絕不會為它們執行套件管理器。
- `openclaw doctor --fix` 會移除過時的本機內建外掛安裝記錄；若設定仍引用
  本機外掛索引中缺少的可下載外掛，也可進行復原。

## 安全性

套件組合的信任邊界比原生外掛更窄：

- OpenClaw **不會**在處理程序內載入任意套件組合執行階段模組。
- Skills 和鉤子套件路徑必須位於外掛根目錄內（會檢查邊界）。
- 讀取設定檔時會採用相同的邊界檢查。
- 受支援的 stdio MCP 伺服器可能會以子處理程序啟動。

這使套件組合在預設情況下更安全，但對於第三方套件組合所公開的功能，
你仍應將其視為受信任內容。

## 疑難排解

<AccordionGroup>
  <Accordion title="已偵測套件組合，但功能未執行">
    執行 `openclaw plugins inspect <id>`。若某項功能已列出但標示為尚未接線，
    這是產品限制，而非安裝損壞。
  </Accordion>

  <Accordion title="Claude 命令檔未出現">
    請確認套件組合已啟用，且 Markdown 檔案位於已偵測的
    `commands/` 或 `skills/` 根目錄內。
  </Accordion>

  <Accordion title="Claude 設定未套用">
    僅支援來自 `settings.json` 的內嵌 OpenClaw 設定。OpenClaw
    不會將套件組合設定視為原始設定修補程式。
  </Accordion>

  <Accordion title="Claude 鉤子未執行">
    `hooks/hooks.json` 僅供偵測。若需要可執行的鉤子，請使用
    OpenClaw 鉤子套件配置，或提供原生外掛。
  </Accordion>
</AccordionGroup>

## 相關內容

- [安裝與設定外掛](/zh-TW/tools/plugin)
- [建置外掛](/zh-TW/plugins/building-plugins)——建立原生外掛
- [外掛資訊清單](/zh-TW/plugins/manifest)——原生資訊清單結構描述
