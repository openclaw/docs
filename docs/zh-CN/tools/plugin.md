---
read_when:
    - 安装或配置插件
    - 理解插件发现和加载规则
    - 使用兼容 Codex/Claude 的插件包
sidebarTitle: Install and Configure
summary: 安装、配置和管理 OpenClaw 插件
title: 插件
x-i18n:
    generated_at: "2026-05-01T21:40:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0dbb4d0102f3f2060fe13aa5e6ae1b24080a456f223e985ccfa390106e94f4d8
    source_path: tools/plugin.md
    workflow: 16
---

插件通过新能力扩展 OpenClaw：渠道、模型提供商、agent harnesses、工具、Skills、语音、实时转录、实时语音、媒体理解、图像生成、视频生成、网页抓取、网页搜索等。有些插件是 **core**（随 OpenClaw 一起发布），其他是 **external**。大多数外部插件通过 [ClawHub](/zh-CN/tools/clawhub) 发布和发现。Npm 仍支持直接安装，也会在迁移完成前临时支持一组 OpenClaw 自有插件包。

## 快速开始

<Steps>
  <Step title="See what is loaded">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Install a plugin">
    ```bash
    # From npm
    openclaw plugins install npm:@acme/openclaw-plugin

    # From git
    openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0

    # From a local directory or archive
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Restart the Gateway">
    ```bash
    openclaw gateway restart
    ```

    然后在你的配置文件中的 `plugins.entries.\<id\>.config` 下进行配置。

  </Step>

  <Step title="Verify the plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    当你需要证明已注册的工具、服务、Gateway 网关方法、钩子或插件自有的 CLI 命令时，请使用 `--runtime`。普通 `inspect` 是冷态 manifest/registry 检查，并且会有意避免导入插件运行时。

  </Step>
</Steps>

如果你更喜欢聊天原生控制，请启用 `commands.plugins: true` 并使用：

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

安装路径使用与 CLI 相同的解析器：本地路径/归档、显式 `clawhub:<pkg>`、显式 `npm:<pkg>`、显式 `git:<repo>`，或裸包 spec（先 ClawHub，再回退到 npm）。

如果配置无效，安装通常会失败关闭，并提示你使用 `openclaw doctor --fix`。唯一的恢复例外是一条很窄的内置插件重装路径，适用于选择加入 `openclaw.install.allowInvalidConfigRecovery` 的插件。
在 Gateway 网关启动期间，某个插件的无效配置会隔离到该插件：启动日志会记录 `plugins.entries.<id>.config` 问题，在加载期间跳过该插件，并让其他插件和渠道保持在线。运行 `openclaw doctor --fix` 可通过禁用该插件条目并移除其无效配置载荷来隔离有问题的插件配置；正常的配置备份会保留先前的值。
当渠道配置引用了一个不再可发现的插件，但同一个过期插件 id 仍存在于插件配置或安装记录中时，Gateway 网关启动会记录警告并跳过该渠道，而不是阻塞所有其他渠道。运行 `openclaw doctor --fix` 可移除过期的渠道/插件条目；没有过期插件证据的未知渠道键仍会导致验证失败，因此拼写错误仍然可见。
如果设置了 `plugins.enabled: false`，过期插件引用会被视为惰性：Gateway 网关启动会跳过插件发现/加载工作，并且 `openclaw doctor` 会保留被禁用的插件配置，而不是自动移除它。如果你想移除过期插件 id，请在运行 Doctor 清理前重新启用插件。

插件依赖安装只会发生在显式安装/更新或 Doctor 修复流程期间。Gateway 网关启动、配置重载和运行时检查不会运行包管理器，也不会修复依赖树。本地插件必须已经安装好自己的依赖，而 npm、git 和 ClawHub 插件会安装在 OpenClaw 托管的插件根目录下，并带有包本地依赖。外部插件和自定义加载路径仍必须通过 `openclaw plugins install` 安装。
请参阅 [插件依赖解析](/zh-CN/plugins/dependency-resolution) 了解安装时生命周期。

## 插件类型

OpenClaw 识别两种插件格式：

| 格式       | 工作方式                                                           | 示例                                                   |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + 运行时模块；在进程内执行                 | 官方插件、社区 npm 包                                  |
| **Bundle** | Codex/Claude/Cursor 兼容布局；映射到 OpenClaw 功能                | `.codex-plugin/`、`.claude-plugin/`、`.cursor-plugin/` |

两者都会显示在 `openclaw plugins list` 下。有关 bundle 详情，请参阅 [Plugin Bundles](/zh-CN/plugins/bundles)。

如果你正在编写 native 插件，请从 [构建插件](/zh-CN/plugins/building-plugins) 和 [插件 SDK 概览](/zh-CN/plugins/sdk-overview) 开始。

## 包入口点

Native 插件 npm 包必须在 `package.json` 中声明 `openclaw.extensions`。每个条目都必须保留在包目录内，并解析为可读的运行时文件，或解析为具有推断的已构建 JavaScript 对等文件的 TypeScript 源文件，例如从 `src/index.ts` 到 `dist/index.js`。

当已发布的运行时文件不在与源条目相同的路径时，请使用 `openclaw.runtimeExtensions`。如果存在，`runtimeExtensions` 必须为每个 `extensions` 条目精确包含一个条目。列表不匹配会导致安装和插件发现失败，而不是静默回退到源路径。如果你也发布 `openclaw.setupEntry`，请为其已构建的 JavaScript 对等文件使用 `openclaw.runtimeSetupEntry`；声明后该文件是必需的。

```json
{
  "name": "@acme/openclaw-plugin",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"]
  }
}
```

## 官方插件

### 迁移期间 OpenClaw 自有的 npm 包

ClawHub 是大多数插件的主要分发路径。当前打包的 OpenClaw 版本已经内置许多官方插件，因此在常规设置中不需要单独安装 npm。在所有 OpenClaw 自有插件都迁移到 ClawHub 之前，OpenClaw 仍会在 npm 上发布一些 `@openclaw/*` 插件包，用于较旧/自定义安装和直接 npm 工作流。

如果 npm 将某个 `@openclaw/*` 插件包报告为已弃用，则该包版本来自较旧的外部包发布线。请使用当前 OpenClaw 中的内置插件或本地 checkout，直到发布更新的 npm 包。

| 插件            | 包                         | 文档                                       |
| --------------- | -------------------------- | ------------------------------------------ |
| BlueBubbles     | `@openclaw/bluebubbles`    | [BlueBubbles](/zh-CN/channels/bluebubbles)       |
| Discord         | `@openclaw/discord`        | [Discord](/zh-CN/channels/discord)               |
| Feishu          | `@openclaw/feishu`         | [Feishu](/zh-CN/channels/feishu)                 |
| Matrix          | `@openclaw/matrix`         | [Matrix](/zh-CN/channels/matrix)                 |
| Mattermost      | `@openclaw/mattermost`     | [Mattermost](/zh-CN/channels/mattermost)         |
| Microsoft Teams | `@openclaw/msteams`        | [Microsoft Teams](/zh-CN/channels/msteams)       |
| Nextcloud Talk  | `@openclaw/nextcloud-talk` | [Nextcloud Talk](/zh-CN/channels/nextcloud-talk) |
| Nostr           | `@openclaw/nostr`          | [Nostr](/zh-CN/channels/nostr)                   |
| Synology Chat   | `@openclaw/synology-chat`  | [Synology Chat](/zh-CN/channels/synology-chat)   |
| Tlon            | `@openclaw/tlon`           | [Tlon](/zh-CN/channels/tlon)                     |
| WhatsApp        | `@openclaw/whatsapp`       | [WhatsApp](/zh-CN/channels/whatsapp)             |
| Zalo            | `@openclaw/zalo`           | [Zalo](/zh-CN/channels/zalo)                     |
| Zalo Personal   | `@openclaw/zalouser`       | [Zalo Personal](/zh-CN/plugins/zalouser)         |

### Core（随 OpenClaw 一起发布）

<AccordionGroup>
  <Accordion title="Model providers (enabled by default)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory plugins">
    - `memory-core` — 内置记忆搜索（默认通过 `plugins.slots.memory`）
    - `memory-lancedb` — 基于 LanceDB 的长期记忆，支持自动召回/捕获（设置 `plugins.slots.memory = "memory-lancedb"`）

    请参阅 [Memory LanceDB](/zh-CN/plugins/memory-lancedb) 了解 OpenAI 兼容的 embedding 设置、Ollama 示例、召回限制和故障排除。

  </Accordion>

  <Accordion title="Speech providers (enabled by default)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Other">
    - `browser` — 用于浏览器工具、`openclaw browser` CLI、`browser.request` Gateway 网关方法、浏览器运行时以及默认浏览器控制服务的内置浏览器插件（默认启用；替换前请先禁用）
    - `copilot-proxy` — VS Code Copilot Proxy 桥接（默认禁用）

  </Accordion>
</AccordionGroup>

在寻找第三方插件？请参阅 [Community Plugins](/zh-CN/plugins/community)。

## 配置

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| 字段             | 描述                                                      |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | 主开关（默认值：`true`）                                  |
| `allow`          | 插件允许列表（可选）                                      |
| `deny`           | 插件拒绝列表（可选；拒绝优先）                            |
| `load.paths`     | 额外插件文件/目录                                         |
| `slots`          | 独占 slot 选择器（例如 `memory`、`contextEngine`）         |
| `entries.\<id\>` | 单插件开关 + 配置                                         |

`plugins.allow` 是排他的。当它非空时，只有列出的插件可以加载或暴露工具，即使 `tools.allow` 包含 `"*"` 或某个特定的插件自有工具名也是如此。如果工具允许列表引用插件工具，请将所属插件 id 添加到 `plugins.allow`，或移除 `plugins.allow`；`openclaw doctor` 会警告这种形态。

配置变更**需要重启 Gateway 网关**。如果 Gateway 网关在启用配置监视 + 进程内重启的情况下运行（默认的 `openclaw gateway` 路径），该重启通常会在配置写入落地后片刻自动执行。Native 插件运行时代码或生命周期钩子没有受支持的热重载路径；在期待更新后的 `register(api)` 代码、`api.on(...)` 钩子、工具、服务或提供商/运行时钩子运行前，请重启正在服务实时渠道的 Gateway 网关进程。

`openclaw plugins list` 是本地插件 registry/config 快照。其中的 `enabled` 插件表示持久化 registry 和当前配置允许该插件参与。它不能证明已经运行的远程 Gateway 网关子进程已经重启到相同的插件代码。在带有包装器进程的 VPS/容器设置中，请将重启发送给实际的 `openclaw gateway run` 进程，或对正在运行的 Gateway 网关使用 `openclaw gateway restart`。

<Accordion title="Plugin states: disabled vs missing vs invalid">
  - **Disabled**：插件存在，但启用规则将其关闭。配置会被保留。
  - **Missing**：配置引用了一个设备发现未找到的插件 id。
  - **Invalid**：插件存在，但其配置与声明的 schema 不匹配。Gateway 网关启动只会跳过该插件；`openclaw doctor --fix` 可以通过禁用该条目并移除其配置载荷来隔离无效条目。

</Accordion>

## 设备发现和优先级

OpenClaw 按以下顺序扫描插件（首次匹配优先）：

<Steps>
  <Step title="Config paths">
    `plugins.load.paths` — 显式文件或目录路径。指回 OpenClaw 自身打包内置插件目录的路径会被忽略；
    运行 `openclaw doctor --fix` 移除这些过期别名。
  </Step>

  <Step title="Workspace plugins">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` 和 `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="Global plugins">
    `~/.openclaw/<plugin-root>/*.ts` 和 `~/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="Bundled plugins">
    随 OpenClaw 一起提供。许多默认启用（模型提供商、语音）。
    其他则需要显式启用。
  </Step>
</Steps>

打包安装和 Docker 镜像通常会从已编译的 `dist/extensions` 树解析内置插件。如果某个内置插件源目录被绑定挂载到匹配的打包源路径上，例如 `/app/extensions/synology-chat`，OpenClaw 会将该挂载的源目录视为内置源覆盖层，并在打包的 `/app/dist/extensions/synology-chat` bundle 之前发现它。这样可以让维护者容器循环继续工作，而无需把每个内置插件都切回 TypeScript 源码。设置 `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` 可强制使用打包后的 dist bundle，即使存在源覆盖层挂载也是如此。

### 启用规则

- `plugins.enabled: false` 会禁用所有插件，并跳过插件发现/加载工作
- `plugins.deny` 始终优先于 allow
- `plugins.entries.\<id\>.enabled: false` 会禁用该插件
- 工作区来源的插件**默认禁用**（必须显式启用）
- 内置插件会遵循内建的默认启用集合，除非被覆盖
- 互斥槽位可以强制启用该槽位所选的插件
- 当配置命名了插件拥有的表面时，一些内置的可选插件会自动启用，例如提供商模型引用、渠道配置或 harness 运行时
- 当 `plugins.enabled: false` 处于激活状态时，过期插件配置会被保留；如果你想移除过期 ID，请先重新启用插件，再运行 Doctor 清理
- OpenAI 系列 Codex 路由保持独立的插件边界：
  `openai-codex/*` 属于 OpenAI 插件，而内置 Codex
  应用服务器插件由 `agentRuntime.id: "codex"` 或旧版
  `codex/*` 模型引用选择

## 运行时钩子故障排除

如果插件出现在 `plugins list` 中，但 `register(api)` 副作用或钩子没有在实时聊天流量中运行，请先检查这些项：

- 运行 `openclaw gateway status --deep --require-rpc`，并确认活动的 Gateway 网关 URL、配置文件、配置路径和进程就是你正在编辑的那些。
- 在插件安装/配置/代码更改后重启实时 Gateway 网关。在包装容器中，PID 1 可能只是一个 supervisor；请重启或向子 `openclaw gateway run` 进程发送信号。
- 使用 `openclaw plugins inspect <id> --runtime --json` 确认钩子注册和诊断。非内置会话钩子（如 `llm_input`、`llm_output`、`before_agent_finalize` 和 `agent_end`）需要 `plugins.entries.<id>.hooks.allowConversationAccess=true`。
- 对于模型切换，优先使用 `before_model_resolve`。它会在智能体轮次的模型解析之前运行；`llm_output` 仅在一次模型尝试生成 assistant 输出后运行。
- 要证明有效会话模型，请使用 `openclaw sessions` 或 Gateway 网关会话/Status 表面；调试提供商 payload 时，请使用 `--raw-stream --raw-stream-path <path>` 启动 Gateway 网关。

### 重复的渠道或工具所有权

症状：

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

这些表示多个已启用插件正在尝试拥有同一个渠道、设置流程或工具名称。最常见原因是外部渠道插件安装在某个内置插件旁边，而该内置插件现在也提供相同的渠道 ID。

调试步骤：

- 运行 `openclaw plugins list --enabled --verbose` 查看每个已启用插件及其来源。
- 对每个可疑插件运行 `openclaw plugins inspect <id> --runtime --json`，并比较 `channels`、`channelConfigs`、`tools` 和诊断。
- 安装或移除插件包后，运行 `openclaw plugins registry --refresh`，以便持久化元数据反映当前安装。
- 在安装、注册表或配置更改后重启 Gateway 网关。

修复选项：

- 如果一个插件有意替换另一个相同渠道 ID 的插件，首选插件应声明 `channelConfigs.<channel-id>.preferOver`，并填入较低优先级的插件 ID。参见 [/plugins/manifest#replacing-another-channel-plugin](/zh-CN/plugins/manifest#replacing-another-channel-plugin)。
- 如果重复是意外造成的，请使用 `plugins.entries.<plugin-id>.enabled: false` 禁用一方，或移除过期的插件安装。
- 如果你显式启用了两个插件，OpenClaw 会保留该请求并报告冲突。为该渠道选择一个所有者，或重命名插件拥有的工具，使运行时表面明确无歧义。

## 插件槽位（互斥类别）

某些类别是互斥的（同一时间只能有一个处于活动状态）：

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // or "none" to disable
      contextEngine: "legacy", // or a plugin id
    },
  },
}
```

| 槽位            | 控制内容              | 默认值              |
| --------------- | --------------------- | ------------------- |
| `memory`        | 主动记忆插件          | `memory-core`       |
| `contextEngine` | 活动上下文引擎        | `legacy`（内建）    |

## CLI 参考

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
openclaw plugins inspect <id>              # static detail
openclaw plugins inspect <id> --runtime    # registered hooks/tools/CLI/gateway methods
openclaw plugins inspect <id> --json       # machine-readable
openclaw plugins inspect --all             # fleet-wide table
openclaw plugins info <id>                 # inspect alias
openclaw plugins doctor                    # diagnostics
openclaw plugins registry                  # inspect persisted registry state
openclaw plugins registry --refresh        # rebuild persisted registry
openclaw doctor --fix                      # repair plugin registry state

openclaw plugins install <package>         # install (ClawHub first, then npm)
openclaw plugins install clawhub:<pkg>     # install from ClawHub only
openclaw plugins install npm:<pkg>         # install from npm only
openclaw plugins install git:<repo>        # install from git
openclaw plugins install git:<repo>@<ref>  # install from git ref
openclaw plugins install <spec> --force    # overwrite existing install
openclaw plugins install <path>            # install from local path
openclaw plugins install -l <path>         # link (no copy) for dev
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # record exact resolved npm spec
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # update one plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # update all
openclaw plugins uninstall <id>          # remove config and plugin index records
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

# Verify runtime registrations after install.
openclaw plugins inspect <id> --runtime --json

# Run plugin-owned CLI commands directly from the OpenClaw root CLI.
openclaw <plugin-command> --help

openclaw plugins enable <id>
openclaw plugins disable <id>
```

内置插件随 OpenClaw 一起提供。许多默认启用（例如内置模型提供商、内置语音提供商和内置浏览器插件）。其他内置插件仍需要 `openclaw plugins enable <id>`。

`--force` 会原地覆盖现有已安装插件或钩子包。对于已跟踪 npm 插件的常规升级，请使用 `openclaw plugins update <id-or-npm-spec>`。它不支持与 `--link` 一起使用，因为 `--link` 会复用源路径，而不是复制到受管理的安装目标上。

当 `plugins.allow` 已设置时，`openclaw plugins install` 会在启用已安装插件前，将该插件 ID 添加到该允许列表。如果同一个插件 ID 存在于 `plugins.deny` 中，安装会移除该过期 deny 条目，以便显式安装在重启后立即可加载。

OpenClaw 会保留一个持久化本地插件注册表，作为插件清单、贡献所有权和启动规划的冷读模型。安装、更新、卸载、启用和禁用流程会在更改插件状态后刷新该注册表。同一个 `plugins/installs.json` 文件会在顶层 `installRecords` 中保留持久安装元数据，并在 `plugins` 中保留可重建的 manifest 元数据。如果注册表缺失、过期或无效，`openclaw plugins registry --refresh` 会从安装记录、配置策略和 manifest/package 元数据重建其 manifest 视图，而不会加载插件运行时模块。
`openclaw plugins update <id-or-npm-spec>` 适用于已跟踪安装。传入带有 dist-tag 或确切版本的 npm 包 spec 时，会将包名解析回已跟踪插件记录，并记录新的 spec 用于未来更新。传入不带版本的包名会将一个精确固定的安装移回注册表的默认发布线。如果已安装的 npm 插件已经匹配解析出的版本和记录的 artifact 身份，OpenClaw 会跳过更新，不下载、不重新安装，也不重写配置。

`--pin` 仅适用于 npm。它不支持与 `--marketplace` 一起使用，因为 marketplace 安装会持久化 marketplace 源元数据，而不是 npm spec。

`--dangerously-force-unsafe-install` 是用于内建危险代码扫描器误报的破窗覆盖项。它允许插件安装和插件更新越过内建 `critical` 发现继续执行，但仍不会绕过插件 `before_install` 策略阻止或扫描失败阻止。安装扫描会忽略常见测试文件和目录，例如 `tests/`、`__tests__/`、`*.test.*` 和 `*.spec.*`，以避免阻止打包的测试 mock；声明的插件运行时入口点即使使用这些名称之一，仍会被扫描。

该 CLI 标志仅适用于插件安装/更新流程。由 Gateway 网关支持的 skill 依赖安装会改用匹配的 `dangerouslyForceUnsafeInstall` 请求覆盖项，而 `openclaw skills install` 仍是独立的 ClawHub skill 下载/安装流程。

如果你在 ClawHub 发布的插件被扫描隐藏或阻止，请打开 ClawHub dashboard，或运行 `clawhub package rescan <name>` 请求 ClawHub 再次检查它。`--dangerously-force-unsafe-install` 只影响你自己机器上的安装；它不会请求 ClawHub 重新扫描该插件，也不会让被阻止的发布变为公开。

兼容 bundle 会参与同一套插件 list/inspect/enable/disable 流程。当前运行时支持包括 bundle skills、Claude command-skills、Claude `settings.json` 默认值、Claude `.lsp.json` 和 manifest 声明的 `lspServers` 默认值、Cursor command-skills，以及兼容的 Codex 钩子目录。

`openclaw plugins inspect <id>` 还会报告检测到的 bundle 能力，以及 bundle 支持插件所支持或不支持的 MCP 和 LSP 服务器条目。

Marketplace 来源可以是 `~/.claude/plugins/known_marketplaces.json` 中的 Claude 已知 Marketplace 名称、本地 Marketplace 根目录或 `marketplace.json` 路径、类似 `owner/repo` 的 GitHub 简写、GitHub 仓库 URL，或 git URL。对于远程 Marketplace，插件条目必须保留在克隆的 Marketplace 仓库内，并且只能使用相对路径来源。

了解详情，请参阅 [`openclaw plugins` CLI 参考](/zh-CN/cli/plugins)。

## 插件 API 概览

原生插件会导出一个入口对象，该对象公开 `register(api)`。较旧的插件可能仍使用 `activate(api)` 作为旧版别名，但新插件应使用 `register`。

```typescript
export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
    api.registerChannel({
      /* ... */
    });
  },
});
```

OpenClaw 会加载入口对象，并在插件激活期间调用 `register(api)`。加载器仍会为较旧插件回退到 `activate(api)`，但内置插件和新的外部插件应将 `register` 视为公共契约。

`api.registrationMode` 会告诉插件其入口为何被加载：

| 模式            | 含义                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | 运行时激活。注册工具、钩子、服务、命令、路由以及其他实时副作用。                              |
| `discovery`     | 只读能力发现。注册提供商和元数据；受信任的插件入口代码可能会加载，但应跳过实时副作用。 |
| `setup-only`    | 通过轻量级设置入口加载渠道设置元数据。                                                                |
| `setup-runtime` | 同时需要运行时入口的渠道设置加载。                                                                         |
| `cli-metadata`  | 仅收集 CLI 命令元数据。                                                                                            |

会打开套接字、数据库、后台 worker 或长生命周期客户端的插件入口，应使用 `api.registrationMode === "full"` 保护这些副作用。发现加载会与激活加载分开缓存，并且不会替换正在运行的 Gateway 网关注册表。发现是非激活的，而不是免导入的：OpenClaw 可能会执行受信任的插件入口或渠道插件模块来构建快照。让模块顶层保持轻量且无副作用，并将网络客户端、子进程、监听器、凭据读取和服务启动移到完整运行时路径之后。

常见注册方法：

| 方法                                  | 注册内容           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | 模型提供商（LLM）        |
| `registerChannel`                       | 聊天渠道                |
| `registerTool`                          | Agent 工具                  |
| `registerHook` / `on(...)`              | 生命周期钩子             |
| `registerSpeechProvider`                | 文本转语音 / STT        |
| `registerRealtimeTranscriptionProvider` | 流式 STT               |
| `registerRealtimeVoiceProvider`         | 双工实时语音       |
| `registerMediaUnderstandingProvider`    | 图像/音频分析        |
| `registerImageGenerationProvider`       | 图像生成            |
| `registerMusicGenerationProvider`       | 音乐生成            |
| `registerVideoGenerationProvider`       | 视频生成            |
| `registerWebFetchProvider`              | Web 获取 / 抓取提供商 |
| `registerWebSearchProvider`             | Web 搜索                  |
| `registerHttpRoute`                     | HTTP 端点               |
| `registerCommand` / `registerCli`       | CLI 命令                |
| `registerContextEngine`                 | 上下文引擎              |
| `registerService`                       | 后台服务          |

类型化生命周期钩子的钩子保护行为：

- `before_tool_call`: `{ block: true }` 为终止性结果；低优先级处理程序会被跳过。
- `before_tool_call`: `{ block: false }` 为空操作，并且不会清除先前的阻止。
- `before_install`: `{ block: true }` 为终止性结果；低优先级处理程序会被跳过。
- `before_install`: `{ block: false }` 为空操作，并且不会清除先前的阻止。
- `message_sending`: `{ cancel: true }` 为终止性结果；低优先级处理程序会被跳过。
- `message_sending`: `{ cancel: false }` 为空操作，并且不会清除先前的取消。

原生 Codex app-server 会将 Codex 原生工具事件桥接回此钩子表面。插件可以通过 `before_tool_call` 阻止原生 Codex 工具，通过 `after_tool_call` 观察结果，并参与 Codex `PermissionRequest` 批准。该桥接尚不会重写 Codex 原生工具参数。确切的 Codex 运行时支持边界见 [Codex harness v1 支持契约](/zh-CN/plugins/codex-harness#v1-support-contract)。

如需完整的类型化钩子行为，请参阅 [SDK 概览](/zh-CN/plugins/sdk-overview#hook-decision-semantics)。

## 相关

- [构建插件](/zh-CN/plugins/building-plugins) — 创建你自己的插件
- [插件包](/zh-CN/plugins/bundles) — Codex/Claude/Cursor 包兼容性
- [插件清单](/zh-CN/plugins/manifest) — 清单 schema
- [注册工具](/zh-CN/plugins/building-plugins#registering-agent-tools) — 在插件中添加 agent 工具
- [插件内部机制](/zh-CN/plugins/architecture) — 能力模型和加载流水线
- [社区插件](/zh-CN/plugins/community) — 第三方列表
