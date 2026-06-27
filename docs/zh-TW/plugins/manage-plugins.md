---
doc-schema-version: 1
read_when:
    - 你想要快速查看外掛清單、安裝、更新、檢查或解除安裝範例
    - 你想選擇外掛安裝來源
    - 你需要用於發布外掛套件的正確參考資料
sidebarTitle: Manage plugins
summary: 列出、安裝、更新、檢視與解除安裝 OpenClaw 外掛的快速範例
title: 管理外掛
x-i18n:
    generated_at: "2026-06-27T19:38:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd0c1143c6312603311931cbbdc63069a44bc5ec487e2a46b0266b86a556da4e
    source_path: plugins/manage-plugins.md
    workflow: 16
---

此頁面用於常見的外掛管理命令。如需完整的命令
合約、旗標、來源選擇規則和邊界情況，請參閱
[`openclaw plugins`](/zh-TW/cli/plugins)。

大多數安裝工作流程如下：

1. 尋找套件
2. 從 ClawHub、npm、git 或本機路徑安裝
3. 讓受管理的閘道自動重新啟動，或在未受管理時手動重新啟動
4. 驗證外掛的執行階段註冊

## 列出和搜尋外掛

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search "calendar"
```

對腳本使用 `--json`：

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` 是冷庫存檢查。它會顯示 OpenClaw 可從設定、
資訊清單和外掛登錄檔探索到的內容；它不會證明已執行中的
閘道已匯入外掛執行階段。JSON 輸出包含登錄檔診斷，以及當
外掛套件宣告 `dependencies` 或 `optionalDependencies` 時，每個外掛的靜態
`dependencyStatus`。

`plugins search` 會查詢 ClawHub 中可安裝的外掛套件，並列印
安裝提示，例如 `openclaw plugins install clawhub:<package>`。

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

# Install from a local npm pack artifact.
openclaw plugins install npm-pack:<path.tgz>

# Install from git or a local development checkout.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

裸套件規格會在啟動切換期間從 npm 安裝。當你需要確定性的來源選擇時，
請使用 `clawhub:`、`npm:`、`git:` 或 `npm-pack:`。
如果裸名稱符合官方外掛 id，OpenClaw 可以直接安裝
目錄項目。

只有在你有意覆寫現有安裝目標時，才使用 `--force`。對於已追蹤的 npm、
ClawHub 或 hook-pack 安裝的例行升級，請使用
`openclaw plugins update`。

## 重新啟動和檢查

安裝、更新或解除安裝外掛程式碼後，若執行中的受管理
閘道已啟用設定重新載入，會自動重新啟動。如果閘道未受管理
或已停用重新載入，請在檢查即時執行階段介面前自行重新啟動：

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

當你需要證明外掛已註冊執行階段介面，例如工具、鉤子、服務、
閘道方法、HTTP 路由或外掛擁有的命令列介面命令時，請使用
`inspect --runtime`。一般的 `inspect` 和 `list` 是冷資訊清單、
設定和登錄檔檢查。

## 更新外掛

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

當你傳入外掛 id 時，OpenClaw 會重用已追蹤的安裝規格。儲存的
dist-tag（例如 `@beta`）和精確釘選版本，在之後的
`update <plugin-id>` 執行中仍會繼續使用。

`openclaw plugins update --all` 是批次維護路徑。它仍會遵守
一般已追蹤的安裝規格，但受信任的官方 OpenClaw 外掛記錄可以
同步到目前的官方目錄目標，而不是停留在過時的精確
官方套件上。如果 `update.channel` 設為 `beta`，該批次官方同步
會使用 beta 頻道內容。當你有意保持精確或帶標籤的官方規格不變時，
請使用目標明確的 `update <plugin-id>`。

對於 npm 安裝，你可以傳入明確的套件規格來切換已追蹤
記錄：

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

第二個命令會在外掛先前釘選到精確版本或標籤時，將外掛移回
登錄檔的預設發布線。

當 `openclaw update` 在 beta 頻道上執行時，外掛記錄可以偏好
相符的 `@beta` 發布。如需精確的備援和釘選規則，請參閱
[`openclaw plugins`](/zh-TW/cli/plugins#update)。

## 解除安裝外掛

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

解除安裝會移除外掛的設定項目、持久化的外掛索引記錄、
允許/拒絕清單項目，以及適用時的連結載入路徑。除非你傳入
`--keep-files`，否則會移除受管理的安裝目錄。當解除安裝變更外掛來源時，
執行中的受管理閘道會自動重新啟動。

在 Nix 模式（`OPENCLAW_NIX_MODE=1`）中，外掛安裝、更新、解除安裝、啟用
和停用命令都會被停用。請改在該安裝的 Nix 來源中管理這些選擇。

## 選擇來源

| 來源        | 使用時機                                                                    | 範例                                                           |
| ----------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | 你需要 OpenClaw 原生的探索、掃描摘要、版本和提示                           | `openclaw plugins install clawhub:<package>`                   |
| npmjs.com   | 你已發布 JavaScript 套件，或需要 npm dist-tag/私人登錄檔                  | `openclaw plugins install npm:@acme/openclaw-plugin`           |
| git         | 你需要儲存庫中的分支、標籤或提交                                           | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| 本機路徑    | 你正在同一台機器上開發或測試外掛                                           | `openclaw plugins install --link ./my-plugin`                  |
| npm pack    | 你正在透過 npm 安裝語意驗證本機套件成品                                    | `openclaw plugins install npm-pack:<path.tgz>`                 |
| 市集        | 你正在安裝 Claude 相容的市集外掛                                           | `openclaw plugins install <plugin> --marketplace <source>`     |

受管理的本機路徑安裝必須是外掛目錄或封存檔。請將
獨立外掛檔案放在 `plugins.load.paths`，而不是使用
`plugins install` 安裝它們。

## 發布外掛

ClawHub 是 OpenClaw 外掛的主要公開探索介面。當你希望使用者在安裝前
找到外掛中繼資料、版本歷史、登錄檔掃描結果和安裝提示時，
請發布到那裡。

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

原生 npm 外掛在發布前必須包含外掛資訊清單和套件中繼資料：

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

請使用這些頁面作為完整發布合約，而不是將本頁視為
發布參考：

- [ClawHub 發布](/zh-TW/clawhub/publishing) 說明擁有者、範圍、發布、
  審查、套件驗證和套件轉移。
- [建置外掛](/zh-TW/plugins/building-plugins) 顯示外掛套件形狀
  和首次發布工作流程。
- [外掛資訊清單](/zh-TW/plugins/manifest) 定義原生外掛資訊清單欄位。

如果同一個套件同時可在 ClawHub 和 npm 取得，當你需要強制使用其中一個來源時，
請使用明確的 `clawhub:` 或 `npm:` 前綴。

## 相關

- [外掛](/zh-TW/tools/plugin) - 安裝、設定、重新啟動和疑難排解
- [`openclaw plugins`](/zh-TW/cli/plugins) - 完整命令列介面參考
- [社群外掛](/zh-TW/plugins/community) - 公開探索和 ClawHub 發布
- [ClawHub](/zh-TW/clawhub/cli) - 登錄檔命令列介面操作
- [建置外掛](/zh-TW/plugins/building-plugins) - 建立外掛套件
- [外掛資訊清單](/zh-TW/plugins/manifest) - 資訊清單和套件中繼資料
