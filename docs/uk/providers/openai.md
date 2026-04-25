---
read_when:
    - Ви хочете використовувати моделі OpenAI в OpenClaw
    - Ви хочете автентифікацію через підписку Codex замість API-ключів
    - Вам потрібна суворіша поведінка виконання агента GPT-5
summary: Використовуйте OpenAI через API-ключі або підписку Codex в OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-25T00:03:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 281ea7705763053b7038159035867b54e7255dc01136c54bfb7c68b5cc34cab1
    source_path: providers/openai.md
    workflow: 15
---

OpenAI надає API розробника для моделей GPT. OpenClaw підтримує три маршрути сімейства OpenAI. Префікс моделі визначає маршрут:

- **API key** — прямий доступ до OpenAI Platform з оплатою за використання (моделі `openai/*`)
- **Підписка Codex через PI** — вхід через ChatGPT/Codex з доступом за підпискою (моделі `openai-codex/*`)
- **Harness app-server Codex** — власне виконання через app-server Codex (моделі `openai/*` плюс `agents.defaults.embeddedHarness.runtime: "codex"`)

OpenAI явно підтримує використання OAuth підписки в зовнішніх інструментах і робочих процесах, таких як OpenClaw.

## Швидкий вибір

| Ціль                                          | Використовуйте                                          | Примітки                                                                     |
| --------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Пряме виставлення рахунків за API key         | `openai/gpt-5.4`                                        | Установіть `OPENAI_API_KEY` або запустіть онбординг OpenAI API key.          |
| GPT-5.5 з автентифікацією через підписку ChatGPT/Codex | `openai-codex/gpt-5.5`                          | Типовий маршрут PI для Codex OAuth. Найкращий перший вибір для налаштувань із підпискою. |
| GPT-5.5 із власною поведінкою app-server Codex | `openai/gpt-5.5` плюс `embeddedHarness.runtime: "codex"` | Використовує harness app-server Codex, а не публічний маршрут OpenAI API.   |
| Генерація або редагування зображень           | `openai/gpt-image-2`                                    | Працює як з `OPENAI_API_KEY`, так і з OpenAI Codex OAuth.                    |

<Note>
GPT-5.5 зараз доступна в OpenClaw через маршрути підписки/OAuth:
`openai-codex/gpt-5.5` з runner PI або `openai/gpt-5.5` з
harness app-server Codex. Прямий доступ через API key для `openai/gpt-5.5`
підтримується, щойно OpenAI увімкне GPT-5.5 у публічному API; до того часу
використовуйте модель із доступом через API, таку як `openai/gpt-5.4`, для
налаштувань із `OPENAI_API_KEY`.
</Note>

<Note>
Увімкнення Plugin OpenAI або вибір моделі `openai-codex/*` не
вмикає вбудований Plugin app-server Codex. OpenClaw вмикає цей Plugin лише
коли ви явно вибираєте власний harness Codex через
`embeddedHarness.runtime: "codex"` або використовуєте застаріле посилання моделі `codex/*`.
</Note>

## Покриття функцій OpenClaw

| Можливість OpenAI         | Поверхня OpenClaw                                          | Статус                                                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| Чат / Responses           | Провайдер моделей `openai/<model>`                         | Так                                                    |
| Моделі підписки Codex     | `openai-codex/<model>` з OAuth `openai-codex`              | Так                                                    |
| Harness app-server Codex  | `openai/<model>` з `embeddedHarness.runtime: codex`        | Так                                                    |
| Пошук у вебі на стороні сервера | Власний інструмент OpenAI Responses                  | Так, коли вебпошук увімкнено й не закріплено провайдера |
| Зображення                | `image_generate`                                           | Так                                                    |
| Відео                     | `video_generate`                                           | Так                                                    |
| Text-to-speech            | `messages.tts.provider: "openai"` / `tts`                  | Так                                                    |
| Batch speech-to-text      | `tools.media.audio` / розуміння медіа                      | Так                                                    |
| Streaming speech-to-text  | Voice Call `streaming.provider: "openai"`                  | Так                                                    |
| Realtime voice            | Voice Call `realtime.provider: "openai"` / розмова в Control UI | Так                                               |
| Embeddings                | провайдер embedding для пам’яті                            | Так                                                    |

## Початок роботи

Виберіть бажаний спосіб автентифікації та виконайте кроки налаштування.

<Tabs>
  <Tab title="API key (OpenAI Platform)">
    **Найкраще для:** прямого доступу до API й виставлення рахунків за використання.

    <Steps>
      <Step title="Отримайте свій API key">
        Створіть або скопіюйте API key з [панелі OpenAI Platform](https://platform.openai.com/api-keys).
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
      <Step title="Переконайтеся, що модель доступна">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Підсумок маршруту

    | Model ref | Route | Auth |
    |-----------|-------|------|
    | `openai/gpt-5.4` | Прямий API OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini` | Прямий API OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.5` | Майбутній прямий маршрут API, щойно OpenAI увімкне GPT-5.5 в API | `OPENAI_API_KEY` |

    <Note>
    `openai/*` — це прямий маршрут OpenAI API через API key, якщо ви явно не
    примусите використання harness app-server Codex. Сама GPT-5.5 зараз доступна
    лише через підписку/OAuth; використовуйте `openai-codex/*` для Codex OAuth через типовий runner PI.
    </Note>

    ### Приклад конфігурації

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw **не** надає `openai/gpt-5.3-codex-spark`. Живі запити до OpenAI API відхиляють цю модель, і поточний каталог Codex також її не надає.
    </Warning>

  </Tab>

  <Tab title="Підписка Codex">
    **Найкраще для:** використання вашої підписки ChatGPT/Codex замість окремого API key. Codex cloud потребує входу через ChatGPT.

    <Steps>
      <Step title="Запустіть Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Або запустіть OAuth напряму:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Для headless-середовищ або налаштувань, де callback працює погано, додайте `--device-code`, щоб увійти через потік device-code ChatGPT замість callback браузера на localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Установіть типову модель">
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

    ### Підсумок маршруту

    | Model ref | Route | Auth |
    |-----------|-------|------|
    | `openai-codex/gpt-5.5` | ChatGPT/Codex OAuth через PI | вхід Codex |
    | `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | harness app-server Codex | автентифікація app-server Codex |

    <Note>
    Продовжуйте використовувати ідентифікатор провайдера `openai-codex` для команд auth/profile. Префікс моделі
    `openai-codex/*` також є явним маршрутом PI для Codex OAuth.
    Він не вибирає і не автовмикає вбудований harness app-server Codex.
    </Note>

    ### Приклад конфігурації

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    Онбординг більше не імпортує OAuth-матеріали з `~/.codex`. Увійдіть через OAuth у браузері (типово) або через потік device-code вище — OpenClaw керує отриманими обліковими даними у власному сховищі auth агента.
    </Note>

    ### Індикатор статусу

    Чат `/status` показує, який runtime моделі активний для поточної сесії.
    Типовий harness PI відображається як `Runtime: OpenClaw Pi Default`. Коли
    вибрано вбудований harness app-server Codex, `/status` показує
    `Runtime: OpenAI Codex`. Наявні сесії зберігають записаний ідентифікатор harness, тому використайте
    `/new` або `/reset` після зміни `embeddedHarness`, якщо хочете, щоб `/status`
    відображав новий вибір PI/Codex.

    ### Обмеження контекстного вікна

    OpenClaw розглядає метадані моделі й обмеження контексту runtime як окремі значення.

    Для `openai-codex/gpt-5.5` через Codex OAuth:

    - Власне `contextWindow`: `1000000`
    - Типове обмеження runtime `contextTokens`: `272000`

    Менше типове обмеження на практиці дає кращу затримку та якість. Перевизначте його через `contextTokens`:

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
    Використовуйте `contextWindow`, щоб оголосити власні метадані моделі. Використовуйте `contextTokens`, щоб обмежити бюджет контексту runtime.
    </Note>

    ### Відновлення каталогу

    OpenClaw використовує метадані каталогу upstream Codex для `gpt-5.5`, коли вони
    присутні. Якщо живе виявлення Codex пропускає рядок `openai-codex/gpt-5.5`, хоча
    обліковий запис автентифіковано, OpenClaw синтезує цей рядок OAuth-моделі, щоб
    Cron, субагент і запуски з налаштованою типовою моделлю не завершувалися помилкою
    `Unknown model`.

  </Tab>
</Tabs>

## Генерація зображень

Вбудований Plugin `openai` реєструє генерацію зображень через інструмент `image_generate`.
Він підтримує як генерацію зображень OpenAI через API key, так і генерацію зображень
через Codex OAuth за тим самим посиланням моделі `openai/gpt-image-2`.

| Можливість                | OpenAI API key                     | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Посилання моделі          | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Автентифікація            | `OPENAI_API_KEY`                   | вхід через OpenAI Codex OAuth        |
| Транспорт                 | OpenAI Images API                  | бекенд Codex Responses               |
| Максимум зображень на запит | 4                                | 4                                    |
| Режим редагування         | Увімкнено (до 5 еталонних зображень) | Увімкнено (до 5 еталонних зображень) |
| Перевизначення розміру    | Підтримується, включно з розмірами 2K/4K | Підтримується, включно з розмірами 2K/4K |
| Співвідношення сторін / роздільна здатність | Не передається до OpenAI Images API | Відображається на підтримуваний розмір, коли це безпечно |

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
Див. [Генерація зображень](/uk/tools/image-generation) для спільних параметрів інструмента, вибору провайдера та поведінки failover.
</Note>

`gpt-image-2` є типовим значенням як для генерації текст-у-зображення OpenAI, так і для редагування зображень. `gpt-image-1` і далі можна використовувати як явне перевизначення моделі, але нові робочі процеси OpenAI для зображень мають використовувати `openai/gpt-image-2`.

Для встановлень із Codex OAuth залишайте те саме посилання `openai/gpt-image-2`. Коли
налаштовано профіль OAuth `openai-codex`, OpenClaw визначає збережений токен
доступу OAuth і надсилає запити на зображення через бекенд Codex Responses. Він
не пробує спочатку `OPENAI_API_KEY` і не переходить мовчки на API key для цього
запиту. Явно налаштуйте `models.providers.openai` з API key,
власним base URL або кінцевою точкою Azure, якщо хочете використовувати прямий маршрут OpenAI Images API.
Якщо ця власна кінцева точка зображень розміщена в довіреній LAN/приватній адресі, також установіть
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw і далі блокує
приватні/внутрішні сумісні з OpenAI кінцеві точки зображень, якщо немає цього явного дозволу.

Генерація:

```
/tool image_generate model=openai/gpt-image-2 prompt="Вишуканий постер запуску OpenClaw на macOS" size=3840x2160 count=1
```

Редагування:

```
/tool image_generate model=openai/gpt-image-2 prompt="Збережи форму об’єкта, зміни матеріал на напівпрозоре скло" image=/path/to/reference.png size=1024x1536
```

## Генерація відео

Вбудований Plugin `openai` реєструє генерацію відео через інструмент `video_generate`.

| Можливість       | Значення                                                                          |
| ---------------- | --------------------------------------------------------------------------------- |
| Типова модель    | `openai/sora-2`                                                                   |
| Режими           | Text-to-video, image-to-video, редагування одного відео                           |
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
Див. [Генерація відео](/uk/tools/video-generation) для спільних параметрів інструмента, вибору провайдера та поведінки failover.
</Note>

## Внесок у промпт GPT-5

OpenClaw додає спільний внесок у промпт GPT-5 для запусків сімейства GPT-5 у різних провайдерів. Він застосовується за ID моделі, тож `openai-codex/gpt-5.5`, `openai/gpt-5.4`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` та інші сумісні посилання GPT-5 отримують той самий шар. Старіші моделі GPT-4.x — ні.

Вбудований власний harness Codex використовує ту саму поведінку GPT-5 і шар Heartbeat через інструкції розробника app-server Codex, тож сесії `openai/gpt-5.x`, примусово спрямовані через `embeddedHarness.runtime: "codex"`, зберігають ті самі вказівки щодо доведення до кінця й проактивного Heartbeat, хоча рештою промпта harness керує Codex.

Внесок GPT-5 додає контракт поведінки з тегами для збереження персони, безпеки виконання, дисципліни використання інструментів, форми виводу, перевірок завершення та верифікації. Поведінка відповідей для конкретних каналів і поведінка тихих повідомлень залишаються в спільному системному промпті OpenClaw і політиці вихідної доставки. Вказівки GPT-5 завжди ввімкнені для відповідних моделей. Шар дружнього стилю взаємодії є окремим і налаштовуваним.

| Значення               | Ефект                                          |
| ---------------------- | ---------------------------------------------- |
| `"friendly"` (типово)  | Увімкнути шар дружнього стилю взаємодії        |
| `"on"`                 | Псевдонім для `"friendly"`                     |
| `"off"`                | Вимкнути лише шар дружнього стилю              |

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
Під час runtime значення не чутливі до регістру, тож і `"Off"`, і `"off"` вимикають шар дружнього стилю.
</Tip>

<Note>
Застаріле `plugins.entries.openai.config.personality` і далі читається як резервне значення для сумісності, коли спільне налаштування `agents.defaults.promptOverlays.gpt5.personality` не задано.
</Note>

## Голос і мовлення

<AccordionGroup>
  <Accordion title="Синтез мовлення (TTS)">
    Вбудований Plugin `openai` реєструє синтез мовлення для поверхні `messages.tts`.

    | Параметр | Шлях конфігурації | Типове значення |
    |---------|------------|---------|
    | Модель | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Голос | `messages.tts.providers.openai.voice` | `coral` |
    | Швидкість | `messages.tts.providers.openai.speed` | (не задано) |
    | Інструкції | `messages.tts.providers.openai.instructions` | (не задано, лише `gpt-4o-mini-tts`) |
    | Формат | `messages.tts.providers.openai.responseFormat` | `opus` для голосових нотаток, `mp3` для файлів |
    | API key | `messages.tts.providers.openai.apiKey` | Використовує резервне значення `OPENAI_API_KEY` |
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
    Установіть `OPENAI_TTS_BASE_URL`, щоб перевизначити базовий URL TTS без впливу на кінцеву точку чат-API.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Вбудований Plugin `openai` реєструє пакетне перетворення мовлення на текст через
    поверхню транскрипції для розуміння медіа в OpenClaw.

    - Типова модель: `gpt-4o-transcribe`
    - Кінцева точка: OpenAI REST `/v1/audio/transcriptions`
    - Шлях введення: multipart-завантаження аудіофайла
    - Підтримується в OpenClaw всюди, де транскрипція вхідного аудіо використовує
      `tools.media.audio`, включно з сегментами голосових каналів Discord і
      аудіовкладеннями каналів

    Щоб примусово використовувати OpenAI для транскрипції вхідного аудіо:

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

    Підказки мови та промпта пересилаються до OpenAI, коли їх задає
    спільна конфігурація аудіомедіа або запит на транскрипцію для конкретного виклику.

  </Accordion>

  <Accordion title="Транскрипція в realtime">
    Вбудований Plugin `openai` реєструє транскрипцію в realtime для Plugin Voice Call.

    | Параметр | Шлях конфігурації | Типове значення |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Мова | `...openai.language` | (не задано) |
    | Промпт | `...openai.prompt` | (не задано) |
    | Тривалість тиші | `...openai.silenceDurationMs` | `800` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | API key | `...openai.apiKey` | Використовує резервне значення `OPENAI_API_KEY` |

    <Note>
    Використовує підключення WebSocket до `wss://api.openai.com/v1/realtime` з аудіо G.711 u-law (`g711_ulaw` / `audio/pcmu`). Цей потоковий провайдер призначений для шляху транскрипції в realtime у Voice Call; голос Discord наразі записує короткі сегменти та замість цього використовує пакетний шлях транскрипції `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Голос у realtime">
    Вбудований Plugin `openai` реєструє голос у realtime для Plugin Voice Call.

    | Параметр | Шлях конфігурації | Типове значення |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Голос | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | Тривалість тиші | `...openai.silenceDurationMs` | `500` |
    | API key | `...openai.apiKey` | Використовує резервне значення `OPENAI_API_KEY` |

    <Note>
    Підтримує Azure OpenAI через ключі конфігурації `azureEndpoint` і `azureDeployment`. Підтримує двосторонній виклик інструментів. Використовує формат аудіо G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Кінцеві точки Azure OpenAI

Вбудований провайдер `openai` може націлюватися на ресурс Azure OpenAI для
генерації зображень через перевизначення base URL. На шляху генерації зображень OpenClaw
визначає імена хостів Azure в `models.providers.openai.baseUrl` і автоматично
перемикається на формат запиту Azure.

<Note>
Голос у realtime використовує окремий шлях конфігурації
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
і не залежить від `models.providers.openai.baseUrl`. Див. акордеон **Голос у realtime**
в розділі [Голос і мовлення](#voice-and-speech) для його параметрів Azure.
</Note>

Використовуйте Azure OpenAI, коли:

- У вас уже є підписка, квота або корпоративна угода Azure OpenAI
- Вам потрібне регіональне розміщення даних або засоби відповідності, які надає Azure
- Ви хочете зберігати трафік у межах наявного середовища Azure

### Конфігурація

Для генерації зображень Azure через вбудований провайдер `openai` вкажіть
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

Інші base URL (публічний OpenAI, сумісні з OpenAI проксі) зберігають стандартний
формат запиту зображень OpenAI.

<Note>
Маршрутизація Azure для шляху генерації зображень провайдера `openai` потребує
OpenClaw 2026.4.22 або новішої версії. Раніші версії трактують будь-який власний
`openai.baseUrl` як публічну кінцеву точку OpenAI і не працюватимуть із розгортаннями зображень Azure.
</Note>

### Версія API

Установіть `AZURE_OPENAI_API_VERSION`, щоб зафіксувати конкретну preview- або GA-версію Azure
для шляху генерації зображень Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Типове значення — `2024-12-01-preview`, якщо змінну не встановлено.

### Назви моделей — це назви розгортань

Azure OpenAI прив’язує моделі до розгортань. Для запитів генерації зображень Azure,
маршрутизованих через вбудований провайдер `openai`, поле `model` в OpenClaw
має бути **назвою розгортання Azure**, яку ви налаштували в порталі Azure, а не
публічним ID моделі OpenAI.

Якщо ви створили розгортання з назвою `gpt-image-2-prod`, яке обслуговує `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="Чистий постер" size=1024x1024 count=1
```

Те саме правило назв розгортань застосовується до викликів генерації зображень,
маршрутизованих через вбудований провайдер `openai`.

### Регіональна доступність

Генерація зображень Azure зараз доступна лише в частині регіонів
(наприклад, `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Перш ніж створювати розгортання, перевірте актуальний список регіонів Microsoft
і підтвердьте, що конкретна модель доступна у вашому регіоні.

### Відмінності параметрів

Azure OpenAI і публічний OpenAI не завжди приймають однакові параметри зображень.
Azure може відхиляти параметри, які дозволяє публічний OpenAI (наприклад, деякі
значення `background` для `gpt-image-2`) або надавати їх лише для певних
версій моделей. Ці відмінності походять від Azure та базової моделі, а не від
OpenClaw. Якщо запит Azure завершується помилкою валідації, перевірте
набір параметрів, який підтримує саме ваше розгортання та версія API в
порталі Azure.

<Note>
Azure OpenAI використовує власний транспорт і сумісну поведінку, але не отримує
прихованих заголовків атрибуції OpenClaw — див. акордеон **Власні маршрути vs OpenAI-compatible
routes** у розділі [Розширена конфігурація](#advanced-configuration).

Для трафіку чату або Responses в Azure (окрім генерації зображень) використовуйте
процес онбордингу або окрему конфігурацію провайдера Azure — одного лише
`openai.baseUrl` недостатньо, щоб застосувати формат API/автентифікації Azure. Існує окремий
провайдер `azure-openai-responses/*`; див.
акордеон Server-side Compaction нижче.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Транспорт (WebSocket vs SSE)">
    OpenClaw використовує спочатку WebSocket із резервним переходом на SSE (`"auto"`) як для `openai/*`, так і для `openai-codex/*`.

    У режимі `"auto"` OpenClaw:
    - Повторює одну ранню помилку WebSocket перед переходом на SSE
    - Після помилки позначає WebSocket як degraded приблизно на 60 секунд і використовує SSE під час періоду охолодження
    - Додає стабільні заголовки ідентичності сесії та ходу для повторних спроб і повторних підключень
    - Нормалізує лічильники usage (`input_tokens` / `prompt_tokens`) між варіантами транспорту

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
            "openai/gpt-5.4": {
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

    Пов’язана документація OpenAI:
    - [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Попередній прогрів WebSocket">
    OpenClaw типово вмикає попередній прогрів WebSocket для `openai/*` і `openai-codex/*`, щоб зменшити затримку першого ходу.

    ```json5
    // Disable warm-up
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
          },
        },
      },
    }
    ```

    <Note>
    Перевизначення сесії мають пріоритет над конфігурацією. Очищення перевизначення сесії в UI сесій повертає сесію до налаштованого типового значення.
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
          },
        },
      },
    }
    ```

    Підтримувані значення: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` пересилається лише до власних кінцевих точок OpenAI (`api.openai.com`) і власних кінцевих точок Codex (`chatgpt.com/backend-api`). Якщо ви маршрутизуєте будь-якого з цих провайдерів через проксі, OpenClaw залишає `service_tier` без змін.
    </Warning>

  </Accordion>

  <Accordion title="Server-side Compaction (Responses API)">
    Для прямих моделей OpenAI Responses (`openai/*` на `api.openai.com`) поточна обгортка stream Pi-harness Plugin OpenAI автоматично вмикає server-side Compaction:

    - Примусово встановлює `store: true` (якщо сумісність моделі не задає `supportsStore: false`)
    - Вставляє `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Типовий `compact_threshold`: 70% від `contextWindow` (або `80000`, якщо значення недоступне)

    Це застосовується до вбудованого шляху Pi harness і до hook провайдера OpenAI, які використовуються в embedded-запусках. Власний harness app-server Codex керує власним контекстом через Codex і налаштовується окремо через `agents.defaults.embeddedHarness.runtime`.

    <Tabs>
      <Tab title="Явне ввімкнення">
        Корисно для сумісних кінцевих точок, таких як Azure OpenAI Responses:

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
      <Tab title="Вимкнення">
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
    `responsesServerCompaction` керує лише вставкою `context_management`. Прямі моделі OpenAI Responses і далі примусово встановлюють `store: true`, якщо сумісність не задає `supportsStore: false`.
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
    - Повторює хід із вказівкою діяти негайно
    - Автоматично вмикає `update_plan` для суттєвої роботи
    - Показує явний заблокований стан, якщо модель продовжує планувати без дії

    <Note>
    Обмежено лише запусками OpenAI та Codex сімейства GPT-5. Інші провайдери й старіші сімейства моделей зберігають типову поведінку.
    </Note>

  </Accordion>

  <Accordion title="Власні маршрути vs OpenAI-compatible routes">
    OpenClaw по-різному обробляє прямі кінцеві точки OpenAI, Codex і Azure OpenAI та загальні OpenAI-compatible проксі `/v1`:

    **Власні маршрути** (`openai/*`, Azure OpenAI):
    - Зберігають `reasoning: { effort: "none" }` лише для моделей, які підтримують OpenAI `none` для effort
    - Пропускають вимкнене reasoning для моделей або проксі, які відхиляють `reasoning.effort: "none"`
    - Типово використовують суворий режим для схем інструментів
    - Додають приховані заголовки атрибуції лише на перевірених власних хостах
    - Зберігають формування запитів лише для OpenAI (`service_tier`, `store`, сумісність reasoning, підказки кешу промптів)

    **Проксі/сумісні маршрути:**
    - Використовують м’якшу сумісну поведінку
    - Не примушують суворі схеми інструментів або заголовки лише для власних маршрутів

    Azure OpenAI використовує власний транспорт і сумісну поведінку, але не отримує прихованих заголовків атрибуції.

  </Accordion>
</AccordionGroup>

## Пов’язане

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
  <Card title="OAuth і auth" href="/uk/gateway/authentication" icon="key">
    Подробиці auth і правила повторного використання облікових даних.
  </Card>
</CardGroup>
