---
read_when:
    - 添加或修改 Skills
    - 更改 Skills 的门控、允许列表或加载规则
    - 理解 Skills 的优先级和快照行为
sidebarTitle: Skills
summary: Skills：托管型与工作区型、门控规则、智能体允许列表，以及配置接线
title: Skills
x-i18n:
    generated_at: "2026-04-26T05:49:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 19fd880e88051db9d4d9090a64123a2dc5a16a6211fa46879ddecaa86f25149c
    source_path: tools/skills.md
    workflow: 15
---

OpenClaw 使用与 **[AgentSkills](https://agentskills.io)** 兼容的 skill
文件夹来教会智能体如何使用工具。每个 skill 都是一个目录，
其中包含带有 YAML frontmatter 和说明的 `SKILL.md`。OpenClaw
会加载内置 skills 以及可选的本地覆盖项，并在加载时根据环境、
配置和二进制文件是否存在进行过滤。

## 位置和优先级

OpenClaw 会从以下来源加载 skills，**优先级从高到低**：

| #   | 来源                 | 路径                             |
| --- | -------------------- | -------------------------------- |
| 1   | 工作区 skills        | `<workspace>/skills`             |
| 2   | 项目智能体 skills    | `<workspace>/.agents/skills`     |
| 3   | 个人智能体 skills    | `~/.agents/skills`               |
| 4   | 托管/本地 skills     | `~/.openclaw/skills`             |
| 5   | 内置 skills          | 随安装一起提供                   |
| 6   | 额外 skill 文件夹    | `skills.load.extraDirs`（配置）  |

如果 skill 名称冲突，则优先级最高的来源胜出。

## 每个智能体独享的 skills 与共享 skills

在**多智能体**设置中，每个智能体都有自己的工作区：

| 范围                 | 路径                                        | 对谁可见                    |
| -------------------- | ------------------------------------------- | --------------------------- |
| 每个智能体独享       | `<workspace>/skills`                        | 仅该智能体                  |
| 项目智能体           | `<workspace>/.agents/skills`                | 仅该工作区的智能体          |
| 个人智能体           | `~/.agents/skills`                          | 该机器上的所有智能体        |
| 共享托管/本地        | `~/.openclaw/skills`                        | 该机器上的所有智能体        |
| 共享额外目录         | `skills.load.extraDirs`（最低优先级）       | 该机器上的所有智能体        |

同名出现在多个位置时 → 优先级最高的来源胜出。工作区高于
项目智能体，高于个人智能体，高于托管/本地，高于内置，
高于额外目录。

## 智能体 skill 允许列表

Skill **位置** 和 skill **可见性** 是两种独立控制。
位置/优先级决定同名 skill 的哪个副本胜出；智能体允许列表则决定
某个智能体实际可以使用哪些 skills。

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // 继承 github、weather
      { id: "docs", skills: ["docs-search"] }, // 替换 defaults
      { id: "locked-down", skills: [] }, // 无 skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="允许列表规则">
    - 省略 `agents.defaults.skills` 表示默认不限制 skills。
    - 省略 `agents.list[].skills` 表示继承 `agents.defaults.skills`。
    - 设置 `agents.list[].skills: []` 表示没有 skills。
    - 非空的 `agents.list[].skills` 列表是该智能体的**最终**集合——不会与 defaults 合并。
    - 生效后的允许列表会同时应用于 prompt 构建、skill
      斜杠命令发现、沙箱同步，以及 skill 快照。
  </Accordion>
</AccordionGroup>

## 插件和 skills

插件可以通过在 `openclaw.plugin.json` 中列出 `skills` 目录
（路径相对于插件根目录）来附带自己的 skills。插件 skills 会在
插件启用时加载。对于那些过长、不适合放进工具描述里，但又应该在
插件安装后始终可用的工具专用操作指南，这是正确的放置位置——
例如，浏览器插件附带了一个 `browser-automation` skill，
用于多步骤浏览器控制。

插件 skill 目录会合并到与 `skills.load.extraDirs` 相同的
低优先级路径中，因此同名的内置、托管、智能体或工作区 skill
会覆盖它们。你可以通过插件配置项上的
`metadata.openclaw.requires.config` 来对其进行门控。

有关发现/配置，请参见 [Plugins](/zh-CN/tools/plugin)；有关这些 skills
所教授的工具表面，请参见 [Tools](/zh-CN/tools)。

## Skill Workshop

可选的实验性 **Skill Workshop** 插件可以根据智能体工作过程中
观察到的可复用流程，创建或更新工作区 skills。它默认禁用，
必须通过 `plugins.entries.skill-workshop` 显式启用。

Skill Workshop 只会写入 `<workspace>/skills`，会扫描生成内容，
支持“待批准”或“自动安全写入”，会隔离不安全提案，并且在成功写入后
刷新 skill 快照，这样无需重启 Gateway 网关 就能让新 skill 生效。

可将它用于诸如 _“下次请核实 GIF 署名”_ 这样的修正，或媒体 QA
检查清单之类来之不易的工作流。建议先从待批准模式开始；
只有在受信任的工作区中并且审查过其提案后，才使用自动写入。
完整指南见：[Skill Workshop plugin](/zh-CN/plugins/skill-workshop)。

## ClawHub（安装和同步）

[ClawHub](https://clawhub.ai) 是 OpenClaw 的公共 skills 注册表。
可使用原生 `openclaw skills` 命令进行发现/安装/更新，
也可使用单独的 `clawhub` CLI 进行发布/同步工作流。
完整指南：[ClawHub](/zh-CN/tools/clawhub)。

| 操作                 | 命令                                   |
| ---------------------------------- | -------------------------------------- |
| 将 skill 安装到工作区              | `openclaw skills install <skill-slug>` |
| 更新所有已安装 skills              | `openclaw skills update --all`         |
| 同步（扫描 + 发布更新）            | `clawhub sync --all`                   |

原生 `openclaw skills install` 会安装到当前工作区的
`skills/` 目录。单独的 `clawhub` CLI 也会安装到当前工作目录下的
`./skills`（或者回退到已配置的 OpenClaw 工作区）。OpenClaw 会在
下一次会话时将其作为 `<workspace>/skills` 读取。

## 安全

<Warning>
请将第三方 skills 视为**不受信任的代码**。启用前请先阅读。
对于不受信任的输入和高风险工具，优先使用沙箱隔离运行。参见
[Sandboxing](/zh-CN/gateway/sandboxing) 了解智能体侧控制。
</Warning>

- 工作区和额外目录的 skill 发现仅接受其解析后 realpath 仍位于已配置根目录内的 skill 根目录和 `SKILL.md` 文件。
- 由 Gateway 网关 支持的 skill 依赖安装（`skills.install`、新手引导，以及 Skills 设置 UI）在执行安装器元数据前，会运行内置危险代码扫描器。默认情况下，`critical` 发现会阻止执行，除非调用方显式设置危险覆盖；可疑发现仍然仅发出警告。
- `openclaw skills install <slug>` 不同——它会将 ClawHub skill 文件夹下载到工作区，不使用上面的安装器元数据路径。
- `skills.entries.*.env` 和 `skills.entries.*.apiKey` 会将密钥注入该智能体回合的**宿主机**进程（而不是沙箱）。请避免将密钥放入 prompts 和日志中。

如需更广泛的威胁模型和检查清单，请参见 [Security](/zh-CN/gateway/security)。

## `SKILL.md` 格式

`SKILL.md` 至少必须包含：

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw 遵循 AgentSkills 规范的布局/意图。嵌入式智能体使用的解析器
仅支持**单行** frontmatter 键；`metadata` 应为**单行 JSON 对象**。
在说明中可使用 `{baseDir}` 引用 skill 文件夹路径。

### 可选的 frontmatter 键

<ParamField path="homepage" type="string">
  作为“Website”显示在 macOS Skills UI 中的 URL。也支持通过 `metadata.openclaw.homepage` 提供。
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  当为 `true` 时，该 skill 会作为用户斜杠命令公开。
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  当为 `true` 时，该 skill 会从模型 prompt 中排除（但仍可通过用户调用使用）。
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  当设置为 `tool` 时，斜杠命令会绕过模型并直接分发到工具。
</ParamField>
<ParamField path="command-tool" type="string">
  当设置了 `command-dispatch: tool` 时要调用的工具名称。
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  对于工具分发，会将原始参数字符串直接转发给工具（不经过核心解析）。调用工具时会使用 `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`。
</ParamField>

## 门控（加载时过滤器）

OpenClaw 会在加载时使用 `metadata`（单行 JSON）来过滤 skills：

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
  当为 `true` 时，始终包含该 skill（跳过其他门控）。
</ParamField>
<ParamField path="emoji" type="string">
  macOS Skills UI 使用的可选 emoji。
</ParamField>
<ParamField path="homepage" type="string">
  在 macOS Skills UI 中作为“Website”显示的可选 URL。
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  可选的平台列表。如果设置，则该 skill 仅在这些 OS 上符合条件。
</ParamField>
<ParamField path="requires.bins" type="string[]">
  每一个都必须存在于 `PATH` 中。
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  至少有一个必须存在于 `PATH` 中。
</ParamField>
<ParamField path="requires.env" type="string[]">
  环境变量必须存在，或可通过配置提供。
</ParamField>
<ParamField path="requires.config" type="string[]">
  必须为 truthy 的 `openclaw.json` 路径列表。
</ParamField>
<ParamField path="primaryEnv" type="string">
  与 `skills.entries.<name>.apiKey` 关联的环境变量名称。
</ParamField>
<ParamField path="install" type="object[]">
  macOS Skills UI 使用的可选安装器规范（brew/node/go/uv/download）。
</ParamField>

如果不存在 `metadata.openclaw`，则该 skill 默认始终符合条件（除非
它在配置中被禁用，或者内置 skill 被 `skills.allowBundled`
阻止）。

<Note>
当 `metadata.openclaw` 不存在时，仍然接受旧版
`metadata.clawdbot` 块，因此较早安装的 skills 仍可保留其
依赖门控和安装器提示。新的和更新后的 skills 应使用
`metadata.openclaw`。
</Note>

### 沙箱隔离说明

- `requires.bins` 会在 skill 加载时于**宿主机**上检查。
- 如果某个智能体处于沙箱隔离中，那么该二进制文件也必须存在于**容器内部**。请通过 `agents.defaults.sandbox.docker.setupCommand`（或自定义镜像）安装它。`setupCommand` 会在容器创建后运行一次。安装软件包还需要网络出口、可写的根文件系统，以及沙箱中的 root 用户。
- 示例：`summarize` skill（`skills/summarize/SKILL.md`）在沙箱容器中运行时，需要容器内存在 `summarize` CLI。

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
    - 如果列出了多个安装器，Gateway 网关 会选择一个首选项（可用时优先 brew，否则为 node）。
    - 如果所有安装器都是 `download`，OpenClaw 会列出每个条目，以便你查看可用的制品。
    - 安装器规范可包含 `os: ["darwin"|"linux"|"win32"]`，用于按平台筛选选项。
    - Node 安装会遵循 `openclaw.json` 中的 `skills.install.nodeManager`（默认：npm；可选：npm/pnpm/yarn/bun）。这只影响 skill 安装；Gateway 网关 运行时仍应使用 Node —— 不建议 WhatsApp/Telegram 使用 Bun。
    - Gateway 网关 支持的安装器选择是基于偏好驱动的：当安装规范混合多种类型时，如果启用了 `skills.install.preferBrew` 且存在 `brew`，OpenClaw 会优先选择 Homebrew，然后是 `uv`，再然后是已配置的 node manager，最后才是 `go` 或 `download` 等其他回退选项。
    - 如果每个安装规范都是 `download`，OpenClaw 会展示所有下载选项，而不是折叠为一个首选安装器。

  </Accordion>
  <Accordion title="每种安装器的细节">
    - **Go 安装：** 如果缺少 `go` 但可用 `brew`，Gateway 网关 会先通过 Homebrew 安装 Go，并尽可能将 `GOBIN` 设置为 Homebrew 的 `bin`。
    - **下载安装：** `url`（必填）、`archive`（`tar.gz` | `tar.bz2` | `zip`）、`extract`（默认：检测到归档文件时自动）、`stripComponents`、`targetDir`（默认：`~/.openclaw/tools/<skillKey>`）。

  </Accordion>
</AccordionGroup>

## 配置覆盖

内置和托管 skills 可以在 `~/.openclaw/openclaw.json` 的
`skills.entries` 下进行开关控制，并提供环境变量值：

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // 或纯文本字符串
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
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  为声明了 `metadata.openclaw.primaryEnv` 的 skills 提供便捷配置。支持纯文本或 SecretRef。
</ParamField>
<ParamField path="env" type="Record<string, string>">
  仅当该变量尚未在进程中设置时才会注入。
</ParamField>
<ParamField path="config" type="object">
  用于自定义每个 skill 字段的可选对象。自定义键必须放在这里。
</ParamField>
<ParamField path="allowBundled" type="string[]">
  仅针对**内置** skills 的可选允许列表。如果设置了它，则只有列表中的内置 skills 符合条件（托管/工作区 skills 不受影响）。
</ParamField>

如果 skill 名称包含连字符，请为该键加引号（JSON5 允许带引号的
键）。默认情况下，配置键会匹配**skill 名称**——如果某个 skill
定义了 `metadata.openclaw.skillKey`，则应在 `skills.entries`
下使用该键。

<Note>
对于 OpenClaw 内置的标准图像生成/编辑，请使用核心
`image_generate` 工具并配合 `agents.defaults.imageGenerationModel`，
而不是使用内置 skill。这里的 skill 示例适用于自定义或第三方
工作流。对于原生图像分析，请使用 `image` 工具并配合
`agents.defaults.imageModel`。如果你选择 `openai/*`、`google/*`、
`fal/*` 或其他提供商专用图像模型，也请同时添加该提供商的
auth/API key。
</Note>

## 环境注入

当智能体运行开始时，OpenClaw 会：

1. 读取 skill 元数据。
2. 将 `skills.entries.<key>.env` 和 `skills.entries.<key>.apiKey` 应用到 `process.env`。
3. 使用**符合条件的** skills 构建系统 prompt。
4. 在运行结束后恢复原始环境。

环境注入**仅限于智能体运行范围内**，不是全局 shell 环境。

对于内置的 `claude-cli` 后端，OpenClaw 还会将同一个符合条件的
快照实体化为临时 Claude Code 插件，并通过 `--plugin-dir` 传入。
随后 Claude Code 就能使用其原生 skill 解析器，而 OpenClaw 仍然负责
优先级、每个智能体的允许列表、门控，以及
`skills.entries.*` 的环境变量/API key 注入。其他 CLI 后端
仅使用 prompt 目录。

## 快照和刷新

OpenClaw 会在**会话开始时**对符合条件的 skills 进行快照，并在同一会话的后续回合中复用该列表。对 skills 或配置的更改会在下一次新会话中生效。

在以下两种情况下，skills 可以在会话中途刷新：

- 已启用 skills 监视器。
- 出现了新的符合条件的远程节点。

你可以将其理解为一种**热重载**：刷新后的列表会在智能体的下一回合
被读取。如果该会话的有效智能体 skill 允许列表发生变化，
OpenClaw 会刷新快照，以便可见 skills 与当前智能体保持一致。

### Skills 监视器

默认情况下，OpenClaw 会监视 skill 文件夹，并在 `SKILL.md`
文件发生变化时更新 skills 快照。配置位于 `skills.load` 下：

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

如果 Gateway 网关 运行在 Linux 上，但连接了一个允许
`system.run` 的**macOS 节点**（Exec approvals 安全设置
不是 `deny`），当该节点上存在所需二进制文件时，OpenClaw
可以将仅限 macOS 的 skills 视为符合条件。智能体应通过
`exec` 工具并设置 `host=node` 来执行这些 skills。

这依赖于节点报告其命令支持情况，以及通过 `system.which`
或 `system.run` 进行二进制探测。离线节点**不会**让仅远程可用的
skills 变为可见。如果某个已连接节点不再响应二进制探测，
OpenClaw 会清除其缓存的二进制匹配结果，这样智能体就不会再看到
当前无法在那里运行的 skills。

## Token 影响

当存在符合条件的 skills 时，OpenClaw 会将一个紧凑的 XML
可用 skills 列表注入系统 prompt（通过 `pi-coding-agent` 中的
`formatSkillsForPrompt`）。成本是确定的：

- **基础开销**（仅当 ≥1 个 skill 时）：195 个字符。
- **每个 skill：** 97 个字符 + XML 转义后的 `<name>`、`<description>` 和 `<location>` 值的长度。

公式（按字符数）：

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

XML 转义会将 `& < > " '` 扩展为实体（`&amp;`、`&lt;` 等），
从而增加长度。Token 数会因模型 tokenizer 而异。一个粗略的
OpenAI 风格估算是约 4 个字符/token，因此**97 个字符 ≈ 24 个 token**，
再加上你的实际字段长度。

## 托管 skills 生命周期

OpenClaw 会随安装（npm package 或 OpenClaw.app）附带一组基础 skills，
称为**内置 skills**。`~/.openclaw/skills` 用于本地覆盖——
例如，在不更改内置副本的情况下固定或修补某个 skill。
工作区 skills 由用户拥有，并会在名称冲突时覆盖这两者。

## 想寻找更多 skills？

浏览 [https://clawhub.ai](https://clawhub.ai)。完整配置
schema： [Skills 配置](/zh-CN/tools/skills-config)。

## 相关内容

- [ClawHub](/zh-CN/tools/clawhub) —— 公共 skills 注册表
- [Creating skills](/zh-CN/tools/creating-skills) —— 构建自定义 skills
- [Plugins](/zh-CN/tools/plugin) —— 插件系统概览
- [Skill Workshop plugin](/zh-CN/plugins/skill-workshop) —— 从智能体工作生成 skills
- [Skills 配置](/zh-CN/tools/skills-config) —— skill 配置参考
- [Slash commands](/zh-CN/tools/slash-commands) —— 所有可用的斜杠命令
