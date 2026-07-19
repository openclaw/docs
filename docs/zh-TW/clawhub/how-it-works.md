---
read_when:
    - 了解清單、版本、安裝、發布與審核管理
summary: ClawHub 的清單、版本、安裝、發布、掃描與更新如何運作。
x-i18n:
    generated_at: "2026-07-19T13:40:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub 的運作方式

ClawHub 是 OpenClaw Skills 與外掛的登錄層。它提供使用者探索套件的場所、發布者發行版本的場所，並為 OpenClaw 提供足夠的中繼資料，以安全地安裝及更新這些套件。

## 登錄記錄

每個公開項目都是一筆登錄記錄，包含：

- 擁有者與代稱或套件名稱
- 一個或多個已發布版本
- 中繼資料、摘要、檔案及來源標示
- 變更記錄及標籤資訊，例如 `latest`
- 下載、安裝及加星號訊號
- 安全性掃描及內容審核狀態

項目頁面是使用者在安裝 Skills 或外掛之前，檢視其所聲稱功能的標準位置。

## Skills

Skills 是以 `SKILL.md` 為核心的版本化文字套件組合。它可以包含支援檔案、範例、範本及指令碼。

ClawHub 會讀取 `SKILL.md` 前置中繼資料，以瞭解 Skills 名稱、說明、需求、環境變數及中繼資料。準確的中繼資料十分重要，因為它有助於使用者決定是否安裝該 Skills，並協助自動掃描偵測宣告行為與觀察到的行為之間的不一致。

請參閱 [Skills 格式](/clawhub/skill-format)。

## 外掛

外掛是封裝完成的 OpenClaw 擴充功能。ClawHub 會儲存套件中繼資料、相容性資訊、原始碼連結、成品及版本記錄。

當 OpenClaw 從 ClawHub 安裝外掛時，會在安裝前檢查其宣告的相容性中繼資料。套件記錄可以包含 API 相容性、最低閘道版本、主機目標、環境需求及成品摘要。

若要以登錄資料為唯一依據，請使用明確的 ClawHub 安裝來源：

```bash
openclaw plugins install clawhub:<package>
```

## 發布

發布會建立一筆新的不可變版本記錄。發布者使用 `clawhub` 命令列介面執行經過驗證的登錄工作流程：

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

上傳前請使用試執行來預覽解析後的承載資料。接著，公開頁面會顯示已發布的中繼資料、檔案、來源標示及掃描狀態。

## 安裝與更新

OpenClaw 安裝命令使用 ClawHub 作為套件來源：

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw 會記錄安裝來源中繼資料，以便日後更新時能解析相同的登錄套件。ClawHub 命令列介面也支援直接安裝及更新 Skills 的工作流程，供希望在完整 OpenClaw 工作區以外使用登錄管理 Skills 資料夾的使用者使用。

## 安全性狀態

ClawHub 開放發布內容，但發行版本仍須經過上傳管制、自動檢查、使用者檢舉及審核人員處置。

公開頁面會在可用時顯示掃描摘要。遭到扣留、隱藏或封鎖的內容可能會從公開搜尋及安裝流程中消失，但擁有者仍可看見，以便進行診斷。

請參閱[安全性](/clawhub/security)、[安全性稽核](/zh-TW/clawhub/security-audits)、[內容審核與帳號安全](/clawhub/moderation)及[可接受的使用方式](/clawhub/acceptable-usage)。

## API 存取

ClawHub 提供公開唯讀 API，用於探索、搜尋、取得套件詳細資料及下載。第三方目錄可以使用這些 API，前提是必須連回標準 ClawHub 項目、遵守速率限制，且避免暗示獲得官方背書。

請參閱[公開 API](/zh-TW/clawhub/api)及 [HTTP API](/clawhub/http-api)。
