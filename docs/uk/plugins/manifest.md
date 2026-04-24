---
read_when:
    - Ви створюєте Plugin OpenClaw
    - Вам потрібно постачати схему конфігурації Plugin або налагоджувати помилки валідації Plugin
summary: Вимоги до маніфесту Plugin + схеми JSON (сувора валідація конфігурації)
title: Маніфест Plugin
x-i18n:
    generated_at: "2026-04-24T03:06:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2e9e38ce695faf9638538b6d4761ee64126f5adee944be1373a02e897853a49d
    source_path: plugins/manifest.md
    workflow: 15
---

Ця сторінка призначена лише для **рідного маніфесту Plugin OpenClaw**.

Для сумісних макетів bundle див. [bundles Plugin](/uk/plugins/bundles).

Сумісні формати bundle використовують інші файли маніфесту:

- bundle Codex: `.codex-plugin/plugin.json`
- bundle Claude: `.claude-plugin/plugin.json` або стандартний макет компонента Claude
  без маніфесту
- bundle Cursor: `.cursor-plugin/plugin.json`

OpenClaw також автоматично виявляє ці макети bundle, але вони не проходять валідацію
за схемою `openclaw.plugin.json`, описаною тут.

Для сумісних bundle OpenClaw наразі зчитує метадані bundle, а також оголошені
корені skills, корені команд Claude, типові значення `settings.json` bundle Claude,
типові значення LSP bundle Claude та підтримувані набори hook, якщо макет відповідає
очікуванням середовища виконання OpenClaw.

Кожен рідний Plugin OpenClaw **повинен** постачати файл `openclaw.plugin.json` у
**корені Plugin**. OpenClaw використовує цей маніфест для валідації конфігурації
**без виконання коду Plugin**. Відсутні або недійсні маніфести вважаються
помилками Plugin і блокують валідацію конфігурації.

Див. повний посібник із системи Plugin: [Plugins](/uk/tools/plugin).
Щодо рідної моделі можливостей і поточних рекомендацій із зовнішньої сумісності:
[Модель можливостей](/uk/plugins/architecture#public-capability-model).

## Що робить цей файл

`openclaw.plugin.json` — це метадані, які OpenClaw зчитує **до завантаження коду
вашого Plugin**. Усе нижче має бути достатньо дешевим для перевірки без запуску
середовища виконання Plugin.

**Використовуйте його для:**

- ідентичності Plugin, валідації конфігурації та підказок для UI конфігурації
- метаданих auth, onboarding і налаштування (псевдонім, автоувімкнення, змінні середовища provider, варіанти auth)
- підказок активації для поверхонь control-plane
- скороченого володіння сімейством моделей
- статичних знімків володіння можливостями (`contracts`)
- метаданих QA runner, які може перевіряти спільний хост `openclaw qa`
- метаданих конфігурації, специфічних для channel, що об’єднуються в поверхні каталогу та валідації

**Не використовуйте його для:** реєстрації поведінки під час виконання, оголошення
точок входу коду або метаданих встановлення npm. Для цього призначені код вашого Plugin
і `package.json`.

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
  "providerEndpoints": [
    {
      "endpointClass": "xai-native",
      "hosts": ["api.x.ai"]
    }
  ],
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

| Поле                                 | Обов’язкове | Тип                              | Що воно означає                                                                                                                                                                                                                   |
| ------------------------------------ | ----------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Так         | `string`                         | Канонічний id Plugin. Це id, який використовується в `plugins.entries.<id>`.                                                                                                                                                     |
| `configSchema`                       | Так         | `object`                         | Вбудована JSON Schema для конфігурації цього Plugin.                                                                                                                                                                             |
| `enabledByDefault`                   | Ні          | `true`                           | Позначає вбудований Plugin як увімкнений за замовчуванням. Пропустіть це поле або задайте будь-яке значення, відмінне від `true`, щоб залишити Plugin вимкненим за замовчуванням.                                             |
| `legacyPluginIds`                    | Ні          | `string[]`                       | Застарілі id, які нормалізуються до цього канонічного id Plugin.                                                                                                                                                                 |
| `autoEnableWhenConfiguredProviders`  | Ні          | `string[]`                       | Id provider, які мають автоматично вмикати цей Plugin, коли auth, конфігурація або посилання на моделі згадують їх.                                                                                                            |
| `kind`                               | Ні          | `"memory"` \| `"context-engine"` | Оголошує ексклюзивний тип Plugin, який використовується `plugins.slots.*`.                                                                                                                                                       |
| `channels`                           | Ні          | `string[]`                       | Id channel, якими володіє цей Plugin. Використовується для виявлення та валідації конфігурації.                                                                                                                                 |
| `providers`                          | Ні          | `string[]`                       | Id provider, якими володіє цей Plugin.                                                                                                                                                                                            |
| `modelSupport`                       | Ні          | `object`                         | Скорочені метадані сімейства моделей, що належать маніфесту, які використовуються для автоматичного завантаження Plugin до виконання.                                                                                          |
| `providerEndpoints`                  | Ні          | `object[]`                       | Метадані host/baseUrl кінцевих точок, що належать маніфесту, для маршрутів provider, які ядро має класифікувати до завантаження середовища виконання provider.                                                                  |
| `cliBackends`                        | Ні          | `string[]`                       | Id backend виведення CLI, якими володіє цей Plugin. Використовується для автоактивації під час запуску на основі явних посилань у конфігурації.                                                                                |
| `syntheticAuthRefs`                  | Ні          | `string[]`                       | Посилання на provider або backend CLI, чиї синтетичні hook auth, що належать Plugin, мають перевірятися під час холодного виявлення моделей до завантаження середовища виконання.                                              |
| `nonSecretAuthMarkers`               | Ні          | `string[]`                       | Значення-заповнювачі API key, що належать вбудованому Plugin і представляють не секретний локальний стан, стан OAuth або стан облікових даних середовища.                                                                      |
| `commandAliases`                     | Ні          | `object[]`                       | Імена команд, якими володіє цей Plugin і які мають створювати обізнану щодо Plugin конфігурацію та діагностику CLI до завантаження середовища виконання.                                                                        |
| `providerAuthEnvVars`                | Ні          | `Record<string, string[]>`       | Легкі метадані змінних середовища auth provider, які OpenClaw може перевіряти без завантаження коду Plugin.                                                                                                                    |
| `providerAuthAliases`                | Ні          | `Record<string, string>`         | Id provider, які мають повторно використовувати інший id provider для пошуку auth, наприклад provider для кодування, який спільно використовує API key і профілі auth базового provider.                                       |
| `channelEnvVars`                     | Ні          | `Record<string, string[]>`       | Легкі метадані змінних середовища channel, які OpenClaw може перевіряти без завантаження коду Plugin. Використовуйте це для налаштування channel через змінні середовища або поверхонь auth, які мають бачити загальні помічники запуску/конфігурації. |
| `providerAuthChoices`                | Ні          | `object[]`                       | Легкі метадані варіантів auth для засобів вибору onboarding, визначення пріоритетного provider і простого зв’язування прапорців CLI.                                                                                           |
| `activation`                         | Ні          | `object`                         | Легкі підказки активації для завантаження, ініційованого provider, командою, channel, маршрутом і можливістю. Лише метадані; фактична поведінка все одно належить середовищу виконання Plugin.                                |
| `setup`                              | Ні          | `object`                         | Легкі дескриптори налаштування/onboarding, які поверхні виявлення та налаштування можуть перевіряти без завантаження середовища виконання Plugin.                                                                               |
| `qaRunners`                          | Ні          | `object[]`                       | Легкі дескриптори QA runner, які використовуються спільним хостом `openclaw qa` до завантаження середовища виконання Plugin.                                                                                                   |
| `contracts`                          | Ні          | `object`                         | Статичний знімок можливостей вбудованого Plugin для зовнішніх hook auth, мовлення, транскрибування в реальному часі, голосу в реальному часі, розуміння медіа, генерації зображень, генерації музики, генерації відео, web-fetch, вебпошуку та володіння інструментами. |
| `mediaUnderstandingProviderMetadata` | Ні          | `Record<string, object>`         | Легкі типові значення розуміння медіа для id provider, оголошених у `contracts.mediaUnderstandingProviders`.                                                                                                                    |
| `channelConfigs`                     | Ні          | `Record<string, object>`         | Метадані конфігурації channel, що належать маніфесту і об’єднуються в поверхні виявлення та валідації до завантаження середовища виконання.                                                                                   |
| `skills`                             | Ні          | `string[]`                       | Каталоги Skills для завантаження відносно кореня Plugin.                                                                                                                                                                         |
| `name`                               | Ні          | `string`                         | Людинозрозуміла назва Plugin.                                                                                                                                                                                                    |
| `description`                        | Ні          | `string`                         | Короткий опис, що показується на поверхнях Plugin.                                                                                                                                                                               |
| `version`                            | Ні          | `string`                         | Інформаційна версія Plugin.                                                                                                                                                                                                      |
| `uiHints`                            | Ні          | `Record<string, object>`         | Мітки UI, заповнювачі та підказки чутливості для полів конфігурації.                                                                                                                                                             |

## Довідник `providerAuthChoices`

Кожен запис `providerAuthChoices` описує один варіант onboarding або auth.
OpenClaw зчитує це до завантаження середовища виконання provider.

| Поле                  | Обов’язкове | Тип                                             | Що воно означає                                                                                             |
| --------------------- | ----------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `provider`            | Так         | `string`                                        | Id provider, до якого належить цей варіант.                                                                 |
| `method`              | Так         | `string`                                        | Id методу auth, до якого слід спрямувати виклик.                                                            |
| `choiceId`            | Так         | `string`                                        | Стабільний id варіанта auth, який використовується потоками onboarding і CLI.                               |
| `choiceLabel`         | Ні          | `string`                                        | Мітка для користувача. Якщо її пропущено, OpenClaw використовує `choiceId`.                                 |
| `choiceHint`          | Ні          | `string`                                        | Короткий допоміжний текст для засобу вибору.                                                                |
| `assistantPriority`   | Ні          | `number`                                        | Менші значення сортуються раніше в інтерактивних засобах вибору, керованих assistant.                      |
| `assistantVisibility` | Ні          | `"visible"` \| `"manual-only"`                  | Приховує варіант із засобів вибору assistant, але все ще дозволяє ручний вибір через CLI.                  |
| `deprecatedChoiceIds` | Ні          | `string[]`                                      | Застарілі id варіантів, які мають перенаправляти користувачів на цей варіант-заміну.                       |
| `groupId`             | Ні          | `string`                                        | Необов’язковий id групи для групування пов’язаних варіантів.                                                |
| `groupLabel`          | Ні          | `string`                                        | Мітка цієї групи для користувача.                                                                           |
| `groupHint`           | Ні          | `string`                                        | Короткий допоміжний текст для групи.                                                                        |
| `optionKey`           | Ні          | `string`                                        | Внутрішній ключ опції для простих потоків auth з одним прапорцем.                                           |
| `cliFlag`             | Ні          | `string`                                        | Назва прапорця CLI, наприклад `--openrouter-api-key`.                                                       |
| `cliOption`           | Ні          | `string`                                        | Повна форма опції CLI, наприклад `--openrouter-api-key <key>`.                                              |
| `cliDescription`      | Ні          | `string`                                        | Опис, який використовується в довідці CLI.                                                                  |
| `onboardingScopes`    | Ні          | `Array<"text-inference" \| "image-generation">` | На яких поверхнях onboarding має з’являтися цей варіант. Якщо поле пропущено, типово використовується `["text-inference"]`. |

## Довідник `commandAliases`

Використовуйте `commandAliases`, коли Plugin володіє іменем команди часу виконання, яке користувачі можуть
помилково помістити в `plugins.allow` або спробувати запустити як кореневу команду CLI. OpenClaw
використовує ці метадані для діагностики без імпорту коду середовища виконання Plugin.

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

| Поле         | Обов’язкове | Тип               | Що воно означає                                                            |
| ------------ | ----------- | ----------------- | -------------------------------------------------------------------------- |
| `name`       | Так         | `string`          | Назва команди, яка належить цьому Plugin.                                  |
| `kind`       | Ні          | `"runtime-slash"` | Позначає псевдонім як slash-команду чату, а не кореневу команду CLI.       |
| `cliCommand` | Ні          | `string`          | Пов’язана коренева команда CLI, яку слід пропонувати для операцій CLI, якщо така існує. |

## Довідник `activation`

Використовуйте `activation`, коли Plugin може дешево оголосити, які події control-plane
мають активувати його пізніше.

## Довідник `qaRunners`

Використовуйте `qaRunners`, коли Plugin додає один або кілька runner транспорту під
спільним коренем `openclaw qa`. Тримайте ці метадані легкими й статичними; фактична
реєстрація CLI все одно належить середовищу виконання Plugin через легку
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

| Поле          | Обов’язкове | Тип      | Що воно означає                                                           |
| ------------- | ----------- | -------- | ------------------------------------------------------------------------- |
| `commandName` | Так         | `string` | Підкоманда, змонтована під `openclaw qa`, наприклад `matrix`.             |
| `description` | Ні          | `string` | Резервний текст довідки, який використовується, коли спільному хосту потрібна stub-команда. |

Цей блок є лише метаданими. Він не реєструє поведінку часу виконання і не
замінює `register(...)`, `setupEntry` або інші точки входу середовища виконання/Plugin.
Поточні споживачі використовують його як підказку для звуження перед ширшим завантаженням Plugin, тому
відсутність метаданих активації зазвичай впливає лише на продуктивність; вона не повинна
змінювати коректність, поки ще існують резервні варіанти володіння маніфестом застарілого типу.

```json
{
  "activation": {
    "onProviders": ["openai"],
    "onCommands": ["models"],
    "onChannels": ["web"],
    "onRoutes": ["gateway-webhook"],
    "onCapabilities": ["provider", "tool"]
  }
}
```

| Поле             | Обов’язкове | Тип                                                  | Що воно означає                                                      |
| ---------------- | ----------- | ---------------------------------------------------- | -------------------------------------------------------------------- |
| `onProviders`    | Ні          | `string[]`                                           | Id provider, які мають активувати цей Plugin за запитом.             |
| `onCommands`     | Ні          | `string[]`                                           | Id команд, які мають активувати цей Plugin.                          |
| `onChannels`     | Ні          | `string[]`                                           | Id channel, які мають активувати цей Plugin.                         |
| `onRoutes`       | Ні          | `string[]`                                           | Типи маршрутів, які мають активувати цей Plugin.                     |
| `onCapabilities` | Ні          | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Загальні підказки можливостей, що використовуються плануванням активації control-plane. |

Поточні активні споживачі:

- планування CLI, ініційоване командою, повертається до застарілих
  `commandAliases[].cliCommand` або `commandAliases[].name`
- планування setup/channel, ініційоване channel, повертається до застарілого
  володіння `channels[]`, коли явні метадані активації channel відсутні
- планування setup/середовища виконання, ініційоване provider, повертається до застарілого
  володіння `providers[]` і верхньорівневого `cliBackends[]`, коли явні метадані активації provider
  відсутні

## Довідник `setup`

Використовуйте `setup`, коли поверхням setup і onboarding потрібні легкі метадані Plugin
до завантаження середовища виконання.

```json
{
  "setup": {
    "providers": [
      {
        "id": "openai",
        "authMethods": ["api-key"],
        "envVars": ["OPENAI_API_KEY"]
      }
    ],
    "cliBackends": ["openai-cli"],
    "configMigrations": ["legacy-openai-auth"],
    "requiresRuntime": false
  }
}
```

Верхньорівневий `cliBackends` залишається дійсним і надалі описує
backend виведення CLI. `setup.cliBackends` — це поверхня дескрипторів, специфічна для setup,
для потоків control-plane/setup, які мають залишатися лише метаданими.

За наявності `setup.providers` і `setup.cliBackends` є бажаною
поверхнею пошуку setup на основі дескрипторів для виявлення setup. Якщо дескриптор лише
звужує кандидатний Plugin, а setup усе ще потребує багатших hook часу setup,
установіть `requiresRuntime: true` і залиште `setup-api` як
резервний шлях виконання.

Оскільки пошук setup може виконувати код `setup-api`, що належить Plugin,
нормалізовані значення `setup.providers[].id` і `setup.cliBackends[]` мають залишатися унікальними серед
виявлених Plugin. Неоднозначне володіння закривається без вибору переможця
за порядком виявлення.

### Довідник `setup.providers`

| Поле          | Обов’язкове | Тип        | Що воно означає                                                                      |
| ------------- | ----------- | ---------- | ------------------------------------------------------------------------------------ |
| `id`          | Так         | `string`   | Id provider, який відкривається під час setup або onboarding. Зберігайте нормалізовані id глобально унікальними. |
| `authMethods` | Ні          | `string[]` | Id методів setup/auth, які цей provider підтримує без завантаження повного середовища виконання. |
| `envVars`     | Ні          | `string[]` | Змінні середовища, які загальні поверхні setup/status можуть перевіряти до завантаження середовища виконання Plugin. |

### Поля `setup`

| Поле               | Обов’язкове | Тип        | Що воно означає                                                                                         |
| ------------------ | ----------- | ---------- | ------------------------------------------------------------------------------------------------------- |
| `providers`        | Ні          | `object[]` | Дескриптори setup provider, доступні під час setup і onboarding.                                       |
| `cliBackends`      | Ні          | `string[]` | Id backend часу setup, які використовуються для пошуку setup спочатку за дескрипторами. Зберігайте нормалізовані id глобально унікальними. |
| `configMigrations` | Ні          | `string[]` | Id міграцій конфігурації, якими володіє поверхня setup цього Plugin.                                    |
| `requiresRuntime`  | Ні          | `boolean`  | Чи потребує setup виконання `setup-api` після пошуку за дескрипторами.                                 |

## Довідник `uiHints`

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

| Поле          | Тип        | Що воно означає                           |
| ------------- | ---------- | ----------------------------------------- |
| `label`       | `string`   | Мітка поля для користувача.               |
| `help`        | `string`   | Короткий допоміжний текст.                |
| `tags`        | `string[]` | Необов’язкові теги UI.                    |
| `advanced`    | `boolean`  | Позначає поле як розширене.               |
| `sensitive`   | `boolean`  | Позначає поле як секретне або чутливе.    |
| `placeholder` | `string`   | Текст-заповнювач для полів форми.         |

## Довідник `contracts`

Використовуйте `contracts` лише для статичних метаданих володіння можливостями, які OpenClaw може
зчитувати без імпорту середовища виконання Plugin.

```json
{
  "contracts": {
    "embeddedExtensionFactories": ["pi"],
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
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Кожен список є необов’язковим:

| Поле                             | Тип        | Що воно означає                                                          |
| -------------------------------- | ---------- | ------------------------------------------------------------------------ |
| `embeddedExtensionFactories`     | `string[]` | Id вбудованого середовища виконання, для яких вбудований Plugin може реєструвати factory. |
| `externalAuthProviders`          | `string[]` | Id provider, чий hook зовнішнього профілю auth належить цьому Plugin.    |
| `speechProviders`                | `string[]` | Id provider мовлення, якими володіє цей Plugin.                          |
| `realtimeTranscriptionProviders` | `string[]` | Id provider транскрибування в реальному часі, якими володіє цей Plugin.  |
| `realtimeVoiceProviders`         | `string[]` | Id provider голосу в реальному часі, якими володіє цей Plugin.           |
| `memoryEmbeddingProviders`       | `string[]` | Id provider embedding пам’яті, якими володіє цей Plugin.                 |
| `mediaUnderstandingProviders`    | `string[]` | Id provider розуміння медіа, якими володіє цей Plugin.                   |
| `imageGenerationProviders`       | `string[]` | Id provider генерації зображень, якими володіє цей Plugin.               |
| `videoGenerationProviders`       | `string[]` | Id provider генерації відео, якими володіє цей Plugin.                   |
| `webFetchProviders`              | `string[]` | Id provider web-fetch, якими володіє цей Plugin.                         |
| `webSearchProviders`             | `string[]` | Id provider вебпошуку, якими володіє цей Plugin.                         |
| `tools`                          | `string[]` | Назви інструментів agent, якими володіє цей Plugin, для перевірок контрактів вбудованих Plugin. |

Plugin provider, які реалізують `resolveExternalAuthProfiles`, мають оголошувати
`contracts.externalAuthProviders`. Plugin без цього оголошення все ще працюють
через застарілий резервний механізм сумісності, але він повільніший і
буде вилучений після завершення вікна міграції.

Вбудовані provider embedding пам’яті мають оголошувати
`contracts.memoryEmbeddingProviders` для кожного id adapter, який вони надають, включно з
вбудованими adapter, такими як `local`. Автономні шляхи CLI використовують цей контракт
маніфесту, щоб завантажувати лише Plugin-власник до того, як повне середовище виконання Gateway
зареєструє provider.

## Довідник `mediaUnderstandingProviderMetadata`

Використовуйте `mediaUnderstandingProviderMetadata`, коли provider розуміння медіа має
типові моделі, пріоритет резервного auto-auth або нативну підтримку документів, які
потрібні загальним допоміжним засобам ядра до завантаження середовища виконання. Ключі також мають бути оголошені в
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

Кожен запис provider може містити:

| Поле                   | Тип                                 | Що воно означає                                                           |
| ---------------------- | ----------------------------------- | ------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Можливості медіа, які надає цей provider.                                 |
| `defaultModels`        | `Record<string, string>`            | Типові значення відповідності можливість-модель, які використовуються, коли конфігурація не задає модель. |
| `autoPriority`         | `Record<string, number>`            | Менші числа сортуються раніше для автоматичного резервного вибору provider на основі облікових даних. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Нативні входи документів, які підтримує provider.                         |

## Довідник `channelConfigs`

Використовуйте `channelConfigs`, коли Plugin channel потребує легких метаданих конфігурації
до завантаження середовища виконання.

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
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Кожен запис channel може містити:

| Поле          | Тип                      | Що воно означає                                                                                 |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema для `channels.<id>`. Обов’язкова для кожного оголошеного запису конфігурації channel. |
| `uiHints`     | `Record<string, object>` | Необов’язкові мітки UI/заповнювачі/підказки чутливості для цього розділу конфігурації channel. |
| `label`       | `string`                 | Мітка channel, що об’єднується в поверхні вибору та перевірки, коли метадані середовища виконання ще не готові. |
| `description` | `string`                 | Короткий опис channel для поверхонь перевірки та каталогу.                                     |
| `preferOver`  | `string[]`               | Id застарілих або менш пріоритетних Plugin, які цей channel має випереджати на поверхнях вибору. |

## Довідник `modelSupport`

Використовуйте `modelSupport`, коли OpenClaw має виводити ваш Plugin provider із
скорочених id моделей, таких як `gpt-5.5` або `claude-sonnet-4.6`, до завантаження середовища виконання Plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw застосовує такий пріоритет:

- явні посилання `provider/model` використовують метадані маніфесту `providers`, що належать власнику
- `modelPatterns` мають пріоритет над `modelPrefixes`
- якщо збігаються один невбудований Plugin і один вбудований Plugin, перемагає невбудований
  Plugin
- решта неоднозначностей ігнорується, доки користувач або конфігурація не вкажуть provider

Поля:

| Поле            | Тип        | Що воно означає                                                                  |
| --------------- | ---------- | -------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Префікси, що зіставляються через `startsWith` зі скороченими id моделей.         |
| `modelPatterns` | `string[]` | Джерела Regex, що зіставляються зі скороченими id моделей після видалення суфікса профілю. |

Застарілі ключі можливостей верхнього рівня більше не рекомендовані. Використовуйте `openclaw doctor --fix`, щоб
перемістити `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` і `webSearchProviders` до `contracts`; звичайне
завантаження маніфесту більше не розглядає ці поля верхнього рівня як
володіння можливостями.

## Маніфест і `package.json`

Ці два файли виконують різні завдання:

| Файл                   | Використовуйте для                                                                                                                 |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Виявлення, валідації конфігурації, метаданих варіантів auth і підказок UI, які мають існувати до запуску коду Plugin            |
| `package.json`         | Метаданих npm, встановлення залежностей і блока `openclaw`, який використовується для точок входу, обмежень встановлення, setup або метаданих каталогу |

Якщо ви не впевнені, куди належить певний фрагмент метаданих, користуйтеся таким правилом:

- якщо OpenClaw має знати це до завантаження коду Plugin, помістіть це в `openclaw.plugin.json`
- якщо це стосується пакування, файлів точок входу або поведінки встановлення npm, помістіть це в `package.json`

### Поля `package.json`, які впливають на виявлення

Деякі метадані Plugin до часу виконання навмисно розміщуються в `package.json` у блоці
`openclaw`, а не в `openclaw.plugin.json`.

Важливі приклади:

| Поле                                                              | Що воно означає                                                                                                                                                                      |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | Оголошує точки входу рідного Plugin. Має залишатися в межах каталогу пакета Plugin.                                                                                                 |
| `openclaw.runtimeExtensions`                                      | Оголошує точки входу побудованого JavaScript середовища виконання для встановлених пакетів. Має залишатися в межах каталогу пакета Plugin.                                         |
| `openclaw.setupEntry`                                             | Легка точка входу лише для setup, яка використовується під час onboarding, відкладеного запуску channel і discovery статусу channel/SecretRef у режимі лише читання. Має залишатися в межах каталогу пакета Plugin. |
| `openclaw.runtimeSetupEntry`                                      | Оголошує точку входу setup побудованого JavaScript для встановлених пакетів. Має залишатися в межах каталогу пакета Plugin.                                                         |
| `openclaw.channel`                                                | Легкі метадані каталогу channel, такі як мітки, шляхи до документації, псевдоніми та текст для вибору.                                                                              |
| `openclaw.channel.configuredState`                                | Легкі метадані перевірки налаштованого стану, які можуть відповісти на запитання «чи вже існує setup лише через env?» без завантаження повного середовища виконання channel.       |
| `openclaw.channel.persistedAuthState`                             | Легкі метадані перевірки збереженого стану auth, які можуть відповісти на запитання «чи вже десь виконано вхід?» без завантаження повного середовища виконання channel.            |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Підказки встановлення/оновлення для вбудованих і зовнішньо опублікованих Plugin.                                                                                                     |
| `openclaw.install.defaultChoice`                                  | Бажаний шлях встановлення, коли доступно кілька джерел встановлення.                                                                                                                 |
| `openclaw.install.minHostVersion`                                 | Мінімальна підтримувана версія хоста OpenClaw із semver-нижньою межею, наприклад `>=2026.3.22`.                                                                                     |
| `openclaw.install.expectedIntegrity`                              | Очікуваний рядок цілісності npm dist, наприклад `sha512-...`; потоки встановлення й оновлення перевіряють отриманий артефакт на відповідність йому.                                 |
| `openclaw.install.allowInvalidConfigRecovery`                     | Дозволяє вузький шлях відновлення через перевстановлення вбудованого Plugin, коли конфігурація недійсна.                                                                            |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Дозволяє поверхням channel лише для setup завантажуватися до повного Plugin channel під час запуску.                                                                                |

Метадані маніфесту визначають, які варіанти provider/channel/setup з’являються в
onboarding до завантаження середовища виконання. `package.json#openclaw.install` повідомляє
onboarding, як отримати або ввімкнути цей Plugin, коли користувач вибирає один із цих
варіантів. Не переносіть підказки встановлення в `openclaw.plugin.json`.

`openclaw.install.minHostVersion` примусово застосовується під час встановлення та
завантаження реєстру маніфестів. Недійсні значення відхиляються; новіші, але дійсні
значення пропускають Plugin на старіших хостах.

Точне закріплення версії npm уже міститься в `npmSpec`, наприклад
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Поєднуйте це з
`expectedIntegrity`, коли хочете, щоб потоки оновлення закривалися безпечно, якщо отриманий
артефакт npm більше не відповідає закріпленому релізу. Інтерактивний onboarding
пропонує довірені npm spec реєстру, включно з простими назвами пакетів і dist-tag.
Коли `expectedIntegrity` присутній, потоки встановлення/оновлення застосовують його; коли
він відсутній, дозвіл реєстру записується без закріплення цілісності.

Plugin channel мають надавати `openclaw.setupEntry`, коли статус, список channel
або сканування SecretRef мають ідентифікувати налаштовані облікові записи без завантаження повного
середовища виконання. Точка входу setup має надавати метадані channel разом із безпечними для setup
adapter конфігурації, статусу та секретів; тримайте мережеві клієнти, слухачі gateway і
середовища виконання транспорту в основній точці входу extension.

Поля точки входу середовища виконання не перевизначають перевірки меж пакета для
полів точки входу джерела. Наприклад, `openclaw.runtimeExtensions` не може зробити
придатним до завантаження шлях `openclaw.extensions`, який виходить за межі пакета.

`openclaw.install.allowInvalidConfigRecovery` навмисно є вузьким. Воно не
робить довільні зламані конфігурації придатними до встановлення. Сьогодні воно лише дозволяє потокам встановлення
відновлюватися після конкретних застарілих збоїв оновлення вбудованих Plugin, таких як
відсутній шлях вбудованого Plugin або застарілий запис `channels.<id>` для того самого
вбудованого Plugin. Непов’язані помилки конфігурації все одно блокують встановлення й направляють операторів
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

Використовуйте це, коли потокам setup, doctor або configured-state потрібна дешева перевірка auth
типу так/ні до завантаження повного Plugin channel. Цільовий export має бути маленькою
функцією, яка читає лише збережений стан; не спрямовуйте її через повний barrel
середовища виконання channel.

`openclaw.channel.configuredState` має таку саму форму для дешевих перевірок
налаштованого стану лише через env:

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

Використовуйте це, коли channel може визначити налаштований стан через env або інші малі
невиконувані входи. Якщо перевірка потребує повного розв’язання конфігурації або реального
середовища виконання channel, залишайте цю логіку в hook Plugin `config.hasConfiguredState`.

## Пріоритет виявлення (дублікати id Plugin)

OpenClaw виявляє Plugin із кількох коренів (вбудовані, глобальне встановлення, workspace, явно вибрані конфігурацією шляхи). Якщо два виявлені Plugin мають однаковий `id`, зберігається лише маніфест із **найвищим пріоритетом**; дублікати з нижчим пріоритетом відкидаються замість завантаження поруч із ним.

Пріоритет, від найвищого до найнижчого:

1. **Вибраний конфігурацією** — шлях, явно закріплений у `plugins.entries.<id>`
2. **Вбудований** — Plugin, що постачаються з OpenClaw
3. **Глобальне встановлення** — Plugin, встановлені в глобальний корінь Plugin OpenClaw
4. **Workspace** — Plugin, виявлені відносно поточного workspace

Наслідки:

- Fork або застаріла копія вбудованого Plugin, що лежить у workspace, не зможе затінити вбудовану збірку.
- Щоб справді перевизначити вбудований Plugin локальним, закріпіть його через `plugins.entries.<id>`, щоб він переміг за пріоритетом, а не покладався на виявлення у workspace.
- Відкидання дублікатів логуються, щоб Doctor і діагностика запуску могли вказати на відкинуту копію.

## Вимоги до JSON Schema

- **Кожен Plugin повинен постачати JSON Schema**, навіть якщо він не приймає конфігурацію.
- Порожня схема допустима (наприклад, `{ "type": "object", "additionalProperties": false }`).
- Схеми перевіряються під час читання/запису конфігурації, а не під час виконання.

## Поведінка валідації

- Невідомі ключі `channels.*` є **помилками**, якщо тільки id channel не оголошено
  в маніфесті Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` і `plugins.slots.*`
  мають посилатися на **доступні для виявлення** id Plugin. Невідомі id є **помилками**.
- Якщо Plugin установлено, але він має зламаний або відсутній маніфест чи схему,
  валідація завершується помилкою, а Doctor повідомляє про помилку Plugin.
- Якщо конфігурація Plugin існує, але сам Plugin **вимкнений**, конфігурація зберігається, і
  у Doctor + логах з’являється **попередження**.

Див. [Довідник із конфігурації](/uk/gateway/configuration) для повної схеми `plugins.*`.

## Примітки

- Маніфест **обов’язковий для рідних Plugin OpenClaw**, включно із завантаженням із локальної файлової системи. Середовище виконання все одно завантажує модуль Plugin окремо; маніфест використовується лише для виявлення + валідації.
- Рідні маніфести аналізуються за допомогою JSON5, тому коментарі, кінцеві коми та ключі без лапок приймаються, якщо кінцеве значення все ще є object.
- Завантажувач маніфесту читає лише задокументовані поля маніфесту. Уникайте власних ключів верхнього рівня.
- `channels`, `providers`, `cliBackends` і `skills` можна не вказувати, якщо Plugin їх не потребує.
- Ексклюзивні типи Plugin вибираються через `plugins.slots.*`: `kind: "memory"` через `plugins.slots.memory`, `kind: "context-engine"` через `plugins.slots.contextEngine` (типово `legacy`).
- Метадані змінних середовища (`providerAuthEnvVars`, `channelEnvVars`) є лише декларативними. Status, audit, валідація доставки Cron та інші поверхні лише для читання все одно застосовують політику довіри до Plugin і політику ефективної активації, перш ніж вважати змінну середовища налаштованою.
- Для метаданих runtime wizard, які потребують коду provider, див. [Hook середовища виконання provider](/uk/plugins/architecture-internals#provider-runtime-hooks).
- Якщо ваш Plugin залежить від native-модулів, задокументуйте кроки збірки та будь-які вимоги до списку дозволів менеджера пакетів (наприклад, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Пов’язане

<CardGroup cols={3}>
  <Card title="Створення Plugin" href="/uk/plugins/building-plugins" icon="rocket">
    Початок роботи з Plugin.
  </Card>
  <Card title="Архітектура Plugin" href="/uk/plugins/architecture" icon="diagram-project">
    Внутрішня архітектура та модель можливостей.
  </Card>
  <Card title="Огляд SDK" href="/uk/plugins/sdk-overview" icon="book">
    Довідник SDK Plugin та імпорти subpath.
  </Card>
</CardGroup>
