---
read_when:
    - Ви хочете ввімкнути або налаштувати code_execution
    - Ви хочете віддалений аналіз без локального доступу до shell
    - Ви хочете поєднати x_search або web_search з віддаленим Python-аналізом
summary: code_execution -- запуск віддаленого sandboxed Python-аналізу з xAI
title: Виконання коду
x-i18n:
    generated_at: "2026-04-23T21:13:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: d34f3be6a781209c5b081a7471a60bd096c193b9bc54272350348e743a768150
    source_path: tools/code-execution.md
    workflow: 15
---

`code_execution` запускає sandboxed віддалений Python-аналіз через API Responses від xAI.
Це відрізняється від локального [`exec`](/uk/tools/exec):

- `exec` запускає shell-команди на вашій машині або Node
- `code_execution` запускає Python у віддаленому sandbox xAI

Використовуйте `code_execution` для:

- обчислень
- табулювання
- швидкої статистики
- аналізу у стилі графіків
- аналізу даних, повернутих `x_search` або `web_search`

**Не** використовуйте його, коли вам потрібні локальні файли, ваш shell, ваш repo або спарені
пристрої. Для цього використовуйте [`exec`](/uk/tools/exec).

## Налаштування

Вам потрібен API-ключ xAI. Підійде будь-який із цих варіантів:

- `XAI_API_KEY`
- `plugins.entries.xai.config.webSearch.apiKey`

Приклад:

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...",
          },
          codeExecution: {
            enabled: true,
            model: "grok-4-1-fast",
            maxTurns: 2,
            timeoutSeconds: 30,
          },
        },
      },
    },
  },
}
```

## Як це використовувати

Формулюйте запит природно й явно вказуйте намір аналізу:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

Внутрішньо tool приймає один параметр `task`, тому агент має надсилати
повний запит на аналіз і будь-які вбудовані дані одним prompt.

## Обмеження

- Це віддалене виконання xAI, а не локальне виконання процесів.
- Його слід розглядати як епізодичний аналіз, а не як постійний notebook.
- Не припускайте наявності доступу до локальних файлів або вашого workspace.
- Для свіжих даних X спочатку використовуйте [`x_search`](/uk/tools/web#x_search).

## Див. також

- [Web tools](/uk/tools/web)
- [Exec](/uk/tools/exec)
- [xAI](/uk/providers/xai)
