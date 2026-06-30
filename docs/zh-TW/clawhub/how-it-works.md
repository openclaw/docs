---
read_when:
    - 了解列表、版本、安裝、發布與審核
summary: ClawHub 清單、版本、安裝、發布、掃描和更新的運作方式。
x-i18n:
    generated_at: "2026-06-30T22:04:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub 如何運作

ClawHub 是 OpenClaw Skills 和外掛的註冊層。它提供使用者探索套件的
地方，提供發布者發布版本的地方，也提供 OpenClaw 足夠的中繼資料，
以安全地安裝與更新這些套件。

## 註冊記錄

每個公開列表都是一筆註冊記錄，包含：

- 擁有者與代稱或套件名稱
- 一個或多個已發布版本
- 中繼資料、摘要、檔案與來源歸屬
- 更新日誌與標籤資訊，例如 `latest`
- 下載、安裝與星標訊號
- 安全掃描與審核狀態

列表頁是使用者在安裝前檢視某個技能或
外掛宣稱功能的權威位置。

## Skills

技能是以 `SKILL.md` 為核心的版本化文字套件。它可以包含
支援檔案、範例、範本與指令碼。

ClawHub 會讀取 `SKILL.md` frontmatter，以了解技能名稱、
描述、需求、環境變數與中繼資料。準確的
中繼資料很重要，因為它能幫助使用者決定是否安裝該技能，也能
幫助自動掃描偵測宣告行為與觀察行為之間的不一致。

請參閱[技能格式](/zh-TW/clawhub/skill-format)。

## 外掛

外掛是封裝後的 OpenClaw 擴充功能。ClawHub 會儲存套件中繼資料、
相容性資訊、來源連結、成品與版本記錄。

當 OpenClaw 從 ClawHub 安裝外掛時，它會在安裝前檢查公告的相容性
中繼資料。套件記錄可以包含 API 相容性、
最低閘道版本、主機目標、環境需求與成品
摘要。

當你希望註冊表成為事實來源時，請使用明確的 ClawHub 安裝來源：

```bash
openclaw plugins install clawhub:<package>
```

## 發布

發布會建立新的不可變版本記錄。發布者使用 `clawhub`
命令列介面執行已驗證的註冊表工作流程：

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

使用乾跑來預覽上傳前解析完成的 payload。公開頁面接著會
呈現已發布的中繼資料、檔案、來源歸屬與掃描狀態。

## 安裝與更新

OpenClaw 安裝命令會使用 ClawHub 作為套件來源：

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw 會記錄安裝來源中繼資料，讓更新之後可以解析同一個
註冊表套件。ClawHub 命令列介面也支援直接的技能安裝與
更新工作流程，供想在完整 OpenClaw 工作區之外使用註冊表管理技能資料夾的使用者使用。

## 安全狀態

ClawHub 開放發布，但版本仍須經過上傳閘門、
自動檢查、使用者回報與審核者處置。

公開頁面會在可用時顯示掃描摘要。被保留、隱藏
或封鎖的內容可能會從公開搜尋與安裝流程中消失，但仍
對擁有者可見以供診斷。

請參閱[安全](/clawhub/security)、[安全稽核](/clawhub/security-audits)、
[審核與帳戶安全](/zh-TW/clawhub/moderation)，以及
[可接受使用](/clawhub/acceptable-usage)。

## API 存取

ClawHub 提供公開讀取 API，用於探索、搜尋、套件詳細資料與
下載。第三方目錄可以使用這些 API，前提是它們連回
權威 ClawHub 列表、遵守速率限制，並避免暗示背書。

請參閱[公開 API](/clawhub/api) 與 [HTTP API](/clawhub/http-api)。
