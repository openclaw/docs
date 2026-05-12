---
read_when:
    - 說明 ClawHub 是什麼
    - 搜尋、安裝或更新 Skills 或 Plugin
    - 將 Skills 或 Plugin 發布到登錄庫
    - 在 openclaw 與 clawhub CLI 流程之間選擇
sidebarTitle: ClawHub
summary: 用於探索、安裝、發布、安全性和 clawhub CLI 的公開 ClawHub 概覽。
title: ClawHub
x-i18n:
    generated_at: "2026-05-12T00:57:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0543f0565d2768e9fd77270851eb1043d252071572ff5cd5c70a5e7e38abf149
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub 是 OpenClaw Skills 和 Plugin 的公開登錄檔。

- 使用原生 `openclaw` 命令搜尋、安裝和更新 Skills，以及從 ClawHub 安裝 Plugin。
- 使用獨立的 `clawhub` CLI 進行登錄檔驗證、發布、刪除/復原刪除，以及同步工作流程。

網站：[clawhub.ai](https://clawhub.ai)

## 快速開始

使用 OpenClaw 搜尋並安裝 Skills：

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

使用 OpenClaw 搜尋並安裝 Plugin：

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

當你需要發布、同步或刪除/復原刪除等需要登錄檔驗證的工作流程時，請安裝 ClawHub CLI：

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub 託管的內容

| 介面           | 儲存內容                                                     | 典型命令                                     |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | 含 `SKILL.md` 與支援檔案的版本化文字套件                     | `openclaw skills install <slug>`             |
| 程式碼 Plugin  | 含相容性中繼資料的 OpenClaw Plugin 套件                      | `openclaw plugins install clawhub:<package>` |
| Bundle Plugin  | 用於 OpenClaw 發行的已封裝 Plugin Bundle                     | `clawhub package publish <source>`           |
| Souls          | 僅顯示於 onlycrabs.ai 的 `SOUL.md` 套件                      | Web 和 API 發布流程                          |

ClawHub 追蹤 semver 版本、`latest` 等標籤、變更記錄、檔案、下載次數、星標，以及安全掃描摘要。公開頁面會顯示目前登錄檔狀態，讓使用者在安裝 Skill 或 Plugin 前先行檢查。

## 原生 OpenClaw 流程

原生 OpenClaw 命令會安裝到作用中的 OpenClaw 工作區，並保留來源中繼資料，讓後續更新命令可以持續使用 ClawHub。

當 Plugin 安裝應透過 ClawHub 解析時，請使用 `clawhub:<package>`。裸露的 npm 安全 Plugin 規格在啟動切換期間可能會透過 npm 解析；當來源必須明確時，`npm:<package>` 會維持僅使用 npm。

Plugin 安裝會在封存安裝執行前，驗證宣告的 `pluginApi` 和 `minGatewayVersion` 相容性。當套件版本發布 ClawPack Artifact 時，OpenClaw 會優先使用精確上傳的 npm-pack `.tgz`，驗證 ClawHub 摘要標頭與下載位元組，並記錄 Artifact 中繼資料以供後續更新使用。

## ClawHub CLI

ClawHub CLI 用於需要登錄檔驗證的工作：

```bash
clawhub login
clawhub whoami
clawhub search "postgres backups"
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0
clawhub package explore --family code-plugin
clawhub package inspect episodic-claw
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub sync --all
```

CLI 也提供用於直接登錄檔工作流程的 Skill 安裝/更新命令：

```bash
clawhub install <slug>
clawhub update <slug>
clawhub update --all
clawhub list
```

這些命令會將 Skills 安裝到目前工作目錄下的 `./skills`，並在 `.clawhub/lock.json` 記錄已安裝版本。

## 發布

從包含 `SKILL.md` 的本機資料夾發布 Skills：

```bash
clawhub skill publish <path>
```

常用發布選項：

- `--slug <slug>`：Skill slug。
- `--name <name>`：顯示名稱。
- `--version <version>`：semver 版本。
- `--changelog <text>`：變更記錄文字。
- `--tags <tags>`：以逗號分隔的標籤，預設為 `latest`。

從本機資料夾、`owner/repo`、`owner/repo@ref` 或 GitHub URL 發布 Plugin：

```bash
clawhub package publish <source>
```

使用 `--dry-run` 可在不上傳的情況下建置精確的發布計畫，使用 `--json` 可取得適合 CI 的輸出。

程式碼 Plugin 必須在 `package.json` 中包含必要的 OpenClaw 相容性中繼資料，包括 `openclaw.compat.pluginApi` 和 `openclaw.build.openclawVersion`。完整命令參考請參閱 [CLI](/zh-TW/clawhub/cli)，Skill 中繼資料請參閱 [Skill 格式](/zh-TW/clawhub/skill-format)。

## 安全性與審核

ClawHub 預設開放：任何人都可以上傳，但發布需要一個足夠舊、能通過上傳門檻的 GitHub 帳戶。公開詳細資料頁會在安裝或下載前摘要最新掃描狀態。

ClawHub 會對已發布的 Skills 和 Plugin 發行版本執行自動化檢查。被掃描保留或封鎖的發行版本可能會從公開目錄與安裝介面中消失，但仍會在 `/dashboard` 中對其擁有者可見。

已登入的使用者可以檢舉 Skills 和套件。審核者可以審查檢舉、隱藏或還原內容，以及封鎖濫用帳戶。政策與執行細節請參閱 [可接受使用方式](/zh-TW/clawhub/acceptable-usage) 和 [安全性 + 審核](/zh-TW/clawhub/security)。

## 遙測與環境

當你在已登入狀態下執行 `clawhub sync` 時，CLI 會傳送最小快照，讓 ClawHub 可以計算安裝次數。使用以下方式停用：

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

實用的環境覆寫：

| 變數                          | 效果                                              |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | 覆寫用於瀏覽器登入的網站 URL。                   |
| `CLAWHUB_REGISTRY`            | 覆寫登錄檔 API URL。                             |
| `CLAWHUB_CONFIG_PATH`         | 覆寫 CLI 儲存權杖/設定狀態的位置。               |
| `CLAWHUB_WORKDIR`             | 覆寫預設工作目錄。                               |
| `CLAWHUB_DISABLE_TELEMETRY=1` | 停用 `sync` 的遙測。                             |

更深入的參考資料請參閱 [遙測](/zh-TW/clawhub/telemetry)、[HTTP API](/zh-TW/clawhub/http-api) 和 [疑難排解](/zh-TW/clawhub/troubleshooting)。
