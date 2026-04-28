---
read_when:
    - 添加或修改 Skills
    - 更改 Skills 门控、允许列表或加载规则
    - 了解技能优先级和快照行为
sidebarTitle: Skills
summary: Skills：托管模式与工作区模式、门控规则、智能体允许列表和配置接线
title: Skills
x-i18n:
    generated_at: "2026-04-28T12:06:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 847de67a57a364e74a4c0878b08b870eb17f03aac7fe98bc88e4e2d79261a698
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw 使用与 **[AgentSkills](https://agentskills.io) 兼容**的技能文件夹来教智能体如何使用工具。每个技能都是一个目录，包含带有 YAML frontmatter 和说明的 `SKILL.md`。OpenClaw 会加载内置技能以及可选的本地覆盖项，并在加载时根据环境、配置和二进制文件是否存在进行过滤。

## 位置和优先级

OpenClaw 从以下来源加载技能，**优先级从高到低**：

| #   | 来源                  | 路径                             |
| --- | --------------------- | -------------------------------- |
| 1   | 工作区技能            | `<workspace>/skills`             |
| 2   | 项目智能体技能        | `<workspace>/.agents/skills`     |
| 3   | 个人智能体技能        | `~/.agents/skills`               |
| 4   | 托管/本地技能         | `~/.openclaw/skills`             |
| 5   | 内置技能              | 随安装包提供                     |
| 6   | 额外技能文件夹        | `skills.load.extraDirs`（配置）  |

如果技能名称冲突，优先级最高的来源生效。

## 单智能体技能与共享技能

在**多智能体**设置中，每个智能体都有自己的工作区：

| 范围                  | 路径                                        | 可见范围                    |
| -------------------- | ------------------------------------------- | --------------------------- |
| 单智能体              | `<workspace>/skills`                        | 仅该智能体                  |
| 项目智能体            | `<workspace>/.agents/skills`                | 仅该工作区的智能体          |
| 个人智能体            | `~/.agents/skills`                          | 该机器上的所有智能体        |
| 共享托管/本地         | `~/.openclaw/skills`                        | 该机器上的所有智能体        |
| 共享额外目录          | `skills.load.extraDirs`（最低优先级）        | 该机器上的所有智能体        |

多个位置存在同名技能 → 优先级最高的来源生效。工作区优先于项目智能体，项目智能体优先于个人智能体，个人智能体优先于托管/本地，托管/本地优先于内置，内置优先于额外目录。

## 智能体技能允许列表

技能**位置**和技能**可见性**是两个独立控制项。位置/优先级决定同名技能的哪个副本生效；智能体允许列表决定智能体实际可以使用哪些技能。

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="Allowlist rules">
    - 默认情况下，省略 `agents.defaults.skills` 表示不限制技能。
    - 省略 `agents.list[].skills` 表示继承 `agents.defaults.skills`。
    - 设置 `agents.list[].skills: []` 表示没有技能。
    - 非空的 `agents.list[].skills` 列表是该智能体的**最终**集合——它不会与默认值合并。
    - 有效允许列表会应用于提示词构建、技能斜杠命令发现、沙箱同步和技能快照。
  </Accordion>
</AccordionGroup>

## 插件和技能

插件可以通过在 `openclaw.plugin.json` 中列出 `skills` 目录来提供自己的技能（路径相对于插件根目录）。插件启用时会加载插件技能。对于特定工具的操作指南，如果它们太长不适合放在工具描述中，但又应在插件安装后随时可用，这里就是合适的位置。例如，浏览器插件提供了一个 `browser-automation` 技能，用于多步骤浏览器控制。

插件技能目录会合并到与 `skills.load.extraDirs` 相同的低优先级路径中，因此同名的内置、托管、智能体或工作区技能会覆盖它们。你可以通过插件配置项上的 `metadata.openclaw.requires.config` 对它们进行门控。

请参阅 [插件](/zh-CN/tools/plugin) 了解发现/配置，并参阅 [工具](/zh-CN/tools) 了解这些技能所教授的工具表面。

## Skill Workshop

可选的实验性 **Skill Workshop** 插件可以根据智能体工作期间观察到的可复用流程创建或更新工作区技能。它默认禁用，必须通过 `plugins.entries.skill-workshop` 显式启用。

Skill Workshop 只写入 `<workspace>/skills`，会扫描生成的内容，支持待批准或自动安全写入，会隔离不安全的提案，并在成功写入后刷新技能快照，使新技能无需重启 Gateway 网关即可可用。

可将其用于纠正事项，例如 _“下次验证 GIF 归属”_，或来之不易的工作流，例如媒体 QA 检查清单。先从待批准开始；只有在受信任的工作区中审阅其提案后，才使用自动写入。完整指南：[Skill Workshop 插件](/zh-CN/plugins/skill-workshop)。

## ClawHub（安装和同步）

[ClawHub](https://clawhub.ai) 是 OpenClaw 的公共技能注册表。使用原生 `openclaw skills` 命令进行发现/安装/更新，或使用单独的 `clawhub` CLI 进行发布/同步工作流。完整指南：[ClawHub](/zh-CN/tools/clawhub)。

| 操作                               | 命令                                   |
| ---------------------------------- | -------------------------------------- |
| 将技能安装到工作区                 | `openclaw skills install <skill-slug>` |
| 更新所有已安装技能                 | `openclaw skills update --all`         |
| 同步（扫描 + 发布更新）            | `clawhub sync --all`                   |

原生 `openclaw skills install` 会安装到活动工作区的 `skills/` 目录。单独的 `clawhub` CLI 也会安装到当前工作目录下的 `./skills`（或回退到已配置的 OpenClaw 工作区）。OpenClaw 会在下一个会话中将其识别为 `<workspace>/skills`。

## 安全

<Warning>
将第三方技能视为**不受信任的代码**。启用前先阅读它们。对于不受信任的输入和高风险工具，优先使用沙箱隔离运行。参阅[沙箱隔离](/zh-CN/gateway/sandboxing)了解智能体侧控制项。
</Warning>

- 工作区和额外目录的技能发现只接受解析后的 realpath 仍位于已配置根目录内的技能根目录和 `SKILL.md` 文件。
- 由 Gateway 网关支持的技能依赖安装（`skills.install`、新手引导和 Skills 设置 UI）会在执行安装器元数据之前运行内置的危险代码扫描器。默认情况下，`critical` 发现会阻止执行，除非调用方显式设置危险覆盖；可疑发现仍只会发出警告。
- `openclaw skills install <slug>` 不同——它会将 ClawHub 技能文件夹下载到工作区，并且不使用上面的安装器元数据路径。
- `skills.entries.*.env` 和 `skills.entries.*.apiKey` 会为该智能体轮次将密钥注入到**主机**进程（不是沙箱）。不要把密钥放进提示词和日志。

如需更广泛的威胁模型和检查清单，请参阅[安全](/zh-CN/gateway/security)。

## SKILL.md 格式

`SKILL.md` 至少必须包含：

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw 遵循 AgentSkills 规范来处理布局/意图。嵌入式智能体使用的解析器仅支持**单行** frontmatter 键；`metadata` 应为**单行 JSON 对象**。在说明中使用 `{baseDir}` 引用技能文件夹路径。

### 可选 frontmatter 键

<ParamField path="homepage" type="string">
  在 macOS Skills UI 中显示为“网站”的 URL。也支持通过 `metadata.openclaw.homepage` 设置。
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  当为 `true` 时，该技能会作为用户斜杠命令公开。
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  当为 `true` 时，该技能会从模型提示词中排除（仍可通过用户调用使用）。
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  当设置为 `tool` 时，斜杠命令会绕过模型并直接分派到工具。
</ParamField>
<ParamField path="command-tool" type="string">
  设置 `command-dispatch: tool` 时要调用的工具名称。
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  对于工具分派，将原始参数字符串转发给工具（不进行核心解析）。工具调用时会收到 `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`。
</ParamField>

## 门控（加载时过滤器）

OpenClaw 在加载时使用 `metadata`（单行 JSON）过滤技能：

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

`metadata.openclaw` 下的字段：

<ParamField path="always" type="boolean">
  当为 `true` 时，始终包含该技能（跳过其他门控）。
</ParamField>
<ParamField path="emoji" type="string">
  macOS Skills UI 使用的可选表情符号。
</ParamField>
<ParamField path="homepage" type="string">
  在 macOS Skills UI 中显示为“网站”的可选 URL。
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  可选的平台列表。如果设置，该技能只在这些操作系统上符合条件。
</ParamField>
<ParamField path="requires.bins" type="string[]">
  每一项都必须存在于 `PATH` 上。
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  至少有一项必须存在于 `PATH` 上。
</ParamField>
<ParamField path="requires.env" type="string[]">
  环境变量必须存在，或必须在配置中提供。
</ParamField>
<ParamField path="requires.config" type="string[]">
  必须为真值的 `openclaw.json` 路径列表。
</ParamField>
<ParamField path="primaryEnv" type="string">
  与 `skills.entries.<name>.apiKey` 关联的环境变量名称。
</ParamField>
<ParamField path="install" type="object[]">
  macOS Skills UI 使用的可选安装器规范（brew/node/go/uv/download）。
</ParamField>

如果不存在 `metadata.openclaw`，则该技能始终符合条件（除非在配置中禁用，或对于内置技能被 `skills.allowBundled` 阻止）。

<Note>
当缺少 `metadata.openclaw` 时，仍会接受旧版 `metadata.clawdbot` 块，因此较旧的已安装技能可以保留其依赖门控和安装器提示。新增和更新的技能应使用 `metadata.openclaw`。
</Note>

### 沙箱注意事项

- `requires.bins` 会在技能加载时在**主机**上检查。
- 如果智能体运行在沙箱隔离环境中，该二进制文件也必须存在于**容器内**。通过 `agents.defaults.sandbox.docker.setupCommand`（或自定义镜像）安装它。`setupCommand` 会在容器创建后运行一次。包安装还需要网络出口、可写的根文件系统以及沙箱中的 root 用户。
- 示例：`summarize` 技能（`skills/summarize/SKILL.md`）需要沙箱容器中有 `summarize` CLI 才能在那里运行。

### 安装器规范

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
    - 如果列出了多个安装器，Gateway 网关会选择一个首选项（可用时选择 brew，否则选择 node）。
    - 如果所有安装器都是 `download`，OpenClaw 会列出每个条目，以便你查看可用的构件。
    - 安装器规格可以包含 `os: ["darwin"|"linux"|"win32"]`，用于按平台筛选选项。
    - Node 安装会遵循 `openclaw.json` 中的 `skills.install.nodeManager`（默认：npm；选项：npm/pnpm/yarn/bun）。这只影响 skill 安装；Gateway 网关运行时仍应使用 Node — 不建议将 Bun 用于 WhatsApp/Telegram。
    - Gateway 网关支持的安装器选择由偏好驱动：当安装规格混合多种类型时，如果启用了 `skills.install.preferBrew` 且 `brew` 存在，OpenClaw 会优先选择 Homebrew，然后是 `uv`，再然后是已配置的 node 管理器，最后才是 `go` 或 `download` 等其他回退方案。
    - 如果每个安装规格都是 `download`，OpenClaw 会展示所有下载选项，而不是折叠为一个首选安装器。

  </Accordion>
  <Accordion title="各安装器详细信息">
    - **Go 安装：**如果缺少 `go` 且 `brew` 可用，Gateway 网关会先通过 Homebrew 安装 Go，并在可能时将 `GOBIN` 设为 Homebrew 的 `bin`。
    - **下载安装：**`url`（必填）、`archive`（`tar.gz` | `tar.bz2` | `zip`）、`extract`（默认：检测到归档时自动启用）、`stripComponents`、`targetDir`（默认：`~/.openclaw/tools/<skillKey>`）。

  </Accordion>
</AccordionGroup>

## 配置覆盖

内置和托管的 skills 可以在 `~/.openclaw/openclaw.json` 中的 `skills.entries` 下切换，并提供环境值：

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
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
  `false` 会禁用该 skill，即使它是内置或已安装的。
  内置的 `coding-agent` skill 需要显式启用：先设置
  `skills.entries.coding-agent.enabled: true`，再将其暴露给 agents，
  然后确保已安装 `claude`、`codex`、`opencode` 或 `pi` 之一，
  并已为它自己的 CLI 完成身份验证。
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  供声明了 `metadata.openclaw.primaryEnv` 的 skills 使用的便捷配置。支持明文或 SecretRef。
</ParamField>
<ParamField path="env" type="Record<string, string>">
  仅当变量尚未在进程中设置时才会注入。
</ParamField>
<ParamField path="config" type="object">
  用于自定义单个 skill 字段的可选集合。自定义键必须放在这里。
</ParamField>
<ParamField path="allowBundled" type="string[]">
  仅用于**内置** skills 的可选允许列表。如果已设置，只有列表中的内置 skills 有资格使用（托管/工作区 skills 不受影响）。
</ParamField>

如果 skill 名称包含连字符，请给键加引号（JSON5 允许带引号的键）。默认情况下，配置键与 **skill 名称**匹配 — 如果某个 skill 定义了 `metadata.openclaw.skillKey`，请在 `skills.entries` 下使用该键。

<Note>
对于 OpenClaw 内部的库存图片生成/编辑，请使用核心 `image_generate` 工具和 `agents.defaults.imageGenerationModel`，而不是内置 skill。这里的 skill 示例适用于自定义或第三方工作流。对于原生图像分析，请使用 `image` 工具和 `agents.defaults.imageModel`。如果你选择 `openai/*`、`google/*`、`fal/*` 或其他提供商专属图像模型，也要添加该提供商的身份验证/API 密钥。
</Note>

## 环境注入

当 agent 运行开始时，OpenClaw 会：

1. 读取 skill 元数据。
2. 将 `skills.entries.<key>.env` 和 `skills.entries.<key>.apiKey` 应用于 `process.env`。
3. 使用**符合条件的** skills 构建系统提示词。
4. 在运行结束后恢复原始环境。

环境注入**限定在 agent 运行内**，不是全局 shell 环境。

对于内置的 `claude-cli` 后端，OpenClaw 还会将同一个符合条件的快照物化为临时 Claude Code 插件，并通过 `--plugin-dir` 传入。随后 Claude Code 可以使用其原生 skill 解析器，而 OpenClaw 仍然负责优先级、按 agent 设置的允许列表、门控，以及 `skills.entries.*` 环境/API 密钥注入。其他 CLI 后端只使用提示词目录。

## 快照和刷新

OpenClaw 会在**会话开始时**为符合条件的 skills 创建快照，并在同一会话的后续轮次中复用该列表。对 skills 或配置的更改会在下一个新会话中生效。

在两种情况下，Skills 可以在会话中途刷新：

- skills 监视器已启用。
- 出现新的符合条件的远程节点。

可以把它理解为**热重载**：刷新后的列表会在下一个 agent 轮次中被采用。如果该会话的有效 agent skill 允许列表发生变化，OpenClaw 会刷新快照，使可见 skills 与当前 agent 保持一致。

### Skills 监视器

默认情况下，OpenClaw 会监视 skill 文件夹，并在 `SKILL.md` 文件变化时提升 skills 快照版本。在 `skills.load` 下配置：

```json5
{
  skills: {
    load: {
      watch: true,
      watchDebounceMs: 250,
    },
  },
}
```

### 远程 macOS 节点（Linux Gateway 网关）

如果 Gateway 网关在 Linux 上运行，但连接了一个允许 `system.run` 的 **macOS 节点**（Exec 审批安全未设置为 `deny`），当所需二进制文件存在于该节点上时，OpenClaw 可以将仅限 macOS 的 skills 视为符合条件。agent 应通过 `exec` 工具并设置 `host=node` 来执行这些 skills。

这依赖于节点报告其命令支持情况，并通过 `system.which` 或 `system.run` 进行 bin 探测。离线节点**不会**让仅远程可用的 skills 变为可见。如果已连接节点停止响应 bin 探测，OpenClaw 会清除其缓存的 bin 匹配项，使 agents 不再看到当前无法在那里运行的 skills。

## Token 影响

当 skills 符合条件时，OpenClaw 会将可用 skills 的紧凑 XML 列表注入系统提示词（通过 `pi-coding-agent` 中的 `formatSkillsForPrompt`）。成本是确定性的：

- **基础开销**（仅当 ≥1 个 skill 时）：195 个字符。
- **每个 skill：**97 个字符 + XML 转义后的 `<name>`、`<description>` 和 `<location>` 值的长度。

公式（字符）：

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

XML 转义会将 `& < > " '` 展开为实体（`&amp;`、`&lt;` 等），从而增加长度。Token 数会因模型分词器而异。一个粗略的 OpenAI 风格估算是约 4 字符/token，因此每个 skill **97 个字符 ≈ 24 tokens**，再加上你的实际字段长度。

## 托管 skills 生命周期

OpenClaw 会随安装包（npm package 或 OpenClaw.app）提供一组基线 skills，作为**内置 skills**。`~/.openclaw/skills` 用于本地覆盖 — 例如，在不更改内置副本的情况下固定或修补某个 skill。工作区 skills 归用户所有，并会在名称冲突时覆盖两者。

## 想找更多 skills？

浏览 [https://clawhub.ai](https://clawhub.ai)。完整配置架构：[Skills 配置](/zh-CN/tools/skills-config)。

## 相关内容

- [ClawHub](/zh-CN/tools/clawhub) — 公共 skills 注册表
- [创建 skills](/zh-CN/tools/creating-skills) — 构建自定义 skills
- [插件](/zh-CN/tools/plugin) — 插件系统概览
- [Skill Workshop 插件](/zh-CN/plugins/skill-workshop) — 从 agent 工作生成 skills
- [Skills 配置](/zh-CN/tools/skills-config) — skill 配置参考
- [斜杠命令](/zh-CN/tools/slash-commands) — 所有可用的斜杠命令
