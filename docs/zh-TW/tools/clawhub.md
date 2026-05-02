---
read_when:
    - 搜尋、安裝或更新 Skills 或 Plugin
    - 將 Skills 或 Plugin 發佈到登錄檔
    - 設定 clawhub CLI 或其環境覆寫
sidebarTitle: ClawHub
summary: ClawHub：OpenClaw Skills 和 Plugin 的公開登錄庫、原生安裝流程，以及 clawhub CLI
title: ClawHub
x-i18n:
    generated_at: "2026-05-02T21:05:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: cd422cb3e7e53fcc6d2b8a557ebc569debb0b470d5fcf141d90499c03fb4d7b3
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub 是 **OpenClaw Skills 和 plugins** 的公開登錄庫。

- 使用原生 `openclaw` 命令搜尋、安裝和更新 Skills，以及從 ClawHub 安裝 plugins。
- 使用獨立的 `clawhub` CLI 進行登錄庫驗證、發布、刪除/取消刪除和同步工作流程。

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
    啟動新的 OpenClaw 工作階段 — 它會載入新的 Skill。
  </Step>
  <Step title="發布（選用）">
    對於需要登錄庫驗證的工作流程（發布、同步、管理），請安裝
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

    原生 `openclaw` 命令會安裝到你的作用中工作區，並
    保留來源中繼資料，讓後續的 `update` 呼叫可以繼續使用 ClawHub。

  </Tab>
  <Tab title="Plugins">
    ```bash
    openclaw plugins search "calendar"
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    `plugins search` 會查詢 ClawHub plugin 目錄，並列印可直接安裝的
    套件名稱。當你想使用 ClawHub 解析時，請使用 `clawhub:<package>`。
    純 npm 安全的 plugin 規格會在啟動切換期間從 npm 安裝：

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    `npm:<package>` 也僅使用 npm，當規格可能產生歧義時很有用：

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    Plugin 安裝會在封存檔安裝執行前，驗證宣告的 `pluginApi` 和
    `minGatewayVersion` 相容性，因此不相容的主機會及早關閉失敗，
    而不是部分安裝套件。當套件版本發布 ClawPack 成品時，
    OpenClaw 會優先使用精確上傳的 npm-pack `.tgz`，驗證 ClawHub
    摘要標頭和下載的位元組，並記錄成品種類、npm
    integrity、npm shasum、tarball 名稱，以及 ClawPack 摘要中繼資料，以供後續
    更新使用。沒有 ClawPack 中繼資料的舊套件版本仍會使用
    舊版套件封存檔驗證路徑。

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` 只接受可安裝的 plugin
家族。如果 ClawHub 套件實際上是 Skill，OpenClaw 會停止並
改為指向 `openclaw skills install <slug>`。

匿名 ClawHub plugin 安裝也會對私有套件關閉失敗。
社群或其他非官方頻道仍然可以安裝，但 OpenClaw
會警告，讓操作人員能在啟用前檢閱來源和驗證。
</Note>

## ClawHub 是什麼

- OpenClaw Skills 和 plugins 的公開登錄庫。
- Skill 套件組合和中繼資料的版本化儲存區。
- 用於搜尋、標籤和使用訊號的探索介面。

典型的 Skill 是一組版本化的檔案套件組合，包含：

- 帶有主要描述和用法的 `SKILL.md` 檔案。
- Skill 使用的選用設定、指令碼或支援檔案。
- 標籤、摘要和安裝需求等中繼資料。

ClawHub 使用中繼資料支援探索，並安全地公開 Skill
能力。登錄庫會追蹤使用訊號（星標、下載次數），以
改善排序和可見度。每次發布都會建立新的 semver
版本，登錄庫會保留版本歷史，讓使用者可以稽核
變更。

## 工作區和 Skill 載入

獨立的 `clawhub` CLI 也會將 Skills 安裝到目前工作目錄下的
`./skills`。如果已設定 OpenClaw 工作區，
`clawhub` 會退回使用該工作區，除非你覆寫 `--workdir`
（或 `CLAWHUB_WORKDIR`）。OpenClaw 會從
`<workspace>/skills` 載入工作區 Skills，並在**下一個**工作階段中載入。

如果你已經使用 `~/.openclaw/skills` 或內建 Skills，工作區
Skills 會優先。若要深入了解 Skills 如何載入、
共用和受控，請參閱 [Skills](/zh-TW/tools/skills)。

## 服務功能

| 功能                     | 備註                                                                |
| ------------------------ | ------------------------------------------------------------------- |
| 公開瀏覽                 | Skills 及其 `SKILL.md` 內容可公開檢視。                             |
| 搜尋                     | 由嵌入提供支援（向量搜尋），不只是關鍵字。                          |
| 版本控管                 | Semver、變更記錄和標籤（包括 `latest`）。                           |
| 下載                     | 每個版本提供 Zip。                                                   |
| 星標和留言               | 社群回饋。                                                          |
| 安全掃描摘要             | 詳細頁面會在安裝或下載前顯示最新掃描狀態。                          |
| 掃描器詳細頁面           | VirusTotal、ClawScan 和靜態分析結果有深層連結。                     |
| 擁有者復原儀表板         | 發布者可以從 `/dashboard` 查看因掃描而保留的自有內容。               |
| 擁有者要求重新掃描       | 擁有者可以要求有限次重新掃描，以復原誤判。                          |
| 審核                     | 核准和稽核。                                                        |
| CLI 友善 API             | 適合自動化和指令碼。                                                |

## 安全與審核

ClawHub 預設開放 — 任何人都可以上傳 Skills，但 GitHub
帳號必須**至少建立一週**才能發布。這可以減緩
濫用，同時不阻擋合法貢獻者。

<AccordionGroup>
  <Accordion title="安全掃描">
    ClawHub 會對已發布的 Skills 和 plugin
    發行版本執行自動化安全檢查。公開詳細頁面會摘要目前結果，掃描器
    列會連結到 VirusTotal、ClawScan 和靜態
    分析的專用詳細頁面。

    因掃描而保留或遭封鎖的發行版本，可能無法在公開目錄和
    安裝介面上使用，但其擁有者仍可在 `/dashboard` 中看到。

  </Accordion>
  <Accordion title="回報">
    - 任何已登入使用者都可以回報 Skill。
    - 必須提供回報原因，並會被記錄。
    - 每位使用者同時最多可以有 20 份有效回報。
    - 預設情況下，超過 3 份不重複回報的 Skills 會自動隱藏。

  </Accordion>
  <Accordion title="審核">
    - 審核員可以查看隱藏的 Skills、取消隱藏、刪除，或封鎖使用者。
    - 濫用回報功能可能導致帳號遭封鎖。
    - 有興趣成為審核員嗎？請在 OpenClaw Discord 中詢問，並聯絡審核員或維護者。

  </Accordion>
</AccordionGroup>

## ClawHub CLI

你只有在需要登錄庫驗證的工作流程（例如
發布/同步）時才需要它。

### 全域選項

<ParamField path="--workdir <dir>" type="string">
  工作目錄。預設：目前目錄；退回使用 OpenClaw 工作區。
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  Skills 目錄，相對於 workdir。
</ParamField>
<ParamField path="--site <url>" type="string">
  網站基底 URL（瀏覽器登入）。
</ParamField>
<ParamField path="--registry <url>" type="string">
  登錄庫 API 基底 URL。
</ParamField>
<ParamField path="--no-input" type="boolean">
  停用提示（非互動式）。
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

    搜尋 Skills。若要探索 plugin/套件，請使用 `clawhub package explore`。

    - `--limit <n>` — 最大結果數。

  </Accordion>
  <Accordion title="瀏覽 / 檢查 plugins">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "episodic-claw" --family code-plugin
    clawhub package inspect episodic-claw
    ```

    `package explore` 和 `package inspect` 是 ClawHub CLI 用於探索 plugin/套件和檢查中繼資料的介面。原生 OpenClaw 安裝仍使用 `openclaw plugins install clawhub:<package>`。

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

    - `--version <version>` — 安裝或更新到特定版本（`update` 僅限單一 slug）。
    - `--force` — 如果資料夾已存在，或本機檔案不符合任何已發布版本，則覆寫。
    - `clawhub list` 讀取 `.clawhub/lock.json`。

  </Accordion>
  <Accordion title="發布 Skills">
    ```bash
    clawhub skill publish <path>
    ```

    選項：

    - `--slug <slug>` — Skill slug。
    - `--name <name>` — 顯示名稱。
    - `--version <version>` — semver 版本。
    - `--changelog <text>` — 變更記錄文字（可以為空）。
    - `--tags <tags>` — 逗號分隔的標籤（預設：`latest`）。

  </Accordion>
  <Accordion title="發布 plugins">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` 可以是本機資料夾、`owner/repo`、`owner/repo@ref`，或
    GitHub URL。

    選項：

    - `--dry-run` — 建立精確的發布計畫，但不實際上傳任何內容。
    - `--json` — 輸出 CI 可讀取的機器可讀結果。
    - `--source-repo`, `--source-commit`, `--source-ref` — 當自動偵測不足時使用的選用覆寫。

  </Accordion>
  <Accordion title="要求重新掃描">
    ```bash
    clawhub skill rescan <slug>
    clawhub skill rescan <slug> --yes --json

    clawhub package rescan <name>
    clawhub package rescan <name> --yes --json
    ```

    重新掃描命令需要已登入的擁有者權杖，並以最新的
    已發布 Skill 版本或 plugin 發行版本為目標。在非互動式執行中，請傳入
    `--yes`。

    JSON 回應包含目標種類、名稱、版本、重新掃描狀態，以及
    該版本或發行版本的剩餘/最大要求次數。

  </Accordion>
  <Accordion title="刪除 / 取消刪除（擁有者或管理員）">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="同步（掃描本機 + 發布新的或已更新的項目）">
    ```bash
    clawhub sync
    ```

    選項：

    - `--root <dir...>` — 額外掃描根目錄。
    - `--all` — 不提示並上傳所有內容。
    - `--dry-run` — 顯示將會上傳的內容。
    - `--bump <type>` — 更新使用 `patch|minor|major`（預設：`patch`）。
    - `--changelog <text>` — 非互動式更新的變更記錄。
    - `--tags <tags>` — 逗號分隔的標籤（預設：`latest`）。
    - `--concurrency <n>` — 登錄庫檢查（預設：`4`）。

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
  <Tab title="發布單一技能">
    ```bash
    clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
    ```
  </Tab>
  <Tab title="同步多個技能">
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
回退到 TypeScript 原始碼，但建置完成的執行階段
項目可避免在啟動、doctor 和
Plugin 載入路徑中進行執行階段 TypeScript 編譯。

## 版本設定、lockfile 與遙測

<AccordionGroup>
  <Accordion title="版本設定與標籤">
    - 每次發布都會建立新的 **semver** `SkillVersion`。
    - 標籤（例如 `latest`）會指向某個版本；移動標籤可讓你回復版本。
    - Changelog 會附加到每個版本；同步或發布更新時可以為空。

  </Accordion>
  <Accordion title="本機變更與登錄版本">
    更新會使用內容雜湊，比較本機技能內容與登錄版本。
    如果本機檔案不符合任何已發布版本，
    CLI 會在覆寫前詢問（或在
    非互動式執行中要求 `--force`）。
  </Accordion>
  <Accordion title="同步掃描與備援根目錄">
    `clawhub sync` 會先掃描你目前的工作目錄。如果找不到技能，
    它會回退到已知的舊版位置（例如
    `~/openclaw/skills` 和 `~/.openclaw/skills`）。這是為了
    不需額外旗標也能找到較舊的技能安裝。
  </Accordion>
  <Accordion title="儲存與 lockfile">
    - 已安裝的技能會記錄在你工作目錄下的 `.clawhub/lock.json`。
    - 驗證權杖會儲存在 ClawHub CLI 設定檔中（可透過 `CLAWHUB_CONFIG_PATH` 覆寫）。

  </Accordion>
  <Accordion title="遙測（安裝計數）">
    當你在登入狀態下執行 `clawhub sync` 時，CLI 會傳送最小化
    快照以計算安裝數。你可以完全停用此功能：

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## 環境變數

| 變數                          | 效果                                            |
| ----------------------------- | ----------------------------------------------- |
| `CLAWHUB_SITE`                | 覆寫網站 URL。                                  |
| `CLAWHUB_REGISTRY`            | 覆寫登錄 API URL。                              |
| `CLAWHUB_CONFIG_PATH`         | 覆寫 CLI 儲存權杖/設定的位置。                  |
| `CLAWHUB_WORKDIR`             | 覆寫預設工作目錄。                              |
| `CLAWHUB_DISABLE_TELEMETRY=1` | 停用 `sync` 的遙測。                            |

## 相關

- [社群 Plugin](/zh-TW/plugins/community)
- [Plugins](/zh-TW/tools/plugin)
- [Skills](/zh-TW/tools/skills)
