---
read_when:
    - Вам потрібні моделі MiniMax в OpenClaw
    - Вам потрібні вказівки з налаштування MiniMax
summary: Використання моделей MiniMax в OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-05-02T04:53:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7c7aea4d9656d6ffddab7c43b06940e58bdd119a03b62000e689a3348f7df5a2
    source_path: providers/minimax.md
    workflow: 16
---

OpenClaw's MiniMax provider defaults to **MiniMax M2.7**.

MiniMax also provides:

- Bundled speech synthesis via T2A v2
- Bundled image understanding via `MiniMax-VL-01`
- Bundled music generation via `music-2.6`
- Bundled `web_search` through the MiniMax Token Plan search API

Provider split:

| Provider ID      | Auth    | Capabilities                                                                                        |
| ---------------- | ------- | --------------------------------------------------------------------------------------------------- |
| `minimax`        | API key | Text, image generation, music generation, video generation, image understanding, speech, web search |
| `minimax-portal` | OAuth   | Text, image generation, music generation, video generation, image understanding, speech             |

## Built-in catalog

| Model                    | Type             | Description                              |
| ------------------------ | ---------------- | ---------------------------------------- |
| `MiniMax-M2.7`           | Chat (reasoning) | Default hosted reasoning model           |
| `MiniMax-M2.7-highspeed` | Chat (reasoning) | Faster M2.7 reasoning tier               |
| `MiniMax-VL-01`          | Vision           | Image understanding model                |
| `image-01`               | Image generation | Text-to-image and image-to-image editing |
| `music-2.6`              | Music generation | Default music model                      |
| `music-2.5`              | Music generation | Previous music generation tier           |
| `music-2.0`              | Music generation | Legacy music generation tier             |
| `MiniMax-Hailuo-2.3`     | Video generation | Text-to-video and image reference flows  |

## Getting started

Choose your preferred auth method and follow the setup steps.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Best for:** quick setup with MiniMax Coding Plan via OAuth, no API key required.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            This authenticates against `api.minimax.io`.
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

            This authenticates against `api.minimaxi.com`.
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
    OAuth setups use the `minimax-portal` provider id. Model refs follow the form `minimax-portal/MiniMax-M2.7`.
    </Note>

    <Tip>
    Referral link for MiniMax Coding Plan (10% off): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API key">
    **Best for:** hosted MiniMax with Anthropic-compatible API.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            This configures `api.minimax.io` as the base URL.
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

            This configures `api.minimaxi.com` as the base URL.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    ### Config example

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
    On the Anthropic-compatible streaming path, OpenClaw disables MiniMax thinking by default unless you explicitly set `thinking` yourself. MiniMax's streaming endpoint emits `reasoning_content` in OpenAI-style delta chunks instead of native Anthropic thinking blocks, which can leak internal reasoning into visible output if left enabled implicitly.
    </Warning>

    <Note>
    API-key setups use the `minimax` provider id. Model refs follow the form `minimax/MiniMax-M2.7`.
    </Note>

  </Tab>
</Tabs>

## Configure via `openclaw configure`

Use the interactive config wizard to set MiniMax without editing JSON:

<Steps>
  <Step title="Запустіть майстер">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Виберіть модель/автентифікацію">
    Виберіть **Model/auth** у меню.
  </Step>
  <Step title="Виберіть варіант автентифікації MiniMax">
    Виберіть один із доступних варіантів MiniMax:

    | Вибір автентифікації | Опис |
    | --- | --- |
    | `minimax-global-oauth` | Міжнародний OAuth (Coding Plan) |
    | `minimax-cn-oauth` | Китайський OAuth (Coding Plan) |
    | `minimax-global-api` | Міжнародний API-ключ |
    | `minimax-cn-api` | Китайський API-ключ |

  </Step>
  <Step title="Виберіть стандартну модель">
    Виберіть стандартну модель, коли з’явиться запит.
  </Step>
</Steps>

## Можливості

### Генерація зображень

Plugin MiniMax реєструє модель `image-01` для інструмента `image_generate`. Вона підтримує:

- **Генерацію зображень із тексту** з керуванням співвідношенням сторін
- **Редагування зображення за зображенням** (референс об’єкта) з керуванням співвідношенням сторін
- До **9 вихідних зображень** за запит
- До **1 референсного зображення** на запит редагування
- Підтримувані співвідношення сторін: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

Щоб використовувати MiniMax для генерації зображень, задайте його як провайдера генерації зображень:

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
моделлю `image-01`. Налаштування з API-ключем використовують `MINIMAX_API_KEY`; налаштування OAuth можуть використовувати
вбудований шлях автентифікації `minimax-portal`.

Генерація зображень завжди використовує спеціальний endpoint MiniMax для зображень
(`/v1/image_generation`) та ігнорує `models.providers.minimax.baseUrl`,
оскільки це поле налаштовує базову URL-адресу чату/Anthropic-сумісного API. Задайте
`MINIMAX_API_HOST=https://api.minimaxi.com`, щоб спрямовувати генерацію зображень
через CN endpoint; стандартний глобальний endpoint —
`https://api.minimax.io`.

Коли onboarding або налаштування API-ключа записує явні записи `models.providers.minimax`,
OpenClaw матеріалізує `MiniMax-M2.7` і
`MiniMax-M2.7-highspeed` як текстові моделі чату. Розуміння зображень
надається окремо через медіапровайдера `MiniMax-VL-01`, який належить Plugin.

<Note>
Див. [Генерація зображень](/uk/tools/image-generation) щодо спільних параметрів інструмента, вибору провайдера та поведінки failover.
</Note>

### Перетворення тексту на мовлення

Вбудований Plugin `minimax` реєструє MiniMax T2A v2 як провайдера мовлення для
`messages.tts`.

- Стандартна модель TTS: `speech-2.8-hd`
- Стандартний голос: `English_expressive_narrator`
- Підтримувані вбудовані ідентифікатори моделей включають `speech-2.8-hd`, `speech-2.8-turbo`,
  `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`,
  `speech-02-turbo`, `speech-01-hd` і `speech-01-turbo`.
- Розв’язання автентифікації відбувається в такому порядку: `messages.tts.providers.minimax.apiKey`, потім
  профілі OAuth/токен-автентифікації `minimax-portal`, потім ключі середовища
  Token Plan (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
  `MINIMAX_CODING_API_KEY`), потім `MINIMAX_API_KEY`.
- Якщо хост TTS не налаштовано, OpenClaw повторно використовує налаштований
  OAuth-хост `minimax-portal` і прибирає суфікси шляху, сумісні з Anthropic,
  як-от `/anthropic`.
- Звичайні аудіовкладення залишаються MP3.
- Цілі для голосових нотаток, як-от Feishu і Telegram, транскодуються з MiniMax
  MP3 у 48 кГц Opus за допомогою `ffmpeg`, оскільки API файлів Feishu/Lark приймає лише
  `file_type: "opus"` для нативних аудіоповідомлень.
- MiniMax T2A приймає дробові `speed` і `vol`, але `pitch` надсилається як
  ціле число; OpenClaw відкидає дробову частину значень `pitch` перед API-запитом.

| Налаштування                             | Змінна середовища      | Типове значення              | Опис                                      |
| ---------------------------------------- | ---------------------- | ----------------------------- | ----------------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | Хост API MiniMax T2A.                     |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | Ідентифікатор моделі TTS.                 |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | Ідентифікатор голосу для виводу мовлення. |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                         | Швидкість відтворення, `0.5..2.0`.        |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                         | Гучність, `(0, 10]`.                      |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                           | Цілочисельний зсув висоти тону, `-12..12`. |

### Генерація музики

Вбудований Plugin MiniMax реєструє генерацію музики через спільний
інструмент `music_generate` як для `minimax`, так і для `minimax-portal`.

- Стандартна модель музики: `minimax/music-2.6`
- Модель музики OAuth: `minimax-portal/music-2.6`
- Також підтримує `minimax/music-2.5` і `minimax/music-2.0`
- Елементи керування prompt: `lyrics`, `instrumental`, `durationSeconds`
- Формат виводу: `mp3`
- Запуски на основі сесій від’єднуються через спільний потік завдань/статусу, включно з `action: "status"`

Щоб використовувати MiniMax як стандартного провайдера музики:

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

Вбудований Plugin MiniMax реєструє генерацію відео через спільний
інструмент `video_generate` як для `minimax`, так і для `minimax-portal`.

- Стандартна модель відео: `minimax/MiniMax-Hailuo-2.3`
- Модель відео OAuth: `minimax-portal/MiniMax-Hailuo-2.3`
- Режими: перетворення тексту на відео та потоки з референсом одного зображення
- Підтримує `aspectRatio` і `resolution`

Щоб використовувати MiniMax як стандартного провайдера відео:

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
Див. [Генерація відео](/uk/tools/video-generation) щодо спільних параметрів інструмента, вибору постачальника та поведінки відмовостійкого перемикання.
</Note>

### Розуміння зображень

Plugin MiniMax реєструє розуміння зображень окремо від текстового
каталогу:

| ID постачальника | Типова модель зображень |
| ---------------- | ----------------------- |
| `minimax`        | `MiniMax-VL-01`         |
| `minimax-portal` | `MiniMax-VL-01`         |

Саме тому автоматична маршрутизація медіа може використовувати розуміння зображень MiniMax навіть
коли вбудований каталог текстових постачальників усе ще показує лише текстові посилання чату M2.7.

### Вебпошук

Plugin MiniMax також реєструє `web_search` через API пошуку MiniMax Token Plan.

- ID постачальника: `minimax`
- Структуровані результати: заголовки, URL-адреси, фрагменти, пов’язані запити
- Бажана змінна середовища: `MINIMAX_CODE_PLAN_KEY`
- Прийняті псевдоніми середовища: `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN`
- Резервна сумісність: `MINIMAX_API_KEY`, коли вона вже вказує на облікові дані token-plan
- Повторне використання регіону: `plugins.entries.minimax.config.webSearch.region`, потім `MINIMAX_API_HOST`, потім базові URL-адреси постачальника MiniMax
- Пошук лишається на ID постачальника `minimax`; налаштування OAuth CN/global може опосередковано спрямовувати регіон через `models.providers.minimax-portal.baseUrl` і може надавати bearer-автентифікацію через `MINIMAX_OAUTH_TOKEN`

Конфігурація розміщена в `plugins.entries.minimax.config.webSearch.*`.

<Note>
Див. [Пошук MiniMax](/uk/tools/minimax-search) щодо повної конфігурації та використання вебпошуку.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Параметри конфігурації">
    | Параметр | Опис |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Надавайте перевагу `https://api.minimax.io/anthropic` (сумісний з Anthropic); `https://api.minimax.io/v1` є необов’язковим для payload, сумісних з OpenAI |
    | `models.providers.minimax.api` | Надавайте перевагу `anthropic-messages`; `openai-completions` є необов’язковим для payload, сумісних з OpenAI |
    | `models.providers.minimax.apiKey` | API-ключ MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Визначте `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Додайте псевдоніми для моделей, які хочете мати в allowlist |
    | `models.mode` | Залиште `merge`, якщо хочете додати MiniMax поруч із вбудованими моделями |
  </Accordion>

  <Accordion title="Типові налаштування мислення">
    Для `api: "anthropic-messages"` OpenClaw вставляє `thinking: { type: "disabled" }`, якщо мислення ще не задано явно в params/config.

    Це запобігає тому, щоб потоковий endpoint MiniMax видавав `reasoning_content` у delta-фрагментах у стилі OpenAI, що розкрило б внутрішнє міркування у видимому виводі.

  </Accordion>

  <Accordion title="Швидкий режим">
    `/fast on` або `params.fastMode: true` переписує `MiniMax-M2.7` на `MiniMax-M2.7-highspeed` у потоковому шляху, сумісному з Anthropic.
  </Accordion>

  <Accordion title="Приклад резервного перемикання">
    **Найкраще для:** тримайте свою найсильнішу модель останнього покоління як основну, а в разі збою перемикайтеся на MiniMax M2.7. Приклад нижче використовує Opus як конкретну основну модель; замініть її на свою бажану основну модель останнього покоління.

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
    - API використання Coding Plan: `https://api.minimaxi.com/v1/token_plan/remains` або `https://api.minimax.io/v1/token_plan/remains` (потребує ключа coding plan).
    - Опитування використання визначає хост із `models.providers.minimax-portal.baseUrl` або `models.providers.minimax.baseUrl`, коли це налаштовано, тому глобальні налаштування, що використовують `https://api.minimax.io/anthropic`, опитують `api.minimax.io`. Відсутні або неправильно сформовані базові URL-адреси зберігають резервний CN-вариант для сумісності.
    - OpenClaw нормалізує використання coding-plan MiniMax до того самого відображення `% left`, яке використовують інші постачальники. Сирі поля MiniMax `usage_percent` / `usagePercent` означають залишок квоти, а не спожиту квоту, тому OpenClaw інвертує їх. Поля на основі кількості мають пріоритет, коли вони наявні.
    - Коли API повертає `model_remains`, OpenClaw надає перевагу запису моделі чату, за потреби виводить мітку вікна з `start_time` / `end_time` і включає назву вибраної моделі в мітку плану, щоб вікна coding-plan було легше розрізняти.
    - Знімки використання трактують `minimax`, `minimax-cn` і `minimax-portal` як одну й ту саму поверхню квоти MiniMax і надають перевагу збереженому MiniMax OAuth перед резервним переходом до змінних середовища ключа Coding Plan.

  </Accordion>
</AccordionGroup>

## Примітки

- Посилання на моделі відповідають шляху автентифікації:
  - Налаштування з API-ключем: `minimax/<model>`
  - Налаштування OAuth: `minimax-portal/<model>`
- Типова модель чату: `MiniMax-M2.7`
- Альтернативна модель чату: `MiniMax-M2.7-highspeed`
- Онбординг і пряме налаштування API-ключа записують текстові визначення моделей для обох варіантів M2.7
- Розуміння зображень використовує медіапостачальника `MiniMax-VL-01`, який належить Plugin
- Оновіть значення цін у `models.json`, якщо вам потрібне точне відстеження вартості
- Використайте `openclaw models list`, щоб підтвердити поточний ID постачальника, потім перемкніться за допомогою `openclaw models set minimax/MiniMax-M2.7` або `openclaw models set minimax-portal/MiniMax-M2.7`

<Tip>
Реферальне посилання для MiniMax Coding Plan (знижка 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Див. [Постачальники моделей](/uk/concepts/model-providers) щодо правил постачальників.
</Note>

## Усунення несправностей

<AccordionGroup>
  <Accordion title='"Невідома модель: minimax/MiniMax-M2.7"'>
    Зазвичай це означає, що **постачальника MiniMax не налаштовано** (немає відповідного запису постачальника й не знайдено профілю автентифікації MiniMax або ключа середовища). Виправлення цього виявлення є у **2026.1.12**. Виправте так:

    - Оновіться до **2026.1.12** (або запустіть із вихідного коду `main`), потім перезапустіть Gateway.
    - Запустіть `openclaw configure` і виберіть варіант автентифікації **MiniMax**, або
    - Додайте відповідний блок `models.providers.minimax` або `models.providers.minimax-portal` вручну, або
    - Задайте `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` або профіль автентифікації MiniMax, щоб відповідного постачальника можна було вставити.

    Переконайтеся, що ID моделі **чутливий до регістру**:

    - Шлях API-ключа: `minimax/MiniMax-M2.7` або `minimax/MiniMax-M2.7-highspeed`
    - Шлях OAuth: `minimax-portal/MiniMax-M2.7` або `minimax-portal/MiniMax-M2.7-highspeed`

    Потім перевірте ще раз за допомогою:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Більше довідки: [Усунення несправностей](/uk/help/troubleshooting) і [Поширені запитання](/uk/help/faq).
</Note>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір постачальників, посилань на моделі та поведінки відмовостійкого перемикання.
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
    Загальне усунення несправностей і поширені запитання.
  </Card>
</CardGroup>
