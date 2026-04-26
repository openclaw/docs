---
read_when:
    - 你想了解 OpenClaw 如何组装模型上下文
    - 你正在旧版引擎和插件引擎之间切换
    - 你正在构建上下文引擎插件
sidebarTitle: Context engine
summary: 上下文引擎：可插拔的上下文组装、压缩和子智能体生命周期
title: 上下文引擎
x-i18n:
    generated_at: "2026-04-26T06:20:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: b4c7c868e6e1316ae64fe971eabd8e0d35daab05dbb7abfae4a72f8f5e32e5fc
    source_path: concepts/context-engine.md
    workflow: 15
---

**上下文引擎**控制 OpenClaw 如何为每次运行构建模型上下文：包含哪些消息、如何总结较早的历史记录，以及如何在子智能体边界之间管理上下文。

OpenClaw 内置了 `legacy` 引擎，并默认使用它——大多数用户永远不需要更改。只有当你想要不同的组装、压缩或跨会话召回行为时，才需要安装并选择插件引擎。

## 快速开始

<Steps>
  <Step title="检查当前启用了哪个引擎">
    ```bash
    openclaw doctor
    # 或直接检查配置：
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="安装插件引擎">
    上下文引擎插件和其他任何 OpenClaw 插件一样安装。

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
          contextEngine: "lossless-claw", // 必须与插件注册的引擎 id 匹配
        },
        entries: {
          "lossless-claw": {
            enabled: true,
            // 插件专用配置放在这里（参见插件文档）
          },
        },
      },
    }
    ```

    安装并配置后，重启 Gateway 网关。

  </Step>
  <Step title="切换回 legacy（可选）">
    将 `contextEngine` 设置为 `"legacy"`（或者完全移除该键——`"legacy"` 是默认值）。
  </Step>
</Steps>

## 工作原理

每次 OpenClaw 运行模型提示时，上下文引擎都会参与四个生命周期节点：

<AccordionGroup>
  <Accordion title="1. 摄取">
    当新消息添加到会话时调用。引擎可以将该消息存储或索引到它自己的数据存储中。
  </Accordion>
  <Accordion title="2. 组装">
    在每次模型运行前调用。引擎返回一组按顺序排列、适合令牌预算的消息（以及可选的 `systemPromptAddition`）。
  </Accordion>
  <Accordion title="3. 压缩">
    当上下文窗口已满，或用户运行 `/compact` 时调用。引擎会总结较早的历史记录以释放空间。
  </Accordion>
  <Accordion title="4. 回合结束后">
    在一次运行完成后调用。引擎可以持久化状态、触发后台压缩或更新索引。
  </Accordion>
</AccordionGroup>

对于内置的非 ACP Codex harness，OpenClaw 会通过将组装好的上下文投射到 Codex 开发者指令和当前回合提示中，应用相同的生命周期。Codex 仍然管理其原生线程历史和原生压缩器。

### 子智能体生命周期（可选）

OpenClaw 会调用两个可选的子智能体生命周期钩子：

<ParamField path="prepareSubagentSpawn" type="method">
  在子运行开始前准备共享上下文状态。该钩子接收父/子会话键、`contextMode`（`isolated` 或 `fork`）、可用的转录 id/文件以及可选的 TTL。如果它返回一个回滚句柄，OpenClaw 会在准备成功后但 spawn 失败时调用它。
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  在子智能体会话完成或被清理时执行清理。
</ParamField>

### 系统提示补充

`assemble` 方法可以返回一个 `systemPromptAddition` 字符串。OpenClaw 会将它前置到本次运行的系统提示中。这使引擎能够注入动态召回指导、检索指令或上下文感知提示，而不需要依赖静态工作区文件。

## legacy 引擎

内置的 `legacy` 引擎保留了 OpenClaw 的原始行为：

- **摄取**：无操作（会话管理器直接处理消息持久化）。
- **组装**：直通（运行时中现有的 sanitize → validate → limit 流水线负责上下文组装）。
- **压缩**：委托给内置的总结式压缩，它会对较早消息生成单一摘要，并保持最近消息不变。
- **回合结束后**：无操作。

legacy 引擎不会注册工具，也不会提供 `systemPromptAddition`。

当未设置 `plugins.slots.contextEngine`（或者将其设置为 `"legacy"`）时，会自动使用该引擎。

## 插件引擎

插件可以使用插件 API 注册上下文引擎：

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function register(api) {
  api.registerContextEngine("my-engine", () => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // 将消息存储到你的数据存储中
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget, availableTools, citationsMode }) {
      // 返回适合预算的消息
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
      // 总结较早的上下文
      return { ok: true, compacted: true };
    },
  }));
}
```

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

| 成员               | 类型   | 用途 |
| ------------------ | ------ | ---- |
| `info`             | 属性   | 引擎 id、名称、版本，以及它是否拥有压缩控制权 |
| `ingest(params)`   | 方法   | 存储单条消息 |
| `assemble(params)` | 方法   | 为模型运行构建上下文（返回 `AssembleResult`） |
| `compact(params)`  | 方法   | 总结/缩减上下文 |

`assemble` 返回一个 `AssembleResult`，包含：

<ParamField path="messages" type="Message[]" required>
  要发送给模型的按顺序排列的消息。
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  引擎对组装后上下文总令牌数的估算。OpenClaw 使用它来做压缩阈值决策和诊断报告。
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  前置到系统提示中。
</ParamField>

可选成员：

| 成员                           | 类型   | 用途 |
| ------------------------------ | ------ | ---- |
| `bootstrap(params)`            | 方法   | 为会话初始化引擎状态。当引擎首次看到某个会话时调用一次（例如导入历史记录）。 |
| `ingestBatch(params)`          | 方法   | 以批处理方式摄取一个已完成回合。在一次运行完成后调用，并一次性传入该回合的所有消息。 |
| `afterTurn(params)`            | 方法   | 运行后的生命周期工作（持久化状态、触发后台压缩）。 |
| `prepareSubagentSpawn(params)` | 方法   | 在子会话开始前为其设置共享状态。 |
| `onSubagentEnded(params)`      | 方法   | 在子智能体结束后清理。 |
| `dispose()`                    | 方法   | 释放资源。在 Gateway 网关关闭或插件重载期间调用——不是针对每个会话调用。 |

### ownsCompaction

`ownsCompaction` 控制 Pi 的内置“尝试内自动压缩”是否在本次运行中保持启用：

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    该引擎拥有压缩行为。OpenClaw 会在该次运行中禁用 Pi 的内置自动压缩，而引擎的 `compact()` 实现需要负责 `/compact`、溢出恢复压缩，以及它希望在 `afterTurn()` 中执行的任何主动压缩。OpenClaw 仍可能运行提示前溢出保护；当它预测完整转录会溢出时，恢复路径会在提交另一个提示之前调用当前活动引擎的 `compact()`。
  </Accordion>
  <Accordion title="ownsCompaction: false or unset">
    Pi 的内置自动压缩在提示执行期间仍可能运行，但当前活动引擎的 `compact()` 方法仍会被用于 `/compact` 和溢出恢复。
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **并不**意味着 OpenClaw 会自动回退到 legacy 引擎的压缩路径。
</Warning>

这意味着有两种有效的插件模式：

<Tabs>
  <Tab title="拥有模式">
    实现你自己的压缩算法，并设置 `ownsCompaction: true`。
  </Tab>
  <Tab title="委托模式">
    设置 `ownsCompaction: false`，并让 `compact()` 调用 `openclaw/plugin-sdk/core` 中的 `delegateCompactionToRuntime(...)`，以使用 OpenClaw 的内置压缩行为。
  </Tab>
</Tabs>

对于处于活动状态且非 owning 的引擎，空操作的 `compact()` 是不安全的，因为它会禁用该引擎槽位的正常 `/compact` 和溢出恢复压缩路径。

## 配置参考

```json5
{
  plugins: {
    slots: {
      // 选择当前活动的上下文引擎。默认值："legacy"。
      // 设置为某个插件 id 以使用插件引擎。
      contextEngine: "legacy",
    },
  },
}
```

<Note>
该槽位在运行时是互斥的——对于给定的一次运行或压缩操作，只会解析一个已注册的上下文引擎。其他已启用的 `kind: "context-engine"` 插件仍然可以加载并运行它们的注册代码；`plugins.slots.contextEngine` 只是在 OpenClaw 需要上下文引擎时，选择要解析的已注册引擎 id。
</Note>

## 与压缩和内存的关系

<AccordionGroup>
  <Accordion title="压缩">
    压缩是上下文引擎的一项职责。legacy 引擎会委托给 OpenClaw 的内置总结机制。插件引擎可以实现任何压缩策略（DAG 摘要、向量检索等）。
  </Accordion>
  <Accordion title="内存插件">
    内存插件（`plugins.slots.memory`）与上下文引擎是分开的。内存插件提供搜索/检索；上下文引擎控制模型能看到什么。两者可以协同工作——上下文引擎可以在组装期间使用内存插件数据。想要使用活动内存提示路径的插件引擎，应优先使用 `openclaw/plugin-sdk/core` 中的 `buildMemorySystemPromptAddition(...)`，它会将当前活动的内存提示片段转换为可直接前置的 `systemPromptAddition`。如果引擎需要更底层的控制，它仍然可以通过 `openclaw/plugin-sdk/memory-host-core` 中的 `buildActiveMemoryPromptSection(...)` 拉取原始行。
  </Accordion>
  <Accordion title="会话裁剪">
    无论当前活动的是哪个上下文引擎，内存中对旧工具结果的裁剪仍会照常运行。
  </Accordion>
</AccordionGroup>

## 提示

- 使用 `openclaw doctor` 验证你的引擎是否正确加载。
- 如果切换引擎，现有会话会继续使用它们当前的历史记录。新引擎会接管未来的运行。
- 引擎错误会被记录并显示在诊断信息中。如果插件引擎注册失败，或者无法解析所选引擎 id，OpenClaw 不会自动回退；在你修复插件或将 `plugins.slots.contextEngine` 切回 `"legacy"` 之前，运行会失败。
- 在开发时，使用 `openclaw plugins install -l ./my-engine` 可链接本地插件目录而无需复制。

## 相关内容

- [压缩](/zh-CN/concepts/compaction) — 总结长对话
- [上下文](/zh-CN/concepts/context) — 如何为智能体回合构建上下文
- [插件架构](/zh-CN/plugins/architecture) — 注册上下文引擎插件
- [插件清单](/zh-CN/plugins/manifest) — 插件清单字段
- [插件](/zh-CN/tools/plugin) — 插件概览
