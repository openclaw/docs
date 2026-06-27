---
read_when:
    - 你想了解 OpenClaw 如何组装模型上下文
    - 你正在旧版引擎和插件引擎之间切换
    - 你正在构建一个上下文引擎插件
sidebarTitle: Context engine
summary: 上下文引擎：可插拔的上下文组装、压缩和子智能体生命周期
title: 上下文引擎
x-i18n:
    generated_at: "2026-06-27T01:46:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 124b6daf52f3d58f756352e2e169697541a8b6e67aecaa5a219bed15bda801cd
    source_path: concepts/context-engine.md
    workflow: 16
---

A **上下文引擎** 控制 OpenClaw 如何为每次运行构建模型上下文：包含哪些消息、如何总结较早的历史记录，以及如何跨子智能体边界管理上下文。

OpenClaw 内置 `legacy` 引擎并默认使用它 - 大多数用户无需更改此设置。只有在你需要不同的组装、压缩或跨会话回忆行为时，才安装并选择插件引擎。

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
    上下文引擎插件的安装方式与其他任何 OpenClaw 插件相同。

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
  <Step title="启用并选择该引擎">
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

每当 OpenClaw 运行模型提示时，上下文引擎都会参与四个生命周期点：

<AccordionGroup>
  <Accordion title="1. 摄取">
    在向会话添加新消息时调用。引擎可以将消息存储或索引到自己的数据存储中。
  </Accordion>
  <Accordion title="2. 组装">
    在每次模型运行前调用。引擎返回一组有序消息（以及可选的 `systemPromptAddition`），这些消息适配 token 预算。
  </Accordion>
  <Accordion title="3. 压缩">
    在上下文窗口已满，或用户运行 `/compact` 时调用。引擎会总结较早的历史记录以释放空间。
  </Accordion>
  <Accordion title="4. 轮次后">
    在一次运行完成后调用。引擎可以持久化状态、触发后台压缩或更新索引。
  </Accordion>
</AccordionGroup>

对于内置的非 ACP Codex harness，OpenClaw 通过将组装后的上下文投射到 Codex 开发者指令和当前轮次提示中，应用相同的生命周期。Codex 仍然拥有其原生线程历史记录和原生压缩器。

### 子智能体生命周期（可选）

OpenClaw 调用两个可选的子智能体生命周期钩子：

<ParamField path="prepareSubagentSpawn" type="method">
  在子运行开始前准备共享上下文状态。该钩子接收父/子会话键、`contextMode`（`isolated` 或 `fork`）、可用的 transcript id/文件，以及可选 TTL。如果它返回回滚句柄，OpenClaw 会在准备成功后生成失败时调用它。请求 `lightContext` 并解析为 `contextMode="isolated"` 的原生子智能体生成会有意跳过此钩子，使子智能体从轻量级引导上下文开始，而不带由上下文引擎管理的生成前状态。
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  在子智能体会话完成或被清扫时清理。
</ParamField>

### 系统提示追加内容

`assemble` 方法可以返回 `systemPromptAddition` 字符串。OpenClaw 会将其前置到本次运行的系统提示中。这让引擎可以注入动态回忆指导、检索指令或上下文感知提示，而无需静态工作区文件。

## legacy 引擎

内置的 `legacy` 引擎保留 OpenClaw 的原始行为：

- **摄取**：无操作（会话管理器直接处理消息持久化）。
- **组装**：直通（运行时中现有的 sanitize → validate → limit 管线处理上下文组装）。
- **压缩**：委托给内置的总结压缩，它会为较早消息创建单个摘要，并保持近期消息不变。
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
值，因此插件可以在第一个生命周期钩子运行前，初始化按智能体或按工作区的状态。

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

| 成员               | 类型     | 用途                                                 |
| ------------------ | -------- | ---------------------------------------------------- |
| `info`             | 属性     | 引擎 id、名称、版本，以及它是否拥有压缩             |
| `ingest(params)`   | 方法     | 存储单条消息                                         |
| `assemble(params)` | 方法     | 为模型运行构建上下文（返回 `AssembleResult`）       |
| `compact(params)`  | 方法     | 总结/缩减上下文                                      |

`assemble` 返回包含以下内容的 `AssembleResult`：

<ParamField path="messages" type="Message[]" required>
  要发送给模型的有序消息。
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  引擎对已组装上下文中总 token 数的估算。OpenClaw 将其用于压缩阈值决策和诊断报告。
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  前置到系统提示中。
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  控制运行器用于抢先溢出预检查的 token 估算。默认为 `"assembled"`，这意味着只检查已组装提示的估算值 - 适用于返回窗口化、自包含上下文的引擎。仅当你的已组装视图可能隐藏底层 transcript 中的溢出风险时，才设置为 `"preassembly_may_overflow"`；随后运行器在决定是否抢先压缩时，会取已组装估算和组装前（未窗口化）会话历史估算中的最大值。无论哪种方式，你返回的消息仍然是模型看到的内容 - `promptAuthority` 只影响预检查。
</ParamField>

`compact` 返回 `CompactResult`。当压缩轮换活动
transcript 时，`result.sessionId` 和 `result.sessionFile` 标识下一次重试或轮次必须使用的后继会话。

可选成员：

| 成员                           | 类型   | 用途                                                                                                           |
| ------------------------------ | ------ | -------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | 方法   | 为会话初始化引擎状态。当引擎第一次看到某个会话时调用一次（例如导入历史记录）。                                 |
| `ingestBatch(params)`          | 方法   | 将已完成轮次作为批次摄取。在一次运行完成后调用，一次性传入该轮次的所有消息。                                   |
| `afterTurn(params)`            | 方法   | 运行后的生命周期工作（持久化状态、触发后台压缩）。                                                             |
| `prepareSubagentSpawn(params)` | 方法   | 在子会话开始前为其设置共享状态。                                                                               |
| `onSubagentEnded(params)`      | 方法   | 在子智能体结束后清理。                                                                                         |
| `dispose()`                    | 方法   | 释放资源。在 Gateway 网关关闭或插件重新加载期间调用 - 不是按会话调用。                                        |

### 运行时设置

在 OpenClaw 内运行的生命周期钩子会收到可选的
`runtimeSettings` 对象。它是一个带版本、只读的内部生产者/消费者 API 表面：OpenClaw 为选定的上下文引擎生成它，而上下文引擎在生命周期钩子内部消费它。它不会直接呈现给用户，也不会创建专用报告表面。

- `schemaVersion`：当前为 `1`
- `runtime`：OpenClaw 宿主、运行时模式（`normal`、`fallback` 或
  `degraded`），以及可选的 harness/runtime id
- `contextEngineSelection`：选定的上下文引擎 id 和选择来源
- `executionHost`：调用该钩子的表面的宿主 id 和标签
- `model`：请求的模型、解析后的模型、提供商，以及可选模型系列
- `limits`：已知时的提示 token 预算和最大输出 token 数
- `diagnostics`：已知时的闭合 fallback 和 degraded 原因代码

可能未知的字段表示为 `null`；判别字段（例如运行时模式和选择来源）保持非 nullable。旧引擎仍然兼容：如果严格的 legacy 引擎因 `runtimeSettings` 是未知属性而拒绝它，OpenClaw 会在不传入它的情况下重试生命周期调用，而不是隔离该引擎。

### 宿主要求

上下文引擎可以在 `info.hostRequirements` 上声明宿主能力要求。
OpenClaw 会在启动操作前检查这些要求，并在选定运行时无法满足要求时以描述性错误失败关闭。

对于智能体运行，当引擎必须通过 `assemble()` 控制实际模型提示时，声明 `assemble-before-prompt`：

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

原生 Codex 和 OpenClaw 嵌入式智能体运行满足 `assemble-before-prompt`。
通用 CLI 后端不满足，因此需要它的引擎会在 CLI 进程启动前被拒绝。

### 故障隔离

OpenClaw 将选定的插件引擎与核心回复路径隔离。如果非 legacy 引擎缺失、契约验证失败、在工厂创建期间抛出异常，或从生命周期方法抛出异常，OpenClaw 会在当前 Gateway 网关进程中隔离该引擎，并将上下文引擎工作降级到内置 `legacy` 引擎。错误会随失败操作一起记录，以便操作者可以修复、更新或禁用该插件，而不会让智能体静默。

主机要求失败则不同：当某个引擎声明某个运行时缺少必需能力时，OpenClaw 会在启动运行前以关闭方式失败。这可以保护那些在不受支持的主机中运行会破坏状态的引擎。

### ownsCompaction

`ownsCompaction` 控制 OpenClaw 运行时内置的尝试内自动压缩是否在该次运行中保持启用：

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    引擎拥有压缩行为。OpenClaw 会为该次运行禁用 OpenClaw 运行时内置的自动压缩，并且引擎的 `compact()` 实现负责 `/compact`、溢出恢复压缩，以及它想在 `afterTurn()` 中执行的任何主动压缩。OpenClaw 仍可能运行提示词前的溢出防护；当它预测完整转录将溢出时，恢复路径会先调用活动引擎的 `compact()`，再提交另一个提示词。
  </Accordion>
  <Accordion title="ownsCompaction: false or unset">
    OpenClaw 运行时内置的自动压缩仍可能在提示词执行期间运行，但活动引擎的 `compact()` 方法仍会用于 `/compact` 和溢出恢复。
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **不** 表示 OpenClaw 会自动回退到旧版引擎的压缩路径。
</Warning>

这意味着有两种有效的插件模式：

<Tabs>
  <Tab title="Owning mode">
    实现你自己的压缩算法，并设置 `ownsCompaction: true`。
  </Tab>
  <Tab title="Delegating mode">
    设置 `ownsCompaction: false`，并让 `compact()` 调用 `openclaw/plugin-sdk/core` 中的 `delegateCompactionToRuntime(...)`，以使用 OpenClaw 内置的压缩行为。
  </Tab>
</Tabs>

对于活动的非自主管理引擎，无操作的 `compact()` 是不安全的，因为它会禁用该引擎槽位的正常 `/compact` 和溢出恢复压缩路径。

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
该槽位在运行时是互斥的 - 对于给定的运行或压缩操作，只会解析一个已注册的上下文引擎。其他已启用的 `kind: "context-engine"` 插件仍然可以加载并运行它们的注册代码；`plugins.slots.contextEngine` 只会选择当 OpenClaw 需要上下文引擎时要解析的已注册引擎 ID。
</Note>

<Note>
**插件卸载：** 当你卸载当前被选为 `plugins.slots.contextEngine` 的插件时，OpenClaw 会将该槽位重置回默认值（`legacy`）。同样的重置行为也适用于 `plugins.slots.memory`。无需手动编辑配置。
</Note>

## 与压缩和记忆的关系

<AccordionGroup>
  <Accordion title="Compaction">
    压缩是上下文引擎的职责之一。旧版引擎会委托给 OpenClaw 内置的摘要能力。插件引擎可以实现任何压缩策略（DAG 摘要、向量检索等）。
  </Accordion>
  <Accordion title="Memory plugins">
    记忆插件（`plugins.slots.memory`）与上下文引擎是分离的。记忆插件提供搜索/检索；上下文引擎控制模型看到的内容。它们可以协同工作 - 上下文引擎可能会在组装期间使用记忆插件数据。想要使用活动记忆提示词路径的插件引擎应优先使用 `openclaw/plugin-sdk/core` 中的 `buildMemorySystemPromptAddition(...)`，它会把活动记忆提示词段落转换为可直接前置的 `systemPromptAddition`。如果引擎需要更底层的控制，它仍可以通过 `openclaw/plugin-sdk/memory-host-core` 中的 `buildActiveMemoryPromptSection(...)` 拉取原始行。
  </Accordion>
  <Accordion title="Session pruning">
    无论哪个上下文引擎处于活动状态，内存中修剪旧工具结果仍会运行。
  </Accordion>
</AccordionGroup>

## 提示

- 使用 `openclaw doctor` 验证你的引擎是否正确加载。
- 如果切换引擎，现有会话会继续使用它们当前的历史记录。新引擎会接管未来的运行。
- 引擎错误会被记录，并且所选插件引擎会在当前 Gateway 网关进程中被隔离。OpenClaw 会针对用户轮次回退到 `legacy`，以便回复可以继续，但你仍应修复、更新、禁用或卸载损坏的插件。
- 开发时，使用 `openclaw plugins install -l ./my-engine` 来链接本地插件目录，而无需复制。

## 相关

- [压缩](/zh-CN/concepts/compaction) - 对长对话进行摘要
- [上下文](/zh-CN/concepts/context) - 如何为智能体轮次构建上下文
- [插件架构](/zh-CN/plugins/architecture) - 注册上下文引擎插件
- [插件清单](/zh-CN/plugins/manifest) - 插件清单字段
- [插件](/zh-CN/tools/plugin) - 插件概览
