---
read_when:
    - Ви хочете використовувати моделі OpenAI в OpenClaw
    - Ви хочете автентифікацію за підпискою Codex замість API-ключів
    - Вам потрібні суворіші правила виконання агента GPT-5
summary: Використовуйте OpenAI через API-ключі або підписку Codex в OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-25T03:44:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 576a453f42fff8d90837ebee3894443c37f177c611c134113944fbf0d11c2455
    source_path: providers/openai.md
    workflow: 15
---

OpenAI надає API для розробників для моделей GPT. OpenClaw підтримує три маршрути сімейства OpenAI. Префікс моделі визначає маршрут:

- **API key** — прямий доступ до OpenAI Platform з оплатою за використання (моделі `openai/*`)
- **Підписка Codex через PI** — вхід через ChatGPT/Codex із доступом за підпискою (моделі `openai-codex/*`)
- **Харнес app-server Codex** — нативне виконання через app-server Codex (моделі `openai/*` плюс `agents.defaults.embeddedHarness.runtime: "codex"`)

OpenAI явно підтримує використання OAuth за підпискою у зовнішніх інструментах і робочих процесах, таких як OpenClaw.

Провайдер, модель, середовище виконання та канал — це окремі рівні. Якщо ці позначення
плутаються, прочитайте [Середовища виконання агентів](/uk/concepts/agent-runtimes) перед
зміною конфігурації.

## Швидкий вибір

| Ціль                                          | Використовуйте                                          | Примітки                                                                     |
| --------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Пряме виставлення рахунків за API key         | `openai/gpt-5.4`                                        | Установіть `OPENAI_API_KEY` або запустіть онбординг OpenAI API key.         |
| GPT-5.5 з автентифікацією через підписку ChatGPT/Codex | `openai-codex/gpt-5.5`                          | Типовий маршрут PI для Codex OAuth. Найкращий перший вибір для конфігурацій із підпискою. |
| GPT-5.5 з нативною поведінкою app-server Codex | `openai/gpt-5.5` плюс `embeddedHarness.runtime: "codex"` | Використовує харнес app-server Codex, а не маршрут публічного API OpenAI.   |
| Генерація або редагування зображень           | `openai/gpt-image-2`                                    | Працює як з `OPENAI_API_KEY`, так і з OpenAI Codex OAuth.                    |

<Note>
GPT-5.5 зараз доступна в OpenClaw через маршрути підписки/OAuth:
`openai-codex/gpt-5.5` з виконавцем PI або `openai/gpt-5.5` з
харнесом app-server Codex. Прямий доступ через API key для `openai/gpt-5.5`
підтримується, щойно OpenAI увімкне GPT-5.5 у публічному API; до того часу використовуйте
модель з увімкненим API, наприклад `openai/gpt-5.4`, для конфігурацій із `OPENAI_API_KEY`.
</Note>

<Note>
Увімкнення Plugin OpenAI або вибір моделі `openai-codex/*` не
вмикає комплектний Plugin app-server Codex. OpenClaw вмикає цей Plugin лише
коли ви явно вибираєте нативний харнес Codex через
`embeddedHarness.runtime: "codex"` або використовуєте застаріле посилання на модель `codex/*`.
</Note>

## Покриття можливостей OpenClaw

| Можливість OpenAI         | Поверхня OpenClaw                                         | Статус                                                 |
| ------------------------- | --------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses          | провайдер моделі `openai/<model>`                         | Так                                                    |
| Моделі підписки Codex     | `openai-codex/<model>` з OAuth `openai-codex`             | Так                                                    |
| Харнес app-server Codex   | `openai/<model>` з `embeddedHarness.runtime: codex`       | Так                                                    |
| Пошук у вебі на стороні сервера | нативний інструмент OpenAI Responses                 | Так, коли вебпошук увімкнено й провайдер не закріплено |
| Зображення                | `image_generate`                                          | Так                                                    |
| Відео                     | `video_generate`                                          | Так                                                    |
| Перетворення тексту на мовлення | `messages.tts.provider: "openai"` / `tts`           | Так                                                    |
| Пакетне перетворення мовлення на текст | `tools.media.audio` / розуміння медіа          | Так                                                    |
| Потокове перетворення мовлення на текст | Voice Call `streaming.provider: "openai"`       | Так                                                    |
| Голос у реальному часі    | Voice Call `realtime.provider: "openai"` / Control UI Talk | Так                                                   |
| Embeddings                | провайдер embedding для пам’яті                           | Так                                                    |

## Початок роботи

Виберіть бажаний спосіб автентифікації та виконайте кроки налаштування.

<Tabs>
  <Tab title="API key (OpenAI Platform)">
    **Найкраще підходить для:** прямого доступу до API та оплати за використання.

    <Steps>
      <Step title="Отримайте свій API key">
        Створіть або скопіюйте API key на [панелі керування OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Запустіть онбординг">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Або передайте key безпосередньо:

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

    ### Підсумок маршрутів

    | Model ref | Маршрут | Автентифікація |
    |-----------|-------|------|
    | `openai/gpt-5.4` | Прямий API OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini` | Прямий API OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.5` | Майбутній прямий маршрут API, щойно OpenAI увімкне GPT-5.5 в API | `OPENAI_API_KEY` |

    <Note>
    `openai/*` — це прямий маршрут API OpenAI через API key, якщо ви явно не примусите
    використання харнеса app-server Codex. Сама GPT-5.5 зараз доступна лише через підписку/OAuth;
    використовуйте `openai-codex/*` для Codex OAuth через типовий виконавець PI або
    використовуйте `openai/gpt-5.5` з `embeddedHarness.runtime: "codex"` для нативного
    виконання через app-server Codex.
    </Note>

    ### Приклад конфігурації

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw **не** надає `openai/gpt-5.3-codex-spark`. Реальні запити до OpenAI API відхиляють цю модель, і поточний каталог Codex також її не надає.
    </Warning>

  </Tab>

  <Tab title="Підписка Codex">
    **Найкраще підходить для:** використання вашої підписки ChatGPT/Codex замість окремого API key. Для хмари Codex потрібен вхід у ChatGPT.

    <Steps>
      <Step title="Запустіть Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Або запустіть OAuth безпосередньо:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Для безголових середовищ або конфігурацій, де callback незручний, додайте `--device-code`, щоб увійти через потік device-code ChatGPT замість зворотного виклику браузера на localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Установіть модель за замовчуванням">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
        ```
      </Step>
      <Step title="Перевірте, що модель доступна">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Підсумок маршрутів

    | Model ref | Маршрут | Автентифікація |
    |-----------|-------|------|
    | `openai-codex/gpt-5.5` | ChatGPT/Codex OAuth через PI | вхід Codex |
    | `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | харнес app-server Codex | автентифікація app-server Codex |

    <Note>
    Продовжуйте використовувати ідентифікатор провайдера `openai-codex` для команд автентифікації/профілю. Префікс моделі
    `openai-codex/*` також є явним маршрутом PI для Codex OAuth.
    Він не вибирає та не автовмикає комплектний харнес app-server Codex.
    </Note>

    ### Приклад конфігурації

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    Онбординг більше не імпортує матеріали OAuth з `~/.codex`. Увійдіть через OAuth у браузері (типово) або через потік device-code вище — OpenClaw зберігає отримані облікові дані у власному сховищі автентифікації агентів.
    </Note>

    ### Індикатор стану

    Chat `/status` показує, яке середовище виконання моделі активне для поточної сесії.
    Типовий харнес PI відображається як `Runtime: OpenClaw Pi Default`. Коли
    вибрано комплектний харнес app-server Codex, `/status` показує
    `Runtime: OpenAI Codex`. Наявні сесії зберігають записаний ідентифікатор харнеса, тож використайте
    `/new` або `/reset` після зміни `embeddedHarness`, якщо хочете, щоб `/status`
    відображав новий вибір PI/Codex.

    ### Обмеження вікна контексту

    OpenClaw розглядає метадані моделі та обмеження контексту середовища виконання як окремі значення.

    Для `openai-codex/gpt-5.5` через Codex OAuth:

    - Нативне `contextWindow`: `1000000`
    - Типове обмеження `contextTokens` середовища виконання: `272000`

    Менше типове обмеження на практиці дає кращі характеристики затримки та якості. Перевизначте його за допомогою `contextTokens`:

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
    Використовуйте `contextWindow`, щоб оголосити нативні метадані моделі. Використовуйте `contextTokens`, щоб обмежити бюджет контексту середовища виконання.
    </Note>

    ### Відновлення каталогу

    OpenClaw використовує метадані каталогу Codex з апстриму для `gpt-5.5`, коли вони
    доступні. Якщо живе виявлення Codex пропускає рядок `openai-codex/gpt-5.5`, поки
    обліковий запис автентифікований, OpenClaw синтезує цей рядок моделі OAuth, щоб
    Cron, підлеглий агент і запуски з налаштованою моделлю за замовчуванням не завершувалися
    помилкою `Unknown model`.

  </Tab>
</Tabs>

## Генерація зображень

Комплектний Plugin `openai` реєструє генерацію зображень через інструмент `image_generate`.
Він підтримує як генерацію зображень OpenAI через API key, так і генерацію з
автентифікацією Codex OAuth через те саме посилання на модель `openai/gpt-image-2`.

| Можливість                | OpenAI API key                      | Codex OAuth                          |
| ------------------------- | ----------------------------------- | ------------------------------------ |
| Model ref                 | `openai/gpt-image-2`                | `openai/gpt-image-2`                 |
| Автентифікація            | `OPENAI_API_KEY`                    | вхід через OpenAI Codex OAuth        |
| Транспорт                 | OpenAI Images API                   | бекенд Codex Responses               |
| Максимум зображень на запит | 4                                 | 4                                    |
| Режим редагування         | Увімкнено (до 5 еталонних зображень) | Увімкнено (до 5 еталонних зображень) |
| Перевизначення розміру    | Підтримується, включно з розмірами 2K/4K | Підтримується, включно з розмірами 2K/4K |
| Співвідношення сторін / роздільна здатність | Не передається в OpenAI Images API | Відображається на підтримуваний розмір, коли це безпечно |

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
Див. [Генерація зображень](/uk/tools/image-generation), щоб дізнатися про спільні параметри інструмента, вибір провайдера та поведінку резервного перемикання.
</Note>

`gpt-image-2` — це типове значення і для генерації зображень з тексту OpenAI, і для
редагування зображень. `gpt-image-1` залишається придатною як явне перевизначення моделі, але нові
робочі процеси OpenAI для зображень мають використовувати `openai/gpt-image-2`.

Для інсталяцій із Codex OAuth використовуйте те саме посилання `openai/gpt-image-2`. Коли
налаштовано OAuth-профіль `openai-codex`, OpenClaw знаходить цей збережений OAuth
токен доступу й надсилає запити на зображення через бекенд Codex Responses. Він
не намагається спочатку використати `OPENAI_API_KEY` і не виконує тихого резервного переходу на API key для цього
запиту. Явно налаштуйте `models.providers.openai` з API key,
власним базовим URL або кінцевою точкою Azure, якщо ви хочете використовувати прямий маршрут OpenAI Images API
замість цього.
Якщо ця власна кінцева точка зображень розташована в довіреній LAN/приватній адресі, також установіть
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw залишає
приватні/внутрішні OpenAI-сумісні кінцеві точки зображень заблокованими, якщо цей явний дозвіл
не задано.

Генерація:

```
/tool image_generate model=openai/gpt-image-2 prompt="Відшліфований постер запуску для OpenClaw на macOS" size=3840x2160 count=1
```

Редагування:

```
/tool image_generate model=openai/gpt-image-2 prompt="Збережіть форму об’єкта, змініть матеріал на прозоре скло" image=/path/to/reference.png size=1024x1536
```

## Генерація відео

Комплектний Plugin `openai` реєструє генерацію відео через інструмент `video_generate`.

| Можливість       | Значення                                                                          |
| ---------------- | --------------------------------------------------------------------------------- |
| Модель за замовчуванням | `openai/sora-2`                                                            |
| Режими           | Текст у відео, зображення у відео, редагування одного відео                       |
| Еталонні вхідні дані | 1 зображення або 1 відео                                                      |
| Перевизначення розміру | Підтримується                                                                |
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
Див. [Генерація відео](/uk/tools/video-generation), щоб дізнатися про спільні параметри інструмента, вибір провайдера та поведінку резервного перемикання.
</Note>

## Внесок у prompt для GPT-5

OpenClaw додає спільний внесок у prompt для запусків сімейства GPT-5 у різних провайдерів. Він застосовується за ідентифікатором моделі, тому `openai-codex/gpt-5.5`, `openai/gpt-5.4`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` та інші сумісні посилання GPT-5 отримують той самий накладений шар. Старіші моделі GPT-4.x його не отримують.

Комплектний нативний харнес Codex використовує ту саму поведінку GPT-5 і накладений шар Heartbeat через інструкції розробника app-server Codex, тому сесії `openai/gpt-5.x`, примусово спрямовані через `embeddedHarness.runtime: "codex"`, зберігають ті самі настанови щодо доведення справи до кінця та проактивного Heartbeat, навіть якщо рештою prompt харнеса керує Codex.

Внесок GPT-5 додає тегований контракт поведінки для збереження персони, безпеки виконання, дисципліни інструментів, форми виводу, перевірок завершення та верифікації. Поведінка відповідей, специфічна для каналу, і поведінка тихих повідомлень залишаються у спільному системному prompt OpenClaw та політиці вихідної доставки. Настанови GPT-5 завжди ввімкнені для відповідних моделей. Рівень дружнього стилю взаємодії є окремим і налаштовуваним.

| Значення              | Ефект                                      |
| --------------------- | ------------------------------------------ |
| `"friendly"` (типово) | Увімкнути рівень дружнього стилю взаємодії |
| `"on"`                | Псевдонім для `"friendly"`                 |
| `"off"`               | Вимкнути лише рівень дружнього стилю       |

<Tabs>
  <Tab title="Конфігурація">
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
Застаріле `plugins.entries.openai.config.personality` усе ще читається як сумісний резервний варіант, якщо спільне налаштування `agents.defaults.promptOverlays.gpt5.personality` не задано.
</Note>

## Голос і мовлення

<AccordionGroup>
  <Accordion title="Синтез мовлення (TTS)">
    Комплектний Plugin `openai` реєструє синтез мовлення для поверхні `messages.tts`.

    | Параметр | Шлях конфігурації | Типово |
    |---------|------------|---------|
    | Модель | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Голос | `messages.tts.providers.openai.voice` | `coral` |
    | Швидкість | `messages.tts.providers.openai.speed` | (не задано) |
    | Інструкції | `messages.tts.providers.openai.instructions` | (не задано, лише `gpt-4o-mini-tts`) |
    | Формат | `messages.tts.providers.openai.responseFormat` | `opus` для голосових нотаток, `mp3` для файлів |
    | API key | `messages.tts.providers.openai.apiKey` | Резервно використовує `OPENAI_API_KEY` |
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
    Установіть `OPENAI_TTS_BASE_URL`, щоб перевизначити базовий URL для TTS, не впливаючи на кінцеву точку chat API.
    </Note>

  </Accordion>

  <Accordion title="Перетворення мовлення на текст">
    Комплектний Plugin `openai` реєструє пакетне перетворення мовлення на текст через
    поверхню транскрибування з розумінням медіа в OpenClaw.

    - Модель за замовчуванням: `gpt-4o-transcribe`
    - Кінцева точка: REST OpenAI `/v1/audio/transcriptions`
    - Шлях вхідних даних: multipart-вивантаження аудіофайлу
    - Підтримується в OpenClaw всюди, де вхідне транскрибування аудіо використовує
      `tools.media.audio`, включно з сегментами голосового каналу Discord і
      аудіовкладеннями каналів

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

    Підказки мови та prompt передаються до OpenAI, якщо вони задані
    спільною конфігурацією аудіомедіа або запитом на транскрибування для окремого виклику.

  </Accordion>

  <Accordion title="Транскрибування в реальному часі">
    Комплектний Plugin `openai` реєструє транскрибування в реальному часі для Plugin Voice Call.

    | Параметр | Шлях конфігурації | Типово |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Мова | `...openai.language` | (не задано) |
    | Prompt | `...openai.prompt` | (не задано) |
    | Тривалість тиші | `...openai.silenceDurationMs` | `800` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | API key | `...openai.apiKey` | Резервно використовує `OPENAI_API_KEY` |

    <Note>
    Використовує з’єднання WebSocket з `wss://api.openai.com/v1/realtime` з аудіо G.711 u-law (`g711_ulaw` / `audio/pcmu`). Цей потоковий провайдер призначений для шляху транскрибування в реальному часі у Voice Call; голос у Discord зараз записує короткі сегменти й замість цього використовує пакетний шлях транскрибування `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Голос у реальному часі">
    Комплектний Plugin `openai` реєструє голос у реальному часі для Plugin Voice Call.

    | Параметр | Шлях конфігурації | Типово |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Голос | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | Тривалість тиші | `...openai.silenceDurationMs` | `500` |
    | API key | `...openai.apiKey` | Резервно використовує `OPENAI_API_KEY` |

    <Note>
    Підтримує Azure OpenAI через ключі конфігурації `azureEndpoint` і `azureDeployment`. Підтримує двобічний виклик інструментів. Використовує аудіоформат G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Кінцеві точки Azure OpenAI

Комплектний провайдер `openai` може націлюватися на ресурс Azure OpenAI для генерації
зображень шляхом перевизначення базового URL. На шляху генерації зображень OpenClaw
визначає імена хостів Azure в `models.providers.openai.baseUrl` і автоматично перемикається на
формат запитів Azure.

<Note>
Голос у реальному часі використовує окремий шлях конфігурації
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
і не залежить від `models.providers.openai.baseUrl`. Див. акордеон **Голос у реальному
часі** в розділі [Голос і мовлення](#voice-and-speech), щоб дізнатися про його параметри Azure.
</Note>

Використовуйте Azure OpenAI, коли:

- У вас уже є підписка Azure OpenAI, квота або корпоративна угода
- Вам потрібні регіональне зберігання даних або механізми відповідності, які надає Azure
- Ви хочете зберегти трафік у межах наявного тенанту Azure

### Конфігурація

Для генерації зображень через Azure за допомогою комплектного провайдера `openai` вкажіть
`models.providers.openai.baseUrl` на свій ресурс Azure і встановіть `apiKey` у значення
ключа Azure OpenAI (а не ключа OpenAI Platform):

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
- Використовує шляхи в межах розгортання (`/openai/deployments/{deployment}/...`)
- Додає `?api-version=...` до кожного запиту

Інші базові URL (публічний OpenAI, OpenAI-сумісні проксі) зберігають стандартний
формат запитів зображень OpenAI.

<Note>
Маршрутизація Azure для шляху генерації зображень провайдера `openai` потребує
OpenClaw 2026.4.22 або новішої версії. Раніші версії трактують будь-який власний
`openai.baseUrl` як публічну кінцеву точку OpenAI і завершаться помилкою при роботі з розгортаннями
зображень Azure.
</Note>

### Версія API

Установіть `AZURE_OPENAI_API_VERSION`, щоб зафіксувати конкретну preview- або GA-версію Azure
для шляху генерації зображень Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Типове значення — `2024-12-01-preview`, якщо змінна не задана.

### Назви моделей — це назви розгортань

Azure OpenAI прив’язує моделі до розгортань. Для запитів генерації зображень Azure,
маршрутизованих через комплектний провайдер `openai`, поле `model` в OpenClaw
має бути **назвою розгортання Azure**, яку ви налаштували в порталі Azure, а не
ідентифікатором публічної моделі OpenAI.

Якщо ви створите розгортання з назвою `gpt-image-2-prod`, яке обслуговує `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="Чистий постер" size=1024x1024 count=1
```

Те саме правило назв розгортань застосовується до викликів генерації зображень,
маршрутизованих через комплектний провайдер `openai`.

### Регіональна доступність

Генерація зображень Azure зараз доступна лише в частині регіонів
(наприклад, `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Перевірте актуальний список регіонів Microsoft перед створенням
розгортання й підтвердьте, що конкретна модель доступна у вашому регіоні.

### Відмінності параметрів

Azure OpenAI і публічний OpenAI не завжди приймають однакові параметри зображень.
Azure може відхиляти параметри, які дозволяє публічний OpenAI (наприклад, певні
значення `background` для `gpt-image-2`) або надавати їх лише для певних версій
моделі. Ці відмінності походять від Azure та базової моделі, а не від
OpenClaw. Якщо запит Azure завершується помилкою валідації, перевірте
набір параметрів, який підтримує ваше конкретне розгортання та версія API, у
порталі Azure.

<Note>
Azure OpenAI використовує нативний транспорт і поведінку сумісності, але не отримує
прихованих заголовків атрибуції OpenClaw — див. акордеон **Нативні та OpenAI-сумісні
маршрути** в розділі [Розширена конфігурація](#advanced-configuration).

Для трафіку chat або Responses в Azure (поза межами генерації зображень) використовуйте
потік онбордингу або окрему конфігурацію провайдера Azure — одного лише
`openai.baseUrl` недостатньо, щоб застосувати форму Azure API/автентифікації. Існує
окремий провайдер `azure-openai-responses/*`; див.
акордеон Server-side compaction нижче.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Транспорт (WebSocket чи SSE)">
    OpenClaw використовує WebSocket у першу чергу з резервним переходом на SSE (`"auto"`) як для `openai/*`, так і для `openai-codex/*`.

    У режимі `"auto"` OpenClaw:
    - Повторює одну ранню помилку WebSocket перед переходом на SSE
    - Після помилки позначає WebSocket як деградований приблизно на 60 секунд і використовує SSE протягом періоду охолодження
    - Прикріплює стабільні заголовки ідентичності сесії та ходу для повторів і повторних підключень
    - Нормалізує лічильники використання (`input_tokens` / `prompt_tokens`) між варіантами транспорту

    | Значення | Поведінка |
    |-------|----------|
    | `"auto"` (типово) | Спочатку WebSocket, резервно SSE |
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

    Пов’язані документи OpenAI:
    - [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Прогрівання WebSocket">
    OpenClaw типово вмикає прогрівання WebSocket для `openai/*` і `openai-codex/*`, щоб зменшити затримку першого ходу.

    ```json5
    // Вимкнути прогрівання
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

    - **Chat/UI:** `/fast status|on|off`
    - **Конфігурація:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Коли цей режим увімкнено, OpenClaw зіставляє швидкий режим із пріоритетною обробкою OpenAI (`service_tier = "priority"`). Наявні значення `service_tier` зберігаються, а швидкий режим не переписує `reasoning` або `text.verbosity`.

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
    Перевизначення сесії мають пріоритет над конфігурацією. Очищення перевизначення сесії в UI Sessions повертає сесію до налаштованого типового значення.
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
    `serviceTier` передається лише до нативних кінцевих точок OpenAI (`api.openai.com`) і нативних кінцевих точок Codex (`chatgpt.com/backend-api`). Якщо ви маршрутизуєте будь-якого провайдера через проксі, OpenClaw залишає `service_tier` без змін.
    </Warning>

  </Accordion>

  <Accordion title="Server-side Compaction (Responses API)">
    Для прямих моделей OpenAI Responses (`openai/*` на `api.openai.com`) обгортка потоку Pi-harness у Plugin OpenAI автоматично вмикає Server-side Compaction:

    - Примусово встановлює `store: true` (якщо лише сумісність моделі не задає `supportsStore: false`)
    - Вставляє `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Типовий `compact_threshold`: 70% від `contextWindow` (або `80000`, якщо він недоступний)

    Це застосовується до вбудованого шляху Pi harness і до хуків провайдера OpenAI, які використовуються в embedded-запусках. Нативний харнес app-server Codex керує власним контекстом через Codex і налаштовується окремо через `agents.defaults.embeddedHarness.runtime`.

    <Tabs>
      <Tab title="Явно увімкнути">
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
    `responsesServerCompaction` керує лише вставленням `context_management`. Прямі моделі OpenAI Responses все одно примусово встановлюють `store: true`, якщо сумісність не задає `supportsStore: false`.
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

    З `strict-agentic` OpenClaw:
    - Більше не вважає хід лише з планом успішним прогресом, коли доступна дія інструмента
    - Повторює хід із настановою діяти негайно
    - Автоматично вмикає `update_plan` для суттєвої роботи
    - Показує явний заблокований стан, якщо модель продовжує планувати без дії

    <Note>
    Обмежено лише запусками сімейства GPT-5 OpenAI та Codex. Інші провайдери та старіші сімейства моделей зберігають типову поведінку.
    </Note>

  </Accordion>

  <Accordion title="Нативні та OpenAI-сумісні маршрути">
    OpenClaw по-різному обробляє прямі кінцеві точки OpenAI, Codex і Azure OpenAI та загальні OpenAI-сумісні проксі `/v1`:

    **Нативні маршрути** (`openai/*`, Azure OpenAI):
    - Зберігають `reasoning: { effort: "none" }` лише для моделей, які підтримують OpenAI-значення effort `none`
    - Пропускають вимкнений reasoning для моделей або проксі, що відхиляють `reasoning.effort: "none"`
    - Типово використовують strict mode для схем інструментів
    - Прикріплюють приховані заголовки атрибуції лише на перевірених нативних хостах
    - Зберігають формування запитів, притаманне лише OpenAI (`service_tier`, `store`, reasoning-compat, підказки кешу prompt)

    **Проксі/сумісні маршрути:**
    - Використовують м’якшу поведінку сумісності
    - Видаляють Completions `store` з ненативних корисних навантажень `openai-completions`
    - Приймають JSON-проброс `params.extra_body`/`params.extraBody` для розширених OpenAI-сумісних проксі Completions
    - Не примушують strict-схеми інструментів або заголовки, притаманні лише нативним маршрутам

    Azure OpenAI використовує нативний транспорт і поведінку сумісності, але не отримує прихованих заголовків атрибуції.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки резервного перемикання.
  </Card>
  <Card title="Генерація зображень" href="/uk/tools/image-generation" icon="image">
    Спільні параметри інструмента зображень і вибір провайдера.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента відео й вибір провайдера.
  </Card>
  <Card title="OAuth і автентифікація" href="/uk/gateway/authentication" icon="key">
    Докладніше про автентифікацію та правила повторного використання облікових даних.
  </Card>
</CardGroup>
