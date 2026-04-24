---
read_when:
    - 安装或配置插件
    - 了解插件发现和加载规则
    - 使用与 Codex/Claude 兼容的插件包
sidebarTitle: Install and Configure
summary: 安装、配置和管理 OpenClaw 插件
title: 插件
x-i18n:
    generated_at: "2026-04-24T08:40:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 83ab1218d6677ad518a4991ca546d55eed9648e1fa92b76b7433ecd5df569e28
    source_path: tools/plugin.md
    workflow: 15
---

插件通过新增能力来扩展 OpenClaw：渠道、模型提供商、智能体 harness、工具、技能、语音、实时转录、实时语音、媒体理解、图像生成、视频生成、网页抓取、网页搜索等。有些插件是 **核心** 插件（随 OpenClaw 一起发布），另一些则是 **外部** 插件（由社区在 npm 上发布）。

## 快速开始

<Steps>
  <Step title="查看已加载的内容">
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

如果你更喜欢聊天原生的控制方式，可启用 `commands.plugins: true` 并使用：

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

安装路径使用与 CLI 相同的解析器：本地路径/归档文件、显式
`clawhub:<pkg>`，或裸包规范（先 ClawHub，后回退到 npm）。

如果配置无效，安装通常会以安全失败方式终止，并提示你运行
`openclaw doctor --fix`。唯一的恢复例外是一个针对内置插件的有限重装路径，
适用于选择加入
`openclaw.install.allowInvalidConfigRecovery`
的插件。

已打包的 OpenClaw 安装不会急切安装每个内置插件的全部运行时依赖树。
当某个 OpenClaw 自带的内置插件因插件配置、旧版渠道配置或默认启用的清单而处于活跃状态时，
启动过程只会在导入该插件之前修复它声明的运行时依赖。
外部插件和自定义加载路径仍然必须通过
`openclaw plugins install`
进行安装。

## 插件类型

OpenClaw 可识别两种插件格式：

| 格式       | 工作方式                                                   | 示例                                                   |
| ---------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| **原生**   | `openclaw.plugin.json` + 运行时模块；在进程内执行          | 官方插件、社区 npm 包                                  |
| **Bundle** | 与 Codex/Claude/Cursor 兼容的布局；映射到 OpenClaw 功能    | `.codex-plugin/`、`.claude-plugin/`、`.cursor-plugin/` |

两者都会显示在 `openclaw plugins list` 中。有关 Bundle 的详细信息，请参阅 [Plugin Bundles](/zh-CN/plugins/bundles)。

如果你正在编写原生插件，请从 [Building Plugins](/zh-CN/plugins/building-plugins)
和 [插件 SDK 概览](/zh-CN/plugins/sdk-overview) 开始。

## 官方插件

### 可安装（npm）

| 插件             | 包                     | 文档                                 |
| ---------------- | ---------------------- | ------------------------------------ |
| Matrix           | `@openclaw/matrix`     | [Matrix](/zh-CN/channels/matrix)           |
| Microsoft Teams  | `@openclaw/msteams`    | [Microsoft Teams](/zh-CN/channels/msteams) |
| Nostr            | `@openclaw/nostr`      | [Nostr](/zh-CN/channels/nostr)             |
| Voice Call       | `@openclaw/voice-call` | [Voice Call](/zh-CN/plugins/voice-call)    |
| Zalo             | `@openclaw/zalo`       | [Zalo](/zh-CN/channels/zalo)               |
| Zalo Personal    | `@openclaw/zalouser`   | [Zalo Personal](/zh-CN/plugins/zalouser)   |

### 核心（随 OpenClaw 一起发布）

<AccordionGroup>
  <Accordion title="模型提供商（默认启用）">
    `anthropic`、`byteplus`、`cloudflare-ai-gateway`、`github-copilot`、`google`、
    `huggingface`、`kilocode`、`kimi-coding`、`minimax`、`mistral`、`qwen`、
    `moonshot`、`nvidia`、`openai`、`opencode`、`opencode-go`、`openrouter`、
    `qianfan`、`synthetic`、`together`、`venice`、
    `vercel-ai-gateway`、`volcengine`、`xiaomi`、`zai`
  </Accordion>

  <Accordion title="Memory 插件">
    - `memory-core` — 内置的 Memory 搜索（默认通过 `plugins.slots.memory`）
    - `memory-lancedb` — 按需安装的长期 Memory，支持自动召回/捕获（设置 `plugins.slots.memory = "memory-lancedb"`）
  </Accordion>

  <Accordion title="语音提供商（默认启用）">
    `elevenlabs`、`microsoft`
  </Accordion>

  <Accordion title="其他">
    - `browser` — 用于 browser 工具、`openclaw browser` CLI、`browser.request` Gateway 网关方法、browser 运行时以及默认 browser 控制服务的内置 browser 插件（默认启用；在替换它之前请先禁用）
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

| 字段             | 说明                                                      |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | 主开关（默认：`true`）                                    |
| `allow`          | 插件允许列表（可选）                                      |
| `deny`           | 插件拒绝列表（可选；拒绝优先）                            |
| `load.paths`     | 额外的插件文件/目录                                       |
| `slots`          | 独占槽位选择器（例如 `memory`、`contextEngine`）          |
| `entries.\<id\>` | 每个插件的开关 + 配置                                     |

配置更改 **需要重启 Gateway 网关**。如果 Gateway 网关正在以启用配置监听和进程内重启的方式运行
（默认的 `openclaw gateway` 路径），那么在配置写入完成后，
通常会自动稍后执行该重启。

<Accordion title="插件状态：已禁用 vs 缺失 vs 无效">
  - **已禁用**：插件存在，但启用规则将其关闭。配置会被保留。
  - **缺失**：配置引用了某个插件 id，但在发现过程中未找到该插件。
  - **无效**：插件存在，但其配置与声明的 schema 不匹配。
</Accordion>

## 发现与优先级

OpenClaw 按以下顺序扫描插件（先匹配者生效）：

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
- 独占槽位可强制启用为该槽位选中的插件
- 某些选择加入的内置插件会在配置命名了某个
  由插件拥有的表面时自动启用，例如提供商模型引用、渠道配置或 harness
  运行时
- OpenAI 家族的 Codex 路由保持独立的插件边界：
  `openai-codex/*` 属于 OpenAI 插件，而内置的 Codex
  app-server 插件则通过 `embeddedHarness.runtime: "codex"` 或旧版
  `codex/*` 模型引用来选择

## 插件槽位（独占类别）

某些类别是独占的（同一时间只能激活一个）：

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

| 槽位             | 控制内容             | 默认值              |
| ---------------- | -------------------- | ------------------- |
| `memory`         | 活跃的 Memory 插件   | `memory-core`       |
| `contextEngine`  | 活跃的上下文引擎     | `legacy`（内建）    |

## CLI 参考

```bash
openclaw plugins list                       # 精简清单
openclaw plugins list --enabled            # 仅显示已加载插件
openclaw plugins list --verbose            # 每个插件的详细信息行
openclaw plugins list --json               # 机器可读清单
openclaw plugins inspect <id>              # 深度详情
openclaw plugins inspect <id> --json       # 机器可读
openclaw plugins inspect --all             # 全部插件表格
openclaw plugins info <id>                 # inspect 别名
openclaw plugins doctor                    # 诊断

openclaw plugins install <package>         # 安装（先 ClawHub，后 npm）
openclaw plugins install clawhub:<pkg>     # 仅从 ClawHub 安装
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
openclaw plugins uninstall <id>          # 移除配置/安装记录
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

内置插件随 OpenClaw 一起发布。许多插件默认启用（例如
内置模型提供商、内置语音提供商以及内置 browser
插件）。其他内置插件仍然需要执行 `openclaw plugins enable <id>`。

`--force` 会原地覆盖已安装的现有插件或 hook 包。对于已跟踪 npm
插件的常规升级，请使用 `openclaw plugins update <id-or-npm-spec>`。
它不支持与 `--link` 一起使用，因为后者会复用源路径，
而不是复制到受管理的安装目标。

当 `plugins.allow` 已经设置时，`openclaw plugins install` 会在启用插件之前
将已安装插件的 id 添加到该允许列表中，因此重启后即可立即加载。

`openclaw plugins update <id-or-npm-spec>` 适用于已跟踪的安装。
传入带有 dist-tag 或精确版本的 npm 包 spec 时，会将包名解析回已跟踪的插件记录，
并记录新的 spec 以供后续更新使用。
传入不带版本的包名时，会将精确固定版本的安装移回
registry 的默认发布线。如果已安装的 npm 插件已经与解析后的版本和记录的制品标识一致，
OpenClaw 会跳过更新，而不会下载、重装或重写配置。

`--pin` 仅适用于 npm。它不支持与 `--marketplace` 一起使用，因为
marketplace 安装会持久化 marketplace 来源元数据，而不是 npm spec。

`--dangerously-force-unsafe-install` 是一个紧急兜底覆盖选项，用于处理内置危险代码扫描器的误报。
它允许插件安装和插件更新在遇到内置 `critical` 发现后继续进行，
但仍然不会绕过插件 `before_install` 策略阻止或扫描失败阻止。

这个 CLI 标志仅适用于插件安装/更新流程。由 Gateway 网关支持的 Skills
依赖安装则使用对应的 `dangerouslyForceUnsafeInstall` 请求覆盖项，而
`openclaw skills install` 仍然是独立的 ClawHub
技能下载/安装流程。

兼容的 Bundle 会参与相同的插件 list/inspect/enable/disable
流程。当前运行时支持包括 Bundle Skills、Claude command-skills、
Claude `settings.json` 默认值、Claude `.lsp.json` 以及由清单声明的
`lspServers` 默认值、Cursor command-skills，以及兼容的 Codex hook
目录。

`openclaw plugins inspect <id>` 还会报告已检测到的 Bundle 能力，以及
由 Bundle 支持的插件中受支持或不受支持的 MCP 和 LSP server 条目。

Marketplace 来源可以是 Claude 已知 marketplace 名称（来自
`~/.claude/plugins/known_marketplaces.json`）、本地 marketplace 根目录或
`marketplace.json` 路径、类似 `owner/repo` 的 GitHub 简写、GitHub 仓库
URL，或 git URL。对于远程 marketplace，插件条目必须保留在已克隆的
marketplace 仓库内，并且只能使用相对路径来源。

有关完整详情，请参阅 [`openclaw plugins` CLI 参考](/zh-CN/cli/plugins)。

## 插件 API 概览

原生插件会导出一个入口对象，该对象暴露 `register(api)`。较旧的
插件仍可能使用 `activate(api)` 作为旧版别名，但新插件应使用
`register`。

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

OpenClaw 会加载该入口对象，并在插件激活期间调用 `register(api)`。
对于旧插件，加载器仍会回退到 `activate(api)`，
但内置插件和新的外部插件应将 `register` 视为公共契约。

常见的注册方法：

| 方法                                    | 注册内容                    |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | 模型提供商（LLM）           |
| `registerChannel`                       | 聊天渠道                    |
| `registerTool`                          | 智能体工具                  |
| `registerHook` / `on(...)`              | 生命周期 hook               |
| `registerSpeechProvider`                | 文本转语音 / STT            |
| `registerRealtimeTranscriptionProvider` | 流式 STT                    |
| `registerRealtimeVoiceProvider`         | 双向实时语音                |
| `registerMediaUnderstandingProvider`    | 图像/音频分析               |
| `registerImageGenerationProvider`       | 图像生成                    |
| `registerMusicGenerationProvider`       | 音乐生成                    |
| `registerVideoGenerationProvider`       | 视频生成                    |
| `registerWebFetchProvider`              | 网页抓取 / 爬取提供商       |
| `registerWebSearchProvider`             | 网页搜索                    |
| `registerHttpRoute`                     | HTTP 端点                   |
| `registerCommand` / `registerCli`       | CLI 命令                    |
| `registerContextEngine`                 | 上下文引擎                  |
| `registerService`                       | 后台服务                    |

类型化生命周期 hook 的 hook guard 行为：

- `before_tool_call`：`{ block: true }` 为终止结果；会跳过更低优先级的处理程序。
- `before_tool_call`：`{ block: false }` 为 no-op，不会清除更早的 block。
- `before_install`：`{ block: true }` 为终止结果；会跳过更低优先级的处理程序。
- `before_install`：`{ block: false }` 为 no-op，不会清除更早的 block。
- `message_sending`：`{ cancel: true }` 为终止结果；会跳过更低优先级的处理程序。
- `message_sending`：`{ cancel: false }` 为 no-op，不会清除更早的 cancel。

有关完整的类型化 hook 行为，请参阅 [SDK 概览](/zh-CN/plugins/sdk-overview#hook-decision-semantics)。

## 相关内容

- [Building Plugins](/zh-CN/plugins/building-plugins) — 创建你自己的插件
- [Plugin Bundles](/zh-CN/plugins/bundles) — Codex/Claude/Cursor Bundle 兼容性
- [Plugin Manifest](/zh-CN/plugins/manifest) — 清单 schema
- [Registering Tools](/zh-CN/plugins/building-plugins#registering-agent-tools) — 在插件中添加智能体工具
- [Plugin Internals](/zh-CN/plugins/architecture) — 能力模型和加载管线
- [Community Plugins](/zh-CN/plugins/community) — 第三方列表
