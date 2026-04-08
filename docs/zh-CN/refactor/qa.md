---
x-i18n:
    generated_at: "2026-04-08T04:39:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a9066b2a939c5a9ba69141d75405f0e8097997b523164340e2f0e9a0d5060dd
    source_path: refactor/qa.md
    workflow: 15
---

# QA 重构

状态：基础迁移已完成。

## 目标

将 OpenClaw QA 从拆分定义模型迁移到单一事实来源：

- 场景元数据
- 发送给模型的提示词
- 设置与清理
- harness 逻辑
- 断言与成功标准
- 工件与报告提示

期望的最终状态是一个通用 QA harness，它加载功能强大的场景定义文件，而不是将大部分行为硬编码在 TypeScript 中。

## 当前状态

当前的主要事实来源现在位于 `qa/scenarios/index.md`，并且每个
场景在 `qa/scenarios/*.md` 下各有一个文件。

已实现：

- `qa/scenarios/index.md`
  - 规范的 QA 包元数据
  - 操作员身份
  - 启动任务
- `qa/scenarios/*.md`
  - 每个场景对应一个 markdown 文件
  - 场景元数据
  - 处理器绑定
  - 场景专用执行配置
- `extensions/qa-lab/src/scenario-catalog.ts`
  - markdown 包解析器 + zod 验证
- `extensions/qa-lab/src/qa-agent-bootstrap.ts`
  - 根据 markdown 包渲染计划
- `extensions/qa-lab/src/qa-agent-workspace.ts`
  - 生成兼容性文件以及 `QA_SCENARIOS.md`
- `extensions/qa-lab/src/suite.ts`
  - 通过 markdown 定义的处理器绑定选择可执行场景
- QA 总线协议 + UI
  - 用于渲染图像 / 视频 / 音频 / 文件的通用内联附件

仍然拆分的表面：

- `extensions/qa-lab/src/suite.ts`
  - 仍然拥有大部分可执行的自定义处理器逻辑
- `extensions/qa-lab/src/report.ts`
  - 仍然从运行时输出推导报告结构

因此，事实来源拆分问题已经修复，但执行仍然主要依赖处理器支持，而不是完全声明式。

## 真实的场景表面是什么样的

阅读当前 suite 可以看出几类不同的场景。

### 简单交互

- 渠道基线
- 私信基线
- 线程后续跟进
- 模型切换
- 审批后续执行
- 反应 / 编辑 / 删除

### 配置与运行时变更

- config patch 技能禁用
- config apply 重启唤醒
- config 重启能力切换
- 运行时清单漂移检查

### 文件系统与仓库断言

- source / docs 发现报告
- 构建 Lobster Invaders
- 生成图像工件查找

### 记忆编排

- 记忆召回
- 渠道上下文中的记忆工具
- 记忆失败回退
- 会话记忆排序
- 线程记忆隔离
- 记忆 dreaming sweep

### 工具与插件集成

- MCP plugin-tools 调用
- skill 可见性
- skill 热安装
- 原生图像生成
- 图像往返
- 来自附件的图像理解

### 多轮与多参与者

- subagent 交接
- subagent 扇出汇总
- 重启恢复类流程

这些类别很重要，因为它们决定 DSL 需求。仅有提示词 + 期望文本的平面列表是不够的。

## 方向

### 单一事实来源

使用 `qa/scenarios/index.md` 加 `qa/scenarios/*.md` 作为编写时的事实来源。

该包应保持：

- 在代码审查中便于人类阅读
- 可供机器解析
- 足够丰富，以驱动：
  - suite 执行
  - QA 工作区引导
  - QA Lab UI 元数据
  - docs / discovery 提示词
  - 报告生成

### 首选编写格式

使用 markdown 作为顶层格式，内部嵌入结构化 YAML。

推荐形状：

- YAML frontmatter
  - id
  - title
  - surface
  - tags
  - docs refs
  - code refs
  - model / provider overrides
  - prerequisites
- prose sections
  - 目标
  - 注释
  - 调试提示
- fenced YAML blocks
  - setup
  - steps
  - assertions
  - cleanup

这样可以得到：

- 比庞大的 JSON 更好的 PR 可读性
- 比纯 YAML 更丰富的上下文
- 严格解析与 zod 验证

原始 JSON 仅在作为中间生成形式时可接受。

## 拟议的场景文件形状

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

## 该 DSL 必须覆盖的运行器能力

根据当前 suite，通用运行器需要的不只是提示词执行。

### 环境与设置操作

- `bus.reset`
- `gateway.waitHealthy`
- `channel.waitReady`
- `session.create`
- `thread.create`
- `workspace.writeSkill`

### 智能体轮次操作

- `agent.send`
- `agent.wait`
- `bus.injectInbound`
- `bus.injectOutbound`

### 配置与运行时操作

- `config.get`
- `config.patch`
- `config.apply`
- `gateway.restart`
- `tools.effective`
- `skills.status`

### 文件与工件操作

- `file.write`
- `file.read`
- `file.delete`
- `file.touchTime`
- `artifact.captureGeneratedImage`
- `artifact.capturePath`

### 记忆与 cron 操作

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

## 变量与工件引用

该 DSL 必须支持已保存输出及其后续引用。

当前 suite 中的示例：

- 创建一个线程，然后复用 `threadId`
- 创建一个会话，然后复用 `sessionKey`
- 生成一张图像，然后在下一轮附加该文件
- 生成一个唤醒标记字符串，然后断言它稍后会出现

所需能力：

- `saveAs`
- `${vars.name}`
- `${artifacts.name}`
- 路径、会话键、线程 id、标记、工具输出的类型化引用

如果没有变量支持，harness 将继续把场景逻辑泄漏回 TypeScript。

## 哪些内容应保留为逃生口

在第 1 阶段，实现一个完全纯声明式的运行器并不现实。

有些场景本质上就是高度依赖编排的：

- 记忆 dreaming sweep
- config apply 重启唤醒
- config 重启能力切换
- 依据时间戳 / 路径解析生成图像工件
- discovery-report 评估

这些场景目前应继续使用显式自定义处理器。

推荐规则：

- 85 - 90% 声明式
- 对于剩余困难部分，使用显式 `customHandler` 步骤
- 仅允许具名且有文档说明的自定义处理器
- 场景文件中不允许匿名内联代码

这样可以保持通用引擎整洁，同时仍然允许推进工作。

## 架构变更

### 当前

场景 markdown 已经是以下内容的事实来源：

- suite 执行
- 工作区引导文件
- QA Lab UI 场景目录
- 报告元数据
- discovery 提示词

已生成的兼容内容：

- 种子工作区仍然包含 `QA_KICKOFF_TASK.md`
- 种子工作区仍然包含 `QA_SCENARIO_PLAN.md`
- 种子工作区现在还包含 `QA_SCENARIOS.md`

## 重构计划

### 第 1 阶段：加载器与 schema

已完成。

- 添加了 `qa/scenarios/index.md`
- 将场景拆分到 `qa/scenarios/*.md`
- 为具名 markdown YAML 包内容添加了解析器
- 使用 zod 进行验证
- 将消费者切换为使用已解析的包
- 删除了仓库级别的 `qa/seed-scenarios.json` 和 `qa/QA_KICKOFF_TASK.md`

### 第 2 阶段：通用引擎

- 将 `extensions/qa-lab/src/suite.ts` 拆分为：
  - loader
  - engine
  - action registry
  - assertion registry
  - custom handlers
- 保留现有辅助函数作为引擎操作

交付成果：

- 引擎执行简单的声明式场景

先从主要是 prompt + wait + assert 的场景开始：

- 线程后续跟进
- 来自附件的图像理解
- skill 可见性与调用
- 渠道基线

交付成果：

- 第一批真正由 markdown 定义的场景通过通用引擎发布

### 第 4 阶段：迁移中等复杂度场景

- 图像生成往返
- 渠道上下文中的记忆工具
- 会话记忆排序
- subagent 交接
- subagent 扇出汇总

交付成果：

- 变量、工件、工具断言、请求日志断言得到验证

### 第 5 阶段：将复杂场景保留在自定义处理器上

- 记忆 dreaming sweep
- config apply 重启唤醒
- config 重启能力切换
- 运行时清单漂移

交付成果：

- 保持相同的编写格式，但在需要时使用显式自定义步骤块

### 第 6 阶段：删除硬编码场景映射

一旦包覆盖率足够高：

- 移除 `extensions/qa-lab/src/suite.ts` 中大部分按场景区分的 TypeScript 分支

## Fake Slack / 富媒体支持

当前 QA 总线以文本优先。

相关文件：

- `extensions/qa-channel/src/protocol.ts`
- `extensions/qa-lab/src/bus-state.ts`
- `extensions/qa-lab/src/bus-queries.ts`
- `extensions/qa-lab/src/bus-server.ts`
- `extensions/qa-lab/web/src/ui-render.ts`

如今 QA 总线支持：

- 文本
- 反应
- 线程

它尚未对内联媒体附件建模。

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

然后向以下类型添加 `attachments?: QaBusAttachment[]`：

- `QaBusMessage`
- `QaBusInboundMessageInput`
- `QaBusOutboundMessageInput`

### 为什么要先做通用模型

不要构建仅适用于 Slack 的媒体模型。

而应使用：

- 一个通用 QA 传输模型
- 在其上构建多个渲染器
  - 当前 QA Lab 聊天
  - 未来的 fake Slack web
  - 任何其他 fake transport 视图

这样可以避免重复逻辑，并让媒体场景保持与传输层无关。

### 所需 UI 工作

更新 QA UI 以渲染：

- 内联图像预览
- 内联音频播放器
- 内联视频播放器
- 文件附件 chip

当前 UI 已经可以渲染线程和反应，因此附件渲染应能叠加到同一消息卡片模型上。

### 媒体传输启用的场景工作

一旦附件能通过 QA 总线流转，我们就可以添加更丰富的 fake-chat 场景：

- fake Slack 中的内联图像回复
- 音频附件理解
- 视频附件理解
- 混合附件顺序
- 保留媒体的线程回复

## 建议

下一个实现阶段应是：

1. 添加 markdown 场景加载器 + zod schema
2. 从 markdown 生成当前目录
3. 先迁移几个简单场景
4. 添加通用 QA 总线附件支持
5. 在 QA UI 中渲染内联图像
6. 然后扩展到音频和视频

这是能够同时验证两个目标的最小路径：

- 通用的 markdown 定义 QA
- 更丰富的 fake messaging 表面

## 未决问题

- 场景文件是否应允许嵌入带变量插值的 markdown 提示词模板
- setup / cleanup 应该是具名章节，还是仅作为有序操作列表
- 工件引用在 schema 中应为强类型，还是基于字符串
- 自定义处理器应放在一个 registry 中，还是按 surface 分 registry
- 迁移期间生成的 JSON 兼容文件是否应继续纳入版本控制
