---
read_when:
    - 构建或调试原生 OpenClaw 插件
    - 理解插件能力模型或归属边界
    - 处理插件加载流水线或注册表
    - 实现提供商运行时钩子或渠道插件
sidebarTitle: Internals
summary: 插件内部机制：能力模型、归属、契约、加载流水线和运行时辅助工具
title: 插件内部机制
x-i18n:
    generated_at: "2026-04-23T08:14:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: d3d5e4b9c48c2a0fc8116733e38a745bac5dfdbe65fdea8e9be6563b4051d805
    source_path: plugins/architecture.md
    workflow: 15
---

# 插件内部机制

<Info>
  这是**深度架构参考**。如需实用指南，请参阅：
  - [安装和使用插件](/zh-CN/tools/plugin) —— 用户指南
  - [入门指南](/zh-CN/plugins/building-plugins) —— 第一个插件教程
  - [渠道插件](/zh-CN/plugins/sdk-channel-plugins) —— 构建消息渠道
  - [提供商插件](/zh-CN/plugins/sdk-provider-plugins) —— 构建模型提供商
  - [SDK 概览](/zh-CN/plugins/sdk-overview) —— import map 和注册 API
</Info>

本页介绍 OpenClaw 插件系统的内部架构。

## 公共能力模型

能力是 OpenClaw 内部公开的**原生插件**模型。每个原生 OpenClaw 插件都会针对一种或多种能力类型进行注册：

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

一个注册了零个能力、但提供钩子、工具或服务的插件，属于**仅 legacy hook** 插件。这种模式目前仍然受到完全支持。

### 外部兼容性立场

能力模型已经在核心中落地，并已被当前的内置 / 原生插件使用，但外部插件的兼容性仍需要比“它已导出，因此它已冻结”更严格的标准。

当前指导如下：

- **现有外部插件：** 保持基于 hook 的集成可正常工作；将其视为兼容性的基线
- **新的内置 / 原生插件：** 优先使用显式能力注册，而不是特定供应商的内部访问或新的仅 hook 设计
- **采用能力注册的外部插件：** 允许，但除非文档明确将某个契约标记为稳定，否则应将能力专用的辅助接口视为仍在演进中

实际规则：

- 能力注册 API 是预期的发展方向
- 在过渡期间，legacy hook 仍然是对外部插件来说最安全、最不易破坏的路径
- 并非所有导出的辅助子路径都同等重要；优先使用文档化的狭义契约，而不是偶然导出的辅助接口

### 插件形态

OpenClaw 会根据每个已加载插件的实际注册行为来判定其形态（而不仅仅是静态元数据）：

- **plain-capability** —— 仅注册一种能力类型（例如仅提供商插件 `mistral`）
- **hybrid-capability** —— 注册多种能力类型（例如 `openai` 同时拥有文本推理、语音、媒体理解和图像生成）
- **hook-only** —— 仅注册 hooks（类型化或自定义），不注册能力、工具、命令或服务
- **non-capability** —— 注册工具、命令、服务或路由，但不注册能力

使用 `openclaw plugins inspect <id>` 可查看插件的形态和能力细分。详见 [CLI 参考](/zh-CN/cli/plugins#inspect)。

### Legacy hooks

`before_agent_start` hook 仍然作为仅 hook 插件的兼容路径受到支持。现实中的 legacy 插件仍然依赖它。

方向如下：

- 保持其正常工作
- 在文档中将其标记为 legacy
- 对于模型 / 提供商覆盖工作，优先使用 `before_model_resolve`
- 对于提示词变更工作，优先使用 `before_prompt_build`
- 只有在真实使用量下降且 fixture 覆盖证明迁移安全后，才考虑移除

### 兼容性信号

当你运行 `openclaw doctor` 或 `openclaw plugins inspect <id>` 时，可能会看到以下标签之一：

| 信号 | 含义 |
| -------------------------- | ------------------------------------------------------------ |
| **config valid** | 配置解析正常，且插件可解析 |
| **compatibility advisory** | 插件使用了受支持但较旧的模式（例如 `hook-only`） |
| **legacy warning** | 插件使用了 `before_agent_start`，该接口已弃用 |
| **hard error** | 配置无效，或插件加载失败 |

`hook-only` 和 `before_agent_start` 当前都不会导致你的插件失效——`hook-only` 只是提示，而 `before_agent_start` 只会触发警告。这些信号也会出现在 `openclaw status --all` 和 `openclaw plugins doctor` 中。

## 架构概览

OpenClaw 的插件系统有四层：

1. **Manifest + 设备发现**  
   OpenClaw 会从已配置路径、workspace 根目录、全局插件根目录以及内置插件中查找候选插件。设备发现会优先读取原生 `openclaw.plugin.json` manifests，以及受支持的 bundle manifests。
2. **启用 + 验证**  
   核心决定已发现的插件是已启用、已禁用、已阻止，还是被选中用于某个独占槽位（例如 memory）。
3. **运行时加载**  
   原生 OpenClaw 插件会通过 jiti 在进程内加载，并将能力注册到中央注册表中。兼容的 bundles 会在不导入运行时代码的情况下规范化为注册表记录。
4. **表面消费**
   OpenClaw 的其余部分会读取注册表，以暴露工具、渠道、提供商设置、hooks、HTTP 路由、CLI 命令和服务。

对于插件 CLI 本身，根命令发现分为两个阶段：

- 解析阶段的元数据来自 `registerCli(..., { descriptors: [...] })`
- 真正的插件 CLI 模块可以保持懒加载，并在首次调用时注册

这样既能让插件拥有的 CLI 代码保留在插件内部，又能让 OpenClaw 在解析前预留根命令名称。

重要的设计边界是：

- 设备发现 + 配置验证应该仅依赖 **manifest / schema 元数据** 即可工作，而无需执行插件代码
- 原生运行时行为来自插件模块的 `register(api)` 路径

这种拆分让 OpenClaw 能在完整运行时尚未激活之前，先验证配置、解释缺失 / 已禁用的插件，并构建 UI / schema 提示。

### 渠道插件与共享消息工具

对于常规聊天操作，渠道插件无需单独注册发送 / 编辑 / 反应工具。OpenClaw 在核心中保留一个共享的 `message` 工具，而渠道插件则拥有其背后的渠道专用发现和执行逻辑。

当前的边界如下：

- 核心拥有共享 `message` 工具宿主、提示词接线、会话 / 线程记录和执行分发
- 渠道插件拥有作用域化动作发现、能力发现，以及任何渠道专用的 schema 片段
- 渠道插件拥有提供商专用的会话对话语法，例如对话 id 如何编码线程 id，或如何从父对话继承
- 渠道插件通过其动作适配器执行最终动作

对于渠道插件，SDK 表面是 `ChannelMessageActionAdapter.describeMessageTool(...)`。这个统一的发现调用允许插件同时返回其可见动作、能力和 schema 贡献，从而避免这些部分彼此漂移。

当某个渠道专用 message-tool 参数携带媒体来源（例如本地路径或远程媒体 URL）时，插件还应从 `describeMessageTool(...)` 返回 `mediaSourceParams`。核心会使用这个显式列表来应用沙箱路径规范化和出站媒体访问提示，而不会硬编码插件拥有的参数名称。
这里应优先使用按动作划分的映射，而不是某个渠道范围内的扁平列表，这样仅限 profile 的媒体参数就不会在 `send` 等无关动作上被规范化。

核心会将运行时作用域传入该发现步骤。重要字段包括：

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 受信任的入站 `requesterSenderId`

这对于上下文敏感的插件很重要。渠道可以根据活动账户、当前房间 / 线程 / 消息，或受信任的请求者身份来隐藏或暴露消息动作，而无需在核心 `message` 工具中硬编码渠道专用分支。

这也是为什么嵌入式 runner 路由改动仍然属于插件工作：runner 负责将当前聊天 / 会话身份转发到插件发现边界，以便共享的 `message` 工具能够为当前轮次暴露正确的、由渠道拥有的表面。

对于渠道拥有的执行辅助工具，内置插件应将执行运行时保留在它们自己的扩展模块中。核心不再拥有位于 `src/agents/tools` 下的 Discord、Slack、Telegram 或 WhatsApp 消息动作运行时。
我们不会发布单独的 `plugin-sdk/*-action-runtime` 子路径，内置插件应直接从其扩展拥有的模块导入本地运行时代码。

相同的边界也适用于一般意义上按提供商命名的 SDK 接缝：核心不应导入 Slack、Discord、Signal、WhatsApp 或类似扩展的渠道专用便捷 barrel。如果核心需要某种行为，要么消费内置插件自己的 `api.ts` / `runtime-api.ts` barrel，要么将该需求提升为共享 SDK 中狭义的通用能力。

对于投票，当前有两条执行路径：

- `outbound.sendPoll` 是适用于符合通用投票模型渠道的共享基线
- `actions.handleAction("poll")` 是适用于渠道专用投票语义或额外投票参数的首选路径

现在，核心会在插件投票分发拒绝该动作之后，才延迟执行共享投票解析，因此插件拥有的投票处理器可以接受渠道专用投票字段，而不会先被通用投票解析器拦住。

完整启动顺序请参阅[加载流水线](#load-pipeline)。

## 能力归属模型

OpenClaw 将原生插件视为**公司**或**功能**的归属边界，而不是无关集成的大杂烩。

这意味着：

- 公司插件通常应拥有该公司的所有 OpenClaw 对外表面
- 功能插件通常应拥有其引入的完整功能表面
- 渠道应消费共享的核心能力，而不是临时重新实现提供商行为

示例：

- 内置的 `openai` 插件拥有 OpenAI 模型提供商行为，以及 OpenAI 语音 + 实时语音 + 媒体理解 + 图像生成行为
- 内置的 `elevenlabs` 插件拥有 ElevenLabs 语音行为
- 内置的 `microsoft` 插件拥有 Microsoft 语音行为
- 内置的 `google` 插件拥有 Google 模型提供商行为，以及 Google 媒体理解 + 图像生成 + Web 搜索行为
- 内置的 `firecrawl` 插件拥有 Firecrawl Web 抓取行为
- 内置的 `minimax`、`mistral`、`moonshot` 和 `zai` 插件拥有它们各自的媒体理解后端
- 内置的 `qwen` 插件拥有 Qwen 文本提供商行为，以及媒体理解和视频生成行为
- `voice-call` 插件是一个功能插件：它拥有通话传输、工具、CLI、路由以及 Twilio 媒体流桥接，但它会消费共享的语音、实时转录和实时语音能力，而不是直接导入供应商插件

预期的最终状态是：

- 即使 OpenAI 横跨文本模型、语音、图像和未来的视频，它仍然位于一个插件中
- 另一个供应商也可以对其自身的表面区域采用相同方式
- 渠道并不关心哪个供应商插件拥有该提供商；它们消费的是由核心暴露的共享能力契约

这就是关键区别：

- **plugin** = 归属边界
- **capability** = 可由多个插件实现或消费的核心契约

因此，如果 OpenClaw 新增了诸如视频之类的新领域，第一个问题不应是“哪个提供商应该硬编码视频处理？”而应该是“核心视频能力契约是什么？”一旦该契约存在，供应商插件就可以针对它进行注册，渠道 / 功能插件也可以消费它。

如果该能力尚不存在，通常正确的做法是：

1. 在核心中定义缺失的能力
2. 通过插件 API / 运行时以类型化方式暴露它
3. 让渠道 / 功能对接该能力
4. 让供应商插件注册实现

这样可以保持归属明确，同时避免核心行为依赖单一供应商或某个一次性的插件专用代码路径。

### 能力分层

决定代码应放在哪里时，请使用这个心智模型：

- **核心能力层**：共享编排、策略、回退、配置合并规则、交付语义和类型化契约
- **供应商插件层**：供应商专用 API、身份验证、模型目录、语音合成、图像生成、未来的视频后端、使用量端点
- **渠道 / 功能插件层**：Slack / Discord / voice-call / 等集成，它们消费核心能力并将其呈现在某个表面上

例如，TTS 遵循如下结构：

- 核心拥有回复时 TTS 策略、回退顺序、偏好和渠道交付
- `openai`、`elevenlabs` 和 `microsoft` 拥有合成实现
- `voice-call` 消费电话 TTS 运行时辅助工具

未来的能力也应优先采用同样的模式。

### 多能力公司插件示例

一个公司插件从外部看起来应当是内聚的。如果 OpenClaw 具有用于模型、语音、实时转录、实时语音、媒体理解、图像生成、视频生成、Web 抓取和 Web 搜索的共享契约，那么一个供应商就可以在同一个地方拥有其所有表面：

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

重要的不是确切的辅助函数名称，而是这种结构：

- 一个插件拥有该供应商表面
- 核心仍然拥有能力契约
- 渠道和功能插件消费 `api.runtime.*` 辅助工具，而不是供应商代码
- 契约测试可以断言该插件已注册它声称拥有的能力

### 能力示例：视频理解

OpenClaw 已经将图像 / 音频 / 视频理解视为一种共享能力。相同的归属模型也适用于这里：

1. 核心定义媒体理解契约
2. 供应商插件按适用情况注册 `describeImage`、`transcribeAudio` 和 `describeVideo`
3. 渠道和功能插件消费共享的核心行为，而不是直接连接到供应商代码

这样可以避免将某个提供商对视频的假设固化进核心中。插件拥有供应商表面；核心拥有能力契约和回退行为。

视频生成也已经采用了同样的顺序：核心拥有类型化能力契约和运行时辅助工具，供应商插件则针对其注册 `api.registerVideoGenerationProvider(...)` 实现。

需要一个具体的发布清单吗？请参阅[能力扩展手册](/zh-CN/plugins/architecture)。

## 契约与约束

插件 API 表面是有意进行类型化并集中在 `OpenClawPluginApi` 中的。这个契约定义了受支持的注册点，以及插件可依赖的运行时辅助工具。

这很重要，原因如下：

- 插件作者获得一种稳定的内部标准
- 核心可以拒绝重复归属，例如两个插件注册相同的 provider id
- 启动阶段可以为格式错误的注册提供可执行的诊断信息
- 契约测试可以强制执行内置插件的归属，并防止静默漂移

这里有两层约束：

1. **运行时注册约束**  
   插件注册表会在插件加载时验证注册内容。例如：重复的 provider id、重复的 speech provider id 以及格式错误的注册，都会产生插件诊断，而不是导致未定义行为。
2. **契约测试**  
   在测试运行期间，内置插件会被捕获到契约注册表中，这样 OpenClaw 就可以明确断言归属。如今这已用于模型提供商、语音提供商、Web 搜索提供商以及内置注册归属。

实际效果是，OpenClaw 能够预先知道哪个插件拥有哪个表面。这使得核心和渠道可以无缝组合，因为归属是声明式的、类型化的、可测试的，而不是隐式的。

### 什么应该属于契约

好的插件契约应当是：

- 类型化的
- 小而精的
- 能力专用的
- 由核心拥有
- 可被多个插件复用
- 可被渠道 / 功能消费，而无需了解供应商细节

不好的插件契约则是：

- 隐藏在核心中的供应商专用策略
- 绕过注册表的一次性插件逃生口
- 直接深入供应商实现的渠道代码
- 不属于 `OpenClawPluginApi` 或 `api.runtime` 的临时运行时对象

如果拿不准，请提升抽象层级：先定义能力，再让插件接入它。

## 执行模型

原生 OpenClaw 插件与 Gateway 网关 **在同一进程中** 运行。它们不是沙箱隔离的。一个已加载的原生插件与核心代码具有相同的进程级信任边界。

这意味着：

- 原生插件可以注册工具、网络处理器、hooks 和服务
- 原生插件中的 bug 可能导致 gateway 崩溃或变得不稳定
- 恶意原生插件等同于在 OpenClaw 进程内部执行任意代码

兼容 bundle 默认更安全，因为 OpenClaw 当前将它们视为元数据 / 内容包。在当前版本中，这主要意味着内置 skills。

对于非内置插件，请使用 allowlist 和显式的安装 / 加载路径。应将 workspace 插件视为开发时代码，而不是生产默认项。

对于内置 workspace 包名，请让插件 id 锚定在 npm 名称中：默认使用 `@openclaw/<id>`，或者使用批准的类型化后缀，例如 `-provider`、`-plugin`、`-speech`、`-sandbox` 或 `-media-understanding`，前提是该包有意暴露更狭义的插件角色。

重要的信任说明：

- `plugins.allow` 信任的是**插件 id**，而不是来源出处。
- 当同 id 的 workspace 插件被启用 / 加入 allowlist 时，它会有意遮蔽内置插件副本。
- 这属于正常且有用的行为，适用于本地开发、补丁测试和热修复。
- 内置插件信任是根据源码快照来解析的——即加载时磁盘上的 manifest 和代码——而不是根据安装元数据。损坏或被替换的安装记录，无法在实际源码声称之外悄悄扩大内置插件的信任表面。

## 导出边界

OpenClaw 导出的是能力，而不是实现便利接口。

保持能力注册对外公开。裁剪非契约辅助导出：

- 内置插件专用辅助子路径
- 不打算作为公共 API 的运行时管线子路径
- 供应商专用的便捷辅助工具
- 属于实现细节的 setup / onboarding 辅助工具

出于兼容性和内置插件维护目的，某些内置插件辅助子路径仍然保留在生成的 SDK 导出映射中。当前示例包括 `plugin-sdk/feishu`、`plugin-sdk/feishu-setup`、`plugin-sdk/zalo`、`plugin-sdk/zalo-setup` 以及若干 `plugin-sdk/matrix*` 接缝。应将这些视为保留的实现细节导出，而不是新第三方插件推荐采用的 SDK 模式。

## 加载流水线

在启动时，OpenClaw 大致会执行以下流程：

1. 发现候选插件根目录
2. 读取原生或兼容 bundle 的 manifest 和包元数据
3. 拒绝不安全的候选项
4. 规范化插件配置（`plugins.enabled`、`allow`、`deny`、`entries`、`slots`、`load.paths`）
5. 决定每个候选项是否启用
6. 加载已启用的原生模块：已构建的内置模块使用原生加载器；未构建的原生插件使用 jiti
7. 调用原生 `register(api)` hooks，并将注册内容收集到插件注册表中
8. 将注册表暴露给命令 / 运行时表面

<Note>
`activate` 是 `register` 的 legacy 别名——加载器会解析两者中存在的那个（`def.register ?? def.activate`），并在同一时机调用。所有内置插件都使用 `register`；新插件请优先使用 `register`。
</Note>

安全门会发生在运行时代码执行**之前**。如果候选项的入口逃逸出插件根目录、路径对所有人可写，或者对于非内置插件来说路径归属看起来可疑，那么该候选项会被阻止。

### Manifest 优先行为

manifest 是控制平面的事实来源。OpenClaw 使用它来：

- 标识插件
- 发现声明的渠道 / skills / 配置 schema 或 bundle 能力
- 验证 `plugins.entries.<id>.config`
- 增强 Control UI 标签 / 占位符
- 显示安装 / 目录元数据
- 在不加载插件运行时的情况下保留轻量激活和设置描述符

对于原生插件，运行时模块是数据平面部分。它会注册实际行为，例如 hooks、工具、命令或提供商流程。

可选的 manifest `activation` 和 `setup` 块仍然留在控制平面。它们是用于激活规划和设置发现的纯元数据描述符；它们不会替代运行时注册、`register(...)` 或 `setupEntry`。
首批实时激活消费者现在会使用 manifest 中的命令、渠道和提供商提示，在更广泛的注册表实体化之前缩小插件加载范围：

- CLI 加载会收窄到拥有所请求主命令的插件
- 渠道设置 / 插件解析会收窄到拥有所请求渠道 id 的插件
- 显式提供商设置 / 运行时解析会收窄到拥有所请求 provider id 的插件

设置发现现在会优先使用由描述符拥有的 id，例如 `setup.providers` 和 `setup.cliBackends`，以便在回退到 `setup-api` 之前先收窄候选插件范围；`setup-api` 仅用于那些仍需要设置时运行时 hooks 的插件。如果多个已发现插件声称拥有相同的规范化 setup provider 或 CLI backend id，则设置查找会拒绝这个有歧义的归属，而不是依赖发现顺序。

### 加载器缓存的内容

OpenClaw 会保留以下短期进程内缓存：

- 发现结果
- manifest 注册表数据
- 已加载的插件注册表

这些缓存可减少突发启动和重复命令的开销。可以将它们安全地视为短生命周期的性能缓存，而不是持久化机制。

性能说明：

- 设置 `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` 或 `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` 可禁用这些缓存。
- 使用 `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` 和 `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` 调整缓存窗口。

## 注册表模型

已加载插件不会直接修改任意核心全局状态。它们会注册到一个中央插件注册表中。

该注册表会跟踪：

- 插件记录（身份、来源、源头、状态、诊断）
- 工具
- legacy hooks 和类型化 hooks
- 渠道
- 提供商
- Gateway 网关 RPC 处理器
- HTTP 路由
- CLI 注册器
- 后台服务
- 插件拥有的命令

然后核心功能从该注册表读取，而不是直接与插件模块通信。这使加载保持单向：

- 插件模块 -> 注册表注册
- 核心运行时 -> 注册表消费

这种分离对可维护性很重要。它意味着大多数核心表面只需要一个集成点：“读取注册表”，而不是“为每个插件模块做特殊处理”。

## 会话绑定回调

绑定会话的插件可以在批准结果确定时作出响应。

使用 `api.onConversationBindingResolved(...)` 可在绑定请求被批准或拒绝后收到回调：

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
- `binding`：已获批准请求的已解析绑定
- `request`：原始请求摘要、分离提示、发送者 id 和会话元数据

此回调仅用于通知。它不会改变谁被允许绑定某个会话，并且会在核心批准处理完成后运行。

## 提供商运行时 hooks

提供商插件现在有两层：

- manifest 元数据：`providerAuthEnvVars` 用于在运行时加载前以低成本查找基于环境变量的提供商认证，`providerAuthAliases` 用于共享认证的提供商变体，`channelEnvVars` 用于在运行时加载前以低成本查找基于环境变量的渠道配置 / 设置，此外还有 `providerAuthChoices`，用于在运行时加载前以低成本提供 onboarding / 认证选择标签和 CLI flag 元数据
- 配置时 hooks：`catalog` / legacy `discovery`，以及 `applyConfigDefaults`
- 运行时 hooks：`normalizeModelId`、`normalizeTransport`、`normalizeConfig`、`applyNativeStreamingUsageCompat`、`resolveConfigApiKey`、`resolveSyntheticAuth`、`resolveExternalAuthProfiles`、`shouldDeferSyntheticProfileAuth`、`resolveDynamicModel`、`prepareDynamicModel`、`normalizeResolvedModel`、`contributeResolvedModelCompat`、`capabilities`、`normalizeToolSchemas`、`inspectToolSchemas`、`resolveReasoningOutputMode`、`prepareExtraParams`、`createStreamFn`、`wrapStreamFn`、`resolveTransportTurnState`、`resolveWebSocketSessionPolicy`、`formatApiKey`、`refreshOAuth`、`buildAuthDoctorHint`、`matchesContextOverflowError`、`classifyFailoverReason`、`isCacheTtlEligible`、`buildMissingAuthMessage`、`suppressBuiltInModel`、`augmentModelCatalog`、`resolveThinkingProfile`、`isBinaryThinking`、`supportsXHighThinking`、`resolveDefaultThinkingLevel`、`isModernModelRef`、`prepareRuntimeAuth`、`resolveUsageAuth`、`fetchUsageSnapshot`、`createEmbeddingProvider`、`buildReplayPolicy`、`sanitizeReplayHistory`、`validateReplayTurns`、`onModelSelected`

OpenClaw 仍然拥有通用智能体循环、故障切换、转录处理和工具策略。这些 hooks 是提供商专用行为的扩展表面，而无需引入一整套自定义推理传输。

当提供商具有基于环境变量的凭证，并且通用认证 / 状态 / 模型选择器路径需要在不加载插件运行时的情况下感知它们时，请使用 manifest `providerAuthEnvVars`。当某个 provider id 应复用另一个 provider id 的环境变量、认证配置文件、基于配置的认证以及 API 密钥 onboarding 选项时，请使用 manifest `providerAuthAliases`。当 onboarding / 认证选择 CLI 表面需要在不加载提供商运行时的情况下了解该提供商的 choice id、分组标签和简单的单 flag 认证接线时，请使用 manifest `providerAuthChoices`。将提供商运行时 `envVars` 保留给面向操作员的提示，例如 onboarding 标签或 OAuth client-id / client-secret 设置变量。

当某个渠道具有基于环境变量的认证或设置，并且通用 shell 环境变量回退、配置 / 状态检查或设置提示需要在不加载渠道运行时的情况下感知它时，请使用 manifest `channelEnvVars`。

### Hook 顺序和用法

对于模型 / 提供商插件，OpenClaw 大致会按以下顺序调用 hooks。
“何时使用”一列是快速决策指南。

| # | Hook | 作用 | 何时使用 |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | `catalog` | 在生成 `models.json` 期间将提供商配置发布到 `models.providers` 中 | 提供商拥有目录，或拥有 base URL 默认值 |
| 2 | `applyConfigDefaults` | 在配置实体化期间应用由提供商拥有的全局配置默认值 | 默认值依赖于认证模式、环境或提供商模型家族语义 |
| -- | _(内置模型查找)_ | OpenClaw 会先尝试常规注册表 / 目录路径 | _(不是插件 hook)_ |
| 3 | `normalizeModelId` | 在查找前规范化 legacy 或预览版 model-id 别名 | 提供商拥有在规范模型解析前进行别名清理的逻辑 |
| 4 | `normalizeTransport` | 在通用模型组装前规范化提供商家族的 `api` / `baseUrl` | 提供商拥有同一传输家族中自定义 provider id 的传输清理逻辑 |
| 5 | `normalizeConfig` | 在运行时 / 提供商解析前规范化 `models.providers.<id>` | 提供商需要与插件放在一起的配置清理逻辑；内置的 Google 家族辅助工具也会为受支持的 Google 配置项提供兜底 |
| 6 | `applyNativeStreamingUsageCompat` | 对配置提供商应用原生流式用量兼容性重写 | 提供商需要基于端点的原生流式用量元数据修复 |
| 7 | `resolveConfigApiKey` | 在加载运行时认证前，为配置提供商解析环境变量标记认证 | 提供商具有由其拥有的环境变量标记 API 密钥解析逻辑；`amazon-bedrock` 在这里也有内置的 AWS 环境变量标记解析器 |
| 8 | `resolveSyntheticAuth` | 在不持久化明文的情况下暴露本地 / 自托管或基于配置的认证 | 提供商可使用合成 / 本地凭证标记运行 |
| 9 | `resolveExternalAuthProfiles` | 叠加由提供商拥有的外部认证配置文件；CLI / 应用拥有的凭证默认 `persistence` 为 `runtime-only` | 提供商会复用外部认证凭证，而不持久化复制的刷新令牌；请在 manifest 中声明 `contracts.externalAuthProviders` |
| 10 | `shouldDeferSyntheticProfileAuth` | 将已存储的合成配置文件占位符优先级降到基于环境变量 / 配置的认证之后 | 提供商会存储合成占位配置文件，而这些占位符不应获得更高优先级 |
| 11 | `resolveDynamicModel` | 为本地注册表中尚不存在的、由提供商拥有的 model id 执行同步回退解析 | 提供商接受任意上游 model id |
| 12 | `prepareDynamicModel` | 执行异步预热，然后再次运行 `resolveDynamicModel` | 提供商在解析未知 id 前需要网络元数据 |
| 13 | `normalizeResolvedModel` | 在嵌入式 runner 使用已解析模型前执行最终重写 | 提供商需要传输重写，但仍使用核心传输 |
| 14 | `contributeResolvedModelCompat` | 为另一种兼容传输后面的供应商模型提供兼容性标志 | 提供商能在代理传输上识别自己的模型，而无需接管该提供商 |
| 15 | `capabilities` | 由提供商拥有、供共享核心逻辑使用的转录 / 工具元数据 | 提供商需要转录 / 提供商家族特定差异处理 |
| 16 | `normalizeToolSchemas` | 在嵌入式 runner 看见工具 schema 之前对其进行规范化 | 提供商需要传输家族级别的 schema 清理 |
| 17 | `inspectToolSchemas` | 在规范化后暴露由提供商拥有的 schema 诊断信息 | 提供商希望给出关键字警告，而无需让核心理解提供商专用规则 |
| 18 | `resolveReasoningOutputMode` | 选择原生或带标记的推理输出契约 | 提供商需要带标记的推理 / 最终输出，而不是原生字段 |
| 19 | `prepareExtraParams` | 在通用流选项包装器之前进行请求参数规范化 | 提供商需要默认请求参数或按提供商清理参数 |
| 20 | `createStreamFn` | 用自定义传输完全替换正常流路径 | 提供商需要自定义线协议，而不仅仅是包装器 |
| 21 | `wrapStreamFn` | 在应用通用包装器后对流进行包装 | 提供商需要请求头 / 请求体 / 模型兼容性包装器，而不是自定义传输 |
| 22 | `resolveTransportTurnState` | 附加原生的逐轮传输头或元数据 | 提供商希望通用传输发送提供商原生的轮次身份信息 |
| 23 | `resolveWebSocketSessionPolicy` | 附加原生 WebSocket 头或会话冷却策略 | 提供商希望通用 WS 传输调整会话头或回退策略 |
| 24 | `formatApiKey` | 认证配置文件格式化器：已存储配置文件会变成运行时 `apiKey` 字符串 | 提供商会存储额外认证元数据，并需要自定义运行时令牌形态 |
| 25 | `refreshOAuth` | 为自定义刷新端点或刷新失败策略覆盖 OAuth 刷新逻辑 | 提供商不适配共享的 `pi-ai` 刷新器 |
| 26 | `buildAuthDoctorHint` | 当 OAuth 刷新失败时附加修复提示 | 提供商需要在刷新失败后提供其自有的认证修复指导 |
| 27 | `matchesContextOverflowError` | 由提供商拥有的上下文窗口溢出匹配器 | 提供商存在通用启发式无法识别的原始溢出错误 |
| 28 | `classifyFailoverReason` | 由提供商拥有的故障切换原因分类 | 提供商可以将原始 API / 传输错误映射为速率限制 / 过载等原因 |
| 29 | `isCacheTtlEligible` | 面向代理 / 回程提供商的提示词缓存策略 | 提供商需要代理专用的缓存 TTL 门控 |
| 30 | `buildMissingAuthMessage` | 替换通用的缺失认证恢复消息 | 提供商需要提供商专用的缺失认证恢复提示 |
| 31 | `suppressBuiltInModel` | 过时上游模型抑制，以及可选的面向用户错误提示 | 提供商需要隐藏过时的上游条目，或用供应商提示替换它们 |
| 32 | `augmentModelCatalog` | 在发现后附加合成 / 最终目录条目 | 提供商需要在 `models list` 和选择器中添加合成的前向兼容条目 |
| 33 | `resolveThinkingProfile` | 特定模型的 `/think` 级别集、显示标签和默认值 | 提供商为选定模型暴露自定义思考层级或二元标签 |
| 34 | `isBinaryThinking` | 开 / 关推理切换兼容性 hook | 提供商只暴露二元思考开 / 关 |
| 35 | `supportsXHighThinking` | `xhigh` 推理支持兼容性 hook | 提供商希望仅在部分模型上启用 `xhigh` |
| 36 | `resolveDefaultThinkingLevel` | 默认 `/think` 级别兼容性 hook | 提供商拥有某个模型家族的默认 `/think` 策略 |
| 37 | `isModernModelRef` | 用于实时配置文件过滤和 smoke 选择的现代模型匹配器 | 提供商拥有实时 / smoke 首选模型匹配逻辑 |
| 38 | `prepareRuntimeAuth` | 在推理前最后一刻，将已配置凭证交换为实际运行时令牌 / 密钥 | 提供商需要令牌交换或短期请求凭证 |
| 39 | `resolveUsageAuth` | 为 `/usage` 及相关状态表面解析用量 / 计费凭证 | 提供商需要自定义用量 / 配额令牌解析，或需要不同的用量凭证 |
| 40 | `fetchUsageSnapshot` | 在认证解析完成后获取并规范化提供商专用的用量 / 配额快照 | 提供商需要提供商专用的用量端点或负载解析器 |
| 41 | `createEmbeddingProvider` | 为 memory / 搜索构建由提供商拥有的 embedding 适配器 | Memory embedding 行为应属于提供商插件 |
| 42 | `buildReplayPolicy` | 返回一个控制该提供商转录处理方式的重放策略 | 提供商需要自定义转录策略（例如去除 thinking 块） |
| 43 | `sanitizeReplayHistory` | 在通用转录清理后重写重放历史 | 提供商需要超出共享压缩辅助工具之外的提供商专用重放重写 |
| 44 | `validateReplayTurns` | 在嵌入式 runner 之前对重放轮次进行最终验证或重塑 | 提供商传输在通用净化后需要更严格的轮次验证 |
| 45 | `onModelSelected` | 在模型被选中后运行由提供商拥有的副作用 | 当模型变为激活状态时，提供商需要遥测或提供商自有状态 |

`normalizeModelId`、`normalizeTransport` 和 `normalizeConfig` 会先检查匹配到的提供商插件，然后继续回退到其他具备对应 hook 能力的提供商插件，直到某个插件实际修改了 model id 或 transport / config。这样可以让别名 / 兼容性提供商 shim 继续工作，而无需调用方知道哪个内置插件拥有该重写逻辑。如果没有任何提供商 hook 重写受支持的 Google 家族配置项，那么内置的 Google 配置规范化器仍会应用该兼容性清理。

如果提供商需要完全自定义的线协议或自定义请求执行器，那就是另一类扩展方式了。这里的这些 hooks 适用于仍运行在 OpenClaw 常规推理循环上的提供商行为。

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

内置的提供商插件会根据各供应商在目录、认证、思考、重放和用量跟踪方面的需求，以不同组合使用上述 hooks。每个提供商的精确 hook 集合都与插件源码一起位于 `extensions/` 下；应以那里为权威列表，而不是在此处镜像维护。

示例模式：

- **直通目录提供商**（OpenRouter、Kilocode、Z.AI、xAI）会注册 `catalog` 加 `resolveDynamicModel` / `prepareDynamicModel`，这样它们就可以在 OpenClaw 的静态目录之前暴露上游 model id。
- **OAuth + 用量端点提供商**（GitHub Copilot、Gemini CLI、ChatGPT Codex、MiniMax、Xiaomi、z.ai）会将 `prepareRuntimeAuth` 或 `formatApiKey` 与 `resolveUsageAuth` + `fetchUsageSnapshot` 配对使用，以拥有令牌交换和 `/usage` 集成。
- **重放 / 转录清理** 通过命名家族共享：`google-gemini`、`passthrough-gemini`、`anthropic-by-model`、`hybrid-anthropic-openai`。提供商通过 `buildReplayPolicy` 选择启用，而不是各自实现转录清理。
- **仅目录** 的内置提供商（`byteplus`、`cloudflare-ai-gateway`、`huggingface`、`kimi-coding`、`nvidia`、`qianfan`、`synthetic`、`together`、`venice`、`vercel-ai-gateway`、`volcengine`）只注册 `catalog`，并复用共享推理循环。
- **Anthropic 专用流辅助工具**（beta headers、`/fast` / `serviceTier`、`context1m`）位于 Anthropic 内置插件的公共 `api.ts` / `contract-api.ts` 接缝中（`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、`resolveAnthropicFastMode`、`resolveAnthropicServiceTier`），而不在通用 SDK 中。

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

- `textToSpeech` 返回用于文件 / 语音笔记表面的标准核心 TTS 输出负载。
- 它使用核心 `messages.tts` 配置和提供商选择。
- 返回 PCM 音频缓冲区 + 采样率。插件必须为各提供商自行重采样 / 编码。
- `listVoices` 对每个提供商来说是可选的。可将其用于供应商自有语音选择器或设置流程。
- 语音列表可以包含更丰富的元数据，例如区域设置、性别和 personality 标签，以供提供商感知型选择器使用。
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

- 将 TTS 策略、回退和回复交付保留在核心中。
- 将语音提供商用于供应商自有的合成行为。
- legacy Microsoft `edge` 输入会被规范化为 `microsoft` provider id。
- 首选的归属模型是面向公司的：随着 OpenClaw 增加这些能力契约，一个供应商插件可以同时拥有文本、语音、图像和未来的媒体提供商。

对于图像 / 音频 / 视频理解，插件会注册一个类型化的媒体理解提供商，而不是通用的键 / 值袋：

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
- 视频生成也已经遵循同样的模式：
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

对于音频转录，插件可以使用媒体理解运行时，或较旧的 STT 别名：

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
- 它使用核心媒体理解音频配置（`tools.media.audio`）和提供商回退顺序。
- 当没有产生转录输出时，会返回 `{ text: undefined }`（例如输入被跳过 / 不受支持）。
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

- `provider` 和 `model` 是按次运行覆盖项，而不是持久会话变更。
- OpenClaw 仅对受信任调用方认可这些覆盖字段。
- 对于插件拥有的回退运行，操作员必须通过 `plugins.entries.<id>.subagent.allowModelOverride: true` 明确启用。
- 使用 `plugins.entries.<id>.subagent.allowedModels` 可将受信任插件限制为特定规范 `provider/model` 目标，或显式设为 `"*"` 以允许任意目标。
- 不受信任的插件子智能体运行仍可工作，但覆盖请求会被拒绝，而不是静默回退。

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

插件也可以通过 `api.registerWebSearchProvider(...)` 注册 Web 搜索提供商。

说明：

- 将提供商选择、凭证解析和共享请求语义保留在核心中。
- 将 Web 搜索提供商用于供应商专用搜索传输。
- `api.runtime.webSearch.*` 是需要搜索行为但不依赖智能体工具包装器的功能 / 渠道插件的首选共享表面。

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
- `auth`：必填。使用 `"gateway"` 以要求常规 gateway 认证，或使用 `"plugin"` 进行插件管理的认证 / webhook 验证。
- `match`：可选。`"exact"`（默认）或 `"prefix"`。
- `replaceExisting`：可选。允许同一插件替换它自己现有的路由注册。
- `handler`：当路由处理了请求时返回 `true`。

说明：

- `api.registerHttpHandler(...)` 已被移除，并会导致插件加载错误。请改用 `api.registerHttpRoute(...)`。
- 插件路由必须显式声明 `auth`。
- 除非设置 `replaceExisting: true`，否则精确 `path + match` 冲突会被拒绝，而且一个插件不能替换另一个插件的路由。
- 不同 `auth` 级别的重叠路由会被拒绝。仅在相同 auth 级别上保留 `exact` / `prefix` 回退链。
- `auth: "plugin"` 路由**不会**自动接收操作员运行时作用域。它们用于插件管理的 webhook / 签名验证，而不是特权 Gateway 网关辅助调用。
- `auth: "gateway"` 路由会在 Gateway 网关请求运行时作用域内运行，但该作用域是有意保守的：
  - 共享密钥 bearer 认证（`gateway.auth.mode = "token"` / `"password"`）会将插件路由运行时作用域固定为 `operator.write`，即使调用方发送了 `x-openclaw-scopes` 也是如此
  - 受信任、带身份的 HTTP 模式（例如 `trusted-proxy`，或私有入口上的 `gateway.auth.mode = "none"`）只有在显式存在该头时才会认可 `x-openclaw-scopes`
  - 如果这些带身份的插件路由请求中缺少 `x-openclaw-scopes`，运行时作用域将回退为 `operator.write`
- 实际规则：不要假定 gateway-auth 插件路由天然就是隐式管理员表面。如果你的路由需要仅管理员可用的行为，请要求带身份的认证模式，并在文档中说明显式 `x-openclaw-scopes` 头契约。

## 插件 SDK 导入路径

在编写新插件时，请使用狭义 SDK 子路径，而不是整体式的 `openclaw/plugin-sdk` 根 barrel。核心子路径：

| 子路径 | 用途 |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry` | 插件注册原语 |
| `openclaw/plugin-sdk/core` | 通用共享的面向插件契约 |
| `openclaw/plugin-sdk/config-schema` | 根 `openclaw.json` Zod schema（`OpenClawSchema`） |

渠道插件可从一组狭义接缝中进行选择——`channel-setup`、`setup-runtime`、`setup-adapter-runtime`、`setup-tools`、`channel-pairing`、`channel-contract`、`channel-feedback`、`channel-inbound`、`channel-lifecycle`、`channel-reply-pipeline`、`command-auth`、`secret-input`、`webhook-ingress`、`channel-targets` 和 `channel-actions`。审批行为应统一收敛到一个 `approvalCapability` 契约，而不是混杂在无关的插件字段之间。参见[渠道插件](/zh-CN/plugins/sdk-channel-plugins)。

运行时和配置辅助工具位于对应的 `*-runtime` 子路径下（`approval-runtime`、`config-runtime`、`infra-runtime`、`agent-runtime`、`lazy-runtime`、`directory-runtime`、`text-runtime`、`runtime-store` 等）。

<Info>
`openclaw/plugin-sdk/channel-runtime` 已弃用——它是为旧插件保留的兼容性 shim。新代码应改为导入更狭义的通用原语。
</Info>

仓库内部入口点（每个内置插件包根目录）：

- `index.js` —— 内置插件入口
- `api.js` —— 辅助工具 / 类型 barrel
- `runtime-api.js` —— 仅运行时 barrel
- `setup-entry.js` —— setup 插件入口

外部插件应仅导入 `openclaw/plugin-sdk/*` 子路径。绝不要从核心或其他插件中导入另一个插件包的 `src/*`。由 facade 加载的入口点会优先使用当前激活的运行时配置快照；如果不存在，则回退到磁盘上已解析的配置文件。

诸如 `image-generation`、`media-understanding` 和 `speech` 这样的能力专用子路径之所以存在，是因为当前的内置插件正在使用它们。它们并不自动等同于长期冻结的外部契约——依赖它们时，请查阅对应的 SDK 参考页面。

## 消息工具 schema

对于反应、已读和投票等非消息原语，插件应拥有渠道专用的 `describeMessageTool(...)` schema 贡献。共享发送呈现应使用通用 `MessagePresentation` 契约，而不是提供商原生的按钮、组件、区块或卡片字段。
关于该契约、回退规则、提供商映射和插件作者清单，请参阅[消息呈现](/zh-CN/plugins/message-presentation)。

具备发送能力的插件通过消息能力声明自己能渲染的内容：

- `presentation`，用于语义化呈现区块（`text`、`context`、`divider`、`buttons`、`select`）
- `delivery-pin`，用于固定投递请求

核心决定是原生渲染该呈现，还是将其降级为文本。不要从通用 message 工具暴露提供商原生 UI 逃生口。
面向 legacy 原生 schema 的已弃用 SDK 辅助工具仍然会为现有第三方插件保留导出，但新插件不应使用它们。

## 渠道目标解析

渠道插件应拥有渠道专用的目标语义。保持共享 outbound host 的通用性，并使用消息适配器表面处理提供商规则：

- `messaging.inferTargetChatType({ to })` 决定某个规范化目标在目录查找前应被视为 `direct`、`group` 还是 `channel`
- `messaging.targetResolver.looksLikeId(raw, normalized)` 告诉核心某个输入是否应跳过目录搜索，直接进入类 id 解析
- `messaging.targetResolver.resolveTarget(...)` 是插件回退路径，用于在规范化之后或目录未命中之后，由核心进行最终的提供商自有解析
- `messaging.resolveOutboundSessionRoute(...)` 在目标解析完成后拥有提供商专用的会话路由构造逻辑

推荐拆分：

- 对于应在搜索 peers / groups 之前发生的类别判定，使用 `inferTargetChatType`
- 对于“将其视为显式 / 原生目标 id”的判断，使用 `looksLikeId`
- 对于提供商专用的规范化回退，使用 `resolveTarget`，而不是用于广义目录搜索
- 将提供商原生 id，例如 chat id、thread id、JID、handle 和 room id，保留在 `target` 值或提供商专用参数中，而不要放进通用 SDK 字段

## 基于配置的目录

对于从配置派生目录条目的插件，应将该逻辑保留在插件内部，并复用 `openclaw/plugin-sdk/directory-runtime` 中的共享辅助工具。

当某个渠道需要基于配置的 peers / groups 时，可使用这种方式，例如：

- 基于 allowlist 的私信 peers
- 已配置的渠道 / 群组映射
- 按账户划分的静态目录回退

`directory-runtime` 中的共享辅助工具仅处理通用操作：

- 查询过滤
- 应用限制
- 去重 / 规范化辅助工具
- 构建 `ChannelDirectoryEntry[]`

渠道专用的账户检查和 id 规范化应保留在插件实现中。

## 提供商目录

提供商插件可以通过 `registerProvider({ catalog: { run(...) { ... } } })` 为推理定义模型目录。

`catalog.run(...)` 返回与 OpenClaw 写入 `models.providers` 相同的结构：

- `{ provider }`，表示一个提供商条目
- `{ providers }`，表示多个提供商条目

当插件拥有提供商专用的 model id、base URL 默认值或受认证门控的模型元数据时，请使用 `catalog`。

`catalog.order` 控制某个插件目录相对于 OpenClaw 内置隐式提供商的合并时机：

- `simple`：普通 API 密钥或基于环境变量的提供商
- `profile`：存在认证配置文件时出现的提供商
- `paired`：合成多个相关提供商条目的提供商
- `late`：最后一轮，在其他隐式提供商之后

后面的提供商在键冲突时会获胜，因此插件可以有意用相同 provider id 覆盖内置提供商条目。

兼容性：

- `discovery` 作为 legacy 别名仍然可用
- 如果同时注册了 `catalog` 和 `discovery`，OpenClaw 会使用 `catalog`

## 只读渠道检查

如果你的插件注册了一个渠道，除了 `resolveAccount(...)` 之外，还应优先实现 `plugin.config.inspectAccount(cfg, accountId)`。

原因：

- `resolveAccount(...)` 是运行时路径。它可以假设凭证已被完整实体化，并且在缺少必需 secret 时快速失败。
- 像 `openclaw status`、`openclaw status --all`、`openclaw channels status`、`openclaw channels resolve` 以及 doctor / 配置修复流程这样的只读命令路径，不应为了描述配置就必须实体化运行时凭证。

推荐的 `inspectAccount(...)` 行为：

- 仅返回描述性账户状态。
- 保留 `enabled` 和 `configured`。
- 在相关时包含凭证来源 / 状态字段，例如：
  - `tokenSource`、`tokenStatus`
  - `botTokenSource`、`botTokenStatus`
  - `appTokenSource`、`appTokenStatus`
  - `signingSecretSource`、`signingSecretStatus`
- 你不需要为了报告只读可用性而返回原始令牌值。返回 `tokenStatus: "available"`（以及匹配的来源字段）就足以满足 status 风格命令。
- 当某个凭证通过 SecretRef 配置，但在当前命令路径中不可用时，请使用 `configured_unavailable`。

这样可以让只读命令报告“已配置，但在此命令路径中不可用”，而不是崩溃或错误地将该账户报告为未配置。

## 包集合

插件目录可以包含带有 `openclaw.extensions` 的 `package.json`：

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

每个条目都会成为一个插件。如果该包集合列出了多个扩展，则插件 id 将变为 `name/<fileBase>`。

如果你的插件导入了 npm 依赖，请在该目录中安装它们，以便 `node_modules` 可用（`npm install` / `pnpm install`）。

安全护栏：每个 `openclaw.extensions` 条目在解析符号链接后都必须保留在插件目录内。任何逃逸出包目录的条目都会被拒绝。

安全说明：`openclaw plugins install` 会使用 `npm install --omit=dev --ignore-scripts` 安装插件依赖（无生命周期脚本、运行时不安装开发依赖）。请保持插件依赖树为“纯 JS / TS”，并避免需要 `postinstall` 构建的包。

可选：`openclaw.setupEntry` 可以指向一个轻量级、仅 setup 的模块。当 OpenClaw 需要为已禁用的渠道插件提供 setup 表面，或某个渠道插件已启用但尚未配置时，它会加载 `setupEntry`，而不是完整插件入口。这样当主插件入口还会接线工具、hooks 或其他仅运行时代码时，就能让启动和 setup 更轻量。

可选：`openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` 可让某个渠道插件在 Gateway 网关监听前的启动阶段，即使该渠道已配置，也采用同样的 `setupEntry` 路径。

只有当 `setupEntry` 完整覆盖了 gateway 开始监听前必须存在的启动表面时，才应使用此选项。实践中，这意味着 setup 入口必须注册启动所依赖的每一项渠道自有能力，例如：

- 渠道注册本身
- 任何必须在 gateway 开始监听前可用的 HTTP 路由
- 在同一时间窗口内必须存在的任何 gateway 方法、工具或服务

如果你的完整入口仍然拥有任何必需的启动能力，请不要启用此标志。保持插件采用默认行为，并让 OpenClaw 在启动期间加载完整入口。

内置渠道也可以发布仅 setup 的契约表面辅助工具，以便核心在完整渠道运行时加载之前进行查询。当前的 setup 提升表面包括：

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

当核心需要在不加载完整插件入口的情况下，将 legacy 单账户渠道配置提升到 `channels.<id>.accounts.*` 时，就会使用该表面。Matrix 是当前的内置示例：当已存在命名账户时，它只会将认证 / 引导键移动到一个命名的已提升账户中，并且可以保留已配置的非规范默认账户键，而不是总是创建 `accounts.default`。

这些 setup 补丁适配器使内置契约表面发现保持懒加载。导入时开销保持轻量；提升表面只会在首次使用时加载，而不会在模块导入时重新进入内置渠道启动流程。

当这些启动表面包含 gateway RPC 方法时，请将它们保留在插件专用前缀下。核心管理员命名空间（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）仍然是保留的，并且始终解析为 `operator.admin`，即使某个插件请求了更窄的作用域。

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

渠道插件可以通过 `openclaw.channel` 声明 setup / 发现元数据，并通过 `openclaw.install` 声明安装提示。这样可以让核心目录保持无数据耦合。

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
      "blurb": "通过 Nextcloud Talk webhook 机器人实现的自托管聊天。",
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

除最小示例外，有用的 `openclaw.channel` 字段还包括：

- `detailLabel`：用于更丰富目录 / 状态表面的次级标签
- `docsLabel`：覆盖文档链接的链接文本
- `preferOver`：此目录条目应优先于的低优先级插件 / 渠道 id
- `selectionDocsPrefix`、`selectionDocsOmitLabel`、`selectionExtras`：选择表面的文案控制项
- `markdownCapable`：将该渠道标记为支持 Markdown，以供出站格式化决策使用
- `exposure.configured`：设为 `false` 时，在“已配置渠道”列表表面中隐藏该渠道
- `exposure.setup`：设为 `false` 时，在交互式 setup / configure 选择器中隐藏该渠道
- `exposure.docs`：将该渠道标记为内部 / 私有，用于文档导航表面
- `showConfigured` / `showInSetup`：出于兼容性仍接受的 legacy 别名；优先使用 `exposure`
- `quickstartAllowFrom`：让该渠道接入标准快速开始 `allowFrom` 流程
- `forceAccountBinding`：即使只存在一个账户，也要求显式账户绑定
- `preferSessionLookupForAnnounceTarget`：在解析 announce 目标时优先使用会话查找

OpenClaw 还可以合并**外部渠道目录**（例如 MPM 注册表导出）。将 JSON 文件放到以下任一位置：

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

或者将 `OPENCLAW_PLUGIN_CATALOG_PATHS`（或 `OPENCLAW_MPM_CATALOG_PATHS`）指向一个或多个 JSON 文件（以逗号 / 分号 / `PATH` 分隔）。每个文件应包含 `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`。解析器还接受 `"packages"` 或 `"plugins"` 作为 `"entries"` 键的 legacy 别名。

## 上下文引擎插件

上下文引擎插件拥有会话上下文编排，包括摄取、组装和压缩。可在你的插件中通过 `api.registerContextEngine(id, factory)` 注册它们，然后使用 `plugins.slots.contextEngine` 选择活动引擎。

当你的插件需要替换或扩展默认上下文流水线，而不只是添加 memory 搜索或 hooks 时，请使用此方式。

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

如果你的引擎**不**拥有压缩算法，请保持 `compact()` 已实现，并显式委托它：

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

当插件需要当前 API 无法满足的行为时，不要通过私有内部访问绕过插件系统。请添加缺失的能力。

推荐顺序：

1. 定义核心契约  
   决定核心应拥有哪些共享行为：策略、回退、配置合并、生命周期、面向渠道的语义以及运行时辅助工具结构。
2. 添加类型化的插件注册 / 运行时表面  
   以最小但有用的类型化能力表面扩展 `OpenClawPluginApi` 和 / 或 `api.runtime`。
3. 对接核心 + 渠道 / 功能消费者  
   渠道和功能插件应通过核心消费新能力，而不是直接导入某个供应商实现。
4. 注册供应商实现  
   然后由供应商插件针对该能力注册其后端实现。
5. 添加契约覆盖  
   添加测试，使归属和注册结构随着时间推移仍保持明确。

这就是 OpenClaw 保持鲜明主张、又不会被某个供应商世界观硬编码绑死的方式。关于具体的文件清单和完整示例，请参阅[能力扩展手册](/zh-CN/plugins/architecture)。

### 能力清单

当你添加一个新能力时，实现通常应同时涉及以下表面：

- `src/<capability>/types.ts` 中的核心契约类型
- `src/<capability>/runtime.ts` 中的核心 runner / 运行时辅助工具
- `src/plugins/types.ts` 中的插件 API 注册表面
- `src/plugins/registry.ts` 中的插件注册表接线
- 当功能 / 渠道插件需要消费它时，`src/plugins/runtime/*` 中的插件运行时暴露
- `src/test-utils/plugin-registration.ts` 中的捕获 / 测试辅助工具
- `src/plugins/contracts/registry.ts` 中的归属 / 契约断言
- `docs/` 中面向操作员 / 插件的文档

如果其中某个表面缺失，通常说明这个能力还没有完全集成。

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
- 契约测试让归属保持明确
