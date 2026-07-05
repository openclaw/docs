---
read_when:
    - 回報 ClawHub 安全性問題
    - 瞭解 ClawHub 漏洞揭露
    - 區分 ClawHub 平台問題與第三方技能或外掛問題
sidebarTitle: Security
summary: 如何回報 ClawHub 安全性問題，以及漏洞何時會公開揭露。
title: 安全性
x-i18n:
    generated_at: "2026-07-05T17:40:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# 安全性

ClawHub 安全性問題可以透過 `openclaw/clawhub` 的 GitHub Security Advisories 回報。

請將 GitHub Security Advisories 用於 ClawHub 本身的弱點。良好的 ClawHub advisory 回報包含以下項目的錯誤：

- ClawHub 網站、API 或命令列介面
- registry 發布、下載、安裝或 artifact 完整性
- 驗證、授權或 API token
- 掃描、moderation 或回報處理

請勿將 ClawHub advisories 用於第三方 skill 或外掛自身原始碼中的弱點。請直接向 ClawHub listing 中連結的發布者或原始碼 repository 回報。

## 弱點揭露

由於 ClawHub 是託管的雲端應用程式，ClawHub 服務弱點預設不會公開揭露。只有在有實際使用者影響的證據，或使用者需要採取行動時，才會公開揭露。

實際使用者影響的範例包括已確認的利用、使用者資料或 secrets 暴露、因平台故障導致惡意內容傳達給使用者，或任何要求使用者輪替憑證、更新本機軟體，或採取其他保護措施的問題。

使用者安裝軟體中的弱點會公開揭露，例如使用者需要在本機更新的 ClawHub 命令列介面 packages、binaries、libraries 或其他 release artifacts。

## 相關頁面

如需安裝時 audit labels、風險等級、findings 與解讀，請參閱 [Security Audits](/clawhub/security-audits)。

如需 marketplace reports、moderation holds、hidden listings、bans 與 account standing，請參閱 [Moderation and Account Safety](/clawhub/moderation)。
