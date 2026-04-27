---
read_when:
    - Ви створюєте Plugin для OpenClaw
    - Вам потрібно надати схему конфігурації plugin або налагодити помилки перевірки plugin
summary: Вимоги до маніфесту Plugin + схеми JSON (сувора перевірка конфігурації)
title: маніфест Plugin
x-i18n:
    generated_at: "2026-04-27T19:39:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a700ecd97b16735e415814731841c686490f12d0e303c09800afe664880ec3e
    source_path: plugins/manifest.md
    workflow: 15
---

Ця сторінка призначена лише для **власного маніфесту Plugin OpenClaw**.

Сумісні макети пакетів описано тут: [Пакети Plugin](/uk/plugins/bundles).

Сумісні формати пакетів використовують інші файли маніфесту:

- пакет Codex: `.codex-plugin/plugin.json`
- пакет Claude: `.claude-plugin/plugin.json` або стандартний макет компонента Claude
  без маніфесту
- пакет Cursor: `.cursor-plugin/plugin.json`

OpenClaw також автоматично визначає ці макети пакетів, але вони не проходять перевірку
за схемою `openclaw.plugin.json`, описаною тут.

Для сумісних пакетів OpenClaw наразі зчитує метадані пакета разом з оголошеними
коренями Skills, коренями команд Claude, типовими значеннями `settings.json` у пакетах Claude,
типовими значеннями LSP у пакетах Claude та підтримуваними наборами хуків, коли макет відповідає
очікуванням середовища виконання OpenClaw.

Кожен власний Plugin OpenClaw **повинен** містити файл `openclaw.plugin.json` у
**корені plugin**. OpenClaw використовує цей маніфест для перевірки конфігурації
**без виконання коду plugin**. Відсутні або недійсні маніфести вважаються
помилками plugin і блокують перевірку конфігурації.

Повний посібник із системи plugin дивіться тут: [Plugins](/uk/tools/plugin).
Про власну модель можливостей і поточні рекомендації щодо зовнішньої сумісності:
[Модель можливостей](/uk/plugins/architecture#public-capability-model).

## Що робить цей файл

`openclaw.plugin.json` — це метадані, які OpenClaw зчитує **до завантаження коду
вашого plugin**. Усе нижче має бути достатньо легким для перевірки без запуску
середовища виконання plugin.

**Використовуйте його для:**

- ідентифікації plugin, перевірки конфігурації та підказок для UI конфігурації
- метаданих автентифікації, онбордингу й налаштування (псевдонім, автоувімкнення, змінні середовища provider, варіанти автентифікації)
- підказок активації для поверхонь control-plane
- скороченого визначення належності до сімейства моделей
- статичних знімків належності можливостей (`contracts`)
- метаданих QA runner, які може перевіряти спільний хост `openclaw qa`
- метаданих конфігурації, специфічних для channel, що об’єднуються в каталог і поверхні перевірки

**Не використовуйте його для:** реєстрації поведінки під час виконання, оголошення
точок входу коду або метаданих встановлення npm. Вони належать вашому коду plugin і `package.json`.

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
  "modelIdNormalization": {
    "providers": {
      "openrouter": {
        "prefixWhenBare": "openrouter"
      }
    }
  },
  "providerEndpoints": [
    {
      "endpointClass": "openrouter",
      "hostSuffixes": ["openrouter.ai"]
    }
  ],
  "providerRequest": {
    "providers": {
      "openrouter": {
        "family": "openrouter"
      }
    }
  },
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
| `id`                                 | Так         | `string`                         | Канонічний ідентифікатор plugin. Саме цей ідентифікатор використовується в `plugins.entries.<id>`.                                                                                                                                |
| `configSchema`                       | Так         | `object`                         | Вбудована схема JSON для конфігурації цього plugin.                                                                                                                                                                                |
| `enabledByDefault`                   | Ні          | `true`                           | Позначає пакетний plugin як увімкнений типово. Опустіть це поле або встановіть будь-яке значення, відмінне від `true`, щоб plugin за замовчуванням залишався вимкненим.                                                          |
| `legacyPluginIds`                    | Ні          | `string[]`                       | Застарілі ідентифікатори, які нормалізуються до цього канонічного ідентифікатора plugin.                                                                                                                                          |
| `autoEnableWhenConfiguredProviders`  | Ні          | `string[]`                       | Ідентифікатори provider, які мають автоматично вмикати цей plugin, коли згадуються автентифікація, конфігурація або посилання на моделі.                                                                                         |
| `kind`                               | Ні          | `"memory"` \| `"context-engine"` | Оголошує ексклюзивний тип plugin, який використовується `plugins.slots.*`.                                                                                                                                                         |
| `channels`                           | Ні          | `string[]`                       | Ідентифікатори channel, що належать цьому plugin. Використовуються для виявлення та перевірки конфігурації.                                                                                                                       |
| `providers`                          | Ні          | `string[]`                       | Ідентифікатори provider, що належать цьому plugin.                                                                                                                                                                                 |
| `providerDiscoveryEntry`             | Ні          | `string`                         | Шлях до полегшеного модуля виявлення provider, відносно кореня plugin, для метаданих каталогу provider в межах маніфесту, які можна завантажити без активації повного середовища виконання plugin.                             |
| `modelSupport`                       | Ні          | `object`                         | Короткі метадані сімейства моделей, що належать маніфесту та використовуються для автоматичного завантаження plugin до запуску середовища виконання.                                                                             |
| `modelCatalog`                       | Ні          | `object`                         | Декларативні метадані каталогу моделей для provider, що належать цьому plugin. Це контракт control-plane для майбутнього доступного лише для читання переліку, онбордингу, вибору моделей, псевдонімів і придушення без завантаження середовища виконання plugin. |
| `modelPricing`                       | Ні          | `object`                         | Політика зовнішнього пошуку цін, що належить provider. Використовуйте її, щоб виключати локальні/self-hosted provider з віддалених каталогів цін або зіставляти посилання provider з ідентифікаторами каталогів OpenRouter/LiteLLM без жорсткого кодування ідентифікаторів provider у ядрі. |
| `modelIdNormalization`               | Ні          | `object`                         | Очищення псевдонімів/префіксів ідентифікаторів моделей, що належить provider і має виконуватися до завантаження середовища виконання provider.                                                                                    |
| `providerEndpoints`                  | Ні          | `object[]`                       | Метадані хоста/baseUrl кінцевих точок, що належать маніфесту, для маршрутів provider, які ядро має класифікувати до завантаження середовища виконання provider.                                                                  |
| `providerRequest`                    | Ні          | `object`                         | Легкі метадані сімейства provider і сумісності запитів, що використовуються загальною політикою запитів до завантаження середовища виконання provider.                                                                           |
| `cliBackends`                        | Ні          | `string[]`                       | Ідентифікатори backend CLI inference, що належать цьому plugin. Використовуються для автоактивації під час запуску на основі явних посилань у конфігурації.                                                                       |
| `syntheticAuthRefs`                  | Ні          | `string[]`                       | Посилання на provider або backend CLI, для яких слід перевіряти власний synthetic auth hook plugin під час холодного виявлення моделей до завантаження середовища виконання.                                                     |
| `nonSecretAuthMarkers`               | Ні          | `string[]`                       | Значення-заповнювачі ключів API, що належать пакетному plugin і представляють несекретний локальний стан, стан OAuth або ambient credential state.                                                                                |
| `commandAliases`                     | Ні          | `object[]`                       | Назви команд, що належать цьому plugin і мають створювати діагностику конфігурації та CLI з урахуванням plugin до завантаження середовища виконання.                                                                              |
| `providerAuthEnvVars`                | Ні          | `Record<string, string[]>`       | Застарілі сумісні метадані env для пошуку автентифікації/статусу provider. Для нових plugin надавайте перевагу `setup.providers[].envVars`; OpenClaw усе ще зчитує це протягом вікна зворотної сумісності.                    |
| `providerAuthAliases`                | Ні          | `Record<string, string>`         | Ідентифікатори provider, які мають повторно використовувати інший ідентифікатор provider для пошуку автентифікації, наприклад provider для кодування, який ділить ключ API базового provider і профілі автентифікації.         |
| `channelEnvVars`                     | Ні          | `Record<string, string[]>`       | Легкі метадані env для channel, які OpenClaw може перевіряти без завантаження коду plugin. Використовуйте це для налаштування channel через env або поверхонь автентифікації, які мають бачити загальні помічники запуску/конфігурації. |
| `providerAuthChoices`                | Ні          | `object[]`                       | Легкі метадані варіантів автентифікації для вибору під час онбордингу, визначення пріоритетного provider і простого зв’язування з прапорцями CLI.                                                                                  |
| `activation`                         | Ні          | `object`                         | Легкі метадані планувальника активації для завантаження, що ініціюється provider, командою, channel, маршрутом і можливістю. Лише метадані; фактична поведінка, як і раніше, належить середовищу виконання plugin.             |
| `setup`                              | Ні          | `object`                         | Легкі дескриптори налаштування/онбордингу, які поверхні виявлення та налаштування можуть перевіряти без завантаження середовища виконання plugin.                                                                                 |
| `qaRunners`                          | Ні          | `object[]`                       | Легкі дескриптори QA runner, які використовує спільний хост `openclaw qa` до завантаження середовища виконання plugin.                                                                                                            |
| `contracts`                          | Ні          | `object`                         | Статичний знімок пакетних можливостей для зовнішніх auth hook, speech, realtime transcription, realtime voice, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search і належності інструментів. |
| `mediaUnderstandingProviderMetadata` | Ні          | `Record<string, object>`         | Легкі типові значення media-understanding для ідентифікаторів provider, оголошених у `contracts.mediaUnderstandingProviders`.                                                                                                     |
| `channelConfigs`                     | Ні          | `Record<string, object>`         | Метадані конфігурації channel, що належать маніфесту та об’єднуються в поверхні виявлення і перевірки до завантаження середовища виконання.                                                                                       |
| `skills`                             | Ні          | `string[]`                       | Каталоги Skill для завантаження, відносно кореня plugin.                                                                                                                                                                           |
| `name`                               | Ні          | `string`                         | Людинозрозуміла назва plugin.                                                                                                                                                                                                      |
| `description`                        | Ні          | `string`                         | Короткий опис, що показується в поверхнях plugin.                                                                                                                                                                                  |
| `version`                            | Ні          | `string`                         | Інформаційна версія plugin.                                                                                                                                                                                                        |
| `uiHints`                            | Ні          | `Record<string, object>`         | Підписи UI, placeholder-и та підказки щодо чутливості для полів конфігурації.                                                                                                                                                     |

## Довідник `providerAuthChoices`

Кожен запис `providerAuthChoices` описує один варіант онбордингу або автентифікації.
OpenClaw зчитує це до завантаження середовища виконання provider.
Списки налаштування provider використовують ці варіанти маніфесту, варіанти
налаштування, похідні від дескрипторів, і метадані каталогу встановлення без
завантаження середовища виконання provider.

| Поле                 | Обов’язкове | Тип                                             | Що воно означає                                                                                  |
| -------------------- | ----------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `provider`           | Так         | `string`                                        | Ідентифікатор provider, до якого належить цей варіант.                                           |
| `method`             | Так         | `string`                                        | Ідентифікатор методу автентифікації, до якого слід виконати диспетчеризацію.                     |
| `choiceId`           | Так         | `string`                                        | Стабільний ідентифікатор варіанта автентифікації, який використовується в потоках онбордингу і CLI. |
| `choiceLabel`        | Ні          | `string`                                        | Підпис для користувача. Якщо опущено, OpenClaw використовує `choiceId` як запасний варіант.      |
| `choiceHint`         | Ні          | `string`                                        | Короткий допоміжний текст для засобу вибору.                                                     |
| `assistantPriority`  | Ні          | `number`                                        | Менші значення сортуються раніше в інтерактивних засобах вибору, керованих асистентом.           |
| `assistantVisibility`| Ні          | `"visible"` \| `"manual-only"`                  | Приховує варіант із засобів вибору асистента, але все одно дозволяє ручний вибір через CLI.      |
| `deprecatedChoiceIds`| Ні          | `string[]`                                      | Застарілі ідентифікатори варіантів, які мають перенаправляти користувачів до цього варіанта-замінника. |
| `groupId`            | Ні          | `string`                                        | Необов’язковий ідентифікатор групи для групування пов’язаних варіантів.                          |
| `groupLabel`         | Ні          | `string`                                        | Підпис цієї групи для користувача.                                                               |
| `groupHint`          | Ні          | `string`                                        | Короткий допоміжний текст для групи.                                                             |
| `optionKey`          | Ні          | `string`                                        | Внутрішній ключ опції для простих потоків автентифікації з одним прапорцем.                      |
| `cliFlag`            | Ні          | `string`                                        | Назва прапорця CLI, наприклад `--openrouter-api-key`.                                            |
| `cliOption`          | Ні          | `string`                                        | Повна форма опції CLI, наприклад `--openrouter-api-key <key>`.                                   |
| `cliDescription`     | Ні          | `string`                                        | Опис, що використовується в довідці CLI.                                                         |
| `onboardingScopes`   | Ні          | `Array<"text-inference" \| "image-generation">` | У яких поверхнях онбордингу має з’являтися цей варіант. Якщо опущено, за замовчуванням використовується `["text-inference"]`. |

## Довідник `commandAliases`

Використовуйте `commandAliases`, коли plugin володіє назвою команди середовища виконання, яку користувачі можуть
помилково помістити в `plugins.allow` або спробувати запустити як кореневу команду CLI. OpenClaw
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

| Поле         | Обов’язкове | Тип               | Що воно означає                                                          |
| ------------ | ----------- | ----------------- | ------------------------------------------------------------------------ |
| `name`       | Так         | `string`          | Назва команди, що належить цьому plugin.                                 |
| `kind`       | Ні          | `"runtime-slash"` | Позначає псевдонім як slash-команду чату, а не як кореневу команду CLI.  |
| `cliCommand` | Ні          | `string`          | Пов’язана коренева команда CLI, яку слід пропонувати для операцій CLI, якщо вона існує. |

## Довідник `activation`

Використовуйте `activation`, коли plugin може дешево оголосити, які події control-plane
мають включати його до плану активації/завантаження.

Цей блок є метаданими планувальника, а не API життєвого циклу. Він не реєструє
поведінку під час виконання, не замінює `register(...)` і не гарантує, що код
plugin уже було виконано. Планувальник активації використовує ці поля, щоб
звузити коло кандидатів plugin перед поверненням до наявних метаданих належності з маніфесту,
таких як `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` і hooks.

Надавайте перевагу найвужчим метаданим, які вже описують належність. Використовуйте
`providers`, `channels`, `commandAliases`, дескриптори setup або `contracts`,
коли ці поля виражають цей зв’язок. Використовуйте `activation` для додаткових підказок планувальнику,
які неможливо подати через ці поля належності.
Використовуйте верхньорівневий `cliBackends` для псевдонімів середовища виконання CLI, таких як `claude-cli`,
`codex-cli` або `google-gemini-cli`; `activation.onAgentHarnesses` призначений лише для
ідентифікаторів вбудованих agent harness, які ще не мають поля належності.

Цей блок містить лише метадані. Він не реєструє поведінку під час виконання й не
замінює `register(...)`, `setupEntry` або інші точки входу runtime/plugin.
Поточні споживачі використовують його як підказку для звуження перед ширшим завантаженням plugin, тож
відсутність метаданих активації зазвичай лише впливає на продуктивність; вона не повинна
змінювати коректність, доки ще існують застарілі fallback-механізми належності в маніфесті.

```json
{
  "activation": {
    "onProviders": ["openai"],
    "onCommands": ["models"],
    "onChannels": ["web"],
    "onRoutes": ["gateway-webhook"],
    "onConfigPaths": ["browser"],
    "onCapabilities": ["provider", "tool"]
  }
}
```

| Поле               | Обов’язкове | Тип                                                  | Що воно означає                                                                                                                                    |
| ------------------ | ----------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onProviders`      | Ні          | `string[]`                                           | Ідентифікатори provider, які мають включати цей plugin до планів активації/завантаження.                                                          |
| `onAgentHarnesses` | Ні          | `string[]`                                           | Ідентифікатори середовища виконання вбудованих agent harness, які мають включати цей plugin до планів активації/завантаження. Для псевдонімів backend CLI використовуйте верхньорівневий `cliBackends`. |
| `onCommands`       | Ні          | `string[]`                                           | Ідентифікатори команд, які мають включати цей plugin до планів активації/завантаження.                                                            |
| `onChannels`       | Ні          | `string[]`                                           | Ідентифікатори channel, які мають включати цей plugin до планів активації/завантаження.                                                           |
| `onRoutes`         | Ні          | `string[]`                                           | Типи маршрутів, які мають включати цей plugin до планів активації/завантаження.                                                                   |
| `onConfigPaths`    | Ні          | `string[]`                                           | Відносні до кореня шляхи конфігурації, які мають включати цей plugin до планів запуску/завантаження, коли шлях присутній і не вимкнений явно.    |
| `onCapabilities`   | Ні          | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Загальні підказки щодо можливостей, які використовуються плануванням активації control-plane. Коли можливо, надавайте перевагу вужчим полям.     |

Поточні активні споживачі:

- планування CLI, ініційоване командою, повертається до застарілих
  `commandAliases[].cliCommand` або `commandAliases[].name`
- планування запуску agent-runtime використовує `activation.onAgentHarnesses` для
  вбудованих harness і верхньорівневий `cliBackends[]` для псевдонімів середовища виконання CLI
- планування setup/channel, ініційоване channel, повертається до застарілої
  належності `channels[]`, коли явні метадані активації channel відсутні
- планування plugin під час запуску використовує `activation.onConfigPaths` для некaнальних кореневих
  поверхонь конфігурації, таких як блок `browser` пакетного browser plugin
- планування setup/runtime, ініційоване provider, повертається до застарілої
  належності `providers[]` і верхньорівневого `cliBackends[]`, коли явні метадані активації provider
  відсутні

Діагностика планувальника може відрізняти явні підказки активації від fallback-механізму
належності маніфесту. Наприклад, `activation-command-hint` означає, що збіглося
`activation.onCommands`, а `manifest-command-alias` означає, що
планувальник натомість використав належність `commandAliases`. Ці мітки причин призначені для
діагностики хоста й тестів; авторам plugin слід і надалі оголошувати метадані,
які найкраще описують належність.

## Довідник `qaRunners`

Використовуйте `qaRunners`, коли plugin додає один або кілька transport runner під
спільним коренем `openclaw qa`. Зберігайте ці метадані легкими й статичними; фактичною
реєстрацією CLI як і раніше керує середовище виконання plugin через полегшену
поверхню `runtime-api.ts`, яка експортує `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Запускає Docker-backed Matrix live QA lane на одноразовому homeserver"
    }
  ]
}
```

| Поле          | Обов’язкове | Тип      | Що воно означає                                                    |
| ------------- | ----------- | -------- | ------------------------------------------------------------------ |
| `commandName` | Так         | `string` | Підкоманда, що монтується під `openclaw qa`, наприклад `matrix`.   |
| `description` | Ні          | `string` | Запасний текст довідки, який використовується, коли спільному хосту потрібна stub-команда. |

## Довідник `setup`

Використовуйте `setup`, коли поверхням налаштування й онбордингу потрібні легкі метадані, що належать plugin,
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

Верхньорівневий `cliBackends` залишається чинним і надалі описує
backend CLI inference. `setup.cliBackends` — це поверхня дескрипторів, специфічна для setup,
для потоків control-plane/setup, які мають залишатися лише метаданими.

Коли присутні, `setup.providers` і `setup.cliBackends` є бажаною
поверхнею пошуку setup у стилі descriptor-first. Якщо дескриптор лише
звужує коло кандидатів plugin і setup усе ще потребує багатших runtime hook під час налаштування,
встановіть `requiresRuntime: true` і залиште `setup-api` як
fallback-шлях виконання.

OpenClaw також включає `setup.providers[].envVars` у загальні пошуки автентифікації provider і
env var. `providerAuthEnvVars` залишається підтримуваним через адаптер сумісності протягом
періоду застарівання, але небандловані plugin, які все ще його використовують,
отримують діагностику маніфесту. Нові plugin повинні розміщувати метадані env для setup/статусу
в `setup.providers[].envVars`.

OpenClaw також може виводити прості варіанти setup з `setup.providers[].authMethods`,
коли запис setup недоступний або коли `setup.requiresRuntime: false`
вказує, що runtime для setup не потрібен. Явні записи `providerAuthChoices` залишаються
бажаними для спеціальних підписів, прапорців CLI, області онбордингу й метаданих асистента.

Установлюйте `requiresRuntime: false` лише тоді, коли цих дескрипторів достатньо для
поверхні setup. OpenClaw трактує явне `false` як контракт лише на рівні дескрипторів
і не виконуватиме `setup-api` або `openclaw.setupEntry` для пошуку setup. Якщо
plugin лише з дескрипторами все ж постачає один із цих runtime-записів setup,
OpenClaw повідомляє додаткову діагностику й продовжує його ігнорувати. Якщо
`requiresRuntime` пропущено, зберігається застаріла fallback-поведінка, щоб наявні plugin,
які додали дескриптори без цього прапорця, не ламалися.

Оскільки пошук setup може виконувати код `setup-api`, що належить plugin,
нормалізовані значення `setup.providers[].id` і `setup.cliBackends[]` мають залишатися
унікальними серед усіх виявлених plugin. Неоднозначна належність закривається безпечно,
а не вибирає переможця за порядком виявлення.

Коли runtime setup все ж виконується, діагностика реєстру setup повідомляє про дрейф
дескрипторів, якщо `setup-api` реєструє provider або backend CLI, які не оголошені
в дескрипторах маніфесту, або якщо дескриптор не має відповідної runtime-реєстрації.
Ця діагностика є додатковою й не відхиляє застарілі plugin.

### Довідник `setup.providers`

| Поле          | Обов’язкове | Тип        | Що воно означає                                                                      |
| ------------- | ----------- | ---------- | ------------------------------------------------------------------------------------ |
| `id`          | Так         | `string`   | Ідентифікатор provider, який показується під час setup або онбордингу. Нормалізовані ідентифікатори мають бути глобально унікальними. |
| `authMethods` | Ні          | `string[]` | Ідентифікатори методів setup/автентифікації, які цей provider підтримує без завантаження повного runtime. |
| `envVars`     | Ні          | `string[]` | Змінні середовища, які загальні поверхні setup/статусу можуть перевіряти до завантаження runtime plugin. |

### Поля `setup`

| Поле               | Обов’язкове | Тип        | Що воно означає                                                                                      |
| ------------------ | ----------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| `providers`        | Ні          | `object[]` | Дескриптори setup provider, які показуються під час setup та онбордингу.                            |
| `cliBackends`      | Ні          | `string[]` | Ідентифікатори backend, що використовуються під час setup для пошуку setup у стилі descriptor-first. Нормалізовані ідентифікатори мають бути глобально унікальними. |
| `configMigrations` | Ні          | `string[]` | Ідентифікатори міграцій конфігурації, що належать поверхні setup цього plugin.                      |
| `requiresRuntime`  | Ні          | `boolean`  | Чи потребує setup виконання `setup-api` після пошуку за дескрипторами.                              |

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
| `label`       | `string`   | Підпис поля для користувача.            |
| `help`        | `string`   | Короткий допоміжний текст.              |
| `tags`        | `string[]` | Необов’язкові теги UI.                  |
| `advanced`    | `boolean`  | Позначає поле як розширене.             |
| `sensitive`   | `boolean`  | Позначає поле як секретне або чутливе.  |
| `placeholder` | `string`   | Текст placeholder для полів форми.      |

## Довідник `contracts`

Використовуйте `contracts` лише для статичних метаданих належності можливостей, які OpenClaw може
зчитувати без імпорту runtime plugin.

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
    "migrationProviders": ["hermes"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Кожен список є необов’язковим:

| Поле                             | Тип        | Що воно означає                                                           |
| -------------------------------- | ---------- | ------------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Ідентифікатори фабрик розширень app-server Codex, наразі `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | Ідентифікатори runtime, для яких пакетний plugin може реєструвати middleware результатів інструментів. |
| `externalAuthProviders`          | `string[]` | Ідентифікатори provider, чиї hooks зовнішнього профілю автентифікації належать цьому plugin. |
| `speechProviders`                | `string[]` | Ідентифікатори provider мовлення, що належать цьому plugin.               |
| `realtimeTranscriptionProviders` | `string[]` | Ідентифікатори provider транскрипції в реальному часі, що належать цьому plugin. |
| `realtimeVoiceProviders`         | `string[]` | Ідентифікатори voice provider у реальному часі, що належать цьому plugin. |
| `memoryEmbeddingProviders`       | `string[]` | Ідентифікатори provider embedding для пам’яті, що належать цьому plugin.  |
| `mediaUnderstandingProviders`    | `string[]` | Ідентифікатори provider media-understanding, що належать цьому plugin.    |
| `imageGenerationProviders`       | `string[]` | Ідентифікатори provider генерації зображень, що належать цьому plugin.    |
| `videoGenerationProviders`       | `string[]` | Ідентифікатори provider генерації відео, що належать цьому plugin.        |
| `webFetchProviders`              | `string[]` | Ідентифікатори provider web-fetch, що належать цьому plugin.              |
| `webSearchProviders`             | `string[]` | Ідентифікатори provider web search, що належать цьому plugin.             |
| `migrationProviders`             | `string[]` | Ідентифікатори import provider, що належать цьому plugin для `openclaw migrate`. |
| `tools`                          | `string[]` | Назви агентських інструментів, що належать цьому plugin для перевірок пакетних контрактів. |

`contracts.embeddedExtensionFactories` збережено для пакетних фабрик розширень
лише для app-server Codex. Пакетні трансформації результатів інструментів повинні
оголошувати `contracts.agentToolResultMiddleware` і реєструватися через
`api.registerAgentToolResultMiddleware(...)`. Зовнішні plugin не можуть
реєструвати middleware результатів інструментів, оскільки цей seam може переписувати
високодовірений вивід інструмента до того, як модель його побачить.

Plugin provider, які реалізують `resolveExternalAuthProfiles`, повинні оголошувати
`contracts.externalAuthProviders`. Plugin без цього оголошення все ще працюють
через застарілий fallback-механізм сумісності, але він повільніший і
буде видалений після вікна міграції.

Пакетні provider embedding для пам’яті повинні оголошувати
`contracts.memoryEmbeddingProviders` для кожного ідентифікатора адаптера, який вони надають, включно з
вбудованими адаптерами, такими як `local`. Окремі шляхи CLI використовують цей контракт маніфесту,
щоб завантажувати лише plugin-власник до того, як повний runtime Gateway зареєструє
provider.

## Довідник `mediaUnderstandingProviderMetadata`

Використовуйте `mediaUnderstandingProviderMetadata`, коли provider media-understanding має
типові моделі, пріоритет fallback-автентифікації або вбудовану підтримку документів, які
потрібні загальним допоміжним засобам ядра до завантаження runtime. Ключі також мають бути оголошені в
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

| Поле                   | Тип                                 | Що воно означає                                                              |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Медіаможливості, які надає цей provider.                                     |
| `defaultModels`        | `Record<string, string>`            | Типові значення модель-для-можливості, що використовуються, коли конфігурація не вказує модель. |
| `autoPriority`         | `Record<string, number>`            | Менші числа сортуються раніше для автоматичного fallback provider на основі облікових даних. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Вбудовані входи документів, які підтримує provider.                          |

## Довідник `channelConfigs`

Використовуйте `channelConfigs`, коли channel plugin потребує легких метаданих конфігурації до
завантаження runtime. Виявлення налаштування/статусу channel лише для читання може використовувати ці метадані
безпосередньо для налаштованих зовнішніх channel, коли запис setup недоступний або
коли `setup.requiresRuntime: false` вказує, що runtime setup не потрібен.

`channelConfigs` — це метадані маніфесту plugin, а не новий користувацький розділ
конфігурації верхнього рівня. Користувачі, як і раніше, налаштовують екземпляри channel у `channels.<channel-id>`.
OpenClaw зчитує метадані маніфесту, щоб визначити, якому plugin належить цей налаштований
channel, до виконання коду runtime plugin.

Для channel plugin `configSchema` і `channelConfigs` описують різні
шляхи:

- `configSchema` перевіряє `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` перевіряє `channels.<channel-id>`

Небандловані plugin, які оголошують `channels[]`, також повинні оголошувати відповідні
записи `channelConfigs`. Без них OpenClaw усе ще може завантажити plugin, але поверхні
схеми конфігурації холодного шляху, setup і Control UI не знатимуть форми параметрів,
що належать channel, доки не виконається runtime plugin.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` і
`nativeSkillsAutoEnabled` можуть оголошувати статичні типові значення `auto` для перевірок конфігурації команд,
які виконуються до завантаження runtime channel. Пакетні channel також можуть публікувати
ті самі типові значення через `package.json#openclaw.channel.commands` поряд з іншими
метаданими каталогу channel, що належать пакету.

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
      "commands": {
        "nativeCommandsAutoEnabled": true,
        "nativeSkillsAutoEnabled": true
      },
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Кожен запис channel може містити:

| Поле         | Тип                      | Що воно означає                                                                          |
| ------------ | ------------------------ | ---------------------------------------------------------------------------------------- |
| `schema`     | `object`                 | Схема JSON для `channels.<id>`. Обов’язкова для кожного оголошеного запису конфігурації channel. |
| `uiHints`    | `Record<string, object>` | Необов’язкові підписи UI/placeholder-и/підказки чутливості для цього розділу конфігурації channel. |
| `label`      | `string`                 | Підпис channel, який об’єднується в поверхні вибору та інспектування, коли runtime-метадані ще не готові. |
| `description`| `string`                 | Короткий опис channel для поверхонь інспектування та каталогу.                           |
| `commands`   | `object`                 | Статичні авто-типові значення native command і native Skill для перевірок конфігурації до запуску runtime. |
| `preferOver` | `string[]`               | Ідентифікатори застарілих або нижчопріоритетних plugin, які цей channel має випереджати в поверхнях вибору. |

### Заміна іншого channel plugin

Використовуйте `preferOver`, коли ваш plugin є бажаним власником для ідентифікатора channel, який
також може надавати інший plugin. Типові випадки — перейменований ідентифікатор plugin,
окремий plugin, що замінює пакетний plugin, або підтримуваний fork, який
зберігає той самий ідентифікатор channel для сумісності конфігурації.

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

Коли налаштовано `channels.chat`, OpenClaw враховує і ідентифікатор channel, і
ідентифікатор бажаного plugin. Якщо plugin нижчого пріоритету було вибрано лише тому,
що він є пакетним або увімкнений типово, OpenClaw вимикає його в ефективній
runtime-конфігурації, щоб один plugin володів channel та його інструментами. Явний
вибір користувача все одно має перевагу: якщо користувач явно вмикає обидва plugin, OpenClaw
зберігає цей вибір і повідомляє діагностику дубльованих channel/інструментів замість
тихого змінення запитаного набору plugin.

Тримайте `preferOver` обмеженим ідентифікаторами plugin, які справді можуть надавати той самий channel.
Це не загальне поле пріоритету, і воно не перейменовує ключі користувацької конфігурації.

## Довідник `modelSupport`

Використовуйте `modelSupport`, коли OpenClaw має виводити ваш provider plugin з
скорочених ідентифікаторів моделей на кшталт `gpt-5.5` або `claude-sonnet-4.6` до завантаження runtime
plugin.

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
- `modelPatterns` мають перевагу над `modelPrefixes`
- якщо збігаються і небандлований plugin, і пакетний plugin, перемагає небандлований
  plugin
- решта неоднозначностей ігноруються, доки користувач або конфігурація не вкаже provider

Поля:

| Поле            | Тип        | Що воно означає                                                              |
| --------------- | ---------- | ---------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Префікси, які зіставляються через `startsWith` зі скороченими ідентифікаторами моделей. |
| `modelPatterns` | `string[]` | Джерела regex, які зіставляються зі скороченими ідентифікаторами моделей після видалення суфікса профілю. |

## Довідник `modelCatalog`

Використовуйте `modelCatalog`, коли OpenClaw має знати метадані моделей provider до
завантаження runtime plugin. Це джерело на рівні маніфесту для фіксованих
рядків каталогу, псевдонімів provider, правил придушення та режиму виявлення. Оновлення runtime
і далі належить коду runtime provider, але маніфест повідомляє ядру, коли runtime
потрібен.

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

| Поле           | Тип                                                      | Що воно означає                                                                                           |
| -------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | Рядки каталогу для ідентифікаторів provider, що належать цьому plugin. Ключі також мають бути присутні у верхньорівневому `providers`. |
| `aliases`      | `Record<string, object>`                                 | Псевдоніми provider, які мають зіставлятися з provider-власником для планування каталогу або придушення. |
| `suppressions` | `object[]`                                               | Рядки моделей з іншого джерела, які цей plugin пригнічує з причини, специфічної для provider.            |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Чи можна читати каталог provider з метаданих маніфесту, оновлювати в кеш або чи він потребує runtime.    |

`aliases` бере участь у пошуку належності provider для планування model catalog.
Цілі псевдонімів мають бути верхньорівневими provider, що належать тому самому plugin. Коли
відфільтрований за provider список використовує псевдонім, OpenClaw може прочитати маніфест власника і
застосувати перевизначення API/base URL псевдоніма без завантаження runtime provider.

`suppressions` є бажаною статичною заміною для runtime hook
`suppressBuiltInModel` provider. Записи придушення враховуються лише тоді, коли
provider належить plugin або оголошений як ключ `modelCatalog.aliases`, що
вказує на provider-власник. Runtime hooks придушення все ще виконуються як застарілий
fallback-механізм сумісності для plugin, які ще не мігрували.

Поля provider:

| Поле      | Тип                      | Що воно означає                                                     |
| --------- | ------------------------ | ------------------------------------------------------------------- |
| `baseUrl` | `string`                 | Необов’язковий типовий base URL для моделей у каталозі цього provider. |
| `api`     | `ModelApi`               | Необов’язковий типовий адаптер API для моделей у каталозі цього provider. |
| `headers` | `Record<string, string>` | Необов’язкові статичні заголовки, що застосовуються до каталогу цього provider. |
| `models`  | `object[]`               | Обов’язкові рядки моделей. Рядки без `id` ігноруються.              |

Поля моделі:

| Поле            | Тип                                                            | Що воно означає                                                              |
| --------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `id`            | `string`                                                       | Локальний для provider ідентифікатор моделі, без префікса `provider/`.      |
| `name`          | `string`                                                       | Необов’язкова відображувана назва.                                           |
| `api`           | `ModelApi`                                                     | Необов’язкове перевизначення API на рівні моделі.                            |
| `baseUrl`       | `string`                                                       | Необов’язкове перевизначення base URL на рівні моделі.                       |
| `headers`       | `Record<string, string>`                                       | Необов’язкові статичні заголовки на рівні моделі.                            |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Модальності, які приймає модель.                                             |
| `reasoning`     | `boolean`                                                      | Чи надає модель поведінку reasoning.                                         |
| `contextWindow` | `number`                                                       | Рідне вікно контексту provider.                                              |
| `contextTokens` | `number`                                                       | Необов’язкове ефективне runtime-обмеження контексту, якщо воно відрізняється від `contextWindow`. |
| `maxTokens`     | `number`                                                       | Максимальна кількість вихідних токенів, якщо відома.                         |
| `cost`          | `object`                                                       | Необов’язкове ціноутворення в USD за мільйон токенів, включно з необов’язковим `tieredPricing`. |
| `compat`        | `object`                                                       | Необов’язкові прапорці сумісності, що відповідають сумісності конфігурації моделей OpenClaw. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Статус у списку. Пригнічуйте лише тоді, коли рядок узагалі не повинен з’являтися. |
| `statusReason`  | `string`                                                       | Необов’язкова причина, що показується разом зі статусом недоступності.       |
| `replaces`      | `string[]`                                                     | Старіші локальні для provider ідентифікатори моделей, які ця модель замінює. |
| `replacedBy`    | `string`                                                       | Локальний для provider ідентифікатор моделі-замінника для застарілих рядків. |
| `tags`          | `string[]`                                                     | Стабільні теги, що використовуються засобами вибору та фільтрами.            |

Не розміщуйте в `modelCatalog` дані, доступні лише під час runtime. Якщо provider потребує стану
облікового запису, API-запиту або виявлення локального процесу, щоб знати повний набір моделей,
оголосіть цей provider як `refreshable` або `runtime` у `discovery`.

## Довідник `modelIdNormalization`

Використовуйте `modelIdNormalization` для легкого очищення ідентифікаторів моделей, що належить provider і має
відбуватися до завантаження runtime provider. Це дозволяє тримати псевдоніми на кшталт коротких назв моделей,
застарілих локальних ідентифікаторів provider і правил префіксів proxy у маніфесті
plugin-власника, а не в таблицях вибору моделей ядра.

```json
{
  "providers": ["anthropic", "openrouter"],
  "modelIdNormalization": {
    "providers": {
      "anthropic": {
        "aliases": {
          "sonnet-4.6": "claude-sonnet-4-6"
        }
      },
      "openrouter": {
        "prefixWhenBare": "openrouter"
      }
    }
  }
}
```

Поля provider:

| Поле                                 | Тип                     | Що воно означає                                                                            |
| ------------------------------------ | ----------------------- | ------------------------------------------------------------------------------------------ |
| `aliases`                            | `Record<string,string>` | Точні псевдоніми ідентифікаторів моделей без урахування регістру. Значення повертаються як записані. |
| `stripPrefixes`                      | `string[]`              | Префікси, які слід видаляти перед пошуком псевдоніма; корисно для застарілого дублювання provider/model. |
| `prefixWhenBare`                     | `string`                | Префікс, який додається, коли нормалізований ідентифікатор моделі ще не містить `/`.      |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Умовні правила префікса для bare id після пошуку псевдоніма, з ключами `modelPrefix` і `prefix`. |

## Довідник `providerEndpoints`

Використовуйте `providerEndpoints` для класифікації кінцевих точок, яку загальна політика запитів
має знати до завантаження runtime provider. Ядро, як і раніше, визначає значення кожного
`endpointClass`; маніфести plugin визначають метадані хостів і base URL.

Поля кінцевої точки:

| Поле                           | Тип        | Що воно означає                                                                                |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Відомий ядру клас кінцевої точки, наприклад `openrouter`, `moonshot-native` або `google-vertex`. |
| `hosts`                        | `string[]` | Точні імена хостів, які зіставляються з класом кінцевої точки.                                |
| `hostSuffixes`                 | `string[]` | Суфікси хостів, які зіставляються з класом кінцевої точки. Додавайте префікс `.` для зіставлення лише суфікса домену. |
| `baseUrls`                     | `string[]` | Точні нормалізовані HTTP(S) base URL, які зіставляються з класом кінцевої точки.              |
| `googleVertexRegion`           | `string`   | Статичний регіон Google Vertex для точних глобальних хостів.                                  |
| `googleVertexRegionHostSuffix` | `string`   | Суфікс, який слід видалити зі збіжних хостів, щоб отримати префікс регіону Google Vertex.     |

## Довідник `providerRequest`

Використовуйте `providerRequest` для легких метаданих сумісності запитів, які загальна
політика запитів потребує без завантаження runtime provider. Переписування payload, специфічне
для поведінки, залишайте в runtime hooks provider або спільних допоміжних засобах сімейства provider.

```json
{
  "providers": ["vllm"],
  "providerRequest": {
    "providers": {
      "vllm": {
        "family": "vllm",
        "openAICompletions": {
          "supportsStreamingUsage": true
        }
      }
    }
  }
}
```

Поля provider:

| Поле                  | Тип          | Що воно означає                                                                       |
| --------------------- | ------------ | ------------------------------------------------------------------------------------- |
| `family`              | `string`     | Мітка сімейства provider, що використовується загальними рішеннями й діагностикою сумісності запитів. |
| `compatibilityFamily` | `"moonshot"` | Необов’язковий bucket сумісності сімейства provider для спільних допоміжних засобів запитів. |
| `openAICompletions`   | `object`     | Прапорці запитів completions, сумісних з OpenAI; наразі це `supportsStreamingUsage`.  |

## Довідник `modelPricing`

Використовуйте `modelPricing`, коли provider потребує поведінки ціноутворення control-plane до
завантаження runtime. Кеш ціноутворення Gateway зчитує ці метадані без імпорту
коду runtime provider.

```json
{
  "providers": ["ollama", "openrouter"],
  "modelPricing": {
    "providers": {
      "ollama": {
        "external": false
      },
      "openrouter": {
        "openRouter": {
          "passthroughProviderModel": true
        },
        "liteLLM": false
      }
    }
  }
}
```

Поля provider:

| Поле         | Тип               | Що воно означає                                                                                     |
| ------------ | ----------------- | --------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Установіть `false` для локальних/self-hosted provider, які ніколи не повинні отримувати ціни з OpenRouter або LiteLLM. |
| `openRouter` | `false \| object` | Мапування пошуку цін OpenRouter. `false` вимикає пошук OpenRouter для цього provider.              |
| `liteLLM`    | `false \| object` | Мапування пошуку цін LiteLLM. `false` вимикає пошук LiteLLM для цього provider.                    |

Поля джерела:

| Поле                       | Тип                | Що воно означає                                                                                                           |
| -------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Ідентифікатор provider зовнішнього каталогу, коли він відрізняється від ідентифікатора provider OpenClaw, наприклад `z-ai` для provider `zai`. |
| `passthroughProviderModel` | `boolean`          | Розглядати ідентифікатори моделей, що містять слеш, як вкладені посилання provider/model; корисно для proxy provider, таких як OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Додаткові варіанти ідентифікаторів моделей для зовнішнього каталогу. `version-dots` пробує крапкові ідентифікатори версій, як-от `claude-opus-4.6`. |

### Індекс Provider OpenClaw

Індекс Provider OpenClaw — це preview-метадані, що належать OpenClaw, для provider,
plugin яких можуть бути ще не встановлені. Він не є частиною маніфесту plugin.
Маніфести plugin залишаються авторитетним джерелом для встановлених plugin. Індекс Provider —
це внутрішній fallback-контракт, який використовуватимуть майбутні поверхні
installable-provider і вибору моделей до встановлення, коли plugin provider ще не встановлено.

Порядок авторитетності каталогу:

1. Конфігурація користувача.
2. `modelCatalog` маніфесту встановленого plugin.
3. Кеш каталогу моделей після явного оновлення.
4. preview-рядки Індексу Provider OpenClaw.

Індекс Provider не повинен містити секретів, стану ввімкнення, runtime hooks або
живих специфічних для облікового запису даних моделей. Його preview-каталоги використовують ту саму
форму рядка provider `modelCatalog`, що й маніфести plugin, але мають залишатися обмеженими
стабільними метаданими відображення, якщо тільки поля runtime-адаптера, як-от `api`,
`baseUrl`, ціноутворення або прапорці сумісності, не підтримуються навмисно в узгодженому стані
з маніфестом встановленого plugin. Provider із живим виявленням `/models` повинні
записувати оновлені рядки через явний шлях кешу model catalog, а не змушувати
звичайний перелік чи онбординг викликати API provider.

Записи Індексу Provider також можуть містити метадані installable-plugin для provider,
plugin яких було винесено з ядра або які ще не встановлено з інших причин. Ці
метадані наслідують шаблон каталогу channel: назви пакета, специфікації встановлення npm,
очікувана цілісність і легкі підписи варіантів автентифікації достатні, щоб показати
варіант налаштування встановлюваного plugin. Щойно plugin встановлено, його маніфест має перевагу, і
запис Індексу Provider для цього provider ігнорується.

Застарілі ключі можливостей верхнього рівня є deprecated. Використовуйте `openclaw doctor --fix`, щоб
перемістити `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` і `webSearchProviders` під `contracts`; звичайне
завантаження маніфесту більше не трактує ці поля верхнього рівня як
належність можливостей.

## Маніфест і `package.json`

Ці два файли виконують різні завдання:

| Файл                   | Використовуйте для                                                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Виявлення, перевірка конфігурації, метадані варіантів автентифікації та підказки UI, які мають існувати до запуску коду plugin |
| `package.json`         | Метадані npm, встановлення залежностей і блок `openclaw`, який використовується для точок входу, обмеження встановлення, setup або метаданих каталогу |

Якщо ви не впевнені, де має бути певний елемент метаданих, користуйтеся таким правилом:

- якщо OpenClaw повинен знати це до завантаження коду plugin, розміщуйте це в `openclaw.plugin.json`
- якщо це стосується пакування, файлів точок входу або поведінки встановлення npm, розміщуйте це в `package.json`

### Поля `package.json`, які впливають на виявлення

Деякі метадані plugin до запуску runtime навмисно зберігаються в `package.json` у блоці
`openclaw`, а не в `openclaw.plugin.json`.

Важливі приклади:

| Поле                                                              | Що воно означає                                                                                                                                                                      |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | Оголошує точки входу власного Plugin. Має залишатися в межах каталогу пакета plugin.                                                                                                |
| `openclaw.runtimeExtensions`                                      | Оголошує точки входу built JavaScript runtime для встановлених пакетів. Має залишатися в межах каталогу пакета plugin.                                                             |
| `openclaw.setupEntry`                                             | Полегшена точка входу лише для setup, що використовується під час онбордингу, відкладеного запуску channel і виявлення status/SecretRef channel лише для читання. Має залишатися в межах каталогу пакета plugin. |
| `openclaw.runtimeSetupEntry`                                      | Оголошує built JavaScript точку входу setup для встановлених пакетів. Має залишатися в межах каталогу пакета plugin.                                                               |
| `openclaw.channel`                                                | Легкі метадані каталогу channel, такі як підписи, шляхи до документації, псевдоніми й текст для вибору.                                                                            |
| `openclaw.channel.commands`                                       | Статичні метадані авто-типових значень native command і native Skill, які використовуються поверхнями config, audit і списку команд до завантаження runtime channel.               |
| `openclaw.channel.configuredState`                                | Полегшені метадані перевірки configured-state, які можуть відповісти на запитання «чи вже існує налаштування лише через env?» без завантаження повного runtime channel.            |
| `openclaw.channel.persistedAuthState`                             | Полегшені метадані перевірки persisted-auth, які можуть відповісти на запитання «чи вже десь виконано вхід?» без завантаження повного runtime channel.                              |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Підказки для встановлення/оновлення пакетних і зовнішньо опублікованих plugin.                                                                                                      |
| `openclaw.install.defaultChoice`                                  | Бажаний шлях встановлення, коли доступно кілька джерел встановлення.                                                                                                                |
| `openclaw.install.minHostVersion`                                 | Мінімальна підтримувана версія хоста OpenClaw із semver-нижньою межею на кшталт `>=2026.3.22`.                                                                                     |
| `openclaw.install.expectedIntegrity`                              | Очікуваний рядок цілісності npm dist, наприклад `sha512-...`; потоки встановлення та оновлення звіряють із ним отриманий артефакт.                                                |
| `openclaw.install.allowInvalidConfigRecovery`                     | Дозволяє вузький шлях відновлення перевстановлення пакетного plugin, коли конфігурація недійсна.                                                                                   |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Дозволяє поверхням channel лише для setup завантажуватися до повного channel plugin під час запуску.                                                                               |

Метадані маніфесту визначають, які варіанти provider/channel/setup з’являються в
онбордингу до завантаження runtime. `package.json#openclaw.install` повідомляє
онбордингу, як отримати або ввімкнути цей plugin, коли користувач вибирає один із цих
варіантів. Не переносіть підказки для встановлення в `openclaw.plugin.json`.

`openclaw.install.minHostVersion` застосовується під час встановлення та
завантаження реєстру маніфестів. Недійсні значення відхиляються; новіші, але коректні значення
пропускають plugin на старіших хостах.

Точне закріплення версії npm уже зберігається в `npmSpec`, наприклад
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Офіційні записи зовнішнього каталогу
повинні поєднувати точні специфікації з `expectedIntegrity`, щоб потоки оновлення
закривалися безпечно, якщо отриманий артефакт npm більше не відповідає закріпленому релізу.
Інтерактивний онбординг і далі пропонує довірені npm-специфікації реєстру, зокрема прості
назви пакетів і dist-tag, для сумісності. Діагностика каталогу може
розрізняти точні, плаваючі, закріплені цілісністю, без цілісності, із невідповідністю назви пакета
та недійсні джерела default-choice. Вона також попереджає, коли
`expectedIntegrity` присутній, але немає коректного джерела npm, яке можна ним закріпити.
Коли `expectedIntegrity` присутній,
потоки встановлення/оновлення застосовують його; коли його пропущено, розв’язання реєстру
записується без закріплення цілісності.

Channel plugin повинні надавати `openclaw.setupEntry`, коли для status, списку channel
або сканування SecretRef потрібно визначати налаштовані облікові записи без завантаження повного
runtime. Точка входу setup має надавати метадані channel разом із безпечною для setup config,
status і адаптерами secrets; мережеві клієнти, Gateway listener і transport runtime
залишайте в основній точці входу extension.

Поля точки входу runtime не перевизначають перевірки меж пакета для полів
точок входу вихідного коду. Наприклад, `openclaw.runtimeExtensions` не може зробити
завантажуваним шлях `openclaw.extensions`, що виходить за межі пакета.

`openclaw.install.allowInvalidConfigRecovery` навмисно вузький. Він
не робить довільні зламані конфігурації придатними до встановлення. Наразі він лише дозволяє потокам встановлення
відновлюватися після конкретних збоїв оновлення застарілого пакетного plugin, наприклад
відсутнього шляху пакетного plugin або застарілого запису `channels.<id>` для цього самого
пакетного plugin. Не пов’язані помилки конфігурації все одно блокують встановлення і спрямовують операторів
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

Використовуйте це, коли потокам setup, doctor, status або лише для читання присутності потрібна легка
перевірка автентифікації типу так/ні до завантаження повного channel plugin. Persisted auth state —
це не configured channel state: не використовуйте ці метадані для автоувімкнення plugin,
відновлення runtime-залежностей або вирішення, чи слід завантажувати runtime channel.
Цільовий export має бути невеликою функцією, що читає лише persisted state; не
спрямовуйте його через повний barrel runtime channel.

`openclaw.channel.configuredState` має ту саму форму для легких
перевірок configured state лише через env:

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

Використовуйте це, коли channel може визначити configured state через env або інші
невеликі нерuntime-входи. Якщо перевірка потребує повного розв’язання config або справжнього
runtime channel, залишайте цю логіку в hook plugin `config.hasConfiguredState`.

## Пріоритет виявлення (дубльовані ідентифікатори plugin)

OpenClaw виявляє plugin з кількох коренів (пакетні, глобальне встановлення, workspace, явно вибрані в конфігурації шляхи). Якщо два виявлення мають однаковий `id`, зберігається лише маніфест із **найвищим пріоритетом**; дублікати з нижчим пріоритетом відкидаються, а не завантажуються поруч.

Пріоритет від найвищого до найнижчого:

1. **Вибрані конфігурацією** — шлях, явно закріплений у `plugins.entries.<id>`
2. **Пакетні** — plugin, що постачаються з OpenClaw
3. **Глобальне встановлення** — plugin, установлені в глобальний корінь plugin OpenClaw
4. **Workspace** — plugin, виявлені відносно поточного workspace

Наслідки:

- Форк або застаріла копія пакетного plugin у workspace не затьмарить пакетну збірку.
- Щоб справді перевизначити пакетний plugin локальним, закріпіть його через `plugins.entries.<id>`, щоб він переміг за пріоритетом, а не покладайтесь на виявлення у workspace.
- Відкидання дублікатів журналюється, щоб Doctor і діагностика запуску могли вказати на відкинуту копію.

## Вимоги до схеми JSON

- **Кожен plugin повинен постачатися зі схемою JSON**, навіть якщо він не приймає конфігурацію.
- Порожня схема припустима (наприклад, `{ "type": "object", "additionalProperties": false }`).
- Схеми перевіряються під час читання/запису конфігурації, а не під час runtime.

## Поведінка перевірки

- Невідомі ключі `channels.*` є **помилками**, якщо тільки ідентифікатор channel не оголошений
  маніфестом plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` і `plugins.slots.*`
  повинні посилатися на **виявлювані** ідентифікатори plugin. Невідомі ідентифікатори є **помилками**.
- Якщо plugin встановлено, але він має зламаний або відсутній маніфест чи схему,
  перевірка завершується помилкою, а Doctor повідомляє про помилку plugin.
- Якщо конфігурація plugin існує, але plugin **вимкнений**, конфігурація зберігається, і
  в Doctor + журналах відображається **попередження**.

Повну схему `plugins.*` див. у [Довіднику з конфігурації](/uk/gateway/configuration).

## Примітки

- Маніфест **обов’язковий для власних Plugin OpenClaw**, включно із завантаженням з локальної файлової системи. Runtime, як і раніше, завантажує модуль plugin окремо; маніфест потрібен лише для виявлення + перевірки.
- Власні маніфести розбираються за допомогою JSON5, тому коментарі, кінцеві коми та ключі без лапок приймаються, якщо фінальне значення все ще є об’єктом.
- Завантажувач маніфесту читає лише задокументовані поля маніфесту. Уникайте користувацьких ключів верхнього рівня.
- `channels`, `providers`, `cliBackends` і `skills` можна не вказувати, коли plugin їх не потребує.
- `providerDiscoveryEntry` має залишатися легким і не повинен імпортувати широкий runtime-код; використовуйте його для статичних метаданих каталогу provider або вузьких дескрипторів виявлення, а не для виконання під час запиту.
- Ексклюзивні типи plugin вибираються через `plugins.slots.*`: `kind: "memory"` через `plugins.slots.memory`, `kind: "context-engine"` через `plugins.slots.contextEngine` (типове значення `legacy`).
- Метадані env var (`setup.providers[].envVars`, застарілий `providerAuthEnvVars` і `channelEnvVars`) є лише декларативними. Status, audit, перевірка доставки Cron та інші поверхні лише для читання все одно застосовують політику довіри до plugin і ефективної активації, перш ніж вважати env var налаштованою.
- Метадані runtime wizard, які потребують коду provider, див. у [Runtime hooks provider](/uk/plugins/architecture-internals#provider-runtime-hooks).
- Якщо ваш plugin залежить від native module, задокументуйте кроки збірки й будь-які вимоги до allowlist менеджера пакетів (наприклад, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Пов’язане

<CardGroup cols={3}>
  <Card title="Створення plugin" href="/uk/plugins/building-plugins" icon="rocket">
    Початок роботи з plugin.
  </Card>
  <Card title="Архітектура plugin" href="/uk/plugins/architecture" icon="diagram-project">
    Внутрішня архітектура й модель можливостей.
  </Card>
  <Card title="Огляд SDK" href="/uk/plugins/sdk-overview" icon="book">
    Довідник SDK plugin та імпорти підшляхів.
  </Card>
</CardGroup>
