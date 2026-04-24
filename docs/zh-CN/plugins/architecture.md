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
    generated_at: "2026-04-24T03:06:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: a10a3fde0468f6341fa044a7e766206a6412bcd8f3349ed8063abf6987301306
    source_path: plugins/architecture.md
    workflow: 15
---

这是 OpenClaw 插件系统的**深度架构参考**。如需实用指南，请先从下面的聚焦页面之一开始。

<CardGroup cols={2}>
  <Card title="安装并使用插件" icon="plug" href="/zh-CN/tools/plugin">
    面向最终用户的指南，用于添加、启用和故障排除插件。
  </Card>
  <Card title="构建插件" icon="rocket" href="/zh-CN/plugins/building-plugins">
    包含最小可用清单的首个插件教程。
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

Capabilities 是 OpenClaw 内部公开的**原生插件**模型。每个原生 OpenClaw 插件都会针对一个或多个能力类型进行注册：

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

如果某个插件注册了零个能力，但提供了 hooks、工具或服务，它就是**仅 legacy hook** 插件。这种模式仍然受到完全支持。

### 外部兼容性立场

能力模型已经在 core 中落地，并已被今天的内置 / 原生插件使用，但外部插件兼容性仍需要比“它已导出，因此它已冻结”更严格的标准。

| 插件情况 | 指导建议 |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 现有外部插件 | 保持基于 hook 的集成继续工作；这是兼容性的基线。 |
| 新的内置 / 原生插件 | 优先使用显式能力注册，而不是面向厂商的特定深入接入或新的仅 hook 设计。 |
| 采用能力注册的外部插件 | 允许这样做，但除非文档将其标记为稳定，否则应将特定能力的辅助接口视为仍在演进中。 |

能力注册是预期方向。对于处于过渡期的外部插件而言，legacy hooks 仍然是最安全、最不容易破坏兼容性的路径。已导出的辅助子路径并不完全等价——应优先选择范围窄、文档化的契约，而不是偶然暴露出来的辅助导出。

### 插件形态

OpenClaw 会根据每个已加载插件的实际注册行为（而不仅仅是静态元数据）将其归类为某种形态：

- **plain-capability**：恰好注册一种能力类型（例如仅提供 provider 的插件 `mistral`）。
- **hybrid-capability**：注册多种能力类型（例如 `openai` 同时拥有文本推理、语音、媒体理解和图像生成）。
- **hook-only**：只注册 hooks（类型化或自定义），不注册能力、工具、命令或服务。
- **non-capability**：注册工具、命令、服务或路由，但不注册能力。

使用 `openclaw plugins inspect <id>` 可以查看插件的形态和能力拆分。详见 [CLI 参考](/zh-CN/cli/plugins#inspect)。

### Legacy hooks

`before_agent_start` hook 仍然作为仅 hook 插件的兼容性路径受到支持。现实中的 legacy 插件仍然依赖它。

方向如下：

- 保持其可用
- 将其记录为 legacy
- 在模型 / provider 覆盖场景中优先使用 `before_model_resolve`
- 在 prompt 变更场景中优先使用 `before_prompt_build`
- 只有在真实使用量下降且 fixture 覆盖证明迁移安全之后才移除

### 兼容性信号

当你运行 `openclaw doctor` 或 `openclaw plugins inspect <id>` 时，可能会看到以下标签之一：

| 信号 | 含义 |
| -------------------------- | ------------------------------------------------------------ |
| **config valid** | 配置解析正常，且插件可成功解析 |
| **compatibility advisory** | 插件使用受支持但较旧的模式（例如 `hook-only`） |
| **legacy warning** | 插件使用了已弃用的 `before_agent_start` |
| **hard error** | 配置无效或插件加载失败 |

`hook-only` 和 `before_agent_start` 目前都不会导致你的插件失效：`hook-only` 只是提示性信息，而 `before_agent_start` 只会触发警告。这些信号也会出现在 `openclaw status --all` 和 `openclaw plugins doctor` 中。

## 架构概览

OpenClaw 的插件系统有四层：

1. **清单 + 发现**
   OpenClaw 会从配置路径、workspace 根目录、全局插件根目录以及内置插件中查找候选插件。设备发现会先读取原生 `openclaw.plugin.json` 清单以及受支持的 bundle 清单。
2. **启用 + 校验**
   Core 决定某个已发现插件是启用、禁用、阻止，还是被选入某个独占槽位（例如 memory）。
3. **运行时加载**
   原生 OpenClaw 插件通过 jiti 在进程内加载，并将能力注册到中央注册表中。兼容的 bundles 会被标准化为注册表记录，而无需导入运行时代码。
4. **表面消费**
   OpenClaw 的其余部分会读取注册表，以暴露工具、渠道、provider 设置、hooks、HTTP 路由、CLI 命令和服务。

对于插件 CLI 而言，根命令发现专门分为两个阶段：

- 解析时元数据来自 `registerCli(..., { descriptors: [...] })`
- 真正的插件 CLI 模块可以保持懒加载，并在首次调用时注册

这样既能将插件拥有的 CLI 代码保留在插件内部，又能让 OpenClaw 在解析前预留根命令名称。

重要的设计边界是：

- 设备发现 + 配置校验应当能够仅基于**清单 / schema 元数据**工作，而无需执行插件代码
- 原生运行时行为来自插件模块的 `register(api)` 路径

这种拆分让 OpenClaw 能够在完整运行时激活之前，就完成配置校验、解释缺失 / 已禁用插件，并构建 UI / schema 提示。

### 渠道插件和共享 message 工具

对于常规聊天操作，渠道插件不需要单独注册发送 / 编辑 / 反应工具。OpenClaw 在 core 中保留了一个共享的 `message` 工具，而渠道插件则拥有其背后的渠道特定发现和执行逻辑。

当前边界如下：

- core 拥有共享 `message` 工具宿主、prompt 接线、session / thread 记账以及执行分发
- 渠道插件拥有作用域内动作发现、能力发现以及任何渠道特定的 schema 片段
- 渠道插件拥有 provider 特定的 session 对话语法，例如会话 id 如何编码 thread id，或如何继承父对话
- 渠道插件通过其动作适配器执行最终动作

对于渠道插件，SDK 接口是 `ChannelMessageActionAdapter.describeMessageTool(...)`。这个统一的发现调用让插件可以一起返回其可见动作、能力和 schema 贡献，从而避免这些部分发生漂移。

当某个渠道特定的 message-tool 参数携带媒体来源（例如本地路径或远程媒体 URL）时，插件还应从 `describeMessageTool(...)` 返回 `mediaSourceParams`。Core 使用这个显式列表来应用沙箱路径标准化和出站媒体访问提示，而不会硬编码插件拥有的参数名。
这里应优先使用按动作划分的映射，而不是某个渠道范围内的单一平面列表，这样仅 profile 使用的媒体参数就不会在 `send` 这类无关动作上被标准化。

Core 会将运行时作用域传入该发现步骤。重要字段包括：

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 受信任的入站 `requesterSenderId`

这对于上下文敏感型插件很重要。一个渠道可以根据当前活跃账号、当前房间 / thread / message，或受信任的请求者身份来隐藏或暴露消息动作，而无需在 core 的 `message` 工具中硬编码渠道特定分支。

这也是为什么嵌入式 runner 路由变更仍然属于插件工作：runner 负责将当前 chat / session 身份转发到插件发现边界，使共享 `message` 工具能够为当前轮次暴露正确的渠道自有表面。

对于渠道拥有的执行辅助工具，内置插件应将执行运行时保留在各自的 extension 模块中。Core 不再拥有位于 `src/agents/tools` 下的 Discord、Slack、Telegram 或 WhatsApp 消息动作运行时。
我们不会发布单独的 `plugin-sdk/*-action-runtime` 子路径，内置插件应直接从各自 extension 拥有的模块中导入本地运行时代码。

同样的边界也适用于一般意义上按 provider 命名的 SDK 接缝：core 不应导入针对 Slack、Discord、Signal、WhatsApp 或类似扩展的渠道特定便捷 barrel。如果 core 需要某项行为，要么消费该内置插件自己的 `api.ts` / `runtime-api.ts` barrel，要么将该需求提升为共享 SDK 中一个范围窄的通用能力。

对于投票，当前有两条执行路径：

- `outbound.sendPoll` 是适用于符合通用投票模型渠道的共享基线
- `actions.handleAction("poll")` 是适用于渠道特定投票语义或额外投票参数的首选路径

现在，只有在插件投票分发拒绝该动作之后，core 才会延后进行共享投票解析，因此插件自有的投票处理器可以接受渠道特定的投票字段，而不会先被通用投票解析器拦住。

完整启动顺序见[加载流水线](#load-pipeline)。

## 能力归属模型

OpenClaw 将一个原生插件视为某个**公司**或某项**功能**的归属边界，而不是一堆互不相关集成的杂物袋。

这意味着：

- 公司插件通常应拥有该公司面向 OpenClaw 的所有表面
- 功能插件通常应拥有其引入的完整功能表面
- 渠道应消费共享的 core 能力，而不是临时重新实现 provider 行为

<Accordion title="内置插件中的归属模式示例">
  - **厂商多能力**：`openai` 拥有文本推理、语音、实时语音、媒体理解和图像生成。`google` 拥有文本推理，以及媒体理解、图像生成和 Web 搜索。`qwen` 拥有文本推理，以及媒体理解和视频生成。
  - **厂商单能力**：`elevenlabs` 和 `microsoft` 拥有语音；`firecrawl` 拥有 Web 抓取；`minimax` / `mistral` / `moonshot` / `zai` 拥有媒体理解后端。
  - **功能插件**：`voice-call` 拥有通话传输、工具、CLI、路由以及 Twilio 媒体流桥接，但它消费共享的语音、实时转录和实时语音能力，而不是直接导入厂商插件。
</Accordion>

预期的最终状态是：

- 即使 OpenAI 横跨文本模型、语音、图像以及未来的视频，它也应存在于一个插件中
- 其他厂商也可以对自己的表面区域采取同样方式
- 渠道并不关心哪个厂商插件拥有该 provider；它们消费的是由 core 暴露的共享能力契约

这就是关键区别：

- **plugin** = 归属边界
- **capability** = 可由多个插件实现或消费的 core 契约

因此，如果 OpenClaw 新增了一个诸如视频之类的新领域，第一个问题不应是“哪个 provider 应该硬编码视频处理？”而应该是“core 的视频能力契约是什么？”一旦这个契约存在，厂商插件就可以针对它注册，渠道 / 功能插件也可以消费它。

如果该能力尚不存在，通常正确的做法是：

1. 在 core 中定义缺失的能力
2. 通过插件 API / 运行时以类型化方式暴露它
3. 让渠道 / 功能围绕该能力完成接线
4. 让厂商插件注册实现

这样可以保持归属明确，同时避免让 core 行为依赖某个单一厂商或某条一次性的插件特定代码路径。

### 能力分层

在决定代码应放在哪里时，可以使用以下思维模型：

- **core 能力层**：共享编排、策略、回退、配置合并规则、交付语义和类型化契约
- **厂商插件层**：厂商特定 API、认证、模型目录、语音合成、图像生成、未来的视频后端、用量端点
- **渠道 / 功能插件层**：Slack / Discord / voice-call / 等集成，它们消费 core 能力并将其呈现在某个表面上

例如，TTS 遵循以下形态：

- core 拥有回复时 TTS 策略、回退顺序、偏好和渠道交付
- `openai`、`elevenlabs` 和 `microsoft` 拥有合成实现
- `voice-call` 消费电话 TTS 运行时辅助工具

未来的能力也应优先采用同样模式。

### 多能力公司插件示例

从外部看，一个公司插件应当具有内聚性。如果 OpenClaw 针对模型、语音、实时转录、实时语音、媒体理解、图像生成、视频生成、Web 抓取和 Web 搜索都有共享契约，那么一个厂商就可以在一个地方拥有它的所有表面：

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

重要的不是确切的辅助函数名称，而是这种形态：

- 一个插件拥有该厂商表面
- core 仍然拥有能力契约
- 渠道和功能插件消费 `api.runtime.*` 辅助工具，而不是厂商代码
- 契约测试可以断言该插件确实注册了它声称拥有的能力

### 能力示例：视频理解

OpenClaw 已经将图像 / 音频 / 视频理解视为一种共享能力。相同的归属模型也适用于这里：

1. core 定义媒体理解契约
2. 厂商插件按适用情况注册 `describeImage`、`transcribeAudio` 和 `describeVideo`
3. 渠道和功能插件消费共享的 core 行为，而不是直接接入厂商代码

这避免了将某个 provider 的视频假设固化进 core。插件拥有厂商表面；core 拥有能力契约和回退行为。

视频生成已经采用同样顺序：core 拥有类型化能力契约和运行时辅助工具，而厂商插件针对它注册 `api.registerVideoGenerationProvider(...)` 实现。

需要具体的发布清单吗？参见[能力扩展手册](/zh-CN/plugins/architecture)。

## 契约与强制执行

插件 API 表面有意在 `OpenClawPluginApi` 中集中并进行类型化。该契约定义了受支持的注册点，以及插件可依赖的运行时辅助工具。

这很重要，因为：

- 插件作者能获得一个稳定的内部标准
- core 可以拒绝重复归属，例如两个插件注册同一个 provider id
- 启动时可以为格式错误的注册暴露可执行的诊断信息
- 契约测试可以强制约束内置插件的归属，并防止无声漂移

这里有两层强制执行：

1. **运行时注册强制执行**
   插件加载时，插件注册表会校验注册内容。例如：重复的 provider id、重复的语音 provider id，以及格式错误的注册，都会产生插件诊断，而不是导致未定义行为。
2. **契约测试**
   在测试运行期间，内置插件会被捕获到契约注册表中，以便 OpenClaw 可以显式断言归属。当前，这用于模型 provider、语音 provider、Web 搜索 provider 以及内置注册归属。

实际效果是，OpenClaw 能够预先知道哪个插件拥有哪个表面。这让 core 和渠道可以无缝组合，因为归属是声明式的、类型化的且可测试，而不是隐式的。

### 什么应属于契约

好的插件契约应当：

- 有类型
- 小而精
- 以能力为中心
- 由 core 拥有
- 可被多个插件复用
- 可被渠道 / 功能消费，而无需了解厂商细节

糟糕的插件契约则是：

- 隐藏在 core 中的厂商特定策略
- 绕过注册表的一次性插件逃生口
- 渠道代码直接深入厂商实现
- 不属于 `OpenClawPluginApi` 或 `api.runtime` 的临时运行时对象

如果拿不准，就提升抽象层级：先定义能力，再让插件接入它。

## 执行模型

原生 OpenClaw 插件在 Gateway 网关中**进程内**运行。它们不进行沙箱隔离。已加载的原生插件与 core 代码具有相同的进程级信任边界。

影响包括：

- 原生插件可以注册工具、网络处理器、hooks 和服务
- 原生插件中的 bug 可能导致 gateway 崩溃或不稳定
- 恶意原生插件等同于在 OpenClaw 进程内部执行任意代码

兼容 bundles 默认更安全，因为 OpenClaw 目前将它们视为元数据 / 内容包。在当前版本中，这主要意味着内置 Skills。

对于非内置插件，请使用 allowlist 和显式的安装 / 加载路径。应将 workspace 插件视为开发期代码，而非生产默认值。

对于内置 workspace 包名，应让插件 id 锚定在 npm 名称中：默认使用 `@openclaw/<id>`，或者在包有意暴露更窄的插件角色时，使用获批的类型化后缀，例如 `-provider`、`-plugin`、`-speech`、`-sandbox` 或 `-media-understanding`。

重要的信任说明：

- `plugins.allow` 信任的是**插件 id**，而不是来源出处。
- 当某个与内置插件具有相同 id 的 workspace 插件被启用 / 加入 allowlist 时，它会有意覆盖内置副本。
- 这很正常，也对本地开发、补丁测试和热修复很有用。
- 内置插件信任是根据源代码快照解析的——也就是加载时磁盘上的清单和代码——而不是根据安装元数据解析。损坏或被替换的安装记录，不能在实际源代码声明范围之外，悄悄扩大某个内置插件的信任表面。

## 导出边界

OpenClaw 导出的是能力，而不是实现便利性。

保持能力注册为公开接口。精简非契约辅助导出：

- 内置插件特定的辅助子路径
- 不打算作为公共 API 的运行时管线子路径
- 厂商特定的便捷辅助工具
- 属于实现细节的设置 / 新手引导辅助工具

出于兼容性和内置插件维护的原因，一些内置插件辅助子路径仍保留在生成的 SDK 导出映射中。当前示例包括 `plugin-sdk/feishu`、`plugin-sdk/feishu-setup`、`plugin-sdk/zalo`、`plugin-sdk/zalo-setup`，以及若干 `plugin-sdk/matrix*` 接缝。应将这些视为保留的实现细节导出，而不是新第三方插件推荐采用的 SDK 模式。

## 内部机制与参考

关于加载流水线、注册表模型、provider 运行时钩子、Gateway 网关 HTTP 路由、消息工具 schema、渠道目标解析、provider 目录、上下文引擎插件以及新增能力的指南，请参见[插件架构内部机制](/zh-CN/plugins/architecture-internals)。

## 相关内容

- [构建插件](/zh-CN/plugins/building-plugins)
- [插件 SDK 设置](/zh-CN/plugins/sdk-setup)
- [插件清单](/zh-CN/plugins/manifest)
