---
read_when:
    - 您想要安裝與 Codex、Claude 或 Cursor 相容的套件包
    - 你需要了解 OpenClaw 如何將套件內容對應到原生功能
    - 你正在偵錯套件組合偵測或缺少的能力
summary: 安裝並將 Codex、Claude 和 Cursor 套件作為 OpenClaw Plugin 使用
title: Plugin 套件包
x-i18n:
    generated_at: "2026-05-02T02:54:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b949ad70881714a30ab136261441687b439e39b516638ffa052efeab6b75bd4
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw 可以從三個外部生態系統安裝 Plugin：**Codex**、**Claude**，
以及 **Cursor**。這些稱為 **bundle**，也就是內容與中繼資料套件，
OpenClaw 會將其對應到 Skills、hook 和 MCP 工具等原生功能。

<Info>
  bundle **不同於** 原生 OpenClaw Plugin。原生 Plugin 會在
  處理序內執行，並且可以註冊任何能力。bundle 則是內容套件，具備
  選擇性的功能對應，以及較窄的信任邊界。
</Info>

## bundle 存在的原因

許多實用的 Plugin 會以 Codex、Claude 或 Cursor 格式發布。OpenClaw
不要求作者將它們重寫為原生 OpenClaw Plugin，而是偵測這些格式，
並將其支援的內容對應到原生功能集合。這表示你可以安裝 Claude 指令套件
或 Codex skill bundle，並立即使用。

## 安裝 bundle

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

  <Step title="驗證偵測">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    bundle 會顯示為 `Format: bundle`，並帶有 `codex`、`claude` 或 `cursor` 子類型。

  </Step>

  <Step title="重新啟動並使用">
    ```bash
    openclaw gateway restart
    ```

    對應後的功能（Skills、hook、MCP 工具、LSP 預設值）會在下一個工作階段可用。

  </Step>
</Steps>

## OpenClaw 會從 bundle 對應什麼

目前並非每項 bundle 功能都會在 OpenClaw 中執行。以下列出可用的功能，
以及已偵測但尚未接線的功能。

### 目前支援

| 功能          | 對應方式                                                                                    | 適用於         |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| Skill 內容    | bundle skill root 會以一般 OpenClaw Skills 載入                                             | 所有格式       |
| 指令          | `commands/` 和 `.cursor/commands/` 會視為 skill root                                        | Claude、Cursor |
| Hook 套件     | OpenClaw 風格的 `HOOK.md` + `handler.ts` 配置                                               | Codex          |
| MCP 工具      | bundle MCP 設定會合併到內嵌 Pi 設定；載入支援的 stdio 和 HTTP 伺服器                       | 所有格式       |
| LSP 伺服器    | Claude `.lsp.json` 和清單宣告的 `lspServers` 會合併到內嵌 Pi LSP 預設值                    | Claude         |
| 設定          | Claude `settings.json` 會匯入為內嵌 Pi 預設值                                               | Claude         |

#### Skill 內容

- bundle skill root 會以一般 OpenClaw skill root 載入
- Claude `commands` root 會視為額外的 skill root
- Cursor `.cursor/commands` root 會視為額外的 skill root

這表示 Claude markdown 指令檔會透過一般 OpenClaw skill
loader 運作。Cursor 指令 markdown 也會透過相同路徑運作。

#### Hook 套件

- bundle hook root **只有**在使用一般 OpenClaw hook-pack
  配置時才會運作。目前這主要是相容 Codex 的情況：
  - `HOOK.md`
  - `handler.ts` 或 `handler.js`

#### Pi 的 MCP

- 已啟用的 bundle 可以提供 MCP 伺服器設定
- OpenClaw 會將 bundle MCP 設定合併到有效的內嵌 Pi 設定中，作為
  `mcpServers`
- OpenClaw 會在內嵌 Pi agent 回合期間公開支援的 bundle MCP 工具，
  方式是啟動 stdio 伺服器或連線到 HTTP 伺服器
- `coding` 和 `messaging` 工具 profile 預設包含 bundle MCP 工具；
  若要為 agent 或 gateway 退出，請使用 `tools.deny: ["bundle-mcp"]`
- 專案本機 Pi 設定仍會在 bundle 預設值之後套用，因此 workspace
  設定可在需要時覆寫 bundle MCP 項目
- bundle MCP 工具目錄會在註冊前以確定性方式排序，因此上游 `listTools()`
  順序變更不會讓 prompt-cache 工具區塊反覆震盪

##### 傳輸

MCP 伺服器可以使用 stdio 或 HTTP 傳輸：

**Stdio** 會啟動子處理序：

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

**HTTP** 預設會透過 `sse` 連線到執行中的 MCP 伺服器，或在指定時使用 `streamable-http`：

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
- `type: "http"` 是 CLI 原生的下游形狀；請在 OpenClaw 設定中使用 `transport: "streamable-http"`。`openclaw mcp set` 和 `openclaw doctor --fix` 會標準化常見別名。
- 只允許 `http:` 和 `https:` URL scheme
- `headers` 值支援 `${ENV_VAR}` 插值
- 同時具有 `command` 和 `url` 的伺服器項目會被拒絕
- URL 憑證（userinfo 和 query params）會從工具
  描述與記錄中遮蔽
- `connectionTimeoutMs` 會覆寫 stdio 和 HTTP 傳輸的預設 30 秒連線逾時

##### 工具命名

OpenClaw 會以 provider-safe 名稱註冊 bundle MCP 工具，格式為
`serverName__toolName`。例如，鍵為 `"vigil-harbor"` 的伺服器公開
`memory_search` 工具時，會註冊為 `vigil-harbor__memory_search`。

- `A-Za-z0-9_-` 以外的字元會替換為 `-`
- 伺服器前綴上限為 30 個字元
- 完整工具名稱上限為 64 個字元
- 空白伺服器名稱會 fallback 至 `mcp`
- 發生碰撞的清理後名稱會以數字後綴消歧
- 最終公開的工具順序會依 safe name 確定性排序，以保持重複 Pi
  回合的快取穩定
- profile 篩選會將同一 bundle MCP 伺服器的所有工具視為由 `bundle-mcp`
  這個 Plugin 擁有，因此 profile allowlist 和 deny list 可以包含
  個別公開工具名稱，或 `bundle-mcp` Plugin 鍵

#### 內嵌 Pi 設定

- bundle 啟用時，Claude `settings.json` 會匯入為預設的內嵌 Pi 設定
- OpenClaw 會先清理 shell 覆寫鍵，再套用它們

清理後的鍵：

- `shellPath`
- `shellCommandPrefix`

#### 內嵌 Pi LSP

- 已啟用的 Claude bundle 可以提供 LSP 伺服器設定
- OpenClaw 會載入 `.lsp.json` 加上任何清單宣告的 `lspServers` 路徑
- bundle LSP 設定會合併到有效的內嵌 Pi LSP 預設值中
- 目前只有支援的 stdio-backed LSP 伺服器可執行；不支援的
  傳輸仍會顯示在 `openclaw plugins inspect <id>` 中

### 已偵測但不執行

這些項目會被識別並顯示在診斷資訊中，但 OpenClaw 不會執行它們：

- Claude `agents`、`hooks.json` 自動化、`outputStyles`
- Cursor `.cursor/agents`、`.cursor/hooks.json`、`.cursor/rules`
- Codex inline/app 中繼資料，但能力回報除外

## bundle 格式

<AccordionGroup>
  <Accordion title="Codex bundle">
    標記：`.codex-plugin/plugin.json`

    選用內容：`skills/`、`hooks/`、`.mcp.json`、`.app.json`

    Codex bundle 在使用 skill root 和 OpenClaw 風格
    hook-pack 目錄（`HOOK.md` + `handler.ts`）時最適合 OpenClaw。

  </Accordion>

  <Accordion title="Claude bundle">
    兩種偵測模式：

    - **基於清單：** `.claude-plugin/plugin.json`
    - **無清單：** 預設 Claude 配置（`skills/`、`commands/`、`agents/`、`hooks/`、`.mcp.json`、`.lsp.json`、`settings.json`）

    Claude 專屬行為：

    - `commands/` 會視為 skill 內容
    - `settings.json` 會匯入內嵌 Pi 設定（shell 覆寫鍵會被清理）
    - `.mcp.json` 會向內嵌 Pi 公開支援的 stdio 工具
    - `.lsp.json` 加上清單宣告的 `lspServers` 路徑會載入內嵌 Pi LSP 預設值
    - `hooks/hooks.json` 會被偵測但不執行
    - 清單中的自訂元件路徑是加成式的（它們會擴充預設值，而非取代預設值）

  </Accordion>

  <Accordion title="Cursor bundle">
    標記：`.cursor-plugin/plugin.json`

    選用內容：`skills/`、`.cursor/commands/`、`.cursor/agents/`、`.cursor/rules/`、`.cursor/hooks.json`、`.mcp.json`

    - `.cursor/commands/` 會視為 skill 內容
    - `.cursor/rules/`、`.cursor/agents/` 和 `.cursor/hooks.json` 僅偵測

  </Accordion>
</AccordionGroup>

## 偵測優先順序

OpenClaw 會先檢查原生 Plugin 格式：

1. `openclaw.plugin.json` 或具有 `openclaw.extensions` 的有效 `package.json`，會視為**原生 Plugin**
2. bundle 標記（`.codex-plugin/`、`.claude-plugin/`，或預設 Claude/Cursor 配置），會視為 **bundle**

如果目錄同時包含兩者，OpenClaw 會使用原生路徑。這可防止
雙格式套件被部分安裝為 bundle。

## 執行階段相依性與清理

- 第三方相容 bundle 不會取得啟動時的 `npm install` 修復。它們
  應透過 `openclaw plugins install` 安裝，並在已安裝的 Plugin 目錄中
  隨附所需的一切。
- OpenClaw 擁有的 bundled Plugin 會以輕量形式隨 core 出貨，或可透過
  Plugin 安裝器下載。Gateway 啟動時絕不會為它們執行
  package manager。
- `openclaw doctor --fix` 會移除舊版暫存相依性目錄，並可安裝本機
  Plugin 索引中缺少的已設定可下載 Plugin。

## 安全性

bundle 的信任邊界比原生 Plugin 更窄：

- OpenClaw **不會**在處理序內載入任意 bundle runtime 模組
- Skills 和 hook-pack 路徑必須保留在 Plugin root 內（經邊界檢查）
- 設定檔會使用相同的邊界檢查讀取
- 支援的 stdio MCP 伺服器可能會作為子處理序啟動

這讓 bundle 預設更安全，但你仍應將第三方
bundle 視為其公開功能的受信任內容。

## 疑難排解

<AccordionGroup>
  <Accordion title="bundle 已被偵測但能力沒有執行">
    執行 `openclaw plugins inspect <id>`。如果某項能力有列出但標記為
    尚未接線，這是產品限制，不是安裝損壞。
  </Accordion>

  <Accordion title="Claude 指令檔沒有出現">
    確認 bundle 已啟用，且 markdown 檔案位於偵測到的
    `commands/` 或 `skills/` root 內。
  </Accordion>

  <Accordion title="Claude 設定沒有套用">
    只支援來自 `settings.json` 的內嵌 Pi 設定。OpenClaw 不會
    將 bundle 設定視為原始 config patch。
  </Accordion>

  <Accordion title="Claude hook 沒有執行">
    `hooks/hooks.json` 僅偵測。如果需要可執行的 hook，請使用
    OpenClaw hook-pack 配置，或出貨原生 Plugin。
  </Accordion>
</AccordionGroup>

## 相關

- [安裝與設定 Plugin](/zh-TW/tools/plugin)
- [建置 Plugin](/zh-TW/plugins/building-plugins) — 建立原生 Plugin
- [Plugin 清單](/zh-TW/plugins/manifest) — 原生清單 schema
