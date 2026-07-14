---
read_when:
    - 了解上架、版本、安裝、發布與審核機制
summary: ClawHub 清單、版本、安裝、發布、掃描及更新的運作方式。
x-i18n:
    generated_at: "2026-07-14T13:32:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub 的運作方式

ClawHub 是 OpenClaw Skills 與外掛的註冊庫層。它提供使用者探索套件的場所、提供發布者發行版本的場所，並為 OpenClaw 提供足夠的中繼資料，以安全地安裝及更新這些套件。

## 註冊庫記錄

每個公開項目都是一筆註冊庫記錄，包含：

- 擁有者與 slug 或套件名稱
- 一個或多個已發布版本
- 中繼資料、摘要、檔案與來源歸屬
- 變更記錄與標籤資訊，例如 `latest`
- 下載、安裝與星號訊號
- 安全性掃描與管理狀態

項目頁面是使用者在安裝 Skill 或外掛前，檢視其聲稱功能的權威位置。

## Skills

Skill 是以 `SKILL.md` 為核心的版本化文字套件組合。它可以包含支援檔案、範例、範本與指令碼。

ClawHub 會讀取 `SKILL.md` frontmatter，以瞭解 Skill 名稱、說明、需求、環境變數與中繼資料。準確的中繼資料十分重要，因為它有助於使用者決定是否安裝該 Skill，並協助自動掃描偵測宣告行為與觀察到的行為之間是否不符。

請參閱 [Skill 格式](/zh-TW/clawhub/skill-format)。

## 外掛

外掛是經過封裝的 OpenClaw 擴充功能。ClawHub 會儲存套件中繼資料、相容性資訊、來源連結、成品與版本記錄。

當 OpenClaw 從 ClawHub 安裝外掛時，會先檢查宣告的相容性中繼資料，再進行安裝。套件記錄可包含 API 相容性、最低閘道版本、主機目標、環境需求與成品摘要。

若要讓註冊庫成為唯一真實來源，請使用明確的 ClawHub 安裝來源：

```bash
openclaw plugins install clawhub:<package>
```

## 發布

發布會建立新的不可變版本記錄。發布者會使用 `clawhub` 命令列介面執行需驗證身分的註冊庫工作流程：

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

請使用試執行，在上傳前預覽解析後的承載資料。接著，公開頁面會呈現已發布的中繼資料、檔案、來源歸屬與掃描狀態。

## 安裝與更新

OpenClaw 安裝命令會將 ClawHub 作為套件來源：

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw 會記錄安裝來源中繼資料，以便日後更新時解析至相同的註冊庫套件。對於想在完整 OpenClaw 工作區之外使用註冊庫管理 Skill 資料夾的使用者，ClawHub 命令列介面也支援直接安裝及更新 Skill 的工作流程。

## 安全性狀態

ClawHub 開放發布，但發行版本仍須接受上傳關卡、自動化檢查、使用者檢舉與管理員處置。

公開頁面會在可用時顯示掃描摘要。被暫緩、隱藏或封鎖的內容可能會從公開搜尋與安裝流程中消失，但擁有者仍可看見，以便進行診斷。

請參閱[安全性](/clawhub/security)、[安全性稽核](/clawhub/security-audits)、[管理與帳戶安全](/zh-TW/clawhub/moderation)以及[可接受的使用方式](/clawhub/acceptable-usage)。

## API 存取

ClawHub 提供公開唯讀 API，用於探索、搜尋、取得套件詳細資料與下載。第三方目錄可以使用這些 API，但必須連結回權威的 ClawHub 項目、遵守速率限制，且不得暗示獲得背書。

請參閱[公開 API](/clawhub/api)與 [HTTP API](/clawhub/http-api)。
