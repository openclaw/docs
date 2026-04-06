---
read_when:
    - 构建或调试原生 OpenClaw 插件
    - 了解插件能力模型或归属边界
    - 处理插件加载流水线或注册表
    - 实现提供商运行时钩子或渠道插件
sidebarTitle: Internals
summary: 插件内部机制：能力模型、归属、契约、加载流水线和运行时辅助工具
title: 插件内部机制
x-i18n:
    generated_at: "2026-04-06T12:45:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: b2f7f48bd5599b9897aa851fb25d501d9643d76f66084f5867b3866fec91cef6
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
  - [SDK 概览](/zh-CN/plugins/sdk-overview) — 导入映射和注册 API
</Info>

本页介绍 OpenClaw 插件系统的内部架构。

## 公开能力模型

能力是 OpenClaw 内部公开的**原生插件**模型。每个原生 OpenClaw 插件都会针对一个或多个能力类型进行注册：

| 能力                 | 注册方式                                         | 示例插件                             |
| -------------------- | ------------------------------------------------ | ------------------------------------ |
| 文本推理             | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| CLI 推理后端         | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| 语音                 | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| 实时转写             | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| 实时语音             | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| 媒体理解             | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| 图像生成             | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| 音乐生成             | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| 视频生成             | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Web 抓取             | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Web 搜索             | `api.registerWebSearchProvider(...)`             | `google`                             |
| 渠道 / 消息传递      | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |

一个注册了零个能力、但提供钩子、工具或服务的插件，被称为**仅旧版 hook** 插件。这种模式仍然得到完整支持。

### 外部兼容性立场

能力模型已经落地到 core 中，并且当前已用于内置 / 原生插件，但外部插件兼容性仍需要比“它已导出，因此已冻结”更严格的标准。

当前指导如下：

- **现有外部插件：** 保持基于 hook 的集成可用；将其视为兼容性的基准线
- **新的内置 / 原生插件：** 优先使用显式能力注册，而不是特定厂商的直接深入访问或新的仅 hook 设计
- **采用能力注册的外部插件：** 可以这样做，但在文档未明确将某个契约标记为稳定前，应将能力专用辅助工具接口视为仍在演进中

实用规则：

- 能力注册 API 是预期的发展方向
- 在过渡期间，旧版 hooks 仍然是外部插件最安全、最不易破坏的路径
- 并非所有已导出的辅助工具子路径都同等稳定；优先使用文档记录的精简契约，而不是顺带暴露的辅助导出

### 插件形态

OpenClaw 会根据每个已加载插件的实际注册行为（而不仅是静态元数据）将其分类为以下形态之一：

- **plain-capability** -- 只注册一种能力类型（例如像 `mistral` 这样的仅提供商插件）
- **hybrid-capability** -- 注册多种能力类型（例如 `openai` 同时拥有文本推理、语音、媒体理解和图像生成）
- **hook-only** -- 仅注册 hooks（类型化或自定义），没有能力、工具、命令或服务
- **non-capability** -- 注册工具、命令、服务或路由，但不注册任何能力

使用 `openclaw plugins inspect <id>` 可查看插件的形态和能力拆分。详见 [CLI 参考](/cli/plugins#inspect)。

### 旧版 hooks

`before_agent_start` hook 仍作为仅 hook 插件的兼容路径继续受支持。现实中仍有旧版插件依赖它。

方向如下：

- 保持它可用
- 将其文档标记为旧版
- 对模型 / 提供商覆盖工作，优先使用 `before_model_resolve`
- 对提示词变更工作，优先使用 `before_prompt_build`
- 只有在真实使用量下降，并且 fixture 覆盖证明迁移安全后，才考虑移除

### 兼容性信号

当你运行 `openclaw doctor` 或 `openclaw plugins inspect <id>` 时，可能会看到以下标签之一：

| 信号                     | 含义                                                       |
| ------------------------ | ---------------------------------------------------------- |
| **config valid**         | 配置解析正常，插件可成功解析                               |
| **compatibility advisory** | 插件使用受支持但较旧的模式（例如 `hook-only`）           |
| **legacy warning**       | 插件使用了 `before_agent_start`，该用法已弃用              |
| **hard error**           | 配置无效或插件加载失败                                     |

`hook-only` 和 `before_agent_start` 目前都不会导致你的插件中断——`hook-only` 只是提示性信息，而 `before_agent_start` 只会触发警告。这些信号也会显示在 `openclaw status --all` 和 `openclaw plugins doctor` 中。

## 架构概览

OpenClaw 的插件系统有四层：

1. **清单 + 发现**
   OpenClaw 会从配置路径、工作区根目录、全局扩展根目录以及内置扩展中查找候选插件。发现过程会先读取原生 `openclaw.plugin.json` 清单以及受支持的 bundle 清单。
2. **启用 + 校验**
   core 会决定某个已发现插件是启用、禁用、阻止，还是被选中用于某个独占槽位（例如 memory）。
3. **运行时加载**
   原生 OpenClaw 插件会通过 jiti 在进程内加载，并将能力注册到中央注册表中。兼容 bundle 会被规范化为注册表记录，而无需导入运行时代码。
4. **接口消费**
   OpenClaw 的其余部分会读取注册表，以暴露工具、渠道、提供商设置、hooks、HTTP 路由、CLI 命令和服务。

对于插件 CLI 而言，根命令发现被拆分为两个阶段：

- 解析阶段元数据来自 `registerCli(..., { descriptors: [...] })`
- 真正的插件 CLI 模块可以保持惰性加载，并在首次调用时注册

这样既能让插件自有的 CLI 代码留在插件内部，又能让 OpenClaw 在解析前预留根命令名称。

重要的设计边界：

- 发现 + 配置校验应当基于**清单 / schema 元数据**完成，而无需执行插件代码
- 原生运行时行为来自插件模块的 `register(api)` 路径

这种分离让 OpenClaw 能在完整运行时尚未激活前，就校验配置、解释缺失 / 禁用插件，并构建 UI / schema 提示。

### 渠道插件与共享消息工具

对于常规聊天操作，渠道插件不需要单独注册发送 / 编辑 / 响应工具。OpenClaw 在 core 中保留一个共享的 `message` 工具，而渠道插件负责其背后的渠道专属发现和执行。

当前边界如下：

- core 负责共享 `message` 工具宿主、提示词接线、会话 / 线程记录，以及执行分发
- 渠道插件负责作用域操作发现、能力发现，以及任何渠道专属 schema 片段
- 渠道插件负责提供商专属的会话会话语法，例如会话 id 如何编码线程 id，或如何从父会话继承
- 渠道插件通过其 action adapter 执行最终操作

对于渠道插件，SDK 接口为 `ChannelMessageActionAdapter.describeMessageTool(...)`。这个统一发现调用让插件可以将其可见操作、能力和 schema 扩展一起返回，从而避免这些部分彼此漂移。

core 会在发现步骤中传入运行时作用域。重要字段包括：

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 受信任入站 `requesterSenderId`

这对于上下文敏感型插件很重要。渠道可以基于当前账户、当前房间 / 线程 / 消息，或受信任的请求方身份，来隐藏或暴露消息操作，而不需要在 core `message` 工具中硬编码渠道专属分支。

这也是为什么嵌入式 runner 路由变更仍然属于插件工作：runner 负责将当前聊天 / 会话身份转发到插件发现边界，使共享 `message` 工具在当前轮次暴露正确的渠道自有接口。

对于渠道自有的执行辅助工具，内置插件应将执行运行时保留在它们自己的扩展模块中。core 不再拥有位于 `src/agents/tools` 下的 Discord、Slack、Telegram 或 WhatsApp 消息操作运行时。我们不会发布单独的 `plugin-sdk/*-action-runtime` 子路径，内置插件应直接从其扩展自有模块导入本地运行时代码。

同样的边界也适用于一般意义上的提供商命名 SDK 接缝：core 不应导入面向 Slack、Discord、Signal、WhatsApp 或类似扩展的渠道专用便捷 barrel。如果 core 需要某种行为，要么消费内置插件自己的 `api.ts` / `runtime-api.ts` barrel，要么将该需求提升为共享 SDK 中一个精简的通用能力。

对于投票，当前有两条执行路径：

- `outbound.sendPoll` 是适用于符合通用投票模型的渠道的共享基线
- `actions.handleAction("poll")` 是渠道专属投票语义或额外投票参数的首选路径

现在，core 会先尝试插件投票分发，只有在插件拒绝处理该操作后，才会回退到共享投票解析。这使插件自有的投票处理器能够接受渠道专属投票字段，而不会先被通用投票解析器阻挡。

完整启动顺序请参阅[加载流水线](#load-pipeline)。

## 能力归属模型

OpenClaw 将原生插件视为某个**公司**或某个**功能**的归属边界，而不是一堆无关集成的杂项集合。

这意味着：

- 一个公司插件通常应拥有该公司的所有 OpenClaw 面向接口
- 一个功能插件通常应拥有其引入的完整功能接口
- 渠道应消费共享 core 能力，而不是临时重复实现提供商行为

示例：

- 内置 `openai` 插件拥有 OpenAI 模型提供商行为，以及 OpenAI 的语音 + 实时语音 + 媒体理解 + 图像生成行为
- 内置 `elevenlabs` 插件拥有 ElevenLabs 语音行为
- 内置 `microsoft` 插件拥有 Microsoft 语音行为
- 内置 `google` 插件拥有 Google 模型提供商行为，以及 Google 的媒体理解 + 图像生成 + Web 搜索行为
- 内置 `firecrawl` 插件拥有 Firecrawl Web 抓取行为
- 内置 `minimax`、`mistral`、`moonshot` 和 `zai` 插件拥有它们各自的媒体理解后端
- 内置 `qwen` 插件拥有 Qwen 文本提供商行为，以及媒体理解和视频生成行为
- `voice-call` 插件是一个功能插件：它拥有呼叫传输、工具、CLI、路由和 Twilio 媒体流桥接，但它消费共享的语音以及实时转写和实时语音能力，而不是直接导入厂商插件

预期的最终状态是：

- 即使 OpenAI 同时覆盖文本模型、语音、图像和未来的视频，它也只存在于一个插件中
- 其他厂商也可以为自己的接口范围采用同样方式
- 渠道不需要关心哪个厂商插件拥有该提供商；它们只消费 core 暴露的共享能力契约

这是关键区别：

- **plugin** = 归属边界
- **capability** = 多个插件都可以实现或消费的 core 契约

因此，如果 OpenClaw 新增一个如视频这样的领域，第一个问题不应该是“哪个提供商应硬编码视频处理？”而应该是“core 的视频能力契约是什么？”一旦该契约存在，厂商插件就可以针对它进行注册，渠道 / 功能插件也可以消费它。

如果该能力尚不存在，通常正确的做法是：

1. 在 core 中定义缺失的能力
2. 通过插件 API / 运行时以类型化方式暴露它
3. 让渠道 / 功能围绕该能力接线
4. 允许厂商插件注册实现

这样可以在保持明确归属的同时，避免 core 行为依赖某个单一厂商或某条一次性的插件专用代码路径。

### 能力分层

在决定代码归属位置时，请使用以下思维模型：

- **core 能力层**：共享编排、策略、回退、配置合并规则、传递语义和类型化契约
- **厂商插件层**：厂商专属 API、认证、模型目录、语音合成、图像生成、未来的视频后端、用量端点
- **渠道 / 功能插件层**：Slack / Discord / voice-call 等集成，它们消费 core 能力并在某个接口上呈现出来

例如，TTS 采用以下形态：

- core 拥有回复时 TTS 策略、回退顺序、偏好和渠道传递
- `openai`、`elevenlabs` 和 `microsoft` 拥有合成实现
- `voice-call` 消费电话场景的 TTS 运行时辅助工具

未来的能力也应优先遵循相同模式。

### 多能力公司插件示例

一个公司插件从外部看应当是内聚的。如果 OpenClaw 对模型、语音、实时转写、实时语音、媒体理解、图像生成、视频生成、Web 抓取和 Web 搜索都有共享契约，那么某个厂商就可以在一个地方拥有其全部接口：

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

关键不在于精确的辅助工具名称，而在于其结构：

- 一个插件拥有该厂商接口
- core 仍然拥有能力契约
- 渠道和功能插件消费 `api.runtime.*` 辅助工具，而不是厂商代码
- 契约测试可以断言插件注册了它声称拥有的能力

### 能力示例：视频理解

OpenClaw 已将图像 / 音频 / 视频理解视为一种共享能力。同样的归属模型也适用于这里：

1. core 定义媒体理解契约
2. 厂商插件按需注册 `describeImage`、`transcribeAudio` 和 `describeVideo`
3. 渠道和功能插件消费共享 core 行为，而不是直接接线到厂商代码

这样可以避免把某个提供商对视频的假设固化进 core。插件拥有厂商接口；core 拥有能力契约和回退行为。

视频生成已经使用同样的顺序：core 拥有类型化能力契约和运行时辅助工具，厂商插件针对其注册 `api.registerVideoGenerationProvider(...)` 实现。

需要一个具体的发布清单？请参阅[能力扩展手册](/zh-CN/plugins/architecture)。

## 契约与约束执行

插件 API 接口被有意设计为类型化并集中在 `OpenClawPluginApi` 中。该契约定义了受支持的注册点，以及插件可以依赖的运行时辅助工具。

这很重要，因为：

- 插件作者获得一个稳定的内部标准
- core 可以拒绝重复归属，例如两个插件注册同一个 provider id
- 启动时可以为格式错误的注册提供可执行的诊断信息
- 契约测试可以约束内置插件归属并防止静默漂移

存在两层约束执行：

1. **运行时注册约束**
   插件注册表会在插件加载时校验注册。例如：重复的 provider id、重复的 speech provider id，以及格式错误的注册，都会产生插件诊断，而不是未定义行为。
2. **契约测试**
   在测试运行期间，内置插件会被捕获到契约注册表中，以便 OpenClaw 显式断言归属。当前这被用于模型提供商、语音提供商、Web 搜索提供商和内置注册归属。

实际效果是，OpenClaw 可以预先知道哪个插件拥有哪个接口。这使得 core 和渠道能够无缝组合，因为归属是声明式、类型化且可测试的，而不是隐式的。

### 哪些内容应属于契约

好的插件契约应当是：

- 类型化的
- 精简的
- 能力专用的
- 由 core 拥有
- 可被多个插件复用
- 可被渠道 / 功能消费，而无需了解厂商细节

不好的插件契约包括：

- 隐藏在 core 中的厂商专属策略
- 绕过注册表的一次性插件逃生口
- 渠道代码直接深入某个厂商实现
- 不属于 `OpenClawPluginApi` 或 `api.runtime` 的临时运行时对象

如果有疑问，请提升抽象层级：先定义能力，再让插件接入。

## 执行模型

原生 OpenClaw 插件会与 Gateway 网关**在同一进程内**运行。它们**不**在沙箱中运行。一个已加载的原生插件与 core 代码具有相同的进程级信任边界。

影响如下：

- 原生插件可以注册工具、网络处理器、hooks 和服务
- 原生插件中的 bug 可能导致 gateway 崩溃或不稳定
- 恶意原生插件等同于在 OpenClaw 进程内执行任意代码

兼容 bundle 默认更安全，因为 OpenClaw 当前将其视为元数据 / 内容包。在当前版本中，这主要意味着内置 Skills。

对于非内置插件，请使用 allowlist 和显式安装 / 加载路径。应将工作区插件视为开发时代码，而不是生产默认项。

对于内置工作区包名，请确保插件 id 锚定在 npm 名称中：默认使用 `@openclaw/<id>`，或使用经批准的类型后缀，如 `-provider`、`-plugin`、`-speech`、`-sandbox` 或 `-media-understanding`，前提是该包刻意暴露更窄的插件角色。

重要信任说明：

- `plugins.allow` 信任的是**插件 id**，而不是来源出处。
- 如果某个工作区插件与一个内置插件拥有相同 id，并且该工作区插件被启用 / 加入 allowlist，它会有意遮蔽内置副本。
- 这属于正常且有用的行为，适用于本地开发、补丁测试和热修复。

## 导出边界

OpenClaw 导出的是能力，而不是实现层面的便捷接口。

请保持能力注册为公开接口，同时收紧非契约辅助工具导出：

- 内置插件专用辅助工具子路径
- 不打算作为公开 API 的运行时管线子路径
- 厂商专用便捷辅助工具
- 属于实现细节的设置 / 新手引导辅助工具

出于兼容性和内置插件维护需要，一些内置插件辅助工具子路径仍保留在生成的 SDK 导出映射中。当前示例包括 `plugin-sdk/feishu`、`plugin-sdk/feishu-setup`、`plugin-sdk/zalo`、`plugin-sdk/zalo-setup` 以及若干 `plugin-sdk/matrix*` 接缝。应将这些视为保留的实现细节导出，而不是新第三方插件推荐采用的 SDK 模式。

## 加载流水线

在启动时，OpenClaw 大致会执行以下步骤：

1. 发现候选插件根目录
2. 读取原生或兼容 bundle 的清单及包元数据
3. 拒绝不安全候选项
4. 规范化插件配置（`plugins.enabled`、`allow`、`deny`、`entries`、`slots`、`load.paths`）
5. 决定每个候选项的启用状态
6. 通过 jiti 加载已启用的原生模块
7. 调用原生 `register(api)`（或 `activate(api)` —— 旧版别名）hooks，并将注册收集到插件注册表中
8. 向命令 / 运行时接口暴露注册表

<Note>
`activate` 是 `register` 的旧版别名——加载器会解析存在的那个（`def.register ?? def.activate`），并在相同位置调用它。所有内置插件都使用 `register`；新插件请优先使用 `register`。
</Note>

安全门禁发生在**运行时执行之前**。当入口逃逸出插件根目录、路径对所有人可写，或者对于非内置插件来说路径所有权看起来可疑时，候选项会被阻止。

### 清单优先行为

清单是控制平面的事实来源。OpenClaw 用它来：

- 标识插件
- 发现已声明的渠道 / Skills / 配置 schema 或 bundle 能力
- 校验 `plugins.entries.<id>.config`
- 补充 Control UI 标签 / 占位文本
- 显示安装 / 目录元数据

对于原生插件，运行时模块是数据平面部分。它会注册实际行为，例如 hooks、工具、命令或提供商流程。

### 加载器会缓存什么

OpenClaw 会保留以下短生命周期的进程内缓存：

- 发现结果
- 清单注册表数据
- 已加载的插件注册表

这些缓存可减少突发启动和重复命令的开销。可以将它们视为短期性能缓存，而不是持久化机制。

性能说明：

- 设置 `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` 或 `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` 可禁用这些缓存。
- 使用 `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` 和 `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` 调整缓存窗口。

## 注册表模型

已加载的插件不会直接修改任意 core 全局状态。它们会注册到一个中央插件注册表中。

注册表会跟踪：

- 插件记录（身份、来源、起源、状态、诊断）
- 工具
- 旧版 hooks 和类型化 hooks
- 渠道
- 提供商
- Gateway RPC 处理器
- HTTP 路由
- CLI 注册器
- 后台服务
- 插件自有命令

随后，core 功能会从该注册表读取内容，而不是直接与插件模块通信。这样可保持加载为单向流：

- 插件模块 -> 注册表注册
- core 运行时 -> 注册表消费

这种分离对可维护性很重要。它意味着大多数 core 接口只需要一个集成点：“读取注册表”，而不是“为每个插件模块单独特判”。

## 会话绑定回调

绑定会话的插件可以在批准被解决后做出反应。

使用 `api.onConversationBindingResolved(...)`，可在绑定请求获批或被拒后收到回调：

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
- `binding`：针对已批准请求的已解析绑定
- `request`：原始请求摘要、分离提示、发送者 id 和会话元数据

该回调仅用于通知。它不会改变谁被允许绑定会话，并且它会在 core 审批处理完成后运行。

## 提供商运行时 hooks

提供商插件现在有两层：

- 清单元数据：`providerAuthEnvVars` 用于在运行时加载前进行廉价的环境变量认证查找，`providerAuthChoices` 用于在运行时加载前提供廉价的新手引导 / 认证选项标签和 CLI flag 元数据
- 配置时 hooks：`catalog` / 旧版 `discovery`，以及 `applyConfigDefaults`
- 运行时 hooks：`normalizeModelId`、`normalizeTransport`、`normalizeConfig`、
  `applyNativeStreamingUsageCompat`、`resolveConfigApiKey`、
  `resolveSyntheticAuth`、`resolveExternalOAuthProfiles`、
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

OpenClaw 仍然拥有通用智能体循环、故障切换、转录处理和工具策略。这些 hooks 是提供商专属行为的扩展接口，而无需实现完整的自定义推理传输层。

当提供商有基于环境变量的凭据，并且通用认证 / 状态 / 模型选择器路径需要在不加载插件运行时的情况下看到它们时，请使用清单中的 `providerAuthEnvVars`。当新手引导 / 认证选项 CLI 接口需要在不加载提供商运行时的情况下知道该提供商的 choice id、分组标签和简单单 flag 认证接线时，请使用清单中的 `providerAuthChoices`。而提供商运行时中的 `envVars` 则应保留给面向运维者的提示，例如新手引导标签或 OAuth client id / client secret 设置变量。

### Hook 顺序与使用方式

对于模型 / 提供商插件，OpenClaw 大致按以下顺序调用 hooks。
“何时使用”列是快速决策指南。

| #   | Hook                              | 作用                                                                                             | 何时使用                                                                                                                                     |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | 在生成 `models.json` 时将提供商配置发布到 `models.providers`                                     | 提供商拥有目录或 base URL 默认值                                                                                                             |
| 2   | `applyConfigDefaults`             | 在配置实体化期间应用提供商自有的全局配置默认值                                                   | 默认值依赖认证模式、环境或提供商模型家族语义                                                                                                 |
| --  | _(built-in model lookup)_         | OpenClaw 会先尝试正常的注册表 / 目录路径                                                         | _(不是插件 hook)_                                                                                                                           |
| 3   | `normalizeModelId`                | 在查找前规范化旧版或预览 model id 别名                                                           | 提供商拥有规范模型解析前的别名清理逻辑                                                                                                       |
| 4   | `normalizeTransport`              | 在通用模型组装前规范化提供商家族的 `api` / `baseUrl`                                             | 提供商拥有同一传输家族中自定义提供商 id 的传输清理逻辑                                                                                        |
| 5   | `normalizeConfig`                 | 在运行时 / 提供商解析前规范化 `models.providers.<id>`                                            | 提供商需要将配置清理逻辑放在插件内；内置 Google 家族辅助工具也会为受支持的 Google 配置项提供兜底规范化                                       |
| 6   | `applyNativeStreamingUsageCompat` | 对配置提供商应用原生流式用量兼容性重写                                                           | 提供商需要针对端点驱动的原生流式用量元数据修复                                                                                               |
| 7   | `resolveConfigApiKey`             | 在加载运行时认证前，为配置提供商解析环境标记认证                                                 | 提供商拥有自己的环境标记 API key 解析逻辑；`amazon-bedrock` 也在这里内置了 AWS 环境标记解析器                                               |
| 8   | `resolveSyntheticAuth`            | 在不持久化明文的前提下暴露本地 / 自托管或基于配置的认证                                          | 提供商可使用 synthetic / 本地凭据标记运行                                                                                                   |
| 9   | `resolveExternalOAuthProfiles`    | 覆盖外部 OAuth 配置文件；默认 `persistence` 为 `runtime-only`，适用于 CLI / 应用自有凭据         | 提供商复用外部 OAuth 凭据，而不持久化复制的 refresh token                                                                                   |
| 10  | `shouldDeferSyntheticProfileAuth` | 在 env / 配置驱动认证之后降低已存储 synthetic profile 占位项的优先级                              | 提供商存储了 synthetic 占位 profile，且不应让它们优先生效                                                                                    |
| 11  | `resolveDynamicModel`             | 为尚未存在于本地注册表中的提供商自有 model id 提供同步回退                                       | 提供商接受任意上游 model id                                                                                                                 |
| 12  | `prepareDynamicModel`             | 先进行异步预热，然后再次运行 `resolveDynamicModel`                                                | 提供商在解析未知 id 前需要网络元数据                                                                                                         |
| 13  | `normalizeResolvedModel`          | 在嵌入式 runner 使用已解析模型前进行最终重写                                                     | 提供商需要传输重写，但仍使用 core 传输                                                                                                       |
| 14  | `contributeResolvedModelCompat`   | 为另一个兼容传输下的厂商模型贡献兼容标记                                                         | 提供商能在代理传输上识别自己的模型，而不接管该提供商                                                                                        |
| 15  | `capabilities`                    | 由共享 core 逻辑使用的提供商自有转录 / 工具元数据                                                | 提供商需要转录 / 提供商家族特有行为                                                                                                         |
| 16  | `normalizeToolSchemas`            | 在嵌入式 runner 看到工具 schema 之前进行规范化                                                   | 提供商需要传输家族级别的 schema 清理                                                                                                        |
| 17  | `inspectToolSchemas`              | 在规范化后暴露提供商自有 schema 诊断                                                             | 提供商希望给出关键字警告，而不把提供商专用规则教给 core                                                                                      |
| 18  | `resolveReasoningOutputMode`      | 选择原生或带标签的推理输出契约                                                                   | 提供商需要使用带标签的 reasoning / final output，而不是原生字段                                                                              |
| 19  | `prepareExtraParams`              | 在通用流式选项包装器前做请求参数规范化                                                           | 提供商需要默认请求参数或每提供商参数清理                                                                                                     |
| 20  | `createStreamFn`                  | 用自定义传输完全替换正常流路径                                                                   | 提供商需要自定义线路协议，而不仅仅是包装器                                                                                                   |
| 21  | `wrapStreamFn`                    | 在应用通用包装器后进一步包装流函数                                                               | 提供商需要请求头 / 请求体 / 模型兼容包装，而不是自定义传输                                                                                   |
| 22  | `resolveTransportTurnState`       | 附加原生的逐轮传输头或元数据                                                                     | 提供商希望通用传输发送提供商原生的轮次身份                                                                                                   |
| 23  | `resolveWebSocketSessionPolicy`   | 附加原生 WebSocket 头或会话冷却策略                                                              | 提供商希望通用 WS 传输调整会话头或回退策略                                                                                                   |
| 24  | `formatApiKey`                    | 认证 profile 格式化器：将已存储 profile 转为运行时 `apiKey` 字符串                               | 提供商存储额外认证元数据，并需要自定义运行时 token 形态                                                                                      |
| 25  | `refreshOAuth`                    | 为自定义刷新端点或刷新失败策略覆盖 OAuth 刷新逻辑                                                | 提供商不适配共享的 `pi-ai` 刷新器                                                                                                            |
| 26  | `buildAuthDoctorHint`             | 当 OAuth 刷新失败时附加修复提示                                                                  | 提供商需要在刷新失败后提供自有认证修复指导                                                                                                   |
| 27  | `matchesContextOverflowError`     | 提供商自有的上下文窗口溢出匹配器                                                                 | 提供商具有通用启发式无法识别的原始溢出错误                                                                                                   |
| 28  | `classifyFailoverReason`          | 提供商自有的故障切换原因分类                                                                     | 提供商可以将原始 API / 传输错误映射为限流 / 过载等                                                                                           |
| 29  | `isCacheTtlEligible`              | 面向代理 / 回传提供商的提示词缓存策略                                                            | 提供商需要代理专用的缓存 TTL 门控                                                                                                           |
| 30  | `buildMissingAuthMessage`         | 替换通用缺失认证恢复消息                                                                         | 提供商需要提供商专属的缺失认证恢复提示                                                                                                       |
| 31  | `suppressBuiltInModel`            | 抑制陈旧上游模型，并可选返回面向用户的错误提示                                                   | 提供商需要隐藏陈旧的上游条目，或用厂商提示替换它们                                                                                           |
| 32  | `augmentModelCatalog`             | 在发现后附加 synthetic / 最终目录条目                                                            | 提供商需要在 `models list` 和选择器中加入 synthetic 的前向兼容条目                                                                          |
| 33  | `isBinaryThinking`                | 面向二值 thinking 提供商的开 / 关推理开关                                                        | 提供商只暴露二值 thinking 开 / 关                                                                                                           |
| 34  | `supportsXHighThinking`           | 为选定模型提供 `xhigh` 推理支持                                                                  | 提供商只想对部分模型启用 `xhigh`                                                                                                            |
| 35  | `resolveDefaultThinkingLevel`     | 为特定模型家族确定默认 `/think` 级别                                                             | 提供商拥有某模型家族的默认 `/think` 策略                                                                                                     |
| 36  | `isModernModelRef`                | 面向 live profile 过滤器和 smoke 选择的 modern model 匹配器                                      | 提供商拥有 live / smoke 首选模型匹配逻辑                                                                                                     |
| 37  | `prepareRuntimeAuth`              | 在推理前立即将已配置凭据交换为实际运行时 token / key                                             | 提供商需要 token 交换或短期请求凭据                                                                                                         |
| 38  | `resolveUsageAuth`                | 为 `/usage` 及相关状态接口解析用量 / 计费凭据                                                    | 提供商需要自定义的用量 / 配额 token 解析，或不同的用量凭据                                                                                   |
| 39  | `fetchUsageSnapshot`              | 在认证解析后抓取并规范化提供商专属用量 / 配额快照                                                | 提供商需要提供商专属的用量端点或负载解析器                                                                                                   |
| 40  | `createEmbeddingProvider`         | 为 memory / 搜索构建提供商自有的 embedding adapter                                               | memory embedding 行为应归属于提供商插件                                                                                                     |
| 41  | `buildReplayPolicy`               | 返回一个控制提供商转录处理方式的 replay policy                                                   | 提供商需要自定义转录策略（例如去除 thinking block）                                                                                          |
| 42  | `sanitizeReplayHistory`           | 在通用转录清理后重写 replay 历史                                                                 | 提供商需要超出共享压缩辅助工具之外的 replay 重写                                                                                             |
| 43  | `validateReplayTurns`             | 在嵌入式 runner 之前对 replay turn 做最终校验或重塑                                              | 提供商传输在通用净化后需要更严格的 turn 校验                                                                                                |
| 44  | `onModelSelected`                 | 运行提供商自有的模型选中后副作用                                                                 | 当模型变为活动状态时，提供商需要遥测或自有状态处理                                                                                           |

`normalizeModelId`、`normalizeTransport` 和 `normalizeConfig` 会先检查匹配的提供商插件，然后回退到其他具备 hook 能力的提供商插件，直到其中一个真正修改 model id 或 transport / config 为止。这样可使别名 / 兼容提供商 shim 继续工作，而无需调用方知道哪个内置插件拥有该重写。如果没有提供商 hook 重写受支持的 Google 家族配置项，则内置 Google 配置规范化器仍会执行该兼容性清理。

如果提供商需要完全自定义的线路协议或自定义请求执行器，那就是另一类扩展。这些 hooks 面向的是仍运行在 OpenClaw 正常推理循环上的提供商行为。

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
  提供商家族提示、认证修复指导、用量端点集成、
  提示词缓存资格、认证感知配置默认值、Claude
  默认 / 自适应 thinking 策略，以及 Anthropic 专属的流整形能力，用于 beta headers、`/fast` / `serviceTier` 和 `context1m`。
- Anthropic 的 Claude 专属流辅助工具目前保留在内置插件自己的公开 `api.ts` / `contract-api.ts` 接缝中。该包接口
  导出 `wrapAnthropicProviderStream`、`resolveAnthropicBetas`、
  `resolveAnthropicFastMode`、`resolveAnthropicServiceTier` 以及更底层的
  Anthropic 包装器构建器，而不是仅为某一个提供商的 beta header 规则去扩展通用 SDK。
- OpenAI 使用 `resolveDynamicModel`、`normalizeResolvedModel` 和
  `capabilities`，以及 `buildMissingAuthMessage`、`suppressBuiltInModel`、
  `augmentModelCatalog`、`supportsXHighThinking` 和 `isModernModelRef`，
  因为它拥有 GPT-5.4 前向兼容、直接 OpenAI
  `openai-completions` -> `openai-responses` 规范化、面向 Codex 的认证
  提示、Spark 抑制、synthetic OpenAI 列表条目，以及 GPT-5 的 thinking /
  live model 策略；`openai-responses-defaults` 流家族拥有共享的原生 OpenAI Responses 包装器，用于 attribution headers、
  `/fast`/`serviceTier`、文本详细度、本地 Codex Web 搜索、
  reasoning 兼容负载整形以及 Responses 上下文管理。
- OpenRouter 使用 `catalog`，以及 `resolveDynamicModel` 和
  `prepareDynamicModel`，因为该提供商是透传型的，可能在 OpenClaw 的静态目录更新前就暴露新的
  model id；它还使用
  `capabilities`、`wrapStreamFn` 和 `isCacheTtlEligible`，以便将
  提供商专属请求头、路由元数据、reasoning 补丁和
  提示词缓存策略留在 core 外部。它的 replay policy 来自
  `passthrough-gemini` 家族，而 `openrouter-thinking` 流家族
  负责代理 reasoning 注入以及不支持模型 / `auto` 的跳过逻辑。
- GitHub Copilot 使用 `catalog`、`auth`、`resolveDynamicModel` 和
  `capabilities`，以及 `prepareRuntimeAuth` 和 `fetchUsageSnapshot`，因为它
  需要提供商自有的设备登录、模型回退行为、Claude 转录特性、
  GitHub token -> Copilot token 交换以及提供商自有的用量端点。
- OpenAI Codex 使用 `catalog`、`resolveDynamicModel`、
  `normalizeResolvedModel`、`refreshOAuth` 和 `augmentModelCatalog`，以及
  `prepareExtraParams`、`resolveUsageAuth` 和 `fetchUsageSnapshot`，因为它
  仍运行在 core OpenAI 传输之上，但拥有自己的传输 / base URL
  规范化、OAuth 刷新回退策略、默认传输选择、
  synthetic Codex 目录条目以及 ChatGPT 用量端点集成；它与直接 OpenAI 共用相同的 `openai-responses-defaults` 流家族。
- Google AI Studio 和 Gemini CLI OAuth 使用 `resolveDynamicModel`、
  `buildReplayPolicy`、`sanitizeReplayHistory`、
  `resolveReasoningOutputMode`、`wrapStreamFn` 和 `isModernModelRef`，因为
  `google-gemini` replay 家族拥有 Gemini 3.1 前向兼容回退、
  原生 Gemini replay 校验、bootstrap replay 净化、带标签的
  reasoning 输出模式以及 modern model 匹配逻辑，而
  `google-thinking` 流家族拥有 Gemini thinking 负载规范化；
  Gemini CLI OAuth 还使用 `formatApiKey`、`resolveUsageAuth` 和
  `fetchUsageSnapshot` 来处理 token 格式化、token 解析和配额端点接线。
- Anthropic Vertex 通过
  `anthropic-by-model` replay 家族使用 `buildReplayPolicy`，
  这样 Claude 专属 replay 清理就能仅作用于 Claude id，而不是所有 `anthropic-messages` 传输。
- Amazon Bedrock 使用 `buildReplayPolicy`、`matchesContextOverflowError`、
  `classifyFailoverReason` 和 `resolveDefaultThinkingLevel`，因为它拥有
  Bedrock 专属的 throttle / not-ready / context-overflow 错误分类能力，
  适用于 Anthropic-on-Bedrock 流量；其 replay policy 仍共享相同的
  仅限 Claude 的 `anthropic-by-model` 保护。
- OpenRouter、Kilocode、Opencode 和 Opencode Go 通过 `passthrough-gemini` replay 家族使用 `buildReplayPolicy`，因为它们通过 OpenAI 兼容传输代理 Gemini
  模型，需要进行 Gemini thought-signature 净化，但不需要原生 Gemini replay 校验或
  bootstrap 重写。
- MiniMax 通过
  `hybrid-anthropic-openai` replay 家族使用 `buildReplayPolicy`，因为同一个提供商同时拥有
  Anthropic message 和 OpenAI 兼容语义；它会在 Anthropic 一侧保留仅限 Claude 的
  thinking block 丢弃逻辑，同时将 reasoning
  输出模式覆盖回原生，而 `minimax-fast-mode` 流家族则拥有共享流路径上的
  fast mode 模型重写能力。
- Moonshot 使用 `catalog` 和 `wrapStreamFn`，因为它仍使用共享的
  OpenAI 传输，但需要提供商自有的 thinking 负载规范化；`moonshot-thinking` 流家族将配置和 `/think` 状态映射到其原生二值 thinking 负载。
- Kilocode 使用 `catalog`、`capabilities`、`wrapStreamFn` 和
  `isCacheTtlEligible`，因为它需要提供商自有请求头、
  reasoning 负载规范化、Gemini 转录提示以及 Anthropic
  cache TTL 门控；`kilocode-thinking` 流家族负责在共享代理流路径中保留 Kilo thinking
  注入，同时跳过 `kilo/auto` 和其他不支持显式 reasoning 负载的代理模型 id。
- Z.AI 使用 `resolveDynamicModel`、`prepareExtraParams`、`wrapStreamFn`、
  `isCacheTtlEligible`、`isBinaryThinking`、`isModernModelRef`、
  `resolveUsageAuth` 和 `fetchUsageSnapshot`，因为它拥有 GLM-5 回退、
  `tool_stream` 默认值、二值 thinking UX、modern model 匹配，以及
  用量认证 + 配额抓取；`tool-stream-default-on` 流家族将默认开启的
  `tool_stream` 包装器从各提供商手写胶水代码中抽离出来。
- xAI 使用 `normalizeResolvedModel`、`normalizeTransport`、
  `contributeResolvedModelCompat`、`prepareExtraParams`、`wrapStreamFn`、
  `resolveSyntheticAuth`、`resolveDynamicModel` 和 `isModernModelRef`，
  因为它拥有原生 xAI Responses 传输规范化、Grok fast mode
  别名重写、默认 `tool_stream`、strict tool / reasoning payload
  清理、插件自有工具的回退认证复用、前向兼容 Grok
  模型解析，以及提供商自有的兼容性补丁，例如 xAI tool schema
  profile、不受支持的 schema 关键字、原生 `web_search`，以及 HTML entity
  工具调用参数解码。
- Mistral、OpenCode Zen 和 OpenCode Go 仅使用 `capabilities`，以将
  转录 / 工具特性留在 core 外部。
- 仅目录型内置提供商，例如 `byteplus`、`cloudflare-ai-gateway`、
  `huggingface`、`kimi-coding`、`nvidia`、`qianfan`、
  `synthetic`、`together`、`venice`、`vercel-ai-gateway` 和 `volcengine`，仅使用
  `catalog`。
- Qwen 将 `catalog` 用于其文本提供商，同时为其多模态接口注册共享的媒体理解和视频生成能力。
- MiniMax 和 Xiaomi 使用 `catalog` 加上 usage hooks，因为它们的 `/usage`
  行为属于插件自有，即使推理仍通过共享传输运行。

## 运行时辅助工具

插件可以通过 `api.runtime` 访问部分选定的 core 辅助工具。以 TTS 为例：

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

- `textToSpeech` 返回常规 core TTS 输出负载，适用于文件 / 语音便笺接口。
- 使用 core `messages.tts` 配置和提供商选择。
- 返回 PCM 音频 buffer + sample rate。插件必须自行进行重采样 / 编码以适配提供商。
- `listVoices` 对每个提供商来说是可选的。可将其用于厂商自有的语音选择器或设置流程。
- 语音列表可以包含更丰富的元数据，例如语言区域、性别和个性标签，以支持提供商感知的选择器。
- 当前 OpenAI 和 ElevenLabs 支持电话场景。Microsoft 不支持。

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
- 对厂商自有合成行为使用语音提供商。
- 旧版 Microsoft `edge` 输入会被规范化为 `microsoft` provider id。
- 推荐的归属模型是面向公司的：随着 OpenClaw 增加这些
  能力契约，一个厂商插件可以同时拥有文本、语音、图像和未来媒体提供商。

对于图像 / 音频 / 视频理解，插件会注册一个类型化的
媒体理解提供商，而不是通用 key/value 包：

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
- 增量扩展应保持类型化：新的可选方法、新的可选结果字段、新的可选能力。
- 视频生成已经遵循相同模式：
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

对于音频转写，插件可以使用媒体理解运行时或较旧的 STT 别名：

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

说明：

- `api.runtime.mediaUnderstanding.*` 是图像 / 音频 / 视频理解的首选共享接口。
- 使用 core 媒体理解音频配置（`tools.media.audio`）和提供商回退顺序。
- 当没有产生转写输出时，返回 `{ text: undefined }`（例如输入被跳过 / 不受支持）。
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

- `provider` 和 `model` 是按次运行覆盖项，不会持久改变会话设置。
- OpenClaw 仅对受信任调用方接受这些覆盖字段。
- 对于插件自有回退运行，运维者必须通过 `plugins.entries.<id>.subagent.allowModelOverride: true` 显式启用。
- 使用 `plugins.entries.<id>.subagent.allowedModels` 将受信任插件限制到特定规范 `provider/model` 目标，或设置为 `"*"` 以显式允许任意目标。
- 不受信任的插件子智能体运行仍可工作，但覆盖请求会被拒绝，而不是静默回退。

对于 Web 搜索，插件可以消费共享运行时辅助工具，而不是
深入智能体工具接线：

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

- 将提供商选择、凭据解析和共享请求语义保留在 core 中。
- 对厂商专属搜索传输使用 Web 搜索提供商。
- `api.runtime.webSearch.*` 是功能 / 渠道插件需要搜索行为但不依赖智能体工具包装器时的首选共享接口。

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
- `listProviders(...)`：列出可用图像生成提供商及其能力。

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
- `auth`：必填。使用 `"gateway"` 以要求普通 Gateway 网关认证，或使用 `"plugin"` 以进行插件自主管理的认证 / webhook 校验。
- `match`：可选。`"exact"`（默认）或 `"prefix"`。
- `replaceExisting`：可选。允许同一个插件替换它自己现有的路由注册。
- `handler`：当路由处理了请求时返回 `true`。

说明：

- `api.registerHttpHandler(...)` 已被移除，并会导致插件加载错误。请改用 `api.registerHttpRoute(...)`。
- 插件路由必须显式声明 `auth`。
- 除非 `replaceExisting: true`，否则精确 `path + match` 冲突会被拒绝，并且一个插件不能替换另一个插件的路由。
- 不同 `auth` 级别的重叠路由会被拒绝。请仅在相同 auth 级别内保留 `exact` / `prefix` 的贯通链。
- `auth: "plugin"` 路由**不会**自动获得运维者运行时作用域。它们用于插件自主管理的 webhook / 签名校验，而不是特权 Gateway 网关辅助调用。
- `auth: "gateway"` 路由运行在 Gateway 网关请求运行时作用域内，但该作用域被有意设计得较为保守：
  - 共享密钥 bearer 认证（`gateway.auth.mode = "token"` / `"password"`）会让插件路由运行时作用域固定为 `operator.write`，即使调用方发送了 `x-openclaw-scopes`
  - 受信任的、带身份的 HTTP 模式（例如 `trusted-proxy` 或私有入口上的 `gateway.auth.mode = "none"`）仅在显式存在该 header 时才会尊重 `x-openclaw-scopes`
  - 如果这些带身份的插件路由请求中缺少 `x-openclaw-scopes`，运行时作用域会回退到 `operator.write`
- 实用规则：不要假设一个经过 gateway 认证的插件路由天然就是管理员接口。如果你的路由需要仅管理员行为，请要求使用带身份的认证模式，并记录清楚显式 `x-openclaw-scopes` header 契约。

## 插件 SDK 导入路径

在编写插件时，请使用 SDK 子路径，而不是单体式的 `openclaw/plugin-sdk` 导入：

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
  `openclaw/plugin-sdk/secret-input` 和
  `openclaw/plugin-sdk/webhook-ingress`，用于共享设置 / 认证 / 回复 / webhook
  接线。`channel-inbound` 是 debounce、提及匹配、
  envelope 格式化以及入站 envelope 上下文辅助工具的共享归属位置。
  `channel-setup` 是精简的可选安装设置接缝。
  `setup-runtime` 是 `setupEntry` /
  延迟启动所使用的运行时安全设置接口，包括导入安全的设置 patch adapters。
  `setup-adapter-runtime` 是感知环境的账户设置 adapter 接缝。
  `setup-tools` 是小型 CLI / archive / docs 辅助工具接缝（`formatCliCommand`、
  `detectBinary`、`extractArchive`、`resolveBrewExecutable`、`formatDocsLink`、
  `CONFIG_DIR`）。
- 领域子路径，例如 `openclaw/plugin-sdk/channel-config-helpers`、
  `openclaw/plugin-sdk/allow-from`、
  `openclaw/plugin-sdk/channel-config-schema`、
  `openclaw/plugin-sdk/telegram-command-config`、
  `openclaw/plugin-sdk/channel-policy`、
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
  命令规范化 / 校验的精简公开接缝，即使内置
  Telegram 契约接口暂时不可用，它也保持可用。
  `text-runtime` 是共享的文本 / Markdown / 日志接缝，包括
  面向 assistant 可见文本剥离、Markdown 渲染 / 分块辅助工具、脱敏
  辅助工具、directive tag 辅助工具以及 safe-text 实用工具。
- 审批专用的渠道接缝应优先使用插件上的单一 `approvalCapability`
  契约。然后 core 通过这一项能力读取审批认证、投递、渲染和
  原生路由行为，而不是将审批行为混入无关的插件字段。
- `openclaw/plugin-sdk/channel-runtime` 已弃用，仅作为
  旧版插件的兼容性 shim 保留。新代码应导入更窄的通用原语，而仓库代码不应新增对该 shim 的导入。
- 内置扩展内部实现仍然是私有的。外部插件应仅使用
  `openclaw/plugin-sdk/*` 子路径。OpenClaw core / 测试代码可以使用
  某个插件包根目录下的仓库公开入口点，例如 `index.js`、`api.js`、
  `runtime-api.js`、`setup-entry.js` 以及更精细的文件，例如
  `login-qr-api.js`。绝不要从 core 或另一个扩展中导入某个插件包的 `src/*`。
- 仓库入口点拆分：
  `<plugin-package-root>/api.js` 是辅助工具 / 类型 barrel，
  `<plugin-package-root>/runtime-api.js` 是仅运行时 barrel，
  `<plugin-package-root>/index.js` 是内置插件入口，
  `<plugin-package-root>/setup-entry.js` 是设置插件入口。
- 当前内置提供商示例：
  - Anthropic 使用 `api.js` / `contract-api.js` 提供 Claude 流辅助工具，例如
    `wrapAnthropicProviderStream`、beta header 辅助工具以及 `service_tier`
    解析。
  - OpenAI 使用 `api.js` 提供提供商构建器、默认模型辅助工具以及
    实时提供商构建器。
  - OpenRouter 使用 `api.js` 提供其提供商构建器以及新手引导 / 配置
    辅助工具，而 `register.runtime.js` 仍可为仓库内使用重新导出通用
    `plugin-sdk/provider-stream` 辅助工具。
- facade 加载的公开入口点会优先使用当前活动的运行时配置快照；
  当 OpenClaw 尚未提供运行时快照时，则回退到磁盘上的已解析配置文件。
- 通用共享原语仍然是首选公开 SDK 契约。仍然存在一小部分保留的、兼容性用途的内置渠道品牌化辅助工具接缝。应将它们视为内置维护 / 兼容性接缝，而不是新的第三方导入目标；新的跨渠道契约仍应落在通用 `plugin-sdk/*` 子路径或插件本地 `api.js` /
  `runtime-api.js` barrel 上。

兼容性说明：

- 新代码请避免使用根 `openclaw/plugin-sdk` barrel。
- 优先使用精简稳定原语。更新的 setup / pairing / reply /
  feedback / contract / inbound / threading / command / secret-input / webhook / infra /
  allowlist / status / message-tool 子路径是新内置和外部插件工作的预期契约。
  目标解析 / 匹配应放在 `openclaw/plugin-sdk/channel-targets`。
  消息操作门控和 reaction message id 辅助工具应放在
  `openclaw/plugin-sdk/channel-actions`。
- 默认情况下，内置扩展专用辅助工具 barrel 并不稳定。如果某个
  辅助工具只被某个内置扩展需要，请将它保留在扩展本地
  `api.js` 或 `runtime-api.js` 接缝后面，而不是提升为
  `openclaw/plugin-sdk/<extension>`。
- 新的共享辅助工具接缝应当是通用的，而不是带渠道品牌的。共享目标
  解析应归于 `openclaw/plugin-sdk/channel-targets`；渠道专属
  内部实现则应保留在所属插件的本地 `api.js` 或 `runtime-api.js`
  接缝之后。
- 像 `image-generation`、
  `media-understanding` 和 `speech` 这样的能力专用子路径之所以存在，是因为
  当前内置 / 原生插件正在使用它们。但这并不自动意味着其中每个导出辅助工具
  都是长期冻结的外部契约。

## 消息工具 schema

插件应拥有渠道专属的 `describeMessageTool(...)` schema
扩展。请将提供商专属字段保留在插件中，而不要放入共享 core。

对于共享的可移植 schema 片段，请复用通过
`openclaw/plugin-sdk/channel-actions` 导出的通用辅助工具：

- `createMessageToolButtonsSchema()` 用于按钮网格式负载
- `createMessageToolCardSchema()` 用于结构化卡片负载

如果某个 schema 形状只对一个提供商有意义，请在该插件自己的
源码中定义它，而不要将其提升到共享 SDK 中。

## 渠道目标解析

渠道插件应拥有渠道专属的目标语义。请保持共享
outbound host 的通用性，并使用消息 adapter 接口处理提供商规则：

- `messaging.inferTargetChatType({ to })` 决定规范化目标在目录查找前
  应被视为 `direct`、`group` 还是 `channel`。
- `messaging.targetResolver.looksLikeId(raw, normalized)` 告诉 core 某个
  输入是否应直接跳到类 id 解析，而不是目录搜索。
- `messaging.targetResolver.resolveTarget(...)` 是在规范化之后或目录未命中后，
  core 需要最终提供商自有解析时的插件回退。
- `messaging.resolveOutboundSessionRoute(...)` 在目标解析完成后拥有
  提供商专属的会话路由构建逻辑。

推荐拆分方式：

- 使用 `inferTargetChatType` 处理应在搜索 peers / groups 之前发生的类别决策。
- 使用 `looksLikeId` 处理“将其视为显式 / 原生 target id”的检查。
- 使用 `resolveTarget` 处理提供商专属的规范化回退，而不是广泛的目录搜索。
- 将提供商原生 id（例如 chat id、thread id、JID、handle 和 room id）保留在 `target` 值或提供商专属参数中，而不要放进通用 SDK 字段。

## 配置驱动目录

对于从配置派生目录条目的插件，请将该逻辑保留在插件中，并复用
`openclaw/plugin-sdk/directory-runtime` 中的共享辅助工具。

当某个渠道需要配置驱动的 peers / groups 时，请使用这种方式，例如：

- 由 allowlist 驱动的私信 peers
- 已配置的渠道 / 群组映射
- 账户作用域的静态目录回退

`directory-runtime` 中的共享辅助工具仅处理通用操作：

- 查询过滤
- 限制应用
- 去重 / 规范化辅助工具
- 构建 `ChannelDirectoryEntry[]`

渠道专属的账户检查和 id 规范化应保留在插件实现中。

## 提供商目录

提供商插件可以通过
`registerProvider({ catalog: { run(...) { ... } } })` 定义用于推理的模型目录。

`catalog.run(...)` 返回与 OpenClaw 写入
`models.providers` 的相同结构：

- `{ provider }` 表示一个 provider 条目
- `{ providers }` 表示多个 provider 条目

当插件拥有提供商专属 model id、base URL 默认值或受认证门控的模型元数据时，请使用 `catalog`。

`catalog.order` 控制插件目录相对于 OpenClaw
内置隐式提供商的合并时机：

- `simple`：普通 API key 或环境变量驱动的提供商
- `profile`：当存在 auth profiles 时出现的提供商
- `paired`：会合成多个关联 provider 条目的提供商
- `late`：最后一轮，在其他隐式提供商之后

后出现的提供商在 key 冲突时会获胜，因此插件可以有意用相同 provider id 覆盖内置 provider 条目。

兼容性：

- `discovery` 仍可用作旧版别名
- 如果同时注册了 `catalog` 和 `discovery`，OpenClaw 会使用 `catalog`

## 只读渠道检查

如果你的插件注册了一个渠道，建议同时实现
`plugin.config.inspectAccount(cfg, accountId)` 和 `resolveAccount(...)`。

原因：

- `resolveAccount(...)` 是运行时路径。它可以假设凭据
  已完全实体化，并在缺失必要 secret 时快速失败。
- 像 `openclaw status`、`openclaw status --all`、
  `openclaw channels status`、`openclaw channels resolve` 以及 doctor / config
  修复流程这样的只读命令路径，不应为了描述配置就去实体化运行时凭据。

推荐的 `inspectAccount(...)` 行为：

- 仅返回描述性的账户状态。
- 保留 `enabled` 和 `configured`。
- 在相关时包含凭据来源 / 状态字段，例如：
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- 你不需要返回原始 token 值来报告只读可用性。返回
  `tokenStatus: "available"`（以及匹配的 source 字段）就足够用于状态类命令。
- 当凭据通过 SecretRef 配置，但在当前命令路径中不可用时，请使用 `configured_unavailable`。

这样只读命令就能报告“已配置，但在当前命令路径中不可用”，而不是崩溃或错误地将账户报告为未配置。

## 包集合

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

每个条目都会变成一个插件。如果该 pack 列出多个扩展，则插件 id
会变为 `name/<fileBase>`。

如果你的插件导入了 npm 依赖，请在该目录中安装它们，以确保
`node_modules` 可用（`npm install` / `pnpm install`）。

安全护栏：每个 `openclaw.extensions` 条目在解析 symlink 后都必须仍位于插件
目录内部。任何逃逸出包目录的条目都会被拒绝。

安全说明：`openclaw plugins install` 安装插件依赖时使用
`npm install --omit=dev --ignore-scripts`（无生命周期脚本，运行时无 dev dependencies）。请保持插件依赖树为“纯 JS / TS”，并避免依赖需要 `postinstall` 构建的包。

可选：`openclaw.setupEntry` 可以指向一个轻量级、仅用于设置的模块。
当 OpenClaw 需要为一个已禁用的渠道插件提供设置接口，或者
当某个渠道插件已启用但尚未配置时，它会加载 `setupEntry`，而不是完整插件入口。这样在你的主插件入口同时接线工具、hooks 或其他仅运行时代码时，
可以让启动和设置更轻量。

可选：`openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
可以让渠道插件在 Gateway 网关监听前的启动阶段也使用相同的 `setupEntry` 路径，
即使该渠道已经配置完成。

仅当 `setupEntry` 完整覆盖了 Gateway 网关开始监听前必须存在的启动接口时才应使用此选项。实践中，这意味着设置入口
必须注册启动所依赖的每一项渠道自有能力，例如：

- 渠道注册本身
- 任何必须在 Gateway 网关开始监听前可用的 HTTP 路由
- 任何在同一时间窗口内必须存在的 Gateway 网关方法、工具或服务

如果你的完整入口仍然拥有任何必需的启动能力，请不要启用
此标志。应保持默认行为，让 OpenClaw 在启动期间加载完整入口。

内置渠道也可以发布仅设置用途的契约接口辅助工具，供 core 在完整
渠道运行时加载前查询。当前设置提升接口包括：

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

当 core 需要将旧版单账户渠道配置提升到
`channels.<id>.accounts.*`，且无需加载完整插件入口时，就会使用该接口。
Matrix 是当前的内置示例：当已存在命名账户时，它只会将 auth / bootstrap 键迁移到一个已命名的提升账户中，并且可以保留已配置的非规范 default account key，而不是总是创建
`accounts.default`。

这些设置 patch adapters 使内置契约接口发现保持惰性。导入
时间保持轻量；提升接口只会在首次使用时加载，而不是在模块导入时重新进入内置渠道启动流程。

当这些启动接口包含 Gateway 网关 RPC 方法时，请保持它们位于
插件专属前缀下。core 管理命名空间（`config.*`、
`exec.approvals.*`、`wizard.*`、`update.*`）仍然保留，并始终解析为
`operator.admin`，即使某个插件请求了更窄的作用域。

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

渠道插件可以通过 `openclaw.channel` 宣传设置 / 发现元数据，并通过 `openclaw.install` 提供安装提示。这样可让 core 保持无数据。

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

除最小示例外，其他有用的 `openclaw.channel` 字段包括：

- `detailLabel`：更丰富目录 / 状态接口中的次级标签
- `docsLabel`：覆盖文档链接文本
- `preferOver`：该目录条目应优先于的低优先级插件 / 渠道 id
- `selectionDocsPrefix`、`selectionDocsOmitLabel`、`selectionExtras`：用于选择界面文案控制
- `markdownCapable`：将渠道标记为支持 Markdown，以供出站格式决策使用
- `exposure.configured`：设为 `false` 时，在已配置渠道列表接口中隐藏该渠道
- `exposure.setup`：设为 `false` 时，在交互式设置 / 配置选择器中隐藏该渠道
- `exposure.docs`：将渠道标记为内部 / 私有，用于文档导航接口
- `showConfigured` / `showInSetup`：仍接受的旧版兼容别名；优先使用 `exposure`
- `quickstartAllowFrom`：让渠道接入标准快速开始 `allowFrom` 流程
- `forceAccountBinding`：即使只存在一个账户，也要求显式账户绑定
- `preferSessionLookupForAnnounceTarget`：在解析 announce target 时优先进行会话查找

OpenClaw 还可以合并**外部渠道目录**（例如 MPM
注册表导出）。将 JSON 文件放到以下任一位置：

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

或者将 `OPENCLAW_PLUGIN_CATALOG_PATHS`（或 `OPENCLAW_MPM_CATALOG_PATHS`）指向一个或多个 JSON 文件（使用逗号 / 分号 / `PATH` 分隔）。每个文件应包含 `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`。解析器也接受 `"packages"` 或 `"plugins"` 作为 `"entries"` 键的旧版别名。

## 上下文引擎插件

上下文引擎插件拥有会话上下文编排能力，用于摄取、组装和压缩。请在你的插件中通过
`api.registerContextEngine(id, factory)` 注册它们，然后通过
`plugins.slots.contextEngine` 选择活动引擎。

当你的插件需要替换或扩展默认上下文流水线，而不仅仅是增加 memory 搜索或 hooks 时，请使用此方式。

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

如果你的引擎**并不**拥有压缩算法，请保持 `compact()`
已实现，并显式委托它：

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

当插件需要当前 API 无法适配的行为时，不要通过私有深入访问绕过
插件系统。请添加缺失的能力。

推荐顺序：

1. 定义 core 契约
   明确共享行为中哪些由 core 拥有：策略、回退、配置合并、
   生命周期、面向渠道的语义，以及运行时辅助工具形状。
2. 添加类型化插件注册 / 运行时接口
   以最小但有用的类型化能力接口扩展 `OpenClawPluginApi` 和 / 或 `api.runtime`。
3. 接线 core + 渠道 / 功能消费者
   渠道和功能插件应通过 core 消费新能力，
   而不是直接导入某个厂商实现。
4. 注册厂商实现
   厂商插件随后针对该能力注册自己的后端。
5. 添加契约覆盖
   添加测试，以便随着时间推移，归属和注册形状保持明确。

这就是 OpenClaw 如何在保持明确主张的同时，不会被硬编码到某一个
提供商世界观中。具体的文件清单和完整示例，请参阅[能力扩展手册](/zh-CN/plugins/architecture)。

### 能力清单

当你添加一个新能力时，实现通常应同时涉及以下接口：

- `src/<capability>/types.ts` 中的 core 契约类型
- `src/<capability>/runtime.ts` 中的 core runner / 运行时辅助工具
- `src/plugins/types.ts` 中的插件 API 注册接口
- `src/plugins/registry.ts` 中的插件注册表接线
- 当功能 / 渠道插件需要消费它时，位于 `src/plugins/runtime/*` 的插件运行时暴露层
- `src/test-utils/plugin-registration.ts` 中的捕获 / 测试辅助工具
- `src/plugins/contracts/registry.ts` 中的归属 / 契约断言
- `docs/` 中面向运维者 / 插件的文档

如果这些接口中的某一个缺失，通常意味着该能力还没有真正完成集成。

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
- 契约测试使归属保持明确
