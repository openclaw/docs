---
read_when:
    - 使用 ClawHub 命令列介面
    - 偵錯安裝、更新或發布
summary: 命令列介面參考：命令、旗標、設定與鎖定檔行為。
x-i18n:
    generated_at: "2026-06-30T13:45:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 63cdf64a1d5abe87ee475869fdb199053b7b4374962b03e91e822ddef3cad8e8
    source_path: clawhub/cli.md
    workflow: 16
---

# 命令列介面

命令列介面套件：`clawhub`，bin：`clawhub`。

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

- `--workdir <dir>`：工作目錄（預設：cwd；若已設定，則回退至 Clawdbot 工作區）
- `--dir <dir>`：workdir 下的安裝目錄（預設：`skills`）
- `--site <url>`：瀏覽器登入的基底 URL（預設：`https://clawhub.ai`）
- `--registry <url>`：API 基底 URL（預設：探索到的值，否則為 `https://clawhub.ai`）
- `--no-input`：停用提示

等效環境變數：

- `CLAWHUB_SITE`（舊版 `CLAWDHUB_SITE`）
- `CLAWHUB_REGISTRY`（舊版 `CLAWDHUB_REGISTRY`）
- `CLAWHUB_WORKDIR`（舊版 `CLAWDHUB_WORKDIR`）

### HTTP Proxy

命令列介面會遵循標準 HTTP Proxy 環境變數，適用於位於企業 Proxy 或受限網路後方的系統：

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

設定其中任一變數時，命令列介面會透過指定的 Proxy 路由對外請求。`HTTPS_PROXY` 用於 HTTPS 請求，`HTTP_PROXY` 用於純 HTTP。`NO_PROXY` / `no_proxy` 會被遵循，用於對特定主機或網域略過 Proxy。

這在直接對外連線遭封鎖的系統上是必要的（例如 Docker 容器、僅能透過 Proxy 上網的 Hetzner VPS、企業防火牆）。

範例：

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

未設定 Proxy 變數時，行為不變（直接連線）。

## 設定檔

儲存你的 API token + 快取的 registry URL。

- macOS：`~/Library/Application Support/clawhub/config.json`
- Linux/XDG：`$XDG_CONFIG_HOME/clawhub/config.json` 或 `~/.config/clawhub/config.json`
- Windows：`%APPDATA%\\clawhub\\config.json`
- 舊版回退：若 `clawhub/config.json` 尚不存在但 `clawdhub/config.json` 存在，命令列介面會重用舊版路徑
- 覆寫：`CLAWHUB_CONFIG_PATH`（舊版 `CLAWDHUB_CONFIG_PATH`）

## 命令

### `login` / `auth login`

- 預設：開啟瀏覽器至 `<site>/cli/auth`，並透過 loopback callback 完成。
- Headless：`clawhub login --token clh_...`
- 遠端/headless 互動式：`clawhub login --device` 會列印一組 code，並在你於 `<site>/cli/device` 授權時等待。

### `whoami`

- 透過 `/api/v1/whoami` 驗證已儲存的 token。

### `token`

- 將已儲存的 API token 列印至 stdout。
- 適合將本機登入 token 管線傳入 CI secret 設定命令。

### `star <skill>` / `unstar <skill>`

- 從你的重點項目新增/移除 skill。
- 呼叫 `POST /api/v1/stars/<slug>` 和 `DELETE /api/v1/stars/<slug>`。
- `--yes` 會略過確認。

### `search <query...>`

- 呼叫 `/api/v1/search?q=...`。
- 輸出包含 skill slug、擁有者 handle、顯示名稱與相關性分數。
- 搜尋會先偏好精確的 slug/name token 符合，再考量下載熱門度。像 `map` 這樣獨立的 slug token，比 `amap` 內的子字串更強烈符合 `personal-map`。
- 熱門度只是小幅排序先驗，不保證排在最前。
- 如果 skill 應該出現但沒有，請在登入狀態下執行 `clawhub inspect @owner/slug`，先檢查擁有者可見的審核診斷，再重新命名 metadata。

### `explore`

- 透過 `/api/v1/skills?limit=...&sort=createdAt` 列出最新 Skills（依 `createdAt` 降冪排序）。
- 旗標：
  - `--limit <n>`（1-200，預設：25）
  - `--sort newest|updated|rating|downloads|trending`（預設：newest）。舊版 install sort aliases 仍可相容使用。
  - `--json`（機器可讀輸出）
- 輸出：`<slug>  v<version>  <age>  <summary>`（summary 截斷至 50 個字元）。

### `inspect @owner/slug`

- 擷取 skill metadata 和版本檔案，但不安裝。
- `--version <version>`：檢查特定版本（預設：latest）。
- `--tag <tag>`：檢查已標記版本（例如 `latest`）。
- `--versions`：列出版本歷史（第一頁）。
- `--limit <n>`：要列出的最大版本數（1-200）。
- `--files`：列出所選版本的檔案。
- `--file <path>`：擷取原始檔案內容（僅限文字檔；200KB 限制）。
- `--json`：機器可讀輸出。

### `install @owner/slug`

- 解析指定擁有者與 skill 的最新版本。
- 透過 `/api/v1/download` 下載 zip。
- 解壓縮至 `<workdir>/<dir>/<slug>`。
- 拒絕覆寫已釘選的 Skills；請先執行 `clawhub unpin <skill>`。
- 寫入：
  - `<workdir>/.clawhub/lock.json`（舊版 `.clawdhub`）
  - `<skill>/.clawhub/origin.json`（舊版 `.clawdhub`）

### `uninstall <skill>`

- 移除 `<workdir>/<dir>/<slug>`，並刪除 lockfile 項目。
- 登入時會以 best-effort telemetry 傳送資料，讓目前安裝數可停用。
- 互動式：要求確認。
- 非互動式（`--no-input`）：需要 `--yes`。

### `list`

- 讀取 `<workdir>/.clawhub/lock.json`（舊版 `.clawdhub`）。
- 對使用 `clawhub pin` 凍結的 Skills 顯示 `pinned`，包含選填原因。

### `pin <skill>`

- 在 lockfile 中將已安裝的 skill 標記為已釘選。
- `--reason <text>` 記錄 skill 被凍結的原因。
- 已釘選的 Skills 會被 `update --all` 略過，且直接 `update <skill>` 會被拒絕。
- 已釘選的 Skills 也會拒絕 `install --force`，避免本機位元組被意外取代。

### `unpin <skill>`

- 從已安裝的 skill 移除 lockfile pin，讓未來更新可以修改它。

### `update [@owner/slug]` / `update --all`

- 從本機檔案計算 fingerprint。
- 如果 fingerprint 符合已知版本：不提示。
- 如果 fingerprint 不符合：
  - 預設拒絕
  - 使用 `--force` 覆寫（若為互動式，則提示）
- 已釘選的 Skills 永遠不會被 `--force` 更新。
- `update <skill>` 會對已釘選 Skills 快速失敗，並提示你先執行 `clawhub unpin <skill>`。
- `update --all` 會略過已釘選的 slugs，並列印哪些維持凍結的摘要。

### `skill publish <path>`

- 比較本機 bundle fingerprint 與 ClawHub；當內容已發布時會成功結束。
- 新 Skills 預設為 `1.0.0`；已變更的 Skills 預設為下一個 patch 版本。
- `--version <version>` 會明確選取版本，即使內容符合既有版本也會發布。
- `--dry-run` 會解析發布但不上傳；`--json` 會列印機器可讀結果。
- `--owner <handle>` 會在行為者具有發布者存取權時，以 org/user 發布者 handle 發布。
- `--migrate-owner` 會在發布新版本時將既有 skill 移至 `--owner`。需要兩個發布者的 admin/owner 存取權。
- 擁有者與審核行為在 `docs/publishing.md` 中說明。
- 發布 skill 表示它在 ClawHub 上以 `MIT-0` 發行。
- 已發布的 Skills 可自由使用、修改與重新散布，無需署名。
- ClawHub 不支援付費 Skills 或個別 skill 定價。
- 舊版 alias：`publish <path>`。

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

ClawHub 的可重用
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
workflow 會對一個 `skill_path` 呼叫 `skill publish`，或對 `root` 下每個直接的 skill 資料夾呼叫（預設：`skills`）。它會略過未變更的 Skills，並使用相同的自動 patch-version 行為。

設定 `dry_run: true` 可在沒有 token 的情況下預覽。實際發布需要 `clawhub_token` secret。

### `sync`

- 掃描目前 workdir、已設定的 Skills 目錄，以及任何 `--root <dir>` 資料夾，尋找包含 `SKILL.md` 或 `skill.md` 的本機 skill 資料夾。
- 比較每個本機 skill fingerprint 與 ClawHub，只發布新的或已變更的 Skills。
- 新 Skills 發布為 `1.0.0`；已變更的 Skills 預設發布為下一個 patch 版本。對於應移動到較大 semver 步幅的更新批次，請使用 `--bump minor|major`。
- `--dry-run` 顯示發布計畫但不上傳；`--json` 列印機器可讀計畫。
- `--all` 會在不提示的情況下發布每個新的或已變更的 skill。沒有 `--all` 時，互動式終端會讓你選取要發布的 Skills。
- `--owner <handle>` 會在行為者具有發布者存取權時，以 org/user 發布者 handle 發布。
- `sync` 僅為單向發布。它不會安裝、更新、下載，或回報安裝/下載 telemetry。

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- 需要 `clawhub login`。
- 透過 `POST /api/v1/skills/-/scan` 執行 ClawHub ClawScan，接著輪詢直到掃描進入終止狀態。
- 掃描是非同步的，可能需要一些時間才能完成。排隊時，終端 spinner 會顯示目前優先掃描位置，以及前方還有多少掃描。
- 已發布掃描需要所有權或發布者管理存取權。Moderators/admins 可透過 `clawhub-admin` 使用相同後端。
- `--update` 僅在搭配 `--slug` 時有效；它會將成功的已發布掃描結果寫回所選版本。
- `--output <file.zip>` 會下載完整報告封存，包含 `manifest.json`、`clawscan.json`、`skillspector.json`、`static-analysis.json`、`virustotal.json` 和 `README.md`。
- `--json` 會列印完整輪詢回應供自動化使用。
- 不再支援本機路徑掃描。請上傳新版本，然後使用 `scan download` 擷取該提交版本已儲存的掃描結果。

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- 需要 `clawhub login`。
- 下載已提交 skill 或外掛版本的已儲存掃描報告 ZIP，包含被 ClawHub 安全性檢查封鎖或隱藏的版本。
- Skill 下載使用 skill slug，且預設為 `--kind skill`。
- 外掛下載使用套件名稱，且需要 `--kind plugin`。
- `--version` 為必要項，讓作者檢查 ClawHub 封鎖的確切提交版本。
- `--output <file.zip>` 選擇目的地路徑。

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub 在
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/919f047373fb1836301c5e42f20ad8c2c2201fc5/.github/workflows/skill-publish.yml)
提供官方可重用 workflow，適用於 skill repos 和 catalog repos。

典型 catalog 設定：

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

備註：

- `root` 對 catalog repos 預設為 `skills`。
- 傳入 `skill_path: skills/review-helper` 以處理單一 skill 資料夾。
- `owner` 對應命令列介面 `--owner` 旗標；省略它會以已驗證使用者身分發布。
- V1 skill publishing 使用 `clawhub_token`；GitHub OIDC trusted publishing 目前僅適用於 package。

### `delete <skill>`

- 不帶 `--version` 時，軟刪除技能（擁有者、版主或管理員）。
- 呼叫 `DELETE /api/v1/skills/{slug}`。
- 由擁有者發起的軟刪除會保留該 slug 30 天；命令會列印到期時間。
- `--version <version>` 透過失敗即關閉、特定版本的路由，永久刪除一個擁有的非最新版本。
  已刪除的版本無法還原或重新發布。刪除目前最新版本前，請先發布替代版本。平台工作人員不會在這個僅限版本的流程中繞過所有權。
- `--reason <text>` 會在整個技能軟刪除和稽核記錄中記錄審核備註。
- `--note <text>` 是 `--reason` 的別名。
- `--yes` 會略過確認。

### `undelete <skill>`

- 還原隱藏的技能（擁有者、版主或管理員）。
- 沒有版本取消刪除；永久刪除的版本無法還原。
- 呼叫 `POST /api/v1/skills/{slug}/undelete`。
- `--reason <text>` 會在技能和稽核記錄中記錄審核備註。
- `--note <text>` 是 `--reason` 的別名。
- `--yes` 會略過確認。

### `hide <skill>`

- 隱藏技能（擁有者、版主或管理員）。
- `delete` 的別名。

### `unhide <skill>`

- 取消隱藏技能（擁有者、版主或管理員）。
- `undelete` 的別名。

### `skill rename <skill> <new-name>`

- 重新命名擁有的技能，並將先前的 slug 保留為重新導向別名。
- 呼叫 `POST /api/v1/skills/{slug}/rename`。
- `--yes` 會略過確認。

### `skill merge <source> <target>`

- 將一個擁有的技能合併到另一個擁有的技能中。
- 來源 slug 會停止公開列出，並成為指向目標的重新導向別名。
- 呼叫 `POST /api/v1/skills/{sourceSlug}/merge`。
- `--yes` 會略過確認。

### `transfer`

- 所有權轉移工作流程。
- 轉移給使用者 handle 會建立待處理請求，由接收者接受。
- 只有當執行者同時擁有目前擁有者和目標發布者的
  管理員存取權時，轉移給組織/發布者 handle 才會立即套用。
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
- 將此用於外掛和其他套件家族項目；頂層 `search` 仍是技能搜尋介面。
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
- 將此用於外掛中繼資料、相容性、驗證、來源，以及版本/檔案檢查。
- `--version <version>`：檢查特定版本（預設：latest）。
- `--tag <tag>`：檢查已加標籤的版本（例如 `latest`）。
- `--versions`：列出版本歷史（第一頁）。
- `--limit <n>`：要列出的最大版本數（1-100）。
- `--files`：列出所選版本的檔案。
- `--file <path>`：擷取原始檔案內容（僅文字檔；200KB 限制）。
- `--json`：機器可讀輸出。

### `package download <name>`

- 透過
  `GET /api/v1/packages/{name}/versions/{version}/artifact`
  解析套件版本。
- 從解析器的 `downloadUrl` 下載成品。
- 驗證所有成品的 ClawHub SHA-256。
- 對於 ClawPack npm-pack 成品，也會驗證 npm `sha512` 完整性、
  npm shasum，以及 tarball 的 `package.json` 名稱/版本。
- 舊版 ZIP 版本會透過舊版 ZIP 路由下載。
- 旗標：
  - `--version <version>`：下載特定版本。
  - `--tag <tag>`：下載已加標籤的版本（預設：`latest`）。
  - `-o, --output <path>`：輸出檔案或目錄。
  - `--force`：覆寫現有輸出檔案。
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- 計算本機成品的 ClawHub SHA-256、npm `sha512` 完整性，以及 npm shasum。
- 搭配 `--package` 時，會從 ClawHub 解析預期中繼資料，並將
  本機檔案與已發布的成品中繼資料進行比對。
- 搭配直接摘要旗標時，不進行網路查詢即可驗證。
- 旗標：
  - `--package <name>`：用於解析預期成品中繼資料的套件名稱。
  - `--version <version>` 或 `--tag <tag>`：預期套件版本。
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
- 預設為離線/靜態驗證，不會定位或匯入本機
  OpenClaw checkout。
- 硬性相容性錯誤會以非零狀態碼結束。只有警告的發現項會列印，但
  以零狀態碼結束。
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

如果驗證回報套件、manifest、SDK 匯入或成品發現項，請參閱
[外掛驗證修正](/clawhub/plugin-validation-fixes)，然後重新執行命令。

### `package delete <name>`

- 不帶 `--version` 時，軟刪除套件和所有發行版。
- `--version <version>` 透過失敗即關閉、
  特定版本的路由，永久刪除一個擁有的非最新發行版。
  已刪除的版本無法還原或重新發布。刪除目前最新版本前，請先發布替代版本。此僅限版本的流程需要套件擁有者或組織發布者
  管理員；平台工作人員不會繞過套件所有權。
- 整個套件軟刪除需要套件擁有者、組織發布者擁有者/管理員、平台
  版主或平台管理員。
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

- 還原已軟刪除的套件和發行版。
- 沒有版本取消刪除；永久刪除的版本無法還原。
- 需要套件擁有者、組織發布者擁有者/管理員、平台版主，
  或平台管理員。
- 呼叫 `POST /api/v1/packages/{name}/undelete`。
- 旗標：
  - `--yes`：略過確認。
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- 將套件轉移給另一個發布者。
- 除非由平台管理員執行，否則需要同時擁有目前套件擁有者和目標
  發布者的管理員存取權。
- 具範圍的套件名稱必須轉移給相符的範圍擁有者。
- 呼叫 `POST /api/v1/packages/{name}/transfer`。
- 旗標：
  - `--to <owner>`：目標發布者 handle。
  - `--reason <text>`：選用的稽核原因。
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- 用於向版主回報套件的已驗證命令。
- 呼叫 `POST /api/v1/packages/{name}/report`。
- 回報屬於套件層級，可選擇綁定到某個版本，並會對
  版主可見以供審查。
- 回報本身不會自動隱藏套件或封鎖下載。
- 旗標：
  - `--version <version>`：要附加到回報的選用套件版本。
  - `--reason <text>`：必填的回報原因。
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- 用於檢查套件審核可見性的擁有者命令。
- 呼叫 `GET /api/v1/packages/{name}/moderation`。
- 顯示目前套件掃描狀態、開啟回報數量、最新發行版手動
  審核狀態、下載封鎖狀態，以及審核原因。
- 旗標：
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- 檢查套件是否已準備好供未來 OpenClaw 使用。
- 呼叫 `GET /api/v1/packages/{name}/readiness`。
- 回報官方狀態、ClawPack 可用性、成品摘要、
  來源出處、OpenClaw 相容性、主機目標、環境中繼資料，
  以及掃描狀態的阻礙因素。
- 旗標：
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- 顯示可能取代
  內建 OpenClaw 外掛之套件的操作員導向遷移狀態。
- 呼叫與 `package readiness` 相同的計算後 readiness 端點，但會列印
  側重遷移的狀態、最新版本、官方套件狀態、檢查項目和
  阻礙因素。
- 旗標：
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- 建立由已驗證使用者擁有的組織發布者。
- handle 會正規化為小寫，並可帶或不帶 `@` 傳入。
- 新建立的組織發布者預設並非受信任/官方。
- 如果 handle 已被現有發布者、使用者或保留路由使用，則會失敗。

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- 透過 `POST /api/v1/packages` 發布程式碼外掛或 bundle 外掛。
- `<source>` 接受：
  - 本機資料夾路徑：`./my-plugin`
  - 本機 ClawPack npm-pack tarball：`./my-plugin-1.2.3.tgz`
  - GitHub repo：`owner/repo` 或 `owner/repo@ref`
  - GitHub URL：`https://github.com/owner/repo`
- Metadata 會從 `package.json`、`openclaw.plugin.json`，以及
  真正的 OpenClaw bundle 標記自動偵測，例如 `.codex-plugin/plugin.json`、
  `.claude-plugin/plugin.json` 和 `.cursor-plugin/plugin.json`。
- `.tgz` 來源會被視為 ClawPack。命令列介面會上傳確切的 npm-pack
  位元組，且只使用解壓後的 `package/` 內容進行驗證與
  metadata 預先填入。
- 程式碼外掛資料夾會在上傳前打包成 ClawPack npm tarball，讓
  OpenClaw 安裝能驗證確切成品。Bundle 外掛資料夾仍然
  使用解壓檔案發布路徑。
- 對於 GitHub 來源，來源歸屬會從 repo、解析出的 commit、ref 和子路徑自動填入。
- 對於本機資料夾，當 origin remote 指向 GitHub 時，來源歸屬會從本機 git 自動偵測。
- 外部程式碼外掛必須明確宣告 `openclaw.compat.pluginApi` 和
  `openclaw.build.openclawVersion`。
  最上層的 `package.json.version` 不會作為發布驗證的 fallback。
- `--dry-run` 會預覽解析後的發布酬載而不上傳。
- `--json` 會輸出 CI 可用的機器可讀結果。
- `--owner <handle>` 會在執行者具有 publisher 存取權時，以使用者或組織 publisher handle 發布。
- Scoped 套件名稱必須符合選取的 owner。請參閱 `docs/publishing.md`。
- 現有 flags（`--family`、`--name`、`--version`、`--source-repo`、`--source-commit`、`--source-ref`、`--source-path`）仍可作為覆寫使用。
- 私有 GitHub repos 需要 `GITHUB_TOKEN`。

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### 建議的本機流程

先使用 `--dry-run`，讓你可以在建立正式 release 前確認解析出的套件 metadata 和
來源歸屬：

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

外部程式碼外掛需要在 `package.json` 中加入少量 OpenClaw metadata。
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

注意：

- `package.json.version` 是你的套件 release 版本，但不會用作
  OpenClaw 相容性/建置驗證的 fallback。
- `openclaw.hostTargets` 和 `openclaw.environment` 是可選 metadata。
  ClawHub 可能會在它們存在時顯示，但發布不需要它們。
- 如果你想發布更詳細的相容性 metadata，`openclaw.compat.minGatewayVersion` 和
  `openclaw.build.pluginSdkVersion` 是可選額外欄位。
- 如果你使用較舊的 `clawhub` 命令列介面 release，請在發布前升級，讓
  本機 preflight 檢查能在上傳前執行。
- 如果驗證回報 remediation code，請參閱
  [外掛驗證修正](/clawhub/plugin-validation-fixes)。

#### GitHub Actions

ClawHub 也提供官方可重用 workflow，位於
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/919f047373fb1836301c5e42f20ad8c2c2201fc5/.github/workflows/package-publish.yml)，
供外掛 repos 使用。

典型 caller 設定：

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

注意：

- 可重用 workflow 預設會將 `source` 設為 caller repo。
- 對於 monorepos，請傳入 `source_path`，讓 workflow 發布外掛
  套件資料夾，例如 `source_path: extensions/codex`。
- 將可重用 workflow pin 到穩定 tag 或完整 commit SHA。不要從 `@main` 執行 release publishing。
- `pull_request` 應使用 `dry_run: true`，讓 CI 保持不污染狀態。
- 真正的發布應限制在受信任事件，例如 `workflow_dispatch` 或 tag pushes。
- 不使用 secret 的受信任發布只適用於 `workflow_dispatch`；tag pushes 仍需要 `clawhub_token`。
- 保留可用的 `clawhub_token`，以供首次發布、不受信任的套件或緊急發布使用。
- Workflow 會將 JSON 結果上傳為 artifact，並將其作為 workflow outputs 暴露。

### `package trusted-publisher get <name>`

- 顯示套件的 GitHub Actions 受信任發布者設定。
- 設定 config 後使用此命令，以確認 repository、workflow 檔名，
  以及可選的 environment pin。
- Flags：
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- 為現有套件附加或取代 GitHub Actions 受信任發布者設定。
- 套件必須先透過一般手動或 token 驗證的
  `clawhub package publish` 建立。
- 設定 config 後，未來支援的 GitHub Actions 發布可使用
  OIDC/受信任發布，而不需要長期有效的 ClawHub token。
- `--repository <repo>` 必須是 `owner/repo`。
- `--workflow-filename <file>` 必須符合
  `.github/workflows/` 中的 workflow 檔案名稱。
- `--environment <name>` 是可選項。設定後，OIDC claim 中的 GitHub Actions
  environment 必須完全相符。
- ClawHub 會在此命令執行時驗證設定的 GitHub repository。
  Public repositories 可透過公開 GitHub metadata 驗證。Private
  repositories 需要 ClawHub 擁有該 repository 的 GitHub 存取權，
  例如透過未來的 ClawHub GitHub App installation 或另一個已授權的
  GitHub integration。
- Flags：
  - `--repository <repo>`：GitHub repository，例如 `openclaw/example-plugin`。
  - `--workflow-filename <file>`：workflow 檔案名稱，例如 `package-publish.yml`。
  - `--environment <name>`：可選的精確比對 GitHub Actions environment。
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- 從套件移除受信任發布者設定。
- 如果 workflow、repository 或 environment pin 需要停用或重新建立，請將此作為 rollback 使用。
- 未來真正的發布必須使用一般驗證發布，直到再次設定 config。
- Flags：
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### 安裝 telemetry

- 登入時，在 `clawhub install <slug>` 後傳送，除非
  已設定 `CLAWHUB_DISABLE_TELEMETRY=1`。
- 回報採 best-effort。若 telemetry 無法使用，安裝命令不會失敗。
- 詳細資訊：`docs/telemetry.md`。
