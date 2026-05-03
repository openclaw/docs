---
read_when:
    - 安装或配置插件
    - 了解插件发现和加载规则
    - 使用兼容 Codex/Claude 的插件包
sidebarTitle: Install and Configure
summary: 安装、配置和管理 OpenClaw 插件
title: 插件
x-i18n:
    generated_at: "2026-05-03T13:32:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 037b0e672efc1009a75af0c01d8f83d249e738e96524a33225e2b7ed4c62d950
    source_path: tools/plugin.md
    workflow: 16
---

插件通过新增功能来扩展 OpenClaw：渠道、模型提供商、智能体 harness、工具、Skills、语音、实时转写、实时语音、媒体理解、图像生成、视频生成、网页抓取、网页搜索等。一些插件是**核心**插件（随 OpenClaw 提供），另一些是**外部**插件。大多数外部插件通过 [ClawHub](/zh-CN/tools/clawhub) 发布和发现。npm 仍支持直接安装，也支持一组临时的 OpenClaw 自有插件包，直到迁移完成。

## 快速开始

如需可直接复制粘贴的安装、列出、卸载、更新和发布示例，请参阅
[管理插件](/zh-CN/plugins/manage-plugins)。

<Steps>
  <Step title="查看已加载内容">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="安装插件">
    ```bash
    # Search ClawHub plugins
    openclaw plugins search "calendar"

    # From ClawHub
    openclaw plugins install clawhub:openclaw-codex-app-server

    # From npm
    openclaw plugins install npm:@acme/openclaw-plugin

    # From git
    openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0

    # From a local directory or archive
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="重启 Gateway 网关">
    ```bash
    openclaw gateway restart
    ```

    然后在你的配置文件中的 `plugins.entries.\<id\>.config` 下配置。

  </Step>

  <Step title="聊天原生管理">
    在运行中的 Gateway 网关中，仅所有者可用的 `/plugins enable` 和 `/plugins disable`
    会触发 Gateway 网关配置重载器。Gateway 网关会在进程内重载插件运行时表面，新的智能体轮次会基于刷新后的注册表重新构建工具列表。`/plugins install` 会更改插件源代码，因此 Gateway 网关会请求重启，而不是假装当前进程可以安全重载已导入的模块。

  </Step>

  <Step title="验证插件">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    当你需要证明已注册的工具、服务、gateway 方法、钩子或插件自有 CLI 命令时，使用 `--runtime`。普通 `inspect` 是冷态清单/注册表检查，并且会有意避免导入插件运行时。

  </Step>
</Steps>

如果你更偏好聊天原生控制，请启用 `commands.plugins: true` 并使用：

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

安装路径使用与 CLI 相同的解析器：本地路径/归档、显式 `clawhub:<pkg>`、显式 `npm:<pkg>`、显式 `git:<repo>`，或通过 npm 解析的裸包规格。

如果配置无效，安装通常会失败关闭，并指向 `openclaw doctor --fix`。唯一的恢复例外是一条很窄的内置插件重装路径，适用于选择加入 `openclaw.install.allowInvalidConfigRecovery` 的插件。
在 Gateway 网关启动期间，某个插件的无效配置会被隔离到该插件：启动日志会记录 `plugins.entries.<id>.config` 问题，在加载期间跳过该插件，并保持其他插件和渠道在线。运行 `openclaw doctor --fix` 可通过禁用该插件条目并移除其无效配置载荷来隔离错误的插件配置；正常的配置备份会保留之前的值。
当某个渠道配置引用了一个不再可发现的插件，但同一个过期插件 id 仍保留在插件配置或安装记录中时，Gateway 网关启动会记录警告并跳过该渠道，而不是阻塞所有其他渠道。运行 `openclaw doctor --fix` 可移除过期的渠道/插件条目；没有过期插件证据的未知渠道键仍会导致校验失败，因此拼写错误仍然可见。
如果设置了 `plugins.enabled: false`，过期插件引用会被视为惰性：Gateway 网关启动会跳过插件发现/加载工作，`openclaw doctor` 会保留已禁用的插件配置，而不是自动移除它。如果你想移除过期插件 id，请在运行 doctor 清理前重新启用插件。

插件依赖安装只会在显式安装/更新或 doctor 修复流程中发生。Gateway 网关启动、配置重载和运行时检查不会运行包管理器，也不会修复依赖树。本地插件必须已经安装其依赖，而 npm、git 和 ClawHub 插件会安装到 OpenClaw 管理的插件根目录下。npm 依赖可能会在 OpenClaw 管理的 npm 根目录中提升；安装/更新会在信任前扫描该管理根目录，卸载则通过 npm 移除 npm 管理的包。外部插件和自定义加载路径仍必须通过 `openclaw plugins install` 安装。
使用 `openclaw plugins list --json` 可以查看每个可见插件的静态 `dependencyStatus`，不会导入运行时代码，也不会修复依赖。
请参阅[插件依赖解析](/zh-CN/plugins/dependency-resolution)了解安装时生命周期。

对于 npm 安装，`latest` 或 dist-tag 等可变选择器会在安装前解析，然后固定为 OpenClaw 管理的 npm 根目录中经过精确验证的版本。npm 完成后，OpenClaw 会验证已安装的 `package-lock.json` 条目是否仍匹配解析后的版本和完整性。如果 npm 写入了不同的包元数据，安装会失败，并回滚托管包，而不是接受不同的插件产物。

源码 checkout 是 pnpm workspace。如果你克隆 OpenClaw 来修改内置插件，请运行 `pnpm install`；OpenClaw 随后会从 `extensions/<id>` 加载内置插件，因此会直接使用编辑内容和包本地依赖。普通 npm 根安装适用于已打包的 OpenClaw，而不是源码 checkout 开发。

## 插件类型

OpenClaw 识别两种插件格式：

| 格式     | 工作方式                                                       | 示例                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **原生** | `openclaw.plugin.json` + 运行时模块；在进程内执行       | 官方插件、社区 npm 包               |
| **Bundle** | Codex/Claude/Cursor 兼容布局；映射到 OpenClaw 功能 | `.codex-plugin/`、`.claude-plugin/`、`.cursor-plugin/` |

两者都会显示在 `openclaw plugins list` 下。Bundle 详情请参阅 [Plugin Bundles](/zh-CN/plugins/bundles)。

如果你正在编写原生插件，请从[构建插件](/zh-CN/plugins/building-plugins)
和[插件 SDK 概览](/zh-CN/plugins/sdk-overview)开始。

## 包入口点

原生插件 npm 包必须在 `package.json` 中声明 `openclaw.extensions`。
每个条目必须留在包目录内，并解析为可读取的运行时文件，或者解析为一个 TypeScript 源文件，并带有推断出的已构建 JavaScript 对等文件，例如 `src/index.ts` 对应 `dist/index.js`。

当发布的运行时文件与源条目路径不一致时，请使用 `openclaw.runtimeExtensions`。如果存在，`runtimeExtensions` 必须为每个 `extensions` 条目精确包含一个条目。列表不匹配会导致安装和插件发现失败，而不是静默回退到源路径。如果你还发布 `openclaw.setupEntry`，请为其已构建的 JavaScript 对等文件使用 `openclaw.runtimeSetupEntry`；声明后该文件是必需的。

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

### 迁移期间的 OpenClaw 自有 npm 包

ClawHub 是大多数插件的主要分发路径。当前已打包的 OpenClaw 版本已经内置许多官方插件，因此在正常设置中不需要单独安装 npm。直到每个 OpenClaw 自有插件都迁移到 ClawHub 之前，OpenClaw 仍会在 npm 上发布一些 `@openclaw/*` 插件包，用于较旧/自定义安装和直接 npm 工作流。

如果 npm 将某个 `@openclaw/*` 插件包报告为 deprecated，该包版本来自较旧的外部包发布线。请使用当前 OpenClaw 的内置插件或本地 checkout，直到发布更新的 npm 包。

| 插件          | 包                    | 文档                                       |
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

### 核心（随 OpenClaw 提供）

<AccordionGroup>
  <Accordion title="模型提供商（默认启用）">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="记忆插件">
    - `memory-core` — 内置记忆搜索（默认通过 `plugins.slots.memory`）
    - `memory-lancedb` — 基于 LanceDB 的长期记忆，支持自动召回/捕获（设置 `plugins.slots.memory = "memory-lancedb"`）

    请参阅 [Memory LanceDB](/zh-CN/plugins/memory-lancedb) 了解 OpenAI 兼容的 embedding 设置、Ollama 示例、召回限制和故障排除。

  </Accordion>

  <Accordion title="语音提供商（默认启用）">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="其他">
    - `browser` — 用于浏览器工具、`openclaw browser` CLI、`browser.request` gateway 方法、浏览器运行时和默认浏览器控制服务的内置浏览器插件（默认启用；替换前请禁用）
    - `copilot-proxy` — VS Code Copilot Proxy 桥接（默认禁用）

  </Accordion>
</AccordionGroup>

在找第三方插件？请参阅 [Community Plugins](/zh-CN/plugins/community)。

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

| 字段            | 描述                                               |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | 主开关（默认值：`true`）                           |
| `allow`          | 插件允许列表（可选）                               |
| `deny`           | 插件拒绝列表（可选；拒绝优先）                     |
| `load.paths`     | 额外插件文件/目录                            |
| `slots`          | 独占槽位选择器（例如 `memory`、`contextEngine`） |
| `entries.\<id\>` | 每个插件的开关 + 配置                               |

`plugins.allow` 是独占的。当它非空时，只有列出的插件可以加载
或暴露工具，即使 `tools.allow` 包含 `"*"` 或某个特定的插件自有
工具名称。如果某个工具允许列表引用插件工具，请将所属插件 id
添加到 `plugins.allow`，或移除 `plugins.allow`；`openclaw doctor` 会对此
形态发出警告。

通过 `/plugins enable` 或 `/plugins disable` 进行的配置更改会触发
进程内 Gateway 网关插件重新加载。新的智能体轮次会从刷新后的插件注册表
重建其工具列表。安装、更新和卸载等更改源代码的操作仍会重启 Gateway 网关
进程，因为已导入的插件模块无法安全地原地替换。

`openclaw plugins list` 是本地插件注册表/配置快照。那里的
`enabled` 插件表示持久化注册表和当前配置允许该插件参与。
它并不能证明已运行的远程 Gateway 网关已经重新加载或重启到相同的插件代码。
在带有包装进程的 VPS/容器设置中，请将重启或触发重新加载的写入发送到实际的
`openclaw gateway run` 进程，或在重新加载报告失败时，对正在运行的
Gateway 网关使用 `openclaw gateway restart`。

<Accordion title="插件状态：已禁用 vs 缺失 vs 无效">
  - **已禁用**：插件存在，但启用规则将其关闭。配置会被保留。
  - **缺失**：配置引用了设备发现未找到的插件 id。
  - **无效**：插件存在，但其配置与声明的 schema 不匹配。Gateway 网关启动时只跳过该插件；`openclaw doctor --fix` 可以通过禁用它并移除其配置负载来隔离无效条目。

</Accordion>

## 设备发现和优先级

OpenClaw 按以下顺序扫描插件（第一个匹配项优先）：

<Steps>
  <Step title="配置路径">
    `plugins.load.paths` — 显式文件或目录路径。指回
    OpenClaw 自身打包内置插件目录的路径会被忽略；
    运行 `openclaw doctor --fix` 可移除这些过期别名。
  </Step>

  <Step title="工作区插件">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` 和 `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="全局插件">
    `~/.openclaw/<plugin-root>/*.ts` 和 `~/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="内置插件">
    随 OpenClaw 一起发布。许多默认启用（模型提供商、语音）。
    其他插件需要显式启用。
  </Step>
</Steps>

打包安装和 Docker 镜像通常会从编译后的 `dist/extensions` 树解析内置插件。
如果某个内置插件源目录被 bind mount 到匹配的打包源路径上，例如
`/app/extensions/synology-chat`，OpenClaw 会将该挂载的源目录视为内置源覆盖层，
并在打包的 `/app/dist/extensions/synology-chat` bundle 之前发现它。
这让维护者容器循环无需将每个内置插件都切回 TypeScript 源代码即可工作。
设置 `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` 可强制使用打包的 dist bundle，
即使存在源覆盖层挂载也是如此。

### 启用规则

- `plugins.enabled: false` 会禁用所有插件并跳过插件发现/加载工作
- `plugins.deny` 始终优先于 allow
- `plugins.entries.\<id\>.enabled: false` 会禁用该插件
- 工作区来源的插件**默认禁用**（必须显式启用）
- 内置插件遵循内置默认开启集合，除非被覆盖
- 独占槽位可以为该槽位强制启用选定的插件
- 当配置命名某个插件自有表面时，某些内置的选择加入插件会自动启用，
  例如提供商模型 ref、渠道配置或 harness 运行时
- 当 `plugins.enabled: false` 生效时，过期插件配置会被保留；
  如果你希望移除过期 id，请先重新启用插件再运行 Doctor 清理
- OpenAI 系 Codex 路由保持独立的插件边界：
  `openai-codex/*` 属于 OpenAI 插件，而内置 Codex
  app-server 插件由 `agentRuntime.id: "codex"` 或旧版
  `codex/*` 模型 refs 选择

## 排查运行时钩子

如果某个插件出现在 `plugins list` 中，但 `register(api)` 副作用或钩子
没有在实时聊天流量中运行，请先检查以下内容：

- 运行 `openclaw gateway status --deep --require-rpc`，并确认活跃的
  Gateway 网关 URL、profile、配置路径和进程就是你正在编辑的对象。
- 在插件安装/配置/代码更改后重启实时 Gateway 网关。在包装器
  容器中，PID 1 可能只是一个 supervisor；请重启或向子
  `openclaw gateway run` 进程发送信号。
- 使用 `openclaw plugins inspect <id> --runtime --json` 确认钩子注册和
  诊断。非内置会话钩子，例如 `llm_input`、
  `llm_output`、`before_agent_finalize` 和 `agent_end`，需要
  `plugins.entries.<id>.hooks.allowConversationAccess=true`。
- 对于模型切换，优先使用 `before_model_resolve`。它会在智能体轮次的模型
  解析之前运行；`llm_output` 只会在一次模型尝试产生助手输出后运行。
- 要证明有效的会话模型，请使用 `openclaw sessions` 或
  Gateway 网关会话/Status 表面；调试提供商负载时，请使用
  `--raw-stream --raw-stream-path <path>` 启动 Gateway 网关。

### 插件工具设置缓慢

如果智能体轮次在准备工具时似乎停滞，请启用 trace 日志并
检查插件工具工厂耗时行：

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

查找：

```text
[trace:plugin-tools] factory timings ...
```

摘要会列出总工厂耗时和最慢的插件工具工厂，
包括插件 id、声明的工具名称、结果形态，以及该工具是否
可选。当单个工厂耗时至少 1 秒或插件工具工厂准备总耗时至少 5 秒时，
慢速行会提升为警告。

OpenClaw 会为相同有效请求上下文中的重复解析缓存成功的插件工具工厂结果。
缓存键包括有效的运行时配置、工作区、智能体/会话 id、沙箱策略、浏览器设置、
交付上下文、请求者身份和所有权状态，因此依赖这些可信字段的工厂会在上下文变化时
重新运行。

如果某个插件主导耗时，请检查其运行时注册：

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

然后更新、重新安装或禁用该插件。插件作者应将昂贵的依赖加载移到
工具执行路径之后，而不是在工具工厂内部执行。

### 重复的渠道或工具所有权

症状：

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

这些表示不止一个已启用插件正在尝试拥有同一个渠道、
设置流程或工具名称。最常见原因是外部渠道插件与现在提供相同渠道 id 的内置插件
同时安装。

调试步骤：

- 运行 `openclaw plugins list --enabled --verbose` 查看每个已启用插件
  及其来源。
- 对每个疑似插件运行 `openclaw plugins inspect <id> --runtime --json`，
  并比较 `channels`、`channelConfigs`、`tools` 和诊断。
- 安装或移除插件包后运行 `openclaw plugins registry --refresh`，
  以便持久化元数据反映当前安装。
- 在安装、注册表或配置更改后重启 Gateway 网关。

修复选项：

- 如果某个插件有意为同一渠道 id 替换另一个插件，
  首选插件应声明 `channelConfigs.<channel-id>.preferOver`，并填入
  较低优先级的插件 id。请参阅 [/plugins/manifest#replacing-another-channel-plugin](/zh-CN/plugins/manifest#replacing-another-channel-plugin)。
- 如果重复是意外造成的，请使用
  `plugins.entries.<plugin-id>.enabled: false` 禁用一方，或移除过期的插件
  安装。
- 如果你显式启用了两个插件，OpenClaw 会保留该请求并
  报告冲突。请为渠道选择一个所有者，或重命名插件自有
  工具，使运行时表面明确无歧义。

## 插件槽位（独占类别）

有些类别是独占的（一次只能有一个处于活跃状态）：

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

| 槽位            | 控制内容      | 默认值             |
| --------------- | --------------------- | ------------------- |
| `memory`        | 活跃记忆插件  | `memory-core`       |
| `contextEngine` | 活跃上下文引擎 | `legacy`（内置） |

## CLI 参考

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
openclaw plugins search <query>            # search ClawHub plugin catalog
openclaw plugins inspect <id>              # static detail
openclaw plugins inspect <id> --runtime    # registered hooks/tools/CLI/gateway methods
openclaw plugins inspect <id> --json       # machine-readable
openclaw plugins inspect --all             # fleet-wide table
openclaw plugins info <id>                 # inspect alias
openclaw plugins doctor                    # diagnostics
openclaw plugins registry                  # inspect persisted registry state
openclaw plugins registry --refresh        # rebuild persisted registry
openclaw doctor --fix                      # repair plugin registry state

openclaw plugins install <package>         # install from npm by default
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

内置插件随 OpenClaw 一起提供。许多插件默认启用（例如
内置模型提供商、内置语音提供商，以及内置浏览器
插件）。其他内置插件仍需要执行 `openclaw plugins enable <id>`。

`--force` 会原地覆盖已安装的现有插件或钩子包。对于已跟踪的 npm
插件的常规升级，请使用
`openclaw plugins update <id-or-npm-spec>`。它不支持与 `--link` 一起使用，因为
`--link` 会复用源路径，而不是复制到受管理的安装目标上。

当 `plugins.allow` 已设置时，`openclaw plugins install` 会在启用已安装插件之前，将
已安装的插件 id 添加到该允许列表。如果同一插件 id
存在于 `plugins.deny` 中，安装会移除该过时的 deny 条目，使显式安装在重启后立即可加载。

OpenClaw 会持久化一个本地插件注册表，作为
插件清单、贡献所有权和启动规划的冷读取模型。安装、更新、
卸载、启用和禁用流程会在更改插件状态后刷新该注册表。同一个 `plugins/installs.json` 文件会将持久安装元数据保存在
顶层 `installRecords` 中，并将可重建的清单元数据保存在 `plugins` 中。如果
注册表缺失、过时或无效，`openclaw plugins registry
--refresh` 会在不加载插件运行时模块的情况下，根据安装记录、配置策略和
清单/package 元数据重建其清单视图。
`openclaw plugins update <id-or-npm-spec>` 适用于已跟踪的安装。传入
带有 dist-tag 或精确版本的 npm package spec 时，会将 package 名称
解析回已跟踪的插件记录，并记录新的 spec 以供后续更新使用。
传入不带版本的 package 名称时，会将精确固定的安装移回
注册表的默认发布线。如果已安装的 npm 插件已经匹配
解析出的版本和记录的工件身份，OpenClaw 会跳过更新，
不会下载、重新安装或重写配置。
当 `openclaw update` 在 beta 渠道上运行时，默认线 npm 和 ClawHub
插件记录会先尝试 `@beta`，并在不存在插件 beta release 时回退到 default/latest。精确版本和显式标签会保持固定。

`--pin` 仅适用于 npm。它不支持与 `--marketplace` 一起使用，因为
marketplace 安装会持久化 marketplace 源元数据，而不是 npm spec。

`--dangerously-force-unsafe-install` 是针对内置危险代码扫描器误报的破窗覆盖选项。它允许插件安装
和插件更新在出现内置 `critical` 发现项后继续，但仍然
不会绕过插件 `before_install` 策略阻止或扫描失败阻止。
安装扫描会忽略常见测试文件和目录，例如 `tests/`、
`__tests__/`、`*.test.*` 和 `*.spec.*`，以避免阻止打包的测试 mock；
声明的插件运行时入口点即使使用这些名称之一，仍会被扫描。

此 CLI 标志仅适用于插件安装/更新流程。由 Gateway 网关支持的 skill
依赖安装改用匹配的 `dangerouslyForceUnsafeInstall` 请求
覆盖项，而 `openclaw skills install` 仍是单独的 ClawHub
skill 下载/安装流程。

如果你在 ClawHub 发布的插件被扫描隐藏或阻止，请打开
ClawHub dashboard，或运行 `clawhub package rescan <name>` 请求 ClawHub 再次检查。
`--dangerously-force-unsafe-install` 只影响你自己机器上的安装；
它不会请求 ClawHub 重新扫描插件，也不会让被阻止的 release
公开。

兼容包会参与同一套插件 list/inspect/enable/disable
流程。当前运行时支持包括包内 Skills、Claude command-skills、
Claude `settings.json` 默认值、Claude `.lsp.json` 和清单声明的
`lspServers` 默认值、Cursor command-skills，以及兼容的 Codex hook
目录。

`openclaw plugins inspect <id>` 还会报告检测到的包能力，以及
包支持的插件的受支持或不受支持的 MCP 和 LSP server 条目。

Marketplace 源可以是来自
`~/.claude/plugins/known_marketplaces.json` 的 Claude 已知 marketplace 名称、本地 marketplace 根目录或
`marketplace.json` 路径、类似 `owner/repo` 的 GitHub 简写、GitHub repo
URL，或 git URL。对于远程 marketplaces，插件条目必须保留在
克隆的 marketplace repo 内，并且只能使用相对路径源。

了解详情，请参阅 [`openclaw plugins` CLI 参考](/zh-CN/cli/plugins)。

## 插件 API 概览

原生插件会导出一个公开 `register(api)` 的入口对象。较旧的
插件可能仍使用 `activate(api)` 作为旧版别名，但新插件应该
使用 `register`。

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

OpenClaw 会加载入口对象，并在插件激活期间调用 `register(api)`。
加载器仍会为较旧插件回退到 `activate(api)`，但内置插件
和新的外部插件应将 `register` 视为公共契约。

`api.registrationMode` 会告知插件其入口为什么被加载：

| 模式            | 含义                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | 运行时激活。注册工具、钩子、服务、命令、路由和其他实时副作用。                              |
| `discovery`     | 只读能力发现。注册提供商和元数据；受信任的插件入口代码可以加载，但应跳过实时副作用。 |
| `setup-only`    | 通过轻量级设置入口加载渠道设置元数据。                                                                |
| `setup-runtime` | 还需要运行时入口的渠道设置加载。                                                                         |
| `cli-metadata`  | 仅收集 CLI 命令元数据。                                                                                            |

会打开 socket、数据库、后台 worker 或长生命周期
client 的插件入口，应使用 `api.registrationMode === "full"` 来保护这些副作用。
发现加载会与激活加载分开缓存，并且不会替换
正在运行的 Gateway 网关注册表。发现是非激活的，但不是免导入的：
OpenClaw 可能会求值受信任的插件入口或渠道插件模块来构建
快照。保持模块顶层轻量且无副作用，并将
网络 client、子进程、监听器、凭证读取和服务启动
移到完整运行时路径之后。

常用注册方法：

| 方法                                  | 注册内容           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | 模型提供商（LLM）        |
| `registerChannel`                       | 聊天渠道                |
| `registerTool`                          | 智能体工具                  |
| `registerHook` / `on(...)`              | 生命周期钩子             |
| `registerSpeechProvider`                | 文本转语音 / STT        |
| `registerRealtimeTranscriptionProvider` | 流式 STT               |
| `registerRealtimeVoiceProvider`         | 双向实时语音       |
| `registerMediaUnderstandingProvider`    | 图像/音频分析        |
| `registerImageGenerationProvider`       | 图像生成            |
| `registerMusicGenerationProvider`       | 音乐生成            |
| `registerVideoGenerationProvider`       | 视频生成            |
| `registerWebFetchProvider`              | Web 抓取 / 抓取提供商 |
| `registerWebSearchProvider`             | Web 搜索                  |
| `registerHttpRoute`                     | HTTP 端点               |
| `registerCommand` / `registerCli`       | CLI 命令                |
| `registerContextEngine`                 | 上下文引擎              |
| `registerService`                       | 后台服务          |

类型化生命周期钩子的钩子保护行为：

- `before_tool_call`：`{ block: true }` 是终止性的；会跳过较低优先级处理器。
- `before_tool_call`：`{ block: false }` 是 no-op，并且不会清除较早的阻止。
- `before_install`：`{ block: true }` 是终止性的；会跳过较低优先级处理器。
- `before_install`：`{ block: false }` 是 no-op，并且不会清除较早的阻止。
- `message_sending`：`{ cancel: true }` 是终止性的；会跳过较低优先级处理器。
- `message_sending`：`{ cancel: false }` 是 no-op，并且不会清除较早的取消。

原生 Codex app-server 会将桥接的 Codex 原生工具事件传回这个
钩子表面。插件可以通过 `before_tool_call` 阻止原生 Codex 工具，
通过 `after_tool_call` 观察结果，并参与 Codex
`PermissionRequest` 审批。桥接目前还不会重写 Codex 原生工具
参数。确切的 Codex 运行时支持边界位于
[Codex harness v1 支持契约](/zh-CN/plugins/codex-harness#v1-support-contract)。

完整的类型化钩子行为，请参阅 [SDK 概览](/zh-CN/plugins/sdk-overview#hook-decision-semantics)。

## 相关

- [构建插件](/zh-CN/plugins/building-plugins) — 创建你自己的插件
- [插件包](/zh-CN/plugins/bundles) — Codex/Claude/Cursor 包兼容性
- [插件清单](/zh-CN/plugins/manifest) — 清单 schema
- [注册工具](/zh-CN/plugins/building-plugins#registering-agent-tools) — 在插件中添加智能体工具
- [插件内部机制](/zh-CN/plugins/architecture) — 能力模型和加载流水线
- [社区插件](/zh-CN/plugins/community) — 第三方列表
