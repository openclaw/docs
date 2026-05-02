---
read_when:
    - 你想要 Plugin 安裝、列出、更新或解除安裝的快速範例
    - 您想在 ClawHub 與 npm Plugin 發佈之間做選擇
    - 您正在發布 Plugin 套件
sidebarTitle: Manage plugins
summary: 安裝、列出、解除安裝、更新和發布 OpenClaw Plugin 的快速範例
title: 管理 Plugin
x-i18n:
    generated_at: "2026-05-02T20:52:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: c5a1c58da41b243cebe1c163048918a94c492b77fdae1613bd008cb267670041
    source_path: plugins/manage-plugins.md
    workflow: 16
---

大多數 Plugin 工作流程只需要幾個命令：搜尋、安裝、重新啟動 Gateway、
驗證，並在不再需要該 Plugin 時解除安裝。

## 列出 Plugin

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

請對腳本使用 `--json`。當 Plugin 套件宣告 `dependencies` 或
`optionalDependencies` 時，它會包含登錄診斷資訊，以及每個 Plugin 的
靜態 `dependencyStatus`。

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` 是冷狀態清查檢查。它會顯示 OpenClaw 能從設定、manifest
和 Plugin 登錄中發現的內容；它不會證明已執行中的 Gateway 程序已匯入該 Plugin 執行階段。

## 安裝 Plugin

```bash
# Search ClawHub for plugin packages.
openclaw plugins search "calendar"

# Bare package specs try ClawHub first, then npm fallback.
openclaw plugins install <package>

# Force one source.
openclaw plugins install clawhub:<package>
openclaw plugins install npm:<package>

# Install a specific version or dist-tag.
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex@beta

# Install from git or a local development checkout.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

安裝 Plugin 程式碼後，請重新啟動為你的頻道提供服務的 Gateway：

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

當你需要證明該 Plugin 已註冊執行階段介面時，請使用 `inspect --runtime`，
例如工具、鉤子、服務、Gateway 方法，或 Plugin 擁有的 CLI 命令。

## 更新 Plugin

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

如果 Plugin 是從 npm dist-tag 安裝，例如 `@beta`，後續
`update <plugin-id>` 呼叫會重用已記錄的該標籤。傳入明確的 npm spec
會將追蹤中的安裝切換到該 spec，以供未來更新使用。

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

第二個命令會在 Plugin 先前釘選到精確版本或標籤時，將它移回登錄的預設發行線。

當 `openclaw update` 在 beta 頻道上執行時，預設線的 npm 和 ClawHub
Plugin 記錄會先嘗試相符的 Plugin `@beta` 發行版本。如果該 beta
發行版本不存在，OpenClaw 會退回到已記錄的預設/latest spec。
精確版本和明確標籤（例如 `@rc` 或 `@beta`）會保留。

## 解除安裝 Plugin

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

解除安裝會移除該 Plugin 的設定項目、Plugin 索引記錄、允許/拒絕清單項目，
以及適用時的連結載入路徑。受管理的安裝目錄會被移除，除非你傳入 `--keep-files`。

## 發布 Plugin

你可以將外部 Plugin 發布到 [ClawHub](https://clawhub.ai)、npmjs.com，或兩者。

### 發布到 ClawHub

ClawHub 是 OpenClaw Plugin 的主要公開探索介面。它會在安裝前提供使用者可搜尋的中繼資料、版本歷史，以及登錄掃描結果。

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

使用者可透過 ClawHub 安裝：

```bash
openclaw plugins install clawhub:<package>
openclaw plugins install <package>
```

裸形式仍會先檢查 ClawHub。

### 發布到 npmjs.com

原生 npm Plugin 必須包含 Plugin manifest，以及 `package.json` OpenClaw
進入點中繼資料。

```json package.json
{
  "name": "@acme/openclaw-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

```bash
npm publish --access public
```

使用者可透過 npm-only 安裝：

```bash
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

如果相同套件也可在 ClawHub 取得，`npm:` 會略過 ClawHub 查詢並強制使用 npm 解析。

## 來源選擇

- **ClawHub**：當你想要 OpenClaw 原生探索、掃描摘要、版本和安裝提示時使用。
- **npmjs.com**：當你已經發布 JavaScript 套件，或需要 npm dist-tag/私有登錄工作流程時使用。
- **Git**：當你想直接從分支、標籤或提交安裝時使用。
- **本機路徑**：當你正在同一台機器上開發或測試 Plugin 時使用。

## 相關

- [Plugin](/zh-TW/tools/plugin) - 概觀和疑難排解
- [`openclaw plugins`](/zh-TW/cli/plugins) - 完整 CLI 參考
- [ClawHub](/zh-TW/tools/clawhub) - 發布和登錄操作
- [建置 Plugin](/zh-TW/plugins/building-plugins) - 建立 Plugin 套件
- [Plugin manifest](/zh-TW/plugins/manifest) - manifest 和套件中繼資料
