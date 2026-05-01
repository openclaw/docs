---
read_when:
    - 你想了解 OpenClaw 如何组装模型上下文
    - 你正在旧版引擎和插件引擎之间切换
    - 你正在构建一个上下文引擎插件
sidebarTitle: Context engine
summary: 上下文引擎：可插拔的上下文组装、压缩和子智能体生命周期
title: 上下文引擎
x-i18n:
    generated_at: "2026-05-01T14:47:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7477dd1d48f9633586dce67204912a810e0931d7bc9f2d6719ba465fe19681b
    source_path: concepts/context-engine.md
    workflow: 16
---

一个**上下文引擎**控制 OpenClaw 如何为每次运行构建模型上下文：要包含哪些消息、如何摘要较早的历史记录，以及如何跨子智能体边界管理上下文。

OpenClaw 内置了 `legacy` 引擎，并默认使用它；大多数用户永远不需要更改这一点。只有在你需要不同的组装、压缩或跨会话回忆行为时，才安装并选择插件引擎。

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
    将 `contextEngine` 设置为 `"legacy"`（或完全移除该键；`"legacy"` 是默认值）。
  </Step>
</Steps>

## 工作原理

每次 OpenClaw 运行模型提示时，上下文引擎都会参与四个生命周期点：

<AccordionGroup>
  <Accordion title="1. 摄取">
    在向会话添加新消息时调用。引擎可以在自己的数据存储中保存消息或为其建立索引。
  </Accordion>
  <Accordion title="2. 组装">
    在每次模型运行前调用。引擎返回一组有序消息（以及可选的 `systemPromptAddition`），这些内容需要适配 token 预算。
  </Accordion>
  <Accordion title="3. 压缩">
    在上下文窗口已满，或用户运行 `/compact` 时调用。引擎会摘要较早的历史记录以释放空间。
  </Accordion>
  <Accordion title="4. 轮次结束后">
    在一次运行完成后调用。引擎可以持久化状态、触发后台压缩，或更新索引。
  </Accordion>
</AccordionGroup>

对于内置的非 ACP Codex harness，OpenClaw 通过将组装后的上下文投射到 Codex 开发者指令和当前轮次提示中，来应用相同的生命周期。Codex 仍然拥有其原生线程历史记录和原生压缩器。

### 子智能体生命周期（可选）

OpenClaw 会调用两个可选的子智能体生命周期钩子：

<ParamField path="prepareSubagentSpawn" type="method">
  在子运行开始前准备共享上下文状态。该钩子会收到父/子会话键、`contextMode`（`isolated` 或 `fork`）、可用的转录记录 ID/文件，以及可选 TTL。如果它返回回滚句柄，OpenClaw 会在准备成功后生成失败时调用该句柄。
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  在子智能体会话完成或被清扫时进行清理。
</ParamField>

### 系统提示补充

`assemble` 方法可以返回一个 `systemPromptAddition` 字符串。OpenClaw 会将其前置到该次运行的系统提示中。这让引擎可以注入动态回忆指导、检索指令或上下文感知提示，而无需静态工作区文件。

## legacy 引擎

内置的 `legacy` 引擎保留了 OpenClaw 的原始行为：

- **摄取**：无操作（会话管理器会直接处理消息持久化）。
- **组装**：透传（运行时中的现有 sanitize → validate → limit 流水线会处理上下文组装）。
- **压缩**：委托给内置的摘要压缩，它会为较早的消息创建一个单一摘要，并保持近期消息不变。
- **轮次结束后**：无操作。

legacy 引擎不会注册工具，也不会提供 `systemPromptAddition`。

当未设置 `plugins.slots.contextEngine`（或它设置为 `"legacy"`）时，会自动使用此引擎。

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

工厂 `ctx` 包含可选的 `config`、`agentDir` 和 `workspaceDir` 值，因此插件可以在第一个生命周期钩子运行前初始化按智能体或按工作区划分的状态。

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
| `info`             | 属性     | 引擎 ID、名称、版本，以及它是否拥有压缩                 |
| `ingest(params)`   | 方法     | 存储单条消息                                             |
| `assemble(params)` | 方法     | 为模型运行构建上下文（返回 `AssembleResult`）            |
| `compact(params)`  | 方法     | 摘要/缩减上下文                                          |

`assemble` 返回一个 `AssembleResult`，包含：

<ParamField path="messages" type="Message[]" required>
  要发送给模型的有序消息。
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  引擎对组装后上下文中总 token 数的估算。OpenClaw 会将其用于压缩阈值决策和诊断报告。
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  前置到系统提示中。
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  控制运行器在预防性溢出预检查中使用哪个 token 估算值。默认为 `"assembled"`，这意味着只检查组装后提示的估算值；这适用于返回窗口化、自包含上下文的引擎。只有当你组装后的视图可能隐藏底层转录记录中的溢出风险时，才设置为 `"preassembly_may_overflow"`；此时运行器在决定是否预防性压缩时，会取组装后估算值和组装前（未窗口化）会话历史估算值中的较大值。无论哪种方式，你返回的消息仍然是模型看到的内容；`promptAuthority` 只影响预检查。
</ParamField>

`compact` 返回一个 `CompactResult`。当压缩轮转活动转录记录时，`result.sessionId` 和 `result.sessionFile` 会标识后续重试或轮次必须使用的继任会话。

可选成员：

| 成员                           | 类型   | 用途                                                                                         |
| ------------------------------ | ------ | -------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | 方法   | 为会话初始化引擎状态。在引擎首次看到会话时调用一次（例如导入历史记录）。                     |
| `ingestBatch(params)`          | 方法   | 以批量方式摄取一个已完成的轮次。在一次运行完成后调用，一次性接收该轮次的所有消息。           |
| `afterTurn(params)`            | 方法   | 运行后生命周期工作（持久化状态、触发后台压缩）。                                             |
| `prepareSubagentSpawn(params)` | 方法   | 在子会话开始前设置共享状态。                                                                 |
| `onSubagentEnded(params)`      | 方法   | 在子智能体结束后进行清理。                                                                   |
| `dispose()`                    | 方法   | 释放资源。在 Gateway 网关关闭或插件重新加载期间调用，而不是按会话调用。                      |

### ownsCompaction

`ownsCompaction` 控制 Pi 的内置尝试内自动压缩在该次运行中是否保持启用：

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    引擎拥有压缩行为。OpenClaw 会在该次运行中禁用 Pi 的内置自动压缩，并且该引擎的 `compact()` 实现负责 `/compact`、溢出恢复压缩，以及它想在 `afterTurn()` 中执行的任何主动压缩。OpenClaw 仍可能运行提示前溢出保护；当它预测完整转录记录将溢出时，恢复路径会在提交另一个提示前调用活动引擎的 `compact()`。
  </Accordion>
  <Accordion title="ownsCompaction: false 或未设置">
    Pi 的内置自动压缩仍可能在提示执行期间运行，但活动引擎的 `compact()` 方法仍会用于 `/compact` 和溢出恢复。
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **不**表示 OpenClaw 会自动回退到 legacy 引擎的压缩路径。
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

对于活动的非拥有型引擎，无操作的 `compact()` 是不安全的，因为它会禁用该引擎槽位的正常 `/compact` 和溢出恢复压缩路径。

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
该槽位在运行时是互斥的：对于给定的运行或压缩操作，只会解析一个已注册的上下文引擎。其他已启用的 `kind: "context-engine"` 插件仍然可以加载并运行其注册代码；`plugins.slots.contextEngine` 只选择 OpenClaw 在需要上下文引擎时解析的已注册引擎 ID。
</Note>

<Note>
**插件卸载：** 当你卸载当前被选为 `plugins.slots.contextEngine` 的插件时，OpenClaw 会将该槽位重置回默认值（`legacy`）。同样的重置行为也适用于 `plugins.slots.memory`。无需手动编辑配置。
</Note>

## 与压缩和记忆的关系

<AccordionGroup>
  <Accordion title="压缩">
    压缩是上下文引擎的一项职责。旧版引擎会委托给 OpenClaw 的内置摘要功能。插件引擎可以实现任何压缩策略（DAG 摘要、向量检索等）。
  </Accordion>
  <Accordion title="记忆插件">
    记忆插件（`plugins.slots.memory`）与上下文引擎相互独立。记忆插件提供搜索/检索；上下文引擎控制模型看到的内容。它们可以协同工作——上下文引擎可能会在组装过程中使用记忆插件数据。想使用主动记忆提示路径的插件引擎，应优先使用 `openclaw/plugin-sdk/core` 中的 `buildMemorySystemPromptAddition(...)`，它会将主动记忆提示部分转换为可直接前置的 `systemPromptAddition`。如果引擎需要更底层的控制，仍可通过 `buildActiveMemoryPromptSection(...)` 从 `openclaw/plugin-sdk/memory-host-core` 拉取原始行。
  </Accordion>
  <Accordion title="会话裁剪">
    无论当前启用哪个上下文引擎，内存中旧工具结果的裁剪仍会运行。
  </Accordion>
</AccordionGroup>

## 提示

- 使用 `openclaw doctor` 验证你的引擎是否正确加载。
- 如果切换引擎，现有会话会继续使用其当前历史记录。新引擎会接管未来的运行。
- 引擎错误会被记录并显示在诊断信息中。如果插件引擎注册失败，或选定的引擎 id 无法解析，OpenClaw 不会自动回退；运行会失败，直到你修复该插件或将 `plugins.slots.contextEngine` 切回 `"legacy"`。
- 开发时，使用 `openclaw plugins install -l ./my-engine` 链接本地插件目录，而无需复制。

## 相关内容

- [压缩](/zh-CN/concepts/compaction) — 总结较长的对话
- [上下文](/zh-CN/concepts/context) — 如何为智能体轮次构建上下文
- [插件架构](/zh-CN/plugins/architecture) — 注册上下文引擎插件
- [插件清单](/zh-CN/plugins/manifest) — 插件清单字段
- [插件](/zh-CN/tools/plugin) — 插件概览
