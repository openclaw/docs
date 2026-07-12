---
read_when:
    - Вы устанавливаете, настраиваете или проверяете Plugin anthropic-vertex
summary: Plugin провайдера Anthropic Vertex для OpenClaw, предназначенный для моделей Claude в Google Vertex AI.
title: Plugin Anthropic Vertex
x-i18n:
    generated_at: "2026-07-12T11:41:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe5500ca56df49c0ef6ccbf39ced71e3fd0b18776ad23716de8575bc6ba64cb8
    source_path: plugins/reference/anthropic-vertex.md
    workflow: 16
---

# Плагин Anthropic Vertex

Плагин провайдера OpenClaw Anthropic Vertex для моделей Claude в Google Vertex AI.

## Распространение

- Пакет: `@openclaw/anthropic-vertex-provider`
- Способ установки: npm; ClawHub

## Интерфейс

провайдеры: anthropic-vertex

<!-- openclaw-plugin-reference:manual-start -->

## Claude Fable 5

Используйте `anthropic-vertex/claude-fable-5`, если модель доступна в вашем регионе Google Cloud.
Fable 5 всегда использует адаптивное мышление и по умолчанию устанавливает уровень усилий `high`. `/think off` и
`/think minimal` используют уровень `low`, поскольку модель не поддерживает отключение мышления.

## Claude Sonnet 5

Используйте `anthropic-vertex/claude-sonnet-5` с конечной точкой Vertex `global`, `us` или `eu`.
Sonnet 5 по умолчанию использует адаптивное мышление с уровнем усилий `high` и поддерживает
`/think off` или нативные уровни `/think xhigh|max`. OpenClaw автоматически публикует
контекстное окно модели размером 1 000 000 токенов и ограничение вывода в 128 000 токенов.

Цены в каталоге соответствуют вводному глобальному тарифу Vertex: `$2/$10` за
миллион входных/выходных токенов до 31 августа 2026 года, а с
1 сентября — `$3/$15`. Мультирегиональные конечные точки `us` и `eu` используют документированную
10%-ную надбавку Vertex.

<!-- openclaw-plugin-reference:manual-end -->
