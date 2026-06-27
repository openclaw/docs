---
read_when:
    - 你想安裝相容於 Codex、Claude 或 Cursor 的套件包
    - 你需要了解 OpenClaw 如何將套件內容對應到原生功能
    - 你正在偵錯套件偵測或缺少的功能
summary: 安裝 Codex、Claude 和 Cursor 套件組，並作為 OpenClaw 外掛使用
title: 外掛套件包
x-i18n:
    generated_at: "2026-06-27T19:33:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b26915603db9d4d4422f4d1542f033be02eb83c5ffefcf93cac7968f624f4969
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw 可以從三個外部生態系安裝外掛：**Codex**、**Claude**、
以及 **Cursor**。這些稱為 **套件組**，也就是內容與中繼資料套件，
OpenClaw 會將其對應到 Skills、鉤子與 MCP 工具等原生功能中。

<Info>
  套件組與原生 OpenClaw 外掛**不同**。原生外掛會在程序內執行，
  並且可以註冊任何能力。套件組是內容套件，具備選擇性的功能對應，
  並且信任邊界較窄。
</Info>

## 為什麼需要套件組

許多實用外掛是以 Codex、Claude 或 Cursor 格式發布。OpenClaw
不會要求作者將它們重寫為原生 OpenClaw 外掛，而是偵測這些格式，
並將其支援的內容對應到原生功能集。這表示你可以安裝 Claude
命令套件或 Codex Skill 套件組，並立即使用。

## 安裝套件組

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

    套件組會顯示為 `Format: bundle`，並帶有 `codex`、`claude` 或 `cursor` 子類型。

  </Step>

  <Step title="重新啟動並使用">
    ```bash
    openclaw gateway restart
    ```

    對應後的功能（Skills、鉤子、MCP 工具、LSP 預設值）會在下一個工作階段可用。

  </Step>
</Steps>

## OpenClaw 會從套件組對應哪些內容

並非每個套件組功能目前都能在 OpenClaw 中執行。以下列出可用功能，
以及已偵測但尚未接線的功能。

### 目前支援

| 功能       | 對應方式                                                                                       | 適用於     |
| ------------- | ------------------------------------------------------------------------------------------------- | -------------- |
| Skill 內容 | 套件組 Skill 根目錄會以一般 OpenClaw Skills 載入                                                 | 所有格式    |
| 命令      | `commands/` 和 `.cursor/commands/` 會被視為 Skill 根目錄                                        | Claude、Cursor |
| 鉤子套件    | OpenClaw 風格的 `HOOK.md` + `handler.ts` 版面配置                                                   | Codex          |
| MCP 工具     | 套件組 MCP 設定會合併到嵌入式 OpenClaw 設定中；支援的 stdio 與 HTTP 伺服器會被載入 | 所有格式    |
| LSP 伺服器   | Claude `.lsp.json` 與資訊清單宣告的 `lspServers` 會合併到嵌入式 OpenClaw LSP 預設值  | Claude         |
| 設定      | Claude `settings.json` 會作為嵌入式 OpenClaw 預設值匯入                                     | Claude         |

#### Skill 內容

- 套件組 Skill 根目錄會作為一般 OpenClaw Skill 根目錄載入
- Claude `commands` 根目錄會被視為額外的 Skill 根目錄
- Cursor `.cursor/commands` 根目錄會被視為額外的 Skill 根目錄

這表示 Claude markdown 命令檔會透過一般 OpenClaw Skill
載入器運作。Cursor 命令 markdown 會透過相同路徑運作。

#### 鉤子套件

- 套件組鉤子根目錄**只有**在使用一般 OpenClaw 鉤子套件
  版面配置時才會運作。目前這主要是 Codex 相容情境：
  - `HOOK.md`
  - `handler.ts` 或 `handler.js`

#### 嵌入式 OpenClaw 的 MCP

- 已啟用的套件組可以提供 MCP 伺服器設定
- OpenClaw 會將套件組 MCP 設定合併到有效的嵌入式 OpenClaw 設定中，
  名稱為 `mcpServers`
- OpenClaw 會在嵌入式 OpenClaw 代理程式回合中公開支援的套件組 MCP 工具，
  方式是啟動 stdio 伺服器或連線到 HTTP 伺服器
- `coding` 和 `messaging` 工具設定檔預設會包含套件組 MCP 工具；
  若要為代理程式或閘道退出，請使用 `tools.deny: ["bundle-mcp"]`
- 專案本機嵌入式代理程式設定仍會在套件組預設值之後套用，因此工作區
  設定可在需要時覆寫套件組 MCP 項目
- 套件組 MCP 工具目錄會在註冊前以確定性方式排序，因此
  上游 `listTools()` 順序變更不會使提示快取工具區塊反覆變動

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

- `transport` 可設為 `"streamable-http"` 或 `"sse"`；省略時，OpenClaw 會使用 `sse`
- `type: "http"` 是命令列介面原生的下游形狀；在 OpenClaw 設定中請使用 `transport: "streamable-http"`。`openclaw mcp set` 和 `openclaw doctor --fix` 會正規化常見別名。
- 只允許 `http:` 和 `https:` URL 配置
- `headers` 值支援 `${ENV_VAR}` 插值
- 同時包含 `command` 和 `url` 的伺服器項目會被拒絕
- URL 認證資料（userinfo 和查詢參數）會從工具
  描述與記錄中遮蔽
- `connectionTimeoutMs` 會覆寫 stdio 和 HTTP 傳輸的
  預設 30 秒連線逾時

##### 工具命名

OpenClaw 會使用供應商安全名稱註冊套件組 MCP 工具，格式為
`serverName__toolName`。例如，鍵為 `"vigil-harbor"` 的伺服器公開
`memory_search` 工具時，會註冊為 `vigil-harbor__memory_search`。

- `A-Za-z0-9_-` 以外的字元會以 `-` 取代
- 會以非字母開頭的片段會加上字母前綴，因此像 `12306` 這樣的數字
  伺服器鍵會變成供應商安全的工具前綴
- 伺服器前綴上限為 30 個字元
- 完整工具名稱上限為 64 個字元
- 空白伺服器名稱會退回為 `mcp`
- 發生衝突的清理後名稱會使用數字後綴消歧
- 最終公開工具順序會依安全名稱確定性排序，以保持重複嵌入式代理程式
  回合的快取穩定
- 設定檔篩選會將來自同一套件組 MCP 伺服器的所有工具視為由
  `bundle-mcp` 擁有的外掛，因此設定檔允許清單與拒絕清單可以包含
  個別公開工具名稱或 `bundle-mcp` 外掛鍵

#### 嵌入式 OpenClaw 設定

- 套件組啟用時，Claude `settings.json` 會作為預設嵌入式 OpenClaw 設定匯入
- OpenClaw 會在套用 shell 覆寫鍵前先清理它們

已清理的鍵：

- `shellPath`
- `shellCommandPrefix`

#### 嵌入式 OpenClaw LSP

- 已啟用的 Claude 套件組可以提供 LSP 伺服器設定
- OpenClaw 會載入 `.lsp.json`，以及任何資訊清單宣告的 `lspServers` 路徑
- 套件組 LSP 設定會合併到有效的嵌入式 OpenClaw LSP 預設值
- 目前只有支援的 stdio 後端 LSP 伺服器可執行；不支援的
  傳輸仍會顯示在 `openclaw plugins inspect <id>` 中

### 已偵測但未執行

以下內容會被辨識並顯示在診斷中，但 OpenClaw 不會執行它們：

- Claude `agents`、`hooks.json` 自動化、`outputStyles`
- Cursor `.cursor/agents`、`.cursor/hooks.json`、`.cursor/rules`
- Codex 內嵌/應用程式中繼資料，能力回報以外的部分

## 套件組格式

<AccordionGroup>
  <Accordion title="Codex 套件組">
    標記：`.codex-plugin/plugin.json`

    選用內容：`skills/`、`hooks/`、`.mcp.json`、`.app.json`

    Codex 套件組在使用 Skill 根目錄與 OpenClaw 風格
    鉤子套件目錄（`HOOK.md` + `handler.ts`）時，最適合 OpenClaw。

  </Accordion>

  <Accordion title="Claude 套件組">
    兩種偵測模式：

    - **以資訊清單為基礎：** `.claude-plugin/plugin.json`
    - **無資訊清單：** 預設 Claude 版面配置（`skills/`、`commands/`、`agents/`、`hooks/`、`.mcp.json`、`.lsp.json`、`settings.json`）

    Claude 專屬行為：

    - `commands/` 會被視為 Skill 內容
    - `settings.json` 會匯入到嵌入式 OpenClaw 設定中（shell 覆寫鍵會被清理）
    - `.mcp.json` 會向嵌入式 OpenClaw 公開支援的 stdio 工具
    - `.lsp.json` 加上資訊清單宣告的 `lspServers` 路徑會載入到嵌入式 OpenClaw LSP 預設值
    - `hooks/hooks.json` 會被偵測但不會執行
    - 資訊清單中的自訂元件路徑是累加的（它們會擴充預設值，而不是取代預設值）

  </Accordion>

  <Accordion title="Cursor 套件組">
    標記：`.cursor-plugin/plugin.json`

    選用內容：`skills/`、`.cursor/commands/`、`.cursor/agents/`、`.cursor/rules/`、`.cursor/hooks.json`、`.mcp.json`

    - `.cursor/commands/` 會被視為 Skill 內容
    - `.cursor/rules/`、`.cursor/agents/` 和 `.cursor/hooks.json` 只會偵測

  </Accordion>
</AccordionGroup>

## 偵測優先順序

OpenClaw 會先檢查原生外掛格式：

1. `openclaw.plugin.json` 或含有 `openclaw.extensions` 的有效 `package.json` — 視為**原生外掛**
2. 套件組標記（`.codex-plugin/`、`.claude-plugin/` 或預設 Claude/Cursor 版面配置）— 視為**套件組**

如果目錄同時包含兩者，OpenClaw 會使用原生路徑。這可防止
雙格式套件被部分安裝為套件組。

## 執行階段相依性與清理

- 第三方相容套件組不會取得啟動時的 `npm install` 修復。它們
  應透過 `openclaw plugins install` 安裝，並在已安裝外掛目錄中
  隨附所需的一切。
- OpenClaw 擁有的內建外掛會以輕量形式隨核心出貨，或可透過
  外掛安裝器下載。閘道啟動時絕不會為它們執行
  套件管理器。
- `openclaw doctor --fix` 會移除舊版暫存相依性目錄，並可在
  設定引用可下載外掛、但本機外掛索引缺少它們時復原。

## 安全性

套件組的信任邊界比原生外掛更窄：

- OpenClaw **不會**在程序內載入任意套件組執行階段模組
- Skills 與鉤子套件路徑必須留在外掛根目錄內（經邊界檢查）
- 設定檔會使用相同的邊界檢查讀取
- 支援的 stdio MCP 伺服器可能會作為子程序啟動

這讓套件組預設更安全，但你仍應將第三方
套件組視為其公開功能的可信任內容。

## 疑難排解

<AccordionGroup>
  <Accordion title="已偵測到套件組，但能力未執行">
    執行 `openclaw plugins inspect <id>`。如果某項能力已列出但標記為
    尚未接線，這是產品限制，而不是安裝損壞。
  </Accordion>

  <Accordion title="Claude 命令檔未顯示">
    請確認套件組已啟用，且 markdown 檔案位於已偵測的
    `commands/` 或 `skills/` 根目錄內。
  </Accordion>

  <Accordion title="Claude 設定未套用">
    僅支援來自 `settings.json` 的嵌入式 OpenClaw 設定。OpenClaw 不會
    將套件組設定視為原始設定修補。
  </Accordion>

  <Accordion title="Claude 鉤子未執行">
    `hooks/hooks.json` 只會偵測。如果需要可執行的鉤子，請使用
    OpenClaw 鉤子套件版面配置，或出貨原生外掛。
  </Accordion>
</AccordionGroup>

## 相關

- [安裝與設定外掛](/zh-TW/tools/plugin)
- [建置外掛](/zh-TW/plugins/building-plugins) — 建立原生外掛
- [外掛資訊清單](/zh-TW/plugins/manifest) — 原生資訊清單結構
