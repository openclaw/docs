---
read_when:
    - 构建或调试原生 OpenClaw 插件
    - 理解插件能力模型或归属边界
    - 处理插件加载流水线或注册表
    - 实现提供商运行时钩子或渠道插件
sidebarTitle: Internals
summary: 插件内部机制：能力模型、归属关系、契约、加载流水线和运行时辅助工具
title: 插件内部机制
x-i18n:
    generated_at: "2026-04-28T01:34:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5d873bdab58b2d5d5c699fedb174e7f8db914245bf9052ff467bbe3cabc66dc4
    source_path: plugins/architecture.md
    workflow: 15
---

这是 OpenClaw 插件系统的**深度架构参考**。如需实用指南，请先从下面这些聚焦页面之一开始。

<CardGroup cols={2}>
  <Card title="安装并使用插件" icon="plug" href="/zh-CN/tools/plugin">
    面向最终用户的指南，介绍如何添加、启用以及故障排除插件。
  </Card>
  <Card title="构建插件" icon="rocket" href="/zh-CN/plugins/building-plugins">
    以最小可用清单为起点的首个插件教程。
  </Card>
  <Card title="渠道插件" icon="comments" href="/zh-CN/plugins/sdk-channel-plugins">
    构建一个消息渠道插件。
  </Card>
  <Card title="提供商插件" icon="microchip" href="/zh-CN/plugins/sdk-provider-plugins">
    构建一个模型提供商插件。
  </Card>
  <Card title="SDK 概览" icon="book" href="/zh-CN/plugins/sdk-overview">
    导入映射和注册 API 参考。
  </Card>
</CardGroup>

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
| 渠道 / 消息传递 | `api.registerChannel(...)` | `msteams`, `matrix` |
| Gateway 网关发现 | `api.registerGatewayDiscoveryService(...)` | `bonjour` |

<Note>
如果一个插件注册了零个能力，但提供钩子、工具、发现服务或后台服务，那么它就是一个**仅 legacy hook-only** 插件。该模式仍然被完全支持。
</Note>

### 外部兼容性立场

能力模型已经在核心中落地，并且当前已被内置 / 原生插件使用，但外部插件兼容性仍然需要比“它已导出，因此它已冻结”更严格的标准。

| 插件情况 | 指南 |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 现有外部插件 | 保持基于钩子的集成可正常工作；这是兼容性的基线。 |
| 新的内置 / 原生插件 | 优先使用显式能力注册，而不是特定厂商的深度耦合方式或新的仅 hook-only 设计。 |
| 采用能力注册的外部插件 | 允许，但除非文档明确标记为稳定，否则应将能力专用的辅助接口视为仍在演进中。 |

能力注册是预期的发展方向。在过渡期间，对于外部插件而言，legacy hooks 仍然是最安全、最不容易破坏兼容性的路径。并非所有导出的辅助子路径都具有同等稳定性——应优先使用文档化的、范围明确的契约，而不是偶然导出的辅助接口。

### 插件形态

OpenClaw 会根据每个已加载插件的实际注册行为，将其归类为某种形态（而不仅仅依据静态元数据）：

<AccordionGroup>
  <Accordion title="plain-capability">
    恰好注册一种能力类型（例如像 `mistral` 这样的仅提供商插件）。
  </Accordion>
  <Accordion title="hybrid-capability">
    注册多种能力类型（例如 `openai` 同时拥有文本推理、语音、媒体理解和图像生成）。
  </Accordion>
  <Accordion title="hook-only">
    仅注册钩子（类型化或自定义），不注册能力、工具、命令或服务。
  </Accordion>
  <Accordion title="non-capability">
    注册工具、命令、服务或路由，但不注册任何能力。
  </Accordion>
</AccordionGroup>

使用 `openclaw plugins inspect <id>` 可查看插件的形态和能力细分。详情请参见 [CLI 参考](/zh-CN/cli/plugins#inspect)。

### Legacy hooks

`before_agent_start` 钩子仍然作为 hook-only 插件的兼容路径受到支持。现实中的 legacy 插件仍然依赖它。

方向如下：

- 保持其可用
- 将其文档化为 legacy
- 对于模型 / 提供商覆盖相关工作，优先使用 `before_model_resolve`
- 对于提示词修改相关工作，优先使用 `before_prompt_build`
- 只有在真实使用量下降且夹具覆盖证明迁移安全之后，才移除它

### 兼容性信号

当你运行 `openclaw doctor` 或 `openclaw plugins inspect <id>` 时，可能会看到以下标签之一：

| 信号 | 含义 |
| -------------------------- | ------------------------------------------------------------ |
| **配置有效** | 配置解析正常，且插件可成功解析 |
| **兼容性提示** | 插件使用了受支持但较旧的模式（例如 `hook-only`） |
| **legacy 警告** | 插件使用了 `before_agent_start`，该接口已弃用 |
| **硬错误** | 配置无效，或插件加载失败 |

目前，`hook-only` 和 `before_agent_start` 都不会让你的插件失效：`hook-only` 只是提示，`before_agent_start` 只会触发警告。这些信号也会出现在 `openclaw status --all` 和 `openclaw plugins doctor` 中。

## 架构概览

OpenClaw 的插件系统有四层：

<Steps>
  <Step title="清单 + 设备发现">
    OpenClaw 会从已配置路径、工作区根目录、全局插件根目录以及内置插件中查找候选插件。设备发现会首先读取原生 `openclaw.plugin.json` 清单以及受支持的 bundle 清单。
  </Step>
  <Step title="启用 + 验证">
    核心决定某个已发现插件是启用、禁用、阻止，还是被选入某个独占槽位（例如 memory）。
  </Step>
  <Step title="运行时加载">
    原生 OpenClaw 插件通过 jiti 在进程内加载，并将能力注册到中央注册表中。兼容的 bundle 会被规范化为注册表记录，而无需导入运行时代码。
  </Step>
  <Step title="表面消费">
    OpenClaw 的其余部分会读取注册表，以暴露工具、渠道、提供商设置、钩子、HTTP 路由、CLI 命令和服务。
  </Step>
</Steps>

对于插件 CLI 而言，根命令的发现被拆分为两个阶段：

- 解析时元数据来自 `registerCli(..., { descriptors: [...] })`
- 真正的插件 CLI 模块可以保持懒加载，并在首次调用时再注册

这让插件自有的 CLI 代码仍然保留在插件内部，同时又允许 OpenClaw 在解析前预留根命令名称。

重要的设计边界是：

- 清单 / 配置验证应当基于**清单 / schema 元数据**完成，而无需执行插件代码
- 原生能力发现可以加载受信任的插件入口代码，以构建一个不会激活的注册表快照
- 原生运行时行为来自插件模块的 `register(api)` 路径，且此时 `api.registrationMode === "full"`

这种拆分让 OpenClaw 能够在完整运行时激活之前，就完成配置验证、解释缺失 / 已禁用的插件，并构建 UI / schema 提示。

### 插件元数据快照和查找表

Gateway 网关启动时，会为当前配置快照构建一个 `PluginMetadataSnapshot`。该快照仅包含元数据：它存储已安装插件索引、清单注册表、清单诊断信息、归属映射、插件 id 规范化器以及清单记录。它不保存已加载的插件模块、提供商 SDK、包内容或运行时导出。

面向插件的配置验证、启动时自动启用以及 Gateway 网关插件引导流程都会消费这个快照，而不是各自独立重建清单 / 索引元数据。`PluginLookUpTable` 也从同一个快照派生而来，并为当前运行时配置补充启动插件计划。

启动之后，Gateway 网关会将当前元数据快照作为可替换的运行时产物保留。重复的运行时提供商发现可以复用该快照，而不必在每次提供商目录扫描时都重新构建已安装索引和清单注册表。在 Gateway 网关关闭、配置 / 插件清单变更以及已安装索引写入时，该快照会被清除或替换；如果当前不存在兼容快照，调用方会回退到冷路径的清单 / 索引流程。兼容性检查必须包含插件发现根目录，例如 `plugins.load.paths` 和默认的 Agent 工作区，因为工作区插件属于元数据作用域的一部分。

快照和查找表会将重复的启动决策保持在快速路径上：

- 渠道归属
- 延迟渠道启动
- 启动插件 id
- 提供商和 CLI 后端归属
- 设置提供商、命令别名、模型目录提供商以及清单契约归属
- 插件配置 schema 和渠道配置 schema 验证
- 启动时自动启用决策

安全边界在于快照替换，而不是原地变更。配置、插件清单、安装记录或持久化索引策略变化时，应重建快照。不要将其视为一个广义的可变全局注册表，也不要保留无界的历史快照。运行时插件加载仍然与元数据快照分离，因此过期的运行时状态无法被隐藏在元数据缓存之后。

某些冷路径调用方仍会直接依据持久化的已安装插件索引来重建清单注册表，而不是接收来自 Gateway 网关的 `PluginLookUpTable`。该回退路径会维护一个小型的、有界的内存缓存，其键由已安装索引、请求形态、配置策略、运行时根目录以及清单 / 包文件签名组成。它是针对重复索引重建的回退安全网，而不是首选的 Gateway 网关热路径。若调用方已经持有当前查找表或显式清单注册表，应优先将其沿着运行时流程继续传递。

### 激活规划

激活规划属于控制平面的一部分。调用方可以在加载更广泛的运行时注册表之前，先询问哪些插件与某个具体命令、提供商、渠道、路由、Agent harness 或能力相关。

规划器会保持当前清单行为的兼容性：

- `activation.*` 字段是显式的规划器提示
- `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 以及 hooks 仍然是清单归属的回退机制
- 仅返回 id 的规划器 API 仍然对现有调用方可用
- 计划 API 会报告原因标签，以便诊断能够区分显式提示和归属回退

<Warning>
不要将 `activation` 视为生命周期钩子，也不要将其视为 `register(...)` 的替代品。它是用于缩小加载范围的元数据。若归属字段已经能够描述这种关系，应优先使用归属字段；仅在需要额外规划器提示时才使用 `activation`。
</Warning>

### 渠道插件和共享消息工具

渠道插件在执行常规聊天操作时，不需要单独注册 send / edit / react 工具。OpenClaw 在核心中保留了一个共享的 `message` 工具，而渠道插件负责其背后的渠道专属发现与执行。

当前的边界如下：

- 核心拥有共享 `message` 工具宿主、提示词接线、会话 / 线程簿记以及执行分发
- 渠道插件拥有作用域化的动作发现、能力发现，以及任何渠道专属的 schema 片段
- 渠道插件拥有提供商专属的会话对话语法，例如会话 id 如何编码线程 id，或如何从父级会话继承
- 渠道插件通过其动作适配器执行最终动作

对于渠道插件，SDK 接口是 `ChannelMessageActionAdapter.describeMessageTool(...)`。这个统一的发现调用允许插件将其可见动作、能力和 schema 扩展一起返回，从而避免这些部分彼此漂移。

当某个渠道专属的消息工具参数携带媒体源，例如本地路径或远程媒体 URL，插件还应从 `describeMessageTool(...)` 返回 `mediaSourceParams`。核心使用这个显式列表来应用沙箱路径规范化和出站媒体访问提示，而无需硬编码插件自有的参数名。这里应优先使用按动作划分的映射，而不是整个渠道范围内的扁平列表，这样仅用于 profile 的媒体参数就不会在 `send` 这类无关动作上被规范化。

核心会将运行时作用域传入这个发现步骤。重要字段包括：

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 受信任的入站 `requesterSenderId`

这对上下文敏感型插件很重要。渠道可以根据当前活跃账号、当前房间 / 线程 / 消息，或受信任的请求方身份，隐藏或暴露消息动作，而无需在核心 `message` 工具中硬编码渠道专属分支。

这也是为什么嵌入式 runner 路由变更仍然属于插件工作：runner 负责将当前聊天 / 会话身份转发到插件发现边界，这样共享的 `message` 工具才能在当前轮次暴露正确的、由渠道拥有的能力表面。

对于渠道自有的执行辅助工具，内置插件应将执行运行时保留在各自的 extension 模块内部。核心不再在 `src/agents/tools` 下拥有 Discord、Slack、Telegram 或 WhatsApp 的消息动作运行时。我们不会发布单独的 `plugin-sdk/*-action-runtime` 子路径，内置插件应直接从各自 extension 自有模块导入本地运行时代码。

同样的边界也适用于一般性的、按提供商命名的 SDK 接缝：核心不应导入面向 Slack、Discord、Signal、WhatsApp 或类似扩展的渠道专属便捷 barrel。如果核心需要某种行为，应当要么消费该内置插件自己的 `api.ts` / `runtime-api.ts` barrel，要么将该需求提升为共享 SDK 中一个狭义的通用能力。

内置插件也遵循同样规则。某个内置插件的 `runtime-api.ts` 不应重新导出其自有品牌化的 `openclaw/plugin-sdk/<plugin-id>` facade。这些带品牌的 facade 仍然作为外部插件和旧消费者的兼容性垫片存在，但内置插件应使用本地导出以及狭义的通用 SDK 子路径，例如 `openclaw/plugin-sdk/channel-policy`、`openclaw/plugin-sdk/runtime-store` 或 `openclaw/plugin-sdk/webhook-ingress`。除非现有外部生态的兼容性边界确有要求，否则新代码不应新增按 plugin-id 划分的 SDK facade。

对于投票，当前有两条执行路径：

- `outbound.sendPoll` 是适用于符合通用投票模型渠道的共享基线
- `actions.handleAction("poll")` 是处理渠道专属投票语义或额外投票参数的首选路径

现在，核心会在插件投票分发拒绝该动作之后，才回退到共享投票解析，因此由插件拥有的投票处理器可以接受渠道专属投票字段，而不会先被通用投票解析器拦住。

完整的启动顺序请参见 [插件架构内部机制](/zh-CN/plugins/architecture-internals)。

## 能力归属模型

OpenClaw 将一个原生插件视为某个**公司**或某个**功能**的归属边界，而不是一堆互不相关集成的杂物袋。

这意味着：

- 一个公司插件通常应拥有该公司的所有面向 OpenClaw 的表面
- 一个功能插件通常应拥有它所引入功能的完整表面
- 渠道应消费共享的核心能力，而不是临时重新实现提供商行为

<AccordionGroup>
  <Accordion title="Vendor multi-capability">
    `openai` 拥有文本推理、语音、实时语音、媒体理解和图像生成。`google` 拥有文本推理，以及媒体理解、图像生成和 Web 搜索。`qwen` 拥有文本推理，以及媒体理解和视频生成。
  </Accordion>
  <Accordion title="Vendor single-capability">
    `elevenlabs` 和 `microsoft` 拥有语音；`firecrawl` 拥有 Web 抓取；`minimax` / `mistral` / `moonshot` / `zai` 拥有媒体理解后端。
  </Accordion>
  <Accordion title="Feature plugin">
    `voice-call` 拥有通话传输、工具、CLI、路由以及 Twilio 媒体流桥接，但它消费共享的语音、实时转录和实时语音能力，而不是直接导入厂商插件。
  </Accordion>
</AccordionGroup>

预期的最终状态是：

- 即使 OpenAI 横跨文本模型、语音、图像和未来的视频，它也存在于一个插件中
- 其他厂商也可以为自己的能力范围采用同样方式
- 渠道不关心是哪个厂商插件拥有该提供商；它们消费的是核心暴露的共享能力契约

这里的关键区别是：

- **plugin** = 归属边界
- **capability** = 可由多个插件实现或消费的核心契约

所以，如果 OpenClaw 新增了一个视频之类的领域，首要问题不是“哪个提供商应该硬编码视频处理？”。首要问题是“核心的视频能力契约是什么？”。一旦该契约存在，厂商插件就可以针对它注册，而渠道 / 功能插件也可以消费它。

如果该能力尚不存在，通常正确的做法是：

<Steps>
  <Step title="定义能力">
    在核心中定义缺失的能力。
  </Step>
  <Step title="通过 SDK 暴露">
    以类型化方式通过插件 API / 运行时暴露它。
  </Step>
  <Step title="接线消费者">
    让渠道 / 功能围绕该能力接线。
  </Step>
  <Step title="厂商实现">
    让厂商插件注册实现。
  </Step>
</Steps>

这可以保持归属关系明确，同时避免核心行为依赖单一厂商或某条一次性的插件专属代码路径。

### 能力分层

在决定代码归属位置时，请使用以下心智模型：

<Tabs>
  <Tab title="Core capability layer">
    共享编排、策略、回退、配置合并规则、投递语义以及类型化契约。
  </Tab>
  <Tab title="Vendor plugin layer">
    厂商专属 API、认证、模型目录、语音合成、图像生成、未来的视频后端、用量端点。
  </Tab>
  <Tab title="Channel/feature plugin layer">
    Slack / Discord / voice-call / 等集成，它们消费核心能力并在某个表面上呈现出来。
  </Tab>
</Tabs>

例如，TTS 遵循这种形态：

- 核心拥有回复时 TTS 策略、回退顺序、偏好和渠道投递
- `openai`、`elevenlabs` 和 `microsoft` 拥有合成实现
- `voice-call` 消费电话 TTS 运行时辅助工具

未来的能力也应优先采用同样模式。

### 多能力公司插件示例

一个公司插件从外部看应当是有凝聚力的。如果 OpenClaw 对模型、语音、实时转录、实时语音、媒体理解、图像生成、视频生成、Web 抓取和 Web 搜索都提供了共享契约，那么某个厂商就可以在一个地方拥有其所有表面：

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

- 一个插件拥有该厂商的能力表面
- 核心仍然拥有能力契约
- 渠道和功能插件消费 `api.runtime.*` 辅助工具，而不是厂商代码
- 契约测试可以断言该插件确实注册了它声称拥有的能力

### 能力示例：视频理解

OpenClaw 已经将图像 / 音频 / 视频理解视为一种共享能力。同样的归属模型也适用于这里：

<Steps>
  <Step title="核心定义契约">
    核心定义媒体理解契约。
  </Step>
  <Step title="厂商插件注册">
    厂商插件按需注册 `describeImage`、`transcribeAudio` 和 `describeVideo`。
  </Step>
  <Step title="消费者使用共享行为">
    渠道和功能插件消费共享的核心行为，而不是直接接入厂商代码。
  </Step>
</Steps>

这样可以避免将某个提供商的视频假设固化进核心。插件拥有厂商表面；核心拥有能力契约和回退行为。

视频生成已经采用了同样的顺序：核心拥有类型化能力契约和运行时辅助工具，而厂商插件针对它注册 `api.registerVideoGenerationProvider(...)` 实现。

需要一个具体的发布清单吗？请参见 [能力扩展手册](/zh-CN/plugins/architecture)。

## 契约与约束执行

插件 API 表面有意保持类型化，并集中于 `OpenClawPluginApi`。该契约定义了受支持的注册点，以及插件可依赖的运行时辅助工具。

这很重要，因为：

- 插件作者会得到一个稳定的内部标准
- 核心可以拒绝重复归属，例如两个插件注册同一个提供商 id
- 启动过程可以为格式错误的注册暴露可操作的诊断信息
- 契约测试可以强制执行内置插件的归属关系，并防止静默漂移

这里有两层约束执行：

<AccordionGroup>
  <Accordion title="Runtime registration enforcement">
    插件注册表会在插件加载时验证各项注册。例如：重复的提供商 id、重复的语音提供商 id，以及格式错误的注册，都会产生插件诊断信息，而不是导致未定义行为。
  </Accordion>
  <Accordion title="Contract tests">
    在测试运行期间，内置插件会被捕获到契约注册表中，这样 OpenClaw 就能显式断言归属关系。目前这已用于模型提供商、语音提供商、Web 搜索提供商以及内置注册归属。
  </Accordion>
</AccordionGroup>

实际效果是，OpenClaw 可以预先知道哪个插件拥有哪个表面。这样核心和渠道就能无缝组合，因为归属关系是声明式的、类型化的、可测试的，而不是隐式的。

### 什么应该属于契约

<Tabs>
  <Tab title="良好的契约">
    - 类型化
    - 小而精
    - 能力专属
    - 由核心拥有
    - 可被多个插件复用
    - 可被渠道 / 功能消费，而无需了解厂商细节
  </Tab>
  <Tab title="糟糕的契约">
    - 隐藏在核心中的厂商专属策略
    - 绕过注册表的一次性插件逃生口
    - 直接深入厂商实现的渠道代码
    - 不属于 `OpenClawPluginApi` 或 `api.runtime` 的临时运行时对象
  </Tab>
</Tabs>

如有疑问，就提升抽象层级：先定义能力，再让插件接入它。

## 执行模型

原生 OpenClaw 插件与 Gateway 网关**在同一进程内**运行。它们不受沙箱隔离。一个已加载的原生插件与核心代码处于相同的进程级信任边界内。

<Warning>
影响：

- 原生插件可以注册工具、网络处理器、钩子和服务
- 原生插件中的 bug 可能导致 Gateway 网关崩溃或不稳定
- 恶意原生插件等同于在 OpenClaw 进程内部执行任意代码
</Warning>

兼容 bundle 默认更安全，因为 OpenClaw 当前将它们视为元数据 / 内容包。在当前版本中，这主要意味着内置 Skills。

对于非内置插件，请使用 allowlist 和显式的安装 / 加载路径。应将工作区插件视为开发期代码，而不是生产默认项。

对于内置工作区包名，请保持插件 id 锚定在 npm 名称中：默认使用 `@openclaw/<id>`，或者在包有意暴露更窄的插件角色时，使用已批准的类型化后缀，例如 `-provider`、`-plugin`、`-speech`、`-sandbox` 或 `-media-understanding`。

<Note>
**信任说明：**

- `plugins.allow` 信任的是**插件 id**，而不是来源出处。
- 当启用 / 加入 allowlist 的工作区插件与某个内置插件拥有相同 id 时，该工作区插件会有意覆盖内置副本。
- 这在本地开发、补丁测试和热修复中是正常且有用的。
- 内置插件信任是根据源码快照来解析的——也就是加载时磁盘上的清单和代码——而不是根据安装元数据解析。损坏或被替换的安装记录，无法在实际源码声明之外悄悄扩大内置插件的信任表面。
</Note>

## 导出边界

OpenClaw 导出的是能力，而不是实现便利工具。

应保持能力注册为公共接口。应裁剪非契约型辅助导出：

- 内置插件专属的辅助子路径
- 不打算作为公共 API 的运行时管线子路径
- 厂商专属的便捷辅助工具
- 属于实现细节的 setup / onboarding 辅助工具

出于兼容性和内置插件维护的需要，一些内置插件辅助子路径仍然保留在生成的 SDK 导出映射中。当前示例包括 `plugin-sdk/feishu`、`plugin-sdk/feishu-setup`、`plugin-sdk/zalo`、`plugin-sdk/zalo-setup`、`plugin-sdk/bundled-channel-config-schema`、`plugin-sdk/channel-config-schema-legacy` 以及若干 `plugin-sdk/matrix*` 接缝。应将这些视为已弃用或保留导出，而不是新第三方插件推荐采用的 SDK 模式。

## 内部机制与参考

如需了解加载流水线、注册表模型、提供商运行时钩子、Gateway 网关 HTTP 路由、消息工具 schema、渠道目标解析、提供商目录、上下文引擎插件，以及新增能力的指南，请参见 [插件架构内部机制](/zh-CN/plugins/architecture-internals)。

## 相关内容

- [构建插件](/zh-CN/plugins/building-plugins)
- [插件清单](/zh-CN/plugins/manifest)
- [插件 SDK 设置](/zh-CN/plugins/sdk-setup)
