---
read_when:
    - 安装或配置插件
    - 了解插件发现和加载规则
    - 使用与 Codex/Claude 兼容的插件包
sidebarTitle: Install and Configure
summary: 安装、配置和管理 OpenClaw 插件
title: 插件
x-i18n:
    generated_at: "2026-04-26T09:32:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73ab65e0c32b51cd34ab59d482f9eb665f3543e3b9ae40de2e584abbd0aca4cc
    source_path: tools/plugin.md
    workflow: 15
---

插件通过新增功能来扩展 OpenClaw：渠道、模型提供商、智能体 harness、工具、Skills、语音、实时转写、实时语音、媒体理解、图像生成、视频生成、网页抓取、网页搜索等。有些插件是 **核心** 插件（随 OpenClaw 一起发布），另一些是 **外部** 插件（由社区发布到 npm）。

## 快速开始

<Steps>
  <Step title="查看已加载的内容">
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

    然后在你的配置文件中，于 `plugins.entries.\<id\>.config` 下进行配置。

  </Step>
</Steps>

如果你更喜欢使用聊天原生控制，启用 `commands.plugins: true` 并使用：

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

安装路径使用与 CLI 相同的解析器：本地路径/归档、显式 `clawhub:<pkg>`，或裸包规范（先 ClawHub，后回退到 npm）。

如果配置无效，安装通常会以失败关闭的方式结束，并引导你使用 `openclaw doctor --fix`。唯一的恢复例外是一条针对选择加入 `openclaw.install.allowInvalidConfigRecovery` 的插件的、范围很窄的内置插件重新安装路径。

打包的 OpenClaw 安装不会急切地安装每个内置插件的运行时依赖树。当某个 OpenClaw 自有的内置插件因插件配置、旧版渠道配置或默认启用的 manifest 而处于激活状态时，启动过程只会在导入该插件之前修复这个插件声明的运行时依赖。仅持久化的渠道认证状态本身不会激活某个内置渠道，也不会触发 Gateway 网关启动时的运行时依赖修复。
显式禁用仍然优先：`plugins.entries.<id>.enabled: false`、`plugins.deny`、`plugins.enabled: false` 和 `channels.<id>.enabled: false` 会阻止该插件/渠道的自动内置运行时依赖修复。
外部插件和自定义加载路径仍然必须通过
`openclaw plugins install` 安装。

## 插件类型

OpenClaw 识别两种插件格式：

| 格式 | 工作方式 | 示例 |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **原生** | `openclaw.plugin.json` + 运行时模块；在进程内执行 | 官方插件、社区 npm 包 |
| **Bundle** | 与 Codex/Claude/Cursor 兼容的布局；映射到 OpenClaw 功能 | `.codex-plugin/`、`.claude-plugin/`、`.cursor-plugin/` |

两者都会显示在 `openclaw plugins list` 中。有关 Bundle 的详细信息，请参见 [Plugin Bundles](/zh-CN/plugins/bundles)。

如果你要编写原生插件，请从 [构建插件](/zh-CN/plugins/building-plugins)
和 [插件 SDK 概览](/zh-CN/plugins/sdk-overview) 开始。

## 官方插件

### 可安装（npm）

| 插件 | 包 | 文档 |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/zh-CN/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/zh-CN/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/zh-CN/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/zh-CN/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/zh-CN/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/zh-CN/plugins/zalouser)   |

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
    - `memory-core` — 内置的内存搜索（默认通过 `plugins.slots.memory` 启用）
    - `memory-lancedb` — 按需安装的长期记忆，带自动回忆/捕获功能（设置 `plugins.slots.memory = "memory-lancedb"`）
  </Accordion>

  <Accordion title="语音提供商（默认启用）">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="其他">
    - `browser` — 用于浏览器工具、`openclaw browser` CLI、`browser.request` Gateway 网关方法、浏览器运行时以及默认浏览器控制服务的内置浏览器插件（默认启用；替换前请先禁用）
    - `copilot-proxy` — VS Code Copilot Proxy 桥接（默认禁用）
  </Accordion>
</AccordionGroup>

在找第三方插件？请参见 [Community Plugins](/zh-CN/plugins/community)。

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
| `enabled`        | 主开关（默认：`true`） |
| `allow`          | 插件允许列表（可选） |
| `deny`           | 插件拒绝列表（可选；拒绝优先） |
| `load.paths`     | 额外的插件文件/目录 |
| `slots`          | 独占插槽选择器（例如 `memory`、`contextEngine`） |
| `entries.\<id\>` | 每个插件的开关 + 配置 |

配置变更 **需要重启网关**。如果 Gateway 网关正以启用配置监听和进程内重启的方式运行（默认的 `openclaw gateway` 路径），那么配置写入完成后，通常会在片刻之后自动执行重启。
原生插件运行时代码或生命周期钩子没有受支持的热重载路径；在期望更新后的 `register(api)` 代码、`api.on(...)` 钩子、工具、服务或提供商/运行时钩子生效之前，请重启正在服务实时渠道的 Gateway 网关进程。

`openclaw plugins list` 是本地插件注册表/配置快照。其中某个插件显示为 `enabled`，意味着持久化注册表和当前配置允许该插件参与运行。但这并不能证明一个已经运行的远程 Gateway 网关子进程已经重启并载入了相同的插件代码。在 VPS/容器部署中，如果有包装器进程，请将重启信号发送给实际的 `openclaw gateway run` 进程，或者针对正在运行的 Gateway 网关使用 `openclaw gateway restart`。

<Accordion title="插件状态：disabled、missing 与 invalid">
  - **Disabled**：插件存在，但被启用规则关闭。配置会被保留。
  - **Missing**：配置引用了某个插件 id，但在发现过程中未找到该插件。
  - **Invalid**：插件存在，但其配置与声明的 schema 不匹配。
</Accordion>

## 发现顺序与优先级

OpenClaw 按以下顺序扫描插件（先匹配者优先）：

<Steps>
  <Step title="配置路径">
    `plugins.load.paths` —— 显式的文件或目录路径。那些指回 OpenClaw 自身打包内置插件目录的路径会被忽略；运行 `openclaw doctor --fix` 以移除这些陈旧别名。
  </Step>

  <Step title="工作区插件">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` 和 `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="全局插件">
    `~/.openclaw/<plugin-root>/*.ts` 和 `~/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="内置插件">
    随 OpenClaw 一起发布。许多插件默认启用（模型提供商、语音）。
    其他插件则需要显式启用。
  </Step>
</Steps>

### 启用规则

- `plugins.enabled: false` 会禁用所有插件
- `plugins.deny` 始终优先于 allow
- `plugins.entries.\<id\>.enabled: false` 会禁用该插件
- 来自工作区的插件 **默认禁用**（必须显式启用）
- 内置插件遵循内建的默认启用集合，除非被覆盖
- 独占插槽可以为该插槽强制启用所选插件
- 某些内置的选择加入型插件会在配置命名了插件自有的运行面时自动启用，例如提供商模型引用、渠道配置或 harness 运行时
- OpenAI 系列的 Codex 路由保持独立的插件边界：
  `openai-codex/*` 属于 OpenAI 插件，而内置的 Codex
  app-server 插件则通过 `agentRuntime.id: "codex"` 或旧版
  `codex/*` 模型引用来选择

## 运行时钩子故障排除

如果某个插件出现在 `plugins list` 中，但 `register(api)` 副作用或钩子没有在实时聊天流量中运行，请先检查以下内容：

- 运行 `openclaw gateway status --deep --require-rpc`，并确认当前活动的 Gateway 网关 URL、配置文件、配置路径和进程就是你正在编辑的那些。
- 在插件安装/配置/代码变更之后，重启正在运行的 Gateway 网关。在包装器容器中，PID 1 可能只是一个监督进程；请重启或向子 `openclaw gateway run` 进程发送信号。
- 使用 `openclaw plugins inspect <id> --json` 确认钩子注册和诊断信息。诸如 `llm_input`、`llm_output`、`before_agent_finalize` 和 `agent_end` 这类非内置的会话钩子需要
  `plugins.entries.<id>.hooks.allowConversationAccess=true`。
- 对于模型切换，优先使用 `before_model_resolve`。它会在智能体轮次的模型解析之前运行；`llm_output` 仅在某次模型尝试生成了助手输出之后才会运行。
- 要证明实际会话模型，请使用 `openclaw sessions` 或 Gateway 网关的会话/Status 相关界面；在调试提供商负载时，可使用 `--raw-stream --raw-stream-path <path>` 启动 Gateway 网关。

### 重复的渠道或工具归属

症状：

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

这些都表示有多个已启用插件正试图拥有同一个渠道、设置流程或工具名称。最常见的原因是，一个外部渠道插件与一个现在提供相同渠道 id 的内置插件同时安装。

调试步骤：

- 运行 `openclaw plugins list --enabled --verbose` 查看每个已启用插件及其来源。
- 对每个可疑插件运行 `openclaw plugins inspect <id> --json`，比较 `channels`、`channelConfigs`、`tools` 和诊断信息。
- 在安装或移除插件包后运行 `openclaw plugins registry --refresh`，以便持久化元数据反映当前安装状态。
- 在安装、注册表或配置变更后重启 Gateway 网关。

修复方式：

- 如果某个插件有意替换另一个拥有相同渠道 id 的插件，首选插件应声明 `channelConfigs.<channel-id>.preferOver`，并指定优先级较低的插件 id。请参见 [/plugins/manifest#replacing-another-channel-plugin](/zh-CN/plugins/manifest#replacing-another-channel-plugin)。
- 如果重复是意外造成的，可使用 `plugins.entries.<plugin-id>.enabled: false` 禁用其中一方，或移除陈旧的插件安装。
- 如果你显式启用了这两个插件，OpenClaw 会保留该请求并报告冲突。请为该渠道选择一个唯一所有者，或重命名插件自有工具，以确保运行时表面不存在歧义。

## 插件插槽（独占类别）

某些类别是独占的（同一时间只能有一个处于激活状态）：

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

| 插槽 | 控制内容 | 默认值 |
| --------------- | --------------------- | ------------------- |
| `memory`        | 当前激活的内存插件 | `memory-core` |
| `contextEngine` | 当前激活的上下文引擎 | `legacy`（内置） |

## CLI 参考

```bash
openclaw plugins list                       # 紧凑清单
openclaw plugins list --enabled            # 仅显示已启用插件
openclaw plugins list --verbose            # 每个插件的详细信息行
openclaw plugins list --json               # 机器可读清单
openclaw plugins inspect <id>              # 深度详情
openclaw plugins inspect <id> --json       # 机器可读
openclaw plugins inspect --all             # 全量范围表格
openclaw plugins info <id>                 # inspect 别名
openclaw plugins doctor                    # 诊断
openclaw plugins registry                  # 查看持久化注册表状态
openclaw plugins registry --refresh        # 重建持久化注册表
openclaw doctor --fix                      # 修复插件注册表状态

openclaw plugins install <package>         # 安装（先 ClawHub，后 npm）
openclaw plugins install clawhub:<pkg>     # 仅从 ClawHub 安装
openclaw plugins install <spec> --force    # 覆盖现有安装
openclaw plugins install <path>            # 从本地路径安装
openclaw plugins install -l <path>         # 链接（不复制），用于开发
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # 记录精确解析后的 npm 规范
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # 更新单个插件
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # 全部更新
openclaw plugins uninstall <id>          # 移除配置和插件索引记录
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

内置插件随 OpenClaw 一起发布。许多插件默认启用（例如内置模型提供商、内置语音提供商以及内置浏览器插件）。其他内置插件仍然需要执行 `openclaw plugins enable <id>`。

`--force` 会就地覆盖现有已安装的插件或 hook pack。对于已跟踪 npm 插件的常规升级，请使用
`openclaw plugins update <id-or-npm-spec>`。该选项不支持与 `--link` 一起使用，因为 `--link` 会复用源路径，而不是复制到受管理的安装目标中。

当 `plugins.allow` 已设置时，`openclaw plugins install` 会先将已安装的插件 id 添加到该允许列表中，然后再启用它。如果同一个插件 id 同时出现在 `plugins.deny` 中，安装过程会移除这个过时的拒绝项，以便显式安装的插件在重启后能够立即加载。

OpenClaw 会保留一个持久化的本地插件注册表，作为插件清单、贡献归属和启动规划的冷读模型。安装、更新、卸载、启用和禁用流程都会在更改插件状态后刷新该注册表。同一个 `plugins/installs.json` 文件会在顶层 `installRecords` 中保存持久化安装元数据，并在 `plugins` 中保存可重建的 manifest 元数据。如果注册表缺失、过时或无效，`openclaw plugins registry
--refresh` 会根据安装记录、配置策略以及 manifest/package 元数据重建其 manifest 视图，而无需加载插件运行时模块。
`openclaw plugins update <id-or-npm-spec>` 适用于已跟踪的安装。传入带有 dist-tag 或精确版本的 npm 包规范时，会将该包名解析回已跟踪的插件记录，并为后续更新记录新的规范。传入不带版本的包名时，会将一个精确固定版本的安装切回注册表的默认发布线。如果已安装的 npm 插件已与解析出的版本和记录的产物标识一致，OpenClaw 会跳过更新，而不会下载、重新安装或重写配置。

`--pin` 仅适用于 npm。它不支持与 `--marketplace` 一起使用，因为 marketplace 安装会持久化 marketplace 来源元数据，而不是 npm 规范。

`--dangerously-force-unsafe-install` 是一个用于处理内置危险代码扫描器误报的破玻璃覆盖开关。它允许插件安装和插件更新在遇到内置 `critical` 发现后继续执行，但仍然不会绕过插件 `before_install` 策略拦截或扫描失败拦截。

这个 CLI 标志仅适用于插件安装/更新流程。由 Gateway 网关驱动的 Skills 依赖安装则使用对应的 `dangerouslyForceUnsafeInstall` 请求覆盖，而 `openclaw skills install` 仍然是独立的 ClawHub Skills 下载/安装流程。

兼容的 Bundle 会参与相同的插件 list/inspect/enable/disable 流程。当前运行时支持包括 bundle Skills、Claude command-skills、Claude `settings.json` 默认值、Claude `.lsp.json` 和 manifest 声明的 `lspServers` 默认值、Cursor command-skills，以及兼容的 Codex hook 目录。

`openclaw plugins inspect <id>` 还会报告已检测到的 Bundle 能力，以及由 bundle 支持的插件中受支持或不受支持的 MCP 和 LSP 服务器条目。

Marketplace 来源可以是 `~/.claude/plugins/known_marketplaces.json` 中 Claude 已知 marketplace 名称、本地 marketplace 根目录或 `marketplace.json` 路径、类似 `owner/repo` 的 GitHub 简写、GitHub 仓库 URL，或 git URL。对于远程 marketplace，插件条目必须保留在克隆出的 marketplace 仓库内部，并且只能使用相对路径来源。

完整详情请参见 [`openclaw plugins` CLI 参考](/zh-CN/cli/plugins)。

## 插件 API 概览

原生插件会导出一个入口对象，该对象暴露 `register(api)`。较旧的插件可能仍使用 `activate(api)` 作为旧版别名，但新插件应使用 `register`。

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

`api.registrationMode` 会告知插件为何正在加载其入口：

| 模式 | 含义 |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | 运行时激活。注册工具、钩子、服务、命令、路由以及其他实时副作用。 |
| `discovery`     | 只读能力发现。注册提供商和元数据；可信插件入口代码可能会被加载，但应跳过实时副作用。 |
| `setup-only`    | 通过轻量级 setup 入口加载渠道设置元数据。 |
| `setup-runtime` | 加载同时需要运行时入口的渠道设置。 |
| `cli-metadata`  | 仅收集 CLI 命令元数据。 |

对于会打开套接字、数据库、后台工作器或长生命周期客户端的插件入口，应使用 `api.registrationMode === "full"` 来保护这些副作用。发现加载与激活加载会分别缓存，且不会替换正在运行的 Gateway 网关注册表。发现是非激活式的，但并非免导入：OpenClaw 可能会执行可信插件入口或渠道插件模块，以构建快照。请保持模块顶层轻量且无副作用，并将网络客户端、子进程、监听器、凭证读取和服务启动放到完整运行时路径之后。

常见的注册方法：

| 方法 | 注册内容 |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | 模型提供商（LLM） |
| `registerChannel`                       | 聊天渠道 |
| `registerTool`                          | 智能体工具 |
| `registerHook` / `on(...)`              | 生命周期钩子 |
| `registerSpeechProvider`                | 文本转语音 / STT |
| `registerRealtimeTranscriptionProvider` | 流式 STT |
| `registerRealtimeVoiceProvider`         | 双向实时语音 |
| `registerMediaUnderstandingProvider`    | 图像/音频分析 |
| `registerImageGenerationProvider`       | 图像生成 |
| `registerMusicGenerationProvider`       | 音乐生成 |
| `registerVideoGenerationProvider`       | 视频生成 |
| `registerWebFetchProvider`              | 网页抓取 / 抓取提供商 |
| `registerWebSearchProvider`             | 网页搜索 |
| `registerHttpRoute`                     | HTTP 端点 |
| `registerCommand` / `registerCli`       | CLI 命令 |
| `registerContextEngine`                 | 上下文引擎 |
| `registerService`                       | 后台服务 |

类型化生命周期钩子的钩子守卫行为：

- `before_tool_call`：`{ block: true }` 为终止结果；会跳过更低优先级的处理器。
- `before_tool_call`：`{ block: false }` 是无操作，不会清除更早的 block。
- `before_install`：`{ block: true }` 为终止结果；会跳过更低优先级的处理器。
- `before_install`：`{ block: false }` 是无操作，不会清除更早的 block。
- `message_sending`：`{ cancel: true }` 为终止结果；会跳过更低优先级的处理器。
- `message_sending`：`{ cancel: false }` 是无操作，不会清除更早的 cancel。

原生 Codex app-server 运行时会将 bridge 的 Codex 原生工具事件回传到这个钩子表面。插件可以通过 `before_tool_call` 阻止原生 Codex 工具，通过 `after_tool_call` 观察结果，并参与 Codex
`PermissionRequest` 审批。该 bridge 目前还不会重写 Codex 原生工具参数。精确的 Codex 运行时支持边界见
[Codex harness v1 支持契约](/zh-CN/plugins/codex-harness#v1-support-contract)。

完整的类型化钩子行为请参见 [SDK 概览](/zh-CN/plugins/sdk-overview#hook-decision-semantics)。

## 相关内容

- [构建插件](/zh-CN/plugins/building-plugins) — 创建你自己的插件
- [Plugin Bundles](/zh-CN/plugins/bundles) — Codex/Claude/Cursor Bundle 兼容性
- [Plugin manifest](/zh-CN/plugins/manifest) — manifest schema
- [注册工具](/zh-CN/plugins/building-plugins#registering-agent-tools) — 在插件中添加智能体工具
- [插件内部机制](/zh-CN/plugins/architecture) — 能力模型和加载流水线
- [Community Plugins](/zh-CN/plugins/community) — 第三方列表
