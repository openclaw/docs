---
read_when:
    - 你想为一次智能体运行启用 OpenClaw 代码模式
    - 你需要解释为什么代码模式不同于 Codex Code 模式
    - 你正在审查精简工具契约、QuickJS-WASI 沙箱、TypeScript 转换或隐藏的工具目录桥接层
    - 你正在添加或审查内部代码模式命名空间注册表集成
sidebarTitle: Code mode
summary: OpenClaw 代码模式：由 QuickJS-WASI 和隐藏的单次运行作用域工具目录支持的可选紧凑工具界面
title: 代码模式
x-i18n:
    generated_at: "2026-07-12T14:44:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: eb69afba5b1b204a78de0ccaf5f93922588db22ff8ee3faf40cc65af6c22f6be
    source_path: reference/code-mode.md
    workflow: 16
---

代码模式是一项实验性的、需要主动启用的 OpenClaw 智能体运行时功能。启用后，模型不再看到每个已启用工具的 schema；它只会看到 `exec`、`wait`，以及结构化结果无法通过仅支持 JSON 的客体桥接传输的任何仅限直接调用工具。模型会编写一小段 JavaScript 或 TypeScript 程序，用于搜索、描述和调用隐藏的工具目录。

本页介绍 OpenClaw 代码模式，而非 Codex Code Mode。两项功能名称相同，并使用相同的控制工具名称（`exec`、`wait`），但它们是彼此独立的实现：

- Codex Code Mode 在 Codex coding harness 内运行。它的 `exec` 工具采用自由格式语法：模型编写原始 JavaScript 源代码（可以选择在开头添加 `// @exec: {...}` pragma 行来指定执行选项），并在 Deno/V8 运行时中执行。
- OpenClaw 代码模式在通用 OpenClaw 智能体运行时中运行，除非配置 `tools.codeMode.enabled: true`，否则处于禁用状态。它的 `exec` 工具接受 JSON `{ code, language }` 负载，并在 QuickJS-WASI 工作线程中执行。

两者都是 JavaScript 执行界面，而不是 shell 命令执行界面。应将它们视为彼此独立、实现方式不同，但恰好都公开同名 `exec`/`wait` 工具的功能。

## 功能说明

- 模型可见的工具列表变为 `exec`、`wait`，以及任何仅限直接调用的工具，例如图像结果无法通过客体桥接传输的 `computer`。
- `exec` 在隔离的 QuickJS-WASI 工作线程中执行模型生成的 JavaScript 或 TypeScript。
- 每个符合目录条件的已启用工具（OpenClaw 核心、插件、MCP、客户端）都会从模型提示词中隐藏，并通过 `ALL_TOOLS` 和 `tools` 在客体程序内公开。
- 客体代码会搜索隐藏目录、描述工具的 schema，并通过普通智能体轮次使用的同一执行路径调用工具（策略、审批、钩子和遥测仍然全部适用）。
- MCP 工具统一归入 `MCP` 命名空间；在代码模式下，这是调用它们的唯一受支持方式。
- 当嵌套工具调用仍在等待处理时，`wait` 会恢复已暂停的代码模式运行。

代码模式只会改变面向模型的编排界面。它不会取代工具、插件工具、MCP 工具、身份验证、审批策略、渠道行为或模型选择。

## 使用理由

- 更小的提示词界面：提供商只会收到两个控制工具以及少数必要的直接工具，而不是数十或数百个完整的工具 schema。
- 更强的编排能力：模型可以在一个代码单元中使用循环、连接、小型转换、条件逻辑和并行嵌套工具调用。
- 不依赖提供商：适用于 OpenClaw、插件、MCP 和客户端工具，无需依赖提供商原生的代码执行功能。
- 以关闭状态失败：如果已启用代码模式但 QuickJS-WASI 运行时不可用，本次运行会失败，而不会静默回退到广泛公开直接工具。

它最适合已启用大量工具目录的智能体，或者模型需要在回答前搜索、组合并调用多个工具的工作流。

## 启用方法

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

简写形式：

```json5
{
  tools: {
    codeMode: true,
  },
}
```

当省略 `tools.codeMode`、将其设为 `false`，或将其设为不包含 `enabled: true` 的对象时，代码模式保持关闭。

如果你使用配置了 MCP 服务器的沙箱隔离智能体，还需要在沙箱工具策略中允许内置 MCP 插件，例如 `tools.sandbox.tools.alsoAllow: ["bundle-mcp"]`。请参阅[配置 - 工具和自定义提供商](/zh-CN/gateway/config-tools#mcp-and-plugin-tools-inside-sandbox-tool-policy)。

如需实施更严格的限制，请显式设置限值：

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

要在调试时确认模型负载的结构，请使用针对性日志运行 Gateway 网关：

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
openclaw gateway
```

启用代码模式后，日志中面向模型的工具名称应为 `exec` 和 `wait`。如需查看完整的脱敏提供商负载，请在短时间调试会话中添加 `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`。

## 技术导览

本页其余部分介绍运行时契约和实现细节，面向维护者、正在调试工具公开情况的插件作者，以及验证高风险部署的操作员。

## 运行时状态

|                     |                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------- |
| 运行时              | [`quickjs-wasi`](https://github.com/vercel-labs/quickjs-wasi)                               |
| 默认状态            | 已禁用                                                                                      |
| 稳定性              | 实验性 OpenClaw 界面（Codex Code Mode 是独立且稳定的 Codex harness 界面）                    |
| 目标界面            | 通用 OpenClaw 智能体运行                                                                    |
| 安全立场            | 将模型代码视为恶意代码                                                                      |
| 面向用户的承诺      | 启用代码模式绝不会静默回退到广泛公开直接工具                                                |

## 范围

代码模式负责已准备运行中面向模型的编排结构。它不负责模型选择、渠道行为、身份验证、工具策略或工具实现。

范围内：模型可见的控制工具和直接工具定义、隐藏工具目录构建、JavaScript/TypeScript 客体执行、QuickJS-WASI 工作线程运行时、用于搜索/描述/调用的宿主回调、已暂停客体程序的可恢复状态、输出/超时/内存/待处理调用/快照限制，以及嵌套工具调用的遥测和轨迹投影。

范围外：提供商原生的远程代码执行、shell 执行语义、更改现有工具授权、用户编写脚本的持久化、客体代码中的包管理器/文件/网络/模块访问，以及直接复用 Codex Code Mode 内部机制。

由提供商负责的工具（例如远程 Python 沙箱）是独立工具。请参阅[代码执行](/zh-CN/tools/code-execution)。

## 术语

- **代码模式**：隐藏与目录兼容的模型工具，并公开 `exec`、`wait` 以及必要的仅限直接调用工具的 OpenClaw 运行时模式。
- **客体运行时**：执行模型代码的 QuickJS-WASI JavaScript VM。
- **宿主桥接**：客体代码回调到 OpenClaw 的狭窄 JSON 兼容界面。
- **目录**：经过常规工具策略、插件、MCP 和客户端工具解析后，本次运行范围内的有效工具列表。
- **嵌套工具调用**：客体代码通过宿主桥接发起的工具调用。
- **快照**：保存的序列化 QuickJS-WASI VM 状态，使 `wait` 能够继续已暂停的代码模式运行。

## 配置

`tools.codeMode.enabled` 是启用开关；单独设置其他字段不会启用此功能。

| 字段                  | 默认值                         | 限制范围                                        |
| --------------------- | ------------------------------ | ----------------------------------------------- |
| `enabled`             | `false`                        | 布尔值；仅 `true` 会启用代码模式                |
| `runtime`             | `"quickjs-wasi"`               | 唯一受支持的值                                  |
| `mode`                | `"only"`                       | 公开控制/直接工具，并将其余工具加入目录         |
| `languages`           | `["javascript", "typescript"]` | 两者的任意子集                                  |
| `timeoutMs`           | `10000`                        | `100`-`60000`                                   |
| `memoryLimitBytes`    | `67108864`                     | `1048576`-`1073741824`                          |
| `maxOutputBytes`      | `65536`                        | `1024`-`10485760`                               |
| `maxSnapshotBytes`    | `10485760`                     | `1024`-`268435456`                              |
| `maxPendingToolCalls` | `16`                           | `1`-`128`                                       |
| `snapshotTtlSeconds`  | `900`                          | `1`-`86400`                                     |
| `searchDefaultLimit`  | `8`                            | 限制为不超过 `maxSearchLimit`                   |
| `maxSearchLimit`      | `50`                           | `1`-`50`                                        |

如果启用了代码模式但无法加载 QuickJS-WASI，OpenClaw 会以关闭状态结束该次运行；它不会静默公开普通工具作为回退。

## 激活

代码模式会在确定有效工具策略之后、组装最终模型请求之前进行评估：

1. 解析智能体、模型、提供商、沙箱、渠道、发送者和运行策略。
2. 构建有效的 OpenClaw 工具列表，并添加符合条件的插件、MCP 和客户端工具。
3. 应用允许/拒绝策略。
4. 如果 `tools.codeMode.enabled` 为 false，则继续采用普通工具公开方式。
5. 如果已启用且本次运行启用了工具，则保留必要的仅限直接调用工具，并在代码模式目录中注册每个符合目录条件的有效工具。
6. 从模型可见列表中移除已加入目录的工具；在保留的仅限直接调用工具旁添加 `exec` 和 `wait`。

即使配置了 `tools.codeMode.enabled: true`，有意不使用工具的运行（原始模型调用、`disableTools: true` 或空的 `tools.allow` 列表）也不会激活代码模式界面。代码模式与 OpenClaw 工具搜索在一次运行中互斥；如果代码模式被激活，工具搜索的压缩不会执行。

代码模式目录以运行为作用域，不得泄露来自其他智能体、会话、发送者或运行的工具。

## 模型可见工具

启用代码模式后，模型会看到 `exec`、`wait` 以及任何必要的仅限直接调用工具。其他所有已启用工具都会从面向模型的工具列表中隐藏，并在代码模式目录中注册。

使用 `exec` 进行工具编排、数据连接、循环、并行嵌套调用和结构化转换。仅当 `exec` 返回可恢复的 `waiting` 结果时才使用 `wait`。

## `exec`

`exec` 启动一个代码模式单元并返回一个结果。输入代码由模型生成，必须将其视为恶意代码。

输入：

```typescript
type CodeModeExecInput = {
  code?: string;
  command?: string;
  language?: "javascript" | "typescript";
};
```

规则：

- `code` 或 `command` 中必须有一个非空。
- `code` 是文档规定的面向模型字段。
- `command` 可作为与 exec 兼容的别名，用于钩子策略和可信重写（普通 OpenClaw shell exec 工具也使用 `command` 字段）；两者同时存在时，其值必须匹配。
- `language` 默认为 `"javascript"`；schema 将其公开为扁平字符串枚举（`"javascript" | "typescript"`），而不是 `oneOf`/`anyOf` 联合，因为某些提供商会拒绝这些结构。
- 如果 `language` 为 `"typescript"`，OpenClaw 会在执行前进行转译。
- `exec` 会拒绝 `import`、`require`、动态导入和模块加载器模式。
- `exec` 绝不会递归公开普通 shell `exec` 实现。
- 外层代码模式 `exec` 钩子事件携带 `toolKind: "code_mode_exec"` 和 `toolInputKind: "javascript" | "typescript"`（如果已知），因此策略可以区分代码模式单元与共享同一工具名称的 shell 风格 `exec` 调用。

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

当 QuickJS VM 暂停并保留可恢复状态，且仍需要模型可见的续接时，`exec` 返回 `waiting`；结果中包含供 `wait` 使用的 `runId`。命名空间桥接调用（包括 MCP 命名空间调用）在就绪时会在同一次 `exec`/`wait` 调用中自动执行完毕，因此紧凑的代码块可以调用 MCP 工具，而无需为每个命名空间的 await 强制发起一次模型工具调用。

仅当访客 VM 没有待处理工作，并且最终值经过 OpenClaw 的输出适配器处理后与 JSON 兼容时，`exec` 才返回 `completed`。

## `wait`

`wait` 继续运行已暂停的代码模式 VM。

输入：

```typescript
type CodeModeWaitInput = {
  runId: string;
};
```

输出与 `exec` 返回的 `CodeModeResult` 联合类型相同。

之所以提供 `wait`，是因为嵌套的 OpenClaw 工具可能执行缓慢、需要交互、受审批限制，或以流式方式返回部分更新；当宿主等待外部工作时，模型不应需要让一个长时间运行的 `exec` 调用一直保持打开状态。

QuickJS-WASI 快照/恢复是续执行机制：

1. `exec` 对代码求值，直到完成、失败或挂起。
2. 挂起时，OpenClaw 会为 QuickJS VM 创建快照，并记录待处理的宿主工作。
3. 待处理工作结束后，`wait` 会恢复 VM 快照，并使用稳定名称重新注册宿主回调。
4. OpenClaw 将嵌套工具的结果传入恢复后的 VM，并排空 QuickJS 的待处理作业。
5. `wait` 返回 `completed`、`failed` 或另一个 `waiting` 结果。

快照是运行时状态，而不是用户工件：它们仅存在于进程内映射中（不会写入数据库或磁盘），有大小限制和过期时间，并且作用域限定为创建它们的运行和会话。

以下情况下，`wait` 会失败（返回 `failed` 结果）：

- `runId` 未知，或其快照已过期。
- 调用方与已暂停的运行不在同一运行/会话作用域内。
- 该 `runId` 已有一个 `wait` 正在执行。
- QuickJS-WASI 恢复失败。
- 恢复运行会超出 `maxOutputBytes` 或 `maxSnapshotBytes`。

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

`ALL_TOOLS` 是运行作用域目录的紧凑元数据；默认不包含完整架构。

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

插件工具使用 `source: "openclaw"`，并将 `sourceName` 设为所属插件的
ID；不存在单独的 `"plugin"` 来源值。`source: "mcp"` 仅用于
`sourceName`/`mcp` 元数据中的 MCP 条目（并会从 `ALL_TOOLS`/`tools.*`
中过滤掉，见下文）。

仅在需要时加载完整架构：

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

仅为无歧义的安全名称安装便捷工具函数：

```typescript
const files = await tools.search("读取本地文件");
const fileRead = await tools.describe(files[0].id);
const content = await tools.call(fileRead.id, { path: "README.md" });

// 如果隐藏目录中存在无歧义的 `web_search` 条目：
const hits = await tools.web_search({ query: "OpenClaw 代码模式" });
```

在代码模式下，无法通过 `tools.call(...)` 或便捷函数调用 MCP 目录条目；它们仅通过生成的 `MCP`
命名空间公开。只读 `API` 虚拟文件表面提供 TypeScript 风格的声明文件，因此智能体无需将 MCP
架构添加到提示词中即可检查 MCP 签名：

```typescript
const files = await API.list("mcp");
const githubApi = await API.read("mcp/github.d.ts");

const issue = await MCP.github.createIssue({
  owner: "openclaw",
  repo: "openclaw",
  title: "调查 Gateway 网关日志",
});

const snapshot = await MCP.chromeDevtools.takeSnapshot({ output: "markdown" });
const resource = await MCP.docs.resources.read({ uri: "memo://one" });
const prompt = await MCP.docs.prompts.get({
  name: "brief",
  arguments: { topic: "release" },
});
```

`API.read("mcp/<server>.d.ts")` 返回根据 MCP 工具元数据推断出的紧凑声明：

```typescript
type McpToolResult = {
  content?: unknown[];
  structuredContent?: unknown;
  isError?: boolean;
  [key: string]: unknown;
};

declare namespace MCP.github {
  /** 返回此 TypeScript 风格的 API 头信息。 */
  function $api(toolName?: string, options?: { schema?: boolean }): Promise<McpApiHeader>;

  /**
   * 创建 GitHub issue。
   * @param owner 仓库所有者
   * @param repo 仓库名称
   * @param title Issue 标题
   */
  function createIssue(input: {
    owner: string;
    repo: string;
    title: string;
    body?: string;
  }): Promise<McpToolResult>;
}
```

声明文件是虚拟的，不会写入工作区或状态目录。对于每次代码模式 `exec` 调用，OpenClaw 都会构建此次运行范围内的工具目录，保留可见的 MCP 条目，渲染 `mcp/index.d.ts`，并为每个可见服务器渲染一个 `mcp/<server>.d.ts`，然后将这张小型只读表注入 QuickJS worker。来宾代码只能看到 `API` 对象：`API.list(prefix?)` 返回文件元数据，`API.read(path)` 返回所选声明的内容。未知路径以及包含 `.`/`..` 段的路径会被拒绝。

这样可避免将大型 MCP schema 放入模型提示词：智能体从 `exec` 工具描述中得知虚拟 API 的存在，只读取所需的声明文件，然后使用一个对象参数调用 `MCP.<server>.<tool>()`。`MCP.<server>.$api()` 仍可作为内联后备方案，在程序内部返回单个工具的 schema 响应。

来宾运行时绝不会直接看到宿主对象。输入和输出以兼容 JSON 的值跨越桥接层传递，并受到明确的大小上限约束。

## 内部命名空间

内部命名空间为代码模式提供简洁的领域 API，而不会增加更多模型可见的工具。由加载器所有的集成会注册一个命名空间，例如 `Issues` 或 `Calendar`；随后，来宾代码可在 QuickJS 程序中调用该命名空间，而模型仍然只会看到紧凑的控制/直接操作界面。

目前命名空间仅供内部使用。公共插件 SDK 尚未提供命名空间 API：外部插件命名空间需要由加载器所有的契约，以确保插件身份、已安装清单、身份验证状态和缓存的目录描述符不会与支撑命名空间的插件工具产生偏差。核心代码模式仅负责沙箱、序列化、目录门控和桥接分派。

来宾代码既可使用直接全局变量，也可使用 `namespaces` 映射：

```javascript
const open = await Issues.list({ state: "open" });
const alsoOpen = await namespaces.Issues.list({ state: "open" });
return { count: open.length, alsoCount: alsoOpen.length };
```

### 注册表生命周期

命名空间注册表位于进程本地，并以命名空间 ID 为键：

1. 受信任的加载器调用 `registerCodeModeNamespaceForPlugin(pluginId, registration)`。
2. 代码模式为此次运行创建隐藏的 `ToolSearchRuntime`，并读取其运行范围内的目录。
3. `createCodeModeNamespaceRuntime(ctx, catalog)` 仅保留满足以下条件的注册项：其所有 `requiredToolNames` 均可见，且由同一个 `pluginId` 所有。
4. 每个可见命名空间都会针对当前运行调用 `createScope(ctx)`，接收 `agentId`、`sessionKey`、`sessionId`、`runId`、配置和中止状态等运行上下文。
5. 作用域数据会序列化为普通描述符，并作为直接全局变量和 `namespaces.<globalName>` 注入 QuickJS。
6. 来宾调用通过 worker 桥接层挂起，在宿主上解析命名空间路径，将调用映射到已声明且由插件所有的目录工具，并通过 `ToolSearchRuntime.callExactId` 执行该工具。
7. 已就绪的命名空间桥接调用会在活动的 `exec`/`wait` 调用中自动排空；如果超时时命名空间工作仍在等待处理，或者来宾显式让出执行权，`wait` 稍后会恢复同一个命名空间运行时。
8. 插件回滚或卸载时调用 `clearCodeModeNamespacesForPlugin(pluginId)`，以防过期的全局变量在插件加载失败后继续存在。

命名空间调用属于目录工具调用：它们使用与 `tools.call(...)` 相同的策略钩子、审批、中止处理、遥测、记录投影和挂起/恢复行为。

### 注册结构

应从拥有后端工具的集成注册命名空间。保持较小的作用域，并且只公开可映射到已声明目录工具的领域动词。

```typescript
import {
  createCodeModeNamespaceTool,
  registerCodeModeNamespaceForPlugin,
} from "../agents/code-mode-namespaces.js";

const pluginId = "github";

registerCodeModeNamespaceForPlugin(pluginId, {
  id: "github-issues",
  globalName: "Issues",
  description: "当前仓库的 GitHub issue 辅助工具。",
  requiredToolNames: ["github_list_issues", "github_update_issue"],
  prompt: "使用 Issues.list(params) 和 Issues.update(number, patch)。",
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

`createCodeModeNamespaceTool(toolName, inputMapper)` 将作用域成员标记为可调用的命名空间函数。可选的 `inputMapper` 接收来宾参数，并返回后端目录工具的输入对象；如果未提供，则使用第一个来宾参数，省略参数时则使用 `{}`。

来宾代码运行前会拒绝原始宿主函数：

```typescript
createScope: () => ({
  // 错误：这会绕过目录工具生命周期，因此将被拒绝。
  list: async () => githubClient.listIssues(),
});
```

### 所有权和可见性

命名空间所有权绑定到注册调用方的 `pluginId`。`requiredToolNames` 同时充当可见性门控和所有权检查：

- 每个必需工具都必须存在于运行目录中
- 每个必需工具都必须满足 `sourceName === pluginId`
- 任何必需工具缺失或由其他插件所有时，命名空间都会被隐藏
- 每个可调用路径只能指向 `requiredToolNames` 中列出的工具

这可防止其他插件通过注册同名工具来公开命名空间，并使命名空间与普通智能体策略保持一致：如果此次运行看不到后端工具，也就看不到相应的命名空间。

例如，GitHub 命名空间应位于 GitHub 所有的插件之后，由该插件负责 GitHub 身份验证、REST/GraphQL 客户端、速率限制、写入审批和测试。核心代码模式不应嵌入 GitHub 专用 API、令牌处理或提供商策略。

### 作用域序列化规则

`createScope(ctx)` 可以返回一个普通对象，其中包含兼容 JSON 的值、数组、嵌套对象和 `createCodeModeNamespaceTool(...)` 调用标记。宿主对象绝不会直接进入 QuickJS。

序列化器会拒绝：

- 原始函数
- 循环对象图
- 不安全的路径段：`__proto__`、`constructor`、`prototype`、空键，
  或包含内部路径分隔符的键
- 不是 JavaScript 标识符的 `globalName` 值
- 与代码模式内置全局变量发生冲突的 `globalName`，例如 `tools`、
  `namespaces`、`text`、`json`、`yield_control`、`MCP`、`API`、`ALL_TOOLS` 或
  `__openclaw*`

无法进行 JSON 序列化的值会在通过桥接层之前转换为 JSON 安全的回退值。
二进制数据、句柄、套接字、客户端和类实例应保留在普通目录工具之后。

### 提示词

仅当命名空间在该次运行中可见时，命名空间的 `description` 和可选的
`prompt` 才会附加到模型可见的 `exec` 模式中。使用它们来说明最精简的实用接口：

```typescript
{
  description: "虚构作品制作服务辅助工具。",
  prompt:
    "使用 Fictions.riskAudit()、Fictions.promoteIfReady(id, status) 和 Fictions.unpaidOver(amount)。",
}
```

提示词应围绕命名空间契约，而不是身份验证设置、实现历史或不相关的插件行为。

### 清理

命名空间是进程本地注册项。当所属插件被禁用、卸载或回滚时，将其移除：

```typescript
clearCodeModeNamespacesForPlugin(pluginId);
```

代码模式清理由插件负责；在插件生命周期结束时清除该插件的命名空间注册项，
而不是保留逐命名空间的拆除句柄。测试可以调用
`clearCodeModeNamespacesForTest()`，以避免注册项在测试用例之间泄漏。

### 测试清单

命名空间变更应覆盖安全边界和客体行为：

- 仅当后端工具可见时才显示命名空间提示词文本
- 来自其他 `sourceName` 的同名工具不会暴露该命名空间
- 拒绝原始作用域函数
- 拒绝伪造的命名空间 ID 和伪造的路径
- 可调用路径不能指向未声明的工具
- 嵌套对象和共享引用可正确序列化
- 命名空间调用通过目录工具执行并返回 JSON 安全的详细信息
- 客体代码可以捕获失败
- 挂起的命名空间调用可通过 `wait` 恢复
- 插件回滚会清除所属命名空间的注册项

命名空间是通用 `tools.search`/`tools.call` 目录的补充：任意已启用的 OpenClaw、
插件和客户端工具使用该目录；MCP 工具使用 `MCP`；对于由插件所有且有文档说明的
领域 API，如果简洁代码比重复查询模式更可靠，则使用其他命名空间。

## 输出 API

- `text(value)` 将人类可读的输出附加到 `output` 数组。
- `json(value)` 在进行 JSON 兼容序列化后附加一个结构化输出项。
- 客体代码最终返回的值会成为 `completed` 结果中的 `value`。

```typescript
type CodeModeOutput = { type: "text"; text: string } | { type: "json"; value: unknown };
```

规则：输出顺序与客体调用顺序一致；输出受 `maxOutputBytes` 限制；
不可序列化的值会转换为纯字符串或错误；不支持二进制值。图像和文件通过
普通 OpenClaw 工具传输，而不是通过代码模式桥接层。

## 工具目录

隐藏目录包含经过有效策略筛选后的工具，顺序如下：OpenClaw 核心工具、
内置插件工具、外部插件工具、MCP 工具，最后是客户端为当前运行提供的工具。

在一次运行中，目录 ID 保持稳定；对于等效的工具集，它们会尽可能保持确定性。
实际格式：

```text
<source>:<owner>:<tool-name>
```

其中 `<source>` 为 `openclaw`、`mcp` 或 `client`（插件工具使用
`openclaw`，并将插件 ID 用作 `<owner>`；核心工具使用 `openclaw:core:*`）。
示例：

```text
openclaw:core:message
openclaw:browser:browser_request
mcp:github:create_issue
client:app:select_file
```

目录会省略代码模式控制工具（`exec`、`wait`、`tool_search_code`、
`tool_search`、`tool_describe`、`tool_call`）以及仅限直接调用的工具。
控制工具不得通过目录递归调用；仅限直接调用的工具仍对模型可见，因为其结构化结果
无法通过 QuickJS 桥接层。

MCP 条目保留在运行范围的目录中，因此策略、审批、钩子、遥测、对话记录投影和
准确的工具 ID 与普通工具执行保持共享。面向客体的 `ALL_TOOLS`、
`tools.search(...)`、`tools.describe(...)` 和 `tools.call(...)` 视图会省略
MCP 条目。生成的 `MCP.<server>.<tool>({ ...input })` 命名空间会解析回准确的
目录 ID，并通过同一执行器路径分发。

## 工具搜索交互

在代码模式处于活动状态的运行中，代码模式会取代 OpenClaw 工具搜索的模型接口。

当 `tools.codeMode.enabled` 为 true 且代码模式激活时：

- OpenClaw 不会将 `tool_search_code`、`tool_search`、`tool_describe` 或
  `tool_call` 作为模型可见工具公开。
- 相同的目录设计会移入客体运行时内部。
- 客体运行时会收到精简的 `ALL_TOOLS` 元数据，以及用于非 MCP 工具的搜索、描述和
  调用辅助函数。
- MCP 调用使用生成的 `MCP` 命名空间及其 `$api()` 标头，而不是
  `tools.call(...)`。
- 嵌套调用通过工具搜索所使用的同一 OpenClaw 执行器路径分发。

有关代码模式在活动运行中所取代的 OpenClaw 精简目录桥接层，请参阅
[工具搜索](/zh-CN/tools/tool-search)。

## 工具名称和冲突

模型可见的 `exec` 工具是代码模式工具。如果启用了普通 OpenClaw shell `exec`
工具，该工具会对模型隐藏，并像其他工具一样编入目录。

在来宾运行时内部：

- 如果策略允许，`tools.call("openclaw:core:exec", input)` 可以调用 shell Exec 工具。
- 仅当 shell Exec 目录条目具有明确无歧义的安全名称时，才会安装 `tools.exec(...)`。
- 绝不会通过 `tools` 递归提供代码模式的 `exec` 工具。

如果两个工具规范化为相同的安全便捷名称，OpenClaw 会省略该便捷函数，并要求使用 `tools.call(id, input)`。

## 嵌套工具执行

每次嵌套工具调用都会跨越主机桥接并重新进入 OpenClaw，同时保留：活动智能体 ID、会话 ID 和密钥、发送者和渠道上下文、沙箱策略、审批策略、插件 `before_tool_call` 钩子、中止信号、可用时的流式更新，以及轨迹/审计事件。

嵌套调用会作为真实工具调用投影到对话记录中，以便支持包显示发生了什么；该投影会标识父级代码模式工具调用和嵌套工具 ID。

最多允许 `maxPendingToolCalls` 个并行嵌套调用。

## 运行和快照生命周期

每次代码模式运行都在进程内映射中按 `runId` 跟踪（不会持久化到磁盘或数据库）。`exec`/`wait` 返回三种结果状态之一：`completed`、`waiting` 或 `failed`。

- `waiting` 结果会存储 QuickJS 快照、待处理的桥接请求和作用域元数据（智能体运行 ID、会话 ID/密钥），直到 `wait` 恢复该运行或其过期。
- 过期、会话错误、运行错误以及未知/已在恢复的 `runId` 值不会产生独立的终止状态；它们会表现为 `failed` 结果（`code: "invalid_input"`），并带有类似 `code mode
run is unavailable or expired.` 或 `code mode run belongs to a different
session.` 的消息。
- 一旦运行以 `completed` 或 `failed` 状态结束，其快照就会从映射中移除；Gateway 网关关闭时也会丢弃快照（重启后不会保留任何内容：这是临时运行时状态）。
- 对于只读工作，`exec` 可以设置 `restartSafe: true`。随后，OpenClaw 会在执行前拒绝具有副作用的目录调用和插件命名空间，并将挂起结果标记为可安全重放。如果重启中断 `wait`，[重启恢复](/zh-CN/gateway/restart-recovery)会根据对话记录重建该轮次，而不是恢复进程本地快照。恢复轮次本身仍仅限于经过审计的只读核心工具和明确标记为可安全重放的插件工具。
- OpenClaw 限制每个进程中并发挂起的运行数量（64）；超过此上限的新挂起请求会被拒绝，并返回 `too many suspended code mode
runs.`。

快照存储受每次运行的 `maxSnapshotBytes`、上述每进程挂起运行上限以及 `snapshotTtlSeconds` 限制。

## QuickJS-WASI 运行时

OpenClaw 将 `quickjs-wasi` 作为所属软件包的直接依赖加载；它不依赖为无关依赖项安装的传递依赖副本。

运行时职责：编译/加载 QuickJS-WASI WebAssembly 模块；为每次代码模式运行或恢复创建一个隔离的 VM；使用稳定名称注册主机回调；设置内存和中断限制；求值 JavaScript；清空待处理作业；为挂起的 VM 状态创建快照；为 `wait` 恢复快照；在终止状态后释放 VM 句柄和快照。

运行时在 Node.js 工作线程中执行，位于 OpenClaw 主事件循环之外。来宾中的无限循环绝不能无限期阻塞 Gateway 网关进程；工作线程的中断处理程序会独立于来宾代码是否配合来强制执行实际时间超时。

## TypeScript

TypeScript 支持仅是一种源代码转换：接受的输入为一个 TypeScript 代码字符串；输出为由 QuickJS-WASI 求值的 JavaScript 字符串。不进行类型检查或模块解析，也不支持 `import`/`require`。诊断信息会作为 `failed` 结果返回。

仅针对 TypeScript 单元延迟加载 TypeScript 编译器；纯 JavaScript 单元和禁用的代码模式绝不会加载它。

## 安全边界

模型代码是不可信的。运行时采用纵深防御：

- 在工作线程中、主事件循环之外运行 QuickJS-WASI
- 将 `quickjs-wasi` 作为直接依赖加载，而不是通过 Codex 或传递依赖软件包加载
- 来宾中不提供文件系统、网络、子进程、模块导入、环境变量或主机全局对象
- 使用 QuickJS 内存和中断限制，并结合父进程的实际时间超时
- 强制执行输出、快照、日志和待处理调用上限
- 通过受限的 JSON 适配器序列化主机桥接值
- 将主机错误转换为普通来宾错误，绝不传递主机领域对象
- 在超时、中止、会话结束或过期时丢弃快照
- 拒绝递归访问 `exec`、`wait` 和工具搜索控制工具
- 防止便捷名称冲突遮蔽目录辅助函数

沙箱是一层安全防护；对于高风险部署，操作员可能仍需实施操作系统级加固。

## 错误代码

```typescript
type CodeModeErrorCode =
  | "invalid_input"
  | "runtime_unavailable"
  | "timeout"
  | "output_limit_exceeded"
  | "snapshot_limit_exceeded"
  | "internal_error";
```

`invalid_input` 涵盖无效的 `exec`/`wait` 参数、被禁用的语言、被拒绝的模块访问、TypeScript 转换失败、未知/过期/作用域错误的 `runId` 值以及挂起运行过多。`runtime_unavailable` 涵盖 QuickJS 工作线程启动失败或以非零状态退出的情况。

返回给来宾的错误是普通数据；主机 `Error` 实例、堆栈对象、原型和主机函数不会进入 QuickJS。

## 遥测

每个结果的 `telemetry` 字段报告：隐藏目录大小及其来源明细（`openclaw`/`mcp`/`client` 计数）、该运行目录的累计搜索/描述/调用计数，以及模型可见的工具名称（`exec`、`wait` 和保留的仅直接调用工具）。

遥测不得包含密钥、原始环境值，或现有 OpenClaw 轨迹策略范围之外未经脱敏的工具输入。

## 调试

当代码模式的行为与正常工具运行不同时，请使用针对性的模型传输日志：

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
OPENCLAW_DEBUG_SSE=events \
openclaw gateway
```

如需调试载荷结构，请使用 `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`。这会记录模型请求的大小受限且经过脱敏的 JSON 快照；请仅在调试期间使用，因为其中仍可能出现提示词和消息文本。

对于流调试，使用 `OPENCLAW_DEBUG_SSE=peek` 记录前五个
经过脱敏的 SSE 事件。如果在代码模式表面激活后，最终提供商
载荷未恰好包含一个 `exec`、一个 `wait`，以及仅包含获批的
仅直接调用工具，代码模式也会采取失败关闭策略。

## 实现布局

- 配置契约：`tools.codeMode`
- 目录构建器：将有效工具转换为紧凑条目和 ID 映射
- 模型表面适配器：用控制工具和直接调用工具替换可见工具
- QuickJS-WASI 运行时适配器：加载、求值、生成快照、恢复、释放
- 工作进程监控器：超时、中止、崩溃隔离
- 桥接适配器：JSON 安全的宿主回调和结果交付
- TypeScript 转换适配器
- 快照存储：TTL、大小上限、运行/会话作用域
- 嵌套工具调用的轨迹投影
- 遥测计数器和诊断

该实现复用工具搜索中的目录和执行器概念，但
不使用 `node:vm` 子进程作为沙箱。

## 验证清单

代码模式覆盖应证明：

- 禁用配置时，现有工具暴露保持不变
- 不含 `enabled: true` 的对象配置会使代码模式保持禁用
- 启用配置后，当本次运行的工具处于活动状态时，仅向
  模型暴露 `exec`、`wait` 和必需的仅直接调用工具
- 原始的无工具运行、`disableTools` 和空允许列表不会触发
  代码模式载荷强制检查
- 所有符合目录条件的有效非 MCP 工具都会出现在 `ALL_TOOLS` 中
- 仅直接调用工具保持对模型可见，且不会出现在 `ALL_TOOLS` 中
- 被拒绝的工具不会出现在 `ALL_TOOLS` 中
- `tools.search`、`tools.describe` 和 `tools.call` 可用于 OpenClaw 工具
- `API.list("mcp")` 和 `API.read("mcp/<server>.d.ts")` 无需桥接/工具调用即可公开 TypeScript 风格的
  MCP 声明
- MCP 命名空间 `$api()` 仍可用作架构的内联回退
- 对于具有单个对象输入的可见 MCP 工具，MCP 命名空间调用能够正常工作，同时
  `tools.*` 中不存在直接 MCP 目录条目
- 工具搜索控制工具同时从模型表面和
  隐藏目录中隐藏
- 嵌套调用会保留审批和钩子行为
- shell `exec` 对模型隐藏，但在允许时可通过目录 ID
  调用
- 递归的代码模式 `exec` 和 `wait` 无法从客体代码中调用
- TypeScript 输入会经过转换和求值，而不会在
  禁用路径或仅 JavaScript 路径上加载 TypeScript
- `import`、`require`、文件系统、网络和环境访问均会失败
- 无限循环会超时，且无法阻塞 Gateway 网关
- 内存上限失败会终止客体 VM
- 对已完成和已暂停调用均会强制执行输出和快照上限
- `wait` 会恢复已暂停的快照并返回最终值
- 已过期、已中止、会话错误和未知的 `runId` 值会失败
- 转录重放和持久化会保留代码模式控制调用
- 转录和遥测会清晰显示嵌套工具调用

## E2E 测试计划

更改运行时时，请将以下步骤作为集成测试或端到端测试运行：

1. 启动一个 `tools.codeMode.enabled: false` 的 Gateway 网关。
2. 使用一组较小的直接调用工具发送一次智能体轮次。
3. 断言模型可见工具保持不变。
4. 使用 `tools.codeMode.enabled: true` 重新启动。
5. 使用 OpenClaw、插件、MCP 和客户端测试工具发送一次智能体轮次。
6. 断言模型可见工具列表为 `exec`、`wait`，再加上仅有的已配置
   仅直接调用工具。
7. 在 `exec` 中读取 `ALL_TOOLS`，并断言符合目录条件的有效测试
   工具存在，而仅直接调用工具不存在。
8. 在 `exec` 中通过 `tools.search`、
   `tools.describe` 和 `tools.call` 调用 OpenClaw/插件/客户端工具。
9. 在 `exec` 中调用 `API.list("mcp")` 和 `API.read("mcp/<server>.d.ts")`，并
   断言声明文件描述了可见的 MCP 工具。
10. 在 `exec` 中通过 `MCP.<server>.<tool>({ ...input })` 调用 MCP 工具，并
    断言 `ALL_TOOLS` 和
    `tools.*` 中不存在直接 MCP 目录条目。
11. 断言被拒绝的工具不存在，且无法通过猜测的 ID 调用。
12. 启动一个会在 `exec` 返回 `waiting` 后解析的嵌套工具调用。
13. 调用 `wait`，并断言恢复后的 VM 收到工具结果。
14. 断言最终答案包含恢复后产生的输出。
15. 断言超时、中止和快照过期会清理运行时状态。
16. 导出轨迹，并断言嵌套调用在父级
    代码模式调用下可见。

仅修改此页面文档时，仍应运行 `pnpm check:docs`。

## 相关内容

- [工具搜索](/zh-CN/tools/tool-search)
- [Agent Runtimes](/zh-CN/concepts/agent-runtimes)
- [Exec 工具](/zh-CN/tools/exec)
- [代码执行](/zh-CN/tools/code-execution)
