---
read_when:
    - Ви створюєте Plugin OpenClaw
    - Вам потрібно постачати схему конфігурації Plugin або налагоджувати помилки валідації Plugin
summary: Вимоги до маніфесту Plugin та JSON schema (сувора валідація конфігурації)
title: Маніфест Plugin
x-i18n:
    generated_at: "2026-04-24T18:19:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: bbef814f015b285ada8e656050d85e3113c218017840a5d1002e04348587dd5d
    source_path: plugins/manifest.md
    workflow: 15
---

Ця сторінка призначена лише для **нативного маніфесту Plugin OpenClaw**.

Для сумісних макетів bundle дивіться [Plugin bundles](/uk/plugins/bundles).

Сумісні формати bundle використовують інші файли маніфесту:

- Codex bundle: `.codex-plugin/plugin.json`
- Claude bundle: `.claude-plugin/plugin.json` або стандартний макет компонента Claude
  без маніфесту
- Cursor bundle: `.cursor-plugin/plugin.json`

OpenClaw також автоматично визначає ці макети bundle, але вони не проходять валідацію
за схемою `openclaw.plugin.json`, описаною тут.

Для сумісних bundle OpenClaw наразі зчитує метадані bundle, а також оголошені
корені skill, корені команд Claude, значення за замовчуванням `settings.json` для Claude bundle,
значення за замовчуванням LSP для Claude bundle та підтримувані набори hook, коли макет відповідає
очікуванням середовища виконання OpenClaw.

Кожен нативний Plugin OpenClaw **повинен** містити файл `openclaw.plugin.json` у
**корені Plugin**. OpenClaw використовує цей маніфест для валідації конфігурації
**без виконання коду Plugin**. Відсутні або невалідні маніфести вважаються
помилками Plugin і блокують валідацію конфігурації.

Дивіться повний посібник із системи Plugin: [Plugins](/uk/tools/plugin).
Щодо нативної моделі можливостей і поточних рекомендацій із зовнішньої сумісності:
[Модель можливостей](/uk/plugins/architecture#public-capability-model).

## Що робить цей файл

`openclaw.plugin.json` — це метадані, які OpenClaw зчитує **до завантаження коду
вашого Plugin**. Усе нижче має бути достатньо дешевим для перевірки без запуску
середовища виконання Plugin.

**Використовуйте його для:**

- ідентичності Plugin, валідації конфігурації та підказок UI для конфігурації
- метаданих автентифікації, онбордингу та налаштування (псевдонім, автоувімкнення, змінні середовища provider, варіанти автентифікації)
- підказок активації для поверхонь control plane
- скороченого володіння сімейством моделей
- статичних знімків володіння можливостями (`contracts`)
- метаданих QA runner, які може перевіряти спільний хост `openclaw qa`
- метаданих конфігурації, специфічних для channel, які об’єднуються в каталог і поверхні валідації

**Не використовуйте його для:** реєстрації поведінки під час виконання, оголошення
точок входу коду або метаданих встановлення npm. Це належить до коду вашого Plugin
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
| ------------------------------------ | ----------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Так         | `string`                         | Канонічний id Plugin. Це id, який використовується в `plugins.entries.<id>`.                                                                                                                                                     |
| `configSchema`                       | Так         | `object`                         | Вбудована JSON Schema для конфігурації цього Plugin.                                                                                                                                                                             |
| `enabledByDefault`                   | Ні          | `true`                           | Позначає bundle Plugin як увімкнений за замовчуванням. Пропустіть це поле або вкажіть будь-яке значення, відмінне від `true`, щоб залишити Plugin вимкненим за замовчуванням.                                                   |
| `legacyPluginIds`                    | Ні          | `string[]`                       | Застарілі id, які нормалізуються до цього канонічного id Plugin.                                                                                                                                                                 |
| `autoEnableWhenConfiguredProviders`  | Ні          | `string[]`                       | id provider, які мають автоматично вмикати цей Plugin, коли автентифікація, конфігурація або посилання на модель згадують їх.                                                                                                   |
| `kind`                               | Ні          | `"memory"` \| `"context-engine"` | Оголошує ексклюзивний тип Plugin, який використовується `plugins.slots.*`.                                                                                                                                                       |
| `channels`                           | Ні          | `string[]`                       | id channel, що належать цьому Plugin. Використовується для виявлення та валідації конфігурації.                                                                                                                                 |
| `providers`                          | Ні          | `string[]`                       | id provider, що належать цьому Plugin.                                                                                                                                                                                            |
| `providerDiscoveryEntry`             | Ні          | `string`                         | Шлях до легковагового модуля виявлення provider, відносний до кореня Plugin, для метаданих каталогу provider в межах маніфесту, які можна завантажити без активації повного середовища виконання Plugin.                      |
| `modelSupport`                       | Ні          | `object`                         | Скорочені метадані сімейства моделей, що належать маніфесту та використовуються для автоматичного завантаження Plugin до запуску середовища виконання.                                                                           |
| `providerEndpoints`                  | Ні          | `object[]`                       | Метадані host/baseUrl кінцевих точок, що належать маніфесту, для маршрутів provider, які ядро має класифікувати до завантаження середовища виконання provider.                                                                  |
| `cliBackends`                        | Ні          | `string[]`                       | id backend CLI, що належать цьому Plugin. Використовується для автоматичної активації під час запуску з явних посилань у конфігурації.                                                                                          |
| `syntheticAuthRefs`                  | Ні          | `string[]`                       | Посилання provider або backend CLI, для яких слід перевіряти синтетичний hook автентифікації, що належить Plugin, під час холодного виявлення моделей до завантаження середовища виконання.                                     |
| `nonSecretAuthMarkers`               | Ні          | `string[]`                       | Значення-заповнювачі API key, що належать bundle Plugin і представляють не секретний локальний стан, OAuth або ambient credential state.                                                                                         |
| `commandAliases`                     | Ні          | `object[]`                       | Назви команд, що належать цьому Plugin і мають формувати діагностику конфігурації та CLI з урахуванням Plugin до завантаження середовища виконання.                                                                             |
| `providerAuthEnvVars`                | Ні          | `Record<string, string[]>`       | Легковагові env-метадані автентифікації provider, які OpenClaw може перевіряти без завантаження коду Plugin.                                                                                                                   |
| `providerAuthAliases`                | Ні          | `Record<string, string>`         | id provider, які мають повторно використовувати id іншого provider для пошуку автентифікації, наприклад provider для кодування, який спільно використовує API key базового provider і профілі автентифікації.                 |
| `channelEnvVars`                     | Ні          | `Record<string, string[]>`       | Легковагові env-метадані channel, які OpenClaw може перевіряти без завантаження коду Plugin. Використовуйте це для setup channel на основі env або поверхонь автентифікації, які мають бачити узагальнені допоміжні засоби запуску/конфігурації. |
| `providerAuthChoices`                | Ні          | `object[]`                       | Легковагові метадані варіантів автентифікації для picker під час онбордингу, визначення пріоритетного provider і простого зв’язування прапорців CLI.                                                                            |
| `activation`                         | Ні          | `object`                         | Легковагові метадані планувальника активації для завантаження за provider, командою, channel, маршрутом і можливістю. Лише метадані; фактична поведінка, як і раніше, належить середовищу виконання Plugin.                    |
| `setup`                              | Ні          | `object`                         | Легковагові дескриптори setup/онбордингу, які поверхні виявлення та setup можуть перевіряти без завантаження середовища виконання Plugin.                                                                                       |
| `qaRunners`                          | Ні          | `object[]`                       | Легковагові дескриптори QA runner, які використовуються спільним хостом `openclaw qa` до завантаження середовища виконання Plugin.                                                                                              |
| `contracts`                          | Ні          | `object`                         | Статичний знімок bundle capability для зовнішніх hook автентифікації, speech, realtime transcription, realtime voice, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search і володіння tool. |
| `mediaUnderstandingProviderMetadata` | Ні          | `Record<string, object>`         | Легковагові значення за замовчуванням media-understanding для id provider, оголошених у `contracts.mediaUnderstandingProviders`.                                                                                                |
| `channelConfigs`                     | Ні          | `Record<string, object>`         | Метадані конфігурації channel, що належать маніфесту та об’єднуються з поверхнями виявлення й валідації до завантаження середовища виконання.                                                                                   |
| `skills`                             | Ні          | `string[]`                       | Каталоги Skills для завантаження, відносні до кореня Plugin.                                                                                                                                                                     |
| `name`                               | Ні          | `string`                         | Зрозуміла людині назва Plugin.                                                                                                                                                                                                    |
| `description`                        | Ні          | `string`                         | Короткий опис, що показується на поверхнях Plugin.                                                                                                                                                                               |
| `version`                            | Ні          | `string`                         | Інформаційна версія Plugin.                                                                                                                                                                                                       |
| `uiHints`                            | Ні          | `Record<string, object>`         | Мітки UI, placeholders і підказки щодо чутливості для полів конфігурації.                                                                                                                                                        |

## Довідник `providerAuthChoices`

Кожен запис `providerAuthChoices` описує один варіант онбордингу або автентифікації.
OpenClaw зчитує це до завантаження середовища виконання provider.

| Поле                  | Обов’язкове | Тип                                             | Що воно означає                                                                                          |
| --------------------- | ----------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | Так         | `string`                                        | id provider, до якого належить цей варіант.                                                              |
| `method`              | Так         | `string`                                        | id методу автентифікації, до якого слід спрямувати.                                                      |
| `choiceId`            | Так         | `string`                                        | Стабільний id варіанта автентифікації, який використовується під час онбордингу та в потоках CLI.       |
| `choiceLabel`         | Ні          | `string`                                        | Мітка для користувача. Якщо не вказано, OpenClaw використовує `choiceId`.                                |
| `choiceHint`          | Ні          | `string`                                        | Короткий допоміжний текст для picker.                                                                    |
| `assistantPriority`   | Ні          | `number`                                        | Менші значення сортуються раніше в інтерактивних picker, керованих асистентом.                          |
| `assistantVisibility` | Ні          | `"visible"` \| `"manual-only"`                  | Приховує варіант із picker асистента, але все одно дозволяє ручний вибір через CLI.                     |
| `deprecatedChoiceIds` | Ні          | `string[]`                                      | Застарілі id варіантів, які мають перенаправляти користувачів на цей варіант-заміну.                    |
| `groupId`             | Ні          | `string`                                        | Необов’язковий id групи для групування пов’язаних варіантів.                                             |
| `groupLabel`          | Ні          | `string`                                        | Мітка для користувача для цієї групи.                                                                    |
| `groupHint`           | Ні          | `string`                                        | Короткий допоміжний текст для групи.                                                                     |
| `optionKey`           | Ні          | `string`                                        | Внутрішній ключ опції для простих потоків автентифікації з одним прапорцем.                             |
| `cliFlag`             | Ні          | `string`                                        | Назва прапорця CLI, наприклад `--openrouter-api-key`.                                                    |
| `cliOption`           | Ні          | `string`                                        | Повна форма опції CLI, наприклад `--openrouter-api-key <key>`.                                           |
| `cliDescription`      | Ні          | `string`                                        | Опис, що використовується в довідці CLI.                                                                 |
| `onboardingScopes`    | Ні          | `Array<"text-inference" \| "image-generation">` | На яких поверхнях онбордингу має з’являтися цей варіант. Якщо не вказано, за замовчуванням це `["text-inference"]`. |

## Довідник `commandAliases`

Використовуйте `commandAliases`, коли Plugin володіє назвою команди середовища виконання, яку користувачі можуть
помилково додати до `plugins.allow` або спробувати виконати як кореневу команду CLI. OpenClaw
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

| Поле         | Обов’язкове | Тип               | Що воно означає                                                         |
| ------------ | ----------- | ----------------- | ----------------------------------------------------------------------- |
| `name`       | Так         | `string`          | Назва команди, що належить цьому Plugin.                                |
| `kind`       | Ні          | `"runtime-slash"` | Позначає псевдонім як slash-команду чату, а не кореневу команду CLI.    |
| `cliCommand` | Ні          | `string`          | Пов’язана коренева команда CLI, яку слід запропонувати для CLI-операцій, якщо така існує. |

## Довідник `activation`

Використовуйте `activation`, коли Plugin може дешево оголосити, які події control plane
мають включати його до плану активації/завантаження.

Цей блок є метаданими планувальника, а не API життєвого циклу. Він не реєструє
поведінку під час виконання, не замінює `register(...)` і не гарантує, що
код Plugin уже був виконаний. Планувальник активації використовує ці поля для
звуження набору кандидатів Plugin, перш ніж повертатися до наявних
метаданих володіння з маніфесту, таких як `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` і hooks.

Надавайте перевагу найвужчим метаданим, які вже описують володіння. Використовуйте
`providers`, `channels`, `commandAliases`, дескриптори setup або `contracts`,
коли ці поля виражають зв’язок. Використовуйте `activation` для додаткових підказок планувальника,
які не можна представити через ці поля володіння.

Цей блок — лише метадані. Він не реєструє поведінку під час виконання та не
замінює `register(...)`, `setupEntry` або інші точки входу середовища виконання/Plugin.
Поточні споживачі використовують його як підказку для звуження перед ширшим завантаженням Plugin, тому
відсутність метаданих активації зазвичай лише впливає на продуктивність; це не повинно
змінювати коректність, доки ще існують застарілі fallback-механізми володіння в маніфесті.

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

| Поле             | Обов’язкове | Тип                                                  | Що воно означає                                                                                         |
| ---------------- | ----------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `onProviders`    | Ні          | `string[]`                                           | id provider, які мають включати цей Plugin до планів активації/завантаження.                            |
| `onCommands`     | Ні          | `string[]`                                           | id команд, які мають включати цей Plugin до планів активації/завантаження.                              |
| `onChannels`     | Ні          | `string[]`                                           | id channel, які мають включати цей Plugin до планів активації/завантаження.                             |
| `onRoutes`       | Ні          | `string[]`                                           | Типи маршрутів, які мають включати цей Plugin до планів активації/завантаження.                         |
| `onCapabilities` | Ні          | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Загальні підказки щодо можливостей, які використовуються в плануванні активації control plane. За можливості надавайте перевагу вужчим полям. |

Поточні активні споживачі:

- планування CLI, ініційоване командою, повертається до застарілих
  `commandAliases[].cliCommand` або `commandAliases[].name`
- планування setup/channel, ініційоване channel, повертається до застарілого володіння `channels[]`,
  коли явні метадані активації channel відсутні
- планування setup/середовища виконання, ініційоване provider, повертається до застарілого
  володіння `providers[]` і верхньорівневого `cliBackends[]`, коли явні метадані активації provider
  відсутні

Діагностика планувальника може розрізняти явні підказки активації та fallback на
володіння з маніфесту. Наприклад, `activation-command-hint` означає, що
збіглося `activation.onCommands`, тоді як `manifest-command-alias` означає, що
планувальник натомість використав володіння `commandAliases`. Ці мітки причин призначені для
діагностики хоста та тестів; авторам Plugin слід і надалі оголошувати метадані,
які найкраще описують володіння.

## Довідник `qaRunners`

Використовуйте `qaRunners`, коли Plugin додає один або кілька transport runner під
спільним коренем `openclaw qa`. Зберігайте ці метадані легковаговими та статичними; фактичною
реєстрацією CLI, як і раніше, керує середовище виконання Plugin через легковагову
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

| Поле          | Обов’язкове | Тип      | Що воно означає                                                     |
| ------------- | ----------- | -------- | ------------------------------------------------------------------- |
| `commandName` | Так         | `string` | Підкоманда, змонтована під `openclaw qa`, наприклад `matrix`.       |
| `description` | Ні          | `string` | Резервний текст довідки, що використовується, коли спільному хосту потрібна stub-команда. |

## Довідник `setup`

Використовуйте `setup`, коли поверхням setup та онбордингу потрібні дешеві метадані, що належать Plugin,
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

Верхньорівневе `cliBackends` залишається валідним і надалі описує backend інференсу CLI.
`setup.cliBackends` — це поверхня дескрипторів, специфічна для setup, для
потоків control plane/setup, які мають залишатися лише метаданими.

Якщо присутні, `setup.providers` і `setup.cliBackends` є пріоритетною
поверхнею пошуку descriptor-first для виявлення setup. Якщо дескриптор лише
звужує candidate Plugin, а setup усе ще потребує багатших hook під час setup, встановіть `requiresRuntime: true` і залиште `setup-api` як
резервний шлях виконання.

Установлюйте `requiresRuntime: false` лише тоді, коли цих дескрипторів достатньо для
поверхні setup. OpenClaw трактує явне `false` як контракт лише на дескриптори
і не виконуватиме `setup-api` для пошуку setup. Пропущений `requiresRuntime`
зберігає застарілу fallback-поведінку, щоб наявні Plugin, які додали дескриптори
без цього прапорця, не зламалися.

Оскільки пошук setup може виконувати код `setup-api`, що належить Plugin, нормалізовані
значення `setup.providers[].id` і `setup.cliBackends[]` мають залишатися унікальними
серед виявлених Plugin. Неоднозначне володіння завершується безпечною відмовою, а не вибором
переможця за порядком виявлення.

Коли середовище виконання setup усе ж виконується, діагностика реєстру setup повідомляє про
розбіжність дескрипторів, якщо `setup-api` реєструє provider або backend CLI, які
не оголошені дескрипторами маніфесту, або якщо дескриптор не має відповідної
реєстрації під час виконання. Ця діагностика є додатковою і не відхиляє застарілі Plugin.

### Довідник `setup.providers`

| Поле          | Обов’язкове | Тип        | Що воно означає                                                                       |
| ------------- | ----------- | ---------- | ------------------------------------------------------------------------------------- |
| `id`          | Так         | `string`   | id provider, що надається під час setup або онбордингу. Зберігайте нормалізовані id глобально унікальними. |
| `authMethods` | Ні          | `string[]` | id методів setup/автентифікації, які цей provider підтримує без завантаження повного середовища виконання. |
| `envVars`     | Ні          | `string[]` | Env vars, які узагальнені поверхні setup/status можуть перевіряти до завантаження середовища виконання Plugin. |

### Поля `setup`

| Поле               | Обов’язкове | Тип        | Що воно означає                                                                                  |
| ------------------ | ----------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `providers`        | Ні          | `object[]` | Дескриптори setup provider, доступні під час setup та онбордингу.                                |
| `cliBackends`      | Ні          | `string[]` | id backend для setup, що використовуються для descriptor-first пошуку setup. Зберігайте нормалізовані id глобально унікальними. |
| `configMigrations` | Ні          | `string[]` | id міграцій конфігурації, що належать поверхні setup цього Plugin.                               |
| `requiresRuntime`  | Ні          | `boolean`  | Чи потребує setup виконання `setup-api` після пошуку за дескриптором.                            |

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

| Поле          | Тип        | Що воно означає                         |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Мітка поля для користувача.             |
| `help`        | `string`   | Короткий допоміжний текст.              |
| `tags`        | `string[]` | Необов’язкові теги UI.                  |
| `advanced`    | `boolean`  | Позначає поле як розширене.             |
| `sensitive`   | `boolean`  | Позначає поле як секретне або чутливе.  |
| `placeholder` | `string`   | Текст placeholder для полів форми.      |

## Довідник `contracts`

Використовуйте `contracts` лише для статичних метаданих володіння можливостями, які OpenClaw може
зчитати без імпорту середовища виконання Plugin.

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

| Поле                             | Тип        | Що воно означає                                                     |
| -------------------------------- | ---------- | ------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | id вбудованого середовища виконання, для яких bundle Plugin може реєструвати factory. |
| `externalAuthProviders`          | `string[]` | id provider, чий зовнішній hook профілю автентифікації належить цьому Plugin. |
| `speechProviders`                | `string[]` | id provider мовлення, які належать цьому Plugin.                    |
| `realtimeTranscriptionProviders` | `string[]` | id provider транскрипції в реальному часі, які належать цьому Plugin. |
| `realtimeVoiceProviders`         | `string[]` | id provider голосу в реальному часі, які належать цьому Plugin.     |
| `memoryEmbeddingProviders`       | `string[]` | id provider embedding для пам’яті, які належать цьому Plugin.       |
| `mediaUnderstandingProviders`    | `string[]` | id provider media-understanding, які належать цьому Plugin.         |
| `imageGenerationProviders`       | `string[]` | id provider генерації зображень, які належать цьому Plugin.         |
| `videoGenerationProviders`       | `string[]` | id provider генерації відео, які належать цьому Plugin.             |
| `webFetchProviders`              | `string[]` | id provider web-fetch, які належать цьому Plugin.                   |
| `webSearchProviders`             | `string[]` | id provider web search, які належать цьому Plugin.                  |
| `tools`                          | `string[]` | Назви tool агента, які належать цьому Plugin для bundle-перевірок контрактів. |

Plugin provider, які реалізують `resolveExternalAuthProfiles`, повинні оголошувати
`contracts.externalAuthProviders`. Plugin без цього оголошення все ще працюють
через застарілий fallback-механізм сумісності, але він повільніший і
буде вилучений після вікна міграції.

Bundle Plugin provider embedding для пам’яті повинні оголошувати
`contracts.memoryEmbeddingProviders` для кожного id adapter, який вони надають, включно з
вбудованими adapter, такими як `local`. Автономні шляхи CLI використовують цей контракт маніфесту,
щоб завантажувати лише Plugin-власник до того, як повне середовище виконання Gateway
зареєструє provider.

## Довідник `mediaUnderstandingProviderMetadata`

Використовуйте `mediaUnderstandingProviderMetadata`, коли provider media-understanding має
моделі за замовчуванням, пріоритет fallback автоматичної автентифікації або нативну підтримку документів,
які потрібні узагальненим допоміжним засобам ядра до завантаження середовища виконання. Ключі також мають бути оголошені в
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

| Поле                   | Тип                                 | Що воно означає                                                          |
| ---------------------- | ----------------------------------- | ------------------------------------------------------------------------ |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Медіаможливості, які надає цей provider.                                 |
| `defaultModels`        | `Record<string, string>`            | Значення моделей за замовчуванням для можливостей, які використовуються, коли конфігурація не вказує модель. |
| `autoPriority`         | `Record<string, number>`            | Менші числа сортуються раніше для автоматичного fallback provider на основі облікових даних. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Нативні входи документів, які підтримує provider.                        |

## Довідник `channelConfigs`

Використовуйте `channelConfigs`, коли Plugin channel потребує дешевих метаданих конфігурації до
завантаження середовища виконання.

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

| Поле          | Тип                      | Що воно означає                                                                       |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema для `channels.<id>`. Обов’язкове для кожного оголошеного запису конфігурації channel. |
| `uiHints`     | `Record<string, object>` | Необов’язкові мітки UI/placeholders/підказки чутливості для цього розділу конфігурації channel. |
| `label`       | `string`                 | Мітка channel, що об’єднується з поверхнями picker та inspect, коли метадані середовища виконання ще не готові. |
| `description` | `string`                 | Короткий опис channel для поверхонь inspect і catalog.                                |
| `preferOver`  | `string[]`               | id застарілих або менш пріоритетних Plugin, які цей channel має випереджати на поверхнях вибору. |

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
- `modelPatterns` мають вищий пріоритет, ніж `modelPrefixes`
- якщо збігаються один небандлований Plugin і один bundle Plugin, перемагає небандлований
  Plugin
- решта неоднозначностей ігноруються, доки користувач або конфігурація не вкажуть provider

Поля:

| Поле            | Тип        | Що воно означає                                                               |
| --------------- | ---------- | ----------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Префікси, які зіставляються через `startsWith` зі скороченими id моделей.    |
| `modelPatterns` | `string[]` | Джерела regex, які зіставляються зі скороченими id моделей після видалення суфікса профілю. |

Застарілі ключі можливостей верхнього рівня є deprecated. Використовуйте `openclaw doctor --fix`, щоб
перемістити `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` і `webSearchProviders` під `contracts`; звичайне
завантаження маніфесту більше не трактує ці поля верхнього рівня як
володіння можливостями.

## Маніфест і `package.json`

Ці два файли виконують різні завдання:

| Файл                   | Для чого використовувати                                                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Виявлення, валідація конфігурації, метадані варіантів автентифікації та підказки UI, які мають існувати до запуску коду Plugin |
| `package.json`         | Метадані npm, встановлення залежностей і блок `openclaw`, що використовується для точок входу, обмеження встановлення, setup або метаданих catalog |

Якщо ви не впевнені, де має належати певний фрагмент метаданих, використовуйте таке правило:

- якщо OpenClaw має знати це до завантаження коду Plugin, помістіть це в `openclaw.plugin.json`
- якщо це стосується пакування, файлів входу або поведінки встановлення npm, помістіть це в `package.json`

### Поля `package.json`, які впливають на виявлення

Деякі метадані Plugin до запуску середовища виконання навмисно зберігаються в `package.json` у блоці
`openclaw`, а не в `openclaw.plugin.json`.

Важливі приклади:

| Поле                                                              | Що воно означає                                                                                                                                                                      |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | Оголошує точки входу нативного Plugin. Має залишатися в межах каталогу пакета Plugin.                                                                                               |
| `openclaw.runtimeExtensions`                                      | Оголошує точки входу built JavaScript runtime для встановлених пакетів. Має залишатися в межах каталогу пакета Plugin.                                                              |
| `openclaw.setupEntry`                                             | Легковагова точка входу лише для setup, що використовується під час онбордингу, відкладеного запуску channel і виявлення статусу channel/SecretRef у режимі лише читання. Має залишатися в межах каталогу пакета Plugin. |
| `openclaw.runtimeSetupEntry`                                      | Оголошує built JavaScript точку входу setup для встановлених пакетів. Має залишатися в межах каталогу пакета Plugin.                                                                |
| `openclaw.channel`                                                | Легковагові метадані catalog channel, такі як мітки, шляхи до документації, псевдоніми та текст для вибору.                                                                         |
| `openclaw.channel.configuredState`                                | Легковагові метадані перевірки configured-state, які можуть відповісти на запитання «чи вже існує setup лише через env?» без завантаження повного середовища виконання channel.     |
| `openclaw.channel.persistedAuthState`                             | Легковагові метадані перевірки persisted-auth, які можуть відповісти на запитання «чи вже є хтось увійшов у систему?» без завантаження повного середовища виконання channel.         |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Підказки встановлення/оновлення для bundle Plugin і Plugin, опублікованих зовні.                                                                                                    |
| `openclaw.install.defaultChoice`                                  | Бажаний шлях встановлення, коли доступно кілька джерел встановлення.                                                                                                                 |
| `openclaw.install.minHostVersion`                                 | Мінімальна підтримувана версія хоста OpenClaw із використанням нижньої межі semver, наприклад `>=2026.3.22`.                                                                       |
| `openclaw.install.expectedIntegrity`                              | Очікуваний рядок integrity npm dist, наприклад `sha512-...`; потоки встановлення й оновлення перевіряють отриманий артефакт за ним.                                                 |
| `openclaw.install.allowInvalidConfigRecovery`                     | Дозволяє вузький шлях відновлення через перевстановлення bundle Plugin, коли конфігурація невалідна.                                                                                |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Дозволяє поверхням channel лише для setup завантажуватися до повного Plugin channel під час запуску.                                                                                |

Метадані маніфесту визначають, які варіанти provider/channel/setup з’являються в
онбордингу до завантаження середовища виконання. `package.json#openclaw.install` повідомляє
онбордингу, як отримати або ввімкнути цей Plugin, коли користувач вибирає один із цих
варіантів. Не переносіть підказки встановлення в `openclaw.plugin.json`.

`openclaw.install.minHostVersion` застосовується під час встановлення та завантаження
реєстру маніфестів. Невалідні значення відхиляються; новіші, але валідні значення пропускають
Plugin на старіших хостах.

Точне закріплення версії npm уже міститься в `npmSpec`, наприклад
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Офіційні записи зовнішнього catalog
повинні поєднувати точні специфікації з `expectedIntegrity`, щоб потоки оновлення завершувалися
безпечним відхиленням, якщо отриманий npm-артефакт більше не відповідає закріпленому релізу.
Інтерактивний онбординг, як і раніше, пропонує npm-специфікації довіреного реєстру, включно з
простими назвами пакетів і dist-tag, для сумісності. Діагностика catalog може
розрізняти точні, плаваючі, закріплені integrity, без integrity, із невідповідністю
назви пакета та з невалідним default-choice джерела. Вона також попереджає, коли
`expectedIntegrity` присутній, але немає валідного джерела npm, яке можна ним закріпити.
Коли `expectedIntegrity` присутній,
потоки встановлення/оновлення застосовують його; коли його пропущено, розв’язання реєстру
фіксується без закріплення integrity.

Plugin channel мають надавати `openclaw.setupEntry`, коли статус, список channel
або сканування SecretRef мають ідентифікувати налаштовані облікові записи без завантаження повного
середовища виконання. Точка входу setup має надавати метадані channel разом із безпечними для setup adapter
конфігурації, статусу та секретів; мережеві клієнти, слухачі Gateway і
транспортні середовища виконання залишайте в основній точці входу розширення.

Поля точки входу runtime не скасовують перевірки меж пакета для полів
вихідної точки входу. Наприклад, `openclaw.runtimeExtensions` не може зробити
завантажуваним шлях `openclaw.extensions`, що виходить за межі.

`openclaw.install.allowInvalidConfigRecovery` навмисно є вузьким. Воно не
робить довільні зламані конфігурації придатними до встановлення. Сьогодні воно лише дозволяє
потокам встановлення відновлюватися після певних застарілих збоїв оновлення bundle Plugin,
таких як відсутній шлях bundle Plugin або застарілий запис `channels.<id>` для того самого
bundle Plugin. Непов’язані помилки конфігурації, як і раніше, блокують встановлення та спрямовують операторів
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

Використовуйте це, коли потокам setup, doctor або configured-state потрібна дешева перевірка
автентифікації у форматі так/ні до завантаження повного Plugin channel. Цільовий export має бути невеликою
функцією, яка читає лише persisted state; не спрямовуйте її через повний barrel
середовища виконання channel.

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

Використовуйте це, коли channel може визначити configured-state через env або інші невеликі
вхідні дані без середовища виконання. Якщо перевірка потребує повного розв’язання конфігурації або реального
середовища виконання channel, натомість залиште цю логіку в hook `config.hasConfiguredState`
Plugin.

## Пріоритет виявлення (дубльовані id Plugin)

OpenClaw виявляє Plugin із кількох коренів (bundle, global install, workspace, явні шляхи, вибрані конфігурацією). Якщо два знайдені Plugin мають однаковий `id`, зберігається лише маніфест із **найвищим пріоритетом**; дублікати з нижчим пріоритетом відкидаються замість завантаження поруч із ним.

Пріоритет, від найвищого до найнижчого:

1. **Config-selected** — шлях, явно закріплений у `plugins.entries.<id>`
2. **Bundled** — Plugin, що постачаються разом з OpenClaw
3. **Global install** — Plugin, установлені в глобальний корінь Plugin OpenClaw
4. **Workspace** — Plugin, виявлені відносно поточного workspace

Наслідки:

- Форкована або застаріла копія bundle Plugin у workspace не перекриє bundle-збірку.
- Щоб справді перевизначити bundle Plugin локальним, закріпіть його через `plugins.entries.<id>`, щоб він переміг за пріоритетом, а не покладайтеся на виявлення у workspace.
- Відкидання дублікатів журналюється, щоб Doctor і діагностика запуску могли вказати на відкинуту копію.

## Вимоги до JSON Schema

- **Кожен Plugin повинен містити JSON Schema**, навіть якщо він не приймає конфігурацію.
- Порожня схема допустима (наприклад, `{ "type": "object", "additionalProperties": false }`).
- Схеми перевіряються під час читання/запису конфігурації, а не під час виконання.

## Поведінка валідації

- Невідомі ключі `channels.*` — це **помилки**, якщо тільки id channel не оголошено
  в маніфесті Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` і `plugins.slots.*`
  повинні посилатися на **виявлювані** id Plugin. Невідомі id — це **помилки**.
- Якщо Plugin установлено, але він має зламаний або відсутній маніфест чи схему,
  валідація завершується помилкою, а Doctor повідомляє про помилку Plugin.
- Якщо конфігурація Plugin існує, але Plugin **вимкнено**, конфігурація зберігається, і
  у Doctor + журналах показується **попередження**.

Дивіться [Configuration reference](/uk/gateway/configuration) для повної схеми `plugins.*`.

## Примітки

- Маніфест **обов’язковий для нативних Plugin OpenClaw**, включно із завантаженням із локальної файлової системи. Середовище виконання, як і раніше, завантажує модуль Plugin окремо; маніфест використовується лише для виявлення + валідації.
- Нативні маніфести розбираються за допомогою JSON5, тому коментарі, кінцеві коми та ключі без лапок допускаються, якщо кінцеве значення все одно є об’єктом.
- Завантажувач маніфесту читає лише задокументовані поля маніфесту. Уникайте користувацьких ключів верхнього рівня.
- `channels`, `providers`, `cliBackends` і `skills` можна не вказувати, якщо Plugin їх не потребує.
- `providerDiscoveryEntry` має залишатися легковаговим і не повинен імпортувати широке середовище виконання; використовуйте його для статичних метаданих catalog provider або вузьких дескрипторів виявлення, а не для виконання під час запиту.
- Ексклюзивні типи Plugin вибираються через `plugins.slots.*`: `kind: "memory"` через `plugins.slots.memory`, `kind: "context-engine"` через `plugins.slots.contextEngine` (типово `legacy`).
- Env-метадані (`providerAuthEnvVars`, `channelEnvVars`) є лише декларативними. Статус, аудит, валідація доставлення Cron та інші поверхні лише для читання, як і раніше, застосовують політику довіри до Plugin та ефективної активації, перш ніж вважати env var налаштованою.
- Для метаданих wizard під час виконання, які потребують коду provider, дивіться [Provider runtime hooks](/uk/plugins/architecture-internals#provider-runtime-hooks).
- Якщо ваш Plugin залежить від нативних модулів, задокументуйте кроки збірки та будь-які вимоги до allowlist менеджера пакетів (наприклад, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Пов’язане

<CardGroup cols={3}>
  <Card title="Створення Plugin" href="/uk/plugins/building-plugins" icon="rocket">
    Початок роботи з Plugin.
  </Card>
  <Card title="Архітектура Plugin" href="/uk/plugins/architecture" icon="diagram-project">
    Внутрішня архітектура та модель можливостей.
  </Card>
  <Card title="Огляд SDK" href="/uk/plugins/sdk-overview" icon="book">
    Довідник SDK Plugin та імпорти підшляхів.
  </Card>
</CardGroup>
