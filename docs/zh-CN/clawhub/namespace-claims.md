---
read_when:
    - 声明组织、品牌、包作用域、所有者用户名、技能 slug 或包命名空间
    - 解析已被声明或保留的命名空间
    - 判断是使用报告、申诉还是命名空间声明
sidebarTitle: Org and Namespace Claims
summary: 如何为组织、品牌、owner-handle、package-scope、skill-slug 或命名空间所有权争议请求 ClawHub 审核。
title: 组织和命名空间声明
x-i18n:
    generated_at: "2026-07-05T04:43:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# 组织和命名空间申领

ClawHub 使用所有者 handle、组织 handle、技能 slug、插件包名和
包 scope 作为公共命名空间。如果某个命名空间看起来属于现实世界中的
项目、品牌、包生态系统或组织，但在 ClawHub 上已经被申领、保留、具有误导性
或存在争议，请通过
[组织/命名空间申领议题表单](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
请求工作人员审核。

此路径用于公开、非敏感的所有权审核。不要将产品内
报告或账号申诉表单用于命名空间申领。

## 何时提交申领

当你认为 ClawHub 工作人员应审核某个
命名空间是否应因现实世界中的所有权而被保留、转让、重命名、隐藏、隔离、设置别名
或以其他方式变更时，请提交命名空间申领。

示例包括：

- 与你的 GitHub 组织、项目、公司或社区匹配的组织 handle
- 像 `@example-org/*` 这样的包 scope，应只允许匹配的
  ClawHub 所有者发布
- 看起来冒充某个项目的技能 slug 或插件包名
- 品牌、商标、项目重命名或包历史争议
- 已删除、不活跃或无法联系的所有者阻挡了合法命名空间
  所有者

如果条目除所有权争议外还存在不安全、恶意或误导性问题，
也请遵循相关的内容审核或安全指南。命名空间申领
表单用于所有权审核，而不是紧急漏洞披露。

## 提交前

首先确认你正使用与命名空间匹配的所有者进行发布。
对于插件包，像 `@example-org/example-plugin` 这样的 scope 名称必须
以匹配的 `example-org` 所有者发布。

如果你可以管理当前所有者，请直接通过发布、
重命名、转让、隐藏或删除受影响资源来修复命名空间。当你无法管理当前所有者，
或工作人员需要解决争议时，请使用申领。

## 应包含的证据

使用公开、非敏感的证据。有用的证明包括：

- GitHub 组织、仓库、发布或维护者历史
- 命名该命名空间的官方项目文档
- 域名或官方邮箱域名证明
- npm、PyPI、crates.io 或其他包注册表 scope 控制权
- 可公开讨论的商标、品牌或项目所有权证据
- 源代码仓库历史、包历史或公开重命名通知
- 指向存在争议的 ClawHub 所有者、技能、插件、包或议题的链接

说明每个链接证明了什么。工作人员应能在不需要私有凭据或机密的情况下
理解其中的关系。

## 不应包含的内容

不要在公开 GitHub 议题中放置机密或私有证明。不要包含：

- API token、签名密钥或凭据
- DNS challenge token
- 私人法律文件或合同
- 个人身份证明文件
- 私人电子邮件、私人安全报告或机密客户数据

申领表单会询问敏感证据是否需要私有工作人员渠道。
请使用该选项，而不是公开发布敏感材料。

## 可能结果

根据证据和风险，ClawHub 工作人员可能会保留某个命名空间、
转让所有权、重命名资源、隐藏或隔离现有条目、
添加别名或重定向、要求提供更多证明，或拒绝请求。

命名空间审核并不保证每个匹配名称都会被转让。
工作人员会权衡公开证据、现有使用情况、安全风险和用户影响。

## 相关文档

- [发布](/zh-CN/clawhub/publishing)
- [故障排除](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [内容审核和账号安全](/clawhub/moderation)
- [安全](/clawhub/security)
