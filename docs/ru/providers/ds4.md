---
read_when:
    - Вы хотите запустить OpenClaw для работы с antirez/ds4
    - Вам нужен локальный бэкенд DeepSeek V4 Flash с вызовами инструментов
    - Вам нужна конфигурация OpenClaw для ds4-server
summary: Запустите OpenClaw через ds4, локальный OpenAI-совместимый сервер DeepSeek V4 Flash
title: ds4
x-i18n:
    generated_at: "2026-06-28T23:36:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a9922421d39f5d2d29dfa62de9fc3de7131dfa96445d0646cd02ad766a125544
    source_path: providers/ds4.md
    workflow: 16
---

[ds4](https://github.com/antirez/ds4) обслуживает DeepSeek V4 Flash из локального
бэкенда Metal с OpenAI-совместимым API `/v1`. OpenClaw подключается к ds4
через универсальное семейство провайдеров `openai-completions`.

ds4 не является встроенным Plugin провайдера OpenClaw. Настройте его в
`models.providers.ds4`, затем выберите `ds4/deepseek-v4-flash`.

- Идентификатор провайдера: `ds4`
- Plugin: нет
- API: OpenAI-совместимый Chat Completions (`openai-completions`)
- Рекомендуемый базовый URL: `http://127.0.0.1:18000/v1`
- Идентификатор модели: `deepseek-v4-flash`
- Вызовы инструментов: поддерживаются через `tools` и `tool_calls` в стиле OpenAI
- Рассуждение: `thinking` и `reasoning_effort` в стиле DeepSeek

## Требования

- macOS с поддержкой Metal.
- Рабочая копия ds4 с `ds4-server` и файлом GGUF DeepSeek V4 Flash.
- Достаточно памяти для выбранного вами контекста. Большие значения `--ctx` выделяют больше
  KV-памяти при запуске сервера.

<Warning>
Ходы агента OpenClaw включают схемы инструментов и контекст рабочей области. Малый контекст,
например `--ctx 4096`, может проходить прямые curl-проверки, но не проходить полные запуски агента с
`500 prompt exceeds context`. Используйте как минимум `--ctx 32768` для smoke-тестов агента и инструментов.
Используйте `--ctx 393216` только если у вас достаточно памяти и вы хотите поведение ds4
Think Max.
</Warning>

## Быстрый старт

<Steps>
  <Step title="Start ds4-server">
    Замените `<DS4_DIR>` на путь к вашей рабочей копии ds4.

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

    Ответ должен включать `deepseek-v4-flash`.

  </Step>
  <Step title="Add the OpenClaw provider config">
    Добавьте конфигурацию из [Полной конфигурации](#full-config), затем выполните разовую
    проверку модели:

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

## Полная конфигурация

Используйте эту конфигурацию, когда ds4 уже запущен на `127.0.0.1:18000`.

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

Держите `contextWindow` согласованным со значением `ds4-server --ctx`. Держите `maxTokens`
согласованным с `--tokens`, если вы намеренно не хотите, чтобы OpenClaw запрашивал меньше
вывода, чем значение сервера по умолчанию.

## Запуск по требованию

OpenClaw может запускать ds4 только когда выбрана модель `ds4/...`. Добавьте
`localService` в ту же запись провайдера:

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

`command` должен быть абсолютным путем к исполняемому файлу. Поиск через оболочку и раскрытие `~`
не используются. См. [Локальные сервисы моделей](/ru/gateway/local-model-services) для всех
полей `localService`.

## Think Max

ds4 применяет Think Max только когда оба условия истинны:

- `ds4-server` запускается с `--ctx 393216` или выше.
- Запрос использует `reasoning_effort: "max"` или эквивалентное поле усилия ds4.

Если вы запускаете такой большой контекст, обновите и флаги сервера, и метаданные модели
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

## Тестирование

Начните с прямой HTTP-проверки:

```bash
curl http://127.0.0.1:18000/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"deepseek-v4-flash","messages":[{"role":"user","content":"Reply with exactly: ds4-ok"}],"max_tokens":16,"stream":false,"thinking":{"type":"disabled"}}'
```

Затем проверьте маршрутизацию модели OpenClaw:

```bash
openclaw infer model run \
  --local \
  --model ds4/deepseek-v4-flash \
  --thinking off \
  --prompt "Reply with exactly: openclaw-ds4-ok" \
  --json
```

Для полного smoke-теста агента и вызова инструментов используйте контекст не меньше 32768:

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

Ожидаемый результат:

- `executionTrace.winnerProvider` равен `ds4`
- `executionTrace.winnerModel` равен `deepseek-v4-flash`
- `toolSummary.calls` не меньше `1`
- `finalAssistantVisibleText` начинается с `tool-ok`

## Устранение неполадок

<AccordionGroup>
  <Accordion title="curl /v1/models cannot connect">
    ds4 не запущен или не привязан к хосту и порту из `baseUrl`. Запустите
    `ds4-server`, затем повторите попытку:

    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

  </Accordion>

  <Accordion title="500 prompt exceeds context">
    Настроенный `--ctx` слишком мал для хода OpenClaw. Увеличьте
    `ds4-server --ctx`, затем обновите `models.providers.ds4.models[].contextWindow`,
    чтобы значения совпадали. Полным ходам агента с инструментами требуется существенно больше контекста, чем
    прямому curl-запросу с одним сообщением.
  </Accordion>

  <Accordion title="Think Max does not activate">
    ds4 использует Think Max только когда `--ctx` не меньше `393216`, а запрос
    запрашивает `reasoning_effort: "max"`. Меньшие контексты откатываются к высокому
    уровню рассуждения.
  </Accordion>

  <Accordion title="The first request is slow">
    У ds4 есть фаза холодного размещения Metal и прогрева модели. Используйте
    `localService.readyTimeoutMs: 300000`, когда OpenClaw запускает сервер по
    требованию.
  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Local model services" href="/ru/gateway/local-model-services" icon="play">
    Запускайте локальные серверы моделей по требованию перед запросами к моделям.
  </Card>
  <Card title="Local models" href="/ru/gateway/local-models" icon="server">
    Выбирайте и эксплуатируйте локальные бэкенды моделей.
  </Card>
  <Card title="Model providers" href="/ru/concepts/model-providers" icon="layers">
    Настраивайте ссылки на провайдеров, аутентификацию и failover.
  </Card>
  <Card title="DeepSeek" href="/ru/providers/deepseek" icon="brain">
    Нативное поведение провайдера DeepSeek и элементы управления thinking.
  </Card>
</CardGroup>
