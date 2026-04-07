---
read_when:
    - 构建或调试原生 OpenClaw 插件
    - 理解插件能力模型或所有权边界
    - 处理插件加载流水线或注册表
    - 实现提供商运行时钩子或渠道插件
sidebarTitle: Internals
summary: 插件内部机制：能力模型、所有权、契约、加载流水线和运行时辅助工具
title: 插件内部机制
x-i18n:
    generated_at: "2026-04-07T20:11:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: c40ecf14e2a0b2b8d332027aed939cd61fb4289a489f4cd4c076c96d707d1138
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
  - [SDK 概览](/zh-CN/plugins/sdk-overview) — 导入映射和注册 API
</Info>

本页介绍 OpenClaw 插件系统的内部架构。

## 公共能力模型

能力是 OpenClaw 内部公共的**原生插件**模型。每个原生 OpenClaw 插件都会针对一种或多种能力类型进行注册：

| 能力 | 注册方法 | 示例插件 |
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
| 渠道 / 消息传递 | `api.registerChannel(...)` | `msteams`, `matrix` |

一个注册了零个能力，但提供钩子、工具或服务的插件，属于**仅旧版钩子**插件。该模式仍然受到完整支持。

### 外部兼容性立场

能力模型已经在核心中落地，并且如今已被内置 / 原生插件使用，但外部插件兼容性仍需要比“它已导出，所以它被冻结了”更严格的标准。

当前指导如下：

- **现有外部插件：**保持基于钩子的集成继续可用；将此视为兼容性基线
- **新的内置 / 原生插件：**优先使用显式能力注册，而不是供应商特定的深层调用或新的仅钩子设计
- **采用能力注册的外部插件：**允许，但除非文档明确将某个契约标记为稳定，否则应将能力特定的辅助工具表面视为仍在演进中

实践规则：

- 能力注册 API 是预期的发展方向
- 在过渡期间，旧版钩子仍然是外部插件最安全、最不易破坏的路径
- 已导出的辅助工具子路径并不完全等价；优先使用范围更窄、已有文档说明的契约，而不是偶然暴露出的辅助工具导出

### 插件形态

OpenClaw 会根据每个已加载插件的实际注册行为，而不只是静态元数据，将其归类为一种形态：

- **plain-capability** —— 恰好注册一种能力类型（例如仅提供商插件 `mistral`）
- **hybrid-capability** —— 注册多种能力类型（例如 `openai` 拥有文本推理、语音、媒体理解和图像生成）
- **hook-only** —— 仅注册钩子（类型化或自定义），不注册能力、工具、命令或服务
- **non-capability** —— 注册工具、命令、服务或路由，但不注册能力

使用 `openclaw plugins inspect <id>` 可查看插件的形态和能力明细。详见 [CLI 参考](/cli/plugins#inspect)。

### 旧版钩子

`before_agent_start` 钩子仍作为仅钩子插件的兼容路径受到支持。现实中的旧版插件仍依赖它。

方向如下：

- 保持其可用
- 将其记录为旧版
- 对于模型 / 提供商覆盖工作，优先使用 `before_model_resolve`
- 对于提示词变更工作，优先使用 `before_prompt_build`
- 只有在实际使用量下降并且夹具覆盖证明迁移安全后才移除

### 兼容性信号

当你运行 `openclaw doctor` 或 `openclaw plugins inspect <id>` 时，可能会看到以下标签之一：

| 信号 | 含义 |
| -------------------------- | ------------------------------------------------------------ |
| **config valid** | 配置解析正常且插件可解析 |
| **compatibility advisory** | 插件使用受支持但较旧的模式（例如 `hook-only`） |
| **legacy warning** | 插件使用 `before_agent_start`，该接口已弃用 |
| **hard error** | 配置无效或插件加载失败 |

当前，`hook-only` 和 `before_agent_start` 都不会导致你的插件损坏——`hook-only` 只是提示信息，而 `before_agent_start` 只会触发警告。这些信号也会出现在 `openclaw status --all` 和 `openclaw plugins doctor` 中。

## 架构概览

OpenClaw 的插件系统有四层：

1. **清单 + 发现**
   OpenClaw 会从已配置路径、工作区根目录、全局扩展根目录和内置扩展中查找候选插件。发现阶段会优先读取原生 `openclaw.plugin.json` 清单以及受支持的 bundle 清单。
2. **启用 + 验证**
   核心决定某个已发现的插件是启用、禁用、阻止，还是被选中用于某个独占槽位，例如 memory。
3. **运行时加载**
   原生 OpenClaw 插件通过 jiti 在进程内加载，并将能力注册到中央注册表中。兼容 bundle 会在不导入运行时代码的情况下被规范化为注册表记录。
4. **表面消费**
   OpenClaw 的其余部分读取注册表，以暴露工具、渠道、提供商设置、钩子、HTTP 路由、CLI 命令和服务。

专门针对插件 CLI，根命令发现分为两个阶段：

- 解析阶段元数据来自 `registerCli(..., { descriptors: [...] })`
- 真正的插件 CLI 模块可以保持延迟加载，并在首次调用时完成注册

这样可以让插件自有的 CLI 代码保留在插件内部，同时仍然让 OpenClaw 在解析前预留根命令名称。

重要的设计边界是：

- 发现 + 配置验证应基于**清单 / schema 元数据**完成，而不执行插件代码
- 原生运行时行为来自插件模块的 `register(api)` 路径

这种拆分使 OpenClaw 能在完整运行时尚未激活前，验证配置、解释缺失 / 已禁用的插件，并构建 UI / schema 提示。

### 渠道插件和共享 message 工具

对于常规聊天操作，渠道插件不需要单独注册发送 / 编辑 / 反应工具。OpenClaw 在核心中保留了一个共享的 `message` 工具，而渠道插件负责其背后的渠道特定发现和执行。

当前边界如下：

- 核心拥有共享 `message` 工具宿主、提示词接线、会话 / 线程簿记以及执行分发
- 渠道插件拥有作用域动作发现、能力发现以及任何渠道特定的 schema 片段
- 渠道插件拥有提供商特定的会话对话语法，例如对话 id 如何编码线程 id 或从父对话继承
- 渠道插件通过自己的动作适配器执行最终动作

对于渠道插件，SDK 表面是
`ChannelMessageActionAdapter.describeMessageTool(...)`。这个统一的发现调用让插件可以一起返回其可见动作、能力和 schema 贡献，从而避免这些部分发生漂移。

核心会将运行时作用域传入该发现步骤。重要字段包括：

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 受信任的入站 `requesterSenderId`

这对依赖上下文的插件很重要。一个渠道可以根据活动账户、当前房间 / 线程 / 消息，或受信任的请求方身份，隐藏或暴露消息动作，而无需在核心 `message` 工具中硬编码渠道特定分支。

这也是为什么嵌入式运行器路由变更仍然属于插件工作：运行器负责将当前聊天 / 会话身份转发到插件发现边界，从而让共享 `message` 工具在当前轮次暴露正确的渠道自有表面。

对于渠道自有的执行辅助工具，内置插件应将执行运行时保留在它们自己的扩展模块中。核心不再拥有 `src/agents/tools` 下的 Discord、Slack、Telegram 或 WhatsApp 消息动作运行时。我们不会发布单独的 `plugin-sdk/*-action-runtime` 子路径，内置插件应直接从其扩展自有模块导入自己的本地运行时代码。

同样的边界通常也适用于以提供商命名的 SDK 接缝：核心不应导入面向 Slack、Discord、Signal、WhatsApp 或类似扩展的渠道特定便利 barrel。如果核心需要某种行为，要么使用内置插件自己的 `api.ts` / `runtime-api.ts` barrel，要么将该需求提升为共享 SDK 中一个范围更窄的通用能力。

对于投票，存在两条执行路径：

- `outbound.sendPoll` 是适用于符合通用投票模型渠道的共享基线
- `actions.handleAction("poll")` 是用于渠道特定投票语义或额外投票参数的首选路径

现在，核心会在插件投票分发拒绝该动作后，才延迟进行共享投票解析，因此插件自有的投票处理器可以接受渠道特定的投票字段，而不会先被通用投票解析器拦住。

完整启动顺序请参阅 [加载流水线](#load-pipeline)。

## 能力所有权模型

OpenClaw 将原生插件视为**公司**或**功能**的所有权边界，而不是无关集成的杂物袋。

这意味着：

- 一个公司插件通常应拥有该公司面向 OpenClaw 的全部表面
- 一个功能插件通常应拥有其引入的完整功能表面
- 渠道应消费共享核心能力，而不是临时重新实现提供商行为

示例：

- 内置 `openai` 插件拥有 OpenAI 模型提供商行为，以及 OpenAI 的语音 + 实时语音 + 媒体理解 + 图像生成行为
- 内置 `elevenlabs` 插件拥有 ElevenLabs 语音行为
- 内置 `microsoft` 插件拥有 Microsoft 语音行为
- 内置 `google` 插件拥有 Google 模型提供商行为，以及 Google 的媒体理解 + 图像生成 + Web 搜索行为
- 内置 `firecrawl` 插件拥有 Firecrawl Web 抓取行为
- 内置 `minimax`、`mistral`、`moonshot` 和 `zai` 插件拥有它们各自的媒体理解后端
- `voice-call` 插件是一个功能插件：它拥有通话传输、工具、CLI、路由和 Twilio 媒体流桥接，但它消费共享的语音、实时转录和实时语音能力，而不是直接导入供应商插件

预期的最终状态是：

- OpenAI 即使横跨文本模型、语音、图像和未来视频，也只存在于一个插件中
- 其他供应商也可以对自己的表面采用相同方式
- 渠道不关心哪个供应商插件拥有该提供商；它们消费的是核心暴露出来的共享能力契约

这是关键区别：

- **plugin** = 所有权边界
- **capability** = 多个插件都可实现或消费的核心契约

因此，如果 OpenClaw 新增一个如视频这样的领域，首先不该问“哪个提供商应该硬编码视频处理？”而应该问“核心的视频能力契约是什么？”一旦这个契约存在，供应商插件就可以针对它注册，而渠道 / 功能插件也可以消费它。

如果该能力尚不存在，通常正确的做法是：

1. 在核心中定义缺失的能力
2. 通过插件 API / 运行时以类型化方式暴露它
3. 让渠道 / 功能围绕该能力接线
4. 让供应商插件注册实现

这样可以保持所有权清晰，同时避免核心行为依赖单一供应商或某条一次性的插件特定代码路径。

### 能力分层

当你决定代码应放在哪里时，可以使用以下思维模型：

- **核心能力层**：共享编排、策略、回退、配置合并规则、交付语义和类型化契约
- **供应商插件层**：供应商特定的 API、凭证、模型目录、语音合成、图像生成、未来视频后端、使用量端点
- **渠道 / 功能插件层**：Slack / Discord / voice-call / 等集成，它们消费核心能力并将其呈现在某个表面上

例如，TTS 采用以下结构：

- 核心拥有回复时 TTS 策略、回退顺序、偏好和渠道交付
- `openai`、`elevenlabs` 和 `microsoft` 拥有合成实现
- `voice-call` 消费电话 TTS 运行时辅助工具

未来的能力也应优先沿用相同模式。

### 多能力公司插件示例

一个公司插件从外部看应当是统一且内聚的。如果 OpenClaw 为模型、语音、实时转录、实时语音、媒体理解、图像生成、视频生成、Web 抓取和 Web 搜索提供了共享契约，那么一个供应商就可以在一个地方拥有自己全部的表面：

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

重要的不是辅助工具的确切名称，而是其结构：

- 一个插件拥有供应商表面
- 核心仍然拥有能力契约
- 渠道和功能插件消费 `api.runtime.*` 辅助工具，而不是供应商代码
- 契约测试可以断言该插件注册了它声称拥有的能力

### 能力示例：视频理解

OpenClaw 已经将图像 / 音频 / 视频理解视为一个共享能力。在这里同样适用相同的所有权模型：

1. 核心定义媒体理解契约
2. 供应商插件按需注册 `describeImage`、`transcribeAudio` 和 `describeVideo`
3. 渠道和功能插件消费共享核心行为，而不是直接连接到供应商代码

这样可以避免将某一家提供商对视频的假设写死在核心中。插件拥有供应商表面；核心拥有能力契约和回退行为。

视频生成已经采用同样的顺序：核心拥有类型化能力契约和运行时辅助工具，供应商插件则针对它注册 `api.registerVideoGenerationProvider(...)` 实现。

需要具体的发布清单吗？请参阅
[能力扩展手册](/zh-CN/plugins/architecture)。

## 契约与强制执行

插件 API 表面刻意以 `OpenClawPluginApi` 为中心，并保持类型化和集中化。该契约定义了受支持的注册点以及插件可以依赖的运行时辅助工具。

这很重要，因为：

- 插件作者获得了一套稳定的内部标准
- 核心可以拒绝重复所有权，例如两个插件注册相同的 provider id
- 启动过程可以为格式错误的注册暴露可操作的诊断信息
- 契约测试可以强制执行内置插件的所有权，并防止静默漂移

强制执行分为两层：

1. **运行时注册强制执行**
   插件注册表会在插件加载时验证注册。例如：重复的 provider id、重复的 speech provider id，以及格式错误的注册，都会生成插件诊断信息，而不是产生未定义行为。
2. **契约测试**
   在测试运行期间，内置插件会被捕获到契约注册表中，以便 OpenClaw 可以明确断言所有权。如今这已用于模型提供商、语音提供商、Web 搜索提供商以及内置注册所有权。

实际效果是，OpenClaw 能够预先知道哪个插件拥有哪个表面。这让核心和渠道能够无缝组合，因为所有权是显式声明、类型化且可测试的，而不是隐式存在的。

### 什么应该属于一个契约

好的插件契约应当是：

- 类型化
- 小而精
- 能力特定
- 由核心拥有
- 可被多个插件复用
- 可被渠道 / 功能在不了解供应商细节的情况下消费

糟糕的插件契约包括：

- 隐藏在核心中的供应商特定策略
- 绕过注册表的一次性插件逃生口
- 直接深入供应商实现的渠道代码
- 不属于 `OpenClawPluginApi` 或 `api.runtime` 的临时运行时对象

如果拿不准，就提高抽象层级：先定义能力，再让插件接入它。

## 执行模型

原生 OpenClaw 插件与 Gateway 网关 **在同一进程内**运行。它们不是沙箱隔离的。一个已加载的原生插件，与核心代码处于同样的进程级信任边界内。

其影响包括：

- 原生插件可以注册工具、网络处理器、钩子和服务
- 原生插件中的 bug 可能导致 Gateway 网关崩溃或不稳定
- 恶意原生插件等同于在 OpenClaw 进程内执行任意代码

兼容 bundle 默认更安全，因为 OpenClaw 当前将它们视为元数据 / 内容包。在当前版本中，这主要意味着内置 skills。

对于非内置插件，请使用 allowlist 和显式的安装 / 加载路径。将工作区插件视为开发期代码，而不是生产默认项。

对于内置工作区包名，请保持插件 id 锚定在 npm 名称中：默认使用 `@openclaw/<id>`，或者使用经过批准的类型化后缀，例如 `-provider`、`-plugin`、`-speech`、`-sandbox` 或 `-media-understanding`，当该包有意暴露更窄的插件角色时可使用这些后缀。

重要的信任说明：

- `plugins.allow` 信任的是**插件 id**，而不是来源出处。
- 与内置插件同 id 的工作区插件，在该工作区插件启用 / 被 allowlist 后，会有意覆盖内置副本。
- 这属于正常且有用的行为，适用于本地开发、补丁测试和热修复。

## 导出边界

OpenClaw 导出的是能力，而不是实现层面的便利接口。

保持能力注册为公共接口。裁剪非契约辅助工具导出：

- 内置插件特定的辅助工具子路径
- 无意作为公共 API 的运行时接线子路径
- 供应商特定的便利辅助工具
- 属于实现细节的设置 / onboarding 辅助工具

为了兼容性和内置插件维护，一些内置插件辅助工具子路径仍然保留在生成的 SDK 导出映射中。当前示例包括 `plugin-sdk/feishu`、`plugin-sdk/feishu-setup`、`plugin-sdk/zalo`、`plugin-sdk/zalo-setup` 以及若干 `plugin-sdk/matrix*` 接缝。应将它们视为保留的实现细节导出，而不是面向新第三方插件的推荐 SDK 模式。

## 加载流水线

在启动时，OpenClaw 大致会执行以下步骤：

1. 发现候选插件根目录
2. 读取原生或兼容 bundle 的清单及包元数据
3. 拒绝不安全的候选项
4. 规范化插件配置（`plugins.enabled`、`allow`、`deny`、`entries`、`slots`、`load.paths`）
5. 为每个候选项决定启用状态
6. 通过 jiti 加载已启用的原生模块
7. 调用原生 `register(api)`（或 `activate(api)`——旧版别名）钩子，并将注册收集到插件注册表中
8. 将注册表暴露给命令 / 运行时表面

<Note>
`activate` 是 `register` 的旧版别名——加载器会解析存在的那个（`def.register ?? def.activate`），并在同一位置调用它。所有内置插件都使用 `register`；新插件请优先使用 `register`。
</Note>

安全门禁发生在**运行时代码执行之前**。如果入口逃离插件根目录、路径对全体用户可写，或对于非内置插件而言路径所有权看起来可疑，候选项就会被阻止。

### 清单优先行为

清单是控制平面的事实来源。OpenClaw 使用它来：

- 标识插件
- 发现声明的渠道 / skills / 配置 schema 或 bundle 能力
- 验证 `plugins.entries.<id>.config`
- 增强控制 UI 标签 / 占位符
- 显示安装 / 目录元数据

对于原生插件，运行时模块属于数据平面部分。它会注册诸如钩子、工具、命令或提供商流程等实际行为。

### 加载器会缓存什么

OpenClaw 会在进程内维护短期缓存，用于：

- 发现结果
- 清单注册表数据
- 已加载的插件注册表

这些缓存可减少突发启动开销和重复命令开销。你可以安全地将它们理解为短期性能缓存，而不是持久化机制。

性能说明：

- 设置 `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` 或
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` 可禁用这些缓存。
- 使用 `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` 和
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` 调整缓存窗口。

## 注册表模型

已加载的插件不会直接修改任意核心全局状态。它们会注册到一个中央插件注册表中。

该注册表会跟踪：

- 插件记录（身份、来源、起源、状态、诊断信息）
- 工具
- 旧版钩子和类型化钩子
- 渠道
- 提供商
- Gateway 网关 RPC 处理器
- HTTP 路由
- CLI 注册器
- 后台服务
- 插件自有命令

核心功能随后从这个注册表读取信息，而不是直接与插件模块交互。这使加载保持单向：

- 插件模块 -> 注册表注册
- 核心运行时 -> 注册表消费

这种分离对可维护性很重要。它意味着大多数核心表面只需要一个集成点：“读取注册表”，而不是“为每个插件模块写特例”。

## 会话绑定回调

绑定会话的插件可以在批准被解析时做出响应。

使用 `api.onConversationBindingResolved(...)`，在绑定请求被批准或拒绝后接收一个回调：

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
- `binding`：用于已批准请求的已解析绑定
- `request`：原始请求摘要、分离提示、发送者 id 以及会话元数据

该回调仅用于通知。它不会改变谁被允许绑定会话，并且会在核心审批处理完成后运行。

## 提供商运行时钩子

提供商插件现在有两层：

- 清单元数据：`providerAuthEnvVars` 用于在运行时加载前进行低成本的提供商环境凭证查找，`channelEnvVars` 用于在运行时加载前进行低成本的渠道环境 / 设置查找，此外还有 `providerAuthChoices`，用于在运行时加载前进行低成本 onboarding / 认证选项标签和 CLI 标志元数据
- 配置时钩子：`catalog` / 旧版 `discovery`，以及 `applyConfigDefaults`
- 运行时钩子：`normalizeModelId`、`normalizeTransport`、
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

OpenClaw 仍然拥有通用智能体循环、故障转移、转录处理和工具策略。这些钩子是提供商特定行为的扩展表面，而无需一整套自定义推理传输层。

当某个提供商具有基于环境变量的凭证，并且通用 auth / status / model-picker 路径需要在不加载插件运行时的情况下看到这些凭证时，请使用清单中的 `providerAuthEnvVars`。当 onboarding / 认证选项 CLI 表面需要在不加载提供商运行时的情况下，知道该提供商的 choice id、分组标签和简单的单标志认证接线时，请使用清单中的 `providerAuthChoices`。保留提供商运行时中的 `envVars`，用于面向运维人员的提示，例如 onboarding 标签或 OAuth client-id / client-secret 设置变量。

当某个渠道具有由环境变量驱动的认证或设置，并且通用 shell-env 回退、配置 / 状态检查或设置提示需要在不加载渠道运行时的情况下看到它时，请使用清单中的 `channelEnvVars`。

### 钩子顺序和用法

对于模型 / 提供商插件，OpenClaw 会大致按以下顺序调用钩子。
“何时使用”列是快速决策指南。

| #   | 钩子 | 它的作用 | 何时使用 |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog` | 在生成 `models.json` 时将提供商配置发布到 `models.providers` 中 | 提供商拥有目录或 base URL 默认值 |
| 2   | `applyConfigDefaults` | 在配置具体化期间应用提供商自有的全局配置默认值 | 默认值取决于认证模式、环境或提供商模型族语义 |
| --  | _(内置模型查找)_ | OpenClaw 会先尝试正常的注册表 / 目录路径 | _(不是插件钩子)_ |
| 3   | `normalizeModelId` | 在查找前规范化旧版或预览 model-id 别名 | 提供商在标准模型解析前拥有别名清理逻辑 |
| 4   | `normalizeTransport` | 在通用模型组装前规范化提供商家族的 `api` / `baseUrl` | 提供商在同一传输家族中拥有用于自定义 provider id 的传输清理逻辑 |
| 5   | `normalizeConfig` | 在运行时 / 提供商解析前规范化 `models.providers.<id>` | 提供商需要由插件持有的配置清理逻辑；内置的 Google 家族辅助工具也会为受支持的 Google 配置项兜底 |
| 6   | `applyNativeStreamingUsageCompat` | 将原生流式 usage 兼容重写应用到配置提供商 | 提供商需要基于端点的原生流式 usage 元数据修复 |
| 7   | `resolveConfigApiKey` | 在加载运行时 auth 之前，为配置提供商解析 env-marker 认证 | 提供商拥有自有的 env-marker API key 解析逻辑；`amazon-bedrock` 在此也有内置 AWS env-marker 解析器 |
| 8   | `resolveSyntheticAuth` | 暴露 local / self-hosted 或基于配置的 auth，而不持久化明文 | 提供商可以使用 synthetic / local 凭证标记运行 |
| 9   | `resolveExternalAuthProfiles` | 叠加提供商自有的外部 auth 配置；默认 `persistence` 为 `runtime-only`，用于 CLI / 应用自有凭证 | 提供商复用外部 auth 凭证，而不持久化复制来的 refresh token |
| 10  | `shouldDeferSyntheticProfileAuth` | 将已存储的 synthetic profile 占位符降级到 env / config 支持的 auth 之后 | 提供商会存储 synthetic 占位 profile，而这些 profile 不应具有更高优先级 |
| 11  | `resolveDynamicModel` | 为尚未进入本地注册表的提供商自有 model id 提供同步回退 | 提供商接受任意上游 model id |
| 12  | `prepareDynamicModel` | 执行异步预热，然后再次运行 `resolveDynamicModel` | 提供商在解析未知 id 前需要网络元数据 |
| 13  | `normalizeResolvedModel` | 在嵌入式运行器使用已解析模型前做最终重写 | 提供商需要传输重写，但仍使用核心传输 |
| 14  | `contributeResolvedModelCompat` | 为位于其他兼容传输背后的供应商模型贡献兼容标志 | 提供商在代理传输上识别自己的模型，而不接管该提供商 |
| 15  | `capabilities` | 由共享核心逻辑使用的提供商自有转录 / 工具元数据 | 提供商需要转录 / 提供商家族特性处理 |
| 16  | `normalizeToolSchemas` | 在嵌入式运行器看到工具 schema 前进行规范化 | 提供商需要传输家族的 schema 清理 |
| 17  | `inspectToolSchemas` | 在规范化后暴露提供商自有 schema 诊断 | 提供商希望发出关键字警告，而不需要让核心理解提供商特定规则 |
| 18  | `resolveReasoningOutputMode` | 选择原生还是带标签的推理输出契约 | 提供商需要使用带标签的推理 / 最终输出，而不是原生字段 |
| 19  | `prepareExtraParams` | 在通用流式选项包装器之前进行请求参数规范化 | 提供商需要默认请求参数或每个提供商的参数清理 |
| 20  | `createStreamFn` | 用自定义传输完全替换正常流路径 | 提供商需要自定义线协议，而不仅是包装器 |
| 21  | `wrapStreamFn` | 在通用包装器应用后再进行流包装 | 提供商需要请求头 / 请求体 / 模型兼容包装器，但不需要自定义传输 |
| 22  | `resolveTransportTurnState` | 附加原生的逐轮传输头或元数据 | 提供商希望通用传输发送提供商原生的轮次身份 |
| 23  | `resolveWebSocketSessionPolicy` | 附加原生 WebSocket 头或会话冷却策略 | 提供商希望通用 WS 传输调整会话头或回退策略 |
| 24  | `formatApiKey` | auth profile 格式化器：存储的 profile 变成运行时 `apiKey` 字符串 | 提供商会存储额外 auth 元数据，并需要自定义运行时 token 形态 |
| 25  | `refreshOAuth` | 针对自定义刷新端点或刷新失败策略覆盖 OAuth 刷新 | 提供商不适配共享 `pi-ai` 刷新器 |
| 26  | `buildAuthDoctorHint` | 在 OAuth 刷新失败时附加修复提示 | 提供商需要在刷新失败后提供自有 auth 修复指引 |
| 27  | `matchesContextOverflowError` | 提供商自有的上下文窗口溢出匹配器 | 提供商存在通用启发式无法识别的原始溢出错误 |
| 28  | `classifyFailoverReason` | 提供商自有的故障转移原因分类 | 提供商可以将原始 API / 传输错误映射为限流 / 过载等 |
| 29  | `isCacheTtlEligible` | 面向代理 / 回程提供商的提示词缓存策略 | 提供商需要代理特定的缓存 TTL 门控 |
| 30  | `buildMissingAuthMessage` | 替换通用缺失认证恢复消息 | 提供商需要特定的缺失认证恢复提示 |
| 31  | `suppressBuiltInModel` | 过期上游模型抑制以及可选的面向用户错误提示 | 提供商需要隐藏过期上游条目或用供应商提示替代 |
| 32  | `augmentModelCatalog` | 在发现之后追加 synthetic / 最终目录行 | 提供商需要在 `models list` 和选择器中加入 synthetic 前向兼容条目 |
| 33  | `isBinaryThinking` | 面向二元 thinking 提供商的开 / 关推理切换 | 提供商只暴露二元 thinking 开 / 关 |
| 34  | `supportsXHighThinking` | 为特定模型提供 `xhigh` 推理支持 | 提供商只希望在部分模型上提供 `xhigh` |
| 35  | `resolveDefaultThinkingLevel` | 某个特定模型族的默认 `/think` 级别 | 提供商拥有某个模型族默认 `/think` 策略 |
| 36  | `isModernModelRef` | 面向实时 profile 过滤和 smoke 选择的现代模型匹配器 | 提供商拥有 live / smoke 首选模型匹配逻辑 |
| 37  | `prepareRuntimeAuth` | 在推理前将已配置凭证交换为实际运行时 token / key | 提供商需要 token 交换或短期请求凭证 |
| 38  | `resolveUsageAuth` | 为 `/usage` 及相关状态表面解析使用量 / 计费凭证 | 提供商需要自定义使用量 / 配额 token 解析，或使用不同的使用量凭证 |
| 39  | `fetchUsageSnapshot` | 在解析 auth 后抓取并规范化提供商特定的使用量 / 配额快照 | 提供商需要特定的使用量端点或载荷解析器 |
| 40  | `createEmbeddingProvider` | 为 memory / search 构建提供商自有的 embedding 适配器 | memory embedding 行为应归属于提供商插件 |
| 41  | `buildReplayPolicy` | 返回控制提供商转录处理的 replay 策略 | 提供商需要自定义转录策略（例如去除 thinking block） |
| 42  | `sanitizeReplayHistory` | 在通用转录清理后重写 replay 历史 | 提供商需要超出共享压缩辅助工具之外的 replay 重写 |
| 43  | `validateReplayTurns` | 在嵌入式运行器之前对 replay turn 做最终验证或重塑 | 提供商传输在通用清理后需要更严格的 turn 验证 |
| 44  | `onModelSelected` | 运行提供商自有的选择后副作用 | 当模型变为活动状态时，提供商需要遥测或自有状态处理 |

`normalizeModelId`、`normalizeTransport` 和 `normalizeConfig` 会先检查已匹配的提供商插件，然后回退到其他具备相应钩子能力的提供商插件，直到某个插件真正修改了模型 id 或传输 / 配置。这让别名 / 兼容提供商 shim 可以继续工作，而不要求调用方必须知道哪个内置插件拥有该重写逻辑。如果没有提供商钩子重写受支持的 Google 家族配置项，内置 Google 配置规范化器仍会应用该兼容性清理。

如果提供商需要完全自定义的线协议或自定义请求执行器，那就是另一类扩展。这些钩子适用于仍运行在 OpenClaw 正常推理循环上的提供商行为。

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

- Anthropic 使用 `resolveDynamicModel`、`capabilities`、`buildAuthDoctorHint`、
  `resolveUsageAuth`、`fetchUsageSnapshot`、`isCacheTtlEligible`、
  `resolveDefaultThinkingLevel`、`applyConfigDefaults`、`isModernModelRef`，
  以及 `wrapStreamFn`，因为它拥有 Claude 4.6 前向兼容、
  提供商家族提示、auth 修复指导、使用量端点集成、
  提示词缓存资格、auth 感知配置默认值、Claude
  默认 / 自适应 thinking 策略，以及 Anthropic 特定的流式整形，用于 beta headers、`/fast` / `serviceTier` 和 `context1m`。
- Anthropic 的 Claude 特定流式辅助工具目前仍保留在内置插件自己的
  公共 `api.ts` / `contract-api.ts` 接缝中。该包表面会导出
  `wrapAnthropicProviderStream`、`resolveAnthropicBetas`、
  `resolveAnthropicFastMode`、`resolveAnthropicServiceTier` 以及更底层的
  Anthropic 包装器构建器，而不是围绕某个提供商的 beta-header 规则扩大通用 SDK。
- OpenAI 使用 `resolveDynamicModel`、`normalizeResolvedModel` 和
  `capabilities`，以及 `buildMissingAuthMessage`、`suppressBuiltInModel`、
  `augmentModelCatalog`、`supportsXHighThinking` 和 `isModernModelRef`，
  因为它拥有 GPT-5.4 前向兼容、直接的 OpenAI
  `openai-completions` -> `openai-responses` 规范化、面向 Codex 的 auth
  提示、Spark 抑制、synthetic OpenAI 列表行，以及 GPT-5 thinking /
  live-model 策略；`openai-responses-defaults` 流家族则拥有共享的原生 OpenAI Responses 包装器，用于 attribution headers、
  `/fast`/`serviceTier`、文本详细度、原生 Codex Web 搜索、
  推理兼容载荷整形以及 Responses 上下文管理。
- OpenRouter 使用 `catalog` 以及 `resolveDynamicModel` 和
  `prepareDynamicModel`，因为该提供商是透传式的，可能会在 OpenClaw 的静态目录更新之前暴露新的
  model id；它还使用 `capabilities`、`wrapStreamFn` 和 `isCacheTtlEligible`，以便将
  提供商特定请求头、路由元数据、推理补丁和提示词缓存策略保留在核心之外。它的 replay 策略来自
  `passthrough-gemini` 家族，而 `openrouter-thinking` 流家族
  拥有代理推理注入以及不受支持模型 / `auto` 跳过逻辑。
- GitHub Copilot 使用 `catalog`、`auth`、`resolveDynamicModel` 和
  `capabilities`，以及 `prepareRuntimeAuth` 和 `fetchUsageSnapshot`，
  因为它需要提供商自有的设备登录、模型回退行为、Claude 转录特性、GitHub token -> Copilot token 交换，以及提供商自有的使用量端点。
- OpenAI Codex 使用 `catalog`、`resolveDynamicModel`、
  `normalizeResolvedModel`、`refreshOAuth` 和 `augmentModelCatalog`，以及
  `prepareExtraParams`、`resolveUsageAuth` 和 `fetchUsageSnapshot`，因为它
  仍运行在核心 OpenAI 传输之上，但拥有自己的传输 / base URL
  规范化、OAuth 刷新回退策略、默认传输选择、
  synthetic Codex 目录行，以及 ChatGPT 使用量端点集成；它与直接 OpenAI 共享同一个 `openai-responses-defaults` 流家族。
- Google AI Studio 和 Gemini CLI OAuth 使用 `resolveDynamicModel`、
  `buildReplayPolicy`、`sanitizeReplayHistory`、
  `resolveReasoningOutputMode`、`wrapStreamFn` 和 `isModernModelRef`，因为
  `google-gemini` replay 家族拥有 Gemini 3.1 前向兼容回退、
  原生 Gemini replay 验证、启动 replay 清洗、带标签的
  推理输出模式，以及现代模型匹配，而
  `google-thinking` 流家族拥有 Gemini thinking 载荷规范化；
  Gemini CLI OAuth 还使用 `formatApiKey`、`resolveUsageAuth` 和
  `fetchUsageSnapshot` 来处理 token 格式化、token 解析和配额端点接线。
- Anthropic Vertex 通过
  `anthropic-by-model` replay 家族使用 `buildReplayPolicy`，这样 Claude 特定的 replay 清理就只作用于 Claude id，而不是每个 `anthropic-messages` 传输。
- Amazon Bedrock 使用 `buildReplayPolicy`、`matchesContextOverflowError`、
  `classifyFailoverReason` 和 `resolveDefaultThinkingLevel`，因为它拥有
  面向 Bedrock 特定的 throttle / not-ready / context-overflow 错误分类，
  用于 Anthropic-on-Bedrock 流量；其 replay 策略仍共享同一个只针对 Claude 的
  `anthropic-by-model` 防护。
- OpenRouter、Kilocode、Opencode 和 Opencode Go 通过 `passthrough-gemini` replay 家族使用 `buildReplayPolicy`，
  因为它们通过 OpenAI 兼容传输代理 Gemini
  模型，并需要 Gemini
  thought-signature 清洗，而不需要原生 Gemini replay 验证或
  启动重写。
- MiniMax 通过
  `hybrid-anthropic-openai` replay 家族使用 `buildReplayPolicy`，因为同一个提供商同时拥有
  Anthropic-message 和 OpenAI 兼容语义；它会在 Anthropic 侧保留只针对 Claude 的
  thinking-block 丢弃，同时将推理输出模式覆盖回原生，而
  `minimax-fast-mode` 流家族则拥有共享流路径上的快速模式模型重写。
- Moonshot 使用 `catalog` 加 `wrapStreamFn`，因为它仍使用共享
  OpenAI 传输，但需要提供商自有的 thinking 载荷规范化；
  `moonshot-thinking` 流家族会将配置加 `/think` 状态映射到其
  原生二元 thinking 载荷。
- Kilocode 使用 `catalog`、`capabilities`、`wrapStreamFn` 和
  `isCacheTtlEligible`，因为它需要提供商自有请求头、
  推理载荷规范化、Gemini 转录提示和 Anthropic
  缓存 TTL 门控；`kilocode-thinking` 流家族在共享代理流路径上保留 Kilo thinking
  注入，同时跳过 `kilo/auto` 和
  其他不支持显式推理载荷的代理模型 id。
- Z.AI 使用 `resolveDynamicModel`、`prepareExtraParams`、`wrapStreamFn`、
  `isCacheTtlEligible`、`isBinaryThinking`、`isModernModelRef`、
  `resolveUsageAuth` 和 `fetchUsageSnapshot`，因为它拥有 GLM-5 回退、
  `tool_stream` 默认值、二元 thinking UX、现代模型匹配，以及
  使用量 auth + 配额抓取；`tool-stream-default-on` 流家族则让默认开启的
  `tool_stream` 包装器脱离每个提供商手写胶水代码。
- xAI 使用 `normalizeResolvedModel`、`normalizeTransport`、
  `contributeResolvedModelCompat`、`prepareExtraParams`、`wrapStreamFn`、
  `resolveSyntheticAuth`、`resolveDynamicModel` 和 `isModernModelRef`，
  因为它拥有原生 xAI Responses 传输规范化、Grok 快速模式
  别名重写、默认 `tool_stream`、严格工具 / 推理载荷
  清理、面向插件自有工具的回退 auth 复用、前向兼容的 Grok
  模型解析，以及提供商自有兼容补丁，如 xAI 工具 schema
  配置文件、不受支持的 schema 关键字、原生 `web_search` 和 HTML 实体
  工具调用参数解码。
- Mistral、OpenCode Zen 和 OpenCode Go 只使用 `capabilities`，以便将转录 / 工具特性保留在核心之外。
- 仅目录型的内置提供商，如 `byteplus`、`cloudflare-ai-gateway`、
  `huggingface`、`kimi-coding`、`nvidia`、`qianfan`、
  `synthetic`、`together`、`venice`、`vercel-ai-gateway` 和 `volcengine` 仅使用
  `catalog`。
- Qwen 使用 `catalog` 作为其文本提供商，同时为其多模态表面注册共享媒体理解和视频生成能力。
- MiniMax 和 Xiaomi 使用 `catalog` 加使用量钩子，因为虽然推理仍通过共享传输运行，但它们的 `/usage` 行为由插件拥有。

## 运行时辅助工具

插件可以通过 `api.runtime` 访问部分核心辅助工具。以 TTS 为例：

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

- `textToSpeech` 返回普通核心 TTS 输出载荷，用于文件 / 语音便笺表面。
- 使用核心 `messages.tts` 配置和提供商选择。
- 返回 PCM 音频缓冲区 + 采样率。插件必须针对各提供商自行重采样 / 编码。
- `listVoices` 对每个提供商来说都是可选的。可将其用于供应商自有的语音选择器或设置流程。
- 语音列表可以包含更丰富的元数据，例如 locale、gender 和 personality 标签，以供提供商感知型选择器使用。
- 目前 OpenAI 和 ElevenLabs 支持电话场景。Microsoft 不支持。

插件还可以通过 `api.registerSpeechProvider(...)` 注册语音提供商。

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

- 将 TTS 策略、回退和回复交付保留在核心中。
- 使用语音提供商承载供应商自有的合成行为。
- 旧版 Microsoft `edge` 输入会被规范化为 `microsoft` provider id。
- 首选的所有权模型是面向公司的：随着 OpenClaw 增加这些能力契约，一个供应商插件可以拥有文本、语音、图像和未来媒体提供商。

对于图像 / 音频 / 视频理解，插件会注册一个类型化的媒体理解提供商，而不是通用 key/value 包：

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
- 将供应商行为保留在提供商插件中。
- 增量扩展应保持类型化：新的可选方法、新的可选结果字段、新的可选能力。
- 视频生成也已经采用同样的模式：
  - 核心拥有能力契约和运行时辅助工具
  - 供应商插件注册 `api.registerVideoGenerationProvider(...)`
  - 功能 / 渠道插件消费 `api.runtime.videoGeneration.*`

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

对于音频转录，插件可以使用媒体理解运行时，也可以使用较旧的 STT 别名：

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

说明：

- `api.runtime.mediaUnderstanding.*` 是图像 / 音频 / 视频理解的首选共享表面。
- 使用核心媒体理解音频配置（`tools.media.audio`）和提供商回退顺序。
- 当没有产生转录输出时，返回 `{ text: undefined }`（例如跳过 / 不受支持的输入）。
- `api.runtime.stt.transcribeAudioFile(...)` 仍作为兼容别名保留。

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

- `provider` 和 `model` 是每次运行可选覆盖项，不会持久化改变会话设置。
- OpenClaw 仅对受信任调用方启用这些覆盖字段。
- 对于插件自有回退运行，操作员必须通过 `plugins.entries.<id>.subagent.allowModelOverride: true` 明确启用。
- 使用 `plugins.entries.<id>.subagent.allowedModels` 将受信任插件限制到特定规范 `provider/model` 目标，或显式使用 `"*"` 允许任意目标。
- 不受信任插件的子智能体运行仍然可用，但覆盖请求会被拒绝，而不是静默回退。

对于 Web 搜索，插件可以消费共享运行时辅助工具，而不是深入智能体工具接线：

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
`api.registerWebSearchProvider(...)` 注册 Web 搜索提供商。

说明：

- 将提供商选择、凭证解析和共享请求语义保留在核心中。
- 使用 Web 搜索提供商承载供应商特定的搜索传输。
- `api.runtime.webSearch.*` 是功能 / 渠道插件在需要搜索行为但不依赖智能体工具包装器时的首选共享表面。

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

- `generate(...)`：使用已配置的图像生成提供商链生成图像。
- `listProviders(...)`：列出可用的图像生成提供商及其能力。

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
- `auth`：必填。使用 `"gateway"` 表示要求常规 Gateway 网关认证，或使用 `"plugin"` 表示由插件管理认证 / webhook 验证。
- `match`：可选。`"exact"`（默认）或 `"prefix"`。
- `replaceExisting`：可选。允许同一插件替换其自己现有的路由注册。
- `handler`：当路由处理了请求时返回 `true`。

说明：

- `api.registerHttpHandler(...)` 已被移除，并会导致插件加载错误。请改用 `api.registerHttpRoute(...)`。
- 插件路由必须显式声明 `auth`。
- 精确的 `path + match` 冲突会被拒绝，除非设置 `replaceExisting: true`，并且一个插件不能替换另一个插件的路由。
- `auth` 级别不同的重叠路由会被拒绝。请仅在相同 auth 级别内保留 `exact` / `prefix` 的贯穿链。
- `auth: "plugin"` 路由**不会**自动接收运维人员运行时作用域。它们用于插件管理的 webhook / 签名验证，而不是特权 Gateway 网关辅助工具调用。
- `auth: "gateway"` 路由会在 Gateway 网关请求运行时作用域中运行，但该作用域被有意保持保守：
  - 共享密钥 bearer 认证（`gateway.auth.mode = "token"` / `"password"`）会将插件路由运行时作用域固定为 `operator.write`，即使调用方发送了 `x-openclaw-scopes`
  - 受信任且携带身份的 HTTP 模式（例如 `trusted-proxy` 或私有入口上的 `gateway.auth.mode = "none"`）只有在显式存在 `x-openclaw-scopes` 头时，才会尊重它
  - 如果这些携带身份的插件路由请求中缺少 `x-openclaw-scopes`，运行时作用域会回退为 `operator.write`
- 实践规则：不要假设一个通过 gateway 认证的插件路由天然就是管理面。如果你的路由需要仅管理员行为，请要求使用带身份的认证模式，并记录显式 `x-openclaw-scopes` 头契约。

## 插件 SDK 导入路径

编写插件时，请使用 SDK 子路径，而不是单体式 `openclaw/plugin-sdk` 导入：

- `openclaw/plugin-sdk/plugin-entry`：用于插件注册原语。
- `openclaw/plugin-sdk/core`：用于通用共享的面向插件契约。
- `openclaw/plugin-sdk/config-schema`：用于根 `openclaw.json` Zod schema
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
  `openclaw/plugin-sdk/secret-input` 和
  `openclaw/plugin-sdk/webhook-ingress`，用于共享设置 / 认证 / 回复 / webhook
  接线。`channel-inbound` 是共享的归属位置，用于防抖、提及匹配、
  入站提及策略辅助工具、信封格式化以及入站信封上下文辅助工具。
  `channel-setup` 是范围较窄的可选安装设置接缝。
  `setup-runtime` 是 `setupEntry` /
  延迟启动使用的运行时安全设置表面，其中包括导入安全的设置补丁适配器。
  `setup-adapter-runtime` 是感知环境的账户设置适配器接缝。
  `setup-tools` 是小型 CLI / archive / docs 辅助工具接缝（`formatCliCommand`、
  `detectBinary`、`extractArchive`、`resolveBrewExecutable`、`formatDocsLink`、
  `CONFIG_DIR`）。
- 领域子路径，例如 `openclaw/plugin-sdk/channel-config-helpers`、
  `openclaw/plugin-sdk/allow-from`、
  `openclaw/plugin-sdk/channel-config-schema`、
  `openclaw/plugin-sdk/telegram-command-config`、
  `openclaw/plugin-sdk/channel-policy`、
  `openclaw/plugin-sdk/approval-gateway-runtime`、
  `openclaw/plugin-sdk/approval-handler-adapter-runtime`、
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
  `openclaw/plugin-sdk/runtime-store` 和
  `openclaw/plugin-sdk/directory-runtime`，用于共享运行时 / 配置辅助工具。
  `telegram-command-config` 是 Telegram 自定义
  命令规范化 / 验证的窄公共接缝，即使内置
  Telegram 契约表面暂时不可用，它也仍保持可用。
  `text-runtime` 是共享文本 / markdown / 日志接缝，其中包括
  面向 assistant 的可见文本剥离、markdown 渲染 / 分块辅助工具、脱敏
  辅助工具、directive-tag 辅助工具，以及 safe-text 工具。
- 审批专用渠道接缝应优先使用插件上的单一 `approvalCapability`
  契约。然后核心通过这一能力读取审批认证、交付、渲染、
  原生路由和延迟原生处理器行为，而不是将审批行为混入无关插件字段。
- `openclaw/plugin-sdk/channel-runtime` 已弃用，仅作为旧版插件的
  兼容 shim 保留。新代码应改为导入更窄的通用原语，仓库代码也不应新增对该 shim 的导入。
- 内置扩展内部实现仍属于私有。外部插件应只使用 `openclaw/plugin-sdk/*`
  子路径。OpenClaw 核心 / 测试代码可以使用插件包根目录下的仓库公共入口点，
  例如 `index.js`、`api.js`、
  `runtime-api.js`、`setup-entry.js`，以及范围更窄的文件，例如
  `login-qr-api.js`。切勿从核心或其他扩展中导入某个插件包的 `src/*`。
- 仓库入口点拆分：
  `<plugin-package-root>/api.js` 是辅助工具 / 类型 barrel，
  `<plugin-package-root>/runtime-api.js` 是仅运行时 barrel，
  `<plugin-package-root>/index.js` 是内置插件入口，
  `<plugin-package-root>/setup-entry.js` 是设置插件入口。
- 当前内置提供商示例：
  - Anthropic 使用 `api.js` / `contract-api.js` 提供 Claude 流辅助工具，
    例如 `wrapAnthropicProviderStream`、beta-header 辅助工具和 `service_tier`
    解析。
  - OpenAI 使用 `api.js` 提供提供商构建器、默认模型辅助工具和
    实时提供商构建器。
  - OpenRouter 使用 `api.js` 提供其提供商构建器以及 onboarding / 配置
    辅助工具，而 `register.runtime.js` 仍可为仓库本地用途重新导出通用
    `plugin-sdk/provider-stream` 辅助工具。
- 通过 facade 加载的公共入口点，在存在活动运行时配置快照时会优先使用它，
  否则在 OpenClaw 尚未提供运行时快照时，会回退到磁盘上的已解析配置文件。
- 通用共享原语仍然是首选的公共 SDK 契约。仍然存在一小组保留的、
  带内置渠道品牌的兼容辅助工具接缝。应将它们视为内置维护 / 兼容性接缝，而不是新的
  第三方导入目标；新的跨渠道契约仍应落在通用 `plugin-sdk/*` 子路径或
  插件本地 `api.js` / `runtime-api.js` barrel 上。

兼容性说明：

- 新代码请避免使用根 `openclaw/plugin-sdk` barrel。
- 优先使用范围更窄的稳定原语。较新的 setup / pairing / reply /
  feedback / contract / inbound / threading / command / secret-input / webhook / infra /
  allowlist / status / message-tool 子路径，是面向新
  内置和外部插件工作的预期契约。
  目标解析 / 匹配应放在 `openclaw/plugin-sdk/channel-targets`。
  消息动作门禁和 reaction message-id 辅助工具应放在
  `openclaw/plugin-sdk/channel-actions`。
- 内置扩展特定的辅助工具 barrel 默认不稳定。如果一个
  辅助工具只被某个内置扩展需要，请将它保留在该扩展本地的
  `api.js` 或 `runtime-api.js` 接缝之后，而不是将其提升到
  `openclaw/plugin-sdk/<extension>`。
- 新的共享辅助工具接缝应是通用的，而不是带渠道品牌的。共享目标
  解析应归属于 `openclaw/plugin-sdk/channel-targets`；渠道特定
  内部实现则保留在拥有它的插件本地 `api.js` 或 `runtime-api.js`
  接缝之后。
- 诸如 `image-generation`、
  `media-understanding` 和 `speech` 之类的能力特定子路径之所以存在，是因为内置 / 原生插件今天正在使用它们。它们的存在本身并不意味着所有导出的辅助工具都是长期冻结的外部契约。

## 消息工具 schema

插件应拥有渠道特定的 `describeMessageTool(...)` schema
贡献。请将提供商特定字段保留在插件中，而不是放在共享核心中。

对于共享的可移植 schema 片段，请复用通过
`openclaw/plugin-sdk/channel-actions` 导出的通用辅助工具：

- `createMessageToolButtonsSchema()`：用于按钮网格样式载荷
- `createMessageToolCardSchema()`：用于结构化卡片载荷

如果某个 schema 形状只适用于一个提供商，请在该插件自己的
源代码中定义它，而不是将其提升到共享 SDK 中。

## 渠道目标解析

渠道插件应拥有渠道特定的目标语义。请保持共享 outbound host 的通用性，并使用消息适配器表面承载提供商规则：

- `messaging.inferTargetChatType({ to })` 用于在目录查找前，决定某个规范化目标应被视为 `direct`、`group` 还是 `channel`。
- `messaging.targetResolver.looksLikeId(raw, normalized)` 用于告诉核心，某个输入是否应跳过目录搜索，直接进入类 id 解析。
- `messaging.targetResolver.resolveTarget(...)` 是插件回退路径，用于核心在规范化后或目录未命中后，需要做最终的提供商自有解析。
- `messaging.resolveOutboundSessionRoute(...)` 在目标解析完成后，拥有提供商特定的会话路由构建逻辑。

推荐拆分：

- 对于应在搜索 peers / groups 之前完成的类别决策，使用 `inferTargetChatType`。
- 对于“将此视为显式 / 原生目标 id”的检查，使用 `looksLikeId`。
- 对于提供商特定的规范化回退，使用 `resolveTarget`，而不要把它用于广泛的目录搜索。
- 将提供商原生 id，如 chat id、thread id、JID、handle 和 room id，保留在 `target` 值或提供商特定参数中，而不是放进通用 SDK 字段。

## 基于配置的目录

对于从配置派生目录条目的插件，应将这部分逻辑保留在插件中，并复用
`openclaw/plugin-sdk/directory-runtime` 中的共享辅助工具。

当某个渠道需要基于配置的 peers / groups 时，可使用此方式，例如：

- 基于 allowlist 的私信 peers
- 已配置的 channel / group 映射
- 按账户划分的静态目录回退

`directory-runtime` 中的共享辅助工具只处理通用操作：

- 查询过滤
- 限制数量应用
- 去重 / 规范化辅助工具
- 构建 `ChannelDirectoryEntry[]`

渠道特定的账户检查和 id 规范化应保留在插件实现中。

## 提供商目录

提供商插件可以通过
`registerProvider({ catalog: { run(...) { ... } } })` 定义用于推理的模型目录。

`catalog.run(...)` 返回与 OpenClaw 写入
`models.providers` 相同的形状：

- `{ provider }`：单个 provider 条目
- `{ providers }`：多个 provider 条目

当插件拥有提供商特定 model id、base URL 默认值或受 auth 门控的模型元数据时，请使用 `catalog`。

`catalog.order` 控制插件目录相对于 OpenClaw 内置隐式提供商的合并时机：

- `simple`：纯 API key 或环境变量驱动的提供商
- `profile`：存在 auth profile 时出现的提供商
- `paired`：合成多个相关提供商条目的提供商
- `late`：最后一轮，在其他隐式提供商之后

后合并的提供商在键冲突时获胜，因此插件可以有意用同一 provider id 覆盖某个内置提供商条目。

兼容性：

- `discovery` 仍然作为旧版别名可用
- 如果同时注册了 `catalog` 和 `discovery`，OpenClaw 会使用 `catalog`

## 只读渠道检查

如果你的插件注册了一个渠道，请优先在 `resolveAccount(...)` 旁边实现
`plugin.config.inspectAccount(cfg, accountId)`。

原因如下：

- `resolveAccount(...)` 是运行时路径。它可以假设凭证已经被完全具体化，并且在所需 secret 缺失时快速失败。
- 诸如 `openclaw status`、`openclaw status --all`、
  `openclaw channels status`、`openclaw channels resolve` 以及 doctor / 配置修复流程等只读命令路径，不应该为了描述配置，就必须具体化运行时凭证。

推荐的 `inspectAccount(...)` 行为：

- 只返回描述性的账户状态。
- 保留 `enabled` 和 `configured`。
- 在相关时包含凭证来源 / 状态字段，例如：
  - `tokenSource`、`tokenStatus`
  - `botTokenSource`、`botTokenStatus`
  - `appTokenSource`、`appTokenStatus`
  - `signingSecretSource`、`signingSecretStatus`
- 你不需要为了报告只读可用性而返回原始 token 值。返回 `tokenStatus: "available"`（以及匹配的 source 字段）就足以用于 status 类命令。
- 当凭证通过 SecretRef 配置，但在当前命令路径中不可用时，请使用 `configured_unavailable`。

这样只读命令就能报告“已配置，但在当前命令路径中不可用”，而不是崩溃或错误地报告该账户尚未配置。

## Package packs

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

每个条目都会成为一个插件。如果该 pack 列出了多个扩展，则插件 id
将变为 `name/<fileBase>`。

如果你的插件导入了 npm 依赖，请在该目录中安装这些依赖，以便
`node_modules` 可用（`npm install` / `pnpm install`）。

安全护栏：每个 `openclaw.extensions` 条目在解析符号链接后都必须保持在插件目录内。逃离包目录的条目会被拒绝。

安全说明：`openclaw plugins install` 会通过
`npm install --omit=dev --ignore-scripts` 安装插件依赖（运行时不执行生命周期脚本，也不安装 dev 依赖）。请保持插件依赖树为“纯 JS/TS”，并避免使用那些需要 `postinstall` 构建的包。

可选：`openclaw.setupEntry` 可以指向一个轻量级、仅用于设置的模块。
当 OpenClaw 需要为已禁用的渠道插件提供设置表面时，或者
当渠道插件已启用但仍未配置时，它会加载 `setupEntry`，而不是完整插件入口。这样在你的主插件入口还会接线工具、钩子或其他仅运行时代码时，可以让启动和设置更轻量。

可选：`openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
可以让某个渠道插件在 Gateway 网关监听前的启动阶段，即使渠道已经配置好，也仍进入同一个 `setupEntry` 路径。

仅当 `setupEntry` 完全覆盖启动前必须存在的启动表面时，才应使用它。实际上，这意味着设置入口必须注册启动所依赖的每个渠道自有能力，例如：

- 渠道注册本身
- 在 Gateway 网关开始监听前必须可用的所有 HTTP 路由
- 在同一时间窗口内必须存在的所有 gateway 方法、工具或服务

如果你的完整入口仍拥有任何必需的启动能力，请不要启用此标志。请保留默认行为，让 OpenClaw 在启动期间加载完整入口。

内置渠道还可以发布仅设置用的契约表面辅助工具，以便核心在完整渠道运行时加载前进行咨询。当前设置提升表面包括：

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

当核心需要在不加载完整插件入口的情况下，将旧版单账户渠道配置提升到
`channels.<id>.accounts.*` 时，就会使用该表面。Matrix 是当前的内置示例：当已存在命名账户时，它只会将 auth / 启动键移动到一个命名提升账户中，并且能够保留一个已配置的非规范默认账户键，而不是总是创建
`accounts.default`。

这些设置补丁适配器让内置契约表面发现保持延迟。导入时保持轻量；提升表面只会在首次使用时加载，而不是在模块导入时重新进入内置渠道启动过程。

当这些启动表面包含 Gateway 网关 RPC 方法时，请将它们保留在插件特定前缀下。核心管理命名空间（`config.*`、
`exec.approvals.*`、`wizard.*`、`update.*`）仍然保留，并且始终解析为
`operator.admin`，即使某个插件请求更窄的作用域也是如此。

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

渠道插件可以通过 `openclaw.channel` 广告设置 / 发现元数据，并通过 `openclaw.install` 广告安装提示。这样可以保持核心目录无数据化。

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

除了最小示例之外，有用的 `openclaw.channel` 字段还包括：

- `detailLabel`：更丰富目录 / 状态表面的次级标签
- `docsLabel`：覆盖文档链接文本
- `preferOver`：该目录条目应优先于之显示的低优先级插件 / 渠道 id
- `selectionDocsPrefix`、`selectionDocsOmitLabel`、`selectionExtras`：选择表面文案控制
- `markdownCapable`：将渠道标记为支持 markdown，以用于出站格式决策
- `exposure.configured`：设为 `false` 时，在已配置渠道列表表面中隐藏该渠道
- `exposure.setup`：设为 `false` 时，在交互式设置 / 配置选择器中隐藏该渠道
- `exposure.docs`：将渠道标记为内部 / 私有，用于文档导航表面
- `showConfigured` / `showInSetup`：旧版别名，出于兼容性仍可接受；推荐使用 `exposure`
- `quickstartAllowFrom`：让该渠道接入标准快速开始 `allowFrom` 流程
- `forceAccountBinding`：即使只存在一个账户，也要求显式账户绑定
- `preferSessionLookupForAnnounceTarget`：在解析 announce 目标时优先使用会话查找

OpenClaw 还可以合并**外部渠道目录**（例如一个 MPM
注册表导出）。将 JSON 文件放在以下任一路径：

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

或者将 `OPENCLAW_PLUGIN_CATALOG_PATHS`（或 `OPENCLAW_MPM_CATALOG_PATHS`）指向一个或多个 JSON 文件（以逗号 / 分号 / `PATH` 分隔）。每个文件应包含 `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`。解析器也接受 `"packages"` 或 `"plugins"` 作为 `"entries"` 键的旧版别名。

## 上下文引擎插件

上下文引擎插件拥有会话上下文编排，用于摄取、组装和压缩。可在你的插件中通过
`api.registerContextEngine(id, factory)` 注册它们，然后用
`plugins.slots.contextEngine` 选择活动引擎。

当你的插件需要替换或扩展默认上下文流水线，而不仅仅是增加 memory search 或钩子时，请使用此方式。

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

如果你的引擎**不**拥有压缩算法，请保持 `compact()`
已实现，并显式委托它：

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

当某个插件需要当前 API 不适配的行为时，不要通过私有深层调用绕过插件系统。请添加缺失的能力。

推荐顺序：

1. 定义核心契约
   决定核心应拥有哪些共享行为：策略、回退、配置合并、
   生命周期、面向渠道的语义以及运行时辅助工具形状。
2. 添加类型化插件注册 / 运行时表面
   以最小且有用的类型化能力表面扩展 `OpenClawPluginApi` 和 / 或 `api.runtime`。
3. 连接核心 + 渠道 / 功能消费者
   渠道和功能插件应通过核心消费该新能力，
   而不是直接导入某个供应商实现。
4. 注册供应商实现
   然后由供应商插件针对该能力注册它们的后端实现。
5. 添加契约覆盖
   添加测试，以便随着时间推移，所有权和注册形状仍保持显式。

这正是 OpenClaw 能保持鲜明主张、同时又不被某个提供商世界观写死的方式。具体文件清单和完整示例，请参阅 [能力扩展手册](/zh-CN/plugins/architecture)。

### 能力清单

当你添加一个新能力时，通常应同时修改以下表面：

- `src/<capability>/types.ts` 中的核心契约类型
- `src/<capability>/runtime.ts` 中的核心运行器 / 运行时辅助工具
- `src/plugins/types.ts` 中的插件 API 注册表面
- `src/plugins/registry.ts` 中的插件注册表接线
- 当功能 / 渠道插件需要消费它时，位于 `src/plugins/runtime/*` 中的插件运行时暴露
- `src/test-utils/plugin-registration.ts` 中的捕获 / 测试辅助工具
- `src/plugins/contracts/registry.ts` 中的所有权 / 契约断言
- `docs/` 中的运维 / 插件文档

如果其中某个表面缺失，通常意味着该能力尚未完全集成。

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

- 核心拥有能力契约 + 编排
- 供应商插件拥有供应商实现
- 功能 / 渠道插件消费运行时辅助工具
- 契约测试保持所有权显式
