---
read_when:
    - 說明 ClawHub 是什麼
    - 搜尋、安裝或更新 Skills 或 Plugin
    - 將 Skills 或 Plugin 發布到登錄庫
    - 在 openclaw 與 clawhub CLI 流程之間選擇
sidebarTitle: ClawHub
summary: 公開的 ClawHub 概觀，涵蓋探索、安裝、發布、安全性，以及 clawhub CLI。
title: ClawHub
x-i18n:
    generated_at: "2026-05-13T04:18:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0543f0565d2768e9fd77270851eb1043d252071572ff5cd5c70a5e7e38abf149
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub 是 OpenClaw Skills 和插件的公開註冊表。

- 使用原生 `openclaw` 命令搜尋、安裝和更新 Skills，並從 ClawHub 安裝插件。
- 使用獨立的 `clawhub` CLI 進行註冊表驗證、發布、刪除/取消刪除和同步工作流程。

網站：[clawhub.ai](https://clawhub.ai)

## 快速開始

使用 OpenClaw 搜尋和安裝 Skills：

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

使用 OpenClaw 搜尋和安裝插件：

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

當你需要註冊表驗證工作流程時，請安裝 ClawHub CLI，例如發布、同步或刪除/取消刪除：

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub 託管的內容

| 表面           | 儲存內容                                                     | 典型命令                                     |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | 包含 `SKILL.md` 與支援檔案的版本化文字套件                  | `openclaw skills install <slug>`             |
| 程式碼插件     | 帶有相容性中繼資料的 OpenClaw 插件套件                      | `openclaw plugins install clawhub:<package>` |
| 套件組合插件   | 用於 OpenClaw 發行的封裝插件套件                            | `clawhub package publish <source>`           |
| Souls          | 顯示於 onlycrabs.ai 的 `SOUL.md` 套件                        | Web 和 API 發布流程                         |

ClawHub 會追蹤 semver 版本、`latest` 等標籤、變更記錄、檔案、下載次數、星標，以及安全掃描摘要。公開頁面會顯示目前的註冊表狀態，讓使用者在安裝 Skill 或插件前可以檢查。

## 原生 OpenClaw 流程

原生 OpenClaw 命令會安裝到作用中的 OpenClaw 工作區，並保存來源中繼資料，讓後續更新命令可以繼續使用 ClawHub。

當插件安裝應透過 ClawHub 解析時，請使用 `clawhub:<package>`。裸 npm 安全插件規格在啟動切換期間可能會透過 npm 解析，而當來源必須明確時，`npm:<package>` 會保持僅使用 npm。

插件安裝會在封存安裝執行前，驗證宣告的 `pluginApi` 和 `minGatewayVersion` 相容性。當套件版本發布 ClawPack 成品時，OpenClaw 會優先使用確切上傳的 npm-pack `.tgz`，驗證 ClawHub 摘要標頭和下載位元組，並記錄成品中繼資料供後續更新使用。

## ClawHub CLI

ClawHub CLI 用於需要註冊表驗證的工作：

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

CLI 也提供 Skill 安裝/更新命令，可用於直接的註冊表工作流程：

```bash
clawhub install <slug>
clawhub update <slug>
clawhub update --all
clawhub list
```

這些命令會將 Skills 安裝到目前工作目錄下的 `./skills`，並在 `.clawhub/lock.json` 中記錄已安裝版本。

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

從本機資料夾、`owner/repo`、`owner/repo@ref` 或 GitHub URL 發布插件：

```bash
clawhub package publish <source>
```

使用 `--dry-run` 建置確切的發布計畫而不上傳，並使用 `--json` 取得適合 CI 的輸出。

程式碼插件必須在 `package.json` 中包含必要的 OpenClaw 相容性中繼資料，包括 `openclaw.compat.pluginApi` 和 `openclaw.build.openclawVersion`。完整命令參考請參閱 [CLI](/zh-TW/clawhub/cli)，Skill 中繼資料請參閱 [Skill 格式](/zh-TW/clawhub/skill-format)。

## 安全性與審核

ClawHub 預設為開放：任何人都可以上傳，但發布需要 GitHub 帳號夠舊才能通過上傳閘門。公開詳細資料頁面會在安裝或下載前摘要最新掃描狀態。

ClawHub 會對已發布的 Skills 和插件版本執行自動檢查。被掃描保留或封鎖的版本可能會從公開目錄和安裝表面消失，但其擁有者仍可在 `/dashboard` 中看見。

已登入使用者可以檢舉 Skills 和套件。審核者可以審查檢舉、隱藏或還原內容，並封鎖濫用帳號。政策與執行細節請參閱 [可接受使用](/zh-TW/clawhub/acceptable-usage) 和 [安全性 + 審核](/zh-TW/clawhub/security)。

## 遙測與環境

當你在登入狀態執行 `clawhub sync` 時，CLI 會傳送最小快照，讓 ClawHub 可以計算安裝數量。可用以下方式停用：

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

實用的環境覆寫：

| 變數                          | 效果                                              |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | 覆寫用於瀏覽器登入的網站 URL。                   |
| `CLAWHUB_REGISTRY`            | 覆寫註冊表 API URL。                             |
| `CLAWHUB_CONFIG_PATH`         | 覆寫 CLI 儲存 token/設定狀態的位置。             |
| `CLAWHUB_WORKDIR`             | 覆寫預設工作目錄。                               |
| `CLAWHUB_DISABLE_TELEMETRY=1` | 停用 `sync` 的遙測。                             |

更深入的參考資料請參閱 [遙測](/zh-TW/clawhub/telemetry)、[HTTP API](/zh-TW/clawhub/http-api) 和 [疑難排解](/zh-TW/clawhub/troubleshooting)。
