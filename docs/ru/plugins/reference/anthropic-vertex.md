---
read_when:
    - Вы устанавливаете, настраиваете или проверяете Plugin anthropic-vertex
summary: Плагин провайдера OpenClaw Anthropic Vertex для моделей Claude в Google Vertex AI.
title: Plugin Anthropic Vertex
x-i18n:
    generated_at: "2026-06-28T23:21:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f772c9a5bf1edd6a270b7ba5e6d695290fe96648c9ac38d0bc90bb1504f50cd7
    source_path: plugins/reference/anthropic-vertex.md
    workflow: 16
---

# Plugin Anthropic Vertex

Plugin провайдера OpenClaw Anthropic Vertex для моделей Claude в Google Vertex AI.

## Распространение

- Пакет: `@openclaw/anthropic-vertex-provider`
- Способ установки: npm; ClawHub

## Поверхность

провайдеры: anthropic-vertex

<!-- openclaw-plugin-reference:manual-start -->

## Claude Fable 5

Используйте `anthropic-vertex/claude-fable-5` там, где модель доступна в вашем регионе Google Cloud.
Fable 5 всегда использует адаптивное мышление и по умолчанию задает усилие `high`. `/think off` и
`/think minimal` используют усилие `low`, потому что модель не поддерживает отключение мышления.

<!-- openclaw-plugin-reference:manual-end -->
