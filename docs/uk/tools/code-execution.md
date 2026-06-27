---
read_when:
    - Ви хочете ввімкнути або налаштувати code_execution
    - Вам потрібен віддалений аналіз без доступу до локальної оболонки
    - Потрібно поєднати x_search або web_search з віддаленим аналізом Python
summary: 'code_execution: запуск ізольованого віддаленого аналізу Python з xAI'
title: Виконання коду
x-i18n:
    generated_at: "2026-06-27T18:23:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d510d0d2b41deab527d456e675a23ef80ac3b55b5f01906ba2c43d90e4452e36
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` запускає ізольований віддалений аналіз Python в API Responses від xAI. Його реєструє вбудований Plugin `xai` (у межах контракту `tools`), і він надсилає запити до тієї самої кінцевої точки `https://api.x.ai/v1/responses`, яку використовує `x_search`.

| Властивість        | Значення                                                                          |
| ------------------ | --------------------------------------------------------------------------------- |
| Назва інструмента  | `code_execution`                                                                  |
| Plugin провайдера  | `xai` (вбудований, `enabledByDefault: true`)                                      |
| Автентифікація     | профіль автентифікації xAI, `XAI_API_KEY` або `plugins.entries.xai.config.webSearch.apiKey` |
| Типова модель      | `grok-4-1-fast`                                                                   |
| Типовий тайм-аут   | 30 секунд                                                                         |
| Типовий `maxTurns` | не задано (xAI застосовує власний внутрішній ліміт)                               |

Це відрізняється від локального [`exec`](/uk/tools/exec):

- `exec` запускає команди оболонки на вашій машині або спареному вузлі.
- `code_execution` запускає Python у віддаленій ізольованій пісочниці xAI.

Використовуйте `code_execution` для:

- Обчислень.
- Табуляції.
- Швидкої статистики.
- Аналізу у стилі діаграм.
- Аналізу даних, повернутих `x_search` або `web_search`.

**Не** використовуйте його, коли вам потрібні локальні файли, ваша оболонка, ваш репозиторій або спарені пристрої. Для цього використовуйте [`exec`](/uk/tools/exec).

## Налаштування

<Steps>
  <Step title="Надайте облікові дані xAI">
    Увійдіть через Grok OAuth за допомогою відповідної підписки SuperGrok або X Premium
    або збережіть API-ключ. xAI OAuth використовує перевірку через код пристрою, тому працює
    з віддалених хостів без localhost callback. OAuth працює для
    `code_execution` і `x_search`; `XAI_API_KEY` або конфігурація вебпошуку Plugin
    також можуть забезпечувати роботу Grok `web_search`.

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Під час свіжого встановлення ті самі варіанти автентифікації доступні в
    onboarding:

    ```bash
    openclaw onboard --install-daemon
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

    Або використайте API-ключ:

    ```bash
    openclaw models auth login --provider xai --method api-key
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
    `code_execution` доступний, коли наявні облікові дані xAI. Установіть
    `plugins.entries.xai.config.codeExecution.enabled` на `false`, щоб вимкнути його,
    або використайте той самий блок, щоб налаштувати модель і тайм-аут.

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

    `code_execution` з’явиться у списку інструментів агента, щойно Plugin xAI повторно зареєструється з `enabled: true`.

  </Step>
</Steps>

## Як ним користуватися

Запитуйте природно й явно вказуйте намір аналізу:

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

Коли інструмент запускається без автентифікації, він повертає структуровану помилку `missing_xai_api_key`, яка вказує на профіль автентифікації, змінну середовища та параметри конфігурації. Помилка має формат JSON, а не є викинутим винятком, тому агент може самостійно виправитися:

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs xAI credentials. Run `openclaw onboard --auth-choice xai-oauth` to sign in with Grok, run `openclaw onboard --auth-choice xai-api-key`, set `XAI_API_KEY` in the Gateway environment, or configure `plugins.entries.xai.config.webSearch.apiKey`.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## Обмеження

- Це віддалене виконання xAI, а не виконання локального процесу.
- Сприймайте результати як ефемерний аналіз, а не як постійну сесію notebook.
- Не припускайте доступу до локальних файлів або вашого робочого простору.
- Для свіжих даних X спочатку використайте [`x_search`](/uk/tools/web#x_search) і передайте результат у `code_execution`.

## Пов’язане

<CardGroup cols={2}>
  <Card title="Інструмент Exec" href="/uk/tools/exec" icon="terminal">
    Локальне виконання команд оболонки на вашій машині або спареному вузлі.
  </Card>
  <Card title="Схвалення Exec" href="/uk/tools/exec-approvals" icon="shield">
    Політика дозволу/заборони для виконання команд оболонки.
  </Card>
  <Card title="Вебінструменти" href="/uk/tools/web" icon="globe">
    `web_search`, `x_search` і `web_fetch`.
  </Card>
  <Card title="Провайдер xAI" href="/uk/providers/xai" icon="microchip">
    Моделі Grok, вебпошук/пошук X і конфігурація виконання коду.
  </Card>
</CardGroup>
