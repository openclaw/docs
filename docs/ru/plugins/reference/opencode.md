---
read_when:
    - Вы устанавливаете, настраиваете или проверяете плагин opencode
summary: Добавляет в OpenClaw поддержку провайдера моделей OpenCode.
title: Плагин OpenCode
x-i18n:
    generated_at: "2026-07-16T17:16:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: aecf396cfc645e4a036b8130ed7f33db9081dffda120c6d06ebe863dd3be3730
    source_path: plugins/reference/opencode.md
    workflow: 16
---

# Плагин OpenCode

Добавляет в OpenClaw поддержку провайдера моделей OpenCode.

## Распространение

- Пакет: `@openclaw/opencode-provider`
- Способ установки: входит в состав OpenClaw

## Интерфейс

провайдеры: `opencode`; контракты: `mediaUnderstandingProviders`

<!-- openclaw-plugin-reference:manual-start -->

## Нативные сеансы

OpenClaw автоматически обнаруживает CLI `opencode` на Gateway и сопряжённых узлах. Сохранённые
сеансы затем отображаются в группе **OpenCode** на боковой панели сеансов; доступен просмотр
транскриптов только для чтения с помощью официальных команд `opencode --pure db ... --format json`
и `opencode --pure export`. Ограниченная среда и режим `--pure`
не позволяют при просмотре каталога загружать плагины проекта или наследовать посторонние
учётные данные Gateway.

Отключите **OpenCode Session Catalog** в разделе **Config > Plugins > OpenCode**,
чтобы запретить обнаружение. По умолчанию оно включено.

<!-- openclaw-plugin-reference:manual-end -->

## Связанная документация

- [OpenCode](/ru/providers/opencode)
