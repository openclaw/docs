---
read_when:
    - 你希望 OpenClaw 智能体使用大型工具目录，而无需将每个工具 schema 都添加到提示中
    - 你希望 OpenClaw 工具、MCP 工具和客户端工具通过一个紧凑的运行时表面暴露
    - 你正在为 OpenClaw 运行实现或调试工具发现
summary: 工具搜索：将大型 OpenClaw 工具目录压缩到搜索、描述和调用之后
title: 工具搜索
x-i18n:
    generated_at: "2026-07-05T11:46:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fa8a7f8580fe3743bfc6082ad3ab0fef848a326539131b4804e577daa05f4137
    source_path: tools/tool-search.md
    workflow: 16
---

工具搜索是一个实验性的 OpenClaw 智能体运行时功能。它为智能体提供了一种紧凑方式，用于发现和调用大型工具目录。当一次运行有许多可用工具，但模型可能只需要其中少数工具时，它很有用。

本页记录 OpenClaw 工具搜索。它不是 Codex 原生的工具搜索或动态工具表面。Codex 原生代码模式、工具搜索、延迟动态工具和嵌套工具调用都是稳定的 Codex harness 表面，并且不依赖 `tools.toolSearch`。

为 OpenClaw 运行启用后，模型默认会收到一个 `tool_search_code` 工具。该工具会在隔离的 Node 子进程中运行一段简短的 JavaScript 主体，并带有 `openclaw.tools` 桥接：

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

目录可以包含 OpenClaw 工具、插件工具、MCP 工具和客户端提供的工具。模型不会预先看到每个完整 schema。相反，它会搜索紧凑描述符，在需要确切 schema 时描述一个选中的工具，然后通过 OpenClaw 调用该工具。

Codex harness 运行不会收到这些实验性的 OpenClaw 工具搜索控制项。OpenClaw 会将产品能力作为动态工具传给 Codex，而 Codex 拥有稳定的原生代码模式、原生工具搜索、延迟动态工具和嵌套工具调用。

## 轮次如何运行

在规划时，OpenClaw 嵌入式 runner 会为本次运行构建有效目录：

1. 解析智能体、profile、沙箱和会话的活动工具策略。
2. 列出符合条件的 OpenClaw 和插件工具。
3. 通过会话 MCP 运行时列出符合条件的 MCP 工具。
4. 添加为当前运行提供的符合条件的客户端工具。
5. 为紧凑描述符建立搜索索引。
6. 向模型暴露 OpenClaw 代码桥接、结构化后备工具，或紧凑目录表面。

执行时，每个真实工具调用都会返回 OpenClaw。隔离的 Node 运行时不会持有插件实现、MCP 客户端对象或密钥。`openclaw.tools.call(...)` 会跨过桥接回到 Gateway 网关，在那里仍会应用正常的策略、审批、钩子、日志和结果处理。

## 模式

`tools.toolSearch` 有三种面向模型的模式：

- `code`：暴露 `tool_search_code`，即默认的紧凑 JavaScript 桥接。
- `tools`：将 `tool_search`、`tool_describe` 和 `tool_call` 暴露为普通结构化工具，适用于不应接收代码的提供商。
- `directory`：暴露 `tool_search`、`tool_describe` 和 `tool_call`，并额外提供一个有界 prompt 目录，其中包含可用工具名称和描述，适用于应看到工具名称但不应看到每个完整 schema 的提供商。OpenClaw 还可以直接为当前轮次暴露一小组有界的可能需要或必需的工具 schema。

所有模式都使用同一个经过策略过滤的目录和正常的 OpenClaw 执行路径。如果当前运行时无法启动隔离的 Node 代码模式子进程，默认 `code` 模式会在目录压缩前回退到 `tools`。在 `directory` 模式下，客户端提供的工具会在当前运行中保持直接可见，而 OpenClaw 工具、插件工具和 MCP 工具可以被压缩到目录目录之后。对确切隐藏目录名称的直接调用会在执行前从同一授权目录中水合。

所有模式都是实验性的。对于小型 OpenClaw 工具目录，优先使用直接工具暴露；对于 Codex harness 运行，优先使用 Codex 原生稳定表面。

没有单独的来源选择配置。启用工具搜索后，目录会在正常策略过滤后包含符合条件的 OpenClaw、MCP 和客户端工具。

## 为什么存在

大型目录很有用，但成本很高。把每个工具 schema 都发送给模型会让请求更大、拖慢规划，并增加意外选择工具的概率。

工具搜索改变了形态：

- 直接工具：模型在第一个 token 前看到每个选中 schema
- 工具搜索代码模式：模型看到一个紧凑代码工具和一段简短 API 契约
- 工具搜索工具模式：模型看到三个紧凑结构化后备工具
- 工具搜索目录模式：模型看到一个有界目录，加上搜索/描述/调用控制项，以及一小组有界的可能需要或必需的 schema
- 轮次期间：模型可以按需加载其余 schema

对于小型目录，直接工具暴露仍然是正确默认值。当一次运行可以看到许多工具时，尤其是来自 MCP 服务器或客户端提供的应用工具时，工具搜索最合适。

## API

`openclaw.tools.search(query, options?)`

搜索当前运行的有效目录。结果紧凑，并且可以安全放回 prompt 上下文。

```js
const hits = await openclaw.tools.search("calendar event", { limit: 5 });
```

`openclaw.tools.describe(id)`

加载一个搜索结果的完整元数据，包括确切输入 schema。

```js
const calendarCreate = await openclaw.tools.describe("mcp:calendar:create_event");
```

`openclaw.tools.call(id, args)`

通过 OpenClaw 调用选中的工具。

```js
await openclaw.tools.call(calendarCreate.id, {
  summary: "Planning",
  start: "2026-05-09T14:00:00Z",
});
```

结构化后备模式会把相同操作暴露为工具：

- `tool_search`
- `tool_describe`
- `tool_call`

目录模式暴露：

- `tool_search`
- `tool_describe`
- `tool_call`

它还会保持客户端提供的工具直接可见，并且可能会为当前轮次直接暴露一小组有界的可能需要或必需的目录工具 schema。如果有界目录省略了条目，请使用 `tool_search` 查找它们。如果模型直接请求确切的隐藏目录工具名称，OpenClaw 会在正常执行前从授权目录中水合它。
目录模式客户端工具名称不得与 OpenClaw、插件或 MCP 工具名称冲突，因为确切延迟分发会使用这些名称。

## 运行时边界

代码桥接运行在一个短生命周期的 Node 子进程中。子进程启动时会启用 Node 权限模式，环境为空，没有文件系统或网络授权，也没有子进程或 worker 授权。OpenClaw 会强制执行父进程挂钟超时，并在超时后杀死子进程，包括异步 continuation 之后。

运行时只暴露：

- `console.log`、`console.warn` 和 `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

正常的 OpenClaw 行为仍适用于最终调用：

- 工具允许和拒绝策略
- 按智能体和按沙箱的工具限制
- 渠道/运行时工具策略
- 审批钩子
- 插件 `before_tool_call` 钩子
- 会话身份、日志和遥测

## 配置

使用默认代码桥接为 OpenClaw 运行启用工具搜索：

```bash
openclaw config set tools.toolSearch true
```

等价 JSON：

```json5
{
  tools: {
    toolSearch: true,
  },
}
```

为 OpenClaw 运行改用结构化后备工具：

```json5
{
  tools: {
    toolSearch: {
      mode: "tools",
    },
  },
}
```

为 OpenClaw 运行改用紧凑目录表面：

```json5
{
  tools: {
    toolSearch: {
      mode: "directory",
    },
  },
}
```

调优代码模式超时和搜索结果限制（所示值为默认值）：

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

运行时会将 `codeTimeoutMs` 限制在 1000-60000，将 `maxSearchLimit` 限制在 1-50，并将 `searchDefaultLimit` 限制在 1..`maxSearchLimit`。

禁用它：

```json5
{
  tools: {
    toolSearch: false,
  },
}
```

## Prompt 和遥测

工具搜索会记录足够的遥测，用于与直接工具暴露对比：

- 发送到 harness 的序列化工具和 prompt 总字节数
- 目录大小和来源拆分
- 搜索、描述和调用计数
- 通过 OpenClaw 执行的最终工具调用
- 选中的工具 ID 和来源

会话日志应让你能够回答：

- 模型预先看到了多少个工具 schema
- 它执行了多少次搜索和描述操作
- 最终调用了哪个工具
- 结果是否来自 OpenClaw、MCP 或客户端工具

## E2E 验证

QA Lab Gateway 网关场景使用 OpenClaw 运行时证明两条路径：

```bash
pnpm openclaw qa suite --provider-mode mock-openai --scenario tool-search-gateway-e2e
```

它会创建一个带有大型工具目录的临时假插件，启动 mock OpenAI provider，以直接模式启动一次 Gateway 网关，再以启用工具搜索的方式启动一次 Gateway 网关，然后比较提供商请求 payload 和会话日志。

该回归证明：

1. 直接模式可以调用假插件工具。
2. 工具搜索可以调用同一个假插件工具。
3. 直接模式会把假插件工具 schema 直接暴露给提供商。
4. 工具搜索只暴露紧凑桥接。
5. 对于大型假目录，工具搜索请求 payload 更小。
6. 会话日志显示预期的工具调用计数和桥接调用遥测。

## 失败行为

工具搜索应该失败关闭：

- 如果某个工具不在有效策略中，搜索不应返回它
- 如果选中的工具变得不可用，`tool_call` 应失败
- 如果策略或审批阻止执行，调用结果应报告该阻止，而不是绕过它
- 如果代码桥接无法创建隔离运行时，请使用 `mode: "tools"`，或为该部署禁用工具搜索

## 相关

- [工具和插件](/zh-CN/tools)
- [多 Agent 沙盒和工具](/zh-CN/tools/multi-agent-sandbox-tools)
- [Exec 工具](/zh-CN/tools/exec)
- [ACP Agents 设置](/zh-CN/tools/acp-agents-setup)
- [构建插件](/zh-CN/plugins/building-plugins)
