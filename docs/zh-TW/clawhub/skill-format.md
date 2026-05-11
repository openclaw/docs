---
read_when:
    - 發布 Skills
    - 偵錯發布/同步失敗
summary: Skill 資料夾格式、必要檔案、允許的檔案類型、限制。
x-i18n:
    generated_at: "2026-05-11T20:24:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76c6a9f1c5b7b8df66a460d0f74b39581e40f43dbe99b825800e709ec57bd2fb
    source_path: clawhub/skill-format.md
    workflow: 16
---

# 技能格式

## 在磁碟上

技能是一個資料夾。

必需：

- `SKILL.md`（或 `skill.md`）

選用：

- 任何支援用的_文字型_檔案（見「允許的檔案」）
- `.clawhubignore`（發佈/同步的忽略模式，舊版為 `.clawdhubignore`）
- `.gitignore`（也會遵循）

本機安裝中繼資料（由 CLI 寫入）：

- `<skill>/.clawhub/origin.json`（舊版為 `.clawdhub`）

工作目錄安裝狀態（由 CLI 寫入）：

- `<workdir>/.clawhub/lock.json`（舊版為 `.clawdhub`）

## `SKILL.md`

- Markdown，可選用 YAML frontmatter。
- 伺服器會在發佈期間從 frontmatter 擷取中繼資料。
- `description` 會作為 UI/搜尋中的技能摘要。

## Frontmatter 中繼資料

技能中繼資料宣告於 `SKILL.md` 頂部的 YAML frontmatter。這會告訴登錄檔（以及安全性分析）你的技能執行時需要什麼。

### 基本 frontmatter

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### 執行階段中繼資料 (`metadata.openclaw`)

在 `metadata.openclaw` 下宣告技能的執行階段需求（別名：`metadata.clawdbot`、`metadata.clawdis`）。

```yaml
---
name: my-skill
description: Manage tasks via the Todoist API.
metadata:
  openclaw:
    requires:
      env:
        - TODOIST_API_KEY
      bins:
        - curl
    primaryEnv: TODOIST_API_KEY
---
```

使用 `requires.env` 表示技能執行前必須存在的環境變數。當你需要逐一變數的中繼資料時，請使用 `envVars`，包括搭配 `required: false` 的選用變數。

### 完整欄位參考

| 欄位               | 類型       | 說明                                                                                                                                 |
| ------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `requires.env`     | `string[]` | 技能預期需要的必要環境變數。                                                                                                         |
| `requires.bins`    | `string[]` | 必須全部安裝的 CLI 二進位檔。                                                                                                        |
| `requires.anyBins` | `string[]` | 至少必須存在其中一個的 CLI 二進位檔。                                                                                                |
| `requires.config`  | `string[]` | 技能會讀取的設定檔路徑。                                                                                                             |
| `primaryEnv`       | `string`   | 技能的主要認證環境變數。                                                                                                             |
| `envVars`          | `array`    | 環境變數宣告，包含 `name`、選用的 `required`，以及選用的 `description`。若為選用環境變數，請設定 `required: false`。 |
| `always`           | `boolean`  | 若為 `true`，技能一律啟用（不需要明確安裝）。                                                                                        |
| `skillKey`         | `string`   | 覆寫技能的叫用鍵。                                                                                                                   |
| `emoji`            | `string`   | 技能的顯示 emoji。                                                                                                                   |
| `homepage`         | `string`   | 技能首頁或文件的 URL。                                                                                                               |
| `os`               | `string[]` | 作業系統限制（例如 `["macos"]`、`["linux"]`）。                                                                                      |
| `install`          | `array`    | 相依性的安裝規格（見下方）。                                                                                                         |
| `nix`              | `object`   | Nix Plugin 規格（見 README）。                                                                                                       |
| `config`           | `object`   | Clawdbot 設定規格（見 README）。                                                                                                     |

### 安裝規格

如果你的技能需要安裝相依性，請在 `install` 陣列中宣告：

```yaml
metadata:
  openclaw:
    install:
      - kind: brew
        formula: jq
        bins: [jq]
      - kind: node
        package: typescript
        bins: [tsc]
```

支援的安裝種類：`brew`、`node`、`go`、`uv`。

### 選用環境變數

在 `metadata.openclaw.envVars` 下宣告選用環境變數，並設定 `required: false`。不要把選用項目加入 `requires.env`，因為 `requires.env` 表示缺少它們時技能就無法執行。

```yaml
metadata:
  openclaw:
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Todoist API token used for authenticated requests.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Optional default project ID when the user does not specify one.
```

### 為什麼這很重要

ClawHub 的安全性分析會檢查你的技能宣告是否與其實際行為相符。如果你的程式碼參照 `TODOIST_API_KEY`，但 frontmatter 未在 `requires.env`、`primaryEnv` 或 `envVars` 下宣告它，分析就會標示中繼資料不相符。保持宣告準確有助於技能通過審查，也能協助使用者了解自己正在安裝什麼。

### 範例：完整 frontmatter

```yaml
---
name: todoist-cli
description: Manage Todoist tasks, projects, and labels from the command line.
version: 1.2.0
metadata:
  openclaw:
    requires:
      env:
        - TODOIST_API_KEY
      bins:
        - curl
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Todoist API token.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Optional default project ID.
    emoji: "\u2705"
    homepage: https://github.com/example/todoist-cli
---
```

## 允許的檔案

發佈時只接受「文字型」檔案。

- 副檔名允許清單位於 `packages/schema/src/textFiles.ts`（`TEXT_FILE_EXTENSIONS`）。
- 上傳後仍會掃描指令碼檔案；PowerShell `.ps1`、`.psm1` 和 `.psd1` 檔案會被接受為文字。
- 以 `text/` 開頭的內容類型會被視為文字；另有一小份允許清單（JSON/YAML/TOML/JS/TS/Markdown/SVG）。

限制（伺服器端）：

- 總套件大小：50MB。
- 嵌入文字包含 `SKILL.md` + 最多約 40 個非 `.md` 檔案（盡力上限）。

## Slugs

- 預設由資料夾名稱衍生。
- 必須為小寫且 URL 安全：`^[a-z0-9][a-z0-9-]*$`。

## 版本控制 + 標籤

- 每次發佈都會建立新版本（semver）。
- 標籤是指向某個版本的字串指標；常用的是 `latest`。

## 授權

- 所有發佈在 ClawHub 上的技能均採用 `MIT-0` 授權。
- 任何人都可以使用、修改並重新散布已發佈的技能，包括商業用途。
- 不需要標示出處。
- 不要在 `SKILL.md` 中加入相衝突的授權條款；ClawHub 不支援逐技能覆寫授權。

## 付費技能

- ClawHub 不支援付費技能、逐技能定價、付費牆或收益分潤。
- 不要將定價中繼資料加入 `SKILL.md`；它不是技能格式的一部分，也不會讓已發佈的技能變成付費。
- 如果你的技能整合付費第三方服務，請在技能說明與環境變數宣告中清楚記載外部費用和必要帳號（必要變數使用 `requires.env`，選用變數則使用 `envVars` 並搭配 `required: false`）。
