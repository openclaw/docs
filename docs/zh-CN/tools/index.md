---
read_when:
    - 你想了解 OpenClaw 提供了哪些工具
    - 你需要配置、允许或拒绝工具
    - 你正在内置工具、Skills 和插件之间做选择
summary: OpenClaw 工具和插件概览：智能体能做什么，以及如何扩展它
title: 工具和插件
x-i18n:
    generated_at: "2026-04-22T07:16:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6edb9e13b72e6345554f25c8d8413d167a69501e6626828d9aa3aac6907cd092
    source_path: tools/index.md
    workflow: 15
---

# 工具和插件

智能体除了生成文本之外所做的一切，都通过**工具**完成。
工具是智能体读取文件、运行命令、浏览网页、发送消息以及与设备交互的方式。

## 工具、Skills 和插件

OpenClaw 有三个协同工作的层级：

<Steps>
  <Step title="工具是智能体调用的内容">
    工具是智能体可以调用的类型化函数（例如 `exec`、`browser`、
    `web_search`、`message`）。OpenClaw 内置了一组**内置工具**，
    插件也可以注册额外的工具。

    对智能体来说，工具是发送到模型 API 的结构化函数定义。

  </Step>

  <Step title="Skills 教会智能体何时以及如何使用">
    Skill 是一个注入到系统提示词中的 Markdown 文件（`SKILL.md`）。
    Skills 为智能体提供上下文、约束，以及有效使用工具的分步指导。
    Skills 可以位于你的工作区、共享文件夹中，或随插件一起提供。

    [Skills 参考](/zh-CN/tools/skills) | [创建 Skills](/zh-CN/tools/creating-skills)

  </Step>

  <Step title="插件将一切打包在一起">
    插件是一个可以注册任意能力组合的包：渠道、模型提供商、工具、
    Skills、语音、实时转录、实时语音、媒体理解、图像生成、
    视频生成、网页抓取、Web 搜索等。部分插件属于**核心**插件
    （随 OpenClaw 一起提供），其他则是**外部**插件
    （由社区发布到 npm）。

    [安装和配置插件](/zh-CN/tools/plugin) | [构建你自己的插件](/zh-CN/plugins/building-plugins)

  </Step>
</Steps>

## 内置工具

这些工具随 OpenClaw 一起提供，无需安装任何插件即可使用：

| 工具                                       | 作用                                                                  | 页面                                        |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------- |
| `exec` / `process`                         | 运行 shell 命令，管理后台进程                                         | [Exec](/zh-CN/tools/exec)                         |
| `code_execution`                           | 运行沙箱隔离的远程 Python 分析                                        | [代码执行](/zh-CN/tools/code-execution)           |
| `browser`                                  | 控制 Chromium 浏览器（导航、点击、截图）                              | [Browser](/zh-CN/tools/browser)                   |
| `web_search` / `x_search` / `web_fetch`    | 搜索 Web、搜索 X 帖子、抓取页面内容                                   | [Web](/zh-CN/tools/web)                           |
| `read` / `write` / `edit`                  | 在工作区中进行文件 I/O                                                |                                             |
| `apply_patch`                              | 多区块文件补丁                                                        | [Apply Patch](/zh-CN/tools/apply-patch)           |
| `message`                                  | 跨所有渠道发送消息                                                    | [智能体发送](/zh-CN/tools/agent-send)             |
| `canvas`                                   | 驱动节点 Canvas（present、eval、snapshot）                            |                                             |
| `nodes`                                    | 发现并定位已配对设备                                                  |                                             |
| `cron` / `gateway`                         | 管理定时任务；检查、修补、重启或更新 Gateway 网关                     |                                             |
| `image` / `image_generate`                 | 分析或生成图像                                                        | [图像生成](/zh-CN/tools/image-generation)         |
| `music_generate`                           | 生成音乐轨道                                                          | [音乐生成](/zh-CN/tools/music-generation)         |
| `video_generate`                           | 生成视频                                                              | [视频生成](/zh-CN/tools/video-generation)         |
| `tts`                                      | 一次性文本转语音转换                                                  | [TTS](/zh-CN/tools/tts)                           |
| `sessions_*` / `subagents` / `agents_list` | 会话管理、状态查看以及子智能体编排                                    | [子智能体](/zh-CN/tools/subagents)                |
| `session_status`                           | 轻量级的 `/status` 风格回读和会话模型覆盖                             | [会话工具](/zh-CN/concepts/session-tool)          |

对于图像相关工作，使用 `image` 进行分析，使用 `image_generate` 进行生成或编辑。如果你要使用 `openai/*`、`google/*`、`fal/*` 或其他非默认图像提供商，请先配置该提供商的凭证 / API 密钥。

对于音乐相关工作，使用 `music_generate`。如果你要使用 `google/*`、`minimax/*` 或其他非默认音乐提供商，请先配置该提供商的凭证 / API 密钥。

对于视频相关工作，使用 `video_generate`。如果你要使用 `qwen/*` 或其他非默认视频提供商，请先配置该提供商的凭证 / API 密钥。

对于工作流驱动的音频生成，当某个插件（例如 ComfyUI）注册了 `music_generate` 时，请使用它。它与 `tts` 不同；后者用于文本转语音。

`session_status` 是 sessions 组中的轻量级状态 / 回读工具。
它用于回答关于当前会话的 `/status` 风格问题，并且可以选择设置按会话生效的模型覆盖；`model=default` 会清除该覆盖。与 `/status` 一样，它可以从最新的转录使用记录中回填稀疏的 token / cache 计数器以及当前运行时模型标签。

`gateway` 是仅所有者可用的 Gateway 网关运行时工具，用于执行 Gateway 网关操作：

- `config.schema.lookup`：在编辑前查看某个限定路径的配置子树
- `config.get`：获取当前配置快照和哈希值
- `config.patch`：执行部分配置更新并重启
- `config.apply`：仅用于完整替换整个配置
- `update.run`：显式执行自更新并重启

对于部分更改，优先使用 `config.schema.lookup`，然后使用 `config.patch`。
只有在你明确要替换整个配置时，才使用 `config.apply`。
该工具还会拒绝更改 `tools.exec.ask` 或 `tools.exec.security`；
旧版 `tools.bash.*` 别名会规范化到相同的受保护 exec 路径。

### 插件提供的工具

插件可以注册额外的工具。示例包括：

- [Diffs](/zh-CN/tools/diffs) — 差异查看器和渲染器
- [LLM Task](/zh-CN/tools/llm-task) — 仅输出 JSON 的 LLM 步骤，用于结构化输出
- [Lobster](/zh-CN/tools/lobster) — 带可恢复审批的类型化工作流运行时
- [Music Generation](/zh-CN/tools/music-generation) — 共享的 `music_generate` 工具，支持基于工作流的提供商
- [OpenProse](/zh-CN/prose) — 以 Markdown 为核心的工作流编排
- [Tokenjuice](/zh-CN/tools/tokenjuice) — 紧凑展示噪声较多的 `exec` 和 `bash` 工具结果

## 工具配置

### 允许列表与拒绝列表

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

### 工具配置档案

`tools.profile` 会在应用 `allow` / `deny` 之前先设置一个基础允许列表。
按智能体覆盖：`agents.list[].tools.profile`。

| 配置档案    | 包含内容                                                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `full`      | 不限制（等同于未设置）                                                                                                                           |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                        |
| `minimal`   | 仅 `session_status`                                                                                                                              |

### 工具分组

在允许 / 拒绝列表中使用 `group:*` 简写：

| 分组               | 工具                                                                                                      |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec、process、code_execution（`bash` 可作为 `exec` 的别名使用）                                          |
| `group:fs`         | read、write、edit、apply_patch                                                                            |
| `group:sessions`   | sessions_list、sessions_history、sessions_send、sessions_spawn、sessions_yield、subagents、session_status |
| `group:memory`     | memory_search、memory_get                                                                                 |
| `group:web`        | web_search、x_search、web_fetch                                                                           |
| `group:ui`         | browser、canvas                                                                                           |
| `group:automation` | cron、gateway                                                                                             |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list                                                                                               |
| `group:media`      | image、image_generate、music_generate、video_generate、tts                                                |
| `group:openclaw`   | 所有 OpenClaw 内置工具（不包括插件工具）                                                                  |

`sessions_history` 返回的是有边界、经过安全过滤的回溯视图。它会从助手文本中移除思维标签、`<relevant-memories>` 脚手架、纯文本工具调用 XML 载荷（包括 `<tool_call>...</tool_call>`、
`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、
`<function_calls>...</function_calls>`，以及被截断的工具调用区块）、
降级后的工具调用脚手架、泄露的 ASCII / 全角模型控制 token，以及格式错误的 MiniMax 工具调用 XML，然后再应用脱敏 / 截断，并在行过大时使用可能的占位符，而不是把它当作原始转录转储直接返回。

### 提供商特定限制

使用 `tools.byProvider` 可以为特定提供商限制工具，而无需更改全局默认值：

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
