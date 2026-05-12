---
read_when:
    - 解释 ClawHub 是什么
    - 搜索、安装或更新技能或插件
    - 将 Skills 或插件发布到注册表
    - 在 openclaw 和 clawhub CLI 流程之间选择
sidebarTitle: ClawHub
summary: 公共 ClawHub 概览，涵盖发现、安装、发布、安全和 clawhub CLI。
title: ClawHub
x-i18n:
    generated_at: "2026-05-12T00:57:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0543f0565d2768e9fd77270851eb1043d252071572ff5cd5c70a5e7e38abf149
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub 是 OpenClaw Skills 和插件的公共注册表。

- 使用原生 `openclaw` 命令搜索、安装和更新 Skills，并从 ClawHub 安装插件。
- 使用单独的 `clawhub` CLI 处理注册表认证、发布、删除/恢复删除和同步工作流。

站点：[clawhub.ai](https://clawhub.ai)

## 快速开始

使用 OpenClaw 搜索并安装 Skills：

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

使用 OpenClaw 搜索并安装插件：

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

当你需要发布、同步或删除/恢复删除等需要注册表认证的工作流时，安装 ClawHub CLI：

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub 托管的内容

| 表面           | 存储内容                                                     | 典型命令                                     |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | 带有 `SKILL.md` 及支持文件的版本化文本包                     | `openclaw skills install <slug>`             |
| 代码插件       | 带有兼容性元数据的 OpenClaw 插件包                           | `openclaw plugins install clawhub:<package>` |
| Bundle 插件    | 用于 OpenClaw 分发的打包插件包                               | `clawhub package publish <source>`           |
| Souls          | 仅在 onlycrabs.ai 上显示的 `SOUL.md` 包                      | Web 和 API 发布流程                          |

ClawHub 跟踪 semver 版本、`latest` 等标签、变更日志、文件、下载量、星标和安全扫描摘要。公共页面会显示当前注册表状态，以便用户在安装某个 Skill 或插件前检查它。

## 原生 OpenClaw 流程

原生 OpenClaw 命令会安装到当前活动的 OpenClaw 工作区，并持久化来源元数据，使后续更新命令可以继续使用 ClawHub。

当插件安装应通过 ClawHub 解析时，使用 `clawhub:<package>`。裸 npm-safe 插件规格在发布切换期间可能会通过 npm 解析，而当必须明确来源时，`npm:<package>` 会保持仅使用 npm。

插件安装会在归档安装运行前验证声明的 `pluginApi` 和 `minGatewayVersion` 兼容性。当某个包版本发布 ClawPack 构件时，OpenClaw 会优先使用精确上传的 npm-pack `.tgz`，验证 ClawHub 摘要标头和下载字节，并记录构件元数据以供后续更新使用。

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
clawhub sync --all
```

该 CLI 还提供用于直接注册表工作流的 Skill 安装/更新命令：

```bash
clawhub install <slug>
clawhub update <slug>
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

- `--slug <slug>`：Skill slug。
- `--name <name>`：显示名称。
- `--version <version>`：semver 版本。
- `--changelog <text>`：变更日志文本。
- `--tags <tags>`：逗号分隔的标签，默认为 `latest`。

从本地文件夹、`owner/repo`、`owner/repo@ref` 或 GitHub URL 发布插件：

```bash
clawhub package publish <source>
```

使用 `--dry-run` 构建精确的发布计划而不上传，并使用 `--json` 获取适合 CI 的输出。

代码插件必须在 `package.json` 中包含必需的 OpenClaw 兼容性元数据，包括 `openclaw.compat.pluginApi` 和 `openclaw.build.openclawVersion`。完整命令参考见 [CLI](/zh-CN/clawhub/cli)，Skill 元数据见 [Skill format](/zh-CN/clawhub/skill-format)。

## 安全与审核

ClawHub 默认开放：任何人都可以上传，但发布需要 GitHub 账号足够旧以通过上传门槛。公共详情页面会在安装或下载前汇总最新扫描状态。

ClawHub 会对已发布的 Skills 和插件版本运行自动检查。被扫描保留或被阻止的版本可能会从公共目录和安装界面中消失，但仍会在 `/dashboard` 中对其所有者可见。

已登录用户可以举报 Skills 和包。审核员可以审查举报、隐藏或恢复内容，并封禁滥用账号。政策和执行详情见 [Acceptable usage](/zh-CN/clawhub/acceptable-usage) 和 [Security + moderation](/zh-CN/clawhub/security)。

## 遥测和环境

当你在已登录状态下运行 `clawhub sync` 时，CLI 会发送最小快照，以便 ClawHub 计算安装数量。使用以下方式禁用：

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

有用的环境覆盖项：

| 变量                          | 效果                                              |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | 覆盖用于浏览器登录的站点 URL。                    |
| `CLAWHUB_REGISTRY`            | 覆盖注册表 API URL。                              |
| `CLAWHUB_CONFIG_PATH`         | 覆盖 CLI 存储令牌/配置状态的位置。                |
| `CLAWHUB_WORKDIR`             | 覆盖默认工作目录。                                |
| `CLAWHUB_DISABLE_TELEMETRY=1` | 禁用 `sync` 的遥测。                              |

更深入的参考资料见 [Telemetry](/zh-CN/clawhub/telemetry)、[HTTP API](/zh-CN/clawhub/http-api) 和 [Troubleshooting](/zh-CN/clawhub/troubleshooting)。
