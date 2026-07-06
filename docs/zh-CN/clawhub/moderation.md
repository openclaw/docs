---
read_when:
    - 报告 Skills、插件或软件包
    - 从被搁置、隐藏或屏蔽的列表项中恢复
    - 了解 ClawHub 的审核、封禁或账号状态
sidebarTitle: Moderation and Account Safety
summary: ClawHub 举报、审核暂扣、隐藏列表、封禁和账号状态的工作方式。
title: 内容审核和账号安全
x-i18n:
    generated_at: "2026-07-06T21:46:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# 内容审核和账号安全

ClawHub 对发布开放，但公开发现和安装界面仍然需要防护措施。举报、内容审核暂缓、隐藏列表和账号操作有助于在某个发布或账号看起来不安全、误导性或违反政策时保护用户。

本页介绍内容审核和账号状态。有关 `Pass`、`Review`、`Warn`、`Malicious` 等审计标签以及风险级别，请参阅 [Security Audits](/clawhub/security-audits)。

另请参阅 [Security](/clawhub/security) 和 [Acceptable usage](/clawhub/acceptable-usage)。对于版权或其他内容权利问题，请使用 [Content Rights Requests](/clawhub/content-rights)。

## 举报

已登录用户可以举报技能、插件和软件包。

仅将 ClawHub 举报用于不安全的市场内容，例如：

- 恶意列表
- 误导性元数据
- 未声明的凭证或权限要求
- 可疑的安装说明
- 冒充行为
- 恶意注册或商标滥用
- 违反 [Acceptable usage](/clawhub/acceptable-usage) 的内容

在技能页面使用 **举报技能** 按钮，或对软件包使用软件包举报命令/API。

不要将 ClawHub 举报用于第三方技能或插件自身源代码中的漏洞。请直接向列表中链接的发布者或源代码仓库报告这些问题。ClawHub 不维护或修补第三方技能或插件代码。

`openclaw/clawhub` 的 GitHub Security Advisories 用于 ClawHub 本身的漏洞。例如网站、API、CLI、注册表、认证、扫描、内容审核或下载/安装信任边界中的缺陷。不要将 ClawHub advisories 用于第三方技能或插件中的漏洞。

好的举报应具体且可操作。滥用举报本身也可能导致账号操作。

## 组织和命名空间声明

组织、品牌、软件包作用域、所有者账号名或命名空间所有权争议应使用 [Org and Namespace Claims](/clawhub/namespace-claims) 流程，而不是产品内举报流程或账号申诉表单。

当你需要 ClawHub 工作人员审核非敏感证明，以确认某个命名空间应被保留、转移、重命名、隐藏、隔离、设置别名或以其他方式审核时，请使用该流程。不要在公开 issue 中包含密钥、私人文档、私人法律文件、个人身份证明文件、API 令牌或 DNS challenge 令牌。

## 内容审核暂缓

某些严重发现或政策问题可能导致发布者或列表处于内容审核暂缓状态。发生这种情况时，受影响的内容可能会从公开发现中隐藏，或者未来发布可能会先以隐藏状态开始，直到问题经过审核。

内容审核暂缓旨在 ClawHub 处理高风险案例期间保护用户。确认误报后也可以解除暂缓。

## 隐藏或阻止的列表

列表可能被暂缓、隐藏、隔离、撤销，或在公开安装界面上以其他方式不可用。

如果你看到这些状态之一，除非所有者解决问题或内容审核恢复该发布，否则不要安装该发布。

所有者仍可能看到自己被暂缓或隐藏列表的诊断信息。这些诊断有助于说明发生了什么，以及列表恢复到公开界面前需要做出哪些更改。

## 封禁和账号状态

违反 ClawHub 政策的账号可能会失去发布访问权限。严重滥用可能导致账号封禁、令牌撤销、内容隐藏或列表移除。发布者滥用压力信号会每日检查。达到 ClawHub 潜在封禁阈值的信号可能会触发自动警告。如果警告截止时间后的下一次符合条件的扫描仍然将发布者置于潜在封禁阈值内，ClawHub 可能会自动应用账号操作。置信度较低以及有时间边界的审核信号不会进入自动执行。

已删除、被封禁或被禁用的账号无法使用 ClawHub API 令牌。如果账号操作后 CLI 认证开始失败，请登录网页 UI 查看账号状态。如果登录或正常 CLI 访问被封禁或禁用账号阻止，请使用 [ClawHub appeal form](https://appeals.openclaw.ai/) 进行恢复审核。

如果扫描器触发的电子邮件将某个技能或插件版本标记为恶意，请下载被阻止提交版本的已存储扫描结果：`clawhub scan download <slug> --version <version>`。对于插件，添加 `--kind plugin`。查看扫描输出，修复列表，递增版本号，然后上传修复后的版本。

## 发布者指南

为减少误报并提升用户信任：

- 保持名称、摘要、标签和变更日志准确
- 声明必需的环境变量和权限
- 避免混淆的安装命令
- 尽可能链接到源代码
- 发布插件前使用 dry runs
- 如果用户或审核人员询问发布行为，请清晰回应
