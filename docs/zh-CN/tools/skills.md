---
read_when:
    - 添加或修改技能
    - 更改 Skills 门控、允许列表或加载规则
    - 理解 Skills 优先级和快照行为
sidebarTitle: Skills
summary: Skills 教你的智能体如何使用工具。了解 Skills 的加载方式、优先级的工作原理，以及如何配置门控、允许列表和环境注入。
title: Skills
x-i18n:
    generated_at: "2026-07-12T14:49:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9eb87daab8a10caab2823e35d68293fe306d11a951e8a2b264cbbe3f2c3e8fff
    source_path: tools/skills.md
    workflow: 16
---

Skills 是 Markdown 指令文件，用于教智能体如何以及何时使用
工具。每个 Skills 都位于一个目录中，该目录包含一个具有 YAML
frontmatter 和 Markdown 正文的 `SKILL.md` 文件。OpenClaw 会加载内置 Skills 和所有本地
覆盖项，并在加载时根据环境、配置和
二进制文件是否存在进行筛选。

<CardGroup cols={2}>
  <Card title="创建技能" href="/zh-CN/tools/creating-skills" icon="hammer">
    从头开始构建并测试自定义 Skills。
  </Card>
  <Card title="Skills 工作坊" href="/zh-CN/tools/skill-workshop" icon="flask">
    审查并批准智能体起草的 Skills 提案。
  </Card>
  <Card title="Skills 配置" href="/zh-CN/tools/skills-config" icon="gear">
    完整的 `skills.*` 配置架构和智能体允许列表。
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    浏览并安装社区 Skills。
  </Card>
</CardGroup>

## 加载顺序

OpenClaw 从以下来源加载，**优先级从高到低**。当同名
Skills 出现在多个位置时，优先级最高的来源生效。

| 优先级      | 来源                    | 路径                                    |
| ----------- | ----------------------- | --------------------------------------- |
| 1 — 最高    | 工作区 Skills           | `<workspace>/skills`                    |
| 2           | 项目智能体 Skills       | `<workspace>/.agents/skills`            |
| 3           | 个人智能体 Skills       | `~/.agents/skills`                      |
| 4           | 托管 / 本地 Skills      | `~/.openclaw/skills`                    |
| 5           | 内置 Skills             | 随安装包提供                            |
| 6 — 最低    | 额外目录                | `skills.load.extraDirs` + 插件 Skills   |

Skills 根目录支持分组布局。只要配置的根目录下任意位置
（最多深入 6 层）出现 `SKILL.md`，OpenClaw 就会发现相应 Skills：

```text
<workspace>/skills/research/SKILL.md          ✓ 发现为 "research"
<workspace>/skills/personal/research/SKILL.md ✓ 也发现为 "research"
```

文件夹路径仅用于组织。Skills 的名称和斜杠命令
来自 frontmatter 的 `name` 字段（如果缺少 `name`，则使用目录名称）。
智能体允许列表（见下文）也按此 `name` 匹配。

<Note>
  Codex CLI 原生的 `$CODEX_HOME/skills` 目录**不是** OpenClaw
  Skills 根目录。使用 `openclaw migrate plan codex` 盘点这些 Skills，然后
  使用 `openclaw migrate codex` 将其复制到你的 OpenClaw 工作区中。
</Note>

## 节点托管的 Skills

已连接的无头节点可以发布安装在其当前 OpenClaw
Skills 目录中的 Skills（默认为 `~/.openclaw/skills`；配置文件环境覆盖
同样适用）。节点连接期间，它们会出现在常规的智能体 Skills 列表中，
断开连接后则会消失。发生名称冲突时，本地或 Gateway 网关 Skills 保留其名称；
节点 Skills 会获得一个确定性的、带节点前缀的名称。
节点托管 v1 要求目录名称与 Skills frontmatter 中的 `name`
字段匹配。

Skills 条目包含节点定位信息。其文件、相对引用和
二进制文件均位于节点上，因此请使用
`exec host=node node=<node-id>` 加载并执行它。更改 Skills
文件后，请重启节点主机。有关配对和禁用开关，请参阅[节点](/zh-CN/nodes#node-hosted-skills)。

## 按智能体与共享 Skills

在多智能体设置中，每个智能体都有自己的工作区。根据
所需可见性使用对应路径：

| 作用域         | 路径                         | 可见范围                    |
| -------------- | ---------------------------- | --------------------------- |
| 按智能体       | `<workspace>/skills`         | 仅该智能体                  |
| 项目智能体     | `<workspace>/.agents/skills` | 仅该工作区的智能体          |
| 个人智能体     | `~/.agents/skills`           | 此计算机上的所有智能体      |
| 共享托管       | `~/.openclaw/skills`         | 此计算机上的所有智能体      |
| 额外目录       | `skills.load.extraDirs`      | 此计算机上的所有智能体      |

## 智能体允许列表

Skills 的**位置**（优先级）和 Skills 的**可见性**（哪些智能体可以使用
它）是两项独立的控制。使用允许列表限制智能体可见的 Skills，
无论它们从何处加载。

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // 共享基线
    },
    list: [
      { id: "writer" }, // 继承 github、weather
      { id: "docs", skills: ["docs-search"] }, // 完全替换默认值
      { id: "locked-down", skills: [] }, // 无 Skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="允许列表规则">
    - 省略 `agents.defaults.skills`，则默认不限制任何 Skills。
    - 省略 `agents.list[].skills`，则继承 `agents.defaults.skills`。
    - 设置 `agents.list[].skills: []`，则不向该智能体公开任何 Skills。
    - 非空的 `agents.list[].skills` 列表是**最终**集合——不会与
      默认值合并。
    - 最终生效的允许列表会应用于提示词构建、斜杠命令
      发现、沙箱同步和 Skills 快照。
    - 这不是主机 shell 的授权边界。如果同一智能体可以
      使用 `exec`，请另外通过沙箱隔离、操作系统用户
      隔离、Exec 拒绝/允许列表以及按资源配置的凭据来约束该 shell。
  </Accordion>
</AccordionGroup>

## 插件和 Skills

插件可以通过在 `openclaw.plugin.json` 中列出 `skills` 目录
（路径相对于插件根目录）来附带自己的 Skills。插件启用后会加载
其 Skills——例如，浏览器插件附带一个用于多步骤浏览器控制的
`browser-automation` Skills。

插件 Skills 目录与 `skills.load.extraDirs` 处于相同的低优先级层级，
因此，同名的内置、托管、智能体或工作区
Skills 会覆盖它们。与其他 Skills 一样，通过其 frontmatter 中的
`metadata.openclaw.requires` 控制插件 Skills 自身是否符合加载条件。

有关完整的插件系统，请参阅[插件](/zh-CN/tools/plugin)和[工具](/zh-CN/tools)。

## Skills 工作坊

[Skills 工作坊](/zh-CN/tools/skill-workshop)是智能体
与你当前 Skills 文件之间的提案队列。当智能体发现可复用的工作时，它会起草
提案，而不是直接写入 `SKILL.md`。任何内容发生更改前，都需要你审查并批准。

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

有关完整生命周期、CLI
参考和配置，请参阅[Skills 工作坊](/zh-CN/tools/skill-workshop)。

## 从 ClawHub 安装

[ClawHub](https://clawhub.ai) 是公共 Skills 注册表。使用
`openclaw skills` 命令进行安装和更新，或使用 `clawhub` CLI 进行
发布和同步。

| 操作                            | 命令                                                   |
| ------------------------------- | ------------------------------------------------------ |
| 将 Skills 安装到工作区          | `openclaw skills install @owner/<slug>`                |
| 从 Git 仓库安装                 | `openclaw skills install git:owner/repo@ref`           |
| 安装本地 Skills 目录            | `openclaw skills install ./path/to/skill --as my-tool` |
| 为所有本地智能体安装            | `openclaw skills install @owner/<slug> --global`       |
| 更新所有工作区 Skills           | `openclaw skills update --all`                         |
| 更新共享托管 Skills             | `openclaw skills update @owner/<slug> --global`        |
| 更新所有共享托管 Skills         | `openclaw skills update --all --global`                |
| 验证 Skills 的信任信封          | `openclaw skills verify @owner/<slug>`                 |
| 打印生成的 Skills 卡片          | `openclaw skills verify @owner/<slug> --card`          |
| 通过 ClawHub CLI 发布 / 同步     | `clawhub sync --all`                                   |

<AccordionGroup>
  <Accordion title="安装详情">
    默认情况下，`openclaw skills install` 会安装到当前工作区的 `skills/`
    目录。添加 `--global` 可安装到共享的
    `~/.openclaw/skills` 目录；除非智能体允许列表进一步缩小范围，否则所有本地智能体均可见。

    Git 和本地安装要求源根目录中存在 `SKILL.md`。如果
    `SKILL.md` frontmatter 中的 `name` 有效，则使用它作为 slug；否则回退到
    目录或仓库名称。使用 `--as <slug>` 可覆盖此值。
    `openclaw skills update` 仅跟踪通过 ClawHub 安装的 Skills——要刷新 Git 或
    本地来源，请重新安装。

  </Accordion>
  <Accordion title="验证和安全扫描">
    `openclaw skills verify @owner/<slug>` 会向 ClawHub 请求该 Skills 的
    `clawhub.skill.verify.v1` 信任信封。已安装的 ClawHub Skills 会根据
    `.clawhub/origin.json` 中记录的版本和注册表进行验证。
    对于已安装或无歧义的 Skills，仍可使用不带所有者的 slug，但
    包含所有者的引用可以避免发布者歧义。

    ClawHub Skills 页面会在安装前展示最新的安全扫描状态，
    并提供 VirusTotal、ClawScan 和静态分析的详情页面。当 ClawHub
    将验证标记为失败时，该命令会以非零状态退出。发布者可以通过 ClawHub 控制面板或
    `clawhub skill rescan @owner/<slug>` 处理误报。

  </Accordion>
  <Accordion title="私有归档安装">
    需要通过非 ClawHub 方式分发的 Gateway 网关客户端，可以使用
    `skills.upload.begin`、`skills.upload.chunk` 和 `skills.upload.commit`
    暂存 zip 格式的 Skills 归档，然后通过 `skills.install({ source: "upload", ... })`
    安装。此路径默认关闭，需要在 `openclaw.json` 中设置
    `skills.install.allowUploadedArchives: true`。正常的 ClawHub 安装从不需要该设置。
  </Accordion>
</AccordionGroup>

## 安全

<Warning>
  将第三方 Skills 视为**不受信任的代码**。启用前请先阅读。
  对于不受信任的输入和高风险工具，优先使用沙箱隔离运行。有关智能体侧的控制，请参阅
  [沙箱隔离](/zh-CN/gateway/sandboxing)。
</Warning>

<AccordionGroup>
  <Accordion title="路径约束">
    工作区、项目智能体和额外目录的 Skills 发现仅接受以下 Skills
    根目录：其解析后的真实路径必须位于配置的根目录内，除非
    `skills.load.allowSymlinkTargets` 明确信任某个目标根目录。
    仅当启用 `skills.workshop.allowSymlinkTargetWrites` 时，
    Skills 工作坊才会通过这些可信目标进行写入。
    托管的 `~/.openclaw/skills` 和个人的 `~/.agents/skills` 可以包含
    符号链接形式的 Skills 文件夹，但每个 `SKILL.md` 的真实路径仍必须
    位于其解析后的 Skills 目录中。
  </Accordion>
  <Accordion title="操作员安装策略">
    配置 `security.installPolicy`，在继续安装 Skills 前运行受信任的本地策略命令。
    该策略会接收元数据和暂存的源路径，适用于 ClawHub、上传、Git、本地、更新以及
    依赖安装器路径；当命令无法返回有效决策时，它会以拒绝方式失败。
  </Accordion>
  <Accordion title="密钥注入作用域">
    `skills.entries.*.env` 和 `skills.entries.*.apiKey` 仅在该智能体轮次中将密钥注入
    **主机**进程，而不是沙箱。不要在提示词和日志中包含密钥。
  </Accordion>
</AccordionGroup>

有关更广泛的威胁模型和安全检查清单，请参阅
[安全](/zh-CN/gateway/security)。

## SKILL.md 格式

每个 Skills 的 frontmatter 至少需要包含 `name` 和 `description`：

```markdown
---
name: image-lab
description: 通过提供商支持的图像工作流生成或编辑图像
---

当用户要求生成图像时，使用 `image_generate` 工具……
```

<Note>
  OpenClaw 遵循 [AgentSkills](https://agentskills.io) 规范。Frontmatter
  会先按 YAML 解析；如果失败，则回退到仅支持单行的
  解析器。嵌套的 `metadata` 块（包括多行 YAML 映射）
  会被展平为 JSON 字符串并重新按 JSON5 解析，因此
  [门控](#gating)下所示的块形式可以正常使用。在正文中使用 `{baseDir}` 引用
  Skills 文件夹路径。
</Note>

### 可选 frontmatter 键

<ParamField path="homepage" type="string">
  在 macOS Skills UI 中显示为 "Website" 的 URL。也支持通过
  `metadata.openclaw.homepage` 设置。
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  当为 `true` 时，Skills 会作为用户可调用的斜杠命令公开。
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  当为 `true` 时，OpenClaw 不会将该 Skills 的指令放入智能体的常规
  提示词中。当 `user-invocable` 也为 `true` 时，该 Skills 仍可作为斜杠命令使用。
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

OpenClaw 在加载时使用 `metadata.openclaw`（嵌入 frontmatter 的 JSON5 对象，
请参阅上面的解析说明）筛选 Skills。没有
`metadata.openclaw` 块的 Skills 始终符合条件，除非被明确禁用。

```markdown
---
name: image-lab
description: 通过提供商支持的图像工作流生成或编辑图像
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
  当为 `true` 时，始终包含该 Skills，并跳过所有其他门控条件。
</ParamField>

<ParamField path="emoji" type="string">
  在 macOS Skills UI 中显示的可选表情符号。
</ParamField>

<ParamField path="homepage" type="string">
  在 macOS Skills UI 中显示为 "Website" 的可选 URL。
</ParamField>

<ParamField path="os" type='("darwin" | "linux" | "win32")[]'>
  平台筛选器。设置后，Skills 仅在列出的操作系统上符合条件。
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
  macOS Skills UI 使用的可选安装程序规范（brew / node / go / uv / download）。
</ParamField>

<Note>
  当缺少 `metadata.openclaw` 时，仍接受旧版 `metadata.clawdbot` 块，
  因此较早安装的 Skills 可以保留其依赖项门控和安装程序提示。新 Skills 应使用
  `metadata.openclaw`。
</Note>

### 安装程序规范

安装程序规范用于告知 macOS Skills UI 如何安装依赖项：

```markdown
---
name: gemini
description: 使用 Gemini CLI 获取编码辅助和 Google 搜索查询。
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
              "label": "安装 Gemini CLI (brew)",
            },
          ],
      },
  }
---
```

<AccordionGroup>
  <Accordion title="安装程序选择规则">
    - 列出多个安装程序时，Gateway 网关会选择一个首选
      选项（可用时选择 brew，否则选择 node）。
    - 如果所有安装程序都是 `download`，OpenClaw 会列出每个条目，以便你
      查看所有可用工件。
    - 规范可以包含 `os: ["darwin"|"linux"|"win32"]`，以按平台筛选。
    - Node 安装遵循 `openclaw.json` 中的 `skills.install.nodeManager`
      （默认值：npm；选项：npm / pnpm / yarn / bun）。这仅影响 Skills
      安装；Gateway 网关运行时仍应使用 Node。
    - Gateway 网关安装程序优先级：Homebrew → uv → 已配置的 node 管理器 →
      go → download。
  </Accordion>
  <Accordion title="各安装程序详情">
    - **Homebrew：** OpenClaw 不会自动安装 Homebrew，也不会将 brew
      formula 转换为系统软件包命令。在没有
      `brew` 的 Linux 容器中，仅支持 brew 的安装程序会被隐藏；请使用自定义镜像或手动安装
      依赖项。
    - **Go：** OpenClaw 要求使用 Go 1.21 或更高版本来自动安装 Skills。
      如果缺少 `go` 且 Homebrew 可用，OpenClaw 会先通过
      Homebrew 安装 Go；在没有 Homebrew 的 Linux 上，如果刷新后的 `golang-go`
      候选版本达到最低版本要求，则可以改为以 root 身份或通过免密码 `sudo`
      使用 `apt-get`。依赖项实际执行的 `go install`
      始终以 OpenClaw 管理的专用 bin 目录为目标
      （全新安装时为 Homebrew 的 `bin`，否则为 `~/.local/bin`），而不是
      你配置的 `GOBIN`——系统会读取你自己的 `GOBIN`、`GOPATH` 和 `GOTOOLCHAIN`
      环境变量，但绝不会覆盖它们。
    - **下载：** `url`（必填）、`archive`（`tar.gz` | `tar.bz2` | `zip`）、
      `extract`（默认值：检测到归档文件时为 auto）、`stripComponents`、
      `targetDir`（默认值：`~/.openclaw/tools/<skillKey>`）。
  </Accordion>
  <Accordion title="沙箱隔离说明">
    `requires.bins` 会在 Skills 加载时于**宿主机**上检查。如果智能体
    在沙箱中运行，该二进制文件还必须存在于**容器内部**。
    请通过 `agents.defaults.sandbox.docker.setupCommand` 或自定义
    镜像安装它。`setupCommand` 在容器创建后运行一次，并且要求
    沙箱具有网络出口、可写的根文件系统和 root 用户。
  </Accordion>
</AccordionGroup>

## 配置覆盖

在 `~/.openclaw/openclaw.json` 的 `skills.entries` 下切换和配置内置或托管的 Skills：

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
  即使 Skills 是内置或已安装的，`false` 也会将其禁用。内置的 `coding-agent`
  Skills 需要主动启用——设置 `skills.entries.coding-agent.enabled: true`
  并确保已安装且已完成身份验证的 CLI 包括 `claude`、`codex`、`opencode`
  或其他受支持的 CLI 之一。
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  为声明了 `metadata.openclaw.primaryEnv` 的 Skills 提供的便捷字段。
  支持纯文本字符串或 SecretRef 对象。
</ParamField>

<ParamField path="env" type="Record<string, string>">
  为智能体运行注入的环境变量。仅当进程中尚未设置
  该变量时才会注入。
</ParamField>

<ParamField path="config" type="object">
  用于自定义各 Skills 配置字段的可选集合。
</ParamField>

<ParamField path="allowBundled" type="string[]">
  仅用于**内置** Skills 的可选允许列表。设置后，只有列表中的内置 Skills
  符合条件。托管 Skills 和工作区 Skills 不受影响。
</ParamField>

<Note>
  默认情况下，配置键与 **Skills 名称**匹配。如果 Skills 定义了
  `metadata.openclaw.skillKey`，请改为在 `skills.entries` 下使用该键。
  请为带连字符的名称加引号：JSON5 允许使用带引号的键。
</Note>

## 环境注入

智能体运行开始时，OpenClaw 会：

<Steps>
  <Step title="读取 Skills 元数据">
    OpenClaw 解析智能体的有效 Skills 列表，并应用门控
    规则、允许列表和配置覆盖。
  </Step>
  <Step title="注入环境变量和 API 密钥">
    `skills.entries.<key>.env` 和 `skills.entries.<key>.apiKey` 会在
    运行期间应用到 `process.env`。
  </Step>
  <Step title="构建系统提示词">
    符合条件的 Skills 会被编译成紧凑的 XML 块，并注入
    系统提示词。
  </Step>
  <Step title="恢复环境">
    运行结束后，会恢复原始环境。
  </Step>
</Steps>

<Warning>
  环境变量注入仅作用于**宿主机**上的智能体运行，而非沙箱。在
  沙箱中，`env` 和 `apiKey` 不会生效。有关如何
  将机密信息传入沙箱隔离的运行，请参阅
  [Skills 配置](/zh-CN/tools/skills-config#sandboxed-skills-and-env-vars)。
</Warning>

对于内置的 `claude-cli` 后端，OpenClaw 还会将同一份
符合条件的 Skills 快照具体化为临时 Claude Code 插件，并通过
`--plugin-dir` 传递。其他 CLI 后端仅使用提示词目录。

## 快照和刷新

OpenClaw 会在**会话开始时**创建符合条件的 Skills 快照，并在该会话
后续所有轮次中复用该列表。对 Skills 或配置的更改会在下一个新会话中
生效。

会话期间会在以下两种情况下刷新 Skills：

- Skills 监视器检测到 `SKILL.md` 发生更改。
- 新的符合条件的远程节点连接。

刷新的列表会在智能体的下一轮次中使用。如果有效的智能体
允许列表发生更改，OpenClaw 会刷新快照，使可见 Skills
保持一致。

<AccordionGroup>
  <Accordion title="Skills 监视器">
    默认情况下，OpenClaw 会监视 Skills 文件夹，并在
    `SKILL.md` 文件更改时更新快照。在 `skills.load` 下配置：

    ```json5
    {
      skills: {
        load: {
          extraDirs: ["~/Projects/agent-scripts/skills"],
          allowSymlinkTargets: ["~/Projects/manager/skills"],
          watch: true, // 默认值
          watchDebounceMs: 250, // 默认值
        },
      },
    }
    ```

    对于有意采用符号链接的布局，当 Skills
    根符号链接指向配置根目录之外时，请使用 `allowSymlinkTargets`，例如
    `<workspace>/skills/manager -> ~/Projects/manager/skills`。
    仅当 Skill Workshop 还应通过这些可信的符号链接路径应用提案时，
    才启用 `skills.workshop.allowSymlinkTargetWrites`。

  </Accordion>
  <Accordion title="远程 macOS 节点（Linux Gateway 网关）">
    如果 Gateway 网关在 Linux 上运行，但连接了一个允许
    `system.run` 的 **macOS 节点**，并且该节点上存在所需的二进制文件，
    OpenClaw 可以将仅限 macOS 的 Skills 视为符合条件。智能体应通过
    `exec` 工具并设置 `host=node` 来运行这些 Skills。

    离线节点**不会**使仅限远程的 Skills 可见。如果节点停止
    响应二进制文件探测，OpenClaw 会清除其缓存的二进制文件匹配项。

  </Accordion>
</AccordionGroup>

## 令牌影响

当存在符合条件的 Skills 时，OpenClaw 会向系统提示词中注入紧凑的 XML
块。其开销是确定性的，并按每个 Skills 线性增长：

- **基础开销**（仅当有 1 个或更多 Skills 符合条件时）：固定的介绍性
  文本块以及 `<available_skills>` 包装器。
- **每个 Skills：**约 97 个字符，加上你的 `name`、`description` 和 `location`
  字段长度。
- XML 转义会将 `& < > " '` 展开为实体，每次出现会增加几个字符。
- 按约 4 字符/令牌计算，在不计字段长度的情况下，每个 Skills 的 97 个字符 ≈ 24 个令牌。

如果渲染后的区块将超出配置的提示词预算
（`skills.limits.maxSkillsPromptChars`），OpenClaw 会先在无描述的紧凑格式可容纳范围内，尽可能保留更多技能
标识信息（名称、位置和版本）。然后使用所有剩余预算来提供缩短后的描述。如果没有
剩余的描述预算，则省略描述。每当需要使用紧凑格式或截断列表时，提示词中都会包含一条
指向 `openclaw skills check` 的说明。

请保持描述简短且表意清晰，以尽量减少提示词开销。

## 相关内容

<CardGroup cols={2}>
  <Card title="创建技能" href="/zh-CN/tools/creating-skills" icon="hammer">
    编写自定义技能的分步指南。
  </Card>
  <Card title="技能工作坊" href="/zh-CN/tools/skill-workshop" icon="flask">
    由智能体起草的技能提案队列。
  </Card>
  <Card title="Skills 配置" href="/zh-CN/tools/skills-config" icon="gear">
    完整的 `skills.*` 配置架构和智能体允许列表。
  </Card>
  <Card title="斜杠命令" href="/zh-CN/tools/slash-commands" icon="terminal">
    技能斜杠命令的注册和路由方式。
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    在公共注册表中浏览和发布技能。
  </Card>
  <Card title="插件" href="/zh-CN/tools/plugin" icon="plug">
    插件可以随其所记录的工具一起提供技能。
  </Card>
</CardGroup>
