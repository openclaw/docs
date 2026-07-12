---
read_when:
    - 回報 ClawHub 安全性問題
    - 瞭解 ClawHub 弱點揭露
    - 區分 ClawHub 平台問題與第三方 Skill 或外掛問題
sidebarTitle: Security
summary: 如何回報 ClawHub 安全性問題，以及漏洞何時會公開揭露。
title: 安全性
x-i18n:
    generated_at: "2026-07-12T14:21:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# 安全性

ClawHub 的安全性問題可透過 GitHub Security Advisories 回報至
`openclaw/clawhub`。

請使用 GitHub Security Advisories 回報 ClawHub 本身的漏洞。良好的
ClawHub 安全公告報告包括以下項目的錯誤：

- ClawHub 網站、API 或命令列介面
- 登錄檔發布、下載、安裝或成品完整性
- 驗證、授權或 API 權杖
- 掃描、內容管理或報告處理

請勿使用 ClawHub 安全公告回報第三方 Skill 或外掛原始碼本身的漏洞。請直接向發布者或 ClawHub 清單中連結的原始碼
儲存庫回報。

## 漏洞揭露

由於 ClawHub 是託管式雲端應用程式，因此 ClawHub 服務漏洞
預設不會公開揭露。當有證據顯示確實影響使用者，或使用者需要採取行動時，
才會公開揭露。

確實影響使用者的例子包括已確認遭到利用、使用者
資料或祕密遭到暴露、平台故障導致惡意內容觸及使用者，
或任何要求使用者輪替認證資訊、更新本機軟體或
採取其他保護措施的問題。

使用者安裝之軟體中的漏洞會公開揭露，例如
ClawHub 命令列介面套件、二進位檔、程式庫或使用者
需要在本機更新的其他發布成品。

## 相關頁面

如需安裝期間的稽核標籤、風險等級、發現項目與判讀方式，請參閱
[安全性稽核](/clawhub/security-audits)。

如需市集檢舉、內容管理暫停、隱藏清單、停權與帳戶
狀態的相關資訊，請參閱[內容管理與帳戶安全](/clawhub/moderation)。
