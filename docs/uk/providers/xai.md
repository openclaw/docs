---
read_when:
    - Ви хочете використовувати моделі Grok в OpenClaw
    - Ви налаштовуєте автентифікацію xAI або ідентифікатори моделей
summary: Використовуйте моделі xAI Grok у OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-06-27T18:15:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b89c1037f9800366c03bdd1313a8c4ff05e8675effa60ed1e2985d38f045aad4
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw постачається з вбудованим Plugin провайдера `xai` для моделей Grok. Для більшості
користувачів рекомендований шлях — Grok OAuth з відповідною підпискою SuperGrok або X Premium.
OpenClaw залишається локально-орієнтованим: Gateway, конфігурація, маршрутизація та
інструменти працюють на вашому комп’ютері, тоді як запити до моделей Grok автентифікуються через xAI
і надсилаються до API xAI.

OAuth не потребує ключа API xAI і не потребує застосунку Grok Build.
xAI усе ще може показувати Grok Build на екрані згоди, оскільки OpenClaw використовує
спільний OAuth-клієнт xAI.

## Виберіть шлях налаштування

Використовуйте шлях, що відповідає стану вашої інсталяції OpenClaw:

<Steps>
  <Step title="Нова інсталяція OpenClaw">
    Запустіть початкове налаштування з установленням демона, коли налаштовуєте новий локальний
    Gateway, а потім виберіть варіант xAI/Grok OAuth на кроці моделі/автентифікації:

    ```bash
    openclaw onboard --install-daemon
    ```

    На VPS або через SSH виберіть xAI OAuth напряму; OpenClaw використовує перевірку
    через код пристрою і не потребує callback на localhost:

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

    OAuth не потребує ключа API xAI. OpenClaw не потребує застосунку Grok
    Build. xAI усе ще може позначати застосунок згоди як Grok Build, оскільки
    OpenClaw використовує спільний OAuth-клієнт xAI.

  </Step>
  <Step title="Наявна інсталяція OpenClaw">
    Якщо OpenClaw уже налаштовано, увійдіть лише в xAI. Не запускайте повне
    початкове налаштування повторно і не перевстановлюйте демон лише для підключення Grok:

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Щоб зробити Grok моделлю за замовчуванням після входу, застосуйте це окремо:

    ```bash
    openclaw models set xai/grok-4.3
    ```

    Повторно запускайте повне початкове налаштування лише якщо ви навмисно хочете змінити Gateway,
    демон, канал, робочу область або інші параметри налаштування.

  </Step>
  <Step title="Шлях із ключем API">
    Налаштування з ключем API і надалі працює для ключів xAI Console та для медійних поверхонь, які
    потребують конфігурації провайдера на основі ключа:

    ```bash
    openclaw models auth login --provider xai --method api-key
    export XAI_API_KEY=xai-...
    ```

  </Step>
  <Step title="Виберіть модель">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4.3" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw використовує xAI Responses API як вбудований транспорт xAI. Ті самі
облікові дані з `openclaw models auth login --provider xai --method oauth` або
`openclaw models auth login --provider xai --method api-key` також можуть забезпечувати першокласні
`web_search`, `x_search`, віддалене `code_execution` та генерацію зображень/відео xAI.
Мовлення і транскрипція наразі потребують `XAI_API_KEY` або конфігурації провайдера.
`web_search` на базі Grok віддає перевагу xAI OAuth і повертається до `XAI_API_KEY` або
конфігурації веб-пошуку Plugin.
Якщо ви зберігаєте ключ xAI у `plugins.entries.xai.config.webSearch.apiKey`,
вбудований провайдер моделей xAI також повторно використовує цей ключ як резервний.
Установіть `plugins.entries.xai.config.webSearch.baseUrl`, щоб маршрутизувати Grok `web_search`
і, за замовчуванням, `x_search` через операторський проксі xAI Responses.
Налаштування `code_execution` розміщені в `plugins.entries.xai.config.codeExecution`.
</Note>

## Усунення проблем OAuth

- Для SSH, Docker, VPS або інших віддалених налаштувань використовуйте
  `openclaw models auth login --provider xai --method oauth`; xAI OAuth використовує
  перевірку через код пристрою замість callback на localhost.
- Якщо вхід успішний, але Grok не є моделлю за замовчуванням, виконайте
  `openclaw models set xai/grok-4.3`.
- Щоб переглянути збережені профілі автентифікації xAI, виконайте:

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- xAI вирішує, які облікові записи можуть отримувати токени API через OAuth. Якщо обліковий запис
  не відповідає вимогам, спробуйте шлях із ключем API або перевірте підписку на стороні xAI.

<Tip>
Використовуйте `xai-oauth`, коли входите з SSH, Docker або VPS. OpenClaw виводить
URL xAI і короткий код; завершіть вхід у будь-якому локальному браузері, поки віддалений
процес опитує xAI щодо завершеного обміну токена.
</Tip>

## Вбудований каталог

OpenClaw містить поточні чат-моделі xAI одразу з коробки, впорядковані від найновіших
до найстаріших у вибірниках моделей:

| Родина         | ID моделей                                                               |
| -------------- | ------------------------------------------------------------------------ |
| Grok Build 0.1 | `grok-build-0.1`                                                         |
| Grok 4.3       | `grok-4.3`                                                               |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |

Plugin і надалі forward-resolves старіші слаги Grok 3, Grok 4, Grok 4 Fast, Grok 4.1
Fast і Grok Code для наявних конфігурацій. Офіційні псевдоніми Grok Code Fast
нормалізуються до `grok-build-0.1`; OpenClaw більше не показує інші вилучені
вищестоящі слаги у вибірковому каталозі.

<Tip>
Використовуйте `grok-4.3` для загального чату та `grok-build-0.1` для робочих навантажень,
орієнтованих на збірку/кодування, якщо вам явно не потрібен beta-псевдонім Grok 4.20.
</Tip>

## Покриття можливостей OpenClaw

Вбудований Plugin зіставляє поточну публічну поверхню API xAI зі спільними
контрактами провайдера та інструментів OpenClaw. Можливості, які не вписуються у спільний контракт
(наприклад, потоковий TTS і голос у реальному часі), не експонуються - див. таблицю
нижче.

| Можливість xAI            | Поверхня OpenClaw                         | Стан                                                                |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| Чат / Responses            | провайдер моделі `xai/<model>`            | Так                                                                 |
| Серверний веб-пошук        | провайдер `web_search` `grok`             | Так                                                                 |
| Серверний пошук X          | інструмент `x_search`                     | Так                                                                 |
| Серверне виконання коду    | інструмент `code_execution`               | Так                                                                 |
| Зображення                 | `image_generate`                          | Так                                                                 |
| Відео                      | `video_generate`                          | Так                                                                 |
| Пакетний text-to-speech    | `messages.tts.provider: "xai"` / `tts`    | Так                                                                 |
| Потоковий TTS              | -                                         | Не експонується; контракт TTS OpenClaw повертає повні аудіобуфери   |
| Пакетний speech-to-text    | `tools.media.audio` / розуміння медіа     | Так                                                                 |
| Потоковий speech-to-text   | Voice Call `streaming.provider: "xai"`    | Так                                                                 |
| Голос у реальному часі     | -                                         | Ще не експонується; інший контракт сесії/WebSocket                  |
| Файли / пакети             | Лише сумісність із Generic model API      | Не першокласний інструмент OpenClaw                                 |

<Note>
OpenClaw використовує REST API xAI для зображень/відео/TTS/STT для генерації медіа,
мовлення і пакетної транскрипції, потоковий STT WebSocket xAI для живої
транскрипції голосових викликів і Responses API для моделей, пошуку та
інструментів виконання коду. Можливості, яким потрібні інші контракти OpenClaw, як-от
сесії голосу в реальному часі, задокументовані тут як вищестоящі можливості, а не
прихована поведінка Plugin.
</Note>

### Зіставлення швидкого режиму

`/fast on` або `agents.defaults.models["xai/<model>"].params.fastMode: true`
переписує нативні запити xAI так:

| Вихідна модель | Ціль швидкого режиму |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### Застарілі псевдоніми сумісності

Застарілі псевдоніми й надалі нормалізуються до канонічних вбудованих ID:

| Застарілий псевдонім      | Канонічний ID                         |
| ------------------------- | ------------------------------------- |
| `grok-code-fast-1`        | `grok-build-0.1`                      |
| `grok-code-fast`          | `grok-build-0.1`                      |
| `grok-code-fast-1-0825`   | `grok-build-0.1`                      |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## Можливості

<AccordionGroup>
  <Accordion title="Веб-пошук">
    Вбудований провайдер веб-пошуку `grok` віддає перевагу xAI OAuth, а потім повертається
    до `XAI_API_KEY` або ключа веб-пошуку Plugin:

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Генерація відео">
    Вбудований Plugin `xai` реєструє генерацію відео через спільний
    інструмент `video_generate`.

    - Модель відео за замовчуванням: `xai/grok-imagine-video`
    - Режими: text-to-video, image-to-video, генерація reference-image, віддалене
      редагування відео та віддалене розширення відео
    - Співвідношення сторін: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Роздільності: `480P`, `720P`
    - Тривалість: 1-15 секунд для генерації/image-to-video, 1-10 секунд під час
      використання ролей `reference_image`, 2-10 секунд для розширення
    - Генерація reference-image: установіть `imageRoles` на `reference_image` для
      кожного наданого зображення; xAI приймає до 7 таких зображень
    - Тайм-аут операції за замовчуванням: 600 секунд, якщо не встановлено `video_generate.timeoutMs`
      або `agents.defaults.videoGenerationModel.timeoutMs`

    <Warning>
    Локальні відеобуфери не приймаються. Використовуйте віддалені URL `http(s)` для
    вхідних даних редагування/розширення відео. Image-to-video приймає локальні буфери зображень, оскільки
    OpenClaw може закодувати їх як data URL для xAI.
    </Warning>

    Щоб використовувати xAI як провайдера відео за замовчуванням:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "xai/grok-imagine-video",
          },
        },
      },
    }
    ```

    <Note>
    Див. [Генерація відео](/uk/tools/video-generation) щодо спільних параметрів інструмента,
    вибору провайдера та поведінки failover.
    </Note>

  </Accordion>

  <Accordion title="Генерація зображень">
    Вбудований Plugin `xai` реєструє генерацію зображень через спільний
    інструмент `image_generate`.

    - Модель зображень за замовчуванням: `xai/grok-imagine-image`
    - Додаткова модель: `xai/grok-imagine-image-quality`
    - Режими: text-to-image і редагування reference-image
    - Вхідні посилання: одне `image` або до п’яти `images`
    - Співвідношення сторін: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Роздільності: `1K`, `2K`
    - Кількість: до 4 зображень
    - Тайм-аут операції за замовчуванням: 600 секунд, якщо не встановлено `image_generate.timeoutMs`
      або `agents.defaults.imageGenerationModel.timeoutMs`

    OpenClaw запитує в xAI відповіді зображень `b64_json`, щоб згенеровані медіа могли
    зберігатися і доставлятися через звичайний шлях вкладень каналу. Локальні
    референсні зображення перетворюються на data URL; віддалені посилання `http(s)`
    передаються без змін.

    Щоб використовувати xAI як провайдера зображень за замовчуванням:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "xai/grok-imagine-image",
          },
        },
      },
    }
    ```

    <Note>
    xAI також документує `quality`, `mask`, `user` і додаткові власні співвідношення
    сторін, як-от `1:2`, `2:1`, `9:20` і `20:9`. Наразі OpenClaw передає лише
    спільні міжпровайдерні елементи керування зображеннями; непідтримувані
    суто власні регулятори навмисно не доступні через `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Перетворення тексту на мовлення">
    Вбудований Plugin `xai` реєструє перетворення тексту на мовлення через спільну
    провайдерську поверхню `tts`.

    - Голоси: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - Голос за замовчуванням: `eve`
    - Формати: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Мова: код BCP-47 або `auto`
    - Швидкість: власне перевизначення швидкості провайдера
    - Власний формат голосових нотаток Opus не підтримується

    Щоб використовувати xAI як провайдера TTS за замовчуванням:

    ```json5
    {
      messages: {
        tts: {
          provider: "xai",
          providers: {
            xai: {
              speakerVoiceId: "eve",
            },
          },
        },
      },
    }
    ```

    <Note>
    OpenClaw використовує пакетну кінцеву точку xAI `/v1/tts`. xAI також пропонує потокове TTS
    через WebSocket, але контракт мовленнєвого провайдера OpenClaw наразі очікує
    повний аудіобуфер перед доставкою відповіді.
    </Note>

  </Accordion>

  <Accordion title="Перетворення мовлення на текст">
    Вбудований Plugin `xai` реєструє пакетне перетворення мовлення на текст через
    поверхню транскрипції для розуміння медіа OpenClaw.

    - Модель за замовчуванням: `grok-stt`
    - Кінцева точка: xAI REST `/v1/stt`
    - Шлях введення: завантаження аудіофайлу multipart
    - Підтримується OpenClaw усюди, де транскрипція вхідного аудіо використовує
      `tools.media.audio`, зокрема сегменти голосових каналів Discord і
      аудіовкладення каналів

    Щоб примусово використовувати xAI для транскрипції вхідного аудіо:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "xai",
                model: "grok-stt",
              },
            ],
          },
        },
      },
    }
    ```

    Мову можна вказати через спільну конфігурацію аудіомедіа або запит
    транскрипції для окремого виклику. Підказки приймаються спільною поверхнею
    OpenClaw, але інтеграція xAI REST STT передає лише файл, модель і
    мову, оскільки вони чітко відповідають поточній публічній кінцевій точці xAI.

  </Accordion>

  <Accordion title="Потокове перетворення мовлення на текст">
    Вбудований Plugin `xai` також реєструє провайдера транскрипції в реальному часі
    для аудіо голосових викликів наживо.

    - Кінцева точка: xAI WebSocket `wss://api.x.ai/v1/stt`
    - Кодування за замовчуванням: `mulaw`
    - Частота дискретизації за замовчуванням: `8000`
    - Визначення кінця мовлення за замовчуванням: `800ms`
    - Проміжні транскрипти: увімкнено за замовчуванням

    Медіапотік Twilio у Voice Call надсилає аудіокадри G.711 µ-law, тому
    провайдер xAI може передавати ці кадри напряму без транскодування:

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              streaming: {
                enabled: true,
                provider: "xai",
                providers: {
                  xai: {
                    apiKey: "${XAI_API_KEY}",
                    endpointingMs: 800,
                    language: "en",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

    Конфігурація, якою володіє провайдер, розміщується в
    `plugins.entries.voice-call.config.streaming.providers.xai`. Підтримувані
    ключі: `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw` або
    `alaw`), `interimResults`, `endpointingMs` і `language`.

    <Note>
    Цей потоковий провайдер призначений для шляху транскрипції Voice Call у реальному часі.
    Голос Discord наразі записує короткі сегменти й натомість використовує пакетний
    шлях транскрипції `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Конфігурація x_search">
    Вбудований Plugin xAI надає `x_search` як інструмент OpenClaw для пошуку
    вмісту X (раніше Twitter) через Grok.

    Шлях конфігурації: `plugins.entries.xai.config.xSearch`

    | Ключ               | Тип     | За замовчуванням  | Опис                                 |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | -                  | Увімкнути або вимкнути x_search      |
    | `model`            | string  | `grok-4-1-fast`    | Модель, що використовується для запитів x_search |
    | `baseUrl`          | string  | -                  | Перевизначення базового URL xAI Responses |
    | `inlineCitations`  | boolean | -                  | Додавати вбудовані цитування в результати |
    | `maxTurns`         | number  | -                  | Максимальна кількість ходів розмови  |
    | `timeoutSeconds`   | number  | -                  | Тайм-аут запиту в секундах           |
    | `cacheTtlMinutes`  | number  | -                  | Час життя кешу в хвилинах            |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast",
                baseUrl: "https://api.x.ai/v1",
                inlineCitations: true,
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Конфігурація виконання коду">
    Вбудований Plugin xAI надає `code_execution` як інструмент OpenClaw для
    віддаленого виконання коду в середовищі sandbox xAI.

    Шлях конфігурації: `plugins.entries.xai.config.codeExecution`

    | Ключ              | Тип     | За замовчуванням       | Опис                                  |
    | ----------------- | ------- | ---------------------- | ------------------------------------- |
    | `enabled`         | boolean | `true` (якщо ключ доступний) | Увімкнути або вимкнути виконання коду |
    | `model`           | string  | `grok-4-1-fast`        | Модель, що використовується для запитів виконання коду |
    | `maxTurns`        | number  | -                      | Максимальна кількість ходів розмови   |
    | `timeoutSeconds`  | number  | -                      | Тайм-аут запиту в секундах            |

    <Note>
    Це віддалене виконання в sandbox xAI, а не локальний [`exec`](/uk/tools/exec).
    </Note>

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Відомі обмеження">
    - Автентифікація xAI може використовувати ключ API, змінну середовища, резервну
      конфігурацію Plugin або OAuth з відповідним обліковим записом xAI. OAuth використовує перевірку
      за кодом пристрою без зворотного виклику localhost. xAI визначає, які облікові записи можуть отримувати OAuth
      API tokens, а сторінка згоди може показувати Grok Build, хоча OpenClaw
      не потребує застосунку Grok Build.
    - OpenClaw наразі не надає сімейство багатоагентних моделей xAI. xAI
      обслуговує ці моделі через Responses API, але вони не приймають
      клієнтські або користувацькі інструменти, які використовуються спільним циклом агента OpenClaw. Див.
      [обмеження багатоагентних моделей xAI](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations).
    - Голос xAI Realtime ще не зареєстровано як провайдера OpenClaw. Він
      потребує іншого двонапрямного контракту голосового сеансу, ніж пакетний STT або
      потокова транскрипція.
    - `quality` зображень xAI, `mask` зображень і додаткові суто власні співвідношення сторін
      не доступні, доки спільний інструмент `image_generate` не матиме відповідних
      міжпровайдерних елементів керування.
  </Accordion>

  <Accordion title="Розширені примітки">
    - OpenClaw автоматично застосовує сумісні виправлення, специфічні для xAI, для схем інструментів і викликів інструментів
      у спільному шляху runner.
    - Нативні запити xAI за замовчуванням мають `tool_stream: true`. Установіть
      `agents.defaults.models["xai/<model>"].params.tool_stream` на `false`, щоб
      вимкнути це.
    - Вбудована обгортка xAI видаляє непідтримувані прапорці суворої схеми інструментів і
      ключі корисного навантаження reasoning *effort* перед надсиланням нативних запитів xAI. Лише
      `grok-4.3` / `grok-4.3-*` оголошують налаштовуване зусилля reasoning; усі
      інші моделі xAI з можливістю reasoning все одно запитують
      `include: ["reasoning.encrypted_content"]`, щоб попередній зашифрований reasoning
      можна було відтворити в наступних ходах.
    - `web_search`, `x_search` і `code_execution` надаються як інструменти OpenClaw.
      OpenClaw вмикає конкретний вбудований інструмент xAI, який потрібен у кожному запиті інструмента,
      замість додавання всіх нативних інструментів до кожного ходу чату.
    - Grok `web_search` читає `plugins.entries.xai.config.webSearch.baseUrl`.
      `x_search` читає `plugins.entries.xai.config.xSearch.baseUrl`, а потім
      повертається до базового URL вебпошуку Grok.
    - `x_search` і `code_execution` належать вбудованому Plugin xAI, а не
      жорстко закодовані в основному runtime моделей.
    - `code_execution` — це віддалене виконання в sandbox xAI, а не локальний
      [`exec`](/uk/tools/exec).
  </Accordion>
</AccordionGroup>

## Тестування наживо

Медіашляхи xAI покриті модульними тестами й opt-in наборами тестів наживо. Експортуйте
`XAI_API_KEY` у середовищі процесу перед запуском живих проб.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Специфічний для провайдера файл тестів наживо синтезує звичайне TTS, телефонно-дружнє PCM
TTS, транскрибує аудіо через пакетний STT xAI, транслює той самий PCM через xAI
STT у реальному часі, генерує результат text-to-image і редагує еталонне зображення. Спільний
файл тестів зображень наживо перевіряє того самого провайдера xAI через шлях
вибору runtime, резервного варіанта, нормалізації та медіавкладень OpenClaw.

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки перемикання після збою.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри відеоінструмента та вибір провайдера.
  </Card>
  <Card title="Усі провайдери" href="/uk/providers/index" icon="grid-2">
    Ширший огляд провайдерів.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Поширені проблеми та виправлення.
  </Card>
</CardGroup>
