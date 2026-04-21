---
read_when:
    - 向新用户介绍 ClawHub
    - 安装、搜索或发布 Skills 或插件
    - 解释 ClawHub CLI 标志和同步行为
summary: ClawHub 指南：公共注册表、原生 OpenClaw 安装流程，以及 ClawHub CLI 工作流
title: ClawHub
x-i18n:
    generated_at: "2026-04-21T22:19:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88980eb2f48c5298aec5b697e8e50762c3df5a4114f567e69424a1cb36e5102e
    source_path: tools/clawhub.md
    workflow: 15
---

# ClawHub

ClawHub 是 **OpenClaw Skills 和插件** 的公共注册表。

- 使用原生 `openclaw` 命令来搜索/安装/更新 Skills，并从 ClawHub 安装插件。
- 当你需要注册表认证、发布、删除、恢复删除或同步工作流时，使用独立的 `clawhub` CLI。

网站：[clawhub.ai](https://clawhub.ai)

## 原生 OpenClaw 流程

Skills：

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

不带前缀、且可安全用于 npm 的插件规格也会在 npm 之前先尝试从 ClawHub 解析：

```bash
openclaw plugins install openclaw-codex-app-server
```

原生 `openclaw` 命令会安装到你当前活跃的工作区中，并保存来源元数据，以便后续 `update` 调用可以继续留在 ClawHub 上。

插件安装会在归档安装开始前校验声明的 `pluginApi` 和 `minGatewayVersion` 兼容性，因此对于不兼容的宿主环境，会尽早以封闭失败的方式中止，而不是只完成部分安装。

`openclaw plugins install clawhub:...` 只接受可安装的插件系列。如果某个 ClawHub 包实际上是一个 Skill，OpenClaw 会停止并提示你改用 `openclaw skills install <slug>`。

## ClawHub 是什么

- OpenClaw Skills 和插件的公共注册表。
- Skills 包和元数据的版本化存储。
- 用于搜索、标签和使用信号的发现界面。

## 它如何工作

1. 用户发布一个 Skill 包（文件 + 元数据）。
2. ClawHub 存储该包、解析元数据并分配一个版本。
3. 注册表为该 Skill 建立索引，以支持搜索和发现。
4. 用户在 OpenClaw 中浏览、下载并安装 Skills。

## 你可以做什么

- 发布新的 Skills，以及已有 Skills 的新版本。
- 按名称、标签或搜索发现 Skills。
- 下载 Skill 包并检查其文件。
- 举报滥用或不安全的 Skills。
- 如果你是版主，你可以隐藏、取消隐藏、删除或封禁。

## 这适合谁（对初学者友好）

如果你想为你的 OpenClaw 智能体添加新能力，ClawHub 是查找和安装 Skills 的最简单方式。你不需要了解后端如何工作。你可以：

- 用自然语言搜索 Skills。
- 将 Skill 安装到你的工作区中。
- 之后用一条命令更新 Skills。
- 通过发布自己的 Skills 来备份它们。

## 快速开始（非技术向）

1. 搜索你需要的内容：
   - `openclaw skills search "calendar"`
2. 安装一个 Skill：
   - `openclaw skills install <skill-slug>`
3. 启动一个新的 OpenClaw 会话，以便它载入新的 Skill。
4. 如果你想发布内容或管理注册表认证，也请安装独立的 `clawhub` CLI。

## 安装 ClawHub CLI

你只在需要注册表认证工作流（例如发布/同步）时才需要它：

```bash
npm i -g clawhub
```

```bash
pnpm add -g clawhub
```

## 它如何融入 OpenClaw

原生 `openclaw skills install` 会安装到当前活跃工作区的 `skills/` 目录中。`openclaw plugins install clawhub:...` 会记录一次普通的受管插件安装，并额外保存用于更新的 ClawHub 来源元数据。

匿名的 ClawHub 插件安装对于私有包也会以封闭失败的方式中止。社区渠道或其他非官方渠道仍然可以安装，但 OpenClaw 会发出警告，以便运维人员在启用前审查来源和校验情况。

独立的 `clawhub` CLI 也会将 Skills 安装到你当前工作目录下的 `./skills` 中。如果已配置 OpenClaw 工作区，`clawhub` 会回退到该工作区，除非你用 `--workdir`（或 `CLAWHUB_WORKDIR`）覆盖它。OpenClaw 会从 `<workspace>/skills` 加载工作区 Skills，并会在**下一个**会话中识别它们。如果你已经在使用 `~/.openclaw/skills` 或内置 Skills，工作区 Skills 会具有更高优先级。

有关 Skills 如何加载、共享和受控的更多细节，请参见 [Skills](/zh-CN/tools/skills)。

## Skill 系统概览

Skill 是一个带版本的文件包，用于教会 OpenClaw 如何执行特定任务。每次发布都会创建一个新版本，注册表会保留版本历史，以便用户审计变更。

一个典型的 Skill 包括：

- 一个 `SKILL.md` 文件，包含主要说明和用法。
- Skill 使用的可选配置、脚本或支持文件。
- 标签、摘要和安装要求等元数据。

ClawHub 使用元数据来支持发现，并安全地公开 Skill 能力。注册表还会跟踪使用信号（例如收藏和下载）以改进排序和可见性。

## 服务提供的内容（功能）

- Skills 及其 `SKILL.md` 内容的**公开浏览**。
- 由嵌入（向量搜索）驱动的**搜索**，而不只是关键词。
- 使用 semver、更新日志和标签（包括 `latest`）的**版本管理**。
- 每个版本提供 zip 格式的**下载**。
- 用于社区反馈的**收藏和评论**。
- 用于审批和审计的**审核**钩子。
- 面向自动化和脚本的 **CLI 友好 API**。

## 安全与审核

ClawHub 默认是开放的。任何人都可以上传 Skills，但 GitHub 账号必须至少注册满一周才能发布。这样可以在不阻碍合法贡献者的前提下减缓滥用行为。

举报与审核：

- 任何已登录用户都可以举报一个 Skill。
- 举报原因是必填的，并会被记录。
- 每个用户同时最多可以有 20 条活跃举报。
- 被超过 3 名不同用户举报的 Skills 默认会被自动隐藏。
- 版主可以查看已隐藏的 Skills、取消隐藏、删除它们，或封禁用户。
- 滥用举报功能可能导致账号被封禁。

有兴趣成为版主吗？请在 OpenClaw Discord 中提出，并联系版主或维护者。

## CLI 命令和参数

全局选项（适用于所有命令）：

- `--workdir <dir>`：工作目录（默认：当前目录；会回退到 OpenClaw 工作区）。
- `--dir <dir>`：Skills 目录，相对于 workdir（默认：`skills`）。
- `--site <url>`：站点基础 URL（浏览器登录）。
- `--registry <url>`：注册表 API 基础 URL。
- `--no-input`：禁用提示（非交互模式）。
- `-V, --cli-version`：打印 CLI 版本。

认证：

- `clawhub login`（浏览器流程）或 `clawhub login --token <token>`
- `clawhub logout`
- `clawhub whoami`

选项：

- `--token <token>`：粘贴一个 API 令牌。
- `--label <label>`：为浏览器登录令牌保存的标签（默认：`CLI token`）。
- `--no-browser`：不打开浏览器（需要 `--token`）。

搜索：

- `clawhub search "query"`
- `--limit <n>`：最大结果数。

安装：

- `clawhub install <slug>`
- `--version <version>`：安装指定版本。
- `--force`：如果文件夹已存在则覆盖。

更新：

- `clawhub update <slug>`
- `clawhub update --all`
- `--version <version>`：更新到指定版本（仅适用于单个 slug）。
- `--force`：当本地文件与任何已发布版本都不匹配时进行覆盖。

列表：

- `clawhub list`（读取 `.clawhub/lock.json`）

发布 Skills：

- `clawhub skill publish <path>`
- `--slug <slug>`：Skill slug。
- `--name <name>`：显示名称。
- `--version <version>`：semver 版本。
- `--changelog <text>`：更新日志文本（可以为空）。
- `--tags <tags>`：以逗号分隔的标签（默认：`latest`）。

发布插件：

- `clawhub package publish <source>`
- `<source>` 可以是本地文件夹、`owner/repo`、`owner/repo@ref` 或 GitHub URL。
- `--dry-run`：构建精确的发布计划，但不上传任何内容。
- `--json`：输出适用于 CI 的机器可读格式。
- `--source-repo`、`--source-commit`、`--source-ref`：当自动检测不足时可选的覆盖项。

删除/恢复删除（仅所有者/管理员）：

- `clawhub delete <slug> --yes`
- `clawhub undelete <slug> --yes`

同步（扫描本地 Skills + 发布新增/更新内容）：

- `clawhub sync`
- `--root <dir...>`：额外的扫描根目录。
- `--all`：不经提示上传所有内容。
- `--dry-run`：显示将会上传的内容。
- `--bump <type>`：更新时使用 `patch|minor|major`（默认：`patch`）。
- `--changelog <text>`：非交互更新时使用的更新日志。
- `--tags <tags>`：以逗号分隔的标签（默认：`latest`）。
- `--concurrency <n>`：注册表检查并发数（默认：4）。

## 面向智能体的常见工作流

### 搜索 Skills

```bash
clawhub search "postgres backups"
```

### 下载新 Skills

```bash
clawhub install my-skill-pack
```

### 更新已安装的 Skills

```bash
clawhub update --all
```

### 备份你的 Skills（发布或同步）

对于单个 Skill 文件夹：

```bash
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
```

要一次性扫描并备份多个 Skill：

```bash
clawhub sync --all
```

### 从 GitHub 发布一个插件

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
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
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

已发布的包应当附带构建后的 JavaScript，并让 `runtimeExtensions` 指向该输出。Git 检出安装在没有构建产物时仍然可以回退到 TypeScript 源码，但使用构建后的运行时入口可以避免在启动、Doctor 和插件加载路径中进行运行时 TypeScript 编译。

## 高级细节（技术向）

### 版本管理和标签

- 每次发布都会创建一个新的 **semver** `SkillVersion`。
- 标签（如 `latest`）指向某个版本；移动标签可以让你回滚。
- 更新日志按版本附加，在同步或发布更新时可以为空。

### 本地变更与注册表版本

更新会使用内容哈希将本地 Skill 内容与注册表版本进行比较。如果本地文件与任何已发布版本都不匹配，CLI 会在覆盖前询问（或者在非交互运行中要求使用 `--force`）。

### 同步扫描与回退根目录

`clawhub sync` 会先扫描你当前的 workdir。如果未找到任何 Skills，它会回退到已知的旧位置（例如 `~/openclaw/skills` 和 `~/.openclaw/skills`）。这样设计是为了在不额外加参数的情况下找到旧的 Skill 安装。

### 存储与锁文件

- 已安装的 Skills 会记录在 workdir 下的 `.clawhub/lock.json` 中。
- 认证令牌存储在 ClawHub CLI 配置文件中（可通过 `CLAWHUB_CONFIG_PATH` 覆盖）。

### 遥测（安装计数）

当你在登录状态下运行 `clawhub sync` 时，CLI 会发送一个最小快照来计算安装数。你可以完全禁用此功能：

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

## 环境变量

- `CLAWHUB_SITE`：覆盖站点 URL。
- `CLAWHUB_REGISTRY`：覆盖注册表 API URL。
- `CLAWHUB_CONFIG_PATH`：覆盖 CLI 存储令牌/配置的位置。
- `CLAWHUB_WORKDIR`：覆盖默认 workdir。
- `CLAWHUB_DISABLE_TELEMETRY=1`：在 `sync` 时禁用遥测。
