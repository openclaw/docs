---
read_when:
    - Вы устанавливаете, настраиваете или проверяете плагин anthropic-vertex
summary: Плагин провайдера Anthropic Vertex для OpenClaw, предназначенный для моделей Claude в Google Vertex AI.
title: Плагин Anthropic Vertex
x-i18n:
    generated_at: "2026-07-16T16:41:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bd73b80b4e49a85cd6b1d8e47df6bf8d2d791c36a677124112f299027bfd9af5
    source_path: plugins/reference/anthropic-vertex.md
    workflow: 16
---

# Плагин Anthropic Vertex

Плагин провайдера OpenClaw Anthropic Vertex для моделей Claude в Google Vertex AI.

## Распространение

- Пакет: `@openclaw/anthropic-vertex-provider`
- Способ установки: npm; ClawHub

## Интерфейс

провайдеры: `anthropic-vertex`

<!-- openclaw-plugin-reference:manual-start -->

## Claude Fable 5

Используйте `anthropic-vertex/claude-fable-5`, если модель доступна в вашем регионе Google Cloud.
Fable 5 всегда использует адаптивное мышление и по умолчанию устанавливает усилие `high`. `/think off` и
`/think minimal` используют усилие `low`, поскольку модель не поддерживает отключение мышления.

## Claude Sonnet 5

Используйте `anthropic-vertex/claude-sonnet-5` с конечной точкой Vertex `global`, `us` или `eu`.
Sonnet 5 по умолчанию использует адаптивное мышление с усилием `high` и поддерживает
`/think off` или нативные уровни `/think xhigh|max`. OpenClaw автоматически публикует сведения об
окне контекста размером 1 000 000 токенов и ограничении вывода в 128 000 токенов.

Цены в каталоге соответствуют начальной глобальной ставке Vertex в размере `$2/$10` за
миллион входных/выходных токенов до 31 августа 2026 года включительно, а с
1 сентября — `$3/$15`. Для мультирегиональных конечных точек `us` и `eu` применяется документированная
наценка Vertex в размере 10%.

<!-- openclaw-plugin-reference:manual-end -->
