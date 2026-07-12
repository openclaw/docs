---
read_when:
    - 解释 ClawHub 是什么
    - 搜索、安装或更新 Skills 或插件
    - 将 Skills 或插件发布到注册表
    - 在 openclaw 与 clawhub CLI 流程之间进行选择
sidebarTitle: ClawHub
summary: ClawHub 公共概览，涵盖发现、安装、发布、安全性以及 clawhub CLI。
title: ClawHub
x-i18n:
    generated_at: "2026-07-12T14:20:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub 是 OpenClaw 技能和插件的公共注册表。

- 使用原生 `openclaw` 命令搜索、安装和更新技能，以及从 ClawHub 安装插件。
- 使用独立的 `clawhub` CLI 进行注册表身份验证、发布以及删除/恢复删除工作流。

网站：[clawhub.ai](https://clawhub.ai)

## 快速开始

使用 OpenClaw 搜索和安装技能：

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

使用 OpenClaw 搜索和安装插件：

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

当你需要发布或删除/恢复删除等需要注册表身份验证的工作流时，请安装 ClawHub CLI：

```bash
npm i -g clawhub
# 或
pnpm add -g clawhub
```

## ClawHub 托管的内容

| 类型       | 存储内容                                                | 常用命令                                     |
| ---------- | ------------------------------------------------------- | -------------------------------------------- |
| 技能       | 包含 `SKILL.md` 和支持文件的版本化文本包                | `openclaw skills install @openclaw/demo`     |
| 代码插件   | 带有兼容性元数据的 OpenClaw 插件包                      | `openclaw plugins install clawhub:<package>` |
| 捆绑插件   | 用于 OpenClaw 分发的已打包插件捆绑包                    | `clawhub package publish <source>`           |

ClawHub 跟踪 semver 版本、`latest` 等标签、变更日志、文件、下载量、星标数和安全扫描摘要。公共页面显示当前注册表状态，以便用户在安装技能或插件之前进行检查。

## 原生 OpenClaw 工作流

原生 OpenClaw 命令会安装到当前活动的 OpenClaw 工作区，并持久化来源元数据，以便后续更新命令继续使用 ClawHub。

当插件安装应通过 ClawHub 解析时，请使用 `clawhub:<package>`。在发布切换期间，仅包含 npm 安全字符的插件规范可能会通过 npm 解析；当必须明确指定来源时，`npm:<package>` 始终仅使用 npm。

插件安装会在执行归档安装前，验证声明的 `pluginApi` 和 `minGatewayVersion` 兼容性。当某个软件包版本发布了 ClawPack 工件时，OpenClaw 会优先使用准确上传的 npm-pack `.tgz`，验证 ClawHub 摘要标头和下载的字节，并记录工件元数据以供后续更新使用。

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

CLI 还提供技能安装/更新命令，用于直接执行注册表工作流：

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

这些命令会将技能安装到当前工作目录下的 `./skills`，并在 `.clawhub/lock.json` 中记录已安装的版本。

## 发布

从包含 `SKILL.md` 的本地文件夹发布技能：

```bash
clawhub skill publish <path>
```

常用发布选项：

- `--slug <slug>`：已发布技能的 URL 名称。
- `--name <name>`：显示名称。
- `--version <version>`：semver 版本。
- `--changelog <text>`：变更日志文本。
- `--tags <tags>`：以逗号分隔的标签，默认为 `latest`。

从本地文件夹、`owner/repo`、`owner/repo@ref` 或 GitHub URL 发布插件：

```bash
clawhub package publish <source>
```

使用 `--dry-run` 构建准确的发布计划而不上传，使用 `--json` 获取适合 CI 的输出。

代码插件必须在 `package.json` 中包含必需的 OpenClaw 兼容性元数据，包括 `openclaw.compat.pluginApi` 和 `openclaw.build.openclawVersion`。完整命令参考请参阅 [CLI](/zh-CN/clawhub/cli)，技能元数据请参阅[技能格式](/clawhub/skill-format)。

## 安全与审核

ClawHub 默认开放：任何人都可以上传，但发布需要 GitHub 账号，且账号注册时长必须足以通过上传门槛。公开详情页面会在安装或下载前汇总最新的扫描状态。

ClawHub 会对已发布的技能和插件版本执行自动检查。被扫描暂扣或屏蔽的版本可能会从公共目录和安装界面中消失，但其所有者仍可在 `/dashboard` 中看到它们。

已登录的用户可以举报技能和软件包。审核员可以审查举报、隐藏或恢复内容，以及封禁滥用账号。有关策略和执行细节，请参阅[安全](/zh-CN/clawhub/security)、[安全审计](/clawhub/security-audits)、[审核与账号安全](/clawhub/moderation)和[可接受使用规范](/clawhub/acceptable-usage)。

## 遥测与环境

当你在已登录状态下运行 `clawhub install` 时，CLI 可能会尽力发送安装事件，以便 ClawHub 计算汇总安装次数。使用以下设置禁用此功能：

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

常用环境变量覆盖项：

| 变量                          | 作用                                            |
| ----------------------------- | ----------------------------------------------- |
| `CLAWHUB_SITE`                | 覆盖浏览器登录使用的网站 URL。                  |
| `CLAWHUB_REGISTRY`            | 覆盖注册表 API URL。                            |
| `CLAWHUB_CONFIG_PATH`         | 覆盖 CLI 存储令牌/配置状态的位置。              |
| `CLAWHUB_WORKDIR`             | 覆盖默认工作目录。                              |
| `CLAWHUB_DISABLE_TELEMETRY=1` | 禁用安装遥测。                                  |

如需更深入的参考资料，请参阅[遥测](/clawhub/telemetry)、[HTTP API](/clawhub/http-api)和[故障排查](/zh-CN/clawhub/troubleshooting)。
