---
read_when:
    - Ви хочете використовувати моделі Grok в OpenClaw
    - Ви налаштовуєте автентифікацію xAI або ідентифікатори моделей
summary: Використовуйте моделі xAI Grok в OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-04-25T17:33:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 420f60d5e80964b926e50cf74cf414d11de1c30d3a4aa8917f1861e0d56ef5b9
    source_path: providers/xai.md
    workflow: 15
---

OpenClaw постачається з вбудованим Plugin провайдера `xai` для моделей Grok.

## Початок роботи

<Steps>
  <Step title="Створіть ключ API">
    Створіть ключ API у [консолі xAI](https://console.x.ai/).
  </Step>
  <Step title="Установіть ключ API">
    Установіть `XAI_API_KEY` або виконайте:

    ```bash
    openclaw onboard --auth-choice xai-api-key
    ```

  </Step>
  <Step title="Виберіть модель">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw використовує xAI Responses API як вбудований транспорт xAI. Той самий
`XAI_API_KEY` також може використовуватися для Grok-backed `web_search`, first-class `x_search`
та віддаленого `code_execution`.
Якщо ви зберігаєте ключ xAI в `plugins.entries.xai.config.webSearch.apiKey`,
вбудований провайдер моделей xAI також повторно використовує цей ключ як резервний варіант.
Налаштування `code_execution` розміщується в `plugins.entries.xai.config.codeExecution`.
</Note>

## Вбудований каталог

OpenClaw включає ці сімейства моделей xAI із коробки:

| Сімейство      | Ідентифікатори моделей                                                   |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4         | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code      | `grok-code-fast-1`                                                       |

Plugin також виконує forward-resolve новіших ідентифікаторів `grok-4*` і `grok-code-fast*`, коли
вони дотримуються тієї самої форми API.

<Tip>
`grok-4-fast`, `grok-4-1-fast` і варіанти `grok-4.20-beta-*` — це
поточні посилання Grok із підтримкою зображень у вбудованому каталозі.
</Tip>

## Покриття можливостей OpenClaw

Вбудований Plugin зіставляє поточну публічну поверхню API xAI зі спільними
контрактами провайдера та інструментів OpenClaw. Можливості, які не вписуються у спільний контракт
(наприклад, потоковий TTS і voice у реальному часі), не відкриваються — див. таблицю
нижче.

| Можливість xAI             | Поверхня OpenClaw                        | Статус                                                              |
| -------------------------- | ---------------------------------------- | ------------------------------------------------------------------- |
| Чат / Responses            | провайдер моделей `xai/<model>`          | Так                                                                 |
| Вебпошук на стороні сервера| провайдер `web_search` `grok`            | Так                                                                 |
| Пошук X на стороні сервера | інструмент `x_search`                    | Так                                                                 |
| Виконання коду на стороні сервера | інструмент `code_execution`       | Так                                                                 |
| Зображення                 | `image_generate`                         | Так                                                                 |
| Відео                      | `video_generate`                         | Так                                                                 |
| Пакетне перетворення тексту на мовлення | `messages.tts.provider: "xai"` / `tts` | Так                                                                 |
| Потоковий TTS              | —                                        | Не відкрито; контракт TTS OpenClaw повертає завершені аудіобуфери   |
| Пакетне перетворення мовлення на текст | `tools.media.audio` / розуміння медіа | Так                                                                 |
| Потокове перетворення мовлення на текст | Voice Call `streaming.provider: "xai"` | Так                                                                 |
| Мовлення в реальному часі  | —                                        | Ще не відкрито; інший контракт сеансу/WebSocket                     |
| Файли / пакети             | Лише сумісність із Generic model API     | Не є first-class інструментом OpenClaw                              |

<Note>
OpenClaw використовує REST API xAI для зображень/відео/TTS/STT для генерації медіа,
мовлення та пакетної транскрипції, потоковий WebSocket STT xAI для живої
транскрипції голосових дзвінків, а також Responses API для моделей, пошуку та
інструментів виконання коду. Можливості, яким потрібні інші контракти OpenClaw, такі як
сеанси Realtime voice, документуються тут як можливості upstream, а не як
прихована поведінка Plugin.
</Note>

### Зіставлення швидкого режиму

`/fast on` або `agents.defaults.models["xai/<model>"].params.fastMode: true`
перезаписує нативні запити xAI так:

| Вихідна модель | Ціль швидкого режиму |
| -------------- | -------------------- |
| `grok-3`       | `grok-3-fast`        |
| `grok-3-mini`  | `grok-3-mini-fast`   |
| `grok-4`       | `grok-4-fast`        |
| `grok-4-0709`  | `grok-4-fast`        |

### Застарілі псевдоніми сумісності

Застарілі псевдоніми все ще нормалізуються до канонічних вбудованих ідентифікаторів:

| Застарілий псевдонім      | Канонічний ідентифікатор              |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## Можливості

<AccordionGroup>
  <Accordion title="Вебпошук">
    Вбудований провайдер вебпошуку `grok` також використовує `XAI_API_KEY`:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Генерація відео">
    Вбудований Plugin `xai` реєструє генерацію відео через спільний
    інструмент `video_generate`.

    - Типова модель відео: `xai/grok-imagine-video`
    - Режими: text-to-video, image-to-video, генерація reference-image, віддалене
      редагування відео та віддалене розширення відео
    - Співвідношення сторін: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Роздільні здатності: `480P`, `720P`
    - Тривалість: 1-15 секунд для generation/image-to-video, 1-10 секунд при
      використанні ролей `reference_image`, 2-10 секунд для розширення
    - Генерація reference-image: установіть `imageRoles` у `reference_image` для
      кожного наданого зображення; xAI приймає до 7 таких зображень

    <Warning>
    Локальні відеобуфери не приймаються. Використовуйте віддалені URL `http(s)` для
    входів редагування/розширення відео. image-to-video приймає локальні буфери зображень, оскільки
    OpenClaw може кодувати їх як URL даних для xAI.
    </Warning>

    Щоб використовувати xAI як типового провайдера відео:

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
    Див. [Генерація відео](/uk/tools/video-generation), щоб дізнатися про спільні параметри інструмента,
    вибір провайдера та поведінку резервного перемикання.
    </Note>

  </Accordion>

  <Accordion title="Генерація зображень">
    Вбудований Plugin `xai` реєструє генерацію зображень через спільний
    інструмент `image_generate`.

    - Типова модель зображень: `xai/grok-imagine-image`
    - Додаткова модель: `xai/grok-imagine-image-pro`
    - Режими: text-to-image і редагування reference-image
    - Вхідні reference: одне `image` або до п’яти `images`
    - Співвідношення сторін: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Роздільні здатності: `1K`, `2K`
    - Кількість: до 4 зображень

    OpenClaw запитує в xAI відповіді зображень `b64_json`, щоб згенеровані медіа могли
    зберігатися та доставлятися через звичайний шлях вкладень каналу. Локальні
    reference-зображення перетворюються на URL даних; віддалені reference `http(s)`
    передаються без змін.

    Щоб використовувати xAI як типового провайдера зображень:

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
    xAI також документує `quality`, `mask`, `user` і додаткові нативні співвідношення
    сторін, такі як `1:2`, `2:1`, `9:20` і `20:9`. OpenClaw сьогодні передає лише
    спільні міжпровайдерні елементи керування зображеннями; непідтримувані нативні параметри
    навмисно не відкриваються через `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Перетворення тексту на мовлення">
    Вбудований Plugin `xai` реєструє перетворення тексту на мовлення через спільну
    поверхню провайдера `tts`.

    - Голоси: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - Типовий голос: `eve`
    - Формати: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Мова: код BCP-47 або `auto`
    - Швидкість: нативне перевизначення швидкості провайдера
    - Нативний формат голосових нотаток Opus не підтримується

    Щоб використовувати xAI як типового провайдера TTS:

    ```json5
    {
      messages: {
        tts: {
          provider: "xai",
          providers: {
            xai: {
              voiceId: "eve",
            },
          },
        },
      },
    }
    ```

    <Note>
    OpenClaw використовує пакетний ендпоінт xAI `/v1/tts`. xAI також пропонує потоковий TTS
    через WebSocket, але контракт провайдера мовлення OpenClaw наразі очікує
    повний аудіобуфер перед доставленням відповіді.
    </Note>

  </Accordion>

  <Accordion title="Перетворення мовлення на текст">
    Вбудований Plugin `xai` реєструє пакетне перетворення мовлення на текст через
    поверхню транскрипції для розуміння медіа в OpenClaw.

    - Типова модель: `grok-stt`
    - Ендпоінт: xAI REST `/v1/stt`
    - Шлях введення: multipart-завантаження аудіофайлу
    - Підтримується в OpenClaw всюди, де транскрипція вхідного аудіо використовує
      `tools.media.audio`, включно з сегментами голосових каналів Discord і
      аудіовкладеннями каналів

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

    Мову можна передавати через спільну конфігурацію аудіомедіа або в запиті
    транскрипції для окремого виклику. Підказки prompt приймаються спільною поверхнею OpenClaw,
    але інтеграція xAI REST STT передає лише файл, модель і
    мову, оскільки саме вони чисто зіставляються з поточним публічним ендпоінтом xAI.

  </Accordion>

  <Accordion title="Потокове перетворення мовлення на текст">
    Вбудований Plugin `xai` також реєструє провайдера транскрипції в реальному часі
    для аудіо живих voice call.

    - Ендпоінт: xAI WebSocket `wss://api.x.ai/v1/stt`
    - Типове кодування: `mulaw`
    - Типова частота дискретизації: `8000`
    - Типове визначення кінця фрази: `800ms`
    - Проміжні транскрипти: увімкнено типово

    Медіапотік Twilio у Voice Call надсилає аудіокадри G.711 µ-law, тому
    провайдер xAI може пересилати ці кадри напряму без транскодування:

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

    Конфігурація, що належить провайдеру, розміщується в
    `plugins.entries.voice-call.config.streaming.providers.xai`. Підтримувані
    ключі: `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw` або
    `alaw`), `interimResults`, `endpointingMs` і `language`.

    <Note>
    Цей потоковий провайдер призначений для шляху транскрипції в реальному часі у Voice Call.
    Голосові канали Discord наразі записують короткі сегменти й замість цього використовують пакетний
    шлях транскрипції `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Налаштування x_search">
    Вбудований Plugin xAI надає `x_search` як інструмент OpenClaw для пошуку
    контенту в X (раніше Twitter) через Grok.

    Шлях конфігурації: `plugins.entries.xai.config.xSearch`

    | Ключ               | Тип     | Типове значення    | Опис                                 |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | —                  | Увімкнути або вимкнути x_search      |
    | `model`            | string  | `grok-4-1-fast`    | Модель для запитів x_search          |
    | `inlineCitations`  | boolean | —                  | Додавати вбудовані цитати в результати |
    | `maxTurns`         | number  | —                  | Максимальна кількість ходів розмови  |
    | `timeoutSeconds`   | number  | —                  | Тайм-аут запиту в секундах           |
    | `cacheTtlMinutes`  | number  | —                  | Час життя кешу в хвилинах            |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast",
                inlineCitations: true,
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Налаштування виконання коду">
    Вбудований Plugin xAI надає `code_execution` як інструмент OpenClaw для
    віддаленого виконання коду в середовищі sandbox xAI.

    Шлях конфігурації: `plugins.entries.xai.config.codeExecution`

    | Ключ              | Тип     | Типове значення           | Опис                                     |
    | ----------------- | ------- | ------------------------- | ---------------------------------------- |
    | `enabled`         | boolean | `true` (якщо ключ доступний) | Увімкнути або вимкнути виконання коду |
    | `model`           | string  | `grok-4-1-fast`           | Модель для запитів виконання коду        |
    | `maxTurns`        | number  | —                         | Максимальна кількість ходів розмови      |
    | `timeoutSeconds`  | number  | —                         | Тайм-аут запиту в секундах               |

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
    - Наразі автентифікація підтримує лише API-ключі. У OpenClaw поки що немає xAI OAuth або device-code flow.
    - `grok-4.20-multi-agent-experimental-beta-0304` не підтримується на
      звичайному шляху провайдера xAI, оскільки вимагає іншої поверхні upstream API, ніж стандартний транспорт xAI в OpenClaw.
    - Realtime voice xAI ще не зареєстровано як провайдер OpenClaw. Для нього
      потрібен інший двонапрямний контракт голосового сеансу, ніж для пакетного STT або
      потокової транскрипції.
    - `quality`, `mask` і додаткові нативні співвідношення сторін для зображень xAI
      не відкриваються, доки спільний інструмент `image_generate` не отримає відповідні
      міжпровайдерні елементи керування.
  </Accordion>

  <Accordion title="Розширені примітки">
    - OpenClaw автоматично застосовує специфічні для xAI виправлення сумісності
      схем інструментів і викликів інструментів на спільному шляху виконавця.
    - Нативні запити xAI типово використовують `tool_stream: true`. Установіть
      `agents.defaults.models["xai/<model>"].params.tool_stream` у `false`, щоб
      вимкнути це.
    - Вбудована обгортка xAI прибирає непідтримувані прапорці strict tool-schema і
      ключі payload reasoning перед надсиланням нативних запитів xAI.
    - `web_search`, `x_search` і `code_execution` надаються як інструменти OpenClaw.
      OpenClaw вмикає конкретний вбудований інструмент xAI, який потрібен, усередині кожного запиту
      інструмента замість того, щоб додавати всі нативні інструменти до кожного ходу чату.
    - `x_search` і `code_execution` належать вбудованому Plugin xAI, а не
      жорстко закодовані в основне runtime моделей.
    - `code_execution` — це віддалене виконання в sandbox xAI, а не локальний
      [`exec`](/uk/tools/exec).
  </Accordion>
</AccordionGroup>

## Живе тестування

Шляхи медіа xAI покриваються модульними тестами та opt-in живими наборами. Живі
команди завантажують секрети з вашої login shell, включно з `~/.profile`, перед
перевіркою `XAI_API_KEY`.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Специфічний для провайдера live-файл синтезує звичайний TTS, придатний для телефонії PCM
TTS, транскрибує аудіо через пакетний STT xAI, потоково передає той самий PCM через
realtime STT xAI, генерує результат text-to-image і редагує reference-image. Спільний
live-файл для зображень перевіряє того самого провайдера xAI через
вибір під час виконання в OpenClaw, резервне перемикання, нормалізацію та шлях вкладення медіа.

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки резервного перемикання.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента відео та вибір провайдера.
  </Card>
  <Card title="Усі провайдери" href="/uk/providers/index" icon="grid-2">
    Ширший огляд провайдерів.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Поширені проблеми та способи їх усунення.
  </Card>
</CardGroup>
