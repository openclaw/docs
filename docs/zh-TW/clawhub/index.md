---
read_when:
    - 說明 ClawHub 是什麼
    - 搜尋、安裝或更新 Skills 或外掛
    - 將 Skills 或外掛發佈到登錄檔
    - 在 openclaw 與 clawhub 命令列介面流程之間選擇
sidebarTitle: ClawHub
summary: 公開的 ClawHub 概覽，用於探索、安裝、發布、安全性，以及 clawhub 命令列介面。
title: ClawHub
x-i18n:
    generated_at: "2026-07-03T09:21:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub 是 OpenClaw skills 和外掛的公開登錄檔。

- 使用原生 `openclaw` 命令來搜尋、安裝及更新 skills，並從 ClawHub 安裝外掛。
- 使用獨立的 `clawhub` 命令列介面來處理登錄檔驗證、發布，以及刪除/還原刪除工作流程。

網站：[clawhub.ai](https://clawhub.ai)

## 快速開始

使用 OpenClaw 搜尋並安裝 skills：

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

使用 OpenClaw 搜尋並安裝外掛：

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

當你需要具備登錄檔驗證的工作流程，例如發布或刪除/還原刪除時，請安裝 ClawHub 命令列介面：

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub 託管的內容

| 介面           | 儲存內容                                                     | 典型命令                                     |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | 包含 `SKILL.md` 與支援檔案的版本化文字套件組合              | `openclaw skills install @openclaw/demo`     |
| 程式碼外掛     | 具有相容性中繼資料的 OpenClaw 外掛套件                      | `openclaw plugins install clawhub:<package>` |
| 套件組合外掛   | 用於 OpenClaw 發行的已封裝外掛套件組合                      | `clawhub package publish <source>`           |

ClawHub 追蹤 semver 版本、`latest` 等標籤、變更記錄、檔案、下載次數、星標，以及安全掃描摘要。公開頁面會顯示目前的登錄檔狀態，讓使用者能在安裝 skill 或外掛前進行檢查。

## 原生 OpenClaw 流程

原生 OpenClaw 命令會安裝到作用中的 OpenClaw 工作區，並保留來源中繼資料，讓後續更新命令能持續使用 ClawHub。

當外掛安裝應透過 ClawHub 解析時，請使用 `clawhub:<package>`。在啟動切換期間，裸露的 npm 安全外掛規格可能會透過 npm 解析，而當來源必須明確指定時，`npm:<package>` 會維持僅使用 npm。

外掛安裝會在封存檔安裝執行前，驗證宣告的 `pluginApi` 與 `minGatewayVersion` 相容性。當套件版本發布 ClawPack 成品時，OpenClaw 會優先使用確切上傳的 npm-pack `.tgz`，驗證 ClawHub 摘要標頭與下載位元組，並記錄成品中繼資料供後續更新使用。

## ClawHub 命令列介面

ClawHub 命令列介面用於需要登錄檔驗證的工作：

```bash
clawhub login
clawhub whoami
clawhub search "postgres backups"
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0
clawhub package explore --family code-plugin
clawhub package inspect episodic-claw
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

此命令列介面也提供 skill 安裝/更新命令，可用於直接的登錄檔工作流程：

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

這些命令會將 skills 安裝到目前工作目錄下的 `./skills`，並在 `.clawhub/lock.json` 中記錄已安裝版本。

## 發布

從包含 `SKILL.md` 的本機資料夾發布 skills：

```bash
clawhub skill publish <path>
```

常見發布選項：

- `--slug <slug>`：已發布 skill 的 URL 名稱。
- `--name <name>`：顯示名稱。
- `--version <version>`：semver 版本。
- `--changelog <text>`：變更記錄文字。
- `--tags <tags>`：以逗號分隔的標籤，預設為 `latest`。

從本機資料夾、`owner/repo`、`owner/repo@ref` 或 GitHub URL 發布外掛：

```bash
clawhub package publish <source>
```

使用 `--dry-run` 建立精確的發布計畫而不進行上傳，並使用 `--json` 取得適合 CI 的輸出。

程式碼外掛必須在 `package.json` 中包含必要的 OpenClaw 相容性中繼資料，包括 `openclaw.compat.pluginApi` 和 `openclaw.build.openclawVersion`。請參閱[命令列介面](/zh-TW/clawhub/cli)取得完整命令參考，並參閱[Skill 格式](/clawhub/skill-format)了解 skill 中繼資料。

## 安全與審核

ClawHub 預設是開放的：任何人都可以上傳，但發布需要 GitHub 帳戶足夠久以通過上傳門檻。公開詳細資料頁面會在安裝或下載前摘要最新掃描狀態。

ClawHub 會對已發布的 skills 和外掛版本執行自動化檢查。被掃描暫停或封鎖的版本可能會從公開型錄與安裝介面消失，但其擁有者仍可在 `/dashboard` 中看到。

已登入使用者可以檢舉 skills 和套件。審核人員可以審查檢舉、隱藏或還原內容，並封鎖濫用帳戶。請參閱[安全](/zh-TW/clawhub/security)、[安全稽核](/clawhub/security-audits)、[審核與帳戶安全](/clawhub/moderation)和[可接受使用](/clawhub/acceptable-usage)，了解政策與執行細節。

## 遙測與環境

當你在登入狀態下執行 `clawhub install` 時，命令列介面可能會盡力傳送安裝事件，讓 ClawHub 能計算彙總安裝次數。使用以下方式停用：

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

有用的環境覆寫：

| 變數                          | 效果                                              |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | 覆寫用於瀏覽器登入的網站 URL。                   |
| `CLAWHUB_REGISTRY`            | 覆寫登錄檔 API URL。                             |
| `CLAWHUB_CONFIG_PATH`         | 覆寫命令列介面儲存權杖/設定狀態的位置。          |
| `CLAWHUB_WORKDIR`             | 覆寫預設工作目錄。                               |
| `CLAWHUB_DISABLE_TELEMETRY=1` | 停用安裝遙測。                                   |

請參閱[遙測](/clawhub/telemetry)、[HTTP API](/clawhub/http-api)和[疑難排解](/zh-TW/clawhub/troubleshooting)，取得更深入的參考資料。
