---
read_when:
    - Ви створюєте плагін OpenClaw
    - Вам потрібно постачати схему конфігурації плагіна або налагоджувати помилки валідації плагіна
summary: Вимоги до маніфесту плагіна + JSON schema (сувора валідація конфігурації)
title: Маніфест плагіна
x-i18n:
    generated_at: "2026-04-12T02:30:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf666b0f41f07641375a248f52e29ba6a68c3ec20404bedb6b52a20a5cd92e91
    source_path: plugins/manifest.md
    workflow: 15
---

# Маніфест плагіна (`openclaw.plugin.json`)

Ця сторінка стосується лише **власного маніфесту плагіна OpenClaw**.

Сумісні макети пакунків описано в [Пакунки плагінів](/uk/plugins/bundles).

Сумісні формати пакунків використовують інші файли маніфесту:

- Пакунок Codex: `.codex-plugin/plugin.json`
- Пакунок Claude: `.claude-plugin/plugin.json` або типовий макет компонентів Claude
  без маніфесту
- Пакунок Cursor: `.cursor-plugin/plugin.json`

OpenClaw також автоматично виявляє ці макети пакунків, але вони не проходять валідацію
за схемою `openclaw.plugin.json`, описаною тут.

Для сумісних пакунків OpenClaw наразі зчитує метадані пакунка, а також оголошені
кореневі каталоги skill, кореневі каталоги команд Claude, типові значення `settings.json` у пакунку Claude,
типові значення LSP у пакунку Claude та підтримувані набори hooks, якщо макет відповідає
очікуванням середовища виконання OpenClaw.

Кожен власний плагін OpenClaw **має** постачатися з файлом `openclaw.plugin.json` у
**корені плагіна**. OpenClaw використовує цей маніфест для валідації конфігурації
**без виконання коду плагіна**. Відсутні або невалідні маніфести вважаються
помилками плагіна та блокують валідацію конфігурації.

Дивіться повний посібник із системи плагінів: [Плагіни](/uk/tools/plugin).
Щодо власної моделі можливостей і поточних рекомендацій щодо зовнішньої сумісності:
[Модель можливостей](/uk/plugins/architecture#public-capability-model).

## Що робить цей файл

`openclaw.plugin.json` — це метадані, які OpenClaw зчитує перед завантаженням коду
вашого плагіна.

Використовуйте його для:

- ідентичності плагіна
- валідації конфігурації
- метаданих автентифікації та онбордингу, які мають бути доступні без запуску
  середовища виконання плагіна
- легковагих підказок активації, які поверхні control plane можуть перевіряти до завантаження runtime
- легковагих дескрипторів налаштування, які поверхні setup/onboarding можуть перевіряти до завантаження
  runtime
- метаданих псевдонімів і автоувімкнення, які мають визначатися до завантаження runtime плагіна
- скорочених метаданих належності до сімейств моделей, які мають автоматично активувати
  плагін до завантаження runtime
- статичних знімків належності можливостей, які використовуються для bundled compat wiring і
  покриття контрактів
- метаданих конфігурації каналу, специфічних для каналу, які мають об’єднуватися в поверхні каталогу та валідації
  без завантаження runtime
- підказок UI для конфігурації

Не використовуйте його для:

- реєстрації поведінки runtime
- оголошення entrypoint коду
- метаданих встановлення npm

Це належить вашому коду плагіна та `package.json`.

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
  "cliBackends": ["openrouter-cli"],
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

| Поле                                | Обов’язкове | Тип                              | Що воно означає                                                                                                                                                                                              |
| ----------------------------------- | ----------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                | Так         | `string`                         | Канонічний id плагіна. Це id, який використовується в `plugins.entries.<id>`.                                                                                                                               |
| `configSchema`                      | Так         | `object`                         | Вбудована JSON Schema для конфігурації цього плагіна.                                                                                                                                                        |
| `enabledByDefault`                  | Ні          | `true`                           | Позначає bundled plugin як увімкнений за замовчуванням. Опустіть це поле або встановіть будь-яке значення, відмінне від `true`, щоб плагін залишався вимкненим за замовчуванням.                          |
| `legacyPluginIds`                   | Ні          | `string[]`                       | Застарілі id, які нормалізуються до цього канонічного id плагіна.                                                                                                                                            |
| `autoEnableWhenConfiguredProviders` | Ні          | `string[]`                       | Id провайдерів, які мають автоматично вмикати цей плагін, коли на них посилаються auth, config або model refs.                                                                                              |
| `kind`                              | Ні          | `"memory"` \| `"context-engine"` | Оголошує виключний тип плагіна, який використовується `plugins.slots.*`.                                                                                                                                     |
| `channels`                          | Ні          | `string[]`                       | Id каналів, якими володіє цей плагін. Використовуються для виявлення та валідації конфігурації.                                                                                                             |
| `providers`                         | Ні          | `string[]`                       | Id провайдерів, якими володіє цей плагін.                                                                                                                                                                     |
| `modelSupport`                      | Ні          | `object`                         | Скорочені метадані сімейств моделей, якими володіє маніфест, що використовуються для автоматичного завантаження плагіна до runtime.                                                                        |
| `cliBackends`                       | Ні          | `string[]`                       | Id backend для висновування в CLI, якими володіє цей плагін. Використовуються для автоматичної активації під час запуску з явних посилань у config.                                                        |
| `commandAliases`                    | Ні          | `object[]`                       | Назви команд, якими володіє цей плагін, і які мають створювати діагностику конфігурації та CLI з урахуванням плагіна до завантаження runtime.                                                              |
| `providerAuthEnvVars`               | Ні          | `Record<string, string[]>`       | Легковагі метадані env для auth провайдера, які OpenClaw може перевіряти без завантаження коду плагіна.                                                                                                     |
| `providerAuthAliases`               | Ні          | `Record<string, string>`         | Id провайдерів, які мають повторно використовувати інший id провайдера для пошуку auth, наприклад coding provider, що спільно використовує API key базового провайдера та профілі auth.                  |
| `channelEnvVars`                    | Ні          | `Record<string, string[]>`       | Легковагі метадані env каналу, які OpenClaw може перевіряти без завантаження коду плагіна. Використовуйте це для налаштування каналів через env або поверхонь auth, які мають бачити загальні helpers запуску/config. |
| `providerAuthChoices`               | Ні          | `object[]`                       | Легковагі метадані вибору auth для picker-ів онбордингу, визначення preferred provider і простого зв’язування прапорців CLI.                                                                                |
| `activation`                        | Ні          | `object`                         | Легковагі підказки активації для завантаження, що запускається провайдером, командою, каналом, маршрутом або можливістю. Лише метадані; фактичною поведінкою як і раніше володіє runtime плагіна.        |
| `setup`                             | Ні          | `object`                         | Легковагі дескриптори setup/onboarding, які поверхні виявлення та налаштування можуть перевіряти без завантаження runtime плагіна.                                                                          |
| `contracts`                         | Ні          | `object`                         | Статичний знімок bundled capability для speech, realtime transcription, realtime voice, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search і належності tool. |
| `channelConfigs`                    | Ні          | `Record<string, object>`         | Метадані конфігурації каналу, якими володіє маніфест, що об’єднуються в поверхні виявлення та валідації до завантаження runtime.                                                                            |
| `skills`                            | Ні          | `string[]`                       | Каталоги Skills для завантаження, відносно кореня плагіна.                                                                                                                                                   |
| `name`                              | Ні          | `string`                         | Людинозрозуміла назва плагіна.                                                                                                                                                                                |
| `description`                       | Ні          | `string`                         | Короткий опис, що показується в поверхнях плагіна.                                                                                                                                                           |
| `version`                           | Ні          | `string`                         | Інформаційна версія плагіна.                                                                                                                                                                                 |
| `uiHints`                           | Ні          | `Record<string, object>`         | Мітки UI, placeholders і підказки щодо чутливості для полів конфігурації.                                                                                                                                    |

## Довідник `providerAuthChoices`

Кожен запис `providerAuthChoices` описує один варіант онбордингу або auth.
OpenClaw зчитує це до завантаження runtime провайдера.

| Поле                  | Обов’язкове | Тип                                             | Що воно означає                                                                                           |
| --------------------- | ----------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `provider`            | Так         | `string`                                        | Id провайдера, до якого належить цей варіант.                                                             |
| `method`              | Так         | `string`                                        | Id методу auth, до якого слід диспетчеризувати.                                                           |
| `choiceId`            | Так         | `string`                                        | Стабільний id варіанта auth, який використовується в потоках онбордингу та CLI.                          |
| `choiceLabel`         | Ні          | `string`                                        | Мітка для користувача. Якщо її не вказано, OpenClaw використовує `choiceId`.                             |
| `choiceHint`          | Ні          | `string`                                        | Короткий допоміжний текст для picker-а.                                                                   |
| `assistantPriority`   | Ні          | `number`                                        | Менші значення сортуються раніше в інтерактивних picker-ах, керованих асистентом.                        |
| `assistantVisibility` | Ні          | `"visible"` \| `"manual-only"`                  | Приховує варіант із picker-ів асистента, але все ще дозволяє ручний вибір через CLI.                     |
| `deprecatedChoiceIds` | Ні          | `string[]`                                      | Застарілі id варіантів, які мають перенаправляти користувачів на цей варіант-заміну.                     |
| `groupId`             | Ні          | `string`                                        | Необов’язковий id групи для групування пов’язаних варіантів.                                              |
| `groupLabel`          | Ні          | `string`                                        | Мітка для користувача для цієї групи.                                                                     |
| `groupHint`           | Ні          | `string`                                        | Короткий допоміжний текст для групи.                                                                      |
| `optionKey`           | Ні          | `string`                                        | Внутрішній ключ параметра для простих потоків auth з одним прапорцем.                                    |
| `cliFlag`             | Ні          | `string`                                        | Назва прапорця CLI, наприклад `--openrouter-api-key`.                                                     |
| `cliOption`           | Ні          | `string`                                        | Повна форма параметра CLI, наприклад `--openrouter-api-key <key>`.                                       |
| `cliDescription`      | Ні          | `string`                                        | Опис, який використовується в довідці CLI.                                                                |
| `onboardingScopes`    | Ні          | `Array<"text-inference" \| "image-generation">` | У яких поверхнях онбордингу має з’являтися цей варіант. Якщо не вказано, використовується `["text-inference"]`. |

## Довідник `commandAliases`

Використовуйте `commandAliases`, коли плагін володіє назвою runtime-команди, яку користувачі можуть
помилково помістити в `plugins.allow` або спробувати запустити як кореневу команду CLI. OpenClaw
використовує ці метадані для діагностики без імпорту коду runtime плагіна.

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

| Поле         | Обов’язкове | Тип               | Що воно означає                                                             |
| ------------ | ----------- | ----------------- | --------------------------------------------------------------------------- |
| `name`       | Так         | `string`          | Назва команди, яка належить цьому плагіну.                                  |
| `kind`       | Ні          | `"runtime-slash"` | Позначає псевдонім як slash-команду чату, а не кореневу команду CLI.        |
| `cliCommand` | Ні          | `string`          | Пов’язана коренева команда CLI, яку слід рекомендувати для операцій CLI, якщо вона існує. |

## Довідник `activation`

Використовуйте `activation`, коли плагін може дешево оголосити, які події control plane
мають активувати його пізніше.

Цей блок містить лише метадані. Він не реєструє поведінку runtime і не
замінює `register(...)`, `setupEntry` або інші runtime/plugin entrypoint-и.

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

| Поле             | Обов’язкове | Тип                                                  | Що воно означає                                                 |
| ---------------- | ----------- | ---------------------------------------------------- | --------------------------------------------------------------- |
| `onProviders`    | Ні          | `string[]`                                           | Id провайдерів, які мають активувати цей плагін за запитом.     |
| `onCommands`     | Ні          | `string[]`                                           | Id команд, які мають активувати цей плагін.                     |
| `onChannels`     | Ні          | `string[]`                                           | Id каналів, які мають активувати цей плагін.                    |
| `onRoutes`       | Ні          | `string[]`                                           | Типи маршрутів, які мають активувати цей плагін.                |
| `onCapabilities` | Ні          | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Загальні підказки можливостей, що використовуються в плануванні активації control plane. |

## Довідник `setup`

Використовуйте `setup`, коли поверхням setup та онбордингу потрібні дешеві метадані,
якими володіє плагін, до завантаження runtime.

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

`cliBackends` верхнього рівня залишається валідним і надалі описує backend-и
висновування CLI. `setup.cliBackends` — це поверхня дескрипторів, специфічна для setup,
для потоків control plane/setup, яка має залишатися лише метаданими.

Якщо вони присутні, `setup.providers` і `setup.cliBackends` є бажаною
поверхнею пошуку на основі дескрипторів для виявлення setup. Якщо дескриптор лише
звужує коло плагінів-кандидатів, а setup все ще потребує багатших runtime hooks під час setup,
встановіть `requiresRuntime: true` і залиште `setup-api` як резервний шлях виконання.

Оскільки пошук setup може виконувати код `setup-api`, яким володіє плагін, нормалізовані
значення `setup.providers[].id` і `setup.cliBackends[]` мають залишатися унікальними серед
виявлених плагінів. Неоднозначна належність завершується без вибору замість того, щоб
обирати переможця за порядком виявлення.

### Довідник `setup.providers`

| Поле          | Обов’язкове | Тип        | Що воно означає                                                                        |
| ------------- | ----------- | ---------- | -------------------------------------------------------------------------------------- |
| `id`          | Так         | `string`   | Id провайдера, який надається під час setup або онбордингу. Нормалізовані id мають бути глобально унікальними. |
| `authMethods` | Ні          | `string[]` | Id методів setup/auth, які цей провайдер підтримує без завантаження повного runtime.   |
| `envVars`     | Ні          | `string[]` | Env vars, які загальні поверхні setup/status можуть перевіряти до завантаження runtime плагіна. |

### Поля `setup`

| Поле               | Обов’язкове | Тип        | Що воно означає                                                                                       |
| ------------------ | ----------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| `providers`        | Ні          | `object[]` | Дескриптори setup провайдерів, доступні під час setup та онбордингу.                                 |
| `cliBackends`      | Ні          | `string[]` | Id backend-ів для часу setup, які використовуються для пошуку setup за принципом descriptor-first. Нормалізовані id мають бути глобально унікальними. |
| `configMigrations` | Ні          | `string[]` | Id міграцій конфігурації, якими володіє поверхня setup цього плагіна.                                |
| `requiresRuntime`  | Ні          | `boolean`  | Чи потребує setup виконання `setup-api` після пошуку за дескриптором.                                |

## Довідник `uiHints`

`uiHints` — це мапа від назв полів конфігурації до невеликих підказок для відображення.

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

Використовуйте `contracts` лише для статичних метаданих належності можливостей, які OpenClaw може
зчитувати без імпорту runtime плагіна.

```json
{
  "contracts": {
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
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

| Поле                             | Тип        | Що воно означає                                               |
| -------------------------------- | ---------- | ------------------------------------------------------------- |
| `speechProviders`                | `string[]` | Id speech-провайдерів, якими володіє цей плагін.              |
| `realtimeTranscriptionProviders` | `string[]` | Id провайдерів realtime-transcription, якими володіє цей плагін. |
| `realtimeVoiceProviders`         | `string[]` | Id провайдерів realtime-voice, якими володіє цей плагін.      |
| `mediaUnderstandingProviders`    | `string[]` | Id провайдерів media-understanding, якими володіє цей плагін. |
| `imageGenerationProviders`       | `string[]` | Id провайдерів image-generation, якими володіє цей плагін.    |
| `videoGenerationProviders`       | `string[]` | Id провайдерів video-generation, якими володіє цей плагін.    |
| `webFetchProviders`              | `string[]` | Id провайдерів web-fetch, якими володіє цей плагін.           |
| `webSearchProviders`             | `string[]` | Id провайдерів web-search, якими володіє цей плагін.          |
| `tools`                          | `string[]` | Назви agent tool, якими володіє цей плагін, для bundled перевірок контрактів. |

## Довідник `channelConfigs`

Використовуйте `channelConfigs`, коли плагіну каналу потрібні дешеві метадані конфігурації до
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
      "description": "Matrix homeserver connection",
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Кожен запис каналу може містити:

| Поле          | Тип                      | Що воно означає                                                                                 |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema для `channels.<id>`. Обов’язкова для кожного оголошеного запису конфігурації каналу. |
| `uiHints`     | `Record<string, object>` | Необов’язкові мітки UI/placeholders/підказки чутливості для цього розділу конфігурації каналу. |
| `label`       | `string`                 | Мітка каналу, що об’єднується в picker та inspect surfaces, коли метадані runtime ще не готові. |
| `description` | `string`                 | Короткий опис каналу для поверхонь inspect і catalog.                                          |
| `preferOver`  | `string[]`               | Застарілі або нижчопріоритетні id плагінів, які цей канал має випереджати в поверхнях вибору.  |

## Довідник `modelSupport`

Використовуйте `modelSupport`, коли OpenClaw має визначати ваш плагін провайдера з
коротких id моделей, таких як `gpt-5.4` або `claude-sonnet-4.6`, до завантаження runtime
плагіна.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw застосовує таку пріоритетність:

- явні посилання `provider/model` використовують метадані маніфесту `providers`, якими володіє плагін
- `modelPatterns` мають вищий пріоритет за `modelPrefixes`
- якщо збігаються один небандлований плагін і один bundled plugin, перемагає небандлований
  плагін
- решта неоднозначностей ігноруються, доки користувач або config не вкаже провайдера

Поля:

| Поле            | Тип        | Що воно означає                                                                       |
| --------------- | ---------- | ------------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Префікси, що зіставляються через `startsWith` із короткими id моделей.               |
| `modelPatterns` | `string[]` | Джерела regex, які зіставляються з короткими id моделей після видалення суфікса профілю. |

Застарілі ключі можливостей верхнього рівня не рекомендуються. Використовуйте `openclaw doctor --fix`, щоб
перемістити `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` і `webSearchProviders` до `contracts`; звичайне
завантаження маніфесту більше не трактує ці поля верхнього рівня як
належність можливостей.

## Маніфест проти package.json

Ці два файли виконують різні ролі:

| Файл                   | Використовуйте його для                                                                                                            |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Виявлення, валідація конфігурації, метадані вибору auth і підказки UI, які мають існувати до запуску коду плагіна                |
| `package.json`         | Метадані npm, встановлення залежностей і блок `openclaw`, який використовується для entrypoint-ів, обмежень установлення, setup або метаданих каталогу |

Якщо ви не впевнені, куди має належати певний фрагмент метаданих, користуйтеся таким правилом:

- якщо OpenClaw має знати це до завантаження коду плагіна, помістіть це в `openclaw.plugin.json`
- якщо це стосується пакування, файлів входу або поведінки встановлення npm, помістіть це в `package.json`

### Поля package.json, які впливають на виявлення

Частина метаданих плагіна до runtime навмисно зберігається в `package.json` у блоці
`openclaw`, а не в `openclaw.plugin.json`.

Важливі приклади:

| Поле                                                              | Що воно означає                                                                                                                                  |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | Оголошує entrypoint-и власних плагінів.                                                                                                          |
| `openclaw.setupEntry`                                             | Легковагий entrypoint лише для setup, який використовується під час онбордингу та відкладеного запуску каналу.                                 |
| `openclaw.channel`                                                | Легковагі метадані каталогу каналів, як-от мітки, шляхи до документації, псевдоніми та текст для вибору.                                       |
| `openclaw.channel.configuredState`                                | Легковагі метадані перевірки configured-state, які можуть відповісти на запитання «чи вже існує налаштування лише через env?» без завантаження повного runtime каналу. |
| `openclaw.channel.persistedAuthState`                             | Легковагі метадані перевірки persisted-auth, які можуть відповісти на запитання «чи вже десь виконано вхід?» без завантаження повного runtime каналу. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Підказки встановлення/оновлення для bundled і зовнішньо опублікованих плагінів.                                                                 |
| `openclaw.install.defaultChoice`                                  | Бажаний шлях встановлення, коли доступно кілька джерел встановлення.                                                                             |
| `openclaw.install.minHostVersion`                                 | Мінімальна підтримувана версія хоста OpenClaw, із нижньою межею semver на кшталт `>=2026.3.22`.                                                 |
| `openclaw.install.allowInvalidConfigRecovery`                     | Дозволяє вузький шлях відновлення перевстановлення bundled plugin, коли конфігурація невалідна.                                                 |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Дозволяє поверхням каналу лише для setup завантажуватися до повного плагіна каналу під час запуску.                                             |

`openclaw.install.minHostVersion` застосовується під час встановлення та
завантаження реєстру маніфестів. Невалідні значення відхиляються; новіші, але валідні значення пропускають
плагін на старіших хостах.

`openclaw.install.allowInvalidConfigRecovery` навмисно має вузьке застосування. Воно
не робить довільні зламані конфігурації придатними до встановлення. Наразі воно лише дозволяє потокам встановлення
відновлюватися після певних застарілих збоїв оновлення bundled plugin, наприклад
відсутнього шляху bundled plugin або застарілого запису `channels.<id>` для того самого
bundled plugin. Непов’язані помилки конфігурації все одно блокують встановлення та спрямовують операторів
до `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` — це метадані пакунка для маленького модуля перевірки:

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
типу так/ні до завантаження повного плагіна каналу. Цільовий export має бути невеликою
функцією, яка лише читає збережений стан; не спрямовуйте її через повний barrel runtime каналу.

`openclaw.channel.configuredState` має ту саму форму для дешевих перевірок configured-state лише через env:

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

Використовуйте це, коли канал може визначити configured-state через env або інші невеликі
входи, не пов’язані з runtime. Якщо перевірка потребує повного розв’язання config або справжнього
runtime каналу, залиште цю логіку в hook `config.hasConfiguredState` плагіна.

## Вимоги до JSON Schema

- **Кожен плагін має постачатися з JSON Schema**, навіть якщо він не приймає конфігурації.
- Порожня схема припустима (наприклад, `{ "type": "object", "additionalProperties": false }`).
- Схеми проходять валідацію під час читання/запису config, а не під час runtime.

## Поведінка валідації

- Невідомі ключі `channels.*` є **помилками**, якщо тільки id каналу не оголошений
  у маніфесті плагіна.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` і `plugins.slots.*`
  мають посилатися на id плагінів, які **можна виявити**. Невідомі id є **помилками**.
- Якщо плагін установлено, але він має зламаний або відсутній маніфест чи схему,
  валідація завершується помилкою, а Doctor повідомляє про помилку плагіна.
- Якщо конфігурація плагіна існує, але сам плагін **вимкнено**, конфігурація зберігається, і
  у Doctor + logs відображається **попередження**.

Дивіться [Довідник конфігурації](/uk/gateway/configuration) для повної схеми `plugins.*`.

## Примітки

- Маніфест **обов’язковий для власних плагінів OpenClaw**, включно із завантаженням із локальної файлової системи.
- Runtime, як і раніше, завантажує модуль плагіна окремо; маніфест призначений лише для
  виявлення + валідації.
- Власні маніфести розбираються за допомогою JSON5, тому коментарі, кінцеві коми та
  ключі без лапок допускаються, якщо кінцеве значення все ще є об’єктом.
- Завантажувач маніфестів читає лише задокументовані поля маніфесту. Уникайте додавання
  власних ключів верхнього рівня сюди.
- `providerAuthEnvVars` — це дешевий шлях метаданих для перевірок auth, валідації
  env-marker та подібних поверхонь auth провайдера, які не повинні запускати runtime плагіна
  лише для перевірки назв env.
- `providerAuthAliases` дозволяє варіантам провайдерів повторно використовувати auth
  env vars, auth profiles, auth на основі config та варіант онбордингу API key іншого провайдера
  без жорсткого кодування цього зв’язку в core.
- `channelEnvVars` — це дешевий шлях метаданих для резервного використання shell-env, підказок setup
  та подібних поверхонь каналів, які не повинні запускати runtime плагіна
  лише для перевірки назв env.
- `providerAuthChoices` — це дешевий шлях метаданих для picker-ів вибору auth,
  розв’язання `--auth-choice`, мапінгу preferred provider і простої реєстрації прапорців CLI
  під час онбордингу до завантаження runtime провайдера. Для метаданих wizard runtime,
  які потребують коду провайдера, дивіться
  [Runtime hooks провайдера](/uk/plugins/architecture#provider-runtime-hooks).
- Виключні типи плагінів вибираються через `plugins.slots.*`.
  - `kind: "memory"` вибирається через `plugins.slots.memory`.
  - `kind: "context-engine"` вибирається через `plugins.slots.contextEngine`
    (типове значення: вбудований `legacy`).
- `channels`, `providers`, `cliBackends` і `skills` можна не вказувати, якщо
  плагіну вони не потрібні.
- Якщо ваш плагін залежить від native modules, задокументуйте кроки збірки та всі
  вимоги до allowlist менеджера пакунків (наприклад, pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Пов’язані матеріали

- [Створення плагінів](/uk/plugins/building-plugins) — початок роботи з плагінами
- [Архітектура плагінів](/uk/plugins/architecture) — внутрішня архітектура
- [Огляд SDK](/uk/plugins/sdk-overview) — довідник Plugin SDK
