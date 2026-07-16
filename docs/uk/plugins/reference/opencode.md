---
read_when:
    - Ви встановлюєте, налаштовуєте або перевіряєте плагін opencode
summary: Додає підтримку постачальника моделей OpenCode до OpenClaw.
title: Plugin OpenCode
x-i18n:
    generated_at: "2026-07-16T18:21:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: aecf396cfc645e4a036b8130ed7f33db9081dffda120c6d06ebe863dd3be3730
    source_path: plugins/reference/opencode.md
    workflow: 16
---

# Plugin OpenCode

Додає підтримку провайдера моделей OpenCode до OpenClaw.

## Розповсюдження

- Пакет: `@openclaw/opencode-provider`
- Спосіб установлення: входить до складу OpenClaw

## Поверхня

провайдери: `opencode`; контракти: `mediaUnderstandingProviders`

<!-- openclaw-plugin-reference:manual-start -->

## Нативні сеанси

OpenClaw автоматично виявляє CLI `opencode` на Gateway і спарених вузлах. Після цього збережені
сеанси з’являються в групі **OpenCode** на бічній панелі сеансів із можливістю лише для читання
переглядати стенограми за допомогою офіційних команд `opencode --pure db ... --format json`
і `opencode --pure export`. Обмежене середовище та режим `--pure`
не дають перегляду каталогу завантажувати плагіни проєкту або успадковувати не пов’язані з ним
облікові дані Gateway.

Вимкніть **OpenCode Session Catalog** у розділі **Config > Plugins > OpenCode**, щоб
вимкнути виявлення. За замовчуванням його ввімкнено.

<!-- openclaw-plugin-reference:manual-end -->

## Пов’язана документація

- [opencode](/uk/providers/opencode)
