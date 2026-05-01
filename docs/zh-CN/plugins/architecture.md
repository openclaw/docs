---
read_when:
    - 构建或调试原生 OpenClaw 插件
    - 理解插件能力模型或所有权边界
    - 处理插件加载管线或注册表
    - 实现提供商运行时钩子或渠道插件
sidebarTitle: Internals
summary: 插件内部机制：能力模型、所有权、契约、加载流水线和运行时辅助工具
title: 插件内部机制
x-i18n:
    generated_at: "2026-05-01T22:46:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 138fb962c98f71e29e8b2621ce318336c38a317636d090eb315fed806fc6abda
    source_path: plugins/architecture.md
    workflow: 16
---

这是 OpenClaw 插件系统的**深度架构参考**。对于实践指南，请从下面某个聚焦页面开始。

<CardGroup cols={2}>
  <Card title="安装和使用插件" icon="plug" href="/zh-CN/tools/plugin">
    添加、启用和故障排除插件的最终用户指南。
  </Card>
  <Card title="构建插件" icon="rocket" href="/zh-CN/plugins/building-plugins">
    使用最小可用清单的首个插件教程。
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

能力是 OpenClaw 内部公开的**原生插件**模型。每个原生 OpenClaw 插件都会针对一种或多种能力类型注册：

| 能力                   | 注册方法                                         | 示例插件                             |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| 文本推理               | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| CLI 推理后端           | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| 语音                   | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| 实时转录               | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| 实时语音               | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| 媒体理解               | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| 图像生成               | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| 音乐生成               | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| 视频生成               | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Web 获取               | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Web 搜索               | `api.registerWebSearchProvider(...)`             | `google`                             |
| 渠道 / 消息传递        | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |
| Gateway 网关设备发现   | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                            |

<Note>
注册零个能力但提供钩子、工具、设备发现服务或后台服务的插件是**旧版纯钩子**插件。该模式仍然受到完全支持。
</Note>

### 外部兼容性立场

能力模型已经落地到核心，并已被当前的内置/原生插件使用，但外部插件兼容性仍需要比“它已导出，因此它已冻结”更严格的标准。

| 插件情况                                          | 指引                                                                                             |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 现有外部插件                                      | 保持基于钩子的集成可用；这是兼容性基线。                                                         |
| 新的内置/原生插件                                 | 优先使用显式能力注册，而不是特定供应商的内部访问或新的纯钩子设计。                               |
| 采用能力注册的外部插件                            | 允许使用，但除非文档标记为稳定，否则应将特定能力的辅助表面视为仍在演进。                         |

能力注册是预期方向。在过渡期间，旧版钩子仍是外部插件最安全的无破坏路径。导出的辅助子路径并非全都等价——优先选择狭窄且有文档说明的契约，而不是偶然导出的辅助接口。

### 插件形态

OpenClaw 会根据每个已加载插件的实际注册行为（而不仅是静态元数据）将其分类为一种形态：

<AccordionGroup>
  <Accordion title="plain-capability">
    只注册一种能力类型（例如像 `mistral` 这样的仅提供商插件）。
  </Accordion>
  <Accordion title="hybrid-capability">
    注册多种能力类型（例如 `openai` 拥有文本推理、语音、媒体理解和图像生成）。
  </Accordion>
  <Accordion title="hook-only">
    只注册钩子（类型化或自定义），不注册能力、工具、命令或服务。
  </Accordion>
  <Accordion title="non-capability">
    注册工具、命令、服务或路由，但不注册能力。
  </Accordion>
</AccordionGroup>

使用 `openclaw plugins inspect <id>` 查看插件的形态和能力明细。详情见 [CLI 参考](/zh-CN/cli/plugins#inspect)。

### 旧版钩子

`before_agent_start` 钩子仍作为纯钩子插件的兼容路径受到支持。旧版真实插件仍依赖它。

方向：

- 保持其可用
- 将其记录为旧版
- 对于模型/提供商覆盖工作，优先使用 `before_model_resolve`
- 对于提示词变更工作，优先使用 `before_prompt_build`
- 仅在真实使用量下降且夹具覆盖证明迁移安全后移除

### 兼容性信号

运行 `openclaw doctor` 或 `openclaw plugins inspect <id>` 时，你可能会看到以下标签之一：

| 信号                       | 含义                                                         |
| -------------------------- | ------------------------------------------------------------ |
| **配置有效**               | 配置解析正常，插件解析成功                                   |
| **兼容性建议**             | 插件使用受支持但较旧的模式（例如 `hook-only`）               |
| **旧版警告**               | 插件使用已弃用的 `before_agent_start`                        |
| **硬错误**                 | 配置无效或插件加载失败                                       |

`hook-only` 和 `before_agent_start` 今天都不会破坏你的插件：`hook-only` 是建议性信号，`before_agent_start` 只会触发警告。这些信号也会出现在 `openclaw status --all` 和 `openclaw plugins doctor` 中。

## 架构概览

OpenClaw 的插件系统有四层：

<Steps>
  <Step title="清单 + 设备发现">
    OpenClaw 会从已配置路径、工作区根目录、全局插件根目录和内置插件中查找候选插件。设备发现会先读取原生 `openclaw.plugin.json` 清单以及受支持的包清单。
  </Step>
  <Step title="启用 + 校验">
    核心决定已发现插件是启用、禁用、阻止，还是被选入某个互斥槽位（例如记忆）。
  </Step>
  <Step title="运行时加载">
    原生 OpenClaw 插件会在进程内加载，并将能力注册到中央注册表。打包的 JavaScript 通过原生 `require` 加载；第三方本地源码 TypeScript 是应急 Jiti 回退路径。兼容包会被规范化为注册表记录，而不会导入运行时代码。
  </Step>
  <Step title="表面消费">
    OpenClaw 的其余部分读取注册表，以暴露工具、渠道、提供商设置、钩子、HTTP 路由、CLI 命令和服务。
  </Step>
</Steps>

专门针对插件 CLI，根命令设备发现分为两个阶段：

- 解析时元数据来自 `registerCli(..., { descriptors: [...] })`
- 真实插件 CLI 模块可以保持惰性，并在首次调用时注册

这让插件自有的 CLI 代码留在插件内部，同时仍允许 OpenClaw 在解析前预留根命令名称。

重要的设计边界：

- 清单/配置校验应能基于**清单/架构元数据**完成，而无需执行插件代码
- 原生能力设备发现可以加载受信任的插件入口代码，以构建非激活的注册表快照
- 原生运行时行为来自插件模块的 `register(api)` 路径，并且 `api.registrationMode === "full"`

这种拆分让 OpenClaw 能在完整运行时激活前校验配置、解释缺失/禁用的插件，并构建 UI/架构提示。

### 插件元数据快照和查找表

Gateway 网关启动会为当前配置快照构建一个 `PluginMetadataSnapshot`。该快照仅包含元数据：它存储已安装插件索引、清单注册表、清单诊断、所有者映射、插件 ID 规范化器和清单记录。它不保存已加载的插件模块、提供商 SDK、包内容或运行时导出。

感知插件的配置校验、启动自动启用和 Gateway 网关插件引导会消费该快照，而不是各自独立重建清单/索引元数据。`PluginLookUpTable` 派生自同一个快照，并为当前运行时配置添加启动插件计划。

启动后，Gateway 网关会将当前元数据快照保留为可替换的运行时产物。重复的运行时提供商设备发现可以借用该快照，而不必为每次提供商目录遍历重建已安装索引和清单注册表。在 Gateway 网关关闭、配置/插件清单变化以及已安装索引写入时，该快照会被清除或替换；如果不存在兼容的当前快照，调用方会回退到冷清单/索引路径。兼容性检查必须包含插件设备发现根目录，例如 `plugins.load.paths` 和默认 Agent 工作区，因为工作区插件属于元数据范围。

快照和查找表让重复的启动决策保持在快速路径上：

- 渠道所有权
- 延迟渠道启动
- 启动插件 ID
- 提供商和 CLI 后端所有权
- 设置提供商、命令别名、模型目录提供商和清单契约所有权
- 插件配置架构和渠道配置架构校验
- 启动自动启用决策

安全边界是快照替换，而不是变更。配置、插件清单、安装记录或持久化索引策略变化时，重建快照。不要将它视为宽泛的可变全局注册表，也不要保留无界的历史快照。运行时插件加载仍与元数据快照分离，因此陈旧的运行时状态不能隐藏在元数据缓存背后。

缓存规则记录在[插件架构内部机制](/zh-CN/plugins/architecture-internals#plugin-cache-boundary)中：除非调用方持有当前流程的显式快照、查找表或清单注册表，否则清单和设备发现元数据都是新鲜的。隐藏元数据缓存和按墙钟时间计算的 TTL 不是插件加载的一部分。只有在代码或已安装产物实际加载后，运行时加载器、模块和依赖产物缓存才可以持久存在。

某些冷路径调用方仍会直接从持久化的已安装插件索引重建清单注册表，而不是接收 Gateway 网关的 `PluginLookUpTable`。该路径现在会按需重建注册表；当调用方已经拥有当前查找表或显式清单注册表时，优先在运行时流程中传递它们。

### 激活规划

激活规划是控制平面的一部分。调用方可以在加载更广泛的运行时注册表之前，询问哪些插件与具体命令、提供商、渠道、路由、agent harness 或能力相关。

规划器保持当前清单行为兼容：

- `activation.*` 字段是显式规划器提示
- `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 和钩子仍作为清单所有权回退
- 仅 ID 的规划器 API 继续可供现有调用方使用
- 计划 API 会报告原因标签，以便诊断能够区分显式提示和所有权回退

<Warning>
不要将 `activation` 视为生命周期钩子或 `register(...)` 的替代品。它是用于缩小加载范围的元数据。当所有权字段已经描述了这种关系时，优先使用所有权字段；仅将 `activation` 用于额外的规划器提示。
</Warning>

### 渠道插件和共享消息工具

渠道插件不需要为普通聊天操作注册单独的发送/编辑/回应工具。OpenClaw 在核心中保留一个共享的 `message` 工具，渠道插件负责其背后的渠道特定设备发现和执行。

当前边界是：

- 核心负责共享的 `message` 工具宿主、提示词接线、会话/话题记账以及执行分发
- 渠道插件负责作用域内的操作发现、能力发现以及任何渠道特定的 schema 片段
- 渠道插件负责提供商特定的会话对话语法，例如对话 id 如何编码话题 id，或如何从父级对话继承
- 渠道插件通过其操作适配器执行最终操作

对于渠道插件，SDK 表面是 `ChannelMessageActionAdapter.describeMessageTool(...)`。这个统一的发现调用让插件可以一起返回其可见操作、能力和 schema 贡献，从而使这些部分不会彼此偏离。

当渠道特定的消息工具参数携带本地路径或远程媒体 URL 等媒体来源时，插件还应从 `describeMessageTool(...)` 返回 `mediaSourceParams`。核心使用这个显式列表来应用沙箱路径规范化和出站媒体访问提示，而不硬编码插件拥有的参数名。这里优先使用按操作划分作用域的映射，而不是一个渠道级的扁平列表，这样仅限个人资料的媒体参数就不会在 `send` 等无关操作上被规范化。

核心会将运行时作用域传入该发现步骤。重要字段包括：

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 可信的入站 `requesterSenderId`

这对上下文敏感的插件很重要。渠道可以根据活动账号、当前房间/话题/消息或可信请求者身份来隐藏或公开消息操作，而无需在核心 `message` 工具中硬编码渠道特定分支。

这就是为什么嵌入式运行器路由变更仍然属于插件工作：运行器负责将当前聊天/会话身份转发到插件发现边界，以便共享的 `message` 工具为当前轮次公开正确的渠道拥有表面。

对于渠道拥有的执行辅助工具，内置插件应将执行运行时保留在自己的扩展模块内。核心不再拥有 `src/agents/tools` 下的 Discord、Slack、Telegram 或 WhatsApp 消息操作运行时。我们不会发布单独的 `plugin-sdk/*-action-runtime` 子路径，内置插件应直接从自己扩展拥有的模块导入本地运行时代码。

同样的边界通常也适用于以提供商命名的 SDK 接缝：核心不应为 Slack、Discord、Signal、WhatsApp 或类似扩展导入渠道特定的便利 barrel。如果核心需要某种行为，要么消费内置插件自己的 `api.ts` / `runtime-api.ts` barrel，要么将需求提升为共享 SDK 中狭窄的通用能力。

内置插件遵循同样的规则。内置插件的 `runtime-api.ts` 不应重新导出其自己的品牌化 `openclaw/plugin-sdk/<plugin-id>` facade。这些品牌化 facade 仍然是面向外部插件和旧消费者的兼容性 shim，但内置插件应使用本地导出加上狭窄的通用 SDK 子路径，例如 `openclaw/plugin-sdk/channel-policy`、`openclaw/plugin-sdk/runtime-store` 或 `openclaw/plugin-sdk/webhook-ingress`。新代码不应新增特定插件 id 的 SDK facade，除非现有外部生态的兼容性边界需要它。

对于投票，具体有两条执行路径：

- `outbound.sendPoll` 是适合通用投票模型的渠道的共享基线
- `actions.handleAction("poll")` 是渠道特定投票语义或额外投票参数的首选路径

核心现在会将共享投票解析推迟到插件投票分发拒绝该操作之后，因此插件拥有的投票处理器可以接受渠道特定的投票字段，而不会先被通用投票解析器阻塞。

完整启动序列见 [插件架构内部机制](/zh-CN/plugins/architecture-internals)。

## 能力所有权模型

OpenClaw 将原生插件视为一个**公司**或一个**功能**的所有权边界，而不是互不相关的集成集合。

这意味着：

- 公司插件通常应拥有该公司面向 OpenClaw 的所有表面
- 功能插件通常应拥有其引入的完整功能表面
- 渠道应消费共享核心能力，而不是临时重新实现提供商行为

<AccordionGroup>
  <Accordion title="厂商多能力">
    `openai` 拥有文本推理、语音、实时语音、媒体理解和图像生成。`google` 拥有文本推理以及媒体理解、图像生成和网页搜索。`qwen` 拥有文本推理以及媒体理解和视频生成。
  </Accordion>
  <Accordion title="厂商单能力">
    `elevenlabs` 和 `microsoft` 拥有语音；`firecrawl` 拥有网页抓取；`minimax` / `mistral` / `moonshot` / `zai` 拥有媒体理解后端。
  </Accordion>
  <Accordion title="功能插件">
    `voice-call` 拥有通话传输、工具、CLI、路由和 Twilio 媒体流桥接，但消费共享语音、实时转录和实时语音能力，而不是直接导入厂商插件。
  </Accordion>
</AccordionGroup>

预期的最终状态是：

- OpenAI 位于一个插件中，即使它横跨文本模型、语音、图像和未来的视频
- 另一个厂商也可以对自己的表面区域做同样的事
- 渠道不关心哪个厂商插件拥有提供商；它们消费核心公开的共享能力契约

这是关键区别：

- **插件** = 所有权边界
- **能力** = 多个插件可以实现或消费的核心契约

因此，如果 OpenClaw 新增视频等领域，第一个问题不是“哪个提供商应该硬编码视频处理？”第一个问题是“核心视频能力契约是什么？”一旦该契约存在，厂商插件就可以针对它注册，渠道/功能插件也可以消费它。

如果该能力尚不存在，正确做法通常是：

<Steps>
  <Step title="定义能力">
    在核心中定义缺失的能力。
  </Step>
  <Step title="通过 SDK 公开">
    以有类型的方式通过插件 API/运行时公开它。
  </Step>
  <Step title="接线消费者">
    将渠道/功能接线到该能力。
  </Step>
  <Step title="厂商实现">
    让厂商插件注册实现。
  </Step>
</Steps>

这可以保持所有权显式，同时避免核心行为依赖单个厂商或一次性的插件特定代码路径。

### 能力分层

决定代码归属时使用这个心智模型：

<Tabs>
  <Tab title="核心能力层">
    共享编排、策略、回退、配置合并规则、投递语义和有类型的契约。
  </Tab>
  <Tab title="厂商插件层">
    厂商特定 API、凭证、模型目录、语音合成、图像生成、未来的视频后端、用量端点。
  </Tab>
  <Tab title="渠道/功能插件层">
    消费核心能力并在某个表面上呈现它们的 Slack/Discord/voice-call 等集成。
  </Tab>
</Tabs>

例如，TTS 遵循这种形态：

- 核心拥有回复时 TTS 策略、回退顺序、偏好设置和渠道投递
- `openai`、`elevenlabs` 和 `microsoft` 拥有合成实现
- `voice-call` 消费电话 TTS 运行时辅助工具

未来能力也应优先采用同样的模式。

### 多能力公司插件示例

公司插件从外部看应当是内聚的。如果 OpenClaw 为模型、语音、实时转录、实时语音、媒体理解、图像生成、视频生成、网页抓取和网页搜索提供共享契约，厂商就可以在一个地方拥有自己的所有表面：

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

重要的不是具体辅助函数名称，而是这种形态：

- 一个插件拥有厂商表面
- 核心仍然拥有能力契约
- 渠道和功能插件消费 `api.runtime.*` 辅助工具，而不是厂商代码
- 契约测试可以断言插件注册了它声称拥有的能力

### 能力示例：视频理解

OpenClaw 已经将图像/音频/视频理解视为一种共享能力。同样的所有权模型也适用于此：

<Steps>
  <Step title="核心定义契约">
    核心定义媒体理解契约。
  </Step>
  <Step title="厂商插件注册">
    厂商插件按适用情况注册 `describeImage`、`transcribeAudio` 和 `describeVideo`。
  </Step>
  <Step title="消费者使用共享行为">
    渠道和功能插件消费共享核心行为，而不是直接接线到厂商代码。
  </Step>
</Steps>

这避免将某个提供商的视频假设烘焙进核心。插件拥有厂商表面；核心拥有能力契约和回退行为。

视频生成已经使用同样的序列：核心拥有有类型的能力契约和运行时辅助工具，厂商插件针对它注册 `api.registerVideoGenerationProvider(...)` 实现。

需要具体的推出检查清单？见 [能力扩展手册](/zh-CN/plugins/architecture)。

## 契约和强制执行

插件 API 表面有意在 `OpenClawPluginApi` 中保持有类型且集中。该契约定义了受支持的注册点，以及插件可以依赖的运行时辅助工具。

这很重要的原因：

- 插件作者获得一个稳定的内部标准
- 核心可以拒绝重复所有权，例如两个插件注册相同的提供商 id
- 启动可以为格式错误的注册暴露可操作的诊断信息
- 契约测试可以强制执行内置插件所有权，并防止无声偏离

强制执行有两层：

<AccordionGroup>
  <Accordion title="运行时注册强制校验">
    插件注册表会在插件加载时验证注册。示例：重复的提供商 id、重复的语音提供商 id，以及格式错误的注册都会产生插件诊断，而不是未定义行为。
  </Accordion>
  <Accordion title="合约测试">
    内置插件会在测试运行期间被捕获到合约注册表中，以便 OpenClaw 可以明确断言所有权。如今，这用于模型提供商、语音提供商、Web 搜索提供商，以及内置注册所有权。
  </Accordion>
</AccordionGroup>

实际效果是，OpenClaw 可以预先知道哪个插件拥有哪个表面。这让 core 和渠道能够无缝组合，因为所有权是声明式、有类型且可测试的，而不是隐式的。

### 合约中应包含什么

<Tabs>
  <Tab title="良好合约">
    - 有类型
    - 小而聚焦
    - 特定于能力
    - 由 core 拥有
    - 可被多个插件复用
    - 可由渠道/功能使用，且不需要了解供应商细节

  </Tab>
  <Tab title="不良合约">
    - 隐藏在 core 中的供应商特定策略
    - 绕过注册表的一次性插件逃生口
    - 渠道代码直接访问供应商实现
    - 不属于 `OpenClawPluginApi` 或 `api.runtime` 的临时运行时对象

  </Tab>
</Tabs>

拿不准时，提高抽象层级：先定义能力，再让插件接入它。

## 执行模型

原生 OpenClaw 插件与 Gateway 网关**在同一进程内**运行。它们不是沙箱隔离的。加载后的原生插件与 core 代码具有相同的进程级信任边界。

<Warning>
原生插件的影响：插件可以注册工具、网络处理器、钩子和服务；插件 bug 可能导致 Gateway 网关崩溃或不稳定；恶意原生插件等同于在 OpenClaw 进程内执行任意代码。
</Warning>

兼容 bundle 默认更安全，因为 OpenClaw 当前将它们视为元数据/内容包。在当前版本中，这主要意味着内置 Skills。

对非内置插件使用允许列表和显式安装/加载路径。将工作区插件视为开发时代码，而不是生产默认项。

对于内置工作区包名，默认将插件 id 锚定在 npm 名称中：`@openclaw/<id>`，或者在包有意暴露更窄插件角色时，使用已批准的类型化后缀，例如 `-provider`、`-plugin`、`-speech`、`-sandbox` 或 `-media-understanding`。

<Note>
**信任说明：**`plugins.allow` 信任的是**插件 id**，而不是来源出处。当某个工作区插件启用/加入允许列表，且与某个内置插件具有相同 id 时，它会有意遮蔽内置副本。这是正常行为，对本地开发、补丁测试和热修复很有用。内置插件信任由源快照解析，即加载时磁盘上的 manifest 和代码，而不是由安装元数据解析。损坏或被替换的安装记录不能悄悄扩大内置插件的信任表面，使其超出实际源代码声明的范围。
</Note>

## 导出边界

OpenClaw 导出能力，而不是实现便利项。

保持能力注册公开。精简非合约辅助导出：

- 内置插件专用辅助子路径
- 不打算作为公共 API 的运行时管线子路径
- 供应商特定便利辅助项
- 属于实现细节的设置/新手引导辅助项

保留的内置插件辅助子路径已从生成的 SDK 导出映射中退役。将所有者特定辅助项保留在拥有它们的插件包内；仅将可复用的宿主行为提升为通用 SDK 合约，例如 `plugin-sdk/gateway-runtime`、`plugin-sdk/security-runtime` 和 `plugin-sdk/plugin-config-runtime`。

## 内部机制与参考

关于加载管线、注册表模型、提供商运行时钩子、Gateway 网关 HTTP 路由、消息工具 schema、渠道目标解析、提供商目录、上下文引擎插件，以及新增能力指南，请参阅[插件架构内部机制](/zh-CN/plugins/architecture-internals)。

## 相关

- [构建插件](/zh-CN/plugins/building-plugins)
- [插件 manifest](/zh-CN/plugins/manifest)
- [插件 SDK 设置](/zh-CN/plugins/sdk-setup)
