---
read_when:
    - Вы хотите, чтобы OpenClaw запускал локальный сервер модели только тогда, когда выбрана его модель
    - Вы запускаете ds4, inferrs, vLLM, llama.cpp, MLX или другой локальный сервер, совместимый с OpenAI
    - Вам нужно управлять холодным запуском, готовностью и завершением при простое для локальных провайдеров
summary: Запускайте локальные серверы моделей по требованию перед запросами моделей OpenClaw
title: Локальные сервисы моделей
x-i18n:
    generated_at: "2026-06-28T22:58:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 399648e32dd51faba7687a26de75ef349f1197269b5cca03d34552f0cd9cce28
    source_path: gateway/local-model-services.md
    workflow: 16
---

`models.providers.<id>.localService` позволяет OpenClaw запускать принадлежащий провайдеру локальный сервер моделей по требованию. Это конфигурация уровня провайдера: когда выбранная модель принадлежит этому провайдеру, OpenClaw проверяет сервис, запускает процесс, если endpoint недоступен, дожидается готовности, а затем отправляет запрос к модели.

Используйте это для локальных серверов, которые дорого держать запущенными весь день, или для ручных настроек, где выбора модели должно быть достаточно, чтобы поднять backend.

## Как это работает

1. Запрос к модели разрешается в настроенного провайдера.
2. Если у этого провайдера есть `localService`, OpenClaw проверяет `healthUrl`.
3. Если проверка успешна, OpenClaw использует существующий сервер.
4. Если проверка завершается ошибкой, OpenClaw запускает `command` с `args`.
5. OpenClaw опрашивает готовность до истечения `readyTimeoutMs`.
6. Запрос к модели отправляется через обычный транспорт провайдера.
7. Если OpenClaw запустил процесс и `idleStopMs` положителен, процесс
   останавливается после того, как последний выполняющийся запрос простаивал это время.

OpenClaw не устанавливает для этого launchd, systemd, Docker или daemon. Сервер является дочерним процессом процесса OpenClaw, которому он первым понадобился.

## Форма конфигурации

```json5
{
  models: {
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "local-model",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "/absolute/path/to/server",
          args: ["--host", "127.0.0.1", "--port", "8000"],
          cwd: "/absolute/path/to/working-dir",
          env: { LOCAL_MODEL_CACHE: "/absolute/path/to/cache" },
          healthUrl: "http://127.0.0.1:8000/v1/models",
          readyTimeoutMs: 180000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "my-local-model",
            name: "My Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## Поля

- `command`: абсолютный путь к исполняемому файлу. Поиск через shell не используется.
- `args`: аргументы процесса. Расширение shell, pipes, globbing или правила quoting
  не применяются.
- `cwd`: необязательный рабочий каталог для процесса.
- `env`: необязательные переменные окружения, объединяемые поверх окружения процесса OpenClaw.
- `healthUrl`: URL готовности. Если он опущен, OpenClaw добавляет `/models` к
  `baseUrl`, поэтому `http://127.0.0.1:8000/v1` становится
  `http://127.0.0.1:8000/v1/models`.
- `readyTimeoutMs`: крайний срок готовности при запуске. По умолчанию: `120000`.
- `idleStopMs`: задержка остановки при простое для процессов, запущенных OpenClaw. `0` или
  пропуск оставляет процесс живым до выхода OpenClaw.

## Пример Inferrs

Inferrs — это пользовательский OpenAI-совместимый backend `/v1`, поэтому тот же API локального сервиса работает с записью провайдера `inferrs`.

```json5
{
  agents: {
    defaults: {
      model: { primary: "inferrs/google/gemma-4-E2B-it" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "/opt/homebrew/bin/inferrs",
          args: [
            "serve",
            "google/gemma-4-E2B-it",
            "--host",
            "127.0.0.1",
            "--port",
            "8080",
            "--device",
            "metal",
          ],
          healthUrl: "http://127.0.0.1:8080/v1/models",
          readyTimeoutMs: 180000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

Замените `command` результатом `which inferrs` на машине, где запущен OpenClaw.

## Пример ds4

Полную настройку, рекомендации по размеру контекста и команды проверки см. в
[ds4](/ru/providers/ds4).

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
        models: [],
      },
    },
  },
}
```

## Операционные заметки

- Один процесс OpenClaw управляет дочерним процессом, который он запустил. Другой процесс OpenClaw,
  увидев тот же уже работающий URL проверки, переиспользует его без принятия под управление.
- Запуск сериализуется для каждого набора команды и аргументов провайдера, поэтому параллельные
  запросы не создают дублирующиеся серверы для одной конфигурации.
- Активные потоковые ответы удерживают lease; остановка при простое ждет, пока обработка
  тела ответа завершится.
- Используйте `timeoutSeconds` для медленных локальных провайдеров, чтобы холодные запуски и долгие генерации
  не упирались в стандартный timeout запроса к модели.
- Используйте явный `healthUrl`, если ваш сервер публикует готовность где-то еще,
  кроме `/v1/models`.

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Локальные модели" href="/ru/gateway/local-models" icon="server">
    Настройка локальных моделей, выбор провайдера и рекомендации по безопасности.
  </Card>
  <Card title="Inferrs" href="/ru/providers/inferrs" icon="cpu">
    Запускайте OpenClaw через OpenAI-совместимый локальный сервер inferrs.
  </Card>
</CardGroup>
