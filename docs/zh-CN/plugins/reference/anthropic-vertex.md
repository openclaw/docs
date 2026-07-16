---
read_when:
    - 你正在安装、配置或审计 anthropic-vertex 插件
summary: 用于在 Google Vertex AI 上运行 Claude 模型的 OpenClaw Anthropic Vertex 提供商插件。
title: Anthropic Vertex 插件
x-i18n:
    generated_at: "2026-07-16T11:47:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bd73b80b4e49a85cd6b1d8e47df6bf8d2d791c36a677124112f299027bfd9af5
    source_path: plugins/reference/anthropic-vertex.md
    workflow: 16
---

# Anthropic Vertex 插件

用于 Google Vertex AI 上 Claude 模型的 OpenClaw Anthropic Vertex 提供商插件。

## 分发

- 软件包：`@openclaw/anthropic-vertex-provider`
- 安装方式：npm；ClawHub

## 接口

提供商：`anthropic-vertex`

<!-- openclaw-plugin-reference:manual-start -->

## Claude Fable 5

在你的 Google Cloud 区域提供该模型时，使用 `anthropic-vertex/claude-fable-5`。
Fable 5 始终使用自适应思考，默认采用 `high` 强度。`/think off` 和
`/think minimal` 使用 `low` 强度，因为该模型不支持禁用思考。

## Claude Sonnet 5

通过 Vertex 的 `global`、`us` 或 `eu`
端点使用 `anthropic-vertex/claude-sonnet-5`。Sonnet 5 默认以 `high` 强度进行自适应思考，并支持
`/think off` 或原生 `/think xhigh|max` 级别。OpenClaw 会自动公布其
1,000,000 token 的上下文窗口和 128,000 token 的输出限制。

目录定价遵循 Vertex 的全球推广费率：截至 2026 年 8 月 31 日，每百万
输入/输出 token 为 `$2/$10`；从 9 月 1 日起为 `$3/$15`。
`us` 和 `eu` 多区域端点采用 Vertex 文档中规定的
10% 溢价。

<!-- openclaw-plugin-reference:manual-end -->
