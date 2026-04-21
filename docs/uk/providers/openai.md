---
read_when:
    - Ви хочете використовувати моделі OpenAI в OpenClaw
    - Ви хочете використовувати автентифікацію за підпискою Codex замість ключів API
    - Вам потрібна суворіша поведінка виконання агента GPT-5
summary: Використовуйте OpenAI через ключі API або підписку Codex в OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-21T20:52:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 692615b77885c0387d339d47c02ff056ba95d3608aa681882893a46d2a0f723f
    source_path: providers/openai.md
    workflow: 15
---

# OpenAI

OpenAI надає API для розробників для моделей GPT. OpenClaw підтримує два шляхи автентифікації:

- **Ключ API** — прямий доступ до OpenAI Platform з оплатою за використання (моделі `openai/*`)
- **Підписка Codex** — вхід через ChatGPT/Codex з доступом за підпискою (моделі `openai-codex/*`)

OpenAI офіційно підтримує використання OAuth за підпискою в зовнішніх інструментах і робочих процесах, таких як OpenClaw.

## Початок роботи

Виберіть бажаний спосіб автентифікації та виконайте кроки налаштування.

<Tabs>
  <Tab title="Ключ API (OpenAI Platform)">
    **Найкраще підходить для:** прямого доступу до API та оплати за використання.

    <Steps>
      <Step title="Отримайте свій ключ API">
        Створіть або скопіюйте ключ API з [панелі OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Запустіть початкове налаштування">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Або передайте ключ безпосередньо:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Переконайтеся, що модель доступна">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Підсумок маршруту

    | Посилання на модель | Маршрут | Автентифікація |
    |-----------|-------|------|
    | `openai/gpt-5.4` | Прямий API OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-pro` | Прямий API OpenAI Platform | `OPENAI_API_KEY` |

    <Note>
    Вхід через ChatGPT/Codex маршрутизується через `openai-codex/*`, а не `openai/*`.
    </Note>

    ### Приклад конфігурації

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw **не** надає `openai/gpt-5.3-codex-spark` у прямому шляху API. Реальні запити до OpenAI API відхиляють цю модель. Spark доступний лише в Codex.
    </Warning>

  </Tab>

  <Tab title="Підписка Codex">
    **Найкраще підходить для:** використання вашої підписки ChatGPT/Codex замість окремого ключа API. Для Codex cloud потрібен вхід через ChatGPT.

    <Steps>
      <Step title="Запустіть Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Або запустіть OAuth безпосередньо:

        ```bash
        openclaw models auth login --provider openai-codex
        ```
      </Step>
      <Step title="Встановіть модель за замовчуванням">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.4
        ```
      </Step>
      <Step title="Переконайтеся, що модель доступна">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Підсумок маршруту

    | Посилання на модель | Маршрут | Автентифікація |
    |-----------|-------|------|
    | `openai-codex/gpt-5.4` | ChatGPT/Codex OAuth | Вхід Codex |
    | `openai-codex/gpt-5.3-codex-spark` | ChatGPT/Codex OAuth | Вхід Codex (залежить від доступу) |

    <Note>
    Цей маршрут навмисно відокремлений від `openai/gpt-5.4`. Використовуйте `openai/*` з ключем API для прямого доступу до Platform, а `openai-codex/*` — для доступу за підпискою Codex.
    </Note>

    ### Приклад конфігурації

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
    }
    ```

    <Tip>
    Якщо під час початкового налаштування повторно використовується наявний вхід Codex CLI, цими обліковими даними й надалі керує Codex CLI. Після завершення строку дії OpenClaw спочатку повторно зчитує зовнішнє джерело Codex, а потім записує оновлені облікові дані назад у сховище Codex.
    </Tip>

    ### Обмеження вікна контексту

    OpenClaw розглядає метадані моделі та обмеження контексту під час виконання як окремі значення.

    Для `openai-codex/gpt-5.4`:

    - Власний `contextWindow`: `1050000`
    - Стандартне обмеження `contextTokens` під час виконання: `272000`

    Менше стандартне обмеження на практиці забезпечує кращі характеристики затримки та якості. Перевизначте його за допомогою `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.4", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    Використовуйте `contextWindow`, щоб указати власні метадані моделі. Використовуйте `contextTokens`, щоб обмежити бюджет контексту під час виконання.
    </Note>

  </Tab>
</Tabs>

## Генерація зображень

Вбудований Plugin `openai` реєструє генерацію зображень через інструмент `image_generate`.

| Можливість                | Значення                           |
| ------------------------- | ---------------------------------- |
| Модель за замовчуванням   | `openai/gpt-image-2`               |
| Макс. кількість зображень на запит | 4                        |
| Режим редагування         | Увімкнено (до 5 еталонних зображень) |
| Перевизначення розміру    | Підтримується, зокрема розміри 2K/4K |
| Співвідношення сторін / роздільна здатність | Не передаються до OpenAI Images API |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
Див. [Генерація зображень](/uk/tools/image-generation), щоб дізнатися про спільні параметри інструмента, вибір провайдера та поведінку аварійного перемикання.
</Note>

`gpt-image-2` є моделлю за замовчуванням як для генерації зображень із тексту в OpenAI, так і для редагування зображень. `gpt-image-1` і надалі можна використовувати як явне перевизначення моделі, але нові робочі процеси OpenAI для зображень мають використовувати `openai/gpt-image-2`.

Генерація:

```
/tool image_generate model=openai/gpt-image-2 prompt="Відполірований постер запуску для OpenClaw на macOS" size=3840x2160 count=1
```

Редагування:

```
/tool image_generate model=openai/gpt-image-2 prompt="Збережи форму об’єкта, зміни матеріал на напівпрозоре скло" image=/path/to/reference.png size=1024x1536
```

## Генерація відео

Вбудований Plugin `openai` реєструє генерацію відео через інструмент `video_generate`.

| Можливість | Значення |
| ---------------- | --------------------------------------------------------------------------------- |
| Модель за замовчуванням | `openai/sora-2` |
| Режими | Текст у відео, зображення у відео, редагування одного відео |
| Вхідні еталонні дані | 1 зображення або 1 відео |
| Перевизначення розміру | Підтримується |
| Інші перевизначення | `aspectRatio`, `resolution`, `audio`, `watermark` ігноруються з попередженням інструмента |

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
Див. [Генерація відео](/uk/tools/video-generation), щоб дізнатися про спільні параметри інструмента, вибір провайдера та поведінку аварійного перемикання.
</Note>

## Внесок у промпт GPT-5

OpenClaw додає внесок у промпт GPT-5, специфічний для OpenAI, для запусків сімейства GPT-5 `openai/*` і `openai-codex/*`. Він розташований у вбудованому Plugin OpenAI, застосовується до ідентифікаторів моделей, таких як `gpt-5`, `gpt-5.2`, `gpt-5.4` і `gpt-5.4-mini`, і не застосовується до старіших моделей GPT-4.x.

Внесок GPT-5 додає контракт поведінки з тегами для збереження персони, безпеки виконання, дисципліни використання інструментів, форми виводу, перевірок завершення та верифікації. Специфічна для каналу поведінка відповіді та тихих повідомлень залишається у спільному системному промпті OpenClaw і політиці вихідної доставки. Настанови GPT-5 завжди ввімкнені для відповідних моделей. Шар дружнього стилю взаємодії є окремим і налаштовуваним.

| Значення | Ефект |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (за замовчуванням) | Увімкнути шар дружнього стилю взаємодії |
| `"on"` | Псевдонім для `"friendly"` |
| `"off"` | Вимкнути лише шар дружнього стилю |

<Tabs>
  <Tab title="Конфігурація">
    ```json5
    {
      plugins: {
        entries: {
          openai: { config: { personality: "friendly" } },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set plugins.entries.openai.config.personality off
    ```
  </Tab>
</Tabs>

<Tip>
Під час виконання значення нечутливі до регістру, тому і `"Off"`, і `"off"` вимикають шар дружнього стилю.
</Tip>

## Голос і мовлення

<AccordionGroup>
  <Accordion title="Синтез мовлення (TTS)">
    Вбудований Plugin `openai` реєструє синтез мовлення для поверхні `messages.tts`.

    | Налаштування | Шлях конфігурації | За замовчуванням |
    |---------|------------|---------|
    | Модель | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Голос | `messages.tts.providers.openai.voice` | `coral` |
    | Швидкість | `messages.tts.providers.openai.speed` | (не встановлено) |
    | Інструкції | `messages.tts.providers.openai.instructions` | (не встановлено, лише `gpt-4o-mini-tts`) |
    | Формат | `messages.tts.providers.openai.responseFormat` | `opus` для голосових повідомлень, `mp3` для файлів |
    | Ключ API | `messages.tts.providers.openai.apiKey` | Резервно використовується `OPENAI_API_KEY` |
    | Базовий URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    Доступні моделі: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Доступні голоси: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", voice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    Установіть `OPENAI_TTS_BASE_URL`, щоб перевизначити базовий URL для TTS без впливу на кінцеву точку API чату.
    </Note>

  </Accordion>

  <Accordion title="Транскрибування в реальному часі">
    Вбудований Plugin `openai` реєструє транскрибування в реальному часі для Plugin Voice Call.

    | Налаштування | Шлях конфігурації | За замовчуванням |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Тривалість тиші | `...openai.silenceDurationMs` | `800` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | Ключ API | `...openai.apiKey` | Резервно використовується `OPENAI_API_KEY` |

    <Note>
    Використовує WebSocket-з’єднання з `wss://api.openai.com/v1/realtime` з аудіо G.711 u-law.
    </Note>

  </Accordion>

  <Accordion title="Голос у реальному часі">
    Вбудований Plugin `openai` реєструє голос у реальному часі для Plugin Voice Call.

    | Налаштування | Шлях конфігурації | За замовчуванням |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime` |
    | Голос | `...openai.voice` | `alloy` |
    | Температура | `...openai.temperature` | `0.8` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | Тривалість тиші | `...openai.silenceDurationMs` | `500` |
    | Ключ API | `...openai.apiKey` | Резервно використовується `OPENAI_API_KEY` |

    <Note>
    Підтримує Azure OpenAI через ключі конфігурації `azureEndpoint` і `azureDeployment`. Підтримує двонаправлений виклик інструментів. Використовує аудіоформат G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Транспорт (WebSocket vs SSE)">
    OpenClaw використовує WebSocket-first із резервним переходом на SSE (`"auto"`) як для `openai/*`, так і для `openai-codex/*`.

    У режимі `"auto"` OpenClaw:
    - Повторює одну ранню помилку WebSocket перед переходом на SSE
    - Після помилки позначає WebSocket як деградований приблизно на 60 секунд і використовує SSE протягом охолодження
    - Додає стабільні заголовки ідентифікації сесії та ходу для повторних спроб і повторних підключень
    - Нормалізує лічильники використання (`input_tokens` / `prompt_tokens`) між варіантами транспорту

    | Значення | Поведінка |
    |-------|----------|
    | `"auto"` (за замовчуванням) | Спочатку WebSocket, резервно SSE |
    | `"sse"` | Примусово лише SSE |
    | `"websocket"` | Примусово лише WebSocket |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai-codex/gpt-5.4": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    Пов’язана документація OpenAI:
    - [Realtime API через WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Потокові відповіді API (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Прогрів WebSocket">
    OpenClaw за замовчуванням вмикає прогрів WebSocket для `openai/*`, щоб зменшити затримку першого ходу.

    ```json5
    // Вимкнути прогрів
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Швидкий режим">
    OpenClaw надає спільний перемикач швидкого режиму для `openai/*` і `openai-codex/*`:

    - **Чат/UI:** `/fast status|on|off`
    - **Конфігурація:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Коли його ввімкнено, OpenClaw зіставляє швидкий режим із пріоритетною обробкою OpenAI (`service_tier = "priority"`). Наявні значення `service_tier` зберігаються, а швидкий режим не переписує `reasoning` або `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { fastMode: true } },
            "openai-codex/gpt-5.4": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Перевизначення сеансу мають пріоритет над конфігурацією. Очищення перевизначення сеансу в UI сеансів повертає сеанс до налаштованого значення за замовчуванням.
    </Note>

  </Accordion>

  <Accordion title="Пріоритетна обробка (service_tier)">
    API OpenAI надає пріоритетну обробку через `service_tier`. Установіть її для кожної моделі в OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { serviceTier: "priority" } },
            "openai-codex/gpt-5.4": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Підтримувані значення: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` передається лише до нативних кінцевих точок OpenAI (`api.openai.com`) і нативних кінцевих точок Codex (`chatgpt.com/backend-api`). Якщо ви маршрутизуєте будь-якого з цих провайдерів через проксі, OpenClaw залишає `service_tier` без змін.
    </Warning>

  </Accordion>

  <Accordion title="Compaction на боці сервера (Responses API)">
    Для прямих моделей OpenAI Responses (`openai/*` на `api.openai.com`) OpenClaw автоматично вмикає Compaction на боці сервера:

    - Примусово встановлює `store: true` (якщо тільки сумісність моделі не задає `supportsStore: false`)
    - Вставляє `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` за замовчуванням: 70% від `contextWindow` (або `80000`, якщо значення недоступне)

    <Tabs>
      <Tab title="Явно ввімкнути">
        Корисно для сумісних кінцевих точок, таких як Azure OpenAI Responses:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.4": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Власний поріг">
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
      </Tab>
      <Tab title="Вимкнути">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.4": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction` керує лише вставкою `context_management`. Прямі моделі OpenAI Responses однаково примусово встановлюють `store: true`, якщо сумісність не задає `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Суворий агентний режим GPT">
    Для запусків сімейства GPT-5 на `openai/*` і `openai-codex/*` OpenClaw може використовувати суворіший вбудований контракт виконання:

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    Із `strict-agentic` OpenClaw:
    - Більше не вважає хід лише з планом успішним прогресом, коли доступна дія інструмента
    - Повторює хід із вказівкою діяти негайно
    - Автоматично вмикає `update_plan` для суттєвої роботи
    - Показує явний заблокований стан, якщо модель продовжує планувати без дій

    <Note>
    Застосовується лише до запусків сімейства GPT-5 OpenAI і Codex. Для інших провайдерів і старіших сімейств моделей зберігається стандартна поведінка.
    </Note>

  </Accordion>

  <Accordion title="Нативні маршрути та OpenAI-сумісні маршрути">
    OpenClaw по-різному обробляє прямі кінцеві точки OpenAI, Codex і Azure OpenAI та загальні OpenAI-сумісні проксі `/v1`:

    **Нативні маршрути** (`openai/*`, `openai-codex/*`, Azure OpenAI):
    - Зберігають `reasoning: { effort: "none" }` лише для моделей, які підтримують значення OpenAI `none` для effort
    - Пропускають вимкнене reasoning для моделей або проксі, які відхиляють `reasoning.effort: "none"`
    - За замовчуванням використовують строгий режим для схем інструментів
    - Додають приховані заголовки атрибуції лише на перевірених нативних хостах
    - Зберігають формування запитів, специфічне для OpenAI (`service_tier`, `store`, сумісність reasoning, підказки prompt-cache)

    **Проксі/сумісні маршрути:**
    - Використовують м’якшу поведінку сумісності
    - Не примушують строгі схеми інструментів або заголовки, призначені лише для нативних маршрутів

    Azure OpenAI використовує нативний транспорт і поведінку сумісності, але не отримує приховані заголовки атрибуції.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки аварійного перемикання.
  </Card>
  <Card title="Генерація зображень" href="/uk/tools/image-generation" icon="image">
    Спільні параметри інструмента зображень і вибір провайдера.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента відео і вибір провайдера.
  </Card>
  <Card title="OAuth і автентифікація" href="/uk/gateway/authentication" icon="key">
    Докладніше про автентифікацію та правила повторного використання облікових даних.
  </Card>
</CardGroup>
