---
read_when:
    - Ви хочете використовувати моделі OpenAI в OpenClaw
    - Ви хочете автентифікацію через підписку Codex замість API-ключів
    - Вам потрібні суворіші правила виконання агентів GPT-5
summary: Використовуйте OpenAI через API-ключі або підписку Codex в OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-23T12:50:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: ac42660234e1971440f6de3b04adb1d3a1fddca20219fb68936c36e4c2f95265
    source_path: providers/openai.md
    workflow: 15
---

  # OpenAI

  OpenAI надає API для розробників для моделей GPT. OpenClaw підтримує два способи автентифікації:

  - **API-ключ** — прямий доступ до OpenAI Platform з оплатою за використання (моделі `openai/*`)
  - **Підписка Codex** — вхід через ChatGPT/Codex із доступом за підпискою (моделі `openai-codex/*`)

  OpenAI явно підтримує використання OAuth підписки у зовнішніх інструментах і робочих процесах, таких як OpenClaw.

  ## Підтримка можливостей OpenClaw

  | Можливість OpenAI         | Поверхня OpenClaw                         | Статус                                                 |
  | ------------------------- | ----------------------------------------- | ------------------------------------------------------ |
  | Чат / Responses           | Провайдер моделей `openai/<model>`        | Так                                                    |
  | Моделі підписки Codex     | Провайдер моделей `openai-codex/<model>`  | Так                                                    |
  | Вебпошук на стороні сервера | Нативний інструмент OpenAI Responses    | Так, коли вебпошук увімкнено й провайдера не зафіксовано |
  | Зображення                | `image_generate`                          | Так                                                    |
  | Відео                     | `video_generate`                          | Так                                                    |
  | Перетворення тексту на мовлення | `messages.tts.provider: "openai"` / `tts` | Так                                              |
  | Пакетне перетворення мовлення на текст | `tools.media.audio` / розуміння медіа | Так                                         |
  | Потокове перетворення мовлення на текст | Voice Call `streaming.provider: "openai"` | Так                                  |
  | Голос у реальному часі    | Voice Call `realtime.provider: "openai"`  | Так                                                    |
  | Embeddings                | провайдер embedding для пам’яті           | Так                                                    |

  ## Початок роботи

  Виберіть бажаний спосіб автентифікації та виконайте кроки налаштування.

  <Tabs>
  <Tab title="API-ключ (OpenAI Platform)">
    **Найкраще для:** прямого доступу до API та оплати за використання.

    <Steps>
      <Step title="Отримайте свій API-ключ">
        Створіть або скопіюйте API-ключ на [панелі керування OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Запустіть онбординг">
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

    ### Підсумок маршруту

    | Посилання на модель | Маршрут | Автентифікація |
    |-----------|-------|------|
    | `openai/gpt-5.4` | Прямий API OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-pro` | Прямий API OpenAI Platform | `OPENAI_API_KEY` |

    <Note>
    Вхід через ChatGPT/Codex маршрутизується через `openai-codex/*`, а не через `openai/*`.
    </Note>

    ### Приклад конфігурації

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw **не** надає `openai/gpt-5.3-codex-spark` через шлях прямого API. Реальні запити до OpenAI API відхиляють цю модель. Spark доступний лише в Codex.
    </Warning>

  </Tab>

  <Tab title="Підписка Codex">
    **Найкраще для:** використання вашої підписки ChatGPT/Codex замість окремого API-ключа. Codex cloud потребує входу через ChatGPT.

    <Steps>
      <Step title="Запустіть Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Або запустіть OAuth напряму:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Для headless-середовищ або конфігурацій, де callback працює нестабільно, додайте `--device-code`, щоб увійти через потік device-code ChatGPT замість callback localhost у браузері:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Установіть модель за замовчуванням">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.4
        ```
      </Step>
      <Step title="Перевірте, що модель доступна">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Підсумок маршруту

    | Посилання на модель | Маршрут | Автентифікація |
    |-----------|-------|------|
    | `openai-codex/gpt-5.4` | ChatGPT/Codex OAuth | Вхід Codex |
    | `openai-codex/gpt-5.3-codex-spark` | ChatGPT/Codex OAuth | Вхід Codex (залежить від entitlement) |

    <Note>
    Цей маршрут навмисно відокремлений від `openai/gpt-5.4`. Використовуйте `openai/*` з API-ключем для прямого доступу до Platform, а `openai-codex/*` — для доступу через підписку Codex.
    </Note>

    ### Приклад конфігурації

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
    }
    ```

    <Note>
    Онбординг більше не імпортує OAuth-матеріали з `~/.codex`. Увійдіть через OAuth у браузері (типово) або через потік device-code вище — OpenClaw керує отриманими обліковими даними у власному сховищі автентифікації агента.
    </Note>

    ### Обмеження вікна контексту

    OpenClaw розглядає метадані моделі та обмеження контексту під час виконання як окремі значення.

    Для `openai-codex/gpt-5.4`:

    - Власне `contextWindow`: `1050000`
    - Типове обмеження `contextTokens` під час виконання: `272000`

    Менше типове обмеження на практиці дає кращі характеристики затримки та якості. Замініть його через `contextTokens`:

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
    Використовуйте `contextWindow`, щоб оголосити власні метадані моделі. Використовуйте `contextTokens`, щоб обмежити бюджет контексту під час виконання.
    </Note>

  </Tab>
</Tabs>

## Генерація зображень

Вбудований Plugin `openai` реєструє генерацію зображень через інструмент `image_generate`.

| Можливість              | Значення                           |
| ----------------------- | ---------------------------------- |
| Типова модель           | `openai/gpt-image-2`               |
| Макс. кількість зображень на запит | 4                        |
| Режим редагування       | Увімкнено (до 5 еталонних зображень) |
| Перевизначення розміру  | Підтримується, зокрема розміри 2K/4K |
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
Див. [Генерація зображень](/uk/tools/image-generation) щодо спільних параметрів інструмента, вибору провайдера та поведінки failover.
</Note>

`gpt-image-2` є типовим значенням як для генерації зображень з тексту в OpenAI, так і для редагування зображень. `gpt-image-1` і далі можна використовувати як явне перевизначення моделі, але нові робочі процеси OpenAI для зображень мають використовувати `openai/gpt-image-2`.

Згенерувати:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Редагувати:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Генерація відео

Вбудований Plugin `openai` реєструє генерацію відео через інструмент `video_generate`.

| Можливість     | Значення                                                                        |
| -------------- | ------------------------------------------------------------------------------- |
| Типова модель  | `openai/sora-2`                                                                 |
| Режими         | Текст у відео, зображення у відео, редагування одного відео                     |
| Еталонні входи | 1 зображення або 1 відео                                                        |
| Перевизначення розміру | Підтримується                                                            |
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
Див. [Генерація відео](/uk/tools/video-generation) щодо спільних параметрів інструмента, вибору провайдера та поведінки failover.
</Note>

## Внесок у prompt для GPT-5

OpenClaw додає спільний внесок у prompt для GPT-5 для запусків сімейства GPT-5 у різних провайдерів. Він застосовується за ідентифікатором моделі, тому `openai/gpt-5.4`, `openai-codex/gpt-5.4`, `openrouter/openai/gpt-5.4`, `opencode/gpt-5.4` та інші сумісні посилання на GPT-5 отримують однакове накладання. Старіші моделі GPT-4.x цього не отримують.

Вбудований провайдер нативного harness Codex (`codex/*`) використовує таку саму поведінку GPT-5 і накладання Heartbeat через інструкції розробника сервера застосунку Codex, тож сеанси `codex/gpt-5.x` зберігають такий самий супровід, проактивний Heartbeat і відповідні вказівки, навіть попри те, що рештою prompt harness керує Codex.

Внесок GPT-5 додає тегований контракт поведінки для збереження персони, безпеки виконання, дисципліни інструментів, форми виводу, перевірок завершення та верифікації. Специфічна для каналу поведінка відповіді та тихих повідомлень залишається у спільному системному prompt OpenClaw і політиці вихідної доставки. Вказівки GPT-5 завжди ввімкнені для відповідних моделей. Рівень дружнього стилю взаємодії є окремим і налаштовується.

| Значення               | Ефект                                      |
| ---------------------- | ------------------------------------------ |
| `"friendly"` (типово)  | Увімкнути рівень дружнього стилю взаємодії |
| `"on"`                 | Псевдонім для `"friendly"`                 |
| `"off"`                | Вимкнути лише рівень дружнього стилю       |

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
Під час виконання значення нечутливі до регістру, тож і `"Off"`, і `"off"` вимикають рівень дружнього стилю.
</Tip>

<Note>
Застаріле `plugins.entries.openai.config.personality` і далі зчитується як резервний варіант сумісності, коли спільне налаштування `agents.defaults.promptOverlays.gpt5.personality` не задане.
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
    | Формат | `messages.tts.providers.openai.responseFormat` | `opus` для голосових нотаток, `mp3` для файлів |
    | API-ключ | `messages.tts.providers.openai.apiKey` | Резервно використовується `OPENAI_API_KEY` |
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
    Установіть `OPENAI_TTS_BASE_URL`, щоб перевизначити базовий URL для TTS, не впливаючи на кінцеву точку API чату.
    </Note>

  </Accordion>

  <Accordion title="Перетворення мовлення на текст">
    Вбудований Plugin `openai` реєструє пакетне перетворення мовлення на текст через
    поверхню транскрибування для розуміння медіа в OpenClaw.

    - Типова модель: `gpt-4o-transcribe`
    - Кінцева точка: OpenAI REST `/v1/audio/transcriptions`
    - Шлях введення: multipart-завантаження аудіофайлу
    - Підтримується в OpenClaw всюди, де транскрибування вхідного аудіо використовує
      `tools.media.audio`, зокрема в сегментах голосових каналів Discord і
      аудіовкладеннях каналів

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

    Підказки щодо мови та prompt передаються до OpenAI, коли вони задані
    у спільній конфігурації аудіомедіа або в запиті транскрибування для конкретного виклику.

  </Accordion>

  <Accordion title="Транскрибування в реальному часі">
    Вбудований Plugin `openai` реєструє транскрибування в реальному часі для Plugin Voice Call.

    | Налаштування | Шлях конфігурації | Типове значення |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Мова | `...openai.language` | (не задано) |
    | Prompt | `...openai.prompt` | (не задано) |
    | Тривалість тиші | `...openai.silenceDurationMs` | `800` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | API-ключ | `...openai.apiKey` | Резервно використовується `OPENAI_API_KEY` |

    <Note>
    Використовує WebSocket-з’єднання з `wss://api.openai.com/v1/realtime` з аудіо у форматі G.711 u-law (`g711_ulaw` / `audio/pcmu`). Цей провайдер потокової передачі призначений для шляху транскрибування в реальному часі у Voice Call; голос у Discord наразі записує короткі сегменти та натомість використовує шлях пакетного транскрибування `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Голос у реальному часі">
    Вбудований Plugin `openai` реєструє голос у реальному часі для Plugin Voice Call.

    | Налаштування | Шлях конфігурації | Типове значення |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime` |
    | Голос | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | Тривалість тиші | `...openai.silenceDurationMs` | `500` |
    | API-ключ | `...openai.apiKey` | Резервно використовується `OPENAI_API_KEY` |

    <Note>
    Підтримує Azure OpenAI через ключі конфігурації `azureEndpoint` і `azureDeployment`. Підтримує двонапрямлений виклик інструментів. Використовує аудіоформат G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Кінцеві точки Azure OpenAI

Вбудований провайдер `openai` може спрямовувати генерацію зображень до ресурсу Azure OpenAI
через перевизначення базового URL. На шляху генерації зображень OpenClaw
виявляє імена хостів Azure в `models.providers.openai.baseUrl` і автоматично перемикається
на формат запиту Azure.

<Note>
Голос у реальному часі використовує окремий шлях конфігурації
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
і на нього не впливає `models.providers.openai.baseUrl`. Див. акордеон **Голос
у реальному часі** в розділі [Голос і мовлення](#voice-and-speech) щодо його налаштувань
Azure.
</Note>

Використовуйте Azure OpenAI, коли:

- У вас уже є підписка Azure OpenAI, квота або корпоративна угода
- Вам потрібні регіональне зберігання даних або елементи контролю відповідності, які надає Azure
- Ви хочете зберегти трафік в межах наявного середовища Azure

### Конфігурація

Для генерації зображень через Azure за допомогою вбудованого провайдера `openai` вкажіть
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

OpenClaw розпізнає такі суфікси хостів Azure для маршруту генерації зображень Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Для запитів генерації зображень на розпізнаному хості Azure OpenClaw:

- Надсилає заголовок `api-key` замість `Authorization: Bearer`
- Використовує шляхи, прив’язані до розгортання (`/openai/deployments/{deployment}/...`)
- Додає `?api-version=...` до кожного запиту

Інші базові URL (публічний OpenAI, OpenAI-сумісні проксі) зберігають стандартний
формат запиту OpenAI для зображень.

<Note>
Маршрутизація Azure для шляху генерації зображень провайдера `openai`
потребує OpenClaw 2026.4.22 або новішої версії. Попередні версії трактують будь-який
власний `openai.baseUrl` як публічну кінцеву точку OpenAI і не працюватимуть з Azure
розгортаннями генерації зображень.
</Note>

### Версія API

Установіть `AZURE_OPENAI_API_VERSION`, щоб зафіксувати конкретну preview- або GA-версію Azure
для шляху генерації зображень Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Типове значення — `2024-12-01-preview`, якщо змінну не задано.

### Імена моделей — це імена розгортань

Azure OpenAI прив’язує моделі до розгортань. Для запитів генерації зображень Azure,
маршрутизованих через вбудований провайдер `openai`, поле `model` в OpenClaw
має бути **іменем розгортання Azure**, яке ви налаштували в порталі Azure, а не
публічним ідентифікатором моделі OpenAI.

Якщо ви створили розгортання з назвою `gpt-image-2-prod`, яке обслуговує `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Те саме правило щодо імені розгортання застосовується до викликів генерації зображень,
маршрутизованих через вбудований провайдер `openai`.

### Регіональна доступність

Генерація зображень Azure наразі доступна лише в частині регіонів
(наприклад, `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Перед створенням
розгортання перевірте актуальний список регіонів Microsoft і підтвердьте, що конкретна модель пропонується у вашому регіоні.

### Відмінності параметрів

Azure OpenAI і публічний OpenAI не завжди приймають однакові параметри зображень.
Azure може відхиляти параметри, які допускає публічний OpenAI (наприклад, певні
значення `background` для `gpt-image-2`), або надавати їх лише для певних версій
моделі. Ці відмінності походять від Azure та базової моделі, а не від
OpenClaw. Якщо запит Azure завершується помилкою валідації, перевірте
набір параметрів, які підтримує ваше конкретне розгортання та версія API, у
порталі Azure.

<Note>
Azure OpenAI використовує нативну транспортну та compat-поведінку, але не отримує
приховані заголовки атрибуції OpenClaw. Див. акордеон **Нативні та OpenAI-сумісні
маршрути** в розділі [Розширена конфігурація](#advanced-configuration)
для деталей.
</Note>

<Tip>
Щодо окремого провайдера Azure OpenAI Responses (відмінного від провайдера `openai`)
див. посилання на моделі `azure-openai-responses/*` в акордеоні
[Compaction на стороні сервера](#server-side-compaction-responses-api).
</Tip>

<Note>
Трафік Azure chat і Responses потребує специфічної для Azure конфігурації провайдера/API на
додаток до перевизначення базового URL. Якщо вам потрібні виклики моделей Azure не лише для генерації
зображень, використовуйте потік онбордингу або конфігурацію провайдера, яка задає
відповідний формат API/автентифікації Azure, а не припускайте, що лише `openai.baseUrl` достатньо.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Транспорт (WebSocket проти SSE)">
    OpenClaw використовує WebSocket-first із резервним переходом на SSE (`"auto"`) як для `openai/*`, так і для `openai-codex/*`.

    У режимі `"auto"` OpenClaw:
    - Повторює одну ранню помилку WebSocket перед переходом на SSE
    - Після помилки позначає WebSocket як деградований приблизно на 60 секунд і використовує SSE під час цього періоду охолодження
    - Додає стабільні заголовки ідентичності сеансу та ходу для повторних спроб і повторних підключень
    - Нормалізує лічильники використання (`input_tokens` / `prompt_tokens`) між варіантами транспорту

    | Значення | Поведінка |
    |-------|----------|
    | `"auto"` (типово) | Спочатку WebSocket, потім резервний перехід на SSE |
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
    OpenClaw типово вмикає попередній прогрів WebSocket для `openai/*`, щоб зменшити затримку першого ходу.

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

<a id="openai-fast-mode"></a>

  <Accordion title="Швидкий режим">
    OpenClaw надає спільний перемикач швидкого режиму як для `openai/*`, так і для `openai-codex/*`:

    - **Чат/UI:** `/fast status|on|off`
    - **Конфігурація:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Якщо ввімкнено, OpenClaw зіставляє швидкий режим із пріоритетною обробкою OpenAI (`service_tier = "priority"`). Наявні значення `service_tier` зберігаються, а швидкий режим не переписує `reasoning` або `text.verbosity`.

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
    Перевизначення сеансу мають пріоритет над конфігурацією. Очищення перевизначення сеансу в UI сеансів повертає сеанс до налаштованого типового значення.
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

  <Accordion title="Compaction на стороні сервера (Responses API)">
    Для прямих моделей OpenAI Responses (`openai/*` на `api.openai.com`) OpenClaw автоматично вмикає Compaction на стороні сервера:

    - Примусово встановлює `store: true` (якщо compat моделі не задає `supportsStore: false`)
    - Вставляє `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Типове значення `compact_threshold`: 70% від `contextWindow` (або `80000`, якщо значення недоступне)

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
    `responsesServerCompaction` керує лише вставленням `context_management`. Прямі моделі OpenAI Responses усе одно примусово встановлюють `store: true`, якщо compat не задає `supportsStore: false`.
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

    З `strict-agentic` OpenClaw:
    - Більше не вважає хід лише з планом успішним прогресом, коли доступна дія інструмента
    - Повторює хід із вказівкою діяти зараз
    - Автоматично вмикає `update_plan` для суттєвої роботи
    - Показує явний заблокований стан, якщо модель продовжує планувати без дії

    <Note>
    Поширюється лише на запуски OpenAI і Codex сімейства GPT-5. Для інших провайдерів і старіших сімейств моделей зберігається типова поведінка.
    </Note>

  </Accordion>

  <Accordion title="Нативні та OpenAI-сумісні маршрути">
    OpenClaw по-різному обробляє прямі кінцеві точки OpenAI, Codex і Azure OpenAI порівняно із загальними OpenAI-сумісними проксі `/v1`:

    **Нативні маршрути** (`openai/*`, `openai-codex/*`, Azure OpenAI):
    - Зберігають `reasoning: { effort: "none" }` лише для моделей, які підтримують OpenAI `none` effort
    - Пропускають вимкнений reasoning для моделей або проксі, які відхиляють `reasoning.effort: "none"`
    - Типово використовують строгий режим для схем інструментів
    - Додають приховані заголовки атрибуції лише на перевірених нативних хостах
    - Зберігають форматування запитів, властиве лише OpenAI (`service_tier`, `store`, reasoning-compat, підказки кешу prompt)

    **Проксі/сумісні маршрути:**
    - Використовують менш сувору compat-поведінку
    - Не примусово вмикають строгі схеми інструментів або заголовки, притаманні лише нативним маршрутам

    Azure OpenAI використовує нативну транспортну та compat-поведінку, але не отримує приховані заголовки атрибуції.

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
    Відомості про автентифікацію та правила повторного використання облікових даних.
  </Card>
</CardGroup>
