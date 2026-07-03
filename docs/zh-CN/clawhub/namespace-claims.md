---
read_when:
    - 认领组织、品牌、包作用域、所有者标识、技能 slug 或包命名空间
    - 解析已被声明或保留的命名空间
    - 判断应使用举报、申诉还是命名空间声明
sidebarTitle: Org and Namespace Claims
summary: 如何为组织、品牌、所有者账号名、包作用域、技能 slug 或命名空间所有权争议请求 ClawHub 审核。
title: 组织和命名空间认领
x-i18n:
    generated_at: "2026-07-03T09:22:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# 组织和命名空间声明

ClawHub 使用所有者 handle、组织 handle、技能 slug、插件包名和包作用域作为公共命名空间。如果某个命名空间看起来属于现实世界中的项目、品牌、包生态系统或组织，但在 ClawHub 上已被声明、保留、存在误导性或有争议，请使用 [组织 / 命名空间声明 issue 表单](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)请求工作人员审核。

此路径用于公开、非敏感的所有权审核。不要将产品内报告或账号申诉表单用于命名空间声明。

## 何时提交声明

当你认为 ClawHub 工作人员应审核某个命名空间是否应因现实世界所有权而被保留、转移、重命名、隐藏、隔离、添加别名或以其他方式更改时，请提交命名空间声明。

示例包括：

- 与你的 GitHub 组织、项目、公司或社区匹配的组织 handle
- 例如 `@example-org/*` 这样的包作用域，应仅由匹配的 ClawHub 所有者发布
- 看起来在冒充某个项目的技能 slug 或插件包名
- 品牌、商标、项目重命名或包历史争议
- 已删除、不活跃或无法联系的所有者阻碍了合法命名空间所有者

如果该条目在所有权争议之外还存在不安全、恶意或误导性问题，也请遵循相关的审核或安全指南。命名空间声明表单用于所有权审核，不用于紧急漏洞披露。

## 提交前

请先确认你正在使用与命名空间匹配的所有者发布。对于插件包，像 `@example-org/example-plugin` 这样的作用域名称必须以匹配的 `example-org` 所有者发布。

如果你可以管理当前所有者，请通过发布、重命名、转移、隐藏或删除受影响资源来直接修复命名空间。当你无法管理当前所有者，或需要工作人员解决争议时，请使用声明。

## 需要包含的证据

使用公开、非敏感的证据。有用的证明包括：

- GitHub 组织、仓库、发布或维护者历史
- 命名该命名空间的官方项目文档
- 域名或官方邮箱域名证明
- npm、PyPI、crates.io 或其他包注册表作用域控制权
- 可公开讨论的商标、品牌或项目所有权证据
- 源代码仓库历史、包历史或公开重命名通知
- 指向有争议的 ClawHub 所有者、技能、插件、包或 issue 的链接

请说明每个链接能证明什么。工作人员应能在不需要私人凭据或密钥的情况下理解其关系。

## 不应包含的内容

不要在公开 GitHub issue 中放入密钥或私人证明。不要包含：

- API 令牌、签名密钥或凭据
- DNS challenge 令牌
- 私人法律文件或合同
- 个人身份证明文件
- 私人邮件、私人安全报告或机密客户数据

声明表单会询问敏感证据是否需要私人工作人员渠道。请使用该选项，而不是公开发布敏感材料。

## 可能的结果

根据证据和风险，ClawHub 工作人员可能会保留某个命名空间、转移所有权、重命名资源、隐藏或隔离现有条目、添加别名或重定向、要求更多证明，或拒绝请求。

命名空间审核并不保证每个匹配名称都会被转移。工作人员会权衡公开证据、现有使用情况、安全风险和用户影响。

## 相关文档

- [发布](/zh-CN/clawhub/publishing)
- [故障排除](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [审核和账号安全](/clawhub/moderation)
- [安全](/clawhub/security)
