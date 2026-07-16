---
read_when:
    - Вы устанавливаете, настраиваете или проверяете плагин acpx.
summary: Среда выполнения ACP для OpenClaw с управлением сеансами и транспортом на стороне плагина.
title: Плагин ACPx
x-i18n:
    generated_at: "2026-07-16T16:32:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9816ca3ada81eb44883b641f3d761b76f894bd83c8aa978c516125c77842f664
    source_path: plugins/reference/acpx.md
    workflow: 16
---

# Плагин ACPx

Серверная часть среды выполнения ACP для OpenClaw с управлением сеансами и транспортом на стороне плагина.

## Распространение

- Пакет: `@openclaw/acpx`
- Способ установки: npm; ClawHub

## Интерфейс

навыки

<!-- openclaw-plugin-reference:manual-start -->

## Нативные сеансы Pi

Встроенная среда выполнения автоматически обнаруживает хранилище сеансов Pi на Gateway и сопряжённых
узлах. Сохранённые сеансы отображаются в группе **Pi** на боковой панели сеансов,
а их расшифровки доступны только для чтения в документированном формате сеансов JSONL от Pi.
Каталог учитывает проектные и глобальные каталоги сеансов `settings.json`, а также
`PI_CODING_AGENT_DIR` и `PI_CODING_AGENT_SESSION_DIR`. Относительные пути разрешаются
от каталога, содержащего их файл `settings.json`.

Отключите **Pi Session Catalog** в разделе **Config > Plugins > ACPX Runtime**,
чтобы деактивировать обнаружение. По умолчанию оно включено.

<!-- openclaw-plugin-reference:manual-end -->

## Связанная документация

- [acpx](/ru/tools/acp-agents-setup)
