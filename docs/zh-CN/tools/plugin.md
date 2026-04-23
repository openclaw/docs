---
read_when:
    - 安装或配置插件
    - 了解插件发现和加载规则
    - 使用与 Codex/Claude 兼容的插件包
sidebarTitle: Install and Configure
summary: 安装、配置并管理 OpenClaw 插件
title: 插件
x-i18n:
    generated_at: "2026-04-23T13:33:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 63aa1b5ed9e3aaa2117b78137a457582b00ea47d94af7da3780ddae38e8e3665
    source_path: tools/plugin.md
    workflow: 15
---

# 插件

插件可为 OpenClaw 扩展新能力：渠道、模型提供商、工具、Skills、语音、实时转写、实时语音、媒体理解、图像生成、视频生成、网页抓取、网页搜索等。有些插件是 **核心** 插件（随 OpenClaw 一起提供），另一些是 **外部** 插件（由社区发布到 npm）。

## 快速开始

<Steps>
  <Step title="查看已加载的内容">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="安装插件">
    ```bash
    # 从 npm 安装
    openclaw plugins install @openclaw/voice-call

    # 从本地目录或归档文件安装
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

如果你更喜欢以聊天原生方式控制，可启用 `commands.plugins: true` 并使用：

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

安装路径使用与 CLI 相同的解析器：本地路径/归档文件、显式 `clawhub:<pkg>`，或裸包规范（优先 ClawHub，随后回退到 npm）。

如果配置无效，安装通常会以安全失败方式结束，并提示你运行
`openclaw doctor --fix`。唯一的恢复例外，是为选择启用
`openclaw.install.allowInvalidConfigRecovery`
的插件提供的一条有限的内置插件重装路径。

打包后的 OpenClaw 安装不会预先安装每个内置插件的完整运行时依赖树。当某个 OpenClaw 自带的内置插件通过插件配置、旧版渠道配置或默认启用的清单处于活动状态时，启动修复只会在导入该插件之前修复它所声明的运行时依赖。外部插件和自定义加载路径仍必须通过
`openclaw plugins install`
安装。

## 插件类型

OpenClaw 可识别两种插件格式：

| 格式 | 工作方式 | 示例 |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **原生** | `openclaw.plugin.json` + 运行时模块；在进程内执行 | 官方插件、社区 npm 包 |
| **Bundle** | 与 Codex/Claude/Cursor 兼容的布局；映射到 OpenClaw 功能 | `.codex-plugin/`、`.claude-plugin/`、`.cursor-plugin/` |

两者都会显示在 `openclaw plugins list` 中。有关 bundle 的详细信息，请参阅 [插件 Bundle](/zh-CN/plugins/bundles)。

如果你要编写原生插件，请从 [构建插件](/zh-CN/plugins/building-plugins)
和 [插件 SDK 概览](/zh-CN/plugins/sdk-overview) 开始。

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

### 核心（随 OpenClaw 一起提供）

<AccordionGroup>
  <Accordion title="模型提供商（默认启用）">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="内存插件">
    - `memory-core` — 内置内存搜索（通过 `plugins.slots.memory` 默认启用）
    - `memory-lancedb` — 按需安装的长期记忆，支持自动回忆/捕获（设置 `plugins.slots.memory = "memory-lancedb"`）
  </Accordion>

  <Accordion title="语音提供商（默认启用）">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="其他">
    - `browser` — 内置浏览器插件，用于浏览器工具、`openclaw browser` CLI、`browser.request` Gateway 网关方法、浏览器运行时以及默认浏览器控制服务（默认启用；替换前请先禁用）
    - `copilot-proxy` — VS Code Copilot Proxy 桥接（默认禁用）
  </Accordion>
</AccordionGroup>

在找第三方插件？请参阅 [社区插件](/zh-CN/plugins/community)。

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
| `load.paths` | 额外的插件文件/目录 |
| `slots` | 独占插槽选择器（例如 `memory`、`contextEngine`） |
| `entries.\<id\>` | 每个插件的开关 + 配置 |

配置更改**需要重启 Gateway 网关**。如果 Gateway 网关以启用配置监视和进程内重启的方式运行（默认的 `openclaw gateway` 路径），则在配置写入后不久，通常会自动执行该重启。

<Accordion title="插件状态：已禁用 vs 缺失 vs 无效">
  - **已禁用**：插件存在，但启用规则将其关闭。配置会被保留。
  - **缺失**：配置引用了某个插件 ID，但设备发现未找到该插件。
  - **无效**：插件存在，但其配置不匹配声明的 schema。
</Accordion>

## 发现顺序与优先级

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
    随 OpenClaw 一起提供。许多插件默认启用（模型提供商、语音）。
    其他插件则需要显式启用。
  </Step>
</Steps>

### 启用规则

- `plugins.enabled: false` 会禁用所有插件
- `plugins.deny` 始终优先于 allow
- `plugins.entries.\<id\>.enabled: false` 会禁用该插件
- 来源于工作区的插件**默认禁用**（必须显式启用）
- 内置插件遵循内建的默认启用集合，除非被覆盖
- 独占插槽可强制启用该插槽中被选中的插件

## 插件插槽（独占类别）

有些类别是独占的（同一时间只能有一个处于活动状态）：

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // 或使用 "none" 禁用
      contextEngine: "legacy", // 或某个插件 id
    },
  },
}
```

| 插槽 | 控制内容 | 默认值 |
| --------------- | --------------------- | ------------------- |
| `memory` | 活动内存插件 | `memory-core` |
| `contextEngine` | 活动上下文引擎 | `legacy`（内建） |

## CLI 参考

```bash
openclaw plugins list                       # 紧凑清单
openclaw plugins list --enabled            # 仅显示已加载插件
openclaw plugins list --verbose            # 每个插件的详细信息行
openclaw plugins list --json               # 机器可读清单
openclaw plugins inspect <id>              # 深度详情
openclaw plugins inspect <id> --json       # 机器可读
openclaw plugins inspect --all             # 全量表格
openclaw plugins info <id>                 # inspect 的别名
openclaw plugins doctor                    # 诊断

openclaw plugins install <package>         # 安装（优先 ClawHub，随后 npm）
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
openclaw plugins update --all            # 更新全部
openclaw plugins uninstall <id>          # 删除配置/安装记录
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

内置插件随 OpenClaw 一起提供。许多插件默认启用（例如内置模型提供商、内置语音提供商，以及内置浏览器插件）。其他内置插件仍然需要运行 `openclaw plugins enable <id>`。

`--force` 会就地覆盖现有已安装的插件或 hook 包。对已跟踪的 npm
插件进行常规升级时，请使用
`openclaw plugins update <id-or-npm-spec>`。
它不支持与 `--link` 一起使用，因为后者会复用源路径，而不是复制到受管的安装目标。

当已设置 `plugins.allow` 时，`openclaw plugins install` 会在启用插件之前，将已安装插件的 ID 添加到该允许列表中，因此重启后即可立即加载。

`openclaw plugins update <id-or-npm-spec>` 适用于已跟踪的安装。传入带有 dist-tag 或精确版本的 npm 包规范时，会把包名解析回已跟踪的插件记录，并记录新的规范以供后续更新。传入不带版本的包名时，会将一个精确固定版本的安装移回注册表的默认发布线。如果已安装的 npm 插件已经与解析后的版本和记录的制品标识匹配，OpenClaw 会跳过更新，不会下载、重新安装或重写配置。

`--pin` 仅适用于 npm。它不支持与 `--marketplace` 一起使用，因为 marketplace 安装会持久化 marketplace 来源元数据，而不是 npm 规范。

`--dangerously-force-unsafe-install` 是一个用于紧急处理的覆盖开关，用于应对内置危险代码扫描器的误报。它允许插件安装和插件更新在遇到内置 `critical` 发现后继续执行，但仍不会绕过插件 `before_install` 策略拦截或扫描失败拦截。

这个 CLI 标志仅适用于插件安装/更新流程。由 Gateway 网关支持的 Skills 依赖安装则使用对应的 `dangerouslyForceUnsafeInstall` 请求覆盖；而 `openclaw skills install` 仍是单独的 ClawHub Skills 下载/安装流程。

兼容的 bundle 参与同一套插件 list/inspect/enable/disable 流程。当前运行时支持包括 bundle Skills、Claude command-skills、Claude `settings.json` 默认值、Claude `.lsp.json` 和清单声明的 `lspServers` 默认值、Cursor command-skills，以及兼容的 Codex hook 目录。

`openclaw plugins inspect <id>` 还会报告已检测到的 bundle 能力，以及由 bundle 支持的或不受支持的 MCP 和 LSP 服务器条目。

Marketplace 来源可以是 Claude 已知 marketplace 名称（来自
`~/.claude/plugins/known_marketplaces.json`）、本地 marketplace 根目录或
`marketplace.json` 路径、形如 `owner/repo` 的 GitHub 简写、GitHub 仓库
URL，或 git URL。对于远程 marketplace，插件条目必须保留在已克隆的
marketplace 仓库内，并且只能使用相对路径来源。

有关完整详情，请参阅 [`openclaw plugins` CLI 参考](/zh-CN/cli/plugins)。

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

OpenClaw 会加载该入口对象，并在插件激活期间调用 `register(api)`。对于较旧的插件，加载器仍会回退到 `activate(api)`，但内置插件和新的外部插件应将 `register` 视为公开契约。

常见的注册方法：

| 方法 | 注册内容 |
| --------------------------------------- | --------------------------- |
| `registerProvider` | 模型提供商（LLM） |
| `registerChannel` | 聊天渠道 |
| `registerTool` | 智能体工具 |
| `registerHook` / `on(...)` | 生命周期 hooks |
| `registerSpeechProvider` | 文本转语音 / STT |
| `registerRealtimeTranscriptionProvider` | 流式 STT |
| `registerRealtimeVoiceProvider` | 双向实时语音 |
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

类型化生命周期 hook 的 guard 行为：

- `before_tool_call`：`{ block: true }` 是终止性的；会跳过更低优先级的处理器。
- `before_tool_call`：`{ block: false }` 是空操作，不会清除更早的 block。
- `before_install`：`{ block: true }` 是终止性的；会跳过更低优先级的处理器。
- `before_install`：`{ block: false }` 是空操作，不会清除更早的 block。
- `message_sending`：`{ cancel: true }` 是终止性的；会跳过更低优先级的处理器。
- `message_sending`：`{ cancel: false }` 是空操作，不会清除更早的 cancel。

有关完整的类型化 hook 行为，请参阅 [SDK 概览](/zh-CN/plugins/sdk-overview#hook-decision-semantics)。

## 相关内容

- [构建插件](/zh-CN/plugins/building-plugins) — 创建你自己的插件
- [插件 Bundle](/zh-CN/plugins/bundles) — 与 Codex/Claude/Cursor bundle 的兼容性
- [插件清单](/zh-CN/plugins/manifest) — 清单 schema
- [注册工具](/zh-CN/plugins/building-plugins#registering-agent-tools) — 在插件中添加智能体工具
- [插件内部原理](/zh-CN/plugins/architecture) — 能力模型和加载流水线
- [社区插件](/zh-CN/plugins/community) — 第三方列表
