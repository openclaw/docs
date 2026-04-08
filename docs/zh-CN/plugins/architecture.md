---
read_when:
    - 构建或调试原生 OpenClaw 插件时
    - 理解插件能力模型或归属边界时
    - 处理插件加载流水线或注册表时
    - 实现提供商运行时钩子或渠道插件时
sidebarTitle: Internals
summary: 插件内部：能力模型、归属、契约、加载流水线和运行时辅助工具
title: 插件内部机制
x-i18n:
    generated_at: "2026-04-08T18:11:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2575791f835990589219bb06d8ca92e16a8c38b317f0bfe50b421682f253ef18
    source_path: plugins/architecture.md
    workflow: 15
---

# 插件内部机制

<Info>
  这是**深度架构参考**。如需实用指南，请参见：
  - [安装和使用插件](/zh-CN/tools/plugin) — 用户指南
  - [入门指南](/zh-CN/plugins/building-plugins) — 第一个插件教程
  - [渠道插件](/zh-CN/plugins/sdk-channel-plugins) — 构建消息渠道
  - [提供商插件](/zh-CN/plugins/sdk-provider-plugins) — 构建模型提供商
  - [SDK 概览](/zh-CN/plugins/sdk-overview) — 导入映射和注册 API
</Info>

本页介绍 OpenClaw 插件系统的内部架构。

## 公共能力模型

能力是 OpenClaw 内部公开的**原生插件**模型。每个原生 OpenClaw 插件都会注册到一种或多种能力类型：

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
| 网页抓取 | `api.registerWebFetchProvider(...)` | `firecrawl` |
| 网络搜索 | `api.registerWebSearchProvider(...)` | `google` |
| 渠道 / 消息 | `api.registerChannel(...)` | `msteams`, `matrix` |

一个插件如果注册了零个能力，但提供了钩子、工具或服务，则属于**仅遗留钩子**插件。该模式仍然得到完整支持。

### 外部兼容性立场

能力模型现已落地到 core，并且当前已被内置 / 原生插件使用，但外部插件兼容性仍需要比“它已导出，因此已冻结”更严格的标准。

当前指导如下：

- **现有外部插件：**保持基于钩子的集成正常工作；将其视为兼容性基线
- **新的内置 / 原生插件：**优先使用显式能力注册，而不是面向厂商的直接耦合或新的仅钩子设计
- **采用能力注册的外部插件：**允许，但除非文档明确将某项契约标记为稳定，否则应将能力专用辅助接口视为仍在演进中

实践规则：

- 能力注册 API 是预期方向
- 在过渡期间，遗留钩子仍是外部插件最安全、最不容易破坏的路径
- 并非所有导出的辅助子路径都同等稳定；优先使用文档化的窄契约，而不是偶然暴露的辅助导出

### 插件形态

OpenClaw 会根据每个已加载插件的实际注册行为（而不只是静态元数据）将其归类为一种形态：

- **plain-capability** —— 恰好注册一种能力类型（例如只提供 provider 的插件，如 `mistral`）
- **hybrid-capability** —— 注册多种能力类型（例如 `openai` 同时拥有文本推理、语音、媒体理解和图像生成）
- **hook-only** —— 仅注册钩子（类型化或自定义），不注册能力、工具、命令或服务
- **non-capability** —— 注册工具、命令、服务或路由，但不注册能力

使用 `openclaw plugins inspect <id>` 可查看插件的形态和能力拆解。详见 [CLI 参考](/cli/plugins#inspect)。

### 遗留钩子

`before_agent_start` 钩子仍然作为仅钩子插件的兼容路径被支持。现实中的遗留插件仍依赖它。

方向如下：

- 保持其可用
- 将其文档标记为遗留
- 对模型 / 提供商覆盖类工作，优先使用 `before_model_resolve`
- 对提示词变更类工作，优先使用 `before_prompt_build`
- 仅在真实使用量下降且夹具覆盖证明迁移安全后才移除

### 兼容性信号

当你运行 `openclaw doctor` 或 `openclaw plugins inspect <id>` 时，可能会看到以下标签之一：

| 信号 | 含义 |
| -------------------------- | ------------------------------------------------------------ |
| **config valid** | 配置可正常解析，且插件可解析 |
| **compatibility advisory** | 插件使用受支持但较旧的模式（例如 `hook-only`） |
| **legacy warning** | 插件使用了 `before_agent_start`，该功能已弃用 |
| **hard error** | 配置无效或插件加载失败 |

`hook-only` 和 `before_agent_start` 目前都不会破坏你的插件——`hook-only` 只是提示信息，而 `before_agent_start` 只会触发警告。这些信号也会显示在 `openclaw status --all` 和 `openclaw plugins doctor` 中。

## 架构概览

OpenClaw 的插件系统有四层：

1. **清单 + 发现**
   OpenClaw 会从配置路径、工作区根目录、全局扩展根目录以及内置扩展中查找候选插件。发现阶段会优先读取原生 `openclaw.plugin.json` 清单以及受支持的 bundle 清单。
2. **启用 + 校验**
   Core 决定每个已发现插件是启用、禁用、阻止，还是被选中用于诸如 memory 之类的独占槽位。
3. **运行时加载**
   原生 OpenClaw 插件通过 jiti 在进程内加载，并将能力注册到中央注册表中。兼容 bundle 会被规范化为注册表记录，而无需导入运行时代码。
4. **表面消费**
   OpenClaw 的其余部分会读取注册表，以暴露工具、渠道、provider 设置、钩子、HTTP 路由、CLI 命令和服务。

对于插件 CLI，根命令发现专门分为两个阶段：

- 解析时元数据来自 `registerCli(..., { descriptors: [...] })`
- 真正的插件 CLI 模块可以保持惰性，并在首次调用时注册

这样既能将插件自有的 CLI 代码保留在插件内部，又能让 OpenClaw 在解析前预留根命令名称。

重要设计边界：

- 发现 + 配置校验应能仅依赖**清单 / schema 元数据**工作，而无需执行插件代码
- 原生运行时行为来自插件模块的 `register(api)` 路径

这种拆分让 OpenClaw 能在完整运行时激活前，就完成配置校验、解释缺失 / 禁用插件的原因，并构建 UI / schema 提示。

### 渠道插件和共享消息工具

对于常规聊天动作，渠道插件无需单独注册发送 / 编辑 / 反应工具。OpenClaw 在 core 中保留了一个共享的 `message` 工具，而渠道插件负责其背后的渠道专属发现和执行。

当前边界如下：

- core 拥有共享 `message` 工具宿主、提示词接线、会话 / 线程簿记和执行分发
- 渠道插件拥有带作用域的动作发现、能力发现，以及任何渠道专属 schema 片段
- 渠道插件拥有 provider 专属的会话对话语法，例如对话 id 如何编码线程 id，或如何从父对话继承
- 渠道插件通过它们的 action adapter 执行最终动作

对于渠道插件，SDK 接口为
`ChannelMessageActionAdapter.describeMessageTool(...)`。这个统一的发现调用让插件可以一起返回可见动作、能力和 schema 扩展，从而避免这些部分彼此漂移。

Core 会将运行时作用域传入该发现步骤。重要字段包括：

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 可信的入站 `requesterSenderId`

这对于上下文敏感型插件很重要。渠道可以根据活动账户、当前房间 / 线程 / 消息，或可信请求者身份，决定隐藏或暴露哪些消息动作，而无需在 core 的 `message` 工具中硬编码渠道专属分支。

这也是为什么嵌入式 runner 路由变更仍然属于插件工作：runner 负责将当前聊天 / 会话身份转发到插件发现边界，以便共享 `message` 工具在当前轮次暴露正确的、由渠道拥有的能力表面。

对于渠道自有的执行辅助工具，内置插件应将执行运行时保留在它们自己的扩展模块中。Core 不再拥有位于 `src/agents/tools` 下的 Discord、Slack、Telegram 或 WhatsApp 消息动作运行时。我们不会发布单独的 `plugin-sdk/*-action-runtime` 子路径，内置插件应直接从自己的扩展模块导入本地运行时代码。

相同边界也适用于一般的 provider 命名 SDK 接缝：core 不应导入面向 Slack、Discord、Signal、WhatsApp 或类似扩展的渠道专用便捷 barrel。如果 core 需要某种行为，应当消费内置插件自己的 `api.ts` / `runtime-api.ts` barrel，或将该需求提升为共享 SDK 中的窄型通用能力。

对于投票，当前有两条执行路径：

- `outbound.sendPoll` 是适用于常见投票模型的共享基线
- `actions.handleAction("poll")` 是适用于渠道专属投票语义或额外投票参数的首选路径

Core 现在会在插件投票分发拒绝该动作后，才延迟执行共享投票解析，因此插件自有的投票处理器可以接受渠道专属投票字段，而不会先被通用投票解析器拦住。

完整启动顺序请参见 [加载流水线](#load-pipeline)。

## 能力归属模型

OpenClaw 将原生插件视为**公司**或**功能**的归属边界，而不是一堆无关集成的杂物袋。

这意味着：

- 公司插件通常应拥有该公司的所有 OpenClaw 对外能力表面
- 功能插件通常应拥有其引入的完整功能表面
- 渠道应消费共享 core 能力，而不是临时重复实现 provider 行为

例如：

- 内置的 `openai` 插件拥有 OpenAI 模型 provider 行为，以及 OpenAI 的语音 + 实时语音 + 媒体理解 + 图像生成行为
- 内置的 `elevenlabs` 插件拥有 ElevenLabs 语音行为
- 内置的 `microsoft` 插件拥有 Microsoft 语音行为
- 内置的 `google` 插件拥有 Google 模型 provider 行为，以及 Google 的媒体理解 + 图像生成 + 网络搜索行为
- 内置的 `firecrawl` 插件拥有 Firecrawl 网页抓取行为
- 内置的 `minimax`、`mistral`、`moonshot` 和 `zai` 插件拥有它们各自的媒体理解后端
- 内置的 `qwen` 插件拥有 Qwen 文本 provider 行为，以及媒体理解和视频生成行为
- `voice-call` 插件是功能插件：它拥有通话传输、工具、CLI、路由和 Twilio 媒体流桥接，但它消费共享的语音以及实时转录和实时语音能力，而不是直接导入厂商插件

预期的最终状态是：

- OpenAI 即使横跨文本模型、语音、图像以及未来的视频，也应归属于一个插件
- 其他厂商也可对自己的能力范围做同样的事
- 渠道不需要关心究竟是哪个厂商插件拥有该 provider；它们只消费由 core 暴露的共享能力契约

这是关键区别：

- **plugin** = 归属边界
- **capability** = 可由多个插件实现或消费的 core 契约

因此，如果 OpenClaw 增加一个新领域，例如视频，首先的问题不应是“哪个 provider 应该硬编码视频处理？”而应是“core 的视频能力契约是什么？”一旦该契约存在，厂商插件就可以注册到它之上，而渠道 / 功能插件也可以消费它。

如果该能力尚不存在，通常正确的做法是：

1. 在 core 中定义缺失的能力
2. 通过插件 API / 运行时以类型化方式暴露它
3. 让渠道 / 功能围绕该能力接线
4. 让厂商插件注册其实现

这样可以保持归属明确，同时避免 core 行为依赖单一厂商或一次性的插件专属代码路径。

### 能力分层

当你决定代码应放在哪里时，可使用以下心智模型：

- **core 能力层**：共享编排、策略、回退、配置合并规则、交付语义和类型化契约
- **厂商插件层**：厂商专属 API、认证、模型目录、语音合成、图像生成、未来视频后端、用量接口
- **渠道 / 功能插件层**：Slack / Discord / voice-call 等集成，它们消费 core 能力并将其呈现在一个表面上

例如，TTS 的形态如下：

- core 拥有回复时 TTS 策略、回退顺序、偏好和渠道交付
- `openai`、`elevenlabs` 和 `microsoft` 拥有合成实现
- `voice-call` 消费电话 TTS 运行时辅助工具

未来能力也应优先遵循同样的模式。

### 多能力公司插件示例

从外部看，一个公司插件应当显得内聚。如果 OpenClaw 为模型、语音、实时转录、实时语音、媒体理解、图像生成、视频生成、网页抓取和网络搜索都提供了共享契约，那么一个厂商可以在同一个地方拥有自己所有的能力表面：

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

关键不在于具体的辅助函数名称，而在于整体形态：

- 一个插件拥有该厂商的能力表面
- core 仍然拥有能力契约
- 渠道和功能插件消费 `api.runtime.*` 辅助工具，而不是厂商代码
- 契约测试可以断言插件注册了它声称拥有的能力

### 能力示例：视频理解

OpenClaw 已经将图像 / 音频 / 视频理解视为一项共享能力。在这里，同样适用上述归属模型：

1. core 定义媒体理解契约
2. 厂商插件按需注册 `describeImage`、`transcribeAudio` 和 `describeVideo`
3. 渠道和功能插件消费共享 core 行为，而不是直接接线到厂商代码

这样可以避免将某个 provider 的视频假设固化进 core。插件拥有厂商能力表面；core 拥有能力契约和回退行为。

视频生成也遵循同样的顺序：core 拥有类型化能力契约和运行时辅助工具，而厂商插件针对 `api.registerVideoGenerationProvider(...)` 注册实现。

需要一个具体的发布检查清单吗？请参见
[能力扩展手册](/zh-CN/plugins/architecture)。

## 契约与约束

插件 API 表面有意在 `OpenClawPluginApi` 中集中并类型化。该契约定义了受支持的注册点，以及插件可依赖的运行时辅助工具。

其重要性在于：

- 插件作者可获得统一、稳定的内部标准
- core 可以拒绝重复归属，例如两个插件注册同一个 provider id
- 启动时可以为格式错误的注册暴露可操作的诊断信息
- 契约测试可以约束内置插件的归属，防止无声漂移

有两层约束：

1. **运行时注册约束**
   插件在加载时，插件注册表会校验注册内容。例如：重复的 provider id、重复的 speech provider id，以及格式错误的注册，都会产出插件诊断，而不是导致未定义行为。
2. **契约测试**
   在测试运行期间，内置插件会被捕获到契约注册表中，以便 OpenClaw 能显式断言归属。当前这被用于模型 provider、speech provider、web search provider 以及内置注册归属。

实际效果是，OpenClaw 能在前期就知道哪个插件拥有哪个表面。这样 core 与渠道就能顺畅组合，因为归属是声明式、类型化且可测试的，而不是隐式的。

### 哪些内容应进入契约

良好的插件契约应当是：

- 类型化
- 小而精
- 能力专属
- 由 core 拥有
- 可被多个插件复用
- 可被渠道 / 功能在不理解厂商细节的情况下消费

糟糕的插件契约则是：

- 隐藏在 core 中的厂商专属策略
- 绕过注册表的一次性插件逃生口
- 渠道代码直接伸手到厂商实现里
- 不是 `OpenClawPluginApi` 或 `api.runtime` 一部分的临时运行时对象

如果拿不准，就提升抽象层级：先定义能力，再让插件接入其中。

## 执行模型

原生 OpenClaw 插件与 Gateway 网关**在同一进程中**运行。它们不在沙箱中。一个已加载的原生插件与 core 代码处于相同的进程级信任边界。

影响如下：

- 原生插件可以注册工具、网络处理器、钩子和服务
- 原生插件的 bug 可能导致 Gateway 网关崩溃或失稳
- 恶意原生插件等同于在 OpenClaw 进程内执行任意代码

兼容 bundle 默认更安全，因为 OpenClaw 当前将它们视为元数据 / 内容包。在当前版本中，这主要指内置的技能。

对于非内置插件，请使用 allowlist 和显式安装 / 加载路径。将 workspace 插件视为开发时代码，而不是生产默认值。

对于内置 workspace 包名称，请确保插件 id 锚定在 npm 名称中：默认使用 `@openclaw/<id>`，或者在该包有意暴露更窄的插件角色时，使用获准的类型化后缀，例如 `-provider`、`-plugin`、`-speech`、`-sandbox` 或 `-media-understanding`。

重要信任说明：

- `plugins.allow` 信任的是**plugin id**，而不是源码来源。
- 如果某个 workspace 插件与一个内置插件拥有相同 id，那么当该 workspace 插件被启用 / 加入 allowlist 时，它会有意覆盖内置副本。
- 这很正常，而且对本地开发、补丁测试和热修复很有用。

## 导出边界

OpenClaw 导出的是能力，而不是实现层面的便捷辅助工具。

保持能力注册为公共接口。收紧非契约辅助导出：

- 内置插件专属辅助子路径
- 不打算作为公共 API 的运行时管线子路径
- 厂商专属便捷辅助工具
- 属于实现细节的 setup / onboarding 辅助工具

某些内置插件辅助子路径仍保留在生成的 SDK 导出映射中，以用于兼容性和内置插件维护。当前示例包括 `plugin-sdk/feishu`、`plugin-sdk/feishu-setup`、`plugin-sdk/zalo`、`plugin-sdk/zalo-setup` 以及若干 `plugin-sdk/matrix*` 接缝。应将这些视为保留的实现细节导出，而不是新第三方插件推荐使用的 SDK 模式。

## 加载流水线

启动时，OpenClaw 大致会这样做：

1. 发现候选插件根目录
2. 读取原生或兼容 bundle 的清单和包元数据
3. 拒绝不安全候选项
4. 规范化插件配置（`plugins.enabled`、`allow`、`deny`、`entries`、`slots`、`load.paths`）
5. 为每个候选项决定启用状态
6. 通过 jiti 加载已启用的原生模块
7. 调用原生 `register(api)`（或 `activate(api)`——一个遗留别名）钩子，并将注册内容收集到插件注册表中
8. 将注册表暴露给命令 / 运行时表面

<Note>
`activate` 是 `register` 的遗留别名——加载器会解析当前存在的那个（`def.register ?? def.activate`），并在同一时机调用。所有内置插件都使用 `register`；新插件也应优先使用 `register`。
</Note>

安全闸门发生在**运行时执行之前**。如果候选项入口逃逸出插件根目录、路径可被所有人写入，或者对于非内置插件而言路径归属看起来可疑，那么该候选项会被阻止。

### 清单优先行为

清单是控制平面的事实来源。OpenClaw 用它来：

- 识别插件
- 发现声明的 channels / skills / config schema 或 bundle 能力
- 校验 `plugins.entries.<id>.config`
- 增强 Control UI 标签 / 占位符
- 显示安装 / 目录元数据

对于原生插件，运行时模块是数据平面部分。它会注册实际行为，例如钩子、工具、命令或 provider 流程。

### 加载器会缓存什么

OpenClaw 会保留一些短生命周期的进程内缓存，用于：

- 发现结果
- 清单注册表数据
- 已加载的插件注册表

这些缓存会减少突发启动开销和重复命令开销。可以将它们视为短期性能缓存，而不是持久化机制。

性能说明：

- 设置 `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` 或
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` 可禁用这些缓存。
- 使用 `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` 和
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` 调整缓存窗口。

## 注册表模型

已加载的插件不会直接修改随机的 core 全局状态。它们会注册到一个中央插件注册表中。

该注册表会跟踪：

- 插件记录（身份、来源、出处、状态、诊断）
- 工具
- 遗留钩子和类型化钩子
- 渠道
- provider
- Gateway 网关 RPC 处理器
- HTTP 路由
- CLI 注册器
- 后台服务
- 插件自有命令

然后，core 功能会从该注册表中读取，而不是直接与插件模块交互。这使加载保持单向：

- 插件模块 -> 注册表注册
- core 运行时 -> 注册表消费

这种分离对于可维护性非常重要。它意味着大多数 core 表面只需要一个集成点：“读取注册表”，而不是“为每个插件模块写特殊分支”。

## 对话绑定回调

绑定对话的插件可以在批准结果确定后作出响应。

使用 `api.onConversationBindingResolved(...)` 可以在绑定请求被批准或拒绝后接收回调：

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

回调负载字段：

- `status`：`"approved"` 或 `"denied"`
- `decision`：`"allow-once"`、`"allow-always"` 或 `"deny"`
- `binding`：已批准请求的最终绑定
- `request`：原始请求摘要、分离提示、发送者 id 以及对话元数据

该回调仅用于通知。它不会改变谁可以绑定对话，并且会在 core 批准处理完成后才运行。

## 提供商运行时钩子

提供商插件现在有两层：

- 清单元数据：`providerAuthEnvVars` 用于在运行时加载前低成本查找 provider 的环境变量认证，`providerAuthAliases` 用于共享认证的 provider 变体，`channelEnvVars` 用于在运行时加载前低成本查找渠道环境变量 / 设置，另外还有 `providerAuthChoices`，用于在运行时加载前低成本提供新手引导 / 认证选择标签和 CLI flag 元数据
- 配置时钩子：`catalog` / 遗留 `discovery` 以及 `applyConfigDefaults`
- 运行时钩子：`normalizeModelId`, `normalizeTransport`,
  `normalizeConfig`,
  `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`,
  `resolveSyntheticAuth`, `resolveExternalAuthProfiles`,
  `shouldDeferSyntheticProfileAuth`,
  `resolveDynamicModel`, `prepareDynamicModel`, `normalizeResolvedModel`,
  `contributeResolvedModelCompat`, `capabilities`,
  `normalizeToolSchemas`, `inspectToolSchemas`,
  `resolveReasoningOutputMode`, `prepareExtraParams`, `createStreamFn`,
  `wrapStreamFn`, `resolveTransportTurnState`,
  `resolveWebSocketSessionPolicy`, `formatApiKey`, `refreshOAuth`,
  `buildAuthDoctorHint`, `matchesContextOverflowError`,
  `classifyFailoverReason`, `isCacheTtlEligible`,
  `buildMissingAuthMessage`, `suppressBuiltInModel`, `augmentModelCatalog`,
  `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw 仍然拥有通用智能体循环、故障切换、转录处理和工具策略。这些钩子是提供商专属行为的扩展表面，而无需整套自定义推理传输。

当提供商拥有基于环境变量的凭据，并且通用认证 / 状态 / 模型选择器路径需要在不加载插件运行时的情况下看到这些凭据时，请使用清单中的 `providerAuthEnvVars`。当一个 provider id 需要复用另一个 provider id 的环境变量、认证配置文件、配置型认证和 API key 新手引导选项时，请使用清单中的 `providerAuthAliases`。当新手引导 / 认证选择 CLI 表面需要在不加载 provider 运行时的情况下，知道该 provider 的 choice id、分组标签以及简单的单 flag 认证接线时，请使用清单中的 `providerAuthChoices`。将 provider 运行时中的 `envVars` 保留给面向运维者的提示，例如新手引导标签或 OAuth client-id / client-secret 设置变量。

当某个渠道拥有基于环境变量驱动的认证或设置，且通用 shell 环境变量回退、配置 / 状态检查或设置提示需要在不加载渠道运行时的情况下看到这些信息时，请使用清单中的 `channelEnvVars`。

### 钩子顺序与用法

对于模型 / provider 插件，OpenClaw 大致按以下顺序调用钩子。
“何时使用”列是快速决策指南。

| #   | 钩子 | 作用 | 何时使用 |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog` | 在生成 `models.json` 期间将 provider 配置发布到 `models.providers` 中 | 提供商拥有目录或 base URL 默认值时 |
| 2   | `applyConfigDefaults` | 在配置实例化期间应用提供商自有的全局配置默认值 | 默认值依赖于认证模式、环境变量或 provider 模型家族语义时 |
| --  | _(内置模型查找)_ | OpenClaw 会先尝试普通的注册表 / 目录路径 | _(不是插件钩子)_ |
| 3   | `normalizeModelId` | 在查找前规范化遗留或预览版模型 id 别名 | 提供商在规范模型解析前拥有别名清理逻辑时 |
| 4   | `normalizeTransport` | 在通用模型组装前规范化提供商家族的 `api` / `baseUrl` | 提供商拥有同一传输家族中自定义 provider id 的传输清理逻辑时 |
| 5   | `normalizeConfig` | 在运行时 / provider 解析前规范化 `models.providers.<id>` | 提供商需要由插件持有的配置清理逻辑；内置 Google 家族辅助工具也会为受支持的 Google 配置项兜底 |
| 6   | `applyNativeStreamingUsageCompat` | 对配置 provider 应用原生流式用量兼容性重写 | 提供商需要基于 endpoint 的原生流式用量元数据修正时 |
| 7   | `resolveConfigApiKey` | 在运行时认证加载前，为配置 provider 解析环境变量标记认证 | 提供商拥有自有的环境变量标记 API key 解析；`amazon-bedrock` 也在这里内置了 AWS 环境变量标记解析器 |
| 8   | `resolveSyntheticAuth` | 在不持久化明文的情况下暴露本地 / 自托管或配置型认证 | 提供商可以使用合成 / 本地凭据标记运行时 |
| 9   | `resolveExternalAuthProfiles` | 叠加提供商自有的外部认证配置文件；默认 `persistence` 为 `runtime-only`，适用于 CLI / 应用自有凭据 | 提供商需要复用外部认证凭据，而不持久化复制过来的 refresh token |
| 10  | `shouldDeferSyntheticProfileAuth` | 将已存储的合成配置文件占位符排在环境变量 / 配置型认证之后 | 提供商存储了不应优先的合成占位配置文件 |
| 11  | `resolveDynamicModel` | 为本地注册表中尚不存在的提供商模型 id 提供同步回退 | 提供商接受任意上游模型 id 时 |
| 12  | `prepareDynamicModel` | 异步预热后，再次运行 `resolveDynamicModel` | 提供商在解析未知 id 前需要网络元数据时 |
| 13  | `normalizeResolvedModel` | 在嵌入式 runner 使用已解析模型前做最终重写 | 提供商需要传输重写，但仍使用 core 传输时 |
| 14  | `contributeResolvedModelCompat` | 为另一种兼容传输后的厂商模型提供兼容标志 | 提供商能在代理传输上识别自己的模型，而无需接管整个 provider |
| 15  | `capabilities` | 由共享 core 逻辑使用的提供商自有 transcript / tooling 元数据 | 提供商需要 transcript / provider 家族特殊处理时 |
| 16  | `normalizeToolSchemas` | 在嵌入式 runner 看到工具 schema 前做规范化 | 提供商需要针对传输家族做 schema 清理时 |
| 17  | `inspectToolSchemas` | 在规范化后暴露提供商自有的 schema 诊断 | 提供商想要关键字警告，而不必教会 core 规则细节 |
| 18  | `resolveReasoningOutputMode` | 选择原生或带标签的 reasoning 输出契约 | 提供商需要带标签的 reasoning / final 输出，而不是原生字段时 |
| 19  | `prepareExtraParams` | 在通用流选项包装器前做请求参数规范化 | 提供商需要默认请求参数或逐 provider 参数清理时 |
| 20  | `createStreamFn` | 用自定义传输完全替换正常流路径 | 提供商需要自定义线协议，而不只是包装器时 |
| 21  | `wrapStreamFn` | 在应用通用包装器后进一步包装流 | 提供商需要请求头 / 请求体 / 模型兼容包装，而不是自定义传输时 |
| 22  | `resolveTransportTurnState` | 附加原生的逐轮传输头或元数据 | 提供商希望通用传输发送 provider 原生轮次身份时 |
| 23  | `resolveWebSocketSessionPolicy` | 附加原生 WebSocket 请求头或会话冷却策略 | 提供商希望通用 WS 传输调节会话头或回退策略时 |
| 24  | `formatApiKey` | 认证配置文件格式化器：将已存储配置文件转换为运行时 `apiKey` 字符串 | 提供商存储了额外认证元数据，并需要自定义运行时令牌形态时 |
| 25  | `refreshOAuth` | 为自定义刷新 endpoint 或刷新失败策略覆盖 OAuth 刷新逻辑 | 提供商不适配共享 `pi-ai` 刷新器时 |
| 26  | `buildAuthDoctorHint` | 在 OAuth 刷新失败时附加修复提示 | 提供商需要自有的认证修复指导时 |
| 27  | `matchesContextOverflowError` | 提供商自有的上下文窗口溢出匹配器 | 提供商有通用启发式无法识别的原始溢出错误时 |
| 28  | `classifyFailoverReason` | 提供商自有的故障切换原因分类 | 提供商可以将原始 API / 传输错误映射到限流 / 过载等分类时 |
| 29  | `isCacheTtlEligible` | 代理 / 回程 provider 的提示词缓存策略 | 提供商需要代理专属缓存 TTL 控制时 |
| 30  | `buildMissingAuthMessage` | 替换通用的缺失认证恢复消息 | 提供商需要 provider 专属的缺失认证恢复提示时 |
| 31  | `suppressBuiltInModel` | 过时上游模型抑制，可附带面向用户的错误提示 | 提供商需要隐藏过时上游行，或用厂商提示替换它们时 |
| 32  | `augmentModelCatalog` | 在发现后附加合成 / 最终目录行 | 提供商需要在 `models list` 和选择器中加入合成的前向兼容行时 |
| 33  | `isBinaryThinking` | 为二元 thinking provider 提供开 / 关推理切换 | 提供商只暴露二元开 / 关 thinking 时 |
| 34  | `supportsXHighThinking` | 为选定模型提供 `xhigh` 推理支持 | 提供商只希望某些模型支持 `xhigh` 时 |
| 35  | `resolveDefaultThinkingLevel` | 为特定模型家族提供默认 `/think` 级别 | 提供商拥有某个模型家族的默认 `/think` 策略时 |
| 36  | `isModernModelRef` | 用于 live profile 过滤和 smoke 选择的现代模型匹配器 | 提供商拥有 live / smoke 首选模型匹配逻辑时 |
| 37  | `prepareRuntimeAuth` | 在推理前将已配置凭据交换为实际运行时令牌 / key | 提供商需要令牌交换或短期请求凭据时 |
| 38  | `resolveUsageAuth` | 为 `/usage` 及相关状态表面解析用量 / 账单凭据 | 提供商需要自定义用量 / 配额令牌解析，或不同的用量凭据时 |
| 39  | `fetchUsageSnapshot` | 在认证解析后获取并规范化 provider 专属的用量 / 配额快照 | 提供商需要 provider 专属的用量 endpoint 或负载解析器时 |
| 40  | `createEmbeddingProvider` | 为 memory / search 构建 provider 自有的 embedding 适配器 | Memory embedding 行为应归属于 provider 插件 |
| 41  | `buildReplayPolicy` | 返回控制提供商 transcript 处理的 replay 策略 | 提供商需要自定义 transcript 策略（例如移除 thinking block）时 |
| 42  | `sanitizeReplayHistory` | 在通用 transcript 清理后重写 replay 历史 | 提供商需要超出共享压缩辅助工具之外的 provider 专属 replay 重写时 |
| 43  | `validateReplayTurns` | 在嵌入式 runner 前对 replay 轮次做最终校验或整形 | 提供商传输在通用清理后仍需更严格的轮次校验时 |
| 44  | `onModelSelected` | 运行 provider 自有的选择后副作用 | 提供商在模型激活时需要遥测或 provider 自有状态处理时 |

`normalizeModelId`、`normalizeTransport` 和 `normalizeConfig` 会先检查匹配到的 provider 插件，然后回退到其他具备钩子能力的 provider 插件，直到有一个实际改变模型 id 或传输 / 配置。这样可以让别名 / 兼容 provider shim 正常工作，而无需让调用方知道是哪一个内置插件拥有该重写逻辑。如果没有任何 provider 钩子重写受支持的 Google 家族配置项，内置的 Google 配置规范化器仍会执行该兼容性清理。

如果 provider 需要完全自定义的线协议或自定义请求执行器，那属于另一类扩展。这些钩子适用于仍运行在 OpenClaw 常规推理循环上的 provider 行为。

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
  `resolveDefaultThinkingLevel`、`applyConfigDefaults`、`isModernModelRef`
  和 `wrapStreamFn`，因为它拥有 Claude 4.6 前向兼容、
  provider 家族提示、认证修复指导、用量 endpoint 集成、
  提示词缓存适用性、基于认证的配置默认值、Claude
  默认 / 自适应 thinking 策略，以及 Anthropic 专属的流整形，用于
  beta 头、`/fast` / `serviceTier` 和 `context1m`。
- Anthropic 的 Claude 专属流辅助工具目前仍保留在该内置插件自己的
  公共 `api.ts` / `contract-api.ts` 接缝中。该包表面
  导出 `wrapAnthropicProviderStream`、`resolveAnthropicBetas`、
  `resolveAnthropicFastMode`、`resolveAnthropicServiceTier` 以及更底层的
  Anthropic 包装器构建器，而不是围绕单个 provider 的 beta 头规则去扩展通用 SDK。
- OpenAI 使用 `resolveDynamicModel`、`normalizeResolvedModel` 和
  `capabilities`，以及 `buildMissingAuthMessage`、`suppressBuiltInModel`、
  `augmentModelCatalog`、`supportsXHighThinking` 和 `isModernModelRef`，
  因为它拥有 GPT-5.4 前向兼容、直接 OpenAI
  `openai-completions` -> `openai-responses` 规范化、Codex 感知型认证
  提示、Spark 抑制、合成 OpenAI 列表行，以及 GPT-5 thinking /
  live-model 策略；`openai-responses-defaults` 流家族则拥有
  共享的原生 OpenAI Responses 包装器，用于归因头、
  `/fast`/`serviceTier`、文本冗长度、原生 Codex web search、
  reasoning 兼容负载整形以及 Responses 上下文管理。
- OpenRouter 使用 `catalog` 以及 `resolveDynamicModel` 和
  `prepareDynamicModel`，因为该 provider 是透传型的，可能会在
  OpenClaw 静态目录更新之前暴露新的模型 id；它还使用
  `capabilities`、`wrapStreamFn` 和 `isCacheTtlEligible`，以保持
  provider 专属请求头、路由元数据、reasoning 补丁和
  提示词缓存策略不进入 core。它的 replay 策略来自
  `passthrough-gemini` 家族，而 `openrouter-thinking` 流家族
  拥有代理推理注入以及不受支持模型 / `auto` 跳过逻辑。
- GitHub Copilot 使用 `catalog`、`auth`、`resolveDynamicModel` 和
  `capabilities`，以及 `prepareRuntimeAuth` 和 `fetchUsageSnapshot`，
  因为它需要 provider 自有的设备登录、模型回退行为、Claude transcript 特殊处理、
  GitHub token -> Copilot token 交换，以及 provider 自有的用量 endpoint。
- OpenAI Codex 使用 `catalog`、`resolveDynamicModel`、
  `normalizeResolvedModel`、`refreshOAuth` 和 `augmentModelCatalog`，以及
  `prepareExtraParams`、`resolveUsageAuth` 和 `fetchUsageSnapshot`，因为它
  虽然仍运行在 core OpenAI 传输之上，但拥有自己的传输 / base URL
  规范化、OAuth 刷新回退策略、默认传输选择、
  合成 Codex 目录行以及 ChatGPT 用量 endpoint 集成；它与直接 OpenAI 共享同一个
  `openai-responses-defaults` 流家族。
- Google AI Studio 和 Gemini CLI OAuth 使用 `resolveDynamicModel`、
  `buildReplayPolicy`、`sanitizeReplayHistory`、
  `resolveReasoningOutputMode`、`wrapStreamFn` 和 `isModernModelRef`，因为
  `google-gemini` replay 家族拥有 Gemini 3.1 前向兼容回退、
  原生 Gemini replay 校验、bootstrap replay 清理、带标签的
  reasoning 输出模式，以及现代模型匹配；而
  `google-thinking` 流家族拥有 Gemini thinking 负载规范化；
  Gemini CLI OAuth 还使用 `formatApiKey`、`resolveUsageAuth` 和
  `fetchUsageSnapshot` 进行 token 格式化、token 解析和配额 endpoint 接线。
- Anthropic Vertex 通过
  `anthropic-by-model` replay 家族使用 `buildReplayPolicy`，这样 Claude 专属 replay 清理
  就能只限定在 Claude id 上，而不是覆盖所有 `anthropic-messages` 传输。
- Amazon Bedrock 使用 `buildReplayPolicy`、`matchesContextOverflowError`、
  `classifyFailoverReason` 和 `resolveDefaultThinkingLevel`，因为它拥有
  Bedrock 专属的限流 / 未就绪 / 上下文溢出错误分类，
  适用于 Anthropic-on-Bedrock 流量；其 replay 策略仍共享同一个
  仅 Claude 的 `anthropic-by-model` 防护。
- OpenRouter、Kilocode、Opencode 和 Opencode Go 通过
  `passthrough-gemini` replay 家族使用 `buildReplayPolicy`，因为它们通过 OpenAI 兼容传输代理 Gemini
  模型，并且需要 Gemini thought-signature 清理，而不需要原生 Gemini replay 校验或
  bootstrap 重写。
- MiniMax 通过
  `hybrid-anthropic-openai` replay 家族使用 `buildReplayPolicy`，因为一个 provider 同时拥有
  Anthropic-message 和 OpenAI 兼容语义；它会在 Anthropic 侧保留
  仅 Claude 的 thinking block 丢弃，同时将 reasoning 输出模式覆盖回原生，而
  `minimax-fast-mode` 流家族拥有共享流路径上的
  fast-mode 模型重写。
- Moonshot 使用 `catalog` 加 `wrapStreamFn`，因为它仍使用共享
  OpenAI 传输，但需要 provider 自有的 thinking 负载规范化；
  `moonshot-thinking` 流家族会将配置加 `/think` 状态映射到其
  原生二元 thinking 负载。
- Kilocode 使用 `catalog`、`capabilities`、`wrapStreamFn` 和
  `isCacheTtlEligible`，因为它需要 provider 自有的请求头、
  reasoning 负载规范化、Gemini transcript 提示，以及 Anthropic
  缓存 TTL 控制；`kilocode-thinking` 流家族会在共享代理流路径上保留
  Kilo thinking 注入，同时跳过 `kilo/auto` 和
  其他不支持显式 reasoning 负载的代理模型 id。
- Z.AI 使用 `resolveDynamicModel`、`prepareExtraParams`、`wrapStreamFn`、
  `isCacheTtlEligible`、`isBinaryThinking`、`isModernModelRef`、
  `resolveUsageAuth` 和 `fetchUsageSnapshot`，因为它拥有 GLM-5 回退、
  `tool_stream` 默认值、二元 thinking 体验、现代模型匹配，
  以及用量认证 + 配额获取；`tool-stream-default-on` 流家族则将
  默认开启的 `tool_stream` 包装器从逐 provider 手写胶水代码中剥离出来。
- xAI 使用 `normalizeResolvedModel`、`normalizeTransport`、
  `contributeResolvedModelCompat`、`prepareExtraParams`、`wrapStreamFn`、
  `resolveSyntheticAuth`、`resolveDynamicModel` 和 `isModernModelRef`，
  因为它拥有原生 xAI Responses 传输规范化、Grok fast-mode
  别名重写、默认 `tool_stream`、严格工具 / reasoning 负载
  清理、用于插件自有工具的回退认证复用、前向兼容的 Grok
  模型解析，以及 provider 自有兼容补丁，例如 xAI 工具 schema
  配置、受支持范围外的 schema 关键字、原生 `web_search` 以及 HTML 实体
  工具调用参数解码。
- Mistral、OpenCode Zen 和 OpenCode Go 仅使用 `capabilities`，以将
  transcript / tooling 特殊处理保留在 core 之外。
- 仅目录型的内置 provider，例如 `byteplus`、`cloudflare-ai-gateway`、
  `huggingface`、`kimi-coding`、`nvidia`、`qianfan`、
  `synthetic`、`together`、`venice`、`vercel-ai-gateway` 和 `volcengine`，仅使用
  `catalog`。
- Qwen 对其文本 provider 使用 `catalog`，同时为其多模态能力使用共享的媒体理解和
  视频生成注册。
- MiniMax 和 Xiaomi 使用 `catalog` 加用量钩子，因为它们的 `/usage`
  行为归属于插件，即使推理本身仍通过共享传输运行。

## 运行时辅助工具

插件可以通过 `api.runtime` 访问部分选定的 core 辅助工具。对于 TTS：

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

- `textToSpeech` 返回普通的 core TTS 输出负载，适用于文件 / 语音便签表面。
- 使用 core `messages.tts` 配置和 provider 选择逻辑。
- 返回 PCM 音频缓冲区 + 采样率。插件必须为对应 provider 执行重采样 / 编码。
- `listVoices` 对每个 provider 都是可选的。可将其用于厂商自有的语音选择器或设置流程。
- 语音列表可以包含更丰富的元数据，例如语言区域、性别和人格标签，以支持具备 provider 感知能力的选择器。
- 当前 OpenAI 和 ElevenLabs 支持电话场景。Microsoft 不支持。

插件也可以通过 `api.registerSpeechProvider(...)` 注册 speech provider。

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

- 将 TTS 策略、回退和回复交付保留在 core 中。
- 对厂商自有的合成行为使用 speech provider。
- 遗留的 Microsoft `edge` 输入会被规范化为 `microsoft` provider id。
- 首选的归属模型是面向公司的：随着 OpenClaw 增加这些能力契约，一个厂商插件可以拥有
  文本、语音、图像以及未来的媒体 provider。

对于图像 / 音频 / 视频理解，插件应注册一个类型化的
媒体理解 provider，而不是使用通用 key/value bag：

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
- 将厂商行为保留在 provider 插件中。
- 增量扩展应保持类型化：新的可选方法、新的可选结果字段、新的可选能力。
- 视频生成已遵循同样模式：
  - core 拥有能力契约和运行时辅助工具
  - 厂商插件注册 `api.registerVideoGenerationProvider(...)`
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

对于音频转录，插件既可以使用媒体理解运行时，也可以使用较旧的 STT 别名：

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
- 使用 core 媒体理解音频配置（`tools.media.audio`）和 provider 回退顺序。
- 当没有产生转录输出时（例如输入被跳过 / 不受支持），返回 `{ text: undefined }`。
- `api.runtime.stt.transcribeAudioFile(...)` 仍保留为兼容性别名。

插件还可以通过 `api.runtime.subagent` 启动后台 subagent 运行：

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

- `provider` 和 `model` 是单次运行的可选覆盖项，不是持久性的会话变更。
- OpenClaw 仅对可信调用者尊重这些覆盖字段。
- 对于插件自有回退运行，运维者必须通过 `plugins.entries.<id>.subagent.allowModelOverride: true` 明确启用。
- 使用 `plugins.entries.<id>.subagent.allowedModels` 将可信插件限制为特定的规范 `provider/model` 目标，或使用 `"*"` 显式允许任意目标。
- 不可信插件的 subagent 运行仍可工作，但覆盖请求会被拒绝，而不是悄悄回退。

对于 web search，插件可以消费共享运行时辅助工具，而不是直接接入智能体工具接线：

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

插件也可以通过
`api.registerWebSearchProvider(...)` 注册 web search provider。

说明：

- 将 provider 选择、凭据解析和共享请求语义保留在 core 中。
- 对厂商专属搜索传输使用 web-search provider。
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

- `generate(...)`：使用已配置的图像生成 provider 链生成图像。
- `listProviders(...)`：列出可用的图像生成 provider 及其能力。

## Gateway 网关 HTTP 路由

插件可以通过 `api.registerHttpRoute(...)` 暴露 HTTP endpoint。

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
- `auth`：必填。使用 `"gateway"` 以要求正常 Gateway 网关认证，或使用 `"plugin"` 进行插件自管认证 / webhook 校验。
- `match`：可选。`"exact"`（默认）或 `"prefix"`。
- `replaceExisting`：可选。允许同一插件替换自己已有的路由注册。
- `handler`：当路由已处理请求时返回 `true`。

说明：

- `api.registerHttpHandler(...)` 已移除，并会导致插件加载错误。请改用 `api.registerHttpRoute(...)`。
- 插件路由必须显式声明 `auth`。
- 完全相同的 `path + match` 冲突会被拒绝，除非设置了 `replaceExisting: true`，并且一个插件不能替换另一个插件的路由。
- 不同 `auth` 级别的重叠路由会被拒绝。仅在相同 auth 级别内保留 `exact` / `prefix` 的回退链。
- `auth: "plugin"` 路由**不会**自动获得运维者运行时作用域。它们用于插件自管 webhook / 签名校验，而不是特权 Gateway 网关辅助调用。
- `auth: "gateway"` 路由运行在 Gateway 网关请求运行时作用域内，但该作用域刻意保持保守：
  - 共享密钥 bearer 认证（`gateway.auth.mode = "token"` / `"password"`）会将插件路由运行时作用域固定为 `operator.write`，即使调用方发送了 `x-openclaw-scopes`
  - 可信的、具备身份承载能力的 HTTP 模式（例如 `trusted-proxy` 或私有入口上的 `gateway.auth.mode = "none"`）仅会在显式存在该头时尊重 `x-openclaw-scopes`
  - 如果这些具备身份承载能力的插件路由请求中缺少 `x-openclaw-scopes`，运行时作用域会回退为 `operator.write`
- 实践规则：不要假设一个经过 gateway 认证的插件路由天然就是管理员表面。如果你的路由需要仅管理员可用的行为，请要求使用具备身份承载能力的认证模式，并文档化显式 `x-openclaw-scopes` 头契约。

## 插件 SDK 导入路径

编写插件时，应使用 SDK 子路径，而不是使用单体式的 `openclaw/plugin-sdk` 导入：

- `openclaw/plugin-sdk/plugin-entry` 用于插件注册原语。
- `openclaw/plugin-sdk/core` 用于通用的共享插件侧契约。
- `openclaw/plugin-sdk/config-schema` 用于导出根 `openclaw.json` Zod schema
  （`OpenClawSchema`）。
- 稳定的渠道原语，如 `openclaw/plugin-sdk/channel-setup`、
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
  `openclaw/plugin-sdk/webhook-ingress`，用于共享 setup / auth / reply / webhook
  接线。`channel-inbound` 是防抖、提及匹配、
  入站提及策略辅助工具、信封格式化以及入站信封
  上下文辅助工具的共享归属位置。
  `channel-setup` 是窄型的可选安装 setup 接缝。
  `setup-runtime` 是 `setupEntry` /
  延迟启动所使用的运行时安全 setup 表面，包括可安全导入的 setup patch 适配器。
  `setup-adapter-runtime` 是具备环境变量感知能力的账户 setup adapter 接缝。
  `setup-tools` 是小型 CLI / 归档 / 文档辅助接缝（`formatCliCommand`、
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
  命令规范化 / 校验的窄型公共接缝，即便内置
  Telegram 契约表面暂时不可用，它也会保持可用。
  `text-runtime` 是共享的文本 / markdown / 日志接缝，包括
  对智能体可见文本剥离、markdown 渲染 / 分块辅助工具、脱敏
  辅助工具、指令标签辅助工具以及安全文本工具。
- 审批专用渠道接缝应优先使用插件上的单一 `approvalCapability`
  契约。然后 core 会通过这一个能力读取审批认证、交付、渲染、
  原生路由和惰性原生处理器行为，而不是将审批行为混入无关插件字段。
- `openclaw/plugin-sdk/channel-runtime` 已弃用，仅保留为旧插件的兼容性 shim。
  新代码应改为导入更窄的通用原语，仓库代码也不应再新增对该 shim 的导入。
- 内置扩展内部实现仍是私有的。外部插件应只使用 `openclaw/plugin-sdk/*` 子路径。OpenClaw core / 测试代码
  可以使用插件包根目录下的仓库公共入口点，例如 `index.js`、`api.js`、
  `runtime-api.js`、`setup-entry.js` 和更窄范围的文件，例如
  `login-qr-api.js`。绝不要从 core 或另一个扩展中导入插件包的 `src/*`。
- 仓库入口点拆分：
  `<plugin-package-root>/api.js` 是辅助工具 / 类型 barrel，
  `<plugin-package-root>/runtime-api.js` 是仅运行时 barrel，
  `<plugin-package-root>/index.js` 是内置插件入口，
  `<plugin-package-root>/setup-entry.js` 是 setup 插件入口。
- 当前内置 provider 示例：
  - Anthropic 使用 `api.js` / `contract-api.js` 提供 Claude 流辅助工具，例如
    `wrapAnthropicProviderStream`、beta-header 辅助工具以及 `service_tier`
    解析。
  - OpenAI 使用 `api.js` 提供 provider 构建器、默认模型辅助工具以及
    realtime provider 构建器。
  - OpenRouter 使用 `api.js` 提供 provider 构建器以及 onboarding / config
    辅助工具，而 `register.runtime.js` 仍可为仓库本地用途重新导出通用
    `plugin-sdk/provider-stream` 辅助工具。
- 通过 facade 加载的公共入口点在存在活动运行时配置快照时，会优先使用该快照；
  如果 OpenClaw 尚未提供运行时快照，则回退到磁盘上解析后的配置文件。
- 通用共享原语仍是首选的公共 SDK 契约。一小部分为兼容性保留的、
  带有内置渠道品牌的辅助接缝仍然存在。应将其视为内置维护 / 兼容性接缝，
  而不是新的第三方导入目标；新的跨渠道契约仍应落在
  通用 `plugin-sdk/*` 子路径或插件本地 `api.js` /
  `runtime-api.js` barrel 上。

兼容性说明：

- 新代码应避免使用根 `openclaw/plugin-sdk` barrel。
- 优先使用窄型稳定原语。较新的 setup / pairing / reply /
  feedback / contract / inbound / threading / command / secret-input / webhook / infra /
  allowlist / status / message-tool 子路径是新内置和外部插件工作的预期契约。
  目标解析 / 匹配属于 `openclaw/plugin-sdk/channel-targets`。
  消息动作闸门和 reaction message-id 辅助工具属于
  `openclaw/plugin-sdk/channel-actions`。
- 内置扩展专属辅助 barrel 默认不稳定。如果某个
  辅助工具仅被某个内置扩展需要，请将其保留在该扩展
  本地的 `api.js` 或 `runtime-api.js` 接缝之后，而不是提升到
  `openclaw/plugin-sdk/<extension>` 中。
- 新的共享辅助接缝应当是通用的，而不是带渠道品牌的。共享目标
  解析应归属于 `openclaw/plugin-sdk/channel-targets`；渠道专属
  内部实现则保留在所属插件本地的 `api.js` 或 `runtime-api.js`
  接缝之后。
- 像 `image-generation`、
  `media-understanding` 和 `speech` 这样的能力专属子路径之所以存在，是因为
  内置 / 原生插件今天就在使用它们。它们的存在本身并不意味着每个导出的辅助工具都属于长期冻结的外部契约。

## 消息工具 schema

插件应拥有渠道专属的 `describeMessageTool(...)` schema 扩展。将 provider 专属字段保留在插件中，而不是放入共享 core。

对于共享、可移植的 schema 片段，请复用通过
`openclaw/plugin-sdk/channel-actions` 导出的通用辅助工具：

- `createMessageToolButtonsSchema()` 用于按钮网格风格的负载
- `createMessageToolCardSchema()` 用于结构化卡片负载

如果某个 schema 形状只适用于一个 provider，请将其定义在该插件自己的源码中，而不要将其提升进共享 SDK。

## 渠道目标解析

渠道插件应拥有渠道专属的目标语义。保持共享 outbound host 为通用层，并通过消息 adapter 表面承载 provider 规则：

- `messaging.inferTargetChatType({ to })` 决定规范化目标在目录查找前应被视为 `direct`、`group` 还是 `channel`。
- `messaging.targetResolver.looksLikeId(raw, normalized)` 告诉 core 某个输入是否应直接跳过目录搜索，改走类 id 解析。
- `messaging.targetResolver.resolveTarget(...)` 是在规范化之后或目录未命中之后，core 需要最终 provider 自有解析时的插件回退路径。
- `messaging.resolveOutboundSessionRoute(...)` 在目标解析完成后拥有 provider 专属的会话路由构造逻辑。

推荐拆分：

- 使用 `inferTargetChatType` 处理应在搜索 peer / group 之前发生的分类决策。
- 使用 `looksLikeId` 做“将此视为显式 / 原生目标 id”的判断。
- 使用 `resolveTarget` 作为 provider 专属规范化回退，而不是广义目录搜索。
- 将 provider 原生 id，例如 chat id、thread id、JID、handle 和 room id，保留在 `target` 值或 provider 专属参数中，而不是放进通用 SDK 字段。

## 配置驱动的目录

对于根据配置派生目录项的插件，应将该逻辑保留在插件中，并复用
`openclaw/plugin-sdk/directory-runtime` 中的共享辅助工具。

适用于以下情况：当一个渠道需要基于配置的 peer / group，例如：

- 基于 allowlist 的私信 peer
- 已配置的 channel / group 映射
- 按账户划分的静态目录回退

`directory-runtime` 中的共享辅助工具只处理通用操作：

- 查询过滤
- 限制条数应用
- 去重 / 规范化辅助工具
- 构建 `ChannelDirectoryEntry[]`

渠道专属的账户检查和 id 规范化应保留在插件实现中。

## 提供商目录

Provider 插件可以通过
`registerProvider({ catalog: { run(...) { ... } } })` 定义用于推理的模型目录。

`catalog.run(...)` 返回与 OpenClaw 写入
`models.providers` 中相同的结构：

- `{ provider }` 表示一个 provider 条目
- `{ providers }` 表示多个 provider 条目

当插件拥有 provider 专属模型 id、base URL 默认值或受认证约束的模型元数据时，请使用 `catalog`。

`catalog.order` 控制插件目录相对于 OpenClaw
内置隐式 provider 的合并时机：

- `simple`：普通 API key 或环境变量驱动的 provider
- `profile`：当认证配置文件存在时出现的 provider
- `paired`：会合成多个相关 provider 条目的 provider
- `late`：最后一轮，在其他隐式 provider 之后

后面的 provider 会在键冲突时胜出，因此插件可以有意覆盖同一 provider id 的内置 provider 条目。

兼容性：

- `discovery` 仍可作为遗留别名使用
- 如果同时注册了 `catalog` 和 `discovery`，OpenClaw 会使用 `catalog`

## 只读渠道检查

如果你的插件注册了一个渠道，建议在实现
`resolveAccount(...)` 的同时，也实现 `plugin.config.inspectAccount(cfg, accountId)`。

原因：

- `resolveAccount(...)` 是运行时路径。它可以假定凭据已完全实例化，并在缺少必需密钥时快速失败。
- `openclaw status`、`openclaw status --all`、
  `openclaw channels status`、`openclaw channels resolve` 以及 Doctor / 配置
  修复流程等只读命令路径，不应为了描述配置而必须实例化运行时凭据。

推荐的 `inspectAccount(...)` 行为：

- 只返回描述性的账户状态。
- 保留 `enabled` 和 `configured`。
- 在相关情况下包含凭据来源 / 状态字段，例如：
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- 为了报告只读可用性，无需返回原始 token 值。返回 `tokenStatus: "available"`（以及对应的来源字段）就足够支持状态类命令。
- 当凭据通过 SecretRef 配置但在当前命令路径中不可用时，请使用 `configured_unavailable`。

这样只读命令就可以报告“已配置，但在当前命令路径中不可用”，而不是崩溃或错误地将账户报告为未配置。

## 包打包集

插件目录可以包含一个带 `openclaw.extensions` 的 `package.json`：

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

每个条目都会成为一个插件。如果一个 pack 列出多个扩展，则插件 id
会变为 `name/<fileBase>`。

如果你的插件导入 npm 依赖，请在该目录中安装它们，以确保
`node_modules` 可用（`npm install` / `pnpm install`）。

安全护栏：每个 `openclaw.extensions` 条目在解析符号链接后都必须位于插件
目录内部。任何逃逸出包目录的条目都会被拒绝。

安全说明：`openclaw plugins install` 会使用
`npm install --omit=dev --ignore-scripts` 安装插件依赖（运行时不执行生命周期脚本，也不安装开发依赖）。请保持插件依赖树为“纯 JS / TS”，并避免使用需要 `postinstall` 构建的包。

可选：`openclaw.setupEntry` 可以指向一个轻量级的仅 setup 模块。
当 OpenClaw 需要为一个已禁用的渠道插件提供 setup 表面，或者
当一个渠道插件已启用但尚未配置时，它会加载 `setupEntry` 而不是完整插件入口。这能让你的主插件入口在还接入了工具、钩子或其他仅运行时代码时，依然保持启动和设置流程更轻量。

可选：`openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
可以让一个渠道插件在 Gateway 网关的
pre-listen 启动阶段，即使渠道已配置，也走同样的 `setupEntry` 路径。

仅当 `setupEntry` 完整覆盖网关开始监听前必须存在的启动表面时，才应使用此选项。实践上，这意味着 setup entry
必须注册所有启动依赖的渠道自有能力，例如：

- 渠道注册本身
- 必须在网关开始监听前可用的任何 HTTP 路由
- 在同一时间窗口内必须存在的任何 gateway 方法、工具或服务

如果完整入口仍拥有任何必需的启动能力，请不要启用
此标志。保持插件使用默认行为，让 OpenClaw 在启动期间加载完整入口。

内置渠道还可以发布 setup-only 契约表面辅助工具，供 core 在完整渠道运行时加载之前咨询。当前 setup 提升表面为：

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

当 core 需要在不加载完整插件入口的情况下，将遗留的单账户渠道配置提升为
`channels.<id>.accounts.*` 时，就会使用该表面。
Matrix 是当前的内置示例：当已存在命名账户时，它只会将认证 / bootstrap 键迁移到一个命名提升账户中，并且可以保留一个已配置的、非规范默认账户键，而不是总是创建
`accounts.default`。

这些 setup patch adapter 会让内置契约表面发现保持惰性。导入时保持轻量；只有首次使用时才会加载提升表面，而不会在模块导入期间重新进入内置渠道启动流程。

当这些启动表面包含 gateway RPC 方法时，请将它们保留在
插件专属前缀下。Core 管理员命名空间（`config.*`、
`exec.approvals.*`、`wizard.*`、`update.*`）仍然保留，并且始终解析为
`operator.admin`，即使插件请求了更窄的作用域。

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

渠道插件可以通过 `openclaw.channel` 公布 setup / 发现元数据，并通过 `openclaw.install` 公布安装提示。这能让 core 目录保持无数据化。

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

- `detailLabel`：用于更丰富目录 / 状态表面的次级标签
- `docsLabel`：覆盖文档链接文本
- `preferOver`：该目录条目应优先于的低优先级插件 / 渠道 id
- `selectionDocsPrefix`、`selectionDocsOmitLabel`、`selectionExtras`：选择表面文案控制
- `markdownCapable`：将该渠道标记为支持 markdown，以用于 outbound 格式决策
- `exposure.configured`：设置为 `false` 时，从已配置渠道列表表面中隐藏该渠道
- `exposure.setup`：设置为 `false` 时，从交互式 setup / configure 选择器中隐藏该渠道
- `exposure.docs`：将该渠道标记为文档导航表面中的内部 / 私有项
- `showConfigured` / `showInSetup`：遗留别名，出于兼容性仍接受；优先使用 `exposure`
- `quickstartAllowFrom`：让该渠道接入标准快速开始 `allowFrom` 流程
- `forceAccountBinding`：即使只存在一个账户，也要求显式账户绑定
- `preferSessionLookupForAnnounceTarget`：解析 announce 目标时优先使用会话查找

OpenClaw 还可以合并**外部渠道目录**（例如 MPM
注册表导出）。将 JSON 文件放到以下任一位置：

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

或者将 `OPENCLAW_PLUGIN_CATALOG_PATHS`（或 `OPENCLAW_MPM_CATALOG_PATHS`）指向一个或多个 JSON 文件（用逗号 / 分号 / `PATH` 分隔）。每个文件都应包含 `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`。解析器也接受将 `"packages"` 或 `"plugins"` 作为 `"entries"` 键的遗留别名。

## 上下文引擎插件

上下文引擎插件拥有会话上下文编排能力，负责摄取、组装和压缩。请在你的插件中通过
`api.registerContextEngine(id, factory)` 注册它们，然后使用
`plugins.slots.contextEngine` 选择活动引擎。

当你的插件需要替换或扩展默认上下文流水线，而不是仅增加 memory search 或钩子时，请使用此机制。

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
已实现，并显式委托给它：

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

当插件需要当前 API 无法覆盖的行为时，不要通过私有直连绕过
插件系统。请添加缺失的能力。

推荐顺序：

1. 定义 core 契约
   明确 core 应拥有哪些共享行为：策略、回退、配置合并、
   生命周期、面向渠道的语义以及运行时辅助工具形态。
2. 添加类型化插件注册 / 运行时表面
   以最小可用的类型化能力表面扩展 `OpenClawPluginApi` 和 / 或 `api.runtime`。
3. 接线 core + 渠道 / 功能消费者
   渠道和功能插件应通过 core 消费新能力，
   而不是直接导入某个厂商实现。
4. 注册厂商实现
   然后让厂商插件针对该能力注册它们的后端。
5. 添加契约覆盖
   增加测试，以便归属和注册形态能长期保持明确。

这就是 OpenClaw 保持有主张、但不会被某个 provider 的世界观硬编码锁死的方式。具体文件清单和完整示例，请参见 [能力扩展手册](/zh-CN/plugins/architecture)。

### 能力检查清单

当你添加一个新能力时，通常应同时修改这些表面：

- `src/<capability>/types.ts` 中的 core 契约类型
- `src/<capability>/runtime.ts` 中的 core runner / 运行时辅助工具
- `src/plugins/types.ts` 中的插件 API 注册表面
- `src/plugins/registry.ts` 中的插件注册表接线
- 当功能 / 渠道插件需要消费该能力时，修改 `src/plugins/runtime/*` 中的插件运行时暴露
- `src/test-utils/plugin-registration.ts` 中的捕获 / 测试辅助工具
- `src/plugins/contracts/registry.ts` 中的归属 / 契约断言
- `docs/` 中的运维者 / 插件文档

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

- core 拥有能力契约 + 编排
- 厂商插件拥有厂商实现
- 功能 / 渠道插件消费运行时辅助工具
- 契约测试保持归属明确
