---
read_when:
    - 了解列表、版本、安装、发布和审核
summary: ClawHub 列表、版本、安装、发布、扫描和更新的工作原理。
x-i18n:
    generated_at: "2026-05-11T20:23:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4b995124c07d598a60897fa79fb61c4250a28f47d93d3bd62949f3a3364072e
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub 的工作原理

ClawHub 是 OpenClaw 技能和插件的注册表层。它为用户提供发现包的
位置，为发布者提供发布版本的位置，并为 OpenClaw 提供足够的元数据，
以便安全地安装和更新这些包。

## 注册表记录

每个公开列表都是一条注册表记录，包含：

- 所有者和 slug 或包名
- 一个或多个已发布版本
- 元数据、摘要、文件和来源归属
- 变更日志以及 `latest` 等标签信息
- 下载、安装、星标和评论信号
- 安全扫描和审核状态

列表页是用户在安装技能或插件前检查其声明功能的规范位置。

## Skills

技能是以 `SKILL.md` 为核心的版本化文本包。它可以包含
支持文件、示例、模板和脚本。

ClawHub 会读取 `SKILL.md` frontmatter，以了解技能名称、
描述、要求、环境变量和元数据。准确的元数据很重要，因为它能帮助用户决定是否安装该技能，
并帮助自动化扫描检测声明行为与观察到的行为之间的不匹配。

参见 [技能格式](/zh-CN/clawhub/skill-format)。

## 插件

插件是打包后的 OpenClaw 扩展。ClawHub 存储包元数据、
兼容性信息、源码链接、构件和版本记录。

当 OpenClaw 从 ClawHub 安装插件时，它会在安装前检查声明的兼容性
元数据。包记录可以包含 API 兼容性、
最低 Gateway 网关版本、主机目标、环境要求和构件
摘要。

当你希望注册表作为事实来源时，请使用显式的 ClawHub 安装源：

```bash
openclaw plugins install clawhub:<package>
```

## 发布

发布会创建新的不可变版本记录。发布者使用 `clawhub`
CLI 执行经过身份验证的注册表工作流：

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

使用试运行在上传前预览解析后的载荷。随后公开页面会展示
已发布的元数据、文件、来源归属和扫描状态。

## 安装和更新

OpenClaw 安装命令使用 ClawHub 作为包源：

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw 会记录安装源元数据，以便更新后续能够解析同一个
注册表包。ClawHub CLI 还支持直接的技能安装和
更新工作流，适用于希望在完整 OpenClaw 工作区之外使用注册表管理技能文件夹的用户。

## 安全状态

ClawHub 对发布开放，但发布版本仍会受上传门禁、
自动化检查、用户报告和审核员操作约束。

公开页面会在可用时显示扫描摘要。被保留、隐藏
或阻止的内容可能会从公开搜索和安装流程中消失，同时仍对所有者
可见，以便诊断或申诉。

参见 [安全与审核](/zh-CN/clawhub/security) 和
[可接受使用](/zh-CN/clawhub/acceptable-usage)。

## API 访问

ClawHub 暴露公开读取 API，用于发现、搜索、包详情和
下载。第三方目录可以使用这些 API，前提是它们链接回
规范 ClawHub 列表，遵守速率限制，并避免暗示背书。

参见 [公共 API](/zh-CN/clawhub/api) 和 [HTTP API](/zh-CN/clawhub/http-api)。
