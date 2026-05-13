---
read_when:
    - 首次使用 ClawHub
    - 从注册表安装技能或插件
    - 发布到 ClawHub
summary: 开始使用 ClawHub：查找、安装、更新和发布 Skills 或插件。
x-i18n:
    generated_at: "2026-05-13T04:18:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# 快速开始

ClawHub 是 OpenClaw 技能和插件的注册表。

将内容安装到 OpenClaw 时使用 OpenClaw。在登录、发布、管理你自己的列表，或使用注册表专用工作流时，使用 `clawhub` CLI。

## 查找并安装技能

从 OpenClaw 搜索：

```bash
openclaw skills search "calendar"
```

安装技能：

```bash
openclaw skills install <skill-slug>
```

更新已安装的技能：

```bash
openclaw skills update --all
```

OpenClaw 会记录技能的来源，以便后续更新可以继续通过 ClawHub 解析。

## 查找并安装插件

从 OpenClaw 搜索：

```bash
openclaw plugins search "calendar"
```

使用显式的 ClawHub 来源安装由 ClawHub 托管的插件：

```bash
openclaw plugins install clawhub:<package>
```

更新已安装的插件：

```bash
openclaw plugins update --all
```

当你希望 OpenClaw 通过 ClawHub 而不是 npm 或其他来源解析包时，请使用 `clawhub:` 前缀。

## 登录以发布

安装 ClawHub CLI：

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

使用 GitHub 登录：

```bash
clawhub login
clawhub whoami
```

无界面环境可以使用来自 ClawHub Web UI 的 API 令牌：

```bash
clawhub login --token clh_...
```

## 发布技能

技能是一个文件夹，其中包含必需的 `SKILL.md` 文件，以及可选的支持文件。

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --changelog "Initial release"
```

发布前，请检查 `SKILL.md` 中的元数据。声明必需的环境变量、工具和权限，让用户在安装前了解该技能需要什么。请参阅 [技能格式](/zh-CN/clawhub/skill-format)。

## 发布插件

从本地文件夹、GitHub 仓库、GitHub ref 或现有归档发布插件：

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

先使用 `--dry-run` 预览解析后的包元数据、兼容性字段、来源归属和上传计划，而不实际发布。

代码插件必须在 `package.json` 中包含 OpenClaw 兼容性元数据，包括 `openclaw.compat.pluginApi` 和 `openclaw.build.openclawVersion`。

## 同步你维护的技能

`sync` 会扫描技能文件夹，并发布尚未同步的新技能或已更改技能。

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

登录后，`sync` 也可能发送一个最小安装快照，用于汇总安装次数。请参阅 [遥测](/zh-CN/clawhub/telemetry)，了解会上报哪些内容以及如何选择退出。

## 安装前检查

安装前，请使用 ClawHub 网页或 CLI 详情命令检查元数据、来源链接、版本、更新日志和扫描状态：

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

公开列表会显示最新扫描状态。被审核保留或阻止的发布版本，在解决之前可能会从搜索和安装界面中隐藏。
