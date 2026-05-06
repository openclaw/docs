---
read_when:
    - 你想了解 OpenClaw 如何组装模型上下文
    - 你正在旧版引擎和插件引擎之间切换
    - 你正在构建一个上下文引擎插件
sidebarTitle: Context engine
summary: 上下文引擎：可插拔的上下文组装、压缩和子智能体生命周期
title: 上下文引擎
x-i18n:
    generated_at: "2026-05-06T03:40:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c33c94971751d92a2ce695db545a0c0abb7adcbe1820383b83f4201fa7e628d
    source_path: concepts/context-engine.md
    workflow: 16
---

A **上下文引擎** 控制 OpenClaw 如何为每次运行构建模型上下文：包含哪些消息、如何总结较早的历史，以及如何跨子智能体边界管理上下文。

OpenClaw 内置 `legacy` 引擎并默认使用它 - 大多数用户无需更改此设置。只有当你需要不同的组装、压缩或跨会话召回行为时，才安装并选择插件引擎。

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

每当 OpenClaw 运行模型提示时，上下文引擎会参与四个生命周期点：

<AccordionGroup>
  <Accordion title="1. 摄取">
    当新消息添加到会话时调用。引擎可以将该消息存储或索引到自己的数据存储中。
  </Accordion>
  <Accordion title="2. 组装">
    在每次模型运行前调用。引擎返回一组有序消息（以及可选的 `systemPromptAddition`），这些内容需要适配 token 预算。
  </Accordion>
  <Accordion title="3. 压缩">
    当上下文窗口已满，或用户运行 `/compact` 时调用。引擎会总结较早的历史以释放空间。
  </Accordion>
  <Accordion title="4. 轮次后">
    在一次运行完成后调用。引擎可以持久化状态、触发后台压缩，或更新索引。
  </Accordion>
</AccordionGroup>

对于内置的非 ACP Codex harness，OpenClaw 通过将组装后的上下文投射到 Codex 开发者指令和当前轮次提示中，应用相同的生命周期。Codex 仍然拥有其原生线程历史和原生压缩器。

### 子智能体生命周期（可选）

OpenClaw 会调用两个可选的子智能体生命周期钩子：

<ParamField path="prepareSubagentSpawn" type="method">
  在子运行开始前准备共享上下文状态。该钩子会收到父/子会话键、`contextMode`（`isolated` 或 `fork`）、可用的 transcript id/文件，以及可选 TTL。如果它返回回滚句柄，OpenClaw 会在准备成功后启动失败时调用该句柄。
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  在子智能体会话完成或被清理时进行清理。
</ParamField>

### 系统提示附加内容

`assemble` 方法可以返回 `systemPromptAddition` 字符串。OpenClaw 会将它前置到本次运行的系统提示中。这让引擎能够注入动态召回指导、检索指令或上下文感知提示，而无需依赖静态工作区文件。

## legacy 引擎

内置的 `legacy` 引擎保留 OpenClaw 的原始行为：

- **摄取**：无操作（会话管理器直接处理消息持久化）。
- **组装**：透传（运行时中的现有 sanitize → validate → limit 管线处理上下文组装）。
- **压缩**：委托给内置总结压缩，它会为较早的消息创建单个摘要，并保持最近消息不变。
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

工厂 `ctx` 包含可选的 `config`、`agentDir` 和 `workspaceDir` 值，因此插件可以在第一个生命周期钩子运行前，初始化每个智能体或每个工作区的状态。

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
  引擎对组装后上下文中总 token 数的估算。OpenClaw 使用它进行压缩阈值决策和诊断报告。
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  前置到系统提示中。
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  控制运行器在预防性溢出预检查中使用哪个 token 估算。默认值为 `"assembled"`，这意味着只检查组装后提示的估算 - 适合返回窗口化、自包含上下文的引擎。只有当你的组装视图可能隐藏底层 transcript 中的溢出风险时，才设置为 `"preassembly_may_overflow"`；随后运行器在决定是否预防性压缩时，会取组装后估算和组装前（未窗口化）会话历史估算中的最大值。无论哪种方式，你返回的消息仍然是模型看到的内容 - `promptAuthority` 只影响预检查。
</ParamField>

`compact` 返回 `CompactResult`。当压缩轮换活动 transcript 时，`result.sessionId` 和 `result.sessionFile` 会标识下一次重试或轮次必须使用的后继会话。

可选成员：

| 成员                           | 类型   | 用途                                                                                                            |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | 方法   | 为会话初始化引擎状态。当引擎首次看到会话时调用一次（例如导入历史）。                                            |
| `ingestBatch(params)`          | 方法   | 将已完成的轮次作为批次摄取。在运行完成后调用，并一次性提供该轮次中的所有消息。                                  |
| `afterTurn(params)`            | 方法   | 运行后的生命周期工作（持久化状态、触发后台压缩）。                                                              |
| `prepareSubagentSpawn(params)` | 方法   | 在子会话开始前设置共享状态。                                                                                    |
| `onSubagentEnded(params)`      | 方法   | 在子智能体结束后进行清理。                                                                                      |
| `dispose()`                    | 方法   | 释放资源。在 Gateway 网关关闭或插件重新加载期间调用 - 不是按会话调用。                                          |

### ownsCompaction

`ownsCompaction` 控制 Pi 的内置尝试中自动压缩是否在本次运行中保持启用：

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    引擎拥有压缩行为。OpenClaw 会为该次运行禁用 Pi 的内置自动压缩，并且引擎的 `compact()` 实现负责 `/compact`、溢出恢复压缩，以及它希望在 `afterTurn()` 中执行的任何主动压缩。OpenClaw 仍可能运行提示前溢出保护；当它预测完整 transcript 会溢出时，恢复路径会在提交另一个提示前调用活动引擎的 `compact()`。
  </Accordion>
  <Accordion title="ownsCompaction: false 或未设置">
    Pi 的内置自动压缩仍可能在提示执行期间运行，但活动引擎的 `compact()` 方法仍会用于 `/compact` 和溢出恢复。
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **不** 表示 OpenClaw 会自动回退到 legacy 引擎的压缩路径。
</Warning>

这意味着有两种有效的插件模式：

<Tabs>
  <Tab title="拥有模式">
    实现你自己的压缩算法，并设置 `ownsCompaction: true`。
  </Tab>
  <Tab title="委托模式">
    设置 `ownsCompaction: false`，并让 `compact()` 调用来自 `openclaw/plugin-sdk/core` 的 `delegateCompactionToRuntime(...)`，以使用 OpenClaw 的内置压缩行为。
  </Tab>
</Tabs>

对于活动的非拥有引擎，无操作的 `compact()` 是不安全的，因为它会禁用该引擎槽位的正常 `/compact` 和溢出恢复压缩路径。

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
该槽位在运行时是独占的 - 对于给定运行或压缩操作，只会解析一个已注册的上下文引擎。其他已启用的 `kind: "context-engine"` 插件仍然可以加载并运行其注册代码；`plugins.slots.contextEngine` 只选择当 OpenClaw 需要上下文引擎时要解析的已注册引擎 id。
</Note>

<Note>
**插件卸载：**当你卸载当前被选为 `plugins.slots.contextEngine` 的插件时，OpenClaw 会将该槽位重置回默认值（`legacy`）。相同的重置行为也适用于 `plugins.slots.memory`。无需手动编辑配置。
</Note>

## 与压缩和记忆的关系

<AccordionGroup>
  <Accordion title="压缩">
    压缩是上下文引擎的一项职责。旧版引擎会委托给 OpenClaw 的内置摘要功能。插件引擎可以实现任何压缩策略（DAG 摘要、向量检索等）。
  </Accordion>
  <Accordion title="记忆插件">
    记忆插件（`plugins.slots.memory`）与上下文引擎相互独立。记忆插件提供搜索/检索；上下文引擎控制模型看到的内容。它们可以协同工作——上下文引擎可能会在组装期间使用记忆插件数据。想使用主动记忆提示词路径的插件引擎，应优先使用 `openclaw/plugin-sdk/core` 中的 `buildMemorySystemPromptAddition(...)`，它会将主动记忆提示词部分转换为可直接前置的 `systemPromptAddition`。如果引擎需要更底层的控制，仍然可以通过 `buildActiveMemoryPromptSection(...)` 从 `openclaw/plugin-sdk/memory-host-core` 拉取原始行。
  </Accordion>
  <Accordion title="会话剪枝">
    无论哪个上下文引擎处于活动状态，仍然会在内存中修剪旧工具结果。
  </Accordion>
</AccordionGroup>

## 提示

- 使用 `openclaw doctor` 验证你的引擎是否正确加载。
- 如果切换引擎，现有会话会继续使用其当前历史记录。新引擎会接管未来的运行。
- 引擎错误会被记录并在诊断中显示。如果插件引擎注册失败，或无法解析所选引擎 ID，OpenClaw 不会自动回退；在你修复插件或将 `plugins.slots.contextEngine` 切回 `"legacy"` 之前，运行会失败。
- 开发时，使用 `openclaw plugins install -l ./my-engine` 链接本地插件目录，无需复制。

## 相关

- [压缩](/zh-CN/concepts/compaction) - 汇总长对话
- [上下文](/zh-CN/concepts/context) - 如何为智能体轮次构建上下文
- [插件架构](/zh-CN/plugins/architecture) - 注册上下文引擎插件
- [插件清单](/zh-CN/plugins/manifest) - 插件清单字段
- [插件](/zh-CN/tools/plugin) - 插件概览
