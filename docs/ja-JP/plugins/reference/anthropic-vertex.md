---
read_when:
    - anthropic-vertex pluginをインストール、設定、または監査している
summary: Google Vertex AI 上の Claude モデル用 OpenClaw Anthropic Vertex プロバイダー Plugin。
title: Anthropic Vertex Plugin
x-i18n:
    generated_at: "2026-06-27T12:21:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f772c9a5bf1edd6a270b7ba5e6d695290fe96648c9ac38d0bc90bb1504f50cd7
    source_path: plugins/reference/anthropic-vertex.md
    workflow: 16
---

# Anthropic Vertex Plugin

Google Vertex AI 上の Claude モデル向け OpenClaw Anthropic Vertex プロバイダー Plugin。

## 配布

- パッケージ: `@openclaw/anthropic-vertex-provider`
- インストール経路: npm; ClawHub

## サーフェス

providers: anthropic-vertex

<!-- openclaw-plugin-reference:manual-start -->

## Claude Fable 5

Google Cloud リージョンでモデルが利用可能な場合は、`anthropic-vertex/claude-fable-5` を使用します。
Fable 5 は常に適応的思考を使用し、デフォルトで `high` effort になります。`/think off` と
`/think minimal` は、このモデルが思考の無効化をサポートしていないため、`low` effort を使用します。

<!-- openclaw-plugin-reference:manual-end -->
