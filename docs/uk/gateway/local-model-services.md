---
read_when:
    - Ви хочете, щоб OpenClaw запускав локальний сервер моделі лише тоді, коли вибрано його модель
    - Ви запускаєте ds4, inferrs, vLLM, llama.cpp, MLX або інший локальний сервер, сумісний з OpenAI
    - Вам потрібно керувати холодним запуском, готовністю та завершенням роботи під час простою для локальних провайдерів
summary: Запускайте локальні сервери моделей на вимогу перед запитами моделей OpenClaw
title: Локальні сервіси моделей
x-i18n:
    generated_at: "2026-06-27T17:33:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 399648e32dd51faba7687a26de75ef349f1197269b5cca03d34552f0cd9cce28
    source_path: gateway/local-model-services.md
    workflow: 16
---

`models.providers.<id>.localService` дає OpenClaw змогу запускати локальний
сервер моделей, яким володіє провайдер, на вимогу. Це конфігурація рівня
провайдера: коли вибрана модель належить цьому провайдеру, OpenClaw перевіряє
сервіс, запускає процес, якщо endpoint недоступний, чекає готовності, а потім
надсилає запит до моделі.

Використовуйте це для локальних серверів, які дорого тримати запущеними весь
день, або для ручних налаштувань, де вибору моделі має бути достатньо, щоб
підняти бекенд.

## Як це працює

1. Запит до моделі зіставляється з налаштованим провайдером.
2. Якщо цей провайдер має `localService`, OpenClaw перевіряє `healthUrl`.
3. Якщо перевірка успішна, OpenClaw використовує наявний сервер.
4. Якщо перевірка неуспішна, OpenClaw запускає `command` з `args`.
5. OpenClaw опитує готовність, доки не спливе `readyTimeoutMs`.
6. Запит до моделі надсилається через звичайний транспорт провайдера.
7. Якщо OpenClaw запустив процес і `idleStopMs` є додатним, процес
   зупиняється після того, як останній активний запит простоював так довго.

OpenClaw не встановлює для цього launchd, systemd, Docker або daemon. Сервер є
дочірнім процесом процесу OpenClaw, якому він уперше знадобився.

## Форма конфігурації

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

- `command`: абсолютний шлях до виконуваного файла. Пошук через оболонку не
  використовується.
- `args`: аргументи процесу. Розгортання оболонки, pipes, globbing або правила
  quoting не застосовуються.
- `cwd`: необов'язковий робочий каталог для процесу.
- `env`: необов'язкові змінні середовища, об'єднані поверх середовища процесу
  OpenClaw.
- `healthUrl`: URL готовності. Якщо пропущено, OpenClaw додає `/models` до
  `baseUrl`, тож `http://127.0.0.1:8000/v1` стає
  `http://127.0.0.1:8000/v1/models`.
- `readyTimeoutMs`: дедлайн готовності під час запуску. Типове значення:
  `120000`.
- `idleStopMs`: затримка завершення під час простою для процесів, запущених
  OpenClaw. `0` або пропущене значення залишає процес активним до виходу
  OpenClaw.

## Приклад Inferrs

Inferrs — це власний бекенд `/v1`, сумісний з OpenAI, тому той самий API
локального сервісу працює із записом провайдера `inferrs`.

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

Замініть `command` на результат `which inferrs` на машині, де працює OpenClaw.

## Приклад ds4

Повне налаштування, рекомендації щодо розміру контексту та команди перевірки
див. у [ds4](/uk/providers/ds4).

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

## Операційні примітки

- Один процес OpenClaw керує дочірнім процесом, який він запустив. Інший процес
  OpenClaw, який бачить той самий уже активний URL перевірки стану, повторно
  використає його без прийняття під керування.
- Запуск серіалізується для кожного набору команди й аргументів провайдера, тому
  паралельні запити не створюють дублікати серверів для тієї самої конфігурації.
- Активні потокові відповіді утримують lease; завершення під час простою чекає,
  доки обробку тіла відповіді буде завершено.
- Використовуйте `timeoutSeconds` для повільних локальних провайдерів, щоб
  холодні запуски й довгі генерації не впиралися в типовий таймаут запиту до
  моделі.
- Використовуйте явний `healthUrl`, якщо ваш сервер надає готовність не в
  `/v1/models`.

## Пов'язане

<CardGroup cols={2}>
  <Card title="Local models" href="/uk/gateway/local-models" icon="server">
    Налаштування локальних моделей, вибір провайдера та рекомендації з безпеки.
  </Card>
  <Card title="Inferrs" href="/uk/providers/inferrs" icon="cpu">
    Запускайте OpenClaw через локальний сервер inferrs, сумісний з OpenAI.
  </Card>
</CardGroup>
