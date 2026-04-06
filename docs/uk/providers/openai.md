---
read_when:
    - Ви хочете використовувати моделі OpenAI в OpenClaw
    - Ви хочете використовувати автентифікацію підписки Codex замість API keys
summary: Використовуйте OpenAI через API keys або підписку Codex в OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-06T15:31:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 736ad34671584665674515aee76e2670b14b22bb3cc0bf0ab3ae2388ac136598
    source_path: providers/openai.md
    workflow: 15
---

# OpenAI

OpenAI надає API для розробників для моделей GPT. Codex підтримує **вхід через ChatGPT** для доступу
за підпискою або **вхід через API key** для доступу на основі використання. Codex cloud вимагає входу через ChatGPT.
OpenAI явно підтримує використання subscription OAuth у зовнішніх інструментах/робочих процесах, як-от OpenClaw.

## Стиль взаємодії за замовчуванням

OpenClaw може додавати невелике накладання prompt, специфічне для OpenAI, як для запусків `openai/*`, так і
для `openai-codex/*`. За замовчуванням це накладання зберігає асистента теплим,
спільним, лаконічним, прямим і трохи емоційно виразнішим,
не замінюючи базовий системний prompt OpenClaw. Дружнє накладання також
дозволяє час від часу використовувати emoji, коли це доречно, водночас
зберігаючи загальний вивід стислим.

Ключ config:

`plugins.entries.openai.config.personality`

Дозволені значення:

- `"friendly"`: значення за замовчуванням; увімкнути накладання, специфічне для OpenAI.
- `"off"`: вимкнути накладання й використовувати лише базовий prompt OpenClaw.

Область дії:

- Застосовується до моделей `openai/*`.
- Застосовується до моделей `openai-codex/*`.
- Не впливає на інших провайдерів.

Цю поведінку ввімкнено за замовчуванням. Явно залиште `"friendly"`, якщо хочете, щоб
це збереглося попри майбутні локальні зміни config:

```json5
{
  plugins: {
    entries: {
      openai: {
        config: {
          personality: "friendly",
        },
      },
    },
  },
}
```

### Вимкнути накладання prompt OpenAI

Якщо ви хочете немодифікований базовий prompt OpenClaw, установіть для накладання значення `"off"`:

```json5
{
  plugins: {
    entries: {
      openai: {
        config: {
          personality: "off",
        },
      },
    },
  },
}
```

Ви також можете встановити це безпосередньо через config CLI:

```bash
openclaw config set plugins.entries.openai.config.personality off
```

## Варіант A: OpenAI API key (OpenAI Platform)

**Найкраще для:** прямого доступу до API й білінгу на основі використання.
Отримайте свій API key у панелі керування OpenAI.

Підсумок маршруту:

- `openai/gpt-5.4` = прямий маршрут через API OpenAI Platform
- Потрібен `OPENAI_API_KEY` (або еквівалентний config провайдера OpenAI)
- В OpenClaw вхід через ChatGPT/Codex маршрутизується через `openai-codex/*`, а не через `openai/*`

### Налаштування CLI

```bash
openclaw onboard --auth-choice openai-api-key
# або неінтерактивно
openclaw onboard --openai-api-key "$OPENAI_API_KEY"
```

### Фрагмент config

```json5
{
  env: { OPENAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

У поточній документації OpenAI для моделей API наведено `gpt-5.4` і `gpt-5.4-pro` для прямого
використання OpenAI API. OpenClaw пересилає обидві через шлях Responses `openai/*`.
OpenClaw навмисно приховує застарілий рядок `openai/gpt-5.3-codex-spark`,
оскільки прямі виклики OpenAI API відхиляють його в реальному трафіку.

OpenClaw **не** надає `openai/gpt-5.3-codex-spark` на прямому шляху
OpenAI API. `pi-ai` усе ще постачає вбудований рядок для цієї моделі, але реальні запити OpenAI API
наразі її відхиляють. В OpenClaw Spark вважається доступним лише для Codex.

## Генерація зображень

Вбудований плагін `openai` також реєструє генерацію зображень через спільний
інструмент `image_generate`.

- Модель зображень за замовчуванням: `openai/gpt-image-1`
- Генерація: до 4 зображень на запит
- Режим редагування: увімкнено, до 5 еталонних зображень
- Підтримує `size`
- Поточне застереження, специфічне для OpenAI: OpenClaw наразі не пересилає перевизначення `aspectRatio` або
  `resolution` до OpenAI Images API

Щоб використовувати OpenAI як провайдера зображень за замовчуванням:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
      },
    },
  },
}
```

Див. [Image Generation](/uk/tools/image-generation) щодо спільних параметрів
інструмента, вибору провайдера та поведінки failover.

## Генерація відео

Вбудований плагін `openai` також реєструє генерацію відео через спільний
інструмент `video_generate`.

- Модель відео за замовчуванням: `openai/sora-2`
- Режими: text-to-video, image-to-video і сценарії еталонного/редагування одного відео
- Поточні обмеження: 1 вхідне еталонне зображення або 1 відео
- Поточне застереження, специфічне для OpenAI: OpenClaw наразі пересилає лише перевизначення
  `size` для нативної генерації відео OpenAI. Непідтримувані необов’язкові перевизначення,
  такі як `aspectRatio`, `resolution`, `audio` і `watermark`, ігноруються
  та повертаються як попередження інструмента.

Щоб використовувати OpenAI як провайдера відео за замовчуванням:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "openai/sora-2",
      },
    },
  },
}
```

Див. [Video Generation](/uk/tools/video-generation) щодо спільних параметрів
інструмента, вибору провайдера та поведінки failover.

## Варіант B: підписка OpenAI Code (Codex)

**Найкраще для:** використання доступу за підпискою ChatGPT/Codex замість API key.
Codex cloud вимагає входу через ChatGPT, тоді як Codex CLI підтримує вхід через ChatGPT або API key.

Підсумок маршруту:

- `openai-codex/gpt-5.4` = маршрут OAuth ChatGPT/Codex
- Використовує вхід через ChatGPT/Codex, а не прямий API key OpenAI Platform
- Обмеження на боці провайдера для `openai-codex/*` можуть відрізнятися від досвіду ChatGPT у вебверсії/застосунку

### Налаштування CLI (Codex OAuth)

```bash
# Запустити Codex OAuth у майстрі
openclaw onboard --auth-choice openai-codex

# Або запустити OAuth безпосередньо
openclaw models auth login --provider openai-codex
```

### Фрагмент config (підписка Codex)

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

У поточній документації OpenAI для Codex `gpt-5.4` зазначено як поточну модель Codex. OpenClaw
зіставляє її з `openai-codex/gpt-5.4` для використання OAuth ChatGPT/Codex.

Цей маршрут навмисно відокремлено від `openai/gpt-5.4`. Якщо вам потрібен
прямий шлях OpenAI Platform API, використовуйте `openai/*` з API key. Якщо вам потрібен
вхід через ChatGPT/Codex, використовуйте `openai-codex/*`.

Якщо onboarding повторно використовує наявний вхід Codex CLI, ці облікові дані
надалі керуються Codex CLI. Після завершення строку дії OpenClaw спочатку знову зчитує зовнішнє джерело Codex
і, коли провайдер може його оновити, записує оновлені облікові дані
назад у сховище Codex замість того, щоб брати керування на себе в окремій
копії лише для OpenClaw.

Якщо ваш обліковий запис Codex має право на Codex Spark, OpenClaw також підтримує:

- `openai-codex/gpt-5.3-codex-spark`

OpenClaw розглядає Codex Spark як доступний лише для Codex. Він не надає прямий
шлях API key `openai/gpt-5.3-codex-spark`.

OpenClaw також зберігає `openai-codex/gpt-5.3-codex-spark`, коли `pi-ai`
його виявляє. Сприймайте його як залежний від entitlement та експериментальний: Codex Spark
відокремлений від GPT-5.4 `/fast`, а доступність залежить від облікового запису Codex /
ChatGPT, через який виконано вхід.

### Обмеження вікна контексту Codex

OpenClaw розглядає метадані моделі Codex і runtime-обмеження контексту як окремі
значення.

Для `openai-codex/gpt-5.4`:

- нативне `contextWindow`: `1050000`
- runtime-обмеження `contextTokens` за замовчуванням: `272000`

Це зберігає правдивість метаданих моделі, водночас залишаючи менше runtime-вікно
за замовчуванням, яке на практиці має кращі характеристики затримки та якості.

Якщо вам потрібне інше ефективне обмеження, установіть `models.providers.<provider>.models[].contextTokens`:

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [
          {
            id: "gpt-5.4",
            contextTokens: 160000,
          },
        ],
      },
    },
  },
}
```

Використовуйте `contextWindow` лише тоді, коли ви оголошуєте або перевизначаєте нативні метадані
моделі. Використовуйте `contextTokens`, коли хочете обмежити runtime-бюджет контексту.

### Транспорт за замовчуванням

OpenClaw використовує `pi-ai` для потокового передавання моделей. Для `openai/*`, і для
`openai-codex/*` транспорт за замовчуванням — `"auto"` (спочатку WebSocket, потім fallback
на SSE).

У режимі `"auto"` OpenClaw також повторює одну ранню придатну до повтору помилку WebSocket,
перш ніж перейти на SSE. Примусовий режим `"websocket"` все ще показує помилки транспорту безпосередньо, а не приховує їх за fallback.

Після помилки WebSocket під час з’єднання або на ранньому ході в режимі `"auto"` OpenClaw позначає
шлях WebSocket цієї сесії як деградований приблизно на 60 секунд і надсилає
наступні ходи через SSE під час cooldown, замість того щоб безладно перемикатися між
транспортами.

Для нативних endpoint OpenAI-сімейства (`openai/*`, `openai-codex/*` і Azure
OpenAI Responses) OpenClaw також додає стабільний стан ідентичності сесії та ходу
до запитів, щоб повторні спроби, перепідключення та fallback на SSE залишалися прив’язаними до тієї самої
ідентичності розмови. На нативних маршрутах OpenAI-сімейства це включає стабільні заголовки ідентичності запиту сесії/ходу та відповідні метадані транспорту.

OpenClaw також нормалізує лічильники використання OpenAI для різних варіантів транспорту до того,
як вони потрапляють на поверхні сесії/статусу. Нативний трафік OpenAI/Codex Responses може
повідомляти про використання як `input_tokens` / `output_tokens` або
`prompt_tokens` / `completion_tokens`; OpenClaw трактує їх як однакові лічильники вхідних
і вихідних токенів для `/status`, `/usage` і журналів сесій. Коли нативний
трафік WebSocket не містить `total_tokens` (або повідомляє `0`), OpenClaw використовує
нормалізовану суму вхідних + вихідних токенів, щоб відображення сесії/статусу лишалися заповненими.

Ви можете встановити `agents.defaults.models.<provider/model>.params.transport`:

- `"sse"`: примусово використовувати SSE
- `"websocket"`: примусово використовувати WebSocket
- `"auto"`: спробувати WebSocket, потім перейти на SSE

Для `openai/*` (Responses API) OpenClaw також за замовчуванням вмикає warm-up WebSocket
(`openaiWsWarmup: true`), коли використовується транспорт WebSocket.

Пов’язана документація OpenAI:

- [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
- [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

```json5
{
  agents: {
    defaults: {
      model: { primary: "openai-codex/gpt-5.4" },
      models: {
        "openai-codex/gpt-5.4": {
          params: {
            transport: "auto",
          },
        },
      },
    },
  },
}
```

### Warm-up WebSocket OpenAI

У документації OpenAI warm-up описано як необов’язковий. OpenClaw вмикає його за замовчуванням для
`openai/*`, щоб зменшити затримку першого ходу при використанні транспорту WebSocket.

### Вимкнути warm-up

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            openaiWsWarmup: false,
          },
        },
      },
    },
  },
}
```

### Явно ввімкнути warm-up

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            openaiWsWarmup: true,
          },
        },
      },
    },
  },
}
```

### Пріоритетна обробка OpenAI і Codex

API OpenAI надає пріоритетну обробку через `service_tier=priority`. У
OpenClaw установіть `agents.defaults.models["<provider>/<model>"].params.serviceTier`,
щоб передати це поле далі на нативних endpoint OpenAI/Codex Responses.

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            serviceTier: "priority",
          },
        },
        "openai-codex/gpt-5.4": {
          params: {
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

Підтримувані значення: `auto`, `default`, `flex` і `priority`.

OpenClaw пересилає `params.serviceTier` як у прямі запити Responses `openai/*`,
так і в запити Codex Responses `openai-codex/*`, коли ці моделі вказують
на нативні endpoint OpenAI/Codex.

Важлива поведінка:

- прямі `openai/*` мають бути націлені на `api.openai.com`
- `openai-codex/*` мають бути націлені на `chatgpt.com/backend-api`
- якщо ви маршрутизуєте будь-якого з провайдерів через інший base URL або proxy, OpenClaw залишає `service_tier` без змін

### Швидкий режим OpenAI

OpenClaw надає спільний перемикач швидкого режиму як для сесій `openai/*`, так і для
`openai-codex/*`:

- Чат/UI: `/fast status|on|off`
- Config: `agents.defaults.models["<provider>/<model>"].params.fastMode`

Коли швидкий режим увімкнено, OpenClaw зіставляє його з пріоритетною обробкою OpenAI:

- прямі виклики Responses `openai/*` до `api.openai.com` надсилають `service_tier = "priority"`
- виклики Responses `openai-codex/*` до `chatgpt.com/backend-api` також надсилають `service_tier = "priority"`
- наявні значення `service_tier` у payload зберігаються
- швидкий режим не переписує `reasoning` або `text.verbosity`

Для GPT 5.4 найпоширеніше налаштування таке:

- надішліть `/fast on` у сесії, що використовує `openai/gpt-5.4` або `openai-codex/gpt-5.4`
- або встановіть `agents.defaults.models["openai/gpt-5.4"].params.fastMode = true`
- якщо ви також використовуєте Codex OAuth, установіть `agents.defaults.models["openai-codex/gpt-5.4"].params.fastMode = true` також

Приклад:

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            fastMode: true,
          },
        },
        "openai-codex/gpt-5.4": {
          params: {
            fastMode: true,
          },
        },
      },
    },
  },
}
```

Перевизначення сесії мають пріоритет над config. Очищення перевизначення сесії в Sessions UI
повертає сесію до налаштованого значення за замовчуванням.

### Нативні маршрути OpenAI порівняно з OpenAI-compatible

OpenClaw по-різному обробляє прямі endpoint OpenAI, Codex і Azure OpenAI
порівняно з універсальними OpenAI-compatible proxy `/v1`:

- нативні маршрути `openai/*`, `openai-codex/*` і Azure OpenAI зберігають
  `reasoning: { effort: "none" }` без змін, коли ви явно вимикаєте reasoning
- нативні маршрути OpenAI-сімейства за замовчуванням використовують строгий режим для схем інструментів
- приховані заголовки атрибуції OpenClaw (`originator`, `version` і
  `User-Agent`) додаються лише на перевірених нативних хостах OpenAI
  (`api.openai.com`) і нативних хостах Codex (`chatgpt.com/backend-api`)
- нативні маршрути OpenAI/Codex зберігають формування запитів, специфічне для OpenAI, як-от
  `service_tier`, Responses `store`, payload сумісності reasoning OpenAI і
  підказки кешу prompt
- маршрути в стилі proxy OpenAI-compatible зберігають м’якшу поведінку сумісності й не
  примушують до строгих схем інструментів, формування запитів лише для нативних маршрутів або прихованих
  заголовків атрибуції OpenAI/Codex

Azure OpenAI залишається в категорії нативної маршрутизації для транспорту й поведінки сумісності,
але не отримує прихованих заголовків атрибуції OpenAI/Codex.

Це зберігає поточну поведінку нативного OpenAI Responses, не нав’язуючи старі
OpenAI-compatible shim стороннім бекендам `/v1`.

### Серверна compaction OpenAI Responses

Для прямих моделей OpenAI Responses (`openai/*` з `api: "openai-responses"` і
`baseUrl` на `api.openai.com`) OpenClaw тепер автоматично вмикає серверні
підказки payload для compaction OpenAI:

- Примусово встановлює `store: true` (якщо compat моделі не встановлює `supportsStore: false`)
- Впроваджує `context_management: [{ type: "compaction", compact_threshold: ... }]`

За замовчуванням `compact_threshold` становить `70%` від `contextWindow` моделі (або `80000`,
якщо він недоступний).

### Явно ввімкнути серверну compaction

Використовуйте це, якщо хочете примусово впровадити `context_management` на сумісних
моделях Responses (наприклад Azure OpenAI Responses):

```json5
{
  agents: {
    defaults: {
      models: {
        "azure-openai-responses/gpt-5.4": {
          params: {
            responsesServerCompaction: true,
          },
        },
      },
    },
  },
}
```

### Увімкнути з власним порогом

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            responsesServerCompaction: true,
            responsesCompactThreshold: 120000,
          },
        },
      },
    },
  },
}
```

### Вимкнути серверну compaction

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            responsesServerCompaction: false,
          },
        },
      },
    },
  },
}
```

`responsesServerCompaction` керує лише впровадженням `context_management`.
Прямі моделі OpenAI Responses все одно примусово використовують `store: true`, якщо compat не встановлює
`supportsStore: false`.

## Примітки

- Посилання на моделі завжди використовують `provider/model` (див. [/concepts/models](/uk/concepts/models)).
- Докладно про автентифікацію й правила повторного використання — у [/concepts/oauth](/uk/concepts/oauth).
