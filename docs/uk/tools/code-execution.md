---
read_when:
    - Ви хочете ввімкнути або налаштувати code_execution
    - Вам потрібен віддалений аналіз без доступу до локальної оболонки
    - Ви хочете поєднати x_search або web_search із віддаленим Python-аналізом
summary: code_execution -- запуск ізольованого віддаленого Python-аналізу з xAI
title: Виконання коду
x-i18n:
    generated_at: "2026-04-27T07:10:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe635ec65aaf593a5bd63c139fbfc69e1ba3ea7c58c2bba639ec1ebd70dba1a9
    source_path: tools/code-execution.md
    workflow: 15
---

`code_execution` запускає ізольований віддалений Python-аналіз через Responses API від xAI.
Це відрізняється від локального [`exec`](/uk/tools/exec):

- `exec` запускає shell-команди на вашій машині або Node
- `code_execution` запускає Python у віддаленій sandbox від xAI

Використовуйте `code_execution` для:

- обчислень
- табулювання
- швидкої статистики
- аналізу у форматі діаграм
- аналізу даних, повернутих `x_search` або `web_search`

**Не** використовуйте його, коли вам потрібні локальні файли, ваша оболонка, ваш репозиторій або під’єднані пристрої. Для цього використовуйте [`exec`](/uk/tools/exec).

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

## Як ним користуватися

Формулюйте запит природно й чітко вказуйте намір аналізу:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

Інструмент внутрішньо приймає один параметр `task`, тому агент має надсилати
повний запит на аналіз і всі вбудовані дані в одному prompt.

## Обмеження

- Це віддалене виконання xAI, а не локальне виконання процесів.
- Його слід розглядати як епізодичний аналіз, а не як постійний notebook.
- Не припускайте наявність доступу до локальних файлів або вашого робочого простору.
- Для свіжих даних з X спочатку використовуйте [`x_search`](/uk/tools/web#x_search).

## Пов’язане

- [Інструмент Exec](/uk/tools/exec)
- [Погодження Exec](/uk/tools/exec-approvals)
- [Інструмент apply_patch](/uk/tools/apply-patch)
- [Веб-інструменти](/uk/tools/web)
- [xAI](/uk/providers/xai)
