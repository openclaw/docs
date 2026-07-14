---
doc-schema-version: 1
read_when:
    - 你想在 Control UI 中瀏覽、安裝、啟用或停用外掛
    - 你想快速查看外掛清單、安裝、更新、檢查或解除安裝的範例
    - 你想要選擇外掛安裝來源
    - 你想找到發布外掛套件的正確參考資料
sidebarTitle: Manage plugins
summary: 從控制介面或命令列介面管理 OpenClaw 外掛
title: 管理外掛
x-i18n:
    generated_at: "2026-07-14T13:59:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: dde533c089aba2d4df0a595a6b463437b6a58af821a246f96a9fbb5afdadf593
    source_path: plugins/manage-plugins.md
    workflow: 16
---

OpenClaw 控制介面涵蓋常見的探索、安裝、啟用與停用
工作流程。命令列介面則提供更新、解除安裝、進階設定，以及明確的
安裝來源控制。完整的命令契約、旗標、來源選擇
規則與邊界情況，請參閱 [`openclaw plugins`](/zh-TW/cli/plugins)。

典型的命令列介面工作流程：尋找套件，從 ClawHub、npm、git 或
本機路徑安裝，讓受管理的閘道自動重新啟動（或手動重新啟動），接著
驗證外掛的執行階段註冊項目。

## 使用控制介面

在控制介面中開啟**外掛**，或使用相對於
已設定控制介面基底路徑的 `/settings/plugins`。例如，基底路徑為 `/openclaw` 時會使用
`/openclaw/settings/plugins`。此頁面有兩個分頁：

- **已安裝**會依類別顯示完整的本機清單（頻道、
  模型供應商、記憶、工具）。每列都可開啟詳細資料檢視；其更多選項
  （`…`）選單可啟用或停用外掛，對於從外部安裝的
  外掛，還會提供**移除**。此分頁也會列出已設定的
  [MCP 伺服器](/zh-TW/cli/mcp)，並提供相同的選單式啟用、停用與移除
  操作，同時編輯閘道設定中的 `mcp.servers`。
- **探索**是外掛商店：包含 OpenClaw 隨附的精選外掛、官方
  外部外掛，以及經過策展的連接器專區。連接器卡片可以按一下就新增
  託管的 MCP 伺服器（GitHub、Notion、Linear、Sentry、
  Home Assistant），或跳至預先填入的 ClawHub 搜尋。在搜尋
  方塊中輸入內容會直接查詢 [ClawHub](https://clawhub.ai/plugins)，並附加一個**來自
  ClawHub**區段，其中包含下載次數與來源驗證徽章。

隨附的外掛不需要安裝套件。其選單操作是**啟用**
或**停用**。例如，Workboard 隨 OpenClaw 提供，且預設為
停用，因此請選擇**啟用**將其開啟。隨附的外掛無法
移除，只能停用。

存取目錄與搜尋需要 `operator.read`。安裝、啟用、停用、
移除及變更 MCP 伺服器需要 `operator.admin`。ClawHub 安裝由
閘道執行，並保留其信任、完整性與外掛安裝
政策檢查。管理員啟用已安裝的外掛時，也會將所選外掛加入現有的限制性
`plugins.allow` 清單，以記錄該明確信任。明確的 `plugins.deny` 項目仍具有決定權，
必須先移除才能啟用外掛。

安裝或移除外掛程式碼需要重新啟動閘道。若已安裝的外掛與目前的
閘道執行階段支援，啟用狀態的變更可以在不重新啟動的情況下套用；
否則控制介面會告知你需要重新啟動。以 OAuth 為基礎的 MCP 連接器新增後，
仍需透過命令列介面執行一次 `openclaw mcp login <name>`。

控制介面不支援從任意 npm、git 或本機路徑來源安裝、
更新外掛，也不提供完整的外掛設定。這些操作請使用
下方的命令列介面工作流程。

## 列出及搜尋外掛

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

`plugins list` 是冷態清單檢查：顯示 OpenClaw 可從
設定、資訊清單與持久化外掛登錄中探索到的內容。它無法證明
已在執行的閘道已匯入外掛執行階段。JSON 輸出包含
登錄診斷資訊，以及每個外掛的 `dependencyStatus`（宣告的
`dependencies`/`optionalDependencies` 是否可在磁碟上解析）。

`plugins search` 會查詢 ClawHub 中可安裝的外掛套件，並為每個結果輸出
安裝提示（`openclaw plugins install clawhub:<package>`）。

## 啟用及停用外掛

```bash
openclaw plugins enable <plugin-id>
openclaw plugins disable <plugin-id>
```

切換外掛的設定項目，而不變更已安裝的檔案。部分
隨附外掛（隨附的模型／語音供應商、隨附的瀏覽器外掛）
預設為啟用；其他外掛安裝後需要 `enable`。

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

在啟動切換期間，未加前綴的套件規格會從 npm 安裝，除非
名稱符合隨附或官方外掛 ID；在這種情況下，OpenClaw 會改用
該本機／官方副本。請使用 `clawhub:`、`npm:`、`git:` 或
`npm-pack:` 來確定性選擇來源。

只有在需要以不同來源覆寫現有安裝目標時，才使用 `--force`。
若要例行升級已追蹤的 npm、ClawHub 或 hook-pack 安裝，
請改用 `openclaw plugins update`；`--force` 不支援與
`--link` 搭配使用。

## 重新啟動及檢查

若執行中的受管理閘道已啟用設定重新載入功能，則會在
安裝、更新或解除安裝外掛程式碼後自動重新啟動。如果閘道
未受管理或已停用重新載入，請自行重新啟動，再檢查即時
執行階段介面：

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

`inspect --runtime` 會載入外掛模組，並證明它已註冊執行階段
介面（工具、鉤子、服務、閘道方法、HTTP 路由、外掛擁有的
命令列介面命令）。一般的 `inspect` 與 `list` 僅會執行冷態資訊清單／設定／登錄
檢查。

## 更新外掛

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

傳入外掛 ID 會重複使用其追蹤的安裝規格：儲存的 dist-tag
（`@beta`）與明確釘選的版本會延續到後續的 `update <plugin-id>`
執行。

`openclaw plugins update --all` 是批次維護路徑。它仍會
遵循一般的追蹤安裝規格，但受信任的官方 OpenClaw
外掛記錄會同步至目前的官方目錄目標，而不會
持續釘選在過時的明確官方套件；當 `update.channel` 為
`beta` 時，該同步會優先使用 beta 發行系列。若要讓明確或帶標籤的
官方規格保持不變，請使用指定目標的 `update <plugin-id>`。

對於 npm 安裝，請傳入明確的套件規格以切換追蹤的
記錄：

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

如果外掛先前釘選到明確版本或標籤，第二個命令會將它移回
登錄的預設發行系列。

確切的後援與釘選規則請參閱
[`openclaw plugins`](/zh-TW/cli/plugins#update)。

## 解除安裝外掛

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

解除安裝會移除外掛的設定項目、持久化外掛索引記錄、
允許／拒絕清單項目，以及適用時連結的 `plugins.load.paths` 項目。
除非傳入 `--keep-files`，否則也會移除受管理的安裝目錄。
當解除安裝變更外掛來源時，執行中的受管理閘道會自動重新啟動。

在 Nix 模式（`OPENCLAW_NIX_MODE=1`）中，外掛安裝、更新、解除安裝、
啟用與停用功能全都停用；請改在該安裝的 Nix 來源中管理這些選項。

## 選擇來源

| 來源        | 適用情況                                                                    | 範例                                                           |
| ----------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | 你需要 OpenClaw 原生探索、掃描摘要、版本與提示                              | `openclaw plugins install clawhub:<package>`                   |
| git         | 你需要儲存庫中的分支、標籤或提交                                            | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| 本機路徑    | 你正在同一台機器上開發或測試外掛                                            | `openclaw plugins install --link ./my-plugin`                  |
| 市集        | 你正在安裝與 Claude 相容的市集外掛                                          | `openclaw plugins install <plugin> --marketplace <source>`     |
| npm pack    | 你要透過 npm 安裝語意驗證本機套件成品                                       | `openclaw plugins install npm-pack:<path.tgz>`                 |
| npmjs.com   | 你已發行 JavaScript 套件，或需要 npm dist-tag／私人登錄                      | `openclaw plugins install npm:@acme/openclaw-plugin`           |

受管理的本機路徑安裝必須是外掛目錄或封存檔。請將
獨立外掛檔案放在 `plugins.load.paths`，而不是使用
`plugins install` 安裝。

## 發布外掛

ClawHub 是 OpenClaw 外掛的主要公開探索介面。若希望使用者在安裝前
找到外掛中繼資料、版本歷程、登錄掃描結果與安裝提示，
請發布至該處。

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

原生 npm 外掛在發布前必須提供外掛資訊清單（`openclaw.plugin.json`）以及
`package.json` 中繼資料：

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

請使用以下頁面瞭解完整的發布契約，不要將本頁視為
發布參考資料：

- [ClawHub 發布](/zh-TW/clawhub/publishing)說明擁有者、範圍、
  發行、審查、套件驗證與套件移轉。
- [建置外掛](/zh-TW/plugins/building-plugins)展示完整的外掛
  套件結構（包括 `openclaw.plugin.json`）與首次發布
  工作流程。
- [外掛資訊清單](/zh-TW/plugins/manifest)定義原生外掛資訊清單
  欄位。

如果同一套件同時存在於 ClawHub 與 npm，請使用明確的
`clawhub:` 或 `npm:` 前綴來強制選擇其中一個來源。

## 相關內容

- [外掛](/zh-TW/tools/plugin) - 安裝、設定、重新啟動與疑難排解
- [`openclaw plugins`](/zh-TW/cli/plugins) - 完整命令列介面參考
- [社群外掛](/zh-TW/plugins/community) - 公開探索與 ClawHub 發布
- [ClawHub](/zh-TW/clawhub/cli) - 登錄命令列介面操作
- [建置外掛](/zh-TW/plugins/building-plugins) - 建立外掛套件
- [外掛資訊清單](/zh-TW/plugins/manifest) - 資訊清單與套件中繼資料
