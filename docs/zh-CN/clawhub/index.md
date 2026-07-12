---
read_when:
    - 解释 ClawHub 是什么
    - 搜索、安装或更新 Skills 或插件
    - 将 Skills 或插件发布到注册表
    - 在 openclaw 和 clawhub CLI 流程之间进行选择
sidebarTitle: ClawHub
summary: 面向公众的 ClawHub 概览，涵盖发现、安装、发布、安全和 clawhub CLI。
title: ClawHub
x-i18n:
    generated_at: "2026-07-11T20:24:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub 是 OpenClaw Skills 和插件的公共注册表。

- 使用原生 `openclaw` 命令搜索、安装和更新 Skills，以及从 ClawHub 安装插件。
- 使用独立的 `clawhub` CLI 执行注册表身份验证、发布以及删除/恢复删除工作流。

网站：[clawhub.ai](https://clawhub.ai)

## 快速开始

使用 OpenClaw 搜索并安装 Skills：

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

使用 OpenClaw 搜索并安装插件：

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

如果要使用需要注册表身份验证的工作流，例如发布或删除/恢复删除，请安装 ClawHub CLI：

```bash
npm i -g clawhub
# 或
pnpm add -g clawhub
```

## ClawHub 托管的内容

| 类型         | 存储内容                                                     | 常用命令                                     |
| ------------ | ------------------------------------------------------------ | -------------------------------------------- |
| Skills       | 包含 `SKILL.md` 和支持文件的版本化文本包                     | `openclaw skills install @openclaw/demo`     |
| 代码插件     | 带有兼容性元数据的 OpenClaw 插件包                           | `openclaw plugins install clawhub:<package>` |
| 插件捆绑包   | 用于 OpenClaw 分发的已打包插件捆绑包                         | `clawhub package publish <source>`           |

ClawHub 跟踪语义化版本、`latest` 等标签、变更日志、文件、下载次数、星标数和安全扫描摘要。公共页面会显示注册表的当前状态，让用户在安装前查看 Skill 或插件。

## 原生 OpenClaw 工作流

原生 OpenClaw 命令会将内容安装到当前启用的 OpenClaw 工作区，并持久保存来源元数据，以便后续更新命令继续使用 ClawHub。

当插件安装应通过 ClawHub 解析时，请使用 `clawhub:<package>`。在发布切换期间，不含特殊字符且符合 npm 规范的插件说明符可能通过 npm 解析；当必须明确指定来源时，`npm:<package>` 始终仅使用 npm。

在执行归档安装之前，插件安装会验证所声明的 `pluginApi` 和 `minGatewayVersion` 兼容性。如果某个软件包版本发布了 ClawPack 制品，OpenClaw 会优先使用所上传的原始 npm-pack `.tgz` 文件，验证 ClawHub 摘要标头和下载的字节内容，并记录制品元数据以供后续更新使用。

## ClawHub CLI

ClawHub CLI 用于需要注册表身份验证的操作：

```bash
clawhub login
clawhub whoami
clawhub search "postgres backups"
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0
clawhub package explore --family code-plugin
clawhub package inspect episodic-claw
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

CLI 还提供用于直接注册表工作流的 Skill 安装和更新命令：

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

这些命令会将 Skills 安装到当前工作目录下的 `./skills`，并在 `.clawhub/lock.json` 中记录已安装的版本。

## 发布

从包含 `SKILL.md` 的本地文件夹发布 Skills：

```bash
clawhub skill publish <path>
```

常用发布选项：

- `--slug <slug>`：已发布 Skill 的 URL 名称。
- `--name <name>`：显示名称。
- `--version <version>`：语义化版本。
- `--changelog <text>`：变更日志文本。
- `--tags <tags>`：以逗号分隔的标签，默认为 `latest`。

从本地文件夹、`owner/repo`、`owner/repo@ref` 或 GitHub URL 发布插件：

```bash
clawhub package publish <source>
```

使用 `--dry-run` 可在不上传的情况下生成准确的发布计划，使用 `--json` 可获得适合 CI 的输出。

代码插件必须在 `package.json` 中包含所需的 OpenClaw 兼容性元数据，包括 `openclaw.compat.pluginApi` 和 `openclaw.build.openclawVersion`。完整命令参考请参阅 [CLI](/zh-CN/clawhub/cli)，Skill 元数据请参阅 [Skill 格式](/clawhub/skill-format)。

## 安全与审核

ClawHub 默认开放：任何人都可以上传，但发布要求 GitHub 账号的注册时间足以通过上传门槛。公共详情页面会在安装或下载前汇总最新的扫描状态。

ClawHub 会对已发布的 Skills 和插件版本执行自动检查。被扫描流程暂扣或阻止的版本可能会从公共目录和安装界面中消失，但其所有者仍可在 `/dashboard` 中查看。

已登录用户可以举报 Skills 和软件包。审核员可以审查举报、隐藏或恢复内容，以及封禁滥用账号。有关策略和执行详情，请参阅[安全](/clawhub/security)、[安全审计](/zh-CN/clawhub/security-audits)、[审核与账号安全](/clawhub/moderation)和[可接受使用规范](/clawhub/acceptable-usage)。

## 遥测与环境

登录后运行 `clawhub install` 时，CLI 可能会尽力发送安装事件，以便 ClawHub 计算汇总安装次数。可通过以下方式禁用此功能：

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

常用环境变量覆盖项：

| 变量                          | 作用                                              |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | 覆盖浏览器登录使用的网站 URL。                    |
| `CLAWHUB_REGISTRY`            | 覆盖注册表 API URL。                              |
| `CLAWHUB_CONFIG_PATH`         | 覆盖 CLI 存储令牌和配置状态的位置。               |
| `CLAWHUB_WORKDIR`             | 覆盖默认工作目录。                                |
| `CLAWHUB_DISABLE_TELEMETRY=1` | 禁用安装遥测。                                    |

如需更深入的参考资料，请参阅[遥测](/zh-CN/clawhub/telemetry)、[HTTP API](/clawhub/http-api)和[故障排查](/clawhub/troubleshooting)。
