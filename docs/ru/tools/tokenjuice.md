---
read_when:
    - Вам нужны более короткие результаты инструментов `exec` или `bash` в OpenClaw
    - Вы хотите установить или включить Plugin Tokenjuice
    - Вам нужно понимать, что tokenjuice изменяет, а что оставляет в исходном виде.
summary: Компактно сворачивайте шумные результаты инструментов exec и bash с помощью необязательного Plugin Tokenjuice
title: Tokenjuice
x-i18n:
    generated_at: "2026-06-28T23:55:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 183ab08d2a1150b446245514423b893cff9a85581980c15600cc16aec10eeae7
    source_path: tools/tokenjuice.md
    workflow: 16
---

`tokenjuice` — это необязательный внешний Plugin, который сжимает зашумленные результаты инструментов `exec` и `bash`
после того, как команда уже выполнена.

Он изменяет возвращаемый `tool_result`, а не саму команду. Tokenjuice не
переписывает ввод оболочки, не запускает команды повторно и не изменяет коды выхода.

Сегодня это применяется к встроенным запускам OpenClaw и динамическим инструментам OpenClaw в Codex
app-server harness. Tokenjuice подключается к middleware результатов инструментов OpenClaw и
обрезает вывод перед тем, как он возвращается в активную сессию harness.

## Включить Plugin

Установите один раз:

```bash
openclaw plugins install clawhub:@openclaw/tokenjuice
```

Затем включите его:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

Эквивалент:

```bash
openclaw plugins enable tokenjuice
```

Если вы предпочитаете редактировать конфигурацию напрямую:

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

## Что изменяет tokenjuice

- Сжимает зашумленные результаты `exec` и `bash` перед их передачей обратно в сессию.
- Оставляет исходное выполнение команды без изменений.
- Сохраняет точные чтения содержимого файлов и другие команды, которые tokenjuice должен оставлять в исходном виде.
- Остается явным выбором: отключите Plugin, если хотите получать дословный вывод везде.

## Проверить, что он работает

1. Включите Plugin.
2. Запустите сессию, которая может вызывать `exec`.
3. Выполните зашумленную команду, например `git status`.
4. Проверьте, что возвращенный результат инструмента короче и структурированнее, чем необработанный вывод оболочки.

## Отключить Plugin

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

Или:

```bash
openclaw plugins disable tokenjuice
```

## Связанное

- [Инструмент Exec](/ru/tools/exec)
- [Уровни размышления](/ru/tools/thinking)
- [Движок контекста](/ru/concepts/context-engine)
