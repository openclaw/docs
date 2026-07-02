---
read_when:
    - 报告 ClawHub 安全问题
    - 了解 ClawHub 漏洞披露
    - 区分 ClawHub 平台问题与第三方技能或插件问题
sidebarTitle: Security
summary: 如何报告 ClawHub 安全问题，以及漏洞何时会被公开披露。
title: 安全
x-i18n:
    generated_at: "2026-07-02T22:22:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# 安全

ClawHub 安全问题可以通过 `openclaw/clawhub` 的 GitHub Security Advisories 报告。

对于 ClawHub 本身的漏洞，请使用 GitHub Security Advisories。好的 ClawHub 安全公告报告包括以下方面的错误：

- ClawHub 网站、API 或 CLI
- registry 发布、下载、安装或 artifact 完整性
- 身份认证、授权或 API 令牌
- 扫描、审核或报告处理

不要使用 ClawHub advisories 报告第三方 skill 或插件自身源代码中的漏洞。请直接向 ClawHub 列表中链接的发布者或源代码仓库报告这些问题。

## 漏洞披露

由于 ClawHub 是托管的云应用，ClawHub 服务漏洞默认不会公开披露。当有真实用户影响的证据，或用户需要采取行动时，才会公开披露。

真实用户影响的例子包括确认的利用、用户数据或密钥暴露、因平台故障导致恶意内容触达用户，或任何要求用户轮换凭据、更新本地软件或采取其他保护措施的问题。

用户安装的软件中的漏洞会公开披露，例如 ClawHub CLI 包、二进制文件、库，或其他需要用户在本地更新的发布 artifact。

## 相关页面

有关安装时审计标签、风险等级、发现项和解读，请参见 [安全审计](/clawhub/security-audits)。

有关 marketplace 报告、审核暂挂、隐藏列表、封禁和账户状态，请参见 [审核与账户安全](/clawhub/moderation)。
