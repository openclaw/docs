---
read_when:
    - Вы устанавливаете, настраиваете или проводите аудит Plugin для передачи файлов
summary: Получайте, перечисляйте и записывайте файлы на сопряжённых узлах через выделенные команды узла. Обходит усечение stdout в bash, используя base64 поверх node.invoke для двоичных файлов размером до 16 MB.
title: Plugin передачи файлов
x-i18n:
    generated_at: "2026-06-28T23:24:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 63f931b4bac0d212ae503a3816a527b94b3ca113677a6f52416293a2e381b24b
    source_path: plugins/reference/file-transfer.md
    workflow: 16
---

# Plugin передачи файлов

Получайте, перечисляйте и записывайте файлы на сопряженных узлах с помощью выделенных команд узла. Обходит усечение stdout в bash, используя base64 поверх node.invoke для бинарных файлов размером до 16 МБ.

## Дистрибуция

- Пакет: `@openclaw/file-transfer`
- Способ установки: включен в OpenClaw

## Поверхность

контракты: tools
