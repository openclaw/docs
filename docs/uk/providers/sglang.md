---
read_when:
    - Ви хочете запускати OpenClaw проти локального сервера SGLang
    - Ви хочете OpenAI-сумісні endpoints `/v1` зі своїми власними моделями
summary: Запуск OpenClaw із SGLang (self-hosted сервер, сумісний з OpenAI)
title: SGLang
x-i18n:
    generated_at: "2026-04-23T21:08:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8ed6767f85bcf099fb25dfe72a48b8a09e04ba13212125651616d2d93607beba
    source_path: providers/sglang.md
    workflow: 15
---

SGLang може обслуговувати open-source моделі через **OpenAI-сумісний** HTTP API.
OpenClaw може підключатися до SGLang, використовуючи API `openai-completions`.

OpenClaw також може **автоматично виявляти** доступні моделі з SGLang, якщо ви
явно погодитеся через `SGLANG_API_KEY` (підійде будь-яке значення, якщо ваш сервер не вимагає auth)
і не визначите явний запис `models.providers.sglang`.

OpenClaw розглядає `sglang` як локальний OpenAI-сумісний provider, який підтримує
облік використання через streaming, тому лічильники status/context token можуть оновлюватися з відповідей `stream_options.include_usage`.

## Початок роботи

<Steps>
  <Step title="Запустіть SGLang">
    Запустіть SGLang із OpenAI-сумісним сервером. Ваш base URL має надавати
    endpoints `/v1` (наприклад `/v1/models`, `/v1/chat/completions`). SGLang
    зазвичай працює на:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="Задайте API-ключ">
    Якщо на вашому сервері не налаштовано auth, підійде будь-яке значення:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="Запустіть онбординг або задайте модель безпосередньо">
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

## Виявлення моделей (неявний provider)

Коли `SGLANG_API_KEY` задано (або існує auth profile) і ви **не**
визначаєте `models.providers.sglang`, OpenClaw виконає запит:

- `GET http://127.0.0.1:30000/v1/models`

і перетворить повернуті ID на записи моделей.

<Note>
Якщо ви явно задаєте `models.providers.sglang`, автовиявлення пропускається, і
вам доведеться визначити моделі вручну.
</Note>

## Явна конфігурація (моделі вручну)

Використовуйте явну конфігурацію, коли:

- SGLang працює на іншому хості/порту.
- Ви хочете зафіксувати значення `contextWindow`/`maxTokens`.
- Ваш сервер потребує справжнього API-ключа (або ви хочете контролювати headers).

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
  <Accordion title="Поведінка в стилі proxy">
    SGLang розглядається як backend `/v1`, сумісний з OpenAI, у стилі proxy, а не як
    нативний endpoint OpenAI.

    | Поведінка | SGLang |
    |----------|--------|
    | Формування запитів лише для OpenAI | Не застосовується |
    | `service_tier`, Responses `store`, підказки prompt-cache | Не надсилаються |
    | Формування payload для сумісності reasoning | Не застосовується |
    | Приховані заголовки атрибуції (`originator`, `version`, `User-Agent`) | Не додаються для власних base URL SGLang |

  </Accordion>

  <Accordion title="Усунення проблем">
    **Сервер недоступний**

    Переконайтеся, що сервер працює й відповідає:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **Помилки auth**

    Якщо запити завершуються помилками auth, задайте справжній `SGLANG_API_KEY`, який відповідає
    конфігурації вашого сервера, або явно налаштуйте provider у
    `models.providers.sglang`.

    <Tip>
    Якщо ви запускаєте SGLang без автентифікації, будь-яке непорожнє значення
    `SGLANG_API_KEY` достатнє для opt-in до виявлення моделей.
    </Tip>

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір provider, refs моделей і поведінки failover.
  </Card>
  <Card title="Довідник конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повна схема config, включно із записами provider.
  </Card>
</CardGroup>
