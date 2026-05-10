---
read_when:
    - 說明 ClawHub 是什麼
    - 搜尋、安裝或更新 Skills 或 Plugin
    - 將 Skills 或 Plugin 發布至登錄檔
    - 在 openclaw 與 clawhub CLI 流程之間選擇
sidebarTitle: ClawHub
summary: 公開的 ClawHub 概觀，涵蓋探索、安裝、發布、安全性與 clawhub CLI。
title: ClawHub
x-i18n:
    generated_at: "2026-05-10T19:25:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 023fec4cd9d6fce2f2da79d1f975ebda37b79c21a73c17aa1804f425527f3e40
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub 是 OpenClaw Skills 和 Plugin 的公開登錄庫。

- 使用原生 `openclaw` 命令搜尋、安裝和更新 Skills，以及從 ClawHub 安裝 Plugin。
- 使用獨立的 `clawhub` CLI 進行登錄庫驗證、發布、刪除/取消刪除、重新掃描與同步工作流程。

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

當你需要需要登錄庫驗證的工作流程，例如發布、同步、刪除/取消刪除，或擁有者要求的重新掃描時，請安裝 ClawHub CLI：

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub 託管的內容

| 介面           | 儲存內容                                                     | 典型命令                                     |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | 含有 `SKILL.md` 與支援檔案的版本化文字套件                  | `openclaw skills install <slug>`             |
| 程式碼 Plugin  | 具有相容性中繼資料的 OpenClaw Plugin 套件                   | `openclaw plugins install clawhub:<package>` |
| 套裝 Plugin    | 用於 OpenClaw 發行的已封裝 Plugin 套裝                      | `clawhub package publish <source>`           |
| Souls          | 顯示於 onlycrabs.ai 的 `SOUL.md` 套裝                        | Web 與 API 發布流程                         |

ClawHub 會追蹤 semver 版本、像 `latest` 這類標籤、變更記錄、檔案、下載次數、星標與安全掃描摘要。公開頁面會顯示目前的登錄庫狀態，讓使用者能在安裝技能或 Plugin 前先檢查。

## 原生 OpenClaw 流程

原生 OpenClaw 命令會安裝到作用中的 OpenClaw 工作區，並保留來源中繼資料，讓後續更新命令能繼續使用 ClawHub。

當 Plugin 安裝應透過 ClawHub 解析時，請使用 `clawhub:<package>`。裸 npm 安全 Plugin 規格可能會在啟動切換期間透過 npm 解析，而當來源必須明確時，`npm:<package>` 會維持僅使用 npm。

Plugin 安裝會先驗證宣告的 `pluginApi` 與 `minGatewayVersion` 相容性，再執行封存安裝。當套件版本發布 ClawPack 成品時，OpenClaw 會優先使用精確上傳的 npm-pack `.tgz`、驗證 ClawHub 摘要標頭與下載位元組，並記錄成品中繼資料以供後續更新使用。

## ClawHub CLI

ClawHub CLI 用於需要登錄庫驗證的工作：

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

CLI 也提供技能安裝/更新命令，用於直接登錄庫工作流程：

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

常見發布選項：

- `--slug <slug>`：技能 slug。
- `--name <name>`：顯示名稱。
- `--version <version>`：semver 版本。
- `--changelog <text>`：變更記錄文字。
- `--tags <tags>`：以逗號分隔的標籤，預設為 `latest`。

從本機資料夾、`owner/repo`、`owner/repo@ref` 或 GitHub URL 發布 Plugin：

```bash
clawhub package publish <source>
```

使用 `--dry-run` 建立精確的發布計畫而不會上傳，並使用 `--json` 取得適合 CI 的輸出。

程式碼 Plugin 必須在 `package.json` 中包含必要的 OpenClaw 相容性中繼資料，包括 `openclaw.compat.pluginApi` 與 `openclaw.build.openclawVersion`。完整命令參考請參閱 [CLI](/zh-TW/clawhub/cli)，技能中繼資料請參閱 [技能格式](/zh-TW/clawhub/skill-format)。

## 安全性與審核

ClawHub 預設開放：任何人都可以上傳，但發布需要 GitHub 帳號足夠久以通過上傳門檻。公開詳細頁面會在安裝或下載前摘要顯示最新掃描狀態。

ClawHub 會對已發布的 Skills 和 Plugin 版本執行自動檢查。被掃描保留或封鎖的版本可能會從公開目錄和安裝介面消失，但其擁有者仍可在 `/dashboard` 中看到。

擁有者可以要求有限度地重新掃描，以恢復誤判項目。平台版主與管理員在處理支援回報時，可以為任何技能或套件要求重新掃描：

```bash
clawhub skill rescan <slug>
clawhub package rescan <name>
```

已登入使用者可以回報 Skills 和套件。版主可以審查回報、隱藏或還原內容、處理申訴，以及封鎖濫用帳號。政策與執行細節請參閱 [可接受使用方式](/zh-TW/clawhub/acceptable-usage) 與 [安全性 + 審核](/zh-TW/clawhub/security)。

## 遙測與環境

當你在登入狀態執行 `clawhub sync` 時，CLI 會傳送最小快照，讓 ClawHub 能計算安裝次數。可使用下列方式停用：

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

實用的環境覆寫：

| 變數                          | 效果                                              |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | 覆寫用於瀏覽器登入的網站 URL。                   |
| `CLAWHUB_REGISTRY`            | 覆寫登錄庫 API URL。                             |
| `CLAWHUB_CONFIG_PATH`         | 覆寫 CLI 儲存權杖/設定狀態的位置。               |
| `CLAWHUB_WORKDIR`             | 覆寫預設工作目錄。                               |
| `CLAWHUB_DISABLE_TELEMETRY=1` | 停用 `sync` 的遙測。                             |

更深入的參考資料請參閱 [遙測](/zh-TW/clawhub/telemetry)、[HTTP API](/zh-TW/clawhub/http-api) 與 [疑難排解](/zh-TW/clawhub/troubleshooting)。
