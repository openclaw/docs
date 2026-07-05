---
read_when:
    - 你想要安裝與 Codex、Claude 或 Cursor 相容的套件組
    - 你需要了解 OpenClaw 如何將套件內容對應到原生功能
    - 您正在偵錯套件偵測或缺少的功能
summary: 安裝 Codex、Claude 和 Cursor 套件組並作為 OpenClaw 外掛使用
title: 外掛套件包
x-i18n:
    generated_at: "2026-07-05T11:34:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d44006866238f53ee2e3e8126cc4f7ed6f7413534257775f7904c9b877778c59
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw 可以從三個外部生態系安裝外掛：**Codex**、**Claude**
和 **Cursor**。這些稱為 **套件包** - 內容與中繼資料包，OpenClaw 會將其對應到 Skills、hook 和 MCP 工具等原生功能。

<Info>
  套件包與原生 OpenClaw 外掛**不同**。原生外掛會在處理程序內執行，並且可以註冊任何能力。套件包是內容包，具有選擇性的功能對應和較窄的信任邊界。
</Info>

## 為什麼存在套件包

許多實用外掛會以 Codex、Claude 或 Cursor 格式發布。OpenClaw 不要求作者將它們重寫為原生 OpenClaw 外掛，而是偵測這些格式，並將其支援的內容對應到原生功能集。你可以安裝 Claude 命令包或 Codex 技能套件包，並立即使用。

## 安裝套件包

<Steps>
  <Step title="Install from a directory, archive, or marketplace">
    ```bash
    # Local directory
    openclaw plugins install ./my-bundle

    # Archive
    openclaw plugins install ./my-bundle.tgz

    # Claude marketplace
    openclaw plugins marketplace list <source>
    openclaw plugins install <plugin> --marketplace <source>
    ```

    `<source>` 是本機 marketplace 路徑/儲存庫，或 git/GitHub 來源。

  </Step>

  <Step title="Verify detection">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    套件包會顯示 `Format: bundle`，並附帶 `Bundle format:` 值為 `codex`、`claude` 或 `cursor`。

  </Step>

  <Step title="Restart and use">
    ```bash
    openclaw gateway restart
    ```

    對應後的功能（Skills、hook、MCP 工具、LSP 預設值）會在下一個工作階段可用。

  </Step>
</Steps>

## OpenClaw 會從套件包對應哪些內容

目前並非每個套件包功能都會在 OpenClaw 中執行。以下是可用項目，以及已偵測但尚未接線的項目。

### 目前支援

| 功能       | 對應方式                                                                                       | 適用於     |
| ------------- | ------------------------------------------------------------------------------------------------- | -------------- |
| 技能內容 | 套件包技能根目錄會以一般 OpenClaw Skills 載入                                                 | 所有格式    |
| 命令      | `commands/` 和 `.cursor/commands/` 會被視為技能根目錄                                        | Claude、Cursor |
| Hook 包    | OpenClaw 風格的 `HOOK.md` + `handler.ts` 版面配置                                                   | Codex          |
| MCP 工具     | 套件包 MCP 設定會合併到嵌入式 OpenClaw 設定；支援的 stdio 和 HTTP 伺服器會被載入 | 所有格式    |
| LSP 伺服器   | Claude `.lsp.json` 和資訊清單宣告的 `lspServers` 會合併到嵌入式 OpenClaw LSP 預設值  | Claude         |
| 設定      | Claude `settings.json` 會匯入為嵌入式 OpenClaw 預設值                                     | Claude         |

#### 技能內容

- 套件包技能根目錄會以一般 OpenClaw 技能根目錄載入。
- Claude `commands/` 根目錄會被視為額外的技能根目錄。
- Cursor `.cursor/commands/` 根目錄會被視為額外的技能根目錄。

Claude markdown 命令檔和 Cursor 命令 markdown 都會透過一般 OpenClaw 技能載入器運作。

#### Hook 包

套件包 hook 根目錄**只有**在使用一般 OpenClaw hook 包版面配置時才會運作：`HOOK.md` 加上 `handler.ts` 或 `handler.js`。目前這主要是與 Codex 相容的情境。

#### 嵌入式 OpenClaw 的 MCP

- 已啟用的套件包可以提供 MCP 伺服器設定。
- OpenClaw 會將套件包 MCP 設定合併到有效的嵌入式 OpenClaw 設定中，作為 `mcpServers`。
- OpenClaw 會透過啟動 stdio 伺服器或連線到 HTTP 伺服器，在嵌入式 OpenClaw 代理程式回合期間公開支援的套件包 MCP 工具。
- `coding` 和 `messaging` 工具設定檔預設包含套件包 MCP 工具；使用 `tools.deny: ["bundle-mcp"]` 可為代理程式或閘道退出。
- 專案本機的嵌入式代理程式設定仍會在套件包預設值之後套用，因此工作區設定可在需要時覆寫套件包 MCP 項目。
- 套件包 MCP 工具目錄會在註冊前以確定性方式排序，因此上游 `listTools()` 順序變更不會反覆擾動提示快取工具區塊。

##### 傳輸

MCP 伺服器可以使用 stdio 或 HTTP 傳輸。

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

**HTTP** 會連線到執行中的 MCP 伺服器，除非要求 `streamable-http`，否則預設為 `sse`：

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
- `type: "http"` 是命令列介面原生的下游形狀；請在 OpenClaw 設定中使用 `transport: "streamable-http"`。`openclaw mcp set` 和 `openclaw doctor --fix` 會正規化常見別名。
- 只允許 `http:` 和 `https:` URL 配置。
- `headers` 值支援 `${ENV_VAR}` 插值。
- 同時具有 `command` 和 `url` 的伺服器項目會被拒絕。
- URL 憑證（userinfo 和查詢參數）會從工具描述與記錄中遮蔽。
- `connectionTimeoutMs` 會覆寫 stdio 和 HTTP 傳輸的預設 30 秒連線逾時。請求逾時預設為 60 秒，並可用 `requestTimeoutMs` 覆寫。

##### 工具命名

OpenClaw 會使用供應商安全名稱註冊套件包 MCP 工具，格式為 `serverName__toolName`。例如，鍵為 `"vigil-harbor"` 的伺服器公開 `memory_search` 工具時，會註冊為 `vigil-harbor__memory_search`。

- `A-Za-z0-9_-` 以外的字元會被替換為 `-`。
- 會以非字母開頭的片段會取得字母前綴，因此像 `12306` 這樣的數字伺服器鍵會變成供應商安全的工具前綴。
- 伺服器前綴上限為 30 個字元。
- 完整工具名稱上限為 64 個字元。
- 空的伺服器名稱會退回為 `mcp`。
- 發生衝突的清理後名稱會使用數字尾碼區分。
- 最終公開工具順序會依安全名稱確定性排序，讓重複的嵌入式代理程式回合維持快取穩定。
- 設定檔篩選會將來自同一個套件包 MCP 伺服器的每個工具視為由 `bundle-mcp` 外掛擁有，因此設定檔允許/拒絕清單可以參照個別公開工具名稱或 `bundle-mcp` 外掛鍵。

#### 嵌入式 OpenClaw 設定

啟用套件包時，Claude `settings.json` 會匯入為預設嵌入式 OpenClaw 設定。OpenClaw 會在套用 shell 覆寫鍵之前先加以清理：

- `shellPath`
- `shellCommandPrefix`

#### 嵌入式 OpenClaw LSP

- 已啟用的 Claude 套件包可以提供 LSP 伺服器設定。
- OpenClaw 會載入 `.lsp.json` 加上任何資訊清單宣告的 `lspServers` 路徑。
- 套件包 LSP 設定會合併到有效的嵌入式 OpenClaw LSP 預設值中。
- 目前只有支援的 stdio 後端 LSP 伺服器可以執行；不支援的傳輸仍會顯示在 `openclaw plugins inspect <id>` 中。

### 已偵測但未執行

這些項目會被辨識並顯示在診斷中，但 OpenClaw 不會執行它們：

- Claude `agents`、`hooks/hooks.json` 自動化、`outputStyles`
- Cursor `.cursor/agents`、`.cursor/hooks.json`、`.cursor/rules`
- Codex `.app.json` 中繼資料，能力回報以外的部分

## 套件包格式

<AccordionGroup>
  <Accordion title="Codex bundles">
    標記：`.codex-plugin/plugin.json`

    選用內容：`skills/`、`hooks/`、`.mcp.json`、`.app.json`

    當 Codex 套件包使用技能根目錄和 OpenClaw 風格 hook 包目錄（`HOOK.md` + `handler.ts`）時，最適合 OpenClaw。

  </Accordion>

  <Accordion title="Claude bundles">
    兩種偵測模式：

    - **以資訊清單為基礎：** `.claude-plugin/plugin.json`
    - **無資訊清單：** 預設 Claude 版面配置（`skills/`、`commands/`、`agents/`、`hooks/`、`.mcp.json`、`.lsp.json`、`settings.json`）

    Claude 專屬行為：

    - `commands/` 會被視為技能內容
    - `settings.json` 會匯入嵌入式 OpenClaw 設定（shell 覆寫鍵會被清理）
    - `.mcp.json` 會向嵌入式 OpenClaw 公開支援的 stdio 工具
    - `.lsp.json` 加上資訊清單宣告的 `lspServers` 路徑會載入到嵌入式 OpenClaw LSP 預設值
    - `hooks/hooks.json` 會被偵測但不會執行
    - 資訊清單中的自訂元件路徑是加成式的；它們會擴充預設值，而非取代預設值

  </Accordion>

  <Accordion title="Cursor bundles">
    標記：`.cursor-plugin/plugin.json`

    選用內容：`skills/`、`.cursor/commands/`、`.cursor/agents/`、`.cursor/rules/`、`.cursor/hooks.json`、`.mcp.json`

    - `.cursor/commands/` 會被視為技能內容
    - `.cursor/rules/`、`.cursor/agents/` 和 `.cursor/hooks.json` 僅會偵測

  </Accordion>
</AccordionGroup>

## 偵測優先順序

OpenClaw 會先檢查原生外掛格式：

1. `openclaw.plugin.json` 或具有 `openclaw.extensions` 的有效 `package.json` - 視為**原生外掛**
2. 套件包標記（`.codex-plugin/`、`.claude-plugin/`，或預設 Claude/Cursor 版面配置）- 視為**套件包**

如果目錄同時包含兩者，OpenClaw 會使用原生路徑。這可防止雙格式套件被部分安裝為套件包。

## 執行階段依賴與清理

- 第三方相容套件包不會取得啟動時的 `npm install` 修復。它們應透過 `openclaw plugins install` 安裝，並將所需的一切隨附在已安裝的外掛目錄中。
- OpenClaw 擁有的內建外掛會以輕量方式隨核心發布，或可透過外掛安裝程式下載。閘道啟動時永遠不會為它們執行套件管理器。
- `openclaw doctor --fix` 會移除過時的本機內建外掛安裝記錄，並且在設定仍參照可下載外掛但本機外掛索引缺少它們時，可以復原這些外掛。

## 安全性

套件包的信任邊界比原生外掛更窄：

- OpenClaw **不會**在處理程序內載入任意套件包執行階段模組。
- Skills 和 hook 包路徑必須留在外掛根目錄內（會進行邊界檢查）。
- 設定檔會以相同邊界檢查讀取。
- 支援的 stdio MCP 伺服器可能會作為子處理程序啟動。

這讓套件包預設更安全，但你仍應將第三方套件包視為其所公開功能的受信任內容。

## 疑難排解

<AccordionGroup>
  <Accordion title="Bundle is detected but capabilities do not run">
    執行 `openclaw plugins inspect <id>`。如果某項能力列出但標記為尚未接線，那是產品限制，不是安裝損壞。
  </Accordion>

  <Accordion title="Claude command files do not appear">
    確認套件包已啟用，且 markdown 檔案位於已偵測到的 `commands/` 或 `skills/` 根目錄內。
  </Accordion>

  <Accordion title="Claude settings do not apply">
    只支援來自 `settings.json` 的嵌入式 OpenClaw 設定。OpenClaw 不會將套件包設定視為原始設定修補。
  </Accordion>

  <Accordion title="Claude hooks do not execute">
    `hooks/hooks.json` 僅會偵測。如果你需要可執行的 hook，請使用 OpenClaw hook 包版面配置，或發布原生外掛。
  </Accordion>
</AccordionGroup>

## 相關

- [安裝與設定外掛](/zh-TW/tools/plugin)
- [建置外掛](/zh-TW/plugins/building-plugins) - 建立原生外掛
- [外掛資訊清單](/zh-TW/plugins/manifest) - 原生資訊清單結構描述
