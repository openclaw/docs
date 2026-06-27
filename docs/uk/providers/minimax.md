---
read_when:
    - Вам потрібні моделі MiniMax в OpenClaw
    - Вам потрібні інструкції з налаштування MiniMax
summary: Використовуйте моделі MiniMax в OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-06-27T18:11:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37fe606178d7d15383e56c026b02ba7be751ead706adc097c776c0a6a92aa2a2
    source_path: providers/minimax.md
    workflow: 16
---

Провайдер MiniMax в OpenClaw за замовчуванням використовує **MiniMax M3**.

MiniMax також надає:

- Вбудований синтез мовлення через T2A v2
- Вбудоване розуміння зображень через `MiniMax-VL-01`
- Вбудовану генерацію музики через `music-2.6`
- Вбудований `web_search` через пошуковий API MiniMax Token Plan

Поділ провайдерів:

| ID провайдера   | Автентифікація | Можливості                                                                                          |
| ---------------- | ------- | --------------------------------------------------------------------------------------------------- |
| `minimax`        | API-ключ | Текст, генерація зображень, генерація музики, генерація відео, розуміння зображень, мовлення, вебпошук |
| `minimax-portal` | OAuth   | Текст, генерація зображень, генерація музики, генерація відео, розуміння зображень, мовлення        |

## Вбудований каталог

| Модель                   | Тип              | Опис                                     |
| ------------------------ | ---------------- | ---------------------------------------- |
| `MiniMax-M3`             | Чат (міркування) | Стандартна розміщена модель міркування   |
| `MiniMax-M2.7`           | Чат (міркування) | Попередня розміщена модель міркування    |
| `MiniMax-M2.7-highspeed` | Чат (міркування) | Швидший рівень міркування M2.7           |
| `MiniMax-VL-01`          | Бачення          | Модель розуміння зображень               |
| `image-01`               | Генерація зображень | Перетворення тексту на зображення та редагування зображення за зображенням |
| `music-2.6`              | Генерація музики | Стандартна музична модель                |
| `music-2.5`              | Генерація музики | Попередній рівень генерації музики       |
| `music-2.0`              | Генерація музики | Застарілий рівень генерації музики       |
| `MiniMax-Hailuo-2.3`     | Генерація відео  | Сценарії перетворення тексту на відео та використання зображення як референсу |

## Початок роботи

Виберіть бажаний спосіб автентифікації та виконайте кроки налаштування.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Найкраще для:** швидкого налаштування MiniMax Coding Plan через OAuth без потреби в API-ключі.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            Це виконує автентифікацію через `api.minimax.io`.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            Це виконує автентифікацію через `api.minimaxi.com`.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    Налаштування OAuth використовують ID провайдера `minimax-portal`. Посилання на моделі мають форму `minimax-portal/MiniMax-M3`.
    </Note>

    <Tip>
    Реферальне посилання для MiniMax Coding Plan (знижка 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API key">
    **Найкраще для:** розміщеного MiniMax з Anthropic-сумісним API.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            Це налаштовує `api.minimax.io` як базову URL-адресу.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            Це налаштовує `api.minimaxi.com` як базову URL-адресу.
          </Step>
          <Step title="Verify the model is available">
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
      agents: { defaults: { model: { primary: "minimax/MiniMax-M3" } } },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M3",
                name: "MiniMax M3",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.12, cacheWrite: 0 },
                contextWindow: 1000000,
                maxTokens: 131072,
              },
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
    На Anthropic-сумісному потоковому шляху OpenClaw за замовчуванням вимикає thinking для MiniMax M2.x, якщо ви явно не задасте `thinking` самостійно. Потокова кінцева точка M2.x надсилає `reasoning_content` у delta-фрагментах у стилі OpenAI замість нативних блоків thinking Anthropic, що може вивести внутрішні міркування у видимий результат, якщо лишити це неявно ввімкненим. MiniMax-M3 (і M3.x із прямою сумісністю) звільнено від цього стандартного правила: M3 надсилає правильні блоки thinking Anthropic і потребує активного thinking для створення видимого вмісту, тому OpenClaw залишає M3 на пропущеному/адаптивному шляху thinking провайдера.
    </Warning>

    <Note>
    Налаштування з API-ключем використовують ID провайдера `minimax`. Посилання на моделі мають форму `minimax/MiniMax-M3`.
    </Note>

  </Tab>
</Tabs>

## Налаштування через `openclaw configure`

Скористайтеся інтерактивним майстром конфігурації, щоб налаштувати MiniMax без редагування JSON:

<Steps>
  <Step title="Launch the wizard">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Select Model/auth">
    Виберіть **Model/auth** у меню.
  </Step>
  <Step title="Choose a MiniMax auth option">
    Виберіть один із доступних варіантів MiniMax:

    | Варіант автентифікації | Опис |
    | --- | --- |
    | `minimax-global-oauth` | Міжнародний OAuth (Coding Plan) |
    | `minimax-cn-oauth` | OAuth для Китаю (Coding Plan) |
    | `minimax-global-api` | Міжнародний API-ключ |
    | `minimax-cn-api` | API-ключ для Китаю |

  </Step>
  <Step title="Pick your default model">
    Виберіть стандартну модель, коли з’явиться запит.
  </Step>
</Steps>

## Можливості

### Генерація зображень

Plugin MiniMax реєструє модель `image-01` для інструмента `image_generate`. Вона підтримує:

- **Генерацію зображень із тексту** з керуванням співвідношенням сторін
- **Редагування зображення за зображенням** (референс суб’єкта) з керуванням співвідношенням сторін
- До **9 вихідних зображень** на запит
- До **1 референсного зображення** на запит редагування
- Підтримувані співвідношення сторін: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

Щоб використовувати MiniMax для генерації зображень, установіть його як провайдера генерації зображень:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

Plugin використовує той самий `MINIMAX_API_KEY` або автентифікацію OAuth, що й текстові моделі. Додаткова конфігурація не потрібна, якщо MiniMax уже налаштовано.

І `minimax`, і `minimax-portal` реєструють `image_generate` з тією самою
моделлю `image-01`. Налаштування з API-ключем використовують `MINIMAX_API_KEY`; налаштування OAuth можуть натомість використовувати
вбудований шлях автентифікації `minimax-portal`.

Генерація зображень завжди використовує спеціальну кінцеву точку MiniMax для зображень
(`/v1/image_generation`) та ігнорує `models.providers.minimax.baseUrl`,
оскільки це поле налаштовує базову URL-адресу для чату/Anthropic-сумісного API. Установіть
`MINIMAX_API_HOST=https://api.minimaxi.com`, щоб спрямовувати генерацію зображень
через китайську кінцеву точку; стандартна глобальна кінцева точка:
`https://api.minimax.io`.

Коли онбординг або налаштування API-ключа записує явні записи `models.providers.minimax`,
OpenClaw матеріалізує `MiniMax-M3`, `MiniMax-M2.7` і
`MiniMax-M2.7-highspeed` як чат-моделі. M3 заявляє підтримку текстового та зображувального вводу;
розуміння зображень залишається окремо доступним через медіапровайдера
`MiniMax-VL-01`, який належить Plugin.

<Note>
Див. [Генерація зображень](/uk/tools/image-generation), щоб дізнатися про спільні параметри інструмента, вибір провайдера та поведінку failover.
</Note>

### Перетворення тексту на мовлення

Вбудований Plugin `minimax` реєструє MiniMax T2A v2 як провайдера мовлення для
`messages.tts`.

- Стандартна TTS-модель: `speech-2.8-hd`
- Стандартний голос: `English_expressive_narrator`
- Підтримувані вбудовані ID моделей включають `speech-2.8-hd`, `speech-2.8-turbo`,
  `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`,
  `speech-02-turbo`, `speech-01-hd` і `speech-01-turbo`.
- Порядок визначення автентифікації: `messages.tts.providers.minimax.apiKey`, потім
  профілі автентифікації OAuth/токена `minimax-portal`, потім ключі середовища Token Plan
  (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
  `MINIMAX_CODING_API_KEY`), потім `MINIMAX_API_KEY`.
- Якщо хост TTS не налаштовано, OpenClaw повторно використовує налаштований
  OAuth-хост `minimax-portal` і прибирає суфікси Anthropic-сумісного шляху,
  такі як `/anthropic`.
- Звичайні аудіовкладення залишаються MP3.
- Цілі голосових нотаток, як-от Feishu і Telegram, транскодуються з MiniMax
  MP3 у 48 кГц Opus за допомогою `ffmpeg`, оскільки файловий API Feishu/Lark приймає лише
  `file_type: "opus"` для нативних аудіоповідомлень.
- MiniMax T2A приймає дробові `speed` і `vol`, але `pitch` надсилається як
  ціле число; OpenClaw відсікає дробову частину значень `pitch` перед API-запитом.

| Налаштування                                    | Змінна середовища      | Стандартне значення          | Опис                             |
| ----------------------------------------------- | ---------------------- | ----------------------------- | -------------------------------- |
| `messages.tts.providers.minimax.baseUrl`        | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | Хост API MiniMax T2A.            |
| `messages.tts.providers.minimax.model`          | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | ID TTS-моделі.                   |
| `messages.tts.providers.minimax.speakerVoiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | ID голосу для мовленнєвого виводу. |
| `messages.tts.providers.minimax.speed`          |                        | `1.0`                         | Швидкість відтворення, `0.5..2.0`. |
| `messages.tts.providers.minimax.vol`            |                        | `1.0`                         | Гучність, `(0, 10]`.             |
| `messages.tts.providers.minimax.pitch`          |                        | `0`                           | Цілочисельний зсув висоти тону, `-12..12`. |

### Генерація музики

Вбудований Plugin MiniMax реєструє генерацію музики через спільний
інструмент `music_generate` як для `minimax`, так і для `minimax-portal`.

- Типова музична модель: `minimax/music-2.6`
- Музична модель OAuth: `minimax-portal/music-2.6`
- Також підтримує `minimax/music-2.5` і `minimax/music-2.0`
- Елементи керування промптом: `lyrics`, `instrumental`
- Формат виводу: `mp3`
- Запуски з підтримкою сеансу від'єднуються через спільний потік завдань/статусу, зокрема `action: "status"`

Щоб використовувати MiniMax як типового постачальника музики:

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
Див. [Генерація музики](/uk/tools/music-generation), щоб дізнатися про спільні параметри інструмента, вибір постачальника та поведінку failover.
</Note>

### Генерація відео

Вбудований plugin MiniMax реєструє генерацію відео через спільний інструмент
`video_generate` для `minimax` і `minimax-portal`.

- Типова відеомодель: `minimax/MiniMax-Hailuo-2.3`
- Відеомодель OAuth: `minimax-portal/MiniMax-Hailuo-2.3`
- Режими: перетворення тексту на відео та потоки з посиланням на одне зображення
- Підтримує `aspectRatio` і `resolution`

Щоб використовувати MiniMax як типового постачальника відео:

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
Див. [Генерація відео](/uk/tools/video-generation), щоб дізнатися про спільні параметри інструмента, вибір постачальника та поведінку failover.
</Note>

### Розуміння зображень

Plugin MiniMax реєструє розуміння зображень окремо від текстового
каталогу:

| ID постачальника | Типова модель зображень |
| ---------------- | ----------------------- |
| `minimax`        | `MiniMax-VL-01`         |
| `minimax-portal` | `MiniMax-VL-01`         |

Саме тому автоматична маршрутизація медіа може використовувати розуміння
зображень MiniMax, навіть коли вбудований каталог текстових постачальників
також містить chat refs M3 із підтримкою зображень.

### Вебпошук

Plugin MiniMax також реєструє `web_search` через search API MiniMax Token Plan.

- ID постачальника: `minimax`
- Структуровані результати: заголовки, URL-адреси, фрагменти, пов'язані запити
- Рекомендована змінна середовища: `MINIMAX_CODE_PLAN_KEY`
- Прийняті псевдоніми середовища: `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN`
- Резервна сумісність: `MINIMAX_API_KEY`, коли вона вже вказує на облікові дані token-plan
- Повторне використання регіону: `plugins.entries.minimax.config.webSearch.region`, потім `MINIMAX_API_HOST`, потім базові URL-адреси постачальника MiniMax
- Пошук залишається на ID постачальника `minimax`; налаштування OAuth CN/global може непрямо спрямовувати регіон через `models.providers.minimax-portal.baseUrl` і надавати bearer auth через `MINIMAX_OAUTH_TOKEN`

Конфігурація міститься в `plugins.entries.minimax.config.webSearch.*`.

<Note>
Див. [Пошук MiniMax](/uk/tools/minimax-search), щоб дізнатися про повну конфігурацію та використання вебпошуку.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Параметри конфігурації">
    | Параметр | Опис |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Надавайте перевагу `https://api.minimax.io/anthropic` (сумісний з Anthropic); `https://api.minimax.io/v1` є необов'язковим для payload, сумісних з OpenAI |
    | `models.providers.minimax.api` | Надавайте перевагу `anthropic-messages`; `openai-completions` є необов'язковим для payload, сумісних з OpenAI |
    | `models.providers.minimax.apiKey` | API-ключ MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Визначте `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Призначте псевдоніми моделям, які хочете додати до allowlist |
    | `models.mode` | Залиште `merge`, якщо хочете додати MiniMax поряд із вбудованими моделями |
  </Accordion>

  <Accordion title="Типові налаштування Thinking">
    Для `api: "anthropic-messages"` OpenClaw вставляє `thinking: { type: "disabled" }` для моделей MiniMax M2.x, якщо thinking ще не задано явно в параметрах/конфігурації.

    Це не дає потоковому endpoint M2.x видавати `reasoning_content` у delta chunks стилю OpenAI, що призвело б до витоку внутрішнього reasoning у видимий вивід.

    MiniMax-M3 (і M3.x) виняток: M3 видає правильні thinking blocks Anthropic і повертає порожній масив `content` із `stop_reason: "end_turn"`, коли thinking вимкнено, тому wrapper залишає M3 на пропущеному/адаптивному шляху thinking постачальника.

  </Accordion>

  <Accordion title="Швидкий режим">
    `/fast on` або `params.fastMode: true` переписує `MiniMax-M2.7` на `MiniMax-M2.7-highspeed` на потоковому шляху, сумісному з Anthropic.
  </Accordion>

  <Accordion title="Приклад резервного переходу">
    **Найкраще для:** залишити найсильнішу модель останнього покоління як основну й переходити на MiniMax M2.7 у разі збою. У прикладі нижче Opus використано як конкретну основну модель; замініть її на бажану основну модель останнього покоління.

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

  <Accordion title="Подробиці використання Coding Plan">
    - API використання Coding Plan: `https://api.minimaxi.com/v1/token_plan/remains` або `https://api.minimax.io/v1/token_plan/remains` (потрібен ключ coding plan).
    - Опитування використання виводить host із `models.providers.minimax-portal.baseUrl` або `models.providers.minimax.baseUrl`, якщо їх налаштовано, тому глобальні налаштування з `https://api.minimax.io/anthropic` опитують `api.minimax.io`. Відсутні або неправильно сформовані базові URL-адреси зберігають резерв CN для сумісності.
    - OpenClaw нормалізує використання coding-plan MiniMax до того самого відображення `% left`, яке використовують інші постачальники. Сирі поля MiniMax `usage_percent` / `usagePercent` означають залишок квоти, а не спожиту квоту, тому OpenClaw інвертує їх. Поля на основі лічильників мають пріоритет, коли вони наявні.
    - Коли API повертає `model_remains`, OpenClaw надає перевагу запису chat-model, за потреби виводить мітку вікна з `start_time` / `end_time` і додає назву вибраної моделі до мітки плану, щоб вікна coding-plan було легше розрізняти.
    - Знімки використання трактують `minimax`, `minimax-cn` і `minimax-portal` як одну поверхню квоти MiniMax і надають перевагу збереженому OAuth MiniMax перед резервним переходом до змінних середовища ключа Coding Plan.

  </Accordion>
</AccordionGroup>

## Примітки

- Model refs відповідають шляху автентифікації:
  - Налаштування API-ключа: `minimax/<model>`
  - Налаштування OAuth: `minimax-portal/<model>`
- Типова чат-модель: `MiniMax-M3`
- Альтернативні чат-моделі: `MiniMax-M2.7`, `MiniMax-M2.7-highspeed`
- Onboarding і пряме налаштування API-ключа записують визначення моделей для M3 та обох варіантів M2.7
- Розуміння зображень використовує медіапостачальника `MiniMax-VL-01`, яким володіє plugin
- Оновіть значення цін у `models.json`, якщо вам потрібне точне відстеження витрат
- Використовуйте `openclaw models list`, щоб підтвердити поточний ID постачальника, а потім перемкніться за допомогою `openclaw models set minimax/MiniMax-M3` або `openclaw models set minimax-portal/MiniMax-M3`

<Tip>
Реферальне посилання для MiniMax Coding Plan (знижка 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Див. [Постачальники моделей](/uk/concepts/model-providers), щоб дізнатися про правила постачальників.
</Note>

## Усунення несправностей

<AccordionGroup>
  <Accordion title='"Невідома модель: minimax/MiniMax-M3"'>
    Зазвичай це означає, що **постачальника MiniMax не налаштовано** (немає відповідного запису постачальника й не знайдено профілю автентифікації MiniMax або ключа середовища). Виправлення для цього виявлення є у **2026.1.12**. Щоб виправити:

    - Оновіться до **2026.1.12** (або запустіть із вихідного коду `main`), потім перезапустіть gateway.
    - Запустіть `openclaw configure` і виберіть параметр автентифікації **MiniMax**, або
    - Додайте відповідний блок `models.providers.minimax` чи `models.providers.minimax-portal` вручну, або
    - Задайте `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` або профіль автентифікації MiniMax, щоб можна було вставити відповідного постачальника.

    Переконайтеся, що ID моделі **чутливий до регістру**:

    - Шлях API-ключа: `minimax/MiniMax-M3`, `minimax/MiniMax-M2.7` або `minimax/MiniMax-M2.7-highspeed`
    - Шлях OAuth: `minimax-portal/MiniMax-M3`, `minimax-portal/MiniMax-M2.7` або `minimax-portal/MiniMax-M2.7-highspeed`

    Потім перевірте ще раз за допомогою:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Додаткова допомога: [Усунення несправностей](/uk/help/troubleshooting) і [FAQ](/uk/help/faq).
</Note>

## Пов'язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір постачальників, model refs і поведінка failover.
  </Card>
  <Card title="Генерація зображень" href="/uk/tools/image-generation" icon="image">
    Спільні параметри інструмента зображень і вибір постачальника.
  </Card>
  <Card title="Генерація музики" href="/uk/tools/music-generation" icon="music">
    Спільні параметри інструмента музики та вибір постачальника.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента відео та вибір постачальника.
  </Card>
  <Card title="Пошук MiniMax" href="/uk/tools/minimax-search" icon="magnifying-glass">
    Конфігурація вебпошуку через MiniMax Token Plan.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Загальне усунення несправностей і FAQ.
  </Card>
</CardGroup>
