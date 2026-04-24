---
read_when:
    - 安装或配置插件
    - 了解插件发现和加载规则
    - 使用与 Codex/Claude 兼容的插件包
sidebarTitle: Install and Configure
summary: 安装、配置和管理 OpenClaw 插件
title: 插件
x-i18n:
    generated_at: "2026-04-24T16:35:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: d7db42c0c8d7d8b3bddda46a8a42fc19b39b093863b1730b8ca66528a95ecb50
    source_path: tools/plugin.md
    workflow: 15
---

插件通过新增能力来扩展 OpenClaw：渠道、模型提供商、智能体 harness、工具、技能、语音、实时转录、实时语音、媒体理解、图像生成、视频生成、网页抓取、网页搜索等等。有些插件是 **core**（随 OpenClaw 一起提供），另一些是 **external**（由社区发布到 npm）。

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

    然后在你的配置文件中的 `plugins.entries.\<id\>.config` 下进行配置。

  </Step>
</Steps>

如果你更喜欢聊天原生控制，请启用 `commands.plugins: true` 并使用：

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

安装路径使用与 CLI 相同的解析器：本地路径/归档文件、显式 `clawhub:<pkg>`，或裸包说明符（优先 ClawHub，然后回退到 npm）。

如果配置无效，安装通常会以关闭失败的方式结束，并提示你运行 `openclaw doctor --fix`。唯一的恢复例外是一个范围很窄的内置插件重装路径，适用于选择加入 `openclaw.install.allowInvalidConfigRecovery` 的插件。

打包的 OpenClaw 安装不会急切安装每个内置插件的运行时依赖树。当一个由 OpenClaw 拥有的内置插件通过插件配置、旧版渠道配置或默认启用的清单处于活动状态时，启动流程只会在导入该插件之前修复该插件声明的运行时依赖。外部插件和自定义加载路径仍然必须通过 `openclaw plugins install` 安装。

## 插件类型

OpenClaw 可识别两种插件格式：

| 格式 | 工作方式 | 示例 |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + 运行时模块；在进程内执行 | 官方插件、社区 npm 包 |
| **Bundle** | 兼容 Codex/Claude/Cursor 的布局；映射到 OpenClaw 功能 | `.codex-plugin/`、`.claude-plugin/`、`.cursor-plugin/` |

两者都会显示在 `openclaw plugins list` 中。有关 bundle 的详细信息，请参阅 [Plugin Bundles](/zh-CN/plugins/bundles)。

如果你正在编写原生插件，请从 [Building Plugins](/zh-CN/plugins/building-plugins) 和 [插件 SDK 概览](/zh-CN/plugins/sdk-overview) 开始。

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

### Core（随 OpenClaw 一起提供）

<AccordionGroup>
  <Accordion title="模型提供商（默认启用）">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory 插件">
    - `memory-core` — 内置 memory 搜索（默认通过 `plugins.slots.memory`）
    - `memory-lancedb` — 按需安装的长期 memory，带自动召回/捕获（设置 `plugins.slots.memory = "memory-lancedb"`）
  </Accordion>

  <Accordion title="语音提供商（默认启用）">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="其他">
    - `browser` — 用于浏览器工具、`openclaw browser` CLI、`browser.request` Gateway 网关方法、浏览器运行时和默认浏览器控制服务的内置浏览器插件（默认启用；替换它之前请先禁用）
    - `copilot-proxy` — VS Code Copilot Proxy bridge（默认禁用）
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

| 字段 | 描述 |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | 主开关（默认：`true`） |
| `allow`          | 插件允许列表（可选） |
| `deny`           | 插件拒绝列表（可选；拒绝优先） |
| `load.paths`     | 额外的插件文件/目录 |
| `slots`          | 独占插槽选择器（例如 `memory`、`contextEngine`） |
| `entries.\<id\>` | 每个插件的开关 + 配置 |

配置更改 **需要重启 Gateway 网关**。如果 Gateway 网关在启用了配置监视和进程内重启的情况下运行（默认的 `openclaw gateway` 路径），通常会在配置写入后稍等片刻自动执行该重启。对于原生插件运行时代码或生命周期 hook，不存在受支持的热重载路径；在期待更新后的 `register(api)` 代码、`api.on(...)` hook、工具、服务或提供商/运行时 hook 生效之前，请重启正在服务实时渠道的 Gateway 网关进程。

`openclaw plugins list` 是本地 CLI/配置快照。其中显示为 `loaded` 的插件，表示该插件可从该次 CLI 调用所见的配置/文件中被发现并加载。这并不能证明一个已经运行的远程 Gateway 网关子进程已经重启并加载了同样的插件代码。在 VPS/容器部署中，如果使用了包装进程，请向实际的 `openclaw gateway run` 进程发送重启信号，或者对正在运行的 Gateway 网关使用 `openclaw gateway restart`。

<Accordion title="插件状态：已禁用 vs 缺失 vs 无效">
  - **已禁用**：插件存在，但启用规则将其关闭。配置会被保留。
  - **缺失**：配置引用了一个插件 id，但发现流程没有找到它。
  - **无效**：插件存在，但其配置与声明的 schema 不匹配。
</Accordion>

## 发现顺序和优先级

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
- `plugins.deny` 总是优先于 allow
- `plugins.entries.\<id\>.enabled: false` 会禁用该插件
- 来自工作区的插件 **默认禁用**（必须显式启用）
- 内置插件遵循内建的默认启用集合，除非被覆盖
- 独占插槽可以强制启用为该插槽选定的插件
- 某些选择加入的内置插件会在配置命名了某个插件拥有的表面时自动启用，例如提供商模型引用、渠道配置或 harness 运行时
- OpenAI 系列的 Codex 路由保持独立的插件边界：
  `openai-codex/*` 属于 OpenAI 插件，而内置的 Codex
  app-server 插件则通过 `embeddedHarness.runtime: "codex"` 或旧版
  `codex/*` 模型引用来选择

## 运行时 hook 故障排除

如果某个插件出现在 `plugins list` 中，但 `register(api)` 副作用或 hook 没有在实时聊天流量中运行，请先检查以下内容：

- 运行 `openclaw gateway status --deep --require-rpc`，并确认活动的
  Gateway 网关 URL、profile、配置路径和进程就是你正在编辑的那些。
- 在插件安装/配置/代码更改后，重启正在运行的 Gateway 网关。在包装容器中，
  PID 1 可能只是一个 supervisor；请重启或向子进程
  `openclaw gateway run` 发送信号。
- 使用 `openclaw plugins inspect <id> --json` 确认 hook 注册和
  诊断信息。像 `llm_input`、
  `llm_output` 和 `agent_end` 这样的非内置会话 hook，需要
  `plugins.entries.<id>.hooks.allowConversationAccess=true`。
- 对于模型切换，优先使用 `before_model_resolve`。它会在智能体轮次的模型解析之前运行；`llm_output` 只会在一次模型尝试生成 assistant 输出之后运行。
- 如需证明实际生效的会话模型，请使用 `openclaw sessions` 或
  Gateway 网关的会话/状态表面；调试提供商 payload 时，请使用
  `--raw-stream --raw-stream-path <path>` 启动 Gateway 网关。

## 插件 slots（独占类别）

某些类别是独占的（一次只能激活一个）：

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // 或使用 "none" 来禁用
      contextEngine: "legacy", // 或一个插件 id
    },
  },
}
```

| 插槽 | 控制内容 | 默认值 |
| --------------- | --------------------- | ------------------- |
| `memory`        | 活动的 memory 插件 | `memory-core`       |
| `contextEngine` | 活动的上下文引擎 | `legacy`（内建） |

## CLI 参考

```bash
openclaw plugins list                       # 精简清单
openclaw plugins list --enabled            # 仅显示已加载的插件
openclaw plugins list --verbose            # 每个插件的详细行
openclaw plugins list --json               # 机器可读的清单
openclaw plugins inspect <id>              # 深度详情
openclaw plugins inspect <id> --json       # 机器可读格式
openclaw plugins inspect --all             # 全量表格
openclaw plugins info <id>                 # inspect 别名
openclaw plugins doctor                    # 诊断

openclaw plugins install <package>         # 安装（优先 ClawHub，然后 npm）
openclaw plugins install clawhub:<pkg>     # 仅从 ClawHub 安装
openclaw plugins install <spec> --force    # 覆盖现有安装
openclaw plugins install <path>            # 从本地路径安装
openclaw plugins install -l <path>         # 链接（不复制），用于开发
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # 记录精确解析后的 npm 说明符
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

内置插件随 OpenClaw 一起提供。许多默认启用（例如内置模型提供商、内置语音提供商，以及内置浏览器插件）。其他内置插件仍然需要执行 `openclaw plugins enable <id>`。

`--force` 会就地覆盖一个已安装的插件或 hook 包。对于已跟踪 npm 插件的常规升级，请使用 `openclaw plugins update <id-or-npm-spec>`。该选项不支持与 `--link` 一起使用，因为后者会复用源路径，而不是复制到受管理的安装目标。

当已经设置了 `plugins.allow` 时，`openclaw plugins install` 会在启用已安装插件之前，将该插件 id 添加到允许列表中，因此重启后安装内容可以立即被加载。

`openclaw plugins update <id-or-npm-spec>` 适用于已跟踪的安装。传入带 dist-tag 或精确版本的 npm 包说明符时，会将包名解析回已跟踪的插件记录，并为后续更新记录新的说明符。传入不带版本的包名时，会将一个精确固定版本的安装切回注册表的默认发布线。如果已安装的 npm 插件已经与解析后的版本以及记录的构件标识一致，OpenClaw 会跳过更新，不会下载、重新安装或重写配置。

`--pin` 仅适用于 npm。它不支持与 `--marketplace` 一起使用，因为 marketplace 安装会持久化 marketplace 来源元数据，而不是 npm 说明符。

`--dangerously-force-unsafe-install` 是一个用于应对内置危险代码扫描器误报的紧急覆盖开关。它允许插件安装和插件更新在内置 `critical` 级别发现之后继续进行，但仍然不会绕过插件 `before_install` 策略阻止或扫描失败阻止。

这个 CLI 标志仅适用于插件安装/更新流程。由 Gateway 网关支持的 Skills 依赖安装则改用对应的 `dangerouslyForceUnsafeInstall` 请求覆盖，而 `openclaw skills install` 仍然是独立的 ClawHub Skills 下载/安装流程。

兼容的 bundle 会参与相同的插件 list/inspect/enable/disable 流程。当前运行时支持包括 bundle Skills、Claude command-skills、Claude `settings.json` 默认值、Claude `.lsp.json` 和由清单声明的 `lspServers` 默认值、Cursor command-skills，以及兼容的 Codex hook 目录。

`openclaw plugins inspect <id>` 还会报告已检测到的 bundle 能力，以及由 bundle 支持的或不支持的 MCP 和 LSP server 条目。

Marketplace 来源可以是 `~/.claude/plugins/known_marketplaces.json` 中的 Claude 已知 marketplace 名称、本地 marketplace 根目录或 `marketplace.json` 路径、类似 `owner/repo` 的 GitHub 简写、GitHub 仓库 URL，或 git URL。对于远程 marketplace，插件条目必须保留在已克隆的 marketplace 仓库内，并且只能使用相对路径来源。

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

OpenClaw 会在插件激活期间加载该入口对象并调用 `register(api)`。加载器仍会为旧插件回退到 `activate(api)`，但内置插件和新的外部插件都应将 `register` 视为公共契约。

常见注册方法：

| 方法 | 注册内容 |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | 模型提供商（LLM） |
| `registerChannel`                       | 聊天渠道 |
| `registerTool`                          | 智能体工具 |
| `registerHook` / `on(...)`              | 生命周期 hook |
| `registerSpeechProvider`                | 文本转语音 / STT |
| `registerRealtimeTranscriptionProvider` | 流式 STT |
| `registerRealtimeVoiceProvider`         | 双向实时语音 |
| `registerMediaUnderstandingProvider`    | 图像/音频分析 |
| `registerImageGenerationProvider`       | 图像生成 |
| `registerMusicGenerationProvider`       | 音乐生成 |
| `registerVideoGenerationProvider`       | 视频生成 |
| `registerWebFetchProvider`              | 网页抓取 / 爬取提供商 |
| `registerWebSearchProvider`             | 网页搜索 |
| `registerHttpRoute`                     | HTTP 端点 |
| `registerCommand` / `registerCli`       | CLI 命令 |
| `registerContextEngine`                 | 上下文引擎 |
| `registerService`                       | 后台服务 |

类型化生命周期 hook 的 hook guard 行为：

- `before_tool_call`：`{ block: true }` 为终止性结果；会跳过更低优先级的处理器。
- `before_tool_call`：`{ block: false }` 为无操作，不会清除更早的阻止。
- `before_install`：`{ block: true }` 为终止性结果；会跳过更低优先级的处理器。
- `before_install`：`{ block: false }` 为无操作，不会清除更早的阻止。
- `message_sending`：`{ cancel: true }` 为终止性结果；会跳过更低优先级的处理器。
- `message_sending`：`{ cancel: false }` 为无操作，不会清除更早的取消。

原生 Codex app-server 会将 bridge 的 Codex 原生工具事件回传到这个 hook 表面。插件可以通过 `before_tool_call` 阻止原生 Codex 工具，通过 `after_tool_call` 观察结果，并参与 Codex `PermissionRequest` 审批。该 bridge 目前还不会重写 Codex 原生工具参数。

有关完整的类型化 hook 行为，请参阅 [SDK 概览](/zh-CN/plugins/sdk-overview#hook-decision-semantics)。

## 相关内容

- [Building Plugins](/zh-CN/plugins/building-plugins) — 创建你自己的插件
- [Plugin Bundles](/zh-CN/plugins/bundles) — Codex/Claude/Cursor bundle 兼容性
- [Plugin Manifest](/zh-CN/plugins/manifest) — 清单 schema
- [Registering Tools](/zh-CN/plugins/building-plugins#registering-agent-tools) — 在插件中添加智能体工具
- [Plugin Internals](/zh-CN/plugins/architecture) — 能力模型和加载流水线
- [Community Plugins](/zh-CN/plugins/community) — 第三方列表
