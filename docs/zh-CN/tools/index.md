---
read_when:
    - 你想了解 OpenClaw 提供哪些工具
    - 你需要配置、允许或拒绝工具
    - 你正在选择使用内置工具、Skills 还是插件
summary: OpenClaw 工具和插件概览：智能体可以做什么，以及如何扩展它
title: 工具和插件
x-i18n:
    generated_at: "2026-05-05T16:53:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 894f6dc7e840f3153e95696a63c470a200886af7d3dc8399e87446cf0fb1b027
    source_path: tools/index.md
    workflow: 16
---

智能体在生成文本之外做的所有事情都通过**工具**完成。
工具让智能体能够读取文件、运行命令、浏览 Web、发送
消息，并与设备交互。

## 工具、Skills 和插件

OpenClaw 有三层协同工作：

<Steps>
  <Step title="工具是智能体调用的内容">
    工具是智能体可以调用的类型化函数（例如 `exec`、`browser`、
    `web_search`、`message`）。OpenClaw 随附一组**内置工具**，
    插件可以注册额外工具。

    智能体会将工具视为发送给模型 API 的结构化函数定义。

  </Step>

  <Step title="Skills 教智能体何时以及如何执行">
    Skill 是注入到系统提示词中的 markdown 文件（`SKILL.md`）。
    Skills 为智能体提供上下文、约束和分步指导，以便有效使用
    工具。Skills 存放在你的工作区、共享文件夹中，
    或随插件一起发布。

    [Skills 参考](/zh-CN/tools/skills) | [创建技能](/zh-CN/tools/creating-skills)

  </Step>

  <Step title="插件将所有内容打包在一起">
    插件是一个可以注册任意能力组合的包：
    渠道、模型提供商、工具、Skills、语音、实时转写、
    实时语音、媒体理解、图像生成、视频生成、
    Web 抓取、Web 搜索，等等。有些插件是**核心**插件（随
    OpenClaw 发布），有些是**外部**插件（由社区发布到 npm）。

    [安装和配置插件](/zh-CN/tools/plugin) | [构建你自己的插件](/zh-CN/plugins/building-plugins)

  </Step>
</Steps>

## 内置工具

这些工具随 OpenClaw 发布，无需安装任何插件即可使用：

| 工具                                       | 作用                                                          | 页面                                                         |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | 运行 shell 命令，管理后台进程                       | [Exec](/zh-CN/tools/exec), [Exec 审批](/zh-CN/tools/exec-approvals) |
| `code_execution`                           | 运行沙箱隔离的远程 Python 分析                                  | [代码执行](/zh-CN/tools/code-execution)                      |
| `browser`                                  | 控制 Chromium 浏览器（导航、点击、截图）              | [浏览器](/zh-CN/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | 搜索 Web、搜索 X 帖子、抓取页面内容                    | [Web](/zh-CN/tools/web), [Web 抓取](/zh-CN/tools/web-fetch)             |
| `read` / `write` / `edit`                  | 工作区中的文件 I/O                                             |                                                              |
| `apply_patch`                              | 多段文件补丁                                               | [应用补丁](/zh-CN/tools/apply-patch)                            |
| `message`                                  | 跨所有渠道发送消息                                     | [智能体发送](/zh-CN/tools/agent-send)                              |
| `canvas`                                   | 驱动节点 Canvas（展示、求值、快照）                           |                                                              |
| `nodes`                                    | 发现并定位已配对设备                                    |                                                              |
| `cron` / `gateway`                         | 管理定时任务；检查、修补、重启或更新 Gateway 网关 |                                                              |
| `image` / `image_generate`                 | 分析或生成图像                                            | [图像生成](/zh-CN/tools/image-generation)                  |
| `music_generate`                           | 生成音乐曲目                                                 | [音乐生成](/zh-CN/tools/music-generation)                  |
| `video_generate`                           | 生成视频                                                       | [视频生成](/zh-CN/tools/video-generation)                  |
| `tts`                                      | 一次性文本转语音转换                                    | [TTS](/zh-CN/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | 会话管理、Status 和子智能体编排               | [子智能体](/zh-CN/tools/subagents)                               |
| `session_status`                           | 轻量级 `/status` 风格回读和会话模型覆盖       | [会话工具](/zh-CN/concepts/session-tool)                      |

处理图像时，使用 `image` 进行分析，使用 `image_generate` 进行生成或编辑。如果你面向 `openai/*`、`google/*`、`fal/*` 或其他非默认图像提供商，请先配置该提供商的身份验证/API key。

处理音乐时，使用 `music_generate`。如果你面向 `google/*`、`minimax/*` 或其他非默认音乐提供商，请先配置该提供商的身份验证/API key。

处理视频时，使用 `video_generate`。如果你面向 `qwen/*` 或其他非默认视频提供商，请先配置该提供商的身份验证/API key。

对于由工作流驱动的音频生成，当 ComfyUI 等插件注册了
`music_generate` 时使用它。这不同于用于文本转语音的 `tts`。

`session_status` 是会话组中的轻量级 Status/回读工具。
它会回答关于当前会话的 `/status` 风格问题，并且可以
可选地设置每会话模型覆盖；`model=default` 会清除该
覆盖。与 `/status` 一样，它可以从最新转录使用记录中
回填稀疏的 token/cache 计数器和活动运行时模型标签。

`gateway` 是用于 Gateway 网关操作的仅所有者运行时工具：

- `config.schema.lookup` 用于在编辑前查看一个限定路径的配置子树
- `config.get` 用于当前配置快照 + 哈希
- `config.patch` 用于带重启的部分配置更新
- `config.apply` 仅用于完整配置替换
- `update.run` 用于显式自更新 + 重启

对于部分更改，优先使用 `config.schema.lookup`，然后使用 `config.patch`。仅当你有意替换整个配置时才使用
`config.apply`。
如需更完整的配置文档，请阅读[配置](/zh-CN/gateway/configuration)和
[配置参考](/zh-CN/gateway/configuration-reference)。
该工具还会拒绝更改 `tools.exec.ask` 或 `tools.exec.security`；
旧版 `tools.bash.*` 别名会规范化到相同的受保护 exec 路径。

### 插件提供的工具

插件可以注册额外工具。一些示例：

- [Diffs](/zh-CN/tools/diffs) — diff 查看器和渲染器
- [LLM 任务](/zh-CN/tools/llm-task) — 用于结构化输出的仅 JSON LLM 步骤
- [Lobster](/zh-CN/tools/lobster) — 带可恢复审批的类型化工作流运行时
- [音乐生成](/zh-CN/tools/music-generation) — 由工作流支持的提供商共享的 `music_generate` 工具
- [OpenProse](/zh-CN/prose) — markdown 优先的工作流编排
- [Tokenjuice](/zh-CN/tools/tokenjuice) — 压缩嘈杂的 `exec` 和 `bash` 工具结果

插件工具仍然使用 `api.registerTool(...)` 编写，并在
插件清单的 `contracts.tools` 列表中声明。OpenClaw 会在发现期间捕获经过验证的
工具描述符，并按插件来源和契约缓存它，因此
后续工具规划可以跳过插件运行时加载。工具执行仍会加载
所属插件并调用实时注册的实现。

## 工具配置

### 允许和拒绝列表

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

当显式允许列表解析不到任何可调用工具时，OpenClaw 会以关闭方式失败。
例如，`tools.allow: ["query_db"]` 只有在已加载插件确实
注册了 `query_db` 时才有效。如果没有任何内置工具、插件或内置 MCP 工具匹配
允许列表，运行会在模型调用前停止，而不是继续作为
可能幻觉出工具结果的纯文本运行。

### 工具配置文件

`tools.profile` 会在应用 `allow`/`deny` 前设置一个基础允许列表。
每智能体覆盖：`agents.list[].tools.profile`。

| 配置文件     | 包含内容                                                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | 所有核心和可选插件工具；用于更广泛命令/控制访问的不受限基线                                                      |
| `coding`    | `group:fs`、`group:runtime`、`group:web`、`group:sessions`、`group:memory`、`cron`、`image`、`image_generate`、`music_generate`、`video_generate` |
| `messaging` | `group:messaging`、`sessions_list`、`sessions_history`、`sessions_send`、`session_status`                                                         |
| `minimal`   | 仅 `session_status`                                                                                                                             |

<Note>
`tools.profile: "messaging"` 对面向渠道的
智能体有意保持较窄范围。它不包含更广泛的命令/控制工具，例如文件系统、运行时、
浏览器、canvas、nodes、cron 和 Gateway 网关控制。使用 `tools.profile: "full"`
作为更广泛命令/控制访问的不受限基线，然后在需要时用
`tools.allow` / `tools.deny` 收窄
访问范围。
</Note>

`coding` 包含轻量 Web 工具（`web_search`、`web_fetch`、`x_search`），
但不包含完整的浏览器控制工具。浏览器自动化可以驱动真实
会话和已登录配置文件，因此请使用
`tools.alsoAllow: ["browser"]` 或每智能体
`agents.list[].tools.alsoAllow: ["browser"]` 显式添加它。

<Note>
在受限配置文件（`messaging`、`minimal`）下配置 `tools.exec` 或 `tools.fs` 不会隐式扩展该配置文件的允许列表。当你希望受限配置文件使用这些已配置部分时，请添加显式 `tools.alsoAllow` 条目（例如 exec 使用 `["exec", "process"]`，fs 使用 `["read", "write", "edit"]`）。如果存在某个配置部分但没有匹配的 `alsoAllow` 授权，OpenClaw 会记录启动警告。
</Note>

`coding` 和 `messaging` 配置文件还允许插件键 `bundle-mcp` 下
已配置的内置 MCP 工具。当你希望
某个配置文件保留其常规内置工具但隐藏所有已配置 MCP 工具时，添加 `tools.deny: ["bundle-mcp"]`。
`minimal` 配置文件不包含内置 MCP 工具。

示例（默认使用最广的工具范围）：

```json5
{
  tools: {
    profile: "full",
  },
}
```

### 工具组

在允许/拒绝列表中使用 `group:*` 简写：

| 组                 | 工具                                                                                                      |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution（`bash` 可作为 `exec` 的别名）                                              |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | browser, canvas                                                                                           |
| `group:automation` | heartbeat_respond, cron, gateway                                                                          |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list, update_plan                                                                                  |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`   | 所有内置 OpenClaw 工具（不包括插件工具）                                                                 |

`sessions_history` 返回一个有界且经过安全过滤的回忆视图。它会从助手文本中剥离
思考标签、`<relevant-memories>` 结构、明文工具调用 XML
载荷（包括 `<tool_call>...</tool_call>`、
`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、
`<function_calls>...</function_calls>` 以及被截断的工具调用块）、
降级后的工具调用结构、泄漏的 ASCII/全角模型控制
token，以及格式错误的 MiniMax 工具调用 XML，然后应用
遮盖/截断以及可能的超大行占位符，而不是作为原始对话记录转储。

### 提供商特定限制

使用 `tools.byProvider` 限制特定提供商的工具，而无需
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
