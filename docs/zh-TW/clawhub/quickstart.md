---
read_when:
    - 第一次使用 ClawHub
    - 從登錄檔安裝 skill 或外掛
    - 發布到 ClawHub
summary: 開始使用 ClawHub：尋找、安裝、更新並發布 Skills 或外掛。
x-i18n:
    generated_at: "2026-06-28T22:32:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# 快速開始

ClawHub 是 OpenClaw 技能與外掛的登錄庫。

當你要將項目安裝到 OpenClaw 時，請使用 OpenClaw。當你要登入、發布、管理自己的列表，或使用登錄庫特定工作流程時，請使用 `clawhub` 命令列介面。

## 尋找並安裝技能

從 OpenClaw 搜尋：

```bash
openclaw skills search "calendar"
```

安裝技能：

```bash
openclaw skills install @openclaw/demo
```

更新已安裝的技能：

```bash
openclaw skills update --all
```

OpenClaw 會記錄技能的來源，讓後續更新可以繼續透過 ClawHub 解析。

## 尋找並安裝外掛

從 OpenClaw 搜尋：

```bash
openclaw plugins search "calendar"
```

使用明確的 ClawHub 來源安裝 ClawHub 託管的外掛：

```bash
openclaw plugins install clawhub:<package>
```

更新已安裝的外掛：

```bash
openclaw plugins update --all
```

當你希望 OpenClaw 透過 ClawHub 而不是 npm 或其他來源解析套件時，請使用 `clawhub:` 前綴。

## 登入以進行發布

安裝 ClawHub 命令列介面：

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

使用 GitHub 登入：

```bash
clawhub login
clawhub whoami
```

無頭環境可以使用來自 ClawHub 網頁介面的 API 權杖：

```bash
clawhub login --token clh_...
```

## 發布技能

技能是一個資料夾，其中包含必要的 `SKILL.md` 檔案，以及選用的支援檔案。

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

此命令會略過未變更的內容。新技能會從 `1.0.0` 開始；之後的變更會自動發布下一個修補版本。使用 `--dry-run` 預覽，或使用 `--version` 選擇明確版本。

發布前，請檢查 `SKILL.md` 中的中繼資料。宣告必要的環境變數、工具和權限，讓使用者在安裝前能了解技能需要什麼。請參閱[技能格式](/zh-TW/clawhub/skill-format)。

對於包含多個技能的儲存庫，可重複使用的 GitHub 工作流程會針對 `skills/` 下的每個直接技能資料夾呼叫 `skill publish`：

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## 發布外掛

從本機資料夾、GitHub 儲存庫、GitHub ref，或現有封存檔發布外掛：

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

先使用 `--dry-run` 預覽解析出的套件中繼資料、相容性欄位、來源標註和上傳計畫，而不進行發布。

程式碼外掛必須在 `package.json` 中包含 OpenClaw 相容性中繼資料，包括 `openclaw.compat.pluginApi` 和 `openclaw.build.openclawVersion`。

## 安裝前檢查

安裝前，請使用 ClawHub 網頁或命令列介面的詳細資料命令，檢查中繼資料、來源連結、版本、變更記錄和掃描狀態：

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

公開列表會顯示最新的掃描狀態。因審核而保留或封鎖的版本，可能會在解決前從搜尋和安裝介面中隱藏。
