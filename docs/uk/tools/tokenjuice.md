---
read_when:
    - Ви хочете коротші результати інструментів `exec` або `bash` в OpenClaw
    - Ви хочете ввімкнути комплектний plugin tokenjuice
    - Вам потрібно зрозуміти, що tokenjuice змінює, а що залишає без обробки
summary: Стискайте зашумлені результати інструментів exec і bash за допомогою необов’язкового комплектного plugin
title: Tokenjuice
x-i18n:
    generated_at: "2026-04-22T07:16:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9b9a1054c9b1cc62e43ac6d5904c7790f9b27d8e0d0700c9da6e287c00e91783
    source_path: tools/tokenjuice.md
    workflow: 15
---

# Tokenjuice

`tokenjuice` — це необов’язковий комплектний plugin, який стискає зашумлені результати інструментів `exec` і `bash` після того, як команда вже виконалася.

Він змінює повернений `tool_result`, а не саму команду. Tokenjuice не переписує введення shell, не перезапускає команди й не змінює коди виходу.

Наразі це застосовується до вбудованих запусків Pi, де tokenjuice підключається до шляху вбудованого `tool_result` і скорочує вивід, який повертається в сесію.

## Увімкнути plugin

Швидкий спосіб:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

Еквівалент:

```bash
openclaw plugins enable tokenjuice
```

OpenClaw уже постачається з цим plugin. Окремий крок `plugins install` або `tokenjuice install openclaw` не потрібен.

Якщо ви надаєте перевагу прямому редагуванню конфігурації:

```json5
{
  plugins: {
    entries: {
      tokenjuice: {
        enabled: true,
      },
    },
  },
}
```

## Що змінює tokenjuice

- Стискає зашумлені результати `exec` і `bash` перед тим, як вони повертаються в сесію.
- Залишає фактичне виконання команди без змін.
- Зберігає точні читання вмісту файлів та інші команди, які tokenjuice має залишати без обробки.
- Працює лише за явного ввімкнення: вимкніть plugin, якщо хочете всюди бачити дослівний вивід.

## Перевірити, що це працює

1. Увімкніть plugin.
2. Запустіть сесію, яка може викликати `exec`.
3. Виконайте зашумлену команду, наприклад `git status`.
4. Переконайтеся, що повернений результат інструмента коротший і структурованіший, ніж сирий вивід shell.

## Вимкнути plugin

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

Або:

```bash
openclaw plugins disable tokenjuice
```
