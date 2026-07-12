---
doc-schema-version: 1
read_when:
    - 你想要在控制介面中瀏覽、安裝、啟用或停用外掛
    - 你想快速查看外掛清單、安裝、更新、檢查或解除安裝範例
    - 你想要選擇外掛安裝來源
    - 您需要適用於發布外掛套件的正確參考資料
sidebarTitle: Manage plugins
summary: 從控制介面或命令列介面管理 OpenClaw 外掛
title: 管理外掛
x-i18n:
    generated_at: "2026-07-11T21:34:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0b235dfca7ef815cc8b0f82db6a9ba8cb344b00612ffd77ca67c8bbd379bdf2a
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Control UI 涵蓋常見的探索、安裝、啟用與停用流程。命令列介面則提供更新、解除安裝、進階設定，以及明確的安裝來源控制。如需完整的命令契約、旗標、來源選擇規則與邊界情況，請參閱 [`openclaw plugins`](/zh-TW/cli/plugins)。

典型的命令列介面工作流程：尋找套件，從 ClawHub、npm、git 或本機路徑安裝，讓受管理的閘道自動重新啟動（或手動重新啟動），接著驗證外掛的執行階段註冊項目。

## 使用 Control UI

在 Control UI 中開啟 **外掛**，或使用相對於已設定 Control UI 基底路徑的 `/settings/plugins`。例如，基底路徑為 `/openclaw` 時，請使用 `/openclaw/settings/plugins`。此頁面有兩個分頁：

- **已安裝**會顯示完整的本機清單，並依類別分組（頻道、模型供應商、記憶、工具）。每一列都可開啟詳細資料檢視；其更多選項（`…`）選單可啟用或停用外掛，若是外部安裝的外掛，還會提供**移除**。此分頁也會列出已設定的 [MCP 伺服器](/zh-TW/cli/mcp)，並提供相同的選單式啟用、停用與移除操作，這些操作會編輯閘道設定中的 `mcp.servers`。
- **探索**是外掛商店：其中包含 OpenClaw 隨附的精選外掛、官方外部外掛，以及經過策展的連接器專區。連接器卡片可一鍵新增代管的 MCP 伺服器（GitHub、Notion、Linear、Sentry、Home Assistant），或跳轉至預先填入內容的 ClawHub 搜尋。在搜尋方塊中輸入內容會直接查詢 [ClawHub](https://clawhub.ai/plugins)，並附加一個**來自 ClawHub**區段，其中包含下載次數與來源驗證徽章。

隨附的外掛不需要安裝套件。其選單操作為**啟用**或**停用**。例如，Workboard 隨 OpenClaw 一併提供，且預設停用，因此請選擇**啟用**來開啟它。內建外掛無法移除，只能停用。

存取目錄與搜尋功能需要 `operator.read`。安裝、啟用、停用、移除及變更 MCP 伺服器則需要 `operator.admin`。ClawHub 安裝由閘道執行，並保留其信任、完整性與外掛安裝政策檢查。

安裝或移除外掛程式碼需要重新啟動閘道。若已安裝的外掛與目前的閘道執行階段支援，啟用狀態變更可在不重新啟動的情況下套用；否則 UI 會告知您需要重新啟動。使用 OAuth 的 MCP 連接器在新增後，仍需透過命令列介面執行一次 `openclaw mcp login <name>`。

Control UI 不支援從任意 npm、git 或本機路徑來源安裝、更新外掛，也不提供完整的外掛設定功能。這些操作請使用下方的命令列介面工作流程。

## 列出與搜尋外掛

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search "calendar"
```

供指令碼使用的 `--json`：

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` 是冷態清單檢查：顯示 OpenClaw 可從設定、資訊清單與持久化外掛登錄中探索到的項目。它無法證明已在執行中的閘道匯入了外掛執行階段。JSON 輸出包含登錄診斷資訊，以及每個外掛的 `dependencyStatus`（宣告的 `dependencies`／`optionalDependencies` 是否可在磁碟上解析）。

`plugins search` 會在 ClawHub 查詢可安裝的外掛套件，並為每個結果輸出安裝提示（`openclaw plugins install clawhub:<package>`）。

## 啟用與停用外掛

```bash
openclaw plugins enable <plugin-id>
openclaw plugins disable <plugin-id>
```

切換外掛的設定項目，而不變更已安裝的檔案。部分內建外掛（內建模型／語音供應商、內建瀏覽器外掛）預設啟用；其他外掛則需要在安裝後執行 `enable`。

## 安裝外掛

```bash
# 在 ClawHub 搜尋外掛套件。
openclaw plugins search "calendar"

# 從 ClawHub 安裝。
openclaw plugins install clawhub:<package>
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta

# 從 npm 安裝。
openclaw plugins install npm:<package>
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# 從本機 npm-pack 成品安裝。
openclaw plugins install npm-pack:<path.tgz>

# 從 git 或本機開發簽出安裝。
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

在啟動切換期間，未加前綴的套件規格會從 npm 安裝；若名稱符合內建或官方外掛 ID，OpenClaw 則改用該本機／官方副本。使用 `clawhub:`、`npm:`、`git:` 或 `npm-pack:` 可確保來源選擇具決定性。

僅在需要以不同來源覆寫現有安裝目標時使用 `--force`。若要例行升級已追蹤的 npm、ClawHub 或 hook-pack 安裝，請改用 `openclaw plugins update`；`--force` 不支援與 `--link` 搭配使用。

## 重新啟動與檢查

若執行中的受管理閘道已啟用設定重新載入，則在安裝、更新或解除安裝外掛程式碼後會自動重新啟動。若閘道未受管理或已停用重新載入，請先自行重新啟動，再檢查即時執行階段介面：

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

`inspect --runtime` 會載入外掛模組，並證明其已註冊執行階段介面（工具、掛鉤、服務、閘道方法、HTTP 路由、外掛自有的命令列介面命令）。不加參數的 `inspect` 與 `list` 僅執行冷態的資訊清單／設定／登錄檢查。

## 更新外掛

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

傳入外掛 ID 會重複使用其追蹤的安裝規格：已儲存的發行標籤（`@beta`）與精確鎖定版本會延續至之後的 `update <plugin-id>` 執行。

`openclaw plugins update --all` 是批次維護途徑。它仍會遵循一般追蹤的安裝規格，但受信任的官方 OpenClaw 外掛記錄會同步至目前的官方目錄目標，而不會持續鎖定在過時的官方套件精確版本；當 `update.channel` 為 `beta` 時，此同步會優先採用 beta 發行系列。若要讓精確版本或帶標籤的官方規格維持不變，請使用指定目標的 `update <plugin-id>`。

對於 npm 安裝，請傳入明確的套件規格以切換追蹤記錄：

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

若外掛先前鎖定至精確版本或標籤，第二個命令會將其移回登錄的預設發行系列。

如需確切的備援與版本鎖定規則，請參閱 [`openclaw plugins`](/zh-TW/cli/plugins#update)。

## 解除安裝外掛

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

解除安裝會移除外掛的設定項目、持久化外掛索引記錄、允許／拒絕清單項目，以及適用時連結的 `plugins.load.paths` 項目。除非傳入 `--keep-files`，否則也會移除受管理的安裝目錄。若解除安裝變更了外掛來源，執行中的受管理閘道會自動重新啟動。

在 Nix 模式（`OPENCLAW_NIX_MODE=1`）下，外掛的安裝、更新、解除安裝、啟用與停用功能全部停用；請改在該安裝項目的 Nix 來源中管理這些選項。

## 選擇來源

| 來源        | 適用情況                                                                    | 範例                                                           |
| ----------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | 您需要 OpenClaw 原生探索、掃描摘要、版本與提示                              | `openclaw plugins install clawhub:<package>`                   |
| git         | 您需要儲存庫中的分支、標籤或提交                                            | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| 本機路徑    | 您正在同一台機器上開發或測試外掛                                            | `openclaw plugins install --link ./my-plugin`                  |
| 市集        | 您正在安裝與 Claude 相容的市集外掛                                          | `openclaw plugins install <plugin> --marketplace <source>`     |
| npm pack    | 您要透過 npm 安裝語意驗證本機套件成品                                       | `openclaw plugins install npm-pack:<path.tgz>`                 |
| npmjs.com   | 您已發布 JavaScript 套件，或需要 npm 發行標籤／私人登錄                      | `openclaw plugins install npm:@acme/openclaw-plugin`           |

受管理的本機路徑安裝必須是外掛目錄或封存檔。獨立外掛檔案應放入 `plugins.load.paths`，不要使用 `plugins install` 安裝。

## 發布外掛

ClawHub 是 OpenClaw 外掛的主要公開探索介面。若希望使用者在安裝前找到外掛中繼資料、版本歷程、登錄掃描結果與安裝提示，請將外掛發布至此。

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

原生 npm 外掛在發布前必須包含外掛資訊清單（`openclaw.plugin.json`）與 `package.json` 中繼資料：

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

如需完整的發布契約，請使用下列頁面，而不要將本頁視為發布參考：

- [ClawHub 發布](/zh-TW/clawhub/publishing)說明擁有者、範圍、發行、審查、套件驗證與套件移轉。
- [建置外掛](/zh-TW/plugins/building-plugins)展示完整的外掛套件結構（包括 `openclaw.plugin.json`）與首次發布工作流程。
- [外掛資訊清單](/zh-TW/plugins/manifest)定義原生外掛資訊清單欄位。

若同一套件同時可於 ClawHub 與 npm 取得，請使用明確的 `clawhub:` 或 `npm:` 前綴以強制選擇其中一個來源。

## 相關內容

- [外掛](/zh-TW/tools/plugin) - 安裝、設定、重新啟動及疑難排解
- [`openclaw plugins`](/zh-TW/cli/plugins) - 完整命令列介面參考
- [社群外掛](/zh-TW/plugins/community) - 公開探索與 ClawHub 發布
- [ClawHub](/zh-TW/clawhub/cli) - 登錄命令列介面操作
- [建置外掛](/zh-TW/plugins/building-plugins) - 建立外掛套件
- [外掛資訊清單](/zh-TW/plugins/manifest) - 資訊清單與套件中繼資料
