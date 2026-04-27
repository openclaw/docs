---
read_when:
    - Ви хочете обслуговувати моделі з власного GPU-сервера
    - Ви налаштовуєте LM Studio або OpenAI-сумісний proxy
    - Вам потрібні найбезпечніші рекомендації щодо локальних моделей
summary: Запускайте OpenClaw на локальних LLM (LM Studio, vLLM, LiteLLM, власні OpenAI endpoints)
title: Локальні моделі
x-i18n:
    generated_at: "2026-04-27T12:50:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5b98d2d4b7e6162ca681f5d184ee6e075ea09e5e4b4544e6733c5e6b8ca4cc30
    source_path: gateway/local-models.md
    workflow: 15
---

Локальний запуск можливий, але OpenClaw очікує великий контекст + сильний захист від prompt injection. Невеликі карти обрізають контекст і послаблюють безпеку. Орієнтуйтеся високо: **≥2 Mac Studio з максимальними характеристиками або еквівалентний GPU-стенд (~$30k+)**. Один GPU на **24 GB** працює лише для легших prompt із вищою затримкою. Використовуйте **найбільший / повнорозмірний варіант моделі, який можете запустити**; агресивно квантизовані або «малі» checkpoints підвищують ризик prompt injection (див. [Security](/uk/gateway/security)).

Якщо вам потрібне локальне налаштування з найменшим тертям, почніть з [LM Studio](/uk/providers/lmstudio) або [Ollama](/uk/providers/ollama) і `openclaw onboard`. Ця сторінка — це упереджений практичний посібник для локальних стеків вищого класу та власних локальних OpenAI-сумісних серверів.

<Warning>
**Користувачі WSL2 + Ollama + NVIDIA/CUDA:** Офіційний інсталятор Ollama для Linux вмикає службу systemd з `Restart=always`. У конфігураціях WSL2 з GPU автозапуск може повторно завантажувати останню модель під час старту та фіксувати пам’ять хоста. Якщо ваша VM WSL2 постійно перезапускається після ввімкнення Ollama, див. [цикл збоїв WSL2](/uk/providers/ollama#wsl2-crash-loop-repeated-reboots).
</Warning>

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

- Установіть LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- У LM Studio завантажте **найбільшу доступну збірку моделі** (уникайте «small»/сильно квантизованих варіантів), запустіть сервер, підтвердьте, що `http://127.0.0.1:1234/v1/models` її показує.
- Замініть `my-local-model` на фактичний ID моделі, показаний у LM Studio.
- Тримайте модель завантаженою; холодне завантаження додає затримку запуску.
- Скоригуйте `contextWindow`/`maxTokens`, якщо ваша збірка LM Studio відрізняється.
- Для WhatsApp дотримуйтеся Responses API, щоб надсилався лише фінальний текст.

Тримайте hosted-моделі налаштованими навіть під час локального запуску; використовуйте `models.mode: "merge"`, щоб fallback залишалися доступними.

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

### Спочатку локально з hosted-підстраховкою

Поміняйте місцями порядок primary і fallback; залиште той самий блок providers і `models.mode: "merge"`, щоб мати змогу переключитися на Sonnet або Opus, коли локальний сервер недоступний.

### Регіональний хостинг / маршрутизація даних

- Hosted-варіанти MiniMax/Kimi/GLM також існують на OpenRouter з endpoint, прив’язаними до регіону (наприклад, hosted у США). Виберіть там регіональний варіант, щоб трафік залишався у вибраній юрисдикції, і водночас використовуйте `models.mode: "merge"` для fallback Anthropic/OpenAI.
- Лише локальний варіант залишається найсильнішим шляхом щодо приватності; hosted-регіональна маршрутизація — це компромісний варіант, коли вам потрібні можливості provider, але ви хочете контролювати потік даних.

## Інші OpenAI-сумісні локальні proxy

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy або власні
Gateway працюють, якщо вони надають endpoint
OpenAI-стилю `/v1/chat/completions`.
Використовуйте адаптер Chat Completions, якщо backend явно
не документує підтримку `/v1/responses`. Замініть блок provider вище на свій
endpoint і ID моделі:

```json5
{
  agents: {
    defaults: {
      model: { primary: "local/my-local-model" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-completions",
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

Якщо `api` пропущено в custom provider з `baseUrl`, OpenClaw типово використовує
`openai-completions`. Loopback-endpoint, такі як `127.0.0.1`, автоматично вважаються
довіреними; endpoint у LAN, tailnet і private DNS, як і раніше, потребують
`request.allowPrivateNetwork: true`.

Значення `models.providers.<id>.models[].id` є локальним для provider. Не
включайте туди префікс provider. Наприклад, сервер MLX, запущений з
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit`, має використовувати
цей id каталогу та ref моделі:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Тримайте `models.mode: "merge"`, щоб hosted-моделі лишалися доступними як fallback.
Використовуйте `models.providers.<id>.timeoutSeconds` для повільних локальних або віддалених model
server перед підвищенням `agents.defaults.timeoutSeconds`. Тайм-аут provider
застосовується лише до HTTP-запитів до моделі, включно з підключенням, headers, body streaming
і загальним guarded-fetch abort.

<Note>
Для custom OpenAI-сумісних providers дозволено зберігати несекретний локальний маркер, наприклад `apiKey: "ollama-local"`, коли `baseUrl` резолвиться в loopback, приватну LAN, `.local` або коротке ім’я хоста. OpenClaw розглядає це як коректний локальний credential замість повідомлення про відсутній ключ. Використовуйте реальне значення для будь-якого provider, який приймає публічне ім’я хоста.
</Note>

Примітка щодо поведінки для локальних/proxied backend `/v1`:

- OpenClaw розглядає їх як proxy-маршрути в стилі OpenAI, а не як нативні
  endpoint OpenAI
- нативне лише для OpenAI формування запитів тут не застосовується: без
  `service_tier`, без Responses `store`, без формування payload сумісності міркування OpenAI,
  і без підказок кешу prompt
- приховані заголовки атрибуції OpenClaw (`originator`, `version`, `User-Agent`)
  не додаються в ці custom proxy URL

Примітки щодо сумісності для суворіших OpenAI-сумісних backend:

- Деякі сервери приймають у Chat Completions лише рядок `messages[].content`, а не
  структуровані масиви частин контенту. Для
  таких endpoint установіть
  `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- Деякі локальні моделі виводять окремі запити інструментів у дужках як текст, наприклад
  `[tool_name]`, потім JSON і `[END_TOOL_REQUEST]`. OpenClaw підвищує
  їх до справжніх викликів tools лише тоді, коли ім’я точно збігається із зареєстрованим
  tool для цього кроку; інакше блок розглядається як непідтримуваний текст і
  приховується від видимих користувачеві відповідей.
- Якщо модель виводить JSON, XML або текст у стилі ReAct, схожий на виклик
  tool, але provider не видав структурований виклик, OpenClaw залишає це як
  текст і записує попередження з id запуску, provider/model, виявленим шаблоном і
  назвою tool, якщо вона доступна. Розглядайте це як несумісність викликів tool на рівні provider/model,
  а не як завершений запуск tool.
- Якщо tools з’являються як текст assistant замість виконання, наприклад сирий JSON,
  XML, синтаксис ReAct або порожній масив `tool_calls` у відповіді provider,
  спочатку перевірте, що сервер використовує chat template/parser із підтримкою викликів tools. Для
  OpenAI-сумісних backend Chat Completions, parser яких працює лише коли використання tool примусове, задайте override запиту для конкретної моделі замість покладання на парсинг тексту:

  ```json5
  {
    agents: {
      defaults: {
        models: {
          "local/my-local-model": {
            params: {
              extra_body: {
                tool_choice: "required",
              },
            },
          },
        },
      },
    },
  }
  ```

  Використовуйте це лише для моделей/сесій, де кожен звичайний крок має викликати tool.
  Це перевизначає типове proxy-значення OpenClaw `tool_choice: "auto"`.
  Замініть `local/my-local-model` на точний ref provider/model, показаний у
  `openclaw models list`.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- Деякі менші або суворіші локальні backend нестабільні з повною формою prompt середовища виконання
  agent у OpenClaw, особливо коли включено schema tools. Якщо
  backend працює для крихітних прямих викликів `/v1/chat/completions`, але не працює на звичайних
  кроках agent у OpenClaw, спочатку спробуйте
  `agents.defaults.experimental.localModelLean: true`, щоб прибрати важкі
  tools за замовчуванням, такі як `browser`, `cron` і `message`; це експериментальний
  прапорець, а не стабільне налаштування режиму за замовчуванням. Див.
  [Експериментальні можливості](/uk/concepts/experimental-features). Якщо це не допомогло, спробуйте
  `models.providers.<provider>.models[].compat.supportsTools: false`.
- Якщо backend і далі збоїть лише на більших запусках OpenClaw, то решта проблеми
  зазвичай полягає в можливостях моделі/сервера в upstream або в помилці backend, а не в транспортному шарі OpenClaw.

## Усунення несправностей

- Gateway може дістатися proxy? `curl http://127.0.0.1:1234/v1/models`.
- Модель LM Studio вивантажена? Завантажте її знову; холодний старт — поширена причина «зависання».
- Локальний сервер повідомляє `terminated`, `ECONNRESET` або закриває потік посеред кроку?
  OpenClaw записує low-cardinality `model.call.error.failureKind`, а також
  знімок RSS/heap процесу OpenClaw у diagnostics. Для тиску на пам’ять у LM Studio/Ollama
  зіставте цей timestamp із журналом сервера або журналом crash / jetsam macOS, щоб підтвердити, чи було server моделі знищено.
- OpenClaw попереджає, коли виявлене вікно контексту менше **32k**, і блокує нижче **16k**. Якщо ви натрапили на цю preflight-перевірку, збільште ліміт контексту сервера/моделі або виберіть більшу модель.
- Помилки контексту? Зменште `contextWindow` або підвищте ліміт сервера.
- OpenAI-сумісний сервер повертає `messages[].content ... expected a string`?
  Додайте `compat.requiresStringContent: true` у запис цієї моделі.
- Прямі крихітні виклики `/v1/chat/completions` працюють, але `openclaw infer model run`
  не працює на Gemma або іншій локальній моделі? Спочатку вимкніть schema tools через
  `compat.supportsTools: false`, а потім перевірте ще раз. Якщо сервер і далі падає лише
  на більших prompt OpenClaw, вважайте це обмеженням upstream server/model.
- Виклики tools з’являються як сирий текст JSON/XML/ReAct, або provider повертає
  порожній масив `tool_calls`? Не додавайте proxy, який сліпо перетворює текст assistant
  на виконання tool. Спочатку виправте chat template/parser сервера. Якщо
  модель працює лише коли використання tool примусове, додайте наведений вище
  override `params.extra_body.tool_choice: "required"` для конкретної моделі та використовуйте цей запис моделі
  лише для сесій, де виклик tool очікується на кожному кроці.
- Безпека: локальні моделі пропускають фільтри на боці provider; тримайте agents вузькими й увімкніть Compaction, щоб обмежити радіус ураження від prompt injection.

## Пов’язане

- [Довідник із конфігурації](/uk/gateway/configuration-reference)
- [Відмовостійкість моделей](/uk/concepts/model-failover)
