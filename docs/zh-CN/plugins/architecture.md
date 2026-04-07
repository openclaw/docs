---
read_when:
    - 构建或调试原生 OpenClaw 插件时
    - 了解插件能力模型或所有权边界时
    - 处理插件加载流水线或注册表时
    - 实现 provider 运行时 hook 或渠道插件时
sidebarTitle: Internals
summary: 插件内部机制：能力模型、所有权、契约、加载流水线与运行时辅助工具
title: 插件内部机制
x-i18n:
    generated_at: "2026-04-07T18:45:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: fc5a62710390dc6ad064b818222c1bb7609b3d076741f80bb5bbd9edb90342f1
    source_path: plugins/architecture.md
    workflow: 15
---

# 插件内部机制

<Info>
  这是**深度架构参考**。如需实用指南，请参阅：
  - [安装并使用插件](/zh-CN/tools/plugin) — 用户指南
  - [入门指南](/zh-CN/plugins/building-plugins) — 第一个插件教程
  - [渠道插件](/zh-CN/plugins/sdk-channel-plugins) — 构建消息渠道
  - [提供商插件](/zh-CN/plugins/sdk-provider-plugins) — 构建模型提供商
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
| 音乐生成 | `api.registerMusicGenerationProvider(...)` | `google`, `minimax` |
| 视频生成 | `api.registerVideoGenerationProvider(...)` | `qwen` |
| Web 抓取 | `api.registerWebFetchProvider(...)` | `firecrawl` |
| Web 搜索 | `api.registerWebSearchProvider(...)` | `google` |
| 渠道 / 消息 | `api.registerChannel(...)` | `msteams`, `matrix` |

一个注册了零个能力、但提供 hooks、工具或服务的插件，属于**传统仅 hook**插件。该模式仍然被完全支持。

### 外部兼容性立场

能力模型已经落地到核心中，并已被当前的内置/原生插件使用，但外部插件兼容性仍需要比“它被导出了，所以它就是冻结的”更严格的标准。

当前指引：

- **现有外部插件：** 保持基于 hook 的集成继续可用；将其视为兼容性基线
- **新的内置/原生插件：** 优先使用显式能力注册，而不是 vendor 特定的深层调用或新的仅 hook 设计
- **采用能力注册的外部插件：** 允许，但除非文档明确将某个契约标记为稳定，否则应将能力专用辅助接口视为仍在演进中

实际规则：

- 能力注册 API 是预期的发展方向
- 在过渡期间，传统 hooks 仍是外部插件最稳妥、最不易破坏的路径
- 被导出的辅助子路径并不都一样；优先使用文档化的窄契约，而不是偶然暴露的辅助导出

### 插件形态

OpenClaw 会根据每个已加载插件的实际注册行为来将其归类为某种形态（而不只是看静态元数据）：

- **plain-capability** -- 只注册一种能力类型（例如仅 provider 插件 `mistral`）
- **hybrid-capability** -- 注册多种能力类型（例如 `openai` 同时拥有文本推理、语音、媒体理解和图像生成）
- **hook-only** -- 只注册 hooks（类型化或自定义），没有能力、工具、命令或服务
- **non-capability** -- 注册工具、命令、服务或路由，但不注册能力

使用 `openclaw plugins inspect <id>` 可查看插件的形态及能力拆分。详情参见 [CLI 参考](/cli/plugins#inspect)。

### 传统 hooks

`before_agent_start` hook 仍作为仅 hook 插件的兼容性路径被支持。现实中仍有传统插件依赖它。

方向：

- 保持其可用
- 将其文档标记为传统方式
- 对于模型/provider 覆盖工作，优先使用 `before_model_resolve`
- 对于提示词变更工作，优先使用 `before_prompt_build`
- 只有在真实使用量下降，且固定装置覆盖证明迁移安全之后，才考虑移除

### 兼容性信号

当你运行 `openclaw doctor` 或 `openclaw plugins inspect <id>` 时，可能会看到以下标签之一：

| 信号 | 含义 |
| -------------------------- | ------------------------------------------------------------ |
| **config valid** | 配置解析正常，插件可正常解析 |
| **compatibility advisory** | 插件使用的是受支持但较旧的模式（例如 `hook-only`） |
| **legacy warning** | 插件使用 `before_agent_start`，该方式已弃用 |
| **hard error** | 配置无效或插件加载失败 |

`hook-only` 和 `before_agent_start` 当前都不会破坏你的插件——`hook-only` 只是提示，而 `before_agent_start` 只会触发警告。这些信号也会出现在 `openclaw status --all` 和 `openclaw plugins doctor` 中。

## 架构概览

OpenClaw 的插件系统分为四层：

1. **Manifest + 设备发现**
   OpenClaw 会从已配置路径、workspace 根目录、全局扩展根目录以及内置扩展中查找候选插件。设备发现会先读取原生 `openclaw.plugin.json` manifest 以及受支持的 bundle manifest。
2. **启用 + 验证**
   核心会决定某个已发现插件是启用、禁用、阻止，还是被选入类似内存这样的独占槽位。
3. **运行时加载**
   原生 OpenClaw 插件通过 jiti 在进程内加载，并将能力注册到中央注册表中。兼容 bundle 会被规范化为注册表记录，而无需导入运行时代码。
4. **接口消费**
   OpenClaw 的其余部分会读取注册表，以暴露工具、渠道、provider 设置、hooks、HTTP 路由、CLI 命令和服务。

对于插件 CLI，本身的根命令发现分为两个阶段：

- 解析期元数据来自 `registerCli(..., { descriptors: [...] })`
- 真正的插件 CLI 模块可以保持惰性，并在首次调用时再注册

这样既能让插件拥有自己的 CLI 代码，又能让 OpenClaw 在解析前预留根命令名称。

重要的设计边界：

- 设备发现 + 配置验证应基于**manifest/schema 元数据**工作，而不执行插件代码
- 原生运行时行为来自插件模块的 `register(api)` 路径

这种拆分使 OpenClaw 能在完整运行时尚未激活前，就完成配置验证、解释缺失/已禁用插件，并构建 UI/schema 提示。

### 渠道插件与共享 message 工具

渠道插件在正常聊天操作中，不需要单独注册发送/编辑/回应工具。OpenClaw 在核心中保留一个共享的 `message` 工具，而渠道插件则负责其背后的渠道特定发现与执行。

当前边界如下：

- 核心负责共享 `message` 工具宿主、提示词接线、会话/线程记录，以及执行分发
- 渠道插件负责作用域内动作发现、能力发现，以及所有渠道特定 schema 片段
- 渠道插件负责 provider 特定的会话对话语法，例如会话 id 如何编码线程 id，或如何从父会话继承
- 渠道插件通过其动作适配器执行最终动作

对于渠道插件，SDK 接口为
`ChannelMessageActionAdapter.describeMessageTool(...)`。这个统一的发现调用允许插件一并返回其可见动作、能力和 schema 贡献，从而避免这些部分发生漂移。

核心会将运行时作用域传入该发现步骤。重要字段包括：

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 受信任的入站 `requesterSenderId`

这对上下文敏感型插件非常重要。渠道可以根据当前账户、当前房间/线程/消息，或受信任的请求者身份，来隐藏或暴露消息动作，而无需在核心 `message` 工具中硬编码渠道特定分支。

这也是为什么嵌入式 runner 路由变更仍然属于插件工作：runner 负责把当前聊天/会话身份转发到插件发现边界，使共享 `message` 工具能在当前轮次暴露正确的渠道自有接口。

对于渠道自有执行辅助工具，内置插件应将执行运行时保留在自己的扩展模块内。核心不再拥有位于 `src/agents/tools` 下的 Discord、Slack、Telegram 或 WhatsApp 消息动作运行时。我们不会发布单独的 `plugin-sdk/*-action-runtime` 子路径，内置插件应直接从其自有扩展模块导入本地运行时代码。

同样的边界也适用于一般的 provider 命名 SDK 接缝：核心不应导入 Slack、Discord、Signal、WhatsApp 或类似扩展的渠道特定便捷 barrel。如果核心需要某种行为，要么使用内置插件自己的 `api.ts` / `runtime-api.ts` barrel，要么将该需求提升为共享 SDK 中的窄而通用的能力。

对于投票，当前有两条执行路径：

- `outbound.sendPoll` 是适用于通用投票模型渠道的共享基线
- `actions.handleAction("poll")` 是用于渠道特定投票语义或额外投票参数的首选路径

现在，核心会在插件投票分发拒绝该动作之后，才延迟进行共享投票解析，因此插件自有投票处理器可以接受渠道特定的投票字段，而不会先被通用投票解析器拦住。

完整启动顺序请参见 [加载流水线](#load-pipeline)。

## 能力所有权模型

OpenClaw 将原生插件视为一个**公司**或一个**功能**的所有权边界，而不是无关集成的大杂烩。

这意味着：

- 一个公司插件通常应拥有该公司的所有 OpenClaw 对外接口
- 一个功能插件通常应拥有其引入的完整功能接口
- 渠道应消费共享的核心能力，而不是临时自行实现 provider 行为

示例：

- 内置 `openai` 插件拥有 OpenAI 模型 provider 行为，以及 OpenAI 语音 + 实时语音 + 媒体理解 + 图像生成行为
- 内置 `elevenlabs` 插件拥有 ElevenLabs 语音行为
- 内置 `microsoft` 插件拥有 Microsoft 语音行为
- 内置 `google` 插件拥有 Google 模型 provider 行为，以及 Google 媒体理解 + 图像生成 + Web 搜索行为
- 内置 `firecrawl` 插件拥有 Firecrawl Web 抓取行为
- 内置 `minimax`、`mistral`、`moonshot` 和 `zai` 插件拥有其媒体理解后端
- `voice-call` 插件是一个功能插件：它拥有通话传输、工具、CLI、路由和 Twilio 媒体流桥接，但它消费共享的语音、实时转录和实时语音能力，而不是直接导入 vendor 插件

预期的最终状态是：

- 即便 OpenAI 横跨文本模型、语音、图像和未来的视频，也都集中在一个插件里
- 其他 vendor 也可以用同样方式管理自己的接口范围
- 渠道不关心哪个 vendor 插件拥有该 provider；它们只消费核心暴露的共享能力契约

这是关键区别：

- **plugin** = 所有权边界
- **capability** = 可被多个插件实现或消费的核心契约

因此，如果 OpenClaw 增加一个新领域，比如视频，首要问题不是“哪个 provider 应该硬编码处理视频？”首要问题是“核心的视频能力契约是什么？”一旦该契约存在，vendor 插件就可以注册实现，而渠道/功能插件则可以消费它。

如果该能力尚不存在，通常正确的做法是：

1. 在核心中定义缺失的能力
2. 通过插件 API/运行时以类型化方式暴露它
3. 让渠道/功能对接这个能力
4. 让 vendor 插件注册实现

这样既能保持所有权明确，又能避免核心行为依赖某个单一 vendor 或某条一次性的插件专用代码路径。

### 能力分层

在决定代码归属时，可以使用这个思维模型：

- **核心能力层**：共享编排、策略、回退、配置合并规则、交付语义和类型化契约
- **vendor 插件层**：vendor 特定 API、凭证、模型目录、语音合成、图像生成、未来视频后端、用量端点
- **渠道/功能插件层**：Slack/Discord/voice-call 等集成，消费核心能力并在某个接口上呈现

例如，TTS 遵循以下形态：

- 核心拥有回复时 TTS 策略、回退顺序、偏好和渠道投递
- `openai`、`elevenlabs` 和 `microsoft` 拥有合成实现
- `voice-call` 消费电话 TTS 运行时辅助工具

未来能力也应优先沿用这一模式。

### 多能力公司插件示例

从外部看，一个公司插件应当是内聚的。如果 OpenClaw 拥有模型、语音、实时转录、实时语音、媒体理解、图像生成、视频生成、Web 抓取和 Web 搜索的共享契约，那么某个 vendor 就可以在一个地方拥有其所有接口：

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

重要的不是具体的辅助函数名称，而是这种形态：

- 一个插件拥有 vendor 接口范围
- 核心仍拥有能力契约
- 渠道和功能插件消费 `api.runtime.*` 辅助工具，而不是 vendor 代码
- 契约测试可以断言该插件已注册其声称拥有的能力

### 能力示例：视频理解

OpenClaw 已经将图像/音频/视频理解视为一个共享能力。同样的所有权模型也适用于这里：

1. 核心定义媒体理解契约
2. vendor 插件按需注册 `describeImage`、`transcribeAudio` 和 `describeVideo`
3. 渠道和功能插件消费共享核心行为，而不是直接接到 vendor 代码

这样可以避免将某个 provider 的视频假设固化进核心。插件拥有 vendor 接口，核心拥有能力契约和回退行为。

视频生成也已经遵循同样的顺序：核心拥有类型化能力契约和运行时辅助工具，vendor 插件针对它注册 `api.registerVideoGenerationProvider(...)` 实现。

需要一个具体的发布清单吗？请参见
[能力扩展手册](/zh-CN/plugins/architecture)。

## 契约与强制执行

插件 API 接口被有意设计为类型化，并集中在
`OpenClawPluginApi` 中。该契约定义了受支持的注册点，以及插件可依赖的运行时辅助工具。

这很重要，因为：

- 插件作者可以获得一个稳定的内部标准
- 核心可以拒绝重复所有权，例如两个插件注册相同的 provider id
- 启动时可以为格式错误的注册给出可执行的诊断
- 契约测试可以强制约束内置插件的所有权，并防止静默漂移

这里有两层强制执行：

1. **运行时注册强制执行**
   插件注册表会在插件加载时验证注册内容。例如：重复 provider id、重复语音 provider id，以及格式错误的注册，都会产生插件诊断，而不是导致未定义行为。
2. **契约测试**
   在测试运行期间，内置插件会被捕获到契约注册表中，使 OpenClaw 可以显式断言所有权。目前这已用于模型 provider、语音 provider、Web 搜索 provider，以及内置注册所有权。

实际效果是，OpenClaw 可以预先知道哪个插件拥有哪个接口。这让核心和渠道能够无缝组合，因为所有权是显式声明、类型化且可测试的，而不是隐式的。

### 什么应该属于契约

好的插件契约应该是：

- 类型化的
- 小而精的
- 能力专用的
- 由核心拥有
- 可被多个插件复用
- 可被渠道/功能消费，而无需了解 vendor

差的插件契约则包括：

- 隐藏在核心中的 vendor 特定策略
- 绕过注册表的一次性插件逃生口
- 渠道代码直接深入 vendor 实现
- 不属于 `OpenClawPluginApi` 或 `api.runtime` 的临时运行时对象

如果拿不准，就提升抽象层级：先定义能力，再让插件接入它。

## 执行模型

原生 OpenClaw 插件与 Gateway 网关 **在同一进程内**运行。它们不是沙箱隔离的。一个已加载的原生插件与核心代码共享同样的进程级信任边界。

这意味着：

- 原生插件可以注册工具、网络处理器、hooks 和服务
- 原生插件中的 bug 可能导致 gateway 崩溃或不稳定
- 恶意原生插件等同于在 OpenClaw 进程内执行任意代码

兼容 bundle 默认更安全，因为 OpenClaw 当前将它们视为元数据/内容包。在当前版本中，这主要指内置 Skills。

对于非内置插件，请使用 allowlist 和显式安装/加载路径。将 workspace 插件视为开发期代码，而不是生产默认项。

对于内置 workspace 包名称，保持插件 id 与 npm 名称对齐：默认使用 `@openclaw/<id>`，或在包有意暴露更窄插件角色时，使用获批的类型后缀，例如 `-provider`、`-plugin`、`-speech`、`-sandbox` 或 `-media-understanding`。

重要的信任说明：

- `plugins.allow` 信任的是**插件 id**，而不是来源出处。
- 如果某个 workspace 插件与一个内置插件拥有相同 id，那么当该 workspace 插件被启用/加入 allowlist 时，它会有意覆盖内置副本。
- 这是正常且有用的，适用于本地开发、补丁测试和热修复。

## 导出边界

OpenClaw 导出的是能力，而不是实现便利接口。

保持能力注册公开。收紧非契约辅助导出：

- 内置插件专用辅助子路径
- 不打算作为公共 API 的运行时管线子路径
- vendor 特定便捷辅助工具
- 属于实现细节的 setup/新手引导辅助工具

某些内置插件辅助子路径仍为了兼容性和内置插件维护，而保留在生成的 SDK 导出映射中。当前示例包括
`plugin-sdk/feishu`、`plugin-sdk/feishu-setup`、`plugin-sdk/zalo`、
`plugin-sdk/zalo-setup` 以及多个 `plugin-sdk/matrix*` 接缝。应将这些视为保留的实现细节导出，而不是新第三方插件推荐使用的 SDK 模式。

## 加载流水线

启动时，OpenClaw 大致会执行以下步骤：

1. 发现候选插件根目录
2. 读取原生或兼容 bundle 的 manifest 和包元数据
3. 拒绝不安全的候选项
4. 规范化插件配置（`plugins.enabled`、`allow`、`deny`、`entries`、
   `slots`、`load.paths`）
5. 决定每个候选项的启用状态
6. 通过 jiti 加载已启用的原生模块
7. 调用原生 `register(api)`（或 `activate(api)` —— 一个传统别名）hook，并将注册内容收集到插件注册表中
8. 将注册表暴露给命令/运行时接口

<Note>
`activate` 是 `register` 的传统别名——加载器会解析其中存在的那个（`def.register ?? def.activate`），并在同一点调用。所有内置插件都使用 `register`；新插件请优先使用 `register`。
</Note>

安全门会发生在**运行时执行之前**。如果入口逃出插件根目录、路径对全体可写，或对于非内置插件来说路径所有权看起来可疑，候选项就会被阻止。

### Manifest 优先行为

manifest 是控制平面的事实来源。OpenClaw 用它来：

- 标识插件
- 发现声明的渠道/Skills/配置 schema 或 bundle 能力
- 验证 `plugins.entries.<id>.config`
- 补充 Control UI 标签/占位符
- 显示安装/目录元数据

对于原生插件，运行时模块则是数据平面部分。它会注册 hooks、工具、命令或 provider 流程等实际行为。

### 加载器缓存的内容

OpenClaw 会维护短期的进程内缓存，用于：

- 发现结果
- manifest 注册表数据
- 已加载的插件注册表

这些缓存用于降低启动突发与重复命令开销。可以把它们理解为短生命周期的性能缓存，而不是持久化。

性能说明：

- 设置 `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` 或
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` 可禁用这些缓存。
- 使用 `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` 和
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` 调整缓存窗口。

## 注册表模型

已加载插件不会直接改写随机的核心全局状态。它们会注册到中央插件注册表中。

注册表会追踪：

- 插件记录（标识、来源、出处、状态、诊断）
- 工具
- 传统 hooks 和类型化 hooks
- 渠道
- providers
- Gateway 网关 RPC 处理器
- HTTP 路由
- CLI 注册器
- 后台服务
- 插件自有命令

随后，核心功能会从这个注册表读取，而不是直接与插件模块交互。这让加载保持单向：

- 插件模块 -> 注册表注册
- 核心运行时 -> 注册表消费

这种分离对可维护性非常重要。它意味着大多数核心接口只需要一个集成点：“读取注册表”，而不是“为每个插件模块写特殊分支”。

## 会话绑定回调

绑定会话的插件可以在审批结果确定后作出响应。

使用 `api.onConversationBindingResolved(...)` 可在绑定请求获批或被拒后接收回调：

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
- `binding`：适用于已批准请求的已解析绑定
- `request`：原始请求摘要、分离提示、发送者 id，以及会话元数据

该回调仅用于通知。它不会改变谁可以绑定会话，并且会在核心审批处理完成后才运行。

## Provider 运行时 hooks

Provider 插件现在有两层：

- manifest 元数据：`providerAuthEnvVars` 用于在运行时加载前进行廉价的 provider 环境凭证查询，`channelEnvVars` 用于在运行时加载前进行廉价的渠道环境/setup 查询，以及 `providerAuthChoices` 用于在运行时加载前提供廉价的新手引导/凭证选择标签和 CLI flag 元数据
- 配置期 hooks：`catalog` / 传统 `discovery` 以及 `applyConfigDefaults`
- 运行时 hooks：`normalizeModelId`、`normalizeTransport`、
  `normalizeConfig`、
  `applyNativeStreamingUsageCompat`、`resolveConfigApiKey`、
  `resolveSyntheticAuth`、`resolveExternalAuthProfiles`、
  `shouldDeferSyntheticProfileAuth`、
  `resolveDynamicModel`、`prepareDynamicModel`、`normalizeResolvedModel`、
  `contributeResolvedModelCompat`、`capabilities`、
  `normalizeToolSchemas`、`inspectToolSchemas`、
  `resolveReasoningOutputMode`、`prepareExtraParams`、`createStreamFn`、
  `wrapStreamFn`、`resolveTransportTurnState`、
  `resolveWebSocketSessionPolicy`、`formatApiKey`、`refreshOAuth`、
  `buildAuthDoctorHint`、`matchesContextOverflowError`、
  `classifyFailoverReason`、`isCacheTtlEligible`、
  `buildMissingAuthMessage`、`suppressBuiltInModel`、`augmentModelCatalog`、
  `isBinaryThinking`、`supportsXHighThinking`、
  `resolveDefaultThinkingLevel`、`isModernModelRef`、`prepareRuntimeAuth`、
  `resolveUsageAuth`、`fetchUsageSnapshot`、`createEmbeddingProvider`、
  `buildReplayPolicy`、
  `sanitizeReplayHistory`、`validateReplayTurns`、`onModelSelected`

OpenClaw 仍然拥有通用智能体循环、故障转移、转录处理和工具策略。这些 hooks 是 provider 特定行为的扩展接口，而无需实现一整套自定义推理传输。

当 provider 具有基于环境变量的凭证，且通用凭证/状态/模型选择器路径需要在不加载插件运行时的情况下看到这些凭证时，请使用 manifest `providerAuthEnvVars`。当新手引导/凭证选择 CLI 接口需要在不加载 provider 运行时的情况下了解 provider 的 choice id、分组标签和简单的单 flag 凭证接线时，请使用 manifest `providerAuthChoices`。将 provider 运行时 `envVars` 保留给面向操作员的提示，例如新手引导标签或 OAuth client id/client secret 设置变量。

当某个渠道具有由环境变量驱动的凭证或 setup，且通用 shell 环境变量回退、配置/状态检查或 setup 提示需要在不加载渠道运行时的情况下看到这些信息时，请使用 manifest `channelEnvVars`。

### Hook 顺序与使用时机

对于模型/provider 插件，OpenClaw 大致按以下顺序调用 hooks。
“何时使用”列是快速决策指南。

| #   | Hook | 作用 | 何时使用 |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog` | 在生成 `models.json` 时，将 provider 配置发布到 `models.providers` | provider 拥有目录或 base URL 默认值时 |
| 2   | `applyConfigDefaults` | 在配置具体化期间应用 provider 自有的全局配置默认值 | 默认值取决于凭证模式、环境变量或 provider 模型家族语义时 |
| --  | _(内置模型查找)_ | OpenClaw 会先尝试常规注册表/目录路径 | _(不是插件 hook)_ |
| 3   | `normalizeModelId` | 在查找前规范化传统或预览 model id 别名 | provider 在规范模型解析前拥有别名清理逻辑时 |
| 4   | `normalizeTransport` | 在通用模型组装前规范化 provider 家族的 `api` / `baseUrl` | provider 需要为同一传输家族中的自定义 provider id 做传输清理时 |
| 5   | `normalizeConfig` | 在运行时/provider 解析前规范化 `models.providers.<id>` | provider 需要将配置清理逻辑放在插件内；内置 Google 家族辅助工具也会为受支持的 Google 配置项提供兜底 |
| 6   | `applyNativeStreamingUsageCompat` | 对配置 providers 应用原生流式用量兼容性重写 | provider 需要基于端点修复原生流式用量元数据时 |
| 7   | `resolveConfigApiKey` | 在加载运行时凭证前，为配置 providers 解析环境标记凭证 | provider 拥有自有的环境标记 API key 解析逻辑；`amazon-bedrock` 这里也有内置 AWS 环境标记解析器 |
| 8   | `resolveSyntheticAuth` | 在不持久化明文的情况下暴露本地/自托管或配置支持的凭证 | provider 可通过合成/本地凭证标记运行时 |
| 9   | `resolveExternalAuthProfiles` | 叠加 provider 自有的外部凭证档案；默认 `persistence` 为 `runtime-only`，适用于 CLI/应用自有凭证 | provider 复用外部凭证，而不持久化复制的 refresh token |
| 10  | `shouldDeferSyntheticProfileAuth` | 让已存储的合成档案占位符优先级低于环境/配置支持的凭证 | provider 存储了不应具有优先级的合成占位档案时 |
| 11  | `resolveDynamicModel` | 对本地注册表中尚不存在的 provider 自有 model id 进行同步回退解析 | provider 接受任意上游 model id 时 |
| 12  | `prepareDynamicModel` | 异步预热，然后再次运行 `resolveDynamicModel` | provider 需要在解析未知 id 前获取网络元数据时 |
| 13  | `normalizeResolvedModel` | 在嵌入式 runner 使用已解析模型前做最终重写 | provider 需要传输重写，但仍使用核心传输时 |
| 14  | `contributeResolvedModelCompat` | 为另一兼容传输背后的 vendor 模型贡献兼容标志 | provider 能在不接管 provider 的情况下识别自己的代理传输模型时 |
| 15  | `capabilities` | 共享核心逻辑使用的 provider 自有转录/工具元数据 | provider 需要处理转录/provider 家族特性时 |
| 16  | `normalizeToolSchemas` | 在嵌入式 runner 看到它们前规范化工具 schema | provider 需要做传输家族 schema 清理时 |
| 17  | `inspectToolSchemas` | 在规范化后暴露 provider 自有 schema 诊断 | provider 想要关键字警告，而不希望核心学习 provider 特定规则时 |
| 18  | `resolveReasoningOutputMode` | 选择原生或带标签的推理输出契约 | provider 需要带标签的推理/最终输出，而不是原生字段时 |
| 19  | `prepareExtraParams` | 在通用流式选项包装器前进行请求参数规范化 | provider 需要默认请求参数或按 provider 进行参数清理时 |
| 20  | `createStreamFn` | 用自定义传输完全替换正常流路径 | provider 需要自定义线协议，而不仅仅是包装器时 |
| 21  | `wrapStreamFn` | 在应用通用包装器之后再包装流 | provider 需要请求头/请求体/模型兼容包装器，而不是自定义传输时 |
| 22  | `resolveTransportTurnState` | 附加原生的逐轮传输头或元数据 | provider 希望通用传输发送 provider 原生轮次标识时 |
| 23  | `resolveWebSocketSessionPolicy` | 附加原生 WebSocket 头或会话冷却策略 | provider 希望通用 WS 传输调整会话头或回退策略时 |
| 24  | `formatApiKey` | 凭证档案格式化器：已存储档案转换为运行时 `apiKey` 字符串 | provider 存储额外凭证元数据，需要自定义运行时 token 形态时 |
| 25  | `refreshOAuth` | 为自定义刷新端点或刷新失败策略覆盖 OAuth 刷新逻辑 | provider 不适合共享 `pi-ai` 刷新器时 |
| 26  | `buildAuthDoctorHint` | 在 OAuth 刷新失败时追加修复提示 | provider 需要在刷新失败后给出 provider 自有的凭证修复指引时 |
| 27  | `matchesContextOverflowError` | provider 自有的上下文窗口溢出匹配器 | provider 存在通用启发式无法识别的原始溢出错误时 |
| 28  | `classifyFailoverReason` | provider 自有的故障转移原因分类 | provider 能将原始 API/传输错误映射到限流/过载等原因时 |
| 29  | `isCacheTtlEligible` | 面向代理/回传 providers 的提示词缓存策略 | provider 需要代理特定的缓存 TTL 门控时 |
| 30  | `buildMissingAuthMessage` | 替代通用的缺失凭证恢复消息 | provider 需要 provider 特定的缺失凭证恢复提示时 |
| 31  | `suppressBuiltInModel` | 过时上游模型抑制，并可附带面向用户的错误提示 | provider 需要隐藏过时上游行，或用 vendor 提示替换它们时 |
| 32  | `augmentModelCatalog` | 在设备发现后追加合成/最终目录行 | provider 需要在 `models list` 和选择器中添加合成的前向兼容条目时 |
| 33  | `isBinaryThinking` | 为二元 thinking provider 提供开/关推理切换 | provider 只暴露二元 thinking 开/关时 |
| 34  | `supportsXHighThinking` | 为选定模型提供 `xhigh` 推理支持 | provider 希望仅对部分模型支持 `xhigh` 时 |
| 35  | `resolveDefaultThinkingLevel` | 为特定模型家族提供默认 `/think` 级别 | provider 拥有某个模型家族的默认 `/think` 策略时 |
| 36  | `isModernModelRef` | 面向实时档案过滤和 smoke 选择的现代模型匹配器 | provider 拥有实时/smoke 首选模型匹配逻辑时 |
| 37  | `prepareRuntimeAuth` | 在推理前将已配置凭证交换为实际运行时 token/key | provider 需要 token 交换或短期请求凭证时 |
| 38  | `resolveUsageAuth` | 为 `/usage` 及相关状态接口解析用量/计费凭证 | provider 需要自定义用量/配额 token 解析，或需要不同的用量凭证时 |
| 39  | `fetchUsageSnapshot` | 在凭证解析后获取并规范化 provider 特定的用量/配额快照 | provider 需要 provider 特定的用量端点或载荷解析器时 |
| 40  | `createEmbeddingProvider` | 为 memory/search 构建 provider 自有嵌入适配器 | 内存嵌入行为应归属于 provider 插件时 |
| 41  | `buildReplayPolicy` | 返回控制 provider 转录处理的 replay 策略 | provider 需要自定义转录策略（例如移除 thinking block）时 |
| 42  | `sanitizeReplayHistory` | 在通用转录清理之后重写 replay 历史 | provider 需要在共享压缩辅助工具之外做 provider 特定 replay 重写时 |
| 43  | `validateReplayTurns` | 在嵌入式 runner 之前做最终 replay 轮次校验或整形 | provider 传输在通用清理后仍需要更严格的轮次校验时 |
| 44  | `onModelSelected` | 在模型被选中后执行 provider 自有副作用 | provider 需要在模型激活时记录遥测或更新 provider 自有状态时 |

`normalizeModelId`、`normalizeTransport` 和 `normalizeConfig` 会先检查已匹配的 provider 插件，然后回退到其他具备 hook 能力的 provider 插件，直到有一个实际改变 model id 或 transport/config 为止。这样可以让别名/兼容 provider shim 正常工作，而不要求调用方知道哪个内置插件拥有该重写逻辑。如果没有任何 provider hook 重写受支持的 Google 家族配置项，则内置 Google 配置规范化器仍会应用相应兼容性清理。

如果 provider 需要完全自定义的线协议或自定义请求执行器，那就属于另一类扩展。这些 hooks 适用于仍在 OpenClaw 常规推理循环上运行的 provider 行为。

### Provider 示例

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

- Anthropic 使用 `resolveDynamicModel`、`capabilities`、`buildAuthDoctorHint`、
  `resolveUsageAuth`、`fetchUsageSnapshot`、`isCacheTtlEligible`、
  `resolveDefaultThinkingLevel`、`applyConfigDefaults`、`isModernModelRef`，
  以及 `wrapStreamFn`，因为它拥有 Claude 4.6 前向兼容、provider 家族提示、凭证修复指引、用量端点集成、提示词缓存适用性、具备凭证感知的配置默认值、Claude 默认/自适应 thinking 策略，以及针对 beta headers、`/fast` / `serviceTier` 和 `context1m` 的 Anthropic 特定流整形。
- Anthropic 的 Claude 特定流辅助工具暂时保留在内置插件自己的公开 `api.ts` / `contract-api.ts` 接缝中。该包接口会导出 `wrapAnthropicProviderStream`、`resolveAnthropicBetas`、
  `resolveAnthropicFastMode`、`resolveAnthropicServiceTier` 以及更底层的 Anthropic 包装器构建工具，而不是为了某一个 provider 的 beta header 规则去扩大通用 SDK。
- OpenAI 使用 `resolveDynamicModel`、`normalizeResolvedModel` 和
  `capabilities`，以及 `buildMissingAuthMessage`、`suppressBuiltInModel`、
  `augmentModelCatalog`、`supportsXHighThinking` 和 `isModernModelRef`，
  因为它拥有 GPT-5.4 前向兼容、直接的 OpenAI
  `openai-completions` -> `openai-responses` 规范化、面向 Codex 的凭证提示、Spark 抑制、合成的 OpenAI 列表条目，以及 GPT-5 thinking / 实时模型策略；`openai-responses-defaults` 流家族则拥有共享的原生 OpenAI Responses 包装器，用于 attribution headers、
  `/fast`/`serviceTier`、文本冗长度、原生 Codex Web 搜索、推理兼容载荷整形，以及 Responses 上下文管理。
- OpenRouter 使用 `catalog` 以及 `resolveDynamicModel` 和
  `prepareDynamicModel`，因为该 provider 是透传型的，可能会在 OpenClaw 的静态目录更新之前暴露新 model id；它还使用
  `capabilities`、`wrapStreamFn` 和 `isCacheTtlEligible`，以便将 provider 特定的请求头、路由元数据、推理补丁和提示词缓存策略保持在核心之外。它的 replay 策略来自
  `passthrough-gemini` 家族，而 `openrouter-thinking` 流家族负责代理推理注入以及对不支持模型 / `auto` 的跳过逻辑。
- GitHub Copilot 使用 `catalog`、`auth`、`resolveDynamicModel` 和
  `capabilities`，以及 `prepareRuntimeAuth` 和 `fetchUsageSnapshot`，因为它需要 provider 自有的设备登录、模型回退行为、Claude 转录特性、GitHub token -> Copilot token 交换，以及 provider 自有的用量端点。
- OpenAI Codex 使用 `catalog`、`resolveDynamicModel`、
  `normalizeResolvedModel`、`refreshOAuth` 和 `augmentModelCatalog`，以及
  `prepareExtraParams`、`resolveUsageAuth` 和 `fetchUsageSnapshot`，因为它仍运行在核心 OpenAI 传输之上，但拥有自己的传输/base URL 规范化、OAuth 刷新回退策略、默认传输选择、合成 Codex 目录条目和 ChatGPT 用量端点集成；它与直接 OpenAI 共享同一个 `openai-responses-defaults` 流家族。
- Google AI Studio 和 Gemini CLI OAuth 使用 `resolveDynamicModel`、
  `buildReplayPolicy`、`sanitizeReplayHistory`、
  `resolveReasoningOutputMode`、`wrapStreamFn` 和 `isModernModelRef`，因为
  `google-gemini` replay 家族拥有 Gemini 3.1 前向兼容回退、原生 Gemini replay 校验、引导 replay 清理、带标签的推理输出模式以及现代模型匹配，而 `google-thinking` 流家族负责 Gemini thinking 载荷规范化；Gemini CLI OAuth 还使用 `formatApiKey`、`resolveUsageAuth` 和
  `fetchUsageSnapshot` 来处理 token 格式化、token 解析和配额端点接线。
- Anthropic Vertex 通过
  `anthropic-by-model` replay 家族使用 `buildReplayPolicy`，从而让 Claude 特定 replay 清理只作用于 Claude id，而不是每一个 `anthropic-messages` 传输。
- Amazon Bedrock 使用 `buildReplayPolicy`、`matchesContextOverflowError`、
  `classifyFailoverReason` 和 `resolveDefaultThinkingLevel`，因为它拥有面向 Anthropic-on-Bedrock 流量的 Bedrock 特定限流/未就绪/上下文溢出错误分类；其 replay 策略仍共享相同的仅 Claude `anthropic-by-model` 防护。
- OpenRouter、Kilocode、Opencode 和 Opencode Go 通过
  `passthrough-gemini` replay 家族使用 `buildReplayPolicy`，因为它们通过 OpenAI 兼容传输代理 Gemini 模型，并需要 Gemini thought-signature 清理，而不需要原生 Gemini replay 校验或引导重写。
- MiniMax 通过
  `hybrid-anthropic-openai` replay 家族使用 `buildReplayPolicy`，因为同一个 provider 同时拥有 Anthropic-message 和 OpenAI 兼容语义；它在 Anthropic 侧保留仅 Claude 的 thinking block 丢弃，同时将推理输出模式覆盖回原生，而 `minimax-fast-mode` 流家族则在共享流路径上拥有 fast-mode 模型重写。
- Moonshot 使用 `catalog` 以及 `wrapStreamFn`，因为它仍使用共享的 OpenAI 传输，但需要 provider 自有的 thinking 载荷规范化；`moonshot-thinking` 流家族将配置和 `/think` 状态映射到其原生二元 thinking 载荷。
- Kilocode 使用 `catalog`、`capabilities`、`wrapStreamFn` 和
  `isCacheTtlEligible`，因为它需要 provider 自有请求头、推理载荷规范化、Gemini 转录提示和 Anthropic 缓存 TTL 门控；`kilocode-thinking` 流家族则在共享代理流路径上保留 Kilo thinking 注入，同时跳过 `kilo/auto` 以及其他不支持显式推理载荷的代理 model id。
- Z.AI 使用 `resolveDynamicModel`、`prepareExtraParams`、`wrapStreamFn`、
  `isCacheTtlEligible`、`isBinaryThinking`、`isModernModelRef`、
  `resolveUsageAuth` 和 `fetchUsageSnapshot`，因为它拥有 GLM-5 回退、
  `tool_stream` 默认值、二元 thinking UX、现代模型匹配，以及用量凭证 + 配额抓取；`tool-stream-default-on` 流家族则让默认开启的 `tool_stream` 包装器不必写进各个 provider 的手写胶水代码中。
- xAI 使用 `normalizeResolvedModel`、`normalizeTransport`、
  `contributeResolvedModelCompat`、`prepareExtraParams`、`wrapStreamFn`、
  `resolveSyntheticAuth`、`resolveDynamicModel` 和 `isModernModelRef`，
  因为它拥有原生 xAI Responses 传输规范化、Grok fast-mode 别名重写、默认 `tool_stream`、严格工具 / 推理载荷清理、用于插件自有工具的回退凭证复用、前向兼容的 Grok 模型解析，以及 provider 自有兼容性补丁，例如 xAI 工具 schema 档案、不支持的 schema 关键字、原生 `web_search`，以及 HTML 实体工具调用参数解码。
- Mistral、OpenCode Zen 和 OpenCode Go 仅使用 `capabilities`，以将转录/工具特性保留在核心之外。
- 仅目录型内置 providers，例如 `byteplus`、`cloudflare-ai-gateway`、
  `huggingface`、`kimi-coding`、`nvidia`、`qianfan`、
  `synthetic`、`together`、`venice`、`vercel-ai-gateway` 和 `volcengine`，仅使用 `catalog`。
- Qwen 对其文本 provider 使用 `catalog`，并对其多模态接口注册共享的媒体理解和视频生成能力。
- MiniMax 和 Xiaomi 使用 `catalog` 以及用量 hooks，因为尽管推理仍通过共享传输运行，但它们的 `/usage` 行为属于插件自有。

## 运行时辅助工具

插件可以通过 `api.runtime` 访问部分核心辅助工具。对于 TTS：

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

- `textToSpeech` 返回适用于文件/语音便笺接口的标准核心 TTS 输出载荷。
- 使用核心 `messages.tts` 配置和 provider 选择。
- 返回 PCM 音频缓冲区 + 采样率。插件必须为 providers 重新采样/编码。
- `listVoices` 对每个 provider 都是可选的。可将其用于 vendor 自有语音选择器或 setup 流程。
- 语音列表可以包含更丰富的元数据，例如区域设置、性别和个性标签，以支持 provider 感知的选择器。
- 当前支持电话模式的是 OpenAI 和 ElevenLabs。Microsoft 不支持。

插件还可以通过 `api.registerSpeechProvider(...)` 注册语音 providers。

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

- 将 TTS 策略、回退和回复投递保留在核心中。
- 使用语音 providers 承载 vendor 自有合成行为。
- 传统 Microsoft `edge` 输入会被规范化为 `microsoft` provider id。
- 推荐的所有权模型是面向公司的：随着 OpenClaw 增加这些能力契约，一个 vendor 插件可以同时拥有文本、语音、图像和未来的媒体 providers。

对于图像/音频/视频理解，插件应注册一个类型化的媒体理解 provider，而不是通用键值包：

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

- 将编排、回退、配置和渠道接线保留在核心中。
- 将 vendor 行为保留在 provider 插件中。
- 增量扩展应保持类型化：新的可选方法、新的可选结果字段、新的可选能力。
- 视频生成也已遵循相同模式：
  - 核心拥有能力契约和运行时辅助工具
  - vendor 插件注册 `api.registerVideoGenerationProvider(...)`
  - 功能/渠道插件消费 `api.runtime.videoGeneration.*`

对于媒体理解运行时辅助工具，插件可以调用：

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

对于音频转录，插件既可以使用媒体理解运行时，也可以使用旧的 STT 别名：

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
- 使用核心媒体理解音频配置（`tools.media.audio`）和 provider 回退顺序。
- 当没有产生转录输出时（例如输入被跳过/不受支持），返回 `{ text: undefined }`。
- `api.runtime.stt.transcribeAudioFile(...)` 仍保留为兼容性别名。

插件还可以通过 `api.runtime.subagent` 启动后台子智能体运行：

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

- `provider` 和 `model` 是每次运行的可选覆盖项，不是持久性会话变更。
- OpenClaw 只会为受信任调用方启用这些覆盖字段。
- 对于插件自有回退运行，操作员必须通过 `plugins.entries.<id>.subagent.allowModelOverride: true` 显式启用。
- 使用 `plugins.entries.<id>.subagent.allowedModels` 可将受信任插件限制到特定的规范 `provider/model` 目标，或使用 `"*"` 明确允许任意目标。
- 不受信任插件的子智能体运行仍然可用，但其覆盖请求会被拒绝，而不是静默回退。

对于 Web 搜索，插件可以消费共享运行时辅助工具，而不必深入智能体工具接线：

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

插件还可以通过
`api.registerWebSearchProvider(...)` 注册 Web 搜索 providers。

说明：

- 将 provider 选择、凭证解析和共享请求语义保留在核心中。
- 使用 Web 搜索 providers 承载 vendor 特定搜索传输。
- `api.runtime.webSearch.*` 是功能/渠道插件在不依赖智能体工具包装器的情况下获取搜索能力的首选共享接口。

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

插件可以通过 `api.registerHttpRoute(...)` 暴露 HTTP 端点。

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
- `auth`：必填。使用 `"gateway"` 表示要求常规 Gateway 网关认证，或使用 `"plugin"` 表示使用插件管理的认证/webhook 校验。
- `match`：可选。`"exact"`（默认）或 `"prefix"`。
- `replaceExisting`：可选。允许同一插件替换其已存在的路由注册。
- `handler`：当路由已处理请求时返回 `true`。

说明：

- `api.registerHttpHandler(...)` 已被移除，并会导致插件加载错误。请改用 `api.registerHttpRoute(...)`。
- 插件路由必须显式声明 `auth`。
- 精确的 `path + match` 冲突会被拒绝，除非设置 `replaceExisting: true`，且一个插件不能替换另一个插件的路由。
- 不同 `auth` 级别的重叠路由会被拒绝。仅应在相同认证级别下保留 `exact`/`prefix` 级联链。
- `auth: "plugin"` 路由**不会**自动接收操作员运行时作用域。它们用于插件管理的 webhook/签名校验，而不是特权 Gateway 网关辅助调用。
- `auth: "gateway"` 路由会在 Gateway 网关请求运行时作用域内执行，但该作用域有意保持保守：
  - 共享密钥 bearer 认证（`gateway.auth.mode = "token"` / `"password"`）会将插件路由运行时作用域固定为 `operator.write`，即使调用方发送了 `x-openclaw-scopes`
  - 可信、携带身份的 HTTP 模式（例如 `trusted-proxy` 或私有入口下的 `gateway.auth.mode = "none"`）仅会在请求显式携带该 header 时尊重 `x-openclaw-scopes`
  - 如果这些携带身份的插件路由请求缺少 `x-openclaw-scopes`，则运行时作用域会回退为 `operator.write`
- 实际规则：不要假设一个 Gateway 网关认证的插件路由天然就是管理接口。如果你的路由需要仅管理员可用的行为，请要求使用携带身份的认证模式，并文档化显式的 `x-openclaw-scopes` header 契约。

## 插件 SDK 导入路径

在编写插件时，请使用 SDK 子路径，而不是单体式 `openclaw/plugin-sdk` 导入：

- `openclaw/plugin-sdk/plugin-entry` 用于插件注册原语。
- `openclaw/plugin-sdk/core` 用于通用共享的面向插件契约。
- `openclaw/plugin-sdk/config-schema` 用于根 `openclaw.json` Zod schema
  导出（`OpenClawSchema`）。
- 稳定的渠道原语，例如 `openclaw/plugin-sdk/channel-setup`、
  `openclaw/plugin-sdk/setup-runtime`、
  `openclaw/plugin-sdk/setup-adapter-runtime`、
  `openclaw/plugin-sdk/setup-tools`、
  `openclaw/plugin-sdk/channel-pairing`、
  `openclaw/plugin-sdk/channel-contract`、
  `openclaw/plugin-sdk/channel-feedback`、
  `openclaw/plugin-sdk/channel-inbound`、
  `openclaw/plugin-sdk/channel-lifecycle`、
  `openclaw/plugin-sdk/channel-reply-pipeline`、
  `openclaw/plugin-sdk/command-auth`、
  `openclaw/plugin-sdk/secret-input`，以及
  `openclaw/plugin-sdk/webhook-ingress`，用于共享的 setup/凭证/回复/webhook
  接线。`channel-inbound` 是 debounce、mention 匹配、入站 mention-policy 辅助工具、envelope 格式化和入站 envelope 上下文辅助工具的共享归属。
  `channel-setup` 是可选安装 setup 的窄接缝。
  `setup-runtime` 是 `setupEntry` / 延迟启动使用的运行时安全 setup 接口，其中包括可安全导入的 setup patch 适配器。
  `setup-adapter-runtime` 是具备环境感知能力的账户 setup 适配器接缝。
  `setup-tools` 是小型 CLI/归档/文档辅助接缝（`formatCliCommand`、
  `detectBinary`、`extractArchive`、`resolveBrewExecutable`、`formatDocsLink`、
  `CONFIG_DIR`）。
- 领域子路径，例如 `openclaw/plugin-sdk/channel-config-helpers`、
  `openclaw/plugin-sdk/allow-from`、
  `openclaw/plugin-sdk/channel-config-schema`、
  `openclaw/plugin-sdk/telegram-command-config`、
  `openclaw/plugin-sdk/channel-policy`、
  `openclaw/plugin-sdk/approval-handler-runtime`、
  `openclaw/plugin-sdk/approval-runtime`、
  `openclaw/plugin-sdk/config-runtime`、
  `openclaw/plugin-sdk/infra-runtime`、
  `openclaw/plugin-sdk/agent-runtime`、
  `openclaw/plugin-sdk/lazy-runtime`、
  `openclaw/plugin-sdk/reply-history`、
  `openclaw/plugin-sdk/routing`、
  `openclaw/plugin-sdk/status-helpers`、
  `openclaw/plugin-sdk/text-runtime`、
  `openclaw/plugin-sdk/runtime-store`，以及
  `openclaw/plugin-sdk/directory-runtime`，用于共享运行时/配置辅助工具。
  `telegram-command-config` 是 Telegram 自定义命令规范化/验证的狭义公共接缝，即使内置 Telegram 契约接口暂时不可用，它也仍可用。
  `text-runtime` 是共享的文本/Markdown/日志接缝，包括面向 assistant 可见文本的剥离、Markdown 渲染/分块辅助工具、脱敏辅助工具、directive tag 辅助工具和安全文本工具。
- 审批专用的渠道接缝应优先采用插件上的单一 `approvalCapability`
  契约。随后核心会通过这一个能力读取审批认证、投递、渲染、原生路由和惰性原生处理器行为，而不是将审批行为混入不相关的插件字段中。
- `openclaw/plugin-sdk/channel-runtime` 已弃用，仅作为旧插件的兼容性 shim 保留。新代码应改用更窄的通用原语导入，仓库代码也不应新增对该 shim 的导入。
- 内置扩展内部实现仍然是私有的。外部插件应只使用
  `openclaw/plugin-sdk/*` 子路径。OpenClaw 核心/测试代码可以使用插件包根目录下的仓库公共入口点，例如 `index.js`、`api.js`、
  `runtime-api.js`、`setup-entry.js`，以及范围更窄的文件，例如
  `login-qr-api.js`。绝不要从核心或其他扩展中导入某个插件包的 `src/*`。
- 仓库入口点拆分：
  `<plugin-package-root>/api.js` 是辅助工具/类型 barrel，
  `<plugin-package-root>/runtime-api.js` 是仅运行时 barrel，
  `<plugin-package-root>/index.js` 是内置插件入口，
  `<plugin-package-root>/setup-entry.js` 是 setup 插件入口。
- 当前内置 provider 示例：
  - Anthropic 使用 `api.js` / `contract-api.js` 承载 Claude 流辅助工具，例如 `wrapAnthropicProviderStream`、beta header 辅助工具和 `service_tier`
    解析。
  - OpenAI 使用 `api.js` 承载 provider 构建器、默认模型辅助工具和实时 provider 构建器。
  - OpenRouter 使用 `api.js` 承载其 provider 构建器以及新手引导/配置辅助工具，而 `register.runtime.js` 仍可为仓库本地使用重新导出通用
    `plugin-sdk/provider-stream` 辅助工具。
- 通过 facade 加载的公共入口点会优先使用当前活动的运行时配置快照；若 OpenClaw 尚未提供运行时快照，则回退到磁盘上的已解析配置文件。
- 通用共享原语仍是首选的公共 SDK 契约。仍然保留了一小部分带有内置渠道品牌的辅助工具接缝以作兼容。应将它们视为内置维护/兼容接缝，而不是新的第三方导入目标；新的跨渠道契约仍应落到通用 `plugin-sdk/*` 子路径或插件本地 `api.js` /
  `runtime-api.js` barrel 上。

兼容性说明：

- 新代码应避免使用根 `openclaw/plugin-sdk` barrel。
- 优先使用更窄且稳定的原语。较新的 setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool 子路径，是新的内置和外部插件工作的预期契约。
  目标解析/匹配应放在 `openclaw/plugin-sdk/channel-targets`。
  消息动作 gate 和 reaction message id 辅助工具应放在
  `openclaw/plugin-sdk/channel-actions`。
- 内置扩展专用辅助 barrel 默认不稳定。如果某个辅助工具只被内置扩展需要，请将其保留在扩展本地的 `api.js` 或 `runtime-api.js` 接缝后面，而不是提升为
  `openclaw/plugin-sdk/<extension>`。
- 新的共享辅助接缝应当是通用的，而不是渠道品牌化的。共享目标解析应放在 `openclaw/plugin-sdk/channel-targets`；渠道特定内部实现则保留在所属插件本地的 `api.js` 或 `runtime-api.js` 接缝之后。
- `image-generation`、
  `media-understanding` 和 `speech` 这类能力专用子路径之所以存在，是因为当前内置/原生插件正在使用它们。但这并不自动意味着其中每个导出的辅助工具都是长期冻结的外部契约。

## Message 工具 schema

插件应拥有渠道特定的 `describeMessageTool(...)` schema
贡献。将 provider 特定字段保留在插件中，而不是放入共享核心。

对于共享的可移植 schema 片段，请复用通过
`openclaw/plugin-sdk/channel-actions` 导出的通用辅助工具：

- `createMessageToolButtonsSchema()` 用于按钮网格样式载荷
- `createMessageToolCardSchema()` 用于结构化卡片载荷

如果某种 schema 形状只适用于某一个 provider，就应在该插件自己的源代码中定义，而不是提升进共享 SDK。

## 渠道目标解析

渠道插件应拥有渠道特定的目标语义。保持共享出站宿主的通用性，并使用消息适配器接口承载 provider 规则：

- `messaging.inferTargetChatType({ to })` 决定一个已规范化目标在目录查找前应被视为 `direct`、`group` 还是 `channel`。
- `messaging.targetResolver.looksLikeId(raw, normalized)` 告诉核心某个输入是否应直接跳过目录搜索，转入类似 id 的解析。
- `messaging.targetResolver.resolveTarget(...)` 是核心在规范化后或目录未命中后，需要最终 provider 自有解析时使用的插件回退路径。
- `messaging.resolveOutboundSessionRoute(...)` 在目标解析完成后负责 provider 特定的会话路由构造。

推荐拆分方式：

- 使用 `inferTargetChatType` 处理应在搜索 peers/groups 之前发生的分类决策。
- 使用 `looksLikeId` 处理“将其视为显式/原生目标 id”的判断。
- 将 `resolveTarget` 用于 provider 特定规范化回退，而不是宽泛的目录搜索。
- 将 provider 原生 id，例如 chat id、thread id、JID、handle 和 room id，保留在 `target` 值或 provider 特定参数中，而不是通用 SDK 字段里。

## 配置支持的目录

如果插件需要从配置派生目录项，应将该逻辑保留在插件内部，并复用
`openclaw/plugin-sdk/directory-runtime` 中的共享辅助工具。

当某个渠道需要配置支持的 peers/groups 时可使用它，例如：

- 基于 allowlist 的私信 peers
- 已配置的渠道/群组映射
- 账户作用域的静态目录回退

`directory-runtime` 中的共享辅助工具只处理通用操作：

- 查询过滤
- 限制应用
- 去重/规范化辅助工具
- 构建 `ChannelDirectoryEntry[]`

渠道特定的账户检查和 id 规范化应保留在插件实现中。

## Provider 目录

Provider 插件可以通过
`registerProvider({ catalog: { run(...) { ... } } })` 定义推理模型目录。

`catalog.run(...)` 返回与 OpenClaw 写入
`models.providers` 相同的结构：

- `{ provider }` 表示一个 provider 条目
- `{ providers }` 表示多个 provider 条目

当插件拥有 provider 特定 model id、base URL 默认值或受凭证控制的模型元数据时，请使用 `catalog`。

`catalog.order` 控制插件目录相对于 OpenClaw 内置隐式 providers 的合并时机：

- `simple`：简单 API key 或环境变量驱动的 providers
- `profile`：存在凭证档案时出现的 providers
- `paired`：会合成多个相关 provider 条目的 providers
- `late`：最后阶段，在其他隐式 providers 之后

后出现的 provider 在键冲突时获胜，因此插件可以有意用相同 provider id 覆盖内置 provider 条目。

兼容性：

- `discovery` 仍可作为传统别名使用
- 如果同时注册了 `catalog` 和 `discovery`，OpenClaw 会使用 `catalog`

## 只读渠道检查

如果你的插件注册了某个渠道，请优先实现
`plugin.config.inspectAccount(cfg, accountId)`，并同时实现 `resolveAccount(...)`。

原因如下：

- `resolveAccount(...)` 是运行时路径。它可以假定凭证已经完全实体化，并在缺少必需 secret 时快速失败。
- `openclaw status`、`openclaw status --all`、
  `openclaw channels status`、`openclaw channels resolve` 以及 doctor/配置修复流程等只读命令路径，不应为了描述配置就必须实体化运行时凭证。

推荐的 `inspectAccount(...)` 行为：

- 仅返回描述性的账户状态。
- 保留 `enabled` 和 `configured`。
- 在相关时包含凭证来源/状态字段，例如：
  - `tokenSource`、`tokenStatus`
  - `botTokenSource`、`botTokenStatus`
  - `appTokenSource`、`appTokenStatus`
  - `signingSecretSource`、`signingSecretStatus`
- 你不需要返回原始 token 值来报告只读可用性。返回
  `tokenStatus: "available"`（以及对应的来源字段）即可满足状态类命令。
- 当凭证通过 SecretRef 配置，但在当前命令路径中不可用时，请使用 `configured_unavailable`。

这样，只读命令就能报告“已配置，但在当前命令路径中不可用”，而不是崩溃或误报账户未配置。

## 包 pack

一个插件目录可以包含带有 `openclaw.extensions` 的 `package.json`：

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

每个条目都会成为一个插件。如果 pack 列出多个扩展，插件 id
会变为 `name/<fileBase>`。

如果你的插件导入了 npm 依赖，请在该目录中安装它们，以便
`node_modules` 可用（`npm install` / `pnpm install`）。

安全护栏：每个 `openclaw.extensions` 条目在解析符号链接后都必须保留在插件目录内。任何逃出包目录的条目都会被拒绝。

安全说明：`openclaw plugins install` 会使用
`npm install --omit=dev --ignore-scripts` 安装插件依赖（无生命周期脚本，运行时无开发依赖）。请保持插件依赖树为“纯 JS/TS”，并避免需要 `postinstall` 构建的包。

可选：`openclaw.setupEntry` 可以指向一个轻量级的仅 setup 模块。
当 OpenClaw 需要为已禁用的渠道插件提供 setup 接口，或者某个渠道插件已启用但仍未配置时，它会加载 `setupEntry` 而不是完整插件入口。这样，当你的主插件入口还会接线工具、hooks 或其他仅运行时代码时，启动和 setup 都会更轻量。

可选：`openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
可以让渠道插件在 gateway 的监听前启动阶段，即使渠道已经完成配置，也选择使用同样的 `setupEntry` 路径。

仅当 `setupEntry` 已完整覆盖 gateway 开始监听前必须存在的启动接口时才应使用这一选项。实际来说，这意味着 setup 入口必须注册启动所依赖的每一种渠道自有能力，例如：

- 渠道注册本身
- 任何必须在 gateway 开始监听前可用的 HTTP 路由
- 在同一时间窗口中必须存在的任何 gateway 方法、工具或服务

如果完整入口仍然拥有任何必需的启动能力，请不要启用此标志。保持插件使用默认行为，让 OpenClaw 在启动期间加载完整入口。

内置渠道还可以发布仅 setup 的契约接口辅助工具，供核心在完整渠道运行时加载前查询。当前 setup 提升接口为：

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

当核心需要在不加载完整插件入口的情况下，将传统单账户渠道配置提升为 `channels.<id>.accounts.*` 时，会使用这个接口。Matrix 是当前的内置示例：当已存在命名账户时，它只会将凭证/引导键移动到某个已命名的提升账户中，并且能够保留已配置的非规范默认账户键，而不是总创建 `accounts.default`。

这些 setup patch 适配器让内置契约接口发现保持惰性。导入时依然轻量；提升接口只会在首次使用时加载，而不会在模块导入时重新进入内置渠道启动过程。

当这些启动接口包含 gateway RPC 方法时，请保持它们使用插件专用前缀。核心管理命名空间（`config.*`、
`exec.approvals.*`、`wizard.*`、`update.*`）仍是保留的，并且始终解析为 `operator.admin`，即使某个插件请求更窄的作用域也是如此。

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

渠道插件可以通过 `openclaw.channel` 广告 setup/发现元数据，并通过
`openclaw.install` 提供安装提示。这样核心目录即可保持无数据化。

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

除最小示例外，还有一些实用的 `openclaw.channel` 字段：

- `detailLabel`：用于更丰富目录/状态接口的次级标签
- `docsLabel`：覆盖文档链接文本
- `preferOver`：该目录条目应优先于哪些低优先级插件/渠道 id
- `selectionDocsPrefix`、`selectionDocsOmitLabel`、`selectionExtras`：选择界面文案控制
- `markdownCapable`：将该渠道标记为支持 Markdown，用于出站格式决策
- `exposure.configured`：设为 `false` 时，在已配置渠道列表界面中隐藏该渠道
- `exposure.setup`：设为 `false` 时，在交互式 setup/配置选择器中隐藏该渠道
- `exposure.docs`：在文档导航界面中将该渠道标记为内部/私有
- `showConfigured` / `showInSetup`：仍因兼容性接受的传统别名；优先使用 `exposure`
- `quickstartAllowFrom`：使该渠道加入标准快速开始 `allowFrom` 流程
- `forceAccountBinding`：即使仅存在一个账户，也要求显式账户绑定
- `preferSessionLookupForAnnounceTarget`：在解析公告目标时优先使用会话查找

OpenClaw 还可以合并**外部渠道目录**（例如 MPM 注册表导出）。
将 JSON 文件放在以下任一位置：

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

或者将 `OPENCLAW_PLUGIN_CATALOG_PATHS`（或 `OPENCLAW_MPM_CATALOG_PATHS`）指向一个或多个 JSON 文件（使用逗号/分号/`PATH` 分隔）。每个文件应包含 `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`。解析器也接受将 `"packages"` 或 `"plugins"` 作为 `"entries"` 键的传统别名。

## 上下文引擎插件

上下文引擎插件拥有会话上下文的摄取、组装和压缩编排。从你的插件中通过
`api.registerContextEngine(id, factory)` 注册它们，然后使用
`plugins.slots.contextEngine` 选择活动引擎。

当你的插件需要替换或扩展默认上下文流水线，而不是仅添加内存搜索或 hooks 时，请使用这种方式。

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

如果你的引擎**不**拥有压缩算法，请保持实现 `compact()`，并显式委托：

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

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
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## 添加新能力

当插件需要当前 API 无法容纳的行为时，不要通过私有深层调用绕过插件系统。应添加缺失的能力。

推荐顺序：

1. 定义核心契约
   明确核心应拥有的共享行为：策略、回退、配置合并、生命周期、面向渠道的语义，以及运行时辅助工具形态。
2. 添加类型化的插件注册/运行时接口
   使用最小但有用的类型化能力接口扩展 `OpenClawPluginApi` 和/或 `api.runtime`。
3. 对接核心 + 渠道/功能消费者
   渠道和功能插件应通过核心消费新能力，而不是直接导入某个 vendor 实现。
4. 注册 vendor 实现
   然后由 vendor 插件将其后端注册到该能力上。
5. 添加契约覆盖
   添加测试，以便所有权和注册形态在后续演进中保持显式。

这就是 OpenClaw 保持有主见、却不被某个 provider 世界观硬编码绑死的方式。具体文件清单和完整示例请参见 [能力扩展手册](/zh-CN/plugins/architecture)。

### 能力清单

当你添加一个新能力时，通常应一并触及以下接口：

- `src/<capability>/types.ts` 中的核心契约类型
- `src/<capability>/runtime.ts` 中的核心 runner/运行时辅助工具
- `src/plugins/types.ts` 中的插件 API 注册接口
- `src/plugins/registry.ts` 中的插件注册表接线
- 当功能/渠道插件需要消费它时，在 `src/plugins/runtime/*` 中暴露插件运行时
- `src/test-utils/plugin-registration.ts` 中的捕获/测试辅助工具
- `src/plugins/contracts/registry.ts` 中的所有权/契约断言
- `docs/` 中面向操作员/插件的文档

如果其中某个接口缺失，通常说明该能力尚未被完整集成。

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

这样可以保持规则简单：

- 核心拥有能力契约 + 编排
- vendor 插件拥有 vendor 实现
- 功能/渠道插件消费运行时辅助工具
- 契约测试保持所有权显式化
