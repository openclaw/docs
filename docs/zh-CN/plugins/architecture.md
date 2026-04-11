---
read_when:
    - 构建或调试原生 OpenClaw 插件
    - 理解插件能力模型或归属边界
    - 处理插件加载流水线或注册表相关工作
    - 实现提供商运行时钩子或渠道插件
sidebarTitle: Internals
summary: 插件内部机制：能力模型、归属、契约、加载流水线和运行时辅助工具
title: 插件内部机制
x-i18n:
    generated_at: "2026-04-11T11:37:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7cac67984d0d729c0905bcf5c18372fb0d9b02bbd3a531580b7e2ef483ef40a6
    source_path: plugins/architecture.md
    workflow: 15
---

# 插件内部机制

<Info>
  这是**深度架构参考**。如需实用指南，请参阅：
  - [安装和使用插件](/zh-CN/tools/plugin) —— 用户指南
  - [入门指南](/zh-CN/plugins/building-plugins) —— 第一个插件教程
  - [渠道插件](/zh-CN/plugins/sdk-channel-plugins) —— 构建一个消息渠道
  - [提供商插件](/zh-CN/plugins/sdk-provider-plugins) —— 构建一个模型提供商
  - [SDK 概览](/zh-CN/plugins/sdk-overview) —— 导入映射和注册 API
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

如果一个插件未注册任何能力，但提供了 hooks、工具或服务，那么它就是一个**仅 legacy hook** 插件。该模式仍然受到完整支持。

### 外部兼容性立场

能力模型已经落地到 core，并且当前已被内置/原生插件使用，但外部插件兼容性仍需要比“它已导出，因此它已冻结”更严格的标准。

当前指引：

- **现有外部插件：** 保持基于 hook 的集成可用；将其视为兼容性基线
- **新的内置/原生插件：** 优先使用显式能力注册，而不是面向厂商的直接耦合或新的仅 hook 设计
- **采用能力注册的外部插件：** 允许，但除非文档明确将某个契约标记为稳定，否则应将能力相关的辅助接口视为仍在演进中

实践规则：

- 能力注册 API 是预期的发展方向
- 在过渡期间，legacy hooks 仍是外部插件最安全、最不容易破坏兼容性的路径
- 并非所有导出的辅助子路径都同等稳定；应优先使用文档化的窄契约，而不是偶然暴露出来的辅助导出

### 插件形态

OpenClaw 会根据插件的实际注册行为（而不只是静态元数据）将每个已加载插件分类为一种形态：

- **plain-capability** —— 只注册一种能力类型（例如仅提供 provider 的插件 `mistral`）
- **hybrid-capability** —— 注册多种能力类型（例如 `openai` 同时拥有文本推理、语音、媒体理解和图像生成）
- **hook-only** —— 仅注册 hooks（类型化或自定义），不注册能力、工具、命令或服务
- **non-capability** —— 注册工具、命令、服务或路由，但不注册任何能力

使用 `openclaw plugins inspect <id>` 可查看插件的形态和能力细分。详见 [CLI 参考](/cli/plugins#inspect)。

### Legacy hooks

`before_agent_start` hook 仍作为仅 hook 插件的兼容路径而被支持。现实中仍有 legacy 插件依赖它。

方向是：

- 保持其可用
- 在文档中将其标记为 legacy
- 在模型/提供商覆盖相关工作中优先使用 `before_model_resolve`
- 在 prompt 修改相关工作中优先使用 `before_prompt_build`
- 只有在真实使用量下降且 fixture 覆盖证明迁移安全之后，才会移除它

### 兼容性信号

运行 `openclaw doctor` 或 `openclaw plugins inspect <id>` 时，你可能会看到以下标签之一：

| 信号 | 含义 |
| -------------------------- | ------------------------------------------------------------ |
| **配置有效** | 配置可正常解析，插件也能正常解析/加载 |
| **兼容性提示** | 插件使用的是受支持但较旧的模式（例如 `hook-only`） |
| **legacy 警告** | 插件使用了 `before_agent_start`，该功能已弃用 |
| **硬错误** | 配置无效，或插件加载失败 |

目前 `hook-only` 和 `before_agent_start` 都不会让你的插件失效 —— `hook-only` 只是提示，而 `before_agent_start` 只会触发警告。这些信号也会出现在 `openclaw status --all` 和 `openclaw plugins doctor` 中。

## 架构概览

OpenClaw 的插件系统有四层：

1. **Manifest + 设备发现**  
   OpenClaw 会从已配置路径、workspace 根目录、全局扩展根目录以及内置扩展中查找候选插件。设备发现会优先读取原生 `openclaw.plugin.json` manifest 以及受支持的 bundle manifest。
2. **启用 + 校验**  
   Core 决定某个已发现插件是启用、禁用、阻止，还是被选中用于某个独占槽位，例如 memory。
3. **运行时加载**  
   原生 OpenClaw 插件会通过 jiti 在进程内加载，并将能力注册到中央注册表中。兼容的 bundle 会在不导入运行时代码的情况下被规范化为注册表记录。
4. **接口消费**  
   OpenClaw 的其他部分会读取注册表，以暴露工具、渠道、提供商设置、hooks、HTTP 路由、CLI 命令和服务。

对于插件 CLI，根命令发现会拆分为两个阶段：

- 解析时元数据来自 `registerCli(..., { descriptors: [...] })`
- 真正的插件 CLI 模块可以保持惰性加载，并在首次调用时注册

这样既能让插件自有的 CLI 代码保留在插件内部，又能让 OpenClaw 在解析前预留根命令名称。

重要的设计边界是：

- 设备发现 + 配置校验应该能够仅依赖 **manifest/schema 元数据** 工作，而无需执行插件代码
- 原生运行时行为来自插件模块的 `register(api)` 路径

这种拆分使 OpenClaw 能够在完整运行时尚未激活之前，就完成配置校验、解释缺失/禁用的插件，并构建 UI/schema 提示。

### 渠道插件与共享 message 工具

对于常规聊天动作，渠道插件无需单独注册 send/edit/react 工具。OpenClaw 在 core 中保留一个共享的 `message` 工具，而渠道插件负责其背后的渠道特定发现和执行逻辑。

当前边界如下：

- core 拥有共享 `message` 工具宿主、prompt 接线、session/thread 记录以及执行分发
- 渠道插件拥有作用域动作发现、能力发现以及任何渠道特定的 schema 片段
- 渠道插件拥有提供商特定的 session 会话语法，例如会话 id 如何编码 thread id，或如何从父会话继承
- 渠道插件通过其动作适配器执行最终动作

对于渠道插件，SDK 接口是 `ChannelMessageActionAdapter.describeMessageTool(...)`。这个统一发现调用允许插件一起返回其可见动作、能力和 schema 扩展，从而避免这些部分发生漂移。

Core 会将运行时作用域传入该发现步骤。重要字段包括：

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 受信任的入站 `requesterSenderId`

这对于上下文敏感型插件非常重要。渠道可以根据当前活跃账户、当前房间/thread/message，或受信任的请求者身份，隐藏或暴露消息动作，而无需在 core `message` 工具中硬编码渠道特定分支。

这也是为什么嵌入式 runner 路由变更仍属于插件工作：runner 负责将当前聊天/session 身份转发到插件发现边界，以便共享 `message` 工具能为当前轮次暴露正确的渠道自有接口。

对于渠道自有的执行辅助工具，内置插件应将执行运行时保留在各自扩展模块内部。Core 不再在 `src/agents/tools` 下拥有 Discord、Slack、Telegram 或 WhatsApp 的消息动作运行时。我们也不会发布单独的 `plugin-sdk/*-action-runtime` 子路径，内置插件应直接从自己的扩展模块导入本地运行时代码。

同样的边界也适用于一般的 provider 命名 SDK 接缝：core 不应导入 Slack、Discord、Signal、WhatsApp 或类似扩展的渠道特定便捷 barrel。如果 core 需要某个行为，应当消费内置插件自己的 `api.ts` / `runtime-api.ts` barrel，或者将该需求提升为共享 SDK 中的一个狭窄通用能力。

对投票而言，当前有两条执行路径：

- `outbound.sendPoll` 是适用于通用投票模型渠道的共享基线
- `actions.handleAction("poll")` 是处理渠道特定投票语义或额外投票参数的首选路径

现在，core 会在插件投票分发拒绝该动作之后，才回退到共享投票解析，因此插件自有的投票处理器可以接受渠道特定的投票字段，而不会先被通用投票解析器阻拦。

完整启动顺序请参见[加载流水线](#load-pipeline)。

## 能力归属模型

OpenClaw 将原生插件视为**公司**或**功能**的归属边界，而不是一堆无关集成的杂项集合。

这意味着：

- 一个公司插件通常应拥有该公司的所有 OpenClaw 对外接口
- 一个功能插件通常应拥有其引入的完整功能接口
- 渠道应消费共享 core 能力，而不是临时重复实现 provider 行为

例如：

- 内置的 `openai` 插件拥有 OpenAI 模型提供商行为，以及 OpenAI 的语音 + 实时语音 + 媒体理解 + 图像生成行为
- 内置的 `elevenlabs` 插件拥有 ElevenLabs 语音行为
- 内置的 `microsoft` 插件拥有 Microsoft 语音行为
- 内置的 `google` 插件拥有 Google 模型提供商行为，以及 Google 的媒体理解 + 图像生成 + Web 搜索行为
- 内置的 `firecrawl` 插件拥有 Firecrawl Web 抓取行为
- 内置的 `minimax`、`mistral`、`moonshot` 和 `zai` 插件拥有各自的媒体理解后端
- 内置的 `qwen` 插件拥有 Qwen 文本提供商行为，以及媒体理解和视频生成行为
- `voice-call` 插件是一个功能插件：它拥有通话传输、工具、CLI、路由以及 Twilio 媒体流桥接，但它消费共享的语音以及实时转录和实时语音能力，而不是直接导入厂商插件

目标中的最终状态是：

- 即使 OpenAI 横跨文本模型、语音、图像以及未来的视频，也应归属于同一个插件
- 其他厂商也可以对自己的能力范围采用相同方式
- 渠道并不关心哪个厂商插件拥有该 provider；它们只消费 core 暴露出来的共享能力契约

这就是关键区别：

- **plugin** = 归属边界
- **capability** = 可由多个插件实现或消费的 core 契约

因此，如果 OpenClaw 新增了一个领域，例如视频，首要问题不是“哪个 provider 应该硬编码处理视频？”而是“core 的视频能力契约是什么？”一旦该契约存在，厂商插件就可以针对它注册，而渠道/功能插件也可以消费它。

如果该能力尚不存在，通常正确的做法是：

1. 在 core 中定义缺失的能力
2. 以类型化方式通过插件 API/运行时暴露它
3. 让渠道/功能接入该能力
4. 由厂商插件注册实现

这样既能保持归属明确，又能避免 core 行为依赖某个单一厂商或某条一次性的插件特定代码路径。

### 能力分层

决定代码归属时，可使用以下心智模型：

- **core 能力层**：共享编排、策略、回退、配置合并规则、交付语义以及类型化契约
- **厂商插件层**：厂商特定 API、认证、模型目录、语音合成、图像生成、未来的视频后端、用量端点
- **渠道/功能插件层**：Slack/Discord/voice-call 等集成，它们消费 core 能力并将其呈现在某个接口上

例如，TTS 遵循这种结构：

- core 拥有回复时 TTS 策略、回退顺序、偏好和渠道交付
- `openai`、`elevenlabs` 和 `microsoft` 拥有各自的合成实现
- `voice-call` 消费电话场景下的 TTS 运行时辅助工具

未来的能力也应优先遵循同样模式。

### 多能力公司插件示例

从外部看，一个公司插件应当表现得具有一致性。如果 OpenClaw 为模型、语音、实时转录、实时语音、媒体理解、图像生成、视频生成、Web 抓取和 Web 搜索提供了共享契约，那么某个厂商就可以在一个地方统一拥有它的所有接口：

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

关键不在于辅助函数的确切名称，而在于整体结构：

- 一个插件拥有厂商接口
- core 仍拥有能力契约
- 渠道和功能插件消费 `api.runtime.*` 辅助工具，而不是厂商代码
- 契约测试可以断言插件确实注册了它声称拥有的那些能力

### 能力示例：视频理解

OpenClaw 已经将图像/音频/视频理解视为一个共享能力。同样的归属模型也适用于这里：

1. core 定义 media-understanding 契约
2. 厂商插件按需注册 `describeImage`、`transcribeAudio` 和 `describeVideo`
3. 渠道和功能插件消费共享的 core 行为，而不是直接接入厂商代码

这样可以避免将某个 provider 的视频假设写死在 core 里。插件拥有厂商接口；core 拥有能力契约和回退行为。

视频生成也已经遵循同样顺序：core 拥有类型化能力契约和运行时辅助工具，而厂商插件则针对它注册 `api.registerVideoGenerationProvider(...)` 实现。

需要一个具体的发布检查清单吗？请参阅
[能力扩展手册](/zh-CN/plugins/architecture)。

## 契约与约束

插件 API 接口被有意设计为类型化，并集中定义在 `OpenClawPluginApi` 中。该契约定义了受支持的注册点，以及插件可依赖的运行时辅助工具。

这很重要，因为：

- 插件作者可以获得一个稳定的内部标准
- core 可以拒绝重复归属，例如两个插件注册相同的 provider id
- 启动过程可以为格式错误的注册暴露可操作的诊断信息
- 契约测试可以强制校验内置插件的归属关系，并防止悄然漂移

这里有两层约束：

1. **运行时注册约束**  
   插件注册表会在插件加载时校验注册内容。例如：重复的 provider id、重复的语音 provider id，以及格式错误的注册，都会产生插件诊断，而不是导致未定义行为。
2. **契约测试**  
   在测试运行中，内置插件会被捕获到契约注册表中，以便 OpenClaw 明确断言归属。当前这用于模型 provider、语音 provider、Web 搜索 provider 以及内置注册归属。

实际效果是，OpenClaw 能够预先知道哪个插件拥有哪个接口。这样 core 和渠道就能无缝组合，因为归属是声明式、类型化且可测试的，而不是隐式的。

### 什么应属于契约

好的插件契约应当：

- 是类型化的
- 足够小
- 围绕特定能力
- 由 core 拥有
- 可被多个插件复用
- 可被渠道/功能消费，而无需了解厂商细节

不好的插件契约则包括：

- 隐藏在 core 中的厂商特定策略
- 绕过注册表的一次性插件逃生口
- 直接深入某个厂商实现的渠道代码
- 不属于 `OpenClawPluginApi` 或 `api.runtime` 的临时运行时对象

如果拿不准，提升抽象层级：先定义能力，再让插件接入它。

## 执行模型

原生 OpenClaw 插件以**进程内**方式与 Gateway 网关 一起运行。它们没有经过沙箱隔离。一个已加载的原生插件与 core 代码处于相同的进程级信任边界中。

影响包括：

- 原生插件可以注册工具、网络处理器、hooks 和服务
- 原生插件中的 bug 可能导致 gateway 崩溃或变得不稳定
- 恶意原生插件等同于在 OpenClaw 进程内执行任意代码

兼容 bundle 默认更安全，因为 OpenClaw 当前将它们视为元数据/内容包。在当前版本中，这主要意味着内置 skills。

对于非内置插件，请使用 allowlist 和显式安装/加载路径。应将 workspace 插件视为开发期代码，而不是生产默认项。

对于内置 workspace 包名，请让插件 id 锚定在 npm 名称中：默认使用 `@openclaw/<id>`，或者在包有意暴露更窄插件角色时，使用经批准的类型后缀，例如 `-provider`、`-plugin`、`-speech`、`-sandbox` 或 `-media-understanding`。

重要的信任说明：

- `plugins.allow` 信任的是**插件 id**，而不是来源出处。
- 如果某个 workspace 插件与一个内置插件使用相同 id，那么当该 workspace 插件被启用/加入 allowlist 时，它会有意遮蔽内置副本。
- 这是正常且有用的，适用于本地开发、补丁测试和热修复。

## 导出边界

OpenClaw 导出的是能力，而不是实现便利接口。

应保持能力注册为公共接口。应裁剪非契约型辅助导出：

- 内置插件特定的辅助子路径
- 并非公共 API 的运行时接线子路径
- 厂商特定的便捷辅助工具
- 属于实现细节的设置/新手引导辅助工具

出于兼容性和内置插件维护需要，一些内置插件辅助子路径仍保留在生成的 SDK 导出映射中。当前示例包括 `plugin-sdk/feishu`、`plugin-sdk/feishu-setup`、`plugin-sdk/zalo`、`plugin-sdk/zalo-setup` 以及若干 `plugin-sdk/matrix*` 接缝。应将它们视为保留的实现细节导出，而不是推荐给新的第三方插件使用的 SDK 模式。

## 加载流水线

在启动时，OpenClaw 大致会这样做：

1. 发现候选插件根目录
2. 读取原生或兼容 bundle 的 manifest 和包元数据
3. 拒绝不安全的候选项
4. 规范化插件配置（`plugins.enabled`、`allow`、`deny`、`entries`、`slots`、`load.paths`）
5. 决定每个候选项是否启用
6. 通过 jiti 加载已启用的原生模块
7. 调用原生 `register(api)`（或 `activate(api)` —— 一个 legacy 别名）hook，并将注册内容收集到插件注册表中
8. 将注册表暴露给命令/运行时接口

<Note>
`activate` 是 `register` 的 legacy 别名 —— 加载器会解析存在的那个（`def.register ?? def.activate`），并在同一时机调用。所有内置插件都使用 `register`；新插件请优先使用 `register`。
</Note>

安全门会在运行时代码执行**之前**生效。当入口逃逸出插件根目录、路径可被所有用户写入，或对于非内置插件而言路径归属看起来可疑时，候选项会被阻止。

### Manifest 优先行为

manifest 是控制平面的真实来源。OpenClaw 使用它来：

- 标识插件
- 发现已声明的渠道/skills/配置 schema 或 bundle 能力
- 校验 `plugins.entries.<id>.config`
- 增强 Control UI 标签/占位符
- 显示安装/目录元数据
- 在不加载插件运行时的情况下，保留轻量激活和设置描述符

对于原生插件，运行时模块是数据平面部分。它负责注册 hooks、工具、命令或 provider 流程等实际行为。

可选的 manifest `activation` 和 `setup` 块仍然属于控制平面。它们只是用于激活规划和设置发现的纯元数据描述符；并不能替代运行时注册、`register(...)` 或 `setupEntry`。

### 加载器缓存了什么

OpenClaw 会保留一些短生命周期的进程内缓存，用于：

- 设备发现结果
- manifest 注册表数据
- 已加载的插件注册表

这些缓存可以减少突发启动开销和重复命令开销。可以将它们视为短期性能缓存，而不是持久化机制。

性能说明：

- 设置 `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` 或
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` 可以禁用这些缓存。
- 使用 `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` 和
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` 调整缓存窗口。

## 注册表模型

已加载插件不会直接修改随机的 core 全局对象。它们会注册到一个中央插件注册表中。

注册表会跟踪：

- 插件记录（身份、来源、起源、状态、诊断信息）
- 工具
- legacy hooks 和类型化 hooks
- 渠道
- providers
- Gateway 网关 RPC 处理器
- HTTP 路由
- CLI 注册器
- 后台服务
- 插件自有命令

随后，core 功能会从该注册表读取，而不是直接与插件模块交互。这样可以保持加载方向单向：

- 插件模块 -> 注册表注册
- core 运行时 -> 注册表消费

这种分离对可维护性很重要。它意味着大多数 core 接口只需要一个集成点：“读取注册表”，而不是“为每个插件模块写特例”。

## 会话绑定回调

绑定会话的插件可以在审批被解决时作出响应。

使用 `api.onConversationBindingResolved(...)` 可以在绑定请求获批或被拒绝后接收回调：

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
- `binding`：对于已批准请求，表示已解析出的绑定
- `request`：原始请求摘要、分离提示、发送者 id 以及会话元数据

这个回调仅用于通知。它不会改变谁被允许绑定会话，并且会在 core 完成审批处理后才运行。

## 提供商运行时钩子

提供商插件现在分为两层：

- manifest 元数据：`providerAuthEnvVars` 用于在运行时加载前执行轻量的提供商环境变量认证查找，`providerAuthAliases` 用于共享认证的提供商变体，`channelEnvVars` 用于在运行时加载前执行轻量的渠道环境变量/设置查找，此外还有 `providerAuthChoices`，用于在运行时加载前提供轻量的新手引导/认证选项标签和 CLI flag 元数据
- 配置时钩子：`catalog` / legacy `discovery` 以及 `applyConfigDefaults`
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

OpenClaw 仍然拥有通用的智能体循环、故障切换、转录处理和工具策略。这些钩子是提供商特定行为的扩展接口，因此无需实现整套自定义推理传输。

当某个提供商具有基于环境变量的凭证，并且你希望通用认证/状态/模型选择器路径在不加载插件运行时的情况下也能识别它时，请使用 manifest `providerAuthEnvVars`。当一个提供商 id 需要复用另一个提供商 id 的环境变量、认证配置文件、基于配置的认证以及 API key 新手引导选项时，请使用 manifest `providerAuthAliases`。当新手引导/认证选项 CLI 接口需要在不加载提供商运行时的情况下就知道该提供商的选项 id、分组标签以及简单的单 flag 认证接线时，请使用 manifest `providerAuthChoices`。提供商运行时中的 `envVars` 则应保留给面向操作员的提示，例如新手引导标签或 OAuth client-id/client-secret 设置变量。

当某个渠道具有由环境变量驱动的认证或设置，并且你希望通用 shell 环境变量回退、配置/状态检查或设置提示在不加载渠道运行时的情况下也能识别它时，请使用 manifest `channelEnvVars`。

### 钩子顺序与用法

对于模型/提供商插件，OpenClaw 会大致按以下顺序调用这些钩子。
“何时使用”这一列就是快速决策指南。

| # | 钩子 | 作用 | 何时使用 |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | `catalog` | 在生成 `models.json` 期间，将提供商配置发布到 `models.providers` 中 | 提供商拥有一个目录或基础 URL 默认值 |
| 2 | `applyConfigDefaults` | 在配置具体化期间，应用由提供商拥有的全局配置默认值 | 默认值依赖于认证模式、环境变量或提供商模型家族语义 |
| -- | _(内置模型查找)_ | OpenClaw 会先尝试常规的注册表/目录路径 | _(不是插件钩子)_ |
| 3 | `normalizeModelId` | 在查找前规范化 legacy 或预览版模型 id 别名 | 提供商希望在规范模型解析前自行处理别名清理 |
| 4 | `normalizeTransport` | 在通用模型组装之前，规范化提供商家族的 `api` / `baseUrl` | 提供商需要为同一传输家族中的自定义提供商 id 处理传输清理 |
| 5 | `normalizeConfig` | 在运行时/提供商解析前，规范化 `models.providers.<id>` | 提供商需要将配置清理逻辑保留在插件中；内置 Google 家族辅助工具也会为受支持的 Google 配置项提供兜底 |
| 6 | `applyNativeStreamingUsageCompat` | 对配置中的提供商应用原生分块流式传输用量兼容性重写 | 提供商需要修复由端点驱动的原生分块流式传输用量元数据 |
| 7 | `resolveConfigApiKey` | 在加载运行时认证之前，为配置型提供商解析环境变量标记认证 | 提供商拥有自己的环境变量标记 API key 解析逻辑；`amazon-bedrock` 在此也带有一个内置 AWS 环境变量标记解析器 |
| 8 | `resolveSyntheticAuth` | 在不持久化明文的前提下，暴露本地/自托管或基于配置的认证 | 提供商可以通过合成/本地凭证标记运行 |
| 9 | `resolveExternalAuthProfiles` | 叠加由提供商拥有的外部认证配置文件；CLI/应用自有凭证的默认 `persistence` 为 `runtime-only` | 提供商希望复用外部认证凭证，而不持久化复制后的刷新令牌 |
| 10 | `shouldDeferSyntheticProfileAuth` | 将已存储的合成配置文件占位符降到环境变量/配置型认证之后 | 提供商会存储合成占位配置文件，且这些占位符不应获得更高优先级 |
| 11 | `resolveDynamicModel` | 为本地注册表中尚不存在的提供商自有模型 id 提供同步回退解析 | 提供商接受任意上游模型 id |
| 12 | `prepareDynamicModel` | 异步预热，然后再次运行 `resolveDynamicModel` | 提供商在解析未知 id 之前需要网络元数据 |
| 13 | `normalizeResolvedModel` | 在嵌入式 runner 使用已解析模型之前执行最终重写 | 提供商需要进行传输重写，但仍然使用 core 传输 |
| 14 | `contributeResolvedModelCompat` | 为位于其他兼容传输之后的厂商模型补充兼容标记 | 提供商能够在代理传输中识别自己的模型，而无需接管整个提供商 |
| 15 | `capabilities` | 由提供商拥有、供共享 core 逻辑使用的转录/工具元数据 | 提供商需要处理转录或提供商家族特有的差异行为 |
| 16 | `normalizeToolSchemas` | 在嵌入式 runner 看到工具 schema 之前进行规范化 | 提供商需要对传输家族的 schema 进行清理 |
| 17 | `inspectToolSchemas` | 在规范化后暴露由提供商拥有的 schema 诊断信息 | 提供商希望给出关键字警告，而不必让 core 学会提供商特定规则 |
| 18 | `resolveReasoningOutputMode` | 选择原生或带标签的 reasoning 输出契约 | 提供商需要使用带标签的 reasoning/最终输出，而不是原生字段 |
| 19 | `prepareExtraParams` | 在通用流式选项包装器之前，对请求参数进行规范化 | 提供商需要默认请求参数或按提供商清理参数 |
| 20 | `createStreamFn` | 用自定义传输完全替换正常的流式路径 | 提供商需要自定义线协议，而不仅仅是一个包装器 |
| 21 | `wrapStreamFn` | 在应用通用包装器之后再包装流式函数 | 提供商需要请求头/请求体/模型兼容性包装器，但不需要自定义传输 |
| 22 | `resolveTransportTurnState` | 附加原生的逐轮传输头或元数据 | 提供商希望通用传输发送提供商原生的轮次身份信息 |
| 23 | `resolveWebSocketSessionPolicy` | 附加原生 WebSocket 头或会话冷却策略 | 提供商希望通用 WS 传输调整会话头或回退策略 |
| 24 | `formatApiKey` | 认证配置文件格式化器：将存储的配置文件转换为运行时 `apiKey` 字符串 | 提供商存储了额外认证元数据，并需要自定义运行时令牌形态 |
| 25 | `refreshOAuth` | 为自定义刷新端点或刷新失败策略覆盖 OAuth 刷新逻辑 | 提供商不适配共享的 `pi-ai` 刷新器 |
| 26 | `buildAuthDoctorHint` | 当 OAuth 刷新失败时，附加修复提示 | 提供商在刷新失败后需要由自己提供的认证修复指引 |
| 27 | `matchesContextOverflowError` | 由提供商拥有的上下文窗口溢出匹配器 | 提供商存在通用启发式无法识别的原始溢出错误 |
| 28 | `classifyFailoverReason` | 由提供商拥有的故障切换原因分类 | 提供商可以将原始 API/传输错误映射为限流、过载等类别 |
| 29 | `isCacheTtlEligible` | 面向代理/回程提供商的 prompt 缓存策略 | 提供商需要按代理特性限制缓存 TTL |
| 30 | `buildMissingAuthMessage` | 替换通用的缺失认证恢复消息 | 提供商需要提供商特定的缺失认证恢复提示 |
| 31 | `suppressBuiltInModel` | 过时上游模型抑制，并可选提供面向用户的错误提示 | 提供商需要隐藏过时的上游条目，或用厂商提示替换它们 |
| 32 | `augmentModelCatalog` | 在设备发现后追加合成/最终目录条目 | 提供商需要在 `models list` 和选择器中添加面向未来兼容的合成条目 |
| 33 | `isBinaryThinking` | 针对二元 thinking 提供商的开/关 reasoning 开关 | 提供商只暴露二元的 thinking 开/关 |
| 34 | `supportsXHighThinking` | 为选定模型提供 `xhigh` reasoning 支持 | 提供商只希望部分模型支持 `xhigh` |
| 35 | `resolveDefaultThinkingLevel` | 为特定模型家族解析默认 `/think` 级别 | 提供商拥有某个模型家族的默认 `/think` 策略 |
| 36 | `isModernModelRef` | 用于实时配置文件过滤和 smoke 选择的现代模型匹配器 | 提供商拥有 live/smoke 首选模型匹配逻辑 |
| 37 | `prepareRuntimeAuth` | 在推理前将已配置凭证交换为实际运行时令牌/key | 提供商需要令牌交换或短期请求凭证 |
| 38 | `resolveUsageAuth` | 为 `/usage` 及相关状态接口解析用量/计费凭证 | 提供商需要自定义用量/配额令牌解析，或需要不同的用量凭证 |
| 39 | `fetchUsageSnapshot` | 在认证解析完成后获取并规范化提供商特定的用量/配额快照 | 提供商需要提供商特定的用量端点或负载解析器 |
| 40 | `createEmbeddingProvider` | 为 memory/search 构建由提供商拥有的 embedding 适配器 | Memory embedding 行为应归属于提供商插件 |
| 41 | `buildReplayPolicy` | 返回一个用于控制该提供商转录处理的重放策略 | 提供商需要自定义转录策略（例如剥离 thinking 块） |
| 42 | `sanitizeReplayHistory` | 在通用转录清理后重写重放历史 | 提供商在共享压缩辅助工具之外，还需要提供商特定的重放重写 |
| 43 | `validateReplayTurns` | 在嵌入式 runner 之前，对重放轮次做最终校验或重塑 | 提供商传输在通用清理之后需要更严格的轮次校验 |
| 44 | `onModelSelected` | 在模型被选中后运行由提供商拥有的副作用 | 当某个模型变为活跃状态时，提供商需要上报遥测或维护提供商自有状态 |

`normalizeModelId`、`normalizeTransport` 和 `normalizeConfig` 会先检查匹配到的提供商插件，然后继续向其他具备相应钩子能力的提供商插件回退，直到某个插件实际修改了模型 id 或传输/配置为止。这样可以让别名/兼容性提供商 shim 正常工作，而不要求调用方知道究竟是哪个内置插件拥有这次重写。如果没有任何提供商钩子重写受支持的 Google 家族配置项，那么内置的 Google 配置规范化器仍会应用该兼容性清理。

如果提供商需要完全自定义的线协议或自定义请求执行器，那就是另一类扩展。这些钩子适用于仍运行在 OpenClaw 正常推理循环之上的提供商行为。

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
  提供商家族提示、认证修复指引、用量端点集成、
  prompt 缓存适用性、具备认证感知的配置默认值、Claude
  默认/自适应 thinking 策略，以及面向 beta headers、
  `/fast` / `serviceTier` 和 `context1m` 的 Anthropic 特定流式整形逻辑。
- Anthropic 的 Claude 特定流式辅助工具目前仍保留在该内置插件自己的公共
  `api.ts` / `contract-api.ts` 接缝中。该包接口导出
  `wrapAnthropicProviderStream`、`resolveAnthropicBetas`、
  `resolveAnthropicFastMode`、`resolveAnthropicServiceTier` 以及更底层的
  Anthropic 包装器构建器，而不是为了某个提供商的 beta-header 规则去扩大通用 SDK。
- OpenAI 使用 `resolveDynamicModel`、`normalizeResolvedModel` 和
  `capabilities`，以及 `buildMissingAuthMessage`、`suppressBuiltInModel`、
  `augmentModelCatalog`、`supportsXHighThinking` 和 `isModernModelRef`，
  因为它拥有 GPT-5.4 前向兼容、直接 OpenAI
  `openai-completions` -> `openai-responses` 规范化、面向 Codex 的认证
  提示、Spark 抑制、合成 OpenAI 列表条目，以及 GPT-5 thinking /
  live-model 策略；`openai-responses-defaults` 流式家族则拥有共享的原生 OpenAI Responses 包装器，用于处理 attribution headers、
  `/fast`/`serviceTier`、文本冗长度、原生 Codex Web 搜索、
  reasoning 兼容负载整形，以及 Responses 上下文管理。
- OpenRouter 使用 `catalog` 以及 `resolveDynamicModel` 和
  `prepareDynamicModel`，因为该提供商是透传型的，可能会在
  OpenClaw 的静态目录更新之前就暴露新的模型 id；它还使用
  `capabilities`、`wrapStreamFn` 和 `isCacheTtlEligible`，以便将
  提供商特定的请求头、路由元数据、reasoning 补丁以及
  prompt 缓存策略保留在 core 之外。它的重放策略来自
  `passthrough-gemini` 家族，而 `openrouter-thinking` 流式家族
  则拥有代理 reasoning 注入以及对不支持模型 / `auto` 的跳过逻辑。
- GitHub Copilot 使用 `catalog`、`auth`、`resolveDynamicModel` 和
  `capabilities`，以及 `prepareRuntimeAuth` 和 `fetchUsageSnapshot`，
  因为它需要提供商自有的设备登录、模型回退行为、Claude 转录差异行为、
  GitHub token -> Copilot token 交换，以及提供商自有的用量端点。
- OpenAI Codex 使用 `catalog`、`resolveDynamicModel`、
  `normalizeResolvedModel`、`refreshOAuth` 和 `augmentModelCatalog`，以及
  `prepareExtraParams`、`resolveUsageAuth` 和 `fetchUsageSnapshot`，因为它
  仍运行在 core 的 OpenAI 传输之上，但拥有自己的传输/base URL
  规范化、OAuth 刷新回退策略、默认传输选择、
  合成 Codex 目录条目以及 ChatGPT 用量端点集成；它与直接 OpenAI
  共享同一个 `openai-responses-defaults` 流式家族。
- Google AI Studio 和 Gemini CLI OAuth 使用 `resolveDynamicModel`、
  `buildReplayPolicy`、`sanitizeReplayHistory`、
  `resolveReasoningOutputMode`、`wrapStreamFn` 和 `isModernModelRef`，因为
  `google-gemini` 重放家族拥有 Gemini 3.1 前向兼容回退、
  原生 Gemini 重放校验、引导期重放清理、带标签的
  reasoning 输出模式，以及现代模型匹配；而
  `google-thinking` 流式家族则拥有 Gemini thinking 负载规范化；
  Gemini CLI OAuth 还使用 `formatApiKey`、`resolveUsageAuth` 和
  `fetchUsageSnapshot` 来处理令牌格式化、令牌解析和配额端点接线。
- Anthropic Vertex 通过
  `anthropic-by-model` 重放家族使用 `buildReplayPolicy`，因此 Claude 特定的重放清理
  仍只作用于 Claude id，而不会作用于所有 `anthropic-messages` 传输。
- Amazon Bedrock 使用 `buildReplayPolicy`、`matchesContextOverflowError`、
  `classifyFailoverReason` 和 `resolveDefaultThinkingLevel`，因为它拥有
  针对 Anthropic-on-Bedrock 流量的 Bedrock 特定限流/未就绪/上下文溢出错误分类；
  其重放策略仍共享同一个仅限 Claude 的 `anthropic-by-model` 防护。
- OpenRouter、Kilocode、Opencode 和 Opencode Go 通过
  `passthrough-gemini` 重放家族使用 `buildReplayPolicy`，因为它们通过 OpenAI 兼容传输代理 Gemini
  模型，并且需要 Gemini
  thought-signature 清理，而不需要原生 Gemini 重放校验或引导重写。
- MiniMax 通过
  `hybrid-anthropic-openai` 重放家族使用 `buildReplayPolicy`，因为一个提供商同时拥有
  Anthropic-message 和 OpenAI 兼容语义；它在 Anthropic 一侧保留仅限 Claude 的
  thinking 块丢弃逻辑，同时将 reasoning 输出模式覆写回原生模式，而
  `minimax-fast-mode` 流式家族则在共享流式路径上拥有
  fast-mode 模型重写逻辑。
- Moonshot 使用 `catalog` 和 `wrapStreamFn`，因为它仍使用共享的
  OpenAI 传输，但需要提供商自有的 thinking 负载规范化；`moonshot-thinking`
  流式家族会将配置加 `/think` 状态映射到其原生的二元 thinking 负载上。
- Kilocode 使用 `catalog`、`capabilities`、`wrapStreamFn` 和
  `isCacheTtlEligible`，因为它需要提供商自有的请求头、
  reasoning 负载规范化、Gemini 转录提示，以及 Anthropic
  缓存 TTL 限制；`kilocode-thinking` 流式家族则在共享代理流式路径上保留 Kilo thinking
  注入逻辑，同时跳过 `kilo/auto` 及其他不支持显式 reasoning 负载的代理模型 id。
- Z.AI 使用 `resolveDynamicModel`、`prepareExtraParams`、`wrapStreamFn`、
  `isCacheTtlEligible`、`isBinaryThinking`、`isModernModelRef`、
  `resolveUsageAuth` 和 `fetchUsageSnapshot`，因为它拥有 GLM-5 回退、
  `tool_stream` 默认值、二元 thinking 交互体验、现代模型匹配，以及
  用量认证与配额抓取；`tool-stream-default-on` 流式家族则将默认开启的
  `tool_stream` 包装器从逐提供商手写胶水代码中抽离出来。
- xAI 使用 `normalizeResolvedModel`、`normalizeTransport`、
  `contributeResolvedModelCompat`、`prepareExtraParams`、`wrapStreamFn`、
  `resolveSyntheticAuth`、`resolveDynamicModel` 和 `isModernModelRef`，
  因为它拥有原生 xAI Responses 传输规范化、Grok fast-mode
  别名重写、默认 `tool_stream`、严格工具 / reasoning 负载
  清理、面向插件自有工具的回退认证复用、前向兼容的 Grok
  模型解析，以及提供商自有的兼容补丁，例如 xAI 工具 schema
  配置、受支持以外的 schema 关键字、原生 `web_search`，以及 HTML 实体形式的
  工具调用参数解码。
- Mistral、OpenCode Zen 和 OpenCode Go 仅使用 `capabilities`，
  以便将转录/工具差异行为保留在 core 之外。
- 仅目录型的内置提供商，例如 `byteplus`、`cloudflare-ai-gateway`、
  `huggingface`、`kimi-coding`、`nvidia`、`qianfan`、
  `synthetic`、`together`、`venice`、`vercel-ai-gateway` 和 `volcengine`，仅使用
  `catalog`。
- Qwen 对其文本提供商使用 `catalog`，并针对其多模态接口注册共享的
  media-understanding 和 video-generation。
- MiniMax 和 Xiaomi 使用 `catalog` 加用量钩子，因为虽然推理仍通过共享
  传输运行，但它们的 `/usage` 行为归属于插件自身。

## 运行时辅助工具

插件可以通过 `api.runtime` 访问经过挑选的 core 辅助工具。以 TTS 为例：

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

- `textToSpeech` 会返回用于文件/语音消息接口的常规 core TTS 输出负载。
- 它使用 core 的 `messages.tts` 配置和提供商选择。
- 返回 PCM 音频缓冲区 + 采样率。插件必须自行针对提供商完成重采样/编码。
- `listVoices` 对每个提供商来说都是可选的。可将其用于厂商自有的语音选择器或设置流程。
- 语音列表可以包含更丰富的元数据，例如语言区域、性别和个性标签，以供具备提供商感知能力的选择器使用。
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

- 将 TTS 策略、回退和回复交付保留在 core 中。
- 使用语音提供商来承载厂商自有的合成行为。
- legacy Microsoft `edge` 输入会被规范化为 `microsoft` 提供商 id。
- 推荐的归属模型是面向公司的：随着 OpenClaw 增加这些
  能力契约，一个厂商插件可以统一拥有文本、语音、图像以及未来媒体提供商。

对于图像/音频/视频理解，插件会注册一个类型化的
media-understanding 提供商，而不是通用的键值对包：

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
- 将厂商行为保留在提供商插件中。
- 增量扩展应保持类型化：新增可选方法、新增可选结果字段、新增可选能力。
- 视频生成已经遵循同样的模式：
  - core 拥有能力契约和运行时辅助工具
  - 厂商插件注册 `api.registerVideoGenerationProvider(...)`
  - 功能/渠道插件消费 `api.runtime.videoGeneration.*`

对于 media-understanding 运行时辅助工具，插件可以调用：

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

对于音频转录，插件可以使用 media-understanding 运行时接口，或旧的 STT 别名：

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
- 它使用 core 的 media-understanding 音频配置（`tools.media.audio`）和提供商回退顺序。
- 当未产生转录输出时（例如输入被跳过/不受支持），会返回 `{ text: undefined }`。
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

- `provider` 和 `model` 是单次运行覆盖项，不是持久化的会话变更。
- OpenClaw 仅对受信任调用方接受这些覆盖字段。
- 对于插件自有的回退运行，操作员必须通过 `plugins.entries.<id>.subagent.allowModelOverride: true` 显式启用。
- 使用 `plugins.entries.<id>.subagent.allowedModels` 可将受信任插件限制为特定的规范 `provider/model` 目标，或使用 `"*"` 以显式允许任意目标。
- 不受信任插件的子智能体运行仍可工作，但覆盖请求会被拒绝，而不是静默回退。

对于 Web 搜索，插件可以消费共享运行时辅助工具，而不是深入到智能体工具接线中：

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
`api.registerWebSearchProvider(...)` 注册 Web 搜索提供商。

说明：

- 将提供商选择、凭证解析和共享请求语义保留在 core 中。
- 使用 Web 搜索提供商承载厂商特定的搜索传输。
- `api.runtime.webSearch.*` 是功能/渠道插件在需要搜索能力但不依赖智能体工具包装器时的首选共享接口。

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
- `auth`：必填。使用 `"gateway"` 表示要求常规 Gateway 网关 认证，或使用 `"plugin"` 表示由插件自行管理认证/webhook 校验。
- `match`：可选。`"exact"`（默认）或 `"prefix"`。
- `replaceExisting`：可选。允许同一个插件替换它自己已存在的路由注册。
- `handler`：当该路由处理了请求时返回 `true`。

说明：

- `api.registerHttpHandler(...)` 已被移除，并会导致插件加载错误。请改用 `api.registerHttpRoute(...)`。
- 插件路由必须显式声明 `auth`。
- 除非设置 `replaceExisting: true`，否则精确的 `path + match` 冲突会被拒绝，而且一个插件不能替换另一个插件的路由。
- 具有不同 `auth` 级别的重叠路由会被拒绝。`exact`/`prefix` 的回退链只能保留在同一认证级别内。
- `auth: "plugin"` 路由**不会**自动获得操作员运行时作用域。它们用于由插件自管的 webhook/签名校验，而不是特权 Gateway 网关 辅助调用。
- `auth: "gateway"` 路由会在 Gateway 网关 请求运行时作用域内运行，但该作用域被有意设置得较为保守：
  - 共享密钥 bearer 认证（`gateway.auth.mode = "token"` / `"password"`）会将插件路由运行时作用域固定为 `operator.write`，即使调用方发送了 `x-openclaw-scopes`
  - 受信任且携带身份的 HTTP 模式（例如 `trusted-proxy` 或私有入口下的 `gateway.auth.mode = "none"`）只有在请求头显式携带 `x-openclaw-scopes` 时，才会接受该作用域
  - 如果这些带身份的插件路由请求中缺少 `x-openclaw-scopes`，运行时作用域会回退到 `operator.write`
- 实践规则：不要假设一个使用 gateway 认证的插件路由天然就是管理员接口。如果你的路由需要仅管理员可用的行为，应要求使用带身份的认证模式，并记录显式的 `x-openclaw-scopes` 请求头契约。

## 插件 SDK 导入路径

编写插件时，应使用 SDK 子路径，而不是整体式的 `openclaw/plugin-sdk` 导入：

- `openclaw/plugin-sdk/plugin-entry` 用于插件注册原语。
- `openclaw/plugin-sdk/core` 用于通用共享的插件侧契约。
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
  `openclaw/plugin-sdk/secret-input` 和
  `openclaw/plugin-sdk/webhook-ingress`，用于共享设置/认证/回复/webhook
  接线。`channel-inbound` 是防抖、提及匹配、
  入站提及策略辅助工具、信封格式化以及入站信封上下文辅助工具的共享归属位置。
  `channel-setup` 是狭窄的可选安装设置接缝。
  `setup-runtime` 是供 `setupEntry` /
  延迟启动使用的运行时安全设置接口，其中包括可安全导入的设置 patch 适配器。
  `setup-adapter-runtime` 是具备环境变量感知能力的账户设置适配器接缝。
  `setup-tools` 是小型 CLI/归档/文档辅助工具接缝（`formatCliCommand`、
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
  `openclaw/plugin-sdk/directory-runtime`，用于共享运行时/配置辅助工具。
  `telegram-command-config` 是 Telegram 自定义
  命令规范化/校验的狭窄公共接缝，即使内置
  Telegram 契约接口暂时不可用，它也会保持可用。
  `text-runtime` 是共享的文本/Markdown/日志接缝，包含
  对智能体可见文本的剥离、Markdown 渲染/分块辅助工具、脱敏
  辅助工具、directive-tag 辅助工具，以及安全文本工具。
- 与审批相关的渠道接缝应优先使用插件上的单一 `approvalCapability`
  契约。随后 core 会通过这一个能力来读取审批认证、交付、渲染、
  原生路由以及惰性原生处理器行为，而不是将审批行为混入其他无关插件字段中。
- `openclaw/plugin-sdk/channel-runtime` 已弃用，目前仅作为旧插件的
  兼容性 shim 保留。新代码应导入更窄的通用原语，而仓库代码也不应再新增对该 shim 的导入。
- 内置扩展的内部实现仍是私有的。外部插件只能使用 `openclaw/plugin-sdk/*`
  子路径。OpenClaw core/测试代码可以使用插件包根目录下的仓库公共入口点，例如
  `index.js`、`api.js`、`runtime-api.js`、`setup-entry.js`，
  以及像 `login-qr-api.js` 这样范围狭窄的文件。绝不要从 core 或其他扩展中导入某个插件包的 `src/*`。
- 仓库入口点拆分如下：
  `<plugin-package-root>/api.js` 是辅助工具/类型 barrel，
  `<plugin-package-root>/runtime-api.js` 是仅运行时 barrel，
  `<plugin-package-root>/index.js` 是内置插件入口，
  `<plugin-package-root>/setup-entry.js` 是设置插件入口。
- 当前内置提供商示例：
  - Anthropic 使用 `api.js` / `contract-api.js` 提供 Claude 流式辅助工具，例如
    `wrapAnthropicProviderStream`、beta-header 辅助工具以及 `service_tier`
    解析。
  - OpenAI 使用 `api.js` 提供 provider 构建器、默认模型辅助工具以及
    realtime provider 构建器。
  - OpenRouter 使用 `api.js` 提供其 provider 构建器以及新手引导/配置
    辅助工具，而 `register.runtime.js` 仍可为仓库内使用重新导出通用
    `plugin-sdk/provider-stream` 辅助工具。
- 通过 facade 加载的公共入口点会优先使用当前活跃的运行时配置快照；当
  OpenClaw 尚未提供运行时快照时，则回退到磁盘上已解析的配置文件。
- 通用共享原语仍是首选的公共 SDK 契约。当前仍保留一小组
  内置渠道品牌化辅助工具接缝用于兼容。应将它们视为内置维护/兼容性接缝，
  而不是新的第三方导入目标；新的跨渠道契约仍应落在通用 `plugin-sdk/*`
  子路径或插件本地 `api.js` /
  `runtime-api.js` barrel 上。

兼容性说明：

- 新代码应避免使用根级 `openclaw/plugin-sdk` barrel。
- 优先使用狭窄且稳定的原语。较新的 setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool 子路径，才是新的
  内置和外部插件工作的预期契约。
  目标解析/匹配应归属于 `openclaw/plugin-sdk/channel-targets`。
  消息动作 gate 和 reaction message-id 辅助工具应归属于
  `openclaw/plugin-sdk/channel-actions`。
- 默认情况下，内置扩展特定的辅助工具 barrel 并不稳定。如果某个
  辅助工具只被某个内置扩展需要，应将它保留在该扩展本地的
  `api.js` 或 `runtime-api.js` 接缝之后，而不是将其提升到
  `openclaw/plugin-sdk/<extension>` 中。
- 新的共享辅助工具接缝应保持通用，而不是带渠道品牌色彩。共享目标
  解析应归属于 `openclaw/plugin-sdk/channel-targets`；渠道特定
  的内部实现应保留在所属插件本地的 `api.js` 或 `runtime-api.js`
  接缝之后。
- 像 `image-generation`、
  `media-understanding` 和 `speech` 这样的能力特定子路径之所以存在，是因为今天内置/原生插件已经在使用它们。它们的存在本身并不意味着每个已导出的辅助工具都是长期冻结的外部契约。

## Message 工具 schema

插件应拥有渠道特定的 `describeMessageTool(...)` schema
扩展。应将提供商特定字段保留在插件中，而不是放入共享 core。

对于共享的可移植 schema 片段，请复用通过
`openclaw/plugin-sdk/channel-actions` 导出的通用辅助工具：

- `createMessageToolButtonsSchema()` 用于按钮网格风格的负载
- `createMessageToolCardSchema()` 用于结构化卡片负载

如果某种 schema 形状只适用于某个提供商，就应在该插件自己的源码中定义它，而不是将其提升到共享 SDK 中。

## 渠道目标解析

渠道插件应拥有渠道特定的目标语义。应保持共享 outbound host 的通用性，并通过消息适配器接口处理提供商规则：

- `messaging.inferTargetChatType({ to })` 用于在目录查找前，判断一个已规范化目标应被视为 `direct`、`group` 还是 `channel`。
- `messaging.targetResolver.looksLikeId(raw, normalized)` 用于告诉 core 某个输入是否应跳过目录搜索，直接进入类似 id 的解析流程。
- `messaging.targetResolver.resolveTarget(...)` 是在规范化之后或目录未命中之后，当 core 需要最终的提供商自有解析时使用的插件回退路径。
- `messaging.resolveOutboundSessionRoute(...)` 则在目标解析完成后，负责提供商特定的 session 路由构造。

推荐拆分方式：

- 对于应当在搜索 peers/groups 之前发生的类别判断，使用 `inferTargetChatType`。
- 对于“将此视为显式/原生目标 id”的检查，使用 `looksLikeId`。
- 对于提供商特定的规范化回退，使用 `resolveTarget`，而不要用它做广义的目录搜索。
- 将提供商原生 id，例如 chat id、thread id、JID、handle 和 room id，保留在 `target` 值或提供商特定参数中，而不是放入通用 SDK 字段。

## 基于配置的目录

如果插件需要从配置派生目录条目，应将这部分逻辑保留在插件中，并复用
`openclaw/plugin-sdk/directory-runtime`
中的共享辅助工具。

当渠道需要如下基于配置的 peers/groups 时，可以使用这种方式：

- 由 allowlist 驱动的私信 peers
- 已配置的 channel/group 映射
- 以账户为作用域的静态目录回退

`directory-runtime` 中的共享辅助工具只处理通用操作：

- 查询过滤
- 限制数量应用
- 去重/规范化辅助工具
- 构建 `ChannelDirectoryEntry[]`

渠道特定的账户检查和 id 规范化应保留在插件实现中。

## 提供商目录

提供商插件可以使用
`registerProvider({ catalog: { run(...) { ... } } })`
为推理定义模型目录。

`catalog.run(...)` 返回的结构与 OpenClaw 写入
`models.providers` 的结构相同：

- `{ provider }` 表示一个提供商条目
- `{ providers }` 表示多个提供商条目

当插件拥有提供商特定的模型 id、base URL 默认值或受认证控制的模型元数据时，请使用 `catalog`。

`catalog.order` 控制插件目录相对于 OpenClaw 内置隐式提供商的合并时机：

- `simple`：普通 API key 或环境变量驱动的提供商
- `profile`：当存在认证配置文件时出现的提供商
- `paired`：会合成多个相关提供商条目的提供商
- `late`：最后一轮，在其他隐式提供商之后

如果 key 发生冲突，后出现的提供商会胜出，因此插件可以有意覆盖具有相同 provider id 的内置提供商条目。

兼容性：

- `discovery` 仍作为 legacy 别名可用
- 如果同时注册了 `catalog` 和 `discovery`，OpenClaw 会使用 `catalog`

## 只读渠道检查

如果你的插件注册了一个渠道，建议在实现
`resolveAccount(...)` 的同时，也实现
`plugin.config.inspectAccount(cfg, accountId)`。

原因：

- `resolveAccount(...)` 是运行时路径。它可以假定凭证
  已经完全具体化，并且在所需 secret 缺失时快速失败。
- 像 `openclaw status`、`openclaw status --all`、
  `openclaw channels status`、`openclaw channels resolve` 以及 doctor/config
  修复流程这样的只读命令路径，不应为了描述配置而必须具体化运行时凭证。

推荐的 `inspectAccount(...)` 行为：

- 只返回描述性的账户状态。
- 保留 `enabled` 和 `configured`。
- 在相关时包含凭证来源/状态字段，例如：
  - `tokenSource`、`tokenStatus`
  - `botTokenSource`、`botTokenStatus`
  - `appTokenSource`、`appTokenStatus`
  - `signingSecretSource`、`signingSecretStatus`
- 你不需要为了报告只读可用性而返回原始 token 值。只返回
  `tokenStatus: "available"`（以及匹配的来源字段）就足够支撑状态类命令。
- 当凭证通过 SecretRef 配置，但在当前命令路径中不可用时，请使用
  `configured_unavailable`。

这样只读命令就可以报告“已配置，但在当前命令路径中不可用”，而不是崩溃，或错误地将该账户报告为未配置。

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
会变为 `name/<fileBase>`。

如果你的插件导入了 npm 依赖，请在该目录中安装它们，以便
`node_modules` 可用（`npm install` / `pnpm install`）。

安全护栏：每个 `openclaw.extensions` 条目在解析 symlink 后，都必须保留在插件目录内部。任何逃逸出包目录的条目都会被拒绝。

安全说明：`openclaw plugins install` 会使用
`npm install --omit=dev --ignore-scripts` 安装插件依赖
（不运行 lifecycle scripts，运行时也不安装 dev dependencies）。应保持插件依赖树为“纯 JS/TS”，并避免依赖那些需要 `postinstall` 构建的包。

可选：`openclaw.setupEntry` 可以指向一个轻量级的仅设置模块。
当 OpenClaw 需要为一个已禁用的渠道插件提供设置接口，或者
当某个渠道插件已启用但尚未配置完成时，它会加载 `setupEntry`，
而不是完整的插件入口。这样当你的主插件入口还接线了工具、hooks 或其他仅运行时代码时，可以让启动和设置更轻量。

可选：`openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
可以让渠道插件在 gateway 的
pre-listen 启动阶段，即使渠道已经完成配置，也改走同样的 `setupEntry` 路径。

只有当 `setupEntry` 完整覆盖了 gateway 开始监听前必须存在的启动接口时，才应使用此选项。实际上，这意味着设置入口必须注册启动所依赖的每一项渠道自有能力，例如：

- 渠道注册本身
- 在 gateway 开始监听前必须可用的任何 HTTP 路由
- 在同一时间窗口内必须存在的任何 gateway 方法、工具或服务

如果你的完整入口仍拥有任何必需的启动能力，就不要启用这个标志。请保持插件的默认行为，让 OpenClaw 在启动期间加载完整入口。

内置渠道也可以发布仅设置阶段使用的契约接口辅助工具，以便 core 在完整渠道运行时尚未加载前进行查询。当前的设置提升接口是：

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

当 core 需要在不加载完整插件入口的情况下，将 legacy 单账户渠道配置提升为
`channels.<id>.accounts.*` 时，就会使用该接口。Matrix 是当前的内置示例：当已存在命名账户时，它只会将 auth/bootstrap 键移动到某个被提升命名的账户中，并且可以保留一个已配置但非规范的 default-account key，而不是总是创建
`accounts.default`。

这些设置 patch 适配器让内置契约接口发现保持惰性。导入时开销保持较轻；提升接口只会在首次使用时加载，而不会在模块导入时重新进入内置渠道启动过程。

当这些启动接口包含 Gateway 网关 RPC 方法时，应将它们保留在
插件特定的前缀之下。Core 管理员命名空间（`config.*`、
`exec.approvals.*`、`wizard.*`、`update.*`）仍然保留，并且始终解析为
`operator.admin`，即使某个插件请求了更窄的作用域也是如此。

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

渠道插件可以通过 `openclaw.channel` 声明 setup/发现元数据，并通过 `openclaw.install` 声明安装提示。这样就可以让 core 目录本身不携带数据。

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

除了最小示例之外，`openclaw.channel` 还有一些实用字段：

- `detailLabel`：用于更丰富目录/状态接口的次级标签
- `docsLabel`：覆盖文档链接文本
- `preferOver`：此目录条目应优先于哪些更低优先级的插件/渠道 id
- `selectionDocsPrefix`、`selectionDocsOmitLabel`、`selectionExtras`：用于选择界面文案控制
- `markdownCapable`：将该渠道标记为支持 Markdown，以便做 outbound 格式化决策
- `exposure.configured`：设为 `false` 时，在已配置渠道列表接口中隐藏该渠道
- `exposure.setup`：设为 `false` 时，在交互式设置/配置选择器中隐藏该渠道
- `exposure.docs`：将该渠道标记为内部/私有，用于文档导航接口
- `showConfigured` / `showInSetup`：仍接受的 legacy 别名，仅用于兼容；推荐使用 `exposure`
- `quickstartAllowFrom`：允许该渠道接入标准快速开始 `allowFrom` 流程
- `forceAccountBinding`：即使只存在一个账户，也要求显式账户绑定
- `preferSessionLookupForAnnounceTarget`：在解析 announce target 时优先使用 session 查找

OpenClaw 还可以合并**外部渠道目录**（例如 MPM
注册表导出）。只需将 JSON 文件放到以下任一位置：

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

或者将 `OPENCLAW_PLUGIN_CATALOG_PATHS`（或 `OPENCLAW_MPM_CATALOG_PATHS`）指向一个或多个 JSON 文件（以逗号/分号/`PATH` 分隔）。每个文件都应包含 `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`。解析器也接受将 `"packages"` 或 `"plugins"` 作为 `"entries"` 键的 legacy 别名。

## 上下文引擎插件

上下文引擎插件拥有会话上下文在摄取、组装和压缩过程中的编排职责。你可以在插件中通过
`api.registerContextEngine(id, factory)` 注册它们，然后使用
`plugins.slots.contextEngine` 选择当前激活的引擎。

当你的插件需要替换或扩展默认上下文流水线，而不仅仅是添加 memory 搜索或 hooks 时，请使用这种方式。

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

如果你的引擎**并不**拥有压缩算法，请保留 `compact()`
实现，并显式委托给它：

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

当某个插件需要当前 API 无法很好表达的行为时，不要通过私有直接耦合绕过插件系统。应添加缺失的能力。

推荐顺序：

1. 定义 core 契约  
   明确 core 应拥有的共享行为：策略、回退、配置合并、
   生命周期、面向渠道的语义，以及运行时辅助工具的形状。
2. 添加类型化的插件注册/运行时接口  
   使用最小但有用的类型化能力接口扩展 `OpenClawPluginApi` 和/或 `api.runtime`。
3. 接线 core + 渠道/功能消费者  
   渠道和功能插件应通过 core 消费新能力，
   而不是直接导入某个厂商实现。
4. 注册厂商实现  
   然后由厂商插件针对该能力注册它们的后端实现。
5. 添加契约覆盖  
   添加测试，让归属关系和注册形状在长期演进中保持明确。

这正是 OpenClaw 能够保持有明确主张、同时又不被某一个
provider 的世界观所硬编码绑定的方式。具体的文件检查清单和完整示例，请参阅 [能力扩展手册](/zh-CN/plugins/architecture)。

### 能力检查清单

当你新增一种能力时，实现通常应同时涉及以下接口：

- `src/<capability>/types.ts` 中的 core 契约类型
- `src/<capability>/runtime.ts` 中的 core runner/运行时辅助工具
- `src/plugins/types.ts` 中的插件 API 注册接口
- `src/plugins/registry.ts` 中的插件注册表接线
- 当功能/渠道插件需要消费该能力时，`src/plugins/runtime/*` 中的插件运行时暴露接口
- `src/test-utils/plugin-registration.ts` 中的捕获/测试辅助工具
- `src/plugins/contracts/registry.ts` 中的归属/契约断言
- `docs/` 中的操作员/插件文档

如果这些接口中有某个缺失，通常就说明该能力尚未真正完成集成。

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
- 功能/渠道插件消费运行时辅助工具
- 契约测试让归属关系保持明确
