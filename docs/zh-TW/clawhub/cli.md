---
read_when:
    - 使用 ClawHub 命令列介面
    - 偵錯安裝、更新或發布問題
summary: 命令列介面參考：命令、旗標、設定與鎖定檔行為。
x-i18n:
    generated_at: "2026-07-12T21:22:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 498d27d82a34ad43af9fc7bc0d40e844c6a14ededc8a017d6fa33768eec4b452
    source_path: clawhub/cli.md
    workflow: 16
---

# 命令列介面

命令列介面套件：`clawhub`，執行檔：`clawhub`。

使用 npm 或 pnpm 進行全域安裝：

```bash
npm i -g clawhub
# 或
pnpm add -g clawhub
```

接著進行驗證：

```bash
clawhub --help
clawhub login
clawhub whoami
```

## 全域旗標

- `--workdir <dir>`：工作目錄（預設：目前工作目錄；若已設定，則備援使用 Clawdbot 工作區）
- `--dir <dir>`：工作目錄下的安裝目錄（預設：`skills`）
- `--site <url>`：瀏覽器登入的基底 URL（預設：`https://clawhub.ai`）
- `--registry <url>`：API 基底 URL（預設：自動探索，否則使用 `https://clawhub.ai`）
- `--no-input`：停用提示

對應的環境變數：

- `CLAWHUB_SITE`（舊版 `CLAWDHUB_SITE`）
- `CLAWHUB_REGISTRY`（舊版 `CLAWDHUB_REGISTRY`）
- `CLAWHUB_WORKDIR`（舊版 `CLAWDHUB_WORKDIR`）

### HTTP Proxy

對於位於公司 Proxy 或受限網路後方的系統，命令列介面會遵循標準 HTTP Proxy 環境變數：

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

設定其中任一變數時，命令列介面會透過指定的 Proxy 路由對外請求。HTTPS 請求使用 `HTTPS_PROXY`，一般 HTTP 請求則使用 `HTTP_PROXY`。系統會遵循 `NO_PROXY` / `no_proxy`，讓特定主機或網域略過 Proxy。

在直接對外連線遭封鎖的系統上，這是必要設定（例如 Docker 容器、只能透過 Proxy 存取網際網路的 Hetzner VPS、公司防火牆）。

範例：

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "我的查詢"
```

未設定 Proxy 變數時，行為維持不變（直接連線）。

## 設定檔

儲存你的 API 權杖與快取的登錄 URL。

- macOS：`~/Library/Application Support/clawhub/config.json`
- Linux/XDG：`$XDG_CONFIG_HOME/clawhub/config.json` 或 `~/.config/clawhub/config.json`
- Windows：`%APPDATA%\\clawhub\\config.json`
- 舊版備援：如果 `clawhub/config.json` 尚不存在，但 `clawdhub/config.json` 存在，命令列介面會沿用舊版路徑
- 覆寫：`CLAWHUB_CONFIG_PATH`（舊版 `CLAWDHUB_CONFIG_PATH`）

## 命令

### `login` / `auth login`

- 預設：開啟瀏覽器前往 `<site>/cli/auth`，並透過迴送回呼完成登入。
- 無介面模式：`clawhub login --token clh_...`
- 遠端／無介面互動模式：`clawhub login --device` 會顯示代碼並等待你在 `<site>/cli/device` 完成授權。

### `whoami`

- 透過 `/api/v1/whoami` 驗證已儲存的權杖。

### `token`

- 將已儲存的 API 權杖輸出至標準輸出。
- 適合透過管線將本機登入權杖傳入 CI 機密設定命令。

### `star <skill>` / `unstar <skill>`

- 將技能加入你的精選項目，或從中移除。
- 呼叫 `POST /api/v1/stars/<slug>` 與 `DELETE /api/v1/stars/<slug>`。
- `--yes` 會略過確認。

### `search <query...>`

- 呼叫 `/api/v1/search?q=...`。
- 輸出包含技能 slug、擁有者帳號、顯示名稱與相關性分數。
- 搜尋排序會優先考量 slug／名稱權杖的完全相符，其次才是下載熱門度。例如獨立的 slug 權杖 `map`，與 `personal-map` 的相符程度會高於 `amap` 中的子字串。
- 熱門度只會小幅影響排名，無法保證排在最前面。
- 如果某項技能理應出現卻未顯示，請在登入狀態下執行 `clawhub inspect @owner/slug`，先檢查擁有者可見的審核診斷資訊，再重新命名中繼資料。

### `explore`

- 透過 `/api/v1/skills?limit=...&sort=createdAt` 列出最新技能（依 `createdAt` 降冪排序）。
- 旗標：
  - `--limit <n>`（1-200，預設：25）
  - `--sort newest|updated|rating|downloads|trending`（預設：newest）。為維持相容性，舊版安裝排序別名仍可使用。
  - `--json`（機器可讀輸出）
- 輸出：`<slug>  v<version>  <age>  <summary>`（摘要截斷為 50 個字元）。

### `inspect @owner/slug`

- 擷取技能中繼資料與版本檔案，但不進行安裝。
- `--version <version>`：檢查特定版本（預設：最新版本）。
- `--tag <tag>`：檢查已標記的版本（例如 `latest`）。
- `--versions`：列出版本歷程（第一頁）。
- `--limit <n>`：要列出的最大版本數（1-200）。
- `--files`：列出所選版本的檔案。
- `--file <path>`：擷取原始檔案內容（僅限文字檔；上限 200KB）。
- `--json`：機器可讀輸出。

### `install @owner/slug`

- 解析指定擁有者與技能的最新版本。
- 透過 `/api/v1/download` 下載 zip。
- 解壓縮至 `<workdir>/<dir>/<slug>`。
- 拒絕覆寫已釘選的技能；請先執行 `clawhub unpin <skill>`。
- 寫入：
  - `<workdir>/.clawhub/lock.json`（舊版為 `.clawdhub`）
  - `<skill>/.clawhub/origin.json`（舊版為 `.clawdhub`）

### `uninstall <skill>`

- 移除 `<workdir>/<dir>/<slug>`，並刪除鎖定檔項目。
- 登入時會盡力傳送遙測資料，以停用目前的安裝計數。
- 互動模式：要求確認。
- 非互動模式（`--no-input`）：需要 `--yes`。

### `list`

- 讀取 `<workdir>/.clawhub/lock.json`（舊版為 `.clawdhub`）。
- 在使用 `clawhub pin` 凍結的技能旁顯示 `pinned`，包括選填的原因。

### `pin <skill>`

- 在鎖定檔中將已安裝的技能標記為已釘選。
- `--reason <text>` 會記錄凍結技能的原因。
- `update --all` 會略過已釘選的技能，直接執行 `update <skill>` 則會遭拒。
- 已釘選的技能也會拒絕 `install --force`，以免意外取代本機內容。

### `unpin <skill>`

- 從已安裝技能中移除鎖定檔釘選，讓未來的更新可以修改該技能。

### `update [@owner/slug]` / `update --all`

- 根據本機檔案計算指紋。
- 如果指紋符合已知版本：不顯示提示。
- 如果指紋不符：
  - 預設拒絕
  - 使用 `--force` 覆寫（若為互動模式，也可透過提示確認）
- `--force` 永遠不會更新已釘選的技能。
- 對已釘選的技能執行 `update <skill>` 會立即失敗，並提示你先執行 `clawhub unpin <skill>`。
- `update --all` 會略過已釘選的 slug，並顯示哪些項目仍維持凍結的摘要。

### `skill publish <path>`

- 將本機套件組合指紋與 ClawHub 比較；若內容已發布，則成功結束。
- 新技能預設為 `1.0.0`；已變更的技能預設為下一個修補版本。
- `--version <version>` 會明確選取版本，即使內容與現有版本相符仍會發布。
- `--dry-run` 會解析發布流程但不上傳；`--json` 會輸出機器可讀的結果。
- 當執行者具有發布者存取權時，`--owner <handle>` 會以組織／使用者的發布者帳號發布。
- `--migrate-owner` 會在發布新版本時，將現有技能移轉至 `--owner`。需要同時具有兩個發布者的管理員／擁有者存取權。
- 擁有者與審核行為的說明請參閱 `docs/publishing.md`。
- 發布技能表示該技能會在 ClawHub 上以 `MIT-0` 授權發布。
- 已發布的技能可免費使用、修改與再散布，無須標示出處。
- ClawHub 不支援付費技能或個別技能定價。
- 舊版別名：`publish <path>`。

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

ClawHub 的可重複使用
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
工作流程會針對一個 `skill_path` 呼叫 `skill publish`，或針對 `root` 下的每個第一層技能資料夾呼叫（預設：`skills`）。它會略過未變更的技能，並採用相同的自動修補版本行為。

設定 `dry_run: true` 可在不使用權杖的情況下預覽。實際發布需要 `clawhub_token` 機密。

### `sync`

- 掃描目前的工作目錄、已設定的技能目錄，以及任何 `--root <dir>` 資料夾，尋找包含 `SKILL.md` 或 `skill.md` 的本機技能資料夾。
- 將每個本機技能指紋與 ClawHub 比較，只發布新增或已變更的技能。
- 新技能會以 `1.0.0` 發布；已變更的技能預設發布下一個修補版本。對於應提升較大語意化版本幅度的更新批次，請使用 `--bump minor|major`。
- `--dry-run` 會顯示發布計畫但不上傳；`--json` 會輸出機器可讀的計畫。
- `--all` 會發布所有新增或已變更的技能，而不顯示提示。若未使用 `--all`，互動式終端機會讓你選取要發布的技能。
- 當執行者具有發布者存取權時，`--owner <handle>` 會以組織／使用者的發布者帳號發布。
- `sync` 僅支援單向發布。它不會安裝、更新、下載，也不會回報安裝／下載遙測資料。

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- 需要執行 `clawhub login`。
- 透過 `POST /api/v1/skills/-/scan` 執行 ClawHub ClawScan，接著輪詢直到掃描進入終止狀態。
- 掃描為非同步作業，可能需要一段時間才能完成。排隊期間，終端機的旋轉指示器會顯示目前的優先掃描順位，以及前方還有多少項掃描。
- 已發布內容的掃描需要擁有權或發布者管理存取權。版主／管理員可透過 `clawhub-admin` 使用相同的後端。
- `--update` 僅可與 `--slug` 搭配使用；它會將成功的已發布掃描結果寫回所選版本。
- `--output <file.zip>` 會下載完整報告封存檔，其中包含 `manifest.json`、`clawscan.json`、`skillspector.json`、`static-analysis.json`、`virustotal.json` 與 `README.md`。
- `--json` 會輸出完整的輪詢回應，以供自動化使用。
- 已不再支援本機路徑掃描。請上傳新版本，然後使用 `scan download` 擷取該提交版本所儲存的掃描結果。

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- 需要執行 `clawhub login`。
- 下載已提交技能或外掛版本所儲存的掃描報告 ZIP，包括遭 ClawHub 安全性檢查封鎖或隱藏的版本。
- 下載技能時使用技能 slug，且預設為 `--kind skill`。
- 下載外掛時使用套件名稱，且必須指定 `--kind plugin`。
- `--version` 為必要選項，讓作者能檢查 ClawHub 封鎖的確切提交版本。
- `--output <file.zip>` 用於選擇目的地路徑。

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub 在
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/873b7e9a3403dbaa2c66ef15b655803562bd63c0/.github/workflows/skill-publish.yml)
提供官方可重複使用的工作流程，供技能儲存庫與目錄儲存庫使用。

典型的目錄設定：

```yaml
name: 技能發布

on:
  pull_request:
  workflow_dispatch:

jobs:
  dry-run:
    if: github.event_name == 'pull_request'
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@v1
    with:
      owner: nvidia
      dry_run: true

  publish:
    if: github.event_name == 'workflow_dispatch'
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@v1
    with:
      owner: nvidia
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

注意事項：

- 對於目錄儲存庫，`root` 預設為 `skills`。
- 傳入 `skill_path: skills/review-helper` 可處理單一技能資料夾。
- `owner` 對應命令列介面的 `--owner` 旗標；省略時會以已驗證身分的使用者發布。
- V1 技能發布使用 `clawhub_token`；GitHub OIDC 受信任發布目前僅適用於套件。

### `delete <skill>`

- 若未指定 `--version`，則軟刪除 Skills（擁有者、版主或管理員）。
- 呼叫 `DELETE /api/v1/skills/{slug}`。
- 由擁有者發起的軟刪除會保留該 slug 30 天；此命令會列印到期時間。
- `--version <version>` 會透過預設拒絕、
  版本專用的路由，永久刪除一個由你擁有且非最新的版本。
  已刪除的版本無法還原或重新發布。刪除目前的最新版本前，請先發布替代版本。
  在此僅限版本的流程中，平台工作人員無法略過擁有權限制。
- `--reason <text>` 會在整個 Skills 的軟刪除記錄與稽核日誌中記錄審核備註。
- `--note <text>` 是 `--reason` 的別名。
- `--yes` 會略過確認。

### `undelete <skill>`

- 還原隱藏的 Skills（擁有者、版主或管理員）。
- 無法取消刪除版本；永久刪除的版本無法還原。
- 呼叫 `POST /api/v1/skills/{slug}/undelete`。
- `--reason <text>` 會在 Skills 與稽核日誌中記錄審核備註。
- `--note <text>` 是 `--reason` 的別名。
- `--yes` 會略過確認。

### `hide <skill>`

- 隱藏 Skills（擁有者、版主或管理員）。
- `delete` 的別名。

### `unhide <skill>`

- 取消隱藏 Skills（擁有者、版主或管理員）。
- `undelete` 的別名。

### `skill rename <skill> <new-name>`

- 重新命名你擁有的 Skills，並保留先前的 slug 作為重新導向別名。
- 呼叫 `POST /api/v1/skills/{slug}/rename`。
- `--yes` 會略過確認。

### `skill merge <source> <target>`

- 將一個你擁有的 Skills 合併到另一個你擁有的 Skills。
- 來源 slug 將不再公開列出，並成為指向目標的重新導向別名。
- 呼叫 `POST /api/v1/skills/{sourceSlug}/merge`。
- `--yes` 會略過確認。

### `transfer`

- 擁有權移轉工作流程。
- 移轉至使用者代號時，會建立待處理要求，由接收者接受。
- 移轉至組織／發布者代號時，只有在執行者同時具備目前擁有者與目標發布者的
  管理員存取權時，才會立即套用。
- 子命令：
  - `transfer request <skill> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <skill> [--yes]`
  - `transfer reject <skill> [--yes]`
  - `transfer cancel <skill> [--yes]`
- 端點：
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- 透過 `GET /api/v1/packages` 和 `GET /api/v1/packages/search` 瀏覽或搜尋統一的套件目錄。
- 對外掛和其他套件家族項目使用此命令；頂層 `search` 仍是 Skills 搜尋介面。
- 旗標：
  - `--family skill|code-plugin|bundle-plugin`
  - `--official`
  - `--executes-code`
  - `--target <target>`, `--os <os>`, `--arch <arch>`, `--libc <libc>`
  - `--requires-browser`, `--requires-desktop`, `--requires-native-deps`
  - `--requires-external-service`, `--external-service <name>`
  - `--binary <name>`, `--os-permission <name>`
  - `--artifact-kind legacy-zip|npm-pack`
  - `--npm-mirror`
  - `--limit <n>`（1-100，預設值：25）
  - `--json`

範例：

```bash
clawhub package explore --family code-plugin
clawhub package explore --family code-plugin --os darwin --requires-desktop
clawhub package explore --family code-plugin --artifact-kind npm-pack
clawhub package explore --npm-mirror
clawhub package explore episodic-claw --family code-plugin
```

### `package inspect <name>`

- 在不安裝的情況下擷取套件中繼資料。
- 使用此命令檢查外掛中繼資料、相容性、驗證、來源，以及版本／檔案。
- `--version <version>`：檢查特定版本（預設值：最新版本）。
- `--tag <tag>`：檢查加上標籤的版本（例如 `latest`）。
- `--versions`：列出版本歷史記錄（第一頁）。
- `--limit <n>`：要列出的版本數上限（1-100）。
- `--files`：列出所選版本的檔案。
- `--file <path>`：擷取原始檔案內容（僅限文字檔案；上限 200KB）。
- `--json`：機器可讀的輸出。

### `package download <name>`

- 透過
  `GET /api/v1/packages/{name}/versions/{version}/artifact` 解析套件版本。
- 從解析器的 `downloadUrl` 下載成品。
- 驗證所有成品的 ClawHub SHA-256。
- 對於 ClawPack npm-pack 成品，還會驗證 npm `sha512` 完整性、
  npm shasum，以及壓縮封存檔的 `package.json` 名稱／版本。
- 舊版 ZIP 版本會透過舊版 ZIP 路由下載。
- 旗標：
  - `--version <version>`：下載特定版本。
  - `--tag <tag>`：下載加上標籤的版本（預設值：`latest`）。
  - `-o, --output <path>`：輸出檔案或目錄。
  - `--force`：覆寫現有的輸出檔案。
  - `--json`：機器可讀的輸出。

範例：

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- 為本機成品計算 ClawHub SHA-256、npm `sha512` 完整性及 npm shasum。
- 搭配 `--package` 時，會從 ClawHub 解析預期的中繼資料，並將
  本機檔案與已發布的成品中繼資料進行比較。
- 搭配直接摘要旗標時，無須查詢網路即可驗證。
- 旗標：
  - `--package <name>`：用於解析預期成品中繼資料的套件名稱。
  - `--version <version>` 或 `--tag <tag>`：預期的套件版本。
  - `--sha256 <hex>`：預期的 ClawHub SHA-256。
  - `--npm-integrity <sri>`：預期的 npm 完整性。
  - `--npm-shasum <sha1>`：預期的 npm shasum。
  - `--json`：機器可讀的輸出。

範例：

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- 對本機外掛套件
  資料夾執行 ClawHub 命令列介面內建的外掛檢查器。
- 預設執行離線／靜態驗證，不會尋找或匯入本機
  OpenClaw 原始碼簽出。
- 嚴重相容性錯誤會以非零狀態結束。僅警告的發現會列印出來，但
  會以零狀態結束。
- 旗標：
  - `--out <dir>`：將外掛檢查器報告寫入此目錄。
  - `--openclaw <path>`：針對明確指定的本機 OpenClaw 原始碼簽出進行檢查。
  - `--runtime`：啟用執行階段擷取；會匯入外掛程式碼。
  - `--allow-execute`：允許在隔離的工作區中進行執行階段擷取。
  - `--no-mock-sdk`：停用執行階段擷取期間模擬的 OpenClaw SDK。
  - `--json`：機器可讀的輸出。

範例：

```bash
clawhub package validate ./example-plugin
```

若驗證回報套件、資訊清單、SDK 匯入或成品發現，請參閱
[外掛驗證修正](/clawhub/plugin-validation-fixes)，然後重新執行命令。

### `package delete <name>`

- 若未指定 `--version`，則軟刪除套件及所有發行版本。
- `--version <version>` 會透過預設拒絕、
  版本專用的路由，永久刪除一個由你擁有且非最新的發行版本。
  已刪除的版本無法還原或重新發布。刪除目前的最新版本前，請先發布替代版本。
  此僅限版本的流程要求套件擁有者或組織發布者管理員執行；
  平台工作人員無法略過套件擁有權限制。
- 整個套件的軟刪除要求套件擁有者、組織發布者擁有者／管理員、平台
  版主或平台管理員執行。
- 旗標：
  - `--version <version>`：永久刪除一個非最新版本。
  - `--yes`：略過確認。
  - `--json`：機器可讀的輸出。

範例：

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- 還原已軟刪除的套件與發行版本。
- 無法取消刪除版本；永久刪除的版本無法還原。
- 要求套件擁有者、組織發布者擁有者／管理員、平台版主
  或平台管理員執行。
- 呼叫 `POST /api/v1/packages/{name}/undelete`。
- 旗標：
  - `--yes`：略過確認。
  - `--json`：機器可讀的輸出。

範例：

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- 將套件移轉給另一個發布者。
- 除非由平台管理員執行，否則必須同時具備目前套件擁有者與目標
  發布者的管理員存取權。
- 具範圍的套件名稱必須移轉給相符的範圍擁有者。
- 呼叫 `POST /api/v1/packages/{name}/transfer`。
- 旗標：
  - `--to <owner>`：目標發布者代號。
  - `--reason <text>`：選用的稽核原因。
  - `--json`：機器可讀的輸出。

範例：

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- 用於向版主檢舉套件的已驗證命令。
- 呼叫 `POST /api/v1/packages/{name}/report`。
- 檢舉以套件為層級，可選擇與某個版本相關聯，並會顯示
  給版主進行審查。
- 檢舉本身不會自動隱藏套件或封鎖下載。
- 旗標：
  - `--version <version>`：選擇性附加至檢舉的套件版本。
  - `--reason <text>`：必要的檢舉原因。
  - `--json`：機器可讀的輸出。

範例：

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "可疑的原生承載內容"
```

### `package moderation-status`

- 用於檢查套件審核可見性的擁有者命令。
- 呼叫 `GET /api/v1/packages/{name}/moderation`。
- 顯示目前的套件掃描狀態、未結案檢舉數量、最新發行版本的人工
  審核狀態、下載封鎖狀態及審核原因。
- 旗標：
  - `--json`：機器可讀的輸出。

範例：

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- 檢查套件是否已準備好供未來的 OpenClaw 使用。
- 呼叫 `GET /api/v1/packages/{name}/readiness`。
- 回報正式狀態、ClawPack 可用性、成品摘要、
  來源出處、OpenClaw 相容性、主機目標、環境中繼資料
  及掃描狀態的阻礙因素。
- 旗標：
  - `--json`：機器可讀的輸出。

範例：

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- 顯示可能取代 OpenClaw 內建外掛之套件的
  操作者導向遷移狀態。
- 呼叫與 `package readiness` 相同的計算式準備度端點，但會列印
  以遷移為重點的狀態、最新版本、正式套件狀態、檢查項目及
  阻礙因素。
- 旗標：
  - `--json`：機器可讀的輸出。

範例：

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- 建立由已驗證使用者擁有的組織發布者。
- 代號會正規化為小寫，傳入時可包含或不包含 `@`。
- 新建立的組織發布者預設不受信任／非正式。
- 若代號已由現有發布者、使用者或保留路由使用，則會失敗。

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- 透過 `POST /api/v1/packages` 發布程式碼外掛或套件組合外掛。
- `<source>` 接受：
  - 本機資料夾路徑：`./my-plugin`
  - 本機 ClawPack npm-pack tarball：`./my-plugin-1.2.3.tgz`
  - GitHub 儲存庫：`owner/repo` 或 `owner/repo@ref`
  - GitHub URL：`https://github.com/owner/repo`
- 系統會從 `package.json`、`openclaw.plugin.json`，以及
  `.codex-plugin/plugin.json`、`.claude-plugin/plugin.json` 和
  `.cursor-plugin/plugin.json` 等實際 OpenClaw 套件組合標記自動偵測中繼資料。
- `.tgz` 來源會視為 ClawPack。命令列介面會上傳完全相同的 npm-pack
  位元組，並僅將解壓縮後的 `package/` 內容用於驗證與
  預先填入中繼資料。
- 程式碼外掛資料夾會在上傳前封裝成 ClawPack npm tarball，讓
  OpenClaw 安裝程序能驗證完全相同的成品。套件組合外掛資料夾仍會
  使用解壓縮檔案發布路徑。
- 對於 GitHub 來源，系統會根據儲存庫、解析後的提交、ref 和子路徑自動填入來源歸屬資訊。
- 對於本機資料夾，當 origin 遠端指向 GitHub 時，系統會從本機 git 自動偵測來源歸屬資訊。
- 外部程式碼外掛必須明確宣告 `openclaw.compat.pluginApi` 和
  `openclaw.build.openclawVersion`。
  頂層 `package.json.version` 不會作為發布驗證的備援值。
- `--dry-run` 可在不上傳的情況下預覽解析後的發布承載資料。
- `--json` 會輸出可供 CI 機器讀取的結果。
- 當操作者具有發布者存取權時，`--owner <handle>` 會以使用者或組織發布者代號發布。
- 有範圍的套件名稱必須符合所選擁有者。請參閱 `docs/publishing.md`。
- 現有旗標（`--family`、`--name`、`--version`、`--source-repo`、`--source-commit`、`--source-ref`、`--source-path`）仍可用於覆寫。
- 私有 GitHub 儲存庫需要 `GITHUB_TOKEN`。

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### 建議的本機流程

請先使用 `--dry-run`，以便在建立正式版本之前確認解析後的套件中繼資料與
來源歸屬資訊：

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### 本機資料夾流程

對於程式碼外掛，資料夾發布會從套件資料夾建置並上傳 ClawPack 成品：

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `--family code-plugin` 的最小 `package.json`

外部程式碼外掛需要在 `package.json` 中加入少量 OpenClaw 中繼資料。
以下最小資訊清單足以成功發布：

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2"
    }
  }
}
```

必要欄位：

- `openclaw.compat.pluginApi`
- `openclaw.build.openclawVersion`

注意事項：

- `package.json.version` 是你的套件發行版本，但不會作為
  OpenClaw 相容性／建置驗證的備援值。
- `openclaw.hostTargets` 和 `openclaw.environment` 是選用的中繼資料。
  若存在，ClawHub 可能會顯示它們，但發布並不要求這些資料。
- 如果你想發布更詳細的相容性中繼資料，
  `openclaw.compat.minGatewayVersion` 和
  `openclaw.build.pluginSdkVersion` 是選用的額外欄位。
- 如果你使用較舊版本的 `clawhub` 命令列介面，請在發布前升級，以便
  在上傳前執行本機預檢。
- 如果驗證回報修復代碼，請參閱
  [外掛驗證修正](/clawhub/plugin-validation-fixes)。

#### GitHub Actions

ClawHub 也在
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/873b7e9a3403dbaa2c66ef15b655803562bd63c0/.github/workflows/package-publish.yml)
提供適用於外掛儲存庫的官方可重複使用工作流程。

典型的呼叫端設定：

```yaml
name: Package Publish

on:
  pull_request:
  workflow_dispatch:
  push:
    tags:
      - "v*"

jobs:
  dry-run:
    if: github.event_name == 'pull_request'
    uses: openclaw/clawhub/.github/workflows/package-publish.yml@v0.12.0
    with:
      dry_run: true

  publish:
    if: github.event_name == 'workflow_dispatch' || startsWith(github.ref, 'refs/tags/')
    permissions:
      contents: read
      id-token: write
    uses: openclaw/clawhub/.github/workflows/package-publish.yml@v0.12.0
    with:
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

注意事項：

- 可重複使用工作流程預設會將 `source` 設為呼叫端儲存庫。
- 對於 monorepo，請傳入 `source_path`，讓工作流程發布外掛
  套件資料夾，例如 `source_path: extensions/codex`。
- 請將可重複使用工作流程固定至穩定標籤或完整提交 SHA。不要從 `@main` 執行版本發布。
- `pull_request` 應使用 `dry_run: true`，以避免 CI 產生正式資料。
- 實際發布應僅限於 `workflow_dispatch` 或標籤推送等受信任事件。
- 不使用密鑰的受信任發布僅適用於 `workflow_dispatch`；標籤推送仍需要 `clawhub_token`。
- 請保留 `clawhub_token`，以供首次發布、不受信任的套件或緊急發布使用。
- 工作流程會將 JSON 結果上傳為成品，並將其公開為工作流程輸出。

### `package trusted-publisher get <name>`

- 顯示套件的 GitHub Actions 受信任發布者設定。
- 設定完成後，請使用此命令確認儲存庫、工作流程檔案名稱
  以及選用的環境固定設定。
- 旗標：
  - `--json`：機器可讀取的輸出。

範例：

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- 為現有套件附加或取代 GitHub Actions 受信任發布者設定。
- 必須先透過一般手動或權杖驗證的
  `clawhub package publish` 建立套件。
- 設定完成後，未來受支援的 GitHub Actions 發布即可使用
  OIDC／受信任發布，而不需要長效 ClawHub 權杖。
- `--repository <repo>` 必須為 `owner/repo`。
- `--workflow-filename <file>` 必須符合
  `.github/workflows/` 中的工作流程檔案名稱。
- `--environment <name>` 是選用項目。設定後，OIDC 宣告中的 GitHub Actions
  環境必須完全相符。
- 執行此命令時，ClawHub 會驗證設定的 GitHub 儲存庫。
  公開儲存庫可透過公開 GitHub 中繼資料驗證。私有
  儲存庫需要 ClawHub 擁有該儲存庫的 GitHub 存取權，例如
  透過未來的 ClawHub GitHub App 安裝或其他已授權的
  GitHub 整合。
- 旗標：
  - `--repository <repo>`：GitHub 儲存庫，例如 `openclaw/example-plugin`。
  - `--workflow-filename <file>`：工作流程檔案名稱，例如 `package-publish.yml`。
  - `--environment <name>`：選用的完全相符 GitHub Actions 環境。
  - `--json`：機器可讀取的輸出。

範例：

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- 從套件移除受信任發布者設定。
- 如果需要停用或重新建立工作流程、儲存庫或環境固定設定，請將此命令用於復原。
- 在再次設定前，未來的實際發布必須使用一般驗證發布。
- 旗標：
  - `--json`：機器可讀取的輸出。

範例：

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### 安裝遙測

- 登入後執行 `clawhub install <slug>` 時傳送，除非已設定
  `CLAWHUB_DISABLE_TELEMETRY=1`。
- 回報採盡力而為。即使遙測無法使用，安裝命令也不會失敗。
- 詳細資訊：`docs/telemetry.md`。
