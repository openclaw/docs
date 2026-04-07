---
read_when:
    - 你想了解 OpenClaw 如何组装模型上下文
    - 你正在旧版引擎和插件引擎之间切换
    - 你正在构建一个上下文引擎插件
summary: 上下文引擎：可插拔的上下文组装、压缩和子智能体生命周期
title: 上下文引擎
x-i18n:
    generated_at: "2026-04-07T08:01:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: e8290ac73272eee275bce8e481ac7959b65386752caa68044d0c6f3e450acfb1
    source_path: concepts/context-engine.md
    workflow: 15
---

# 上下文引擎

**上下文引擎**控制 OpenClaw 如何为每次运行构建模型上下文。
它决定包含哪些消息、如何总结较早的历史记录，以及如何跨子智能体边界管理上下文。

OpenClaw 内置了一个 `legacy` 引擎。插件可以注册其他引擎，以替换当前激活的上下文引擎生命周期。

## 快速开始

检查当前激活的是哪个引擎：

```bash
openclaw doctor
# or inspect config directly:
cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
```

### 安装上下文引擎插件

上下文引擎插件的安装方式与其他 OpenClaw 插件相同。先安装，然后在槽位中选择该引擎：

```bash
# Install from npm
openclaw plugins install @martian-engineering/lossless-claw

# Or install from a local path (for development)
openclaw plugins install -l ./my-context-engine
```

然后在配置中启用该插件，并将其选为当前激活的引擎：

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

安装并配置完成后，重启 Gateway 网关。

如果要切回内置引擎，将 `contextEngine` 设置为 `"legacy"`（或完全删除该键——`"legacy"` 是默认值）。

## 工作原理

每次 OpenClaw 运行模型提示时，上下文引擎都会参与四个生命周期节点：

1. **摄取**——当新消息被添加到会话时调用。引擎可以将该消息存储或索引到它自己的数据存储中。
2. **组装**——在每次模型运行前调用。引擎返回一组有序消息（以及可选的 `systemPromptAddition`），这些内容会适配令牌预算。
3. **压缩**——当上下文窗口已满，或用户运行 `/compact` 时调用。引擎会总结较早的历史记录以释放空间。
4. **回合后**——在一次运行完成后调用。引擎可以持久化状态、触发后台压缩，或更新索引。

### 子智能体生命周期（可选）

OpenClaw 当前会调用一个子智能体生命周期钩子：

- **onSubagentEnded**——当子智能体会话完成或被清扫时执行清理。

`prepareSubagentSpawn` 钩子是接口的一部分，供未来使用，但运行时目前尚未调用它。

### 系统提示附加内容

`assemble` 方法可以返回一个 `systemPromptAddition` 字符串。OpenClaw 会将它预先添加到本次运行的系统提示前面。这样，引擎就可以注入动态回忆指引、检索说明或上下文感知提示，而无需依赖静态工作区文件。

## legacy 引擎

内置的 `legacy` 引擎保留了 OpenClaw 的原始行为：

- **摄取**：空操作（消息持久化直接由会话管理器处理）。
- **组装**：直接透传（运行时中的现有 sanitize → validate → limit 流水线负责上下文组装）。
- **压缩**：委托给内置的总结式压缩机制，它会为较早的消息创建单个摘要，并保留最近的消息不变。
- **回合后**：空操作。

legacy 引擎不会注册工具，也不会提供 `systemPromptAddition`。

当未设置 `plugins.slots.contextEngine`（或将其设置为 `"legacy"`）时，会自动使用此引擎。

## 插件引擎

插件可以使用插件 API 注册一个上下文引擎：

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

| Member             | Kind     | Purpose                                                  |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | Property | 引擎 id、名称、版本，以及它是否负责压缩 |
| `ingest(params)`   | Method   | 存储单条消息 |
| `assemble(params)` | Method   | 为一次模型运行构建上下文（返回 `AssembleResult`） |
| `compact(params)`  | Method   | 总结/缩减上下文 |

`assemble` 返回一个 `AssembleResult`，包含：

- `messages`——要发送给模型的有序消息。
- `estimatedTokens`（必需，`number`）——引擎对组装后上下文总令牌数的估算。OpenClaw 会将它用于压缩阈值判断和诊断报告。
- `systemPromptAddition`（可选，`string`）——预先添加到系统提示之前的内容。

可选成员：

| Member                         | Kind   | Purpose                                                                                                         |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Method | 为会话初始化引擎状态。首次看到某个会话时调用一次（例如导入历史记录）。 |
| `ingestBatch(params)`          | Method | 以批处理方式摄取一个已完成的回合。在一次运行完成后调用，并一次性提供该回合中的所有消息。 |
| `afterTurn(params)`            | Method | 运行后的生命周期工作（持久化状态、触发后台压缩）。 |
| `prepareSubagentSpawn(params)` | Method | 为子会话设置共享状态。 |
| `onSubagentEnded(params)`      | Method | 在子智能体结束后执行清理。 |
| `dispose()`                    | Method | 释放资源。在 Gateway 网关关闭或插件重载时调用——不是按会话调用。 |

### ownsCompaction

`ownsCompaction` 控制 Pi 内置的尝试内自动压缩是否在本次运行中保持启用：

- `true`——该引擎负责压缩行为。OpenClaw 会为该次运行禁用 Pi 的内置自动压缩，而引擎的 `compact()` 实现需要负责 `/compact`、溢出恢复压缩，以及它希望在 `afterTurn()` 中执行的任何主动压缩。
- `false` 或未设置——Pi 的内置自动压缩在提示执行期间仍可能运行，但当前激活引擎的 `compact()` 方法仍会用于 `/compact` 和溢出恢复。

`ownsCompaction: false` **不**意味着 OpenClaw 会自动回退到 legacy 引擎的压缩路径。

这意味着插件有两种有效模式：

- **自主管理模式**——实现你自己的压缩算法，并设置 `ownsCompaction: true`。
- **委托模式**——设置 `ownsCompaction: false`，并让 `compact()` 调用 `openclaw/plugin-sdk/core` 中的 `delegateCompactionToRuntime(...)`，以使用 OpenClaw 的内置压缩行为。

对于一个处于激活状态、但不自主管理压缩的引擎来说，空操作 `compact()` 是不安全的，因为它会禁用该引擎槽位的正常 `/compact` 和溢出恢复压缩路径。

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

该槽位在运行时是互斥的——对于给定的一次运行或压缩操作，只会解析一个已注册的上下文引擎。其他已启用的 `kind: "context-engine"` 插件仍然可以加载并运行其注册代码；`plugins.slots.contextEngine` 只决定当 OpenClaw 需要上下文引擎时，解析哪个已注册的引擎 id。

## 与压缩和记忆的关系

- **压缩**是上下文引擎的一项职责。legacy 引擎会委托给 OpenClaw 的内置总结机制。插件引擎可以实现任何压缩策略（DAG 摘要、向量检索等）。
- **记忆插件**（`plugins.slots.memory`）与上下文引擎是分开的。记忆插件提供搜索/检索；上下文引擎控制模型能看到什么。它们可以协同工作——上下文引擎可能会在组装期间使用记忆插件数据。想使用当前激活记忆提示路径的插件引擎，应优先使用 `openclaw/plugin-sdk/core` 中的 `buildMemorySystemPromptAddition(...)`，它会将当前激活的记忆提示片段转换为可直接预加的 `systemPromptAddition`。如果引擎需要更底层的控制，它仍然可以通过 `openclaw/plugin-sdk/memory-host-core` 中的 `buildActiveMemoryPromptSection(...)` 拉取原始行。
- **会话修剪**（在内存中裁剪旧的工具结果）仍会运行，无论当前激活的是哪个上下文引擎。

## 提示

- 使用 `openclaw doctor` 验证你的引擎是否正确加载。
- 如果你正在切换引擎，现有会话会继续保留其当前历史记录。新引擎会接管未来的运行。
- 引擎错误会被记录并显示在诊断信息中。如果插件引擎注册失败，或无法解析所选的引擎 id，OpenClaw 不会自动回退；在你修复插件或将 `plugins.slots.contextEngine` 切回 `"legacy"` 之前，运行将会失败。
- 在开发时，使用 `openclaw plugins install -l ./my-engine` 可以链接本地插件目录，而无需复制。

另请参阅：[压缩](/zh-CN/concepts/compaction)、[上下文](/zh-CN/concepts/context)、[插件](/zh-CN/tools/plugin)、[插件清单](/zh-CN/plugins/manifest)。

## 相关

- [上下文](/zh-CN/concepts/context)——如何为智能体回合构建上下文
- [插件架构](/zh-CN/plugins/architecture)——注册上下文引擎插件
- [压缩](/zh-CN/concepts/compaction)——总结长对话
