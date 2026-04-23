---
read_when:
    - Ви хочете використовувати моделі OpenAI в OpenClaw
    - Ви хочете використовувати автентифікацію Codex subscription замість API key
    - Вам потрібна суворіша поведінка виконання агента GPT-5
summary: Використовуйте OpenAI через API key або Codex subscription в OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-23T20:06:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 012be7535f442e382180f883435c2be907e0b56cf73413d23a3e8e4321e56063
    source_path: providers/openai.md
    workflow: 15
---

  # OpenAI

  OpenAI надає API для розробників для моделей GPT. OpenClaw підтримує два шляхи автентифікації за однаковими канонічними посиланнями на моделі OpenAI:

  - **API key** — прямий доступ до OpenAI Platform з білінгом за використання (`openai/*` моделі)
  - **Codex subscription** — вхід через ChatGPT/Codex із доступом за підпискою. Внутрішній ідентифікатор автентифікації/постачальника — `openai-codex`, але нові посилання на моделі все одно мають використовувати `openai/*`.

  OpenAI явно підтримує використання OAuth підписки у зовнішніх інструментах і робочих процесах, як-от OpenClaw.

  ## Покриття можливостей OpenClaw

  | Можливість OpenAI         | Поверхня OpenClaw                          | Статус                                                 |
  | ------------------------- | ----------------------------------------- | ------------------------------------------------------ |
  | Чат / Responses           | Постачальник моделей `openai/<model>`     | Так                                                    |
  | Моделі Codex subscription | `openai/<model>` з автентифікацією `openai-codex` | Так                                                    |
  | Вебпошук на стороні сервера    | Рідний інструмент OpenAI Responses        | Так, коли вебпошук увімкнено і постачальника не закріплено |
  | Зображення                | `image_generate`                          | Так                                                    |
  | Відео                     | `video_generate`                          | Так                                                    |
  | Перетворення тексту в мовлення | `messages.tts.provider: "openai"` / `tts` | Так                                                    |
  | Пакетне перетворення мовлення в текст | `tools.media.audio` / розуміння медіа | Так                                                    |
  | Потокове перетворення мовлення в текст | Voice Call `streaming.provider: "openai"` | Так                                                    |
  | Realtime voice            | Voice Call `realtime.provider: "openai"`  | Так                                                    |
  | Embeddings                | постачальник embedding для пам’яті        | Так                                                    |

  ## Початок роботи

  Виберіть бажаний спосіб автентифікації та виконайте кроки налаштування.

  <Tabs>
  <Tab title="API key (OpenAI Platform)">
    **Найкраще підходить для:** прямого доступу до API та білінгу за використання.

    <Steps>
      <Step title="Отримайте свій API key">
        Створіть або скопіюйте API key з [панелі керування OpenAI Platform](https://platform.openai.com/api-keys).
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

    ### Підсумок маршруту

    | Model ref | Маршрут | Автентифікація |
    |-----------|-------|------|
    | `openai/gpt-5.5` | Прямий API OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.5-pro` | Прямий API OpenAI Platform | `OPENAI_API_KEY` |

    <Note>
    `openai-codex/*` усе ще приймається як застарілий псевдонім сумісності, але нові конфігурації мають використовувати `openai/*`.
    </Note>

    ### Приклад конфігурації

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw **не** надає `openai/gpt-5.3-codex-spark` на шляху прямого API. Реальні запити до OpenAI API відхиляють цю модель. Spark доступний лише в Codex.
    </Warning>

  </Tab>

  <Tab title="Codex subscription">
    **Найкраще підходить для:** використання вашої підписки ChatGPT/Codex замість окремого API key. Codex cloud вимагає входу в ChatGPT.

    <Steps>
      <Step title="Запустіть Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Або запустіть OAuth безпосередньо:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Для headless або несумісних із callback налаштувань додайте `--device-code`, щоб увійти через потік коду пристрою ChatGPT замість callback браузера localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Встановіть модель за замовчуванням">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```
      </Step>
      <Step title="Переконайтеся, що модель доступна">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Підсумок маршруту

    | Model ref | Маршрут | Автентифікація |
    |-----------|-------|------|
    | `openai/gpt-5.5` | OAuth ChatGPT/Codex | вхід Codex |
    | `openai/gpt-5.3-codex-spark` | OAuth ChatGPT/Codex | вхід Codex (залежить від entitlement) |

    <Note>
    Посилання на моделі `openai-codex/*` і `codex/*` — це застарілі псевдоніми сумісності. Для команд автентифікації/профілю продовжуйте використовувати ідентифікатор постачальника `openai-codex`.
    </Note>

    ### Приклад конфігурації

    ```json5
    {
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Note>
    Онбординг більше не імпортує матеріали OAuth з `~/.codex`. Увійдіть через OAuth у браузері (типово) або через потік коду пристрою вище — OpenClaw керує отриманими обліковими даними у власному сховищі автентифікації агента.
    </Note>

    ### Обмеження вікна контексту

    OpenClaw розглядає метадані моделі та обмеження контексту під час виконання як окремі значення.

    Для `openai/gpt-5.5` через Codex OAuth:

- Власне `contextWindow`: `1000000`
- Типове обмеження `contextTokens` під час виконання: `272000`

Менше типове обмеження на практиці має кращі характеристики затримки та якості. Перевизначте його за допомогою `contextTokens`:

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
Використовуйте `contextWindow`, щоб оголосити власні метадані моделі. Використовуйте `contextTokens`, щоб обмежити бюджет контексту під час виконання.
</Note>

  </Tab>
</Tabs>

## Генерація зображень

Вбудований Plugin `openai` реєструє генерацію зображень через інструмент `image_generate`.

| Можливість                | Значення                           |
| ------------------------- | ---------------------------------- |
| Модель за замовчуванням   | `openai/gpt-image-2`               |
| Макс. кількість зображень на запит | 4                         |
| Режим редагування         | Увімкнено (до 5 еталонних зображень) |
| Перевизначення розміру    | Підтримується, зокрема розміри 2K/4K |
| Співвідношення сторін / роздільна здатність | Не передається до OpenAI Images API |

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
Див. [Генерація зображень](/uk/tools/image-generation) щодо спільних параметрів інструмента, вибору постачальника та поведінки резервного перемикання.
</Note>

`gpt-image-2` є типовим значенням як для генерації зображень із тексту OpenAI, так і для редагування зображень. `gpt-image-1` і далі можна використовувати як явне перевизначення моделі, але в нових робочих процесах зображень OpenAI слід використовувати `openai/gpt-image-2`.

Генерування:

```
/tool image_generate model=openai/gpt-image-2 prompt="Відполірований постер запуску OpenClaw на macOS" size=3840x2160 count=1
```

Редагування:

```
/tool image_generate model=openai/gpt-image-2 prompt="Збережи форму об’єкта, зміни матеріал на напівпрозоре скло" image=/path/to/reference.png size=1024x1536
```

## Генерація відео

Вбудований Plugin `openai` реєструє генерацію відео через інструмент `video_generate`.

| Можливість       | Значення                                                                            |
| ---------------- | ----------------------------------------------------------------------------------- |
| Модель за замовчуванням | `openai/sora-2`                                                             |
| Режими           | Текст у відео, зображення у відео, редагування одного відео                         |
| Еталонні вхідні дані | 1 зображення або 1 відео                                                          |
| Перевизначення розміру | Підтримується                                                                  |
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
Див. [Генерація відео](/uk/tools/video-generation) щодо спільних параметрів інструмента, вибору постачальника та поведінки резервного перемикання.
</Note>

## Внесок у промпт GPT-5

OpenClaw додає спільний внесок у промпт GPT-5 для запусків сімейства GPT-5 у різних постачальників. Він застосовується за ідентифікатором моделі, тому `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` та інші сумісні посилання GPT-5 отримують той самий оверлей. Старіші моделі GPT-4.x — ні.

Вбудований нативний harness Codex використовує ту саму поведінку GPT-5 і оверлей Heartbeat через інструкції розробника Codex app-server, тому сеанси `openai/gpt-5.x`, примусово спрямовані через `embeddedHarness.runtime: "codex"`, зберігають ту саму послідовність виконання та проактивні вказівки Heartbeat, навіть якщо рештою промпта harness керує Codex.

Внесок GPT-5 додає тегований контракт поведінки для збереження персони, безпеки виконання, дисципліни інструментів, форми виводу, перевірок завершення та верифікації. Специфічна для каналу поведінка відповіді та тихих повідомлень залишається у спільному системному промпті OpenClaw і політиці вихідної доставки. Вказівки GPT-5 завжди увімкнені для відповідних моделей. Шар дружнього стилю взаємодії є окремим і налаштовуваним.

| Значення              | Ефект                                         |
| --------------------- | --------------------------------------------- |
| `"friendly"` (типово) | Увімкнути шар дружнього стилю взаємодії       |
| `"on"`                | Псевдонім для `"friendly"`                    |
| `"off"`               | Вимкнути лише шар дружнього стилю             |

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
Під час виконання значення нечутливі до регістру, тому і `"Off"`, і `"off"` вимикають шар дружнього стилю.
</Tip>

<Note>
Застаріле `plugins.entries.openai.config.personality` усе ще зчитується як резервний варіант сумісності, коли спільне налаштування `agents.defaults.promptOverlays.gpt5.personality` не задано.
</Note>

## Голос і мовлення

<AccordionGroup>
  <Accordion title="Синтез мовлення (TTS)">
    Вбудований Plugin `openai` реєструє синтез мовлення для поверхні `messages.tts`.

    | Налаштування | Шлях конфігурації | Типове значення |
    |---------|------------|---------|
    | Модель | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Голос | `messages.tts.providers.openai.voice` | `coral` |
    | Швидкість | `messages.tts.providers.openai.speed` | (не задано) |
    | Інструкції | `messages.tts.providers.openai.instructions` | (не задано, лише `gpt-4o-mini-tts`) |
    | Формат | `messages.tts.providers.openai.responseFormat` | `opus` для голосових повідомлень, `mp3` для файлів |
    | API key | `messages.tts.providers.openai.apiKey` | Повертається до `OPENAI_API_KEY` |
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
    Установіть `OPENAI_TTS_BASE_URL`, щоб перевизначити базовий URL TTS без впливу на кінцеву точку API чату.
    </Note>

  </Accordion>

  <Accordion title="Перетворення мовлення в текст">
    Вбудований Plugin `openai` реєструє пакетне перетворення мовлення в текст через
    поверхню транскрибування розуміння медіа в OpenClaw.

    - Модель за замовчуванням: `gpt-4o-transcribe`
    - Кінцева точка: OpenAI REST `/v1/audio/transcriptions`
    - Вхідний шлях: multipart-завантаження аудіофайлу
    - Підтримується в OpenClaw скрізь, де транскрибування вхідного аудіо використовує
      `tools.media.audio`, зокрема сегменти голосового каналу Discord і аудіовкладення
      каналу

    Щоб примусово використовувати OpenAI для транскрибування вхідного аудіо:

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

    Підказки мови та промпта передаються до OpenAI, коли їх указано в
    спільній конфігурації аудіомедіа або в запиті транскрибування для конкретного виклику.

  </Accordion>

  <Accordion title="Транскрибування в реальному часі">
    Вбудований Plugin `openai` реєструє транскрибування в реальному часі для Plugin Voice Call.

    | Налаштування | Шлях конфігурації | Типове значення |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Мова | `...openai.language` | (не задано) |
    | Промпт | `...openai.prompt` | (не задано) |
    | Тривалість тиші | `...openai.silenceDurationMs` | `800` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | API key | `...openai.apiKey` | Повертається до `OPENAI_API_KEY` |

    <Note>
    Використовує WebSocket-з’єднання з `wss://api.openai.com/v1/realtime` з аудіо G.711 u-law (`g711_ulaw` / `audio/pcmu`). Цей потоковий постачальник призначений для шляху транскрибування в реальному часі Plugin Voice Call; голос у Discord наразі записує короткі сегменти й натомість використовує пакетний шлях транскрибування `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Голос у реальному часі">
    Вбудований Plugin `openai` реєструє голос у реальному часі для Plugin Voice Call.

    | Налаштування | Шлях конфігурації | Типове значення |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Голос | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | Тривалість тиші | `...openai.silenceDurationMs` | `500` |
    | API key | `...openai.apiKey` | Повертається до `OPENAI_API_KEY` |

    <Note>
    Підтримує Azure OpenAI через ключі конфігурації `azureEndpoint` і `azureDeployment`. Підтримує двобічний виклик інструментів. Використовує формат аудіо G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Кінцеві точки Azure OpenAI

Вбудований постачальник `openai` може націлюватися на ресурс Azure OpenAI для
генерації зображень шляхом перевизначення базового URL. На шляху генерації
зображень OpenClaw визначає імена хостів Azure у `models.providers.openai.baseUrl` і автоматично перемикається на
форму запиту Azure.

<Note>
Голос у реальному часі використовує окремий шлях конфігурації
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
і не залежить від `models.providers.openai.baseUrl`. Див. акордеон **Голос
у реальному часі** в розділі [Голос і мовлення](#voice-and-speech) щодо його налаштувань
Azure.
</Note>

Використовуйте Azure OpenAI, коли:

- У вас уже є підписка Azure OpenAI, квота або корпоративна угода
- Вам потрібне регіональне зберігання даних або засоби відповідності вимогам, які надає Azure
- Ви хочете зберегти трафік у межах наявного tenancy Azure

### Конфігурація

Для генерації зображень Azure через вбудованого постачальника `openai` вкажіть
`models.providers.openai.baseUrl` на ваш ресурс Azure і встановіть `apiKey` як
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

OpenClaw розпізнає такі суфікси хостів Azure для маршруту генерації
зображень Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Для запитів генерації зображень на розпізнаному хості Azure OpenClaw:

- Надсилає заголовок `api-key` замість `Authorization: Bearer`
- Використовує шляхи в межах deployment (`/openai/deployments/{deployment}/...`)
- Додає `?api-version=...` до кожного запиту

Для інших базових URL (публічний OpenAI, сумісні з OpenAI проксі) зберігається стандартна
форма запиту зображень OpenAI.

<Note>
Маршрутизація Azure для шляху генерації зображень постачальника `openai`
вимагає OpenClaw 2026.4.22 або новішої версії. Старіші версії обробляють будь-який власний
`openai.baseUrl` як публічну кінцеву точку OpenAI і не працюватимуть із deployment
зображень Azure.
</Note>

### Версія API

Установіть `AZURE_OPENAI_API_VERSION`, щоб зафіксувати конкретну preview- або GA-версію Azure
для шляху генерації зображень Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Типове значення — `2024-12-01-preview`, коли змінна не задана.

### Імена моделей — це імена deployment

Azure OpenAI прив’язує моделі до deployment. Для запитів генерації зображень Azure,
маршрутизованих через вбудованого постачальника `openai`, поле `model` в OpenClaw
має бути **іменем deployment Azure**, яке ви налаштували в порталі Azure, а не
публічним ідентифікатором моделі OpenAI.

Якщо ви створите deployment з назвою `gpt-image-2-prod`, який обслуговує `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="Чистий постер" size=1024x1024 count=1
```

Те саме правило імен deployment застосовується до викликів генерації зображень,
маршрутизованих через вбудованого постачальника `openai`.

### Регіональна доступність

Генерація зображень Azure наразі доступна лише в підмножині регіонів
(наприклад, `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Перевірте актуальний список регіонів Microsoft перед створенням
deployment і підтвердьте, що конкретна модель пропонується у вашому регіоні.

### Відмінності параметрів

Azure OpenAI і публічний OpenAI не завжди приймають однакові параметри зображень.
Azure може відхиляти параметри, які дозволяє публічний OpenAI (наприклад, певні
значення `background` для `gpt-image-2`) або надавати їх лише в конкретних версіях
моделі. Ці відмінності походять від Azure і базової моделі, а не від
OpenClaw. Якщо запит Azure завершується помилкою валідації, перевірте
набір параметрів, які підтримуються вашим конкретним deployment і версією API в
порталі Azure.

<Note>
Azure OpenAI використовує нативний транспорт і поведінку compat, але не отримує
приховані заголовки атрибуції OpenClaw — див. акордеон **Нативні та OpenAI-compatible
маршрути** в розділі [Розширена конфігурація](#advanced-configuration).

Для трафіку чату або Responses на Azure (поза генерацією зображень) використовуйте
потік онбордингу або окрему конфігурацію постачальника Azure — лише `openai.baseUrl`
не підхоплює форму API/автентифікації Azure. Існує окремий постачальник
`azure-openai-responses/*`; див.
акордеон Server-side compaction нижче.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Транспорт (WebSocket vs SSE)">
    OpenClaw використовує WebSocket-first із резервним переходом на SSE (`"auto"`) як для `openai/*`, так і для `openai-codex/*`.

    У режимі `"auto"` OpenClaw:
    - Повторює одну ранню помилку WebSocket перед переходом на SSE
    - Після помилки позначає WebSocket як деградований приблизно на 60 секунд і використовує SSE під час охолодження
    - Додає стабільні заголовки ідентичності сеансу й ходу для повторних спроб і повторних підключень
    - Нормалізує лічильники використання (`input_tokens` / `prompt_tokens`) між варіантами транспорту

    | Значення | Поведінка |
    |-------|----------|
    | `"auto"` (типово) | Спочатку WebSocket, резервний перехід на SSE |
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

    Пов’язані документи OpenAI:
    - [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Попередній прогрів WebSocket">
    OpenClaw типово вмикає попередній прогрів WebSocket для `openai/*`, щоб зменшити затримку першого ходу.

    ```json5
    // Вимкнути попередній прогрів
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

  <Accordion title="Швидкий режим">
    OpenClaw надає спільний перемикач швидкого режиму для `openai/*`:

    - **Чат/UI:** `/fast status|on|off`
    - **Конфігурація:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Коли ввімкнено, OpenClaw відображає швидкий режим у пріоритетну обробку OpenAI (`service_tier = "priority"`). Наявні значення `service_tier` зберігаються, і швидкий режим не переписує `reasoning` або `text.verbosity`.

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
    Перевизначення сеансу мають пріоритет над конфігурацією. Очищення перевизначення сеансу в UI Sessions повертає сеанс до налаштованого типового значення.
    </Note>

  </Accordion>

  <Accordion title="Пріоритетна обробка (service_tier)">
    API OpenAI надає пріоритетну обробку через `service_tier`. Установіть її для кожної моделі в OpenClaw:

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
    `serviceTier` передається лише до нативних кінцевих точок OpenAI (`api.openai.com`) і нативних кінцевих точок Codex (`chatgpt.com/backend-api`). Якщо ви маршрутизуєте будь-якого з цих постачальників через проксі, OpenClaw залишає `service_tier` без змін.
    </Warning>

  </Accordion>

  <Accordion title="Server-side Compaction (Responses API)">
    Для прямих моделей OpenAI Responses (`openai/*` на `api.openai.com`) OpenClaw автоматично вмикає Server-side Compaction:

    - Примусово встановлює `store: true` (якщо compat моделі не задає `supportsStore: false`)
    - Вставляє `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Типове `compact_threshold`: 70% від `contextWindow` (або `80000`, якщо він недоступний)

    <Tabs>
      <Tab title="Явно ввімкнути">
        Корисно для сумісних кінцевих точок, як-от Azure OpenAI Responses:

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
      <Tab title="Власний поріг">
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
    `responsesServerCompaction` керує лише вставленням `context_management`. Прямі моделі OpenAI Responses і далі примусово встановлюють `store: true`, якщо compat не задає `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Суворий агентний режим GPT">
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

    З `strict-agentic` OpenClaw:
    - Більше не вважає хід лише з планом успішним прогресом, коли доступна дія інструмента
    - Повторює хід із вказівкою діяти негайно
    - Автоматично вмикає `update_plan` для суттєвої роботи
    - Показує явний стан блокування, якщо модель продовжує планувати без дії

    <Note>
    Обмежено лише запусками сімейства GPT-5 OpenAI і Codex. Інші постачальники та старіші сімейства моделей зберігають типову поведінку.
    </Note>

  </Accordion>

  <Accordion title="Нативні та OpenAI-compatible маршрути">
    OpenClaw по-різному обробляє прямі кінцеві точки OpenAI, Codex і Azure OpenAI та загальні OpenAI-compatible проксі `/v1`:

    **Нативні маршрути** (`openai/*`, Azure OpenAI):
    - Зберігають `reasoning: { effort: "none" }` лише для моделей, які підтримують OpenAI effort `none`
    - Пропускають вимкнене reasoning для моделей або проксі, які відхиляють `reasoning.effort: "none"`
    - Типово встановлюють strict mode для схем інструментів
    - Додають приховані заголовки атрибуції лише на перевірених нативних хостах
    - Зберігають формування запитів, специфічне для OpenAI (`service_tier`, `store`, compat reasoning, підказки кешу промпта)

    **Маршрути proxy/compatible:**
    - Використовують м’якшу поведінку compat
    - Не примушують strict mode для схем інструментів або нативні заголовки

    Azure OpenAI використовує нативний транспорт і поведінку compat, але не отримує прихованих заголовків атрибуції.

  </Accordion>
</AccordionGroup>

## Пов’язано

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір постачальників, посилань на моделі та поведінки резервного перемикання.
  </Card>
  <Card title="Генерація зображень" href="/uk/tools/image-generation" icon="image">
    Спільні параметри інструмента зображень і вибір постачальника.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента відео і вибір постачальника.
  </Card>
  <Card title="OAuth і автентифікація" href="/uk/gateway/authentication" icon="key">
    Подробиці автентифікації та правила повторного використання облікових даних.
  </Card>
</CardGroup>
