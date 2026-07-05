---
read_when:
    - 了解清單、版本、安裝、發布與審核
summary: ClawHub 清單、版本、安裝、發布、掃描與更新的運作方式。
x-i18n:
    generated_at: "2026-07-05T17:40:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub 的運作方式

ClawHub 是 OpenClaw Skills 和外掛的登錄庫層。它提供使用者探索套件的
地方，提供發布者發布版本的地方，並提供 OpenClaw 足夠的中繼資料，
以安全地安裝和更新這些套件。

## 登錄庫紀錄

每個公開列表都是一筆登錄庫紀錄，包含：

- 擁有者與 slug 或套件名稱
- 一個或多個已發布版本
- 中繼資料、摘要、檔案和來源歸屬
- 變更記錄與標籤資訊，例如 `latest`
- 下載、安裝和星標訊號
- 安全掃描與審核狀態

列表頁面是使用者在安裝前檢視某個 skill 或
外掛宣稱功能的權威位置。

## Skills

skill 是以 `SKILL.md` 為核心的版本化文字套件包。它可以包含
支援檔案、範例、範本和腳本。

ClawHub 會讀取 `SKILL.md` frontmatter，以了解 skill 名稱、
描述、需求、環境變數和中繼資料。準確的中繼資料很重要，
因為它能幫助使用者判斷是否安裝該 skill，也能幫助自動化掃描偵測
宣告行為與觀察到的行為之間的不一致。

請參閱 [Skill 格式](/zh-TW/clawhub/skill-format)。

## 外掛

外掛是已封裝的 OpenClaw 擴充功能。ClawHub 儲存套件中繼資料、
相容性資訊、來源連結、成品和版本紀錄。

當 OpenClaw 從 ClawHub 安裝外掛時，會先檢查宣告的相容性
中繼資料再進行安裝。套件紀錄可以包含 API 相容性、
最低閘道版本、主機目標、環境需求和成品摘要。

當你希望登錄庫成為事實來源時，請使用明確的 ClawHub 安裝來源：

```bash
openclaw plugins install clawhub:<package>
```

## 發布

發布會建立新的不可變版本紀錄。發布者使用 `clawhub`
命令列介面進行已驗證的登錄庫工作流程：

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

使用模擬執行可在上傳前預覽解析後的承載內容。公開頁面接著會
呈現已發布的中繼資料、檔案、來源歸屬和掃描狀態。

## 安裝與更新

OpenClaw 安裝命令會使用 ClawHub 作為套件來源：

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw 會記錄安裝來源中繼資料，讓更新之後能解析到相同的
登錄庫套件。ClawHub 命令列介面也支援直接的 skill 安裝與
更新工作流程，供希望在完整 OpenClaw 工作區之外管理登錄庫 skill
資料夾的使用者使用。

## 安全狀態

ClawHub 開放發布，但版本仍會受到上傳門檻、
自動化檢查、使用者回報和審核者動作的約束。

公開頁面會在可用時顯示掃描摘要。被保留、隱藏或封鎖的內容，
可能會從公開搜尋與安裝流程中消失，但仍對擁有者可見，以便診斷。

請參閱 [安全性](/clawhub/security)、[安全稽核](/clawhub/security-audits)、
[審核與帳號安全](/zh-TW/clawhub/moderation)，以及
[可接受使用方式](/clawhub/acceptable-usage)。

## API 存取

ClawHub 會公開用於探索、搜尋、套件詳細資料和下載的公開讀取 API。
第三方型錄可使用這些 API，前提是它們連回權威的 ClawHub 列表、
遵守速率限制，並避免暗示獲得背書。

請參閱 [公開 API](/zh-TW/clawhub/api) 和 [HTTP API](/clawhub/http-api)。
