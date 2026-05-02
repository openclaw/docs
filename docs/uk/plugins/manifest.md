---
read_when:
    - Ви створюєте Plugin для OpenClaw
    - Вам потрібно випустити схему конфігурації Plugin або налагодити помилки валідації Plugin
summary: Вимоги до маніфесту Plugin і JSON-схеми (строга валідація конфігурації)
title: Маніфест Plugin
x-i18n:
    generated_at: "2026-05-02T18:46:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2988275b976df8b883a4042ee389197e617d50e63f5a478ce248e7a643bb12fb
    source_path: plugins/manifest.md
    workflow: 16
---

Ця сторінка призначена лише для **нативного маніфесту Plugin OpenClaw**.

Про сумісні макети пакетів див. [пакети Plugin](/uk/plugins/bundles).

Сумісні формати пакетів використовують інші файли маніфесту:

- пакет Codex: `.codex-plugin/plugin.json`
- пакет Claude: `.claude-plugin/plugin.json` або стандартний макет компонента Claude
  без маніфесту
- пакет Cursor: `.cursor-plugin/plugin.json`

OpenClaw також автоматично виявляє ці макети пакетів, але вони не перевіряються
за схемою `openclaw.plugin.json`, описаною тут.

Для сумісних пакетів OpenClaw наразі читає метадані пакета, а також оголошені
корені Skills, корені команд Claude, стандартні значення `settings.json` пакета Claude,
стандартні значення LSP пакета Claude і підтримувані набори хуків, коли макет відповідає
очікуванням runtime OpenClaw.

Кожен нативний Plugin OpenClaw **обов’язково** має постачати файл `openclaw.plugin.json` у
**корені Plugin**. OpenClaw використовує цей маніфест для перевірки конфігурації
**без виконання коду Plugin**. Відсутні або недійсні маніфести вважаються
помилками Plugin і блокують перевірку конфігурації.

Див. повний посібник із системи Plugin: [Plugins](/uk/tools/plugin).
Про нативну модель можливостей і поточні рекомендації щодо зовнішньої сумісності:
[модель можливостей](/uk/plugins/architecture#public-capability-model).

## Що робить цей файл

`openclaw.plugin.json` — це метадані, які OpenClaw читає **до завантаження вашого
коду Plugin**. Усе нижче має бути достатньо легким для перевірки без запуску
runtime Plugin.

**Використовуйте його для:**

- ідентичності Plugin, перевірки конфігурації та підказок для UI конфігурації
- метаданих автентифікації, onboarding і налаштування (псевдонім, автоматичне ввімкнення, env vars провайдера, варіанти автентифікації)
- підказок активації для поверхонь control plane
- скороченого володіння сімейством моделей
- статичних знімків володіння можливостями (`contracts`)
- метаданих QA runner, які спільний host `openclaw qa` може перевірити
- метаданих конфігурації, специфічних для каналів, об’єднаних у поверхні каталогу та перевірки

**Не використовуйте його для:** реєстрації поведінки runtime, оголошення entrypoints коду
або метаданих встановлення npm. Вони належать до вашого коду Plugin і `package.json`.

## Мінімальний приклад

```json
{
  "id": "voice-call",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

## Розширений приклад

```json
{
  "id": "openrouter",
  "name": "OpenRouter",
  "description": "OpenRouter provider plugin",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "modelSupport": {
    "modelPrefixes": ["router-"]
  },
  "modelIdNormalization": {
    "providers": {
      "openrouter": {
        "prefixWhenBare": "openrouter"
      }
    }
  },
  "providerEndpoints": [
    {
      "endpointClass": "openrouter",
      "hostSuffixes": ["openrouter.ai"]
    }
  ],
  "providerRequest": {
    "providers": {
      "openrouter": {
        "family": "openrouter"
      }
    }
  },
  "cliBackends": ["openrouter-cli"],
  "syntheticAuthRefs": ["openrouter-cli"],
  "providerAuthEnvVars": {
    "openrouter": ["OPENROUTER_API_KEY"]
  },
  "providerAuthAliases": {
    "openrouter-coding": "openrouter"
  },
  "channelEnvVars": {
    "openrouter-chatops": ["OPENROUTER_CHATOPS_TOKEN"]
  },
  "providerAuthChoices": [
    {
      "provider": "openrouter",
      "method": "api-key",
      "choiceId": "openrouter-api-key",
      "choiceLabel": "OpenRouter API key",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "OpenRouter API key",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  },
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "apiKey": {
        "type": "string"
      }
    }
  }
}
```

## Довідник полів верхнього рівня

| Поле                                 | Обов'язкове | Тип                              | Що це означає                                                                                                                                                                                                                       |
| ------------------------------------ | ----------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Так         | `string`                         | Канонічний ідентифікатор Plugin. Це ідентифікатор, що використовується в `plugins.entries.<id>`.                                                                                                                                    |
| `configSchema`                       | Так         | `object`                         | Вбудована JSON Schema для конфігурації цього Plugin.                                                                                                                                                                                |
| `enabledByDefault`                   | Ні          | `true`                           | Позначає вбудований Plugin як увімкнений за замовчуванням. Пропустіть це поле або задайте будь-яке значення, відмінне від `true`, щоб залишити Plugin вимкненим за замовчуванням.                                                   |
| `legacyPluginIds`                    | Ні          | `string[]`                       | Застарілі ідентифікатори, що нормалізуються до цього канонічного ідентифікатора Plugin.                                                                                                                                            |
| `autoEnableWhenConfiguredProviders`  | Ні          | `string[]`                       | Ідентифікатори провайдерів, які мають автоматично вмикати цей Plugin, коли автентифікація, конфігурація або посилання на моделі згадують їх.                                                                                        |
| `kind`                               | Ні          | `"memory"` \| `"context-engine"` | Оголошує ексклюзивний тип Plugin, що використовується `plugins.slots.*`.                                                                                                                                                            |
| `channels`                           | Ні          | `string[]`                       | Ідентифікатори каналів, якими володіє цей Plugin. Використовується для виявлення та валідації конфігурації.                                                                                                                         |
| `providers`                          | Ні          | `string[]`                       | Ідентифікатори провайдерів, якими володіє цей Plugin.                                                                                                                                                                               |
| `providerDiscoveryEntry`             | Ні          | `string`                         | Шлях до полегшеного модуля виявлення провайдерів відносно кореня Plugin для обмежених маніфестом метаданих каталогу провайдерів, які можна завантажувати без активації повного runtime Plugin.                                     |
| `modelSupport`                       | Ні          | `object`                         | Скорочені метадані сімейств моделей, якими володіє маніфест і які використовуються для автоматичного завантаження Plugin до runtime.                                                                                                |
| `modelCatalog`                       | Ні          | `object`                         | Декларативні метадані каталогу моделей для провайдерів, якими володіє цей Plugin. Це контракт control plane для майбутнього спискування лише для читання, онбордингу, вибирачів моделей, псевдонімів і приглушення без завантаження runtime Plugin. |
| `modelPricing`                       | Ні          | `object`                         | Політика зовнішнього пошуку цін, якою володіє провайдер. Використовуйте її, щоб виключати локальних/self-hosted провайдерів із віддалених каталогів цін або зіставляти посилання провайдера з ідентифікаторами каталогів OpenRouter/LiteLLM без жорсткого кодування ідентифікаторів провайдерів у core. |
| `modelIdNormalization`               | Ні          | `object`                         | Очищення псевдонімів/префіксів ідентифікаторів моделей, яким володіє провайдер і яке має виконуватися до завантаження runtime провайдера.                                                                                          |
| `providerEndpoints`                  | Ні          | `object[]`                       | Метадані host/baseUrl endpoint, якими володіє маніфест, для маршрутів провайдера, які core має класифікувати до завантаження runtime провайдера.                                                                                    |
| `providerRequest`                    | Ні          | `object`                         | Дешеві метадані сімейства провайдера та сумісності запитів, що використовуються загальною політикою запитів до завантаження runtime провайдера.                                                                                     |
| `cliBackends`                        | Ні          | `string[]`                       | Ідентифікатори backend інференсу CLI, якими володіє цей Plugin. Використовується для автоматичної активації під час запуску з явних посилань конфігурації.                                                                          |
| `syntheticAuthRefs`                  | Ні          | `string[]`                       | Посилання на провайдера або backend CLI, для яких під час холодного виявлення моделей до завантаження runtime має перевірятися синтетичний auth hook, яким володіє Plugin.                                                          |
| `nonSecretAuthMarkers`               | Ні          | `string[]`                       | Значення-заповнювачі API key, якими володіє вбудований Plugin і які представляють несекретний локальний, OAuth або ambient credential стан.                                                                                         |
| `commandAliases`                     | Ні          | `object[]`                       | Імена команд, якими володіє цей Plugin і які мають створювати діагностику конфігурації та CLI з урахуванням Plugin до завантаження runtime.                                                                                         |
| `providerAuthEnvVars`                | Ні          | `Record<string, string[]>`       | Застарілі сумісні env метадані для пошуку автентифікації/стану провайдера. Для нових Plugin віддавайте перевагу `setup.providers[].envVars`; OpenClaw усе ще читає це під час періоду вилучення.                                   |
| `providerAuthAliases`                | Ні          | `Record<string, string>`         | Ідентифікатори провайдерів, які мають повторно використовувати інший ідентифікатор провайдера для пошуку автентифікації, наприклад coding-провайдер, що спільно використовує API key базового провайдера та auth profiles.          |
| `channelEnvVars`                     | Ні          | `Record<string, string[]>`       | Дешеві env метадані каналу, які OpenClaw може перевіряти без завантаження коду Plugin. Використовуйте це для налаштування каналу через env або auth surfaces, які мають бачити загальні helper запуску/конфігурації.                 |
| `providerAuthChoices`                | Ні          | `object[]`                       | Дешеві метадані вибору автентифікації для onboarding pickers, визначення бажаного провайдера та простого підключення CLI flags.                                                                                                     |
| `activation`                         | Ні          | `object`                         | Дешеві метадані планувальника активації для завантаження, спричиненого запуском, провайдером, командою, каналом, маршрутом і capability. Лише метадані; runtime Plugin усе ще володіє фактичною поведінкою.                         |
| `setup`                              | Ні          | `object`                         | Дешеві дескриптори налаштування/онбордингу, які discovery і setup surfaces можуть перевіряти без завантаження runtime Plugin.                                                                                                       |
| `qaRunners`                          | Ні          | `object[]`                       | Дешеві дескриптори QA runner, що використовуються спільним host `openclaw qa` до завантаження runtime Plugin.                                                                                                                       |
| `contracts`                          | Ні          | `object`                         | Статичний знімок володіння capability для зовнішніх auth hooks, speech, realtime transcription, realtime voice, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search і володіння tools. |
| `mediaUnderstandingProviderMetadata` | Ні          | `Record<string, object>`         | Дешеві значення за замовчуванням для media-understanding для ідентифікаторів провайдерів, оголошених у `contracts.mediaUnderstandingProviders`.                                                                                     |
| `imageGenerationProviderMetadata`    | Ні          | `Record<string, object>`         | Дешеві auth метадані image-generation для ідентифікаторів провайдерів, оголошених у `contracts.imageGenerationProviders`, включно з auth aliases і base-url guards, якими володіє провайдер.                                      |
| `videoGenerationProviderMetadata`    | Ні          | `Record<string, object>`         | Дешеві auth метадані video-generation для ідентифікаторів провайдерів, оголошених у `contracts.videoGenerationProviders`, включно з auth aliases і base-url guards, якими володіє провайдер.                                      |
| `musicGenerationProviderMetadata`    | Ні          | `Record<string, object>`         | Дешеві auth метадані music-generation для ідентифікаторів провайдерів, оголошених у `contracts.musicGenerationProviders`, включно з auth aliases і base-url guards, якими володіє провайдер.                                      |
| `toolMetadata`                       | Ні          | `Record<string, object>`         | Дешеві метадані доступності для tools, якими володіє Plugin і які оголошені в `contracts.tools`. Використовуйте це, коли tool не має завантажувати runtime, якщо немає доказів конфігурації, env або автентифікації.                |
| `channelConfigs`                     | Ні          | `Record<string, object>`         | Метадані конфігурації каналу, якими володіє маніфест і які зливаються в discovery і validation surfaces до завантаження runtime.                                                                                                    |
| `skills`                             | Ні          | `string[]`                       | Каталоги Skills для завантаження відносно кореня Plugin.                                                                                                                                                                            |
| `name`                               | Ні          | `string`                         | Зрозуміла для людини назва Plugin.                                                                                                                                                                                                  |
| `description`                        | Ні       | `string`                         | Короткий опис, що відображається в інтерфейсах Plugin.                                                                                                                                                                             |
| `version`                            | Ні       | `string`                         | Інформаційна версія Plugin.                                                                                                                                                                                                        |
| `uiHints`                            | Ні       | `Record<string, object>`         | Мітки інтерфейсу, заповнювачі та підказки щодо чутливості для полів конфігурації.                                                                                                                                                  |

## Довідник метаданих провайдера генерації

Поля метаданих провайдера генерації описують статичні сигнали автентифікації для
провайдерів, оголошених у відповідному списку `contracts.*GenerationProviders`.
OpenClaw читає ці поля до завантаження runtime провайдера, щоб інструменти ядра могли
вирішити, чи доступний провайдер генерації, без імпорту кожного
Plugin провайдера.

Використовуйте ці поля лише для дешевих декларативних фактів. Транспорт, перетворення
запитів, оновлення токенів, перевірка облікових даних і фактична поведінка генерації
залишаються в runtime Plugin.

```json
{
  "contracts": {
    "imageGenerationProviders": ["example-image"]
  },
  "imageGenerationProviderMetadata": {
    "example-image": {
      "aliases": ["example-image-oauth"],
      "authProviders": ["example-image"],
      "configSignals": [
        {
          "rootPath": "plugins.entries.example-image.config",
          "overlayPath": "image",
          "mode": {
            "path": "mode",
            "default": "local",
            "allowed": ["local"]
          },
          "requiredAny": ["workflow", "workflowPath"],
          "required": ["promptNodeId"]
        }
      ],
      "authSignals": [
        {
          "provider": "example-image"
        },
        {
          "provider": "example-image-oauth",
          "providerBaseUrl": {
            "provider": "example-image",
            "defaultBaseUrl": "https://api.example.com/v1",
            "allowedBaseUrls": ["https://api.example.com/v1"]
          }
        }
      ]
    }
  }
}
```

Кожен запис метаданих підтримує:

| Поле           | Обов’язкове | Тип        | Що це означає                                                                                                                      |
| --------------- | -------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`       | Ні       | `string[]` | Додаткові ідентифікатори провайдера, які мають враховуватися як статичні псевдоніми автентифікації для провайдера генерації.        |
| `authProviders` | Ні       | `string[]` | Ідентифікатори провайдерів, чиї налаштовані профілі автентифікації мають враховуватися як автентифікація для цього провайдера генерації. |
| `configSignals` | Ні       | `object[]` | Дешеві сигнали доступності лише з конфігурації для локальних або self-hosted провайдерів, які можна налаштувати без профілів автентифікації чи змінних середовища. |
| `authSignals`   | Ні       | `object[]` | Явні сигнали автентифікації. Якщо вони є, вони замінюють стандартний набір сигналів з ідентифікатора провайдера, `aliases` і `authProviders`. |

Кожен запис `configSignals` підтримує:

| Поле          | Обов’язкове | Тип        | Що це означає                                                                                                                                                                           |
| ------------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`    | Так      | `string`   | Dot path до об’єкта конфігурації, яким володіє Plugin, для перевірки, наприклад `plugins.entries.example.config`.                                                                       |
| `overlayPath` | Ні       | `string`   | Dot path всередині кореневої конфігурації, об’єкт якого має накладатися на кореневий об’єкт перед оцінюванням сигналу. Використовуйте це для конфігурації, специфічної для можливості, як-от `image`, `video` або `music`. |
| `required`    | Ні       | `string[]` | Dot paths всередині ефективної конфігурації, які мають мати налаштовані значення. Рядки мають бути непорожніми; об’єкти й масиви не мають бути порожніми. |
| `requiredAny` | Ні       | `string[]` | Dot paths всередині ефективної конфігурації, де принаймні один має мати налаштоване значення.                                                                                           |
| `mode`        | Ні       | `object`   | Необов’язковий захист рядкового режиму всередині ефективної конфігурації. Використовуйте це, коли доступність лише з конфігурації застосовується тільки до одного режиму.                |

Кожен захист `mode` підтримує:

| Поле          | Обов’язкове | Тип        | Що це означає                                                                      |
| ------------ | -------- | ---------- | ---------------------------------------------------------------------------------- |
| `path`       | Ні       | `string`   | Dot path всередині ефективної конфігурації. За замовчуванням `mode`.               |
| `default`    | Ні       | `string`   | Значення режиму, яке використовується, коли конфігурація пропускає шлях.            |
| `allowed`    | Ні       | `string[]` | Якщо наявне, сигнал проходить лише тоді, коли ефективний режим є одним із цих значень. |
| `disallowed` | Ні       | `string[]` | Якщо наявне, сигнал не проходить, коли ефективний режим є одним із цих значень.     |

Кожен запис `authSignals` підтримує:

| Поле             | Обов’язкове | Тип      | Що це означає                                                                                                                                                                 |
| ----------------- | -------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Так      | `string` | Ідентифікатор провайдера для перевірки в налаштованих профілях автентифікації.                                                                                                |
| `providerBaseUrl` | Ні       | `object` | Необов’язковий захист, який зараховує сигнал лише тоді, коли зазначений налаштований провайдер використовує дозволений базовий URL. Використовуйте це, коли псевдонім автентифікації чинний лише для певних API. |

Кожен захист `providerBaseUrl` підтримує:

| Поле              | Обов’язкове | Тип        | Що це означає                                                                                                                                        |
| ----------------- | -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Так      | `string`   | Ідентифікатор конфігурації провайдера, чий `baseUrl` потрібно перевірити.                                                                            |
| `defaultBaseUrl`  | Ні       | `string`   | Базовий URL, який слід припускати, коли конфігурація провайдера пропускає `baseUrl`.                                                                  |
| `allowedBaseUrls` | Так      | `string[]` | Дозволені базові URL для цього сигналу автентифікації. Сигнал ігнорується, коли налаштований або стандартний базовий URL не збігається з одним із цих нормалізованих значень. |

## Довідник метаданих інструментів

`toolMetadata` використовує ті самі форми `configSignals` і `authSignals`, що й
метадані провайдера генерації, з ключами за назвою інструмента. `contracts.tools` оголошує
володіння. `toolMetadata` оголошує дешеві докази доступності, щоб OpenClaw міг
уникати імпорту runtime Plugin лише для того, щоб його фабрика інструментів повернула `null`.

```json
{
  "providerAuthEnvVars": {
    "example": ["EXAMPLE_API_KEY"]
  },
  "contracts": {
    "tools": ["example_search"]
  },
  "toolMetadata": {
    "example_search": {
      "authSignals": [
        {
          "provider": "example"
        }
      ],
      "configSignals": [
        {
          "rootPath": "plugins.entries.example.config",
          "overlayPath": "search",
          "required": ["apiKey"]
        }
      ]
    }
  }
}
```

Якщо інструмент не має `toolMetadata`, OpenClaw зберігає наявну поведінку й
завантажує Plugin-власник, коли контракт інструмента відповідає політиці. Для інструментів
гарячого шляху, фабрика яких залежить від автентифікації/конфігурації, автори Plugin мають оголошувати
`toolMetadata` замість того, щоб змушувати ядро імпортувати runtime для запиту.

## Довідник providerAuthChoices

Кожен запис `providerAuthChoices` описує один варіант onboarding або автентифікації.
OpenClaw читає це до завантаження runtime провайдера.
Списки налаштування провайдера використовують ці варіанти з маніфесту, варіанти налаштування,
отримані з дескриптора, і метадані каталогу встановлення без завантаження runtime провайдера.

| Поле                  | Обов’язкове | Тип                                             | Що це означає                                                                                             |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | Так      | `string`                                        | Ідентифікатор провайдера, якому належить цей варіант.                                                    |
| `method`              | Так      | `string`                                        | Ідентифікатор методу автентифікації для dispatch.                                                        |
| `choiceId`            | Так      | `string`                                        | Стабільний ідентифікатор варіанта автентифікації, який використовується потоками onboarding і CLI.        |
| `choiceLabel`         | Ні       | `string`                                        | Мітка для користувача. Якщо пропущено, OpenClaw повертається до `choiceId`.                              |
| `choiceHint`          | Ні       | `string`                                        | Короткий допоміжний текст для вибору.                                                                    |
| `assistantPriority`   | Ні       | `number`                                        | Нижчі значення сортуються раніше в інтерактивних виборах, керованих асистентом.                          |
| `assistantVisibility` | Ні       | `"visible"` \| `"manual-only"`                  | Приховує варіант із виборів асистента, водночас дозволяючи ручний вибір через CLI.                       |
| `deprecatedChoiceIds` | Ні       | `string[]`                                      | Застарілі ідентифікатори варіантів, які мають перенаправляти користувачів до цього варіанта заміни.      |
| `groupId`             | Ні       | `string`                                        | Необов’язковий ідентифікатор групи для групування пов’язаних варіантів.                                  |
| `groupLabel`          | Ні       | `string`                                        | Мітка для користувача для цієї групи.                                                                    |
| `groupHint`           | Ні       | `string`                                        | Короткий допоміжний текст для групи.                                                                     |
| `optionKey`           | Ні       | `string`                                        | Внутрішній ключ опції для простих потоків автентифікації з одним прапорцем.                              |
| `cliFlag`             | Ні       | `string`                                        | Назва прапорця CLI, наприклад `--openrouter-api-key`.                                                    |
| `cliOption`           | Ні       | `string`                                        | Повна форма опції CLI, наприклад `--openrouter-api-key <key>`.                                           |
| `cliDescription`      | Ні       | `string`                                        | Опис, який використовується в довідці CLI.                                                               |
| `onboardingScopes`    | Ні       | `Array<"text-inference" \| "image-generation">` | На яких поверхнях onboarding має з’являтися цей варіант. Якщо пропущено, стандартне значення — `["text-inference"]`. |

## Довідник commandAliases

Використовуйте `commandAliases`, коли plugin володіє назвою runtime-команди, яку користувачі можуть
помилково вказати в `plugins.allow` або спробувати запустити як кореневу CLI-команду. OpenClaw
використовує ці метадані для діагностики без імпорту runtime-коду plugin.

```json
{
  "commandAliases": [
    {
      "name": "dreaming",
      "kind": "runtime-slash",
      "cliCommand": "memory"
    }
  ]
}
```

| Поле        | Обов’язкове | Тип               | Що це означає                                                               |
| ------------ | -------- | ----------------- | ----------------------------------------------------------------------- |
| `name`       | Так      | `string`          | Назва команди, що належить цьому plugin.                                 |
| `kind`       | Ні       | `"runtime-slash"` | Позначає псевдонім як slash-команду чату, а не кореневу CLI-команду.     |
| `cliCommand` | Ні       | `string`          | Пов’язана коренева CLI-команда, яку слід запропонувати для CLI-операцій, якщо вона існує. |

## довідка activation

Використовуйте `activation`, коли plugin може дешево оголосити, які події control plane
мають включати його до плану активації/завантаження.

Цей блок є метаданими планувальника, а не lifecycle API. Він не реєструє
runtime-поведінку, не замінює `register(...)` і не гарантує, що
код plugin уже виконався. Планувальник активації використовує ці поля, щоб
звузити набір кандидатних plugins перед fallback до наявних метаданих володіння
маніфесту, таких як `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` і hooks.

Надавайте перевагу найвужчим метаданим, які вже описують володіння. Використовуйте
`providers`, `channels`, `commandAliases`, дескриптори setup або `contracts`,
коли ці поля виражають зв’язок. Використовуйте `activation` для додаткових підказок
планувальнику, які не можна представити цими полями володіння.
Використовуйте top-level `cliBackends` для псевдонімів CLI runtime, як-от `claude-cli`,
`codex-cli` або `google-gemini-cli`; `activation.onAgentHarnesses` призначено лише для
вбудованих ids agent harness, які ще не мають поля володіння.

Цей блок містить лише метадані. Він не реєструє runtime-поведінку і не
замінює `register(...)`, `setupEntry` або інші runtime/plugin entrypoints.
Поточні споживачі використовують його як підказку для звуження перед ширшим завантаженням plugins, тому
відсутність non-startup метаданих активації зазвичай впливає лише на продуктивність; це
не має змінювати коректність, доки fallback-варіанти володіння з маніфесту все ще існують.

Кожен plugin має навмисно задавати `activation.onStartup`. Установлюйте його в `true`
лише тоді, коли plugin має запускатися під час старту Gateway. Установлюйте його в `false`, коли
plugin інертний під час старту й має завантажуватися лише від вужчих тригерів.
Пропуск `onStartup` більше не запускає plugin під час старту неявно; використовуйте явні
метадані активації для старту, каналу, конфігурації, agent-harness, пам’яті або
інших вужчих тригерів активації.

```json
{
  "activation": {
    "onStartup": false,
    "onProviders": ["openai"],
    "onCommands": ["models"],
    "onChannels": ["web"],
    "onRoutes": ["gateway-webhook"],
    "onConfigPaths": ["browser"],
    "onCapabilities": ["provider", "tool"]
  }
}
```

| Поле              | Обов’язкове | Тип                                                  | Що це означає                                                                                                                                                                               |
| ------------------ | -------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | Ні       | `boolean`                                            | Явна активація під час старту Gateway. Кожен plugin має задавати це поле. `true` імпортує plugin під час старту; `false` залишає його лінивим під час старту, якщо інший відповідний тригер не потребує завантаження. |
| `onProviders`      | Ні       | `string[]`                                           | Ids провайдерів, які мають включати цей plugin до планів активації/завантаження.                                                                                                            |
| `onAgentHarnesses` | Ні       | `string[]`                                           | Runtime ids вбудованих agent harness, які мають включати цей plugin до планів активації/завантаження. Використовуйте top-level `cliBackends` для псевдонімів CLI backend.                  |
| `onCommands`       | Ні       | `string[]`                                           | Ids команд, які мають включати цей plugin до планів активації/завантаження.                                                                                                                 |
| `onChannels`       | Ні       | `string[]`                                           | Ids каналів, які мають включати цей plugin до планів активації/завантаження.                                                                                                                |
| `onRoutes`         | Ні       | `string[]`                                           | Види маршрутів, які мають включати цей plugin до планів активації/завантаження.                                                                                                             |
| `onConfigPaths`    | Ні       | `string[]`                                           | Відносні до кореня шляхи конфігурації, які мають включати цей plugin до планів startup/load, коли шлях присутній і не вимкнений явно.                                                       |
| `onCapabilities`   | Ні       | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Широкі підказки можливостей, які використовує планування активації control plane. За можливості надавайте перевагу вужчим полям.                                                          |

Поточні live-споживачі:

- планування старту Gateway використовує `activation.onStartup` для явного startup-імпорту
- планування CLI, запущене командою, fallback-иться до legacy
  `commandAliases[].cliCommand` або `commandAliases[].name`
- планування старту agent-runtime використовує `activation.onAgentHarnesses` для
  вбудованих harnesses і top-level `cliBackends[]` для псевдонімів CLI runtime
- планування setup/channel, запущене каналом, fallback-иться до legacy-володіння `channels[]`,
  коли явні метадані активації каналу відсутні
- планування startup plugin використовує `activation.onConfigPaths` для неканальних кореневих
  поверхонь конфігурації, як-от блок `browser` bundled browser plugin
- планування setup/runtime, запущене провайдером, fallback-иться до legacy-володіння
  `providers[]` і top-level `cliBackends[]`, коли явні метадані активації провайдера
  відсутні

Діагностика планувальника може відрізняти явні підказки активації від fallback володіння
маніфесту. Наприклад, `activation-command-hint` означає, що
`activation.onCommands` збігся, тоді як `manifest-command-alias` означає, що
планувальник натомість використав володіння `commandAliases`. Ці мітки причин призначені для
діагностики host і тестів; автори plugins мають продовжувати оголошувати метадані,
які найкраще описують володіння.

## довідка qaRunners

Використовуйте `qaRunners`, коли plugin додає один або більше transport runners під
спільним коренем `openclaw qa`. Тримайте ці метадані дешевими й статичними; runtime
plugin все ще володіє фактичною реєстрацією CLI через легку поверхню
`runtime-api.ts`, яка експортує `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Run the Docker-backed Matrix live QA lane against a disposable homeserver"
    }
  ]
}
```

| Поле          | Обов’язкове | Тип      | Що це означає                                                     |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | Так      | `string` | Підкоманда, змонтована під `openclaw qa`, наприклад `matrix`.      |
| `description` | Ні       | `string` | Fallback-текст довідки, що використовується, коли спільному host потрібна stub-команда. |

## довідка setup

Використовуйте `setup`, коли поверхням setup і onboarding потрібні дешеві метадані,
що належать plugin, до завантаження runtime.

```json
{
  "setup": {
    "providers": [
      {
        "id": "openai",
        "authMethods": ["api-key"],
        "envVars": ["OPENAI_API_KEY"],
        "authEvidence": [
          {
            "type": "local-file-with-env",
            "fileEnvVar": "OPENAI_CREDENTIALS_FILE",
            "requiresAllEnv": ["OPENAI_PROJECT"],
            "credentialMarker": "openai-local-credentials",
            "source": "openai local credentials"
          }
        ]
      }
    ],
    "cliBackends": ["openai-cli"],
    "configMigrations": ["legacy-openai-auth"],
    "requiresRuntime": false
  }
}
```

Top-level `cliBackends` залишається чинним і продовжує описувати backends для CLI-інференсу.
`setup.cliBackends` є setup-специфічною поверхнею дескрипторів для
потоків control-plane/setup, які мають залишатися лише метаданими.

Коли вони присутні, `setup.providers` і `setup.cliBackends` є пріоритетною
descriptor-first поверхнею lookup для виявлення setup. Якщо дескриптор лише
звужує кандидатний plugin, а setup все ще потребує багатших runtime hooks під час setup,
установіть `requiresRuntime: true` і залиште `setup-api` як
fallback-шлях виконання.

OpenClaw також включає `setup.providers[].envVars` у загальні lookup для auth провайдера та
env-var. `providerAuthEnvVars` залишається підтримуваним через адаптер сумісності
протягом періоду deprecation, але non-bundled plugins, які все ще його використовують,
отримують діагностику маніфесту. Нові plugins мають розміщувати метадані env для setup/status
у `setup.providers[].envVars`.

OpenClaw також може виводити прості варіанти setup із `setup.providers[].authMethods`,
коли запис setup недоступний або коли `setup.requiresRuntime: false`
оголошує runtime setup непотрібним. Явні записи `providerAuthChoices` залишаються
пріоритетними для власних labels, CLI flags, області onboarding і метаданих assistant.

Установлюйте `requiresRuntime: false` лише тоді, коли цих дескрипторів достатньо для
поверхні setup. OpenClaw трактує явне `false` як descriptor-only контракт
і не виконуватиме `setup-api` або `openclaw.setupEntry` для setup lookup. Якщо
descriptor-only plugin все ще постачає один із цих runtime-записів setup,
OpenClaw повідомляє additive-діагностику й продовжує його ігнорувати. Пропущений
`requiresRuntime` зберігає legacy fallback-поведінку, щоб наявні plugins, які додали
дескриптори без прапорця, не зламалися.

Оскільки setup lookup може виконувати код `setup-api`, що належить plugin, нормалізовані
значення `setup.providers[].id` і `setup.cliBackends[]` мають залишатися унікальними серед
виявлених plugins. Неоднозначне володіння fails closed замість вибору
переможця з порядку виявлення.

Коли runtime setup виконується, діагностика реєстру setup повідомляє про drift дескрипторів,
якщо `setup-api` реєструє провайдера або CLI backend, які дескриптори маніфесту
не оголошують, або якщо дескриптор не має відповідної runtime-реєстрації.
Ці діагностики є additive і не відхиляють legacy plugins.

### довідка setup.providers

| Поле          | Обов’язкове | Тип        | Що це означає                                                                                     |
| -------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | Так      | `string`   | Id провайдера, доступний під час setup або onboarding. Тримайте нормалізовані ids глобально унікальними. |
| `authMethods`  | Ні       | `string[]` | Ids методів setup/auth, які цей провайдер підтримує без завантаження повного runtime.             |
| `envVars`      | Ні       | `string[]` | Env vars, які загальні поверхні setup/status можуть перевіряти до завантаження runtime plugin.    |
| `authEvidence` | Ні       | `object[]` | Дешеві локальні перевірки auth evidence для провайдерів, які можуть автентифікуватися через non-secret маркери. |

`authEvidence` призначено для локальних маркерів облікових даних, якими володіє провайдер і які можна
перевірити без завантаження runtime-коду. Ці перевірки мають залишатися дешевими й локальними:
без мережевих викликів, без читання keychain або менеджера секретів, без shell-команд і без
проб API провайдера.

Підтримувані записи доказів:

| Поле               | Обов’язково | Тип        | Що означає                                                                                                            |
| ------------------ | ----------- | ---------- | --------------------------------------------------------------------------------------------------------------------- |
| `type`             | Так         | `string`   | Наразі `local-file-with-env`.                                                                                         |
| `fileEnvVar`       | Ні          | `string`   | Env var, що містить явний шлях до файлу облікових даних.                                                              |
| `fallbackPaths`    | Ні          | `string[]` | Локальні шляхи до файлів облікових даних, які перевіряються, коли `fileEnvVar` відсутня або порожня. Підтримує `${HOME}` і `${APPDATA}`. |
| `requiresAnyEnv`   | Ні          | `string[]` | Принаймні одна з перелічених env var має бути непорожньою, перш ніж доказ стане дійсним.                              |
| `requiresAllEnv`   | Ні          | `string[]` | Кожна з перелічених env var має бути непорожньою, перш ніж доказ стане дійсним.                                       |
| `credentialMarker` | Так         | `string`   | Несекретний маркер, що повертається, коли доказ присутній.                                                            |
| `source`           | Ні          | `string`   | Видима користувачу мітка джерела для виводу auth/status.                                                              |

### поля setup

| Поле               | Обов’язково | Тип        | Що означає                                                                                                  |
| ------------------ | ----------- | ---------- | ----------------------------------------------------------------------------------------------------------- |
| `providers`        | Ні          | `object[]` | Дескриптори налаштування провайдерів, доступні під час setup і onboarding.                                  |
| `cliBackends`      | Ні          | `string[]` | Ідентифікатори бекендів на час setup, які використовуються для пошуку setup спершу за дескриптором. Тримайте нормалізовані ідентифікатори глобально унікальними. |
| `configMigrations` | Ні          | `string[]` | Ідентифікатори міграцій конфігурації, якими володіє setup-поверхня цього plugin.                            |
| `requiresRuntime`  | Ні          | `boolean`  | Чи setup все ще потребує виконання `setup-api` після пошуку дескриптора.                                    |

## довідник uiHints

`uiHints` — це мапа з імен полів конфігурації до невеликих підказок рендерингу.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "help": "Used for OpenRouter requests",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

Кожна підказка поля може містити:

| Поле          | Тип        | Що означає                                |
| ------------- | ---------- | ------------------------------------------ |
| `label`       | `string`   | Видима користувачу мітка поля.             |
| `help`        | `string`   | Короткий допоміжний текст.                 |
| `tags`        | `string[]` | Необов’язкові UI-теги.                     |
| `advanced`    | `boolean`  | Позначає поле як розширене.                |
| `sensitive`   | `boolean`  | Позначає поле як секретне або чутливе.     |
| `placeholder` | `string`   | Текст placeholder для полів форми.         |

## довідник contracts

Використовуйте `contracts` лише для статичних метаданих володіння можливостями, які OpenClaw може
прочитати без імпорту runtime plugin.

```json
{
  "contracts": {
    "agentToolResultMiddleware": ["pi", "codex"],
    "externalAuthProviders": ["acme-ai"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "memoryEmbeddingProviders": ["local"],
    "mediaUnderstandingProviders": ["openai", "openai-codex"],
    "imageGenerationProviders": ["openai"],
    "videoGenerationProviders": ["qwen"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "migrationProviders": ["hermes"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Кожен список необов’язковий:

| Поле                             | Тип        | Що означає                                                                |
| -------------------------------- | ---------- | -------------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Ідентифікатори фабрик розширень app-server Codex, наразі `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | Runtime-ідентифікатори, для яких bundled plugin може реєструвати middleware результатів інструментів. |
| `externalAuthProviders`          | `string[]` | Ідентифікатори провайдерів, чий hook зовнішнього auth-профілю належить цьому plugin. |
| `speechProviders`                | `string[]` | Ідентифікатори провайдерів мовлення, якими володіє цей plugin.             |
| `realtimeTranscriptionProviders` | `string[]` | Ідентифікатори провайдерів транскрипції в реальному часі, якими володіє цей plugin. |
| `realtimeVoiceProviders`         | `string[]` | Ідентифікатори голосових провайдерів реального часу, якими володіє цей plugin. |
| `memoryEmbeddingProviders`       | `string[]` | Ідентифікатори провайдерів embedding пам’яті, якими володіє цей plugin.    |
| `mediaUnderstandingProviders`    | `string[]` | Ідентифікатори провайдерів розуміння медіа, якими володіє цей plugin.      |
| `imageGenerationProviders`       | `string[]` | Ідентифікатори провайдерів генерації зображень, якими володіє цей plugin.  |
| `videoGenerationProviders`       | `string[]` | Ідентифікатори провайдерів генерації відео, якими володіє цей plugin.      |
| `webFetchProviders`              | `string[]` | Ідентифікатори провайдерів web-fetch, якими володіє цей plugin.            |
| `webSearchProviders`             | `string[]` | Ідентифікатори провайдерів web-search, якими володіє цей plugin.           |
| `migrationProviders`             | `string[]` | Ідентифікатори провайдерів імпорту, якими цей plugin володіє для `openclaw migrate`. |
| `tools`                          | `string[]` | Імена інструментів агента, якими володіє цей plugin.                       |

`contracts.embeddedExtensionFactories` збережено для bundled фабрик розширень Codex,
призначених лише для app-server. Bundled трансформації результатів інструментів мають
оголошувати `contracts.agentToolResultMiddleware` і натомість реєструватися через
`api.registerAgentToolResultMiddleware(...)`. Зовнішні plugins не можуть
реєструвати middleware результатів інструментів, тому що цей seam може переписувати
вивід інструментів із високою довірою до того, як модель його побачить.

Runtime-реєстрації `api.registerTool(...)` мають відповідати `contracts.tools`.
Виявлення інструментів використовує цей список, щоб завантажувати лише runtime тих plugins, які можуть володіти
запитаними інструментами.

Provider plugins, які реалізують `resolveExternalAuthProfiles`, мають оголошувати
`contracts.externalAuthProviders`. Plugins без цього оголошення все ще запускаються
через застарілий fallback сумісності, але цей fallback повільніший і
буде вилучений після вікна міграції.

Bundled провайдери memory embedding мають оголошувати
`contracts.memoryEmbeddingProviders` для кожного ідентифікатора адаптера, який вони надають, включно з
вбудованими адаптерами, такими як `local`. Окремі CLI-шляхи використовують цей manifest
contract, щоб завантажувати лише plugin-власника до того, як повний runtime Gateway
зареєструє провайдерів.

## довідник mediaUnderstandingProviderMetadata

Використовуйте `mediaUnderstandingProviderMetadata`, коли провайдер розуміння медіа має
моделі за замовчуванням, пріоритет fallback для auto-auth або нативну підтримку документів, які
generic core helpers потребують до завантаження runtime. Ключі також мають бути оголошені в
`contracts.mediaUnderstandingProviders`.

```json
{
  "contracts": {
    "mediaUnderstandingProviders": ["example"]
  },
  "mediaUnderstandingProviderMetadata": {
    "example": {
      "capabilities": ["image", "audio"],
      "defaultModels": {
        "image": "example-vision-latest",
        "audio": "example-transcribe-latest"
      },
      "autoPriority": {
        "image": 40
      },
      "nativeDocumentInputs": ["pdf"]
    }
  }
}
```

Кожен запис провайдера може містити:

| Поле                   | Тип                                 | Що означає                                                                     |
| ---------------------- | ----------------------------------- | ------------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Медіаможливості, які надає цей провайдер.                                       |
| `defaultModels`        | `Record<string, string>`            | Значення capability-to-model за замовчуванням, які використовуються, коли конфігурація не вказує модель. |
| `autoPriority`         | `Record<string, number>`            | Менші числа сортуються раніше для автоматичного fallback провайдера на основі облікових даних. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Нативні входи документів, які підтримує провайдер.                              |

## довідник channelConfigs

Використовуйте `channelConfigs`, коли channel plugin потребує дешевих метаданих конфігурації до
завантаження runtime. Read-only виявлення setup/status каналу може використовувати ці метадані
безпосередньо для налаштованих зовнішніх каналів, коли немає запису setup, або
коли `setup.requiresRuntime: false` оголошує, що setup runtime не потрібен.

`channelConfigs` — це метадані manifest plugin, а не новий top-level розділ користувацької конфігурації.
Користувачі все ще налаштовують екземпляри каналів у `channels.<channel-id>`.
OpenClaw читає метадані manifest, щоб вирішити, який plugin володіє цим налаштованим
каналом до виконання runtime-коду plugin.

Для channel plugin `configSchema` і `channelConfigs` описують різні
шляхи:

- `configSchema` перевіряє `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` перевіряє `channels.<channel-id>`

Non-bundled plugins, які оголошують `channels[]`, також мають оголошувати відповідні
записи `channelConfigs`. Без них OpenClaw усе ще може завантажити plugin, але
cold-path схема конфігурації, setup і поверхні Control UI не можуть знати
форму параметрів, якими володіє канал, доки не виконається runtime plugin.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` і
`nativeSkillsAutoEnabled` можуть оголошувати статичні значення `auto` за замовчуванням для перевірок конфігурації команд,
які виконуються до завантаження runtime каналу. Bundled канали також можуть публікувати
ті самі значення за замовчуванням через `package.json#openclaw.channel.commands` поряд
з іншими package-owned метаданими каталогу каналів.

```json
{
  "channelConfigs": {
    "matrix": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "homeserverUrl": { "type": "string" }
        }
      },
      "uiHints": {
        "homeserverUrl": {
          "label": "Homeserver URL",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Matrix homeserver connection",
      "commands": {
        "nativeCommandsAutoEnabled": true,
        "nativeSkillsAutoEnabled": true
      },
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Кожен запис каналу може містити:

| Поле          | Тип                      | Що це означає                                                                                                           |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema для `channels.<id>`. Обов’язкова для кожного оголошеного запису конфігурації каналу.                       |
| `uiHints`     | `Record<string, object>` | Необов’язкові UI-мітки/заповнювачі/підказки про чутливість для цього розділу конфігурації каналу.                     |
| `label`       | `string`                 | Мітка каналу, що об’єднується з поверхнями вибору й інспектування, коли runtime-метадані ще не готові.                 |
| `description` | `string`                 | Короткий опис каналу для поверхонь інспектування й каталогу.                                                            |
| `commands`    | `object`                 | Статична нативна команда й автоматичні типові значення нативного skill для перевірок конфігурації до запуску runtime. |
| `preferOver`  | `string[]`               | Ідентифікатори застарілих або нижчопріоритетних plugin, які цей канал має випереджати на поверхнях вибору.             |

### Заміна іншого plugin каналу

Використовуйте `preferOver`, коли ваш plugin є бажаним власником для ідентифікатора каналу, який
також може надавати інший plugin. Типові випадки: перейменований ідентифікатор plugin,
самостійний plugin, що замінює вбудований plugin, або підтримуваний форк, який
зберігає той самий ідентифікатор каналу для сумісності конфігурації.

```json
{
  "id": "acme-chat",
  "channels": ["chat"],
  "channelConfigs": {
    "chat": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "webhookUrl": { "type": "string" }
        }
      },
      "preferOver": ["chat"]
    }
  }
}
```

Коли налаштовано `channels.chat`, OpenClaw враховує і ідентифікатор каналу, і
ідентифікатор бажаного plugin. Якщо нижчопріоритетний plugin було вибрано лише тому,
що він вбудований або увімкнений за замовчуванням, OpenClaw вимикає його в ефективній
runtime-конфігурації, щоб каналом і його інструментами володів один plugin. Явний
вибір користувача все ще має перевагу: якщо користувач явно вмикає обидва plugin, OpenClaw
зберігає цей вибір і повідомляє діагностику дубльованих каналів/інструментів замість
тихої зміни запитаного набору plugin.

Обмежуйте `preferOver` ідентифікаторами plugin, які справді можуть надавати той самий канал.
Це не загальне поле пріоритету, і воно не перейменовує ключі користувацької конфігурації.

## Довідник modelSupport

Використовуйте `modelSupport`, коли OpenClaw має виводити ваш provider plugin із
скорочених ідентифікаторів моделей, як-от `gpt-5.5` або `claude-sonnet-4.6`, до завантаження
runtime plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw застосовує такий пріоритет:

- явні посилання `provider/model` використовують метадані маніфесту `providers` власника
- `modelPatterns` мають перевагу над `modelPrefixes`
- якщо збігаються один невбудований plugin і один вбудований plugin, перемагає невбудований
  plugin
- решта неоднозначностей ігнорується, доки користувач або конфігурація не вкаже provider

Поля:

| Поле            | Тип        | Що це означає                                                                                 |
| --------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Префікси, що зіставляються через `startsWith` зі скороченими ідентифікаторами моделей.        |
| `modelPatterns` | `string[]` | Джерела regex, що зіставляються зі скороченими ідентифікаторами моделей після вилучення суфікса профілю. |

## Довідник modelCatalog

Використовуйте `modelCatalog`, коли OpenClaw має знати метадані моделей provider до
завантаження runtime plugin. Це джерело, що належить маніфесту, для фіксованих рядків каталогу,
псевдонімів provider, правил приглушення й режиму виявлення. Runtime-оновлення
й надалі належить runtime-коду provider, але маніфест повідомляє ядру, коли потрібен runtime.

```json
{
  "providers": ["openai"],
  "modelCatalog": {
    "providers": {
      "openai": {
        "baseUrl": "https://api.openai.com/v1",
        "api": "openai-responses",
        "models": [
          {
            "id": "gpt-5.4",
            "name": "GPT-5.4",
            "input": ["text", "image"],
            "reasoning": true,
            "contextWindow": 256000,
            "maxTokens": 128000,
            "cost": {
              "input": 1.25,
              "output": 10,
              "cacheRead": 0.125
            },
            "status": "available",
            "tags": ["default"]
          }
        ]
      }
    },
    "aliases": {
      "azure-openai-responses": {
        "provider": "openai",
        "api": "azure-openai-responses"
      }
    },
    "suppressions": [
      {
        "provider": "azure-openai-responses",
        "model": "gpt-5.3-codex-spark",
        "reason": "not available on Azure OpenAI Responses"
      }
    ],
    "discovery": {
      "openai": "static"
    }
  }
}
```

Поля верхнього рівня:

| Поле           | Тип                                                      | Що це означає                                                                                                      |
| -------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `providers`    | `Record<string, object>`                                 | Рядки каталогу для ідентифікаторів provider, якими володіє цей plugin. Ключі також мають бути в `providers` верхнього рівня. |
| `aliases`      | `Record<string, object>`                                 | Псевдоніми provider, які мають розв’язуватися до належного provider для планування каталогу або приглушення.       |
| `suppressions` | `object[]`                                               | Рядки моделей з іншого джерела, які цей plugin приглушує з причини, специфічної для provider.                     |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Чи можна каталог provider прочитати з метаданих маніфесту, оновити в кеш або чи він потребує runtime.             |

`aliases` бере участь у пошуку власника provider для планування каталогу моделей.
Цілі псевдонімів мають бути provider верхнього рівня, якими володіє той самий plugin. Коли
список, відфільтрований за provider, використовує псевдонім, OpenClaw може прочитати маніфест власника й
застосувати перевизначення API/base URL псевдоніма без завантаження runtime provider.
Псевдоніми не розгортають нефільтровані списки каталогу; широкі списки виводять лише рядки
канонічного provider власника.

`suppressions` замінює старий runtime-хук provider `suppressBuiltInModel`.
Записи приглушення враховуються лише тоді, коли provider належить plugin або
оголошений як ключ `modelCatalog.aliases`, що вказує на належний provider. Runtime-хуки
приглушення більше не викликаються під час розв’язання моделей.

Поля provider:

| Поле      | Тип                      | Що це означає                                                                    |
| --------- | ------------------------ | -------------------------------------------------------------------------------- |
| `baseUrl` | `string`                 | Необов’язковий типовий base URL для моделей у цьому каталозі provider.           |
| `api`     | `ModelApi`               | Необов’язковий типовий API-адаптер для моделей у цьому каталозі provider.        |
| `headers` | `Record<string, string>` | Необов’язкові статичні заголовки, що застосовуються до цього каталогу provider. |
| `models`  | `object[]`               | Обов’язкові рядки моделей. Рядки без `id` ігноруються.                           |

Поля моделі:

| Поле            | Тип                                                            | Що це означає                                                                                 |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `id`            | `string`                                                       | Локальний для provider ідентифікатор моделі, без префікса `provider/`.                        |
| `name`          | `string`                                                       | Необов’язкова відображувана назва.                                                            |
| `api`           | `ModelApi`                                                     | Необов’язкове перевизначення API для окремої моделі.                                          |
| `baseUrl`       | `string`                                                       | Необов’язкове перевизначення base URL для окремої моделі.                                     |
| `headers`       | `Record<string, string>`                                       | Необов’язкові статичні заголовки для окремої моделі.                                          |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Модальності, які приймає модель.                                                              |
| `reasoning`     | `boolean`                                                      | Чи надає модель reasoning-поведінку.                                                          |
| `contextWindow` | `number`                                                       | Нативне контекстне вікно provider.                                                            |
| `contextTokens` | `number`                                                       | Необов’язкове ефективне runtime-обмеження контексту, коли воно відрізняється від `contextWindow`. |
| `maxTokens`     | `number`                                                       | Максимальна кількість вихідних токенів, якщо відома.                                          |
| `cost`          | `object`                                                       | Необов’язкова ціна в USD за мільйон токенів, включно з необов’язковим `tieredPricing`.        |
| `compat`        | `object`                                                       | Необов’язкові прапорці сумісності, що відповідають сумісності конфігурації моделей OpenClaw. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Статус у списку. Приглушуйте лише тоді, коли рядок узагалі не має з’являтися.                 |
| `statusReason`  | `string`                                                       | Необов’язкова причина, що показується зі статусом, відмінним від available.                   |
| `replaces`      | `string[]`                                                     | Старі локальні для provider ідентифікатори моделей, які ця модель замінює.                    |
| `replacedBy`    | `string`                                                       | Локальний для provider ідентифікатор моделі-заміни для застарілих рядків.                     |
| `tags`          | `string[]`                                                     | Стабільні теги, які використовують засоби вибору й фільтри.                                   |

Поля приглушення:

| Поле                       | Тип        | Що це означає                                                                                                      |
| -------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------ |
| `provider`                 | `string`   | Ідентифікатор provider для вищого рядка, який потрібно приглушити. Має належати цьому plugin або бути оголошеним як належний псевдонім. |
| `model`                    | `string`   | Локальний для provider ідентифікатор моделі, яку потрібно приглушити.                                             |
| `reason`                   | `string`   | Необов’язкове повідомлення, що показується, коли приглушений рядок запитують напряму.                            |
| `when.baseUrlHosts`        | `string[]` | Необов’язковий список ефективних хостів base URL provider, потрібних перед застосуванням приглушення.             |
| `when.providerConfigApiIn` | `string[]` | Необов’язковий список точних значень `api` конфігурації provider, потрібних перед застосуванням приглушення.      |

Не розміщуйте дані лише для runtime у `modelCatalog`. Використовуйте `static` лише тоді, коли рядки manifest
достатньо повні, щоб поверхні списку й вибору з фільтрацією за provider могли пропускати
виявлення через registry/runtime. Використовуйте `refreshable`, коли рядки manifest є корисними
початковими або додатковими елементами, придатними до спискування, але refresh/cache може додати більше рядків пізніше;
refreshable-рядки самі по собі не є авторитетними. Використовуйте `runtime`, коли OpenClaw
має завантажити provider runtime, щоб дізнатися список.

## Довідник modelIdNormalization

Використовуйте `modelIdNormalization` для дешевого, належного provider очищення model-id, яке має
відбутися до завантаження provider runtime. Це зберігає aliases, як-от короткі назви моделей,
локальні для provider застарілі ids і правила proxy-префіксів у manifest власного plugin,
а не в core таблицях вибору моделей.

```json
{
  "providers": ["anthropic", "openrouter"],
  "modelIdNormalization": {
    "providers": {
      "anthropic": {
        "aliases": {
          "sonnet-4.6": "claude-sonnet-4-6"
        }
      },
      "openrouter": {
        "prefixWhenBare": "openrouter"
      }
    }
  }
}
```

Поля provider:

| Поле                                | Тип                     | Що це означає                                                                                  |
| ----------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| `aliases`                           | `Record<string,string>` | Точні aliases model-id без урахування регістру. Значення повертаються так, як записані.        |
| `stripPrefixes`                     | `string[]`              | Префікси, які слід вилучити перед пошуком alias; корисно для застарілого дублювання provider/model. |
| `prefixWhenBare`                    | `string`                | Префікс, який слід додати, коли нормалізований id моделі ще не містить `/`.                    |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Умовні правила префіксів для голих ids після пошуку alias, keyed by `modelPrefix` and `prefix`. |

## Довідник providerEndpoints

Використовуйте `providerEndpoints` для класифікації endpoints, яку generic request policy
має знати до завантаження provider runtime. Core і далі володіє значенням кожного
`endpointClass`; plugin manifests володіють metadata host і base URL.

Поля endpoint:

| Поле                          | Тип        | Що це означає                                                                                  |
| ----------------------------- | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`               | `string`   | Відомий core клас endpoint, як-от `openrouter`, `moonshot-native` або `google-vertex`.         |
| `hosts`                       | `string[]` | Точні hostnames, що відповідають класу endpoint.                                               |
| `hostSuffixes`                | `string[]` | Суфікси host, що відповідають класу endpoint. Додайте префікс `.` для зіставлення лише із суфіксом domain. |
| `baseUrls`                    | `string[]` | Точні нормалізовані HTTP(S) base URLs, що відповідають класу endpoint.                         |
| `googleVertexRegion`          | `string`   | Статичний регіон Google Vertex для точних global hosts.                                        |
| `googleVertexRegionHostSuffix` | `string`  | Суфікс, який слід відкинути з відповідних hosts, щоб відкрити префікс регіону Google Vertex.   |

## Довідник providerRequest

Використовуйте `providerRequest` для дешевої metadata сумісності запитів, яка потрібна generic
request policy без завантаження provider runtime. Переписування payload, специфічне для поведінки,
залишайте в provider runtime hooks або shared helpers сімейства provider.

```json
{
  "providers": ["vllm"],
  "providerRequest": {
    "providers": {
      "vllm": {
        "family": "vllm",
        "openAICompletions": {
          "supportsStreamingUsage": true
        }
      }
    }
  }
}
```

Поля provider:

| Поле                  | Тип          | Що це означає                                                                                 |
| --------------------- | ------------ | --------------------------------------------------------------------------------------------- |
| `family`              | `string`     | Мітка сімейства provider, яку використовують generic рішення сумісності запитів і diagnostics. |
| `compatibilityFamily` | `"moonshot"` | Необов’язковий bucket сумісності сімейства provider для shared request helpers.                |
| `openAICompletions`   | `object`     | Прапорці запитів completions, сумісних з OpenAI, наразі `supportsStreamingUsage`.              |

## Довідник modelPricing

Використовуйте `modelPricing`, коли provider потребує поведінки pricing control-plane до
завантаження runtime. Gateway pricing cache читає цю metadata без import
коду provider runtime.

```json
{
  "providers": ["ollama", "openrouter"],
  "modelPricing": {
    "providers": {
      "ollama": {
        "external": false
      },
      "openrouter": {
        "openRouter": {
          "passthroughProviderModel": true
        },
        "liteLLM": false
      }
    }
  }
}
```

Поля provider:

| Поле         | Тип               | Що це означає                                                                                         |
| ------------ | ----------------- | ----------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Установіть `false` для локальних/self-hosted providers, які ніколи не мають отримувати pricing OpenRouter або LiteLLM. |
| `openRouter` | `false \| object` | Відображення пошуку pricing OpenRouter. `false` вимикає пошук OpenRouter для цього provider.          |
| `liteLLM`    | `false \| object` | Відображення пошуку pricing LiteLLM. `false` вимикає пошук LiteLLM для цього provider.                |

Поля source:

| Поле                       | Тип                | Що це означає                                                                                                      |
| -------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `provider`                 | `string`           | Id provider зовнішнього catalog, коли він відрізняється від id provider OpenClaw, наприклад `z-ai` для provider `zai`. |
| `passthroughProviderModel` | `boolean`          | Розглядати ids моделей із slash як вкладені посилання provider/model; корисно для proxy providers, як-от OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Додаткові варіанти model-id зовнішнього catalog. `version-dots` пробує ids версій із крапками, як-от `claude-opus-4.6`. |

### OpenClaw Provider Index

OpenClaw Provider Index — це належна OpenClaw preview metadata для providers,
чиї plugins можуть бути ще не встановлені. Він не є частиною plugin manifest.
Plugin manifests залишаються авторитетом установленого plugin. Provider Index — це
внутрішній fallback contract, який майбутні поверхні installable-provider і pre-install
model picker споживатимуть, коли provider plugin не встановлено.

Порядок авторитетності catalog:

1. Конфігурація користувача.
2. Installed plugin manifest `modelCatalog`.
3. Model catalog cache з явного refresh.
4. Preview-рядки OpenClaw Provider Index.

Provider Index не має містити secrets, enabled state, runtime hooks або
live account-specific model data. Його preview catalogs використовують таку саму
форму рядка provider `modelCatalog`, як і plugin manifests, але мають залишатися обмеженими
стабільною display metadata, якщо runtime adapter fields, як-от `api`,
`baseUrl`, pricing або compatibility flags, не підтримуються навмисно узгодженими з
установленим plugin manifest. Providers із live `/models` discovery мають
записувати refreshed rows через явний шлях model catalog cache замість того, щоб
звичайне listing або onboarding викликали provider APIs.

Записи Provider Index також можуть містити metadata installable-plugin для providers,
чий plugin було винесено з core або ще не встановлено з іншої причини. Ця
metadata віддзеркалює pattern channel catalog: package name, npm install spec,
expected integrity і дешевих auth-choice labels достатньо, щоб показати
installable setup option. Щойно plugin встановлено, його manifest має перевагу, а
запис Provider Index ігнорується для цього provider.

Застарілі top-level capability keys оголошено deprecated. Використовуйте `openclaw doctor --fix`, щоб
перемістити `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` і `webSearchProviders` під `contracts`; звичайне
завантаження manifest більше не трактує ці top-level fields як capability
ownership.

## Manifest проти package.json

Ці два файли виконують різні завдання:

| Файл                   | Для чого використовувати                                                                                                  |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Discovery, config validation, auth-choice metadata і UI hints, які мають існувати до запуску коду plugin                  |
| `package.json`         | npm metadata, встановлення dependencies і блок `openclaw`, що використовується для entrypoints, install gating, setup або catalog metadata |

Якщо ви не впевнені, де має бути певна metadata, скористайтеся цим правилом:

- якщо OpenClaw має знати це до завантаження коду plugin, помістіть це в `openclaw.plugin.json`
- якщо це стосується packaging, entry files або поведінки npm install, помістіть це в `package.json`

### Поля package.json, що впливають на discovery

Деяка pre-runtime plugin metadata навмисно розміщується в `package.json` у блоці
`openclaw`, а не в `openclaw.plugin.json`.
`openclaw.bundle` і `openclaw.bundle.json` не є plugin contracts OpenClaw;
native plugins мають використовувати `openclaw.plugin.json` плюс підтримувані
поля `package.json#openclaw` нижче.

Важливі приклади:

| Поле                                                                                      | Що це означає                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                                                      | Оголошує нативні точки входу плагіна. Має залишатися всередині каталогу пакета плагіна.                                                                                                   |
| `openclaw.runtimeExtensions`                                                               | Оголошує зібрані точки входу JavaScript runtime для встановлених пакетів. Має залишатися всередині каталогу пакета плагіна.                                                                 |
| `openclaw.setupEntry`                                                                      | Легка точка входу лише для налаштування, що використовується під час onboarding, відкладеного запуску каналу та read-only виявлення статусу каналу/SecretRef. Має залишатися всередині каталогу пакета плагіна. |
| `openclaw.runtimeSetupEntry`                                                               | Оголошує зібрану точку входу JavaScript для налаштування встановлених пакетів. Потребує `setupEntry`, має існувати та має залишатися всередині каталогу пакета плагіна.                         |
| `openclaw.channel`                                                                         | Дешева metadata каталогу каналів, як-от мітки, шляхи до docs, aliases і текст вибору.                                                                                                 |
| `openclaw.channel.commands`                                                                | Статична metadata нативних команд і автоматичних значень за замовчуванням для нативних skill, що використовується config, audit і поверхнями списку команд до завантаження channel runtime.                                          |
| `openclaw.channel.configuredState`                                                         | Легка metadata перевірки configured-state, яка може відповісти "чи вже існує налаштування лише через env?" без завантаження повного channel runtime.                                         |
| `openclaw.channel.persistedAuthState`                                                      | Легка metadata перевірки persisted-auth, яка може відповісти "чи вже хтось увійшов?" без завантаження повного channel runtime.                                               |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Підказки встановлення/оновлення для bundled і зовнішньо опублікованих плагінів.                                                                                                                   |
| `openclaw.install.defaultChoice`                                                           | Бажаний шлях встановлення, коли доступно кілька джерел встановлення.                                                                                                                  |
| `openclaw.install.minHostVersion`                                                          | Мінімальна підтримувана версія host OpenClaw із використанням нижньої межі semver, як-от `>=2026.3.22` або `>=2026.5.1-beta.1`.                                                                             |
| `openclaw.install.expectedIntegrity`                                                       | Очікуваний рядок integrity npm dist, наприклад `sha512-...`; потоки встановлення й оновлення перевіряють отриманий artifact щодо нього.                                                            |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Дозволяє вузький шлях відновлення перевстановлення bundled-plugin, коли config недійсний.                                                                                                       |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Дає змогу поверхням каналу лише для налаштування завантажуватися до повного плагіна каналу під час startup.                                                                                                 |

Manifest metadata визначає, які варіанти provider/channel/setup з'являються в
onboarding до завантаження runtime. `package.json#openclaw.install` повідомляє
onboarding, як отримати або увімкнути цей плагін, коли користувач вибирає один із цих
варіантів. Не переносіть підказки встановлення в `openclaw.plugin.json`.

`openclaw.install.minHostVersion` застосовується під час встановлення та завантаження
manifest registry для небандлених джерел плагінів. Недійсні значення відхиляються;
новіші, але дійсні значення пропускають зовнішні плагіни на старіших hosts. Bundled source
plugins вважаються співверсійними з host checkout.

Офіційна metadata install-on-demand має використовувати `clawhubSpec`, коли плагін
опубліковано на ClawHub; onboarding розглядає це як бажане remote source і
записує факти artifact ClawHub після встановлення. `npmSpec` залишається fallback
сумісності для пакетів, які ще не перейшли на ClawHub.

Точне закріплення версії npm уже міститься в `npmSpec`, наприклад
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Офіційні записи зовнішнього catalog
мають поєднувати точні specs з `expectedIntegrity`, щоб потоки оновлення fail
closed, якщо отриманий npm artifact більше не відповідає закріпленому release.
Interactive onboarding усе ще пропонує довірені registry npm specs, включно з bare
іменами пакетів і dist-tags, для сумісності. Catalog diagnostics можуть
розрізняти exact, floating, integrity-pinned, missing-integrity, package-name
mismatch і invalid default-choice sources. Вони також попереджають, коли
`expectedIntegrity` присутній, але немає дійсного npm source, який він може закріпити.
Коли `expectedIntegrity` присутній,
потоки install/update забезпечують його дотримання; коли його пропущено, registry resolution
записується без integrity pin.

Плагіни каналів мають надавати `openclaw.setupEntry`, коли status, список каналів
або SecretRef scans мають ідентифікувати налаштовані accounts без завантаження повного
runtime. Точка входу setup має відкривати metadata каналу плюс setup-safe config,
status і secrets adapters; тримайте network clients, gateway listeners і
transport runtimes в основній точці входу extension.

Поля runtime entrypoint не перевизначають перевірки package-boundary для source
entrypoint fields. Наприклад, `openclaw.runtimeExtensions` не може зробити
escaping шлях `openclaw.extensions` завантажуваним.

`openclaw.install.allowInvalidConfigRecovery` навмисно вузький. Він не робить
довільні зламані configs installable. Наразі він лише дозволяє install
flows відновлюватися після конкретних stale bundled-plugin upgrade failures, таких як
відсутній шлях bundled plugin або stale запис `channels.<id>` для того самого
bundled plugin. Непов'язані config errors усе ще блокують install і спрямовують operators
до `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` — це package metadata для крихітного checker
module:

```json
{
  "openclaw": {
    "channel": {
      "id": "whatsapp",
      "persistedAuthState": {
        "specifier": "./auth-presence",
        "exportName": "hasAnyWhatsAppAuth"
      }
    }
  }
}
```

Використовуйте це, коли setup, doctor, status або read-only presence flows потребують дешевого
yes/no auth probe до завантаження повного channel plugin. Persisted auth state не є
configured channel state: не використовуйте цю metadata для auto-enable плагінів,
repair runtime dependencies або рішення, чи має завантажуватися channel runtime.
Цільовий export має бути малою функцією, що читає лише persisted state; не
маршрутизуйте її через повний channel runtime barrel.

`openclaw.channel.configuredState` має таку саму форму для дешевих env-only
configured checks:

```json
{
  "openclaw": {
    "channel": {
      "id": "telegram",
      "configuredState": {
        "specifier": "./configured-state",
        "exportName": "hasTelegramConfiguredState"
      }
    }
  }
}
```

Використовуйте це, коли канал може відповісти на configured-state з env або інших малих
non-runtime inputs. Якщо перевірка потребує повного config resolution або справжнього
channel runtime, залиште цю logic у hook плагіна `config.hasConfiguredState`.

## Пріоритет виявлення (дублікати ідентифікаторів плагінів)

OpenClaw виявляє плагіни з кількох roots (bundled, global install, workspace, explicit config-selected paths). Якщо два виявлення мають той самий `id`, зберігається лише **highest-precedence** manifest; duplicates із нижчим precedence відкидаються замість завантаження поруч із ним.

Precedence, від найвищого до найнижчого:

1. **Config-selected** — шлях, явно закріплений у `plugins.entries.<id>`
2. **Bundled** — плагіни, що постачаються з OpenClaw
3. **Global install** — плагіни, встановлені в global OpenClaw plugin root
4. **Workspace** — плагіни, виявлені відносно поточного workspace

Наслідки:

- Forked або stale копія bundled plugin, що лежить у workspace, не shadow bundled build.
- Щоб справді override bundled plugin локальним, закріпіть його через `plugins.entries.<id>`, щоб він переміг за precedence, а не покладайтеся на workspace discovery.
- Duplicate drops логуються, щоб Doctor і startup diagnostics могли вказати на discarded copy.
- Config-selected duplicate overrides формулюються як explicit overrides у diagnostics, але все одно попереджають, щоб stale forks і accidental shadows залишалися видимими.

## Вимоги JSON Schema

- **Кожен плагін має постачати JSON Schema**, навіть якщо він не приймає config.
- Порожня schema прийнятна (наприклад, `{ "type": "object", "additionalProperties": false }`).
- Schemas перевіряються під час config read/write, а не під час runtime.
- Під час розширення або forking bundled plugin новими config keys оновіть `configSchema` цього плагіна в `openclaw.plugin.json` одночасно. Schemas bundled plugin є strict, тож додавання `plugins.entries.<id>.config.myNewKey` у user config без додавання `myNewKey` до `configSchema.properties` буде відхилено до завантаження plugin runtime.

Приклад розширення schema:

```json
{
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "myNewKey": {
        "type": "string"
      }
    }
  }
}
```

## Поведінка валідації

- Невідомі keys `channels.*` є **errors**, якщо channel id не оголошено
  plugin manifest.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` і `plugins.slots.*`
  мають посилатися на **discoverable** plugin ids. Невідомі ids є **errors**.
- Якщо плагін встановлено, але він має broken або missing manifest чи schema,
  validation fails, і Doctor повідомляє plugin error.
- Якщо plugin config існує, але плагін **disabled**, config зберігається, і
  **warning** показується в Doctor + logs.

Див. [Довідник конфігурації](/uk/gateway/configuration) для повної schema `plugins.*`.

## Примітки

- Маніфест **обов’язковий для нативних Plugin OpenClaw**, включно із завантаженнями з локальної файлової системи. Середовище виконання все ще завантажує модуль Plugin окремо; маніфест призначений лише для виявлення + валідації.
- Нативні маніфести аналізуються за допомогою JSON5, тому коментарі, кінцеві коми та ключі без лапок приймаються, доки підсумкове значення все ще є об’єктом.
- Завантажувач маніфесту читає лише задокументовані поля маніфесту. Уникайте власних ключів верхнього рівня.
- `channels`, `providers`, `cliBackends` і `skills` можна не вказувати, якщо Plugin їх не потребує.
- `providerDiscoveryEntry` має залишатися легким і не повинен імпортувати широкий код середовища виконання; використовуйте його для статичних метаданих каталогу провайдерів або вузьких дескрипторів виявлення, а не для виконання під час запиту.
- Ексклюзивні типи Plugin вибираються через `plugins.slots.*`: `kind: "memory"` через `plugins.slots.memory`, `kind: "context-engine"` через `plugins.slots.contextEngine` (типово `legacy`).
- Оголошуйте ексклюзивний тип Plugin у цьому маніфесті. `OpenClawPluginDefinition.kind` у точці входу середовища виконання застаріло й залишається лише як резервна сумісність для старіших Plugin.
- Метадані змінних середовища (`setup.providers[].envVars`, застаріле `providerAuthEnvVars` і `channelEnvVars`) є лише декларативними. Статус, аудит, перевірка доставки Cron та інші поверхні лише для читання все ще застосовують довіру до Plugin і політику ефективної активації, перш ніж вважати змінну середовища налаштованою.
- Для метаданих майстра середовища виконання, які потребують коду провайдера, див. [хуки середовища виконання провайдера](/uk/plugins/architecture-internals#provider-runtime-hooks).
- Якщо ваш Plugin залежить від нативних модулів, задокументуйте кроки збирання та всі вимоги до allowlist менеджера пакетів (наприклад, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Пов’язане

<CardGroup cols={3}>
  <Card title="Створення Plugin" href="/uk/plugins/building-plugins" icon="rocket">
    Початок роботи з Plugin.
  </Card>
  <Card title="Архітектура Plugin" href="/uk/plugins/architecture" icon="diagram-project">
    Внутрішня архітектура та модель можливостей.
  </Card>
  <Card title="Огляд SDK" href="/uk/plugins/sdk-overview" icon="book">
    Довідник Plugin SDK та імпорти підшляхів.
  </Card>
</CardGroup>
