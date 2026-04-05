---
read_when:
    - 安装或配置插件
    - 了解插件设备发现和加载规则
    - 使用兼容 Codex/Claude 的插件 bundle
sidebarTitle: Install and Configure
summary: 安装、配置和管理 OpenClaw 插件
title: 插件
x-i18n:
    generated_at: "2026-04-05T10:12:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 707bd3625596f290322aeac9fecb7f4c6f45d595fdfb82ded7cbc8e04457ac7f
    source_path: tools/plugin.md
    workflow: 15
---

# 插件

插件通过新增能力来扩展 OpenClaw：渠道、模型 provider、
工具、Skills、语音、实时转录、实时语音、
媒体理解、图像生成、视频生成、Web 抓取、Web
搜索等等。有些插件是**核心**插件（随 OpenClaw 一起提供），另一些
则是**外部**插件（由社区发布到 npm）。

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

    然后在你的配置文件中通过 `plugins.entries.\<id\>.config` 进行配置。

  </Step>
</Steps>

如果你更喜欢在聊天中原生控制，请启用 `commands.plugins: true` 并使用：

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

安装路径使用与 CLI 相同的解析器：本地路径/归档、显式
`clawhub:<pkg>`，或裸包规范（先尝试 ClawHub，再回退到 npm）。

如果配置无效，安装通常会以默认拒绝方式失败，并提示你使用
`openclaw doctor --fix`。唯一的恢复例外是一个范围很窄的内置插件
重装路径，仅适用于选择加入
`openclaw.install.allowInvalidConfigRecovery` 的插件。

## 插件类型

OpenClaw 可识别两种插件格式：

| 格式       | 工作方式                                                        | 示例                                                   |
| ---------- | --------------------------------------------------------------- | ------------------------------------------------------ |
| **原生**   | `openclaw.plugin.json` + 运行时模块；在进程内执行               | 官方插件、社区 npm 包                                  |
| **Bundle** | 兼容 Codex/Claude/Cursor 的布局；映射到 OpenClaw 功能           | `.codex-plugin/`、`.claude-plugin/`、`.cursor-plugin/` |

两者都会出现在 `openclaw plugins list` 中。有关 bundle 的详细信息，请参见 [插件 Bundles](/zh-CN/plugins/bundles)。

如果你要编写原生插件，请从 [构建插件](/zh-CN/plugins/building-plugins)
和 [插件 SDK 概览](/zh-CN/plugins/sdk-overview) 开始。

## 官方插件

### 可安装（npm）

| 插件             | 包                         | 文档                                 |
| ---------------- | -------------------------- | ------------------------------------ |
| Matrix           | `@openclaw/matrix`         | [Matrix](/zh-CN/channels/matrix)           |
| Microsoft Teams  | `@openclaw/msteams`        | [Microsoft Teams](/zh-CN/channels/msteams) |
| Nostr            | `@openclaw/nostr`          | [Nostr](/zh-CN/channels/nostr)             |
| Voice Call       | `@openclaw/voice-call`     | [Voice Call](/zh-CN/plugins/voice-call)    |
| Zalo             | `@openclaw/zalo`           | [Zalo](/zh-CN/channels/zalo)               |
| Zalo Personal    | `@openclaw/zalouser`       | [Zalo Personal](/zh-CN/plugins/zalouser)   |

### 核心（随 OpenClaw 一起提供）

<AccordionGroup>
  <Accordion title="模型 providers（默认启用）">
    `anthropic`、`byteplus`、`cloudflare-ai-gateway`、`github-copilot`、`google`、
    `huggingface`、`kilocode`、`kimi-coding`、`minimax`、`mistral`、`qwen`、
    `moonshot`、`nvidia`、`openai`、`opencode`、`opencode-go`、`openrouter`、
    `qianfan`、`synthetic`、`together`、`venice`、
    `vercel-ai-gateway`、`volcengine`、`xiaomi`、`zai`
  </Accordion>

  <Accordion title="内存插件">
    - `memory-core` — 内置内存搜索（通过 `plugins.slots.memory` 默认启用）
    - `memory-lancedb` — 按需安装的长期记忆，带自动 recall/capture（设置 `plugins.slots.memory = "memory-lancedb"`）
  </Accordion>

  <Accordion title="语音 providers（默认启用）">
    `elevenlabs`、`microsoft`
  </Accordion>

  <Accordion title="其他">
    - `browser` — 用于 browser 工具、`openclaw browser` CLI、`browser.request` gateway 方法、浏览器运行时以及默认浏览器控制服务的内置浏览器插件（默认启用；替换前请先禁用）
    - `copilot-proxy` — VS Code Copilot Proxy bridge（默认禁用）
  </Accordion>
</AccordionGroup>

想找第三方插件？请参见 [社区插件](/zh-CN/plugins/community)。

## 配置

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-extension"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| 字段             | 说明                                                      |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | 主开关（默认：`true`）                                    |
| `allow`          | 插件 allowlist（可选）                                    |
| `deny`           | 插件 denylist（可选；deny 优先）                          |
| `load.paths`     | 额外插件文件/目录                                         |
| `slots`          | 独占 slot 选择器（例如 `memory`、`contextEngine`）        |
| `entries.\<id\>` | 每插件开关 + 配置                                         |

配置变更**需要重启 Gateway 网关**。如果 Gateway 网关以启用了配置监视 +
进程内重启的方式运行（默认 `openclaw gateway` 路径），那么该
重启通常会在配置写入后不久自动执行。

<Accordion title="插件状态：已禁用 vs 缺失 vs 无效">
  - **已禁用**：插件存在，但启用规则将其关闭。配置会被保留。
  - **缺失**：配置引用了某个插件 id，但设备发现没有找到它。
  - **无效**：插件存在，但其配置与声明的 schema 不匹配。
</Accordion>

## 设备发现和优先级

OpenClaw 按以下顺序扫描插件（先匹配者优先）：

<Steps>
  <Step title="配置路径">
    `plugins.load.paths` — 显式文件或目录路径。
  </Step>

  <Step title="工作区扩展">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` 和 `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="全局扩展">
    `~/.openclaw/<plugin-root>/*.ts` 和 `~/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="内置插件">
    随 OpenClaw 一起提供。许多默认启用（模型 providers、语音）。
    其他插件则需要显式启用。
  </Step>
</Steps>

### 启用规则

- `plugins.enabled: false` 会禁用所有插件
- `plugins.deny` 总是优先于 allow
- `plugins.entries.\<id\>.enabled: false` 会禁用该插件
- 来源于工作区的插件**默认禁用**（必须显式启用）
- 内置插件遵循默认启用集合，除非被覆盖
- 独占 slots 可为该 slot 强制启用所选插件

## 插件 slots（独占类别）

有些类别是独占的（一次只能有一个处于活动状态）：

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

| Slot             | 控制内容           | 默认值              |
| ---------------- | ------------------ | ------------------- |
| `memory`         | 活动内存插件       | `memory-core`       |
| `contextEngine`  | 活动上下文引擎     | `legacy`（内置）    |

## CLI 参考

```bash
openclaw plugins list                       # 紧凑清单
openclaw plugins list --enabled            # 仅显示已加载插件
openclaw plugins list --verbose            # 每插件详细信息行
openclaw plugins list --json               # 机器可读清单
openclaw plugins inspect <id>              # 深度详情
openclaw plugins inspect <id> --json       # 机器可读
openclaw plugins inspect --all             # 全局表格
openclaw plugins info <id>                 # inspect 别名
openclaw plugins doctor                    # 诊断

openclaw plugins install <package>         # 安装（先 ClawHub，再 npm）
openclaw plugins install clawhub:<pkg>     # 仅从 ClawHub 安装
openclaw plugins install <spec> --force    # 覆盖现有安装
openclaw plugins install <path>            # 从本地路径安装
openclaw plugins install -l <path>         # 链接（不复制），用于开发
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # 记录精确解析后的 npm 规范
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id>             # 更新单个插件
openclaw plugins update <id> --dangerously-force-unsafe-install
openclaw plugins update --all            # 更新全部
openclaw plugins uninstall <id>          # 移除配置/安装记录
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

内置插件随 OpenClaw 一起提供。许多默认启用（例如
内置模型 providers、内置语音 providers 和内置 browser
插件）。其他内置插件仍需要执行 `openclaw plugins enable <id>`。

`--force` 会原地覆盖现有已安装的插件或 hook 包。
它不支持与 `--link` 一起使用，因为后者会复用源路径，而不是
复制到受管理的安装目标。

`--pin` 仅适用于 npm。不支持与 `--marketplace` 一起使用，因为
marketplace 安装会持久化 marketplace 源元数据，而不是 npm 规范。

`--dangerously-force-unsafe-install` 是一个紧急覆盖开关，用于处理内置危险代码扫描器的误报。
它允许插件安装和插件更新在遇到内置 `critical` 发现后继续进行，但仍然
不会绕过插件 `before_install` 策略阻止或扫描失败阻止。

这个 CLI 标志仅适用于插件安装/更新流程。由 Gateway 网关支持的 Skill
依赖安装则使用对应的 `dangerouslyForceUnsafeInstall` 请求覆盖，而
`openclaw skills install` 仍然是独立的 ClawHub Skill 下载/安装流程。

兼容的 bundle 会参与相同的插件 list/inspect/enable/disable
流程。当前运行时支持包括 bundle Skills、Claude 命令 Skills、
Claude `settings.json` 默认值、Claude `.lsp.json` 以及 manifest 声明的
`lspServers` 默认值、Cursor 命令 Skills 和兼容的 Codex hook
目录。

`openclaw plugins inspect <id>` 还会报告检测到的 bundle 能力，以及
由 bundle 支持或不支持的 MCP 和 LSP server 条目。

Marketplace 源可以是来自
`~/.claude/plugins/known_marketplaces.json` 的 Claude 已知 marketplace 名称、
本地 marketplace 根目录或 `marketplace.json` 路径、类似 `owner/repo` 的 GitHub 简写、
GitHub 仓库 URL，或 git URL。对于远程 marketplaces，插件条目必须保留在
已克隆 marketplace 仓库内部，并且只能使用相对路径源。

完整详情请参见 [`openclaw plugins` CLI 参考](/cli/plugins)。

## 插件 API 概览

原生插件导出一个入口对象，该对象暴露 `register(api)`。旧版
插件仍可能使用 `activate(api)` 作为旧版别名，但新插件应
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
对于旧插件，加载器仍会回退到 `activate(api)`，
但内置插件和新的外部插件应将 `register` 视为公开契约。

常见注册方法：

| 方法                                    | 注册内容                |
| --------------------------------------- | ----------------------- |
| `registerProvider`                      | 模型 provider（LLM）    |
| `registerChannel`                       | 聊天渠道                |
| `registerTool`                          | 智能体工具              |
| `registerHook` / `on(...)`              | 生命周期 hooks          |
| `registerSpeechProvider`                | 文本转语音 / STT        |
| `registerRealtimeTranscriptionProvider` | 流式 STT                |
| `registerRealtimeVoiceProvider`         | 双工实时语音            |
| `registerMediaUnderstandingProvider`    | 图像/音频分析           |
| `registerImageGenerationProvider`       | 图像生成                |
| `registerVideoGenerationProvider`       | 视频生成                |
| `registerWebFetchProvider`              | Web 抓取 / scrape provider |
| `registerWebSearchProvider`             | Web 搜索                |
| `registerHttpRoute`                     | HTTP 端点               |
| `registerCommand` / `registerCli`       | CLI 命令                |
| `registerContextEngine`                 | 上下文引擎              |
| `registerService`                       | 后台服务                |

类型化生命周期 hooks 的 hook 保护行为：

- `before_tool_call`：`{ block: true }` 为终止状态；会跳过较低优先级处理器。
- `before_tool_call`：`{ block: false }` 为 no-op，不会清除更早的 block。
- `before_install`：`{ block: true }` 为终止状态；会跳过较低优先级处理器。
- `before_install`：`{ block: false }` 为 no-op，不会清除更早的 block。
- `message_sending`：`{ cancel: true }` 为终止状态；会跳过较低优先级处理器。
- `message_sending`：`{ cancel: false }` 为 no-op，不会清除更早的 cancel。

有关完整的类型化 hook 行为，请参见 [SDK 概览](/zh-CN/plugins/sdk-overview#hook-decision-semantics)。

## 相关内容

- [构建插件](/zh-CN/plugins/building-plugins) —— 创建你自己的插件
- [插件 Bundles](/zh-CN/plugins/bundles) —— Codex/Claude/Cursor bundle 兼容性
- [插件清单](/zh-CN/plugins/manifest) —— manifest schema
- [注册工具](/zh-CN/plugins/building-plugins#registering-agent-tools) —— 在插件中添加智能体工具
- [插件内部机制](/plugins/architecture) —— 能力模型和加载管线
- [社区插件](/zh-CN/plugins/community) —— 第三方列表
