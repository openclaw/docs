---
read_when:
    - Ви хочете моделі MiniMax в OpenClaw
    - Вам потрібні вказівки з налаштування MiniMax
summary: Використовуйте моделі MiniMax в OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-04-25T09:41:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: ddf6cfb68ef5fcaa360a2a7ebb9e3ce130100a59b014643091449a07654c7c6f
    source_path: providers/minimax.md
    workflow: 15
---

Провайдер MiniMax в OpenClaw за замовчуванням використовує **MiniMax M2.7**.

MiniMax також надає:

- Вбудований синтез мовлення через T2A v2
- Вбудоване розуміння зображень через `MiniMax-VL-01`
- Вбудовану генерацію музики через `music-2.5+`
- Вбудований `web_search` через API пошуку MiniMax Coding Plan

Розділення провайдерів:

| Provider ID      | Auth    | Можливості                                                    |
| ---------------- | ------- | ------------------------------------------------------------- |
| `minimax`        | API key | Текст, генерація зображень, розуміння зображень, мовлення, вебпошук |
| `minimax-portal` | OAuth   | Текст, генерація зображень, розуміння зображень, мовлення     |

## Вбудований каталог

| Model                    | Type             | Description                              |
| ------------------------ | ---------------- | ---------------------------------------- |
| `MiniMax-M2.7`           | Чат (міркування) | Типова розміщена модель для міркування   |
| `MiniMax-M2.7-highspeed` | Чат (міркування) | Швидший рівень міркування M2.7           |
| `MiniMax-VL-01`          | Зір              | Модель розуміння зображень               |
| `image-01`               | Генерація зображень | Перетворення тексту на зображення та редагування зображення на зображення |
| `music-2.5+`             | Генерація музики | Типова музична модель                    |
| `music-2.5`              | Генерація музики | Попередній рівень генерації музики       |
| `music-2.0`              | Генерація музики | Застарілий рівень генерації музики       |
| `MiniMax-Hailuo-2.3`     | Генерація відео  | Потоки перетворення тексту на відео та з посиланням на зображення |

## Початок роботи

Виберіть бажаний спосіб автентифікації та виконайте кроки налаштування.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Найкраще для:** швидкого налаштування з MiniMax Coding Plan через OAuth, без потреби в API key.

    <Tabs>
      <Tab title="Міжнародний">
        <Steps>
          <Step title="Запустіть онбординг">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            Це автентифікує через `api.minimax.io`.
          </Step>
          <Step title="Перевірте, що модель доступна">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="Китай">
        <Steps>
          <Step title="Запустіть онбординг">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            Це автентифікує через `api.minimaxi.com`.
          </Step>
          <Step title="Перевірте, що модель доступна">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    Налаштування OAuth використовують ідентифікатор провайдера `minimax-portal`. Посилання на моделі мають формат `minimax-portal/MiniMax-M2.7`.
    </Note>

    <Tip>
    Реферальне посилання для MiniMax Coding Plan (знижка 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API key">
    **Найкраще для:** розміщеного MiniMax з API, сумісним з Anthropic.

    <Tabs>
      <Tab title="Міжнародний">
        <Steps>
          <Step title="Запустіть онбординг">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            Це налаштовує `api.minimax.io` як базовий URL.
          </Step>
          <Step title="Перевірте, що модель доступна">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="Китай">
        <Steps>
          <Step title="Запустіть онбординг">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            Це налаштовує `api.minimaxi.com` як базовий URL.
          </Step>
          <Step title="Перевірте, що модель доступна">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    ### Приклад конфігурації

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "minimax/MiniMax-M2.7" } } },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M2.7",
                name: "MiniMax M2.7",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7-highspeed",
                name: "MiniMax M2.7 Highspeed",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    У шляху потокової передачі, сумісному з Anthropic, OpenClaw типово вимикає thinking для MiniMax, якщо ви явно не встановите `thinking` самостійно. Кінцева точка потокової передачі MiniMax надсилає `reasoning_content` у блоках дельти в стилі OpenAI замість нативних блоків thinking Anthropic, через що внутрішні міркування можуть потрапити у видимий вивід, якщо залишити цю опцію неявно ввімкненою.
    </Warning>

    <Note>
    Налаштування з API key використовують ідентифікатор провайдера `minimax`. Посилання на моделі мають формат `minimax/MiniMax-M2.7`.
    </Note>

  </Tab>
</Tabs>

## Налаштування через `openclaw configure`

Скористайтеся інтерактивним майстром конфігурації, щоб налаштувати MiniMax без редагування JSON:

<Steps>
  <Step title="Запустіть майстер">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Виберіть Model/auth">
    У меню виберіть **Model/auth**.
  </Step>
  <Step title="Виберіть варіант автентифікації MiniMax">
    Оберіть один із доступних варіантів MiniMax:

    | Auth choice | Description |
    | --- | --- |
    | `minimax-global-oauth` | Міжнародний OAuth (Coding Plan) |
    | `minimax-cn-oauth` | OAuth для Китаю (Coding Plan) |
    | `minimax-global-api` | Міжнародний API key |
    | `minimax-cn-api` | API key для Китаю |

  </Step>
  <Step title="Виберіть типову модель">
    Коли з’явиться запит, виберіть свою типову модель.
  </Step>
</Steps>

## Можливості

### Генерація зображень

Плагін MiniMax реєструє модель `image-01` для інструмента `image_generate`. Підтримується:

- **Генерація зображень за текстом** із керуванням співвідношенням сторін
- **Редагування зображення на основі зображення** (посилання на об’єкт) із керуванням співвідношенням сторін
- До **9 вихідних зображень** на запит
- До **1 еталонного зображення** на запит редагування
- Підтримувані співвідношення сторін: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

Щоб використовувати MiniMax для генерації зображень, встановіть його як провайдера генерації зображень:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

Плагін використовує той самий `MINIMAX_API_KEY` або OAuth-автентифікацію, що й текстові моделі. Якщо MiniMax уже налаштовано, додаткова конфігурація не потрібна.

І `minimax`, і `minimax-portal` реєструють `image_generate` з тією самою
моделлю `image-01`. Налаштування з API key використовують `MINIMAX_API_KEY`; налаштування OAuth можуть
натомість використовувати вбудований шлях автентифікації `minimax-portal`.

Коли онбординг або налаштування з API key записує явні записи `models.providers.minimax`,
OpenClaw матеріалізує `MiniMax-M2.7` і
`MiniMax-M2.7-highspeed` як текстові моделі чату. Розуміння зображень
надається окремо через медіапровайдер `MiniMax-VL-01`, що належить плагіну.

<Note>
Див. [Генерація зображень](/uk/tools/image-generation), щоб ознайомитися зі спільними параметрами інструмента, вибором провайдера та поведінкою перемикання при збої.
</Note>

### Перетворення тексту на мовлення

Вбудований плагін `minimax` реєструє MiniMax T2A v2 як провайдера мовлення для
`messages.tts`.

- Типова модель TTS: `speech-2.8-hd`
- Типовий голос: `English_expressive_narrator`
- Підтримувані вбудовані ідентифікатори моделей: `speech-2.8-hd`, `speech-2.8-turbo`,
  `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`,
  `speech-02-turbo`, `speech-01-hd` і `speech-01-turbo`.
- Розв’язання автентифікації: `messages.tts.providers.minimax.apiKey`, потім
  профілі автентифікації OAuth/токена `minimax-portal`, потім ключі середовища Token Plan
  (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
  `MINIMAX_CODING_API_KEY`), потім `MINIMAX_API_KEY`.
- Якщо хост TTS не налаштовано, OpenClaw повторно використовує налаштований
  OAuth-хост `minimax-portal` і прибирає суфікси шляху, сумісні з Anthropic,
  як-от `/anthropic`.
- Звичайні аудіовкладення залишаються у форматі MP3.
- Цілі для голосових нотаток, такі як Feishu і Telegram, перекодовуються з MP3 MiniMax
  у 48 кГц Opus за допомогою `ffmpeg`, оскільки API файлів Feishu/Lark
  приймає для нативних аудіоповідомлень лише `file_type: "opus"`.
- MiniMax T2A приймає дробові значення `speed` і `vol`, але `pitch` надсилається як
  ціле число; OpenClaw відкидає дробову частину значень `pitch` перед запитом до API.

| Setting                                  | Env var                | Default                       | Description                      |
| ---------------------------------------- | ---------------------- | ----------------------------- | -------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | Хост API MiniMax T2A.            |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | Ідентифікатор моделі TTS.        |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | Ідентифікатор голосу для мовленнєвого виводу. |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                         | Швидкість відтворення, `0.5..2.0`. |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                         | Гучність, `(0, 10]`.             |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                           | Цілочисельне зміщення висоти тону, `-12..12`. |

### Генерація музики

Вбудований плагін `minimax` також реєструє генерацію музики через спільний
інструмент `music_generate`.

- Типова музична модель: `minimax/music-2.5+`
- Також підтримуються `minimax/music-2.5` і `minimax/music-2.0`
- Керування підказкою: `lyrics`, `instrumental`, `durationSeconds`
- Формат виводу: `mp3`
- Запуски з підтримкою сесії відокремлюються через спільний потік завдань/стану, зокрема `action: "status"`

Щоб використовувати MiniMax як типового провайдера музики:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "minimax/music-2.5+",
      },
    },
  },
}
```

<Note>
Див. [Генерація музики](/uk/tools/music-generation), щоб ознайомитися зі спільними параметрами інструмента, вибором провайдера та поведінкою перемикання при збої.
</Note>

### Генерація відео

Вбудований плагін `minimax` також реєструє генерацію відео через спільний
інструмент `video_generate`.

- Типова відеомодель: `minimax/MiniMax-Hailuo-2.3`
- Режими: перетворення тексту на відео та потоки з одним еталонним зображенням
- Підтримуються `aspectRatio` і `resolution`

Щоб використовувати MiniMax як типового провайдера відео:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "minimax/MiniMax-Hailuo-2.3",
      },
    },
  },
}
```

<Note>
Див. [Генерація відео](/uk/tools/video-generation), щоб ознайомитися зі спільними параметрами інструмента, вибором провайдера та поведінкою перемикання при збої.
</Note>

### Розуміння зображень

Плагін MiniMax реєструє розуміння зображень окремо від текстового
каталогу:

| Provider ID      | Типова модель зображень |
| ---------------- | ----------------------- |
| `minimax`        | `MiniMax-VL-01`         |
| `minimax-portal` | `MiniMax-VL-01`         |

Саме тому автоматична маршрутизація медіа може використовувати MiniMax для розуміння зображень, навіть
коли вбудований каталог текстових провайдерів усе ще показує лише текстові посилання чату M2.7.

### Вебпошук

Плагін MiniMax також реєструє `web_search` через API пошуку MiniMax Coding Plan.

- Ідентифікатор провайдера: `minimax`
- Структуровані результати: заголовки, URL, фрагменти, пов’язані запити
- Бажана змінна середовища: `MINIMAX_CODE_PLAN_KEY`
- Прийнятний псевдонім змінної середовища: `MINIMAX_CODING_API_KEY`
- Резервний варіант сумісності: `MINIMAX_API_KEY`, якщо він уже вказує на токен coding plan
- Повторне використання регіону: `plugins.entries.minimax.config.webSearch.region`, потім `MINIMAX_API_HOST`, потім базові URL провайдера MiniMax
- Пошук залишається на ідентифікаторі провайдера `minimax`; налаштування OAuth CN/global усе ще можуть опосередковано спрямовувати регіон через `models.providers.minimax-portal.baseUrl`

Конфігурація міститься в `plugins.entries.minimax.config.webSearch.*`.

<Note>
Див. [Пошук MiniMax](/uk/tools/minimax-search), щоб ознайомитися з повною конфігурацією та використанням вебпошуку.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Параметри конфігурації">
    | Option | Description |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Надавайте перевагу `https://api.minimax.io/anthropic` (сумісний з Anthropic); `https://api.minimax.io/v1` є необов’язковим для даних, сумісних з OpenAI |
    | `models.providers.minimax.api` | Надавайте перевагу `anthropic-messages`; `openai-completions` є необов’язковим для даних, сумісних з OpenAI |
    | `models.providers.minimax.apiKey` | API key MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Визначте `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Псевдоніми моделей, які ви хочете додати до списку дозволених |
    | `models.mode` | Залиште `merge`, якщо хочете додати MiniMax поряд із вбудованими |
  </Accordion>

  <Accordion title="Типові значення thinking">
    Для `api: "anthropic-messages"` OpenClaw додає `thinking: { type: "disabled" }`, якщо thinking ще не задано явно в параметрах/конфігурації.

    Це запобігає тому, щоб потокова кінцева точка MiniMax надсилала `reasoning_content` у блоках дельти в стилі OpenAI, що могло б розкрити внутрішні міркування у видимому виводі.

  </Accordion>

  <Accordion title="Швидкий режим">
    `/fast on` або `params.fastMode: true` замінює `MiniMax-M2.7` на `MiniMax-M2.7-highspeed` у шляху потоку, сумісному з Anthropic.
  </Accordion>

  <Accordion title="Приклад резервного перемикання">
    **Найкраще для:** зберегти найсильнішу сучасну модель як основну та перемикатися на MiniMax M2.7 у разі збою. У наведеному нижче прикладі як конкретну основну модель використано Opus; замініть її на бажану сучасну основну модель.

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": { alias: "primary" },
            "minimax/MiniMax-M2.7": { alias: "minimax" },
          },
          model: {
            primary: "anthropic/claude-opus-4-6",
            fallbacks: ["minimax/MiniMax-M2.7"],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Докладно про використання Coding Plan">
    - API використання Coding Plan: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` (потрібен ключ coding plan).
    - OpenClaw нормалізує використання MiniMax coding plan до того самого відображення `% left`, що використовується для інших провайдерів. Сирі поля MiniMax `usage_percent` / `usagePercent` означають залишок квоти, а не витрачену квоту, тому OpenClaw інвертує їх. Якщо доступні поля з підрахунком, вони мають пріоритет.
    - Коли API повертає `model_remains`, OpenClaw надає перевагу запису моделі чату, за потреби виводить мітку вікна з `start_time` / `end_time` і включає вибрану назву моделі до мітки плану, щоб вікна coding plan було легше розрізняти.
    - Знімки використання трактують `minimax`, `minimax-cn` і `minimax-portal` як ту саму поверхню квоти MiniMax і надають перевагу збереженому OAuth MiniMax перед резервним використанням змінних середовища з ключем Coding Plan.
  </Accordion>
</AccordionGroup>

## Примітки

- Посилання на моделі відповідають шляху автентифікації:
  - Налаштування з API key: `minimax/<model>`
  - Налаштування OAuth: `minimax-portal/<model>`
- Типова модель чату: `MiniMax-M2.7`
- Альтернативна модель чату: `MiniMax-M2.7-highspeed`
- Онбординг і пряме налаштування з API key записують текстові визначення моделей для обох варіантів M2.7
- Для розуміння зображень використовується медіапровайдер `MiniMax-VL-01`, що належить плагіну
- Оновіть значення цін у `models.json`, якщо вам потрібне точне відстеження вартості
- Використовуйте `openclaw models list`, щоб підтвердити поточний ідентифікатор провайдера, а потім перемкніть його за допомогою `openclaw models set minimax/MiniMax-M2.7` або `openclaw models set minimax-portal/MiniMax-M2.7`

<Tip>
Реферальне посилання для MiniMax Coding Plan (знижка 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Див. [Провайдери моделей](/uk/concepts/model-providers), щоб ознайомитися з правилами для провайдерів.
</Note>

## Усунення проблем

<AccordionGroup>
  <Accordion title='"Unknown model: minimax/MiniMax-M2.7"'>
    Зазвичай це означає, що **провайдер MiniMax не налаштований** (немає відповідного запису провайдера і не знайдено профіль автентифікації/env key MiniMax). Виправлення для цього виявлення є в **2026.1.12**. Щоб виправити:

    - Оновіться до **2026.1.12** (або запустіть із вихідного коду `main`), а потім перезапустіть Gateway.
    - Виконайте `openclaw configure` і виберіть параметр автентифікації **MiniMax**, або
    - Додайте відповідний блок `models.providers.minimax` або `models.providers.minimax-portal` вручну, або
    - Встановіть `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` або профіль автентифікації MiniMax, щоб можна було додати відповідний провайдер.

    Переконайтеся, що ідентифікатор моделі **чутливий до регістру**:

    - Шлях API key: `minimax/MiniMax-M2.7` або `minimax/MiniMax-M2.7-highspeed`
    - Шлях OAuth: `minimax-portal/MiniMax-M2.7` або `minimax-portal/MiniMax-M2.7-highspeed`

    Потім перевірте ще раз за допомогою:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Більше довідки: [Усунення проблем](/uk/help/troubleshooting) і [FAQ](/uk/help/faq).
</Note>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки резервного перемикання.
  </Card>
  <Card title="Генерація зображень" href="/uk/tools/image-generation" icon="image">
    Спільні параметри інструмента зображень і вибір провайдера.
  </Card>
  <Card title="Генерація музики" href="/uk/tools/music-generation" icon="music">
    Спільні параметри музичного інструмента і вибір провайдера.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри відеоінструмента і вибір провайдера.
  </Card>
  <Card title="Пошук MiniMax" href="/uk/tools/minimax-search" icon="magnifying-glass">
    Конфігурація вебпошуку через MiniMax Coding Plan.
  </Card>
  <Card title="Усунення проблем" href="/uk/help/troubleshooting" icon="wrench">
    Загальне усунення проблем і FAQ.
  </Card>
</CardGroup>
