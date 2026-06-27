---
read_when:
    - 你想为一次智能体运行启用 OpenClaw 代码模式
    - 你需要解释为什么代码模式不同于 Codex 代码模式
    - 你正在审查 exec/wait 契约、QuickJS-WASI 沙箱、TypeScript 转换，或隐藏的 tool-catalog 桥接
    - 你正在添加或审查内部代码模式命名空间注册表集成
sidebarTitle: Code mode
summary: OpenClaw 代码模式：一个可选择启用的 exec/wait 工具表面，由 QuickJS-WASI 和隐藏的运行作用域工具目录提供支持
title: 代码模式
x-i18n:
    generated_at: "2026-06-27T03:14:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 859d56eb09e21c9277961ac5178c1458ce669de114e8cc3f2c8d4b104f428a74
    source_path: reference/code-mode.md
    workflow: 16
---

代码模式是 OpenClaw 的实验性智能体运行时功能。它默认关闭。启用后，OpenClaw 会改变一次运行中模型看到的内容：模型不会直接看到每个已启用的工具 schema，而是只会看到 `exec` 和 `wait`。

本页记录 OpenClaw 代码模式。它不是 Codex 代码模式。这两个功能名称相同，但由不同运行时实现，并暴露不同的 `exec` 契约：

- Codex 代码模式会为 Codex app-server 线程启用，除非受限工具策略禁用了原生代码模式。它运行在 Codex coding harness 中，模型通过 `exec.command` 契约编写 shell 命令。
- OpenClaw 代码模式只有在配置了 `tools.codeMode.enabled: true` 时才会启用。它运行在 OpenClaw 通用智能体运行时中，模型通过 `exec.code` 契约编写 JavaScript 或 TypeScript 程序。

Codex 代码模式和 Codex 原生动态工具搜索是稳定的 Codex harness 表面。OpenClaw 代码模式是 OpenClaw 拥有的实验性工具表面适配器，用于通用 OpenClaw 运行。它使用 `quickjs-wasi`、隐藏的 OpenClaw 工具目录以及常规 OpenClaw 工具执行器。

## 这是什么？

OpenClaw 代码模式让模型编写一个小型 JavaScript 或 TypeScript 程序，而不是直接从一长串工具中选择。

代码模式处于活动状态时：

- 模型可见的工具列表恰好是 `exec` 和 `wait`。
- `exec` 会在受约束的 QuickJS-WASI worker 中求值模型生成的 JavaScript 或 TypeScript。
- 常规 OpenClaw 工具会从模型提示中隐藏，并通过 `ALL_TOOLS` 和 `tools` 暴露给 guest 程序内部。
- Guest 代码可以搜索隐藏目录、描述工具，并通过普通智能体轮次使用的同一个 OpenClaw 执行路径调用工具。
- MCP 工具会归入 `MCP` 命名空间。在代码模式中，此命名空间是调用 MCP 工具的唯一受支持方式。
- 当嵌套工具调用仍在等待时，`wait` 会恢复一个已暂停的代码模式运行。

重要区别：代码模式改变的是面向模型的编排表面。它不会替代 OpenClaw 工具、插件工具、MCP 工具、凭证、审批策略、渠道行为或模型选择。

## 为什么这很好？

代码模式让大型工具目录更容易被模型使用。

- 更小的提示表面：提供商接收两个控制工具，而不是数十个或数百个完整工具 schema。
- 更好的编排：模型可以在一个代码单元内使用循环、join、小型转换、条件逻辑和并行嵌套工具调用。
- 提供商中立：它适用于 OpenClaw、插件、MCP 和客户端工具，而不依赖提供商原生代码执行。
- 现有策略保持生效：嵌套工具调用仍会经过 OpenClaw 策略、审批、钩子、会话上下文和审计路径。
- 清晰的失败模式：当代码模式被显式启用但运行时不可用时，OpenClaw 会失败关闭，而不是回退到宽泛的直接工具暴露。

代码模式特别适合启用了大型工具目录的智能体，或模型需要在生成答案前反复搜索、组合并调用工具的工作流。

## 如何启用

将 `tools.codeMode.enabled: true` 添加到智能体或运行时配置：

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

也接受简写形式：

```json5
{
  tools: {
    codeMode: true,
  },
}
```

当省略 `tools.codeMode`、设为 `false`，或对象中没有 `enabled: true` 时，代码模式保持关闭。

当你使用配置了 MCP 服务器的沙箱隔离智能体时，也要确保沙箱工具策略允许内置 MCP 插件，例如使用 `tools.sandbox.tools.alsoAllow: ["bundle-mcp"]`。请参阅[配置 - 工具和自定义提供商](/zh-CN/gateway/config-tools#mcp-and-plugin-tools-inside-sandbox-tool-policy)。

需要更严格边界时，请使用显式限制：

```json5
{
  tools: {
    codeMode: {
      enabled: true,
      timeoutMs: 10000,
      memoryLimitBytes: 67108864,
      maxOutputBytes: 65536,
      maxSnapshotBytes: 10485760,
      maxPendingToolCalls: 16,
      snapshotTtlSeconds: 900,
      searchDefaultLimit: 8,
      maxSearchLimit: 50,
    },
  },
}
```

调试时如需确认模型 payload 形状，请使用定向日志运行 Gateway 网关：

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
openclaw gateway
```

代码模式处于活动状态时，日志中面向模型的工具名称应为 `exec` 和 `wait`。如果需要脱敏后的提供商 payload，请在短时间调试会话中添加 `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`。

## 技术导览

本页其余部分描述运行时契约和实现细节。它面向维护者、调试工具暴露的插件作者，以及验证高风险部署的操作人员。

## 运行时状态

- 运行时：[`quickjs-wasi`](https://github.com/vercel-labs/quickjs-wasi)。
- 默认状态：已禁用。
- 稳定性：实验性 OpenClaw 表面；Codex 代码模式是单独的稳定 Codex harness 表面。
- 目标表面：通用 OpenClaw 智能体运行。
- 安全姿态：模型代码是敌对的。
- 面向用户的承诺：启用代码模式绝不会静默回退到宽泛的直接工具暴露。

## 范围

代码模式拥有一次已准备运行的面向模型编排形状。它不拥有模型选择、渠道行为、凭证、工具策略或工具实现。

范围内：

- 模型可见的 `exec` 和 `wait` 工具定义
- 隐藏工具目录构建
- JavaScript 和 TypeScript guest 执行
- QuickJS-WASI worker 运行时
- 用于目录搜索、schema 描述和工具调用的 host 回调
- 用于已暂停 guest 程序的可恢复状态
- 输出、超时、内存、待处理调用和快照限制
- 嵌套工具调用的遥测和轨迹投影

范围外：

- 提供商原生远程代码执行
- shell 执行语义
- 更改现有工具授权
- 持久化的用户编写脚本
- guest 代码中的包管理器、文件、网络或模块访问
- 直接复用 Codex 代码模式内部机制

提供商拥有的工具，例如远程 Python 沙箱，仍然是单独的工具。请参阅[代码执行](/zh-CN/tools/code-execution)。

## 术语

**代码模式**是 OpenClaw 运行时模式，它隐藏常规模型工具，并且只暴露 `exec` 和 `wait`。

**Guest 运行时**是求值模型代码的 QuickJS-WASI JavaScript VM。

**Host bridge**是从 guest 代码回到 OpenClaw 的狭窄 JSON 兼容回调表面。

**目录**是经过常规工具策略、插件、MCP 和客户端工具解析后的运行级有效工具列表。

**嵌套工具调用**是从 guest 代码通过 host bridge 发起的工具调用。

**快照**是序列化的 QuickJS-WASI VM 状态，用于让 `wait` 继续已暂停的代码模式运行。

## 配置

`tools.codeMode.enabled` 是激活门槛。设置其他代码模式字段不会启用该功能。

支持的字段：

- `enabled`：布尔值。默认 `false`。仅当为 `true` 时启用代码模式。
- `runtime`：`"quickjs-wasi"`。唯一受支持的运行时。
- `mode`：`"only"`。暴露 `exec` 和 `wait`，隐藏常规模型工具。
- `languages`：由 `"javascript"` 和 `"typescript"` 组成的数组。默认包含两者。
- `timeoutMs`：一次 `exec` 或 `wait` 的挂钟时间上限。默认 `10000`。运行时钳制范围：`100` 到 `60000`。
- `memoryLimitBytes`：QuickJS heap 上限。默认 `67108864`。运行时钳制范围：`1048576` 到 `1073741824`。
- `maxOutputBytes`：返回文本、JSON 和日志的上限。默认 `65536`。运行时钳制范围：`1024` 到 `10485760`。
- `maxSnapshotBytes`：序列化 VM 快照的上限。默认 `10485760`。运行时钳制范围：`1024` 到 `268435456`。
- `maxPendingToolCalls`：并发嵌套工具调用的上限。默认 `16`。运行时钳制范围：`1` 到 `128`。
- `snapshotTtlSeconds`：已暂停 VM 可恢复的时长。默认 `900`。运行时钳制范围：`1` 到 `86400`。
- `searchDefaultLimit`：隐藏目录搜索结果的默认数量。默认 `8`。运行时会将它钳制到 `maxSearchLimit`。
- `maxSearchLimit`：隐藏目录搜索结果的最大数量。默认 `50`。运行时钳制范围：`1` 到 `50`。

如果启用了代码模式但 QuickJS-WASI 无法加载，OpenClaw 会对该运行失败关闭。它不会静默暴露常规工具作为回退。

## 激活

代码模式会在已知有效工具策略之后、最终模型请求组装之前求值。

激活顺序：

1. 解析智能体、模型、提供商、沙箱、渠道、发送者和运行策略。
2. 构建有效的 OpenClaw 工具列表。
3. 添加符合条件的插件、MCP 和客户端工具。
4. 应用允许和拒绝策略。
5. 如果 `tools.codeMode.enabled` 为 false，则继续使用常规工具暴露。
6. 如果已启用且本次运行中工具处于活动状态，则在代码模式目录中注册有效工具。
7. 从模型可见工具列表中移除所有常规工具。
8. 添加代码模式的 `exec` 和 `wait`。

有意不带工具的运行，例如原始模型调用、`disableTools` 或空 allowlist，即使配置包含 `tools.codeMode.enabled: true`，也不会激活代码模式表面。

代码模式目录是运行级的。它不得泄漏来自其他智能体、会话、发送者或运行的工具。

## 模型可见工具

当代码模式处于活动状态时，模型恰好会看到这些顶层工具：

- `exec`
- `wait`

所有其他已启用工具都会从面向模型的工具列表中隐藏，并注册到代码模式目录中。

模型应使用 `exec` 进行工具编排、数据 join、循环、并行嵌套调用和结构化转换。只有当 `exec` 返回可恢复的 `waiting` 结果时，模型才应使用 `wait`。

## `exec`

`exec` 启动一个代码模式单元并返回一个结果。输入代码由模型生成，必须视为敌对。

输入：

```typescript
type CodeModeExecInput = {
  code?: string;
  command?: string;
  language?: "javascript" | "typescript";
};
```

输入规则：

- `code` 或 `command` 其中之一必须非空。
- `code` 是已记录的面向模型字段。
- `command` 作为与 exec 兼容的别名被接受，用于钩子策略和可信重写；当两者都存在时，值必须匹配。
- 外层代码模式 `exec` 钩子事件包含 `toolKind: "code_mode_exec"`，并在输入语言已知时包含 `toolInputKind: "javascript" | "typescript"`，因此策略可以区分代码模式单元和共享同一工具名的 shell 风格 `exec` 调用。
- `language` 默认是 `"javascript"`。
- 如果 `language` 是 `"typescript"`，OpenClaw 会先转译再求值。
- `exec` 在 v1 中拒绝 `import`、`require`、动态 import 和模块加载器模式。
- `exec` 不会递归暴露常规 shell `exec` 实现。

结果：

```typescript
type CodeModeResult = CodeModeCompletedResult | CodeModeWaitingResult | CodeModeFailedResult;

type CodeModeCompletedResult = {
  status: "completed";
  value: unknown;
  output?: CodeModeOutput[];
  telemetry: CodeModeTelemetry;
};

type CodeModeWaitingResult = {
  status: "waiting";
  runId: string;
  reason: "pending_tools" | "yield";
  pendingToolCalls?: CodeModePendingToolCall[];
  output?: CodeModeOutput[];
  telemetry: CodeModeTelemetry;
};

type CodeModeFailedResult = {
  status: "failed";
  error: string;
  code?: CodeModeErrorCode;
  output?: CodeModeOutput[];
  telemetry: CodeModeTelemetry;
};
```

当 QuickJS VM 暂停并带有仍需模型可见延续的可恢复状态时，`exec` 返回 `waiting`。结果包含用于 `wait` 的 `runId`。命名空间 bridge 调用（包括 MCP 命名空间调用）会在同一个 `exec`/`wait` 调用内部于就绪时自动 drain，因此紧凑的代码块可以检查 `$api()` 并调用 MCP 工具，而不必强制每个命名空间 await 对应一次模型工具调用。

`exec` 仅在 guest VM 没有待处理工作，并且最终值在 OpenClaw 的输出适配器运行后与 JSON 兼容时，才返回 `completed`。

## `wait`

`wait` 会继续一个已暂停的代码模式 VM。

输入：

```typescript
type CodeModeWaitInput = {
  runId: string;
};
```

输出与 `exec` 返回的 `CodeModeResult` 联合类型相同。

`wait` 存在的原因是嵌套的 OpenClaw 工具可能很慢、需要交互、受审批门控，或流式传输部分更新。当主机等待外部工作时，模型不应该需要让一个很长的 `exec` 调用一直保持打开。

QuickJS-WASI 快照和恢复是 v1 恢复机制：

1. `exec` 会执行代码，直到完成、失败或暂停。
2. 暂停时，OpenClaw 会为 QuickJS VM 创建快照，并记录待处理的主机工作。
3. 当待处理工作结束后，`wait` 会恢复 VM 快照。
4. OpenClaw 会按稳定名称重新注册主机回调。
5. OpenClaw 会把嵌套工具结果传递到恢复后的 VM。
6. OpenClaw 会清空 QuickJS 待处理作业。
7. `wait` 返回 `completed`、`failed`，或另一个 `waiting` 结果。

快照是运行时状态，不是用户工件。它们有大小限制、会过期，并且限定在创建它们的运行和会话范围内。

`wait` 会在以下情况下失败：

- `runId` 未知。
- 快照已过期。
- 父运行或会话已中止。
- 调用方不在同一个运行/会话范围内。
- QuickJS-WASI 恢复失败。
- 恢复会超过配置的限制。

## Guest 运行时 API

Guest 运行时暴露一个很小的全局 API：

```typescript
declare const ALL_TOOLS: ToolCatalogEntry[];
declare const tools: ToolCatalog;
declare const MCP: Record<string, unknown>;
declare const namespaces: Record<string, unknown>;

declare function text(value: unknown): void;
declare function json(value: unknown): void;
declare function yield_control(reason?: string): Promise<void>;
```

`ALL_TOOLS` 是运行范围目录的紧凑元数据。默认情况下，它不包含完整 schema。

```typescript
type ToolCatalogEntry = {
  id: string;
  name: string;
  label?: string;
  description: string;
  source: "openclaw" | "plugin" | "mcp" | "client";
  sourceName?: string;
};
```

完整 schema 仅按需加载：

```typescript
type ToolCatalogEntryWithSchema = ToolCatalogEntry & {
  parameters: unknown;
};
```

目录辅助函数：

```typescript
type ToolCatalog = {
  search(query: string, options?: { limit?: number }): Promise<ToolCatalogEntry[]>;
  describe(id: string): Promise<ToolCatalogEntryWithSchema>;
  call(id: string, input?: unknown): Promise<unknown>;
  [safeToolName: string]: unknown;
};
```

便利工具函数仅会为无歧义的安全名称安装：

```typescript
const files = await tools.search("read local file");
const fileRead = await tools.describe(files[0].id);
const content = await tools.call(fileRead.id, { path: "README.md" });

// If the hidden catalog has an unambiguous `web_search` entry:
const hits = await tools.web_search({ query: "OpenClaw code mode" });
```

在代码模式中，MCP 目录条目不能通过 `tools.call(...)` 或便利函数调用。它们只会通过生成的 `MCP` 命名空间暴露。TypeScript 风格的声明文件可通过只读的 `API` 虚拟文件表面访问，因此智能体可以检查 MCP 签名，而不需要把 MCP schema 加入提示：

```typescript
const files = await API.list("mcp");
const githubApi = await API.read("mcp/github.d.ts");

const issue = await MCP.github.createIssue({
  owner: "openclaw",
  repo: "openclaw",
  title: "Investigate gateway logs",
});

const snapshot = await MCP.chromeDevtools.takeSnapshot({ output: "markdown" });
const resource = await MCP.docs.resources.read({ uri: "memo://one" });
const prompt = await MCP.docs.prompts.get({
  name: "brief",
  arguments: { topic: "release" },
});
```

`API.read("mcp/<server>.d.ts")` 会返回从 MCP 工具元数据推断出的紧凑声明：

```typescript
type McpToolResult = {
  content?: unknown[];
  structuredContent?: unknown;
  isError?: boolean;
  [key: string]: unknown;
};

declare namespace MCP.github {
  /** Return this TypeScript-style API header. */
  function $api(toolName?: string, options?: { schema?: boolean }): Promise<McpApiHeader>;

  /**
   * Create a GitHub issue.
   * @param owner Repository owner
   * @param repo Repository name
   * @param title Issue title
   */
  function createIssue(input: {
    owner: string;
    repo: string;
    title: string;
    body?: string;
  }): Promise<McpToolResult>;
}
```

这些声明文件是虚拟的，不是写入工作区或状态目录的文件。对于每次代码模式 `exec` 调用，OpenClaw 会构建运行范围的工具目录，保留可见的 MCP 条目，渲染 `mcp/index.d.ts` 以及每个可见服务器对应的一个 `mcp/<server>.d.ts` 声明，并把这个小型只读表注入 QuickJS worker。Guest 代码只会看到 `API` 对象：`API.list(prefix?)` 返回文件元数据，`API.read(path)` 返回所选声明内容。未知路径以及 `.` / `..` 片段会被拒绝。

这能让大型 MCP schema 不进入模型提示。智能体会从 `exec` 工具描述中了解到虚拟 API 的存在，只读取所需声明文件，然后用一个对象参数调用 `MCP.<server>.<tool>()`。当智能体需要在程序内部获取单个工具的 schema 响应时，`MCP.<server>.$api()` 仍可作为内联回退使用。

Guest 运行时绝不能直接暴露主机对象。输入和输出会作为与 JSON 兼容的值跨越桥接，并带有明确的大小上限。

## 内部命名空间

内部命名空间让代码模式拥有简洁的领域 API，而无需增加更多模型可见工具。由加载器拥有的集成可以注册一个命名空间，例如 `Issues`、`Fictions` 或 `Calendar`；随后 guest 代码会在 QuickJS 程序内调用该命名空间，而 OpenClaw 仍然只向模型展示 `exec` 和 `wait`。

命名空间目前是内部机制。没有公开的插件 SDK 命名空间 API：外部插件命名空间需要一个由加载器拥有的契约，以确保插件身份、已安装清单、凭证状态和缓存的目录描述符不会偏离支撑该命名空间的插件工具。核心代码模式只拥有沙箱、序列化、目录门控和桥接分发。

Guest 代码随后可以使用直接全局变量或 `namespaces` 映射：

```javascript
const open = await Issues.list({ state: "open" });
const alsoOpen = await namespaces.Issues.list({ state: "open" });
return { count: open.length, alsoCount: alsoOpen.length };
```

### 注册表生命周期

命名空间注册表是进程本地的，并按命名空间 id 建立键。典型运行遵循以下路径：

1. 受信任的加载器调用 `registerCodeModeNamespaceForPlugin(pluginId, registration)`。
2. 代码模式为本次运行创建隐藏的 `ToolSearchRuntime`，并读取其运行范围目录。
3. `createCodeModeNamespaceRuntime(ctx, catalog)` 仅保留所有 `requiredToolNames` 都可见且由同一个 `pluginId` 拥有的注册。
4. 每个可见命名空间都会为当前运行调用 `createScope(ctx)`。该 scope 会接收运行上下文，例如 `agentId`、`sessionKey`、`sessionId`、`runId`、配置和中止状态。
5. Scope 数据会被序列化为普通描述符，并作为直接全局变量和 `namespaces.<globalName>` 注入 QuickJS。
6. Guest 调用会通过 worker 桥接暂停，在主机上解析命名空间路径，把调用映射到声明的插件拥有目录工具，并通过 `ToolSearchRuntime.call` 执行该工具。
7. OpenClaw 会在活跃的 `exec`/`wait` 工具调用中自动清空已就绪的命名空间桥接调用。如果命名空间工作在超时时仍待处理，或 guest 显式让出控制权，`wait` 稍后会恢复同一个命名空间运行时。
8. 插件回滚或卸载会调用 `clearCodeModeNamespacesForPlugin(pluginId)`，以防陈旧全局变量在插件加载失败后继续存在。

重要不变量：命名空间调用就是目录工具调用。它们使用与 `tools.call(...)` 相同的策略钩子、审批、中止处理、遥测、转录投影和暂停/恢复行为。

### 注册形状

从拥有后端工具的集成注册命名空间。保持 scope 小而明确，只暴露会映射到已声明目录工具的领域动词。

```typescript
import {
  createCodeModeNamespaceTool,
  registerCodeModeNamespaceForPlugin,
} from "../agents/code-mode-namespaces.js";

const pluginId = "github";

registerCodeModeNamespaceForPlugin(pluginId, {
  id: "github-issues",
  globalName: "Issues",
  description: "GitHub issue helpers for the current repository.",
  requiredToolNames: ["github_list_issues", "github_update_issue"],
  prompt: "Use Issues.list(params) and Issues.update(number, patch).",
  createScope: (ctx) => ({
    repository: ctx.config,
    list: createCodeModeNamespaceTool("github_list_issues", ([params]) => params ?? {}),
    update: createCodeModeNamespaceTool("github_update_issue", ([number, patch]) => ({
      number,
      patch,
    })),
  }),
});
```

`createCodeModeNamespaceTool(toolName, inputMapper)` 会把 scope 成员标记为可调用的命名空间函数。可选的 `inputMapper` 会接收 guest 参数，并返回后端目录工具的输入对象。没有输入映射器时，会使用第一个 guest 参数；如果省略，则使用 `{}`。

原始主机函数会在 guest 代码运行前被拒绝：

```typescript
createScope: () => ({
  // Wrong: this bypasses the catalog tool lifecycle and will be rejected.
  list: async () => githubClient.listIssues(),
});
```

### 所有权和可见性

命名空间所有权绑定到注册调用方的 `pluginId`。`requiredToolNames` 既是可见性门控，也是所有权检查：

- 每个必需工具都必须存在于运行目录中
- 每个必需工具都必须满足 `sourceName === pluginId`
- 当任何必需工具缺失或由其他插件拥有时，命名空间会被隐藏
- 每个可调用路径只能指向 `requiredToolNames` 中命名的工具

这可以防止另一个插件通过注册同名工具来暴露命名空间。它还让命名空间与普通智能体策略保持一致：如果运行看不到后端工具，它就看不到命名空间。

例如，GitHub 命名空间应该位于 GitHub 拥有的插件后面，由该插件拥有 GitHub 凭证、REST 或 GraphQL 客户端、速率限制、写入审批和测试。核心代码模式不应该嵌入 GitHub 专用 API、令牌处理或提供商策略。

### Scope 序列化规则

`createScope(ctx)` 可以返回一个普通对象，其中包含与 JSON 兼容的值、数组、嵌套对象，以及 `createCodeModeNamespaceTool(...)` 调用标记。主机对象绝不会直接进入 QuickJS。

序列化器会拒绝：

- 原始函数
- 循环对象图
- 不安全路径片段：`__proto__`、`constructor`、`prototype`、空键，或包含内部路径分隔符的键
- 不是 JavaScript 标识符的 `globalName` 值
- 与内置代码模式全局变量冲突的 `globalName`，例如 `tools`、`namespaces`、`text`、`json`、`yield_control` 或 `__openclaw*`

无法 JSON 序列化的值会在跨越桥接之前转换为 JSON 安全的回退值。二进制数据、句柄、套接字、客户端和类实例应该留在普通目录工具后面。

### 提示

命名空间 `description` 和可选的 `prompt` 只有在该命名空间对本次运行可见时，才会追加到模型可见的 `exec` schema。使用它们教授最小有用表面：

```typescript
{
  description: "Fiction production service helpers.",
  prompt:
    "Use Fictions.riskAudit(), Fictions.promoteIfReady(id, status), and Fictions.unpaidOver(amount).",
}
```

让提示聚焦于命名空间契约，而不是凭证设置、实现历史或无关的插件行为。

### 清理

命名空间是进程本地注册。当所属插件被禁用、卸载或回滚时移除它们：

```typescript
clearCodeModeNamespacesForPlugin(pluginId);
```

代码模式清理由插件负责；在插件生命周期结束时清除该插件的命名空间注册，而不是保留每个命名空间的拆卸句柄。测试可以调用 `clearCodeModeNamespacesForTest()`，避免注册泄漏到不同用例之间。

### 测试检查清单

命名空间变更应覆盖安全边界和客体行为：

- 只有在后端工具可见时，命名空间提示文本才会出现
- 来自另一个 `sourceName` 的同名工具不会暴露该命名空间
- 原始作用域函数会被拒绝
- 伪造的命名空间 ID 和伪造路径会被拒绝
- 可调用路径不能指向未声明工具
- 嵌套对象和共享引用能正确序列化
- 命名空间调用通过目录工具执行，并返回 JSON 安全的详情
- 客体代码可以捕获失败
- 挂起的命名空间调用通过 `wait` 恢复
- 插件回滚会清除所属命名空间注册

命名空间是通用 `tools.search` / `tools.call` 目录的补充。对任意已启用的 OpenClaw、插件和客户端工具使用该目录；对 MCP 工具使用 `MCP`；对插件所属且有文档说明的领域 API 使用其他命名空间，因为简洁代码比重复 schema 查询更可靠。

## 输出 API

`text(value)` 将人类可读的输出追加到 `output` 数组。

`json(value)` 在 JSON 兼容序列化后追加一个结构化输出项。

客体代码最终返回的值会成为 `completed` 结果中的 `value`。

输出项：

```typescript
type CodeModeOutput = { type: "text"; text: string } | { type: "json"; value: unknown };
```

输出规则：

- 输出顺序与客体调用一致
- 输出受 `maxOutputBytes` 限制
- 不可序列化的值会转换为普通字符串或错误
- v1 不支持二进制值
- 图像和文件通过普通 OpenClaw 工具传输，而不是通过代码模式桥接传输

## 工具目录

隐藏目录会在生效策略过滤后包含工具：

1. OpenClaw 核心工具。
2. 内置插件工具。
3. 外部插件工具。
4. MCP 工具。
5. 当前运行的客户端提供工具。

目录 ID 在一次运行内稳定，并在可能时对等价工具集保持确定性。

推荐 ID 形状：

```text
<source>:<owner>:<tool-name>
```

示例：

```text
openclaw:core:message
plugin:browser:browser_request
mcp:github:create_issue
client:app:select_file
```

目录会省略代码模式控制工具：

- `exec`
- `wait`
- `tool_search_code`
- `tool_search`
- `tool_describe`
- `tool_call`

这可以防止递归，并保持面向模型的契约狭窄。

MCP 条目保留在运行作用域的目录中，因此策略、审批、钩子、遥测、转录投影和精确工具 ID 会与普通工具执行共享。面向客体的 `ALL_TOOLS`、`tools.search(...)`、`tools.describe(...)` 和 `tools.call(...)` 视图会省略 MCP 条目。生成的 `MCP.<server>.<tool>({ ...input })` 命名空间会解析回精确的目录 ID，然后通过相同的执行器路径分派。

## 工具搜索交互

对于激活代码模式的运行，代码模式会取代 OpenClaw 工具搜索模型表面。

当 `tools.codeMode.enabled` 为 true 且代码模式激活时：

- OpenClaw 不会将 `tool_search_code`、`tool_search`、`tool_describe` 或 `tool_call` 作为模型可见工具暴露。
- 相同的目录化思路会移入客体运行时内部。
- 客体运行时会收到紧凑的 `ALL_TOOLS` 元数据，以及用于非 MCP 工具的搜索、描述和调用辅助函数。
- MCP 调用使用生成的 `MCP` 命名空间及其 `$api()` 头，而不是 `tools.call(...)`。
- 嵌套调用会通过工具搜索使用的相同 OpenClaw 执行器路径分派。

现有 [工具搜索](/zh-CN/tools/tool-search) 页面描述了 OpenClaw 紧凑目录桥接。代码模式是适用于可使用 `exec` 和 `wait` 的运行的通用 OpenClaw 替代方案。

## 工具名称和冲突

模型可见的 `exec` 工具是代码模式工具。如果普通 OpenClaw shell `exec` 工具已启用，它会从模型中隐藏，并像其他工具一样被编入目录。

在客体运行时内部：

- 如果策略允许，`tools.call("openclaw:core:exec", input)` 可以调用 shell exec 工具。
- 只有当 shell exec 目录条目具有明确安全名称时，才会安装 `tools.exec(...)`。
- 代码模式 `exec` 工具永远不能通过 `tools` 递归访问。

如果两个工具规范化为相同的安全便捷名称，OpenClaw 会省略便捷函数，并要求使用 `tools.call(id, input)`。

## 嵌套工具执行

每个嵌套工具调用都会跨过宿主桥接并重新进入 OpenClaw。

嵌套执行会保留：

- 活跃智能体 ID
- 会话 ID 和会话密钥
- 发送者和渠道上下文
- 沙箱策略
- 审批策略
- 插件 `before_tool_call` 钩子
- 中止信号
- 可用时的流式更新
- 轨迹和审计事件

嵌套调用会作为真实工具调用投影到转录中，因此支持包可以显示发生了什么。该投影会标识父代码模式工具调用和嵌套工具 ID。

并行嵌套调用允许数量上限为 `maxPendingToolCalls`。

## 运行时状态

每次代码模式运行都有一个状态机：

- `running`：VM 正在执行，或嵌套调用正在进行中。
- `waiting`：VM 快照存在，并且可以用 `wait` 恢复。
- `completed`：最终值已返回；快照已删除。
- `failed`：错误已返回；快照已删除。
- `expired`：快照或待处理状态超过保留期限；无法恢复。
- `aborted`：父运行/会话已取消；快照已删除。

状态按 Agent 运行、会话和工具调用 ID 确定作用域。来自不同运行或会话的 `wait` 调用会失败。

快照存储有边界限制：

- 每次运行的最大快照字节数
- 每个进程的最大实时快照数
- 快照 TTL
- 运行结束时清理
- 在不支持持久化时，于 Gateway 网关关闭时清理

## QuickJS-WASI 运行时

OpenClaw 会在所属包中将 `quickjs-wasi` 作为直接依赖加载。运行时不依赖为代理、PAC 或其他无关依赖安装的传递副本。

运行时职责：

- 编译或加载 QuickJS-WASI WebAssembly 模块
- 为每次代码模式运行或恢复创建一个隔离 VM
- 按稳定名称注册宿主回调
- 设置内存和中断限制
- 求值 JavaScript
- 清空待处理任务
- 为挂起的 VM 状态创建快照
- 为 `wait` 还原快照
- 在终端状态后释放 VM 句柄和快照

运行时在 worker 中于 OpenClaw 主事件循环之外执行。客体无限循环不得无限期阻塞 Gateway 网关进程。

## TypeScript

TypeScript 支持仅是源码转换：

- 接受的输入：一个 TypeScript 代码字符串
- 输出：由 QuickJS-WASI 求值的 JavaScript 字符串
- 不做类型检查
- 不做模块解析
- v1 中没有 `import` 或 `require`
- 诊断会作为 `failed` 结果返回

TypeScript 编译器只会为 TypeScript 单元懒加载。普通 JavaScript 单元和禁用的代码模式不会加载编译器。

转换应在可行时保留有用的行号。

## 安全边界

模型代码是敌对的。运行时使用纵深防御：

- 在主事件循环之外运行 QuickJS-WASI
- 将 `quickjs-wasi` 作为直接依赖加载，而不是通过 Codex 或传递包加载
- 客体中没有文件系统、网络、子进程、模块导入、环境变量或宿主全局对象
- 使用 QuickJS 内存和中断限制
- 强制执行父进程挂钟超时
- 强制执行输出、快照、日志和待处理调用上限
- 通过狭窄的 JSON 适配器序列化宿主桥接值
- 将宿主错误转换为普通客体错误，绝不传递宿主 realm 对象
- 在超时、中止、会话结束或过期时丢弃快照
- 拒绝对 `exec`、`wait` 和工具搜索控制工具的递归访问
- 防止便捷名称冲突遮蔽目录辅助函数

沙箱是一层安全机制。对于高风险部署，运营者仍可能需要操作系统级加固。

## 错误代码

```typescript
type CodeModeErrorCode =
  | "runtime_unavailable"
  | "invalid_config"
  | "invalid_input"
  | "unsupported_language"
  | "typescript_transform_failed"
  | "module_access_denied"
  | "timeout"
  | "memory_limit_exceeded"
  | "output_limit_exceeded"
  | "snapshot_limit_exceeded"
  | "snapshot_expired"
  | "snapshot_restore_failed"
  | "too_many_pending_tool_calls"
  | "nested_tool_failed"
  | "aborted"
  | "internal_error";
```

返回给客体的错误是普通数据。宿主 `Error` 实例、堆栈对象、原型和宿主函数不会跨入 QuickJS。

## 遥测

代码模式会报告：

- 发送给模型的可见工具名称
- 隐藏目录大小和来源拆分
- `exec` 和 `wait` 计数
- 嵌套搜索、描述和调用计数
- 被调用的嵌套工具 ID
- 超时、内存、快照和输出上限失败
- 快照生命周期事件

遥测不得包含秘密、原始环境值，或超出现有 OpenClaw 轨迹策略范围的未脱敏工具输入。

## 调试

当代码模式的行为与普通工具运行不同时，使用有针对性的模型传输日志：

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
OPENCLAW_DEBUG_SSE=events \
openclaw gateway
```

对于载荷形状调试，使用 `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`。这会记录一个有上限且已脱敏的模型请求 JSON 快照；它只应在调试时使用，因为提示词和消息文本仍可能出现。

对于流调试，使用 `OPENCLAW_DEBUG_SSE=peek` 记录前五个已脱敏 SSE 事件。代码模式表面激活后，如果最终提供商载荷不恰好包含 `exec` 和 `wait`，代码模式也会失败关闭。

## 实现布局

实现单元：

- 配置契约：`tools.codeMode`
- 目录构建器：将生效工具转换为紧凑条目和 ID 映射
- 模型表面适配器：用 `exec` 和 `wait` 替换可见工具
- QuickJS-WASI 运行时适配器：加载、求值、快照、还原、释放
- worker 监督器：超时、中止、崩溃隔离
- 桥接适配器：JSON 安全宿主回调和结果交付
- TypeScript 转换适配器
- 快照存储：TTL、大小上限、运行/会话作用域
- 嵌套工具调用的轨迹投影
- 遥测计数器和诊断

该实现复用了工具搜索中的目录和执行器概念，但不使用 `node:vm` 子进程作为沙箱。

## 验证检查清单

代码模式覆盖应证明：

- 已禁用的配置会让现有工具暴露保持不变
- 没有 `enabled: true` 的对象配置会让代码模式保持禁用
- 启用的配置在本次运行的工具处于活动状态时，只向模型暴露 `exec` 和 `wait`
- 原始无工具运行、`disableTools` 和空 allowlist 不会触发代码模式 payload 强制校验
- 所有实际生效的非 MCP 工具都会出现在 `ALL_TOOLS` 中
- 被拒绝的工具不会出现在 `ALL_TOOLS` 中
- `tools.search`、`tools.describe` 和 `tools.call` 可用于 OpenClaw 工具
- `API.list("mcp")` 和 `API.read("mcp/<server>.d.ts")` 会暴露 TypeScript 风格的 MCP 声明，无需 bridge/tool 调用
- MCP 命名空间 `$api()` 仍可作为 schema 的内联 fallback 使用
- MCP 命名空间调用适用于具有一个对象输入的可见 MCP 工具，而直接 MCP 目录条目不会出现在 `tools.*` 中
- 工具搜索控制工具会同时从模型表面和隐藏目录中隐藏
- 嵌套调用会保留审批和 hook 行为
- shell `exec` 对模型隐藏，但在允许时可通过目录 id 调用
- 递归代码模式 `exec` 和 `wait` 不能从 guest code 中调用
- TypeScript 输入会被转换并求值，而不会在禁用路径或仅 JavaScript 路径上加载 TypeScript
- `import`、`require`、文件系统、网络和环境访问会失败
- 无限循环会超时，且不能阻塞 Gateway 网关
- 内存上限失败会终止 guest VM
- 已完成和已挂起调用都会强制执行输出和 snapshot 上限
- `wait` 会恢复已挂起的 snapshot，并返回最终值
- 已过期、已中止、错误会话和未知的 `runId` 值会失败
- transcript replay 和持久化会保留代码模式控制调用
- transcript 和 telemetry 会清晰显示嵌套工具调用

## E2E 测试计划

更改运行时时，将这些作为集成测试或端到端测试运行：

1. 启动一个配置了 `tools.codeMode.enabled: false` 的 Gateway 网关。
2. 发送一个带有小型直接工具集的 agent 轮次。
3. 断言模型可见工具保持不变。
4. 使用 `tools.codeMode.enabled: true` 重启。
5. 发送一个带有 OpenClaw、插件、MCP 和客户端测试工具的 agent 轮次。
6. 断言模型可见工具列表严格为 `exec`、`wait`。
7. 在 `exec` 中读取 `ALL_TOOLS`，并断言实际生效的测试工具存在。
8. 在 `exec` 中，通过 `tools.search`、`tools.describe` 和 `tools.call` 调用 OpenClaw/插件/客户端工具。
9. 在 `exec` 中调用 `API.list("mcp")` 和 `API.read("mcp/<server>.d.ts")`，并断言声明文件描述了可见 MCP 工具。
10. 在 `exec` 中，通过 `MCP.<server>.<tool>({ ...input })` 调用 MCP 工具，并断言直接 MCP 目录条目不存在于 `ALL_TOOLS` 和 `tools.*` 中。
11. 断言被拒绝的工具不存在，且无法通过猜测的 id 调用。
12. 启动一个在 `exec` 返回 `waiting` 后解析的嵌套工具调用。
13. 调用 `wait`，并断言恢复后的 VM 收到工具结果。
14. 断言最终答案包含恢复后产生的输出。
15. 断言 timeout、abort 和 snapshot expiry 会清理运行时状态。
16. 导出 trajectory，并断言嵌套调用在父级代码模式调用下可见。

仅文档更改此页面时，仍应运行 `pnpm check:docs`。

## 相关

- [工具搜索](/zh-CN/tools/tool-search)
- [Agent Runtimes](/zh-CN/concepts/agent-runtimes)
- [Exec 工具](/zh-CN/tools/exec)
- [代码执行](/zh-CN/tools/code-execution)
