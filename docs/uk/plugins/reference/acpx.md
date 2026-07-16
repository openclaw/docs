---
read_when:
    - Ви встановлюєте, налаштовуєте або перевіряєте плагін acpx
summary: Серверна частина середовища виконання ACP для OpenClaw із керуванням сеансами й транспортом на боці плагіна.
title: Плагін ACPx
x-i18n:
    generated_at: "2026-07-16T18:22:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9816ca3ada81eb44883b641f3d761b76f894bd83c8aa978c516125c77842f664
    source_path: plugins/reference/acpx.md
    workflow: 16
---

# Плагін ACPx

Серверна частина середовища виконання ACP для OpenClaw із керуванням сеансами й транспортом на боці плагіна.

## Розповсюдження

- Пакунок: `@openclaw/acpx`
- Спосіб установлення: npm; ClawHub

## Інтерфейс

навички

<!-- openclaw-plugin-reference:manual-start -->

## Нативні сеанси Pi

Вбудоване середовище виконання автоматично виявляє сховище сеансів Pi у Gateway і спарених
вузлах. Збережені сеанси відображаються в групі **Pi** на бічній панелі сеансів,
а стенограми у задокументованому форматі сеансів JSONL від Pi доступні лише для читання. Каталог
враховує проєктні й глобальні каталоги сеансів `settings.json`, а також
`PI_CODING_AGENT_DIR` і `PI_CODING_AGENT_SESSION_DIR`. Відносні шляхи визначаються
від каталогу, що містить їхній файл `settings.json`.

Вимкніть **Каталог сеансів Pi** у розділі **Конфігурація > Плагіни > Середовище виконання ACPX**,
щоб вимкнути виявлення. Типово його ввімкнено.

<!-- openclaw-plugin-reference:manual-end -->

## Пов’язана документація

- [acpx](/uk/tools/acp-agents-setup)
