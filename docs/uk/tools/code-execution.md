---
read_when:
    - Ви хочете увімкнути або налаштувати code_execution
    - Вам потрібен віддалений аналіз без локального доступу до командної оболонки
    - Ви хочете поєднати x_search або web_search з віддаленим аналізом у Python
summary: 'code_execution: запускайте ізольований віддалений аналіз Python за допомогою xAI'
title: Виконання коду
x-i18n:
    generated_at: "2026-05-05T23:54:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: a37e921c0016a32b01558c255bc05fcf24146f363a022da87feb94f3d6d48527
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` запускає ізольований віддалений аналіз Python в xAI Responses API. Його реєструє вбудований `xai` Plugin (у межах контракту `tools`) і спрямовує запити до того самого endpoint `https://api.x.ai/v1/responses`, який використовує `x_search`.

| Властивість        | Значення                                                       |
| ------------------ | -------------------------------------------------------------- |
| Назва інструмента  | `code_execution`                                               |
| Plugin постачальника | `xai` (вбудований, `enabledByDefault: true`)                 |
| Автентифікація     | `XAI_API_KEY` або `plugins.entries.xai.config.webSearch.apiKey` |
| Модель за замовчуванням | `grok-4-1-fast`                                          |
| Тайм-аут за замовчуванням | 30 секунд                                             |
| `maxTurns` за замовчуванням | не встановлено (xAI застосовує власний внутрішній ліміт) |

Це відрізняється від локального [`exec`](/uk/tools/exec):

- `exec` запускає команди shell на вашому комп’ютері або спареному вузлі.
- `code_execution` запускає Python у віддаленій ізольованій пісочниці xAI.

Використовуйте `code_execution` для:

- Обчислень.
- Табулювання.
- Швидкої статистики.
- Аналізу у стилі діаграм.
- Аналізу даних, повернутих `x_search` або `web_search`.

**Не** використовуйте його, коли потрібні локальні файли, ваш shell, ваш репозиторій або спарені пристрої. Для цього використовуйте [`exec`](/uk/tools/exec).

## Налаштування

<Steps>
  <Step title="Надайте ключ API xAI">
    Установіть `XAI_API_KEY` у середовищі Gateway або налаштуйте ключ у xAI Plugin, щоб ті самі облікові дані покривали `code_execution`, `x_search`, web search та інші інструменти xAI:

    ```bash
    export XAI_API_KEY=xai-...
    ```

    Або через конфігурацію:

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              webSearch: {
                apiKey: "xai-...",
              },
            },
          },
        },
      },
    }
    ```

  </Step>

  <Step title="Увімкніть і налаштуйте code_execution">
    Інструмент обмежується параметром `plugins.entries.xai.config.codeExecution.enabled`. За замовчуванням вимкнено.

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast", // override the default xAI code-execution model
                maxTurns: 2,            // optional cap on internal tool turns
                timeoutSeconds: 30,     // request timeout (default: 30)
              },
            },
          },
        },
      },
    }
    ```

  </Step>

  <Step title="Перезапустіть Gateway">
    ```bash
    openclaw gateway restart
    ```

    `code_execution` з’явиться у списку інструментів агента після повторної реєстрації xAI Plugin з `enabled: true`.

  </Step>
</Steps>

## Як ним користуватися

Запитуйте природною мовою й явно вказуйте намір аналізу:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

Інструмент внутрішньо приймає один параметр `task`, тому агент має надіслати повний запит на аналіз і будь-які вбудовані дані в одному prompt.

## Помилки

Коли інструмент запускається без автентифікації, він повертає структуровану помилку `missing_xai_api_key`, яка вказує на змінну середовища та шлях конфігурації. Помилка є JSON, а не викинутим винятком, тому агент може самостійно виправитися:

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs an xAI API key. Set XAI_API_KEY in the Gateway environment, or configure plugins.entries.xai.config.webSearch.apiKey.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## Обмеження

- Це віддалене виконання xAI, а не виконання локального процесу.
- Розглядайте результати як тимчасовий аналіз, а не постійну сесію notebook.
- Не припускайте доступу до локальних файлів або вашого робочого простору.
- Для свіжих даних X спершу використайте [`x_search`](/uk/tools/web#x_search) і передайте результат у `code_execution`.

## Пов’язане

<CardGroup cols={2}>
  <Card title="Інструмент Exec" href="/uk/tools/exec" icon="terminal">
    Локальне виконання shell на вашому комп’ютері або спареному вузлі.
  </Card>
  <Card title="Схвалення Exec" href="/uk/tools/exec-approvals" icon="shield">
    Політика дозволу/заборони для виконання shell.
  </Card>
  <Card title="Вебінструменти" href="/uk/tools/web" icon="globe">
    `web_search`, `x_search` і `web_fetch`.
  </Card>
  <Card title="Постачальник xAI" href="/uk/providers/xai" icon="microchip">
    Моделі Grok, web/x search і конфігурація виконання коду.
  </Card>
</CardGroup>
