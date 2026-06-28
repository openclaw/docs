---
read_when:
    - 使用 ClawHub 命令列介面
    - 偵錯安裝、更新或發布
summary: 命令列介面參考：命令、旗標、設定與鎖定檔行為。
x-i18n:
    generated_at: "2026-06-28T00:10:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 70aabaeae7b205e0ef30de010624e18c471baf214ff5e07ac1db8139fccb1c27
    source_path: clawhub/cli.md
    workflow: 16
---

# 命令列介面

命令列介面套件：`clawhub`，執行檔：`clawhub`。

使用 npm 或 pnpm 全域安裝：

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

接著驗證：

```bash
clawhub --help
clawhub login
clawhub whoami
```

## 全域旗標

- `--workdir <dir>`：工作目錄（預設：cwd；若已設定則退回使用 Clawdbot 工作區）
- `--dir <dir>`：workdir 底下的安裝目錄（預設：`skills`）
- `--site <url>`：瀏覽器登入的基底 URL（預設：`https://clawhub.ai`）
- `--registry <url>`：API 基底 URL（預設：自動探索，否則為 `https://clawhub.ai`）
- `--no-input`：停用提示

環境變數對應項：

- `CLAWHUB_SITE`（舊版 `CLAWDHUB_SITE`）
- `CLAWHUB_REGISTRY`（舊版 `CLAWDHUB_REGISTRY`）
- `CLAWHUB_WORKDIR`（舊版 `CLAWDHUB_WORKDIR`）

### HTTP 代理

命令列介面會遵循標準 HTTP 代理環境變數，適用於位於企業代理或受限網路後方的系統：

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

設定上述任一變數時，命令列介面會透過指定的代理路由對外請求。`HTTPS_PROXY` 用於 HTTPS 請求，`HTTP_PROXY` 用於純 HTTP。`NO_PROXY` / `no_proxy` 會被遵循，以便對特定主機或網域略過代理。

這在直接對外連線遭封鎖的系統上是必要的（例如 Docker 容器、僅能透過代理連網的 Hetzner VPS、企業防火牆）。

範例：

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

未設定代理變數時，行為不變（直接連線）。

## 設定檔

儲存你的 API 權杖與快取的登錄 URL。

- macOS：`~/Library/Application Support/clawhub/config.json`
- Linux/XDG：`$XDG_CONFIG_HOME/clawhub/config.json` 或 `~/.config/clawhub/config.json`
- Windows：`%APPDATA%\\clawhub\\config.json`
- 舊版後備：如果 `clawhub/config.json` 尚不存在但 `clawdhub/config.json` 存在，命令列介面會重用舊版路徑
- 覆寫：`CLAWHUB_CONFIG_PATH`（舊版 `CLAWDHUB_CONFIG_PATH`）

## 命令

### `login` / `auth login`

- 預設：開啟瀏覽器前往 `<site>/cli/auth`，並透過環回回呼完成。
- 無頭模式：`clawhub login --token clh_...`
- 遠端/無頭互動模式：`clawhub login --device` 會列印代碼，並在你於 `<site>/cli/device` 授權時等待。

### `whoami`

- 透過 `/api/v1/whoami` 驗證已儲存的權杖。

### `token`

- 將已儲存的 API 權杖列印到 stdout。
- 適合用來將本機登入權杖管線傳入 CI 祕密設定命令。

### `star <skill>` / `unstar <skill>`

- 從你的精選項目新增/移除技能。
- 呼叫 `POST /api/v1/stars/<slug>` 和 `DELETE /api/v1/stars/<slug>`。
- `--yes` 會略過確認。

### `search <query...>`

- 呼叫 `/api/v1/search?q=...`。
- 輸出包含技能 slug、擁有者帳號、顯示名稱，以及相關性分數。
- 搜尋會先偏好精確的 slug/名稱權杖符合，再考量下載熱門度。像 `map` 這樣的獨立 slug 權杖，會比 `amap` 內部的子字串更強烈地符合 `personal-map`。
- 熱門度只是小幅排名先驗，不保證位於最前面。
- 如果某個技能應該出現但沒有出現，請在登入後執行 `clawhub inspect @owner/slug`，先檢查擁有者可見的審核診斷，再重新命名中繼資料。

### `explore`

- 透過 `/api/v1/skills?limit=...&sort=createdAt` 列出最新技能（依 `createdAt` 遞減排序）。
- 旗標：
  - `--limit <n>`（1-200，預設：25）
  - `--sort newest|updated|rating|downloads|trending`（預設：newest）。舊版安裝排序別名仍可為相容性而運作。
  - `--json`（機器可讀輸出）
- 輸出：`<slug>  v<version>  <age>  <summary>`（摘要截斷為 50 個字元）。

### `inspect @owner/slug`

- 擷取技能中繼資料與版本檔案，但不安裝。
- `--version <version>`：檢查特定版本（預設：latest）。
- `--tag <tag>`：檢查帶標籤的版本（例如 `latest`）。
- `--versions`：列出版本歷史（第一頁）。
- `--limit <n>`：要列出的最大版本數（1-200）。
- `--files`：列出所選版本的檔案。
- `--file <path>`：擷取原始檔案內容（僅文字檔；200KB 限制）。
- `--json`：機器可讀輸出。

### `install @owner/slug`

- 解析指定擁有者與技能的最新版本。
- 透過 `/api/v1/download` 下載 zip。
- 解壓縮到 `<workdir>/<dir>/<slug>`。
- 拒絕覆寫已釘選的技能；請先執行 `clawhub unpin <skill>`。
- 寫入：
  - `<workdir>/.clawhub/lock.json`（舊版 `.clawdhub`）
  - `<skill>/.clawhub/origin.json`（舊版 `.clawdhub`）

### `uninstall <skill>`

- 移除 `<workdir>/<dir>/<slug>`，並刪除 lockfile 項目。
- 登入時會以盡力而為方式傳送遙測，以便停用目前的安裝計數。
- 互動模式：要求確認。
- 非互動模式（`--no-input`）：需要 `--yes`。

### `list`

- 讀取 `<workdir>/.clawhub/lock.json`（舊版 `.clawdhub`）。
- 在使用 `clawhub pin` 凍結的技能旁顯示 `pinned`，包含可選原因。

### `pin <skill>`

- 在 lockfile 中將已安裝的技能標記為已釘選。
- `--reason <text>` 記錄技能被凍結的原因。
- 已釘選的技能會被 `update --all` 略過，也會被直接的 `update <skill>` 拒絕。
- 已釘選的技能也會拒絕 `install --force`，因此本機位元組不會被意外取代。

### `unpin <skill>`

- 從已安裝的技能移除 lockfile 釘選，讓未來更新可以修改它。

### `update [@owner/slug]` / `update --all`

- 從本機檔案計算指紋。
- 如果指紋符合已知版本：不提示。
- 如果指紋不符合：
  - 預設拒絕
  - 使用 `--force` 覆寫（或在互動模式下提示）
- 已釘選的技能永遠不會被 `--force` 更新。
- `update <skill>` 對已釘選的技能會快速失敗，並告訴你先執行 `clawhub unpin <skill>`。
- `update --all` 會略過已釘選的 slug，並列印維持凍結項目的摘要。

### `skill publish <path>`

- 將本機套件組合指紋與 ClawHub 比較，當內容已發布時成功結束。
- 新技能預設為 `1.0.0`；已變更的技能預設為下一個 patch 版本。
- `--version <version>` 會明確選取版本，即使內容符合現有版本也會發布。
- `--dry-run` 會解析發布但不上傳；`--json` 會列印機器可讀結果。
- `--owner <handle>` 會在執行者具備發布者存取權時，發布到組織/使用者發布者帳號底下。
- `--migrate-owner` 會在發布新版本時，將現有技能移動到 `--owner`。需要兩個發布者的管理員/擁有者存取權。
- 擁有者與審核行為在 `docs/publishing.md` 中說明。
- 發布技能表示它在 ClawHub 上以 `MIT-0` 釋出。
- 已發布的技能可自由使用、修改與重新散布，無須署名。
- ClawHub 不支援付費技能或逐技能定價。
- 舊版別名：`publish <path>`。

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

ClawHub 的可重用
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
工作流程會針對一個 `skill_path` 呼叫 `skill publish`，或針對 `root`（預設：`skills`）底下每個直接技能資料夾呼叫它。它會略過未變更的技能，並使用相同的自動 patch 版本行為。

設定 `dry_run: true` 可在沒有權杖的情況下預覽。實際發布需要 `clawhub_token` 祕密。

### `sync`

- 掃描目前 workdir、已設定的技能目錄，以及任何 `--root <dir>` 資料夾，尋找包含 `SKILL.md` 或 `skill.md` 的本機技能資料夾。
- 將每個本機技能指紋與 ClawHub 比較，並且只發布新增或已變更的技能。
- 新技能發布為 `1.0.0`；已變更的技能預設發布下一個 patch 版本。對於應該以較大 semver 步進移動的更新批次，請使用 `--bump minor|major`。
- `--dry-run` 會顯示發布計畫但不上傳；`--json` 會列印機器可讀計畫。
- `--all` 會發布每個新增或已變更的技能而不提示。沒有 `--all` 時，互動式終端會讓你選取要發布的技能。
- `--owner <handle>` 會在執行者具備發布者存取權時，發布到組織/使用者發布者帳號底下。
- `sync` 只是單向發布。它不會安裝、更新、下載，或回報安裝/下載遙測。

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- 需要 `clawhub login`。
- 透過 `POST /api/v1/skills/-/scan` 執行 ClawHub ClawScan，然後輪詢直到掃描進入終端狀態。
- 掃描是非同步的，可能需要一段時間完成。排隊期間，終端旋轉指示器會顯示目前的優先掃描位置，以及前方還有多少掃描。
- 已發布掃描需要擁有權或發布者管理存取權。版主/管理員可以透過 `clawhub-admin` 使用相同後端。
- `--update` 只有搭配 `--slug` 時有效；它會將成功的已發布掃描結果寫回所選版本。
- `--output <file.zip>` 會下載完整報告封存，包含 `manifest.json`、`clawscan.json`、`skillspector.json`、`static-analysis.json`、`virustotal.json` 和 `README.md`。
- `--json` 會列印完整輪詢回應以供自動化使用。
- 不再支援本機路徑掃描。請上傳新版本，然後使用 `scan download` 擷取該提交版本的已儲存掃描結果。

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- 需要 `clawhub login`。
- 下載已提交技能或外掛版本的已儲存掃描報告 ZIP，包含被 ClawHub 安全檢查封鎖或隱藏的版本。
- 技能下載使用技能 slug，並預設為 `--kind skill`。
- 外掛下載使用套件名稱，並需要 `--kind plugin`。
- `--version` 是必要的，讓作者檢查 ClawHub 封鎖的確切提交版本。
- `--output <file.zip>` 選擇目的地路徑。

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub 在
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/8f98128aab28627477a3858081a13b76cba6f5d6/.github/workflows/skill-publish.yml)
提供官方可重用工作流程，供技能儲存庫與目錄儲存庫使用。

典型目錄設定：

```yaml
name: Skill Publish

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

- `root` 對目錄儲存庫預設為 `skills`。
- 傳入 `skill_path: skills/review-helper` 可處理一個技能資料夾。
- `owner` 對應到命令列介面的 `--owner` 旗標；省略它會以已驗證使用者身分發布。
- V1 技能發布使用 `clawhub_token`；GitHub OIDC 受信任發布目前僅限套件。

### `delete <skill>`

- 不使用 `--version` 時，軟刪除一個技能（擁有者、版主或管理員）。
- 呼叫 `DELETE /api/v1/skills/{slug}`。
- 由擁有者發起的軟刪除會保留 slug 30 天；命令會列印到期時間。
- `--version <version>` 會透過失敗關閉、
  版本專屬的路由，永久刪除一個擁有的非最新版。
  已刪除的版本無法還原或重新發布。刪除目前最新版之前，請先發布替代版本。平台工作人員不會在此僅限版本的流程中繞過所有權。
- `--reason <text>` 會在整個技能的軟刪除與稽核記錄上記錄審核備註。
- `--note <text>` 是 `--reason` 的別名。
- `--yes` 會略過確認。

### `undelete <skill>`

- 還原隱藏的技能（擁有者、版主或管理員）。
- 沒有版本取消刪除；永久刪除的版本無法還原。
- 呼叫 `POST /api/v1/skills/{slug}/undelete`。
- `--reason <text>` 會在技能與稽核記錄上記錄審核備註。
- `--note <text>` 是 `--reason` 的別名。
- `--yes` 會略過確認。

### `hide <skill>`

- 隱藏技能（擁有者、版主或管理員）。
- `delete` 的別名。

### `unhide <skill>`

- 取消隱藏技能（擁有者、版主或管理員）。
- `undelete` 的別名。

### `skill rename <skill> <new-name>`

- 重新命名擁有的技能，並保留先前的 slug 作為重新導向別名。
- 呼叫 `POST /api/v1/skills/{slug}/rename`。
- `--yes` 會略過確認。

### `skill merge <source> <target>`

- 將一個擁有的技能合併到另一個擁有的技能。
- 來源 slug 會停止公開列出，並成為指向目標的重新導向別名。
- 呼叫 `POST /api/v1/skills/{sourceSlug}/merge`。
- `--yes` 會略過確認。

### `transfer`

- 所有權移轉工作流程。
- 移轉給使用者控制代碼時，會建立一個待處理請求，由接收者接受。
- 移轉給組織／發布者控制代碼時，只有在執行者同時擁有目前擁有者與目的地發布者的管理員存取權時，才會立即套用。
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

- 透過 `GET /api/v1/packages` 和 `GET /api/v1/packages/search` 瀏覽或搜尋統一套件目錄。
- 將此用於外掛與其他套件系列項目；頂層 `search` 仍然是技能搜尋介面。
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
  - `--limit <n>`（1-100，預設：25）
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

- 擷取套件中繼資料而不安裝。
- 將此用於外掛中繼資料、相容性、驗證、來源，以及版本／檔案檢查。
- `--version <version>`：檢查特定版本（預設：最新版）。
- `--tag <tag>`：檢查已標記的版本（例如 `latest`）。
- `--versions`：列出版本歷史（第一頁）。
- `--limit <n>`：要列出的最大版本數（1-100）。
- `--files`：列出所選版本的檔案。
- `--file <path>`：擷取原始檔案內容（僅限文字檔；200KB 限制）。
- `--json`：機器可讀輸出。

### `package download <name>`

- 透過
  `GET /api/v1/packages/{name}/versions/{version}/artifact` 解析套件版本。
- 從解析器的 `downloadUrl` 下載成品。
- 驗證所有成品的 ClawHub SHA-256。
- 對於 ClawPack npm-pack 成品，也會驗證 npm `sha512` 完整性、
  npm shasum，以及 tarball 的 `package.json` 名稱／版本。
- 舊版 ZIP 版本會透過舊版 ZIP 路由下載。
- 旗標：
  - `--version <version>`：下載特定版本。
  - `--tag <tag>`：下載已標記的版本（預設：`latest`）。
  - `-o, --output <path>`：輸出檔案或目錄。
  - `--force`：覆寫現有輸出檔案。
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- 為本機成品計算 ClawHub SHA-256、npm `sha512` 完整性，以及 npm shasum。
- 搭配 `--package` 時，會從 ClawHub 解析預期中繼資料，並將本機檔案與已發布的成品中繼資料比較。
- 搭配直接摘要旗標時，無需網路查詢即可驗證。
- 旗標：
  - `--package <name>`：用來解析預期成品中繼資料的套件名稱。
  - `--version <version>` 或 `--tag <tag>`：預期的套件版本。
  - `--sha256 <hex>`：預期的 ClawHub SHA-256。
  - `--npm-integrity <sri>`：預期的 npm 完整性。
  - `--npm-shasum <sha1>`：預期的 npm shasum。
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- 對本機外掛套件資料夾執行 ClawHub 命令列介面內建的外掛檢查器。
- 預設進行離線／靜態驗證，不會定位或匯入本機
  OpenClaw checkout。
- 硬性相容性錯誤會以非零狀態結束。僅警告的發現會列印出來，但
  以零狀態結束。
- 旗標：
  - `--out <dir>`：將外掛檢查器報告寫入此目錄。
  - `--openclaw <path>`：針對明確的本機 OpenClaw checkout 進行檢查。
  - `--runtime`：啟用執行階段擷取；會匯入外掛程式碼。
  - `--allow-execute`：允許在隔離工作區中進行執行階段擷取。
  - `--no-mock-sdk`：在執行階段擷取期間停用模擬的 OpenClaw SDK。
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package validate ./example-plugin
```

如果驗證回報套件、manifest、SDK 匯入或成品發現，請參閱
[外掛驗證修正](/zh-TW/clawhub/plugin-validation-fixes)，然後重新執行命令。

### `package delete <name>`

- 不使用 `--version` 時，軟刪除一個套件和所有發行版。
- `--version <version>` 會透過失敗關閉、
  版本專屬的路由，永久刪除一個擁有的非最新發行版。
  已刪除的版本無法還原或重新發布。刪除目前最新版之前，請先發布替代版本。此僅限版本的流程需要套件擁有者或組織發布者管理員；平台工作人員不會繞過套件所有權。
- 整個套件的軟刪除需要套件擁有者、組織發布者擁有者／管理員、平台版主或平台管理員。
- 旗標：
  - `--version <version>`：永久刪除一個非最新版本。
  - `--yes`：略過確認。
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- 還原軟刪除的套件與發行版。
- 沒有版本取消刪除；永久刪除的版本無法還原。
- 需要套件擁有者、組織發布者擁有者／管理員、平台版主或平台管理員。
- 呼叫 `POST /api/v1/packages/{name}/undelete`。
- 旗標：
  - `--yes`：略過確認。
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- 將套件移轉給另一個發布者。
- 需要同時擁有目前套件擁有者與目的地發布者的管理員存取權，除非由平台管理員執行。
- 具範圍的套件名稱必須移轉給相符的範圍擁有者。
- 呼叫 `POST /api/v1/packages/{name}/transfer`。
- 旗標：
  - `--to <owner>`：目的地發布者控制代碼。
  - `--reason <text>`：選用的稽核原因。
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- 用於向版主回報套件的已驗證命令。
- 呼叫 `POST /api/v1/packages/{name}/report`。
- 回報屬於套件層級，可選擇繫結到某個版本，並會對版主可見以供審查。
- 回報本身不會自動隱藏套件或封鎖下載。
- 旗標：
  - `--version <version>`：要附加到回報的選用套件版本。
  - `--reason <text>`：必要的回報原因。
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- 用於檢查套件審核可見性的擁有者命令。
- 呼叫 `GET /api/v1/packages/{name}/moderation`。
- 顯示目前套件掃描狀態、開啟的回報數、最新發行版手動審核狀態、下載封鎖狀態，以及審核原因。
- 旗標：
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- 檢查套件是否已準備好供未來 OpenClaw 使用。
- 呼叫 `GET /api/v1/packages/{name}/readiness`。
- 回報官方狀態、ClawPack 可用性、成品摘要、來源出處、OpenClaw 相容性、主機目標、環境中繼資料，以及掃描狀態的阻擋項目。
- 旗標：
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- 顯示可能取代
  OpenClaw 內建外掛的套件的操作員導向遷移狀態。
- 呼叫與 `package readiness` 相同的已計算就緒度端點，但列印以遷移為重點的狀態、最新版本、官方套件狀態、檢查與阻擋項目。
- 旗標：
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- 建立由已驗證使用者擁有的組織發布者。
- 控制代碼會正規化為小寫，並且可帶或不帶 `@` 傳入。
- 新建立的組織發布者預設不是受信任／官方。
- 如果控制代碼已被現有發布者、使用者或保留路由使用，則會失敗。

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- 透過 `POST /api/v1/packages` 發布 code 外掛或 bundle 外掛。
- `<source>` 接受：
  - 本機資料夾路徑：`./my-plugin`
  - 本機 ClawPack npm-pack tarball：`./my-plugin-1.2.3.tgz`
  - GitHub repo：`owner/repo` 或 `owner/repo@ref`
  - GitHub URL：`https://github.com/owner/repo`
- Metadata 會從 `package.json`、`openclaw.plugin.json`，以及
  實際的 OpenClaw bundle 標記自動偵測，例如 `.codex-plugin/plugin.json`、
  `.claude-plugin/plugin.json` 和 `.cursor-plugin/plugin.json`。
- `.tgz` sources 會被視為 ClawPack。命令列介面會上傳確切的 npm-pack
  bytes，並只使用解出的 `package/` 內容進行 validation 和
  metadata prefill。
- Code-plugin folders 會在上傳前打包成 ClawPack npm tarball，讓
  OpenClaw installs 可以驗證確切 artifact。Bundle-plugin folders 仍然
  使用 extracted-file publish path。
- 對於 GitHub sources，source attribution 會從 repo、resolved commit、ref 和 subpath 自動填入。
- 對於本機資料夾，當 origin remote 指向 GitHub 時，source attribution 會從本機 git 自動偵測。
- 外部 code 外掛必須明確宣告 `openclaw.compat.pluginApi` 和
  `openclaw.build.openclawVersion`。
  Top-level `package.json.version` 不會作為 publish validation 的 fallback。
- `--dry-run` 會預覽 resolved publish payload，而不會上傳。
- `--json` 會輸出供 CI 使用的 machine-readable output。
- `--owner <handle>` 會在 actor 具有 publisher access 時，以 user 或 org publisher handle 發布。
- Scoped package names 必須符合所選 owner。請參閱 `docs/publishing.md`。
- 現有 flags（`--family`、`--name`、`--version`、`--source-repo`、`--source-commit`、`--source-ref`、`--source-path`）仍可作為 overrides 使用。
- Private GitHub repos 需要 `GITHUB_TOKEN`。

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### 建議的本機流程

先使用 `--dry-run`，讓你可以在建立 live release 前確認 resolved package metadata 和
source attribution：

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### 本機資料夾流程

對於 code 外掛，folder publish 會從 package folder 建置並上傳 ClawPack artifact：

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `--family code-plugin` 的最小 `package.json`

外部 code 外掛需要在 `package.json` 中提供少量 OpenClaw metadata。
這個最小 manifest 已足以成功發布：

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

必填欄位：

- `openclaw.compat.pluginApi`
- `openclaw.build.openclawVersion`

注意事項：

- `package.json.version` 是你的 package release version，但不會作為
  OpenClaw compatibility/build validation 的 fallback。
- `openclaw.hostTargets` 和 `openclaw.environment` 是 optional metadata。
  ClawHub 可能會在存在時顯示它們，但發布時並不需要。
- 如果你想發布更詳細的 compatibility metadata，`openclaw.compat.minGatewayVersion` 和
  `openclaw.build.pluginSdkVersion` 是 optional extras。
- 如果你正在使用較舊的 `clawhub` 命令列介面 release，請先升級再發布，讓
  local preflight checks 在上傳前執行。
- 如果 validation 回報 remediation code，請參閱
  [外掛 validation 修正](/zh-TW/clawhub/plugin-validation-fixes)。

#### GitHub Actions

ClawHub 也為外掛 repos 提供官方 reusable workflow：
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/8f98128aab28627477a3858081a13b76cba6f5d6/.github/workflows/package-publish.yml)。

典型 caller setup：

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

- Reusable workflow 預設將 `source` 設為 caller repo。
- 對於 monorepos，請傳入 `source_path`，讓 workflow 發布外掛
  package folder，例如 `source_path: extensions/codex`。
- 將 reusable workflow 固定到 stable tag 或完整 commit SHA。請勿從 `@main` 執行 release publishing。
- `pull_request` 應使用 `dry_run: true`，讓 CI 保持不產生污染。
- 實際發布應限於受信任事件，例如 `workflow_dispatch` 或 tag pushes。
- 不使用 secret 的 trusted publishing 僅適用於 `workflow_dispatch`；tag pushes 仍需要 `clawhub_token`。
- 保留可用的 `clawhub_token`，以供首次發布、untrusted packages 或 break-glass publishes 使用。
- Workflow 會將 JSON result 上傳為 artifact，並將其作為 workflow outputs 暴露。

### `package trusted-publisher get <name>`

- 顯示 package 的 GitHub Actions trusted publisher config。
- 設定 config 後使用此命令，確認 repository、workflow filename，
  以及 optional environment pin。
- Flags：
  - `--json`：machine-readable output。

範例：

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- 為現有 package 附加或取代 GitHub Actions trusted publisher config。
- Package 必須先透過一般手動或 token-authenticated
  `clawhub package publish` 建立。
- 設定 config 後，未來支援的 GitHub Actions publishes 可以使用
  OIDC/trusted publishing，而不需要長期有效的 ClawHub token。
- `--repository <repo>` 必須是 `owner/repo`。
- `--workflow-filename <file>` 必須符合 `.github/workflows/` 中的 workflow file name。
- `--environment <name>` 是 optional。設定後，OIDC claim 中的 GitHub Actions
  environment 必須完全相符。
- ClawHub 會在此命令執行時驗證設定的 GitHub repository。
  Public repositories 可透過 public GitHub metadata 驗證。Private
  repositories 需要 ClawHub 擁有該 repository 的 GitHub access，例如透過未來的 ClawHub GitHub App installation 或其他 authorized
  GitHub integration。
- Flags：
  - `--repository <repo>`：GitHub repository，例如 `openclaw/example-plugin`。
  - `--workflow-filename <file>`：workflow file name，例如 `package-publish.yml`。
  - `--environment <name>`：optional exact-match GitHub Actions environment。
  - `--json`：machine-readable output。

範例：

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- 從 package 移除 trusted publisher config。
- 如果 workflow、repository 或 environment pin 需要停用或重新建立，請將此作為 rollback 使用。
- 未來的實際發布必須使用一般 authenticated publishing，直到再次設定 config。
- Flags：
  - `--json`：machine-readable output。

範例：

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### 安裝 telemetry

- 登入時，在 `clawhub install <slug>` 後傳送，除非已設定
  `CLAWHUB_DISABLE_TELEMETRY=1`。
- Reporting 是 best-effort。如果 telemetry 無法使用，install commands 不會失敗。
- 詳細資訊：`docs/telemetry.md`。
