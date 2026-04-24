---
read_when:
    - 构建或调试原生 OpenClaw 插件
    - 理解插件能力模型或归属边界
    - 开发插件加载流水线或注册表
    - 实现提供商运行时钩子或渠道插件
sidebarTitle: Internals
summary: 插件内部机制：能力模型、归属、契约、加载流水线和运行时辅助工具
title: 插件内部机制
x-i18n:
    generated_at: "2026-04-24T03:42:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4506472486e09f33a2e87f0a3c38191a9817d1f36fcdd7dd4f57f0a8453e9b4f
    source_path: plugins/architecture.md
    workflow: 15
---

这是 OpenClaw 插件系统的**深度架构参考**。如需实践指南，请先从下方的专题页面开始。

<CardGroup cols={2}>
  <Card title="安装和使用插件" icon="plug" href="/zh-CN/tools/plugin">
    面向最终用户的指南，介绍如何添加、启用和排查插件。
  </Card>
  <Card title="构建插件" icon="rocket" href="/zh-CN/plugins/building-plugins">
    首个插件教程，包含最小可工作的 manifest。
  </Card>
  <Card title="渠道插件" icon="comments" href="/zh-CN/plugins/sdk-channel-plugins">
    构建一个消息渠道插件。
  </Card>
  <Card title="提供商插件" icon="microchip" href="/zh-CN/plugins/sdk-provider-plugins">
    构建一个模型提供商插件。
  </Card>
  <Card title="SDK 概览" icon="book" href="/zh-CN/plugins/sdk-overview">
    import map 和注册 API 参考。
  </Card>
</CardGroup>

## 公共能力模型

能力是 OpenClaw 中公共的**原生插件**模型。每个原生 OpenClaw 插件都会针对一个或多个能力类型进行注册：

| 能力                   | 注册方法                                       | 示例插件                             |
| ---------------------- | ---------------------------------------------- | ------------------------------------ |
| 文本推理               | `api.registerProvider(...)`                    | `openai`、`anthropic`                |
| CLI 推理后端           | `api.registerCliBackend(...)`                  | `openai`、`anthropic`                |
| 语音                   | `api.registerSpeechProvider(...)`              | `elevenlabs`、`microsoft`            |
| 实时转写               | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| 实时语音               | `api.registerRealtimeVoiceProvider(...)`       | `openai`                             |
| 媒体理解               | `api.registerMediaUnderstandingProvider(...)`  | `openai`、`google`                   |
| 图像生成               | `api.registerImageGenerationProvider(...)`     | `openai`、`google`、`fal`、`minimax` |
| 音乐生成               | `api.registerMusicGenerationProvider(...)`     | `google`、`minimax`                  |
| 视频生成               | `api.registerVideoGenerationProvider(...)`     | `qwen`                               |
| Web 抓取               | `api.registerWebFetchProvider(...)`            | `firecrawl`                          |
| Web 搜索               | `api.registerWebSearchProvider(...)`           | `google`                             |
| 渠道 / 消息            | `api.registerChannel(...)`                     | `msteams`、`matrix`                  |

一个注册了零个能力、但提供 hooks、工具或服务的插件是**旧版仅 hook** 插件。这种模式仍然被完全支持。

### 外部兼容性立场

能力模型已经落地到 core，并且当前已被内置 / 原生插件使用，但外部插件兼容性仍然需要比“已导出，因此已冻结”更严格的标准。

| 插件情况                                    | 指导原则                                                                                       |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 现有外部插件                                | 保持基于 hook 的集成正常工作；这是兼容性基线。                                                 |
| 新的内置 / 原生插件                         | 优先选择显式能力注册，而不是供应商特定的深入访问或新的仅 hook 设计。                           |
| 采用能力注册的外部插件                      | 允许，但除非文档将其标记为稳定，否则应将能力专用的辅助 surface 视为持续演进中。                 |

能力注册是预期的发展方向。在过渡期间，对于外部插件而言，旧版 hook 仍然是最安全、最不容易破坏兼容性的路径。已导出的辅助子路径并不都具有同等稳定性——应优先选择范围狭窄、文档化的契约，而不是偶然导出的辅助接口。

### 插件形态

OpenClaw 会根据每个已加载插件的实际注册行为（而不仅仅是静态元数据）将其分类为以下形态之一：

- **plain-capability**：只注册一种能力类型（例如仅提供商插件 `mistral`）。
- **hybrid-capability**：注册多种能力类型（例如 `openai` 同时拥有文本推理、语音、媒体理解和图像生成）。
- **hook-only**：仅注册 hooks（类型化或自定义），不注册任何能力、工具、命令或服务。
- **non-capability**：注册工具、命令、服务或路由，但不注册能力。

使用 `openclaw plugins inspect <id>` 可查看某个插件的形态和能力拆分。详情参见 [CLI 参考](/zh-CN/cli/plugins#inspect)。

### 旧版 hooks

`before_agent_start` hook 仍作为仅 hook 插件的兼容路径被支持。现实中的旧版插件仍然依赖它。

方向是：

- 保持其可用
- 将其文档标记为旧版
- 对于模型 / 提供商覆盖工作，优先使用 `before_model_resolve`
- 对于 prompt 变更工作，优先使用 `before_prompt_build`
- 只有在真实使用量下降且 fixture 覆盖证明迁移安全之后才移除

### 兼容性信号

运行 `openclaw doctor` 或 `openclaw plugins inspect <id>` 时，你可能会看到以下标签之一：

| 信号                       | 含义                                                       |
| -------------------------- | ---------------------------------------------------------- |
| **config valid**           | 配置解析正常，插件可解析                                   |
| **compatibility advisory** | 插件使用了受支持但较旧的模式（例如 `hook-only`）           |
| **legacy warning**         | 插件使用了 `before_agent_start`，该接口已弃用              |
| **hard error**             | 配置无效或插件加载失败                                     |

当前 `hook-only` 和 `before_agent_start` 都不会破坏你的插件：
`hook-only` 只是提示信息，而 `before_agent_start` 只会触发警告。这些信号也会出现在 `openclaw status --all` 和 `openclaw plugins doctor` 中。

## 架构概览

OpenClaw 的插件系统分为四层：

1. **Manifest + 设备发现**
   OpenClaw 会从配置的路径、工作区根目录、全局插件根目录以及内置插件中查找候选插件。设备发现会优先读取原生 `openclaw.plugin.json` manifest 和受支持 bundle 的 manifest。
2. **启用 + 校验**
   Core 决定某个已发现插件是启用、禁用、阻止，还是被选入某个排他插槽（例如 memory）。
3. **运行时加载**
   原生 OpenClaw 插件通过 jiti 在进程内加载，并将能力注册到中央注册表中。兼容的 bundle 会被标准化为注册表记录，而无需导入运行时代码。
4. **Surface 消费**
   OpenClaw 的其余部分读取注册表，以暴露工具、渠道、提供商设置、hooks、HTTP 路由、CLI 命令和服务。

对于插件 CLI，根命令设备发现会拆分为两个阶段：

- 解析时元数据来自 `registerCli(..., { descriptors: [...] })`
- 真正的插件 CLI 模块可以保持惰性加载，并在首次调用时注册

这样可以在 OpenClaw 解析之前预留根命令名，同时将插件拥有的 CLI 代码保留在插件内部。

重要的设计边界是：

- 设备发现 + 配置校验应基于 **manifest / schema 元数据** 工作，而不执行插件代码
- 原生运行时行为来自插件模块的 `register(api)` 路径

这种拆分使 OpenClaw 能在完整运行时激活之前，先校验配置、解释缺失 / 已禁用的插件，并构建 UI / schema 提示。

### 渠道插件与共享 message 工具

对于常规聊天动作，渠道插件不需要单独注册发送 / 编辑 / reaction 工具。OpenClaw 在 core 中保留了一个共享的 `message` 工具，而渠道插件负责其背后的渠道特定设备发现和执行。

当前边界是：

- core 负责共享 `message` 工具宿主、prompt 接线、会话 / 线程簿记和执行分发
- 渠道插件负责有范围限制的动作设备发现、能力设备发现以及所有渠道特定的 schema 片段
- 渠道插件负责提供商特定的会话会话语法，例如会话 id 如何编码线程 id 或从父会话继承
- 渠道插件通过其动作适配器执行最终动作

对于渠道插件，SDK surface 是
`ChannelMessageActionAdapter.describeMessageTool(...)`。这个统一的设备发现调用允许插件同时返回其可见动作、能力和 schema 贡献，以避免这些部分彼此漂移。

当渠道特定的 message-tool 参数携带媒体来源，例如本地路径或远程媒体 URL 时，插件还应从 `describeMessageTool(...)` 返回 `mediaSourceParams`。Core 使用这份显式列表来应用沙箱路径标准化和出站媒体访问提示，而不是对插件拥有的参数名进行硬编码。
这里应优先使用按动作划分的映射，而不是单一的全渠道平面列表，这样仅用于 profile 的媒体参数就不会在 `send` 这类无关动作上被标准化。

Core 会将运行时 scope 传入该设备发现步骤。重要字段包括：

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 受信任的入站 `requesterSenderId`

这对上下文敏感型插件非常重要。渠道可以根据活动账户、当前房间 / 线程 / 消息，或受信任的请求者身份来隐藏或暴露消息动作，而无需在 core 的 `message` 工具中硬编码渠道特定分支。

这也是为什么嵌入式 runner 路由变更仍然属于插件工作：runner 负责将当前聊天 / 会话身份转发到插件设备发现边界，以便共享 `message` 工具为当前轮次暴露正确的渠道拥有 surface。

对于渠道拥有的执行辅助器，内置插件应将执行运行时保留在它们自己的 extension 模块中。Core 不再拥有位于 `src/agents/tools` 下的 Discord、Slack、Telegram 或 WhatsApp 消息动作运行时。
我们不会发布单独的 `plugin-sdk/*-action-runtime` 子路径，内置插件应直接从其 extension 自有模块中导入自己的本地运行时代码。

同样的边界也适用于一般意义上的带提供商名称的 SDK seam：core 不应导入 Slack、Discord、Signal、WhatsApp 或类似 extension 的渠道专用便捷 barrel。如果 core 需要某种行为，要么消费该内置插件自己的 `api.ts` / `runtime-api.ts` barrel，要么将需求提升为共享 SDK 中一个范围狭窄的通用能力。

对于投票，具体有两条执行路径：

- `outbound.sendPoll` 是适用于符合通用投票模型的渠道的共享基线
- `actions.handleAction("poll")` 是处理渠道特定投票语义或额外投票参数的首选路径

现在，Core 会将共享投票解析推迟到插件投票分发拒绝该动作之后，因此插件拥有的投票处理器可以接受渠道特定投票字段，而不会先被通用投票解析器拦住。

完整启动顺序请参见 [插件架构内部机制](/zh-CN/plugins/architecture-internals)。

## 能力归属模型

OpenClaw 将原生插件视为某个**公司**或某个**功能**的归属边界，而不是一堆彼此无关集成的杂物袋。

这意味着：

- 公司插件通常应拥有该公司的所有 OpenClaw 对外 surface
- 功能插件通常应拥有其引入的完整功能 surface
- 渠道应消费共享的 core 能力，而不是临时重新实现提供商行为

<Accordion title="内置插件中的归属模式示例">
  - **供应商多能力**：`openai` 拥有文本推理、语音、实时语音、媒体理解和图像生成。`google` 拥有文本推理以及媒体理解、图像生成和 Web 搜索。`qwen` 拥有文本推理以及媒体理解和视频生成。
  - **供应商单能力**：`elevenlabs` 和 `microsoft` 拥有语音；`firecrawl` 拥有 Web 抓取；`minimax` / `mistral` / `moonshot` / `zai` 拥有媒体理解后端。
  - **功能插件**：`voice-call` 拥有呼叫传输、工具、CLI、路由和 Twilio 媒体流桥接，但会消费共享的语音、实时转写和实时语音能力，而不是直接导入供应商插件。
</Accordion>

预期的最终状态是：

- OpenAI 位于同一个插件中，即使它覆盖文本模型、语音、图像以及未来的视频
- 另一个供应商也可以对其自己的 surface 采用相同模式
- 渠道并不关心哪个供应商插件拥有该提供商；它们消费的是 core 暴露的共享能力契约

这就是关键区别：

- **plugin** = 归属边界
- **capability** = 可由多个插件实现或消费的 core 契约

因此，如果 OpenClaw 新增了一个像视频这样的新领域，第一个问题不应是“哪个提供商应该硬编码视频处理？”第一个问题应是“core 的视频能力契约是什么？”一旦这个契约存在，供应商插件就可以针对它注册，而渠道 / 功能插件也可以消费它。

如果该能力尚不存在，通常正确的做法是：

1. 在 core 中定义缺失的能力
2. 通过插件 API / 运行时以类型化方式暴露它
3. 让渠道 / 功能接入该能力
4. 让供应商插件注册实现

这样可以在保持归属明确的同时，避免 core 行为依赖单一供应商或某个一次性的插件专用代码路径。

### 能力分层

在决定代码归属位置时，可使用以下思维模型：

- **core 能力层**：共享编排、策略、回退、配置合并规则、投递语义和类型化契约
- **供应商插件层**：供应商特定 API、认证、模型目录、语音合成、图像生成、未来视频后端、用量端点
- **渠道 / 功能插件层**：Slack / Discord / voice-call / 等集成，它们消费 core 能力并将其呈现在某个 surface 上

例如，TTS 遵循如下形态：

- core 负责回复时 TTS 策略、回退顺序、偏好设置和渠道投递
- `openai`、`elevenlabs` 和 `microsoft` 负责合成实现
- `voice-call` 消费电话 TTS 运行时辅助器

未来的能力也应优先采用同样的模式。

### 多能力公司插件示例

从外部看，公司插件应当是有内聚性的。如果 OpenClaw 对模型、语音、实时转写、实时语音、媒体理解、图像生成、视频生成、Web 抓取和 Web 搜索都已有共享契约，那么一个供应商就可以在一个地方拥有其所有 surface：

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

重要的不是辅助器名称是否完全一致，而是这种形态：

- 一个插件拥有供应商 surface
- core 仍然拥有能力契约
- 渠道和功能插件消费的是 `api.runtime.*` 辅助器，而不是供应商代码
- 契约测试可以断言该插件确实注册了它声称拥有的那些能力

### 能力示例：视频理解

OpenClaw 已经将图像 / 音频 / 视频理解视为一种共享能力。相同的归属模型也适用于这里：

1. core 定义媒体理解契约
2. 供应商插件按适用情况注册 `describeImage`、`transcribeAudio` 和 `describeVideo`
3. 渠道和功能插件消费共享的 core 行为，而不是直接接入供应商代码

这样可以避免将某个提供商的视频假设硬编码到 core 中。插件拥有供应商 surface；core 拥有能力契约和回退行为。

视频生成已经采用了相同顺序：core 拥有类型化能力契约和运行时辅助器，而供应商插件针对它注册 `api.registerVideoGenerationProvider(...)` 实现。

需要一个具体的推出清单吗？请参见
[能力扩展手册](/zh-CN/plugins/architecture)。

## 契约与强制执行

插件 API surface 被有意设计为类型化，并集中在
`OpenClawPluginApi` 中。该契约定义了受支持的注册点，以及插件可依赖的运行时辅助器。

这为什么重要：

- 插件作者可以获得一个稳定的内部标准
- core 可以拒绝重复归属，例如两个插件注册同一个 provider id
- 启动阶段可以为格式错误的注册提供可操作的诊断信息
- 契约测试可以强制执行内置插件的归属，并防止无声漂移

有两层强制执行：

1. **运行时注册强制执行**
   插件注册表会在插件加载时校验注册。例如：重复的 provider id、重复的语音提供商 id，以及格式错误的注册，都会生成插件诊断，而不是导致未定义行为。
2. **契约测试**
   内置插件会在测试运行期间被捕获到契约注册表中，以便 OpenClaw 能够明确断言归属。目前这已用于模型提供商、语音提供商、Web 搜索提供商和内置注册归属。

实际效果是，OpenClaw 可以预先知道哪个插件拥有哪个 surface。因为归属是声明式、类型化且可测试的，所以 core 和渠道可以无缝组合，而不是依赖隐式约定。

### 什么应属于契约

好的插件契约应当是：

- 类型化
- 小而精
- 能力专用
- 由 core 拥有
- 可被多个插件复用
- 可被渠道 / 功能消费，而无需了解供应商细节

不好的插件契约则是：

- 隐藏在 core 中的供应商专用策略
- 绕过注册表的一次性插件逃生口
- 渠道代码直接深入某个供应商实现
- 不属于 `OpenClawPluginApi` 或
  `api.runtime` 的临时运行时对象

如果拿不准，请提升抽象层级：先定义能力，再让插件接入它。

## 执行模型

原生 OpenClaw 插件与 Gateway 网关**在同一进程内**运行。它们没有被沙箱隔离。已加载的原生插件与 core 代码具有相同的进程级信任边界。

其影响是：

- 原生插件可以注册工具、网络处理器、hooks 和服务
- 原生插件中的 bug 可能导致 Gateway 网关崩溃或失稳
- 恶意原生插件等同于在 OpenClaw 进程内执行任意代码

兼容 bundle 默认更安全，因为 OpenClaw 当前将其视为元数据 / 内容包。在当前版本中，这主要意味着内置 Skills。

对于非内置插件，请使用 allowlist 和显式安装 / 加载路径。请将工作区插件视为开发期代码，而不是生产默认项。

对于内置工作区 package 名，请让插件 id 固定在 npm 名称中：默认使用 `@openclaw/<id>`，或者在 package 有意暴露更窄的插件角色时，使用经过批准的类型化后缀，例如 `-provider`、`-plugin`、`-speech`、`-sandbox` 或 `-media-understanding`。

重要的信任说明：

- `plugins.allow` 信任的是**插件 id**，而不是来源出处。
- 当启用 / allowlist 某个与内置插件同 id 的工作区插件时，它会有意遮蔽内置副本。
- 这属于正常且有用的行为，适用于本地开发、补丁测试和热修复。
- 内置插件信任是根据源码快照解析的——即加载时磁盘上的 manifest 和代码——而不是根据安装元数据。损坏或被替换的安装记录无法在实际源码声明范围之外，悄悄扩大内置插件的信任 surface。

## 导出边界

OpenClaw 导出的是能力，而不是实现便利性。

保持能力注册为公共接口。裁剪非契约辅助器导出：

- 内置插件专用的辅助器子路径
- 不打算作为公共 API 的运行时管线子路径
- 供应商专用便捷辅助器
- 属于实现细节的设置 / 新手引导辅助器

出于兼容性和内置插件维护需要，一些内置插件辅助器子路径仍保留在生成的 SDK 导出映射中。当前示例包括
`plugin-sdk/feishu`、`plugin-sdk/feishu-setup`、`plugin-sdk/zalo`、
`plugin-sdk/zalo-setup` 以及若干 `plugin-sdk/matrix*` seam。请将这些视为保留的实现细节导出，而不是新第三方插件推荐采用的 SDK 模式。

## 内部机制与参考

关于加载流水线、注册表模型、提供商运行时钩子、Gateway 网关 HTTP 路由、message 工具 schema、渠道目标解析、提供商目录、上下文引擎插件，以及添加新能力的指南，请参见
[插件架构内部机制](/zh-CN/plugins/architecture-internals)。

## 相关内容

- [构建插件](/zh-CN/plugins/building-plugins)
- [插件 SDK 设置](/zh-CN/plugins/sdk-setup)
- [插件 manifest](/zh-CN/plugins/manifest)
