---
read_when:
    - 安装或配置插件
    - 了解插件发现和加载规则
    - 使用与 Codex/Claude 兼容的插件包
sidebarTitle: Install and Configure
summary: 安装、配置和管理 OpenClaw 插件
title: 插件
x-i18n:
    generated_at: "2026-04-25T05:57:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 54a902eabd90e54e769429770cd56e1d89a8bb50aff4b9ed8a9f68d6685b77a8
    source_path: tools/plugin.md
    workflow: 15
---

插件通过新增能力来扩展 OpenClaw：渠道、模型提供商、
Agent harnesses、工具、Skills、语音、实时转写、实时
语音、媒体理解、图像生成、视频生成、web 抓取、web
搜索等等。有些插件是**核心**插件（随 OpenClaw 一起提供），另一些
是**外部**插件（由社区发布到 npm）。

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

    然后在你的配置文件中于 `plugins.entries.\<id\>.config` 下进行配置。

  </Step>
</Steps>

如果你更喜欢原生聊天控制，请启用 `commands.plugins: true` 并使用：

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

安装路径使用与 CLI 相同的解析器：本地路径/归档文件、显式
`clawhub:<pkg>`，或裸包规格（先 ClawHub，后 npm 回退）。

如果配置无效，安装通常会以封闭失败方式结束，并提示你使用
`openclaw doctor --fix`。唯一的恢复例外是一个针对选择启用了
`openclaw.install.allowInvalidConfigRecovery` 的插件的狭窄内置插件
重装路径。

打包版 OpenClaw 安装不会急切安装每个内置插件的
运行时依赖树。当某个 OpenClaw 自有内置插件因为插件配置、
旧版渠道配置或默认启用的清单而处于活动状态时，启动修复只会在导入它之前
修复该插件声明的运行时依赖。显式禁用仍然优先：`plugins.entries.<id>.enabled: false`、
`plugins.deny`、`plugins.enabled: false` 和 `channels.<id>.enabled: false`
都会阻止该插件/渠道的自动内置运行时依赖修复。
外部插件和自定义加载路径仍然必须通过
`openclaw plugins install` 安装。

## 插件类型

OpenClaw 可识别两种插件格式：

| 格式       | 工作方式                                                   | 示例                                                   |
| ---------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + 运行时模块；在进程内执行          | 官方插件、社区 npm 包                                  |
| **Bundle** | 与 Codex/Claude/Cursor 兼容的布局；映射为 OpenClaw 功能    | `.codex-plugin/`、`.claude-plugin/`、`.cursor-plugin/` |

两者都会显示在 `openclaw plugins list` 中。有关 bundle 详情，请参见 [Plugin Bundles](/zh-CN/plugins/bundles)。

如果你要编写 Native 插件，请从 [构建插件](/zh-CN/plugins/building-plugins)
和 [插件 SDK 概览](/zh-CN/plugins/sdk-overview) 开始。

## 官方插件

### 可安装（npm）

| 插件            | 包                     | 文档                                 |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/zh-CN/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/zh-CN/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/zh-CN/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/zh-CN/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/zh-CN/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/zh-CN/plugins/zalouser)   |

### 核心（随 OpenClaw 一起提供）

<AccordionGroup>
  <Accordion title="模型提供商（默认启用）">
    `anthropic`、`byteplus`、`cloudflare-ai-gateway`、`github-copilot`、`google`、
    `huggingface`、`kilocode`、`kimi-coding`、`minimax`、`mistral`、`qwen`、
    `moonshot`、`nvidia`、`openai`、`opencode`、`opencode-go`、`openrouter`、
    `qianfan`、`synthetic`、`together`、`venice`、
    `vercel-ai-gateway`、`volcengine`、`xiaomi`、`zai`
  </Accordion>

  <Accordion title="Memory 插件">
    - `memory-core` — 内置 memory 搜索（通过 `plugins.slots.memory` 默认启用）
    - `memory-lancedb` — 按需安装的长期 memory，带自动 recall/capture（设置 `plugins.slots.memory = "memory-lancedb"`）
  </Accordion>

  <Accordion title="语音提供商（默认启用）">
    `elevenlabs`、`microsoft`
  </Accordion>

  <Accordion title="其他">
    - `browser` — browser 工具、`openclaw browser` CLI、`browser.request` gateway 方法、browser 运行时以及默认 browser 控制服务的内置 browser 插件（默认启用；替换前请先禁用）
    - `copilot-proxy` — VS Code Copilot Proxy bridge（默认禁用）
  </Accordion>
</AccordionGroup>

在找第三方插件？请参见 [社区插件](/zh-CN/plugins/community)。

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

| 字段             | 描述                                               |
| ---------------- | -------------------------------------------------- |
| `enabled`        | 主开关（默认：`true`）                             |
| `allow`          | 插件允许名单（可选）                               |
| `deny`           | 插件拒绝名单（可选；拒绝优先）                     |
| `load.paths`     | 额外的插件文件/目录                                |
| `slots`          | 独占插槽选择器（例如 `memory`、`contextEngine`）   |
| `entries.\<id\>` | 每个插件的开关 + 配置                              |

配置更改**需要重启网关**。如果 Gateway 网关以配置监视 + 进程内重启启用方式运行（默认的 `openclaw gateway` 路径），该
重启通常会在配置写入完成后不久自动执行。
对于 Native 插件运行时代码或生命周期
钩子，没有受支持的热重载路径；请重启正在为实时渠道提供服务的 Gateway 网关进程，然后再期待更新后的 `register(api)` 代码、`api.on(...)` 钩子、工具、服务或
provider/运行时钩子生效。

`openclaw plugins list` 是本地 CLI/配置快照。其中某个插件显示为
`loaded`，意味着从该次 CLI 调用所见的配置/文件来看，该插件是可发现且可加载的。
这并不能证明一个已经运行中的远程 Gateway 网关子进程
已经重启并加载到了相同的插件代码。在 VPS/容器设置中，请将重启信号发送给实际的
`openclaw gateway run` 进程，或对正在运行的 Gateway 网关使用
`openclaw gateway restart`。

<Accordion title="插件状态：disabled vs missing vs invalid">
  - **Disabled**：插件存在，但启用规则将其关闭。配置会被保留。
  - **Missing**：配置引用了一个插件 id，但设备发现未找到该插件。
  - **Invalid**：插件存在，但其配置不匹配已声明的 schema。
</Accordion>

## 发现和优先级

OpenClaw 按以下顺序扫描插件（先匹配者优先）：

<Steps>
  <Step title="配置路径">
    `plugins.load.paths` — 显式文件或目录路径。
  </Step>

  <Step title="工作区插件">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` 和 `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="全局插件">
    `~/.openclaw/<plugin-root>/*.ts` 和 `~/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="内置插件">
    随 OpenClaw 一起提供。许多默认启用（模型提供商、语音）。
    其他则需要显式启用。
  </Step>
</Steps>

### 启用规则

- `plugins.enabled: false` 会禁用所有插件
- `plugins.deny` 始终优先于 allow
- `plugins.entries.\<id\>.enabled: false` 会禁用该插件
- 工作区来源的插件**默认禁用**（必须显式启用）
- 内置插件遵循内建的默认启用集合，除非被覆盖
- 独占插槽可以强制启用为该插槽选中的插件
- 某些内置的选择加入型插件会在配置命名了
  插件自有 surface 时自动启用，例如 provider 模型引用、渠道配置或 harness
  运行时
- OpenAI 系列 Codex 路由保持独立插件边界：
  `openai-codex/*` 属于 OpenAI 插件，而内置 Codex
  app-server 插件则通过 `embeddedHarness.runtime: "codex"` 或旧版
  `codex/*` 模型引用来选择

## 运行时钩子故障排除

如果某个插件出现在 `plugins list` 中，但 `register(api)` 副作用或钩子
在实时聊天流量中没有运行，请先检查以下内容：

- 运行 `openclaw gateway status --deep --require-rpc` 并确认活动中的
  Gateway 网关 URL、profile、配置路径和进程就是你正在编辑的那些。
- 在插件安装/配置/代码更改后重启实时 Gateway 网关。在包装器
  容器中，PID 1 可能只是一个 supervisor；请重启或向子
  `openclaw gateway run` 进程发送信号。
- 使用 `openclaw plugins inspect <id> --json` 确认钩子注册和
  诊断信息。非内置的对话钩子，例如 `llm_input`、
  `llm_output` 和 `agent_end`，需要设置
  `plugins.entries.<id>.hooks.allowConversationAccess=true`。
- 对于模型切换，优先使用 `before_model_resolve`。它会在智能体轮次的模型解析之前运行；`llm_output` 只有在某次模型尝试产生助手输出后才会运行。
- 如需证明会话的实际模型，请使用 `openclaw sessions` 或
  Gateway 网关会话/Status surface；在调试 provider 负载时，请使用
  `--raw-stream --raw-stream-path <path>` 启动 Gateway 网关。

## 插件插槽（独占类别）

某些类别是独占的（同一时间只能有一个处于活动状态）：

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

| 插槽             | 控制内容               | 默认值              |
| ---------------- | ---------------------- | ------------------- |
| `memory`         | 活动中的 memory 插件   | `memory-core`       |
| `contextEngine`  | 活动中的上下文引擎     | `legacy`（内置）    |

## CLI 参考

```bash
openclaw plugins list                       # 紧凑清单
openclaw plugins list --enabled            # 仅显示已加载插件
openclaw plugins list --verbose            # 每个插件的详细行
openclaw plugins list --json               # 机器可读清单
openclaw plugins inspect <id>              # 深度详情
openclaw plugins inspect <id> --json       # 机器可读
openclaw plugins inspect --all             # 全局表格
openclaw plugins info <id>                 # inspect 别名
openclaw plugins doctor                    # 诊断

openclaw plugins install <package>         # 安装（先 ClawHub，后 npm）
openclaw plugins install clawhub:<pkg>     # 仅从 ClawHub 安装
openclaw plugins install <spec> --force    # 覆盖现有安装
openclaw plugins install <path>            # 从本地路径安装
openclaw plugins install -l <path>         # link（不复制），用于开发
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # 记录精确解析后的 npm spec
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # 更新单个插件
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # 更新全部
openclaw plugins uninstall <id>          # 删除配置/安装记录
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

内置插件随 OpenClaw 一起提供。许多默认启用（例如
内置模型提供商、内置语音提供商，以及内置 browser
插件）。其他内置插件仍然需要 `openclaw plugins enable <id>`。

`--force` 会原地覆盖现有已安装插件或 hook pack。对于已跟踪的 npm
插件的常规升级，请使用 `openclaw plugins update <id-or-npm-spec>`。
它不支持与 `--link` 一起使用，因为后者会复用源路径，
而不是复制到受管理的安装目标中。

当已经设置了 `plugins.allow` 时，`openclaw plugins install` 会先将
已安装插件 id 添加到该允许名单中，然后再启用它，这样插件在重启后
即可立即加载。

`openclaw plugins update <id-or-npm-spec>` 适用于已跟踪安装。传入
带 dist-tag 或精确版本的 npm 包 spec 时，会将包名解析回
已跟踪的插件记录，并记录新的 spec 以供后续更新。
传入不带版本的包名时，会将一个精确固定版本的安装切回
注册表的默认发布线。如果已安装的 npm 插件已经匹配
解析后的版本和记录的工件身份，OpenClaw 会跳过更新，不会下载、
重新安装或重写配置。

`--pin` 仅适用于 npm。它不支持与 `--marketplace` 一起使用，因为
marketplace 安装会持久化 marketplace 源元数据，而不是 npm spec。

`--dangerously-force-unsafe-install` 是用于处理内置危险代码扫描器
误报的紧急覆盖开关。它允许插件安装
和插件更新在遇到内置 `critical` 发现后继续执行，但仍然
不会绕过插件 `before_install` 策略阻止或扫描失败阻止。

这个 CLI 标志仅适用于插件安装/更新流程。Gateway 网关支持的 Skills
依赖安装则使用匹配的 `dangerouslyForceUnsafeInstall` 请求覆盖，
而 `openclaw skills install` 仍然是单独的 ClawHub Skills 下载/安装流程。

兼容的 bundle 也参与相同的插件 list/inspect/enable/disable 流程。
当前运行时支持包括 bundle Skills、Claude command-Skills、
Claude `settings.json` 默认值、Claude `.lsp.json` 和清单声明的
`lspServers` 默认值、Cursor command-Skills，以及兼容的 Codex hook
目录。

`openclaw plugins inspect <id>` 还会报告已检测到的 bundle 能力，以及
由 bundle 支持的插件中的受支持或不受支持的 MCP 和 LSP server 条目。

Marketplace 源可以是来自
`~/.claude/plugins/known_marketplaces.json` 的 Claude 已知 marketplace 名称、本地 marketplace 根目录或
`marketplace.json` 路径、像 `owner/repo` 这样的 GitHub 简写、GitHub 仓库
URL，或 git URL。对于远程 marketplaces，插件条目必须保持在
克隆的 marketplace 仓库内部，并且只能使用相对路径源。

完整详情请参见 [`openclaw plugins` CLI 参考](/zh-CN/cli/plugins)。

## 插件 API 概览

Native 插件会导出一个暴露 `register(api)` 的入口对象。较旧的
插件仍可能使用 `activate(api)` 作为旧版别名，但新插件应当
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

OpenClaw 会加载该入口对象，并在插件
激活期间调用 `register(api)`。加载器仍会为旧插件回退到 `activate(api)`，
但内置插件和新的外部插件应将 `register` 视为
公开契约。

`api.registrationMode` 会告诉插件其入口为何被加载：

| 模式            | 含义                                                                                                                             |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | 运行时激活。注册工具、钩子、服务、命令、路由及其他实时副作用。                                                                   |
| `discovery`     | 只读能力发现。注册提供商和元数据；可信插件入口代码可能会被加载，但要跳过实时副作用。                                           |
| `setup-only`    | 通过轻量级设置入口加载渠道设置元数据。                                                                                           |
| `setup-runtime` | 加载渠道设置，同时也需要运行时入口。                                                                                             |
| `cli-metadata`  | 仅收集 CLI 命令元数据。                                                                                                          |

那些会打开 socket、数据库、后台 worker 或长生命周期
客户端的插件入口，应当使用 `api.registrationMode === "full"` 保护这些副作用。
设备发现加载会与激活加载分开缓存，并且不会替换正在运行的 Gateway 网关注册表。
设备发现是非激活的，而不是免导入的：OpenClaw 可能会执行可信的插件入口或渠道插件模块以构建
快照。请保持模块顶层轻量且无副作用，并将
网络客户端、子进程、监听器、凭证读取和服务启动移动到完整运行时路径之后。

常见注册方法：

| 方法                                  | 注册内容                    |
| ------------------------------------- | --------------------------- |
| `registerProvider`                    | 模型提供商（LLM）           |
| `registerChannel`                     | 聊天渠道                    |
| `registerTool`                        | 智能体工具                  |
| `registerHook` / `on(...)`            | 生命周期钩子                |
| `registerSpeechProvider`              | 文本转语音 / STT            |
| `registerRealtimeTranscriptionProvider` | 实时分块流式 STT          |
| `registerRealtimeVoiceProvider`       | 双工实时语音                |
| `registerMediaUnderstandingProvider`  | 图像/音频分析               |
| `registerImageGenerationProvider`     | 图像生成                    |
| `registerMusicGenerationProvider`     | 音乐生成                    |
| `registerVideoGenerationProvider`     | 视频生成                    |
| `registerWebFetchProvider`            | Web 抓取 / 抓取提供商       |
| `registerWebSearchProvider`           | Web 搜索                    |
| `registerHttpRoute`                   | HTTP 端点                   |
| `registerCommand` / `registerCli`     | CLI 命令                    |
| `registerContextEngine`               | 上下文引擎                  |
| `registerService`                     | 后台服务                    |

带类型生命周期钩子的守卫行为：

- `before_tool_call`：`{ block: true }` 是终止性的；会跳过更低优先级的处理器。
- `before_tool_call`：`{ block: false }` 是空操作，不会清除先前的阻止。
- `before_install`：`{ block: true }` 是终止性的；会跳过更低优先级的处理器。
- `before_install`：`{ block: false }` 是空操作，不会清除先前的阻止。
- `message_sending`：`{ cancel: true }` 是终止性的；会跳过更低优先级的处理器。
- `message_sending`：`{ cancel: false }` 是空操作，不会清除先前的取消。

Native Codex app-server 运行时会将桥接的 Codex 原生工具事件回传到这个
钩子 surface。插件可以通过 `before_tool_call` 阻止原生 Codex 工具，
通过 `after_tool_call` 观察结果，并参与 Codex
`PermissionRequest` 批准。该桥目前还不会重写 Codex 原生工具
参数。精确的 Codex 运行时支持边界位于
[Codex harness v1 支持契约](/zh-CN/plugins/codex-harness#v1-support-contract)。

有关完整的带类型钩子行为，请参见 [SDK 概览](/zh-CN/plugins/sdk-overview#hook-decision-semantics)。

## 相关内容

- [构建插件](/zh-CN/plugins/building-plugins) — 创建你自己的插件
- [Plugin Bundles](/zh-CN/plugins/bundles) — 与 Codex/Claude/Cursor 的 bundle 兼容性
- [插件清单](/zh-CN/plugins/manifest) — 清单 schema
- [注册工具](/zh-CN/plugins/building-plugins#registering-agent-tools) — 在插件中添加智能体工具
- [插件内部机制](/zh-CN/plugins/architecture) — 能力模型和加载流水线
- [社区插件](/zh-CN/plugins/community) — 第三方列表
