---
read_when:
    - 搜尋、安裝或更新 Skills 或 Plugin
    - 將 Skills 或 Plugin 發布到註冊中心
    - 設定 clawhub CLI 或其環境覆寫
sidebarTitle: ClawHub
summary: ClawHub：OpenClaw Skills 與 Plugin 的公開登錄檔、原生安裝流程，以及 clawhub CLI
title: ClawHub
x-i18n:
    generated_at: "2026-04-30T03:43:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ec09a3c76820137eb1f7ca829a184fc1ed6392d3b32a327ecbda4d2cad7a78d
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub 是 **OpenClaw Skills 和 plugins** 的公開註冊庫。

- 使用原生 `openclaw` 指令來搜尋、安裝與更新 Skills，以及從 ClawHub 安裝 plugins。
- 使用獨立的 `clawhub` CLI 進行註冊庫驗證、發布、刪除/取消刪除與同步工作流程。

網站：[clawhub.ai](https://clawhub.ai)

## 快速開始

<Steps>
  <Step title="Search">
    ```bash
    openclaw skills search "calendar"
    ```
  </Step>
  <Step title="Install">
    ```bash
    openclaw skills install <skill-slug>
    ```
  </Step>
  <Step title="Use">
    開始新的 OpenClaw 工作階段，它會載入新的 skill。
  </Step>
  <Step title="Publish (optional)">
    若要使用需註冊庫驗證的工作流程（發布、同步、管理），請安裝
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

    原生 `openclaw` 指令會安裝到你的作用中工作區，並
    保留來源中繼資料，讓之後的 `update` 呼叫能持續使用 ClawHub。

  </Tab>
  <Tab title="Plugins">
    ```bash
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    裸露的 npm 安全 plugin 規格也會先嘗試對 ClawHub 查找，再使用 npm：

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    當你只想進行 npm 解析且不查找 ClawHub 時，請使用 `npm:<package>`：

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    Plugin 安裝會在執行封存檔安裝前，驗證公告的 `pluginApi` 與
    `minGatewayVersion` 相容性，因此不相容的主機會及早封閉失敗，而不是部分安裝
    該套件。

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` 只接受可安裝的 plugin
家族。如果某個 ClawHub 套件其實是 skill，OpenClaw 會停止並
改為指引你使用 `openclaw skills install <slug>`。

匿名 ClawHub plugin 安裝也會對私有套件封閉失敗。
社群或其他非官方通道仍可安裝，但 OpenClaw
會發出警告，讓操作人員在啟用前可先檢閱來源與驗證狀態。
</Note>

## ClawHub 是什麼

- OpenClaw Skills 和 plugins 的公開註冊庫。
- skill 組合包與中繼資料的版本化儲存區。
- 用於搜尋、標籤與使用訊號的探索介面。

典型的 skill 是包含以下內容的版本化檔案組合包：

- 含有主要描述與用法的 `SKILL.md` 檔案。
- skill 使用的選用設定、腳本或支援檔案。
- 標籤、摘要與安裝需求等中繼資料。

ClawHub 使用中繼資料來支援探索，並安全地公開 skill
能力。註冊庫會追蹤使用訊號（星號、下載次數）以
改善排名與可見度。每次發布都會建立新的 semver
版本，且註冊庫會保留版本歷史，讓使用者可稽核
變更。

## 工作區與 skill 載入

獨立的 `clawhub` CLI 也會將 Skills 安裝到你目前工作目錄下的
`./skills`。如果已設定 OpenClaw 工作區，`clawhub`
會回退使用該工作區，除非你覆寫 `--workdir`
（或 `CLAWHUB_WORKDIR`）。OpenClaw 會從
`<workspace>/skills` 載入工作區 Skills，並在**下一個**工作階段載入它們。

如果你已使用 `~/.openclaw/skills` 或內建 Skills，工作區
Skills 會優先。若要深入了解 Skills 如何載入、
分享與受閘控，請參閱 [Skills](/zh-TW/tools/skills)。

## 服務功能

| 功能                     | 備註                                                                |
| ------------------------ | ------------------------------------------------------------------- |
| 公開瀏覽                 | Skills 及其 `SKILL.md` 內容可公開檢視。                             |
| 搜尋                     | 由嵌入技術驅動（向量搜尋），不只是關鍵字。                          |
| 版本控管                 | Semver、變更記錄與標籤（包含 `latest`）。                           |
| 下載                     | 每個版本一個 Zip。                                                  |
| 星號與留言               | 社群回饋。                                                          |
| 安全掃描摘要             | 詳細頁會在安裝或下載前顯示最新掃描狀態。                            |
| 掃描器詳細頁             | VirusTotal、ClawScan 與靜態分析結果都有深層連結。                   |
| 擁有者復原儀表板         | 發布者可從 `/dashboard` 查看因掃描而暫停的自有內容。                 |
| 擁有者要求重新掃描       | 擁有者可針對誤判復原要求有限次重新掃描。                            |
| 審核                     | 核准與稽核。                                                        |
| CLI 友善 API             | 適合自動化與腳本。                                                  |

## 安全性與審核

ClawHub 預設開放，任何人都可以上傳 Skills，但 GitHub
帳號必須**至少建立一週**才可發布。這會降低
濫用速度，同時不阻擋合法貢獻者。

<AccordionGroup>
  <Accordion title="Security scans">
    ClawHub 會對已發布的 Skills 與 plugin
    版本執行自動化安全檢查。公開詳細頁會摘要目前結果，而掃描器
    列會連到 VirusTotal、ClawScan 與靜態
    分析的專用詳細頁。

    因掃描而暫停或封鎖的版本，可能無法在公開目錄與
    安裝介面使用，但其擁有者仍可在 `/dashboard` 中看到。

  </Accordion>
  <Accordion title="Reporting">
    - 任何已登入使用者都可以檢舉 skill。
    - 必須提供檢舉理由，且會被記錄。
    - 每位使用者同一時間最多可有 20 筆有效檢舉。
    - 擁有超過 3 位不重複使用者檢舉的 Skills 預設會自動隱藏。

  </Accordion>
  <Accordion title="Moderation">
    - 審核者可以查看隱藏的 Skills、取消隱藏、刪除它們，或封鎖使用者。
    - 濫用檢舉功能可能導致帳號被封鎖。
    - 有興趣成為審核者嗎？請在 OpenClaw Discord 詢問，並聯絡審核者或維護者。

  </Accordion>
</AccordionGroup>

## ClawHub CLI

只有在發布/同步等需註冊庫驗證的工作流程中才需要這個。

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
  停用提示（非互動式）。
</ParamField>
<ParamField path="-V, --cli-version" type="boolean">
  列印 CLI 版本。
</ParamField>

### 指令

<AccordionGroup>
  <Accordion title="Auth (login / logout / whoami)">
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
  <Accordion title="Search">
    ```bash
    clawhub search "query"
    ```

    搜尋 Skills。若要探索 plugin/package，請使用 `clawhub package explore`。

    - `--limit <n>` — 結果上限。

  </Accordion>
  <Accordion title="Browse / inspect plugins">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "episodic-claw" --family code-plugin
    clawhub package inspect episodic-claw
    ```

    `package explore` 與 `package inspect` 是 ClawHub CLI 中用於 plugin/package 探索與中繼資料檢查的介面。原生 OpenClaw 安裝仍使用 `openclaw plugins install clawhub:<package>`。

    選項：

    - `--family skill|code-plugin|bundle-plugin` — 篩選套件家族。
    - `--official` — 只顯示官方套件。
    - `--executes-code` — 只顯示會執行程式碼的套件。
    - `--version <version>` / `--tag <tag>` — 檢查特定套件版本。
    - `--versions`, `--files`, `--file <path>` — 檢查套件歷史與檔案。
    - `--json` — 機器可讀輸出。

  </Accordion>
  <Accordion title="Install / update / list">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    選項：

    - `--version <version>` — 安裝或更新到特定版本（`update` 上僅限單一 slug）。
    - `--force` — 若資料夾已存在，或本機檔案不符合任何已發布版本，則覆寫。
    - `clawhub list` 會讀取 `.clawhub/lock.json`。

  </Accordion>
  <Accordion title="Publish skills">
    ```bash
    clawhub skill publish <path>
    ```

    選項：

    - `--slug <slug>` — skill slug。
    - `--name <name>` — 顯示名稱。
    - `--version <version>` — semver 版本。
    - `--changelog <text>` — 變更記錄文字（可為空）。
    - `--tags <tags>` — 逗號分隔的標籤（預設：`latest`）。

  </Accordion>
  <Accordion title="Publish plugins">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` 可以是本機資料夾、`owner/repo`、`owner/repo@ref`，或
    GitHub URL。

    選項：

    - `--dry-run` — 建立精確的發布計畫，不上傳任何內容。
    - `--json` — 為 CI 輸出機器可讀結果。
    - `--source-repo`, `--source-commit`, `--source-ref` — 自動偵測不足時可使用的選用覆寫。

  </Accordion>
  <Accordion title="Request rescans">
    ```bash
    clawhub skill rescan <slug>
    clawhub skill rescan <slug> --yes --json

    clawhub package rescan <name>
    clawhub package rescan <name> --yes --json
    ```

    重新掃描指令需要已登入的擁有者權杖，目標是最新
    已發布的 skill 版本或 plugin 版本。非互動式執行時，請傳入
    `--yes`。

    JSON 回應包含目標種類、名稱、版本、重新掃描狀態，以及
    該版本的剩餘/最大要求次數。

  </Accordion>
  <Accordion title="Delete / undelete (owner or admin)">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="Sync (scan local + publish new or updated)">
    ```bash
    clawhub sync
    ```

    選項：

    - `--root <dir...>` — 額外掃描根目錄。
    - `--all` — 不提示並上傳所有內容。
    - `--dry-run` — 顯示將會上傳的內容。
    - `--bump <type>` — 更新使用的 `patch|minor|major`（預設：`patch`）。
    - `--changelog <text>` — 非互動式更新的變更記錄。
    - `--tags <tags>` — 逗號分隔的標籤（預設：`latest`）。
    - `--concurrency <n>` — 註冊庫檢查數量（預設：`4`）。

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
  <Tab title="發佈單一技能">
    ```bash
    clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
    ```
  </Tab>
  <Tab title="同步多個技能">
    ```bash
    clawhub sync --all
    ```
  </Tab>
  <Tab title="從 GitHub 發佈 Plugin">
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

已發佈的套件應提供**已建置的 JavaScript**，並將
`runtimeExtensions` 指向該輸出。Git checkout 安裝在沒有已建置檔案時仍可退回使用 TypeScript 原始碼，但已建置的執行階段進入點可避免在啟動、doctor 和 Plugin 載入路徑中進行執行階段 TypeScript 編譯。

## 版本設定、lockfile 和遙測

<AccordionGroup>
  <Accordion title="版本設定與標籤">
    - 每次發佈都會建立新的 **semver** `SkillVersion`。
    - 標籤（例如 `latest`）指向某個版本；移動標籤可讓你回復。
    - 變更日誌會按版本附加，並可在同步或發佈更新時留空。

  </Accordion>
  <Accordion title="本機變更與登錄版本">
    更新會使用內容雜湊比較本機技能內容與登錄版本。如果本機檔案不符合任何已發佈版本，CLI 會在覆寫前詢問（或在非互動式執行中要求使用 `--force`）。
  </Accordion>
  <Accordion title="同步掃描和備援根目錄">
    `clawhub sync` 會先掃描你目前的工作目錄。如果找不到技能，則會退回到已知的舊版位置（例如
    `~/openclaw/skills` 和 `~/.openclaw/skills`）。這是為了在不需要額外旗標的情況下尋找較舊的技能安裝。
  </Accordion>
  <Accordion title="儲存空間和 lockfile">
    - 已安裝的技能會記錄在你工作目錄下的 `.clawhub/lock.json`。
    - 驗證權杖會儲存在 ClawHub CLI 設定檔中（可透過 `CLAWHUB_CONFIG_PATH` 覆寫）。

  </Accordion>
  <Accordion title="遙測（安裝計數）">
    當你在登入狀態下執行 `clawhub sync` 時，CLI 會傳送最小快照以計算安裝次數。你可以完全停用此功能：

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
- [Plugin](/zh-TW/tools/plugin)
- [Skills](/zh-TW/tools/skills)
