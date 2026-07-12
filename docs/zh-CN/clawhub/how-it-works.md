---
read_when:
    - 了解列表、版本、安装、发布和审核机制
summary: ClawHub 列表、版本、安装、发布、扫描和更新的工作原理。
x-i18n:
    generated_at: "2026-07-12T14:21:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub 的工作原理

ClawHub 是 OpenClaw Skills 和插件的注册表层。它为用户提供发现软件包的
平台，为发布者提供发布版本的平台，并为 OpenClaw 提供足够的元数据，
以便安全地安装和更新这些软件包。

## 注册表记录

每个公开条目都是一条注册表记录，其中包含：

- 所有者和 slug 或软件包名称
- 一个或多个已发布版本
- 元数据、摘要、文件和来源说明
- 更新日志和标签信息，例如 `latest`
- 下载、安装和收藏信号
- 安全扫描和审核状态

条目页面是用户在安装前查看某项 Skills 或插件所声明功能的权威位置。

## Skills

Skills 是以 `SKILL.md` 为核心的版本化文本包。它可以包含
辅助文件、示例、模板和脚本。

ClawHub 会读取 `SKILL.md` 的 frontmatter，以了解 Skills 名称、
描述、要求、环境变量和元数据。准确的元数据很重要，因为它能帮助用户
决定是否安装该 Skills，还能帮助自动扫描检测声明行为与实际观察到的行为之间的不一致。

请参阅 [Skills 格式](/zh-CN/clawhub/skill-format)。

## 插件

插件是打包后的 OpenClaw 扩展。ClawHub 存储软件包元数据、
兼容性信息、源代码链接、工件和版本记录。

当 OpenClaw 从 ClawHub 安装插件时，会在安装前检查声明的兼容性
元数据。软件包记录可以包含 API 兼容性、最低 Gateway 网关版本、
主机目标、环境要求和工件摘要。

如果希望将注册表作为事实来源，请使用明确的 ClawHub 安装源：

```bash
openclaw plugins install clawhub:<package>
```

## 发布

发布操作会创建一条新的不可变版本记录。发布者使用 `clawhub`
CLI 执行经过身份验证的注册表工作流：

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

上传前使用试运行预览解析后的有效载荷。随后，公开页面会
展示已发布的元数据、文件、来源说明和扫描状态。

## 安装和更新

OpenClaw 安装命令使用 ClawHub 作为软件包源：

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw 会记录安装源元数据，以便后续更新可以解析同一个
注册表软件包。对于希望在完整 OpenClaw 工作区之外使用由注册表管理的
Skills 文件夹的用户，ClawHub CLI 还支持直接安装和更新 Skills 的工作流。

## 安全状态

ClawHub 开放发布，但发布版本仍需经过上传门禁、
自动检查、用户举报和审核人员处置。

公开页面会在扫描摘要可用时显示它。被暂扣、隐藏
或阻止的内容可能会从公开搜索和安装流程中消失，但所有者仍可查看，
以便进行诊断。

请参阅[安全](/clawhub/security)、[安全审计](/clawhub/security-audits)、
[审核和账户安全](/zh-CN/clawhub/moderation)以及
[可接受使用规范](/clawhub/acceptable-usage)。

## API 访问

ClawHub 提供公开的只读 API，用于设备发现、搜索、软件包详情和
下载。第三方目录可以使用这些 API，但必须链接回
ClawHub 的权威条目、遵守速率限制，并避免暗示获得认可。

请参阅[公开 API](/clawhub/api)和 [HTTP API](/clawhub/http-api)。
