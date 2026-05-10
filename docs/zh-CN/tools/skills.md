---
read_when:
    - 添加或修改技能
    - 更改技能门控、允许列表或加载规则
    - 理解技能优先级和快照行为
sidebarTitle: Skills
summary: Skills：托管式与工作区、门控规则、智能体允许列表和配置接线
title: Skills
x-i18n:
    generated_at: "2026-05-10T19:51:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: a265932a9990e71c0dd6b4444f26efb04019ed979477b0712a3a45569b1b4dff
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw 使用**兼容 [AgentSkills](https://agentskills.io) 的**技能文件夹来教智能体如何使用工具。每个 Skills 都是一个目录，其中包含带有 YAML frontmatter 和说明的 `SKILL.md`。OpenClaw 会加载内置 Skills 以及可选的本地覆盖项，并在加载时根据环境、配置和二进制文件是否存在对它们进行过滤。

## 位置和优先级

OpenClaw 从这些来源加载 Skills，**优先级从高到低**：

| #   | 来源                  | 路径                             |
| --- | --------------------- | -------------------------------- |
| 1   | 工作区 Skills         | `<workspace>/skills`             |
| 2   | 项目智能体 Skills     | `<workspace>/.agents/skills`     |
| 3   | 个人智能体 Skills     | `~/.agents/skills`               |
| 4   | 托管/本地 Skills      | `~/.openclaw/skills`             |
| 5   | 内置 Skills           | 随安装包提供                     |
| 6   | 额外 Skills 文件夹    | `skills.load.extraDirs`（配置）  |

如果 Skills 名称冲突，优先级最高的来源生效。

Codex CLI 的原生 `$CODEX_HOME/skills` 目录不是这些 OpenClaw Skills 根目录之一。在 Codex harness 模式下，本地应用服务器启动会使用隔离的每智能体 Codex 主目录，因此个人 Codex CLI Skills 不会被隐式加载。使用 `openclaw migrate codex --dry-run` 盘点它们，并使用 `openclaw migrate codex` 通过交互式复选框提示选择 Skills 目录，然后复制到当前 OpenClaw 智能体工作区。对于非交互式运行，请重复使用 `--skill <name>` 指定要复制的确切 Skills。

## 每智能体与共享 Skills

在**多智能体**设置中，每个智能体都有自己的工作区：

| 范围                 | 路径                                        | 对谁可见                    |
| -------------------- | ------------------------------------------- | --------------------------- |
| 每智能体             | `<workspace>/skills`                        | 仅该智能体                  |
| 项目智能体           | `<workspace>/.agents/skills`                | 仅该工作区的智能体          |
| 个人智能体           | `~/.agents/skills`                          | 该机器上的所有智能体        |
| 共享托管/本地        | `~/.openclaw/skills`                        | 该机器上的所有智能体        |
| 共享额外目录         | `skills.load.extraDirs`（最低优先级）       | 该机器上的所有智能体        |

同名 Skills 出现在多个位置 → 优先级最高的来源生效。工作区优先于项目智能体，项目智能体优先于个人智能体，个人智能体优先于托管/本地，托管/本地优先于内置，内置优先于额外目录。

## 智能体 Skills allowlist

Skills **位置**和 Skills **可见性**是分开的控制项。位置/优先级决定同名 Skills 的哪个副本生效；智能体 allowlist 决定智能体实际可以使用哪些 Skills。

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
  <Accordion title="Allowlist 规则">
    - 默认情况下，省略 `agents.defaults.skills` 表示不限制 Skills。
    - 省略 `agents.list[].skills` 会继承 `agents.defaults.skills`。
    - 设置 `agents.list[].skills: []` 表示没有 Skills。
    - 非空的 `agents.list[].skills` 列表是该智能体的**最终**集合，不会与默认值合并。
    - 有效 allowlist 会应用于提示构建、Skills 斜杠命令发现、沙箱同步和 Skills 快照。

  </Accordion>
</AccordionGroup>

## 插件和 Skills

插件可以通过在 `openclaw.plugin.json` 中列出 `skills` 目录来附带自己的 Skills（路径相对于插件根目录）。插件启用时会加载插件 Skills。这适合放置特定工具的操作指南：这些指南对于工具描述来说太长，但只要插件已安装就应该可用。例如，浏览器插件会附带一个 `browser-automation` Skills，用于多步骤浏览器控制。

插件 Skills 目录会合并到与 `skills.load.extraDirs` 相同的低优先级路径中，因此同名的内置、托管、智能体或工作区 Skills 会覆盖它们。你可以通过插件配置条目上的 `metadata.openclaw.requires.config` 对它们设门槛。

请参阅 [插件](/zh-CN/tools/plugin) 了解发现/配置，并参阅 [工具](/zh-CN/tools) 了解这些 Skills 所教授的工具表面。

## Skills 工作坊

可选的实验性 **Skills 工作坊**插件可以根据智能体工作期间观察到的可复用流程创建或更新工作区 Skills。它默认禁用，必须通过 `plugins.entries.skill-workshop` 显式启用。

Skills 工作坊只写入 `<workspace>/skills`，会扫描生成内容，支持待批准或自动安全写入，会隔离不安全提案，并在成功写入后刷新 Skills 快照，使新 Skills 无需重启 Gateway 网关即可可用。

将它用于类似 _“下次验证 GIF 署名”_ 的修正，或类似媒体 QA 检查清单这类来之不易的工作流。先从待批准开始；仅在可信工作区中审核其提案后再使用自动写入。完整指南：[Skills 工作坊插件](/zh-CN/plugins/skill-workshop)。

## ClawHub（安装和同步）

[ClawHub](https://clawhub.ai) 是 OpenClaw 的公共 Skills 注册表。使用原生 `openclaw skills` 命令进行发现/安装/更新，或使用单独的 `clawhub` CLI 执行发布/同步工作流。完整指南：[ClawHub](/zh-CN/clawhub)。

| 操作                               | 命令                                   |
| ---------------------------------- | -------------------------------------- |
| 将 Skills 安装到工作区             | `openclaw skills install <skill-slug>` |
| 更新所有已安装的 Skills            | `openclaw skills update --all`         |
| 同步（扫描 + 发布更新）            | `clawhub sync --all`                   |

原生 `openclaw skills install` 会安装到活动工作区的 `skills/` 目录。单独的 `clawhub` CLI 也会安装到你当前工作目录下的 `./skills`（或回退到配置的 OpenClaw 工作区）。OpenClaw 会在下一个会话中将其识别为 `<workspace>/skills`。配置的 Skills 根目录也支持一级分组，例如 `skills/<group>/<skill>/SKILL.md`，因此相关的第三方 Skills 可以保存在共享文件夹下，而无需进行宽泛的递归扫描。

需要私有、非 ClawHub 交付的 Gateway 网关客户端可以使用 `skills.upload.begin`、`skills.upload.chunk` 和 `skills.upload.commit` 暂存一个 zip Skills 归档，然后使用 `skills.install({ source: "upload", uploadId, slug, force?, sha256? })` 安装已提交的上传。这是面向可信客户端的显式管理员上传路径，不是普通的 `openclaw skills install <slug>` 或 ClawHub 安装流程。它默认关闭，只有在 `openclaw.json` 中设置 `skills.install.allowUploadedArchives: true` 时才可用。上传模式仍会安装到默认智能体工作区的 `skills/<slug>` 目录；归档内部的文件夹名称会被忽略，不作为最终安装目标。

ClawHub Skills 页面会在安装前显示最新安全扫描状态，并提供 VirusTotal、ClawScan 和静态分析的扫描器详情页。`openclaw skills install <slug>` 仍然只是安装路径；发布者可通过 ClawHub 控制台或 `clawhub skill rescan <slug>` 处理误报。

## 安全

<Warning>
将第三方 Skills 视为**不可信代码**。启用前请先阅读。对于不可信输入和高风险工具，优先使用沙箱隔离运行。请参阅[沙箱隔离](/zh-CN/gateway/sandboxing)了解智能体侧控制项。
</Warning>

- 工作区和额外目录的 Skills 发现只接受解析后的真实路径仍位于配置根目录内的 Skills 根目录和 `SKILL.md` 文件。
- Gateway 网关私有归档安装默认关闭。显式启用后，它们需要一个已提交的 zip 上传，其中包含 `SKILL.md`，并复用与 ClawHub Skills 安装相同的归档解压、路径遍历、符号链接、强制覆盖和回滚保护。它们由 `skills.install.allowUploadedArchives` 控制；普通 ClawHub 安装不需要该设置。
- Gateway 网关支持的 Skills 依赖安装（`skills.install`、新手引导和 Skills 设置 UI）会在执行安装器元数据前运行内置危险代码扫描器。默认情况下，`critical` 发现会阻止执行，除非调用方显式设置危险覆盖；可疑发现仍然只会警告。
- `openclaw skills install <slug>` 不同：它会把 ClawHub Skills 文件夹下载到工作区，并且不使用上面的安装器元数据路径。
- `skills.entries.*.env` 和 `skills.entries.*.apiKey` 会将密钥注入该智能体轮次的**宿主**进程（不是沙箱）。不要把密钥放进提示和日志。

如需更广泛的威胁模型和检查清单，请参阅[安全](/zh-CN/gateway/security)。

## SKILL.md 格式

`SKILL.md` 至少必须包含：

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw 遵循 AgentSkills 规范的布局/意图。嵌入式智能体使用的解析器仅支持**单行** frontmatter 键；`metadata` 应该是一个**单行 JSON 对象**。在说明中使用 `{baseDir}` 引用 Skills 文件夹路径。

### 可选 frontmatter 键

<ParamField path="homepage" type="string">
  在 macOS Skills UI 中显示为“网站”的 URL。也支持通过 `metadata.openclaw.homepage` 设置。
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  当为 `true` 时，Skills 会作为用户斜杠命令暴露。
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  当为 `true` 时，OpenClaw 会将该 Skills 的说明排除在智能体的普通提示之外。该 Skills 仍会安装，并且当 `user-invocable` 也为 `true` 时，仍可作为斜杠命令显式运行。
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  设置为 `tool` 时，斜杠命令会绕过模型并直接分派到工具。
</ParamField>
<ParamField path="command-tool" type="string">
  设置 `command-dispatch: tool` 时要调用的工具名称。
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  对于工具分派，将原始参数字符串转发给工具（不进行核心解析）。工具会以 `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }` 调用。
</ParamField>

## 门控（加载时过滤器）

OpenClaw 在加载时使用 `metadata`（单行 JSON）过滤 Skills：

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
  macOS Skills UI 使用的可选 emoji。
</ParamField>
<ParamField path="homepage" type="string">
  在 macOS Skills UI 中显示为“网站”的可选 URL。
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  可选平台列表。如果设置，该技能仅在这些 OS 上符合条件。
</ParamField>
<ParamField path="requires.bins" type="string[]">
  每一项都必须存在于 `PATH` 上。
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  至少一项必须存在于 `PATH` 上。
</ParamField>
<ParamField path="requires.env" type="string[]">
  环境变量必须存在，或在配置中提供。
</ParamField>
<ParamField path="requires.config" type="string[]">
  必须为真值的 `openclaw.json` 路径列表。
</ParamField>
<ParamField path="primaryEnv" type="string">
  与 `skills.entries.<name>.apiKey` 关联的环境变量名称。
</ParamField>
<ParamField path="install" type="object[]">
  macOS Skills UI 使用的可选安装器规格（brew/node/go/uv/download）。
</ParamField>

如果没有 `metadata.openclaw`，该技能始终符合条件（除非在配置中被
禁用，或对于内置技能被 `skills.allowBundled` 阻止）。

<Note>
当缺少 `metadata.openclaw` 时，仍会接受旧版 `metadata.clawdbot`
块，因此较旧的已安装技能会保留它们的依赖门控和安装器提示。新的和更新后的技能应使用
`metadata.openclaw`。
</Note>

### 沙箱隔离注意事项

- `requires.bins` 会在技能加载时在**主机**上检查。
- 如果智能体处于沙箱隔离中，该二进制文件也必须存在于**容器内**。通过 `agents.defaults.sandbox.docker.setupCommand`（或自定义镜像）安装它。`setupCommand` 会在容器创建后运行一次。包安装还需要网络出口、可写的根 FS，以及沙箱中的 root 用户。
- 示例：`summarize` 技能（`skills/summarize/SKILL.md`）需要沙箱容器中有 `summarize` CLI 才能在那里运行。

### 安装器规格

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
    - 如果列出了多个安装器，Gateway 网关会选择一个首选选项（brew 可用时选择 brew，否则选择 node）。
    - 如果所有安装器都是 `download`，OpenClaw 会列出每个条目，让你看到可用的构件。
    - 安装器规格可以包含 `os: ["darwin"|"linux"|"win32"]`，用于按平台筛选选项。
    - Node 安装会遵循 `openclaw.json` 中的 `skills.install.nodeManager`（默认：npm；选项：npm/pnpm/yarn/bun）。这只影响技能安装；Gateway 网关运行时仍应是 Node - 不建议将 Bun 用于 WhatsApp/Telegram。
    - Gateway 网关支持的安装器选择由偏好驱动：当安装规格混合多种类型时，如果启用了 `skills.install.preferBrew` 且存在 `brew`，OpenClaw 会优先选择 Homebrew，然后是 `uv`，然后是已配置的 node 管理器，再然后是其他回退选项，如 `go` 或 `download`。
    - 如果每个安装规格都是 `download`，OpenClaw 会展示所有下载选项，而不是折叠为一个首选安装器。

  </Accordion>
  <Accordion title="Per-installer details">
    - **Go 安装：**如果缺少 `go` 且 `brew` 可用，Gateway 网关会先通过 Homebrew 安装 Go，并在可能时将 `GOBIN` 设置为 Homebrew 的 `bin`。
    - **下载安装：**`url`（必需）、`archive`（`tar.gz` | `tar.bz2` | `zip`）、`extract`（默认：检测到归档时自动）、`stripComponents`、`targetDir`（默认：`~/.openclaw/tools/<skillKey>`）。

  </Accordion>
</AccordionGroup>

## 配置覆盖

内置和托管技能可以在 `~/.openclaw/openclaw.json` 的 `skills.entries`
下切换，并提供环境值：

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
  `false` 会禁用该技能，即使它是内置或已安装的。
  内置的 `coding-agent` 技能是选择加入的：在将其暴露给智能体之前，设置
  `skills.entries.coding-agent.enabled: true`，
  然后确保已安装 `claude`、`codex`、`opencode` 或 `pi` 之一，并已为其自己的 CLI
  完成身份验证。
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  为声明 `metadata.openclaw.primaryEnv` 的技能提供的便捷配置。支持明文或 SecretRef。
</ParamField>
<ParamField path="env" type="Record<string, string>">
  仅在该变量尚未在进程中设置时注入。
</ParamField>
<ParamField path="config" type="object">
  用于自定义单技能字段的可选包。自定义键必须放在这里。
</ParamField>
<ParamField path="allowBundled" type="string[]">
  仅适用于**内置**技能的可选允许列表。如果设置，只有列表中的内置技能符合条件（托管/工作区技能不受影响）。
</ParamField>

如果技能名称包含连字符，请为键加引号（JSON5 允许带引号的键）。默认情况下，配置键与**技能名称**匹配 - 如果技能
定义了 `metadata.openclaw.skillKey`，请在 `skills.entries` 下使用该键。

<Note>
在 OpenClaw 内部进行原生图像生成/编辑时，请使用核心
`image_generate` 工具和 `agents.defaults.imageGenerationModel`，而不是
内置技能。这里的技能示例用于自定义或第三方
工作流。原生图像分析请使用 `image` 工具和
`agents.defaults.imageModel`。如果你选择 `openai/*`、`google/*`、
`fal/*` 或其他提供商特定的图像模型，也要添加该提供商的
auth/API key。
</Note>

## 环境注入

当智能体运行开始时，OpenClaw 会：

1. 读取技能元数据。
2. 将 `skills.entries.<key>.env` 和 `skills.entries.<key>.apiKey` 应用于 `process.env`。
3. 使用**符合条件的**技能构建系统提示词。
4. 运行结束后恢复原始环境。

环境注入的作用域是**智能体运行**，不是全局 shell
环境。

对于内置的 `claude-cli` 后端，OpenClaw 还会将同一个
符合条件的快照实体化为临时 Claude Code 插件，并通过
`--plugin-dir` 传入。Claude Code 随后可以使用其原生技能解析器，同时
OpenClaw 仍负责优先级、按智能体允许列表、门控，以及
`skills.entries.*` env/API key 注入。其他 CLI 后端仅使用
提示词目录。

## 快照和刷新

OpenClaw 会在**会话开始时**快照符合条件的技能，并在同一会话的后续轮次中
复用该列表。对技能或配置的更改会在下一个新会话中生效。

技能可在会话中途在两种情况下刷新：

- 技能观察器已启用。
- 出现新的符合条件的远程节点。

可以把它理解为**热重载**：刷新的列表会在下一个
智能体轮次中被采用。如果该会话的有效智能体技能允许列表发生变化，
OpenClaw 会刷新快照，让可见技能与当前智能体保持一致。

### Skills 观察器

默认情况下，OpenClaw 会观察技能文件夹，并在 `SKILL.md` 文件变化时更新技能快照。
在 `skills.load` 下配置：

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

对于内置技能根包含符号链接的有意兄弟仓库布局，使用
`allowSymlinkTargets`，例如
`~/.agents/skills/manager -> ~/Projects/manager/skills`。目标列表会在 realpath 解析后
匹配，并应保持狭窄。

### 远程 macOS 节点（Linux Gateway 网关）

如果 Gateway 网关运行在 Linux 上，但连接了一个**macOS 节点**且
允许 `system.run`（Exec 审批安全未设置为 `deny`），
当所需二进制文件存在于该节点上时，OpenClaw 可以将仅限 macOS 的技能视为符合条件。
智能体应通过带 `host=node` 的 `exec` 工具执行这些技能。

这依赖于节点报告其命令支持，并通过 `system.which` 或 `system.run`
进行 bin 探测。离线节点**不会**让仅远程可用的技能可见。
如果已连接节点停止响应 bin 探测，OpenClaw 会清除其缓存的 bin 匹配，
这样智能体就不再看到当前无法在那里运行的技能。

## Token 影响

当技能符合条件时，OpenClaw 会将可用技能的紧凑 XML 列表
注入到系统提示词中（通过 `pi-coding-agent` 中的 `formatSkillsForPrompt`）。
成本是确定性的：

- **基础开销**（仅当 ≥1 个技能时）：195 个字符。
- **每个技能：**97 个字符 + XML 转义后的 `<name>`、`<description>` 和 `<location>` 值长度。

公式（字符）：

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

XML 转义会将 `& < > " '` 扩展为实体（`&amp;`、`&lt;` 等），
从而增加长度。Token 数会随模型 tokenizer 而变化。粗略的
OpenAI 风格估计是约 4 个字符/token，因此**97 个字符 ≈ 24 个 token**/每个
技能，再加上你的实际字段长度。

## 托管技能生命周期

OpenClaw 随安装（npm 包或 OpenClaw.app）附带一组基线技能作为**内置技能**。
`~/.openclaw/skills` 用于本地覆盖 - 例如，在不更改
内置副本的情况下固定或修补某个技能。工作区技能由用户拥有，并会在
名称冲突时覆盖前两者。

## 想找更多技能？

浏览 [https://clawhub.ai](https://clawhub.ai)。完整配置
schema：[Skills 配置](/zh-CN/tools/skills-config)。

## 相关

- [ClawHub](/zh-CN/clawhub) - 公共技能注册表
- [创建技能](/zh-CN/tools/creating-skills) - 构建自定义技能
- [插件](/zh-CN/tools/plugin) - 插件系统概览
- [Skill Workshop 插件](/zh-CN/plugins/skill-workshop) - 从智能体工作生成技能
- [Skills 配置](/zh-CN/tools/skills-config) - 技能配置参考
- [斜杠命令](/zh-CN/tools/slash-commands) - 所有可用斜杠命令
