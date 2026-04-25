---
read_when:
    - Ви хочете використовувати моделі OpenAI в OpenClaw
    - Ви хочете автентифікацію через підписку Codex замість ключів API
    - Вам потрібна суворіша поведінка виконання агента GPT-5
summary: Використовуйте OpenAI через ключі API або підписку Codex в OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-25T17:33:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f099227b8c8be3a4e919ea286fcede1e4e47be60c7593eb63b4cbbe85aa8389
    source_path: providers/openai.md
    workflow: 15
---

OpenAI надає API для розробників для моделей GPT. OpenClaw підтримує три маршрути сімейства OpenAI. Префікс моделі визначає маршрут:

- **Ключ API** — прямий доступ до OpenAI Platform з оплатою за використання (моделі `openai/*`)
- **Підписка Codex через PI** — вхід через ChatGPT/Codex із доступом за підпискою (моделі `openai-codex/*`)
- **Harness app-server Codex** — нативне виконання через app-server Codex (моделі `openai/*` плюс `agents.defaults.embeddedHarness.runtime: "codex"`)

OpenAI явно підтримує використання OAuth-підписки у зовнішніх інструментах і робочих процесах на кшталт OpenClaw.

Провайдер, модель, runtime і канал — це окремі шари. Якщо ці мітки
плутаються між собою, прочитайте [Agent runtimes](/uk/concepts/agent-runtimes), перш ніж
змінювати конфігурацію.

## Швидкий вибір

| Ціль                                          | Використовуйте                                           | Примітки                                                                     |
| --------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Пряма оплата через ключ API                   | `openai/gpt-5.5`                                         | Установіть `OPENAI_API_KEY` або запустіть onboarding ключа API OpenAI.       |
| GPT-5.5 з автентифікацією через підписку ChatGPT/Codex | `openai-codex/gpt-5.5`                                   | Стандартний маршрут PI для Codex OAuth. Найкращий перший вибір для конфігурацій із підпискою. |
| GPT-5.5 з нативною поведінкою app-server Codex | `openai/gpt-5.5` плюс `embeddedHarness.runtime: "codex"` | Примусово використовує harness app-server Codex для цього посилання моделі.  |
| Генерація або редагування зображень           | `openai/gpt-image-2`                                     | Працює або з `OPENAI_API_KEY`, або з OpenAI Codex OAuth.                     |

<Note>
GPT-5.5 доступна як через прямий доступ до OpenAI Platform API за ключем,
так і через маршрути підписки/OAuth. Використовуйте `openai/gpt-5.5` для прямого трафіку
через `OPENAI_API_KEY`, `openai-codex/gpt-5.5` для Codex OAuth через PI, або
`openai/gpt-5.5` з `embeddedHarness.runtime: "codex"` для нативного harness
app-server Codex.
</Note>

<Note>
Увімкнення плагіна OpenAI або вибір моделі `openai-codex/*` не
вмикає вбудований плагін app-server Codex. OpenClaw вмикає цей плагін лише
коли ви явно вибираєте нативний harness Codex через
`embeddedHarness.runtime: "codex"` або використовуєте застаріле посилання моделі `codex/*`.
</Note>

## Покриття можливостей OpenClaw

| Можливість OpenAI          | Поверхня OpenClaw                                         | Статус                                                 |
| -------------------------- | --------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses           | провайдер моделі `openai/<model>`                         | Так                                                    |
| Моделі підписки Codex      | `openai-codex/<model>` з OAuth `openai-codex`             | Так                                                    |
| Harness app-server Codex   | `openai/<model>` з `embeddedHarness.runtime: codex`       | Так                                                    |
| Пошук у вебі на стороні сервера | нативний інструмент OpenAI Responses                  | Так, коли вебпошук увімкнено і не закріплено провайдера |
| Зображення                 | `image_generate`                                          | Так                                                    |
| Відео                      | `video_generate`                                          | Так                                                    |
| Перетворення тексту в мовлення | `messages.tts.provider: "openai"` / `tts`              | Так                                                    |
| Пакетне перетворення мовлення в текст | `tools.media.audio` / розуміння медіа          | Так                                                    |
| Потокове перетворення мовлення в текст | Voice Call `streaming.provider: "openai"`      | Так                                                    |
| Голос у реальному часі     | Voice Call `realtime.provider: "openai"` / Control UI Talk | Так                                                   |
| Embeddings                 | провайдер embedding для памʼяті                           | Так                                                    |

## Початок роботи

Виберіть бажаний метод автентифікації та виконайте кроки налаштування.

<Tabs>
  <Tab title="Ключ API (OpenAI Platform)">
    **Найкраще для:** прямого доступу до API та оплати за використання.

    <Steps>
      <Step title="Отримайте свій ключ API">
        Створіть або скопіюйте ключ API з [панелі OpenAI Platform](https://platform.openai.com/api-keys).
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
      <Step title="Переконайтеся, що модель доступна">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Зведення маршрутів

    | Посилання моделі | Маршрут | Автентифікація |
    |-----------|-------|------|
    | `openai/gpt-5.5` | Прямий API OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini` | Прямий API OpenAI Platform | `OPENAI_API_KEY` |

    <Note>
    `openai/*` — це прямий маршрут OpenAI за ключем API, якщо ви явно не
    примусите harness app-server Codex. Використовуйте `openai-codex/*` для Codex OAuth через
    стандартний runner PI, або використовуйте `openai/gpt-5.5` з
    `embeddedHarness.runtime: "codex"` для нативного виконання через app-server Codex.
    </Note>

    ### Приклад конфігурації

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw **не** надає `openai/gpt-5.3-codex-spark`. Живі запити до OpenAI API відхиляють цю модель, і поточний каталог Codex також її не надає.
    </Warning>

  </Tab>

  <Tab title="Підписка Codex">
    **Найкраще для:** використання вашої підписки ChatGPT/Codex замість окремого ключа API. Codex cloud вимагає входу через ChatGPT.

    <Steps>
      <Step title="Запустіть Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Або запустіть OAuth напряму:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Для headless або несприятливих до callback конфігурацій додайте `--device-code`, щоб увійти через потік device-code ChatGPT замість callback браузера localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Установіть модель за замовчуванням">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
        ```
      </Step>
      <Step title="Переконайтеся, що модель доступна">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Зведення маршрутів

    | Посилання моделі | Маршрут | Автентифікація |
    |-----------|-------|------|
    | `openai-codex/gpt-5.5` | ChatGPT/Codex OAuth через PI | Вхід Codex |
    | `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Harness app-server Codex | Автентифікація app-server Codex |

    <Note>
    Продовжуйте використовувати id провайдера `openai-codex` для команд auth/profile. Префікс моделі
    `openai-codex/*` також є явним маршрутом PI для Codex OAuth.
    Він не вибирає і не вмикає автоматично вбудований harness app-server Codex.
    </Note>

    ### Приклад конфігурації

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    Onboarding більше не імпортує матеріали OAuth з `~/.codex`. Увійдіть через OAuth у браузері (за замовчуванням) або через наведений вище потік device-code — OpenClaw керує отриманими обліковими даними у власному сховищі auth агента.
    </Note>

    ### Індикатор статусу

    Chat `/status` показує, який runtime моделі активний для поточної сесії.
    Стандартний harness PI відображається як `Runtime: OpenClaw Pi Default`. Коли
    вибрано вбудований harness app-server Codex, `/status` показує
    `Runtime: OpenAI Codex`. Наявні сесії зберігають записаний для них id harness, тож використовуйте
    `/new` або `/reset` після зміни `embeddedHarness`, якщо хочете, щоб `/status`
    відображав новий вибір PI/Codex.

    ### Обмеження контекстного вікна

    OpenClaw розглядає метадані моделі та обмеження контексту runtime як окремі значення.

    Для `openai-codex/gpt-5.5` через Codex OAuth:

    - Нативний `contextWindow`: `1000000`
    - Стандартне обмеження runtime `contextTokens`: `272000`

    Менше стандартне обмеження на практиці дає кращі характеристики затримки та якості. Перевизначте його через `contextTokens`:

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

    ### Відновлення каталогу

    OpenClaw використовує метадані каталогу Codex з upstream для `gpt-5.5`, коли вони
    присутні. Якщо живе виявлення Codex пропускає рядок `openai-codex/gpt-5.5`, поки
    обліковий запис автентифіковано, OpenClaw синтезує цей рядок моделі OAuth, щоб
    Cron, субагент і запуски налаштованої моделі за замовчуванням не завершувалися з
    `Unknown model`.

  </Tab>
</Tabs>

## Генерація зображень

Вбудований плагін `openai` реєструє генерацію зображень через інструмент `image_generate`.
Він підтримує як генерацію зображень OpenAI за ключем API, так і генерацію зображень
через Codex OAuth через те саме посилання моделі `openai/gpt-image-2`.

| Можливість                | Ключ API OpenAI                    | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Посилання моделі          | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Автентифікація            | `OPENAI_API_KEY`                   | Вхід через OpenAI Codex OAuth        |
| Транспорт                 | OpenAI Images API                  | backend Codex Responses              |
| Максимум зображень на запит | 4                                | 4                                    |
| Режим редагування         | Увімкнено (до 5 еталонних зображень) | Увімкнено (до 5 еталонних зображень) |
| Перевизначення розміру    | Підтримується, включно з розмірами 2K/4K | Підтримується, включно з розмірами 2K/4K |
| Співвідношення сторін / роздільна здатність | Не передається в OpenAI Images API | Зіставляється з підтримуваним розміром, коли це безпечно |

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
Див. [Image Generation](/uk/tools/image-generation) для спільних параметрів інструмента, вибору провайдера та поведінки failover.
</Note>

`gpt-image-2` є стандартною моделлю як для генерації зображень з тексту OpenAI, так і для
редагування зображень. `gpt-image-1` залишається доступною як явне перевизначення моделі, але нові
робочі процеси OpenAI для зображень мають використовувати `openai/gpt-image-2`.

Для інсталяцій із Codex OAuth зберігайте те саме посилання `openai/gpt-image-2`. Коли
налаштовано OAuth-профіль `openai-codex`, OpenClaw знаходить цей збережений OAuth
access token і надсилає запити на зображення через backend Codex Responses. Він
не намагається спочатку використати `OPENAI_API_KEY` і не виконує тихий перехід на ключ API для цього
запиту. Налаштуйте `models.providers.openai` явно з ключем API,
власним base URL або endpoint Azure, якщо хочете використовувати прямий маршрут OpenAI Images API
замість цього.
Якщо цей власний endpoint для зображень розміщено в довіреній LAN/приватній адресі, також установіть
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw залишає
приватні/внутрішні OpenAI-сумісні endpoint для зображень заблокованими, якщо немає цього явного дозволу.

Генерація:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Редагування:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Генерація відео

Вбудований плагін `openai` реєструє генерацію відео через інструмент `video_generate`.

| Можливість      | Значення                                                                          |
| --------------- | --------------------------------------------------------------------------------- |
| Стандартна модель | `openai/sora-2`                                                                 |
| Режими          | Текст у відео, зображення у відео, редагування одного відео                       |
| Вхідні еталони  | 1 зображення або 1 відео                                                          |
| Перевизначення розміру | Підтримується                                                              |
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
Див. [Video Generation](/uk/tools/video-generation), щоб дізнатися про спільні параметри інструмента, вибір провайдера та поведінку failover.
</Note>

## Внесок у prompt GPT-5

OpenClaw додає спільний внесок у prompt GPT-5 для запусків сімейства GPT-5 у різних провайдерів. Він застосовується за id моделі, тож `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` та інші сумісні посилання GPT-5 отримують той самий overlay. Старіші моделі GPT-4.x — ні.

Вбудований нативний harness Codex використовує ту саму поведінку GPT-5 і overlay Heartbeat через інструкції для розробника в app-server Codex, тож сесії `openai/gpt-5.x`, примусово спрямовані через `embeddedHarness.runtime: "codex"`, зберігають ті самі настанови щодо доведення до кінця та проактивного Heartbeat, навіть якщо рештою prompt harness керує Codex.

Внесок GPT-5 додає контракт поведінки з тегами для збереження persona, безпеки виконання, дисципліни інструментів, форми виводу, перевірок завершення та верифікації. Поведінка відповідей і тихих повідомлень, специфічна для каналу, залишається у спільному системному prompt OpenClaw та політиці вихідної доставки. Настанови GPT-5 завжди ввімкнені для відповідних моделей. Шар дружнього стилю взаємодії є окремим і налаштовуваним.

| Значення               | Ефект                                         |
| ---------------------- | --------------------------------------------- |
| `"friendly"` (стандартно) | Увімкнути шар дружнього стилю взаємодії     |
| `"on"`                 | Псевдонім для `"friendly"`                    |
| `"off"`                | Вимкнути лише шар дружнього стилю             |

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
Значення нечутливі до регістру під час runtime, тому і `"Off"`, і `"off"` вимикають шар дружнього стилю.
</Tip>

<Note>
Застаріле `plugins.entries.openai.config.personality` усе ще читається як резервний варіант для сумісності, коли спільне налаштування `agents.defaults.promptOverlays.gpt5.personality` не задано.
</Note>

## Голос і мовлення

<AccordionGroup>
  <Accordion title="Синтез мовлення (TTS)">
    Вбудований плагін `openai` реєструє синтез мовлення для поверхні `messages.tts`.

    | Параметр | Шлях конфігурації | Стандартно |
    |---------|------------|---------|
    | Модель | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Голос | `messages.tts.providers.openai.voice` | `coral` |
    | Швидкість | `messages.tts.providers.openai.speed` | (не задано) |
    | Інструкції | `messages.tts.providers.openai.instructions` | (не задано, лише `gpt-4o-mini-tts`) |
    | Формат | `messages.tts.providers.openai.responseFormat` | `opus` для голосових нотаток, `mp3` для файлів |
    | Ключ API | `messages.tts.providers.openai.apiKey` | Резервно використовує `OPENAI_API_KEY` |
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
    Установіть `OPENAI_TTS_BASE_URL`, щоб перевизначити base URL для TTS без впливу на endpoint Chat API.
    </Note>

  </Accordion>

  <Accordion title="Перетворення мовлення в текст">
    Вбудований плагін `openai` реєструє пакетне перетворення мовлення в текст через
    поверхню транскрибування розуміння медіа OpenClaw.

    - Стандартна модель: `gpt-4o-transcribe`
    - Endpoint: REST `OpenAI` `/v1/audio/transcriptions`
    - Шлях введення: multipart-завантаження аудіофайлу
    - Підтримується в OpenClaw всюди, де вхідне транскрибування аудіо використовує
      `tools.media.audio`, зокрема для сегментів голосових каналів Discord і
      аудіовкладень каналів

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

    Підказки щодо мови та prompt передаються в OpenAI, коли вони задаються
    спільною конфігурацією аудіомедіа або запитом на транскрибування для окремого виклику.

  </Accordion>

  <Accordion title="Транскрибування в реальному часі">
    Вбудований плагін `openai` реєструє транскрибування в реальному часі для плагіна Voice Call.

    | Параметр | Шлях конфігурації | Стандартно |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Мова | `...openai.language` | (не задано) |
    | Prompt | `...openai.prompt` | (не задано) |
    | Тривалість тиші | `...openai.silenceDurationMs` | `800` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | Ключ API | `...openai.apiKey` | Резервно використовує `OPENAI_API_KEY` |

    <Note>
    Використовує зʼєднання WebSocket із `wss://api.openai.com/v1/realtime` з аудіо формату G.711 u-law (`g711_ulaw` / `audio/pcmu`). Цей потоковий провайдер призначений для шляху транскрибування в реальному часі плагіна Voice Call; Discord voice наразі записує короткі сегменти й натомість використовує шлях пакетного транскрибування `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Голос у реальному часі">
    Вбудований плагін `openai` реєструє голос у реальному часі для плагіна Voice Call.

    | Параметр | Шлях конфігурації | Стандартно |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Голос | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | Тривалість тиші | `...openai.silenceDurationMs` | `500` |
    | Ключ API | `...openai.apiKey` | Резервно використовує `OPENAI_API_KEY` |

    <Note>
    Підтримує Azure OpenAI через ключі конфігурації `azureEndpoint` і `azureDeployment`. Підтримує двобічний виклик інструментів. Використовує аудіоформат G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoint Azure OpenAI

Вбудований провайдер `openai` може націлюватися на ресурс Azure OpenAI для генерації
зображень через перевизначення base URL. На шляху генерації зображень OpenClaw
виявляє імена хостів Azure в `models.providers.openai.baseUrl` і автоматично
перемикається на формат запиту Azure.

<Note>
Голос у реальному часі використовує окремий шлях конфігурації
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
і на нього не впливає `models.providers.openai.baseUrl`. Див. accordion **Голос у реальному
часі** в розділі [Голос і мовлення](#voice-and-speech), щоб дізнатися про його налаштування Azure.
</Note>

Використовуйте Azure OpenAI, коли:

- У вас уже є підписка, квота або корпоративна угода Azure OpenAI
- Вам потрібне регіональне зберігання даних або засоби контролю відповідності, які надає Azure
- Ви хочете зберігати трафік у межах наявного tenancy Azure

### Конфігурація

Для генерації зображень через Azure у вбудованому провайдері `openai` укажіть
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

OpenClaw розпізнає ці суфікси хостів Azure для маршруту генерації зображень Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Для запитів генерації зображень на розпізнаному хості Azure OpenClaw:

- Надсилає заголовок `api-key` замість `Authorization: Bearer`
- Використовує шляхи в межах deployment (`/openai/deployments/{deployment}/...`)
- Додає `?api-version=...` до кожного запиту

Інші base URL (публічний OpenAI, OpenAI-сумісні проксі) зберігають стандартний
формат запиту OpenAI для зображень.

<Note>
Маршрутизація Azure для шляху генерації зображень у провайдері `openai`
потребує OpenClaw 2026.4.22 або новішої версії. Попередні версії обробляють будь-який власний
`openai.baseUrl` як публічний endpoint OpenAI і завершаться помилкою при роботі з deployment
зображень Azure.
</Note>

### Версія API

Установіть `AZURE_OPENAI_API_VERSION`, щоб зафіксувати конкретну preview- або GA-версію Azure
для шляху генерації зображень Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Стандартне значення — `2024-12-01-preview`, коли змінну не встановлено.

### Назви моделей — це назви deployment

Azure OpenAI привʼязує моделі до deployment. Для запитів генерації зображень Azure,
маршрутизованих через вбудований провайдер `openai`, поле `model` в OpenClaw
має бути **назвою deployment Azure**, яку ви налаштували в порталі Azure, а не
публічним id моделі OpenAI.

Якщо ви створили deployment із назвою `gpt-image-2-prod`, який обслуговує `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Те саме правило назв deployment застосовується до викликів генерації зображень,
маршрутизованих через вбудований провайдер `openai`.

### Регіональна доступність

Генерація зображень Azure наразі доступна лише в підмножині регіонів
(наприклад, `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Перевірте актуальний список регіонів Microsoft перед створенням
deployment і підтвердьте, що конкретна модель доступна у вашому регіоні.

### Відмінності параметрів

Azure OpenAI і публічний OpenAI не завжди приймають однакові параметри зображень.
Azure може відхиляти опції, які дозволяє публічний OpenAI (наприклад певні
значення `background` у `gpt-image-2`) або надавати їх лише для певних версій
моделей. Ці відмінності походять від Azure і базової моделі, а не від
OpenClaw. Якщо запит до Azure завершується помилкою валідації, перевірте
набір параметрів, який підтримується вашим конкретним deployment і версією API в
порталі Azure.

<Note>
Azure OpenAI використовує нативний транспорт і поведінку сумісності, але не отримує
прихованих заголовків attribution від OpenClaw — див. accordion **Нативні vs OpenAI-compatible
маршрути** в розділі [Розширена конфігурація](#advanced-configuration).

Для трафіку chat або Responses в Azure (крім генерації зображень) використовуйте
потік onboarding або окрему конфігурацію провайдера Azure — одного лише
`openai.baseUrl` недостатньо, щоб застосувати формат API/автентифікації Azure. Існує окремий
провайдер `azure-openai-responses/*`; див.
accordion про server-side Compaction нижче.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Транспорт (WebSocket vs SSE)">
    OpenClaw використовує WebSocket-first із резервним переходом на SSE (`"auto"`) для `openai/*` і `openai-codex/*`.

    У режимі `"auto"` OpenClaw:
    - Повторює одну ранню помилку WebSocket перед переходом на SSE
    - Після помилки позначає WebSocket як деградований приблизно на 60 секунд і використовує SSE під час періоду охолодження
    - Додає стабільні заголовки ідентичності сесії та ходу для повторів і перепідключень
    - Нормалізує лічильники використання (`input_tokens` / `prompt_tokens`) між варіантами транспорту

    | Значення | Поведінка |
    |-------|----------|
    | `"auto"` (стандартно) | Спочатку WebSocket, резервно SSE |
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
            "openai-codex/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    Повʼязані docs OpenAI:
    - [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Прогрів WebSocket">
    OpenClaw за замовчуванням вмикає прогрів WebSocket для `openai/*` і `openai-codex/*`, щоб зменшити затримку першого ходу.

    ```json5
    // Disable warm-up
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
    OpenClaw надає спільний перемикач fast mode для `openai/*` і `openai-codex/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Config:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Коли він увімкнений, OpenClaw зіставляє fast mode з пріоритетною обробкою OpenAI (`service_tier = "priority"`). Наявні значення `service_tier` зберігаються, а fast mode не переписує `reasoning` або `text.verbosity`.

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
    Перевизначення сесії мають пріоритет над конфігурацією. Очищення перевизначення сесії в UI Sessions повертає сесію до стандартного налаштування з конфігурації.
    </Note>

  </Accordion>

  <Accordion title="Пріоритетна обробка (service_tier)">
    API OpenAI надає пріоритетну обробку через `service_tier`. Задавайте її для кожної моделі в OpenClaw:

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
    `serviceTier` передається лише до нативних endpoint OpenAI (`api.openai.com`) і нативних endpoint Codex (`chatgpt.com/backend-api`). Якщо ви маршрутизуєте будь-якого з цих провайдерів через проксі, OpenClaw залишає `service_tier` без змін.
    </Warning>

  </Accordion>

  <Accordion title="Server-side Compaction (Responses API)">
    Для прямих моделей OpenAI Responses (`openai/*` на `api.openai.com`) stream wrapper Pi-harness плагіна OpenAI автоматично вмикає server-side Compaction:

    - Примусово встановлює `store: true` (якщо compat моделі не задає `supportsStore: false`)
    - Вставляє `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Стандартний `compact_threshold`: 70% від `contextWindow` (або `80000`, якщо він недоступний)

    Це застосовується до вбудованого шляху harness Pi і до хуків провайдера OpenAI, які використовуються в embedded-запусках. Нативний harness app-server Codex керує власним контекстом через Codex і налаштовується окремо через `agents.defaults.embeddedHarness.runtime`.

    <Tabs>
      <Tab title="Явно ввімкнути">
        Корисно для сумісних endpoint, таких як Azure OpenAI Responses:

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
    `responsesServerCompaction` керує лише вставкою `context_management`. Прямі моделі OpenAI Responses усе одно примусово встановлюють `store: true`, якщо compat не задає `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Суворий агентний режим GPT">
    Для запусків сімейства GPT-5 на `openai/*` OpenClaw може використовувати суворіший embedded-контракт виконання:

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
    - Повторює хід зі спрямуванням діяти негайно
    - Автоматично вмикає `update_plan` для суттєвої роботи
    - Показує явний заблокований стан, якщо модель продовжує планувати без дії

    <Note>
    Застосовується лише до OpenAI і Codex запусків сімейства GPT-5. Інші провайдери та старіші сімейства моделей зберігають стандартну поведінку.
    </Note>

  </Accordion>

  <Accordion title="Нативні vs OpenAI-compatible маршрути">
    OpenClaw по-різному обробляє прямі endpoint OpenAI, Codex і Azure OpenAI порівняно з загальними OpenAI-compatible проксі `/v1`:

    **Нативні маршрути** (`openai/*`, Azure OpenAI):
    - Зберігають `reasoning: { effort: "none" }` лише для моделей, які підтримують `none` effort у OpenAI
    - Пропускають вимкнений reasoning для моделей або проксі, які відхиляють `reasoning.effort: "none"`
    - За замовчуванням використовують strict mode для схем інструментів
    - Додають приховані заголовки attribution лише на перевірених нативних хостах
    - Зберігають формування запитів, властиве лише OpenAI (`service_tier`, `store`, compat reasoning, підказки кешу prompt)

    **Проксі/сумісні маршрути:**
    - Використовують мʼякшу поведінку compat
    - Видаляють Completions `store` із ненативних payload `openai-completions`
    - Приймають наскрізний JSON `params.extra_body`/`params.extraBody` для розширених параметрів OpenAI-compatible проксі Completions
    - Не примушують strict-схеми інструментів або нативні заголовки

    Azure OpenAI використовує нативний транспорт і поведінку compat, але не отримує прихованих заголовків attribution.

  </Accordion>
</AccordionGroup>

## Повʼязане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань моделей і поведінки failover.
  </Card>
  <Card title="Генерація зображень" href="/uk/tools/image-generation" icon="image">
    Спільні параметри інструмента зображень і вибір провайдера.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента відео і вибір провайдера.
  </Card>
  <Card title="OAuth і автентифікація" href="/uk/gateway/authentication" icon="key">
    Деталі автентифікації та правила повторного використання облікових даних.
  </Card>
</CardGroup>
