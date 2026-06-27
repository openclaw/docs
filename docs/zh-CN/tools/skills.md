---
read_when:
    - 添加或修改 Skills
    - 更改技能门控、允许列表或加载规则
    - 理解 Skills 优先级和快照行为
sidebarTitle: Skills
summary: Skills 教你的智能体如何使用工具。了解它们如何加载、优先级如何生效，以及如何配置门控、允许列表和环境注入。
title: Skills
x-i18n:
    generated_at: "2026-06-27T03:32:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e42d89d47125a4d92f68a20d754de571d5582858a9c44618b999a27335e78ab2
    source_path: tools/skills.md
    workflow: 16
---

Skills 是 Markdown 指令文件，用来教智能体如何以及何时使用工具。每个 skill 都位于一个目录中，该目录包含一个带有 YAML frontmatter 和 Markdown 正文的 `SKILL.md` 文件。OpenClaw 会加载内置 Skills 以及任何本地覆盖项，并在加载时根据环境、配置和二进制文件是否存在进行过滤。

<CardGroup cols={2}>
  <Card title="创建技能" href="/zh-CN/tools/creating-skills" icon="hammer">
    从零开始构建并测试自定义 skill。
  </Card>
  <Card title="技能工作坊" href="/zh-CN/tools/skill-workshop" icon="flask">
    审阅并批准智能体起草的 skill 提案。
  </Card>
  <Card title="Skills 配置" href="/zh-CN/tools/skills-config" icon="gear">
    完整的 `skills.*` 配置 schema 和智能体允许列表。
  </Card>
  <Card title="ClawHub" href="/zh-CN/clawhub" icon="cloud">
    浏览并安装社区 Skills。
  </Card>
</CardGroup>

## 加载顺序

OpenClaw 会从以下来源加载，**优先级从高到低**。当同一个 skill 名称出现在多个位置时，优先级最高的来源生效。

| 优先级 | 来源 | 路径 |
| ----------- | ---------------------- | --------------------------------------- |
| 1 — 最高 | 工作区 Skills | `<workspace>/skills` |
| 2 | 项目智能体 Skills | `<workspace>/.agents/skills` |
| 3 | 个人智能体 Skills | `~/.agents/skills` |
| 4 | 托管 / 本地 Skills | `~/.openclaw/skills` |
| 5 | 内置 Skills | 随安装一起提供 |
| 6 — 最低 | 额外目录 | `skills.load.extraDirs` + 插件 Skills |

Skill 根目录支持分组布局。只要 `SKILL.md` 出现在已配置根目录下的任意位置，OpenClaw 就会发现一个 skill：

```text
<workspace>/skills/research/SKILL.md          ✓ found as "research"
<workspace>/skills/personal/research/SKILL.md ✓ also found as "research"
```

文件夹路径仅用于组织。skill 的名称、斜杠命令和允许列表键都来自 `name` frontmatter 字段（如果缺少 `name`，则来自目录名）。

<Note>
  Codex CLI 的原生 `$CODEX_HOME/skills` 目录**不是** OpenClaw skill 根目录。使用 `openclaw migrate plan codex` 清点这些 Skills，然后使用 `openclaw migrate codex` 将它们复制到你的 OpenClaw 工作区。
</Note>

## 按智能体 Skills 与共享 Skills

在多智能体设置中，每个智能体都有自己的工作区。请使用与你期望可见性匹配的路径：

| 范围 | 路径 | 对谁可见 |
| -------------- | ---------------------------- | --------------------------- |
| 按智能体 | `<workspace>/skills` | 仅该智能体 |
| 项目智能体 | `<workspace>/.agents/skills` | 仅该工作区的智能体 |
| 个人智能体 | `~/.agents/skills` | 此机器上的所有智能体 |
| 共享托管 | `~/.openclaw/skills` | 此机器上的所有智能体 |
| 额外目录 | `skills.load.extraDirs` | 此机器上的所有智能体 |

## 智能体允许列表

skill **位置**（优先级）和 skill **可见性**（哪个智能体可以使用它）是两个独立控制项。使用允许列表限制智能体可以看到哪些 Skills，无论它们从哪里加载。

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // shared baseline
    },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults entirely
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="允许列表规则">
    - 省略 `agents.defaults.skills`，默认不限制所有 Skills。
    - 省略 `agents.list[].skills`，继承 `agents.defaults.skills`。
    - 设置 `agents.list[].skills: []`，不向该智能体暴露任何 Skills。
    - 非空的 `agents.list[].skills` 列表就是**最终**集合，它不会与默认值合并。
    - 有效允许列表会应用于提示词构建、斜杠命令发现、沙箱同步和 skill 快照。
  </Accordion>
</AccordionGroup>

## 插件与 Skills

插件可以通过在 `openclaw.plugin.json` 中列出 `skills` 目录来附带自己的 Skills（路径相对于插件根目录）。插件启用时会加载插件 Skills，例如，浏览器插件会附带一个用于多步骤浏览器控制的 `browser-automation` skill。

插件 skill 目录与 `skills.load.extraDirs` 在同一个低优先级层级合并，因此同名的内置、托管、智能体或工作区 skill 会覆盖它们。通过插件配置条目上的 `metadata.openclaw.requires.config` 对其进行门控。

完整插件系统请参阅 [插件](/zh-CN/tools/plugin) 和 [工具](/zh-CN/tools)。

## 技能工作坊

[技能工作坊](/zh-CN/tools/skill-workshop) 是智能体与你的活跃 skill 文件之间的提案队列。当智能体发现可复用的工作时，它会起草提案，而不是直接写入 `SKILL.md`。你在任何内容变更前进行审阅并批准。

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

完整生命周期、CLI 参考和配置请参阅 [技能工作坊](/zh-CN/tools/skill-workshop)。

## 从 ClawHub 安装

[ClawHub](https://clawhub.ai) 是公共 Skills 注册表。使用 `openclaw skills` 命令安装和更新，或使用 `clawhub` CLI 发布和同步。

| 操作 | 命令 |
| ---------------------------------- | ------------------------------------------------------ |
| 将 skill 安装到工作区 | `openclaw skills install @owner/<slug>` |
| 从 Git 仓库安装 | `openclaw skills install git:owner/repo@ref` |
| 安装本地 skill 目录 | `openclaw skills install ./path/to/skill --as my-tool` |
| 为所有本地智能体安装 | `openclaw skills install @owner/<slug> --global` |
| 更新所有工作区 Skills | `openclaw skills update --all` |
| 更新共享托管 skill | `openclaw skills update @owner/<slug> --global` |
| 更新所有共享托管 Skills | `openclaw skills update --all --global` |
| 验证 skill 的信任封套 | `openclaw skills verify @owner/<slug>` |
| 打印生成的 Skill Card | `openclaw skills verify @owner/<slug> --card` |
| 通过 ClawHub CLI 发布 / 同步 | `clawhub sync --all` |

<AccordionGroup>
  <Accordion title="安装详情">
    `openclaw skills install` 默认安装到活跃工作区的 `skills/` 目录。添加 `--global` 会安装到共享的 `~/.openclaw/skills` 目录，除非智能体允许列表进一步收窄，否则所有本地智能体都可见。

    Git 和本地安装要求源根目录中有 `SKILL.md`。slug 会在有效时来自 `SKILL.md` frontmatter 的 `name`，然后回退到目录或仓库名称。使用 `--as <slug>` 覆盖。`openclaw skills update` 只跟踪 ClawHub 安装项；要刷新 Git 或本地来源，请重新安装它们。

  </Accordion>
  <Accordion title="验证和安全扫描">
    `openclaw skills verify @owner/<slug>` 会向 ClawHub 请求该 skill 的 `clawhub.skill.verify.v1` 信任封套。已安装的 ClawHub Skills 会根据 `.clawhub/origin.json` 中记录的版本和注册表进行验证。裸 slug 仍可用于已安装或无歧义的现有 Skills，但带 owner 的引用可以避免发布者歧义。

    ClawHub skill 页面会在安装前公开最新安全扫描状态，并为 VirusTotal、ClawScan 和静态分析提供详情页面。当 ClawHub 将验证标记为失败时，该命令会以非零状态退出。发布者可通过 ClawHub 仪表盘或 `clawhub skill rescan @owner/<slug>` 处理误报。

  </Accordion>
  <Accordion title="私有归档安装">
    需要非 ClawHub 交付的 Gateway 网关客户端可以通过 `skills.upload.begin`、`skills.upload.chunk` 和 `skills.upload.commit` 暂存 zip skill 归档，然后用 `skills.install({ source: "upload", ... })` 安装。此路径默认关闭，并且需要在 `openclaw.json` 中设置 `skills.install.allowUploadedArchives: true`。普通 ClawHub 安装绝不需要该设置。
  </Accordion>
</AccordionGroup>

## 安全

<Warning>
  将第三方 Skills 视为**不受信任的代码**。启用前请先阅读。对于不受信任的输入和高风险工具，优先使用沙箱隔离运行。有关智能体侧控制项，请参阅[沙箱隔离](/zh-CN/gateway/sandboxing)。
</Warning>

<AccordionGroup>
  <Accordion title="路径包含">
    工作区、项目智能体和额外目录的 skill 发现只接受解析后的 realpath 仍位于已配置根目录内的 skill 根目录，除非 `skills.load.allowSymlinkTargets` 显式信任目标根目录。只有启用 `skills.workshop.allowSymlinkTargetWrites` 时，技能工作坊才会通过这些受信任目标写入。
    托管的 `~/.openclaw/skills` 和个人 `~/.agents/skills` 可以包含符号链接的 skill 文件夹，但每个 `SKILL.md` 的 realpath 仍必须位于其解析后的 skill 目录内。
  </Accordion>
  <Accordion title="操作员安装策略">
    配置 `security.installPolicy`，以便在 skill 安装继续之前运行受信任的本地策略命令。该策略会接收元数据和暂存源路径，适用于 ClawHub、上传、Git、本地、更新和依赖安装器路径，并在命令无法返回有效决策时失败关闭。
  </Accordion>
  <Accordion title="密钥注入范围">
    `skills.entries.*.env` 和 `skills.entries.*.apiKey` 只会在该智能体轮次中将密钥注入**宿主**进程，而不是注入沙箱。不要将密钥放入提示词和日志。
  </Accordion>
</AccordionGroup>

更广泛的威胁模型和安全检查清单请参阅[安全](/zh-CN/gateway/security)。

## `SKILL.md` 格式

每个 skill 至少需要在 frontmatter 中包含 `name` 和 `description`：

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---

When the user asks to generate an image, use the `image_generate` tool...
```

<Note>
  OpenClaw 遵循 [AgentSkills](https://agentskills.io) 规范。frontmatter 解析器仅支持**单行键**，`metadata` 必须是单行 JSON 对象。使用正文中的 `{baseDir}` 引用 skill 文件夹路径。
</Note>

### 可选 frontmatter 键

<ParamField path="homepage" type="string">
  在 macOS Skills UI 中显示为“网站”的 URL。也支持通过 `metadata.openclaw.homepage` 设置。
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  当为 `true` 时，该 skill 会作为用户可调用的斜杠命令暴露。
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  当为 `true` 时，OpenClaw 会将该 skill 的指令排除在智能体的常规提示词之外。当 `user-invocable` 也为 `true` 时，该 skill 仍可作为斜杠命令使用。
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  设置为 `tool` 时，斜杠命令会绕过模型，并直接分派到已注册的工具。
</ParamField>

<ParamField path="command-tool" type="string">
  设置 `command-dispatch: tool` 时要调用的工具名称。
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  对于工具分派，会将原始参数字符串转发给工具，不进行核心解析。工具会收到 `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`。
</ParamField>

## 门控

OpenClaw 在加载时使用 `metadata.openclaw`（frontmatter 中的单行
JSON）筛选 Skills。没有 `metadata.openclaw` 块的 skill 始终符合条件，
除非被显式禁用。

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
  当为 `true` 时，始终包含该 skill，并跳过所有其他门控。
</ParamField>

<ParamField path="emoji" type="string">
  在 macOS Skills UI 中显示的可选 emoji。
</ParamField>

<ParamField path="homepage" type="string">
  在 macOS Skills UI 中显示为 “Website” 的可选 URL。
</ParamField>

<ParamField path="os" type='"darwin" | "linux" | "win32"'>
  平台筛选器。设置后，该 skill 仅在列出的 OS 上符合条件。
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
  每个 `openclaw.json` 路径都必须为真值。
</ParamField>

<ParamField path="primaryEnv" type="string">
  与 `skills.entries.<name>.apiKey` 关联的环境变量名称。
</ParamField>

<ParamField path="install" type="object[]">
  macOS Skills UI 使用的可选安装器规范（brew / node / go / uv / download）。
</ParamField>

<Note>
  当 `metadata.openclaw` 不存在时，旧版 `metadata.clawdbot` 块仍会被接受，
  因此较早安装的 Skills 会保留其依赖门控和安装器提示。新的 Skills 应使用
  `metadata.openclaw`。
</Note>

### 安装器规范

安装器规范会告诉 macOS Skills UI 如何安装依赖：

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
  <Accordion title="Installer selection rules">
    - 列出多个安装器时，Gateway 网关会选择一个首选选项
      （可用时使用 brew，否则使用 node）。
    - 如果所有安装器都是 `download`，OpenClaw 会列出每个条目，以便你查看
      所有可用工件。
    - 规范可以包含 `os: ["darwin"|"linux"|"win32"]`，用于按平台筛选。
    - Node 安装会遵循 `openclaw.json` 中的 `skills.install.nodeManager`
      （默认：npm；选项：npm / pnpm / yarn / bun）。这仅影响 skill
      安装；Gateway 网关运行时仍应使用 Node。
    - Gateway 网关安装器偏好：Homebrew → uv → 已配置的 node manager →
      go → download。
  </Accordion>
  <Accordion title="Per-installer details">
    - **Homebrew：** OpenClaw 不会自动安装 Homebrew，也不会将 brew
      formula 转换为系统包命令。在没有 `brew` 的 Linux 容器中，
      仅支持 brew 的安装器会被隐藏；请使用自定义镜像或手动安装依赖。
    - **Go：** 如果缺少 `go` 且 `brew` 可用，Gateway 网关会先通过
      Homebrew 安装 Go，并将 `GOBIN` 设置为 Homebrew 的 `bin`。
    - **Download：** `url`（必需）、`archive`（`tar.gz` | `tar.bz2` | `zip`）、
      `extract`（默认：检测到归档时自动）、`stripComponents`、
      `targetDir`（默认：`~/.openclaw/tools/<skillKey>`）。
  </Accordion>
  <Accordion title="Sandboxing notes">
    `requires.bins` 会在 skill 加载时于**宿主机**上检查。如果智能体
    在沙箱中运行，该二进制文件也必须存在于**容器内**。
    请通过 `agents.defaults.sandbox.docker.setupCommand` 或自定义
    镜像安装它。`setupCommand` 会在容器创建后运行一次，并要求
    沙箱中具备网络出口、可写根 FS 和 root 用户。
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
  即使 skill 是内置或已安装的，`false` 也会禁用它。`coding-agent`
  内置 skill 是选择启用的：设置 `skills.entries.coding-agent.enabled: true`，
  并确保已安装且已认证 `claude`、`codex`、`opencode` 或其他受支持的 CLI
  之一。
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  为声明 `metadata.openclaw.primaryEnv` 的 Skills 提供的便捷字段。
  支持明文字符串或 SecretRef 对象。
</ParamField>

<ParamField path="env" type="Record<string, string>">
  为智能体运行注入的环境变量。仅当该变量尚未在进程中设置时才会注入。
</ParamField>

<ParamField path="config" type="object">
  用于自定义每个 skill 配置字段的可选包。
</ParamField>

<ParamField path="allowBundled" type="string[]">
  仅用于**内置** Skills 的可选允许列表。设置后，只有列表中的内置 Skills
  符合条件。托管 Skills 和工作区 Skills 不受影响。
</ParamField>

<Note>
  默认情况下，配置键与 **skill 名称**匹配。如果某个 skill 定义了
  `metadata.openclaw.skillKey`，请在 `skills.entries` 下使用该键。
  为带连字符的名称加引号：JSON5 允许加引号的键。
</Note>

## 环境注入

当智能体运行开始时，OpenClaw 会：

<Steps>
  <Step title="Reads skill metadata">
    OpenClaw 会解析该智能体的有效 skill 列表，并应用门控规则、允许列表和配置覆盖。
  </Step>
  <Step title="Injects env and API keys">
    `skills.entries.<key>.env` 和 `skills.entries.<key>.apiKey` 会在运行期间应用到
    `process.env`。
  </Step>
  <Step title="Builds the system prompt">
    符合条件的 Skills 会被编译成紧凑的 XML 块，并注入到系统提示中。
  </Step>
  <Step title="Restores the environment">
    运行结束后，会恢复原始环境。
  </Step>
</Steps>

<Warning>
  环境注入的作用域是**宿主机**智能体运行，而不是沙箱。在沙箱内，
  `env` 和 `apiKey` 不会生效。请参阅
  [Skills 配置](/zh-CN/tools/skills-config#sandboxed-skills-and-env-vars)，了解如何
  将密钥传入沙箱隔离的运行。
</Warning>

对于内置的 `claude-cli` 后端，OpenClaw 还会将同一个符合条件的 skill
快照物化为临时 Claude Code 插件，并通过 `--plugin-dir` 传入。
其他 CLI 后端仅使用提示目录。

## 快照和刷新

OpenClaw 会在**会话开始时**为符合条件的 Skills 创建快照，并在该会话的所有后续轮次中复用该列表。对 Skills 或配置的更改会在下一次新会话中生效。

会话中途会在两种情况下刷新 Skills：

- Skills watcher 检测到 `SKILL.md` 更改。
- 新的符合条件的远程节点连接。

刷新后的列表会在下一次智能体轮次中使用。如果有效的智能体允许列表发生变化，
OpenClaw 会刷新快照，以保持可见 Skills 对齐。

<AccordionGroup>
  <Accordion title="Skills watcher">
    默认情况下，OpenClaw 会监视 skill 文件夹，并在 `SKILL.md`
    文件更改时递增快照。在 `skills.load` 下配置：

    ```json5
    {
      skills: {
        load: {
          extraDirs: ["~/Projects/agent-scripts/skills"],
          allowSymlinkTargets: ["~/Projects/manager/skills"],
          watch: true,
          watchDebounceMs: 250,
        },
      },
    }
    ```

    对于有意使用符号链接的布局，如果 skill 根符号链接指向配置根目录之外，
    例如 `<workspace>/skills/manager -> ~/Projects/manager/skills`，
    请使用 `allowSymlinkTargets`。只有当 Skill Workshop 也应通过这些受信任的
    符号链接路径应用提案时，才启用 `skills.workshop.allowSymlinkTargetWrites`。

  </Accordion>
  <Accordion title="Remote macOS nodes (Linux gateway)">
    如果 Gateway 网关在 Linux 上运行，但连接了一个允许 `system.run` 的
    **macOS 节点**，且所需二进制文件存在于该节点上，OpenClaw 可以将仅适用于
    macOS 的 Skills 视为符合条件。智能体应通过 `exec` 工具并使用 `host=node`
    来运行这些 Skills。

    离线节点**不会**使仅远程可用的 Skills 可见。如果某个节点停止响应
    bin 探测，OpenClaw 会清除其缓存的 bin 匹配项。

  </Accordion>
</AccordionGroup>

## Token 影响

当 Skills 符合条件时，OpenClaw 会将紧凑的 XML 块注入系统提示。
成本是确定性的：

```text
total = 195 + Σ (97 + len(name) + len(description) + len(filepath))
```

- **基础开销**（仅当 ≥ 1 个 skill 时）：约 195 个字符
- **每个 skill：** 约 97 个字符 + 你的 `name`、`description` 和 `location` 字段长度
- XML 转义会将 `& < > " '` 扩展为实体，每次出现会增加少量字符
- 按约 4 字符/token 计算，字段长度之前，97 个字符约等于每个 skill 24 个 token

保持描述简短且有说明性，以尽量减少提示开销。

## 相关内容

<CardGroup cols={2}>
  <Card title="Creating skills" href="/zh-CN/tools/creating-skills" icon="hammer">
    编写自定义 skill 的分步指南。
  </Card>
  <Card title="Skill Workshop" href="/zh-CN/tools/skill-workshop" icon="flask">
    用于智能体起草 Skills 的提案队列。
  </Card>
  <Card title="Skills config" href="/zh-CN/tools/skills-config" icon="gear">
    完整的 `skills.*` 配置 schema 和智能体允许列表。
  </Card>
  <Card title="Slash commands" href="/zh-CN/tools/slash-commands" icon="terminal">
    skill 斜杠命令如何注册和路由。
  </Card>
  <Card title="ClawHub" href="/zh-CN/clawhub" icon="cloud">
    在公共注册表中浏览和发布 Skills。
  </Card>
  <Card title="Plugins" href="/zh-CN/tools/plugin" icon="plug">
    插件可以随它们所记录的工具一起提供 Skills。
  </Card>
</CardGroup>
