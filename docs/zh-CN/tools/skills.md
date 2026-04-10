---
read_when:
    - 添加或修改 Skills
    - 更改 Skills 的门控或加载规则
summary: Skills：托管式与工作区、门控规则，以及配置/环境变量连接方式
title: Skills
x-i18n:
    generated_at: "2026-04-10T12:46:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: b1eaf130966950b6eb24f859d9a77ecbf81c6cb80deaaa6a3a79d2c16d83115d
    source_path: tools/skills.md
    workflow: 15
---

# Skills（OpenClaw）

OpenClaw 使用与 **[AgentSkills](https://agentskills.io)** 兼容的技能文件夹来教会智能体如何使用工具。每个 skill 都是一个目录，其中包含带有 YAML frontmatter 和说明的 `SKILL.md`。OpenClaw 会加载**内置 Skills**以及可选的本地覆盖，并在加载时根据环境、配置和二进制文件是否存在进行筛选。

## 位置和优先级

OpenClaw 会从以下来源加载 Skills：

1. **额外 Skills 文件夹**：通过 `skills.load.extraDirs` 配置
2. **内置 Skills**：随安装包一起提供（npm 包或 OpenClaw.app）
3. **托管式/本地 Skills**：`~/.openclaw/skills`
4. **个人 agent Skills**：`~/.agents/skills`
5. **项目 agent Skills**：`<workspace>/.agents/skills`
6. **工作区 Skills**：`<workspace>/skills`

如果 skill 名称冲突，优先级如下：

`<workspace>/skills`（最高）→ `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 内置 Skills → `skills.load.extraDirs`（最低）

## 每个 agent 的 Skills 与共享 Skills

在**多智能体**设置中，每个智能体都有自己的工作区。这意味着：

- **每个 agent 独有的 Skills** 仅存在于该 agent 的 `<workspace>/skills` 中。
- **项目 agent Skills** 位于 `<workspace>/.agents/skills`，会先于普通工作区 `skills/` 文件夹应用到该工作区。
- **个人 agent Skills** 位于 `~/.agents/skills`，会应用到该机器上的所有工作区。
- **共享 Skills** 位于 `~/.openclaw/skills`（托管式/本地），同一台机器上的**所有智能体**都可见。
- 如果你希望多个智能体共用同一套 Skills，也可以通过 `skills.load.extraDirs` 添加**共享文件夹**（最低优先级）。

如果同一个 skill 名称在多个位置都存在，则仍然适用常规优先级：工作区优先，然后是项目 agent Skills，再然后是个人 agent Skills，然后是托管式/本地，再然后是内置，最后是额外目录。

## 智能体 Skill 允许列表

Skill 的**位置**和 skill 的**可见性**是两套独立控制。

- 位置/优先级决定同名 skill 最终使用哪一份副本。
- 智能体允许列表决定 agent 实际可以使用哪些可见 skills。

使用 `agents.defaults.skills` 作为共享基线，然后通过 `agents.list[].skills` 为每个 agent 覆盖：

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

规则：

- 如果默认不限制 skills，则省略 `agents.defaults.skills`。
- 省略 `agents.list[].skills` 表示继承 `agents.defaults.skills`。
- 设置 `agents.list[].skills: []` 表示没有 skills。
- 非空的 `agents.list[].skills` 列表就是该 agent 的最终集合；它不会与 defaults 合并。

OpenClaw 会在构建提示词、skill 斜杠命令发现、沙箱同步以及 skill 快照时应用 agent 的最终有效 skill 集合。

## 插件 + Skills

插件可以通过在 `openclaw.plugin.json` 中列出 `skills` 目录来附带自己的 Skills（路径相对于插件根目录）。插件启用后，这些插件 Skills 就会加载。当前这些目录会被合并到与 `skills.load.extraDirs` 相同的低优先级路径中，因此同名的内置、托管式、agent 或工作区 skill 都会覆盖它们。
你可以通过插件配置项上的 `metadata.openclaw.requires.config` 对它们进行门控。有关发现/配置，请参阅 [Plugins](/zh-CN/tools/plugin)；有关这些 skills 所教授的工具界面，请参阅 [Tools](/zh-CN/tools)。

## ClawHub（安装 + 同步）

ClawHub 是 OpenClaw 的公共 Skills 注册表。可在 [https://clawhub.ai](https://clawhub.ai) 浏览。使用原生 `openclaw skills` 命令来发现/安装/更新 skills；如果你需要发布/同步工作流，也可以使用独立的 `clawhub` CLI。
完整指南：[ClawHub](/zh-CN/tools/clawhub)。

常见流程：

- 将 skill 安装到你的工作区：
  - `openclaw skills install <skill-slug>`
- 更新所有已安装的 skills：
  - `openclaw skills update --all`
- 同步（扫描 + 发布更新）：
  - `clawhub sync --all`

原生 `openclaw skills install` 会安装到当前活动工作区的 `skills/` 目录中。独立的 `clawhub` CLI 也会安装到当前工作目录下的 `./skills` 中（或者回退到已配置的 OpenClaw 工作区）。
OpenClaw 会在下一个会话中将其识别为 `<workspace>/skills`。

## 安全说明

- 将第三方 skills 视为**不受信任的代码**。启用前请先阅读。
- 对不受信任的输入和高风险工具，优先使用沙箱隔离运行。参见 [沙箱隔离](/zh-CN/gateway/sandboxing)。
- 工作区和额外目录的 skill 发现只接受那些其解析后的真实路径仍位于已配置根目录内的 skill 根目录和 `SKILL.md` 文件。
- 由 Gateway 网关支持的 skill 依赖安装（`skills.install`、新手引导以及 Skills 设置 UI）会在执行安装器元数据之前运行内置危险代码扫描器。默认情况下，`critical` 级别发现会阻止继续，除非调用方显式设置危险覆盖；可疑发现仍然只会发出警告。
- `openclaw skills install <slug>` 则不同：它会将一个 ClawHub skill 文件夹下载到工作区中，不会使用上述安装器元数据路径。
- `skills.entries.*.env` 和 `skills.entries.*.apiKey` 会将密钥注入该 agent 当前轮次的**宿主机**进程（而不是沙箱）。不要将密钥放进提示词和日志。
- 更完整的威胁模型和检查清单，参见 [Security](/zh-CN/gateway/security)。

## 格式（AgentSkills + Pi 兼容）

`SKILL.md` 至少必须包含：

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

说明：

- 我们遵循 AgentSkills 规范中的布局和意图。
- 嵌入式 agent 使用的解析器仅支持**单行** frontmatter 键。
- `metadata` 应为**单行 JSON 对象**。
- 在说明中使用 `{baseDir}` 来引用 skill 文件夹路径。
- 可选的 frontmatter 键：
  - `homepage` — 作为“Website”显示在 macOS Skills UI 中的 URL（也可通过 `metadata.openclaw.homepage` 提供）。
  - `user-invocable` — `true|false`（默认：`true`）。当为 `true` 时，该 skill 会作为用户斜杠命令公开。
  - `disable-model-invocation` — `true|false`（默认：`false`）。当为 `true` 时，该 skill 会从模型提示词中排除（但仍可通过用户调用使用）。
  - `command-dispatch` — `tool`（可选）。设置为 `tool` 时，斜杠命令会绕过模型并直接分发到工具。
  - `command-tool` — 当设置了 `command-dispatch: tool` 时要调用的工具名称。
  - `command-arg-mode` — `raw`（默认）。对于工具分发，会转发原始参数字符串给工具（核心不解析）。

    工具会使用以下参数调用：
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`。

## 门控规则（加载时过滤）

OpenClaw 会使用 `metadata`（单行 JSON）在**加载时过滤 skills**：

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

- `always: true` — 始终包含该 skill（跳过其他门控）。
- `emoji` — 可选 emoji，供 macOS Skills UI 使用。
- `homepage` — 可选 URL，作为“Website”显示在 macOS Skills UI 中。
- `os` — 可选平台列表（`darwin`、`linux`、`win32`）。如已设置，则该 skill 仅在这些操作系统上可用。
- `requires.bins` — 列表；每一项都必须存在于 `PATH` 中。
- `requires.anyBins` — 列表；至少有一项必须存在于 `PATH` 中。
- `requires.env` — 列表；环境变量必须存在，**或**在配置中提供。
- `requires.config` — `openclaw.json` 路径列表；这些路径必须为真值。
- `primaryEnv` — 与 `skills.entries.<name>.apiKey` 关联的环境变量名称。
- `install` — 可选的安装器规范数组，供 macOS Skills UI 使用（brew/node/go/uv/download）。

关于沙箱隔离的说明：

- `requires.bins` 会在 skill 加载时于**宿主机**上检查。
- 如果某个 agent 运行在沙箱中，该二进制文件也必须存在于**容器内部**。
  请通过 `agents.defaults.sandbox.docker.setupCommand`（或自定义镜像）进行安装。
  `setupCommand` 会在容器创建后运行一次。
  安装软件包还需要网络出口、可写的根文件系统以及沙箱中的 root 用户。
  示例：`summarize` skill（`skills/summarize/SKILL.md`）如果要在沙箱容器中运行，就需要容器内提供 `summarize` CLI。

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

- 如果列出了多个安装器，Gateway 网关会选择**一个**首选方案（有 brew 时优先 brew，否则优先 node）。
- 如果所有安装器都是 `download`，OpenClaw 会列出每个条目，以便你查看所有可用制品。
- 安装器规范可包含 `os: ["darwin"|"linux"|"win32"]`，用于按平台过滤选项。
- Node 安装会遵循 `openclaw.json` 中的 `skills.install.nodeManager`（默认：npm；可选：npm/pnpm/yarn/bun）。
  这只影响 **skill 安装**；Gateway 网关运行时仍应使用 Node
  （不建议在 WhatsApp/Telegram 场景下使用 Bun）。
- Gateway 网关支持的安装器选择是基于偏好规则的，而不只是 node：
  当安装规范混合多种类型时，OpenClaw 会在启用 `skills.install.preferBrew` 且检测到 `brew` 时优先使用 Homebrew，然后是 `uv`，再然后是已配置的 node 管理器，最后才是 `go` 或 `download` 等其他回退方案。
- 如果每个安装规范都是 `download`，OpenClaw 会展示所有下载选项，而不是收敛为单一首选安装器。
- Go 安装：如果缺少 `go` 但存在 `brew`，Gateway 网关会先通过 Homebrew 安装 Go，并尽可能将 `GOBIN` 设为 Homebrew 的 `bin`。
- 下载安装：`url`（必填）、`archive`（`tar.gz` | `tar.bz2` | `zip`）、`extract`（默认：检测到归档时自动提取）、`stripComponents`、`targetDir`（默认：`~/.openclaw/tools/<skillKey>`）。

如果不存在 `metadata.openclaw`，则该 skill 始终符合加载条件（除非它在配置中被禁用，或作为内置 skill 被 `skills.allowBundled` 阻止）。

## 配置覆盖（`~/.openclaw/openclaw.json`）

可以切换内置/托管式 skills，并为它们提供环境变量值：

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

注意：如果 skill 名称包含连字符，请给键名加引号（JSON5 允许带引号的键）。

如果你想在 OpenClaw 本身内部使用内置图像生成/编辑，请使用核心
`image_generate` 工具，并配合 `agents.defaults.imageGenerationModel`，而不是使用某个内置 skill。这里的 skill 示例适用于自定义或第三方工作流。

对于原生图像分析，请使用 `image` 工具并配合 `agents.defaults.imageModel`。
对于原生图像生成/编辑，请使用 `image_generate` 并配合
`agents.defaults.imageGenerationModel`。如果你选择 `openai/*`、`google/*`、
`fal/*` 或其他提供商特定的图像模型，还需要添加该提供商的认证/API
密钥。

默认情况下，配置键与**skill 名称**一致。如果某个 skill 定义了
`metadata.openclaw.skillKey`，则应在 `skills.entries` 下使用该键。

规则：

- `enabled: false` 即使在该 skill 已内置/已安装的情况下，也会禁用它。
- `env`：**仅当**该变量尚未在进程中设置时才会注入。
- `apiKey`：为声明了 `metadata.openclaw.primaryEnv` 的 skills 提供的便捷方式。
  支持明文字符串或 SecretRef 对象（`{ source, provider, id }`）。
- `config`：用于自定义每个 skill 字段的可选字段包；自定义键必须放在这里。
- `allowBundled`：仅针对**内置** skills 的可选允许列表。如果设置了它，则只有列表中的内置 skills 符合条件（不影响托管式/工作区 Skills）。

## 环境变量注入（每次 agent 运行）

当一次 agent 运行开始时，OpenClaw 会：

1. 读取 skill 元数据。
2. 将任意 `skills.entries.<key>.env` 或 `skills.entries.<key>.apiKey` 应用到
   `process.env`。
3. 使用**符合条件的** Skills 构建系统提示词。
4. 在运行结束后恢复原始环境。

这是**限定在 agent 运行范围内**的，不是全局 shell 环境。

对于内置的 `claude-cli` 后端，OpenClaw 还会将相同的符合条件快照具体化为一个临时 Claude Code 插件，并通过 `--plugin-dir` 传入。随后 Claude Code 就可以使用其原生 skill 解析器，而 OpenClaw 仍然负责优先级、每个 agent 的允许列表、门控规则，以及
`skills.entries.*` 环境变量/API 密钥注入。其他 CLI 后端仅使用提示词目录。

## 会话快照（性能）

OpenClaw 会在会话开始时对符合条件的 Skills 进行快照，并在同一会话的后续轮次中复用该列表。对 skills 或配置的更改会在下一个新会话中生效。

启用 skills 监视器时，或者当新的符合条件的远程节点出现时，Skills 也可以在会话中途刷新（见下文）。你可以将其理解为一种**热重载**：刷新后的列表会在下一次 agent 轮次中生效。

如果该会话的有效 agent skill 允许列表发生变化，OpenClaw 会刷新快照，以便可见 Skills 始终与当前 agent 保持一致。

## 远程 macOS 节点（Linux Gateway 网关）

如果 Gateway 网关运行在 Linux 上，但已连接了一个**允许 `system.run` 的 macOS 节点**（Exec approvals 安全设置不为 `deny`），那么当该节点上存在所需二进制文件时，OpenClaw 可以将仅限 macOS 的 skills 视为符合条件。智能体应通过 `exec` 工具并使用 `host=node` 来执行这些 skills。

这依赖于节点报告其命令支持情况，并通过 `system.run` 完成二进制探测。如果该 macOS 节点之后离线，这些 skills 仍会保持可见；但在节点重新连接之前，调用可能会失败。

## Skills 监视器（自动刷新）

默认情况下，OpenClaw 会监视 skill 文件夹，并在 `SKILL.md` 文件发生变化时更新 skills 快照。可在 `skills.load` 下配置：

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

## Token 影响（Skills 列表）

当有符合条件的 Skills 时，OpenClaw 会将一份紧凑的可用 Skills XML 列表注入系统提示词中（通过 `pi-coding-agent` 中的 `formatSkillsForPrompt`）。其成本是确定性的：

- **基础开销（仅在 ≥1 个 skill 时）：** 195 个字符。
- **每个 skill：** 97 个字符 + XML 转义后的 `<name>`、`<description>` 和 `<location>` 值的长度。

公式（字符数）：

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

说明：

- XML 转义会将 `& < > " '` 扩展为实体（`&amp;`、`&lt;` 等），从而增加长度。
- Token 数量会因模型分词器而异。一个粗略的 OpenAI 风格估算是约 4 个字符/Token，因此**97 个字符 ≈ 24 个 Token**，再加上你实际字段内容的长度。

## 托管式 Skills 生命周期

OpenClaw 会随安装包（npm 包或 OpenClaw.app）附带一组基础 Skills，作为**内置 Skills**。`~/.openclaw/skills` 用于本地覆盖（例如，在不更改内置副本的情况下固定/修补某个 skill）。工作区 Skills 由用户自行管理，并且在名称冲突时会覆盖两者。

## 配置参考

完整配置模式请参阅 [Skills 配置](/zh-CN/tools/skills-config)。

## 想找更多 Skills？

浏览 [https://clawhub.ai](https://clawhub.ai)。

---

## 相关内容

- [创建 Skills](/zh-CN/tools/creating-skills) — 构建自定义 skills
- [Skills 配置](/zh-CN/tools/skills-config) — skill 配置参考
- [斜杠命令](/zh-CN/tools/slash-commands) — 所有可用的斜杠命令
- [Plugins](/zh-CN/tools/plugin) — 插件系统概览
