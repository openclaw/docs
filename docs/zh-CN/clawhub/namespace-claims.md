---
read_when:
    - 认领组织、品牌、包作用域、所有者用户名、技能短标识或包命名空间
    - 解析已被声明或保留的命名空间
    - 决定使用报告、申诉还是命名空间声明
sidebarTitle: Org and Namespace Claims
summary: 如何针对组织、品牌、所有者账号名、包作用域、技能短标识或命名空间所有权争议请求 ClawHub 审核。
title: 组织和命名空间申领
x-i18n:
    generated_at: "2026-07-02T07:55:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# 组织和命名空间声明

ClawHub 使用所有者 handle、组织 handle、skill slug、插件包名和包作用域作为公共命名空间。如果某个命名空间看起来属于现实世界中的项目、品牌、包生态系统或组织，但在 ClawHub 上已被声明、保留、具有误导性或存在争议，请通过 [Org / Namespace Claim issue form](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml) 请求工作人员审核。

此路径用于公开、非敏感的所有权审核。不要将产品内报告或账号申诉表单用于命名空间声明。

## 何时打开声明

当你认为 ClawHub 工作人员应审核某个命名空间是否应因现实世界所有权而被保留、转让、重命名、隐藏、隔离、设为别名，或以其他方式更改时，请打开命名空间声明。

示例包括：

- 与你的 GitHub 组织、项目、公司或社区匹配的组织 handle
- 诸如 `@example-org/*` 这样的包作用域，它应仅由匹配的 ClawHub 所有者发布
- 看起来在冒充某个项目的 skill slug 或插件包名
- 品牌、商标、项目重命名或包历史争议
- 已删除、不活跃或无法联系的所有者阻挡了合法命名空间所有者

如果列表除所有权争议外还存在不安全、恶意或误导问题，也请遵循相关的审核或安全指南。命名空间声明表单用于所有权审核，而不是紧急漏洞披露。

## 提交前

首先确认你正在使用与命名空间匹配的所有者发布。对于插件包，诸如 `@example-org/example-plugin` 这样的作用域名称必须作为匹配的 `example-org` 所有者发布。

如果你可以管理当前所有者，请通过发布、重命名、转让、隐藏或删除受影响资源来直接修复命名空间。当你无法管理当前所有者，或需要工作人员解决争议时，请使用声明。

## 要包含的证据

使用公开、非敏感证据。有帮助的证明包括：

- GitHub 组织、仓库、发布版本或维护者历史
- 命名该命名空间的官方项目文档
- 域名或官方邮箱域名证明
- npm、PyPI、crates.io 或其他包注册表作用域控制权
- 可公开讨论的商标、品牌或项目所有权证据
- 源代码仓库历史、包历史或公开重命名通知
- 指向存在争议的 ClawHub 所有者、skill、插件、包或 issue 的链接

说明每个链接证明了什么。工作人员应能在无需私有凭证或密钥的情况下理解其关系。

## 不应包含的内容

不要在公开 GitHub issue 中放入密钥或私有证明。不要包含：

- API token、签名密钥或凭证
- DNS challenge token
- 私有法律文件或合同
- 个人身份证明文件
- 私人邮件、私有安全报告或机密客户数据

声明表单会询问敏感证据是否需要私有工作人员渠道。请使用该选项，而不是公开发布敏感材料。

## 可能的结果

根据证据和风险，ClawHub 工作人员可能会保留某个命名空间、转让所有权、重命名资源、隐藏或隔离现有列表、添加别名或重定向、要求更多证明，或拒绝请求。

命名空间审核不保证每个匹配名称都会被转让。工作人员会权衡公开证据、现有使用情况、安全风险和用户影响。

## 相关文档

- [发布](/zh-CN/clawhub/publishing)
- [故障排除](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [审核和账号安全](/clawhub/moderation)
- [安全](/clawhub/security)
