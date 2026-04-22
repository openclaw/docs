---
read_when:
    - Ви хочете використовувати моделі Grok в OpenClaw
    - Ви налаштовуєте автентифікацію xAI або ідентифікатори моделей
summary: Використовуйте моделі xAI Grok в OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-04-22T23:11:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73e7cf36e43540661fc9519b22258ed7efb156eec8c3eb2f8ae5e62e80456b8a
    source_path: providers/xai.md
    workflow: 15
---

# xAI

OpenClaw постачається з вбудованим плагіном провайдера `xai` для моделей Grok.

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
      agents: { defaults: { model: { primary: "xai/grok-4" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw використовує xAI Responses API як вбудований транспорт xAI. Той самий
`XAI_API_KEY` також може використовуватися для Grok-орієнтованого `web_search`, першокласного `x_search`
і віддаленого `code_execution`.
Якщо ви зберігаєте ключ xAI у `plugins.entries.xai.config.webSearch.apiKey`,
вбудований провайдер моделей xAI також повторно використовує цей ключ як резервний варіант.
Налаштування `code_execution` розміщені в `plugins.entries.xai.config.codeExecution`.
</Note>

## Каталог вбудованих моделей

OpenClaw містить ці сімейства моделей xAI з коробки:

| Сімейство      | Ідентифікатори моделей                                                  |
| --------------- | ------------------------------------------------------------------------ |
| Grok 3          | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4          | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast     | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast   | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta  | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code       | `grok-code-fast-1`                                                       |

Плагін також напряму резолвить новіші ідентифікатори `grok-4*` і `grok-code-fast*`, коли
вони відповідають тій самій формі API.

<Tip>
`grok-4-fast`, `grok-4-1-fast` і варіанти `grok-4.20-beta-*` — це
поточні посилання Grok із підтримкою зображень у вбудованому каталозі.
</Tip>

## Покриття можливостей OpenClaw

Вбудований плагін зіставляє поточну публічну поверхню API xAI зі спільними
контрактами провайдерів та інструментів OpenClaw там, де така поведінка добре вписується.

| Можливість xAI              | Поверхня OpenClaw                      | Статус                                                              |
| --------------------------- | -------------------------------------- | ------------------------------------------------------------------- |
| Чат / Responses             | Провайдер моделей `xai/<model>`        | Так                                                                 |
| Пошук в інтернеті на боці сервера | Провайдер `web_search` `grok`    | Так                                                                 |
| Пошук у X на боці сервера   | Інструмент `x_search`                  | Так                                                                 |
| Виконання коду на боці сервера | Інструмент `code_execution`         | Так                                                                 |
| Зображення                  | `image_generate`                       | Так                                                                 |
| Відео                       | `video_generate`                       | Так                                                                 |
| Пакетне перетворення тексту на мовлення | `messages.tts.provider: "xai"` / `tts` | Так                                                  |
| Потокове TTS                | —                                      | Не доступно; контракт TTS в OpenClaw повертає завершені аудіобуфери |
| Перетворення мовлення на текст | —                                   | Ще не доступно; потрібна поверхня провайдера транскрибування        |
| Голос у реальному часі      | —                                      | Ще не доступно; інший контракт сесії/WebSocket                      |
| Файли / пакети              | Лише сумісність із Generic model API   | Не є першокласним інструментом OpenClaw                             |

<Note>
OpenClaw використовує REST API xAI для зображень/відео/TTS для генерації медіа та
Responses API для моделей, пошуку й інструментів виконання коду. Можливості, які потребують
нових контрактів OpenClaw, як-от потокове STT або голосові сесії Realtime,
задокументовані тут як можливості апстриму, а не як прихована поведінка плагіна.
</Note>

### Зіставлення fast mode

`/fast on` або `agents.defaults.models["xai/<model>"].params.fastMode: true`
перезаписує нативні запити xAI таким чином:

| Вихідна модель | Ціль fast mode     |
| -------------- | ------------------ |
| `grok-3`       | `grok-3-fast`      |
| `grok-3-mini`  | `grok-3-mini-fast` |
| `grok-4`       | `grok-4-fast`      |
| `grok-4-0709`  | `grok-4-fast`      |

### Застарілі аліаси сумісності

Застарілі аліаси все ще нормалізуються до канонічних вбудованих ідентифікаторів:

| Застарілий аліас          | Канонічний ідентифікатор              |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## Можливості

<AccordionGroup>
  <Accordion title="Пошук в інтернеті">
    Вбудований провайдер вебпошуку `grok` також використовує `XAI_API_KEY`:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Генерація відео">
    Вбудований плагін `xai` реєструє генерацію відео через спільний
    інструмент `video_generate`.

    - Стандартна модель відео: `xai/grok-imagine-video`
    - Режими: текст у відео, зображення у відео, віддалене редагування відео та віддалене
      розширення відео
    - Співвідношення сторін: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Роздільні здатності: `480P`, `720P`
    - Тривалість: 1-15 секунд для генерації/зображення-у-відео, 2-10 секунд для
      розширення

    <Warning>
    Локальні відеобуфери не приймаються. Використовуйте віддалені URL `http(s)` для
    вхідних даних редагування/розширення відео. Режим зображення-у-відео приймає локальні буфери зображень, оскільки
    OpenClaw може кодувати їх як data URL для xAI.
    </Warning>

    Щоб використовувати xAI як стандартний провайдер відео:

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
    Вбудований плагін `xai` реєструє генерацію зображень через спільний
    інструмент `image_generate`.

    - Стандартна модель зображень: `xai/grok-imagine-image`
    - Додаткова модель: `xai/grok-imagine-image-pro`
    - Режими: текст у зображення та редагування еталонного зображення
    - Еталонні вхідні дані: одне `image` або до п’яти `images`
    - Співвідношення сторін: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Роздільні здатності: `1K`, `2K`
    - Кількість: до 4 зображень

    OpenClaw запитує в xAI відповіді зображень у форматі `b64_json`, щоб згенеровані медіа можна було
    зберігати та доставляти через звичайний шлях вкладень каналу. Локальні
    еталонні зображення перетворюються на data URL; віддалені посилання `http(s)`
    передаються без змін.

    Щоб використовувати xAI як стандартний провайдер зображень:

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
    сторін, як-от `1:2`, `2:1`, `9:20` і `20:9`. Сьогодні OpenClaw передає лише
    спільні міжпровайдерні елементи керування зображеннями; непідтримувані суто нативні параметри
    навмисно не доступні через `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Перетворення тексту на мовлення">
    Вбудований плагін `xai` реєструє перетворення тексту на мовлення через спільну поверхню
    провайдера `tts`.

    - Голоси: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - Стандартний голос: `eve`
    - Формати: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Мова: код BCP-47 або `auto`
    - Швидкість: нативне перевизначення швидкості провайдера
    - Нативний формат голосових нотаток Opus не підтримується

    Щоб використовувати xAI як стандартний TTS-провайдер:

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
    завершений аудіобуфер перед доставкою відповіді.
    </Note>

  </Accordion>

  <Accordion title="Конфігурація x_search">
    Вбудований плагін xAI надає `x_search` як інструмент OpenClaw для пошуку
    вмісту X (раніше Twitter) через Grok.

    Шлях конфігурації: `plugins.entries.xai.config.xSearch`

    | Ключ               | Тип     | Стандартне значення | Опис                                 |
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

  <Accordion title="Конфігурація виконання коду">
    Вбудований плагін xAI надає `code_execution` як інструмент OpenClaw для
    віддаленого виконання коду в ізольованому середовищі xAI.

    Шлях конфігурації: `plugins.entries.xai.config.codeExecution`

    | Ключ              | Тип     | Стандартне значення       | Опис                                      |
    | ----------------- | ------- | ------------------------- | ----------------------------------------- |
    | `enabled`         | boolean | `true` (якщо ключ доступний) | Увімкнути або вимкнути виконання коду  |
    | `model`           | string  | `grok-4-1-fast`           | Модель для запитів виконання коду         |
    | `maxTurns`        | number  | —                         | Максимальна кількість ходів розмови       |
    | `timeoutSeconds`  | number  | —                         | Тайм-аут запиту в секундах                |

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
    - Автентифікація наразі підтримується лише через API-ключ. У
      OpenClaw поки що немає потоку xAI OAuth або device-code.
    - `grok-4.20-multi-agent-experimental-beta-0304` не підтримується на
      звичайному шляху провайдера xAI, оскільки для нього потрібна інша апстримна поверхня API,
      ніж стандартний транспорт xAI в OpenClaw.
    - xAI STT і голос Realtime ще не зареєстровані як провайдери OpenClaw.
      Для них потрібні контракти транскрибування/сесій, а не наявна форма
      пакетного TTS-провайдера.
    - `quality` для зображень xAI, `mask` для зображень і додаткові суто нативні співвідношення сторін
      не доступні, доки спільний інструмент `image_generate` не отримає
      відповідні міжпровайдерні елементи керування.
  </Accordion>

  <Accordion title="Додаткові примітки">
    - OpenClaw автоматично застосовує специфічні для xAI виправлення сумісності
      схеми інструментів і викликів інструментів на спільному шляху виконання.
    - Нативні запити xAI за замовчуванням використовують `tool_stream: true`. Установіть
      `agents.defaults.models["xai/<model>"].params.tool_stream` у `false`, щоб
      вимкнути це.
    - Вбудована обгортка xAI прибирає непідтримувані строгі прапорці схем інструментів і
      ключі payload reasoning перед надсиланням нативних запитів xAI.
    - `web_search`, `x_search` і `code_execution` доступні як інструменти OpenClaw.
      OpenClaw вмикає конкретний вбудований інструмент xAI, який потрібен, у межах кожного
      запиту інструмента замість додавання всіх нативних інструментів до кожного ходу чату.
    - `x_search` і `code_execution` належать вбудованому плагіну xAI, а не
      жорстко закодовані в основному runtime моделей.
    - `code_execution` — це віддалене виконання в пісочниці xAI, а не локальний
      [`exec`](/uk/tools/exec).
  </Accordion>
</AccordionGroup>

## Тестування в реальному середовищі

Шляхи xAI для медіа покриті unit-тестами та opt-in live-наборами. Live-команди
завантажують секрети з вашої оболонки входу, зокрема з `~/.profile`, перед
перевіркою `XAI_API_KEY`.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Специфічний для провайдера live-файл синтезує звичайний TTS, PCM-дружній до телефонії
TTS, генерацію тексту в зображення та редагування еталонного зображення. Спільний live-файл
для зображень перевіряє того самого провайдера xAI через вибір runtime OpenClaw,
резервне перемикання, нормалізацію та шлях вкладення медіа.

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки резервного перемикання.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Параметри спільного інструмента відео та вибір провайдера.
  </Card>
  <Card title="Усі провайдери" href="/uk/providers/index" icon="grid-2">
    Ширший огляд провайдерів.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Поширені проблеми та способи їх вирішення.
  </Card>
</CardGroup>
