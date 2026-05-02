---
read_when:
    - Ви створюєте Plugin OpenClaw
    - Потрібно постачити схему конфігурації Plugin або діагностувати помилки валідації Plugin
summary: Вимоги до маніфесту Plugin + JSON-схеми (сувора валідація конфігурації)
title: Маніфест Plugin
x-i18n:
    generated_at: "2026-05-02T05:25:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 371a7364374df57c0b4a55229b86beea24140d0b352a54e8281e103bf66f5662
    source_path: plugins/manifest.md
    workflow: 16
---

Ця сторінка стосується лише **нативного маніфесту Plugin OpenClaw**.

Сумісні структури бандлів див. у [бандлах Plugin](/uk/plugins/bundles).

Сумісні формати бандлів використовують інші файли маніфестів:

- Бандл Codex: `.codex-plugin/plugin.json`
- Бандл Claude: `.claude-plugin/plugin.json` або типова структура компонента Claude
  без маніфесту
- Бандл Cursor: `.cursor-plugin/plugin.json`

OpenClaw також автоматично виявляє ці структури бандлів, але вони не перевіряються
за схемою `openclaw.plugin.json`, описаною тут.

Для сумісних бандлів OpenClaw наразі читає метадані бандла, а також оголошені
корені skill, корені команд Claude, типові значення `settings.json` бандла Claude,
типові значення LSP бандла Claude і підтримувані пакети hook, коли структура відповідає
очікуванням runtime OpenClaw.

Кожен нативний Plugin OpenClaw **повинен** постачати файл `openclaw.plugin.json` у
**корені Plugin**. OpenClaw використовує цей маніфест, щоб перевіряти конфігурацію
**без виконання коду Plugin**. Відсутні або недійсні маніфести вважаються
помилками Plugin і блокують перевірку конфігурації.

Див. повний посібник із системи Plugin: [Plugins](/uk/tools/plugin).
Для нативної моделі можливостей і поточних рекомендацій щодо зовнішньої сумісності:
[Модель можливостей](/uk/plugins/architecture#public-capability-model).

## Що робить цей файл

`openclaw.plugin.json` — це метадані, які OpenClaw читає **до завантаження вашого
коду Plugin**. Усе нижче має бути достатньо дешевим для перевірки без запуску
runtime Plugin.

**Використовуйте його для:**

- ідентичності Plugin, перевірки конфігурації та підказок UI конфігурації
- метаданих автентифікації, onboarding і налаштування (alias, auto-enable, змінні середовища провайдера, варіанти автентифікації)
- підказок активації для поверхонь control-plane
- скороченого володіння сімейством моделей
- статичних знімків володіння можливостями (`contracts`)
- метаданих QA runner, які може перевіряти спільний хост `openclaw qa`
- метаданих конфігурації, специфічних для каналів, об’єднаних у каталог і поверхні перевірки

**Не використовуйте його для:** реєстрації runtime-поведінки, оголошення entrypoint коду
або метаданих npm install. Вони належать до вашого коду Plugin і `package.json`.

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

| Поле                                 | Обов'язкове | Тип                              | Що це означає                                                                                                                                                                                                                     |
| ------------------------------------ | ----------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Так         | `string`                         | Канонічний id Plugin. Це id, що використовується в `plugins.entries.<id>`.                                                                                                                                                       |
| `configSchema`                       | Так         | `object`                         | Вбудована JSON Schema для конфігурації цього Plugin.                                                                                                                                                                             |
| `enabledByDefault`                   | Ні          | `true`                           | Позначає вбудований Plugin як увімкнений за замовчуванням. Пропустіть це поле або задайте будь-яке значення, відмінне від `true`, щоб залишити Plugin вимкненим за замовчуванням.                                                |
| `legacyPluginIds`                    | Ні          | `string[]`                       | Застарілі ids, що нормалізуються до цього канонічного id Plugin.                                                                                                                                                                 |
| `autoEnableWhenConfiguredProviders`  | Ні          | `string[]`                       | ids провайдерів, які мають автоматично вмикати цей Plugin, коли auth, config або model refs згадують їх.                                                                                                                        |
| `kind`                               | Ні          | `"memory"` \| `"context-engine"` | Оголошує ексклюзивний тип Plugin, що використовується `plugins.slots.*`.                                                                                                                                                         |
| `channels`                           | Ні          | `string[]`                       | ids каналів, якими володіє цей Plugin. Використовується для виявлення та перевірки конфігурації.                                                                                                                                 |
| `providers`                          | Ні          | `string[]`                       | ids провайдерів, якими володіє цей Plugin.                                                                                                                                                                                       |
| `providerDiscoveryEntry`             | Ні          | `string`                         | Шлях до легковажного модуля виявлення провайдерів, відносний до кореня Plugin, для метаданих каталогу провайдерів у межах маніфесту, які можна завантажити без активації повного runtime Plugin.                                |
| `modelSupport`                       | Ні          | `object`                         | Скорочені метадані сімейств моделей, що належать маніфесту й використовуються для автозавантаження Plugin перед runtime.                                                                                                         |
| `modelCatalog`                       | Ні          | `object`                         | Декларативні метадані каталогу моделей для провайдерів, якими володіє цей Plugin. Це контракт control-plane для майбутнього спискування лише для читання, onboarding, вибору моделей, alias і suppression без завантаження runtime Plugin. |
| `modelPricing`                       | Ні          | `object`                         | Політика пошуку зовнішніх цін, що належить провайдеру. Використовуйте її, щоб виключити локальних/self-hosted провайдерів із віддалених каталогів цін або зіставити provider refs з ids каталогів OpenRouter/LiteLLM без hardcoding ids провайдерів у core. |
| `modelIdNormalization`               | Ні          | `object`                         | Очищення alias/prefix model-id, що належить провайдеру й має виконуватися перед завантаженням runtime провайдера.                                                                                                                |
| `providerEndpoints`                  | Ні          | `object[]`                       | Метадані endpoint host/baseUrl, що належать маніфесту, для маршрутів провайдера, які core має класифікувати перед завантаженням runtime провайдера.                                                                               |
| `providerRequest`                    | Ні          | `object`                         | Дешеві метадані сімейства провайдера та сумісності запиту, що використовуються загальною політикою запитів перед завантаженням runtime провайдера.                                                                               |
| `cliBackends`                        | Ні          | `string[]`                       | ids бекендів інференсу CLI, якими володіє цей Plugin. Використовується для автоактивації під час запуску з явних config refs.                                                                                                     |
| `syntheticAuthRefs`                  | Ні          | `string[]`                       | refs провайдера або бекенда CLI, чий synthetic auth hook, що належить Plugin, має перевірятися під час холодного виявлення моделей перед завантаженням runtime.                                                                  |
| `nonSecretAuthMarkers`               | Ні          | `string[]`                       | Значення placeholder API key, що належать вбудованому Plugin і представляють несекретний локальний, OAuth або ambient стан облікових даних.                                                                                       |
| `commandAliases`                     | Ні          | `object[]`                       | Імена команд, якими володіє цей Plugin і які мають створювати Plugin-aware діагностику конфігурації та CLI перед завантаженням runtime.                                                                                          |
| `providerAuthEnvVars`                | Ні          | `Record<string, string[]>`       | Застарілі сумісні env-метадані для пошуку auth/status провайдера. Для нових plugins віддавайте перевагу `setup.providers[].envVars`; OpenClaw досі читає це під час періоду вилучення.                                          |
| `providerAuthAliases`                | Ні          | `Record<string, string>`         | ids провайдерів, які мають повторно використовувати інший id провайдера для auth lookup, наприклад coding provider, що спільно використовує API key базового провайдера та auth profiles.                                        |
| `channelEnvVars`                     | Ні          | `Record<string, string[]>`       | Дешеві env-метадані каналу, які OpenClaw може перевіряти без завантаження коду Plugin. Використовуйте це для env-driven налаштування каналу або auth surfaces, які мають бачити загальні startup/config helpers.                 |
| `providerAuthChoices`                | Ні          | `object[]`                       | Дешеві метадані auth-choice для onboarding pickers, preferred-provider resolution і простого підключення прапорців CLI.                                                                                                          |
| `activation`                         | Ні          | `object`                         | Дешеві метадані планувальника активації для завантаження, ініційованого запуском, провайдером, командою, каналом, маршрутом і capability. Лише метадані; фактична поведінка все ще належить runtime Plugin.                      |
| `setup`                              | Ні          | `object`                         | Дешеві дескриптори setup/onboarding, які поверхні виявлення та налаштування можуть перевіряти без завантаження runtime Plugin.                                                                                                   |
| `qaRunners`                          | Ні          | `object[]`                       | Дешеві дескриптори QA runner, що використовуються спільним хостом `openclaw qa` перед завантаженням runtime Plugin.                                                                                                              |
| `contracts`                          | Ні          | `object`                         | Статичний знімок ownership можливостей для зовнішніх auth hooks, speech, realtime transcription, realtime voice, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search і tool ownership. |
| `mediaUnderstandingProviderMetadata` | Ні          | `Record<string, object>`         | Дешеві типові налаштування media-understanding для ids провайдерів, оголошених у `contracts.mediaUnderstandingProviders`.                                                                                                        |
| `imageGenerationProviderMetadata`    | Ні          | `Record<string, object>`         | Дешеві auth-метадані image-generation для ids провайдерів, оголошених у `contracts.imageGenerationProviders`, включно з auth aliases і base-url guards, що належать провайдеру.                                                   |
| `videoGenerationProviderMetadata`    | Ні          | `Record<string, object>`         | Дешеві auth-метадані video-generation для ids провайдерів, оголошених у `contracts.videoGenerationProviders`, включно з auth aliases і base-url guards, що належать провайдеру.                                                   |
| `musicGenerationProviderMetadata`    | Ні          | `Record<string, object>`         | Дешеві auth-метадані music-generation для ids провайдерів, оголошених у `contracts.musicGenerationProviders`, включно з auth aliases і base-url guards, що належать провайдеру.                                                   |
| `toolMetadata`                       | Ні          | `Record<string, object>`         | Дешеві метадані доступності для інструментів, що належать Plugin і оголошені в `contracts.tools`. Використовуйте їх, коли інструмент не має завантажувати runtime без доказів config, env або auth.                              |
| `channelConfigs`                     | Ні          | `Record<string, object>`         | Метадані конфігурації каналу, що належать маніфесту, об'єднані з поверхнями виявлення та перевірки перед завантаженням runtime.                                                                                                  |
| `skills`                             | Ні          | `string[]`                       | Каталоги Skills для завантаження, відносні до кореня Plugin.                                                                                                                                                                      |
| `name`                               | Ні          | `string`                         | Зрозуміла для людини назва Plugin.                                                                                                                                                                                                |
| `description`                        | Ні       | `string`                         | Короткий опис, що відображається в поверхнях Plugin.                                                                                                                                                                                |
| `version`                            | Ні       | `string`                         | Інформаційна версія Plugin.                                                                                                                                                                                                        |
| `uiHints`                            | Ні       | `Record<string, object>`         | Мітки UI, заповнювачі та підказки щодо чутливості для конфігураційних полів.                                                                                                                                                       |

## Довідник метаданих постачальників генерації

Поля метаданих постачальника генерації описують статичні сигнали автентифікації для
постачальників, оголошених у відповідному списку `contracts.*GenerationProviders`.
OpenClaw читає ці поля до завантаження runtime постачальника, щоб основні інструменти могли
визначати, чи доступний постачальник генерації, без імпорту кожного
Plugin постачальника.

Використовуйте ці поля лише для недорогих декларативних фактів. Транспорт, перетворення
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

| Поле            | Обов'язково | Тип        | Що це означає                                                                                                                                        |
| --------------- | ----------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`       | Ні          | `string[]` | Додаткові ідентифікатори постачальників, які мають враховуватися як статичні псевдоніми автентифікації для постачальника генерації.                |
| `authProviders` | Ні          | `string[]` | Ідентифікатори постачальників, чиї налаштовані профілі автентифікації мають враховуватися як автентифікація для цього постачальника генерації.       |
| `configSignals` | Ні          | `object[]` | Недорогі сигнали доступності лише за конфігурацією для локальних або самостійно розміщених постачальників, які можна налаштувати без профілів автентифікації чи змінних env. |
| `authSignals`   | Ні          | `object[]` | Явні сигнали автентифікації. Якщо вони присутні, вони замінюють типовий набір сигналів з ідентифікатора постачальника, `aliases` і `authProviders`. |

Кожен запис `configSignals` підтримує:

| Поле          | Обов'язково | Тип        | Що це означає                                                                                                                                                                                  |
| ------------- | ----------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`    | Так         | `string`   | Dot path до об'єкта конфігурації, яким володіє Plugin, що потрібно перевірити, наприклад `plugins.entries.example.config`.                                                                    |
| `overlayPath` | Ні          | `string`   | Dot path усередині кореневої конфігурації, об'єкт якого має накладатися на кореневий об'єкт перед оцінюванням сигналу. Використовуйте це для конфігурації конкретної можливості, як-от `image`, `video` або `music`. |
| `required`    | Ні          | `string[]` | Dot paths усередині ефективної конфігурації, які повинні мати налаштовані значення. Рядки мають бути непорожніми; об'єкти та масиви не мають бути порожніми.                                  |
| `requiredAny` | Ні          | `string[]` | Dot paths усередині ефективної конфігурації, де принаймні один має мати налаштоване значення.                                                                                                  |
| `mode`        | Ні          | `object`   | Необов'язковий захист рядкового режиму всередині ефективної конфігурації. Використовуйте це, коли доступність лише за конфігурацією застосовується тільки до одного режиму.                    |

Кожен захист `mode` підтримує:

| Поле         | Обов'язково | Тип        | Що це означає                                                                 |
| ------------ | ----------- | ---------- | ----------------------------------------------------------------------------- |
| `path`       | Ні          | `string`   | Dot path усередині ефективної конфігурації. За замовчуванням `mode`.          |
| `default`    | Ні          | `string`   | Значення режиму, яке слід використовувати, коли конфігурація пропускає шлях.  |
| `allowed`    | Ні          | `string[]` | Якщо присутнє, сигнал проходить лише тоді, коли ефективний режим є одним із цих значень. |
| `disallowed` | Ні          | `string[]` | Якщо присутнє, сигнал не проходить, коли ефективний режим є одним із цих значень. |

Кожен запис `authSignals` підтримує:

| Поле             | Обов'язково | Тип      | Що це означає                                                                                                                                                       |
| ---------------- | ----------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`       | Так         | `string` | Ідентифікатор постачальника для перевірки в налаштованих профілях автентифікації.                                                                                   |
| `providerBaseUrl` | Ні         | `object` | Необов'язковий захист, через який сигнал враховується лише тоді, коли зазначений налаштований постачальник використовує дозволений базовий URL. Використовуйте це, коли псевдонім автентифікації чинний лише для певних API. |

Кожен захист `providerBaseUrl` підтримує:

| Поле              | Обов'язково | Тип        | Що це означає                                                                                                                                          |
| ----------------- | ----------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `provider`        | Так         | `string`   | Ідентифікатор конфігурації постачальника, чий `baseUrl` потрібно перевірити.                                                                           |
| `defaultBaseUrl`  | Ні          | `string`   | Базовий URL, який слід припускати, коли конфігурація постачальника пропускає `baseUrl`.                                                                |
| `allowedBaseUrls` | Так         | `string[]` | Дозволені базові URL для цього сигналу автентифікації. Сигнал ігнорується, коли налаштований або типовий базовий URL не збігається з одним із цих нормалізованих значень. |

## Довідник метаданих інструментів

`toolMetadata` використовує ті самі форми `configSignals` і `authSignals`, що й
метадані постачальника генерації, з ключами за назвою інструмента. `contracts.tools` оголошує
володіння. `toolMetadata` оголошує недорогі докази доступності, щоб OpenClaw міг
уникати імпорту runtime Plugin лише для того, щоб фабрика інструмента повернула `null`.

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

Якщо інструмент не має `toolMetadata`, OpenClaw зберігає наявну поведінку та
завантажує Plugin-власник, коли контракт інструмента відповідає політиці. Для інструментів
на гарячому шляху, фабрика яких залежить від автентифікації/конфігурації, автори Plugin мають оголошувати
`toolMetadata` замість того, щоб змушувати core імпортувати runtime для запиту.

## Довідник providerAuthChoices

Кожен запис `providerAuthChoices` описує один вибір онбордингу або автентифікації.
OpenClaw читає це до завантаження runtime постачальника.
Списки налаштування постачальника використовують ці вибори маніфесту, вибори налаштування,
отримані з дескрипторів, і метадані каталогу встановлення без завантаження runtime постачальника.

| Поле                  | Обов'язково | Тип                                             | Що це означає                                                                                         |
| --------------------- | ----------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `provider`            | Так         | `string`                                        | Ідентифікатор постачальника, якому належить цей вибір.                                                |
| `method`              | Так         | `string`                                        | Ідентифікатор методу автентифікації для диспетчеризації.                                              |
| `choiceId`            | Так         | `string`                                        | Стабільний ідентифікатор вибору автентифікації, який використовується потоками онбордингу та CLI.     |
| `choiceLabel`         | Ні          | `string`                                        | Мітка для користувача. Якщо пропущено, OpenClaw повертається до `choiceId`.                           |
| `choiceHint`          | Ні          | `string`                                        | Короткий допоміжний текст для вибирача.                                                               |
| `assistantPriority`   | Ні          | `number`                                        | Нижчі значення сортуються раніше в інтерактивних вибирачах, керованих асистентом.                     |
| `assistantVisibility` | Ні          | `"visible"` \| `"manual-only"`                  | Приховати вибір із вибирачів асистента, водночас дозволяючи ручний вибір у CLI.                       |
| `deprecatedChoiceIds` | Ні          | `string[]`                                      | Застарілі ідентифікатори вибору, які мають перенаправляти користувачів до цього вибору-замінника.     |
| `groupId`             | Ні          | `string`                                        | Необов'язковий ідентифікатор групи для групування пов'язаних виборів.                                 |
| `groupLabel`          | Ні          | `string`                                        | Мітка для користувача для цієї групи.                                                                 |
| `groupHint`           | Ні          | `string`                                        | Короткий допоміжний текст для групи.                                                                  |
| `optionKey`           | Ні          | `string`                                        | Внутрішній ключ опції для простих потоків автентифікації з одним прапорцем.                           |
| `cliFlag`             | Ні          | `string`                                        | Назва прапорця CLI, наприклад `--openrouter-api-key`.                                                 |
| `cliOption`           | Ні          | `string`                                        | Повна форма опції CLI, наприклад `--openrouter-api-key <key>`.                                        |
| `cliDescription`      | Ні          | `string`                                        | Опис, що використовується в довідці CLI.                                                              |
| `onboardingScopes`    | Ні          | `Array<"text-inference" \| "image-generation">` | У яких поверхнях онбордингу має з'являтися цей вибір. Якщо пропущено, типовим є `["text-inference"]`. |

## Довідник commandAliases

Використовуйте `commandAliases`, коли Plugin володіє назвою команди часу виконання, яку користувачі можуть
помилково додати в `plugins.allow` або спробувати запустити як кореневу CLI-команду. OpenClaw
використовує ці метадані для діагностики без імпорту runtime-коду Plugin.

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

| Поле        | Обов'язкове | Тип               | Що це означає                                                              |
| ------------ | -------- | ----------------- | ----------------------------------------------------------------------- |
| `name`       | Так      | `string`          | Назва команди, що належить цьому Plugin.                                  |
| `kind`       | Ні       | `"runtime-slash"` | Позначає псевдонім як slash-команду чату, а не кореневу CLI-команду.       |
| `cliCommand` | Ні       | `string`          | Пов'язана коренева CLI-команда, яку варто запропонувати для CLI-операцій, якщо вона існує. |

## Довідник з activation

Використовуйте `activation`, коли Plugin може дешево оголосити, які події площини керування
мають включати його до плану активації/завантаження.

Цей блок є метаданими планувальника, а не lifecycle API. Він не реєструє
поведінку часу виконання, не замінює `register(...)` і не обіцяє, що
код Plugin уже виконався. Планувальник активації використовує ці поля, щоб
звузити список кандидатних Plugin перед поверненням до наявних метаданих володіння
з маніфесту, таких як `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` і hooks.

Надавайте перевагу найвужчим метаданим, які вже описують володіння. Використовуйте
`providers`, `channels`, `commandAliases`, дескриптори setup або `contracts`,
коли ці поля виражають зв'язок. Використовуйте `activation` для додаткових підказок
планувальнику, які неможливо представити цими полями володіння.
Використовуйте верхньорівневе `cliBackends` для CLI runtime-псевдонімів, таких як `claude-cli`,
`codex-cli` або `google-gemini-cli`; `activation.onAgentHarnesses` призначено лише для
вбудованих ідентифікаторів agent harness, які ще не мають поля володіння.

Цей блок містить лише метадані. Він не реєструє поведінку часу виконання і не
замінює `register(...)`, `setupEntry` чи інші точки входу runtime/Plugin.
Поточні споживачі використовують його як підказку для звуження перед ширшим завантаженням Plugin, тому
відсутність метаданих активації, не пов'язаних із запуском, зазвичай коштує лише продуктивності; це
не має змінювати коректність, доки все ще існують резервні механізми володіння з маніфесту.

Кожен Plugin має встановлювати `activation.onStartup` навмисно. Установлюйте його в `true`
лише тоді, коли Plugin повинен запускатися під час старту Gateway. Установлюйте його в `false`, коли
Plugin інертний під час старту і має завантажуватися лише за вужчими тригерами.
Пропуск `onStartup` більше не завантажує Plugin під час старту неявно; використовуйте явні
метадані активації для старту, каналу, конфігурації, agent harness, пам'яті або
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

| Поле              | Обов'язкове | Тип                                                  | Що це означає                                                                                                                                                                                   |
| ------------------ | -------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | Ні       | `boolean`                                            | Явна активація під час старту Gateway. Кожен Plugin має встановлювати це поле. `true` імпортує Plugin під час старту; `false` залишає його лінивим щодо старту, якщо інший збіг тригера не потребує завантаження. |
| `onProviders`      | Ні       | `string[]`                                           | Ідентифікатори провайдерів, які мають включати цей Plugin до планів активації/завантаження.                                                                                                  |
| `onAgentHarnesses` | Ні       | `string[]`                                           | Ідентифікатори часу виконання вбудованих agent harness, які мають включати цей Plugin до планів активації/завантаження. Використовуйте верхньорівневе `cliBackends` для псевдонімів CLI-бекендів. |
| `onCommands`       | Ні       | `string[]`                                           | Ідентифікатори команд, які мають включати цей Plugin до планів активації/завантаження.                                                                                                       |
| `onChannels`       | Ні       | `string[]`                                           | Ідентифікатори каналів, які мають включати цей Plugin до планів активації/завантаження.                                                                                                      |
| `onRoutes`         | Ні       | `string[]`                                           | Види маршрутів, які мають включати цей Plugin до планів активації/завантаження.                                                                                                              |
| `onConfigPaths`    | Ні       | `string[]`                                           | Шляхи конфігурації відносно кореня, які мають включати цей Plugin до планів старту/завантаження, коли шлях присутній і не вимкнений явно.                                                     |
| `onCapabilities`   | Ні       | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Широкі підказки щодо можливостей, які використовуються плануванням активації площини керування. За можливості надавайте перевагу вужчим полям.                                               |

Поточні активні споживачі:

- планування старту Gateway використовує `activation.onStartup` для явного імпорту
  під час старту
- планування CLI, ініційоване командою, повертається до застарілих
  `commandAliases[].cliCommand` або `commandAliases[].name`
- планування старту agent-runtime використовує `activation.onAgentHarnesses` для
  вбудованих harness і верхньорівневе `cliBackends[]` для CLI runtime-псевдонімів
- планування setup/каналів, ініційоване каналом, повертається до застарілого володіння
  `channels[]`, коли явні метадані активації каналу відсутні
- планування Plugin під час старту використовує `activation.onConfigPaths` для неканальних кореневих
  поверхонь конфігурації, таких як блок `browser` у вбудованому browser Plugin
- планування setup/runtime, ініційоване провайдером, повертається до застарілого володіння
  `providers[]` і верхньорівневого `cliBackends[]`, коли явні метадані активації провайдера
  відсутні

Діагностика планувальника може відрізняти явні підказки активації від резервного
володіння з маніфесту. Наприклад, `activation-command-hint` означає, що
збіглося `activation.onCommands`, тоді як `manifest-command-alias` означає, що
планувальник використав володіння `commandAliases` натомість. Ці мітки причин призначені для
діагностики хоста і тестів; автори Plugin мають продовжувати оголошувати метадані,
які найкраще описують володіння.

## Довідник з qaRunners

Використовуйте `qaRunners`, коли Plugin додає один або кілька transport runners під
спільним коренем `openclaw qa`. Зберігайте ці метадані дешевими і статичними; runtime Plugin
усе одно володіє фактичною реєстрацією CLI через легковагову
поверхню `runtime-api.ts`, яка експортує `qaRunnerCliRegistrations`.

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

| Поле          | Обов'язкове | Тип      | Що це означає                                                       |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | Так      | `string` | Підкоманда, змонтована під `openclaw qa`, наприклад `matrix`.       |
| `description` | Ні       | `string` | Резервний текст довідки, що використовується, коли спільному хосту потрібна stub-команда. |

## Довідник з setup

Використовуйте `setup`, коли поверхням налаштування та початкового налаштування потрібні дешеві метадані,
що належать Plugin, до завантаження runtime.

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

Верхньорівневе `cliBackends` залишається чинним і продовжує описувати бекенди
виведення CLI. `setup.cliBackends` — це специфічна для setup поверхня дескрипторів для
потоків площини керування/setup, які мають залишатися лише метаданими.

Коли вони присутні, `setup.providers` і `setup.cliBackends` є бажаною
descriptor-first поверхнею пошуку для виявлення setup. Якщо дескриптор лише
звужує кандидатний Plugin, а setup все ще потребує багатших runtime hooks під час setup,
установіть `requiresRuntime: true` і залиште `setup-api` як
резервний шлях виконання.

OpenClaw також включає `setup.providers[].envVars` до загальної автентифікації провайдерів і
пошуку env vars. `providerAuthEnvVars` залишається підтримуваним через адаптер сумісності
протягом вікна застарівання, але невбудовані Plugin, які все ще використовують його,
отримують діагностику маніфесту. Нові Plugin мають розміщувати метадані env для setup/status
у `setup.providers[].envVars`.

OpenClaw також може виводити прості варіанти setup з `setup.providers[].authMethods`,
коли запис setup недоступний або коли `setup.requiresRuntime: false`
оголошує, що runtime для setup не потрібен. Явні записи `providerAuthChoices` залишаються
бажаними для власних міток, CLI-прапорів, області початкового налаштування і метаданих асистента.

Установлюйте `requiresRuntime: false` лише тоді, коли цих дескрипторів достатньо для
поверхні setup. OpenClaw трактує явне `false` як descriptor-only контракт
і не виконуватиме `setup-api` або `openclaw.setupEntry` для пошуку setup. Якщо
descriptor-only Plugin усе ще постачає один із цих runtime-записів setup,
OpenClaw повідомляє додаткову діагностику і продовжує ігнорувати його. Пропущене
`requiresRuntime` зберігає застарілу резервну поведінку, щоб наявні Plugin, які додали
дескриптори без цього прапора, не зламалися.

Оскільки пошук setup може виконувати код `setup-api`, що належить Plugin, нормалізовані
значення `setup.providers[].id` і `setup.cliBackends[]` мають залишатися унікальними серед
виявлених Plugin. Неоднозначне володіння завершується відмовою замість вибору
переможця з порядку виявлення.

Коли runtime setup виконується, діагностика реєстру setup повідомляє про дрейф дескрипторів,
якщо `setup-api` реєструє провайдера або CLI-бекенд, який дескриптори маніфесту
не оголошують, або якщо дескриптор не має відповідної runtime-реєстрації.
Ці діагностики є додатковими і не відхиляють застарілі Plugin.

### Довідник з setup.providers

| Поле           | Обов'язкове | Тип        | Що це означає                                                                                      |
| -------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | Так      | `string`   | Ідентифікатор провайдера, відкритий під час setup або початкового налаштування. Зберігайте нормалізовані ідентифікатори глобально унікальними. |
| `authMethods`  | Ні       | `string[]` | Ідентифікатори методів setup/auth, які цей провайдер підтримує без завантаження повного runtime.  |
| `envVars`      | Ні       | `string[]` | Env vars, які загальні поверхні setup/status можуть перевіряти до завантаження runtime Plugin.    |
| `authEvidence` | Ні       | `object[]` | Дешеві локальні перевірки доказів auth для провайдерів, які можуть автентифікуватися через несекретні маркери. |

`authEvidence` призначено для локальних маркерів облікових даних, якими володіє провайдер і які можна
перевірити без завантаження runtime-коду. Ці перевірки мають залишатися дешевими й локальними:
без мережевих викликів, без читання keychain або менеджера секретів, без команд shell і без
перевірок API провайдера.

Підтримувані записи доказів:

| Поле              | Обов’язкове | Тип        | Що це означає                                                                                                        |
| ------------------ | -------- | ---------- | -------------------------------------------------------------------------------------------------------------------- |
| `type`             | Так      | `string`   | Наразі `local-file-with-env`.                                                                                         |
| `fileEnvVar`       | Ні       | `string`   | Env var, що містить явний шлях до файлу облікових даних.                                                              |
| `fallbackPaths`    | Ні       | `string[]` | Локальні шляхи до файлів облікових даних, які перевіряються, коли `fileEnvVar` відсутній або порожній. Підтримує `${HOME}` і `${APPDATA}`. |
| `requiresAnyEnv`   | Ні       | `string[]` | Принаймні одна із перелічених env var має бути непорожньою, перш ніж доказ буде дійсним.                             |
| `requiresAllEnv`   | Ні       | `string[]` | Кожна перелічена env var має бути непорожньою, перш ніж доказ буде дійсним.                                           |
| `credentialMarker` | Так      | `string`   | Несекретний маркер, що повертається, коли доказ присутній.                                                            |
| `source`           | Ні       | `string`   | Зручна для користувача мітка джерела для виводу автентифікації/стану.                                                 |

### поля setup

| Поле              | Обов’язкове | Тип        | Що це означає                                                                                              |
| ------------------ | -------- | ---------- | ---------------------------------------------------------------------------------------------------------- |
| `providers`        | Ні       | `object[]` | Дескриптори налаштування провайдера, доступні під час setup і onboarding.                                   |
| `cliBackends`      | Ні       | `string[]` | Ідентифікатори backend для часу setup, що використовуються для пошуку setup спочатку за дескриптором. Тримайте нормалізовані ідентифікатори глобально унікальними. |
| `configMigrations` | Ні       | `string[]` | Ідентифікатори міграцій конфігурації, якими володіє поверхня setup цього plugin.                            |
| `requiresRuntime`  | Ні       | `boolean`  | Чи все ще потребує setup виконання `setup-api` після пошуку дескриптора.                                    |

## довідка uiHints

`uiHints` — це мапа від назв полів конфігурації до невеликих підказок рендерингу.

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

| Поле          | Тип        | Що це означає                              |
| ------------- | ---------- | ------------------------------------------ |
| `label`       | `string`   | Зручна для користувача мітка поля.         |
| `help`        | `string`   | Короткий допоміжний текст.                 |
| `tags`        | `string[]` | Необов’язкові UI-теги.                     |
| `advanced`    | `boolean`  | Позначає поле як розширене.                |
| `sensitive`   | `boolean`  | Позначає поле як секретне або чутливе.     |
| `placeholder` | `string`   | Текст placeholder для введення у формах.   |

## довідка contracts

Використовуйте `contracts` лише для статичних метаданих володіння можливостями, які OpenClaw може
читати без імпорту runtime plugin.

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

Кожен список є необов’язковим:

| Поле                             | Тип        | Що це означає                                                           |
| -------------------------------- | ---------- | ----------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Ідентифікатори фабрик розширень сервера застосунку Codex, наразі `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | Runtime-ідентифікатори, для яких bundled plugin може реєструвати middleware результатів інструментів. |
| `externalAuthProviders`          | `string[]` | Ідентифікатори провайдерів, hook зовнішнього auth-профілю яких належить цьому plugin. |
| `speechProviders`                | `string[]` | Ідентифікатори провайдерів мовлення, якими володіє цей plugin.          |
| `realtimeTranscriptionProviders` | `string[]` | Ідентифікатори провайдерів транскрипції в реальному часі, якими володіє цей plugin. |
| `realtimeVoiceProviders`         | `string[]` | Ідентифікатори провайдерів голосу в реальному часі, якими володіє цей plugin. |
| `memoryEmbeddingProviders`       | `string[]` | Ідентифікатори провайдерів embedding пам’яті, якими володіє цей plugin. |
| `mediaUnderstandingProviders`    | `string[]` | Ідентифікатори провайдерів розуміння медіа, якими володіє цей plugin.   |
| `imageGenerationProviders`       | `string[]` | Ідентифікатори провайдерів генерації зображень, якими володіє цей plugin. |
| `videoGenerationProviders`       | `string[]` | Ідентифікатори провайдерів генерації відео, якими володіє цей plugin.   |
| `webFetchProviders`              | `string[]` | Ідентифікатори провайдерів web-fetch, якими володіє цей plugin.         |
| `webSearchProviders`             | `string[]` | Ідентифікатори провайдерів web-search, якими володіє цей plugin.        |
| `migrationProviders`             | `string[]` | Ідентифікатори провайдерів імпорту, якими цей plugin володіє для `openclaw migrate`. |
| `tools`                          | `string[]` | Назви інструментів агента, якими володіє цей plugin.                    |

`contracts.embeddedExtensionFactories` збережено для bundled фабрик розширень
лише сервера застосунку Codex. Bundled перетворення результатів інструментів мають
оголошувати `contracts.agentToolResultMiddleware` і натомість реєструватися через
`api.registerAgentToolResultMiddleware(...)`. Зовнішні plugins не можуть
реєструвати middleware результатів інструментів, бо цей seam може переписувати
високодовірений вивід інструменту до того, як модель його побачить.

Runtime-реєстрації `api.registerTool(...)` мають відповідати `contracts.tools`.
Виявлення інструментів використовує цей список, щоб завантажувати лише runtime тих plugins, які можуть володіти
запитаними інструментами.

Provider plugins, які реалізують `resolveExternalAuthProfiles`, мають оголошувати
`contracts.externalAuthProviders`. Plugins без такого оголошення все ще проходять
через застарілий compatibility fallback, але цей fallback повільніший і
буде видалений після міграційного вікна.

Bundled провайдери memory embedding мають оголошувати
`contracts.memoryEmbeddingProviders` для кожного ідентифікатора adapter, який вони надають, зокрема
вбудованих adapters, таких як `local`. Автономні CLI-шляхи використовують цей manifest
contract, щоб завантажити лише власний plugin до того, як повний runtime Gateway
зареєструє провайдерів.

## довідка mediaUnderstandingProviderMetadata

Використовуйте `mediaUnderstandingProviderMetadata`, коли провайдер розуміння медіа має
моделі за замовчуванням, пріоритет fallback для автоматичної автентифікації або нативну підтримку документів, які
потрібні generic core helpers до завантаження runtime. Ключі також мають бути оголошені в
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

| Поле                   | Тип                                 | Що це означає                                                              |
| ---------------------- | ----------------------------------- | -------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Медіаможливості, які надає цей провайдер.                                  |
| `defaultModels`        | `Record<string, string>`            | Значення capability-to-model за замовчуванням, які використовуються, коли config не задає модель. |
| `autoPriority`         | `Record<string, number>`            | Менші числа сортуються раніше для автоматичного fallback провайдера на основі облікових даних. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Нативні document inputs, які підтримує провайдер.                          |

## довідка channelConfigs

Використовуйте `channelConfigs`, коли channel plugin потребує дешевих метаданих config до
завантаження runtime. Виявлення setup/status лише для читання може використовувати ці метадані
безпосередньо для налаштованих зовнішніх каналів, коли запис setup недоступний, або
коли `setup.requiresRuntime: false` оголошує, що runtime setup не потрібен.

`channelConfigs` — це метадані manifest plugin, а не новий top-level розділ користувацької config.
Користувачі й надалі налаштовують екземпляри каналів у `channels.<channel-id>`.
OpenClaw читає метадані manifest, щоб вирішити, якому plugin належить цей налаштований
канал до виконання runtime-коду plugin.

Для channel plugin `configSchema` і `channelConfigs` описують різні
шляхи:

- `configSchema` перевіряє `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` перевіряє `channels.<channel-id>`

Non-bundled plugins, які оголошують `channels[]`, також мають оголошувати відповідні
записи `channelConfigs`. Без них OpenClaw все ще може завантажити plugin, але
cold-path schema config, setup і поверхні Control UI не можуть знати
форму параметрів, що належать каналу, доки runtime plugin не виконається.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` і
`nativeSkillsAutoEnabled` можуть оголошувати статичні значення `auto` за замовчуванням для перевірок config команд,
які запускаються до завантаження runtime каналу. Bundled канали також можуть публікувати
ті самі значення за замовчуванням через `package.json#openclaw.channel.commands` разом
з іншими метаданими каталогу каналів, що належать package.

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

| Поле          | Тип                      | Що це означає                                                                           |
| ------------- | ------------------------ | --------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema для `channels.<id>`. Обов’язкова для кожного оголошеного запису конфігурації каналу. |
| `uiHints`     | `Record<string, object>` | Необов’язкові UI-мітки/заповнювачі/підказки щодо чутливості для цього розділу конфігурації каналу. |
| `label`       | `string`                 | Мітка каналу, що додається до поверхонь вибору й інспектування, коли метадані runtime ще не готові. |
| `description` | `string`                 | Короткий опис каналу для поверхонь інспектування та каталогу.                           |
| `commands`    | `object`                 | Статична нативна команда та автоматичні значення за замовчуванням для нативних skill для перевірок конфігурації до runtime. |
| `preferOver`  | `string[]`               | Ідентифікатори застарілих або нижчопріоритетних plugin, які цей канал має випереджати на поверхнях вибору. |

### Заміна іншого channel plugin

Використовуйте `preferOver`, коли ваш plugin є бажаним власником для ідентифікатора каналу, який
також може надати інший plugin. Типові випадки — перейменований ідентифікатор plugin,
окремий plugin, що замінює вбудований plugin, або підтримуваний fork, який
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

Коли налаштовано `channels.chat`, OpenClaw враховує ідентифікатор каналу та
ідентифікатор бажаного plugin. Якщо plugin нижчого пріоритету було вибрано лише тому,
що він вбудований або ввімкнений за замовчуванням, OpenClaw вимикає його в ефективній
runtime-конфігурації, щоб один plugin володів каналом і його інструментами. Явний вибір
користувача все одно має перевагу: якщо користувач явно вмикає обидва plugin, OpenClaw
зберігає цей вибір і повідомляє діагностику дубльованих каналів/інструментів замість
тихої зміни запитаного набору plugin.

Обмежуйте `preferOver` ідентифікаторами plugin, які справді можуть надавати той самий канал.
Це не загальне поле пріоритету, і воно не перейменовує ключі користувацької конфігурації.

## Довідник modelSupport

Використовуйте `modelSupport`, коли OpenClaw має виводити ваш provider plugin із
скорочених ідентифікаторів моделей на кшталт `gpt-5.5` або `claude-sonnet-4.6` до завантаження
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

| Поле            | Тип        | Що це означає                                                                    |
| --------------- | ---------- | -------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Префікси, що зіставляються через `startsWith` зі скороченими ідентифікаторами моделей. |
| `modelPatterns` | `string[]` | Джерела regex, що зіставляються зі скороченими ідентифікаторами моделей після видалення суфікса профілю. |

## Довідник modelCatalog

Використовуйте `modelCatalog`, коли OpenClaw має знати метадані моделей provider до
завантаження runtime plugin. Це джерело, яким володіє маніфест, для фіксованих рядків каталогу,
псевдонімів provider, правил пригнічення та режиму виявлення. Оновлення runtime
все ще належить коду runtime provider, але маніфест повідомляє ядру, коли runtime
є обов’язковим.

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

| Поле           | Тип                                                      | Що це означає                                                                                              |
| -------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | Рядки каталогу для ідентифікаторів provider, якими володіє цей plugin. Ключі також мають бути в `providers` верхнього рівня. |
| `aliases`      | `Record<string, object>`                                 | Псевдоніми provider, які мають розв’язуватися у власного provider для планування каталогу або пригнічення. |
| `suppressions` | `object[]`                                               | Рядки моделей з іншого джерела, які цей plugin пригнічує з причини, специфічної для provider.              |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Чи можна читати каталог provider з метаданих маніфесту, оновлювати його в cache, чи потрібен runtime.     |

`aliases` бере участь у пошуку власника provider для планування model-catalog.
Цілі псевдонімів мають бути provider верхнього рівня, якими володіє той самий plugin. Коли
відфільтрований за provider список використовує псевдонім, OpenClaw може прочитати маніфест власника та
застосувати перевизначення API/base URL псевдоніма без завантаження runtime provider.
Псевдоніми не розгортають нефільтровані списки каталогу; широкі списки виводять лише рядки
канонічного provider-власника.

`suppressions` замінює старий runtime-хук provider `suppressBuiltInModel`.
Записи пригнічення враховуються лише тоді, коли provider належить plugin або
оголошений як ключ `modelCatalog.aliases`, що вказує на власний provider. Runtime
хуки пригнічення більше не викликаються під час розв’язання моделей.

Поля provider:

| Поле      | Тип                      | Що це означає                                                       |
| --------- | ------------------------ | ------------------------------------------------------------------- |
| `baseUrl` | `string`                 | Необов’язковий базовий URL за замовчуванням для моделей у цьому каталозі provider. |
| `api`     | `ModelApi`               | Необов’язковий API-адаптер за замовчуванням для моделей у цьому каталозі provider. |
| `headers` | `Record<string, string>` | Необов’язкові статичні заголовки, що застосовуються до цього каталогу provider. |
| `models`  | `object[]`               | Обов’язкові рядки моделей. Рядки без `id` ігноруються.              |

Поля моделі:

| Поле            | Тип                                                            | Що це означає                                                               |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`            | `string`                                                       | Локальний для provider ідентифікатор моделі, без префікса `provider/`.     |
| `name`          | `string`                                                       | Необов’язкова відображувана назва.                                          |
| `api`           | `ModelApi`                                                     | Необов’язкове перевизначення API для окремої моделі.                        |
| `baseUrl`       | `string`                                                       | Необов’язкове перевизначення базового URL для окремої моделі.              |
| `headers`       | `Record<string, string>`                                       | Необов’язкові статичні заголовки для окремої моделі.                        |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Модальності, які приймає модель.                                            |
| `reasoning`     | `boolean`                                                      | Чи надає модель поведінку reasoning.                                        |
| `contextWindow` | `number`                                                       | Нативне вікно контексту provider.                                           |
| `contextTokens` | `number`                                                       | Необов’язкове ефективне обмеження контексту runtime, коли воно відрізняється від `contextWindow`. |
| `maxTokens`     | `number`                                                       | Максимальна кількість вихідних токенів, коли вона відома.                   |
| `cost`          | `object`                                                       | Необов’язкова ціна в USD за мільйон токенів, зокрема необов’язковий `tieredPricing`. |
| `compat`        | `object`                                                       | Необов’язкові прапорці сумісності, що відповідають сумісності конфігурації моделей OpenClaw. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Статус у списку. Пригнічуйте лише тоді, коли рядок узагалі не має з’являтися. |
| `statusReason`  | `string`                                                       | Необов’язкова причина, що показується зі статусом, відмінним від available. |
| `replaces`      | `string[]`                                                     | Старіші локальні для provider ідентифікатори моделей, які ця модель замінює. |
| `replacedBy`    | `string`                                                       | Локальний для provider ідентифікатор моделі-замінника для deprecated-рядків. |
| `tags`          | `string[]`                                                     | Стабільні теги, що використовуються засобами вибору та фільтрами.           |

Поля пригнічення:

| Поле                       | Тип        | Що це означає                                                                                             |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Ідентифікатор provider для upstream-рядка, який потрібно пригнітити. Має належати цьому plugin або бути оголошеним як власний псевдонім. |
| `model`                    | `string`   | Локальний для provider ідентифікатор моделі, який потрібно пригнітити.                                    |
| `reason`                   | `string`   | Необов’язкове повідомлення, що показується, коли пригнічений рядок запитують напряму.                    |
| `when.baseUrlHosts`        | `string[]` | Необов’язковий список ефективних хостів базового URL provider, потрібних до застосування пригнічення.    |
| `when.providerConfigApiIn` | `string[]` | Необов’язковий список точних значень `api` конфігурації provider, потрібних до застосування пригнічення. |

Не розміщуйте дані, призначені лише для середовища виконання, у `modelCatalog`. Використовуйте `static` лише тоді, коли рядки маніфесту достатньо повні, щоб поверхні списку та вибору, відфільтровані за провайдером, могли пропускати виявлення через реєстр/середовище виконання. Використовуйте `refreshable`, коли рядки маніфесту корисні як перелічувані початкові дані або доповнення, але оновлення/кеш зможе додати більше рядків пізніше; рядки `refreshable` самі по собі не є авторитетними. Використовуйте `runtime`, коли OpenClaw має завантажити середовище виконання провайдера, щоб дізнатися список.

## Довідка з modelIdNormalization

Використовуйте `modelIdNormalization` для дешевого очищення ідентифікаторів моделей, що належить провайдеру й має відбутися до завантаження середовища виконання провайдера. Це залишає псевдоніми, як-от короткі назви моделей, застарілі локальні для провайдера ідентифікатори та правила префіксів проксі, у маніфесті власного plugin, а не в таблицях вибору моделей ядра.

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

Поля провайдера:

| Поле                                 | Тип                     | Що це означає                                                                                         |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Точні псевдоніми ідентифікаторів моделей без урахування регістру. Значення повертаються як написані. |
| `stripPrefixes`                      | `string[]`              | Префікси для видалення перед пошуком псевдоніма, корисно для застарілого дублювання провайдер/модель. |
| `prefixWhenBare`                     | `string`                | Префікс для додавання, коли нормалізований ідентифікатор моделі ще не містить `/`.                    |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Умовні правила префіксів для простих ідентифікаторів після пошуку псевдоніма, задані `modelPrefix` і `prefix`. |

## Довідка з providerEndpoints

Використовуйте `providerEndpoints` для класифікації кінцевих точок, яку загальна політика запитів має знати до завантаження середовища виконання провайдера. Ядро все ще визначає значення кожного `endpointClass`; маніфести plugin визначають метадані хоста й базової URL-адреси.

Поля кінцевої точки:

| Поле                           | Тип        | Що це означає                                                                                              |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Відомий клас кінцевої точки ядра, як-от `openrouter`, `moonshot-native` або `google-vertex`.               |
| `hosts`                        | `string[]` | Точні імена хостів, що зіставляються з класом кінцевої точки.                                             |
| `hostSuffixes`                 | `string[]` | Суфікси хостів, що зіставляються з класом кінцевої точки. Додайте префікс `.` для зіставлення лише суфіксів доменів. |
| `baseUrls`                     | `string[]` | Точні нормалізовані базові HTTP(S) URL-адреси, що зіставляються з класом кінцевої точки.                  |
| `googleVertexRegion`           | `string`   | Статичний регіон Google Vertex для точних глобальних хостів.                                              |
| `googleVertexRegionHostSuffix` | `string`   | Суфікс, який потрібно прибрати з відповідних хостів, щоб відкрити префікс регіону Google Vertex.          |

## Довідка з providerRequest

Використовуйте `providerRequest` для дешевих метаданих сумісності запитів, потрібних загальній політиці запитів без завантаження середовища виконання провайдера. Переписування payload, специфічне для поведінки, залишайте в хуках середовища виконання провайдера або спільних допоміжних засобах сімейства провайдерів.

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

Поля провайдера:

| Поле                  | Тип          | Що це означає                                                                                     |
| --------------------- | ------------ | ------------------------------------------------------------------------------------------------- |
| `family`              | `string`     | Мітка сімейства провайдера, яку використовують загальні рішення щодо сумісності запитів і діагностика. |
| `compatibilityFamily` | `"moonshot"` | Необов’язкова група сумісності сімейства провайдера для спільних допоміжних засобів запитів.     |
| `openAICompletions`   | `object`     | Прапорці запитів завершень, сумісних з OpenAI, наразі `supportsStreamingUsage`.                  |

## Довідка з modelPricing

Використовуйте `modelPricing`, коли провайдеру потрібна поведінка ціноутворення на рівні control plane до завантаження середовища виконання. Кеш ціноутворення Gateway читає ці метадані без імпорту коду середовища виконання провайдера.

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

Поля провайдера:

| Поле         | Тип               | Що це означає                                                                                                  |
| ------------ | ----------------- | -------------------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Установіть `false` для локальних/самостійно розміщених провайдерів, які ніколи не повинні отримувати ціни OpenRouter або LiteLLM. |
| `openRouter` | `false \| object` | Зіставлення для пошуку цін OpenRouter. `false` вимикає пошук OpenRouter для цього провайдера.                 |
| `liteLLM`    | `false \| object` | Зіставлення для пошуку цін LiteLLM. `false` вимикає пошук LiteLLM для цього провайдера.                       |

Поля джерела:

| Поле                       | Тип                | Що це означає                                                                                                            |
| -------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `provider`                 | `string`           | Ідентифікатор провайдера зовнішнього каталогу, коли він відрізняється від ідентифікатора провайдера OpenClaw, наприклад `z-ai` для провайдера `zai`. |
| `passthroughProviderModel` | `boolean`          | Розглядати ідентифікатори моделей, що містять slash, як вкладені посилання провайдер/модель; корисно для проксі-провайдерів, таких як OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Додаткові варіанти ідентифікаторів моделей зовнішнього каталогу. `version-dots` пробує ідентифікатори версій із крапками, як-от `claude-opus-4.6`. |

### Індекс провайдерів OpenClaw

Індекс провайдерів OpenClaw — це попередні метадані, якими володіє OpenClaw, для провайдерів, чиї plugins можуть ще не бути встановлені. Він не є частиною маніфесту plugin. Маніфести plugin залишаються авторитетним джерелом для встановлених plugin. Індекс провайдерів — це внутрішній резервний контракт, який майбутні поверхні встановлюваних провайдерів і вибору моделей до встановлення використовуватимуть, коли plugin провайдера не встановлено.

Порядок авторитетності каталогу:

1. Конфігурація користувача.
2. `modelCatalog` маніфесту встановленого plugin.
3. Кеш каталогу моделей після явного оновлення.
4. Попередні рядки Індексу провайдерів OpenClaw.

Індекс провайдерів не повинен містити секрети, увімкнений стан, хуки середовища виконання або живі дані моделей, специфічні для облікового запису. Його попередні каталоги використовують ту саму форму рядка провайдера `modelCatalog`, що й маніфести plugin, але мають залишатися обмеженими стабільними метаданими відображення, якщо поля адаптера середовища виконання, як-от `api`, `baseUrl`, ціноутворення або прапорці сумісності, не підтримуються навмисно узгодженими з маніфестом встановленого plugin. Провайдери з живим виявленням `/models` мають записувати оновлені рядки через явний шлях кешу каталогу моделей, а не змушувати звичайне виведення списку чи onboarding викликати API провайдера.

Записи Індексу провайдерів також можуть містити метадані встановлюваного plugin для провайдерів, чий plugin було винесено з ядра або який інакше ще не встановлено. Ці метадані віддзеркалюють шаблон каталогу каналів: назви пакета, специфікації встановлення npm, очікуваної цілісності та дешевих міток вибору автентифікації достатньо, щоб показати встановлюваний варіант налаштування. Після встановлення plugin його маніфест має пріоритет, а запис Індексу провайдерів для цього провайдера ігнорується.

Застарілі capability-ключі верхнього рівня застаріли. Використовуйте `openclaw doctor --fix`, щоб перемістити `speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders` і `webSearchProviders` під `contracts`; звичайне завантаження маніфесту більше не розглядає ці поля верхнього рівня як ownership capability.

## Маніфест порівняно з package.json

Ці два файли виконують різні завдання:

| Файл                   | Для чого використовувати                                                                                                    |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Виявлення, перевірка конфігурації, метадані вибору автентифікації та підказки UI, які мають існувати до запуску коду plugin |
| `package.json`         | Метадані npm, встановлення залежностей і блок `openclaw`, що використовується для entrypoints, обмеження встановлення, налаштування або метаданих каталогу |

Якщо ви не впевнені, де має бути певний фрагмент метаданих, використовуйте це правило:

- якщо OpenClaw має знати це до завантаження коду plugin, помістіть це в `openclaw.plugin.json`
- якщо це стосується пакування, entry files або поведінки встановлення npm, помістіть це в `package.json`

### Поля package.json, що впливають на виявлення

Деякі метадані plugin до середовища виконання навмисно зберігаються в `package.json` у блоці `openclaw`, а не в `openclaw.plugin.json`.

Важливі приклади:

| Поле                                                              | Що це означає                                                                                                                                                                       |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | Оголошує нативні точки входу Plugin. Має залишатися всередині каталогу пакета Plugin.                                                                                                |
| `openclaw.runtimeExtensions`                                      | Оголошує зібрані JavaScript-точки входу runtime для встановлених пакетів. Має залишатися всередині каталогу пакета Plugin.                                                          |
| `openclaw.setupEntry`                                             | Легка точка входу лише для налаштування, що використовується під час онбордингу, відкладеного запуску каналу та read-only виявлення стану каналу/SecretRef. Має залишатися всередині каталогу пакета Plugin. |
| `openclaw.runtimeSetupEntry`                                      | Оголошує зібрану JavaScript-точку входу налаштування для встановлених пакетів. Потребує `setupEntry`, має існувати та має залишатися всередині каталогу пакета Plugin.              |
| `openclaw.channel`                                                | Дешеві метадані каталогу каналів, як-от мітки, шляхи документації, псевдоніми та текст вибору.                                                                                      |
| `openclaw.channel.commands`                                       | Статичні нативні метадані команд і нативних skill auto-default, що використовуються конфігурацією, аудитом і поверхнями списку команд до завантаження runtime каналу.               |
| `openclaw.channel.configuredState`                                | Легкі метадані перевірки налаштованого стану, які можуть відповісти "чи вже існує env-only налаштування?" без завантаження повного runtime каналу.                                  |
| `openclaw.channel.persistedAuthState`                             | Легкі метадані перевірки збереженого стану автентифікації, які можуть відповісти "чи вже хтось увійшов?" без завантаження повного runtime каналу.                                   |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Підказки встановлення/оновлення для bundled і зовнішньо опублікованих plugins.                                                                                                      |
| `openclaw.install.defaultChoice`                                  | Бажаний шлях встановлення, коли доступно кілька джерел встановлення.                                                                                                                 |
| `openclaw.install.minHostVersion`                                 | Мінімальна підтримувана версія хоста OpenClaw із semver-нижньою межею на кшталт `>=2026.3.22` або `>=2026.5.1-beta.1`.                                                              |
| `openclaw.install.expectedIntegrity`                              | Очікуваний рядок цілісності npm dist, наприклад `sha512-...`; потоки встановлення й оновлення перевіряють отриманий артефакт відносно нього.                                       |
| `openclaw.install.allowInvalidConfigRecovery`                     | Дозволяє вузький шлях відновлення перевстановлення bundled-plugin, коли конфігурація недійсна.                                                                                       |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Дозволяє завантажувати поверхні каналу лише для налаштування перед повним Plugin каналу під час запуску.                                                                             |

Метадані маніфесту визначають, які варіанти provider/channel/setup з’являються в
онбордингу до завантаження runtime. `package.json#openclaw.install` повідомляє
онбордингу, як отримати або ввімкнути цей Plugin, коли користувач вибирає один із
цих варіантів. Не переносіть підказки встановлення в `openclaw.plugin.json`.

`openclaw.install.minHostVersion` застосовується під час встановлення та
завантаження реєстру маніфестів для джерел Plugin, що не є bundled. Недійсні
значення відхиляються; новіші, але дійсні значення пропускають зовнішні plugins
на старіших хостах. Bundled source plugins вважаються співверсійними з checkout
хоста.

Точне закріплення версії npm уже міститься в `npmSpec`, наприклад
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Офіційні записи зовнішнього
каталогу мають поєднувати точні специфікації з `expectedIntegrity`, щоб потоки
оновлення завершувалися закрито, якщо отриманий npm-артефакт більше не
відповідає закріпленому релізу. Інтерактивний онбординг досі пропонує довірені
npm-специфікації реєстру, включно з голими назвами пакетів і dist-tags, для
сумісності. Діагностика каталогу може розрізняти точні, плаваючі,
integrity-pinned, missing-integrity, невідповідність назви пакета та недійсні
джерела default-choice. Вона також попереджає, коли `expectedIntegrity` наявний,
але немає дійсного npm-джерела, яке він може закріпити. Коли
`expectedIntegrity` наявний, потоки встановлення/оновлення застосовують його;
коли його пропущено, розв’язання реєстру записується без закріплення цілісності.

Channel plugins мають надавати `openclaw.setupEntry`, коли сканування стану,
списку каналів або SecretRef має визначити налаштовані облікові записи без
завантаження повного runtime. Точка входу налаштування має експортувати метадані
каналу, а також setup-safe адаптери конфігурації, стану та секретів; тримайте
мережеві клієнти, слухачі Gateway і transport runtimes у головній точці входу
розширення.

Поля точок входу runtime не перевизначають перевірки меж пакета для полів
source entrypoint. Наприклад, `openclaw.runtimeExtensions` не може зробити
завантажуваним шлях `openclaw.extensions`, що виходить назовні.

`openclaw.install.allowInvalidConfigRecovery` навмисно вузький. Він не робить
довільні зламані конфігурації встановлюваними. Сьогодні він лише дозволяє
потокам встановлення відновлюватися після конкретних застарілих збоїв
оновлення bundled-plugin, як-от відсутній шлях bundled Plugin або застарілий
запис `channels.<id>` для того самого bundled Plugin. Непов’язані помилки
конфігурації все одно блокують встановлення та скеровують операторів до
`openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` — це метадані пакета для крихітного
модуля перевірки:

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

Використовуйте це, коли потокам setup, doctor, status або read-only presence
потрібна дешева yes/no перевірка автентифікації до завантаження повного Plugin
каналу. Збережений стан автентифікації не є налаштованим станом каналу: не
використовуйте ці метадані для автоматичного ввімкнення plugins, ремонту
runtime-залежностей або рішення, чи має завантажуватися runtime каналу. Цільовий
експорт має бути невеликою функцією, яка читає лише збережений стан; не
пропускайте її через повний runtime barrel каналу.

`openclaw.channel.configuredState` має таку саму форму для дешевих env-only
перевірок налаштованості:

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

Використовуйте це, коли канал може відповісти про налаштований стан з env або
інших крихітних non-runtime вхідних даних. Якщо перевірка потребує повного
розв’язання конфігурації або справжнього runtime каналу, залиште цю логіку в
хуку Plugin `config.hasConfiguredState`.

## Пріоритет виявлення (дублікати ідентифікаторів Plugin)

OpenClaw виявляє plugins з кількох коренів (bundled, глобальне встановлення, workspace, явні шляхи, вибрані конфігурацією). Якщо два виявлені елементи мають той самий `id`, зберігається лише маніфест із **найвищим пріоритетом**; дублікати нижчого пріоритету відкидаються замість завантаження поруч із ним.

Пріоритет, від найвищого до найнижчого:

1. **Вибраний конфігурацією** — шлях, явно закріплений у `plugins.entries.<id>`
2. **Bundled** — plugins, що постачаються з OpenClaw
3. **Глобальне встановлення** — plugins, установлені в глобальний корінь Plugin OpenClaw
4. **Workspace** — plugins, виявлені відносно поточного workspace

Наслідки:

- Форкована або застаріла копія bundled Plugin, що лежить у workspace, не затінить bundled збірку.
- Щоб справді перевизначити bundled Plugin локальним, закріпіть його через `plugins.entries.<id>`, щоб він виграв за пріоритетом, а не покладайтеся на виявлення workspace.
- Відкидання дублікатів логуються, щоб Doctor і діагностика запуску могли вказати на відкинуту копію.

## Вимоги JSON Schema

- **Кожен Plugin має постачати JSON Schema**, навіть якщо він не приймає конфігурації.
- Порожня схема прийнятна (наприклад, `{ "type": "object", "additionalProperties": false }`).
- Схеми перевіряються під час читання/запису конфігурації, а не під час runtime.

## Поведінка валідації

- Невідомі ключі `channels.*` є **помилками**, якщо ідентифікатор каналу не оголошено
  маніфестом Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` і `plugins.slots.*`
  мають посилатися на **discoverable** ідентифікатори Plugin. Невідомі ідентифікатори є **помилками**.
- Якщо Plugin встановлено, але він має зламаний або відсутній маніфест чи схему,
  валідація завершується з помилкою, а Doctor повідомляє про помилку Plugin.
- Якщо конфігурація Plugin існує, але Plugin **вимкнено**, конфігурація зберігається, а
  **попередження** показується в Doctor + logs.

Див. [довідник конфігурації](/uk/gateway/configuration) для повної схеми `plugins.*`.

## Примітки

- Маніфест є **обов’язковим для нативних OpenClaw plugins**, включно з локальними завантаженнями з файлової системи. Runtime все одно завантажує модуль Plugin окремо; маніфест потрібен лише для виявлення + валідації.
- Нативні маніфести розбираються як JSON5, тому коментарі, кінцеві коми та ключі без лапок приймаються, доки фінальне значення все ще є об’єктом.
- Завантажувач маніфестів читає лише задокументовані поля маніфесту. Уникайте кастомних ключів верхнього рівня.
- `channels`, `providers`, `cliBackends` і `skills` можна всі пропустити, коли Plugin не потребує їх.
- `providerDiscoveryEntry` має залишатися легким і не повинен імпортувати широкий runtime-код; використовуйте його для статичних метаданих каталогу provider або вузьких дескрипторів виявлення, а не для виконання під час запиту.
- Ексклюзивні типи Plugin вибираються через `plugins.slots.*`: `kind: "memory"` через `plugins.slots.memory`, `kind: "context-engine"` через `plugins.slots.contextEngine` (default `legacy`).
- Оголошуйте ексклюзивний тип Plugin у цьому маніфесті. Runtime-entry `OpenClawPluginDefinition.kind` застарілий і залишається лише як fallback сумісності для старіших plugins.
- Метадані env-var (`setup.providers[].envVars`, застарілий `providerAuthEnvVars` і `channelEnvVars`) є лише декларативними. Status, audit, cron delivery validation та інші read-only поверхні все одно застосовують довіру до Plugin і effective activation policy перед тим, як вважати env var налаштованою.
- Для runtime wizard metadata, що потребує коду provider, див. [runtime-хуки provider](/uk/plugins/architecture-internals#provider-runtime-hooks).
- Якщо ваш Plugin залежить від нативних модулів, задокументуйте кроки збірки та будь-які вимоги allowlist менеджера пакетів (наприклад, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Пов’язане

<CardGroup cols={3}>
  <Card title="Створення plugins" href="/uk/plugins/building-plugins" icon="rocket">
    Початок роботи з plugins.
  </Card>
  <Card title="Архітектура Plugin" href="/uk/plugins/architecture" icon="diagram-project">
    Внутрішня архітектура та модель можливостей.
  </Card>
  <Card title="Огляд SDK" href="/uk/plugins/sdk-overview" icon="book">
    Довідник Plugin SDK та імпорти підшляхів.
  </Card>
</CardGroup>
