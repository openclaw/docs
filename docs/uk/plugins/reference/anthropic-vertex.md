---
read_when:
    - Ви встановлюєте, налаштовуєте або перевіряєте Plugin anthropic-vertex
summary: Plugin провайдера Anthropic Vertex для OpenClaw для моделей Claude у Google Vertex AI.
title: Plugin Anthropic Vertex
x-i18n:
    generated_at: "2026-06-27T17:56:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f772c9a5bf1edd6a270b7ba5e6d695290fe96648c9ac38d0bc90bb1504f50cd7
    source_path: plugins/reference/anthropic-vertex.md
    workflow: 16
---

# Plugin Anthropic Vertex

Plugin постачальника OpenClaw Anthropic Vertex для моделей Claude у Google Vertex AI.

## Розповсюдження

- Пакет: `@openclaw/anthropic-vertex-provider`
- Спосіб установлення: npm; ClawHub

## Поверхня

providers: anthropic-vertex

<!-- openclaw-plugin-reference:manual-start -->

## Claude Fable 5

Використовуйте `anthropic-vertex/claude-fable-5`, де модель доступна у вашому регіоні Google Cloud.
Fable 5 завжди використовує адаптивне мислення та за замовчуванням має рівень зусиль `high`. `/think off` і
`/think minimal` використовують рівень зусиль `low`, оскільки модель не підтримує вимкнення мислення.

<!-- openclaw-plugin-reference:manual-end -->
