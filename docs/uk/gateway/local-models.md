---
read_when:
    - Ви хочете обслуговувати моделі зі свого власного GPU-сервера
    - Ви налаштовуєте LM Studio або сумісний з OpenAI proxy
    - Вам потрібні найбезпечніші рекомендації щодо локальних моделей
summary: Запуск OpenClaw на локальних LLM (LM Studio, vLLM, LiteLLM, користувацькі OpenAI endpoint-и)
title: Локальні моделі
x-i18n:
    generated_at: "2026-04-27T06:25:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1fe9f5f7e3fc4f5660769fddef1f524b303d309f77551880cd74f3395286816c
    source_path: gateway/local-models.md
    workflow: 15
---

Локальний запуск можливий, але OpenClaw очікує великий контекст і сильний захист від prompt injection. Невеликі карти обрізають контекст і послаблюють безпеку. Орієнтуйтеся на високий рівень: **≥2 повністю укомплектовані Mac Studio або еквівалентний GPU-стенд (~$30k+)**. Одна GPU на **24 GB** підходить лише для легших промптів із вищою затримкою. Використовуйте **найбільший / повнорозмірний варіант моделі, який ви можете запустити**; агресивно квантизовані або «малі» checkpoints підвищують ризик prompt injection (див. [Безпека](/uk/gateway/security)).

Якщо вам потрібне найпростіше локальне налаштування, почніть із [LM Studio](/uk/providers/lmstudio) або [Ollama](/uk/providers/ollama) та `openclaw onboard`. Ця сторінка — практичний посібник для потужніших локальних стеків і користувацьких локальних серверів, сумісних з OpenAI.

## Рекомендовано: LM Studio + велика локальна модель (Responses API)

Найкращий поточний локальний стек. Завантажте велику модель у LM Studio (наприклад, повнорозмірну збірку Qwen, DeepSeek або Llama), увімкніть локальний сервер (типово `http://127.0.0.1:1234`) і використовуйте Responses API, щоб тримати міркування окремо від фінального тексту.

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "lmstudio/my-local-model": { alias: "Local" },
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

**Контрольний список налаштування**

- Встановіть LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- У LM Studio завантажте **найбільшу доступну збірку моделі** (уникайте «малих»/сильно квантизованих варіантів), запустіть сервер, переконайтеся, що `http://127.0.0.1:1234/v1/models` показує її.
- Замініть `my-local-model` на фактичний ID моделі, показаний у LM Studio.
- Тримайте модель завантаженою; холодне завантаження додає затримку запуску.
- Скоригуйте `contextWindow`/`maxTokens`, якщо ваша збірка LM Studio відрізняється.
- Для WhatsApp дотримуйтеся Responses API, щоб надсилався лише фінальний текст.

Тримайте хостингові моделі налаштованими навіть під час локального запуску; використовуйте `models.mode: "merge"`, щоб запасні варіанти лишалися доступними.

### Гібридна конфігурація: хостингова primary, локальна fallback

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

### Спочатку локально, із хостинговою страховкою

Поміняйте місцями порядок primary і fallback; залиште той самий блок providers і `models.mode: "merge"`, щоб можна було перейти на Sonnet або Opus, коли локальний сервер недоступний.

### Регіональний хостинг / маршрутизація даних

- Хостингові варіанти MiniMax/Kimi/GLM також існують в OpenRouter з endpoint-ами, прив’язаними до регіону (наприклад, розміщеними в США). Виберіть там регіональний варіант, щоб зберігати трафік у вибраній юрисдикції, і водночас використовуйте `models.mode: "merge"` для fallback на Anthropic/OpenAI.
- Повністю локальний режим лишається найсильнішим варіантом приватності; регіональна хостингова маршрутизація — це компроміс, коли вам потрібні можливості провайдера, але ви хочете контролювати потік даних.

## Інші локальні proxy, сумісні з OpenAI

vLLM, LiteLLM, OAI-proxy або користувацькі Gateway працюють, якщо вони надають endpoint `/v1` у стилі OpenAI. Замініть блок provider вище на свій endpoint та ID моделі:

```json5
{
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-responses",
        timeoutSeconds: 300,
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

Залишайте `models.mode: "merge"`, щоб хостингові моделі лишалися доступними як fallback.
Використовуйте `models.providers.<id>.timeoutSeconds` для повільних локальних або віддалених серверів моделей перед тим, як збільшувати `agents.defaults.timeoutSeconds`. Таймаут provider застосовується лише до HTTP-запитів до моделі, включно з підключенням, заголовками, потоковою передачею тіла й загальним abort у guarded-fetch.

Примітка щодо поведінки локальних/proxy `/v1` backend-ів:

- OpenClaw обробляє їх як proxy-маршрути, сумісні з OpenAI, а не як нативні endpoint-и OpenAI
- нативне формування запитів лише для OpenAI тут не застосовується: без `service_tier`, без Responses `store`, без формування payload для сумісності reasoning OpenAI і без підказок prompt-cache
- приховані заголовки атрибуції OpenClaw (`originator`, `version`, `User-Agent`) не додаються до цих користувацьких proxy URL

Примітки щодо сумісності для суворіших backend-ів, сумісних з OpenAI:

- Деякі сервери приймають у Chat Completions лише рядковий `messages[].content`, а не структуровані масиви частин контенту. Для таких endpoint-ів установіть `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- Деякі менші або суворіші локальні backend-и нестабільні з повною формою промпта runtime агента OpenClaw, особливо коли включено схеми інструментів. Якщо backend працює для крихітних прямих викликів `/v1/chat/completions`, але не проходить на звичайних ходах агента OpenClaw, спочатку спробуйте `agents.defaults.experimental.localModelLean: true`, щоб прибрати важкі типові інструменти, як-от `browser`, `cron` і `message`; це експериментальний прапорець, а не стабільне типове налаштування режиму. Див. [Експериментальні можливості](/uk/concepts/experimental-features). Якщо це не допоможе, спробуйте `models.providers.<provider>.models[].compat.supportsTools: false`.
- Якщо backend усе ще не працює лише на більших запусках OpenClaw, то решта проблеми зазвичай полягає у потужності моделі/сервера на боці upstream або в помилці backend-а, а не в транспортному шарі OpenClaw.

## Усунення несправностей

- Gateway може дістатися до proxy? `curl http://127.0.0.1:1234/v1/models`.
- Модель LM Studio вивантажена? Завантажте знову; холодний старт — поширена причина «зависання».
- OpenClaw попереджає, коли виявлене вікно контексту менше за **32k**, і блокує роботу нижче **16k**. Якщо ви натрапили на цей preflight, збільште ліміт контексту сервера/моделі або виберіть більшу модель.
- Помилки контексту? Зменште `contextWindow` або збільште ліміт вашого сервера.
- Сервер, сумісний з OpenAI, повертає `messages[].content ... expected a string`?
  Додайте `compat.requiresStringContent: true` у запис цієї моделі.
- Прямі маленькі виклики `/v1/chat/completions` працюють, але `openclaw infer model run` падає на Gemma або іншій локальній моделі? Спочатку вимкніть схеми інструментів через `compat.supportsTools: false`, а потім перевірте знову. Якщо сервер усе ще падає лише на більших промптах OpenClaw, вважайте це обмеженням моделі/сервера на боці upstream.
- Безпека: локальні моделі обходять фільтри провайдера; тримайте агентів вузькоспрямованими, а Compaction увімкненим, щоб обмежити радіус ураження prompt injection.

## Пов’язане

- [Довідник із конфігурації](/uk/gateway/configuration-reference)
- [Перемикання моделей при збої](/uk/concepts/model-failover)
