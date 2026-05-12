---
read_when:
    - 了解清單、版本、安裝、發布與審核
summary: ClawHub 清單、版本、安裝、發布、掃描與更新的運作方式。
x-i18n:
    generated_at: "2026-05-12T00:56:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfd3614e9ddbcb167329e49a6fa92e32ca8d0a85235914a017452166ae49b594
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub 的運作方式

ClawHub 是 OpenClaw Skills 與 Plugin 的登錄層。它為使用者提供探索套件的地方，為發布者提供發行版本的地方，並為 OpenClaw 提供足夠的中繼資料，以安全地安裝與更新這些套件。

## 登錄記錄

每個公開清單都是一筆登錄記錄，包含：

- 擁有者與 slug 或套件名稱
- 一個或多個已發布版本
- 中繼資料、摘要、檔案與來源歸屬
- 變更記錄與標籤資訊，例如 `latest`
- 下載、安裝、加星與留言訊號
- 安全掃描與審核狀態

清單頁面是使用者在安裝前檢視某個 Skills 或 Plugin 聲稱用途的標準位置。

## Skills

Skills 是以 `SKILL.md` 為核心的版本化文字套件組合。它可以包含支援檔案、範例、範本與指令碼。

ClawHub 會讀取 `SKILL.md` frontmatter，以了解 Skills 名稱、描述、需求、環境變數與中繼資料。準確的中繼資料很重要，因為它能協助使用者判斷是否要安裝該 Skills，也能協助自動化掃描偵測宣告行為與觀察行為之間的不一致。

請參閱 [Skills 格式](/zh-TW/clawhub/skill-format)。

## Plugin

Plugin 是已封裝的 OpenClaw 擴充功能。ClawHub 會儲存套件中繼資料、相容性資訊、來源連結、成品與版本記錄。

當 OpenClaw 從 ClawHub 安裝 Plugin 時，會在安裝前檢查宣告的相容性中繼資料。套件記錄可以包含 API 相容性、最低 Gateway 版本、主機目標、環境需求與成品摘要。

當你希望登錄庫作為事實來源時，請使用明確的 ClawHub 安裝來源：

```bash
openclaw plugins install clawhub:<package>
```

## 發布

發布會建立新的不可變版本記錄。發布者使用 `clawhub` CLI 進行已驗證的登錄庫工作流程：

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

使用 dry run 可在上傳前預覽解析後的酬載。公開頁面接著會顯示已發布的中繼資料、檔案、來源歸屬與掃描狀態。

## 安裝與更新

OpenClaw 安裝指令會使用 ClawHub 作為套件來源：

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw 會記錄安裝來源中繼資料，讓之後的更新能解析同一個登錄庫套件。ClawHub CLI 也支援直接 Skills 安裝與更新工作流程，適用於想在完整 OpenClaw 工作區之外使用登錄庫管理 Skills 資料夾的使用者。

## 安全狀態

ClawHub 開放發布，但發行內容仍需遵守上傳閘門、自動化檢查、使用者回報與審核者處置。

公開頁面會在可用時顯示掃描摘要。被保留、隱藏或封鎖的內容可能會從公開搜尋與安裝流程中消失，但仍會對擁有者可見，以便診斷。

請參閱 [安全 + 審核](/zh-TW/clawhub/security) 與
[可接受使用方式](/zh-TW/clawhub/acceptable-usage)。

## API 存取

ClawHub 提供公開讀取 API，用於探索、搜尋、套件詳細資訊與下載。第三方目錄可以使用這些 API，前提是它們連回標準 ClawHub 清單、遵守速率限制，並避免暗示背書。

請參閱 [公開 API](/zh-TW/clawhub/api) 與 [HTTP API](/zh-TW/clawhub/http-api)。
