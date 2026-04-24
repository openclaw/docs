---
read_when:
    - Ви створюєте Plugin для OpenClaw
    - Вам потрібно постачати схему конфігурації Plugin або налагоджувати помилки валідації Plugin
summary: Вимоги до маніфесту Plugin і схеми JSON (сувора валідація конфігурації)
title: Маніфест Plugin
x-i18n:
    generated_at: "2026-04-24T16:00:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3ad8f4d82624420f97f38ba5f7b1de12dbf88d4cc4fb37a52ae31cbb838ebabf
    source_path: plugins/manifest.md
    workflow: 15
---

Ця сторінка призначена лише для **власного маніфесту Plugin OpenClaw**.

Для сумісних макетів пакетів див. [Пакети Plugin](/uk/plugins/bundles).

Сумісні формати пакетів використовують інші файли маніфесту:

- Пакет Codex: `.codex-plugin/plugin.json`
- Пакет Claude: `.claude-plugin/plugin.json` або типовий макет компонента Claude
  без маніфесту
- Пакет Cursor: `.cursor-plugin/plugin.json`

OpenClaw також автоматично виявляє ці макети пакетів, але вони не проходять валідацію
за схемою `openclaw.plugin.json`, описаною тут.

Для сумісних пакетів OpenClaw наразі зчитує метадані пакета разом із оголошеними
коренями skill, коренями команд Claude, типовими значеннями Claude-пакета з
`settings.json`, типовими значеннями LSP для Claude-пакета та підтримуваними
наборами хуків, якщо макет відповідає очікуванням середовища виконання OpenClaw.

Кожен власний Plugin OpenClaw **повинен** постачатися з файлом `openclaw.plugin.json` у
**корені plugin**. OpenClaw використовує цей маніфест для валідації конфігурації
**без виконання коду plugin**. Відсутні або недійсні маніфести вважаються
помилками plugin і блокують валідацію конфігурації.

Див. повний посібник по системі plugin: [Plugins](/uk/tools/plugin).
Щодо власної моделі можливостей і поточних рекомендацій із зовнішньої сумісності:
[Модель можливостей](/uk/plugins/architecture#public-capability-model).

## Що робить цей файл

`openclaw.plugin.json` — це метадані, які OpenClaw читає **до завантаження коду
вашого plugin**. Усе нижче має бути достатньо легким для перевірки без запуску
середовища виконання plugin.

**Використовуйте його для:**

- ідентифікації plugin, валідації конфігурації та підказок UI для конфігурації
- метаданих автентифікації, онбордингу та налаштування (псевдонім, автоувімкнення, змінні середовища provider, варіанти автентифікації)
- підказок активації для поверхонь control-plane
- скороченого володіння сімействами моделей
- статичних знімків володіння можливостями (`contracts`)
- метаданих QA runner, які може перевіряти спільний хост `openclaw qa`
- метаданих конфігурації, специфічних для channel, що об’єднуються в поверхнях каталогу та валідації

**Не використовуйте його для:** реєстрації поведінки під час виконання, оголошення
точок входу коду або метаданих встановлення npm. Це має належати до коду вашого plugin і `package.json`.

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

## Розгорнутий приклад

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

| Поле                                 | Обов’язкове | Тип                              | Що воно означає                                                                                                                                                                                                                    |
| ------------------------------------ | ----------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Так         | `string`                         | Канонічний id plugin. Це id, який використовується в `plugins.entries.<id>`.                                                                                                                                                      |
| `configSchema`                       | Так         | `object`                         | Вбудована JSON Schema для конфігурації цього plugin.                                                                                                                                                                               |
| `enabledByDefault`                   | Ні          | `true`                           | Позначає вбудований plugin як увімкнений за замовчуванням. Пропустіть його або встановіть будь-яке значення, відмінне від `true`, щоб plugin залишався вимкненим за замовчуванням.                                              |
| `legacyPluginIds`                    | Ні          | `string[]`                       | Застарілі id, які нормалізуються до цього канонічного id plugin.                                                                                                                                                                  |
| `autoEnableWhenConfiguredProviders`  | Ні          | `string[]`                       | Id provider, які мають автоматично вмикати цей plugin, коли згадуються автентифікація, конфігурація або посилання на моделі.                                                                                                     |
| `kind`                               | Ні          | `"memory"` \| `"context-engine"` | Оголошує ексклюзивний тип plugin, що використовується `plugins.slots.*`.                                                                                                                                                          |
| `channels`                           | Ні          | `string[]`                       | Id channel, якими володіє цей plugin. Використовується для виявлення та валідації конфігурації.                                                                                                                                   |
| `providers`                          | Ні          | `string[]`                       | Id provider, якими володіє цей plugin.                                                                                                                                                                                             |
| `providerDiscoveryEntry`             | Ні          | `string`                         | Полегшений шлях до модуля виявлення provider, відносно кореня plugin, для метаданих каталогу provider в межах маніфесту, які можна завантажити без активації повного середовища виконання plugin.                              |
| `modelSupport`                       | Ні          | `object`                         | Скорочені метадані сімейств моделей, що належать маніфесту та використовуються для автозавантаження plugin до виконання.                                                                                                          |
| `providerEndpoints`                  | Ні          | `object[]`                       | Метадані хостів endpoint/baseUrl, що належать маніфесту, для маршрутів provider, які ядро повинно класифікувати до завантаження середовища виконання provider.                                                                  |
| `cliBackends`                        | Ні          | `string[]`                       | Id backend CLI, якими володіє цей plugin. Використовується для автоактивації під час запуску на основі явних посилань у конфігурації.                                                                                            |
| `syntheticAuthRefs`                  | Ні          | `string[]`                       | Посилання на provider або backend CLI, для яких синтетичний хук автентифікації, що належить plugin, слід перевіряти під час холодного виявлення моделей до завантаження середовища виконання.                                  |
| `nonSecretAuthMarkers`               | Ні          | `string[]`                       | Значення-заповнювачі API-ключів, що належать вбудованому plugin і представляють несекретний локальний стан, OAuth або ambient credential state.                                                                                   |
| `commandAliases`                     | Ні          | `object[]`                       | Назви команд, якими володіє цей plugin і які мають створювати діагностику конфігурації та CLI з урахуванням plugin до завантаження середовища виконання.                                                                         |
| `providerAuthEnvVars`                | Ні          | `Record<string, string[]>`       | Полегшені метадані змінних середовища автентифікації provider, які OpenClaw може перевіряти без завантаження коду plugin.                                                                                                        |
| `providerAuthAliases`                | Ні          | `Record<string, string>`         | Id provider, які мають повторно використовувати інший id provider для пошуку автентифікації, наприклад coding provider, що використовує той самий API-ключ базового provider і профілі автентифікації.                        |
| `channelEnvVars`                     | Ні          | `Record<string, string[]>`       | Полегшені метадані змінних середовища channel, які OpenClaw може перевіряти без завантаження коду plugin. Використовуйте це для налаштування channel через env або поверхонь автентифікації, які мають бачити типові помічники запуску/конфігурації. |
| `providerAuthChoices`                | Ні          | `object[]`                       | Полегшені метадані варіантів автентифікації для селекторів онбордингу, вибору preferred provider та простого зв’язування прапорців CLI.                                                                                          |
| `activation`                         | Ні          | `object`                         | Полегшені метадані планувальника активації для завантаження, що запускається provider, командою, channel, маршрутом і можливостями. Лише метадані; фактичною поведінкою як і раніше володіє середовище виконання plugin.      |
| `setup`                              | Ні          | `object`                         | Полегшені дескриптори налаштування/онбордингу, які поверхні виявлення та налаштування можуть перевіряти без завантаження середовища виконання plugin.                                                                            |
| `qaRunners`                          | Ні          | `object[]`                       | Полегшені дескриптори QA runner, які використовуються спільним хостом `openclaw qa` до завантаження середовища виконання plugin.                                                                                                 |
| `contracts`                          | Ні          | `object`                         | Статичний знімок вбудованих можливостей для зовнішніх хуків автентифікації, speech, realtime transcription, realtime voice, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search і володіння інструментами. |
| `mediaUnderstandingProviderMetadata` | Ні          | `Record<string, object>`         | Полегшені типові значення media-understanding для id provider, оголошених у `contracts.mediaUnderstandingProviders`.                                                                                                             |
| `channelConfigs`                     | Ні          | `Record<string, object>`         | Метадані конфігурації channel, що належать маніфесту та об’єднуються в поверхнях виявлення та валідації до завантаження середовища виконання.                                                                                   |
| `skills`                             | Ні          | `string[]`                       | Каталоги Skills для завантаження, відносно кореня plugin.                                                                                                                                                                         |
| `name`                               | Ні          | `string`                         | Людинозрозуміла назва plugin.                                                                                                                                                                                                     |
| `description`                        | Ні          | `string`                         | Короткий опис, що показується в поверхнях plugin.                                                                                                                                                                                 |
| `version`                            | Ні          | `string`                         | Інформаційна версія plugin.                                                                                                                                                                                                       |
| `uiHints`                            | Ні          | `Record<string, object>`         | Підписи UI, заповнювачі та підказки чутливості для полів конфігурації.                                                                                                                                                            |

## Довідник `providerAuthChoices`

Кожен запис `providerAuthChoices` описує один варіант онбордингу або автентифікації.
OpenClaw читає це до завантаження середовища виконання provider.

| Поле                  | Обов’язкове | Тип                                             | Що воно означає                                                                                         |
| --------------------- | ----------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `provider`            | Так         | `string`                                        | Id provider, до якого належить цей варіант.                                                             |
| `method`              | Так         | `string`                                        | Id методу автентифікації, до якого слід маршрутизувати.                                                 |
| `choiceId`            | Так         | `string`                                        | Стабільний id варіанта автентифікації, який використовується в потоках онбордингу та CLI.              |
| `choiceLabel`         | Ні          | `string`                                        | Підпис для користувача. Якщо не вказано, OpenClaw використовує `choiceId`.                             |
| `choiceHint`          | Ні          | `string`                                        | Короткий допоміжний текст для селектора.                                                                |
| `assistantPriority`   | Ні          | `number`                                        | Менші значення сортуються раніше в інтерактивних селекторах, керованих помічником.                     |
| `assistantVisibility` | Ні          | `"visible"` \| `"manual-only"`                  | Приховує варіант із селекторів помічника, але все ще дозволяє ручний вибір через CLI.                  |
| `deprecatedChoiceIds` | Ні          | `string[]`                                      | Застарілі id варіантів, які мають перенаправляти користувачів на цей варіант-заміну.                   |
| `groupId`             | Ні          | `string`                                        | Необов’язковий id групи для групування пов’язаних варіантів.                                            |
| `groupLabel`          | Ні          | `string`                                        | Підпис цієї групи для користувача.                                                                      |
| `groupHint`           | Ні          | `string`                                        | Короткий допоміжний текст для групи.                                                                    |
| `optionKey`           | Ні          | `string`                                        | Внутрішній ключ опції для простих потоків автентифікації з одним прапорцем.                             |
| `cliFlag`             | Ні          | `string`                                        | Назва прапорця CLI, наприклад `--openrouter-api-key`.                                                   |
| `cliOption`           | Ні          | `string`                                        | Повна форма опції CLI, наприклад `--openrouter-api-key <key>`.                                          |
| `cliDescription`      | Ні          | `string`                                        | Опис, що використовується в довідці CLI.                                                                |
| `onboardingScopes`    | Ні          | `Array<"text-inference" \| "image-generation">` | У яких поверхнях онбордингу має показуватися цей варіант. Якщо не вказано, типовим значенням є `["text-inference"]`. |

## Довідник `commandAliases`

Використовуйте `commandAliases`, коли plugin володіє назвою команди під час виконання, яку користувачі можуть
помилково вказати в `plugins.allow` або спробувати запустити як кореневу команду CLI. OpenClaw
використовує ці метадані для діагностики без імпорту коду середовища виконання plugin.

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

| Поле         | Обов’язкове | Тип               | Що воно означає                                                              |
| ------------ | ----------- | ----------------- | ---------------------------------------------------------------------------- |
| `name`       | Так         | `string`          | Назва команди, що належить цьому plugin.                                     |
| `kind`       | Ні          | `"runtime-slash"` | Позначає псевдонім як slash-команду чату, а не кореневу команду CLI.         |
| `cliCommand` | Ні          | `string`          | Пов’язана коренева команда CLI, яку слід запропонувати для операцій CLI, якщо вона існує. |

## Довідник `activation`

Використовуйте `activation`, коли plugin може недорого оголосити, які події control-plane
мають включати його в план активації/завантаження.

Цей блок є метаданими планувальника, а не API життєвого циклу. Він не реєструє
поведінку під час виконання, не замінює `register(...)` і не гарантує, що
код plugin уже було виконано. Планувальник активації використовує ці поля для
звуження списку кандидатів plugin перед поверненням до наявних метаданих
володіння з маніфесту, таких як `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` і хуки.

Надавайте перевагу найвужчим метаданим, які вже описують володіння. Використовуйте
`providers`, `channels`, `commandAliases`, дескриптори setup або `contracts`,
коли ці поля виражають відповідний зв’язок. Використовуйте `activation` для додаткових підказок
планувальника, які не можуть бути представлені цими полями володіння.

Цей блок містить лише метадані. Він не реєструє поведінку під час виконання і
не замінює `register(...)`, `setupEntry` або інші точки входу runtime/plugin.
Поточні споживачі використовують його як підказку для звуження перед ширшим
завантаженням plugin, тому відсутність метаданих активації зазвичай лише впливає на продуктивність;
це не має змінювати коректність, доки ще існують застарілі fallback-механізми
володіння з маніфесту.

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

| Поле             | Обов’язкове | Тип                                                  | Що воно означає                                                                                          |
| ---------------- | ----------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `onProviders`    | Ні          | `string[]`                                           | Id provider, які мають включати цей plugin у плани активації/завантаження.                               |
| `onCommands`     | Ні          | `string[]`                                           | Id команд, які мають включати цей plugin у плани активації/завантаження.                                 |
| `onChannels`     | Ні          | `string[]`                                           | Id channel, які мають включати цей plugin у плани активації/завантаження.                                |
| `onRoutes`       | Ні          | `string[]`                                           | Типи маршрутів, які мають включати цей plugin у плани активації/завантаження.                            |
| `onCapabilities` | Ні          | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Загальні підказки можливостей, що використовуються в плануванні активації control-plane. За можливості надавайте перевагу вужчим полям. |

Поточні активні споживачі:

- планування CLI, запущене командою, повертається до застарілих
  `commandAliases[].cliCommand` або `commandAliases[].name`
- планування setup/channel, запущене channel, повертається до застарілого
  володіння `channels[]`, якщо явні метадані активації channel відсутні
- планування setup/runtime, запущене provider, повертається до застарілого
  володіння `providers[]` і `cliBackends[]` верхнього рівня, якщо явні метадані
  активації provider відсутні

Діагностика планувальника може розрізняти явні підказки активації та fallback
до володіння з маніфесту. Наприклад, `activation-command-hint` означає, що
спрацювало `activation.onCommands`, тоді як `manifest-command-alias` означає, що
планувальник натомість використав володіння через `commandAliases`. Ці мітки причин
призначені для діагностики хоста та тестів; авторам plugin слід і надалі оголошувати ті метадані,
які найкраще описують володіння.

## Довідник `qaRunners`

Використовуйте `qaRunners`, коли plugin додає один або кілька транспортних runner
під спільним коренем `openclaw qa`. Зберігайте ці метадані легкими та статичними; фактичною
реєстрацією CLI як і раніше володіє середовище виконання plugin через полегшену
поверхню `runtime-api.ts`, яка експортує `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Запустити Docker-backed Matrix live QA lane на одноразовому homeserver"
    }
  ]
}
```

| Поле          | Обов’язкове | Тип      | Що воно означає                                                           |
| ------------- | ----------- | -------- | ------------------------------------------------------------------------- |
| `commandName` | Так         | `string` | Підкоманда, змонтована під `openclaw qa`, наприклад `matrix`.             |
| `description` | Ні          | `string` | Резервний текст довідки, що використовується, коли спільному хосту потрібна stub-команда. |

## Довідник `setup`

Використовуйте `setup`, коли поверхням налаштування та онбордингу потрібні легкі метадані plugin,
що належать plugin, до завантаження runtime.

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

`cliBackends` верхнього рівня залишається чинним і продовжує описувати backend CLI для інференсу.
`setup.cliBackends` — це поверхня дескрипторів, специфічна для setup, для потоків
control-plane/setup, які мають залишатися лише метаданими.

За наявності `setup.providers` і `setup.cliBackends` є бажаною поверхнею пошуку
на основі дескрипторів для виявлення setup. Якщо дескриптор лише звужує список
plugin-кандидатів, а setup усе ще потребує більш багатих runtime-хуків на етапі налаштування,
встановіть `requiresRuntime: true` і залиште `setup-api` як резервний шлях виконання.

Оскільки пошук setup може виконувати код `setup-api`, що належить plugin,
нормалізовані значення `setup.providers[].id` і `setup.cliBackends[]` мають залишатися
унікальними серед виявлених plugin. Неоднозначне володіння завершується без вибору,
замість того щоб обирати переможця за порядком виявлення.

### Довідник `setup.providers`

| Поле          | Обов’язкове | Тип        | Що воно означає                                                                    |
| ------------- | ----------- | ---------- | ---------------------------------------------------------------------------------- |
| `id`          | Так         | `string`   | Id provider, що відкривається під час setup або онбордингу. Зберігайте нормалізовані id глобально унікальними. |
| `authMethods` | Ні          | `string[]` | Id методів setup/автентифікації, які цей provider підтримує без завантаження повного runtime. |
| `envVars`     | Ні          | `string[]` | Змінні середовища, які типові поверхні setup/status можуть перевіряти до завантаження runtime plugin. |

### Поля `setup`

| Поле               | Обов’язкове | Тип        | Що воно означає                                                                                          |
| ------------------ | ----------- | ---------- | -------------------------------------------------------------------------------------------------------- |
| `providers`        | Ні          | `object[]` | Дескриптори setup provider, що відкриваються під час setup та онбордингу.                               |
| `cliBackends`      | Ні          | `string[]` | Id backend для setup, що використовуються для пошуку setup на основі дескрипторів. Зберігайте нормалізовані id глобально унікальними. |
| `configMigrations` | Ні          | `string[]` | Id міграцій конфігурації, якими володіє поверхня setup цього plugin.                                    |
| `requiresRuntime`  | Ні          | `boolean`  | Чи потребує setup виконання `setup-api` після пошуку за дескриптором.                                   |

## Довідник `uiHints`

`uiHints` — це мапа від назв полів конфігурації до невеликих підказок для рендерингу.

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

Кожна підказка для поля може містити:

| Поле          | Тип        | Що воно означає                        |
| ------------- | ---------- | -------------------------------------- |
| `label`       | `string`   | Підпис поля для користувача.           |
| `help`        | `string`   | Короткий допоміжний текст.             |
| `tags`        | `string[]` | Необов’язкові теги UI.                 |
| `advanced`    | `boolean`  | Позначає поле як розширене.            |
| `sensitive`   | `boolean`  | Позначає поле як секретне або чутливе. |
| `placeholder` | `string`   | Текст-заповнювач для полів форми.      |

## Довідник `contracts`

Використовуйте `contracts` лише для статичних метаданих володіння можливостями, які OpenClaw може
читати без імпорту середовища виконання plugin.

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

| Поле                             | Тип        | Що воно означає                                                       |
| -------------------------------- | ---------- | --------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Id вбудованого runtime, для яких вбудований plugin може реєструвати фабрики. |
| `externalAuthProviders`          | `string[]` | Id provider, хуком зовнішнього профілю автентифікації яких володіє цей plugin. |
| `speechProviders`                | `string[]` | Id provider speech, якими володіє цей plugin.                         |
| `realtimeTranscriptionProviders` | `string[]` | Id provider realtime-transcription, якими володіє цей plugin.         |
| `realtimeVoiceProviders`         | `string[]` | Id provider realtime-voice, якими володіє цей plugin.                 |
| `memoryEmbeddingProviders`       | `string[]` | Id provider memory embedding, якими володіє цей plugin.               |
| `mediaUnderstandingProviders`    | `string[]` | Id provider media-understanding, якими володіє цей plugin.            |
| `imageGenerationProviders`       | `string[]` | Id provider image-generation, якими володіє цей plugin.               |
| `videoGenerationProviders`       | `string[]` | Id provider video-generation, якими володіє цей plugin.               |
| `webFetchProviders`              | `string[]` | Id provider web-fetch, якими володіє цей plugin.                      |
| `webSearchProviders`             | `string[]` | Id provider web search, якими володіє цей plugin.                     |
| `tools`                          | `string[]` | Назви інструментів агента, якими володіє цей plugin для перевірок вбудованого контракту. |

Plugin provider, які реалізують `resolveExternalAuthProfiles`, мають оголошувати
`contracts.externalAuthProviders`. Plugin без цього оголошення все ще працюють
через застарілий сумісний fallback, але він повільніший і
буде вилучений після завершення вікна міграції.

Вбудовані provider memory embedding мають оголошувати
`contracts.memoryEmbeddingProviders` для кожного id адаптера, який вони надають, включно з
вбудованими адаптерами, такими як `local`. Окремі шляхи CLI використовують цей контракт
маніфесту, щоб завантажувати лише plugin-власник до того, як повне середовище виконання Gateway
зареєструє provider.

## Довідник `mediaUnderstandingProviderMetadata`

Використовуйте `mediaUnderstandingProviderMetadata`, коли provider media-understanding має
типові моделі, пріоритет fallback для автоматичної автентифікації або власну підтримку документів,
які потрібні типовим допоміжникам ядра до завантаження runtime. Ключі також мають бути оголошені в
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

| Поле                   | Тип                                 | Що воно означає                                                                 |
| ---------------------- | ----------------------------------- | -------------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Медіаможливості, які надає цей provider.                                         |
| `defaultModels`        | `Record<string, string>`            | Типові відповідності можливість-модель, що використовуються, коли конфігурація не задає модель. |
| `autoPriority`         | `Record<string, number>`            | Менші числа сортуються раніше для автоматичного fallback provider на основі облікових даних. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Власні входи документів, які підтримує provider.                                 |

## Довідник `channelConfigs`

Використовуйте `channelConfigs`, коли channel plugin потребує легких метаданих конфігурації до
завантаження runtime.

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
      "description": "Підключення до homeserver Matrix",
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Кожен запис channel може містити:

| Поле          | Тип                      | Що воно означає                                                                                 |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema для `channels.<id>`. Обов’язкове для кожного оголошеного запису конфігурації channel. |
| `uiHints`     | `Record<string, object>` | Необов’язкові підписи UI/заповнювачі/підказки чутливості для цього розділу конфігурації channel. |
| `label`       | `string`                 | Підпис channel, що об’єднується в поверхнях вибору та перегляду, коли метадані runtime ще не готові. |
| `description` | `string`                 | Короткий опис channel для поверхонь перегляду та каталогу.                                      |
| `preferOver`  | `string[]`               | Id застарілих або менш пріоритетних plugin, які цей channel має випереджати в поверхнях вибору. |

## Довідник `modelSupport`

Використовуйте `modelSupport`, коли OpenClaw має визначати ваш provider plugin за
скороченими id моделей на кшталт `gpt-5.5` або `claude-sonnet-4.6` до завантаження runtime plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw застосовує такий пріоритет:

- явні посилання `provider/model` використовують метадані маніфесту `providers` plugin-власника
- `modelPatterns` мають вищий пріоритет, ніж `modelPrefixes`
- якщо збігаються один невбудований plugin і один вбудований plugin, перемагає невбудований
  plugin
- решта неоднозначностей ігнорується, доки користувач або конфігурація не вкажуть provider

Поля:

| Поле            | Тип        | Що воно означає                                                                  |
| --------------- | ---------- | -------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Префікси, що зіставляються через `startsWith` зі скороченими id моделей.         |
| `modelPatterns` | `string[]` | Джерела regex, що зіставляються зі скороченими id моделей після видалення суфікса профілю. |

Застарілі ключі можливостей верхнього рівня не рекомендуються. Використовуйте `openclaw doctor --fix`, щоб
перемістити `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` і `webSearchProviders` до `contracts`; звичайне
завантаження маніфесту більше не розглядає ці поля верхнього рівня як
володіння можливостями.

## Маніфест і `package.json`

Ці два файли виконують різні завдання:

| Файл                   | Для чого використовувати                                                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Виявлення, валідація конфігурації, метадані варіантів автентифікації та підказки UI, які мають існувати до запуску коду plugin       |
| `package.json`         | Метадані npm, встановлення залежностей і блок `openclaw`, що використовується для точок входу, обмежень встановлення, setup або метаданих каталогу |

Якщо ви не впевнені, куди належить певний фрагмент метаданих, користуйтеся таким правилом:

- якщо OpenClaw має знати це до завантаження коду plugin, помістіть це в `openclaw.plugin.json`
- якщо це стосується пакування, файлів точок входу або поведінки встановлення npm, помістіть це в `package.json`

### Поля `package.json`, які впливають на виявлення

Деякі метадані plugin до виконання навмисно зберігаються в `package.json` у блоці
`openclaw`, а не в `openclaw.plugin.json`.

Важливі приклади:

| Поле                                                              | Що воно означає                                                                                                                                                                       |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Оголошує точки входу власного Plugin. Має залишатися в межах каталогу пакета plugin.                                                                                                  |
| `openclaw.runtimeExtensions`                                      | Оголошує точки входу built JavaScript runtime для встановлених пакетів. Має залишатися в межах каталогу пакета plugin.                                                               |
| `openclaw.setupEntry`                                             | Полегшена точка входу лише для setup, що використовується під час онбордингу, відкладеного запуску channel і виявлення статусу channel/SecretRef у режимі лише читання. Має залишатися в межах каталогу пакета plugin. |
| `openclaw.runtimeSetupEntry`                                      | Оголошує built JavaScript точку входу setup для встановлених пакетів. Має залишатися в межах каталогу пакета plugin.                                                                  |
| `openclaw.channel`                                                | Полегшені метадані каталогу channel, як-от підписи, шляхи до документації, псевдоніми та тексти для вибору.                                                                           |
| `openclaw.channel.configuredState`                                | Полегшені метадані перевірки configured-state, які можуть відповісти на запитання «чи вже існує налаштування лише через env?» без завантаження повного runtime channel.               |
| `openclaw.channel.persistedAuthState`                             | Полегшені метадані перевірки persisted-auth, які можуть відповісти на запитання «чи вже виконано вхід хоч десь?» без завантаження повного runtime channel.                            |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Підказки для встановлення/оновлення вбудованих і зовнішньо опублікованих plugin.                                                                                                      |
| `openclaw.install.defaultChoice`                                  | Бажаний шлях встановлення, коли доступно кілька джерел встановлення.                                                                                                                   |
| `openclaw.install.minHostVersion`                                 | Мінімальна підтримувана версія хоста OpenClaw із використанням нижньої межі semver, наприклад `>=2026.3.22`.                                                                         |
| `openclaw.install.expectedIntegrity`                              | Очікуваний рядок цілісності npm dist, наприклад `sha512-...`; потоки встановлення й оновлення звіряють завантажений артефакт із ним.                                                  |
| `openclaw.install.allowInvalidConfigRecovery`                     | Дозволяє вузький шлях відновлення через перевстановлення вбудованого plugin, коли конфігурація недійсна.                                                                              |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Дозволяє поверхням channel лише для setup завантажуватися до повного plugin channel під час запуску.                                                                                  |

Метадані маніфесту визначають, які варіанти provider/channel/setup з’являються в
онбордингу до завантаження runtime. `package.json#openclaw.install` повідомляє
онбордингу, як отримати або ввімкнути цей plugin, коли користувач вибирає один із цих
варіантів. Не переносіть підказки встановлення до `openclaw.plugin.json`.

`openclaw.install.minHostVersion` застосовується під час встановлення та завантаження
реєстру маніфестів. Недійсні значення відхиляються; новіші, але коректні значення
пропускають plugin на старіших хостах.

Точне закріплення версії npm уже зберігається в `npmSpec`, наприклад
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Офіційні записи зовнішнього каталогу
мають поєднувати точні специфікації з `expectedIntegrity`, щоб потоки оновлення
завершувалися без вибору, якщо завантажений npm-артефакт більше не відповідає
закріпленому релізу. Інтерактивний онбординг і надалі пропонує довірені npm-специфікації
реєстру, зокрема прості назви пакетів і dist-tags, для сумісності. Діагностика каталогу
може розрізняти точні, плаваючі, закріплені за цілісністю, без цілісності та недійсні
джерела default-choice. Коли `expectedIntegrity` присутній, потоки встановлення/оновлення
застосовують його; коли його пропущено, розв’язання через реєстр записується
без закріплення цілісності.

Channel plugin мають надавати `openclaw.setupEntry`, коли статус, список channel
або сканування SecretRef повинні визначати налаштовані облікові записи без завантаження повного
runtime. Точка входу setup має надавати метадані channel разом із безпечними для setup
адаптерами конфігурації, статусу й секретів; мережеві клієнти, слухачі Gateway і
transport runtime слід залишати в основній точці входу extension.

Поля точок входу runtime не скасовують перевірки меж пакета для
полів точок входу вихідного коду. Наприклад, `openclaw.runtimeExtensions` не може зробити
придатним до завантаження шлях `openclaw.extensions`, що виходить за межі.

`openclaw.install.allowInvalidConfigRecovery` навмисно вузький. Він
не робить довільні зламані конфігурації придатними для встановлення. Наразі він лише дозволяє
потокам встановлення відновлюватися після певних застарілих збоїв оновлення вбудованого plugin,
наприклад відсутнього шляху до вбудованого plugin або застарілого запису `channels.<id>` для цього ж
вбудованого plugin. Несуміжні помилки конфігурації, як і раніше, блокують встановлення та спрямовують операторів
до `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` — це метадані пакета для крихітного модуля перевірки:

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

Використовуйте це, коли потоки setup, doctor або configured-state потребують дешевого
yes/no-зонду автентифікації до завантаження повного channel plugin. Цільовий експорт має бути
невеликою функцією, що читає лише збережений стан; не маршрутизуйте його через повний
barrel runtime channel.

`openclaw.channel.configuredState` має ту саму форму для дешевих перевірок
configured-state лише через env:

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

Використовуйте це, коли channel може визначити configured-state з env або інших малих
невиконуваних вхідних даних. Якщо перевірка потребує повного розв’язання конфігурації або реального
runtime channel, натомість залиште цю логіку в хуку plugin `config.hasConfiguredState`.

## Пріоритет виявлення (дублікати id plugin)

OpenClaw виявляє plugin з кількох коренів (вбудовані, глобальне встановлення, workspace, явно вибрані в конфігурації шляхи). Якщо два виявлення мають однаковий `id`, зберігається лише маніфест із **найвищим пріоритетом**; дублікати з нижчим пріоритетом відкидаються замість завантаження поруч із ним.

Пріоритет, від найвищого до найнижчого:

1. **Вибраний конфігурацією** — шлях, явно закріплений у `plugins.entries.<id>`
2. **Вбудований** — plugin, що постачаються з OpenClaw
3. **Глобальне встановлення** — plugin, встановлені до глобального кореня plugin OpenClaw
4. **Workspace** — plugin, виявлені відносно поточного workspace

Наслідки:

- Форкнута або застаріла копія вбудованого plugin у workspace не зможе затінити вбудовану збірку.
- Щоб справді перевизначити вбудований plugin локальним, закріпіть його через `plugins.entries.<id>`, щоб він переміг за пріоритетом, а не покладайтеся на виявлення у workspace.
- Відкидання дублікатів записується в лог, щоб Doctor і діагностика запуску могли вказати на відкинуту копію.

## Вимоги до JSON Schema

- **Кожен plugin повинен постачатися з JSON Schema**, навіть якщо він не приймає конфігурацію.
- Порожня схема прийнятна (наприклад, `{ "type": "object", "additionalProperties": false }`).
- Схеми проходять валідацію під час читання/запису конфігурації, а не під час runtime.

## Поведінка валідації

- Невідомі ключі `channels.*` є **помилками**, якщо тільки id channel не оголошено
  маніфестом plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` і `plugins.slots.*`
  мають посилатися на **виявлювані** id plugin. Невідомі id є **помилками**.
- Якщо plugin встановлено, але він має зламаний або відсутній маніфест чи схему,
  валідація завершується помилкою, а Doctor повідомляє про помилку plugin.
- Якщо конфігурація plugin існує, але plugin **вимкнено**, конфігурація зберігається, і
  у Doctor + логах відображається **попередження**.

Див. [Довідник конфігурації](/uk/gateway/configuration) для повної схеми `plugins.*`.

## Примітки

- Маніфест **обов’язковий для власних Plugin OpenClaw**, зокрема для локальних завантажень із файлової системи. Runtime, як і раніше, завантажує модуль plugin окремо; маніфест використовується лише для виявлення + валідації.
- Власні маніфести розбираються за допомогою JSON5, тому коментарі, кінцеві коми та ключі без лапок допускаються, якщо кінцеве значення все ще є об’єктом.
- Завантажувач маніфесту читає лише документовані поля маніфесту. Уникайте власних ключів верхнього рівня.
- `channels`, `providers`, `cliBackends` і `skills` можна не вказувати, якщо plugin їх не потребує.
- `providerDiscoveryEntry` має залишатися полегшеним і не повинен імпортувати широкий runtime-код; використовуйте його для статичних метаданих каталогу provider або вузьких дескрипторів виявлення, а не для виконання під час запиту.
- Ексклюзивні типи plugin вибираються через `plugins.slots.*`: `kind: "memory"` через `plugins.slots.memory`, `kind: "context-engine"` через `plugins.slots.contextEngine` (типово `legacy`).
- Метадані змінних середовища (`providerAuthEnvVars`, `channelEnvVars`) є лише декларативними. Поверхні статусу, аудиту, валідації доставки Cron та інші поверхні лише для читання все одно застосовують політику довіри до plugin і ефективної активації, перш ніж вважати змінну середовища налаштованою.
- Для метаданих wizard runtime, які потребують коду provider, див. [Хуки runtime provider](/uk/plugins/architecture-internals#provider-runtime-hooks).
- Якщо ваш plugin залежить від native-модулів, задокументуйте кроки збирання та будь-які вимоги до allowlist менеджера пакетів (наприклад, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Пов’язані матеріали

<CardGroup cols={3}>
  <Card title="Створення plugin" href="/uk/plugins/building-plugins" icon="rocket">
    Початок роботи з plugin.
  </Card>
  <Card title="Архітектура plugin" href="/uk/plugins/architecture" icon="diagram-project">
    Внутрішня архітектура та модель можливостей.
  </Card>
  <Card title="Огляд SDK" href="/uk/plugins/sdk-overview" icon="book">
    Довідник по SDK plugin і імпортам підшляхів.
  </Card>
</CardGroup>
