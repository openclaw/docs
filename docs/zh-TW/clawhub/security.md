---
read_when:
    - 回報 ClawHub 安全性問題
    - 瞭解 ClawHub 弱點揭露
    - 區分 ClawHub 平台問題與第三方 Skill 或外掛問題
sidebarTitle: Security
summary: 如何回報 ClawHub 安全性問題，以及漏洞會在何時公開揭露。
title: 安全性
x-i18n:
    generated_at: "2026-07-14T13:30:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# 安全性

ClawHub 的安全性問題可透過 GitHub Security Advisories 回報至
`openclaw/clawhub`。

請使用 GitHub Security Advisories 回報 ClawHub 本身的漏洞。良好的
ClawHub 安全性公告報告包括以下項目的錯誤：

- ClawHub 網站、API 或命令列介面
- 登錄檔發布、下載、安裝或成品完整性
- 驗證、授權或 API 權杖
- 掃描、審核或報告處理

請勿使用 ClawHub 安全性公告回報第三方 Skill 或外掛自身原始碼中的漏洞。請直接向 ClawHub 清單所連結的發布者或原始碼
儲存庫回報。

## 漏洞揭露

由於 ClawHub 是託管式雲端應用程式，ClawHub 服務漏洞預設不會公開揭露。若有
實際使用者受影響的證據，或使用者需要採取行動，則會公開揭露。

實際使用者影響的例子包括已確認遭到利用、使用者資料或機密資訊外洩、因平台故障而導致
惡意內容觸及使用者，或任何需要使用者輪替認證資訊、更新本機軟體或
採取其他保護措施的問題。

使用者所安裝軟體中的漏洞會公開揭露，例如
ClawHub 命令列介面套件、二進位檔、程式庫或其他使用者
需要在本機更新的發布成品。

## 相關頁面

如需了解安裝時的稽核標籤、風險等級、發現項目與解讀方式，請參閱
[安全性稽核](/clawhub/security-audits)。

如需了解市集檢舉、審核暫緩、隱藏清單、封禁與帳號
狀態，請參閱[審核與帳號安全](/clawhub/moderation)。
