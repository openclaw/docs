---
read_when:
    - 你想了解 OpenClaw 如何组装模型上下文
    - 你正在旧版引擎和插件引擎之间切换
    - 你正在构建上下文引擎插件
sidebarTitle: Context engine
summary: Context engine：可插拔上下文组装、压缩和子智能体生命周期
title: 上下文引擎
x-i18n:
    generated_at: "2026-07-05T11:13:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2649dea456f271421aa64022abb00663ccf71e0afd5e11ecbbee7aa30338fd53
    source_path: concepts/context-engine.md
    workflow: 16
---

**上下文引擎**控制 OpenClaw 如何为每次运行构建模型上下文：包含哪些消息、如何总结较早的历史记录，以及如何跨子智能体边界管理上下文。

OpenClaw 内置 `legacy` 引擎，并默认使用它。只有当你需要不同的组装、压缩或跨会话回忆行为时，才安装并选择插件引擎。

## 快速开始

<Steps>
  <Step title="检查当前启用的引擎">
    ```bash
    openclaw doctor
    # or inspect config directly:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="安装插件引擎">
    上下文引擎插件的安装方式与其他 OpenClaw 插件相同。

    <Tabs>
      <Tab title="从 npm 安装">
        ```bash
        openclaw plugins install @martian-engineering/lossless-claw
        ```
      </Tab>
      <Tab title="从本地路径安装">
        ```bash
        openclaw plugins install -l ./my-context-engine
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="启用并选择引擎">
    ```json5
    // openclaw.json
    {
      plugins: {
        slots: {
          contextEngine: "lossless-claw", // must match the plugin's registered engine id
        },
        entries: {
          "lossless-claw": {
            enabled: true,
            // Plugin-specific config goes here (see the plugin's docs)
          },
        },
      },
    }
    ```

    安装并配置后，重启 Gateway 网关。

  </Step>
  <Step title="切回 legacy（可选）">
    将 `contextEngine` 设置为 `"legacy"`（或完全移除该键 - `"legacy"` 是默认值）。
  </Step>
</Steps>

## 工作原理

每次 OpenClaw 运行模型提示词时，上下文引擎都会参与四个生命周期点：

<AccordionGroup>
  <Accordion title="1. 摄取">
    在新消息被添加到会话时调用。引擎可以将消息存储或索引到自己的数据存储中。
  </Accordion>
  <Accordion title="2. 组装">
    在每次模型运行前调用。引擎会返回一组有序消息（以及可选的 `systemPromptAddition`），这些内容需适配 token 预算。
  </Accordion>
  <Accordion title="3. 压缩">
    在上下文窗口已满，或用户运行 `/compact` 时调用。引擎会总结较早的历史记录以释放空间。
  </Accordion>
  <Accordion title="4. 轮次后">
    在一次运行完成后调用。引擎可以持久化状态、触发后台压缩，或更新索引。
  </Accordion>
</AccordionGroup>

引擎也可以实现可选的 `maintain()` 方法，用于在引导启动、成功轮次或压缩之后进行转录维护（通过 `runtimeContext.rewriteTranscriptEntries()` 安全重写）。设置 `info.turnMaintenanceMode: "background"` 可将其作为延迟工作运行，而不是阻塞回复。

对于内置的非 ACP Codex harness，OpenClaw 会通过将已组装上下文投射到 Codex 开发者指令和当前轮次提示词中来应用相同生命周期。Codex 仍然拥有其原生线程历史记录和原生压缩器。

### 子智能体生命周期（可选）

OpenClaw 会调用两个可选的子智能体生命周期钩子：

<ParamField path="prepareSubagentSpawn" type="method">
  在子运行开始前准备共享上下文状态。该钩子会接收父/子会话键、`contextMode`（`isolated` 或 `fork`）、可用转录 id/文件，以及可选 TTL。如果它返回回滚句柄，当准备成功后生成失败时，OpenClaw 会调用该句柄。请求 `lightContext` 并解析为 `contextMode="isolated"` 的原生子智能体生成会有意跳过此钩子，这样子智能体就会从轻量级引导上下文开始，而不带由上下文引擎管理的生成前状态。
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  在子智能体会话完成或被清扫时清理。
</ParamField>

### 系统提示词追加内容

`assemble` 方法可以返回一个 `systemPromptAddition` 字符串。OpenClaw 会将其前置到本次运行的系统提示词中。这让引擎可以注入动态回忆指导、检索指令或上下文感知提示，而无需静态工作区文件。

## legacy 引擎

内置的 `legacy` 引擎保留了 OpenClaw 的原始行为：

- **摄取**：无操作（会话管理器直接处理消息持久化）。
- **组装**：透传（运行时中现有的清理 → 校验 → 限制管线处理上下文组装）。
- **压缩**：委托给内置的摘要压缩，它会为较早消息创建一份摘要，并保持最近消息不变。
- **轮次后**：无操作。

legacy 引擎不会注册工具，也不会提供 `systemPromptAddition`。

当未设置 `plugins.slots.contextEngine`（或它被设置为 `"legacy"`）时，会自动使用此引擎。

## 插件引擎

插件可以使用插件 API 注册上下文引擎：

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function register(api) {
  api.registerContextEngine("my-engine", (ctx) => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // Store the message in your data store
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget, availableTools, citationsMode }) {
      // Return messages that fit the budget
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },

    async compact({ sessionId, force }) {
      // Summarize older context
      return { ok: true, compacted: true };
    },
  }));
}
```

工厂 `ctx` 包含可选的 `config`、`agentDir` 和 `workspaceDir`
值，因此插件可以在第一个生命周期钩子运行前初始化每智能体或每工作区状态。

然后在配置中启用它：

```json5
{
  plugins: {
    slots: {
      contextEngine: "my-engine",
    },
    entries: {
      "my-engine": {
        enabled: true,
      },
    },
  },
}
```

### ContextEngine 接口

必需成员：

| 成员               | 类型     | 用途                                                     |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | 属性     | 引擎 id、名称、版本，以及它是否拥有压缩                  |
| `ingest(params)`   | 方法     | 存储单条消息                                             |
| `assemble(params)` | 方法     | 为模型运行构建上下文（返回 `AssembleResult`）            |
| `compact(params)`  | 方法     | 总结/缩减上下文                                          |

`assemble` 返回包含以下内容的 `AssembleResult`：

<ParamField path="messages" type="Message[]" required>
  要发送给模型的有序消息。
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  引擎对已组装上下文中总 token 数的估算。OpenClaw 使用它进行压缩阈值决策和诊断报告。
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  前置到系统提示词中。
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  控制运行器在抢先溢出预检查中使用哪个 token 估算值。默认值为 `"assembled"`，这意味着对于不拥有压缩的引擎，只检查已组装提示词的估算值。设置 `ownsCompaction: true` 的引擎会管理自己的提示词准入，因此 OpenClaw 默认会跳过通用的提示词前预检查。只有当你的已组装视图可能隐藏底层转录中的溢出风险时，才设置 `"preassembly_may_overflow"`；随后运行器会保持通用预检查处于启用状态，并在决定是否抢先压缩时取已组装估算值与组装前（未窗口化）会话历史估算值中的最大值。无论哪种方式，你返回的消息仍然是模型看到的内容 - `promptAuthority` 只影响预检查。
</ParamField>
<ParamField path="contextProjection" type="ContextEngineProjection">
  面向具有持久后端线程的宿主（例如 Codex app-server）的可选投射生命周期。带有稳定 `epoch` 的 `mode: "thread_bootstrap"` 会要求宿主在每个 epoch 注入一次已组装上下文，并复用后端线程直到 epoch 变化，而不是每轮都重新投射。普通的每轮投射请省略此字段。
</ParamField>

`compact` 返回 `CompactResult`。当压缩轮转活动转录时，`result.sessionId` 和 `result.sessionFile` 会标识下一次重试或轮次必须使用的后继会话。

可选成员：

| 成员                           | 类型   | 用途                                                                                                                                         |
| ------------------------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | 方法   | 为会话初始化引擎状态。当引擎第一次看到会话时调用一次（例如导入历史记录）。                                                                   |
| `maintain(params)`             | 方法   | 在引导启动、成功轮次或压缩之后进行转录维护。使用 `runtimeContext.rewriteTranscriptEntries()` 进行安全重写。                                  |
| `ingestBatch(params)`          | 方法   | 将已完成轮次作为批次摄取。在一次运行完成后调用，一次性传入该轮次的所有消息。                                                                 |
| `afterTurn(params)`            | 方法   | 运行后的生命周期工作（持久化状态、触发后台压缩）。                                                                                           |
| `prepareSubagentSpawn(params)` | 方法   | 在子会话开始前设置共享状态。                                                                                                                 |
| `onSubagentEnded(params)`      | 方法   | 在子智能体结束后清理。                                                                                                                       |
| `dispose()`                    | 方法   | 释放资源。在 Gateway 网关关闭或插件重新加载期间调用 - 不是按会话调用。                                                                       |

### 运行时设置

在 OpenClaw 内部运行的生命周期钩子会接收一个可选的
`runtimeSettings` 对象。它是一个带版本、只读的内部
生产者/消费者 API 表面：OpenClaw 为所选上下文
引擎生成它，而上下文引擎会在生命周期钩子中使用它。它不会
直接渲染给用户，也不会创建专用报告表面。

- `schemaVersion`：当前为 `1`
- `runtime`：OpenClaw 宿主、运行时模式（`normal`、`fallback` 或
  `degraded`），以及可选的 harness/runtime id
- `contextEngineSelection`：所选上下文引擎 id 和选择来源
- `executionHost`：调用该钩子的表面的宿主 id 和标签
- `model`：请求的模型、解析后的模型、提供商，以及可选模型族
- `limits`：已知时的提示词 token 预算和最大输出 token 数
- `diagnostics`：已知时的闭合 fallback 和降级原因代码

可能未知的字段会表示为 `null`；运行时模式和选择来源等判别字段保持不可为空。较旧的引擎仍保持兼容：如果严格的 legacy 引擎将 `runtimeSettings` 作为未知属性拒绝，OpenClaw 会在不隔离该引擎的情况下，去掉它并重试生命周期调用。

### 宿主要求

上下文引擎可以在 `info.hostRequirements` 上声明宿主能力要求。
OpenClaw 会在启动操作前检查这些要求，并在所选运行时无法满足要求时以失败关闭方式退出，
同时给出描述性错误。

对于智能体运行，当引擎必须通过 `assemble()` 控制实际模型提示时，
请声明 `assemble-before-prompt`：

```ts
info: {
  id: "my-context-engine",
  name: "My Context Engine",
  hostRequirements: {
    "agent-run": {
      requiredCapabilities: ["assemble-before-prompt"],
      unsupportedMessage:
        "Use the native Codex or OpenClaw embedded runtime, or select the legacy context engine.",
    },
  },
}
```

Native Codex 和 OpenClaw 嵌入式智能体运行满足 `assemble-before-prompt`。
通用 CLI 后端不满足，因此需要该能力的引擎会在 CLI 进程启动前被拒绝。

### 故障隔离

OpenClaw 会将所选插件引擎与核心回复路径隔离。如果某个
非旧版引擎缺失、未通过契约校验、在工厂创建期间抛出异常，
或从生命周期方法抛出异常，OpenClaw 会在当前 Gateway 网关进程中隔离该引擎，
并将上下文引擎工作降级到内置的 `legacy` 引擎。错误会随失败操作一起记录到日志，
以便操作员在智能体不静默失效的情况下修复、更新或禁用该插件。

宿主要求失败则不同：当引擎声明某个运行时缺少必需能力时，
OpenClaw 会在启动运行前以失败关闭方式退出。这可以保护那些如果在不受支持的宿主中运行就会破坏状态的引擎。

### ownsCompaction

`ownsCompaction` 控制 OpenClaw 运行时内置的尝试内自动压缩是否在本次运行中保持启用：

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    引擎拥有压缩行为。OpenClaw 会为该次运行禁用 OpenClaw 运行时内置的自动压缩和通用的提示前溢出预检查，而引擎的 `compact()` 实现负责 `/compact`、提供商溢出恢复压缩，以及它想在 `afterTurn()` 中执行的任何主动压缩。当引擎从 `assemble()` 返回 `promptAuthority: "preassembly_may_overflow"` 时，OpenClaw 仍会运行提示前溢出保护。
  </Accordion>
  <Accordion title="ownsCompaction: false or unset">
    OpenClaw 运行时内置的自动压缩仍可能在提示执行期间运行，但当前引擎的 `compact()` 方法仍会用于 `/compact` 和溢出恢复。
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **不**表示 OpenClaw 会自动回退到旧版引擎的压缩路径。
</Warning>

这意味着有两种有效的插件模式：

<Tabs>
  <Tab title="Owning mode">
    实现你自己的压缩算法，并设置 `ownsCompaction: true`。
  </Tab>
  <Tab title="Delegating mode">
    设置 `ownsCompaction: false`，并让 `compact()` 调用 `openclaw/plugin-sdk/core` 中的 `delegateCompactionToRuntime(...)`，以使用 OpenClaw 的内置压缩行为。
  </Tab>
</Tabs>

对于一个处于活动状态的非自主管理引擎，空操作的 `compact()` 是不安全的，因为它会禁用该引擎槽位的正常 `/compact` 和溢出恢复压缩路径。

## 配置参考

```json5
{
  plugins: {
    slots: {
      // Select the active context engine. Default: "legacy".
      // Set to a plugin id to use a plugin engine.
      contextEngine: "legacy",
    },
  },
}
```

<Note>
该槽位在运行时是独占的 - 对于给定的运行或压缩操作，只会解析一个已注册的上下文引擎。其他已启用的 `kind: "context-engine"` 插件仍可以加载并运行其注册代码；`plugins.slots.contextEngine` 只选择当 OpenClaw 需要上下文引擎时要解析的已注册引擎 id。
</Note>

<Note>
**插件卸载：**当你卸载当前被选为 `plugins.slots.contextEngine` 的插件时，OpenClaw 会将该槽位重置回默认值（`legacy`）。同样的重置行为也适用于 `plugins.slots.memory`。无需手动编辑配置。
</Note>

## 与压缩和记忆的关系

<AccordionGroup>
  <Accordion title="Compaction">
    压缩是上下文引擎的一项职责。旧版引擎会委托给 OpenClaw 的内置摘要功能。插件引擎可以实现任何压缩策略（DAG 摘要、向量检索等）。
  </Accordion>
  <Accordion title="Memory plugins">
    记忆插件（`plugins.slots.memory`）与上下文引擎是分离的。记忆插件提供搜索/检索；上下文引擎控制模型看到的内容。它们可以协同工作 - 上下文引擎可能会在组装期间使用记忆插件数据。想使用当前记忆提示路径的插件引擎应优先使用 `openclaw/plugin-sdk/core` 中的 `buildMemorySystemPromptAddition(...)`，它会将当前记忆提示分区转换为可直接前置的 `systemPromptAddition`。如果某个引擎需要更底层的控制，仍可以通过 `openclaw/plugin-sdk/memory-host-core` 中的 `buildActiveMemoryPromptSection(...)` 拉取原始行。
  </Accordion>
  <Accordion title="Session pruning">
    无论当前启用哪个上下文引擎，内存中裁剪旧工具结果仍会运行。
  </Accordion>
</AccordionGroup>

## 提示

- 使用 `openclaw doctor` 验证你的引擎是否正确加载。
- 如果切换引擎，现有会话会继续使用其当前历史。新引擎会接管未来运行。
- 引擎错误会被记录到日志，并且所选插件引擎会在当前 Gateway 网关进程中被隔离。OpenClaw 会为用户轮次回退到 `legacy`，以便回复可以继续，但你仍应修复、更新、禁用或卸载损坏的插件。
- 开发时，使用 `openclaw plugins install -l ./my-engine` 链接本地插件目录，而无需复制。

## 相关内容

- [压缩](/zh-CN/concepts/compaction) - 总结长对话
- [上下文](/zh-CN/concepts/context) - 如何为智能体轮次构建上下文
- [插件架构](/zh-CN/plugins/architecture) - 注册上下文引擎插件
- [插件清单](/zh-CN/plugins/manifest) - 插件清单字段
- [插件](/zh-CN/tools/plugin) - 插件概览
