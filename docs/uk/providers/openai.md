---
read_when:
    - Ви хочете використовувати моделі OpenAI в OpenClaw
    - Вам потрібна автентифікація підписки Codex замість API keys
    - Вам потрібна суворіша агентна поведінка виконання GPT-5
summary: Використання OpenAI через API keys або підписку Codex в OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-23T21:07:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 39f5259ef82bb95bb7a94cf36a33c4a3ea2b9ba06f5355dc7abf256167d7a4b9
    source_path: providers/openai.md
    workflow: 15
---

OpenAI надає developer API для моделей GPT. OpenClaw підтримує два шляхи автентифікації за одними й тими самими канонічними посиланнями на моделі OpenAI:

- **API key** — прямий доступ до OpenAI Platform з білінгом за використанням (моделі `openai/*`)
- **Підписка Codex** — вхід через ChatGPT/Codex із доступом за підпискою. Внутрішній id auth/provider-а — `openai-codex`, але нові посилання на моделі все одно мають використовувати `openai/*`.

OpenAI явно підтримує використання OAuth-підписки у зовнішніх інструментах і робочих процесах, таких як OpenClaw.

## Покриття можливостей OpenAI в OpenClaw

| Можливість OpenAI       | Поверхня OpenClaw                        | Статус                                                    |
| ----------------------- | --------------------------------------- | --------------------------------------------------------- |
| Chat / Responses        | provider моделей `openai/<model>`       | Так                                                       |
| Моделі підписки Codex   | `openai/<model>` з auth `openai-codex`  | Так                                                       |
| Server-side web search  | Нативний інструмент OpenAI Responses    | Так, коли web search увімкнено і provider не зафіксовано  |
| Зображення              | `image_generate`                        | Так                                                       |
| Відео                   | `video_generate`                        | Так                                                       |
| Text-to-speech          | `messages.tts.provider: "openai"` / `tts` | Так                                                     |
| Batch speech-to-text    | `tools.media.audio` / media understanding | Так                                                     |
| Streaming speech-to-text| Voice Call `streaming.provider: "openai"` | Так                                                     |
| Realtime voice          | Voice Call `realtime.provider: "openai"` | Так                                                      |
| Embeddings              | provider embeddings для memory          | Так                                                       |

## Початок роботи

Виберіть бажаний метод автентифікації та виконайте кроки налаштування.

<Tabs>
  <Tab title="API key (OpenAI Platform)">
    **Найкраще для:** прямого доступу до API та білінгу за використанням.

    <Steps>
      <Step title="Отримайте свій API key">
        Створіть або скопіюйте API key з [dashboard OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Запустіть onboarding">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Або передайте ключ напряму:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Перевірте, що модель доступна">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Підсумок маршрутизації

    | Посилання на модель | Маршрут | Auth |
    |-----------|-------|------|
    | `openai/gpt-5.5` | Прямий API OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.5-pro` | Прямий API OpenAI Platform | `OPENAI_API_KEY` |

    <Note>
    `openai-codex/*` усе ще приймається як застарілий псевдонім сумісності, але нові конфігурації мають використовувати `openai/*`.
    </Note>

    ### Приклад config

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw **не** надає `openai/gpt-5.3-codex-spark`. Живі запити до OpenAI API відхиляють цю модель, і поточний каталог Codex також її не показує.
    </Warning>

  </Tab>

  <Tab title="Підписка Codex">
    **Найкраще для:** використання вашої підписки ChatGPT/Codex замість окремого API key. Хмарний Codex вимагає входу через ChatGPT.

    <Steps>
      <Step title="Запустіть Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Або запустіть OAuth напряму:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Для безголових конфігурацій або конфігурацій, де callback браузера не підходить, додайте `--device-code`, щоб увійти через потік ChatGPT device-code замість localhost browser callback:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Задайте типову модель">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```
      </Step>
      <Step title="Перевірте, що модель доступна">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Підсумок маршрутизації

    | Посилання на модель | Маршрут | Auth |
    |-----------|-------|------|
    | `openai/gpt-5.5` | ChatGPT/Codex OAuth | Вхід Codex |

    <Note>
    Посилання на моделі `openai-codex/*` і `codex/*` — це застарілі псевдоніми сумісності. Для команд auth/profile і далі використовуйте id provider-а `openai-codex`.
    </Note>

    ### Приклад config

    ```json5
    {
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Note>
    Onboarding більше не імпортує OAuth-матеріали з `~/.codex`. Увійдіть через браузерний OAuth (типово) або через device-code flow вище — OpenClaw керує отриманими обліковими даними у власному сховищі auth агента.
    </Note>

    ### Індикатор стану

    Чат-команда `/status` показує, який вбудований harness активний для поточної
    session. Типовий harness PI відображається як `Runner: pi (embedded)` і не
    додає окремого badge. Коли вибрано bundled harness app-server Codex,
    `/status` додає id не-PI harness поруч із `Fast`, наприклад
    `Fast · codex`. Наявні sessions зберігають свій записаний id harness, тож використовуйте
    `/new` або `/reset` після зміни `embeddedHarness`, якщо хочете, щоб `/status`
    відображав новий вибір PI/Codex.

    ### Обмеження вікна контексту

    OpenClaw розглядає метадані моделі та обмеження контексту runtime як окремі значення.

    Для `openai/gpt-5.5` через Codex OAuth:

    - Нативний `contextWindow`: `1000000`
    - Типове обмеження runtime `contextTokens`: `272000`

    Менше типове обмеження на практиці дає кращі характеристики затримки та якості. Перевизначте його через `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    Використовуйте `contextWindow`, щоб оголосити нативні метадані моделі. Використовуйте `contextTokens`, щоб обмежити бюджет контексту runtime.
    </Note>

  </Tab>
</Tabs>

## Генерація зображень

Вбудований Plugin `openai` реєструє генерацію зображень через інструмент `image_generate`.

| Можливість                | Значення                             |
| ------------------------- | ------------------------------------ |
| Типова модель             | `openai/gpt-image-2`                 |
| Макс. зображень на запит  | 4                                    |
| Режим редагування         | Увімкнено (до 5 reference image)     |
| Перевизначення size       | Підтримуються, включно з розмірами 2K/4K |
| Aspect ratio / resolution | Не пересилаються до OpenAI Images API |

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
Спільні параметри інструмента, вибір provider-а та поведінку failover див. в [Генерація зображень](/uk/tools/image-generation).
</Note>

`gpt-image-2` є типовим значенням і для текст-у-зображення OpenAI, і для
редагування зображень. `gpt-image-1` і далі можна використовувати як явне перевизначення моделі, але нові робочі процеси OpenAI для зображень мають використовувати `openai/gpt-image-2`.

Provider `openai-codex` також надає `gpt-image-2` для генерації зображень і
редагування reference-image через OpenAI Codex OAuth. Використовуйте
`openai-codex/gpt-image-2`, коли агент увійшов через Codex OAuth, але не має `OPENAI_API_KEY`.

Генерація:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Генерація з Codex OAuth:

```
/tool image_generate model=openai-codex/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Редагування:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Генерація відео

Вбудований Plugin `openai` реєструє генерацію відео через інструмент `video_generate`.

| Можливість       | Значення                                                                            |
| ---------------- | ----------------------------------------------------------------------------------- |
| Типова модель    | `openai/sora-2`                                                                     |
| Режими           | Текст-у-відео, зображення-у-відео, редагування одного відео                         |
| Reference inputs | 1 зображення або 1 відео                                                            |
| Перевизначення size | Підтримуються                                                                   |
| Інші перевизначення | `aspectRatio`, `resolution`, `audio`, `watermark` ігноруються з warning від інструмента |

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
Спільні параметри інструмента, вибір provider-а та поведінку failover див. в [Генерація відео](/uk/tools/video-generation).
</Note>

## Внесок у prompt для GPT-5

OpenClaw додає спільний внесок у prompt для GPT-5 для запусків сімейства GPT-5 у різних provider-ів. Він застосовується за model id, тож `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` та інші сумісні посилання на GPT-5 отримують той самий overlay. Старіші моделі GPT-4.x — ні.

Вбудований нативний harness Codex використовує ту саму поведінку GPT-5 і overlay Heartbeat через developer instructions app-server Codex, тож sessions `openai/gpt-5.x`, примусово проведені через `embeddedHarness.runtime: "codex"`, зберігають ті самі настанови щодо доведення справи до кінця та проактивного Heartbeat, навіть якщо рештою prompt harness володіє Codex.

Внесок GPT-5 додає tagged-контракт поведінки для збереження persona, безпеки виконання, дисципліни інструментів, форми виводу, перевірок завершення та верифікації. Специфічна для каналів поведінка reply і silent-message залишається в спільному системному prompt OpenClaw і політиці вихідної доставки. Настанови GPT-5 завжди ввімкнені для відповідних моделей. Дружній interaction-style layer є окремим і налаштовуваним.

| Значення               | Ефект                                      |
| ---------------------- | ------------------------------------------ |
| `"friendly"` (типово)  | Увімкнути дружній interaction-style layer  |
| `"on"`                 | Псевдонім для `"friendly"`                 |
| `"off"`                | Вимкнути лише friendly style layer         |

<Tabs>
  <Tab title="Config">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
Під час runtime значення нечутливі до регістру, тож і `"Off"`, і `"off"` вимикають friendly style layer.
</Tip>

<Note>
Застарілий `plugins.entries.openai.config.personality` усе ще читається як compatibility fallback, коли спільне налаштування `agents.defaults.promptOverlays.gpt5.personality` не задано.
</Note>

## Голос і мовлення

<AccordionGroup>
  <Accordion title="Синтез мовлення (TTS)">
    Вбудований Plugin `openai` реєструє синтез мовлення для поверхні `messages.tts`.

    | Налаштування | Шлях config | Типове значення |
    |-------------|-------------|-----------------|
    | Модель | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voice | `messages.tts.providers.openai.voice` | `coral` |
    | Швидкість | `messages.tts.providers.openai.speed` | (не задано) |
    | Інструкції | `messages.tts.providers.openai.instructions` | (не задано, лише `gpt-4o-mini-tts`) |
    | Формат | `messages.tts.providers.openai.responseFormat` | `opus` для voice note, `mp3` для файлів |
    | API key | `messages.tts.providers.openai.apiKey` | Fallback на `OPENAI_API_KEY` |
    | Base URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    Доступні моделі: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Доступні voice: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

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
    Задайте `OPENAI_TTS_BASE_URL`, щоб перевизначити base URL для TTS, не впливаючи на endpoint chat API.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Вбудований Plugin `openai` реєструє пакетний speech-to-text через
    поверхню транскрибування для media-understanding в OpenClaw.

    - Типова модель: `gpt-4o-transcribe`
    - Endpoint: OpenAI REST `/v1/audio/transcriptions`
    - Шлях входу: multipart-завантаження audio-файла
    - Підтримується в OpenClaw всюди, де транскрибування вхідного audio використовує
      `tools.media.audio`, включно з сегментами voice-channel у Discord і
      audio-вкладеннями каналів

    Щоб примусово використовувати OpenAI для транскрибування вхідного audio:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    Підказки щодо мови й prompt пересилаються до OpenAI, коли вони надані
    спільною конфігурацією audio media або запитом транскрибування для конкретного виклику.

  </Accordion>

  <Accordion title="Транскрибування в реальному часі">
    Вбудований Plugin `openai` реєструє транскрибування в реальному часі для Plugin-а Voice Call.

    | Налаштування | Шлях config | Типове значення |
    |-------------|-------------|-----------------|
    | Модель | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Мова | `...openai.language` | (не задано) |
    | Prompt | `...openai.prompt` | (не задано) |
    | Тривалість тиші | `...openai.silenceDurationMs` | `800` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | API key | `...openai.apiKey` | Fallback на `OPENAI_API_KEY` |

    <Note>
    Використовує WebSocket-з’єднання до `wss://api.openai.com/v1/realtime` з audio у форматі G.711 u-law (`g711_ulaw` / `audio/pcmu`). Цей streaming provider призначений для шляху транскрибування в реальному часі в Voice Call; Discord voice наразі записує короткі сегменти й використовує пакетний шлях транскрибування `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Голос у реальному часі">
    Вбудований Plugin `openai` реєструє голос у реальному часі для Plugin-а Voice Call.

    | Налаштування | Шлях config | Типове значення |
    |-------------|-------------|-----------------|
    | Модель | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Voice | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | Тривалість тиші | `...openai.silenceDurationMs` | `500` |
    | API key | `...openai.apiKey` | Fallback на `OPENAI_API_KEY` |

    <Note>
    Підтримує Azure OpenAI через ключі config `azureEndpoint` і `azureDeployment`. Підтримує двонапрямлений виклик інструментів. Використовує audio-формат G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoint-и Azure OpenAI

Вбудований provider `openai` може націлюватися на ресурс Azure OpenAI для генерації
зображень через перевизначення base URL. На шляху генерації зображень OpenClaw
визначає Azure-hostname-и в `models.providers.openai.baseUrl` і автоматично перемикається на
форму запиту Azure.

<Note>
Для голосу в реальному часі використовується окремий шлях конфігурації
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`),
на який `models.providers.openai.baseUrl` не впливає. Налаштування Azure для нього див. в accordion **Голос і мовлення** під [Голос і мовлення](#voice-and-speech).
</Note>

Використовуйте Azure OpenAI, коли:

- у вас уже є підписка Azure OpenAI, quota або enterprise agreement
- вам потрібні регіональна резидентність даних або механізми compliance, які надає Azure
- ви хочете, щоб трафік залишався в межах наявного tenancy Azure

### Конфігурація

Для генерації зображень Azure через вбудований provider `openai` спрямуйте
`models.providers.openai.baseUrl` на свій ресурс Azure і задайте `apiKey` як
ключ Azure OpenAI (а не ключ OpenAI Platform):

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

OpenClaw розпізнає такі Azure host suffix для
шляху генерації зображень Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Для запитів генерації зображень на розпізнаному Azure host OpenClaw:

- Надсилає заголовок `api-key` замість `Authorization: Bearer`
- Використовує deployment-scoped-шляхи (`/openai/deployments/{deployment}/...`)
- Додає `?api-version=...` до кожного запиту

Інші base URL (публічний OpenAI, OpenAI-сумісні proxy) зберігають стандартну
форму запиту до OpenAI для зображень.

<Note>
Маршрутизація Azure для шляху генерації зображень provider-а `openai` потребує
OpenClaw 2026.4.22 або новішої версії. Раніші версії трактують будь-який кастомний
`openai.baseUrl` як публічний endpoint OpenAI і завершуються помилкою при роботі з Azure
image deployment-ами.
</Note>

### Версія API

Задайте `AZURE_OPENAI_API_VERSION`, щоб зафіксувати конкретну preview або GA-версію Azure
для шляху генерації зображень Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

  Типове значення — `2024-12-01-preview`, якщо змінну не задано.

  ### Назви моделей — це назви deployment

  Azure OpenAI прив’язує моделі до deployment-ів. Для запитів генерації зображень Azure,
  маршрутизованих через вбудований provider `openai`, поле `model` в OpenClaw
  має бути **назвою deployment Azure**, яку ви налаштували в Azure portal, а не
  публічним model id OpenAI.

  Якщо ви створили deployment з назвою `gpt-image-2-prod`, який обслуговує `gpt-image-2`:

  ```
  /tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
  ```

  Те саме правило назви deployment застосовується до викликів генерації зображень,
  маршрутизованих через вбудований provider `openai`.

  ### Регіональна доступність

  Генерація зображень Azure наразі доступна лише в підмножині регіонів
  (наприклад, `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
  `uaenorth`). Перевірте поточний список регіонів Microsoft перед створенням
  deployment і підтвердьте, що конкретна модель пропонується у вашому регіоні.

  ### Відмінності параметрів

  Azure OpenAI і публічний OpenAI не завжди приймають однакові параметри зображень.
  Azure може відхиляти параметри, які дозволяє публічний OpenAI (наприклад, певні
  значення `background` для `gpt-image-2`) або надавати їх лише для конкретних
  версій моделі. Ці відмінності походять від Azure і базової моделі, а не від
  OpenClaw. Якщо запит Azure завершується помилкою валідації, перевірте
  набір параметрів, який підтримується вашим конкретним deployment і версією API в
  Azure portal.

  <Note>
  Azure OpenAI використовує нативний transport і compat-поведінку, але не отримує
  приховані заголовки attribution OpenClaw — див. accordion **Нативні vs OpenAI-compatible
  маршрути** у розділі [Розширена конфігурація](#advanced-configuration).

  Для трафіку chat або Responses на Azure (поза генерацією зображень) використовуйте
  потік onboarding або окрему конфігурацію provider-а Azure — одного лише
  `openai.baseUrl` недостатньо, щоб підхопити форму API/auth Azure. Існує окремий
  provider `azure-openai-responses/*`; див.
  accordion про Server-side Compaction нижче.
  </Note>

  ## Розширена конфігурація

  <AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw використовує підхід WebSocket-first із fallback на SSE (`"auto"`) як для `openai/*`, так і для `openai-codex/*`.

    У режимі `"auto"` OpenClaw:
    - Повторює одну ранню помилку WebSocket перед переходом на fallback через SSE
    - Після збою позначає WebSocket як degraded приблизно на 60 секунд і використовує SSE під час cool-down
    - Додає стабільні заголовки identity для session і ходу для retry та reconnect
    - Нормалізує лічильники використання (`input_tokens` / `prompt_tokens`) між варіантами transport

    | Значення | Поведінка |
    |----------|-----------|
    | `"auto"` (типово) | Спочатку WebSocket, fallback на SSE |
    | `"sse"` | Примусово лише SSE |
    | `"websocket"` | Примусово лише WebSocket |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
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

  <Accordion title="Прогрів WebSocket">
    OpenClaw типово вмикає прогрів WebSocket для `openai/*`, щоб зменшити затримку першого ходу.

    ```json5
    // Вимкнути прогрів
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Fast mode">
    OpenClaw надає спільний перемикач fast mode для `openai/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Config:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Коли його ввімкнено, OpenClaw відображає fast mode на priority processing OpenAI (`service_tier = "priority"`). Наявні значення `service_tier` зберігаються, і fast mode не переписує `reasoning` або `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Перевизначення на рівні session мають пріоритет над config. Очищення перевизначення session в UI Sessions повертає session до налаштованого типового значення.
    </Note>

  </Accordion>

  <Accordion title="Priority processing (service_tier)">
    API OpenAI надає priority processing через `service_tier`. Задавайте його для кожної моделі в OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Підтримувані значення: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` пересилається лише до нативних endpoint-ів OpenAI (`api.openai.com`) і нативних endpoint-ів Codex (`chatgpt.com/backend-api`). Якщо ви маршрутизуєте будь-якого з цих provider-ів через proxy, OpenClaw залишає `service_tier` без змін.
    </Warning>

  </Accordion>

  <Accordion title="Server-side Compaction (Responses API)">
    Для прямих моделей OpenAI Responses (`openai/*` на `api.openai.com`) OpenClaw автоматично вмикає Server-side Compaction:

    - Примусово задає `store: true` (якщо тільки compat моделі не задає `supportsStore: false`)
    - Впроваджує `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Типове значення `compact_threshold`: 70% від `contextWindow` (або `80000`, коли воно недоступне)

    <Tabs>
      <Tab title="Явно увімкнути">
        Корисно для сумісних endpoint-ів, таких як Azure OpenAI Responses:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Кастомний поріг">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
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
                "openai/gpt-5.5": {
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
    `responsesServerCompaction` керує лише впровадженням `context_management`. Прямі моделі OpenAI Responses усе одно примусово задають `store: true`, якщо тільки compat не задає `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Strict-agentic GPT mode">
    Для запусків сімейства GPT-5 на `openai/*` OpenClaw може використовувати суворіший вбудований контракт виконання:

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
    - Більше не вважає хід лише з планом успішним прогресом, коли доступна дія з інструментом
    - Повторює хід зі steer «дій зараз»
    - Автоматично вмикає `update_plan` для суттєвої роботи
    - Показує явний blocked state, якщо модель продовжує планувати без дії

    <Note>
    Обмежено лише запусками OpenAI і Codex сімейства GPT-5. Інші provider-и та старіші сімейства моделей зберігають типову поведінку.
    </Note>

  </Accordion>

  <Accordion title="Нативні vs OpenAI-compatible маршрути">
    OpenClaw по-різному трактує прямі endpoint-и OpenAI, Codex і Azure OpenAI та загальні OpenAI-compatible `/v1` proxy:

    **Нативні маршрути** (`openai/*`, Azure OpenAI):
    - Зберігають `reasoning: { effort: "none" }` лише для моделей, які підтримують OpenAI `none` effort
    - Пропускають вимкнений reasoning для моделей або proxy, які відхиляють `reasoning.effort: "none"`
    - Типово задають strict mode для tool schema
    - Додають приховані attribution headers лише на перевірених нативних host-ах
    - Зберігають request shaping лише для OpenAI (`service_tier`, `store`, reasoning-compat, підказки prompt-cache)

    **Маршрути proxy/compatible:**
    - Використовують м’якшу compat-поведінку
    - Не примушують strict tool schema або заголовки лише для native

    Azure OpenAI використовує нативний transport і compat-поведінку, але не отримує прихованих attribution headers.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір provider-ів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Генерація зображень" href="/uk/tools/image-generation" icon="image">
    Спільні параметри image-інструмента та вибір provider-а.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри video-інструмента та вибір provider-а.
  </Card>
  <Card title="OAuth і auth" href="/uk/gateway/authentication" icon="key">
    Деталі auth і правила повторного використання облікових даних.
  </Card>
</CardGroup>
