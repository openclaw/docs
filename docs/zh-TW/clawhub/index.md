---
read_when:
    - 說明 ClawHub 是什麼
    - 搜尋、安裝或更新 Skills 或外掛
    - 將 Skills 或外掛發布到登錄檔
    - 在 openclaw 與 clawhub 命令列介面流程之間選擇
sidebarTitle: ClawHub
summary: 供探索、安裝、發布、安全性與 clawhub 命令列介面使用的公開 ClawHub 概覽。
title: ClawHub
x-i18n:
    generated_at: "2026-07-05T20:17:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub 是 OpenClaw Skills 與外掛的公開登錄檔。

- 使用原生 `openclaw` 命令搜尋、安裝與更新 Skills，並從 ClawHub 安裝外掛。
- 使用獨立的 `clawhub` 命令列介面處理登錄檔驗證、發布，以及刪除/取消刪除工作流程。

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

當你需要登錄檔驗證的工作流程，例如發布或刪除/取消刪除時，請安裝 ClawHub 命令列介面：

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub 託管的內容

| 介面           | 儲存內容                                                   | 典型命令                                     |
| -------------- | ---------------------------------------------------------- | -------------------------------------------- |
| Skills         | 含有 `SKILL.md` 與支援檔案的版本化文字套件組              | `openclaw skills install @openclaw/demo`     |
| 程式碼外掛     | 含有相容性中繼資料的 OpenClaw 外掛套件                    | `openclaw plugins install clawhub:<package>` |
| 套件組外掛     | 用於 OpenClaw 發行的已封裝外掛套件組                      | `clawhub package publish <source>`           |

ClawHub 追蹤 semver 版本、如 `latest` 的標籤、變更記錄、檔案、
下載次數、星標，以及安全性掃描摘要。公開頁面會顯示目前的登錄檔
狀態，讓使用者在安裝技能或外掛前可以先檢查。

## 原生 OpenClaw 流程

原生 OpenClaw 命令會安裝到作用中的 OpenClaw 工作區，並保留
來源中繼資料，讓之後的更新命令可以繼續使用 ClawHub。

當外掛安裝應透過 ClawHub 解析時，請使用 `clawhub:<package>`。
裸露的 npm 安全外掛規格可能會在啟動切換期間透過 npm 解析，而
當來源必須明確時，`npm:<package>` 會維持僅使用 npm。

外掛安裝會在封存安裝執行前，驗證宣告的 `pluginApi` 與 `minGatewayVersion`
相容性。當套件版本發布 ClawPack 成品時，OpenClaw 會偏好精確上傳的
npm-pack `.tgz`，驗證 ClawHub 摘要標頭與下載的位元組，並記錄成品中繼資料供
之後更新使用。

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

命令列介面也提供技能安裝/更新命令，用於直接的登錄檔工作流程：

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

這些命令會將 Skills 安裝到目前工作目錄下的 `./skills`，
並在 `.clawhub/lock.json` 中記錄已安裝版本。

## 發布

從含有 `SKILL.md` 的本機資料夾發布 Skills：

```bash
clawhub skill publish <path>
```

常用發布選項：

- `--slug <slug>`：已發布 Skills 的 URL 名稱。
- `--name <name>`：顯示名稱。
- `--version <version>`：semver 版本。
- `--changelog <text>`：變更記錄文字。
- `--tags <tags>`：逗號分隔的標籤，預設為 `latest`。

從本機資料夾、`owner/repo`、`owner/repo@ref`，或 GitHub
URL 發布外掛：

```bash
clawhub package publish <source>
```

使用 `--dry-run` 建立精確的發布計畫而不上傳，並使用 `--json`
取得適合 CI 的輸出。

程式碼外掛必須在 `package.json` 中包含必要的 OpenClaw 相容性中繼資料，
包括 `openclaw.compat.pluginApi` 與
`openclaw.build.openclawVersion`。完整命令參考請見 [命令列介面](/zh-TW/clawhub/cli)，
Skills 中繼資料請見 [Skill 格式](/clawhub/skill-format)。

## 安全性與審核

ClawHub 預設開放：任何人都可以上傳，但發布需要 GitHub
帳戶存在時間足以通過上傳門檻。公開詳細資料頁會在安裝或下載前摘要
最新掃描狀態。

ClawHub 會對已發布的 Skills 與外掛版本執行自動化檢查。被掃描暫留
或封鎖的版本可能會從公開目錄與安裝介面消失，但仍會在其擁有者的
`/dashboard` 中可見。

已登入使用者可以回報 Skills 與套件。審核者可以審查回報、
隱藏或還原內容，並封鎖濫用帳戶。政策與執行細節請見
[安全性](/zh-TW/clawhub/security)、
[安全性稽核](/clawhub/security-audits)、
[審核與帳戶安全](/clawhub/moderation)，以及
[可接受使用方式](/zh-TW/clawhub/acceptable-usage)。

## 遙測與環境

當你在已登入狀態執行 `clawhub install` 時，命令列介面可能會盡力傳送
安裝事件，讓 ClawHub 可以計算彙總安裝次數。使用以下方式停用：

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

實用的環境覆寫：

| 變數                          | 效果                                              |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | 覆寫用於瀏覽器登入的網站 URL。                   |
| `CLAWHUB_REGISTRY`            | 覆寫登錄檔 API URL。                             |
| `CLAWHUB_CONFIG_PATH`         | 覆寫命令列介面儲存權杖/設定狀態的位置。          |
| `CLAWHUB_WORKDIR`             | 覆寫預設工作目錄。                               |
| `CLAWHUB_DISABLE_TELEMETRY=1` | 停用安裝遙測。                                   |

更深入的參考資料請見 [遙測](/clawhub/telemetry)、[HTTP API](/clawhub/http-api)，以及
[疑難排解](/zh-TW/clawhub/troubleshooting)。
