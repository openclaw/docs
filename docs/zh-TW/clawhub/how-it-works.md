---
read_when:
    - 了解清單、版本、安裝、發布與審核
summary: ClawHub 條目、版本、安裝、發布、掃描和更新的運作方式。
x-i18n:
    generated_at: "2026-06-28T05:03:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub 如何運作

ClawHub 是 OpenClaw 技能與外掛的註冊層。它提供使用者一個
探索套件的地方，提供發布者一個發行版本的地方，並提供 OpenClaw
足夠的中繼資料，以安全地安裝與更新這些套件。

## 註冊記錄

每個公開清單都是一筆註冊記錄，包含：

- 擁有者與 slug 或套件名稱
- 一個或多個已發布版本
- 中繼資料、摘要、檔案與來源歸屬
- 變更記錄與標籤資訊，例如 `latest`
- 下載、安裝與星標訊號
- 安全掃描與審核狀態

清單頁面是使用者在安裝前檢視技能或
外掛宣稱功能的標準位置。

## Skills

技能是以 `SKILL.md` 為核心的版本化文字套件。它可以包含
支援檔案、範例、範本與指令碼。

ClawHub 會讀取 `SKILL.md` frontmatter，以了解技能名稱、
描述、需求、環境變數與中繼資料。準確的
中繼資料很重要，因為它能協助使用者決定是否安裝該技能，也能
協助自動掃描偵測宣告行為與觀察到的行為之間的不一致。

請參閱 [技能格式](/zh-TW/clawhub/skill-format)。

## 外掛

外掛是已封裝的 OpenClaw 擴充功能。ClawHub 會儲存套件中繼資料、
相容性資訊、來源連結、成品與版本記錄。

當 OpenClaw 從 ClawHub 安裝外掛時，會在安裝前檢查宣告的相容性
中繼資料。套件記錄可以包含 API 相容性、
最低閘道版本、主機目標、環境需求與成品
摘要。

當你希望註冊成為權威來源時，請使用明確的 ClawHub 安裝來源：

```bash
openclaw plugins install clawhub:<package>
```

## 發布

發布會建立新的不可變版本記錄。發布者使用 `clawhub`
命令列介面來執行已驗證的註冊工作流程：

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

使用試跑在上傳前預覽解析後的承載內容。公開頁面接著會
顯示已發布的中繼資料、檔案、來源歸屬與掃描狀態。

## 安裝與更新

OpenClaw 安裝命令會使用 ClawHub 作為套件來源：

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw 會記錄安裝來源中繼資料，讓更新日後能解析到相同的
註冊套件。ClawHub 命令列介面也支援直接的技能安裝與
更新工作流程，適用於想在完整 OpenClaw 工作區之外管理註冊技能資料夾的
使用者。

## 安全狀態

ClawHub 開放發布，但發行仍會受到上傳閘門、
自動檢查、使用者回報與審核者處置的約束。

公開頁面會在可用時顯示掃描摘要。被保留、隱藏
或封鎖的內容可能會從公開搜尋與安裝流程中消失，但仍會
對擁有者可見以便診斷。

請參閱 [安全性](/zh-TW/clawhub/security)、[安全性稽核](/zh-TW/clawhub/security-audits)、
[審核與帳戶安全](/zh-TW/clawhub/moderation)，以及
[可接受使用](/zh-TW/clawhub/acceptable-usage)。

## API 存取

ClawHub 提供公開讀取 API，用於探索、搜尋、套件詳細資料與
下載。第三方目錄可以使用這些 API，但必須連回
標準 ClawHub 清單、遵守速率限制，並避免暗示背書。

請參閱 [公開 API](/zh-TW/clawhub/api) 與 [HTTP API](/zh-TW/clawhub/http-api)。
