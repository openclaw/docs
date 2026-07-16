---
read_when:
    - Вы устанавливаете, настраиваете или проверяете плагин anthropic
summary: Модели Anthropic, CLI Claude и нативный каталог сессий Claude.
title: Плагин Anthropic
x-i18n:
    generated_at: "2026-07-16T16:32:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 11d3c7879a9dc6de35e67f9812b878918d908d41555c181920deb4f1f9cba22e
    source_path: plugins/reference/anthropic.md
    workflow: 16
---

# Плагин Anthropic

Модели Anthropic, Claude CLI и встроенный каталог сеансов Claude.

## Распространение

- Пакет: `@openclaw/anthropic-provider`
- Способ установки: входит в состав OpenClaw

## Поверхность

провайдеры: `anthropic`; контракты: `mediaUnderstandingProviders`, `usageProviders`

<!-- openclaw-plugin-reference:manual-start -->

команды Node: anthropic.claude.sessions.list.v1,
anthropic.claude.sessions.read.v1; контракты: mediaUnderstandingProviders,
usageProviders

<!-- openclaw-plugin-reference:manual-end -->

## Связанная документация

- [anthropic](/ru/providers/anthropic)
