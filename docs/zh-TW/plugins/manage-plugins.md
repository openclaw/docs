---
read_when:
    - 你想要快速的 Plugin 安裝、列出、更新或解除安裝範例
    - 你想在 ClawHub 與 npm Plugin 發布之間做選擇
    - 你正在發布 Plugin 套件
sidebarTitle: Manage plugins
summary: 安裝、列出、解除安裝、更新及發布 OpenClaw Plugin 的快速範例
title: 管理 Plugin
x-i18n:
    generated_at: "2026-05-02T22:19:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: ec25a811b942f155f5d5e4cac475dbef74f0616bc85ff182c74598184e910320
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

在腳本中使用 `--json`。當 Plugin 套件宣告 `dependencies` 或
`optionalDependencies` 時，它會包含註冊表診斷資訊以及每個 Plugin 的
靜態 `dependencyStatus`。

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` 是冷啟動清查檢查。它會顯示 OpenClaw 可從設定、manifest
和 Plugin 註冊表探索到的內容；但不會證明已在執行中的 Gateway 程序已匯入
該 Plugin runtime。

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
openclaw plugins install npm:@openclaw/codex

# Install from git or a local development checkout.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

安裝 Plugin 程式碼後，重新啟動為你的頻道提供服務的 Gateway：

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

當你需要證明 Plugin 已註冊 runtime 介面，例如工具、hook、服務、Gateway
方法，或 Plugin 擁有的 CLI 命令時，請使用 `inspect --runtime`。

## 更新 Plugin

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

如果 Plugin 是從 npm dist-tag（例如 `@beta`）安裝，後續的
`update <plugin-id>` 呼叫會重用該已記錄的 tag。傳入明確的 npm spec
會把追蹤的安裝切換到該 spec，以供未來更新使用。

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

第二個命令會在 Plugin 先前固定到確切版本或 tag 時，將它移回註冊表的預設
發布線。

當 `openclaw update` 在 beta channel 上執行時，預設線的 npm 和 ClawHub
Plugin 記錄會先嘗試相符的 Plugin `@beta` 版本。如果該 beta 版本不存在，
OpenClaw 會退回到已記錄的 default/latest spec。確切版本和明確 tag
（例如 `@rc` 或 `@beta`）會保留。

## 解除安裝 Plugin

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

解除安裝會移除 Plugin 的設定項目、Plugin 索引記錄、允許/拒絕清單項目，
以及適用時的連結載入路徑。除非你傳入 `--keep-files`，否則受管理的安裝目錄
會被移除。

## 發布 Plugin

你可以將外部 Plugin 發布到 [ClawHub](https://clawhub.ai)、npmjs.com，
或兩者皆發布。

### 發布到 ClawHub

ClawHub 是 OpenClaw Plugin 的主要公開探索介面。它會在安裝前提供使用者可搜尋的
中繼資料、版本歷史，以及註冊表掃描結果。

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

使用者可透過以下方式從 ClawHub 安裝：

```bash
openclaw plugins install clawhub:<package>
openclaw plugins install <package>
```

裸格式仍會先檢查 ClawHub。

### 發布到 npmjs.com

原生 npm Plugin 必須包含 Plugin manifest 和 `package.json` OpenClaw
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

使用者可透過以下方式安裝僅限 npm 的 Plugin：

```bash
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

如果同一套件也可在 ClawHub 上取得，`npm:` 會略過 ClawHub 查詢並強制使用
npm 解析。

## 來源選擇

- **ClawHub**：當你想要 OpenClaw 原生探索、掃描摘要、版本，以及安裝提示時使用。
- **npmjs.com**：當你已經發布 JavaScript 套件，或需要 npm dist-tag/私有註冊表工作流程時使用。
- **Git**：當你想要直接從分支、tag 或 commit 安裝時使用。
- **本機路徑**：當你正在同一台機器上開發或測試 Plugin 時使用。

## 相關

- [Plugin](/zh-TW/tools/plugin) - 概觀與疑難排解
- [`openclaw plugins`](/zh-TW/cli/plugins) - 完整 CLI 參考
- [ClawHub](/zh-TW/tools/clawhub) - 發布與註冊表操作
- [建置 Plugin](/zh-TW/plugins/building-plugins) - 建立 Plugin 套件
- [Plugin manifest](/zh-TW/plugins/manifest) - manifest 與套件中繼資料
