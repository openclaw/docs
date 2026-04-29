---
read_when:
    - 你想了解 OpenClaw 如何组装模型上下文
    - 你正在旧版引擎和插件引擎之间切换
    - 你正在构建一个上下文引擎插件
sidebarTitle: Context engine
summary: 上下文引擎：可插拔的上下文组装、压缩和子智能体生命周期
title: 上下文引擎
x-i18n:
    generated_at: "2026-04-29T01:24:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f192c6b28ad2b5960b504811926fb5e30fe8da9d985d8eec3ad4b65c9f7cae5
    source_path: concepts/context-engine.md
    workflow: 16
---

**上下文引擎**控制 OpenClaw 如何为每次运行构建模型上下文：包含哪些消息、如何总结较早的历史记录，以及如何跨子智能体边界管理上下文。

OpenClaw 内置了 `legacy` 引擎，并默认使用它 — 大多数用户无需更改此设置。只有当你想要不同的组装、压缩或跨会话召回行为时，才需要安装并选择插件引擎。

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
    上下文引擎插件的安装方式与任何其他 OpenClaw 插件相同。

    <Tabs>
      <Tab title="从 npm">
        ```bash
        openclaw plugins install @martian-engineering/lossless-claw
        ```
      </Tab>
      <Tab title="从本地路径">
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
    将 `contextEngine` 设置为 `"legacy"`（或完全移除该键 — `"legacy"` 是默认值）。
  </Step>
</Steps>

## 工作原理

每次 OpenClaw 运行模型提示词时，上下文引擎都会参与四个生命周期节点：

<AccordionGroup>
  <Accordion title="1. 摄取">
    在新消息添加到会话时调用。引擎可以将该消息存储或索引到自己的数据存储中。
  </Accordion>
  <Accordion title="2. 组装">
    在每次模型运行前调用。引擎返回一组有序消息（以及可选的 `systemPromptAddition`），这些内容需要符合 token 预算。
  </Accordion>
  <Accordion title="3. 压缩">
    在上下文窗口已满，或用户运行 `/compact` 时调用。引擎会总结较早的历史记录以释放空间。
  </Accordion>
  <Accordion title="4. 轮次之后">
    在一次运行完成后调用。引擎可以持久化状态、触发后台压缩，或更新索引。
  </Accordion>
</AccordionGroup>

对于内置的非 ACP Codex harness，OpenClaw 通过将组装好的上下文投射到 Codex 开发者指令和当前轮次提示词中，应用相同的生命周期。Codex 仍然拥有其原生线程历史记录和原生压缩器。

### 子智能体生命周期（可选）

OpenClaw 会调用两个可选的子智能体生命周期钩子：

<ParamField path="prepareSubagentSpawn" type="method">
  在子运行开始前准备共享上下文状态。该钩子会接收父/子会话键、`contextMode`（`isolated` 或 `fork`）、可用的转录记录 ID/文件，以及可选 TTL。如果它返回回滚句柄，OpenClaw 会在准备成功但生成失败时调用该句柄。
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  在子智能体会话完成或被清理时执行清理。
</ParamField>

### 系统提示词追加内容

`assemble` 方法可以返回 `systemPromptAddition` 字符串。OpenClaw 会将其前置到本次运行的系统提示词中。这让引擎可以注入动态召回指导、检索指令或上下文感知提示，而无需静态工作区文件。

## legacy 引擎

内置的 `legacy` 引擎保留了 OpenClaw 的原始行为：

- **摄取**：无操作（会话管理器直接处理消息持久化）。
- **组装**：透传（运行时中的现有清理 → 验证 → 限制流水线处理上下文组装）。
- **压缩**：委托给内置的总结压缩，它会为较早的消息创建单个摘要，并保持近期消息不变。
- **轮次之后**：无操作。

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
值，因此插件可以在第一个生命周期钩子运行前，初始化每个智能体或每个工作区的状态。

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
| `info`             | 属性     | 引擎 ID、名称、版本，以及它是否拥有压缩行为             |
| `ingest(params)`   | 方法     | 存储单条消息                                             |
| `assemble(params)` | 方法     | 为模型运行构建上下文（返回 `AssembleResult`）            |
| `compact(params)`  | 方法     | 总结/缩减上下文                                          |

`assemble` 返回包含以下内容的 `AssembleResult`：

<ParamField path="messages" type="Message[]" required>
  要发送给模型的有序消息。
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  引擎对组装后上下文中总 token 数的估算。OpenClaw 使用它来做压缩阈值决策和诊断报告。
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  前置到系统提示词中。
</ParamField>

`compact` 返回 `CompactResult`。当压缩轮换活动转录记录时，`result.sessionId` 和 `result.sessionFile` 标识下一次重试或轮次必须使用的后继会话。

可选成员：

| 成员                           | 类型   | 用途                                                                                                            |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | 方法   | 为会话初始化引擎状态。在引擎第一次看到会话时调用一次（例如导入历史记录）。                                     |
| `ingestBatch(params)`          | 方法   | 以批处理方式摄取已完成的轮次。在运行完成后调用，一次性接收该轮次的所有消息。                                   |
| `afterTurn(params)`            | 方法   | 运行后的生命周期工作（持久化状态、触发后台压缩）。                                                             |
| `prepareSubagentSpawn(params)` | 方法   | 在子会话开始前设置共享状态。                                                                                   |
| `onSubagentEnded(params)`      | 方法   | 在子智能体结束后清理。                                                                                         |
| `dispose()`                    | 方法   | 释放资源。在 Gateway 网关关闭或插件重新加载期间调用 — 不是按会话调用。                                         |

### ownsCompaction

`ownsCompaction` 控制 Pi 内置的尝试内自动压缩是否在该运行中保持启用：

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    引擎拥有压缩行为。OpenClaw 会为该运行禁用 Pi 的内置自动压缩，而引擎的 `compact()` 实现负责 `/compact`、溢出恢复压缩，以及它想在 `afterTurn()` 中执行的任何主动压缩。OpenClaw 仍可能运行提示词前的溢出保护；当它预测完整转录记录会溢出时，恢复路径会在提交另一个提示词前调用活动引擎的 `compact()`。
  </Accordion>
  <Accordion title="ownsCompaction: false 或未设置">
    Pi 的内置自动压缩仍可能在提示词执行期间运行，但活动引擎的 `compact()` 方法仍会被用于 `/compact` 和溢出恢复。
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **并不**表示 OpenClaw 会自动回退到 legacy 引擎的压缩路径。
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
该槽位在运行时是互斥的 — 对于给定的运行或压缩操作，只会解析一个已注册的上下文引擎。其他已启用的 `kind: "context-engine"` 插件仍然可以加载并运行其注册代码；`plugins.slots.contextEngine` 只选择当 OpenClaw 需要上下文引擎时要解析的已注册引擎 ID。
</Note>

<Note>
**插件卸载：**当你卸载当前被选为 `plugins.slots.contextEngine` 的插件时，OpenClaw 会将该槽位重置回默认值（`legacy`）。相同的重置行为也适用于 `plugins.slots.memory`。无需手动编辑配置。
</Note>

## 与压缩和记忆的关系

<AccordionGroup>
  <Accordion title="压缩">
    压缩是上下文引擎的一项职责。旧版引擎会委托给 OpenClaw 的内置摘要功能。插件引擎可以实现任意压缩策略（DAG 摘要、向量检索等）。
  </Accordion>
  <Accordion title="记忆插件">
    记忆插件（`plugins.slots.memory`）与上下文引擎是分开的。记忆插件提供搜索/检索；上下文引擎控制模型看到的内容。它们可以协同工作——上下文引擎可能会在组装期间使用记忆插件数据。希望使用活跃记忆提示词路径的插件引擎，应优先使用 `openclaw/plugin-sdk/core` 中的 `buildMemorySystemPromptAddition(...)`，它会把活跃记忆提示词片段转换为可直接前置的 `systemPromptAddition`。如果引擎需要更底层的控制，它仍然可以通过 `buildActiveMemoryPromptSection(...)` 从 `openclaw/plugin-sdk/memory-host-core` 拉取原始行。
  </Accordion>
  <Accordion title="会话裁剪">
    无论当前启用哪个上下文引擎，在内存中裁剪旧工具结果仍会运行。
  </Accordion>
</AccordionGroup>

## 提示

- 使用 `openclaw doctor` 验证你的引擎是否正确加载。
- 如果切换引擎，现有会话会继续使用其当前历史记录。新引擎会接管后续运行。
- 引擎错误会记录日志并显示在诊断信息中。如果插件引擎注册失败，或选定的引擎 ID 无法解析，OpenClaw 不会自动回退；运行会失败，直到你修复该插件，或将 `plugins.slots.contextEngine` 切回 `"legacy"`。
- 开发时，使用 `openclaw plugins install -l ./my-engine` 链接本地插件目录，无需复制。

## 相关

- [压缩](/zh-CN/concepts/compaction) — 对长对话进行摘要
- [上下文](/zh-CN/concepts/context) — 如何为智能体轮次构建上下文
- [插件架构](/zh-CN/plugins/architecture) — 注册上下文引擎插件
- [插件 manifest](/zh-CN/plugins/manifest) — 插件 manifest 字段
- [插件](/zh-CN/tools/plugin) — 插件概览
