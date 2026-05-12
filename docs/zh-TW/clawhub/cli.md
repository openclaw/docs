---
read_when:
    - 使用 ClawHub CLI
    - 安裝、更新、發布或同步的偵錯
summary: CLI 參考：命令、旗標、設定、鎖定檔、同步行為。
x-i18n:
    generated_at: "2026-05-12T12:48:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 541fb8367e70fab6aaa9fd622a0c2753170d7cd2afa5e4e02681d606bb45ea8c
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

然後驗證：

```bash
clawhub --help
clawhub login
clawhub whoami
```

## 全域旗標

- `--workdir <dir>`：工作目錄（預設：cwd；若已設定，則回退至 Clawdbot 工作區）
- `--dir <dir>`：workdir 下的安裝目錄（預設：`skills`）
- `--site <url>`：瀏覽器登入的基礎 URL（預設：`https://clawhub.ai`）
- `--registry <url>`：API 基礎 URL（預設：自動探索，否則為 `https://clawhub.ai`）
- `--no-input`：停用提示

環境變數對應：

- `CLAWHUB_SITE`（舊版 `CLAWDHUB_SITE`）
- `CLAWHUB_REGISTRY`（舊版 `CLAWDHUB_REGISTRY`）
- `CLAWHUB_WORKDIR`（舊版 `CLAWDHUB_WORKDIR`）

### HTTP 代理伺服器

CLI 會遵循標準 HTTP 代理伺服器環境變數，適用於位於
企業代理伺服器或受限網路後方的系統：

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

當設定其中任一變數時，CLI 會透過
指定的代理伺服器路由對外請求。`HTTPS_PROXY` 用於 HTTPS 請求，`HTTP_PROXY`
用於一般 HTTP。`NO_PROXY` / `no_proxy` 會被遵循，以便針對
特定主機或網域略過代理伺服器。

在直接對外連線遭封鎖的系統上，這是必要的
（例如 Docker 容器、只能透過代理上網的 Hetzner VPS、企業
防火牆）。

範例：

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

未設定代理伺服器變數時，行為不變（直接連線）。

## 設定檔

儲存你的 API 權杖與快取的登錄 URL。

- macOS：`~/Library/Application Support/clawhub/config.json`
- Linux/XDG：`$XDG_CONFIG_HOME/clawhub/config.json` 或 `~/.config/clawhub/config.json`
- Windows：`%APPDATA%\\clawhub\\config.json`
- 舊版回退：如果 `clawhub/config.json` 尚不存在但 `clawdhub/config.json` 存在，CLI 會重用舊版路徑
- 覆寫：`CLAWHUB_CONFIG_PATH`（舊版 `CLAWDHUB_CONFIG_PATH`）

## 命令

### `login` / `auth login`

- 預設：開啟瀏覽器前往 `<site>/cli/auth`，並透過 loopback 回呼完成。
- 無頭模式：`clawhub login --token clh_...`
- 遠端/無頭互動模式：`clawhub login --device` 會列印代碼，並在你於 `<site>/cli/device` 授權時等待。

### `whoami`

- 透過 `/api/v1/whoami` 驗證已儲存的權杖。

### `star <slug>` / `unstar <slug>`

- 從你的精選中新增/移除技能。
- 呼叫 `POST /api/v1/stars/<slug>` 和 `DELETE /api/v1/stars/<slug>`。
- `--yes` 會略過確認。

### `search <query...>`

- 呼叫 `/api/v1/search?q=...`。
- 搜尋會先偏好精確的 slug/名稱權杖符合，再考量下載熱門度。像 `map` 這樣的獨立 slug 權杖，會比 `amap` 內的子字串更強烈地符合 `personal-map`。
- 下載數只是小幅的熱門度先驗，不保證會排在最前面。
- 如果某個技能應該出現但沒有出現，請在登入狀態下執行 `clawhub inspect <slug>`，先檢查擁有者可見的審核診斷，再重新命名中繼資料。

### `explore`

- 透過 `/api/v1/skills?limit=...&sort=createdAt` 列出最新技能（依 `createdAt` 遞減排序）。
- 旗標：
  - `--limit <n>`（1-200，預設：25）
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending`（預設：newest）
  - `--json`（機器可讀輸出）
- 輸出：`<slug>  v<version>  <age>  <summary>`（摘要截斷為 50 個字元）。

### `inspect <slug>`

- 擷取技能中繼資料與版本檔案，不進行安裝。
- `--version <version>`：檢查特定版本（預設：latest）。
- `--tag <tag>`：檢查帶有標籤的版本（例如 `latest`）。
- `--versions`：列出版本歷史（第一頁）。
- `--limit <n>`：要列出的版本數上限（1-200）。
- `--files`：列出所選版本的檔案。
- `--file <path>`：擷取原始檔案內容（僅限文字檔；200KB 限制）。
- `--json`：機器可讀輸出。

### `install <slug>`

- 透過 `/api/v1/skills/<slug>` 解析最新版本。
- 透過 `/api/v1/download` 下載 zip。
- 解壓縮到 `<workdir>/<dir>/<slug>`。
- 拒絕覆寫已釘選的技能；請先執行 `clawhub unpin <slug>`。
- 寫入：
  - `<workdir>/.clawhub/lock.json`（舊版 `.clawdhub`）
  - `<skill>/.clawhub/origin.json`（舊版 `.clawdhub`）

### `uninstall <slug>`

- 移除 `<workdir>/<dir>/<slug>`，並刪除 lockfile 項目。
- 互動模式：要求確認。
- 非互動模式（`--no-input`）：需要 `--yes`。

### `list`

- 讀取 `<workdir>/.clawhub/lock.json`（舊版 `.clawdhub`）。
- 在使用 `clawhub pin` 凍結的技能旁顯示 `pinned`，包括選填原因。

### `pin <slug>`

- 在鎖定檔中將已安裝的技能標記為已釘選。
- `--reason <text>` 記錄技能被凍結的原因。
- 已釘選的技能會被 `update --all` 略過，且直接執行 `update <slug>` 會被拒絕。
- 已釘選的技能也會拒絕 `install --force`，避免本機位元組被意外取代。

### `unpin <slug>`

- 從已安裝技能移除鎖定檔釘選，讓未來更新可以修改它。

### `update [slug]` / `update --all`

- 從本機檔案計算指紋。
- 如果指紋符合已知版本：不提示。
- 如果指紋不符合：
  - 預設拒絕
  - 使用 `--force` 覆寫（若為互動模式，則提示）
- 已釘選的技能永遠不會被 `--force` 更新。
- `update <slug>` 會對已釘選的 slug 快速失敗，並告訴你先執行 `clawhub unpin <slug>`。
- `update --all` 會略過已釘選的 slug，並列印保留凍結項目的摘要。

### `skill publish <path>`

- 透過 `POST /api/v1/skills`（multipart）發布。
- 需要 semver：`--version 1.2.3`。
- `--owner <handle>` 會在執行者具有發布者存取權時，以組織/使用者發布者 handle 名義發布。
- `--migrate-owner` 會在發布新版本時，將現有技能移至 `--owner`。需要對兩個發布者都有管理員/擁有者存取權。
- 擁有者與審查行為在 `docs/publishing.md` 中說明。
- 發布技能表示它會以 `MIT-0` 授權在 ClawHub 上發行。
- 已發布的技能可自由使用、修改及重新散布，且不需署名。
- ClawHub 不支援付費技能或單一技能定價。
- `--clawscan-note <text>` 會新增 ClawScan 註記。此註記會提供 ClawScan 背景脈絡，說明可能看起來不尋常的行為，例如網路存取、原生主機存取，或供應商特定憑證。此註記會儲存在已發布版本上。
- 舊版別名：`publish <path>`。

```bash
clawhub skill publish ./my-skill --clawscan-note "Uses network access only to call the user-configured Weather API."
```

### `delete <slug>`

- 軟刪除技能（擁有者、版主或管理員）。
- 呼叫 `DELETE /api/v1/skills/{slug}`。
- 由擁有者發起的軟刪除會保留 slug 30 天；此命令會列印到期時間。
- `--reason <text>` 會在技能與稽核記錄中記錄管理註記。
- `--note <text>` 是 `--reason` 的別名。
- `--yes` 會略過確認。

### `undelete <slug>`

- 還原隱藏的技能（擁有者、版主或管理員）。
- 呼叫 `POST /api/v1/skills/{slug}/undelete`。
- `--reason <text>` 會在技能與稽核記錄中記錄管理註記。
- `--note <text>` 是 `--reason` 的別名。
- `--yes` 會略過確認。

### `hide <slug>`

- 隱藏技能（擁有者、版主或管理員）。
- `delete` 的別名。

### `unhide <slug>`

- 取消隱藏技能（擁有者、版主或管理員）。
- `undelete` 的別名。

### `skill rename <slug> <new-slug>`

- 重新命名擁有的技能，並將先前的 slug 保留為重新導向別名。
- 呼叫 `POST /api/v1/skills/{slug}/rename`。
- `--yes` 會略過確認。

### `skill merge <source-slug> <target-slug>`

- 將一個擁有的技能合併到另一個擁有的技能。
- 來源 slug 會停止公開列出，並成為指向目標的重新導向別名。
- 呼叫 `POST /api/v1/skills/{sourceSlug}/merge`。
- `--yes` 會略過確認。

### `transfer`

- 擁有權轉移工作流程。
- 轉移給使用者 handle 會建立待處理請求，由收件者接受。
- 轉移給組織/發布者 handle 只有在執行者對目前擁有者與目的地發布者都有管理員存取權時，才會立即套用。
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
- 將此命令用於 plugins 和其他套件系列項目；頂層 `search` 仍是技能搜尋介面。
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
- 將此命令用於 plugin 中繼資料、相容性、驗證、來源，以及版本/檔案檢查。
- `--version <version>`：檢查特定版本（預設：最新）。
- `--tag <tag>`：檢查已標記版本（例如 `latest`）。
- `--versions`：列出版本歷史（第一頁）。
- `--limit <n>`：列出的最大版本數（1-100）。
- `--files`：列出所選版本的檔案。
- `--file <path>`：擷取原始檔案內容（僅文字檔；200KB 限制）。
- `--json`：機器可讀輸出。

### `package download <name>`

- 透過 `GET /api/v1/packages/{name}/versions/{version}/artifact` 解析套件版本。
- 從解析器的 `downloadUrl` 下載成品。
- 驗證所有成品的 ClawHub SHA-256。
- 對於 ClawPack npm-pack 成品，也會驗證 npm `sha512` 完整性、npm shasum，以及 tarball 的 `package.json` 名稱/版本。
- 舊版 ZIP 版本會透過舊版 ZIP 路由下載。
- 旗標：
  - `--version <version>`：下載特定版本。
  - `--tag <tag>`：下載已標記版本（預設：`latest`）。
  - `-o, --output <path>`：輸出檔案或目錄。
  - `--force`：覆寫現有輸出檔案。
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- 計算本機成品的 ClawHub SHA-256、npm `sha512` 完整性和 npm shasum。
- 搭配 `--package` 時，會從 ClawHub 解析預期中繼資料，並將本機檔案與已發布成品中繼資料比較。
- 搭配直接摘要旗標時，會在不進行網路查詢的情況下驗證。
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

### `package delete <name>`

- 軟刪除套件及其所有發行版本。
- 需要套件擁有者、組織發布者擁有者/管理員、平台版主，
  或平台管理員。
- 旗標：
  - `--yes`：略過確認。
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package undelete <name>`

- 還原已軟刪除的套件和發行版本。
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
- 需要同時擁有目前套件擁有者與目的地發布者的管理員存取權，
  除非由平台管理員執行。
- 有範圍的套件名稱必須轉移給相符的範圍擁有者。
- 呼叫 `POST /api/v1/packages/{name}/transfer`。
- 旗標：
  - `--to <owner>`：目的地發布者 handle。
  - `--reason <text>`：選用的稽核原因。
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- 已驗證命令，用於向版主檢舉套件。
- 呼叫 `POST /api/v1/packages/{name}/report`。
- 檢舉以套件為層級，可選擇綁定版本，並會顯示給版主審查。
- 檢舉本身不會自動隱藏套件或封鎖下載。
- 旗標：
  - `--version <version>`：選用，要附加到檢舉的套件版本。
  - `--reason <text>`：必填的檢舉原因。
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- 擁有者命令，用於檢查套件審查可見性。
- 呼叫 `GET /api/v1/packages/{name}/moderation`。
- 顯示目前套件掃描狀態、未結檢舉數量、最新發行版本的人工審查狀態、
  下載封鎖狀態，以及審查原因。
- 旗標：
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- 檢查套件是否已準備好供未來 OpenClaw 使用。
- 呼叫 `GET /api/v1/packages/{name}/readiness`。
- 回報官方狀態、ClawPack 可用性、成品摘要、來源出處、
  OpenClaw 相容性、主機目標、環境中繼資料，
  以及掃描狀態的阻礙項目。
- 旗標：
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- 顯示面向操作人員的套件遷移狀態，該套件可能取代
  內建的 OpenClaw plugin。
- 呼叫與 `package readiness` 相同的計算式就緒度端點，但會列印
  以遷移為重點的狀態、最新版本、官方套件狀態、檢查項目和阻礙項目。
- 旗標：
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `package publish <source>`

- 透過 `POST /api/v1/packages` 發布程式碼 plugin 或 bundle plugin。
- `<source>` 接受：
  - 本機資料夾路徑：`./my-plugin`
  - 本機 ClawPack npm-pack tarball：`./my-plugin-1.2.3.tgz`
  - GitHub repo：`owner/repo` 或 `owner/repo@ref`
  - GitHub URL：`https://github.com/owner/repo`
- 中繼資料會從 `package.json`、`openclaw.plugin.json`，
  以及真正的 OpenClaw bundle 標記自動偵測，例如 `.codex-plugin/plugin.json`、
  `.claude-plugin/plugin.json` 和 `.cursor-plugin/plugin.json`。
- `.tgz` 來源會視為 ClawPack。CLI 會上傳確切的 npm-pack
  位元組，並僅使用解出的 `package/` 內容進行驗證和中繼資料預填。
- 程式碼 plugin 資料夾會在上傳前打包成 ClawPack npm tarball，
  讓 OpenClaw 安裝可以驗證確切成品。Bundle plugin 資料夾仍使用
  解出檔案的發布路徑。
- 對於 GitHub 來源，來源歸屬會從 repo、解析後的 commit、ref 和子路徑自動填入。
- 對於本機資料夾，當 origin remote 指向 GitHub 時，來源歸屬會從本機 git 自動偵測。
- 外部程式碼 plugin 必須明確宣告 `openclaw.compat.pluginApi` 和
  `openclaw.build.openclawVersion`。
  頂層 `package.json.version` 不會作為發布驗證的備援。
- `--dry-run` 會預覽解析後的發布 payload，而不會上傳。
- `--json` 會輸出 CI 可用的機器可讀內容。
- `--owner <handle>` 會在執行者具有發布者存取權時，以使用者或組織發布者 handle 發布。
- `--clawscan-note <text>` 會新增 ClawScan 註記。此註記會向 ClawScan
  提供可能看起來異常的行為背景，例如網路存取、
  原生主機存取，或供應商特定憑證。此註記會儲存在
  已發布的發行版本上。
- 有範圍的套件名稱必須符合所選擁有者。請參閱 `docs/publishing.md`。
- 現有旗標（`--family`、`--name`、`--version`、`--source-repo`、`--source-commit`、`--source-ref`、`--source-path`）仍可作為覆寫使用。
- 私有 GitHub repo 需要 `GITHUB_TOKEN`。

```bash
clawhub package publish ./plugin.tgz --clawscan-note "Native host access is limited to the local OpenClaw bridge."
```

#### 建議的本機流程

先使用 `--dry-run`，讓你能在建立實際發行版本前確認解析後的套件中繼資料和
來源歸屬：

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### 本機資料夾流程

對於程式碼 plugin，資料夾發布會從套件資料夾建置並上傳 ClawPack 成品：

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `--family code-plugin` 的最小 `package.json`

外部程式碼 plugin 需要在 `package.json` 中提供少量 OpenClaw 中繼資料。
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

- `package.json.version` 是你的套件發行版本，但不會作為
  OpenClaw 相容性/建置驗證的備援。
- `openclaw.hostTargets` 和 `openclaw.environment` 是選用中繼資料。
  ClawHub 可能會在它們存在時顯示，但發布時並不需要。
- 如果你想發布更詳細的相容性中繼資料，`openclaw.compat.minGatewayVersion` 和
  `openclaw.build.pluginSdkVersion` 是選用額外項目。
- 如果你使用較舊的 `clawhub` CLI 發行版，請在發布前升級，
  讓本機預檢查能在上傳前執行。

#### GitHub Actions

ClawHub 也為 plugin repo 提供官方可重用 workflow，位於
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/be77f0626d9e4b52c465670ba411882be1ac3a2d/.github/workflows/package-publish.yml)。

典型的呼叫者設定：

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

- 可重用 workflow 預設會將 `source` 設為呼叫者 repo。
- 對於 monorepo，傳入 `source_path`，讓 workflow 發布 plugin
  套件資料夾，例如 `source_path: extensions/codex`。
- 將可重用 workflow 釘選到穩定 tag 或完整 commit SHA。不要從 `@main` 執行發行發布。
- `pull_request` 應使用 `dry_run: true`，讓 CI 維持不產生污染。
- 實際發布應限制於受信任事件，例如 `workflow_dispatch` 或 tag push。
- 不使用 secret 的受信任發布僅適用於 `workflow_dispatch`；tag push 仍需要 `clawhub_token`。
- 保留 `clawhub_token` 供首次發布、不受信任套件，或緊急發布使用。
- workflow 會將 JSON 結果上傳為成品，並將其公開為 workflow 輸出。

### `sync`

- 掃描本機 skill 資料夾，並發布新的/已變更的項目。
- Root 可以是任何資料夾：skills 目錄，或包含 `SKILL.md` 的單一 skill 資料夾。
- 當 `~/.clawdbot/clawdbot.json` 存在時，會自動新增 Clawdbot skill root：
  - `agent.workspace/skills`（主 agent）
  - `routing.agents.*.workspace/skills`（每個 agent）
  - `~/.clawdbot/skills`（共用）
  - `skills.load.extraDirs`（共用 packs）
- 遵守 `CLAWDBOT_CONFIG_PATH` / `CLAWDBOT_STATE_DIR` 和 `OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR`。
- 旗標：
  - `--root <dir...>` 額外掃描 root
  - `--all` 不提示直接上傳
  - `--dry-run` 僅顯示計畫
  - `--bump patch|minor|major`（預設：patch）
  - `--changelog <text>`（非互動式）
  - `--tags a,b,c`（預設：latest）
  - `--concurrency <n>`（預設：4）

遙測：

- 登入時會在 `sync` 期間傳送，除非設定 `CLAWHUB_DISABLE_TELEMETRY=1`（舊版 `CLAWDHUB_DISABLE_TELEMETRY=1`）。
- 詳情：`docs/telemetry.md`。
