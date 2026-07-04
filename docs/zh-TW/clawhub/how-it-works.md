---
read_when:
    - 了解清單、版本、安裝、發布和審核
summary: ClawHub 列表、版本、安裝、發布、掃描與更新的運作方式。
x-i18n:
    generated_at: "2026-07-04T17:47:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub 如何運作

ClawHub 是 OpenClaw 技能與外掛的登錄層。它提供使用者探索套件的地方、提供發布者發行版本的地方，並提供 OpenClaw 足夠的中繼資料，以安全地安裝與更新這些套件。

## 登錄記錄

每個公開列表都是一筆登錄記錄，包含：

- 擁有者與 slug 或套件名稱
- 一個或多個已發布版本
- 中繼資料、摘要、檔案與來源歸屬
- 變更記錄與標籤資訊，例如 `latest`
- 下載、安裝與星標訊號
- 安全掃描與審核狀態

列表頁面是使用者在安裝前檢視技能或外掛宣稱功能的標準位置。

## Skills

技能是以 `SKILL.md` 為核心的版本化文字套件組。它可以包含支援檔案、範例、範本與指令碼。

ClawHub 會讀取 `SKILL.md` frontmatter，以了解技能名稱、描述、需求、環境變數與中繼資料。準確的中繼資料很重要，因為它能協助使用者判斷是否安裝該技能，也能協助自動化掃描偵測宣告行為與觀察到的行為之間的不一致。

請參閱[技能格式](/zh-TW/clawhub/skill-format)。

## 外掛

外掛是封裝好的 OpenClaw 擴充功能。ClawHub 會儲存套件中繼資料、相容性資訊、來源連結、成品與版本記錄。

當 OpenClaw 從 ClawHub 安裝外掛時，會先檢查標示的相容性中繼資料再安裝。套件記錄可包含 API 相容性、最低閘道版本、主機目標、環境需求與成品摘要。

當你希望登錄庫成為事實來源時，請使用明確的 ClawHub 安裝來源：

```bash
openclaw plugins install clawhub:<package>
```

## 發布

發布會建立一筆新的不可變版本記錄。發布者使用 `clawhub` 命令列介面進行已驗證的登錄庫工作流程：

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

使用試跑可在上傳前預覽解析後的酬載。接著公開頁面會顯示已發布的中繼資料、檔案、來源歸屬與掃描狀態。

## 安裝與更新

OpenClaw 安裝命令會使用 ClawHub 作為套件來源：

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw 會記錄安裝來源中繼資料，讓後續更新能解析到同一個登錄庫套件。對於想在完整 OpenClaw 工作區之外管理登錄庫技能資料夾的使用者，ClawHub 命令列介面也支援直接的技能安裝與更新工作流程。

## 安全狀態

ClawHub 開放發布，但發行版本仍須通過上傳門檻、自動化檢查、使用者回報與審核者處置。

公開頁面會在可用時顯示掃描摘要。被保留、隱藏或封鎖的內容，可能會從公開搜尋與安裝流程中消失，但仍會對擁有者可見，以便診斷。

請參閱[安全](/clawhub/security)、[安全稽核](/clawhub/security-audits)、[審核與帳戶安全](/zh-TW/clawhub/moderation)以及[可接受使用方式](/clawhub/acceptable-usage)。

## API 存取

ClawHub 提供公開讀取 API，用於探索、搜尋、套件詳細資料與下載。第三方目錄可在連回標準 ClawHub 列表、遵守速率限制且避免暗示背書的情況下使用這些 API。

請參閱[公開 API](/zh-TW/clawhub/api)與 [HTTP API](/clawhub/http-api)。
