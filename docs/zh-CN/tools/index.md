---
doc-schema-version: 1
read_when:
    - 你想了解 OpenClaw 提供哪些工具
    - 你正在内置工具、Skills 和插件之间做选择
    - 你需要用于工具策略、自动化或智能体协调的正确文档入口点
summary: OpenClaw 工具、技能和插件概览：智能体可以调用什么以及如何扩展它们
title: 概览
x-i18n:
    generated_at: "2026-05-12T00:59:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 94424b04a520009d40d851e46f7ea0e4e914ff39b7d79958194bb123a6ec0b7b
    source_path: tools/index.md
    workflow: 16
---

使用此页面来选择合适的能力表面。**工具**是可调用的操作，**Skills** 教会智能体如何工作，**插件**会添加运行时能力，例如工具、提供商、渠道、钩子和打包的 Skills。

这是概览和路由页面。有关完整的工具策略、默认值、组成员关系、提供商限制和配置字段，请使用 [工具和自定义提供商](/zh-CN/gateway/config-tools)。

## 从这里开始

对于大多数智能体，请先从内置工具类别开始，然后仅在智能体应看到更少工具或需要显式主机访问权限时调整策略。

| 如果你需要...                           | 首先使用                                 | 然后阅读                                                               |
| ------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------- |
| 让智能体使用现有能力执行操作 | [内置工具](#built-in-tool-categories)    | [工具类别](#built-in-tool-categories)                            |
| 控制智能体可以调用的内容              | [工具策略](#configure-access-and-approvals) | [工具和自定义提供商](/zh-CN/gateway/config-tools)                     |
| 教智能体一个工作流                   | [Skills](#choose-tools-skills-or-plugins)      | [Skills](/zh-CN/tools/skills) 和 [创建技能](/zh-CN/tools/creating-skills)   |
| 添加新的集成或运行时表面    | [插件](#extend-capabilities)                | [插件](/zh-CN/tools/plugin) 和 [构建插件](/zh-CN/plugins/building-plugins) |
| 稍后或在后台运行工作         | [自动化](/zh-CN/automation)                      | [自动化概览](/zh-CN/automation)                                      |
| 协调多个智能体或 harness     | [子智能体](/zh-CN/tools/subagents)                 | [ACP 智能体](/zh-CN/tools/acp-agents) 和 [Agent send](/zh-CN/tools/agent-send)     |
| 搜索大型 PI 工具目录              | [工具搜索](/zh-CN/tools/tool-search)              | [工具搜索](/zh-CN/tools/tool-search)                                       |

## 选择工具、Skills 或插件

<Steps>
  <Step title="当智能体需要执行操作时使用工具">
    工具是智能体可以调用的类型化函数，例如 `exec`、`browser`、
    `web_search`、`message` 或 `image_generate`。当智能体需要读取数据、更改文件、发送消息、调用提供商或操作另一个系统时，请使用工具。可见工具会作为结构化函数定义发送给模型。

    模型只会看到经过活动配置文件、允许/拒绝策略、提供商限制、沙箱状态、渠道权限和插件可用性筛选后仍保留的工具。

  </Step>

  <Step title="当智能体需要指令时使用 Skills">
    Skill 是加载到智能体提示词中的 `SKILL.md` 指令包。当智能体已经拥有所需工具，但需要可重复的工作流、评审准则、命令序列或操作约束时，请使用 Skill。

    Skills 可以存在于工作区、共享 Skill 目录、托管的 OpenClaw Skill 根目录或插件包中。

    [Skills](/zh-CN/tools/skills) | [创建技能](/zh-CN/tools/creating-skills) | [Skills 配置](/zh-CN/tools/skills-config)

  </Step>

  <Step title="当 OpenClaw 需要新能力时使用插件">
    插件可以添加工具、Skills、渠道、模型提供商、语音、实时语音、媒体生成、Web 搜索、Web 抓取、钩子和其他运行时能力。当能力包含代码、凭证、生命周期钩子、清单元数据或可安装打包时，请使用插件。现有插件可以从 ClawHub、npm、git、本地目录或归档安装。

    [安装和配置插件](/zh-CN/tools/plugin) | [构建插件](/zh-CN/plugins/building-plugins) | [插件 SDK](/zh-CN/plugins/sdk-overview)

  </Step>
</Steps>

## 内置工具类别

该表列出了代表性工具，帮助你识别表面。它不是完整的策略参考。有关精确的组、默认值和允许/拒绝语义，请使用 [工具和自定义提供商](/zh-CN/gateway/config-tools)。

| 类别               | 当智能体需要...                                                | 代表性工具                                                 | 接下来阅读                                                              |
| ---------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 运行时                | 运行命令、管理进程，或使用提供商支持的 Python 分析        | `exec`、`process`、`code_execution`                                  | [Exec](/zh-CN/tools/exec)、[代码执行](/zh-CN/tools/code-execution)           |
| 文件                  | 读取和更改工作区文件                                               | `read`、`write`、`edit`、`apply_patch`                               | [Apply patch](/zh-CN/tools/apply-patch)                                      |
| Web                    | 搜索 Web、搜索 X 帖子，或获取可读页面内容                | `web_search`、`x_search`、`web_fetch`                                | [Web 工具](/zh-CN/tools/web)、[Web fetch](/zh-CN/tools/web-fetch)                 |
| 浏览器                | 操作浏览器会话                                                     | `browser`                                                            | [浏览器](/zh-CN/tools/browser)                                              |
| 消息和渠道 | 发送回复或渠道操作                                               | `message`                                                            | [Agent send](/zh-CN/tools/agent-send)                                        |
| 会话和智能体    | 检查会话、委派工作、Steer 另一次运行，或报告 Status          | `sessions_*`、`subagents`、`agents_list`、`session_status`           | [子智能体](/zh-CN/tools/subagents)、[会话工具](/zh-CN/concepts/session-tool) |
| 自动化             | 计划工作或响应后台事件                                 | `cron`、`heartbeat_respond`                                          | [自动化](/zh-CN/automation)                                              |
| Gateway 网关和节点      | 检查 Gateway 网关状态或已配对的目标设备                                | `gateway`、`nodes`                                                   | [Gateway 网关配置](/zh-CN/gateway/configuration)、[节点](/zh-CN/nodes)       |
| 媒体                  | 分析、生成或朗读媒体                                             | `image`、`image_generate`、`music_generate`、`video_generate`、`tts` | [媒体概览](/zh-CN/tools/media-overview)                                |
| 大型 PI 目录      | 搜索并调用许多符合条件的工具，而无需将每个 schema 发送给模型 | `tool_search_code`、`tool_search`、`tool_describe`                   | [工具搜索](/zh-CN/tools/tool-search)                                      |

<Note>
工具搜索是实验性的 PI 智能体表面。Codex harness 运行使用 Codex 原生代码模式、原生工具搜索、延迟动态工具和嵌套工具调用，而不是 `tools.toolSearch`。
</Note>

## 插件提供的工具

插件可以注册其他工具。插件作者通过 `api.registerTool(...)` 和清单的 `contracts.tools` 接入工具；请使用 [插件 SDK](/zh-CN/plugins/sdk-overview) 和 [插件清单](/zh-CN/plugins/manifest) 查看合约详情。

常见的插件提供工具包括：

- [Diffs](/zh-CN/tools/diffs)，用于渲染文件和 markdown diff
- [LLM Task](/zh-CN/tools/llm-task)，用于仅 JSON 的工作流步骤
- [Lobster](/zh-CN/tools/lobster)，用于带可恢复审批的类型化工作流
- [Tokenjuice](/zh-CN/tools/tokenjuice)，用于压缩嘈杂的 `exec` 和 `bash` 工具输出
- [工具搜索](/zh-CN/tools/tool-search)，用于发现并调用大型工具目录，而不必把每个 schema 放进提示词
- [Canvas](/zh-CN/plugins/reference/canvas)，用于节点 Canvas 控制和 A2UI 渲染

## 配置访问权限和审批

工具策略在模型调用之前执行。如果策略移除了某个工具，模型在该轮次中不会收到该工具的 schema。一次运行可能会因为全局配置、按智能体配置、渠道策略、提供商限制、沙箱规则、仅所有者门控或插件可用性而失去工具。

- [工具和自定义提供商](/zh-CN/gateway/config-tools) 记录了工具配置文件、允许/拒绝列表、提供商特定限制、循环检测和提供商支持的工具设置。
- [Exec 审批](/zh-CN/tools/exec-approvals) 记录了主机命令审批策略。
- [提升权限的 Exec](/zh-CN/tools/elevated) 记录了沙箱外的受控执行。
- [沙箱、工具策略和提升权限](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated) 解释了哪个层控制文件和进程访问。
- [按 Agent 配置的沙箱和工具限制](/zh-CN/tools/multi-agent-sandbox-tools) 记录了委派运行的智能体特定限制。

## 扩展能力

根据你需要 OpenClaw 完成的工作选择扩展路径：

- 使用 [插件](/zh-CN/tools/plugin) 安装或管理现有插件。
- 使用 [构建插件](/zh-CN/plugins/building-plugins) 构建新的集成、提供商、渠道、工具或钩子。
- 使用 [Skills](/zh-CN/tools/skills) 和 [创建技能](/zh-CN/tools/creating-skills) 添加或调整可复用的智能体指令。
- 当工作流属于插件分发的 Skill 包时，使用 [Skill workshop](/zh-CN/plugins/skill-workshop) 打包可复用的工作流材料。
- 当你需要实现合约时，使用 [插件 SDK](/zh-CN/plugins/sdk-overview) 和 [插件清单](/zh-CN/plugins/manifest)。

## 排查缺失工具

如果模型无法看到或调用某个工具，请从当前轮次的有效策略开始：

1. 在 [工具和自定义提供商](/zh-CN/gateway/config-tools) 中检查活动配置文件、`tools.allow` 和 `tools.deny`。
2. 在 [工具和自定义提供商](/zh-CN/gateway/config-tools) 中检查提供商特定限制，并确认所选 [模型提供商](/zh-CN/concepts/model-providers) 支持该工具形态。
3. 使用 [沙箱、工具策略和提升权限](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated) 和 [提升权限的 Exec](/zh-CN/tools/elevated) 检查渠道权限、沙箱状态和提升权限访问。
4. 在 [插件](/zh-CN/tools/plugin) 中检查所属插件是否已安装并启用。
5. 对于委派运行，请在 [按 Agent 配置的沙箱和工具限制](/zh-CN/tools/multi-agent-sandbox-tools) 中检查按智能体配置的限制。
6. 对于大型 PI 目录，请确认该运行使用的是直接工具暴露还是 [工具搜索](/zh-CN/tools/tool-search)。

## 相关

- [自动化](/zh-CN/automation)，用于 cron、任务、Heartbeat、跟进承诺、钩子、常驻指令和 Task Flow
- [智能体](/zh-CN/concepts/agent)，用于智能体模型、会话、记忆和多智能体协调
- [工具和自定义提供商](/zh-CN/gateway/config-tools)，作为规范工具策略参考
- [插件](/zh-CN/tools/plugin)，用于插件安装和管理
- [插件 SDK](/zh-CN/plugins/sdk-overview)，作为插件作者参考
- [Skills](/zh-CN/tools/skills)，用于 Skill 加载顺序、门控和配置
- [工具搜索](/zh-CN/tools/tool-search)，用于紧凑的 PI 工具目录发现
