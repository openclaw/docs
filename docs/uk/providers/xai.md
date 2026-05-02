---
read_when:
    - Ви хочете використовувати моделі Grok в OpenClaw
    - Ви налаштовуєте автентифікацію xAI або ідентифікатори моделей
summary: Використовуйте моделі xAI Grok в OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-05-02T01:45:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9366d6a053fb515d843bbb984ee0fce2eb342a022a6d9aa60df983fc0f8d5745
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw постачається з вбудованим плагіном провайдера `xai` для моделей Grok.

## Початок роботи

<Steps>
  <Step title="Create an API key">
    Створіть API-ключ у [консолі xAI](https://console.x.ai/).
  </Step>
  <Step title="Set your API key">
    Задайте `XAI_API_KEY` або виконайте:

    ```bash
    openclaw onboard --auth-choice xai-api-key
    ```

  </Step>
  <Step title="Pick a model">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4.3" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw використовує xAI Responses API як вбудований транспорт xAI. Той самий
`XAI_API_KEY` також може забезпечувати `web_search` на базі Grok, першокласний
`x_search` і віддалене `code_execution`.
Якщо ви зберігаєте ключ xAI у `plugins.entries.xai.config.webSearch.apiKey`,
вбудований провайдер моделей xAI також повторно використовує цей ключ як резервний.
Налаштування `code_execution` розміщено в `plugins.entries.xai.config.codeExecution`.
</Note>

## Вбудований каталог

OpenClaw одразу містить такі сімейства моделей xAI:

| Сімейство      | Ідентифікатори моделей                                                    |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4.3       | `grok-4.3`                                                               |
| Grok 4         | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code      | `grok-code-fast-1`                                                       |

Плагін також перенаправляє новіші ідентифікатори `grok-4*` і `grok-code-fast*`,
коли вони мають таку саму форму API.

<Tip>
`grok-4.3`, `grok-4-fast`, `grok-4-1-fast` і варіанти `grok-4.20-beta-*`
є поточними посиланнями Grok із підтримкою зображень у вбудованому каталозі.
</Tip>

## Покриття функцій OpenClaw

Вбудований плагін відображає поточну публічну поверхню API xAI на спільні
контракти провайдерів та інструментів OpenClaw. Можливості, які не вписуються
у спільний контракт (наприклад, потоковий TTS і голос у реальному часі), не
експонуються — див. таблицю нижче.

| Можливість xAI             | Поверхня OpenClaw                         | Стан                                                                |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| Chat / Responses           | провайдер моделей `xai/<model>`           | Так                                                                 |
| Серверний вебпошук         | провайдер `web_search` `grok`             | Так                                                                 |
| Серверний пошук X          | інструмент `x_search`                     | Так                                                                 |
| Серверне виконання коду    | інструмент `code_execution`               | Так                                                                 |
| Зображення                 | `image_generate`                          | Так                                                                 |
| Відео                      | `video_generate`                          | Так                                                                 |
| Пакетний text-to-speech    | `messages.tts.provider: "xai"` / `tts`    | Так                                                                 |
| Потоковий TTS              | —                                         | Не експонується; контракт TTS OpenClaw повертає повні аудіобуфери   |
| Пакетний speech-to-text    | `tools.media.audio` / розуміння медіа     | Так                                                                 |
| Потоковий speech-to-text   | Voice Call `streaming.provider: "xai"`    | Так                                                                 |
| Голос у реальному часі     | —                                         | Ще не експонується; інший контракт сеансу/WebSocket                 |
| Файли / пакети             | Лише сумісність із загальним API моделей  | Не першокласний інструмент OpenClaw                                 |

<Note>
OpenClaw використовує REST API xAI для зображень/відео/TTS/STT для генерації
медіа, мовлення та пакетної транскрипції, потоковий WebSocket STT xAI для живої
транскрипції голосових викликів і Responses API для моделей, пошуку та
інструментів виконання коду. Функції, яким потрібні інші контракти OpenClaw,
як-от сеанси голосу в реальному часі, задокументовано тут як можливості upstream,
а не як приховану поведінку плагіна.
</Note>

### Зіставлення Fast-режиму

`/fast on` або `agents.defaults.models["xai/<model>"].params.fastMode: true`
переписує нативні запити xAI так:

| Початкова модель | Ціль Fast-режиму  |
| ---------------- | ----------------- |
| `grok-3`         | `grok-3-fast`     |
| `grok-3-mini`    | `grok-3-mini-fast` |
| `grok-4`         | `grok-4-fast`     |
| `grok-4-0709`    | `grok-4-fast`     |

### Застарілі псевдоніми сумісності

Застарілі псевдоніми й надалі нормалізуються до канонічних вбудованих ідентифікаторів:

| Застарілий псевдонім       | Канонічний ідентифікатор              |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## Функції

<AccordionGroup>
  <Accordion title="Web search">
    Вбудований провайдер вебпошуку `grok` також використовує `XAI_API_KEY`:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Video generation">
    Вбудований плагін `xai` реєструє генерацію відео через спільний
    інструмент `video_generate`.

    - Стандартна модель відео: `xai/grok-imagine-video`
    - Режими: text-to-video, image-to-video, генерація reference-image, віддалене
      редагування відео та віддалене розширення відео
    - Співвідношення сторін: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Роздільні здатності: `480P`, `720P`
    - Тривалість: 1-15 секунд для генерації/image-to-video, 1-10 секунд під час
      використання ролей `reference_image`, 2-10 секунд для розширення
    - Генерація reference-image: задайте `imageRoles` як `reference_image` для
      кожного наданого зображення; xAI приймає до 7 таких зображень

    <Warning>
    Локальні відеобуфери не приймаються. Використовуйте віддалені URL `http(s)`
    для вхідних даних редагування/розширення відео. Image-to-video приймає
    локальні буфери зображень, оскільки OpenClaw може закодувати їх як data URL
    для xAI.
    </Warning>

    Щоб використовувати xAI як стандартного постачальника відео:

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
    вибору постачальника та поведінки перемикання в разі відмови.
    </Note>

  </Accordion>

  <Accordion title="Генерація зображень">
    Вбудований `xai` plugin реєструє генерацію зображень через спільний
    інструмент `image_generate`.

    - Стандартна модель зображень: `xai/grok-imagine-image`
    - Додаткова модель: `xai/grok-imagine-image-pro`
    - Режими: текст-у-зображення та редагування за референсним зображенням
    - Референсні вхідні дані: одне `image` або до п’яти `images`
    - Співвідношення сторін: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Роздільності: `1K`, `2K`
    - Кількість: до 4 зображень

    OpenClaw запитує в xAI відповіді зображень у форматі `b64_json`, щоб згенеровані медіа можна було
    зберігати й доставляти через звичайний шлях вкладень каналу. Локальні
    референсні зображення перетворюються на data URLs; віддалені посилання `http(s)`
    передаються без змін.

    Щоб використовувати xAI як стандартного постачальника зображень:

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
    xAI також документує `quality`, `mask`, `user` і додаткові нативні співвідношення,
    такі як `1:2`, `2:1`, `9:20` і `20:9`. Наразі OpenClaw передає лише
    спільні міжпостачальницькі елементи керування зображеннями; непідтримувані параметри,
    притаманні лише нативному інтерфейсу, навмисно не експонуються через `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Текст-у-мовлення">
    Вбудований `xai` plugin реєструє текст-у-мовлення через спільну поверхню
    постачальника `tts`.

    - Голоси: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - Стандартний голос: `eve`
    - Формати: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Мова: код BCP-47 або `auto`
    - Швидкість: нативне перевизначення швидкості постачальника
    - Нативний формат голосових нотаток Opus не підтримується

    Щоб використовувати xAI як стандартного постачальника TTS:

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
    OpenClaw використовує пакетний endpoint xAI `/v1/tts`. xAI також пропонує потоковий TTS
    через WebSocket, але контракт постачальника мовлення OpenClaw наразі очікує
    повний аудіобуфер перед доставленням відповіді.
    </Note>

  </Accordion>

  <Accordion title="Мовлення-у-текст">
    Вбудований `xai` plugin реєструє пакетне мовлення-у-текст через поверхню
    транскрибування для розуміння медіа OpenClaw.

    - Стандартна модель: `grok-stt`
    - Endpoint: xAI REST `/v1/stt`
    - Шлях введення: завантаження аудіофайлу multipart
    - Підтримується OpenClaw усюди, де транскрибування вхідного аудіо використовує
      `tools.media.audio`, включно із сегментами голосових каналів Discord і
      аудіовкладеннями каналів

    Щоб примусово використовувати xAI для транскрибування вхідного аудіо:

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

    Мову можна надати через спільну конфігурацію аудіомедіа або через запит
    транскрибування для окремого виклику. Підказки prompt приймаються спільною поверхнею
    OpenClaw, але інтеграція xAI REST STT передає лише файл, модель і
    мову, оскільки вони чітко відповідають поточному публічному endpoint xAI.

  </Accordion>

  <Accordion title="Потокове мовлення-у-текст">
    Вбудований `xai` plugin також реєструє постачальника транскрибування в реальному часі
    для аудіо живих голосових викликів.

    - Endpoint: xAI WebSocket `wss://api.x.ai/v1/stt`
    - Стандартне кодування: `mulaw`
    - Стандартна частота дискретизації: `8000`
    - Стандартне визначення завершення: `800ms`
    - Проміжні транскрипти: увімкнено за замовчуванням

    Медіапотік Twilio у Voice Call надсилає аудіокадри G.711 µ-law, тому
    постачальник xAI може передавати ці кадри напряму без перекодування:

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

    Конфігурація, що належить постачальнику, розміщується в
    `plugins.entries.voice-call.config.streaming.providers.xai`. Підтримувані
    ключі: `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw` або
    `alaw`), `interimResults`, `endpointingMs` і `language`.

    <Note>
    Цей потоковий провайдер призначений для шляху транскрипції в реальному часі Voice Call.
    Голос Discord наразі записує короткі сегменти й натомість використовує пакетний
    шлях транскрипції `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Конфігурація x_search">
    Вбудований xAI Plugin надає `x_search` як інструмент OpenClaw для пошуку
    вмісту X (раніше Twitter) через Grok.

    Шлях конфігурації: `plugins.entries.xai.config.xSearch`

    | Ключ              | Тип     | Типове значення    | Опис                                 |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | —                  | Увімкнути або вимкнути x_search      |
    | `model`            | string  | `grok-4-1-fast`    | Модель, що використовується для запитів x_search |
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

  <Accordion title="Конфігурація виконання коду">
    Вбудований xAI Plugin надає `code_execution` як інструмент OpenClaw для
    віддаленого виконання коду в пісочниці xAI.

    Шлях конфігурації: `plugins.entries.xai.config.codeExecution`

    | Ключ              | Тип     | Типове значення           | Опис                              |
    | ----------------- | ------- | ------------------------- | --------------------------------- |
    | `enabled`         | boolean | `true` (якщо ключ доступний) | Увімкнути або вимкнути виконання коду |
    | `model`           | string  | `grok-4-1-fast`           | Модель, що використовується для запитів виконання коду |
    | `maxTurns`        | number  | —                         | Максимальна кількість ходів розмови |
    | `timeoutSeconds`  | number  | —                         | Тайм-аут запиту в секундах        |

    <Note>
    Це віддалене виконання в пісочниці xAI, а не локальний [`exec`](/uk/tools/exec).
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
    - Сьогодні автентифікація доступна лише за API-ключем. В OpenClaw ще немає
      потоку xAI OAuth або device-code.
    - `grok-4.20-multi-agent-experimental-beta-0304` не підтримується на
      звичайному шляху провайдера xAI, оскільки він потребує іншої поверхні
      upstream API, ніж стандартний транспорт xAI в OpenClaw.
    - Голос xAI Realtime ще не зареєстрований як провайдер OpenClaw. Для нього
      потрібен інший контракт двонапрямної голосової сесії, ніж для пакетного STT або
      потокової транскрипції.
    - `quality` зображення xAI, `mask` зображення та додаткові власні співвідношення сторін
      не надаються, доки спільний інструмент `image_generate` не матиме відповідних
      міжпровайдерних елементів керування.
  </Accordion>

  <Accordion title="Розширені примітки">
    - OpenClaw автоматично застосовує специфічні для xAI виправлення сумісності
      схем інструментів і викликів інструментів на спільному шляху runner.
    - Власні запити xAI типово використовують `tool_stream: true`. Установіть
      `agents.defaults.models["xai/<model>"].params.tool_stream` на `false`, щоб
      вимкнути це.
    - Вбудована обгортка xAI вилучає непідтримувані суворі прапорці схем інструментів і
      ключі payload reasoning перед надсиланням власних запитів xAI.
    - `web_search`, `x_search` і `code_execution` надаються як інструменти OpenClaw.
      OpenClaw вмикає конкретний вбудований інструмент xAI, потрібний у кожному запиті
      інструмента, замість прикріплення всіх власних інструментів до кожного ходу чату.
    - `x_search` і `code_execution` належать вбудованому xAI Plugin, а не жорстко
      закодовані в базовому runtime моделі.
    - `code_execution` — це віддалене виконання в пісочниці xAI, а не локальний
      [`exec`](/uk/tools/exec).
  </Accordion>
</AccordionGroup>

## Live testing

Медійні шляхи xAI покриті модульними тестами та opt-in live-наборами. Live
команди завантажують секрети з вашої login shell, зокрема `~/.profile`, перед
перевіркою `XAI_API_KEY`.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Специфічний для провайдера live-файл синтезує звичайний TTS, дружній до телефонії PCM
TTS, транскрибує аудіо через пакетний STT xAI, передає той самий PCM потоком через
xAI realtime STT, генерує результат text-to-image і редагує еталонне зображення. Спільний
live-файл зображень перевіряє той самий провайдер xAI через шлях вибору runtime,
fallback, нормалізації та медійних вкладень OpenClaw.

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри відеоінструмента та вибір провайдера.
  </Card>
  <Card title="Усі провайдери" href="/uk/providers/index" icon="grid-2">
    Ширший огляд провайдерів.
  </Card>
  <Card title="Усунення неполадок" href="/uk/help/troubleshooting" icon="wrench">
    Поширені проблеми та виправлення.
  </Card>
</CardGroup>
