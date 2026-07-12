---
read_when:
    - 你正在安装、配置或审计 anthropic-vertex 插件
summary: 用于在 Google Vertex AI 上使用 Claude 模型的 OpenClaw Anthropic Vertex 提供商插件。
title: Anthropic Vertex 插件
x-i18n:
    generated_at: "2026-07-11T20:47:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe5500ca56df49c0ef6ccbf39ced71e3fd0b18776ad23716de8575bc6ba64cb8
    source_path: plugins/reference/anthropic-vertex.md
    workflow: 16
---

# Anthropic Vertex 插件

用于在 Google Vertex AI 上使用 Claude 模型的 OpenClaw Anthropic Vertex 提供商插件。

## 分发

- 软件包：`@openclaw/anthropic-vertex-provider`
- 安装途径：npm；ClawHub

## 接口

提供商：anthropic-vertex

<!-- openclaw-plugin-reference:manual-start -->

## Claude Fable 5

如果你的 Google Cloud 区域中提供该模型，请使用 `anthropic-vertex/claude-fable-5`。
Fable 5 始终使用自适应思考，默认推理强度为 `high`。由于该模型不支持禁用思考，`/think off` 和
`/think minimal` 会使用 `low` 推理强度。

## Claude Sonnet 5

通过 Vertex 的 `global`、`us` 或 `eu` 端点使用 `anthropic-vertex/claude-sonnet-5`。
Sonnet 5 默认使用 `high` 推理强度的自适应思考，并支持 `/think off`
或原生的 `/think xhigh|max` 级别。OpenClaw 会自动公布其
1,000,000 个 token 的上下文窗口和 128,000 个 token 的输出限制。

目录定价遵循 Vertex 的全球优惠价格：截至 2026 年 8 月 31 日，每百万输入/输出
token 的价格为 `$2/$10`；从 9 月 1 日起调整为 `$3/$15`。`us` 和 `eu`
多区域端点采用 Vertex 文档所述的 10% 溢价。

<!-- openclaw-plugin-reference:manual-end -->
