---
read_when:
    - 安装或配置插件
    - 了解插件发现和加载规则
    - 使用与 Codex/Claude 兼容的插件包
sidebarTitle: Install and Configure
summary: 安装、配置和管理 OpenClaw 插件
title: 插件
x-i18n:
    generated_at: "2026-05-03T15:53:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 937623bf3bfd7832680264b28deaef58970b35fdae7cfa0e5731c097eccc38e6
    source_path: tools/plugin.md
    workflow: 16
---

插件为 OpenClaw 扩展新能力：渠道、模型提供商、智能体执行框架、工具、Skills、语音、实时转写、实时语音、媒体理解、图像生成、视频生成、网页抓取、网页搜索等。有些插件是**核心**插件（随 OpenClaw 一起提供），另一些是**外部**插件。大多数外部插件通过 [ClawHub](/zh-CN/tools/clawhub) 发布和发现。在迁移完成之前，npm 仍支持直接安装，也会临时承载一组 OpenClaw 拥有的插件包。

## 快速开始

如需可直接复制粘贴的安装、列表查看、卸载、更新和发布示例，请参阅[管理插件](/zh-CN/plugins/manage-plugins)。

<Steps>
  <Step title="查看已加载的内容">
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

    然后在你的配置文件中的 `plugins.entries.\<id\>.config` 下进行配置。

  </Step>

  <Step title="聊天原生管理">
    在运行中的 Gateway 网关里，仅限所有者使用的 `/plugins enable` 和 `/plugins disable`
    会触发 Gateway 网关配置重新加载器。Gateway 网关会在进程内重新加载插件运行时表面，新的智能体轮次会从刷新后的注册表重建工具列表。`/plugins install` 会更改插件源代码，因此 Gateway 网关会请求重启，而不是假装当前进程可以安全地重新加载已经导入的模块。

  </Step>

  <Step title="验证插件">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    当你需要证明已注册的工具、服务、gateway 方法、钩子或插件拥有的 CLI 命令时，请使用 `--runtime`。普通 `inspect` 是冷态清单/注册表检查，并且有意避免导入插件运行时。

  </Step>
</Steps>

如果你偏好聊天原生控制，请启用 `commands.plugins: true` 并使用：

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

安装路径使用与 CLI 相同的解析器：本地路径/归档、显式 `clawhub:<pkg>`、显式 `npm:<pkg>`、显式 `git:<repo>`，或通过 npm 解析的裸包规范。

如果配置无效，安装通常会失败关闭，并指引你使用 `openclaw doctor --fix`。唯一的恢复例外是一条狭窄的内置插件重装路径，仅适用于选择加入 `openclaw.install.allowInvalidConfigRecovery` 的插件。
在 Gateway 网关启动期间，某个插件的无效配置会被隔离到该插件：启动会记录 `plugins.entries.<id>.config` 问题，加载时跳过该插件，并保持其他插件和渠道在线。运行 `openclaw doctor --fix` 可通过禁用该插件条目并移除其无效配置负载来隔离错误插件配置；正常的配置备份会保留此前的值。
当渠道配置引用了一个不再可发现的插件，但同一个过期插件 ID 仍保留在插件配置或安装记录中时，Gateway 网关启动会记录警告并跳过该渠道，而不是阻塞所有其他渠道。运行 `openclaw doctor --fix` 可移除过期的渠道/插件条目；没有过期插件证据的未知渠道键仍会验证失败，以便拼写错误保持可见。
如果设置了 `plugins.enabled: false`，过期插件引用会被视为非活动：Gateway 网关启动会跳过插件发现/加载工作，`openclaw doctor` 会保留已禁用的插件配置，而不是自动移除它。若你想移除过期插件 ID，请先重新启用插件再运行 doctor 清理。

插件依赖安装只会在显式安装/更新或 doctor 修复流程中发生。Gateway 网关启动、配置重新加载和运行时检查不会运行包管理器，也不会修复依赖树。本地插件必须已经安装其依赖，而 npm、git 和 ClawHub 插件会安装到 OpenClaw 的托管插件根目录下。npm 依赖可能会在 OpenClaw 的托管 npm 根目录内提升；安装/更新会先扫描该托管根目录，再进行信任判断，卸载会通过 npm 移除 npm 托管的包。外部插件和自定义加载路径仍必须通过 `openclaw plugins install` 安装。
使用 `openclaw plugins list --json` 可以查看每个可见插件的静态 `dependencyStatus`，无需导入运行时代码或修复依赖。
有关安装时生命周期，请参阅[插件依赖解析](/zh-CN/plugins/dependency-resolution)。

对于 npm 安装，`latest` 或 dist-tag 等可变选择器会在安装前解析，然后固定到 OpenClaw 托管 npm 根目录中的精确已验证版本。npm 完成后，OpenClaw 会验证已安装的 `package-lock.json` 条目仍与解析出的版本和完整性匹配。如果 npm 写入了不同的包元数据，安装会失败，并回滚托管包，而不是接受不同的插件工件。

源码检出是 pnpm 工作区。如果你克隆 OpenClaw 来修改内置插件，请运行 `pnpm install`；随后 OpenClaw 会从 `extensions/<id>` 加载内置插件，因此编辑内容和包本地依赖会被直接使用。普通 npm 根目录安装适用于打包版 OpenClaw，而不是源码检出开发。

## 插件类型

OpenClaw 识别两种插件格式：

| 格式     | 工作方式                                                       | 示例                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **原生** | `openclaw.plugin.json` + 运行时模块；在进程内执行       | 官方插件、社区 npm 包               |
| **Bundle** | Codex/Claude/Cursor 兼容布局；映射到 OpenClaw 功能 | `.codex-plugin/`、`.claude-plugin/`、`.cursor-plugin/` |

两者都会显示在 `openclaw plugins list` 下。有关 Bundle 详情，请参阅[插件 Bundle](/zh-CN/plugins/bundles)。

如果你正在编写原生插件，请从[构建插件](/zh-CN/plugins/building-plugins)和[插件 SDK 概览](/zh-CN/plugins/sdk-overview)开始。

## 包入口点

原生插件 npm 包必须在 `package.json` 中声明 `openclaw.extensions`。每个条目都必须保留在包目录内部，并解析为可读取的运行时文件，或解析为一个 TypeScript 源文件，其内推的已构建 JavaScript 对等文件例如从 `src/index.ts` 到 `dist/index.js`。
打包安装必须随包提供该 JavaScript 运行时输出。TypeScript 源码回退用于源码检出和本地开发路径，而不是用于安装到 OpenClaw 托管插件根目录中的 npm 包。

当发布的运行时文件与源条目不在相同路径时，请使用 `openclaw.runtimeExtensions`。存在时，`runtimeExtensions` 必须为每个 `extensions` 条目包含且仅包含一个条目。列表不匹配会导致安装和插件发现失败，而不是静默回退到源码路径。如果你也发布 `openclaw.setupEntry`，请为其已构建 JavaScript 对等文件使用 `openclaw.runtimeSetupEntry`；声明时该文件是必需的。

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

### 迁移期间 OpenClaw 拥有的 npm 包

ClawHub 是大多数插件的主要分发路径。当前打包的 OpenClaw 版本已经内置许多官方插件，因此在常规设置中不需要单独进行 npm 安装。在每个 OpenClaw 拥有的插件都迁移到 ClawHub 之前，OpenClaw 仍会在 npm 上发布一些 `@openclaw/*` 插件包，用于较旧/自定义安装和直接 npm 工作流。

如果 npm 报告某个 `@openclaw/*` 插件包已弃用，则该包版本来自较旧的外部包发布线。请使用当前 OpenClaw 中的内置插件或本地检出，直到更新的 npm 包发布。

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

### 核心（随 OpenClaw 一起提供）

<AccordionGroup>
  <Accordion title="模型提供商（默认启用）">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="记忆插件">
    - `memory-core` — 内置记忆搜索（默认通过 `plugins.slots.memory` 使用）
    - `memory-lancedb` — 基于 LanceDB 的长期记忆，支持自动召回/捕获（设置 `plugins.slots.memory = "memory-lancedb"`）

    有关 OpenAI 兼容的嵌入设置、Ollama 示例、召回限制和故障排除，请参阅 [Memory LanceDB](/zh-CN/plugins/memory-lancedb)。

  </Accordion>

  <Accordion title="语音提供商（默认启用）">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="其他">
    - `browser` — 用于浏览器工具、`openclaw browser` CLI、`browser.request` gateway 方法、浏览器运行时和默认浏览器控制服务的内置浏览器插件（默认启用；替换前请先禁用）
    - `copilot-proxy` — VS Code Copilot Proxy 桥接（默认禁用）

  </Accordion>
</AccordionGroup>

在找第三方插件？请参阅[社区插件](/zh-CN/plugins/community)。

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
| `enabled`        | 总开关（默认：`true`）                                    |
| `allow`          | 插件允许列表（可选）                                      |
| `deny`           | 插件拒绝列表（可选；拒绝优先）                            |
| `load.paths`     | 额外插件文件/目录                                         |
| `slots`          | 独占槽选择器（例如 `memory`、`contextEngine`）             |
| `entries.\<id\>` | 单个插件的开关 + 配置                                     |

`plugins.allow` 是独占的。当它非空时，只有列出的插件可以加载或暴露工具，即使 `tools.allow` 包含 `"*"` 或特定插件拥有的工具名称。如果某个工具允许列表引用了插件工具，请把拥有这些工具的插件 id 添加到 `plugins.allow`，或移除 `plugins.allow`；`openclaw doctor` 会对这种形态发出警告。

通过 `/plugins enable` 或 `/plugins disable` 做出的配置更改会触发进程内 Gateway 网关插件重新加载。新的智能体轮次会从刷新后的插件注册表重建其工具列表。安装、更新和卸载等更改源代码的操作仍会重启 Gateway 网关进程，因为已经导入的插件模块无法安全地就地替换。

`openclaw plugins list` 是本地插件注册表/配置快照。其中显示为 `enabled` 的插件表示持久化注册表和当前配置允许该插件参与运行。它并不能证明一个已经运行的远程 Gateway 网关已经重新加载或重启到相同的插件代码。在使用包装进程的 VPS/容器设置中，请把重启或触发重新加载的写入发送到实际的 `openclaw gateway run` 进程，或者在重新加载报告失败时，对正在运行的 Gateway 网关使用 `openclaw gateway restart`。

<Accordion title="插件状态：已禁用 vs 缺失 vs 无效">
  - **已禁用**：插件存在，但启用规则将其关闭。配置会被保留。
  - **缺失**：配置引用了设备发现未找到的插件 id。
  - **无效**：插件存在，但其配置不符合声明的 schema。Gateway 网关启动时只会跳过该插件；`openclaw doctor --fix` 可以通过禁用它并移除其配置负载来隔离这个无效条目。

</Accordion>

## 设备发现和优先级

OpenClaw 按以下顺序扫描插件（第一个匹配项优先）：

<Steps>
  <Step title="配置路径">
    `plugins.load.paths` — 显式文件或目录路径。指回 OpenClaw 自身打包的内置插件目录的路径会被忽略；运行 `openclaw doctor --fix` 可移除这些过时别名。
  </Step>

  <Step title="工作区插件">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` 和 `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="全局插件">
    `~/.openclaw/<plugin-root>/*.ts` 和 `~/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="内置插件">
    随 OpenClaw 一起发布。许多默认启用（模型提供商、语音）。其他插件需要显式启用。
  </Step>
</Steps>

打包安装和 Docker 镜像通常会从编译后的 `dist/extensions` 树解析内置插件。如果一个内置插件源目录被绑定挂载到匹配的打包源路径上，例如 `/app/extensions/synology-chat`，OpenClaw 会将该挂载的源目录视为内置源覆盖，并在打包的 `/app/dist/extensions/synology-chat` bundle 之前发现它。这样可以让维护者容器循环继续工作，而不必把每个内置插件都切回 TypeScript 源码。设置 `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` 可强制使用打包后的 dist bundle，即使存在源覆盖挂载也是如此。

### 启用规则

- `plugins.enabled: false` 会禁用所有插件，并跳过插件设备发现/加载工作
- `plugins.deny` 始终优先于 allow
- `plugins.entries.\<id\>.enabled: false` 会禁用该插件
- 工作区来源的插件**默认禁用**（必须显式启用）
- 内置插件遵循内置的默认启用集合，除非被覆盖
- 独占槽可以强制启用该槽所选的插件
- 当配置命名了插件拥有的表面时，某些内置的选择加入插件会自动启用，例如提供商模型引用、渠道配置或 harness 运行时
- 当 `plugins.enabled: false` 处于激活状态时，过时插件配置会被保留；如果你想移除过时 id，请先重新启用插件再运行 Doctor 清理
- OpenAI 家族 Codex 路由会保持独立的插件边界：`openai-codex/*` 属于 OpenAI 插件，而内置 Codex 应用服务器插件由 `agentRuntime.id: "codex"` 或旧版 `codex/*` 模型引用选择

## 故障排除运行时钩子

如果某个插件出现在 `plugins list` 中，但 `register(api)` 副作用或钩子没有在实时聊天流量中运行，请先检查以下内容：

- 运行 `openclaw gateway status --deep --require-rpc`，确认活动 Gateway 网关 URL、profile、配置路径和进程就是你正在编辑的那些。
- 在插件安装/配置/代码更改后重启实时 Gateway 网关。在包装容器中，PID 1 可能只是 supervisor；请重启或向子 `openclaw gateway run` 进程发送信号。
- 使用 `openclaw plugins inspect <id> --runtime --json` 确认钩子注册和诊断。非内置会话钩子，例如 `llm_input`、`llm_output`、`before_agent_finalize` 和 `agent_end`，需要 `plugins.entries.<id>.hooks.allowConversationAccess=true`。
- 对于模型切换，优先使用 `before_model_resolve`。它会在智能体轮次的模型解析之前运行；`llm_output` 只会在一次模型尝试产生助手输出之后运行。
- 如需证明有效会话模型，请使用 `openclaw sessions` 或 Gateway 网关会话/status 表面；调试提供商负载时，请使用 `--raw-stream --raw-stream-path <path>` 启动 Gateway 网关。

### 插件工具设置缓慢

如果智能体轮次在准备工具时看起来停滞，请启用 trace 日志记录，并检查插件工具工厂计时行：

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

查找：

```text
[trace:plugin-tools] factory timings ...
```

摘要会列出总工厂时间和最慢的插件工具工厂，包括插件 id、声明的工具名称、结果形态，以及该工具是否可选。当单个工厂耗时至少 1 秒或总插件工具工厂准备耗时至少 5 秒时，慢速行会提升为警告。

OpenClaw 会缓存使用相同有效请求上下文重复解析时成功的插件工具工厂结果。缓存键包含有效运行时配置、工作区、智能体/会话 id、沙箱策略、浏览器设置、交付上下文、请求者身份和所有权状态，因此依赖这些可信字段的工厂会在上下文变化时重新运行。

如果某个插件占用了大部分时间，请检查其运行时注册：

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

然后更新、重新安装或禁用该插件。插件作者应将昂贵的依赖加载移到工具执行路径之后，而不是在工具工厂中执行。

### 重复的渠道或工具所有权

症状：

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

这些表示有多个已启用插件试图拥有同一个渠道、设置流程或工具名称。最常见原因是在现在提供相同渠道 id 的内置插件旁边安装了外部渠道插件。

调试步骤：

- 运行 `openclaw plugins list --enabled --verbose` 查看每个已启用插件及其来源。
- 对每个可疑插件运行 `openclaw plugins inspect <id> --runtime --json`，并比较 `channels`、`channelConfigs`、`tools` 和诊断。
- 安装或移除插件包后，运行 `openclaw plugins registry --refresh`，以便持久化元数据反映当前安装。
- 在安装、注册表或配置更改后重启 Gateway 网关。

修复选项：

- 如果一个插件有意替换另一个具有相同渠道 id 的插件，则首选插件应声明 `channelConfigs.<channel-id>.preferOver`，并填写优先级较低的插件 id。参见 [/plugins/manifest#replacing-another-channel-plugin](/zh-CN/plugins/manifest#replacing-another-channel-plugin)。
- 如果重复是意外产生的，请使用 `plugins.entries.<plugin-id>.enabled: false` 禁用一方，或移除过时的插件安装。
- 如果你显式启用了两个插件，OpenClaw 会保留该请求并报告冲突。请为该渠道选择一个所有者，或重命名插件拥有的工具，使运行时表面保持明确。

## 插件槽（独占类别）

某些类别是独占的（同一时间只能有一个处于活动状态）：

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

| 槽              | 控制内容         | 默认值              |
| --------------- | ---------------- | ------------------- |
| `memory`        | 主动记忆插件     | `memory-core`       |
| `contextEngine` | 活动上下文引擎   | `legacy`（内置）    |

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

内置插件随 OpenClaw 一起发布。许多插件默认启用（例如内置模型提供商、内置语音提供商以及内置浏览器插件）。其他内置插件仍需要 `openclaw plugins enable <id>`。

`--force` 会原地覆盖现有已安装的插件或钩子包。对于已跟踪的 npm 插件的常规升级，请使用 `openclaw plugins update <id-or-npm-spec>`。它不支持与 `--link` 一起使用，因为 `--link` 会复用源路径，而不是复制到托管安装目标上。

当 `plugins.allow` 已设置时，`openclaw plugins install` 会在启用已安装插件之前，将该插件 ID 添加到该允许列表。如果同一个插件 ID 存在于 `plugins.deny` 中，安装会移除这个过时的 deny 条目，以便显式安装在重启后立即可加载。

OpenClaw 会保留一个持久化的本地插件注册表，作为插件清单、贡献归属和启动规划的冷读模型。安装、更新、卸载、启用和停用流程会在更改插件状态后刷新该注册表。同一个 `plugins/installs.json` 文件会在顶层 `installRecords` 中保留持久安装元数据，并在 `plugins` 中保留可重建的清单元数据。如果注册表缺失、过时或无效，`openclaw plugins registry --refresh` 会从安装记录、配置策略以及清单/包元数据中重建其清单视图，而无需加载插件运行时模块。
`openclaw plugins update <id-or-npm-spec>` 适用于已跟踪的安装。传入带有 dist-tag 或精确版本的 npm 包规范时，会将包名解析回已跟踪的插件记录，并记录新规范以供后续更新。传入不带版本的包名时，会把精确固定的安装切回注册表的默认发布线。如果已安装的 npm 插件已经匹配解析后的版本和记录的构件身份，OpenClaw 会跳过更新，不下载、不重新安装，也不重写配置。
当 `openclaw update` 在 beta 渠道上运行时，默认线 npm 和 ClawHub 插件记录会先尝试 `@beta`，并在不存在插件 beta 版本时回退到默认/latest。精确版本和显式标签会保持固定。

`--pin` 仅适用于 npm。它不支持与 `--marketplace` 一起使用，因为 marketplace 安装会持久化 marketplace 来源元数据，而不是 npm 规范。

`--dangerously-force-unsafe-install` 是针对内置危险代码扫描器误报的破窗式覆盖开关。它允许插件安装和插件更新在内置 `critical` 发现项之后继续执行，但仍不会绕过插件 `before_install` 策略阻断或扫描失败阻断。安装扫描会忽略常见测试文件和目录，例如 `tests/`、`__tests__/`、`*.test.*` 和 `*.spec.*`，以避免阻断打包的测试 mock；声明的插件运行时入口点即使使用这些名称之一，仍会被扫描。

此 CLI 标志仅适用于插件安装/更新流程。由 Gateway 网关支持的 Skill 依赖安装改用匹配的 `dangerouslyForceUnsafeInstall` 请求覆盖，而 `openclaw skills install` 仍是单独的 ClawHub Skill 下载/安装流程。

如果你在 ClawHub 上发布的插件因扫描而被隐藏或阻断，请打开 ClawHub 控制台，或运行 `clawhub package rescan <name>` 来请求 ClawHub 再次检查它。`--dangerously-force-unsafe-install` 只影响你自己机器上的安装；它不会请求 ClawHub 重新扫描插件，也不会让被阻断的版本公开。

兼容包参与同一套插件列表/检查/启用/停用流程。当前运行时支持包括包内 Skills、Claude 命令 Skills、Claude `settings.json` 默认值、Claude `.lsp.json` 和清单声明的 `lspServers` 默认值、Cursor 命令 Skills，以及兼容的 Codex 钩子目录。

`openclaw plugins inspect <id>` 还会报告检测到的包能力，以及由包支持的插件中受支持或不受支持的 MCP 和 LSP 服务器条目。

Marketplace 来源可以是 `~/.claude/plugins/known_marketplaces.json` 中的 Claude 已知 marketplace 名称、本地 marketplace 根目录或 `marketplace.json` 路径、类似 `owner/repo` 的 GitHub 简写、GitHub 仓库 URL，或 git URL。对于远程 marketplace，插件条目必须留在克隆的 marketplace 仓库内，并且只能使用相对路径来源。

了解详情请参阅 [`openclaw plugins` CLI 参考](/zh-CN/cli/plugins)。

## 插件 API 概览

原生插件会导出一个暴露 `register(api)` 的入口对象。较旧的插件可能仍将 `activate(api)` 用作旧版别名，但新插件应使用 `register`。

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

OpenClaw 会加载入口对象，并在插件激活期间调用 `register(api)`。加载器仍会为较旧的插件回退到 `activate(api)`，但内置插件和新的外部插件应将 `register` 视为公开契约。

`api.registrationMode` 会告诉插件其入口为何被加载：

| 模式            | 含义                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | 运行时激活。注册工具、钩子、服务、命令、路由和其他实时副作用。                              |
| `discovery`     | 只读能力发现。注册提供商和元数据；可信插件入口代码可能会加载，但跳过实时副作用。 |
| `setup-only`    | 通过轻量设置入口加载渠道设置元数据。                                                                |
| `setup-runtime` | 还需要运行时入口的渠道设置加载。                                                                         |
| `cli-metadata`  | 仅收集 CLI 命令元数据。                                                                                            |

会打开套接字、数据库、后台 worker 或长生命周期客户端的插件入口，应使用 `api.registrationMode === "full"` 保护这些副作用。发现加载会与激活加载分开缓存，并且不会替换正在运行的 Gateway 网关注册表。发现是非激活的，但并非免导入：OpenClaw 可能会执行可信插件入口或渠道插件模块来构建快照。保持模块顶层轻量且无副作用，并将网络客户端、子进程、监听器、凭证读取和服务启动移动到完整运行时路径之后。

常用注册方法：

| 方法                                  | 注册内容           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | 模型提供商（LLM）        |
| `registerChannel`                       | 聊天渠道                |
| `registerTool`                          | 智能体工具                  |
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

- `before_tool_call`：`{ block: true }` 是终止性的；低优先级处理器会被跳过。
- `before_tool_call`：`{ block: false }` 是无操作，不会清除先前的阻断。
- `before_install`：`{ block: true }` 是终止性的；低优先级处理器会被跳过。
- `before_install`：`{ block: false }` 是无操作，不会清除先前的阻断。
- `message_sending`：`{ cancel: true }` 是终止性的；低优先级处理器会被跳过。
- `message_sending`：`{ cancel: false }` 是无操作，不会清除先前的取消。

原生 Codex 应用服务器会把 Codex 原生工具事件桥接回这个钩子表面。插件可以通过 `before_tool_call` 阻断原生 Codex 工具，通过 `after_tool_call` 观察结果，并参与 Codex `PermissionRequest` 审批。该桥接目前尚不会重写 Codex 原生工具参数。确切的 Codex 运行时支持边界位于 [Codex harness v1 支持契约](/zh-CN/plugins/codex-harness#v1-support-contract)。

完整的类型化钩子行为，请参阅 [SDK 概览](/zh-CN/plugins/sdk-overview#hook-decision-semantics)。

## 相关内容

- [构建插件](/zh-CN/plugins/building-plugins) — 创建你自己的插件
- [插件包](/zh-CN/plugins/bundles) — Codex/Claude/Cursor 包兼容性
- [插件清单](/zh-CN/plugins/manifest) — 清单 schema
- [注册工具](/zh-CN/plugins/building-plugins#registering-agent-tools) — 在插件中添加智能体工具
- [插件内部机制](/zh-CN/plugins/architecture) — 能力模型和加载流水线
- [社区插件](/zh-CN/plugins/community) — 第三方列表
