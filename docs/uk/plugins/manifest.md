---
read_when:
    - Ви створюєте Plugin для OpenClaw
    - Вам потрібно надати схему конфігурації Plugin або налагодити помилки валідації Plugin
summary: Вимоги до маніфесту Plugin + JSON schema (сувора валідація конфігурації)
title: маніфест Plugin
x-i18n:
    generated_at: "2026-04-24T21:26:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: b487d60a8645cca338b5b5a88f9a1f2b15b03e0905f6f541fe97be605c8297d6
    source_path: plugins/manifest.md
    workflow: 15
---

Ця сторінка призначена лише для **власного маніфесту Plugin OpenClaw**.

Сумісні макети bundle описані тут: [Plugin bundles](/uk/plugins/bundles).

Сумісні формати bundle використовують інші файли маніфесту:

- Codex bundle: `.codex-plugin/plugin.json`
- Claude bundle: `.claude-plugin/plugin.json` або стандартний макет компонента Claude без маніфесту
- Cursor bundle: `.cursor-plugin/plugin.json`

OpenClaw також автоматично виявляє ці макети bundle, але вони не проходять валідацію за схемою `openclaw.plugin.json`, описаною тут.

Для сумісних bundle OpenClaw наразі зчитує метадані bundle, а також оголошені корені skill, корені команд Claude, значення за замовчуванням `settings.json` для Claude bundle, значення LSP за замовчуванням для Claude bundle і підтримувані набори hook, коли макет відповідає очікуванням середовища виконання OpenClaw.

Кожен власний Plugin OpenClaw **повинен** містити файл `openclaw.plugin.json` у **корені plugin**. OpenClaw використовує цей маніфест для валідації конфігурації **без виконання коду plugin**. Відсутні або невалідні маніфести вважаються помилками plugin і блокують валідацію конфігурації.

Повний посібник із системи plugin дивіться тут: [Plugins](/uk/tools/plugin).
Щодо власної моделі capability і поточних рекомендацій щодо зовнішньої сумісності:
[Модель capability](/uk/plugins/architecture#public-capability-model).

## Що робить цей файл

`openclaw.plugin.json` — це метадані, які OpenClaw зчитує **до завантаження коду вашого plugin**. Усе нижче має бути достатньо легким для перевірки без запуску середовища виконання plugin.

**Використовуйте його для:**

- ідентичності plugin, валідації конфігурації та підказок для UI конфігурації
- метаданих автентифікації, онбордингу й налаштування (псевдонім, автоувімкнення, змінні середовища provider, варіанти автентифікації)
- підказок активації для поверхонь control plane
- скороченого визначення належності до сімейства моделей
- статичних знімків належності capability (`contracts`)
- метаданих QA runner, які може перевіряти спільний хост `openclaw qa`
- метаданих конфігурації, специфічних для channel, що об’єднуються в catalog і поверхні валідації

**Не використовуйте його для:** реєстрації поведінки під час виконання, оголошення точок входу коду або метаданих встановлення npm. Це належить до коду вашого plugin і `package.json`.

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

| Поле                                 | Обов’язкове | Тип                              | Що воно означає                                                                                                                                                                                                                    |
| ------------------------------------ | ----------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Так         | `string`                         | Канонічний id plugin. Це id, який використовується в `plugins.entries.<id>`.                                                                                                                                                      |
| `configSchema`                       | Так         | `object`                         | Вбудована JSON Schema для конфігурації цього plugin.                                                                                                                                                                               |
| `enabledByDefault`                   | Ні          | `true`                           | Позначає вбудований plugin як увімкнений за замовчуванням. Якщо не вказати це поле або встановити будь-яке значення, відмінне від `true`, plugin залишиться вимкненим за замовчуванням.                                        |
| `legacyPluginIds`                    | Ні          | `string[]`                       | Застарілі id, які нормалізуються до цього канонічного id plugin.                                                                                                                                                                   |
| `autoEnableWhenConfiguredProviders`  | Ні          | `string[]`                       | Id provider, які повинні автоматично вмикати цей plugin, коли автентифікація, конфігурація або посилання на моделі згадують їх.                                                                                                   |
| `kind`                               | Ні          | `"memory"` \| `"context-engine"` | Оголошує ексклюзивний тип plugin, який використовується `plugins.slots.*`.                                                                                                                                                         |
| `channels`                           | Ні          | `string[]`                       | Id channel, якими володіє цей plugin. Використовується для виявлення та валідації конфігурації.                                                                                                                                   |
| `providers`                          | Ні          | `string[]`                       | Id provider, якими володіє цей plugin.                                                                                                                                                                                             |
| `providerDiscoveryEntry`             | Ні          | `string`                         | Полегшений шлях до модуля виявлення provider, відносно кореня plugin, для метаданих catalog provider в області маніфесту, які можна завантажити без активації повного середовища виконання plugin.                              |
| `modelSupport`                       | Ні          | `object`                         | Скорочені метадані сімейства моделей, що належать маніфесту, які використовуються для автозавантаження plugin до запуску середовища виконання.                                                                                    |
| `providerEndpoints`                  | Ні          | `object[]`                       | Метадані хостів endpoint/baseUrl, що належать маніфесту, для маршрутів provider, які ядро має класифікувати до завантаження середовища виконання provider.                                                                       |
| `cliBackends`                        | Ні          | `string[]`                       | Id backend CLI, якими володіє цей plugin. Використовуються для автоактивації під час запуску з явних посилань конфігурації.                                                                                                       |
| `syntheticAuthRefs`                  | Ні          | `string[]`                       | Посилання на provider або backend CLI, для яких слід перевіряти синтетичний hook автентифікації, що належить plugin, під час холодного виявлення моделей до завантаження середовища виконання.                                  |
| `nonSecretAuthMarkers`               | Ні          | `string[]`                       | Значення-заповнювачі API key, що належать вбудованому plugin і представляють не секретний локальний стан, OAuth або стан облікових даних середовища.                                                                              |
| `commandAliases`                     | Ні          | `object[]`                       | Імена команд, якими володіє цей plugin і які повинні формувати діагностику конфігурації та CLI з урахуванням plugin до завантаження середовища виконання.                                                                        |
| `providerAuthEnvVars`                | Ні          | `Record<string, string[]>`       | Застарілі сумісні метадані env для пошуку автентифікації/статусу provider. Для нових plugin віддавайте перевагу `setup.providers[].envVars`; OpenClaw усе ще зчитує це поле протягом періоду застарівання.                      |
| `providerAuthAliases`                | Ні          | `Record<string, string>`         | Id provider, які мають повторно використовувати інший id provider для пошуку автентифікації, наприклад provider для кодування, який спільно використовує API key і профілі автентифікації базового provider.                    |
| `channelEnvVars`                     | Ні          | `Record<string, string[]>`       | Полегшені метадані env для channel, які OpenClaw може перевірити без завантаження коду plugin. Використовуйте це для налаштування channel на основі env або поверхонь автентифікації, які мають бачити універсальні допоміжні засоби запуску/конфігурації. |
| `providerAuthChoices`                | Ні          | `object[]`                       | Полегшені метадані варіантів автентифікації для селекторів онбордингу, визначення пріоритетного provider та простого зв’язування прапорців CLI.                                                                                    |
| `activation`                         | Ні          | `object`                         | Полегшені метадані планувальника активації для завантаження, яке запускається provider, командою, channel, маршрутом і capability. Лише метадані; фактична поведінка все ще належить середовищу виконання plugin.              |
| `setup`                              | Ні          | `object`                         | Полегшені дескриптори налаштування/онбордингу, які поверхні виявлення та налаштування можуть перевіряти без завантаження середовища виконання plugin.                                                                             |
| `qaRunners`                          | Ні          | `object[]`                       | Полегшені дескриптори QA runner, які використовуються спільним хостом `openclaw qa` до завантаження середовища виконання plugin.                                                                                                  |
| `contracts`                          | Ні          | `object`                         | Статичний знімок вбудованих capability для зовнішніх hook автентифікації, speech, realtime transcription, realtime voice, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search і належності tool. |
| `mediaUnderstandingProviderMetadata` | Ні          | `Record<string, object>`         | Полегшені значення за замовчуванням media-understanding для id provider, оголошених у `contracts.mediaUnderstandingProviders`.                                                                                                    |
| `channelConfigs`                     | Ні          | `Record<string, object>`         | Метадані конфігурації channel, що належать маніфесту й об’єднуються в поверхні виявлення та валідації до завантаження середовища виконання.                                                                                      |
| `skills`                             | Ні          | `string[]`                       | Каталоги Skills для завантаження, відносно кореня plugin.                                                                                                                                                                          |
| `name`                               | Ні          | `string`                         | Людинозрозуміла назва plugin.                                                                                                                                                                                                      |
| `description`                        | Ні          | `string`                         | Короткий опис, що показується в поверхнях plugin.                                                                                                                                                                                  |
| `version`                            | Ні          | `string`                         | Інформаційна версія plugin.                                                                                                                                                                                                        |
| `uiHints`                            | Ні          | `Record<string, object>`         | Мітки UI, заповнювачі та підказки щодо чутливості для полів конфігурації.                                                                                                                                                          |

## Довідник `providerAuthChoices`

Кожен запис `providerAuthChoices` описує один варіант онбордингу або автентифікації.
OpenClaw зчитує це до завантаження середовища виконання provider.
Потік налаштування provider спочатку віддає перевагу цим варіантам із маніфесту, а потім для сумісності повертається до метаданих wizard під час виконання та варіантів install catalog.

| Поле                  | Обов’язкове | Тип                                             | Що воно означає                                                                                           |
| --------------------- | ----------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `provider`            | Так         | `string`                                        | Id provider, якому належить цей варіант.                                                                  |
| `method`              | Так         | `string`                                        | Id методу автентифікації, до якого слід спрямувати.                                                       |
| `choiceId`            | Так         | `string`                                        | Стабільний id варіанта автентифікації, що використовується потоками онбордингу та CLI.                    |
| `choiceLabel`         | Ні          | `string`                                        | Мітка для користувача. Якщо поле не вказано, OpenClaw використовує `choiceId`.                            |
| `choiceHint`          | Ні          | `string`                                        | Короткий допоміжний текст для селектора.                                                                  |
| `assistantPriority`   | Ні          | `number`                                        | Менші значення сортуються раніше в інтерактивних селекторах, керованих помічником.                        |
| `assistantVisibility` | Ні          | `"visible"` \| `"manual-only"`                  | Приховує варіант від селекторів помічника, але все одно дозволяє ручний вибір через CLI.                 |
| `deprecatedChoiceIds` | Ні          | `string[]`                                      | Застарілі id варіантів, які повинні перенаправляти користувачів до цього варіанта-заміни.                |
| `groupId`             | Ні          | `string`                                        | Необов’язковий id групи для групування пов’язаних варіантів.                                              |
| `groupLabel`          | Ні          | `string`                                        | Мітка для цієї групи, видима користувачу.                                                                 |
| `groupHint`           | Ні          | `string`                                        | Короткий допоміжний текст для групи.                                                                      |
| `optionKey`           | Ні          | `string`                                        | Внутрішній ключ опції для простих потоків автентифікації з одним прапорцем.                              |
| `cliFlag`             | Ні          | `string`                                        | Назва прапорця CLI, наприклад `--openrouter-api-key`.                                                     |
| `cliOption`           | Ні          | `string`                                        | Повна форма опції CLI, наприклад `--openrouter-api-key <key>`.                                            |
| `cliDescription`      | Ні          | `string`                                        | Опис, який використовується в довідці CLI.                                                                |
| `onboardingScopes`    | Ні          | `Array<"text-inference" \| "image-generation">` | На яких поверхнях онбордингу має з’являтися цей варіант. Якщо поле не вказано, за замовчуванням це `["text-inference"]`. |

## Довідник `commandAliases`

Використовуйте `commandAliases`, коли plugin володіє назвою команди під час виконання, яку користувачі можуть помилково вказати в `plugins.allow` або спробувати запустити як кореневу команду CLI. OpenClaw використовує ці метадані для діагностики без імпорту коду середовища виконання plugin.

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

| Поле         | Обов’язкове | Тип               | Що воно означає                                                           |
| ------------ | ----------- | ----------------- | ------------------------------------------------------------------------- |
| `name`       | Так         | `string`          | Назва команди, яка належить цьому plugin.                                 |
| `kind`       | Ні          | `"runtime-slash"` | Позначає псевдонім як slash command чату, а не як кореневу команду CLI.   |
| `cliCommand` | Ні          | `string`          | Пов’язана коренева команда CLI, яку слід рекомендувати для операцій CLI, якщо така існує. |

## Довідник `activation`

Використовуйте `activation`, коли plugin може дешево оголосити, які події control plane повинні включати його в план активації/завантаження.

Цей блок є метаданими планувальника, а не API життєвого циклу. Він не реєструє поведінку під час виконання, не замінює `register(...)` і не гарантує, що код plugin уже був виконаний. Планувальник активації використовує ці поля, щоб звузити коло кандидатів серед plugin, перш ніж перейти до наявних метаданих належності з маніфесту, таких як `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` і hooks.

Віддавайте перевагу найвужчим метаданим, які вже описують належність. Використовуйте `providers`, `channels`, `commandAliases`, дескриптори setup або `contracts`, коли ці поля виражають цей зв’язок. Використовуйте `activation` для додаткових підказок планувальника, які не можна представити цими полями належності.

Цей блок — лише метадані. Він не реєструє поведінку під час виконання й не замінює `register(...)`, `setupEntry` або інші точки входу runtime/plugin. Поточні споживачі використовують його як підказку для звуження кола кандидатів перед ширшим завантаженням plugin, тому відсутність метаданих `activation` зазвичай впливає лише на продуктивність; це не повинно змінювати коректність, доки ще існують застарілі резервні механізми належності маніфесту.

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
| `onProviders`    | Ні          | `string[]`                                           | Id provider, які повинні включати цей plugin до планів активації/завантаження.                           |
| `onCommands`     | Ні          | `string[]`                                           | Id команд, які повинні включати цей plugin до планів активації/завантаження.                             |
| `onChannels`     | Ні          | `string[]`                                           | Id channel, які повинні включати цей plugin до планів активації/завантаження.                            |
| `onRoutes`       | Ні          | `string[]`                                           | Типи маршрутів, які повинні включати цей plugin до планів активації/завантаження.                        |
| `onCapabilities` | Ні          | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Загальні підказки capability, що використовуються плануванням активації control plane. Якщо можливо, віддавайте перевагу вужчим полям. |

Поточні активні споживачі:

- планування CLI, запущене командою, повертається до застарілих
  `commandAliases[].cliCommand` або `commandAliases[].name`
- планування setup/channel, запущене channel, повертається до застарілої
  належності `channels[]`, коли явні метадані активації channel відсутні
- планування setup/runtime, запущене provider, повертається до застарілої
  належності `providers[]` і верхньорівневої `cliBackends[]`, коли явні метадані
  активації provider відсутні

Діагностика планувальника може розрізняти явні підказки активації та резервне використання належності маніфесту. Наприклад, `activation-command-hint` означає, що збіглося `activation.onCommands`, тоді як `manifest-command-alias` означає, що планувальник натомість використав належність `commandAliases`. Ці мітки причин призначені для діагностики хоста та тестів; авторам plugin слід і надалі оголошувати метадані, які найкраще описують належність.

## Довідник `qaRunners`

Використовуйте `qaRunners`, коли plugin додає один або більше transport runner під спільним коренем `openclaw qa`. Зберігайте ці метадані легкими та статичними; фактичною реєстрацією CLI під час виконання все одно керує поверхня `runtime-api.ts`, що експортує `qaRunnerCliRegistrations`.

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

| Поле          | Обов’язкове | Тип      | Що воно означає                                                     |
| ------------- | ----------- | -------- | ------------------------------------------------------------------- |
| `commandName` | Так         | `string` | Підкоманда, змонтована під `openclaw qa`, наприклад `matrix`.       |
| `description` | Ні          | `string` | Резервний текст довідки, який використовується, коли спільному хосту потрібна stub command. |

## Довідник `setup`

Використовуйте `setup`, коли поверхням налаштування та онбордингу потрібні легкі метадані plugin до завантаження runtime.

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

Верхньорівневе `cliBackends` залишається валідним і далі описує backend CLI для inference. `setup.cliBackends` — це поверхня дескрипторів, специфічна для setup, для потоків control plane/setup, які мають залишатися лише метаданими.

Якщо `setup.providers` і `setup.cliBackends` присутні, вони є пріоритетною поверхнею пошуку на основі дескрипторів для виявлення setup. Якщо дескриптор лише звужує коло кандидатів plugin, а setup усе ще потребує багатших hook часу налаштування під час виконання, встановіть `requiresRuntime: true` і залиште `setup-api` як резервний шлях виконання.

OpenClaw також включає `setup.providers[].envVars` у загальні пошуки автентифікації provider і змінних середовища. `providerAuthEnvVars` залишається підтримуваним через адаптер сумісності протягом періоду застарівання, але невбудовані plugin, які все ще його використовують, отримують діагностику маніфесту. Нові plugin повинні розміщувати метадані env для setup/статусу в `setup.providers[].envVars`.

Установлюйте `requiresRuntime: false` лише тоді, коли цих дескрипторів достатньо для поверхні setup. OpenClaw трактує явне `false` як контракт лише на дескриптори й не виконуватиме `setup-api` або `openclaw.setupEntry` для пошуку setup. Якщо plugin, що має працювати лише через дескриптори, усе ж постачає один із цих runtime entry setup, OpenClaw повідомляє додаткову діагностику й продовжує ігнорувати його. Якщо `requiresRuntime` не вказано, зберігається застаріла резервна поведінка, щоб наявні plugin, які додали дескриптори без цього прапорця, не ламалися.

Оскільки пошук setup може виконувати код `setup-api`, що належить plugin, нормалізовані значення `setup.providers[].id` і `setup.cliBackends[]` повинні залишатися унікальними серед виявлених plugin. Неоднозначна належність завершується закритою відмовою замість вибору переможця за порядком виявлення.

Коли runtime setup усе ж виконується, діагностика реєстру setup повідомляє про розходження дескрипторів, якщо `setup-api` реєструє provider або backend CLI, яких не оголошують дескриптори маніфесту, або якщо дескриптор не має відповідної runtime-реєстрації. Ці діагностики є додатковими й не відхиляють застарілі plugin.

### Довідник `setup.providers`

| Поле          | Обов’язкове | Тип        | Що воно означає                                                                    |
| ------------- | ----------- | ---------- | ---------------------------------------------------------------------------------- |
| `id`          | Так         | `string`   | Id provider, який надається під час setup або онбордингу. Нормалізовані id мають бути глобально унікальними. |
| `authMethods` | Ні          | `string[]` | Id методів setup/автентифікації, які цей provider підтримує без завантаження повного runtime. |
| `envVars`     | Ні          | `string[]` | Змінні середовища, які універсальні поверхні setup/статусу можуть перевіряти до завантаження runtime plugin. |

### Поля `setup`

| Поле               | Обов’язкове | Тип        | Що воно означає                                                                                     |
| ------------------ | ----------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | Ні          | `object[]` | Дескриптори setup provider, доступні під час setup та онбордингу.                                  |
| `cliBackends`      | Ні          | `string[]` | Id backend часу setup, що використовуються для пошуку setup спочатку за дескрипторами. Нормалізовані id мають бути глобально унікальними. |
| `configMigrations` | Ні          | `string[]` | Id міграцій конфігурації, якими володіє поверхня setup цього plugin.                               |
| `requiresRuntime`  | Ні          | `boolean`  | Чи потребує setup виконання `setup-api` після пошуку за дескрипторами.                             |

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

Кожна підказка для поля може містити:

| Поле          | Тип        | Що воно означає                         |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Мітка поля для користувача.             |
| `help`        | `string`   | Короткий допоміжний текст.              |
| `tags`        | `string[]` | Необов’язкові теги UI.                  |
| `advanced`    | `boolean`  | Позначає поле як розширене.             |
| `sensitive`   | `boolean`  | Позначає поле як секретне або чутливе.  |
| `placeholder` | `string`   | Текст-заповнювач для полів форми.       |

## Довідник `contracts`

Використовуйте `contracts` лише для статичних метаданих належності capability, які OpenClaw може зчитати без імпорту runtime plugin.

```json
{
  "contracts": {
    "agentToolResultMiddleware": ["pi", "codex-app-server"],
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

| Поле                             | Тип        | Що воно означає                                                      |
| -------------------------------- | ---------- | -------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Застарілі id фабрик вбудованих extension.                            |
| `agentToolResultMiddleware`      | `string[]` | Id harness, для яких вбудований plugin може зареєструвати middleware результатів tool. |
| `externalAuthProviders`          | `string[]` | Id provider, зовнішнім hook профілю автентифікації яких володіє цей plugin. |
| `speechProviders`                | `string[]` | Id provider speech, якими володіє цей plugin.                        |
| `realtimeTranscriptionProviders` | `string[]` | Id provider realtime-transcription, якими володіє цей plugin.        |
| `realtimeVoiceProviders`         | `string[]` | Id provider realtime-voice, якими володіє цей plugin.                |
| `memoryEmbeddingProviders`       | `string[]` | Id provider embedding для memory, якими володіє цей plugin.          |
| `mediaUnderstandingProviders`    | `string[]` | Id provider media-understanding, якими володіє цей plugin.           |
| `imageGenerationProviders`       | `string[]` | Id provider image-generation, якими володіє цей plugin.              |
| `videoGenerationProviders`       | `string[]` | Id provider video-generation, якими володіє цей plugin.              |
| `webFetchProviders`              | `string[]` | Id provider web-fetch, якими володіє цей plugin.                     |
| `webSearchProviders`             | `string[]` | Id provider web-search, якими володіє цей plugin.                    |
| `tools`                          | `string[]` | Назви agent tool, якими володіє цей plugin для перевірок bundled contract. |

`contracts.embeddedExtensionFactories` збережено для коду сумісності bundled, якому все ще потрібні прямі події вбудованого runner для Pi. Нові bundled-перетворення результатів tool повинні оголошувати `contracts.agentToolResultMiddleware` і натомість реєструватися через `api.registerAgentToolResultMiddleware(...)`.
Зовнішні plugin не можуть реєструвати middleware результатів tool, оскільки цей seam може переписувати високодовірений вивід tool до того, як його побачить модель.

Plugin provider, які реалізують `resolveExternalAuthProfiles`, повинні оголошувати `contracts.externalAuthProviders`. Plugin без цього оголошення все ще працюють через застарілий резервний механізм сумісності, але він повільніший і буде видалений після завершення вікна міграції.

Bundled provider embedding для memory повинні оголошувати `contracts.memoryEmbeddingProviders` для кожного id адаптера, який вони надають, включно з вбудованими адаптерами, такими як `local`. Автономні шляхи CLI використовують цей контракт маніфесту, щоб завантажувати лише plugin-власник до того, як повний runtime Gateway зареєструє provider.

## Довідник `mediaUnderstandingProviderMetadata`

Використовуйте `mediaUnderstandingProviderMetadata`, коли provider media-understanding має моделі за замовчуванням, пріоритет резервної автоавтентифікації або нативну підтримку документів, які потрібні універсальним допоміжним засобам ядра до завантаження runtime. Ключі також мають бути оголошені в `contracts.mediaUnderstandingProviders`.

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

| Поле                   | Тип                                 | Що воно означає                                                          |
| ---------------------- | ----------------------------------- | ------------------------------------------------------------------------ |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Можливості медіа, які надає цей provider.                                |
| `defaultModels`        | `Record<string, string>`            | Значення моделей за замовчуванням для capability, які використовуються, коли конфігурація не задає модель. |
| `autoPriority`         | `Record<string, number>`            | Менші числа сортуються раніше для автоматичного резервного вибору provider на основі облікових даних. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Нативні входи документів, які підтримує provider.                        |

## Довідник `channelConfigs`

Використовуйте `channelConfigs`, коли plugin channel потребує легких метаданих конфігурації до завантаження runtime.

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

| Поле          | Тип                      | Що воно означає                                                                         |
| ------------- | ------------------------ | --------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema для `channels.<id>`. Обов’язкова для кожного оголошеного запису конфігурації channel. |
| `uiHints`     | `Record<string, object>` | Необов’язкові мітки UI/заповнювачі/підказки чутливості для цього розділу конфігурації channel. |
| `label`       | `string`                 | Мітка channel, яка об’єднується в поверхні вибору та інспекції, коли метадані runtime ще не готові. |
| `description` | `string`                 | Короткий опис channel для поверхонь інспекції та catalog.                              |
| `preferOver`  | `string[]`               | Id застарілих plugin або plugin із нижчим пріоритетом, які цей channel має випереджати в поверхнях вибору. |

## Довідник `modelSupport`

Використовуйте `modelSupport`, коли OpenClaw має виводити ваш plugin provider із скорочених id моделей, таких як `gpt-5.5` або `claude-sonnet-4.6`, до завантаження runtime plugin.

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
- `modelPatterns` мають пріоритет над `modelPrefixes`
- якщо збігаються один невбудований plugin і один вбудований plugin, перемагає невбудований plugin
- решта неоднозначностей ігнорується, доки користувач або конфігурація не вкаже provider

Поля:

| Поле            | Тип        | Що воно означає                                                                      |
| --------------- | ---------- | ------------------------------------------------------------------------------------ |
| `modelPrefixes` | `string[]` | Префікси, що зіставляються через `startsWith` зі скороченими id моделей.            |
| `modelPatterns` | `string[]` | Джерела regex, що зіставляються зі скороченими id моделей після видалення суфікса профілю. |

Застарілі ключі capability верхнього рівня не рекомендуються до використання. Використовуйте `openclaw doctor --fix`, щоб перемістити `speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders` і `webSearchProviders` у `contracts`; звичайне завантаження маніфесту більше не розглядає ці поля верхнього рівня як належність capability.

## Маніфест і `package.json`

Ці два файли виконують різні завдання:

| Файл                   | Для чого використовувати                                                                                                            |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Виявлення, валідація конфігурації, метадані варіантів автентифікації та підказки UI, які мають існувати до запуску коду plugin    |
| `package.json`         | Метадані npm, встановлення залежностей і блок `openclaw`, що використовується для точок входу, обмежень встановлення, setup або метаданих catalog |

Якщо ви не впевнені, куди має належати певний фрагмент метаданих, використовуйте таке правило:

- якщо OpenClaw повинен знати це до завантаження коду plugin, помістіть це в `openclaw.plugin.json`
- якщо це стосується пакування, файлів входу або поведінки встановлення npm, помістіть це в `package.json`

### Поля `package.json`, які впливають на виявлення

Деякі метадані plugin до запуску runtime навмисно розміщено в `package.json` у блоці `openclaw`, а не в `openclaw.plugin.json`.

Важливі приклади:

| Поле                                                              | Що воно означає                                                                                                                                                                      |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | Оголошує власні точки входу plugin. Має залишатися в межах каталогу пакета plugin.                                                                                                  |
| `openclaw.runtimeExtensions`                                      | Оголошує зібрані точки входу runtime JavaScript для встановлених пакетів. Має залишатися в межах каталогу пакета plugin.                                                           |
| `openclaw.setupEntry`                                             | Полегшена точка входу лише для setup, що використовується під час онбордингу, відкладеного запуску channel та виявлення status/SecretRef channel тільки для читання. Має залишатися в межах каталогу пакета plugin. |
| `openclaw.runtimeSetupEntry`                                      | Оголошує зібрану точку входу setup JavaScript для встановлених пакетів. Має залишатися в межах каталогу пакета plugin.                                                             |
| `openclaw.channel`                                                | Полегшені метадані catalog channel, як-от мітки, шляхи до docs, псевдоніми та текст для вибору.                                                                                     |
| `openclaw.channel.configuredState`                                | Полегшені метадані перевірки налаштованого стану, які можуть відповісти на запитання «чи вже існує setup лише через env?» без завантаження повного runtime channel.                |
| `openclaw.channel.persistedAuthState`                             | Полегшені метадані перевірки збереженого стану автентифікації, які можуть відповісти на запитання «чи вже є якийсь вхід у систему?» без завантаження повного runtime channel.      |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Підказки для встановлення/оновлення вбудованих і зовнішньо опублікованих plugin.                                                                                                     |
| `openclaw.install.defaultChoice`                                  | Бажаний шлях встановлення, коли доступно кілька джерел встановлення.                                                                                                                 |
| `openclaw.install.minHostVersion`                                 | Мінімальна підтримувана версія хоста OpenClaw із semver-нижньою межею на кшталт `>=2026.3.22`.                                                                                      |
| `openclaw.install.expectedIntegrity`                              | Очікуваний рядок цілісності npm dist, наприклад `sha512-...`; потоки встановлення та оновлення звіряють отриманий артефакт із ним.                                                 |
| `openclaw.install.allowInvalidConfigRecovery`                     | Дозволяє вузький шлях відновлення через перевстановлення вбудованого plugin, коли конфігурація невалідна.                                                                           |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Дозволяє поверхням channel лише для setup завантажуватися до повного plugin channel під час запуску.                                                                                |

Метадані маніфесту визначають, які варіанти provider/channel/setup з’являються в онбордингу до завантаження runtime. `package.json#openclaw.install` повідомляє онбордингу, як отримати або ввімкнути цей plugin, коли користувач вибирає один із цих варіантів.
Не переміщуйте підказки встановлення в `openclaw.plugin.json`.

`openclaw.install.minHostVersion` перевіряється під час встановлення та завантаження реєстру маніфестів. Невалідні значення відхиляються; новіші, але валідні значення пропускають plugin на старіших хостах.

Точне закріплення версії npm уже міститься в `npmSpec`, наприклад
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Офіційні записи зовнішнього catalog повинні поєднувати точні специфікації з `expectedIntegrity`, щоб потоки оновлення завершувалися закритою відмовою, якщо отриманий npm-артефакт більше не відповідає закріпленому релізу.
Для сумісності інтерактивний онбординг усе ще пропонує npm-специфікації довіреного реєстру, включно з простими назвами пакетів і dist-tag. Діагностика catalog може розрізняти точні, плаваючі, закріплені за цілісністю, без цілісності, з невідповідністю назви пакета та невалідні джерела default-choice. Вона також попереджає, коли `expectedIntegrity` присутній, але немає валідного джерела npm, яке можна ним закріпити.
Коли `expectedIntegrity` присутній, потоки встановлення/оновлення примусово його застосовують; коли його не вказано, результат розв’язання реєстру фіксується без закріплення цілісності.

Plugin channel повинні надавати `openclaw.setupEntry`, коли перевіркам status, списку channel або SecretRef потрібно визначати налаштовані облікові записи без завантаження повного runtime. Точка входу setup повинна надавати метадані channel разом із безпечними для setup адаптерами конфігурації, status і secrets; мережеві клієнти, слухачі Gateway та transport runtime слід залишати в основній точці входу extension.

Поля точок входу runtime не скасовують перевірки меж пакета для полів точок входу вихідного коду. Наприклад, `openclaw.runtimeExtensions` не може зробити завантажуваним шлях `openclaw.extensions`, що виходить за межі пакета.

`openclaw.install.allowInvalidConfigRecovery` навмисно має вузьке призначення. Воно не робить довільні зламані конфігурації придатними до встановлення. Наразі воно лише дозволяє потокам встановлення відновлюватися після конкретних застарілих збоїв оновлення вбудованого plugin, таких як відсутній шлях до вбудованого plugin або застарілий запис `channels.<id>` для того самого вбудованого plugin. Непов’язані помилки конфігурації все одно блокують встановлення й спрямовують операторів до `openclaw doctor --fix`.

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

Використовуйте це, коли потокам setup, doctor або configured-state потрібна дешева перевірка автентифікації типу так/ні до завантаження повного plugin channel. Цільовий export має бути невеликою функцією, яка читає лише збережений стан; не спрямовуйте її через повний barrel runtime channel.

`openclaw.channel.configuredState` має ту саму форму для дешевих перевірок налаштованого стану лише через env:

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

Використовуйте це, коли channel може визначити налаштований стан через env або інші малі невruntime-входи. Якщо перевірка потребує повного розв’язання конфігурації або справжнього runtime channel, залишайте цю логіку в hook plugin `config.hasConfiguredState`.

## Пріоритет виявлення (дублікати id plugin)

OpenClaw виявляє plugin із кількох коренів (вбудовані, глобальне встановлення, workspace, шляхи, явно вибрані конфігурацією). Якщо два виявлені plugin мають однаковий `id`, зберігається лише маніфест із **найвищим пріоритетом**; дублікати з нижчим пріоритетом відкидаються замість завантаження поруч із ним.

Пріоритет від найвищого до найнижчого:

1. **Вибраний конфігурацією** — шлях, явно закріплений у `plugins.entries.<id>`
2. **Вбудований** — plugin, які постачаються разом з OpenClaw
3. **Глобальне встановлення** — plugin, встановлені в глобальний корінь plugin OpenClaw
4. **Workspace** — plugin, виявлені відносно поточного workspace

Наслідки:

- Розгалужена або застаріла копія вбудованого plugin у workspace не затьмарить вбудовану збірку.
- Щоб справді перевизначити вбудований plugin локальним, закріпіть його через `plugins.entries.<id>`, щоб він переміг за пріоритетом, а не покладайтеся на виявлення у workspace.
- Відкидання дублікатів фіксується в журналі, щоб Doctor і діагностика запуску могли вказати на відкинуту копію.

## Вимоги до JSON Schema

- **Кожен plugin повинен містити JSON Schema**, навіть якщо він не приймає конфігурацію.
- Порожня схема допустима (наприклад, `{ "type": "object", "additionalProperties": false }`).
- Схеми перевіряються під час читання/запису конфігурації, а не під час виконання.

## Поведінка валідації

- Невідомі ключі `channels.*` є **помилками**, якщо тільки id channel не оголошено в маніфесті plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` і `plugins.slots.*` повинні посилатися на id plugin, які **можна виявити**. Невідомі id є **помилками**.
- Якщо plugin установлено, але його маніфест або схема зламані чи відсутні, валідація завершується помилкою, а Doctor повідомляє про помилку plugin.
- Якщо конфігурація plugin існує, але сам plugin **вимкнений**, конфігурація зберігається, а в Doctor + журналах показується **попередження**.

Повну схему `plugins.*` дивіться тут: [Довідник конфігурації](/uk/gateway/configuration).

## Примітки

- Маніфест **обов’язковий для власних Plugin OpenClaw**, включно із завантаженням із локальної файлової системи. Runtime усе одно завантажує модуль plugin окремо; маніфест потрібен лише для виявлення + валідації.
- Власні маніфести парсяться за допомогою JSON5, тому коментарі, кінцеві коми та ключі без лапок допускаються, якщо фінальне значення все одно залишається об’єктом.
- Завантажувач маніфесту читає лише документовані поля маніфесту. Уникайте власних ключів верхнього рівня.
- `channels`, `providers`, `cliBackends` і `skills` можна не вказувати, якщо plugin їх не потребує.
- `providerDiscoveryEntry` має залишатися легким і не повинен імпортувати широкий runtime-код; використовуйте його для статичних метаданих catalog provider або вузьких дескрипторів виявлення, а не для виконання під час обробки запитів.
- Ексклюзивні типи plugin вибираються через `plugins.slots.*`: `kind: "memory"` через `plugins.slots.memory`, `kind: "context-engine"` через `plugins.slots.contextEngine` (за замовчуванням `legacy`).
- Метадані змінних середовища (`setup.providers[].envVars`, застаріле `providerAuthEnvVars` і `channelEnvVars`) є лише декларативними. Status, аудит, валідація доставки Cron та інші поверхні лише для читання все одно застосовують політику довіри до plugin і ефективної активації, перш ніж вважати змінну середовища налаштованою.
- Для метаданих runtime wizard, які потребують коду provider, дивіться [Runtime hooks provider](/uk/plugins/architecture-internals#provider-runtime-hooks).
- Якщо ваш plugin залежить від native modules, задокументуйте кроки збірки та всі вимоги до allowlist менеджера пакетів (наприклад, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Пов’язані матеріали

<CardGroup cols={3}>
  <Card title="Створення plugin" href="/uk/plugins/building-plugins" icon="rocket">
    Початок роботи з plugin.
  </Card>
  <Card title="Архітектура plugin" href="/uk/plugins/architecture" icon="diagram-project">
    Внутрішня архітектура та модель capability.
  </Card>
  <Card title="Огляд SDK" href="/uk/plugins/sdk-overview" icon="book">
    Довідник SDK plugin та імпорти підшляхів.
  </Card>
</CardGroup>
