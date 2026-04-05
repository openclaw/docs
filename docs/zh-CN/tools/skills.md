---
read_when:
    - 添加或修改 Skills
    - 更改技能门控或加载规则
summary: Skills：托管与工作区、门控规则，以及 config/env 连接方式
title: Skills
x-i18n:
    generated_at: "2026-04-05T10:12:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6bb0e2e7c2ff50cf19c759ea1da1fd1886dc11f94adc77cbfd816009f75d93ee
    source_path: tools/skills.md
    workflow: 15
---

# Skills（OpenClaw）

OpenClaw 使用与 **[AgentSkills](https://agentskills.io)** 兼容的技能文件夹来教会智能体如何使用工具。每个技能都是一个目录，包含一个带有 YAML frontmatter 和说明的 `SKILL.md`。OpenClaw 会加载**内置技能**以及可选的本地覆盖，并根据环境、配置和二进制文件是否存在，在加载时对它们进行过滤。

## 位置和优先级

OpenClaw 会从以下来源加载 Skills：

1. **额外技能文件夹**：通过 `skills.load.extraDirs` 配置
2. **内置技能**：随安装一起提供（npm 包或 OpenClaw.app）
3. **托管/本地技能**：`~/.openclaw/skills`
4. **个人智能体技能**：`~/.agents/skills`
5. **项目智能体技能**：`<workspace>/.agents/skills`
6. **工作区技能**：`<workspace>/skills`

如果技能名称冲突，优先级为：

`<workspace>/skills`（最高）→ `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 内置技能 → `skills.load.extraDirs`（最低）

## 每智能体与共享 Skills

在**多智能体**设置中，每个智能体都有自己的工作区。这意味着：

- **每智能体技能**位于该智能体专属的 `<workspace>/skills` 中。
- **项目智能体技能**位于 `<workspace>/.agents/skills` 中，并会在常规工作区 `skills/` 文件夹之前应用到
  该工作区。
- **个人智能体技能**位于 `~/.agents/skills` 中，并会在该机器上的
  各个工作区之间生效。
- **共享技能**位于 `~/.openclaw/skills`（托管/本地）中，并且对同一台机器上的
  **所有智能体**可见。
- 如果你希望多个智能体使用一套通用技能包，也可以通过 `skills.load.extraDirs` 添加**共享文件夹**（最低
  优先级）。

如果同一个技能名称在多个位置都存在，则按常规优先级
生效：工作区最高，然后是项目智能体技能，再然后是个人智能体技能，
然后是托管/本地，之后是内置，最后是额外目录。

## 智能体技能允许列表

技能**位置**和技能**可见性**是两个独立的控制项。

- 位置/优先级决定同名技能中哪一个副本胜出。
- 智能体允许列表决定某个智能体实际上可以使用哪些可见技能。

使用 `agents.defaults.skills` 作为共享基线，然后通过
`agents.list[].skills` 按智能体覆盖：

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // 继承 github, weather
      { id: "docs", skills: ["docs-search"] }, // 替换 defaults
      { id: "locked-down", skills: [] }, // 无技能
    ],
  },
}
```

规则：

- 如果默认希望 Skills 不受限制，请省略 `agents.defaults.skills`。
- 省略 `agents.list[].skills` 表示继承 `agents.defaults.skills`。
- 设置 `agents.list[].skills: []` 表示不使用任何技能。
- 非空的 `agents.list[].skills` 列表就是该智能体的最终技能集合；它
  不会与默认值合并。

OpenClaw 会在提示词构建、技能 slash-command 发现、沙箱同步以及技能快照中应用该智能体的有效技能集。

## 插件 + Skills

插件可以通过在
`openclaw.plugin.json` 中列出 `skills` 目录（相对于插件根目录的路径）来提供自己的技能。插件技能会在插件启用时加载。当前这些目录会被合并到与 `skills.load.extraDirs` 相同的
低优先级路径中，因此同名的内置、
托管、智能体或工作区技能都会覆盖它们。
你可以通过插件配置项上的 `metadata.openclaw.requires.config` 对它们进行门控。
关于发现/配置请参阅 [插件](/zh-CN/tools/plugin)，关于这些技能所教授的
工具表面请参阅 [工具](/zh-CN/tools)。

## ClawHub（安装 + 同步）

ClawHub 是 OpenClaw 的公开技能注册表。浏览地址：
[https://clawhub.ai](https://clawhub.ai)。使用原生 `openclaw skills`
命令来发现/安装/更新技能；如果
你需要发布/同步工作流，则使用单独的 `clawhub` CLI。
完整指南：[ClawHub](/zh-CN/tools/clawhub)。

常见流程：

- 将某个技能安装到你的工作区：
  - `openclaw skills install <skill-slug>`
- 更新所有已安装技能：
  - `openclaw skills update --all`
- 同步（扫描 + 发布更新）：
  - `clawhub sync --all`

原生 `openclaw skills install` 会将技能安装到当前工作区的 `skills/`
目录中。单独的 `clawhub` CLI 也会安装到当前工作目录下的 `./skills`
中（或者回退到已配置的 OpenClaw 工作区）。
OpenClaw 会在下一个会话中将其视为 `<workspace>/skills`。

## 安全说明

- 将第三方技能视为**不受信任代码**。启用前请先阅读。
- 对不受信任输入和高风险工具，优先使用沙箱隔离运行。请参阅 [沙箱隔离](/zh-CN/gateway/sandboxing)。
- 工作区和 extra-dir 技能发现只接受技能根目录以及其解析后的 realpath 保持在已配置根目录内的 `SKILL.md` 文件。
- 由 Gateway 网关支持的技能依赖安装（`skills.install`、新手引导和 Skills 设置 UI）会在执行安装器元数据前先运行内置危险代码扫描器。除非调用者显式设置危险覆盖，否则默认会阻止 `critical` 发现；可疑发现仍然只会发出警告。
- `openclaw skills install <slug>` 不同：它会把 ClawHub 技能文件夹下载到工作区中，而不会使用上面的安装器元数据路径。
- `skills.entries.*.env` 和 `skills.entries.*.apiKey` 会将密钥注入该智能体轮次的**主机**进程
  中（不是沙箱）。请将密钥保留在提示词和日志之外。
- 更广泛的威胁模型与检查清单，请参阅 [Security](/zh-CN/gateway/security)。

## 格式（AgentSkills + Pi 兼容）

`SKILL.md` 至少必须包含：

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

说明：

- 我们遵循 AgentSkills 规范的布局/意图。
- 嵌入式智能体使用的解析器仅支持**单行** frontmatter 键。
- `metadata` 应为**单行 JSON 对象**。
- 在说明中使用 `{baseDir}` 来引用技能文件夹路径。
- 可选 frontmatter 键：
  - `homepage` — 在 macOS Skills UI 中显示为 “Website” 的 URL（也支持通过 `metadata.openclaw.homepage` 设置）。
  - `user-invocable` — `true|false`（默认：`true`）。为 `true` 时，该技能会作为用户 slash 命令公开。
  - `disable-model-invocation` — `true|false`（默认：`false`）。为 `true` 时，该技能会从模型提示词中排除（但仍可通过用户调用使用）。
  - `command-dispatch` — `tool`（可选）。设为 `tool` 时，slash 命令会绕过模型，直接分发到工具。
  - `command-tool` — 当设置 `command-dispatch: tool` 时要调用的工具名称。
  - `command-arg-mode` — `raw`（默认）。对于工具分发，会将原始参数字符串转发给工具（不做核心解析）。

    工具会使用以下参数调用：
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`。

## 门控（加载时过滤）

OpenClaw 会在**加载时**使用 `metadata`（单行 JSON）过滤 Skills：

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

- `always: true` — 始终包含该技能（跳过其他门控）。
- `emoji` — macOS Skills UI 使用的可选表情符号。
- `homepage` — 在 macOS Skills UI 中显示为 “Website” 的可选 URL。
- `os` — 可选平台列表（`darwin`、`linux`、`win32`）。设置后，技能仅在这些操作系统上符合条件。
- `requires.bins` — 列表；每个都必须存在于 `PATH` 中。
- `requires.anyBins` — 列表；其中至少一个必须存在于 `PATH` 中。
- `requires.env` — 列表；环境变量必须存在，**或者**在配置中提供。
- `requires.config` — 必须为真值的 `openclaw.json` 路径列表。
- `primaryEnv` — 与 `skills.entries.<name>.apiKey` 关联的环境变量名。
- `install` — macOS Skills UI 使用的可选安装器规范数组（brew/node/go/uv/download）。

关于沙箱隔离的说明：

- `requires.bins` 会在技能加载时于**主机**上检查。
- 如果某个智能体处于沙箱中，则该二进制文件也必须**在容器内**存在。
  请通过 `agents.defaults.sandbox.docker.setupCommand`（或自定义镜像）安装它。
  `setupCommand` 会在容器创建后运行一次。
  软件包安装还需要网络出站、可写根文件系统以及沙箱中的 root 用户。
  示例：`summarize` 技能（`skills/summarize/SKILL.md`）需要在沙箱容器中存在 `summarize` CLI
  才能在其中运行。

安装器示例：

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

说明：

- 如果列出了多个安装器，gateway 会选择**单个**首选项（有 brew 时优先 brew，否则使用 node）。
- 如果所有安装器都是 `download`，OpenClaw 会列出每个条目，以便你查看可用构件。
- 安装器规范可以包含 `os: ["darwin"|"linux"|"win32"]`，按平台过滤选项。
- Node 安装会遵循 `openclaw.json` 中的 `skills.install.nodeManager`（默认：npm；可选：npm/pnpm/yarn/bun）。
  这只影响**技能安装**；Gateway 网关运行时仍应使用 Node
  （WhatsApp/Telegram 不推荐使用 Bun）。
- 由 Gateway 网关支持的安装器选择是基于偏好而不是仅限 node：
  当安装规范混合多种类型时，若启用了
  `skills.install.preferBrew` 且存在 `brew`，OpenClaw 会优先选择 Homebrew，然后是 `uv`，再然后是
  已配置的 node manager，最后才是 `go` 或 `download` 等其他回退选项。
- 如果每个安装规范都是 `download`，OpenClaw 会显示所有下载选项，
  而不是折叠成一个首选安装器。
- Go 安装：如果缺少 `go` 但可用 `brew`，gateway 会先通过 Homebrew 安装 Go，并在可能时将 `GOBIN` 设置为 Homebrew 的 `bin`。
- Download 安装：`url`（必填）、`archive`（`tar.gz` | `tar.bz2` | `zip`）、`extract`（默认：检测到归档时自动）、`stripComponents`、`targetDir`（默认：`~/.openclaw/tools/<skillKey>`）。

如果不存在 `metadata.openclaw`，则该技能始终符合条件（除非
在配置中被禁用，或对于内置技能被 `skills.allowBundled` 阻止）。

## 配置覆盖（`~/.openclaw/openclaw.json`）

内置/托管技能可以切换开关并提供 env 值：

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // 或明文字符串
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

注意：如果技能名称包含连字符，请给键加引号（JSON5 允许带引号的键）。

如果你想在 OpenClaw 本身中使用标准图像生成/编辑，请使用核心
`image_generate` 工具并配合 `agents.defaults.imageGenerationModel`，而不是
内置技能。这里的技能示例适用于自定义或第三方工作流。

对于原生图像分析，请使用带 `agents.defaults.imageModel` 的 `image` 工具。
对于原生图像生成/编辑，请使用
带 `agents.defaults.imageGenerationModel` 的 `image_generate`。如果你选择 `openai/*`、`google/*`、
`fal/*` 或其他提供商特定图像模型，请同时添加该提供商的 auth/API
密钥。

默认情况下，配置键与**技能名称**匹配。如果某个技能定义了
`metadata.openclaw.skillKey`，则在 `skills.entries` 下请使用该键。

规则：

- `enabled: false` 会禁用该技能，即使它是内置/已安装的。
- `env`：**仅在**进程中尚未设置该变量时才注入。
- `apiKey`：为声明了 `metadata.openclaw.primaryEnv` 的技能提供的便利字段。
  支持明文字符串或 SecretRef 对象（`{ source, provider, id }`）。
- `config`：用于自定义每技能字段的可选容器；自定义键必须放在这里。
- `allowBundled`：仅适用于**内置**技能的可选允许列表。设置后，只有
  列表中的内置技能才符合条件（不影响托管/工作区技能）。

## 环境注入（每次智能体运行）

当一次智能体运行开始时，OpenClaw 会：

1. 读取技能元数据。
2. 将任意 `skills.entries.<key>.env` 或 `skills.entries.<key>.apiKey` 应用到
   `process.env`。
3. 用**符合条件的**技能构建系统提示词。
4. 在运行结束后恢复原始环境。

这**只作用于该次智能体运行**，而不是全局 shell 环境。

## 会话快照（性能）

OpenClaw 会在会话开始时对符合条件的技能进行快照，并在同一会话的后续轮次中复用该列表。对技能或配置的更改会在下一次新会话中生效。

当启用技能监视器，或出现新的符合条件的远程节点时，技能也可以在会话中途刷新（见下文）。可以把这理解为一种**热重载**：刷新的列表会在下一轮智能体调用时被拾取。

如果该会话的有效智能体技能允许列表发生变化，OpenClaw
会刷新快照，以便可见技能与当前
智能体保持一致。

## 远程 macOS 节点（Linux gateway）

如果 Gateway 网关运行在 Linux 上，但连接了一个**允许 `system.run` 的 macOS 节点**（Exec 审批安全性未设为 `deny`），当该节点上存在所需二进制文件时，OpenClaw 可以将仅限 macOS 的技能视为符合条件。智能体应通过 `exec` 工具并使用 `host=node` 来执行这些技能。

这依赖于节点报告其命令支持情况，并通过 `system.run` 进行 bin 探测。如果该 macOS 节点之后离线，这些技能仍然可见；在节点重新连接之前，调用可能会失败。

## Skills 监视器（自动刷新）

默认情况下，OpenClaw 会监视技能文件夹，并在 `SKILL.md` 文件发生变化时更新技能快照。可在 `skills.load` 下进行配置：

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

## Token 影响（技能列表）

当技能符合条件时，OpenClaw 会将一个紧凑的可用技能 XML 列表注入系统提示词（通过 `pi-coding-agent` 中的 `formatSkillsForPrompt`）。成本是确定性的：

- **基础开销（仅当 ≥1 个技能时）：**195 个字符。
- **每个技能：**97 个字符 + XML 转义后的 `<name>`、`<description>` 和 `<location>` 值长度。

公式（字符数）：

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

说明：

- XML 转义会将 `& < > " '` 扩展为实体（`&amp;`、`&lt;` 等），从而增加长度。
- Token 计数会因模型 tokenizer 而异。粗略按 OpenAI 风格估算约为 ~4 字符/token，因此**97 个字符 ≈ 24 个 token**，每个技能还需再加上你的实际字段长度。

## 托管技能生命周期

OpenClaw 会随安装提供一组基线技能，作为
**内置技能**（npm 包或 OpenClaw.app 的一部分）。`~/.openclaw/skills` 用于本地
覆盖（例如，在不修改内置
副本的情况下固定/修补某个技能）。工作区技能由用户持有，并会在同名冲突时覆盖前两者。

## 配置参考

完整配置 schema 请参阅 [Skills 配置](/zh-CN/tools/skills-config)。

## 想找更多技能？

浏览 [https://clawhub.ai](https://clawhub.ai)。

---

## 相关内容

- [创建技能](/zh-CN/tools/creating-skills) — 构建自定义技能
- [Skills 配置](/zh-CN/tools/skills-config) — 技能配置参考
- [Slash Commands](/zh-CN/tools/slash-commands) — 所有可用的 slash 命令
- [插件](/zh-CN/tools/plugin) — 插件系统概览
