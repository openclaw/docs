---
read_when:
    - 使用 ClawHub CLI
    - 安裝、更新、發布或同步的偵錯
summary: CLI 參考：命令、旗標、設定、鎖定檔、同步行為。
x-i18n:
    generated_at: "2026-05-12T23:28:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: f3600e5539372490924ee884c03d2417b80d25aab519d8260897b2268c2f7b46
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

CLI 套件：`clawhub`，執行檔：`clawhub`。

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

- `--workdir <dir>`：工作目錄（預設：cwd；若已設定，會退回使用 Clawdbot 工作區）
- `--dir <dir>`：workdir 下的安裝目錄（預設：`skills`）
- `--site <url>`：瀏覽器登入的基底 URL（預設：`https://clawhub.ai`）
- `--registry <url>`：API 基底 URL（預設：自動探索，否則為 `https://clawhub.ai`）
- `--no-input`：停用提示

對應的環境變數：

- `CLAWHUB_SITE`（舊版 `CLAWDHUB_SITE`）
- `CLAWHUB_REGISTRY`（舊版 `CLAWDHUB_REGISTRY`）
- `CLAWHUB_WORKDIR`（舊版 `CLAWDHUB_WORKDIR`）

### HTTP Proxy

CLI 會遵循標準 HTTP Proxy 環境變數，供位於企業 Proxy 或受限網路後方的系統使用：

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

設定上述任一變數時，CLI 會透過指定的 Proxy 路由對外請求。`HTTPS_PROXY` 用於 HTTPS 請求，`HTTP_PROXY` 用於純 HTTP。`NO_PROXY` / `no_proxy` 會被遵循，以針對特定主機或網域略過 Proxy。

這在直接對外連線遭封鎖的系統上是必要的（例如 Docker 容器、僅能透過 Proxy 上網的 Hetzner VPS、企業防火牆）。

範例：

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

未設定任何 Proxy 變數時，行為維持不變（直接連線）。

## 設定檔

儲存你的 API 權杖與快取的 Registry URL。

- macOS：`~/Library/Application Support/clawhub/config.json`
- Linux/XDG：`$XDG_CONFIG_HOME/clawhub/config.json` 或 `~/.config/clawhub/config.json`
- Windows：`%APPDATA%\\clawhub\\config.json`
- 舊版後援：如果 `clawhub/config.json` 尚不存在但 `clawdhub/config.json` 存在，CLI 會重用舊版路徑
- 覆寫：`CLAWHUB_CONFIG_PATH`（舊版 `CLAWDHUB_CONFIG_PATH`）

## 指令

### `login` / `auth login`

- 預設：開啟瀏覽器到 `<site>/cli/auth`，並透過 loopback callback 完成。
- Headless：`clawhub login --token clh_...`
- 遠端/headless 互動式：`clawhub login --device` 會列印代碼並等待你在 `<site>/cli/device` 授權。

### `whoami`

- 透過 `/api/v1/whoami` 驗證已儲存的權杖。

### `star <slug>` / `unstar <slug>`

- 從你的精選中新增/移除 skill。
- 呼叫 `POST /api/v1/stars/<slug>` 和 `DELETE /api/v1/stars/<slug>`。
- `--yes` 會略過確認。

### `search <query...>`

- 呼叫 `/api/v1/search?q=...`。
- 搜尋會先偏好精確的 slug/name token 相符項目，再考量下載熱門度。像 `map` 這樣的獨立 slug token，會比 `amap` 內的子字串更強烈地匹配 `personal-map`。
- 下載數只是小幅的熱門度先驗，不保證排名置頂。
- 如果某個 skill 應該出現卻沒有，請在登入狀態下執行 `clawhub inspect <slug>`，先檢查擁有者可見的審核診斷資訊，再重新命名 metadata。

### `explore`

- 透過 `/api/v1/skills?limit=...&sort=createdAt` 列出最新 skills（依 `createdAt` 降冪排序）。
- 旗標：
  - `--limit <n>`（1-200，預設：25）
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending`（預設：newest）
  - `--json`（機器可讀輸出）
- 輸出：`<slug>  v<version>  <age>  <summary>`（summary 截斷為 50 個字元）。

### `inspect <slug>`

- 不安裝，僅擷取 skill metadata 和版本檔案。
- `--version <version>`：檢查特定版本（預設：latest）。
- `--tag <tag>`：檢查已標記版本（例如 `latest`）。
- `--versions`：列出版本歷史（第一頁）。
- `--limit <n>`：要列出的版本數上限（1-200）。
- `--files`：列出所選版本的檔案。
- `--file <path>`：擷取原始檔案內容（僅限文字檔；200KB 限制）。
- `--json`：機器可讀輸出。

### `install <slug>`

- 透過 `/api/v1/skills/<slug>` 解析最新版本。
- 透過 `/api/v1/download` 下載 zip。
- 解壓縮到 `<workdir>/<dir>/<slug>`。
- 拒絕覆寫已 pin 的 skills；請先執行 `clawhub unpin <slug>`。
- 寫入：
  - `<workdir>/.clawhub/lock.json`（舊版 `.clawdhub`）
  - `<skill>/.clawhub/origin.json`（舊版 `.clawdhub`）

### `uninstall <slug>`

- 移除 `<workdir>/<dir>/<slug>` 並刪除 lockfile 條目。
- 互動式：要求確認。
- 非互動式（`--no-input`）：需要 `--yes`。

### `list`

- 讀取 `<workdir>/.clawhub/lock.json`（舊版 `.clawdhub`）。
- 在以 `clawhub pin` 凍結的 Skills 旁顯示 `pinned`，包含選填原因。

### `pin <slug>`

- 在 lockfile 中將已安裝的 skill 標記為已釘選。
- `--reason <text>` 記錄 skill 被凍結的原因。
- 已釘選的 Skills 會被 `update --all` 略過，且會拒絕直接執行 `update <slug>`。
- 已釘選的 Skills 也會拒絕 `install --force`，因此本機位元組不會被意外取代。

### `unpin <slug>`

- 從已安裝的 skill 移除 lockfile 釘選，讓日後更新可以修改它。

### `update [slug]` / `update --all`

- 從本機檔案計算 fingerprint。
- 如果 fingerprint 符合已知版本：不提示。
- 如果 fingerprint 不符合：
  - 預設拒絕
  - 使用 `--force` 覆寫（若為互動模式則提示）
- 已釘選的 Skills 永遠不會被 `--force` 更新。
- `update <slug>` 會對已釘選的 slugs 快速失敗，並告知你先執行 `clawhub unpin <slug>`。
- `update --all` 會略過已釘選的 slugs，並列印哪些項目保持凍結的摘要。

### `skill publish <path>`

- 透過 `POST /api/v1/skills`（multipart）發布。
- 需要 semver：`--version 1.2.3`。
- 當行動者具有發布者存取權時，`--owner <handle>` 會以組織/使用者發布者 handle 發布。
- `--migrate-owner` 會在發布新版本時，將既有 skill 移動到 `--owner`。需要對兩個發布者都具有 admin/owner 存取權。
- 擁有者與審查行為在 `docs/publishing.md` 中說明。
- 發布 skill 表示它會在 ClawHub 上以 `MIT-0` 釋出。
- 已發布的 Skills 可免費使用、修改和重新散布，且不需署名。
- ClawHub 不支援付費 Skills 或依 skill 定價。
- `--clawscan-note <text>` 會新增 ClawScan 備註。此備註會提供 ClawScan 背景資訊，用於說明可能看似異常的行為，例如網路存取、原生主機存取或提供者特定憑證。此備註會儲存在已發布版本上。
- 舊版別名：`publish <path>`。

```bash
clawhub skill publish ./my-skill --clawscan-note "Uses network access only to call the user-configured Weather API."
```

### `delete <slug>`

- 軟刪除 skill（擁有者、moderator 或 admin）。
- 呼叫 `DELETE /api/v1/skills/{slug}`。
- 由擁有者發起的軟刪除會保留 slug 30 天；此命令會列印到期時間。
- `--reason <text>` 會在 skill 和稽核記錄上記錄 moderation 備註。
- `--note <text>` 是 `--reason` 的別名。
- `--yes` 會略過確認。

### `undelete <slug>`

- 還原已隱藏的 skill（擁有者、moderator 或 admin）。
- 呼叫 `POST /api/v1/skills/{slug}/undelete`。
- `--reason <text>` 會在 skill 和稽核記錄上記錄 moderation 備註。
- `--note <text>` 是 `--reason` 的別名。
- `--yes` 會略過確認。

### `hide <slug>`

- 隱藏 skill（擁有者、moderator 或 admin）。
- `delete` 的別名。

### `unhide <slug>`

- 取消隱藏 skill（擁有者、moderator 或 admin）。
- `undelete` 的別名。

### `skill rename <slug> <new-slug>`

- 重新命名擁有的 skill，並保留先前 slug 作為重新導向別名。
- 呼叫 `POST /api/v1/skills/{slug}/rename`。
- `--yes` 會略過確認。

### `skill merge <source-slug> <target-slug>`

- 將一個擁有的 skill 合併到另一個擁有的 skill。
- 來源 slug 會停止公開列出，並成為目標的重新導向別名。
- 呼叫 `POST /api/v1/skills/{sourceSlug}/merge`。
- `--yes` 會略過確認。

### `transfer`

- 所有權轉移工作流程。
- 轉移至使用者 handle 會建立待處理要求，由接收者接受。
- 轉移至組織/發布者 handle 只有在行動者同時具有目前擁有者與目的地發布者的 admin 存取權時，才會立即套用。
- 子命令：
  - `transfer request <slug> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <slug> [--yes]`
  - `transfer reject <slug> [--yes]`
  - `transfer cancel <slug> [--yes]`
- 端點：
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- 透過 `GET /api/v1/packages` 和 `GET /api/v1/packages/search` 瀏覽或搜尋統一套件目錄。
- 將此用於 plugins 和其他套件家族項目；頂層 `search` 仍是 skill 搜尋介面。
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
- 將此用於 plugin 中繼資料、相容性、驗證、來源，以及版本/檔案檢查。
- `--version <version>`：檢查特定版本（預設：latest）。
- `--tag <tag>`：檢查已標記版本（例如 `latest`）。
- `--versions`：列出版本歷史（第一頁）。
- `--limit <n>`：要列出的最大版本數（1-100）。
- `--files`：列出所選版本的檔案。
- `--file <path>`：擷取原始檔案內容（僅限文字檔；200KB 限制）。
- `--json`：機器可讀輸出。

### `package download <name>`

- 透過 `GET /api/v1/packages/{name}/versions/{version}/artifact` 解析套件版本。
- 從解析器的 `downloadUrl` 下載成品。
- 驗證所有成品的 ClawHub SHA-256。
- 對於 ClawPack npm-pack 成品，也會驗證 npm `sha512` integrity、npm shasum，以及 tarball 的 `package.json` name/version。
- 舊版 ZIP 版本會透過舊版 ZIP 路由下載。
- 旗標：
  - `--version <version>`：下載特定版本。
  - `--tag <tag>`：下載已標記版本（預設：`latest`）。
  - `-o, --output <path>`：輸出檔案或目錄。
  - `--force`：覆寫既有輸出檔案。
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- 為本機成品計算 ClawHub SHA-256、npm `sha512` integrity 和 npm shasum。
- 搭配 `--package` 時，會從 ClawHub 解析預期中繼資料，並將本機檔案與已發布成品中繼資料比較。
- 搭配直接摘要旗標時，不進行網路查詢即可驗證。
- 旗標：
  - `--package <name>`：用於解析預期成品中繼資料的套件名稱。
  - `--version <version>` 或 `--tag <tag>`：預期套件版本。
  - `--sha256 <hex>`：預期 ClawHub SHA-256。
  - `--npm-integrity <sri>`：預期 npm integrity。
  - `--npm-shasum <sha1>`：預期 npm shasum。
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package delete <name>`

- 軟刪除套件及其所有發布版本。
- 需要套件擁有者、組織發布者擁有者/管理員、平台版主，
  或平台管理員權限。
- 旗標：
  - `--yes`：略過確認。
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package undelete <name>`

- 還原軟刪除的套件和發布版本。
- 需要套件擁有者、組織發布者擁有者/管理員、平台版主，
  或平台管理員權限。
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
- 需要目前套件擁有者和目標發布者兩者的管理員存取權，
  除非由平台管理員執行。
- 具範圍的套件名稱必須轉移給相符的範圍擁有者。
- 呼叫 `POST /api/v1/packages/{name}/transfer`。
- 旗標：
  - `--to <owner>`：目標發布者帳號。
  - `--reason <text>`：選用的稽核原因。
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- 用於向版主檢舉套件的已驗證命令。
- 呼叫 `POST /api/v1/packages/{name}/report`。
- 檢舉以套件為層級，可選擇綁定版本，並會顯示給版主審查。
- 檢舉本身不會自動隱藏套件或封鎖下載。
- 旗標：
  - `--version <version>`：要附加到檢舉的選用套件版本。
  - `--reason <text>`：必要的檢舉原因。
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- 用於檢查套件審核可見性的擁有者命令。
- 呼叫 `GET /api/v1/packages/{name}/moderation`。
- 顯示目前套件掃描狀態、未結檢舉數、最新發布版本的手動審核狀態、下載封鎖狀態，以及審核原因。
- 旗標：
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- 檢查套件是否已準備好供未來 OpenClaw 使用。
- 呼叫 `GET /api/v1/packages/{name}/readiness`。
- 回報官方狀態、ClawPack 可用性、成品摘要、來源溯源、OpenClaw 相容性、主機目標、環境中繼資料，
  以及掃描狀態的阻擋問題。
- 旗標：
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- 顯示可能取代內建 OpenClaw Plugin 的套件，其面向操作員的遷移狀態。
- 呼叫與 `package readiness` 相同的計算後就緒狀態端點，但會列印聚焦遷移的狀態、最新版本、官方套件狀態、檢查項目與阻擋問題。
- 旗標：
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `package publish <source>`

- 透過 `POST /api/v1/packages` 發布程式碼 Plugin 或 bundle Plugin。
- `<source>` 接受：
  - 本機資料夾路徑：`./my-plugin`
  - 本機 ClawPack npm-pack tarball：`./my-plugin-1.2.3.tgz`
  - GitHub repo：`owner/repo` 或 `owner/repo@ref`
  - GitHub URL：`https://github.com/owner/repo`
- 中繼資料會從 `package.json`、`openclaw.plugin.json`，以及真正的 OpenClaw bundle 標記自動偵測，例如 `.codex-plugin/plugin.json`、
  `.claude-plugin/plugin.json` 和 `.cursor-plugin/plugin.json`。
- `.tgz` 來源會被視為 ClawPack。CLI 會上傳確切的 npm-pack 位元組，並只使用擷取出的 `package/` 內容進行驗證和中繼資料預先填入。
- 程式碼 Plugin 資料夾會在上傳前封裝成 ClawPack npm tarball，讓 OpenClaw 安裝能驗證確切成品。Bundle Plugin 資料夾仍使用擷取檔案發布路徑。
- 對於 GitHub 來源，來源歸屬會從 repo、解析後的 commit、ref 和子路徑自動填入。
- 對於本機資料夾，當 origin remote 指向 GitHub 時，來源歸屬會從本機 git 自動偵測。
- 外部程式碼 Plugin 必須明確宣告 `openclaw.compat.pluginApi` 和
  `openclaw.build.openclawVersion`。
  頂層 `package.json.version` 不會用作發布驗證的備援值。
- `--dry-run` 會預覽解析後的發布 payload，而不上傳。
- `--json` 會為 CI 輸出機器可讀內容。
- `--owner <handle>` 會在動作者具有發布者存取權時，以使用者或組織發布者帳號發布。
- `--clawscan-note <text>` 會新增 ClawScan 備註。此備註提供 ClawScan
  關於可能看起來不尋常行為的脈絡，例如網路存取、
  原生主機存取，或供應商特定認證。備註會儲存在已發布的版本上。
- 具範圍的套件名稱必須符合所選擁有者。請參閱 `docs/publishing.md`。
- 既有旗標（`--family`、`--name`、`--version`、`--source-repo`、`--source-commit`、`--source-ref`、`--source-path`）仍可作為覆寫使用。
- 私有 GitHub repo 需要 `GITHUB_TOKEN`。

```bash
clawhub package publish ./plugin.tgz --clawscan-note "Native host access is limited to the local OpenClaw bridge."
```

#### 建議的本機流程

先使用 `--dry-run`，以便在建立實際發布版本前確認解析後的套件中繼資料和來源歸屬：

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### 本機資料夾流程

對於程式碼 Plugin，資料夾發布會從套件資料夾建置並上傳 ClawPack 成品：

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `--family code-plugin` 的最小 `package.json`

外部程式碼 Plugin 需要在 `package.json` 中提供少量 OpenClaw 中繼資料。這個最小 manifest 足以成功發布：

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

- `package.json.version` 是你的套件發布版本，但不會用作 OpenClaw 相容性/建置驗證的備援值。
- `openclaw.hostTargets` 和 `openclaw.environment` 是選用中繼資料。
  ClawHub 可能會在它們存在時顯示，但發布時並非必要。
- `openclaw.compat.minGatewayVersion` 和
  `openclaw.build.pluginSdkVersion` 是選用額外項目，如果你想發布更詳細的相容性中繼資料可使用它們。
- 如果你使用的是較舊的 `clawhub` CLI 版本，請在發布前升級，讓本機預檢查能在上傳前執行。

#### GitHub Actions

ClawHub 也提供官方可重用 workflow，位於
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/af96221ebb197e2af09f44870046ced4ded4aea0/.github/workflows/package-publish.yml)，
供 Plugin repo 使用。

典型呼叫端設定：

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

- 可重用 workflow 預設將 `source` 設為呼叫端 repo。
- 對於 monorepo，請傳入 `source_path`，讓 workflow 發布 Plugin
  套件資料夾，例如 `source_path: extensions/codex`。
- 將可重用 workflow 釘選到穩定標籤或完整 commit SHA。不要從 `@main` 執行發布。
- `pull_request` 應使用 `dry_run: true`，讓 CI 不產生污染。
- 實際發布應限制在可信事件，例如 `workflow_dispatch` 或標籤推送。
- 不使用 secret 的可信發布只適用於 `workflow_dispatch`；標籤推送仍需要 `clawhub_token`。
- 保留 `clawhub_token` 可用於首次發布、不受信任的套件，或緊急破窗發布。
- workflow 會將 JSON 結果作為成品上傳，並將其公開為 workflow 輸出。

### `sync`

- 掃描本機 skill 資料夾並發布新的/已變更的項目。
- 根目錄可以是任何資料夾：skills 目錄，或含有 `SKILL.md` 的單一 skill 資料夾。
- 當 `~/.clawdbot/clawdbot.json` 存在時，自動加入 Clawdbot skill 根目錄：
  - `agent.workspace/skills`（主要 agent）
  - `routing.agents.*.workspace/skills`（每個 agent）
  - `~/.clawdbot/skills`（共用）
  - `skills.load.extraDirs`（共用套件）
- 遵守 `CLAWDBOT_CONFIG_PATH` / `CLAWDBOT_STATE_DIR` 和 `OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR`。
- 旗標：
  - `--root <dir...>` 額外掃描根目錄
  - `--all` 不提示直接上傳
  - `--dry-run` 只顯示計畫
  - `--bump patch|minor|major`（預設：patch）
  - `--changelog <text>`（非互動式）
  - `--tags a,b,c`（預設：latest）
  - `--concurrency <n>`（預設：4）

遙測：

- 登入時會在 `sync` 期間傳送，除非設定 `CLAWHUB_DISABLE_TELEMETRY=1`（舊版 `CLAWDHUB_DISABLE_TELEMETRY=1`）。
- 詳情：`docs/telemetry.md`。
