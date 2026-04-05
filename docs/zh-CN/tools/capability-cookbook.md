---
read_when:
    - 添加新的核心能力和插件注册表面
    - 判断代码应归属于核心、厂商插件还是功能插件
    - 为渠道或工具接入新的运行时辅助函数
sidebarTitle: Adding Capabilities
summary: 为 OpenClaw 插件系统添加新共享能力的贡献者指南
title: 添加能力（贡献者指南）
x-i18n:
    generated_at: "2026-04-05T10:10:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 29604d88e6df5205b835d71f3078b6223c58b6294135c3e201756c1bcac33ea3
    source_path: tools/capability-cookbook.md
    workflow: 15
---

# 添加能力

<Info>
  这是面向 OpenClaw 核心开发者的**贡献者指南**。如果你正在
  构建外部插件，请改看[构建插件](/zh-CN/plugins/building-plugins)。
</Info>

当 OpenClaw 需要一个新的领域能力时使用本指南，例如图像生成、视频
生成，或未来某个由厂商支持的功能领域。

规则是：

- plugin = 所有权边界
- capability = 共享核心契约

这意味着你不应一开始就把某个厂商直接接入到渠道或
工具中。应先定义能力。

## 何时创建一个能力

当以下条件都成立时，创建一个新能力：

1. 不止一个厂商有可能实现它
2. 渠道、工具或功能插件应能在不关心
   厂商的情况下使用它
3. 核心需要拥有回退、策略、配置或交付行为

如果这项工作仅属于某个厂商，且尚不存在共享契约，请先停下来定义契约。

## 标准顺序

1. 定义类型化的核心契约。
2. 为该契约添加插件注册。
3. 添加共享运行时辅助函数。
4. 接入一个真实的厂商插件作为证明。
5. 让功能/渠道使用方迁移到运行时辅助函数。
6. 添加契约测试。
7. 记录面向操作人员的配置和所有权模型。

## 各部分应放在哪里

核心：

- 请求/响应类型
- 提供商注册表 + 解析
- 回退行为
- 配置 schema，以及在嵌套对象、通配节点、数组项和组合节点上传播的 `title` / `description` 文档元数据
- 运行时辅助函数表面

厂商插件：

- 厂商 API 调用
- 厂商认证处理
- 厂商专用请求规范化
- 能力实现的注册

功能/渠道插件：

- 调用 `api.runtime.*` 或匹配的 `plugin-sdk/*-runtime` 辅助函数
- 绝不直接调用厂商实现

## 文件检查清单

对于一个新能力，预计会涉及这些区域：

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
- 一个或多个内置插件包
- config/docs/tests

## 示例：图像生成

图像生成遵循标准形状：

1. 核心定义 `ImageGenerationProvider`
2. 核心公开 `registerImageGenerationProvider(...)`
3. 核心公开 `runtime.imageGeneration.generate(...)`
4. `openai`、`google`、`fal` 和 `minimax` 插件注册由厂商支持的实现
5. 未来的厂商可以在不更改渠道/工具的情况下注册同一契约

该配置键与视觉分析路由是分开的：

- `agents.defaults.imageModel` = 分析图像
- `agents.defaults.imageGenerationModel` = 生成图像

请将二者保持分离，以便让回退和策略保持明确。

## 审查检查清单

在发布新能力之前，请验证：

- 没有任何渠道/工具直接导入厂商代码
- 运行时辅助函数是共享路径
- 至少有一个契约测试断言了内置所有权
- 配置文档命名了新的模型/配置键
- 插件文档解释了所有权边界

如果某个 PR 跳过能力层，并将厂商行为硬编码到
渠道/工具中，请退回该 PR，并先定义契约。
