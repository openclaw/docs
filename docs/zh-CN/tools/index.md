---
doc-schema-version: 1
read_when:
    - 你想了解 OpenClaw 提供哪些工具
    - 你正在内置工具、技能和插件之间进行选择
    - 你需要找到关于工具策略、自动化或智能体协调的正确文档入口点
summary: OpenClaw 工具、技能和插件概览：智能体可调用的功能及其扩展方式
title: 概览
x-i18n:
    generated_at: "2026-07-11T21:01:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 628b47a8756e229a712981b669c96a36689909755dcd244667612f8761e67526
    source_path: tools/index.md
    workflow: 16
---

使用此页面选择合适的能力界面。**工具**是可调用的操作，**Skills** 用于指导智能体如何工作，**插件**则添加运行时能力，例如工具、提供商、渠道、钩子和打包的 Skills。

这是一个概览和路由页面。有关完整的工具策略、默认设置、分组成员关系、提供商限制和配置字段，请参阅[工具和自定义提供商](/zh-CN/gateway/config-tools)。

## 从这里开始

对于大多数智能体，请先从内置工具类别开始，然后仅在智能体应看到更少工具或需要明确的主机访问权限时调整策略。

| 如果你需要…… | 请先使用 | 然后阅读 |
| ------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 让智能体使用现有能力执行操作 | [内置工具](#built-in-tool-categories) | [工具类别](#built-in-tool-categories) |
| 控制智能体可以调用的内容 | [工具策略](#configure-access-and-approvals) | [工具和自定义提供商](/zh-CN/gateway/config-tools) |
| 向智能体传授工作流 | [Skills](#choose-tools-skills-or-plugins) | [Skills](/zh-CN/tools/skills)、[创建技能](/zh-CN/tools/creating-skills)和[技能工作坊](/zh-CN/tools/skill-workshop) |
| 添加新的集成或运行时界面 | [插件](#extend-capabilities) | [插件](/zh-CN/tools/plugin)和[构建插件](/zh-CN/plugins/building-plugins) |
| 稍后或在后台运行工作 | [自动化](/zh-CN/automation) | [自动化概览](/zh-CN/automation) |
| 协调多个智能体或 harness | [子智能体](/zh-CN/tools/subagents) | [ACP 智能体](/zh-CN/tools/acp-agents)和[智能体发送](/zh-CN/tools/agent-send) |
| 搜索大型 OpenClaw 工具目录 | [工具搜索](/zh-CN/tools/tool-search) | [工具搜索](/zh-CN/tools/tool-search) |

## 选择工具、Skills 或插件

<Steps>
  <Step title="当智能体需要执行操作时使用工具">
    工具是智能体可以调用的类型化函数，例如 `exec`、`browser`、
    `web_search`、`message` 或 `image_generate`。当智能体需要读取数据、
    更改文件、发送消息、调用提供商或操作其他系统时，请使用工具。
    可见工具会作为结构化函数定义发送给模型。

    模型只能看到经过当前配置文件、允许/拒绝策略、提供商限制、
    沙箱状态、渠道权限和插件可用性筛选后保留下来的工具。

  </Step>

  <Step title="当智能体需要指令时使用 Skills">
    Skill 是加载到智能体提示词中的 `SKILL.md` 指令包。当智能体已经拥有
    所需工具，但需要可重复的工作流、审查准则、命令序列或操作约束时，
    请使用 Skill。

    Skills 可以位于工作区、共享 Skill 目录、托管的 OpenClaw Skill 根目录
    或插件包中。

    [Skills](/zh-CN/tools/skills) | [技能工作坊](/zh-CN/tools/skill-workshop) | [创建技能](/zh-CN/tools/creating-skills) | [Skills 配置](/zh-CN/tools/skills-config)

  </Step>

  <Step title="当 OpenClaw 需要新能力时使用插件">
    插件可以添加工具、Skills、渠道、模型提供商、语音、实时语音、
    媒体生成、Web 搜索、Web 获取、钩子和其他运行时能力。当能力包含代码、
    凭据、生命周期钩子、清单元数据或可安装的软件包时，请使用插件。
    现有插件可以从 ClawHub、npm、git、本地目录或归档文件安装。

    [安装和配置插件](/zh-CN/tools/plugin) | [构建插件](/zh-CN/plugins/building-plugins) | [插件 SDK](/zh-CN/plugins/sdk-overview)

  </Step>
</Steps>

## 内置工具类别

下表列出了代表性工具，帮助你识别相应界面。它并非完整的策略参考。
有关确切分组、默认设置和允许/拒绝语义，请参阅[工具和自定义提供商](/zh-CN/gateway/config-tools)。

| 类别 | 当智能体需要……时使用 | 代表性工具 | 后续阅读 |
| ----------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 运行时 | 运行命令、管理进程或使用提供商支持的 Python 分析 | `exec`、`process`、`code_execution` | [Exec](/zh-CN/tools/exec)、[代码执行](/zh-CN/tools/code-execution) |
| 文件 | 读取和更改工作区文件 | `read`、`write`、`edit`、`apply_patch` | [应用补丁](/zh-CN/tools/apply-patch) |
| Web | 搜索 Web、搜索 X 帖子或获取可读的页面内容 | `web_search`、`x_search`、`web_fetch` | [Web 工具](/zh-CN/tools/web)、[Web 获取](/zh-CN/tools/web-fetch) |
| 浏览器 | 操作浏览器会话 | `browser` | [浏览器](/zh-CN/tools/browser) |
| 消息和渠道 | 发送回复或执行渠道操作 | `message` | [智能体发送](/zh-CN/tools/agent-send) |
| 会话和智能体 | 检查会话、委派工作、引导另一个运行或报告状态 | `sessions_*`、`subagents`、`agents_list`、`session_status`、`get_goal`、`create_goal`、`update_goal` | [目标](/zh-CN/tools/goal)、[子智能体](/zh-CN/tools/subagents)、[会话工具](/zh-CN/concepts/session-tool) |
| 自动化 | 调度工作或响应后台事件 | `cron`、`heartbeat_respond` | [自动化](/zh-CN/automation) |
| Gateway 网关和节点 | 检查 Gateway 网关状态或已配对的目标设备 | `gateway`、`nodes` | [Gateway 配置](/zh-CN/gateway/configuration)、[节点](/zh-CN/nodes) |
| 媒体 | 分析、生成或朗读媒体 | `image`、`image_generate`、`music_generate`、`video_generate`、`tts` | [媒体概览](/zh-CN/tools/media-overview) |
| 大型 OpenClaw 目录 | 搜索并调用大量符合条件的工具，而无需将每个架构都发送给模型 | `tool_search_code`、`tool_search`、`tool_describe` | [工具搜索](/zh-CN/tools/tool-search) |

<Note>
工具搜索是实验性的 OpenClaw 智能体界面。Codex harness 运行使用
Codex 原生代码模式、原生工具搜索、延迟动态工具和嵌套工具调用，
而不是 `tools.toolSearch`。
</Note>

## 插件提供的工具

插件可以注册其他工具。插件作者通过 `api.registerTool(...)` 和清单中的
`contracts.tools` 接入工具；有关契约详情，请参阅
[插件 SDK](/zh-CN/plugins/sdk-overview)和[插件清单](/zh-CN/plugins/manifest)。

常见的插件提供工具包括：

- [Diffs](/zh-CN/tools/diffs)，用于渲染文件和 Markdown 差异
- [显示小组件](/tools/show-widget)，用于在 Web 聊天中显示自包含的内联 SVG 和 HTML
- [LLM 任务](/zh-CN/tools/llm-task)，用于仅使用 JSON 的工作流步骤
- [Lobster](/zh-CN/tools/lobster)，用于支持可恢复审批的类型化工作流
- [Tokenjuice](/zh-CN/tools/tokenjuice)，用于压缩冗长的 `exec` 和 `bash` 工具输出
- [工具搜索](/zh-CN/tools/tool-search)，用于发现和调用大型工具目录，而无需将每个架构放入提示词
- [Canvas](/zh-CN/plugins/reference/canvas)，用于节点 Canvas 控制和 A2UI 渲染

## 配置访问权限和审批

工具策略在模型调用之前执行。如果策略移除了某个工具，模型在该轮中不会收到
该工具的架构。由于全局配置、按智能体配置、渠道策略、提供商限制、沙箱规则、
渠道/运行时策略或插件可用性，一次运行可能失去某些工具。

- [工具和自定义提供商](/zh-CN/gateway/config-tools)介绍工具配置文件、允许/拒绝列表、
  提供商特定限制、循环检测以及提供商支持的工具设置。
- [Exec 审批](/zh-CN/tools/exec-approvals)介绍主机命令审批策略。
- [提升权限的 Exec](/zh-CN/tools/elevated)介绍沙箱外部的受控执行。
- [沙箱、工具策略和提升权限](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated)
  说明哪个层级控制文件和进程访问。
- [按 Agent 配置的沙箱和工具限制](/zh-CN/tools/multi-agent-sandbox-tools)
  介绍委派运行中针对智能体的特定限制。

## 扩展能力

根据你需要 OpenClaw 完成的工作选择扩展路径：

- 使用[插件](/zh-CN/tools/plugin)安装或管理现有插件。
- 使用[构建插件](/zh-CN/plugins/building-plugins)构建新的集成、提供商、渠道、工具或钩子。
- 使用 [Skills](/zh-CN/tools/skills) 和[创建技能](/zh-CN/tools/creating-skills)添加或调整可复用的智能体指令。
- 当你需要实现契约时，请使用[插件 SDK](/zh-CN/plugins/sdk-overview)和
  [插件清单](/zh-CN/plugins/manifest)。

## 排查工具缺失问题

如果模型无法看到或调用某个工具，请从当前轮次的实际生效策略开始检查：

1. 在[工具和自定义提供商](/zh-CN/gateway/config-tools)中检查当前配置文件、
   `tools.allow` 和 `tools.deny`。
2. 在[工具和自定义提供商](/zh-CN/gateway/config-tools)中检查提供商特定限制，
   并确认所选[模型提供商](/zh-CN/concepts/model-providers)支持该工具的结构。
3. 使用[沙箱、工具策略和提升权限](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated)
   和[提升权限的 Exec](/zh-CN/tools/elevated)检查渠道权限、沙箱状态和提升权限访问。
4. 在[插件](/zh-CN/tools/plugin)中检查拥有该工具的插件是否已安装并启用。
5. 对于委派运行，请在[按 Agent 配置的沙箱和工具限制](/zh-CN/tools/multi-agent-sandbox-tools)
   中检查按智能体设置的限制。
6. 对于大型 OpenClaw 目录，请确认运行使用的是直接工具暴露还是
   [工具搜索](/zh-CN/tools/tool-search)。

## 相关内容

- [自动化](/zh-CN/automation)，涵盖 cron、任务、Heartbeat、跟进承诺、Hooks、
  长期指令和 Task Flow
- [智能体](/zh-CN/concepts/agent)，涵盖智能体模型、会话、记忆和
  多智能体协调
- [工具和自定义提供商](/zh-CN/gateway/config-tools)，作为规范的工具
  策略参考
- [插件](/zh-CN/tools/plugin)，用于插件安装和管理
- [插件 SDK](/zh-CN/plugins/sdk-overview)，作为插件作者参考
- [Skills](/zh-CN/tools/skills)，涵盖技能加载顺序、准入控制和配置
- [技能工作坊](/zh-CN/tools/skill-workshop)，用于创建经生成和审核的技能
- [工具搜索](/zh-CN/tools/tool-search)，用于精简发现 OpenClaw 工具目录
