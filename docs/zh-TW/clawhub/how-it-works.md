---
read_when:
    - 了解清單、版本、安裝、發布與審核
summary: ClawHub 上架項目、版本、安裝、發布、掃描與更新的運作方式。
x-i18n:
    generated_at: "2026-05-13T02:51:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfd3614e9ddbcb167329e49a6fa92e32ca8d0a85235914a017452166ae49b594
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub 如何運作

ClawHub 是 OpenClaw Skills 與 Plugin 的註冊層。它提供使用者探索套件的地方，提供發布者發布版本的地方，並提供 OpenClaw 足夠的中繼資料，以安全地安裝與更新這些套件。

## 註冊記錄

每個公開列表都是一筆註冊記錄，包含：

- 擁有者與 slug 或套件名稱
- 一個或多個已發布版本
- 中繼資料、摘要、檔案與來源歸屬
- 變更記錄與標籤資訊，例如 `latest`
- 下載、安裝、加星與留言訊號
- 安全掃描與審核狀態

列表頁面是使用者在安裝前檢查 Skills 或 Plugin 宣稱用途的標準位置。

## Skills

Skill 是以 `SKILL.md` 為中心的版本化文字套件。它可以包含支援檔案、範例、範本與指令碼。

ClawHub 會讀取 `SKILL.md` frontmatter，以了解 Skill 名稱、說明、需求、環境變數與中繼資料。精確的中繼資料很重要，因為它能協助使用者判斷是否要安裝該 Skill，也能協助自動掃描偵測宣告行為與觀察到的行為之間的不一致。

請參閱 [Skill 格式](/zh-TW/clawhub/skill-format)。

## Plugin

Plugin 是封裝好的 OpenClaw 擴充功能。ClawHub 會儲存套件中繼資料、相容性資訊、原始碼連結、成品與版本記錄。

當 OpenClaw 從 ClawHub 安裝 Plugin 時，會先檢查公告的相容性中繼資料再安裝。套件記錄可以包含 API 相容性、最低 Gateway 版本、主機目標、環境需求與成品摘要。

當你希望註冊庫成為事實來源時，請使用明確的 ClawHub 安裝來源：

```bash
openclaw plugins install clawhub:<package>
```

## 發布

發布會建立新的不可變版本記錄。發布者會使用 `clawhub` CLI 執行經驗證的註冊庫工作流程：

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

使用試執行可在上傳前預覽已解析的承載。接著公開頁面會呈現已發布的中繼資料、檔案、來源歸屬與掃描狀態。

## 安裝與更新

OpenClaw 安裝命令會使用 ClawHub 作為套件來源：

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw 會記錄安裝來源中繼資料，讓更新之後可以解析到相同的註冊庫套件。ClawHub CLI 也支援直接的 Skill 安裝與更新工作流程，適合想在完整 OpenClaw 工作區之外使用註冊庫管理 Skill 資料夾的使用者。

## 安全狀態

ClawHub 開放發布，但版本仍須經過上傳閘門、自動檢查、使用者回報與審核者處置。

公開頁面會在可用時顯示掃描摘要。遭保留、隱藏或封鎖的內容可能會從公開搜尋與安裝流程中消失，同時仍對擁有者可見以供診斷。

請參閱 [安全性與審核](/zh-TW/clawhub/security) 以及
[可接受使用方式](/zh-TW/clawhub/acceptable-usage)。

## API 存取

ClawHub 提供公開讀取 API，用於探索、搜尋、套件詳細資料與下載。第三方目錄可以使用這些 API，前提是連回標準 ClawHub 列表、遵守速率限制，並避免暗示背書。

請參閱 [公開 API](/zh-TW/clawhub/api) 以及 [HTTP API](/zh-TW/clawhub/http-api)。
