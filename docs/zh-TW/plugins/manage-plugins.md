---
doc-schema-version: 1
read_when:
    - 你需要快速的外掛清單、安裝、更新、檢查或解除安裝範例
    - 你想要選擇外掛安裝來源
    - 你需要用於發布外掛套件的正確參考資料
sidebarTitle: Manage plugins
summary: 列出、安裝、更新、檢查與解除安裝 OpenClaw 外掛的快速範例
title: 管理外掛
x-i18n:
    generated_at: "2026-07-05T11:36:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d44170a7bdcac24bd1f39ea5a1d22af9af219f4c979cc18d839d0cf29bdb7c38
    source_path: plugins/manage-plugins.md
    workflow: 16
---

常用外掛管理命令。如需完整命令合約、旗標、
來源選擇規則與邊界案例，請參閱 [`openclaw plugins`](/zh-TW/cli/plugins)。

典型工作流程：尋找套件，從 ClawHub、npm、git 或
本機路徑安裝，讓受管理的閘道自動重新啟動（或手動重新啟動），
然後驗證外掛的執行階段註冊。

## 列出與搜尋外掛

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search "calendar"
```

`--json` 供指令碼使用：

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` 是冷庫存檢查：檢查 OpenClaw 能從設定、
manifest 與持久化外掛登錄檔中發現哪些內容。它不會證明
已在執行中的閘道匯入了外掛執行階段。JSON 輸出包含
登錄檔診斷，以及每個外掛的 `dependencyStatus`（宣告的
`dependencies`/`optionalDependencies` 是否能在磁碟上解析）。

`plugins search` 會查詢 ClawHub 中可安裝的外掛套件，並為每個結果
列印安裝提示（`openclaw plugins install clawhub:<package>`）。

## 啟用與停用外掛

```bash
openclaw plugins enable <plugin-id>
openclaw plugins disable <plugin-id>
```

切換外掛的設定項目，而不碰觸已安裝檔案。部分
內建外掛（內建模型/語音提供者、內建瀏覽器外掛）
預設啟用；其他外掛在安裝後需要執行 `enable`。

## 安裝外掛

```bash
# Search ClawHub for plugin packages.
openclaw plugins search "calendar"

# Install from ClawHub.
openclaw plugins install clawhub:<package>
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta

# Install from npm.
openclaw plugins install npm:<package>
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# Install from a local npm-pack artifact.
openclaw plugins install npm-pack:<path.tgz>

# Install from git or a local development checkout.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

在啟動切換期間，未加前綴的套件規格會從 npm 安裝，除非
名稱符合內建或官方外掛 id；在這種情況下，OpenClaw 會改用
該本機/官方副本。使用 `clawhub:`、`npm:`、`git:` 或
`npm-pack:` 以取得確定性的來源選擇。

只有在要覆寫來自不同來源的既有安裝目標時，才使用 `--force`。
若要例行升級受追蹤的 npm、ClawHub 或 hook-pack 安裝，
請改用 `openclaw plugins update`；`--force` 不支援搭配
`--link`。

## 重新啟動與檢查

啟用設定重新載入的執行中受管理閘道，會在安裝、更新或解除安裝
外掛程式碼後自動重新啟動。如果閘道未受管理，或重新載入已停用，
請先自行重新啟動，再檢查即時執行階段介面：

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

`inspect --runtime` 會載入外掛模組，並證明它已註冊執行階段
介面（工具、hook、服務、閘道方法、HTTP 路由、外掛擁有的
命令列介面命令）。一般的 `inspect` 與 `list` 只會執行冷
manifest/設定/登錄檔檢查。

## 更新外掛

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

傳入外掛 id 會重用其受追蹤的安裝規格：已儲存的 dist-tags
（`@beta`）與精確釘選版本，會沿用到之後的 `update <plugin-id>`
執行。

`openclaw plugins update --all` 是批次維護路徑。它仍會
遵循一般受追蹤的安裝規格，但受信任的官方 OpenClaw
外掛記錄會同步到目前官方目錄目標，而不是維持釘選到過時的
精確官方套件；當 `update.channel` 為 `beta` 時，該同步會
優先選擇 beta 發行線。使用指定目標的 `update <plugin-id>`
可讓精確或帶標籤的官方規格保持不變。

對於 npm 安裝，傳入明確的套件規格以切換受追蹤記錄：

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

第二個命令會在外掛先前釘選到精確版本或標籤時，將其移回
登錄檔的預設發行線。

如需確切的 fallback 與釘選規則，請參閱
[`openclaw plugins`](/zh-TW/cli/plugins#update)。

## 解除安裝外掛

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

解除安裝會移除外掛的設定項目、持久化外掛索引記錄、
允許/拒絕清單項目，以及適用時連結的 `plugins.load.paths` 項目。
除非傳入 `--keep-files`，否則會移除受管理的安裝目錄。當解除安裝
變更外掛來源時，執行中的受管理閘道會自動重新啟動。

在 Nix 模式（`OPENCLAW_NIX_MODE=1`）中，外掛安裝、更新、
解除安裝、啟用與停用都會停用；請改在安裝的 Nix 來源中管理這些選項。

## 選擇來源

| 來源        | 使用時機                                                                    | 範例                                                           |
| ----------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | 你想要 OpenClaw 原生探索、掃描摘要、版本與提示                             | `openclaw plugins install clawhub:<package>`                   |
| git         | 你想要來自儲存庫的分支、標籤或提交                                         | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| 本機路徑    | 你正在同一台機器上開發或測試外掛                                           | `openclaw plugins install --link ./my-plugin`                  |
| marketplace | 你正在安裝與 Claude 相容的市集外掛                                         | `openclaw plugins install <plugin> --marketplace <source>`     |
| npm pack    | 你正在透過 npm 安裝語意驗證本機套件成品                                    | `openclaw plugins install npm-pack:<path.tgz>`                 |
| npmjs.com   | 你已發布 JavaScript 套件，或需要 npm dist-tags/私有登錄檔                  | `openclaw plugins install npm:@acme/openclaw-plugin`           |

受管理的本機路徑安裝必須是外掛目錄或封存檔。請將
獨立外掛檔案放在 `plugins.load.paths`，而不是使用
`plugins install` 安裝它們。

## 發布外掛

ClawHub 是 OpenClaw 外掛的主要公開探索介面。當你希望使用者在安裝前
找到外掛中繼資料、版本歷程、登錄檔掃描結果與安裝提示時，請發布到那裡。

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

原生 npm 外掛在發布前必須提供外掛 manifest（`openclaw.plugin.json`）
以及 `package.json` 中繼資料：

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
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

請使用這些頁面取得完整發布合約，而不要將本頁視為發布參考：

- [ClawHub 發布](/zh-TW/clawhub/publishing) 說明擁有者、範圍、
  發行、審查、套件驗證與套件轉移。
- [建置外掛](/zh-TW/plugins/building-plugins) 展示完整外掛
  套件形狀（包含 `openclaw.plugin.json`）與首次發布工作流程。
- [外掛 manifest](/zh-TW/plugins/manifest) 定義原生外掛 manifest
  欄位。

如果同一個套件同時可在 ClawHub 與 npm 取得，請使用明確的
`clawhub:` 或 `npm:` 前綴來強制使用其中一個來源。

## 相關

- [外掛](/zh-TW/tools/plugin) - 安裝、設定、重新啟動與疑難排解
- [`openclaw plugins`](/zh-TW/cli/plugins) - 完整命令列介面參考
- [社群外掛](/zh-TW/plugins/community) - 公開探索與 ClawHub 發布
- [ClawHub](/zh-TW/clawhub/cli) - 登錄檔命令列介面操作
- [建置外掛](/zh-TW/plugins/building-plugins) - 建立外掛套件
- [外掛 manifest](/zh-TW/plugins/manifest) - manifest 與套件中繼資料
