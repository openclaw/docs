---
read_when:
    - 你想了解 OpenClaw 提供了哪些工具
    - 你需要配置、允许或拒绝工具
    - 你正在权衡内置工具、技能和插件之间的区别
summary: OpenClaw 工具和插件概览：智能体能做什么，以及如何扩展它
title: 工具和插件
x-i18n:
    generated_at: "2026-04-05T10:11:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 17768048b23f980de5e502cc30fbddbadc2e26ae62f0f03c5ab5bbcdeea67e50
    source_path: tools/index.md
    workflow: 15
---

# 工具和插件

智能体除了生成文本之外所做的一切，都是通过**工具**完成的。
工具是智能体读取文件、运行命令、浏览 Web、发送
消息以及与设备交互的方式。

## 工具、技能和插件

OpenClaw 有三层协同工作的能力：

<Steps>
  <Step title="工具是智能体调用的内容">
    工具是智能体可以调用的类型化函数（例如 `exec`、`browser`、
    `web_search`、`message`）。OpenClaw 内置了一组**内置工具**，
    插件也可以注册额外工具。

    在模型 API 看来，工具是发送过去的结构化函数定义。

  </Step>

  <Step title="技能教会智能体何时以及如何使用">
    技能是注入到系统提示词中的 markdown 文件（`SKILL.md`）。
    技能为智能体提供上下文、约束和分步指导，帮助其
    更有效地使用工具。技能可以位于你的工作区、共享文件夹中，
    或随插件一起提供。

    [Skills 参考](/zh-CN/tools/skills) | [创建技能](/zh-CN/tools/creating-skills)

  </Step>

  <Step title="插件将所有内容打包在一起">
    插件是一个可以注册任意能力组合的包：
    渠道、模型提供商、工具、技能、语音、实时转写、
    实时语音、媒体理解、图像生成、视频生成、
    Web 抓取、Web 搜索等等。有些插件是**核心插件**（随
    OpenClaw 一起提供），另一些是**外部插件**（由社区发布到 npm）。

    [安装和配置插件](/zh-CN/tools/plugin) | [构建你自己的插件](/zh-CN/plugins/building-plugins)

  </Step>
</Steps>

## 内置工具

这些工具随 OpenClaw 一起提供，无需安装任何插件即可使用：

| 工具                                       | 功能                                                             | 页面                                    |
| ------------------------------------------ | ---------------------------------------------------------------- | --------------------------------------- |
| `exec` / `process`                         | 运行 shell 命令，管理后台进程                                    | [Exec](/zh-CN/tools/exec)                     |
| `code_execution`                           | 运行沙箱隔离的远程 Python 分析                                   | [Code Execution](/tools/code-execution) |
| `browser`                                  | 控制 Chromium 浏览器（导航、点击、截图）                         | [Browser](/zh-CN/tools/browser)               |
| `web_search` / `x_search` / `web_fetch`    | 搜索 Web、搜索 X 帖子、抓取页面内容                              | [Web](/zh-CN/tools/web)                       |
| `read` / `write` / `edit`                  | 在工作区中进行文件 I/O                                           |                                         |
| `apply_patch`                              | 多段文件补丁                                                     | [Apply Patch](/zh-CN/tools/apply-patch)       |
| `message`                                  | 跨所有渠道发送消息                                               | [Agent Send](/zh-CN/tools/agent-send)         |
| `canvas`                                   | 驱动节点 Canvas（present、eval、snapshot）                       |                                         |
| `nodes`                                    | 发现并定位已配对设备                                             |                                         |
| `cron` / `gateway`                         | 管理定时作业；检查、修补、重启或更新 gateway                     |                                         |
| `image` / `image_generate`                 | 分析或生成图像                                                   |                                         |
| `tts`                                      | 一次性文本转语音转换                                             | [TTS](/tools/tts)                       |
| `sessions_*` / `subagents` / `agents_list` | 会话管理、状态查看和子智能体编排                                 | [Sub-agents](/zh-CN/tools/subagents)          |
| `session_status`                           | 轻量级的 `/status` 风格回读和按会话模型覆盖                      | [Session Tools](/zh-CN/concepts/session-tool) |

对于图像相关工作，使用 `image` 进行分析，使用 `image_generate` 进行生成或编辑。如果你要使用 `openai/*`、`google/*`、`fal/*` 或其他非默认图像提供商，请先配置该提供商的认证/API 密钥。

`session_status` 是 sessions 分组中的轻量级状态/回读工具。
它用于回答关于当前会话的 `/status` 风格问题，并且
可选地设置按会话生效的模型覆盖；`model=default` 会清除该
覆盖。与 `/status` 一样，它可以从最新的转录使用记录中
回填稀疏的 token/缓存计数器以及当前活跃的运行时模型标签。

`gateway` 是仅所有者可用、用于 gateway 操作的运行时工具：

- `config.schema.lookup`：在编辑前查看单一路径范围内的配置子树
- `config.get`：获取当前配置快照 + 哈希
- `config.patch`：带重启的部分配置更新
- `config.apply`：仅用于完整配置替换
- `update.run`：用于显式自更新 + 重启

对于部分更改，优先使用 `config.schema.lookup`，然后使用 `config.patch`。仅当你明确要替换整个配置时才使用
`config.apply`。
该工具还会拒绝修改 `tools.exec.ask` 或 `tools.exec.security`；
旧版 `tools.bash.*` 别名会规范化到相同的受保护 exec 路径。

### 插件提供的工具

插件可以注册额外工具。示例包括：

- [Lobster](/zh-CN/tools/lobster) — 带可恢复审批的类型化工作流运行时
- [LLM Task](/zh-CN/tools/llm-task) — 仅输出 JSON 的 LLM 步骤，用于结构化输出
- [Diffs](/zh-CN/tools/diffs) — Diff 查看器和渲染器
- [OpenProse](/zh-CN/prose) — markdown 优先的工作流编排

## 工具配置

### 允许列表和拒绝列表

通过配置中的 `tools.allow` / `tools.deny` 控制智能体可以调用哪些工具。
拒绝始终优先于允许。

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

### 工具配置档

`tools.profile` 会在应用 `allow`/`deny` 之前设置一个基础允许列表。
每智能体覆盖：`agents.list[].tools.profile`。

| 配置档      | 包含内容                                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------------------------ |
| `full`      | 无限制（等同于未设置）                                                                                       |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                    |
| `minimal`   | 仅 `session_status`                                                                                          |

### 工具组

在允许/拒绝列表中使用 `group:*` 简写：

| 组                 | 工具                                                                                                      |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec、process、code_execution（`bash` 可作为 `exec` 的别名使用）                                         |
| `group:fs`         | read、write、edit、apply_patch                                                                            |
| `group:sessions`   | sessions_list、sessions_history、sessions_send、sessions_spawn、sessions_yield、subagents、session_status |
| `group:memory`     | memory_search、memory_get                                                                                 |
| `group:web`        | web_search、x_search、web_fetch                                                                           |
| `group:ui`         | browser、canvas                                                                                           |
| `group:automation` | cron、gateway                                                                                             |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list                                                                                               |
| `group:media`      | image、image_generate、tts                                                                                |
| `group:openclaw`   | 所有内置 OpenClaw 工具（不包括插件工具）                                                                  |

`sessions_history` 返回的是有界、经过安全过滤的回忆视图。它会去除
thinking 标签、`<relevant-memories>` 脚手架、纯文本工具调用 XML
负载（包括 `<tool_call>...</tool_call>`、
`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、
`<function_calls>...</function_calls>`，以及截断的工具调用块）、
降级后的工具调用脚手架、泄露的 ASCII/全角模型控制
token，以及 assistant 文本中格式错误的 MiniMax 工具调用 XML，然后再应用
打码/截断，并在需要时使用超大行占位符，而不是把它作为
原始转录转储直接返回。

### 提供商特定限制

使用 `tools.byProvider` 为特定提供商限制工具，而无需
更改全局默认值：

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
    },
  },
}
```
