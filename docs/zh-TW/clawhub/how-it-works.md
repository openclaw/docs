---
read_when:
    - 瞭解清單、版本、安裝、發布與審核
summary: ClawHub 清單、版本、安裝、發布、掃描與更新的運作方式。
x-i18n:
    generated_at: "2026-05-12T23:28:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfd3614e9ddbcb167329e49a6fa92e32ca8d0a85235914a017452166ae49b594
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub 如何運作

ClawHub 是 OpenClaw Skills 和 Plugin 的登錄層。它提供使用者探索套件的位置、提供發布者發佈版本的位置，並提供 OpenClaw 足夠的中繼資料，以安全安裝和更新這些套件。

## 登錄記錄

每個公開列表都是一筆登錄記錄，包含：

- 擁有者與 slug 或套件名稱
- 一個或多個已發佈版本
- 中繼資料、摘要、檔案和來源歸屬
- 變更記錄與標籤資訊，例如 `latest`
- 下載、安裝、星標和留言訊號
- 安全掃描與審核狀態

列表頁是使用者在安裝前檢查某個 Skills 或 Plugin 聲稱用途的標準位置。

## Skills

Skills 是以 `SKILL.md` 為中心的版本化文字套件。它可以包含支援檔案、範例、範本和腳本。

ClawHub 會讀取 `SKILL.md` frontmatter，以了解 Skills 名稱、描述、需求、環境變數和中繼資料。準確的中繼資料很重要，因為它能幫助使用者判斷是否要安裝該 Skills，也能幫助自動化掃描偵測宣告行為與觀察到的行為之間的不一致。

請參閱 [Skills 格式](/zh-TW/clawhub/skill-format)。

## Plugin

Plugin 是已封裝的 OpenClaw 擴充功能。ClawHub 會儲存套件中繼資料、相容性資訊、來源連結、成品和版本記錄。

當 OpenClaw 從 ClawHub 安裝 Plugin 時，它會在安裝前檢查宣告的相容性中繼資料。套件記錄可以包含 API 相容性、最低 Gateway 版本、主機目標、環境需求和成品摘要。

當你希望登錄成為事實來源時，請使用明確的 ClawHub 安裝來源：

```bash
openclaw plugins install clawhub:<package>
```

## 發佈

發佈會建立新的不可變版本記錄。發布者會使用 `clawhub` CLI 執行已驗證的登錄工作流程：

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

使用試跑可在上傳前預覽解析後的有效負載。接著公開頁面會顯示已發佈的中繼資料、檔案、來源歸屬和掃描狀態。

## 安裝與更新

OpenClaw 安裝命令會使用 ClawHub 作為套件來源：

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw 會記錄安裝來源中繼資料，讓更新稍後可以解析同一個登錄套件。ClawHub CLI 也支援直接的 Skills 安裝與更新工作流程，供希望在完整 OpenClaw 工作區之外管理登錄式 Skills 資料夾的使用者使用。

## 安全狀態

ClawHub 開放發布，但發行版本仍需接受上傳門檻、自動化檢查、使用者回報和審核者處置。

公開頁面會在可用時顯示掃描摘要。被保留、隱藏或封鎖的內容可能會從公開搜尋與安裝流程中消失，但仍對擁有者可見，以便進行診斷。

請參閱 [安全性 + 審核](/zh-TW/clawhub/security) 和 [可接受使用方式](/zh-TW/clawhub/acceptable-usage)。

## API 存取

ClawHub 提供公開讀取 API，用於探索、搜尋、套件詳細資料和下載。第三方目錄可使用這些 API，但必須連回標準的 ClawHub 列表、遵守速率限制，並避免暗示背書。

請參閱 [Public API](/zh-TW/clawhub/api) 和 [HTTP API](/zh-TW/clawhub/http-api)。
