---
read_when:
    - 你想为一次智能体运行启用 OpenClaw 代码模式
    - 你需要解释为什么代码模式不同于 Codex 代码模式
    - 你正在审查 exec/wait 契约、QuickJS-WASI 沙箱、TypeScript 转换，或隐藏的工具目录桥接
    - 你正在添加或审查内部代码模式命名空间注册表集成
sidebarTitle: Code mode
summary: OpenClaw 代码模式：一个可选启用的 exec/wait 工具界面，由 QuickJS-WASI 和隐藏的按运行范围限定的工具目录提供支持
title: 代码模式
x-i18n:
    generated_at: "2026-07-05T11:41:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: da4803ad63634fd0f58adf09d143032fc6740331dab4e0769fae32461812f08c
    source_path: reference/code-mode.md
    workflow: 16
---

代码模式是一个实验性的、选择启用的 OpenClaw Agent Runtimes 功能。启用后，模型不再看到每个已启用工具的 schema；相反，在该运行中它只会看到两个工具：`exec` 和 `wait`。模型会编写一小段 JavaScript 或 TypeScript 程序，用于搜索、描述并调用隐藏的工具目录。

本页记录的是 OpenClaw 代码模式，而不是 Codex Code Mode。两个功能共享同一个名称，并使用相同的模型可见工具名（`exec`、`wait`），但它们是彼此独立的实现：

- Codex Code Mode 在 Codex coding harness 内运行。它的 `exec` 工具是一个 freeform-grammar 工具：模型编写原始 JavaScript 源码（可选地在前面加上一行 `// @exec: {...}` pragma 来提供执行选项），并在 Deno/V8 运行时中执行。
- OpenClaw 代码模式在通用 OpenClaw agent runtime 中运行，除非配置了 `tools.codeMode.enabled: true`，否则处于禁用状态。它的 `exec` 工具接受一个 JSON `{ code, language }` 载荷，并在 QuickJS-WASI worker 中执行。

两者都是 JavaScript 执行面，而不是 shell 命令执行面。应将它们视为独立且实现方式不同的功能，只是恰好暴露了同名的 `exec`/`wait` 工具。

## 它的作用

- 模型可见的工具列表会精确变为 `exec` 和 `wait`。
- `exec` 会在隔离的 QuickJS-WASI worker 线程中求值模型生成的 JavaScript 或 TypeScript。
- 其他所有已启用工具（OpenClaw core、插件、MCP、客户端）都会从模型提示中隐藏，并通过 `ALL_TOOLS` 和 `tools` 暴露给 guest 程序内部。
- Guest 代码会搜索隐藏目录、描述某个工具的 schema，并通过普通 agent 轮次使用的同一执行路径调用工具（策略、审批、钩子、telemetry 仍然全部适用）。
- MCP 工具会归组到 `MCP` 命名空间下；在代码模式中，这是调用它们的唯一受支持方式。
- 当嵌套工具调用仍处于 pending 状态时，`wait` 会恢复一个已挂起的代码模式运行。

代码模式只改变面向模型的编排面。它不会替代工具、插件工具、MCP 工具、auth、审批策略、渠道行为或模型选择。

## 为什么使用它

- 更小的提示面：提供商只获得两个控制工具，而不是几十或上百个完整工具 schema。
- 更好的编排：模型可以在一个 code cell 内使用循环、join、小型转换、条件逻辑和并行嵌套工具调用。
- 提供商中立：适用于 OpenClaw、插件、MCP 和客户端工具，不依赖提供商原生代码执行。
- 失败关闭：如果启用了代码模式但 QuickJS-WASI 运行时不可用，运行会失败，而不是静默回退到宽泛的直接工具暴露。

它最适合已启用工具目录很大的智能体，或模型需要先搜索、组合并调用多个工具再回答的工作流。

## 启用它

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

简写：

```json5
{
  tools: {
    codeMode: true,
  },
}
```

当省略 `tools.codeMode`、设置为 `false`，或设置为不含 `enabled: true` 的对象时，代码模式保持关闭。

如果你使用配置了 MCP 服务器的沙箱隔离智能体，还需要在沙箱工具策略中允许内置 MCP 插件，例如 `tools.sandbox.tools.alsoAllow: ["bundle-mcp"]`。参见 [配置 - 工具和自定义提供商](/zh-CN/gateway/config-tools#mcp-and-plugin-tools-inside-sandbox-tool-policy)。

设置显式限制以获得更严格的边界：

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

调试时若要确认模型载荷形状，请用定向日志运行 Gateway 网关：

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
openclaw gateway
```

代码模式激活后，记录的面向模型工具名应为 `exec` 和 `wait`。如需完整的已脱敏提供商载荷，可在短时间调试会话中添加 `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`。

## 技术导览

本页其余部分覆盖运行时契约和实现细节，面向维护者、调试工具暴露的插件作者，以及验证高风险部署的操作员。

## 运行时状态

|                     |                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------- |
| 运行时              | [`quickjs-wasi`](https://github.com/vercel-labs/quickjs-wasi)                               |
| 默认状态            | 已禁用                                                                                      |
| 稳定性              | 实验性 OpenClaw 表面（Codex Code Mode 是独立且稳定的 Codex harness 表面）                   |
| 目标表面            | 通用 OpenClaw 智能体运行                                                                    |
| 安全姿态            | 模型代码是不可信的                                                                          |
| 面向用户的承诺      | 启用代码模式绝不会静默回退到宽泛的直接工具暴露                                             |

## 范围

代码模式拥有已准备运行的面向模型编排形状。它不拥有模型选择、渠道行为、auth、工具策略或工具实现。

范围内：模型可见的 `exec`/`wait` 定义、隐藏工具目录构建、JavaScript/TypeScript guest 执行、QuickJS-WASI worker 运行时、用于 search/describe/call 的 host 回调、用于挂起 guest 程序的可恢复状态、输出/超时/内存/pending 调用/snapshot 限制，以及嵌套工具调用的 telemetry/trajectory 投影。

范围外：提供商原生远程代码执行、shell 执行语义、改变现有工具授权、持久化的用户编写脚本、guest 代码中的包管理器/文件/网络/模块访问，以及直接复用 Codex Code Mode 内部机制。

提供商拥有的工具（例如远程 Python 沙箱）是独立工具。参见 [代码执行](/zh-CN/tools/code-execution)。

## 术语

- **代码模式**：OpenClaw 运行时模式，隐藏普通模型工具，只暴露 `exec` 和 `wait`。
- **Guest 运行时**：用于求值模型代码的 QuickJS-WASI JavaScript VM。
- **Host bridge**：从 guest 代码回到 OpenClaw 的窄 JSON 兼容回调表面。
- **目录**：在正常工具策略、插件、MCP 和客户端工具解析之后，按运行作用域形成的有效工具列表。
- **嵌套工具调用**：通过 host bridge 从 guest 代码发起的工具调用。
- **Snapshot**：序列化的 QuickJS-WASI VM 状态，用于让 `wait` 继续一个已挂起的代码模式运行。

## 配置

`tools.codeMode.enabled` 是激活门控；设置其他字段本身不会启用该功能。

| 字段                  | 默认值                         | 钳制                                            |
| --------------------- | ------------------------------ | ----------------------------------------------- |
| `enabled`             | `false`                        | boolean；只有 `true` 会启用代码模式             |
| `runtime`             | `"quickjs-wasi"`               | 唯一受支持值                                    |
| `mode`                | `"only"`                       | 暴露 `exec`/`wait`，隐藏普通模型工具            |
| `languages`           | `["javascript", "typescript"]` | 两者的任意子集                                  |
| `timeoutMs`           | `10000`                        | `100`-`60000`                                   |
| `memoryLimitBytes`    | `67108864`                     | `1048576`-`1073741824`                          |
| `maxOutputBytes`      | `65536`                        | `1024`-`10485760`                               |
| `maxSnapshotBytes`    | `10485760`                     | `1024`-`268435456`                              |
| `maxPendingToolCalls` | `16`                           | `1`-`128`                                       |
| `snapshotTtlSeconds`  | `900`                          | `1`-`86400`                                     |
| `searchDefaultLimit`  | `8`                            | 钳制到 `maxSearchLimit`                         |
| `maxSearchLimit`      | `50`                           | `1`-`50`                                        |

如果启用了代码模式但 QuickJS-WASI 无法加载，OpenClaw 会对该运行失败关闭；它不会静默暴露普通工具作为回退。

## 激活

代码模式会在已知有效工具策略之后、组装最终模型请求之前求值：

1. 解析智能体、模型、提供商、沙箱、渠道、sender 和运行策略。
2. 构建有效 OpenClaw 工具列表，添加符合条件的插件、MCP 和客户端工具。
3. 应用 allow/deny 策略。
4. 如果 `tools.codeMode.enabled` 为 false，则继续使用普通工具暴露。
5. 如果已启用且该运行的工具处于活跃状态，则在代码模式目录中注册有效工具。
6. 从模型可见列表中移除所有普通工具；添加 `exec` 和 `wait`。

有意不包含工具的运行（原始模型调用、`disableTools: true`，或空的 `tools.allow` 列表）不会激活代码模式表面，即使配置了 `tools.codeMode.enabled: true`。代码模式和 OpenClaw 工具搜索在一次运行中互斥；如果代码模式激活，则工具搜索的压缩不会激活。

代码模式目录按运行作用域隔离，不得泄漏来自另一个智能体、会话、sender 或运行的工具。

## 模型可见工具

代码模式激活时，模型只会看到 `exec` 和 `wait`。其他每个已启用工具都会从面向模型的工具列表中隐藏，并注册到代码模式目录。

使用 `exec` 进行工具编排、数据 join、循环、并行嵌套调用和结构化转换。仅当 `exec` 返回可恢复的 `waiting` 结果时才使用 `wait`。

## `exec`

`exec` 启动一个代码模式 cell 并返回一个结果。输入代码由模型生成，必须视为不可信。

输入：

```typescript
type CodeModeExecInput = {
  code?: string;
  command?: string;
  language?: "javascript" | "typescript";
};
```

规则：

- `code` 或 `command` 之一必须非空。
- `code` 是文档化的面向模型字段。
- `command` 会作为与 exec 兼容的别名被接受，用于钩子策略和可信重写（普通 OpenClaw shell exec 工具也使用 `command` 字段）；当两者同时存在时，值必须匹配。
- `language` 默认值为 `"javascript"`；schema 将其暴露为扁平字符串枚举（`"javascript" | "typescript"`），而不是 `oneOf`/`anyOf` 联合，因为一些提供商会拒绝这些形状。
- 如果 `language` 为 `"typescript"`，OpenClaw 会先转译再求值。
- `exec` 会拒绝 `import`、`require`、dynamic import 和 module-loader 模式。
- `exec` 绝不会递归暴露普通 shell `exec` 实现。
- 外层代码模式 `exec` 钩子事件携带 `toolKind: "code_mode_exec"` 和 `toolInputKind: "javascript" | "typescript"`（如已知），因此策略可以区分代码模式 cell 与共享同一工具名的 shell 风格 `exec` 调用。

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

`exec` 会在 QuickJS VM 以可恢复状态挂起且仍需要一个对模型可见的延续时返回 `waiting`；结果包含供 `wait` 使用的 `runId`。命名空间桥接调用（包括 MCP 命名空间调用）会在就绪时于同一个 `exec`/`wait` 调用内自动耗尽，因此紧凑的代码块可以调用 MCP 工具，而不必为每个命名空间 `await` 强制发起一次模型工具调用。

只有当客体 VM 没有待处理工作，且最终值在 OpenClaw 的输出适配器运行后兼容 JSON 时，`exec` 才会返回 `completed`。

## `wait`

`wait` 会继续一个已挂起的代码模式 VM。

输入：

```typescript
type CodeModeWaitInput = {
  runId: string;
};
```

输出与 `exec` 返回的 `CodeModeResult` 联合类型相同。

`wait` 存在的原因是嵌套的 OpenClaw 工具可能很慢、需要交互、受审批门控，或者会流式传输部分更新；当主机等待外部工作时，模型不应该需要保持一个长时间打开的 `exec` 调用。

QuickJS-WASI 快照/恢复是续执行机制：

1. `exec` 会求值代码，直到完成、失败或挂起。
2. 挂起时，OpenClaw 会为 QuickJS VM 创建快照，并记录待处理的主机工作。
3. 当待处理工作完成后，`wait` 会恢复 VM 快照，并按稳定名称重新注册主机回调。
4. OpenClaw 会把嵌套工具结果交付到已恢复的 VM 中，并耗尽 QuickJS 待处理作业。
5. `wait` 会返回 `completed`、`failed`，或另一个 `waiting` 结果。

快照是运行时状态，不是用户制品：它们只存在于进程内映射中（不写入数据库或磁盘），有大小限制，会过期，并且限定在创建它们的运行和会话范围内。

以下情况会导致 `wait` 失败（作为 `failed` 结果）：

- `runId` 未知，或其快照已过期。
- 调用方不在挂起运行的同一运行/会话范围内。
- 该 `runId` 已经有一个正在进行的 `wait`。
- QuickJS-WASI 恢复失败。
- 续执行会超出 `maxOutputBytes` 或 `maxSnapshotBytes`。

## 客体运行时 API

```typescript
declare const ALL_TOOLS: ToolCatalogEntry[];
declare const tools: ToolCatalog;
declare const MCP: Record<string, unknown>;
declare const namespaces: Record<string, unknown>;

declare function text(value: unknown): void;
declare function json(value: unknown): void;
declare function yield_control(reason?: string): Promise<void>;
```

`ALL_TOOLS` 是运行范围目录的紧凑元数据；默认不包含完整 schema。

```typescript
type ToolCatalogEntry = {
  id: string;
  name: string;
  label?: string;
  description: string;
  source: "openclaw" | "mcp" | "client";
  sourceName?: string;
};
```

插件工具使用 `source: "openclaw"`，并将 `sourceName` 设置为所属插件 id；没有单独的 `"plugin"` source 值。`source: "mcp"` 只用于 `sourceName`/`mcp` 元数据中的 MCP 条目（并且会从 `ALL_TOOLS`/`tools.*` 中过滤掉，见下文）。

完整 schema 只会按需加载：

```typescript
type ToolCatalogEntryWithSchema = ToolCatalogEntry & {
  parameters: unknown;
};
```

目录辅助方法：

```typescript
type ToolCatalog = {
  search(query: string, options?: { limit?: number }): Promise<ToolCatalogEntry[]>;
  describe(id: string): Promise<ToolCatalogEntryWithSchema>;
  call(id: string, input?: unknown): Promise<unknown>;
  [safeToolName: string]: unknown;
};
```

便捷工具函数只会为无歧义的安全名称安装：

```typescript
const files = await tools.search("read local file");
const fileRead = await tools.describe(files[0].id);
const content = await tools.call(fileRead.id, { path: "README.md" });

// If the hidden catalog has an unambiguous `web_search` entry:
const hits = await tools.web_search({ query: "OpenClaw code mode" });
```

MCP 目录条目在代码模式中不能通过 `tools.call(...)` 或便捷函数调用；它们只通过生成的 `MCP` 命名空间暴露。TypeScript 风格的声明文件可通过只读的 `API` 虚拟文件表面访问，因此智能体可以检查 MCP 签名，而无需把 MCP schema 加入提示词：

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

声明文件是虚拟的，不会写入工作区或状态目录。对于每个代码模式 `exec` 调用，OpenClaw 会构建运行范围工具目录，保留可见的 MCP 条目，渲染 `mcp/index.d.ts` 以及每个可见服务器对应的一个 `mcp/<server>.d.ts`，并将这张小型只读表注入 QuickJS worker。客体代码只能看到 `API` 对象：`API.list(prefix?)` 返回文件元数据，`API.read(path)` 返回所选声明内容。未知路径以及 `.`/`..` 段会被拒绝。

这会让大型 MCP schema 留在模型提示词之外：智能体从 `exec` 工具描述中得知虚拟 API 存在，只读取所需的声明文件，然后用一个对象参数调用 `MCP.<server>.<tool>()`。`MCP.<server>.$api()` 仍可作为程序内单工具 schema 响应的内联回退使用。

客体运行时永远不会直接看到主机对象。输入和输出会以兼容 JSON 的值跨过桥接，并带有明确的大小上限。

## 内部命名空间

内部命名空间让代码模式拥有简洁的领域 API，而无需增加更多模型可见工具。由加载器拥有的集成会注册一个命名空间，例如 `Issues` 或 `Calendar`；然后客体代码会在 QuickJS 程序内调用该命名空间，而模型仍然只看到 `exec` 和 `wait`。

命名空间目前仍是内部机制。没有公开的插件 SDK 命名空间 API：外部插件命名空间需要由加载器拥有的契约，以确保插件身份、已安装清单、凭证状态和缓存的目录描述符不会与支撑该命名空间的插件工具发生漂移。核心代码模式只拥有沙箱、序列化、目录门控和桥接分发。

客体代码可以使用直接全局变量，也可以使用 `namespaces` 映射：

```javascript
const open = await Issues.list({ state: "open" });
const alsoOpen = await namespaces.Issues.list({ state: "open" });
return { count: open.length, alsoCount: alsoOpen.length };
```

### 注册表生命周期

命名空间注册表是进程本地的，并按命名空间 id 建索引：

1. 受信任的加载器调用 `registerCodeModeNamespaceForPlugin(pluginId, registration)`。
2. 代码模式为该运行创建隐藏的 `ToolSearchRuntime`，并读取其运行范围目录。
3. `createCodeModeNamespaceRuntime(ctx, catalog)` 只保留那些 `requiredToolNames` 全部可见且归同一个 `pluginId` 所有的注册。
4. 每个可见命名空间都会为当前运行调用 `createScope(ctx)`，接收 `agentId`、`sessionKey`、`sessionId`、`runId`、配置和中止状态等运行上下文。
5. 作用域数据会被序列化为普通描述符，并作为直接全局变量和 `namespaces.<globalName>` 注入 QuickJS。
6. 客体调用会通过 worker 桥接挂起，在主机上解析命名空间路径，将调用映射到已声明的、由插件拥有的目录工具，并通过 `ToolSearchRuntime.callExactId` 执行该工具。
7. 已就绪的命名空间桥接调用会在活跃的 `exec`/`wait` 调用内自动耗尽；如果命名空间工作在超时时仍然待处理，或客体显式让出控制权，则 `wait` 稍后会恢复同一个命名空间运行时。
8. 插件回滚或卸载会调用 `clearCodeModeNamespacesForPlugin(pluginId)`，使过期全局变量不会在插件加载失败后继续存在。

命名空间调用就是目录工具调用：它们使用与 `tools.call(...)` 相同的策略钩子、审批、中止处理、遥测、转录投影和挂起/恢复行为。

### 注册结构

从拥有支撑工具的集成中注册命名空间。保持作用域较小，并且只暴露能映射到已声明目录工具的领域动词。

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

`createCodeModeNamespaceTool(toolName, inputMapper)` 会将作用域成员标记为可调用的命名空间函数。可选的 `inputMapper` 会接收客体参数，并为支撑目录工具返回输入对象；如果没有提供，则使用第一个客体参数，省略时使用 `{}`。

原始主机函数会在客体代码运行前被拒绝：

```typescript
createScope: () => ({
  // Wrong: this bypasses the catalog tool lifecycle and will be rejected.
  list: async () => githubClient.listIssues(),
});
```

### 所有权和可见性

命名空间所有权绑定到注册调用方的 `pluginId`。`requiredToolNames` 同时是可见性门控和所有权检查：

- 每个必需工具都必须存在于运行目录中
- 每个必需工具都必须有 `sourceName === pluginId`
- 当任何必需工具缺失或归另一个插件所有时，该命名空间会被隐藏
- 每个可调用路径只能指向 `requiredToolNames` 中命名的工具

这可以防止另一个插件通过注册同名工具来暴露命名空间，并让命名空间与普通智能体策略保持一致：如果该运行看不到支撑工具，它也看不到该命名空间。

例如，GitHub 命名空间应该位于由 GitHub 拥有的插件之后，由该插件拥有 GitHub 凭证、REST/GraphQL 客户端、速率限制、写入审批和测试。核心代码模式不应该嵌入 GitHub 专用 API、令牌处理或提供商策略。

### 作用域序列化规则

`createScope(ctx)` 可以返回一个普通对象，其中包含兼容 JSON 的值、数组、嵌套对象和 `createCodeModeNamespaceTool(...)` 调用标记。主机对象永远不会直接进入 QuickJS。

序列化器会拒绝：

- 原始函数
- 循环对象图
- 不安全的路径段：`__proto__`、`constructor`、`prototype`、空键，或包含内部路径分隔符的键
- 不是 JavaScript 标识符的 `globalName` 值
- 与内置代码模式全局变量发生冲突的 `globalName`，例如 `tools`、`namespaces`、`text`、`json`、`yield_control`、`MCP`、`API`、`ALL_TOOLS` 或 `__openclaw*`

无法序列化为 JSON 的值会在跨过桥接前转换为 JSON 安全的回退值。二进制数据、句柄、套接字、客户端和类实例应保留在普通目录工具之后。

### 提示词

命名空间 `description` 和可选的 `prompt` 仅在该命名空间对该运行可见时，才会附加到模型可见的 `exec` 架构中。使用它们来教授最小的有用表面：

```typescript
{
  description: "Fiction production service helpers.",
  prompt:
    "Use Fictions.riskAudit(), Fictions.promoteIfReady(id, status), and Fictions.unpaidOver(amount).",
}
```

提示应聚焦于命名空间契约，而不是凭证设置、实现历史或无关的插件行为。

### 清理

命名空间是进程本地注册。拥有它的插件被禁用、卸载或回滚时，请移除它们：

```typescript
clearCodeModeNamespacesForPlugin(pluginId);
```

代码模式清理由插件拥有；在插件生命周期结束时清除该插件的命名空间注册，而不是保留按命名空间拆分的清理句柄。测试可以调用 `clearCodeModeNamespacesForTest()`，以避免在用例之间泄漏注册。

### 测试检查清单

命名空间变更应覆盖安全边界和客体行为：

- 仅当后端工具可见时，命名空间提示文本才会出现
- 来自另一个 `sourceName` 的同名工具不会暴露该命名空间
- 原始作用域函数会被拒绝
- 伪造的命名空间 ID 和伪造路径会被拒绝
- 可调用路径不能指向未声明的工具
- 嵌套对象和共享引用能够正确序列化
- 命名空间调用通过目录工具执行，并返回 JSON 安全的详细信息
- 客体代码可以捕获失败
- 挂起的命名空间调用通过 `wait` 恢复
- 插件回滚会清除拥有方命名空间注册

命名空间补充了通用的 `tools.search`/`tools.call` 目录：对任意已启用的 OpenClaw、插件和客户端工具使用目录；对 MCP 工具使用 `MCP`；对插件拥有且有文档说明的领域 API 使用其他命名空间，在这些场景中，简洁代码比反复查找架构更可靠。

## 输出 API

- `text(value)` 将人类可读输出追加到 `output` 数组。
- `json(value)` 在 JSON 兼容序列化后追加一个结构化输出项。
- 客体代码最终返回的值会成为 `completed` 结果中的 `value`。

```typescript
type CodeModeOutput = { type: "text"; text: string } | { type: "json"; value: unknown };
```

规则：输出顺序与客体调用一致；输出受 `maxOutputBytes` 限制；不可序列化的值会转换为普通字符串或错误；不支持二进制值。图像和文件通过普通 OpenClaw 工具传输，而不是通过代码模式桥接传输。

## 工具目录

隐藏目录会在有效策略过滤后包含工具，顺序如下：OpenClaw 核心工具、内置插件工具、外部插件工具、MCP 工具，然后是当前运行的客户端提供工具。

目录 ID 在单次运行中稳定，并在可能时跨等效工具集保持确定性。实际形状：

```text
<source>:<owner>:<tool-name>
```

其中 `<source>` 是 `openclaw`、`mcp` 或 `client`（插件工具使用 `openclaw`，并将插件 ID 作为 `<owner>`；核心工具使用 `openclaw:core:*`）。示例：

```text
openclaw:core:message
openclaw:browser:browser_request
mcp:github:create_issue
client:app:select_file
```

目录会省略代码模式控制工具：`exec`、`wait`、`tool_search_code`、`tool_search`、`tool_describe`、`tool_call`。这可以防止递归，并保持面向模型的契约狭窄。

MCP 条目保留在运行作用域目录中，因此策略、审批、钩子、遥测、转录投影和精确工具 ID 会与普通工具执行共享。面向客体的 `ALL_TOOLS`、`tools.search(...)`、`tools.describe(...)` 和 `tools.call(...)` 视图会省略 MCP 条目。生成的 `MCP.<server>.<tool>({ ...input })` 命名空间会解析回精确的目录 ID，并通过相同的执行器路径分发。

## 工具搜索交互

代码模式会取代启用它的运行中的 OpenClaw 工具搜索模型表面。

当 `tools.codeMode.enabled` 为 true 且代码模式激活时：

- OpenClaw 不会将 `tool_search_code`、`tool_search`、`tool_describe` 或 `tool_call` 暴露为模型可见工具。
- 相同的目录化思路会移入客体运行时内部。
- 客体运行时会接收紧凑的 `ALL_TOOLS` 元数据，以及用于非 MCP 工具的搜索/描述/调用辅助函数。
- MCP 调用使用生成的 `MCP` 命名空间及其 `$api()` 标头，而不是 `tools.call(...)`。
- 嵌套调用通过工具搜索使用的同一个 OpenClaw 执行器路径分发。

请参阅 [工具搜索](/zh-CN/tools/tool-search)，了解代码模式在活跃运行中取代的 OpenClaw 紧凑目录桥接。

## 工具名称和冲突

模型可见的 `exec` 工具是代码模式工具。如果启用了普通 OpenClaw shell `exec` 工具，它会对模型隐藏，并像任何其他工具一样编入目录。

在客体运行时内部：

- 如果策略允许，`tools.call("openclaw:core:exec", input)` 可以调用 shell exec 工具。
- 仅当 shell exec 目录条目拥有明确的安全名称时，才会安装 `tools.exec(...)`。
- 代码模式 `exec` 工具永远不能通过 `tools` 递归访问。

如果两个工具归一化为相同的安全便利名称，OpenClaw 会省略该便利函数，并要求使用 `tools.call(id, input)`。

## 嵌套工具执行

每个嵌套工具调用都会跨过主机桥接并重新进入 OpenClaw，保留：活跃智能体 ID、会话 ID 和密钥、发送者和渠道上下文、沙箱策略、审批策略、插件 `before_tool_call` 钩子、中止信号、可用时的流式更新，以及轨迹/审计事件。

嵌套调用会作为真实工具调用投影到转录中，因此支持包会显示发生了什么，且投影会标识父级代码模式工具调用和嵌套工具 ID。

并行嵌套调用最多允许达到 `maxPendingToolCalls`。

## 运行和快照生命周期

每个代码模式运行都会在进程内映射中按 `runId` 跟踪（不会持久化到磁盘或数据库）。`exec`/`wait` 返回三种结果状态之一：`completed`、`waiting` 或 `failed`。

- `waiting` 结果会存储 QuickJS 快照、待处理桥接请求和作用域元数据（智能体运行 ID、会话 ID/密钥），直到 `wait` 恢复它或它过期。
- 过期、错误会话、错误运行，以及未知/已在恢复中的 `runId` 值不会产生单独的终端状态；它们会表现为 `failed` 结果（`code: "invalid_input"`），并带有类似 `code mode
run is unavailable or expired.` 或 `code mode run belongs to a different
session.` 的消息。
- 运行的快照会在它进入 `completed` 或 `failed` 后立即从映射中移除，或在 Gateway 网关关闭时丢弃（按设计，重启后不会保留任何内容：这是瞬态运行时状态）。
- OpenClaw 会限制每个进程中并发挂起运行的数量（64），并在超过该上限时拒绝新的挂起，错误为 `too many suspended code mode
runs.`。

快照存储受每次运行的 `maxSnapshotBytes`、上述每进程挂起运行上限以及 `snapshotTtlSeconds` 约束。

## QuickJS-WASI 运行时

OpenClaw 在拥有方包中将 `quickjs-wasi` 作为直接依赖加载；它不会依赖为无关依赖安装的传递副本。

运行时职责：编译/加载 QuickJS-WASI WebAssembly 模块；为每个代码模式运行或恢复创建一个隔离 VM；按稳定名称注册主机回调；设置内存和中断限制；求值 JavaScript；耗尽待处理作业；快照挂起的 VM 状态；为 `wait` 恢复快照；在终端状态后释放 VM 句柄和快照。

运行时在 Node.js 工作线程中执行，位于 OpenClaw 主事件循环之外。客体无限循环不得无限期阻塞 Gateway 网关进程；工作线程的中断处理器会强制执行墙钟超时，不依赖客体代码配合。

## TypeScript

TypeScript 支持仅是源转换：接受的输入是一个 TypeScript 代码字符串；输出是由 QuickJS-WASI 求值的 JavaScript 字符串。没有类型检查、没有模块解析，也没有 `import`/`require`。诊断会作为 `failed` 结果返回。

TypeScript 编译器仅为 TypeScript 单元格延迟加载；普通 JavaScript 单元格和禁用的代码模式永远不会加载它。

## 安全边界

模型代码是敌对的。运行时使用纵深防御：

- 在主事件循环之外、工作线程中运行 QuickJS-WASI
- 将 `quickjs-wasi` 作为直接依赖加载，而不是通过 Codex 或传递包加载
- 客体中没有文件系统、网络、子进程、模块导入、环境变量或主机全局对象
- 使用 QuickJS 内存和中断限制，以及父进程墙钟超时
- 强制执行输出、快照、日志和待处理调用上限
- 通过狭窄的 JSON 适配器序列化主机桥接值
- 将主机错误转换为普通客体错误，绝不转换为主机 realm 对象
- 在超时、中止、会话结束或过期时丢弃快照
- 拒绝递归访问 `exec`、`wait` 和工具搜索控制工具
- 防止便利名称冲突遮蔽目录辅助函数

沙箱是一层安全防护；对高风险部署，操作员可能仍需要操作系统级加固。

## 错误码

```typescript
type CodeModeErrorCode =
  | "invalid_input"
  | "runtime_unavailable"
  | "timeout"
  | "output_limit_exceeded"
  | "snapshot_limit_exceeded"
  | "internal_error";
```

`invalid_input` 覆盖错误的 `exec`/`wait` 参数、禁用语言、被拒绝的模块访问、TypeScript 转换失败、未知/过期/错误作用域的 `runId` 值，以及挂起运行过多。`runtime_unavailable` 覆盖无法启动或以非零状态退出的 QuickJS 工作线程。

返回给客体的错误是普通数据；主机 `Error` 实例、堆栈对象、原型和主机函数不会进入 QuickJS。

## 遥测

每个结果的 `telemetry` 字段会报告：隐藏目录大小和来源拆分（`openclaw`/`mcp`/`client` 计数）、运行目录的累计搜索/描述/调用计数，以及模型可见工具名称（`exec`、`wait`）。

遥测不得包含密钥、原始环境值，或超出现有 OpenClaw 轨迹策略范围的未脱敏工具输入。

## 调试

当代码模式的行为不同于普通工具运行时，请使用有针对性的模型传输日志：

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
OPENCLAW_DEBUG_SSE=events \
openclaw gateway
```

对于有效载荷形状调试，请使用 `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`。这会记录有上限且已脱敏的模型请求 JSON 快照；仅在调试时使用，因为提示和消息文本仍可能出现。

对于流调试，请使用 `OPENCLAW_DEBUG_SSE=peek` 来记录前五个已脱敏 SSE 事件。如果代码模式表面激活后，最终提供商有效载荷未精确包含 `exec` 和 `wait`，代码模式也会失败关闭。

## 实现布局

- 配置契约：`tools.codeMode`
- 目录构建器：将有效工具转换为紧凑条目和 ID 映射
- 模型表面适配器：将可见工具替换为 `exec` 和 `wait`
- QuickJS-WASI 运行时适配器：加载、求值、快照、恢复、释放
- 工作线程监督器：超时、中止、崩溃隔离
- 桥接适配器：JSON 安全的主机回调和结果交付
- TypeScript 转换适配器
- 快照存储：TTL、大小上限、运行/会话作用域
- 嵌套工具调用的轨迹投影
- 遥测计数器和诊断

实现复用了工具搜索中的目录和执行器概念，但不使用 `node:vm` 子进程作为沙箱。

## 验证检查清单

代码模式覆盖应证明：

- 禁用配置会让现有工具暴露保持不变
- 没有 `enabled: true` 的对象配置会让代码模式保持禁用
- 启用配置后，当工具在本次运行中处于活动状态时，只向模型暴露 `exec` 和 `wait`
- 原始无工具运行、`disableTools` 和空允许列表不会触发代码模式 payload 强制校验
- 所有实际生效的非 MCP 工具都会出现在 `ALL_TOOLS` 中
- 被拒绝的工具不会出现在 `ALL_TOOLS` 中
- `tools.search`、`tools.describe` 和 `tools.call` 可用于 OpenClaw 工具
- `API.list("mcp")` 和 `API.read("mcp/<server>.d.ts")` 会暴露 TypeScript 风格的 MCP 声明，无需 bridge/tool 调用
- MCP 命名空间 `$api()` 仍可作为 schema 的内联回退使用
- 对于可见 MCP 工具，MCP 命名空间调用可使用一个对象输入；同时，直接 MCP 目录条目不会出现在 `tools.*` 中
- Tool Search 控制工具同时从模型表面和隐藏目录中隐藏
- 嵌套调用会保留审批和钩子行为
- shell `exec` 对模型隐藏，但在被允许时可通过目录 id 调用
- 递归代码模式 `exec` 和 `wait` 无法从 guest code 调用
- TypeScript 输入会被转换并求值，且在禁用路径或仅 JavaScript 路径上不会加载 TypeScript
- `import`、`require`、文件系统、网络和环境访问都会失败
- 无限循环会超时，且无法阻塞 Gateway 网关
- 内存上限失败会终止 guest VM
- 对已完成和已挂起的调用都会强制执行输出和快照上限
- `wait` 会恢复已挂起的快照并返回最终值
- 过期、已中止、错误会话和未知的 `runId` 值都会失败
- transcript replay 和持久化会保留代码模式控制调用
- transcript 和 telemetry 会清晰显示嵌套工具调用

## E2E 测试计划

在更改运行时时，将这些作为集成测试或端到端测试运行：

1. 启动一个配置为 `tools.codeMode.enabled: false` 的 Gateway 网关。
2. 使用一个小型直接工具集发送一个 agent 轮次。
3. 断言模型可见工具保持不变。
4. 使用 `tools.codeMode.enabled: true` 重启。
5. 使用 OpenClaw、插件、MCP 和客户端测试工具发送一个 agent 轮次。
6. 断言模型可见工具列表正好是 `exec`、`wait`。
7. 在 `exec` 中读取 `ALL_TOOLS`，并断言实际生效的测试工具存在。
8. 在 `exec` 中，通过 `tools.search`、`tools.describe` 和 `tools.call` 调用 OpenClaw/插件/客户端工具。
9. 在 `exec` 中调用 `API.list("mcp")` 和 `API.read("mcp/<server>.d.ts")`，并断言声明文件描述了可见 MCP 工具。
10. 在 `exec` 中，通过 `MCP.<server>.<tool>({ ...input })` 调用 MCP 工具，并断言直接 MCP 目录条目不存在于 `ALL_TOOLS` 和 `tools.*` 中。
11. 断言被拒绝的工具不存在，且无法通过猜测的 id 调用。
12. 启动一个嵌套工具调用，它会在 `exec` 返回 `waiting` 后解析。
13. 调用 `wait`，并断言恢复后的 VM 收到工具结果。
14. 断言最终答案包含恢复后产生的输出。
15. 断言超时、中止和快照过期会清理运行时状态。
16. 导出 trajectory，并断言嵌套调用在父代码模式调用下可见。

仅对此页面进行文档更改时，仍应运行 `pnpm check:docs`。

## 相关

- [工具搜索](/zh-CN/tools/tool-search)
- [Agent Runtimes](/zh-CN/concepts/agent-runtimes)
- [Exec 工具](/zh-CN/tools/exec)
- [代码执行](/zh-CN/tools/code-execution)
