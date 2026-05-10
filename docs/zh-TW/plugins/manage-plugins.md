---
read_when:
    - 你想要快速的 Plugin 安裝、列出、更新或解除安裝範例
    - 您想在 ClawHub 與 npm Plugin 發佈方式之間做選擇
    - 您正在發布 Plugin 套件
sidebarTitle: Manage plugins
summary: 安裝、列出、解除安裝、更新與發布 OpenClaw Plugin 的快速範例
title: 管理 Plugin
x-i18n:
    generated_at: "2026-05-10T19:43:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5f666a8196c802190dfd69e8b6a679a47db22f97c4c14d2f9fed73e8fb1ffe5a
    source_path: plugins/manage-plugins.md
    workflow: 16
---

大多數 Plugin 工作流程只需要幾個命令：搜尋、安裝、重新啟動 Gateway、驗證，並在不再需要該 Plugin 時解除安裝。

## 列出 Plugin

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

對腳本使用 `--json`。當 Plugin 套件宣告 `dependencies` 或
`optionalDependencies` 時，它會包含登錄庫診斷資訊，以及每個 Plugin 的
靜態 `dependencyStatus`。

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` 是冷啟動清查檢查。它會顯示 OpenClaw 可以從設定、資訊清單
和 Plugin 登錄庫探索到的內容；它不會證明已在執行中的 Gateway 行程
匯入了該 Plugin 執行階段。

## 安裝 Plugin

```bash
# 在 ClawHub 搜尋 Plugin 套件。
openclaw plugins search "calendar"

# 裸套件規格會先嘗試 ClawHub，然後退回 npm。
openclaw plugins install <package>

# 強制使用單一來源。
openclaw plugins install clawhub:<package>
openclaw plugins install npm:<package>

# 安裝特定版本或 dist-tag。
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# 從 git 或本機開發 checkout 安裝。
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

安裝 Plugin 程式碼後，請重新啟動為你的頻道提供服務的 Gateway：

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

當你需要證明該 Plugin 已註冊執行階段介面，例如工具、掛鉤、服務、Gateway
方法，或 Plugin 擁有的 CLI 命令時，請使用 `inspect --runtime`。

## 更新 Plugin

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

如果某個 Plugin 是從 npm dist-tag（例如 `@beta`）安裝的，之後的
`update <plugin-id>` 呼叫會重複使用已記錄的該標籤。傳入明確的 npm 規格
會將追蹤的安裝切換到該規格，以供未來更新使用。

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

當 Plugin 先前固定在精確版本或標籤時，第二個命令會將該 Plugin 移回
登錄庫的預設發行線。

當 `openclaw update` 在 beta 頻道執行時，預設線的 npm 和 ClawHub Plugin
記錄會先嘗試相符的 Plugin `@beta` 發行版本。如果該 beta 發行版本不存在，
OpenClaw 會退回已記錄的預設/latest 規格。對於 npm Plugin，當 beta 套件存在
但安裝驗證失敗時，OpenClaw 也會退回。精確版本和明確標籤（例如 `@rc` 或
`@beta`）會被保留。

## 解除安裝 Plugin

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

解除安裝會移除該 Plugin 的設定項目、Plugin 索引記錄、允許/拒絕清單項目，
以及適用時的連結載入路徑。除非你傳入 `--keep-files`，否則受管理的安裝目錄
會被移除。

在 Nix 模式（`OPENCLAW_NIX_MODE=1`）下，Plugin 安裝、更新、解除安裝、啟用
和停用命令會被停用。請改在該安裝的 Nix 來源中管理這些選擇；對於
nix-openclaw，請使用 agent-first
[快速入門](https://github.com/openclaw/nix-openclaw#quick-start)。

## 發布 Plugin

你可以將外部 Plugin 發布到 [ClawHub](https://clawhub.ai)、npmjs.com，
或兩者。

### 發布到 ClawHub

ClawHub 是 OpenClaw Plugin 的主要公開探索介面。它會在安裝前向使用者提供
可搜尋的中繼資料、版本歷程，以及登錄庫掃描結果。

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

使用者使用以下方式從 ClawHub 安裝：

```bash
openclaw plugins install clawhub:<package>
openclaw plugins install <package>
```

裸形式仍會先檢查 ClawHub。

### 發布到 npmjs.com

原生 npm Plugin 必須包含 Plugin 資訊清單和 `package.json` OpenClaw
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

使用者使用以下方式安裝僅限 npm 的 Plugin：

```bash
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

如果同一個套件也可在 ClawHub 取得，`npm:` 會略過 ClawHub 查詢並強制使用
npm 解析。

## 來源選擇

- **ClawHub**：當你想要 OpenClaw 原生探索、掃描摘要、版本和安裝提示時使用。
- **npmjs.com**：當你已經發布 JavaScript 套件，或需要 npm dist-tag/私有登錄庫工作流程時使用。
- **Git**：當你想直接從分支、標籤或提交安裝時使用。
- **本機路徑**：當你在同一台機器上開發或測試 Plugin 時使用。

## 相關

- [Plugin](/zh-TW/tools/plugin) - 概觀和疑難排解
- [`openclaw plugins`](/zh-TW/cli/plugins) - 完整 CLI 參考
- [ClawHub](/zh-TW/clawhub/cli) - 發布和登錄庫操作
- [建置 Plugin](/zh-TW/plugins/building-plugins) - 建立 Plugin 套件
- [Plugin 資訊清單](/zh-TW/plugins/manifest) - 資訊清單和套件中繼資料
