---
read_when:
    - 构建或调试原生 OpenClaw 插件
    - 了解插件能力模型或归属边界
    - 处理插件加载流水线或注册表
    - 实现提供商运行时钩子或渠道插件
sidebarTitle: Internals
summary: 插件内部机制：能力模型、归属、契约、加载流水线和运行时辅助工具
title: 插件架构内部机制
x-i18n:
    generated_at: "2026-04-27T10:59:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: f178dd05863fb1151660da9ddebb3194b9f666025d23d01cf22444412bfc1eaa
    source_path: plugins/architecture.md
    workflow: 15
---

这是 OpenClaw 插件系统的**深度架构参考**。如果你需要实用指南，请先从下面这些聚焦页面之一开始。

<CardGroup cols={2}>
  <Card title="安装和使用插件" icon="plug" href="/zh-CN/tools/plugin">
    面向最终用户的指南，介绍如何添加、启用和故障排除插件。
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

能力是 OpenClaw 内部公开的**原生插件**模型。每个原生 OpenClaw 插件都会针对一个或多个能力类型进行注册：

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
如果一个插件注册了零个能力，但提供了钩子、工具、发现服务或后台服务，那么它就是**旧版仅钩子**插件。这种模式仍然受到完整支持。
</Note>

### 外部兼容性立场

能力模型已经在核心中落地，并已被如今的内置/原生插件使用，但外部插件兼容性仍需要比“它已导出，因此它已冻结”更严格的标准。

| 插件情况 | 指导建议 |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 现有外部插件 | 保持基于钩子的集成可用；这是兼容性的基线。 |
| 新的内置/原生插件 | 优先使用显式能力注册，而不是厂商特定的内部探测或新的仅钩子设计。 |
| 采用能力注册的外部插件 | 允许，但除非文档将其标记为稳定，否则应将能力特定的辅助接口视为仍在演进中。 |

能力注册是预期的发展方向。在过渡期间，对于外部插件而言，旧版钩子仍然是最安全、最不易破坏兼容性的路径。并非所有导出的辅助子路径都同等稳定 —— 应优先使用范围狭窄且文档化的契约，而不是偶然暴露的辅助导出。

### 插件形态

OpenClaw 会根据每个已加载插件的实际注册行为（而不仅仅是静态元数据）将其分类为一种形态：

<AccordionGroup>
  <Accordion title="plain-capability">
    恰好注册一种能力类型（例如仅提供商插件 `mistral`）。
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

使用 `openclaw plugins inspect <id>` 可查看插件的形态和能力细分。详情参见 [CLI 参考](/zh-CN/cli/plugins#inspect)。

### 旧版钩子

`before_agent_start` 钩子仍作为仅钩子插件的兼容路径受到支持。现有的旧版实际插件仍然依赖它。

方向如下：

- 保持其可用
- 将其记录为旧版
- 对于模型/提供商覆盖工作，优先使用 `before_model_resolve`
- 对于提示词修改工作，优先使用 `before_prompt_build`
- 仅在实际使用量下降且夹具覆盖证明迁移安全后再移除

### 兼容性信号

当你运行 `openclaw doctor` 或 `openclaw plugins inspect <id>` 时，可能会看到以下标签之一：

| 信号 | 含义 |
| -------------------------- | ------------------------------------------------------------ |
| **配置有效** | 配置解析正常且插件解析成功 |
| **兼容性提示** | 插件使用了受支持但较旧的模式（例如 `hook-only`） |
| **旧版警告** | 插件使用了 `before_agent_start`，该功能已弃用 |
| **严重错误** | 配置无效或插件加载失败 |

`hook-only` 和 `before_agent_start` 目前都不会破坏你的插件：`hook-only` 只是提示信息，而 `before_agent_start` 只会触发警告。这些信号也会显示在 `openclaw status --all` 和 `openclaw plugins doctor` 中。

## 架构概览

OpenClaw 的插件系统有四层：

<Steps>
  <Step title="清单 + 发现">
    OpenClaw 会从已配置路径、工作区根目录、全局插件根目录以及内置插件中查找候选插件。发现过程会首先读取原生 `openclaw.plugin.json` 清单以及受支持的 bundle 清单。
  </Step>
  <Step title="启用 + 验证">
    核心决定某个已发现插件是启用、禁用、阻止，还是被选用于某个排他性槽位，例如内存。
  </Step>
  <Step title="运行时加载">
    原生 OpenClaw 插件会通过 jiti 在进程内加载，并将能力注册到中央注册表中。兼容的 bundle 会被规范化为注册表记录，而无需导入运行时代码。
  </Step>
  <Step title="接口使用">
    OpenClaw 的其余部分会读取注册表，以公开工具、渠道、提供商设置、钩子、HTTP 路由、CLI 命令和服务。
  </Step>
</Steps>

对于插件 CLI 而言，根命令发现被拆分为两个阶段：

- 解析时元数据来自 `registerCli(..., { descriptors: [...] })`
- 真正的插件 CLI 模块可以保持惰性加载，并在首次调用时注册

这样既能把插件拥有的 CLI 代码保留在插件内部，又能让 OpenClaw 在解析前预留根命令名称。

重要的设计边界如下：

- 清单/配置验证应能基于**清单/模式元数据**完成，而无需执行插件代码
- 原生能力发现可能会加载受信任的插件入口代码，以构建非激活型注册表快照
- 原生运行时行为来自插件模块的 `register(api)` 路径，并且 `api.registrationMode === "full"`

这种拆分让 OpenClaw 能在完整运行时尚未激活前，就验证配置、解释缺失/禁用的插件，并构建 UI/模式提示。

### 插件查找表

Gateway 网关启动时，会根据当前配置快照的已安装插件索引和清单注册表构建一个 `PluginLookUpTable`。该表仅包含元数据：它存储插件 ID、清单记录、诊断信息、归属映射、插件 ID 规范化器以及启动插件计划。它不持有已加载的插件模块、提供商 SDK、包内容或运行时导出。

查找表会将重复的启动决策保持在快速路径上：

- 渠道归属
- 延迟渠道启动
- 启动插件 ID
- 提供商和 CLI 后端归属
- 设置提供商、命令别名、模型目录提供商和清单契约归属

其安全边界是快照替换，而不是可变更更新。当配置、插件清单、安装记录或持久化索引策略发生变化时，应重建该表。不要把它当作一个宽泛的全局可变注册表，也不要保留无限制的历史表。运行时插件加载仍然独立于查找表元数据，因此过时的运行时状态不会被元数据缓存所掩盖。

### 激活规划

激活规划是控制平面的一部分。调用方可以在加载更广泛的运行时注册表之前，先询问哪些插件与某个具体命令、提供商、渠道、路由、Agent harness 或能力相关。

规划器会保持当前清单行为兼容：

- `activation.*` 字段是显式的规划器提示
- `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 和 hooks 仍然是清单归属的回退机制
- 仅返回 ID 的规划器 API 仍可供现有调用方使用
- 计划 API 会报告原因标签，以便诊断区分显式提示和归属回退

<Warning>
不要将 `activation` 视为生命周期钩子，也不要把它当作 `register(...)` 的替代品。它只是用于缩小加载范围的元数据。若归属字段已经能够描述关系，应优先使用归属字段；仅在需要额外规划器提示时才使用 `activation`。
</Warning>

### 渠道插件和共享 message 工具

对于普通聊天操作，渠道插件不需要单独注册发送/编辑/反应工具。OpenClaw 在核心中保留了一个共享的 `message` 工具，而渠道插件负责其背后的渠道特定发现和执行。

当前边界如下：

- 核心拥有共享 `message` 工具宿主、提示词接线、会话/线程记账和执行分发
- 渠道插件拥有作用域动作发现、能力发现以及任何渠道特定的模式片段
- 渠道插件拥有提供商特定的会话会话语法，例如对话 ID 如何编码线程 ID 或从父对话继承
- 渠道插件通过它们的动作适配器执行最终动作

对于渠道插件，SDK 接口是 `ChannelMessageActionAdapter.describeMessageTool(...)`。这一统一的发现调用允许插件将其可见动作、能力和模式贡献一起返回，从而避免这些部分彼此漂移。

当某个渠道特定的消息工具参数携带媒体来源，例如本地路径或远程媒体 URL 时，插件还应从 `describeMessageTool(...)` 返回 `mediaSourceParams`。核心使用这个显式列表来应用沙箱路径规范化和出站媒体访问提示，而不是对插件拥有的参数名进行硬编码。这里应优先使用按动作划分的映射，而不是一个渠道范围的扁平列表，以免某个仅配置文件使用的媒体参数被错误地规范化到 `send` 等无关动作上。

核心会在该发现步骤中传入运行时作用域。重要字段包括：

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 受信任的入站 `requesterSenderId`

这对于上下文敏感型插件非常重要。渠道可以根据当前活跃账户、当前房间/线程/消息，或受信任的请求方身份来隐藏或公开消息操作，而无需在核心 `message` 工具中硬编码渠道特定分支。

这也是为什么嵌入式运行器路由变更仍然属于插件工作：运行器负责将当前聊天/会话身份转发到插件发现边界，以便共享的 `message` 工具为当前轮次公开正确的渠道自有接口。

对于渠道自有的执行辅助工具，内置插件应将执行运行时保留在它们自己的扩展模块中。核心不再拥有 `src/agents/tools` 下的 Discord、Slack、Telegram 或 WhatsApp 消息操作运行时。我们不会发布单独的 `plugin-sdk/*-action-runtime` 子路径，内置插件应直接从其扩展自有模块导入本地运行时代码。

同样的边界也适用于一般的提供商命名 SDK 接缝：核心不应导入针对 Slack、Discord、Signal、WhatsApp 或类似扩展的渠道特定便捷 barrel。如果核心需要某种行为，应当要么使用内置插件自己的 `api.ts` / `runtime-api.ts` barrel，要么将该需求提升为共享 SDK 中一个狭义且通用的能力。

内置插件也遵循相同规则。内置插件的 `runtime-api.ts` 不应重新导出它自身带品牌标识的 `openclaw/plugin-sdk/<plugin-id>` facade。这些带品牌标识的 facade 仍然是面向外部插件和旧消费者的兼容性垫片，但内置插件应使用本地导出以及狭义的通用 SDK 子路径，例如 `openclaw/plugin-sdk/channel-policy`、`openclaw/plugin-sdk/runtime-store` 或 `openclaw/plugin-sdk/webhook-ingress`。除非现有外部生态系统的兼容性边界确实需要，否则新代码不应新增按插件 ID 划分的 SDK facade。

对于投票，具体有两条执行路径：

- `outbound.sendPoll` 是适用于符合通用投票模型的渠道的共享基线
- `actions.handleAction("poll")` 是更适合渠道特定投票语义或额外投票参数的路径

现在，核心会在插件投票分发拒绝该操作之后，才延迟进行共享投票解析，因此插件自有的投票处理器可以接受渠道特定的投票字段，而不会先被通用投票解析器阻挡。

完整启动顺序请参见[插件架构内部机制](/zh-CN/plugins/architecture-internals)。

## 能力归属模型

OpenClaw 将原生插件视为**公司**或**功能**的归属边界，而不是一堆无关集成的杂货袋。

这意味着：

- 一个公司插件通常应拥有该公司的所有面向 OpenClaw 的接口
- 一个功能插件通常应拥有它引入的完整功能接口
- 渠道应使用共享的核心能力，而不是临时重新实现提供商行为

<AccordionGroup>
  <Accordion title="供应商多能力">
    `openai` 拥有文本推理、语音、实时语音、媒体理解和图像生成。`google` 拥有文本推理以及媒体理解、图像生成和 Web 搜索。`qwen` 拥有文本推理以及媒体理解和视频生成。
  </Accordion>
  <Accordion title="供应商单能力">
    `elevenlabs` 和 `microsoft` 拥有语音；`firecrawl` 拥有 Web 抓取；`minimax` / `mistral` / `moonshot` / `zai` 拥有媒体理解后端。
  </Accordion>
  <Accordion title="功能插件">
    `voice-call` 拥有通话传输、工具、CLI、路由和 Twilio 媒体流桥接，但会使用共享的语音、实时转录和实时语音能力，而不是直接导入供应商插件。
  </Accordion>
</AccordionGroup>

预期的最终状态是：

- OpenAI 存在于一个插件中，即使它横跨文本模型、语音、图像和未来的视频
- 其他供应商也可以对自己的接口范围采取同样做法
- 渠道不关心哪个供应商插件拥有该提供商；它们使用由核心公开的共享能力契约

这是关键区别：

- **plugin** = 归属边界
- **capability** = 多个插件都可以实现或使用的核心契约

因此，如果 OpenClaw 新增一个诸如视频之类的领域，首要问题不是“哪个提供商应该硬编码视频处理？”首要问题是“核心视频能力契约是什么？”一旦这个契约存在，供应商插件就可以针对它进行注册，而渠道/功能插件则可以使用它。

如果该能力尚不存在，通常正确的做法是：

<Steps>
  <Step title="定义能力">
    在核心中定义缺失的能力。
  </Step>
  <Step title="通过 SDK 暴露">
    以类型化方式通过插件 API/运行时暴露它。
  </Step>
  <Step title="连接消费者">
    让渠道/功能针对该能力完成接线。
  </Step>
  <Step title="供应商实现">
    让供应商插件注册实现。
  </Step>
</Steps>

这样可以在保持归属明确的同时，避免核心行为依赖于单一供应商或一次性的插件特定代码路径。

### 能力分层

在决定代码应放在哪里时，请使用以下思维模型：

<Tabs>
  <Tab title="核心能力层">
    共享编排、策略、回退、配置合并规则、交付语义和类型化契约。
  </Tab>
  <Tab title="供应商插件层">
    供应商特定 API、身份验证、模型目录、语音合成、图像生成、未来的视频后端、用量端点。
  </Tab>
  <Tab title="渠道/功能插件层">
    Slack/Discord/voice-call 等集成，它们使用核心能力并在某个接口上呈现出来。
  </Tab>
</Tabs>

例如，TTS 采用如下形态：

- 核心拥有回复时 TTS 策略、回退顺序、偏好设置和渠道交付
- `openai`、`elevenlabs` 和 `microsoft` 拥有合成实现
- `voice-call` 使用电话 TTS 运行时辅助工具

未来的能力也应优先遵循同样的模式。

### 多能力公司插件示例

从外部看，一个公司插件应当显得内聚。如果 OpenClaw 对模型、语音、实时转录、实时语音、媒体理解、图像生成、视频生成、Web 抓取和 Web 搜索都有共享契约，那么一个供应商就可以在一个地方拥有它的所有接口：

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

- 一个插件拥有该供应商接口
- 核心仍然拥有能力契约
- 渠道和功能插件使用 `api.runtime.*` 辅助工具，而不是供应商代码
- 契约测试可以断言插件确实注册了它声称拥有的能力

### 能力示例：视频理解

OpenClaw 已经将图像/音频/视频理解视为一种共享能力。相同的归属模型也适用于这里：

<Steps>
  <Step title="核心定义契约">
    核心定义媒体理解契约。
  </Step>
  <Step title="供应商插件注册">
    供应商插件根据适用情况注册 `describeImage`、`transcribeAudio` 和 `describeVideo`。
  </Step>
  <Step title="消费者使用共享行为">
    渠道和功能插件使用共享的核心行为，而不是直接接入供应商代码。
  </Step>
</Steps>

这可避免将某个提供商对视频的假设写死在核心中。插件拥有供应商接口；核心拥有能力契约和回退行为。

视频生成已经采用了同样的顺序：核心拥有类型化能力契约和运行时辅助工具，供应商插件则针对其注册 `api.registerVideoGenerationProvider(...)` 实现。

需要具体的发布检查清单吗？请参见[能力扩展手册](/zh-CN/plugins/architecture)。

## 契约与强制执行

插件 API 接口被有意设计为类型化，并集中在 `OpenClawPluginApi` 中。这个契约定义了受支持的注册点，以及插件可依赖的运行时辅助工具。

这为什么重要：

- 插件作者能获得一个稳定的内部标准
- 核心可以拒绝重复归属，例如两个插件注册相同的提供商 ID
- 启动过程可以为格式错误的注册提供可执行的诊断信息
- 契约测试可以强制执行内置插件归属并防止静默漂移

这里有两层强制执行：

<AccordionGroup>
  <Accordion title="运行时注册强制执行">
    插件注册表会在插件加载时验证注册信息。例如：重复的提供商 ID、重复的语音提供商 ID 以及格式错误的注册，都会生成插件诊断，而不是产生未定义行为。
  </Accordion>
  <Accordion title="契约测试">
    内置插件会在测试运行期间被捕获到契约注册表中，因此 OpenClaw 可以明确断言归属。如今，这被用于模型提供商、语音提供商、Web 搜索提供商以及内置注册归属。
  </Accordion>
</AccordionGroup>

实际效果是，OpenClaw 能够预先知道，哪个插件拥有哪个接口。这样一来，核心和渠道就能无缝组合，因为归属是声明式、类型化且可测试的，而不是隐式的。

### 什么应该属于契约

<Tabs>
  <Tab title="好的契约">
    - 类型化
    - 小而精
    - 能力特定
    - 由核心拥有
    - 可被多个插件复用
    - 渠道/功能无需了解供应商即可使用
  </Tab>
  <Tab title="不好的契约">
    - 隐藏在核心中的供应商特定策略
    - 绕过注册表的一次性插件逃生口
    - 直接探入供应商实现的渠道代码
    - 不属于 `OpenClawPluginApi` 或 `api.runtime` 的临时运行时对象
  </Tab>
</Tabs>

如果不确定，应提升抽象层级：先定义能力，再让插件接入它。

## 执行模型

原生 OpenClaw 插件与 Gateway 网关**在同一进程内**运行。它们不在沙箱中。已加载的原生插件与核心代码处于相同的进程级信任边界。

<Warning>
影响如下：

- 原生插件可以注册工具、网络处理器、钩子和服务
- 原生插件中的 bug 可能导致网关崩溃或不稳定
- 恶意原生插件等同于在 OpenClaw 进程内执行任意代码
  </Warning>

兼容 bundle 默认更安全，因为 OpenClaw 当前会将它们视为元数据/内容包。在当前版本中，这主要意味着内置 Skills。

对于非内置插件，请使用允许列表和显式安装/加载路径。应将工作区插件视为开发时代码，而不是生产默认值。

对于内置工作区包名，请让 npm 名称中的插件 ID 保持锚定：默认使用 `@openclaw/<id>`，或者使用经批准的类型化后缀，例如 `-provider`、`-plugin`、`-speech`、`-sandbox` 或 `-media-understanding`，前提是该包有意公开一个更狭义的插件角色。

<Note>
**信任说明：**

- `plugins.allow` 信任的是**插件 ID**，而不是来源出处。
- 如果一个工作区插件与某个内置插件具有相同 ID，那么当该工作区插件被启用/加入允许列表时，它会有意覆盖内置副本。
- 这属于正常行为，并且对本地开发、补丁测试和热修复都很有用。
- 内置插件信任是根据来源快照解析的 —— 即加载时磁盘上的清单和代码 —— 而不是根据安装元数据解析。损坏或被替换的安装记录不能在实际源码声明范围之外，悄悄扩大某个内置插件的信任边界。
  </Note>

## 导出边界

OpenClaw 导出的是能力，而不是实现层面的便利接口。

应保持能力注册为公开接口。应收缩那些不属于契约的辅助导出：

- 内置插件特定的辅助子路径
- 不打算作为公共 API 的运行时管线子路径
- 供应商特定的便捷辅助工具
- 属于实现细节的设置/新手引导辅助工具

出于兼容性和内置插件维护的需要，一些内置插件辅助子路径仍保留在生成的 SDK 导出映射中。当前示例包括 `plugin-sdk/feishu`、`plugin-sdk/feishu-setup`、`plugin-sdk/zalo`、`plugin-sdk/zalo-setup`、`plugin-sdk/channel-config-schema-legacy` 以及若干 `plugin-sdk/matrix*` 接缝。应将这些视为已弃用的保留导出，而不是新第三方插件推荐采用的 SDK 模式。

## 内部机制与参考

关于加载流水线、注册表模型、提供商运行时钩子、Gateway 网关 HTTP 路由、消息工具模式、渠道目标解析、提供商目录、上下文引擎插件以及新增能力的指南，请参见[插件架构内部机制](/zh-CN/plugins/architecture-internals)。

## 相关内容

- [构建插件](/zh-CN/plugins/building-plugins)
- [插件清单](/zh-CN/plugins/manifest)
- [插件 SDK 设置](/zh-CN/plugins/sdk-setup)
