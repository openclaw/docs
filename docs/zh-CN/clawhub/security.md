---
read_when:
    - 报告 ClawHub 安全问题
    - 了解 ClawHub 漏洞披露
    - 区分 ClawHub 平台问题与第三方 Skills 或插件问题
sidebarTitle: Security
summary: 如何报告 ClawHub 安全问题，以及何时公开披露漏洞。
title: 安全性
x-i18n:
    generated_at: "2026-07-14T13:30:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# 安全

ClawHub 安全问题可以通过 GitHub Security Advisories 报告至
`openclaw/clawhub`。

对于 ClawHub 本身的漏洞，请使用 GitHub Security Advisories。高质量的 ClawHub 安全公告报告包括以下方面的缺陷：

- ClawHub 网站、API 或 CLI
- 注册表发布、下载、安装或工件完整性
- 身份验证、授权或 API 令牌
- 扫描、审核或报告处理

请勿使用 ClawHub 安全公告报告第三方 Skills 或插件自身源代码中的漏洞。请直接向 ClawHub 列表所链接的发布者或源代码仓库报告。

## 漏洞披露

由于 ClawHub 是托管式云应用，ClawHub 服务漏洞默认不会公开披露。若有证据表明漏洞确实影响了用户，或用户需要采取措施，则会公开披露。

确实影响用户的示例包括：已确认被利用、用户数据或机密信息泄露、因平台故障导致恶意内容触达用户，或任何要求用户轮换凭据、更新本地软件或采取其他防护措施的问题。

用户安装的软件中的漏洞会公开披露，例如用户需要在本地更新的 ClawHub CLI 软件包、二进制文件、库或其他发布工件。

## 相关页面

有关安装时的审计标签、风险级别、发现项及其解读，请参阅[安全审计](/clawhub/security-audits)。

有关市场举报、审核暂缓、隐藏列表、封禁和账号状态，请参阅[审核与账号安全](/clawhub/moderation)。
