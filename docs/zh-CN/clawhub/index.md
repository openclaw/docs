---
read_when:
    - 解释 ClawHub 是什么
    - 搜索、安装或更新 Skills 或插件
    - 将技能或插件发布到注册表
    - 在 openclaw 和 clawhub CLI 流程之间选择
sidebarTitle: ClawHub
summary: 公开的 ClawHub 概览，涵盖设备发现、安装、发布、安全和 clawhub CLI。
title: ClawHub
x-i18n:
    generated_at: "2026-05-10T19:25:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 023fec4cd9d6fce2f2da79d1f975ebda37b79c21a73c17aa1804f425527f3e40
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub 是 OpenClaw Skills 和插件的公共注册表。

- 使用原生 `openclaw` 命令搜索、安装和更新 Skills，以及从 ClawHub 安装插件。
- 使用单独的 `clawhub` CLI 处理注册表身份验证、发布、删除/取消删除、重新扫描和同步工作流。

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

当你需要经过注册表身份验证的工作流时，安装 ClawHub CLI，例如
发布、同步、删除/取消删除，或所有者请求的重新扫描：

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub 托管的内容

| 表面           | 存储内容                                                     | 常用命令                                     |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | 带有 `SKILL.md` 及支持文件的版本化文本包                     | `openclaw skills install <slug>`             |
| 代码插件       | 带兼容性元数据的 OpenClaw 插件包                             | `openclaw plugins install clawhub:<package>` |
| 打包插件       | 用于 OpenClaw 分发的已打包插件包                             | `clawhub package publish <source>`           |
| Souls          | 仅在 onlycrabs.ai 上显示的 `SOUL.md` 包                      | Web 和 API 发布流程                          |

ClawHub 跟踪 semver 版本、诸如 `latest` 的标签、更新日志、文件、
下载量、星标和安全扫描摘要。公共页面显示当前注册表
状态，以便用户在安装 Skills 或插件之前进行检查。

## 原生 OpenClaw 流程

原生 OpenClaw 命令会安装到活动的 OpenClaw 工作区，并持久化
来源元数据，使后续更新命令可以继续停留在 ClawHub 上。

当插件安装应通过 ClawHub 解析时，使用 `clawhub:<package>`。
在发布切换期间，裸 npm 安全插件规范可能会通过 npm 解析，而当来源必须明确时，
`npm:<package>` 会保持仅使用 npm。

插件安装会在归档安装运行前验证声明的 `pluginApi` 和 `minGatewayVersion`
兼容性。当某个包版本发布 ClawPack 构件时，OpenClaw 会优先使用精确上传的 npm-pack `.tgz`，
验证 ClawHub 摘要标头和下载字节，并记录构件元数据以便后续更新使用。

## ClawHub CLI

ClawHub CLI 用于经过注册表身份验证的工作：

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

CLI 还提供用于直接注册表工作流的 Skills 安装/更新命令：

```bash
clawhub install <slug>
clawhub update <slug>
clawhub update --all
clawhub list
```

这些命令会将 Skills 安装到当前工作目录下的 `./skills`，
并在 `.clawhub/lock.json` 中记录已安装版本。

## 发布

从包含 `SKILL.md` 的本地文件夹发布 Skills：

```bash
clawhub skill publish <path>
```

常用发布选项：

- `--slug <slug>`：Skills slug。
- `--name <name>`：显示名称。
- `--version <version>`：semver 版本。
- `--changelog <text>`：更新日志文本。
- `--tags <tags>`：逗号分隔的标签，默认为 `latest`。

从本地文件夹、`owner/repo`、`owner/repo@ref` 或 GitHub
URL 发布插件：

```bash
clawhub package publish <source>
```

使用 `--dry-run` 构建精确的发布计划而不上传，并使用 `--json`
生成适合 CI 的输出。

代码插件必须在 `package.json` 中包含必需的 OpenClaw 兼容性元数据，
包括 `openclaw.compat.pluginApi` 和
`openclaw.build.openclawVersion`。请参阅 [CLI](/zh-CN/clawhub/cli) 获取完整命令
参考，并参阅 [Skill 格式](/zh-CN/clawhub/skill-format) 获取 Skills 元数据。

## 安全与审核

ClawHub 默认开放：任何人都可以上传，但发布需要一个足够旧、能够通过上传门禁的 GitHub
账号。公共详情页面会在安装或下载前汇总
最新扫描状态。

ClawHub 会对已发布的 Skills 和插件版本运行自动检查。被扫描暂缓
或被阻止的版本可能会从公共目录和安装表面消失，
但其所有者仍可在 `/dashboard` 中看到。

所有者可以请求有限的重新扫描，以便从误报中恢复。平台
版主和管理员在处理支持报告时，可以请求重新扫描任何 Skills 或包：

```bash
clawhub skill rescan <slug>
clawhub package rescan <name>
```

已登录用户可以举报 Skills 和包。版主可以审查报告、
隐藏或恢复内容、解决申诉，并封禁滥用账号。请参阅
[可接受使用](/zh-CN/clawhub/acceptable-usage) 和
[安全 + 审核](/zh-CN/clawhub/security)，了解策略和执行细节。

## 遥测和环境

当你在已登录状态下运行 `clawhub sync` 时，CLI 会发送一个最小快照，以便
ClawHub 计算安装数量。使用以下方式禁用：

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

有用的环境覆盖项：

| 变量                          | 作用                                              |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | 覆盖用于浏览器登录的站点 URL。                    |
| `CLAWHUB_REGISTRY`            | 覆盖注册表 API URL。                              |
| `CLAWHUB_CONFIG_PATH`         | 覆盖 CLI 存储令牌/配置状态的位置。                |
| `CLAWHUB_WORKDIR`             | 覆盖默认工作目录。                                |
| `CLAWHUB_DISABLE_TELEMETRY=1` | 禁用 `sync` 上的遥测。                            |

请参阅 [遥测](/zh-CN/clawhub/telemetry)、[HTTP API](/zh-CN/clawhub/http-api) 和
[故障排除](/zh-CN/clawhub/troubleshooting)，获取更深入的参考资料。
