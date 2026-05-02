---
read_when:
    - 搜尋、安裝或更新 Skills 或 Plugin
    - 將 Skills 或 Plugin 發布到登錄庫
    - 設定 ClawHub CLI 或其環境覆寫
sidebarTitle: ClawHub
summary: ClawHub：OpenClaw Skills 和 Plugin 的公開註冊庫、原生安裝流程，以及 clawhub CLI
title: ClawHub
x-i18n:
    generated_at: "2026-05-02T03:00:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: b23214ee75ddf0d0c741a43cb3b40cbcd433b9288038184b7126ab9d4daad228
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub 是 **OpenClaw Skills 和 Plugin** 的公開註冊庫。

- 使用原生 `openclaw` 命令來搜尋、安裝和更新 Skills，並從 ClawHub 安裝 Plugin。
- 使用獨立的 `clawhub` CLI 進行註冊庫驗證、發布、刪除/取消刪除，以及同步工作流程。

網站：[clawhub.ai](https://clawhub.ai)

## 快速開始

<Steps>
  <Step title="搜尋">
    ```bash
    openclaw skills search "calendar"
    ```
  </Step>
  <Step title="安裝">
    ```bash
    openclaw skills install <skill-slug>
    ```
  </Step>
  <Step title="使用">
    啟動新的 OpenClaw 工作階段；它會取得新的 Skill。
  </Step>
  <Step title="發布（選用）">
    若要使用已通過註冊庫驗證的工作流程（發布、同步、管理），請安裝
    獨立的 `clawhub` CLI：

    ```bash
    npm i -g clawhub
    # or
    pnpm add -g clawhub
    ```

  </Step>
</Steps>

## 原生 OpenClaw 流程

<Tabs>
  <Tab title="Skills">
    ```bash
    openclaw skills search "calendar"
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    原生 `openclaw` 命令會安裝到你的作用中工作區，並保留來源中繼資料，
    讓後續的 `update` 呼叫能持續使用 ClawHub。

  </Tab>
  <Tab title="Plugin">
    ```bash
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    純 npm 安全的 Plugin 規格也會先嘗試對 ClawHub 解析，再使用 npm：

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    如果你只想使用 npm 解析而不查詢 ClawHub，請使用 `npm:<package>`：

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    Plugin 安裝會在封存檔安裝執行前，驗證公開宣告的 `pluginApi` 和
    `minGatewayVersion` 相容性，因此不相容的主機會及早安全地中止，
    而不是部分安裝套件。當套件版本發布 ClawPack 成品時，
    OpenClaw 會優先使用該成品，驗證 ClawHub 摘要標頭和下載位元組，
    並記錄 ClawPack 摘要中繼資料以供後續更新使用。沒有 ClawPack
    中繼資料的舊套件版本仍會使用舊版套件封存檔驗證路徑。

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` 只接受可安裝的 Plugin 家族。
如果 ClawHub 套件實際上是 Skill，OpenClaw 會停止並改為指引你使用
`openclaw skills install <slug>`。

匿名 ClawHub Plugin 安裝也會對私人套件安全地中止。
社群或其他非官方通道仍可安裝，但 OpenClaw 會發出警告，讓操作員能在啟用前
檢查來源和驗證。
</Note>

## ClawHub 是什麼

- OpenClaw Skills 和 Plugin 的公開註冊庫。
- Skill 套件組合和中繼資料的版本化儲存區。
- 用於搜尋、標籤和使用訊號的探索介面。

典型的 Skill 是版本化的檔案套件組合，其中包含：

- 一個含主要描述和用法的 `SKILL.md` 檔案。
- Skill 使用的選用設定、腳本或支援檔案。
- 標籤、摘要和安裝需求等中繼資料。

ClawHub 使用中繼資料來支援探索，並安全地公開 Skill 能力。
註冊庫會追蹤使用訊號（星標、下載次數）以改善排名和能見度。
每次發布都會建立新的語意化版本，且註冊庫會保留版本歷史，
讓使用者可以稽核變更。

## 工作區與 Skill 載入

獨立的 `clawhub` CLI 也會將 Skills 安裝到你目前工作目錄下的 `./skills`。
如果已設定 OpenClaw 工作區，除非你覆寫 `--workdir`（或 `CLAWHUB_WORKDIR`），
否則 `clawhub` 會回退使用該工作區。OpenClaw 會從
`<workspace>/skills` 載入工作區 Skills，並在**下一個**工作階段取得它們。

如果你已經使用 `~/.openclaw/skills` 或內建 Skills，工作區
Skills 會優先。若要進一步了解 Skills 如何載入、共享和控管，
請參閱 [Skills](/zh-TW/tools/skills)。

## 服務功能

| 功能                     | 備註                                                                |
| ------------------------ | ------------------------------------------------------------------- |
| 公開瀏覽                 | Skills 及其 `SKILL.md` 內容可公開檢視。                             |
| 搜尋                     | 由嵌入驅動（向量搜尋），不只是關鍵字。                              |
| 版本化                   | 語意化版本、變更記錄和標籤（包含 `latest`）。                       |
| 下載                     | 每個版本一個 Zip。                                                  |
| 星標和留言               | 社群回饋。                                                          |
| 安全掃描摘要             | 詳細頁面會在安裝或下載前顯示最新掃描狀態。                          |
| 掃描器詳細頁面           | VirusTotal、ClawScan 和靜態分析結果都有深層連結。                  |
| 擁有者復原儀表板         | 發布者可以從 `/dashboard` 查看因掃描而暫停的自有內容。              |
| 擁有者請求重新掃描       | 擁有者可以針對誤判復原請求有限次重新掃描。                          |
| 審核                     | 核准和稽核。                                                        |
| CLI 友善 API             | 適合自動化和腳本。                                                  |

## 安全性與審核

ClawHub 預設開放；任何人都可以上傳 Skills，但 GitHub
帳號必須**至少建立一週**才能發布。這會減緩濫用，同時不阻擋合法貢獻者。

<AccordionGroup>
  <Accordion title="安全掃描">
    ClawHub 會對已發布的 Skills 和 Plugin 發行版本執行自動化安全檢查。
    公開詳細頁面會摘要目前結果，掃描器列則會連結到 VirusTotal、ClawScan
    和靜態分析的專用詳細頁面。

    因掃描而暫停或封鎖的發行版本可能無法在公開目錄和安裝介面使用，
    但其擁有者仍可在 `/dashboard` 中看到。

  </Accordion>
  <Accordion title="檢舉">
    - 任何已登入使用者都可以檢舉 Skill。
    - 必須提供檢舉原因，且原因會被記錄。
    - 每位使用者同時最多可以有 20 個有效檢舉。
    - 超過 3 個不重複檢舉的 Skills 預設會自動隱藏。

  </Accordion>
  <Accordion title="審核">
    - 審核員可以查看隱藏的 Skills、取消隱藏、刪除它們或停權使用者。
    - 濫用檢舉功能可能導致帳號被停權。
    - 有興趣成為審核員？請在 OpenClaw Discord 詢問，並聯絡審核員或維護者。

  </Accordion>
</AccordionGroup>

## ClawHub CLI

你只有在需要發布/同步等已通過註冊庫驗證的工作流程時，才需要使用它。

### 全域選項

<ParamField path="--workdir <dir>" type="string">
  工作目錄。預設：目前目錄；會回退至 OpenClaw 工作區。
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  Skills 目錄，相對於 workdir。
</ParamField>
<ParamField path="--site <url>" type="string">
  網站基底 URL（瀏覽器登入）。
</ParamField>
<ParamField path="--registry <url>" type="string">
  註冊庫 API 基底 URL。
</ParamField>
<ParamField path="--no-input" type="boolean">
  停用提示（非互動）。
</ParamField>
<ParamField path="-V, --cli-version" type="boolean">
  列印 CLI 版本。
</ParamField>

### 命令

<AccordionGroup>
  <Accordion title="驗證（login / logout / whoami）">
    ```bash
    clawhub login              # browser flow
    clawhub login --token <token>
    clawhub logout
    clawhub whoami
    ```

    登入選項：

    - `--token <token>` — 貼上 API 權杖。
    - `--label <label>` — 為瀏覽器登入權杖儲存的標籤（預設：`CLI token`）。
    - `--no-browser` — 不開啟瀏覽器（需要 `--token`）。

  </Accordion>
  <Accordion title="搜尋">
    ```bash
    clawhub search "query"
    ```

    搜尋 Skills。若要探索 Plugin/套件，請使用 `clawhub package explore`。

    - `--limit <n>` — 結果數上限。

  </Accordion>
  <Accordion title="瀏覽 / 檢查 Plugin">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "episodic-claw" --family code-plugin
    clawhub package inspect episodic-claw
    ```

    `package explore` 和 `package inspect` 是 ClawHub CLI 中用於 Plugin/套件探索與中繼資料檢查的介面。原生 OpenClaw 安裝仍使用 `openclaw plugins install clawhub:<package>`。

    選項：

    - `--family skill|code-plugin|bundle-plugin` — 篩選套件家族。
    - `--official` — 只顯示官方套件。
    - `--executes-code` — 只顯示會執行程式碼的套件。
    - `--version <version>` / `--tag <tag>` — 檢查特定套件版本。
    - `--versions`, `--files`, `--file <path>` — 檢查套件歷史和檔案。
    - `--json` — 機器可讀輸出。

  </Accordion>
  <Accordion title="安裝 / 更新 / 列出">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    選項：

    - `--version <version>` — 安裝或更新到特定版本（在 `update` 上僅限單一 slug）。
    - `--force` — 如果資料夾已存在，或本機檔案不符合任何已發布版本，則覆寫。
    - `clawhub list` 會讀取 `.clawhub/lock.json`。

  </Accordion>
  <Accordion title="發布 Skills">
    ```bash
    clawhub skill publish <path>
    ```

    選項：

    - `--slug <slug>` — Skill slug。
    - `--name <name>` — 顯示名稱。
    - `--version <version>` — 語意化版本。
    - `--changelog <text>` — 變更記錄文字（可為空）。
    - `--tags <tags>` — 以逗號分隔的標籤（預設：`latest`）。

  </Accordion>
  <Accordion title="發布 Plugin">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` 可以是本機資料夾、`owner/repo`、`owner/repo@ref`，或
    GitHub URL。

    選項：

    - `--dry-run` — 建置精確發布計畫，不上傳任何內容。
    - `--json` — 為 CI 輸出機器可讀內容。
    - `--source-repo`, `--source-commit`, `--source-ref` — 自動偵測不足時的選用覆寫。

  </Accordion>
  <Accordion title="請求重新掃描">
    ```bash
    clawhub skill rescan <slug>
    clawhub skill rescan <slug> --yes --json

    clawhub package rescan <name>
    clawhub package rescan <name> --yes --json
    ```

    重新掃描命令需要已登入的擁有者權杖，並以最新發布的 Skill 版本或
    Plugin 發行版本為目標。在非互動執行中，請傳入 `--yes`。

    JSON 回應包含目標種類、名稱、版本、重新掃描狀態，以及該版本或發行版本的
    剩餘/最大請求次數。

  </Accordion>
  <Accordion title="刪除 / 取消刪除（擁有者或管理員）">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="同步（掃描本機 + 發布新增或已更新項目）">
    ```bash
    clawhub sync
    ```

    選項：

    - `--root <dir...>` — 額外掃描根目錄。
    - `--all` — 不提示，直接上傳所有內容。
    - `--dry-run` — 顯示將會上傳的內容。
    - `--bump <type>` — 更新時使用 `patch|minor|major`（預設：`patch`）。
    - `--changelog <text>` — 非互動更新的變更記錄。
    - `--tags <tags>` — 以逗號分隔的標籤（預設：`latest`）。
    - `--concurrency <n>` — 註冊庫檢查（預設：`4`）。

  </Accordion>
</AccordionGroup>

## 常見工作流程

<Tabs>
  <Tab title="搜尋">
    ```bash
    clawhub search "postgres backups"
    ```
  </Tab>
  <Tab title="尋找 Plugin">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "memory" --family code-plugin
    clawhub package inspect episodic-claw
    ```
  </Tab>
  <Tab title="安裝">
    ```bash
    clawhub install my-skill-pack
    ```
  </Tab>
  <Tab title="全部更新">
    ```bash
    clawhub update --all
    ```
  </Tab>
  <Tab title="發布單一 skill">
    ```bash
    clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
    ```
  </Tab>
  <Tab title="同步多個 skills">
    ```bash
    clawhub sync --all
    ```
  </Tab>
  <Tab title="從 GitHub 發布 Plugin">
    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    clawhub package publish your-org/your-plugin@v1.0.0
    clawhub package publish https://github.com/your-org/your-plugin
    ```
  </Tab>
</Tabs>

### Plugin 套件中繼資料

程式碼 Plugin 必須在
`package.json` 中包含必要的 OpenClaw 中繼資料：

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

已發布的套件應隨附**建置完成的 JavaScript**，並讓
`runtimeExtensions` 指向該輸出。Git checkout 安裝在沒有建置檔案時仍可
退回使用 TypeScript 原始碼，但建置完成的執行階段
項目可避免在啟動、doctor 和
Plugin 載入路徑中進行執行階段 TypeScript 編譯。

## 版本管理、lockfile 與遙測

<AccordionGroup>
  <Accordion title="版本管理與標籤">
    - 每次發布都會建立新的 **semver** `SkillVersion`。
    - 標籤（例如 `latest`）指向某個版本；移動標籤可讓你回復。
    - 變更日誌會附加在每個版本上，並且在同步或發布更新時可以為空。

  </Accordion>
  <Accordion title="本機變更與登錄檔版本">
    更新會使用內容雜湊，將本機 skill 內容與登錄檔版本進行比較。
    如果本機檔案不符合任何已發布版本，
    CLI 會在覆寫前詢問（或在
    非互動式執行中要求使用 `--force`）。
  </Accordion>
  <Accordion title="同步掃描與備援根目錄">
    `clawhub sync` 會先掃描你目前的工作目錄。如果找不到任何 skills，
    它會退回已知的舊版位置（例如
    `~/openclaw/skills` 和 `~/.openclaw/skills`）。這項設計是為了
    不需要額外旗標也能找到較舊的 skill 安裝。
  </Accordion>
  <Accordion title="儲存與 lockfile">
    - 已安裝的 skills 會記錄在你工作目錄下的 `.clawhub/lock.json`。
    - 驗證權杖會儲存在 ClawHub CLI 設定檔中（可透過 `CLAWHUB_CONFIG_PATH` 覆寫）。

  </Accordion>
  <Accordion title="遙測（安裝次數）">
    當你在登入狀態下執行 `clawhub sync` 時，CLI 會傳送最小
    快照以計算安裝次數。你可以完全停用此功能：

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## 環境變數

| 變數                          | 效果                                            |
| ----------------------------- | ----------------------------------------------- |
| `CLAWHUB_SITE`                | 覆寫站台 URL。                                  |
| `CLAWHUB_REGISTRY`            | 覆寫登錄檔 API URL。                            |
| `CLAWHUB_CONFIG_PATH`         | 覆寫 CLI 儲存權杖/設定的位置。                  |
| `CLAWHUB_WORKDIR`             | 覆寫預設工作目錄。                              |
| `CLAWHUB_DISABLE_TELEMETRY=1` | 停用 `sync` 的遙測。                            |

## 相關

- [社群 Plugin](/zh-TW/plugins/community)
- [Plugins](/zh-TW/tools/plugin)
- [Skills](/zh-TW/tools/skills)
