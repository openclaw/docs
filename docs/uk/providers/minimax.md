---
read_when:
    - Ви хочете моделі MiniMax в OpenClaw
    - Вам потрібні вказівки з налаштування MiniMax
summary: Використовуйте моделі MiniMax в OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-04-25T20:33:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b91f8c4c12c993457fb1535bbb2f3401474a3ec432b24189792a20041e756dc
    source_path: providers/minimax.md
    workflow: 15
---

Провайдер MiniMax в OpenClaw за замовчуванням використовує **MiniMax M2.7**.

MiniMax також надає:

- Вбудований синтез мовлення через T2A v2
- Вбудоване розуміння зображень через `MiniMax-VL-01`
- Вбудовану генерацію музики через `music-2.6`
- Вбудований `web_search` через API пошуку MiniMax Coding Plan

Розподіл провайдерів:

| Provider ID      | Auth    | Можливості                                                                                         |
| ---------------- | ------- | -------------------------------------------------------------------------------------------------- |
| `minimax`        | API key | Текст, генерація зображень, генерація музики, генерація відео, розуміння зображень, мовлення, веб-пошук |
| `minimax-portal` | OAuth   | Текст, генерація зображень, генерація музики, генерація відео, розуміння зображень, мовлення            |

## Вбудований каталог

| Модель                   | Тип              | Опис                                     |
| ------------------------ | ---------------- | ---------------------------------------- |
| `MiniMax-M2.7`           | Чат (міркування) | Типова хостингова модель міркування      |
| `MiniMax-M2.7-highspeed` | Чат (міркування) | Швидший рівень міркування M2.7           |
| `MiniMax-VL-01`          | Vision           | Модель розуміння зображень               |
| `image-01`               | Генерація зображень | Перетворення тексту на зображення та редагування зображення в зображення |
| `music-2.6`              | Генерація музики | Типова музична модель                    |
| `music-2.5`              | Генерація музики | Попередній рівень генерації музики       |
| `music-2.0`              | Генерація музики | Застарілий рівень генерації музики       |
| `MiniMax-Hailuo-2.3`     | Генерація відео  | Робочі процеси текст-у-відео та з посиланням на зображення |

## Початок роботи

Виберіть бажаний спосіб автентифікації та виконайте кроки налаштування.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Найкраще для:** швидкого налаштування MiniMax Coding Plan через OAuth, ключ API не потрібен.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Запустіть онбординг">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            Це виконує автентифікацію через `api.minimax.io`.
          </Step>
          <Step title="Перевірте, що модель доступна">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Запустіть онбординг">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            Це виконує автентифікацію через `api.minimaxi.com`.
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
    Налаштування OAuth використовують ID провайдера `minimax-portal`. Посилання на модель мають формат `minimax-portal/MiniMax-M2.7`.
    </Note>

    <Tip>
    Реферальне посилання для MiniMax Coding Plan (знижка 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API key">
    **Найкраще для:** хостингового MiniMax із API, сумісним з Anthropic.

    <Tabs>
      <Tab title="International">
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
      <Tab title="China">
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
    У сумісному з Anthropic потоковому шляху OpenClaw за замовчуванням вимикає thinking для MiniMax, якщо ви явно не встановите `thinking` самостійно. Потокова кінцева точка MiniMax надсилає `reasoning_content` у дельта-фрагментах у стилі OpenAI замість нативних блоків thinking Anthropic, через що внутрішні міркування можуть потрапити у видимий вивід, якщо залишити цю функцію неявно ввімкненою.
    </Warning>

    <Note>
    Налаштування з ключем API використовують ID провайдера `minimax`. Посилання на модель мають формат `minimax/MiniMax-M2.7`.
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
    Виберіть **Model/auth** у меню.
  </Step>
  <Step title="Виберіть варіант автентифікації MiniMax">
    Виберіть один із доступних варіантів MiniMax:

    | Auth choice | Опис |
    | --- | --- |
    | `minimax-global-oauth` | Міжнародний OAuth (Coding Plan) |
    | `minimax-cn-oauth` | OAuth для Китаю (Coding Plan) |
    | `minimax-global-api` | Міжнародний ключ API |
    | `minimax-cn-api` | Ключ API для Китаю |

  </Step>
  <Step title="Виберіть типову модель">
    Коли з’явиться запит, виберіть типову модель.
  </Step>
</Steps>

## Можливості

### Генерація зображень

Plugin MiniMax реєструє модель `image-01` для інструмента `image_generate`. Вона підтримує:

- **Генерацію зображення з тексту** з керуванням співвідношенням сторін
- **Редагування зображення на основі зображення** (посилання на об’єкт) з керуванням співвідношенням сторін
- До **9 вихідних зображень** на запит
- До **1 еталонного зображення** на запит редагування
- Підтримувані співвідношення сторін: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

Щоб використовувати MiniMax для генерації зображень, вкажіть його як провайдера генерації зображень:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

Plugin використовує той самий `MINIMAX_API_KEY` або OAuth-автентифікацію, що й текстові моделі. Якщо MiniMax уже налаштовано, додаткова конфігурація не потрібна.

І `minimax`, і `minimax-portal` реєструють `image_generate` з однаковою
моделлю `image-01`. Налаштування з ключем API використовують `MINIMAX_API_KEY`; налаштування OAuth можуть використовувати
натомість вбудований шлях автентифікації `minimax-portal`.

Генерація зображень завжди використовує виділену кінцеву точку зображень MiniMax
(`/v1/image_generation`) і ігнорує `models.providers.minimax.baseUrl`,
оскільки це поле налаштовує базовий URL для чату / сумісного з Anthropic API. Встановіть
`MINIMAX_API_HOST=https://api.minimaxi.com`, щоб спрямувати генерацію зображень
через CN-кінцеву точку; глобальною кінцевою точкою за замовчуванням є
`https://api.minimax.io`.

Коли онбординг або налаштування з ключем API записують явні записи
`models.providers.minimax`, OpenClaw матеріалізує `MiniMax-M2.7` і
`MiniMax-M2.7-highspeed` як текстові чат-моделі. Розуміння зображень
надається окремо через медіапровайдера `MiniMax-VL-01`, який належить Plugin.

<Note>
Див. [Генерація зображень](/uk/tools/image-generation), щоб ознайомитися зі спільними параметрами інструмента, вибором провайдера та поведінкою failover.
</Note>

### Перетворення тексту на мовлення

Вбудований plugin `minimax` реєструє MiniMax T2A v2 як провайдера мовлення для
`messages.tts`.

- Типова модель TTS: `speech-2.8-hd`
- Типовий голос: `English_expressive_narrator`
- Підтримувані вбудовані ідентифікатори моделей включають `speech-2.8-hd`, `speech-2.8-turbo`,
  `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`,
  `speech-02-turbo`, `speech-01-hd` і `speech-01-turbo`.
- Визначення автентифікації виконується в такому порядку: `messages.tts.providers.minimax.apiKey`, потім
  профілі автентифікації OAuth/токенів `minimax-portal`, потім ключі середовища Token Plan (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
  `MINIMAX_CODING_API_KEY`), а потім `MINIMAX_API_KEY`.
- Якщо хост TTS не налаштовано, OpenClaw повторно використовує налаштований
  OAuth-хост `minimax-portal` і видаляє суфікси шляхів, сумісних з Anthropic,
  такі як `/anthropic`.
- Звичайні аудіовкладення залишаються у форматі MP3.
- Цілі для голосових нотаток, такі як Feishu і Telegram, транскодуються з MP3 MiniMax
  у 48 кГц Opus за допомогою `ffmpeg`, оскільки API файлів Feishu/Lark приймає
  лише `file_type: "opus"` для нативних аудіоповідомлень.
- MiniMax T2A приймає дробові значення `speed` і `vol`, але `pitch` надсилається як
  ціле число; OpenClaw відкидає дробову частину значень `pitch` перед запитом до API.

| Налаштування                             | Змінна середовища      | Типове значення              | Опис                                |
| ---------------------------------------- | ---------------------- | ---------------------------- | ----------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`     | Хост API MiniMax T2A.               |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`              | Ідентифікатор моделі TTS.           |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | Ідентифікатор голосу для мовлення. |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                        | Швидкість відтворення, `0.5..2.0`.  |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                        | Гучність, `(0, 10]`.                |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                          | Цілочисельний зсув тону, `-12..12`. |

### Генерація музики

Вбудований plugin MiniMax реєструє генерацію музики через спільний
інструмент `music_generate` для `minimax` і `minimax-portal`.

- Типова музична модель: `minimax/music-2.6`
- Музична модель OAuth: `minimax-portal/music-2.6`
- Також підтримуються `minimax/music-2.5` і `minimax/music-2.0`
- Керування підказкою: `lyrics`, `instrumental`, `durationSeconds`
- Формат виводу: `mp3`
- Запуски з підтримкою сесій від’єднуються через спільний потік завдань/статусу, включно з `action: "status"`

Щоб використовувати MiniMax як типовий провайдер музики:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "minimax/music-2.6",
      },
    },
  },
}
```

<Note>
Див. [Генерація музики](/uk/tools/music-generation), щоб ознайомитися зі спільними параметрами інструмента, вибором провайдера та поведінкою failover.
</Note>

### Генерація відео

Вбудований plugin MiniMax реєструє генерацію відео через спільний
інструмент `video_generate` для `minimax` і `minimax-portal`.

- Типова відеомодель: `minimax/MiniMax-Hailuo-2.3`
- Відеомодель OAuth: `minimax-portal/MiniMax-Hailuo-2.3`
- Режими: текст-у-відео та потоки з одним еталонним зображенням
- Підтримує `aspectRatio` і `resolution`

Щоб використовувати MiniMax як типовий провайдер відео:

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
Див. [Генерація відео](/uk/tools/video-generation), щоб ознайомитися зі спільними параметрами інструмента, вибором провайдера та поведінкою failover.
</Note>

### Розуміння зображень

Plugin MiniMax реєструє розуміння зображень окремо від текстового
каталогу:

| Provider ID      | Типова модель зображень |
| ---------------- | ----------------------- |
| `minimax`        | `MiniMax-VL-01`         |
| `minimax-portal` | `MiniMax-VL-01`         |

Саме тому автоматична маршрутизація медіа може використовувати розуміння зображень MiniMax навіть
коли вбудований каталог текстових провайдерів усе ще показує лише текстові посилання на чат-моделі M2.7.

### Веб-пошук

Plugin MiniMax також реєструє `web_search` через пошуковий API MiniMax Coding Plan.

- ID провайдера: `minimax`
- Структуровані результати: заголовки, URL, сніпети, пов’язані запити
- Бажана змінна середовища: `MINIMAX_CODE_PLAN_KEY`
- Прийнятний псевдонім змінної середовища: `MINIMAX_CODING_API_KEY`
- Резервний варіант для сумісності: `MINIMAX_API_KEY`, якщо він уже вказує на токен coding plan
- Повторне використання регіону: `plugins.entries.minimax.config.webSearch.region`, потім `MINIMAX_API_HOST`, потім базові URL провайдерів MiniMax
- Пошук залишається на ID провайдера `minimax`; налаштування OAuth CN/global усе ще можуть непрямо спрямовувати регіон через `models.providers.minimax-portal.baseUrl`

Конфігурація розташована в `plugins.entries.minimax.config.webSearch.*`.

<Note>
Див. [Пошук MiniMax](/uk/tools/minimax-search), щоб ознайомитися з повною конфігурацією та використанням веб-пошуку.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Параметри конфігурації">
    | Параметр | Опис |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Надавайте перевагу `https://api.minimax.io/anthropic` (сумісний з Anthropic); `https://api.minimax.io/v1` необов’язковий для payloads, сумісних з OpenAI |
    | `models.providers.minimax.api` | Надавайте перевагу `anthropic-messages`; `openai-completions` необов’язковий для payloads, сумісних з OpenAI |
    | `models.providers.minimax.apiKey` | Ключ API MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Визначає `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Псевдоніми моделей, які ви хочете додати до allowlist |
    | `models.mode` | Залиште `merge`, якщо хочете додати MiniMax поруч із вбудованими моделями |
  </Accordion>

  <Accordion title="Типові значення thinking">
    Для `api: "anthropic-messages"` OpenClaw додає `thinking: { type: "disabled" }`, якщо thinking ще не задано явно в параметрах/конфігурації.

    Це запобігає тому, що потокова кінцева точка MiniMax надсилатиме `reasoning_content` у дельта-фрагментах у стилі OpenAI, через що внутрішні міркування потраплятимуть у видимий вивід.

  </Accordion>

  <Accordion title="Швидкий режим">
    `/fast on` або `params.fastMode: true` переписує `MiniMax-M2.7` на `MiniMax-M2.7-highspeed` у сумісному з Anthropic потоковому шляху.
  </Accordion>

  <Accordion title="Приклад failover">
    **Найкраще для:** зберегти найсильнішу актуальну модель нового покоління як основну й переключатися на MiniMax M2.7 у разі збою. У прикладі нижче як конкретну основну модель використано Opus; замініть її на бажану для вас актуальну модель нового покоління.

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

  <Accordion title="Деталі використання Coding Plan">
    - API використання Coding Plan: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` (потрібен ключ coding plan).
    - OpenClaw нормалізує використання MiniMax coding plan до того самого відображення `% left`, що й для інших провайдерів. Сирі поля MiniMax `usage_percent` / `usagePercent` означають залишкову квоту, а не спожиту, тому OpenClaw інвертує їх. Поля з підрахунком мають пріоритет, якщо вони присутні.
    - Коли API повертає `model_remains`, OpenClaw надає перевагу запису чат-моделі, за потреби виводить мітку вікна з `start_time` / `end_time` і включає вибрану назву моделі до мітки плану, щоб вікна coding plan було легше розрізняти.
    - Знімки використання розглядають `minimax`, `minimax-cn` і `minimax-portal` як одну й ту саму поверхню квоти MiniMax і надають перевагу збереженому OAuth MiniMax, перш ніж переходити до змінних середовища з ключами Coding Plan.

  </Accordion>
</AccordionGroup>

## Примітки

- Посилання на моделі відповідають шляху автентифікації:
  - Налаштування з ключем API: `minimax/<model>`
  - Налаштування OAuth: `minimax-portal/<model>`
- Типова чат-модель: `MiniMax-M2.7`
- Альтернативна чат-модель: `MiniMax-M2.7-highspeed`
- Онбординг і пряме налаштування з ключем API записують визначення лише текстових моделей для обох варіантів M2.7
- Для розуміння зображень використовується медіапровайдер `MiniMax-VL-01`, який належить Plugin
- Оновіть значення цін у `models.json`, якщо вам потрібне точне відстеження вартості
- Використовуйте `openclaw models list`, щоб підтвердити поточний ID провайдера, а потім перемикайтеся через `openclaw models set minimax/MiniMax-M2.7` або `openclaw models set minimax-portal/MiniMax-M2.7`

<Tip>
Реферальне посилання для MiniMax Coding Plan (знижка 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Див. [Провайдери моделей](/uk/concepts/model-providers), щоб ознайомитися з правилами для провайдерів.
</Note>

## Усунення несправностей

<AccordionGroup>
  <Accordion title='"Unknown model: minimax/MiniMax-M2.7"'>
    Зазвичай це означає, що **провайдер MiniMax не налаштовано** (немає відповідного запису провайдера і не знайдено профіль автентифікації/env key MiniMax). Виправлення для цього виявлення є у версії **2026.1.12**. Щоб виправити проблему:

    - Оновіться до **2026.1.12** (або запустіть з вихідного коду `main`), а потім перезапустіть Gateway.
    - Запустіть `openclaw configure` і виберіть варіант автентифікації **MiniMax**, або
    - Додайте відповідний блок `models.providers.minimax` або `models.providers.minimax-portal` вручну, або
    - Встановіть `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` або профіль автентифікації MiniMax, щоб можна було підставити відповідний провайдер.

    Переконайтеся, що ID моделі **чутливий до регістру**:

    - Шлях із ключем API: `minimax/MiniMax-M2.7` або `minimax/MiniMax-M2.7-highspeed`
    - Шлях OAuth: `minimax-portal/MiniMax-M2.7` або `minimax-portal/MiniMax-M2.7-highspeed`

    Потім ще раз перевірте за допомогою:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Більше допомоги: [Усунення несправностей](/uk/help/troubleshooting) і [FAQ](/uk/help/faq).
</Note>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Генерація зображень" href="/uk/tools/image-generation" icon="image">
    Спільні параметри інструмента зображень і вибір провайдера.
  </Card>
  <Card title="Генерація музики" href="/uk/tools/music-generation" icon="music">
    Спільні параметри інструмента музики і вибір провайдера.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента відео і вибір провайдера.
  </Card>
  <Card title="Пошук MiniMax" href="/uk/tools/minimax-search" icon="magnifying-glass">
    Конфігурація веб-пошуку через MiniMax Coding Plan.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Загальне усунення несправностей і FAQ.
  </Card>
</CardGroup>
