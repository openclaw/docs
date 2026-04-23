---
read_when:
    - Ви хочете запустити OpenClaw з локальним сервером SGLang
    - Ви хочете використовувати сумісні з OpenAI ендпоінти `/v1` із власними моделями
summary: Запустіть OpenClaw із SGLang (самостійно розміщений сервер, сумісний з OpenAI)
title: SGLang
x-i18n:
    generated_at: "2026-04-23T02:58:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 96f243c6028d9de104c96c8e921e5bec1a685db06b80465617f33fe29d5c472d
    source_path: providers/sglang.md
    workflow: 15
---

# SGLang

SGLang може обслуговувати open-source моделі через **сумісний з OpenAI** HTTP API.
OpenClaw може підключатися до SGLang за допомогою API `openai-completions`.

OpenClaw також може **автоматично виявляти** доступні моделі з SGLang, коли ви
явно вмикаєте це через `SGLANG_API_KEY` (підійде будь-яке значення, якщо ваш
сервер не вимагає автентифікації) і не визначаєте явний запис
`models.providers.sglang`.

OpenClaw розглядає `sglang` як локального сумісного з OpenAI провайдера, який
підтримує потоковий облік використання, тому лічильники токенів стану/контексту
можуть оновлюватися на основі відповідей `stream_options.include_usage`.

## Початок роботи

<Steps>
  <Step title="Запустіть SGLang">
    Запустіть SGLang із сервером, сумісним з OpenAI. Ваш базовий URL має
    надавати ендпоінти `/v1` (наприклад `/v1/models`,
    `/v1/chat/completions`). SGLang зазвичай працює на:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="Задайте API-ключ">
    Якщо на вашому сервері не налаштовано автентифікацію, підійде будь-яке значення:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="Запустіть онбординг або задайте модель напряму">
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

Коли `SGLANG_API_KEY` задано (або існує профіль автентифікації) і ви **не**
визначаєте `models.providers.sglang`, OpenClaw виконає запит:

- `GET http://127.0.0.1:30000/v1/models`

і перетворить повернуті ID на записи моделей.

<Note>
Якщо ви явно задаєте `models.providers.sglang`, автовиявлення пропускається, і
вам потрібно визначити моделі вручну.
</Note>

## Явна конфігурація (ручне задання моделей)

Використовуйте явну конфігурацію, коли:

- SGLang працює на іншому хості/порту.
- Ви хочете зафіксувати значення `contextWindow`/`maxTokens`.
- Ваш сервер вимагає справжній API-ключ (або ви хочете контролювати заголовки).

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
            name: "Локальна модель SGLang",
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
  <Accordion title="Поведінка у стилі проксі">
    SGLang розглядається як сумісний з OpenAI бекенд `/v1` у стилі проксі, а не
    як нативний ендпоінт OpenAI.

    | Поведінка | SGLang |
    |----------|--------|
    | Формування запитів лише для OpenAI | Не застосовується |
    | `service_tier`, `store` у Responses, підказки для prompt-cache | Не надсилаються |
    | Формування payload для сумісності з reasoning | Не застосовується |
    | Приховані заголовки атрибуції (`originator`, `version`, `User-Agent`) | Не додаються в користувацькі базові URL SGLang |

  </Accordion>

  <Accordion title="Усунення проблем">
    **Сервер недоступний**

    Переконайтеся, що сервер запущено і він відповідає:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **Помилки автентифікації**

    Якщо запити завершуються помилками автентифікації, задайте справжній
    `SGLANG_API_KEY`, який відповідає конфігурації вашого сервера, або явно
    налаштуйте провайдера в `models.providers.sglang`.

    <Tip>
    Якщо ви запускаєте SGLang без автентифікації, будь-якого непорожнього
    значення `SGLANG_API_KEY` достатньо, щоб явно ввімкнути виявлення моделей.
    </Tip>

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Довідник із конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повна схема конфігурації, включно із записами провайдерів.
  </Card>
</CardGroup>
