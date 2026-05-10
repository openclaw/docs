---
read_when:
    - 了解上架項目、版本、安裝、發布與審核
summary: ClawHub 清單、版本、安裝、發布、掃描與更新的運作方式。
x-i18n:
    generated_at: "2026-05-10T19:25:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4b995124c07d598a60897fa79fb61c4250a28f47d93d3bd62949f3a3364072e
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub 的運作方式

ClawHub 是 OpenClaw 技能和 Plugin 的登錄層。它為使用者提供探索套件的地方，為發布者提供發布版本的地方，並為 OpenClaw 提供足夠的中繼資料，以安全地安裝和更新這些套件。

## 登錄記錄

每個公開列表都是一筆登錄記錄，包含：

- 擁有者和 slug 或套件名稱
- 一個或多個已發布版本
- 中繼資料、摘要、檔案和來源歸屬
- 變更記錄和標籤資訊，例如 `latest`
- 下載、安裝、星標和留言訊號
- 安全掃描和審核狀態

列表頁面是使用者在安裝技能或 Plugin 前，檢視其宣稱功能的標準位置。

## Skills

技能是以 `SKILL.md` 為核心的版本化文字組合。它可以包含支援檔案、範例、範本和腳本。

ClawHub 會讀取 `SKILL.md` frontmatter，以了解技能名稱、描述、需求、環境變數和中繼資料。準確的中繼資料很重要，因為它能協助使用者判斷是否要安裝該技能，也能協助自動掃描偵測宣告行為與觀察行為之間的不一致。

請參閱 [技能格式](/zh-TW/clawhub/skill-format)。

## Plugins

Plugin 是封裝後的 OpenClaw 擴充功能。ClawHub 會儲存套件中繼資料、相容性資訊、來源連結、成品和版本記錄。

當 OpenClaw 從 ClawHub 安裝 Plugin 時，會先檢查其宣告的相容性中繼資料再進行安裝。套件記錄可以包含 API 相容性、最低 Gateway 版本、主機目標、環境需求和成品摘要。

如果你希望登錄成為事實來源，請使用明確的 ClawHub 安裝來源：

```bash
openclaw plugins install clawhub:<package>
```

## 發布

發布會建立新的不可變版本記錄。發布者會使用 `clawhub` CLI 進行已驗證的登錄工作流程：

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

使用 dry run 可在上傳前預覽已解析的 payload。公開頁面接著會顯示已發布的中繼資料、檔案、來源歸屬和掃描狀態。

## 安裝與更新

OpenClaw 安裝命令會將 ClawHub 作為套件來源：

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw 會記錄安裝來源中繼資料，讓後續更新能解析到同一個登錄套件。ClawHub CLI 也支援直接的技能安裝與更新工作流程，供希望在完整 OpenClaw 工作區之外管理登錄式技能資料夾的使用者使用。

## 安全狀態

ClawHub 開放發布，但版本仍會受到上傳關卡、自動檢查、使用者回報和審核人員處置的約束。

公開頁面會在可用時顯示掃描摘要。被保留、隱藏或封鎖的內容，可能會從公開搜尋和安裝流程中消失，但仍可由擁有者查看，以便診斷或申訴。

請參閱 [安全性與審核](/zh-TW/clawhub/security) 和
[可接受使用方式](/zh-TW/clawhub/acceptable-usage)。

## API 存取

ClawHub 會公開唯讀 API，用於探索、搜尋、套件詳細資料和下載。第三方目錄可以使用這些 API，前提是它們連回標準 ClawHub 列表、遵守速率限制，並避免暗示背書。

請參閱 [公開 API](/zh-TW/clawhub/api) 和 [HTTP API](/zh-TW/clawhub/http-api)。
