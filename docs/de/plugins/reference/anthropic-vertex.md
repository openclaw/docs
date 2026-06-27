---
read_when:
    - Sie installieren, konfigurieren oder auditieren das Plugin anthropic-vertex
summary: OpenClaw Anthropic Vertex Provider-Plugin für Claude-Modelle auf Google Vertex AI.
title: Anthropic Vertex-Plugin
x-i18n:
    generated_at: "2026-06-27T17:51:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f772c9a5bf1edd6a270b7ba5e6d695290fe96648c9ac38d0bc90bb1504f50cd7
    source_path: plugins/reference/anthropic-vertex.md
    workflow: 16
---

# Anthropic Vertex-Plugin

OpenClaw Anthropic Vertex Provider-Plugin für Claude-Modelle auf Google Vertex AI.

## Distribution

- Paket: `@openclaw/anthropic-vertex-provider`
- Installationsweg: npm; ClawHub

## Oberfläche

Provider: anthropic-vertex

<!-- openclaw-plugin-reference:manual-start -->

## Claude Fable 5

Verwenden Sie `anthropic-vertex/claude-fable-5`, wenn das Modell in Ihrer Google-Cloud-Region verfügbar ist.
Fable 5 verwendet immer adaptives Denken und nutzt standardmäßig den Aufwand `high`. `/think off` und
`/think minimal` verwenden den Aufwand `low`, da das Modell das Deaktivieren des Denkens nicht unterstützt.

<!-- openclaw-plugin-reference:manual-end -->
