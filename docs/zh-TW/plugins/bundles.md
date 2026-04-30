---
read_when:
    - 你想安裝與 Codex、Claude 或 Cursor 相容的套件組
    - 你需要了解 OpenClaw 如何將套件包內容對應到原生功能
    - 你正在偵錯套件組合偵測或缺少的功能
summary: 將 Codex、Claude 和 Cursor 套件作為 OpenClaw Plugin 安裝並使用
title: Plugin 套件包
x-i18n:
    generated_at: "2026-04-30T03:22:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6d03643c3029f5c6c81fab3aa1c00accba94da64a834e381b29db8f405d6bdee
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw 可以從三個外部生態系安裝 plugins：**Codex**、**Claude**、
以及 **Cursor**。這些稱為 **bundles**，也就是內容與中繼資料套件，
OpenClaw 會將其對應到 Skills、hooks 和 MCP tools 等原生功能。

<Info>
  Bundles **不**等同於原生 OpenClaw plugins。原生 plugins 會在行程內執行，
  並且可以註冊任何能力。Bundles 則是內容套件，具備選擇性的功能對應，
  信任邊界也較窄。
</Info>

## 為什麼存在 bundles

許多實用的 plugins 會以 Codex、Claude 或 Cursor 格式發布。OpenClaw
會偵測這些格式，並將其支援的內容對應到原生功能集，而不是要求作者
將它們重寫為原生 OpenClaw plugins。這表示你可以安裝 Claude 命令套件
或 Codex skill bundle，並立即使用。

## 安裝 bundle

<Steps>
  <Step title="從目錄、封存檔或 marketplace 安裝">
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

    Bundles 會顯示為 `Format: bundle`，子類型為 `codex`、`claude` 或 `cursor`。

  </Step>

  <Step title="重新啟動並使用">
    ```bash
    openclaw gateway restart
    ```

    對應後的功能（Skills、hooks、MCP tools、LSP 預設值）會在下一個工作階段中可用。

  </Step>
</Steps>

## OpenClaw 會從 bundles 對應哪些內容

目前並非每個 bundle 功能都能在 OpenClaw 中執行。以下是已可運作的功能，
以及已偵測但尚未接線的功能。

### 目前支援

| 功能          | 對應方式                                                                                     | 適用於         |
| ------------- | -------------------------------------------------------------------------------------------- | -------------- |
| Skill 內容    | Bundle skill roots 會以一般 OpenClaw skills 載入                                             | 所有格式       |
| 命令          | `commands/` 和 `.cursor/commands/` 會視為 skill roots                                        | Claude, Cursor |
| Hook 套件     | OpenClaw 風格的 `HOOK.md` + `handler.ts` 版面配置                                            | Codex          |
| MCP tools     | Bundle MCP 設定會合併到內嵌 Pi settings；支援的 stdio 和 HTTP servers 會被載入              | 所有格式       |
| LSP servers   | Claude `.lsp.json` 和 manifest 宣告的 `lspServers` 會合併到內嵌 Pi LSP 預設值               | Claude         |
| Settings      | Claude `settings.json` 會匯入為內嵌 Pi 預設值                                                | Claude         |

#### Skill 內容

- bundle skill roots 會以一般 OpenClaw skill roots 載入
- Claude `commands` roots 會視為額外的 skill roots
- Cursor `.cursor/commands` roots 會視為額外的 skill roots

這表示 Claude markdown 命令檔會透過一般 OpenClaw skill loader 運作。
Cursor command markdown 也會透過相同路徑運作。

#### Hook 套件

- bundle hook roots **只有**在使用一般 OpenClaw hook-pack 版面配置時才會運作。
  目前主要是 Codex 相容案例：
  - `HOOK.md`
  - `handler.ts` 或 `handler.js`

#### Pi 的 MCP

- 已啟用的 bundles 可以提供 MCP server config
- OpenClaw 會將 bundle MCP config 合併到有效的內嵌 Pi settings，
  作為 `mcpServers`
- OpenClaw 會在內嵌 Pi agent 回合期間，透過啟動 stdio servers
  或連線到 HTTP servers，公開支援的 bundle MCP tools
- `coding` 和 `messaging` tool profiles 預設會包含 bundle MCP tools；
  若要針對 agent 或 gateway 選擇退出，請使用 `tools.deny: ["bundle-mcp"]`
- 專案本機 Pi settings 仍會在 bundle defaults 之後套用，因此 workspace
  settings 可以在需要時覆寫 bundle MCP entries
- bundle MCP tool catalogs 會在註冊前以決定性方式排序，因此上游
  `listTools()` 順序變動不會反覆擾動 prompt-cache tool blocks

##### 傳輸

MCP servers 可以使用 stdio 或 HTTP transport：

**Stdio** 會啟動子行程：

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

**HTTP** 預設會透過 `sse` 連線到正在執行的 MCP server，或在要求時使用 `streamable-http`：

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

- `transport` 可以設定為 `"streamable-http"` 或 `"sse"`；省略時，OpenClaw 會使用 `sse`
- `type: "http"` 是 CLI 原生的下游形狀；在 OpenClaw config 中請使用 `transport: "streamable-http"`。`openclaw mcp set` 和 `openclaw doctor --fix` 會正規化常見別名。
- 只允許 `http:` 和 `https:` URL schemes
- `headers` values 支援 `${ENV_VAR}` 插補
- 同時包含 `command` 和 `url` 的 server entry 會被拒絕
- URL credentials（userinfo 和 query params）會從 tool descriptions
  和 logs 中遮蔽
- `connectionTimeoutMs` 會覆寫 stdio 和 HTTP transports 的預設 30 秒連線逾時

##### Tool 命名

OpenClaw 會以 `serverName__toolName` 形式，使用 provider-safe names
註冊 bundle MCP tools。例如，key 為 `"vigil-harbor"` 的 server 若公開
`memory_search` tool，會註冊為 `vigil-harbor__memory_search`。

- `A-Za-z0-9_-` 以外的字元會替換為 `-`
- server prefixes 上限為 30 個字元
- 完整 tool names 上限為 64 個字元
- 空的 server names 會退回使用 `mcp`
- 發生衝突的 sanitized names 會以數字 suffixes 消除歧義
- 最終公開的 tool order 會依 safe name 以決定性方式排序，讓重複的 Pi
  回合保持 cache-stable
- profile filtering 會將同一個 bundle MCP server 的所有 tools 視為由
  `bundle-mcp` plugin 擁有，因此 profile allowlists 和 deny lists
  可以包含個別公開的 tool names，或 `bundle-mcp` plugin key

#### 內嵌 Pi settings

- Claude `settings.json` 會在 bundle 啟用時匯入為預設內嵌 Pi settings
- OpenClaw 會在套用 shell override keys 前先進行清理

清理後的 keys：

- `shellPath`
- `shellCommandPrefix`

#### 內嵌 Pi LSP

- 已啟用的 Claude bundles 可以提供 LSP server config
- OpenClaw 會載入 `.lsp.json` 加上任何 manifest 宣告的 `lspServers` paths
- bundle LSP config 會合併到有效的內嵌 Pi LSP 預設值
- 目前只有支援的 stdio-backed LSP servers 可執行；不支援的
  transports 仍會出現在 `openclaw plugins inspect <id>`

### 已偵測但未執行

這些會被辨識並顯示在 diagnostics 中，但 OpenClaw 不會執行它們：

- Claude `agents`、`hooks.json` automation、`outputStyles`
- Cursor `.cursor/agents`、`.cursor/hooks.json`、`.cursor/rules`
- Codex inline/app metadata，僅限 capability reporting 以外的部分

## Bundle 格式

<AccordionGroup>
  <Accordion title="Codex bundles">
    標記：`.codex-plugin/plugin.json`

    選用內容：`skills/`、`hooks/`、`.mcp.json`、`.app.json`

    Codex bundles 在使用 skill roots 和 OpenClaw 風格 hook-pack
    directories（`HOOK.md` + `handler.ts`）時，最符合 OpenClaw。

  </Accordion>

  <Accordion title="Claude bundles">
    兩種偵測模式：

    - **Manifest-based:** `.claude-plugin/plugin.json`
    - **無 manifest：** 預設 Claude layout（`skills/`、`commands/`、`agents/`、`hooks/`、`.mcp.json`、`.lsp.json`、`settings.json`）

    Claude 專屬行為：

    - `commands/` 會視為 skill content
    - `settings.json` 會匯入到內嵌 Pi settings（shell override keys 會被清理）
    - `.mcp.json` 會向內嵌 Pi 公開支援的 stdio tools
    - `.lsp.json` 加上 manifest 宣告的 `lspServers` paths 會載入到內嵌 Pi LSP defaults
    - `hooks/hooks.json` 會被偵測但不會執行
    - manifest 中的自訂 component paths 是加成式的（它們會擴充 defaults，而不是取代 defaults）

  </Accordion>

  <Accordion title="Cursor bundles">
    標記：`.cursor-plugin/plugin.json`

    選用內容：`skills/`、`.cursor/commands/`、`.cursor/agents/`、`.cursor/rules/`、`.cursor/hooks.json`、`.mcp.json`

    - `.cursor/commands/` 會視為 skill content
    - `.cursor/rules/`、`.cursor/agents/` 和 `.cursor/hooks.json` 僅供偵測

  </Accordion>
</AccordionGroup>

## 偵測優先順序

OpenClaw 會先檢查原生 plugin 格式：

1. `openclaw.plugin.json` 或具備 `openclaw.extensions` 的有效 `package.json` — 視為 **原生 plugin**
2. Bundle 標記（`.codex-plugin/`、`.claude-plugin/`，或預設 Claude/Cursor layout）— 視為 **bundle**

如果目錄同時包含兩者，OpenClaw 會使用原生路徑。這可避免
雙格式 packages 被部分安裝為 bundles。

## 執行階段相依性與清理

- 第三方相容 bundles 不會取得啟動時的 `npm install` 修復。它們應該
  透過 `openclaw plugins install` 安裝，並在已安裝的 plugin 目錄中
  隨附所需的一切。
- OpenClaw 擁有的封裝式 bundled plugins 有一個狹窄例外：當其中一個
  被啟用時，Gateway 啟動可以在 import 前修復遺失的已宣告執行階段相依性。
  Operators 可以使用 `openclaw plugins deps` 檢查或修復該階段。
- release pipeline 仍負責在可行情況下交付完整的 bundled dependency payload
  （請參閱 [Releasing](/zh-TW/reference/RELEASING) 中的 postpublish verification rule）。

## 安全性

Bundles 的信任邊界比原生 plugins 更窄：

- OpenClaw **不會**在行程內載入任意 bundle runtime modules
- Skills 和 hook-pack paths 必須保留在 plugin root 內（會進行 boundary check）
- Settings files 會以相同 boundary checks 讀取
- 支援的 stdio MCP servers 可以作為 subprocesses 啟動

這讓 bundles 預設更安全，但你仍應將第三方 bundles 視為其公開功能的可信內容。

## 疑難排解

<AccordionGroup>
  <Accordion title="Bundle 已偵測到，但 capabilities 未執行">
    執行 `openclaw plugins inspect <id>`。如果 capability 已列出但標示為
    not wired，這是產品限制，而不是安裝損壞。
  </Accordion>

  <Accordion title="Claude command files 未出現">
    請確認 bundle 已啟用，而且 markdown files 位於已偵測到的
    `commands/` 或 `skills/` root 內。
  </Accordion>

  <Accordion title="Claude settings 未套用">
    僅支援來自 `settings.json` 的內嵌 Pi settings。OpenClaw 不會將
    bundle settings 視為 raw config patches。
  </Accordion>

  <Accordion title="Claude hooks 未執行">
    `hooks/hooks.json` 僅供偵測。如果你需要可執行 hooks，請使用
    OpenClaw hook-pack layout，或發布原生 plugin。
  </Accordion>
</AccordionGroup>

## 相關

- [安裝與設定 Plugins](/zh-TW/tools/plugin)
- [建置 Plugins](/zh-TW/plugins/building-plugins) — 建立原生 plugin
- [Plugin Manifest](/zh-TW/plugins/manifest) — 原生 manifest schema
