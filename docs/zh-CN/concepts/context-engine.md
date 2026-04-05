---
read_when:
    - 你想了解 OpenClaw 如何组装模型上下文
    - 你正在旧版引擎和插件引擎之间切换
    - 你正在构建一个上下文引擎插件
summary: 上下文引擎：可插拔的上下文组装、压缩和子智能体生命周期
title: 上下文引擎
x-i18n:
    generated_at: "2026-04-05T08:21:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 19fd8cbb0e953f58fd84637fc4ceefc65984312cf2896d338318bc8cf860e6d9
    source_path: concepts/context-engine.md
    workflow: 15
---

# 上下文引擎

**上下文引擎**控制 OpenClaw 如何为每次运行构建模型上下文。
它决定包含哪些消息、如何总结较早的历史，以及
如何跨子智能体边界管理上下文。

OpenClaw 内置了一个 `legacy` 引擎。插件可以注册
替代引擎，用来替换当前活动的上下文引擎生命周期。

## 快速开始

检查当前活动的是哪个引擎：

```bash
openclaw doctor
# 或直接检查配置：
cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
```

### 安装上下文引擎插件

上下文引擎插件的安装方式与其他 OpenClaw 插件相同。先安装，
再在槽位中选择该引擎：

```bash
# 从 npm 安装
openclaw plugins install @martian-engineering/lossless-claw

# 或从本地路径安装（用于开发）
openclaw plugins install -l ./my-context-engine
```

然后在配置中启用该插件，并将其选为活动引擎：

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
        // 插件特定配置放在这里（参见该插件的文档）
      },
    },
  },
}
```

安装并配置后，重启 Gateway 网关。

要切换回内置引擎，将 `contextEngine` 设为 `"legacy"`（或者
直接删除该键——`"legacy"` 是默认值）。

## 工作原理

每次 OpenClaw 运行一次模型提示时，上下文引擎都会参与
四个生命周期节点：

1. **摄取** — 当新消息被添加到会话时调用。引擎
   可以将该消息存储或索引到它自己的数据存储中。
2. **组装** — 在每次模型运行之前调用。引擎返回一个有序
   消息集合（以及一个可选的 `systemPromptAddition`），并确保其适配
   token 预算。
3. **压缩** — 当上下文窗口已满，或用户运行
   `/compact` 时调用。引擎会总结较旧的历史以释放空间。
4. **轮次后** — 在一次运行完成后调用。引擎可以持久化状态、
   触发后台压缩，或更新索引。

### 子智能体生命周期（可选）

OpenClaw 当前会调用一个子智能体生命周期 hook：

- **onSubagentEnded** — 当子智能体会话完成或被清理时进行清理。

`prepareSubagentSpawn` hook 是接口的一部分，供未来使用，但
运行时尚未调用它。

### 系统提示附加内容

`assemble` 方法可以返回一个 `systemPromptAddition` 字符串。OpenClaw
会将其前置到本次运行的系统提示中。这使引擎能够注入
动态召回指引、检索说明或上下文感知提示，
而无需依赖静态工作区文件。

## 旧版引擎

内置的 `legacy` 引擎保留了 OpenClaw 的原始行为：

- **摄取**：无操作（会话管理器直接处理消息持久化）。
- **组装**：直通（运行时中的现有 sanitize → validate → limit 流程
  负责上下文组装）。
- **压缩**：委托给内置的总结式压缩，它会创建
  一条较旧消息的摘要，并保留最近消息不变。
- **轮次后**：无操作。

旧版引擎不会注册工具，也不会提供 `systemPromptAddition`。

当未设置 `plugins.slots.contextEngine`（或其值为 `"legacy"`）时，
会自动使用该引擎。

## 插件引擎

插件可以使用插件 API 注册一个上下文引擎：

```ts
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

    async assemble({ sessionId, messages, tokenBudget }) {
      // 返回适配预算的消息
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: "Use lcm_grep to search history...",
      };
    },

    async compact({ sessionId, force }) {
      // 总结较旧上下文
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

| Member             | Kind     | Purpose                              |
| ------------------ | -------- | ------------------------------------ |
| `info`             | Property | 引擎 id、名称、版本，以及它是否拥有压缩控制权 |
| `ingest(params)`   | Method   | 存储单条消息                         |
| `assemble(params)` | Method   | 为模型运行构建上下文（返回 `AssembleResult`） |
| `compact(params)`  | Method   | 总结/缩减上下文                      |

`assemble` 返回一个 `AssembleResult`，其中包含：

- `messages` —— 要发送给模型的有序消息。
- `estimatedTokens`（必填，`number`）—— 引擎对
  已组装上下文总 token 数的估计。OpenClaw 会用它来进行压缩阈值
  决策和诊断报告。
- `systemPromptAddition`（可选，`string`）—— 前置到系统提示中的附加内容。

可选成员：

| Member                         | Kind   | Purpose                                                                                         |
| ------------------------------ | ------ | ----------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Method | 为一个会话初始化引擎状态。当引擎首次看到某个会话时调用一次（例如导入历史）。 |
| `ingestBatch(params)`          | Method | 以批处理方式摄取一个已完成轮次。一次运行完成后调用，其中包含该轮次的全部消息。     |
| `afterTurn(params)`            | Method | 运行后的生命周期工作（持久化状态、触发后台压缩）。                                         |
| `prepareSubagentSpawn(params)` | Method | 为子会话设置共享状态。                                                                        |
| `onSubagentEnded(params)`      | Method | 在子智能体结束后执行清理。                                                                                 |
| `dispose()`                    | Method | 释放资源。在 Gateway 网关关闭或插件重载期间调用——不是按会话调用。                           |

### ownsCompaction

`ownsCompaction` 控制 Pi 内置的尝试内自动压缩是否在本次运行中
保持启用：

- `true` —— 该引擎拥有压缩行为的控制权。OpenClaw 会禁用 Pi 内置的
  本次运行自动压缩，而引擎的 `compact()` 实现需要负责 `/compact`、溢出恢复压缩，以及它希望在 `afterTurn()` 中执行的任何主动
  压缩。
- `false` 或未设置 —— Pi 内置的自动压缩在提示
  执行期间仍可能运行，但活动引擎的 `compact()` 方法仍会在
  `/compact` 和溢出恢复时被调用。

`ownsCompaction: false` **并不**意味着 OpenClaw 会自动回退到
旧版引擎的压缩路径。

这意味着插件有两种有效模式：

- **接管模式** —— 实现你自己的压缩算法，并设置
  `ownsCompaction: true`。
- **委托模式** —— 设置 `ownsCompaction: false`，并让 `compact()` 调用
  `openclaw/plugin-sdk/core` 中的 `delegateCompactionToRuntime(...)`，以使用
  OpenClaw 内置的压缩行为。

对于一个活动的非接管型引擎来说，无操作的 `compact()` 是不安全的，因为它
会为该引擎槽位禁用正常的 `/compact` 和溢出恢复压缩路径。

## 配置参考

```json5
{
  plugins: {
    slots: {
      // 选择当前活动的上下文引擎。默认值："legacy"。
      // 设为某个插件 id 以使用插件引擎。
      contextEngine: "legacy",
    },
  },
}
```

该槽位在运行时是互斥的——对于给定的一次运行或压缩操作，
只会解析一个已注册的上下文引擎。其他已启用的
`kind: "context-engine"` 插件仍然可以加载并运行它们的注册
代码；`plugins.slots.contextEngine` 只决定当 OpenClaw
需要上下文引擎时，会解析哪个已注册的引擎 id。

## 与压缩和记忆的关系

- **压缩**是上下文引擎的一项职责。旧版引擎
  委托给 OpenClaw 内置的总结功能。插件引擎可以实现
  任意压缩策略（DAG 摘要、向量检索等）。
- **记忆插件**（`plugins.slots.memory`）与上下文引擎是分开的。
  记忆插件提供搜索/检索；上下文引擎控制
  模型能看到什么。它们可以协同工作——上下文引擎可能会在组装期间使用记忆
  插件的数据。
- **会话修剪**（在内存中裁剪旧工具结果）仍会运行，
  无论当前活动的是哪个上下文引擎。

## 提示

- 使用 `openclaw doctor` 验证你的引擎是否正确加载。
- 如果正在切换引擎，现有会话会继续保留其当前历史。
  新引擎会接管后续运行。
- 引擎错误会被记录并显示在诊断信息中。如果某个插件引擎
  注册失败，或无法解析所选引擎 id，OpenClaw
  不会自动回退；在你修复插件或将
  `plugins.slots.contextEngine` 切回 `"legacy"` 之前，运行都会失败。
- 在开发时，使用 `openclaw plugins install -l ./my-engine` 将本地
  插件目录以链接方式接入，而无需复制。

另请参阅：[压缩](/concepts/compaction)、[上下文](/concepts/context)、
[插件](/tools/plugin)、[插件清单](/plugins/manifest)。

## 相关

- [上下文](/concepts/context) — 如何为智能体轮次构建上下文
- [插件架构](/plugins/architecture) — 注册上下文引擎插件
- [压缩](/concepts/compaction) — 总结长对话
