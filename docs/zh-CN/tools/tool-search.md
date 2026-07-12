---
read_when:
    - 你希望 OpenClaw 智能体使用大型工具目录，而无需将每个工具架构都添加到提示词中
    - 你希望通过一个紧凑的运行时界面统一提供 OpenClaw 工具、MCP 工具和客户端工具
    - 你正在为 OpenClaw 运行实现或调试工具发现功能
summary: 工具搜索：通过搜索、描述和调用来精简庞大的 OpenClaw 工具目录
title: 工具搜索
x-i18n:
    generated_at: "2026-07-11T21:03:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6608a2de3b8ec03d3bb182d5909bb73429f623af8cebb34bc38856cb9d8b8c32
    source_path: tools/tool-search.md
    workflow: 16
---

工具搜索是一项实验性的 OpenClaw 智能体运行时功能。它为智能体提供一种紧凑的方式，用于发现和调用大型工具目录。当一次运行有许多可用工具，但模型可能只需要其中少数几个时，它非常有用。

本页介绍 OpenClaw 工具搜索。它不是 Codex 原生的工具搜索或动态工具界面。Codex 原生代码模式、工具搜索、延迟动态工具和嵌套工具调用都是稳定的 Codex harness 功能，不依赖 `tools.toolSearch`。

为 OpenClaw 运行启用此功能后，默认情况下，模型会收到一个 `tool_search_code` 工具，以及所有结构化结果无法通过紧凑桥接传递的仅直接工具。代码工具会在隔离的 Node 子进程中运行一小段 JavaScript 代码，并提供 `openclaw.tools` 桥接：

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

目录可以包含符合目录条件的 OpenClaw 工具、插件工具、MCP 工具和客户端提供的工具。模型不会预先看到每个已编入目录的模式。相反，它会搜索紧凑描述符，在需要确切模式时描述某个选定工具，然后通过 OpenClaw 调用该工具。仅直接工具仍对模型可见，并且不会添加到目录中。

Codex harness 运行不会接收这些实验性的 OpenClaw 工具搜索控制项。OpenClaw 将产品能力作为动态工具传递给 Codex，而稳定的原生代码模式、原生工具搜索、延迟动态工具和嵌套工具调用由 Codex 管理。

## 一个轮次如何运行

在规划阶段，OpenClaw 内嵌运行器会为本次运行构建生效的目录：

1. 解析适用于智能体、配置文件、沙箱和会话的有效工具策略。
2. 列出符合条件的 OpenClaw 工具和插件工具。
3. 通过会话 MCP 运行时列出符合条件的 MCP 工具。
4. 添加为当前运行提供的符合条件的客户端工具。
5. 保持仅直接工具对模型可见，并为其余符合目录条件的工具建立紧凑描述符索引。
6. 在这些仅直接工具之外，公开 OpenClaw 代码桥接、结构化回退工具或紧凑目录界面。

在执行阶段，每个实际工具调用都会返回 OpenClaw。隔离的 Node 运行时不会持有插件实现、MCP 客户端对象或密钥。`openclaw.tools.call(...)` 会通过桥接返回 Gateway 网关，正常的策略、审批、钩子、日志和结果处理仍然适用。

## 模式

`tools.toolSearch` 有三种面向模型的模式：

- `code`：公开 `tool_search_code`（默认的紧凑 JavaScript 桥接）以及仅直接工具。
- `tools`：对于不应接收代码的提供商，将 `tool_search`、`tool_describe` 和 `tool_call` 作为普通结构化工具公开，同时公开仅直接工具。
- `directory`：公开 `tool_search`、`tool_describe` 和 `tool_call`，并为应当看到工具名称但不应看到每个完整模式的提供商提供一个有界的提示词目录，其中包含可用工具的名称和描述。OpenClaw 还可以为当前轮次直接公开一小组有界的可能需要或必需的工具模式。在此模式下，仅直接工具仍然可见。

所有模式都使用同一个经过策略筛选的目录和正常的 OpenClaw 执行路径。标记为 `catalogMode: "direct-only"` 的工具不会进入该目录，并保持对模型可见。如果当前运行时无法启动隔离的 Node 代码模式子进程，默认的 `code` 模式会在压缩目录之前回退到 `tools`。在 `directory` 模式下，客户端提供的工具在当前运行中保持直接可见，而 OpenClaw 工具、插件工具和 MCP 工具可以压缩到目录后方。直接调用一个确切但隐藏的目录名称时，会先从同一个已授权目录加载该工具，然后再执行。

所有模式均为实验性功能。对于较小的 OpenClaw 工具目录，优先直接公开工具；对于 Codex harness 运行，优先使用 Codex 原生的稳定功能。

没有单独的来源选择配置。启用工具搜索后，目录会在经过正常策略筛选后包含符合目录条件的 OpenClaw、MCP 和客户端工具；仅直接工具则单独保留。

## 为什么需要此功能

大型目录很有用，但成本较高。将每个工具模式都发送给模型会增大请求、减慢规划速度，并增加误选工具的可能性。

工具搜索改变了这种结构：

- 直接工具：模型在生成第一个词元之前就能看到每个选定的模式
- 工具搜索代码模式：模型会看到一个紧凑的代码工具、一份简短的 API 契约以及所有仅直接工具
- 工具搜索工具模式：模型会看到三个紧凑的结构化回退工具以及所有仅直接工具
- 工具搜索目录模式：模型会看到一个有界目录、搜索/描述/调用控制项、一小组有界的可能需要或必需的模式，以及所有仅直接工具
- 轮次期间：模型可以按需加载其余模式

对于小型目录，直接公开工具仍然是正确的默认选择。当一次运行能够看到许多工具时，工具搜索最为适用，特别是这些工具来自 MCP 服务器或客户端提供的应用工具时。

## API

`openclaw.tools.search(query, options?)`

搜索当前运行的生效目录。结果紧凑且安全，可以放回提示词上下文。

```js
const hits = await openclaw.tools.search("calendar event", { limit: 5 });
```

`openclaw.tools.describe(id)`

加载一个搜索结果的完整元数据，包括确切的输入模式。

```js
const calendarCreate = await openclaw.tools.describe("mcp:calendar:create_event");
```

`openclaw.tools.call(id, args)`

通过 OpenClaw 调用选定的工具。

```js
await openclaw.tools.call(calendarCreate.id, {
  summary: "Planning",
  start: "2026-05-09T14:00:00Z",
});
```

结构化回退模式会将相同的操作作为工具公开：

- `tool_search`
- `tool_describe`
- `tool_call`

目录模式公开：

- `tool_search`
- `tool_describe`
- `tool_call`

它还会保持客户端提供的工具和所有仅直接工具直接可见，并且可以为当前轮次直接公开一小组有界的可能需要或必需的目录工具模式。如果有界目录遗漏了条目，请使用 `tool_search` 查找它们。如果模型直接请求一个确切但隐藏的目录工具名称，OpenClaw 会先从已授权目录加载它，然后再正常执行。
目录模式下的客户端工具名称不得与 OpenClaw、插件或 MCP 工具名称冲突，因为确切的延迟分发会使用这些名称。

## 运行时边界

代码桥接在短生命周期的 Node 子进程中运行。子进程启动时会启用 Node 权限模式，使用空环境，不授予文件系统或网络权限，也不授予子进程或工作线程权限。OpenClaw 会在父进程中强制执行实际时钟超时，并在超时时终止子进程，包括异步延续发生后的情况。

运行时仅公开：

- `console.log`、`console.warn` 和 `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

正常的 OpenClaw 行为仍适用于最终调用：

- 工具允许和拒绝策略
- 按智能体和按沙箱配置的工具限制
- 渠道/运行时工具策略
- 审批钩子
- 插件 `before_tool_call` 钩子
- 会话身份、日志和遥测

## 配置

使用默认代码桥接为 OpenClaw 运行启用工具搜索：

```bash
openclaw config set tools.toolSearch true
```

等效的 JSON：

```json5
{
  tools: {
    toolSearch: true,
  },
}
```

改为对 OpenClaw 运行使用结构化回退工具：

```json5
{
  tools: {
    toolSearch: {
      mode: "tools",
    },
  },
}
```

改为对 OpenClaw 运行使用紧凑目录界面：

```json5
{
  tools: {
    toolSearch: {
      mode: "directory",
    },
  },
}
```

调整代码模式超时和搜索结果限制（所示值为默认值）：

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

禁用此功能：

```json5
{
  tools: {
    toolSearch: false,
  },
}
```

## 提示词和遥测

工具搜索会记录足够的遥测数据，以便与直接公开工具进行比较：

- 发送到 harness 的工具和提示词序列化总字节数
- 目录大小和来源明细
- 搜索、描述和调用次数
- 通过 OpenClaw 执行的最终工具调用
- 选定工具的 ID 和来源

会话日志应当能够回答：

- 模型预先看到了多少个工具模式
- 模型执行了多少次搜索和描述操作
- 最终调用了哪个工具
- 结果来自 OpenClaw、MCP 还是客户端工具

## E2E 验证

QA Lab Gateway 网关场景使用 OpenClaw 运行时验证两条路径：

```bash
pnpm openclaw qa suite --provider-mode mock-openai --scenario tool-search-gateway-e2e
```

它会创建一个包含大型工具目录的临时模拟插件，启动模拟 OpenAI provider，以直接模式启动一次 Gateway 网关，再启用工具搜索启动一次 Gateway 网关，然后比较提供商请求载荷和会话日志。

该回归测试验证：

1. 直接模式可以调用模拟插件工具。
2. 工具搜索可以调用同一个模拟插件工具。
3. 直接模式会将模拟插件工具模式直接公开给提供商。
4. 工具搜索仅公开紧凑桥接以及所有仅直接工具。
5. 对于大型模拟目录，工具搜索的请求载荷更小。
6. 会话日志显示预期的工具调用次数和桥接调用遥测数据。

## 失败行为

工具搜索应当采用故障关闭策略：

- 如果某个工具不在生效策略中，搜索不应返回它
- 如果选定的工具变得不可用，`tool_call` 应当失败
- 如果策略或审批阻止执行，调用结果应当报告该阻止，而不是绕过它
- 如果代码桥接无法创建隔离运行时，请使用 `mode: "tools"`，或为该部署禁用工具搜索

## 相关内容

- [工具和插件](/zh-CN/tools)
- [多 Agent 沙盒和工具](/zh-CN/tools/multi-agent-sandbox-tools)
- [Exec 工具](/zh-CN/tools/exec)
- [ACP Agents 设置](/zh-CN/tools/acp-agents-setup)
- [Building Plugins](/zh-CN/plugins/building-plugins)
