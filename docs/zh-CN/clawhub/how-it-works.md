---
read_when:
    - 了解清单、版本、安装、发布和审核机制
summary: ClawHub 列表、版本、安装、发布、扫描和更新的工作原理。
x-i18n:
    generated_at: "2026-07-14T13:31:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub 的工作原理

ClawHub 是 OpenClaw 技能和插件的注册表层。它为用户提供发现软件包的
平台，为发布者提供发布版本的平台，并为 OpenClaw 提供足够的元数据，
以便安全地安装和更新这些软件包。

## 注册表记录

每个公开条目都是一条注册表记录，包含：

- 所有者及 slug 或软件包名称
- 一个或多个已发布版本
- 元数据、摘要、文件和来源归属
- 变更日志和标签信息，例如 `latest`
- 下载、安装和加星信号
- 安全扫描和审核状态

条目页面是用户在安装技能或插件之前，查看其所声明功能的权威位置。

## Skills

技能是以 `SKILL.md` 为核心的版本化文本包。它可以包含
辅助文件、示例、模板和脚本。

ClawHub 读取 `SKILL.md` frontmatter，以了解技能名称、
描述、要求、环境变量和元数据。准确的元数据非常重要，因为它有助于
用户决定是否安装技能，也有助于自动扫描检测声明行为与观察到的行为之间
是否存在不一致。

参阅[技能格式](/zh-CN/clawhub/skill-format)。

## 插件

插件是打包的 OpenClaw 扩展。ClawHub 存储软件包元数据、
兼容性信息、源代码链接、工件和版本记录。

当 OpenClaw 从 ClawHub 安装插件时，会在安装前检查其声明的兼容性
元数据。软件包记录可以包含 API 兼容性、最低 Gateway 网关版本、
主机目标、环境要求和工件摘要。

如果希望注册表作为唯一事实来源，请使用明确的 ClawHub 安装源：

```bash
openclaw plugins install clawhub:<package>
```

## 发布

发布操作会创建一条新的不可变版本记录。发布者使用 `clawhub`
CLI 执行需要身份验证的注册表工作流：

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

上传前使用试运行预览解析后的有效载荷。之后，公开页面会
展示已发布的元数据、文件、来源归属和扫描状态。

## 安装和更新

OpenClaw 安装命令使用 ClawHub 作为软件包来源：

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw 会记录安装源元数据，以便后续更新能够解析同一个
注册表软件包。对于希望在完整 OpenClaw 工作区之外使用注册表管理
技能文件夹的用户，ClawHub CLI 还支持直接安装和更新技能的工作流。

## 安全状态

ClawHub 开放发布，但发布版本仍须通过上传关卡、
自动检查，并接受用户举报和审核人员处置。

公开页面会在扫描摘要可用时显示它。被暂扣、隐藏或
阻止的内容可能会从公开搜索和安装流程中消失，但所有者仍可
查看这些内容以进行诊断。

参阅[安全](/clawhub/security)、[安全审计](/clawhub/security-audits)、
[审核与账户安全](/zh-CN/clawhub/moderation)和
[可接受使用规范](/clawhub/acceptable-usage)。

## API 访问

ClawHub 提供公开的读取 API，用于设备发现、搜索、查看软件包详情和
下载。第三方目录可以使用这些 API，但必须链接回权威的 ClawHub 条目、
遵守速率限制，并避免暗示获得认可。

参阅[公共 API](/clawhub/api)和 [HTTP API](/clawhub/http-api)。
