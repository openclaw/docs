---
read_when:
    - 安装或配置插件
    - 了解插件发现和加载规则
    - 使用与 Codex/Claude 兼容的插件包
sidebarTitle: Install and Configure
summary: 安装、配置和管理 OpenClaw 插件
title: 插件
x-i18n:
    generated_at: "2026-04-27T14:09:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 367bbf1b9aae767e13ac0bfde8f2b341f3f62bac4723080b4204ff13dee8aba0
    source_path: tools/plugin.md
    workflow: 15
---

插件通过新增功能来扩展 OpenClaw：渠道、模型提供商、Agent harness、工具、Skills、语音、实时转写、实时语音、媒体理解、图像生成、视频生成、网页抓取、网页搜索等。某些插件是**核心**插件（随 OpenClaw 一起发布），另一些则是**外部**插件（由社区发布到 npm）。

## 快速开始

<Steps>
  <Step title="查看已加载内容">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="安装插件">
    ```bash
    # 从 npm
    openclaw plugins install @openclaw/voice-call

    # 从本地目录或归档文件
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="重启 Gateway 网关">
    ```bash
    openclaw gateway restart
    ```

    然后在你的配置文件中，通过 `plugins.entries.\<id\>.config` 进行配置。

  </Step>
</Steps>

如果你更喜欢使用聊天原生控制方式，请启用 `commands.plugins: true` 并使用：

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

安装路径使用与 CLI 相同的解析器：本地路径/归档、显式 `clawhub:<pkg>`、显式 `npm:<pkg>`，或裸包规范（优先 ClawHub，然后回退到 npm）。

如果配置无效，安装通常会以封闭失败方式终止，并提示你使用 `openclaw doctor --fix`。唯一的恢复例外是针对选择加入 `openclaw.install.allowInvalidConfigRecovery` 的插件所提供的有限内置插件重装路径。
在 Gateway 网关启动期间，某个插件的无效配置会被隔离到该插件本身：启动会记录 `plugins.entries.<id>.config` 问题，加载时跳过该插件，并让其他插件和渠道继续在线。运行 `openclaw doctor --fix` 可通过禁用该插件条目并移除其无效配置负载，隔离损坏的插件配置；常规配置备份会保留之前的值。
当某个渠道配置引用了一个已无法再被发现的插件，但同一个过期插件 id 仍保留在插件配置或安装记录中时，Gateway 网关启动会记录警告并跳过该渠道，而不是阻塞所有其他渠道。运行 `openclaw doctor --fix` 可移除这些过期的渠道/插件条目；而没有过期插件证据的未知渠道键仍会导致验证失败，从而让拼写错误保持可见。

打包后的 OpenClaw 安装不会急切安装每个内置插件的完整运行时依赖树。当某个 OpenClaw 自有内置插件因插件配置、旧版渠道配置或默认启用的清单而处于活动状态时，启动过程只会在导入该插件之前修复该插件声明的运行时依赖。
仅持久化的渠道认证状态本身不会激活内置渠道，也不会触发 Gateway 网关启动时的运行时依赖修复。
显式禁用仍然优先：`plugins.entries.<id>.enabled: false`、`plugins.deny`、`plugins.enabled: false` 和 `channels.<id>.enabled: false` 会阻止该插件/渠道的自动内置运行时依赖修复。
非空的 `plugins.allow` 也会限制默认启用的内置运行时依赖修复；但显式启用内置渠道（`channels.<id>.enabled: true`）仍可修复该渠道的插件依赖。
外部插件和自定义加载路径仍必须通过 `openclaw plugins install` 安装。

## 插件类型

OpenClaw 识别两种插件格式：

| 格式 | 工作方式 | 示例 |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **原生** | `openclaw.plugin.json` + 运行时模块；在进程内执行 | 官方插件、社区 npm 包 |
| **Bundle** | 兼容 Codex/Claude/Cursor 的布局；映射到 OpenClaw 功能 | `.codex-plugin/`、`.claude-plugin/`、`.cursor-plugin/` |

两者都会显示在 `openclaw plugins list` 中。有关 Bundle 的详细信息，请参阅 [插件包](/zh-CN/plugins/bundles)。

如果你正在编写原生插件，请从 [构建插件](/zh-CN/plugins/building-plugins)
和 [插件 SDK 概览](/zh-CN/plugins/sdk-overview) 开始。

## 包入口点

原生插件 npm 包必须在 `package.json` 中声明 `openclaw.extensions`。
每个条目都必须保留在包目录内，并解析为可读取的运行时文件，或解析为带有推断构建后 JavaScript 对应文件的 TypeScript 源文件，例如从 `src/index.ts` 到 `dist/index.js`。

当发布后的运行时文件路径与源条目路径不同时，请使用 `openclaw.runtimeExtensions`。存在时，`runtimeExtensions` 必须为每个 `extensions` 条目精确包含一个对应项。列表不匹配会导致安装和插件发现失败，而不是静默回退到源路径。

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
| 语音通话 | `@openclaw/voice-call` | [Voice Call](/zh-CN/plugins/voice-call) |
| Zalo | `@openclaw/zalo` | [Zalo](/zh-CN/channels/zalo) |
| Zalo Personal | `@openclaw/zalouser` | [Zalo Personal](/zh-CN/plugins/zalouser) |

### 核心（随 OpenClaw 一起发布）

<AccordionGroup>
  <Accordion title="模型提供商（默认启用）">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory 插件">
    - `memory-core` — 内置的内存搜索（通过 `plugins.slots.memory` 默认使用）
    - `memory-lancedb` — 按需安装的长期记忆，带自动召回/捕获功能（设置 `plugins.slots.memory = "memory-lancedb"`）
  </Accordion>

  <Accordion title="语音提供商（默认启用）">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="其他">
    - `browser` — 用于浏览器工具、`openclaw browser` CLI、`browser.request` Gateway 网关方法、浏览器运行时和默认浏览器控制服务的内置浏览器插件（默认启用；替换前请先禁用）
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

| 字段 | 说明 |
| ---------------- | --------------------------------------------------------- |
| `enabled` | 主开关（默认：`true`） |
| `allow` | 插件允许列表（可选） |
| `deny` | 插件拒绝列表（可选；拒绝优先） |
| `load.paths` | 额外的插件文件/目录 |
| `slots` | 排他槽位选择器（例如 `memory`、`contextEngine`） |
| `entries.\<id\>` | 每插件开关 + 配置 |

配置更改**需要重启 Gateway 网关**。如果 Gateway 网关正在以配置监视 + 进程内重启模式运行（默认的 `openclaw gateway` 路径），那么配置写入完成后，这个重启通常会在短时间后自动执行。
原生插件运行时代码或生命周期钩子不支持热重载；在你期望更新后的 `register(api)` 代码、`api.on(...)` 钩子、工具、服务或提供商/运行时钩子生效之前，请重启正在服务实时渠道的 Gateway 网关进程。

`openclaw plugins list` 是本地插件注册表/配置快照。
其中某个插件显示为 `enabled`，表示持久化注册表和当前配置允许该插件参与运行。这并不能证明一个已在运行的远程 Gateway 网关子进程已经重启并进入了相同的插件代码。在 VPS/容器部署且存在包装进程的场景中，请将重启信号发送给实际的 `openclaw gateway run` 进程，或针对正在运行的 Gateway 网关使用 `openclaw gateway restart`。

<Accordion title="插件状态：已禁用 vs 缺失 vs 无效">
  - **已禁用**：插件存在，但启用规则将其关闭。配置会被保留。
  - **缺失**：配置引用了一个插件 id，但发现过程没有找到它。
  - **无效**：插件存在，但其配置与声明的 schema 不匹配。Gateway 网关启动时只会跳过该插件；`openclaw doctor --fix` 可以通过禁用该条目并移除其配置负载来隔离这个无效条目。
</Accordion>

## 发现与优先级

OpenClaw 按以下顺序扫描插件（先匹配者优先）：

<Steps>
  <Step title="配置路径">
    `plugins.load.paths` —— 显式文件或目录路径。指回 OpenClaw 自身打包内置插件目录的路径会被忽略；运行 `openclaw doctor --fix` 可移除这些过期别名。
  </Step>

  <Step title="工作区插件">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` 和 `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="全局插件">
    `~/.openclaw/<plugin-root>/*.ts` 和 `~/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="内置插件">
    随 OpenClaw 一起发布。许多默认启用（模型提供商、语音）。
    其他插件则需要显式启用。
  </Step>
</Steps>

打包安装和 Docker 镜像通常会从已编译的 `dist/extensions` 树解析内置插件。
如果某个内置插件源目录被绑定挂载覆盖到相应的打包源路径上，例如
`/app/extensions/synology-chat`，OpenClaw 会将这个已挂载的源目录视为内置源覆盖层，并在打包的
`/app/dist/extensions/synology-chat` bundle 之前发现它。
这样可以让维护者的容器开发循环继续工作，而无需将每个内置插件都切回 TypeScript 源码。
设置 `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` 可以在存在源覆盖挂载时也强制使用打包后的 dist bundle。

### 启用规则

- `plugins.enabled: false` 会禁用所有插件
- `plugins.deny` 始终优先于 allow
- `plugins.entries.\<id\>.enabled: false` 会禁用该插件
- 来源于工作区的插件**默认禁用**（必须显式启用）
- 内置插件遵循内建默认启用集合，除非被覆盖
- 排他槽位可强制启用该槽位中被选中的插件
- 某些内置的选择加入型插件，会在配置命名了某个插件自有表面时自动启用，例如提供商模型引用、渠道配置或 harness 运行时
- OpenAI 系列的 Codex 路由保持独立的插件边界：
  `openai-codex/*` 属于 OpenAI 插件，而内置 Codex
  app-server 插件则由 `agentRuntime.id: "codex"` 或旧版
  `codex/*` 模型引用选择

## 运行时钩子故障排除

如果某个插件出现在 `plugins list` 中，但 `register(api)` 的副作用或钩子没有在实时聊天流量中运行，请先检查以下内容：

- 运行 `openclaw gateway status --deep --require-rpc`，并确认当前活动的 Gateway 网关 URL、profile、配置路径和进程，正是你正在编辑的那些。
- 在插件安装/配置/代码变更后，重启正在运行的 Gateway 网关。在包装容器中，PID 1 可能只是一个 supervisor；请重启或向子进程 `openclaw gateway run` 发送信号。
- 使用 `openclaw plugins inspect <id> --json` 确认钩子注册和诊断信息。非内置的对话钩子，如 `llm_input`、`llm_output`、`before_agent_finalize` 和 `agent_end`，需要设置 `plugins.entries.<id>.hooks.allowConversationAccess=true`。
- 对于模型切换，优先使用 `before_model_resolve`。它会在智能体轮次进行模型解析之前运行；`llm_output` 只有在某次模型尝试生成 assistant 输出之后才会运行。
- 若要证明当前会话实际使用的模型，请使用 `openclaw sessions` 或 Gateway 网关的会话/状态界面；在调试提供商负载时，可使用 `--raw-stream --raw-stream-path <path>` 启动 Gateway 网关。

### 重复的渠道或工具所有权

症状：

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

这意味着有多个已启用插件正试图拥有同一个渠道、设置流程或工具名称。最常见的原因是，某个外部渠道插件与现在已提供相同渠道 id 的内置插件同时安装了。

调试步骤：

- 运行 `openclaw plugins list --enabled --verbose`，查看每个已启用插件及其来源。
- 对每个可疑插件运行 `openclaw plugins inspect <id> --json`，并比较 `channels`、`channelConfigs`、`tools` 和诊断信息。
- 在安装或移除插件包后，运行 `openclaw plugins registry --refresh`，让持久化元数据反映当前安装状态。
- 在安装、注册表或配置变更后重启 Gateway 网关。

修复选项：

- 如果某个插件有意替换另一个插件来提供相同渠道 id，则首选插件应声明 `channelConfigs.<channel-id>.preferOver`，其值为低优先级插件 id。参见 [/plugins/manifest#replacing-another-channel-plugin](/zh-CN/plugins/manifest#replacing-another-channel-plugin)。
- 如果重复是意外造成的，请通过 `plugins.entries.<plugin-id>.enabled: false` 禁用其中一方，或移除过期的插件安装。
- 如果你显式启用了这两个插件，OpenClaw 会保留这个请求并报告冲突。请为该渠道选择一个所有者，或重命名插件自有工具，以确保运行时界面明确无歧义。

## 插件槽位（排他类别）

某些类别是排他的（一次只能有一个处于活动状态）：

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // 或 "none" 以禁用
      contextEngine: "legacy", // 或插件 id
    },
  },
}
```

| 槽位 | 控制内容 | 默认值 |
| --------------- | --------------------- | ------------------- |
| `memory` | 当前活动的内存插件 | `memory-core` |
| `contextEngine` | 当前活动的上下文引擎 | `legacy`（内置） |

## CLI 参考

```bash
openclaw plugins list                       # 紧凑清单
openclaw plugins list --enabled            # 仅显示已启用插件
openclaw plugins list --verbose            # 每插件详细信息行
openclaw plugins list --json               # 机器可读清单
openclaw plugins inspect <id>              # 深度详情
openclaw plugins inspect <id> --json       # 机器可读
openclaw plugins inspect --all             # 全量表格
openclaw plugins info <id>                 # inspect 别名
openclaw plugins doctor                    # 诊断
openclaw plugins registry                  # 检查持久化注册表状态
openclaw plugins registry --refresh        # 重建持久化注册表
openclaw doctor --fix                      # 修复插件注册表状态

openclaw plugins install <package>         # 安装（优先 ClawHub，然后 npm）
openclaw plugins install clawhub:<pkg>     # 仅从 ClawHub 安装
openclaw plugins install npm:<pkg>         # 仅从 npm 安装
openclaw plugins install <spec> --force    # 覆盖现有安装
openclaw plugins install <path>            # 从本地路径安装
openclaw plugins install -l <path>         # 开发用链接安装（不复制）
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

内置插件随 OpenClaw 一起发布。许多插件默认启用（例如内置模型提供商、内置语音提供商以及内置浏览器插件）。其他内置插件仍然需要执行 `openclaw plugins enable <id>`。

`--force` 会就地覆盖现有已安装插件或 hook 包。对于已跟踪 npm 插件的常规升级，请使用 `openclaw plugins update <id-or-npm-spec>`。它不支持与 `--link` 一起使用，因为后者会复用源路径，而不是复制到受管理的安装目标。

当 `plugins.allow` 已经设置时，`openclaw plugins install` 会在启用插件之前，将已安装插件 id 添加到该允许列表中。如果同一个插件 id 同时存在于 `plugins.deny` 中，安装过程会移除这个过期的拒绝条目，以便显式安装的插件在重启后可以立即加载。

OpenClaw 会将一个持久化的本地插件注册表作为插件清单、贡献所有权和启动规划的冷读取模型。安装、更新、卸载、启用和禁用流程在改变插件状态后都会刷新该注册表。同一个 `plugins/installs.json` 文件会在顶层 `installRecords` 中保存持久安装元数据，并在 `plugins` 中保存可重建的 manifest 元数据。如果注册表缺失、过期或无效，`openclaw plugins registry --refresh` 会基于安装记录、配置策略以及 manifest/package 元数据重建其 manifest 视图，而无需加载插件运行时模块。
`openclaw plugins update <id-or-npm-spec>` 适用于已跟踪安装。传入带有 dist-tag 或精确版本的 npm 包 spec 时，会将该包名解析回已跟踪的插件记录，并为未来更新记录新的 spec。传入不带版本的包名时，会将一个精确固定版本的安装移回注册表默认的发布线。如果已安装的 npm 插件已经匹配解析后的版本和记录的制品标识，OpenClaw 会跳过此次更新，而不会下载、重新安装或重写配置。

`--pin` 仅适用于 npm。它不支持与 `--marketplace` 一起使用，因为 marketplace 安装会持久化 marketplace 来源元数据，而不是 npm spec。

`--dangerously-force-unsafe-install` 是针对内置危险代码扫描器误报的破窗应急覆盖选项。它允许插件安装和插件更新在遇到内置 `critical` 发现后继续进行，但仍不会绕过插件 `before_install` 策略阻止或扫描失败阻止。
安装扫描会忽略常见测试文件和目录，如 `tests/`、`__tests__/`、`*.test.*` 和 `*.spec.*`，以避免阻止打包测试 mock；即使插件声明的运行时入口点使用了这些名称之一，仍会被扫描。

这个 CLI 标志仅适用于插件安装/更新流程。由 Gateway 网关支持的 Skills 依赖安装则改用匹配的 `dangerouslyForceUnsafeInstall` 请求覆盖；而 `openclaw skills install` 仍然是独立的 ClawHub Skills 下载/安装流程。

兼容的 bundle 会参与同一套插件 list/inspect/enable/disable 流程。当前运行时支持包括 bundle Skills、Claude command-skills、Claude `settings.json` 默认值、Claude `.lsp.json` 和 manifest 声明的 `lspServers` 默认值、Cursor command-skills，以及兼容的 Codex hook 目录。

`openclaw plugins inspect <id>` 还会报告已检测到的 bundle 功能，以及 bundle 支持插件中受支持或不受支持的 MCP 和 LSP server 条目。

Marketplace 来源可以是 `~/.claude/plugins/known_marketplaces.json` 中的 Claude 已知 marketplace 名称、本地 marketplace 根目录或 `marketplace.json` 路径、类似 `owner/repo` 的 GitHub 简写、GitHub 仓库 URL，或 git URL。对于远程 marketplace，插件条目必须保留在克隆的 marketplace 仓库内，并且只能使用相对路径来源。

完整详情请参阅 [`openclaw plugins` CLI 参考](/zh-CN/cli/plugins)。

## 插件 API 概览

原生插件导出一个暴露 `register(api)` 的入口对象。较旧的插件仍可能使用 `activate(api)` 作为旧版别名，但新插件应使用 `register`。

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

OpenClaw 会在插件激活期间加载该入口对象并调用 `register(api)`。加载器仍会为旧插件回退到 `activate(api)`，但内置插件和新的外部插件应将 `register` 视为公共契约。

`api.registrationMode` 会告诉插件其入口为何被加载：

| 模式 | 含义 |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full` | 运行时激活。注册工具、钩子、服务、命令、路由和其他实时副作用。 |
| `discovery` | 只读能力发现。注册提供商和元数据；可信插件入口代码可能会被加载，但应跳过实时副作用。 |
| `setup-only` | 通过轻量级 setup 入口加载渠道设置元数据。 |
| `setup-runtime` | 需要运行时入口的渠道设置加载。 |
| `cli-metadata` | 仅收集 CLI 命令元数据。 |

会打开 socket、数据库、后台 worker 或长生命周期客户端的插件入口，应使用 `api.registrationMode === "full"` 来保护这些副作用。
发现加载会与激活加载分别缓存，且不会替换正在运行的 Gateway 网关注册表。发现是非激活式的，而不是无导入式的：OpenClaw 可能会对可信插件入口或渠道插件模块求值，以构建快照。请保持模块顶层轻量且无副作用，并将网络客户端、子进程、监听器、凭证读取和服务启动移到完整运行时路径之后。

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
| `registerMediaUnderstandingProvider` | 图像/音频分析 |
| `registerImageGenerationProvider` | 图像生成 |
| `registerMusicGenerationProvider` | 音乐生成 |
| `registerVideoGenerationProvider` | 视频生成 |
| `registerWebFetchProvider` | 网页抓取 / 抓取提供商 |
| `registerWebSearchProvider` | 网页搜索 |
| `registerHttpRoute` | HTTP 端点 |
| `registerCommand` / `registerCli` | CLI 命令 |
| `registerContextEngine` | 上下文引擎 |
| `registerService` | 后台服务 |

类型化生命周期钩子的钩子保护行为：

- `before_tool_call`：`{ block: true }` 为终止结果；低优先级处理器会被跳过。
- `before_tool_call`：`{ block: false }` 为无操作，不会清除更早的阻止结果。
- `before_install`：`{ block: true }` 为终止结果；低优先级处理器会被跳过。
- `before_install`：`{ block: false }` 为无操作，不会清除更早的阻止结果。
- `message_sending`：`{ cancel: true }` 为终止结果；低优先级处理器会被跳过。
- `message_sending`：`{ cancel: false }` 为无操作，不会清除更早的取消结果。

原生 Codex app-server 会将桥接的 Codex 原生工具事件回传到这个钩子界面中。插件可以通过 `before_tool_call` 阻止原生 Codex 工具，通过 `after_tool_call` 观察结果，并参与 Codex 的 `PermissionRequest` 审批。该桥接目前还不会改写 Codex 原生工具参数。确切的 Codex 运行时支持边界定义在 [Codex harness v1 支持契约](/zh-CN/plugins/codex-harness#v1-support-contract) 中。

有关完整的类型化钩子行为，请参阅 [SDK 概览](/zh-CN/plugins/sdk-overview#hook-decision-semantics)。

## 相关内容

- [构建插件](/zh-CN/plugins/building-plugins) — 创建你自己的插件
- [插件包](/zh-CN/plugins/bundles) — Codex/Claude/Cursor 插件包兼容性
- [插件清单](/zh-CN/plugins/manifest) — manifest schema
- [注册工具](/zh-CN/plugins/building-plugins#registering-agent-tools) — 在插件中添加智能体工具
- [插件内部机制](/zh-CN/plugins/architecture) — 能力模型和加载流水线
- [社区插件](/zh-CN/plugins/community) — 第三方列表
