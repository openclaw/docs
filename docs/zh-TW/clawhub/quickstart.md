---
read_when:
    - 首次使用 ClawHub
    - 從登錄檔安裝 Skills 或 Plugin
    - 發布到 ClawHub
summary: 開始使用 ClawHub：尋找、安裝、更新及發布 Skills 或 Plugin。
x-i18n:
    generated_at: "2026-05-12T23:29:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# 快速入門

ClawHub 是 OpenClaw Skills 與 Plugin 的註冊中心。

當你要將項目安裝到 OpenClaw 中時，請使用 OpenClaw。當你要登入、發布、管理自己的清單，或使用註冊中心專屬工作流程時，請使用 `clawhub` CLI。

## 尋找並安裝 Skills

從 OpenClaw 搜尋：

```bash
openclaw skills search "calendar"
```

安裝 Skills：

```bash
openclaw skills install <skill-slug>
```

更新已安裝的 Skills：

```bash
openclaw skills update --all
```

OpenClaw 會記錄 Skills 的來源，因此之後更新時可以繼續透過 ClawHub 解析。

## 尋找並安裝 Plugin

從 OpenClaw 搜尋：

```bash
openclaw plugins search "calendar"
```

使用明確的 ClawHub 來源安裝 ClawHub 託管的 Plugin：

```bash
openclaw plugins install clawhub:<package>
```

更新已安裝的 Plugin：

```bash
openclaw plugins update --all
```

當你希望 OpenClaw 透過 ClawHub 而不是 npm 或其他來源解析套件時，請使用 `clawhub:` 前綴。

## 登入以便發布

安裝 ClawHub CLI：

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

無介面環境可以使用 ClawHub 網頁 UI 中的 API token：

```bash
clawhub login --token clh_...
```

## 發布 Skills

Skills 是一個資料夾，其中包含必要的 `SKILL.md` 檔案，以及選用的支援檔案。

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --changelog "Initial release"
```

發布前，請檢查 `SKILL.md` 中的中繼資料。宣告必要的環境變數、工具與權限，讓使用者在安裝前了解此 Skills 需要什麼。請參閱 [Skills 格式](/zh-TW/clawhub/skill-format)。

## 發布 Plugin

從本機資料夾、GitHub repo、GitHub ref 或現有封存檔發布 Plugin：

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

請先使用 `--dry-run` 預覽已解析的套件中繼資料、相容性欄位、來源歸屬與上傳計畫，而不進行發布。

程式碼 Plugin 必須在 `package.json` 中包含 OpenClaw 相容性中繼資料，包括 `openclaw.compat.pluginApi` 和 `openclaw.build.openclawVersion`。

## 同步你維護的 Skills

`sync` 會掃描 Skills 資料夾，並發布尚未同步的新 Skills 或已變更的 Skills。

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

登入後，`sync` 也可能會傳送最小化的安裝快照，用於彙總安裝次數。請參閱 [遙測](/zh-TW/clawhub/telemetry)，了解會回報哪些內容以及如何退出。

## 安裝前檢查

安裝前，請使用 ClawHub 網頁或 CLI 詳細資訊命令來檢查中繼資料、來源連結、版本、變更記錄與掃描狀態：

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

公開清單會顯示最新的掃描狀態。受到審核保留或封鎖的發行版本，可能會在解決前從搜尋與安裝介面中隱藏。
