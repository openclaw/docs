---
read_when:
    - Ви хочете запускати OpenClaw з моделями з відкритим кодом через LM Studio
    - Ви хочете налаштувати та сконфігурувати LM Studio
summary: Запустіть OpenClaw з LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-04-27T08:09:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 98edefa8b57ab2a89d1c4405827335a421c3157f51c5d23ac5f83c1cbeab20a9
    source_path: providers/lmstudio.md
    workflow: 15
---

LM Studio — це зручна, але водночас потужна програма для запуску моделей з відкритими вагами на власному обладнанні. Вона дає змогу запускати моделі llama.cpp (GGUF) або MLX (Apple Silicon). Доступна як GUI-застосунок або headless-демон (`llmster`). Документацію про продукт і налаштування див. на [lmstudio.ai](https://lmstudio.ai/).

## Швидкий старт

1. Установіть LM Studio (desktop) або `llmster` (headless), а потім запустіть локальний сервер:

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. Запустіть сервер

Переконайтеся, що ви або запускаєте desktop-застосунок, або запускаєте демон такою командою:

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

Якщо ви використовуєте застосунок, переконайтеся, що у вас увімкнено JIT для комфортної роботи. Докладніше див. у [посібнику LM Studio про JIT і TTL](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

3. Якщо в LM Studio увімкнено автентифікацію, установіть `LM_API_TOKEN`:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

Якщо автентифікацію LM Studio вимкнено, під час інтерактивного налаштування OpenClaw можна залишити API-ключ порожнім.

Докладніше про налаштування автентифікації LM Studio див. у [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication).

4. Запустіть початкове налаштування та виберіть `LM Studio`:

```bash
openclaw onboard
```

5. Під час початкового налаштування використайте запит `Default model`, щоб вибрати вашу модель LM Studio.

Ви також можете встановити або змінити її пізніше:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

Ключі моделей LM Studio мають формат `author/model-name` (наприклад, `qwen/qwen3.5-9b`). OpenClaw
додає до посилань на моделі префікс назви провайдера: `lmstudio/qwen/qwen3.5-9b`. Точний ключ
моделі можна знайти, виконавши `curl http://localhost:1234/api/v1/models` і переглянувши поле `key`.

## Неінтерактивне початкове налаштування

Використовуйте неінтерактивне початкове налаштування, якщо хочете автоматизувати встановлення (CI, підготовка, віддалений bootstrap):

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

Або вкажіть базову URL-адресу, модель і необов’язковий API-ключ:

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

`--custom-api-key` і надалі підтримується для сумісності, але для LM Studio бажано використовувати `--lmstudio-api-key`.

Це записує `models.providers.lmstudio` і встановлює типовою модель
`lmstudio/<custom-model-id>`. Якщо ви надаєте API-ключ, налаштування також записує
профіль автентифікації `lmstudio:default`.

Інтерактивне налаштування може запропонувати вказати необов’язкову бажану довжину контексту завантаження та застосовує її до виявлених моделей LM Studio, які зберігає в конфігурації.
Конфігурація plugin LM Studio довіряє налаштованій кінцевій точці LM Studio для запитів моделей, зокрема на хостах loopback, LAN і tailnet. Ви можете відмовитися від цього, встановивши `models.providers.lmstudio.request.allowPrivateNetwork: false`.

## Конфігурація

### Сумісність із використанням потокової передачі

LM Studio сумісний із використанням потокової передачі. Якщо він не повертає
об’єкт `usage` у форматі OpenAI, OpenClaw відновлює кількість токенів із метаданих
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

## Усунення несправностей

### LM Studio не виявлено

Переконайтеся, що LM Studio запущено. Якщо автентифікацію увімкнено, також установіть `LM_API_TOKEN`:

```bash
# Запуск через desktop-застосунок або в headless-режимі:
lms server start --port 1234
```

Переконайтеся, що API доступне:

```bash
curl http://localhost:1234/api/v1/models
```

### Помилки автентифікації (HTTP 401)

Якщо під час налаштування повідомляється про HTTP 401, перевірте ваш API-ключ:

- Переконайтеся, що `LM_API_TOKEN` збігається з ключем, налаштованим у LM Studio.
- Докладніше про налаштування автентифікації LM Studio див. у [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication).
- Якщо ваш сервер не вимагає автентифікації, залиште ключ порожнім під час налаштування.

### Завантаження моделі just-in-time

LM Studio підтримує завантаження моделей just-in-time (JIT), коли моделі завантажуються під час першого запиту. Переконайтеся, що цю функцію увімкнено, щоб уникнути помилок на кшталт "Model not loaded".

### Хост LM Studio у LAN або tailnet

Використовуйте досяжну адресу хоста LM Studio, зберігайте `/v1` і переконайтеся, що LM Studio на цій машині прив’язано не лише до loopback:

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

На відміну від загальних провайдерів, сумісних з OpenAI, `lmstudio` автоматично довіряє своїй налаштованій локальній/приватній кінцевій точці для захищених запитів моделей. Якщо ви використовуєте власний ідентифікатор провайдера замість `lmstudio`, явно встановіть `models.providers.<id>.request.allowPrivateNetwork: true`.

## Пов’язані матеріали

- [Вибір моделі](/uk/concepts/model-providers)
- [Ollama](/uk/providers/ollama)
- [Локальні моделі](/uk/gateway/local-models)
