---
read_when:
    - Ви хочете використовувати моделі Grok в OpenClaw
    - Ви налаштовуєте автентифікацію xAI або ідентифікатори моделей
summary: Використовуйте моделі xAI Grok в OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-04-23T00:07:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: fbf4a0eba237a1dfb0d93f2135cd98bae8c3cf21f9cfa1a36bddbbbfca1c4963
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
`XAI_API_KEY` також може забезпечувати Grok-підтримувані `web_search`, нативний `x_search`
і віддалене `code_execution`.
Якщо ви зберігаєте ключ xAI у `plugins.entries.xai.config.webSearch.apiKey`,
вбудований провайдер моделей xAI також повторно використовує цей ключ як резервний варіант.
Налаштування `code_execution` розміщено в `plugins.entries.xai.config.codeExecution`.
</Note>

## Каталог вбудованих моделей

OpenClaw включає такі сімейства моделей xAI з коробки:

| Сімейство     | Ідентифікатори моделей                                                   |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4         | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code      | `grok-code-fast-1`                                                       |

Плагін також переспрямовано розв’язує новіші ідентифікатори `grok-4*` і `grok-code-fast*`, коли
вони відповідають тій самій формі API.

<Tip>
`grok-4-fast`, `grok-4-1-fast` і варіанти `grok-4.20-beta-*` — це
поточні посилання Grok з підтримкою зображень у вбудованому каталозі.
</Tip>

## Покриття можливостей OpenClaw

Вбудований плагін зіставляє поточну публічну поверхню API xAI зі спільними
контрактами провайдера та інструментів OpenClaw там, де така поведінка добре узгоджується.

| Можливість xAI             | Поверхня OpenClaw                        | Статус                                                              |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| Чат / Responses            | Провайдер моделей `xai/<model>`          | Так                                                                 |
| Серверний вебпошук         | Провайдер `web_search` `grok`            | Так                                                                 |
| Серверний пошук X          | Інструмент `x_search`                    | Так                                                                 |
| Серверне виконання коду    | Інструмент `code_execution`              | Так                                                                 |
| Зображення                 | `image_generate`                         | Так                                                                 |
| Відео                      | `video_generate`                         | Так                                                                 |
| Пакетне перетворення тексту в мовлення | `messages.tts.provider: "xai"` / `tts`    | Так                                                                 |
| Потокове TTS               | —                                         | Не надається; контракт TTS в OpenClaw повертає завершені аудіобуфери |
| Пакетне перетворення мовлення в текст | `tools.media.audio` / розуміння медіа | Так                                                                 |
| Потокове перетворення мовлення в текст | —                                         | Не надається; потребує зіставлення контракту потокової транскрипції         |
| Голос у реальному часі     | —                                         | Ще не надається; інший контракт сесії/WebSocket               |
| Файли / пакети             | Лише сумісність із generic model API      | Не є першокласним інструментом OpenClaw                                     |

<Note>
OpenClaw використовує REST API xAI для зображень/відео/TTS/STT для генерації медіа,
мовлення та транскрипції, а Responses API — для моделей, пошуку та
інструментів виконання коду. Можливості, що потребують нових контрактів OpenClaw, такі як
потокове STT або голосові сесії Realtime, документуються тут як можливості
верхнього рівня, а не як прихована поведінка плагіна.
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

### Псевдоніми для застарілої сумісності

Застарілі псевдоніми все ще нормалізуються до канонічних вбудованих ідентифікаторів:

| Застарілий псевдонім       | Канонічний ідентифікатор               |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## Можливості

<AccordionGroup>
  <Accordion title="Вебпошук">
    Вбудований провайдер вебпошуку `grok` теж використовує `XAI_API_KEY`:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Генерація відео">
    Вбудований плагін `xai` реєструє генерацію відео через спільний
    інструмент `video_generate`.

    - Типова модель відео: `xai/grok-imagine-video`
    - Режими: text-to-video, image-to-video, віддалене редагування відео та віддалене
      розширення відео
    - Співвідношення сторін: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Роздільні здатності: `480P`, `720P`
    - Тривалість: 1-15 секунд для generation/image-to-video, 2-10 секунд для
      extension

    <Warning>
    Локальні відеобуфери не підтримуються. Для
    вхідних даних редагування/розширення відео використовуйте віддалені URL `http(s)`.
    Image-to-video приймає локальні буфери зображень, оскільки
    OpenClaw може кодувати їх як URL даних для xAI.
    </Warning>

    Щоб використовувати xAI як типовий провайдер відео:

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
    Див. [Генерація відео](/uk/tools/video-generation) для спільних параметрів інструмента,
    вибору провайдера та поведінки перемикання при збоях.
    </Note>

  </Accordion>

  <Accordion title="Генерація зображень">
    Вбудований плагін `xai` реєструє генерацію зображень через спільний
    інструмент `image_generate`.

    - Типова модель зображень: `xai/grok-imagine-image`
    - Додаткова модель: `xai/grok-imagine-image-pro`
    - Режими: text-to-image і редагування reference-image
    - Вхідні reference-дані: одне `image` або до п’яти `images`
    - Співвідношення сторін: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Роздільні здатності: `1K`, `2K`
    - Кількість: до 4 зображень

    OpenClaw запитує в xAI відповіді зображень у форматі `b64_json`, щоб згенеровані медіа могли
    зберігатися та доставлятися через звичайний шлях вкладень каналу. Локальні
    reference-зображення перетворюються на URL даних; віддалені посилання `http(s)`
    передаються без змін.

    Щоб використовувати xAI як типовий провайдер зображень:

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
    сторін, такі як `1:2`, `2:1`, `9:20` і `20:9`. Сьогодні OpenClaw передає лише
    спільні міжпровайдерні елементи керування зображеннями; непідтримувані
    нативні параметри навмисно не надаються через `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Перетворення тексту в мовлення">
    Вбудований плагін `xai` реєструє перетворення тексту в мовлення через спільну поверхню
    провайдера `tts`.

    - Голоси: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - Типовий голос: `eve`
    - Формати: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Мова: код BCP-47 або `auto`
    - Швидкість: нативне перевизначення швидкості провайдера
    - Нативний формат голосових нотаток Opus не підтримується

    Щоб використовувати xAI як типовий провайдер TTS:

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
    повний аудіобуфер перед доставкою відповіді.
    </Note>

  </Accordion>

  <Accordion title="Перетворення мовлення в текст">
    Вбудований плагін `xai` реєструє пакетне перетворення мовлення в текст через
    поверхню транскрипції для розуміння медіа в OpenClaw.

    - Типова модель: `grok-stt`
    - Ендпоінт: xAI REST `/v1/stt`
    - Шлях введення: multipart-завантаження аудіофайлу
    - Підтримується в OpenClaw скрізь, де транскрипція вхідного аудіо використовує
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
    транскрипції для кожного виклику. Підказки prompt приймаються спільною поверхнею OpenClaw,
    але інтеграція xAI REST STT передає лише файл, модель і
    мову, оскільки саме вони добре зіставляються з поточним публічним ендпоінтом xAI.

    <Note>
    xAI також пропонує потоковий STT через `wss://api.x.ai/v1/stt`. Вбудований
    плагін xAI в OpenClaw поки що цього не надає; поточний провайдер — це пакетний
    STT для транскрипції файлів/сегментів.
    </Note>

  </Accordion>

  <Accordion title="Конфігурація x_search">
    Вбудований плагін xAI надає `x_search` як інструмент OpenClaw для пошуку
    контенту X (раніше Twitter) через Grok.

    Шлях конфігурації: `plugins.entries.xai.config.xSearch`

    | Ключ               | Тип     | Типово             | Опис                                 |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | —                  | Увімкнути або вимкнути x_search      |
    | `model`            | string  | `grok-4-1-fast`    | Модель, що використовується для запитів x_search |
    | `inlineCitations`  | boolean | —                  | Додавати вбудовані цитування в результати |
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
    віддаленого виконання коду в середовищі sandbox xAI.

    Шлях конфігурації: `plugins.entries.xai.config.codeExecution`

    | Ключ              | Тип     | Типово                   | Опис                                           |
    | ----------------- | ------- | ------------------------ | ---------------------------------------------- |
    | `enabled`         | boolean | `true` (якщо ключ доступний) | Увімкнути або вимкнути виконання коду     |
    | `model`           | string  | `grok-4-1-fast`          | Модель, що використовується для запитів виконання коду |
    | `maxTurns`        | number  | —                        | Максимальна кількість ходів розмови            |
    | `timeoutSeconds`  | number  | —                        | Тайм-аут запиту в секундах                     |

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
    - Наразі автентифікація підтримує лише API-ключ. Потоків xAI OAuth або device-code в
      OpenClaw поки що немає.
    - `grok-4.20-multi-agent-experimental-beta-0304` не підтримується на
      звичайному шляху провайдера xAI, оскільки він потребує іншої верхньорівневої API-поверхні,
      ніж стандартний транспорт xAI в OpenClaw.
    - Потокові STT і Realtime voice від xAI ще не зареєстровані як провайдери
      OpenClaw. Пакетний xAI STT зареєстровано через розуміння медіа.
      Потокові STT і Realtime voice потребують зіставлення контракту WebSocket/сесії.
    - `quality` зображень xAI, `mask` зображень та додаткові нативні співвідношення сторін
      не надаються, доки спільний інструмент `image_generate` не отримає відповідні
      міжпровайдерні елементи керування.
  </Accordion>

  <Accordion title="Розширені примітки">
    - OpenClaw автоматично застосовує специфічні для xAI виправлення сумісності схем інструментів і викликів інструментів
      на спільному шляху виконання.
    - Нативні запити xAI типово використовують `tool_stream: true`. Установіть
      `agents.defaults.models["xai/<model>"].params.tool_stream` у `false`, щоб
      вимкнути це.
    - Вбудована обгортка xAI видаляє непідтримувані прапорці strict tool-schema і
      ключі payload reasoning перед надсиланням нативних запитів xAI.
    - `web_search`, `x_search` і `code_execution` надаються як інструменти
      OpenClaw. OpenClaw вмикає конкретний вбудований механізм xAI, який йому потрібен, у кожному
      запиті інструмента, замість того щоб додавати всі нативні інструменти до кожного ходу чату.
    - `x_search` і `code_execution` належать вбудованому плагіну xAI, а не
      жорстко вбудовані в основне середовище виконання моделей.
    - `code_execution` — це віддалене виконання в sandbox xAI, а не локальний
      [`exec`](/uk/tools/exec).
  </Accordion>
</AccordionGroup>

## Живе тестування

Шляхи медіа xAI покриваються модульними тестами та живими наборами, що вмикаються за потреби. Живі
команди завантажують секрети з вашої оболонки входу, включно з `~/.profile`, перед
перевіркою `XAI_API_KEY`.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Специфічний для провайдера живий файл синтезує звичайний TTS, зручний для телефонії PCM
TTS, транскрибує аудіо через xAI STT, генерує результат text-to-image і
редагує reference-зображення. Спільний живий файл зображень перевіряє той самий провайдер xAI
через вибір середовища виконання OpenClaw, резервне перемикання, нормалізацію та
шлях вкладення медіа.

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
    Поширені проблеми та способи виправлення.
  </Card>
</CardGroup>
