---
read_when:
    - Ви хочете використовувати моделі Grok в OpenClaw
    - Ви налаштовуєте автентифікацію xAI або ідентифікатори моделей
summary: Використовуйте моделі xAI Grok в OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-05-06T04:01:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: f0e682ba31829faeeb992818aa6a36ab4d18b79723009c5f37559c28160af499
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw постачається з вбудованим provider plugin `xai` для моделей Grok.

## Початок роботи

<Steps>
  <Step title="Створіть API-ключ">
    Створіть API-ключ у [консолі xAI](https://console.x.ai/).
  </Step>
  <Step title="Установіть свій API-ключ">
    Установіть `XAI_API_KEY` або виконайте:

    ```bash
    openclaw onboard --auth-choice xai-api-key
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
OpenClaw використовує xAI Responses API як вбудований транспорт xAI. Той самий
`XAI_API_KEY` також може забезпечувати `web_search` на базі Grok, першокласний
`x_search` і віддалений `code_execution`.
Якщо ви збережете ключ xAI у `plugins.entries.xai.config.webSearch.apiKey`,
вбудований provider моделей xAI також повторно використовуватиме цей ключ як резервний.
Установіть `plugins.entries.xai.config.webSearch.baseUrl`, щоб спрямовувати Grok `web_search`
і, за замовчуванням, `x_search` через операторський проксі xAI Responses.
Налаштування `code_execution` містяться в `plugins.entries.xai.config.codeExecution`.
</Note>

## Вбудований каталог

OpenClaw одразу включає такі сімейства моделей xAI:

| Сімейство      | Ідентифікатори моделей                                                     |
| -------------- | -------------------------------------------------------------------------- |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`                 |
| Grok 4.3       | `grok-4.3`                                                                 |
| Grok 4         | `grok-4`, `grok-4-0709`                                                    |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                                 |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                             |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning`   |
| Grok Code      | `grok-code-fast-1`                                                         |

Plugin також напряму розпізнає новіші ідентифікатори `grok-4*` і `grok-code-fast*`, коли
вони мають таку саму форму API.

<Tip>
`grok-4.3`, `grok-4-fast`, `grok-4-1-fast` і варіанти `grok-4.20-beta-*`
є поточними посиланнями Grok із підтримкою зображень у вбудованому каталозі.
</Tip>

## Покриття функцій OpenClaw

Вбудований Plugin відображає поточну публічну поверхню API xAI на спільні
контракти provider і інструментів OpenClaw. Можливості, які не вписуються у спільний контракт
(наприклад, потокове TTS і голос у реальному часі), не надаються - див. таблицю
нижче.

| Можливість xAI             | Поверхня OpenClaw                         | Стан                                                                |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| Чат / Responses            | provider моделей `xai/<model>`            | Так                                                                 |
| Серверний вебпошук         | provider `web_search` `grok`              | Так                                                                 |
| Серверний пошук X          | інструмент `x_search`                     | Так                                                                 |
| Серверне виконання коду    | інструмент `code_execution`               | Так                                                                 |
| Зображення                 | `image_generate`                          | Так                                                                 |
| Відео                      | `video_generate`                          | Так                                                                 |
| Пакетне text-to-speech     | `messages.tts.provider: "xai"` / `tts`    | Так                                                                 |
| Потокове TTS               | -                                         | Не надається; контракт TTS OpenClaw повертає повні аудіобуфери      |
| Пакетне speech-to-text     | `tools.media.audio` / розуміння медіа     | Так                                                                 |
| Потокове speech-to-text    | Voice Call `streaming.provider: "xai"`    | Так                                                                 |
| Голос у реальному часі     | -                                         | Ще не надається; інший контракт сеансу/WebSocket                    |
| Файли / пакети             | Лише сумісність із generic model API      | Не першокласний інструмент OpenClaw                                 |

<Note>
OpenClaw використовує REST API xAI для зображень/відео/TTS/STT для генерації медіа,
мовлення та пакетної транскрипції, потоковий STT WebSocket xAI для живої
транскрипції голосових викликів і Responses API для моделей, пошуку та
інструментів виконання коду. Функції, яким потрібні інші контракти OpenClaw, як-от
сеанси голосу в реальному часі, задокументовані тут як upstream-можливості, а не
як прихована поведінка Plugin.
</Note>

### Зіставлення швидкого режиму

`/fast on` або `agents.defaults.models["xai/<model>"].params.fastMode: true`
переписує нативні запити xAI так:

| Початкова модель | Ціль швидкого режиму |
| ---------------- | -------------------- |
| `grok-3`         | `grok-3-fast`        |
| `grok-3-mini`    | `grok-3-mini-fast`   |
| `grok-4`         | `grok-4-fast`        |
| `grok-4-0709`    | `grok-4-fast`        |

### Застарілі псевдоніми сумісності

Застарілі псевдоніми досі нормалізуються до канонічних вбудованих ідентифікаторів:

| Застарілий псевдонім       | Канонічний ідентифікатор              |
| -------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning`    | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning`  | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`      | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning`  | `grok-4.20-beta-latest-non-reasoning` |

## Функції

<AccordionGroup>
  <Accordion title="Вебпошук">
    Вбудований provider вебпошуку `grok` також використовує `XAI_API_KEY`:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Генерація відео">
    Вбудований Plugin `xai` реєструє генерацію відео через спільний
    інструмент `video_generate`.

    - Модель відео за замовчуванням: `xai/grok-imagine-video`
    - Режими: text-to-video, image-to-video, генерація за reference-image, віддалене
      редагування відео та віддалене розширення відео
    - Співвідношення сторін: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Роздільні здатності: `480P`, `720P`
    - Тривалість: 1-15 секунд для генерації/image-to-video, 1-10 секунд під час
      використання ролей `reference_image`, 2-10 секунд для розширення
    - Генерація за reference-image: установіть `imageRoles` на `reference_image` для
      кожного наданого зображення; xAI приймає до 7 таких зображень

    <Warning>
    Локальні відеобуфери не приймаються. Використовуйте віддалені URL `http(s)` для
    вхідних даних редагування/розширення відео. Image-to-video приймає локальні буфери зображень, оскільки
    OpenClaw може кодувати їх як data URL для xAI.
    </Warning>

    Щоб використовувати xAI як provider відео за замовчуванням:

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
    вибору provider і поведінки failover.
    </Note>

  </Accordion>

  <Accordion title="Генерація зображень">
    Вбудований Plugin `xai` реєструє генерацію зображень через спільний
    інструмент `image_generate`.

    - Модель зображення за замовчуванням: `xai/grok-imagine-image`
    - Додаткова модель: `xai/grok-imagine-image-pro`
    - Режими: text-to-image і редагування reference-image
    - Вхідні reference-дані: одне `image` або до п’яти `images`
    - Співвідношення сторін: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Роздільні здатності: `1K`, `2K`
    - Кількість: до 4 зображень

    OpenClaw просить xAI повертати зображення у форматі `b64_json`, щоб згенеровані медіа можна було
    зберігати й доставляти через звичайний шлях вкладень каналу. Локальні
    reference-зображення перетворюються на data URL; віддалені посилання `http(s)`
    передаються без змін.

    Щоб використовувати xAI як provider зображень за замовчуванням:

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
    як-от `1:2`, `2:1`, `9:20` і `20:9`. OpenClaw наразі передає лише
    спільні крос-provider елементи керування зображеннями; непідтримувані нативні параметри
    навмисно не надаються через `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Text-to-speech">
    Вбудований Plugin `xai` реєструє text-to-speech через спільну поверхню
    provider `tts`.

    - Голоси: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - Голос за замовчуванням: `eve`
    - Формати: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Мова: код BCP-47 або `auto`
    - Швидкість: provider-native перевизначення швидкості
    - Нативний формат голосових нотаток Opus не підтримується

    Щоб використовувати xAI як provider TTS за замовчуванням:

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
    OpenClaw використовує пакетний endpoint `/v1/tts` xAI. xAI також пропонує потокове TTS
    через WebSocket, але контракт provider мовлення OpenClaw наразі очікує
    повний аудіобуфер перед доставкою відповіді.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Вбудований Plugin `xai` реєструє пакетне speech-to-text через поверхню
    транскрипції розуміння медіа OpenClaw.

    - Модель за замовчуванням: `grok-stt`
    - Endpoint: xAI REST `/v1/stt`
    - Шлях введення: завантаження аудіофайлу multipart
    - Підтримується OpenClaw всюди, де транскрипція вхідного аудіо використовує
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

    Мову можна надати через спільну конфігурацію аудіомедіа або запит транскрипції
    для окремого виклику. Prompt-підказки приймаються спільною поверхнею OpenClaw,
    але інтеграція xAI REST STT передає лише файл, модель і
    мову, оскільки вони чітко відповідають поточному публічному endpoint xAI.

  </Accordion>

  <Accordion title="Потокове speech-to-text">
    Вбудований Plugin `xai` також реєструє provider транскрипції в реальному часі
    для живого аудіо голосових викликів.

    - Endpoint: xAI WebSocket `wss://api.x.ai/v1/stt`
    - Кодування за замовчуванням: `mulaw`
    - Частота дискретизації за замовчуванням: `8000`
    - Endpointing за замовчуванням: `800ms`
    - Проміжні транскрипти: увімкнено за замовчуванням

    Медіапотік Twilio у Voice Call надсилає аудіокадри G.711 µ-law, тому
    provider xAI може передавати ці кадри напряму без транскодування:

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

    Конфігурація, якою володіє провайдер, розташована в
    `plugins.entries.voice-call.config.streaming.providers.xai`. Підтримувані
    ключі: `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw` або
    `alaw`), `interimResults`, `endpointingMs` і `language`.

    <Note>
    Цей потоковий провайдер призначений для шляху транскрипції в реальному часі у Voice Call.
    Голос Discord зараз записує короткі сегменти й натомість використовує пакетний
    шлях транскрипції `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="x_search configuration">
    Вбудований plugin xAI надає `x_search` як інструмент OpenClaw для пошуку
    контенту X (раніше Twitter) через Grok.

    Шлях конфігурації: `plugins.entries.xai.config.xSearch`

    | Ключ               | Тип     | Типово             | Опис                                 |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | -                  | Увімкнути або вимкнути x_search      |
    | `model`            | string  | `grok-4-1-fast`    | Модель, що використовується для запитів x_search |
    | `baseUrl`          | string  | -                  | Перевизначення базової URL-адреси xAI Responses |
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

  <Accordion title="Code execution configuration">
    Вбудований plugin xAI надає `code_execution` як інструмент OpenClaw для
    віддаленого виконання коду в sandbox-середовищі xAI.

    Шлях конфігурації: `plugins.entries.xai.config.codeExecution`

    | Ключ              | Тип     | Типово             | Опис                                   |
    | ----------------- | ------- | ------------------ | -------------------------------------- |
    | `enabled`         | boolean | `true` (якщо ключ доступний) | Увімкнути або вимкнути виконання коду |
    | `model`           | string  | `grok-4-1-fast`    | Модель, що використовується для запитів виконання коду |
    | `maxTurns`        | number  | -                  | Максимальна кількість ходів розмови    |
    | `timeoutSeconds`  | number  | -                  | Тайм-аут запиту в секундах             |

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

  <Accordion title="Known limits">
    - Автентифікація сьогодні працює лише через API-ключ. В OpenClaw поки немає OAuth xAI або потоку з кодом пристрою.
    - `grok-4.20-multi-agent-experimental-beta-0304` не підтримується у звичайному шляху провайдера xAI, бо потребує іншої поверхні upstream API, ніж стандартний транспорт xAI в OpenClaw.
    - Голос xAI Realtime ще не зареєстрований як провайдер OpenClaw. Йому потрібен інший двоспрямований контракт голосової сесії, ніж пакетний STT або потокова транскрипція.
    - `quality` зображення xAI, `mask` зображення та додаткові нативні співвідношення сторін не надаються, доки спільний інструмент `image_generate` не матиме відповідних кроспровайдерних елементів керування.

  </Accordion>

  <Accordion title="Advanced notes">
    - OpenClaw автоматично застосовує специфічні для xAI виправлення сумісності схем інструментів і викликів інструментів у спільному шляху runner.
    - Нативні запити xAI типово використовують `tool_stream: true`. Установіть
      `agents.defaults.models["xai/<model>"].params.tool_stream` у `false`, щоб
      вимкнути це.
    - Вбудована обгортка xAI видаляє непідтримувані суворі прапорці схем інструментів і ключі payload reasoning перед надсиланням нативних запитів xAI.
    - `web_search`, `x_search` і `code_execution` надаються як інструменти OpenClaw. OpenClaw вмикає конкретний вбудований засіб xAI, який потрібен у кожному запиті інструмента, замість приєднання всіх нативних інструментів до кожного ходу чату.
    - Grok `web_search` читає `plugins.entries.xai.config.webSearch.baseUrl`.
      `x_search` читає `plugins.entries.xai.config.xSearch.baseUrl`, а потім
      повертається до базової URL-адреси вебпошуку Grok.
    - `x_search` і `code_execution` належать вбудованому plugin xAI, а не жорстко закодовані в основному runtime моделей.
    - `code_execution` — це віддалене виконання в sandbox xAI, а не локальний
      [`exec`](/uk/tools/exec).
  </Accordion>
</AccordionGroup>

## Живе тестування

Медійні шляхи xAI покриті модульними тестами та опційними живими наборами. Живі
команди завантажують секрети з вашої login shell, зокрема `~/.profile`, перед
перевіркою `XAI_API_KEY`.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Специфічний для провайдера живий файл синтезує звичайний TTS, придатний для телефонії PCM
TTS, транскрибує аудіо через пакетний STT xAI, передає той самий PCM через STT
реального часу xAI, генерує результат text-to-image і редагує референсне зображення. Спільний
живий файл зображень перевіряє того самого провайдера xAI через шлях вибору
runtime OpenClaw, fallback, нормалізації та медійних вкладень.

## Пов’язане

<CardGroup cols={2}>
  <Card title="Model selection" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Video generation" href="/uk/tools/video-generation" icon="video">
    Спільні параметри відеоінструмента та вибір провайдера.
  </Card>
  <Card title="All providers" href="/uk/providers/index" icon="grid-2">
    Ширший огляд провайдерів.
  </Card>
  <Card title="Troubleshooting" href="/uk/help/troubleshooting" icon="wrench">
    Поширені проблеми та виправлення.
  </Card>
</CardGroup>
