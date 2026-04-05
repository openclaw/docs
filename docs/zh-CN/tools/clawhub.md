---
read_when:
    - 向新用户介绍 ClawHub
    - 安装、搜索或发布技能或插件
    - 解释 ClawHub CLI 标志和同步行为
summary: ClawHub 指南：公共注册表、原生 OpenClaw 安装流程，以及 ClawHub CLI 工作流
title: ClawHub
x-i18n:
    generated_at: "2026-04-05T10:11:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: e65b3fd770ca96a5dd828dce2dee4ef127268f4884180a912f43d7744bc5706f
    source_path: tools/clawhub.md
    workflow: 15
---

# ClawHub

ClawHub 是 **OpenClaw 技能和插件**的公共注册表。

- 使用原生 `openclaw` 命令来搜索/安装/更新技能，并从 ClawHub 安装
  插件。
- 当你需要注册表认证、发布、删除、恢复删除或同步工作流时，请使用独立的 `clawhub` CLI。

站点：[clawhub.ai](https://clawhub.ai)

## 原生 OpenClaw 流程

技能：

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

插件：

```bash
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

裸 npm 安全插件规格也会在 npm 之前先尝试 ClawHub：

```bash
openclaw plugins install openclaw-codex-app-server
```

原生 `openclaw` 命令会安装到你当前激活的工作区中，并持久化源元数据，
这样后续的 `update` 调用就可以继续使用 ClawHub。

插件安装会在归档安装运行前校验声明的 `pluginApi` 和 `minGatewayVersion`
兼容性，因此不兼容的宿主会尽早以失败关闭，而不是只完成部分安装。

`openclaw plugins install clawhub:...` 仅接受可安装的插件族。
如果某个 ClawHub 包实际上是一个技能，OpenClaw 会停止并引导你改用
`openclaw skills install <slug>`。

## ClawHub 是什么

- OpenClaw 技能和插件的公共注册表。
- 技能包和元数据的版本化存储。
- 用于搜索、标签和使用信号的发现入口。

## 工作原理

1. 用户发布一个技能包（文件 + 元数据）。
2. ClawHub 存储该包，解析元数据，并分配一个版本。
3. 注册表为该技能建立索引，用于搜索和发现。
4. 用户在 OpenClaw 中浏览、下载并安装技能。

## 你可以做什么

- 发布新技能和现有技能的新版本。
- 按名称、标签或搜索发现技能。
- 下载技能包并检查其文件。
- 举报具有滥用性或不安全的技能。
- 如果你是版主，则可以隐藏、取消隐藏、删除或封禁。

## 适用对象（对新手友好）

如果你想为 OpenClaw 智能体添加新能力，ClawHub 是查找和安装技能最简单的方式。你不需要了解后端如何工作。你可以：

- 用自然语言搜索技能。
- 将技能安装到你的工作区中。
- 之后用一条命令更新技能。
- 通过发布你自己的技能来备份它们。

## 快速开始（非技术用户）

1. 搜索你需要的内容：
   - `openclaw skills search "calendar"`
2. 安装一个技能：
   - `openclaw skills install <skill-slug>`
3. 启动一个新的 OpenClaw 会话，以便加载新技能。
4. 如果你想发布或管理注册表认证，也请安装独立的
   `clawhub` CLI。

## 安装 ClawHub CLI

只有在需要注册表认证工作流（如发布/同步）时，你才需要它：

```bash
npm i -g clawhub
```

```bash
pnpm add -g clawhub
```

## 它如何融入 OpenClaw

原生 `openclaw skills install` 会安装到当前激活工作区的 `skills/`
目录中。`openclaw plugins install clawhub:...` 会记录常规的托管
插件安装，以及用于后续更新的 ClawHub 源元数据。

匿名 ClawHub 插件安装对于私有包也会以失败关闭。
社区或其他非官方渠道仍可安装，但 OpenClaw 会发出警告，
以便操作员在启用前审查来源和验证情况。

独立的 `clawhub` CLI 还会将技能安装到当前工作目录下的 `./skills` 中。
如果配置了 OpenClaw 工作区，`clawhub`
会回退到该工作区，除非你通过 `--workdir`（或
`CLAWHUB_WORKDIR`）覆盖它。OpenClaw 会从 `<workspace>/skills`
加载工作区技能，并会在**下一次**会话中拾取它们。如果你已经在使用
`~/.openclaw/skills` 或内置技能，则工作区技能具有更高优先级。

有关技能如何加载、共享和门控的更多细节，请参阅
[Skills](/zh-CN/tools/skills)。

## 技能系统概览

技能是一个带版本的文件包，用于教会 OpenClaw 如何执行某项
特定任务。每次发布都会创建一个新版本，注册表会保留版本历史，
以便用户审计变更。

一个典型技能包括：

- 一个 `SKILL.md` 文件，包含主要说明和用法。
- 技能使用的可选配置、脚本或辅助文件。
- 标签、摘要和安装要求等元数据。

ClawHub 使用元数据来驱动发现能力，并安全地暴露技能能力。
注册表还会跟踪使用信号（例如星标和下载量），以提升
排序和可见性。

## 服务提供的内容（功能）

- **公开浏览** 技能及其 `SKILL.md` 内容。
- 由嵌入驱动的 **搜索**（向量搜索），而不只是关键词。
- 使用 semver、变更日志和标签（包括 `latest`）的 **版本管理**。
- 每个版本一个 zip 的 **下载**。
- 用于社区反馈的 **星标和评论**。
- 用于审批和审计的 **审核** hook。
- 适合自动化和脚本使用的 **CLI 友好 API**。

## 安全与审核

ClawHub 默认开放。任何人都可以上传技能，但 GitHub 账户必须
至少创建一周后才能发布。这样有助于减缓滥用，同时不会阻挡
合法贡献者。

举报与审核：

- 任何已登录用户都可以举报技能。
- 举报原因是必填项，并会被记录。
- 每个用户最多可同时拥有 20 条有效举报。
- 被 3 个以上不同用户举报的技能默认会被自动隐藏。
- 版主可以查看隐藏技能、取消隐藏、删除它们或封禁用户。
- 滥用举报功能可能导致账户被封禁。

有兴趣成为版主？请在 OpenClaw Discord 中联系版主或维护者。

## CLI 命令和参数

全局选项（适用于所有命令）：

- `--workdir <dir>`：工作目录（默认：当前目录；会回退到 OpenClaw 工作区）。
- `--dir <dir>`：技能目录，相对于 workdir（默认：`skills`）。
- `--site <url>`：站点基础 URL（浏览器登录）。
- `--registry <url>`：注册表 API 基础 URL。
- `--no-input`：禁用提示（非交互式）。
- `-V, --cli-version`：打印 CLI 版本。

认证：

- `clawhub login`（浏览器流程）或 `clawhub login --token <token>`
- `clawhub logout`
- `clawhub whoami`

选项：

- `--token <token>`：粘贴 API token。
- `--label <label>`：为浏览器登录 token 存储的标签（默认：`CLI token`）。
- `--no-browser`：不打开浏览器（需要 `--token`）。

搜索：

- `clawhub search "query"`
- `--limit <n>`：最大结果数。

安装：

- `clawhub install <slug>`
- `--version <version>`：安装特定版本。
- `--force`：如果文件夹已存在则覆盖。

更新：

- `clawhub update <slug>`
- `clawhub update --all`
- `--version <version>`：更新到特定版本（仅单个 slug）。
- `--force`：当本地文件与任何已发布版本都不匹配时覆盖。

列表：

- `clawhub list`（读取 `.clawhub/lock.json`）

发布技能：

- `clawhub skill publish <path>`
- `--slug <slug>`：技能 slug。
- `--name <name>`：显示名称。
- `--version <version>`：semver 版本。
- `--changelog <text>`：变更日志文本（可以为空）。
- `--tags <tags>`：逗号分隔的标签（默认：`latest`）。

发布插件：

- `clawhub package publish <source>`
- `<source>` 可以是本地文件夹、`owner/repo`、`owner/repo@ref` 或 GitHub URL。
- `--dry-run`：构建精确的发布计划，但不上传任何内容。
- `--json`：为 CI 输出机器可读结果。
- `--source-repo`、`--source-commit`、`--source-ref`：当自动检测不够时的可选覆盖。

删除/恢复删除（仅所有者/管理员）：

- `clawhub delete <slug> --yes`
- `clawhub undelete <slug> --yes`

同步（扫描本地技能 + 发布新增/更新项）：

- `clawhub sync`
- `--root <dir...>`：额外扫描根目录。
- `--all`：无提示上传全部内容。
- `--dry-run`：显示将要上传的内容。
- `--bump <type>`：更新时使用 `patch|minor|major`（默认：`patch`）。
- `--changelog <text>`：用于非交互更新的变更日志。
- `--tags <tags>`：逗号分隔的标签（默认：`latest`）。
- `--concurrency <n>`：注册表检查并发数（默认：4）。

## 适用于智能体的常见工作流

### 搜索技能

```bash
clawhub search "postgres backups"
```

### 下载新技能

```bash
clawhub install my-skill-pack
```

### 更新已安装技能

```bash
clawhub update --all
```

### 备份你的技能（发布或同步）

对于单个技能文件夹：

```bash
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
```

若要一次扫描并备份多个技能：

```bash
clawhub sync --all
```

### 从 GitHub 发布插件

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
clawhub package publish https://github.com/your-org/your-plugin
```

代码插件必须在 `package.json` 中包含所需的 OpenClaw 元数据：

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

## 高级细节（技术向）

### 版本管理和标签

- 每次发布都会创建一个新的 **semver** `SkillVersion`。
- 标签（如 `latest`）指向某个版本；移动标签可以让你回滚。
- 变更日志按版本附加，在同步或发布更新时可以为空。

### 本地变更与注册表版本

更新会使用内容哈希将本地技能内容与注册表版本进行比较。如果本地文件与任何已发布版本都不匹配，CLI 会在覆盖前询问（或在非交互运行中要求 `--force`）。

### 同步扫描和回退根目录

`clawhub sync` 会先扫描你当前的 workdir。如果未找到任何技能，它会回退到已知旧版位置（例如 `~/openclaw/skills` 和 `~/.openclaw/skills`）。这样设计是为了在不加额外标志的情况下也能找到旧技能安装。

### 存储和锁文件

- 已安装技能会记录在你的 workdir 下的 `.clawhub/lock.json` 中。
- 认证 token 存储在 ClawHub CLI 配置文件中（可通过 `CLAWHUB_CONFIG_PATH` 覆盖）。

### 遥测（安装计数）

当你在登录状态下运行 `clawhub sync` 时，CLI 会发送一个最小快照来计算安装次数。你可以完全禁用此功能：

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

## 环境变量

- `CLAWHUB_SITE`：覆盖站点 URL。
- `CLAWHUB_REGISTRY`：覆盖注册表 API URL。
- `CLAWHUB_CONFIG_PATH`：覆盖 CLI 存储 token/配置的位置。
- `CLAWHUB_WORKDIR`：覆盖默认 workdir。
- `CLAWHUB_DISABLE_TELEMETRY=1`：在 `sync` 时禁用遥测。
