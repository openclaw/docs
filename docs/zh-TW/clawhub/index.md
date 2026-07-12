---
read_when:
    - 說明 ClawHub 是什麼
    - 搜尋、安裝或更新 Skills 或外掛
    - 將 Skills 或外掛發佈至登錄檔
    - 在 openclaw 與 clawhub 命令列介面流程之間做選擇
sidebarTitle: ClawHub
summary: ClawHub 公開概覽，涵蓋探索、安裝、發布、安全性，以及 clawhub 命令列介面。
title: ClawHub
x-i18n:
    generated_at: "2026-07-12T14:21:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub 是 OpenClaw Skills 與外掛的公開登錄檔。

- 使用原生 `openclaw` 命令搜尋、安裝及更新 Skills，並從 ClawHub 安裝外掛。
- 使用獨立的 `clawhub` 命令列介面進行登錄檔驗證、發布，以及刪除／復原刪除工作流程。

網站：[clawhub.ai](https://clawhub.ai)

## 快速開始

使用 OpenClaw 搜尋並安裝 Skills：

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

若要使用需要登錄檔驗證的工作流程，例如發布或刪除／復原刪除，請安裝 ClawHub 命令列介面：

```bash
npm i -g clawhub
# 或
pnpm add -g clawhub
```

## ClawHub 託管的內容

| 類型           | 儲存的內容                                                     | 常用命令                                     |
| -------------- | -------------------------------------------------------------- | -------------------------------------------- |
| Skills         | 包含 `SKILL.md` 與支援檔案的版本化文字套件                     | `openclaw skills install @openclaw/demo`     |
| 程式碼外掛     | 含相容性中繼資料的 OpenClaw 外掛套件                            | `openclaw plugins install clawhub:<package>` |
| 套件組合外掛   | 為 OpenClaw 發行而封裝的外掛套件組合                            | `clawhub package publish <source>`           |

ClawHub 會追蹤 semver 版本、`latest` 等標籤、變更記錄、檔案、下載次數、星號，以及安全性掃描摘要。公開頁面會顯示目前的登錄檔狀態，讓使用者能在安裝前檢查 Skills 或外掛。

## 原生 OpenClaw 流程

原生 OpenClaw 命令會安裝至使用中的 OpenClaw 工作區，並保存來源中繼資料，讓後續更新命令能持續使用 ClawHub。

當外掛安裝應透過 ClawHub 解析時，請使用 `clawhub:<package>`。在發布切換期間，未加前綴且符合 npm 安全格式的外掛規格可能會透過 npm 解析；當來源必須明確指定時，`npm:<package>` 則會維持僅使用 npm。

外掛安裝會在執行封存檔安裝前，驗證所宣告的 `pluginApi` 與 `minGatewayVersion` 相容性。當套件版本發布 ClawPack 成品時，OpenClaw 會優先使用所上傳的確切 npm-pack `.tgz`、驗證 ClawHub 摘要標頭與下載的位元組，並記錄成品中繼資料以供後續更新使用。

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

此命令列介面也提供 Skills 安裝／更新命令，用於直接操作登錄檔的工作流程：

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

這些命令會將 Skills 安裝至目前工作目錄下的 `./skills`，並在 `.clawhub/lock.json` 中記錄已安裝的版本。

## 發布

從包含 `SKILL.md` 的本機資料夾發布 Skills：

```bash
clawhub skill publish <path>
```

常用發布選項：

- `--slug <slug>`：已發布 Skills 的 URL 名稱。
- `--name <name>`：顯示名稱。
- `--version <version>`：semver 版本。
- `--changelog <text>`：變更記錄文字。
- `--tags <tags>`：以逗號分隔的標籤，預設為 `latest`。

從本機資料夾、`owner/repo`、`owner/repo@ref` 或 GitHub URL 發布外掛：

```bash
clawhub package publish <source>
```

使用 `--dry-run` 建立確切的發布計畫而不上傳，並使用 `--json` 取得適合 CI 的輸出。

程式碼外掛的 `package.json` 必須包含必要的 OpenClaw 相容性中繼資料，包括 `openclaw.compat.pluginApi` 與 `openclaw.build.openclawVersion`。完整命令參考請參閱[命令列介面](/zh-TW/clawhub/cli)，Skills 中繼資料請參閱 [Skills 格式](/clawhub/skill-format)。

## 安全性與內容管理

ClawHub 預設為開放：任何人都能上傳，但發布者的 GitHub 帳號必須達到足夠的帳齡，才能通過上傳門檻。公開詳細資料頁面會在安裝或下載前摘要顯示最新的掃描狀態。

ClawHub 會對已發布的 Skills 與外掛版本執行自動化檢查。因掃描而遭保留或封鎖的版本可能會從公開目錄及安裝介面中消失，但其擁有者仍可在 `/dashboard` 中看到。

已登入的使用者可以檢舉 Skills 與套件。管理員可以審查檢舉、隱藏或還原內容，並封鎖濫用帳號。政策與執行詳情請參閱[安全性](/zh-TW/clawhub/security)、[安全性稽核](/clawhub/security-audits)、[內容管理與帳號安全](/clawhub/moderation)，以及[可接受使用方式](/clawhub/acceptable-usage)。

## 遙測與環境

登入狀態下執行 `clawhub install` 時，命令列介面可能會盡力傳送安裝事件，讓 ClawHub 能計算彙總安裝次數。可透過以下設定停用：

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

實用的環境覆寫設定：

| 變數                          | 效果                                              |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | 覆寫瀏覽器登入所使用的網站 URL。                  |
| `CLAWHUB_REGISTRY`            | 覆寫登錄檔 API URL。                              |
| `CLAWHUB_CONFIG_PATH`         | 覆寫命令列介面儲存權杖／設定狀態的位置。          |
| `CLAWHUB_WORKDIR`             | 覆寫預設工作目錄。                                |
| `CLAWHUB_DISABLE_TELEMETRY=1` | 停用安裝遙測。                                    |

如需更深入的參考資料，請參閱[遙測](/clawhub/telemetry)、[HTTP API](/clawhub/http-api) 與[疑難排解](/zh-TW/clawhub/troubleshooting)。
