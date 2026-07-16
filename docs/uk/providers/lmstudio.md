---
read_when:
    - Ви хочете запускати OpenClaw із моделями з відкритим кодом через LM Studio
    - Потрібно встановити й налаштувати LM Studio
summary: Запуск OpenClaw із LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-07-16T18:31:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 21129dad2f1bf53fcf9474db2393fce7642b82f4f22e1770d9788547f08eca7f
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio запускає моделі llama.cpp (GGUF) або MLX локально — як застосунок із графічним інтерфейсом або безголовий демон `llmster`.
Документацію зі встановлення та продукту див. на [lmstudio.ai](https://lmstudio.ai/).

## Швидкий старт

<Steps>
  <Step title="Установіть і запустіть сервер">
    Установіть LM Studio (настільний застосунок) або `llmster` (безголовий режим), а потім запустіть сервер:

    ```bash
    lms server start --port 1234
    ```

    Або запустіть безголовий демон:

    ```bash
    lms daemon up
    ```

    Якщо використовується настільний застосунок, увімкніть JIT для плавного завантаження моделей; див.
    [посібник LM Studio з JIT і TTL](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

  </Step>
  <Step title="Укажіть ключ API, якщо автентифікацію ввімкнено">
    ```bash
    export LM_API_TOKEN="your-lm-studio-api-token"
    ```

    Якщо автентифікацію LM Studio вимкнено, під час налаштування залиште ключ API порожнім. Див.
    [Автентифікація LM Studio](https://lmstudio.ai/docs/developer/core/authentication).

  </Step>
  <Step title="Запустіть початкове налаштування">
    ```bash
    openclaw onboard
    ```

    Виберіть `LM Studio`, а потім виберіть модель у запиті `Default model`.

    Під час нового керованого налаштування OpenClaw спочатку надсилає запит до `/api/v1/models` на
    стандартному або налаштованому хості LM Studio. Наявну LLM буде запропоновано через
    ту саму послідовність налаштування в CLI/macOS і перевірено реальним доповненням, перш ніж
    її конфігурацію буде збережено. Автоматична перевірка ніколи не завантажує модель і
    ігнорує записи каталогу, призначені лише для вбудовувань.

  </Step>
</Steps>

Щоб пізніше змінити стандартну модель:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

Ключі моделей LM Studio мають формат `author/model-name` (наприклад, `qwen/qwen3.5-9b`); у посиланнях на моделі OpenClaw
на початку додається постачальник: `lmstudio/qwen/qwen3.5-9b`. Щоб знайти точний ключ моделі, виконайте
наведену нижче команду та перегляньте поле `key`:

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
з автентифікацією; для серверів без автентифікації не вказуйте його — OpenClaw натомість збереже локальний несекретний маркер.
`--custom-api-key` усе ще підтримується для сумісності, але рекомендовано `--lmstudio-api-key`.

Це записує `models.providers.lmstudio` і встановлює стандартною модель `lmstudio/<custom-model-id>`.
Якщо надати ключ API, також буде записано профіль автентифікації `lmstudio:default`.

Під час інтерактивного налаштування також може з’явитися запит щодо бажаної довжини контексту завантаження, яку буде застосовано до
виявлених моделей, збережених у конфігурації.

## Конфігурація

### Сумісність використання з потоковим передаванням

LM Studio не завжди додає до потокових відповідей об’єкт `usage` у форматі OpenAI. OpenClaw
натомість відновлює кількість токенів із метаданих `timings.prompt_n` / `timings.predicted_n`
у стилі llama.cpp. Такий самий резервний механізм застосовується до будь-якої OpenAI-сумісної кінцевої точки,
визначеної як локальна (хост зворотного зв’язку), і охоплює інші локальні серверні системи, як-от vLLM, SGLang,
llama.cpp, LocalAI, Jan, TabbyAPI і text-generation-webui.

### Сумісність міркування

Коли механізм виявлення `/api/v1/models` LM Studio повідомляє про параметри міркування для певної моделі, OpenClaw
надає відповідні значення `reasoning_effort` (`none`, `minimal`, `low`, `medium`, `high`, `xhigh`) у
метаданих сумісності моделі. Деякі збірки LM Studio показують двійковий параметр інтерфейсу (`allowed_options: ["off",
"on"]`), але відхиляють ці буквальні значення в `/v1/chat/completions`; OpenClaw нормалізує
цей двійковий формат до шестирівневої шкали перед надсиланням запитів, зокрема для раніше збереженої конфігурації,
що досі містить карти міркування `off`/`on`.

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

LM Studio підтримує завантаження моделей «точно вчасно» (JIT), тобто завантажує їх за першим запитом. За замовчуванням OpenClaw
попередньо завантажує моделі через власну кінцеву точку завантаження LM Studio, що корисно, коли JIT
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

### Хост у LAN або tailnet

Використовуйте доступну адресу хоста LM Studio, збережіть `/v1` і переконайтеся, що LM Studio на цьому комп’ютері
прив’язано не лише до інтерфейсу зворотного зв’язку:

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

`lmstudio` автоматично вважає налаштовану для нього кінцеву точку довіреною для запитів до моделей, зокрема хости
зворотного зв’язку, LAN і tailnet (крім джерел метаданих або локальних каналів зв’язку). Будь-який власний або локальний запис
OpenAI-сумісного постачальника отримує таку саму довіру до точного джерела. Для запитів до іншого приватного хоста або порту
все одно потрібен `models.providers.<id>.request.allowPrivateNetwork: true`; задайте для нього `false`, щоб відмовитися від
стандартної довіри.

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

- Переконайтеся, що `LM_API_TOKEN` відповідає ключу, налаштованому в LM Studio.
- Див. [Автентифікація LM Studio](https://lmstudio.ai/docs/developer/core/authentication).
- Якщо сервер не потребує автентифікації, залиште ключ порожнім під час налаштування.

## Пов’язані матеріали

- [Вибір моделі](/uk/concepts/model-providers)
- [Ollama](/uk/providers/ollama)
- [Локальні моделі](/uk/gateway/local-models)
