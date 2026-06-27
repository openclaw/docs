---
read_when:
    - Ви хочете запускати OpenClaw із моделями з відкритим кодом через LM Studio
    - Ви хочете встановити й налаштувати LM Studio
summary: Запуск OpenClaw з LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-06-27T18:11:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 20dff6e3156edf0e840c5450999bc511ba168b23692494c9030bfb946936ae40
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio — зручний і водночас потужний застосунок для запуску моделей з відкритими вагами на власному обладнанні. Він дає змогу запускати моделі llama.cpp (GGUF) або MLX (Apple Silicon). Постачається як GUI-пакет або безголовий демон (`llmster`). Документацію щодо продукту й налаштування див. на [lmstudio.ai](https://lmstudio.ai/).

## Швидкий старт

1. Установіть LM Studio (настільний застосунок) або `llmster` (безголовий режим), а потім запустіть локальний сервер:

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. Запустіть сервер

Переконайтеся, що ви або запустили настільний застосунок, або запустили демон такою командою:

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

Якщо ви використовуєте застосунок, переконайтеся, що JIT увімкнено для плавної роботи. Докладніше див. у [посібнику LM Studio щодо JIT і TTL](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

3. Якщо автентифікацію LM Studio увімкнено, задайте `LM_API_TOKEN`:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

Якщо автентифікацію LM Studio вимкнено, під час інтерактивного налаштування OpenClaw можна залишити ключ API порожнім.

Докладніше про налаштування автентифікації LM Studio див. у [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication).

4. Запустіть початкове налаштування й виберіть `LM Studio`:

```bash
openclaw onboard
```

5. Під час початкового налаштування використайте запит `Default model`, щоб вибрати свою модель LM Studio.

Ви також можете задати або змінити її пізніше:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

Ключі моделей LM Studio мають формат `author/model-name` (наприклад, `qwen/qwen3.5-9b`). Посилання на моделі OpenClaw
додають на початок назву провайдера: `lmstudio/qwen/qwen3.5-9b`. Точний ключ для
моделі можна знайти, виконавши `curl http://localhost:1234/api/v1/models` і переглянувши поле `key`.

## Неінтерактивне початкове налаштування

Використовуйте неінтерактивне початкове налаштування, коли потрібно автоматизувати налаштування сценарієм (CI, підготовка середовища, віддалене початкове завантаження):

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

Для серверів LM Studio з автентифікацією передайте `--lmstudio-api-key` або задайте `LM_API_TOKEN`.
Для серверів LM Studio без автентифікації пропустіть ключ; OpenClaw зберігає локальну несекретну позначку.

`--custom-api-key` і далі підтримується для сумісності, але для LM Studio бажано використовувати `--lmstudio-api-key`.

Це записує `models.providers.lmstudio` і задає стандартну модель як
`lmstudio/<custom-model-id>`. Коли ви надаєте ключ API, налаштування також записує
профіль автентифікації `lmstudio:default`.

Інтерактивне налаштування може запитати необов’язкову бажану довжину контексту завантаження та застосовує її до виявлених моделей LM Studio, які зберігає в конфігурацію.
Конфігурація Plugin LM Studio довіряє налаштованій кінцевій точці LM Studio для запитів моделей, зокрема вузлам loopback, LAN і tailnet. Джерела metadata/link-local і далі потребують явного ввімкнення. Можна відмовитися, задавши `models.providers.lmstudio.request.allowPrivateNetwork: false`.

## Конфігурація

### Сумісність використання потокового передавання

LM Studio сумісна з використанням потокового передавання. Коли вона не видає об’єкт
`usage` у форматі OpenAI, OpenClaw натомість відновлює кількість токенів із метаданих у стилі llama.cpp:
`timings.prompt_n` / `timings.predicted_n`.

Така сама поведінка використання потокового передавання застосовується до цих локальних бекендів, сумісних з OpenAI:

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### Сумісність мислення

Коли виявлення LM Studio через `/api/v1/models` повідомляє специфічні для моделі
параметри reasoning, OpenClaw показує відповідні сумісні з OpenAI значення
`reasoning_effort` у метаданих сумісності моделі. Поточні збірки LM Studio можуть оголошувати бінарні
параметри UI, як-от `allowed_options: ["off", "on"]`, але відхиляти ці значення
на `/v1/chat/completions`; OpenClaw нормалізує таку бінарну форму виявлення до
`none`, `minimal`, `low`, `medium`, `high` і `xhigh` перед надсиланням запитів.
Старіша збережена конфігурація LM Studio, яка містить мапи reasoning `off`/`on`,
нормалізується так само під час завантаження каталогу.

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

Переконайтеся, що LM Studio запущено. Якщо автентифікацію увімкнено, також задайте `LM_API_TOKEN`:

```bash
# Start via desktop app, or headless:
lms server start --port 1234
```

Перевірте, що API доступний:

```bash
curl http://localhost:1234/api/v1/models
```

### Помилки автентифікації (HTTP 401)

Якщо налаштування повідомляє про HTTP 401, перевірте свій ключ API:

- Перевірте, що `LM_API_TOKEN` відповідає ключу, налаштованому в LM Studio.
- Докладніше про налаштування автентифікації LM Studio див. у [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication).
- Якщо ваш сервер не потребує автентифікації, залиште ключ порожнім під час налаштування.

### Завантаження моделі just-in-time

LM Studio підтримує завантаження моделей just-in-time (JIT), коли моделі завантажуються під час першого запиту. OpenClaw за замовчуванням попередньо завантажує моделі через нативну кінцеву точку завантаження LM Studio, що допомагає, коли JIT вимкнено. Щоб дозволити JIT, TTL простою та поведінці автоматичного витіснення LM Studio керувати життєвим циклом моделі, вимкніть крок попереднього завантаження OpenClaw:

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

### Хост LM Studio у LAN або tailnet

Використовуйте доступну адресу хоста LM Studio, збережіть `/v1` і переконайтеся, що LM Studio прив’язано не лише до loopback на цій машині:

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

`lmstudio` автоматично довіряє своїй налаштованій локальній/приватній кінцевій точці для захищених запитів моделей. Користувацькі/локальні записи провайдерів, сумісних з OpenAI, також довіряють точному налаштованому джерелу `baseUrl`, окрім джерел metadata/link-local; запити до інших приватних портів або призначень і далі потребують `models.providers.<id>.request.allowPrivateNetwork: true`. Задайте `models.providers.<id>.request.allowPrivateNetwork: false`, щоб відмовитися від довіри до точного джерела.

## Пов’язане

- [Вибір моделі](/uk/concepts/model-providers)
- [Ollama](/uk/providers/ollama)
- [Локальні моделі](/uk/gateway/local-models)
