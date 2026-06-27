---
read_when:
    - 添加新的核心能力和插件注册接口
    - 决定代码应属于核心、供应商插件还是功能插件
    - 为渠道或工具接入新的运行时辅助函数
sidebarTitle: Adding capabilities
summary: 向 OpenClaw 插件系统添加新的共享能力的贡献者指南
title: 添加能力（贡献者指南）
x-i18n:
    generated_at: "2026-06-27T02:34:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b8a25122a7b76ff5bbb7616748d5fad2397502f9accb5428134a75d65e872034
    source_path: plugins/adding-capabilities.md
    workflow: 16
---

<Info>
  这是面向 OpenClaw 核心开发者的**贡献者指南**。如果你正在
  构建外部插件，请改看[构建插件](/zh-CN/plugins/building-plugins)。
  如需深入架构参考（能力模型、所有权、加载流水线、运行时帮助器），请参阅[插件内部机制](/zh-CN/plugins/architecture)。
</Info>

当 OpenClaw 需要新的共享领域（例如嵌入、图像生成、视频生成，或未来由供应商支持的功能领域）时使用本指南。

规则：

- **插件** = 所有权边界
- **能力** = 共享核心契约

不要一开始就把某个供应商直接接入渠道或工具。先定义能力。

## 何时创建能力

当**全部**条件都成立时，创建新的能力：

1. 可能有多个供应商实现它。
2. 渠道、工具或功能插件应能消费它，而不需要关心供应商。
3. 核心需要拥有回退、策略、配置或交付行为。

如果工作只针对某个供应商，且尚不存在共享契约，请先停下来定义契约。

## 标准顺序

1. 定义有类型的核心契约。
2. 为该契约添加插件注册。
3. 添加共享运行时帮助器。
4. 接入一个真实供应商插件作为证明。
5. 将功能/渠道消费者迁移到运行时帮助器。
6. 添加契约测试。
7. 记录面向操作者的配置和所有权模型。

## 内容放在哪里

**核心：**

- 请求/响应类型。
- 提供商注册表 + 解析。
- 回退行为。
- 配置 schema，并在嵌套对象、通配符、数组项和组合节点上传播 `title` / `description` 文档元数据。
- 运行时帮助器表面。

**供应商插件：**

- 供应商 API 调用。
- 供应商凭证处理。
- 供应商特定的请求规范化。
- 能力实现的注册。

**功能/渠道插件：**

- 调用 `api.runtime.*` 或匹配的 `plugin-sdk/*-runtime` 帮助器。
- 绝不直接调用供应商实现。

## 提供商与运行框架边界

当行为属于模型提供商契约，而不是通用 Agent loop 时，使用**提供商钩子**。示例包括传输选择后的提供商特定请求参数、凭证配置偏好、提示覆盖，以及模型/配置故障转移后的后续回退路由。

当行为属于执行轮次的运行时，使用**智能体运行框架钩子**。运行框架可以分类明确的协议结果，例如空输出、没有可见输出的推理，或没有最终答案的结构化计划，以便外层模型回退策略决定是否重试。

保持两个边界都很窄：

- 核心拥有重试/回退策略。
- 提供商插件拥有提供商特定的请求/凭证/路由提示。
- 运行框架插件拥有运行时特定的尝试分类。
- 第三方插件返回提示，而不是直接修改核心状态。

## 文件检查清单

对于新能力，预期会触及这些区域：

- `src/<capability>/types.ts`
- `src/<capability>/...registry/runtime.ts`
- `src/plugins/types.ts`
- `src/plugins/registry.ts`
- `src/plugins/captured-registration.ts`
- `src/plugins/contracts/registry.ts`
- `src/plugins/runtime/types-core.ts`
- `src/plugins/runtime/index.ts`
- `src/plugin-sdk/<capability>.ts`
- `src/plugin-sdk/<capability>-runtime.ts`
- 一个或多个内置插件包。
- 配置、文档、测试。

## 示例：图像生成

图像生成遵循标准形状：

1. 核心定义 `ImageGenerationProvider`。
2. 核心暴露 `registerImageGenerationProvider(...)`。
3. 核心暴露 `runtime.imageGeneration.generate(...)`。
4. `openai`、`google`、`fal` 和 `minimax` 插件注册由供应商支持的实现。
5. 未来的供应商注册同一个契约，而无需更改渠道/工具。

该配置键有意与视觉分析路由分开：

- `agents.defaults.imageModel` 分析图像。
- `agents.defaults.imageGenerationModel` 生成图像。

保持二者分离，这样回退和策略就能保持明确。

## 嵌入提供商

将 `embeddingProviders` 用于可复用的向量嵌入提供商。此契约
有意比记忆更宽泛：工具、搜索、检索、导入器或
未来的功能插件都可以消费嵌入，而不依赖记忆
引擎。

记忆搜索可以消费通用 `embeddingProviders`。较旧的
`memoryEmbeddingProviders` 契约是兼容性保留，用于现有
记忆特定提供商迁移；新的可复用嵌入提供商应使用
`embeddingProviders`。

## 评审检查清单

发布新能力之前，请验证：

- 没有渠道/工具直接导入供应商代码。
- 运行时帮助器是共享路径。
- 至少有一个契约测试断言内置所有权。
- 配置文档命名新的模型/配置键。
- 插件文档解释所有权边界。

如果某个 PR 跳过能力层，并把供应商行为硬编码到渠道/工具中，请退回并先定义契约。

## 相关

- [插件内部机制](/zh-CN/plugins/architecture) — 能力模型、所有权、加载流水线、运行时帮助器。
- [构建插件](/zh-CN/plugins/building-plugins) — 第一个插件教程。
- [SDK 概览](/zh-CN/plugins/sdk-overview) — 导入映射和注册 API 参考。
- [创建技能](/zh-CN/tools/creating-skills) — 配套贡献者表面。
