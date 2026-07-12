---
read_when:
    - 你希望 OpenClaw 智能体使用大型工具目录，而无需将每个工具架构都添加到提示词中
    - 你希望通过一个紧凑的运行时界面公开 OpenClaw 工具、MCP 工具和客户端工具
    - 你正在为 OpenClaw 运行实现或调试工具发现功能
summary: 工具搜索：将大型 OpenClaw 工具目录精简为搜索、描述和调用接口
title: 工具搜索
x-i18n:
    generated_at: "2026-07-12T14:48:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6608a2de3b8ec03d3bb182d5909bb73429f623af8cebb34bc38856cb9d8b8c32
    source_path: tools/tool-search.md
    workflow: 16
---

Tool Search 是一项实验性的 OpenClaw 智能体运行时功能。它为智能体提供了一种紧凑的统一方式，用于发现和调用大型工具目录。当一次运行有许多可用工具，但模型可能只需要其中少数几个时，它很有用。

本页介绍 OpenClaw Tool Search。它并非 Codex 原生工具搜索或动态工具界面。Codex 原生代码模式、工具搜索、延迟动态工具和嵌套工具调用都是稳定的 Codex harness 界面，不依赖 `tools.toolSearch`。

为 OpenClaw 运行启用后，默认情况下模型会收到一个 `tool_search_code` 工具，以及结构化结果无法通过紧凑桥接传递的所有仅限直接调用工具。该代码工具会在隔离的 Node 子进程中运行一小段 JavaScript 代码，并提供 `openclaw.tools` 桥接：

```js
const hits = await openclaw.tools.search("创建 GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "启动时崩溃",
  body: "复现步骤……",
});
```

该目录可以包含符合目录条件的 OpenClaw 工具、插件工具、MCP 工具和客户端提供的工具。模型不会预先看到所有已编入目录的 schema。它会改为搜索紧凑描述符，在需要确切 schema 时描述一个选定工具，然后通过 OpenClaw 调用该工具。仅限直接调用工具仍对模型可见，不会添加到目录中。

Codex harness 运行不会接收这些实验性的 OpenClaw Tool Search 控制项。OpenClaw 将产品能力作为动态工具传递给 Codex，而稳定的原生代码模式、原生工具搜索、延迟动态工具和嵌套工具调用由 Codex 负责。

## 轮次如何运行

在规划阶段，OpenClaw 嵌入式运行器会为本次运行构建有效目录：

1. 解析智能体、配置文件、沙箱和会话的活动工具策略。
2. 列出符合条件的 OpenClaw 和插件工具。
3. 通过会话 MCP 运行时列出符合条件的 MCP 工具。
4. 添加为当前运行提供的符合条件的客户端工具。
5. 保持仅限直接调用工具对模型可见，并为其余符合目录条件的工具建立紧凑描述符索引。
6. 在这些仅限直接调用工具旁公开 OpenClaw 代码桥接、结构化回退工具或紧凑目录界面。

在执行阶段，每次实际工具调用都会返回 OpenClaw。隔离的 Node 运行时不持有插件实现、MCP 客户端对象或密钥。`openclaw.tools.call(...)` 会跨越桥接返回 Gateway 网关，正常的策略、审批、钩子、日志和结果处理仍会在其中应用。

## 模式

`tools.toolSearch` 有三种面向模型的模式：

- `code`：在仅限直接调用工具旁公开 `tool_search_code`，即默认的紧凑 JavaScript 桥接。
- `tools`：对于不应接收代码的提供商，在仅限直接调用工具旁将 `tool_search`、`tool_describe` 和 `tool_call` 公开为普通结构化工具。
- `directory`：公开 `tool_search`、`tool_describe` 和 `tool_call`，并为应该看到工具名称但不应看到每个完整 schema 的提供商提供一个有界的可用工具名称和描述提示目录。OpenClaw 还可以为当前轮次直接公开一小组有界的可能需要或必需的工具 schema。在此模式下，仅限直接调用工具也仍然可见。

所有模式都使用经过相同策略筛选的目录和正常的 OpenClaw 执行路径。标记为 `catalogMode: "direct-only"` 的工具位于该目录之外，并保持对模型可见。如果当前运行时无法启动隔离的 Node 代码模式子进程，默认 `code` 模式会在目录压缩之前回退到 `tools`。在 `directory` 模式下，客户端提供的工具在当前运行中保持直接可见，而 OpenClaw 工具、插件工具和 MCP 工具可以压缩到目录之后。对确切隐藏目录名称的直接调用会在执行前从同一授权目录中加载。

所有模式均为实验性功能。对于较小的 OpenClaw 工具目录，请优先直接公开工具；对于 Codex harness 运行，请优先使用 Codex 原生的稳定界面。

没有单独的来源选择配置。启用 Tool Search 后，目录会在正常策略筛选后包含符合目录条件的 OpenClaw、MCP 和客户端工具；仅限直接调用工具会单独保留。

## 存在原因

大型目录很有用，但成本高昂。将每个工具 schema 都发送给模型会增大请求、减慢规划速度，并增加意外选择工具的可能性。

Tool Search 改变了这种形式：

- 直接工具：模型在生成第一个 token 前会看到每个选定的 schema
- Tool Search 代码模式：模型会看到一个紧凑的代码工具、一份简短的 API 契约以及所有仅限直接调用工具
- Tool Search 工具模式：模型会看到三个紧凑的结构化回退工具以及所有仅限直接调用工具
- Tool Search 目录模式：模型会看到一个有界目录、搜索/描述/调用控制项、一小组有界的可能需要或必需的 schema，以及所有仅限直接调用工具
- 轮次期间：模型可以按需加载其余 schema

对于小型目录，直接公开工具仍是正确的默认选择。当一次运行可以看到许多工具时，尤其是来自 MCP 服务器或客户端提供的应用工具时，Tool Search 最为适用。

## API

`openclaw.tools.search(query, options?)`

搜索当前运行的有效目录。结果紧凑且安全，可以放回提示上下文中。

```js
const hits = await openclaw.tools.search("日历事件", { limit: 5 });
```

`openclaw.tools.describe(id)`

加载一个搜索结果的完整元数据，包括确切的输入 schema。

```js
const calendarCreate = await openclaw.tools.describe("mcp:calendar:create_event");
```

`openclaw.tools.call(id, args)`

通过 OpenClaw 调用选定的工具。

```js
await openclaw.tools.call(calendarCreate.id, {
  summary: "规划",
  start: "2026-05-09T14:00:00Z",
});
```

结构化回退模式将相同的操作公开为工具：

- `tool_search`
- `tool_describe`
- `tool_call`

目录模式公开：

- `tool_search`
- `tool_describe`
- `tool_call`

它还会保持客户端提供的工具和所有仅限直接调用工具直接可见，并且可能为当前轮次直接公开一小组有界的可能需要或必需的目录工具 schema。如果有界目录省略了条目，请使用 `tool_search` 查找它们。如果模型直接请求确切的隐藏目录工具名称，OpenClaw 会在正常执行前从授权目录中加载该工具。
目录模式的客户端工具名称不得与 OpenClaw、插件或 MCP 工具名称冲突，因为确切的延迟分派会使用这些名称。

## 运行时边界

代码桥接在短生命周期的 Node 子进程中运行。子进程启动时会启用 Node 权限模式，使用空环境，且不授予文件系统或网络权限，也不授予子进程或 worker 权限。OpenClaw 会强制执行父进程墙上时钟超时，并在超时时终止子进程，包括异步延续之后发生的超时。

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

使用默认代码桥接为 OpenClaw 运行启用 Tool Search：

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

禁用它：

```json5
{
  tools: {
    toolSearch: false,
  },
}
```

## 提示和遥测

Tool Search 会记录足够的遥测数据，以便与直接公开工具进行比较：

- 发送到 harness 的工具和提示序列化总字节数
- 目录大小和来源明细
- 搜索、描述和调用次数
- 通过 OpenClaw 执行的最终工具调用
- 选定的工具 ID 和来源

会话日志应能用于回答：

- 模型预先看到了多少个工具 schema
- 它执行了多少次搜索和描述操作
- 最终调用了哪个工具
- 结果来自 OpenClaw、MCP 还是客户端工具

## E2E 验证

QA Lab Gateway 网关场景使用 OpenClaw 运行时验证两条路径：

```bash
pnpm openclaw qa suite --provider-mode mock-openai --scenario tool-search-gateway-e2e
```

它会创建一个包含大型工具目录的临时虚假插件，启动模拟 OpenAI provider，以直接模式启动一次 Gateway 网关，再启用 Tool Search 启动一次，然后比较提供商请求载荷和会话日志。

该回归验证：

1. 直接模式可以调用虚假插件工具。
2. Tool Search 可以调用同一个虚假插件工具。
3. 直接模式会将虚假插件工具 schema 直接公开给提供商。
4. Tool Search 仅公开紧凑桥接以及所有仅限直接调用工具。
5. 对于大型虚假目录，Tool Search 请求载荷更小。
6. 会话日志会显示预期的工具调用次数和桥接调用遥测。

## 失败行为

Tool Search 应采用失败关闭策略：

- 如果工具不在有效策略中，搜索不应返回该工具
- 如果选定的工具变得不可用，`tool_call` 应失败
- 如果策略或审批阻止执行，调用结果应报告该阻止，而不是绕过它
- 如果代码桥接无法创建隔离运行时，请使用 `mode: "tools"`，或为该部署禁用 Tool Search

## 相关内容

- [工具和插件](/zh-CN/tools)
- [多 Agent 沙盒和工具](/zh-CN/tools/multi-agent-sandbox-tools)
- [Exec 工具](/zh-CN/tools/exec)
- [ACP Agents 设置](/zh-CN/tools/acp-agents-setup)
- [Building Plugins](/zh-CN/plugins/building-plugins)
