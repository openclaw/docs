---
read_when:
    - 了解清單、版本、安裝、發布與審核
summary: ClawHub 清單、版本、安裝、發布、掃描和更新的運作方式。
x-i18n:
    generated_at: "2026-05-11T20:23:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4b995124c07d598a60897fa79fb61c4250a28f47d93d3bd62949f3a3364072e
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub 的運作方式

ClawHub 是 OpenClaw Skills 和 Plugin 的註冊層。它讓使用者有地方探索套件，讓發布者有地方發布版本，也提供 OpenClaw 足夠的中繼資料，以安全地安裝和更新這些套件。

## 註冊記錄

每個公開列表都是一筆註冊記錄，包含：

- 擁有者與 slug 或套件名稱
- 一個或多個已發布版本
- 中繼資料、摘要、檔案與來源歸屬
- 變更記錄與標籤資訊，例如 `latest`
- 下載、安裝、星號與留言訊號
- 安全性掃描與審核狀態

列表頁面是使用者在安裝前檢視某個 Skills 或 Plugin 聲稱可執行內容的標準位置。

## Skills

Skills 是以 `SKILL.md` 為核心的版本化文字套件。它可以包含支援檔案、範例、範本和指令碼。

ClawHub 會讀取 `SKILL.md` frontmatter，以了解 Skills 名稱、描述、需求、環境變數與中繼資料。準確的中繼資料很重要，因為它能協助使用者判斷是否要安裝該 Skills，也能協助自動掃描偵測宣告行為與觀察到的行為之間的不一致。

請參閱 [Skills 格式](/zh-TW/clawhub/skill-format)。

## Plugin

Plugin 是封裝好的 OpenClaw 擴充功能。ClawHub 會儲存套件中繼資料、相容性資訊、來源連結、成品與版本記錄。

當 OpenClaw 從 ClawHub 安裝 Plugin 時，它會在安裝前檢查宣告的相容性中繼資料。套件記錄可以包含 API 相容性、最低 Gateway 版本、主機目標、環境需求與成品摘要。

當你希望註冊表作為可信來源時，請使用明確的 ClawHub 安裝來源：

```bash
openclaw plugins install clawhub:<package>
```

## 發布

發布會建立一筆新的不可變版本記錄。發布者會使用 `clawhub` CLI 執行經驗證的註冊表工作流程：

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

使用 dry run 在上傳前預覽解析後的承載內容。接著，公開頁面會呈現已發布的中繼資料、檔案、來源歸屬與掃描狀態。

## 安裝與更新

OpenClaw 安裝命令會使用 ClawHub 作為套件來源：

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw 會記錄安裝來源中繼資料，讓更新稍後可以解析到相同的註冊表套件。ClawHub CLI 也支援直接的 Skills 安裝與更新工作流程，供想在完整 OpenClaw 工作區外使用註冊表管理 Skills 資料夾的使用者使用。

## 安全性狀態

ClawHub 開放發布，但發行版本仍會受到上傳閘門、自動檢查、使用者回報與審核者動作的約束。

公開頁面會在可用時顯示掃描摘要。遭保留、隱藏或封鎖的內容，可能會從公開搜尋與安裝流程中消失，但仍對擁有者可見，以供診斷或申訴。

請參閱 [安全性 + 審核](/zh-TW/clawhub/security) 和
[可接受使用方式](/zh-TW/clawhub/acceptable-usage)。

## API 存取

ClawHub 會公開唯讀 API，供探索、搜尋、套件詳細資料與下載使用。第三方目錄可以使用這些 API，但必須連回標準的 ClawHub 列表、遵守速率限制，並避免暗示背書。

請參閱 [公開 API](/zh-TW/clawhub/api) 和 [HTTP API](/zh-TW/clawhub/http-api)。
