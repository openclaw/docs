---
read_when:
    - 您想安裝與 Codex、Claude 或 Cursor 相容的套件組合
    - 你需要了解 OpenClaw 如何將套件內容對應到原生功能
    - 你正在偵錯套件偵測或缺少的能力
summary: 安裝並使用 Codex、Claude 和 Cursor 套件作為 OpenClaw Plugin
title: Plugin 套件包
x-i18n:
    generated_at: "2026-05-10T19:41:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: f1f92bb91369f0f5ddd8d960962e875323bb53173b4faebe4ef453d2f2a08826
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw 可以從三個外部生態系統安裝 Plugin：**Codex**、**Claude**，
以及 **Cursor**。這些稱為 **套件包**，也就是內容與中繼資料套件，
OpenClaw 會將它們對應到 Skills、hooks 和 MCP 工具等原生功能。

<Info>
  套件包與原生 OpenClaw Plugin **不同**。原生 Plugin 會在程序內執行，
  並且可以註冊任何能力。套件包是內容套件，具有選擇性的功能對應，以及較窄的信任邊界。
</Info>

## 為什麼需要套件包

許多有用的 Plugin 會以 Codex、Claude 或 Cursor 格式發布。OpenClaw
會偵測這些格式，並將其支援的內容對應到原生功能集，而不是要求作者將它們重寫成原生 OpenClaw Plugin。
這表示你可以安裝 Claude 指令套件或 Codex skill 套件包，
並立即使用它。

## 安裝套件包

<Steps>
  <Step title="Install from a directory, archive, or marketplace">
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

  <Step title="Verify detection">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    套件包會顯示為 `Format: bundle`，其子類型為 `codex`、`claude` 或 `cursor`。

  </Step>

  <Step title="Restart and use">
    ```bash
    openclaw gateway restart
    ```

    對應後的功能（Skills、hooks、MCP 工具、LSP 預設值）會在下一個工作階段中可用。

  </Step>
</Steps>

## OpenClaw 會從套件包對應哪些內容

目前並非每個套件包功能都能在 OpenClaw 中執行。以下是可用項目，以及已偵測但尚未接線的項目。

### 目前支援

| 功能          | 對應方式                                                                                    | 適用於         |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| Skill 內容    | 套件包 skill 根目錄會以一般 OpenClaw Skills 載入                                           | 所有格式       |
| 指令          | `commands/` 和 `.cursor/commands/` 會被視為 skill 根目錄                                   | Claude, Cursor |
| Hook 套件     | OpenClaw 風格的 `HOOK.md` + `handler.ts` 版面配置                                          | Codex          |
| MCP 工具      | 套件包 MCP 設定會合併到內嵌 Pi 設定中；會載入支援的 stdio 和 HTTP 伺服器                   | 所有格式       |
| LSP 伺服器    | Claude `.lsp.json` 和資訊清單宣告的 `lspServers` 會合併到內嵌 Pi LSP 預設值                | Claude         |
| 設定          | Claude `settings.json` 會匯入為內嵌 Pi 預設值                                              | Claude         |

#### Skill 內容

- 套件包 skill 根目錄會以一般 OpenClaw skill 根目錄載入
- Claude `commands` 根目錄會被視為額外的 skill 根目錄
- Cursor `.cursor/commands` 根目錄會被視為額外的 skill 根目錄

這表示 Claude markdown 指令檔案會透過一般 OpenClaw skill
載入器運作。Cursor 指令 markdown 也會透過相同路徑運作。

#### Hook 套件

- 套件包 hook 根目錄**只有**在使用一般 OpenClaw hook-pack
  版面配置時才會運作。目前這主要是 Codex 相容案例：
  - `HOOK.md`
  - `handler.ts` 或 `handler.js`

#### Pi 的 MCP

- 已啟用的套件包可以提供 MCP 伺服器設定
- OpenClaw 會將套件包 MCP 設定合併到有效的內嵌 Pi 設定中，
  形式為 `mcpServers`
- OpenClaw 會在內嵌 Pi 代理程式回合中公開支援的套件包 MCP 工具，
  做法是啟動 stdio 伺服器或連線到 HTTP 伺服器
- `coding` 和 `messaging` 工具設定檔預設包含套件包 MCP 工具；
  若要讓代理程式或 Gateway 選擇退出，請使用 `tools.deny: ["bundle-mcp"]`
- 專案本機 Pi 設定仍會在套件包預設值之後套用，因此工作區
  設定可在需要時覆寫套件包 MCP 項目
- 套件包 MCP 工具目錄會在註冊前以決定性方式排序，因此
  上游 `listTools()` 順序變更不會反覆擾動 prompt-cache 工具區塊

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
- `type: "http"` 是 CLI 原生的下游形狀；請在 OpenClaw 設定中使用 `transport: "streamable-http"`。`openclaw mcp set` 和 `openclaw doctor --fix` 會正規化常見別名。
- 只允許 `http:` 和 `https:` URL scheme
- `headers` 值支援 `${ENV_VAR}` 插值
- 同時具有 `command` 和 `url` 的伺服器項目會被拒絕
- URL 憑證（userinfo 和 query params）會從工具
  描述與記錄中遮蔽
- `connectionTimeoutMs` 會覆寫 stdio 和 HTTP 傳輸的預設 30 秒連線逾時

##### 工具命名

OpenClaw 會使用 provider-safe 名稱註冊套件包 MCP 工具，格式為
`serverName__toolName`。例如，鍵為 `"vigil-harbor"` 的伺服器若公開
`memory_search` 工具，會註冊為 `vigil-harbor__memory_search`。

- `A-Za-z0-9_-` 之外的字元會被替換為 `-`
- 會以非字母開頭的片段會加上字母前綴，因此像 `12306` 這類數字
  伺服器鍵會成為 provider-safe 工具前綴
- 伺服器前綴上限為 30 個字元
- 完整工具名稱上限為 64 個字元
- 空白伺服器名稱會回退為 `mcp`
- 衝突的清理後名稱會使用數字後綴消歧
- 最終公開的工具順序會依 safe name 以決定性方式排序，以保持重複 Pi
  回合的快取穩定
- 設定檔篩選會將來自同一個套件包 MCP 伺服器的所有工具視為
  由 `bundle-mcp` 擁有的 Plugin，因此設定檔允許清單與拒絕清單可以包含
  個別公開的工具名稱或 `bundle-mcp` Plugin 鍵

#### 內嵌 Pi 設定

- 啟用套件包時，Claude `settings.json` 會匯入為預設內嵌 Pi 設定
- OpenClaw 會在套用 shell 覆寫鍵之前先清理它們

清理後的鍵：

- `shellPath`
- `shellCommandPrefix`

#### 內嵌 Pi LSP

- 已啟用的 Claude 套件包可以提供 LSP 伺服器設定
- OpenClaw 會載入 `.lsp.json`，以及任何資訊清單宣告的 `lspServers` 路徑
- 套件包 LSP 設定會合併到有效的內嵌 Pi LSP 預設值中
- 目前只有支援的 stdio-backed LSP 伺服器可執行；不支援的
  傳輸仍會顯示在 `openclaw plugins inspect <id>` 中

### 已偵測但不執行

這些項目會被辨識並顯示在診斷中，但 OpenClaw 不會執行它們：

- Claude `agents`、`hooks.json` 自動化、`outputStyles`
- Cursor `.cursor/agents`、`.cursor/hooks.json`、`.cursor/rules`
- Codex 行內/應用程式中繼資料，但能力報告除外

## 套件包格式

<AccordionGroup>
  <Accordion title="Codex bundles">
    標記：`.codex-plugin/plugin.json`

    選用內容：`skills/`、`hooks/`、`.mcp.json`、`.app.json`

    Codex 套件包在使用 skill 根目錄和 OpenClaw 風格
    hook-pack 目錄（`HOOK.md` + `handler.ts`）時最適合 OpenClaw。

  </Accordion>

  <Accordion title="Claude bundles">
    兩種偵測模式：

    - **以資訊清單為基礎：** `.claude-plugin/plugin.json`
    - **無資訊清單：** 預設 Claude 版面配置（`skills/`、`commands/`、`agents/`、`hooks/`、`.mcp.json`、`.lsp.json`、`settings.json`）

    Claude 專屬行為：

    - `commands/` 會被視為 skill 內容
    - `settings.json` 會匯入到內嵌 Pi 設定中（shell 覆寫鍵會被清理）
    - `.mcp.json` 會向內嵌 Pi 公開支援的 stdio 工具
    - `.lsp.json` 加上資訊清單宣告的 `lspServers` 路徑會載入到內嵌 Pi LSP 預設值中
    - `hooks/hooks.json` 會被偵測但不執行
    - 資訊清單中的自訂元件路徑是加成的（它們會擴充預設值，而不是取代預設值）

  </Accordion>

  <Accordion title="Cursor bundles">
    標記：`.cursor-plugin/plugin.json`

    選用內容：`skills/`、`.cursor/commands/`、`.cursor/agents/`、`.cursor/rules/`、`.cursor/hooks.json`、`.mcp.json`

    - `.cursor/commands/` 會被視為 skill 內容
    - `.cursor/rules/`、`.cursor/agents/` 和 `.cursor/hooks.json` 僅供偵測

  </Accordion>
</AccordionGroup>

## 偵測優先順序

OpenClaw 會先檢查原生 Plugin 格式：

1. `openclaw.plugin.json` 或具有 `openclaw.extensions` 的有效 `package.json` — 視為**原生 Plugin**
2. 套件包標記（`.codex-plugin/`、`.claude-plugin/`，或預設 Claude/Cursor 版面配置）— 視為**套件包**

如果目錄同時包含兩者，OpenClaw 會使用原生路徑。這可防止
雙格式套件被部分安裝為套件包。

## 執行階段相依性與清理

- 第三方相容套件包不會取得啟動時的 `npm install` 修復。它們
  應透過 `openclaw plugins install` 安裝，並在已安裝的 Plugin 目錄中帶齊所需的一切。
- OpenClaw 擁有的 bundled plugins 會以輕量形式隨核心交付，或
  可透過 Plugin 安裝器下載。Gateway 啟動絕不會為它們執行
  套件管理器。
- `openclaw doctor --fix` 會移除舊版 staged 相依性目錄，且在
  設定參照某些可下載 Plugin，但它們從本機 Plugin 索引缺失時，可以復原這些 Plugin。

## 安全性

套件包的信任邊界比原生 Plugin 更窄：

- OpenClaw **不會**在程序內載入任意套件包執行階段模組
- Skills 和 hook-pack 路徑必須留在 Plugin 根目錄內（已做邊界檢查）
- 設定檔案會以相同的邊界檢查讀取
- 支援的 stdio MCP 伺服器可以作為子程序啟動

這使套件包預設更安全，但你仍應將第三方
套件包視為其公開功能的受信任內容。

## 疑難排解

<AccordionGroup>
  <Accordion title="Bundle is detected but capabilities do not run">
    執行 `openclaw plugins inspect <id>`。如果能力已列出但標示為
    尚未接線，這是產品限制，而不是安裝損壞。
  </Accordion>

  <Accordion title="Claude command files do not appear">
    請確認套件包已啟用，且 markdown 檔案位於偵測到的
    `commands/` 或 `skills/` 根目錄內。
  </Accordion>

  <Accordion title="Claude settings do not apply">
    僅支援來自 `settings.json` 的內嵌 Pi 設定。OpenClaw
    不會將套件包設定視為原始設定修補。
  </Accordion>

  <Accordion title="Claude hooks do not execute">
    `hooks/hooks.json` 僅供偵測。如果你需要可執行的 hooks，請使用
    OpenClaw hook-pack 版面配置，或交付原生 Plugin。
  </Accordion>
</AccordionGroup>

## 相關

- [安裝與設定 Plugin](/zh-TW/tools/plugin)
- [建置 Plugin](/zh-TW/plugins/building-plugins) — 建立原生 Plugin
- [Plugin 資訊清單](/zh-TW/plugins/manifest) — 原生資訊清單 schema
