---
read_when:
    - Ви створюєте Plugin для OpenClaw
    - Вам потрібно постачати schema конфігурації plugin або налагоджувати помилки валідації plugin
summary: Вимоги до маніфесту Plugin та JSON schema (сувора валідація конфігурації)
title: Маніфест Plugin
x-i18n:
    generated_at: "2026-04-22T05:13:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: b80735690799682939e8c8c27b6a364caa3ceadcf6319155ddeb20eb0538c313
    source_path: plugins/manifest.md
    workflow: 15
---

# Маніфест Plugin (`openclaw.plugin.json`)

Ця сторінка стосується лише **власного маніфесту Plugin для OpenClaw**.

Сумісні компонування пакетів описано в [Пакети Plugin](/uk/plugins/bundles).

Сумісні формати пакетів використовують інші файли маніфесту:

- Пакет Codex: `.codex-plugin/plugin.json`
- Пакет Claude: `.claude-plugin/plugin.json` або стандартне компонування компонентів Claude
  без маніфесту
- Пакет Cursor: `.cursor-plugin/plugin.json`

OpenClaw також автоматично виявляє ці компонування пакетів, але вони не проходять валідацію
за schema `openclaw.plugin.json`, описаною тут.

Для сумісних пакетів OpenClaw зараз зчитує метадані пакета разом з оголошеними
коренями skills, коренями команд Claude, типовими значеннями `settings.json` пакета Claude,
типовими значеннями Claude bundle LSP і підтримуваними пакетами hook, коли компонування відповідає
очікуванням середовища виконання OpenClaw.

Кожен власний Plugin для OpenClaw **має** постачатися з файлом `openclaw.plugin.json` у
**корені plugin**. OpenClaw використовує цей маніфест для валідації конфігурації
**без виконання коду plugin**. Відсутні або невалідні маніфести вважаються
помилками plugin і блокують валідацію конфігурації.

Див. повний посібник по системі plugin: [Plugins](/uk/tools/plugin).
Щодо власної моделі можливостей і поточних вказівок із зовнішньої сумісності:
[Модель можливостей](/uk/plugins/architecture#public-capability-model).

## Що робить цей файл

`openclaw.plugin.json` — це метадані, які OpenClaw зчитує перед завантаженням коду
вашого plugin.

Використовуйте його для:

- ідентифікації plugin
- валідації конфігурації
- метаданих автентифікації та онбордингу, які мають бути доступні без запуску
  середовища виконання plugin
- недорогих підказок активації, які поверхні control-plane можуть перевіряти до
  завантаження середовища виконання
- недорогих дескрипторів налаштування, які поверхні налаштування/онбордингу можуть перевіряти до
  завантаження середовища виконання
- метаданих псевдонімів і автоувімкнення, які мають визначатися до завантаження
  середовища виконання plugin
- скорочених метаданих володіння сімейством моделей, які мають автоматично активувати
  plugin до завантаження середовища виконання
- статичних знімків володіння можливостями, що використовуються для сумісного підключення bundled-елементів і
  покриття контрактів
- недорогих метаданих QA runner, які спільний хост `openclaw qa` може перевіряти
  до завантаження середовища виконання plugin
- метаданих конфігурації, специфічних для каналу, які мають об’єднуватися в
  поверхнях каталогу та валідації без завантаження середовища виконання
- підказок для UI конфігурації

Не використовуйте його для:

- реєстрації поведінки середовища виконання
- оголошення entrypoint коду
- метаданих встановлення npm

Це має належати коду вашого plugin і `package.json`.

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

| Поле                                 | Обов’язкове | Тип                              | Що воно означає                                                                                                                                                                                              |
| ------------------------------------ | ----------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                 | Так         | `string`                         | Канонічний id plugin. Це id, який використовується в `plugins.entries.<id>`.                                                                                                                                |
| `configSchema`                       | Так         | `object`                         | Вбудована JSON Schema для конфігурації цього plugin.                                                                                                                                                         |
| `enabledByDefault`                   | Ні          | `true`                           | Позначає bundled plugin як увімкнений за замовчуванням. Пропустіть це поле або встановіть будь-яке значення, відмінне від `true`, щоб plugin залишався вимкненим за замовчуванням.                         |
| `legacyPluginIds`                    | Ні          | `string[]`                       | Застарілі id, які нормалізуються до цього канонічного id plugin.                                                                                                                                            |
| `autoEnableWhenConfiguredProviders`  | Ні          | `string[]`                       | Id provider, які мають автоматично вмикати цей plugin, коли на них посилаються автентифікація, конфігурація або посилання на моделі.                                                                       |
| `kind`                               | Ні          | `"memory"` \| `"context-engine"` | Оголошує виключний тип plugin, який використовується `plugins.slots.*`.                                                                                                                                     |
| `channels`                           | Ні          | `string[]`                       | Id каналів, якими володіє цей plugin. Використовується для виявлення та валідації конфігурації.                                                                                                             |
| `providers`                          | Ні          | `string[]`                       | Id provider, якими володіє цей plugin.                                                                                                                                                                       |
| `modelSupport`                       | Ні          | `object`                         | Скорочені метадані сімейства моделей, що належать маніфесту та використовуються для автоматичного завантаження plugin до запуску середовища виконання.                                                     |
| `providerEndpoints`                  | Ні          | `object[]`                       | Метадані хостів/`baseUrl` кінцевих точок, що належать маніфесту, для маршрутів provider, які ядро має класифікувати до завантаження середовища виконання provider.                                         |
| `cliBackends`                        | Ні          | `string[]`                       | Id CLI backend, якими володіє цей plugin. Використовується для автоактивації під час запуску на основі явних посилань у конфігурації.                                                                      |
| `syntheticAuthRefs`                  | Ні          | `string[]`                       | Посилання на provider або CLI backend, для яких належний plugin synthetic auth hook слід перевіряти під час холодного виявлення моделей до завантаження середовища виконання.                              |
| `nonSecretAuthMarkers`               | Ні          | `string[]`                       | Значення-заповнювачі API key, що належать bundled plugin і представляють локальний стан без секретів, OAuth або ambient credential state.                                                                   |
| `commandAliases`                     | Ні          | `object[]`                       | Імена команд, що належать цьому plugin і мають створювати діагностику конфігурації та CLI з урахуванням plugin до завантаження середовища виконання.                                                       |
| `providerAuthEnvVars`                | Ні          | `Record<string, string[]>`       | Недорогі env-метадані автентифікації provider, які OpenClaw може перевіряти без завантаження коду plugin.                                                                                                  |
| `providerAuthAliases`                | Ні          | `Record<string, string>`         | Id provider, які мають повторно використовувати інший id provider для пошуку автентифікації, наприклад coding provider, що ділить API key базового provider і профілі автентифікації.                     |
| `channelEnvVars`                     | Ні          | `Record<string, string[]>`       | Недорогі env-метадані каналу, які OpenClaw може перевіряти без завантаження коду plugin. Використовуйте це для керованого через env налаштування каналу або поверхонь автентифікації, які мають бачити загальні помічники запуску/конфігурації. |
| `providerAuthChoices`                | Ні          | `object[]`                       | Недорогі метадані варіантів автентифікації для засобів вибору під час онбордингу, визначення preferred-provider і простого підключення CLI flags.                                                          |
| `activation`                         | Ні          | `object`                         | Недорогі підказки активації для завантаження, що запускається provider, командами, каналами, маршрутами та можливостями. Лише метадані; фактична поведінка все одно належить середовищу виконання plugin. |
| `setup`                              | Ні          | `object`                         | Недорогі дескриптори налаштування/онбордингу, які поверхні виявлення та налаштування можуть перевіряти без завантаження середовища виконання plugin.                                                       |
| `qaRunners`                          | Ні          | `object[]`                       | Недорогі дескриптори QA runner, які використовує спільний хост `openclaw qa` до завантаження середовища виконання plugin.                                                                                  |
| `contracts`                          | Ні          | `object`                         | Статичний bundled-знімок можливостей для speech, realtime transcription, realtime voice, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search і володіння tools. |
| `mediaUnderstandingProviderMetadata` | Ні          | `Record<string, object>`         | Недорогі типові значення media-understanding для id provider, оголошених у `contracts.mediaUnderstandingProviders`.                                                                                         |
| `channelConfigs`                     | Ні          | `Record<string, object>`         | Метадані конфігурації каналу, що належать маніфесту та об’єднуються з поверхнями виявлення й валідації до завантаження середовища виконання.                                                               |
| `skills`                             | Ні          | `string[]`                       | Каталоги Skills для завантаження відносно кореня plugin.                                                                                                                                                    |
| `name`                               | Ні          | `string`                         | Людинозрозуміла назва plugin.                                                                                                                                                                                |
| `description`                        | Ні          | `string`                         | Короткий опис, що показується в поверхнях plugin.                                                                                                                                                            |
| `version`                            | Ні          | `string`                         | Інформаційна версія plugin.                                                                                                                                                                                  |
| `uiHints`                            | Ні          | `Record<string, object>`         | Підписи UI, placeholders і підказки чутливості для полів конфігурації.                                                                                                                                      |

## Довідник `providerAuthChoices`

Кожен запис `providerAuthChoices` описує один варіант онбордингу або автентифікації.
OpenClaw зчитує це до завантаження середовища виконання provider.

| Поле                  | Обов’язкове | Тип                                             | Що воно означає                                                                                             |
| --------------------- | ----------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `provider`            | Так         | `string`                                        | Id provider, до якого належить цей варіант.                                                                 |
| `method`              | Так         | `string`                                        | Id методу автентифікації, до якого слід спрямувати обробку.                                                 |
| `choiceId`            | Так         | `string`                                        | Стабільний id варіанта автентифікації, який використовують потоки онбордингу та CLI.                       |
| `choiceLabel`         | Ні          | `string`                                        | Підпис для користувача. Якщо його пропущено, OpenClaw використовує `choiceId`.                              |
| `choiceHint`          | Ні          | `string`                                        | Короткий допоміжний текст для засобу вибору.                                                                |
| `assistantPriority`   | Ні          | `number`                                        | Менші значення сортуються раніше в інтерактивних засобах вибору, керованих асистентом.                     |
| `assistantVisibility` | Ні          | `"visible"` \| `"manual-only"`                  | Приховує варіант із засобів вибору асистента, але все одно дозволяє ручний вибір через CLI.                |
| `deprecatedChoiceIds` | Ні          | `string[]`                                      | Застарілі id варіантів, які мають перенаправляти користувачів до цього варіанта-заміни.                    |
| `groupId`             | Ні          | `string`                                        | Необов’язковий id групи для пов’язаних варіантів.                                                           |
| `groupLabel`          | Ні          | `string`                                        | Підпис цієї групи для користувача.                                                                          |
| `groupHint`           | Ні          | `string`                                        | Короткий допоміжний текст для групи.                                                                        |
| `optionKey`           | Ні          | `string`                                        | Внутрішній ключ параметра для простих потоків автентифікації з одним flag.                                  |
| `cliFlag`             | Ні          | `string`                                        | Назва CLI flag, наприклад `--openrouter-api-key`.                                                           |
| `cliOption`           | Ні          | `string`                                        | Повна форма CLI option, наприклад `--openrouter-api-key <key>`.                                             |
| `cliDescription`      | Ні          | `string`                                        | Опис, який використовується в довідці CLI.                                                                  |
| `onboardingScopes`    | Ні          | `Array<"text-inference" \| "image-generation">` | У яких поверхнях онбордингу має з’являтися цей варіант. Якщо поле пропущене, за замовчуванням використовується `["text-inference"]`. |

## Довідник `commandAliases`

Використовуйте `commandAliases`, коли plugin володіє назвою команди середовища виконання, яку користувачі можуть
помилково додати в `plugins.allow` або спробувати запустити як кореневу команду CLI. OpenClaw
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
| `name`       | Так         | `string`          | Назва команди, яка належить цьому plugin.                                    |
| `kind`       | Ні          | `"runtime-slash"` | Позначає псевдонім як slash-команду чату, а не як кореневу команду CLI.      |
| `cliCommand` | Ні          | `string`          | Пов’язана коренева команда CLI, яку слід запропонувати для операцій CLI, якщо вона існує. |

## Довідник `activation`

Використовуйте `activation`, коли plugin може недорого оголосити, які події control-plane
мають активувати його пізніше.

## Довідник `qaRunners`

Використовуйте `qaRunners`, коли plugin додає один або кілька transport runner під
спільним коренем `openclaw qa`. Зберігайте ці метадані простими й статичними; фактичне
середовище виконання plugin усе одно відповідає за реєстрацію CLI через легку поверхню
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

| Поле          | Обов’язкове | Тип      | Що воно означає                                                       |
| ------------- | ----------- | -------- | --------------------------------------------------------------------- |
| `commandName` | Так         | `string` | Підкоманда, змонтована під `openclaw qa`, наприклад `matrix`.         |
| `description` | Ні          | `string` | Резервний текст довідки, який використовується, коли спільному хосту потрібна stub-команда. |

Цей блок містить лише метадані. Він не реєструє поведінку середовища виконання і
не замінює `register(...)`, `setupEntry` або інші entrypoint середовища виконання/plugin.
Поточні споживачі використовують його як підказку для звуження перед ширшим завантаженням plugin, тому
відсутність метаданих активації зазвичай впливає лише на продуктивність; це не має
змінювати коректність, поки все ще існують застарілі резервні механізми володіння маніфестом.

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

| Поле             | Обов’язкове | Тип                                                  | Що воно означає                                                     |
| ---------------- | ----------- | ---------------------------------------------------- | ------------------------------------------------------------------- |
| `onProviders`    | Ні          | `string[]`                                           | Id provider, які мають активувати цей plugin за запитом.            |
| `onCommands`     | Ні          | `string[]`                                           | Id команд, які мають активувати цей plugin.                         |
| `onChannels`     | Ні          | `string[]`                                           | Id каналів, які мають активувати цей plugin.                        |
| `onRoutes`       | Ні          | `string[]`                                           | Типи маршрутів, які мають активувати цей plugin.                    |
| `onCapabilities` | Ні          | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Загальні підказки можливостей, які використовуються при плануванні активації control-plane. |

Поточні живі споживачі:

- планування CLI, запущене командою, повертається до застарілих
  `commandAliases[].cliCommand` або `commandAliases[].name`
- планування налаштування/каналу, запущене каналом, повертається до застарілого володіння
  `channels[]`, якщо явні метадані активації каналу відсутні
- планування налаштування/середовища виконання, запущене provider, повертається до застарілого
  володіння `providers[]` і верхньорівневого `cliBackends[]`, якщо явні метадані активації provider
  відсутні

## Довідник `setup`

Використовуйте `setup`, коли поверхням налаштування й онбордингу потрібні недорогі метадані plugin до
завантаження середовища виконання.

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

Верхньорівневе `cliBackends` залишається валідним і надалі описує CLI backend
для інференсу. `setup.cliBackends` — це поверхня дескрипторів, специфічна для налаштування,
для потоків control-plane/налаштування, яка має залишатися лише метаданими.

Якщо присутні, `setup.providers` і `setup.cliBackends` є пріоритетною
поверхнею пошуку для виявлення налаштування за принципом descriptor-first. Якщо дескриптор лише
звужує кандидатний plugin, а налаштуванню все ще потрібні багатші runtime hooks на етапі налаштування,
встановіть `requiresRuntime: true` і залиште `setup-api` як
резервний шлях виконання.

Оскільки пошук налаштування може виконувати код `setup-api`, що належить plugin,
нормалізовані значення `setup.providers[].id` і `setup.cliBackends[]` мають залишатися унікальними серед
виявлених plugin. Неоднозначне володіння призводить до безпечної відмови замість вибору
переможця за порядком виявлення.

### Довідник `setup.providers`

| Поле          | Обов’язкове | Тип        | Що воно означає                                                                            |
| ------------- | ----------- | ---------- | ------------------------------------------------------------------------------------------ |
| `id`          | Так         | `string`   | Id provider, який надається під час налаштування або онбордингу. Зберігайте нормалізовані id глобально унікальними. |
| `authMethods` | Ні          | `string[]` | Id методів налаштування/автентифікації, які цей provider підтримує без завантаження повного середовища виконання. |
| `envVars`     | Ні          | `string[]` | Env vars, які загальні поверхні налаштування/статусу можуть перевіряти до завантаження середовища виконання plugin. |

### Поля `setup`

| Поле               | Обов’язкове | Тип        | Що воно означає                                                                                         |
| ------------------ | ----------- | ---------- | ------------------------------------------------------------------------------------------------------- |
| `providers`        | Ні          | `object[]` | Дескриптори налаштування provider, які надаються під час налаштування та онбордингу.                   |
| `cliBackends`      | Ні          | `string[]` | Id backend для етапу налаштування, які використовуються для descriptor-first пошуку налаштування. Зберігайте нормалізовані id глобально унікальними. |
| `configMigrations` | Ні          | `string[]` | Id міграцій конфігурації, що належать поверхні налаштування цього plugin.                              |
| `requiresRuntime`  | Ні          | `boolean`  | Чи потребує налаштування виконання `setup-api` після пошуку за дескриптором.                           |

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

Кожна підказка поля може містити:

| Поле          | Тип        | Що воно означає                        |
| ------------- | ---------- | -------------------------------------- |
| `label`       | `string`   | Підпис поля для користувача.           |
| `help`        | `string`   | Короткий допоміжний текст.             |
| `tags`        | `string[]` | Необов’язкові теги UI.                 |
| `advanced`    | `boolean`  | Позначає поле як розширене.            |
| `sensitive`   | `boolean`  | Позначає поле як секретне або чутливе. |
| `placeholder` | `string`   | Текст placeholder для полів форми.     |

## Довідник `contracts`

Використовуйте `contracts` лише для статичних метаданих володіння можливостями, які OpenClaw може
зчитувати без імпорту середовища виконання plugin.

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

Кожен список необов’язковий:

| Поле                             | Тип        | Що воно означає                                              |
| -------------------------------- | ---------- | ------------------------------------------------------------ |
| `speechProviders`                | `string[]` | Id speech provider, якими володіє цей plugin.                |
| `realtimeTranscriptionProviders` | `string[]` | Id provider для транскрипції в реальному часі, якими володіє цей plugin. |
| `realtimeVoiceProviders`         | `string[]` | Id provider голосу в реальному часі, якими володіє цей plugin. |
| `mediaUnderstandingProviders`    | `string[]` | Id provider для розуміння медіа, якими володіє цей plugin.   |
| `imageGenerationProviders`       | `string[]` | Id provider генерації зображень, якими володіє цей plugin.   |
| `videoGenerationProviders`       | `string[]` | Id provider генерації відео, якими володіє цей plugin.       |
| `webFetchProviders`              | `string[]` | Id provider для web-fetch, якими володіє цей plugin.         |
| `webSearchProviders`             | `string[]` | Id provider для web search, якими володіє цей plugin.        |
| `tools`                          | `string[]` | Назви tools агента, якими володіє цей plugin, для перевірок bundled-контрактів. |

## Довідник `mediaUnderstandingProviderMetadata`

Використовуйте `mediaUnderstandingProviderMetadata`, коли provider для розуміння медіа має
типові моделі, пріоритет резервного auto-auth або вбудовану підтримку документів, які
загальним helper ядра потрібні до завантаження середовища виконання. Ключі також мають бути оголошені в
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
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Медіаможливості, які надає цей provider.                                  |
| `defaultModels`        | `Record<string, string>`            | Типові значення відповідності можливість-модель, які використовуються, коли конфігурація не задає модель. |
| `autoPriority`         | `Record<string, number>`            | Менші числа сортуються раніше для автоматичного резервного вибору provider на основі credential. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Вбудовані формати документів, які підтримує provider.                     |

## Довідник `channelConfigs`

Використовуйте `channelConfigs`, коли plugin каналу потребує недорогих метаданих конфігурації до
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

Кожен запис каналу може містити:

| Поле          | Тип                      | Що воно означає                                                                                |
| ------------- | ------------------------ | ---------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema для `channels.<id>`. Обов’язкове для кожного оголошеного запису конфігурації каналу. |
| `uiHints`     | `Record<string, object>` | Необов’язкові підписи UI/placeholders/підказки чутливості для цього розділу конфігурації каналу. |
| `label`       | `string`                 | Підпис каналу, який об’єднується з поверхнями вибору та перегляду, коли метадані середовища виконання ще не готові. |
| `description` | `string`                 | Короткий опис каналу для поверхонь перегляду та каталогу.                                      |
| `preferOver`  | `string[]`               | Id застарілих plugin або plugin з нижчим пріоритетом, які цей канал має випереджати в поверхнях вибору. |

## Довідник `modelSupport`

Використовуйте `modelSupport`, коли OpenClaw має визначати ваш provider plugin із
скорочених id моделей на кшталт `gpt-5.4` або `claude-sonnet-4.6` до завантаження середовища виконання plugin.

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
- якщо збігаються один небандлований plugin і один bundled plugin, перемагає небандлований
  plugin
- решта неоднозначностей ігнорується, доки користувач або конфігурація не вкажуть provider

Поля:

| Поле            | Тип        | Що воно означає                                                                  |
| --------------- | ---------- | -------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Префікси, що зіставляються через `startsWith` зі скороченими id моделей.        |
| `modelPatterns` | `string[]` | Джерела regex, що зіставляються зі скороченими id моделей після видалення суфікса профілю. |

Застарілі ключі можливостей верхнього рівня більше не рекомендуються. Використовуйте `openclaw doctor --fix`, щоб
перемістити `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` і `webSearchProviders` до `contracts`; звичайне
завантаження маніфесту більше не вважає ці поля верхнього рівня
власниками можливостей.

## Маніфест порівняно з package.json

Ці два файли виконують різні завдання:

| Файл                   | Для чого використовувати                                                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Виявлення, валідація конфігурації, метадані варіантів автентифікації та підказки UI, які мають існувати до запуску коду plugin |
| `package.json`         | Метадані npm, встановлення залежностей і блок `openclaw`, що використовується для entrypoint, обмежень встановлення, налаштування або метаданих каталогу |

Якщо ви не впевнені, куди належить певний фрагмент метаданих, користуйтеся таким правилом:

- якщо OpenClaw має знати це до завантаження коду plugin, помістіть це в `openclaw.plugin.json`
- якщо це стосується пакування, файлів entrypoint або поведінки встановлення npm, помістіть це в `package.json`

### Поля `package.json`, що впливають на виявлення

Деякі метадані plugin до запуску середовища виконання навмисно розміщені в `package.json` у блоці
`openclaw`, а не в `openclaw.plugin.json`.

Важливі приклади:

| Поле                                                              | Що воно означає                                                                                                                                                                       |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Оголошує власні entrypoint plugin. Має залишатися всередині каталогу пакета plugin.                                                                                                  |
| `openclaw.runtimeExtensions`                                      | Оголошує entrypoint built JavaScript runtime для встановлених пакетів. Має залишатися всередині каталогу пакета plugin.                                                              |
| `openclaw.setupEntry`                                             | Легкий entrypoint лише для налаштування, що використовується під час онбордингу, відкладеного запуску каналу та read-only виявлення стану каналу/SecretRef. Має залишатися всередині каталогу пакета plugin. |
| `openclaw.runtimeSetupEntry`                                      | Оголошує built JavaScript entrypoint налаштування для встановлених пакетів. Має залишатися всередині каталогу пакета plugin.                                                         |
| `openclaw.channel`                                                | Недорогі метадані каталогу каналу, як-от підписи, шляхи до документації, псевдоніми та текст для вибору.                                                                            |
| `openclaw.channel.configuredState`                                | Легкі метадані перевірки налаштованого стану, які можуть відповісти на запитання «чи вже існує налаштування лише через env?» без завантаження повного середовища виконання каналу. |
| `openclaw.channel.persistedAuthState`                             | Легкі метадані перевірки збереженого стану автентифікації, які можуть відповісти на запитання «чи вже виконано вхід?» без завантаження повного середовища виконання каналу.         |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Підказки встановлення/оновлення для bundled plugin і externally published plugin.                                                                                                     |
| `openclaw.install.defaultChoice`                                  | Бажаний шлях встановлення, коли доступно кілька джерел встановлення.                                                                                                                 |
| `openclaw.install.minHostVersion`                                 | Мінімальна підтримувана версія хоста OpenClaw із використанням нижньої межі semver, наприклад `>=2026.3.22`.                                                                       |
| `openclaw.install.allowInvalidConfigRecovery`                     | Дозволяє вузький шлях відновлення через перевстановлення bundled plugin, коли конфігурація невалідна.                                                                                |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Дозволяє поверхням каналу лише для налаштування завантажуватися до повного plugin каналу під час запуску.                                                                            |

`openclaw.install.minHostVersion` застосовується під час встановлення та
завантаження реєстру маніфестів. Невалідні значення відхиляються; новіші, але валідні значення пропускають
plugin на старіших хостах.

Plugin каналів мають надавати `openclaw.setupEntry`, коли перевірки статусу, списку каналів
або SecretRef повинні визначати налаштовані акаунти без завантаження повного
середовища виконання. Entrypoint налаштування має надавати метадані каналу разом із безпечними для налаштування
адаптерами конфігурації, статусу та секретів; мережеві клієнти, слухачі Gateway і
transport runtime слід залишати в основному entrypoint розширення.

Поля runtime entrypoint не скасовують перевірки меж пакета для полів
source entrypoint. Наприклад, `openclaw.runtimeExtensions` не може зробити
придатним до завантаження шлях `openclaw.extensions`, що виходить за межі пакета.

`openclaw.install.allowInvalidConfigRecovery` навмисно має вузьке призначення. Воно
не робить довільні зламані конфігурації придатними до встановлення. Наразі воно лише дозволяє потокам встановлення
відновлюватися після певних збоїв оновлення застарілого bundled plugin, таких як
відсутній шлях bundled plugin або застарілий запис `channels.<id>` для того самого
bundled plugin. Несуміжні помилки конфігурації все одно блокують встановлення й спрямовують операторів
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

Використовуйте це, коли потоки налаштування, doctor або configured-state потребують
недорогої перевірки автентифікації типу так/ні до завантаження повного plugin каналу.
Цільовий експорт має бути невеликою функцією, яка лише зчитує збережений стан; не
спрямовуйте її через повний barrel середовища виконання каналу.

`openclaw.channel.configuredState` має ту саму форму для недорогих перевірок
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

Використовуйте це, коли канал може визначити configured-state через env або інші
невеликі вхідні дані без середовища виконання. Якщо перевірці потрібне повне
розв’язання конфігурації або справжнє середовище виконання каналу, залиште цю логіку
в hook `config.hasConfiguredState` plugin.

## Пріоритет виявлення (дубльовані id plugin)

OpenClaw виявляє plugin із кількох коренів (bundled, глобальне встановлення, workspace, явно вибрані в конфігурації шляхи). Якщо два виявлені plugin мають однаковий `id`, зберігається лише маніфест із **найвищим пріоритетом**; дублікати з нижчим пріоритетом відкидаються замість завантаження поруч із ним.

Пріоритет, від найвищого до найнижчого:

1. **Вибраний конфігурацією** — шлях, явно закріплений у `plugins.entries.<id>`
2. **Bundled** — plugin, що постачаються з OpenClaw
3. **Глобальне встановлення** — plugin, встановлені в глобальний корінь plugin OpenClaw
4. **Workspace** — plugin, виявлені відносно поточного workspace

Наслідки:

- Розгалужена або застаріла копія bundled plugin, що лежить у workspace, не замінить bundled-збірку.
- Щоб справді перевизначити bundled plugin локальним, закріпіть його через `plugins.entries.<id>`, щоб він переміг за пріоритетом, а не покладався на виявлення в workspace.
- Відкидання дублікатів журналюється, щоб Doctor і діагностика під час запуску могли вказати на відкинуту копію.

## Вимоги до JSON Schema

- **Кожен plugin має постачатися з JSON Schema**, навіть якщо він не приймає конфігурацію.
- Порожня schema припустима (наприклад, `{ "type": "object", "additionalProperties": false }`).
- Schemas проходять валідацію під час читання/запису конфігурації, а не під час виконання.

## Поведінка валідації

- Невідомі ключі `channels.*` є **помилками**, якщо тільки id каналу не оголошено
  маніфестом plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` і `plugins.slots.*`
  мають посилатися на **виявлювані** id plugin. Невідомі id є **помилками**.
- Якщо plugin встановлено, але має зламаний або відсутній маніфест чи schema,
  валідація завершується помилкою, а Doctor повідомляє про помилку plugin.
- Якщо конфігурація plugin існує, але plugin **вимкнений**, конфігурація зберігається, і
  в Doctor + журналах з’являється **попередження**.

Повну schema `plugins.*` див. у [Довіднику з конфігурації](/uk/gateway/configuration).

## Примітки

- Маніфест **обов’язковий для власних Plugin OpenClaw**, включно із завантаженням із локальної файлової системи.
- Середовище виконання все одно окремо завантажує модуль plugin; маніфест призначений лише для
  виявлення + валідації.
- Власні маніфести розбираються за допомогою JSON5, тому коментарі, кінцеві коми та
  ключі без лапок допускаються, якщо фінальне значення все ще є об’єктом.
- Завантажувач маніфесту зчитує лише документовані поля маніфесту. Уникайте додавання
  тут користувацьких ключів верхнього рівня.
- `providerAuthEnvVars` — це недорогий шлях метаданих для перевірок автентифікації, валідації
  env-marker і подібних поверхонь автентифікації provider, які не повинні запускати
  середовище виконання plugin лише для перевірки назв env.
- `providerAuthAliases` дозволяє варіантам provider повторно використовувати env vars автентифікації,
  профілі автентифікації, автентифікацію через конфігурацію та варіант онбордингу з API key
  іншого provider без жорсткого кодування цього зв’язку в ядрі.
- `providerEndpoints` дозволяє plugin provider володіти простими метаданими
  зіставлення хоста/baseUrl кінцевих точок. Використовуйте це лише для класів кінцевих точок, які ядро вже підтримує;
  фактична поведінка середовища виконання все одно належить plugin.
- `syntheticAuthRefs` — це недорогий шлях метаданих для synthetic auth hook, що належать provider,
  які мають бути видимими для холодного виявлення моделей до існування реєстру
  середовища виконання. Перелічуйте лише ті refs, чий provider середовища виконання або CLI backend
  справді реалізує `resolveSyntheticAuth`.
- `nonSecretAuthMarkers` — це недорогий шлях метаданих для значень-заповнювачів API key,
  що належать bundled plugin, наприклад для локальних, OAuth або ambient credential marker.
  Ядро трактує їх як не-секрети для відображення автентифікації та аудиту секретів без
  жорсткого кодування provider-власника.
- `channelEnvVars` — це недорогий шлях метаданих для shell-env fallback, підказок
  налаштування та подібних поверхонь каналу, які не повинні запускати середовище виконання plugin
  лише для перевірки назв env. Назви env — це метадані, а не активація самі по
  собі: статус, аудит, валідація доставки Cron лише для читання та інші
  поверхні все одно застосовують політику довіри до plugin та ефективної активації, перш ніж
  розглядати env var як налаштований канал.
- `providerAuthChoices` — це недорогий шлях метаданих для засобів вибору варіантів автентифікації,
  визначення `--auth-choice`, зіставлення preferred-provider і простої реєстрації
  CLI flag для онбордингу до завантаження середовища виконання provider. Для метаданих runtime wizard,
  що потребують коду provider, див.
  [Runtime hooks provider](/uk/plugins/architecture#provider-runtime-hooks).
- Виключні типи plugin вибираються через `plugins.slots.*`.
  - `kind: "memory"` вибирається через `plugins.slots.memory`.
  - `kind: "context-engine"` вибирається через `plugins.slots.contextEngine`
    (типово: вбудований `legacy`).
- `channels`, `providers`, `cliBackends` і `skills` можна пропустити, якщо
  plugin вони не потрібні.
- Якщо ваш plugin залежить від власних модулів, задокументуйте кроки збірки та всі
  вимоги до allowlist менеджера пакетів (наприклад, pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Пов’язане

- [Створення Plugins](/uk/plugins/building-plugins) — початок роботи з plugins
- [Архітектура Plugin](/uk/plugins/architecture) — внутрішня архітектура
- [Огляд SDK](/uk/plugins/sdk-overview) — довідник по SDK Plugin
