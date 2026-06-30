---
read_when:
    - 你想了解 OpenClaw 如何组装模型上下文
    - 你正在旧版引擎和插件引擎之间切换
    - 你正在构建一个上下文引擎插件
sidebarTitle: Context engine
summary: 上下文引擎：可插拔的上下文组装、压缩和子智能体生命周期
title: 上下文引擎
x-i18n:
    generated_at: "2026-06-30T13:48:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f0ed65cbb72b14b1a6e8d4d9a394f730a48ada35d77e34c12b3356162b281eec
    source_path: concepts/context-engine.md
    workflow: 16
---

**上下文引擎**控制 OpenClaw 如何为每次运行构建模型上下文：包含哪些消息、如何总结较早的历史，以及如何跨子智能体边界管理上下文。

OpenClaw 内置了 `legacy` 引擎并默认使用它 - 大多数用户无需更改此设置。只有当你想要不同的组装、压缩或跨会话回忆行为时，才安装并选择插件引擎。

## 快速开始

<Steps>
  <Step title="检查当前激活的引擎">
    ```bash
    openclaw doctor
    # or inspect config directly:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="安装插件引擎">
    上下文引擎插件的安装方式与任何其他 OpenClaw 插件相同。

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

    安装并配置后重启 Gateway 网关。

  </Step>
  <Step title="切回 legacy（可选）">
    将 `contextEngine` 设置为 `"legacy"`（或完全移除此键 - `"legacy"` 是默认值）。
  </Step>
</Steps>

## 工作原理

每次 OpenClaw 运行模型提示时，上下文引擎都会参与四个生命周期点：

<AccordionGroup>
  <Accordion title="1. 摄取">
    在新消息加入会话时调用。引擎可以将消息存储到自己的数据存储中，或为其建立索引。
  </Accordion>
  <Accordion title="2. 组装">
    在每次模型运行前调用。引擎返回一组有序消息（以及可选的 `systemPromptAddition`），这些内容会适配 token 预算。
  </Accordion>
  <Accordion title="3. 压缩">
    在上下文窗口已满，或用户运行 `/compact` 时调用。引擎会总结较早的历史以释放空间。
  </Accordion>
  <Accordion title="4. 轮次之后">
    在一次运行完成后调用。引擎可以持久化状态、触发后台压缩，或更新索引。
  </Accordion>
</AccordionGroup>

对于内置的非 ACP Codex harness，OpenClaw 通过将组装后的上下文投射到 Codex 开发者指令和当前轮次提示中，应用相同的生命周期。Codex 仍然拥有自己的原生线程历史和原生压缩器。

### 子智能体生命周期（可选）

OpenClaw 会调用两个可选的子智能体生命周期钩子：

<ParamField path="prepareSubagentSpawn" type="method">
  在子运行开始前准备共享上下文状态。该钩子接收父/子会话键、`contextMode`（`isolated` 或 `fork`）、可用的转录记录 id/文件，以及可选 TTL。如果它返回回滚句柄，OpenClaw 会在准备成功但生成失败时调用它。请求 `lightContext` 并解析为 `contextMode="isolated"` 的原生子智能体生成会有意跳过此钩子，因此子智能体会从轻量级引导上下文开始，而不带上下文引擎管理的预生成状态。
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  在子智能体会话完成或被清扫时清理。
</ParamField>

### 系统提示附加内容

`assemble` 方法可以返回 `systemPromptAddition` 字符串。OpenClaw 会将其前置到该次运行的系统提示中。这让引擎无需静态工作区文件，就能注入动态回忆指导、检索指令或上下文感知提示。

## `legacy` 引擎

内置的 `legacy` 引擎保留了 OpenClaw 的原始行为：

- **摄取**：无操作（会话管理器直接处理消息持久化）。
- **组装**：直通（运行时中的现有 sanitize → validate → limit 管线处理上下文组装）。
- **压缩**：委托给内置的总结压缩，它会为较早的消息创建单个摘要，并保持最近消息不变。
- **轮次之后**：无操作。

`legacy` 引擎不会注册工具，也不会提供 `systemPromptAddition`。

当未设置 `plugins.slots.contextEngine`（或设置为 `"legacy"`）时，会自动使用此引擎。

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
| `info`             | 属性     | 引擎 id、名称、版本，以及它是否拥有压缩                 |
| `ingest(params)`   | 方法     | 存储单条消息                                             |
| `assemble(params)` | 方法     | 为模型运行构建上下文（返回 `AssembleResult`）           |
| `compact(params)`  | 方法     | 总结/缩减上下文                                          |

`assemble` 返回包含以下内容的 `AssembleResult`：

<ParamField path="messages" type="Message[]" required>
  要发送给模型的有序消息。
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  引擎对组装后上下文中总 token 数的估算。OpenClaw 使用它进行压缩阈值决策和诊断报告。
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  前置到系统提示中。
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  控制运行器在预防性溢出预检查中使用哪个 token 估算。默认为 `"assembled"`，这意味着对于不拥有压缩的引擎，只检查组装后提示的估算。设置了 `ownsCompaction: true` 的引擎会管理自己的提示准入，因此 OpenClaw 默认跳过通用的提示前预检查。只有当你的组装视图可能隐藏底层转录记录中的溢出风险时，才设置 `"preassembly_may_overflow"`；随后运行器会保持通用预检查处于激活状态，并在决定是否预防性压缩时，取组装后估算与组装前（未窗口化）会话历史估算的最大值。无论哪种方式，你返回的消息仍然是模型看到的内容 - `promptAuthority` 只影响预检查。
</ParamField>

`compact` 返回 `CompactResult`。当压缩轮换活跃转录记录时，`result.sessionId` 和 `result.sessionFile` 标识下一次重试或轮次必须使用的后继会话。

可选成员：

| 成员                           | 类型   | 用途                                                                                                            |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | 方法   | 为会话初始化引擎状态。在引擎首次看到会话时调用一次（例如导入历史）。                                           |
| `ingestBatch(params)`          | 方法   | 将已完成的轮次作为批次摄取。在运行完成后调用，一次性传入该轮次的所有消息。                                     |
| `afterTurn(params)`            | 方法   | 运行后的生命周期工作（持久化状态、触发后台压缩）。                                                             |
| `prepareSubagentSpawn(params)` | 方法   | 在子会话开始前设置共享状态。                                                                                   |
| `onSubagentEnded(params)`      | 方法   | 在子智能体结束后清理。                                                                                         |
| `dispose()`                    | 方法   | 释放资源。在 Gateway 网关关闭或插件重新加载期间调用 - 不是按会话调用。                                        |

### 运行时设置

在 OpenClaw 内运行的生命周期钩子会接收可选的 `runtimeSettings` 对象。它是一个带版本的只读内部生产者/消费者 API 表面：OpenClaw 为选定的上下文引擎生成它，而上下文引擎在生命周期钩子中使用它。它不会直接呈现给用户，也不会创建专用的报告表面。

- `schemaVersion`：当前为 `1`
- `runtime`：OpenClaw 主机、运行时模式（`normal`、`fallback` 或
  `degraded`），以及可选的 harness/运行时 id
- `contextEngineSelection`：选定的上下文引擎 id 和选择来源
- `executionHost`：调用该钩子的表面的主机 id 和标签
- `model`：请求的模型、解析后的模型、提供商，以及可选的模型家族
- `limits`：已知时的提示 token 预算和最大输出 token 数
- `diagnostics`：已知时的闭合 fallback 和 degraded 原因代码

可能未知的字段表示为 `null`；运行时模式和选择来源等判别字段保持不可为空。旧版引擎仍保持兼容：如果严格的旧版引擎因 `runtimeSettings` 是未知属性而拒绝它，OpenClaw 会在不隔离该引擎的情况下，改为不带它重试生命周期调用。

### 主机要求

上下文引擎可以在 `info.hostRequirements` 上声明主机能力要求。OpenClaw 会在启动操作前检查这些要求，并在选定运行时无法满足要求时以描述性错误闭合失败。

对于智能体运行，如果引擎必须通过 `assemble()` 控制实际模型提示，请声明 `assemble-before-prompt`：

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

原生 Codex 和 OpenClaw 嵌入式智能体运行满足 `assemble-before-prompt`。通用 CLI 后端不满足，因此需要它的引擎会在 CLI 进程启动前被拒绝。

### 故障隔离

OpenClaw 会将选定的插件引擎与核心回复路径隔离。如果某个非旧版引擎缺失、未通过契约验证、在工厂创建期间抛出异常，或从生命周期方法抛出异常，OpenClaw 会在当前 Gateway 网关进程中隔离该引擎，并将上下文引擎工作降级到内置的 `legacy` 引擎。错误会连同失败的操作一起记录到日志中，以便操作员修复、更新或禁用插件，而不会让智能体静默无响应。

主机要求失败则不同：当引擎声明某个运行时缺少必需能力时，OpenClaw 会在启动运行前失败关闭。这样可以保护那些如果在不受支持的主机中运行就会损坏状态的引擎。

### ownsCompaction

`ownsCompaction` 控制 OpenClaw 运行时内置的尝试内自动压缩是否在该运行中保持启用：

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    引擎拥有压缩行为。OpenClaw 会为该运行禁用 OpenClaw 运行时内置的自动压缩和通用的提示前溢出预检查，而引擎的 `compact()` 实现负责 `/compact`、提供商溢出恢复压缩，以及它想在 `afterTurn()` 中执行的任何主动压缩。当引擎从 `assemble()` 返回 `promptAuthority: "preassembly_may_overflow"` 时，OpenClaw 仍会运行提示前溢出保护。
  </Accordion>
  <Accordion title="ownsCompaction: false or unset">
    OpenClaw 运行时内置的自动压缩仍可能在提示执行期间运行，但仍会为 `/compact` 和溢出恢复调用活动引擎的 `compact()` 方法。
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
    设置 `ownsCompaction: false`，并让 `compact()` 调用 `openclaw/plugin-sdk/core` 中的 `delegateCompactionToRuntime(...)` 来使用 OpenClaw 的内置压缩行为。
  </Tab>
</Tabs>

对于活动的非自有引擎来说，无操作的 `compact()` 并不安全，因为它会禁用该引擎槽位的正常 `/compact` 和溢出恢复压缩路径。

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
该槽位在运行时是互斥的，即对于给定运行或压缩操作，只会解析一个已注册的上下文引擎。其他已启用的 `kind: "context-engine"` 插件仍然可以加载并运行其注册代码；`plugins.slots.contextEngine` 只选择当 OpenClaw 需要上下文引擎时要解析的已注册引擎 ID。
</Note>

<Note>
**插件卸载：**当你卸载当前被选为 `plugins.slots.contextEngine` 的插件时，OpenClaw 会将该槽位重置回默认值（`legacy`）。同样的重置行为也适用于 `plugins.slots.memory`。不需要手动编辑配置。
</Note>

## 与压缩和记忆的关系

<AccordionGroup>
  <Accordion title="Compaction">
    压缩是上下文引擎的一项职责。旧版引擎会委托给 OpenClaw 的内置摘要功能。插件引擎可以实现任何压缩策略（DAG 摘要、向量检索等）。
  </Accordion>
  <Accordion title="Memory plugins">
    记忆插件（`plugins.slots.memory`）与上下文引擎是分开的。记忆插件提供搜索/检索；上下文引擎控制模型看到的内容。它们可以协同工作：上下文引擎可能会在组装期间使用记忆插件数据。想要使用活动记忆提示路径的插件引擎应优先使用 `openclaw/plugin-sdk/core` 中的 `buildMemorySystemPromptAddition(...)`，它会将活动记忆提示分区转换为可直接前置的 `systemPromptAddition`。如果引擎需要更底层的控制，它仍然可以通过 `openclaw/plugin-sdk/memory-host-core` 中的 `buildActiveMemoryPromptSection(...)` 拉取原始行。
  </Accordion>
  <Accordion title="Session pruning">
    无论哪个上下文引擎处于活动状态，内存中修剪旧工具结果的流程仍会运行。
  </Accordion>
</AccordionGroup>

## 提示

- 使用 `openclaw doctor` 验证你的引擎是否正确加载。
- 如果切换引擎，现有会话会继续使用其当前历史记录。新引擎会接管未来的运行。
- 引擎错误会记录到日志中，并且选定的插件引擎会在当前 Gateway 网关进程中被隔离。OpenClaw 会针对用户轮次回退到 `legacy`，以便回复可以继续，但你仍应修复、更新、禁用或卸载损坏的插件。
- 开发时，使用 `openclaw plugins install -l ./my-engine` 链接本地插件目录而无需复制。

## 相关

- [压缩](/zh-CN/concepts/compaction) - 汇总长对话
- [上下文](/zh-CN/concepts/context) - 如何为智能体轮次构建上下文
- [插件架构](/zh-CN/plugins/architecture) - 注册上下文引擎插件
- [插件清单](/zh-CN/plugins/manifest) - 插件清单字段
- [插件](/zh-CN/tools/plugin) - 插件概览
