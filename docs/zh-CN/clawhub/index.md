---
read_when:
    - 解释 ClawHub 是什么
    - 搜索、安装或更新 Skills 或插件
    - 将 Skills 或插件发布到注册表
    - 在 openclaw 和 clawhub CLI 流程之间选择
sidebarTitle: ClawHub
summary: 用于设备发现、安装、发布、安全和 clawhub CLI 的公共 ClawHub 概览。
title: ClawHub
x-i18n:
    generated_at: "2026-07-05T11:05:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub 是 OpenClaw Skills 和插件的公共注册表。

- 使用原生 `openclaw` 命令搜索、安装和更新 Skills，并从 ClawHub 安装插件。
- 使用单独的 `clawhub` CLI 处理注册表身份验证、发布，以及删除/恢复删除工作流。

站点：[clawhub.ai](https://clawhub.ai)

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

当你需要注册表认证的工作流（例如发布或删除/恢复删除）时，安装 ClawHub CLI：

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub 托管什么

| 表面           | 存储内容                                                     | 常用命令                                     |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | 带有 `SKILL.md` 及支持文件的版本化文本包                     | `openclaw skills install @openclaw/demo`     |
| 代码插件       | 带有兼容性元数据的 OpenClaw 插件包                           | `openclaw plugins install clawhub:<package>` |
| 捆绑插件       | 用于 OpenClaw 分发的打包插件包                               | `clawhub package publish <source>`           |

ClawHub 跟踪 semver 版本、`latest` 等标签、变更日志、文件、下载量、星标和安全扫描摘要。公共页面显示当前注册表状态，让用户在安装 Skills 或插件前进行检查。

## 原生 OpenClaw 流程

原生 OpenClaw 命令会安装到活跃的 OpenClaw 工作区，并持久化来源元数据，因此后续更新命令可以继续使用 ClawHub。

当插件安装应通过 ClawHub 解析时，使用 `clawhub:<package>`。裸 npm-safe 插件规格在发布切换期间可能会通过 npm 解析；当必须显式指定来源时，`npm:<package>` 保持仅使用 npm。

插件安装会在归档安装运行前验证声明的 `pluginApi` 和 `minGatewayVersion` 兼容性。当某个包版本发布 ClawPack 工件时，OpenClaw 会优先使用精确上传的 npm-pack `.tgz`，验证 ClawHub 摘要标头和下载字节，并记录工件元数据以供后续更新使用。

## ClawHub CLI

ClawHub CLI 用于需要注册表认证的工作：

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

CLI 也提供 Skills 安装/更新命令，用于直接注册表工作流：

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

这些命令会将 Skills 安装到当前工作目录下的 `./skills`，并在 `.clawhub/lock.json` 中记录已安装版本。

## 发布

从包含 `SKILL.md` 的本地文件夹发布 Skills：

```bash
clawhub skill publish <path>
```

常用发布选项：

- `--slug <slug>`：已发布 Skills 的 URL 名称。
- `--name <name>`：显示名称。
- `--version <version>`：semver 版本。
- `--changelog <text>`：变更日志文本。
- `--tags <tags>`：逗号分隔的标签，默认使用 `latest`。

从本地文件夹、`owner/repo`、`owner/repo@ref` 或 GitHub URL 发布插件：

```bash
clawhub package publish <source>
```

使用 `--dry-run` 构建精确的发布计划而不上传，使用 `--json` 获取适合 CI 的输出。

代码插件必须在 `package.json` 中包含所需的 OpenClaw 兼容性元数据，包括 `openclaw.compat.pluginApi` 和 `openclaw.build.openclawVersion`。完整命令参考见 [CLI](/zh-CN/clawhub/cli)，Skills 元数据见 [Skills 格式](/clawhub/skill-format)。

## 安全和审核

ClawHub 默认开放：任何人都可以上传，但发布需要一个足够久的 GitHub 账号才能通过上传门槛。公共详情页面会在安装或下载前汇总最新扫描状态。

ClawHub 会对已发布的 Skills 和插件版本运行自动检查。被扫描暂扣或阻止的版本可能会从公共目录和安装表面消失，但其所有者仍可在 `/dashboard` 中看到。

已登录用户可以举报 Skills 和包。审核员可以审查举报、隐藏或恢复内容，并封禁滥用账号。政策和执行细节见 [安全](/zh-CN/clawhub/security)、[安全审计](/clawhub/security-audits)、[审核和账号安全](/clawhub/moderation) 以及 [可接受使用](/zh-CN/clawhub/acceptable-usage)。

## 遥测和环境

当你在已登录状态下运行 `clawhub install` 时，CLI 可能会发送尽力而为的安装事件，以便 ClawHub 计算聚合安装数量。使用以下方式禁用：

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

有用的环境覆盖项：

| 变量                          | 效果                                              |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | 覆盖用于浏览器登录的站点 URL。                   |
| `CLAWHUB_REGISTRY`            | 覆盖注册表 API URL。                             |
| `CLAWHUB_CONFIG_PATH`         | 覆盖 CLI 存储令牌/配置状态的位置。               |
| `CLAWHUB_WORKDIR`             | 覆盖默认工作目录。                               |
| `CLAWHUB_DISABLE_TELEMETRY=1` | 禁用安装遥测。                                   |

更深入的参考资料见 [遥测](/clawhub/telemetry)、[HTTP API](/clawhub/http-api) 和 [故障排查](/zh-CN/clawhub/troubleshooting)。
