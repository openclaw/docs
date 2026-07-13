---
read_when:
    - Вы хотите запустить OpenClaw с antirez/ds4
    - Вам нужен локальный бэкенд DeepSeek V4 Flash с вызовами инструментов
    - Вам нужна конфигурация OpenClaw для ds4-server
summary: Запускайте OpenClaw через ds4 — локальный сервер DeepSeek V4 Flash, совместимый с OpenAI
title: ds4
x-i18n:
    generated_at: "2026-07-13T18:40:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: be449813295648694625ef8003b3f4b12903535b74816916ca5af0695174fbf4
    source_path: providers/ds4.md
    workflow: 16
---

[ds4](https://github.com/antirez/ds4) предоставляет DeepSeek V4 Flash через локальный
бэкенд Metal с совместимым с OpenAI API `/v1`. OpenClaw подключается к ds4
через универсальное семейство провайдеров `openai-completions`.

ds4 не является встроенным плагином провайдера OpenClaw. Настройте его в разделе
`models.providers.ds4`, затем выберите `ds4/deepseek-v4-flash`.

| Свойство     | Значение                                                     |
| ------------ | ------------------------------------------------------------ |
| ID провайдера | `ds4`                                                     |
| Плагин       | отсутствует (только конфигурация)                            |
| API          | совместимый с OpenAI Chat Completions (`openai-completions`) |
| Базовый URL  | `http://127.0.0.1:18000/v1` (рекомендуется)                   |
| ID модели    | `deepseek-v4-flash`                                       |
| Вызовы инструментов | в стиле OpenAI: `tools` / `tool_calls`                       |
| Рассуждение  | в стиле DeepSeek: `thinking` и `reasoning_effort`          |

## Требования

- macOS с поддержкой Metal.
- Рабочая копия репозитория ds4 с `ds4-server` и файлом GGUF DeepSeek V4 Flash.
- Достаточный объём памяти для выбранного контекста; большие значения `--ctx` выделяют больше
  памяти KV при запуске сервера.

<Warning>
Запросы агентов OpenClaw включают схемы инструментов и контекст рабочего пространства. Малый контекст,
например `--ctx 4096`, может успешно пройти прямые проверки через curl, но привести к сбою полных запусков агента с
`500 prompt exceeds context`. Для быстрых проверок агента и инструментов используйте как минимум `--ctx 32768`.
Используйте `--ctx 393216` только при наличии достаточного объёма памяти и для включения
Think Max в ds4.
</Warning>

## Быстрый старт

<Steps>
  <Step title="Запустите ds4-server">
    Замените `<DS4_DIR>` путём к вашей рабочей копии ds4.

    ```bash
    <DS4_DIR>/ds4-server \
      --model <DS4_DIR>/ds4flash.gguf \
      --host 127.0.0.1 \
      --port 18000 \
      --ctx 32768 \
      --tokens 128
    ```

  </Step>
  <Step title="Проверьте совместимую с OpenAI конечную точку">
    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

    Ответ должен содержать `deepseek-v4-flash`.

  </Step>
  <Step title="Добавьте конфигурацию провайдера OpenClaw">
    Добавьте конфигурацию из раздела [Полная конфигурация](#full-config), затем выполните однократную
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

Используйте эту конфигурацию, если ds4 уже запущен по адресу `127.0.0.1:18000`.

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

Согласуйте `contextWindow` с `ds4-server --ctx`. Согласуйте `maxTokens`
с `--tokens`, если только вы намеренно не хотите, чтобы OpenClaw запрашивал меньший объём вывода,
чем задано на сервере по умолчанию.

## Запуск по требованию

OpenClaw может запускать ds4 только при выборе модели `ds4/...`. Добавьте
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

`command` должен быть абсолютным путём к исполняемому файлу. Поиск через оболочку и раскрытие `~`
не используются. Описание всех полей `localService` см. в разделе [Локальные сервисы моделей](/ru/gateway/local-model-services).

## Think Max

ds4 применяет Think Max, только когда выполняются оба условия:

- `ds4-server` начинается с `--ctx 393216` или более высокого значения.
- В запросе используется `reasoning_effort: "max"` (или эквивалентное поле уровня рассуждений ds4).

При использовании такого большого контекста обновите как флаги сервера, так и метаданные
модели OpenClaw:

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

## Проверка

Прямая проверка HTTP в обход OpenClaw:

```bash
curl http://127.0.0.1:18000/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"deepseek-v4-flash","messages":[{"role":"user","content":"Reply with exactly: ds4-ok"}],"max_tokens":16,"stream":false,"thinking":{"type":"disabled"}}'
```

Маршрутизация модели OpenClaw (аналогично проверке из раздела быстрого старта):

```bash
openclaw infer model run \
  --local \
  --model ds4/deepseek-v4-flash \
  --thinking off \
  --prompt "Reply with exactly: openclaw-ds4-ok" \
  --json
```

Быстрая проверка полного запуска агента и вызова инструментов с контекстом не менее 32768:

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

- `executionTrace.winnerProvider` имеет значение `ds4`
- `executionTrace.winnerModel` имеет значение `deepseek-v4-flash`
- `toolSummary.calls` составляет не менее `1`
- `finalAssistantVisibleText` начинается с `tool-ok`

## Устранение неполадок

<AccordionGroup>
  <Accordion title="curl не удаётся подключиться к /v1/models">
    ds4 не запущен или не привязан к хосту/порту, указанному в `baseUrl`. Запустите
    `ds4-server`, затем повторите попытку:

    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

  </Accordion>

  <Accordion title="500: запрос превышает размер контекста">
    Настроенное значение `--ctx` слишком мало для запроса OpenClaw. Увеличьте
    `ds4-server --ctx`, затем соответствующим образом обновите `models.providers.ds4.models[].contextWindow`.
    Полным запросам агента с инструментами требуется значительно больше контекста, чем
    прямому curl-запросу с одним сообщением.
  </Accordion>

  <Accordion title="Think Max не активируется">
    ds4 использует Think Max, только когда `--ctx` составляет не менее `393216`, а запрос
    запрашивает `reasoning_effort: "max"`. При меньшем контексте используется высокий
    уровень рассуждений.
  </Accordion>

  <Accordion title="Первый запрос выполняется медленно">
    ds4 требуется время для первоначального размещения в Metal и прогрева модели. Задайте
    `localService.readyTimeoutMs: 300000`, когда OpenClaw запускает сервер
    по требованию.
  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Локальные сервисы моделей" href="/ru/gateway/local-model-services" icon="play">
    Запускайте локальные серверы моделей по требованию перед запросами к моделям.
  </Card>
  <Card title="Локальные модели" href="/ru/gateway/local-models" icon="server">
    Выбирайте и используйте локальные бэкенды моделей.
  </Card>
  <Card title="Провайдеры моделей" href="/ru/concepts/model-providers" icon="layers">
    Настраивайте ссылки на провайдеров, аутентификацию и аварийное переключение.
  </Card>
  <Card title="DeepSeek" href="/ru/providers/deepseek" icon="brain">
    Нативное поведение провайдера DeepSeek и управление рассуждениями.
  </Card>
</CardGroup>
