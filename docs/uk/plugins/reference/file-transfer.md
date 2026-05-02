---
read_when:
    - Ви встановлюєте, налаштовуєте або проводите аудит Plugin для передавання файлів
summary: Отримуйте, перелічуйте та записуйте файли на спарених вузлах через спеціальні команди node. Обходить обрізання bash stdout завдяки використанню base64 через node.invoke для двійкових файлів розміром до 16 MB.
title: Plugin передавання файлів
x-i18n:
    generated_at: "2026-05-02T15:18:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63f931b4bac0d212ae503a3816a527b94b3ca113677a6f52416293a2e381b24b
    source_path: plugins/reference/file-transfer.md
    workflow: 16
---

# Plugin File Transfer

Отримуйте, перелічуйте та записуйте файли на спарених вузлах через спеціальні команди вузлів. Оминає обрізання stdout у bash, використовуючи base64 через node.invoke для двійкових файлів розміром до 16 МБ.

## Розповсюдження

- Пакет: `@openclaw/file-transfer`
- Маршрут установлення: входить до OpenClaw

## Поверхня

контракти: інструменти
