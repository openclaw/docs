---
read_when:
    - 添加新的核心能力和插件注册表面
    - 决定代码应归属核心、厂商插件还是功能插件
    - 为渠道或工具接入新的运行时辅助函数
sidebarTitle: Adding capabilities
summary: 为 OpenClaw 插件系统添加新的共享能力的贡献者指南
title: 添加能力（贡献者指南）
x-i18n:
    generated_at: "2026-07-05T11:30:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3534b7521ab8183d91399cded8a3b397be46bf9bd18f2fdb88a8947bad67ffaa
    source_path: plugins/adding-capabilities.md
    workflow: 16
---

<Info>
  这是面向 OpenClaw 核心开发者的**贡献者指南**。如果你正在
  构建外部插件，请改为参阅[构建插件](/zh-CN/plugins/building-plugins)。
  如需深入的架构参考（能力模型、所有权、加载流水线、运行时助手），
  请参阅[插件内部机制](/zh-CN/plugins/architecture)。
</Info>

当 OpenClaw 需要新的共享领域时使用本指南，例如嵌入、图像
生成、视频生成，或未来某个由供应商支持的功能领域。

规则：

- **插件** = 所有权边界
- **能力** = 共享核心契约

不要把供应商直接接入渠道或工具。先定义能力。

## 何时创建能力

只有在**全部**条件都成立时，才创建新能力：

1. 多个供应商都有可能实现它。
2. 渠道、工具或功能插件应能使用它，而无需关心供应商。
3. 核心需要拥有回退、策略、配置或交付行为。

如果工作仅限于供应商，并且尚无共享契约，请先定义契约。

## 标准顺序

1. 定义带类型的核心契约。
2. 为该契约添加插件注册。
3. 添加共享运行时助手。
4. 接入一个真实供应商插件作为证明。
5. 将功能/渠道消费者迁移到运行时助手。
6. 添加契约测试。
7. 记录面向操作员的配置和所有权模型。

## 内容放在哪里

| 层级                       | 拥有内容                                                                                                                                                                                                                                |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **核心**                   | 请求/响应类型；提供商注册表和解析；回退行为；配置 schema，并在嵌套对象、通配符、数组项和组合节点上传播 `title`/`description` 文档元数据；运行时助手表面。 |
| **供应商插件**             | 供应商 API 调用、供应商认证处理、供应商特定的请求规范化，以及能力实现的注册。                                                                                                     |
| **功能/渠道插件**          | 调用 `api.runtime.*` 或匹配的 `plugin-sdk/*-runtime` 助手。绝不直接调用供应商实现。                                                                                                                    |

## 提供商和 harness 接缝

当行为属于模型提供商契约，而不是通用 Agent loop 时，使用**提供商钩子**。示例包括传输选择后的提供商特定请求参数、认证配置偏好、提示词叠加，以及模型/配置故障转移后的后续回退路由。

当行为属于正在执行一个轮次的运行时时，使用 **agent harness 钩子**。Harness 可以分类显式协议结果，例如空输出、有推理但没有可见输出，或有结构化计划但没有最终答案，以便外层模型回退策略可以做出重试决定。

保持这两类接缝狭窄：

- 核心拥有重试/回退策略。
- 提供商插件拥有提供商特定的请求/认证/路由提示。
- Harness 插件拥有运行时特定的尝试分类。
- 第三方插件返回提示，而不是直接修改核心状态。

## 文件清单

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
3. 核心暴露 `api.runtime.imageGeneration.generate(...)` 和 `.listProviders(...)`。
4. 供应商插件（`comfy`、`deepinfra`、`fal`、`google`、`litellm`、`microsoft-foundry`、`minimax`、`openai`、`openrouter`、`vydra`、`xai`）注册由供应商支持的实现。
5. 未来供应商注册相同契约，而无需更改渠道/工具。

配置键有意与视觉分析路由分开：

- `agents.defaults.imageModel` 分析图像。
- `agents.defaults.imageGenerationModel` 生成图像。

保持二者分离，使回退和策略保持显式。

## 嵌入提供商

使用 `registerEmbeddingProvider(...)` / 契约 `embeddingProviders` 来实现
可复用的向量嵌入提供商。该契约有意比记忆更宽：
工具、搜索、检索、导入器或未来的功能插件
都可以使用嵌入，而无需依赖记忆引擎。记忆搜索
也会使用通用的 `embeddingProviders`。

较旧的记忆专用注册 API 和 `memoryEmbeddingProviders`
契约已弃用。所有新的嵌入提供商都应使用 `registerEmbeddingProvider`
和 `embeddingProviders`。

## 审查清单

发布新能力之前，请验证：

- 没有渠道/工具直接导入供应商代码。
- 运行时助手是共享路径。
- 至少一个契约测试断言内置所有权。
- 配置文档命名了新的模型/配置键。
- 插件文档解释了所有权边界。

如果某个 PR 跳过能力层，并把供应商行为硬编码进渠道/工具，请退回它，并先定义契约。

## 相关

- [插件内部机制](/zh-CN/plugins/architecture) — 能力模型、所有权、加载流水线、运行时助手。
- [构建插件](/zh-CN/plugins/building-plugins) — 第一个插件教程。
- [SDK 概览](/zh-CN/plugins/sdk-overview) — 导入映射和注册 API 参考。
- [创建技能](/zh-CN/tools/creating-skills) — 配套贡献者表面。
