---
summary: OpenClaw 如何运行内置智能体运行时、提供商、会话、工具和扩展。
title: Agent runtime architecture
x-i18n:
    generated_at: "2026-06-27T01:17:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cd0ca61b10a4f7029590da8566b22cc44cf801af162e5f2c00c9561fe46e39e3
    source_path: agent-runtime-architecture.md
    workflow: 16
---

OpenClaw 直接拥有内置智能体运行时。运行时代码位于 `src/agents/` 下，模型/提供商辅助代码位于 `src/llm/` 下，面向插件的契约通过 `openclaw/plugin-sdk/*` barrels 暴露。

## 运行时布局

- `src/agents/embedded-agent-runner/`：内置智能体尝试循环、提供商流适配器、压缩、模型选择和会话接线。
- `src/agents/sessions/`：会话持久化、扩展加载、资源发现、技能、提示、主题，以及基于 TUI 的工具渲染器。
- `packages/agent-core/`：可复用的智能体核心、较低层级的 harness 类型、消息、压缩辅助工具、提示模板，以及工具/会话契约。
- `src/agents/runtime/`：面向 `@openclaw/agent-core` 的 OpenClaw facade，以及本地代理实用工具。
- `src/agents/agent-tools*.ts`：OpenClaw 拥有的工具定义、schema、策略、before/after 钩子适配器，以及主机编辑支持。
- `src/agents/agent-hooks/`：内置运行时钩子，例如压缩保护和上下文修剪。
- `src/llm/`：模型/提供商注册表、传输辅助工具，以及特定提供商的流实现。

## 边界

核心代码通过 OpenClaw 模块和 SDK barrels 调用内置运行时，而不是通过旧的外部智能体包。插件使用已文档化的 `openclaw/plugin-sdk/*` 入口点，并且不导入 `src/**` 内部代码。

`@earendil-works/pi-tui` 仍然是第三方 TUI 依赖。它由本地 TUI 和会话渲染器用作终端组件工具包；将其内部化会是一项单独的 vendoring 工作。

## 清单

资源包在包元数据中声明 OpenClaw 资源：

```json
{
  "openclaw": {
    "extensions": ["extensions/index.ts"],
    "skills": ["skills/*.md"],
    "prompts": ["prompts/*.md"],
    "themes": ["themes/*.json"]
  }
}
```

包管理器还会发现约定的 `extensions/`、`skills/`、`prompts/` 和 `themes/` 目录。

## 运行时选择

默认内置运行时 ID 是 `openclaw`。插件 harness 可以注册额外的运行时 ID。`auto` 会在存在支持的插件 harness 时选择它，否则使用内置 OpenClaw 运行时。

## 相关内容

- [OpenClaw agent runtime workflow](/zh-CN/openclaw-agent-runtime)
- [Agent Runtimes](/zh-CN/concepts/agent-runtimes)
