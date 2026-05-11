---
read_when:
    - 你希望 Pi 智能体使用大型工具目录，而无需将每个工具模式定义添加到提示词中。
    - 你希望 OpenClaw 工具、MCP 工具和客户端工具通过一个紧凑的 PI 接口暴露出来
    - 你正在为 Pi 运行实现或调试工具发现
summary: 工具搜索：将大型 PI 工具目录压缩到 search、describe 和 call 背后
title: 工具搜索
x-i18n:
    generated_at: "2026-05-11T20:36:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 410f21a4d56af163d03023f7280469e55e17e8296ee16f7b12cc2589494d0a0c
    source_path: tools/tool-search.md
    workflow: 16
---

工具搜索是实验性的 OpenClaw PI 智能体功能。它为 PI 智能体提供了一种紧凑的方式，用来发现并调用大型工具目录。当运行中有许多可用工具，但模型可能只需要其中少数工具时，它很有用。

本页记录 OpenClaw PI 工具搜索。它不是 Codex 原生工具搜索或动态工具接口。Codex 原生代码模式、工具搜索、延迟动态工具和嵌套工具调用都是稳定的 Codex harness 接口，不依赖 `tools.toolSearch`。

为 PI 启用后，模型默认会收到一个 `tool_search_code` 工具。该工具会在隔离的 Node 子进程中运行一段简短的 JavaScript 主体，并带有 `openclaw.tools` 桥接：

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

目录可以包含 OpenClaw 工具、插件工具、MCP 工具和客户端提供的工具。模型不会预先看到每个完整 schema。相反，它会搜索紧凑描述符，在需要精确 schema 时描述一个选定工具，然后通过 OpenClaw 调用该工具。

Codex harness 运行不会收到这些实验性 OpenClaw 工具搜索控制。OpenClaw 会将产品能力作为动态工具传递给 Codex，而 Codex 拥有稳定的原生代码模式、原生工具搜索、延迟动态工具和嵌套工具调用。

## 一个轮次如何运行

在规划时，PI 嵌入式运行器会为本次运行构建有效目录：

1. 解析适用于智能体、配置文件、沙箱和会话的活动工具策略。
2. 列出符合条件的 OpenClaw 和插件工具。
3. 通过会话 MCP 运行时列出符合条件的 MCP 工具。
4. 添加为当前运行提供的符合条件的客户端工具。
5. 为搜索索引紧凑描述符。
6. 将 PI 代码桥接或结构化回退工具暴露给模型。

在执行时，每一次真实工具调用都会返回到 OpenClaw。隔离的 Node 运行时不持有插件实现、MCP 客户端对象或密钥。`openclaw.tools.call(...)` 会跨桥接回到 Gateway 网关，在那里仍然应用常规策略、审批、钩子、日志记录和结果处理。

## 模式

`tools.toolSearch` 有两种面向模型的模式：

- `code`：暴露 `tool_search_code`，即默认的紧凑 JavaScript 桥接。
- `tools`：将 `tool_search`、`tool_describe` 和 `tool_call` 作为普通结构化工具暴露，用于不应接收代码的提供商。

两种模式使用相同的目录和执行路径。唯一差别是模型看到的形态。如果当前运行时无法启动隔离的 Node 代码模式子进程，默认的 `code` 模式会在目录压缩前回退到 `tools`。

两种模式都是实验性的。对于小型 PI 工具目录，优先使用直接工具暴露；对于 Codex harness 运行，优先使用 Codex 原生稳定接口。

没有单独的来源选择配置。启用工具搜索后，目录会在常规策略过滤后包含符合条件的 OpenClaw、MCP 和客户端工具。

## 为什么存在

大型目录很有用，但成本很高。向模型发送每个工具 schema 会让请求变大、减慢规划，并增加意外选择工具的概率。

工具搜索会改变形态：

- 直接工具：模型在第一个 token 之前看到每个选定的 schema
- 工具搜索代码模式：模型看到一个紧凑代码工具和一份简短 API 契约
- 工具搜索工具模式：模型看到三个紧凑的结构化回退工具
- 在轮次期间：模型只加载它实际需要的工具 schema

对于小型目录，直接工具暴露仍然是正确默认值。当一次运行可以看到许多工具，尤其是来自 MCP 服务器或客户端提供的应用工具时，工具搜索最适合。

## API

`openclaw.tools.search(query, options?)`

搜索当前运行的有效目录。结果是紧凑且安全的，可以放回提示上下文。

```js
const hits = await openclaw.tools.search("calendar event", { limit: 5 });
```

`openclaw.tools.describe(id)`

加载一个搜索结果的完整元数据，包括精确输入 schema。

```js
const calendarCreate = await openclaw.tools.describe("mcp:calendar:create_event");
```

`openclaw.tools.call(id, args)`

通过 OpenClaw 调用选定工具。

```js
await openclaw.tools.call(calendarCreate.id, {
  summary: "Planning",
  start: "2026-05-09T14:00:00Z",
});
```

结构化回退模式会将相同操作暴露为工具：

- `tool_search`
- `tool_describe`
- `tool_call`

## 运行时边界

代码桥接在短生命周期的 Node 子进程中运行。子进程启动时启用 Node 权限模式，使用空环境，没有文件系统或网络授权，也没有子进程或 worker 授权。OpenClaw 会强制执行父进程挂钟超时，并在超时时终止子进程，包括异步延续之后的超时。

运行时只暴露：

- `console.log`、`console.warn` 和 `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

最终调用仍然适用常规 OpenClaw 行为：

- 工具允许和拒绝策略
- 按智能体和按沙箱的工具限制
- 仅所有者门控
- 审批钩子
- 插件 `before_tool_call` 钩子
- 会话身份、日志和遥测

## 配置

使用默认代码桥接为 PI 运行启用工具搜索：

```bash
openclaw config set tools.toolSearch true
```

等效 JSON：

```json5
{
  tools: {
    toolSearch: true,
  },
}
```

改为对 PI 运行使用结构化回退工具：

```json5
{
  tools: {
    toolSearch: {
      mode: "tools",
    },
  },
}
```

调整代码模式超时和搜索结果限制：

```json5
{
  tools: {
    toolSearch: {
      mode: "code",
      codeTimeoutMs: 10000,
      searchDefaultLimit: 8,
      maxSearchLimit: 20,
    },
  },
}
```

禁用它：

```json5
{
  tools: {
    toolSearch: false,
  },
}
```

## 提示和遥测

工具搜索会记录足够的遥测，以便与直接工具暴露进行比较：

- 发送到 harness 的序列化工具和提示总字节数
- 目录大小和来源细分
- 搜索、描述和调用次数
- 通过 OpenClaw 执行的最终工具调用
- 选定工具 ID 和来源

会话日志应能够回答：

- 模型预先看到了多少个工具 schema
- 它执行了多少次搜索和描述操作
- 调用了哪个最终工具
- 结果来自 OpenClaw、MCP 还是客户端工具

## E2E 验证

Gateway 网关 E2E 运行器使用 PI harness 证明两条路径：

```bash
node --import tsx scripts/tool-search-gateway-e2e.ts
```

它会创建一个带大型工具目录的临时假插件，启动模拟 OpenAI provider，以直接模式和启用工具搜索的模式各启动一次 Gateway 网关，然后比较提供商请求载荷和会话日志。

回归证明：

1. 直接模式可以调用假插件工具。
2. 工具搜索可以调用同一个假插件工具。
3. 直接模式会将假插件工具 schema 直接暴露给提供商。
4. 工具搜索只暴露紧凑桥接。
5. 对于大型假目录，工具搜索请求载荷更小。
6. 会话日志显示预期的工具调用次数和桥接调用遥测。

## 失败行为

工具搜索应以关闭方式失败：

- 如果工具不在有效策略中，搜索不应返回它
- 如果选定工具变为不可用，`tool_call` 应失败
- 如果策略或审批阻止执行，调用结果应报告该阻止，而不是绕过它
- 如果代码桥接无法创建隔离运行时，请使用 `mode: "tools"` 或为该部署禁用工具搜索

## 相关

- [工具和插件](/zh-CN/tools)
- [多 Agent 沙盒和工具](/zh-CN/tools/multi-agent-sandbox-tools)
- [Exec 工具](/zh-CN/tools/exec)
- [ACP Agents 设置](/zh-CN/tools/acp-agents-setup)
- [构建插件](/zh-CN/plugins/building-plugins)
