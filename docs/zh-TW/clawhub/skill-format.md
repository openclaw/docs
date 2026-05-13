---
read_when:
    - 發布 Skills
    - 偵錯發布/同步失敗
summary: 技能資料夾格式、必要檔案、允許的檔案類型、限制。
x-i18n:
    generated_at: "2026-05-13T04:18:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76c6a9f1c5b7b8df66a460d0f74b39581e40f43dbe99b825800e709ec57bd2fb
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Skill 格式

## 在磁碟上

一個 Skill 是一個資料夾。

必要項目：

- `SKILL.md`（或 `skill.md`）

選用項目：

- 任何支援用的_文字型_檔案（請參閱「允許的檔案」）
- `.clawhubignore`（用於發佈/同步的忽略模式，舊版 `.clawdhubignore`）
- `.gitignore`（也會採用）

本機安裝中繼資料（由 CLI 寫入）：

- `<skill>/.clawhub/origin.json`（舊版 `.clawdhub`）

工作目錄安裝狀態（由 CLI 寫入）：

- `<workdir>/.clawhub/lock.json`（舊版 `.clawdhub`）

## `SKILL.md`

- Markdown，可選用 YAML frontmatter。
- 伺服器會在發佈期間從 frontmatter 擷取中繼資料。
- `description` 會在 UI/搜尋中作為 Skill 摘要使用。

## Frontmatter 中繼資料

Skill 中繼資料會宣告在 `SKILL.md` 頂端的 YAML frontmatter 中。這會告訴登錄庫（以及安全性分析）你的 Skill 需要什麼才能執行。

### 基本 frontmatter

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### 執行階段中繼資料（`metadata.openclaw`）

在 `metadata.openclaw` 下宣告 Skill 的執行階段需求（別名：`metadata.clawdbot`、`metadata.clawdis`）。

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

針對 Skill 執行前必須存在的環境變數，請使用 `requires.env`。如果你需要每個變數各自的中繼資料，包括含有 `required: false` 的選用變數，請使用 `envVars`。

### 完整欄位參考

| 欄位               | 類型       | 說明                                                                                                                                        |
| ------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Skill 預期需要的必要環境變數。                                                                                                              |
| `requires.bins`    | `string[]` | 必須全部已安裝的 CLI 二進位檔。                                                                                                             |
| `requires.anyBins` | `string[]` | 至少必須存在其中一個的 CLI 二進位檔。                                                                                                       |
| `requires.config`  | `string[]` | Skill 會讀取的設定檔路徑。                                                                                                                  |
| `primaryEnv`       | `string`   | Skill 的主要憑證環境變數。                                                                                                                  |
| `envVars`          | `array`    | 環境變數宣告，包含 `name`、選用的 `required`，以及選用的 `description`。針對選用環境變數，請設定 `required: false`。 |
| `always`           | `boolean`  | 若為 `true`，Skill 會一律啟用（不需要明確安裝）。                                                                                           |
| `skillKey`         | `string`   | 覆寫 Skill 的呼叫鍵。                                                                                                                       |
| `emoji`            | `string`   | Skill 的顯示 emoji。                                                                                                                        |
| `homepage`         | `string`   | Skill 首頁或文件的 URL。                                                                                                                    |
| `os`               | `string[]` | OS 限制（例如 `["macos"]`、`["linux"]`）。                                                                                                   |
| `install`          | `array`    | 依賴項的安裝規格（見下文）。                                                                                                                |
| `nix`              | `object`   | Nix Plugin 規格（請參閱 README）。                                                                                                          |
| `config`           | `object`   | Clawdbot 設定規格（請參閱 README）。                                                                                                        |

### 安裝規格

如果你的 Skill 需要安裝依賴項，請在 `install` 陣列中宣告：

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

在 `metadata.openclaw.envVars` 下宣告選用環境變數，並設定 `required: false`。不要將選用項目加入 `requires.env`，因為 `requires.env` 表示 Skill 沒有這些變數就無法執行。

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

ClawHub 的安全性分析會檢查你的 Skill 宣告內容是否符合實際行為。如果你的程式碼參照 `TODOIST_API_KEY`，但 frontmatter 沒有在 `requires.env`、`primaryEnv` 或 `envVars` 下宣告它，分析就會標記中繼資料不相符。保持宣告準確有助於 Skill 通過審查，也能協助使用者了解他們正在安裝什麼。

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
- 指令碼檔案在上傳後仍會被掃描；PowerShell `.ps1`、`.psm1` 與 `.psd1` 檔案會以文字形式接受。
- 以 `text/` 開頭的內容類型會被視為文字；另有一小份允許清單（JSON/YAML/TOML/JS/TS/Markdown/SVG）。

限制（伺服器端）：

- 總 bundle 大小：50MB。
- 嵌入文字包含 `SKILL.md` + 最多約 40 個非 `.md` 檔案（盡力上限）。

## Slug

- 預設從資料夾名稱衍生。
- 必須是小寫且 URL 安全：`^[a-z0-9][a-z0-9-]*$`。

## 版本化 + 標籤

- 每次發佈都會建立新版本（semver）。
- 標籤是指向版本的字串指標；通常會使用 `latest`。

## 授權

- 所有發佈在 ClawHub 上的 Skills 都採用 `MIT-0` 授權。
- 任何人都可以使用、修改和重新散布已發佈的 Skills，包括商業用途。
- 不需要署名。
- 不要在 `SKILL.md` 中加入衝突的授權條款；ClawHub 不支援每個 Skill 各自覆寫授權。

## 付費 Skills

- ClawHub 不支援付費 Skills、個別 Skill 定價、付費牆或收益分潤。
- 不要將定價中繼資料加入 `SKILL.md`；它不是 Skill 格式的一部分，也不會讓已發佈的 Skill 變成付費。
- 如果你的 Skill 整合了付費第三方服務，請在 Skill 指示與環境變數宣告中清楚記錄外部成本與必要帳戶（必要變數使用 `requires.env`，選用變數則使用帶有 `required: false` 的 `envVars`）。
