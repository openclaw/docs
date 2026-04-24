---
read_when:
    - Ви створюєте Plugin для OpenClaw
    - Вам потрібно постачати schema конфігурації Plugin або налагоджувати помилки валідації Plugin
summary: Маніфест Plugin + вимоги до JSON schema (сувора валідація конфігурації)
title: Маніфест Plugin
x-i18n:
    generated_at: "2026-04-24T18:12:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9118ed34fc7bb8923aff6b7f0ac795a1d637d255ef5f6ce0b37293e9a3812253
    source_path: plugins/manifest.md
    workflow: 15
---

Ця сторінка стосується лише **нативного маніфесту Plugin OpenClaw**.

Сумісні макети bundle див. у [Plugin bundles](/uk/plugins/bundles).

Сумісні формати bundle використовують інші файли маніфесту:

- Codex bundle: `.codex-plugin/plugin.json`
- Claude bundle: `.claude-plugin/plugin.json` або типовий макет компонента Claude
  без маніфесту
- Cursor bundle: `.cursor-plugin/plugin.json`

OpenClaw також автоматично визначає ці макети bundle, але вони не проходять валідацію
за schema `openclaw.plugin.json`, описаною тут.

Для сумісних bundle OpenClaw наразі читає метадані bundle плюс оголошені
корені Skills, корені команд Claude, типові значення `settings.json` bundle Claude,
типові значення LSP bundle Claude та підтримувані пакети hook, коли макет відповідає
очікуванням runtime OpenClaw.

Кожен нативний Plugin OpenClaw **повинен** постачатися з файлом `openclaw.plugin.json` у
**корені Plugin**. OpenClaw використовує цей маніфест для валідації конфігурації
**без виконання коду Plugin**. Відсутні або невалідні маніфести вважаються
помилками Plugin і блокують валідацію конфігурації.

Повний посібник по системі Plugin див.: [Plugins](/uk/tools/plugin).
Для нативної моделі можливостей і поточних рекомендацій щодо зовнішньої сумісності:
[Модель можливостей](/uk/plugins/architecture#public-capability-model).

## Що робить цей файл

`openclaw.plugin.json` — це метадані, які OpenClaw читає **до завантаження коду
вашого Plugin**. Усе нижче має бути достатньо недорогим для перевірки без запуску
runtime Plugin.

**Використовуйте його для:**

- ідентичності Plugin, валідації конфігурації та підказок для UI конфігурації
- метаданих auth, onboarding і налаштування (alias, auto-enable, env vars провайдера, варіанти auth)
- підказок активації для поверхонь control-plane
- володіння скороченими сімействами моделей
- статичних знімків володіння можливостями (`contracts`)
- метаданих QA runner, які може перевіряти спільний хост `openclaw qa`
- метаданих конфігурації, специфічних для каналу, які об’єднуються в surfaces каталогу та валідації

**Не використовуйте його для:** реєстрації поведінки runtime, оголошення code entrypoints,
або метаданих встановлення npm. Це належить до коду вашого Plugin і `package.json`.

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
  "description": "Plugin провайдера OpenRouter",
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
      "choiceLabel": "Ключ API OpenRouter",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "Ключ API OpenRouter",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "Ключ API",
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

## Довідка щодо полів верхнього рівня

| Field                                | Required | Type                             | What it means                                                                                                                                                                                                                     |
| ------------------------------------ | -------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Так      | `string`                         | Канонічний id Plugin. Саме цей id використовується в `plugins.entries.<id>`.                                                                                                                                                     |
| `configSchema`                       | Так      | `object`                         | Вбудована JSON Schema для конфігурації цього Plugin.                                                                                                                                                                              |
| `enabledByDefault`                   | Ні       | `true`                           | Позначає вбудований Plugin як увімкнений за замовчуванням. Опустіть це поле або встановіть будь-яке значення, відмінне від `true`, щоб Plugin лишався вимкненим за замовчуванням.                                             |
| `legacyPluginIds`                    | Ні       | `string[]`                       | Застарілі id, які нормалізуються до цього канонічного id Plugin.                                                                                                                                                                  |
| `autoEnableWhenConfiguredProviders`  | Ні       | `string[]`                       | Id провайдерів, які мають автоматично вмикати цей Plugin, коли auth, конфігурація або посилання на моделі згадують їх.                                                                                                          |
| `kind`                               | Ні       | `"memory"` \| `"context-engine"` | Оголошує ексклюзивний тип Plugin, який використовується `plugins.slots.*`.                                                                                                                                                       |
| `channels`                           | Ні       | `string[]`                       | Id каналів, якими володіє цей Plugin. Використовується для виявлення та валідації конфігурації.                                                                                                                                  |
| `providers`                          | Ні       | `string[]`                       | Id провайдерів, якими володіє цей Plugin.                                                                                                                                                                                         |
| `providerDiscoveryEntry`             | Ні       | `string`                         | Шлях до легковагового модуля виявлення провайдера, відносний до кореня Plugin, для метаданих каталогу провайдера в межах маніфесту, які можна завантажити без активації повного runtime Plugin.                               |
| `modelSupport`                       | Ні       | `object`                         | Керовані маніфестом метадані скорочених сімейств моделей, які використовуються для автозавантаження Plugin до запуску runtime.                                                                                                  |
| `providerEndpoints`                  | Ні       | `object[]`                       | Керовані маніфестом метадані host/baseUrl endpoint-ів для маршрутів провайдера, які core має класифікувати до завантаження runtime провайдера.                                                                                  |
| `cliBackends`                        | Ні       | `string[]`                       | Id CLI backend-ів інференсу, якими володіє цей Plugin. Використовується для автоактивації під час запуску з явних посилань у конфігурації.                                                                                      |
| `syntheticAuthRefs`                  | Ні       | `string[]`                       | Посилання на провайдер або CLI backend, для яких слід перевіряти synthetic auth hook, що належить Plugin, під час cold discovery моделей до завантаження runtime.                                                              |
| `nonSecretAuthMarkers`               | Ні       | `string[]`                       | Значення-заповнювачі API key, що належать вбудованому Plugin і представляють несекретний локальний, OAuth або ambient-стан облікових даних.                                                                                    |
| `commandAliases`                     | Ні       | `object[]`                       | Імена команд, якими володіє цей Plugin і які мають створювати обізнану щодо Plugin діагностику конфігурації та CLI до завантаження runtime.                                                                                    |
| `providerAuthEnvVars`                | Ні       | `Record<string, string[]>`       | Недорогі метадані env для auth провайдера, які OpenClaw може перевіряти без завантаження коду Plugin.                                                                                                                           |
| `providerAuthAliases`                | Ні       | `Record<string, string>`         | Id провайдерів, які мають повторно використовувати id іншого провайдера для пошуку auth, наприклад provider coding, що використовує спільний API key і профілі auth базового провайдера.                                       |
| `channelEnvVars`                     | Ні       | `Record<string, string[]>`       | Недорогі метадані env каналу, які OpenClaw може перевіряти без завантаження коду Plugin. Використовуйте це для налаштування каналу через env або поверхонь auth, які мають бачити узагальнені helper-и запуску/конфігурації. |
| `providerAuthChoices`                | Ні       | `object[]`                       | Недорогі метадані варіантів auth для picker-ів onboarding, визначення бажаного провайдера та простого зв’язування CLI flags.                                                                                                   |
| `activation`                         | Ні       | `object`                         | Недорогі метадані планувальника активації для завантаження, що запускається провайдером, командою, каналом, маршрутом або можливістю. Лише метадані; фактичною поведінкою все одно володіє runtime Plugin.                    |
| `setup`                              | Ні       | `object`                         | Недорогі дескриптори setup/onboarding, які поверхні виявлення та налаштування можуть перевіряти без завантаження runtime Plugin.                                                                                                |
| `qaRunners`                          | Ні       | `object[]`                       | Недорогі дескриптори QA runner-ів, які спільний хост `openclaw qa` використовує до завантаження runtime Plugin.                                                                                                                 |
| `contracts`                          | Ні       | `object`                         | Статичний знімок можливостей вбудованого Plugin для зовнішніх auth hook-ів, speech, realtime transcription, realtime voice, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search і володіння інструментами. |
| `mediaUnderstandingProviderMetadata` | Ні       | `Record<string, object>`         | Недорогі типові значення media-understanding для id провайдерів, оголошених у `contracts.mediaUnderstandingProviders`.                                                                                                          |
| `channelConfigs`                     | Ні       | `Record<string, object>`         | Керовані маніфестом метадані конфігурації каналу, які об’єднуються в поверхнях виявлення й валідації до завантаження runtime.                                                                                                  |
| `skills`                             | Ні       | `string[]`                       | Каталоги Skills для завантаження, відносні до кореня Plugin.                                                                                                                                                                      |
| `name`                               | Ні       | `string`                         | Людинозрозуміла назва Plugin.                                                                                                                                                                                                     |
| `description`                        | Ні       | `string`                         | Короткий опис, що показується в поверхнях Plugin.                                                                                                                                                                                 |
| `version`                            | Ні       | `string`                         | Інформаційна версія Plugin.                                                                                                                                                                                                       |
| `uiHints`                            | Ні       | `Record<string, object>`         | Мітки UI, placeholders і підказки щодо чутливості для полів конфігурації.                                                                                                                                                        |

## Довідка щодо `providerAuthChoices`

Кожен запис `providerAuthChoices` описує один варіант onboarding або auth.
OpenClaw читає це до завантаження runtime провайдера.

| Field                 | Required | Type                                            | What it means                                                                                            |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | Так      | `string`                                        | Id провайдера, до якого належить цей варіант.                                                           |
| `method`              | Так      | `string`                                        | Id методу auth, до якого треба диспетчеризувати.                                                        |
| `choiceId`            | Так      | `string`                                        | Стабільний id варіанта auth, який використовується в onboarding і CLI-сценаріях.                       |
| `choiceLabel`         | Ні       | `string`                                        | Мітка для користувача. Якщо не вказано, OpenClaw використовує `choiceId`.                              |
| `choiceHint`          | Ні       | `string`                                        | Короткий допоміжний текст для picker.                                                                   |
| `assistantPriority`   | Ні       | `number`                                        | Менші значення сортуються раніше в інтерактивних picker-ах, керованих асистентом.                      |
| `assistantVisibility` | Ні       | `"visible"` \| `"manual-only"`                  | Приховує варіант із picker-ів асистента, але все ще дозволяє ручний вибір через CLI.                  |
| `deprecatedChoiceIds` | Ні       | `string[]`                                      | Застарілі id варіантів, які мають перенаправляти користувачів до цього варіанта-заміни.               |
| `groupId`             | Ні       | `string`                                        | Необов’язковий id групи для групування пов’язаних варіантів.                                           |
| `groupLabel`          | Ні       | `string`                                        | Мітка цієї групи для користувача.                                                                       |
| `groupHint`           | Ні       | `string`                                        | Короткий допоміжний текст для групи.                                                                    |
| `optionKey`           | Ні       | `string`                                        | Внутрішній ключ опції для простих auth-сценаріїв із одним прапорцем.                                   |
| `cliFlag`             | Ні       | `string`                                        | Назва CLI-прапорця, наприклад `--openrouter-api-key`.                                                  |
| `cliOption`           | Ні       | `string`                                        | Повна форма CLI-опції, наприклад `--openrouter-api-key <key>`.                                         |
| `cliDescription`      | Ні       | `string`                                        | Опис, що використовується в довідці CLI.                                                                |
| `onboardingScopes`    | Ні       | `Array<"text-inference" \| "image-generation">` | У яких поверхнях onboarding має з’являтися цей варіант. Якщо не вказано, типово використовується `["text-inference"]`. |

## Довідка щодо `commandAliases`

Використовуйте `commandAliases`, коли Plugin володіє назвою runtime-команди, яку користувачі можуть
помилково додати в `plugins.allow` або спробувати запустити як кореневу CLI-команду. OpenClaw
використовує ці метадані для діагностики без імпорту коду runtime Plugin.

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

| Field        | Required | Type              | What it means                                                           |
| ------------ | -------- | ----------------- | ----------------------------------------------------------------------- |
| `name`       | Так      | `string`          | Назва команди, яка належить цьому Plugin.                               |
| `kind`       | Ні       | `"runtime-slash"` | Позначає alias як slash-команду чату, а не кореневу CLI-команду.        |
| `cliCommand` | Ні       | `string`          | Пов’язана коренева CLI-команда, яку слід пропонувати для CLI-операцій, якщо вона існує. |

## Довідка щодо `activation`

Використовуйте `activation`, коли Plugin може недорого оголосити, які події control-plane
мають включати його в план активації/завантаження.

Цей блок є метаданими планувальника, а не API життєвого циклу. Він не реєструє
поведінку runtime, не замінює `register(...)` і не гарантує, що
код Plugin уже виконувався. Планувальник активації використовує ці поля, щоб
звузити коло кандидатів Plugin, перш ніж переходити до наявних метаданих
володіння з маніфесту, таких як `providers`, `channels`, `commandAliases`,
`setup.providers`, `contracts.tools` і hook-и.

Надавайте перевагу найвужчим метаданим, які вже описують володіння. Використовуйте
`providers`, `channels`, `commandAliases`, дескриптори setup або `contracts`,
коли ці поля виражають зв’язок. Використовуйте `activation` для додаткових підказок планувальника, які не можна представити цими полями володіння.

Цей блок містить лише метадані. Він не реєструє поведінку runtime і не
замінює `register(...)`, `setupEntry` або інші entrypoint-и runtime/Plugin.
Поточні споживачі використовують його як підказку для звуження перед ширшим завантаженням Plugin, тому відсутність метаданих activation зазвичай впливає лише на продуктивність; вона не повинна
впливати на коректність, доки ще існують застарілі резервні механізми володіння з маніфесту.

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

| Field            | Required | Type                                                 | What it means                                                                                           |
| ---------------- | -------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `onProviders`    | Ні       | `string[]`                                           | Id провайдерів, які мають включати цей Plugin у плани активації/завантаження.                          |
| `onCommands`     | Ні       | `string[]`                                           | Id команд, які мають включати цей Plugin у плани активації/завантаження.                               |
| `onChannels`     | Ні       | `string[]`                                           | Id каналів, які мають включати цей Plugin у плани активації/завантаження.                              |
| `onRoutes`       | Ні       | `string[]`                                           | Типи маршрутів, які мають включати цей Plugin у плани активації/завантаження.                          |
| `onCapabilities` | Ні       | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Широкі підказки можливостей, що використовуються плануванням активації control-plane. Коли можливо, віддавайте перевагу вужчим полям. |

Поточні live-споживачі:

- планування CLI, що запускається командою, використовує резервний перехід до застарілих
  `commandAliases[].cliCommand` або `commandAliases[].name`
- планування setup/каналу, що запускається каналом, використовує резервний перехід до застарілого володіння `channels[]`, коли явні метадані активації каналу відсутні
- планування setup/runtime, що запускається провайдером, використовує резервний перехід до застарілого
  володіння `providers[]` і `cliBackends[]` верхнього рівня, коли явні метадані активації провайдера відсутні

Діагностика планувальника може відрізняти явні підказки activation від
резервного володіння з маніфесту. Наприклад, `activation-command-hint` означає, що
збіглося `activation.onCommands`, а `manifest-command-alias` означає, що
планувальник натомість використав володіння `commandAliases`. Ці мітки причин призначені для
діагностики хоста й тестів; авторам Plugin слід і далі оголошувати метадані,
які найкраще описують володіння.

## Довідка щодо `qaRunners`

Використовуйте `qaRunners`, коли Plugin додає один або більше transport runner-ів під
спільним коренем `openclaw qa`. Зберігайте ці метадані недорогими й статичними; фактичною
реєстрацією CLI все одно володіє runtime Plugin через легковагову surface
`runtime-api.ts`, яка експортує `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Запустити live QA lane Matrix на базі Docker проти тимчасового homeserver"
    }
  ]
}
```

| Field         | Required | Type     | What it means                                                      |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | Так      | `string` | Підкоманда, змонтована під `openclaw qa`, наприклад `matrix`.     |
| `description` | Ні       | `string` | Резервний текст довідки, який використовується, коли спільному хосту потрібна stub-команда. |

## Довідка щодо `setup`

Використовуйте `setup`, коли поверхням setup і onboarding потрібні недорогі метадані Plugin
до завантаження runtime.

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

`cliBackends` верхнього рівня лишається валідним і далі описує CLI backend-и
інференсу. `setup.cliBackends` — це surface дескрипторів, специфічна для setup,
для control-plane/setup-сценаріїв, які мають залишатися лише метаданими.

Коли вони присутні, `setup.providers` і `setup.cliBackends` є бажаною
surface пошуку setup за принципом descriptor-first для виявлення setup. Якщо дескриптор лише звужує коло кандидата Plugin, а setup усе ще потребує багатших runtime hook-ів на етапі setup, встановіть `requiresRuntime: true` і залиште `setup-api` як
резервний шлях виконання.

Встановлюйте `requiresRuntime: false` лише тоді, коли цих дескрипторів достатньо для
поверхні setup. OpenClaw трактує явне `false` як контракт лише на дескриптори
і не виконуватиме `setup-api` для пошуку setup. Якщо `requiresRuntime`
пропущено, зберігається застаріла резервна поведінка, щоб наявні Plugin, які додали дескриптори
без цього прапорця, не зламалися.

Оскільки пошук setup може виконувати код `setup-api`, що належить Plugin, нормалізовані
значення `setup.providers[].id` і `setup.cliBackends[]` мають залишатися глобально унікальними серед
виявлених Plugin. Неоднозначне володіння закривається в безпечний спосіб замість вибору
переможця за порядком виявлення.

### Довідка щодо `setup.providers`

| Field         | Required | Type       | What it means                                                                        |
| ------------- | -------- | ---------- | ------------------------------------------------------------------------------------ |
| `id`          | Так      | `string`   | Id провайдера, що показується під час setup або onboarding. Нормалізовані id мають бути глобально унікальними. |
| `authMethods` | Ні       | `string[]` | Id методів setup/auth, які цей провайдер підтримує без завантаження повного runtime. |
| `envVars`     | Ні       | `string[]` | Env vars, які узагальнені поверхні setup/status можуть перевіряти до завантаження runtime Plugin. |

### Поля `setup`

| Field              | Required | Type       | What it means                                                                                       |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | Ні       | `object[]` | Дескриптори setup провайдерів, що показуються під час setup та onboarding.                          |
| `cliBackends`      | Ні       | `string[]` | Id backend-ів на етапі setup, що використовуються для descriptor-first пошуку setup. Нормалізовані id мають залишатися глобально унікальними. |
| `configMigrations` | Ні       | `string[]` | Id міграцій конфігурації, якими володіє surface setup цього Plugin.                                 |
| `requiresRuntime`  | Ні       | `boolean`  | Чи потребує setup виконання `setup-api` після пошуку за дескриптором.                               |

## Довідка щодо `uiHints`

`uiHints` — це мапа від імен полів конфігурації до невеликих підказок рендерингу.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "Ключ API",
      "help": "Використовується для запитів OpenRouter",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

Кожна підказка поля може містити:

| Field         | Type       | What it means                           |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Мітка поля для користувача.             |
| `help`        | `string`   | Короткий допоміжний текст.              |
| `tags`        | `string[]` | Необов’язкові теги UI.                  |
| `advanced`    | `boolean`  | Позначає поле як розширене.             |
| `sensitive`   | `boolean`  | Позначає поле як секретне або чутливе.  |
| `placeholder` | `string`   | Текст placeholder для полів форми.      |

## Довідка щодо `contracts`

Використовуйте `contracts` лише для статичних метаданих володіння можливостями, які OpenClaw може
прочитати без імпорту runtime Plugin.

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

| Field                            | Type       | What it means                                                     |
| -------------------------------- | ---------- | ----------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Id вбудованого runtime, для яких вбудований Plugin може реєструвати factories. |
| `externalAuthProviders`          | `string[]` | Id провайдерів, чий hook зовнішнього auth profile належить цьому Plugin. |
| `speechProviders`                | `string[]` | Id провайдерів speech, якими володіє цей Plugin.                  |
| `realtimeTranscriptionProviders` | `string[]` | Id провайдерів realtime transcription, якими володіє цей Plugin.  |
| `realtimeVoiceProviders`         | `string[]` | Id провайдерів realtime voice, якими володіє цей Plugin.          |
| `memoryEmbeddingProviders`       | `string[]` | Id провайдерів memory embedding, якими володіє цей Plugin.        |
| `mediaUnderstandingProviders`    | `string[]` | Id провайдерів media-understanding, якими володіє цей Plugin.     |
| `imageGenerationProviders`       | `string[]` | Id провайдерів image-generation, якими володіє цей Plugin.        |
| `videoGenerationProviders`       | `string[]` | Id провайдерів video-generation, якими володіє цей Plugin.        |
| `webFetchProviders`              | `string[]` | Id провайдерів web-fetch, якими володіє цей Plugin.               |
| `webSearchProviders`             | `string[]` | Id провайдерів web search, якими володіє цей Plugin.              |
| `tools`                          | `string[]` | Імена інструментів агента, якими володіє цей Plugin, для перевірок контрактів вбудованих Plugin. |

Plugin провайдера, які реалізують `resolveExternalAuthProfiles`, мають оголошувати
`contracts.externalAuthProviders`. Plugin без цього оголошення все ще працюють
через застарілий резервний механізм сумісності, але цей механізм повільніший і
буде видалений після завершення вікна міграції.

Вбудовані провайдери memory embedding мають оголошувати
`contracts.memoryEmbeddingProviders` для кожного id адаптера, який вони надають, включно з
вбудованими адаптерами, такими як `local`. Окремі шляхи CLI використовують цей контракт
маніфесту, щоб завантажувати лише Plugin-власник до того, як повний runtime Gateway
зареєструє провайдерів.

## Довідка щодо `mediaUnderstandingProviderMetadata`

Використовуйте `mediaUnderstandingProviderMetadata`, коли провайдер media-understanding має
типові моделі, пріоритет резервного auto-auth або нативну підтримку документів, які
узагальненим helper-ам core потрібні до завантаження runtime. Ключі також мають бути оголошені в
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

| Field                  | Type                                | What it means                                                                |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Медіаможливості, які надає цей провайдер.                                    |
| `defaultModels`        | `Record<string, string>`            | Типові значення відповідності можливість→модель, що використовуються, коли в конфігурації не вказано модель. |
| `autoPriority`         | `Record<string, number>`            | Менші числа сортуються раніше для автоматичного резервного вибору провайдера на основі облікових даних. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Нативні формати документів, які підтримує провайдер.                         |

## Довідка щодо `channelConfigs`

Використовуйте `channelConfigs`, коли канальному Plugin потрібні недорогі метадані конфігурації
до завантаження runtime.

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
          "label": "URL homeserver",
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

Кожен запис каналу може містити:

| Field         | Type                     | What it means                                                                             |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema для `channels.<id>`. Обов’язкова для кожного оголошеного запису конфігурації каналу. |
| `uiHints`     | `Record<string, object>` | Необов’язкові мітки UI/placeholders/підказки чутливості для цього розділу конфігурації каналу. |
| `label`       | `string`                 | Мітка каналу, що об’єднується в surfaces picker та inspect, коли метадані runtime ще не готові. |
| `description` | `string`                 | Короткий опис каналу для surfaces inspect і catalog.                                      |
| `preferOver`  | `string[]`               | Id застарілих або менш пріоритетних Plugin, які цей канал має випереджати в surfaces вибору. |

## Довідка щодо `modelSupport`

Використовуйте `modelSupport`, коли OpenClaw має виводити ваш Plugin провайдера з
скорочених id моделей на кшталт `gpt-5.5` або `claude-sonnet-4.6` до завантаження runtime Plugin.

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
- `modelPatterns` мають пріоритет над `modelPrefixes`
- якщо збігаються один невбудований Plugin і один вбудований Plugin, перемагає невбудований
  Plugin
- решта неоднозначностей ігноруються, доки користувач або конфігурація не задасть провайдера

Поля:

| Field           | Type       | What it means                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Префікси, що зіставляються через `startsWith` зі скороченими id моделей.        |
| `modelPatterns` | `string[]` | Джерела regex, що зіставляються зі скороченими id моделей після видалення суфікса профілю. |

Застарілі ключі можливостей верхнього рівня є deprecated. Використовуйте `openclaw doctor --fix`, щоб
перемістити `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` і `webSearchProviders` до `contracts`; звичайне
завантаження маніфесту більше не трактує ці поля верхнього рівня як
володіння можливостями.

## Маніфест проти package.json

Ці два файли виконують різні завдання:

| File                   | Use it for                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Виявлення, валідація конфігурації, метадані варіантів auth і підказки UI, які мають існувати до запуску коду Plugin           |
| `package.json`         | Метадані npm, встановлення залежностей і блок `openclaw`, що використовується для entrypoints, обмежень встановлення, setup або метаданих каталогу |

Якщо ви не впевнені, куди має належати певний фрагмент метаданих, використовуйте таке правило:

- якщо OpenClaw повинен знати це до завантаження коду Plugin, розміщуйте це в `openclaw.plugin.json`
- якщо це стосується пакування, entry-файлів або поведінки встановлення npm, розміщуйте це в `package.json`

### Поля `package.json`, які впливають на виявлення

Деякі метадані Plugin до запуску runtime навмисно зберігаються в `package.json` у блоці
`openclaw`, а не в `openclaw.plugin.json`.

Важливі приклади:

| Field                                                             | What it means                                                                                                                                                                        |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | Оголошує native entrypoint-и Plugin. Вони мають залишатися всередині каталогу пакета Plugin.                                                                                        |
| `openclaw.runtimeExtensions`                                      | Оголошує entrypoint-и built JavaScript runtime для встановлених пакетів. Вони мають залишатися всередині каталогу пакета Plugin.                                                  |
| `openclaw.setupEntry`                                             | Легковаговий entrypoint лише для setup, який використовується під час onboarding, відкладеного запуску каналу та read-only виявлення channel status/SecretRef. Має залишатися всередині каталогу пакета Plugin. |
| `openclaw.runtimeSetupEntry`                                      | Оголошує built JavaScript entrypoint setup для встановлених пакетів. Має залишатися всередині каталогу пакета Plugin.                                                             |
| `openclaw.channel`                                                | Недорогі метадані каталогу каналу, такі як labels, шляхи до документації, alias-и та текст для вибору.                                                                             |
| `openclaw.channel.configuredState`                                | Недорогі метадані перевірки configured-state, які можуть відповісти на питання «чи вже існує налаштування лише через env?» без завантаження повного runtime каналу.              |
| `openclaw.channel.persistedAuthState`                             | Недорогі метадані перевірки persisted-auth, які можуть відповісти на питання «чи вже є якийсь активний вхід?» без завантаження повного runtime каналу.                           |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Підказки для встановлення/оновлення вбудованих і зовнішньо опублікованих Plugin.                                                                                                   |
| `openclaw.install.defaultChoice`                                  | Бажаний шлях встановлення, коли доступно кілька джерел встановлення.                                                                                                                |
| `openclaw.install.minHostVersion`                                 | Мінімальна підтримувана версія хоста OpenClaw із нижньою межею semver, наприклад `>=2026.3.22`.                                                                                   |
| `openclaw.install.expectedIntegrity`                              | Очікуваний рядок integrity для npm dist, наприклад `sha512-...`; сценарії встановлення й оновлення перевіряють отриманий артефакт щодо нього.                                     |
| `openclaw.install.allowInvalidConfigRecovery`                     | Дозволяє вузький шлях відновлення перевстановлення вбудованого Plugin, коли конфігурація невалідна.                                                                                |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Дає змогу поверхням каналу лише для setup завантажуватися до повного Plugin каналу під час запуску.                                                                                |

Метадані маніфесту визначають, які варіанти provider/channel/setup з’являються в
onboarding до завантаження runtime. `package.json#openclaw.install` повідомляє
onboarding, як отримати або ввімкнути цей Plugin, коли користувач вибирає один із цих
варіантів. Не переносіть підказки встановлення до `openclaw.plugin.json`.

`openclaw.install.minHostVersion` примусово застосовується під час встановлення та
завантаження реєстру маніфестів. Невалідні значення відхиляються; новіші, але валідні значення пропускають
Plugin на старіших хостах.

Точне закріплення версії npm уже міститься в `npmSpec`, наприклад
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Офіційні записи зовнішнього каталогу
мають поєднувати точні специфікації з `expectedIntegrity`, щоб сценарії оновлення завершувалися безпечно, якщо отриманий npm-артефакт більше не відповідає закріпленому релізу.
Інтерактивний onboarding усе ще пропонує довірені npm-специфікації реєстру, включно з простими назвами пакетів і dist-tag, для сумісності. Діагностика каталогу може
розрізняти точні, плаваючі, закріплені integrity, без integrity, з невідповідністю назви пакета та невалідні джерела default-choice. Вона також попереджає, коли
`expectedIntegrity` присутній, але немає валідного npm-джерела, яке можна ним закріпити.
Коли `expectedIntegrity` присутній,
сценарії встановлення/оновлення примусово його перевіряють; коли його пропущено, результат розв’язання реєстру
фіксується без закріплення integrity.

Канальні Plugin мають надавати `openclaw.setupEntry`, коли status, список каналів
або сканування SecretRef мають визначити налаштовані акаунти без завантаження повного
runtime. Entry setup має надавати метадані каналу плюс безпечні для setup адаптери конфігурації,
status і секретів; клієнти мережі, слухачі gateway і runtime транспорту слід залишати в основному entrypoint extension.

Поля entrypoint runtime не перевизначають перевірки меж пакета для полів
entrypoint вихідного коду. Наприклад, `openclaw.runtimeExtensions` не може зробити
завантажуваним шлях `openclaw.extensions`, що виходить за межі.

`openclaw.install.allowInvalidConfigRecovery` навмисно є вузьким. Воно не
робить довільні зламані конфігурації придатними до встановлення. Сьогодні воно дозволяє лише сценаріям встановлення відновлюватися після конкретних збоїв оновлення застарілих вбудованих Plugin, таких як
відсутній шлях до вбудованого Plugin або застарілий запис `channels.<id>` для того самого
вбудованого Plugin. Непов’язані помилки конфігурації, як і раніше, блокують встановлення і спрямовують операторів до `openclaw doctor --fix`.

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

Використовуйте це, коли сценаріям setup, doctor або configured-state потрібна недорога перевірка auth
типу так/ні до завантаження повного Plugin каналу. Цільовий export має бути невеликою
функцією, яка лише читає збережений стан; не маршрутизуйте її через повний barrel
runtime каналу.

`openclaw.channel.configuredState` використовує ту саму форму для недорогих перевірок
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

Використовуйте це, коли канал може відповісти на configured-state на основі env або інших невеликих
вхідних даних, не пов’язаних із runtime. Якщо перевірка потребує повного розв’язання конфігурації або реального
runtime каналу, залишайте цю логіку в hook `config.hasConfiguredState` Plugin.

## Пріоритет виявлення (дубльовані id Plugin)

OpenClaw виявляє Plugin з кількох коренів (вбудовані, глобальне встановлення, workspace, явні шляхи, вибрані конфігурацією). Якщо два виявлені Plugin мають однаковий `id`, зберігається лише маніфест із **найвищим пріоритетом**; дублікати з нижчим пріоритетом відкидаються замість паралельного завантаження.

Пріоритет, від найвищого до найнижчого:

1. **Вибраний конфігурацією** — шлях, явно закріплений у `plugins.entries.<id>`
2. **Вбудований** — Plugin, що постачаються з OpenClaw
3. **Глобальне встановлення** — Plugin, встановлені в глобальний корінь Plugin OpenClaw
4. **Workspace** — Plugin, виявлені відносно поточного workspace

Наслідки:

- Форкнута або застаріла копія вбудованого Plugin у workspace не зможе затінити вбудовану збірку.
- Щоб справді перевизначити вбудований Plugin локальним, закріпіть його через `plugins.entries.<id>`, щоб він переміг за пріоритетом, а не покладайтесь на виявлення у workspace.
- Відкидання дублікатів записується в лог, щоб Doctor і діагностика запуску могли вказати на відкинуту копію.

## Вимоги до JSON Schema

- **Кожен Plugin повинен постачатися з JSON Schema**, навіть якщо він не приймає конфігурацію.
- Порожня schema прийнятна (наприклад, `{ "type": "object", "additionalProperties": false }`).
- Schema проходять валідацію під час читання/запису конфігурації, а не під час runtime.

## Поведінка валідації

- Невідомі ключі `channels.*` — це **помилки**, якщо тільки id каналу не оголошено в
  маніфесті Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` і `plugins.slots.*`
  мають посилатися на **виявлювані** id Plugin. Невідомі id — це **помилки**.
- Якщо Plugin встановлено, але він має зламаний або відсутній маніфест чи schema,
  валідація завершується помилкою, а Doctor повідомляє про помилку Plugin.
- Якщо конфігурація Plugin існує, але Plugin **вимкнений**, конфігурація зберігається, і
  в Doctor + логах з’являється **попередження**.

Повну schema `plugins.*` див. у [Configuration reference](/uk/gateway/configuration).

## Примітки

- Маніфест **обов’язковий для нативних Plugin OpenClaw**, включно з локальними завантаженнями з файлової системи. Runtime, як і раніше, завантажує модуль Plugin окремо; маніфест потрібен лише для виявлення + валідації.
- Нативні маніфести парсяться за допомогою JSON5, тому коментарі, кінцеві коми та ключі без лапок дозволені, якщо фінальне значення все одно є об’єктом.
- Завантажувач маніфесту читає лише задокументовані поля маніфесту. Уникайте власних ключів верхнього рівня.
- `channels`, `providers`, `cliBackends` і `skills` можна не вказувати, якщо Plugin їх не потребує.
- `providerDiscoveryEntry` має залишатися легковаговим і не повинен імпортувати широкий runtime-код; використовуйте його для статичних метаданих каталогу провайдера або вузьких дескрипторів виявлення, а не для виконання під час запиту.
- Ексклюзивні типи Plugin вибираються через `plugins.slots.*`: `kind: "memory"` через `plugins.slots.memory`, `kind: "context-engine"` через `plugins.slots.contextEngine` (типово `legacy`).
- Метадані env vars (`providerAuthEnvVars`, `channelEnvVars`) мають лише декларативний характер. Status, audit, валідація доставки Cron та інші read-only surfaces усе одно застосовують довіру до Plugin і політику ефективної активації, перш ніж вважати env var налаштованою.
- Для метаданих runtime wizard, які потребують коду провайдера, див. [Provider runtime hooks](/uk/plugins/architecture-internals#provider-runtime-hooks).
- Якщо ваш Plugin залежить від native module, задокументуйте кроки збірки та всі вимоги до allowlist менеджера пакетів (наприклад, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Пов’язане

<CardGroup cols={3}>
  <Card title="Створення Plugin" href="/uk/plugins/building-plugins" icon="rocket">
    Початок роботи з Plugin.
  </Card>
  <Card title="Архітектура Plugin" href="/uk/plugins/architecture" icon="diagram-project">
    Внутрішня архітектура та модель можливостей.
  </Card>
  <Card title="Огляд SDK" href="/uk/plugins/sdk-overview" icon="book">
    Довідка по SDK Plugin і імпортах subpath.
  </Card>
</CardGroup>
