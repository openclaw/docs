---
read_when:
    - Ви хочете запустити OpenClaw з локальним сервером SGLang
    - Вам потрібні сумісні з OpenAI кінцеві точки /v1 з власними моделями
summary: Запуск OpenClaw із SGLang (самостійно розгорнутий сервер, сумісний з OpenAI)
title: SGLang
x-i18n:
    generated_at: "2026-05-06T00:01:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e65e38868e061e03d15348725971880ca503dc61a7425c1fbdc718fd684728f
    source_path: providers/sglang.md
    workflow: 16
---

SGLang обслуговує моделі з відкритими вагами через HTTP API, сумісний з OpenAI. OpenClaw підключається до SGLang за допомогою сімейства провайдерів `openai-completions` з автоматичним виявленням доступних моделей.

| Властивість               | Значення                                                     |
| ------------------------- | ------------------------------------------------------------ |
| Ідентифікатор провайдера  | `sglang`                                                     |
| Plugin                    | вбудований, `enabledByDefault: true`                         |
| Змінна середовища автентифікації | `SGLANG_API_KEY` (будь-яке непорожнє значення, якщо сервер не має автентифікації) |
| Прапорець первинного налаштування | `--auth-choice sglang`                                       |
| API                       | сумісний з OpenAI (`openai-completions`)                     |
| Базова URL-адреса за замовчуванням | `http://127.0.0.1:30000/v1`                                  |
| Заповнювач моделі за замовчуванням | `sglang/Qwen/Qwen3-8B`                                       |
| Використання потокового передавання | Так (`supportsStreamingUsage: true`)                         |
| Ціноутворення             | Позначено як зовнішнє безкоштовне (`modelPricing.external: false`) |

OpenClaw також **автоматично виявляє** доступні моделі з SGLang, коли ви вмикаєте це через `SGLANG_API_KEY` і не визначаєте явний запис `models.providers.sglang` — див. [Виявлення моделей (неявний провайдер)](#model-discovery-implicit-provider) нижче.

## Початок роботи

<Steps>
  <Step title="Запустіть SGLang">
    Запустіть SGLang із сервером, сумісним з OpenAI. Ваша базова URL-адреса має надавати
    кінцеві точки `/v1` (наприклад, `/v1/models`, `/v1/chat/completions`). SGLang
    зазвичай працює за адресою:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="Установіть ключ API">
    Будь-яке значення працює, якщо на вашому сервері не налаштовано автентифікацію:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="Запустіть первинне налаштування або задайте модель напряму">
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
визначаєте `models.providers.sglang`, OpenClaw виконає запит:

- `GET http://127.0.0.1:30000/v1/models`

і перетворить повернуті ідентифікатори на записи моделей.

<Note>
Якщо ви явно задаєте `models.providers.sglang`, автоматичне виявлення пропускається, і
вам потрібно визначити моделі вручну.
</Note>

## Явна конфігурація (ручні моделі)

Використовуйте явну конфігурацію, коли:

- SGLang працює на іншому хості або порту.
- Ви хочете зафіксувати значення `contextWindow`/`maxTokens`.
- Ваш сервер потребує справжнього ключа API (або ви хочете контролювати заголовки).

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
  <Accordion title="Поведінка в стилі проксі">
    SGLang розглядається як проксі-бекенд `/v1`, сумісний з OpenAI, а не як
    нативна кінцева точка OpenAI.

    | Поведінка | SGLang |
    |----------|--------|
    | Формування запитів лише для OpenAI | Не застосовується |
    | `service_tier`, Responses `store`, підказки кешу промптів | Не надсилаються |
    | Формування навантаження для сумісності з reasoning | Не застосовується |
    | Приховані заголовки атрибуції (`originator`, `version`, `User-Agent`) | Не додаються до користувацьких базових URL-адрес SGLang |

  </Accordion>

  <Accordion title="Усунення неполадок">
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
    Якщо ви запускаєте SGLang без автентифікації, будь-якого непорожнього значення для
    `SGLANG_API_KEY` достатньо, щоб увімкнути виявлення моделей.
    </Tip>

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки відмовостійкого перемикання.
  </Card>
  <Card title="Довідник конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повна схема конфігурації, включно із записами провайдерів.
  </Card>
</CardGroup>
