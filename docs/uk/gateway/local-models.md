---
read_when:
    - Ви хочете обслуговувати моделі зі свого власного GPU-сервера
    - Ви налаштовуєте LM Studio або OpenAI-сумісний проксі-сервер
    - Вам потрібні найбезпечніші рекомендації щодо локальних моделей
summary: Запустіть OpenClaw на локальних LLM (LM Studio, vLLM, LiteLLM, власні OpenAI endpoints)
title: Локальні моделі
x-i18n:
    generated_at: "2026-04-15T10:43:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: d9b4939bb67f4fea23de45e88cdf29b887b2992389bc581058361d27bd227dd3
    source_path: gateway/local-models.md
    workflow: 15
---

# Локальні моделі

Локальний запуск можливий, але OpenClaw очікує великий контекст + сильний захист від інʼєкцій у промпти. Невеликі карти обрізають контекст і послаблюють безпеку. Орієнтуйтеся на високий рівень: **≥2 Mac Studio з максимальною конфігурацією або еквівалентна GPU-станція (~$30k+)**. Одна GPU з **24 GB** підходить лише для легших промптів із вищою затримкою. Використовуйте **найбільший / повнорозмірний варіант моделі, який можете запустити**; агресивно квантизовані або “small” чекпойнти підвищують ризик інʼєкцій у промпти (див. [Безпека](/uk/gateway/security)).

Якщо вам потрібне локальне налаштування з найменшими труднощами, почніть із [LM Studio](/uk/providers/lmstudio) або [Ollama](/uk/providers/ollama) і `openclaw onboard`. Ця сторінка — це практичний посібник для продуктивніших локальних стеків і власних локальних серверів, сумісних з OpenAI.

## Рекомендовано: LM Studio + велика локальна модель (Responses API)

Найкращий поточний локальний стек. Завантажте велику модель у LM Studio (наприклад, повнорозмірну збірку Qwen, DeepSeek або Llama), увімкніть локальний сервер (типово `http://127.0.0.1:1234`), і використовуйте Responses API, щоб відокремити міркування від фінального тексту.

```json5
{
  agents: {
    defaults: {
      model: { primary: “lmstudio/my-local-model” },
      models: {
        “anthropic/claude-opus-4-6”: { alias: “Opus” },
        “lmstudio/my-local-model”: { alias: “Local” },
      },
    },
  },
  models: {
    mode: “merge”,
    providers: {
      lmstudio: {
        baseUrl: “http://127.0.0.1:1234/v1”,
        apiKey: “lmstudio”,
        api: “openai-responses”,
        models: [
          {
            id: “my-local-model”,
            name: “Local Model”,
            reasoning: false,
            input: [“text”],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

**Контрольний список налаштування**

- Встановіть LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- У LM Studio завантажте **найбільшу доступну збірку моделі** (уникайте варіантів “small”/сильно квантизованих), запустіть сервер, переконайтеся, що `http://127.0.0.1:1234/v1/models` її показує.
- Замініть `my-local-model` на фактичний ID моделі, який показує LM Studio.
- Тримайте модель завантаженою; холодне завантаження додає затримку запуску.
- Налаштуйте `contextWindow`/`maxTokens`, якщо ваша збірка LM Studio відрізняється.
- Для WhatsApp використовуйте Responses API, щоб надсилався лише фінальний текст.

Навіть якщо ви запускаєте локальні моделі, залишайте налаштованими й хостингові моделі; використовуйте `models.mode: "merge"`, щоб резервні варіанти залишалися доступними.

### Гібридна конфігурація: основна хостингова модель, локальна резервна

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-4-6",
        fallbacks: ["lmstudio/my-local-model", "anthropic/claude-opus-4-6"],
      },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "lmstudio/my-local-model": { alias: "Local" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

### Спочатку локальна модель, із хостинговою страховкою

Поміняйте місцями основну модель і резервні; збережіть той самий блок providers і `models.mode: "merge"`, щоб можна було переключитися на Sonnet або Opus, якщо локальний сервер недоступний.

### Регіональний хостинг / маршрутизація даних

- Хостингові варіанти MiniMax/Kimi/GLM також існують в OpenRouter з endpoint-ами, привʼязаними до регіону (наприклад, розміщеними у США). Виберіть там регіональний варіант, щоб трафік залишався у вибраній вами юрисдикції, і водночас використовуйте `models.mode: "merge"` для резервних Anthropic/OpenAI.
- Лише локальний запуск залишається найсильнішим шляхом щодо приватності; регіональна маршрутизація в хостингу — це проміжний варіант, коли вам потрібні можливості провайдера, але ви хочете контролювати потік даних.

## Інші локальні проксі, сумісні з OpenAI

vLLM, LiteLLM, OAI-proxy або власні Gateway працюють, якщо вони надають endpoint `/v1` у стилі OpenAI. Замініть блок provider вище на свій endpoint і ID моделі:

```json5
{
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 120000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Зберігайте `models.mode: "merge"`, щоб хостингові моделі залишалися доступними як резервні.

Примітка щодо поведінки для локальних/проксійованих бекендів `/v1`:

- OpenClaw розглядає їх як проксі-маршрути у стилі OpenAI, а не як нативні endpoint-и OpenAI
- сюди не застосовується формування запитів, яке працює лише для нативного OpenAI: без `service_tier`, без `store` у Responses, без формування payload для сумісності з міркуванням OpenAI і без підказок для кешу промптів
- приховані службові заголовки OpenClaw (`originator`, `version`, `User-Agent`) не додаються до цих користувацьких проксі-URL

Примітки щодо сумісності для суворіших бекендів, сумісних з OpenAI:

- Деякі сервери приймають у Chat Completions лише рядковий `messages[].content`, а не структуровані масиви частин вмісту. Для таких endpoint-ів установіть `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- Деякі менші або суворіші локальні бекенди нестабільно працюють із повною формою промптів agent-runtime в OpenClaw, особливо коли включені схеми інструментів. Якщо бекенд працює для маленьких прямих викликів `/v1/chat/completions`, але не працює для звичайних ходів агентів OpenClaw, спочатку спробуйте `agents.defaults.experimental.localModelLean: true`, щоб прибрати важкі стандартні інструменти, як-от `browser`, `cron` і `message`; це експериментальний прапорець, а не стабільний параметр типового режиму. Якщо це не допоможе, спробуйте `models.providers.<provider>.models[].compat.supportsTools: false`.
- Якщо бекенд однаково не працює лише на більших запусках OpenClaw, проблема, що залишилася, зазвичай повʼязана з обмеженнями моделі/сервера або помилкою бекенда, а не з транспортним шаром OpenClaw.

## Усунення несправностей

- Gateway може дістатися до проксі? `curl http://127.0.0.1:1234/v1/models`.
- Модель LM Studio вивантажена? Завантажте її знову; холодний старт — поширена причина “зависання”.
- OpenClaw попереджає, коли виявлене вікно контексту менше ніж **32k**, і блокує роботу нижче **16k**. Якщо ви натрапили на цю попередню перевірку, підвищте ліміт контексту сервера/моделі або виберіть більшу модель.
- Помилки контексту? Зменште `contextWindow` або підвищте ліміт вашого сервера.
- OpenAI-сумісний сервер повертає `messages[].content ... expected a string`?
  Додайте `compat.requiresStringContent: true` у запис цієї моделі.
- Маленькі прямі виклики `/v1/chat/completions` працюють, але `openclaw infer model run` не працює з Gemma або іншою локальною моделлю? Спочатку вимкніть схеми інструментів через `compat.supportsTools: false`, а потім перевірте знову. Якщо сервер усе ще падає лише на більших промптах OpenClaw, вважайте це обмеженням моделі/сервера на upstream-стороні.
- Безпека: локальні моделі оминають фільтри на боці провайдера; тримайте агентів вузькоспрямованими, а Compaction увімкненим, щоб обмежити радіус ураження від інʼєкцій у промпти.
