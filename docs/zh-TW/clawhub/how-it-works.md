---
read_when:
    - 瞭解上架項目、版本、安裝、發布與審核管理
summary: ClawHub 清單、版本、安裝、發布、掃描與更新的運作方式。
x-i18n:
    generated_at: "2026-07-11T21:10:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub 的運作方式

ClawHub 是 OpenClaw Skills 與外掛的登錄層。它提供使用者探索套件的場所、發佈者發布版本的管道，並提供 OpenClaw 安全安裝及更新這些套件所需的足夠中繼資料。

## 登錄記錄

每個公開項目都是一筆登錄記錄，包含：

- 擁有者與代稱或套件名稱
- 一個或多個已發布版本
- 中繼資料、摘要、檔案與來源標註
- 變更日誌與標籤資訊，例如 `latest`
- 下載、安裝與加星號訊號
- 安全性掃描與審核狀態

項目頁面是使用者在安裝 Skills 或外掛前，檢視其宣稱功能的標準位置。

## Skills

Skills 是以 `SKILL.md` 為核心的版本化文字套件組合，可包含支援檔案、範例、範本與指令碼。

ClawHub 會讀取 `SKILL.md` 的前置內容，以瞭解 Skills 的名稱、說明、需求、環境變數與中繼資料。中繼資料的準確性非常重要，因為它能協助使用者判斷是否要安裝 Skills，也能協助自動化掃描偵測宣告行為與實際觀察行為之間的不一致。

請參閱 [Skills 格式](/clawhub/skill-format)。

## 外掛

外掛是經過封裝的 OpenClaw 擴充功能。ClawHub 會儲存套件中繼資料、相容性資訊、來源連結、成品與版本記錄。

當 OpenClaw 從 ClawHub 安裝外掛時，會在安裝前檢查其宣告的相容性中繼資料。套件記錄可包含 API 相容性、最低閘道版本、主機目標、環境需求與成品摘要。

若要以登錄資訊作為唯一真實來源，請明確指定 ClawHub 安裝來源：

```bash
openclaw plugins install clawhub:<package>
```

## 發布

發布會建立一筆不可變更的新版本記錄。發佈者使用 `clawhub` 命令列介面進行需要驗證身分的登錄工作流程：

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

上傳前請使用試執行預覽解析後的承載內容。接著，公開頁面會呈現已發布的中繼資料、檔案、來源標註與掃描狀態。

## 安裝與更新

OpenClaw 安裝命令會使用 ClawHub 作為套件來源：

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw 會記錄安裝來源的中繼資料，以便日後更新時解析相同的登錄套件。對於希望在完整 OpenClaw 工作區之外使用由登錄管理的 Skills 資料夾的使用者，ClawHub 命令列介面也支援直接安裝及更新 Skills 的工作流程。

## 安全性狀態

ClawHub 開放發布內容，但版本仍須通過上傳關卡、自動檢查、使用者檢舉與管理員處置。

若有掃描摘要，公開頁面便會顯示。遭保留、隱藏或封鎖的內容可能會從公開搜尋與安裝流程中消失，但擁有者仍可查看以進行診斷。

請參閱[安全性](/zh-TW/clawhub/security)、[安全性稽核](/clawhub/security-audits)、[內容審核與帳戶安全](/zh-TW/clawhub/moderation)及[可接受的使用方式](/clawhub/acceptable-usage)。

## API 存取

ClawHub 提供公開唯讀 API，用於探索、搜尋、取得套件詳細資料與下載。第三方目錄可使用這些 API，但必須連回標準 ClawHub 項目、遵守速率限制，並避免暗示獲得認可。

請參閱[公開 API](/clawhub/api)與 [HTTP API](/clawhub/http-api)。
