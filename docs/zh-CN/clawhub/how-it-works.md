---
read_when:
    - 理解列表、版本、安装、发布和审核
summary: ClawHub 条目、版本、安装、发布、扫描和更新的工作方式。
x-i18n:
    generated_at: "2026-07-01T20:11:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub 工作原理

ClawHub 是 OpenClaw Skills 和插件的注册表层。它为用户提供发现软件包的地方，为发布者提供发布版本的地方，并为 OpenClaw 提供足够的元数据，以便安全安装和更新这些软件包。

## 注册表记录

每个公开列表都是一条注册表记录，包含：

- 所有者和 slug 或包名
- 一个或多个已发布版本
- 元数据、摘要、文件和来源归属
- 变更日志和标签信息，例如 `latest`
- 下载、安装和星标信号
- 安全扫描和审核状态

列表页面是用户在安装前检查某个 Skills 或插件声称用途的规范位置。

## Skills

Skills 是以 `SKILL.md` 为中心的版本化文本包。它可以包含支持文件、示例、模板和脚本。

ClawHub 会读取 `SKILL.md` frontmatter，以了解 Skills 名称、描述、要求、环境变量和元数据。准确的元数据很重要，因为它能帮助用户决定是否安装该 Skills，并帮助自动化扫描检测声明行为与观察到的行为之间的不匹配。

参见 [Skills 格式](/zh-CN/clawhub/skill-format)。

## 插件

插件是打包的 OpenClaw 扩展。ClawHub 存储包元数据、兼容性信息、来源链接、工件和版本记录。

当 OpenClaw 从 ClawHub 安装插件时，它会先检查声明的兼容性元数据再安装。包记录可以包含 API 兼容性、最低 Gateway 网关版本、主机目标、环境要求和工件摘要。

当你希望注册表成为事实来源时，请使用显式的 ClawHub 安装来源：

```bash
openclaw plugins install clawhub:<package>
```

## 发布

发布会创建一条新的不可变版本记录。发布者使用 `clawhub` CLI 执行经过身份验证的注册表工作流：

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

使用 dry run 在上传前预览解析后的载荷。随后公开页面会展示已发布的元数据、文件、来源归属和扫描状态。

## 安装和更新

OpenClaw 安装命令将 ClawHub 用作包来源：

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw 会记录安装来源元数据，以便以后更新时可以解析同一个注册表包。对于希望在完整 OpenClaw 工作区之外使用由注册表管理的 Skills 文件夹的用户，ClawHub CLI 也支持直接 Skills 安装和更新工作流。

## 安全状态

ClawHub 开放发布，但发布版本仍需经过上传关卡、自动化检查、用户报告和审核员操作。

公开页面会在可用时显示扫描摘要。被保留、隐藏或阻止的内容可能会从公开搜索和安装流程中消失，同时仍对所有者可见以便诊断。

参见 [安全](/clawhub/security)、[安全审计](/clawhub/security-audits)、[审核和账号安全](/zh-CN/clawhub/moderation) 以及 [可接受使用](/clawhub/acceptable-usage)。

## API 访问

ClawHub 暴露公开读取 API，用于发现、搜索、包详情和下载。第三方目录可以使用这些 API，前提是它们链接回规范的 ClawHub 列表、遵守速率限制，并避免暗示背书。

参见 [公开 API](/zh-CN/clawhub/api) 和 [HTTP API](/clawhub/http-api)。
