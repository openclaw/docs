---
read_when:
    - 瞭解清單、版本、安裝、發布與審核
summary: ClawHub 清單、版本、安裝、發布、掃描和更新的運作方式。
x-i18n:
    generated_at: "2026-05-11T22:19:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfd3614e9ddbcb167329e49a6fa92e32ca8d0a85235914a017452166ae49b594
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub 如何運作

ClawHub 是 OpenClaw Skills 和 Plugin 的登錄層。它為使用者提供探索套件的位置，為發布者提供發行版本的位置，並為 OpenClaw 提供足夠的中繼資料，以安全地安裝和更新這些套件。

## 登錄記錄

每個公開列表都是一筆登錄記錄，包含：

- 擁有者與 slug 或套件名稱
- 一個或多個已發布版本
- 中繼資料、摘要、檔案與來源歸屬
- changelog 與標籤資訊，例如 `latest`
- 下載、安裝、星號與留言訊號
- 安全掃描與審核狀態

列表頁面是使用者在安裝前檢查某個 skill 或 Plugin 宣稱功能的標準位置。

## Skills

skill 是以 `SKILL.md` 為核心的版本化文字套件組。它可以包含支援檔案、範例、範本與 scripts。

ClawHub 會讀取 `SKILL.md` frontmatter，以了解 skill 名稱、描述、需求、環境變數與中繼資料。精確的中繼資料很重要，因為它能協助使用者判斷是否安裝該 skill，也能協助自動化掃描偵測宣告行為與觀察到的行為之間的不一致。

請參閱 [Skill 格式](/zh-TW/clawhub/skill-format)。

## Plugins

Plugin 是封裝後的 OpenClaw 擴充功能。ClawHub 會儲存套件中繼資料、相容性資訊、來源連結、artifact 與版本記錄。

當 OpenClaw 從 ClawHub 安裝 Plugin 時，它會先檢查公告的相容性中繼資料再安裝。套件記錄可以包含 API 相容性、最低 gateway 版本、主機目標、環境需求與 artifact digest。

當你希望登錄成為真實來源時，請使用明確的 ClawHub 安裝來源：

```bash
openclaw plugins install clawhub:<package>
```

## 發布

發布會建立新的不可變版本記錄。發布者使用 `clawhub` CLI 進行已驗證的登錄工作流程：

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

使用 dry run 在上傳前預覽解析後的 payload。接著，公開頁面會呈現已發布的中繼資料、檔案、來源歸屬與掃描狀態。

## 安裝與更新

OpenClaw 安裝命令會使用 ClawHub 作為套件來源：

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw 會記錄安裝來源中繼資料，讓更新之後可以解析相同的登錄套件。ClawHub CLI 也支援直接的 skill 安裝與更新工作流程，適用於想在完整 OpenClaw 工作區之外使用登錄管理 skill 資料夾的使用者。

## 安全狀態

ClawHub 開放發布，但發行版本仍需通過上傳 gate、自動化檢查、使用者回報與 moderator 動作。

公開頁面會在可用時顯示掃描摘要。被保留、隱藏或封鎖的內容可能會從公開搜尋與安裝流程中消失，同時仍對擁有者可見以供診斷。

請參閱 [安全性 + 審核](/zh-TW/clawhub/security) 和 [可接受使用方式](/zh-TW/clawhub/acceptable-usage)。

## API 存取

ClawHub 提供公開讀取 API，用於探索、搜尋、套件詳細資訊與下載。第三方目錄可以在連回標準 ClawHub 列表、遵守速率限制，並避免暗示背書的前提下使用這些 API。

請參閱 [Public API](/zh-TW/clawhub/api) 和 [HTTP API](/zh-TW/clawhub/http-api)。
