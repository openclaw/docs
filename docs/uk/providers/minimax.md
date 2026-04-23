---
read_when:
    - Ви хочете використовувати моделі MiniMax в OpenClaw
    - Вам потрібні вказівки з налаштування MiniMax
summary: Використовуйте моделі MiniMax в OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-04-23T21:06:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1d6f9f1ff14ee83a188af946c94113621c4c5ff65db028c95e6cb0a5c6ab9158
    source_path: providers/minimax.md
    workflow: 15
---

Провайдер MiniMax в OpenClaw типово використовує **MiniMax M2.7**.

MiniMax також надає:

- Bundled синтез мовлення через T2A v2
- Bundled розуміння зображень через `MiniMax-VL-01`
- Bundled генерацію музики через `music-2.5+`
- Bundled `web_search` через API пошуку MiniMax Coding Plan

Розподіл провайдерів:

| Provider ID      | Auth    | Capabilities                                                    |
| ---------------- | ------- | --------------------------------------------------------------- |
| `minimax`        | API key | Текст, генерація зображень, розуміння зображень, мовлення, вебпошук |
| `minimax-portal` | OAuth   | Текст, генерація зображень, розуміння зображень                 |

## Лінійка моделей

| Model                    | Type             | Description                               |
| ------------------------ | ---------------- | ----------------------------------------- |
| `MiniMax-M2.7`           | Chat (reasoning) | Типова hosted reasoning-модель            |
| `MiniMax-M2.7-highspeed` | Chat (reasoning) | Швидший reasoning-рівень M2.7             |
| `MiniMax-VL-01`          | Vision           | Модель розуміння зображень                |
| `image-01`               | Image generation | Генерація зображень із тексту та редагування зображення в зображення |
| `music-2.5+`             | Music generation | Типова музична модель                     |
| `music-2.5`              | Music generation | Попередній рівень генерації музики        |
| `music-2.0`              | Music generation | Застарілий рівень генерації музики        |
| `MiniMax-Hailuo-2.3`     | Video generation | Потоки text-to-video та з посиланням на зображення |

## Початок роботи

Виберіть бажаний метод auth і виконайте кроки налаштування.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Найкраще для:** швидкого налаштування з MiniMax Coding Plan через OAuth, API key не потрібен.

    <Tabs>
      <Tab title="Міжнародний">
        <Steps>
          <Step title="Запустіть onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            Це виконує автентифікацію через `api.minimax.io`.
          </Step>
          <Step title="Переконайтеся, що модель доступна">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="Китай">
        <Steps>
          <Step title="Запустіть onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            Це виконує автентифікацію через `api.minimaxi.com`.
          </Step>
          <Step title="Переконайтеся, що модель доступна">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    Налаштування OAuth використовують provider id `minimax-portal`. Посилання на моделі мають форму `minimax-portal/MiniMax-M2.7`.
    </Note>

    <Tip>
    Реферальне посилання для MiniMax Coding Plan (знижка 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API key">
    **Найкраще для:** hosted MiniMax з API, сумісним із Anthropic.

    <Tabs>
      <Tab title="Міжнародний">
        <Steps>
          <Step title="Запустіть onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            Це налаштовує `api.minimax.io` як base URL.
          </Step>
          <Step title="Переконайтеся, що модель доступна">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="Китай">
        <Steps>
          <Step title="Запустіть onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            Це налаштовує `api.minimaxi.com` як base URL.
          </Step>
          <Step title="Переконайтеся, що модель доступна">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    ### Приклад config

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
                input: ["text", "image"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7-highspeed",
                name: "MiniMax M2.7 Highspeed",
                reasoning: true,
                input: ["text", "image"],
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
    На шляху потокової передачі, сумісному з Anthropic, OpenClaw типово вимикає thinking MiniMax, якщо ви явно не задасте `thinking` самостійно. Streaming endpoint MiniMax надсилає `reasoning_content` у дельта-фрагментах у стилі OpenAI замість нативних блоків thinking Anthropic, що може призвести до витоку внутрішніх міркувань у видимий вивід, якщо залишити це неявно ввімкненим.
    </Warning>

    <Note>
    Налаштування з API key використовують provider id `minimax`. Посилання на моделі мають форму `minimax/MiniMax-M2.7`.
    </Note>

  </Tab>
</Tabs>

## Налаштування через `openclaw configure`

Використовуйте інтерактивний майстер config, щоб налаштувати MiniMax без редагування JSON:

<Steps>
  <Step title="Запустіть майстер">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Виберіть Model/auth">
    У меню виберіть **Model/auth**.
  </Step>
  <Step title="Виберіть варіант auth MiniMax">
    Виберіть один із доступних варіантів MiniMax:

    | Auth choice | Description |
    | --- | --- |
    | `minimax-global-oauth` | Міжнародний OAuth (Coding Plan) |
    | `minimax-cn-oauth` | OAuth для Китаю (Coding Plan) |
    | `minimax-global-api` | Міжнародний API key |
    | `minimax-cn-api` | API key для Китаю |

  </Step>
  <Step title="Виберіть типову модель">
    Коли з’явиться запит, виберіть вашу типову модель.
  </Step>
</Steps>

## Можливості

### Генерація зображень

Plugin MiniMax реєструє модель `image-01` для інструмента `image_generate`. Вона підтримує:

- **Генерацію зображень із тексту** з керуванням співвідношенням сторін
- **Редагування зображення в зображення** (reference з об’єктом) з керуванням співвідношенням сторін
- До **9 вихідних зображень** на запит
- До **1 reference-зображення** на запит редагування
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

Plugin використовує той самий `MINIMAX_API_KEY` або OAuth auth, що й текстові моделі. Додаткова конфігурація не потрібна, якщо MiniMax уже налаштовано.

І `minimax`, і `minimax-portal` реєструють `image_generate` з тією самою
моделлю `image-01`. Налаштування з API key використовують `MINIMAX_API_KEY`; налаштування OAuth можуть
натомість використовувати bundled шлях auth `minimax-portal`.

Коли onboarding або налаштування API key записує явні записи `models.providers.minimax`,
OpenClaw матеріалізує `MiniMax-M2.7` і
`MiniMax-M2.7-highspeed` з `input: ["text", "image"]`.

Вбудований bundled текстовий каталог MiniMax сам по собі залишається metadata лише для тексту, доки не з’явиться ця явна конфігурація провайдера. Розуміння зображень надається окремо через provider медіа `MiniMax-VL-01`, яким володіє Plugin.

<Note>
Див. [Image Generation](/uk/tools/image-generation) щодо спільних параметрів інструмента, вибору провайдера та поведінки failover.
</Note>

### Генерація музики

Bundled Plugin `minimax` також реєструє генерацію музики через спільний
інструмент `music_generate`.

- Типова музична модель: `minimax/music-2.5+`
- Також підтримує `minimax/music-2.5` і `minimax/music-2.0`
- Керування prompt: `lyrics`, `instrumental`, `durationSeconds`
- Формат виходу: `mp3`
- Запуски на основі session від’єднуються через спільний потік task/status, включно з `action: "status"`

Щоб використовувати MiniMax як типового музичного провайдера:

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
Див. [Music Generation](/uk/tools/music-generation) щодо спільних параметрів інструмента, вибору провайдера та поведінки failover.
</Note>

### Генерація відео

Bundled Plugin `minimax` також реєструє генерацію відео через спільний
інструмент `video_generate`.

- Типова відеомодель: `minimax/MiniMax-Hailuo-2.3`
- Режими: text-to-video і потоки з reference одного зображення
- Підтримує `aspectRatio` і `resolution`

Щоб використовувати MiniMax як типового відеопровайдера:

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
Див. [Video Generation](/uk/tools/video-generation) щодо спільних параметрів інструмента, вибору провайдера та поведінки failover.
</Note>

### Розуміння зображень

Plugin MiniMax реєструє розуміння зображень окремо від текстового
каталогу:

| Provider ID      | Default image model |
| ---------------- | ------------------- |
| `minimax`        | `MiniMax-VL-01`     |
| `minimax-portal` | `MiniMax-VL-01`     |

Саме тому автоматична маршрутизація медіа може використовувати розуміння зображень MiniMax навіть
тоді, коли bundled каталог текстового провайдера все ще показує chat refs M2.7 лише для тексту.

### Вебпошук

Plugin MiniMax також реєструє `web_search` через API пошуку MiniMax Coding Plan.

- ID провайдера: `minimax`
- Структуровані результати: заголовки, URL, сніпети, пов’язані запити
- Бажаний env var: `MINIMAX_CODE_PLAN_KEY`
- Прийнятний env alias: `MINIMAX_CODING_API_KEY`
- Fallback для сумісності: `MINIMAX_API_KEY`, якщо він уже вказує на token coding-plan
- Повторне використання регіону: `plugins.entries.minimax.config.webSearch.region`, потім `MINIMAX_API_HOST`, потім base URL провайдера MiniMax
- Пошук залишається на provider id `minimax`; налаштування OAuth CN/global усе ще можуть опосередковано керувати регіоном через `models.providers.minimax-portal.baseUrl`

Config розміщується в `plugins.entries.minimax.config.webSearch.*`.

<Note>
Див. [MiniMax Search](/uk/tools/minimax-search) для повної конфігурації та використання вебпошуку.
</Note>

## Розширене налаштування

<AccordionGroup>
  <Accordion title="Параметри конфігурації">
    | Option | Description |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Надавайте перевагу `https://api.minimax.io/anthropic` (сумісний з Anthropic); `https://api.minimax.io/v1` необов’язковий для payload, сумісних з OpenAI |
    | `models.providers.minimax.api` | Надавайте перевагу `anthropic-messages`; `openai-completions` необов’язковий для payload, сумісних з OpenAI |
    | `models.providers.minimax.apiKey` | API key MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Визначення `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Додайте псевдоніми моделей, які хочете бачити в allowlist |
    | `models.mode` | Залишайте `merge`, якщо хочете додати MiniMax поряд із вбудованими моделями |
  </Accordion>

  <Accordion title="Типові значення thinking">
    Для `api: "anthropic-messages"` OpenClaw впроваджує `thinking: { type: "disabled" }`, якщо thinking ще не задано явно в params/config.

    Це запобігає тому, щоб streaming endpoint MiniMax надсилав `reasoning_content` у дельта-фрагментах у стилі OpenAI, що призвело б до витоку внутрішніх міркувань у видимий вивід.

  </Accordion>

  <Accordion title="Швидкий режим">
    `/fast on` або `params.fastMode: true` переписує `MiniMax-M2.7` на `MiniMax-M2.7-highspeed` на шляху потоку, сумісного з Anthropic.
  </Accordion>

  <Accordion title="Приклад fallback">
    **Найкраще для:** залишити найсильнішу модель останнього покоління як primary і переходити в fallback до MiniMax M2.7. Приклад нижче використовує Opus як конкретний primary; замініть на свою бажану модель останнього покоління.

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
    - OpenClaw нормалізує використання coding plan MiniMax до того самого відображення `% left`, що й в інших провайдерів. Сирі поля MiniMax `usage_percent` / `usagePercent` означають залишкову квоту, а не спожиту, тому OpenClaw інвертує їх. Поля на основі кількості мають пріоритет, коли вони присутні.
    - Коли API повертає `model_remains`, OpenClaw надає перевагу запису chat-моделі, за потреби виводить мітку вікна з `start_time` / `end_time` і включає назву вибраної моделі в мітку плану, щоб вікна coding plan було легше розрізняти.
    - Snapshot використання розглядають `minimax`, `minimax-cn` і `minimax-portal` як ту саму поверхню квоти MiniMax і надають перевагу збереженому OAuth MiniMax перед поверненням до env var ключа Coding Plan.
  </Accordion>
</AccordionGroup>

## Примітки

- Посилання на моделі слідують шляху auth:
  - Налаштування з API key: `minimax/<model>`
  - Налаштування з OAuth: `minimax-portal/<model>`
- Типова chat-модель: `MiniMax-M2.7`
- Альтернативна chat-модель: `MiniMax-M2.7-highspeed`
- Onboarding і пряме налаштування API key записують явні визначення моделей з `input: ["text", "image"]` для обох варіантів M2.7
- Bundled каталог провайдера наразі показує chat refs як metadata лише для тексту, доки не з’явиться явна config провайдера MiniMax
- Оновіть значення цін у `models.json`, якщо вам потрібне точне відстеження вартості
- Використовуйте `openclaw models list`, щоб підтвердити поточний provider id, а потім перемкніть через `openclaw models set minimax/MiniMax-M2.7` або `openclaw models set minimax-portal/MiniMax-M2.7`

<Tip>
Реферальне посилання для MiniMax Coding Plan (знижка 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Див. [Model providers](/uk/concepts/model-providers) щодо правил провайдерів.
</Note>

## Усунення несправностей

<AccordionGroup>
  <Accordion title='"Unknown model: minimax/MiniMax-M2.7"'>
    Зазвичай це означає, що **провайдер MiniMax не налаштовано** (немає відповідного запису провайдера і не знайдено auth profile/env key MiniMax). Виправлення цього визначення є у **2026.1.12**. Щоб виправити:

    - Оновіться до **2026.1.12** (або запускайте з вихідного коду `main`), а потім перезапустіть gateway.
    - Запустіть `openclaw configure` і виберіть варіант auth **MiniMax**, або
    - Додайте вручну відповідний блок `models.providers.minimax` або `models.providers.minimax-portal`, або
    - Задайте `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` або auth profile MiniMax, щоб можна було впровадити відповідний провайдер.

    Переконайтеся, що ID моделі **чутливий до регістру**:

    - Шлях API key: `minimax/MiniMax-M2.7` або `minimax/MiniMax-M2.7-highspeed`
    - Шлях OAuth: `minimax-portal/MiniMax-M2.7` або `minimax-portal/MiniMax-M2.7-highspeed`

    Потім знову перевірте за допомогою:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Додаткова допомога: [Troubleshooting](/uk/help/troubleshooting) і [FAQ](/uk/help/faq).
</Note>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, model refs і поведінка failover.
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
  <Card title="MiniMax Search" href="/uk/tools/minimax-search" icon="magnifying-glass">
    Конфігурація вебпошуку через MiniMax Coding Plan.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Загальне усунення несправностей і FAQ.
  </Card>
</CardGroup>
