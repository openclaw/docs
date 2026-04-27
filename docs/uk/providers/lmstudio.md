---
read_when:
    - Ви хочете запускати OpenClaw з моделями з відкритим кодом через LM Studio
    - Ви хочете налаштувати та сконфігурувати LM Studio
summary: Запустіть OpenClaw за допомогою LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-04-27T07:19:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0077108b7ab3171084f89234e25f5f5e8b68239a6fa6c11fa70c65f52d56670f
    source_path: providers/lmstudio.md
    workflow: 15
---

LM Studio — це дружній, але водночас потужний застосунок для запуску моделей з відкритими вагами на вашому власному обладнанні. Він дає змогу запускати моделі llama.cpp (GGUF) або MLX (Apple Silicon). Доступний як GUI-пакет або безголовий демон (`llmster`). Докладніше про продукт і налаштування дивіться в [lmstudio.ai](https://lmstudio.ai/).

## Швидкий старт

1. Установіть LM Studio (desktop) або `llmster` (headless), а потім запустіть локальний сервер:

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. Запустіть сервер

Переконайтеся, що ви або запустили desktop-застосунок, або запустили демон за допомогою такої команди:

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

Якщо ви використовуєте застосунок, переконайтеся, що у вас увімкнено JIT для комфортної роботи. Докладніше в [посібнику LM Studio щодо JIT і TTL](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

3. Якщо в LM Studio увімкнено автентифікацію, установіть `LM_API_TOKEN`:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

Якщо автентифікацію LM Studio вимкнено, під час інтерактивного налаштування OpenClaw можна залишити ключ API порожнім.

Докладніше про налаштування автентифікації LM Studio дивіться в [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication).

4. Запустіть початкове налаштування й виберіть `LM Studio`:

```bash
openclaw onboard
```

5. Під час початкового налаштування використайте запит `Default model`, щоб вибрати свою модель LM Studio.

Також ви можете встановити або змінити її пізніше:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

Ключі моделей LM Studio мають формат `author/model-name` (наприклад, `qwen/qwen3.5-9b`). У OpenClaw
посилання на моделі додають префікс провайдера: `lmstudio/qwen/qwen3.5-9b`. Точний ключ
моделі можна знайти, виконавши `curl http://localhost:1234/api/v1/models` і переглянувши поле `key`.

## Неінтерактивне початкове налаштування

Використовуйте неінтерактивне початкове налаштування, якщо хочете автоматизувати налаштування (CI, підготовка середовища, віддалений bootstrap):

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

`--custom-model-id` приймає ключ моделі, який повертає LM Studio (наприклад, `qwen/qwen3.5-9b`), без
префікса провайдера `lmstudio/`.

Для автентифікованих серверів LM Studio передайте `--lmstudio-api-key` або встановіть `LM_API_TOKEN`.
Для серверів LM Studio без автентифікації не вказуйте ключ; OpenClaw збереже локальний несекретний маркер.

`--custom-api-key` і надалі підтримується для сумісності, але для LM Studio рекомендовано `--lmstudio-api-key`.

Це записує `models.providers.lmstudio` і встановлює типову модель на
`lmstudio/<custom-model-id>`. Якщо ви надаєте ключ API, налаштування також записує
профіль автентифікації `lmstudio:default`.

Інтерактивне налаштування може запропонувати вказати необов’язкову бажану довжину контексту завантаження та застосовує її до виявлених моделей LM Studio, які зберігає в конфігурації.

## Конфігурація

### Сумісність із використанням streaming

LM Studio сумісний із використанням streaming. Якщо він не повертає об’єкт
`usage` у форматі OpenAI, OpenClaw відновлює кількість токенів із метаданих
`timings.prompt_n` / `timings.predicted_n` у стилі llama.cpp.

Така сама поведінка застосовується до цих локальних бекендів, сумісних з OpenAI:

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

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

### LM Studio не виявлено

Переконайтеся, що LM Studio запущено. Якщо автентифікацію ввімкнено, також установіть `LM_API_TOKEN`:

```bash
# Запуск через desktop-застосунок або в headless-режимі:
lms server start --port 1234
```

Перевірте, що API доступний:

```bash
curl http://localhost:1234/api/v1/models
```

### Помилки автентифікації (HTTP 401)

Якщо під час налаштування повідомляється про HTTP 401, перевірте свій ключ API:

- Переконайтеся, що `LM_API_TOKEN` збігається з ключем, налаштованим у LM Studio.
- Докладніше про налаштування автентифікації LM Studio дивіться в [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication).
- Якщо ваш сервер не вимагає автентифікації, залиште ключ порожнім під час налаштування.

### Завантаження моделі just-in-time

LM Studio підтримує завантаження моделей just-in-time (JIT), коли моделі завантажуються під час першого запиту. Переконайтеся, що це ввімкнено, щоб уникнути помилок «Model not loaded».

## Пов’язане

- [Вибір моделі](/uk/concepts/model-providers)
- [Ollama](/uk/providers/ollama)
- [Локальні моделі](/uk/gateway/local-models)
