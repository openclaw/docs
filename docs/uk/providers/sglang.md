---
read_when:
    - Ви хочете запустити OpenClaw із локальним сервером SGLang
    - Вам потрібні сумісні з OpenAI кінцеві точки /v1 із власними моделями
summary: Запуск OpenClaw із SGLang (самостійно розміщений сервер, сумісний з OpenAI)
title: SGLang
x-i18n:
    generated_at: "2026-07-12T13:38:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54a7805315a7d65fdd2c7c9b6836aa2faccc88db7802cce0ba8c2d4a1aac9d65
    source_path: providers/sglang.md
    workflow: 16
---

SGLang обслуговує моделі з відкритими вагами через HTTP API, сумісний з OpenAI. OpenClaw підключається до SGLang за допомогою сімейства провайдерів `openai-completions` з автоматичним виявленням доступних моделей.

| Властивість                         | Значення                                                          |
| ----------------------------------- | ----------------------------------------------------------------- |
| Ідентифікатор провайдера            | `sglang`                                                          |
| Plugin                              | вбудований, `enabledByDefault: true`                               |
| Змінна середовища автентифікації    | `SGLANG_API_KEY` (будь-яке непорожнє значення, якщо сервер не вимагає автентифікації) |
| Прапорець початкового налаштування  | `--auth-choice sglang`                                             |
| API                                 | сумісний з OpenAI (`openai-completions`)                           |
| Базова URL-адреса за замовчуванням  | `http://127.0.0.1:30000/v1`                                       |
| Заповнювач моделі за замовчуванням  | `sglang/Qwen/Qwen3-8B`                                            |
| Використання потокового передавання | Так (`supportsStreamingUsage: true`)                               |
| Ціноутворення                       | позначено як безплатне зовнішнє (`modelPricing.external: false`)   |

OpenClaw також **автоматично виявляє** доступні моделі в SGLang, коли ви погоджуєтеся на це за допомогою `SGLANG_API_KEY`. Використовуйте `sglang/*` у `agents.defaults.models`, щоб зберегти динамічне виявлення, якщо ви також налаштовуєте власну базову URL-адресу SGLang. Див. розділ [Виявлення моделей (неявний провайдер)](#model-discovery-implicit-provider) нижче.

## Початок роботи

<Steps>
  <Step title="Запустіть SGLang">
    Запустіть SGLang із сервером, сумісним з OpenAI. Ваша базова URL-адреса має надавати
    кінцеві точки `/v1` (наприклад, `/v1/models`, `/v1/chat/completions`). Зазвичай
    SGLang працює за адресою:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="Задайте ключ API">
    Якщо на вашому сервері не налаштовано автентифікацію, підійде будь-яке значення:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="Запустіть початкове налаштування або задайте модель безпосередньо">
    ```bash
    openclaw onboard
    ```

    Або налаштуйте модель вручну:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "sglang/your-model-id" },
        },
      },
    }
    ```

  </Step>
</Steps>

## Виявлення моделей (неявний провайдер)

Коли задано `SGLANG_API_KEY` (або існує профіль автентифікації) і ви **не**
визначили `models.providers.sglang`, OpenClaw надсилає запит до:

- `GET http://127.0.0.1:30000/v1/models`

і перетворює повернені ідентифікатори на записи моделей.

<Note>
Якщо ви явно задасте `models.providers.sglang`, OpenClaw за замовчуванням використовуватиме
оголошені вами моделі. Додайте `"sglang/*": {}` до `agents.defaults.models`, якщо
потрібно, щоб OpenClaw надсилав запити до кінцевої точки `/models` цього налаштованого провайдера та включав
усі заявлені моделі SGLang.
</Note>

## Явна конфігурація (моделі, задані вручну)

Використовуйте явну конфігурацію, коли:

- SGLang працює на іншому хості або порту.
- Потрібно зафіксувати значення `contextWindow`/`maxTokens`.
- Ваш сервер вимагає справжній ключ API (або ви хочете керувати заголовками).

```json5
{
  models: {
    providers: {
      sglang: {
        baseUrl: "http://127.0.0.1:30000/v1",
        apiKey: "${SGLANG_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Local SGLang Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Поведінка в режимі проксі">
    SGLang розглядається як сумісна з OpenAI серверна частина `/v1`, що працює в режимі проксі, а не як
    нативна кінцева точка OpenAI.

    | Поведінка | SGLang |
    |----------|--------|
    | Формування запитів лише для OpenAI | Не застосовується |
    | `service_tier`, `store` для Responses, підказки кешу промптів | Не надсилаються |
    | Формування корисного навантаження для сумісності з міркуванням | Не застосовується |
    | Приховані заголовки атрибуції (`originator`, `version`, `User-Agent`) | Не додаються для власних базових URL-адрес SGLang |

  </Accordion>

  <Accordion title="Усунення несправностей">
    **Сервер недоступний**

    Переконайтеся, що сервер запущений і відповідає:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **Помилки автентифікації**

    Якщо запити завершуються помилками автентифікації, задайте справжній `SGLANG_API_KEY`, який відповідає
    конфігурації вашого сервера, або явно налаштуйте провайдера в
    `models.providers.sglang`.

    <Tip>
    Якщо ви запускаєте SGLang без автентифікації, для ввімкнення виявлення моделей
    достатньо будь-якого непорожнього значення `SGLANG_API_KEY`.
    </Tip>

  </Accordion>
</AccordionGroup>

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки резервного перемикання.
  </Card>
  <Card title="Довідник із конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повна схема конфігурації, зокрема записи провайдерів.
  </Card>
</CardGroup>
