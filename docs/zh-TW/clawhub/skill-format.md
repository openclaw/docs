---
read_when:
    - 發布 Skills
    - 偵錯發布失敗
summary: Skills 資料夾格式、必要檔案、允許的檔案類型與限制。
x-i18n:
    generated_at: "2026-07-12T14:23:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 5759edf5f509d16335bcecaa96b3b64a0d3f430e473ede2211831ba062638a15
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Skill 格式

## 磁碟上的結構

Skill 是一個資料夾。

必要項目：

- `SKILL.md`（或 `skill.md`；也接受舊版的 `skills.md`）

選用項目：

- 任何輔助用的_文字型_檔案（請參閱「允許的檔案」）
- `.clawhubignore`（發布時使用的忽略模式，舊版為 `.clawdhubignore`）
- `.gitignore`（同樣會套用）

## GitHub 匯入

網頁版 GitHub 匯入工具比本機發布／同步更嚴格。它只會在已登入 GitHub 帳號擁有的公開、非分支儲存庫中探索 `SKILL.md` 或舊版 `skills.md` 檔案。它不會匯入私人儲存庫、分支儲存庫、已封存／停用的儲存庫，或第三方公開儲存庫。

本機安裝中繼資料（由命令列介面寫入）：

- `<skill>/.clawhub/origin.json`（舊版為 `.clawdhub`）

工作目錄安裝狀態（由命令列介面寫入）：

- `<workdir>/.clawhub/lock.json`（舊版為 `.clawdhub`）

## `SKILL.md`

- 使用 Markdown，可選擇加入 YAML frontmatter。
- 發布時，伺服器會從 frontmatter 擷取中繼資料。
- `description` 會用作 UI／搜尋中的 Skill 摘要。

為確保 Agent Skills 可移植，`name` 應與上層目錄名稱相符，並使用 1–64 個小寫字母、數字或連字號。ClawHub 會將可路由的 slug 與目錄顯示名稱分開保存，因此其他用戶端的現有名稱仍可發布，且不會被悄悄改寫。目錄清單可能會在視覺上縮短過長的名稱，但不會變更儲存的名稱。

## Frontmatter 中繼資料

Skill 中繼資料會在 `SKILL.md` 頂端的 YAML frontmatter 中宣告。這會告知登錄檔（以及安全性分析）你的 Skill 執行時需要哪些項目。

### 基本 frontmatter

```yaml
---
name: my-skill
description: 此 Skill 功能的簡短摘要。
version: 1.0.0
---
```

### 執行階段中繼資料（`metadata.openclaw`）

請在 `metadata.openclaw` 下宣告 Skill 的執行階段需求（別名：`metadata.clawdbot`、`metadata.clawdis`）。

```yaml
---
name: my-skill
description: 透過 Todoist API 管理工作。
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

對於 Skill 執行前必須存在的環境變數，請使用 `requires.env`。需要個別變數的中繼資料時，請使用 `envVars`，其中也包括設為 `required: false` 的選用變數。

### 完整欄位參考

| 欄位               | 類型       | 說明                                                                                                                                          |
| ------------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Skill 預期存在的必要環境變數。                                                                                                                |
| `requires.bins`    | `string[]` | 必須全部安裝的命令列介面二進位檔。                                                                                                            |
| `requires.anyBins` | `string[]` | 至少必須存在其中一個的命令列介面二進位檔。                                                                                                    |
| `requires.config`  | `string[]` | Skill 會讀取的設定檔路徑。                                                                                                                    |
| `primaryEnv`       | `string`   | Skill 的主要認證資訊環境變數。                                                                                                                |
| `envVars`          | `array`    | 環境變數宣告，包含 `name`、選用的 `required`，以及選用的 `description`。選用環境變數請設定 `required: false`。                                  |
| `always`           | `boolean`  | 若為 `true`，Skill 會永遠啟用（不需要明確安裝）。                                                                                             |
| `skillKey`         | `string`   | 覆寫 Skill 的叫用鍵。                                                                                                                         |
| `emoji`            | `string`   | Skill 的顯示表情符號。                                                                                                                        |
| `homepage`         | `string`   | Skill 首頁或文件的 URL。                                                                                                                      |
| `os`               | `string[]` | 作業系統限制（例如 `["macos"]`、`["linux"]`）。                                                                                               |
| `install`          | `array`    | 相依項目的安裝規格（請參閱下文）。                                                                                                            |
| `nix`              | `object`   | Nix 外掛規格（請參閱 README）。                                                                                                               |
| `config`           | `object`   | Clawdbot 設定規格（請參閱 README）。                                                                                                          |

### 安裝規格

如果你的 Skill 需要安裝相依項目，請在 `install` 陣列中宣告：

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

支援的安裝類型：`brew`、`node`、`go`、`uv`。

### 選用環境變數

請在 `metadata.openclaw.envVars` 下宣告選用環境變數，並設定 `required: false`。請勿將選用項目加入 `requires.env`，因為 `requires.env` 表示缺少這些項目時，Skill 無法執行。

```yaml
metadata:
  openclaw:
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: 用於已驗證請求的 Todoist API 權杖。
      - name: TODOIST_PROJECT_ID
        required: false
        description: 使用者未指定時使用的選用預設專案 ID。
```

### 這為何重要

ClawHub 的安全性分析會檢查 Skill 的宣告是否與其實際行為相符。如果程式碼參照 `TODOIST_API_KEY`，但 frontmatter 未在 `requires.env`、`primaryEnv` 或 `envVars` 下宣告它，分析就會標記中繼資料不符。維持宣告準確有助於 Skill 通過審查，也能協助使用者瞭解他們將安裝的內容。

### 範例：完整的 frontmatter

```yaml
---
name: todoist-cli
description: 從命令列管理 Todoist 工作、專案與標籤。
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
        description: Todoist API 權杖。
      - name: TODOIST_PROJECT_ID
        required: false
        description: 選用的預設專案 ID。
    emoji: "\u2705"
    homepage: https://github.com/example/todoist-cli
---
```

## 允許的檔案

發布時只接受「文字型」檔案。

- 副檔名允許清單位於 `packages/schema/src/textFiles.ts`（`TEXT_FILE_EXTENSIONS`）。
- 指令碼檔案在上傳後仍會進行掃描；PowerShell 的 `.ps1`、`.psm1` 和 `.psd1` 檔案會以文字檔接受。
- 以 `text/` 開頭的內容類型會視為文字；此外另有一份小型允許清單（JSON／YAML／TOML／JS／TS／Markdown／SVG）。

限制（伺服器端）：

- 套件總大小：50MB。
- 嵌入文字包含 `SKILL.md`，以及最多約 40 個非 `.md` 檔案（盡力而為的上限）。

## Slug

- 預設由資料夾名稱衍生。
- 套件作用域必須與 ClawHub 發布者代號完全相符。發布者代號可使用小寫字母、數字、連字號、句點和底線；開頭與結尾必須是小寫字母或數字。
- 套件 slug 必須為小寫且符合 npm 安全命名規則，例如 `@example.tools/demo-plugin` 或 `demo-plugin`。

## 版本控制與標籤

- 每次發布都會建立新版本（semver）。
- 標籤是指向版本的字串指標；通常使用 `latest`。

## 授權

- 所有發布至 ClawHub 的 Skills 均採用 `MIT-0` 授權。
- 任何人皆可使用、修改及重新散布已發布的 Skills，包括商業用途。
- 不要求標示出處。
- 請勿在 `SKILL.md` 中加入衝突的授權條款；ClawHub 不支援個別 Skill 的授權覆寫。

## 付費 Skills

- ClawHub 不支援付費 Skills、個別 Skill 定價、付費牆或收益分潤。
- 請勿在 `SKILL.md` 中加入定價中繼資料；這不屬於 Skill 格式，也不會讓已發布的 Skill 變成付費項目。
- 如果你的 Skill 整合了付費第三方服務，請在 Skill 說明與環境變數宣告中，清楚記錄外部費用及所需帳號（必要變數使用 `requires.env`，選用變數則使用設為 `required: false` 的 `envVars`）。
