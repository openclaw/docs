---
read_when:
    - 搜索、安装或更新 Skills 或插件
    - 将 Skills 或插件发布到注册表
    - 配置 clawhub CLI 或其环境覆盖项
sidebarTitle: ClawHub
summary: ClawHub：用于 OpenClaw Skills 和插件的公共注册表、原生安装流程，以及 clawhub CLI
title: ClawHub
x-i18n:
    generated_at: "2026-04-28T12:05:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc87e184ad9d00185880d6a1fe9f78e04ad2a8223490f9edacf09288489ffe4c
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub 是 **OpenClaw 技能和插件**的公开注册表。

- 使用原生 `openclaw` 命令搜索、安装和更新技能，并从 ClawHub 安装插件。
- 使用单独的 `clawhub` CLI 处理注册表认证、发布、删除/取消删除和同步工作流。

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
    启动新的 OpenClaw 会话 — 它会加载新技能。
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

    原生 `openclaw` 命令会安装到你的活动工作区中，并
    持久化来源元数据，以便后续 `update` 调用可以继续使用 ClawHub。

  </Tab>
  <Tab title="插件">
    ```bash
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    裸 npm 安全插件规格也会先尝试通过 ClawHub 解析，再尝试 npm：

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    如果你只想使用 npm 解析且不进行
    ClawHub 查找，请使用 `npm:<package>`：

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    插件安装会先验证声明的 `pluginApi` 和
    `minGatewayVersion` 兼容性，然后才运行归档安装，因此
    不兼容的主机会提前失败并保持关闭状态，而不是部分安装
    包。

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` 只接受可安装的插件
系列。如果某个 ClawHub 包实际是技能，OpenClaw 会停止并
指引你改用 `openclaw skills install <slug>`。

匿名 ClawHub 插件安装也会对私有包失败并保持关闭状态。
社区或其他非官方渠道仍可安装，但 OpenClaw
会发出警告，以便运营者在启用前审查来源和验证情况。
</Note>

## ClawHub 是什么

- OpenClaw 技能和插件的公开注册表。
- 技能包和元数据的版本化存储。
- 用于搜索、标签和使用信号的发现界面。

典型技能是包含以下内容的版本化文件包：

- 一个包含主要说明和用法的 `SKILL.md` 文件。
- 技能使用的可选配置、脚本或支持文件。
- 标签、摘要和安装要求等元数据。

ClawHub 使用元数据驱动发现，并安全公开技能
能力。注册表会跟踪使用信号（星标、下载量），以
改进排名和可见性。每次发布都会创建一个新的 semver
版本，并且注册表会保留版本历史，以便用户审计
变更。

## 工作区和技能加载

单独的 `clawhub` CLI 也会将技能安装到当前工作目录下的 `./skills`。
如果配置了 OpenClaw 工作区，`clawhub` 会回退到该工作区，除非你覆盖 `--workdir`
（或 `CLAWHUB_WORKDIR`）。OpenClaw 会从
`<workspace>/skills` 加载工作区技能，并在**下一个**会话中加载它们。

如果你已经使用 `~/.openclaw/skills` 或内置技能，工作区
技能优先。有关技能如何加载、
共享和受控的更多详情，请参阅 [Skills](/zh-CN/tools/skills)。

## 服务功能

| 功能            | 说明                                                      |
| ------------------ | ---------------------------------------------------------- |
| 公开浏览    | 技能及其 `SKILL.md` 内容可公开查看。 |
| 搜索             | 由嵌入驱动（向量搜索），不只是关键词。      |
| 版本管理         | Semver、变更日志和标签（包括 `latest`）。         |
| 下载          | 每个版本一个 Zip。                                           |
| 星标和评论 | 社区反馈。                                        |
| 审核         | 批准和审计。                                      |
| CLI 友好 API   | 适合自动化和脚本编写。                     |

## 安全和审核

ClawHub 默认开放 — 任何人都可以上传技能，但 GitHub
账户必须**至少创建一周**才能发布。这可以减缓
滥用，同时不阻碍合法贡献者。

<AccordionGroup>
  <Accordion title="举报">
    - 任何已登录用户都可以举报技能。
    - 举报原因是必填项并会被记录。
    - 每个用户同一时间最多可以有 20 个活跃举报。
    - 默认情况下，拥有超过 3 个唯一举报的技能会自动隐藏。

  </Accordion>
  <Accordion title="审核">
    - 审核员可以查看隐藏的技能、取消隐藏、删除技能或封禁用户。
    - 滥用举报功能可能导致账户被封禁。
    - 有兴趣成为审核员？请在 OpenClaw Discord 中询问，并联系审核员或维护者。

  </Accordion>
</AccordionGroup>

## ClawHub CLI

你只在发布/同步等需要注册表认证的工作流中需要它。

### 全局选项

<ParamField path="--workdir <dir>" type="string">
  工作目录。默认值：当前目录；回退到 OpenClaw 工作区。
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  技能目录，相对于工作目录。
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
  <Accordion title="认证（登录 / 登出 / whoami）">
    ```bash
    clawhub login              # browser flow
    clawhub login --token <token>
    clawhub logout
    clawhub whoami
    ```

    登录选项：

    - `--token <token>` — 粘贴 API 令牌。
    - `--label <label>` — 为浏览器登录令牌存储的标签（默认值：`CLI token`）。
    - `--no-browser` — 不打开浏览器（需要 `--token`）。

  </Accordion>
  <Accordion title="搜索">
    ```bash
    clawhub search "query"
    ```

    搜索技能。对于插件/包发现，请使用 `clawhub package explore`。

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
    - `--official` — 只显示官方包。
    - `--executes-code` — 只显示执行代码的包。
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

    - `--version <version>` — 安装或更新到特定版本（在 `update` 上仅支持单个 slug）。
    - `--force` — 如果文件夹已存在，或本地文件不匹配任何已发布版本，则覆盖。
    - `clawhub list` 读取 `.clawhub/lock.json`。

  </Accordion>
  <Accordion title="发布技能">
    ```bash
    clawhub skill publish <path>
    ```

    选项：

    - `--slug <slug>` — 技能 slug。
    - `--name <name>` — 显示名称。
    - `--version <version>` — semver 版本。
    - `--changelog <text>` — 变更日志文本（可以为空）。
    - `--tags <tags>` — 逗号分隔的标签（默认值：`latest`）。

  </Accordion>
  <Accordion title="发布插件">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` 可以是本地文件夹、`owner/repo`、`owner/repo@ref` 或
    GitHub URL。

    选项：

    - `--dry-run` — 构建精确的发布计划，不上传任何内容。
    - `--json` — 为 CI 发出机器可读输出。
    - `--source-repo`、`--source-commit`、`--source-ref` — 当自动检测不够时使用的可选覆盖项。

  </Accordion>
  <Accordion title="删除 / 取消删除（所有者或管理员）">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="同步（扫描本地 + 发布新增或已更新内容）">
    ```bash
    clawhub sync
    ```

    选项：

    - `--root <dir...>` — 额外扫描根目录。
    - `--all` — 无需提示即可上传所有内容。
    - `--dry-run` — 显示将要上传的内容。
    - `--bump <type>` — 更新时使用 `patch|minor|major`（默认值：`patch`）。
    - `--changelog <text>` — 非交互式更新的变更日志。
    - `--tags <tags>` — 逗号分隔的标签（默认值：`latest`）。
    - `--concurrency <n>` — 注册表检查并发数（默认值：`4`）。

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
  <Tab title="发布单个技能">
    ```bash
    clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
    ```
  </Tab>
  <Tab title="同步多个技能">
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

已发布的包应随附**已构建的 JavaScript**，并将
`runtimeExtensions` 指向该输出。Git checkout 安装在没有已构建文件时仍可
回退到 TypeScript 源码，但已构建的运行时
入口可以避免启动、Doctor 和
插件加载路径中的运行时 TypeScript 编译。

## 版本管理、锁定文件和遥测

<AccordionGroup>
  <Accordion title="版本管理和标签">
    - 每次发布都会创建新的 **semver** `SkillVersion`。
    - 标签（如 `latest`）指向一个版本；移动标签可以让你回滚。
    - 变更日志按版本附加，并且在同步或发布更新时可以为空。

  </Accordion>
  <Accordion title="本地更改与注册表版本">
    更新会使用内容哈希将本地 Skills 内容与注册表版本进行比较。如果本地文件与任何已发布版本都不匹配，CLI 会在覆盖前询问（或在非交互式运行中要求使用 `--force`）。
  </Accordion>
  <Accordion title="同步扫描和回退根目录">
    `clawhub sync` 会先扫描你当前的工作目录。如果未找到任何 Skills，它会回退到已知的旧位置（例如 `~/openclaw/skills` 和 `~/.openclaw/skills`）。这样设计是为了无需额外标志即可找到旧的 Skills 安装。
  </Accordion>
  <Accordion title="存储和锁定文件">
    - 已安装的 Skills 会记录在你工作目录下的 `.clawhub/lock.json` 中。
    - 凭证令牌存储在 ClawHub CLI 配置文件中（可通过 `CLAWHUB_CONFIG_PATH` 覆盖）。

  </Accordion>
  <Accordion title="遥测（安装计数）">
    当你在登录状态下运行 `clawhub sync` 时，CLI 会发送一个最小快照来计算安装计数。你可以完全禁用它：

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
| `CLAWHUB_DISABLE_TELEMETRY=1` | 在 `sync` 时禁用遥测。                         |

## 相关内容

- [社区插件](/zh-CN/plugins/community)
- [插件](/zh-CN/tools/plugin)
- [Skills](/zh-CN/tools/skills)
