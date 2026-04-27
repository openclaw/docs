---
read_when:
    - 安装或配置插件
    - 了解插件发现与加载规则
    - 使用与 Codex / Claude 兼容的插件包
sidebarTitle: Install and Configure
summary: 安装、配置和管理 OpenClaw 插件
title: 插件
x-i18n:
    generated_at: "2026-04-27T07:13:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 46e96d9f0a01bc18076bfe3e5d599eb5531da9b84f8c921d6570d6d140b1567d
    source_path: tools/plugin.md
    workflow: 15
---

插件为 OpenClaw 扩展新能力：渠道、模型 provider、Agent harnesses、工具、Skills、语音、实时转写、实时语音、媒体理解、图像生成、视频生成、网页抓取、网页搜索等。有些插件是**核心**插件（随 OpenClaw 一起发布），另一些是**外部**插件（由社区发布到 npm）。

## 快速开始

<Steps>
  <Step title="查看已加载内容">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="安装插件">
    ```bash
    # From npm
    openclaw plugins install @openclaw/voice-call

    # From a local directory or archive
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="重启 Gateway 网关">
    ```bash
    openclaw gateway restart
    ```

    然后在你的配置文件中通过 `plugins.entries.\<id\>.config` 进行配置。

  </Step>
</Steps>

如果你更喜欢原生聊天控制方式，请启用 `commands.plugins: true`，然后使用：

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

安装路径使用与 CLI 相同的解析器：本地路径 / 压缩包、显式 `clawhub:<pkg>`，或裸包说明符（先查找 ClawHub，再回退到 npm）。

如果配置无效，安装通常会以封闭失败方式终止，并提示你运行 `openclaw doctor --fix`。唯一的恢复例外，是针对选择加入 `openclaw.install.allowInvalidConfigRecovery` 的插件所提供的一条狭窄的内置插件重装路径。

打包版 OpenClaw 安装不会急切安装每个内置插件的整套运行时依赖树。当某个 OpenClaw 自有的内置插件因插件配置、旧版渠道配置或默认启用的清单而处于激活状态时，启动修复只会在导入它之前修复该插件声明的运行时依赖。仅有持久化的渠道认证状态，并不会激活某个内置渠道来执行 Gateway 网关启动时的运行时依赖修复。
显式禁用仍然优先：`plugins.entries.<id>.enabled: false`、`plugins.deny`、`plugins.enabled: false` 和 `channels.<id>.enabled: false` 都会阻止该插件 / 渠道的自动内置运行时依赖修复。
非空的 `plugins.allow` 也会限制默认启用的内置运行时依赖修复；显式启用内置渠道（`channels.<id>.enabled: true`）仍然可以修复该渠道的插件依赖。
外部插件和自定义加载路径仍然必须通过 `openclaw plugins install` 安装。

## 插件类型

OpenClaw 识别两种插件格式：

| 格式 | 工作方式 | 示例 |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **原生** | `openclaw.plugin.json` + 运行时模块；在进程内执行 | 官方插件、社区 npm 包 |
| **Bundle** | 与 Codex / Claude / Cursor 兼容的布局；映射到 OpenClaw 功能 | `.codex-plugin/`、`.claude-plugin/`、`.cursor-plugin/` |

这两种格式都会显示在 `openclaw plugins list` 中。Bundle 详情请参阅 [插件包](/zh-CN/plugins/bundles)。

如果你要编写原生插件，请从 [构建插件](/zh-CN/plugins/building-plugins)
和 [插件 SDK 概览](/zh-CN/plugins/sdk-overview) 开始。

## 包入口点

原生插件 npm 包必须在 `package.json` 中声明 `openclaw.extensions`。
每个条目都必须位于包目录内部，并解析到一个可读的
运行时文件，或者解析到一个 TypeScript 源文件，且可推断出其对应的已构建 JavaScript
文件，例如 `src/index.ts` 对应 `dist/index.js`。

当发布的运行时文件与源入口不在相同路径时，请使用 `openclaw.runtimeExtensions`。
如果存在 `runtimeExtensions`，则它必须为每个 `extensions` 条目精确提供一个对应条目。列表不匹配会导致安装和
插件发现失败，而不是静默回退到源路径。

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

### 可安装（npm）

| 插件 | 包名 | 文档 |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix | `@openclaw/matrix` | [Matrix](/zh-CN/channels/matrix) |
| Microsoft Teams | `@openclaw/msteams` | [Microsoft Teams](/zh-CN/channels/msteams) |
| Nostr | `@openclaw/nostr` | [Nostr](/zh-CN/channels/nostr) |
| Voice Call | `@openclaw/voice-call` | [Voice Call](/zh-CN/plugins/voice-call) |
| Zalo | `@openclaw/zalo` | [Zalo](/zh-CN/channels/zalo) |
| Zalo Personal | `@openclaw/zalouser` | [Zalo Personal](/zh-CN/plugins/zalouser) |

### 核心（随 OpenClaw 一起发布）

<AccordionGroup>
  <Accordion title="模型 provider（默认启用）">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory 插件">
    - `memory-core` — 内置 memory 搜索（默认通过 `plugins.slots.memory` 使用）
    - `memory-lancedb` — 按需安装的长期 memory，支持自动召回 / 捕获（设置 `plugins.slots.memory = "memory-lancedb"`）
  </Accordion>

  <Accordion title="语音 provider（默认启用）">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="其他">
    - `browser` — 内置浏览器插件，用于浏览器工具、`openclaw browser` CLI、`browser.request` Gateway 网关方法、浏览器运行时以及默认浏览器控制服务（默认启用；替换它之前请先禁用）
    - `copilot-proxy` — VS Code Copilot Proxy 桥接（默认禁用）
  </Accordion>
</AccordionGroup>

在寻找第三方插件？请参阅 [社区插件](/zh-CN/plugins/community)。

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

| 字段 | 描述 |
| ---------------- | --------------------------------------------------------- |
| `enabled` | 主开关（默认：`true`） |
| `allow` | 插件允许列表（可选） |
| `deny` | 插件拒绝列表（可选；拒绝优先） |
| `load.paths` | 额外插件文件 / 目录 |
| `slots` | 独占槽位选择器（例如 `memory`、`contextEngine`） |
| `entries.\<id\>` | 每个插件的开关 + 配置 |

配置更改**需要重启 Gateway 网关**。如果 Gateway 网关正在使用配置监视 + 进程内重启（默认的 `openclaw gateway` 路径），则配置写入落地后通常会自动在稍后执行该重启。
原生插件运行时代码或生命周期钩子没有受支持的热重载路径；在期待更新后的 `register(api)` 代码、`api.on(...)` 钩子、工具、服务或
provider / 运行时钩子生效之前，请重启为实时渠道提供服务的 Gateway 网关进程。

`openclaw plugins list` 是一个本地插件注册表 / 配置快照。其中标记为
`enabled` 的插件意味着持久化注册表和当前配置允许该
插件参与运行。但这并不能证明某个已经在运行的远程 Gateway 网关子进程
已经重启并加载了相同的插件代码。在 VPS / 容器配置中，如果有包装进程，请将重启信号发送到真正的 `openclaw gateway run` 进程，
或者对正在运行的 Gateway 网关使用 `openclaw gateway restart`。

<Accordion title="插件状态：已禁用 vs 缺失 vs 无效">
  - **已禁用**：插件存在，但启用规则将其关闭。配置会被保留。
  - **缺失**：配置引用了某个插件 id，但插件发现未找到它。
  - **无效**：插件存在，但其配置不符合声明的 schema。
</Accordion>

## 发现顺序与优先级

OpenClaw 按以下顺序扫描插件（先匹配者优先）：

<Steps>
  <Step title="配置路径">
    `plugins.load.paths` —— 显式文件或目录路径。若路径指回 OpenClaw 自身打包的内置插件目录，则会被忽略；
    请运行 `openclaw doctor --fix` 以移除这些陈旧别名。
  </Step>

  <Step title="工作区插件">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` 和 `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="全局插件">
    `~/.openclaw/<plugin-root>/*.ts` 和 `~/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="内置插件">
    随 OpenClaw 一起发布。许多默认启用（模型 provider、语音）。
    其他则需要显式启用。
  </Step>
</Steps>

打包安装和 Docker 镜像通常从已编译的
`dist/extensions` 树中解析内置插件。如果某个内置插件源码目录被
bind mount 覆盖到对应的打包源码路径上，例如
`/app/extensions/synology-chat`，OpenClaw 会将该挂载的源码目录
视为内置源码覆盖层，并在打包的
`/app/dist/extensions/synology-chat` bundle 之前发现它。这样无需把每个内置插件都切回 TypeScript 源码，
也能保持维护者的容器开发循环正常工作。
设置 `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` 可强制使用打包 dist bundle，
即使存在源码覆盖挂载也是如此。

### 启用规则

- `plugins.enabled: false` 会禁用所有插件
- `plugins.deny` 始终优先于 allow
- `plugins.entries.\<id\>.enabled: false` 会禁用该插件
- 来自工作区的插件**默认禁用**（必须显式启用）
- 内置插件遵循内建默认开启集合，除非被覆盖
- 独占槽位可以强制启用该槽位中被选中的插件
- 某些内置可选插件会在配置命名某个
  由插件拥有的表面时自动启用，例如 provider 模型引用、渠道配置或 harness
  运行时
- OpenAI 系列的 Codex 路由保持独立的插件边界：
  `openai-codex/*` 属于 OpenAI 插件，而内置 Codex
  app-server 插件则由 `agentRuntime.id: "codex"` 或旧版
  `codex/*` 模型引用选择

## 运行时钩子故障排除

如果某个插件出现在 `plugins list` 中，但 `register(api)` 副作用或钩子
在实时聊天流量中没有运行，请先检查以下内容：

- 运行 `openclaw gateway status --deep --require-rpc`，并确认当前活动的
  Gateway 网关 URL、配置档案、配置路径和进程就是你正在编辑的那个。
- 在插件安装 / 配置 / 代码更改之后重启实时 Gateway 网关。在包装器
  容器中，PID 1 可能只是一个监督进程；请重启或向子进程
  `openclaw gateway run` 发送信号。
- 使用 `openclaw plugins inspect <id> --json` 确认钩子注册和
  诊断信息。像 `llm_input`、
  `llm_output`、`before_agent_finalize` 和 `agent_end` 这样的非内置会话钩子需要
  `plugins.entries.<id>.hooks.allowConversationAccess=true`。
- 对于模型切换，优先使用 `before_model_resolve`。它会在智能体轮次的模型解析之前运行；`llm_output` 只会在某次模型尝试产出助手输出之后才运行。
- 若要证明实际会话模型，请使用 `openclaw sessions` 或
  Gateway 网关会话 / 状态表面；在调试 provider 负载时，请使用
  `--raw-stream --raw-stream-path <path>` 启动 Gateway 网关。

### 重复的渠道或工具所有权

症状：

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

这表示有多个已启用插件正尝试拥有同一个渠道、设置流程或工具名称。最常见的原因是某个外部渠道插件与现在已提供相同渠道 id 的内置插件同时安装了。

排查步骤：

- 运行 `openclaw plugins list --enabled --verbose`，查看每个已启用插件及其来源。
- 对每个可疑插件运行 `openclaw plugins inspect <id> --json`，并比较 `channels`、`channelConfigs`、`tools` 和诊断信息。
- 在安装或移除插件包之后运行 `openclaw plugins registry --refresh`，让持久化元数据反映当前安装状态。
- 在安装、注册表或配置变更后重启 Gateway 网关。

修复选项：

- 如果一个插件有意替换另一个插件来处理相同的渠道 id，则首选插件应声明 `channelConfigs.<channel-id>.preferOver`，并填入优先级较低的插件 id。参见 [/plugins/manifest#replacing-another-channel-plugin](/zh-CN/plugins/manifest#replacing-another-channel-plugin)。
- 如果重复是意外造成的，请使用 `plugins.entries.<plugin-id>.enabled: false` 禁用其中一方，或移除陈旧的插件安装。
- 如果你显式启用了两个插件，OpenClaw 会保留该请求并报告冲突。请为该渠道选择一个唯一拥有者，或重命名插件拥有的工具，以确保运行时表面不含歧义。

## 插件槽位（独占类别）

某些类别是独占的（同一时间只能有一个处于激活状态）：

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

| 槽位 | 控制内容 | 默认值 |
| --------------- | --------------------- | ------------------- |
| `memory` | 当前激活的 memory 插件 | `memory-core` |
| `contextEngine` | 当前激活的上下文引擎 | `legacy`（内建） |

## CLI 参考

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
openclaw plugins inspect <id>              # deep detail
openclaw plugins inspect <id> --json       # machine-readable
openclaw plugins inspect --all             # fleet-wide table
openclaw plugins info <id>                 # inspect alias
openclaw plugins doctor                    # diagnostics
openclaw plugins registry                  # inspect persisted registry state
openclaw plugins registry --refresh        # rebuild persisted registry
openclaw doctor --fix                      # repair plugin registry state

openclaw plugins install <package>         # install (ClawHub first, then npm)
openclaw plugins install clawhub:<pkg>     # install from ClawHub only
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

openclaw plugins enable <id>
openclaw plugins disable <id>
```

内置插件随 OpenClaw 一起发布。许多默认启用（例如内置模型 provider、内置语音 provider，以及内置浏览器插件）。其他内置插件仍然需要执行 `openclaw plugins enable <id>`。

`--force` 会就地覆盖现有已安装插件或 hook 包。对于受跟踪的 npm 插件的常规升级，请使用 `openclaw plugins update <id-or-npm-spec>`。该选项不支持与 `--link` 一起使用，因为 `--link` 会复用源路径，而不是复制到受管理的安装目标中。

当已设置 `plugins.allow` 时，`openclaw plugins install` 会在启用插件前先将已安装插件 id 添加到该允许列表中。如果同一个插件 id 同时存在于 `plugins.deny` 中，安装时会移除这个陈旧的拒绝条目，以便在重启后显式安装的插件可以立即加载。

OpenClaw 会维护一个持久化的本地插件注册表，作为插件清单、贡献归属和启动规划的冷读模型。安装、更新、卸载、启用和禁用流程会在更改插件状态后刷新该注册表。同一个 `plugins/installs.json` 文件会在顶层 `installRecords` 中保留持久安装元数据，并在 `plugins` 中保留可重建的清单元数据。如果注册表缺失、过期或无效，`openclaw plugins registry --refresh` 会基于安装记录、配置策略和清单 / 包元数据重建其清单视图，而无需加载插件运行时模块。
`openclaw plugins update <id-or-npm-spec>` 适用于受跟踪安装。传入带 dist-tag 或精确版本的 npm 包说明符时，会把包名解析回受跟踪的插件记录，并为后续更新记录新的说明符。传入不带版本的包名时，会把精确固定版本的安装恢复到注册表的默认发布线。如果已安装的 npm 插件已匹配解析出的版本和已记录的制品标识，OpenClaw 会跳过更新，而不会下载、重装或重写配置。

`--pin` 仅适用于 npm。不支持与 `--marketplace` 一起使用，因为 marketplace 安装会持久化 marketplace 来源元数据，而不是 npm 说明符。

`--dangerously-force-unsafe-install` 是内置危险代码扫描器出现误报时使用的破玻璃覆盖选项。它允许插件安装和插件更新在内置 `critical` 级发现之后继续进行，但仍然不会绕过插件 `before_install` 策略阻止或扫描失败阻止。

此 CLI 标志仅适用于插件安装 / 更新流程。由 Gateway 网关驱动的 Skills 依赖安装则使用对应的 `dangerouslyForceUnsafeInstall` 请求覆盖，而 `openclaw skills install` 仍然是独立的 ClawHub Skills 下载 / 安装流程。

兼容的 bundle 会参与同一套插件 list / inspect / enable / disable 流程。当前运行时支持包括 bundle Skills、Claude command-skills、Claude `settings.json` 默认值、Claude `.lsp.json` 和清单声明的 `lspServers` 默认值、Cursor command-skills，以及兼容的 Codex hook 目录。

`openclaw plugins inspect <id>` 还会报告已检测到的 bundle 能力，以及对基于 bundle 的插件支持或不支持的 MCP 和 LSP 服务器条目。

Marketplace 来源可以是 `~/.claude/plugins/known_marketplaces.json` 中的 Claude 已知 marketplace 名称、本地 marketplace 根目录或 `marketplace.json` 路径、类似 `owner/repo` 的 GitHub 简写、GitHub 仓库 URL，或 git URL。对于远程 marketplace，插件条目必须保持在克隆下来的 marketplace 仓库内部，并且只能使用相对路径来源。

完整详情请参阅 [`openclaw plugins` CLI 参考](/zh-CN/cli/plugins)。

## 插件 API 概览

原生插件会导出一个暴露 `register(api)` 的入口对象。较旧的插件仍可能使用 `activate(api)` 作为旧版别名，但新插件应使用 `register`。

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

OpenClaw 会加载入口对象，并在插件激活期间调用 `register(api)`。加载器仍会为旧插件回退到 `activate(api)`，但内置插件和新的外部插件应将 `register` 视为公开契约。

`api.registrationMode` 会告诉插件，它的入口为何会被加载：

| 模式 | 含义 |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full` | 运行时激活。注册工具、钩子、服务、命令、路由及其他实时副作用。 |
| `discovery` | 只读能力发现。注册 provider 和元数据；可信插件入口代码可能会被加载，但要跳过实时副作用。 |
| `setup-only` | 通过轻量设置入口加载渠道设置元数据。 |
| `setup-runtime` | 加载渠道设置，同时也需要运行时入口。 |
| `cli-metadata` | 仅收集 CLI 命令元数据。 |

如果插件入口会打开 socket、数据库、后台 worker 或长生命周期客户端，则应使用 `api.registrationMode === "full"` 来守卫这些副作用。发现加载与激活加载分别缓存，且不会替换正在运行的 Gateway 网关注册表。发现是非激活式的，而不是免导入：OpenClaw 可能会求值可信插件入口或渠道插件模块，以构建快照。请保持模块顶层轻量且无副作用，并将网络客户端、子进程、监听器、凭证读取和服务启动移动到完整运行时路径之后。

常见注册方法：

| 方法 | 注册内容 |
| --------------------------------------- | --------------------------- |
| `registerProvider` | 模型 provider（LLM） |
| `registerChannel` | 聊天渠道 |
| `registerTool` | 智能体工具 |
| `registerHook` / `on(...)` | 生命周期钩子 |
| `registerSpeechProvider` | 文本转语音 / STT |
| `registerRealtimeTranscriptionProvider` | 流式 STT |
| `registerRealtimeVoiceProvider` | 双工实时语音 |
| `registerMediaUnderstandingProvider` | 图像 / 音频分析 |
| `registerImageGenerationProvider` | 图像生成 |
| `registerMusicGenerationProvider` | 音乐生成 |
| `registerVideoGenerationProvider` | 视频生成 |
| `registerWebFetchProvider` | 网页抓取 / 抓取 provider |
| `registerWebSearchProvider` | 网页搜索 |
| `registerHttpRoute` | HTTP 端点 |
| `registerCommand` / `registerCli` | CLI 命令 |
| `registerContextEngine` | 上下文引擎 |
| `registerService` | 后台服务 |

强类型生命周期钩子的守卫行为：

- `before_tool_call`：`{ block: true }` 是终止性的；会跳过低优先级处理器。
- `before_tool_call`：`{ block: false }` 是空操作，不会清除先前的阻止。
- `before_install`：`{ block: true }` 是终止性的；会跳过低优先级处理器。
- `before_install`：`{ block: false }` 是空操作，不会清除先前的阻止。
- `message_sending`：`{ cancel: true }` 是终止性的；会跳过低优先级处理器。
- `message_sending`：`{ cancel: false }` 是空操作，不会清除先前的取消。

原生 Codex app-server 会将桥接的 Codex 原生工具事件回传到这个钩子表面。插件可以通过 `before_tool_call` 阻止原生 Codex 工具，通过 `after_tool_call` 观察结果，并参与 Codex `PermissionRequest` 审批。该桥接目前还不会重写 Codex 原生工具参数。准确的 Codex 运行时支持边界定义在 [Codex harness v1 支持契约](/zh-CN/plugins/codex-harness#v1-support-contract) 中。

完整的强类型钩子行为请参阅 [插件 SDK 概览](/zh-CN/plugins/sdk-overview#hook-decision-semantics)。

## 相关内容

- [构建插件](/zh-CN/plugins/building-plugins) — 创建你自己的插件
- [插件包](/zh-CN/plugins/bundles) — Codex / Claude / Cursor bundle 兼容性
- [插件清单](/zh-CN/plugins/manifest) — 清单 schema
- [注册工具](/zh-CN/plugins/building-plugins#registering-agent-tools) — 在插件中添加智能体工具
- [插件内部机制](/zh-CN/plugins/architecture) — 能力模型与加载流水线
- [社区插件](/zh-CN/plugins/community) — 第三方列表
