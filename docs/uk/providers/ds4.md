---
read_when:
    - Ви хочете запустити OpenClaw із antirez/ds4
    - Вам потрібен локальний бекенд DeepSeek V4 Flash із викликами інструментів
    - Вам потрібна конфігурація OpenClaw для ds4-server
summary: Запускайте OpenClaw через ds4 — локальний сервер DeepSeek V4 Flash, сумісний з OpenAI
title: ds4
x-i18n:
    generated_at: "2026-07-12T13:41:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be449813295648694625ef8003b3f4b12903535b74816916ca5af0695174fbf4
    source_path: providers/ds4.md
    workflow: 16
---

[ds4](https://github.com/antirez/ds4) запускає DeepSeek V4 Flash на локальному
бекенді Metal з API `/v1`, сумісним з OpenAI. OpenClaw підключається до ds4
через універсальне сімейство постачальників `openai-completions`.

ds4 не є вбудованим Plugin постачальника OpenClaw. Налаштуйте його в
`models.providers.ds4`, а потім виберіть `ds4/deepseek-v4-flash`.

| Властивість        | Значення                                                  |
| ------------------ | --------------------------------------------------------- |
| Ідентифікатор постачальника | `ds4`                                            |
| Plugin             | немає (лише конфігурація)                                 |
| API                | Chat Completions, сумісний з OpenAI (`openai-completions`) |
| Базова URL-адреса  | `http://127.0.0.1:18000/v1` (рекомендовано)               |
| Ідентифікатор моделі | `deepseek-v4-flash`                                     |
| Виклики інструментів | `tools` / `tool_calls` у стилі OpenAI                   |
| Міркування         | `thinking` і `reasoning_effort` у стилі DeepSeek          |

## Вимоги

- macOS із підтримкою Metal.
- Робоча копія репозиторію ds4 із `ds4-server` і файлом GGUF DeepSeek V4 Flash.
- Достатньо пам’яті для вибраного контексту; більші значення `--ctx` виділяють
  більше KV-пам’яті під час запуску сервера.

<Warning>
Ходи агента OpenClaw містять схеми інструментів і контекст робочого простору. Малий контекст,
наприклад `--ctx 4096`, може пройти прямі тести curl, але спричинити помилку повних запусків агента
`500 prompt exceeds context`. Для димових тестів агента й інструментів використовуйте
принаймні `--ctx 32768`. Використовуйте `--ctx 393216` лише за наявності достатнього обсягу пам’яті
та для ввімкнення Think Max у ds4.
</Warning>

## Швидкий початок

<Steps>
  <Step title="Start ds4-server">
    Замініть `<DS4_DIR>` шляхом до вашої робочої копії ds4.

    ```bash
    <DS4_DIR>/ds4-server \
      --model <DS4_DIR>/ds4flash.gguf \
      --host 127.0.0.1 \
      --port 18000 \
      --ctx 32768 \
      --tokens 128
    ```

  </Step>
  <Step title="Verify the OpenAI-compatible endpoint">
    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

    Відповідь має містити `deepseek-v4-flash`.

  </Step>
  <Step title="Add the OpenClaw provider config">
    Додайте конфігурацію з розділу [Повна конфігурація](#full-config), а потім виконайте одноразову
    перевірку моделі:

    ```bash
    openclaw infer model run \
      --local \
      --model ds4/deepseek-v4-flash \
      --thinking off \
      --prompt "Reply with exactly: openclaw-ds4-ok" \
      --json
    ```

  </Step>
</Steps>

## Повна конфігурація

Використовуйте цю конфігурацію, якщо ds4 уже працює на `127.0.0.1:18000`.

```json5
{
  agents: {
    defaults: {
      model: { primary: "ds4/deepseek-v4-flash" },
      models: {
        "ds4/deepseek-v4-flash": {
          alias: "DS4 local",
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      ds4: {
        baseUrl: "http://127.0.0.1:18000/v1",
        apiKey: "ds4-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        models: [
          {
            id: "deepseek-v4-flash",
            name: "DeepSeek V4 Flash (ds4)",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32768,
            maxTokens: 128,
            compat: {
              supportsUsageInStreaming: true,
              supportsReasoningEffort: true,
              maxTokensField: "max_tokens",
              supportsStrictMode: false,
              thinkingFormat: "deepseek",
              supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
            },
          },
        ],
      },
    },
  },
}
```

Узгоджуйте `contextWindow` із `ds4-server --ctx`. Узгоджуйте `maxTokens`
із `--tokens`, якщо ви навмисно не хочете, щоб OpenClaw запитував менше вихідних даних,
ніж визначено стандартним значенням сервера.

## Запуск на вимогу

OpenClaw може запускати ds4 лише тоді, коли вибрано модель `ds4/...`. Додайте
`localService` до того самого запису постачальника:

```json5
{
  models: {
    providers: {
      ds4: {
        baseUrl: "http://127.0.0.1:18000/v1",
        apiKey: "ds4-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "<DS4_DIR>/ds4-server",
          args: [
            "--model",
            "<DS4_DIR>/ds4flash.gguf",
            "--host",
            "127.0.0.1",
            "--port",
            "18000",
            "--ctx",
            "32768",
            "--tokens",
            "128",
          ],
          cwd: "<DS4_DIR>",
          healthUrl: "http://127.0.0.1:18000/v1/models",
          readyTimeoutMs: 300000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "deepseek-v4-flash",
            name: "DeepSeek V4 Flash (ds4)",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32768,
            maxTokens: 128,
            compat: {
              supportsUsageInStreaming: true,
              supportsReasoningEffort: true,
              maxTokensField: "max_tokens",
              supportsStrictMode: false,
              thinkingFormat: "deepseek",
              supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
            },
          },
        ],
      },
    },
  },
}
```

`command` має бути абсолютним шляхом до виконуваного файла. Пошук через оболонку та розгортання `~`
не використовуються. Опис усіх полів `localService` див. у розділі
[Локальні служби моделей](/uk/gateway/local-model-services).

## Think Max

ds4 застосовує Think Max лише тоді, коли виконуються обидві умови:

- `ds4-server` запускається з `--ctx 393216` або більшим значенням.
- Запит використовує `reasoning_effort: "max"` (або еквівалентне поле зусилля ds4).

Якщо ви використовуєте такий великий контекст, оновіть і прапорці сервера, і метадані моделі
OpenClaw:

```json5
{
  contextWindow: 393216,
  maxTokens: 384000,
  compat: {
    supportsUsageInStreaming: true,
    supportsReasoningEffort: true,
    maxTokensField: "max_tokens",
    supportsStrictMode: false,
    thinkingFormat: "deepseek",
    supportedReasoningEfforts: ["low", "medium", "high", "xhigh", "max"],
  },
}
```

## Тестування

Пряма перевірка HTTP в обхід OpenClaw:

```bash
curl http://127.0.0.1:18000/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"deepseek-v4-flash","messages":[{"role":"user","content":"Reply with exactly: ds4-ok"}],"max_tokens":16,"stream":false,"thinking":{"type":"disabled"}}'
```

Маршрутизація моделі OpenClaw (та сама перевірка, що й у швидкому початку):

```bash
openclaw infer model run \
  --local \
  --model ds4/deepseek-v4-flash \
  --thinking off \
  --prompt "Reply with exactly: openclaw-ds4-ok" \
  --json
```

Повний димовий тест агента та виклику інструментів із контекстом щонайменше 32768:

```bash
openclaw agent \
  --local \
  --session-id ds4-tool-smoke \
  --model ds4/deepseek-v4-flash \
  --thinking off \
  --message "Use the shell command pwd once, then reply exactly: tool-ok <output>" \
  --json \
  --timeout 240
```

Очікуваний результат:

- `executionTrace.winnerProvider` має значення `ds4`
- `executionTrace.winnerModel` має значення `deepseek-v4-flash`
- `toolSummary.calls` становить щонайменше `1`
- `finalAssistantVisibleText` починається з `tool-ok`

## Усунення несправностей

<AccordionGroup>
  <Accordion title="curl /v1/models cannot connect">
    ds4 не запущено або він не прив’язаний до хоста чи порту, указаного в `baseUrl`. Запустіть
    `ds4-server`, а потім повторіть спробу:

    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

  </Accordion>

  <Accordion title="500 prompt exceeds context">
    Налаштоване значення `--ctx` замале для ходу OpenClaw. Збільште
    `ds4-server --ctx`, а потім відповідно оновіть `models.providers.ds4.models[].contextWindow`.
    Повні ходи агента з інструментами потребують значно більшого контексту, ніж
    прямий запит curl з одним повідомленням.
  </Accordion>

  <Accordion title="Think Max does not activate">
    ds4 використовує Think Max лише тоді, коли `--ctx` становить щонайменше `393216`, а запит
    вимагає `reasoning_effort: "max"`. За меншого контексту використовується високий
    рівень міркування.
  </Accordion>

  <Accordion title="The first request is slow">
    ds4 має фазу холодного розміщення в Metal і прогрівання моделі. Установіть
    `localService.readyTimeoutMs: 300000`, коли OpenClaw запускає сервер
    на вимогу.
  </Accordion>
</AccordionGroup>

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Local model services" href="/uk/gateway/local-model-services" icon="play">
    Запускайте локальні сервери моделей на вимогу перед запитами до моделей.
  </Card>
  <Card title="Local models" href="/uk/gateway/local-models" icon="server">
    Вибирайте й використовуйте локальні бекенди моделей.
  </Card>
  <Card title="Model providers" href="/uk/concepts/model-providers" icon="layers">
    Налаштовуйте посилання на постачальників, автентифікацію та перемикання після відмови.
  </Card>
  <Card title="DeepSeek" href="/uk/providers/deepseek" icon="brain">
    Власна поведінка постачальника DeepSeek і засоби керування міркуванням.
  </Card>
</CardGroup>
