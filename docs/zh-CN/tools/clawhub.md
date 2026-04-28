---
read_when:
    - 搜索、安装或更新 Skills 或插件
    - 将 Skills 或插件发布到注册表
    - 配置 clawhub CLI 或其环境覆盖项
sidebarTitle: ClawHub
summary: ClawHub：OpenClaw Skills 和插件的公共注册表、原生安装流程，以及 clawhub CLI
title: ClawHub
x-i18n:
    generated_at: "2026-04-28T23:40:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ec09a3c76820137eb1f7ca829a184fc1ed6392d3b32a327ecbda4d2cad7a78d
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub 是用于 **OpenClaw Skills 和插件** 的公共注册表。

- 使用原生 `openclaw` 命令搜索、安装和更新 Skills，并从 ClawHub 安装插件。
- 使用单独的 `clawhub` CLI 执行注册表凭证、发布、删除/取消删除和同步工作流。

站点：[clawhub.ai](https://clawhub.ai)

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
    启动新的 OpenClaw 会话，它会加载新的 Skill。
  </Step>
  <Step title="发布（可选）">
    对于需要注册表凭证的工作流（发布、同步、管理），请安装
    单独的 `clawhub` CLI：

    ```bash
    npm i -g clawhub
    # or
    pnpm add -g clawhub
    ```

  </Step>
</Steps>

## 原生 OpenClaw 工作流

<Tabs>
  <Tab title="Skills">
    ```bash
    openclaw skills search "calendar"
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    原生 `openclaw` 命令会安装到你的活动工作区，并
    持久保存来源元数据，因此后续 `update` 调用可以继续使用 ClawHub。

  </Tab>
  <Tab title="插件">
    ```bash
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    裸 npm 安全插件规格也会先尝试在 ClawHub 中解析，然后再尝试 npm：

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    如果你只想通过 npm 解析而不查询
    ClawHub，请使用 `npm:<package>`：

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    插件安装会在归档安装运行前验证声明的 `pluginApi` 和
    `minGatewayVersion` 兼容性，因此不兼容的主机会提前关闭失败，而不是
    部分安装该包。

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` 只接受可安装的插件
系列。如果 ClawHub 包实际上是 Skill，OpenClaw 会停止，并
改为引导你使用 `openclaw skills install <slug>`。

匿名 ClawHub 插件安装也会对私有包关闭失败。
社区或其他非官方渠道仍可安装，但 OpenClaw
会发出警告，以便操作员在启用前检查来源和验证。
</Note>

## ClawHub 是什么

- OpenClaw Skills 和插件的公共注册表。
- Skill 包和元数据的版本化存储。
- 用于搜索、标签和使用信号的发现界面。

典型 Skill 是一个版本化文件包，其中包括：

- 包含主要描述和用法的 `SKILL.md` 文件。
- Skill 使用的可选配置、脚本或支持文件。
- 标签、摘要和安装要求等元数据。

ClawHub 使用元数据来支持发现，并安全地暴露 Skill
能力。注册表会跟踪使用信号（星标、下载量）以
改进排序和可见性。每次发布都会创建新的 semver
版本，注册表会保留版本历史，便于用户审计
变更。

## 工作区和 Skill 加载

单独的 `clawhub` CLI 也会将 Skills 安装到
当前工作目录下的 `./skills`。如果已配置 OpenClaw 工作区，
`clawhub` 会回退到该工作区，除非你覆盖 `--workdir`
（或 `CLAWHUB_WORKDIR`）。OpenClaw 会从
`<workspace>/skills` 加载工作区 Skills，并在**下一次**会话中加载它们。

如果你已经使用 `~/.openclaw/skills` 或内置 Skills，工作区
Skills 优先级更高。有关 Skills 如何加载、
共享和受控的更多详情，请参阅 [Skills](/zh-CN/tools/skills)。

## 服务功能

| 功能                  | 说明                                                               |
| ------------------------ | ------------------------------------------------------------------- |
| 公开浏览          | Skills 及其 `SKILL.md` 内容可公开查看。          |
| 搜索                   | 由嵌入驱动（向量搜索），不只是关键字。               |
| 版本控制               | Semver、更新日志和标签（包括 `latest`）。                  |
| 下载                | 每个版本一个 Zip。                                                    |
| 星标和评论       | 社区反馈。                                                 |
| 安全扫描摘要  | 详情页会在安装或下载前显示最新扫描状态。 |
| 扫描器详情页     | VirusTotal、ClawScan 和静态分析结果都有深层链接。  |
| 所有者恢复仪表板 | 发布者可以从 `/dashboard` 查看因扫描而保留的自有内容。       |
| 所有者请求重新扫描  | 所有者可以为误报恢复请求有限次数的重新扫描。     |
| 内容审核               | 审批和审计。                                               |
| CLI 友好的 API         | 适合自动化和脚本。                              |

## 安全和内容审核

ClawHub 默认开放，任何人都可以上传 Skills，但 GitHub
账号必须**至少创建一周**才能发布。这可以减缓
滥用，而不会阻挡合法贡献者。

<AccordionGroup>
  <Accordion title="安全扫描">
    ClawHub 会对已发布的 Skills 和插件
    版本运行自动安全检查。公开详情页会汇总当前结果，扫描器
    行会链接到 VirusTotal、ClawScan 和静态
    分析的专用详情页。

    因扫描而保留或阻止的版本可能无法出现在公开目录和
    安装界面中，但其所有者仍可在 `/dashboard` 中看到。

  </Accordion>
  <Accordion title="报告">
    - 任何已登录用户都可以报告 Skill。
    - 必须提供并记录报告原因。
    - 每个用户同一时间最多可以有 20 个活动报告。
    - 默认情况下，拥有超过 3 个唯一报告的 Skills 会自动隐藏。

  </Accordion>
  <Accordion title="内容审核">
    - 审核员可以查看隐藏的 Skills、取消隐藏、删除它们或封禁用户。
    - 滥用报告功能可能导致账号被封禁。
    - 有兴趣成为审核员？请在 OpenClaw Discord 中询问，并联系审核员或维护者。

  </Accordion>
</AccordionGroup>

## ClawHub CLI

只有在发布/同步等需要注册表凭证的工作流中才需要它。

### 全局选项

<ParamField path="--workdir <dir>" type="string">
  工作目录。默认：当前目录；回退到 OpenClaw 工作区。
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
  禁用提示（非交互式）。
</ParamField>
<ParamField path="-V, --cli-version" type="boolean">
  打印 CLI 版本。
</ParamField>

### 命令

<AccordionGroup>
  <Accordion title="凭证（login / logout / whoami）">
    ```bash
    clawhub login              # browser flow
    clawhub login --token <token>
    clawhub logout
    clawhub whoami
    ```

    登录选项：

    - `--token <token>` — 粘贴 API 令牌。
    - `--label <label>` — 为浏览器登录令牌存储的标签（默认：`CLI token`）。
    - `--no-browser` — 不打开浏览器（需要 `--token`）。

  </Accordion>
  <Accordion title="搜索">
    ```bash
    clawhub search "query"
    ```

    搜索 Skills。对于插件/包发现，请使用 `clawhub package explore`。

    - `--limit <n>` — 最大结果数。

  </Accordion>
  <Accordion title="浏览 / 检查插件">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "episodic-claw" --family code-plugin
    clawhub package inspect episodic-claw
    ```

    `package explore` 和 `package inspect` 是用于插件/包发现和元数据检查的 ClawHub CLI 界面。原生 OpenClaw 安装仍使用 `openclaw plugins install clawhub:<package>`。

    选项：

    - `--family skill|code-plugin|bundle-plugin` — 筛选包系列。
    - `--official` — 仅显示官方包。
    - `--executes-code` — 仅显示执行代码的包。
    - `--version <version>` / `--tag <tag>` — 检查特定包版本。
    - `--versions`, `--files`, `--file <path>` — 检查包历史和文件。
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

    - `--version <version>` — 安装或更新到特定版本（`update` 中仅限单个 slug）。
    - `--force` — 如果文件夹已存在，或本地文件与任何已发布版本都不匹配，则覆盖。
    - `clawhub list` 读取 `.clawhub/lock.json`。

  </Accordion>
  <Accordion title="发布 Skills">
    ```bash
    clawhub skill publish <path>
    ```

    选项：

    - `--slug <slug>` — Skill slug。
    - `--name <name>` — 显示名称。
    - `--version <version>` — semver 版本。
    - `--changelog <text>` — 更新日志文本（可为空）。
    - `--tags <tags>` — 逗号分隔的标签（默认：`latest`）。

  </Accordion>
  <Accordion title="发布插件">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` 可以是本地文件夹、`owner/repo`、`owner/repo@ref` 或
    GitHub URL。

    选项：

    - `--dry-run` — 构建精确的发布计划，但不上传任何内容。
    - `--json` — 为 CI 发出机器可读输出。
    - `--source-repo`、`--source-commit`、`--source-ref` — 当自动检测不足时使用的可选覆盖项。

  </Accordion>
  <Accordion title="请求重新扫描">
    ```bash
    clawhub skill rescan <slug>
    clawhub skill rescan <slug> --yes --json

    clawhub package rescan <name>
    clawhub package rescan <name> --yes --json
    ```

    重新扫描命令需要已登录的所有者令牌，并以最新
    已发布的 Skill 版本或插件版本为目标。在非交互式运行中，请传入
    `--yes`。

    JSON 响应包括目标类型、名称、版本、重新扫描状态，以及
    该版本或发布剩余/最大请求次数。

  </Accordion>
  <Accordion title="删除 / 取消删除（所有者或管理员）">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="同步（扫描本地 + 发布新的或已更新的内容）">
    ```bash
    clawhub sync
    ```

    选项：

    - `--root <dir...>` — 额外扫描根目录。
    - `--all` — 无提示上传所有内容。
    - `--dry-run` — 显示将要上传的内容。
    - `--bump <type>` — 更新使用 `patch|minor|major`（默认：`patch`）。
    - `--changelog <text>` — 非交互式更新的更新日志。
    - `--tags <tags>` — 逗号分隔的标签（默认：`latest`）。
    - `--concurrency <n>` — 注册表检查（默认：`4`）。

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

### 插件包元数据

代码插件必须在 `package.json` 中包含必需的 OpenClaw 元数据：

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

已发布的包应包含**构建后的 JavaScript**，并让 `runtimeExtensions` 指向该输出。Git checkout 安装在没有构建文件时仍可回退到 TypeScript 源码，但构建后的运行时入口可以避免在启动、Doctor 和插件加载路径中进行运行时 TypeScript 编译。

## 版本控制、锁文件和遥测

<AccordionGroup>
  <Accordion title="版本控制和标签">
    - 每次发布都会创建一个新的 **semver** `SkillVersion`。
    - 标签（如 `latest`）指向某个版本；移动标签可让你回滚。
    - 变更日志按版本附加，同步或发布更新时可以为空。

  </Accordion>
  <Accordion title="本地更改与注册表版本">
    更新会使用内容哈希将本地 Skill 内容与注册表版本进行比较。如果本地文件不匹配任何已发布版本，CLI 会在覆盖前询问（或在非交互式运行中要求使用 `--force`）。
  </Accordion>
  <Accordion title="同步扫描和回退根目录">
    `clawhub sync` 会先扫描你当前的工作目录。如果没有找到 Skills，它会回退到已知的旧版位置（例如 `~/openclaw/skills` 和 `~/.openclaw/skills`）。这用于在无需额外标志的情况下找到较旧的 Skill 安装。
  </Accordion>
  <Accordion title="存储和锁文件">
    - 已安装的 Skills 会记录在你工作目录下的 `.clawhub/lock.json` 中。
    - 凭证令牌存储在 ClawHub CLI 配置文件中（可通过 `CLAWHUB_CONFIG_PATH` 覆盖）。

  </Accordion>
  <Accordion title="遥测（安装计数）">
    当你在已登录状态下运行 `clawhub sync` 时，CLI 会发送一个最小快照来计算安装计数。你可以完全禁用它：

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## 环境变量

| 变量                          | 作用                                            |
| ----------------------------- | ----------------------------------------------- |
| `CLAWHUB_SITE`                | 覆盖站点 URL。                                 |
| `CLAWHUB_REGISTRY`            | 覆盖注册表 API URL。                           |
| `CLAWHUB_CONFIG_PATH`         | 覆盖 CLI 存储令牌/配置的位置。                 |
| `CLAWHUB_WORKDIR`             | 覆盖默认工作目录。                             |
| `CLAWHUB_DISABLE_TELEMETRY=1` | 在 `sync` 上禁用遥测。                         |

## 相关

- [社区插件](/zh-CN/plugins/community)
- [插件](/zh-CN/tools/plugin)
- [Skills](/zh-CN/tools/skills)
