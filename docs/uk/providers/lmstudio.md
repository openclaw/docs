---
read_when:
    - Ви хочете запускати OpenClaw з моделями з відкритим кодом через LM Studio
    - Ви хочете налаштувати й сконфігурувати LM Studio
summary: Запуск OpenClaw з LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-04-23T07:26:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 062b26cf10631e74f4e1917ea9011133eb4433f5fb7ee85748d00080a6ca212d
    source_path: providers/lmstudio.md
    workflow: 15
---

# LM Studio

LM Studio — це зручний, але водночас потужний застосунок для запуску моделей з відкритими вагами на вашому власному обладнанні. Він дає змогу запускати моделі llama.cpp (GGUF) або MLX (Apple Silicon). Доступний як GUI-пакет або безголовий демон (`llmster`). Документацію про продукт і налаштування див. на [lmstudio.ai](https://lmstudio.ai/).

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

Якщо ви використовуєте застосунок, переконайтеся, що JIT увімкнено для плавної роботи. Докладніше див. у [посібнику LM Studio JIT and TTL](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

3. OpenClaw потребує значення токена LM Studio. Установіть `LM_API_TOKEN`:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

Якщо автентифікацію LM Studio вимкнено, використовуйте будь-яке непорожнє значення токена:

```bash
export LM_API_TOKEN="placeholder-key"
```

Докладніше про налаштування автентифікації LM Studio див. у [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication).

4. Запустіть онбординг і виберіть `LM Studio`:

```bash
openclaw onboard
```

5. Під час онбордингу використайте запит `Default model`, щоб вибрати вашу модель LM Studio.

Ви також можете встановити або змінити її пізніше:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

Ключі моделей LM Studio мають формат `author/model-name` (наприклад, `qwen/qwen3.5-9b`). У OpenClaw посилання на моделі додають префікс імені провайдера: `lmstudio/qwen/qwen3.5-9b`. Точний ключ моделі можна знайти, виконавши `curl http://localhost:1234/api/v1/models` і переглянувши поле `key`.

## Неінтерактивний онбординг

Використовуйте неінтерактивний онбординг, якщо хочете автоматизувати налаштування (CI, provisionування, віддалений bootstrap):

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

Або вкажіть базовий URL чи модель разом з API-ключем:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` приймає ключ моделі, який повертає LM Studio (наприклад, `qwen/qwen3.5-9b`), без префікса провайдера `lmstudio/`.

Неінтерактивний онбординг потребує `--lmstudio-api-key` (або `LM_API_TOKEN` у змінних середовища).
Для серверів LM Studio без автентифікації підійде будь-яке непорожнє значення токена.

`--custom-api-key` і далі підтримується для сумісності, але для LM Studio бажано використовувати `--lmstudio-api-key`.

Це записує `models.providers.lmstudio`, встановлює типову модель як
`lmstudio/<custom-model-id>` і записує профіль автентифікації `lmstudio:default`.

Інтерактивне налаштування може запропонувати необов’язкову бажану довжину контексту завантаження й застосовує її до виявлених моделей LM Studio, які зберігає в конфігурації.

## Конфігурація

### Сумісність із потоковим використанням

LM Studio сумісний із потоковим використанням. Коли він не повертає об’єкт
`usage` у форматі OpenAI, OpenClaw відновлює кількість токенів із метаданих у стилі llama.cpp:
`timings.prompt_n` / `timings.predicted_n`.

Така сама поведінка застосовується до таких сумісних з OpenAI локальних бекендів:

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

Переконайтеся, що LM Studio запущено і що ви встановили `LM_API_TOKEN` (для серверів без автентифікації підійде будь-яке непорожнє значення токена):

```bash
# Запуск через desktop-застосунок або в headless-режимі:
lms server start --port 1234
```

Перевірте, що API доступний:

```bash
curl http://localhost:1234/api/v1/models
```

### Помилки автентифікації (HTTP 401)

Якщо під час налаштування з’являється HTTP 401, перевірте ваш API-ключ:

- Переконайтеся, що `LM_API_TOKEN` збігається з ключем, налаштованим у LM Studio.
- Докладніше про налаштування автентифікації LM Studio див. у [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication).
- Якщо ваш сервер не потребує автентифікації, використовуйте будь-яке непорожнє значення токена для `LM_API_TOKEN`.

### Миттєве завантаження моделей

LM Studio підтримує миттєве завантаження моделей (JIT), коли моделі завантажуються під час першого запиту. Переконайтеся, що це ввімкнено, щоб уникнути помилок на кшталт 'Model not loaded'.
