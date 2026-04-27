---
read_when:
    - 构建或调试原生 OpenClaw 插件
    - 理解插件能力模型或所有权边界
    - 处理插件加载流水线或注册表
    - 实现 provider 运行时 hook 或渠道插件
sidebarTitle: Internals
summary: 插件内部机制：能力模型、所有权、契约、加载流水线和运行时辅助工具
title: 插件内部机制
x-i18n:
    generated_at: "2026-04-27T12:54:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf11e7e9098283f5a489e9843c338ef235748663580dfeaef62f6f6766b55621
    source_path: plugins/architecture.md
    workflow: 15
---

这是 OpenClaw 插件系统的**深度架构参考**。如果你需要实用指南，请先从下面这些聚焦页面开始。

<CardGroup cols={2}>
  <Card title="安装和使用插件" icon="plug" href="/zh-CN/tools/plugin">
    面向最终用户的指南，介绍如何添加、启用和故障排除插件。
  </Card>
  <Card title="构建插件" icon="rocket" href="/zh-CN/plugins/building-plugins">
    从最小可工作的清单开始的首个插件教程。
  </Card>
  <Card title="渠道插件" icon="comments" href="/zh-CN/plugins/sdk-channel-plugins">
    构建一个消息渠道插件。
  </Card>
  <Card title="提供商插件" icon="microchip" href="/zh-CN/plugins/sdk-provider-plugins">
    构建一个模型提供商插件。
  </Card>
  <Card title="插件 SDK 概览" icon="book" href="/zh-CN/plugins/sdk-overview">
    导入映射和注册 API 参考。
  </Card>
</CardGroup>

## 公共能力模型

能力是 OpenClaw 内部公共的**原生插件**模型。每个原生 OpenClaw 插件都会针对一种或多种能力类型进行注册：

| Capability | Registration method | Example plugins |
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
| Gateway 网关发现 | `api.registerGatewayDiscoveryService(...)` | `bonjour` |

<Note>
一个注册了零个能力、但提供 hook、工具、发现服务或后台服务的插件，是一种**旧版仅 hook** 插件。这种模式仍然受到完整支持。
</Note>

### 外部兼容性立场

能力模型已经在核心中落地，并且如今已被内置/原生插件使用，但外部插件兼容性仍然需要比“它已导出，因此已冻结”更严格的标准。

| Plugin situation | Guidance |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 现有外部插件 | 保持基于 hook 的集成可继续工作；这是兼容性基线。 |
| 新的内置/原生插件 | 优先使用显式能力注册，而不是供应商特定的深度耦合，或新的仅 hook 设计。 |
| 采用能力注册的外部插件 | 允许，但除非文档将能力特定的辅助表面标记为稳定，否则应视其为仍在演进中。 |

能力注册是预期方向。在过渡期间，对于外部插件来说，旧版 hook 仍然是最不易破坏兼容性的路径。已导出的辅助子路径并不完全等价——应优先使用范围窄且有文档说明的契约，而不是偶然导出的辅助内容。

### 插件形态

OpenClaw 会根据每个已加载插件的实际注册行为对其进行形态分类（而不只是看静态元数据）：

<AccordionGroup>
  <Accordion title="plain-capability">
    恰好注册一种能力类型（例如像 `mistral` 这样仅提供商的插件）。
  </Accordion>
  <Accordion title="hybrid-capability">
    注册多种能力类型（例如 `openai` 同时拥有文本推理、语音、媒体理解和图像生成）。
  </Accordion>
  <Accordion title="hook-only">
    仅注册 hook（类型化或自定义），没有能力、工具、命令或服务。
  </Accordion>
  <Accordion title="non-capability">
    注册工具、命令、服务或路由，但不注册能力。
  </Accordion>
</AccordionGroup>

使用 `openclaw plugins inspect <id>` 可查看插件的形态和能力细分。详情请参见 [CLI reference](/zh-CN/cli/plugins#inspect)。

### 旧版 hook

`before_agent_start` hook 仍然作为仅 hook 插件的兼容路径受到支持。旧版真实插件仍然依赖它。

方向：

- 保持其可用
- 将其记录为旧版
- 对于模型/提供商覆盖工作，优先使用 `before_model_resolve`
- 对于提示词变更工作，优先使用 `before_prompt_build`
- 只有在真实使用下降并且 fixture 覆盖证明迁移安全后才移除

### 兼容性信号

当你运行 `openclaw doctor` 或 `openclaw plugins inspect <id>` 时，你可能会看到以下标签之一：

| Signal | Meaning |
| -------------------------- | ------------------------------------------------------------ |
| **配置有效** | 配置可正常解析，插件也能正常解析 |
| **兼容性建议** | 插件使用受支持但较旧的模式（例如 `hook-only`） |
| **旧版警告** | 插件使用 `before_agent_start`，该项已弃用 |
| **硬错误** | 配置无效，或插件加载失败 |

如今，`hook-only` 和 `before_agent_start` 都不会导致你的插件中断：`hook-only` 只是建议性质，而 `before_agent_start` 只会触发警告。这些信号也会出现在 `openclaw status --all` 和 `openclaw plugins doctor` 中。

## 架构概览

OpenClaw 的插件系统有四层：

<Steps>
  <Step title="清单 + 发现">
    OpenClaw 会从已配置路径、工作区根目录、全局插件根目录和内置插件中查找候选插件。发现流程会优先读取原生 `openclaw.plugin.json` 清单以及支持的捆绑包清单。
  </Step>
  <Step title="启用状态 + 校验">
    核心决定某个已发现插件是已启用、已禁用、被阻止，还是被选入某个独占插槽，例如 memory。
  </Step>
  <Step title="运行时加载">
    原生 OpenClaw 插件会通过 jiti 在进程内加载，并将能力注册到中央注册表中。兼容捆绑包则会在不导入运行时代码的情况下，被规范化为注册表记录。
  </Step>
  <Step title="表面消费">
    OpenClaw 的其余部分会读取注册表，以暴露工具、渠道、提供商设置、hook、HTTP 路由、CLI 命令和服务。
  </Step>
</Steps>

具体到插件 CLI，根命令发现被拆分为两个阶段：

- 解析时元数据来自 `registerCli(..., { descriptors: [...] })`
- 真正的插件 CLI 模块可以保持惰性，并在首次调用时再注册

这样可以让插件拥有的 CLI 代码保留在插件内部，同时仍让 OpenClaw 在解析前预留根命令名称。

重要的设计边界是：

- 清单/配置校验应当基于**清单/schema 元数据**完成，而不执行插件代码
- 原生能力发现可以加载受信任的插件入口代码，以构建一个不会激活的注册表快照
- 原生运行时行为来自插件模块的 `register(api)` 路径，并且 `api.registrationMode === "full"`

这种拆分让 OpenClaw 可以在完整运行时激活之前，就完成配置校验、解释缺失/禁用插件，并构建 UI/schema 提示。

### 插件查找表

Gateway 网关启动时，会根据当前配置快照中的已安装插件索引和清单注册表构建一个 `PluginLookUpTable`。该表仅包含元数据：它存储插件 id、清单记录、诊断信息、所有者映射、插件 id 规范化器以及启动插件计划。它不持有已加载的插件模块、提供商 SDK、包内容或运行时导出。

查找表让重复的启动决策保持在快速路径上：

- 渠道所有权
- 延迟渠道启动
- 启动插件 id
- 提供商和 CLI 后端所有权
- 设置提供商、命令别名、模型目录提供商以及清单契约所有权

安全边界在于快照替换，而不是变更。应在配置、插件清单、安装记录或持久化索引策略变化时重建该表。不要把它当作一个可广泛变更的全局注册表，也不要无限制地保留历史表。运行时插件加载仍与查找表元数据分离，因此过期的运行时状态不会被元数据缓存掩盖。

某些冷路径调用方仍会直接从持久化的已安装插件索引重建清单注册表，而不是接收 Gateway 网关的 `PluginLookUpTable`。这条回退路径会保留一个小型、有界的内存缓存，其键由已安装索引、请求形态、配置策略、运行时根目录以及清单/package 文件签名组成。它是针对重复索引重建的回退安全网，而不是首选的 Gateway 网关热路径。当调用方已经持有当前查找表或显式清单注册表时，在运行时流程中应优先传递它们。

### 激活规划

激活规划是控制平面的一部分。调用方可以在加载更广泛的运行时注册表之前，先询问哪些插件与具体命令、提供商、渠道、路由、Agent harness 或能力相关。

规划器会保持与当前清单行为兼容：

- `activation.*` 字段是显式的规划器提示
- `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 和 hook 仍然是清单所有权回退
- 仅 id 的规划器 API 对现有调用方仍然可用
- plan API 会报告原因标签，以便诊断区分显式提示和所有权回退

<Warning>
不要将 `activation` 视为生命周期 hook 或 `register(...)` 的替代品。它是用于缩小加载范围的元数据。当现有所有权字段已经能描述这种关系时，应优先使用所有权字段；只有在需要额外规划器提示时，才使用 `activation`。
</Warning>

### 渠道插件和共享 message 工具

对于常规聊天操作，渠道插件不需要单独注册发送/编辑/反应工具。OpenClaw 在核心中保留了一个共享的 `message` 工具，而渠道插件拥有其背后的渠道特定发现和执行逻辑。

当前边界是：

- 核心拥有共享 `message` 工具宿主、提示词接线、会话/线程簿记和执行分发
- 渠道插件拥有作用域动作发现、能力发现以及所有渠道特定 schema 片段
- 渠道插件拥有提供商特定的会话会话语法，例如会话 id 如何编码线程 id，或如何继承父会话
- 渠道插件通过它们的动作适配器执行最终动作

对于渠道插件，SDK 表面是 `ChannelMessageActionAdapter.describeMessageTool(...)`。这个统一的发现调用允许插件将其可见动作、能力和 schema 贡献一起返回，从而避免这些部分彼此漂移。

当某个渠道专用 message 工具参数携带媒体来源，例如本地路径或远程媒体 URL 时，插件还应从 `describeMessageTool(...)` 返回 `mediaSourceParams`。核心会使用这份显式列表来应用沙箱路径规范化和出站媒体访问提示，而不需要硬编码插件拥有的参数名。这里应优先使用按动作划分的映射，而不是一个覆盖整个渠道的扁平列表，这样某个仅限 profile 的媒体参数就不会在 `send` 之类无关动作上被规范化。

核心会将运行时作用域传入该发现步骤。重要字段包括：

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 受信任入站 `requesterSenderId`

这对上下文敏感型插件很重要。一个渠道可以根据活动账户、当前房间/线程/消息，或受信任请求者身份来隐藏或暴露 message 动作，而无需在核心 `message` 工具中硬编码渠道特定分支。

这也是为什么嵌入式运行器路由变更仍然属于插件工作：运行器负责将当前聊天/会话身份转发到插件发现边界，这样共享 `message` 工具就能为当前 turn 暴露正确的、由渠道拥有的表面。

对于由渠道拥有的执行辅助工具，内置插件应将执行运行时保留在它们自己的扩展模块中。核心不再拥有 `src/agents/tools` 下的 Discord、Slack、Telegram 或 WhatsApp message-action 运行时。我们不会发布单独的 `plugin-sdk/*-action-runtime` 子路径，内置插件应直接从它们自己拥有的扩展模块中导入本地运行时代码。

同样的边界也适用于一般性的 provider 命名 SDK 表面：核心不应导入 Slack、Discord、Signal、WhatsApp 或类似扩展的渠道专用便捷 barrel。如果核心需要某种行为，要么消费该内置插件自己的 `api.ts` / `runtime-api.ts` barrel，要么把这个需求提升为共享 SDK 中一个狭义的通用能力。

内置插件也遵循同样的规则。某个内置插件的 `runtime-api.ts` 不应重新导出它自己的品牌化 `openclaw/plugin-sdk/<plugin-id>` facade。这些品牌化 facade 仍然作为外部插件和旧消费者的兼容性 shim 而保留，但内置插件应使用本地导出以及狭义的通用 SDK 子路径，例如 `openclaw/plugin-sdk/channel-policy`、`openclaw/plugin-sdk/runtime-store` 或 `openclaw/plugin-sdk/webhook-ingress`。除非现有外部生态的兼容性边界确有需要，否则新代码不应新增按插件 id 划分的 SDK facade。

对于投票，当前有两条执行路径：

- `outbound.sendPoll` 是适用于符合通用投票模型渠道的共享基线
- `actions.handleAction("poll")` 是适用于渠道特定投票语义或额外投票参数的首选路径

核心现在会在插件投票分发拒绝该动作之后，才延迟执行共享投票解析，因此插件拥有的投票处理器可以接受渠道特定投票字段，而不会先被通用投票解析器拦住。

完整启动顺序请参见 [插件架构内部机制](/zh-CN/plugins/architecture-internals)。

## 能力所有权模型

OpenClaw 将原生插件视为**公司**或**功能**的所有权边界，而不是一堆无关集成的集合。

这意味着：

- 一个公司插件通常应拥有该公司的所有 OpenClaw 对外表面
- 一个功能插件通常应拥有其引入的完整功能表面
- 渠道应消费共享核心能力，而不是临时重新实现 provider 行为

<AccordionGroup>
  <Accordion title="供应商多能力">
    `openai` 拥有文本推理、语音、实时语音、媒体理解和图像生成。`google` 拥有文本推理，以及媒体理解、图像生成和 Web 搜索。`qwen` 拥有文本推理，以及媒体理解和视频生成。
  </Accordion>
  <Accordion title="供应商单能力">
    `elevenlabs` 和 `microsoft` 拥有语音；`firecrawl` 拥有 Web 抓取；`minimax` / `mistral` / `moonshot` / `zai` 拥有媒体理解后端。
  </Accordion>
  <Accordion title="功能插件">
    `voice-call` 拥有通话传输、工具、CLI、路由和 Twilio 媒体流桥接，但它消费共享的语音、实时转录和实时语音能力，而不是直接导入供应商插件。
  </Accordion>
</AccordionGroup>

预期的最终状态是：

- OpenAI 即使同时覆盖文本模型、语音、图像和未来的视频，也应存在于一个插件中
- 另一个供应商也可以为其自身表面采用相同方式
- 渠道不关心哪个供应商插件拥有该 provider；它们消费的是核心暴露出的共享能力契约

这就是关键区别：

- **plugin** = 所有权边界
- **capability** = 多个插件可实现或消费的核心契约

因此，如果 OpenClaw 新增一个领域，比如视频，第一问题不应是“哪个 provider 应该硬编码视频处理？”第一问题应是“核心的视频能力契约是什么？”一旦该契约存在，供应商插件就可以针对它注册，而渠道/功能插件也可以消费它。

如果该能力尚不存在，通常正确的做法是：

<Steps>
  <Step title="定义能力">
    在核心中定义缺失的能力。
  </Step>
  <Step title="通过 SDK 暴露">
    以类型化方式通过插件 API/运行时暴露它。
  </Step>
  <Step title="接入消费者">
    将渠道/功能接入到该能力。
  </Step>
  <Step title="供应商实现">
    让供应商插件注册实现。
  </Step>
</Steps>

这样能在保持所有权明确的同时，避免核心行为依赖单一供应商或某条一次性的插件专用代码路径。

### 能力分层

在决定代码应放在哪里时，可使用下面的心智模型：

<Tabs>
  <Tab title="核心能力层">
    共享编排、策略、回退、配置合并规则、交付语义和类型化契约。
  </Tab>
  <Tab title="供应商插件层">
    供应商特定 API、认证、模型目录、语音合成、图像生成、未来的视频后端、用量端点。
  </Tab>
  <Tab title="渠道/功能插件层">
    Slack/Discord/voice-call 等集成，它们消费核心能力并将其呈现在某个表面上。
  </Tab>
</Tabs>

例如，TTS 遵循这种形态：

- 核心拥有回复时 TTS 策略、回退顺序、偏好和渠道交付
- `openai`、`elevenlabs` 和 `microsoft` 拥有合成实现
- `voice-call` 消费电话 TTS 运行时辅助工具

未来的能力也应优先遵循同样的模式。

### 多能力公司插件示例

从外部看，一个公司插件应当是内聚的。如果 OpenClaw 对模型、语音、实时转录、实时语音、媒体理解、图像生成、视频生成、Web 抓取和 Web 搜索都有共享契约，那么一个供应商可以在一个地方拥有它的全部表面：

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

重要的不在于辅助函数的精确名称，而在于形态：

- 一个插件拥有该供应商表面
- 核心仍然拥有能力契约
- 渠道和功能插件消费 `api.runtime.*` 辅助工具，而不是供应商代码
- 契约测试可以断言该插件已注册它所声称拥有的能力

### 能力示例：视频理解

OpenClaw 已经将图像/音频/视频理解视为一个共享能力。同样的所有权模型也适用于这里：

<Steps>
  <Step title="核心定义契约">
    核心定义媒体理解契约。
  </Step>
  <Step title="供应商插件注册">
    供应商插件按适用情况注册 `describeImage`、`transcribeAudio` 和 `describeVideo`。
  </Step>
  <Step title="消费者使用共享行为">
    渠道和功能插件消费共享核心行为，而不是直接连接到供应商代码。
  </Step>
</Steps>

这样可以避免把某个 provider 的视频假设固化进核心。插件拥有供应商表面；核心拥有能力契约和回退行为。

视频生成已经使用同样的顺序：核心拥有类型化能力契约和运行时辅助工具，而供应商插件则注册 `api.registerVideoGenerationProvider(...)` 实现。

需要具体的发布检查清单吗？请参见 [能力扩展手册](/zh-CN/plugins/architecture)。

## 契约和强制执行

插件 API 表面被有意设计为类型化，并集中在 `OpenClawPluginApi` 中。这个契约定义了受支持的注册点，以及插件可依赖的运行时辅助工具。

这很重要，因为：

- 插件作者获得了一个稳定的内部标准
- 核心可以拒绝重复所有权，例如两个插件注册相同的 provider id
- 启动过程可以为格式错误的注册暴露可执行的诊断信息
- 契约测试可以强制执行内置插件所有权，并防止静默漂移

有两层强制执行机制：

<AccordionGroup>
  <Accordion title="运行时注册强制执行">
    插件注册表会在插件加载时验证注册内容。例如：重复的 provider id、重复的语音 provider id，以及格式错误的注册，都会生成插件诊断信息，而不是导致未定义行为。
  </Accordion>
  <Accordion title="契约测试">
    在测试运行期间，内置插件会被捕获到契约注册表中，这样 OpenClaw 就能显式断言所有权。当前这用于模型 provider、语音 provider、Web 搜索 provider 和内置注册所有权。
  </Accordion>
</AccordionGroup>

实际效果是，OpenClaw 可以预先知道哪个插件拥有哪个表面。这使得核心和渠道能够无缝组合，因为所有权是被声明、类型化且可测试的，而不是隐含的。

### 什么内容适合进入契约

<Tabs>
  <Tab title="好的契约">
    - 类型化
    - 小而精
    - 按能力划分
    - 由核心拥有
    - 可被多个插件复用
    - 可被渠道/功能在不了解供应商的前提下消费
  </Tab>
  <Tab title="坏的契约">
    - 在核心中隐藏供应商特定策略
    - 绕过注册表的一次性插件逃生口
    - 渠道代码直接深入某个供应商实现
    - 不属于 `OpenClawPluginApi` 或 `api.runtime` 的临时运行时对象
  </Tab>
</Tabs>

拿不准时，就提高抽象层级：先定义能力，再让插件接入它。

## 执行模型

原生 OpenClaw 插件与 Gateway 网关**在同一进程内**运行。它们不在沙箱中。已加载的原生插件与核心代码处于相同的进程级信任边界。

<Warning>
这意味着：

- 原生插件可以注册工具、网络处理器、hook 和服务
- 原生插件中的 bug 可能导致 Gateway 网关崩溃或失稳
- 恶意原生插件等同于在 OpenClaw 进程内部执行任意代码
  </Warning>

兼容捆绑包默认更安全，因为 OpenClaw 当前将它们视为元数据/内容包。在当前版本中，这主要意味着内置 Skills。

对于非内置插件，请使用允许列表和显式安装/加载路径。应将工作区插件视为开发阶段代码，而不是生产默认项。

对于内置工作区包名，请让插件 id 锚定在 npm 名称中：默认使用 `@openclaw/<id>`，或使用已批准的类型化后缀，例如 `-provider`、`-plugin`、`-speech`、`-sandbox` 或 `-media-understanding`，前提是该包有意暴露更窄的插件角色。

<Note>
**信任说明：**

- `plugins.allow` 信任的是**插件 id**，而不是来源出处。
- 如果某个工作区插件与某个内置插件具有相同 id，那么在该工作区插件被启用/加入允许列表时，它会有意覆盖内置副本。
- 这属于正常行为，并且对本地开发、补丁测试和热修复很有用。
- 内置插件信任是从源快照解析的——即加载时磁盘上的清单和代码——而不是从安装元数据解析。损坏或被替换的安装记录无法在实际源代码声明之外，悄悄扩大某个内置插件的信任表面。
  </Note>

## 导出边界

OpenClaw 导出的是能力，而不是实现层面的便捷工具。

应保持能力注册为公共接口。同时收紧非契约辅助导出：

- 内置插件专用辅助子路径
- 无意作为公共 API 的运行时管线路径
- 供应商专用便捷辅助工具
- 属于实现细节的设置/新手引导辅助工具

出于兼容性和内置插件维护需要，一些内置插件辅助子路径仍保留在生成的 SDK 导出映射中。当前示例包括 `plugin-sdk/feishu`、`plugin-sdk/feishu-setup`、`plugin-sdk/zalo`、`plugin-sdk/zalo-setup`、`plugin-sdk/channel-config-schema-legacy` 以及若干 `plugin-sdk/matrix*` 接缝。应将它们视为已弃用的保留导出，而不是面向新第三方插件的推荐 SDK 模式。

## 内部机制和参考

关于加载流水线、注册表模型、provider 运行时 hook、Gateway 网关 HTTP 路由、message 工具 schema、渠道目标解析、provider 目录、上下文引擎插件，以及新增能力的指南，请参见 [插件架构内部机制](/zh-CN/plugins/architecture-internals)。

## 相关内容

- [构建插件](/zh-CN/plugins/building-plugins)
- [插件清单](/zh-CN/plugins/manifest)
- [插件设置](/zh-CN/plugins/sdk-setup)
