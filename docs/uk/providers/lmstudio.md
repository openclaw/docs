---
read_when:
    - Ви хочете запускати OpenClaw із моделями з відкритим кодом через LM Studio
    - Ви хочете встановити й налаштувати LM Studio
summary: Запуск OpenClaw із LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-07-12T13:42:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b4223f90e786e285651fc889985dd61124c60758b4e9c3599d76201d9ac20b46
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio запускає моделі llama.cpp (GGUF) або MLX локально — як застосунок із графічним інтерфейсом або фоновий демон `llmster`. Інструкції зі встановлення та документацію продукту див. на [lmstudio.ai](https://lmstudio.ai/).

## Швидкий початок

<Steps>
  <Step title="Установіть і запустіть сервер">
    Установіть LM Studio (настільну версію) або `llmster` (без графічного інтерфейсу), а потім запустіть сервер:

    ```bash
    lms server start --port 1234
    ```

    Або запустіть фоновий демон:

    ```bash
    lms daemon up
    ```

    Якщо ви використовуєте настільний застосунок, увімкніть JIT для плавного завантаження моделей; див.
    [посібник LM Studio щодо JIT і TTL](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

  </Step>
  <Step title="Задайте ключ API, якщо автентифікацію ввімкнено">
    ```bash
    export LM_API_TOKEN="your-lm-studio-api-token"
    ```

    Якщо автентифікацію LM Studio вимкнено, залиште ключ API порожнім під час налаштування. Див.
    [Автентифікація LM Studio](https://lmstudio.ai/docs/developer/core/authentication).

  </Step>
  <Step title="Запустіть початкове налаштування">
    ```bash
    openclaw onboard
    ```

    Виберіть `LM Studio`, а потім модель у запиті `Default model`.

  </Step>
</Steps>

Щоб змінити модель за замовчуванням пізніше:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

Ключі моделей LM Studio мають формат `author/model-name` (наприклад, `qwen/qwen3.5-9b`); у посиланнях на моделі OpenClaw
перед ними додається постачальник: `lmstudio/qwen/qwen3.5-9b`. Щоб знайти точний ключ моделі, виконайте
наведену нижче команду й перегляньте поле `key`:

```bash
curl http://localhost:1234/api/v1/models
```

## Неінтерактивне початкове налаштування

```bash
openclaw onboard --non-interactive --accept-risk --auth-choice lmstudio
```

Або явно вкажіть базову URL-адресу, модель і ключ API:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` приймає ключ моделі, повернутий LM Studio (наприклад, `qwen/qwen3.5-9b`), без
префікса постачальника `lmstudio/`. Передайте `--lmstudio-api-key` (або задайте `LM_API_TOKEN`) для серверів
з автентифікацією; не вказуйте його для серверів без автентифікації — натомість OpenClaw збереже локальний маркер, що не є секретом.
`--custom-api-key` усе ще підтримується для сумісності, але перевагу слід надавати `--lmstudio-api-key`.

Ця команда записує `models.providers.lmstudio` і встановлює модель за замовчуванням як `lmstudio/<custom-model-id>`.
Якщо надати ключ API, також буде записано профіль автентифікації `lmstudio:default`.

Під час інтерактивного налаштування система також може запропонувати вибрати бажану довжину контексту завантаження та застосувати її до
виявлених моделей, які вона збереже в конфігурації.

## Конфігурація

### Сумісність використання під час потокового передавання

LM Studio не завжди додає об’єкт `usage` у форматі OpenAI до потокових відповідей. Натомість OpenClaw
відновлює кількість токенів із метаданих `timings.prompt_n` / `timings.predicted_n` у стилі llama.cpp.
Такий самий резервний механізм застосовується до будь-якої сумісної з OpenAI кінцевої точки, визначеної як локальна
(вузол local loopback). Це також охоплює інші локальні серверні системи, зокрема vLLM, SGLang, llama.cpp, LocalAI, Jan, TabbyAPI
і text-generation-webui.

### Сумісність міркування

Коли виявлення через `/api/v1/models` у LM Studio повідомляє про параметри міркування для конкретної моделі, OpenClaw
надає відповідні значення `reasoning_effort` (`none`, `minimal`, `low`, `medium`, `high`, `xhigh`) у
метаданих сумісності моделі. Деякі збірки LM Studio пропонують двійковий параметр інтерфейсу (`allowed_options: ["off",
"on"]`), але відхиляють ці буквальні значення в `/v1/chat/completions`; OpenClaw нормалізує
цю двійкову форму до шестирівневої шкали перед надсиланням запитів, зокрема для старіших збережених конфігурацій, які
досі містять зіставлення міркування `off`/`on`.

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

### Вимкнення попереднього завантаження

LM Studio підтримує завантаження моделей точно вчасно (JIT), тобто під час першого запиту. За замовчуванням OpenClaw
попередньо завантажує моделі через вбудовану кінцеву точку завантаження LM Studio, що корисно, коли JIT
вимкнено. Щоб керування життєвим циклом моделей натомість здійснювали JIT, TTL простою та автоматичне вивантаження LM Studio,
вимкніть етап попереднього завантаження OpenClaw:

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

### Вузол у LAN або tailnet

Використовуйте доступну адресу вузла LM Studio, збережіть `/v1` і переконайтеся, що LM Studio на цьому комп’ютері
прив’язано не лише до local loopback:

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

`lmstudio` автоматично вважає налаштовану кінцеву точку довіреною для запитів до моделей, зокрема для вузлів
local loopback, LAN і tailnet (крім джерел метаданих і link-local). Будь-який запис спеціального або локального
постачальника, сумісного з OpenAI, отримує таку саму довіру до точного джерела. Для запитів до іншого приватного вузла або порту все одно
потрібно встановити `models.providers.<id>.request.allowPrivateNetwork: true`; установіть значення `false`, щоб відмовитися від
довіри за замовчуванням.

## Усунення несправностей

### LM Studio не виявлено

Переконайтеся, що LM Studio запущено:

```bash
lms server start --port 1234
```

Якщо автентифікацію ввімкнено, також задайте `LM_API_TOKEN`. Перевірте доступність API:

```bash
curl http://localhost:1234/api/v1/models
```

### Помилки автентифікації (HTTP 401)

- Перевірте, чи `LM_API_TOKEN` відповідає ключу, налаштованому в LM Studio.
- Див. [Автентифікація LM Studio](https://lmstudio.ai/docs/developer/core/authentication).
- Якщо сервер не потребує автентифікації, залиште ключ порожнім під час налаштування.

## Пов’язані матеріали

- [Вибір моделі](/uk/concepts/model-providers)
- [Ollama](/uk/providers/ollama)
- [Локальні моделі](/uk/gateway/local-models)
