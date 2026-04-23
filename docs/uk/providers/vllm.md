---
read_when:
    - Ви хочете запускати OpenClaw проти локального сервера vLLM
    - Ви хочете OpenAI-compatible endpoint-и `/v1` зі своїми власними моделями
summary: Запуск OpenClaw з vLLM (локальний сервер, сумісний з OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-04-23T21:08:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: f0296422a926c83b1ab5ffdac7857e34253b624f0d8756c02d49f8805869a219
    source_path: providers/vllm.md
    workflow: 15
---

vLLM може обслуговувати open-source (і деякі custom) моделі через **OpenAI-compatible** HTTP API. OpenClaw підключається до vLLM, використовуючи API `openai-completions`.

OpenClaw також може **автоматично виявляти** доступні моделі з vLLM, коли ви явно вмикаєте це через `VLLM_API_KEY` (підійде будь-яке значення, якщо ваш сервер не вимагає auth) і не визначаєте явний запис `models.providers.vllm`.

OpenClaw трактує `vllm` як локального OpenAI-compatible провайдера, який підтримує
облік streamed usage, тому лічильники токенів status/context можуть оновлюватися з відповідей `stream_options.include_usage`.

| Property         | Value                                    |
| ---------------- | ---------------------------------------- |
| Provider ID      | `vllm`                                   |
| API              | `openai-completions` (OpenAI-compatible) |
| Auth             | змінна середовища `VLLM_API_KEY`         |
| Default base URL | `http://127.0.0.1:8000/v1`               |

## Початок роботи

<Steps>
  <Step title="Запустіть vLLM із OpenAI-compatible server">
    Ваш base URL має відкривати endpoint-и `/v1` (наприклад `/v1/models`, `/v1/chat/completions`). vLLM часто запускається на:

    ```text
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Задайте змінну середовища API key">
    Підійде будь-яке значення, якщо ваш сервер не вимагає auth:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Виберіть модель">
    Замініть на один із ваших ID моделей vLLM:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vllm/your-model-id" },
        },
      },
    }
    ```

  </Step>
  <Step title="Переконайтеся, що модель доступна">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

## Discovery моделей (неявний провайдер)

Коли задано `VLLM_API_KEY` (або існує auth profile) і ви **не** визначаєте `models.providers.vllm`, OpenClaw виконує запит:

```text
GET http://127.0.0.1:8000/v1/models
```

і перетворює повернені ID на записи моделей.

<Note>
Якщо ви явно задаєте `models.providers.vllm`, auto-discovery пропускається, і вам потрібно визначати моделі вручну.
</Note>

## Явна конфігурація (ручні моделі)

Використовуйте явну конфігурацію, коли:

- vLLM працює на іншому хості або порту
- Ви хочете зафіксувати значення `contextWindow` або `maxTokens`
- Ваш сервер потребує справжній API key (або ви хочете керувати заголовками)

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Local vLLM Model",
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

## Розширене налаштування

<AccordionGroup>
  <Accordion title="Поведінка у стилі proxy">
    vLLM трактується як OpenAI-compatible backend `/v1` у стилі proxy, а не як native
    endpoint OpenAI. Це означає:

    | Behavior | Applied? |
    |----------|----------|
    | Native shaping запитів OpenAI | Ні |
    | `service_tier` | Не надсилається |
    | Responses `store` | Не надсилається |
    | Prompt-cache hints | Не надсилаються |
    | Shaping payload для OpenAI reasoning-compat | Не застосовується |
    | Приховані атрибуційні заголовки OpenClaw | Не інжектуються для custom base URL |

  </Accordion>

  <Accordion title="Custom base URL">
    Якщо ваш сервер vLLM працює на нестандартному хості або порту, задайте `baseUrl` у явній конфігурації провайдера:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "my-custom-model",
                name: "Remote vLLM Model",
                reasoning: false,
                input: ["text"],
                contextWindow: 64000,
                maxTokens: 4096,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Сервер недосяжний">
    Переконайтеся, що сервер vLLM запущений і доступний:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Якщо ви бачите помилку з’єднання, перевірте хост, порт і те, що vLLM запущено в режимі OpenAI-compatible server.

  </Accordion>

  <Accordion title="Помилки auth у запитах">
    Якщо запити завершуються помилками auth, задайте реальний `VLLM_API_KEY`, який відповідає конфігурації вашого сервера, або явно налаштуйте провайдера в `models.providers.vllm`.

    <Tip>
    Якщо ваш сервер vLLM не вимагає auth, будь-яке непорожнє значення `VLLM_API_KEY` працює як сигнал явного ввімкнення для OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="Моделі не виявляються">
    Auto-discovery потребує, щоб `VLLM_API_KEY` було задано **і** щоб не існувало явного запису конфігурації `models.providers.vllm`. Якщо ви визначили провайдера вручну, OpenClaw пропускає discovery і використовує лише оголошені вами моделі.
  </Accordion>
</AccordionGroup>

<Warning>
Більше довідки: [Усунення несправностей](/uk/help/troubleshooting) і [FAQ](/uk/help/faq).
</Warning>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, model ref і поведінки failover.
  </Card>
  <Card title="OpenAI" href="/uk/providers/openai" icon="bolt">
    Native-провайдер OpenAI і поведінка OpenAI-compatible route.
  </Card>
  <Card title="OAuth і auth" href="/uk/gateway/authentication" icon="key">
    Деталі auth і правила повторного використання облікових даних.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Типові проблеми та способи їх вирішення.
  </Card>
</CardGroup>
