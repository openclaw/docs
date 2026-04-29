---
read_when:
    - Ви створюєте Plugin для OpenClaw
    - Вам потрібно випустити схему конфігурації Plugin або налагодити помилки валідації Plugin
summary: Маніфест Plugin + вимоги до схеми JSON (сувора перевірка конфігурації)
title: Маніфест Plugin
x-i18n:
    generated_at: "2026-04-29T08:49:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2a529f9d4388039d76a6e351b454622b657a1ddcd4f4159f10be988568343cc2
    source_path: plugins/manifest.md
    workflow: 16
---

Ця сторінка стосується лише **нативного маніфесту Plugin OpenClaw**.

Сумісні макети пакетів див. у [пакетах Plugin](/uk/plugins/bundles).

Сумісні формати пакетів використовують інші файли маніфестів:

- Пакет Codex: `.codex-plugin/plugin.json`
- Пакет Claude: `.claude-plugin/plugin.json` або типовий макет компонентів Claude
  без маніфесту
- Пакет Cursor: `.cursor-plugin/plugin.json`

OpenClaw також автоматично виявляє ці макети пакетів, але вони не перевіряються
за схемою `openclaw.plugin.json`, описаною тут.

Для сумісних пакетів OpenClaw зараз читає метадані пакета, а також оголошені
корені skill, корені команд Claude, типові значення Claude-пакета `settings.json`,
типові значення LSP Claude-пакета й підтримувані набори хуків, коли макет відповідає
очікуванням середовища виконання OpenClaw.

Кожен нативний Plugin OpenClaw **має** постачатися з файлом `openclaw.plugin.json` у
**корені Plugin**. OpenClaw використовує цей маніфест для перевірки конфігурації
**без виконання коду Plugin**. Відсутні або недійсні маніфести вважаються
помилками Plugin і блокують перевірку конфігурації.

Повний посібник із системи Plugin див.: [Plugins](/uk/tools/plugin).
Про нативну модель можливостей і поточні рекомендації щодо зовнішньої сумісності:
[Модель можливостей](/uk/plugins/architecture#public-capability-model).

## Що робить цей файл

`openclaw.plugin.json` — це метадані, які OpenClaw читає **перед завантаженням вашого
коду Plugin**. Усе нижче має бути достатньо дешевим для перевірки без запуску
середовища виконання Plugin.

**Використовуйте його для:**

- ідентичності Plugin, перевірки конфігурації та підказок UI конфігурації
- метаданих автентифікації, онбордингу й налаштування (псевдонім, автоматичне ввімкнення, змінні середовища провайдера, варіанти автентифікації)
- підказок активації для поверхонь площини керування
- скороченого володіння сімейством моделей
- статичних знімків володіння можливостями (`contracts`)
- метаданих QA-запускача, які може перевіряти спільний хост `openclaw qa`
- метаданих конфігурації для окремих каналів, об’єднаних у поверхні каталогу та перевірки

**Не використовуйте його для:** реєстрації поведінки середовища виконання, оголошення точок входу коду
або метаданих установлення npm. Вони належать до вашого коду Plugin і `package.json`.

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

| Поле                                | Обов’язкове | Тип                              | Що це означає                                                                                                                                                                                                                         |
| ------------------------------------ | ----------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Так         | `string`                         | Канонічний ідентифікатор Plugin. Це ідентифікатор, який використовується в `plugins.entries.<id>`.                                                                                                                                     |
| `configSchema`                       | Так         | `object`                         | Вбудована JSON Schema для конфігурації цього Plugin.                                                                                                                                                                                   |
| `enabledByDefault`                   | Ні          | `true`                           | Позначає bundled Plugin як увімкнений за замовчуванням. Опустіть це поле або задайте будь-яке значення, відмінне від `true`, щоб залишити Plugin вимкненим за замовчуванням.                                                           |
| `legacyPluginIds`                    | Ні          | `string[]`                       | Застарілі ідентифікатори, які нормалізуються до цього канонічного ідентифікатора Plugin.                                                                                                                                              |
| `autoEnableWhenConfiguredProviders`  | Ні          | `string[]`                       | Ідентифікатори провайдерів, які мають автоматично вмикати цей Plugin, коли auth, конфігурація або посилання на моделі згадують їх.                                                                                                    |
| `kind`                               | Ні          | `"memory"` \| `"context-engine"` | Оголошує ексклюзивний вид Plugin, який використовується `plugins.slots.*`.                                                                                                                                                             |
| `channels`                           | Ні          | `string[]`                       | Ідентифікатори каналів, якими володіє цей Plugin. Використовується для виявлення та перевірки конфігурації.                                                                                                                           |
| `providers`                          | Ні          | `string[]`                       | Ідентифікатори провайдерів, якими володіє цей Plugin.                                                                                                                                                                                  |
| `providerDiscoveryEntry`             | Ні          | `string`                         | Шлях до легкого модуля виявлення провайдера, відносний до кореня Plugin, для метаданих каталогу провайдерів у межах маніфесту, які можна завантажити без активації повного runtime Plugin.                                            |
| `modelSupport`                       | Ні          | `object`                         | Скорочені метадані сімейств моделей, якими володіє маніфест, що використовуються для автоматичного завантаження Plugin перед runtime.                                                                                                  |
| `modelCatalog`                       | Ні          | `object`                         | Декларативні метадані каталогу моделей для провайдерів, якими володіє цей Plugin. Це контракт площини керування для майбутнього readonly-списку, onboarding, вибору моделей, псевдонімів і придушення без завантаження runtime Plugin. |
| `modelPricing`                       | Ні          | `object`                         | Політика зовнішнього пошуку цін, якою володіє провайдер. Використовуйте її, щоб виключити локальні/self-hosted провайдери з віддалених каталогів цін або зіставити посилання провайдерів з ідентифікаторами каталогів OpenRouter/LiteLLM без жорсткого кодування ідентифікаторів провайдерів у core. |
| `modelIdNormalization`               | Ні          | `object`                         | Очищення псевдонімів/префіксів ідентифікаторів моделей, яким володіє провайдер і яке має виконуватися до завантаження runtime провайдера.                                                                                             |
| `providerEndpoints`                  | Ні          | `object[]`                       | Метадані хоста/baseUrl endpoint, якими володіє маніфест, для маршрутів провайдера, які core має класифікувати до завантаження runtime провайдера.                                                                                      |
| `providerRequest`                    | Ні          | `object`                         | Дешеві метадані сімейства провайдерів і сумісності запитів, які використовуються загальною політикою запитів до завантаження runtime провайдера.                                                                                      |
| `cliBackends`                        | Ні          | `string[]`                       | Ідентифікатори backend CLI inference, якими володіє цей Plugin. Використовується для автоматичної активації під час запуску з явних посилань конфігурації.                                                                             |
| `syntheticAuthRefs`                  | Ні          | `string[]`                       | Посилання на провайдерів або backend CLI, synthetic auth hook яких належить Plugin і має перевірятися під час cold model discovery до завантаження runtime.                                                                             |
| `nonSecretAuthMarkers`               | Ні          | `string[]`                       | Значення placeholder API key, якими володіє bundled Plugin і які представляють несекретний локальний, OAuth або ambient credential state.                                                                                              |
| `commandAliases`                     | Ні          | `object[]`                       | Назви команд, якими володіє цей Plugin і які мають створювати config та CLI diagnostics з урахуванням Plugin до завантаження runtime.                                                                                                  |
| `providerAuthEnvVars`                | Ні          | `Record<string, string[]>`       | Застарілі метадані сумісності env для пошуку auth/status провайдера. Для нових Plugin надавайте перевагу `setup.providers[].envVars`; OpenClaw усе ще читає це під час періоду виведення з ужитку.                                    |
| `providerAuthAliases`                | Ні          | `Record<string, string>`         | Ідентифікатори провайдерів, які мають повторно використовувати інший ідентифікатор провайдера для пошуку auth, наприклад coding-провайдер, що спільно використовує API key і auth profiles базового провайдера.                       |
| `channelEnvVars`                     | Ні          | `Record<string, string[]>`       | Дешеві env-метадані каналу, які OpenClaw може перевіряти без завантаження коду Plugin. Використовуйте це для керованого env налаштування каналів або auth surfaces, які мають бачити загальні помічники startup/config.                 |
| `providerAuthChoices`                | Ні          | `object[]`                       | Дешеві метадані auth choice для onboarding pickers, preferred-provider resolution і простого підключення CLI flags.                                                                                                                   |
| `activation`                         | Ні          | `object`                         | Дешеві метадані activation planner для startup, provider, command, channel, route і завантаження, спричиненого capability. Лише метадані; runtime Plugin усе ще володіє фактичною поведінкою.                                        |
| `setup`                              | Ні          | `object`                         | Дешеві дескриптори setup/onboarding, які поверхні discovery і setup можуть перевіряти без завантаження runtime Plugin.                                                                                                                |
| `qaRunners`                          | Ні          | `object[]`                       | Дешеві дескриптори QA runner, які використовує спільний хост `openclaw qa` до завантаження runtime Plugin.                                                                                                                           |
| `contracts`                          | Ні          | `object`                         | Статичний знімок bundled capability для external auth hooks, speech, realtime transcription, realtime voice, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search і володіння інструментами. |
| `mediaUnderstandingProviderMetadata` | Ні          | `Record<string, object>`         | Дешеві стандартні значення media-understanding для ідентифікаторів провайдерів, оголошених у `contracts.mediaUnderstandingProviders`.                                                                                                  |
| `channelConfigs`                     | Ні          | `Record<string, object>`         | Метадані конфігурації каналів, якими володіє маніфест і які об’єднуються з поверхнями discovery та validation до завантаження runtime.                                                                                                 |
| `skills`                             | Ні          | `string[]`                       | Каталоги Skills для завантаження, відносно кореня Plugin.                                                                                                                                                                             |
| `name`                               | Ні          | `string`                         | Зрозуміла людині назва Plugin.                                                                                                                                                                                                        |
| `description`                        | Ні          | `string`                         | Короткий підсумок, що відображається на поверхнях Plugin.                                                                                                                                                                             |
| `version`                            | Ні          | `string`                         | Інформаційна версія Plugin.                                                                                                                                                                                                           |
| `uiHints`                            | Ні          | `Record<string, object>`         | UI-мітки, placeholders і підказки щодо чутливості для полів конфігурації.                                                                                                                                                            |

## Довідка `providerAuthChoices`

Кожен запис `providerAuthChoices` описує один вибір onboarding або auth.
OpenClaw читає це до завантаження runtime провайдера.
Списки setup провайдера використовують ці варіанти з маніфесту, варіанти setup,
отримані з дескрипторів, і метадані install catalog без завантаження runtime провайдера.

| Поле                  | Обов’язкове | Тип                                             | Що це означає                                                                                                                                                         |
| --------------------- | ----------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`            | Так         | `string`                                        | Ідентифікатор провайдера, до якого належить цей вибір.                                                                                                                |
| `method`              | Так         | `string`                                        | Ідентифікатор методу автентифікації, до якого потрібно виконати dispatch.                                                                                             |
| `choiceId`            | Так         | `string`                                        | Стабільний ідентифікатор вибору автентифікації, який використовується у потоках онбордингу та CLI.                                                                    |
| `choiceLabel`         | Ні          | `string`                                        | Мітка для користувача. Якщо її пропущено, OpenClaw використовує `choiceId` як запасний варіант.                                                                       |
| `choiceHint`          | Ні          | `string`                                        | Короткий допоміжний текст для засобу вибору.                                                                                                                          |
| `assistantPriority`   | Ні          | `number`                                        | Нижчі значення сортуються раніше в інтерактивних засобах вибору, керованих асистентом.                                                                                |
| `assistantVisibility` | Ні          | `"visible"` \| `"manual-only"`                  | Приховує вибір із засобів вибору асистента, водночас дозволяючи ручний вибір у CLI.                                                                                   |
| `deprecatedChoiceIds` | Ні          | `string[]`                                      | Застарілі ідентифікатори вибору, які мають перенаправляти користувачів до цього вибору-заміни.                                                                       |
| `groupId`             | Ні          | `string`                                        | Необов’язковий ідентифікатор групи для групування пов’язаних варіантів вибору.                                                                                        |
| `groupLabel`          | Ні          | `string`                                        | Мітка для користувача для цієї групи.                                                                                                                                 |
| `groupHint`           | Ні          | `string`                                        | Короткий допоміжний текст для групи.                                                                                                                                  |
| `optionKey`           | Ні          | `string`                                        | Внутрішній ключ параметра для простих потоків автентифікації з одним прапорцем.                                                                                       |
| `cliFlag`             | Ні          | `string`                                        | Назва прапорця CLI, наприклад `--openrouter-api-key`.                                                                                                                 |
| `cliOption`           | Ні          | `string`                                        | Повна форма параметра CLI, наприклад `--openrouter-api-key <key>`.                                                                                                    |
| `cliDescription`      | Ні          | `string`                                        | Опис, що використовується в довідці CLI.                                                                                                                              |
| `onboardingScopes`    | Ні          | `Array<"text-inference" \| "image-generation">` | Поверхні онбордингу, у яких має з’являтися цей вибір. Якщо пропущено, типовим значенням є `["text-inference"]`.                                                       |

## Довідник commandAliases

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

| Поле         | Обов’язкове | Тип               | Що це означає                                                                    |
| ------------ | ----------- | ----------------- | -------------------------------------------------------------------------------- |
| `name`       | Так         | `string`          | Назва команди, що належить цьому Plugin.                                         |
| `kind`       | Ні          | `"runtime-slash"` | Позначає псевдонім як слеш-команду чату, а не як кореневу команду CLI.           |
| `cliCommand` | Ні          | `string`          | Пов’язана коренева команда CLI, яку слід запропонувати для операцій CLI, якщо така існує. |

## Довідник activation

Використовуйте `activation`, коли Plugin може дешево оголосити, які події площини керування
мають включати його до плану активації/завантаження.

Цей блок є метаданими планувальника, а не lifecycle API. Він не реєструє
runtime-поведінку, не замінює `register(...)` і не гарантує, що
код Plugin уже виконано. Планувальник активації використовує ці поля, щоб
звузити кандидатні Plugins перед поверненням до наявних метаданих володіння
маніфесту, як-от `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` і хуків.

Надавайте перевагу найвужчим метаданим, які вже описують володіння. Використовуйте
`providers`, `channels`, `commandAliases`, дескриптори setup або `contracts`,
коли ці поля виражають зв’язок. Використовуйте `activation` для додаткових підказок
планувальнику, які неможливо представити цими полями володіння.
Використовуйте верхньорівневий `cliBackends` для runtime-псевдонімів CLI, таких як `claude-cli`,
`codex-cli` або `google-gemini-cli`; `activation.onAgentHarnesses` призначений лише для
вбудованих ідентифікаторів agent harness, які ще не мають поля володіння.

Цей блок є лише метаданими. Він не реєструє runtime-поведінку і не
замінює `register(...)`, `setupEntry` або інші runtime/Plugin точки входу.
Поточні споживачі використовують його як підказку для звуження перед ширшим завантаженням Plugins, тому
відсутність метаданих активації зазвичай коштує лише продуктивності; вона не має
змінювати коректність, доки ще існують застарілі fallback-варіанти володіння маніфесту.

Кожен Plugin має навмисно встановлювати `activation.onStartup`, оскільки OpenClaw відходить
від неявних імпортів під час запуску. Установлюйте його в `true` лише тоді, коли Plugin мусить
запускатися під час запуску Gateway. Установлюйте його в `false`, коли Plugin є інертним під час
запуску й має завантажуватися лише з вужчих тригерів. Пропуск `onStartup` зберігає
застарілий fallback неявного startup-sidecar для Plugins без
статичних метаданих можливостей; майбутні версії можуть припинити завантажувати такі Plugins під час запуску,
якщо вони не оголосять `activation.onStartup: true`. Звіти про статус і сумісність Plugin
попереджають `legacy-implicit-startup-sidecar`, коли Plugin
досі покладається на цей fallback.

Для тестування міграції встановіть
`OPENCLAW_DISABLE_LEGACY_IMPLICIT_STARTUP_SIDECARS=1`, щоб вимкнути лише цей
застарілий fallback. Цей opt-in режим не блокує явні
Plugins з `activation.onStartup: true` або Plugins, завантажені каналом, конфігурацією,
agent-harness, пам’яттю чи іншими вужчими тригерами активації.

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

| Поле               | Обов’язкове | Тип                                                  | Що це означає                                                                                                                                                                                                                         |
| ------------------ | ----------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | Ні          | `boolean`                                            | Явна активація під час запуску Gateway. Кожен Plugin має встановлювати це поле. `true` імпортує Plugin під час запуску; `false` відмовляється від застарілого fallback неявного sidecar запуску, якщо інший відповідний тригер не потребує завантаження. |
| `onProviders`      | Ні          | `string[]`                                           | Ідентифікатори провайдерів, які мають включати цей Plugin до планів активації/завантаження.                                                                                                                                          |
| `onAgentHarnesses` | Ні          | `string[]`                                           | Runtime-ідентифікатори вбудованих agent harness, які мають включати цей Plugin до планів активації/завантаження. Використовуйте верхньорівневий `cliBackends` для псевдонімів CLI backend.                                           |
| `onCommands`       | Ні          | `string[]`                                           | Ідентифікатори команд, які мають включати цей Plugin до планів активації/завантаження.                                                                                                                                               |
| `onChannels`       | Ні          | `string[]`                                           | Ідентифікатори каналів, які мають включати цей Plugin до планів активації/завантаження.                                                                                                                                              |
| `onRoutes`         | Ні          | `string[]`                                           | Типи маршрутів, які мають включати цей Plugin до планів активації/завантаження.                                                                                                                                                      |
| `onConfigPaths`    | Ні          | `string[]`                                           | Кореневідносні шляхи конфігурації, які мають включати цей Plugin до планів запуску/завантаження, коли шлях присутній і не вимкнений явно.                                                                                            |
| `onCapabilities`   | Ні          | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Широкі підказки можливостей, що використовуються плануванням активації площини керування. За можливості надавайте перевагу вужчим полям.                                                                                              |

Поточні live-споживачі:

- Планування запуску Gateway використовує `activation.onStartup` для явного імпорту під час запуску
  та відмови від застарілого fallback неявного startup-sidecar
- Планування CLI, спричинене командою, повертається до застарілих
  `commandAliases[].cliCommand` або `commandAliases[].name`
- Планування запуску agent-runtime використовує `activation.onAgentHarnesses` для
  вбудованих harness і верхньорівневий `cliBackends[]` для runtime-псевдонімів CLI
- Планування setup/каналу, спричинене каналом, повертається до застарілого володіння `channels[]`,
  коли явні метадані активації каналу відсутні
- Планування Plugin під час запуску використовує `activation.onConfigPaths` для неканальних кореневих
  поверхонь конфігурації, таких як блок `browser` вбудованого браузерного Plugin
- Планування setup/runtime, спричинене провайдером, повертається до застарілого володіння
  `providers[]` і верхньорівневого `cliBackends[]`, коли явні метадані активації провайдера
  відсутні

Діагностика планувальника може відрізняти явні підказки активації від fallback
володіння маніфесту. Наприклад, `activation-command-hint` означає, що
`activation.onCommands` збігся, тоді як `manifest-command-alias` означає, що
планувальник використав володіння `commandAliases`. Ці мітки причин призначені для
діагностики хоста та тестів; автори Plugin мають і далі оголошувати метадані,
які найкраще описують володіння.

## Довідник qaRunners

Використовуйте `qaRunners`, коли Plugin додає один або кілька transport runners під
спільним коренем `openclaw qa`. Тримайте ці метадані дешевими й статичними; runtime Plugin
і надалі володіє фактичною реєстрацією CLI через легку поверхню
`runtime-api.ts`, що експортує `qaRunnerCliRegistrations`.

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

| Поле         | Обов’язкове | Тип      | Що це означає                                                      |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | Так      | `string` | Підкоманда, змонтована під `openclaw qa`, наприклад `matrix`.    |
| `description` | Ні       | `string` | Резервний текст довідки, що використовується, коли спільному хосту потрібна заглушкова команда. |

## довідник setup

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

Верхньорівневе `cliBackends` залишається чинним і далі описує бекенди виведення CLI. `setup.cliBackends` є специфічною для налаштування поверхнею дескрипторів для потоків control-plane/setup, які мають залишатися лише метаданими.

Коли `setup.providers` і `setup.cliBackends` наявні, вони є пріоритетною поверхнею пошуку за принципом «спершу дескриптор» для виявлення налаштування. Якщо дескриптор лише звужує кандидатний Plugin, а налаштуванню все ще потрібні багатші runtime-хуки часу налаштування, задайте `requiresRuntime: true` і залиште `setup-api` як резервний шлях виконання.

OpenClaw також включає `setup.providers[].envVars` у загальні пошуки автентифікації провайдера й env-var. `providerAuthEnvVars` залишається підтримуваним через адаптер сумісності протягом періоду виведення з ужитку, але небандловані Plugin, які досі його використовують, отримують діагностику маніфесту. Нові Plugin мають розміщувати метадані env для setup/status у `setup.providers[].envVars`.

OpenClaw також може виводити прості варіанти налаштування з `setup.providers[].authMethods`, коли запис налаштування недоступний або коли `setup.requiresRuntime: false` оголошує, що runtime для налаштування не потрібен. Явні записи `providerAuthChoices` залишаються пріоритетними для користувацьких міток, прапорців CLI, області онбордингу та метаданих асистента.

Задавайте `requiresRuntime: false` лише тоді, коли цих дескрипторів достатньо для поверхні налаштування. OpenClaw трактує явне `false` як контракт лише на основі дескриптора й не виконуватиме `setup-api` або `openclaw.setupEntry` для пошуку налаштування. Якщо Plugin лише з дескрипторами все одно постачає один із цих runtime-записів налаштування, OpenClaw повідомляє додаткову діагностику й продовжує його ігнорувати. Пропущене `requiresRuntime` зберігає застарілу резервну поведінку, щоб наявні Plugin, які додали дескриптори без цього прапорця, не зламалися.

Оскільки пошук налаштування може виконувати код `setup-api`, що належить Plugin, нормалізовані значення `setup.providers[].id` і `setup.cliBackends[]` мають залишатися унікальними серед виявлених Plugin. Неоднозначне володіння завершується закритою відмовою замість вибору переможця за порядком виявлення.

Коли runtime налаштування все ж виконується, діагностика реєстру налаштування повідомляє про розбіжність дескрипторів, якщо `setup-api` реєструє провайдера або CLI-бекенд, якого дескриптори маніфесту не оголошують, або якщо дескриптор не має відповідної runtime-реєстрації. Ці діагностики є додатковими й не відхиляють застарілі Plugin.

### довідник setup.providers

| Поле         | Обов’язкове | Тип        | Що це означає                                                                        |
| ------------- | -------- | ---------- | ------------------------------------------------------------------------------------ |
| `id`          | Так      | `string`   | Ідентифікатор провайдера, доступний під час налаштування або онбордингу. Тримайте нормалізовані ідентифікатори глобально унікальними. |
| `authMethods` | Ні       | `string[]` | Ідентифікатори методів setup/auth, які цей провайдер підтримує без завантаження повного runtime.           |
| `envVars`     | Ні       | `string[]` | Env vars, які загальні поверхні setup/status можуть перевіряти до завантаження runtime Plugin.   |

### поля setup

| Поле              | Обов’язкове | Тип        | Що це означає                                                                                       |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | Ні       | `object[]` | Дескриптори налаштування провайдера, доступні під час налаштування й онбордингу.                                     |
| `cliBackends`      | Ні       | `string[]` | Ідентифікатори бекендів часу налаштування, що використовуються для пошуку налаштування за принципом «спершу дескриптор». Тримайте нормалізовані ідентифікатори глобально унікальними. |
| `configMigrations` | Ні       | `string[]` | Ідентифікатори міграцій конфігурації, що належать поверхні налаштування цього Plugin.                                          |
| `requiresRuntime`  | Ні       | `boolean`  | Чи все ще потрібне налаштуванню виконання `setup-api` після пошуку за дескриптором.                            |

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

| Поле         | Тип        | Що це означає                           |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Мітка поля, видима користувачу.                |
| `help`        | `string`   | Короткий допоміжний текст.                      |
| `tags`        | `string[]` | Необов’язкові UI-теги.                       |
| `advanced`    | `boolean`  | Позначає поле як розширене.            |
| `sensitive`   | `boolean`  | Позначає поле як таємне або чутливе. |
| `placeholder` | `string`   | Текст заповнювача для полів форми.       |

## довідник contracts

Використовуйте `contracts` лише для статичних метаданих володіння можливостями, які OpenClaw може
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

Кожен список необов’язковий:

| Поле                            | Тип        | Що це означає                                                         |
| -------------------------------- | ---------- | --------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Ідентифікатори фабрик розширень app-server Codex, наразі `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | Runtime-ідентифікатори, для яких бандлований Plugin може зареєструвати middleware результатів інструментів. |
| `externalAuthProviders`          | `string[]` | Ідентифікатори провайдерів, чиїм хуком зовнішнього профілю автентифікації володіє цей Plugin.       |
| `speechProviders`                | `string[]` | Ідентифікатори провайдерів мовлення, якими володіє цей Plugin.                                 |
| `realtimeTranscriptionProviders` | `string[]` | Ідентифікатори провайдерів транскрипції в реальному часі, якими володіє цей Plugin.                 |
| `realtimeVoiceProviders`         | `string[]` | Ідентифікатори голосових провайдерів у реальному часі, якими володіє цей Plugin.                         |
| `memoryEmbeddingProviders`       | `string[]` | Ідентифікатори провайдерів вбудовувань пам’яті, якими володіє цей Plugin.                       |
| `mediaUnderstandingProviders`    | `string[]` | Ідентифікатори провайдерів розуміння медіа, якими володіє цей Plugin.                    |
| `imageGenerationProviders`       | `string[]` | Ідентифікатори провайдерів генерації зображень, якими володіє цей Plugin.                       |
| `videoGenerationProviders`       | `string[]` | Ідентифікатори провайдерів генерації відео, якими володіє цей Plugin.                       |
| `webFetchProviders`              | `string[]` | Ідентифікатори провайдерів web-fetch, якими володіє цей Plugin.                              |
| `webSearchProviders`             | `string[]` | Ідентифікатори провайдерів web-search, якими володіє цей Plugin.                             |
| `migrationProviders`             | `string[]` | Ідентифікатори провайдерів імпорту, якими цей Plugin володіє для `openclaw migrate`.          |
| `tools`                          | `string[]` | Назви інструментів агента, якими цей Plugin володіє для перевірок бандлованих контрактів.        |

`contracts.embeddedExtensionFactories` збережено для бандлованих фабрик розширень лише для app-server Codex. Бандловані перетворення результатів інструментів мають оголошувати `contracts.agentToolResultMiddleware` і реєструватися через `api.registerAgentToolResultMiddleware(...)` натомість. Зовнішні Plugin не можуть реєструвати middleware результатів інструментів, оскільки цей шов може переписувати високодовірений вивід інструментів до того, як модель його побачить.

Provider Plugin, які реалізують `resolveExternalAuthProfiles`, мають оголошувати `contracts.externalAuthProviders`. Plugin без цього оголошення все ще виконуються через застарілий резервний шлях сумісності, але цей шлях повільніший і буде вилучений після міграційного періоду.

Бандловані провайдери вбудовувань пам’яті мають оголошувати
`contracts.memoryEmbeddingProviders` для кожного ідентифікатора адаптера, який вони надають, включно з
вбудованими адаптерами, такими як `local`. Самостійні CLI-шляхи використовують цей контракт маніфесту, щоб завантажити лише власний Plugin до того, як повний runtime Gateway зареєструє провайдерів.

## довідник mediaUnderstandingProviderMetadata

Використовуйте `mediaUnderstandingProviderMetadata`, коли провайдер розуміння медіа має
моделі за замовчуванням, пріоритет резервної автоавтентифікації або нативну підтримку документів, які
загальним core-помічникам потрібні до завантаження runtime. Ключі також мають бути оголошені в
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

| Поле                  | Тип                                 | Що це означає                                                                |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Медіаможливості, доступні через цього провайдера.                                 |
| `defaultModels`        | `Record<string, string>`            | Значення за замовчуванням «можливість-модель», що використовуються, коли конфігурація не задає модель.      |
| `autoPriority`         | `Record<string, number>`            | Менші числа сортуються раніше для автоматичного резервного вибору провайдера на основі облікових даних. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Нативні вхідні документи, підтримувані провайдером.                            |

## довідник channelConfigs

Використовуйте `channelConfigs`, коли Plugin каналу потрібні дешеві метадані конфігурації до
завантаження runtime. Виявлення налаштування/стану каналу лише для читання може використовувати ці метадані
напряму для налаштованих зовнішніх каналів, коли запис налаштування недоступний або
коли `setup.requiresRuntime: false` оголошує, що runtime налаштування не потрібен.

`channelConfigs` — це метадані маніфесту Plugin, а не новий верхньорівневий розділ користувацької конфігурації. Користувачі й далі налаштовують екземпляри каналів у `channels.<channel-id>`. OpenClaw читає метадані маніфесту, щоб визначити, який Plugin володіє цим налаштованим каналом, до виконання runtime-коду Plugin.

Для Plugin каналу `configSchema` і `channelConfigs` описують різні шляхи:

- `configSchema` перевіряє `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` перевіряє `channels.<channel-id>`

Необ’єднані в пакет плагіни, які оголошують `channels[]`, також мають оголошувати відповідні
записи `channelConfigs`. Без них OpenClaw все одно може завантажити плагін, але
схема конфігурації холодного шляху, налаштування та поверхні Control UI не зможуть знати
форму параметрів, що належать каналу, доки не виконається середовище виконання плагіна.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` і
`nativeSkillsAutoEnabled` можуть оголошувати статичні типові значення `auto` для перевірок конфігурації команд,
які виконуються до завантаження середовища виконання каналу. Канали, об’єднані в пакет, також можуть публікувати
ті самі типові значення через `package.json#openclaw.channel.commands` разом
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

| Поле          | Тип                      | Що це означає                                                                                         |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema для `channels.<id>`. Обов’язкова для кожного оголошеного запису конфігурації каналу.     |
| `uiHints`     | `Record<string, object>` | Необов’язкові UI-мітки/заповнювачі/підказки чутливості для цього розділу конфігурації каналу.        |
| `label`       | `string`                 | Мітка каналу, об’єднана з поверхнями вибору та інспектування, коли метадані середовища виконання ще не готові. |
| `description` | `string`                 | Короткий опис каналу для поверхонь інспектування та каталогу.                                        |
| `commands`    | `object`                 | Статичні автоматичні типові значення для нативних команд і нативних Skills для перевірок конфігурації до запуску середовища виконання. |
| `preferOver`  | `string[]`               | Ідентифікатори застарілих або нижчопріоритетних плагінів, які цей канал має випереджати на поверхнях вибору. |

### Заміна іншого плагіна каналу

Використовуйте `preferOver`, коли ваш плагін є бажаним власником для ідентифікатора каналу, який
також може надавати інший плагін. Типові випадки: перейменований ідентифікатор плагіна,
окремий плагін, що замінює плагін, об’єднаний у пакет, або підтримуваний форк, який
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
ідентифікатор бажаного плагіна. Якщо нижчопріоритетний плагін було вибрано лише тому, що
він об’єднаний у пакет або ввімкнений типово, OpenClaw вимикає його в ефективній
конфігурації середовища виконання, щоб один плагін володів каналом і його інструментами. Явний
вибір користувача все одно має перевагу: якщо користувач явно вмикає обидва плагіни, OpenClaw
зберігає цей вибір і повідомляє діагностику дубльованих каналів/інструментів замість
тихої зміни запитаного набору плагінів.

Обмежуйте `preferOver` ідентифікаторами плагінів, які справді можуть надавати той самий канал.
Це не загальне поле пріоритету, і воно не перейменовує ключі користувацької конфігурації.

## Довідник modelSupport

Використовуйте `modelSupport`, коли OpenClaw має визначати ваш провайдерський плагін із
скорочених ідентифікаторів моделей на кшталт `gpt-5.5` або `claude-sonnet-4.6` до завантаження
середовища виконання плагіна.

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
- `modelPatterns` мають перевагу над `modelPrefixes`
- якщо збігаються один необ’єднаний у пакет плагін і один плагін, об’єднаний у пакет, перемагає необ’єднаний у пакет
  плагін
- решта неоднозначностей ігнорується, доки користувач або конфігурація не вкаже провайдера

Поля:

| Поле            | Тип        | Що це означає                                                                         |
| --------------- | ---------- | ------------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Префікси, які зіставляються через `startsWith` зі скороченими ідентифікаторами моделей. |
| `modelPatterns` | `string[]` | Джерела regex, які зіставляються зі скороченими ідентифікаторами моделей після видалення суфікса профілю. |

## Довідник modelCatalog

Використовуйте `modelCatalog`, коли OpenClaw має знати метадані моделей провайдера до
завантаження середовища виконання плагіна. Це джерело, що належить маніфесту, для фіксованих рядків
каталогу, псевдонімів провайдера, правил приглушення та режиму виявлення. Оновлення під час виконання
і далі належить коду середовища виконання провайдера, але маніфест повідомляє core, коли середовище виконання
потрібне.

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
| `providers`    | `Record<string, object>`                                 | Рядки каталогу для ідентифікаторів провайдерів, якими володіє цей плагін. Ключі також мають бути в `providers` верхнього рівня. |
| `aliases`      | `Record<string, object>`                                 | Псевдоніми провайдера, які мають розв’язуватися до власного провайдера для планування каталогу або приглушення. |
| `suppressions` | `object[]`                                               | Рядки моделей з іншого джерела, які цей плагін приглушує з причини, специфічної для провайдера.             |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Чи можна каталог провайдера читати з метаданих маніфесту, оновлювати в кеш або чи він потребує середовища виконання. |

`aliases` бере участь у пошуку власника провайдера для планування каталогу моделей.
Цілі псевдонімів мають бути провайдерами верхнього рівня, якими володіє той самий плагін. Коли
список, відфільтрований за провайдером, використовує псевдонім, OpenClaw може прочитати маніфест власника та
застосувати перевизначення API/base URL псевдоніма без завантаження середовища виконання провайдера.
Псевдоніми не розгортають нефільтровані списки каталогу; широкі списки виводять лише канонічні
рядки провайдера-власника.

`suppressions` замінює старий hook середовища виконання провайдера `suppressBuiltInModel`.
Записи приглушення враховуються лише тоді, коли провайдером володіє плагін або
його оголошено як ключ `modelCatalog.aliases`, що вказує на власного провайдера. Hooks приглушення
середовища виконання більше не викликаються під час розв’язання моделей.

Поля провайдера:

| Поле     | Тип                      | Що це означає                                                              |
| --------- | ------------------------ | -------------------------------------------------------------------------- |
| `baseUrl` | `string`                 | Необов’язкова типова базова URL-адреса для моделей у цьому каталозі провайдера. |
| `api`     | `ModelApi`               | Необов’язковий типовий адаптер API для моделей у цьому каталозі провайдера. |
| `headers` | `Record<string, string>` | Необов’язкові статичні заголовки, що застосовуються до цього каталогу провайдера. |
| `models`  | `object[]`               | Обов’язкові рядки моделей. Рядки без `id` ігноруються.                     |

Поля моделі:

| Поле           | Тип                                                            | Що це означає                                                                  |
| --------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `id`            | `string`                                                       | Локальний для провайдера ідентифікатор моделі без префікса `provider/`.        |
| `name`          | `string`                                                       | Необов’язкова відображувана назва.                                             |
| `api`           | `ModelApi`                                                     | Необов’язкове перевизначення API для окремої моделі.                           |
| `baseUrl`       | `string`                                                       | Необов’язкове перевизначення базової URL-адреси для окремої моделі.            |
| `headers`       | `Record<string, string>`                                       | Необов’язкові статичні заголовки для окремої моделі.                           |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Модальності, які приймає модель.                                               |
| `reasoning`     | `boolean`                                                      | Чи надає модель поведінку міркування.                                          |
| `contextWindow` | `number`                                                       | Нативне контекстне вікно провайдера.                                           |
| `contextTokens` | `number`                                                       | Необов’язкове ефективне обмеження контексту середовища виконання, коли воно відрізняється від `contextWindow`. |
| `maxTokens`     | `number`                                                       | Максимальна кількість вихідних токенів, якщо відома.                           |
| `cost`          | `object`                                                       | Необов’язкова ціна в USD за мільйон токенів, зокрема необов’язковий `tieredPricing`. |
| `compat`        | `object`                                                       | Необов’язкові прапорці сумісності, що відповідають сумісності конфігурації моделей OpenClaw. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Статус у списку. Приглушуйте лише тоді, коли рядок узагалі не має з’являтися.  |
| `statusReason`  | `string`                                                       | Необов’язкова причина, що показується зі статусом, відмінним від доступного.   |
| `replaces`      | `string[]`                                                     | Старі локальні для провайдера ідентифікатори моделей, які ця модель замінює.   |
| `replacedBy`    | `string`                                                       | Локальний для провайдера ідентифікатор моделі-замінника для застарілих рядків. |
| `tags`          | `string[]`                                                     | Стабільні теги, які використовують засоби вибору та фільтри.                   |

Поля приглушення:

| Поле                       | Тип        | Що це означає                                                                                                  |
| -------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Ідентифікатор провайдера для вищого рядка, який потрібно приховати. Має належати цьому Plugin або бути оголошеним як належний псевдонім. |
| `model`                    | `string`   | Локальний для провайдера ідентифікатор моделі, яку потрібно приховати.                                         |
| `reason`                   | `string`   | Необов’язкове повідомлення, яке показується, коли прихований рядок запитують напряму.                         |
| `when.baseUrlHosts`        | `string[]` | Необов’язковий список ефективних хостів базових URL провайдера, потрібних перед застосуванням приховування.   |
| `when.providerConfigApiIn` | `string[]` | Необов’язковий список точних значень `api` конфігурації провайдера, потрібних перед застосуванням приховування. |

Не розміщуйте в `modelCatalog` дані, призначені лише для runtime. Використовуйте `static` лише тоді, коли рядки маніфесту достатньо повні, щоб поверхні списків і вибору з фільтрацією за провайдером могли пропустити виявлення через registry/runtime. Використовуйте `refreshable`, коли рядки маніфесту корисні як початкові або додаткові елементи списку, але оновлення/кеш може пізніше додати більше рядків; рядки refreshable самі по собі не є авторитетними. Використовуйте `runtime`, коли OpenClaw має завантажити runtime провайдера, щоб дізнатися список.

## Довідник modelIdNormalization

Використовуйте `modelIdNormalization` для дешевого очищення ідентифікаторів моделей, що належить провайдеру й має відбутися до завантаження runtime провайдера. Це тримає псевдоніми, як-от короткі назви моделей, локальні для провайдера застарілі ідентифікатори та правила префіксів проксі, у маніфесті Plugin-власника замість таблиць вибору моделей у core.

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
| `aliases`                            | `Record<string,string>` | Точні псевдоніми ідентифікаторів моделей без урахування регістру. Значення повертаються як записано. |
| `stripPrefixes`                      | `string[]`              | Префікси, які потрібно видалити перед пошуком псевдоніма; корисно для застарілого дублювання провайдер/модель. |
| `prefixWhenBare`                     | `string`                | Префікс, який додається, коли нормалізований ідентифікатор моделі ще не містить `/`.          |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Умовні правила префіксів для bare-id після пошуку псевдоніма, з ключами `modelPrefix` і `prefix`. |

## Довідник providerEndpoints

Використовуйте `providerEndpoints` для класифікації endpoint, яку загальна політика запитів має знати до завантаження runtime провайдера. Core все ще володіє значенням кожного `endpointClass`; маніфести Plugin володіють метаданими хоста та базового URL.

Поля endpoint:

| Поле                           | Тип        | Що це означає                                                                                     |
| ------------------------------ | ---------- | ------------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Відомий core-клас endpoint, як-от `openrouter`, `moonshot-native` або `google-vertex`.           |
| `hosts`                        | `string[]` | Точні імена хостів, що відповідають класу endpoint.                                               |
| `hostSuffixes`                 | `string[]` | Суфікси хостів, що відповідають класу endpoint. Додавайте префікс `.` для зіставлення лише суфіксів доменів. |
| `baseUrls`                     | `string[]` | Точні нормалізовані базові URL HTTP(S), що відповідають класу endpoint.                           |
| `googleVertexRegion`           | `string`   | Статичний регіон Google Vertex для точних глобальних хостів.                                      |
| `googleVertexRegionHostSuffix` | `string`   | Суфікс, який потрібно прибрати з відповідних хостів, щоб відкрити префікс регіону Google Vertex.  |

## Довідник providerRequest

Використовуйте `providerRequest` для дешевих метаданих сумісності запитів, потрібних загальній політиці запитів без завантаження runtime провайдера. Тримайте переписування payload, специфічне для поведінки, у runtime hooks провайдера або спільних допоміжних засобах сімейства провайдерів.

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
| `family`              | `string`     | Мітка сімейства провайдера, яку використовують загальні рішення та діагностика сумісності запитів. |
| `compatibilityFamily` | `"moonshot"` | Необов’язковий кошик сумісності сімейства провайдерів для спільних допоміжних засобів запитів. |
| `openAICompletions`   | `object`     | Прапорці запитів completions, сумісних з OpenAI, наразі `supportsStreamingUsage`.              |

## Довідник modelPricing

Використовуйте `modelPricing`, коли провайдеру потрібна поведінка ціноутворення control-plane до завантаження runtime. Кеш ціноутворення Gateway читає ці метадані без імпорту коду runtime провайдера.

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

| Поле         | Тип               | Що це означає                                                                                          |
| ------------ | ----------------- | ------------------------------------------------------------------------------------------------------ |
| `external`   | `boolean`         | Установіть `false` для локальних/самостійно розгорнутих провайдерів, які ніколи не мають отримувати ціни OpenRouter або LiteLLM. |
| `openRouter` | `false \| object` | Зіставлення для пошуку цін OpenRouter. `false` вимикає пошук OpenRouter для цього провайдера.          |
| `liteLLM`    | `false \| object` | Зіставлення для пошуку цін LiteLLM. `false` вимикає пошук LiteLLM для цього провайдера.                |

Поля джерела:

| Поле                       | Тип                | Що це означає                                                                                                             |
| -------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Ідентифікатор провайдера зовнішнього каталогу, коли він відрізняється від ідентифікатора провайдера OpenClaw, наприклад `z-ai` для провайдера `zai`. |
| `passthroughProviderModel` | `boolean`          | Обробляти ідентифікатори моделей із похилою рискою як вкладені посилання провайдер/модель; корисно для проксі-провайдерів, таких як OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Додаткові варіанти ідентифікаторів моделей зовнішнього каталогу. `version-dots` пробує ідентифікатори версій із крапками, як-от `claude-opus-4.6`. |

### Індекс провайдерів OpenClaw

Індекс провайдерів OpenClaw — це попередні метадані, якими володіє OpenClaw, для провайдерів, чиї Plugin можуть бути ще не встановлені. Він не є частиною маніфесту Plugin. Маніфести Plugin залишаються авторитетним джерелом установлених Plugin. Індекс провайдерів — це внутрішній fallback-контракт, який майбутні поверхні встановлюваних провайдерів і вибору моделей до встановлення використовуватимуть, коли Plugin провайдера не встановлено.

Порядок авторитетності каталогу:

1. Конфігурація користувача.
2. `modelCatalog` маніфесту встановленого Plugin.
3. Кеш каталогу моделей після явного оновлення.
4. Попередні рядки Індексу провайдерів OpenClaw.

Індекс провайдерів не має містити secrets, увімкнений стан, runtime hooks або live-дані моделей, специфічні для облікового запису. Його preview-каталоги використовують ту саму форму рядка провайдера `modelCatalog`, що й маніфести Plugin, але мають залишатися обмеженими стабільними display-метаданими, якщо runtime-поля адаптера, як-от `api`, `baseUrl`, ціноутворення або прапорці сумісності, навмисно не підтримуються узгодженими з маніфестом установленого Plugin. Провайдери з live-виявленням `/models` мають записувати оновлені рядки через явний шлях кешу каталогу моделей замість того, щоб звичайне створення списків або onboarding викликали API провайдера.

Записи Індексу провайдерів також можуть містити метадані встановлюваного Plugin для провайдерів, чий Plugin було винесено з core або ще не встановлено з іншої причини. Ці метадані віддзеркалюють шаблон каталогу каналів: назви пакета, npm install spec, очікуваної цілісності та дешевих міток вибору автентифікації достатньо, щоб показати варіант налаштування з установленням. Після встановлення Plugin його маніфест має пріоритет, а запис Індексу провайдерів для цього провайдера ігнорується.

Застарілі capability-ключі верхнього рівня вважаються deprecated. Використовуйте `openclaw doctor --fix`, щоб перенести `speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders` і `webSearchProviders` під `contracts`; звичайне завантаження маніфестів більше не обробляє ці поля верхнього рівня як володіння capability.

## Маніфест проти package.json

Ці два файли виконують різні завдання:

| Файл                   | Для чого використовувати                                                                                                  |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Виявлення, валідація конфігурації, метадані вибору автентифікації та UI-підказки, які мають існувати до запуску коду Plugin |
| `package.json`         | npm-метадані, встановлення залежностей і блок `openclaw`, який використовується для entrypoints, install gating, setup або metadata каталогу |

Якщо ви не впевнені, де має бути певний фрагмент metadata, скористайтеся таким правилом:

- якщо OpenClaw має знати це до завантаження коду Plugin, розмістіть це в `openclaw.plugin.json`
- якщо це стосується packaging, entry files або поведінки npm install, розмістіть це в `package.json`

### Поля package.json, що впливають на виявлення

Деякі pre-runtime метадані Plugin навмисно розміщуються в `package.json` під блоком `openclaw`, а не в `openclaw.plugin.json`.

Важливі приклади:

| Поле                                                              | Що це означає                                                                                                                                                                                            |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Оголошує нативні точки входу plugin. Має залишатися всередині каталогу пакета plugin.                                                                                                                    |
| `openclaw.runtimeExtensions`                                      | Оголошує зібрані точки входу JavaScript runtime для встановлених пакетів. Має залишатися всередині каталогу пакета plugin.                                                                              |
| `openclaw.setupEntry`                                             | Легка точка входу лише для налаштування, що використовується під час onboarding, відкладеного запуску каналу та виявлення стану каналу лише для читання/SecretRef. Має залишатися всередині каталогу пакета plugin. |
| `openclaw.runtimeSetupEntry`                                      | Оголошує зібрану точку входу JavaScript для налаштування встановлених пакетів. Має залишатися всередині каталогу пакета plugin.                                                                         |
| `openclaw.channel`                                                | Дешеві метадані каталогу каналів, як-от мітки, шляхи документації, псевдоніми та текст вибору.                                                                                                           |
| `openclaw.channel.commands`                                       | Статичні метадані нативних команд і нативних skill auto-default, що використовуються конфігурацією, аудитом і поверхнями списку команд до завантаження runtime каналу.                                  |
| `openclaw.channel.configuredState`                                | Легкі метадані перевірки configured-state, які можуть відповісти на питання "чи вже існує налаштування лише через env?" без завантаження повного runtime каналу.                                        |
| `openclaw.channel.persistedAuthState`                             | Легкі метадані перевірки persisted-auth, які можуть відповісти на питання "чи вже щось увійшло в систему?" без завантаження повного runtime каналу.                                                     |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Підказки встановлення/оновлення для bundled і зовнішньо опублікованих plugins.                                                                                                                           |
| `openclaw.install.defaultChoice`                                  | Бажаний шлях встановлення, коли доступно кілька джерел встановлення.                                                                                                                                     |
| `openclaw.install.minHostVersion`                                 | Мінімальна підтримувана версія хоста OpenClaw, із використанням нижньої межі semver на кшталт `>=2026.3.22`.                                                                                             |
| `openclaw.install.expectedIntegrity`                              | Очікуваний рядок цілісності npm dist, наприклад `sha512-...`; потоки встановлення й оновлення звіряють отриманий артефакт із ним.                                                                        |
| `openclaw.install.allowInvalidConfigRecovery`                     | Дозволяє вузький шлях відновлення через перевстановлення bundled-plugin, коли конфігурація недійсна.                                                                                                      |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Дає змогу поверхням каналу лише для налаштування завантажуватися перед повним plugin каналу під час запуску.                                                                                             |

Метадані маніфесту визначають, які варіанти провайдера/каналу/налаштування з’являються в
onboarding до завантаження runtime. `package.json#openclaw.install` повідомляє
onboarding, як отримати або ввімкнути цей plugin, коли користувач вибирає один із цих
варіантів. Не переміщуйте підказки встановлення в `openclaw.plugin.json`.

`openclaw.install.minHostVersion` застосовується під час встановлення та завантаження
реєстру маніфестів. Недійсні значення відхиляються; новіші, але дійсні значення пропускають
plugin на старіших хостах.

Точне закріплення версії npm уже міститься в `npmSpec`, наприклад
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Офіційні записи зовнішнього каталогу
мають поєднувати точні специфікації з `expectedIntegrity`, щоб потоки оновлення
закрито завершувалися з помилкою, якщо отриманий npm-артефакт більше не відповідає
закріпленому релізу. Інтерактивний onboarding і далі пропонує довірені npm-специфікації
реєстру, зокрема голі імена пакетів і dist-tags, для сумісності. Діагностика каталогу може
розрізняти точні, плаваючі, закріплені за цілісністю, без цілісності, з невідповідністю
імені пакета та недійсні джерела default-choice. Вона також попереджає, коли
`expectedIntegrity` присутній, але немає дійсного npm-джерела, яке він може закріпити.
Коли `expectedIntegrity` присутній,
потоки встановлення/оновлення застосовують його; коли його пропущено, розв’язання реєстру
записується без закріплення цілісності.

Канальні plugins мають надавати `openclaw.setupEntry`, коли статус, список каналів
або сканування SecretRef повинні ідентифікувати налаштовані облікові записи без завантаження повного
runtime. Точка входу налаштування має експортувати метадані каналу разом із setup-safe адаптерами
конфігурації, статусу та секретів; мережеві клієнти, слухачі Gateway і
транспортні runtimes тримайте в основній точці входу extension.

Поля точки входу runtime не перевизначають перевірки меж пакета для полів точки входу source.
Наприклад, `openclaw.runtimeExtensions` не може зробити шлях `openclaw.extensions`, що виходить за межі,
завантажуваним.

`openclaw.install.allowInvalidConfigRecovery` навмисно вузький. Він не робить
довільні зламані конфігурації встановлюваними. Сьогодні він лише дозволяє потокам встановлення
відновлюватися після конкретних застарілих збоїв оновлення bundled-plugin, як-от
відсутній шлях bundled plugin або застарілий запис `channels.<id>` для того самого
bundled plugin. Непов’язані помилки конфігурації й далі блокують встановлення та спрямовують операторів
до `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` — це метадані пакета для маленького модуля
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

Використовуйте це, коли потокам налаштування, doctor, статусу або read-only presence потрібна дешева
перевірка автентифікації так/ні до завантаження повного plugin каналу. Persisted auth state не є
configured channel state: не використовуйте ці метадані для автоматичного ввімкнення plugins,
відновлення залежностей runtime або вирішення, чи має завантажуватися runtime каналу.
Цільовий export має бути невеликою функцією, що читає лише persisted state; не
спрямовуйте його через повний barrel runtime каналу.

`openclaw.channel.configuredState` має таку саму форму для дешевих перевірок configured лише через env:

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

Використовуйте це, коли канал може відповісти про configured-state з env або інших малих
нерuntime вхідних даних. Якщо перевірка потребує повного розв’язання конфігурації або справжнього
runtime каналу, залиште цю логіку в hook plugin `config.hasConfiguredState`.

## Пріоритет виявлення (дублікати ids plugin)

OpenClaw виявляє plugins з кількох коренів (bundled, глобальне встановлення, workspace, явні шляхи, вибрані конфігурацією). Якщо два виявлення мають однаковий `id`, зберігається лише маніфест із **найвищим пріоритетом**; дублікати з нижчим пріоритетом відкидаються замість завантаження поруч із ним.

Пріоритет, від найвищого до найнижчого:

1. **Вибраний конфігурацією** — шлях, явно закріплений у `plugins.entries.<id>`
2. **Bundled** — plugins, що постачаються з OpenClaw
3. **Глобальне встановлення** — plugins, установлені в глобальний корінь plugins OpenClaw
4. **Workspace** — plugins, виявлені відносно поточного workspace

Наслідки:

- Forked або застаріла копія bundled plugin у workspace не затінить bundled build.
- Щоб справді перевизначити bundled plugin локальним, закріпіть його через `plugins.entries.<id>`, щоб він переміг за пріоритетом, а не покладайтеся на виявлення workspace.
- Відкидання дублікатів логуються, щоб Doctor і діагностика запуску могли вказати на відкинуту копію.

## Вимоги JSON Schema

- **Кожен plugin має постачати JSON Schema**, навіть якщо він не приймає конфігурацію.
- Порожня схема прийнятна (наприклад, `{ "type": "object", "additionalProperties": false }`).
- Схеми перевіряються під час читання/запису конфігурації, а не під час runtime.

## Поведінка валідації

- Невідомі ключі `channels.*` є **помилками**, якщо id каналу не оголошено
  маніфестом plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` і `plugins.slots.*`
  мають посилатися на **доступні для виявлення** ids plugin. Невідомі ids є **помилками**.
- Якщо plugin встановлено, але він має зламаний або відсутній маніфест чи схему,
  валідація завершується невдало, а Doctor повідомляє про помилку plugin.
- Якщо конфігурація plugin існує, але plugin **вимкнено**, конфігурація зберігається, а
  **попередження** відображається в Doctor + логах.

Див. [довідник конфігурації](/uk/gateway/configuration) для повної схеми `plugins.*`.

## Примітки

- Маніфест **обов’язковий для нативних plugins OpenClaw**, зокрема локальних завантажень із файлової системи. Runtime все одно завантажує модуль plugin окремо; маніфест призначений лише для виявлення + валідації.
- Нативні маніфести розбираються за допомогою JSON5, тому коментарі, кінцеві коми та ключі без лапок приймаються, доки фінальне значення все ще є об’єктом.
- Завантажувач маніфестів читає лише задокументовані поля маніфесту. Уникайте користувацьких ключів верхнього рівня.
- `channels`, `providers`, `cliBackends` і `skills` усі можна пропустити, коли plugin не потребує їх.
- `providerDiscoveryEntry` має залишатися легким і не повинен імпортувати широкий код runtime; використовуйте його для статичних метаданих каталогу провайдерів або вузьких дескрипторів виявлення, а не для виконання під час запиту.
- Ексклюзивні види plugin вибираються через `plugins.slots.*`: `kind: "memory"` через `plugins.slots.memory`, `kind: "context-engine"` через `plugins.slots.contextEngine` (за замовчуванням `legacy`).
- Оголошуйте ексклюзивний вид plugin у цьому маніфесті. Runtime-запис `OpenClawPluginDefinition.kind` застарів і залишається лише як fallback сумісності для старіших plugins.
- Метадані env-var (`setup.providers[].envVars`, застарілі `providerAuthEnvVars` і `channelEnvVars`) є лише декларативними. Статус, аудит, валідація доставки cron та інші read-only поверхні все одно застосовують довіру до plugin і політику ефективної активації, перш ніж вважати env var налаштованою.
- Для метаданих runtime wizard, яким потрібен код провайдера, див. [runtime hooks провайдера](/uk/plugins/architecture-internals#provider-runtime-hooks).
- Якщо ваш plugin залежить від native modules, задокументуйте кроки збірки та будь-які вимоги allowlist менеджера пакетів (наприклад, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Пов’язане

<CardGroup cols={3}>
  <Card title="Створення plugins" href="/uk/plugins/building-plugins" icon="rocket">
    Початок роботи з plugins.
  </Card>
  <Card title="Архітектура Plugin" href="/uk/plugins/architecture" icon="diagram-project">
    Внутрішня архітектура та модель capabilities.
  </Card>
  <Card title="Огляд SDK" href="/uk/plugins/sdk-overview" icon="book">
    Довідник Plugin SDK та імпорти subpath.
  </Card>
</CardGroup>
