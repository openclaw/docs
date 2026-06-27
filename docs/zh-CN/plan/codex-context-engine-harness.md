---
read_when:
    - 你正在将 context-engine 生命周期行为接入 Codex harness
    - 需要 lossless-claw 或其他 context-engine 插件，才能配合 codex/* 嵌入式 harness 会话使用
    - 你正在比较嵌入式 OpenClaw 和 Codex app-server 上下文行为
summary: OpenClaw 捆绑的 Codex app-server harness 支持 OpenClaw context-engine 插件的规范
title: Codex Harness Context Engine Port
x-i18n:
    generated_at: "2026-06-27T02:26:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a757ee324e7937e30736ff8a82d86fec6b3fe93e837a71a69a6d0af911e9f395
    source_path: plan/codex-context-engine-harness.md
    workflow: 16
---

## 状态

实现规范草案。

## 目标

让内置 Codex app-server harness 遵循嵌入式 OpenClaw 轮次已经遵循的同一套 OpenClaw context-engine 生命周期契约。

使用 provider/model `agentRuntime.id: "codex"` 或 `codex/*` 模型的会话，仍应允许选定的 context-engine 插件（例如 `lossless-claw`）在 Codex app-server 边界允许的范围内，控制上下文组装、轮次后摄取、维护，以及 OpenClaw 级别的压缩策略。

## 非目标

- 不重新实现 Codex app-server 内部机制。
- 不让 Codex 原生线程压缩生成 lossless-claw 摘要。
- 不要求非 Codex 模型使用 Codex harness。
- 不更改 ACP/acpx 会话行为。本规范仅适用于非 ACP 嵌入式智能体 harness 路径。
- 不让第三方插件注册 Codex app-server 扩展工厂；现有的内置插件信任边界保持不变。

## 当前架构

嵌入式运行循环会在选择具体低层 harness 之前，为每次运行解析一次已配置的上下文引擎：

- `src/agents/embedded-agent-runner/run.ts`
  - 初始化 context-engine 插件
  - 调用 `resolveContextEngine(params.config)`
  - 将 `contextEngine` 和 `contextTokenBudget` 传入 `runEmbeddedAttemptWithBackend(...)`

`runEmbeddedAttemptWithBackend(...)` 委托给选定的智能体 harness：

- `src/agents/embedded-agent-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

Codex app-server harness 由内置 Codex 插件注册：

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

Codex harness 实现接收与内置 OpenClaw 尝试相同的 `EmbeddedRunAttemptParams`：

- `extensions/codex/src/app-server/run-attempt.ts`

这意味着所需的钩子点位于 OpenClaw 控制的代码中。外部边界是 Codex app-server 协议本身：OpenClaw 可以控制发送到 `thread/start`、`thread/resume` 和 `turn/start` 的内容，也可以观察通知，但不能更改 Codex 的内部线程存储或原生压缩器。

## 当前缺口

内置 OpenClaw 尝试会直接调用 context-engine 生命周期：

- 尝试前的 bootstrap/维护
- 模型调用前的组装
- 尝试后的 afterTurn 或 ingest
- 成功轮次后的维护
- 由引擎拥有压缩时的 context-engine 压缩

相关 OpenClaw 代码：

- `src/agents/embedded-agent-runner/run/attempt.ts`
- `src/agents/embedded-agent-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/embedded-agent-runner/context-engine-maintenance.ts`

Codex app-server 尝试目前会运行通用 agent-harness 钩子并镜像转录，但不会调用 `params.contextEngine.bootstrap`、`params.contextEngine.assemble`、`params.contextEngine.afterTurn`、`params.contextEngine.ingestBatch`、`params.contextEngine.ingest` 或 `params.contextEngine.maintain`。

相关 Codex 代码：

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## 期望行为

对于 Codex harness 轮次，OpenClaw 应保留以下生命周期：

1. 读取镜像的 OpenClaw 会话转录。
2. 当存在之前的会话文件时，bootstrap 活跃的上下文引擎。
3. 可用时运行 bootstrap 维护。
4. 使用活跃的上下文引擎组装上下文。
5. 将组装后的上下文转换为 Codex 兼容输入。
6. 使用包含任意 context-engine `systemPromptAddition` 的开发者指令启动或恢复 Codex 线程。
7. 使用组装后的面向用户提示启动 Codex 轮次。
8. 将 Codex 结果镜像回 OpenClaw 转录。
9. 如果已实现则调用 `afterTurn`，否则调用 `ingestBatch`/`ingest`，并使用镜像的转录快照。
10. 在成功且未中止的轮次后运行轮次维护。
11. 保留 Codex 原生压缩信号和 OpenClaw 压缩钩子。

## 设计约束

### Codex app-server 仍是原生线程状态的权威来源

Codex 拥有其原生线程和任何内部扩展历史。OpenClaw 不应尝试修改 app-server 的内部历史，除非通过受支持的协议调用。

OpenClaw 的转录镜像仍是 OpenClaw 功能的来源：

- 聊天历史
- 搜索
- `/new` 和 `/reset` 记账
- 未来的模型或 harness 切换
- context-engine 插件状态

### 上下文引擎组装必须投影到 Codex 输入中

context-engine 接口返回 OpenClaw `AgentMessage[]`，而不是 Codex 线程补丁。Codex app-server `turn/start` 接受当前用户输入，而 `thread/start` 和 `thread/resume` 接受开发者指令。

因此，实现需要一个投影层。安全的第一个版本应避免假装它可以替换 Codex 内部历史。它应围绕当前轮次，将组装后的上下文作为确定性的提示/开发者指令材料注入。

### 提示缓存稳定性很重要

对于 lossless-claw 等引擎，组装后的上下文在输入不变时应是确定性的。不要向生成的上下文文本添加时间戳、随机 ID 或非确定性排序。

### 运行时选择语义不变

Harness 选择保持现状：

- `runtime: "openclaw"` 选择内置 OpenClaw harness
- `runtime: "codex"` 选择已注册的 Codex harness
- `runtime: "auto"` 允许插件 harness 声明支持的提供商
- 未匹配的 `auto` 运行使用内置 OpenClaw harness

这项工作会更改 Codex harness 被选中之后发生的行为。

## 实施计划

### 1. 导出或迁移可复用的 context-engine 尝试辅助函数

目前，可复用的生命周期辅助函数位于嵌入式智能体运行器下：

- `src/agents/embedded-agent-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/embedded-agent-runner/run/attempt.prompt-helpers.ts`
- `src/agents/embedded-agent-runner/context-engine-maintenance.ts`

Codex 应导入 harness 中立的辅助函数，而不是触及运行器实现细节。

创建一个 harness 中立模块，例如：

- `src/agents/harness/context-engine-lifecycle.ts`

移动或重新导出：

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- 围绕 `runContextEngineMaintenance` 的小包装器

在同一个 PR 中更新内置 harness 调用点。

中立辅助函数名称不应提到内置 harness。

建议名称：

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. 添加 Codex 上下文投影辅助函数

添加新模块：

- `extensions/codex/src/app-server/context-engine-projection.ts`

职责：

- 接受组装后的 `AgentMessage[]`、原始镜像历史和当前提示。
- 判断哪些上下文属于开发者指令，哪些属于当前用户输入。
- 将当前用户提示保留为最终可执行请求。
- 以稳定、显式的格式渲染先前消息。
- 避免易变元数据。

建议 API：

```ts
export type CodexContextProjection = {
  developerInstructionAddition?: string;
  promptText: string;
  assembledMessages: AgentMessage[];
  prePromptMessageCount: number;
};

export function projectContextEngineAssemblyForCodex(params: {
  assembledMessages: AgentMessage[];
  originalHistoryMessages: AgentMessage[];
  prompt: string;
  systemPromptAddition?: string;
}): CodexContextProjection;
```

建议的首版投影：

- 将 `systemPromptAddition` 放入开发者指令。
- 将组装后的转录上下文放在 `promptText` 中当前提示之前。
- 清晰标注为 OpenClaw 组装上下文。
- 保持当前提示在最后。
- 如果当前用户提示已经出现在尾部，则排除重复项。

示例提示形态：

```text
OpenClaw assembled context for this turn:

<conversation_context>
[user]
...

[assistant]
...
</conversation_context>

Current user request:
...
```

这不如原生 Codex 历史手术优雅，但可以在 OpenClaw 内部实现，并保留 context-engine 语义。

未来改进：如果 Codex app-server 暴露用于替换或补充线程历史的协议，则将此投影层切换为使用该 API。

### 3. 在 Codex 线程启动前接入 bootstrap

在 `extensions/codex/src/app-server/run-attempt.ts` 中：

- 像现在一样读取镜像的会话历史。
- 判断会话文件在本次运行前是否已存在。优先使用在镜像写入前检查 `fs.stat(params.sessionFile)` 的辅助函数。
- 打开 `SessionManager`，或者在辅助函数需要时使用窄会话管理器适配器。
- 当 `params.contextEngine` 存在时，调用中立 bootstrap 辅助函数。

伪流程：

```ts
const hadSessionFile = await fileExists(params.sessionFile);
const sessionManager = SessionManager.open(params.sessionFile);
const historyMessages = sessionManager.buildSessionContext().messages;

await bootstrapHarnessContextEngine({
  hadSessionFile,
  contextEngine: params.contextEngine,
  sessionId: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  sessionManager,
  runtimeContext: buildHarnessContextEngineRuntimeContext(...),
  runMaintenance: runHarnessContextEngineMaintenance,
  warn,
});
```

使用与 Codex 工具桥和转录镜像相同的 `sessionKey` 约定。目前 Codex 从 `params.sessionKey` 或 `params.sessionId` 计算 `sandboxSessionKey`；除非有理由保留原始 `params.sessionKey`，否则一致使用它。

### 4. 在 `thread/start` / `thread/resume` 和 `turn/start` 前接入 assemble

在 `runCodexAppServerAttempt` 中：

1. 先构建动态工具，让上下文引擎看到实际可用的工具名称。
2. 读取镜像的会话历史。
3. 当 `params.contextEngine` 存在时，运行 context-engine `assemble(...)`。
4. 将组装结果投影为：
   - 开发者指令补充
   - 用于 `turn/start` 的提示文本

现有钩子调用：

```ts
resolveAgentHarnessBeforePromptBuildResult({
  prompt: params.prompt,
  developerInstructions: buildDeveloperInstructions(params),
  messages: historyMessages,
  ctx: hookContext,
});
```

应变为上下文感知：

1. 使用 `buildDeveloperInstructions(params)` 计算基础开发者指令
2. 应用 context-engine 组装/投影
3. 使用投影后的提示/开发者指令运行 `before_prompt_build`

此顺序让通用提示钩子看到 Codex 将接收的同一提示。如果需要严格的 OpenClaw 一致性，请在钩子组合前运行 context-engine 组装，因为内置 harness 会在其提示流水线之后，将 context-engine `systemPromptAddition` 应用到最终系统提示。重要不变式是上下文引擎和钩子都获得一个确定性且有文档说明的顺序。

建议的首版实现顺序：

1. `buildDeveloperInstructions(params)`
2. context-engine `assemble()`
3. 将 `systemPromptAddition` 追加/前置到开发者指令
4. 将组装后的消息投影到提示文本
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. 将最终开发者指令传给 `startOrResumeThread(...)`
7. 将最终提示文本传给 `buildTurnStartParams(...)`

该规范应编码进测试，以免未来变更意外重新排序。

### 5. 保留提示缓存稳定格式

投影辅助函数必须对相同输入生成字节稳定的输出：

- 稳定的消息顺序
- 稳定的角色标签
- 无生成的时间戳
- 无对象键顺序泄漏
- 无随机分隔符
- 无每次运行 ID

使用固定分隔符和显式分区。

### 6. 在转录镜像后接入轮次后逻辑

Codex 的 `CodexAppServerEventProjector` 会为当前轮次构建一个本地 `messagesSnapshot`。`mirrorTranscriptBestEffort(...)` 会把该快照写入 OpenClaw transcript mirror。

无论镜像成功还是失败，都要用最佳可用消息快照调用 context-engine finalizer：

- 优先使用写入后的完整镜像会话上下文，因为 `afterTurn`
  需要的是会话快照，而不只是当前轮次。
- 如果无法重新打开会话文件，则回退到 `historyMessages + result.messagesSnapshot`。

伪流程：

```ts
const prePromptMessageCount = historyMessages.length;
await mirrorTranscriptBestEffort(...);
const finalMessages = readMirroredSessionHistoryMessages(params.sessionFile)
  ?? [...historyMessages, ...result.messagesSnapshot];

await finalizeHarnessContextEngineTurn({
  contextEngine: params.contextEngine,
  promptError: Boolean(finalPromptError),
  aborted: finalAborted,
  yieldAborted,
  sessionIdUsed: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  messagesSnapshot: finalMessages,
  prePromptMessageCount,
  tokenBudget: params.contextTokenBudget,
  runtimeContext: buildHarnessContextEngineRuntimeContextFromUsage({
    attempt: params,
    workspaceDir: effectiveWorkspace,
    agentDir,
    tokenBudget: params.contextTokenBudget,
    lastCallUsage: result.attemptUsage,
    promptCache: result.promptCache,
  }),
  runMaintenance: runHarnessContextEngineMaintenance,
  sessionManager,
  warn,
});
```

如果镜像失败，仍然要使用回退快照调用 `afterTurn`，但要记录日志说明上下文引擎正在从回退轮次数据摄取。

### 7. 规范化用量和 prompt-cache 运行时上下文

Codex 结果会在可用时包含来自 app-server token 通知的规范化用量。将该用量传入上下文引擎运行时上下文。

如果 Codex app-server 最终暴露缓存读写详情，请将其映射到 `ContextEnginePromptCacheInfo`。在此之前，应省略 `promptCache`，而不是编造零值。

### 8. 压缩策略

存在两个压缩系统：

1. OpenClaw 上下文引擎 `compact()`
2. Codex app-server 原生 `thread/compact/start`

不要静默混淆它们。

#### `/compact` 和显式 OpenClaw 压缩

当所选上下文引擎的 `info.ownsCompaction === true` 时，显式 OpenClaw 压缩应优先使用上下文引擎的 `compact()` 结果，用于 OpenClaw transcript mirror 和插件状态。

当所选 Codex harness 有原生线程绑定时，我们还可以额外请求 Codex 原生压缩，以保持 app-server 线程健康，但必须在详情中将其报告为单独的后端操作。

建议行为：

- 如果 `contextEngine.info.ownsCompaction === true`：
  - 先调用上下文引擎 `compact()`
  - 然后在存在线程绑定时尽力调用 Codex 原生压缩
  - 将上下文引擎结果作为主结果返回
  - 在 `details.codexNativeCompaction` 中包含 Codex 原生压缩状态
- 如果当前上下文引擎不拥有压缩：
  - 保留当前 Codex 原生压缩行为

这可能需要修改 `extensions/codex/src/app-server/compact.ts`，或从通用压缩路径对其进行包装，具体取决于 `maybeCompactAgentHarnessSession(...)` 的调用位置。

#### 轮次内 Codex 原生 contextCompaction 事件

Codex 可能会在轮次期间发出 `contextCompaction` item 事件。保留 `event-projector.ts` 中当前的压缩前/后钩子发出逻辑，但不要将其视为已完成的上下文引擎压缩。

对于拥有压缩的引擎，当 Codex 仍然执行原生压缩时，发出显式诊断：

- stream/event 名称：可接受现有 `compaction` stream
- 详情：`{ backend: "codex-app-server", ownsCompaction: true }`

这使两者的拆分可审计。

### 9. 会话重置和绑定行为

现有 Codex harness `reset(...)` 会从 OpenClaw 会话文件中清除 Codex app-server 绑定。保留该行为。

同时确保上下文引擎状态清理继续通过现有 OpenClaw 会话生命周期路径完成。除非上下文引擎生命周期当前对所有 harness 都遗漏了 reset/delete 事件，否则不要添加 Codex 专用清理。

### 10. 错误处理

遵循内置 OpenClaw 语义：

- bootstrap 失败时发出警告并继续
- assemble 失败时发出警告，并回退到未组装的流水线消息/prompt
- afterTurn/ingest 失败时发出警告，并将轮次后 finalization 标记为不成功
- maintenance 仅在成功、未中止、非 yield 的轮次后运行
- compaction 错误不应作为新 prompt 重试

Codex 专用补充：

- 如果上下文投影失败，发出警告并回退到原始 prompt。
- 如果 transcript mirror 失败，仍然尝试使用回退消息进行上下文引擎 finalization。
- 如果上下文引擎压缩成功后 Codex 原生压缩失败，当上下文引擎是主结果时，不要使整个 OpenClaw 压缩失败。

## 测试计划

### 单元测试

在 `extensions/codex/src/app-server` 下添加测试：

1. `run-attempt.context-engine.test.ts`
   - 存在会话文件时，Codex 调用 `bootstrap`。
   - Codex 使用镜像消息、token 预算、工具名称、citations 模式、模型 id 和 prompt 调用 `assemble`。
   - `systemPromptAddition` 会包含在 developer instructions 中。
   - 组装后的消息会在当前请求前投影到 prompt 中。
   - Codex 在 transcript mirroring 后调用 `afterTurn`。
   - 没有 `afterTurn` 时，Codex 调用 `ingestBatch` 或逐消息 `ingest`。
   - 成功轮次后运行轮次 maintenance。
   - prompt 错误、中止或 yield abort 时不运行轮次 maintenance。

2. `context-engine-projection.test.ts`
   - 相同输入产生稳定输出
   - 当组装历史已包含当前 prompt 时，不重复当前 prompt
   - 处理空历史
   - 保留角色顺序
   - 仅在 developer instructions 中包含 system prompt addition

3. `compact.context-engine.test.ts`
   - 拥有压缩的上下文引擎主结果获胜
   - 同时尝试 Codex 原生压缩时，其状态出现在详情中
   - Codex 原生失败不会使拥有压缩的上下文引擎压缩失败
   - 不拥有压缩的上下文引擎保留当前原生压缩行为

### 需要更新的现有测试

- `extensions/codex/src/app-server/run-attempt.test.ts`（如果存在），否则更新最近的 Codex app-server run 测试。
- 仅在压缩事件详情变化时更新 `extensions/codex/src/app-server/event-projector.test.ts`。
- 除非配置行为变化，否则 `src/agents/harness/selection.test.ts` 不应需要修改；它应保持稳定。
- 内置 harness 上下文引擎测试应继续原样通过。

### 集成 / live 测试

添加或扩展 live Codex harness smoke 测试：

- 将 `plugins.slots.contextEngine` 配置为测试引擎
- 将 `agents.defaults.model` 配置为 `codex/*` 模型
- 配置 provider/model `agentRuntime.id = "codex"`
- 断言测试引擎观察到：
  - bootstrap
  - assemble
  - afterTurn 或 ingest
  - maintenance

避免在 OpenClaw core 测试中要求 lossless-claw。使用一个小型仓库内 fake 上下文引擎插件。

## 可观测性

在 Codex 上下文引擎生命周期调用周围添加调试日志：

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` 并附带原因
- `codex native compaction completed alongside context-engine compaction`

避免记录完整 prompt 或 transcript 内容。

在有用的位置添加结构化字段：

- `sessionId`
- `sessionKey` 按照现有日志实践进行遮蔽或省略
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## 迁移 / 兼容性

这应该保持向后兼容：

- 如果未配置上下文引擎，legacy 上下文引擎行为应等同于当前 Codex harness 行为。
- 如果上下文引擎 `assemble` 失败，Codex 应继续使用原始 prompt 路径。
- 现有 Codex 线程绑定应保持有效。
- 动态工具指纹不应包含上下文引擎输出；否则每次上下文变化都可能强制创建新的 Codex 线程。只有工具目录应影响动态工具指纹。

## 未决问题

1. 组装后的上下文应该完全注入用户 prompt、完全注入 developer instructions，还是拆分？

   建议：拆分。将 `systemPromptAddition` 放入 developer instructions；将组装后的 transcript 上下文放入用户 prompt 包装器。这最符合当前 Codex 协议，同时不会改变原生线程历史。

2. 当上下文引擎拥有压缩时，是否应该禁用 Codex 原生压缩？

   建议：最初不要。Codex 原生压缩可能仍然是保持 app-server 线程存活所必需的。但必须将其报告为原生 Codex 压缩，而不是上下文引擎压缩。

3. `before_prompt_build` 应该在上下文引擎组装之前还是之后运行？

   建议：对于 Codex，在上下文引擎投影之后运行，这样通用 harness 钩子能看到 Codex 实际会接收的 prompt/developer instructions。如果内置 harness 对等性要求相反顺序，请在测试中编码所选顺序，并在此处记录。

4. Codex app-server 未来是否可以接受结构化 context/history override？

   未知。如果可以，请用该协议替换文本投影层，并保持生命周期调用不变。

## 验收标准

- 一个 `codex/*` 嵌入式 harness 轮次会调用所选上下文引擎的 assemble 生命周期。
- 上下文引擎的 `systemPromptAddition` 会影响 Codex developer instructions。
- 组装后的上下文以确定性方式影响 Codex 轮次输入。
- 成功的 Codex 轮次会调用 `afterTurn` 或 ingest 回退。
- 成功的 Codex 轮次会运行上下文引擎轮次 maintenance。
- 失败/中止/yield-aborted 轮次不会运行轮次 maintenance。
- 上下文引擎拥有的压缩仍然是 OpenClaw/plugin 状态的主结果。
- Codex 原生压缩仍然可作为原生 Codex 行为进行审计。
- 现有内置 harness 上下文引擎行为保持不变。
- 当没有选择非 legacy 上下文引擎或组装失败时，现有 Codex harness 行为保持不变。
