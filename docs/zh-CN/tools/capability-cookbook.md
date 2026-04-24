---
read_when:
    - 添加新的核心能力和插件注册接口
    - 判断代码应放在核心、vendor 插件还是功能插件中
    - 为渠道或工具接入新的运行时辅助函数
sidebarTitle: Adding Capabilities
summary: 向 OpenClaw 插件系统添加新的共享能力的贡献者指南
title: 添加能力（贡献者指南）
x-i18n:
    generated_at: "2026-04-24T16:19:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: a2879b8a4a215dcc44086181e49c510edae93caff01e52c2f5e6b79e6cb02d7b
    source_path: tools/capability-cookbook.md
    workflow: 15
---

<Info>
  这是面向 OpenClaw 核心开发者的**贡献者指南**。如果你是在构建外部插件，请改看 [Building Plugins](/zh-CN/plugins/building-plugins)。
</Info>

当 OpenClaw 需要一个新的领域能力时使用本指南，例如图像生成、视频生成，或未来某个由 vendor 支持的功能领域。

规则如下：

- plugin = 所有权边界
- capability = 共享核心契约

这意味着，你不应一开始就把某个 vendor 直接接入渠道或工具。应先定义该能力。

## 何时创建一个能力

当以下条件**全部**满足时，创建一个新能力：

1. 不止一个 vendor 有可能实现它
2. 渠道、工具或功能插件应能在不关心 vendor 的情况下使用它
3. 核心需要拥有回退、策略、配置或交付行为

如果这项工作只是 vendor 专属，而共享契约尚不存在，先停下来，先定义契约。

## 标准顺序

1. 定义带类型的核心契约。
2. 为该契约添加插件注册接口。
3. 添加一个共享运行时辅助函数。
4. 接入一个真实的 vendor 插件作为验证。
5. 让功能 / 渠道使用方迁移到该运行时辅助函数。
6. 添加契约测试。
7. 记录面向操作者的配置和所有权模型。

## 各部分分别放在哪里

核心：

- 请求 / 响应类型
- 提供商注册表 + 解析
- 回退行为
- 配置 schema，以及传播到嵌套对象、通配符、数组项和组合节点上的 `title` / `description` 文档元数据
- 运行时辅助接口

Vendor 插件：

- vendor API 调用
- vendor 认证处理
- vendor 特定的请求规范化
- 该能力实现的注册

功能 / 渠道插件：

- 调用 `api.runtime.*` 或匹配的 `plugin-sdk/*-runtime` 辅助函数
- 绝不直接调用某个 vendor 实现

## 提供商与 harness 接缝

当某个行为属于模型提供商契约，而不是通用智能体循环时，使用 provider hooks。示例包括：传输选择之后的 provider 特定请求参数、auth-profile 偏好、提示词覆盖，以及模型 / 配置文件故障转移之后的后续回退路由。

当某个行为属于执行某一轮的运行时时，使用智能体 harness hooks。Harness 可以对“成功但不可用”的尝试结果进行分类，例如空响应、仅推理响应或仅规划响应，以便外层模型回退策略决定是否重试。

保持这两类接缝足够窄：

- 核心拥有重试 / 回退策略
- provider 插件拥有 provider 特定的请求 / 认证 / 路由提示
- harness 插件拥有运行时特定的尝试结果分类
- 第三方插件返回提示，而不是直接修改核心状态

## 文件检查清单

对于一个新能力，通常需要改动这些区域：

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

图像生成遵循标准形态：

1. 核心定义 `ImageGenerationProvider`
2. 核心公开 `registerImageGenerationProvider(...)`
3. 核心公开 `runtime.imageGeneration.generate(...)`
4. `openai`、`google`、`fal` 和 `minimax` 插件注册由 vendor 支持的实现
5. 未来的 vendor 可以注册同一契约，而无需更改渠道 / 工具

该配置键与视觉分析路由是分开的：

- `agents.defaults.imageModel` = 分析图像
- `agents.defaults.imageGenerationModel` = 生成图像

保持二者分离，这样回退和策略才能保持明确。

## 评审检查清单

在发布一个新能力之前，确认：

- 没有渠道 / 工具直接导入 vendor 代码
- 运行时辅助函数是共享路径
- 至少有一个契约测试断言内置所有权
- 配置文档命名了新的 model / config 键
- 插件文档解释了所有权边界

如果某个 PR 跳过了能力层，并把 vendor 行为硬编码进渠道 / 工具中，将其打回，并先定义契约。

## 相关内容

- [Plugin](/zh-CN/tools/plugin)
- [Creating skills](/zh-CN/tools/creating-skills)
- [Tools and plugins](/zh-CN/tools)
