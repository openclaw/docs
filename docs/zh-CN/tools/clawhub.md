---
read_when:
    - 搜索、安装或更新 Skills 或插件
    - 将 Skills 或插件发布到注册表
    - 配置 clawhub CLI 或其环境覆盖项
sidebarTitle: ClawHub
summary: ClawHub：OpenClaw Skills 和插件的公共注册表、原生安装流程，以及 clawhub CLI
title: ClawHub
x-i18n:
    generated_at: "2026-05-02T18:33:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d1d08edc482837e206f2c0a1b3f4db2658a6a052974aa3c59365455d1f5bddc
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub 是 **OpenClaw Skills 和插件** 的公共注册表。

- 使用原生 `openclaw` 命令搜索、安装和更新 Skills，并从 ClawHub 安装插件。
- 使用独立的 `clawhub` CLI 处理注册表认证、发布、删除/恢复删除和同步工作流。

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
    启动新的 OpenClaw 会话，它会加载新的 skill。
  </Step>
  <Step title="发布（可选）">
    对于需要注册表认证的工作流（发布、同步、管理），请安装
    独立的 `clawhub` CLI：

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

    原生 `openclaw` 命令会安装到你的活动工作区，并
    持久保存来源元数据，以便后续 `update` 调用可以继续使用 ClawHub。

  </Tab>
  <Tab title="插件">
    ```bash
    openclaw plugins search "calendar"
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    `plugins search` 会查询 ClawHub 插件目录，并打印可直接安装的
    软件包名称。裸 npm 安全插件规范只有在软件包
    就绪状态表明该软件包可供 OpenClaw 安装时才使用 ClawHub；否则 OpenClaw
    会保留 npm 回退：

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    如果你希望仅使用 npm 解析而不进行
    ClawHub 查询，请使用 `npm:<package>`：

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    插件安装会在归档安装运行之前验证声明的 `pluginApi` 和
    `minGatewayVersion` 兼容性，因此
    不兼容的主机会提前失败关闭，而不是部分安装
    软件包。当某个软件包版本发布 ClawPack 工件时，
    OpenClaw 会优先使用精确上传的 npm-pack `.tgz`，验证 ClawHub
    摘要标头和下载的字节，并记录工件类型、npm
    integrity、npm shasum、tarball 名称和 ClawPack 摘要元数据，以供后续
    更新使用。没有 ClawPack 元数据的旧软件包版本仍使用
    旧版软件包归档验证路径。

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` 只接受可安装的插件
系列。如果某个 ClawHub 软件包实际上是 skill，OpenClaw 会停止并
指向 `openclaw skills install <slug>`。

匿名 ClawHub 插件安装也会对私有软件包失败关闭。
社区或其他非官方渠道仍可安装，但 OpenClaw
会发出警告，以便操作员在启用之前审查来源和验证情况。
</Note>

## ClawHub 是什么

- OpenClaw Skills 和插件的公共注册表。
- skill 包和元数据的版本化存储。
- 面向搜索、标签和使用信号的发现入口。

典型的 skill 是一个包含以下内容的版本化文件包：

- 一个包含主要描述和用法的 `SKILL.md` 文件。
- skill 使用的可选配置、脚本或支持文件。
- 标签、摘要和安装要求等元数据。

ClawHub 使用元数据来驱动发现，并安全地公开 skill
能力。注册表会跟踪使用信号（星标、下载量）以
改进排序和可见性。每次发布都会创建新的 semver
版本，并且注册表会保留版本历史，以便用户审计
变更。

## 工作区和 skill 加载

独立的 `clawhub` CLI 也会把 Skills 安装到
当前工作目录下的 `./skills`。如果配置了 OpenClaw 工作区，
`clawhub` 会回退到该工作区，除非你覆盖 `--workdir`
（或 `CLAWHUB_WORKDIR`）。OpenClaw 从
`<workspace>/skills` 加载工作区 Skills，并在**下一个**会话中加载它们。

如果你已经使用 `~/.openclaw/skills` 或内置 Skills，工作区
Skills 会优先。关于 Skills 如何加载、
共享和受门控控制的更多细节，请参见 [Skills](/zh-CN/tools/skills)。

## 服务功能

| 功能                     | 说明                                                                |
| ------------------------ | ------------------------------------------------------------------- |
| 公开浏览                 | Skills 及其 `SKILL.md` 内容可公开查看。                             |
| 搜索                     | 由嵌入驱动（向量搜索），不只是关键词。                              |
| 版本管理                 | Semver、changelog 和标签（包括 `latest`）。                         |
| 下载                     | 每个版本一个 zip。                                                  |
| 星标和评论               | 社区反馈。                                                          |
| 安全扫描摘要             | 详情页会在安装或下载前显示最新扫描状态。                            |
| 扫描器详情页             | VirusTotal、ClawScan 和静态分析结果有深度链接。                     |
| 所有者恢复仪表板         | 发布者可以从 `/dashboard` 查看被扫描保留的自有内容。                |
| 所有者请求重新扫描       | 所有者可以请求有限次数的重新扫描，用于误报恢复。                    |
| 审核                     | 批准和审计。                                                        |
| CLI 友好的 API           | 适合自动化和脚本编写。                                              |

## 安全和审核

ClawHub 默认开放，任何人都可以上传 Skills，但 GitHub
账号必须**至少存在一周**才能发布。这能减缓
滥用，同时不阻止合法贡献者。

<AccordionGroup>
  <Accordion title="安全扫描">
    ClawHub 会对已发布的 Skills 和插件
    发布版本运行自动化安全检查。公开详情页会汇总当前结果，扫描器
    行会链接到 VirusTotal、ClawScan 和静态
    分析的专用详情页。

    被扫描保留或阻止的发布版本可能不会出现在公共目录和
    安装入口中，但其所有者仍可在 `/dashboard` 中看到。

  </Accordion>
  <Accordion title="举报">
    - 任何已登录用户都可以举报 skill。
    - 必须提供举报原因，并会被记录。
    - 每个用户同一时间最多可以有 20 个活动举报。
    - 默认情况下，收到超过 3 个唯一举报的 Skills 会被自动隐藏。

  </Accordion>
  <Accordion title="审核">
    - 审核员可以查看隐藏的 Skills、取消隐藏、删除它们，或封禁用户。
    - 滥用举报功能可能导致账号被封禁。
    - 有兴趣成为审核员？请在 OpenClaw Discord 中询问，并联系审核员或维护者。

  </Accordion>
</AccordionGroup>

## ClawHub CLI

只有在发布/同步等需要注册表认证的工作流中
才需要它。

### 全局选项

<ParamField path="--workdir <dir>" type="string">
  工作目录。默认值：当前目录；回退到 OpenClaw 工作区。
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  Skills 目录，相对于 workdir。
</ParamField>
<ParamField path="--site <url>" type="string">
  站点基准 URL（浏览器登录）。
</ParamField>
<ParamField path="--registry <url>" type="string">
  注册表 API 基准 URL。
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

    - `--token <token>` — 粘贴 API token。
    - `--label <label>` — 为浏览器登录 token 存储的标签（默认：`CLI token`）。
    - `--no-browser` — 不打开浏览器（需要 `--token`）。

  </Accordion>
  <Accordion title="搜索">
    ```bash
    clawhub search "query"
    ```

    搜索 Skills。对于插件/软件包发现，请使用 `clawhub package explore`。

    - `--limit <n>` — 最大结果数。

  </Accordion>
  <Accordion title="浏览 / 检查插件">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "episodic-claw" --family code-plugin
    clawhub package inspect episodic-claw
    ```

    `package explore` 和 `package inspect` 是 ClawHub CLI 用于插件/软件包发现和元数据检查的入口。原生 OpenClaw 安装仍使用 `openclaw plugins install clawhub:<package>`。

    选项：

    - `--family skill|code-plugin|bundle-plugin` — 筛选软件包系列。
    - `--official` — 仅显示官方软件包。
    - `--executes-code` — 仅显示执行代码的软件包。
    - `--version <version>` / `--tag <tag>` — 检查特定软件包版本。
    - `--versions`、`--files`、`--file <path>` — 检查软件包历史和文件。
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
    - `--force` — 如果文件夹已存在，或本地文件与任何已发布版本都不匹配，则覆盖。
    - `clawhub list` 读取 `.clawhub/lock.json`。

  </Accordion>
  <Accordion title="发布 Skills">
    ```bash
    clawhub skill publish <path>
    ```

    选项：

    - `--slug <slug>` — skill slug。
    - `--name <name>` — 显示名称。
    - `--version <version>` — semver 版本。
    - `--changelog <text>` — changelog 文本（可以为空）。
    - `--tags <tags>` — 逗号分隔的标签（默认：`latest`）。

  </Accordion>
  <Accordion title="发布插件">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` 可以是本地文件夹、`owner/repo`、`owner/repo@ref`，或
    GitHub URL。

    选项：

    - `--dry-run` — 构建精确的发布计划，但不上传任何内容。
    - `--json` — 为 CI 输出机器可读内容。
    - `--source-repo`、`--source-commit`、`--source-ref` — 自动检测不足时的可选覆盖项。

  </Accordion>
  <Accordion title="请求重新扫描">
    ```bash
    clawhub skill rescan <slug>
    clawhub skill rescan <slug> --yes --json

    clawhub package rescan <name>
    clawhub package rescan <name> --yes --json
    ```

    重新扫描命令需要已登录的所有者 token，并以最新
    已发布的 skill 版本或插件发布版本为目标。在非交互式运行中，请传入
    `--yes`。

    JSON 响应包含目标类型、名称、版本、重新扫描状态，以及
    该版本或发布版本的剩余/最大请求次数。

  </Accordion>
  <Accordion title="删除 / 恢复删除（所有者或管理员）">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="同步（扫描本地 + 发布新增或更新）">
    ```bash
    clawhub sync
    ```

    选项：

    - `--root <dir...>` — 额外扫描根目录。
    - `--all` — 不提示，上传所有内容。
    - `--dry-run` — 显示将要上传的内容。
    - `--bump <type>` — 更新使用的 `patch|minor|major`（默认：`patch`）。
    - `--changelog <text>` — 非交互式更新的 changelog。
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
  <Tab title="发布单个 skill">
    ```bash
    clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
    ```
  </Tab>
  <Tab title="同步多个 skills">
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

已发布的包应随附**构建后的 JavaScript**，并将 `runtimeExtensions` 指向该输出。通过 Git checkout 安装时，如果不存在构建文件，仍可回退到 TypeScript 源码，但构建后的运行时入口可以避免在启动、doctor 和插件加载路径中进行运行时 TypeScript 编译。

## 版本控制、lockfile 和遥测

<AccordionGroup>
  <Accordion title="版本控制和标签">
    - 每次发布都会创建一个新的 **semver** `SkillVersion`。
    - 标签（如 `latest`）指向某个版本；移动标签可以让你回滚。
    - Changelogs 按版本附加，在同步或发布更新时可以为空。

  </Accordion>
  <Accordion title="本地更改与 registry 版本">
    更新会使用内容哈希将本地 skill 内容与 registry 版本进行比较。如果本地文件与任何已发布版本都不匹配，CLI 会在覆盖前询问（或在非交互式运行中要求使用 `--force`）。
  </Accordion>
  <Accordion title="同步扫描和回退根目录">
    `clawhub sync` 会先扫描你当前的工作目录。如果找不到 skills，它会回退到已知的旧位置（例如 `~/openclaw/skills` 和 `~/.openclaw/skills`）。这是为了在不添加额外标志的情况下找到较早安装的 skills。
  </Accordion>
  <Accordion title="存储和 lockfile">
    - 已安装的 skills 会记录在你的工作目录下的 `.clawhub/lock.json` 中。
    - 认证令牌存储在 ClawHub CLI 配置文件中（可通过 `CLAWHUB_CONFIG_PATH` 覆盖）。

  </Accordion>
  <Accordion title="遥测（安装计数）">
    当你在登录状态下运行 `clawhub sync` 时，CLI 会发送一个最小快照来计算安装计数。你可以完全禁用此功能：

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## 环境变量

| 变量                          | 作用                                            |
| ----------------------------- | ----------------------------------------------- |
| `CLAWHUB_SITE`                | 覆盖站点 URL。                                 |
| `CLAWHUB_REGISTRY`            | 覆盖 registry API URL。                        |
| `CLAWHUB_CONFIG_PATH`         | 覆盖 CLI 存储令牌/配置的位置。                 |
| `CLAWHUB_WORKDIR`             | 覆盖默认工作目录。                             |
| `CLAWHUB_DISABLE_TELEMETRY=1` | 在 `sync` 时禁用遥测。                         |

## 相关

- [社区插件](/zh-CN/plugins/community)
- [插件](/zh-CN/tools/plugin)
- [Skills](/zh-CN/tools/skills)
