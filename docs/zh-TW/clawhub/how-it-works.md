---
read_when:
    - 了解上架項目、版本、安裝、發布與審核
summary: ClawHub 清單、版本、安裝、發布、掃描與更新的運作方式。
x-i18n:
    generated_at: "2026-05-13T04:17:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfd3614e9ddbcb167329e49a6fa92e32ca8d0a85235914a017452166ae49b594
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub 如何運作

ClawHub 是 OpenClaw Skills 和 Plugin 的註冊庫層。它提供使用者一個探索套件的地方，提供發布者一個發布版本的地方，並提供 OpenClaw 足夠的中繼資料，以安全地安裝和更新這些套件。

## 註冊庫記錄

每個公開清單都是一筆註冊庫記錄，包含：

- 擁有者和 slug 或套件名稱
- 一個或多個已發布版本
- 中繼資料、摘要、檔案和來源歸屬
- 變更記錄，以及像 `latest` 這類標籤資訊
- 下載、安裝、星標和評論訊號
- 安全掃描和審核狀態

清單頁面是使用者在安裝前檢視某個 skill 或 Plugin 聲稱功能的標準位置。

## Skills

skill 是以 `SKILL.md` 為核心的版本化文字組合。它可以包含支援檔案、範例、範本和指令碼。

ClawHub 會讀取 `SKILL.md` frontmatter，以了解 skill 名稱、描述、需求、環境變數和中繼資料。準確的中繼資料很重要，因為它能協助使用者決定是否安裝該 skill，也能協助自動掃描偵測宣告行為與觀察到的行為之間的不一致。

請參閱 [Skill 格式](/zh-TW/clawhub/skill-format)。

## Plugins

Plugin 是已封裝的 OpenClaw 擴充功能。ClawHub 會儲存套件中繼資料、相容性資訊、來源連結、成品和版本記錄。

當 OpenClaw 從 ClawHub 安裝 Plugin 時，它會先檢查公告的相容性中繼資料再進行安裝。套件記錄可以包含 API 相容性、最低 Gateway 版本、主機目標、環境需求和成品摘要。

當你希望註冊庫成為事實來源時，請使用明確的 ClawHub 安裝來源：

```bash
openclaw plugins install clawhub:<package>
```

## 發布

發布會建立新的不可變版本記錄。發布者會使用 `clawhub` CLI 進行已驗證的註冊庫工作流程：

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

使用試跑可在上傳前預覽解析後的承載資料。公開頁面接著會顯示已發布的中繼資料、檔案、來源歸屬和掃描狀態。

## 安裝和更新

OpenClaw 安裝命令會使用 ClawHub 作為套件來源：

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw 會記錄安裝來源中繼資料，讓更新之後可以解析同一個註冊庫套件。ClawHub CLI 也支援直接 skill 安裝和更新工作流程，適合希望在完整 OpenClaw 工作區之外使用註冊庫管理 skill 資料夾的使用者。

## 安全狀態

ClawHub 開放發布，但發行版本仍需經過上傳閘門、自動檢查、使用者回報和審核者處置。

公開頁面會在可用時顯示掃描摘要。被保留、隱藏或封鎖的內容可能會從公開搜尋和安裝流程中消失，但仍對擁有者可見，以便進行診斷。

請參閱 [安全與審核](/zh-TW/clawhub/security) 和
[可接受使用方式](/zh-TW/clawhub/acceptable-usage)。

## API 存取

ClawHub 會公開唯讀 API，用於探索、搜尋、套件詳細資料和下載。第三方目錄可在連回標準 ClawHub 清單、遵守速率限制，並避免暗示背書的情況下使用這些 API。

請參閱 [Public API](/zh-TW/clawhub/api) 和 [HTTP API](/zh-TW/clawhub/http-api)。
