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
    generated_at: "2026-04-24T05:09:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 344c02f9f0bb19780d262929e665fcaf8093ac08cda30b61af56857368b0b07a
    source_path: plugins/architecture.md
    workflow: 15
---

这是 OpenClaw 插件系统的**深度架构参考**。如需实用指南，请先从下面的专题页面之一开始。

<CardGroup cols={2}>
  <Card title="安装和使用插件" icon="plug" href="/zh-CN/tools/plugin">
    面向终端用户的指南，介绍如何添加、启用和排查插件问题。
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

## 公开能力模型

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
| 网页抓取 | `api.registerWebFetchProvider(...)` | `firecrawl` |
| 网页搜索 | `api.registerWebSearchProvider(...)` | `google` |
| 渠道 / 消息 | `api.registerChannel(...)` | `msteams`, `matrix` |

注册零个能力，但提供 hooks、工具或服务的插件，属于**仅 legacy hook** 插件。这种模式目前仍被完全支持。

### 对外兼容性立场

能力模型已经在核心中落地，并已被当前的内置 / 原生插件使用，但外部插件兼容性仍需要比“已导出，因此已冻结”更严格的标准。

| 插件情况 | 指南 |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 现有外部插件 | 保持基于 hook 的集成可用；这是兼容性的基线。 |
| 新的内置 / 原生插件 | 优先使用显式能力注册，而不是特定厂商的内部访问方式或新的仅 hook 设计。 |
| 采用能力注册的外部插件 | 允许，但除非文档将其标记为稳定，否则应将特定能力的辅助接口视为仍在演进中。 |

能力注册是预期的发展方向。在过渡期间，对于外部插件来说，legacy hooks 仍然是最安全、最不容易破坏兼容性的路径。导出的辅助子路径并不完全等价——优先使用范围明确、已有文档说明的契约，而不是偶然暴露出来的辅助导出。

### 插件形态

OpenClaw 会根据每个已加载插件的实际注册行为来分类其形态（而不只是依据静态元数据）：

- **plain-capability**：只注册恰好一种能力类型（例如像 `mistral` 这样的仅提供商插件）。
- **hybrid-capability**：注册多种能力类型（例如 `openai` 同时拥有文本推理、语音、媒体理解和图像生成）。
- **hook-only**：只注册 hooks（类型化或自定义），不注册能力、工具、命令或服务。
- **non-capability**：注册工具、命令、服务或路由，但不注册能力。

使用 `openclaw plugins inspect <id>` 可查看插件的形态和能力明细。详见 [CLI 参考](/zh-CN/cli/plugins#inspect)。

### Legacy hooks

`before_agent_start` hook 仍然作为仅 hook 插件的兼容路径受到支持。现实中的 legacy 插件仍然依赖它。

方向如下：

- 保持其可用
- 在文档中标记为 legacy
- 对于模型 / 提供商覆写工作，优先使用 `before_model_resolve`
- 对于提示词修改工作，优先使用 `before_prompt_build`
- 仅在真实使用量下降且 fixture 覆盖证明迁移安全后再移除

### 兼容性信号

当你运行 `openclaw doctor` 或 `openclaw plugins inspect <id>` 时，可能会看到以下标签之一：

| 信号 | 含义 |
| -------------------------- | ------------------------------------------------------------ |
| **config valid** | 配置解析正常，且插件可成功解析 |
| **compatibility advisory** | 插件使用了受支持但较旧的模式（例如 `hook-only`） |
| **legacy warning** | 插件使用了 `before_agent_start`，该接口已弃用 |
| **hard error** | 配置无效，或插件加载失败 |

`hook-only` 和 `before_agent_start` 目前都不会导致你的插件失效：`hook-only` 只是提示性信息，而 `before_agent_start` 只会触发警告。这些信号也会显示在 `openclaw status --all` 和 `openclaw plugins doctor` 中。

## 架构概览

OpenClaw 的插件系统分为四层：

1. **清单 + 设备发现**
   OpenClaw 会从已配置路径、工作区根目录、全局插件根目录以及内置插件中查找候选插件。设备发现会优先读取原生 `openclaw.plugin.json` 清单以及受支持的 bundle 清单。
2. **启用 + 验证**
   核心决定某个已发现插件是启用、禁用、阻止，还是被选入诸如 memory 之类的独占槽位。
3. **运行时加载**
   原生 OpenClaw 插件通过 jiti 在进程内加载，并将能力注册到中央注册表中。兼容的 bundle 会在不导入运行时代码的情况下被规范化为注册表记录。
4. **表面消费**
   OpenClaw 的其余部分会读取注册表，以暴露工具、渠道、提供商设置、hooks、HTTP 路由、CLI 命令和服务。

对于插件 CLI 而言，根命令的设备发现专门拆分为两个阶段：

- 解析阶段元数据来自 `registerCli(..., { descriptors: [...] })`
- 实际的插件 CLI 模块可以保持惰性加载，并在首次调用时再注册

这样可以让插件自有的 CLI 代码保持在插件内部，同时仍允许 OpenClaw 在解析之前预留根命令名称。

重要的设计边界是：

- 设备发现 + 配置验证应当基于**清单 / schema 元数据**工作，而不执行插件代码
- 原生运行时行为来自插件模块的 `register(api)` 路径

这种拆分让 OpenClaw 能在完整运行时尚未激活之前，就验证配置、解释缺失 / 已禁用的插件，并构建 UI / schema 提示信息。

### 激活规划

激活规划是控制平面的一部分。调用方可以在加载更广泛的运行时注册表之前，先询问哪些插件与某个具体命令、提供商、渠道、路由、智能体 harness 或能力相关。

规划器保持与当前清单行为兼容：

- `activation.*` 字段是显式的规划器提示
- `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 以及 hooks 仍然作为清单归属关系的后备来源
- 仅返回 id 的规划器 API 仍然对现有调用方可用
- 规划 API 会报告 reason 标签，以便诊断区分显式提示与归属关系后备来源

不要把 `activation` 视为生命周期 hook，也不要把它当作 `register(...)` 的替代品。它只是用于缩小加载范围的元数据。如果已有归属字段可以描述这种关系，就优先使用归属字段；只有在需要额外规划提示时才使用 `activation`。

### 渠道插件与共享 message 工具

对于常规聊天操作，渠道插件不需要单独注册发送 / 编辑 / 响应工具。OpenClaw 在核心中保留了一个共享的 `message` 工具，而渠道插件负责其背后的渠道特定设备发现和执行。

当前边界如下：

- 核心负责共享 `message` 工具宿主、提示词接线、session / thread 记账以及执行分发
- 渠道插件负责作用域内操作发现、能力发现，以及任何渠道特定的 schema 片段
- 渠道插件负责提供商特定的 session 会话语法，例如会话 id 如何编码 thread id，或如何从父会话继承
- 渠道插件通过其 action adapter 执行最终操作

对于渠道插件，SDK 接口为 `ChannelMessageActionAdapter.describeMessageTool(...)`。这个统一的发现调用让插件可以一起返回其可见操作、能力以及 schema 贡献，从而避免这些部分彼此漂移。

当某个渠道特定的 message-tool 参数携带媒体来源，例如本地路径或远程媒体 URL 时，插件还应从 `describeMessageTool(...)` 返回 `mediaSourceParams`。核心会使用这份显式列表来应用沙箱路径规范化和出站媒体访问提示，而无需硬编码插件自有的参数名称。
这里应优先使用按操作划分的映射，而不是整个渠道共用的一份扁平列表，这样仅用于 profile 的媒体参数就不会在 `send` 这类无关操作中被规范化。

核心会把运行时作用域传入该发现步骤。重要字段包括：

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 受信任的入站 `requesterSenderId`

这对于上下文敏感型插件很重要。一个渠道可以根据当前账户、当前房间 / thread / 消息，或受信任的请求方身份来隐藏或暴露消息操作，而无需在核心 `message` 工具中硬编码渠道特定分支。

这也是为什么嵌入式 runner 路由变更仍然属于插件工作：runner 负责把当前聊天 / session 身份转发到插件发现边界，从而让共享的 `message` 工具为当前轮次暴露正确的渠道自有表面。

对于渠道自有的执行辅助运行时，内置插件应将执行运行时保留在其自身扩展模块内。核心不再在 `src/agents/tools` 下持有 Discord、Slack、Telegram 或 WhatsApp 的消息操作运行时。我们不会发布单独的 `plugin-sdk/*-action-runtime` 子路径，内置插件应直接从其扩展自有模块导入本地运行时代码。

同样的边界也适用于一般情况下带有提供商命名的 SDK 接缝：核心不应导入 Slack、Discord、Signal、WhatsApp 或类似扩展的渠道特定便捷 barrel。如果核心需要某种行为，要么消费内置插件自己的 `api.ts` / `runtime-api.ts` barrel，要么将该需求提升为共享 SDK 中一个范围明确的通用能力。

对于投票，当前有两条执行路径：

- `outbound.sendPoll` 是适用于符合通用投票模型的渠道的共享基线
- `actions.handleAction("poll")` 是处理渠道特定投票语义或额外投票参数的首选路径

现在，核心会在插件投票分发拒绝该操作之后，才延迟执行共享投票解析，这样插件自有的投票处理器就能接受渠道特定的投票字段，而不会先被通用投票解析器拦住。

完整启动顺序请参见 [插件架构内部机制](/zh-CN/plugins/architecture-internals)。

## 能力归属模型

OpenClaw 将原生插件视为某个**公司**或某个**功能**的归属边界，而不是一堆互不相关集成的杂货袋。

这意味着：

- 一个公司插件通常应拥有该公司的所有面向 OpenClaw 的表面
- 一个功能插件通常应拥有其引入的完整功能表面
- 渠道应消费共享的核心能力，而不是临时重新实现提供商行为

<Accordion title="内置插件中的归属模式示例">
  - **厂商多能力**：`openai` 拥有文本推理、语音、实时语音、媒体理解和图像生成。`google` 拥有文本推理，以及媒体理解、图像生成和网页搜索。`qwen` 拥有文本推理，以及媒体理解和视频生成。
  - **厂商单能力**：`elevenlabs` 和 `microsoft` 拥有语音；`firecrawl` 拥有网页抓取；`minimax` / `mistral` / `moonshot` / `zai` 拥有媒体理解后端。
  - **功能插件**：`voice-call` 拥有通话传输、工具、CLI、路由和 Twilio 媒体流桥接，但它会消费共享的语音、实时转录和实时语音能力，而不是直接导入厂商插件。
</Accordion>

预期的最终状态是：

- 即使 OpenAI 横跨文本模型、语音、图像以及未来的视频，它也只存在于一个插件中
- 其他厂商也可以对自己的表面区域采用同样方式
- 渠道不需要关心哪个厂商插件拥有该提供商；它们消费的是由核心暴露的共享能力契约

这是关键区别：

- **plugin** = 归属边界
- **capability** = 可由多个插件实现或消费的核心契约

因此，如果 OpenClaw 新增一个领域，例如视频，首要问题不是“哪个提供商应该硬编码视频处理？”首要问题是“核心视频能力契约是什么？”一旦该契约存在，厂商插件就可以对其注册，渠道 / 功能插件也可以消费它。

如果该能力尚不存在，通常正确的做法是：

1. 在核心中定义缺失的能力
2. 通过插件 API / 运行时以类型化方式暴露它
3. 让渠道 / 功能围绕该能力完成接线
4. 让厂商插件注册实现

这样既能保持归属关系清晰，又能避免依赖单一厂商或一次性插件专用代码路径的核心行为。

### 能力分层

在决定代码应放在哪里时，可使用以下思维模型：

- **核心能力层**：共享编排、策略、回退、配置合并规则、交付语义和类型化契约
- **厂商插件层**：厂商特定 API、认证、模型目录、语音合成、图像生成、未来的视频后端、使用量端点
- **渠道 / 功能插件层**：Slack / Discord / voice-call / 等集成，负责消费核心能力并将其呈现在某个表面上

例如，TTS 采用如下结构：

- 核心负责回复时 TTS 策略、回退顺序、偏好设置和渠道交付
- `openai`、`elevenlabs` 和 `microsoft` 负责合成实现
- `voice-call` 消费电话 TTS 运行时辅助接口

未来的新能力也应优先采用相同模式。

### 多能力公司插件示例

一个公司插件从外部看应当是内聚的。如果 OpenClaw 为模型、语音、实时转录、实时语音、媒体理解、图像生成、视频生成、网页抓取和网页搜索提供了共享契约，那么某个厂商就可以在一个地方拥有其所有表面：

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

重要的不是辅助函数的精确名称，而是这种结构：

- 一个插件拥有该厂商表面
- 核心仍然拥有能力契约
- 渠道和功能插件消费 `api.runtime.*` 辅助接口，而不是厂商代码
- 契约测试可以断言该插件注册了它声称拥有的能力

### 能力示例：视频理解

OpenClaw 已经将图像 / 音频 / 视频理解视为一种共享能力。相同的归属模型也适用于这里：

1. 核心定义媒体理解契约
2. 厂商插件按适用情况注册 `describeImage`、`transcribeAudio` 和 `describeVideo`
3. 渠道和功能插件消费共享核心行为，而不是直接接线到厂商代码

这样可以避免把某个提供商的视频假设直接写进核心中。插件拥有厂商表面；核心拥有能力契约和回退行为。

视频生成也已经采用相同顺序：核心拥有类型化能力契约和运行时辅助接口，而厂商插件通过 `api.registerVideoGenerationProvider(...)` 注册其实现。

需要具体的发布清单吗？请参见
[能力扩展手册](/zh-CN/plugins/architecture)。

## 契约与强制执行

插件 API 表面有意通过 `OpenClawPluginApi` 进行类型化和集中化。该契约定义了受支持的注册点，以及插件可依赖的运行时辅助接口。

这很重要，原因如下：

- 插件作者获得一套稳定的内部标准
- 核心可以拒绝重复归属，例如两个插件注册相同的提供商 id
- 启动过程可以为格式错误的注册提供可操作的诊断信息
- 契约测试可以强制执行内置插件归属，防止无声漂移

这里有两层强制执行：

1. **运行时注册强制执行**
   插件注册表会在插件加载时验证注册内容。例如：重复的提供商 id、重复的语音提供商 id，以及格式错误的注册，都会产出插件诊断，而不是导致未定义行为。
2. **契约测试**
   在测试运行期间，内置插件会被捕获到契约注册表中，以便 OpenClaw 可以显式断言归属关系。目前这已用于模型提供商、语音提供商、网页搜索提供商以及内置注册归属。

实际效果是，OpenClaw 能在一开始就知道哪个插件拥有哪个表面。这样核心和渠道就能无缝组合，因为归属是声明式、类型化且可测试的，而不是隐式的。

### 什么内容应属于契约

好的插件契约应当具备以下特点：

- 有类型
- 小而精
- 能力特定
- 由核心拥有
- 可被多个插件复用
- 可在不了解厂商细节的前提下被渠道 / 功能消费

不好的插件契约包括：

- 隐藏在核心中的厂商特定策略
- 绕过注册表的一次性插件逃逸口
- 直接探入厂商实现的渠道代码
- 不属于 `OpenClawPluginApi` 或 `api.runtime` 的临时运行时对象

如果拿不准，应提高抽象层级：先定义能力，再让插件接入它。

## 执行模型

原生 OpenClaw 插件与 Gateway 网关**在同一进程内**运行。它们不在沙箱中。已加载的原生插件与核心代码处于相同的进程级信任边界内。

其含义包括：

- 原生插件可以注册工具、网络处理器、hooks 和服务
- 原生插件中的 bug 可能导致 Gateway 网关崩溃或失稳
- 恶意原生插件等同于在 OpenClaw 进程内执行任意代码

兼容 bundle 默认更安全，因为 OpenClaw 当前将它们视为元数据 / 内容包。在当前版本中，这主要意味着内置 Skills。

对于非内置插件，请使用 allowlist 和显式安装 / 加载路径。将工作区插件视为开发期代码，而不是生产环境默认项。

对于内置工作区包名，请让插件 id 默认锚定在 npm 名称中：`@openclaw/<id>`，或者使用经过批准的类型化后缀，例如 `-provider`、`-plugin`、`-speech`、`-sandbox` 或 `-media-understanding`，前提是该包有意暴露更窄的插件角色。

重要的信任说明：

- `plugins.allow` 信任的是**插件 id**，而不是来源出处。
- 与内置插件拥有相同 id 的工作区插件，在该工作区插件被启用 / 加入 allowlist 时，会有意遮蔽内置副本。
- 这属于正常且有用的行为，适用于本地开发、补丁测试和热修复。
- 内置插件信任是根据源码快照解析的——即加载时磁盘上的清单和代码——而不是根据安装元数据解析。损坏或被替换的安装记录，不能在实际源码声明之外静默扩大内置插件的信任表面。

## 导出边界

OpenClaw 导出的是能力，而不是实现便利接口。

保持能力注册公开。应裁剪非契约辅助导出：

- 内置插件特定的辅助子路径
- 不打算作为公开 API 的运行时管线子路径
- 厂商特定的便捷辅助函数
- 属于实现细节的设置 / 新手引导辅助函数

为了兼容性和内置插件维护，某些内置插件辅助子路径仍保留在生成的 SDK 导出映射中。当前示例包括 `plugin-sdk/feishu`、`plugin-sdk/feishu-setup`、`plugin-sdk/zalo`、`plugin-sdk/zalo-setup` 以及若干 `plugin-sdk/matrix*` 接缝。应将这些视为保留的实现细节导出，而不是新第三方插件推荐采用的 SDK 模式。

## 内部机制与参考

关于加载流水线、注册表模型、提供商运行时钩子、Gateway 网关 HTTP 路由、message 工具 schema、渠道目标解析、提供商目录、上下文引擎插件，以及新增能力的指南，请参见
[插件架构内部机制](/zh-CN/plugins/architecture-internals)。

## 相关内容

- [构建插件](/zh-CN/plugins/building-plugins)
- [插件 SDK 设置](/zh-CN/plugins/sdk-setup)
- [插件清单](/zh-CN/plugins/manifest)
