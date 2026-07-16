---
read_when:
    - 了解列表、版本、安装、发布和审核机制
summary: ClawHub 列表、版本、安装、发布、扫描和更新的工作原理。
x-i18n:
    generated_at: "2026-07-16T11:28:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub 的工作原理

ClawHub 是 OpenClaw Skills 和插件的注册表层。它为用户提供发现软件包的场所，为发布者提供发布版本的场所，并为 OpenClaw 提供足够的元数据，以便安全地安装和更新这些软件包。

## 注册表记录

每个公开条目都是一条注册表记录，包含：

- 所有者和 slug 或软件包名称
- 一个或多个已发布版本
- 元数据、摘要、文件和来源归属
- 变更日志和标签信息，例如 `latest`
- 下载、安装和收藏信号
- 安全扫描和审核状态

条目页面是用户安装 Skills 或插件前检查其所宣称功能的权威页面。

## Skills

Skills 是以 `SKILL.md` 为核心的版本化文本包。它可以包含支持文件、示例、模板和脚本。

ClawHub 读取 `SKILL.md` frontmatter，以了解 Skills 名称、描述、要求、环境变量和元数据。准确的元数据十分重要，因为它既能帮助用户决定是否安装 Skills，也能帮助自动扫描检测所声明行为与观测到的行为之间的不一致。

参阅 [Skills 格式](/zh-CN/clawhub/skill-format)。

## 插件

插件是打包后的 OpenClaw 扩展。ClawHub 存储软件包元数据、兼容性信息、源代码链接、工件和版本记录。

当 OpenClaw 从 ClawHub 安装插件时，它会在安装前检查声明的兼容性元数据。软件包记录可以包含 API 兼容性、最低 Gateway 网关版本、主机目标、环境要求和工件摘要。

如果希望以注册表为事实来源，请使用明确的 ClawHub 安装源：

```bash
openclaw plugins install clawhub:<package>
```

## 发布

发布操作会创建一条新的不可变版本记录。发布者使用 `clawhub` CLI 执行经过身份验证的注册表工作流：

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

上传前使用试运行预览解析后的有效负载。随后，公开页面会展示已发布的元数据、文件、来源归属和扫描状态。

## 安装和更新

OpenClaw 安装命令使用 ClawHub 作为软件包来源：

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw 会记录安装源元数据，以便以后更新时解析同一注册表软件包。对于希望在完整 OpenClaw 工作区之外使用由注册表管理的 Skills 文件夹的用户，ClawHub CLI 还支持直接安装和更新 Skills 的工作流。

## 安全状态

ClawHub 允许公开发布，但发布版本仍须接受上传门控、自动检查、用户举报和审核员处置。

公开页面会在扫描摘要可用时予以显示。被暂缓、隐藏或阻止的内容可能会从公开搜索和安装流程中消失，但所有者仍可查看这些内容以进行诊断。

参阅[安全](/clawhub/security)、[安全审计](/clawhub/security-audits)、[审核与账户安全](/zh-CN/clawhub/moderation)和[可接受使用规范](/clawhub/acceptable-usage)。

## API 访问

ClawHub 提供用于发现、搜索、获取软件包详情和下载的公开读取 API。第三方目录可以使用这些 API，但必须链接回权威 ClawHub 条目、遵守速率限制，并避免暗示其获得认可。

参阅[公共 API](/clawhub/api)和 [HTTP API](/clawhub/http-api)。
