---
read_when:
    - 重构 QA 场景定义或 qa-lab harness 代码
    - 在 Markdown 场景与 TypeScript harness 逻辑之间迁移 QA 行为
summary: QA 重构计划：scenario catalog 与 harness consolidation
title: QA 重构
x-i18n:
    generated_at: "2026-04-24T04:06:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9c825b17b9af9ccb7902832327897510ac789b5bec0188f7903430324187bca0
    source_path: refactor/qa.md
    workflow: 15
---

状态：基础迁移已落地。

## 目标

将 OpenClaw QA 从分裂定义模型迁移到单一事实来源：

- 场景元数据
- 发送给模型的提示
- setup 和 teardown
- harness 逻辑
- 断言和成功标准
- 产物和报告提示

期望的最终状态是：一个通用 QA harness 加载功能强大的场景定义文件，而不是将大多数行为硬编码在 TypeScript 中。

## 当前状态

当前的主要事实来源现在位于 `qa/scenarios/index.md`，以及
`qa/scenarios/<theme>/*.md` 下每个场景对应的单独文件中。

已实现：

- `qa/scenarios/index.md`
  - 规范的 QA pack 元数据
  - operator 身份
  - kickoff 任务
- `qa/scenarios/<theme>/*.md`
  - 每个场景一个 markdown 文件
  - 场景元数据
  - handler 绑定
  - 场景特定执行配置
- `extensions/qa-lab/src/scenario-catalog.ts`
  - markdown pack 解析器 + zod 验证
- `extensions/qa-lab/src/qa-agent-bootstrap.ts`
  - 从 markdown pack 渲染 plan
- `extensions/qa-lab/src/qa-agent-workspace.ts`
  - 生成兼容性文件以及 `QA_SCENARIOS.md`
- `extensions/qa-lab/src/suite.ts`
  - 通过 markdown 定义的 handler 绑定选择可执行场景
- QA 总线协议 + UI
  - 用于图像/视频/音频/文件渲染的通用内联附件

剩余的分裂表面：

- `extensions/qa-lab/src/suite.ts`
  - 仍然拥有大部分可执行自定义 handler 逻辑
- `extensions/qa-lab/src/report.ts`
  - 仍然从运行时输出中推导报告结构

因此，事实来源分裂问题已经修复，但执行仍然主要依赖 handler，而不是完全声明式。

## 真实的场景表面是什么样

阅读当前 suite 可以看出几类不同的场景。

### 简单交互

- 渠道基线
- 私信基线
- 线程后续跟进
- 模型切换
- 审批后续执行
- reaction/edit/delete

### 配置和运行时变更

- config patch skill disable
- config apply restart wake-up
- config restart capability flip
- runtime inventory drift check

### 文件系统和仓库断言

- source/docs discovery report
- build Lobster Invaders
- generated image artifact lookup

### memory 编排

- memory recall
- 渠道上下文中的 memory 工具
- memory failure fallback
- session memory ranking
- 线程 memory 隔离
- memory dreaming sweep

### 工具和插件集成

- MCP plugin-tools call
- skill visibility
- skill hot install
- native image generation
- image roundtrip
- 从附件理解图像

### 多轮与多参与者

- subagent handoff
- subagent fanout synthesis
- restart recovery style flows

这些分类之所以重要，是因为它们驱动 DSL 需求。单纯的提示 + 预期文本列表是不够的。

## 方向

### 单一事实来源

使用 `qa/scenarios/index.md` 和 `qa/scenarios/<theme>/*.md` 作为
编写时的事实来源。

该 pack 应保持：

- 在 code review 中人类可读
- 机器可解析
- 足够丰富，能够驱动：
  - suite 执行
  - QA workspace bootstrap
  - QA Lab UI 元数据
  - docs/discovery prompts
  - 报告生成

### 首选编写格式

使用 markdown 作为顶层格式，其中包含结构化 YAML。

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

这样可以得到：

- 比庞大的 JSON 更适合 PR 阅读
- 比纯 YAML 更丰富的上下文
- 严格解析和 zod 验证

原始 JSON 只应作为中间生成形式被接受。

## 提议的场景文件结构

示例：

````md
---
id: image-generation-roundtrip
title: Image generation roundtrip
surface: image
tags: [media, image, roundtrip]
models:
  primary: openai/gpt-5.4
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

基于当前 suite，通用运行器需要的不仅仅是提示执行。

### 环境和 setup 操作

- `bus.reset`
- `gateway.waitHealthy`
- `channel.waitReady`
- `session.create`
- `thread.create`
- `workspace.writeSkill`

### 智能体回合操作

- `agent.send`
- `agent.wait`
- `bus.injectInbound`
- `bus.injectOutbound`

### 配置和运行时操作

- `config.get`
- `config.patch`
- `config.apply`
- `gateway.restart`
- `tools.effective`
- `skills.status`

### 文件和产物操作

- `file.write`
- `file.read`
- `file.delete`
- `file.touchTime`
- `artifact.captureGeneratedImage`
- `artifact.capturePath`

### memory 和 cron 操作

- `memory.indexForce`
- `memory.searchCli`
- `doctor.memory.status`
- `cron.list`
- `cron.run`
- `cron.waitCompletion`
- `sessionTranscript.write`

### MCP 操作

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

## 变量和产物引用

DSL 必须支持保存输出并在后续引用。

来自当前 suite 的示例：

- 创建线程，然后复用 `threadId`
- 创建会话，然后复用 `sessionKey`
- 生成图像，然后在下一轮附加该文件
- 生成一个唤醒标记字符串，然后断言它稍后出现

所需能力：

- `saveAs`
- `${vars.name}`
- `${artifacts.name}`
- 路径、会话键、线程 id、标记、工具输出的类型化引用

如果没有变量支持，harness 逻辑就会继续泄漏回 TypeScript。

## 哪些内容应保留为逃生舱

在第一阶段，实现完全纯粹的声明式运行器并不现实。

有些场景天然就需要大量编排：

- memory dreaming sweep
- config apply restart wake-up
- config restart capability flip
- 基于时间戳/路径的 generated image artifact 解析
- discovery-report evaluation

目前这些场景应改为使用显式自定义 handler。

推荐规则：

- 85-90% 为声明式
- 对于剩余困难部分使用显式 `customHandler` 步骤
- 仅允许具名且有文档说明的 custom handlers
- 场景文件中不允许匿名内联代码

这样既能保持通用引擎整洁，也能继续推进。

## 架构变更

### 当前

场景 markdown 现在已经是以下内容的事实来源：

- suite 执行
- workspace bootstrap 文件
- QA Lab UI 场景目录
- 报告元数据
- discovery prompts

生成的兼容性内容：

- 已植入的 workspace 仍包含 `QA_KICKOFF_TASK.md`
- 已植入的 workspace 仍包含 `QA_SCENARIO_PLAN.md`
- 已植入的 workspace 现在也包含 `QA_SCENARIOS.md`

## 重构计划

### 第 1 阶段：加载器和 schema

已完成。

- 添加 `qa/scenarios/index.md`
- 将场景拆分到 `qa/scenarios/<theme>/*.md`
- 为具名 markdown YAML pack 内容添加解析器
- 使用 zod 验证
- 将消费者切换到解析后的 pack
- 删除仓库级别的 `qa/seed-scenarios.json` 和 `qa/QA_KICKOFF_TASK.md`

### 第 2 阶段：通用引擎

- 将 `extensions/qa-lab/src/suite.ts` 拆分为：
  - loader
  - engine
  - action registry
  - assertion registry
  - custom handlers
- 保留现有辅助函数作为引擎操作

交付物：

- 引擎执行简单的声明式场景

先从主要由 prompt + wait + assert 构成的场景开始：

- threaded follow-up
- 从附件理解图像
- skill visibility and invocation
- channel baseline

交付物：

- 第一批真正由 markdown 定义并通过通用引擎运行的场景

### 第 4 阶段：迁移中等复杂度场景

- image generation roundtrip
- 渠道上下文中的 memory 工具
- session memory ranking
- subagent handoff
- subagent fanout synthesis

交付物：

- 变量、产物、工具断言、request-log 断言都得到验证

### 第 5 阶段：将困难场景保留在 custom handlers 中

- memory dreaming sweep
- config apply restart wake-up
- config restart capability flip
- runtime inventory drift

交付物：

- 使用相同的编写格式，但在需要时使用显式 custom-step 块

### 第 6 阶段：删除硬编码场景映射

一旦 pack 覆盖率足够高：

- 删除 `extensions/qa-lab/src/suite.ts` 中大多数场景特定的 TypeScript 分支

## 假 Slack / 富媒体支持

当前 QA 总线是以文本为主的。

相关文件：

- `extensions/qa-channel/src/protocol.ts`
- `extensions/qa-lab/src/bus-state.ts`
- `extensions/qa-lab/src/bus-queries.ts`
- `extensions/qa-lab/src/bus-server.ts`
- `extensions/qa-lab/web/src/ui-render.ts`

如今 QA 总线支持：

- 文本
- reactions
- 线程

它尚未建模内联媒体附件。

### 所需传输契约

添加一个通用 QA 总线附件模型：

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

### 为什么先做通用层

不要构建仅 Slack 专用的媒体模型。

而是：

- 一个通用 QA 传输模型
- 在其上构建多个渲染器
  - 当前 QA Lab 聊天
  - 未来的假 Slack web
  - 任何其他假传输视图

这样可以防止重复逻辑，并让媒体场景保持与传输无关。

### 需要的 UI 工作

更新 QA UI 以渲染：

- 内联图像预览
- 内联音频播放器
- 内联视频播放器
- 文件附件 chip

当前 UI 已经可以渲染线程和 reactions，因此附件渲染应叠加到相同的消息卡片模型上。

### 媒体传输启用后的场景工作

一旦附件能通过 QA 总线流转，我们就可以添加更丰富的假聊天场景：

- 假 Slack 中的内联图像回复
- 音频附件理解
- 视频附件理解
- 混合附件顺序
- 保留媒体的线程回复

## 建议

下一个实现块应为：

1. 添加 markdown 场景加载器 + zod schema
2. 从 markdown 生成当前目录
3. 先迁移几个简单场景
4. 添加通用 QA 总线附件支持
5. 在 QA UI 中渲染内联图像
6. 然后扩展到音频和视频

这是验证两个目标的最小路径：

- 通用的 markdown 定义 QA
- 更丰富的假消息表面

## 未决问题

- 场景文件是否应允许嵌入带变量插值的 markdown 提示模板
- setup/cleanup 应该是具名 section，还是仅作为有序操作列表
- 产物引用在 schema 中应是强类型，还是基于字符串
- custom handlers 应集中放在一个 registry 中，还是按 surface 分 registry
- 迁移期间，生成的 JSON 兼容性文件是否应继续保持已检入状态

## 相关内容

- [QA E2E 自动化](/zh-CN/concepts/qa-e2e-automation)
- [QA 重构](/refactor/qa-refactor)
