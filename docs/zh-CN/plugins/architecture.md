---
read_when:
    - 构建或调试原生 OpenClaw 插件
    - 了解插件能力模型或所有权边界
    - 处理插件加载流水线或注册表
    - 实现提供商运行时钩子或渠道插件
sidebarTitle: Internals
summary: 插件内部机制：能力模型、所有权、契约、加载流水线和运行时辅助工具
title: 插件内部机制
x-i18n:
    generated_at: "2026-04-05T10:07:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1bc9d7261c3c7878d37140be77f210dd262d6c3edee2491ea534aa599e2800c0
    source_path: plugins/architecture.md
    workflow: 15
---

# 插件内部机制

<Info>
  这是**深度架构参考**。如需实用指南，请参阅：
  - [安装和使用插件](/zh-CN/tools/plugin) — 用户指南
  - [入门指南](/zh-CN/plugins/building-plugins) — 第一个插件教程
  - [渠道插件](/zh-CN/plugins/sdk-channel-plugins) — 构建一个消息渠道
  - [提供商插件](/zh-CN/plugins/sdk-provider-plugins) — 构建一个模型提供商
  - [SDK 概览](/zh-CN/plugins/sdk-overview) — 导入映射与注册 API
</Info>

本页介绍 OpenClaw 插件系统的内部架构。

## 公共能力模型

能力是 OpenClaw 内部公开的**原生插件**模型。每个原生 OpenClaw 插件都会针对一种或多种能力类型进行注册：

| 能力 | 注册方式 | 示例插件 |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| 文本推理 | `api.registerProvider(...)` | `openai`, `anthropic` |
| CLI 推理后端 | `api.registerCliBackend(...)` | `openai`, `anthropic` |
| 语音 | `api.registerSpeechProvider(...)` | `elevenlabs`, `microsoft` |
| 实时转录 | `api.registerRealtimeTranscriptionProvider(...)` | `openai` |
| 实时语音 | `api.registerRealtimeVoiceProvider(...)` | `openai` |
| 媒体理解 | `api.registerMediaUnderstandingProvider(...)` | `openai`, `google` |
| 图像生成 | `api.registerImageGenerationProvider(...)` | `openai`, `google`, `fal`, `minimax` |
| 视频生成 | `api.registerVideoGenerationProvider(...)` | `qwen` |
| Web 抓取 | `api.registerWebFetchProvider(...)` | `firecrawl` |
| Web 搜索 | `api.registerWebSearchProvider(...)` | `google` |
| 渠道 / 消息 | `api.registerChannel(...)` | `msteams`, `matrix` |

如果某个插件注册了零个能力，但提供了 hooks、tools 或 services，那么它就是一个**仅 legacy hook** 插件。这种模式仍然被完全支持。

### 外部兼容性立场

能力模型已经在 core 中落地，并且今天已被内置/原生插件使用，但外部插件兼容性仍需要比“它被导出了，因此它被冻结了”更严格的标准。

当前指导原则：

- **现有外部插件：**保持基于 hook 的集成继续可用；将其视为兼容性的基线
- **新的内置/原生插件：**优先选择显式能力注册，而不是针对供应商的特定内部访问或新的仅 hook 设计
- **采用能力注册的外部插件：**允许，但应将特定于能力的辅助接口视为仍在演进中，除非文档明确将某个契约标记为稳定

实际规则：

- 能力注册 API 是预期方向
- 在过渡期间，legacy hook 仍然是外部插件最安全、最不容易破坏的路径
- 并非所有导出的 helper 子路径都同等稳定；优先使用范围狭窄且有文档说明的契约，而不是偶然导出的 helper

### 插件形态

OpenClaw 会根据每个已加载插件的实际注册行为（而不仅仅是静态元数据）将其分类为某种形态：

- **plain-capability** -- 恰好注册一种能力类型（例如仅提供商插件 `mistral`）
- **hybrid-capability** -- 注册多种能力类型（例如 `openai` 拥有文本推理、语音、媒体理解和图像生成）
- **hook-only** -- 仅注册 hooks（类型化或自定义），不注册能力、tools、commands 或 services
- **non-capability** -- 注册 tools、commands、services 或 routes，但不注册能力

使用 `openclaw plugins inspect <id>` 可以查看某个插件的形态和能力拆分。详情请参阅 [CLI 参考](/cli/plugins#inspect)。

### Legacy hooks

`before_agent_start` hook 仍然作为仅 hook 插件的兼容路径被支持。现实中的 legacy 插件仍然依赖它。

方向：

- 保持其可用
- 在文档中将其标记为 legacy
- 在模型/提供商覆盖场景中优先使用 `before_model_resolve`
- 在 prompt 变更场景中优先使用 `before_prompt_build`
- 仅在真实使用量下降且 fixture 覆盖证明迁移安全之后再移除

### 兼容性信号

当你运行 `openclaw doctor` 或 `openclaw plugins inspect <id>` 时，你可能会看到以下标签之一：

| 信号 | 含义 |
| -------------------------- | ------------------------------------------------------------ |
| **配置有效** | 配置解析正常，插件可解析 |
| **兼容性提示** | 插件使用受支持但较旧的模式（例如 `hook-only`） |
| **legacy 警告** | 插件使用了 `before_agent_start`，该功能已弃用 |
| **严重错误** | 配置无效或插件加载失败 |

当前 `hook-only` 和 `before_agent_start` 都不会破坏你的插件——`hook-only` 只是提示，而 `before_agent_start` 仅会触发警告。这些信号也会出现在 `openclaw status --all` 和 `openclaw plugins doctor` 中。

## 架构概览

OpenClaw 的插件系统有四个层级：

1. **Manifest + 设备发现**
   OpenClaw 从已配置路径、工作区根目录、全局扩展根目录以及内置扩展中查找候选插件。设备发现会先读取原生 `openclaw.plugin.json` manifests 以及受支持的 bundle manifests。
2. **启用 + 验证**
   Core 决定某个已发现插件是启用、禁用、阻止，还是被选中用于某个独占插槽，例如 memory。
3. **运行时加载**
   原生 OpenClaw 插件通过 jiti 在进程内加载，并将能力注册到中心注册表中。兼容 bundle 会被规范化为注册表记录，而无需导入运行时代码。
4. **接口消费**
   OpenClaw 的其余部分会读取注册表，以暴露 tools、channels、provider 设置、hooks、HTTP routes、CLI commands 和 services。

对于插件 CLI，根命令发现明确分为两个阶段：

- 解析时元数据来自 `registerCli(..., { descriptors: [...] })`
- 真正的插件 CLI 模块可以保持惰性，只在首次调用时注册

这使插件拥有的 CLI 代码保留在插件内部，同时仍让 OpenClaw 能够在解析前预留根命令名称。

重要设计边界：

- 设备发现 + 配置验证应基于 **manifest/schema 元数据** 工作，而无需执行插件代码
- 原生运行时行为来自插件模块的 `register(api)` 路径

这种拆分让 OpenClaw 能够在完整运行时尚未激活前，就验证配置、解释缺失/禁用的插件，并构建 UI/schema 提示。

### 渠道插件与共享消息工具

对于常规聊天操作，渠道插件不需要单独注册发送/编辑/回应工具。OpenClaw 在 core 中保留一个共享的 `message` 工具，而渠道插件拥有其背后的渠道特定发现和执行逻辑。

当前边界如下：

- core 拥有共享 `message` 工具宿主、prompt 接线、session/thread 账务以及执行分发
- 渠道插件拥有作用域内操作发现、能力发现以及任何渠道特定的 schema 片段
- 渠道插件拥有提供商特定的 session 会话语法，例如会话 id 如何编码 thread id，或如何从父会话继承
- 渠道插件通过其 action adapter 执行最终操作

对于渠道插件，SDK 接口是 `ChannelMessageActionAdapter.describeMessageTool(...)`。这个统一的发现调用让插件能够一起返回其可见操作、能力和 schema 贡献，从而避免这些部分彼此漂移。

Core 会将运行时作用域传入该发现步骤。重要字段包括：

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 受信任入站的 `requesterSenderId`

这对上下文敏感型插件很重要。某个渠道可以根据活动账户、当前 room/thread/message 或受信任的请求方身份来隐藏或暴露消息操作，而无需在 core 的 `message` 工具中硬编码渠道特定分支。

这也是为什么嵌入式 runner 路由更改仍然属于插件工作：runner 负责将当前 chat/session 身份转发到插件发现边界，以便共享 `message` 工具在当前轮次中暴露正确的、由渠道拥有的接口。

对于渠道拥有的执行 helper，内置插件应将执行运行时保留在它们自己的扩展模块中。Core 不再拥有位于 `src/agents/tools` 下的 Discord、Slack、Telegram 或 WhatsApp 消息操作运行时。我们不会发布单独的 `plugin-sdk/*-action-runtime` 子路径，内置插件应直接从各自扩展拥有的模块中导入本地运行时代码。

同样的边界也适用于一般情况下以提供商命名的 SDK 接缝：core 不应导入面向 Slack、Discord、Signal、WhatsApp 或类似扩展的渠道特定便利 barrel。如果 core 需要某种行为，要么消费该内置插件自己的 `api.ts` / `runtime-api.ts` barrel，要么将该需求提升为共享 SDK 中的狭窄通用能力。

对于投票，具体有两条执行路径：

- `outbound.sendPoll` 是适用于符合通用投票模型的渠道的共享基线
- `actions.handleAction("poll")` 是用于渠道特定投票语义或额外投票参数的首选路径

现在，core 会先让插件投票分发尝试处理该操作，只有在其拒绝后，才会执行共享投票解析。因此，由插件拥有的投票处理器可以接受渠道特定的投票字段，而不会先被通用投票解析器拦住。

完整启动顺序请参阅 [加载流水线](#load-pipeline)。

## 能力所有权模型

OpenClaw 将原生插件视为**公司**或**功能**的所有权边界，而不是一堆无关集成的杂物袋。

这意味着：

- 公司插件通常应拥有该公司的所有 OpenClaw 对外接口
- 功能插件通常应拥有它引入的完整功能接口
- channels 应消费共享 core 能力，而不是临时重新实现提供商行为

示例：

- 内置 `openai` 插件拥有 OpenAI 模型提供商行为，以及 OpenAI 语音 + 实时语音 + 媒体理解 + 图像生成行为
- 内置 `elevenlabs` 插件拥有 ElevenLabs 语音行为
- 内置 `microsoft` 插件拥有 Microsoft 语音行为
- 内置 `google` 插件拥有 Google 模型提供商行为，以及 Google 媒体理解 + 图像生成 + Web 搜索行为
- 内置 `firecrawl` 插件拥有 Firecrawl Web 抓取行为
- 内置 `minimax`、`mistral`、`moonshot` 和 `zai` 插件拥有它们的媒体理解后端
- `voice-call` 插件是一个功能插件：它拥有通话传输、tools、CLI、routes 和 Twilio 媒体流桥接，但它消费共享的 speech、实时转录和实时语音能力，而不是直接导入供应商插件

预期的最终状态是：

- OpenAI 位于同一个插件中，即使它跨越文本模型、语音、图像和未来的视频
- 另一个供应商也可以对自己的功能范围做同样的事情
- channels 不关心哪个供应商插件拥有这个 provider；它们消费的是 core 暴露的共享能力契约

这是关键区别：

- **plugin** = 所有权边界
- **capability** = 多个插件都可以实现或消费的 core 契约

因此，如果 OpenClaw 添加了一个新领域，比如视频，第一个问题不应该是“哪个 provider 应该硬编码视频处理？”第一个问题应该是“core 的视频能力契约是什么？”一旦该契约存在，供应商插件就可以针对它进行注册，而渠道/功能插件可以消费它。

如果该能力还不存在，正确的做法通常是：

1. 在 core 中定义缺失的能力
2. 通过插件 API/运行时以类型化方式暴露它
3. 让 channels/功能对接到该能力
4. 让供应商插件注册实现

这样可以在保持所有权明确的同时，避免 core 行为依赖单一供应商或一次性的插件专用代码路径。

### 能力分层

在决定代码归属位置时，可以使用以下思维模型：

- **core 能力层**：共享编排、策略、回退、配置合并规则、交付语义和类型化契约
- **供应商插件层**：供应商特定 API、auth、模型目录、语音合成、图像生成、未来视频后端、使用量端点
- **渠道/功能插件层**：Slack/Discord/voice-call 等集成，它们消费 core 能力并将其呈现在某个接口上

例如，TTS 遵循这种形态：

- core 拥有回复时 TTS 策略、回退顺序、偏好和渠道投递
- `openai`、`elevenlabs` 和 `microsoft` 拥有合成实现
- `voice-call` 消费电话 TTS 运行时 helper

未来能力也应优先遵循同样模式。

### 多能力公司插件示例

从外部看，一个公司插件应该感觉是内聚的。如果 OpenClaw 具备模型、语音、实时转录、实时语音、媒体理解、图像生成、视频生成、Web 抓取和 Web 搜索这些共享契约，那么某个供应商就可以在一个地方拥有自己的所有接口：

```ts
import type { OpenClawPluginDefinition } from "openclaw/plugin-sdk/plugin-entry";
import {
  describeImageWithModel,
  transcribeOpenAiCompatibleAudio,
} from "openclaw/plugin-sdk/media-understanding";

const plugin: OpenClawPluginDefinition = {
  id: "exampleai",
  name: "ExampleAI",
  register(api) {
    api.registerProvider({
      id: "exampleai",
      // auth/model catalog/runtime hooks
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // vendor speech config — implement the SpeechProviderPlugin interface directly
    });

    api.registerMediaUnderstandingProvider({
      id: "exampleai",
      capabilities: ["image", "audio", "video"],
      async describeImage(req) {
        return describeImageWithModel({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
      async transcribeAudio(req) {
        return transcribeOpenAiCompatibleAudio({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
    });

    api.registerWebSearchProvider(
      createPluginBackedWebSearchProvider({
        id: "exampleai-search",
        // credential + fetch logic
      }),
    );
  },
};

export default plugin;
```

重要的不是精确的 helper 名称，而是这种形态：

- 一个插件拥有供应商接口
- core 仍然拥有能力契约
- channels 和功能插件消费 `api.runtime.*` helper，而不是供应商代码
- 契约测试可以断言该插件注册了它声称拥有的能力

### 能力示例：视频理解

OpenClaw 已经将图像/音频/视频理解视为一个共享能力。同样的所有权模型也适用于此：

1. core 定义媒体理解契约
2. 供应商插件按需注册 `describeImage`、`transcribeAudio` 和 `describeVideo`
3. channels 和功能插件消费共享 core 行为，而不是直接接到供应商代码

这样可以避免将某个提供商的视频假设固化到 core 中。插件拥有供应商接口；core 拥有能力契约和回退行为。

视频生成已经遵循同样的顺序：core 拥有类型化能力契约和运行时 helper，而供应商插件则注册 `api.registerVideoGenerationProvider(...)` 实现。

需要一个具体的发布检查清单？请参阅 [能力扩展手册](/tools/capability-cookbook)。

## 契约与强制执行

插件 API 接口有意集中并进行了类型化，位于 `OpenClawPluginApi`。该契约定义了受支持的注册点以及插件可依赖的运行时 helper。

这很重要，因为：

- 插件作者获得一个稳定的内部标准
- core 可以拒绝重复所有权，例如两个插件注册同一个 provider id
- 启动时可以为格式错误的注册暴露可操作的诊断信息
- 契约测试可以强制执行内置插件的所有权，并防止静默漂移

有两层强制执行机制：

1. **运行时注册强制执行**
   插件注册表会在插件加载时验证注册。例如：重复的 provider id、重复的 speech provider id 以及格式错误的注册，都会产生插件诊断，而不是未定义行为。
2. **契约测试**
   内置插件会在测试运行期间被捕获到契约注册表中，这样 OpenClaw 就可以显式断言所有权。如今这用于模型提供商、语音提供商、Web 搜索提供商以及内置注册所有权。

其实际效果是，OpenClaw 会预先知道哪个插件拥有哪些接口。这让 core 与 channels 可以无缝组合，因为所有权是声明式、类型化且可测试的，而不是隐式的。

### 什么应该属于契约

好的插件契约应当：

- 类型化
- 小而精
- 针对特定能力
- 由 core 拥有
- 可被多个插件复用
- 可被 channels/功能消费，而无需了解供应商知识

坏的插件契约包括：

- 隐藏在 core 中的供应商特定策略
- 绕过注册表的一次性插件逃生口
- 渠道代码直接访问某个供应商实现
- 不属于 `OpenClawPluginApi` 或 `api.runtime` 的临时运行时对象

如有疑问，请提高抽象层级：先定义能力，再让插件接入它。

## 执行模型

原生 OpenClaw 插件与 Gateway 网关**在同一进程内**运行。它们不是沙箱隔离的。一个已加载的原生插件与 core 代码处于相同的进程级信任边界内。

这意味着：

- 原生插件可以注册 tools、网络处理器、hooks 和 services
- 原生插件中的 bug 可能导致 gateway 崩溃或不稳定
- 恶意原生插件等同于在 OpenClaw 进程内执行任意代码

兼容 bundle 默认更安全，因为 OpenClaw 当前将其视为元数据/内容包。在当前版本中，这主要意味着内置 skills。

对于非内置插件，请使用 allowlists 和显式的安装/加载路径。将工作区插件视为开发时代码，而不是生产默认项。

对于内置工作区包名，请保持插件 id 锚定在 npm 名称中：默认是 `@openclaw/<id>`，或者在包有意暴露更窄插件角色时使用批准的类型后缀，例如 `-provider`、`-plugin`、`-speech`、`-sandbox` 或 `-media-understanding`。

重要信任说明：

- `plugins.allow` 信任的是**插件 id**，而不是来源出处。
- 当工作区插件与内置插件使用相同 id，且该工作区插件被启用/加入 allowlist 时，它会有意遮蔽内置副本。
- 这很正常，而且对本地开发、补丁测试和热修复很有用。

## 导出边界

OpenClaw 导出的是能力，而不是实现便利接口。

保持能力注册公开。收紧非契约 helper 导出：

- 内置插件特定的 helper 子路径
- 不打算作为公共 API 的运行时 plumbing 子路径
- 供应商特定的便利 helper
- 属于实现细节的 setup/onboarding helpers

某些内置插件 helper 子路径仍出于兼容性和内置插件维护需要而保留在生成的 SDK 导出映射中。当前示例包括 `plugin-sdk/feishu`、`plugin-sdk/feishu-setup`、`plugin-sdk/zalo`、`plugin-sdk/zalo-setup` 以及多个 `plugin-sdk/matrix*` 接缝。请将它们视为保留的实现细节导出，而不是推荐给新第三方插件使用的 SDK 模式。

## 加载流水线

启动时，OpenClaw 大致会执行以下步骤：

1. 发现候选插件根目录
2. 读取原生或兼容 bundle 的 manifest 和包元数据
3. 拒绝不安全候选项
4. 规范化插件配置（`plugins.enabled`、`allow`、`deny`、`entries`、`slots`、`load.paths`）
5. 为每个候选项决定启用状态
6. 通过 jiti 加载已启用的原生模块
7. 调用原生 `register(api)`（或 `activate(api)`——这是一个 legacy 别名）hook，并将注册结果收集到插件注册表中
8. 将注册表暴露给 commands/运行时接口

<Note>
`activate` 是 `register` 的 legacy 别名——加载器会解析现有的任意一个（`def.register ?? def.activate`），并在同一时机调用。所有内置插件都使用 `register`；新插件请优先使用 `register`。
</Note>

安全门会发生在**运行时执行之前**。当入口逃离插件根目录、路径对所有人可写，或对于非内置插件来说路径所有权看起来可疑时，候选项会被阻止。

### Manifest-first 行为

manifest 是控制平面的真实来源。OpenClaw 用它来：

- 标识插件
- 发现已声明的 channels/skills/config schema 或 bundle 能力
- 验证 `plugins.entries.<id>.config`
- 增强 Control UI 标签/占位符
- 显示安装/目录元数据

对于原生插件，运行时模块是数据平面部分。它会注册实际行为，例如 hooks、tools、commands 或 provider 流程。

### 加载器会缓存什么

OpenClaw 会保留一些短生命周期的进程内缓存，用于：

- 设备发现结果
- manifest 注册表数据
- 已加载插件注册表

这些缓存可以减少突发式启动和重复命令开销。可以将它们视为短生命周期的性能缓存，而不是持久化。

性能说明：

- 设置 `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` 或 `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` 可以禁用这些缓存。
- 使用 `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` 和 `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` 调整缓存时间窗口。

## 注册表模型

已加载插件不会直接修改任意 core 全局对象。它们会注册到一个中心插件注册表中。

注册表会跟踪：

- 插件记录（身份、来源、origin、状态、诊断信息）
- tools
- legacy hooks 和类型化 hooks
- channels
- providers
- Gateway 网关 RPC 处理器
- HTTP routes
- CLI registrars
- 后台 services
- 插件拥有的 commands

然后 core 功能会从该注册表读取，而不是直接与插件模块通信。这使加载保持单向：

- 插件模块 -> 注册表注册
- core 运行时 -> 注册表消费

这种分离对可维护性很重要。它意味着大多数 core 接口只需要一个集成点：“读取注册表”，而不是“为每个插件模块写特例”。

## 会话绑定回调

绑定会话的插件可以在审批被解决后做出响应。

使用 `api.onConversationBindingResolved(...)` 可在绑定请求被批准或拒绝后接收回调：

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // A binding now exists for this plugin + conversation.
        console.log(event.binding?.conversationId);
        return;
      }

      // The request was denied; clear any local pending state.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

回调载荷字段：

- `status`：`"approved"` 或 `"denied"`
- `decision`：`"allow-once"`、`"allow-always"` 或 `"deny"`
- `binding`：已批准请求对应的解析后绑定
- `request`：原始请求摘要、detach 提示、发送者 id 和会话元数据

此回调仅用于通知。它不会改变谁有权限绑定会话，并且会在 core 审批处理完成后运行。

## 提供商运行时钩子

提供商插件现在有两层：

- manifest 元数据：`providerAuthEnvVars` 用于在运行时加载前进行低成本 env-auth 查找，`providerAuthChoices` 用于在运行时加载前提供低成本的新手引导/auth-choice 标签和 CLI flag 元数据
- 配置时钩子：`catalog` / legacy `discovery` 以及 `applyConfigDefaults`
- 运行时钩子：`normalizeModelId`、`normalizeTransport`、`normalizeConfig`、`applyNativeStreamingUsageCompat`、`resolveConfigApiKey`、`resolveSyntheticAuth`、`shouldDeferSyntheticProfileAuth`、`resolveDynamicModel`、`prepareDynamicModel`、`normalizeResolvedModel`、`contributeResolvedModelCompat`、`capabilities`、`normalizeToolSchemas`、`inspectToolSchemas`、`resolveReasoningOutputMode`、`prepareExtraParams`、`createStreamFn`、`wrapStreamFn`、`resolveTransportTurnState`、`resolveWebSocketSessionPolicy`、`formatApiKey`、`refreshOAuth`、`buildAuthDoctorHint`、`matchesContextOverflowError`、`classifyFailoverReason`、`isCacheTtlEligible`、`buildMissingAuthMessage`、`suppressBuiltInModel`、`augmentModelCatalog`、`isBinaryThinking`、`supportsXHighThinking`、`resolveDefaultThinkingLevel`、`isModernModelRef`、`prepareRuntimeAuth`、`resolveUsageAuth`、`fetchUsageSnapshot`、`createEmbeddingProvider`、`buildReplayPolicy`、`sanitizeReplayHistory`、`validateReplayTurns`、`onModelSelected`

OpenClaw 仍然拥有通用 agent 循环、failover、transcript 处理和工具策略。这些 hooks 是供应商特定行为的扩展接口，而无需整套自定义推理传输。

当提供商使用基于环境变量的凭证，且通用 auth/status/model-picker 路径需要在不加载插件运行时的情况下看到它们时，使用 manifest `providerAuthEnvVars`。当新手引导/auth-choice CLI 接口需要在不加载提供商运行时的情况下了解该提供商的 choice id、分组标签和简单单 flag auth 接线时，使用 manifest `providerAuthChoices`。将提供商运行时的 `envVars` 保留给面向操作员的提示，例如新手引导标签或 OAuth client-id/client-secret 设置变量。

### Hook 顺序与使用方式

对于模型/提供商插件，OpenClaw 大致按以下顺序调用 hooks。
“何时使用”列是快速决策指南。

| #   | Hook | 作用 | 何时使用 |
| --- | --------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog` | 在生成 `models.json` 期间，将 provider 配置发布到 `models.providers` | 提供商拥有目录或 base URL 默认值 |
| 2   | `applyConfigDefaults` | 在配置具体化期间应用由提供商拥有的全局配置默认值 | 默认值依赖 auth 模式、环境或提供商模型家族语义 |
| --  | _(内置模型查找)_ | OpenClaw 先尝试常规 registry/catalog 路径 | _(不是插件 hook)_ |
| 3   | `normalizeModelId` | 在查找前规范化 legacy 或 preview model-id 别名 | 提供商在规范模型解析前拥有别名清理逻辑 |
| 4   | `normalizeTransport` | 在通用模型组装前规范化提供商家族的 `api` / `baseUrl` | 提供商拥有同一传输家族中自定义 provider id 的传输清理逻辑 |
| 5   | `normalizeConfig` | 在运行时/提供商解析前规范化 `models.providers.<id>` | 提供商需要将配置清理逻辑放在插件中；内置 Google 家族 helpers 也会为受支持的 Google 配置项兜底 |
| 6   | `applyNativeStreamingUsageCompat` | 对配置提供商应用原生流式使用量兼容重写 | 提供商需要基于端点的原生流式使用量元数据修复 |
| 7   | `resolveConfigApiKey` | 在加载运行时 auth 之前，为配置提供商解析 env-marker auth | 提供商拥有由自己控制的 env-marker API key 解析；`amazon-bedrock` 在这里也有一个内置 AWS env-marker 解析器 |
| 8   | `resolveSyntheticAuth` | 暴露本地/自托管或基于配置的 auth，而不持久化明文 | 提供商可以通过 synthetic/local 凭证标记运行 |
| 9   | `shouldDeferSyntheticProfileAuth` | 将已存储的 synthetic profile 占位符优先级降低到 env/config 支持的 auth 之后 | 提供商会存储 synthetic 占位 profile，这些 profile 不应抢占优先级 |
| 10  | `resolveDynamicModel` | 为尚未进入本地注册表的、由提供商拥有的 model id 提供同步回退 | 提供商接受任意上游 model id |
| 11  | `prepareDynamicModel` | 异步预热，然后再次运行 `resolveDynamicModel` | 提供商在解析未知 id 之前需要网络元数据 |
| 12  | `normalizeResolvedModel` | 在嵌入式 runner 使用已解析模型前进行最终重写 | 提供商需要传输重写，但仍使用 core 传输 |
| 13  | `contributeResolvedModelCompat` | 为通过另一兼容传输暴露的供应商模型贡献兼容标记 | 提供商能够在代理传输上识别自己的模型，而无需接管该 provider |
| 14  | `capabilities` | 由提供商拥有、供共享 core 逻辑使用的 transcript/tooling 元数据 | 提供商需要 transcript/提供商家族特性处理 |
| 15  | `normalizeToolSchemas` | 在嵌入式 runner 看到工具 schema 前先规范化 | 提供商需要传输家族级别的 schema 清理 |
| 16  | `inspectToolSchemas` | 在规范化后暴露由提供商拥有的 schema 诊断信息 | 提供商希望提供关键字警告，而无需让 core 学习提供商特定规则 |
| 17  | `resolveReasoningOutputMode` | 选择原生还是带标签的 reasoning-output 契约 | 提供商需要带标签的 reasoning/final output，而不是原生字段 |
| 18  | `prepareExtraParams` | 在通用 stream 选项包装器之前做请求参数规范化 | 提供商需要默认请求参数或按提供商做参数清理 |
| 19  | `createStreamFn` | 用自定义传输完全替换正常 stream 路径 | 提供商需要自定义线协议，而不只是包装器 |
| 20  | `wrapStreamFn` | 在应用通用包装器后再包装 stream | 提供商需要请求头/请求体/模型兼容包装，但不需要自定义传输 |
| 21  | `resolveTransportTurnState` | 附加原生的逐轮传输头部或元数据 | 提供商希望通用传输发送提供商原生轮次身份 |
| 22  | `resolveWebSocketSessionPolicy` | 附加原生 WebSocket 头部或会话冷却策略 | 提供商希望通用 WS 传输调优会话头或回退策略 |
| 23  | `formatApiKey` | auth-profile 格式化器：已存储 profile 变成运行时 `apiKey` 字符串 | 提供商会存储额外 auth 元数据，并需要自定义运行时 token 形态 |
| 24  | `refreshOAuth` | 用于自定义刷新端点或刷新失败策略的 OAuth 刷新覆盖 | 提供商不适配共享 `pi-ai` 刷新器 |
| 25  | `buildAuthDoctorHint` | 当 OAuth 刷新失败时附加修复提示 | 提供商在刷新失败后需要提供商拥有的 auth 修复指引 |
| 26  | `matchesContextOverflowError` | 由提供商拥有的上下文窗口溢出匹配器 | 提供商存在通用启发式无法识别的原始溢出错误 |
| 27  | `classifyFailoverReason` | 由提供商拥有的 failover 原因分类 | 提供商可以将原始 API/传输错误映射到限流/过载等原因 |
| 28  | `isCacheTtlEligible` | 面向代理/回传提供商的 prompt-cache 策略 | 提供商需要代理特定的缓存 TTL 门控 |
| 29  | `buildMissingAuthMessage` | 替换通用的缺失 auth 恢复消息 | 提供商需要提供商特定的缺失 auth 恢复提示 |
| 30  | `suppressBuiltInModel` | 过时上游模型抑制，可选附带面向用户的错误提示 | 提供商需要隐藏过时上游条目或用供应商提示替换 |
| 31  | `augmentModelCatalog` | 在发现后追加 synthetic/最终目录条目 | 提供商需要在 `models list` 和选择器中提供 synthetic 前向兼容条目 |
| 32  | `isBinaryThinking` | 针对二元 thinking 提供商的开/关推理切换 | 提供商仅暴露二元 thinking 开/关 |
| 33  | `supportsXHighThinking` | 为选定模型提供 `xhigh` 推理支持 | 提供商希望仅为部分模型启用 `xhigh` |
| 34  | `resolveDefaultThinkingLevel` | 为特定模型家族提供默认 `/think` 级别 | 提供商拥有某模型家族的默认 `/think` 策略 |
| 35  | `isModernModelRef` | 用于实时 profile 过滤和 smoke 选择的现代模型匹配器 | 提供商拥有 live/smoke 首选模型匹配逻辑 |
| 36  | `prepareRuntimeAuth` | 在推理前将配置的凭证交换成实际运行时 token/key | 提供商需要 token 交换或短生命周期请求凭证 |
| 37  | `resolveUsageAuth` | 为 `/usage` 和相关状态界面解析使用量/计费凭证 | 提供商需要自定义使用量/配额 token 解析或不同的使用量凭证 |
| 38  | `fetchUsageSnapshot` | 在 auth 解析后拉取并规范化提供商特定的使用量/配额快照 | 提供商需要提供商特定的使用量端点或载荷解析器 |
| 39  | `createEmbeddingProvider` | 为 memory/search 构建由提供商拥有的 embedding adapter | Memory embedding 行为应归属于提供商插件 |
| 40  | `buildReplayPolicy` | 返回控制该提供商 transcript 处理方式的 replay 策略 | 提供商需要自定义 transcript 策略（例如移除 thinking block） |
| 41  | `sanitizeReplayHistory` | 在通用 transcript 清理后重写 replay 历史 | 提供商需要超出共享压缩 helper 之外的 replay 重写 |
| 42  | `validateReplayTurns` | 在嵌入式 runner 之前对 replay turn 做最终校验或整形 | 提供商传输在通用清理后需要更严格的 turn 校验 |
| 43  | `onModelSelected` | 在模型生效后执行提供商拥有的副作用 | 提供商在模型变为活动状态时需要遥测或提供商拥有的状态处理 |

`normalizeModelId`、`normalizeTransport` 和 `normalizeConfig` 会先检查已匹配的 provider 插件，然后依次回退到其他具备 hook 能力的 provider 插件，直到其中一个真正修改 model id 或 transport/config。这样可以让别名/兼容 provider shim 正常工作，而无需调用方知道哪个内置插件拥有该重写逻辑。如果没有 provider hook 重写受支持的 Google 家族配置项，内置 Google 配置规范化器仍会应用该兼容性清理。

如果提供商需要完全自定义的线协议或自定义请求执行器，那就是另一类扩展。这些 hooks 适用于仍在 OpenClaw 常规推理循环中运行的提供商行为。

### 提供商示例

```ts
api.registerProvider({
  id: "example-proxy",
  label: "Example Proxy",
  auth: [],
  catalog: {
    order: "simple",
    run: async (ctx) => {
      const apiKey = ctx.resolveProviderApiKey("example-proxy").apiKey;
      if (!apiKey) {
        return null;
      }
      return {
        provider: {
          baseUrl: "https://proxy.example.com/v1",
          apiKey,
          api: "openai-completions",
          models: [{ id: "auto", name: "Auto" }],
        },
      };
    },
  },
  resolveDynamicModel: (ctx) => ({
    id: ctx.modelId,
    name: ctx.modelId,
    provider: "example-proxy",
    api: "openai-completions",
    baseUrl: "https://proxy.example.com/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }),
  prepareRuntimeAuth: async (ctx) => {
    const exchanged = await exchangeToken(ctx.apiKey);
    return {
      apiKey: exchanged.token,
      baseUrl: exchanged.baseUrl,
      expiresAt: exchanged.expiresAt,
    };
  },
  resolveUsageAuth: async (ctx) => {
    const auth = await ctx.resolveOAuthToken();
    return auth ? { token: auth.token } : null;
  },
  fetchUsageSnapshot: async (ctx) => {
    return await fetchExampleProxyUsage(ctx.token, ctx.timeoutMs, ctx.fetchFn);
  },
});
```

### 内置示例

- Anthropic 使用 `resolveDynamicModel`、`capabilities`、`buildAuthDoctorHint`、`resolveUsageAuth`、`fetchUsageSnapshot`、`isCacheTtlEligible`、`resolveDefaultThinkingLevel`、`applyConfigDefaults`、`isModernModelRef` 和 `wrapStreamFn`，因为它拥有 Claude 4.6 前向兼容、provider 家族提示、auth 修复指引、使用量端点集成、prompt-cache 适用性、具备 auth 感知的配置默认值、Claude 默认/自适应 thinking 策略，以及针对 beta headers、`/fast` / `serviceTier` 和 `context1m` 的 Anthropic 特定 stream 整形。
- Anthropic 的 Claude 特定 stream helpers 当前保留在内置插件自己的公共 `api.ts` / `contract-api.ts` 接缝中。该包接口导出 `wrapAnthropicProviderStream`、`resolveAnthropicBetas`、`resolveAnthropicFastMode`、`resolveAnthropicServiceTier` 以及更底层的 Anthropic 包装器构建器，而不是仅为某一个 provider 的 beta-header 规则去扩展通用 SDK。
- OpenAI 使用 `resolveDynamicModel`、`normalizeResolvedModel` 和 `capabilities`，以及 `buildMissingAuthMessage`、`suppressBuiltInModel`、`augmentModelCatalog`、`supportsXHighThinking` 和 `isModernModelRef`，因为它拥有 GPT-5.4 前向兼容、直接的 OpenAI `openai-completions` -> `openai-responses` 规范化、具备 Codex 感知的 auth 提示、Spark 抑制、synthetic OpenAI 列表条目，以及 GPT-5 thinking / live-model 策略；`openai-responses-defaults` stream 家族拥有共享的原生 OpenAI Responses 包装器，用于 attribution headers、`/fast`/`serviceTier`、文本详细度、原生 Codex Web 搜索、reasoning-compat 载荷整形，以及 Responses 上下文管理。
- OpenRouter 使用 `catalog` 以及 `resolveDynamicModel` 和 `prepareDynamicModel`，因为该 provider 是透传型的，可能会在 OpenClaw 静态目录更新之前暴露新的 model id；它还使用 `capabilities`、`wrapStreamFn` 和 `isCacheTtlEligible`，以便将 provider 特定请求头、路由元数据、reasoning 补丁和 prompt-cache 策略留在 core 之外。它的 replay 策略来自 `passthrough-gemini` 家族，而 `openrouter-thinking` stream 家族拥有代理推理注入，以及不受支持模型 / `auto` 的跳过逻辑。
- GitHub Copilot 使用 `catalog`、`auth`、`resolveDynamicModel` 和 `capabilities`，以及 `prepareRuntimeAuth` 和 `fetchUsageSnapshot`，因为它需要 provider 拥有的设备登录、模型回退行为、Claude transcript 特性、GitHub token -> Copilot token 交换，以及 provider 拥有的使用量端点。
- OpenAI Codex 使用 `catalog`、`resolveDynamicModel`、`normalizeResolvedModel`、`refreshOAuth` 和 `augmentModelCatalog`，以及 `prepareExtraParams`、`resolveUsageAuth` 和 `fetchUsageSnapshot`，因为它仍运行在 core OpenAI 传输之上，但拥有自己的传输/base URL 规范化、OAuth 刷新回退策略、默认传输选择、synthetic Codex 目录条目以及 ChatGPT 使用量端点集成；它与直接 OpenAI 共用同一个 `openai-responses-defaults` stream 家族。
- Google AI Studio 和 Gemini CLI OAuth 使用 `resolveDynamicModel`、`buildReplayPolicy`、`sanitizeReplayHistory`、`resolveReasoningOutputMode`、`wrapStreamFn` 和 `isModernModelRef`，因为 `google-gemini` replay 家族拥有 Gemini 3.1 前向兼容回退、原生 Gemini replay 校验、bootstrap replay 清理、带标签的 reasoning-output 模式，以及现代模型匹配；而 `google-thinking` stream 家族拥有 Gemini thinking 载荷规范化；Gemini CLI OAuth 还使用 `formatApiKey`、`resolveUsageAuth` 和 `fetchUsageSnapshot` 来处理 token 格式化、token 解析和配额端点接线。
- Anthropic Vertex 通过 `anthropic-by-model` replay 家族使用 `buildReplayPolicy`，这样 Claude 特定 replay 清理就只会作用于 Claude id，而不是所有 `anthropic-messages` 传输。
- Amazon Bedrock 使用 `buildReplayPolicy`、`matchesContextOverflowError`、`classifyFailoverReason` 和 `resolveDefaultThinkingLevel`，因为它拥有针对 Anthropic-on-Bedrock 流量的 Bedrock 特定限流/未就绪/上下文溢出错误分类；它的 replay 策略仍与同一个仅 Claude 的 `anthropic-by-model` 防护共用。
- OpenRouter、Kilocode、Opencode 和 Opencode Go 通过 `passthrough-gemini` replay 家族使用 `buildReplayPolicy`，因为它们通过 OpenAI 兼容传输代理 Gemini 模型，并需要 Gemini thought-signature 清理，而不需要原生 Gemini replay 校验或 bootstrap 重写。
- MiniMax 通过 `hybrid-anthropic-openai` replay 家族使用 `buildReplayPolicy`，因为一个 provider 同时拥有 Anthropic-message 和 OpenAI 兼容语义；它在 Anthropic 侧保留仅 Claude 的 thinking-block 丢弃逻辑，同时将 reasoning output mode 覆盖回原生，而 `minimax-fast-mode` stream 家族则在共享 stream 路径上拥有 fast-mode 模型重写。
- Moonshot 使用 `catalog` 以及 `wrapStreamFn`，因为它仍使用共享 OpenAI 传输，但需要 provider 拥有的 thinking 载荷规范化；`moonshot-thinking` stream 家族会将配置加 `/think` 状态映射到其原生二元 thinking 载荷上。
- Kilocode 使用 `catalog`、`capabilities`、`wrapStreamFn` 和 `isCacheTtlEligible`，因为它需要 provider 拥有的请求头、reasoning 载荷规范化、Gemini transcript 提示以及 Anthropic cache-TTL 门控；`kilocode-thinking` stream 家族会将 Kilo thinking 注入保留在共享代理 stream 路径上，同时跳过 `kilo/auto` 和其他不支持显式推理载荷的代理模型 id。
- Z.AI 使用 `resolveDynamicModel`、`prepareExtraParams`、`wrapStreamFn`、`isCacheTtlEligible`、`isBinaryThinking`、`isModernModelRef`、`resolveUsageAuth` 和 `fetchUsageSnapshot`，因为它拥有 GLM-5 回退、`tool_stream` 默认值、二元 thinking UX、现代模型匹配，以及使用量 auth + 配额拉取；`tool-stream-default-on` stream 家族则将默认开启的 `tool_stream` 包装器从各 provider 手写胶水中抽离出来。
- xAI 使用 `normalizeResolvedModel`、`normalizeTransport`、`contributeResolvedModelCompat`、`prepareExtraParams`、`wrapStreamFn`、`resolveSyntheticAuth`、`resolveDynamicModel` 和 `isModernModelRef`，因为它拥有原生 xAI Responses 传输规范化、Grok fast-mode 别名重写、默认 `tool_stream`、strict-tool / reasoning-payload 清理、为插件拥有工具复用的回退 auth、前向兼容的 Grok 模型解析，以及由 provider 拥有的兼容补丁，例如 xAI 工具 schema 配置文件、不受支持的 schema 关键字、原生 `web_search` 和 HTML 实体工具调用参数解码。
- Mistral、OpenCode Zen 和 OpenCode Go 仅使用 `capabilities`，以便将 transcript/tooling 特性保留在 core 之外。
- 仅目录型的内置 providers，例如 `byteplus`、`cloudflare-ai-gateway`、`huggingface`、`kimi-coding`、`nvidia`、`qianfan`、`synthetic`、`together`、`venice`、`vercel-ai-gateway` 和 `volcengine`，只使用 `catalog`。
- Qwen 使用 `catalog` 作为其文本 provider，并为其多模态接口提供共享的 media-understanding 和 video-generation 注册。
- MiniMax 和 Xiaomi 使用 `catalog` 加 usage hooks，因为即使推理仍通过共享传输运行，它们的 `/usage` 行为仍由插件拥有。

## 运行时辅助工具

插件可以通过 `api.runtime` 访问部分选定的 core helper。对于 TTS：

```ts
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

说明：

- `textToSpeech` 返回适用于文件/语音便笺界面的常规 core TTS 输出载荷。
- 使用 core `messages.tts` 配置和提供商选择。
- 返回 PCM 音频缓冲区 + 采样率。插件必须为提供商重新采样/编码。
- `listVoices` 对每个 provider 来说都是可选的。将其用于由供应商拥有的语音选择器或设置流程。
- 语音列表可以包含更丰富的元数据，例如 locale、gender 和 personality tags，以支持具备提供商感知能力的选择器。
- 目前 OpenAI 和 ElevenLabs 支持电话场景。Microsoft 不支持。

插件也可以通过 `api.registerSpeechProvider(...)` 注册语音提供商。

```ts
api.registerSpeechProvider({
  id: "acme-speech",
  label: "Acme Speech",
  isConfigured: ({ config }) => Boolean(config.messages?.tts),
  synthesize: async (req) => {
    return {
      audioBuffer: Buffer.from([]),
      outputFormat: "mp3",
      fileExtension: ".mp3",
      voiceCompatible: false,
    };
  },
});
```

说明：

- 将 TTS 策略、回退和回复投递保留在 core 中。
- 使用 speech providers 来承载由供应商拥有的合成行为。
- Legacy Microsoft `edge` 输入会被规范化为 `microsoft` provider id。
- 首选的所有权模型是面向公司的：随着 OpenClaw 添加这些能力契约，一个供应商插件可以同时拥有文本、语音、图像和未来的媒体 providers。

对于图像/音频/视频理解，插件会注册一个类型化的媒体理解 provider，而不是通用 key/value 包：

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

说明：

- 将编排、回退、配置和渠道接线保留在 core 中。
- 将供应商行为保留在 provider 插件中。
- 增量扩展应保持类型化：新的可选方法、新的可选结果字段、新的可选能力。
- 视频生成已经遵循同样模式：
  - core 拥有能力契约和运行时 helper
  - 供应商插件注册 `api.registerVideoGenerationProvider(...)`
  - 功能/渠道插件消费 `api.runtime.videoGeneration.*`

对于媒体理解运行时 helper，插件可以调用：

```ts
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});
```

对于音频转录，插件可以使用媒体理解运行时，或者较旧的 STT 别名：

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

说明：

- `api.runtime.mediaUnderstanding.*` 是图像/音频/视频理解的首选共享接口。
- 使用 core 媒体理解音频配置（`tools.media.audio`）和提供商回退顺序。
- 当没有产生转录输出时返回 `{ text: undefined }`（例如输入被跳过/不受支持）。
- `api.runtime.stt.transcribeAudioFile(...)` 仍保留为兼容别名。

插件也可以通过 `api.runtime.subagent` 启动后台 subagent 运行：

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

说明：

- `provider` 和 `model` 是每次运行的可选覆盖项，不会持久更改 session。
- OpenClaw 仅对受信任调用方尊重这些覆盖字段。
- 对于由插件拥有的回退运行，操作员必须通过 `plugins.entries.<id>.subagent.allowModelOverride: true` 显式启用。
- 使用 `plugins.entries.<id>.subagent.allowedModels` 可以将受信任插件限制为特定规范 `provider/model` 目标，或者设置为 `"*"` 以显式允许任意目标。
- 不受信任的插件 subagent 运行仍可工作，但覆盖请求会被拒绝，而不是静默回退。

对于 Web 搜索，插件可以消费共享运行时 helper，而不是直接访问 agent 工具接线：

```ts
const providers = api.runtime.webSearch.listProviders({
  config: api.config,
});

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: {
    query: "OpenClaw plugin runtime helpers",
    count: 5,
  },
});
```

插件也可以通过 `api.registerWebSearchProvider(...)` 注册 Web 搜索 providers。

说明：

- 将 provider 选择、凭证解析和共享请求语义保留在 core 中。
- 使用 web-search providers 来承载供应商特定搜索传输。
- `api.runtime.webSearch.*` 是功能/渠道插件在需要搜索行为且不依赖 agent 工具包装器时的首选共享接口。

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "A friendly lobster mascot", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)`：使用已配置的图像生成 provider 链生成图像。
- `listProviders(...)`：列出可用的图像生成 providers 及其能力。

## Gateway 网关 HTTP 路由

插件可以使用 `api.registerHttpRoute(...)` 暴露 HTTP 端点。

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

路由字段：

- `path`：Gateway 网关 HTTP 服务器下的路由路径。
- `auth`：必填。使用 `"gateway"` 表示要求常规 gateway auth，或使用 `"plugin"` 表示由插件管理 auth/webhook 校验。
- `match`：可选。`"exact"`（默认）或 `"prefix"`。
- `replaceExisting`：可选。允许同一个插件替换它自己已有的路由注册。
- `handler`：当路由处理了该请求时返回 `true`。

说明：

- `api.registerHttpHandler(...)` 已被移除，并会导致插件加载错误。请改用 `api.registerHttpRoute(...)`。
- 插件路由必须显式声明 `auth`。
- 除非设置 `replaceExisting: true`，否则精确的 `path + match` 冲突会被拒绝，而且一个插件不能替换另一个插件的路由。
- 不同 `auth` 级别的重叠路由会被拒绝。请仅在相同 auth 级别内保留 `exact`/`prefix` 贯穿链。
- `auth: "plugin"` 路由**不会**自动接收操作员运行时作用域。它们用于插件管理的 webhook/签名校验，而不是特权 Gateway 网关 helper 调用。
- `auth: "gateway"` 路由运行在 Gateway 网关请求运行时作用域中，但该作用域有意保持保守：
  - 共享密钥 bearer auth（`gateway.auth.mode = "token"` / `"password"`）会将插件路由运行时作用域固定为 `operator.write`，即使调用方发送了 `x-openclaw-scopes`
  - 受信任的、具备身份信息的 HTTP 模式（例如 `trusted-proxy` 或私有入口上的 `gateway.auth.mode = "none"`）仅在明确存在该头时才会尊重 `x-openclaw-scopes`
  - 如果这些具备身份信息的插件路由请求中缺少 `x-openclaw-scopes`，运行时作用域会回退到 `operator.write`
- 实际规则：不要假定 gateway-auth 插件路由天然就是管理员接口。如果你的路由需要仅管理员行为，请要求使用具备身份信息的 auth 模式，并在文档中说明明确的 `x-openclaw-scopes` header 契约。

## 插件 SDK 导入路径

编写插件时，请使用 SDK 子路径，而不是单体式的 `openclaw/plugin-sdk` 导入：

- `openclaw/plugin-sdk/plugin-entry` 用于插件注册原语。
- `openclaw/plugin-sdk/core` 用于通用共享的插件侧契约。
- `openclaw/plugin-sdk/config-schema` 用于根 `openclaw.json` Zod schema 导出（`OpenClawSchema`）。
- 稳定的渠道原语，例如 `openclaw/plugin-sdk/channel-setup`、`openclaw/plugin-sdk/setup-runtime`、`openclaw/plugin-sdk/setup-adapter-runtime`、`openclaw/plugin-sdk/setup-tools`、`openclaw/plugin-sdk/channel-pairing`、`openclaw/plugin-sdk/channel-contract`、`openclaw/plugin-sdk/channel-feedback`、`openclaw/plugin-sdk/channel-inbound`、`openclaw/plugin-sdk/channel-lifecycle`、`openclaw/plugin-sdk/channel-reply-pipeline`、`openclaw/plugin-sdk/command-auth`、`openclaw/plugin-sdk/secret-input` 和 `openclaw/plugin-sdk/webhook-ingress`，用于共享 setup/auth/reply/webhook 接线。
  `channel-inbound` 是防抖、提及匹配、信封格式化和入站信封上下文 helper 的共享归属位置。
  `channel-setup` 是可选安装 setup 接缝的窄接口。
  `setup-runtime` 是由 `setupEntry` / 延迟启动使用的运行时安全 setup 接口，包括导入安全的 setup patch adapters。
  `setup-adapter-runtime` 是具备环境感知的账户 setup adapter 接缝。
  `setup-tools` 是小型 CLI/归档/文档 helper 接缝（`formatCliCommand`、`detectBinary`、`extractArchive`、`resolveBrewExecutable`、`formatDocsLink`、`CONFIG_DIR`）。
- 领域子路径，例如 `openclaw/plugin-sdk/channel-config-helpers`、`openclaw/plugin-sdk/allow-from`、`openclaw/plugin-sdk/channel-config-schema`、`openclaw/plugin-sdk/telegram-command-config`、`openclaw/plugin-sdk/channel-policy`、`openclaw/plugin-sdk/approval-runtime`、`openclaw/plugin-sdk/config-runtime`、`openclaw/plugin-sdk/infra-runtime`、`openclaw/plugin-sdk/agent-runtime`、`openclaw/plugin-sdk/lazy-runtime`、`openclaw/plugin-sdk/reply-history`、`openclaw/plugin-sdk/routing`、`openclaw/plugin-sdk/status-helpers`、`openclaw/plugin-sdk/text-runtime`、`openclaw/plugin-sdk/runtime-store` 和 `openclaw/plugin-sdk/directory-runtime`，用于共享运行时/配置 helper。
  `telegram-command-config` 是 Telegram 自定义命令规范化/校验的狭窄公共接缝，即使内置 Telegram 契约接口暂时不可用，它也会继续可用。
  `text-runtime` 是共享文本/markdown/日志接缝，包括 assistant 可见文本剥离、markdown 渲染/分块 helper、脱敏 helper、directive-tag helpers 和 safe-text utilities。
- 针对审批的渠道接缝应优先使用插件上的单个 `approvalCapability` 契约。随后 core 会通过这一个能力来读取审批 auth、投递、渲染和原生路由行为，而不是将审批行为混入无关插件字段。
- `openclaw/plugin-sdk/channel-runtime` 已弃用，目前仅作为旧插件的兼容 shim 保留。新代码应改为导入更窄的通用原语，仓库代码也不应新增对该 shim 的导入。
- 内置扩展内部实现仍然是私有的。外部插件只能使用 `openclaw/plugin-sdk/*` 子路径。OpenClaw core/test 代码可以使用插件包根目录下的仓库公共入口点，例如 `index.js`、`api.js`、`runtime-api.js`、`setup-entry.js` 以及像 `login-qr-api.js` 这样的窄范围文件。绝不要从 core 或其他扩展中导入某个插件包的 `src/*`。
- 仓库入口点拆分：
  `<plugin-package-root>/api.js` 是 helper/types barrel，
  `<plugin-package-root>/runtime-api.js` 是仅运行时 barrel，
  `<plugin-package-root>/index.js` 是内置插件入口，
  `<plugin-package-root>/setup-entry.js` 是 setup 插件入口。
- 当前内置 provider 示例：
  - Anthropic 使用 `api.js` / `contract-api.js` 来提供 Claude stream helpers，例如 `wrapAnthropicProviderStream`、beta-header helpers 和 `service_tier` 解析。
  - OpenAI 使用 `api.js` 来提供 provider builders、默认模型 helpers 和实时 provider builders。
  - OpenRouter 使用 `api.js` 提供其 provider builder 以及 onboarding/config helpers，而 `register.runtime.js` 仍可为仓库内部使用重新导出通用 `plugin-sdk/provider-stream` helpers。
- 由 facade 加载的公共入口点会优先使用活动运行时配置快照；当 OpenClaw 尚未提供运行时快照时，再回退到磁盘上解析出的配置文件。
- 通用共享原语仍然是首选的公共 SDK 契约。仍保留一小组保留的、面向内置渠道的兼容 helper 接缝。请将其视为内置维护/兼容性接缝，而不是新的第三方导入目标；新的跨渠道契约仍应落在通用 `plugin-sdk/*` 子路径或插件本地 `api.js` / `runtime-api.js` barrel 上。

兼容性说明：

- 新代码请避免使用根 `openclaw/plugin-sdk` barrel。
- 优先使用更窄的稳定原语。较新的 setup/pairing/reply/feedback/contract/inbound/threading/command/secret-input/webhook/infra/allowlist/status/message-tool 子路径是新的内置和外部插件工作的目标契约。
  目标解析/匹配应归属于 `openclaw/plugin-sdk/channel-targets`。
  消息操作 gate 和 reaction message-id helpers 应归属于 `openclaw/plugin-sdk/channel-actions`。
- 面向内置扩展的特定 helper barrels 默认并不稳定。如果某个 helper 只被某个内置扩展需要，请将其保留在该扩展本地的 `api.js` 或 `runtime-api.js` 接缝后面，而不是将其提升到 `openclaw/plugin-sdk/<extension>`。
- 新的共享 helper 接缝应是通用的，而不是带渠道品牌的。共享目标解析应归属于 `openclaw/plugin-sdk/channel-targets`；渠道特定内部实现应保留在拥有该插件的本地 `api.js` 或 `runtime-api.js` 接缝之后。
- `image-generation`、`media-understanding` 和 `speech` 这类能力特定子路径之所以存在，是因为内置/原生插件今天正在使用它们。仅仅因为它们存在，并不意味着每个导出的 helper 都是长期冻结的外部契约。

## 消息工具 schema

插件应拥有渠道特定的 `describeMessageTool(...)` schema 贡献。请将 provider 特定字段保留在插件中，而不是放入共享 core。

对于可移植的共享 schema 片段，请复用通过 `openclaw/plugin-sdk/channel-actions` 导出的通用 helpers：

- `createMessageToolButtonsSchema()` 用于按钮网格样式载荷
- `createMessageToolCardSchema()` 用于结构化卡片载荷

如果某种 schema 形态只适用于某个 provider，请在该插件自己的源码中定义，而不是将其提升到共享 SDK 中。

## 渠道目标解析

渠道插件应拥有渠道特定的目标语义。保持共享出站宿主的通用性，并使用消息 adapter 接口处理 provider 规则：

- `messaging.inferTargetChatType({ to })` 决定规范化目标在目录查找前应被视为 `direct`、`group` 还是 `channel`
- `messaging.targetResolver.looksLikeId(raw, normalized)` 告诉 core 某个输入是否应跳过目录搜索，直接进入类似 id 的解析
- `messaging.targetResolver.resolveTarget(...)` 是在规范化之后或目录未命中之后，core 需要最终由 provider 拥有的解析时使用的插件回退
- `messaging.resolveOutboundSessionRoute(...)` 则在目标解析完成后，负责 provider 特定的 session route 构造

推荐拆分方式：

- 将 `inferTargetChatType` 用于应在搜索 peers/groups 之前发生的类别决策
- 将 `looksLikeId` 用于“把这个视为显式/原生目标 id”的检查
- 将 `resolveTarget` 用于 provider 特定的规范化回退，而不是广泛的目录搜索
- 将 provider 原生 id，例如 chat id、thread id、JID、handle 和 room id，保留在 `target` 值或 provider 特定参数中，而不是放入通用 SDK 字段

## 配置支持的目录

如果插件根据配置派生目录条目，应将该逻辑保留在插件内部，并复用 `openclaw/plugin-sdk/directory-runtime` 中的共享 helpers。

当某个渠道需要配置支持的 peers/groups 时，请使用这种方式，例如：

- 由 allowlist 驱动的私信 peers
- 已配置的渠道/群组映射
- 账户级静态目录回退

`directory-runtime` 中的共享 helpers 仅处理通用操作：

- 查询过滤
- limit 应用
- 去重/规范化 helpers
- 构建 `ChannelDirectoryEntry[]`

渠道特定的账户检查和 id 规范化应保留在插件实现中。

## 提供商目录

提供商插件可以使用 `registerProvider({ catalog: { run(...) { ... } } })` 定义用于推理的模型目录。

`catalog.run(...)` 返回的形态与 OpenClaw 写入 `models.providers` 的形态相同：

- `{ provider }` 用于单个 provider 条目
- `{ providers }` 用于多个 provider 条目

当插件拥有 provider 特定 model id、base URL 默认值或受 auth 保护的模型元数据时，请使用 `catalog`。

`catalog.order` 控制插件目录相对于 OpenClaw 内置隐式 providers 的合并时机：

- `simple`：普通 API key 或环境驱动的 providers
- `profile`：当存在 auth profiles 时出现的 providers
- `paired`：综合生成多个相关 provider 条目的 providers
- `late`：最后一轮，在其他隐式 providers 之后

后出现的 provider 在键冲突时胜出，因此插件可以有意用相同 provider id 覆盖内置 provider 条目。

兼容性：

- `discovery` 仍作为 legacy 别名可用
- 如果同时注册了 `catalog` 和 `discovery`，OpenClaw 会使用 `catalog`

## 只读渠道检查

如果你的插件注册了某个渠道，除了 `resolveAccount(...)` 之外，也请优先实现 `plugin.config.inspectAccount(cfg, accountId)`。

原因：

- `resolveAccount(...)` 是运行时路径。它可以假定凭证已经完全具体化，并且在缺少必需 secret 时快速失败。
- `openclaw status`、`openclaw status --all`、`openclaw channels status`、`openclaw channels resolve` 以及 doctor/config 修复流程等只读命令路径，不应该仅为了描述配置就必须具体化运行时凭证。

推荐的 `inspectAccount(...)` 行为：

- 仅返回描述性的账户状态。
- 保留 `enabled` 和 `configured`。
- 在相关时包含凭证来源/状态字段，例如：
  - `tokenSource`、`tokenStatus`
  - `botTokenSource`、`botTokenStatus`
  - `appTokenSource`、`appTokenStatus`
  - `signingSecretSource`、`signingSecretStatus`
- 你不需要为了报告只读可用性而返回原始 token 值。返回 `tokenStatus: "available"`（以及匹配的 source 字段）就足够用于状态类命令。
- 当凭证通过 SecretRef 配置，但在当前命令路径不可用时，使用 `configured_unavailable`。

这样只读命令就可以报告“已配置，但在此命令路径中不可用”，而不是崩溃或错误地将该账户报告为未配置。

## 包集合

插件目录可以包含一个带有 `openclaw.extensions` 的 `package.json`：

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

每个条目都会变成一个插件。如果该 pack 列出多个扩展，插件 id 会变成 `name/<fileBase>`。

如果你的插件导入了 npm 依赖，请在该目录中安装它们，以便 `node_modules` 可用（`npm install` / `pnpm install`）。

安全护栏：每个 `openclaw.extensions` 条目在解析符号链接后都必须保留在插件目录内。凡是逃离包目录的条目都会被拒绝。

安全说明：`openclaw plugins install` 使用 `npm install --omit=dev --ignore-scripts` 安装插件依赖（运行时不包含生命周期脚本，也不安装 dev dependencies）。请保持插件依赖树为“纯 JS/TS”，并避免需要 `postinstall` 构建的包。

可选：`openclaw.setupEntry` 可以指向一个轻量级的仅 setup 模块。当 OpenClaw 需要为一个已禁用的渠道插件提供 setup 接口，或者某个渠道插件已启用但仍未配置时，它会加载 `setupEntry` 而不是完整插件入口。这样当主插件入口还会接入 tools、hooks 或其他仅运行时代码时，启动和 setup 都会更轻。

可选：`openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` 可以让渠道插件在 Gateway 网关预监听启动阶段，即使该渠道已经配置完成，也走同样的 `setupEntry` 路径。

仅当 `setupEntry` 完全覆盖了 gateway 开始监听前必须存在的启动接口时，才使用这个选项。实际上，这意味着 setup entry 必须注册启动所依赖的每一种渠道拥有能力，例如：

- 渠道注册本身
- 任何必须在 gateway 开始监听前可用的 HTTP routes
- 在同一时间窗口内必须存在的任何 gateway methods、tools 或 services

如果完整入口仍然拥有任何必需的启动能力，就不要启用此标记。保持插件默认行为，让 OpenClaw 在启动期间加载完整入口。

内置渠道也可以发布仅 setup 的契约接口 helper，供 core 在完整渠道运行时加载前进行查询。当前的 setup 提升接口包括：

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

当 core 需要在不加载完整插件入口的情况下，将 legacy 单账户渠道配置提升为 `channels.<id>.accounts.*` 时，就会使用该接口。Matrix 是当前的内置示例：当命名账户已存在时，它只会将 auth/bootstrap 键移动到命名提升账户中，并且它可以保留一个已配置的非规范 default-account 键，而不是总是创建 `accounts.default`。

这些 setup patch adapters 会让内置契约接口发现保持惰性。导入时开销保持很轻；提升接口仅在首次使用时加载，而不会在模块导入期间重新进入内置渠道启动。

当这些启动接口包含 gateway RPC methods 时，请将它们保留在插件特定前缀下。Core 管理员命名空间（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）仍然是保留的，并且始终解析为 `operator.admin`，即使插件请求了更窄的作用域。

示例：

```json
{
  "name": "@scope/my-channel",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

### 渠道目录元数据

渠道插件可以通过 `openclaw.channel` 宣传 setup/发现元数据，并通过 `openclaw.install` 宣传安装提示。这样可以让 core 目录保持无数据状态。

示例：

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Self-hosted chat via Nextcloud Talk webhook bots.",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "<bundled-plugin-local-path>",
      "defaultChoice": "npm"
    }
  }
}
```

除了最小示例外，实用的 `openclaw.channel` 字段还包括：

- `detailLabel`：为更丰富的目录/状态接口提供次级标签
- `docsLabel`：覆盖文档链接文本
- `preferOver`：该目录条目应优先于的低优先级插件/渠道 id
- `selectionDocsPrefix`、`selectionDocsOmitLabel`、`selectionExtras`：选择界面文案控制
- `markdownCapable`：将该渠道标记为支持 markdown，以供出站格式决策使用
- `showConfigured`：当设置为 `false` 时，在已配置渠道列表界面中隐藏该渠道
- `quickstartAllowFrom`：让该渠道加入标准快速开始 `allowFrom` 流程
- `forceAccountBinding`：即使只有一个账户，也要求显式账户绑定
- `preferSessionLookupForAnnounceTarget`：在解析 announce 目标时优先使用 session 查找

OpenClaw 还可以合并**外部渠道目录**（例如 MPM 注册表导出）。将 JSON 文件放在以下任一路径：

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

或者将 `OPENCLAW_PLUGIN_CATALOG_PATHS`（或 `OPENCLAW_MPM_CATALOG_PATHS`）指向一个或多个 JSON 文件（以逗号/分号/`PATH` 分隔）。每个文件应包含 `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`。解析器也接受 `"packages"` 或 `"plugins"` 作为 `"entries"` 键的 legacy 别名。

## 上下文引擎插件

上下文引擎插件拥有 session 上下文编排，包括摄取、组装和压缩。通过 `api.registerContextEngine(id, factory)` 从你的插件中注册它们，然后使用 `plugins.slots.contextEngine` 选择活动引擎。

当你的插件需要替换或扩展默认上下文流水线，而不仅仅是添加 memory 搜索或 hooks 时，请使用这个能力。

```ts
export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages }) {
      return { messages, estimatedTokens: 0 };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

如果你的引擎**不**拥有压缩算法，请仍然实现 `compact()` 并显式委托它：

```ts
import { delegateCompactionToRuntime } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", () => ({
    info: {
      id: "my-memory-engine",
      name: "My Memory Engine",
      ownsCompaction: false,
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages }) {
      return { messages, estimatedTokens: 0 };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## 添加新能力

当某个插件需要的行为不适合当前 API 时，不要通过私有内部访问绕过插件系统。请添加缺失的能力。

推荐顺序：

1. 定义 core 契约
   决定 core 应拥有哪些共享行为：策略、回退、配置合并、生命周期、面向渠道的语义，以及运行时 helper 形态。
2. 添加类型化插件注册/运行时接口
   用最小且有用的类型化能力接口扩展 `OpenClawPluginApi` 和/或 `api.runtime`。
3. 对接 core + 渠道/功能消费者
   渠道和功能插件应通过 core 消费新能力，而不是直接导入供应商实现。
4. 注册供应商实现
   然后由供应商插件将其后端注册到该能力上。
5. 添加契约覆盖
   添加测试，使所有权和注册形态能随着时间保持明确。

这就是 OpenClaw 如何在保持有主见的同时，不被某个提供商的世界观硬编码。具体文件清单和完整示例请参阅 [能力扩展手册](/tools/capability-cookbook)。

### 能力检查清单

当你添加一个新能力时，实现通常应同时涉及以下接口：

- `src/<capability>/types.ts` 中的 core 契约类型
- `src/<capability>/runtime.ts` 中的 core runner/运行时 helper
- `src/plugins/types.ts` 中的插件 API 注册接口
- `src/plugins/registry.ts` 中的插件注册表接线
- 当功能/渠道插件需要消费它时，在 `src/plugins/runtime/*` 中暴露插件运行时
- `src/test-utils/plugin-registration.ts` 中的捕获/测试 helpers
- `src/plugins/contracts/registry.ts` 中的所有权/契约断言
- `docs/` 中面向操作员/插件的文档

如果其中某个接口缺失，通常意味着这个能力还没有被完整集成。

### 能力模板

最小模式：

```ts
// core contract
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// plugin API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// shared runtime helper for feature/channel plugins
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

契约测试模式：

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

这样规则就很简单：

- core 拥有能力契约 + 编排
- 供应商插件拥有供应商实现
- 功能/渠道插件消费运行时 helpers
- 契约测试让所有权保持明确
