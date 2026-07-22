---
read_when:
    - 使用 ClawHub 命令列介面
    - 偵錯安裝、更新或發布問題
summary: 命令列介面參考：命令、旗標、設定與鎖定檔行為。
x-i18n:
    generated_at: "2026-07-22T10:27:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1c2f1132f9863f958bcf5955b6d3dc0d99b3743fe0ef2eaf2d08207efb7a3f90
    source_path: clawhub/cli.md
    workflow: 16
---

# 命令列介面

命令列介面套件：`clawhub`，二進位檔：`clawhub`。

使用 npm 或 pnpm 全域安裝：

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

- `--workdir <dir>`：工作目錄（預設：cwd；若已設定，則退回使用 Clawdbot 工作區）
- `--dir <dir>`：workdir 下的安裝目錄（預設：`skills`）
- `--site <url>`：瀏覽器登入的基礎 URL（預設：`https://clawhub.ai`）
- `--registry <url>`：API 基礎 URL（預設：探索取得，否則為 `https://clawhub.ai`）
- `--no-input`：停用提示

對應的環境變數：

- `CLAWHUB_SITE`（舊版 `CLAWDHUB_SITE`）
- `CLAWHUB_REGISTRY`（舊版 `CLAWDHUB_REGISTRY`）
- `CLAWHUB_WORKDIR`（舊版 `CLAWDHUB_WORKDIR`）

### HTTP Proxy

命令列介面會遵循標準 HTTP Proxy 環境變數，適用於位於
企業 Proxy 或受限網路後方的系統：

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

設定其中任一變數時，命令列介面會透過
指定的 Proxy 路由對外請求。HTTPS 請求使用 `HTTPS_PROXY`，純 HTTP
使用 `HTTP_PROXY`。系統會遵循 `NO_PROXY` / `no_proxy`，讓
特定主機或網域略過 Proxy。

在直接對外連線遭封鎖的系統上，這是必要設定
（例如 Docker 容器、僅能透過 Proxy 連上網際網路的 Hetzner VPS、企業
防火牆）。

範例：

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

未設定 Proxy 變數時，行為維持不變（直接連線）。

## 設定檔

儲存你的 API Token 與快取的登錄庫 URL。

- macOS：`~/Library/Application Support/clawhub/config.json`
- Linux/XDG：`$XDG_CONFIG_HOME/clawhub/config.json` 或 `~/.config/clawhub/config.json`
- Windows：`%APPDATA%\\clawhub\\config.json`
- 舊版退回機制：若 `clawhub/config.json` 尚不存在，但 `clawdhub/config.json` 存在，命令列介面會沿用舊版路徑
- 覆寫：`CLAWHUB_CONFIG_PATH`（舊版 `CLAWDHUB_CONFIG_PATH`）

## 命令

### `login` / `auth login`

- 預設：開啟瀏覽器前往 `<site>/cli/auth`，並透過迴送回呼完成。
- 無頭模式：`clawhub login --token clh_...`
- 遠端／無頭互動模式：`clawhub login --device` 會印出代碼，並在你於 `<site>/cli/device` 完成授權期間等待。

### `whoami`

- 透過 `/api/v1/whoami` 驗證已儲存的 Token。

### `token`

- 將已儲存的 API Token 輸出至 stdout。
- 適合透過管線將本機登入 Token 傳入 CI Secret 設定命令。

### `star <skill>` / `unstar <skill>`

- 將 Skill 加入你的精選項目或從中移除。
- 呼叫 `POST /api/v1/stars/<slug>` 和 `DELETE /api/v1/stars/<slug>`。
- `--yes` 會略過確認。

### `search <query...>`

- 呼叫 `/api/v1/search?q=...`。
- 輸出包含 Skill Slug、擁有者 Handle、顯示名稱與相關性分數。
- 搜尋排序會先偏好完全符合 Slug／名稱 Token 的結果，再考量下載熱門度。獨立的 Slug Token（例如 `map`）與 `personal-map` 的符合程度，會高於其作為 `amap` 內子字串時的符合程度。
- 熱門度僅是小幅影響排名的先驗因素，不保證會排在最前面。
- 若某個 Skill 理應出現卻未顯示，請在登入狀態下執行 `clawhub inspect @owner/slug`，先查看擁有者可見的審核診斷資訊，再重新命名中繼資料。

### `explore`

- 透過 `/api/v1/skills?limit=...&sort=createdAt` 列出最新的 Skills（依 `createdAt` 降冪排序）。
- 旗標：
  - `--limit <n>`（1-200，預設：25）
  - `--sort newest|updated|rating|downloads|trending`（預設：最新）。為維持相容性，舊版安裝排序別名仍可使用。
  - `--json`（機器可讀的輸出）
- 輸出：`<slug>  v<version>  <age>  <summary>`（摘要截斷為 50 個字元）。

### `inspect @owner/slug`

- 擷取 Skill 中繼資料與版本檔案，但不進行安裝。
- `--version <version>`：檢查特定版本（預設：最新版）。
- `--tag <tag>`：檢查具有標籤的版本（例如 `latest`）。
- `--versions`：列出版本記錄（第一頁）。
- `--limit <n>`：可列出的版本數上限（1-200）。
- `--files`：列出所選版本的檔案。
- `--file <path>`：擷取原始檔案位元組（上限 10MB）。
- `--json`：機器可讀的輸出；`--file` 會在可用時包含以 base64 表示的確切位元組與 UTF-8 文字。

### `install @owner/slug`

- 解析指定擁有者與 Skill 的最新版本。
- 透過 `/api/v1/download` 下載 zip。
- 解壓縮至 `<workdir>/<dir>/<slug>`。
- 拒絕覆寫已釘選的 Skills；請先執行 `clawhub unpin <skill>`。
- 寫入：
  - `<workdir>/.clawhub/lock.json`（舊版 `.clawdhub`）
  - `<skill>/.clawhub/origin.json`（舊版 `.clawdhub`）

### `uninstall <skill>`

- 移除 `<workdir>/<dir>/<slug>`，並刪除鎖定檔中的項目。
- 登入時會盡力傳送遙測資料，以便停用目前的
  安裝計數。
- 互動模式：要求確認。
- 非互動模式（`--no-input`）：需要 `--yes`。

### `list`

- 讀取 `<workdir>/.clawhub/lock.json`（舊版 `.clawdhub`）。
- 在使用 `clawhub pin` 凍結的 Skills 旁顯示 `pinned`，包括選填的原因。

### `pin <skill>`

- 在鎖定檔中將已安裝的 Skill 標記為已釘選。
- `--reason <text>` 會記錄凍結 Skill 的原因。
- `update --all` 會略過已釘選的 Skills，直接執行 `update <skill>` 時也會遭拒。
- 已釘選的 Skills 也會拒絕 `install --force`，避免意外取代本機位元組。

### `unpin <skill>`

- 從已安裝 Skill 的鎖定檔中移除釘選，讓後續更新可修改它。

### `update [@owner/slug]` / `update --all`

- 根據本機檔案計算指紋。
- 若指紋與已知版本相符：不顯示提示。
- 若指紋不符：
  - 預設拒絕
  - 使用 `--force` 覆寫（若為互動模式，則顯示提示）
- `--force` 絕不會更新已釘選的 Skills。
- 對已釘選的 Skills，`update <skill>` 會快速失敗，並告知你先執行 `clawhub unpin <skill>`。
- `update --all` 會略過已釘選的 Slug，並印出仍保持凍結項目的摘要。

### `skill publish <path>`

- 將本機套件組合指紋與 ClawHub 比較；若內容已發布，
  則成功結束。
- 新 Skills 預設使用 `1.0.0`；已變更的 Skills 預設使用下一個修補
  版本。
- `--version <version>` 會明確選取版本，且即使
  內容與現有版本相符仍會發布。
- `--dry-run` 會在不進行上傳的情況下解析發布作業；`--json` 會印出
  機器可讀的結果。
- 當執行者具有發布者存取權時，`--owner <handle>` 會以組織／使用者發布者 Handle
  進行發布。
- `--migrate-owner` 會在發布新
  版本的同時，將現有 Skill 移至 `--owner`。需要兩個發布者的管理員／擁有者存取權。
- 擁有者與審查行為請參閱 `docs/publishing.md`。
- 發布 Skill 表示它會在 ClawHub 上依 `MIT-0` 授權條款釋出。
- 已發布的 Skills 可免費使用、修改及重新散布，且無須標示出處。
- ClawHub 不支援付費 Skills 或個別 Skill 定價。
- 舊版別名：`publish <path>`。

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

ClawHub 的可重複使用
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
工作流程會為一個 `skill_path` 呼叫 `skill publish`，或對 `root` 下的每個直接 Skill
資料夾呼叫（預設：`skills`）。它會略過未變更的 Skills，並使用
相同的自動修補版本行為。

設定 `dry_run: true` 可在沒有 Token 的情況下預覽。實際發布需要
`clawhub_token` Secret。

### `sync`

- 掃描目前的 workdir、已設定的 Skills 目錄，以及任何
  `--root <dir>` 資料夾，尋找包含 `SKILL.md` 或
  `skill.md` 的本機 Skill 資料夾。
- 將每個本機 Skill 指紋與 ClawHub 比較，僅發布新增或
  已變更的 Skills。
- 新 Skills 會發布為 `1.0.0`；已變更的 Skills 預設發布下一個修補版本。若更新批次
  應提升較大的語意化版本幅度，請使用 `--bump minor|major`。
- `--dry-run` 會顯示發布計畫而不上傳；`--json` 會印出
  機器可讀的計畫。
- `--all` 會直接發布每個新增或已變更的 Skill，不顯示提示。在未使用
  `--all` 時，互動式終端機可讓你選取要發布的 Skills。
- 當執行者具有發布者存取權時，`--owner <handle>` 會以組織／使用者發布者 Handle
  進行發布。
- `sync` 僅進行單向發布。它不會安裝、更新、下載，也不會
  回報安裝／下載遙測資料。

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- 需要 `clawhub login`。
- 透過 `POST /api/v1/skills/-/scan` 執行 ClawHub ClawScan，接著輪詢直到掃描進入終止狀態。
- 掃描以非同步方式執行，可能需要一段時間才能完成。排隊期間，終端機微調按鈕會顯示目前的優先掃描順位，以及前方有多少項掃描。
- 掃描已發布內容需要擁有權或發布者管理存取權。版主／管理員可透過 `clawhub-admin` 使用相同的後端。
- `--update` 僅能與 `--slug` 搭配使用；它會將成功的已發布掃描結果寫回所選版本。
- `--output <file.zip>` 會下載完整的報告封存檔，其中包含 `manifest.json`、`clawscan.json`、`skillspector.json`、`static-analysis.json`、`virustotal.json` 和 `README.md`。
- `--json` 會印出完整的輪詢回應，以供自動化使用。
- 已不再支援本機路徑掃描。請上傳新版本，接著使用 `scan download` 擷取該已提交版本所儲存的掃描結果。

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- 需要 `clawhub login`。
- 下載已提交 Skill 或外掛版本所儲存的掃描報告 ZIP，包括遭 ClawHub 安全性檢查封鎖或隱藏的版本。
- Skill 下載使用 Skill slug，預設為 `--kind skill`。
- 外掛下載使用套件名稱，且需要 `--kind plugin`。
- 需要 `--version`，以便作者檢查遭 ClawHub 封鎖的確切提交版本。
- `--output <file.zip>` 選擇目的地路徑。

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub 在
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/89f5e62ef70e038319ec37dcf9f6dcd37b66dc65/.github/workflows/skill-publish.yml)
提供官方可重複使用的工作流程，供 Skill 儲存庫和目錄儲存庫使用。

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

- 對於目錄儲存庫，`root` 預設為 `skills`。
- 傳入 `skill_path: skills/review-helper` 以處理一個 Skill 資料夾。
- `owner` 對應至命令列介面的 `--owner` 旗標；若要以已驗證身分的使用者發布，請省略此項。
- V1 Skill 發布使用 `clawhub_token`；GitHub OIDC 受信任發布目前僅適用於套件。

### `delete <skill>`

- 未指定 `--version` 時，軟刪除 Skill（擁有者、版主或管理員）。
- 呼叫 `DELETE /api/v1/skills/{slug}`。
- 由擁有者發起的軟刪除會保留 slug 30 天；命令會印出到期時間。
- `--version <version>` 透過採取失敗即關閉策略的版本專屬路由，撤回一個由其擁有且非最新的版本。版本號仍會保留，且無法以不同內容重新發布。刪除目前的最新版本前，請先發布替代版本。平台工作人員不會在此僅限版本的流程中略過擁有權檢查。
- `--reason <text>` 會在整個 Skill 的軟刪除記錄和稽核日誌中記錄管理備註。
- `--note <text>` 是 `--reason` 的別名。
- `--yes` 會略過確認。

### `undelete <skill>`

- 還原隱藏的 Skill（擁有者、版主或管理員）。
- 呼叫 `POST /api/v1/skills/{slug}/undelete`。
- `--version <version>` 僅還原先前由同一擁有者執行者撤回並保留的確切成品。它不會將還原的版本設為最新版本，也不會重新建立已移除的標籤。
- 版本還原會呼叫 `POST /api/v1/skills/{slug}/versions/{version}/restore`。
- `--reason <text>` 會在 Skill 和稽核日誌中記錄管理備註。
- `--note <text>` 是 `--reason` 的別名。
- `--yes` 會略過確認。

### `hide <skill>`

- 隱藏 Skill（擁有者、版主或管理員）。
- `delete` 的別名。

### `unhide <skill>`

- 取消隱藏 Skill（擁有者、版主或管理員）。
- `undelete` 的別名。

### `skill rename <skill> <new-name>`

- 重新命名擁有的 Skill，並將先前的 slug 保留為重新導向別名。
- 呼叫 `POST /api/v1/skills/{slug}/rename`。
- `--yes` 會略過確認。

### `skill merge <source> <target>`

- 將一個擁有的 Skill 合併至另一個擁有的 Skill。
- 來源 slug 將停止公開列出，並成為指向目標的重新導向別名。
- 呼叫 `POST /api/v1/skills/{sourceSlug}/merge`。
- `--yes` 會略過確認。

### `transfer`

- 擁有權移轉工作流程。
- 移轉至使用者控制代碼時，會建立待處理的請求，由接收者接受。
- 只有當執行者同時具有目前擁有者與目的地發布者的管理員存取權時，移轉至組織／發布者控制代碼才會立即生效。
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
- 將此功能用於外掛和其他套件系列項目；頂層 `search` 仍是 Skill 搜尋介面。
- 旗標：
  - `--family skill|code-plugin|bundle-plugin`
  - `--official`
  - `--executes-code`
  - `--target <target>`、`--os <os>`、`--arch <arch>`、`--libc <libc>`
  - `--requires-browser`、`--requires-desktop`、`--requires-native-deps`
  - `--requires-external-service`、`--external-service <name>`
  - `--binary <name>`、`--os-permission <name>`
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

- 擷取套件中繼資料而不安裝。
- 使用此功能檢查外掛中繼資料、相容性、驗證、來源，以及版本／檔案。
- `--version <version>`：檢查特定版本（預設值：最新版本）。
- `--tag <tag>`：檢查已加標籤的版本（例如 `latest`）。
- `--versions`：列出版本歷程記錄（第一頁）。
- `--limit <n>`：要列出的版本數上限（1-100）。
- `--files`：列出所選版本的檔案。
- `--file <path>`：擷取有界限的 UTF-8 文字預覽（上限 200KB）。
- `--json`：機器可讀輸出。

### `package download <name>`

- 透過 `GET /api/v1/packages/{name}/versions/{version}/artifact` 解析套件版本。
- 從解析器的 `downloadUrl` 下載成品。
- 驗證所有成品的 ClawHub SHA-256。
- 對於 ClawPack npm-pack 成品，也會驗證 npm `sha512` 完整性、npm shasum，以及 tarball 的 `package.json` 名稱／版本。
- 舊版 ZIP 版本會透過舊版 ZIP 路由下載。
- 旗標：
  - `--version <version>`：下載特定版本。
  - `--tag <tag>`：下載已加標籤的版本（預設值：`latest`）。
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
- 搭配 `--package` 時，會從 ClawHub 解析預期的中繼資料，並將本機檔案與已發布的成品中繼資料進行比較。
- 搭配直接摘要旗標時，無須查詢網路即可驗證。
- 旗標：
  - `--package <name>`：用於解析預期成品中繼資料的套件名稱。
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

- 針對本機外掛套件資料夾執行 ClawHub 命令列介面隨附的外掛檢查器。
- 預設執行離線／靜態驗證，不會尋找或匯入本機 OpenClaw 簽出。
- 嚴重相容性錯誤會以非零狀態結束。只有警告的發現會印出，但會以零狀態結束。
- 旗標：
  - `--out <dir>`：將外掛檢查器報告寫入此目錄。
  - `--openclaw <path>`：針對明確指定的本機 OpenClaw 簽出進行檢查。
  - `--runtime`：啟用執行階段擷取；會匯入外掛程式碼。
  - `--allow-execute`：允許在隔離工作區中擷取執行階段。
  - `--no-mock-sdk`：在執行階段擷取期間停用模擬的 OpenClaw SDK。
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package validate ./example-plugin
```

如果驗證回報套件、資訊清單、SDK 匯入或成品發現，請參閱
[外掛驗證修正](/zh-TW/clawhub/plugin-validation-fixes)，然後重新執行命令。

### `package delete <name>`

- 未指定 `--version` 時，軟刪除套件及其所有發行版本。
- `--version <version>` 透過採取失敗即關閉策略的版本專屬路由，撤回一個由其擁有且非最新的發行版本。版本號仍會保留，且無法以不同內容重新發布。刪除目前的最新版本前，請先發布替代版本。此僅限版本的流程需要套件擁有者或組織發布者管理員；平台工作人員不會略過套件擁有權檢查。
- 整個套件的軟刪除需要套件擁有者、組織發布者擁有者／管理員、平台版主或平台管理員。
- 旗標：
  - `--version <version>`：撤回一個非最新版本。
  - `--yes`：略過確認。
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- 還原軟刪除的套件及發行版本。
- 需要套件擁有者、組織發布者擁有者／管理員、平台版主或平台管理員。
- 呼叫 `POST /api/v1/packages/{name}/undelete`。
- `--version <version>` 僅還原先前由同一擁有者執行者撤回並保留的確切發行成品。它不會將該發行版本設為最新版本，也不會重新建立已移除的套件標籤／dist-tag。
- 版本還原會呼叫 `POST /api/v1/packages/{name}/versions/{version}/restore`。
- 旗標：
  - `--version <version>`：還原一個由擁有者撤回的發行版本。
  - `--yes`：略過確認。
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- 將套件移轉給另一個發佈者。
- 需要同時具備目前套件擁有者與目的地發佈者的管理員存取權，
  除非由平台管理員執行。
- 限定範圍的套件名稱必須移轉給相符的範圍擁有者。
- 呼叫 `POST /api/v1/packages/{name}/transfer`。
- 旗標：
  - `--to <owner>`：目的地發佈者代號。
  - `--reason <text>`：選用的稽核原因。
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- 用於向仲裁人員檢舉套件的已驗證命令。
- 呼叫 `POST /api/v1/packages/{name}/report`。
- 檢舉以套件為單位，可選擇關聯至特定版本，並會顯示給
  仲裁人員審查。
- 檢舉本身不會自動隱藏套件或封鎖下載。
- 旗標：
  - `--version <version>`：要附加至檢舉的選用套件版本。
  - `--reason <text>`：必填的檢舉原因。
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "可疑的原生承載內容"
```

### `package moderation-status`

- 用於檢查套件仲裁可見性的擁有者命令。
- 呼叫 `GET /api/v1/packages/{name}/moderation`。
- 顯示目前套件掃描狀態、未結檢舉數量、最新版本的人工
  仲裁狀態、下載封鎖狀態，以及仲裁原因。
- 旗標：
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- 檢查套件是否已準備好供 OpenClaw 未來使用。
- 呼叫 `GET /api/v1/packages/{name}/readiness`。
- 回報正式狀態、ClawPack 可用性、成品摘要、
  來源溯源、OpenClaw 相容性、主機目標、環境中繼資料
  及掃描狀態的阻礙因素。
- 旗標：
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- 針對可能取代 OpenClaw 內建外掛的套件，顯示面向維運人員的
  遷移狀態。
- 呼叫與 `package readiness` 相同的計算式就緒狀態端點，但會列印
  聚焦於遷移的狀態、最新版本、正式套件狀態、檢查項目及
  阻礙因素。
- 旗標：
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- 建立由已驗證使用者擁有的組織發佈者。
- 代號會正規化為小寫，傳入時可包含或省略 `@`。
- 新建立的組織發佈者預設不受信任，也不是正式發佈者。
- 若代號已由現有發佈者、使用者或保留路由使用，則會失敗。

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- 透過 `POST /api/v1/packages` 發佈程式碼外掛或套件組合外掛。
- `<source>` 接受：
  - 本機資料夾路徑：`./my-plugin`
  - 本機 ClawPack npm-pack tarball：`./my-plugin-1.2.3.tgz`
  - GitHub 儲存庫：`owner/repo` 或 `owner/repo@ref`
  - GitHub URL：`https://github.com/owner/repo`
- 中繼資料會從 `package.json`、`openclaw.plugin.json` 以及
  真正的 OpenClaw 套件組合標記自動偵測，例如 `.codex-plugin/plugin.json`、
  `.claude-plugin/plugin.json` 和 `.cursor-plugin/plugin.json`。
- `.tgz` 來源會被視為 ClawPack。命令列介面會上傳完全相同的 npm-pack
  位元組，並僅使用解壓後的 `package/` 內容進行驗證及
  預先填入中繼資料。
- 程式碼外掛資料夾會在上傳前封裝成 ClawPack npm tarball，讓
  OpenClaw 安裝程序能驗證完全相同的成品。套件組合外掛資料夾仍會
  使用解壓檔案發佈路徑。
- 對 GitHub 來源而言，來源歸屬資訊會從儲存庫、解析後的提交、參照及子路徑自動填入。
- 對本機資料夾而言，若來源遠端指向 GitHub，來源歸屬資訊會從本機 git 自動偵測。
- 外部程式碼外掛必須明確宣告 `openclaw.compat.pluginApi` 和
  `openclaw.build.openclawVersion`。
  頂層 `package.json.version` 不會作為發佈驗證的備用值。
- `--dry-run` 會預覽解析後的發佈承載內容，而不上傳。
- `--json` 會輸出供 CI 使用的機器可讀結果。
- 當執行者具有發佈者存取權時，`--owner <handle>` 會以使用者或組織發佈者代號發佈。
- 限定範圍的套件名稱必須與所選擁有者相符。請參閱 `docs/publishing.md`。
- 現有旗標（`--family`、`--name`、`--version`、`--source-repo`、`--source-commit`、`--source-ref`、`--source-path`）仍可作為覆寫值使用。
- 私人 GitHub 儲存庫需要 `GITHUB_TOKEN`。

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### 建議的本機流程

請先使用 `--dry-run`，以便在建立實際版本前確認解析後的套件中繼資料及
來源歸屬資訊：

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### 本機資料夾流程

對程式碼外掛而言，從資料夾發佈會以套件資料夾建置並上傳 ClawPack 成品：

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `--family code-plugin` 的最小 `package.json`

外部程式碼外掛需要在 `package.json` 中加入少量 OpenClaw 中繼資料。
以下最小資訊清單足以成功發佈：

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
  OpenClaw 相容性／建置驗證的備用值。
- `openclaw.hostTargets` 和 `openclaw.environment` 是選用的中繼資料。
  ClawHub 可能會在它們存在時顯示這些資料，但發佈並不要求這些資料。
- `openclaw.compat.minGatewayVersion` 和
  `openclaw.build.pluginSdkVersion` 是選用的額外項目，適合用於發佈
  更詳細的相容性中繼資料。
- 如果你使用較舊的 `clawhub` 命令列介面版本，請在發佈前升級，
  以便在上傳前執行本機預先檢查。
- 如果驗證回報修復代碼，請參閱
  [外掛驗證修正](/zh-TW/clawhub/plugin-validation-fixes)。

#### GitHub Actions

ClawHub 也在
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/89f5e62ef70e038319ec37dcf9f6dcd37b66dc65/.github/workflows/package-publish.yml)
提供正式的可重複使用工作流程，供外掛儲存庫使用。

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
- 對 monorepo，請傳入 `source_path`，讓工作流程發佈外掛
  套件資料夾，例如 `source_path: extensions/codex`。
- 請將可重複使用工作流程固定至穩定標籤或完整提交 SHA。請勿從 `@main` 執行版本發佈。
- `pull_request` 應使用 `dry_run: true`，確保 CI 不會產生污染。
- 實際發佈應僅限於 `workflow_dispatch` 或標籤推送等受信任事件。
- 不使用祕密的受信任發佈僅適用於 `workflow_dispatch`；標籤推送仍需要 `clawhub_token`。
- 請保留 `clawhub_token`，以供首次發佈、不受信任的套件或緊急發佈使用。
- 工作流程會將 JSON 結果上傳為成品，並將其公開為工作流程輸出。

### `package trusted-publisher get <name>`

- 顯示套件的 GitHub Actions 受信任發佈者設定。
- 設定完成後，請使用此命令確認儲存庫、工作流程檔名
  及選用的環境固定值。
- 旗標：
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- 為現有套件附加或取代 GitHub Actions 受信任發佈者設定。
- 必須先透過一般手動或使用權杖驗證的
  `clawhub package publish` 建立套件。
- 設定完成後，未來受支援的 GitHub Actions 發佈可使用
  OIDC／受信任發佈，而不需要長效 ClawHub 權杖。
- `--repository <repo>` 必須是 `owner/repo`。
- `--workflow-filename <file>` 必須與
  `.github/workflows/` 中的工作流程檔名相符。
- `--environment <name>` 是選用項目。設定後，OIDC 宣告中的
  GitHub Actions 環境必須完全相符。
- 執行此命令時，ClawHub 會驗證設定的 GitHub 儲存庫。
  公開儲存庫可透過公開 GitHub 中繼資料驗證。私人
  儲存庫則需要 ClawHub 擁有該儲存庫的 GitHub 存取權，
  例如透過未來安裝的 ClawHub GitHub App，或其他已授權的
  GitHub 整合。
- 旗標：
  - `--repository <repo>`：GitHub 儲存庫，例如 `openclaw/example-plugin`。
  - `--workflow-filename <file>`：工作流程檔名，例如 `package-publish.yml`。
  - `--environment <name>`：選用的完全相符 GitHub Actions 環境。
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- 移除套件的受信任發佈者設定。
- 若需要停用或重新建立工作流程、儲存庫或環境固定值，
  請將此命令用於復原。
- 在重新設定之前，未來的實際發佈都必須使用一般的已驗證發佈。
- 旗標：
  - `--json`：機器可讀輸出。

範例：

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### 安裝遙測

- 登入後，會在 `clawhub install <slug>` 之後傳送，除非
  已設定 `CLAWHUB_DISABLE_TELEMETRY=1`。
- 回報採盡力而為。遙測無法使用時，安裝命令不會失敗。
- 詳細資訊：`docs/telemetry.md`。
