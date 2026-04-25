---
read_when:
    - Ви хочете моделі MiniMax в OpenClaw
    - Вам потрібні вказівки щодо налаштування MiniMax
summary: Використовуйте моделі MiniMax в OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-04-25T19:42:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 910dffc160d5acf69fcacaf0009395e5f53509fa2ffe3c20a9128c87013d1b36
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

| Provider ID      | Auth    | Можливості                                                    |
| ---------------- | ------- | ------------------------------------------------------------- |
| `minimax`        | API key | Текст, генерація зображень, розуміння зображень, мовлення, вебпошук |
| `minimax-portal` | OAuth   | Текст, генерація зображень, розуміння зображень, мовлення     |

## Вбудований каталог

| Model                    | Type             | Description                              |
| ------------------------ | ---------------- | ---------------------------------------- |
| `MiniMax-M2.7`           | Chat (reasoning) | Хостингова модель міркування за замовчуванням |
| `MiniMax-M2.7-highspeed` | Chat (reasoning) | Швидший рівень міркування M2.7           |
| `MiniMax-VL-01`          | Vision           | Модель розуміння зображень               |
| `image-01`               | Image generation | Генерація зображень із тексту та редагування зображень за зображенням |
| `music-2.6`              | Music generation | Музична модель за замовчуванням          |
| `music-2.5`              | Music generation | Попередній рівень генерації музики       |
| `music-2.0`              | Music generation | Застарілий рівень генерації музики       |
| `MiniMax-Hailuo-2.3`     | Video generation | Потоки text-to-video і з використанням зображення як референсу |

## Початок роботи

Виберіть бажаний спосіб автентифікації та виконайте кроки налаштування.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Найкраще для:** швидкого налаштування MiniMax Coding Plan через OAuth, без потреби в API key.

    <Tabs>
      <Tab title="International">
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
      <Tab title="China">
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
    Налаштування OAuth використовують id провайдера `minimax-portal`. Посилання на моделі мають формат `minimax-portal/MiniMax-M2.7`.
    </Note>

    <Tip>
    Реферальне посилання для MiniMax Coding Plan (знижка 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API key">
    **Найкраще для:** хостингового MiniMax з API, сумісним з Anthropic.

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
    У сумісному з Anthropic потоковому шляху OpenClaw за замовчуванням вимикає thinking MiniMax, якщо ви явно не встановите `thinking` самостійно. Потокова кінцева точка MiniMax надсилає `reasoning_content` у дельта-чанках у стилі OpenAI замість нативних блоків thinking Anthropic, через що внутрішні міркування можуть потрапити у видимий вивід, якщо залишити це неявно увімкненим.
    </Warning>

    <Note>
    Налаштування з API key використовують id провайдера `minimax`. Посилання на моделі мають формат `minimax/MiniMax-M2.7`.
    </Note>

  </Tab>
</Tabs>

## Налаштування через `openclaw configure`

Використайте інтерактивний майстер конфігурації, щоб налаштувати MiniMax без редагування JSON:

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

    | Auth choice | Description |
    | --- | --- |
    | `minimax-global-oauth` | Міжнародний OAuth (Coding Plan) |
    | `minimax-cn-oauth` | OAuth для Китаю (Coding Plan) |
    | `minimax-global-api` | Міжнародний API key |
    | `minimax-cn-api` | API key для Китаю |

  </Step>
  <Step title="Виберіть модель за замовчуванням">
    Коли з’явиться запит, виберіть модель за замовчуванням.
  </Step>
</Steps>

## Можливості

### Генерація зображень

Plugin MiniMax реєструє модель `image-01` для інструмента `image_generate`. Вона підтримує:

- **Генерацію зображень із тексту** з керуванням співвідношенням сторін
- **Редагування зображень за зображенням** (референс об’єкта) з керуванням співвідношенням сторін
- До **9 вихідних зображень** на запит
- До **1 референсного зображення** на запит редагування
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

Plugin використовує той самий `MINIMAX_API_KEY` або OAuth-автентифікацію, що й текстові моделі. Якщо MiniMax уже налаштовано, додаткова конфігурація не потрібна.

І `minimax`, і `minimax-portal` реєструють `image_generate` з тією самою
моделлю `image-01`. Налаштування з API key використовують `MINIMAX_API_KEY`; налаштування OAuth можуть натомість використовувати
вбудований шлях автентифікації `minimax-portal`.

Генерація зображень завжди використовує спеціалізовану кінцеву точку зображень MiniMax
(`/v1/image_generation`) і ігнорує `models.providers.minimax.baseUrl`,
оскільки це поле налаштовує базовий URL для чату, сумісний з Anthropic. Встановіть
`MINIMAX_API_HOST=https://api.minimaxi.com`, щоб спрямувати генерацію зображень
через кінцеву точку CN; глобальна кінцева точка за замовчуванням —
`https://api.minimax.io`.

Коли онбординг або налаштування через API key записують явні записи
`models.providers.minimax`, OpenClaw матеріалізує `MiniMax-M2.7` і
`MiniMax-M2.7-highspeed` як текстові моделі чату. Розуміння зображень
надається окремо через медіапровайдера `MiniMax-VL-01`, який належить plugin.

<Note>
Див. [Генерація зображень](/uk/tools/image-generation) щодо спільних параметрів інструмента, вибору провайдера та поведінки failover.
</Note>

### Перетворення тексту на мовлення

Вбудований plugin `minimax` реєструє MiniMax T2A v2 як провайдера мовлення для
`messages.tts`.

- Модель TTS за замовчуванням: `speech-2.8-hd`
- Голос за замовчуванням: `English_expressive_narrator`
- Підтримувані вбудовані id моделей включають `speech-2.8-hd`, `speech-2.8-turbo`,
  `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`,
  `speech-02-turbo`, `speech-01-hd` і `speech-01-turbo`.
- Порядок визначення автентифікації: `messages.tts.providers.minimax.apiKey`, потім
  профілі автентифікації `minimax-portal` OAuth/token, потім ключі середовища Token Plan (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
  `MINIMAX_CODING_API_KEY`), потім `MINIMAX_API_KEY`.
- Якщо хост TTS не налаштовано, OpenClaw повторно використовує налаштований
  OAuth-хост `minimax-portal` і прибирає суфікси шляху, сумісні з Anthropic,
  такі як `/anthropic`.
- Звичайні аудіовкладення залишаються у форматі MP3.
- Цільові платформи для голосових нотаток, такі як Feishu і Telegram, перекодовуються з MP3 MiniMax
  у 48kHz Opus за допомогою `ffmpeg`, оскільки API файлів Feishu/Lark приймає лише
  `file_type: "opus"` для нативних аудіоповідомлень.
- MiniMax T2A приймає дробові значення `speed` і `vol`, але `pitch` надсилається як
  ціле число; OpenClaw відкидає дробову частину значень `pitch` перед API-запитом.

| Setting                                  | Env var                | Default                       | Description                      |
| ---------------------------------------- | ---------------------- | ----------------------------- | -------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | Хост API MiniMax T2A.            |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | id моделі TTS.                   |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | id голосу, що використовується для мовленнєвого виводу. |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                         | Швидкість відтворення, `0.5..2.0`. |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                         | Гучність, `(0, 10]`.             |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                           | Цілочисельний зсув тону, `-12..12`. |

### Генерація музики

Вбудований plugin `minimax` також реєструє генерацію музики через спільний
інструмент `music_generate`.

- Музична модель за замовчуванням: `minimax/music-2.6`
- Також підтримує `minimax/music-2.5` і `minimax/music-2.0`
- Керування промптом: `lyrics`, `instrumental`, `durationSeconds`
- Формат виходу: `mp3`
- Запуски з підтримкою сесій від’єднуються через спільний потік задачі/статусу, включно з `action: "status"`

Щоб використовувати MiniMax як провайдера музики за замовчуванням:

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
Див. [Генерація музики](/uk/tools/music-generation) щодо спільних параметрів інструмента, вибору провайдера та поведінки failover.
</Note>

### Генерація відео

Вбудований plugin `minimax` також реєструє генерацію відео через спільний
інструмент `video_generate`.

- Відеомодель за замовчуванням: `minimax/MiniMax-Hailuo-2.3`
- Режими: text-to-video і потоки з одним референсним зображенням
- Підтримує `aspectRatio` і `resolution`

Щоб використовувати MiniMax як провайдера відео за замовчуванням:

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
Див. [Генерація відео](/uk/tools/video-generation) щодо спільних параметрів інструмента, вибору провайдера та поведінки failover.
</Note>

### Розуміння зображень

Plugin MiniMax реєструє розуміння зображень окремо від текстового
каталогу:

| Provider ID      | Default image model |
| ---------------- | ------------------- |
| `minimax`        | `MiniMax-VL-01`     |
| `minimax-portal` | `MiniMax-VL-01`     |

Саме тому автоматична маршрутизація медіа може використовувати розуміння зображень MiniMax навіть
тоді, коли вбудований каталог текстового провайдера все ще показує лише текстові посилання на чат M2.7.

### Вебпошук

Plugin MiniMax також реєструє `web_search` через API пошуку MiniMax Coding Plan.

- id провайдера: `minimax`
- Структуровані результати: заголовки, URL, фрагменти, пов’язані запити
- Бажана змінна середовища: `MINIMAX_CODE_PLAN_KEY`
- Прийнятний псевдонім env: `MINIMAX_CODING_API_KEY`
- Сумісний резервний варіант: `MINIMAX_API_KEY`, якщо він уже вказує на токен coding-plan
- Повторне використання регіону: `plugins.entries.minimax.config.webSearch.region`, потім `MINIMAX_API_HOST`, потім базові URL провайдера MiniMax
- Пошук залишається на id провайдера `minimax`; налаштування OAuth CN/global усе ще можуть опосередковано керувати регіоном через `models.providers.minimax-portal.baseUrl`

Конфігурація розміщується в `plugins.entries.minimax.config.webSearch.*`.

<Note>
Див. [MiniMax Search](/uk/tools/minimax-search) для повної конфігурації та використання вебпошуку.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Параметри конфігурації">
    | Option | Description |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Надавайте перевагу `https://api.minimax.io/anthropic` (сумісний з Anthropic); `https://api.minimax.io/v1` — необов’язковий для корисних навантажень, сумісних з OpenAI |
    | `models.providers.minimax.api` | Надавайте перевагу `anthropic-messages`; `openai-completions` — необов’язковий для корисних навантажень, сумісних з OpenAI |
    | `models.providers.minimax.apiKey` | API key MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Визначте `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Псевдоніми моделей, які ви хочете додати до allowlist |
    | `models.mode` | Залиште `merge`, якщо хочете додати MiniMax поряд із вбудованими |
  </Accordion>

  <Accordion title="Параметри thinking за замовчуванням">
    Для `api: "anthropic-messages"` OpenClaw додає `thinking: { type: "disabled" }`, якщо thinking уже не задано явно в params/config.

    Це запобігає тому, щоб потокова кінцева точка MiniMax надсилала `reasoning_content` у дельта-чанках у стилі OpenAI, що призвело б до витоку внутрішніх міркувань у видимий вивід.

  </Accordion>

  <Accordion title="Швидкий режим">
    `/fast on` або `params.fastMode: true` переписує `MiniMax-M2.7` на `MiniMax-M2.7-highspeed` у сумісному з Anthropic потоковому шляху.
  </Accordion>

  <Accordion title="Приклад резервного варіанта">
    **Найкраще для:** зберегти вашу найсильнішу модель останнього покоління як основну та використовувати MiniMax M2.7 як резервну. У прикладі нижче як конкретна основна модель використовується Opus; замініть її на бажану основну модель останнього покоління.

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
    - API використання Coding Plan: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` (потребує ключа coding plan).
    - OpenClaw нормалізує використання MiniMax coding-plan до того самого відображення `% left`, яке використовується для інших провайдерів. Сирі поля MiniMax `usage_percent` / `usagePercent` означають залишок квоти, а не витрачену квоту, тому OpenClaw інвертує їх. Поля на основі підрахунку мають пріоритет, якщо вони присутні.
    - Коли API повертає `model_remains`, OpenClaw надає перевагу запису chat-model, за потреби виводить мітку вікна з `start_time` / `end_time` і включає назву вибраної моделі до мітки плану, щоб вікна coding-plan було легше розрізняти.
    - Знімки використання розглядають `minimax`, `minimax-cn` і `minimax-portal` як одну й ту саму поверхню квоти MiniMax та надають перевагу збереженому MiniMax OAuth перед резервним використанням змінних середовища з ключем Coding Plan.
  </Accordion>
</AccordionGroup>

## Примітки

- Посилання на моделі залежать від шляху автентифікації:
  - Налаштування з API key: `minimax/<model>`
  - Налаштування OAuth: `minimax-portal/<model>`
- Модель чату за замовчуванням: `MiniMax-M2.7`
- Альтернативна модель чату: `MiniMax-M2.7-highspeed`
- Онбординг і пряме налаштування через API key записують визначення лише текстових моделей для обох варіантів M2.7
- Для розуміння зображень використовується медіапровайдер `MiniMax-VL-01`, який належить plugin
- Оновіть значення цін у `models.json`, якщо вам потрібне точне відстеження вартості
- Використайте `openclaw models list`, щоб підтвердити поточний id провайдера, а потім перемкніть через `openclaw models set minimax/MiniMax-M2.7` або `openclaw models set minimax-portal/MiniMax-M2.7`

<Tip>
Реферальне посилання для MiniMax Coding Plan (знижка 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Див. [Провайдери моделей](/uk/concepts/model-providers) щодо правил провайдерів.
</Note>

## Усунення несправностей

<AccordionGroup>
  <Accordion title='"Unknown model: minimax/MiniMax-M2.7"'>
    Зазвичай це означає, що **провайдер MiniMax не налаштований** (немає відповідного запису провайдера і не знайдено профіль автентифікації/env key MiniMax). Виправлення для цього виявлення є в **2026.1.12**. Щоб виправити:

    - Оновіться до **2026.1.12** (або запустіть із вихідного коду `main`), а потім перезапустіть Gateway.
    - Запустіть `openclaw configure` і виберіть параметр автентифікації **MiniMax**, або
    - Додайте відповідний блок `models.providers.minimax` або `models.providers.minimax-portal` вручну, або
    - Встановіть `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` або профіль автентифікації MiniMax, щоб можна було інʼєктувати відповідний провайдер.

    Переконайтеся, що id моделі **чутливий до регістру**:

    - Шлях API key: `minimax/MiniMax-M2.7` або `minimax/MiniMax-M2.7-highspeed`
    - Шлях OAuth: `minimax-portal/MiniMax-M2.7` або `minimax-portal/MiniMax-M2.7-highspeed`

    Потім перевірте ще раз за допомогою:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Додаткова допомога: [Усунення несправностей](/uk/help/troubleshooting) і [FAQ](/uk/help/faq).
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
  <Card title="MiniMax Search" href="/uk/tools/minimax-search" icon="magnifying-glass">
    Конфігурація вебпошуку через MiniMax Coding Plan.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Загальне усунення несправностей і FAQ.
  </Card>
</CardGroup>
