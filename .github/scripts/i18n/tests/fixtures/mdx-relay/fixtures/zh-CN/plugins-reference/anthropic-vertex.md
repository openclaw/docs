---
read_when:
    - 你正在安装、配置或审计 anthropic-vertex 插件
summary: OpenClaw Anthropic Vertex 提供商插件，用于 Google Vertex AI 上的 Claude 模型。
title: Anthropic Vertex 插件
x-i18n:
    generated_at: "2026-06-27T02:46:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f772c9a5bf1edd6a270b7ba5e6d695290fe96648c9ac38d0bc90bb1504f50cd7
    source_path: plugins/reference/anthropic-vertex.md
    workflow: 16
---

# Anthropic Vertex 插件

用于 Google Vertex AI 上 Claude 模型的 OpenClaw Anthropic Vertex 提供商插件。

## 分发

- 包：`@openclaw/anthropic-vertex-provider`
- 安装路径：npm；ClawHub

## 接口面

providers: anthropic-vertex

<!-- openclaw-plugin-reference:manual-start -->

## Claude Fable 5

在你的 Google Cloud 区域中该模型可用时，使用 `anthropic-vertex/claude-fable-5`。
Fable 5 始终使用自适应思考，并默认使用 `high` 强度。`/think off` 和
`/think minimal` 使用 `low` 强度，因为该模型不支持禁用思考。

<!-- openclaw-plugin-reference:manual-end -->
