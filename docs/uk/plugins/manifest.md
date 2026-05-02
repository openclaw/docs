---
read_when:
    - Ви створюєте OpenClaw Plugin
    - Вам потрібно випустити схему конфігурації Plugin або налагодити помилки валідації Plugin
summary: Вимоги до маніфесту Plugin + схеми JSON (сувора перевірка конфігурації)
title: Маніфест Plugin
x-i18n:
    generated_at: "2026-05-02T14:31:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: d21704678ef64d35aa778f7fe65114bab7a9a94bb74ff4f1d4d9b5788965f453
    source_path: plugins/manifest.md
    workflow: 16
---

Ця сторінка призначена лише для **нативного маніфесту плагіна OpenClaw**.

Сумісні макети пакетів див. у [пакетах плагінів](/uk/plugins/bundles).

Сумісні формати пакетів використовують інші файли маніфестів:

- Пакет Codex: `.codex-plugin/plugin.json`
- Пакет Claude: `.claude-plugin/plugin.json` або стандартний макет компонента Claude
  без маніфесту
- Пакет Cursor: `.cursor-plugin/plugin.json`

OpenClaw також автоматично виявляє ці макети пакетів, але вони не перевіряються
за схемою `openclaw.plugin.json`, описаною тут.

Для сумісних пакетів OpenClaw наразі зчитує метадані пакета, а також оголошені
корені skill, корені команд Claude, стандартні значення Claude-пакета з `settings.json`,
стандартні значення LSP Claude-пакета та підтримувані набори hooks, коли макет відповідає
очікуванням runtime OpenClaw.

Кожен нативний плагін OpenClaw **повинен** постачати файл `openclaw.plugin.json` у
**корені плагіна**. OpenClaw використовує цей маніфест для перевірки конфігурації
**без виконання коду плагіна**. Відсутні або недійсні маніфести вважаються
помилками плагіна та блокують перевірку конфігурації.

Див. повний посібник із системи плагінів: [Плагіни](/uk/tools/plugin).
Про нативну модель можливостей і поточні настанови щодо зовнішньої сумісності:
[Модель можливостей](/uk/plugins/architecture#public-capability-model).

## Що робить цей файл

`openclaw.plugin.json` — це метадані, які OpenClaw зчитує **до завантаження вашого
коду плагіна**. Усе нижче має бути достатньо легким для перевірки без запуску
runtime плагіна.

**Використовуйте його для:**

- ідентичності плагіна, перевірки конфігурації та підказок UI конфігурації
- метаданих автентифікації, onboarding і налаштування (alias, auto-enable, env vars провайдера, варіанти автентифікації)
- підказок активації для поверхонь control-plane
- скороченого володіння сімействами моделей
- статичних знімків володіння можливостями (`contracts`)
- метаданих QA runner, які може перевіряти спільний хост `openclaw qa`
- специфічних для каналу метаданих конфігурації, об’єднаних у каталог і поверхні перевірки

**Не використовуйте його для:** реєстрації runtime-поведінки, оголошення code entrypoints
або метаданих встановлення npm. Вони належать до коду вашого плагіна та `package.json`.

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

| Поле                                | Обов’язкове | Тип                              | Що означає                                                                                                                                                                                                                       |
| ------------------------------------ | -------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Так      | `string`                         | Канонічний id Plugin. Це id, який використовується в `plugins.entries.<id>`.                                                                                                                                                                 |
| `configSchema`                       | Так      | `object`                         | Вбудована JSON Schema для конфігурації цього Plugin.                                                                                                                                                                                        |
| `enabledByDefault`                   | Ні       | `true`                           | Позначає вбудований Plugin як увімкнений за замовчуванням. Пропустіть це поле або задайте будь-яке значення, відмінне від `true`, щоб залишити Plugin вимкненим за замовчуванням.                                                                                                        |
| `legacyPluginIds`                    | Ні       | `string[]`                       | Застарілі ids, які нормалізуються до цього канонічного id Plugin.                                                                                                                                                                              |
| `autoEnableWhenConfiguredProviders`  | Ні       | `string[]`                       | Provider ids, які мають автоматично вмикати цей Plugin, коли auth, config або model refs згадують їх.                                                                                                                                     |
| `kind`                               | Ні       | `"memory"` \| `"context-engine"` | Оголошує ексклюзивний вид Plugin, що використовується `plugins.slots.*`.                                                                                                                                                                        |
| `channels`                           | Ні       | `string[]`                       | Channel ids, що належать цьому Plugin. Використовується для виявлення та валідації конфігурації.                                                                                                                                                         |
| `providers`                          | Ні       | `string[]`                       | Provider ids, що належать цьому Plugin.                                                                                                                                                                                                  |
| `providerDiscoveryEntry`             | Ні       | `string`                         | Легкий шлях до модуля виявлення providers, відносно кореня Plugin, для metadata каталогу providers у межах manifest, які можна завантажити без активації повного runtime Plugin.                                               |
| `modelSupport`                       | Ні       | `object`                         | Скорочені metadata сімейств моделей, що належать manifest і використовуються для автозавантаження Plugin перед runtime.                                                                                                                                         |
| `modelCatalog`                       | Ні       | `object`                         | Декларативні metadata каталогу моделей для providers, що належать цьому Plugin. Це контракт control plane для майбутнього read-only переліку, onboarding, вибирачів моделей, aliases і suppression без завантаження runtime Plugin.         |
| `modelPricing`                       | Ні       | `object`                         | Політика зовнішнього пошуку pricing, що належить provider. Використовуйте її, щоб виключати локальні/self-hosted providers з віддалених pricing catalogs або зіставляти provider refs з ids каталогів OpenRouter/LiteLLM без жорсткого кодування provider ids у core.             |
| `modelIdNormalization`               | Ні       | `object`                         | Очищення aliases/prefixes model id, що належить provider і має виконуватися до завантаження runtime provider.                                                                                                                                           |
| `providerEndpoints`                  | Ні       | `object[]`                       | Metadata host/baseUrl endpoints, що належать manifest, для provider routes, які core має класифікувати до завантаження runtime provider.                                                                                                            |
| `providerRequest`                    | Ні       | `object`                         | Дешеві metadata сімейства provider і сумісності request, що використовуються загальною policy request до завантаження runtime provider.                                                                                                              |
| `cliBackends`                        | Ні       | `string[]`                       | CLI inference backend ids, що належать цьому Plugin. Використовується для автоматичної активації під час запуску з явних config refs.                                                                                                                         |
| `syntheticAuthRefs`                  | Ні       | `string[]`                       | Provider або CLI backend refs, чий synthetic auth hook, що належить Plugin, має перевірятися під час холодного виявлення моделей до завантаження runtime.                                                                                              |
| `nonSecretAuthMarkers`               | Ні       | `string[]`                       | Значення placeholder API key, що належать вбудованому Plugin і представляють несекретний локальний, OAuth або ambient credential state.                                                                                                                |
| `commandAliases`                     | Ні       | `object[]`                       | Імена команд, що належать цьому Plugin і мають створювати config та CLI diagnostics з урахуванням Plugin до завантаження runtime.                                                                                                                |
| `providerAuthEnvVars`                | Ні       | `Record<string, string[]>`       | Застарілі metadata сумісності env для пошуку auth/status provider. Для нових plugins віддавайте перевагу `setup.providers[].envVars`; OpenClaw досі читає це поле протягом періоду deprecation.                                                 |
| `providerAuthAliases`                | Ні       | `Record<string, string>`         | Provider ids, які мають повторно використовувати інший provider id для пошуку auth, наприклад coding provider, що ділить API key і auth profiles базового provider.                                                                          |
| `channelEnvVars`                     | Ні       | `Record<string, string[]>`       | Дешеві channel env metadata, які OpenClaw може перевірити без завантаження коду Plugin. Використовуйте це для channel setup на основі env або auth surfaces, які мають бачити загальні startup/config helpers.                                            |
| `providerAuthChoices`                | Ні       | `object[]`                       | Дешеві metadata auth choices для onboarding pickers, preferred-provider resolution і простого підключення CLI flags.                                                                                                                       |
| `activation`                         | Ні       | `object`                         | Дешеві metadata планувальника активації для завантаження, що запускається startup, provider, command, channel, route та capability. Лише metadata; runtime Plugin все ще володіє фактичною поведінкою.                                                       |
| `setup`                              | Ні       | `object`                         | Дешеві descriptors setup/onboarding, які surfaces discovery і setup можуть перевіряти без завантаження runtime Plugin.                                                                                                                    |
| `qaRunners`                          | Ні       | `object[]`                       | Дешеві descriptors QA runner, що використовуються спільним host `openclaw qa` до завантаження runtime Plugin.                                                                                                                                      |
| `contracts`                          | Ні       | `object`                         | Статичний snapshot ownership capabilities для external auth hooks, speech, realtime transcription, realtime voice, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search і tool ownership. |
| `mediaUnderstandingProviderMetadata` | Ні       | `Record<string, object>`         | Дешеві defaults media-understanding для provider ids, оголошених у `contracts.mediaUnderstandingProviders`.                                                                                                                            |
| `imageGenerationProviderMetadata`    | Ні       | `Record<string, object>`         | Дешеві auth metadata image-generation для provider ids, оголошених у `contracts.imageGenerationProviders`, включно з auth aliases і base-url guards, що належать provider.                                                                  |
| `videoGenerationProviderMetadata`    | Ні       | `Record<string, object>`         | Дешеві auth metadata video-generation для provider ids, оголошених у `contracts.videoGenerationProviders`, включно з auth aliases і base-url guards, що належать provider.                                                                  |
| `musicGenerationProviderMetadata`    | Ні       | `Record<string, object>`         | Дешеві auth metadata music-generation для provider ids, оголошених у `contracts.musicGenerationProviders`, включно з auth aliases і base-url guards, що належать provider.                                                                  |
| `toolMetadata`                       | Ні       | `Record<string, object>`         | Дешеві metadata доступності для tools, що належать Plugin і оголошені в `contracts.tools`. Використовуйте це, коли tool не має завантажувати runtime, якщо немає доказів config, env або auth.                                                           |
| `channelConfigs`                     | Ні       | `Record<string, object>`         | Channel config metadata, що належать manifest і зливаються в surfaces discovery та validation до завантаження runtime.                                                                                                                          |
| `skills`                             | Ні       | `string[]`                       | Каталоги Skills для завантаження, відносно кореня Plugin.                                                                                                                                                                             |
| `name`                               | Ні       | `string`                         | Зрозуміла для людини назва Plugin.                                                                                                                                                                                                         |
| `description`                        | Ні       | `string`                         | Короткий підсумок, що показується в поверхнях Plugin.                                                                                                                                                                                             |
| `version`                            | Ні       | `string`                         | Інформаційна версія Plugin.                                                                                                                                                                                                       |
| `uiHints`                            | Ні       | `Record<string, object>`         | UI-мітки, заповнювачі та підказки щодо чутливості для полів конфігурації.                                                                                                                                                                   |

## Довідник метаданих провайдера генерації

Поля метаданих провайдера генерації описують статичні сигнали автентифікації для
провайдерів, оголошених у відповідному списку `contracts.*GenerationProviders`.
OpenClaw читає ці поля до завантаження середовища виконання провайдера, щоб основні інструменти могли
вирішити, чи доступний провайдер генерації, без імпорту кожного
провайдерського Plugin.

Використовуйте ці поля лише для дешевих декларативних фактів. Транспорт, перетворення
запитів, оновлення токенів, перевірка облікових даних і фактична поведінка генерації
залишаються в середовищі виконання Plugin.

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

| Поле            | Обов’язкове | Тип        | Що це означає                                                                                                                       |
| --------------- | ----------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`       | Ні          | `string[]` | Додаткові ідентифікатори провайдерів, які мають враховуватися як статичні псевдоніми автентифікації для провайдера генерації.     |
| `authProviders` | Ні          | `string[]` | Ідентифікатори провайдерів, чиї налаштовані профілі автентифікації мають враховуватися як автентифікація для цього провайдера генерації. |
| `configSignals` | Ні          | `object[]` | Дешеві сигнали доступності лише за конфігурацією для локальних або самостійно розгорнутих провайдерів, які можна налаштувати без профілів автентифікації чи змінних середовища. |
| `authSignals`   | Ні          | `object[]` | Явні сигнали автентифікації. Якщо вони присутні, то замінюють стандартний набір сигналів з ідентифікатора провайдера, `aliases` і `authProviders`. |

Кожен запис `configSignals` підтримує:

| Поле          | Обов’язкове | Тип        | Що це означає                                                                                                                                                                           |
| ------------- | ----------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`    | Так         | `string`   | Шлях через крапки до об’єкта конфігурації, яким володіє Plugin, наприклад `plugins.entries.example.config`.                                                                            |
| `overlayPath` | Ні          | `string`   | Шлях через крапки всередині кореневої конфігурації, об’єкт якого має накладатися на кореневий об’єкт перед оцінюванням сигналу. Використовуйте це для конфігурації, специфічної для можливості, як-от `image`, `video` або `music`. |
| `required`    | Ні          | `string[]` | Шляхи через крапки всередині ефективної конфігурації, які повинні мати налаштовані значення. Рядки мають бути непорожніми; об’єкти й масиви не мають бути порожніми.                  |
| `requiredAny` | Ні          | `string[]` | Шляхи через крапки всередині ефективної конфігурації, серед яких принаймні один повинен мати налаштоване значення.                                                                     |
| `mode`        | Ні          | `object`   | Необов’язковий захист за рядковим режимом усередині ефективної конфігурації. Використовуйте це, коли доступність лише за конфігурацією застосовується тільки до одного режиму.        |

Кожен захист `mode` підтримує:

| Поле         | Обов’язкове | Тип        | Що це означає                                                                      |
| ------------ | ----------- | ---------- | ---------------------------------------------------------------------------------- |
| `path`       | Ні          | `string`   | Шлях через крапки всередині ефективної конфігурації. За замовчуванням `mode`.      |
| `default`    | Ні          | `string`   | Значення режиму, яке слід використовувати, коли конфігурація пропускає шлях.       |
| `allowed`    | Ні          | `string[]` | Якщо присутнє, сигнал проходить лише тоді, коли ефективний режим є одним із цих значень. |
| `disallowed` | Ні          | `string[]` | Якщо присутнє, сигнал не проходить, коли ефективний режим є одним із цих значень.  |

Кожен запис `authSignals` підтримує:

| Поле              | Обов’язкове | Тип      | Що це означає                                                                                                                                                                 |
| ----------------- | ----------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Так         | `string` | Ідентифікатор провайдера для перевірки в налаштованих профілях автентифікації.                                                                                                |
| `providerBaseUrl` | Ні          | `object` | Необов’язковий захист, через який сигнал враховується лише тоді, коли вказаний налаштований провайдер використовує дозволений базовий URL. Використовуйте це, коли псевдонім автентифікації чинний лише для певних API. |

Кожен захист `providerBaseUrl` підтримує:

| Поле              | Обов’язкове | Тип        | Що це означає                                                                                                                                        |
| ----------------- | ----------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Так         | `string`   | Ідентифікатор конфігурації провайдера, чий `baseUrl` потрібно перевіряти.                                                                            |
| `defaultBaseUrl`  | Ні          | `string`   | Базовий URL, який слід припускати, коли конфігурація провайдера пропускає `baseUrl`.                                                                 |
| `allowedBaseUrls` | Так         | `string[]` | Дозволені базові URL для цього сигналу автентифікації. Сигнал ігнорується, коли налаштований або стандартний базовий URL не збігається з одним із цих нормалізованих значень. |

## Довідник метаданих інструментів

`toolMetadata` використовує ті самі форми `configSignals` і `authSignals`, що й
метадані провайдера генерації, з ключами за назвою інструмента. `contracts.tools` оголошує
володіння. `toolMetadata` оголошує дешеві докази доступності, щоб OpenClaw міг
уникати імпорту середовища виконання Plugin лише для того, щоб фабрика його інструмента повернула `null`.

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
завантажує власницький Plugin, коли контракт інструмента відповідає політиці. Для інструментів
гарячого шляху, фабрика яких залежить від автентифікації/конфігурації, авторам Plugin слід оголошувати
`toolMetadata` замість того, щоб змушувати ядро імпортувати середовище виконання для запиту.

## Довідник providerAuthChoices

Кожен запис `providerAuthChoices` описує один вибір онбордингу або автентифікації.
OpenClaw читає це до завантаження середовища виконання провайдера.
Списки налаштування провайдера використовують ці вибори з маніфесту, вибори налаштування,
похідні від дескриптора, і метадані каталогу встановлення без завантаження середовища виконання провайдера.

| Поле                  | Обов’язкове | Тип                                             | Що це означає                                                                                            |
| --------------------- | ----------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | Так         | `string`                                        | Ідентифікатор провайдера, якому належить цей вибір.                                                      |
| `method`              | Так         | `string`                                        | Ідентифікатор методу автентифікації для передавання.                                                     |
| `choiceId`            | Так         | `string`                                        | Стабільний ідентифікатор вибору автентифікації, який використовується потоками онбордингу й CLI.         |
| `choiceLabel`         | Ні          | `string`                                        | Мітка для користувача. Якщо її пропущено, OpenClaw повертається до `choiceId`.                           |
| `choiceHint`          | Ні          | `string`                                        | Короткий допоміжний текст для вибірника.                                                                 |
| `assistantPriority`   | Ні          | `number`                                        | Нижчі значення сортуються раніше в інтерактивних вибірниках, керованих асистентом.                       |
| `assistantVisibility` | Ні          | `"visible"` \| `"manual-only"`                  | Приховує вибір із вибірників асистента, водночас дозволяючи ручний вибір у CLI.                          |
| `deprecatedChoiceIds` | Ні          | `string[]`                                      | Застарілі ідентифікатори вибору, які мають перенаправляти користувачів до цього вибору-заміни.           |
| `groupId`             | Ні          | `string`                                        | Необов’язковий ідентифікатор групи для групування пов’язаних виборів.                                    |
| `groupLabel`          | Ні          | `string`                                        | Мітка для користувача для цієї групи.                                                                    |
| `groupHint`           | Ні          | `string`                                        | Короткий допоміжний текст для групи.                                                                     |
| `optionKey`           | Ні          | `string`                                        | Внутрішній ключ опції для простих потоків автентифікації з одним прапорцем.                              |
| `cliFlag`             | Ні          | `string`                                        | Назва прапорця CLI, наприклад `--openrouter-api-key`.                                                    |
| `cliOption`           | Ні          | `string`                                        | Повна форма опції CLI, наприклад `--openrouter-api-key <key>`.                                           |
| `cliDescription`      | Ні          | `string`                                        | Опис, що використовується в довідці CLI.                                                                 |
| `onboardingScopes`    | Ні          | `Array<"text-inference" \| "image-generation">` | У яких поверхнях онбордингу має з’являтися цей вибір. Якщо пропущено, стандартно використовується `["text-inference"]`. |

## Довідник commandAliases

Use `commandAliases`, коли плагін володіє назвою runtime-команди, яку користувачі можуть
помилково додати до `plugins.allow` або спробувати запустити як кореневу CLI-команду. OpenClaw
використовує ці метадані для діагностики без імпорту runtime-коду плагіна.

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

| Поле         | Обов’язкове | Тип               | Що це означає                                                                 |
| ------------ | ----------- | ----------------- | ----------------------------------------------------------------------------- |
| `name`       | Так         | `string`          | Назва команди, що належить цьому плагіну.                                     |
| `kind`       | Ні          | `"runtime-slash"` | Позначає псевдонім як слеш-команду чату, а не як кореневу CLI-команду.        |
| `cliCommand` | Ні          | `string`          | Пов’язана коренева CLI-команда, яку слід запропонувати для CLI-операцій, якщо така існує. |

## довідка з activation

Use `activation`, коли плагін може дешево оголосити, які події control plane
мають включати його до плану активації/завантаження.

Цей блок є метаданими планувальника, а не lifecycle API. Він не реєструє
runtime-поведінку, не замінює `register(...)` і не обіцяє, що
код плагіна вже виконано. Планувальник активації використовує ці поля, щоб
звузити перелік кандидатних плагінів перед поверненням до наявних метаданих
володіння маніфесту, як-от `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` і hooks.

Надавайте перевагу найвужчим метаданим, які вже описують володіння. Використовуйте
`providers`, `channels`, `commandAliases`, setup-дескриптори або `contracts`,
коли ці поля виражають зв’язок. Використовуйте `activation` для додаткових підказок
планувальнику, які не можна представити цими полями володіння.
Використовуйте верхньорівневе `cliBackends` для CLI runtime-псевдонімів, як-от `claude-cli`,
`codex-cli` або `google-gemini-cli`; `activation.onAgentHarnesses` призначено лише для
вбудованих ідентифікаторів agent harness, які ще не мають поля володіння.

Цей блок є лише метаданими. Він не реєструє runtime-поведінку й не замінює
`register(...)`, `setupEntry` або інші runtime/plugin entrypoints.
Поточні споживачі використовують його як підказку для звуження перед ширшим завантаженням плагінів, тому
відсутні метадані активації не під час запуску зазвичай впливають лише на продуктивність; це
не має змінювати коректність, поки існують fallback-и володіння маніфесту.

Кожен плагін має задавати `activation.onStartup` навмисно. Установлюйте його в `true`
лише тоді, коли плагін має виконуватися під час запуску Gateway. Установлюйте його в `false`, коли
плагін інертний під час запуску й має завантажуватися лише за вужчими тригерами.
Пропуск `onStartup` більше не завантажує плагін під час запуску неявно; використовуйте явні
метадані активації для запуску, каналу, конфігурації, agent-harness, пам’яті або
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

| Поле               | Обов’язкове | Тип                                                  | Що це означає                                                                                                                                                                                      |
| ------------------ | ----------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | Ні          | `boolean`                                            | Явна активація під час запуску Gateway. Кожен плагін має задавати це поле. `true` імпортує плагін під час запуску; `false` зберігає його лінивим на запуску, якщо інший відповідний тригер не вимагає завантаження. |
| `onProviders`      | Ні          | `string[]`                                           | Ідентифікатори провайдерів, які мають включати цей плагін до планів активації/завантаження.                                                                                                       |
| `onAgentHarnesses` | Ні          | `string[]`                                           | Runtime-ідентифікатори вбудованих agent harness, які мають включати цей плагін до планів активації/завантаження. Використовуйте верхньорівневе `cliBackends` для псевдонімів CLI backend.          |
| `onCommands`       | Ні          | `string[]`                                           | Ідентифікатори команд, які мають включати цей плагін до планів активації/завантаження.                                                                                                             |
| `onChannels`       | Ні          | `string[]`                                           | Ідентифікатори каналів, які мають включати цей плагін до планів активації/завантаження.                                                                                                            |
| `onRoutes`         | Ні          | `string[]`                                           | Типи маршрутів, які мають включати цей плагін до планів активації/завантаження.                                                                                                                    |
| `onConfigPaths`    | Ні          | `string[]`                                           | Шляхи конфігурації відносно кореня, які мають включати цей плагін до планів запуску/завантаження, коли шлях присутній і не вимкнений явно.                                                         |
| `onCapabilities`   | Ні          | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Широкі підказки можливостей, які використовуються плануванням активації control plane. За можливості надавайте перевагу вужчим полям.                                                              |

Поточні live-споживачі:

- Планування запуску Gateway використовує `activation.onStartup` для явного імпорту під час запуску
- планування CLI, що запускається командою, повертається до застарілих
  `commandAliases[].cliCommand` або `commandAliases[].name`
- планування запуску agent-runtime використовує `activation.onAgentHarnesses` для
  вбудованих harness і верхньорівневе `cliBackends[]` для CLI runtime-псевдонімів
- планування setup/channel, що запускається каналом, повертається до застарілого володіння `channels[]`,
  коли явних метаданих активації каналу немає
- планування плагінів під час запуску використовує `activation.onConfigPaths` для неканальних кореневих
  поверхонь конфігурації, як-от блок `browser` вбудованого browser-плагіна
- планування setup/runtime, що запускається провайдером, повертається до застарілого
  володіння `providers[]` і верхньорівневого `cliBackends[]`, коли явних метаданих активації провайдера немає

Діагностика планувальника може розрізняти явні підказки активації та fallback
володіння маніфесту. Наприклад, `activation-command-hint` означає, що
`activation.onCommands` збігся, тоді як `manifest-command-alias` означає, що
планувальник натомість використав володіння `commandAliases`. Ці мітки причин призначені для
діагностики хоста й тестів; автори плагінів мають і надалі оголошувати метадані,
які найкраще описують володіння.

## довідка з qaRunners

Use `qaRunners`, коли плагін додає один або кілька transport runner під
спільним коренем `openclaw qa`. Зберігайте ці метадані дешевими й статичними; runtime плагіна
й надалі володіє фактичною реєстрацією CLI через легку поверхню
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

| Поле          | Обов’язкове | Тип      | Що це означає                                                            |
| ------------- | ----------- | -------- | ------------------------------------------------------------------------ |
| `commandName` | Так         | `string` | Підкоманда, змонтована під `openclaw qa`, наприклад `matrix`.            |
| `description` | Ні          | `string` | Резервний текст довідки, який використовується, коли спільному хосту потрібна stub-команда. |

## довідка з setup

Use `setup`, коли поверхням setup і onboarding потрібні дешеві метадані, якими володіє плагін,
до завантаження runtime.

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

Верхньорівневе `cliBackends` залишається чинним і далі описує CLI inference
backends. `setup.cliBackends` є setup-специфічною поверхнею дескрипторів для
потоків control-plane/setup, які мають залишатися лише метаданими.

Коли присутні `setup.providers` і `setup.cliBackends`, вони є бажаною
descriptor-first поверхнею пошуку для виявлення setup. Якщо дескриптор лише
звужує кандидатний плагін, а setup все ще потребує багатших runtime hooks під час setup,
установіть `requiresRuntime: true` і залиште `setup-api` на місці як
резервний шлях виконання.

OpenClaw також включає `setup.providers[].envVars` до загальних пошуків авторизації провайдера та
env-var. `providerAuthEnvVars` залишається підтримуваним через compatibility
adapter протягом періоду вилучення, але невбудовані плагіни, які досі його використовують,
отримують діагностику маніфесту. Нові плагіни мають розміщувати env-метадані setup/status
у `setup.providers[].envVars`.

OpenClaw також може виводити прості setup choices із `setup.providers[].authMethods`,
коли немає setup entry або коли `setup.requiresRuntime: false`
оголошує, що setup runtime не потрібен. Явні записи `providerAuthChoices` залишаються
бажаними для власних міток, CLI-прапорців, onboarding scope і метаданих assistant.

Установлюйте `requiresRuntime: false` лише тоді, коли цих дескрипторів достатньо для
поверхні setup. OpenClaw трактує явне `false` як descriptor-only контракт
і не виконуватиме `setup-api` або `openclaw.setupEntry` для setup lookup. Якщо
descriptor-only плагін усе одно постачає один із цих setup runtime entries,
OpenClaw повідомляє additive diagnostic і продовжує його ігнорувати. Пропущене
`requiresRuntime` зберігає застарілу fallback-поведінку, щоб наявні плагіни, які додали
дескриптори без прапорця, не зламалися.

Оскільки setup lookup може виконувати код `setup-api`, яким володіє плагін, нормалізовані
значення `setup.providers[].id` і `setup.cliBackends[]` мають залишатися унікальними в усіх
виявлених плагінах. Неоднозначне володіння fail closed замість вибору
переможця за порядком виявлення.

Коли setup runtime виконується, діагностика setup registry повідомляє про descriptor
drift, якщо `setup-api` реєструє провайдера або CLI backend, які дескриптори маніфесту
не оголошують, або якщо дескриптор не має відповідної runtime
реєстрації. Ці діагностики є additive й не відхиляють застарілі плагіни.

### довідка з setup.providers

| Поле          | Обов’язкове | Тип        | Що це означає                                                                                         |
| -------------- | ----------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| `id`           | Так         | `string`   | Ідентифікатор провайдера, доступний під час setup або onboarding. Зберігайте нормалізовані ідентифікатори глобально унікальними. |
| `authMethods`  | Ні          | `string[]` | Ідентифікатори методів setup/auth, які цей провайдер підтримує без завантаження повного runtime.      |
| `envVars`      | Ні          | `string[]` | Env vars, які загальні поверхні setup/status можуть перевіряти до завантаження runtime плагіна.       |
| `authEvidence` | Ні          | `object[]` | Дешеві локальні перевірки auth evidence для провайдерів, які можуть автентифікуватися через non-secret markers. |

`authEvidence` призначений для локальних маркерів облікових даних, що належать провайдеру, які можна
перевірити без завантаження runtime-коду. Ці перевірки мають залишатися дешевими й локальними:
без мережевих викликів, без читання keychain або менеджера секретів, без shell-команд і без
проб API провайдера.

Підтримувані записи доказів:

| Поле              | Обов’язкове | Тип        | Що це означає                                                                                                  |
| ------------------ | -------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `type`             | Так      | `string`   | Наразі `local-file-with-env`.                                                                               |
| `fileEnvVar`       | Ні       | `string`   | Змінна середовища, що містить явний шлях до файла облікових даних.                                                           |
| `fallbackPaths`    | Ні       | `string[]` | Локальні шляхи до файлів облікових даних, які перевіряються, коли `fileEnvVar` відсутня або порожня. Підтримує `${HOME}` і `${APPDATA}`. |
| `requiresAnyEnv`   | Ні       | `string[]` | Принаймні одна зі вказаних змінних середовища має бути непорожньою, перш ніж доказ стане дійсним.                                    |
| `requiresAllEnv`   | Ні       | `string[]` | Кожна зі вказаних змінних середовища має бути непорожньою, перш ніж доказ стане дійсним.                                           |
| `credentialMarker` | Так      | `string`   | Несекретний маркер, що повертається, коли доказ присутній.                                                       |
| `source`           | Ні       | `string`   | Видима користувачу мітка джерела для виводу автентифікації/статусу.                                                               |

### Поля setup

| Поле              | Обов’язкове | Тип        | Що це означає                                                                                       |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | Ні       | `object[]` | Дескриптори налаштування провайдера, доступні під час setup і onboarding.                                     |
| `cliBackends`      | Ні       | `string[]` | Ідентифікатори бекендів часу налаштування, що використовуються для setup-пошуку спершу за дескриптором. Тримайте нормалізовані ідентифікатори глобально унікальними. |
| `configMigrations` | Ні       | `string[]` | Ідентифікатори міграцій конфігурації, що належать поверхні setup цього plugin.                                          |
| `requiresRuntime`  | Ні       | `boolean`  | Чи setup усе ще потребує виконання `setup-api` після пошуку дескриптора.                            |

## Довідник uiHints

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

| Поле         | Тип        | Що це означає                           |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Видима користувачу мітка поля.                |
| `help`        | `string`   | Короткий допоміжний текст.                      |
| `tags`        | `string[]` | Необов’язкові теги UI.                       |
| `advanced`    | `boolean`  | Позначає поле як розширене.            |
| `sensitive`   | `boolean`  | Позначає поле як секретне або чутливе. |
| `placeholder` | `string`   | Текст-заповнювач для полів форми.       |

## Довідник contracts

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

Кожен список є необов’язковим:

| Поле                            | Тип        | Що це означає                                                         |
| -------------------------------- | ---------- | --------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Ідентифікатори фабрик розширень app-server Codex, наразі `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | Runtime-ідентифікатори, для яких bundled plugin може реєструвати middleware результатів інструментів. |
| `externalAuthProviders`          | `string[]` | Ідентифікатори провайдерів, чий hook зовнішнього профілю автентифікації належить цьому plugin.       |
| `speechProviders`                | `string[]` | Ідентифікатори провайдерів мовлення, що належать цьому plugin.                                 |
| `realtimeTranscriptionProviders` | `string[]` | Ідентифікатори провайдерів транскрипції в реальному часі, що належать цьому plugin.                 |
| `realtimeVoiceProviders`         | `string[]` | Ідентифікатори голосових провайдерів реального часу, що належать цьому plugin.                         |
| `memoryEmbeddingProviders`       | `string[]` | Ідентифікатори провайдерів embedding пам’яті, що належать цьому plugin.                       |
| `mediaUnderstandingProviders`    | `string[]` | Ідентифікатори провайдерів розуміння медіа, що належать цьому plugin.                    |
| `imageGenerationProviders`       | `string[]` | Ідентифікатори провайдерів генерації зображень, що належать цьому plugin.                       |
| `videoGenerationProviders`       | `string[]` | Ідентифікатори провайдерів генерації відео, що належать цьому plugin.                       |
| `webFetchProviders`              | `string[]` | Ідентифікатори провайдерів web-fetch, що належать цьому plugin.                              |
| `webSearchProviders`             | `string[]` | Ідентифікатори провайдерів web-search, що належать цьому plugin.                             |
| `migrationProviders`             | `string[]` | Ідентифікатори провайдерів імпорту, що належать цьому plugin для `openclaw migrate`.          |
| `tools`                          | `string[]` | Назви інструментів агента, що належать цьому plugin.                                    |

`contracts.embeddedExtensionFactories` збережено для bundled фабрик розширень Codex
лише для app-server. Bundled перетворення результатів інструментів мають
оголошувати `contracts.agentToolResultMiddleware` і натомість реєструватися через
`api.registerAgentToolResultMiddleware(...)`. Зовнішні plugins не можуть
реєструвати middleware результатів інструментів, бо цей seam може переписувати високодовірений
вивід інструмента до того, як його побачить модель.

Runtime-реєстрації `api.registerTool(...)` мають відповідати `contracts.tools`.
Виявлення інструментів використовує цей список, щоб завантажувати лише ті runtimes plugin, які можуть володіти
запитаними інструментами.

Provider plugins, які реалізують `resolveExternalAuthProfiles`, мають оголошувати
`contracts.externalAuthProviders`. Plugins без такого оголошення все ще працюють
через застарілий fallback сумісності, але цей fallback повільніший і
буде вилучений після вікна міграції.

Bundled провайдери memory embedding мають оголошувати
`contracts.memoryEmbeddingProviders` для кожного ідентифікатора адаптера, який вони надають, включно з
вбудованими адаптерами, такими як `local`. Автономні CLI-шляхи використовують цей manifest
contract, щоб завантажити лише plugin-власника до того, як повний Gateway runtime
зареєструє провайдерів.

## Довідник mediaUnderstandingProviderMetadata

Використовуйте `mediaUnderstandingProviderMetadata`, коли провайдер розуміння медіа має
моделі за замовчуванням, пріоритет auto-auth fallback або нативну підтримку документів, які
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

| Поле                  | Тип                                 | Що це означає                                                                |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Медіаможливості, які надає цей провайдер.                                 |
| `defaultModels`        | `Record<string, string>`            | Значення за замовчуванням зіставлення можливості з моделлю, що використовуються, коли конфігурація не вказує модель.      |
| `autoPriority`         | `Record<string, number>`            | Менші числа сортуються раніше для автоматичного fallback провайдера на основі облікових даних. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Нативні вхідні документи, які підтримує провайдер.                            |

## Довідник channelConfigs

Використовуйте `channelConfigs`, коли channel plugin потребує дешевих метаданих конфігурації до
завантаження runtime. Виявлення setup/status каналів лише для читання може використовувати ці метадані
безпосередньо для налаштованих зовнішніх каналів, коли запис setup недоступний, або
коли `setup.requiresRuntime: false` оголошує runtime setup непотрібним.

`channelConfigs` — це метадані manifest plugin, а не новий top-level розділ користувацької конфігурації.
Користувачі й надалі налаштовують екземпляри каналів у `channels.<channel-id>`.
OpenClaw читає метадані manifest, щоб вирішити, який plugin володіє цим налаштованим
каналом до виконання runtime-коду plugin.

Для channel plugin `configSchema` і `channelConfigs` описують різні
шляхи:

- `configSchema` перевіряє `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` перевіряє `channels.<channel-id>`

Non-bundled plugins, які оголошують `channels[]`, також мають оголошувати відповідні
записи `channelConfigs`. Без них OpenClaw усе ще може завантажити plugin, але
cold-path schema конфігурації, setup і поверхні Control UI не можуть знати
форму опцій, що належать каналу, доки runtime plugin не виконається.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` і
`nativeSkillsAutoEnabled` можуть оголошувати статичні значення за замовчуванням `auto` для перевірок конфігурації команд,
які виконуються до завантаження runtime каналу. Bundled канали також можуть публікувати
такі самі значення за замовчуванням через `package.json#openclaw.channel.commands` поруч
з іншими метаданими каталогу каналів, що належать їхньому package.

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

| Поле          | Тип                      | Що це означає                                                                                                      |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `schema`      | `object`                 | JSON Schema для `channels.<id>`. Обов’язкове для кожного оголошеного запису конфігурації каналу.                  |
| `uiHints`     | `Record<string, object>` | Необов’язкові UI-мітки/заповнювачі/підказки чутливості для цього розділу конфігурації каналу.                    |
| `label`       | `string`                 | Мітка каналу, що додається до поверхонь вибору та перегляду, коли метадані runtime ще не готові.                  |
| `description` | `string`                 | Короткий опис каналу для поверхонь перегляду та каталогу.                                                          |
| `commands`    | `object`                 | Статична нативна команда та нативні автоматичні типові значення Skills для перевірок конфігурації до runtime.     |
| `preferOver`  | `string[]`               | Ідентифікатори застарілих або нижчопріоритетних Plugin-ів, які цей канал має випереджати на поверхнях вибору.     |

### Заміна іншого Plugin каналу

Використовуйте `preferOver`, коли ваш Plugin є пріоритетним власником для ідентифікатора каналу, який
також може надавати інший Plugin. Типові випадки: перейменований ідентифікатор Plugin,
окремий Plugin, що замінює bundled Plugin, або підтримуваний форк, який
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

Коли `channels.chat` налаштовано, OpenClaw враховує і ідентифікатор каналу, і
ідентифікатор пріоритетного Plugin. Якщо нижчопріоритетний Plugin було вибрано лише тому, що
він bundled або ввімкнений за замовчуванням, OpenClaw вимикає його в ефективній
runtime-конфігурації, щоб один Plugin володів каналом і його інструментами. Явний
вибір користувача все одно має перевагу: якщо користувач явно вмикає обидва Plugin-и, OpenClaw
зберігає цей вибір і повідомляє діагностику дубльованих каналів/інструментів замість
тихої зміни запитаного набору Plugin-ів.

Обмежуйте `preferOver` ідентифікаторами Plugin-ів, які справді можуть надавати той самий канал.
Це не загальне поле пріоритету і воно не перейменовує ключі користувацької конфігурації.

## Довідник modelSupport

Використовуйте `modelSupport`, коли OpenClaw має визначати ваш provider Plugin з
коротких ідентифікаторів моделей на кшталт `gpt-5.5` або `claude-sonnet-4.6` до завантаження
runtime Plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw застосовує такий порядок пріоритету:

- явні посилання `provider/model` використовують метадані маніфесту `providers` власника
- `modelPatterns` мають перевагу над `modelPrefixes`
- якщо збігаються один non-bundled Plugin і один bundled Plugin, перемагає non-bundled
  Plugin
- решта неоднозначностей ігнорується, доки користувач або конфігурація не вкаже provider

Поля:

| Поле            | Тип        | Що це означає                                                                                       |
| --------------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Префікси, що зіставляються через `startsWith` із короткими ідентифікаторами моделей.                |
| `modelPatterns` | `string[]` | Джерела регулярних виразів, що зіставляються з короткими ідентифікаторами моделей після вилучення суфікса профілю. |

## Довідник modelCatalog

Використовуйте `modelCatalog`, коли OpenClaw має знати метадані моделей provider до
завантаження runtime Plugin. Це джерело, яким володіє маніфест, для фіксованих рядків каталогу,
псевдонімів provider, правил пригнічення та режиму виявлення. Runtime-оновлення
й надалі належить коду runtime provider, але маніфест повідомляє core, коли runtime
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

| Поле           | Тип                                                      | Що це означає                                                                                                          |
| -------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | Рядки каталогу для ідентифікаторів provider, якими володіє цей Plugin. Ключі також мають бути в `providers` верхнього рівня. |
| `aliases`      | `Record<string, object>`                                 | Псевдоніми provider, які мають розв’язуватися до provider, яким володіють, для планування каталогу або пригнічень.      |
| `suppressions` | `object[]`                                               | Рядки моделей з іншого джерела, які цей Plugin пригнічує з причини, специфічної для provider.                          |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Чи можна прочитати каталог provider з метаданих маніфесту, оновити в кеш або чи він потребує runtime.                  |

`aliases` бере участь у пошуку власника provider для планування каталогу моделей.
Цілі псевдонімів мають бути provider верхнього рівня, якими володіє той самий Plugin. Коли
список, відфільтрований за provider, використовує псевдонім, OpenClaw може прочитати маніфест власника та
застосувати перевизначення API/base URL псевдоніма без завантаження runtime provider.
Псевдоніми не розширюють невідфільтровані списки каталогу; широкі списки виводять лише рядки
канонічного provider власника.

`suppressions` замінює старий runtime-хук provider `suppressBuiltInModel`.
Записи пригнічення враховуються лише тоді, коли provider належить Plugin або
оголошений як ключ `modelCatalog.aliases`, що вказує на provider, яким володіють. Runtime-
хуки пригнічення більше не викликаються під час розв’язання моделей.

Поля provider:

| Поле      | Тип                      | Що це означає                                                                  |
| --------- | ------------------------ | ------------------------------------------------------------------------------ |
| `baseUrl` | `string`                 | Необов’язкова типова base URL для моделей у цьому каталозі provider.           |
| `api`     | `ModelApi`               | Необов’язковий типовий API-адаптер для моделей у цьому каталозі provider.      |
| `headers` | `Record<string, string>` | Необов’язкові статичні заголовки, що застосовуються до цього каталогу provider. |
| `models`  | `object[]`               | Обов’язкові рядки моделей. Рядки без `id` ігноруються.                         |

Поля моделі:

| Поле           | Тип                                                            | Що це означає                                                                 |
| --------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `id`            | `string`                                                       | Локальний для provider ідентифікатор моделі, без префікса `provider/`.        |
| `name`          | `string`                                                       | Необов’язкова відображувана назва.                                            |
| `api`           | `ModelApi`                                                     | Необов’язкове перевизначення API для окремої моделі.                          |
| `baseUrl`       | `string`                                                       | Необов’язкове перевизначення base URL для окремої моделі.                     |
| `headers`       | `Record<string, string>`                                       | Необов’язкові статичні заголовки для окремої моделі.                          |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Модальності, які приймає модель.                                              |
| `reasoning`     | `boolean`                                                      | Чи надає модель поведінку reasoning.                                          |
| `contextWindow` | `number`                                                       | Нативне контекстне вікно provider.                                            |
| `contextTokens` | `number`                                                       | Необов’язкове ефективне runtime-обмеження контексту, якщо воно відрізняється від `contextWindow`. |
| `maxTokens`     | `number`                                                       | Максимальна кількість output-токенів, якщо відома.                            |
| `cost`          | `object`                                                       | Необов’язкова ціна в USD за мільйон токенів, зокрема необов’язкове `tieredPricing`. |
| `compat`        | `object`                                                       | Необов’язкові прапорці сумісності, що відповідають сумісності конфігурації моделей OpenClaw. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Статус у списку. Пригнічуйте лише тоді, коли рядок узагалі не має з’являтися. |
| `statusReason`  | `string`                                                       | Необов’язкова причина, що показується зі статусом, відмінним від available.   |
| `replaces`      | `string[]`                                                     | Старі локальні для provider ідентифікатори моделей, які ця модель замінює.    |
| `replacedBy`    | `string`                                                       | Локальний для provider ідентифікатор моделі-заміни для застарілих рядків.     |
| `tags`          | `string[]`                                                     | Стабільні теги, що використовуються засобами вибору та фільтрами.             |

Поля пригнічення:

| Поле                       | Тип        | Що це означає                                                                                                      |
| -------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------ |
| `provider`                 | `string`   | Ідентифікатор provider для upstream-рядка, який потрібно пригнітити. Має належати цьому Plugin або бути оголошеним як власний псевдонім. |
| `model`                    | `string`   | Локальний для provider ідентифікатор моделі, яку потрібно пригнітити.                                              |
| `reason`                   | `string`   | Необов’язкове повідомлення, що показується, коли пригнічений рядок запитується напряму.                            |
| `when.baseUrlHosts`        | `string[]` | Необов’язковий список ефективних хостів base URL provider, потрібних перед застосуванням пригнічення.              |
| `when.providerConfigApiIn` | `string[]` | Необов’язковий список точних значень `api` конфігурації provider, потрібних перед застосуванням пригнічення.       |

Не розміщуйте дані, призначені лише для середовища виконання, у `modelCatalog`. Використовуйте `static` лише тоді, коли рядки маніфесту достатньо повні, щоб поверхні списку з фільтрацією за провайдером і вибору могли пропускати виявлення реєстру/середовища виконання. Використовуйте `refreshable`, коли рядки маніфесту корисні як початкові або додаткові елементи списку, але оновлення/кеш може додати більше рядків пізніше; рядки refreshable самі по собі не є авторитетними. Використовуйте `runtime`, коли OpenClaw має завантажити середовище виконання провайдера, щоб дізнатися список.

## Довідник `modelIdNormalization`

Використовуйте `modelIdNormalization` для дешевого очищення ідентифікаторів моделей, яке належить провайдеру та має відбутися до завантаження середовища виконання провайдера. Це тримає псевдоніми, як-от короткі назви моделей, застарілі локальні ідентифікатори провайдера та правила префіксів проксі, у маніфесті належного Plugin, а не в таблицях вибору моделей ядра.

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

| Поле                                 | Тип                     | Що означає                                                                                              |
| ------------------------------------ | ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Точні псевдоніми ідентифікаторів моделей без урахування регістру. Значення повертаються як записані.   |
| `stripPrefixes`                      | `string[]`              | Префікси, які треба видалити перед пошуком псевдоніма; корисно для застарілого дублювання провайдер/модель. |
| `prefixWhenBare`                     | `string`                | Префікс, який додається, коли нормалізований ідентифікатор моделі ще не містить `/`.                    |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Умовні правила префіксів для голих ідентифікаторів після пошуку псевдоніма, з ключами `modelPrefix` і `prefix`. |

## Довідник `providerEndpoints`

Використовуйте `providerEndpoints` для класифікації кінцевих точок, яку загальна політика запитів має знати до завантаження середовища виконання провайдера. Ядро й надалі визначає значення кожного `endpointClass`; маніфести Plugin володіють метаданими хоста й базової URL-адреси.

Поля кінцевої точки:

| Поле                           | Тип        | Що означає                                                                                                  |
| ------------------------------ | ---------- | ----------------------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Відомий ядру клас кінцевої точки, як-от `openrouter`, `moonshot-native` або `google-vertex`.                |
| `hosts`                        | `string[]` | Точні імена хостів, які відповідають класу кінцевої точки.                                                  |
| `hostSuffixes`                 | `string[]` | Суфікси хостів, які відповідають класу кінцевої точки. Додавайте префікс `.` для зіставлення лише суфікса домену. |
| `baseUrls`                     | `string[]` | Точні нормалізовані базові HTTP(S) URL-адреси, які відповідають класу кінцевої точки.                       |
| `googleVertexRegion`           | `string`   | Статичний регіон Google Vertex для точних глобальних хостів.                                                |
| `googleVertexRegionHostSuffix` | `string`   | Суфікс, який треба вилучити зі збіжних хостів, щоб відкрити префікс регіону Google Vertex.                  |

## Довідник `providerRequest`

Використовуйте `providerRequest` для дешевих метаданих сумісності запитів, які потрібні загальній політиці запитів без завантаження середовища виконання провайдера. Переписування payload, специфічне для поведінки, залишайте в runtime-хуках провайдера або спільних допоміжних засобах сімейства провайдерів.

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

| Поле                  | Тип          | Що означає                                                                                          |
| --------------------- | ------------ | --------------------------------------------------------------------------------------------------- |
| `family`              | `string`     | Мітка сімейства провайдера, яку використовують загальні рішення сумісності запитів і діагностика.   |
| `compatibilityFamily` | `"moonshot"` | Необов’язковий кошик сумісності сімейства провайдерів для спільних допоміжних засобів запитів.      |
| `openAICompletions`   | `object`     | Прапорці запитів completions, сумісних з OpenAI, наразі `supportsStreamingUsage`.                    |

## Довідник `modelPricing`

Використовуйте `modelPricing`, коли провайдеру потрібна поведінка ціноутворення контрольної площини до завантаження середовища виконання. Кеш ціноутворення Gateway читає ці метадані без імпорту коду середовища виконання провайдера.

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

| Поле         | Тип               | Що означає                                                                                              |
| ------------ | ----------------- | ------------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Установіть `false` для локальних/самостійно розміщених провайдерів, які ніколи не повинні отримувати ціни OpenRouter або LiteLLM. |
| `openRouter` | `false \| object` | Зіставлення для пошуку цін OpenRouter. `false` вимикає пошук OpenRouter для цього провайдера.           |
| `liteLLM`    | `false \| object` | Зіставлення для пошуку цін LiteLLM. `false` вимикає пошук LiteLLM для цього провайдера.                 |

Поля джерела:

| Поле                       | Тип                | Що означає                                                                                                      |
| -------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Ідентифікатор провайдера зовнішнього каталогу, коли він відрізняється від ідентифікатора провайдера OpenClaw, наприклад `z-ai` для провайдера `zai`. |
| `passthroughProviderModel` | `boolean`          | Обробляти ідентифікатори моделей зі слешами як вкладені посилання провайдер/модель; корисно для проксі-провайдерів, як-от OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Додаткові варіанти ідентифікаторів моделей зовнішнього каталогу. `version-dots` пробує ідентифікатори версій із крапками, як-от `claude-opus-4.6`. |

### Індекс провайдерів OpenClaw

Індекс провайдерів OpenClaw — це прев’ю-метадані провайдерів, якими володіє OpenClaw, для провайдерів, чиї Plugins можуть бути ще не встановлені. Він не є частиною маніфесту Plugin. Маніфести Plugin залишаються авторитетним джерелом для встановленого Plugin. Індекс провайдерів — це внутрішній резервний контракт, який майбутні поверхні встановлюваних провайдерів і вибору моделей до встановлення використовуватимуть, коли Plugin провайдера не встановлено.

Порядок авторитетності каталогу:

1. Конфігурація користувача.
2. `modelCatalog` маніфесту встановленого Plugin.
3. Кеш каталогу моделей з явного оновлення.
4. Прев’ю-рядки індексу провайдерів OpenClaw.

Індекс провайдерів не повинен містити секрети, увімкнений стан, runtime-хуки або живі дані моделей, специфічні для облікового запису. Його прев’ю-каталоги використовують ту саму форму рядка провайдера `modelCatalog`, що й маніфести Plugin, але мають залишатися обмеженими стабільними метаданими відображення, якщо runtime-поля адаптера, як-от `api`, `baseUrl`, ціноутворення або прапорці сумісності, не підтримуються навмисно узгодженими з маніфестом встановленого Plugin. Провайдери з live-виявленням `/models` повинні записувати оновлені рядки через явний шлях кешу каталогу моделей, а не змушувати звичайний список або onboarding викликати API провайдера.

Записи індексу провайдерів також можуть містити метадані встановлюваного Plugin для провайдерів, чий Plugin перенесено з ядра або який інакше ще не встановлено. Ці метадані віддзеркалюють шаблон каталогу каналів: назви пакета, npm install spec, очікуваної цілісності та дешевих міток вибору автентифікації достатньо, щоб показати варіант встановлюваного налаштування. Після встановлення Plugin його маніфест перемагає, а запис індексу провайдерів для цього провайдера ігнорується.

Застарілі ключі можливостей верхнього рівня вважаються застарілими. Використовуйте `openclaw doctor --fix`, щоб перемістити `speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders` і `webSearchProviders` під `contracts`; звичайне завантаження маніфесту більше не розглядає ці поля верхнього рівня як володіння можливостями.

## Маніфест і package.json

Ці два файли виконують різні завдання:

| Файл                   | Для чого використовувати                                                                                                      |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Виявлення, перевірка конфігурації, метадані вибору автентифікації та підказки UI, які мають існувати до запуску коду Plugin   |
| `package.json`         | Метадані npm, встановлення залежностей і блок `openclaw`, який використовується для entrypoints, install gating, setup або метаданих каталогу |

Якщо ви не впевнені, де має бути частина метаданих, використовуйте це правило:

- якщо OpenClaw має знати це до завантаження коду Plugin, помістіть це в `openclaw.plugin.json`
- якщо це стосується пакування, вхідних файлів або поведінки встановлення npm, помістіть це в `package.json`

### Поля package.json, що впливають на виявлення

Деякі pre-runtime метадані Plugin навмисно живуть у `package.json` у блоці `openclaw`, а не в `openclaw.plugin.json`.

Важливі приклади:

| Поле                                                                                       | Що це означає                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                                                      | Оголошує нативні точки входу plugin. Має залишатися всередині каталогу пакета plugin.                                                                                                           |
| `openclaw.runtimeExtensions`                                                               | Оголошує зібрані точки входу JavaScript runtime для встановлених пакетів. Має залишатися всередині каталогу пакета plugin.                                                                     |
| `openclaw.setupEntry`                                                                      | Легка точка входу лише для налаштування, що використовується під час onboarding, відкладеного запуску каналу та виявлення стану каналу лише для читання/SecretRef. Має залишатися всередині каталогу пакета plugin. |
| `openclaw.runtimeSetupEntry`                                                               | Оголошує зібрану точку входу JavaScript для налаштування встановлених пакетів. Вимагає `setupEntry`, має існувати та має залишатися всередині каталогу пакета plugin.                         |
| `openclaw.channel`                                                                         | Дешеві метадані каталогу каналів, як-от мітки, шляхи документації, псевдоніми та текст для вибору.                                                                                             |
| `openclaw.channel.commands`                                                                | Статичні метадані нативних команд і автоматичних стандартних значень нативних skill, що використовуються поверхнями конфігурації, аудиту та списку команд до завантаження runtime каналу.      |
| `openclaw.channel.configuredState`                                                         | Легкі метадані перевірки configured-state, які можуть відповісти на запитання "чи вже існує налаштування лише через env?" без завантаження повного runtime каналу.                             |
| `openclaw.channel.persistedAuthState`                                                      | Легкі метадані перевірки persisted-auth, які можуть відповісти на запитання "чи вже хтось увійшов у систему?" без завантаження повного runtime каналу.                                         |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Підказки встановлення/оновлення для вбудованих і зовнішньо опублікованих plugins.                                                                                                             |
| `openclaw.install.defaultChoice`                                                           | Бажаний шлях встановлення, коли доступно кілька джерел встановлення.                                                                                                                           |
| `openclaw.install.minHostVersion`                                                          | Мінімальна підтримувана версія хоста OpenClaw із використанням нижньої межі semver, як-от `>=2026.3.22` або `>=2026.5.1-beta.1`.                                                               |
| `openclaw.install.expectedIntegrity`                                                       | Очікуваний рядок integrity npm dist, наприклад `sha512-...`; потоки встановлення й оновлення перевіряють отриманий артефакт за ним.                                                           |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Дозволяє вузький шлях відновлення через перевстановлення вбудованого plugin, коли конфігурація недійсна.                                                                                       |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Дає змогу поверхням каналів лише для налаштування завантажуватися перед повним plugin каналу під час запуску.                                                                                  |

Метадані маніфесту визначають, які варіанти provider/каналу/налаштування з'являються в
onboarding до завантаження runtime. `package.json#openclaw.install` повідомляє
onboarding, як отримати або ввімкнути цей plugin, коли користувач вибирає один із цих
варіантів. Не переміщуйте підказки встановлення в `openclaw.plugin.json`.

`openclaw.install.minHostVersion` застосовується під час встановлення та завантаження
реєстру маніфестів для невбудованих джерел plugin. Недійсні значення відхиляються;
новіші, але дійсні значення пропускають зовнішні plugins на старіших хостах. Вбудовані вихідні
plugins вважаються співверсійними з checkout хоста.

Офіційні метадані встановлення на вимогу мають використовувати `clawhubSpec`, коли plugin
опубліковано в ClawHub; onboarding розглядає це як бажане віддалене джерело та
записує факти артефакту ClawHub після встановлення. `npmSpec` залишається fallback
сумісності для пакетів, які ще не перейшли до ClawHub.

Точне закріплення версії npm уже міститься в `npmSpec`, наприклад
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Офіційні зовнішні записи каталогу
мають поєднувати точні специфікації з `expectedIntegrity`, щоб потоки оновлення
завершувалися закрито, якщо отриманий артефакт npm більше не відповідає закріпленому випуску.
Інтерактивний onboarding усе ще пропонує довірені специфікації npm registry, зокрема прості
імена пакетів і dist-tags, для сумісності. Діагностика каталогу може
розрізняти точні, плаваючі, закріплені integrity, з відсутнім integrity, із невідповідністю імені пакета
та недійсні джерела default-choice. Вона також попереджає, коли
`expectedIntegrity` присутній, але немає дійсного джерела npm, яке він може закріпити.
Коли `expectedIntegrity` присутній,
потоки встановлення/оновлення примусово застосовують його; коли його пропущено, результат registry resolution
записується без закріплення integrity.

Plugins каналів мають надавати `openclaw.setupEntry`, коли перевірки стану, списку каналів
або SecretRef мають ідентифікувати налаштовані облікові записи без завантаження повного
runtime. Точка входу setup має відкривати метадані каналу плюс безпечні для setup адаптери конфігурації,
стану та secrets; мережеві клієнти, слухачі Gateway та transport runtimes тримайте в головній точці входу extension.

Поля точки входу runtime не перевизначають перевірки меж пакета для полів
вихідної точки входу. Наприклад, `openclaw.runtimeExtensions` не може зробити
шлях `openclaw.extensions`, що виходить за межі, завантажуваним.

`openclaw.install.allowInvalidConfigRecovery` навмисно вузький. Він не робить
довільні зламані конфігурації придатними до встановлення. Наразі він лише дозволяє потокам встановлення
відновлюватися після конкретних застарілих збоїв оновлення вбудованого plugin, як-от
відсутній шлях вбудованого plugin або застарілий запис `channels.<id>` для того самого
вбудованого plugin. Непов'язані помилки конфігурації все ще блокують встановлення та спрямовують операторів
до `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` — це метадані пакета для крихітного модуля
перевірки:

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

Використовуйте їх, коли setup, doctor, status або потоки присутності лише для читання потребують дешевого
auth-зондування yes/no до завантаження повного plugin каналу. Збережений auth state не є
налаштованим станом каналу: не використовуйте ці метадані для автоматичного ввімкнення plugins,
ремонту runtime dependencies або рішення, чи має завантажуватися runtime каналу.
Цільовий export має бути невеликою функцією, яка читає лише збережений стан; не
проводьте її через повний barrel runtime каналу.

`openclaw.channel.configuredState` має таку саму форму для дешевих перевірок configured лише через env:

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

Використовуйте це, коли канал може відповісти на configured-state з env або інших крихітних
non-runtime вхідних даних. Якщо перевірка потребує повного розв'язання конфігурації або справжнього
runtime каналу, залиште цю логіку в hook `config.hasConfiguredState`
plugin.

## Пріоритет виявлення (дублікати ідентифікаторів plugin)

OpenClaw виявляє plugins із кількох roots (вбудовані, глобальне встановлення, workspace, явно вибрані в конфігурації шляхи). Якщо два виявлені елементи мають однаковий `id`, зберігається лише маніфест із **найвищим пріоритетом**; дублікати з нижчим пріоритетом відкидаються замість завантаження поруч із ним.

Пріоритет, від найвищого до найнижчого:

1. **Вибраний у конфігурації** — шлях, явно закріплений у `plugins.entries.<id>`
2. **Вбудований** — plugins, що постачаються з OpenClaw
3. **Глобальне встановлення** — plugins, встановлені в глобальний root plugins OpenClaw
4. **Workspace** — plugins, виявлені відносно поточного workspace

Наслідки:

- Forked або застаріла копія вбудованого plugin у workspace не затінить вбудовану збірку.
- Щоб фактично перевизначити вбудований plugin локальним, закріпіть його через `plugins.entries.<id>`, щоб він виграв за пріоритетом, а не покладався на виявлення workspace.
- Відкидання дублікатів логуються, щоб Doctor і діагностика запуску могли вказати на відкинуту копію.
- Діагностика формулює перевизначення дублікатів, вибраних у конфігурації, як явні overrides, але все одно попереджає, щоб застарілі forks і випадкові shadowing залишалися видимими.

## Вимоги JSON Schema

- **Кожен plugin має постачати JSON Schema**, навіть якщо він не приймає конфігурацію.
- Порожня schema прийнятна (наприклад, `{ "type": "object", "additionalProperties": false }`).
- Schemas перевіряються під час читання/запису конфігурації, а не під час runtime.
- Коли розширюєте або форкаєте вбудований plugin із новими ключами конфігурації, одночасно оновіть `configSchema` цього plugin у `openclaw.plugin.json`. Schemas вбудованих plugins суворі, тому додавання `plugins.entries.<id>.config.myNewKey` у конфігурацію користувача без додавання `myNewKey` до `configSchema.properties` буде відхилено до завантаження runtime plugin.

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

## Поведінка перевірки

- Невідомі ключі `channels.*` є **помилками**, якщо ідентифікатор каналу не оголошено
  маніфестом plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` і `plugins.slots.*`
  мають посилатися на **виявлювані** ідентифікатори plugin. Невідомі ідентифікатори є **помилками**.
- Якщо plugin встановлено, але він має зламаний або відсутній маніфест чи schema,
  перевірка завершується невдало, а Doctor повідомляє про помилку plugin.
- Якщо конфігурація plugin існує, але plugin **disabled**, конфігурація зберігається, а
  **warning** показується в Doctor + logs.

Див. [Довідник конфігурації](/uk/gateway/configuration) для повної schema `plugins.*`.

## Примітки

- Маніфест є **обов’язковим для нативних Plugin OpenClaw**, включно із завантаженням із локальної файлової системи. Runtime досі завантажує модуль Plugin окремо; маніфест потрібен лише для виявлення + перевірки.
- Нативні маніфести обробляються за допомогою JSON5, тому коментарі, кінцеві коми та ключі без лапок приймаються, якщо кінцеве значення все ще є об’єктом.
- Завантажувач маніфестів читає лише задокументовані поля маніфесту. Уникайте власних ключів верхнього рівня.
- `channels`, `providers`, `cliBackends` і `skills` можна не вказувати, якщо Plugin їх не потребує.
- `providerDiscoveryEntry` має залишатися легковажним і не повинен імпортувати широкий runtime-код; використовуйте його для статичних метаданих каталогу провайдерів або вузьких дескрипторів виявлення, а не для виконання під час запиту.
- Ексклюзивні види Plugin вибираються через `plugins.slots.*`: `kind: "memory"` через `plugins.slots.memory`, `kind: "context-engine"` через `plugins.slots.contextEngine` (типово `legacy`).
- Оголошуйте ексклюзивний вид Plugin у цьому маніфесті. `OpenClawPluginDefinition.kind` у runtime-вході застаріло й залишається лише як fallback сумісності для старіших Plugin.
- Метадані змінних середовища (`setup.providers[].envVars`, застарілі `providerAuthEnvVars` і `channelEnvVars`) є лише декларативними. Статус, аудит, перевірка доставки cron та інші поверхні лише для читання все одно застосовують довіру до Plugin і політику фактичної активації, перш ніж вважати змінну середовища налаштованою.
- Для метаданих runtime-майстра, яким потрібен код провайдера, див. [runtime-хуки провайдера](/uk/plugins/architecture-internals#provider-runtime-hooks).
- Якщо ваш Plugin залежить від нативних модулів, задокументуйте кроки збирання та будь-які вимоги до allowlist менеджера пакетів (наприклад, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Пов’язане

<CardGroup cols={3}>
  <Card title="Створення Plugin" href="/uk/plugins/building-plugins" icon="rocket">
    Початок роботи з Plugin.
  </Card>
  <Card title="Архітектура Plugin" href="/uk/plugins/architecture" icon="diagram-project">
    Внутрішня архітектура та модель можливостей.
  </Card>
  <Card title="Огляд SDK" href="/uk/plugins/sdk-overview" icon="book">
    Довідник SDK для Plugin та імпорти підшляхів.
  </Card>
</CardGroup>
