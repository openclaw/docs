---
read_when:
    - Ви хочете використовувати моделі MiniMax в OpenClaw
    - Вам потрібні інструкції з налаштування MiniMax
summary: Використання моделей MiniMax в OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-04-28T11:23:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0ef833258692c78f40a160131c2a0d36f84889e5d5196ddadb648485ba8cb04a
    source_path: providers/minimax.md
    workflow: 16
---

OpenClaw's MiniMax provider defaults to **MiniMax M2.7**.

MiniMax also provides:

- Bundled speech synthesis via T2A v2
- Bundled image understanding via `MiniMax-VL-01`
- Bundled music generation via `music-2.6`
- Bundled `web_search` through the MiniMax Coding Plan search API

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
    Виберіть **Модель/автентифікація** в меню.
  </Step>
  <Step title="Виберіть варіант автентифікації MiniMax">
    Виберіть один із доступних варіантів MiniMax:

    | Варіант автентифікації | Опис |
    | --- | --- |
    | `minimax-global-oauth` | Міжнародний OAuth (тариф Coding Plan) |
    | `minimax-cn-oauth` | Китайський OAuth (тариф Coding Plan) |
    | `minimax-global-api` | Міжнародний ключ API |
    | `minimax-cn-api` | Китайський ключ API |

  </Step>
  <Step title="Виберіть модель за замовчуванням">
    Виберіть модель за замовчуванням, коли з’явиться запит.
  </Step>
</Steps>

## Можливості

### Генерація зображень

Plugin MiniMax реєструє модель `image-01` для інструмента `image_generate`. Вона підтримує:

- **Генерацію зображень із тексту** з керуванням співвідношенням сторін
- **Редагування зображення за зображенням** (референс об’єкта) з керуванням співвідношенням сторін
- До **9 вихідних зображень** на запит
- До **1 референсного зображення** на запит редагування
- Підтримувані співвідношення сторін: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

Щоб використовувати MiniMax для генерації зображень, задайте його як постачальника генерації зображень:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

Plugin використовує той самий `MINIMAX_API_KEY` або OAuth-автентифікацію, що й текстові моделі. Додаткова конфігурація не потрібна, якщо MiniMax уже налаштовано.

І `minimax`, і `minimax-portal` реєструють `image_generate` з тією самою
моделлю `image-01`. Налаштування з ключем API використовують `MINIMAX_API_KEY`; налаштування OAuth можуть використовувати
вбудований шлях автентифікації `minimax-portal`.

Генерація зображень завжди використовує спеціалізований кінцевий пункт MiniMax для зображень
(`/v1/image_generation`) та ігнорує `models.providers.minimax.baseUrl`,
оскільки це поле налаштовує базову URL-адресу чату/Anthropic-сумісного API. Задайте
`MINIMAX_API_HOST=https://api.minimaxi.com`, щоб спрямувати генерацію зображень
через CN-кінцевий пункт; глобальний кінцевий пункт за замовчуванням —
`https://api.minimax.io`.

Коли онбординг або налаштування ключа API записує явні записи `models.providers.minimax`,
OpenClaw матеріалізує `MiniMax-M2.7` і
`MiniMax-M2.7-highspeed` як текстові чат-моделі. Розуміння зображень
окремо надається через медіапостачальника `MiniMax-VL-01`, що належить Plugin.

<Note>
Див. [Генерація зображень](/uk/tools/image-generation) щодо спільних параметрів інструмента, вибору постачальника та поведінки відмовостійкості.
</Note>

### Синтез мовлення

Вбудований Plugin `minimax` реєструє MiniMax T2A v2 як постачальника мовлення для
`messages.tts`.

- Модель TTS за замовчуванням: `speech-2.8-hd`
- Голос за замовчуванням: `English_expressive_narrator`
- Підтримувані вбудовані ідентифікатори моделей включають `speech-2.8-hd`, `speech-2.8-turbo`,
  `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`,
  `speech-02-turbo`, `speech-01-hd` і `speech-01-turbo`.
- Розв’язання автентифікації відбувається в такому порядку: `messages.tts.providers.minimax.apiKey`, потім
  профілі OAuth/токен-автентифікації `minimax-portal`, потім ключі середовища
  Token Plan (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
  `MINIMAX_CODING_API_KEY`), потім `MINIMAX_API_KEY`.
- Якщо хост TTS не налаштовано, OpenClaw повторно використовує налаштований
  OAuth-хост `minimax-portal` і прибирає Anthropic-сумісні суфікси шляху,
  як-от `/anthropic`.
- Звичайні аудіовкладення залишаються MP3.
- Цілі голосових нотаток, як-от Feishu і Telegram, перекодовуються з MiniMax
  MP3 у Opus 48 кГц за допомогою `ffmpeg`, оскільки файловий API Feishu/Lark приймає лише
  `file_type: "opus"` для нативних аудіоповідомлень.
- MiniMax T2A приймає дробові `speed` і `vol`, але `pitch` надсилається як
  ціле число; OpenClaw обрізає дробові значення `pitch` перед API-запитом.

| Налаштування                             | Змінна середовища      | За замовчуванням             | Опис                             |
| ---------------------------------------- | ---------------------- | ----------------------------- | -------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | Хост API MiniMax T2A.            |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | Ідентифікатор моделі TTS.        |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | Ідентифікатор голосу для мовленнєвого виводу. |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                         | Швидкість відтворення, `0.5..2.0`. |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                         | Гучність, `(0, 10]`.             |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                           | Цілочисельний зсув висоти тону, `-12..12`. |

### Генерація музики

Вбудований Plugin MiniMax реєструє генерацію музики через спільний
інструмент `music_generate` як для `minimax`, так і для `minimax-portal`.

- Музична модель за замовчуванням: `minimax/music-2.6`
- Музична модель OAuth: `minimax-portal/music-2.6`
- Також підтримує `minimax/music-2.5` і `minimax/music-2.0`
- Керування запитом: `lyrics`, `instrumental`, `durationSeconds`
- Формат виводу: `mp3`
- Запуски з підтримкою сеансу від’єднуються через спільний потік завдань/статусу, зокрема `action: "status"`

Щоб використовувати MiniMax як постачальника музики за замовчуванням:

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
Див. [Генерація музики](/uk/tools/music-generation) щодо спільних параметрів інструмента, вибору постачальника та поведінки відмовостійкості.
</Note>

### Генерація відео

Вбудований Plugin MiniMax реєструє генерацію відео через спільний
інструмент `video_generate` як для `minimax`, так і для `minimax-portal`.

- Відеомодель за замовчуванням: `minimax/MiniMax-Hailuo-2.3`
- Відеомодель OAuth: `minimax-portal/MiniMax-Hailuo-2.3`
- Режими: потоки текст-у-відео та з референсом одного зображення
- Підтримує `aspectRatio` і `resolution`

Щоб використовувати MiniMax як постачальника відео за замовчуванням:

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
Див. [Генерація відео](/uk/tools/video-generation) щодо спільних параметрів інструмента, вибору провайдера та поведінки резервного перемикання.
</Note>

### Розуміння зображень

Plugin MiniMax реєструє розуміння зображень окремо від текстового
каталогу:

| ID провайдера    | Стандартна модель зображень |
| ---------------- | --------------------------- |
| `minimax`        | `MiniMax-VL-01`             |
| `minimax-portal` | `MiniMax-VL-01`             |

Саме тому автоматична маршрутизація медіа може використовувати розуміння
зображень MiniMax, навіть коли вбудований каталог текстового провайдера все ще
показує лише текстові chat refs M2.7.

### Вебпошук

Plugin MiniMax також реєструє `web_search` через пошуковий API MiniMax Coding Plan.

- ID провайдера: `minimax`
- Структуровані результати: заголовки, URL-адреси, фрагменти, пов’язані запити
- Бажана змінна середовища: `MINIMAX_CODE_PLAN_KEY`
- Прийнятий псевдонім env: `MINIMAX_CODING_API_KEY`
- Резервна сумісність: `MINIMAX_API_KEY`, коли він уже вказує на токен coding-plan
- Повторне використання регіону: `plugins.entries.minimax.config.webSearch.region`, потім `MINIMAX_API_HOST`, потім базові URL провайдера MiniMax
- Пошук залишається на ID провайдера `minimax`; налаштування OAuth CN/global усе ще може опосередковано спрямовувати регіон через `models.providers.minimax-portal.baseUrl`

Конфігурація міститься в `plugins.entries.minimax.config.webSearch.*`.

<Note>
Див. [Пошук MiniMax](/uk/tools/minimax-search) для повної конфігурації та використання вебпошуку.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Configuration options">
    | Опція | Опис |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Надавайте перевагу `https://api.minimax.io/anthropic` (сумісний з Anthropic); `https://api.minimax.io/v1` необов’язковий для payload, сумісних з OpenAI |
    | `models.providers.minimax.api` | Надавайте перевагу `anthropic-messages`; `openai-completions` необов’язковий для payload, сумісних з OpenAI |
    | `models.providers.minimax.apiKey` | API-ключ MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Визначає `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Псевдоніми моделей, які ви хочете додати до allowlist |
    | `models.mode` | Залиште `merge`, якщо хочете додати MiniMax поряд із вбудованими моделями |
  </Accordion>

  <Accordion title="Thinking defaults">
    Для `api: "anthropic-messages"` OpenClaw додає `thinking: { type: "disabled" }`, якщо thinking ще не встановлено явно в params/config.

    Це запобігає тому, щоб streaming endpoint MiniMax випускав `reasoning_content` у delta chunks стилю OpenAI, що могло б розкрити внутрішні міркування у видимому виводі.

  </Accordion>

  <Accordion title="Fast mode">
    `/fast on` або `params.fastMode: true` переписує `MiniMax-M2.7` на `MiniMax-M2.7-highspeed` у stream path, сумісному з Anthropic.
  </Accordion>

  <Accordion title="Fallback example">
    **Найкраще для:** зберігайте вашу найсильнішу модель останнього покоління як primary, а в разі збою перемикайтеся на MiniMax M2.7. Приклад нижче використовує Opus як конкретну primary; замініть її на бажану primary-модель останнього покоління.

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

  <Accordion title="Coding Plan usage details">
    - API використання Coding Plan: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` (потребує ключа coding plan).
    - OpenClaw нормалізує використання coding-plan MiniMax до того самого відображення `% left`, яке використовують інші провайдери. Сирі поля MiniMax `usage_percent` / `usagePercent` є залишком квоти, а не спожитою квотою, тому OpenClaw інвертує їх. Поля на основі лічильників мають пріоритет, коли вони присутні.
    - Коли API повертає `model_remains`, OpenClaw надає перевагу запису chat-моделі, за потреби виводить мітку вікна з `start_time` / `end_time` і додає назву вибраної моделі до мітки плану, щоб вікна coding-plan було легше розрізняти.
    - Знімки використання розглядають `minimax`, `minimax-cn` і `minimax-portal` як одну й ту саму поверхню квоти MiniMax і надають перевагу збереженому OAuth MiniMax перед резервним переходом до env vars ключа Coding Plan.

  </Accordion>
</AccordionGroup>

## Примітки

- Model refs відповідають шляху автентифікації:
  - Налаштування API-ключа: `minimax/<model>`
  - Налаштування OAuth: `minimax-portal/<model>`
- Стандартна chat-модель: `MiniMax-M2.7`
- Альтернативна chat-модель: `MiniMax-M2.7-highspeed`
- Onboarding і пряме налаштування API-ключа записують визначення текстових моделей для обох варіантів M2.7
- Розуміння зображень використовує медіапровайдера `MiniMax-VL-01`, яким володіє Plugin
- Оновіть значення цін у `models.json`, якщо вам потрібне точне відстеження витрат
- Використовуйте `openclaw models list`, щоб підтвердити поточний ID провайдера, потім перемкніться за допомогою `openclaw models set minimax/MiniMax-M2.7` або `openclaw models set minimax-portal/MiniMax-M2.7`

<Tip>
Реферальне посилання для MiniMax Coding Plan (знижка 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Див. [Провайдери моделей](/uk/concepts/model-providers) щодо правил провайдерів.
</Note>

## Усунення несправностей

<AccordionGroup>
  <Accordion title='"Unknown model: minimax/MiniMax-M2.7"'>
    Зазвичай це означає, що **провайдер MiniMax не налаштовано** (немає відповідного запису провайдера й не знайдено профілю автентифікації MiniMax або env-ключа). Виправлення для цього виявлення є у **2026.1.12**. Виправте так:

    - Оновіться до **2026.1.12** (або запустіть із source `main`), потім перезапустіть gateway.
    - Запустіть `openclaw configure` і виберіть опцію автентифікації **MiniMax**, або
    - Додайте відповідний блок `models.providers.minimax` чи `models.providers.minimax-portal` вручну, або
    - Установіть `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` або профіль автентифікації MiniMax, щоб можна було інжектувати відповідного провайдера.

    Переконайтеся, що ID моделі **чутливий до регістру**:

    - Шлях API-ключа: `minimax/MiniMax-M2.7` або `minimax/MiniMax-M2.7-highspeed`
    - Шлях OAuth: `minimax-portal/MiniMax-M2.7` або `minimax-portal/MiniMax-M2.7-highspeed`

    Потім перевірте повторно за допомогою:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Більше довідки: [Усунення несправностей](/uk/help/troubleshooting) і [FAQ](/uk/help/faq).
</Note>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Model selection" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, model refs і поведінка резервного перемикання.
  </Card>
  <Card title="Image generation" href="/uk/tools/image-generation" icon="image">
    Спільні параметри інструмента зображень і вибір провайдера.
  </Card>
  <Card title="Music generation" href="/uk/tools/music-generation" icon="music">
    Спільні параметри музичного інструмента й вибір провайдера.
  </Card>
  <Card title="Video generation" href="/uk/tools/video-generation" icon="video">
    Спільні параметри відеоінструмента й вибір провайдера.
  </Card>
  <Card title="MiniMax Search" href="/uk/tools/minimax-search" icon="magnifying-glass">
    Конфігурація вебпошуку через MiniMax Coding Plan.
  </Card>
  <Card title="Troubleshooting" href="/uk/help/troubleshooting" icon="wrench">
    Загальне усунення несправностей і FAQ.
  </Card>
</CardGroup>
