---
read_when:
    - 添加新的核心能力和插件注册入口面
    - 判断代码应放在核心、供应商插件还是功能插件中
    - 为渠道或工具接入新的运行时辅助函数
sidebarTitle: Adding Capabilities
summary: 向 OpenClaw 插件系统添加新共享能力的贡献者指南
title: 添加能力（贡献者指南）
x-i18n:
    generated_at: "2026-04-24T08:40:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 864506dd3f61aa64e7c997c9d9e05ce0ad70c80a26a734d4f83b2e80331be4ab
    source_path: tools/capability-cookbook.md
    workflow: 15
---

<Info>
  这是面向 OpenClaw 核心开发者的**贡献者指南**。如果你正在构建外部插件，请改看 [Building Plugins](/zh-CN/plugins/building-plugins)。
</Info>

当 OpenClaw 需要一个新的领域时使用本文，例如图像生成、视频生成，或未来某个由供应商支持的新功能领域。

规则是：

- plugin = 所有权边界
- capability = 共享核心契约

这意味着你不应一开始就把某个供应商直接接入渠道或工具。应先从定义能力开始。

## 何时创建能力

当以下条件**全部**满足时，创建一个新能力：

1. 不止一个供应商有可能实现它
2. 渠道、工具或功能插件应能在不关心供应商的情况下使用它
3. 核心需要拥有回退、策略、配置或交付行为

如果这项工作仅属于某个供应商，且尚不存在共享契约，那就先停下来，先定义契约。

## 标准顺序

1. 定义带类型的核心契约。
2. 为该契约添加插件注册。
3. 添加共享运行时辅助函数。
4. 接入一个真实的供应商插件作为证明。
5. 将功能/渠道使用方迁移到运行时辅助函数上。
6. 添加契约测试。
7. 记录面向运维者的配置和所有权模型。

## 各部分应放在哪里

核心：

- 请求/响应类型
- provider 注册表 + 解析
- 回退行为
- 配置 schema，以及传播到嵌套对象、通配符、数组项和组合节点上的 `title` / `description` 文档元数据
- 运行时辅助函数入口面

供应商插件：

- 供应商 API 调用
- 供应商鉴权处理
- 供应商特定的请求规范化
- 能力实现的注册

功能/渠道插件：

- 调用 `api.runtime.*` 或对应的 `plugin-sdk/*-runtime` 辅助函数
- 绝不直接调用某个供应商实现

## Provider 和 Harness 接缝

当某个行为属于模型 provider 契约，而不是通用智能体循环时，使用 provider hook。示例包括：在选择传输方式后的 provider 特定请求参数、auth profile 偏好、提示词叠加，以及在模型 / profile 失效切换后的后续回退路由。

当某个行为属于执行单轮的运行时时，使用智能体 harness hook。Harness 可以对“成功但不可用”的尝试结果进行分类，例如空响应、仅推理响应或仅规划响应，以便外层模型回退策略决定是否重试。

保持这两个接缝都足够窄：

- 核心拥有重试 / 回退策略
- provider 插件拥有 provider 特定的请求 / 鉴权 / 路由提示
- harness 插件拥有运行时特定的尝试分类
- 第三方插件返回提示，而不是直接修改核心状态

## 文件清单

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
- 配置 / 文档 / 测试

## 示例：图像生成

图像生成遵循标准结构：

1. 核心定义 `ImageGenerationProvider`
2. 核心暴露 `registerImageGenerationProvider(...)`
3. 核心暴露 `runtime.imageGeneration.generate(...)`
4. `openai`、`google`、`fal` 和 `minimax` 插件注册由供应商支持的实现
5. 未来的供应商可以注册同一契约，而无需更改渠道 / 工具

该配置键与视觉分析路由是分开的：

- `agents.defaults.imageModel` = 分析图像
- `agents.defaults.imageGenerationModel` = 生成图像

请保持两者分离，以便让回退和策略保持明确。

## 评审清单

在发布新能力之前，确认：

- 没有渠道 / 工具直接导入供应商代码
- 运行时辅助函数是共享路径
- 至少有一个契约测试断言内置所有权
- 配置文档明确写出新的模型 / 配置键
- 插件文档解释了所有权边界

如果某个 PR 跳过能力层，直接把供应商行为硬编码进渠道 / 工具，应将其打回，并先定义契约。

## 相关内容

- [Plugin](/zh-CN/tools/plugin)
- [Creating skills](/zh-CN/tools/creating-skills)
- [Tools and plugins](/zh-CN/tools)
