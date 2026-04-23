---
read_when:
    - Ви хочете використовувати моделі Grok в OpenClaw
    - Ви налаштовуєте auth xAI або id моделей
summary: Використовуйте моделі xAI Grok в OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-04-23T21:08:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: e7149e017b7a5dd95b08c3f3348c5cbbe057b59a5f6bd6cc1f36473d4e47bf87
    source_path: providers/xai.md
    workflow: 15
---

OpenClaw постачається з вбудованим Plugin provider-а `xai` для моделей Grok.

## Початок роботи

<Steps>
  <Step title="Створіть ключ API">
    Створіть ключ API в [консолі xAI](https://console.x.ai/).
  </Step>
  <Step title="Задайте ключ API">
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
`XAI_API_KEY` також може живити `web_search` на базі Grok, first-class `x_search`
і віддалений `code_execution`.
Якщо ви зберігаєте ключ xAI в `plugins.entries.xai.config.webSearch.apiKey`,
вбудований provider моделей xAI також повторно використовує цей ключ як fallback.
Налаштування `code_execution` знаходяться в `plugins.entries.xai.config.codeExecution`.
</Note>

## Вбудований каталог моделей

OpenClaw містить такі сімейства моделей xAI з коробки:

| Сімейство      | ID моделей                                                               |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4         | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code      | `grok-code-fast-1`                                                       |

Plugin також переспрямовує новіші id `grok-4*` і `grok-code-fast*`, коли
вони мають ту саму форму API.

<Tip>
`grok-4-fast`, `grok-4-1-fast` і варіанти `grok-4.20-beta-*` — це
поточні refs Grok із підтримкою зображень у вбудованому каталозі.
</Tip>

## Покриття можливостей OpenClaw

Вбудований Plugin відображає поточну публічну поверхню API xAI на спільні
контракти provider-а й tool в OpenClaw там, де поведінка чисто вкладається в них.

| Можливість xAI             | Поверхня OpenClaw                         | Статус                                                               |
| -------------------------- | ----------------------------------------- | -------------------------------------------------------------------- |
| Chat / Responses           | provider моделей `xai/<model>`            | Так                                                                  |
| Server-side web search     | provider `web_search` `grok`              | Так                                                                  |
| Server-side X search       | tool `x_search`                           | Так                                                                  |
| Server-side code execution | tool `code_execution`                     | Так                                                                  |
| Зображення                 | `image_generate`                          | Так                                                                  |
| Відео                      | `video_generate`                          | Так                                                                  |
| Batch text-to-speech       | `messages.tts.provider: "xai"` / `tts`    | Так                                                                  |
| Streaming TTS              | —                                         | Не відкрито; контракт TTS OpenClaw повертає повні audio buffers      |
| Batch speech-to-text       | `tools.media.audio` / media understanding | Так                                                                  |
| Streaming speech-to-text   | Voice Call `streaming.provider: "xai"`    | Так                                                                  |
| Realtime voice             | —                                         | Ще не відкрито; інший контракт session/WebSocket                     |
| Files / batches            | Лише сумісність із generic model API      | Не first-class tool OpenClaw                                         |

<Note>
OpenClaw використовує REST API xAI для image/video/TTS/STT для генерування медіа,
мовлення та пакетного транскрибування, streaming STT WebSocket xAI для live-
транскрибування у voice-call і Responses API для моделей, пошуку та
інструментів виконання коду. Можливості, які потребують інших контрактів OpenClaw, як-от
сеанси Realtime voice, документуються тут як upstream-можливості, а не як
прихована поведінка Plugin.
</Note>

### Зіставлення fast-mode

`/fast on` або `agents.defaults.models["xai/<model>"].params.fastMode: true`
перезаписує native-запити xAI так:

| Вихідна модель | Ціль fast-mode     |
| -------------- | ------------------ |
| `grok-3`       | `grok-3-fast`      |
| `grok-3-mini`  | `grok-3-mini-fast` |
| `grok-4`       | `grok-4-fast`      |
| `grok-4-0709`  | `grok-4-fast`      |

### Legacy compatibility alias-и

Legacy alias-и все ще нормалізуються до канонічних вбудованих id:

| Legacy alias              | Канонічний id                        |
| ------------------------- | ------------------------------------ |
| `grok-4-fast-reasoning`   | `grok-4-fast`                        |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                      |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`    |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## Можливості

<AccordionGroup>
  <Accordion title="Web search">
    Вбудований provider web-search `grok` також використовує `XAI_API_KEY`:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Генерування відео">
    Вбудований Plugin `xai` реєструє генерування відео через спільний
    tool `video_generate`.

    - Типова модель відео: `xai/grok-imagine-video`
    - Режими: text-to-video, image-to-video, віддалене редагування відео та віддалене розширення відео
    - Співвідношення сторін: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Роздільні здатності: `480P`, `720P`
    - Тривалість: 1-15 секунд для generation/image-to-video, 2-10 секунд для
      extension

    <Warning>
    Локальні video buffers не приймаються. Для
    входів редагування/розширення відео використовуйте віддалені URL `http(s)`.
    Image-to-video приймає локальні image buffers, оскільки
    OpenClaw може кодувати їх як data URL для xAI.
    </Warning>

    Щоб використовувати xAI як типового provider-а відео:

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
    Див. [Video Generation](/uk/tools/video-generation) щодо спільних параметрів tool,
    вибору provider-а та поведінки failover.
    </Note>

  </Accordion>

  <Accordion title="Генерування зображень">
    Вбудований Plugin `xai` реєструє генерування зображень через спільний
    tool `image_generate`.

    - Типова модель зображень: `xai/grok-imagine-image`
    - Додаткова модель: `xai/grok-imagine-image-pro`
    - Режими: text-to-image і редагування з reference image
    - Reference inputs: один `image` або до п’яти `images`
    - Співвідношення сторін: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Роздільні здатності: `1K`, `2K`
    - Кількість: до 4 зображень

    OpenClaw запитує в xAI відповіді зображень у форматі `b64_json`, щоб згенеровані медіа можна було
    зберігати й доставляти через звичайний шлях вкладень каналу. Локальні
    reference images перетворюються на data URL; віддалені references `http(s)`
    передаються як є.

    Щоб використовувати xAI як типового provider-а зображень:

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
    xAI також документує `quality`, `mask`, `user` і додаткові native ratios,
    такі як `1:2`, `2:1`, `9:20` і `20:9`. Сьогодні OpenClaw пересилає лише
    спільні міжprovider-ні елементи керування зображеннями; непідтримувані суто native knobs
    навмисно не відкриваються через `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Text-to-speech">
    Вбудований Plugin `xai` реєструє text-to-speech через спільну
    поверхню provider-а `tts`.

    - Голоси: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - Типовий голос: `eve`
    - Формати: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Мова: код BCP-47 або `auto`
    - Швидкість: native-перевизначення швидкості provider-а
    - Native-формат voice note Opus не підтримується

    Щоб використовувати xAI як типового provider-а TTS:

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
    OpenClaw використовує пакетний endpoint `/v1/tts` від xAI. xAI також пропонує streaming TTS
    через WebSocket, але поточний контракт provider-а мовлення в OpenClaw очікує
    повний audio buffer до доставки відповіді.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Вбудований Plugin `xai` реєструє пакетний speech-to-text через
    поверхню транскрибування media-understanding OpenClaw.

    - Типова модель: `grok-stt`
    - Endpoint: REST `xAI /v1/stt`
    - Шлях введення: multipart-вивантаження audio file
    - Підтримується в OpenClaw скрізь, де транскрибування вхідного аудіо використовує
      `tools.media.audio`, включно з сегментами voice channel у Discord і
      audio attachments у каналах

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

    Мову можна передавати через спільну конфігурацію audio media або в запиті
    на транскрибування для окремого виклику. Підказки prompt приймаються через спільну
    поверхню OpenClaw, але REST-інтеграція xAI STT пересилає лише file, model і
    language, оскільки саме вони чисто відповідають поточному публічному endpoint xAI.

  </Accordion>

  <Accordion title="Streaming speech-to-text">
    Вбудований Plugin `xai` також реєструє provider-а realtime-транскрибування
    для live-аудіо voice call.

    - Endpoint: WebSocket xAI `wss://api.x.ai/v1/stt`
    - Типове кодування: `mulaw`
    - Типова частота дискретизації: `8000`
    - Типовий endpointing: `800ms`
    - Проміжні transcripts: типово ввімкнені

    Оскільки потік медіа Twilio у Voice Call надсилає аудіофрейми G.711 µ-law,
    provider xAI може пересилати ці фрейми напряму без транскодування:

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

    Конфігурація, якою володіє provider, знаходиться в
    `plugins.entries.voice-call.config.streaming.providers.xai`. Підтримувані
    ключі: `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw` або
    `alaw`), `interimResults`, `endpointingMs` і `language`.

    <Note>
    Цей streaming provider призначений для шляху realtime-транскрибування Voice Call.
    Discord voice наразі записує короткі сегменти й натомість використовує пакетний
    шлях транскрибування `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Конфігурація x_search">
    Вбудований Plugin xAI відкриває `x_search` як tool OpenClaw для пошуку
    контенту в X (колишній Twitter) через Grok.

    Шлях конфігурації: `plugins.entries.xai.config.xSearch`

    | Ключ               | Тип     | Типове значення      | Опис                                  |
    | ------------------ | ------- | -------------------- | ------------------------------------- |
    | `enabled`          | boolean | —                    | Увімкнути або вимкнути `x_search`     |
    | `model`            | string  | `grok-4-1-fast`      | Модель, що використовується для запитів `x_search` |
    | `inlineCitations`  | boolean | —                    | Додавати вбудовані цитати в результати |
    | `maxTurns`         | number  | —                    | Максимальна кількість ходів розмови   |
    | `timeoutSeconds`   | number  | —                    | Timeout запиту в секундах             |
    | `cacheTtlMinutes`  | number  | —                    | Час життя кешу в хвилинах             |

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

  <Accordion title="Конфігурація code execution">
    Вбудований Plugin xAI відкриває `code_execution` як tool OpenClaw для
    віддаленого виконання коду в sandbox-середовищі xAI.

    Шлях конфігурації: `plugins.entries.xai.config.codeExecution`

    | Ключ              | Тип     | Типове значення            | Опис                                         |
    | ----------------- | ------- | -------------------------- | -------------------------------------------- |
    | `enabled`         | boolean | `true` (якщо ключ доступний) | Увімкнути або вимкнути code execution     |
    | `model`           | string  | `grok-4-1-fast`            | Модель, що використовується для запитів code execution |
    | `maxTurns`        | number  | —                          | Максимальна кількість ходів розмови          |
    | `timeoutSeconds`  | number  | —                          | Timeout запиту в секундах                    |

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
    - Наразі auth працює лише через API key. У OpenClaw ще немає xAI OAuth або device-code flow.
    - `grok-4.20-multi-agent-experimental-beta-0304` не підтримується на
      звичайному шляху provider-а xAI, оскільки він вимагає іншої upstream API
      surface, ніж стандартний транспорт xAI в OpenClaw.
    - xAI Realtime voice ще не зареєстровано як provider OpenClaw. Для цього
      потрібен інший двонапрямний контракт voice session, ніж у batch STT або
      streaming-transcription.
    - `quality` зображень xAI, `mask` зображень і додаткові native-only aspect ratios
      не відкриваються, доки спільний tool `image_generate` не отримає відповідні
      міжprovider-ні елементи керування.
  </Accordion>

  <Accordion title="Розширені примітки">
    - OpenClaw автоматично застосовує виправлення сумісності, специфічні для xAI, щодо tool-schema і tool-call
      на спільному шляху runner.
    - Native-запити xAI типово використовують `tool_stream: true`. Установіть
      `agents.defaults.models["xai/<model>"].params.tool_stream` у `false`, щоб
      вимкнути це.
    - Вбудована обгортка xAI видаляє непідтримувані strict-прапорці tool-schema і
      ключі payload reasoning перед надсиланням native-запитів xAI.
    - `web_search`, `x_search` і `code_execution` відкриваються як tools OpenClaw.
      OpenClaw вмикає конкретний вбудований механізм xAI, який потрібен, усередині кожного
      запиту tool замість того, щоб додавати всі native tools до кожного ходу чату.
    - `x_search` і `code_execution` належать вбудованому Plugin xAI, а не
      зашиті в core model runtime.
    - `code_execution` — це віддалене виконання в sandbox xAI, а не локальний
      [`exec`](/uk/tools/exec).
  </Accordion>
</AccordionGroup>

## Live-тестування

Шляхи медіа xAI покриваються unit-тестами та live-наборами з явним увімкненням. Live-
команди завантажують secrets з вашого login shell, включно з `~/.profile`, перед
перевіркою `XAI_API_KEY`.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Live-файл, специфічний для provider-а, синтезує звичайний TTS, telephony-friendly PCM
TTS, транскрибує аудіо через пакетний STT xAI, передає той самий PCM через realtime
STT xAI, генерує вихід text-to-image і редагує reference image. Спільний
image live-файл перевіряє той самий provider xAI через
вибір runtime OpenClaw, fallback, нормалізацію та шлях media attachment.

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір provider-ів, refs моделей і поведінки failover.
  </Card>
  <Card title="Генерування відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри video tool і вибір provider-а.
  </Card>
  <Card title="Усі providers" href="/uk/providers/index" icon="grid-2">
    Ширший огляд provider-ів.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Поширені проблеми та способи їх виправлення.
  </Card>
</CardGroup>
