---
read_when:
    - Ви встановлюєте, налаштовуєте або перевіряєте Plugin anthropic-vertex
summary: Plugin постачальника Anthropic Vertex для OpenClaw, призначений для моделей Claude у Google Vertex AI.
title: Plugin Anthropic Vertex
x-i18n:
    generated_at: "2026-07-12T13:35:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe5500ca56df49c0ef6ccbf39ced71e3fd0b18776ad23716de8575bc6ba64cb8
    source_path: plugins/reference/anthropic-vertex.md
    workflow: 16
---

# Plugin Anthropic Vertex

Plugin постачальника OpenClaw Anthropic Vertex для моделей Claude у Google Vertex AI.

## Розповсюдження

- Пакет: `@openclaw/anthropic-vertex-provider`
- Спосіб установлення: npm; ClawHub

## Інтерфейс

постачальники: anthropic-vertex

<!-- openclaw-plugin-reference:manual-start -->

## Claude Fable 5

Використовуйте `anthropic-vertex/claude-fable-5`, якщо модель доступна у вашому регіоні Google Cloud.
Fable 5 завжди використовує адаптивне мислення та за замовчуванням працює з рівнем зусиль `high`. `/think off` і
`/think minimal` використовують рівень `low`, оскільки модель не підтримує вимкнення мислення.

## Claude Sonnet 5

Використовуйте `anthropic-vertex/claude-sonnet-5` із кінцевою точкою Vertex `global`, `us` або `eu`.
Sonnet 5 за замовчуванням використовує адаптивне мислення з рівнем зусиль `high` і підтримує
`/think off` або вбудовані рівні `/think xhigh|max`. OpenClaw автоматично публікує
контекстне вікно моделі на 1 000 000 токенів і обмеження виведення на 128 000 токенів.

Ціни в каталозі відповідають початковому глобальному тарифу Vertex у розмірі `$2/$10` за
мільйон вхідних/вихідних токенів до 31 серпня 2026 року, а з
1 вересня — `$3/$15`. Мультирегіональні кінцеві точки `us` і `eu` використовують задокументовану Vertex
10-відсоткову надбавку.

<!-- openclaw-plugin-reference:manual-end -->
