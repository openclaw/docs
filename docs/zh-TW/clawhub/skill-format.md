---
read_when:
    - 發布 Skills
    - 偵錯發布失敗
summary: Skill 資料夾格式、必要檔案、允許的檔案類型、限制。
x-i18n:
    generated_at: "2026-06-28T00:11:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bbd17c0b7a5c4e6ad6c554bdd3f604424283990503a1c493f49000fbfbb29712
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Skill 格式

## 在磁碟上

一個 skill 是一個資料夾。

必要：

- `SKILL.md`（或 `skill.md`；也接受舊版 `skills.md`）

選用：

- 任何支援用的_文字型_檔案（見「允許的檔案」）
- `.clawhubignore`（發佈時的忽略模式，舊版為 `.clawdhubignore`）
- `.gitignore`（也會採用）

## GitHub 匯入

網頁版 GitHub 匯入器比本機發佈/同步更嚴格。它只會在已登入 GitHub 帳戶擁有的公開、非 fork 儲存庫中探索
`SKILL.md` 或舊版 `skills.md` 檔案。它不會匯入私有 repo、fork、
已封存/停用的 repo，或第三方公開 repo。

本機安裝中繼資料（由命令列介面寫入）：

- `<skill>/.clawhub/origin.json`（舊版 `.clawdhub`）

Workdir 安裝狀態（由命令列介面寫入）：

- `<workdir>/.clawhub/lock.json`（舊版 `.clawdhub`）

## `SKILL.md`

- Markdown，可選擇加入 YAML frontmatter。
- 伺服器在發佈時會從 frontmatter 擷取中繼資料。
- `description` 會在 UI/搜尋中用作 skill 摘要。

## Frontmatter 中繼資料

Skill 中繼資料會宣告在 `SKILL.md` 頂端的 YAML frontmatter 中。這會告訴 registry（以及安全性分析）你的 skill 執行時需要什麼。

### 基本 frontmatter

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### 執行階段中繼資料（`metadata.openclaw`）

在 `metadata.openclaw` 下宣告你的 skill 執行階段需求（別名：`metadata.clawdbot`、`metadata.clawdis`）。

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

針對 skill 執行前必須存在的環境變數使用 `requires.env`。當你需要逐一變數的中繼資料時，請使用 `envVars`，包含帶有 `required: false` 的選用變數。

### 完整欄位參考

| 欄位               | 型別       | 說明                                                                                                                                         |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | 你的 skill 預期存在的必要環境變數。                                                                                                          |
| `requires.bins`    | `string[]` | 必須全部安裝的命令列介面二進位檔。                                                                                                           |
| `requires.anyBins` | `string[]` | 至少必須存在其中一個的命令列介面二進位檔。                                                                                                   |
| `requires.config`  | `string[]` | 你的 skill 讀取的設定檔路徑。                                                                                                                |
| `primaryEnv`       | `string`   | 你的 skill 的主要憑證環境變數。                                                                                                              |
| `envVars`          | `array`    | 環境變數宣告，包含 `name`、選用的 `required`，以及選用的 `description`。針對選用環境變數設定 `required: false`。                            |
| `always`           | `boolean`  | 若為 `true`，skill 一律啟用（不需要明確安裝）。                                                                                              |
| `skillKey`         | `string`   | 覆寫 skill 的呼叫鍵。                                                                                                                        |
| `emoji`            | `string`   | Skill 的顯示 emoji。                                                                                                                         |
| `homepage`         | `string`   | Skill 首頁或文件的 URL。                                                                                                                     |
| `os`               | `string[]` | 作業系統限制（例如 `["macos"]`、`["linux"]`）。                                                                                              |
| `install`          | `array`    | 相依項目的安裝規格（見下方）。                                                                                                               |
| `nix`              | `object`   | Nix 外掛規格（見 README）。                                                                                                                  |
| `config`           | `object`   | Clawdbot 設定規格（見 README）。                                                                                                             |

### 安裝規格

如果你的 skill 需要安裝相依項目，請在 `install` 陣列中宣告：

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

在 `metadata.openclaw.envVars` 下宣告選用環境變數，並設定 `required: false`。不要將選用項目加入 `requires.env`，因為 `requires.env` 表示沒有它們時 skill 無法執行。

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

ClawHub 的安全性分析會檢查你的 skill 宣告內容是否符合它實際執行的行為。如果你的程式碼參照 `TODOIST_API_KEY`，但 frontmatter 未在 `requires.env`、`primaryEnv` 或 `envVars` 下宣告它，分析會標記為中繼資料不相符。保持宣告準確有助於你的 skill 通過審查，也能協助使用者了解他們正在安裝什麼。

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

- 擴充功能允許清單位於 `packages/schema/src/textFiles.ts`（`TEXT_FILE_EXTENSIONS`）。
- 指令碼檔案上傳後仍會被掃描；PowerShell `.ps1`、`.psm1` 和 `.psd1` 檔案會作為文字接受。
- 以 `text/` 開頭的內容類型會被視為文字；另外還有一小組允許清單（JSON/YAML/TOML/JS/TS/Markdown/SVG）。

限制（伺服器端）：

- 總 bundle 大小：50MB。
- 嵌入文字包含 `SKILL.md` + 最多約 40 個非 `.md` 檔案（best-effort 上限）。

## Slug

- 預設由資料夾名稱衍生。
- Package scope 必須與 ClawHub 發佈者 handle 完全相符。發佈者 handle 可使用小寫字母、數字、連字號、點和底線；必須以小寫字母或數字開頭與結尾。
- Package slug 必須是小寫且 npm-safe，例如 `@example.tools/demo-plugin` 或 `demo-plugin`。

## 版本控管 + 標籤

- 每次發佈都會建立新版本（semver）。
- 標籤是指向某個版本的字串指標；常用 `latest`。

## 授權

- 所有發佈在 ClawHub 上的 skills 均以 `MIT-0` 授權。
- 任何人都可以使用、修改及重新散布已發佈的 skills，包括商業用途。
- 不需要署名。
- 不要在 `SKILL.md` 中加入衝突的授權條款；ClawHub 不支援逐 skill 覆寫授權。

## 付費 skills

- ClawHub 不支援付費 skills、逐 skill 定價、付費牆或收益分潤。
- 不要將定價中繼資料加入 `SKILL.md`；它不是 skill 格式的一部分，也不會讓已發佈的 skill 變成付費。
- 如果你的 skill 整合付費第三方服務，請在 skill 指示和環境宣告中清楚記錄外部成本與必要帳戶（必要變數使用 `requires.env`，選用變數則使用帶有 `required: false` 的 `envVars`）。
