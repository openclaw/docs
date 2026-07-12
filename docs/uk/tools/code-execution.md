---
read_when:
    - Ви хочете ввімкнути або налаштувати code_execution
    - Вам потрібен віддалений аналіз без доступу до локальної оболонки
    - Ви хочете поєднати x_search або web_search із віддаленим аналізом у Python
summary: 'code_execution: запуск ізольованого віддаленого аналізу Python за допомогою xAI'
title: Виконання коду
x-i18n:
    generated_at: "2026-07-12T13:52:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ab391daed9154f113535e6d241c45d5c08c22abdc012148a9f0f2ae5ec548b3
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` запускає ізольований віддалений аналіз Python через Responses API від xAI
(`https://api.x.ai/v1/responses`, та сама кінцева точка, яку використовує `x_search`). Його
реєструє вбудований Plugin `xai` за контрактом `tools`.

<Warning>
  `code_execution` виконується на серверах xAI. xAI стягує $5 за 1 000 викликів інструмента,
  а також плату за вхідні й вихідні токени моделі.
</Warning>

| Властивість          | Значення                                                                          |
| -------------------- | --------------------------------------------------------------------------------- |
| Назва інструмента    | `code_execution`                                                                  |
| Plugin провайдера    | `xai` (вбудований, `enabledByDefault: true`)                                      |
| Автентифікація       | профіль автентифікації xAI, `XAI_API_KEY` або `plugins.entries.xai.config.webSearch.apiKey` |
| Модель за замовчуванням | `grok-4.3`                                                                     |
| Тайм-аут за замовчуванням | 30 секунд                                                                     |
| `maxTurns` за замовчуванням | не задано (xAI застосовує власне внутрішнє обмеження)                       |

Використовуйте його для обчислень, табулювання, швидкої статистики й аналізу
у вигляді діаграм, зокрема даних, повернутих `x_search` або `web_search`. Він не
має доступу до локальних файлів, вашої оболонки, репозиторію чи спарених пристроїв
і не зберігає стан між викликами, тому вважайте кожен виклик тимчасовим аналізом,
а не сеансом блокнота. Щоб отримати свіжі дані X, спочатку запустіть
[`x_search`](/uk/tools/web#x_search) і передайте його результат далі.

Для локального виконання натомість використовуйте [`exec`](/uk/tools/exec).

## Налаштування

<Steps>
  <Step title="Надайте облікові дані xAI">
    Для OAuth потрібна відповідна передплата SuperGrok або X Premium
    (перевірка за кодом пристрою, тому це працює з віддалених хостів без
    зворотного виклику localhost):

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Під час нової інсталяції той самий варіант доступний у початковому налаштуванні:

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

    Або ключ API:

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

    Кожен із цих трьох варіантів також забезпечує роботу `x_search` і Grok `web_search`.

  </Step>

  <Step title="Увімкніть і налаштуйте code_execution">
    Якщо `enabled` не вказано, `code_execution` доступний лише тоді, коли провайдером
    активної моделі є `xai` і облікові дані xAI успішно визначено. Для активної моделі
    з відомим провайдером, відмінним від xAI, установіть
    `plugins.entries.xai.config.codeExecution.enabled` у `true`, щоб явно дозволити
    використання між провайдерами. Якщо провайдер активної моделі не вказано або не
    вдалося визначити, інструмент залишається прихованим. Установіть `enabled` у `false`,
    щоб вимкнути його для всіх провайдерів. Облікові дані xAI потрібні завжди.

    Використовуйте той самий блок, щоб перевизначити модель, обмеження кількості
    ітерацій або тайм-аут:

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true, // required for a known non-xAI model provider
                model: "grok-4.3", // override the default xAI code-execution model
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

    `code_execution` з'явиться у списку інструментів агента, щойно Plugin xAI
    повторно зареєструється та пройдуть наведені вище перевірки провайдера,
    увімкнення й автентифікації.

  </Step>
</Steps>

## Використання

Чітко вкажіть мету аналізу; інструмент приймає єдиний параметр `task`,
тому надсилайте повний запит і всі вбудовані дані в одному запиті:

```text
Використай code_execution, щоб обчислити 7-денне ковзне середнє для цих чисел: ...
```

```text
Використай x_search, щоб знайти дописи зі згадкою OpenClaw за цей тиждень, а потім використай code_execution, щоб підрахувати їх за днями.
```

```text
Використай web_search, щоб зібрати найновіші результати тестів продуктивності ШІ, а потім використай code_execution, щоб порівняти відсоткові зміни.
```

## Помилки

Без автентифікації інструмент повертає структуровану помилку JSON (а не
викинутий виняток), тож агент може самостійно виправити проблему:

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs xAI credentials. Run `openclaw onboard --auth-choice xai-oauth` to sign in with Grok, run `openclaw onboard --auth-choice xai-api-key`, set `XAI_API_KEY` in the Gateway environment, or configure `plugins.entries.xai.config.webSearch.apiKey`.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Інструмент Exec" href="/uk/tools/exec" icon="terminal">
    Локальне виконання команд оболонки на вашому комп’ютері або спареному вузлі.
  </Card>
  <Card title="Схвалення Exec" href="/uk/tools/exec-approvals" icon="shield">
    Політика дозволу та заборони виконання команд оболонки.
  </Card>
  <Card title="Вебінструменти" href="/uk/tools/web" icon="globe">
    `web_search`, `x_search` і `web_fetch`.
  </Card>
  <Card title="Провайдер xAI" href="/uk/providers/xai" icon="microchip">
    Моделі Grok, вебпошук і пошук у X, а також конфігурація виконання коду.
  </Card>
</CardGroup>
