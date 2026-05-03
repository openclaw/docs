---
read_when:
    - 你正在将 context-engine 生命周期行为接入 Codex harness
    - 你需要 lossless-claw 或其他 context-engine 插件，才能使用 codex/* 嵌入式 harness 会话
    - 你正在比较嵌入式 PI 和 Codex 应用服务器的上下文行为
summary: 让内置的 Codex app-server harness 支持 OpenClaw 上下文引擎插件的规范
title: Codex Harness Context Engine Port
x-i18n:
    generated_at: "2026-05-03T04:51:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6575c25973d43c04cada6157e39c52ea5ad1cc60171cf801fe36cbb9c54c9237
    source_path: plan/codex-context-engine-harness.md
    workflow: 16
---

## Status

草案实现规范。

## 目标

让内置的 Codex 应用服务器运行框架遵循与嵌入式 PI 回合已经遵循的相同 OpenClaw 上下文引擎生命周期契约。

使用 `agents.defaults.embeddedHarness.runtime: "codex"` 或 `codex/*` 模型的会话，仍应让所选上下文引擎插件（例如 `lossless-claw`）在 Codex 应用服务器边界允许的范围内控制上下文组装、回合后摄取、维护，以及 OpenClaw 级别的压缩策略。

## 非目标

- 不重新实现 Codex 应用服务器内部机制。
- 不让 Codex 原生线程压缩生成 `lossless-claw` 摘要。
- 不要求非 Codex 模型使用 Codex harness。
- 不改变 ACP/acpx 会话行为。本规范仅适用于非 ACP 嵌入式智能体运行框架路径。
- 不让第三方插件注册 Codex 应用服务器扩展工厂；现有内置插件信任边界保持不变。

## 当前架构

嵌入式运行循环会在每次运行中先解析已配置的上下文引擎，然后再选择具体的底层运行框架：

- `src/agents/pi-embedded-runner/run.ts`
  - 初始化上下文引擎插件
  - 调用 `resolveContextEngine(params.config)`
  - 将 `contextEngine` 和 `contextTokenBudget` 传入 `runEmbeddedAttemptWithBackend(...)`

`runEmbeddedAttemptWithBackend(...)` 会委托给所选的智能体运行框架：

- `src/agents/pi-embedded-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

Codex 应用服务器运行框架由内置 Codex 插件注册：

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

Codex harness 实现接收与 PI 支持的尝试相同的 `EmbeddedRunAttemptParams`：

- `extensions/codex/src/app-server/run-attempt.ts`

这意味着所需的钩子点位于 OpenClaw 控制的代码中。外部边界是 Codex 应用服务器协议本身：OpenClaw 可以控制发送给 `thread/start`、`thread/resume` 和 `turn/start` 的内容，也可以观察通知，但不能更改 Codex 的内部线程存储或原生压缩器。

## 当前缺口

嵌入式 PI 尝试会直接调用上下文引擎生命周期：

- 尝试前的启动引导/维护
- 模型调用前的组装
- 尝试后的 `afterTurn` 或摄取
- 成功回合后的维护
- 由引擎自主管理压缩时的上下文引擎压缩

相关 PI 代码：

- `src/agents/pi-embedded-runner/run/attempt.ts`
- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Codex 应用服务器尝试目前会运行通用智能体运行框架钩子并镜像转录记录，但不会调用 `params.contextEngine.bootstrap`、`params.contextEngine.assemble`、`params.contextEngine.afterTurn`、`params.contextEngine.ingestBatch`、`params.contextEngine.ingest` 或 `params.contextEngine.maintain`。

相关 Codex 代码：

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## 期望行为

对于 Codex harness 回合，OpenClaw 应保留此生命周期：

1. 读取镜像的 OpenClaw 会话转录记录。
2. 当存在先前的会话文件时，启动引导当前上下文引擎。
3. 在可用时运行启动引导维护。
4. 使用当前上下文引擎组装上下文。
5. 将已组装的上下文转换为 Codex 兼容输入。
6. 使用包含任何上下文引擎 `systemPromptAddition` 的开发者指令来启动或恢复 Codex 线程。
7. 使用已组装的面向用户提示启动 Codex 回合。
8. 将 Codex 结果镜像回 OpenClaw 转录记录。
9. 如果实现了 `afterTurn`，则调用它；否则使用镜像的转录记录快照调用 `ingestBatch`/`ingest`。
10. 在成功且未中止的回合后运行回合维护。
11. 保留 Codex 原生压缩信号和 OpenClaw 压缩钩子。

## 设计约束

### Codex 应用服务器仍是原生线程状态的权威来源

Codex 拥有其原生线程和任何内部扩展历史。OpenClaw 不应尝试通过受支持协议调用之外的方式修改应用服务器的内部历史。

OpenClaw 的转录记录镜像仍是 OpenClaw 功能的来源：

- 聊天历史
- 搜索
- `/new` 和 `/reset` 记账
- 未来模型或运行框架切换
- 上下文引擎插件状态

### 上下文引擎组装必须投射到 Codex 输入

上下文引擎接口返回 OpenClaw `AgentMessage[]`，而不是 Codex 线程补丁。Codex 应用服务器 `turn/start` 接受当前用户输入，而 `thread/start` 和 `thread/resume` 接受开发者指令。

因此实现需要一个投射层。安全的首版应避免假装可以替换 Codex 内部历史。它应围绕当前回合，将已组装上下文作为确定性的提示/开发者指令材料注入。

### 提示缓存稳定性很重要

对于 `lossless-claw` 这样的引擎，在输入不变时，已组装上下文应是确定性的。不要向生成的上下文文本添加时间戳、随机 ID 或不确定排序。

### 运行时选择语义不变

运行框架选择保持现状：

- `runtime: "pi"` 强制使用 PI
- `runtime: "codex"` 选择已注册的 Codex harness
- `runtime: "auto"` 允许插件运行框架声明支持的提供商
- 未匹配的 `auto` 运行使用 PI

此项工作改变的是选择 Codex harness 之后发生的事情。

## 实现计划

### 1. 导出或迁移可复用的上下文引擎尝试辅助函数

目前可复用的生命周期辅助函数位于 PI runner 下：

- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/run/attempt.prompt-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

如果可以避免，Codex 不应从名称暗示 PI 的实现路径导入。

创建一个与运行框架无关的模块，例如：

- `src/agents/harness/context-engine-lifecycle.ts`

移动或重新导出：

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- 围绕 `runContextEngineMaintenance` 的小型包装器

保持 PI 导入可用，可以通过从旧文件重新导出，或在同一个 PR 中更新 PI 调用点。

中立辅助函数名称不应提到 PI。

建议名称：

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. 添加 Codex 上下文投射辅助函数

添加新模块：

- `extensions/codex/src/app-server/context-engine-projection.ts`

职责：

- 接收已组装的 `AgentMessage[]`、原始镜像历史和当前提示。
- 判断哪些上下文属于开发者指令，哪些属于当前用户输入。
- 将当前用户提示保留为最终可执行请求。
- 以稳定、明确的格式渲染先前消息。
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

建议的首版投射：

- 将 `systemPromptAddition` 放入开发者指令。
- 将已组装的转录记录上下文放在 `promptText` 中当前提示之前。
- 清晰标注为 OpenClaw 已组装上下文。
- 保持当前提示位于最后。
- 如果当前用户提示已经出现在末尾，则排除重复项。

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

这不如原生 Codex 历史手术优雅，但它可在 OpenClaw 内部实现，并保留上下文引擎语义。

未来改进：如果 Codex 应用服务器公开用于替换或补充线程历史的协议，则将此投射层切换为使用该 API。

### 3. 在 Codex 线程启动前接入启动引导

在 `extensions/codex/src/app-server/run-attempt.ts` 中：

- 像现在一样读取镜像的会话历史。
- 判断会话文件在此次运行前是否存在。优先使用在镜像写入前检查 `fs.stat(params.sessionFile)` 的辅助函数。
- 打开 `SessionManager`，或在辅助函数需要时使用窄会话管理器适配器。
- 当 `params.contextEngine` 存在时，调用中立启动引导辅助函数。

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

使用与 Codex 工具桥接和转录记录镜像相同的 `sessionKey` 约定。如今 Codex 会从 `params.sessionKey` 或 `params.sessionId` 计算 `sandboxSessionKey`；除非有理由保留原始 `params.sessionKey`，否则应一致使用它。

### 4. 在 `thread/start` / `thread/resume` 和 `turn/start` 之前接入组装

在 `runCodexAppServerAttempt` 中：

1. 先构建动态工具，让上下文引擎看到实际可用的工具名称。
2. 读取镜像的会话历史。
3. 当 `params.contextEngine` 存在时，运行上下文引擎 `assemble(...)`。
4. 将已组装结果投射到：
   - 开发者指令追加内容
   - `turn/start` 的提示文本

现有钩子调用：

```ts
resolveAgentHarnessBeforePromptBuildResult({
  prompt: params.prompt,
  developerInstructions: buildDeveloperInstructions(params),
  messages: historyMessages,
  ctx: hookContext,
});
```

应变为感知上下文：

1. 使用 `buildDeveloperInstructions(params)` 计算基础开发者指令
2. 应用上下文引擎组装/投射
3. 使用已投射的提示/开发者指令运行 `before_prompt_build`

此顺序让通用提示钩子看到与 Codex 将接收内容相同的提示。如果需要严格 PI 对齐，则在钩子组合前运行上下文引擎组装，因为 PI 会在其提示流水线之后将上下文引擎 `systemPromptAddition` 应用于最终系统提示。重要不变式是：上下文引擎和钩子都获得确定性且有文档说明的顺序。

建议首版实现顺序：

1. `buildDeveloperInstructions(params)`
2. 上下文引擎 `assemble()`
3. 将 `systemPromptAddition` 追加/前置到开发者指令
4. 将已组装消息投射到提示文本
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. 将最终开发者指令传给 `startOrResumeThread(...)`
7. 将最终提示文本传给 `buildTurnStartParams(...)`

该规范应编码进测试，避免未来更改意外重排顺序。

### 5. 保留提示缓存稳定格式

投射辅助函数必须对相同输入生成字节稳定输出：

- 稳定消息顺序
- 稳定角色标签
- 无生成时间戳
- 无对象键顺序泄漏
- 无随机分隔符
- 无每次运行 ID

使用固定分隔符和明确分区。

### 6. 在转录记录镜像后接入回合后处理

Codex 的 `CodexAppServerEventProjector` 会为当前轮次构建本地 `messagesSnapshot`。`mirrorTranscriptBestEffort(...)` 会把该快照写入 OpenClaw 转录镜像。

镜像写入成功或失败后，使用可用的最佳消息快照调用上下文引擎终结器：

- 优先使用写入后的完整镜像会话上下文，因为 `afterTurn` 期望的是会话快照，而不仅是当前轮次。
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

如果镜像写入失败，仍然使用回退快照调用 `afterTurn`，但要记录上下文引擎正在从回退轮次数据摄取。

### 7. 规范化用量和提示缓存运行时上下文

Codex 结果会在可用时包含来自应用服务器令牌通知的规范化用量。将该用量传入上下文引擎运行时上下文。

如果 Codex 应用服务器最终公开缓存读写详情，请将其映射到 `ContextEnginePromptCacheInfo`。在此之前，省略 `promptCache`，不要编造零值。

### 8. 压缩策略

有两个压缩系统：

1. OpenClaw 上下文引擎 `compact()`
2. Codex 应用服务器原生 `thread/compact/start`

不要悄悄把它们混为一谈。

#### `/compact` 和显式 OpenClaw 压缩

当所选上下文引擎的 `info.ownsCompaction === true` 时，显式 OpenClaw 压缩应优先把上下文引擎的 `compact()` 结果用于 OpenClaw 转录镜像和插件状态。

当所选 Codex harness 具有原生线程绑定时，我们还可以额外请求 Codex 原生压缩，以保持应用服务器线程健康，但这必须在详情中报告为单独的后端操作。

推荐行为：

- 如果 `contextEngine.info.ownsCompaction === true`：
  - 先调用上下文引擎 `compact()`
  - 然后在存在线程绑定时尽力调用 Codex 原生压缩
  - 将上下文引擎结果作为主结果返回
  - 在 `details.codexNativeCompaction` 中包含 Codex 原生压缩状态
- 如果活动上下文引擎不拥有压缩：
  - 保留当前 Codex 原生压缩行为

这可能需要修改 `extensions/codex/src/app-server/compact.ts`，或从通用压缩路径对其进行封装，具体取决于 `maybeCompactAgentHarnessSession(...)` 的调用位置。

#### 轮次内 Codex 原生 `contextCompaction` 事件

Codex 可能会在轮次期间发出 `contextCompaction` 条目事件。保留 `event-projector.ts` 中当前的压缩前/后钩子发出逻辑，但不要把它视为已完成的上下文引擎压缩。

对于拥有压缩的引擎，当 Codex 仍然执行原生压缩时，发出显式诊断：

- 流/事件名称：可以使用现有 `compaction` 流
- 详情：`{ backend: "codex-app-server", ownsCompaction: true }`

这使两者的拆分可审计。

### 9. 会话重置和绑定行为

现有 Codex harness 的 `reset(...)` 会从 OpenClaw 会话文件中清除 Codex 应用服务器绑定。保留该行为。

还要确保上下文引擎状态清理继续通过现有 OpenClaw 会话生命周期路径进行。除非当前上下文引擎生命周期对所有 harness 都遗漏了重置/删除事件，否则不要添加 Codex 专属清理逻辑。

### 10. 错误处理

遵循 PI 语义：

- 启动失败时警告并继续
- 组装失败时警告，并回退到未组装的管线消息/提示
- `afterTurn`/摄取失败时警告，并标记轮次后终结不成功
- 维护仅在成功、非中止、非让出中止的轮次后运行
- 压缩错误不应作为新提示重试

Codex 专属补充：

- 如果上下文投影失败，警告并回退到原始提示。
- 如果转录镜像失败，仍然尝试使用回退消息进行上下文引擎终结。
- 如果上下文引擎压缩成功后 Codex 原生压缩失败，当上下文引擎是主系统时，不要让整个 OpenClaw 压缩失败。

## 测试计划

### 单元测试

在 `extensions/codex/src/app-server` 下添加测试：

1. `run-attempt.context-engine.test.ts`
   - 存在会话文件时，Codex 调用 `bootstrap`。
   - Codex 使用镜像消息、令牌预算、工具名称、引用模式、模型 ID 和提示调用 `assemble`。
   - `systemPromptAddition` 被包含在开发者指令中。
   - 组装后的消息会在当前请求前投影到提示中。
   - Codex 在转录镜像后调用 `afterTurn`。
   - 没有 `afterTurn` 时，Codex 调用 `ingestBatch` 或逐条消息的 `ingest`。
   - 轮次维护在成功轮次后运行。
   - 轮次维护不会在提示错误、中止或让出中止时运行。

2. `context-engine-projection.test.ts`
   - 相同输入的输出稳定
   - 当组装历史已经包含当前提示时，不重复当前提示
   - 处理空历史
   - 保留角色顺序
   - 仅在开发者指令中包含系统提示补充

3. `compact.context-engine.test.ts`
   - 拥有压缩的上下文引擎主结果胜出
   - 同时尝试 Codex 原生压缩时，其状态会出现在详情中
   - Codex 原生失败不会导致拥有压缩的上下文引擎压缩失败
   - 不拥有压缩的上下文引擎保留当前原生压缩行为

### 需要更新的现有测试

- 如存在，更新 `extensions/codex/src/app-server/run-attempt.test.ts`；否则更新最近的 Codex 应用服务器运行测试。
- 仅在压缩事件详情变化时更新 `extensions/codex/src/app-server/event-projector.test.ts`。
- 除非配置行为变化，否则 `src/agents/harness/selection.test.ts` 不应需要修改；它应保持稳定。
- PI 上下文引擎测试应继续原样通过。

### 集成 / 现场测试

添加或扩展现场 Codex harness 冒烟测试：

- 将 `plugins.slots.contextEngine` 配置为测试引擎
- 将 `agents.defaults.model` 配置为 `codex/*` 模型
- 配置 `agents.defaults.embeddedHarness.runtime = "codex"`
- 断言测试引擎观察到：
  - bootstrap
  - assemble
  - afterTurn 或 ingest
  - maintenance

避免在 OpenClaw 核心测试中要求 lossless-claw。使用一个小型仓库内伪上下文引擎插件。

## 可观测性

在 Codex 上下文引擎生命周期调用周围添加调试日志：

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped`，带原因
- `codex native compaction completed alongside context-engine compaction`

避免记录完整提示或转录内容。

在有用的地方添加结构化字段：

- `sessionId`
- `sessionKey` 按现有日志实践脱敏或省略
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## 迁移 / 兼容性

这应当向后兼容：

- 如果未配置上下文引擎，旧版上下文引擎行为应等同于当前 Codex harness 行为。
- 如果上下文引擎 `assemble` 失败，Codex 应继续使用原始提示路径。
- 现有 Codex 线程绑定应保持有效。
- 动态工具指纹不应包含上下文引擎输出；否则每次上下文变化都可能强制创建新的 Codex 线程。只有工具目录应影响动态工具指纹。

## 未决问题

1. 组装后的上下文应完全注入用户提示、完全注入开发者指令，还是拆分？

   建议：拆分。将 `systemPromptAddition` 放入开发者指令；将组装后的转录上下文放入用户提示包装器。这最符合当前 Codex 协议，且不会改变原生线程历史。

2. 当上下文引擎拥有压缩时，是否应禁用 Codex 原生压缩？

   建议：一开始不要。Codex 原生压缩可能仍然是保持应用服务器线程存活所必需的。但必须将其报告为原生 Codex 压缩，而不是上下文引擎压缩。

3. `before_prompt_build` 应在上下文引擎组装之前还是之后运行？

   建议：对于 Codex，在上下文引擎投影之后运行，这样通用 harness 钩子能看到 Codex 实际会收到的提示/开发者指令。如果 PI 对等性要求相反顺序，请在测试中编码所选顺序，并在此处记录。

4. Codex 应用服务器未来能否接受结构化上下文/历史覆盖？

   未知。如果可以，用该协议替换文本投影层，并保持生命周期调用不变。

## 验收标准

- `codex/*` embedded harness 轮次会调用所选上下文引擎的组装生命周期。
- 上下文引擎的 `systemPromptAddition` 会影响 Codex 开发者指令。
- 组装后的上下文会确定性地影响 Codex 轮次输入。
- 成功的 Codex 轮次会调用 `afterTurn` 或摄取回退。
- 成功的 Codex 轮次会运行上下文引擎轮次维护。
- 失败/中止/让出中止的轮次不会运行轮次维护。
- 上下文引擎拥有的压缩仍然是 OpenClaw/插件状态的主结果。
- Codex 原生压缩仍可作为原生 Codex 行为审计。
- 现有 PI 上下文引擎行为不变。
- 当未选择非旧版上下文引擎或组装失败时，现有 Codex harness 行为不变。
