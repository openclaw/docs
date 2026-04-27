---
read_when:
    - 搜索、安装或更新 Skills 或插件
    - 将 Skills 或插件发布到注册表
    - 配置 `clawhub` CLI 或其环境变量覆盖项
sidebarTitle: ClawHub
summary: ClawHub：用于 OpenClaw Skills 和插件的公共注册表、原生安装流程以及 `clawhub` CLI
title: ClawHub
x-i18n:
    generated_at: "2026-04-27T19:30:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: c67e20db6d267c9c256c3f72badc76b5f92e79b84c8c0dc3b6f13769de50c3e4
    source_path: tools/clawhub.md
    workflow: 15
---

ClawHub 是 **OpenClaw Skills 和插件** 的公共注册表。

- 使用原生 `openclaw` 命令来搜索、安装和更新 Skills，以及从 ClawHub 安装插件。
- 使用单独的 `clawhub` CLI 进行注册表认证、发布、删除/恢复删除以及同步工作流。

网站：[clawhub.ai](https://clawhub.ai)

## 快速开始

<Steps>
  <Step title="搜索">
    ```bash
    openclaw skills search "calendar"
    ```
  </Step>
  <Step title="安装">
    ```bash
    openclaw skills install <skill-slug>
    ```
  </Step>
  <Step title="使用">
    启动一个新的 OpenClaw 会话——它会自动加载新 Skill。
  </Step>
  <Step title="发布（可选）">
    对于需要注册表认证的工作流（发布、同步、管理），请安装
    单独的 `clawhub` CLI：

    ```bash
    npm i -g clawhub
    # or
    pnpm add -g clawhub
    ```

  </Step>
</Steps>

## 原生 OpenClaw 流程

<Tabs>
  <Tab title="Skills">
    ```bash
    openclaw skills search "calendar"
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    原生 `openclaw` 命令会安装到你当前的工作区中，并持久化保存来源元数据，以便后续的 `update` 调用可以继续从 ClawHub 获取更新。

  </Tab>
  <Tab title="插件">
    ```bash
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    纯 npm 安全的插件规格在尝试 npm 之前，也会先尝试从 ClawHub 解析：

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    当你希望仅通过 npm 解析、而不进行 ClawHub 查询时，请使用 `npm:<package>`：

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    插件安装会在归档安装运行之前验证声明的 `pluginApi` 和 `minGatewayVersion` 兼容性，因此不兼容的宿主会及早以封闭失败方式终止，而不是在软件包部分安装后才失败。

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` 只接受可安装的插件系列。如果某个 ClawHub 软件包实际上是一个 Skill，OpenClaw 会停止，并改为提示你使用 `openclaw skills install <slug>`。

匿名安装 ClawHub 插件时，私有软件包同样会以封闭失败方式终止。社区或其他非官方渠道仍然可以安装，但 OpenClaw 会发出警告，以便运维人员在启用它们之前审查来源和验证情况。
</Note>

## ClawHub 是什么

- OpenClaw Skills 和插件的公共注册表。
- 用于存储 Skill 打包内容和元数据的版本化仓库。
- 用于搜索、标签和使用信号的发现界面。

一个典型的 Skill 是一个带版本的文件打包，其中包括：

- 一个 `SKILL.md` 文件，包含主要说明和用法。
- Skill 使用的可选配置、脚本或支持文件。
- 诸如标签、摘要和安装要求之类的元数据。

ClawHub 使用元数据来支持发现能力，并安全地公开 Skill 功能。注册表会跟踪使用信号（星标、下载量）以改进排序和可见性。每次发布都会创建一个新的 semver 版本，注册表会保留版本历史，以便用户审计变更。

## 工作区和 Skill 加载

单独的 `clawhub` CLI 还会将 Skills 安装到当前工作目录下的 `./skills` 中。如果配置了 OpenClaw 工作区，除非你使用 `--workdir`（或 `CLAWHUB_WORKDIR`）覆盖，否则 `clawhub` 会回退到该工作区。OpenClaw 会从 `<workspace>/skills` 加载工作区 Skills，并在**下一次**会话中将其加载。

如果你已经在使用 `~/.openclaw/skills` 或内置 Skills，则工作区 Skills 具有更高优先级。有关 Skills 如何加载、共享和受控的更多细节，请参见 [Skills](/zh-CN/tools/skills)。

## 服务功能

| 功能 | 说明 |
| ------------------ | ---------------------------------------------------------- |
| 公开浏览 | Skills 及其 `SKILL.md` 内容可公开查看。 |
| 搜索 | 由嵌入驱动（向量搜索），而不只是关键词。 |
| 版本管理 | Semver、变更日志和标签（包括 `latest`）。 |
| 下载 | 每个版本提供 Zip 包。 |
| 星标和评论 | 社区反馈。 |
| 审核 | 审批和审计。 |
| 适用于 CLI 的 API | 适合自动化和脚本编写。 |

## 安全和审核

ClawHub 默认开放——任何人都可以上传 Skills，但发布者的 GitHub 账号必须**至少注册满一周**。这样可以减缓滥用行为，同时不阻碍合法贡献者。

<AccordionGroup>
  <Accordion title="举报">
    - 任何已登录用户都可以举报 Skill。
    - 必须填写并记录举报原因。
    - 每位用户同时最多可有 20 个有效举报。
    - 被超过 3 位不同用户举报的 Skills 默认会被自动隐藏。
  </Accordion>
  <Accordion title="审核">
    - 审核员可以查看隐藏的 Skills、取消隐藏、删除它们，或封禁用户。
    - 滥用举报功能可能导致账号被封禁。
    - 有兴趣成为审核员？请到 OpenClaw Discord 中联系审核员或维护者。
  </Accordion>
</AccordionGroup>

## ClawHub CLI

你只在需要注册表认证的工作流（例如发布/同步）时才需要它。

### 全局选项

<ParamField path="--workdir <dir>" type="string">
  工作目录。默认：当前目录；会回退到 OpenClaw 工作区。
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  Skills 目录，相对于 workdir。
</ParamField>
<ParamField path="--site <url>" type="string">
  站点基础 URL（浏览器登录）。
</ParamField>
<ParamField path="--registry <url>" type="string">
  注册表 API 基础 URL。
</ParamField>
<ParamField path="--no-input" type="boolean">
  禁用提示（非交互模式）。
</ParamField>
<ParamField path="-V, --cli-version" type="boolean">
  打印 CLI 版本。
</ParamField>

### 命令

<AccordionGroup>
  <Accordion title="认证（登录 / 登出 / whoami）">
    ```bash
    clawhub login              # browser flow
    clawhub login --token <token>
    clawhub logout
    clawhub whoami
    ```

    登录选项：

    - `--token <token>` — 粘贴一个 API 令牌。
    - `--label <label>` — 为浏览器登录令牌保存的标签（默认：`CLI token`）。
    - `--no-browser` — 不打开浏览器（需要 `--token`）。

  </Accordion>
  <Accordion title="搜索">
    ```bash
    clawhub search "query"
    ```

    搜索 Skills。若要发现插件/软件包，请使用 `clawhub package explore`。

    - `--limit <n>` — 最大结果数。

  </Accordion>
  <Accordion title="浏览 / 检查插件">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "episodic-claw" --family code-plugin
    clawhub package inspect episodic-claw
    ```

    `package explore` 和 `package inspect` 是 ClawHub CLI 中用于插件/软件包发现和元数据检查的界面。原生 OpenClaw 安装仍使用 `openclaw plugins install clawhub:<package>`。

    选项：

    - `--family skill|code-plugin|bundle-plugin` — 按软件包系列筛选。
    - `--official` — 仅显示官方软件包。
    - `--executes-code` — 仅显示会执行代码的软件包。
    - `--version <version>` / `--tag <tag>` — 检查特定软件包版本。
    - `--versions`, `--files`, `--file <path>` — 检查软件包历史和文件。
    - `--json` — 机器可读输出。

  </Accordion>
  <Accordion title="安装 / 更新 / 列出">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    选项：

    - `--version <version>` — 安装或更新到特定版本（`update` 时仅支持单个 slug）。
    - `--force` — 如果文件夹已存在，或本地文件与任何已发布版本都不匹配，则覆盖。
    - `clawhub list` 会读取 `.clawhub/lock.json`。

  </Accordion>
  <Accordion title="发布 Skills">
    ```bash
    clawhub skill publish <path>
    ```

    选项：

    - `--slug <slug>` — Skill slug。
    - `--name <name>` — 显示名称。
    - `--version <version>` — semver 版本。
    - `--changelog <text>` — 变更日志文本（可以为空）。
    - `--tags <tags>` — 逗号分隔的标签（默认：`latest`）。

  </Accordion>
  <Accordion title="发布插件">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` 可以是本地文件夹、`owner/repo`、`owner/repo@ref`，或一个 GitHub URL。

    选项：

    - `--dry-run` — 构建精确的发布计划，但不上传任何内容。
    - `--json` — 为 CI 输出机器可读结果。
    - `--source-repo`, `--source-commit`, `--source-ref` — 当自动检测不够用时的可选覆盖项。

  </Accordion>
  <Accordion title="删除 / 恢复删除（所有者或管理员）">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="同步（扫描本地内容并发布新增或已更新内容）">
    ```bash
    clawhub sync
    ```

    选项：

    - `--root <dir...>` — 额外的扫描根目录。
    - `--all` — 不提示，上传所有内容。
    - `--dry-run` — 显示将要上传的内容。
    - `--bump <type>` — 更新时使用 `patch|minor|major`（默认：`patch`）。
    - `--changelog <text>` — 用于非交互式更新的变更日志。
    - `--tags <tags>` — 逗号分隔的标签（默认：`latest`）。
    - `--concurrency <n>` — 注册表检查并发数（默认：`4`）。

  </Accordion>
</AccordionGroup>

## 常见工作流

<Tabs>
  <Tab title="搜索">
    ```bash
    clawhub search "postgres backups"
    ```
  </Tab>
  <Tab title="查找插件">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "memory" --family code-plugin
    clawhub package inspect episodic-claw
    ```
  </Tab>
  <Tab title="安装">
    ```bash
    clawhub install my-skill-pack
    ```
  </Tab>
  <Tab title="全部更新">
    ```bash
    clawhub update --all
    ```
  </Tab>
  <Tab title="发布单个 Skill">
    ```bash
    clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
    ```
  </Tab>
  <Tab title="同步多个 Skills">
    ```bash
    clawhub sync --all
    ```
  </Tab>
  <Tab title="从 GitHub 发布插件">
    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    clawhub package publish your-org/your-plugin@v1.0.0
    clawhub package publish https://github.com/your-org/your-plugin
    ```
  </Tab>
</Tabs>

### 插件软件包元数据

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

已发布的软件包应当附带**已构建的 JavaScript**，并将 `runtimeExtensions` 指向该输出。Git 检出安装在不存在已构建文件时仍可回退到 TypeScript 源码，但使用已构建的运行时入口可避免在启动、Doctor 和插件加载路径中进行运行时 TypeScript 编译。

## 版本管理、锁文件和遥测

<AccordionGroup>
  <Accordion title="版本管理和标签">
    - 每次发布都会创建一个新的 **semver** `SkillVersion`。
    - 标签（如 `latest`）指向某个版本；移动标签可让你回滚。
    - 变更日志按版本附加，在同步或发布更新时可以为空。
  </Accordion>
  <Accordion title="本地更改与注册表版本">
    更新会使用内容哈希将本地 Skill 内容与注册表版本进行比较。如果本地文件与任何已发布版本都不匹配，CLI 会在覆盖前询问（或在非交互式运行中要求使用 `--force`）。
  </Accordion>
  <Accordion title="同步扫描和回退根目录">
    `clawhub sync` 会先扫描你当前的 workdir。如果未找到任何 Skills，则会回退到已知的旧版位置（例如 `~/openclaw/skills` 和 `~/.openclaw/skills`）。这样设计是为了在无需额外标志的情况下找到旧的 Skill 安装。
  </Accordion>
  <Accordion title="存储和锁文件">
    - 已安装的 Skills 会记录在 workdir 下的 `.clawhub/lock.json` 中。
    - 认证令牌会存储在 ClawHub CLI 配置文件中（可通过 `CLAWHUB_CONFIG_PATH` 覆盖）。
  </Accordion>
  <Accordion title="遥测（安装计数）">
    当你在已登录状态下运行 `clawhub sync` 时，CLI 会发送一个最小快照以计算安装计数。你可以完全禁用此功能：

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## 环境变量

| Variable                      | Effect                                          |
| ----------------------------- | ----------------------------------------------- |
| `CLAWHUB_SITE`                | 覆盖站点 URL。 |
| `CLAWHUB_REGISTRY`            | 覆盖注册表 API URL。 |
| `CLAWHUB_CONFIG_PATH`         | 覆盖 CLI 存储令牌/配置的位置。 |
| `CLAWHUB_WORKDIR`             | 覆盖默认 workdir。 |
| `CLAWHUB_DISABLE_TELEMETRY=1` | 禁用 `sync` 的遥测。 |

## 相关内容

- [社区插件](/zh-CN/plugins/community)
- [Plugins](/zh-CN/tools/plugin)
- [Skills](/zh-CN/tools/skills)
