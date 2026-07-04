---
read_when:
    - 發佈 Skills
    - 除錯發布失敗
summary: Skill 資料夾格式、必要檔案、允許的檔案類型、限制。
x-i18n:
    generated_at: "2026-07-04T06:21:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bbd17c0b7a5c4e6ad6c554bdd3f604424283990503a1c493f49000fbfbb29712
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Skill 格式

## 在磁碟上

Skill 是一個資料夾。

必要：

- `SKILL.md`（或 `skill.md`；也接受舊版 `skills.md`）

選用：

- 任何支援用的_文字型_檔案（請參閱「允許的檔案」）
- `.clawhubignore`（發佈時的忽略模式，舊版 `.clawdhubignore`）
- `.gitignore`（也會遵循）

## GitHub 匯入

網頁版 GitHub 匯入工具比本機發佈/同步更嚴格。它只會在已登入 GitHub 帳號擁有的公開、非 fork 儲存庫中探索
`SKILL.md` 或舊版 `skills.md` 檔案。它不會匯入私人儲存庫、fork、
已封存/停用的儲存庫，或第三方公開儲存庫。

本機安裝中繼資料（由命令列介面寫入）：

- `<skill>/.clawhub/origin.json`（舊版 `.clawdhub`）

工作目錄安裝狀態（由命令列介面寫入）：

- `<workdir>/.clawhub/lock.json`（舊版 `.clawdhub`）

## `SKILL.md`

- Markdown，並可選擇性加入 YAML frontmatter。
- 伺服器會在發佈期間從 frontmatter 擷取中繼資料。
- `description` 會作為使用者介面/搜尋中的 Skill 摘要。

## Frontmatter 中繼資料

Skill 中繼資料會宣告在 `SKILL.md` 頂端的 YAML frontmatter 中。這會告訴登錄檔（以及安全性分析）你的 Skill 執行時需要什麼。

### 基本 frontmatter

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### 執行階段中繼資料（`metadata.openclaw`）

在 `metadata.openclaw` 下宣告你的 Skill 執行階段需求（別名：`metadata.clawdbot`、`metadata.clawdis`）。

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

對於 Skill 執行前必須存在的環境變數，請使用 `requires.env`。需要每個變數的中繼資料時，請使用 `envVars`，包含帶有 `required: false` 的選用變數。

### 完整欄位參考

| 欄位               | 類型       | 說明                                                                                                                                         |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | 你的 Skill 預期存在的必要環境變數。                                                                                                          |
| `requires.bins`    | `string[]` | 必須全部安裝的命令列介面二進位檔。                                                                                                           |
| `requires.anyBins` | `string[]` | 至少必須存在其中一個的命令列介面二進位檔。                                                                                                   |
| `requires.config`  | `string[]` | 你的 Skill 會讀取的設定檔路徑。                                                                                                              |
| `primaryEnv`       | `string`   | 你的 Skill 主要認證用環境變數。                                                                                                              |
| `envVars`          | `array`    | 環境變數宣告，包含 `name`、選用的 `required`，以及選用的 `description`。若為選用環境變數，請設定 `required: false`。                         |
| `always`           | `boolean`  | 若為 `true`，Skill 永遠啟用（不需要明確安裝）。                                                                                              |
| `skillKey`         | `string`   | 覆寫 Skill 的叫用鍵。                                                                                                                        |
| `emoji`            | `string`   | Skill 的顯示 emoji。                                                                                                                         |
| `homepage`         | `string`   | Skill 首頁或文件的 URL。                                                                                                                     |
| `os`               | `string[]` | 作業系統限制（例如 `["macos"]`、`["linux"]`）。                                                                                              |
| `install`          | `array`    | 相依項的安裝規格（見下方）。                                                                                                                 |
| `nix`              | `object`   | Nix 外掛規格（請參閱 README）。                                                                                                              |
| `config`           | `object`   | Clawdbot 設定規格（請參閱 README）。                                                                                                         |

### 安裝規格

如果你的 Skill 需要安裝相依項，請在 `install` 陣列中宣告它們：

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

在 `metadata.openclaw.envVars` 下宣告選用環境變數，並設定 `required: false`。不要將選用項目加入 `requires.env`，因為 `requires.env` 代表 Skill 沒有它們就無法執行。

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

ClawHub 的安全性分析會檢查你的 Skill 宣告內容是否符合其實際行為。如果你的程式碼參照 `TODOIST_API_KEY`，但 frontmatter 未在 `requires.env`、`primaryEnv` 或 `envVars` 下宣告它，分析就會標記中繼資料不符。保持宣告準確可協助你的 Skill 通過審查，也能協助使用者了解他們正在安裝什麼。

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

發佈只接受「文字型」檔案。

- 副檔名允許清單位於 `packages/schema/src/textFiles.ts`（`TEXT_FILE_EXTENSIONS`）。
- 指令碼檔案上傳後仍會掃描；PowerShell `.ps1`、`.psm1` 和 `.psd1` 檔案會被視為文字接受。
- 以 `text/` 開頭的內容類型會被視為文字；另外還有一小份允許清單（JSON/YAML/TOML/JS/TS/Markdown/SVG）。

限制（伺服器端）：

- 總套件大小：50MB。
- 嵌入文字包含 `SKILL.md` + 最多約 40 個非 `.md` 檔案（盡力上限）。

## Slug

- 預設從資料夾名稱衍生。
- Package scope 必須完全符合 ClawHub 發佈者帳號代號。發佈者帳號代號可以使用小寫字母、數字、連字號、點號和底線；必須以小寫字母或數字開頭與結尾。
- Package slug 必須為小寫且 npm-safe，例如 `@example.tools/demo-plugin` 或 `demo-plugin`。

## 版本設定 + 標籤

- 每次發佈都會建立新版本（semver）。
- 標籤是指向版本的字串指標；常用 `latest`。

## 授權

- 所有發佈到 ClawHub 的 Skills 都以 `MIT-0` 授權。
- 任何人都可以使用、修改並重新散布已發佈的 Skills，包括商業用途。
- 不需要署名。
- 請勿在 `SKILL.md` 中加入衝突的授權條款；ClawHub 不支援逐 Skill 覆寫授權。

## 付費 Skills

- ClawHub 不支援付費 Skills、逐 Skill 定價、付費牆或收益分潤。
- 請勿將定價中繼資料加入 `SKILL.md`；它不是 Skill 格式的一部分，也不會讓已發佈的 Skill 變成付費。
- 如果你的 Skill 與付費第三方服務整合，請在 Skill 指示和環境變數宣告中清楚記錄外部費用與所需帳號（必要變數使用 `requires.env`，或選用變數使用帶有 `required: false` 的 `envVars`）。
