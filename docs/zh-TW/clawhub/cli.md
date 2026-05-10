---
read_when:
    - 使用 ClawHub CLI
    - 偵錯安裝、更新、發布或同步
summary: CLI 參考：命令、旗標、設定、鎖定檔、同步行為。
x-i18n:
    generated_at: "2026-05-10T19:24:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: af8e43780c82c9d540bf99e677788df8913532adb3d237d20d96f575f621eae3
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

CLI 套件：`clawhub`，bin：`clawhub`。

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

- `--workdir <dir>`：工作目錄（預設：cwd；如果已設定，則回退至 Clawdbot 工作區）
- `--dir <dir>`：workdir 下的安裝目錄（預設：`skills`）
- `--site <url>`：瀏覽器登入的基底 URL（預設：`https://clawhub.ai`）
- `--registry <url>`：API 基底 URL（預設：自動探索，否則為 `https://clawhub.ai`）
- `--no-input`：停用提示

環境變數對應項：

- `CLAWHUB_SITE`（舊版 `CLAWDHUB_SITE`）
- `CLAWHUB_REGISTRY`（舊版 `CLAWDHUB_REGISTRY`）
- `CLAWHUB_WORKDIR`（舊版 `CLAWDHUB_WORKDIR`）

### HTTP 代理

CLI 會遵循標準 HTTP 代理環境變數，適用於位於企業代理或受限網路後方的系統：

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

設定其中任一變數時，CLI 會透過指定的代理路由對外請求。`HTTPS_PROXY` 用於 HTTPS 請求，`HTTP_PROXY` 用於一般 HTTP。`NO_PROXY` / `no_proxy` 會被遵循，以便特定主機或網域略過代理。

這在直接對外連線被封鎖的系統上是必要的（例如 Docker 容器、僅能透過代理上網的 Hetzner VPS、企業防火牆）。

範例：

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

未設定代理變數時，行為不變（直接連線）。

## 設定檔

儲存你的 API 權杖與快取的 registry URL。

- macOS：`~/Library/Application Support/clawhub/config.json`
- Linux/XDG：`$XDG_CONFIG_HOME/clawhub/config.json` 或 `~/.config/clawhub/config.json`
- Windows：`%APPDATA%\\clawhub\\config.json`
- 舊版回退：如果 `clawhub/config.json` 尚不存在但 `clawdhub/config.json` 存在，CLI 會重用舊版路徑
- 覆寫：`CLAWHUB_CONFIG_PATH`（舊版 `CLAWDHUB_CONFIG_PATH`）

## 指令

### `login` / `auth login`

- 預設：開啟瀏覽器至 `<site>/cli/auth`，並透過 loopback callback 完成。
- 無頭模式：`clawhub login --token clh_...`
- 遠端／無頭互動模式：`clawhub login --device` 會列印代碼，並在你於 `<site>/cli/device` 授權時等待。

### `whoami`

- 透過 `/api/v1/whoami` 驗證已儲存的權杖。

### `star <slug>` / `unstar <slug>`

- 從你的精選項目新增／移除技能。
- 呼叫 `POST /api/v1/stars/<slug>` 與 `DELETE /api/v1/stars/<slug>`。
- `--yes` 會略過確認。

### `search <query...>`

- 呼叫 `/api/v1/search?q=...`。
- 搜尋會優先考量完全相符的 slug／名稱詞元，再考量下載熱門度。像 `map` 這樣獨立的 slug 詞元，會比 `amap` 內部的子字串更強烈地匹配 `personal-map`。
- 下載量只是小幅的熱門度先驗，不保證排在最前。
- 如果某個技能應該出現但沒有出現，請在登入狀態下執行 `clawhub inspect <slug>`，先檢查擁有者可見的審核診斷，再重新命名中繼資料。

### `explore`

- 透過 `/api/v1/skills?limit=...&sort=createdAt` 列出最新技能（依 `createdAt` 由新到舊排序）。
- 旗標：
  - `--limit <n>`（1-200，預設：25）
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending`（預設：newest）
  - `--json`（機器可讀輸出）
- 輸出：`<slug>  v<version>  <age>  <summary>`（summary 截斷為 50 個字元）。

### `inspect <slug>`

- 擷取技能中繼資料與版本檔案，但不安裝。
- `--version <version>`：檢查特定版本（預設：latest）。
- `--tag <tag>`：檢查已標記的版本（例如 `latest`）。
- `--versions`：列出版本歷史（第一頁）。
- `--limit <n>`：要列出的版本數上限（1-200）。
- `--files`：列出所選版本的檔案。
- `--file <path>`：擷取原始檔案內容（僅限文字檔；200KB 限制）。
- `--json`：機器可讀輸出。

### `install <slug>`

- 透過 `/api/v1/skills/<slug>` 解析最新版本。
- 透過 `/api/v1/download` 下載 zip。
- 解壓縮至 `<workdir>/<dir>/<slug>`。
- 拒絕覆寫已釘選的技能；請先執行 `clawhub unpin <slug>`。
- 寫入：
  - `<workdir>/.clawhub/lock.json`（舊版 `.clawdhub`）
  - `<skill>/.clawhub/origin.json`（舊版 `.clawdhub`）

### `uninstall <slug>`

- 移除 `<workdir>/<dir>/<slug>` 並刪除 lockfile 項目。
- 互動模式：要求確認。
- 非互動模式（`--no-input`）：需要 `--yes`。

### `list`

- 讀取 `<workdir>/.clawhub/lock.json`（舊版 `.clawdhub`）。
- 在透過 `clawhub pin` 凍結的技能旁顯示 `pinned`，包括選填原因。

### `pin <slug>`

- 在 lockfile 中將已安裝的技能標記為已釘選。
- `--reason <text>` 記錄技能被凍結的原因。
- 已釘選的技能會被 `update --all` 略過，且直接執行 `update <slug>` 會被拒絕。
- 已釘選的技能也會拒絕 `install --force`，因此本機位元組不會意外被取代。

### `unpin <slug>`

- 從已安裝的技能移除 lockfile 釘選，讓未來更新可以修改它。

### `update [slug]` / `update --all`

- 從本機檔案計算指紋。
- 如果指紋符合已知版本：不提示。
- 如果指紋不符合：
  - 預設拒絕
  - 使用 `--force` 覆寫（或在互動模式下提示）
- 已釘選的技能永遠不會被 `--force` 更新。
- `update <slug>` 對已釘選的 slug 會快速失敗，並告知你先執行 `clawhub unpin <slug>`。
- `update --all` 會略過已釘選的 slug，並列印保留凍結項目的摘要。

### `skill publish <path>`

- 透過 `POST /api/v1/skills`（multipart）發布。
- 需要 semver：`--version 1.2.3`。
- 當執行者具有發布者存取權時，`--owner <handle>` 會在組織/使用者發布者 handle 下發布。
- `--migrate-owner` 會在發布新版本時，將既有技能移至 `--owner`。需要對兩個發布者都有管理員/擁有者存取權。
- 擁有者與審查行為在 `docs/publishing.md` 中說明。
- 發布技能表示它會在 ClawHub 上以 `MIT-0` 釋出。
- 已發布的技能可自由使用、修改和再散布，無需署名。
- ClawHub 不支援付費技能或按技能計價。
- 舊版別名：`publish <path>`。

### `delete <slug>`

- 軟刪除技能（擁有者、版主或管理員）。
- 呼叫 `DELETE /api/v1/skills/{slug}`。
- 由擁有者發起的軟刪除會保留 slug 30 天；命令會列印到期時間。
- `--reason <text>` 會在技能與稽核記錄中記錄審核備註。
- `--note <text>` 是 `--reason` 的別名。
- `--yes` 略過確認。

### `undelete <slug>`

- 還原隱藏的技能（擁有者、版主或管理員）。
- 呼叫 `POST /api/v1/skills/{slug}/undelete`。
- `--reason <text>` 會在技能與稽核記錄中記錄審核備註。
- `--note <text>` 是 `--reason` 的別名。
- `--yes` 略過確認。

### `hide <slug>`

- 隱藏技能（擁有者、版主或管理員）。
- `delete` 的別名。

### `unhide <slug>`

- 取消隱藏技能（擁有者、版主或管理員）。
- `undelete` 的別名。

### `skill rename <slug> <new-slug>`

- 重新命名擁有的技能，並將先前的 slug 保留為重新導向別名。
- 呼叫 `POST /api/v1/skills/{slug}/rename`。
- `--yes` 略過確認。

### `skill merge <source-slug> <target-slug>`

- 將一個擁有的技能合併到另一個擁有的技能。
- 來源 slug 會停止公開列出，並成為指向目標的重新導向別名。
- 呼叫 `POST /api/v1/skills/{sourceSlug}/merge`。
- `--yes` 略過確認。

### `skill rescan <slug>`

- 要求對最新發布的技能版本進行安全性重新掃描。
- 擁有者與發布者管理員可以在每個版本的復原限制內，重新掃描自己的技能。
- 平台版主與管理員可以重新掃描任何技能，且不受擁有者復原限制阻擋，但每個版本一次只能執行一個重新掃描。
- 呼叫 `POST /api/v1/skills/{slug}/rescan`。
- 旗標：
  - `--yes`：略過確認。
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub skill rescan suspicious-skill --yes
```

### `transfer`

- 擁有權轉移工作流程。
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
- 將此用於 plugins 和其他套件家族項目；頂層 `search` 仍是技能搜尋介面。
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
- `--versions`：列出版本歷程（第一頁）。
- `--limit <n>`：要列出的最大版本數（1-100）。
- `--files`：列出所選版本的檔案。
- `--file <path>`：擷取原始檔案內容（僅文字檔；200KB 限制）。
- `--json`：機器可讀輸出。

### `package download <name>`

- 透過 `GET /api/v1/packages/{name}/versions/{version}/artifact` 解析套件版本。
- 從解析器的 `downloadUrl` 下載成品。
- 驗證所有成品的 ClawHub SHA-256。
- 對於 ClawPack npm-pack 成品，也會驗證 npm `sha512` integrity、npm shasum，以及 tarball 的 `package.json` 名稱/版本。
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
- 搭配直接摘要旗標時，無需網路查詢即可驗證。
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

### `package rescan <name>`

- 要求對最新發布的套件發行版本進行安全性重新掃描。
- 擁有者和發布者管理員可以在每個發行版本的復原限制內，重新掃描自己的套件。
- 平台版主和管理員可以重新掃描任何套件，且不受擁有者復原限制阻擋，
  但每個發行版本一次只能執行一個重新掃描。
- 呼叫 `POST /api/v1/packages/{name}/rescan`。
- 旗標：
  - `--yes`：略過確認。
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package rescan @openclaw/example-plugin --yes
```

### `package report`

- 用於向版主回報套件的已驗證命令。
- 呼叫 `POST /api/v1/packages/{name}/report`。
- 回報以套件為層級，可選擇綁定版本，並會顯示給版主審查。
- 回報本身不會自動隱藏套件或阻擋下載。
- 旗標：
  - `--version <version>`：要附加到回報的選用套件版本。
  - `--reason <text>`：必要的回報原因。
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package appeal`

- 用於對發行版本審核提出申訴的擁有者/發布者命令。
- 呼叫 `POST /api/v1/packages/{name}/appeal`。
- 被隔離、撤銷、可疑或惡意的發行版本都可接受申訴。
- 旗標：
  - `--version <version>`：必要的套件版本。
  - `--message <text>`：必要的申訴訊息。
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package appeal @openclaw/example-plugin --version 1.2.3 --message "linked source release explains the native binary"
```

### `package moderation-status`

- 用於檢查套件審核可見性的擁有者命令。
- 呼叫 `GET /api/v1/packages/{name}/moderation`。
- 顯示目前套件掃描狀態、未結回報數量、最新發行版本的手動審核狀態、下載阻擋狀態，以及審核原因。
- 旗標：
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- 檢查套件是否已準備好供未來 OpenClaw 使用。
- 呼叫 `GET /api/v1/packages/{name}/readiness`。
- 回報官方狀態、ClawPack 可用性、成品摘要、來源出處、OpenClaw 相容性、主機目標、環境中繼資料和掃描狀態的阻擋項目。
- 旗標：
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- 顯示可能取代內建 OpenClaw Plugin 的套件之操作員導向遷移狀態。
- 呼叫與 `package readiness` 相同的計算式就緒端點，但會列印聚焦於遷移的狀態、最新版本、官方套件狀態、檢查和阻擋項目。
- 旗標：
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `package publish <source>`

- 透過 `POST /api/v1/packages` 發布程式碼 Plugin 或套裝 Plugin。
- `<source>` 接受：
  - 本機資料夾路徑：`./my-plugin`
  - 本機 ClawPack npm-pack tarball：`./my-plugin-1.2.3.tgz`
  - GitHub 儲存庫：`owner/repo` 或 `owner/repo@ref`
  - GitHub URL：`https://github.com/owner/repo`
- 中繼資料會從 `package.json`、`openclaw.plugin.json`，以及真實 OpenClaw 套裝標記（例如 `.codex-plugin/plugin.json`、`.claude-plugin/plugin.json` 和 `.cursor-plugin/plugin.json`）自動偵測。
- `.tgz` 來源會視為 ClawPack。CLI 會上傳確切的 npm-pack 位元組，並只使用解出的 `package/` 內容進行驗證與中繼資料預先填入。
- 程式碼 Plugin 資料夾會在上傳前打包成 ClawPack npm tarball，讓 OpenClaw 安裝能驗證確切成品。套裝 Plugin 資料夾仍使用解出檔案的發布路徑。
- 對於 GitHub 來源，來源歸屬會從儲存庫、解析後的提交、參照和子路徑自動填入。
- 對於本機資料夾，當 origin 遠端指向 GitHub 時，來源歸屬會從本機 git 自動偵測。
- 外部程式碼 Plugin 必須明確宣告 `openclaw.compat.pluginApi` 和
  `openclaw.build.openclawVersion`。
  最上層 `package.json.version` 不會作為發布驗證的備援。
- `--dry-run` 會預覽解析後的發布承載資料而不上傳。
- `--json` 會為 CI 發出機器可讀輸出。
- `--owner <handle>` 會在執行者具有發布者存取權時，以使用者或組織發布者代號發布。
- 具範圍的套件名稱必須符合選取的擁有者。請參閱 `docs/publishing.md`。
- 既有旗標（`--family`、`--name`、`--version`、`--source-repo`、`--source-commit`、`--source-ref`、`--source-path`）仍可作為覆寫使用。
- 私有 GitHub 儲存庫需要 `GITHUB_TOKEN`。

#### 建議的本機流程

先使用 `--dry-run`，以便在建立正式發行版本前確認解析後的套件中繼資料和來源歸屬：

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

外部程式碼 Plugin 需要在 `package.json` 中加入少量 OpenClaw 中繼資料。這個最小資訊清單已足以成功發布：

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

- `package.json.version` 是你的套件發行版本，但不會作為 OpenClaw 相容性/建置驗證的備援。
- `openclaw.hostTargets` 和 `openclaw.environment` 是選用中繼資料。
  ClawHub 可能會在其存在時顯示它們，但發布時並非必要。
- 如果你想發布更詳細的相容性中繼資料，`openclaw.compat.minGatewayVersion` 和
  `openclaw.build.pluginSdkVersion` 是選用附加項目。
- 如果你使用的是較舊的 `clawhub` CLI 發行版本，請先升級再發布，讓本機預檢查能在上傳前執行。

#### GitHub Actions

ClawHub 也在
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/2dcaf25d23c4e19b9c14f705c2ce1fd1dc2949c1/.github/workflows/package-publish.yml)
提供給 Plugin 儲存庫使用的官方可重用工作流程。

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

- 可重用工作流程預設將 `source` 設為呼叫端儲存庫。
- 對於 monorepo，請傳入 `source_path`，讓工作流程發布 Plugin 套件資料夾，例如 `source_path: extensions/codex`。
- 將可重用工作流程釘選到穩定標籤或完整提交 SHA。不要從 `@main` 執行發行發布。
- `pull_request` 應使用 `dry_run: true`，讓 CI 保持不產生污染。
- 實際發布應限制在受信任事件，例如 `workflow_dispatch` 或標籤推送。
- 不使用秘密的受信任發布僅適用於 `workflow_dispatch`；標籤推送仍需要 `clawhub_token`。
- 為首次發布、不受信任的套件或緊急發布保留可用的 `clawhub_token`。
- 工作流程會將 JSON 結果上傳為成品，並將其公開為工作流程輸出。

### `sync`

- 掃描本機 Skills 資料夾並發布新增/變更的項目。
- 根可以是任何資料夾：Skills 目錄，或含有 `SKILL.md` 的單一 Skill 資料夾。
- 當 `~/.clawdbot/clawdbot.json` 存在時，自動加入 Clawdbot Skill 根：
  - `agent.workspace/skills`（主要代理）
  - `routing.agents.*.workspace/skills`（每個代理）
  - `~/.clawdbot/skills`（共用）
  - `skills.load.extraDirs`（共用套件組）
- 遵循 `CLAWDBOT_CONFIG_PATH` / `CLAWDBOT_STATE_DIR` 和 `OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR`。
- 旗標：
  - `--root <dir...>` 額外掃描根
  - `--all` 不提示即上傳
  - `--dry-run` 只顯示計畫
  - `--bump patch|minor|major`（預設：patch）
  - `--changelog <text>`（非互動式）
  - `--tags a,b,c`（預設：latest）
  - `--concurrency <n>`（預設：4）

遙測：

- 登入時會在 `sync` 期間傳送，除非設定 `CLAWHUB_DISABLE_TELEMETRY=1`（舊版 `CLAWDHUB_DISABLE_TELEMETRY=1`）。
- 詳情：`docs/telemetry.md`。
