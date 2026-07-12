---
read_when:
    - 添加或修改技能
    - 更改 Skills 的启用条件、允许列表或加载规则
    - 理解 Skills 优先级和快照行为
sidebarTitle: Skills
summary: Skills 教你的智能体如何使用工具。了解它们的加载方式、优先级机制，以及如何配置门控、允许列表和环境变量注入。
title: Skills
x-i18n:
    generated_at: "2026-07-11T21:01:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9eb87daab8a10caab2823e35d68293fe306d11a951e8a2b264cbbe3f2c3e8fff
    source_path: tools/skills.md
    workflow: 16
---

Skills 是 Markdown 指令文件，用于教智能体如何以及何时使用工具。每个 Skill 都位于一个目录中，该目录包含带有 YAML 前置元数据和 Markdown 正文的 `SKILL.md` 文件。OpenClaw 会加载内置 Skills 和所有本地覆盖项，并在加载时根据环境、配置和二进制文件是否存在进行筛选。

<CardGroup cols={2}>
  <Card title="创建技能" href="/zh-CN/tools/creating-skills" icon="hammer">
    从零开始构建并测试自定义 Skill。
  </Card>
  <Card title="Skill Workshop" href="/zh-CN/tools/skill-workshop" icon="flask">
    审查并批准智能体起草的 Skill 提案。
  </Card>
  <Card title="Skills 配置" href="/zh-CN/tools/skills-config" icon="gear">
    完整的 `skills.*` 配置架构和智能体允许列表。
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    浏览并安装社区 Skills。
  </Card>
</CardGroup>

## 加载顺序

OpenClaw 按以下来源加载，**优先级从高到低**。当多个位置出现同名 Skill 时，优先级最高的来源生效。

| 优先级 | 来源 | 路径 |
| ----------- | ---------------------- | --------------------------------------- |
| 1 — 最高 | 工作区 Skills | `<workspace>/skills` |
| 2 | 项目智能体 Skills | `<workspace>/.agents/skills` |
| 3 | 个人智能体 Skills | `~/.agents/skills` |
| 4 | 托管/本地 Skills | `~/.openclaw/skills` |
| 5 | 内置 Skills | 随安装包提供 |
| 6 — 最低 | 额外目录 | `skills.load.extraDirs` + 插件 Skills |

Skill 根目录支持分组布局。只要 `SKILL.md` 出现在已配置根目录下的任意位置（最多深入 6 层），OpenClaw 就会发现该 Skill：

```text
<workspace>/skills/research/SKILL.md          ✓ 发现为 "research"
<workspace>/skills/personal/research/SKILL.md ✓ 同样发现为 "research"
```

文件夹路径仅用于组织。Skill 的名称和斜杠命令来自前置元数据中的 `name` 字段（如果缺少 `name`，则使用目录名称）。下文的智能体允许列表也会根据此 `name` 进行匹配。

<Note>
  Codex CLI 原生的 `$CODEX_HOME/skills` 目录**不是** OpenClaw 的 Skill 根目录。先使用 `openclaw migrate plan codex` 清点这些 Skills，再使用 `openclaw migrate codex` 将其复制到你的 OpenClaw 工作区。
</Note>

## 节点托管的 Skills

已连接的无头节点可以发布安装在其当前 OpenClaw Skills 目录中的 Skills（默认为 `~/.openclaw/skills`；配置文件环境覆盖项同样适用）。节点连接时，这些 Skills 会出现在正常的智能体 Skill 列表中；节点断开连接时则会消失。如果发生名称冲突，本地或 Gateway 网关 Skill 保留其名称，节点 Skill 会获得一个确定性的、带节点前缀的名称。节点托管 v1 要求目录名称与 Skill 前置元数据中的 `name` 字段一致。

Skill 条目包含节点定位信息。其文件、相对引用和二进制文件都位于节点上，因此请使用 `exec host=node node=<node-id>` 加载并执行它。更改 Skill 文件后，请重启节点主机。有关配对和关闭开关，请参阅[节点](/zh-CN/nodes#node-hosted-skills)。

## 每智能体 Skills 与共享 Skills

在多智能体设置中，每个智能体都有自己的工作区。请根据所需的可见范围使用对应路径：

| 范围 | 路径 | 对以下对象可见 |
| -------------- | ---------------------------- | --------------------------- |
| 每智能体 | `<workspace>/skills` | 仅该智能体 |
| 项目智能体 | `<workspace>/.agents/skills` | 仅该工作区的智能体 |
| 个人智能体 | `~/.agents/skills` | 此机器上的所有智能体 |
| 共享托管 | `~/.openclaw/skills` | 此机器上的所有智能体 |
| 额外目录 | `skills.load.extraDirs` | 此机器上的所有智能体 |

## 智能体允许列表

Skill 的**位置**（优先级）与 Skill 的**可见性**（哪些智能体可以使用它）是两种独立控制方式。无论 Skills 从何处加载，都可以使用允许列表限制智能体可见的 Skills。

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // 共享基准
    },
    list: [
      { id: "writer" }, // 继承 github、weather
      { id: "docs", skills: ["docs-search"] }, // 完全替换默认值
      { id: "locked-down", skills: [] }, // 不使用任何 Skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="允许列表规则">
    - 省略 `agents.defaults.skills`，默认不限制任何 Skills。
    - 省略 `agents.list[].skills`，将继承 `agents.defaults.skills`。
    - 将 `agents.list[].skills: []` 设为空列表，不向该智能体开放任何 Skills。
    - 非空的 `agents.list[].skills` 列表是**最终**集合，不会与默认值合并。
    - 生效的允许列表适用于提示词构建、斜杠命令发现、沙箱同步和 Skill 快照。
    - 这不是主机 Shell 的授权边界。如果同一个智能体可以使用 `exec`，请另外通过沙箱隔离、操作系统用户隔离、Exec 拒绝/允许列表和按资源配置的凭据来约束该 Shell。

  </Accordion>
</AccordionGroup>

## 插件和 Skills

插件可以通过在 `openclaw.plugin.json` 中列出 `skills` 目录（路径相对于插件根目录）来提供自己的 Skills。插件启用后，其 Skills 就会加载。例如，浏览器插件提供了用于多步骤浏览器控制的 `browser-automation` Skill。

插件 Skill 目录与 `skills.load.extraDirs` 在同一低优先级层级合并，因此同名的内置、托管、智能体或工作区 Skill 会覆盖它们。与其他 Skill 一样，可以通过其前置元数据中的 `metadata.openclaw.requires` 限制插件 Skill 自身的适用条件。

有关完整的插件系统，请参阅[插件](/zh-CN/tools/plugin)和[工具](/zh-CN/tools)。

## Skill Workshop

[Skill Workshop](/zh-CN/tools/skill-workshop) 是智能体与你当前 Skill 文件之间的提案队列。当智能体发现可复用的工作时，它会起草提案，而不是直接写入 `SKILL.md`。任何内容发生更改前，都由你进行审查和批准。

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

有关完整生命周期、CLI 参考和配置，请参阅 [Skill Workshop](/zh-CN/tools/skill-workshop)。

## 从 ClawHub 安装

[ClawHub](https://clawhub.ai) 是公共 Skills 注册中心。使用 `openclaw skills` 命令进行安装和更新，或使用 `clawhub` CLI 进行发布和同步。

| 操作 | 命令 |
| ---------------------------------- | ------------------------------------------------------ |
| 将 Skill 安装到工作区 | `openclaw skills install @owner/<slug>` |
| 从 Git 仓库安装 | `openclaw skills install git:owner/repo@ref` |
| 安装本地 Skill 目录 | `openclaw skills install ./path/to/skill --as my-tool` |
| 为所有本地智能体安装 | `openclaw skills install @owner/<slug> --global` |
| 更新所有工作区 Skills | `openclaw skills update --all` |
| 更新共享托管 Skill | `openclaw skills update @owner/<slug> --global` |
| 更新所有共享托管 Skills | `openclaw skills update --all --global` |
| 验证 Skill 的信任范围 | `openclaw skills verify @owner/<slug>` |
| 输出生成的 Skill 卡片 | `openclaw skills verify @owner/<slug> --card` |
| 通过 ClawHub CLI 发布/同步 | `clawhub sync --all` |

<AccordionGroup>
  <Accordion title="安装详情">
    `openclaw skills install` 默认安装到当前工作区的 `skills/` 目录。添加 `--global` 可安装到共享的 `~/.openclaw/skills` 目录；除非智能体允许列表缩小了范围，否则所有本地智能体都可以看到它。

    从 Git 和本地来源安装时，要求源根目录下存在 `SKILL.md`。如果 `SKILL.md` 前置元数据中的 `name` 有效，则使用它作为短标识；否则回退到目录或仓库名称。使用 `--as <slug>` 可以覆盖此名称。
    `openclaw skills update` 仅跟踪从 ClawHub 安装的 Skills；如需刷新 Git 或本地来源，请重新安装。

  </Accordion>
  <Accordion title="验证和安全扫描">
    `openclaw skills verify @owner/<slug>` 会向 ClawHub 请求该 Skill 的 `clawhub.skill.verify.v1` 信任范围。从 ClawHub 安装的 Skills 会根据 `.clawhub/origin.json` 中记录的版本和注册中心进行验证。
    对于已安装或名称无歧义的现有 Skills，仍可使用不带所有者的短标识，但带所有者限定的引用可避免发布者歧义。

    ClawHub Skill 页面会在安装前显示最新的安全扫描状态，并提供 VirusTotal、ClawScan 和静态分析的详情页面。当 ClawHub 将验证标记为失败时，该命令会以非零状态码退出。发布者可以通过 ClawHub 控制面板或 `clawhub skill rescan @owner/<slug>` 处理误报。

  </Accordion>
  <Accordion title="私有归档安装">
    需要通过非 ClawHub 方式交付的 Gateway 网关客户端，可以使用 `skills.upload.begin`、`skills.upload.chunk` 和 `skills.upload.commit` 暂存 ZIP 格式的 Skill 归档，然后通过 `skills.install({ source: "upload", ... })` 安装。此路径默认关闭，必须在 `openclaw.json` 中设置 `skills.install.allowUploadedArchives: true`。正常的 ClawHub 安装从不需要此设置。
  </Accordion>
</AccordionGroup>

## 安全

<Warning>
  将第三方 Skills 视为**不受信任的代码**。启用前请先阅读其内容。对于不受信任的输入和高风险工具，优先在沙箱中运行。有关智能体侧的控制方式，请参阅[沙箱隔离](/zh-CN/gateway/sandboxing)。
</Warning>

<AccordionGroup>
  <Accordion title="路径限制">
    工作区、项目智能体和额外目录中的 Skill 发现仅接受解析后的真实路径仍位于已配置根目录内的 Skill 根目录，除非 `skills.load.allowSymlinkTargets` 明确信任某个目标根目录。
    只有启用 `skills.workshop.allowSymlinkTargetWrites` 后，Skill Workshop 才会通过这些受信任的目标写入。
    托管目录 `~/.openclaw/skills` 和个人目录 `~/.agents/skills` 可以包含符号链接的 Skill 文件夹，但每个 `SKILL.md` 的真实路径仍必须位于其解析后的 Skill 目录内。
  </Accordion>
  <Accordion title="操作员安装策略">
    配置 `security.installPolicy`，在继续安装 Skill 前运行受信任的本地策略命令。该策略会接收元数据和暂存源路径，并适用于 ClawHub、上传、Git、本地、更新和依赖项安装器路径；当命令无法返回有效决策时，将以拒绝方式失败。
  </Accordion>
  <Accordion title="密钥注入范围">
    `skills.entries.*.env` 和 `skills.entries.*.apiKey` 仅在该智能体轮次中将密钥注入**主机**进程，而不会注入沙箱。请勿在提示词和日志中包含密钥。
  </Accordion>
</AccordionGroup>

有关更广泛的威胁模型和安全检查清单，请参阅[安全](/zh-CN/gateway/security)。

## SKILL.md 格式

每个 Skill 的前置元数据至少需要包含 `name` 和 `description`：

```markdown
---
name: image-lab
description: 通过由提供商支持的图像工作流生成或编辑图像
---

当用户请求生成图像时，使用 `image_generate` 工具……
```

<Note>
  OpenClaw 遵循 [AgentSkills](https://agentskills.io) 规范。Frontmatter
  首先按 YAML 解析；如果失败，则回退到仅支持单行的
  解析器。嵌套的 `metadata` 块（包括多行 YAML 映射）会
  展平为 JSON 字符串，并按 JSON5 重新解析，因此
  [门控](#gating)下所示的块形式可以正常使用。在正文中使用 `{baseDir}` 引用
  skill 文件夹路径。
</Note>

### 可选的 frontmatter 键

<ParamField path="homepage" type="string">
  在 macOS Skills UI 中显示为“网站”的 URL。也可通过
  `metadata.openclaw.homepage` 设置。
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  当为 `true` 时，skill 会作为用户可调用的斜杠命令公开。
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  当为 `true` 时，OpenClaw 不会将该 skill 的指令放入智能体的常规
  提示词中。当 `user-invocable` 也为 `true` 时，该 skill 仍可作为斜杠命令使用。
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  设置为 `tool` 时，斜杠命令会绕过模型并直接分派给
  已注册的工具。
</ParamField>

<ParamField path="command-tool" type="string">
  设置 `command-dispatch: tool` 时要调用的工具名称。
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  对于工具分派，将原始参数字符串转发给工具，不进行
  核心解析。工具会收到
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`。
</ParamField>

## 门控

OpenClaw 在加载时使用 `metadata.openclaw`（嵌入 frontmatter 中的 JSON5 对象，
参见上面的解析说明）筛选 Skills。没有
`metadata.openclaw` 块的 skill 始终符合条件，除非被明确禁用。

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
metadata:
  {
    "openclaw":
      {
        "requires": { "bins": ["uv"], "env": ["GEMINI_API_KEY"], "config": ["browser.enabled"] },
        "primaryEnv": "GEMINI_API_KEY",
      },
  }
---
```

<ParamField path="always" type="boolean">
  当为 `true` 时，始终包含该 skill，并跳过所有其他门控条件。
</ParamField>

<ParamField path="emoji" type="string">
  在 macOS Skills UI 中显示的可选表情符号。
</ParamField>

<ParamField path="homepage" type="string">
  在 macOS Skills UI 中显示为“网站”的可选 URL。
</ParamField>

<ParamField path="os" type='("darwin" | "linux" | "win32")[]'>
  平台筛选器。设置后，该 skill 仅在列出的操作系统上符合条件。
</ParamField>

<ParamField path="requires.bins" type="string[]">
  每个二进制文件都必须存在于 `PATH` 中。
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  至少一个二进制文件必须存在于 `PATH` 中。
</ParamField>

<ParamField path="requires.env" type="string[]">
  每个环境变量都必须存在于进程中，或通过配置提供。
</ParamField>

<ParamField path="requires.config" type="string[]">
  每个 `openclaw.json` 路径的值都必须为真值。
</ParamField>

<ParamField path="primaryEnv" type="string">
  与 `skills.entries.<name>.apiKey` 关联的环境变量名称。
</ParamField>

<ParamField path="install" type="object[]">
  macOS Skills UI 使用的可选安装器规范（brew / node / go / uv / download）。
</ParamField>

<Note>
  当 `metadata.openclaw` 不存在时，仍接受旧版
  `metadata.clawdbot` 块，因此较早安装的 Skills 会保留其
  依赖门控条件和安装器提示。新的 Skills 应使用
  `metadata.openclaw`。
</Note>

### 安装器规范

安装器规范用于告知 macOS Skills UI 如何安装依赖项：

```markdown
---
name: gemini
description: Use Gemini CLI for coding assistance and Google search lookups.
metadata:
  {
    "openclaw":
      {
        "emoji": "♊️",
        "requires": { "bins": ["gemini"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "gemini-cli",
              "bins": ["gemini"],
              "label": "Install Gemini CLI (brew)",
            },
          ],
      },
  }
---
```

<AccordionGroup>
  <Accordion title="安装器选择规则">
    - 列出多个安装器时，Gateway 网关会选择一个首选
      选项（可用时选择 brew，否则选择 node）。
    - 如果所有安装器都是 `download`，OpenClaw 会列出每个条目，便于你
      查看所有可用构件。
    - 规范可以包含 `os: ["darwin"|"linux"|"win32"]`，以按平台筛选。
    - Node 安装遵循 `openclaw.json` 中的 `skills.install.nodeManager`
      （默认值：npm；选项：npm / pnpm / yarn / bun）。这只影响 skill
      安装；Gateway 网关运行时仍应使用 Node。
    - Gateway 网关安装器优先顺序：Homebrew → uv → 已配置的 node 管理器 →
      go → download。
  </Accordion>
  <Accordion title="各安装器详情">
    - **Homebrew：**OpenClaw 不会自动安装 Homebrew，也不会将 brew
      formula 转换为系统软件包命令。在没有
      `brew` 的 Linux 容器中，仅支持 brew 的安装器会被隐藏；请使用自定义镜像或手动安装
      依赖项。
    - **Go：**OpenClaw 要求使用 Go 1.21 或更高版本才能自动安装 Skills。
      如果缺少 `go` 且 Homebrew 可用，OpenClaw 会先通过
      Homebrew 安装 Go；在没有 Homebrew 的 Linux 上，如果刷新后的 `golang-go`
      候选版本满足最低版本要求，则可以改为以 root 身份或通过免密码 `sudo`
      使用 `apt-get`。依赖项实际执行的 `go install`
      始终以 OpenClaw 管理的专用 bin 目录为目标
      （全新安装时为 Homebrew 的 `bin`，否则为 `~/.local/bin`），而不会使用
      你配置的 `GOBIN`——系统会读取你自己的 `GOBIN`、`GOPATH` 和 `GOTOOLCHAIN`
      环境变量，但绝不会覆盖它们。
    - **下载：**`url`（必填）、`archive`（`tar.gz` | `tar.bz2` | `zip`）、
      `extract`（默认值：检测到归档文件时自动启用）、`stripComponents`、
      `targetDir`（默认值：`~/.openclaw/tools/<skillKey>`）。
  </Accordion>
  <Accordion title="沙箱隔离说明">
    `requires.bins` 会在加载 skill 时于**主机**上检查。如果智能体
    在沙箱中运行，该二进制文件也必须存在于**容器内部**。
    请通过 `agents.defaults.sandbox.docker.setupCommand` 或自定义
    镜像安装。`setupCommand` 会在容器创建后运行一次，并要求
    沙箱具备网络出站访问、可写的根文件系统以及 root 用户。
  </Accordion>
</AccordionGroup>

## 配置覆盖

在 `~/.openclaw/openclaw.json` 的 `skills.entries` 下启用和配置
内置或托管的 Skills：

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
        config: {
          endpoint: "https://example.invalid",
          model: "nano-pro",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

<ParamField path="enabled" type="boolean">
  即使 skill 已内置或安装，`false` 也会将其禁用。内置的 `coding-agent`
  skill 需要主动启用——设置 `skills.entries.coding-agent.enabled: true`
  并确保已安装 `claude`、`codex`、`opencode` 或其他受支持的 CLI
  之一，且已完成身份验证。
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  为声明了 `metadata.openclaw.primaryEnv` 的 Skills 提供的便捷字段。
  支持明文字符串或 SecretRef 对象。
</ParamField>

<ParamField path="env" type="Record<string, string>">
  为智能体运行注入的环境变量。仅当进程中
  尚未设置该变量时才会注入。
</ParamField>

<ParamField path="config" type="object">
  用于自定义各 skill 配置字段的可选容器。
</ParamField>

<ParamField path="allowBundled" type="string[]">
  仅适用于**内置** Skills 的可选允许列表。设置后，只有列表中的内置 Skills
  符合条件。托管 Skills 和工作区 Skills 不受影响。
</ParamField>

<Note>
  默认情况下，配置键与 **skill 名称**匹配。如果某个 skill 定义了
  `metadata.openclaw.skillKey`，请改用该键作为 `skills.entries` 下的键。
  请为带连字符的名称加引号：JSON5 允许使用带引号的键。
</Note>

## 环境注入

智能体运行开始时，OpenClaw 会：

<Steps>
  <Step title="读取 skill 元数据">
    OpenClaw 解析智能体的有效 skill 列表，并应用门控
    规则、允许列表和配置覆盖。
  </Step>
  <Step title="注入环境变量和 API 密钥">
    `skills.entries.<key>.env` 和 `skills.entries.<key>.apiKey` 会在
    运行期间应用到 `process.env`。
  </Step>
  <Step title="构建系统提示词">
    符合条件的 Skills 会编译为紧凑的 XML 块，并注入
    系统提示词。
  </Step>
  <Step title="恢复环境">
    运行结束后，会恢复原始环境。
  </Step>
</Steps>

<Warning>
  环境变量注入仅作用于**主机**上的智能体运行，而不作用于沙箱。在
  沙箱内部，`env` 和 `apiKey` 不会产生作用。有关如何
  将秘密传入沙箱隔离运行，请参阅
  [Skills 配置](/zh-CN/tools/skills-config#sandboxed-skills-and-env-vars)。
</Warning>

对于内置的 `claude-cli` 后端，OpenClaw 还会将相同的
符合条件的 skill 快照具体化为临时 Claude Code 插件，并通过
`--plugin-dir` 传递。其他 CLI 后端仅使用提示词目录。

## 快照和刷新

OpenClaw 会在**会话开始时**为符合条件的 Skills 创建快照，并在该会话的
所有后续轮次中复用该列表。对 Skills 或配置的更改会在下一个新会话中
生效。

在以下两种情况下，Skills 会在会话中途刷新：

- Skills 监视器检测到 `SKILL.md` 更改。
- 新的符合条件的远程节点建立连接。

刷新的列表会在智能体的下一轮中生效。如果智能体的有效
允许列表发生变化，OpenClaw 会刷新快照，使可见 Skills
保持一致。

<AccordionGroup>
  <Accordion title="Skills 监视器">
    默认情况下，OpenClaw 会监视 skill 文件夹，并在
    `SKILL.md` 文件发生变化时更新快照。在 `skills.load` 下配置：

    ```json5
    {
      skills: {
        load: {
          extraDirs: ["~/Projects/agent-scripts/skills"],
          allowSymlinkTargets: ["~/Projects/manager/skills"],
          watch: true, // default
          watchDebounceMs: 250, // default
        },
      },
    }
    ```

    对于有意使用符号链接的布局，如果 skill
    根目录符号链接指向已配置根目录之外，请使用 `allowSymlinkTargets`，例如
    `<workspace>/skills/manager -> ~/Projects/manager/skills`。
    仅当 Skill Workshop 也应通过这些受信任的符号链接路径
    应用提案时，才启用 `skills.workshop.allowSymlinkTargetWrites`。

  </Accordion>
  <Accordion title="远程 macOS 节点（Linux Gateway 网关）">
    如果 Gateway 网关在 Linux 上运行，但连接了允许
    `system.run` 的 **macOS 节点**，当该节点上存在所需二进制文件时，
    OpenClaw 可以将仅限 macOS 的 Skills 视为符合条件。智能体应使用
    `exec` 工具并设置 `host=node` 来运行这些 Skills。

    离线节点**不会**使仅限远程的 Skills 可见。如果节点停止
    响应二进制文件探测，OpenClaw 会清除其缓存的二进制文件匹配结果。

  </Accordion>
</AccordionGroup>

## Token 影响

当有符合条件的 Skills 时，OpenClaw 会将紧凑的 XML 块注入系统
提示词。其成本是确定性的，并随每个 skill 线性增长：

- **基础开销**（仅当至少有一个 skill 符合条件时）：一段固定的介绍
  文本以及 `<available_skills>` 包装器。
- **每个 skill：**约 97 个字符，再加上 `name`、`description` 和 `location`
  字段的长度。
- XML 转义会将 `& < > " '` 展开为实体，每次出现会增加几个字符。
- 按约 4 个字符/token 计算，在不计字段长度时，每个 skill 的 97 个字符约等于 24 个 token。

如果渲染后的区块将超过配置的提示词预算
（`skills.limits.maxSkillsPromptChars`），OpenClaw 会首先使用不含描述的紧凑格式，保留该格式所能容纳的尽可能多的 Skills 标识信息（名称、位置和版本）。然后，它会将剩余预算用于缩短后的描述。如果没有剩余的描述预算，则省略描述。每当需要使用紧凑格式或截断列表时，提示词中都会包含一条指向 `openclaw skills check` 的说明。

保持描述简短且清晰，以尽量减少提示词开销。

## 相关内容

<CardGroup cols={2}>
  <Card title="创建技能" href="/zh-CN/tools/creating-skills" icon="hammer">
    编写自定义 Skill 的分步指南。
  </Card>
  <Card title="Skill 工作坊" href="/zh-CN/tools/skill-workshop" icon="flask">
    由智能体起草的 Skills 提案队列。
  </Card>
  <Card title="Skills 配置" href="/zh-CN/tools/skills-config" icon="gear">
    完整的 `skills.*` 配置架构和智能体允许列表。
  </Card>
  <Card title="斜杠命令" href="/zh-CN/tools/slash-commands" icon="terminal">
    Skill 斜杠命令的注册和路由方式。
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    在公共注册表中浏览和发布 Skills。
  </Card>
  <Card title="插件" href="/zh-CN/tools/plugin" icon="plug">
    插件可以随其所记录的工具一起提供 Skills。
  </Card>
</CardGroup>
