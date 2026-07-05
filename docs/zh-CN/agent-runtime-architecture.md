---
summary: OpenClaw 如何组织内置智能体运行时：代码布局、边界、资源清单和运行时选择。
title: Agent runtime architecture
x-i18n:
    generated_at: "2026-07-05T11:00:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3dfae2f4770af5c14daa86ab39595598772af833dee4b03090d27b95eb17efdd
    source_path: agent-runtime-architecture.md
    workflow: 16
---

OpenClaw 拥有内置智能体运行时。运行时代码位于 `src/agents/` 下，模型/提供商传输位于 `src/llm/` 下，面向插件的契约通过 `openclaw/plugin-sdk/*` barrel 暴露。

## 运行时布局

| 路径                                | 负责内容                                                                                                                                                                                                                      |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/agents/embedded-agent-runner/` | 内置尝试循环（`run.ts`、`run/`）、模型选择和提供商规范化（`model*.ts`）、每个提供商的请求参数（`extra-params.*`）、压缩、转录和会话接线。                            |
| `src/agents/sessions/`              | 会话持久化（`session-manager.ts`）、资源发现（`package-manager.ts`、`resource-loader.ts`）、会话内 `extensions` 加载、提示模板、Skills、主题，以及基于 TUI 的工具渲染器（`tools/`）。 |
| `packages/agent-core/`              | 可复用的智能体核心（`@openclaw/agent-core`）：Agent loop、harness 类型、消息、压缩辅助工具、提示模板、Skills 和会话存储契约。                                                           |
| `src/agents/runtime/`               | OpenClaw facade，将 `@openclaw/agent-core` 接入插件 SDK LLM 运行时，并重新导出它及 local proxy 工具。                                                                                             |
| `src/agents/agent-tools*.ts`        | OpenClaw 拥有的工具定义、参数 schema、工具策略、工具调用前/后的适配器，以及主机/沙箱编辑工具。                                                                                            |
| `src/agents/agent-hooks/`           | 内置运行时钩子：压缩保护、压缩指令、上下文裁剪。                                                                                                                                   |
| `src/agents/harness/`               | 内置和插件注册 harness 的 harness 注册表、选择策略和生命周期。                                                                                                                       |
| `src/llm/`                          | 模型/提供商注册表、传输辅助工具，以及特定于提供商的流实现（`src/llm/providers/`）。                                                                                                          |

## 边界

核心通过 OpenClaw 模块和 SDK barrel 调用内置运行时；不再保留外部智能体框架包。插件使用已文档化的 `openclaw/plugin-sdk/*` 入口点，不导入 `src/**` 内部实现。

`@earendil-works/pi-tui` 仍然是第三方依赖：它是本地 TUI 和会话工具渲染器使用的终端组件工具包。将其内部化会是单独的 vendoring 工作。

## 清单

资源包在 `package.json` 元数据中声明 OpenClaw 资源。条目是相对于包根目录的文件路径或 glob：

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

清单中未列出的资源类型会回退到发现常规的 `extensions/`、`skills/`、`prompts/` 和 `themes/` 目录。

## 运行时选择

- 内置运行时 ID 是 `openclaw`。旧版别名 `pi` 会规范化为 `openclaw`；`codex-app-server` 会规范化为 `codex`。
- 插件 harness 会注册其他运行时 ID（例如 `codex`）。
- 运行时策略是按模型/提供商配置作用域的 `agentRuntime.id` 配置（模型条目优先于提供商条目）。未设置或 `default` 会解析为 `auto`。
- `auto` 会选择支持该提供商/模型的已注册插件 harness，否则使用内置 OpenClaw 运行时。
- 官方 API 端点上的 `openai` 提供商默认使用 `codex` harness；自定义 `baseUrl` 值会保留其已配置的行为。

## 相关内容

- [OpenClaw agent runtime workflow](/zh-CN/openclaw-agent-runtime)
- [Agent Runtimes](/zh-CN/concepts/agent-runtimes)
