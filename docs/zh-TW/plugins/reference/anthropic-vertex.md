---
read_when:
    - 您正在安裝、設定或稽核 anthropic-vertex 外掛
summary: OpenClaw Anthropic Vertex 提供者外掛，適用於 Google Vertex AI 上的 Claude 模型。
title: Anthropic Vertex 外掛
x-i18n:
    generated_at: "2026-06-27T19:41:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f772c9a5bf1edd6a270b7ba5e6d695290fe96648c9ac38d0bc90bb1504f50cd7
    source_path: plugins/reference/anthropic-vertex.md
    workflow: 16
---

# Anthropic Vertex 外掛

OpenClaw Anthropic Vertex 提供者外掛，用於 Google Vertex AI 上的 Claude 模型。

## 發佈

- 套件：`@openclaw/anthropic-vertex-provider`
- 安裝途徑：npm；ClawHub

## 介面

providers: anthropic-vertex

<!-- openclaw-plugin-reference:manual-start -->

## Claude Fable 5

請在你的 Google Cloud 區域可用此模型時使用 `anthropic-vertex/claude-fable-5`。
Fable 5 一律使用自適應思考，且預設為 `high` effort。`/think off` 和
`/think minimal` 會使用 `low` effort，因為此模型不支援停用思考。

<!-- openclaw-plugin-reference:manual-end -->
