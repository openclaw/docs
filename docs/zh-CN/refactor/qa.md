---
read_when:
    - 重构 QA 场景定义或 qa-lab Harness 代码
    - 在 Markdown 场景与 TypeScript Harness 逻辑之间迁移 QA 行为
summary: 用于场景目录和 Harness 整合的 QA 重构计划
title: QA 重构
x-i18n:
    generated_at: "2026-04-23T19:26:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: ffb9c79628fa6208dfaf731c6fb4c767e85a126c8f2066ca859721c5f62b9ab9
    source_path: refactor/qa.md
    workflow: 15
---

# QA 重构

状态：基础迁移已落地。

## 目标

将 OpenClaw QA 从分裂式定义模型迁移为单一事实来源：

- 场景元数据
- 发送给模型的提示词
- setup 和 teardown
- Harness 逻辑
- 断言与成功标准
- 产物与报告提示

期望的最终状态是：一个通用 QA Harness 加载强大的场景定义文件，而不是将大部分行为硬编码在 TypeScript 中。

## 当前状态

主要事实来源现在位于 `qa/scenarios/index.md`，以及每个场景对应的
`qa/scenarios/<theme>/*.md` 文件。

已实现：

- `qa/scenarios/index.md`
  - 规范的 QA 包元数据
  - 操作员身份
  - 启动任务
- `qa/scenarios/<theme>/*.md`
  - 每个场景一个 Markdown 文件
  - 场景元数据
  - 处理器绑定
  - 场景专用执行配置
- `extensions/qa-lab/src/scenario-catalog.ts`
  - Markdown 包解析器 + zod 校验
- `extensions/qa-lab/src/qa-agent-bootstrap.ts`
  - 基于 Markdown 包渲染计划
- `extensions/qa-lab/src/qa-agent-workspace.ts`
  - 生成兼容性文件以及 `QA_SCENARIOS.md`
- `extensions/qa-lab/src/suite.ts`
  - 通过 Markdown 定义的处理器绑定选择可执行场景
- QA bus 协议 + UI
  - 用于图像/视频/音频/文件渲染的通用内联附件

仍然存在的分裂界面：

- `extensions/qa-lab/src/suite.ts`
  - 仍然承载大部分可执行的自定义处理器逻辑
- `extensions/qa-lab/src/report.ts`
  - 仍然从运行时输出推导报告结构

因此，事实来源分裂的问题已经修复，但执行层仍主要由处理器支持，而不是完全声明式。

## 实际的场景界面是什么样的

阅读当前 suite 可以看到几类不同的场景。

### 简单交互

- 渠道基线
- 私信基线
- 线程后续跟进
- 模型切换
- 审批后续执行
- reaction/edit/delete

### 配置与运行时变更

- config patch 技能禁用
- config apply 重启唤醒
- config restart 能力切换
- 运行时清单漂移检查

### 文件系统与仓库断言

- source/docs 发现报告
- 构建 Lobster Invaders
- 生成图像产物查找

### 内存编排

- 内存回忆
- 渠道上下文中的内存工具
- 内存失败回退
- 会话内存排序
- 线程内存隔离
- memory dreaming sweep

### 工具与插件集成

- MCP plugin-tools 调用
- 技能可见性
- 技能热安装
- 原生图像生成
- 图像往返
- 基于附件的图像理解

### 多轮次与多参与者

- subagent 切换交接
- subagent 扇出综合
- 重启恢复类流程

这些类别很重要，因为它们决定 DSL 需求。仅有“提示词 + 预期文本”的扁平列表是不够的。

## 方向

### 单一事实来源

使用 `qa/scenarios/index.md` 和 `qa/scenarios/<theme>/*.md` 作为编写层面的事实来源。

该场景包应保持：

- 便于人工评审阅读
- 可供机器解析
- 足够丰富，以驱动：
  - suite 执行
  - QA 工作区 bootstrap
  - QA Lab UI 元数据
  - docs/discovery 提示词
  - 报告生成

### 首选编写格式

使用 Markdown 作为顶层格式，并在其中嵌入结构化 YAML。

推荐结构：

- YAML frontmatter
  - id
  - title
  - surface
  - tags
  - docs refs
  - code refs
  - model/provider overrides
  - prerequisites
- prose sections
  - objective
  - notes
  - debugging hints
- fenced YAML blocks
  - setup
  - steps
  - assertions
  - cleanup

这样可以带来：

- 比庞大的 JSON 更适合在 PR 中阅读
- 比纯 YAML 具有更丰富的上下文
- 严格解析和 zod 校验

仅在作为中间生成形式时，才接受原始 JSON。

## 提议的场景文件结构

示例：

````md
---
id: image-generation-roundtrip
title: Image generation roundtrip
surface: image
tags: [media, image, roundtrip]
models:
  primary: openai/gpt-5.5
requires:
  tools: [image_generate]
  plugins: [openai, qa-channel]
docsRefs:
  - docs/help/testing.md
  - docs/concepts/model-providers.md
codeRefs:
  - extensions/qa-lab/src/suite.ts
  - src/gateway/chat-attachments.ts
---

# Objective

Verify generated media is reattached on the follow-up turn.

# Setup

```yaml scenario.setup
- action: config.patch
  patch:
    agents:
      defaults:
        imageGenerationModel:
          primary: openai/gpt-image-1
- action: session.create
  key: agent:qa:image-roundtrip
```

# Steps

```yaml scenario.steps
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Image generation check: generate a QA lighthouse image and summarize it in one short sentence.
- action: artifact.capture
  kind: generated-image
  promptSnippet: Image generation check
  saveAs: lighthouseImage
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Roundtrip image inspection check: describe the generated lighthouse attachment in one short sentence.
  attachments:
    - fromArtifact: lighthouseImage
```

# Expect

```yaml scenario.expect
- assert: outbound.textIncludes
  value: lighthouse
- assert: requestLog.matches
  where:
    promptIncludes: Roundtrip image inspection check
  imageInputCountGte: 1
- assert: artifact.exists
  ref: lighthouseImage
```
````

## DSL 必须覆盖的运行器能力

根据当前 suite，通用运行器需要的不只是提示词执行。

### 环境与 setup 动作

- `bus.reset`
- `gateway.waitHealthy`
- `channel.waitReady`
- `session.create`
- `thread.create`
- `workspace.writeSkill`

### 智能体轮次动作

- `agent.send`
- `agent.wait`
- `bus.injectInbound`
- `bus.injectOutbound`

### 配置与运行时动作

- `config.get`
- `config.patch`
- `config.apply`
- `gateway.restart`
- `tools.effective`
- `skills.status`

### 文件与产物动作

- `file.write`
- `file.read`
- `file.delete`
- `file.touchTime`
- `artifact.captureGeneratedImage`
- `artifact.capturePath`

### 内存与 cron 动作

- `memory.indexForce`
- `memory.searchCli`
- `doctor.memory.status`
- `cron.list`
- `cron.run`
- `cron.waitCompletion`
- `sessionTranscript.write`

### MCP 动作

- `mcp.callTool`

### 断言

- `outbound.textIncludes`
- `outbound.inThread`
- `outbound.notInRoot`
- `tool.called`
- `tool.notPresent`
- `skill.visible`
- `skill.disabled`
- `file.contains`
- `memory.contains`
- `requestLog.matches`
- `sessionStore.matches`
- `cron.managedPresent`
- `artifact.exists`

## 变量与产物引用

DSL 必须支持保存输出以及后续引用。

来自当前 suite 的示例：

- 创建线程，然后复用 `threadId`
- 创建会话，然后复用 `sessionKey`
- 生成图像，然后在下一轮中附加该文件
- 生成一个唤醒标记字符串，然后断言它稍后会出现

所需能力：

- `saveAs`
- `${vars.name}`
- `${artifacts.name}`
- 针对路径、会话键、线程 id、标记、工具输出的类型化引用

如果没有变量支持，Harness 将继续把场景逻辑泄漏回 TypeScript 中。

## 哪些内容应保留为逃生口

在第 1 阶段，实现一个完全纯粹的声明式运行器并不现实。

有些场景天然就需要大量编排：

- memory dreaming sweep
- config apply 重启唤醒
- config restart 能力切换
- 按时间戳/路径解析生成图像产物
- discovery-report 评估

这些场景目前应继续使用显式自定义处理器。

推荐规则：

- 85–90% 声明式
- 对于剩余的困难部分，使用显式 `customHandler` 步骤
- 只允许具名且有文档的自定义处理器
- 场景文件中不允许匿名内联代码

这样既能保持通用引擎整洁，又能继续推进。

## 架构变更

### 当前

场景 Markdown 已经是以下内容的事实来源：

- suite 执行
- 工作区 bootstrap 文件
- QA Lab UI 场景目录
- 报告元数据
- discovery 提示词

生成的兼容层：

- 已植入的工作区仍然包含 `QA_KICKOFF_TASK.md`
- 已植入的工作区仍然包含 `QA_SCENARIO_PLAN.md`
- 已植入的工作区现在还包含 `QA_SCENARIOS.md`

## 重构计划

### 第 1 阶段：加载器与 schema

已完成。

- 添加了 `qa/scenarios/index.md`
- 将场景拆分到 `qa/scenarios/<theme>/*.md`
- 为具名 Markdown YAML 包内容添加了解析器
- 使用 zod 进行校验
- 将消费者切换到解析后的场景包
- 删除了仓库级 `qa/seed-scenarios.json` 和 `qa/QA_KICKOFF_TASK.md`

### 第 2 阶段：通用引擎

- 将 `extensions/qa-lab/src/suite.ts` 拆分为：
  - loader
  - engine
  - action registry
  - assertion registry
  - custom handlers
- 保留现有辅助函数作为引擎操作

交付物：

- 引擎能够执行简单的声明式场景

从那些大多由“提示词 + 等待 + 断言”构成的场景开始：

- 线程后续跟进
- 基于附件的图像理解
- 技能可见性与调用
- 渠道基线

交付物：

- 第一批真正由 Markdown 定义并通过通用引擎运行的场景上线

### 第 4 阶段：迁移中等复杂度场景

- 图像生成往返
- 渠道上下文中的内存工具
- 会话内存排序
- subagent 切换交接
- subagent 扇出综合

交付物：

- 变量、产物、工具断言、请求日志断言都得到验证

### 第 5 阶段：将困难场景保留在自定义处理器中

- memory dreaming sweep
- config apply 重启唤醒
- config restart 能力切换
- 运行时清单漂移

交付物：

- 仍使用同一种编写格式，但在需要时使用显式自定义步骤块

### 第 6 阶段：删除硬编码场景映射

当场景包覆盖率足够高后：

- 删除 `extensions/qa-lab/src/suite.ts` 中大部分场景专用 TypeScript 分支

## 假 Slack / 富媒体支持

当前 QA bus 以文本为主。

相关文件：

- `extensions/qa-channel/src/protocol.ts`
- `extensions/qa-lab/src/bus-state.ts`
- `extensions/qa-lab/src/bus-queries.ts`
- `extensions/qa-lab/src/bus-server.ts`
- `extensions/qa-lab/web/src/ui-render.ts`

目前 QA bus 支持：

- 文本
- reactions
- 线程

它尚未对内联媒体附件建模。

### 所需的传输契约

添加一个通用的 QA bus 附件模型：

```ts
type QaBusAttachment = {
  id: string;
  kind: "image" | "video" | "audio" | "file";
  mimeType: string;
  fileName?: string;
  inline?: boolean;
  url?: string;
  contentBase64?: string;
  width?: number;
  height?: number;
  durationMs?: number;
  altText?: string;
  transcript?: string;
};
```

然后为以下类型添加 `attachments?: QaBusAttachment[]`：

- `QaBusMessage`
- `QaBusInboundMessageInput`
- `QaBusOutboundMessageInput`

### 为什么要先做通用层

不要构建 Slack 专用的媒体模型。

应当改为：

- 一个通用的 QA 传输模型
- 其上构建多个渲染器
  - 当前 QA Lab 聊天界面
  - 未来的假 Slack 网页界面
  - 其他任何假传输视图

这样可以避免重复逻辑，并让媒体场景保持与传输层无关。

### 需要的 UI 工作

更新 QA UI，以渲染：

- 内联图像预览
- 内联音频播放器
- 内联视频播放器
- 文件附件 chip

当前 UI 已经可以渲染线程和 reactions，因此附件渲染应能叠加到同一套消息卡片模型上。

### 媒体传输启用后的场景工作

一旦附件能够通过 QA bus 流转，我们就可以添加更丰富的假聊天场景：

- 假 Slack 中的内联图像回复
- 音频附件理解
- 视频附件理解
- 混合附件顺序
- 在线程回复中保留媒体

## 建议

下一块实现工作应当是：

1. 添加 Markdown 场景加载器 + zod schema
2. 从 Markdown 生成当前目录
3. 先迁移几个简单场景
4. 添加通用 QA bus 附件支持
5. 在 QA UI 中渲染内联图像
6. 然后扩展到音频和视频

这是能够同时证明以下两个目标的最小路径：

- 通用的、由 Markdown 定义的 QA
- 更丰富的假消息界面

## 未解决问题

- 场景文件是否应允许嵌入带变量插值的 Markdown 提示词模板
- setup/cleanup 是否应为具名分节，还是仅作为有序动作列表
- 产物引用在 schema 中是否应采用强类型，还是基于字符串
- 自定义处理器应放在单一注册表中，还是按 surface 分注册表
- 迁移期间生成的 JSON 兼容文件是否应继续保留在版本控制中
