---
read_when:
    - 报告 ClawHub 安全问题
    - 了解 ClawHub 漏洞披露
    - 区分 ClawHub 平台问题与第三方 Skills 或插件问题
sidebarTitle: Security
summary: 如何报告 ClawHub 安全问题，以及漏洞何时会被公开披露。
title: 安全性
x-i18n:
    generated_at: "2026-07-11T20:22:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# 安全

ClawHub 安全问题可通过 GitHub Security Advisories 报告至 `openclaw/clawhub`。

对于 ClawHub 本身的漏洞，请使用 GitHub Security Advisories。高质量的 ClawHub 安全公告报告包括以下方面的缺陷：

- ClawHub 网站、API 或 CLI
- 注册表发布、下载、安装或制品完整性
- 身份验证、授权或 API 令牌
- 扫描、审核或报告处理

请勿使用 ClawHub 安全公告报告第三方 Skill 或插件自身源代码中的漏洞。请直接向发布者或 ClawHub 列表中链接的源代码仓库报告。

## 漏洞披露

由于 ClawHub 是托管式云应用，默认不会公开披露 ClawHub 服务漏洞。当有证据表明漏洞已对真实用户造成影响，或用户需要采取措施时，才会公开披露。

对真实用户造成影响的示例包括：确认已遭利用、用户数据或机密信息泄露、由于平台故障导致恶意内容触达用户，或任何要求用户轮换凭据、更新本地软件或采取其他保护措施的问题。

对于用户安装的软件中的漏洞，则会公开披露，例如用户需要在本地更新的 ClawHub CLI 软件包、二进制文件、库或其他发布制品。

## 相关页面

有关安装时的审计标签、风险级别、发现结果及其解读，请参阅[安全审计](/clawhub/security-audits)。

有关市场报告、审核冻结、隐藏列表、封禁和账号状态，请参阅[审核与账号安全](/zh-CN/clawhub/moderation)。
