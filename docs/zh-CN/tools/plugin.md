---
read_when:
    - 安装或配置插件
    - 了解插件发现和加载规则
    - 使用兼容 Codex / Claude 的插件 bundle
sidebarTitle: Install and Configure
summary: 安装、配置和管理 OpenClaw 插件
title: 插件
x-i18n:
    generated_at: "2026-04-27T12:56:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 238ea327ade599c8004d766edee37561ca1bad4c7db9a011f6618ef784e14fed
    source_path: tools/plugin.md
    workflow: 15
---

插件可为 OpenClaw 扩展新能力：渠道、模型提供商、Agent harness、工具、Skills、语音、实时转录、实时语音、媒体理解、图像生成、视频生成、网页抓取、网页搜索等等。有些插件是**core**（随 OpenClaw 一起发布），另一些是**外部**（由社区发布到 npm）。

## 快速开始

<Steps>
  <Step title="查看已加载内容">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="安装插件">
    ```bash
    # 从 npm 安装
    openclaw plugins install @openclaw/voice-call

    # 从本地目录或归档安装
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="重启 Gateway 网关">
    ```bash
    openclaw gateway restart
    ```

    然后在配置文件中的 `plugins.entries.\<id\>.config` 下进行配置。

  </Step>
</Steps>

如果你更喜欢原生聊天控制，可启用 `commands.plugins: true` 并使用：

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

安装路径与 CLI 使用相同的解析器：本地路径 / 归档、显式
`clawhub:<pkg>`、显式 `npm:<pkg>`，或裸包规格（先查 ClawHub，再回退到
npm）。

如果配置无效，安装通常会以失败关闭的方式结束，并提示你运行
`openclaw doctor --fix`。唯一的恢复例外是一个狭窄的内置插件重装路径，
适用于选择加入
`openclaw.install.allowInvalidConfigRecovery`
的插件。
在 Gateway 网关启动期间，某个插件的无效配置会被隔离在该插件范围内：
启动日志会记录 `plugins.entries.<id>.config` 问题，在加载时跳过该插件，
并保持其他插件和渠道在线。运行 `openclaw doctor --fix`
可通过禁用该插件条目并移除其无效配置载荷来隔离坏配置；常规配置备份会保留之前的值。
当某个渠道配置引用了一个已无法再发现的插件，而相同的过时插件 id 仍保留在插件配置或安装记录中时，
Gateway 网关启动会记录警告并跳过该渠道，而不会阻塞其他所有渠道。
运行 `openclaw doctor --fix` 可移除这些过时的渠道 / 插件条目；若不存在过时插件证据，
未知渠道键仍会导致验证失败，以便让拼写错误保持可见。

打包后的 OpenClaw 安装不会急切安装每个内置插件的完整运行时依赖树。
当某个 OpenClaw 自有的内置插件因插件配置、旧版渠道配置或默认启用的 manifest 而处于活动状态时，
启动过程只会在导入它之前修复该插件声明的运行时依赖。
仅凭持久化的渠道鉴权状态，不会为 Gateway 网关启动时的运行时依赖修复激活某个内置渠道。
显式禁用仍然优先：`plugins.entries.<id>.enabled: false`、
`plugins.deny`、`plugins.enabled: false` 和 `channels.<id>.enabled: false`
都会阻止该插件 / 渠道的自动内置运行时依赖修复。
非空的 `plugins.allow` 也会限制默认启用的内置运行时依赖修复范围；
显式启用内置渠道（`channels.<id>.enabled: true`）仍可修复该渠道的插件依赖。
外部插件和自定义加载路径仍必须通过
`openclaw plugins install` 安装。

## 插件类型

OpenClaw 识别两种插件格式：

| 格式 | 工作方式 | 示例 |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **原生** | `openclaw.plugin.json` + 运行时模块；在进程内执行 | 官方插件、社区 npm 包 |
| **Bundle** | 兼容 Codex / Claude / Cursor 的布局；映射到 OpenClaw 功能 | `.codex-plugin/`、`.claude-plugin/`、`.cursor-plugin/` |

这两种格式都会出现在 `openclaw plugins list` 中。有关 bundle 细节，请参见 [Plugin Bundles](/zh-CN/plugins/bundles)。

如果你正在编写原生插件，请从 [Building plugins](/zh-CN/plugins/building-plugins)
和 [Plugin SDK 概览](/zh-CN/plugins/sdk-overview) 开始。

## 包入口点

原生插件 npm 包必须在 `package.json` 中声明 `openclaw.extensions`。
每个条目都必须位于包目录内，并解析为可读的运行时文件，
或者解析为带有可推断构建后 JavaScript 对应文件的 TypeScript 源文件，
例如从 `src/index.ts` 到 `dist/index.js`。

当发布的运行时文件与源条目不在相同路径时，请使用 `openclaw.runtimeExtensions`。
如果存在，`runtimeExtensions` 必须与每个 `extensions` 条目一一对应。
列表不匹配会导致安装和插件发现失败，而不是静默回退到源路径。

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

| 插件 | 包 | 文档 |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix | `@openclaw/matrix` | [Matrix](/zh-CN/channels/matrix) |
| Microsoft Teams | `@openclaw/msteams` | [Microsoft Teams](/zh-CN/channels/msteams) |
| Nostr | `@openclaw/nostr` | [Nostr](/zh-CN/channels/nostr) |
| Voice Call | `@openclaw/voice-call` | [Voice Call](/zh-CN/plugins/voice-call) |
| Zalo | `@openclaw/zalo` | [Zalo](/zh-CN/channels/zalo) |
| Zalo Personal | `@openclaw/zalouser` | [Zalo Personal](/zh-CN/plugins/zalouser) |

### Core（随 OpenClaw 一起发布）

<AccordionGroup>
  <Accordion title="模型提供商（默认启用）">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory 插件">
    - `memory-core` — 内置 Memory 搜索（通过 `plugins.slots.memory` 默认启用）
    - `memory-lancedb` — 按需安装的长期记忆，带自动召回 / 捕获（设置 `plugins.slots.memory = "memory-lancedb"`）
  </Accordion>

  <Accordion title="语音提供商（默认启用）">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="其他">
    - `browser` — 内置浏览器插件，用于浏览器工具、`openclaw browser` CLI、`browser.request` gateway 方法、浏览器运行时和默认浏览器控制服务（默认启用；替换它之前请先禁用）
    - `copilot-proxy` — VS Code Copilot Proxy 桥接（默认禁用）
  </Accordion>
</AccordionGroup>

在找第三方插件？参见 [Community Plugins](/zh-CN/plugins/community)。

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

| 字段 | 说明 |
| ---------------- | --------------------------------------------------------- |
| `enabled` | 主开关（默认：`true`） |
| `allow` | 插件 allowlist（可选） |
| `deny` | 插件 denylist（可选；deny 优先） |
| `load.paths` | 额外的插件文件 / 目录 |
| `slots` | 排他性 slot 选择器（例如 `memory`、`contextEngine`） |
| `entries.\<id\>` | 每插件开关 + 配置 |

配置变更**需要重启 gateway**。如果 Gateway 网关正在以启用配置监视和进程内重启的方式运行（默认的 `openclaw gateway` 路径），通常会在配置写入后不久自动执行该重启。
对于原生插件运行时代码或生命周期钩子，没有受支持的热重载路径；如果你希望更新后的 `register(api)` 代码、`api.on(...)` 钩子、工具、服务或 provider / 运行时钩子生效，请重启正在提供实时渠道服务的 Gateway 网关进程。

`openclaw plugins list` 是本地插件注册表 / 配置快照。那里显示某个插件为
`enabled`，意味着持久化注册表和当前配置允许该插件参与运行。
这并不能证明一个已经运行中的远程 Gateway 网关子进程已经重启并进入了相同的插件代码。
在 VPS / 容器环境配合 wrapper 进程时，请把重启发送给实际运行的
`openclaw gateway run` 进程，或针对运行中的 Gateway 网关使用
`openclaw gateway restart`。

<Accordion title="插件状态：disabled vs missing vs invalid">
  - **Disabled**：插件存在，但启用规则将其关闭。配置会保留。
  - **Missing**：配置引用了一个 discovery 未找到的插件 id。
  - **Invalid**：插件存在，但其配置不匹配声明的 schema。Gateway 网关启动只会跳过该插件；`openclaw doctor --fix` 可通过禁用该条目并移除其配置载荷来隔离这个无效项。
</Accordion>

## 发现与优先级

OpenClaw 按以下顺序扫描插件（首个匹配优先）：

<Steps>
  <Step title="配置路径">
    `plugins.load.paths` —— 显式文件或目录路径。若路径又指回 OpenClaw 自身打包的内置插件目录，则会被忽略；运行 `openclaw doctor --fix` 可移除这些过时别名。
  </Step>

  <Step title="工作区插件">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` 和 `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="全局插件">
    `~/.openclaw/<plugin-root>/*.ts` 和 `~/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="内置插件">
    随 OpenClaw 一起发布。许多默认启用（模型提供商、语音）。
    其他则需要显式启用。
  </Step>
</Steps>

打包安装和 Docker 镜像通常会从编译后的 `dist/extensions` 树解析内置插件。
如果某个内置插件源码目录被 bind mount 覆盖到对应的打包源码路径上，例如
`/app/extensions/synology-chat`，OpenClaw 会把这个挂载后的源码目录视为内置源码覆盖层，
并在打包的 `/app/dist/extensions/synology-chat` bundle 之前发现它。
这样维护者在容器中的开发循环就能继续工作，而不必把每个内置插件都切回 TypeScript 源码。
设置 `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` 可在存在源码覆盖挂载时仍强制使用打包后的 dist bundle。

### 启用规则

- `plugins.enabled: false` 会禁用所有插件
- `plugins.deny` 始终优先于 allow
- `plugins.entries.\<id\>.enabled: false` 会禁用该插件
- 来自工作区的插件**默认禁用**（必须显式启用）
- 内置插件遵循内建的默认启用集合，除非被覆盖
- 排他性 slot 可以强制启用该 slot 选中的插件
- 某些选择加入的内置插件会在配置命名了某个插件拥有的表面时自动启用，
  例如 provider 模型引用、渠道配置或 harness 运行时
- OpenAI 族的 Codex 路由保持独立的插件边界：
  `openai-codex/*` 属于 OpenAI 插件，而内置的 Codex
  app-server 插件则通过 `agentRuntime.id: "codex"` 或旧版
  `codex/*` 模型引用来选择

## 运行时钩子故障排除

如果某个插件出现在 `plugins list` 中，但 `register(api)` 的副作用或钩子
没有在实时聊天流量中运行，请先检查以下内容：

- 运行 `openclaw gateway status --deep --require-rpc`，并确认当前活动的
  Gateway 网关 URL、profile、配置路径和进程，正是你正在编辑的那些。
- 在插件安装 / 配置 / 代码变更后，重启在线的 Gateway 网关。在带 wrapper 的
  容器中，PID 1 可能只是一个 supervisor；请重启或发送信号给子进程
  `openclaw gateway run`。
- 使用 `openclaw plugins inspect <id> --json` 确认钩子注册和
  诊断信息。像 `llm_input`、
  `llm_output`、`before_agent_finalize` 和 `agent_end`
  这样的非内置会话钩子需要
  `plugins.entries.<id>.hooks.allowConversationAccess=true`。
- 对于模型切换，优先使用 `before_model_resolve`。它会在智能体轮次的模型解析之前运行；
  `llm_output` 只会在某次模型尝试产生 assistant 输出之后运行。
- 要验证会话实际使用的模型，请使用 `openclaw sessions` 或
  Gateway 网关会话 / Status 表面；调试 provider 载荷时，请用
  `--raw-stream --raw-stream-path <path>` 启动 Gateway 网关。

### 重复的渠道或工具归属

症状：

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

这意味着有多个已启用插件试图拥有同一个渠道、设置流程或工具名。最常见的原因是：
某个外部渠道插件与一个现在已经提供相同渠道 id 的内置插件同时安装。

调试步骤：

- 运行 `openclaw plugins list --enabled --verbose` 查看每个已启用插件及其来源。
- 对每个可疑插件运行 `openclaw plugins inspect <id> --json`，并比较
  `channels`、`channelConfigs`、`tools` 和诊断信息。
- 在安装或移除插件包后运行 `openclaw plugins registry --refresh`，
  使持久化元数据反映当前安装状态。
- 在安装、注册表或配置变更后重启 Gateway 网关。

修复方式：

- 如果某个插件是有意替代另一个插件来提供同一渠道 id，
  则优选插件应声明 `channelConfigs.<channel-id>.preferOver`，其值为
  较低优先级插件的 id。参见 [/plugins/manifest#replacing-another-channel-plugin](/zh-CN/plugins/manifest#replacing-another-channel-plugin)。
- 如果重复是意外造成的，请通过
  `plugins.entries.<plugin-id>.enabled: false` 禁用其中一方，或移除过时的插件安装。
- 如果你显式启用了两个插件，OpenClaw 会保留这个请求并报告冲突。
  请为该渠道选择唯一归属者，或重命名插件拥有的工具，以保证运行时表面不含歧义。

## 插件 slots（排他类别）

某些类别是排他的（同一时间只能有一个处于活动状态）：

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // 或 "none" 以禁用
      contextEngine: "legacy", // 或某个插件 id
    },
  },
}
```

| Slot | 控制内容 | 默认值 |
| --------------- | --------------------- | ------------------- |
| `memory` | 当前活动的 Memory 插件 | `memory-core` |
| `contextEngine` | 当前活动的上下文引擎 | `legacy`（内置） |

## CLI 参考

```bash
openclaw plugins list                       # 精简清单
openclaw plugins list --enabled            # 仅显示已启用插件
openclaw plugins list --verbose            # 每插件详细行
openclaw plugins list --json               # 机器可读清单
openclaw plugins inspect <id>              # 深度详情
openclaw plugins inspect <id> --json       # 机器可读
openclaw plugins inspect --all             # 全量表格
openclaw plugins info <id>                 # inspect 别名
openclaw plugins doctor                    # 诊断
openclaw plugins registry                  # 检查持久化注册表状态
openclaw plugins registry --refresh        # 重建持久化注册表
openclaw doctor --fix                      # 修复插件注册表状态

openclaw plugins install <package>         # 安装（先查 ClawHub，再回退到 npm）
openclaw plugins install clawhub:<pkg>     # 仅从 ClawHub 安装
openclaw plugins install npm:<pkg>         # 仅从 npm 安装
openclaw plugins install <spec> --force    # 覆盖现有安装
openclaw plugins install <path>            # 从本地路径安装
openclaw plugins install -l <path>         # 链接（不复制），用于开发
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # 记录精确解析后的 npm spec
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # 更新单个插件
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # 更新全部
openclaw plugins uninstall <id>          # 移除配置和插件索引记录
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

内置插件随 OpenClaw 一起发布。许多默认启用（例如内置模型提供商、内置语音提供商和内置浏览器插件）。其他内置插件仍需要执行 `openclaw plugins enable <id>`。

`--force` 会原地覆盖已有安装的插件或 hook pack。对于受跟踪的 npm
插件的常规升级，请使用 `openclaw plugins update <id-or-npm-spec>`。
它不支持与 `--link` 一起使用，因为后者会复用源码路径，而不是复制到受管安装目标。

当已设置 `plugins.allow` 时，`openclaw plugins install` 会在启用插件前，
先把安装的插件 id 加入该 allowlist。如果同一个插件 id
同时存在于 `plugins.deny` 中，安装过程会移除这个过时的 deny 条目，
这样显式安装的插件就能在重启后立即被加载。

OpenClaw 会维护一个持久化的本地插件注册表，作为插件清单、贡献归属和启动规划的冷读取模型。安装、更新、卸载、启用和禁用流程在变更插件状态后都会刷新该注册表。同一个 `plugins/installs.json` 文件还会在顶层 `installRecords` 中保存持久的安装元数据，并在 `plugins` 中保存可重建的 manifest 元数据。如果注册表缺失、过时或无效，`openclaw plugins registry --refresh` 会根据安装记录、配置策略以及 manifest / package 元数据重建它的 manifest 视图，而无需加载插件运行时模块。
`openclaw plugins update <id-or-npm-spec>` 适用于受跟踪的安装。传入带 dist-tag 或精确版本的 npm 包规格时，会将包名解析回受跟踪的插件记录，并记录新的 spec 以供后续更新。传入不带版本的包名时，则会把一个精确固定的安装移回注册表的默认发布线。如果已安装的 npm 插件已经匹配解析后的版本和记录的产物身份，OpenClaw 会跳过更新，而不会下载、重装或重写配置。

`--pin` 仅适用于 npm。它不支持与 `--marketplace` 一起使用，因为
marketplace 安装会持久化 marketplace 来源元数据，而不是 npm spec。

`--dangerously-force-unsafe-install` 是用于应对内置危险代码扫描器误报的破玻璃式覆盖选项。它允许插件安装和插件更新在遇到内置 `critical` 级别发现时继续进行，但仍然不会绕过插件 `before_install` 策略阻止或扫描失败阻止。

这个 CLI 标志仅适用于插件安装 / 更新流程。基于 Gateway 网关的 Skill 依赖安装则使用对应的 `dangerouslyForceUnsafeInstall` 请求覆盖，而 `openclaw skills install` 仍是独立的 ClawHub Skill 下载 / 安装流程。

兼容 bundle 会参与相同的插件 list / inspect / enable / disable 流程。当前运行时支持包括 bundle Skills、Claude command-Skills、Claude `settings.json` 默认值、Claude `.lsp.json` 以及 manifest 声明的 `lspServers` 默认值、Cursor command-Skills，以及兼容的 Codex hook 目录。

`openclaw plugins inspect <id>` 还会报告检测到的 bundle 能力，以及对于 bundle 支持插件检测到的受支持或不受支持的 MCP 和 LSP server 条目。

Marketplace 来源可以是
`~/.claude/plugins/known_marketplaces.json` 中的 Claude 已知 marketplace 名称、
本地 marketplace 根目录或 `marketplace.json` 路径、
类似 `owner/repo` 的 GitHub 简写、GitHub 仓库 URL，或 git URL。
对于远程 marketplace，插件条目必须位于克隆后的 marketplace 仓库内部，
并且只能使用相对路径来源。

完整详情见 [`openclaw plugins` CLI 参考](/zh-CN/cli/plugins)。

## 插件 API 概览

原生插件会导出一个暴露 `register(api)` 的入口对象。旧插件可能仍使用
`activate(api)` 作为旧别名，但新插件应使用 `register`。

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

OpenClaw 会在插件激活期间加载该入口对象并调用 `register(api)`。
加载器对旧插件仍会回退到 `activate(api)`，
但内置插件和新的外部插件都应将 `register` 视为公开契约。

`api.registrationMode` 会告诉插件其入口为何被加载：

| 模式 | 含义 |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full` | 运行时激活。注册工具、钩子、服务、命令、路由以及其他实时副作用。 |
| `discovery` | 只读能力发现。注册 provider 和元数据；可信插件入口代码可以被加载，但要跳过实时副作用。 |
| `setup-only` | 通过轻量级 setup entry 加载渠道设置元数据。 |
| `setup-runtime` | 需要同时加载运行时入口的渠道设置加载。 |
| `cli-metadata` | 仅收集 CLI 命令元数据。 |

如果插件入口会打开 socket、数据库、后台 worker 或长期存在的客户端，
应使用 `api.registrationMode === "full"` 来保护这些副作用。
发现加载会与激活加载分别缓存，并且不会替换正在运行的 Gateway 网关注册表。
发现是非激活式的，而不是无导入的：OpenClaw 可能会执行受信任的插件入口或渠道插件模块，以构建快照。
请保持模块顶层轻量且无副作用，并将网络客户端、子进程、监听器、凭证读取和服务启动移到完整运行时路径后面。

常见注册方法：

| 方法 | 注册内容 |
| --------------------------------------- | --------------------------- |
| `registerProvider` | 模型提供商（LLM） |
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
| `registerWebFetchProvider` | Web 抓取 / 抓取提供商 |
| `registerWebSearchProvider` | Web 搜索 |
| `registerHttpRoute` | HTTP 端点 |
| `registerCommand` / `registerCli` | CLI 命令 |
| `registerContextEngine` | 上下文引擎 |
| `registerService` | 后台服务 |

类型化生命周期钩子的守卫行为：

- `before_tool_call`：`{ block: true }` 是终止性的；低优先级处理器会被跳过。
- `before_tool_call`：`{ block: false }` 是空操作，不会清除更早的阻止结果。
- `before_install`：`{ block: true }` 是终止性的；低优先级处理器会被跳过。
- `before_install`：`{ block: false }` 是空操作，不会清除更早的阻止结果。
- `message_sending`：`{ cancel: true }` 是终止性的；低优先级处理器会被跳过。
- `message_sending`：`{ cancel: false }` 是空操作，不会清除更早的取消结果。

原生 Codex app-server 运行时会将 Codex 原生工具事件桥接回这个钩子表面。插件可以通过 `before_tool_call` 阻止原生 Codex 工具，通过 `after_tool_call` 观察结果，并参与 Codex 的 `PermissionRequest` 审批。该桥接目前还不会重写 Codex 原生工具参数。确切的 Codex 运行时支持边界位于 [Codex harness v1 support contract](/zh-CN/plugins/codex-harness#v1-support-contract)。

完整的类型化钩子行为请参见 [SDK 概览](/zh-CN/plugins/sdk-overview#hook-decision-semantics)。

## 相关内容

- [Building plugins](/zh-CN/plugins/building-plugins) — 创建你自己的插件
- [Plugin Bundles](/zh-CN/plugins/bundles) — Codex / Claude / Cursor bundle 兼容性
- [Plugin manifest](/zh-CN/plugins/manifest) — manifest schema
- [Registering tools](/zh-CN/plugins/building-plugins#registering-agent-tools) — 在插件中添加智能体工具
- [插件架构内部机制](/zh-CN/plugins/architecture) — 能力模型和加载流水线
- [Community Plugins](/zh-CN/plugins/community) — 第三方列表
