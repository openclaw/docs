---
read_when:
    - Ви хочете використовувати моделі OpenAI в OpenClaw
    - Ви хочете автентифікацію підписки Codex замість API-ключів
    - Вам потрібна суворіша поведінка виконання агента GPT-5
summary: Використовуйте OpenAI через API-ключі або підписку Codex в OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-21T01:46:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 348c864a1bcdec93534dd1a08748788013abf530ac91823fa5f0deb95b20a72c
    source_path: providers/openai.md
    workflow: 15
---

# OpenAI

OpenAI надає API для розробників для моделей GPT. OpenClaw підтримує два способи автентифікації:

- **API-ключ** — прямий доступ до OpenAI Platform з тарифікацією за використанням (моделі `openai/*`)
- **Підписка Codex** — вхід через ChatGPT/Codex із доступом за підпискою (моделі `openai-codex/*`)

OpenAI прямо підтримує використання OAuth підписки в зовнішніх інструментах і робочих процесах, таких як OpenClaw.

## Початок роботи

Виберіть бажаний спосіб автентифікації та виконайте кроки налаштування.

<Tabs>
  <Tab title="API-ключ (OpenAI Platform)">
    **Найкраще підходить для:** прямого доступу до API та тарифікації за використанням.

    <Steps>
      <Step title="Отримайте свій API-ключ">
        Створіть або скопіюйте API-ключ з [панелі керування OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Запустіть онбординг">
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

    ### Підсумок маршрутів

    | Посилання на модель | Маршрут | Автентифікація |
    |-----------|-------|------|
    | `openai/gpt-5.4` | Прямий API OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-pro` | Прямий API OpenAI Platform | `OPENAI_API_KEY` |

    <Note>
    Вхід через ChatGPT/Codex спрямовується через `openai-codex/*`, а не `openai/*`.
    </Note>

    ### Приклад конфігурації

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw **не** надає `openai/gpt-5.3-codex-spark` у прямому шляху API. Живі запити до OpenAI API відхиляють цю модель. Spark доступний лише в Codex.
    </Warning>

  </Tab>

  <Tab title="Підписка Codex">
    **Найкраще підходить для:** використання вашої підписки ChatGPT/Codex замість окремого API-ключа. Codex cloud вимагає входу через ChatGPT.

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

    ### Підсумок маршрутів

    | Посилання на модель | Маршрут | Автентифікація |
    |-----------|-------|------|
    | `openai-codex/gpt-5.4` | ChatGPT/Codex OAuth | Вхід Codex |
    | `openai-codex/gpt-5.3-codex-spark` | ChatGPT/Codex OAuth | Вхід Codex (залежить від entitlement) |

    <Note>
    Цей маршрут навмисно відокремлений від `openai/gpt-5.4`. Використовуйте `openai/*` з API-ключем для прямого доступу до Platform і `openai-codex/*` для доступу через підписку Codex.
    </Note>

    ### Приклад конфігурації

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
    }
    ```

    <Tip>
    Якщо онбординг повторно використовує наявний вхід Codex CLI, ці облікові дані й надалі керуються Codex CLI. Після завершення строку дії OpenClaw спочатку повторно зчитує зовнішнє джерело Codex, а потім записує оновлені облікові дані назад у сховище Codex.
    </Tip>

    ### Обмеження вікна контексту

    OpenClaw розглядає метадані моделі та обмеження контексту середовища виконання як окремі значення.

    Для `openai-codex/gpt-5.4`:

    - Власний `contextWindow`: `1050000`
    - Стандартне обмеження середовища виконання `contextTokens`: `272000`

    Менше стандартне обмеження на практиці має кращі характеристики затримки та якості. Замініть його через `contextTokens`:

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
    Використовуйте `contextWindow`, щоб оголосити власні метадані моделі. Використовуйте `contextTokens`, щоб обмежити бюджет контексту середовища виконання.
    </Note>

  </Tab>
</Tabs>

## Генерація зображень

Вбудований Plugin `openai` реєструє генерацію зображень через інструмент `image_generate`.

| Можливість                | Значення                           |
| ------------------------- | ---------------------------------- |
| Модель за замовчуванням   | `openai/gpt-image-1`               |
| Максимум зображень на запит | 4                                |
| Режим редагування         | Увімкнено (до 5 еталонних зображень) |
| Перевизначення розміру    | Підтримується                      |
| Співвідношення сторін / роздільна здатність | Не передається до OpenAI Images API |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-1" },
    },
  },
}
```

<Note>
Див. [Генерація зображень](/uk/tools/image-generation), щоб ознайомитися зі спільними параметрами інструмента, вибором провайдера та поведінкою failover.
</Note>

## Генерація відео

Вбудований Plugin `openai` реєструє генерацію відео через інструмент `video_generate`.

| Можливість       | Значення                                                                          |
| ---------------- | --------------------------------------------------------------------------------- |
| Модель за замовчуванням | `openai/sora-2`                                                            |
| Режими           | Текст у відео, зображення у відео, редагування одного відео                      |
| Еталонні входи   | 1 зображення або 1 відео                                                          |
| Перевизначення розміру | Підтримується                                                               |
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
Див. [Генерація відео](/uk/tools/video-generation), щоб ознайомитися зі спільними параметрами інструмента, вибором провайдера та поведінкою failover.
</Note>

## Внесок у промпт GPT-5

OpenClaw додає специфічний для OpenAI внесок у промпт GPT-5 для запусків сімейства GPT-5 у `openai/*` і `openai-codex/*`. Він міститься у вбудованому Plugin OpenAI, застосовується до ідентифікаторів моделей, таких як `gpt-5`, `gpt-5.2`, `gpt-5.4` і `gpt-5.4-mini`, і не застосовується до старіших моделей GPT-4.x.

Внесок GPT-5 додає позначений контракт поведінки для форми виводу, наполегливості інструментів, перевірок залежностей, паралельного пошуку, перевірок завершення, верифікації та автономності за замовчуванням. Ці настанови завжди ввімкнені для відповідних моделей GPT-5. Рівень дружнього стилю взаємодії є окремим і налаштовуваним.

| Значення               | Ефект                                      |
| ---------------------- | ------------------------------------------ |
| `"friendly"` (за замовчуванням) | Увімкнути рівень дружнього стилю взаємодії |
| `"on"`                 | Псевдонім для `"friendly"`                 |
| `"off"`                | Вимкнути лише рівень дружнього стилю       |

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
Під час виконання значення нечутливі до регістру, тому і `"Off"`, і `"off"` вимикають рівень дружнього стилю.
</Tip>

## Голос і мовлення

<AccordionGroup>
  <Accordion title="Синтез мовлення (TTS)">
    Вбудований Plugin `openai` реєструє синтез мовлення для поверхні `messages.tts`.

    | Налаштування | Шлях конфігурації | За замовчуванням |
    |---------|------------|---------|
    | Модель | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Голос | `messages.tts.providers.openai.voice` | `coral` |
    | Швидкість | `messages.tts.providers.openai.speed` | (не задано) |
    | Інструкції | `messages.tts.providers.openai.instructions` | (не задано, лише `gpt-4o-mini-tts`) |
    | Формат | `messages.tts.providers.openai.responseFormat` | `opus` для голосових нотаток, `mp3` для файлів |
    | API-ключ | `messages.tts.providers.openai.apiKey` | Резервно використовує `OPENAI_API_KEY` |
    | Base URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

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
    Встановіть `OPENAI_TTS_BASE_URL`, щоб перевизначити базовий URL TTS без впливу на кінцеву точку API чату.
    </Note>

  </Accordion>

  <Accordion title="Транскрипція в реальному часі">
    Вбудований Plugin `openai` реєструє транскрипцію в реальному часі для Plugin Voice Call.

    | Налаштування | Шлях конфігурації | За замовчуванням |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Тривалість тиші | `...openai.silenceDurationMs` | `800` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | API-ключ | `...openai.apiKey` | Резервно використовує `OPENAI_API_KEY` |

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
    | Temperature | `...openai.temperature` | `0.8` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | Тривалість тиші | `...openai.silenceDurationMs` | `500` |
    | API-ключ | `...openai.apiKey` | Резервно використовує `OPENAI_API_KEY` |

    <Note>
    Підтримує Azure OpenAI через ключі конфігурації `azureEndpoint` і `azureDeployment`. Підтримує двонапрямлений виклик інструментів. Використовує аудіоформат G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Транспорт (WebSocket проти SSE)">
    OpenClaw використовує WebSocket-first із резервним переходом на SSE (`"auto"`) для `openai/*` і `openai-codex/*`.

    У режимі `"auto"` OpenClaw:
    - Повторює одну ранню помилку WebSocket перед переходом на SSE
    - Після помилки позначає WebSocket як деградований приблизно на 60 секунд і використовує SSE під час охолодження
    - Прикріплює стабільні заголовки ідентифікації сесії та ходу для повторів і повторних підключень
    - Нормалізує лічильники використання (`input_tokens` / `prompt_tokens`) у різних варіантах транспорту

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
    - [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Попередній прогрів WebSocket">
    OpenClaw за замовчуванням вмикає попередній прогрів WebSocket для `openai/*`, щоб зменшити затримку першого ходу.

    ```json5
    // Вимкнути попередній прогрів
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

    Коли ввімкнено, OpenClaw зіставляє швидкий режим із пріоритетною обробкою OpenAI (`service_tier = "priority"`). Наявні значення `service_tier` зберігаються, а швидкий режим не переписує `reasoning` або `text.verbosity`.

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
    API OpenAI надає пріоритетну обробку через `service_tier`. Налаштуйте її для кожної моделі в OpenClaw:

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
    `serviceTier` передається лише до нативних кінцевих точок OpenAI (`api.openai.com`) і нативних кінцевих точок Codex (`chatgpt.com/backend-api`). Якщо ви спрямовуєте будь-якого з провайдерів через проксі, OpenClaw залишає `service_tier` без змін.
    </Warning>

  </Accordion>

  <Accordion title="Server-side Compaction (Responses API)">
    Для прямих моделей OpenAI Responses (`openai/*` на `api.openai.com`) OpenClaw автоматично вмикає Server-side Compaction:

    - Примусово встановлює `store: true` (якщо сумісність моделі не задає `supportsStore: false`)
    - Вставляє `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` за замовчуванням: 70% від `contextWindow` (або `80000`, якщо недоступно)

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
    `responsesServerCompaction` керує лише вставленням `context_management`. Прямі моделі OpenAI Responses однаково примусово встановлюють `store: true`, якщо сумісність не задає `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Суворий агентний режим GPT">
    Для запусків сімейства GPT-5 у `openai/*` і `openai-codex/*` OpenClaw може використовувати суворіший вбудований контракт виконання:

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    З `strict-agentic` OpenClaw:
    - Більше не вважає хід лише з планом успішним прогресом, коли доступна дія інструмента
    - Повторює хід зі спрямуванням на негайну дію
    - Автоматично вмикає `update_plan` для суттєвої роботи
    - Показує явний заблокований стан, якщо модель продовжує планувати без дій

    <Note>
    Поширюється лише на запуски сімейства GPT-5 OpenAI і Codex. Інші провайдери та старіші сімейства моделей зберігають поведінку за замовчуванням.
    </Note>

  </Accordion>

  <Accordion title="Нативні маршрути проти OpenAI-compatible маршрутів">
    OpenClaw по-різному обробляє прямі кінцеві точки OpenAI, Codex і Azure OpenAI порівняно із загальними OpenAI-compatible проксі `/v1`:

    **Нативні маршрути** (`openai/*`, `openai-codex/*`, Azure OpenAI):
    - Зберігають `reasoning: { effort: "none" }` без змін, коли reasoning явно вимкнено
    - За замовчуванням використовують строгий режим для схем інструментів
    - Додають приховані заголовки атрибуції лише на перевірених нативних хостах
    - Зберігають формування запитів лише для OpenAI (`service_tier`, `store`, reasoning-compat, підказки кешу промптів)

    **Проксі/сумісні маршрути:**
    - Використовують м’якшу сумісну поведінку
    - Не примушують строгі схеми інструментів або нативні заголовки

    Azure OpenAI використовує нативний транспорт і сумісну поведінку, але не отримує приховані заголовки атрибуції.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
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
