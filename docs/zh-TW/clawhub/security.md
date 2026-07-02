---
read_when:
    - 回報 ClawHub 安全性問題
    - 了解 ClawHub 漏洞揭露
    - 區分 ClawHub 平台問題與第三方技能或外掛問題
sidebarTitle: Security
summary: 如何回報 ClawHub 安全性問題，以及漏洞何時會公開揭露。
title: 安全
x-i18n:
    generated_at: "2026-07-02T17:30:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# 安全性

ClawHub 安全性問題可透過 `openclaw/clawhub` 的 GitHub Security Advisories 回報。

針對 ClawHub 本身的漏洞，請使用 GitHub Security Advisories。良好的 ClawHub 安全公告回報包括以下方面的錯誤：

- ClawHub 網站、API 或命令列介面
- 登錄檔發布、下載、安裝或成品完整性
- 驗證、授權或 API 權杖
- 掃描、審核或回報處理

請勿使用 ClawHub 安全公告來回報第三方 skill 或外掛自身原始碼中的漏洞。請直接向 ClawHub 清單中連結的發布者或原始碼儲存庫回報。

## 漏洞揭露

由於 ClawHub 是託管的雲端應用程式，ClawHub 服務漏洞預設不會公開揭露。當有實際使用者影響的證據，或使用者需要採取行動時，才會公開揭露。

實際使用者影響的範例包括已確認的利用、使用者資料或祕密外洩、因平台故障而讓惡意內容觸及使用者，或任何需要使用者輪換憑證、更新本機軟體或採取其他保護行動的問題。

使用者安裝軟體中的漏洞會公開揭露，例如使用者需要在本機更新的 ClawHub 命令列介面套件、二進位檔、程式庫或其他發布成品。

## 相關頁面

如需安裝時稽核標籤、風險等級、發現項目和解讀，請參閱[安全性稽核](/clawhub/security-audits)。

如需市集回報、審核保留、隱藏清單、封鎖和帳戶狀態，請參閱[審核與帳戶安全](/clawhub/moderation)。
