---
read_when:
    - Ви хочете коротші результати tools `exec` або `bash` в OpenClaw
    - Ви хочете ввімкнути вбудований Plugin tokenjuice
    - Вам потрібно зрозуміти, що саме змінює tokenjuice і що він залишає сирим
summary: Стискання шумних результатів tools exec і bash за допомогою необов’язкового вбудованого Plugin
title: Tokenjuice
x-i18n:
    generated_at: "2026-04-23T21:17:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: be9f7e13ab609717da4d2603e8a5102444460bf9beb13d1b25252d7cb5cfec09
    source_path: tools/tokenjuice.md
    workflow: 15
---

`tokenjuice` — це необов’язковий вбудований Plugin, який стискає шумні результати tools `exec` і `bash`
після того, як команда вже була виконана.

Він змінює повернений `tool_result`, а не саму команду. Tokenjuice не
переписує shell input, не перезапускає команди й не змінює exit codes.

Наразі це застосовується до вбудованих запусків Pi, де tokenjuice підключається
до шляху вбудованого `tool_result` і обрізає вивід, який повертається в сесію.

## Увімкнення Plugin

Швидкий спосіб:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

Еквівалент:

```bash
openclaw plugins enable tokenjuice
```

OpenClaw уже постачає цей Plugin. Окремий крок `plugins install`
або `tokenjuice install openclaw` не потрібен.

Якщо ви надаєте перевагу прямому редагуванню config:

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

- Стискає шумні результати `exec` і `bash` до того, як вони будуть повернуті в сесію.
- Не змінює початкове виконання команди.
- Зберігає точні читання вмісту файлів та інші команди, які tokenjuice має залишати сирими.
- Залишається opt-in: вимкніть Plugin, якщо хочете дослівний вивід усюди.

## Як перевірити, що він працює

1. Увімкніть Plugin.
2. Запустіть сесію, яка може викликати `exec`.
3. Виконайте шумну команду, наприклад `git status`.
4. Переконайтеся, що повернений результат tool коротший і структурованіший, ніж сирий shell output.

## Вимкнення Plugin

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

Або:

```bash
openclaw plugins disable tokenjuice
```
