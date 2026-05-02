---
read_when:
    - Ви хочете використовувати моделі Grok в OpenClaw
    - Ви налаштовуєте автентифікацію xAI або ідентифікатори моделей
summary: Використовуйте моделі xAI Grok в OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-05-02T02:49:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f36b597fd5c47b61724080deb0d545bca024aca17744fc8aa6a0eb4872d12d2
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw постачається з вбудованим Plugin провайдера `xai` для моделей Grok.

## Початок роботи

<Steps>
  <Step title="Створіть API-ключ">
    Створіть API-ключ у [консолі xAI](https://console.x.ai/).
  </Step>
  <Step title="Налаштуйте свій API-ключ">
    Налаштуйте `XAI_API_KEY` або виконайте:

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
`XAI_API_KEY` також може забезпечувати `web_search` на базі Grok, повноцінний `x_search`
і віддалене `code_execution`.
Якщо ви зберігаєте ключ xAI у `plugins.entries.xai.config.webSearch.apiKey`,
вбудований провайдер моделей xAI також використовує цей ключ як резервний.
Налаштуйте `plugins.entries.xai.config.webSearch.baseUrl`, щоб спрямовувати Grok `web_search`
і, за замовчуванням, `x_search` через операторський проксі xAI Responses.
Налаштування `code_execution` розміщені в `plugins.entries.xai.config.codeExecution`.
</Note>

## Вбудований каталог

OpenClaw одразу включає такі сімейства моделей xAI:

| Сімейство      | Ідентифікатори моделей                                                   |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4.3       | `grok-4.3`                                                               |
| Grok 4         | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code      | `grok-code-fast-1`                                                       |

Plugin також напряму розпізнає новіші ідентифікатори `grok-4*` і `grok-code-fast*`, коли
вони використовують ту саму форму API.

<Tip>
`grok-4.3`, `grok-4-fast`, `grok-4-1-fast` і варіанти `grok-4.20-beta-*`
є поточними посиланнями Grok із підтримкою зображень у вбудованому каталозі.
</Tip>

## Покриття функцій OpenClaw

Вбудований Plugin відображає поточну публічну поверхню API xAI на спільні
контракти провайдера й інструментів OpenClaw. Можливості, які не вкладаються у спільний контракт
(наприклад, потоковий TTS і голос у реальному часі), не експонуються — див. таблицю
нижче.

| Можливість xAI             | Поверхня OpenClaw                         | Статус                                                              |
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
| Голос у реальному часі     | —                                         | Поки не експонується; інший контракт сесії/WebSocket                |
| Файли / пакети             | Лише сумісність із загальним API моделей  | Не є повноцінним інструментом OpenClaw                              |

<Note>
OpenClaw використовує REST API xAI для зображень/відео/TTS/STT для генерації медіа,
мовлення й пакетної транскрипції, потоковий STT WebSocket xAI для живої
транскрипції голосових викликів і Responses API для інструментів моделей, пошуку та
виконання коду. Функції, яким потрібні інші контракти OpenClaw, як-от
голосові сесії в реальному часі, задокументовані тут як можливості upstream,
а не як прихована поведінка Plugin.
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

Застарілі псевдоніми й далі нормалізуються до канонічних вбудованих ідентифікаторів:

| Застарілий псевдонім       | Канонічний ідентифікатор            |
| -------------------------- | ----------------------------------- |
| `grok-4-fast-reasoning`    | `grok-4-fast`                       |
| `grok-4-1-fast-reasoning`  | `grok-4-1-fast`                     |
| `grok-4.20-reasoning`      | `grok-4.20-beta-latest-reasoning`   |
| `grok-4.20-non-reasoning`  | `grok-4.20-beta-latest-non-reasoning` |

## Функції

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

    - Модель відео за замовчуванням: `xai/grok-imagine-video`
    - Режими: text-to-video, image-to-video, генерація за еталонним зображенням, віддалене
      редагування відео та віддалене продовження відео
    - Співвідношення сторін: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Роздільності: `480P`, `720P`
    - Тривалість: 1-15 секунд для генерації/image-to-video, 1-10 секунд під час
      використання ролей `reference_image`, 2-10 секунд для продовження
    - Генерація за еталонним зображенням: встановіть `imageRoles` на `reference_image` для
      кожного наданого зображення; xAI приймає до 7 таких зображень

    <Warning>
    Локальні відеобуфери не приймаються. Використовуйте віддалені URL `http(s)` для
    вхідних даних редагування/продовження відео. Image-to-video приймає локальні буфери зображень, тому що
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
    - Додаткова модель: `xai/grok-imagine-image-pro`
    - Режими: text-to-image і редагування за еталонним зображенням
    - Еталонні вхідні дані: одне `image` або до п’яти `images`
    - Співвідношення сторін: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Роздільності: `1K`, `2K`
    - Кількість: до 4 зображень

    OpenClaw запитує в xAI відповіді зображень `b64_json`, щоб згенеровані медіа можна було
    зберігати й доставляти через звичайний шлях вкладень каналу. Локальні
    еталонні зображення перетворюються на data URL; віддалені посилання `http(s)`
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
    xAI також документує `quality`, `mask`, `user` і додаткові нативні співвідношення,
    як-от `1:2`, `2:1`, `9:20` і `20:9`. Сьогодні OpenClaw пересилає лише
    спільні міжпровайдерні елементи керування зображеннями; непідтримувані суто нативні параметри
    навмисно не експонуються через `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Text-to-speech">
    Вбудований Plugin `xai` реєструє text-to-speech через спільну поверхню провайдера `tts`.

    - Голоси: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - Голос за замовчуванням: `eve`
    - Формати: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Мова: код BCP-47 або `auto`
    - Швидкість: нативне для провайдера перевизначення швидкості
    - Нативний формат голосових нотаток Opus не підтримується

    Щоб використовувати xAI як провайдера TTS за замовчуванням:

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
    OpenClaw використовує пакетний endpoint `/v1/tts` xAI. xAI також пропонує потоковий TTS
    через WebSocket, але контракт провайдера мовлення OpenClaw наразі очікує
    повний аудіобуфер перед доставкою відповіді.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Вбудований Plugin `xai` реєструє пакетний speech-to-text через поверхню
    транскрипції розуміння медіа OpenClaw.

    - Модель за замовчуванням: `grok-stt`
    - Endpoint: xAI REST `/v1/stt`
    - Шлях вхідних даних: завантаження аудіофайлу multipart
    - Підтримується OpenClaw усюди, де транскрипція вхідного аудіо використовує
      `tools.media.audio`, включно із сегментами голосових каналів Discord і
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

    Мову можна надати через спільну конфігурацію аудіомедіа або через запит
    транскрипції для конкретного виклику. Підказки prompt приймаються спільною поверхнею
    OpenClaw, але інтеграція xAI REST STT пересилає лише файл, модель і
    мову, бо саме вони чітко відповідають поточному публічному endpoint xAI.

  </Accordion>

  <Accordion title="Потоковий speech-to-text">
    Вбудований Plugin `xai` також реєструє провайдера транскрипції в реальному часі
    для живого аудіо голосових викликів.

    - Endpoint: xAI WebSocket `wss://api.x.ai/v1/stt`
    - Кодування за замовчуванням: `mulaw`
    - Частота дискретизації за замовчуванням: `8000`
    - Endpointing за замовчуванням: `800ms`
    - Проміжні транскрипти: увімкнено за замовчуванням

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

    Конфігурація, що належить провайдеру, міститься в
    `plugins.entries.voice-call.config.streaming.providers.xai`. Підтримувані
    ключі: `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw` або
    `alaw`), `interimResults`, `endpointingMs` і `language`.

    <Note>
    Цей потоковий провайдер призначений для шляху транскрипції в реальному часі
    Voice Call. Голос Discord наразі записує короткі сегменти й натомість
    використовує пакетний шлях транскрипції `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Конфігурація x_search">
    Вбудований Plugin xAI надає `x_search` як інструмент OpenClaw для пошуку
    вмісту X (раніше Twitter) через Grok.

    Шлях конфігурації: `plugins.entries.xai.config.xSearch`

    | Ключ               | Тип     | Типове значення    | Опис                                 |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | —                  | Увімкнути або вимкнути x_search      |
    | `model`            | string  | `grok-4-1-fast`    | Модель, що використовується для запитів x_search |
    | `baseUrl`          | string  | —                  | Перевизначення базової URL-адреси xAI Responses |
    | `inlineCitations`  | boolean | —                  | Додавати в результати вбудовані цитування |
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
    віддаленого виконання коду в sandbox-середовищі xAI.

    Шлях конфігурації: `plugins.entries.xai.config.codeExecution`

    | Ключ              | Тип     | Типове значення           | Опис                                  |
    | ----------------- | ------- | ------------------------- | ------------------------------------- |
    | `enabled`         | boolean | `true` (якщо ключ доступний) | Увімкнути або вимкнути виконання коду |
    | `model`           | string  | `grok-4-1-fast`           | Модель, що використовується для запитів виконання коду |
    | `maxTurns`        | number  | —                         | Максимальна кількість ходів розмови   |
    | `timeoutSeconds`  | number  | —                         | Тайм-аут запиту в секундах            |

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
    - Сьогодні автентифікація працює лише через API-ключ. В OpenClaw поки немає
      xAI OAuth або потоку з кодом пристрою.
    - `grok-4.20-multi-agent-experimental-beta-0304` не підтримується у
      звичайному шляху провайдера xAI, бо потребує іншої поверхні вищого API,
      ніж стандартний транспорт OpenClaw для xAI.
    - Голос xAI Realtime ще не зареєстровано як провайдер OpenClaw. Для нього
      потрібен інший контракт двоспрямованого голосового сеансу, ніж для
      пакетного STT або потокової транскрипції.
    - `quality` зображення xAI, `mask` зображення та додаткові власні лише для
      xAI співвідношення сторін не відкриті, доки спільний інструмент
      `image_generate` не матиме відповідних міжпровайдерних елементів керування.
  </Accordion>

  <Accordion title="Розширені примітки">
    - OpenClaw автоматично застосовує виправлення сумісності схем інструментів і
      викликів інструментів, специфічні для xAI, у спільному шляху runner.
    - Власні запити xAI за замовчуванням використовують `tool_stream: true`.
      Установіть `agents.defaults.models["xai/<model>"].params.tool_stream` у
      `false`, щоб вимкнути це.
    - Вбудована обгортка xAI прибирає непідтримувані суворі прапорці схем
      інструментів і ключі payload міркування перед надсиланням власних запитів xAI.
    - `web_search`, `x_search` і `code_execution` надаються як інструменти
      OpenClaw. OpenClaw вмикає потрібний конкретний вбудований інструмент xAI
      всередині кожного запиту інструмента, а не приєднує всі власні інструменти
      до кожного ходу чату.
    - Grok `web_search` читає `plugins.entries.xai.config.webSearch.baseUrl`.
      `x_search` читає `plugins.entries.xai.config.xSearch.baseUrl`, а потім
      повертається до базової URL-адреси вебпошуку Grok.
    - `x_search` і `code_execution` належать вбудованому Plugin xAI, а не
      жорстко закодовані в основний runtime моделей.
    - `code_execution` — це віддалене виконання в sandbox xAI, а не локальний
      [`exec`](/uk/tools/exec).
  </Accordion>
</AccordionGroup>

## Live testing

Шляхи медіа xAI покриті модульними тестами та live-наборами, що вмикаються
явно. Live-команди завантажують секрети з вашої login shell, зокрема з
`~/.profile`, перед перевіркою `XAI_API_KEY`.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Live-файл, специфічний для провайдера, синтезує звичайний TTS, телефонно-зручний
PCM TTS, транскрибує аудіо через пакетний STT xAI, потоково передає той самий
PCM через realtime STT xAI, генерує text-to-image результат і редагує еталонне
зображення. Спільний live-файл зображень перевіряє того самого провайдера xAI
через шлях вибору runtime, fallback, нормалізації та медіавкладення OpenClaw.

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
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Поширені проблеми та виправлення.
  </Card>
</CardGroup>
