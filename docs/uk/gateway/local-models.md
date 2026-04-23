---
read_when:
    - Ви хочете обслуговувати моделі зі свого GPU-сервера
    - Ви налаштовуєте LM Studio або проксі, сумісний з OpenAI
    - Вам потрібні найбезпечніші рекомендації щодо локальних моделей
summary: Запускайте OpenClaw на локальних LLM (LM Studio, vLLM, LiteLLM, власні endpoint OpenAI)
title: Локальні моделі
x-i18n:
    generated_at: "2026-04-23T20:53:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 755162ec175fa7f769cecc1756d31de8916d4058a3cf4dba86080b446c6cb91c
    source_path: gateway/local-models.md
    workflow: 15
---

Локальний запуск можливий, але OpenClaw очікує великий контекст і сильний захист від prompt injection. Невеликі карти обрізають контекст і послаблюють безпеку. Орієнтуйтеся високо: **≥2 повністю укомплектовані Mac Studio або еквівалентний GPU-риг (~$30k+)**. Одна GPU з **24 GB** підходить лише для легших prompt із вищою затримкою. Використовуйте **найбільший / повнорозмірний варіант моделі, який ви можете запустити**; агресивно квантизовані або «small» checkpoint підвищують ризик prompt injection (див. [Security](/uk/gateway/security)).

Якщо вам потрібне найпростіше локальне налаштування, почніть із [LM Studio](/uk/providers/lmstudio) або [Ollama](/uk/providers/ollama) і `openclaw onboard`. Ця сторінка — це рекомендаційний посібник для потужніших локальних стеків і власних локальних серверів, сумісних з OpenAI.

## Рекомендовано: LM Studio + велика локальна модель (Responses API)

Найкращий поточний локальний стек. Завантажте велику модель у LM Studio (наприклад, повнорозмірну збірку Qwen, DeepSeek або Llama), увімкніть локальний сервер (типово `http://127.0.0.1:1234`) і використовуйте Responses API, щоб відокремити reasoning від фінального тексту.

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

- Установіть LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- У LM Studio завантажте **найбільшу доступну збірку моделі** (уникайте варіантів “small”/сильно квантизованих), запустіть сервер, переконайтеся, що `http://127.0.0.1:1234/v1/models` її показує.
- Замініть `my-local-model` на фактичний ID моделі, показаний у LM Studio.
- Тримайте модель завантаженою; холодне завантаження додає затримку запуску.
- Відкоригуйте `contextWindow`/`maxTokens`, якщо ваша збірка LM Studio відрізняється.
- Для WhatsApp дотримуйтеся Responses API, щоб надсилався лише фінальний текст.

Залишайте hosted-моделі налаштованими навіть під час локального запуску; використовуйте `models.mode: "merge"`, щоб fallback залишався доступним.

### Гібридна конфігурація: hosted primary, local fallback

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

### Локальний primary з hosted-страхуванням

Поміняйте місцями порядок primary і fallback; залиште той самий блок providers і `models.mode: "merge"`, щоб мати змогу повертатися до Sonnet або Opus, коли локальний сервер недоступний.

### Регіональний хостинг / маршрутизація даних

- Hosted-варіанти MiniMax/Kimi/GLM також існують в OpenRouter з endpoint, прив’язаними до регіону (наприклад, розміщеними у США). Виберіть там регіональний варіант, щоб зберегти трафік у вибраній юрисдикції, одночасно використовуючи `models.mode: "merge"` для fallback Anthropic/OpenAI.
- Повністю локальний режим залишається найкращим шляхом для конфіденційності; hosted-регіональна маршрутизація — це компромісний варіант, коли вам потрібні можливості провайдера, але ви хочете контролювати потік даних.

## Інші локальні проксі, сумісні з OpenAI

vLLM, LiteLLM, OAI-proxy або власні gateway працюють, якщо вони надають endpoint `/v1` у стилі OpenAI. Замініть блок provider вище на свій endpoint і ID моделі:

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

Залишайте `models.mode: "merge"`, щоб hosted-моделі залишалися доступними як fallback.

Примітка щодо поведінки для локальних/проксійованих backend `/v1`:

- OpenClaw розглядає їх як проксі-маршрути, сумісні з OpenAI, а не як нативні
  endpoint OpenAI
- shaping запитів, притаманний лише нативному OpenAI, тут не застосовується: немає
  `service_tier`, немає `store` у Responses, немає shaping payload
  сумісності reasoning OpenAI і немає підказок prompt-cache
- приховані заголовки атрибуції OpenClaw (`originator`, `version`, `User-Agent`)
  не впроваджуються для цих користувацьких URL проксі

Примітки щодо сумісності для суворіших backend, сумісних з OpenAI:

- Деякі сервери приймають лише рядкове `messages[].content` у Chat Completions, а не
  структуровані масиви content-part. Установіть
  `models.providers.<provider>.models[].compat.requiresStringContent: true` для
  таких endpoint.
- Деякі менші або суворіші локальні backend нестабільно працюють із повною
  формою prompt runtime агента OpenClaw, особливо коли включено схеми інструментів. Якщо
  backend працює для крихітних прямих викликів `/v1/chat/completions`, але не працює для звичайних
  ходів агента OpenClaw, спочатку спробуйте
  `agents.defaults.experimental.localModelLean: true`, щоб прибрати важкі
  типові інструменти на кшталт `browser`, `cron` і `message`; це експериментальний
  прапорець, а не стабільне налаштування типового режиму. Див.
  [Experimental Features](/uk/concepts/experimental-features). Якщо це все одно не допоможе, спробуйте
  `models.providers.<provider>.models[].compat.supportsTools: false`.
- Якщо backend усе ще не працює лише на більших запусках OpenClaw, то проблема, як правило,
  у можливостях моделі/сервера на стороні upstream або в багу backend, а не в
  транспортному рівні OpenClaw.

## Усунення несправностей

- Gateway може дістатися до проксі? `curl http://127.0.0.1:1234/v1/models`.
- Модель LM Studio вивантажена? Завантажте знову; холодний старт — поширена причина «зависання».
- OpenClaw попереджає, коли виявлене вікно контексту менше за **32k**, і блокує роботу нижче **16k**. Якщо ви натрапили на цю попередню перевірку, збільште ліміт контексту сервера/моделі або виберіть більшу модель.
- Помилки контексту? Зменште `contextWindow` або підвищте ліміт сервера.
- Сервер, сумісний з OpenAI, повертає `messages[].content ... expected a string`?
  Додайте `compat.requiresStringContent: true` до запису цієї моделі.
- Прямі маленькі виклики `/v1/chat/completions` працюють, але `openclaw infer model run`
  не працює на Gemma або іншій локальній моделі? Спочатку вимкніть схеми інструментів через
  `compat.supportsTools: false`, а потім перевірте знову. Якщо сервер усе ще падає лише
  на більших prompt OpenClaw, розглядайте це як обмеження сервера/моделі на стороні upstream.
- Безпека: локальні моделі пропускають фільтри на стороні провайдера; звужуйте агентів і залишайте Compaction увімкненим, щоб обмежити радіус ураження від prompt injection.
