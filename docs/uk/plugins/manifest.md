---
read_when:
    - Ви створюєте Plugin для OpenClaw
    - Вам потрібно підготувати схему конфігурації plugin або налагодити помилки валідації plugin
summary: Вимоги до маніфесту Plugin + JSON schema (сувора валідація конфігурації)
title: Маніфест Plugin
x-i18n:
    generated_at: "2026-04-18T20:10:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2dfc00759108ddee7bfcda8c42acf7f2d47451676447ba3caf8b5950f8a1c181
    source_path: plugins/manifest.md
    workflow: 15
---

# Маніфест Plugin (`openclaw.plugin.json`)

Ця сторінка стосується лише **власного маніфесту Plugin OpenClaw**.

Сумісні макети bundle описано тут: [Plugin bundles](/uk/plugins/bundles).

Сумісні формати bundle використовують інші файли маніфесту:

- Codex bundle: `.codex-plugin/plugin.json`
- Claude bundle: `.claude-plugin/plugin.json` або стандартний макет компонента Claude
  без маніфесту
- Cursor bundle: `.cursor-plugin/plugin.json`

OpenClaw також автоматично визначає ці макети bundle, але вони не проходять валідацію
за схемою `openclaw.plugin.json`, описаною тут.

Для сумісних bundle OpenClaw наразі зчитує метадані bundle, а також оголошені
корені skill, корені команд Claude, типові значення `settings.json` для Claude bundle,
типові значення LSP для Claude bundle і підтримувані набори hook, коли макет відповідає
очікуванням середовища виконання OpenClaw.

Кожен власний Plugin OpenClaw **повинен** містити файл `openclaw.plugin.json` у
**корені plugin**. OpenClaw використовує цей маніфест для валідації конфігурації
**без виконання коду plugin**. Відсутні або некоректні маніфести вважаються
помилками plugin і блокують валідацію конфігурації.

Див. повний посібник із системи plugin: [Plugins](/uk/tools/plugin).
Для власної моделі можливостей і поточних рекомендацій щодо зовнішньої сумісності:
[Модель можливостей](/uk/plugins/architecture#public-capability-model).

## Для чого потрібен цей файл

`openclaw.plugin.json` — це метадані, які OpenClaw зчитує перед завантаженням коду
вашого plugin.

Використовуйте його для:

- ідентифікації plugin
- валідації конфігурації
- метаданих автентифікації та онбордингу, які мають бути доступні без запуску
  середовища виконання plugin
- недорогих підказок активації, які поверхні control plane можуть перевіряти до
  завантаження середовища виконання
- недорогих дескрипторів налаштування, які поверхні setup/онбордингу можуть
  перевіряти до завантаження середовища виконання
- метаданих псевдонімів і автоматичного ввімкнення, які мають визначатися до
  завантаження середовища виконання plugin
- скорочених метаданих належності до сімейства моделей, які мають автоматично
  активувати plugin до завантаження середовища виконання
- статичних знімків належності можливостей, що використовуються для вбудованого
  wiring сумісності та покриття контрактів
- недорогих метаданих QA runner, які спільний хост `openclaw qa` може перевіряти
  до завантаження середовища виконання plugin
- метаданих конфігурації, специфічних для channel, які мають об’єднуватися в
  поверхнях каталогу й валідації без завантаження середовища виконання
- підказок UI конфігурації

Не використовуйте його для:

- реєстрації поведінки середовища виконання
- оголошення entrypoint коду
- метаданих встановлення npm

Це має належати вашому коду plugin і `package.json`.

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

| Поле                                | Обов’язкове | Тип                              | Що воно означає                                                                                                                                                                                              |
| ----------------------------------- | ----------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                | Так         | `string`                         | Канонічний id plugin. Це id, який використовується в `plugins.entries.<id>`.                                                                                                                                |
| `configSchema`                      | Так         | `object`                         | Вбудована JSON Schema для конфігурації цього plugin.                                                                                                                                                         |
| `enabledByDefault`                  | Ні          | `true`                           | Позначає вбудований plugin як увімкнений за замовчуванням. Не вказуйте його або встановіть будь-яке значення, відмінне від `true`, щоб plugin залишався вимкненим за замовчуванням.                        |
| `legacyPluginIds`                   | Ні          | `string[]`                       | Застарілі id, які нормалізуються до цього канонічного id plugin.                                                                                                                                             |
| `autoEnableWhenConfiguredProviders` | Ні          | `string[]`                       | Id provider, які мають автоматично вмикати цей plugin, коли автентифікація, конфігурація або посилання на моделі згадують їх.                                                                               |
| `kind`                              | Ні          | `"memory"` \| `"context-engine"` | Оголошує ексклюзивний тип plugin, який використовується в `plugins.slots.*`.                                                                                                                                 |
| `channels`                          | Ні          | `string[]`                       | Id channel, якими володіє цей plugin. Використовується для виявлення та валідації конфігурації.                                                                                                             |
| `providers`                         | Ні          | `string[]`                       | Id provider, якими володіє цей plugin.                                                                                                                                                                       |
| `modelSupport`                      | Ні          | `object`                         | Скорочені метадані сімейства моделей, що належать маніфесту й використовуються для автоматичного завантаження plugin до запуску середовища виконання.                                                      |
| `providerEndpoints`                 | Ні          | `object[]`                       | Метадані host/baseUrl endpoint, що належать маніфесту, для маршрутів provider, які core має класифікувати до завантаження середовища виконання provider.                                                   |
| `cliBackends`                       | Ні          | `string[]`                       | Id backend CLI, якими володіє цей plugin. Використовується для автоматичної активації під час запуску з явних посилань у конфігурації.                                                                     |
| `syntheticAuthRefs`                 | Ні          | `string[]`                       | Посилання на provider або backend CLI, для яких слід перевіряти власний synthetic auth hook plugin під час холодного виявлення моделей до завантаження середовища виконання.                              |
| `nonSecretAuthMarkers`              | Ні          | `string[]`                       | Значення-заповнювачі API key, що належать вбудованому plugin і позначають несекретний локальний стан, OAuth або ambient credential state.                                                                  |
| `commandAliases`                    | Ні          | `object[]`                       | Назви команд, якими володіє цей plugin і які мають створювати діагностику конфігурації та CLI з урахуванням plugin до завантаження середовища виконання.                                                   |
| `providerAuthEnvVars`               | Ні          | `Record<string, string[]>`       | Легкі метадані env для автентифікації provider, які OpenClaw може перевіряти без завантаження коду plugin.                                                                                                 |
| `providerAuthAliases`               | Ні          | `Record<string, string>`         | Id provider, які мають повторно використовувати інший id provider для пошуку автентифікації, наприклад coding provider, що використовує той самий API key і профілі автентифікації базового provider.    |
| `channelEnvVars`                    | Ні          | `Record<string, string[]>`       | Легкі метадані env для channel, які OpenClaw може перевіряти без завантаження коду plugin. Використовуйте це для поверхонь налаштування або автентифікації channel на основі env, які мають бачити типові helper запуску/конфігурації. |
| `providerAuthChoices`               | Ні          | `object[]`                       | Легкі метадані варіантів автентифікації для picker онбордингу, визначення preferred provider і простого wiring прапорців CLI.                                                                              |
| `activation`                        | Ні          | `object`                         | Легкі підказки активації для завантаження, що запускається provider, командами, channel, маршрутами й можливостями. Лише метадані; фактичною поведінкою як і раніше володіє середовище виконання plugin. |
| `setup`                             | Ні          | `object`                         | Легкі дескриптори setup/онбордингу, які поверхні виявлення й налаштування можуть перевіряти без завантаження середовища виконання plugin.                                                                  |
| `qaRunners`                         | Ні          | `object[]`                       | Легкі дескриптори QA runner, які використовуються спільним хостом `openclaw qa` до завантаження середовища виконання plugin.                                                                              |
| `contracts`                         | Ні          | `object`                         | Статичний знімок вбудованих можливостей для speech, транскрипції в реальному часі, голосу в реальному часі, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search і належності tool. |
| `channelConfigs`                    | Ні          | `Record<string, object>`         | Метадані конфігурації channel, що належать маніфесту й об’єднуються в поверхнях виявлення та валідації до завантаження середовища виконання.                                                               |
| `skills`                            | Ні          | `string[]`                       | Каталоги Skills для завантаження, відносно кореня plugin.                                                                                                                                                    |
| `name`                              | Ні          | `string`                         | Людинозрозуміла назва plugin.                                                                                                                                                                                |
| `description`                       | Ні          | `string`                         | Короткий опис, який показується в поверхнях plugin.                                                                                                                                                          |
| `version`                           | Ні          | `string`                         | Інформаційна версія plugin.                                                                                                                                                                                  |
| `uiHints`                           | Ні          | `Record<string, object>`         | Підказки UI для міток, placeholder і чутливості полів конфігурації.                                                                                                                                          |

## Довідник `providerAuthChoices`

Кожен запис `providerAuthChoices` описує один варіант онбордингу або автентифікації.
OpenClaw зчитує це до завантаження середовища виконання provider.

| Поле                  | Обов’язкове | Тип                                             | Що воно означає                                                                                           |
| --------------------- | ----------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `provider`            | Так         | `string`                                        | Id provider, до якого належить цей варіант.                                                               |
| `method`              | Так         | `string`                                        | Id методу автентифікації, до якого слід спрямовувати.                                                     |
| `choiceId`            | Так         | `string`                                        | Стабільний id варіанта автентифікації, який використовується в онбордингу та потоках CLI.                |
| `choiceLabel`         | Ні          | `string`                                        | Мітка для користувача. Якщо не вказано, OpenClaw використовує `choiceId`.                                 |
| `choiceHint`          | Ні          | `string`                                        | Короткий допоміжний текст для picker.                                                                     |
| `assistantPriority`   | Ні          | `number`                                        | Нижчі значення сортуються раніше в інтерактивних picker, керованих асистентом.                            |
| `assistantVisibility` | Ні          | `"visible"` \| `"manual-only"`                  | Приховує варіант із picker асистента, але все одно дозволяє ручний вибір через CLI.                      |
| `deprecatedChoiceIds` | Ні          | `string[]`                                      | Застарілі id варіантів, які мають перенаправляти користувачів на цей варіант-заміну.                     |
| `groupId`             | Ні          | `string`                                        | Необов’язковий id групи для групування пов’язаних варіантів.                                              |
| `groupLabel`          | Ні          | `string`                                        | Мітка для цієї групи, видима користувачу.                                                                 |
| `groupHint`           | Ні          | `string`                                        | Короткий допоміжний текст для групи.                                                                      |
| `optionKey`           | Ні          | `string`                                        | Внутрішній ключ параметра для простих потоків автентифікації з одним прапорцем.                           |
| `cliFlag`             | Ні          | `string`                                        | Назва прапорця CLI, наприклад `--openrouter-api-key`.                                                     |
| `cliOption`           | Ні          | `string`                                        | Повна форма параметра CLI, наприклад `--openrouter-api-key <key>`.                                        |
| `cliDescription`      | Ні          | `string`                                        | Опис, який використовується в довідці CLI.                                                                |
| `onboardingScopes`    | Ні          | `Array<"text-inference" \| "image-generation">` | На яких поверхнях онбордингу має з’являтися цей варіант. Якщо не вказано, за замовчуванням використовується `["text-inference"]`. |

## Довідник `commandAliases`

Використовуйте `commandAliases`, коли plugin володіє назвою команди середовища
виконання, яку користувачі можуть помилково додати в `plugins.allow` або
спробувати запустити як кореневу команду CLI. OpenClaw використовує ці метадані
для діагностики без імпорту коду середовища виконання plugin.

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

| Поле         | Обов’язкове | Тип               | Що воно означає                                                        |
| ------------ | ----------- | ----------------- | ---------------------------------------------------------------------- |
| `name`       | Так         | `string`          | Назва команди, яка належить цьому plugin.                              |
| `kind`       | Ні          | `"runtime-slash"` | Позначає псевдонім як slash-команду чату, а не кореневу команду CLI.   |
| `cliCommand` | Ні          | `string`          | Пов’язана коренева команда CLI, яку слід запропонувати для операцій CLI, якщо така існує. |

## Довідник `activation`

Використовуйте `activation`, коли plugin може недорого оголосити, які події
control plane мають активувати його пізніше.

## Довідник `qaRunners`

Використовуйте `qaRunners`, коли plugin додає один або кілька transport runner
під спільним коренем `openclaw qa`. Зберігайте ці метадані легкими та
статичними; фактичною реєстрацією CLI все одно володіє середовище виконання
plugin через легку поверхню `runtime-api.ts`, яка експортує
`qaRunnerCliRegistrations`.

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

Цей блок містить лише метадані. Він не реєструє поведінку середовища
виконання і не замінює `register(...)`, `setupEntry` або інші runtime/plugin
entrypoint.

Поточні споживачі використовують його як підказку для звуження перед ширшим
завантаженням plugin, тому відсутність метаданих активації зазвичай впливає
лише на продуктивність; це не повинно змінювати коректність, доки ще існують
застарілі резервні механізми належності маніфесту.

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
| `onProviders`    | Ні          | `string[]`                                           | Id provider, які мають активувати цей plugin за запитом.             |
| `onCommands`     | Ні          | `string[]`                                           | Id команд, які мають активувати цей plugin.                          |
| `onChannels`     | Ні          | `string[]`                                           | Id channel, які мають активувати цей plugin.                         |
| `onRoutes`       | Ні          | `string[]`                                           | Типи маршрутів, які мають активувати цей plugin.                     |
| `onCapabilities` | Ні          | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Загальні підказки можливостей, що використовуються в плануванні активації control plane. |

Поточні live-споживачі:

- CLI-планування, запущене командою, використовує застарілий резервний механізм
  `commandAliases[].cliCommand` або `commandAliases[].name`
- setup/channel-планування, запущене channel, використовує застарілий резервний
  механізм належності `channels[]`, якщо явні метадані активації channel відсутні
- setup/runtime-планування, запущене provider, використовує застарілий резервний
  механізм належності `providers[]` і верхньорівневого `cliBackends[]`, якщо
  явні метадані активації provider відсутні

## Довідник `setup`

Використовуйте `setup`, коли поверхням setup і онбордингу потрібні недорогі
метадані plugin-власника до завантаження середовища виконання.

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

Верхньорівневий `cliBackends` залишається чинним і, як і раніше, описує
backend виведення CLI. `setup.cliBackends` — це поверхня дескрипторів,
специфічна для setup, для потоків control plane/setup, яка має залишатися лише
метаданими.

Якщо присутні, `setup.providers` і `setup.cliBackends` є пріоритетною
поверхнею пошуку setup у підході descriptor-first. Якщо дескриптор лише звужує
кандидатний plugin, а setup усе ще потребує багатших runtime hook на етапі
setup, установіть `requiresRuntime: true` і залиште `setup-api` як резервний
шлях виконання.

Оскільки пошук setup може виконувати plugin-власний код `setup-api`,
нормалізовані значення `setup.providers[].id` і `setup.cliBackends[]` мають
залишатися унікальними серед виявлених plugin. Неоднозначна належність
завершується безпечним блокуванням, а не вибором переможця за порядком
виявлення.

### Довідник `setup.providers`

| Поле          | Обов’язкове | Тип        | Що воно означає                                                                     |
| ------------- | ----------- | ---------- | ----------------------------------------------------------------------------------- |
| `id`          | Так         | `string`   | Id provider, який надається під час setup або онбордингу. Зберігайте нормалізовані id глобально унікальними. |
| `authMethods` | Ні          | `string[]` | Id методів setup/автентифікації, які цей provider підтримує без завантаження повного середовища виконання. |
| `envVars`     | Ні          | `string[]` | Env vars, які типові поверхні setup/status можуть перевіряти до завантаження середовища виконання plugin. |

### Поля `setup`

| Поле               | Обов’язкове | Тип        | Що воно означає                                                                                      |
| ------------------ | ----------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| `providers`        | Ні          | `object[]` | Дескриптори setup provider, доступні під час setup і онбордингу.                                     |
| `cliBackends`      | Ні          | `string[]` | Id backend на етапі setup, що використовуються для пошуку setup у підході descriptor-first. Зберігайте нормалізовані id глобально унікальними. |
| `configMigrations` | Ні          | `string[]` | Id міграцій конфігурації, якими володіє поверхня setup цього plugin.                                 |
| `requiresRuntime`  | Ні          | `boolean`  | Чи setup усе ще потребує виконання `setup-api` після пошуку за дескриптором.                         |

## Довідник `uiHints`

`uiHints` — це мапа від назв полів конфігурації до невеликих підказок
відображення.

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

| Поле          | Тип        | Що воно означає                          |
| ------------- | ---------- | ---------------------------------------- |
| `label`       | `string`   | Мітка поля, видима користувачу.          |
| `help`        | `string`   | Короткий допоміжний текст.               |
| `tags`        | `string[]` | Необов’язкові теги UI.                   |
| `advanced`    | `boolean`  | Позначає поле як розширене.              |
| `sensitive`   | `boolean`  | Позначає поле як секретне або чутливе.   |
| `placeholder` | `string`   | Текст placeholder для полів форми.       |

## Довідник `contracts`

Використовуйте `contracts` лише для статичних метаданих належності
можливостей, які OpenClaw може зчитувати без імпорту середовища виконання
plugin.

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

| Поле                             | Тип        | Що воно означає                                             |
| -------------------------------- | ---------- | ----------------------------------------------------------- |
| `speechProviders`                | `string[]` | Id speech provider, якими володіє цей plugin.               |
| `realtimeTranscriptionProviders` | `string[]` | Id provider транскрипції в реальному часі, якими володіє цей plugin. |
| `realtimeVoiceProviders`         | `string[]` | Id provider голосу в реальному часі, якими володіє цей plugin. |
| `mediaUnderstandingProviders`    | `string[]` | Id provider media-understanding, якими володіє цей plugin.  |
| `imageGenerationProviders`       | `string[]` | Id provider image-generation, якими володіє цей plugin.     |
| `videoGenerationProviders`       | `string[]` | Id provider video-generation, якими володіє цей plugin.     |
| `webFetchProviders`              | `string[]` | Id provider web-fetch, якими володіє цей plugin.            |
| `webSearchProviders`             | `string[]` | Id provider web search, якими володіє цей plugin.           |
| `tools`                          | `string[]` | Назви tool агента, якими володіє цей plugin, для перевірок вбудованих контрактів. |

## Довідник `channelConfigs`

Використовуйте `channelConfigs`, коли channel plugin потребує недорогих
метаданих конфігурації до завантаження середовища виконання.

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

| Поле          | Тип                      | Що воно означає                                                                                |
| ------------- | ------------------------ | ---------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema для `channels.<id>`. Обов’язкове для кожного оголошеного запису конфігурації channel. |
| `uiHints`     | `Record<string, object>` | Необов’язкові підказки UI для міток/placeholder/чутливості для цього розділу конфігурації channel. |
| `label`       | `string`                 | Мітка channel, яка об’єднується в поверхнях picker та inspect, коли runtime-метадані ще не готові. |
| `description` | `string`                 | Короткий опис channel для поверхонь inspect і каталогу.                                        |
| `preferOver`  | `string[]`               | Id застарілих або менш пріоритетних plugin, які цей channel має випереджати в поверхнях вибору. |

## Довідник `modelSupport`

Використовуйте `modelSupport`, коли OpenClaw має визначати ваш provider plugin
за скороченими id моделей, наприклад `gpt-5.4` або `claude-sonnet-4.6`, до
завантаження середовища виконання plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw застосовує такий пріоритет:

- явні посилання `provider/model` використовують метадані маніфесту `providers`
  відповідного власника
- `modelPatterns` мають пріоритет над `modelPrefixes`
- якщо збігаються один невбудований plugin і один вбудований plugin, перемагає
  невбудований plugin
- решта неоднозначностей ігнорується, доки користувач або конфігурація не
  вкажуть provider

Поля:

| Поле            | Тип        | Що воно означає                                                                  |
| --------------- | ---------- | -------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Префікси, які звіряються через `startsWith` зі скороченими id моделей.          |
| `modelPatterns` | `string[]` | Джерела regex, які звіряються зі скороченими id моделей після видалення суфікса профілю. |

Застарілі ключі можливостей верхнього рівня не рекомендовані. Використовуйте
`openclaw doctor --fix`, щоб перенести `speechProviders`,
`realtimeTranscriptionProviders`, `realtimeVoiceProviders`,
`mediaUnderstandingProviders`, `imageGenerationProviders`,
`videoGenerationProviders`, `webFetchProviders` і `webSearchProviders` у
`contracts`; звичайне завантаження маніфесту більше не розглядає ці
верхньорівневі поля як належність можливостей.

## Маніфест і `package.json`

Ці два файли виконують різні завдання:

| Файл                   | Для чого використовувати                                                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Виявлення, валідація конфігурації, метадані варіантів автентифікації та підказки UI, які мають існувати до запуску коду plugin      |
| `package.json`         | Метадані npm, встановлення залежностей і блок `openclaw`, який використовується для entrypoint, обмежень встановлення, setup або метаданих каталогу |

Якщо ви не впевнені, куди має належати певний фрагмент метаданих, користуйтеся
таким правилом:

- якщо OpenClaw має знати це до завантаження коду plugin, помістіть це в `openclaw.plugin.json`
- якщо це стосується пакування, entry-файлів або поведінки встановлення npm, помістіть це в `package.json`

### Поля `package.json`, які впливають на виявлення

Деякі метадані plugin до запуску середовища виконання навмисно зберігаються в
`package.json` у блоці `openclaw`, а не в `openclaw.plugin.json`.

Важливі приклади:

| Поле                                                              | Що воно означає                                                                                                                               |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Оголошує власні entrypoint plugin.                                                                                                            |
| `openclaw.setupEntry`                                             | Легкий entrypoint лише для setup, який використовується під час онбордингу та відкладеного запуску channel.                                  |
| `openclaw.channel`                                                | Легкі метадані каталогу channel, як-от мітки, шляхи документації, псевдоніми та тексти для вибору.                                           |
| `openclaw.channel.configuredState`                                | Легкі метадані перевірки configured-state для channel, які можуть відповісти на запитання «чи вже існує налаштування лише через env?» без завантаження повного runtime channel. |
| `openclaw.channel.persistedAuthState`                             | Легкі метадані перевірки persisted-auth, які можуть відповісти на запитання «чи вже є якийсь виконаний вхід?» без завантаження повного runtime channel. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Підказки встановлення/оновлення для вбудованих і зовнішньо опублікованих plugin.                                                              |
| `openclaw.install.defaultChoice`                                  | Бажаний шлях встановлення, коли доступно кілька джерел встановлення.                                                                          |
| `openclaw.install.minHostVersion`                                 | Мінімальна підтримувана версія хоста OpenClaw із нижньою межею semver, наприклад `>=2026.3.22`.                                              |
| `openclaw.install.allowInvalidConfigRecovery`                     | Дозволяє вузький шлях відновлення перевстановлення вбудованого plugin, коли конфігурація некоректна.                                         |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Дозволяє поверхням channel лише для setup завантажуватися до повного channel plugin під час запуску.                                         |

`openclaw.install.minHostVersion` застосовується під час встановлення та
завантаження реєстру маніфестів. Некоректні значення відхиляються; новіші, але
коректні значення пропускають plugin на старіших хостах.

`openclaw.install.allowInvalidConfigRecovery` навмисно має вузьке застосування.
Він не робить довільні зламані конфігурації придатними до встановлення. Наразі
він лише дозволяє потокам встановлення відновлюватися після окремих збоїв
оновлення застарілого вбудованого plugin, наприклад відсутнього шляху до
вбудованого plugin або застарілого запису `channels.<id>` для цього самого
вбудованого plugin. Непов’язані помилки конфігурації все одно блокують
встановлення й спрямовують операторів до `openclaw doctor --fix`.

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

Використовуйте це, коли потокам setup, doctor або configured-state потрібна
недорога перевірка автентифікації типу так/ні до завантаження повного channel
plugin. Цільовий експорт має бути невеликою функцією, яка зчитує лише
persisted state; не спрямовуйте його через повну runtime-barrel channel.

`openclaw.channel.configuredState` має таку саму форму для недорогих перевірок
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

Використовуйте це, коли channel може визначити configured-state за env або
іншими невеликими нерuntime-вхідними даними. Якщо перевірка потребує повного
визначення конфігурації або справжнього runtime channel, залиште цю логіку в
hook plugin `config.hasConfiguredState`.

## Вимоги до JSON Schema

- **Кожен plugin повинен містити JSON Schema**, навіть якщо він не приймає конфігурацію.
- Порожня схема допустима (наприклад, `{ "type": "object", "additionalProperties": false }`).
- Схеми проходять валідацію під час читання/запису конфігурації, а не під час runtime.

## Поведінка валідації

- Невідомі ключі `channels.*` є **помилками**, якщо тільки id channel не оголошено
  в маніфесті plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` і `plugins.slots.*`
  мають посилатися на id plugin, які **можна виявити**. Невідомі id є **помилками**.
- Якщо plugin установлено, але він має зламаний або відсутній маніфест чи схему,
  валідація завершується помилкою, а Doctor повідомляє про помилку plugin.
- Якщо конфігурація plugin існує, але plugin **вимкнено**, конфігурація
  зберігається, а в Doctor і логах з’являється **попередження**.

Повну схему `plugins.*` див. у [Довіднику з конфігурації](/uk/gateway/configuration).

## Примітки

- Маніфест є **обов’язковим для власних Plugin OpenClaw**, зокрема для завантажень із локальної файлової системи.
- Runtime усе одно завантажує модуль plugin окремо; маніфест використовується лише для
  виявлення + валідації.
- Власні маніфести аналізуються за допомогою JSON5, тому коментарі, кінцеві коми й
  ключі без лапок приймаються, доки фінальне значення все ще є об’єктом.
- Завантажувач маніфесту зчитує лише задокументовані поля маніфесту. Уникайте
  додавання тут власних верхньорівневих ключів.
- `providerAuthEnvVars` — це недорогий шлях метаданих для перевірок автентифікації,
  валідації env-marker та подібних поверхонь автентифікації provider, які не повинні
  запускати runtime plugin лише для перевірки назв env.
- `providerAuthAliases` дає змогу варіантам provider повторно використовувати env vars
  автентифікації іншого provider, профілі автентифікації, автентифікацію на основі
  конфігурації та варіант онбордингу API key без жорсткого кодування цього зв’язку в core.
- `providerEndpoints` дає змогу plugin provider володіти простими метаданими зіставлення
  host/baseUrl endpoint. Використовуйте це лише для класів endpoint, які core вже
  підтримує; фактичною runtime-поведінкою все одно володіє plugin.
- `syntheticAuthRefs` — це недорогий шлях метаданих для власних synthetic auth hook
  provider, які мають бути видимими для холодного виявлення моделей до появи runtime-реєстру.
  Указуйте лише ті посилання, чий runtime provider або backend CLI справді реалізує
  `resolveSyntheticAuth`.
- `nonSecretAuthMarkers` — це недорогий шлях метаданих для значень-заповнювачів API key,
  що належать вбудованому plugin, наприклад локальних маркерів, OAuth або ambient credential.
  Core розглядає їх як несекретні для відображення автентифікації та аудиту секретів без
  жорсткого кодування provider-власника.
- `channelEnvVars` — це недорогий шлях метаданих для резервного використання shell-env,
  запитів setup і подібних поверхонь channel, які не повинні запускати runtime plugin
  лише для перевірки назв env.
- `providerAuthChoices` — це недорогий шлях метаданих для picker варіантів автентифікації,
  визначення `--auth-choice`, мапінгу preferred provider і простої реєстрації прапорців CLI
  онбордингу до завантаження runtime provider. Метадані runtime wizard, які потребують коду
  provider, див. у
  [runtime hook provider](/uk/plugins/architecture#provider-runtime-hooks).
- Ексклюзивні типи plugin вибираються через `plugins.slots.*`.
  - `kind: "memory"` вибирається через `plugins.slots.memory`.
  - `kind: "context-engine"` вибирається через `plugins.slots.contextEngine`
    (типове значення: вбудований `legacy`).
- `channels`, `providers`, `cliBackends` і `skills` можна не вказувати, якщо
  plugin їх не потребує.
- Якщо ваш plugin залежить від власних модулів, задокументуйте кроки збірки та всі
  вимоги до allowlist менеджера пакетів (наприклад, pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Пов’язане

- [Створення Plugins](/uk/plugins/building-plugins) — початок роботи з plugin
- [Архітектура Plugin](/uk/plugins/architecture) — внутрішня архітектура
- [Огляд SDK](/uk/plugins/sdk-overview) — довідник по Plugin SDK
