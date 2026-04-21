---
read_when:
    - Ви створюєте Plugin для OpenClaw
    - Вам потрібно постачати схему конфігурації plugin або налагоджувати помилки валідації plugin
summary: Вимоги до маніфесту Plugin та JSON schema (сувора валідація конфігурації)
title: Маніфест Plugin
x-i18n:
    generated_at: "2026-04-21T20:37:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3664a984ac283378e11a76a68dfa320dc4d5a2aa40d973c731eb31e87d6eeeef
    source_path: plugins/manifest.md
    workflow: 15
---

# Маніфест Plugin (`openclaw.plugin.json`)

Ця сторінка стосується лише **власного маніфесту Plugin OpenClaw**.

Сумісні компонування bundle описано в [Plugin bundles](/uk/plugins/bundles).

Сумісні формати bundle використовують інші файли маніфесту:

- bundle Codex: `.codex-plugin/plugin.json`
- bundle Claude: `.claude-plugin/plugin.json` або стандартне компонування компонента Claude
  без маніфесту
- bundle Cursor: `.cursor-plugin/plugin.json`

OpenClaw також автоматично виявляє ці компонування bundle, але вони не проходять валідацію
за схемою `openclaw.plugin.json`, описаною тут.

Для сумісних bundle OpenClaw наразі читає метадані bundle разом з оголошеними
коренями skill, коренями команд Claude, типовими значеннями `settings.json` bundle Claude,
типовими значеннями LSP bundle Claude та підтримуваними наборами hook, коли компонування відповідає
очікуванням середовища виконання OpenClaw.

Кожен власний Plugin OpenClaw **повинен** постачатися з файлом `openclaw.plugin.json` у
**корені plugin**. OpenClaw використовує цей маніфест для валідації конфігурації
**без виконання коду plugin**. Відсутні або невалідні маніфести вважаються
помилками plugin і блокують валідацію конфігурації.

Повний посібник із системи plugin див. у: [Plugins](/uk/tools/plugin).
Про власну модель можливостей і поточні рекомендації щодо зовнішньої сумісності:
[Модель можливостей](/uk/plugins/architecture#public-capability-model).

## Що робить цей файл

`openclaw.plugin.json` — це метадані, які OpenClaw читає перед завантаженням
коду вашого plugin.

Використовуйте його для:

- ідентичності plugin
- валідації конфігурації
- метаданих auth та onboarding, які мають бути доступні без запуску середовища виконання plugin
- недорогих підказок активації, які поверхні control-plane можуть перевіряти до завантаження runtime
- недорогих дескрипторів налаштування, які поверхні setup/onboarding можуть перевіряти до завантаження runtime
- метаданих alias та auto-enable, які мають розв’язуватися до завантаження runtime plugin
- скорочених метаданих про належність до сімейства моделей, які мають автоматично активувати
  plugin до завантаження runtime
- статичних знімків належності можливостей, що використовуються для вбудованого compat-зв’язування та
  покриття контрактів
- недорогих метаданих QA runner, які спільний хост `openclaw qa` може перевіряти
  до завантаження runtime plugin
- метаданих конфігурації, специфічних для channel, які мають об’єднуватися з поверхнями каталогу та валідації без завантаження runtime
- підказок UI для конфігурації

Не використовуйте його для:

- реєстрації поведінки runtime
- оголошення code entrypoint
- метаданих встановлення npm

Це належить до коду вашого plugin та `package.json`.

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

| Поле                                | Обов’язкове | Тип                              | Що воно означає                                                                                                                                                                                               |
| ----------------------------------- | ----------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                | Так         | `string`                         | Канонічний ідентифікатор plugin. Це ідентифікатор, що використовується в `plugins.entries.<id>`.                                                                                                            |
| `configSchema`                      | Так         | `object`                         | Вбудована JSON Schema для конфігурації цього plugin.                                                                                                                                                          |
| `enabledByDefault`                  | Ні          | `true`                           | Позначає вбудований plugin як увімкнений типово. Не вказуйте це поле або задайте будь-яке значення, відмінне від `true`, щоб plugin залишався типово вимкненим.                                             |
| `legacyPluginIds`                   | Ні          | `string[]`                       | Застарілі ідентифікатори, які нормалізуються до цього канонічного ідентифікатора plugin.                                                                                                                     |
| `autoEnableWhenConfiguredProviders` | Ні          | `string[]`                       | Ідентифікатори provider, які мають автоматично вмикати цей plugin, коли auth, конфігурація або посилання на моделі згадують їх.                                                                             |
| `kind`                              | Ні          | `"memory"` \| `"context-engine"` | Оголошує ексклюзивний вид plugin, який використовується в `plugins.slots.*`.                                                                                                                                 |
| `channels`                          | Ні          | `string[]`                       | Ідентифікатори channel, якими володіє цей plugin. Використовується для виявлення та валідації конфігурації.                                                                                                  |
| `providers`                         | Ні          | `string[]`                       | Ідентифікатори provider, якими володіє цей plugin.                                                                                                                                                            |
| `modelSupport`                      | Ні          | `object`                         | Скорочені метадані про сімейство моделей, що належать маніфесту й використовуються для автоматичного завантаження plugin до запуску runtime.                                                                 |
| `providerEndpoints`                 | Ні          | `object[]`                       | Метадані хостів/`baseUrl` endpoint, що належать маніфесту, для маршрутів provider, які core має класифікувати до завантаження runtime provider.                                                             |
| `cliBackends`                       | Ні          | `string[]`                       | Ідентифікатори backend CLI, якими володіє цей plugin. Використовується для автоактивації під час запуску на основі явних посилань у конфігурації.                                                          |
| `syntheticAuthRefs`                 | Ні          | `string[]`                       | Посилання на provider або backend CLI, для яких слід перевіряти синтетичний hook auth, що належить plugin, під час холодного виявлення моделей до завантаження runtime.                                    |
| `nonSecretAuthMarkers`              | Ні          | `string[]`                       | Значення-заповнювачі API key, що належать вбудованому plugin і представляють не секретний локальний стан, OAuth або ambient credential state.                                                               |
| `commandAliases`                    | Ні          | `object[]`                       | Імена команд, якими володіє цей plugin і які мають формувати діагностику конфігурації та CLI, обізнану про plugin, до завантаження runtime.                                                                 |
| `providerAuthEnvVars`               | Ні          | `Record<string, string[]>`       | Недорогі метадані env для auth provider, які OpenClaw може перевіряти без завантаження коду plugin.                                                                                                         |
| `providerAuthAliases`               | Ні          | `Record<string, string>`         | Ідентифікатори provider, які мають повторно використовувати інший ідентифікатор provider для пошуку auth, наприклад provider для кодування, що спільно використовує API key і профілі auth базового provider. |
| `channelEnvVars`                    | Ні          | `Record<string, string[]>`       | Недорогі метадані env для channel, які OpenClaw може перевіряти без завантаження коду plugin. Використовуйте це для поверхонь налаштування channel або auth, керованих env, які мають бачити типові допоміжні засоби запуску/конфігурації. |
| `providerAuthChoices`               | Ні          | `object[]`                       | Недорогі метадані вибору auth для picker під час onboarding, визначення бажаного provider та простого зв’язування прапорців CLI.                                                                             |
| `activation`                        | Ні          | `object`                         | Недорогі підказки активації для завантаження, що запускається provider, командою, channel, маршрутом або можливістю. Лише метадані; фактична поведінка все одно належить runtime plugin.                    |
| `setup`                             | Ні          | `object`                         | Недорогі дескриптори setup/onboarding, які поверхні виявлення та налаштування можуть перевіряти без завантаження runtime plugin.                                                                            |
| `qaRunners`                         | Ні          | `object[]`                       | Недорогі дескриптори QA runner, які використовує спільний хост `openclaw qa` до завантаження runtime plugin.                                                                                                |
| `contracts`                         | Ні          | `object`                         | Статичний знімок вбудованих можливостей для speech, realtime transcription, realtime voice, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search і належності tool. |
| `channelConfigs`                    | Ні          | `Record<string, object>`         | Метадані конфігурації channel, що належать маніфесту та об’єднуються з поверхнями виявлення й валідації до завантаження runtime.                                                                            |
| `skills`                            | Ні          | `string[]`                       | Каталоги Skills для завантаження, відносно кореня plugin.                                                                                                                                                    |
| `name`                              | Ні          | `string`                         | Людинозрозуміла назва plugin.                                                                                                                                                                                 |
| `description`                       | Ні          | `string`                         | Короткий опис, що показується в поверхнях plugin.                                                                                                                                                            |
| `version`                           | Ні          | `string`                         | Інформаційна версія plugin.                                                                                                                                                                                   |
| `uiHints`                           | Ні          | `Record<string, object>`         | Мітки UI, placeholders і підказки щодо чутливості для полів конфігурації.                                                                                                                                     |

## Довідник `providerAuthChoices`

Кожен запис `providerAuthChoices` описує один варіант onboarding або auth.
OpenClaw читає це до завантаження runtime provider.

| Поле                  | Обов’язкове | Тип                                             | Що воно означає                                                                                           |
| --------------------- | ----------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `provider`            | Так         | `string`                                        | Ідентифікатор provider, до якого належить цей варіант.                                                    |
| `method`              | Так         | `string`                                        | Ідентифікатор методу auth, до якого слід виконати диспетчеризацію.                                        |
| `choiceId`            | Так         | `string`                                        | Стабільний ідентифікатор варіанта auth, який використовується в потоках onboarding і CLI.                |
| `choiceLabel`         | Ні          | `string`                                        | Мітка для користувача. Якщо не вказано, OpenClaw використовує `choiceId` як запасний варіант.            |
| `choiceHint`          | Ні          | `string`                                        | Короткий допоміжний текст для picker.                                                                     |
| `assistantPriority`   | Ні          | `number`                                        | Менші значення сортуються раніше в інтерактивних picker, керованих асистентом.                            |
| `assistantVisibility` | Ні          | `"visible"` \| `"manual-only"`                  | Приховує варіант із picker асистента, але все ще дозволяє ручний вибір через CLI.                        |
| `deprecatedChoiceIds` | Ні          | `string[]`                                      | Застарілі ідентифікатори варіантів, які мають переспрямовувати користувачів до цього варіанта-заміни.    |
| `groupId`             | Ні          | `string`                                        | Необов’язковий ідентифікатор групи для групування пов’язаних варіантів.                                   |
| `groupLabel`          | Ні          | `string`                                        | Мітка для користувача для цієї групи.                                                                     |
| `groupHint`           | Ні          | `string`                                        | Короткий допоміжний текст для групи.                                                                      |
| `optionKey`           | Ні          | `string`                                        | Внутрішній ключ опції для простих потоків auth з одним прапорцем.                                         |
| `cliFlag`             | Ні          | `string`                                        | Назва прапорця CLI, наприклад `--openrouter-api-key`.                                                     |
| `cliOption`           | Ні          | `string`                                        | Повна форма опції CLI, наприклад `--openrouter-api-key <key>`.                                            |
| `cliDescription`      | Ні          | `string`                                        | Опис, який використовується в довідці CLI.                                                                |
| `onboardingScopes`    | Ні          | `Array<"text-inference" \| "image-generation">` | У яких поверхнях onboarding має з’являтися цей варіант. Якщо не вказано, типово використовується `["text-inference"]`. |

## Довідник `commandAliases`

Використовуйте `commandAliases`, коли plugin володіє назвою runtime-команди, яку користувачі можуть
помилково вказати в `plugins.allow` або спробувати запустити як кореневу команду CLI. OpenClaw
використовує ці метадані для діагностики без імпорту коду runtime plugin.

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

| Поле         | Обов’язкове | Тип               | Що воно означає                                                          |
| ------------ | ----------- | ----------------- | ------------------------------------------------------------------------ |
| `name`       | Так         | `string`          | Назва команди, яка належить цьому plugin.                                |
| `kind`       | Ні          | `"runtime-slash"` | Позначає alias як slash-команду чату, а не кореневу команду CLI.         |
| `cliCommand` | Ні          | `string`          | Пов’язана коренева команда CLI, яку слід запропонувати для операцій CLI, якщо вона існує. |

## Довідник `activation`

Використовуйте `activation`, коли plugin може дешево оголосити, які події control-plane
мають активувати його пізніше.

## Довідник `qaRunners`

Використовуйте `qaRunners`, коли plugin додає один або більше transport runner у межах
спільного кореня `openclaw qa`. Зберігайте ці метадані дешевими й статичними; runtime plugin
усе одно володіє фактичною реєстрацією CLI через легку поверхню
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

| Поле          | Обов’язкове | Тип      | Що воно означає                                                     |
| ------------- | ----------- | -------- | ------------------------------------------------------------------- |
| `commandName` | Так         | `string` | Підкоманда, змонтована в `openclaw qa`, наприклад `matrix`.         |
| `description` | Ні          | `string` | Резервний текст довідки, який використовується, коли спільному хосту потрібна stub-команда. |

Цей блок є лише метаданими. Він не реєструє поведінку runtime і не
замінює `register(...)`, `setupEntry` чи інші entrypoint runtime/plugin.
Поточні споживачі використовують його як підказку для звуження перед ширшим завантаженням plugin, тож
відсутність метаданих activation зазвичай лише погіршує продуктивність; вона не має
змінювати коректність, поки все ще існують резервні варіанти на основі застарілого володіння маніфестом.

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

| Поле             | Обов’язкове | Тип                                                  | Що воно означає                                                    |
| ---------------- | ----------- | ---------------------------------------------------- | ------------------------------------------------------------------ |
| `onProviders`    | Ні          | `string[]`                                           | Ідентифікатори provider, які мають активувати цей plugin за запитом. |
| `onCommands`     | Ні          | `string[]`                                           | Ідентифікатори команд, які мають активувати цей plugin.            |
| `onChannels`     | Ні          | `string[]`                                           | Ідентифікатори channel, які мають активувати цей plugin.           |
| `onRoutes`       | Ні          | `string[]`                                           | Види маршрутів, які мають активувати цей plugin.                   |
| `onCapabilities` | Ні          | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Загальні підказки можливостей, що використовуються під час планування активації control-plane. |

Поточні активні споживачі:

- планування CLI, запущене командою, використовує резервний варіант із застарілих
  `commandAliases[].cliCommand` або `commandAliases[].name`
- планування setup/channel, запущене channel, використовує резервний варіант із застарілого володіння
  `channels[]`, якщо явні метадані активації channel відсутні
- планування setup/runtime, запущене provider, використовує резервний варіант із застарілого
  володіння `providers[]` і `cliBackends[]` верхнього рівня, якщо явні метадані
  активації provider відсутні

## Довідник `setup`

Використовуйте `setup`, коли поверхням setup та onboarding потрібні дешеві метадані, що належать plugin,
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

`cliBackends` верхнього рівня залишається валідним і далі описує inference-backend CLI.
`setup.cliBackends` — це поверхня дескрипторів, специфічна для setup, для
потоків control-plane/setup, які мають залишатися лише метаданими.

Якщо вони присутні, `setup.providers` і `setup.cliBackends` є бажаною
поверхнею пошуку для виявлення setup за принципом descriptor-first. Якщо дескриптор лише
звужує кандидатний plugin, а setup все ще потребує більш насичених hook runtime на етапі setup,
установіть `requiresRuntime: true` і збережіть `setup-api` як
резервний шлях виконання.

Оскільки пошук setup може виконувати код `setup-api`, що належить plugin,
нормалізовані значення `setup.providers[].id` і `setup.cliBackends[]` мають залишатися унікальними серед
виявлених plugin. Неоднозначне володіння завершується безпечною відмовою замість вибору
переможця за порядком виявлення.

### Довідник `setup.providers`

| Поле          | Обов’язкове | Тип        | Що воно означає                                                                       |
| ------------- | ----------- | ---------- | ------------------------------------------------------------------------------------- |
| `id`          | Так         | `string`   | Ідентифікатор provider, який показується під час setup або onboarding. Зберігайте нормалізовані ідентифікатори глобально унікальними. |
| `authMethods` | Ні          | `string[]` | Ідентифікатори методів setup/auth, які цей provider підтримує без завантаження повного runtime. |
| `envVars`     | Ні          | `string[]` | Змінні env, які типові поверхні setup/status можуть перевіряти до завантаження runtime plugin. |

### Поля `setup`

| Поле               | Обов’язкове | Тип        | Що воно означає                                                                                      |
| ------------------ | ----------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| `providers`        | Ні          | `object[]` | Дескриптори setup provider, які показуються під час setup та onboarding.                             |
| `cliBackends`      | Ні          | `string[]` | Ідентифікатори backend для етапу setup, які використовуються для пошуку setup за принципом descriptor-first. Зберігайте нормалізовані ідентифікатори глобально унікальними. |
| `configMigrations` | Ні          | `string[]` | Ідентифікатори міграцій конфігурації, якими володіє поверхня setup цього plugin.                    |
| `requiresRuntime`  | Ні          | `boolean`  | Чи потребує setup виконання `setup-api` після пошуку за дескриптором.                               |

## Довідник `uiHints`

`uiHints` — це мапа від імен полів конфігурації до невеликих підказок рендерингу.

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

Використовуйте `contracts` лише для статичних метаданих про належність можливостей, які OpenClaw може
читати без імпорту runtime plugin.

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

| Поле                             | Тип        | Що воно означає                                                |
| -------------------------------- | ---------- | -------------------------------------------------------------- |
| `speechProviders`                | `string[]` | Ідентифікатори speech provider, якими володіє цей plugin.      |
| `realtimeTranscriptionProviders` | `string[]` | Ідентифікатори provider для realtime transcription, якими володіє цей plugin. |
| `realtimeVoiceProviders`         | `string[]` | Ідентифікатори provider для realtime voice, якими володіє цей plugin. |
| `mediaUnderstandingProviders`    | `string[]` | Ідентифікатори provider для media-understanding, якими володіє цей plugin. |
| `imageGenerationProviders`       | `string[]` | Ідентифікатори provider для image-generation, якими володіє цей plugin. |
| `videoGenerationProviders`       | `string[]` | Ідентифікатори provider для video-generation, якими володіє цей plugin. |
| `webFetchProviders`              | `string[]` | Ідентифікатори provider для web-fetch, якими володіє цей plugin. |
| `webSearchProviders`             | `string[]` | Ідентифікатори provider для web search, якими володіє цей plugin. |
| `tools`                          | `string[]` | Назви agent tool, якими володіє цей plugin, для перевірок контрактів вбудованих plugin. |

## Довідник `channelConfigs`

Використовуйте `channelConfigs`, коли plugin channel потребує дешевих метаданих конфігурації
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

| Поле          | Тип                      | Що воно означає                                                                            |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------ |
| `schema`      | `object`                 | JSON Schema для `channels.<id>`. Обов’язкове для кожного оголошеного запису конфігурації channel. |
| `uiHints`     | `Record<string, object>` | Необов’язкові мітки UI/placeholders/підказки щодо чутливості для цього розділу конфігурації channel. |
| `label`       | `string`                 | Мітка channel, що об’єднується з поверхнями picker та inspect, коли метадані runtime ще не готові. |
| `description` | `string`                 | Короткий опис channel для поверхонь inspect і каталогу.                                    |
| `preferOver`  | `string[]`               | Ідентифікатори застарілих або менш пріоритетних plugin, які цей channel має випереджати в поверхнях вибору. |

## Довідник `modelSupport`

Використовуйте `modelSupport`, коли OpenClaw має виводити ваш provider plugin із
скорочених ідентифікаторів моделей на кшталт `gpt-5.4` або `claude-sonnet-4.6` до завантаження
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

- явні посилання `provider/model` використовують метадані маніфесту `providers`, що належать відповідному plugin
- `modelPatterns` мають вищий пріоритет за `modelPrefixes`
- якщо збігаються один невбудований plugin і один вбудований plugin, перемагає невбудований
  plugin
- решта неоднозначностей ігнорується, доки користувач або конфігурація не вкаже provider

Поля:

| Поле            | Тип        | Що воно означає                                                                  |
| --------------- | ---------- | -------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Префікси, що зіставляються через `startsWith` зі скороченими ідентифікаторами моделей. |
| `modelPatterns` | `string[]` | Джерела regex, що зіставляються зі скороченими ідентифікаторами моделей після видалення суфікса профілю. |

Застарілі ключі можливостей верхнього рівня не рекомендуються до використання. Використовуйте `openclaw doctor --fix`, щоб
перемістити `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` і `webSearchProviders` до `contracts`; звичайне
завантаження маніфесту більше не трактує ці поля верхнього рівня як
належність можливостей.

## Маніфест проти package.json

Ці два файли виконують різні завдання:

| Файл                   | Для чого його використовувати                                                                                                      |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Виявлення, валідація конфігурації, метадані вибору auth і підказки UI, які мають існувати до запуску коду plugin                 |
| `package.json`         | Метадані npm, встановлення залежностей і блок `openclaw`, що використовується для entrypoint, обмежень встановлення, setup або метаданих каталогу |

Якщо ви не впевнені, куди має належати певний фрагмент метаданих, використовуйте таке правило:

- якщо OpenClaw має знати це до завантаження коду plugin, помістіть це в `openclaw.plugin.json`
- якщо це стосується пакування, файлів entrypoint або поведінки встановлення npm, помістіть це в `package.json`

### Поля package.json, які впливають на виявлення

Деякі метадані plugin до запуску runtime навмисно зберігаються в `package.json` у блоці
`openclaw`, а не в `openclaw.plugin.json`.

Важливі приклади:

| Поле                                                              | Що воно означає                                                                                                                               |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Оголошує власні entrypoint plugin.                                                                                                            |
| `openclaw.setupEntry`                                             | Легкий entrypoint лише для setup, що використовується під час onboarding, відкладеного запуску channel і discovery статусу/SecretRef лише для читання. |
| `openclaw.channel`                                                | Дешеві метадані каталогу channel, як-от мітки, шляхи до документації, alias і текст для вибору.                                              |
| `openclaw.channel.configuredState`                                | Легкі метадані перевірки configured-state, які можуть відповісти на питання «чи вже існує налаштування лише через env?» без завантаження повного runtime channel. |
| `openclaw.channel.persistedAuthState`                             | Легкі метадані перевірки persisted-auth, які можуть відповісти на питання «чи вже виконано вхід кудись?» без завантаження повного runtime channel. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Підказки встановлення/оновлення для вбудованих і зовнішньо опублікованих plugin.                                                             |
| `openclaw.install.defaultChoice`                                  | Бажаний шлях встановлення, коли доступно кілька джерел встановлення.                                                                          |
| `openclaw.install.minHostVersion`                                 | Мінімальна підтримувана версія хоста OpenClaw із використанням нижньої межі semver, наприклад `>=2026.3.22`.                                 |
| `openclaw.install.allowInvalidConfigRecovery`                     | Дозволяє вузький шлях відновлення перевстановлення вбудованого plugin, коли конфігурація невалідна.                                          |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Дозволяє поверхням channel лише для setup завантажуватися до повного plugin channel під час запуску.                                         |

`openclaw.install.minHostVersion` застосовується під час встановлення та
завантаження реєстру маніфестів. Невалідні значення відхиляються; новіші, але валідні значення
пропускають plugin на старіших хостах.

Plugin channel мають надавати `openclaw.setupEntry`, коли status, список channel
або сканування SecretRef мають визначати налаштовані облікові записи без завантаження повного
runtime. Entrypoint setup має відкривати метадані channel разом із безпечними для setup адаптерами
конфігурації, status і secrets; зберігайте мережеві клієнти, слухачі Gateway і transport runtime
в основному entrypoint extension.

`openclaw.install.allowInvalidConfigRecovery` навмисно має вузьке застосування. Воно
не робить довільно зламані конфігурації придатними для встановлення. Наразі воно лише дозволяє потокам встановлення
відновлюватися після конкретних застарілих збоїв оновлення вбудованого plugin, наприклад
відсутнього шляху до вбудованого plugin або застарілого запису `channels.<id>` для того самого
вбудованого plugin. Непов’язані помилки конфігурації все одно блокують встановлення і спрямовують операторів
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

Використовуйте це, коли потокам setup, doctor або configured-state потрібна дешева
перевірка auth у форматі так/ні до завантаження повного plugin channel. Цільовий export має бути
невеликою функцією, що читає лише збережений стан; не спрямовуйте її через повний barrel runtime channel.

`openclaw.channel.configuredState` має таку саму форму для дешевих перевірок
configured state лише через env:

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

Використовуйте це, коли channel може визначати configured state через env або інші малі
вхідні дані, не пов’язані з runtime. Якщо перевірка потребує повного розв’язання конфігурації або реального
runtime channel, залиште цю логіку в hook `config.hasConfiguredState` plugin.

## Пріоритет виявлення (дубльовані ідентифікатори plugin)

OpenClaw виявляє plugin із кількох коренів (вбудовані, глобальне встановлення, робочий простір, явні шляхи, вибрані в конфігурації). Якщо два виявлені plugin мають однаковий `id`, зберігається лише маніфест із **найвищим пріоритетом**; дублікати з нижчим пріоритетом відкидаються замість паралельного завантаження.

Пріоритет від найвищого до найнижчого:

1. **Вибраний у конфігурації** — шлях, явно зафіксований у `plugins.entries.<id>`
2. **Вбудований** — plugin, що постачаються з OpenClaw
3. **Глобальне встановлення** — plugin, встановлені в глобальний корінь plugin OpenClaw
4. **Робочий простір** — plugin, виявлені відносно поточного робочого простору

Наслідки:

- Розгалужена або застаріла копія вбудованого plugin, що лежить у робочому просторі, не затьмарить вбудовану збірку.
- Щоб справді перевизначити вбудований plugin локальним, зафіксуйте його через `plugins.entries.<id>`, щоб він переміг за пріоритетом, а не покладайтеся на виявлення в робочому просторі.
- Відкидання дублікатів журналюється, щоб Doctor і діагностика запуску могли вказати на відкинуту копію.

## Вимоги до JSON Schema

- **Кожен plugin повинен постачатися з JSON Schema**, навіть якщо він не приймає конфігурацію.
- Порожня схема припустима (наприклад, `{ "type": "object", "additionalProperties": false }`).
- Схеми проходять валідацію під час читання/запису конфігурації, а не під час runtime.

## Поведінка валідації

- Невідомі ключі `channels.*` є **помилками**, якщо тільки ідентифікатор channel не оголошено
  в маніфесті plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` і `plugins.slots.*`
  мають посилатися на **такі ідентифікатори plugin, які можна виявити**. Невідомі ідентифікатори є **помилками**.
- Якщо plugin встановлено, але він має зламаний або відсутній маніфест чи схему,
  валідація завершується з помилкою, а Doctor повідомляє про помилку plugin.
- Якщо конфігурація plugin існує, але plugin **вимкнено**, конфігурація зберігається, і
  у Doctor + журналах з’являється **попередження**.

Повну схему `plugins.*` див. у [Довідник конфігурації](/uk/gateway/configuration).

## Примітки

- Маніфест **обов’язковий для власних Plugin OpenClaw**, включно із завантаженнями з локальної файлової системи.
- Runtime і далі окремо завантажує модуль plugin; маніфест використовується лише для
  виявлення + валідації.
- Власні маніфести парсяться за допомогою JSON5, тому коментарі, кінцеві коми та
  ключі без лапок допускаються, якщо фінальне значення все ще є об’єктом.
- Завантажувач маніфесту читає лише задокументовані поля маніфесту. Уникайте додавання
  власних ключів верхнього рівня тут.
- `providerAuthEnvVars` — це дешевий шлях метаданих для перевірок auth, валідації
  env-marker і подібних поверхонь auth provider, які не повинні запускати runtime plugin
  лише для перевірки назв env.
- `providerAuthAliases` дає змогу варіантам provider повторно використовувати auth
  env vars, профілі auth, auth на основі конфігурації та варіант onboarding API key іншого provider
  без жорсткого кодування цього зв’язку в core.
- `providerEndpoints` дає plugin provider змогу володіти простими метаданими зіставлення
  host/baseUrl endpoint. Використовуйте це лише для класів endpoint, які core вже підтримує;
  поведінка runtime все одно належить plugin.
- `syntheticAuthRefs` — це дешевий шлях метаданих для синтетичних hook auth, що належать provider
  і мають бути видимими для холодного виявлення моделей до появи реєстру runtime.
  Перелічуйте лише ті посилання, чий runtime provider або backend CLI справді
  реалізує `resolveSyntheticAuth`.
- `nonSecretAuthMarkers` — це дешевий шлях метаданих для значень-заповнювачів API key, що належать
  вбудованому plugin, як-от маркери локальних, OAuth або ambient credential.
  Core трактує їх як не секретні для відображення auth і аудиту секретів без
  жорсткого кодування власника provider.
- `channelEnvVars` — це дешевий шлях метаданих для shell-env fallback, запитів setup
  і подібних поверхонь channel, які не повинні запускати runtime plugin
  лише для перевірки назв env.
- `providerAuthChoices` — це дешевий шлях метаданих для picker вибору auth,
  розв’язання `--auth-choice`, мапінгу бажаного provider і простої реєстрації
  прапорців CLI для onboarding до завантаження runtime provider. Метадані wizard runtime,
  які потребують коду provider, див. у
  [Хуки runtime provider](/uk/plugins/architecture#provider-runtime-hooks).
- Ексклюзивні види plugin вибираються через `plugins.slots.*`.
  - `kind: "memory"` вибирається через `plugins.slots.memory`.
  - `kind: "context-engine"` вибирається через `plugins.slots.contextEngine`
    (типово: вбудований `legacy`).
- `channels`, `providers`, `cliBackends` і `skills` можна не вказувати, якщо plugin
  їх не потребує.
- Якщо ваш plugin залежить від власних модулів, задокументуйте кроки збірки та всі
  вимоги до allowlist менеджера пакетів (наприклад, pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Пов’язане

- [Створення Plugins](/uk/plugins/building-plugins) — початок роботи з plugin
- [Архітектура Plugin](/uk/plugins/architecture) — внутрішня архітектура
- [Огляд SDK](/uk/plugins/sdk-overview) — довідник SDK Plugin
