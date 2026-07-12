---
read_when:
    - 你想了解 OpenClaw 如何组装模型上下文
    - 你正在旧版引擎和插件引擎之间切换
    - 你正在构建一个上下文引擎插件
sidebarTitle: Context engine
summary: 上下文引擎：可插拔的上下文组装、压缩和子智能体生命周期
title: 上下文引擎
x-i18n:
    generated_at: "2026-07-12T14:24:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 05cb5eb01f002001354dc63b77cdb86f3e9f3bc51722bd943ac20c9e1566dc60
    source_path: concepts/context-engine.md
    workflow: 16
---

**上下文引擎**控制 OpenClaw 如何为每次运行构建模型上下文：包括哪些消息、如何总结较早的历史记录，以及如何跨子智能体边界管理上下文。

OpenClaw 内置 `legacy` 引擎，并默认使用该引擎。仅当你需要不同的组装、压缩或跨会话回忆行为时，才安装并选择插件引擎。

## 快速开始

<Steps>
  <Step title="检查当前使用的引擎">
    ```bash
    openclaw doctor
    # 或直接检查配置：
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
          contextEngine: "lossless-claw", // 必须与插件注册的引擎 id 匹配
        },
        entries: {
          "lossless-claw": {
            enabled: true,
            // 在此处填写插件专用配置（请参阅插件文档）
          },
        },
      },
    }
    ```

    安装并配置后，重启 Gateway 网关。

  </Step>
  <Step title="切换回 legacy（可选）">
    将 `contextEngine` 设置为 `"legacy"`（或完全移除该键——`"legacy"` 是默认值）。
  </Step>
</Steps>

## 工作原理

每当 OpenClaw 运行模型提示词时，上下文引擎都会参与四个生命周期阶段：

<AccordionGroup>
  <Accordion title="1. 摄取">
    当新消息添加到会话时调用。引擎可以将消息存储到自己的数据存储中或为其建立索引。
  </Accordion>
  <Accordion title="2. 组装">
    在每次模型运行前调用。引擎返回一组有序消息（以及可选的 `systemPromptAddition`），这些内容需符合 token 预算。
  </Accordion>
  <Accordion title="3. 压缩">
    当上下文窗口已满或用户运行 `/compact` 时调用。引擎会总结较早的历史记录以释放空间。
  </Accordion>
  <Accordion title="4. 轮次结束后">
    在运行完成后调用。引擎可以持久化状态、触发后台压缩或更新索引。
  </Accordion>
</AccordionGroup>

引擎还可以实现可选的 `maintain()` 方法，用于在引导、成功完成一个轮次或压缩后维护对话记录（通过 `runtimeContext.rewriteTranscriptEntries()` 安全重写）。设置 `info.turnMaintenanceMode: "background"` 可将其作为延迟任务运行，而不是阻塞回复。

对于内置的非 ACP Codex harness，OpenClaw 通过将组装后的上下文投影到 Codex 开发者指令和当前轮次提示词中，应用相同的生命周期。Codex 仍负责管理其原生线程历史记录和原生压缩器。

### 子智能体生命周期（可选）

OpenClaw 会调用两个可选的子智能体生命周期钩子：

<ParamField path="prepareSubagentSpawn" type="method">
  在子运行开始前准备共享上下文状态。该钩子会接收父会话和子会话键、`contextMode`（`isolated` 或 `fork`）、可用的对话记录 id/文件以及可选的 TTL。如果该钩子返回回滚句柄，且生成操作在准备成功后失败，OpenClaw 将调用该句柄。当原生子智能体生成请求使用 `lightContext` 并解析为 `contextMode="isolated"` 时，会有意跳过此钩子，以便子智能体从轻量级引导上下文开始，而不使用由上下文引擎管理的生成前状态。
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  在子智能体会话完成或被清理时执行清理。
</ParamField>

### 系统提示词附加内容

`assemble` 方法可以返回 `systemPromptAddition` 字符串。OpenClaw 会将其添加到本次运行的系统提示词之前。这样，引擎无需静态工作区文件，即可注入动态回忆指导、检索指令或上下文感知提示。

## legacy 引擎

内置的 `legacy` 引擎保留 OpenClaw 的原始行为：

- **摄取**：不执行操作（会话管理器直接处理消息持久化）。
- **组装**：直接传递（由运行时中现有的清理 → 验证 → 限制流水线处理上下文组装）。
- **压缩**：委托给内置的摘要压缩功能，该功能会为较早的消息创建单一摘要，并完整保留近期消息。
- **轮次结束后**：不执行操作。

legacy 引擎不会注册工具，也不提供 `systemPromptAddition`。

未设置 `plugins.slots.contextEngine`（或将其设置为 `"legacy"`）时，会自动使用此引擎。

## 插件引擎

插件可以使用插件 API 注册上下文引擎：

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";
import { resolveSessionAgentId } from "openclaw/plugin-sdk/memory-host-core";

export default function register(api) {
  api.registerContextEngine("my-engine", (ctx) => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // 将消息存储到你的数据存储中
      return { ingested: true };
    },

    async assemble({
      sessionId,
      sessionKey,
      messages,
      tokenBudget,
      availableTools,
      citationsMode,
    }) {
      // 返回符合预算的消息
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
          agentId: resolveSessionAgentId({ config: ctx.config, sessionKey }),
          agentSessionKey: sessionKey,
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

工厂函数的 `ctx` 包含可选的 `config`、`agentDir` 和 `workspaceDir`
值，以便插件在第一个生命周期钩子运行前初始化每个智能体或每个工作区的状态。

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

| 成员               | 类型 | 用途                                         |
| ------------------ | ---- | -------------------------------------------- |
| `info`             | 属性 | 引擎 id、名称、版本，以及是否负责压缩        |
| `ingest(params)`   | 方法 | 存储单条消息                                 |
| `assemble(params)` | 方法 | 为模型运行构建上下文（返回 `AssembleResult`） |
| `compact(params)`  | 方法 | 总结或缩减上下文                             |

`assemble` 返回包含以下内容的 `AssembleResult`：

<ParamField path="messages" type="Message[]" required>
  要发送给模型的有序消息。
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  引擎对组装后上下文中 token 总数的估算。OpenClaw 使用此值进行压缩阈值决策和诊断报告。
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  添加到系统提示词之前。
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  控制运行器在主动溢出预检查中使用哪个 token 估算值。默认为
  `"assembled"`，这意味着对于不负责压缩的引擎，仅检查组装后
  提示词的估算值。设置了 `ownsCompaction: true` 的引擎自行管理
  提示词准入，因此 OpenClaw 默认跳过通用的提示词运行前预检查。仅当
  组装后的视图可能隐藏底层对话记录中的溢出风险时，才设置
  `"preassembly_may_overflow"`；此时运行器会保持通用预检查启用，并在
  决定是否主动压缩时，取组装后估算值与组装前（未窗口化）会话历史记录
  估算值中的较大值。无论采用哪种方式，你返回的消息仍是模型实际看到的
  内容——`promptAuthority` 只影响预检查。
</ParamField>
<ParamField path="contextProjection" type="ContextEngineProjection">
  为具有持久化后端线程的宿主（例如 Codex app-server）提供的可选投影生命周期。使用稳定 `epoch` 的 `mode: "thread_bootstrap"` 会要求宿主在每个 epoch 中仅注入一次组装后的上下文，并持续复用后端线程，直到 epoch 发生变化，而不是在每个轮次中重新投影。常规的逐轮次投影请省略此字段。
</ParamField>

`compact` 返回 `CompactResult`。当压缩改变活动会话
标识时，`result.sessionTarget`（携带会话标识和存储范围的类型化
`ContextEngineSessionTarget`）会标识下一次重试或轮次必须使用的
后继会话；`result.sessionId` 会映射后继会话的 id。

可选成员：

| 成员                           | 类型 | 用途                                                                                                     |
| ------------------------------ | ---- | -------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | 方法 | 为会话初始化引擎状态。当引擎首次看到某个会话时调用一次（例如导入历史记录）。                             |
| `maintain(params)`             | 方法 | 在引导、成功完成一个轮次或压缩后维护对话记录。使用 `runtimeContext.rewriteTranscriptEntries()` 安全重写。 |
| `ingestBatch(params)`          | 方法 | 将已完成的轮次作为一个批次摄取。在运行完成后调用，一次接收该轮次中的所有消息。                           |
| `afterTurn(params)`            | 方法 | 运行后的生命周期工作（持久化状态、触发后台压缩）。                                                       |
| `prepareSubagentSpawn(params)` | 方法 | 在子会话开始前为其设置共享状态。                                                                         |
| `onSubagentEnded(params)`      | 方法 | 在子智能体结束后执行清理。                                                                               |
| `dispose()`                    | 方法 | 释放资源。在 Gateway 网关关闭或插件重新加载期间调用，而不是按会话调用。                                  |

### 运行时设置

在 OpenClaw 内运行的生命周期钩子会接收一个可选的
`runtimeSettings` 对象。它是一个带版本号的只读内部
生产者/消费者 API 接口：OpenClaw 为所选的上下文引擎生成该对象，
上下文引擎在生命周期钩子中使用它。它不会直接呈现给用户，
也不会创建专用的报告界面。

- `schemaVersion`：当前为 `1`
- `runtime`：OpenClaw 宿主、运行时模式（`normal`、`fallback` 或
  `degraded`），以及可选的 harness/运行时 id
- `contextEngineSelection`：所选上下文引擎的 id 和选择来源
- `executionHost`：调用该钩子的界面的宿主 id 和标签
- `model`：请求的模型、解析后的模型、提供商和可选的模型系列
- `limits`：已知时的提示词 token 预算和最大输出 token 数
- `diagnostics`：已知时的封闭式回退和降级原因代码

可为未知的字段以 `null` 表示；运行时模式和选择来源等判别字段仍不可为 null。旧版引擎仍保持兼容：如果严格的旧版引擎因 `runtimeSettings` 是未知属性而拒绝调用，OpenClaw 会在不传递该属性的情况下重试生命周期调用，而不是隔离该引擎。

### 主机要求

上下文引擎可以在 `info.hostRequirements` 中声明主机能力要求。OpenClaw 会在开始操作前检查这些要求；当所选运行时无法满足要求时，会以描述性错误进行故障关闭。

对于智能体运行，如果引擎必须通过 `assemble()` 控制实际的模型提示词，请声明 `assemble-before-prompt`：

```ts
info: {
  id: "my-context-engine",
  name: "My Context Engine",
  hostRequirements: {
    "agent-run": {
      requiredCapabilities: ["assemble-before-prompt"],
      unsupportedMessage:
        "使用原生 Codex 或 OpenClaw 嵌入式运行时，或者选择旧版上下文引擎。",
    },
  },
}
```

原生 Codex 和 OpenClaw 嵌入式智能体运行满足 `assemble-before-prompt`。通用 CLI 后端不满足，因此要求该能力的引擎会在 CLI 进程启动前被拒绝。

### 故障隔离

OpenClaw 会将所选插件引擎与核心回复路径隔离。如果非旧版引擎缺失、未通过契约验证、在创建工厂时抛出异常，或在生命周期方法中抛出异常，OpenClaw 会在当前 Gateway 网关进程中隔离该引擎，并将上下文引擎工作降级到内置的 `legacy` 引擎。错误会连同失败的操作一起记录，以便操作员修复、更新或禁用插件，同时避免智能体停止回复。

主机要求失败则有所不同：当引擎声明某个运行时缺少必需能力时，OpenClaw 会在开始运行前进行故障关闭。这可以保护那些在不受支持的主机中运行时会损坏状态的引擎。

### ownsCompaction

`ownsCompaction` 控制 OpenClaw 运行时内置的单次尝试内自动压缩是否在该次运行中保持启用：

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    引擎负责压缩行为。OpenClaw 会为该次运行禁用 OpenClaw 运行时内置的自动压缩和通用的提示词前溢出预检查，而引擎的 `compact()` 实现负责处理 `/compact`、提供商溢出恢复压缩，以及它想在 `afterTurn()` 中执行的任何主动压缩。当引擎从 `assemble()` 返回 `promptAuthority: "preassembly_may_overflow"` 时，OpenClaw 仍会运行提示词前溢出保护机制。
  </Accordion>
  <Accordion title="ownsCompaction: false 或未设置">
    OpenClaw 运行时内置的自动压缩在提示词执行期间仍可能运行，但 `/compact` 和溢出恢复仍会调用当前引擎的 `compact()` 方法。
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **并不**意味着 OpenClaw 会自动回退到旧版引擎的压缩路径。
</Warning>

这意味着插件有两种有效模式：

<Tabs>
  <Tab title="自主模式">
    实现你自己的压缩算法，并设置 `ownsCompaction: true`。
  </Tab>
  <Tab title="委托模式">
    设置 `ownsCompaction: false`，并让 `compact()` 调用 `openclaw/plugin-sdk/core` 中的 `delegateCompactionToRuntime(...)`，以使用 OpenClaw 的内置压缩行为。
  </Tab>
</Tabs>

对于处于活动状态但不负责压缩的引擎，无操作的 `compact()` 并不安全，因为它会禁用该引擎槽位的常规 `/compact` 和溢出恢复压缩路径。

## 配置参考

```json5
{
  plugins: {
    slots: {
      // 选择活动的上下文引擎。默认值："legacy"。
      // 设置为插件 id 以使用插件引擎。
      contextEngine: "legacy",
    },
  },
}
```

<Note>
该槽位在运行时是独占的——对于给定的运行或压缩操作，只会解析一个已注册的上下文引擎。其他已启用的 `kind: "context-engine"` 插件仍可加载并运行其注册代码；`plugins.slots.contextEngine` 仅用于选择 OpenClaw 在需要上下文引擎时解析的已注册引擎 id。
</Note>

<Note>
**卸载插件：**当你卸载当前被选为 `plugins.slots.contextEngine` 的插件时，OpenClaw 会将该槽位重置为默认值（`legacy`）。同样的重置行为也适用于 `plugins.slots.memory`。无需手动编辑配置。
</Note>

## 与压缩和记忆的关系

<AccordionGroup>
  <Accordion title="压缩">
    压缩是上下文引擎的一项职责。旧版引擎委托给 OpenClaw 的内置摘要功能。插件引擎可以实现任何压缩策略（DAG 摘要、向量检索等）。
  </Accordion>
  <Accordion title="记忆插件">
    记忆插件（`plugins.slots.memory`）与上下文引擎相互独立。记忆插件提供搜索/检索功能；上下文引擎控制模型看到的内容。它们可以协同工作——上下文引擎可能会在组装期间使用记忆插件的数据。希望使用当前记忆提示词路径的插件引擎应优先使用 `openclaw/plugin-sdk/core` 中的 `buildMemorySystemPromptAddition(...)`，它会将当前记忆提示词各部分转换为可直接前置的 `systemPromptAddition`。如果引擎需要更底层的控制，仍可通过 `buildActiveMemoryPromptSection(...)` 从 `openclaw/plugin-sdk/memory-host-core` 获取原始文本行。
  </Accordion>
  <Accordion title="会话修剪">
    无论哪个上下文引擎处于活动状态，仍会在内存中修剪旧的工具结果。
  </Accordion>
</AccordionGroup>

## 提示

- 使用 `openclaw doctor` 验证你的引擎是否正确加载。
- 切换引擎时，现有会话会继续使用其当前历史记录。新引擎将接管后续运行。
- 引擎错误会被记录，并且所选插件引擎会在当前 Gateway 网关进程中被隔离。OpenClaw 会在用户轮次中回退到 `legacy`，以便继续回复，但你仍应修复、更新、禁用或卸载损坏的插件。
- 开发时，使用 `openclaw plugins install -l ./my-engine` 链接本地插件目录，而无需复制。

## 相关内容

- [压缩](/zh-CN/concepts/compaction) - 对长对话进行摘要
- [上下文](/zh-CN/concepts/context) - 如何为智能体轮次构建上下文
- [插件架构](/zh-CN/plugins/architecture) - 注册上下文引擎插件
- [插件清单](/zh-CN/plugins/manifest) - 插件清单字段
- [插件](/zh-CN/tools/plugin) - 插件概览
