---
read_when:
    - Ви хочете запускати OpenClaw з open source моделями через LM Studio
    - Ви хочете налаштувати й сконфігурувати LM Studio
summary: Запуск OpenClaw з LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-04-27T12:54:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe6d1feadf355579b244ab4187a8d3b8bad661a5605aed906eedf361d6fcae3f
    source_path: providers/lmstudio.md
    workflow: 15
---

LM Studio — це зручний, але потужний застосунок для запуску open-weight моделей на власному обладнанні. Він дає змогу запускати моделі llama.cpp (GGUF) або MLX (Apple Silicon). Доступний як GUI-пакет або headless daemon (`llmster`). Документацію про продукт і налаштування див. на [lmstudio.ai](https://lmstudio.ai/).

## Швидкий старт

1. Встановіть LM Studio (desktop) або `llmster` (headless), а потім запустіть локальний сервер:

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. Запустіть сервер

Переконайтеся, що ви або запускаєте desktop-застосунок, або запускаєте daemon такою командою:

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

Якщо ви використовуєте застосунок, переконайтеся, що у вас увімкнено JIT для комфортної роботи. Докладніше див. у [посібнику LM Studio JIT and TTL](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

3. Якщо в LM Studio увімкнено автентифікацію, задайте `LM_API_TOKEN`:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

Якщо автентифікацію LM Studio вимкнено, під час інтерактивного налаштування OpenClaw можна залишити API key порожнім.

Докладніше про налаштування auth у LM Studio див. у [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication).

4. Запустіть onboarding і виберіть `LM Studio`:

```bash
openclaw onboard
```

5. Під час onboarding використайте запит `Default model`, щоб вибрати свою модель LM Studio.

Ви також можете задати або змінити її пізніше:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

Ключі моделей LM Studio використовують формат `author/model-name` (наприклад, `qwen/qwen3.5-9b`). Посилання на моделі OpenClaw
додають префікс імені провайдера: `lmstudio/qwen/qwen3.5-9b`. Точний ключ моделі
можна знайти, виконавши `curl http://localhost:1234/api/v1/models` і подивившись на поле `key`.

## Неінтерактивний onboarding

Використовуйте неінтерактивний onboarding, коли хочете автоматизувати налаштування (CI, provisioning, remote bootstrap):

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

Або вкажіть base URL, модель і необов’язковий API key:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` приймає ключ моделі, який повертає LM Studio (наприклад, `qwen/qwen3.5-9b`), без
префікса провайдера `lmstudio/`.

Для автентифікованих серверів LM Studio передайте `--lmstudio-api-key` або задайте `LM_API_TOKEN`.
Для серверів LM Studio без автентифікації не передавайте ключ; OpenClaw збереже локальний несекретний маркер.

`--custom-api-key` і далі підтримується для сумісності, але для LM Studio краще використовувати `--lmstudio-api-key`.

Це записує `models.providers.lmstudio` і задає модель за замовчуванням як
`lmstudio/<custom-model-id>`. Якщо ви надаєте API key, налаштування також записує
профіль auth `lmstudio:default`.

Інтерактивне налаштування може запропонувати необов’язкову бажану довжину контексту завантаження та застосовує її до виявлених моделей LM Studio, які воно зберігає в конфігурації.
Конфігурація Plugin LM Studio довіряє налаштованому endpoint LM Studio для запитів моделей, включно з хостами loopback, LAN і tailnet. Ви можете відмовитися від цього, задавши `models.providers.lmstudio.request.allowPrivateNetwork: false`.

## Конфігурація

### Сумісність із використанням потокової передачі

LM Studio сумісний із streaming usage. Коли він не надсилає об’єкт
`usage` у форматі OpenAI, OpenClaw відновлює підрахунок токенів із метаданих у стилі llama.cpp
`timings.prompt_n` / `timings.predicted_n`.

Така сама поведінка streaming usage застосовується до цих локальних backend, сумісних з OpenAI:

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### Сумісність thinking

Коли виявлення `/api/v1/models` у LM Studio повідомляє
специфічні для моделі параметри reasoning, OpenClaw зберігає ці нативні значення в метаданих сумісності моделі. Для
бінарних моделей thinking, які оголошують `allowed_options: ["off", "on"]`,
OpenClaw зіставляє вимкнене thinking з `off`, а ввімкнені рівні `/think` з `on`
замість надсилання значень, специфічних лише для OpenAI, таких як `low` або `medium`.

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

## Усунення проблем

### LM Studio не виявляється

Переконайтеся, що LM Studio запущено. Якщо автентифікацію ввімкнено, також задайте `LM_API_TOKEN`:

```bash
# Запуск через desktop-застосунок або в headless-режимі:
lms server start --port 1234
```

Перевірте, що API доступний:

```bash
curl http://localhost:1234/api/v1/models
```

### Помилки автентифікації (HTTP 401)

Якщо налаштування повідомляє про HTTP 401, перевірте свій API key:

- Переконайтеся, що `LM_API_TOKEN` збігається з ключем, налаштованим у LM Studio.
- Докладніше про налаштування auth у LM Studio див. у [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication).
- Якщо ваш сервер не вимагає автентифікації, залиште ключ порожнім під час налаштування.

### Завантаження моделей just-in-time

LM Studio підтримує завантаження моделей just-in-time (JIT), коли моделі завантажуються під час першого запиту. Переконайтеся, що це ввімкнено, щоб уникнути помилок "Model not loaded".

### Хост LM Studio у LAN або tailnet

Використовуйте доступну адресу хоста LM Studio, збережіть `/v1` і переконайтеся, що LM Studio на тій машині прив’язано не лише до loopback:

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

На відміну від загальних провайдерів, сумісних з OpenAI, `lmstudio` автоматично довіряє своєму налаштованому локальному/приватному endpoint для захищених запитів моделей. Власні ID провайдерів loopback, такі як `localhost` або `127.0.0.1`, також автоматично вважаються довіреними; для власних ID провайдерів у LAN, tailnet або приватному DNS явно задайте `models.providers.<id>.request.allowPrivateNetwork: true`.

## Пов’язані теми

- [Вибір моделі](/uk/concepts/model-providers)
- [Ollama](/uk/providers/ollama)
- [Локальні моделі](/uk/gateway/local-models)
