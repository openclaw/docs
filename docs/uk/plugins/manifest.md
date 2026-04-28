---
read_when:
    - Ви створюєте Plugin для OpenClaw
    - Вам потрібно випустити схему конфігурації Plugin або діагностувати помилки валідації Plugin
summary: Маніфест Plugin + вимоги до схеми JSON (сувора перевірка конфігурації)
title: Маніфест Plugin
x-i18n:
    generated_at: "2026-04-28T17:10:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9b3c48d2173ac6d818ea5a7887cd30ccaeb056f14529175c09d022df3b69cdc
    source_path: plugins/manifest.md
    workflow: 16
---

Ця сторінка стосується лише **нативного маніфесту Plugin OpenClaw**.

Сумісні макети пакетів див. у [Пакети Plugin](/uk/plugins/bundles).

Сумісні формати пакетів використовують інші файли маніфестів:

- Пакет Codex: `.codex-plugin/plugin.json`
- Пакет Claude: `.claude-plugin/plugin.json` або типовий макет компонентів Claude
  без маніфесту
- Пакет Cursor: `.cursor-plugin/plugin.json`

OpenClaw також автоматично виявляє ці макети пакетів, але вони не перевіряються
за схемою `openclaw.plugin.json`, описаною тут.

Для сумісних пакетів OpenClaw наразі читає метадані пакета, а також оголошені
корені навичок, корені команд Claude, стандартні значення `settings.json` пакета Claude,
стандартні значення LSP пакета Claude та підтримувані набори хуків, коли макет відповідає
очікуванням середовища виконання OpenClaw.

Кожен нативний Plugin OpenClaw **має** постачати файл `openclaw.plugin.json` у
**корені Plugin**. OpenClaw використовує цей маніфест для перевірки конфігурації
**без виконання коду Plugin**. Відсутні або недійсні маніфести вважаються
помилками Plugin і блокують перевірку конфігурації.

Див. повний посібник із системи Plugin: [Plugins](/uk/tools/plugin).
Для нативної моделі можливостей і поточних рекомендацій щодо зовнішньої сумісності:
[Модель можливостей](/uk/plugins/architecture#public-capability-model).

## Що робить цей файл

`openclaw.plugin.json` — це метадані, які OpenClaw читає **перед завантаженням вашого
коду Plugin**. Усе нижче має бути достатньо легким для перевірки без запуску
середовища виконання Plugin.

**Використовуйте його для:**

- ідентичності Plugin, перевірки конфігурації та підказок інтерфейсу конфігурації
- метаданих автентифікації, онбордингу та налаштування (псевдонім, автоматичне ввімкнення, змінні середовища провайдера, варіанти автентифікації)
- підказок активації для поверхонь площини керування
- скороченого володіння сімейством моделей
- статичних знімків володіння можливостями (`contracts`)
- метаданих QA runner, які може перевіряти спільний хост `openclaw qa`
- метаданих конфігурації для конкретних каналів, об’єднаних у каталог і поверхні перевірки

**Не використовуйте його для:** реєстрації поведінки під час виконання, оголошення точок входу коду
або метаданих встановлення npm. Вони належать до вашого коду Plugin і `package.json`.

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

| Поле                                | Обов’язкове | Тип                              | Що це означає                                                                                                                                                                                                                      |
| ------------------------------------ | ----------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Так         | `string`                         | Канонічний id Plugin. Це id, що використовується в `plugins.entries.<id>`.                                                                                                                                                         |
| `configSchema`                       | Так         | `object`                         | Вбудована JSON Schema для конфігурації цього Plugin.                                                                                                                                                                                |
| `enabledByDefault`                   | Ні          | `true`                           | Позначає вбудований Plugin як увімкнений за замовчуванням. Пропустіть це поле або задайте будь-яке значення, відмінне від `true`, щоб залишити Plugin вимкненим за замовчуванням.                                                   |
| `legacyPluginIds`                    | Ні          | `string[]`                       | Застарілі id, що нормалізуються до цього канонічного id Plugin.                                                                                                                                                                     |
| `autoEnableWhenConfiguredProviders`  | Ні          | `string[]`                       | id провайдерів, які мають автоматично вмикати цей Plugin, коли auth, config або model refs згадують їх.                                                                                                                            |
| `kind`                               | Ні          | `"memory"` \| `"context-engine"` | Оголошує ексклюзивний тип Plugin, який використовується `plugins.slots.*`.                                                                                                                                                          |
| `channels`                           | Ні          | `string[]`                       | id каналів, що належать цьому Plugin. Використовується для виявлення та перевірки конфігурації.                                                                                                                                     |
| `providers`                          | Ні          | `string[]`                       | id провайдерів, що належать цьому Plugin.                                                                                                                                                                                          |
| `providerDiscoveryEntry`             | Ні          | `string`                         | Шлях до легкого модуля виявлення провайдера, відносний до кореня Plugin, для metadata каталогу провайдерів у межах маніфесту, яку можна завантажити без активації повного runtime Plugin.                                         |
| `modelSupport`                       | Ні          | `object`                         | Скорочена metadata сімейства моделей, що належить маніфесту й використовується для автоматичного завантаження Plugin перед runtime.                                                                                                 |
| `modelCatalog`                       | Ні          | `object`                         | Декларативна metadata каталогу моделей для провайдерів, що належать цьому Plugin. Це контракт control plane для майбутнього read-only listing, onboarding, model pickers, aliases і suppression без завантаження runtime Plugin.    |
| `modelPricing`                       | Ні          | `object`                         | Політика lookup зовнішніх цін, що належить провайдеру. Використовуйте її, щоб виключити локальні/self-hosted провайдери з віддалених каталогів цін або зіставити provider refs з id каталогів OpenRouter/LiteLLM без hardcoding provider ids у core. |
| `modelIdNormalization`               | Ні          | `object`                         | Очищення alias/prefix для model-id, що належить провайдеру й має виконуватися до завантаження runtime провайдера.                                                                                                                  |
| `providerEndpoints`                  | Ні          | `object[]`                       | metadata host/baseUrl endpoints, що належить маніфесту, для routes провайдера, які core має класифікувати до завантаження runtime провайдера.                                                                                      |
| `providerRequest`                    | Ні          | `object`                         | Легка metadata provider-family і request-compatibility, що використовується generic request policy до завантаження runtime провайдера.                                                                                              |
| `cliBackends`                        | Ні          | `string[]`                       | id backend-ів inference CLI, що належать цьому Plugin. Використовується для startup auto-activation з явних config refs.                                                                                                           |
| `syntheticAuthRefs`                  | Ні          | `string[]`                       | Provider або CLI backend refs, synthetic auth hook яких належить Plugin і має перевірятися під час холодного виявлення моделей до завантаження runtime.                                                                             |
| `nonSecretAuthMarkers`               | Ні          | `string[]`                       | Placeholder-значення API key, що належать вбудованому Plugin і представляють non-secret локальний, OAuth або ambient credential state.                                                                                              |
| `commandAliases`                     | Ні          | `object[]`                       | Імена команд, що належать цьому Plugin і мають створювати Plugin-aware config і CLI diagnostics до завантаження runtime.                                                                                                           |
| `providerAuthEnvVars`                | Ні          | `Record<string, string[]>`       | Застаріла сумісна env metadata для provider auth/status lookup. Для нових Plugin надавайте перевагу `setup.providers[].envVars`; OpenClaw усе ще читає це під час deprecation window.                                              |
| `providerAuthAliases`                | Ні          | `Record<string, string>`         | id провайдерів, які мають повторно використовувати інший id провайдера для auth lookup, наприклад coding provider, що спільно використовує API key базового провайдера та auth profiles.                                           |
| `channelEnvVars`                     | Ні          | `Record<string, string[]>`       | Легка env metadata каналу, яку OpenClaw може інспектувати без завантаження коду Plugin. Використовуйте це для env-driven channel setup або auth surfaces, які мають бачити generic startup/config helpers.                         |
| `providerAuthChoices`                | Ні          | `object[]`                       | Легка metadata auth-choice для onboarding pickers, preferred-provider resolution і простого CLI flag wiring.                                                                                                                        |
| `activation`                         | Ні          | `object`                         | Легка metadata activation planner для startup, provider, command, channel, route і capability-triggered loading. Лише metadata; runtime Plugin усе ще володіє фактичною поведінкою.                                                 |
| `setup`                              | Ні          | `object`                         | Легкі descriptors setup/onboarding, які discovery і setup surfaces можуть інспектувати без завантаження runtime Plugin.                                                                                                            |
| `qaRunners`                          | Ні          | `object[]`                       | Легкі descriptors QA runner, що використовуються спільним host `openclaw qa` до завантаження runtime Plugin.                                                                                                                       |
| `contracts`                          | Ні          | `object`                         | Статичний snapshot вбудованих capabilities для external auth hooks, speech, realtime transcription, realtime voice, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search і tool ownership. |
| `mediaUnderstandingProviderMetadata` | Ні          | `Record<string, object>`         | Легкі defaults media-understanding для id провайдерів, оголошених у `contracts.mediaUnderstandingProviders`.                                                                                                                       |
| `channelConfigs`                     | Ні          | `Record<string, object>`         | metadata конфігурації каналу, що належить маніфесту й об’єднується з discovery і validation surfaces до завантаження runtime.                                                                                                      |
| `skills`                             | Ні          | `string[]`                       | Каталоги Skills для завантаження, відносні до кореня Plugin.                                                                                                                                                                       |
| `name`                               | Ні          | `string`                         | Зрозуміла для людини назва Plugin.                                                                                                                                                                                                 |
| `description`                        | Ні          | `string`                         | Короткий підсумок, що показується в Plugin surfaces.                                                                                                                                                                               |
| `version`                            | Ні          | `string`                         | Інформаційна версія Plugin.                                                                                                                                                                                                        |
| `uiHints`                            | Ні          | `Record<string, object>`         | UI labels, placeholders і sensitivity hints для config fields.                                                                                                                                                                     |

## Довідник providerAuthChoices

Кожен запис `providerAuthChoices` описує один onboarding або auth choice.
OpenClaw читає це до завантаження runtime провайдера.
Списки setup провайдера використовують ці manifest choices, setup
choices, derived з descriptor, і install-catalog metadata без завантаження runtime провайдера.

| Поле                  | Обов’язкове | Тип                                             | Що це означає                                                                                                                                                |
| --------------------- | ----------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `provider`            | Так         | `string`                                        | Ідентифікатор провайдера, якому належить цей вибір.                                                                                                         |
| `method`              | Так         | `string`                                        | Ідентифікатор методу автентифікації, до якого потрібно виконати диспетчеризацію.                                                                             |
| `choiceId`            | Так         | `string`                                        | Стабільний ідентифікатор вибору автентифікації, який використовується в потоках онбордингу та CLI.                                                          |
| `choiceLabel`         | Ні          | `string`                                        | Мітка для користувача. Якщо її не вказано, OpenClaw повертається до `choiceId`.                                                                              |
| `choiceHint`          | Ні          | `string`                                        | Короткий допоміжний текст для засобу вибору.                                                                                                                 |
| `assistantPriority`   | Ні          | `number`                                        | Менші значення сортуються раніше в інтерактивних засобах вибору, керованих асистентом.                                                                       |
| `assistantVisibility` | Ні          | `"visible"` \| `"manual-only"`                  | Приховує вибір із засобів вибору асистента, водночас дозволяючи ручний вибір у CLI.                                                                          |
| `deprecatedChoiceIds` | Ні          | `string[]`                                      | Застарілі ідентифікатори вибору, які мають перенаправляти користувачів до цього вибору-замінника.                                                           |
| `groupId`             | Ні          | `string`                                        | Необов’язковий ідентифікатор групи для групування пов’язаних виборів.                                                                                        |
| `groupLabel`          | Ні          | `string`                                        | Мітка для користувача для цієї групи.                                                                                                                        |
| `groupHint`           | Ні          | `string`                                        | Короткий допоміжний текст для групи.                                                                                                                         |
| `optionKey`           | Ні          | `string`                                        | Внутрішній ключ опції для простих потоків автентифікації з одним прапорцем.                                                                                  |
| `cliFlag`             | Ні          | `string`                                        | Назва прапорця CLI, наприклад `--openrouter-api-key`.                                                                                                        |
| `cliOption`           | Ні          | `string`                                        | Повна форма опції CLI, наприклад `--openrouter-api-key <key>`.                                                                                               |
| `cliDescription`      | Ні          | `string`                                        | Опис, що використовується в довідці CLI.                                                                                                                     |
| `onboardingScopes`    | Ні          | `Array<"text-inference" \| "image-generation">` | У яких поверхнях онбордингу має з’являтися цей вибір. Якщо не вказано, типове значення — `["text-inference"]`.                                               |

## Довідник commandAliases

Використовуйте `commandAliases`, коли Plugin володіє назвою runtime-команди, яку користувачі можуть помилково додати в `plugins.allow` або спробувати запустити як кореневу команду CLI. OpenClaw використовує ці метадані для діагностики без імпорту runtime-коду Plugin.

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

| Поле        | Обов’язкове | Тип               | Що це означає                                                                                 |
| ----------- | ----------- | ----------------- | --------------------------------------------------------------------------------------------- |
| `name`      | Так         | `string`          | Назва команди, що належить цьому Plugin.                                                      |
| `kind`      | Ні          | `"runtime-slash"` | Позначає псевдонім як слеш-команду чату, а не як кореневу команду CLI.                        |
| `cliCommand` | Ні         | `string`          | Пов’язана коренева команда CLI, яку слід запропонувати для операцій CLI, якщо така існує.     |

## Довідник activation

Використовуйте `activation`, коли Plugin може дешево оголосити, які події площини керування мають включати його до плану активації/завантаження.

Цей блок є метаданими планувальника, а не API життєвого циклу. Він не реєструє runtime-поведінку, не замінює `register(...)` і не обіцяє, що код Plugin уже виконався. Планувальник активації використовує ці поля, щоб звузити список кандидатів Plugin, перш ніж повернутися до наявних метаданих володіння маніфесту, таких як `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` і хуки.

Віддавайте перевагу найвужчим метаданим, які вже описують володіння. Використовуйте `providers`, `channels`, `commandAliases`, дескриптори налаштування або `contracts`, коли ці поля виражають зв’язок. Використовуйте `activation` для додаткових підказок планувальнику, які не можна представити цими полями володіння.
Використовуйте верхньорівневий `cliBackends` для runtime-псевдонімів CLI, таких як `claude-cli`, `codex-cli` або `google-gemini-cli`; `activation.onAgentHarnesses` призначений лише для ідентифікаторів вбудованих агентних обв’язок, які ще не мають поля володіння.

Цей блок містить лише метадані. Він не реєструє runtime-поведінку та не замінює `register(...)`, `setupEntry` або інші runtime/plugin точки входу. Поточні споживачі використовують його як підказку для звуження перед ширшим завантаженням Plugin, тому відсутність метаданих активації зазвичай коштує лише продуктивності; це не має змінювати коректність, доки ще існують застарілі резервні механізми володіння маніфесту.

Кожен Plugin має навмисно встановлювати `activation.onStartup`, оскільки OpenClaw відходить від неявних імпортів під час запуску. Встановлюйте `true` лише тоді, коли Plugin має запускатися під час старту Gateway. Встановлюйте `false`, коли Plugin інертний під час запуску й має завантажуватися лише за вужчими тригерами. Пропуск `onStartup` зберігає застарілий резервний механізм неявного startup-sidecar для Plugin без статичних метаданих можливостей; майбутні версії можуть припинити завантажувати такі Plugin під час запуску, якщо вони не оголосять `activation.onStartup: true`. Звіти про статус і сумісність Plugin попереджають `legacy-implicit-startup-sidecar`, коли Plugin усе ще покладається на цей резервний механізм.

Для тестування міграції встановіть
`OPENCLAW_DISABLE_LEGACY_IMPLICIT_STARTUP_SIDECARS=1`, щоб вимкнути лише цей
застарілий резервний механізм. Цей режим за явним увімкненням не блокує явні
Plugin з `activation.onStartup: true` або Plugin, завантажені каналом, конфігурацією,
агентною обв’язкою, пам’яттю чи іншими вужчими тригерами активації.

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

| Поле               | Обов’язкове | Тип                                                  | Що це означає                                                                                                                                                                                                                                      |
| ------------------ | ----------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | Ні          | `boolean`                                            | Явна активація під час запуску Gateway. Кожен Plugin має встановити це поле. `true` імпортує Plugin під час запуску; `false` відмовляється від застарілого неявного резервного запуску sidecar, якщо інший відповідний тригер не потребує завантаження. |
| `onProviders`      | Ні          | `string[]`                                           | Ідентифікатори провайдерів, які мають включати цей Plugin до планів активації/завантаження.                                                                                                                                                       |
| `onAgentHarnesses` | Ні          | `string[]`                                           | Runtime-ідентифікатори вбудованих агентних обв’язок, які мають включати цей Plugin до планів активації/завантаження. Використовуйте верхньорівневий `cliBackends` для псевдонімів бекендів CLI.                                                   |
| `onCommands`       | Ні          | `string[]`                                           | Ідентифікатори команд, які мають включати цей Plugin до планів активації/завантаження.                                                                                                                                                            |
| `onChannels`       | Ні          | `string[]`                                           | Ідентифікатори каналів, які мають включати цей Plugin до планів активації/завантаження.                                                                                                                                                           |
| `onRoutes`         | Ні          | `string[]`                                           | Типи маршрутів, які мають включати цей Plugin до планів активації/завантаження.                                                                                                                                                                   |
| `onConfigPaths`    | Ні          | `string[]`                                           | Шляхи конфігурації відносно кореня, які мають включати цей Plugin до планів запуску/завантаження, коли шлях присутній і не вимкнений явно.                                                                                                        |
| `onCapabilities`   | Ні          | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Широкі підказки можливостей, що використовуються плануванням активації площини керування. За можливості віддавайте перевагу вужчим полям.                                                                                                         |

Поточні live-споживачі:

- Планування запуску Gateway використовує `activation.onStartup` для явного імпорту під час запуску та відмови від застарілого неявного резервного запуску sidecar
- планування CLI, ініційоване командою, повертається до застарілих `commandAliases[].cliCommand` або `commandAliases[].name`
- планування запуску агентного runtime використовує `activation.onAgentHarnesses` для вбудованих обв’язок і верхньорівневий `cliBackends[]` для псевдонімів runtime CLI
- планування налаштування/каналу, ініційоване каналом, повертається до застарілого володіння `channels[]`, коли явні метадані активації каналу відсутні
- планування Plugin під час запуску використовує `activation.onConfigPaths` для неканальних кореневих поверхонь конфігурації, таких як блок `browser` у вбудованому browser Plugin
- планування налаштування/runtime, ініційоване провайдером, повертається до застарілого володіння `providers[]` і верхньорівневого `cliBackends[]`, коли явні метадані активації провайдера відсутні

Діагностика планувальника може відрізняти явні підказки активації від резервного володіння маніфесту. Наприклад, `activation-command-hint` означає, що збігся `activation.onCommands`, тоді як `manifest-command-alias` означає, що планувальник натомість використав володіння `commandAliases`. Ці мітки причин призначені для діагностики хоста й тестів; автори Plugin мають продовжувати оголошувати метадані, які найкраще описують володіння.

## Довідник qaRunners

Використовуйте `qaRunners`, коли Plugin додає один або кілька транспортних runner під спільним коренем `openclaw qa`. Зберігайте ці метадані дешевими та статичними; runtime Plugin усе ще володіє фактичною реєстрацією CLI через легку поверхню `runtime-api.ts`, яка експортує `qaRunnerCliRegistrations`.

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

| Поле         | Обов’язково | Тип      | Що це означає                                                    |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | Так      | `string` | Підкоманда, змонтована під `openclaw qa`, наприклад `matrix`.    |
| `description` | Ні       | `string` | Резервний текст довідки, що використовується, коли спільному хосту потрібна команда-заглушка. |

## довідник setup

Використовуйте `setup`, коли поверхням налаштування й онбордингу потрібні дешеві метадані, що належать Plugin, до завантаження runtime.

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

Верхньорівневе `cliBackends` залишається чинним і продовжує описувати бекенди виведення CLI. `setup.cliBackends` — це специфічна для setup поверхня дескриптора для потоків control-plane/setup, які мають залишатися лише метаданими.

Коли наявні, `setup.providers` і `setup.cliBackends` є пріоритетною поверхнею пошуку на основі дескрипторів для виявлення setup. Якщо дескриптор лише звужує кандидатний Plugin, а setup все ще потребує багатших runtime-хуків під час налаштування, установіть `requiresRuntime: true` і залиште `setup-api` як резервний шлях виконання.

OpenClaw також включає `setup.providers[].envVars` у загальні пошуки автентифікації provider і env-var. `providerAuthEnvVars` залишається підтримуваним через адаптер сумісності протягом вікна вилучення, але небандловані plugins, які все ще його використовують, отримують діагностику маніфесту. Нові plugins мають розміщувати env-метадані setup/status у `setup.providers[].envVars`.

OpenClaw також може виводити прості варіанти setup з `setup.providers[].authMethods`, коли запис setup недоступний або коли `setup.requiresRuntime: false` оголошує runtime setup непотрібним. Явні записи `providerAuthChoices` залишаються пріоритетними для власних міток, прапорців CLI, області онбордингу та метаданих assistant.

Установлюйте `requiresRuntime: false` лише тоді, коли цих дескрипторів достатньо для поверхні setup. OpenClaw трактує явне `false` як контракт лише на основі дескрипторів і не виконуватиме `setup-api` або `openclaw.setupEntry` для пошуку setup. Якщо Plugin лише з дескрипторами все ж постачає один із цих runtime-записів setup, OpenClaw повідомляє додаткову діагностику й продовжує його ігнорувати. Пропущене `requiresRuntime` зберігає застарілу резервну поведінку, щоб наявні plugins, які додали дескриптори без цього прапорця, не ламалися.

Оскільки пошук setup може виконувати код `setup-api`, що належить Plugin, нормалізовані значення `setup.providers[].id` і `setup.cliBackends[]` мають залишатися унікальними серед виявлених plugins. Неоднозначне володіння завершується закрито замість вибору переможця з порядку виявлення.

Коли runtime setup виконується, діагностика реєстру setup повідомляє про розбіжність дескрипторів, якщо `setup-api` реєструє provider або бекенд CLI, який дескриптори маніфесту не оголошують, або якщо дескриптор не має відповідної runtime-реєстрації. Ця діагностика є додатковою й не відхиляє застарілі plugins.

### довідник setup.providers

| Поле         | Обов’язково | Тип        | Що це означає                                                                      |
| ------------- | -------- | ---------- | ------------------------------------------------------------------------------------ |
| `id`          | Так      | `string`   | Ідентифікатор provider, відкритий під час setup або онбордингу. Зберігайте нормалізовані ідентифікатори глобально унікальними. |
| `authMethods` | Ні       | `string[]` | Ідентифікатори методів setup/auth, які цей provider підтримує без завантаження повного runtime. |
| `envVars`     | Ні       | `string[]` | Env vars, які загальні поверхні setup/status можуть перевірити до завантаження runtime Plugin. |

### поля setup

| Поле               | Обов’язково | Тип        | Що це означає                                                                                     |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | Ні       | `object[]` | Дескриптори setup provider, відкриті під час setup і онбордингу.                                  |
| `cliBackends`      | Ні       | `string[]` | Ідентифікатори бекендів під час setup, що використовуються для пошуку setup за дескриптором. Зберігайте нормалізовані ідентифікатори глобально унікальними. |
| `configMigrations` | Ні       | `string[]` | Ідентифікатори міграцій конфігурації, що належать поверхні setup цього Plugin.                     |
| `requiresRuntime`  | Ні       | `boolean`  | Чи setup все ще потребує виконання `setup-api` після пошуку дескриптора.                          |

## довідник uiHints

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

| Поле          | Тип        | Що це означає                          |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Мітка поля, видима користувачу.        |
| `help`        | `string`   | Короткий допоміжний текст.             |
| `tags`        | `string[]` | Необов’язкові UI-теги.                 |
| `advanced`    | `boolean`  | Позначає поле як розширене.            |
| `sensitive`   | `boolean`  | Позначає поле як таємне або чутливе.   |
| `placeholder` | `string`   | Текст заповнювача для полів форми.     |

## довідник contracts

Використовуйте `contracts` лише для статичних метаданих володіння можливостями, які OpenClaw може прочитати без імпорту runtime Plugin.

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

Кожен список необов’язковий:

| Поле                             | Тип        | Що це означає                                                       |
| -------------------------------- | ---------- | --------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Ідентифікатори фабрик extension app-server Codex, наразі `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | Runtime-ідентифікатори, для яких бандлований Plugin може реєструвати middleware результатів інструментів. |
| `externalAuthProviders`          | `string[]` | Ідентифікатори provider, хуком зовнішнього профілю автентифікації яких володіє цей Plugin. |
| `speechProviders`                | `string[]` | Ідентифікатори provider мовлення, якими володіє цей Plugin.          |
| `realtimeTranscriptionProviders` | `string[]` | Ідентифікатори provider realtime-транскрипції, якими володіє цей Plugin. |
| `realtimeVoiceProviders`         | `string[]` | Ідентифікатори provider realtime-голосу, якими володіє цей Plugin.  |
| `memoryEmbeddingProviders`       | `string[]` | Ідентифікатори provider вбудовувань пам’яті, якими володіє цей Plugin. |
| `mediaUnderstandingProviders`    | `string[]` | Ідентифікатори provider розуміння медіа, якими володіє цей Plugin.  |
| `imageGenerationProviders`       | `string[]` | Ідентифікатори provider генерації зображень, якими володіє цей Plugin. |
| `videoGenerationProviders`       | `string[]` | Ідентифікатори provider генерації відео, якими володіє цей Plugin.  |
| `webFetchProviders`              | `string[]` | Ідентифікатори provider web-fetch, якими володіє цей Plugin.        |
| `webSearchProviders`             | `string[]` | Ідентифікатори provider web-search, якими володіє цей Plugin.       |
| `migrationProviders`             | `string[]` | Ідентифікатори provider імпорту, якими цей Plugin володіє для `openclaw migrate`. |
| `tools`                          | `string[]` | Назви інструментів agent, якими цей Plugin володіє для бандлованих перевірок контрактів. |

`contracts.embeddedExtensionFactories` збережено для бандлованих фабрик extension лише для app-server Codex. Бандловані перетворення результатів інструментів мають оголошувати `contracts.agentToolResultMiddleware` і натомість реєструватися через `api.registerAgentToolResultMiddleware(...)`. Зовнішні plugins не можуть реєструвати middleware результатів інструментів, оскільки цей шов може переписувати високодовірений вивід інструментів до того, як його побачить модель.

Provider plugins, які реалізують `resolveExternalAuthProfiles`, мають оголошувати `contracts.externalAuthProviders`. Plugins без оголошення все ще виконуються через застарілий резервний шлях сумісності, але цей резервний шлях повільніший і буде вилучений після вікна міграції.

Бандловані providers вбудовувань пам’яті мають оголошувати `contracts.memoryEmbeddingProviders` для кожного ідентифікатора адаптера, який вони надають, включно з вбудованими адаптерами, такими як `local`. Автономні шляхи CLI використовують цей контракт маніфесту, щоб завантажити лише Plugin-власник до того, як повний runtime Gateway зареєструє providers.

## довідник mediaUnderstandingProviderMetadata

Використовуйте `mediaUnderstandingProviderMetadata`, коли provider розуміння медіа має стандартні моделі, пріоритет резервного auto-auth або нативну підтримку документів, потрібні загальним core-хелперам до завантаження runtime. Ключі також мають бути оголошені в `contracts.mediaUnderstandingProviders`.

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

| Поле                   | Тип                                 | Що це означає                                                              |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Медіаможливості, відкриті цим provider.                                    |
| `defaultModels`        | `Record<string, string>`            | Стандартні відповідності можливість-модель, що використовуються, коли конфігурація не задає модель. |
| `autoPriority`         | `Record<string, number>`            | Менші числа сортуються раніше для автоматичного резервного вибору provider на основі облікових даних. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Нативні вхідні документи, підтримувані provider.                           |

## довідник channelConfigs

Використовуйте `channelConfigs`, коли channel Plugin потребує дешевих метаданих конфігурації до завантаження runtime. Виявлення setup/status лише для читання може використовувати ці метадані напряму для налаштованих зовнішніх каналів, коли запис setup недоступний або коли `setup.requiresRuntime: false` оголошує runtime setup непотрібним.

`channelConfigs` — це метадані маніфесту Plugin, а не новий верхньорівневий розділ користувацької конфігурації. Користувачі все ще налаштовують екземпляри каналів у `channels.<channel-id>`. OpenClaw читає метадані маніфесту, щоб визначити, який Plugin володіє цим налаштованим каналом, до виконання runtime-коду Plugin.

Для channel Plugin `configSchema` і `channelConfigs` описують різні шляхи:

- `configSchema` перевіряє `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` перевіряє `channels.<channel-id>`

Непакетні plugins, які оголошують `channels[]`, також мають оголошувати відповідні записи `channelConfigs`. Без них OpenClaw усе ще може завантажити plugin, але схема конфігурації для холодного шляху, налаштування та поверхні Control UI не зможуть знати форму параметрів, що належать каналу, доки не виконається runtime plugin.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` і
`nativeSkillsAutoEnabled` можуть оголошувати статичні типові значення `auto` для перевірок конфігурації команд, які виконуються до завантаження runtime каналу. Пакетні канали також можуть публікувати ті самі типові значення через `package.json#openclaw.channel.commands` разом з іншими метаданими каталогу каналів, що належать їхньому пакету.

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

| Поле          | Тип                      | Що це означає                                                                                              |
| ------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema для `channels.<id>`. Обов’язкова для кожного оголошеного запису конфігурації каналу.          |
| `uiHints`     | `Record<string, object>` | Необов’язкові UI-мітки/заповнювачі/підказки чутливості для цього розділу конфігурації каналу.             |
| `label`       | `string`                 | Мітка каналу, що об’єднується з поверхнями вибору та inspect, коли runtime-метадані ще не готові.          |
| `description` | `string`                 | Короткий опис каналу для поверхонь inspect і каталогу.                                                     |
| `commands`    | `object`                 | Статичні авто-типові значення для нативних команд і нативних Skills для перевірок конфігурації до runtime. |
| `preferOver`  | `string[]`               | Застарілі або нижчопріоритетні ids plugins, які цей канал має випереджати на поверхнях вибору.             |

### Заміна іншого plugin каналу

Використовуйте `preferOver`, коли ваш plugin є бажаним власником для id каналу, який також може надавати інший plugin. Типові випадки: перейменований id plugin, окремий plugin, що замінює пакетний plugin, або підтримуваний fork, який зберігає той самий id каналу для сумісності конфігурації.

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

Коли налаштовано `channels.chat`, OpenClaw враховує і id каналу, і id бажаного plugin. Якщо нижчопріоритетний plugin було вибрано лише тому, що він пакетний або ввімкнений за замовчуванням, OpenClaw вимикає його в ефективній runtime-конфігурації, щоб каналом і його інструментами володів один plugin. Явний вибір користувача все одно має перевагу: якщо користувач явно вмикає обидва plugins, OpenClaw зберігає цей вибір і повідомляє діагностику дубльованих каналів/інструментів замість того, щоб мовчки змінювати запитаний набір plugins.

Обмежуйте `preferOver` ids plugins, які справді можуть надавати той самий канал. Це не загальне поле пріоритету, і воно не перейменовує ключі конфігурації користувача.

## Довідник modelSupport

Використовуйте `modelSupport`, коли OpenClaw має виводити ваш provider plugin зі скорочених ids моделей, як-от `gpt-5.5` або `claude-sonnet-4.6`, до завантаження runtime plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw застосовує такий пріоритет:

- явні refs `provider/model` використовують метадані маніфесту `providers` власника
- `modelPatterns` мають перевагу над `modelPrefixes`
- якщо збігаються один непакетний plugin і один пакетний plugin, перемагає непакетний plugin
- решта неоднозначностей ігнорується, доки користувач або конфігурація не вкаже провайдера

Поля:

| Поле            | Тип        | Що це означає                                                                                  |
| --------------- | ---------- | ---------------------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Префікси, що зіставляються через `startsWith` зі скороченими ids моделей.                      |
| `modelPatterns` | `string[]` | Джерела regex, що зіставляються зі скороченими ids моделей після видалення суфікса профілю.    |

## Довідник modelCatalog

Використовуйте `modelCatalog`, коли OpenClaw має знати метадані моделей провайдера до завантаження runtime plugin. Це джерело, що належить маніфесту, для фіксованих рядків каталогу, псевдонімів провайдерів, правил пригнічення та режиму discovery. Runtime-оновлення й надалі належить коду runtime провайдера, але маніфест повідомляє core, коли потрібен runtime.

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

| Поле          | Тип                                                      | Що це означає                                                                                                      |
| ------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `providers`   | `Record<string, object>`                                 | Рядки каталогу для ids провайдерів, що належать цьому plugin. Ключі також мають бути в `providers` верхнього рівня. |
| `aliases`     | `Record<string, object>`                                 | Псевдоніми провайдерів, які мають розв’язуватися до власного провайдера для планування каталогу або пригнічення.     |
| `suppressions` | `object[]`                                              | Рядки моделей з іншого джерела, які цей plugin пригнічує з причини, специфічної для провайдера.                    |
| `discovery`   | `Record<string, "static" \| "refreshable" \| "runtime">` | Чи можна прочитати каталог провайдера з метаданих маніфесту, оновити в кеш або чи потрібен runtime.                |

`aliases` бере участь у пошуку власника провайдера для планування model-catalog. Цілі псевдонімів мають бути провайдерами верхнього рівня, що належать тому самому plugin. Коли список, відфільтрований за провайдером, використовує псевдонім, OpenClaw може прочитати маніфест власника та застосувати API/base URL overrides псевдоніма без завантаження runtime провайдера.

`suppressions` замінює старий runtime hook провайдера `suppressBuiltInModel`. Записи пригнічення враховуються лише тоді, коли провайдер належить plugin або оголошений як ключ `modelCatalog.aliases`, що вказує на власного провайдера. Runtime hooks пригнічення більше не викликаються під час розв’язання моделей.

Поля провайдера:

| Поле     | Тип                      | Що це означає                                                                    |
| -------- | ------------------------ | -------------------------------------------------------------------------------- |
| `baseUrl` | `string`                | Необов’язковий типовий базовий URL для моделей у цьому каталозі провайдера.      |
| `api`    | `ModelApi`               | Необов’язковий типовий API-адаптер для моделей у цьому каталозі провайдера.      |
| `headers` | `Record<string, string>` | Необов’язкові статичні заголовки, що застосовуються до цього каталогу провайдера. |
| `models` | `object[]`               | Обов’язкові рядки моделей. Рядки без `id` ігноруються.                           |

Поля моделі:

| Поле           | Тип                                                            | Що це означає                                                                 |
| -------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `id`           | `string`                                                       | Локальний для провайдера id моделі, без префікса `provider/`.                 |
| `name`         | `string`                                                       | Необов’язкове відображуване ім’я.                                             |
| `api`          | `ModelApi`                                                     | Необов’язковий override API для окремої моделі.                               |
| `baseUrl`      | `string`                                                       | Необов’язковий override базового URL для окремої моделі.                      |
| `headers`      | `Record<string, string>`                                       | Необов’язкові статичні заголовки для окремої моделі.                          |
| `input`        | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Модальності, які приймає модель.                                              |
| `reasoning`    | `boolean`                                                      | Чи надає модель поведінку reasoning.                                          |
| `contextWindow` | `number`                                                      | Нативне вікно контексту провайдера.                                           |
| `contextTokens` | `number`                                                      | Необов’язкове ефективне runtime-обмеження контексту, якщо відрізняється від `contextWindow`. |
| `maxTokens`    | `number`                                                       | Максимальна кількість output tokens, якщо відома.                             |
| `cost`         | `object`                                                       | Необов’язкова ціна в USD за мільйон tokens, включно з необов’язковим `tieredPricing`. |
| `compat`       | `object`                                                       | Необов’язкові прапорці сумісності, що відповідають сумісності конфігурації моделей OpenClaw. |
| `status`       | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Статус у списку. Пригнічуйте лише тоді, коли рядок взагалі не має з’являтися. |
| `statusReason` | `string`                                                       | Необов’язкова причина, показана зі статусом, відмінним від available.         |
| `replaces`     | `string[]`                                                     | Старі локальні для провайдера ids моделей, які ця модель замінює.             |
| `replacedBy`   | `string`                                                       | Локальний для провайдера id моделі-заміни для застарілих рядків.              |
| `tags`         | `string[]`                                                     | Стабільні теги, які використовують засоби вибору та фільтри.                  |

Поля пригнічення:

| Поле                       | Тип        | Що це означає                                                                                              |
| -------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | ID провайдера для рядка upstream, який потрібно приховати. Має належати цьому plugin або бути оголошеним як власний псевдонім. |
| `model`                    | `string`   | Локальний для провайдера ID моделі, яку потрібно приховати.                                                |
| `reason`                   | `string`   | Необов’язкове повідомлення, яке показується, коли прихований рядок запитують напряму.                      |
| `when.baseUrlHosts`        | `string[]` | Необов’язковий список ефективних хостів базових URL провайдера, потрібних перед застосуванням приховування. |
| `when.providerConfigApiIn` | `string[]` | Необов’язковий список точних значень `api` конфігурації провайдера, потрібних перед застосуванням приховування. |

Не додавайте дані, потрібні лише під час виконання, у `modelCatalog`. Використовуйте `static` лише тоді, коли рядки маніфесту
достатньо повні, щоб поверхні списків, відфільтрованих за провайдером, і вибору могли пропускати
виявлення через реєстр/середовище виконання. Використовуйте `refreshable`, коли рядки маніфесту корисні як
початкові або додаткові елементи списку, але оновлення/кеш може додати більше рядків пізніше;
рядки refreshable самі по собі не є авторитетними. Використовуйте `runtime`, коли OpenClaw
має завантажити середовище виконання провайдера, щоб дізнатися список.

## Довідка `modelIdNormalization`

Використовуйте `modelIdNormalization` для дешевого очищення ID моделей, що належить провайдеру й має
відбутися до завантаження середовища виконання провайдера. Це зберігає псевдоніми, як-от короткі назви
моделей, локальні для провайдера застарілі ID і правила префіксів проксі в маніфесті
відповідного plugin, а не в таблицях вибору моделей у core.

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

| Поле                                 | Тип                     | Що це означає                                                                                 |
| ------------------------------------ | ----------------------- | --------------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Точні псевдоніми ID моделей без урахування регістру. Значення повертаються як записано.       |
| `stripPrefixes`                      | `string[]`              | Префікси, які потрібно вилучити перед пошуком псевдоніма, корисно для застарілого дублювання провайдер/модель. |
| `prefixWhenBare`                     | `string`                | Префікс, який потрібно додати, коли нормалізований ID моделі ще не містить `/`.               |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Умовні правила префікса для голого ID після пошуку псевдоніма, задані через `modelPrefix` і `prefix`. |

## Довідка `providerEndpoints`

Використовуйте `providerEndpoints` для класифікації endpoint, яку загальна політика запитів
має знати до завантаження середовища виконання провайдера. Core і далі володіє значенням кожного
`endpointClass`; маніфести plugin володіють метаданими хоста й базового URL.

Поля endpoint:

| Поле                           | Тип        | Що це означає                                                                                   |
| ------------------------------ | ---------- | ----------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Відомий core клас endpoint, як-от `openrouter`, `moonshot-native` або `google-vertex`.          |
| `hosts`                        | `string[]` | Точні імена хостів, що відповідають класу endpoint.                                             |
| `hostSuffixes`                 | `string[]` | Суфікси хостів, що відповідають класу endpoint. Додавайте префікс `.` для збігу лише суфікса домену. |
| `baseUrls`                     | `string[]` | Точні нормалізовані базові URL HTTP(S), що відповідають класу endpoint.                         |
| `googleVertexRegion`           | `string`   | Статичний регіон Google Vertex для точних глобальних хостів.                                    |
| `googleVertexRegionHostSuffix` | `string`   | Суфікс, який потрібно вилучити з відповідних хостів, щоб відкрити префікс регіону Google Vertex. |

## Довідка `providerRequest`

Використовуйте `providerRequest` для дешевих метаданих сумісності запитів, потрібних загальній
політиці запитів без завантаження середовища виконання провайдера. Пов’язане з поведінкою
переписування payload тримайте в runtime hooks провайдера або спільних helper для сімейства провайдерів.

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

| Поле                  | Тип          | Що це означає                                                                                 |
| --------------------- | ------------ | --------------------------------------------------------------------------------------------- |
| `family`              | `string`     | Мітка сімейства провайдера, яку використовують загальні рішення сумісності запитів і діагностика. |
| `compatibilityFamily` | `"moonshot"` | Необов’язковий контейнер сумісності сімейства провайдера для спільних helper запитів.          |
| `openAICompletions`   | `object`     | Прапорці запитів completions, сумісних з OpenAI, наразі `supportsStreamingUsage`.              |

## Довідка `modelPricing`

Використовуйте `modelPricing`, коли провайдеру потрібна поведінка ціноутворення control plane до
завантаження runtime. Кеш цін Gateway читає ці метадані без імпорту
runtime-коду провайдера.

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

| Поле         | Тип               | Що це означає                                                                                     |
| ------------ | ----------------- | ------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Установіть `false` для локальних/self-hosted провайдерів, які ніколи не мають отримувати ціни OpenRouter або LiteLLM. |
| `openRouter` | `false \| object` | Зіставлення для пошуку цін OpenRouter. `false` вимикає пошук OpenRouter для цього провайдера.     |
| `liteLLM`    | `false \| object` | Зіставлення для пошуку цін LiteLLM. `false` вимикає пошук LiteLLM для цього провайдера.           |

Поля джерела:

| Поле                       | Тип                | Що це означає                                                                                                      |
| -------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `provider`                 | `string`           | ID провайдера в зовнішньому каталозі, коли він відрізняється від ID провайдера OpenClaw, наприклад `z-ai` для провайдера `zai`. |
| `passthroughProviderModel` | `boolean`          | Обробляти ID моделей зі скісною рискою як вкладені посилання провайдер/модель, корисно для проксі-провайдерів, як-от OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Додаткові варіанти ID моделей зовнішнього каталогу. `version-dots` пробує ID версій із крапками, як-от `claude-opus-4.6`. |

### Індекс провайдерів OpenClaw

Індекс провайдерів OpenClaw — це preview-метадані, що належать OpenClaw, для провайдерів,
чиї plugins можуть ще не бути встановлені. Він не є частиною маніфесту plugin.
Маніфести plugin лишаються авторитетним джерелом для встановлених plugins. Індекс провайдерів є
внутрішнім fallback-контрактом, який майбутні поверхні встановлюваних провайдерів і вибору моделей
до встановлення використовуватимуть, коли provider plugin не встановлено.

Порядок авторитетності каталогу:

1. Конфігурація користувача.
2. `modelCatalog` маніфесту встановленого plugin.
3. Кеш каталогу моделей з явного оновлення.
4. Preview-рядки Індексу провайдерів OpenClaw.

Індекс провайдерів не має містити секрети, стан увімкнення, runtime hooks або
живі дані моделей, специфічні для облікового запису. Його preview-каталоги використовують таку саму
форму рядка провайдера `modelCatalog`, як і маніфести plugin, але мають обмежуватися
стабільними display-метаданими, якщо runtime adapter поля, як-от `api`,
`baseUrl`, ціни або прапорці сумісності, не підтримуються навмисно узгодженими з
маніфестом встановленого plugin. Провайдери з live-виявленням `/models` мають
записувати оновлені рядки через явний шлях кешу каталогу моделей, а не
змушувати звичайний listing або onboarding викликати API провайдера.

Записи Індексу провайдерів також можуть містити метадані встановлюваного plugin для провайдерів,
чиї plugin було винесено з core або які інакше ще не встановлені. Ці
метадані повторюють шаблон каталогу каналів: назви пакета, npm install spec,
очікуваної цілісності й дешевих міток вибору автентифікації достатньо, щоб показати
опцію встановлюваного налаштування. Після встановлення plugin його маніфест перемагає, і
запис Індексу провайдерів ігнорується для цього провайдера.

Застарілі capability-ключі верхнього рівня оголошені deprecated. Використовуйте `openclaw doctor --fix`, щоб
перемістити `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` і `webSearchProviders` під `contracts`; звичайне
завантаження маніфестів більше не розглядає ці поля верхнього рівня як
володіння capability.

## Маніфест проти package.json

Ці два файли виконують різні завдання:

| Файл                   | Для чого використовувати                                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.plugin.json` | Виявлення, перевірка конфігурації, метадані вибору автентифікації та підказки UI, які мають існувати до запуску коду plugin   |
| `package.json`         | Метадані npm, встановлення залежностей і блок `openclaw`, який використовується для entrypoints, install gating, setup або метаданих каталогу |

Якщо ви не впевнені, де має бути певний фрагмент метаданих, скористайтеся цим правилом:

- якщо OpenClaw має знати це до завантаження коду plugin, додайте це в `openclaw.plugin.json`
- якщо це стосується пакування, entry files або поведінки npm install, додайте це в `package.json`

### Поля package.json, які впливають на виявлення

Деякі pre-runtime метадані plugin навмисно містяться в `package.json` у блоці
`openclaw`, а не в `openclaw.plugin.json`.

Важливі приклади:

| Поле                                                              | Що це означає                                                                                                                                                                          |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Оголошує нативні точки входу Plugin. Має залишатися всередині каталогу пакета Plugin.                                                                                                  |
| `openclaw.runtimeExtensions`                                      | Оголошує зібрані точки входу JavaScript runtime для встановлених пакетів. Має залишатися всередині каталогу пакета Plugin.                                                            |
| `openclaw.setupEntry`                                             | Легка точка входу лише для налаштування, що використовується під час onboarding, відкладеного запуску каналу та виявлення статусу каналу/SecretRef лише для читання. Має залишатися всередині каталогу пакета Plugin. |
| `openclaw.runtimeSetupEntry`                                      | Оголошує зібрану точку входу JavaScript для налаштування встановлених пакетів. Має залишатися всередині каталогу пакета Plugin.                                                       |
| `openclaw.channel`                                                | Дешева метадані каталогу каналів, як-от мітки, шляхи документації, псевдоніми та текст вибору.                                                                                        |
| `openclaw.channel.commands`                                       | Статичні метадані нативних команд і автоматичних типових нативних skill, що використовуються конфігурацією, аудитом і поверхнями списку команд до завантаження runtime каналу.        |
| `openclaw.channel.configuredState`                                | Легкі метадані перевірки налаштованого стану, які можуть відповісти на запитання "чи вже існує налаштування лише через env?" без завантаження повного runtime каналу.                 |
| `openclaw.channel.persistedAuthState`                             | Легкі метадані перевірки збереженого стану автентифікації, які можуть відповісти на запитання "чи вже хтось увійшов?" без завантаження повного runtime каналу.                       |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Підказки щодо встановлення/оновлення для вбудованих і зовнішньо опублікованих Plugin.                                                                                                |
| `openclaw.install.defaultChoice`                                  | Бажаний шлях встановлення, коли доступно кілька джерел встановлення.                                                                                                                   |
| `openclaw.install.minHostVersion`                                 | Мінімальна підтримувана версія хоста OpenClaw, із використанням нижньої межі semver на кшталт `>=2026.3.22`.                                                                          |
| `openclaw.install.expectedIntegrity`                              | Очікуваний рядок цілісності npm dist, наприклад `sha512-...`; потоки встановлення й оновлення перевіряють отриманий артефакт за ним.                                                  |
| `openclaw.install.allowInvalidConfigRecovery`                     | Дозволяє вузький шлях відновлення перевстановлення вбудованого Plugin, коли конфігурація недійсна.                                                                                    |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Дає змогу поверхням каналів лише для налаштування завантажуватися до повного Plugin каналу під час запуску.                                                                            |

Метадані маніфесту визначають, які варіанти провайдера/каналу/налаштування з’являються в
onboarding до завантаження runtime. `package.json#openclaw.install` повідомляє
onboarding, як отримати або ввімкнути цей Plugin, коли користувач вибирає один із цих
варіантів. Не переміщуйте підказки встановлення в `openclaw.plugin.json`.

`openclaw.install.minHostVersion` застосовується під час встановлення та завантаження
реєстру маніфестів. Недійсні значення відхиляються; новіші, але дійсні значення пропускають
Plugin на старіших хостах.

Точне закріплення версії npm уже міститься в `npmSpec`, наприклад
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Офіційні записи зовнішнього каталогу
мають поєднувати точні специфікації з `expectedIntegrity`, щоб потоки оновлення завершувалися
закрито, якщо отриманий npm-артефакт більше не відповідає закріпленому релізу.
Інтерактивний onboarding усе ще пропонує довірені npm-специфікації реєстру, включно з голими
назвами пакетів і dist-tags, для сумісності. Діагностика каталогу може розрізняти
точні, плаваючі, закріплені за цілісністю, без цілісності, із невідповідністю назви пакета
та недійсні джерела типового вибору. Вона також попереджає, коли
`expectedIntegrity` присутній, але немає дійсного npm-джерела, яке воно може закріпити.
Коли `expectedIntegrity` присутній,
потоки встановлення/оновлення застосовують його; коли його пропущено, розв’язання реєстру
записується без закріплення цілісності.

Канальні Plugin мають надавати `openclaw.setupEntry`, коли статус, список каналів
або сканування SecretRef мають ідентифікувати налаштовані облікові записи без завантаження повного
runtime. Точка входу налаштування має надавати метадані каналу разом із безпечними для налаштування адаптерами
конфігурації, статусу та секретів; тримайте мережеві клієнти, Gateway-слухачі та
транспортні runtime в основній точці входу розширення.

Поля точок входу runtime не перевизначають перевірки меж пакета для полів вихідних
точок входу. Наприклад, `openclaw.runtimeExtensions` не може зробити
шлях `openclaw.extensions`, що виходить назовні, завантажуваним.

`openclaw.install.allowInvalidConfigRecovery` навмисно вузьке. Воно не робить
довільно пошкоджені конфігурації встановлюваними. Наразі воно дозволяє потокам встановлення
відновлюватися лише після конкретних застарілих збоїв оновлення вбудованого Plugin, як-от
відсутній шлях вбудованого Plugin або застарілий запис `channels.<id>` для того самого
вбудованого Plugin. Непов’язані помилки конфігурації й надалі блокують встановлення та спрямовують операторів
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

Використовуйте це, коли потоки налаштування, doctor, статусу або присутності лише для читання потребують дешевого
пробного yes/no запиту автентифікації до завантаження повного Plugin каналу. Збережений стан автентифікації не є
налаштованим станом каналу: не використовуйте ці метадані, щоб автоматично вмикати Plugin,
відновлювати runtime-залежності або вирішувати, чи має завантажуватися runtime каналу.
Цільовий експорт має бути невеликою функцією, яка читає лише збережений стан; не
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

Використовуйте це, коли канал може відповісти про налаштований стан з env або інших крихітних
не-runtime вхідних даних. Якщо перевірка потребує повного розв’язання конфігурації або справжнього
runtime каналу, залиште цю логіку в хуку Plugin `config.hasConfiguredState`.

## Пріоритет виявлення (дублікати ідентифікаторів Plugin)

OpenClaw виявляє Plugin з кількох коренів (вбудовані, глобальне встановлення, workspace, явні шляхи, вибрані конфігурацією). Якщо два виявлення мають той самий `id`, зберігається лише маніфест із **найвищим пріоритетом**; дублікати нижчого пріоритету відкидаються замість завантаження поруч із ним.

Пріоритет, від найвищого до найнижчого:

1. **Вибраний конфігурацією** — шлях, явно закріплений у `plugins.entries.<id>`
2. **Вбудований** — Plugin, що постачаються з OpenClaw
3. **Глобальне встановлення** — Plugin, встановлені в глобальний корінь Plugin OpenClaw
4. **Workspace** — Plugin, виявлені відносно поточного workspace

Наслідки:

- Форкована або застаріла копія вбудованого Plugin у workspace не затінить вбудовану збірку.
- Щоб фактично перевизначити вбудований Plugin локальним, закріпіть його через `plugins.entries.<id>`, щоб він переміг за пріоритетом, а не покладайтеся на виявлення workspace.
- Відкидання дублікатів журналюються, щоб Doctor і діагностика запуску могли вказати на відкинуту копію.

## Вимоги JSON Schema

- **Кожен Plugin має постачатися з JSON Schema**, навіть якщо він не приймає конфігурацію.
- Порожня схема прийнятна (наприклад, `{ "type": "object", "additionalProperties": false }`).
- Схеми перевіряються під час читання/запису конфігурації, а не під час runtime.

## Поведінка валідації

- Невідомі ключі `channels.*` є **помилками**, якщо ідентифікатор каналу не оголошений
  маніфестом Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` і `plugins.slots.*`
  мають посилатися на **доступні для виявлення** ідентифікатори Plugin. Невідомі ідентифікатори є **помилками**.
- Якщо Plugin встановлений, але має пошкоджений або відсутній маніфест чи схему,
  валідація завершується невдачею, а Doctor повідомляє про помилку Plugin.
- Якщо конфігурація Plugin існує, але Plugin **вимкнено**, конфігурація зберігається, а
  **попередження** показується в Doctor + журналах.

Див. [Довідник конфігурації](/uk/gateway/configuration) для повної схеми `plugins.*`.

## Нотатки

- Маніфест **обов’язковий для нативних Plugin OpenClaw**, включно із завантаженнями з локальної файлової системи. Runtime усе ще завантажує модуль Plugin окремо; маніфест потрібен лише для виявлення + валідації.
- Нативні маніфести розбираються як JSON5, тому коментарі, кінцеві коми й ключі без лапок приймаються, якщо фінальне значення все ще є об’єктом.
- Завантажувач маніфестів читає лише задокументовані поля маніфесту. Уникайте користувацьких ключів верхнього рівня.
- `channels`, `providers`, `cliBackends` і `skills` можна всі пропустити, коли Plugin вони не потрібні.
- `providerDiscoveryEntry` має залишатися легким і не повинен імпортувати широкий runtime-код; використовуйте його для статичних метаданих каталогу провайдерів або вузьких дескрипторів виявлення, а не для виконання під час запиту.
- Ексклюзивні типи Plugin вибираються через `plugins.slots.*`: `kind: "memory"` через `plugins.slots.memory`, `kind: "context-engine"` через `plugins.slots.contextEngine` (типово `legacy`).
- Оголошуйте ексклюзивний тип Plugin у цьому маніфесті. Runtime-запис `OpenClawPluginDefinition.kind` застарів і лишається тільки як резерв сумісності для старіших Plugin.
- Метадані env-var (`setup.providers[].envVars`, застарілі `providerAuthEnvVars` і `channelEnvVars`) лише декларативні. Статус, аудит, валідація доставки Cron та інші поверхні лише для читання все ще застосовують довіру до Plugin і чинну політику активації, перш ніж вважати env var налаштованою.
- Для метаданих runtime-майстра, що потребують коду провайдера, див. [runtime-хуки провайдера](/uk/plugins/architecture-internals#provider-runtime-hooks).
- Якщо ваш Plugin залежить від нативних модулів, задокументуйте кроки збірки та будь-які вимоги allowlist менеджера пакетів (наприклад, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

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
