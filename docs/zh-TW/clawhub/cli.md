---
read_when:
    - 使用 ClawHub 命令列介面
    - 偵錯安裝、更新或發布
summary: 命令列介面參考：命令、旗標、設定與鎖定檔行為。
x-i18n:
    generated_at: "2026-07-03T15:19:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 23065775d74e7b52ed250051b8724b780c28dfdfc0adf9b8f115f7133fbdd77b
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

然後驗證它：

```bash
clawhub --help
clawhub login
clawhub whoami
```

## 全域旗標

- `--workdir <dir>`：工作目錄（預設：cwd；若已設定，則退回使用 Clawdbot 工作區）
- `--dir <dir>`：workdir 底下的安裝目錄（預設：`skills`）
- `--site <url>`：瀏覽器登入的基礎 URL（預設：`https://clawhub.ai`）
- `--registry <url>`：API 基礎 URL（預設：探索取得，否則為 `https://clawhub.ai`）
- `--no-input`：停用提示

環境變數對應項：

- `CLAWHUB_SITE`（舊版 `CLAWDHUB_SITE`）
- `CLAWHUB_REGISTRY`（舊版 `CLAWDHUB_REGISTRY`）
- `CLAWHUB_WORKDIR`（舊版 `CLAWDHUB_WORKDIR`）

### HTTP 代理

命令列介面會遵循標準 HTTP 代理環境變數，以支援位於企業代理或受限網路後方的系統：

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

設定這些變數中的任何一個時，命令列介面會透過指定的代理路由對外請求。`HTTPS_PROXY` 用於 HTTPS 請求，`HTTP_PROXY` 用於純 HTTP。`NO_PROXY` / `no_proxy` 會受到遵循，以便特定主機或網域略過代理。

在直接對外連線遭封鎖的系統上，這是必要的（例如 Docker 容器、僅能透過代理上網的 Hetzner VPS、企業防火牆）。

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
- 舊版退回：如果 `clawhub/config.json` 尚不存在但 `clawdhub/config.json` 存在，命令列介面會重用舊版路徑
- 覆寫：`CLAWHUB_CONFIG_PATH`（舊版 `CLAWDHUB_CONFIG_PATH`）

## 命令

### `login` / `auth login`

- 預設：開啟瀏覽器到 `<site>/cli/auth`，並透過 loopback 回呼完成。
- 無介面：`clawhub login --token clh_...`
- 遠端/無介面互動式：`clawhub login --device` 會列印一組代碼，並在你於 `<site>/cli/device` 授權時等待。

### `whoami`

- 透過 `/api/v1/whoami` 驗證已儲存的權杖。

### `token`

- 將已儲存的 API 權杖列印到 stdout。
- 適合將本機登入權杖以管線傳入 CI 秘密設定命令。

### `star <skill>` / `unstar <skill>`

- 從你的精選項目新增/移除一個技能。
- 呼叫 `POST /api/v1/stars/<slug>` 和 `DELETE /api/v1/stars/<slug>`。
- `--yes` 會略過確認。

### `search <query...>`

- 呼叫 `/api/v1/search?q=...`。
- 輸出包含技能 slug、擁有者 handle、顯示名稱與相關性分數。
- 搜尋會先偏好精確的 slug/名稱 token 符合，再考量下載熱門度。像 `map` 這樣獨立的 slug token，比起 `amap` 內的子字串，會更強烈地符合 `personal-map`。
- 熱門度只是小幅的排名先驗，不保證排在最前。
- 如果某個技能應該出現卻沒有出現，請在登入後執行 `clawhub inspect @owner/slug`，先檢查擁有者可見的審核診斷，再重新命名中繼資料。

### `explore`

- 透過 `/api/v1/skills?limit=...&sort=createdAt` 列出最新技能（依 `createdAt` 遞減排序）。
- 旗標：
  - `--limit <n>`（1-200，預設：25）
  - `--sort newest|updated|rating|downloads|trending`（預設：newest）。舊版安裝排序別名仍可用於相容性。
  - `--json`（機器可讀輸出）
- 輸出：`<slug>  v<version>  <age>  <summary>`（摘要截斷為 50 個字元）。

### `inspect @owner/slug`

- 擷取技能中繼資料與版本檔案，但不安裝。
- `--version <version>`：檢查特定版本（預設：latest）。
- `--tag <tag>`：檢查標記版本（例如 `latest`）。
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

- 移除 `<workdir>/<dir>/<slug>` 並刪除 lockfile 項目。
- 登入時會盡力傳送遙測，讓目前安裝數可以停用。
- 互動式：要求確認。
- 非互動式（`--no-input`）：需要 `--yes`。

### `list`

- 讀取 `<workdir>/.clawhub/lock.json`（舊版 `.clawdhub`）。
- 在以 `clawhub pin` 凍結的技能旁顯示 `pinned`，包含選填原因。

### `pin <skill>`

- 在 lockfile 中將已安裝技能標記為已釘選。
- `--reason <text>` 記錄技能為何被凍結。
- 已釘選的技能會被 `update --all` 略過，且直接執行 `update <skill>` 會遭拒。
- 已釘選的技能也會拒絕 `install --force`，避免本機位元組被意外取代。

### `unpin <skill>`

- 從已安裝技能移除 lockfile 釘選，讓未來更新可以修改它。

### `update [@owner/slug]` / `update --all`

- 從本機檔案計算指紋。
- 如果指紋符合已知版本：不提示。
- 如果指紋不符合：
  - 預設拒絕
  - 使用 `--force` 覆寫（若為互動式，則提示）
- 已釘選的技能絕不會被 `--force` 更新。
- `update <skill>` 會對已釘選的技能快速失敗，並告訴你先執行 `clawhub unpin <skill>`。
- `update --all` 會略過已釘選的 slug，並列印哪些項目維持凍結的摘要。

### `skill publish <path>`

- 比較本機 bundle 指紋與 ClawHub；當內容已發布時成功結束。
- 新技能預設為 `1.0.0`；已變更技能預設為下一個 patch 版本。
- `--version <version>` 明確選取版本，即使內容符合現有版本也會發布。
- `--dry-run` 解析發布但不上傳；`--json` 列印機器可讀結果。
- `--owner <handle>` 會在執行者具有發布者存取權時，以 org/user 發布者 handle 發布。
- `--migrate-owner` 會在發布新版本時，將現有技能移到 `--owner`。需要兩個發布者的 admin/owner 存取權。
- 擁有者與審查行為在 `docs/publishing.md` 中說明。
- 發布技能表示它在 ClawHub 上以 `MIT-0` 發行。
- 已發布技能可自由使用、修改與重新散布，無需署名。
- ClawHub 不支援付費技能或依技能計價。
- 舊版別名：`publish <path>`。

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

ClawHub 的可重用
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
工作流程會針對一個 `skill_path` 呼叫 `skill publish`，或針對 `root`（預設：`skills`）底下每個直接的技能資料夾呼叫它。它會略過未變更技能，並使用相同的自動 patch 版本行為。

設定 `dry_run: true` 可在沒有權杖的情況下預覽。實際發布需要 `clawhub_token` secret。

### `sync`

- 掃描目前的 workdir、已設定的 skills 目錄，以及任何 `--root <dir>` 資料夾，尋找包含 `SKILL.md` 或 `skill.md` 的本機技能資料夾。
- 比較每個本機技能指紋與 ClawHub，且只發布新的或已變更的技能。
- 新技能發布為 `1.0.0`；已變更技能預設發布下一個 patch 版本。對於應該移動較大 semver 步階的更新批次，使用 `--bump minor|major`。
- `--dry-run` 顯示發布計畫但不上傳；`--json` 列印機器可讀計畫。
- `--all` 會發布每個新的或已變更的技能而不提示。沒有 `--all` 時，互動式終端會讓你選取要發布的技能。
- `--owner <handle>` 會在執行者具有發布者存取權時，以 org/user 發布者 handle 發布。
- `sync` 只是單向發布。它不會安裝、更新、下載，也不會回報安裝/下載遙測。

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- 需要 `clawhub login`。
- 透過 `POST /api/v1/skills/-/scan` 執行 ClawHub ClawScan，然後輪詢直到掃描進入終止狀態。
- 掃描是非同步的，可能需要一些時間完成。排隊時，終端 spinner 會顯示目前的優先掃描位置，以及前方還有多少掃描。
- 已發布掃描需要擁有權或發布者管理存取權。版主/admin 可以透過 `clawhub-admin` 使用相同後端。
- `--update` 僅能與 `--slug` 搭配使用；它會將成功的已發布掃描結果寫回所選版本。
- `--output <file.zip>` 下載完整報告封存，包含 `manifest.json`、`clawscan.json`、`skillspector.json`、`static-analysis.json`、`virustotal.json` 和 `README.md`。
- `--json` 列印完整輪詢回應以供自動化使用。
- 不再支援本機路徑掃描。請上傳新版本，然後使用 `scan download` 取回該提交版本已儲存的掃描結果。

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- 需要 `clawhub login`。
- 下載已提交技能或外掛版本的已儲存掃描報告 ZIP，包含被 ClawHub 安全檢查封鎖或隱藏的版本。
- 技能下載使用技能 slug，並預設為 `--kind skill`。
- 外掛下載使用 package name，且需要 `--kind plugin`。
- `--version` 是必填，讓作者檢查 ClawHub 封鎖的確切提交版本。
- `--output <file.zip>` 選擇目的地路徑。

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub 在
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/76b4f36bb0f7409ed7cb9c6fd6f1ccf81396ee88/.github/workflows/skill-publish.yml)
提供官方可重用工作流程，適用於技能 repo 與 catalog repo。

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

注意事項：

- `root` 對 catalog repo 預設為 `skills`。
- 傳入 `skill_path: skills/review-helper` 可處理單一技能資料夾。
- `owner` 會對應到命令列介面的 `--owner` 旗標；省略它則以已驗證使用者身分發布。
- V1 技能發布使用 `clawhub_token`；GitHub OIDC 信任發布目前僅適用於 package。

### `delete <skill>`

- 若未使用 `--version`，軟刪除技能（擁有者、版主或管理員）。
- 呼叫 `DELETE /api/v1/skills/{slug}`。
- 由擁有者發起的軟刪除會保留 slug 30 天；命令會列印到期時間。
- `--version <version>` 會透過失敗即關閉、
  版本專屬的路由永久刪除一個已擁有的非最新版本。
  已刪除的版本無法還原或重新發布。刪除目前最新版本前，請先發布替代版本。平台人員不會在此僅限版本的流程中繞過所有權。
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

- 重新命名已擁有的技能，並保留先前的 slug 作為重新導向別名。
- 呼叫 `POST /api/v1/skills/{slug}/rename`。
- `--yes` 會略過確認。

### `skill merge <source> <target>`

- 將一個已擁有的技能合併到另一個已擁有的技能。
- 來源 slug 會停止公開列出，並成為指向目標的重新導向別名。
- 呼叫 `POST /api/v1/skills/{sourceSlug}/merge`。
- `--yes` 會略過確認。

### `transfer`

- 所有權轉移工作流程。
- 轉移給使用者 handle 會建立待處理請求，由接收者接受。
- 轉移給組織/發布者 handle 只有在執行者對目前擁有者與目的地發布者
  都具有管理員存取權時才會立即套用。
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
- 將此用於外掛與其他套件家族項目；頂層 `search` 仍是技能搜尋介面。
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

- 不安裝即可擷取套件中繼資料。
- 將此用於外掛中繼資料、相容性、驗證、來源，以及版本/檔案檢查。
- `--version <version>`：檢查特定版本（預設：latest）。
- `--tag <tag>`：檢查已標記版本（例如 `latest`）。
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
- 對於 ClawPack npm-pack 成品，還會驗證 npm `sha512` integrity、
  npm shasum，以及 tarball 的 `package.json` 名稱/版本。
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

- 計算本機成品的 ClawHub SHA-256、npm `sha512` integrity，以及 npm shasum。
- 搭配 `--package` 時，會從 ClawHub 解析預期中繼資料，並將本機檔案
  與已發布的成品中繼資料比較。
- 搭配直接摘要旗標時，不進行網路查詢即可驗證。
- 旗標：
  - `--package <name>`：用於解析預期成品中繼資料的套件名稱。
  - `--version <version>` 或 `--tag <tag>`：預期套件版本。
  - `--sha256 <hex>`：預期的 ClawHub SHA-256。
  - `--npm-integrity <sri>`：預期的 npm integrity。
  - `--npm-shasum <sha1>`：預期的 npm shasum。
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- 對本機外掛套件
  資料夾執行 ClawHub 命令列介面內建的外掛檢查器。
- 預設為離線/靜態驗證，不會尋找或匯入本機
  OpenClaw checkout。
- 嚴重相容性錯誤會以非零結束碼退出。僅警告的發現會列印但
  以零結束碼退出。
- 旗標：
  - `--out <dir>`：將外掛檢查器報告寫入此目錄。
  - `--openclaw <path>`：針對明確的本機 OpenClaw checkout 檢查。
  - `--runtime`：啟用執行階段擷取；匯入外掛程式碼。
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

- 若未使用 `--version`，軟刪除套件與所有發布版本。
- `--version <version>` 會透過失敗即關閉、
  版本專屬的路由永久刪除一個已擁有的非最新發布版本。
  已刪除的版本無法還原或重新發布。刪除目前最新版本前，請先發布替代版本。此僅限版本的流程需要套件擁有者或組織發布者管理員；平台人員不會繞過套件所有權。
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

- 還原已軟刪除的套件與發布版本。
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
- 需要對目前套件擁有者與目的地
  發布者都具有管理員存取權，除非由平台管理員執行。
- 具範圍的套件名稱必須轉移給相符的範圍擁有者。
- 呼叫 `POST /api/v1/packages/{name}/transfer`。
- 旗標：
  - `--to <owner>`：目的地發布者 handle。
  - `--reason <text>`：選用稽核原因。
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- 用於向版主回報套件的已驗證命令。
- 呼叫 `POST /api/v1/packages/{name}/report`。
- 回報屬於套件層級，可選擇綁定到版本，並會顯示
  給版主審查。
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
- 顯示目前套件掃描狀態、開啟回報數、最新發布版本的人工
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
  以及掃描狀態的阻擋因素。
- 旗標：
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- 顯示套件的操作員導向遷移狀態，該套件可能取代
  內建 OpenClaw 外掛。
- 呼叫與 `package readiness` 相同的計算 readiness 端點，但會列印
  以遷移為焦點的狀態、最新版本、官方套件狀態、檢查，以及
  阻擋因素。
- 旗標：
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- 建立由已驗證使用者擁有的組織發布者。
- handle 會正規化為小寫，且可加上或省略 `@` 傳入。
- 新建立的組織發布者預設不是受信任/官方。
- 如果 handle 已被現有發布者、使用者或保留路由使用，則會失敗。

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- 透過 `POST /api/v1/packages` 發布程式碼外掛或套件包外掛。
- `<source>` 接受：
  - 本機資料夾路徑：`./my-plugin`
  - 本機 ClawPack npm-pack tarball：`./my-plugin-1.2.3.tgz`
  - GitHub repo：`owner/repo` 或 `owner/repo@ref`
  - GitHub URL：`https://github.com/owner/repo`
- 中繼資料會從 `package.json`、`openclaw.plugin.json`，以及
  真正的 OpenClaw 套件包標記自動偵測，例如 `.codex-plugin/plugin.json`、
  `.claude-plugin/plugin.json` 和 `.cursor-plugin/plugin.json`。
- `.tgz` 來源會視為 ClawPack。命令列介面會上傳確切的 npm-pack
  位元組，並只使用解出的 `package/` 內容進行驗證和
  中繼資料預填。
- 程式碼外掛資料夾會在上傳前打包成 ClawPack npm tarball，讓
  OpenClaw 安裝可驗證確切成品。套件包外掛資料夾仍然
  使用解出檔案的發布路徑。
- 對於 GitHub 來源，來源歸屬會從 repo、解析後的 commit、ref 和子路徑自動填入。
- 對於本機資料夾，當 origin remote 指向 GitHub 時，來源歸屬會從本機 git 自動偵測。
- 外部程式碼外掛必須明確宣告 `openclaw.compat.pluginApi` 和
  `openclaw.build.openclawVersion`。
  頂層 `package.json.version` 不會作為發布驗證的後備值。
- `--dry-run` 會預覽解析後的發布 payload，而不會上傳。
- `--json` 會為 CI 輸出機器可讀的結果。
- `--owner <handle>` 會在執行者有發布者存取權時，以使用者或組織發布者 handle 發布。
- Scoped 套件名稱必須符合選取的擁有者。請參閱 `docs/publishing.md`。
- 既有旗標（`--family`、`--name`、`--version`、`--source-repo`、`--source-commit`、`--source-ref`、`--source-path`）仍可作為覆寫值使用。
- 私有 GitHub repo 需要 `GITHUB_TOKEN`。

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### 建議的本機流程

先使用 `--dry-run`，以便在建立正式發布前確認解析後的套件中繼資料和
來源歸屬：

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### 本機資料夾流程

對於程式碼外掛，資料夾發布會從
套件資料夾建置並上傳 ClawPack 成品：

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `--family code-plugin` 的最小 `package.json`

外部程式碼外掛需要在
`package.json` 中提供少量 OpenClaw 中繼資料。這個最小 manifest 足以成功發布：

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

- `package.json.version` 是你的套件發布版本，但不會作為
  OpenClaw 相容性／建置驗證的後備值。
- `openclaw.hostTargets` 和 `openclaw.environment` 是選用中繼資料。
  ClawHub 可能會在它們存在時顯示，但發布時並不需要。
- `openclaw.compat.minGatewayVersion` 和
  `openclaw.build.pluginSdkVersion` 是選用額外項目，若你想發布
  更詳細的相容性中繼資料可使用它們。
- 如果你使用較舊的 `clawhub` 命令列介面版本，請先升級再發布，讓
  本機預檢能在上傳前執行。
- 如果驗證回報修復程式碼，請參閱
  [外掛驗證修復](/zh-TW/clawhub/plugin-validation-fixes)。

#### GitHub Actions

ClawHub 也提供官方可重用 workflow，位置在
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/76b4f36bb0f7409ed7cb9c6fd6f1ccf81396ee88/.github/workflows/package-publish.yml)，
供外掛 repo 使用。

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

- 可重用 workflow 預設會將 `source` 設為呼叫端 repo。
- 對於 monorepo，傳入 `source_path`，讓 workflow 發布外掛
  套件資料夾，例如 `source_path: extensions/codex`。
- 將可重用 workflow 固定到穩定標籤或完整 commit SHA。不要從 `@main` 執行發布。
- `pull_request` 應使用 `dry_run: true`，讓 CI 保持不造成污染。
- 真正的發布應限制在受信任事件，例如 `workflow_dispatch` 或標籤推送。
- 不使用 secret 的受信任發布只適用於 `workflow_dispatch`；標籤推送仍需要 `clawhub_token`。
- 保留 `clawhub_token`，供首次發布、不受信任套件或緊急發布使用。
- workflow 會將 JSON 結果上傳為成品，並將其公開為 workflow 輸出。

### `package trusted-publisher get <name>`

- 顯示套件的 GitHub Actions 受信任發布者設定。
- 設定 config 後，使用此命令確認儲存庫、workflow 檔名，
  以及選用的環境釘選。
- 旗標：
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- 為既有
  套件附加或替換 GitHub Actions 受信任發布者設定。
- 套件必須先透過一般手動或 token 驗證的
  `clawhub package publish` 建立。
- 設定 config 後，未來支援的 GitHub Actions 發布可使用
  OIDC／受信任發布，而不需要長期有效的 ClawHub token。
- `--repository <repo>` 必須是 `owner/repo`。
- `--workflow-filename <file>` 必須符合
  `.github/workflows/` 中的 workflow 檔案名稱。
- `--environment <name>` 是選用項目。設定後，OIDC claim 中的 GitHub Actions
  環境必須完全相符。
- ClawHub 會在執行此命令時驗證已設定的 GitHub 儲存庫。
  公開儲存庫可透過公開 GitHub 中繼資料驗證。私有
  儲存庫需要 ClawHub 擁有該儲存庫的 GitHub 存取權，
  例如透過未來的 ClawHub GitHub App 安裝或其他已授權的
  GitHub 整合。
- 旗標：
  - `--repository <repo>`：GitHub 儲存庫，例如 `openclaw/example-plugin`。
  - `--workflow-filename <file>`：workflow 檔案名稱，例如 `package-publish.yml`。
  - `--environment <name>`：選用的精確相符 GitHub Actions 環境。
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
- 如果 workflow、儲存庫或環境釘選需要
  停用或重新建立，請使用此命令作為回復。
- 未來真正的發布必須使用一般已驗證發布，直到再次設定 config。
- 旗標：
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### 安裝遙測

- 登入後執行 `clawhub install <slug>` 時會傳送，除非
  已設定 `CLAWHUB_DISABLE_TELEMETRY=1`。
- 回報採盡力而為。若遙測無法使用，安裝命令不會失敗。
- 詳細資訊：`docs/telemetry.md`。
