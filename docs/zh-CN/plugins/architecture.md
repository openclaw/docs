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
    generated_at: "2026-04-27T16:07:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 846b3ec4ddd38b87c7b4f5e039556373075d058013ed568175e8fd1b6de2aa4d
    source_path: plugins/architecture.md
    workflow: 15
---

这是 OpenClaw 插件系统的**深度架构参考**。如需实用指南，请先从下面的聚焦页面之一开始。

<CardGroup cols={2}>
  <Card title="安装和使用插件" icon="plug" href="/zh-CN/tools/plugin">
    面向最终用户的指南，介绍如何添加、启用和排查插件问题。
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
    导入映射和注册 API 参考。
  </Card>
</CardGroup>

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
| Gateway 网关发现 | `api.registerGatewayDiscoveryService(...)` | `bonjour` |

<Note>
注册零个能力、但提供钩子、工具、发现服务或后台服务的插件，属于**传统仅钩子**插件。该模式目前仍然受到完整支持。
</Note>

### 外部兼容性立场

能力模型已经落地到核心中，并且当前已被内置 / 原生插件使用，但外部插件兼容性仍需要比“已导出，因此已冻结”更严格的标准。

| 插件情况 | 指导建议 |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 现有外部插件 | 保持基于钩子的集成继续可用；这是兼容性的基线。 |
| 新的内置 / 原生插件 | 优先选择显式能力注册，而不是特定厂商的内部接入或新的仅钩子设计。 |
| 采用能力注册的外部插件 | 允许，但除非文档将其标记为稳定，否则应将能力专用的辅助接口视为仍在演进中。 |

能力注册是既定方向。在过渡期间，传统钩子仍是对外部插件最安全、最不易破坏兼容性的路径。并非所有已导出的辅助子路径都同等稳定——应优先使用范围狭窄且有文档说明的契约，而不是偶然暴露出来的辅助导出。

### 插件形态

OpenClaw 会根据每个已加载插件的实际注册行为（而不只是静态元数据）将其归类为某种形态：

<AccordionGroup>
  <Accordion title="plain-capability">
    只注册一种能力类型（例如仅提供商插件 `mistral`）。
  </Accordion>
  <Accordion title="hybrid-capability">
    注册多种能力类型（例如 `openai` 同时拥有文本推理、语音、媒体理解和图像生成）。
  </Accordion>
  <Accordion title="hook-only">
    只注册钩子（类型化或自定义），不注册能力、工具、命令或服务。
  </Accordion>
  <Accordion title="non-capability">
    注册工具、命令、服务或路由，但不注册能力。
  </Accordion>
</AccordionGroup>

使用 `openclaw plugins inspect <id>` 可以查看插件的形态和能力明细。详见 [CLI 参考](/zh-CN/cli/plugins#inspect)。

### 传统钩子

`before_agent_start` 钩子仍作为兼容路径受到支持，适用于仅钩子插件。现实中的传统插件仍依赖它。

方向如下：

- 保持其可用
- 在文档中将其标记为传统方式
- 对于模型 / 提供商覆盖工作，优先使用 `before_model_resolve`
- 对于提示词变更工作，优先使用 `before_prompt_build`
- 只有在真实使用量下降且夹具覆盖证明迁移安全后才移除

### 兼容性信号

运行 `openclaw doctor` 或 `openclaw plugins inspect <id>` 时，你可能会看到以下标签之一：

| 信号 | 含义 |
| -------------------------- | ------------------------------------------------------------ |
| **配置有效** | 配置解析正常，且插件可以被解析 |
| **兼容性提示** | 插件使用了受支持但较旧的模式（例如 `hook-only`） |
| **传统警告** | 插件使用了已弃用的 `before_agent_start` |
| **严重错误** | 配置无效，或插件加载失败 |

`hook-only` 和 `before_agent_start` 目前都不会破坏你的插件：`hook-only` 只是提示，`before_agent_start` 只会触发警告。这些信号也会出现在 `openclaw status --all` 和 `openclaw plugins doctor` 中。

## 架构概览

OpenClaw 的插件系统包含四层：

<Steps>
  <Step title="清单 + 发现">
    OpenClaw 会从已配置路径、工作区根目录、全局插件根目录以及内置插件中查找候选插件。设备发现会优先读取原生 `openclaw.plugin.json` 清单以及受支持的 bundle 清单。
  </Step>
  <Step title="启用 + 校验">
    核心决定某个已发现插件是启用、禁用、阻止，还是被选中用于某个独占槽位，例如 memory。
  </Step>
  <Step title="运行时加载">
    原生 OpenClaw 插件通过 jiti 在进程内加载，并将能力注册到中央注册表中。兼容的 bundle 会在不导入运行时代码的情况下被标准化为注册表记录。
  </Step>
  <Step title="表面消费">
    OpenClaw 的其余部分会读取注册表，以暴露工具、渠道、提供商设置、钩子、HTTP 路由、CLI 命令和服务。
  </Step>
</Steps>

对于插件 CLI，根命令发现被拆分为两个阶段：

- 解析时元数据来自 `registerCli(..., { descriptors: [...] })`
- 真正的插件 CLI 模块可以保持懒加载，并在首次调用时注册

这样既能将插件自有的 CLI 代码保留在插件内部，又能让 OpenClaw 在解析前预留根命令名称。

重要的设计边界如下：

- 清单 / 配置校验应基于**清单 / 模式元数据**完成，而不执行插件代码
- 原生能力发现可以加载受信任的插件入口代码，以构建一个不会激活的注册表快照
- 原生运行时行为来自插件模块的 `register(api)` 路径，并带有 `api.registrationMode === "full"`

这种拆分使 OpenClaw 能够在完整运行时激活之前，先校验配置、解释缺失 / 已禁用的插件，并构建 UI / 模式提示。

### 插件元数据快照和查找表

Gateway 网关启动时会为当前配置快照构建一个 `PluginMetadataSnapshot`。该快照仅包含元数据：它存储已安装插件索引、清单注册表、清单诊断信息、所有者映射、插件 id 标准化器以及清单记录。它不持有已加载的插件模块、提供商 SDK、包内容或运行时导出。

具备插件感知能力的配置校验、启动自动启用和 Gateway 网关插件引导都使用这个快照，而不是各自独立重建清单 / 索引元数据。`PluginLookUpTable` 由同一个快照派生而来，并为当前运行时配置增加了启动插件计划。

快照和查找表能让重复的启动决策保持在快速路径上：

- 渠道所有权
- 延迟渠道启动
- 启动插件 id
- 提供商和 CLI 后端所有权
- 设置提供商、命令别名、模型目录提供商以及清单契约所有权
- 插件配置模式和渠道配置模式校验
- 启动自动启用决策

安全边界在于快照替换，而不是突变修改。当配置、插件清单、安装记录或持久化索引策略发生变化时，应重建快照。不要将它视为一个广泛可变的全局注册表，也不要保留无限增长的历史快照。运行时插件加载仍与元数据快照分离，因此过时的运行时状态不会被元数据缓存掩盖。

一些冷路径调用方仍会直接根据持久化的已安装插件索引重建清单注册表，而不是接收 Gateway 网关的 `PluginLookUpTable`。该回退路径保留了一个小型、有界的内存缓存，其键由已安装索引、请求形态、配置策略、运行时根目录以及清单 / 包文件签名组成。它是为重复索引重建提供的回退安全网，而不是首选的 Gateway 网关热路径。当调用方已经拥有当前查找表时，应优先在运行时流程中传递该查找表或显式的清单注册表。

### 激活规划

激活规划是控制平面的一部分。调用方可以在加载更广泛的运行时注册表之前，先查询哪些插件与某个具体命令、提供商、渠道、路由、Agent harness 或能力相关。

规划器保持与当前清单行为兼容：

- `activation.*` 字段是显式的规划器提示
- `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 和钩子仍然是清单所有权回退
- 仅返回 id 的规划器 API 仍对现有调用方可用
- 计划 API 会报告原因标签，以便诊断信息区分显式提示和所有权回退

<Warning>
不要将 `activation` 视为生命周期钩子，也不要把它当作 `register(...)` 的替代品。它是用于缩小加载范围的元数据。若所有权字段已经能够描述关系，应优先使用所有权字段；仅在需要额外规划器提示时才使用 `activation`。
</Warning>

### 渠道插件和共享消息工具

渠道插件在执行常规聊天操作时，不需要单独注册发送 / 编辑 / 响应工具。OpenClaw 在核心中保留了一个共享的 `message` 工具，而渠道插件负责其背后的渠道专属发现与执行。

当前边界如下：

- 核心拥有共享 `message` 工具宿主、提示词接线、会话 / 线程簿记以及执行分发
- 渠道插件拥有作用域动作发现、能力发现，以及任何渠道专属的模式片段
- 渠道插件拥有提供商专属的会话对话语法，例如对话 id 如何编码线程 id 或如何从父对话继承
- 渠道插件通过其动作适配器执行最终动作

对于渠道插件，SDK 接口是 `ChannelMessageActionAdapter.describeMessageTool(...)`。这个统一的发现调用允许插件将其可见动作、能力和模式贡献一起返回，从而避免这些部分彼此漂移。

当某个渠道专属的消息工具参数携带媒体来源时，例如本地路径或远程媒体 URL，插件还应从 `describeMessageTool(...)` 返回 `mediaSourceParams`。核心使用这个显式列表来应用沙箱路径标准化和出站媒体访问提示，而无需硬编码由插件拥有的参数名。这里应优先使用按动作划分的映射，而不是整个渠道范围内的单一扁平列表，这样仅用于资料的媒体参数就不会在 `send` 之类无关动作上被标准化。

核心会将运行时作用域传入该发现步骤。重要字段包括：

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 受信任的入站 `requesterSenderId`

这对上下文敏感型插件很重要。渠道可以根据当前账户、当前房间 / 线程 / 消息或受信任的请求方身份来隐藏或暴露消息动作，而无需在核心 `message` 工具中硬编码渠道专属分支。

这也是为什么嵌入式运行器路由变更仍然属于插件工作：运行器负责将当前聊天 / 会话身份转发到插件发现边界，使共享的 `message` 工具能为当前轮次暴露正确的、由渠道拥有的表面。

对于由渠道拥有的执行辅助工具，内置插件应将执行运行时保留在自己的扩展模块内部。核心不再拥有 `src/agents/tools` 下的 Discord、Slack、Telegram 或 WhatsApp 消息动作运行时。我们不会发布独立的 `plugin-sdk/*-action-runtime` 子路径，内置插件应直接从其扩展自有模块导入本地运行时代码。

同样的边界也适用于一般意义上的以提供商命名的 SDK 接缝：核心不应导入针对 Slack、Discord、Signal、WhatsApp 或类似扩展的渠道专属便捷 barrel。如果核心需要某种行为，要么使用内置插件自己的 `api.ts` / `runtime-api.ts` barrel，要么将该需求提升为共享 SDK 中一个狭义的通用能力。

内置插件也遵循同样的规则。内置插件的 `runtime-api.ts` 不应重新导出其自身带品牌标识的 `openclaw/plugin-sdk/<plugin-id>` 门面。这些带品牌标识的门面仍然是面向外部插件和旧调用方的兼容性垫片，但内置插件应使用本地导出以及狭义的通用 SDK 子路径，例如 `openclaw/plugin-sdk/channel-policy`、`openclaw/plugin-sdk/runtime-store` 或 `openclaw/plugin-sdk/webhook-ingress`。除非现有外部生态的兼容性边界确实需要，否则新代码不应再添加按插件 id 划分的 SDK 门面。

对于投票功能，当前有两条执行路径：

- `outbound.sendPoll` 是适用于符合通用投票模型渠道的共享基线
- `actions.handleAction("poll")` 是适用于渠道专属投票语义或额外投票参数的首选路径

现在，核心会在插件投票分发拒绝该动作之后，才推迟执行共享投票解析，因此由插件拥有的投票处理器可以接受渠道专属投票字段，而不会先被通用投票解析器阻挡。

完整启动顺序见 [插件架构内部机制](/zh-CN/plugins/architecture-internals)。

## 能力所有权模型

OpenClaw 将原生插件视为某个**公司**或某项**功能**的所有权边界，而不是无关集成的杂物集合。

这意味着：

- 公司插件通常应拥有该公司的所有面向 OpenClaw 的表面
- 功能插件通常应拥有它引入的完整功能表面
- 渠道应消费共享的核心能力，而不是临时重实现提供商行为

<AccordionGroup>
  <Accordion title="供应商多能力">
    `openai` 拥有文本推理、语音、实时语音、媒体理解和图像生成。`google` 拥有文本推理，以及媒体理解、图像生成和 Web 搜索。`qwen` 拥有文本推理，以及媒体理解和视频生成。
  </Accordion>
  <Accordion title="供应商单能力">
    `elevenlabs` 和 `microsoft` 拥有语音；`firecrawl` 拥有 Web 抓取；`minimax` / `mistral` / `moonshot` / `zai` 拥有媒体理解后端。
  </Accordion>
  <Accordion title="功能插件">
    `voice-call` 拥有呼叫传输、工具、CLI、路由和 Twilio 媒体流桥接，但它消费共享的语音、实时转录和实时语音能力，而不是直接导入供应商插件。
  </Accordion>
</AccordionGroup>

预期的最终状态是：

- OpenAI 保持在一个插件中，即使它跨越文本模型、语音、图像和未来的视频
- 其他供应商也可以对自己的表面范围采用相同方式
- 渠道不关心哪个供应商插件拥有该提供商；它们消费的是由核心暴露出的共享能力契约

这是关键区别：

- **plugin** = 所有权边界
- **capability** = 可由多个插件实现或消费的核心契约

因此，如果 OpenClaw 增加一个新领域，例如视频，首要问题不是“哪个提供商应硬编码视频处理？”首要问题是“核心视频能力契约是什么？”一旦该契约存在，供应商插件就可以针对它进行注册，渠道 / 功能插件也可以消费它。

如果该能力尚不存在，通常正确的做法是：

<Steps>
  <Step title="定义能力">
    在核心中定义缺失的能力。
  </Step>
  <Step title="通过 SDK 暴露">
    通过插件 API / 运行时以类型化方式暴露它。
  </Step>
  <Step title="接入消费者">
    让渠道 / 功能针对该能力进行接线。
  </Step>
  <Step title="供应商实现">
    让供应商插件注册实现。
  </Step>
</Steps>

这样可以保持所有权清晰，同时避免核心行为依赖单一供应商或某条一次性的插件专属代码路径。

### 能力分层

在决定代码应归属何处时，请使用以下思维模型：

<Tabs>
  <Tab title="核心能力层">
    共享编排、策略、回退、配置合并规则、交付语义和类型化契约。
  </Tab>
  <Tab title="供应商插件层">
    供应商专属 API、凭证、模型目录、语音合成、图像生成、未来的视频后端、用量端点。
  </Tab>
  <Tab title="渠道 / 功能插件层">
    Slack / Discord / voice-call 等集成，它们消费核心能力并将其呈现在某个表面上。
  </Tab>
</Tabs>

例如，TTS 遵循这种形态：

- 核心拥有回复时 TTS 策略、回退顺序、偏好和渠道交付
- `openai`、`elevenlabs` 和 `microsoft` 拥有合成实现
- `voice-call` 消费电话 TTS 运行时辅助工具

对于未来的能力，也应优先采用同样的模式。

### 多能力公司插件示例

从外部看，公司插件应当具有一致性。如果 OpenClaw 对模型、语音、实时转录、实时语音、媒体理解、图像生成、视频生成、Web 抓取和 Web 搜索都有共享契约，那么某个供应商就可以在一个地方拥有它的所有表面：

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

重要的不是辅助函数的确切名称，而是这种形态：

- 一个插件拥有供应商表面
- 核心仍然拥有能力契约
- 渠道和功能插件消费 `api.runtime.*` 辅助工具，而不是供应商代码
- 契约测试可以断言该插件确实注册了它声称拥有的能力

### 能力示例：视频理解

OpenClaw 已经将图像 / 音频 / 视频理解视为一种共享能力。这里同样适用相同的所有权模型：

<Steps>
  <Step title="核心定义契约">
    核心定义媒体理解契约。
  </Step>
  <Step title="供应商插件注册">
    供应商插件按适用情况注册 `describeImage`、`transcribeAudio` 和 `describeVideo`。
  </Step>
  <Step title="消费者使用共享行为">
    渠道和功能插件消费共享的核心行为，而不是直接接到供应商代码。
  </Step>
</Steps>

这样可以避免将某个提供商的视频假设固化进核心。插件拥有供应商表面；核心拥有能力契约和回退行为。

视频生成已经采用同样的顺序：核心拥有类型化能力契约和运行时辅助工具，供应商插件则注册 `api.registerVideoGenerationProvider(...)` 实现来对接它。

需要具体的发布清单吗？请参见 [能力扩展手册](/zh-CN/plugins/architecture)。

## 契约与强制执行

插件 API 表面被有意设计为类型化，并集中在 `OpenClawPluginApi` 中。这个契约定义了受支持的注册点，以及插件可以依赖的运行时辅助工具。

这很重要，因为：

- 插件作者可以获得一个稳定的内部标准
- 核心可以拒绝重复所有权，例如两个插件注册相同的提供商 id
- 启动过程可以为格式错误的注册暴露可执行的诊断信息
- 契约测试可以强制执行内置插件所有权，并防止静默漂移

强制执行分为两层：

<AccordionGroup>
  <Accordion title="运行时注册强制执行">
    插件注册表会在插件加载时校验注册内容。例如：重复的提供商 id、重复的语音提供商 id 以及格式错误的注册，会产生插件诊断信息，而不是导致未定义行为。
  </Accordion>
  <Accordion title="契约测试">
    在测试运行期间，内置插件会被捕获到契约注册表中，从而让 OpenClaw 可以显式断言所有权。如今这已用于模型提供商、语音提供商、Web 搜索提供商以及内置注册所有权。
  </Accordion>
</AccordionGroup>

实际效果是，OpenClaw 能够预先知道哪个插件拥有哪个表面。因此，核心和渠道可以无缝组合，因为所有权是被声明、类型化并可测试的，而不是隐含的。

### 什么应该属于契约

<Tabs>
  <Tab title="良好契约">
    - 类型化
    - 小而精
    - 能力专属
    - 由核心拥有
    - 可被多个插件复用
    - 可被渠道 / 功能消费，而无需了解供应商
  </Tab>
  <Tab title="不良契约">
    - 隐藏在核心中的供应商专属策略
    - 绕过注册表的一次性插件逃生口
    - 直接深入供应商实现的渠道代码
    - 不属于 `OpenClawPluginApi` 或 `api.runtime` 的临时运行时对象
  </Tab>
</Tabs>

如有疑问，就提升抽象层级：先定义能力，再让插件接入它。

## 执行模型

原生 OpenClaw 插件与 Gateway 网关**在同一进程内**运行。它们不受沙箱隔离。已加载的原生插件与核心代码处于相同的进程级信任边界内。

<Warning>
影响包括：

- 原生插件可以注册工具、网络处理器、钩子和服务
- 原生插件中的 bug 可能导致 Gateway 网关崩溃或不稳定
- 恶意原生插件等同于在 OpenClaw 进程内执行任意代码
  </Warning>

兼容 bundle 默认情况下更安全，因为 OpenClaw 当前将其视为元数据 / 内容包。在当前版本中，这主要意味着内置 Skills。

对于非内置插件，应使用 allowlist 和显式的安装 / 加载路径。应将工作区插件视为开发期代码，而不是生产默认项。

对于内置工作区包名，应让插件 id 锚定在 npm 名称中：默认使用 `@openclaw/<id>`，或使用经批准的类型化后缀，例如 `-provider`、`-plugin`、`-speech`、`-sandbox` 或 `-media-understanding`，当该包有意暴露更狭义的插件角色时可采用这些后缀。

<Note>
**信任说明：**

- `plugins.allow` 信任的是**插件 id**，而不是来源出处。
- 如果某个工作区插件与某个内置插件具有相同 id，那么在该工作区插件被启用 / 加入 allowlist 时，它会有意覆盖内置副本。
- 这很正常，而且对本地开发、补丁测试和热修复很有用。
- 内置插件信任是根据源码快照解析的——即加载时磁盘上的清单和代码——而不是根据安装元数据。损坏或被替换的安装记录不能在实际源码声明范围之外，悄悄扩大内置插件的信任表面。
  </Note>

## 导出边界

OpenClaw 导出的是能力，而不是实现层面的便捷接口。

应保持能力注册公开。应裁剪非契约辅助导出：

- 内置插件专属的辅助子路径
- 无意作为公共 API 的运行时管道子路径
- 供应商专属的便捷辅助工具
- 属于实现细节的设置 / 新手引导辅助工具

出于兼容性和内置插件维护需要，一些内置插件辅助子路径仍保留在生成的 SDK 导出映射中。当前示例包括 `plugin-sdk/feishu`、`plugin-sdk/feishu-setup`、`plugin-sdk/zalo`、`plugin-sdk/zalo-setup`、`plugin-sdk/channel-config-schema-legacy`，以及若干 `plugin-sdk/matrix*` 接缝。应将这些视为已弃用的保留导出，而不是新第三方插件推荐采用的 SDK 模式。

## 内部机制与参考

关于加载流水线、注册表模型、提供商运行时钩子、Gateway 网关 HTTP 路由、消息工具模式、渠道目标解析、提供商目录、上下文引擎插件，以及新增能力的指南，请参见 [插件架构内部机制](/zh-CN/plugins/architecture-internals)。

## 相关内容

- [构建插件](/zh-CN/plugins/building-plugins)
- [插件清单](/zh-CN/plugins/manifest)
- [插件 SDK 设置](/zh-CN/plugins/sdk-setup)
