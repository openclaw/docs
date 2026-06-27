---
read_when:
    - Ви хочете запустити OpenClaw для antirez/ds4
    - Вам потрібен локальний бекенд DeepSeek V4 Flash із викликами інструментів
    - Вам потрібна конфігурація OpenClaw для ds4-server
summary: Запускайте OpenClaw через ds4, локальний сервер DeepSeek V4 Flash, сумісний з OpenAI
title: ds4
x-i18n:
    generated_at: "2026-06-27T18:10:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a9922421d39f5d2d29dfa62de9fc3de7131dfa96445d0646cd02ad766a125544
    source_path: providers/ds4.md
    workflow: 16
---

[ds4](https://github.com/antirez/ds4) обслуговує DeepSeek V4 Flash з локального
бекенду Metal через OpenAI-сумісний API `/v1`. OpenClaw підключається до ds4
через загальну родину провайдерів `openai-completions`.

ds4 не є вбудованим Plugin провайдера OpenClaw. Налаштуйте його в
`models.providers.ds4`, а потім виберіть `ds4/deepseek-v4-flash`.

- Ідентифікатор провайдера: `ds4`
- Plugin: немає
- API: OpenAI-сумісні Chat Completions (`openai-completions`)
- Рекомендована базова URL-адреса: `http://127.0.0.1:18000/v1`
- Ідентифікатор моделі: `deepseek-v4-flash`
- Виклики інструментів: підтримуються через OpenAI-стиль `tools` і `tool_calls`
- Міркування: DeepSeek-стиль `thinking` і `reasoning_effort`

## Вимоги

- macOS із підтримкою Metal.
- Робоча копія ds4 з `ds4-server` і файлом DeepSeek V4 Flash GGUF.
- Достатньо пам'яті для вибраного контексту. Більші значення `--ctx` виділяють більше
  пам'яті KV під час запуску сервера.

<Warning>
Ходи агента OpenClaw містять схеми інструментів і контекст робочого простору. Малий контекст,
наприклад `--ctx 4096`, може проходити прямі тести curl, але не проходити повні запуски агента з
`500 prompt exceeds context`. Використовуйте принаймні `--ctx 32768` для димових тестів агента й інструментів.
Використовуйте `--ctx 393216` лише тоді, коли маєте достатньо пам'яті й хочете поведінку ds4
Think Max.
</Warning>

## Швидкий старт

<Steps>
  <Step title="Запустіть ds4-server">
    Замініть `<DS4_DIR>` на шлях до вашої копії ds4.

    ```bash
    <DS4_DIR>/ds4-server \
      --model <DS4_DIR>/ds4flash.gguf \
      --host 127.0.0.1 \
      --port 18000 \
      --ctx 32768 \
      --tokens 128
    ```

  </Step>
  <Step title="Перевірте OpenAI-сумісну кінцеву точку">
    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

    Відповідь має містити `deepseek-v4-flash`.

  </Step>
  <Step title="Додайте конфігурацію провайдера OpenClaw">
    Додайте конфігурацію з розділу [Повна конфігурація](#full-config), а потім запустіть одноразову
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

Використовуйте цю конфігурацію, коли ds4 уже працює на `127.0.0.1:18000`.

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

Тримайте `contextWindow` узгодженим зі значенням `ds4-server --ctx`. Тримайте `maxTokens`
узгодженим із `--tokens`, якщо ви навмисно не хочете, щоб OpenClaw запитував менше
виводу, ніж стандартно задає сервер.

## Запуск на вимогу

OpenClaw може запускати ds4 лише тоді, коли вибрано модель `ds4/...`. Додайте
`localService` до того самого запису провайдера:

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

`command` має бути абсолютним шляхом до виконуваного файлу. Пошук через shell і розгортання `~`
не використовуються. Усі поля `localService` дивіться в розділі [Локальні сервіси моделей](/uk/gateway/local-model-services).

## Think Max

ds4 застосовує Think Max лише тоді, коли обидві умови істинні:

- `ds4-server` запускається з `--ctx 393216` або більшим значенням.
- Запит використовує `reasoning_effort: "max"` або еквівалентне поле зусилля ds4.

Якщо ви запускаєте такий великий контекст, оновіть і прапорці сервера, і метадані моделі OpenClaw:

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

Почніть із прямої перевірки HTTP:

```bash
curl http://127.0.0.1:18000/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"deepseek-v4-flash","messages":[{"role":"user","content":"Reply with exactly: ds4-ok"}],"max_tokens":16,"stream":false,"thinking":{"type":"disabled"}}'
```

Потім протестуйте маршрутизацію моделі OpenClaw:

```bash
openclaw infer model run \
  --local \
  --model ds4/deepseek-v4-flash \
  --thinking off \
  --prompt "Reply with exactly: openclaw-ds4-ok" \
  --json
```

Для повного димового тесту агента й виклику інструментів використовуйте контекст щонайменше 32768:

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

- `executionTrace.winnerProvider` дорівнює `ds4`
- `executionTrace.winnerModel` дорівнює `deepseek-v4-flash`
- `toolSummary.calls` становить щонайменше `1`
- `finalAssistantVisibleText` починається з `tool-ok`

## Усунення неполадок

<AccordionGroup>
  <Accordion title="curl /v1/models не може підключитися">
    ds4 не запущено або він не прив'язаний до хоста й порту в `baseUrl`. Запустіть
    `ds4-server`, а потім повторіть спробу:

    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

  </Accordion>

  <Accordion title="500 prompt exceeds context">
    Налаштоване значення `--ctx` замале для ходу OpenClaw. Збільште
    `ds4-server --ctx`, а потім оновіть `models.providers.ds4.models[].contextWindow`,
    щоб воно збігалося. Повним ходам агента з інструментами потрібно значно більше контексту, ніж
    прямому curl-запиту з одним повідомленням.
  </Accordion>

  <Accordion title="Think Max не активується">
    ds4 використовує Think Max лише тоді, коли `--ctx` становить щонайменше `393216`, а запит
    просить `reasoning_effort: "max"`. Менші контексти повертаються до високого
    міркування.
  </Accordion>

  <Accordion title="Перший запит повільний">
    ds4 має фазу холодного розміщення Metal і прогрівання моделі. Використовуйте
    `localService.readyTimeoutMs: 300000`, коли OpenClaw запускає сервер
    на вимогу.
  </Accordion>
</AccordionGroup>

## Пов'язане

<CardGroup cols={2}>
  <Card title="Локальні сервіси моделей" href="/uk/gateway/local-model-services" icon="play">
    Запускайте локальні сервери моделей на вимогу перед запитами до моделі.
  </Card>
  <Card title="Локальні моделі" href="/uk/gateway/local-models" icon="server">
    Вибирайте й експлуатуйте локальні бекенди моделей.
  </Card>
  <Card title="Провайдери моделей" href="/uk/concepts/model-providers" icon="layers">
    Налаштовуйте посилання на провайдерів, автентифікацію та failover.
  </Card>
  <Card title="DeepSeek" href="/uk/providers/deepseek" icon="brain">
    Нативна поведінка провайдера DeepSeek і елементи керування мисленням.
  </Card>
</CardGroup>
