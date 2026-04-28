---
read_when:
    - Ви створюєте Plugin для OpenClaw
    - Вам потрібно випустити схему конфігурації Plugin або налагодити помилки валідації Plugin
summary: Маніфест Plugin + вимоги до JSON-схеми (сувора валідація конфігурації)
title: Маніфест Plugin
x-i18n:
    generated_at: "2026-04-28T11:19:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 87c8769dac98b6e67338788492819e7b4d93cd1fa04dbc5629590f57ad5a06c7
    source_path: plugins/manifest.md
    workflow: 16
---

Ця сторінка призначена лише для **нативного маніфесту Plugin OpenClaw**.

Для сумісних макетів пакетів див. [Пакети Plugin](/uk/plugins/bundles).

Сумісні формати пакетів використовують інші файли маніфестів:

- Пакет Codex: `.codex-plugin/plugin.json`
- Пакет Claude: `.claude-plugin/plugin.json` або стандартний макет компонента Claude
  без маніфесту
- Пакет Cursor: `.cursor-plugin/plugin.json`

OpenClaw також автоматично виявляє ці макети пакетів, але вони не перевіряються
за схемою `openclaw.plugin.json`, описаною тут.

Для сумісних пакетів OpenClaw наразі читає метадані пакета, а також оголошені
корені skill, корені команд Claude, стандартні значення `settings.json` пакета Claude,
стандартні значення LSP пакета Claude та підтримувані набори hook, коли макет відповідає
очікуванням runtime OpenClaw.

Кожен нативний Plugin OpenClaw **повинен** постачати файл `openclaw.plugin.json` у
**корені Plugin**. OpenClaw використовує цей маніфест для перевірки конфігурації
**без виконання коду Plugin**. Відсутні або недійсні маніфести вважаються
помилками Plugin і блокують перевірку конфігурації.

Див. повний посібник із системи Plugin: [Plugins](/uk/tools/plugin).
Для нативної моделі можливостей і поточних рекомендацій щодо зовнішньої сумісності:
[Модель можливостей](/uk/plugins/architecture#public-capability-model).

## Що робить цей файл

`openclaw.plugin.json` — це метадані, які OpenClaw читає **перед завантаженням вашого
коду Plugin**. Усе нижче має бути достатньо легким для перевірки без запуску
runtime Plugin.

**Використовуйте його для:**

- ідентичності Plugin, перевірки конфігурації та підказок UI конфігурації
- метаданих автентифікації, onboarding і налаштування (alias, auto-enable, змінні середовища провайдера, варіанти автентифікації)
- підказок активації для поверхонь control-plane
- скороченого володіння сімейством моделей
- статичних знімків володіння можливостями (`contracts`)
- метаданих QA runner, які може перевіряти спільний хост `openclaw qa`
- метаданих конфігурації для конкретних каналів, об’єднаних у каталог і поверхні перевірки

**Не використовуйте його для:** реєстрації поведінки runtime, оголошення entrypoint коду
або метаданих встановлення npm. Для цього призначені ваш код Plugin і `package.json`.

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

| Поле                                 | Обов'язкове | Тип                              | Що означає                                                                                                                                                                                                                                     |
| ------------------------------------ | ----------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Так         | `string`                         | Канонічний id Plugin. Це id, який використовується в `plugins.entries.<id>`.                                                                                                                                                                   |
| `configSchema`                       | Так         | `object`                         | Вбудована JSON Schema для конфігурації цього Plugin.                                                                                                                                                                                           |
| `enabledByDefault`                   | Ні          | `true`                           | Позначає вбудований Plugin як увімкнений за замовчуванням. Опустіть це поле або задайте будь-яке значення, відмінне від `true`, щоб залишити Plugin вимкненим за замовчуванням.                                                               |
| `legacyPluginIds`                    | Ні          | `string[]`                       | Застарілі id, які нормалізуються до цього канонічного id Plugin.                                                                                                                                                                               |
| `autoEnableWhenConfiguredProviders`  | Ні          | `string[]`                       | Id провайдерів, які мають автоматично вмикати цей Plugin, коли auth, config або посилання на моделі згадують їх.                                                                                                                              |
| `kind`                               | Ні          | `"memory"` \| `"context-engine"` | Оголошує ексклюзивний тип Plugin, який використовується `plugins.slots.*`.                                                                                                                                                                     |
| `channels`                           | Ні          | `string[]`                       | Id каналів, якими володіє цей Plugin. Використовується для виявлення та перевірки конфігурації.                                                                                                                                               |
| `providers`                          | Ні          | `string[]`                       | Id провайдерів, якими володіє цей Plugin.                                                                                                                                                                                                      |
| `providerDiscoveryEntry`             | Ні          | `string`                         | Шлях до легковагового модуля виявлення провайдерів, відносно кореня Plugin, для обмежених маніфестом метаданих каталогу провайдерів, які можна завантажити без активації повного середовища виконання Plugin.                                |
| `modelSupport`                       | Ні          | `object`                         | Належні маніфесту скорочені метадані сімейств моделей, які використовуються для автоматичного завантаження Plugin перед виконанням.                                                                                                            |
| `modelCatalog`                       | Ні          | `object`                         | Декларативні метадані каталогу моделей для провайдерів, якими володіє цей Plugin. Це контракт площини керування для майбутнього списку лише для читання, онбордингу, вибору моделей, псевдонімів і пригнічення без завантаження виконання Plugin. |
| `modelPricing`                       | Ні          | `object`                         | Належна провайдеру політика пошуку зовнішніх цін. Використовуйте її, щоб виключати локальні/самостійно розміщені провайдери з віддалених каталогів цін або зіставляти посилання провайдерів з id каталогів OpenRouter/LiteLLM без жорстко закодованих id провайдерів у ядрі. |
| `modelIdNormalization`               | Ні          | `object`                         | Належне провайдеру очищення псевдонімів/префіксів id моделей, яке має виконуватися до завантаження виконання провайдера.                                                                                                                      |
| `providerEndpoints`                  | Ні          | `object[]`                       | Належні маніфесту метадані хоста/baseUrl кінцевої точки для маршрутів провайдера, які ядро має класифікувати до завантаження виконання провайдера.                                                                                            |
| `providerRequest`                    | Ні          | `object`                         | Дешеві метадані сімейства провайдера та сумісності запитів, які використовуються загальною політикою запитів до завантаження виконання провайдера.                                                                                            |
| `cliBackends`                        | Ні          | `string[]`                       | Id бекендів виведення CLI, якими володіє цей Plugin. Використовується для автоматичної активації під час запуску з явних посилань у конфігурації.                                                                                            |
| `syntheticAuthRefs`                  | Ні          | `string[]`                       | Посилання на провайдери або CLI-бекенди, чий належний Plugin синтетичний auth-хук має перевірятися під час холодного виявлення моделей до завантаження виконання.                                                                             |
| `nonSecretAuthMarkers`               | Ні          | `string[]`                       | Належні вбудованому Plugin значення-заповнювачі API key, які представляють несекретний локальний, OAuth або навколишній стан облікових даних.                                                                                                |
| `commandAliases`                     | Ні          | `object[]`                       | Назви команд, якими володіє цей Plugin і які мають створювати діагностику конфігурації та CLI з урахуванням Plugin до завантаження виконання.                                                                                                |
| `providerAuthEnvVars`                | Ні          | `Record<string, string[]>`       | Застарілі сумісні env-метадані для пошуку auth/status провайдера. Для нових Plugin надавайте перевагу `setup.providers[].envVars`; OpenClaw усе ще читає це під час періоду виведення з ужитку.                                               |
| `providerAuthAliases`                | Ні          | `Record<string, string>`         | Id провайдерів, які мають повторно використовувати інший id провайдера для auth-пошуку, наприклад провайдер для кодування, який спільно використовує базовий API key провайдера та auth-профілі.                                             |
| `channelEnvVars`                     | Ні          | `Record<string, string[]>`       | Дешеві env-метадані каналу, які OpenClaw може перевіряти без завантаження коду Plugin. Використовуйте це для керованого env налаштування каналу або auth-поверхонь, які мають бачити загальні помічники запуску/конфігурації.                 |
| `providerAuthChoices`                | Ні          | `object[]`                       | Дешеві метадані варіантів auth для онбордингових вибирачів, визначення бажаного провайдера та простого зв'язування прапорів CLI.                                                                                                             |
| `activation`                         | Ні          | `object`                         | Дешеві метадані планувальника активації для запуску, провайдера, команди, каналу, маршруту та завантаження, спричиненого можливостями. Лише метадані; виконання Plugin усе ще володіє фактичною поведінкою.                                  |
| `setup`                              | Ні          | `object`                         | Дешеві дескриптори налаштування/онбордингу, які поверхні виявлення та налаштування можуть перевіряти без завантаження виконання Plugin.                                                                                                      |
| `qaRunners`                          | Ні          | `object[]`                       | Дешеві дескриптори QA-запускачів, які використовуються спільним хостом `openclaw qa` до завантаження виконання Plugin.                                                                                                                       |
| `contracts`                          | Ні          | `object`                         | Статичний знімок вбудованих можливостей для зовнішніх auth-хуків, мовлення, транскрипції в реальному часі, голосу в реальному часі, розуміння медіа, генерації зображень, генерації музики, генерації відео, web-fetch, web search і володіння інструментами. |
| `mediaUnderstandingProviderMetadata` | Ні          | `Record<string, object>`         | Дешеві значення за замовчуванням для розуміння медіа для id провайдерів, оголошених у `contracts.mediaUnderstandingProviders`.                                                                                                                |
| `channelConfigs`                     | Ні          | `Record<string, object>`         | Належні маніфесту метадані конфігурації каналу, об'єднані з поверхнями виявлення та перевірки до завантаження виконання.                                                                                                                     |
| `skills`                             | Ні          | `string[]`                       | Каталоги Skills для завантаження, відносно кореня Plugin.                                                                                                                                                                                      |
| `name`                               | Ні          | `string`                         | Зручна для читання назва Plugin.                                                                                                                                                                                                               |
| `description`                        | Ні          | `string`                         | Короткий підсумок, показаний у поверхнях Plugin.                                                                                                                                                                                               |
| `version`                            | Ні          | `string`                         | Інформаційна версія Plugin.                                                                                                                                                                                                                    |
| `uiHints`                            | Ні          | `Record<string, object>`         | UI-мітки, заповнювачі та підказки щодо чутливості для полів конфігурації.                                                                                                                                                                     |

## Довідник `providerAuthChoices`

Кожен запис `providerAuthChoices` описує один варіант онбордингу або auth.
OpenClaw читає це до завантаження виконання провайдера.
Списки налаштування провайдера використовують ці варіанти з маніфесту, варіанти
налаштування, отримані з дескриптора, і метадані каталогу встановлення без
завантаження виконання провайдера.

| Поле                  | Обов’язкове | Тип                                             | Що це означає                                                                                                                                    |
| --------------------- | ----------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `provider`            | Так         | `string`                                        | Ідентифікатор Provider, якому належить цей вибір.                                                                                                |
| `method`              | Так         | `string`                                        | Ідентифікатор методу автентифікації, до якого потрібно спрямувати обробку.                                                                       |
| `choiceId`            | Так         | `string`                                        | Стабільний ідентифікатор вибору автентифікації, який використовується в потоках onboarding і CLI.                                                |
| `choiceLabel`         | Ні          | `string`                                        | Мітка для користувача. Якщо її не вказано, OpenClaw використовує `choiceId` як запасний варіант.                                                 |
| `choiceHint`          | Ні          | `string`                                        | Короткий допоміжний текст для засобу вибору.                                                                                                      |
| `assistantPriority`   | Ні          | `number`                                        | Нижчі значення сортуються раніше в інтерактивних засобах вибору, керованих асистентом.                                                           |
| `assistantVisibility` | Ні          | `"visible"` \| `"manual-only"`                  | Приховує вибір із засобів вибору асистента, водночас дозволяючи ручний вибір через CLI.                                                          |
| `deprecatedChoiceIds` | Ні          | `string[]`                                      | Застарілі ідентифікатори вибору, які мають перенаправляти користувачів до цього вибору-замінника.                                                |
| `groupId`             | Ні          | `string`                                        | Необов’язковий ідентифікатор групи для групування пов’язаних виборів.                                                                            |
| `groupLabel`          | Ні          | `string`                                        | Мітка для користувача для цієї групи.                                                                                                             |
| `groupHint`           | Ні          | `string`                                        | Короткий допоміжний текст для групи.                                                                                                              |
| `optionKey`           | Ні          | `string`                                        | Внутрішній ключ параметра для простих потоків автентифікації з одним прапорцем.                                                                   |
| `cliFlag`             | Ні          | `string`                                        | Назва прапорця CLI, наприклад `--openrouter-api-key`.                                                                                             |
| `cliOption`           | Ні          | `string`                                        | Повна форма параметра CLI, наприклад `--openrouter-api-key <key>`.                                                                                |
| `cliDescription`      | Ні          | `string`                                        | Опис, який використовується в довідці CLI.                                                                                                        |
| `onboardingScopes`    | Ні          | `Array<"text-inference" \| "image-generation">` | На яких поверхнях onboarding має з’являтися цей вибір. Якщо не вказано, типовим значенням є `["text-inference"]`. |

## Довідник `commandAliases`

Використовуйте `commandAliases`, коли Plugin володіє назвою runtime-команди, яку користувачі можуть
помилково додати до `plugins.allow` або спробувати запустити як кореневу команду CLI. OpenClaw
використовує ці метадані для діагностики без імпорту runtime-коду Plugin.

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

| Поле        | Обов’язкове | Тип               | Що це означає                                                                 |
| ------------ | ----------- | ----------------- | ----------------------------------------------------------------------------- |
| `name`       | Так         | `string`          | Назва команди, яка належить цьому Plugin.                                     |
| `kind`       | Ні          | `"runtime-slash"` | Позначає alias як slash-команду чату, а не як кореневу команду CLI.           |
| `cliCommand` | Ні          | `string`          | Пов’язана коренева команда CLI, яку слід запропонувати для операцій CLI, якщо вона існує. |

## Довідник `activation`

Використовуйте `activation`, коли Plugin може дешево оголосити, які події control plane
мають включати його до плану активації/завантаження.

Цей блок є метаданими планувальника, а не lifecycle API. Він не реєструє
runtime-поведінку, не замінює `register(...)` і не обіцяє, що
код Plugin уже виконано. Планувальник активації використовує ці поля, щоб
звузити кандидатні Plugin перед поверненням до наявних метаданих власності маніфесту,
таких як `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` і hooks.

Віддавайте перевагу найвужчим метаданим, які вже описують власність. Використовуйте
`providers`, `channels`, `commandAliases`, дескриптори setup або `contracts`,
коли ці поля виражають зв’язок. Використовуйте `activation` для додаткових підказок
планувальнику, які неможливо представити цими полями власності.
Використовуйте верхньорівневий `cliBackends` для runtime-alias CLI, таких як `claude-cli`,
`codex-cli` або `google-gemini-cli`; `activation.onAgentHarnesses` призначено лише для
вбудованих ідентифікаторів agent harness, які ще не мають поля власності.

Цей блок містить лише метадані. Він не реєструє runtime-поведінку і не
замінює `register(...)`, `setupEntry` чи інші runtime/plugin entrypoints.
Поточні споживачі використовують його як підказку для звуження перед ширшим завантаженням Plugin, тому
відсутність метаданих activation зазвичай коштує лише продуктивності; вона не повинна
змінювати коректність, доки ще існують застарілі запасні механізми власності маніфесту.

Кожен Plugin має навмисно задавати `activation.onStartup`, оскільки OpenClaw відходить
від неявних startup-імпортів. Установлюйте його в `true` лише тоді, коли Plugin мусить
запускатися під час старту Gateway. Установлюйте його в `false`, коли Plugin інертний під час
старту й має завантажуватися лише через вужчі тригери. Пропуск `onStartup` зберігає
застарілий запасний sidecar-режим неявного startup для Plugin без
статичних метаданих capability; майбутні версії можуть припинити завантажувати такі Plugin під час startup,
якщо вони не оголосять `activation.onStartup: true`. Звіти про статус і
сумісність Plugin попереджають `legacy-implicit-startup-sidecar`, коли Plugin
досі покладається на цей запасний механізм.

Для тестування міграції встановіть
`OPENCLAW_DISABLE_LEGACY_IMPLICIT_STARTUP_SIDECARS=1`, щоб вимкнути лише цей
застарілий запасний механізм. Цей opt-in режим не блокує явні
Plugin з `activation.onStartup: true` або Plugin, завантажені через channel, config,
agent-harness, memory чи інші вужчі тригери активації.

```json
{
  "activation": {
    "onStartup": false,
    "onProviders": ["openai"],
    "onCommands": ["models"],
    "onChannels": ["web"],
    "onRoutes": ["gateway-webhook"],
    "onConfigPaths": ["browser"],
    "onCapabilities": ["provider", "tool"]
  }
}
```

| Поле              | Обов’язкове | Тип                                                  | Що це означає                                                                                                                                                                                                              |
| ------------------ | ----------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | Ні          | `boolean`                                            | Явна активація під час запуску Gateway. Кожен Plugin має встановлювати це поле. `true` імпортує Plugin під час startup; `false` відмовляється від застарілого неявного запасного запуску sidecar, якщо інший збіглий тригер не вимагає завантаження. |
| `onProviders`      | Ні          | `string[]`                                           | Ідентифікатори Provider, які мають включати цей Plugin у плани активації/завантаження.                                                                                                                                    |
| `onAgentHarnesses` | Ні          | `string[]`                                           | Runtime-ідентифікатори вбудованих agent harness, які мають включати цей Plugin у плани активації/завантаження. Використовуйте верхньорівневий `cliBackends` для alias CLI backend.                                         |
| `onCommands`       | Ні          | `string[]`                                           | Ідентифікатори команд, які мають включати цей Plugin у плани активації/завантаження.                                                                                                                                      |
| `onChannels`       | Ні          | `string[]`                                           | Ідентифікатори Channel, які мають включати цей Plugin у плани активації/завантаження.                                                                                                                                     |
| `onRoutes`         | Ні          | `string[]`                                           | Види маршрутів, які мають включати цей Plugin у плани активації/завантаження.                                                                                                                                             |
| `onConfigPaths`    | Ні          | `string[]`                                           | Шляхи config відносно кореня, які мають включати цей Plugin у плани startup/завантаження, коли шлях наявний і не вимкнений явно.                                                                                           |
| `onCapabilities`   | Ні          | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Широкі підказки capability, які використовує планування активації control plane. За можливості віддавайте перевагу вужчим полям.                                                                                           |

Поточні live-споживачі:

- Планування startup Gateway використовує `activation.onStartup` для явного startup
  import і відмови від застарілого неявного запасного startup sidecar
- Планування CLI, запущене командою, повертається до застарілих
  `commandAliases[].cliCommand` або `commandAliases[].name`
- Планування startup agent-runtime використовує `activation.onAgentHarnesses` для
  вбудованих harness і верхньорівневий `cliBackends[]` для runtime-alias CLI
- Планування setup/channel, запущене channel, повертається до застарілої власності `channels[]`,
  коли явних метаданих channel activation бракує
- Планування startup Plugin використовує `activation.onConfigPaths` для не-channel кореневих
  config-поверхонь, таких як блок `browser` вбудованого browser Plugin
- Планування setup/runtime, запущене provider, повертається до застарілої власності
  `providers[]` і верхньорівневого `cliBackends[]`, коли явних метаданих provider
  activation бракує

Діагностика планувальника може відрізняти явні підказки activation від запасного механізму
власності маніфесту. Наприклад, `activation-command-hint` означає, що
збіглося `activation.onCommands`, тоді як `manifest-command-alias` означає, що
планувальник натомість використав власність `commandAliases`. Ці reason labels призначені для
діагностики host і тестів; автори Plugin мають і далі оголошувати метадані,
які найкраще описують власність.

## Довідник `qaRunners`

Використовуйте `qaRunners`, коли Plugin додає один або кілька transport runners під
спільним коренем `openclaw qa`. Тримайте ці метадані дешевими й статичними; runtime Plugin
досі володіє фактичною реєстрацією CLI через легку поверхню
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

| Поле         | Обов’язково | Тип      | Що це означає                                                      |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | Так      | `string` | Підкоманда, змонтована під `openclaw qa`, наприклад `matrix`.    |
| `description` | Ні       | `string` | Резервний довідковий текст, який використовується, коли спільному хосту потрібна команда-заглушка. |

## Довідник setup

Використовуйте `setup`, коли поверхням налаштування й онбордингу потрібні дешеві метадані, що належать Plugin,
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

Верхньорівневий `cliBackends` залишається чинним і далі описує backend-и CLI-виведення.
`setup.cliBackends` є специфічною для налаштування поверхнею дескрипторів для
потоків control-plane/setup, які мають залишатися лише метаданими.

За наявності `setup.providers` і `setup.cliBackends` є пріоритетною
поверхнею пошуку за принципом descriptor-first для виявлення налаштування. Якщо дескриптор лише
звужує кандидатний Plugin, а налаштуванню все ще потрібні багатші runtime-хуки під час налаштування,
задайте `requiresRuntime: true` і залиште `setup-api` як
резервний шлях виконання.

OpenClaw також включає `setup.providers[].envVars` у загальні пошуки автентифікації провайдера та
env-var. `providerAuthEnvVars` і далі підтримується через адаптер сумісності
протягом вікна застарівання, але небандловані plugins, які досі його використовують,
отримують діагностику маніфесту. Нові plugins мають розміщувати env-метадані налаштування/статусу
в `setup.providers[].envVars`.

OpenClaw також може виводити прості варіанти налаштування з `setup.providers[].authMethods`,
коли запис налаштування недоступний або коли `setup.requiresRuntime: false`
оголошує runtime налаштування непотрібним. Явні записи `providerAuthChoices` залишаються
пріоритетними для власних міток, CLI-прапорців, області онбордингу та метаданих асистента.

Задавайте `requiresRuntime: false` лише тоді, коли цих дескрипторів достатньо для
поверхні налаштування. OpenClaw трактує явне `false` як контракт лише на дескрипторах
і не виконуватиме `setup-api` або `openclaw.setupEntry` для пошуку налаштування. Якщо
Plugin лише на дескрипторах усе ще постачає один із цих runtime-записів налаштування,
OpenClaw повідомляє адитивну діагностику й далі ігнорує його. Пропущений
`requiresRuntime` зберігає застарілу резервну поведінку, щоб наявні plugins, які додали
дескриптори без цього прапорця, не зламалися.

Оскільки пошук налаштування може виконувати код `setup-api`, що належить Plugin, нормалізовані
значення `setup.providers[].id` і `setup.cliBackends[]` мають залишатися унікальними серед
виявлених plugins. Неоднозначна належність завершується закрито, замість вибору
переможця за порядком виявлення.

Коли runtime налаштування все ж виконується, діагностика реєстру налаштування повідомляє про розбіжність дескрипторів,
якщо `setup-api` реєструє провайдера або CLI-backend, який дескриптори
маніфесту не оголошують, або якщо дескриптор не має відповідної runtime-
реєстрації. Ці діагностики адитивні й не відхиляють застарілі plugins.

### Довідник setup.providers

| Поле         | Обов’язково | Тип        | Що це означає                                                                        |
| ------------- | -------- | ---------- | ------------------------------------------------------------------------------------ |
| `id`          | Так      | `string`   | id провайдера, відкритий під час налаштування або онбордингу. Тримайте нормалізовані id глобально унікальними. |
| `authMethods` | Ні       | `string[]` | id методів налаштування/auth, які цей провайдер підтримує без завантаження повного runtime.           |
| `envVars`     | Ні       | `string[]` | Env vars, які загальні поверхні налаштування/статусу можуть перевіряти до завантаження runtime Plugin.   |

### Поля setup

| Поле               | Обов’язково | Тип        | Що це означає                                                                                       |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | Ні       | `object[]` | Дескриптори налаштування провайдера, відкриті під час налаштування й онбордингу.                                     |
| `cliBackends`      | Ні       | `string[]` | id backend-ів часу налаштування, використані для пошуку налаштування за принципом descriptor-first. Тримайте нормалізовані id глобально унікальними. |
| `configMigrations` | Ні       | `string[]` | id міграцій конфігурації, що належать поверхні налаштування цього Plugin.                                          |
| `requiresRuntime`  | Ні       | `boolean`  | Чи налаштування все ще потребує виконання `setup-api` після пошуку дескрипторів.                            |

## Довідник uiHints

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

Кожна підказка поля може містити:

| Поле          | Тип        | Що це означає                           |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Мітка поля, видима користувачу.                |
| `help`        | `string`   | Короткий допоміжний текст.                      |
| `tags`        | `string[]` | Необов’язкові UI-теги.                       |
| `advanced`    | `boolean`  | Позначає поле як розширене.            |
| `sensitive`   | `boolean`  | Позначає поле як секретне або чутливе. |
| `placeholder` | `string`   | Текст placeholder для полів форми.       |

## Довідник contracts

Використовуйте `contracts` лише для статичних метаданих належності capability, які OpenClaw може
читати без імпорту runtime Plugin.

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

| Поле                             | Тип        | Що це означає                                                         |
| -------------------------------- | ---------- | --------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | id фабрик розширень app-server Codex, наразі `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | Runtime-id, для яких бандлований Plugin може реєструвати middleware результатів інструментів. |
| `externalAuthProviders`          | `string[]` | id провайдерів, чий хук зовнішнього профілю auth належить цьому Plugin.       |
| `speechProviders`                | `string[]` | id провайдерів мовлення, що належать цьому Plugin.                                 |
| `realtimeTranscriptionProviders` | `string[]` | id провайдерів realtime-транскрипції, що належать цьому Plugin.                 |
| `realtimeVoiceProviders`         | `string[]` | id realtime-voice провайдерів, що належать цьому Plugin.                         |
| `memoryEmbeddingProviders`       | `string[]` | id провайдерів embedding пам’яті, що належать цьому Plugin.                       |
| `mediaUnderstandingProviders`    | `string[]` | id провайдерів media-understanding, що належать цьому Plugin.                    |
| `imageGenerationProviders`       | `string[]` | id провайдерів image-generation, що належать цьому Plugin.                       |
| `videoGenerationProviders`       | `string[]` | id провайдерів video-generation, що належать цьому Plugin.                       |
| `webFetchProviders`              | `string[]` | id провайдерів web-fetch, що належать цьому Plugin.                              |
| `webSearchProviders`             | `string[]` | id провайдерів web-search, що належать цьому Plugin.                             |
| `migrationProviders`             | `string[]` | id провайдерів імпорту, що належать цьому Plugin для `openclaw migrate`.          |
| `tools`                          | `string[]` | Назви інструментів агента, що належать цьому Plugin для перевірок бандлованого контракту.        |

`contracts.embeddedExtensionFactories` збережено для бандлованих фабрик розширень Codex,
призначених лише для app-server. Бандловані трансформації результатів інструментів мають
оголошувати `contracts.agentToolResultMiddleware` і реєструватися через
`api.registerAgentToolResultMiddleware(...)` натомість. Зовнішні plugins не можуть
реєструвати middleware результатів інструментів, бо цей seam може переписувати високодовірений вивід інструментів
до того, як модель його побачить.

Plugins провайдерів, які реалізують `resolveExternalAuthProfiles`, мають оголошувати
`contracts.externalAuthProviders`. Plugins без оголошення все ще проходять
через застарілий резерв сумісності, але цей резерв повільніший і
буде вилучений після вікна міграції.

Бандловані провайдери embedding пам’яті мають оголошувати
`contracts.memoryEmbeddingProviders` для кожного id адаптера, який вони відкривають, включно з
вбудованими адаптерами, такими як `local`. Автономні CLI-шляхи використовують цей контракт
маніфесту, щоб завантажувати лише належний Plugin до того, як повний runtime Gateway
зареєструє провайдерів.

## Довідник mediaUnderstandingProviderMetadata

Використовуйте `mediaUnderstandingProviderMetadata`, коли провайдер media-understanding має
типові моделі, пріоритет резерву auto-auth або нативну підтримку документів, які
загальним core-хелперам потрібні до завантаження runtime. Ключі також мають бути оголошені в
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

| Поле                   | Тип                                 | Що це означає                                                                |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Медіа-capabilities, відкриті цим провайдером.                                 |
| `defaultModels`        | `Record<string, string>`            | Типові значення capability-to-model, використані, коли конфігурація не задає модель.      |
| `autoPriority`         | `Record<string, number>`            | Менші числа сортуються раніше для автоматичного credential-based резерву провайдера. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Нативні входи документів, підтримувані провайдером.                            |

## Довідник channelConfigs

Використовуйте `channelConfigs`, коли Plugin каналу потребує дешевих метаданих конфігурації до
завантаження runtime. Виявлення налаштування/статусу каналу лише для читання може використовувати ці метадані
безпосередньо для налаштованих зовнішніх каналів, коли запис налаштування недоступний або
коли `setup.requiresRuntime: false` оголошує runtime налаштування непотрібним.

`channelConfigs` — це метадані маніфесту Plugin, а не новий верхньорівневий розділ користувацької конфігурації.
Користувачі й далі налаштовують екземпляри каналів у `channels.<channel-id>`.
OpenClaw читає метадані маніфесту, щоб вирішити, якому Plugin належить цей налаштований
канал до виконання runtime-коду Plugin.

Для Plugin каналу `configSchema` і `channelConfigs` описують різні
шляхи:

- `configSchema` перевіряє `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` перевіряє `channels.<channel-id>`

Невбудовані плагіни, які оголошують `channels[]`, також мають оголошувати відповідні
записи `channelConfigs`. Без них OpenClaw усе ще може завантажити плагін, але
схема конфігурації холодного шляху, налаштування та поверхні Control UI не можуть знати
форму параметрів, що належать каналу, доки не виконається runtime плагіна.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` і
`nativeSkillsAutoEnabled` можуть оголошувати статичні стандартні значення `auto` для перевірок конфігурації команд,
які виконуються до завантаження runtime каналу. Вбудовані канали також можуть публікувати
ті самі стандартні значення через `package.json#openclaw.channel.commands` разом
з іншими метаданими каталогу каналів, що належать пакету.

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
      "commands": {
        "nativeCommandsAutoEnabled": true,
        "nativeSkillsAutoEnabled": true
      },
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Кожен запис каналу може містити:

| Поле          | Тип                      | Що це означає                                                                             |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema для `channels.<id>`. Обов’язкова для кожного оголошеного запису конфігурації каналу. |
| `uiHints`     | `Record<string, object>` | Необов’язкові UI-мітки, заповнювачі та підказки чутливості для цього розділу конфігурації каналу. |
| `label`       | `string`                 | Мітка каналу, що додається до поверхонь вибору й інспектування, коли runtime-метадані ще не готові. |
| `description` | `string`                 | Короткий опис каналу для поверхонь інспектування й каталогу.                              |
| `commands`    | `object`                 | Статичні автоматичні стандартні значення для нативних команд і нативних Skills для перевірок конфігурації до runtime. |
| `preferOver`  | `string[]`               | Ідентифікатори застарілих або нижчопріоритетних плагінів, які цей канал має випереджати в поверхнях вибору. |

### Заміна іншого плагіна каналу

Використовуйте `preferOver`, коли ваш плагін є бажаним власником для ідентифікатора каналу, який
також може надавати інший плагін. Типові випадки: перейменований ідентифікатор плагіна,
окремий плагін, що замінює вбудований плагін, або підтримуваний fork, який
зберігає той самий ідентифікатор каналу для сумісності конфігурації.

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

Коли налаштовано `channels.chat`, OpenClaw враховує і ідентифікатор каналу, і
ідентифікатор бажаного плагіна. Якщо нижчопріоритетний плагін було вибрано лише тому,
що він вбудований або увімкнений за замовчуванням, OpenClaw вимикає його в ефективній
runtime-конфігурації, щоб один плагін володів каналом і його інструментами. Явний вибір користувача
все одно має пріоритет: якщо користувач явно вмикає обидва плагіни, OpenClaw
зберігає цей вибір і повідомляє діагностику дубльованих каналів/інструментів замість
тихої зміни запитаного набору плагінів.

Обмежуйте `preferOver` ідентифікаторами плагінів, які справді можуть надавати той самий канал.
Це не загальне поле пріоритету й воно не перейменовує ключі користувацької конфігурації.

## Довідник modelSupport

Використовуйте `modelSupport`, коли OpenClaw має виводити ваш плагін провайдера з
коротких ідентифікаторів моделей, як-от `gpt-5.5` або `claude-sonnet-4.6`, до завантаження runtime
плагіна.

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
- якщо збігаються один невбудований плагін і один вбудований плагін, перемагає невбудований
  плагін
- решта неоднозначності ігнорується, доки користувач або конфігурація не вкаже провайдера

Поля:

| Поле            | Тип        | Що це означає                                                                  |
| --------------- | ---------- | ------------------------------------------------------------------------------ |
| `modelPrefixes` | `string[]` | Префікси, які зіставляються через `startsWith` із короткими ідентифікаторами моделей. |
| `modelPatterns` | `string[]` | Джерела регулярних виразів, що зіставляються з короткими ідентифікаторами моделей після вилучення суфікса профілю. |

## Довідник modelCatalog

Використовуйте `modelCatalog`, коли OpenClaw має знати метадані моделей провайдера до
завантаження runtime плагіна. Це джерело, що належить маніфесту, для фіксованих рядків каталогу,
псевдонімів провайдера, правил приховування та режиму виявлення. Runtime-оновлення
все одно належить коду runtime провайдера, але маніфест повідомляє ядру, коли runtime
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
        "reason": "not available on Azure OpenAI Responses"
      }
    ],
    "discovery": {
      "openai": "static"
    }
  }
}
```

Поля верхнього рівня:

| Поле           | Тип                                                      | Що це означає                                                                                              |
| -------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | Рядки каталогу для ідентифікаторів провайдерів, що належать цьому плагіну. Ключі також мають бути в `providers` верхнього рівня. |
| `aliases`      | `Record<string, object>`                                 | Псевдоніми провайдерів, які мають розв’язуватися до власного провайдера для планування каталогу або приховування. |
| `suppressions` | `object[]`                                               | Рядки моделей з іншого джерела, які цей плагін приховує з причини, специфічної для провайдера.             |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Чи можна прочитати каталог провайдера з метаданих маніфесту, оновити в кеш або чи потрібен runtime.        |

`aliases` бере участь у пошуку власника провайдера для планування каталогу моделей.
Цілі псевдонімів мають бути провайдерами верхнього рівня, що належать тому самому плагіну. Коли
список, відфільтрований за провайдером, використовує псевдонім, OpenClaw може прочитати маніфест власника й
застосувати перевизначення API/base URL псевдоніма без завантаження runtime провайдера.

`suppressions` замінює старий runtime-хук провайдера `suppressBuiltInModel`.
Записи приховування враховуються лише тоді, коли провайдер належить плагіну або
оголошений як ключ `modelCatalog.aliases`, що вказує на власного провайдера. Runtime-хуки
приховування більше не викликаються під час розв’язання моделей.

Поля провайдера:

| Поле     | Тип                      | Що це означає                                                    |
| --------- | ------------------------ | ---------------------------------------------------------------- |
| `baseUrl` | `string`                 | Необов’язковий стандартний base URL для моделей у цьому каталозі провайдера. |
| `api`     | `ModelApi`               | Необов’язковий стандартний API-адаптер для моделей у цьому каталозі провайдера. |
| `headers` | `Record<string, string>` | Необов’язкові статичні заголовки, що застосовуються до цього каталогу провайдера. |
| `models`  | `object[]`               | Обов’язкові рядки моделей. Рядки без `id` ігноруються.           |

Поля моделі:

| Поле            | Тип                                                            | Що це означає                                                              |
| --------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `id`            | `string`                                                       | Локальний для провайдера ідентифікатор моделі без префікса `provider/`.    |
| `name`          | `string`                                                       | Необов’язкова показувана назва.                                            |
| `api`           | `ModelApi`                                                     | Необов’язкове перевизначення API для окремої моделі.                       |
| `baseUrl`       | `string`                                                       | Необов’язкове перевизначення base URL для окремої моделі.                  |
| `headers`       | `Record<string, string>`                                       | Необов’язкові статичні заголовки для окремої моделі.                       |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Модальності, які приймає модель.                                           |
| `reasoning`     | `boolean`                                                      | Чи надає модель поведінку reasoning.                                       |
| `contextWindow` | `number`                                                       | Нативне контекстне вікно провайдера.                                       |
| `contextTokens` | `number`                                                       | Необов’язкова ефективна runtime-межа контексту, коли вона відрізняється від `contextWindow`. |
| `maxTokens`     | `number`                                                       | Максимальна кількість вихідних токенів, якщо відома.                       |
| `cost`          | `object`                                                       | Необов’язкова ціна в USD за мільйон токенів, зокрема необов’язкове `tieredPricing`. |
| `compat`        | `object`                                                       | Необов’язкові прапорці сумісності, що відповідають сумісності конфігурації моделей OpenClaw. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Статус у списку. Приховуйте лише тоді, коли рядок взагалі не має з’являтися. |
| `statusReason`  | `string`                                                       | Необов’язкова причина, що показується зі статусом, відмінним від доступного. |
| `replaces`      | `string[]`                                                     | Старі локальні для провайдера ідентифікатори моделей, які ця модель замінює. |
| `replacedBy`    | `string`                                                       | Локальний для провайдера ідентифікатор моделі-замінника для застарілих рядків. |
| `tags`          | `string[]`                                                     | Стабільні теги, які використовують засоби вибору й фільтри.                |

Поля приховування:

| Поле                       | Тип        | Що це означає                                                                                                              |
| -------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Ідентифікатор провайдера для верхнього рядка, який потрібно приховати. Має належати цьому плагіну або бути оголошеним як належний псевдонім. |
| `model`                    | `string`   | Локальний для провайдера ідентифікатор моделі, який потрібно приховати.                                                    |
| `reason`                   | `string`   | Необов’язкове повідомлення, яке показується, коли прихований рядок запитують напряму.                                      |
| `when.baseUrlHosts`        | `string[]` | Необов’язковий список ефективних хостів базових URL провайдера, потрібних для застосування приховування.                  |
| `when.providerConfigApiIn` | `string[]` | Необов’язковий список точних значень `api` конфігурації провайдера, потрібних для застосування приховування.              |

Не розміщуйте дані, призначені лише для виконання, у `modelCatalog`. Використовуйте `static` лише тоді, коли рядки маніфесту достатньо повні, щоб поверхні списку й вибору, відфільтровані за провайдером, могли пропускати виявлення через реєстр або середовище виконання. Використовуйте `refreshable`, коли рядки маніфесту корисні як початкові або додаткові елементи списку, але оновлення чи кеш можуть додати більше рядків пізніше; оновлювані рядки самі по собі не є авторитетними. Використовуйте `runtime`, коли OpenClaw має завантажити середовище виконання провайдера, щоб дізнатися список.

## Довідник modelIdNormalization

Використовуйте `modelIdNormalization` для дешевого, належного провайдеру очищення ідентифікаторів моделей, яке має відбутися до завантаження середовища виконання провайдера. Це зберігає псевдоніми, як-от короткі назви моделей, локальні для провайдера застарілі ідентифікатори та правила префіксів проксі, у маніфесті належного плагіна, а не в основних таблицях вибору моделі.

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

Поля провайдера:

| Поле                                 | Тип                     | Що це означає                                                                                                   |
| ------------------------------------ | ----------------------- | --------------------------------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Точні псевдоніми ідентифікаторів моделей без урахування регістру. Значення повертаються так, як записані.      |
| `stripPrefixes`                      | `string[]`              | Префікси, які потрібно видалити перед пошуком псевдоніма; корисно для застарілого дублювання провайдер/модель. |
| `prefixWhenBare`                     | `string`                | Префікс, який потрібно додати, коли нормалізований ідентифікатор моделі ще не містить `/`.                      |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Умовні правила префікса для простого ідентифікатора після пошуку псевдоніма, з ключами `modelPrefix` і `prefix`. |

## Довідник providerEndpoints

Використовуйте `providerEndpoints` для класифікації кінцевих точок, яку загальна політика запитів має знати до завантаження середовища виконання провайдера. Ядро й надалі визначає значення кожного `endpointClass`; маніфести плагінів визначають метадані хоста й базового URL.

Поля кінцевої точки:

| Поле                           | Тип        | Що це означає                                                                                                  |
| ------------------------------ | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Відомий клас кінцевої точки ядра, як-от `openrouter`, `moonshot-native` або `google-vertex`.                  |
| `hosts`                        | `string[]` | Точні імена хостів, що відповідають класу кінцевої точки.                                                      |
| `hostSuffixes`                 | `string[]` | Суфікси хостів, що відповідають класу кінцевої точки. Додавайте `.` на початку для зіставлення лише суфікса домену. |
| `baseUrls`                     | `string[]` | Точні нормалізовані базові HTTP(S) URL, що відповідають класу кінцевої точки.                                  |
| `googleVertexRegion`           | `string`   | Статичний регіон Google Vertex для точних глобальних хостів.                                                   |
| `googleVertexRegionHostSuffix` | `string`   | Суфікс, який потрібно прибрати з відповідних хостів, щоб відкрити префікс регіону Google Vertex.               |

## Довідник providerRequest

Використовуйте `providerRequest` для дешевих метаданих сумісності запитів, потрібних загальній політиці запитів без завантаження середовища виконання провайдера. Переписування корисного навантаження, специфічне для поведінки, тримайте в хуках середовища виконання провайдера або спільних допоміжних засобах сімейства провайдерів.

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

Поля провайдера:

| Поле                  | Тип          | Що це означає                                                                                           |
| --------------------- | ------------ | ------------------------------------------------------------------------------------------------------- |
| `family`              | `string`     | Мітка сімейства провайдера, яку використовують загальні рішення щодо сумісності запитів і діагностика. |
| `compatibilityFamily` | `"moonshot"` | Необов’язкова група сумісності сімейства провайдера для спільних допоміжних засобів запитів.           |
| `openAICompletions`   | `object`     | Прапорці запитів completions, сумісних з OpenAI; наразі `supportsStreamingUsage`.                       |

## Довідник modelPricing

Використовуйте `modelPricing`, коли провайдеру потрібна поведінка ціноутворення на рівні control-plane до завантаження середовища виконання. Кеш ціноутворення Gateway читає ці метадані без імпорту коду середовища виконання провайдера.

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

Поля провайдера:

| Поле         | Тип               | Що це означає                                                                                                 |
| ------------ | ----------------- | ------------------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Встановіть `false` для локальних або самостійно розгорнутих провайдерів, які ніколи не мають отримувати ціни OpenRouter або LiteLLM. |
| `openRouter` | `false \| object` | Зіставлення для пошуку цін OpenRouter. `false` вимикає пошук OpenRouter для цього провайдера.                |
| `liteLLM`    | `false \| object` | Зіставлення для пошуку цін LiteLLM. `false` вимикає пошук LiteLLM для цього провайдера.                      |

Поля джерела:

| Поле                       | Тип                | Що це означає                                                                                                      |
| -------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `provider`                 | `string`           | Ідентифікатор провайдера зовнішнього каталогу, коли він відрізняється від ідентифікатора провайдера OpenClaw, наприклад `z-ai` для провайдера `zai`. |
| `passthroughProviderModel` | `boolean`          | Обробляти ідентифікатори моделей із косою рискою як вкладені посилання провайдер/модель; корисно для проксі-провайдерів, таких як OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Додаткові варіанти ідентифікаторів моделей зовнішнього каталогу. `version-dots` пробує ідентифікатори версій із крапками, як-от `claude-opus-4.6`. |

### Індекс провайдерів OpenClaw

Індекс провайдерів OpenClaw — це попередні метадані OpenClaw для провайдерів, плагіни яких можуть ще не бути встановлені. Він не є частиною маніфесту плагіна. Маніфести плагінів залишаються авторитетним джерелом для встановлених плагінів. Індекс провайдерів — це внутрішній резервний контракт, який майбутні поверхні встановлюваних провайдерів і вибору моделей до встановлення використовуватимуть, коли плагін провайдера не встановлено.

Порядок авторитетності каталогу:

1. Конфігурація користувача.
2. `modelCatalog` маніфесту встановленого плагіна.
3. Кеш каталогу моделей після явного оновлення.
4. Попередні рядки Індексу провайдерів OpenClaw.

Індекс провайдерів не має містити секретів, увімкненого стану, хуків середовища виконання або живих даних моделей, специфічних для облікового запису. Його попередні каталоги використовують ту саму форму рядка провайдера `modelCatalog`, що й маніфести плагінів, але мають обмежуватися стабільними відображуваними метаданими, якщо поля адаптера середовища виконання, як-от `api`, `baseUrl`, ціни або прапорці сумісності, навмисно не підтримуються узгодженими з маніфестом встановленого плагіна. Провайдери з живим виявленням `/models` мають записувати оновлені рядки через явний шлях кешу каталогу моделей, а не змушувати звичайний список чи onboarding викликати API провайдера.

Записи Індексу провайдерів також можуть містити метадані встановлюваного плагіна для провайдерів, чий плагін було винесено з ядра або який інакше ще не встановлено. Ці метадані віддзеркалюють шаблон каталогу каналів: назви пакета, специфікації встановлення npm, очікуваної цілісності та дешевих міток вибору автентифікації достатньо, щоб показати варіант налаштування з установленням. Щойно плагін встановлено, його маніфест має перевагу, а запис Індексу провайдерів для цього провайдера ігнорується.

Застарілі ключі можливостей верхнього рівня не рекомендовано використовувати. Використовуйте `openclaw doctor --fix`, щоб перемістити `speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders` і `webSearchProviders` під `contracts`; звичайне завантаження маніфесту більше не розглядає ці поля верхнього рівня як належність можливостей.

## Маніфест порівняно з package.json

Ці два файли виконують різні завдання:

| Файл                   | Для чого використовувати                                                                                                      |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Виявлення, перевірка конфігурації, метадані вибору автентифікації та підказки UI, які мають існувати до запуску коду плагіна |
| `package.json`         | Метадані npm, встановлення залежностей і блок `openclaw`, який використовується для точок входу, обмеження встановлення, налаштування або метаданих каталогу |

Якщо ви не впевнені, де має бути певний фрагмент метаданих, скористайтеся цим правилом:

- якщо OpenClaw має знати це до завантаження коду плагіна, розмістіть це в `openclaw.plugin.json`
- якщо це стосується пакування, вхідних файлів або поведінки встановлення npm, розмістіть це в `package.json`

### Поля package.json, які впливають на виявлення

Деякі метадані плагіна до запуску середовища виконання навмисно зберігаються в `package.json` у блоці `openclaw`, а не в `openclaw.plugin.json`.

Важливі приклади:

| Поле                                                             | Що це означає                                                                                                                                                                        |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | Оголошує нативні точки входу Plugin. Має залишатися всередині каталогу пакета Plugin.                                                                                                   |
| `openclaw.runtimeExtensions`                                      | Оголошує зібрані JavaScript-точки входу runtime для встановлених пакетів. Має залишатися всередині каталогу пакета Plugin.                                                                 |
| `openclaw.setupEntry`                                             | Легка точка входу лише для налаштування, яку використовують під час onboarding, відкладеного запуску каналу та виявлення стану каналу лише для читання/SecretRef. Має залишатися всередині каталогу пакета Plugin. |
| `openclaw.runtimeSetupEntry`                                      | Оголошує зібрану JavaScript-точку входу налаштування для встановлених пакетів. Має залишатися всередині каталогу пакета Plugin.                                                                |
| `openclaw.channel`                                                | Дешеві метадані каталогу каналів, як-от мітки, шляхи до документації, псевдоніми та текст вибору.                                                                                                 |
| `openclaw.channel.commands`                                       | Статичні метадані нативних команд і нативних skill за замовчуванням, що автоматично застосовуються, які використовуються поверхнями конфігурації, аудиту та списку команд до завантаження runtime каналу.                                          |
| `openclaw.channel.configuredState`                                | Легкі метадані перевіряча налаштованого стану, який може відповісти «чи вже існує налаштування лише через env?» без завантаження повного runtime каналу.                                         |
| `openclaw.channel.persistedAuthState`                             | Легкі метадані перевіряча збереженого стану автентифікації, який може відповісти «чи вже хтось увійшов?» без завантаження повного runtime каналу.                                               |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Підказки для встановлення/оновлення для вбудованих і зовнішньо опублікованих Plugin.                                                                                                                   |
| `openclaw.install.defaultChoice`                                  | Бажаний шлях встановлення, коли доступно кілька джерел встановлення.                                                                                                                  |
| `openclaw.install.minHostVersion`                                 | Мінімальна підтримувана версія хоста OpenClaw із використанням нижньої межі semver на кшталт `>=2026.3.22`.                                                                                                    |
| `openclaw.install.expectedIntegrity`                              | Очікуваний рядок цілісності npm dist, наприклад `sha512-...`; потоки встановлення й оновлення перевіряють отриманий артефакт за ним.                                                            |
| `openclaw.install.allowInvalidConfigRecovery`                     | Дозволяє вузький шлях відновлення перевстановлення вбудованого Plugin, коли конфігурація недійсна.                                                                                                       |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Дозволяє поверхням каналу лише для налаштування завантажуватися під час запуску до повного Plugin каналу.                                                                                                 |

Метадані маніфесту визначають, які варіанти provider/каналу/налаштування з’являються в
onboarding до завантаження runtime. `package.json#openclaw.install` повідомляє
onboarding, як отримати або ввімкнути цей Plugin, коли користувач вибирає один із цих
варіантів. Не переміщуйте підказки встановлення в `openclaw.plugin.json`.

`openclaw.install.minHostVersion` застосовується під час встановлення та завантаження
реєстру маніфестів. Недійсні значення відхиляються; новіші, але дійсні значення пропускають
Plugin на старіших хостах.

Точне закріплення версії npm уже міститься в `npmSpec`, наприклад
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Офіційні записи зовнішнього каталогу
мають поєднувати точні spec з `expectedIntegrity`, щоб потоки оновлення завершувалися
закритою помилкою, якщо отриманий npm-артефакт більше не відповідає закріпленому релізу.
Інтерактивний onboarding усе ще пропонує довірені npm spec реєстру, зокрема прості
імена пакетів і dist-tags, для сумісності. Діагностика каталогу може
розрізняти точні, плаваючі, закріплені цілісністю, без цілісності, з невідповідністю
імені пакета та недійсні джерела default-choice. Вона також попереджає, коли
`expectedIntegrity` присутній, але немає дійсного npm-джерела, яке він може закріпити.
Коли `expectedIntegrity` присутній,
потоки встановлення/оновлення застосовують його; коли його пропущено, розв’язання реєстру
записується без закріплення цілісності.

Plugin каналів мають надавати `openclaw.setupEntry`, коли стан, список каналів
або сканування SecretRef мають ідентифікувати налаштовані облікові записи без завантаження повного
runtime. Точка входу налаштування має надавати метадані каналу плюс безпечні для налаштування адаптери конфігурації,
стану та секретів; залишайте мережеві клієнти, Gateway listeners і
transport runtimes у головній точці входу extension.

Поля точок входу runtime не скасовують перевірки меж пакета для полів
точок входу source. Наприклад, `openclaw.runtimeExtensions` не може зробити
шлях `openclaw.extensions`, що виходить за межі, придатним для завантаження.

`openclaw.install.allowInvalidConfigRecovery` навмисно вузький. Він не робить
довільні зламані конфігурації придатними для встановлення. Нині він лише дозволяє потокам встановлення
відновлюватися після конкретних застарілих збоїв оновлення вбудованого Plugin, як-от
відсутній шлях вбудованого Plugin або застарілий запис `channels.<id>` для того самого
вбудованого Plugin. Непов’язані помилки конфігурації все ще блокують встановлення та спрямовують операторів
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

Використовуйте його, коли потоки налаштування, doctor, стану або присутності лише для читання потребують дешевого
так/ні-зонду автентифікації до завантаження повного Plugin каналу. Збережений стан автентифікації не є
налаштованим станом каналу: не використовуйте ці метадані для автоматичного ввімкнення Plugin,
відновлення runtime-залежностей або вирішення, чи має завантажуватися runtime каналу.
Цільовий export має бути невеликою функцією, яка читає лише збережений стан; не
спрямовуйте його через повний barrel runtime каналу.

`openclaw.channel.configuredState` має таку саму форму для дешевих перевірок
налаштованості лише через env:

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

Використовуйте його, коли канал може відповісти про налаштований стан з env або інших крихітних
нерuntime-вхідних даних. Якщо перевірка потребує повного розв’язання конфігурації або справжнього
runtime каналу, залиште цю логіку в hook Plugin `config.hasConfiguredState`.

## Пріоритет виявлення (дублікати id Plugin)

OpenClaw виявляє Plugin з кількох коренів (вбудовані, глобальне встановлення, workspace, явні шляхи, вибрані конфігурацією). Якщо два виявлення мають однаковий `id`, зберігається лише маніфест із **найвищим пріоритетом**; дублікати з нижчим пріоритетом відкидаються замість завантаження поруч із ним.

Пріоритет, від найвищого до найнижчого:

1. **Вибраний конфігурацією** — шлях, явно закріплений у `plugins.entries.<id>`
2. **Вбудований** — Plugin, що постачаються з OpenClaw
3. **Глобальне встановлення** — Plugin, встановлені в глобальний корінь Plugin OpenClaw
4. **Workspace** — Plugin, виявлені відносно поточного workspace

Наслідки:

- Fork або застаріла копія вбудованого Plugin, що лежить у workspace, не затінить вбудовану збірку.
- Щоб фактично перевизначити вбудований Plugin локальним, закріпіть його через `plugins.entries.<id>`, щоб він переміг за пріоритетом, а не покладався на виявлення workspace.
- Відкидання дублікатів журналюються, щоб Doctor і діагностика запуску могли вказати на відкинуту копію.

## Вимоги JSON Schema

- **Кожен Plugin має постачати JSON Schema**, навіть якщо він не приймає конфігурацію.
- Порожня schema прийнятна (наприклад, `{ "type": "object", "additionalProperties": false }`).
- Schema перевіряються під час читання/запису конфігурації, а не під час runtime.

## Поведінка валідації

- Невідомі ключі `channels.*` є **помилками**, якщо id каналу не оголошено
  маніфестом Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` і `plugins.slots.*`
  мають посилатися на **виявлювані** id Plugin. Невідомі id є **помилками**.
- Якщо Plugin встановлено, але він має зламаний або відсутній маніфест чи schema,
  валідація завершується помилкою, а Doctor повідомляє про помилку Plugin.
- Якщо конфігурація Plugin існує, але Plugin **вимкнений**, конфігурація зберігається, а
  **попередження** показується в Doctor + журналах.

Див. [Довідник конфігурації](/uk/gateway/configuration) для повної schema `plugins.*`.

## Примітки

- Маніфест є **обов’язковим для нативних Plugin OpenClaw**, включно з локальними завантаженнями з файлової системи. Runtime все одно завантажує модуль Plugin окремо; маніфест призначений лише для виявлення + валідації.
- Нативні маніфести аналізуються як JSON5, тому коментарі, кінцеві коми та ключі без лапок приймаються, якщо фінальне значення все ще є об’єктом.
- Завантажувач маніфестів читає лише документовані поля маніфесту. Уникайте власних ключів верхнього рівня.
- `channels`, `providers`, `cliBackends` і `skills` можна всі пропустити, коли Plugin їх не потребує.
- `providerDiscoveryEntry` має залишатися легким і не повинен імпортувати широкий runtime-код; використовуйте його для статичних метаданих каталогу provider або вузьких дескрипторів виявлення, а не для виконання під час запиту.
- Ексклюзивні типи Plugin вибираються через `plugins.slots.*`: `kind: "memory"` через `plugins.slots.memory`, `kind: "context-engine"` через `plugins.slots.contextEngine` (типово `legacy`).
- Метадані env-var (`setup.providers[].envVars`, застарілий `providerAuthEnvVars` і `channelEnvVars`) є лише декларативними. Стан, аудит, валідація доставки cron та інші поверхні лише для читання все ще застосовують довіру до Plugin і ефективну політику активації, перш ніж трактувати env var як налаштовану.
- Для метаданих runtime wizard, які потребують коду provider, див. [Runtime hooks provider](/uk/plugins/architecture-internals#provider-runtime-hooks).
- Якщо ваш Plugin залежить від native modules, задокументуйте кроки збірки та будь-які вимоги allowlist менеджера пакетів (наприклад, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Пов’язане

<CardGroup cols={3}>
  <Card title="Створення Plugin" href="/uk/plugins/building-plugins" icon="rocket">
    Початок роботи з Plugin.
  </Card>
  <Card title="Архітектура Plugin" href="/uk/plugins/architecture" icon="diagram-project">
    Внутрішня архітектура та модель capabilities.
  </Card>
  <Card title="Огляд SDK" href="/uk/plugins/sdk-overview" icon="book">
    Довідник Plugin SDK та імпорти subpath.
  </Card>
</CardGroup>
