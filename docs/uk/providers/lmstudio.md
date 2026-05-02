---
read_when:
    - Ви хочете запускати OpenClaw з моделями з відкритим кодом через LM Studio
    - Ви хочете встановити й налаштувати LM Studio
summary: Запуск OpenClaw з LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-05-02T05:17:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3971bc471e5d8b0f142394b7b1897f8fdb2be283082245fbb2cf744d06143292
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio — дружній, але потужний застосунок для запуску моделей з відкритими вагами на власному обладнанні. Він дає змогу запускати моделі llama.cpp (GGUF) або MLX (Apple Silicon). Постачається як GUI-пакет або headless daemon (`llmster`). Документацію щодо продукту й налаштування див. на [lmstudio.ai](https://lmstudio.ai/).

## Швидкий старт

1. Встановіть LM Studio (desktop) або `llmster` (headless), а потім запустіть локальний сервер:

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. Запустіть сервер

Переконайтеся, що ви або запускаєте desktop-застосунок, або запускаєте daemon за допомогою такої команди:

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

Якщо ви використовуєте застосунок, переконайтеся, що JIT увімкнено для плавної роботи. Докладніше див. у [посібнику LM Studio з JIT і TTL](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

3. Якщо автентифікацію LM Studio увімкнено, задайте `LM_API_TOKEN`:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

Якщо автентифікацію LM Studio вимкнено, під час інтерактивного налаштування OpenClaw можна залишити ключ API порожнім.

Докладніше про налаштування автентифікації LM Studio див. у [автентифікації LM Studio](https://lmstudio.ai/docs/developer/core/authentication).

4. Запустіть onboarding і виберіть `LM Studio`:

```bash
openclaw onboard
```

5. В onboarding скористайтеся запитом `Default model`, щоб вибрати свою модель LM Studio.

Також можна встановити або змінити її пізніше:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

Ключі моделей LM Studio мають формат `author/model-name` (наприклад, `qwen/qwen3.5-9b`). Посилання на моделі OpenClaw
додають на початок назву провайдера: `lmstudio/qwen/qwen3.5-9b`. Точний ключ
моделі можна знайти, виконавши `curl http://localhost:1234/api/v1/models` і переглянувши поле `key`.

## Неінтерактивний onboarding

Використовуйте неінтерактивний onboarding, коли потрібно скриптувати налаштування (CI, provisioning, віддалений bootstrap):

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

Або вкажіть базову URL-адресу, модель і необов’язковий ключ API:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` приймає ключ моделі у форматі, який повертає LM Studio (наприклад, `qwen/qwen3.5-9b`), без
префікса провайдера `lmstudio/`.

Для серверів LM Studio з автентифікацією передайте `--lmstudio-api-key` або задайте `LM_API_TOKEN`.
Для серверів LM Studio без автентифікації пропустіть ключ; OpenClaw зберігає локальний несекретний маркер.

`--custom-api-key` і надалі підтримується для сумісності, але для LM Studio бажано використовувати `--lmstudio-api-key`.

Це записує `models.providers.lmstudio` і задає модель за замовчуванням як
`lmstudio/<custom-model-id>`. Коли ви надаєте ключ API, налаштування також записує
профіль автентифікації `lmstudio:default`.

Інтерактивне налаштування може запитати необов’язкову бажану довжину контексту завантаження та застосовує її до виявлених моделей LM Studio, які зберігає в конфігурації.
Конфігурація Plugin LM Studio довіряє налаштованому endpoint LM Studio для запитів моделей, зокрема loopback, LAN і tailnet hosts. Ви можете відмовитися від цього, задавши `models.providers.lmstudio.request.allowPrivateNetwork: false`.

## Конфігурація

### Сумісність використання streaming

LM Studio сумісний із streaming usage. Коли він не видає об’єкт
`usage` у форматі OpenAI, OpenClaw натомість відновлює лічильники токенів із метаданих
`timings.prompt_n` / `timings.predicted_n` у стилі llama.cpp.

Така сама поведінка streaming usage застосовується до цих OpenAI-сумісних локальних backend:

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### Сумісність thinking

Коли discovery LM Studio `/api/v1/models` повідомляє специфічні для моделі
параметри reasoning, OpenClaw зберігає ці нативні значення в метаданих сумісності моделі. Для
бінарних thinking-моделей, які оголошують `allowed_options: ["off", "on"]`,
OpenClaw зіставляє вимкнене thinking із `off`, а ввімкнені рівні `/think` — з `on`
замість надсилання значень лише для OpenAI, як-от `low` або `medium`.

### Явна конфігурація

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        models: [
          {
            id: "qwen/qwen3-coder-next",
            name: "Qwen 3 Coder Next",
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

## Усунення несправностей

### LM Studio не виявлено

Переконайтеся, що LM Studio запущено. Якщо автентифікацію ввімкнено, також задайте `LM_API_TOKEN`:

```bash
# Start via desktop app, or headless:
lms server start --port 1234
```

Перевірте, що API доступний:

```bash
curl http://localhost:1234/api/v1/models
```

### Помилки автентифікації (HTTP 401)

Якщо налаштування повідомляє про HTTP 401, перевірте ключ API:

- Перевірте, що `LM_API_TOKEN` збігається з ключем, налаштованим у LM Studio.
- Докладніше про налаштування автентифікації LM Studio див. у [автентифікації LM Studio](https://lmstudio.ai/docs/developer/core/authentication).
- Якщо ваш сервер не потребує автентифікації, залиште ключ порожнім під час налаштування.

### Just-in-time завантаження моделей

LM Studio підтримує just-in-time (JIT) завантаження моделей, коли моделі завантажуються під час першого запиту. OpenClaw за замовчуванням попередньо завантажує моделі через нативний endpoint завантаження LM Studio, що допомагає, коли JIT вимкнено. Щоб дозволити JIT, idle TTL і auto-evict поведінці LM Studio керувати життєвим циклом моделі, вимкніть крок попереднього завантаження OpenClaw:

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        api: "openai-completions",
        params: { preload: false },
        models: [{ id: "qwen/qwen3.5-9b" }],
      },
    },
  },
}
```

### LAN або tailnet хост LM Studio

Використовуйте доступну адресу хоста LM Studio, зберігайте `/v1` і переконайтеся, що LM Studio на цій машині прив’язано не лише до loopback:

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://gpu-box.local:1234/v1",
        apiKey: "lmstudio",
        api: "openai-completions",
        models: [{ id: "qwen/qwen3.5-9b" }],
      },
    },
  },
}
```

На відміну від generic OpenAI-compatible провайдерів, `lmstudio` автоматично довіряє своєму налаштованому локальному/приватному endpoint для захищених запитів моделей. Користувацькі ID loopback-провайдерів, як-от `localhost` або `127.0.0.1`, також автоматично вважаються довіреними; для LAN, tailnet або private DNS користувацьких ID провайдерів явно задайте `models.providers.<id>.request.allowPrivateNetwork: true`.

## Пов’язане

- [Вибір моделі](/uk/concepts/model-providers)
- [Ollama](/uk/providers/ollama)
- [Локальні моделі](/uk/gateway/local-models)
