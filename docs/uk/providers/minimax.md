---
read_when:
    - Ви хочете використовувати моделі MiniMax в OpenClaw
    - Вам потрібні вказівки з налаштування MiniMax
summary: Використання моделей MiniMax в OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-07-12T13:42:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1172d2d2c92dc92858f15564eee9ffeb8eb9599ee70157116fd2e302556dd75a
    source_path: providers/minimax.md
    workflow: 16
---

  Вбудований Plugin `minimax` реєструє двох постачальників і сім можливостей: чат, генерування зображень, генерування музики, генерування відео, розуміння зображень, мовлення (T2A v2) і вебпошук.

  | Ідентифікатор постачальника | Автентифікація | Можливості                                                                                              |
  | --------------------------- | --------------- | -------------------------------------------------------------------------------------------------------- |
  | `minimax`                   | Ключ API        | Текст, генерування зображень, генерування музики, генерування відео, розуміння зображень, мовлення, вебпошук |
  | `minimax-portal`            | OAuth           | Текст, генерування зображень, генерування музики, генерування відео, розуміння зображень, мовлення           |

  <Tip>
  Реферальне посилання на MiniMax Coding Plan (знижка 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
  </Tip>

  ## Вбудований каталог

  | Модель                   | Тип                    | Опис                                             |
  | ------------------------ | ---------------------- | ----------------------------------------------- |
  | `MiniMax-M3`             | Чат (міркування)       | Стандартна розміщена модель міркування          |
  | `MiniMax-M2.7`           | Чат (міркування)       | Попередня розміщена модель міркування           |
  | `MiniMax-M2.7-highspeed` | Чат (міркування)       | Швидший рівень міркування M2.7                  |
  | `MiniMax-VL-01`          | Комп’ютерний зір       | Модель розуміння зображень                      |
  | `image-01`               | Генерування зображень  | Створення зображень із тексту та редагування зображення за зображенням |
  | `music-2.6`              | Генерування музики     | Стандартна музична модель                       |
  | `MiniMax-Hailuo-2.3`     | Генерування відео      | Перетворення тексту на відео та зображення на відео |

  Посилання на моделі відповідають способу автентифікації: `minimax/<model>` для конфігурацій із ключем API, `minimax-portal/<model>` для конфігурацій OAuth.

  ## Початок роботи

  <Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Найкраще підходить для:** швидкого налаштування MiniMax Coding Plan через OAuth без ключа API.

    <Tabs>
      <Tab title="Міжнародна версія">
        <Steps>
          <Step title="Запустіть початкове налаштування">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            Отримана базова URL-адреса постачальника: `api.minimax.io`.
          </Step>
          <Step title="Перевірте доступність моделі">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="Китай">
        <Steps>
          <Step title="Запустіть початкове налаштування">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            Отримана базова URL-адреса постачальника: `api.minimaxi.com`.
          </Step>
          <Step title="Перевірте доступність моделі">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    Конфігурації OAuth використовують ідентифікатор постачальника `minimax-portal`. Посилання на моделі мають формат `minimax-portal/MiniMax-M3`.
    </Note>

  </Tab>

  <Tab title="Ключ API">
    **Найкраще підходить для:** розміщеного MiniMax з API, сумісним з Anthropic.

    <Tabs>
      <Tab title="Міжнародна версія">
        <Steps>
          <Step title="Запустіть початкове налаштування">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            Ця команда налаштовує `api.minimax.io` як базову URL-адресу.
          </Step>
          <Step title="Перевірте доступність моделі">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="Китай">
        <Steps>
          <Step title="Запустіть початкове налаштування">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            Ця команда налаштовує `api.minimaxi.com` як базову URL-адресу.
          </Step>
          <Step title="Перевірте доступність моделі">
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
    Сумісна з Anthropic кінцева точка потокового передавання MiniMax-M2.x надсилає `reasoning_content` у фрагментах змін у стилі OpenAI замість нативних блоків міркування Anthropic, через що внутрішні міркування потрапляють у видимий результат, якщо міркування неявно залишено ввімкненим. OpenClaw за замовчуванням вимикає міркування M2.x, якщо ви явно не задасте `thinking` самостійно. MiniMax-M3 (і сумісні з майбутніми версіями M3.x) є винятком: M3 надсилає належні блоки міркування Anthropic і потребує активного режиму міркування для створення видимого вмісту, тому OpenClaw залишає M3 на шляху адаптивного міркування постачальника. Дивіться розділ про стандартні налаштування міркування в підрозділі «Розширена конфігурація» нижче.
    </Warning>

    <Note>
    Конфігурації з ключем API використовують ідентифікатор постачальника `minimax`. Посилання на моделі мають формат `minimax/MiniMax-M3`.
    </Note>

  </Tab>
</Tabs>

## Налаштування через `openclaw configure`

<Steps>
  <Step title="Запустіть майстер">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Виберіть модель/автентифікацію">
    Виберіть **Модель/автентифікація** в меню.
  </Step>
  <Step title="Виберіть варіант автентифікації MiniMax">
    | Варіант автентифікації | Опис                                  |
    | ----------------------- | ------------------------------------- |
    | `minimax-global-oauth` | Міжнародний OAuth (план для розробки) |
    | `minimax-cn-oauth`     | Китайський OAuth (план для розробки)  |
    | `minimax-global-api`   | Міжнародний ключ API                  |
    | `minimax-cn-api`       | Китайський ключ API                   |
  </Step>
  <Step title="Виберіть модель за замовчуванням">
    Коли з’явиться запит, виберіть модель за замовчуванням.
  </Step>
</Steps>

## Можливості

### Генерування зображень

Plugin MiniMax реєструє модель `image-01` для інструмента `image_generate` у `minimax` і `minimax-portal`, повторно використовуючи той самий `MINIMAX_API_KEY` або автентифікацію OAuth, що й текстові моделі.

- Генерування зображень із тексту та редагування зображення на основі зображення (еталон об’єкта), обидва з керуванням співвідношенням сторін
- До 9 вихідних зображень на запит і 1 еталонне зображення на кожен запит редагування
- Підтримувані співвідношення сторін: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

Для генерування зображень завжди використовується спеціальна кінцева точка MiniMax для зображень (`/v1/image_generation`), а `models.providers.minimax.baseUrl` ігнорується, оскільки це поле натомість налаштовує базову URL-адресу для чату, сумісну з Anthropic. Установіть `MINIMAX_API_HOST=https://api.minimaxi.com`, щоб спрямувати генерування зображень через китайську кінцеву точку; глобальна кінцева точка за замовчуванням — `https://api.minimax.io`.

<Note>
Відомості про спільні параметри інструмента, вибір постачальника та поведінку резервного перемикання див. у розділі [Генерування зображень](/uk/tools/image-generation).
</Note>

### Перетворення тексту на мовлення

Вбудований Plugin `minimax` реєструє MiniMax T2A v2 як постачальника синтезу мовлення для `messages.tts`.

- Модель TTS за замовчуванням: `speech-2.8-hd`
- Голос за замовчуванням: `English_expressive_narrator`
- Ідентифікатори вбудованих моделей: `speech-2.8-hd`, `speech-2.8-turbo`, `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`, `speech-02-turbo`, `speech-01-hd`, `speech-01-turbo`, `speech-01-240228`
- Порядок визначення даних автентифікації: `messages.tts.providers.minimax.apiKey`, потім профілі автентифікації OAuth/токеном `minimax-portal`, потім ключі середовища Token Plan (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`), а потім `MINIMAX_API_KEY`
- Якщо хост TTS не налаштовано, OpenClaw повторно використовує налаштований хост OAuth `minimax-portal` і вилучає суфікси шляху, сумісні з Anthropic, як-от `/anthropic`
- Звичайні аудіовкладення залишаються у форматі MP3. Вкладення для голосових повідомлень (Feishu, Telegram та інші канали, які запитують вкладення, сумісне з голосовими повідомленнями) перекодовуються з MiniMax MP3 в Opus із частотою 48 кГц за допомогою `ffmpeg`, оскільки, наприклад, файловий API Feishu/Lark приймає для нативних аудіоповідомлень лише `file_type: "opus"`
- MiniMax T2A приймає дробові значення `speed` і `vol`, але `pitch` надсилається як ціле число; OpenClaw відкидає дробову частину значень `pitch` перед запитом API

| Налаштування                              | Змінна середовища       | Значення за замовчуванням     | Опис                                            |
| ----------------------------------------- | ----------------------- | ----------------------------- | ----------------------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | Хост API MiniMax T2A.                           |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | Ідентифікатор моделі TTS.                       |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | Ідентифікатор голосу для синтезованого мовлення. |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                         | Швидкість відтворення, `0.5..2.0`.              |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                         | Гучність, `(0, 10]`.                            |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                           | Цілочисельний зсув висоти тону, `-12..12`.      |

### Генерування музики

Вбудований Plugin MiniMax реєструє генерування музики через спільний інструмент `music_generate` для `minimax` і `minimax-portal`.

- Модель для генерування музики за замовчуванням: `minimax/music-2.6` (OAuth: `minimax-portal/music-2.6`)
- Також підтримує `music-2.6-free`, `music-cover` і `music-cover-free`
- Параметри керування запитом: `lyrics`, `instrumental`
- Формат виведення: `mp3`
- Запуски, пов’язані із сеансом, відокремлюються через спільний процес завдання/стану, зокрема `action: "status"`

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: { primary: "minimax/music-2.6" },
    },
  },
}
```

<Note>
Відомості про спільні параметри інструмента, вибір постачальника та поведінку резервного перемикання див. у розділі [Генерування музики](/uk/tools/music-generation).
</Note>

### Генерування відео

Вбудований Plugin MiniMax реєструє генерування відео через спільний інструмент `video_generate` для `minimax` і `minimax-portal`.

- Модель для генерування відео за замовчуванням: `minimax/MiniMax-Hailuo-2.3` (OAuth: `minimax-portal/MiniMax-Hailuo-2.3`)
- Також підтримує `MiniMax-Hailuo-2.3-Fast`, `MiniMax-Hailuo-02`, `I2V-01-Director`, `I2V-01-live` та `I2V-01`
- Режими: перетворення тексту на відео та процеси з одним еталонним зображенням
- Підтримує `resolution` (`768P` або `1080P` у моделях Hailuo 2.3/02); `aspectRatio` не підтримується та ігнорується

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "minimax/MiniMax-Hailuo-2.3" },
    },
  },
}
```

<Note>
Див. [Генерування відео](/uk/tools/video-generation), щоб дізнатися про спільні параметри інструмента, вибір постачальника та поведінку резервного перемикання.
</Note>

### Розпізнавання зображень

Plugin MiniMax реєструє розпізнавання зображень окремо від каталогу текстових моделей:

| Ідентифікатор постачальника | Модель зображень за замовчуванням | Видобування тексту з PDF |
| ---------------- | ------------------- | ------------------- |
| `minimax`        | `MiniMax-VL-01`     | `MiniMax-M2.7`      |
| `minimax-portal` | `MiniMax-VL-01`     | `MiniMax-M2.7`      |

Саме тому автоматична маршрутизація медіафайлів може використовувати розпізнавання зображень MiniMax, навіть коли вбудований каталог постачальника текстових моделей також містить посилання на чат-моделі M3 із підтримкою зображень. Для розпізнавання PDF модель `MiniMax-M2.7` використовується лише для видобування тексту; MiniMax не реєструє шлях перетворення PDF на зображення.

### Вебпошук

Plugin MiniMax також реєструє `web_search` через API пошуку MiniMax Token Plan (`/v1/coding_plan/search`).

- Ідентифікатор постачальника: `minimax`
- Структуровані результати: заголовки, URL-адреси, уривки, пов’язані запити
- Бажана змінна середовища: `MINIMAX_CODE_PLAN_KEY`
- Допустимі псевдоніми змінних середовища: `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN`
- Резервний варіант для сумісності: `MINIMAX_API_KEY`, якщо вона вже вказує на облікові дані плану токенів
- Повторне використання регіону: `plugins.entries.minimax.config.webSearch.region`, потім `MINIMAX_API_HOST`, потім базові URL-адреси постачальника MiniMax
- Пошук залишається на ідентифікаторі постачальника `minimax`; налаштування OAuth для Китаю або глобального регіону може опосередковано спрямовувати вибір регіону через `models.providers.minimax-portal.baseUrl` і надавати автентифікацію за токеном через `MINIMAX_OAUTH_TOKEN`

Конфігурація розміщується в `plugins.entries.minimax.config.webSearch.*`.

<Note>
Повну конфігурацію та використання вебпошуку див. у розділі [Пошук MiniMax](/uk/tools/minimax-search).
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Параметри конфігурації">
    | Параметр | Опис |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Бажано використовувати `https://api.minimax.io/anthropic` (сумісний з Anthropic); `https://api.minimax.io/v1` можна використовувати для корисних навантажень, сумісних з OpenAI |
    | `models.providers.minimax.api` | Бажано використовувати `anthropic-messages`; `openai-completions` можна використовувати для корисних навантажень, сумісних з OpenAI |
    | `models.providers.minimax.apiKey` | Ключ API MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Визначення `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Псевдоніми моделей, які потрібно додати до списку дозволених |
    | `models.mode` | Залиште `merge`, якщо хочете додати MiniMax поряд із вбудованими моделями |
  </Accordion>

  <Accordion title="Стандартні налаштування міркування">
    За `api: "anthropic-messages"` OpenClaw додає `thinking: { type: "disabled" }` для моделей MiniMax M2.x, якщо попередня обгортка ще не встановила поле `thinking` у корисному навантаженні. Це запобігає надсиланню кінцевою точкою потокового передавання M2.x поля `reasoning_content` у фрагментах змін у стилі OpenAI, що могло б розкрити внутрішні міркування у видимому виведенні.

    MiniMax-M3 (і M3.x) є винятком: коли міркування вимкнено, M3 повертає порожній масив `content` із `stop_reason: "end_turn"`, тому OpenClaw прибирає неявне стандартне вимкнення для M3, а коли задано рівень міркування, натомість примусово встановлює `thinking: { type: "adaptive" }`.

    Доступні рівні міркування для кожного сімейства моделей:

    | Сімейство моделей | Рівні                                    | За замовчуванням |
    | -------------- | ----------------------------------------- | ---------- |
    | `MiniMax-M3`   | `off`, `adaptive`                        | `adaptive` |
    | `MiniMax-M2.x` | `off`, `minimal`, `low`, `medium`, `high` | `off`      |

  </Accordion>

  <Accordion title="Швидкий режим">
    `/fast on` або `params.fastMode: true` замінює `MiniMax-M2.7` на `MiniMax-M2.7-highspeed` у потоковому шляху, сумісному з Anthropic (`api: "anthropic-messages"`, постачальник `minimax` або `minimax-portal`).
  </Accordion>

  <Accordion title="Приклад резервного перемикання">
    **Найкраще підходить для:** використання найпотужнішої моделі останнього покоління як основної з резервним перемиканням на MiniMax M2.7. У наведеному нижче прикладі Opus використовується як конкретна основна модель; замініть її на бажану основну модель останнього покоління.

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
    - API використання Coding Plan: `https://api.minimaxi.com/v1/token_plan/remains` або `https://api.minimax.io/v1/token_plan/remains` (потрібен ключ плану програмування).
    - Коли налаштовано `models.providers.minimax-portal.baseUrl` або `models.providers.minimax.baseUrl`, опитування використання визначає хост із цього значення, тому глобальні конфігурації з `https://api.minimax.io/anthropic` опитують `api.minimax.io`. За відсутності або неправильного формату базових URL-адрес для сумісності зберігається резервний варіант для Китаю.
    - OpenClaw нормалізує використання плану програмування MiniMax до того самого відображення `% left`, яке застосовується для інших постачальників. Необроблені поля MiniMax `usage_percent` / `usagePercent` означають залишок квоти, а не використану квоту, тому OpenClaw інвертує їх. Поля на основі кількості мають пріоритет, якщо вони наявні.
    - Коли API повертає `model_remains`, OpenClaw надає перевагу запису чат-моделі, за потреби визначає мітку вікна з `start_time` / `end_time` і додає назву вибраної моделі до мітки плану, щоб вікна плану програмування було легше розрізняти.
    - Знімки використання вважають `minimax`, `minimax-cn`, `minimax-portal` і `minimax-portal-cn` тією самою поверхнею квоти MiniMax та надають перевагу збереженому OAuth MiniMax, перш ніж переходити до змінних середовища з ключами Coding Plan.

  </Accordion>
</AccordionGroup>

## Примітки

- Чат-модель за замовчуванням: `MiniMax-M3`. Альтернативні чат-моделі: `MiniMax-M2.7`, `MiniMax-M2.7-highspeed`
- Початкове налаштування та безпосереднє налаштування ключа API записують визначення моделей для M3 й обох варіантів M2.7
- Розпізнавання зображень використовує медіапостачальника `MiniMax-VL-01`, що належить Plugin
- Оновіть значення цін у `models.json`, якщо потрібне точне відстеження витрат
- Скористайтеся `openclaw models list`, щоб підтвердити поточний ідентифікатор постачальника, а потім перемкніться за допомогою `openclaw models set minimax/MiniMax-M3` або `openclaw models set minimax-portal/MiniMax-M3`

<Note>
Правила постачальників див. у розділі [Постачальники моделей](/uk/concepts/model-providers).
</Note>

## Усунення несправностей

<AccordionGroup>
  <Accordion title='"Невідома модель: minimax/MiniMax-M3"'>
    Зазвичай це означає, що **постачальника MiniMax не налаштовано** (немає відповідного запису постачальника й не знайдено профілю автентифікації або ключа середовища MiniMax). Щоб виправити це:

    - Запустіть `openclaw configure` і виберіть варіант автентифікації **MiniMax**, або
    - Додайте відповідний блок `models.providers.minimax` чи `models.providers.minimax-portal` вручну, або
    - Установіть `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` або профіль автентифікації MiniMax, щоб можна було додати відповідного постачальника.

    Переконайтеся, що ідентифікатор моделі **враховує регістр**:

    - Шлях із ключем API: `minimax/MiniMax-M3`, `minimax/MiniMax-M2.7` або `minimax/MiniMax-M2.7-highspeed`
    - Шлях OAuth: `minimax-portal/MiniMax-M3`, `minimax-portal/MiniMax-M2.7` або `minimax-portal/MiniMax-M2.7-highspeed`

    Потім перевірте ще раз:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Додаткова допомога: [Усунення несправностей](/uk/help/troubleshooting) і [Поширені запитання](/uk/help/faq).
</Note>

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір постачальників, посилань на моделі та поведінки резервного перемикання.
  </Card>
  <Card title="Генерування зображень" href="/uk/tools/image-generation" icon="image">
    Спільні параметри інструмента зображень і вибір постачальника.
  </Card>
  <Card title="Генерування музики" href="/uk/tools/music-generation" icon="music">
    Спільні параметри інструмента музики та вибір постачальника.
  </Card>
  <Card title="Генерування відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента відео та вибір постачальника.
  </Card>
  <Card title="Пошук MiniMax" href="/uk/tools/minimax-search" icon="magnifying-glass">
    Конфігурація вебпошуку через MiniMax Token Plan.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Загальне усунення несправностей і поширені запитання.
  </Card>
</CardGroup>
