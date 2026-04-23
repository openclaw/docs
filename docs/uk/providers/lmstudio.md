---
read_when:
    - Ви хочете запускати OpenClaw з open source models через LM Studio
    - Ви хочете налаштувати й сконфігурувати LM Studio
summary: Запустити OpenClaw з LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-04-23T21:06:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: c4974e5255af5d521a7f4884b6b0735ddca55c235567709b5946e5a3f72b14e3
    source_path: providers/lmstudio.md
    workflow: 15
---

LM Studio — це дружній, але потужний застосунок для запуску моделей з відкритими вагами на власному обладнанні. Він дає змогу запускати моделі llama.cpp (GGUF) або MLX (Apple Silicon). Доступний як GUI-застосунок або headless-демон (`llmster`). Докладніше про продукт і налаштування див. на [lmstudio.ai](https://lmstudio.ai/).

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

Якщо ви використовуєте застосунок, переконайтеся, що JIT увімкнено для плавної роботи. Докладніше — у [посібнику LM Studio JIT and TTL guide](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

3. OpenClaw потребує значення токена LM Studio. Задайте `LM_API_TOKEN`:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

Якщо автентифікацію LM Studio вимкнено, використовуйте будь-яке непорожнє значення токена:

```bash
export LM_API_TOKEN="placeholder-key"
```

Докладніше про налаштування auth у LM Studio див. в [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication).

4. Запустіть onboarding і виберіть `LM Studio`:

```bash
openclaw onboard
```

5. Під час onboarding використайте запит `Default model`, щоб вибрати модель LM Studio.

Ви також можете задати або змінити її пізніше:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

Ключі моделей LM Studio мають формат `author/model-name` (наприклад, `qwen/qwen3.5-9b`). Посилання на моделі в OpenClaw
мають префікс імені провайдера: `lmstudio/qwen/qwen3.5-9b`. Точний ключ моделі
можна знайти, виконавши `curl http://localhost:1234/api/v1/models` і подивившись на поле `key`.

## Неінтерактивний onboarding

Використовуйте неінтерактивний onboarding, коли хочете автоматизувати налаштування (CI, provisioning, remote bootstrap):

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

Або вкажіть base URL або модель разом з API-ключем:

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

Неінтерактивний onboarding потребує `--lmstudio-api-key` (або `LM_API_TOKEN` у env).
Для серверів LM Studio без auth підійде будь-яке непорожнє значення токена.

`--custom-api-key` і далі підтримується для сумісності, але для LM Studio краще використовувати `--lmstudio-api-key`.

Це записує `models.providers.lmstudio`, встановлює типову модель на
`lmstudio/<custom-model-id>` і записує auth profile `lmstudio:default`.

Під час інтерактивного налаштування може з’явитися запит на необов’язкову бажану довжину контексту завантаження; вона застосовується до виявлених моделей LM Studio, які зберігаються в config.

## Конфігурація

### Сумісність потокового usage

LM Studio сумісний із потоковим usage. Коли він не видає usage-об’єкт
у форматі OpenAI, OpenClaw відновлює кількість токенів із метаданих
у стилі llama.cpp `timings.prompt_n` / `timings.predicted_n`.

Така сама поведінка застосовується до цих локальних backend, сумісних з OpenAI:

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

### LM Studio не виявляється

Переконайтеся, що LM Studio працює і що ви задали `LM_API_TOKEN` (для серверів без auth підійде будь-яке непорожнє значення токена):

```bash
# Start via desktop app, or headless:
lms server start --port 1234
```

Перевірте, чи API доступне:

```bash
curl http://localhost:1234/api/v1/models
```

### Помилки автентифікації (HTTP 401)

Якщо під час налаштування з’являється HTTP 401, перевірте свій API-ключ:

- Переконайтеся, що `LM_API_TOKEN` збігається з ключем, налаштованим у LM Studio.
- Докладніше про налаштування auth у LM Studio див. в [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication).
- Якщо ваш сервер не потребує автентифікації, використовуйте будь-яке непорожнє значення токена для `LM_API_TOKEN`.

### Завантаження моделі just-in-time

LM Studio підтримує just-in-time (JIT) завантаження моделей, коли модель завантажується при першому запиті. Переконайтеся, що цю можливість увімкнено, щоб уникнути помилок на кшталт 'Model not loaded'.
