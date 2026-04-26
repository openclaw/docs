---
read_when:
    - Ви створюєте Plugin для OpenClaw
    - Вам потрібно постачати схему конфігурації plugin або налагодити помилки валідації plugin
summary: Маніфест Plugin + вимоги до JSON schema (сувора валідація конфігурації)
title: Маніфест Plugin
x-i18n:
    generated_at: "2026-04-26T00:19:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47e3d74576a33c98ea58d29e74d3589eed3c69750e53f1acfe164dcc92b0e592
    source_path: plugins/manifest.md
    workflow: 15
---

Ця сторінка призначена **лише для нативного маніфесту Plugin OpenClaw**.

Сумісні макети bundle описані в [Plugin bundles](/uk/plugins/bundles).

Сумісні формати bundle використовують інші файли маніфесту:

- Codex bundle: `.codex-plugin/plugin.json`
- Claude bundle: `.claude-plugin/plugin.json` або стандартний макет компонента Claude
  без маніфесту
- Cursor bundle: `.cursor-plugin/plugin.json`

OpenClaw також автоматично визначає ці макети bundle, але вони не проходять валідацію
за схемою `openclaw.plugin.json`, описаною тут.

Для сумісних bundle OpenClaw наразі читає метадані bundle разом з оголошеними
коренями Skills, коренями команд Claude, значеннями `settings.json` bundle Claude за замовчуванням,
типовими значеннями LSP bundle Claude та підтримуваними наборами hook, коли макет відповідає
очікуванням runtime OpenClaw.

Кожен нативний Plugin OpenClaw **повинен** постачати файл `openclaw.plugin.json` у
**корені plugin**. OpenClaw використовує цей маніфест для валідації конфігурації
**без виконання коду plugin**. Відсутні або невалідні маніфести вважаються
помилками plugin і блокують валідацію конфігурації.

Повний посібник із системи plugin дивіться тут: [Plugins](/uk/tools/plugin).
Для нативної моделі можливостей і поточних рекомендацій щодо зовнішньої сумісності:
[Модель можливостей](/uk/plugins/architecture#public-capability-model).

## Для чого потрібен цей файл

`openclaw.plugin.json` — це метадані, які OpenClaw читає **до завантаження коду
вашого plugin**. Усе нижче має бути достатньо легким для перевірки без запуску
runtime plugin.

**Використовуйте його для:**

- ідентичності plugin, валідації конфігурації та підказок UI для конфігурації
- метаданих автентифікації, онбордингу й налаштування (псевдонім, автоувімкнення, env vars провайдера, варіанти автентифікації)
- підказок активації для поверхонь control-plane
- скороченого володіння сімейством моделей
- статичних знімків володіння можливостями (`contracts`)
- метаданих QA runner, які спільний хост `openclaw qa` може перевіряти
- метаданих конфігурації, специфічних для каналу, які об’єднуються з поверхнями каталогу та валідації

**Не використовуйте його для:** реєстрації поведінки runtime, оголошення
точок входу коду або метаданих встановлення npm. Вони належать коду вашого plugin і `package.json`.

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

## Довідник полів верхнього рівня

| Поле                                 | Обов’язкове | Тип                              | Що воно означає                                                                                                                                                                                                                    |
| ------------------------------------ | ----------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Так         | `string`                         | Канонічний id plugin. Це id, який використовується в `plugins.entries.<id>`.                                                                                                                                                      |
| `configSchema`                       | Так         | `object`                         | Вбудована JSON Schema для конфігурації цього plugin.                                                                                                                                                                               |
| `enabledByDefault`                   | Ні          | `true`                           | Позначає вбудований plugin як увімкнений за замовчуванням. Пропустіть це поле або встановіть будь-яке значення, відмінне від `true`, щоб plugin був вимкнений за замовчуванням.                                                 |
| `legacyPluginIds`                    | Ні          | `string[]`                       | Застарілі id, які нормалізуються до цього канонічного id plugin.                                                                                                                                                                   |
| `autoEnableWhenConfiguredProviders`  | Ні          | `string[]`                       | Id провайдерів, які мають автоматично вмикати цей plugin, коли автентифікація, конфігурація або посилання на моделі згадують їх.                                                                                                  |
| `kind`                               | Ні          | `"memory"` \| `"context-engine"` | Оголошує ексклюзивний тип plugin, який використовується `plugins.slots.*`.                                                                                                                                                         |
| `channels`                           | Ні          | `string[]`                       | Id каналів, якими володіє цей plugin. Використовується для виявлення та валідації конфігурації.                                                                                                                                   |
| `providers`                          | Ні          | `string[]`                       | Id провайдерів, якими володіє цей plugin.                                                                                                                                                                                          |
| `providerDiscoveryEntry`             | Ні          | `string`                         | Полегшений шлях до модуля виявлення провайдера, відносно кореня plugin, для метаданих каталогу провайдерів в області маніфесту, які можна завантажити без активації повного runtime plugin.                                     |
| `modelSupport`                       | Ні          | `object`                         | Скорочені метадані сімейства моделей, якими володіє маніфест, що використовуються для автоматичного завантаження plugin до runtime.                                                                                              |
| `modelCatalog`                       | Ні          | `object`                         | Декларативні метадані каталогу моделей для провайдерів, якими володіє цей plugin. Це контракт control-plane для майбутніх режимів лише читання: переліку, онбордингу, вибору моделей, псевдонімів і приховування без завантаження runtime plugin. |
| `providerEndpoints`                  | Ні          | `object[]`                       | Метадані хостів/`baseUrl` кінцевих точок, якими володіє маніфест, для маршрутів провайдерів, які ядро має класифікувати до завантаження runtime провайдера.                                                                      |
| `cliBackends`                        | Ні          | `string[]`                       | Id backend CLI inference, якими володіє цей plugin. Використовується для автоматичної активації під час запуску з явних посилань у конфігурації.                                                                                 |
| `syntheticAuthRefs`                  | Ні          | `string[]`                       | Посилання на провайдери або backend CLI, для яких слід перевіряти синтетичний hook автентифікації, що належить plugin, під час холодного виявлення моделей до завантаження runtime.                                            |
| `nonSecretAuthMarkers`               | Ні          | `string[]`                       | Значення-заповнювачі API-ключів, що належать вбудованому plugin і позначають несекретний локальний стан, OAuth або стан ambient credential.                                                                                      |
| `commandAliases`                     | Ні          | `object[]`                       | Імена команд, якими володіє цей plugin, що мають давати діагностику конфігурації та CLI з урахуванням plugin до завантаження runtime.                                                                                            |
| `providerAuthEnvVars`                | Ні          | `Record<string, string[]>`       | Застарілі сумісні метадані env для пошуку автентифікації/статусу провайдера. Для нових plugin віддавайте перевагу `setup.providers[].envVars`; OpenClaw усе ще читає це протягом вікна зворотної сумісності.                    |
| `providerAuthAliases`                | Ні          | `Record<string, string>`         | Id провайдерів, які мають повторно використовувати інший id провайдера для пошуку автентифікації, наприклад провайдер для кодування, який спільно використовує API-ключ базового провайдера та профілі автентифікації.          |
| `channelEnvVars`                     | Ні          | `Record<string, string[]>`       | Легкі метадані env для каналів, які OpenClaw може перевіряти без завантаження коду plugin. Використовуйте це для налаштування каналів або поверхонь автентифікації на основі env, які мають бачити загальні helpers запуску/конфігурації. |
| `providerAuthChoices`                | Ні          | `object[]`                       | Легкі метадані варіантів автентифікації для вибору під час онбордингу, визначення бажаного провайдера та простого зв’язування прапорців CLI.                                                                                     |
| `activation`                         | Ні          | `object`                         | Легкі метадані планувальника активації для завантаження, що запускається провайдерами, командами, каналами, маршрутами й можливостями. Лише метадані; фактична поведінка, як і раніше, належить runtime plugin.                |
| `setup`                              | Ні          | `object`                         | Легкі дескриптори налаштування/онбордингу, які поверхні виявлення та налаштування можуть перевіряти без завантаження runtime plugin.                                                                                             |
| `qaRunners`                          | Ні          | `object[]`                       | Легкі дескриптори QA runner, які використовує спільний хост `openclaw qa` до завантаження runtime plugin.                                                                                                                        |
| `contracts`                          | Ні          | `object`                         | Статичний знімок вбудованих можливостей для зовнішніх hook автентифікації, мовлення, транскрипції в реальному часі, голосу в реальному часі, розуміння медіа, генерації зображень, генерації музики, генерації відео, web-fetch, web search і володіння інструментами. |
| `mediaUnderstandingProviderMetadata` | Ні          | `Record<string, object>`         | Легкі типові значення розуміння медіа для id провайдерів, оголошених у `contracts.mediaUnderstandingProviders`.                                                                                                                  |
| `channelConfigs`                     | Ні          | `Record<string, object>`         | Метадані конфігурації каналів, якими володіє маніфест, що об’єднуються з поверхнями виявлення та валідації до завантаження runtime.                                                                                              |
| `skills`                             | Ні          | `string[]`                       | Каталоги Skills для завантаження, відносно кореня plugin.                                                                                                                                                                          |
| `name`                               | Ні          | `string`                         | Зрозуміла людині назва plugin.                                                                                                                                                                                                     |
| `description`                        | Ні          | `string`                         | Короткий опис, що показується на поверхнях plugin.                                                                                                                                                                                 |
| `version`                            | Ні          | `string`                         | Інформаційна версія plugin.                                                                                                                                                                                                        |
| `uiHints`                            | Ні          | `Record<string, object>`         | Мітки UI, заповнювачі та підказки щодо чутливості для полів конфігурації.                                                                                                                                                         |

## Довідник `providerAuthChoices`

Кожен запис `providerAuthChoices` описує один варіант онбордингу або автентифікації.
OpenClaw читає це до завантаження runtime провайдера.
Потік налаштування провайдера надає перевагу цим варіантам з маніфесту, а потім для сумісності
переходить до метаданих wizard runtime та варіантів із каталогу встановлення.

| Поле                  | Обов’язкове | Тип                                             | Що воно означає                                                                                           |
| --------------------- | ----------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `provider`            | Так         | `string`                                        | Id провайдера, до якого належить цей варіант.                                                             |
| `method`              | Так         | `string`                                        | Id методу автентифікації, до якого потрібно диспетчеризувати.                                             |
| `choiceId`            | Так         | `string`                                        | Стабільний id варіанта автентифікації, який використовується в онбордингу та CLI-потоках.                |
| `choiceLabel`         | Ні          | `string`                                        | Мітка для користувача. Якщо не вказано, OpenClaw використовує `choiceId`.                                |
| `choiceHint`          | Ні          | `string`                                        | Короткий допоміжний текст для засобу вибору.                                                              |
| `assistantPriority`   | Ні          | `number`                                        | Менші значення сортуються раніше в інтерактивних засобах вибору, керованих асистентом.                   |
| `assistantVisibility` | Ні          | `"visible"` \| `"manual-only"`                  | Приховує варіант від засобів вибору асистента, але все ще дозволяє ручний вибір через CLI.              |
| `deprecatedChoiceIds` | Ні          | `string[]`                                      | Застарілі id варіантів, які повинні перенаправляти користувачів до цього варіанта-замінника.            |
| `groupId`             | Ні          | `string`                                        | Необов’язковий id групи для групування пов’язаних варіантів.                                              |
| `groupLabel`          | Ні          | `string`                                        | Мітка цієї групи для користувача.                                                                         |
| `groupHint`           | Ні          | `string`                                        | Короткий допоміжний текст для групи.                                                                      |
| `optionKey`           | Ні          | `string`                                        | Внутрішній ключ параметра для простих потоків автентифікації з одним прапорцем.                          |
| `cliFlag`             | Ні          | `string`                                        | Назва прапорця CLI, наприклад `--openrouter-api-key`.                                                     |
| `cliOption`           | Ні          | `string`                                        | Повна форма параметра CLI, наприклад `--openrouter-api-key <key>`.                                        |
| `cliDescription`      | Ні          | `string`                                        | Опис, що використовується в довідці CLI.                                                                  |
| `onboardingScopes`    | Ні          | `Array<"text-inference" \| "image-generation">` | На яких поверхнях онбордингу має відображатися цей варіант. Якщо не вказано, типово використовується `["text-inference"]`. |

## Довідник `commandAliases`

Використовуйте `commandAliases`, коли plugin володіє назвою runtime-команди, яку користувачі можуть
помилково додати в `plugins.allow` або спробувати запустити як кореневу команду CLI. OpenClaw
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

| Поле         | Обов’язкове | Тип               | Що воно означає                                                              |
| ------------ | ----------- | ----------------- | ---------------------------------------------------------------------------- |
| `name`       | Так         | `string`          | Назва команди, яка належить цьому plugin.                                    |
| `kind`       | Ні          | `"runtime-slash"` | Позначає псевдонім як slash-команду чату, а не як кореневу команду CLI.      |
| `cliCommand` | Ні          | `string`          | Пов’язана коренева команда CLI, яку слід підказати для операцій CLI, якщо така існує. |

## Довідник `activation`

Використовуйте `activation`, коли plugin може дешево оголосити, які події control-plane
мають включати його до плану активації/завантаження.

Цей блок є метаданими планувальника, а не API життєвого циклу. Він не реєструє
поведінку runtime, не замінює `register(...)` і не обіцяє, що код
plugin уже виконано. Планувальник активації використовує ці поля, щоб звузити коло
кандидатів plugin, перш ніж переходити до наявних метаданих володіння маніфестом,
таких як `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` і hooks.

Надавайте перевагу найвужчим метаданим, які вже описують володіння. Використовуйте
`providers`, `channels`, `commandAliases`, дескриптори setup або `contracts`,
коли ці поля виражають цей зв’язок. Використовуйте `activation` для додаткових підказок планувальника,
які не можна представити цими полями володіння.

Цей блок містить лише метадані. Він не реєструє поведінку runtime і
не замінює `register(...)`, `setupEntry` або інші точки входу runtime/plugin.
Поточні споживачі використовують його як підказку для звуження перед ширшим завантаженням plugin, тому
відсутність метаданих активації зазвичай впливає лише на продуктивність; це не повинно
змінювати коректність, доки все ще існують застарілі резервні механізми володіння маніфестом.

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

| Поле             | Обов’язкове | Тип                                                  | Що воно означає                                                                                           |
| ---------------- | ----------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `onProviders`    | Ні          | `string[]`                                           | Id провайдерів, які мають включати цей plugin до планів активації/завантаження.                          |
| `onCommands`     | Ні          | `string[]`                                           | Id команд, які мають включати цей plugin до планів активації/завантаження.                               |
| `onChannels`     | Ні          | `string[]`                                           | Id каналів, які мають включати цей plugin до планів активації/завантаження.                              |
| `onRoutes`       | Ні          | `string[]`                                           | Типи маршрутів, які мають включати цей plugin до планів активації/завантаження.                          |
| `onCapabilities` | Ні          | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Широкі підказки щодо можливостей, що використовуються плануванням активації control-plane. За можливості надавайте перевагу вужчим полям. |

Поточні активні споживачі:

- CLI-планування, запущене командою, повертається до застарілих
  `commandAliases[].cliCommand` або `commandAliases[].name`
- планування setup/каналів, запущене каналом, повертається до застарілого володіння `channels[]`,
  коли відсутні явні метадані активації каналу
- планування setup/runtime, запущене провайдером, повертається до застарілого
  володіння `providers[]` і `cliBackends[]` верхнього рівня, коли відсутні явні метадані
  активації провайдера

Діагностика планувальника може відрізняти явні підказки активації від резервного
володіння маніфестом. Наприклад, `activation-command-hint` означає, що
спрацював збіг `activation.onCommands`, а `manifest-command-alias` означає, що
планувальник натомість використав володіння `commandAliases`. Ці мітки причин призначені для
діагностики хоста та тестів; авторам plugin слід і далі оголошувати ті метадані,
які найкраще описують володіння.

## Довідник `qaRunners`

Використовуйте `qaRunners`, коли plugin додає один або більше транспортних runner під
спільний корінь `openclaw qa`. Залишайте ці метадані легкими й статичними; runtime
plugin, як і раніше, володіє фактичною реєстрацією CLI через полегшену
поверхню `runtime-api.ts`, яка експортує `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Запустити live QA lane для Matrix на основі Docker проти одноразового homeserver"
    }
  ]
}
```

| Поле          | Обов’язкове | Тип      | Що воно означає                                                       |
| ------------- | ----------- | -------- | --------------------------------------------------------------------- |
| `commandName` | Так         | `string` | Підкоманда, змонтована під `openclaw qa`, наприклад `matrix`.         |
| `description` | Ні          | `string` | Резервний текст довідки, який використовується, коли спільному хосту потрібна stub-команда. |

## Довідник `setup`

Використовуйте `setup`, коли поверхням налаштування та онбордингу потрібні дешеві метадані plugin,
якими він володіє, до завантаження runtime.

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

`cliBackends` верхнього рівня залишається валідним і й надалі описує
backend CLI inference. `setup.cliBackends` — це поверхня дескрипторів, специфічна для setup, для
потоків control-plane/setup, які мають залишатися лише метаданими.

Коли вони присутні, `setup.providers` і `setup.cliBackends` є бажаною
поверхнею пошуку для виявлення setup за принципом "спочатку дескриптор". Якщо дескриптор лише
звужує кандидатний plugin, а setup усе ще потребує багатших runtime-hooks під час налаштування,
установіть `requiresRuntime: true` і залиште `setup-api` як
резервний шлях виконання.

OpenClaw також включає `setup.providers[].envVars` до загальних пошуків автентифікації провайдерів і
env vars. `providerAuthEnvVars` залишається підтримуваним через адаптер сумісності протягом
вікна знецінення, але plugin не з комплекту, які все ще його використовують,
отримують діагностику маніфесту. Нові plugin мають розміщувати метадані env для setup/статусу
в `setup.providers[].envVars`.

OpenClaw також може виводити прості варіанти setup з `setup.providers[].authMethods`,
коли запис setup недоступний або коли `setup.requiresRuntime: false`
оголошує runtime setup непотрібним. Явні записи `providerAuthChoices` і далі мають
перевагу для спеціальних міток, прапорців CLI, області онбордингу та метаданих асистента.

Установлюйте `requiresRuntime: false` лише тоді, коли цих дескрипторів достатньо для
поверхні setup. OpenClaw трактує явне `false` як контракт лише з дескрипторами
і не виконуватиме `setup-api` або `openclaw.setupEntry` для пошуку setup. Якщо
plugin лише з дескрипторами все ж постачає одну з цих runtime-точок входу setup,
OpenClaw повідомляє про додаткову діагностику та продовжує її ігнорувати. Пропущене
`requiresRuntime` зберігає застарілу резервну поведінку, щоб наявні plugin, які додали
дескриптори без цього прапорця, не ламалися.

Оскільки пошук setup може виконувати код `setup-api`, яким володіє plugin,
нормалізовані значення `setup.providers[].id` і `setup.cliBackends[]` мають залишатися унікальними серед
виявлених plugin. Неоднозначне володіння завершується закриттям, а не вибором
переможця за порядком виявлення.

Коли runtime setup все ж виконується, діагностика реєстру setup повідомляє про розходження дескрипторів, якщо
`setup-api` реєструє провайдера або backend CLI, які не оголошені дескрипторами маніфесту,
або якщо дескриптор не має відповідної реєстрації в runtime.
Ця діагностика є додатковою і не відхиляє застарілі plugin.

### Довідник `setup.providers`

| Поле          | Обов’язкове | Тип        | Що воно означає                                                                       |
| ------------- | ----------- | ---------- | ------------------------------------------------------------------------------------- |
| `id`          | Так         | `string`   | Id провайдера, який відкривається під час setup або онбордингу. Нормалізовані id мають бути глобально унікальними. |
| `authMethods` | Ні          | `string[]` | Id методів setup/автентифікації, які цей провайдер підтримує без завантаження повного runtime. |
| `envVars`     | Ні          | `string[]` | Env vars, які загальні поверхні setup/статусу можуть перевіряти до завантаження runtime plugin. |

### Поля `setup`

| Поле               | Обов’язкове | Тип        | Що воно означає                                                                                      |
| ------------------ | ----------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| `providers`        | Ні          | `object[]` | Дескриптори setup провайдерів, доступні під час setup та онбордингу.                                 |
| `cliBackends`      | Ні          | `string[]` | Id backend для setup, які використовуються для пошуку setup за принципом "спочатку дескриптор". Нормалізовані id мають бути глобально унікальними. |
| `configMigrations` | Ні          | `string[]` | Id міграцій конфігурації, якими володіє поверхня setup цього plugin.                                 |
| `requiresRuntime`  | Ні          | `boolean`  | Чи потребує setup виконання `setup-api` після пошуку за дескриптором.                                |

## Довідник `uiHints`

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

| Поле          | Тип        | Що воно означає                        |
| ------------- | ---------- | -------------------------------------- |
| `label`       | `string`   | Мітка поля для користувача.            |
| `help`        | `string`   | Короткий допоміжний текст.             |
| `tags`        | `string[]` | Необов’язкові теги UI.                 |
| `advanced`    | `boolean`  | Позначає поле як розширене.            |
| `sensitive`   | `boolean`  | Позначає поле як секретне або чутливе. |
| `placeholder` | `string`   | Текст-заповнювач для полів форми.      |

## Довідник `contracts`

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
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Кожен список є необов’язковим:

| Поле                             | Тип        | Що воно означає                                                            |
| -------------------------------- | ---------- | -------------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Id фабрик розширень app-server Codex, наразі `codex-app-server`.          |
| `agentToolResultMiddleware`      | `string[]` | Id runtime, для яких вбудований plugin може реєструвати middleware результатів інструментів. |
| `externalAuthProviders`          | `string[]` | Id провайдерів, hook зовнішнього профілю автентифікації яких належить цьому plugin. |
| `speechProviders`                | `string[]` | Id провайдерів мовлення, якими володіє цей plugin.                         |
| `realtimeTranscriptionProviders` | `string[]` | Id провайдерів транскрипції в реальному часі, якими володіє цей plugin.   |
| `realtimeVoiceProviders`         | `string[]` | Id провайдерів голосу в реальному часі, якими володіє цей plugin.         |
| `memoryEmbeddingProviders`       | `string[]` | Id провайдерів embedding для пам’яті, якими володіє цей plugin.           |
| `mediaUnderstandingProviders`    | `string[]` | Id провайдерів розуміння медіа, якими володіє цей plugin.                 |
| `imageGenerationProviders`       | `string[]` | Id провайдерів генерації зображень, якими володіє цей plugin.             |
| `videoGenerationProviders`       | `string[]` | Id провайдерів генерації відео, якими володіє цей plugin.                 |
| `webFetchProviders`              | `string[]` | Id провайдерів web-fetch, якими володіє цей plugin.                       |
| `webSearchProviders`             | `string[]` | Id провайдерів web search, якими володіє цей plugin.                      |
| `tools`                          | `string[]` | Імена інструментів агента, якими володіє цей plugin, для перевірок вбудованих контрактів. |

`contracts.embeddedExtensionFactories` збережено для вбудованих фабрик розширень
app-server лише для Codex. Вбудовані перетворення результатів інструментів повинні
оголошувати `contracts.agentToolResultMiddleware` і реєструватися через
`api.registerAgentToolResultMiddleware(...)`. Зовнішні plugin не можуть
реєструвати middleware результатів інструментів, оскільки цей seam може переписувати вихід
інструментів із високим рівнем довіри до того, як модель їх побачить.

Plugin провайдерів, які реалізують `resolveExternalAuthProfiles`, повинні оголошувати
`contracts.externalAuthProviders`. Plugin без цього оголошення все ще працюють
через застарілий резервний механізм сумісності, але він повільніший і
буде видалений після завершення вікна міграції.

Вбудовані провайдери embedding для пам’яті повинні оголошувати
`contracts.memoryEmbeddingProviders` для кожного id адаптера, який вони відкривають, зокрема
для вбудованих адаптерів, таких як `local`. Автономні шляхи CLI використовують цей контракт маніфесту,
щоб завантажити лише plugin-власник до того, як повний runtime Gateway
зареєструє провайдерів.

## Довідник `mediaUnderstandingProviderMetadata`

Використовуйте `mediaUnderstandingProviderMetadata`, коли провайдер розуміння медіа має
типові моделі, пріоритет резервного автоматичного вибору автентифікації або нативну підтримку документів, які
потрібні загальним helpers ядра до завантаження runtime. Ключі також мають бути оголошені в
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

| Поле                   | Тип                                 | Що воно означає                                                               |
| ---------------------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Медіаможливості, які надає цей провайдер.                                     |
| `defaultModels`        | `Record<string, string>`            | Типові значення "можливість → модель", що використовуються, коли в конфігурації не вказано модель. |
| `autoPriority`         | `Record<string, number>`            | Менші числа сортуються раніше для автоматичного резервного вибору провайдера на основі облікових даних. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Нативні входи документів, які підтримує провайдер.                            |

## Довідник `channelConfigs`

Використовуйте `channelConfigs`, коли plugin каналу потребує легких метаданих конфігурації до
завантаження runtime. Виявлення setup/статусу каналу лише для читання може безпосередньо використовувати ці метадані
для налаштованих зовнішніх каналів, коли запис setup недоступний, або
коли `setup.requiresRuntime: false` оголошує runtime setup непотрібним.

`channelConfigs` — це метадані маніфесту plugin, а не новий розділ конфігурації користувача верхнього рівня.
Користувачі, як і раніше, налаштовують екземпляри каналів у `channels.<channel-id>`.
OpenClaw читає метадані маніфесту, щоб визначити, якому plugin належить налаштований
канал, до виконання коду runtime plugin.

Для plugin каналу `configSchema` і `channelConfigs` описують різні
шляхи:

- `configSchema` перевіряє `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` перевіряє `channels.<channel-id>`

Plugin не з комплекту, які оголошують `channels[]`, також повинні оголошувати відповідні
записи `channelConfigs`. Без них OpenClaw все ще може завантажити plugin, але
схема конфігурації холодного шляху, setup і поверхні Control UI не зможуть знати форму
параметрів, якими володіє канал, доки не виконається runtime plugin.

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

| Поле          | Тип                      | Що воно означає                                                                              |
| ------------- | ------------------------ | -------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema для `channels.<id>`. Обов’язкове для кожного оголошеного запису конфігурації каналу. |
| `uiHints`     | `Record<string, object>` | Необов’язкові мітки UI/заповнювачі/підказки щодо чутливості для цього розділу конфігурації каналу. |
| `label`       | `string`                 | Мітка каналу, що об’єднується з поверхнями вибору та перевірки, коли метадані runtime ще не готові. |
| `description` | `string`                 | Короткий опис каналу для поверхонь перевірки та каталогу.                                    |
| `preferOver`  | `string[]`               | Id застарілих plugin або plugin з нижчим пріоритетом, які цей канал має випереджати на поверхнях вибору. |

### Заміна іншого plugin каналу

Використовуйте `preferOver`, коли ваш plugin є бажаним власником для id каналу, який
інший plugin також може надавати. Типові випадки — перейменований id plugin,
автономний plugin, що замінює вбудований plugin, або підтримуваний fork, який
зберігає той самий id каналу для сумісності конфігурації.

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

Коли налаштовано `channels.chat`, OpenClaw враховує як id каналу, так і
id бажаного plugin. Якщо plugin з нижчим пріоритетом було вибрано лише тому, що
він вбудований або ввімкнений за замовчуванням, OpenClaw вимикає його в ефективній
конфігурації runtime, щоб один plugin володів каналом і його інструментами. Явний
вибір користувача все одно має перевагу: якщо користувач явно вмикає обидва plugin, OpenClaw
зберігає цей вибір і повідомляє про діагностику дубльованих каналів/інструментів замість
тихої зміни запитаного набору plugin.

Обмежуйте `preferOver` id plugin, які справді можуть надавати той самий канал.
Це не загальне поле пріоритету і воно не перейменовує ключі конфігурації користувача.

## Довідник `modelSupport`

Використовуйте `modelSupport`, коли OpenClaw має виводити ваш plugin провайдера з
скорочених id моделей, таких як `gpt-5.5` або `claude-sonnet-4.6`, до завантаження runtime plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw застосовує такий порядок пріоритету:

- явні посилання `provider/model` використовують метадані маніфесту `providers` плагіна-власника
- `modelPatterns` мають вищий пріоритет за `modelPrefixes`
- якщо збігаються один невбудований plugin і один вбудований plugin, перемагає невбудований
  plugin
- решта неоднозначностей ігнорується, доки користувач або конфігурація не вкаже провайдера

Поля:

| Поле            | Тип        | Що воно означає                                                              |
| --------------- | ---------- | ---------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Префікси, що зіставляються через `startsWith` зі скороченими id моделей.    |
| `modelPatterns` | `string[]` | Джерела regex, що зіставляються зі скороченими id моделей після видалення суфікса профілю. |

## Довідник `modelCatalog`

Використовуйте `modelCatalog`, коли OpenClaw має знати метадані моделей провайдера до
завантаження runtime plugin. Це джерело, яким володіє маніфест, для фіксованих
рядків каталогу, псевдонімів провайдерів, правил приховування та режиму виявлення. Оновлення runtime
і далі належить коду runtime провайдера, але маніфест повідомляє ядру, коли runtime
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
        "reason": "недоступно в Azure OpenAI Responses"
      }
    ],
    "discovery": {
      "openai": "static"
    }
  }
}
```

Поля верхнього рівня:

| Поле           | Тип                                                      | Що воно означає                                                                                               |
| -------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | Рядки каталогу для id провайдерів, якими володіє цей plugin. Ключі також мають бути присутні у `providers` верхнього рівня. |
| `aliases`      | `Record<string, object>`                                 | Псевдоніми провайдерів, які мають резолвитися до провайдера-власника для планування каталогу або приховування. |
| `suppressions` | `object[]`                                               | Рядки моделей з іншого джерела, які цей plugin приховує з причин, специфічних для провайдера.                 |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Чи каталог провайдера можна читати з метаданих маніфесту, оновлювати в кеш, чи для нього потрібен runtime.   |

Поля провайдера:

| Поле      | Тип                      | Що воно означає                                                    |
| --------- | ------------------------ | ------------------------------------------------------------------ |
| `baseUrl` | `string`                 | Необов’язковий типовий `baseUrl` для моделей у цьому каталозі провайдера. |
| `api`     | `ModelApi`               | Необов’язковий типовий адаптер API для моделей у цьому каталозі провайдера. |
| `headers` | `Record<string, string>` | Необов’язкові статичні заголовки, що застосовуються до цього каталогу провайдера. |
| `models`  | `object[]`               | Обов’язкові рядки моделей. Рядки без `id` ігноруються.            |

Поля моделі:

| Поле            | Тип                                                            | Що воно означає                                                              |
| --------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `id`            | `string`                                                       | Локальний для провайдера id моделі без префікса `provider/`.                |
| `name`          | `string`                                                       | Необов’язкова відображувана назва.                                          |
| `api`           | `ModelApi`                                                     | Необов’язкове перевизначення API для окремої моделі.                        |
| `baseUrl`       | `string`                                                       | Необов’язкове перевизначення `baseUrl` для окремої моделі.                  |
| `headers`       | `Record<string, string>`                                       | Необов’язкові статичні заголовки для окремої моделі.                        |
| `input`         | `Array<"text" \| "image" \| "document">`                       | Модальності, які приймає модель.                                            |
| `reasoning`     | `boolean`                                                      | Чи надає модель поведінку reasoning.                                        |
| `contextWindow` | `number`                                                       | Нативне вікно контексту провайдера.                                         |
| `contextTokens` | `number`                                                       | Необов’язкове ефективне обмеження контексту runtime, якщо воно відрізняється від `contextWindow`. |
| `maxTokens`     | `number`                                                       | Максимальна кількість вихідних токенів, якщо відома.                        |
| `cost`          | `object`                                                       | Необов’язкова ціна в USD за мільйон токенів, зокрема необов’язковий `tieredPricing`. |
| `compat`        | `object`                                                       | Необов’язкові прапорці сумісності, що відповідають сумісності конфігурації моделей OpenClaw. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Статус у переліку. Приховуйте лише тоді, коли рядок взагалі не повинен відображатися. |
| `statusReason`  | `string`                                                       | Необов’язкова причина, що показується з недоступним статусом.               |
| `replaces`      | `string[]`                                                     | Старіші локальні для провайдера id моделей, які ця модель замінює.          |
| `replacedBy`    | `string`                                                       | Локальний для провайдера id моделі-замінника для застарілих рядків.         |
| `tags`          | `string[]`                                                     | Стабільні теги, що використовуються засобами вибору та фільтрами.           |

Не розміщуйте в `modelCatalog` дані лише для runtime. Якщо провайдеру потрібен стан
облікового запису, API-запит або виявлення локального процесу, щоб визначити повний
набір моделей, оголосіть цього провайдера як `refreshable` або `runtime` у `discovery`.

Застарілі ключі можливостей верхнього рівня знецінено. Використовуйте `openclaw doctor --fix`, щоб
перемістити `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` і `webSearchProviders` під `contracts`; звичайне
завантаження маніфесту більше не розглядає ці поля верхнього рівня як
володіння можливостями.

## Маніфест проти `package.json`

Ці два файли виконують різні завдання:

| Файл                   | Для чого використовувати                                                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Виявлення, валідація конфігурації, метадані варіантів автентифікації та підказки UI, які мають існувати до запуску коду plugin |
| `package.json`         | Метадані npm, встановлення залежностей і блок `openclaw`, що використовується для точок входу, обмеження встановлення, setup або метаданих каталогу |

Якщо ви не впевнені, де має бути певний фрагмент метаданих, використовуйте таке правило:

- якщо OpenClaw повинен знати це до завантаження коду plugin, розміщуйте це в `openclaw.plugin.json`
- якщо це стосується пакування, файлів точок входу або поведінки встановлення npm, розміщуйте це в `package.json`

### Поля `package.json`, що впливають на виявлення

Деякі метадані plugin до runtime навмисно розміщуються в `package.json` у блоці
`openclaw`, а не в `openclaw.plugin.json`.

Важливі приклади:

| Поле                                                              | Що воно означає                                                                                                                                                                      |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | Оголошує точки входу нативного plugin. Вони мають залишатися в межах каталогу пакунка plugin.                                                                                      |
| `openclaw.runtimeExtensions`                                      | Оголошує точки входу runtime збудованого JavaScript для встановлених пакунків. Вони мають залишатися в межах каталогу пакунка plugin.                                             |
| `openclaw.setupEntry`                                             | Полегшена точка входу лише для setup, що використовується під час онбордингу, відкладеного запуску каналу та виявлення статусу каналу/SecretRef лише для читання. Має залишатися в межах каталогу пакунка plugin. |
| `openclaw.runtimeSetupEntry`                                      | Оголошує збудовану JavaScript-точку входу setup для встановлених пакунків. Має залишатися в межах каталогу пакунка plugin.                                                        |
| `openclaw.channel`                                                | Легкі метадані каталогу каналів, як-от мітки, шляхи до документації, псевдоніми та тексти вибору.                                                                                  |
| `openclaw.channel.configuredState`                                | Полегшені метадані перевірки налаштованого стану, які можуть відповісти на питання "чи вже існує налаштування лише через env?" без завантаження повного runtime каналу.          |
| `openclaw.channel.persistedAuthState`                             | Полегшені метадані перевірки збереженого стану автентифікації, які можуть відповісти на питання "чи вже є хоча б один вхід у систему?" без завантаження повного runtime каналу.   |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Підказки встановлення/оновлення для вбудованих і зовнішньо опублікованих plugin.                                                                                                    |
| `openclaw.install.defaultChoice`                                  | Бажаний шлях встановлення, коли доступно кілька джерел встановлення.                                                                                                                |
| `openclaw.install.minHostVersion`                                 | Мінімальна підтримувана версія хоста OpenClaw із semver-нижньою межею на кшталт `>=2026.3.22`.                                                                                     |
| `openclaw.install.expectedIntegrity`                              | Очікуваний рядок цілісності npm dist, наприклад `sha512-...`; потоки встановлення та оновлення звіряють із ним отриманий артефакт.                                                |
| `openclaw.install.allowInvalidConfigRecovery`                     | Дозволяє вузький шлях відновлення перевстановлення вбудованого plugin, коли конфігурація невалідна.                                                                                 |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Дозволяє поверхням каналу лише для setup завантажуватися до повного plugin каналу під час запуску.                                                                                 |

Метадані маніфесту визначають, які варіанти провайдера/каналу/setup з’являються в
онбордингу до завантаження runtime. `package.json#openclaw.install` повідомляє
онбордингу, як отримати або ввімкнути цей plugin, коли користувач вибирає один із цих
варіантів. Не переносіть підказки встановлення до `openclaw.plugin.json`.

`openclaw.install.minHostVersion` перевіряється під час встановлення та завантаження
реєстру маніфестів. Невалідні значення відхиляються; новіші, але валідні значення пропускають
plugin на старіших хостах.

Точне закріплення версії npm уже міститься в `npmSpec`, наприклад
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Офіційні записи зовнішнього каталогу
повинні поєднувати точні специфікації з `expectedIntegrity`, щоб потоки оновлення
завершувалися в закритий спосіб, якщо отриманий npm-артефакт більше не відповідає
закріпленому релізу. Інтерактивний онбординг для сумісності все ще пропонує npm-специфікації
довіреного реєстру, зокрема прості назви пакунків і dist-tags. Діагностика каталогу може
розрізняти точні, плаваючі, закріплені за цілісністю, без цілісності, з
невідповідністю назви пакунка та з невалідним default-choice джерела. Вона також попереджає, коли
`expectedIntegrity` присутній, але немає валідного npm-джерела, до якого його можна прив’язати.
Коли `expectedIntegrity` присутній,
потоки встановлення/оновлення застосовують його; коли його пропущено, розв’язання реєстру
фіксується без прив’язки до цілісності.

Plugin каналів повинні надавати `openclaw.setupEntry`, коли перевірки статусу, списку каналів
або SecretRef мають визначати налаштовані облікові записи без завантаження повного
runtime. Точка входу setup повинна відкривати метадані каналу разом із безпечними для setup
адаптерами конфігурації, статусу та секретів; мережеві клієнти, слухачі Gateway і
transport runtime слід залишати в основній точці входу розширення.

Поля точок входу runtime не перевизначають перевірки меж пакунка для полів
точок входу вихідного коду. Наприклад, `openclaw.runtimeExtensions` не може зробити
придатним до завантаження шлях `openclaw.extensions`, що виходить за межі.

`openclaw.install.allowInvalidConfigRecovery` навмисно має вузьку дію. Він
не робить довільні зламані конфігурації придатними до встановлення. Наразі він дозволяє потокам встановлення
відновлюватися лише після конкретних застарілих збоїв оновлення вбудованих plugin, як-от
відсутній шлях до вбудованого plugin або застарілий запис `channels.<id>` для цього самого
вбудованого plugin. Не пов’язані помилки конфігурації й далі блокують встановлення і спрямовують операторів
до `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` — це метадані пакунка для крихітного модуля-перевіряча:

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
позитивного/негативного запиту автентифікації до завантаження повного plugin каналу. Цільовий експорт має бути
невеликою функцією, яка читає лише збережений стан; не спрямовуйте його через широкий runtime-barrel
повного каналу.

`openclaw.channel.configuredState` має ту саму форму для дешевих перевірок
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

Використовуйте це, коли канал може визначити налаштований стан за env або іншими невеликими
не-runtime-входами. Якщо перевірка потребує повного розв’язання конфігурації або реального
runtime каналу, залиште цю логіку в hook `config.hasConfiguredState`
plugin.

## Пріоритет виявлення (дубльовані id plugin)

OpenClaw виявляє plugin з кількох коренів (вбудовані, глобальне встановлення, workspace, явно вибрані в конфігурації шляхи). Якщо два виявлені plugin мають однаковий `id`, зберігається лише маніфест із **найвищим пріоритетом**; дублікати з нижчим пріоритетом відкидаються замість завантаження поруч із ним.

Пріоритет від найвищого до найнижчого:

1. **Вибраний у конфігурації** — шлях, явно закріплений у `plugins.entries.<id>`
2. **Вбудований** — plugin, що постачаються з OpenClaw
3. **Глобальне встановлення** — plugin, встановлені в глобальний корінь plugin OpenClaw
4. **Workspace** — plugin, виявлені відносно поточного workspace

Наслідки:

- Розгалужена або застаріла копія вбудованого plugin у workspace не перекриє вбудовану збірку.
- Щоб справді перевизначити вбудований plugin локальним, закріпіть його через `plugins.entries.<id>`, щоб він переміг за пріоритетом, а не покладайтеся на виявлення у workspace.
- Відкидання дублікатів журналюється, щоб Doctor і діагностика запуску могли вказати на відкинуту копію.

## Вимоги до JSON Schema

- **Кожен plugin повинен постачати JSON Schema**, навіть якщо він не приймає конфігурацію.
- Порожня схема допустима (наприклад, `{ "type": "object", "additionalProperties": false }`).
- Схеми перевіряються під час читання/запису конфігурації, а не під час runtime.

## Поведінка валідації

- Невідомі ключі `channels.*` — це **помилки**, якщо лише id каналу не оголошено
  маніфестом plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` і `plugins.slots.*`
  повинні посилатися на **виявлювані** id plugin. Невідомі id — це **помилки**.
- Якщо plugin встановлено, але його маніфест або схема пошкоджені чи відсутні,
  валідація завершується помилкою, а Doctor повідомляє про помилку plugin.
- Якщо конфігурація plugin існує, але plugin **вимкнений**, конфігурація зберігається і
  в Doctor + журналах з’являється **попередження**.

Повну схему `plugins.*` див. у [Довіднику з конфігурації](/uk/gateway/configuration).

## Примітки

- Маніфест **обов’язковий для нативних Plugin OpenClaw**, зокрема для локальних завантажень із файлової системи. Runtime і далі завантажує модуль plugin окремо; маніфест потрібен лише для виявлення + валідації.
- Нативні маніфести парсяться за допомогою JSON5, тому коментарі, кінцеві коми та ключі без лапок дозволені, якщо кінцеве значення все ще є об’єктом.
- Завантажувач маніфесту читає лише задокументовані поля маніфесту. Уникайте власних ключів верхнього рівня.
- `channels`, `providers`, `cliBackends` і `skills` можна опускати, якщо plugin їх не потребує.
- `providerDiscoveryEntry` має залишатися легким і не повинен імпортувати широкий runtime-код; використовуйте його для статичних метаданих каталогу провайдера або вузьких дескрипторів виявлення, а не для виконання під час запиту.
- Ексклюзивні типи plugin вибираються через `plugins.slots.*`: `kind: "memory"` через `plugins.slots.memory`, `kind: "context-engine"` через `plugins.slots.contextEngine` (типово `legacy`).
- Метадані env vars (`setup.providers[].envVars`, застарілий `providerAuthEnvVars` і `channelEnvVars`) є лише декларативними. Статус, аудит, перевірка доставки Cron та інші поверхні лише для читання й далі застосовують політику довіри до plugin та ефективної активації перед тим, як вважати env var налаштованою.
- Метадані runtime wizard, які потребують коду провайдера, див. у [Хуки runtime провайдера](/uk/plugins/architecture-internals#provider-runtime-hooks).
- Якщо ваш plugin залежить від нативних модулів, задокументуйте кроки збірки та будь-які вимоги до allowlist менеджера пакунків (наприклад, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Пов’язане

<CardGroup cols={3}>
  <Card title="Створення plugin" href="/uk/plugins/building-plugins" icon="rocket">
    Початок роботи з plugin.
  </Card>
  <Card title="Архітектура plugin" href="/uk/plugins/architecture" icon="diagram-project">
    Внутрішня архітектура та модель можливостей.
  </Card>
  <Card title="Огляд SDK" href="/uk/plugins/sdk-overview" icon="book">
    Довідник SDK plugin та імпорти підшляхів.
  </Card>
</CardGroup>
