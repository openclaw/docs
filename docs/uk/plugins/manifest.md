---
read_when:
    - Ви створюєте Plugin для OpenClaw
    - Вам потрібно випустити схему конфігурації Plugin або налагодити помилки валідації Plugin
summary: Маніфест Plugin + вимоги до JSON-схеми (сувора перевірка конфігурації)
title: Маніфест Plugin
x-i18n:
    generated_at: "2026-05-02T02:49:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83fb98614783b679d6b49d2237148765708e5c5fc2ee40162d3ddd4752f763c2
    source_path: plugins/manifest.md
    workflow: 16
---

Ця сторінка стосується лише **нативного маніфесту Plugin OpenClaw**.

Сумісні структури бандлів див. у [бандлах Plugin](/uk/plugins/bundles).

Сумісні формати бандлів використовують інші файли маніфестів:

- Бандл Codex: `.codex-plugin/plugin.json`
- Бандл Claude: `.claude-plugin/plugin.json` або стандартна структура компонентів Claude
  без маніфесту
- Бандл Cursor: `.cursor-plugin/plugin.json`

OpenClaw також автоматично виявляє ці структури бандлів, але вони не перевіряються
за схемою `openclaw.plugin.json`, описаною тут.

Для сумісних бандлів OpenClaw зараз читає метадані бандла плюс оголошені
корені skill, корені команд Claude, стандартні значення `settings.json` бандла Claude,
стандартні значення LSP бандла Claude та підтримувані набори хуків, коли структура відповідає
очікуванням середовища виконання OpenClaw.

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
середовища виконання Plugin.

**Використовуйте його для:**

- ідентичності Plugin, перевірки конфігурації та підказок UI конфігурації
- метаданих автентифікації, онбордингу та налаштування (псевдонім, автоматичне ввімкнення, змінні середовища провайдера, варіанти автентифікації)
- підказок активації для поверхонь площини керування
- скороченого володіння сімейством моделей
- статичних знімків володіння можливостями (`contracts`)
- метаданих запуску QA, які спільний хост `openclaw qa` може перевіряти
- метаданих конфігурації для окремих каналів, об'єднаних у каталог і поверхні перевірки

**Не використовуйте його для:** реєстрації поведінки середовища виконання, оголошення точок входу коду
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

| Поле                                 | Обов'язкове | Тип                              | Що це означає                                                                                                                                                                                                                                     |
| ------------------------------------ | ----------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Так         | `string`                         | Канонічний ідентифікатор Plugin. Це ідентифікатор, що використовується в `plugins.entries.<id>`.                                                                                                                                                 |
| `configSchema`                       | Так         | `object`                         | Вбудована JSON Schema для конфігурації цього Plugin.                                                                                                                                                                                             |
| `enabledByDefault`                   | Ні          | `true`                           | Позначає bundled Plugin як увімкнений за замовчуванням. Опустіть це поле або встановіть будь-яке значення, відмінне від `true`, щоб залишити Plugin вимкненим за замовчуванням.                                                                  |
| `legacyPluginIds`                    | Ні          | `string[]`                       | Застарілі ідентифікатори, що нормалізуються до цього канонічного ідентифікатора Plugin.                                                                                                                                                         |
| `autoEnableWhenConfiguredProviders`  | Ні          | `string[]`                       | Ідентифікатори провайдерів, які мають автоматично вмикати цей Plugin, коли auth, config або refs моделей згадують їх.                                                                                                                           |
| `kind`                               | Ні          | `"memory"` \| `"context-engine"` | Оголошує ексклюзивний тип Plugin, що використовується `plugins.slots.*`.                                                                                                                                                                         |
| `channels`                           | Ні          | `string[]`                       | Ідентифікатори каналів, якими володіє цей Plugin. Використовується для виявлення та перевірки конфігурації.                                                                                                                                      |
| `providers`                          | Ні          | `string[]`                       | Ідентифікатори провайдерів, якими володіє цей Plugin.                                                                                                                                                                                            |
| `providerDiscoveryEntry`             | Ні          | `string`                         | Полегшений шлях до модуля виявлення провайдера, відносно кореня Plugin, для метаданих каталогу провайдерів у межах manifest, які можна завантажити без активації повного runtime Plugin.                                                       |
| `modelSupport`                       | Ні          | `object`                         | Стислі метадані родини моделей, що належать manifest і використовуються для автоматичного завантаження Plugin перед runtime.                                                                                                                     |
| `modelCatalog`                       | Ні          | `object`                         | Декларативні метадані каталогу моделей для провайдерів, якими володіє цей Plugin. Це контракт control plane для майбутнього read-only переліку, onboarding, вибору моделей, aliases і suppression без завантаження runtime Plugin.             |
| `modelPricing`                       | Ні          | `object`                         | Належна провайдеру політика зовнішнього пошуку цін. Використовуйте її, щоб виключити локальних/self-hosted провайдерів із віддалених каталогів цін або зіставити refs провайдера з ідентифікаторами каталогів OpenRouter/LiteLLM без hardcoding ідентифікаторів провайдерів у core. |
| `modelIdNormalization`               | Ні          | `object`                         | Належне провайдеру очищення alias/prefix ідентифікаторів моделей, яке має виконуватися до завантаження runtime провайдера.                                                                                                                       |
| `providerEndpoints`                  | Ні          | `object[]`                       | Належні manifest метадані endpoint host/baseUrl для маршрутів провайдера, які core має класифікувати до завантаження runtime провайдера.                                                                                                         |
| `providerRequest`                    | Ні          | `object`                         | Дешеві метадані родини провайдера та сумісності запитів, які використовуються generic політикою запитів до завантаження runtime провайдера.                                                                                                      |
| `cliBackends`                        | Ні          | `string[]`                       | Ідентифікатори CLI inference backend, якими володіє цей Plugin. Використовується для автоматичної активації під час запуску з явних refs конфігурації.                                                                                          |
| `syntheticAuthRefs`                  | Ні          | `string[]`                       | Refs провайдера або CLI backend, для яких належний Plugin synthetic auth hook має перевірятися під час холодного виявлення моделей до завантаження runtime.                                                                                      |
| `nonSecretAuthMarkers`               | Ні          | `string[]`                       | Належні bundled Plugin placeholder-значення API key, що представляють несекретний локальний, OAuth або ambient credential стан.                                                                                                                   |
| `commandAliases`                     | Ні          | `object[]`                       | Назви команд, якими володіє цей Plugin і які мають створювати діагностику конфігурації та CLI з урахуванням Plugin до завантаження runtime.                                                                                                      |
| `providerAuthEnvVars`                | Ні          | `Record<string, string[]>`       | Застарілі сумісні env-метадані для пошуку auth/status провайдера. Для нових Plugin віддавайте перевагу `setup.providers[].envVars`; OpenClaw усе ще читає це під час періоду deprecation.                                                       |
| `providerAuthAliases`                | Ні          | `Record<string, string>`         | Ідентифікатори провайдерів, які мають повторно використовувати інший ідентифікатор провайдера для auth lookup, наприклад coding provider, що спільно використовує API key базового провайдера та auth profiles.                                |
| `channelEnvVars`                     | Ні          | `Record<string, string[]>`       | Дешеві env-метадані каналу, які OpenClaw може перевірити без завантаження коду Plugin. Використовуйте це для env-driven налаштування каналу або auth surfaces, які мають бачити generic startup/config helpers.                                |
| `providerAuthChoices`                | Ні          | `object[]`                       | Дешеві метадані auth-choice для onboarding pickers, preferred-provider resolution і простого wiring CLI flags.                                                                                                                                     |
| `activation`                         | Ні          | `object`                         | Дешеві метадані activation planner для завантаження, спричиненого startup, provider, command, channel, route і capability. Лише метадані; runtime Plugin усе ще володіє фактичною поведінкою.                                                    |
| `setup`                              | Ні          | `object`                         | Дешеві дескриптори setup/onboarding, які discovery і setup surfaces можуть перевіряти без завантаження runtime Plugin.                                                                                                                           |
| `qaRunners`                          | Ні          | `object[]`                       | Дешеві дескриптори QA runner, що використовуються спільним host `openclaw qa` до завантаження runtime Plugin.                                                                                                                                    |
| `contracts`                          | Ні          | `object`                         | Статичний знімок bundled capability для external auth hooks, speech, realtime transcription, realtime voice, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search і tool ownership.                 |
| `mediaUnderstandingProviderMetadata` | Ні          | `Record<string, object>`         | Дешеві media-understanding defaults для ідентифікаторів провайдерів, оголошених у `contracts.mediaUnderstandingProviders`.                                                                                                                       |
| `channelConfigs`                     | Ні          | `Record<string, object>`         | Належні manifest метадані конфігурації каналу, об'єднані в discovery і validation surfaces до завантаження runtime.                                                                                                                              |
| `skills`                             | Ні          | `string[]`                       | Каталоги Skills для завантаження, відносно кореня Plugin.                                                                                                                                                                                        |
| `name`                               | Ні          | `string`                         | Зрозуміла для людини назва Plugin.                                                                                                                                                                                                                |
| `description`                        | Ні          | `string`                         | Короткий підсумок, що відображається на поверхнях Plugin.                                                                                                                                                                                        |
| `version`                            | Ні          | `string`                         | Інформаційна версія Plugin.                                                                                                                                                                                                                       |
| `uiHints`                            | Ні          | `Record<string, object>`         | UI labels, placeholders і sensitivity hints для полів конфігурації.                                                                                                                                                                               |

## Довідка providerAuthChoices

Кожен запис `providerAuthChoices` описує один onboarding або auth choice.
OpenClaw читає це до завантаження runtime провайдера.
Списки налаштування провайдера використовують ці manifest choices, setup choices,
отримані з descriptor, і install-catalog metadata без завантаження runtime провайдера.

| Поле                  | Обов’язково | Тип                                             | Що це означає                                                                                                                   |
| --------------------- | ----------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `provider`            | Так         | `string`                                        | Ідентифікатор провайдера, якому належить цей вибір.                                                                              |
| `method`              | Так         | `string`                                        | Ідентифікатор методу автентифікації, до якого потрібно спрямувати виконання.                                                     |
| `choiceId`            | Так         | `string`                                        | Стабільний ідентифікатор вибору автентифікації, який використовують потоки онбордингу та CLI.                                   |
| `choiceLabel`         | Ні          | `string`                                        | Мітка, яку бачить користувач. Якщо її пропущено, OpenClaw повертається до `choiceId`.                                            |
| `choiceHint`          | Ні          | `string`                                        | Короткий допоміжний текст для засобу вибору.                                                                                     |
| `assistantPriority`   | Ні          | `number`                                        | Нижчі значення сортуються раніше в інтерактивних засобах вибору, керованих асистентом.                                          |
| `assistantVisibility` | Ні          | `"visible"` \| `"manual-only"`                  | Приховує вибір із засобів вибору асистента, але й далі дозволяє ручний вибір у CLI.                                             |
| `deprecatedChoiceIds` | Ні          | `string[]`                                      | Застарілі ідентифікатори вибору, які мають перенаправляти користувачів до цього замінного вибору.                               |
| `groupId`             | Ні          | `string`                                        | Необов’язковий ідентифікатор групи для групування пов’язаних виборів.                                                           |
| `groupLabel`          | Ні          | `string`                                        | Мітка для цієї групи, яку бачить користувач.                                                                                     |
| `groupHint`           | Ні          | `string`                                        | Короткий допоміжний текст для групи.                                                                                             |
| `optionKey`           | Ні          | `string`                                        | Внутрішній ключ параметра для простих потоків автентифікації з одним прапорцем.                                                  |
| `cliFlag`             | Ні          | `string`                                        | Назва прапорця CLI, наприклад `--openrouter-api-key`.                                                                            |
| `cliOption`           | Ні          | `string`                                        | Повна форма параметра CLI, наприклад `--openrouter-api-key <key>`.                                                               |
| `cliDescription`      | Ні          | `string`                                        | Опис, який використовується в довідці CLI.                                                                                       |
| `onboardingScopes`    | Ні          | `Array<"text-inference" \| "image-generation">` | Визначає, на яких поверхнях онбордингу має з’являтися цей вибір. Якщо пропущено, типово використовується `["text-inference"]`. |

## Довідник commandAliases

Використовуйте `commandAliases`, коли Plugin володіє назвою команди середовища виконання, яку користувачі можуть
помилково додати в `plugins.allow` або спробувати запустити як кореневу команду CLI. OpenClaw
використовує ці метадані для діагностики без імпортування коду середовища виконання Plugin.

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

| Поле         | Обов’язково | Тип               | Що це означає                                                              |
| ------------ | ----------- | ----------------- | -------------------------------------------------------------------------- |
| `name`       | Так         | `string`          | Назва команди, яка належить цьому Plugin.                                  |
| `kind`       | Ні          | `"runtime-slash"` | Позначає псевдонім як слеш-команду чату, а не кореневу команду CLI.        |
| `cliCommand` | Ні          | `string`          | Пов’язана коренева команда CLI, яку можна запропонувати для операцій CLI, якщо така існує. |

## Довідник activation

Використовуйте `activation`, коли Plugin може дешево оголосити, які події площини керування
мають включати його до плану активації/завантаження.

Цей блок є метаданими планувальника, а не API життєвого циклу. Він не реєструє
поведінку середовища виконання, не замінює `register(...)` і не гарантує, що
код Plugin уже виконався. Планувальник активації використовує ці поля, щоб
звузити список кандидатів Plugin перед поверненням до наявних метаданих володіння в маніфесті,
як-от `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` і хуків.

Надавайте перевагу найвужчим метаданим, які вже описують володіння. Використовуйте
`providers`, `channels`, `commandAliases`, дескриптори налаштування або `contracts`,
коли ці поля виражають зв’язок. Використовуйте `activation` для додаткових
підказок планувальнику, які неможливо представити цими полями володіння.
Використовуйте верхньорівневий `cliBackends` для псевдонімів середовища виконання CLI, як-от `claude-cli`,
`codex-cli` або `google-gemini-cli`; `activation.onAgentHarnesses` призначений лише для
вбудованих ідентифікаторів агентних обв’язок, які ще не мають поля володіння.

Цей блок є лише метаданими. Він не реєструє поведінку середовища виконання і не
замінює `register(...)`, `setupEntry` чи інші точки входу середовища виконання/Plugin.
Поточні споживачі використовують його як підказку для звуження перед ширшим завантаженням Plugin, тому
відсутність метаданих активації не під час запуску зазвичай впливає лише на продуктивність; це
не має змінювати коректність, доки ще існують резервні варіанти володіння з маніфесту.

Кожен Plugin має навмисно встановлювати `activation.onStartup`. Установіть його в `true`
лише тоді, коли Plugin має запускатися під час запуску Gateway. Установіть його в `false`, коли
Plugin неактивний під час запуску й має завантажуватися лише за вужчими тригерами.
Пропуск `onStartup` більше не завантажує Plugin під час запуску неявно; використовуйте явні
метадані активації для запуску, каналу, конфігурації, агентної обв’язки, пам’яті або
інших вужчих тригерів активації.

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

| Поле               | Обов’язково | Тип                                                  | Що це означає                                                                                                                                                                           |
| ------------------ | ----------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | Ні          | `boolean`                                            | Явна активація під час запуску Gateway. Кожен Plugin має встановлювати це поле. `true` імпортує Plugin під час запуску; `false` залишає його ледачим щодо запуску, якщо інший відповідний тригер не вимагає завантаження. |
| `onProviders`      | Ні          | `string[]`                                           | Ідентифікатори провайдерів, які мають включати цей Plugin до планів активації/завантаження.                                                                                            |
| `onAgentHarnesses` | Ні          | `string[]`                                           | Ідентифікатори середовища виконання вбудованих агентних обв’язок, які мають включати цей Plugin до планів активації/завантаження. Використовуйте верхньорівневий `cliBackends` для псевдонімів бекендів CLI. |
| `onCommands`       | Ні          | `string[]`                                           | Ідентифікатори команд, які мають включати цей Plugin до планів активації/завантаження.                                                                                                  |
| `onChannels`       | Ні          | `string[]`                                           | Ідентифікатори каналів, які мають включати цей Plugin до планів активації/завантаження.                                                                                                 |
| `onRoutes`         | Ні          | `string[]`                                           | Види маршрутів, які мають включати цей Plugin до планів активації/завантаження.                                                                                                         |
| `onConfigPaths`    | Ні          | `string[]`                                           | Шляхи конфігурації відносно кореня, які мають включати цей Plugin до планів запуску/завантаження, коли шлях присутній і не вимкнений явно.                                             |
| `onCapabilities`   | Ні          | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Широкі підказки щодо можливостей, які використовує планування активації площини керування. Коли можливо, надавайте перевагу вужчим полям.                                             |

Поточні активні споживачі:

- Планування запуску Gateway використовує `activation.onStartup` для явного імпорту
  під час запуску
- планування CLI, ініційоване командою, повертається до застарілих
  `commandAliases[].cliCommand` або `commandAliases[].name`
- планування запуску середовища виконання агента використовує `activation.onAgentHarnesses` для
  вбудованих обв’язок і верхньорівневий `cliBackends[]` для псевдонімів середовища виконання CLI
- планування налаштування/каналу, ініційоване каналом, повертається до застарілого володіння
  `channels[]`, коли явні метадані активації каналу відсутні
- планування Plugin під час запуску використовує `activation.onConfigPaths` для неканальних кореневих
  поверхонь конфігурації, як-от блок `browser` вбудованого браузерного Plugin
- планування налаштування/середовища виконання, ініційоване провайдером, повертається до застарілого
  володіння `providers[]` і верхньорівневого `cliBackends[]`, коли явні метадані
  активації провайдера відсутні

Діагностика планувальника може відрізняти явні підказки активації від резервного
володіння з маніфесту. Наприклад, `activation-command-hint` означає, що
`activation.onCommands` збігся, тоді як `manifest-command-alias` означає, що
планувальник використав володіння `commandAliases` натомість. Ці мітки причин призначені для
діагностики хоста й тестів; автори Plugin мають продовжувати оголошувати метадані,
які найкраще описують володіння.

## Довідник qaRunners

Використовуйте `qaRunners`, коли Plugin додає один або кілька транспортних раннерів під
спільним коренем `openclaw qa`. Залишайте ці метадані дешевими й статичними; середовище
виконання Plugin і далі володіє фактичною реєстрацією CLI через легку
поверхню `runtime-api.ts`, яка експортує `qaRunnerCliRegistrations`.

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

| Поле          | Обов’язково | Тип      | Що це означає                                                                 |
| ------------- | ----------- | -------- | ----------------------------------------------------------------------------- |
| `commandName` | Так         | `string` | Підкоманда, змонтована під `openclaw qa`, наприклад `matrix`.                 |
| `description` | Ні          | `string` | Резервний текст довідки, який використовується, коли спільному хосту потрібна команда-заглушка. |

## Довідник setup

Використовуйте `setup`, коли поверхням налаштування та онбордингу потрібні дешеві метадані, що належать Plugin,
перед завантаженням середовища виконання.

```json
{
  "setup": {
    "providers": [
      {
        "id": "openai",
        "authMethods": ["api-key"],
        "envVars": ["OPENAI_API_KEY"],
        "authEvidence": [
          {
            "type": "local-file-with-env",
            "fileEnvVar": "OPENAI_CREDENTIALS_FILE",
            "requiresAllEnv": ["OPENAI_PROJECT"],
            "credentialMarker": "openai-local-credentials",
            "source": "openai local credentials"
          }
        ]
      }
    ],
    "cliBackends": ["openai-cli"],
    "configMigrations": ["legacy-openai-auth"],
    "requiresRuntime": false
  }
}
```

Верхньорівневий `cliBackends` залишається чинним і далі описує бекенди виведення CLI. `setup.cliBackends` — це специфічна для налаштування поверхня дескрипторів для потоків площини керування/налаштування, які мають залишатися лише метаданими.

Коли наявні `setup.providers` і `setup.cliBackends`, вони є бажаною поверхнею пошуку за дескрипторами для виявлення налаштування. Якщо дескриптор лише звужує кандидатний Plugin, а налаштування все ще потребує багатших runtime-хуків під час налаштування, задайте `requiresRuntime: true` і залиште `setup-api` як резервний шлях виконання.

OpenClaw також включає `setup.providers[].envVars` до загальних пошуків автентифікації провайдера та env-var. `providerAuthEnvVars` залишається підтримуваним через адаптер сумісності протягом вікна застарівання, але не вбудовані plugins, які все ще його використовують, отримують діагностику маніфесту. Нові plugins мають розміщувати метадані env для налаштування/статусу в `setup.providers[].envVars`.

OpenClaw також може виводити прості варіанти налаштування з `setup.providers[].authMethods`, коли запис налаштування відсутній або коли `setup.requiresRuntime: false` оголошує, що runtime налаштування не потрібний. Явні записи `providerAuthChoices` залишаються бажаними для власних міток, прапорців CLI, області onboarding і метаданих асистента.

Задавайте `requiresRuntime: false` лише тоді, коли цих дескрипторів достатньо для поверхні налаштування. OpenClaw розглядає явне `false` як контракт лише на основі дескрипторів і не виконуватиме `setup-api` або `openclaw.setupEntry` для пошуку налаштування. Якщо Plugin лише з дескрипторами все одно постачає один із цих runtime-записів налаштування, OpenClaw повідомляє додаткову діагностику й далі його ігнорує. Пропущений `requiresRuntime` зберігає застарілу резервну поведінку, щоб наявні plugins, які додали дескриптори без прапорця, не ламалися.

Оскільки пошук налаштування може виконувати належний Plugin код `setup-api`, нормалізовані значення `setup.providers[].id` і `setup.cliBackends[]` мають залишатися унікальними серед виявлених plugins. Неоднозначне володіння завершується закритою помилкою замість вибору переможця за порядком виявлення.

Коли runtime налаштування виконується, діагностика реєстру налаштування повідомляє про розбіжність дескрипторів, якщо `setup-api` реєструє провайдера або бекенд CLI, який не оголошено в дескрипторах маніфесту, або якщо дескриптор не має відповідної runtime-реєстрації. Ці діагностики є додатковими й не відхиляють застарілі plugins.

### Довідник setup.providers

| Поле          | Обов'язково | Тип        | Що це означає                                                                                              |
| ------------- | ----------- | ---------- | ---------------------------------------------------------------------------------------------------------- |
| `id`          | Так         | `string`   | Ідентифікатор провайдера, відкритий під час налаштування або onboarding. Тримайте нормалізовані ідентифікатори глобально унікальними. |
| `authMethods` | Ні          | `string[]` | Ідентифікатори методів налаштування/автентифікації, які цей провайдер підтримує без завантаження повного runtime. |
| `envVars`     | Ні          | `string[]` | Env vars, які загальні поверхні налаштування/статусу можуть перевіряти до завантаження runtime Plugin.     |
| `authEvidence` | Ні         | `object[]` | Дешеві локальні перевірки доказів автентифікації для провайдерів, які можуть автентифікуватися через несекретні маркери. |

`authEvidence` призначено для належних провайдеру локальних маркерів облікових даних, які можна перевірити без завантаження runtime-коду. Ці перевірки мають залишатися дешевими й локальними: без мережевих викликів, без читання keychain або secret-manager, без shell-команд і без перевірок API провайдера.

Підтримувані записи доказів:

| Поле              | Обов'язково | Тип        | Що це означає                                                                                                   |
| ----------------- | ----------- | ---------- | --------------------------------------------------------------------------------------------------------------- |
| `type`            | Так         | `string`   | Наразі `local-file-with-env`.                                                                                   |
| `fileEnvVar`      | Ні          | `string`   | Env var, що містить явний шлях до файлу облікових даних.                                                        |
| `fallbackPaths`   | Ні          | `string[]` | Локальні шляхи до файлів облікових даних, які перевіряються, коли `fileEnvVar` відсутня або порожня. Підтримує `${HOME}` і `${APPDATA}`. |
| `requiresAnyEnv`  | Ні          | `string[]` | Принаймні одна з перелічених env var має бути непорожньою, перш ніж доказ стане чинним.                         |
| `requiresAllEnv`  | Ні          | `string[]` | Кожна з перелічених env var має бути непорожньою, перш ніж доказ стане чинним.                                  |
| `credentialMarker` | Так        | `string`   | Несекретний маркер, що повертається, коли доказ наявний.                                                        |
| `source`          | Ні          | `string`   | Видима користувачу мітка джерела для виводу автентифікації/статусу.                                            |

### Поля setup

| Поле              | Обов'язково | Тип        | Що це означає                                                                                           |
| ----------------- | ----------- | ---------- | ------------------------------------------------------------------------------------------------------- |
| `providers`       | Ні          | `object[]` | Дескриптори налаштування провайдера, відкриті під час налаштування та onboarding.                       |
| `cliBackends`     | Ні          | `string[]` | Ідентифікатори бекендів під час налаштування, що використовуються для пошуку налаштування спершу за дескрипторами. Тримайте нормалізовані ідентифікатори глобально унікальними. |
| `configMigrations` | Ні         | `string[]` | Ідентифікатори міграцій конфігурації, що належать поверхні налаштування цього Plugin.                   |
| `requiresRuntime` | Ні          | `boolean`  | Чи налаштуванню все ще потрібне виконання `setup-api` після пошуку за дескрипторами.                    |

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

| Поле          | Тип        | Що це означає                         |
| ------------- | ---------- | ------------------------------------- |
| `label`       | `string`   | Видима користувачу мітка поля.        |
| `help`        | `string`   | Короткий допоміжний текст.            |
| `tags`        | `string[]` | Необов'язкові теги UI.                |
| `advanced`    | `boolean`  | Позначає поле як розширене.           |
| `sensitive`   | `boolean`  | Позначає поле як секретне або чутливе. |
| `placeholder` | `string`   | Текст placeholder для полів форми.    |

## Довідник contracts

Використовуйте `contracts` лише для статичних метаданих володіння capability, які OpenClaw може читати без імпорту runtime Plugin.

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

Кожен список є необов'язковим:

| Поле                             | Тип        | Що це означає                                                                 |
| -------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Ідентифікатори фабрик розширень app-server Codex, наразі `codex-app-server`.  |
| `agentToolResultMiddleware`      | `string[]` | Runtime-ідентифікатори, для яких вбудований Plugin може реєструвати middleware результатів інструментів. |
| `externalAuthProviders`          | `string[]` | Ідентифікатори провайдерів, чиїм хуком зовнішнього профілю автентифікації володіє цей Plugin. |
| `speechProviders`                | `string[]` | Ідентифікатори провайдерів мовлення, якими володіє цей Plugin.                |
| `realtimeTranscriptionProviders` | `string[]` | Ідентифікатори провайдерів realtime-транскрипції, якими володіє цей Plugin.   |
| `realtimeVoiceProviders`         | `string[]` | Ідентифікатори realtime-voice провайдерів, якими володіє цей Plugin.          |
| `memoryEmbeddingProviders`       | `string[]` | Ідентифікатори провайдерів memory embedding, якими володіє цей Plugin.        |
| `mediaUnderstandingProviders`    | `string[]` | Ідентифікатори media-understanding провайдерів, якими володіє цей Plugin.     |
| `imageGenerationProviders`       | `string[]` | Ідентифікатори image-generation провайдерів, якими володіє цей Plugin.        |
| `videoGenerationProviders`       | `string[]` | Ідентифікатори video-generation провайдерів, якими володіє цей Plugin.        |
| `webFetchProviders`              | `string[]` | Ідентифікатори web-fetch провайдерів, якими володіє цей Plugin.               |
| `webSearchProviders`             | `string[]` | Ідентифікатори web-search провайдерів, якими володіє цей Plugin.              |
| `migrationProviders`             | `string[]` | Ідентифікатори провайдерів імпорту, якими цей Plugin володіє для `openclaw migrate`. |
| `tools`                          | `string[]` | Назви інструментів агента, якими цей Plugin володіє для перевірок вбудованих контрактів. |

`contracts.embeddedExtensionFactories` збережено для вбудованих фабрик розширень лише для app-server Codex. Вбудовані трансформації результатів інструментів натомість мають оголошувати `contracts.agentToolResultMiddleware` і реєструватися через `api.registerAgentToolResultMiddleware(...)`. Зовнішні plugins не можуть реєструвати middleware результатів інструментів, бо ця межа може переписувати високодостовірний вивід інструментів до того, як його побачить модель.

Plugins провайдерів, які реалізують `resolveExternalAuthProfiles`, мають оголошувати `contracts.externalAuthProviders`. Plugins без цього оголошення все ще проходять через застарілий резервний шлях сумісності, але цей резервний шлях повільніший і буде вилучений після вікна міграції.

Вбудовані провайдери memory embedding мають оголошувати `contracts.memoryEmbeddingProviders` для кожного ідентифікатора адаптера, який вони відкривають, включно з вбудованими адаптерами, такими як `local`. Автономні шляхи CLI використовують цей контракт маніфесту, щоб завантажити лише належний Plugin до того, як повний runtime Gateway зареєструє провайдерів.

## Довідник mediaUnderstandingProviderMetadata

Використовуйте `mediaUnderstandingProviderMetadata`, коли media-understanding провайдер має стандартні моделі, пріоритет резервного auto-auth або нативну підтримку документів, які загальним core-помічникам потрібні до завантаження runtime. Ключі також мають бути оголошені в `contracts.mediaUnderstandingProviders`.

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
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Медіаможливості, які надає цей провайдер.                                    |
| `defaultModels`        | `Record<string, string>`            | Типові відповідності можливостей моделям, що використовуються, коли конфігурація не задає модель. |
| `autoPriority`         | `Record<string, number>`            | Менші числа сортуються раніше для автоматичного резервного вибору провайдера на основі облікових даних. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Нативні вхідні документи, які підтримує провайдер.                           |

## Довідник channelConfigs

Використовуйте `channelConfigs`, коли Plugin каналу потребує дешевих метаданих конфігурації до
завантаження runtime. Виявлення налаштування/стану каналу лише для читання може використовувати ці метадані
безпосередньо для налаштованих зовнішніх каналів, коли запис налаштування недоступний, або
коли `setup.requiresRuntime: false` оголошує, що runtime налаштування не потрібен.

`channelConfigs` — це метадані маніфесту Plugin, а не новий розділ користувацької конфігурації
верхнього рівня. Користувачі все ще налаштовують екземпляри каналів у `channels.<channel-id>`.
OpenClaw читає метадані маніфесту, щоб вирішити, який Plugin володіє цим налаштованим
каналом, до виконання runtime-коду Plugin.

Для Plugin каналу `configSchema` і `channelConfigs` описують різні
шляхи:

- `configSchema` перевіряє `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` перевіряє `channels.<channel-id>`

Небандловані Plugins, які оголошують `channels[]`, також мають оголошувати відповідні
записи `channelConfigs`. Без них OpenClaw все ще може завантажити Plugin, але
схема конфігурації холодного шляху, налаштування та поверхні Control UI не можуть знати
форму параметрів, що належать каналу, доки не виконається runtime Plugin.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` і
`nativeSkillsAutoEnabled` можуть оголошувати статичні типові значення `auto` для перевірок конфігурації команд,
які виконуються до завантаження runtime каналу. Бандловані канали також можуть публікувати
ті самі типові значення через `package.json#openclaw.channel.commands` поряд з
іншими метаданими каталогу каналів, що належать пакету.

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
| `uiHints`     | `Record<string, object>` | Необов’язкові мітки UI, заповнювачі та підказки чутливості для цього розділу конфігурації каналу. |
| `label`       | `string`                 | Мітка каналу, що додається до поверхонь вибору й інспекції, коли runtime-метадані ще не готові. |
| `description` | `string`                 | Короткий опис каналу для поверхонь інспекції та каталогу.                                  |
| `commands`    | `object`                 | Статичні типові значення auto для нативних команд і нативних Skills у перевірках конфігурації до runtime. |
| `preferOver`  | `string[]`               | Ідентифікатори застарілих або нижчопріоритетних Plugins, які цей канал має випереджати на поверхнях вибору. |

### Заміна іншого Plugin каналу

Використовуйте `preferOver`, коли ваш Plugin є бажаним власником для ідентифікатора каналу, який
також може надавати інший Plugin. Поширені випадки — перейменований ідентифікатор Plugin,
окремий Plugin, що замінює бандлований Plugin, або підтримуваний форк, який
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

Коли `channels.chat` налаштовано, OpenClaw розглядає і ідентифікатор каналу, і
ідентифікатор бажаного Plugin. Якщо нижчопріоритетний Plugin був вибраний лише тому, що
він бандлований або ввімкнений за замовчуванням, OpenClaw вимикає його в ефективній
runtime-конфігурації, щоб один Plugin володів каналом і його інструментами. Явний вибір користувача
все одно має перевагу: якщо користувач явно вмикає обидва Plugins, OpenClaw
зберігає цей вибір і повідомляє діагностику дубльованих каналів/інструментів замість
мовчазної зміни запитаного набору Plugins.

Обмежуйте `preferOver` ідентифікаторами Plugins, які справді можуть надавати той самий канал.
Це не загальне поле пріоритету і воно не перейменовує ключі користувацької конфігурації.

## Довідник modelSupport

Використовуйте `modelSupport`, коли OpenClaw має визначати ваш провайдерський Plugin з
коротких ідентифікаторів моделей, як-от `gpt-5.5` або `claude-sonnet-4.6`, до завантаження runtime
Plugin.

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
- якщо збігаються один небандлований Plugin і один бандлований Plugin, перемагає небандлований
  Plugin
- решта неоднозначностей ігнорується, доки користувач або конфігурація не задасть провайдера

Поля:

| Поле            | Тип        | Що це означає                                                                  |
| --------------- | ---------- | ------------------------------------------------------------------------------ |
| `modelPrefixes` | `string[]` | Префікси, що зіставляються через `startsWith` із короткими ідентифікаторами моделей. |
| `modelPatterns` | `string[]` | Джерела Regex, що зіставляються з короткими ідентифікаторами моделей після вилучення суфікса профілю. |

## Довідник modelCatalog

Використовуйте `modelCatalog`, коли OpenClaw має знати метадані моделей провайдера до
завантаження runtime Plugin. Це джерело, що належить маніфесту, для фіксованих рядків каталогу,
псевдонімів провайдера, правил придушення та режиму виявлення. Runtime-оновлення
все ще належить runtime-коду провайдера, але маніфест повідомляє ядру, коли runtime
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

| Поле           | Тип                                                      | Що це означає                                                                                               |
| -------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | Рядки каталогу для ідентифікаторів провайдерів, що належать цьому Plugin. Ключі також мають бути в `providers` верхнього рівня. |
| `aliases`      | `Record<string, object>`                                 | Псевдоніми провайдерів, які мають розв’язуватися у власний провайдер для планування каталогу або придушення. |
| `suppressions` | `object[]`                                               | Рядки моделей з іншого джерела, які цей Plugin придушує з причини, специфічної для провайдера.              |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Чи можна читати каталог провайдера з метаданих маніфесту, оновлювати його в кеш або чи потрібен runtime.     |

`aliases` бере участь у пошуку власника провайдера для планування каталогу моделей.
Цілі псевдонімів мають бути провайдерами верхнього рівня, що належать тому самому Plugin. Коли
список, відфільтрований за провайдером, використовує псевдонім, OpenClaw може прочитати маніфест власника і
застосувати перевизначення API/base URL псевдоніма без завантаження runtime провайдера.
Псевдоніми не розгортають нефільтровані списки каталогу; широкі списки виводять лише
рядки канонічного провайдера-власника.

`suppressions` замінює старий runtime-хук провайдера `suppressBuiltInModel`.
Записи придушення враховуються лише тоді, коли провайдер належить Plugin або
оголошений як ключ `modelCatalog.aliases`, що вказує на власного провайдера. Runtime-хуки
придушення більше не викликаються під час розв’язання моделі.

Поля провайдера:

| Поле     | Тип                      | Що це означає                                                     |
| --------- | ------------------------ | ----------------------------------------------------------------- |
| `baseUrl` | `string`                 | Необов’язковий типовий базовий URL для моделей у цьому каталозі провайдера. |
| `api`     | `ModelApi`               | Необов’язковий типовий API-адаптер для моделей у цьому каталозі провайдера. |
| `headers` | `Record<string, string>` | Необов’язкові статичні заголовки, що застосовуються до цього каталогу провайдера. |
| `models`  | `object[]`               | Обов’язкові рядки моделей. Рядки без `id` ігноруються.            |

Поля моделі:

| Поле           | Тип                                                            | Що це означає                                                                |
| --------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `id`            | `string`                                                       | Локальний для провайдера ідентифікатор моделі, без префікса `provider/`.      |
| `name`          | `string`                                                       | Необов’язкова відображувана назва.                                           |
| `api`           | `ModelApi`                                                     | Необов’язкове перевизначення API для окремої моделі.                         |
| `baseUrl`       | `string`                                                       | Необов’язкове перевизначення базової URL-адреси для окремої моделі.          |
| `headers`       | `Record<string, string>`                                       | Необов’язкові статичні заголовки для окремої моделі.                         |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Модальності, які приймає модель.                                             |
| `reasoning`     | `boolean`                                                      | Чи надає модель поведінку reasoning.                                         |
| `contextWindow` | `number`                                                       | Нативне контекстне вікно провайдера.                                         |
| `contextTokens` | `number`                                                       | Необов’язкове ефективне обмеження контексту під час виконання, якщо воно відрізняється від `contextWindow`. |
| `maxTokens`     | `number`                                                       | Максимальна кількість вихідних токенів, якщо відома.                         |
| `cost`          | `object`                                                       | Необов’язкова ціна в USD за мільйон токенів, зокрема необов’язкове `tieredPricing`. |
| `compat`        | `object`                                                       | Необов’язкові прапорці сумісності, що відповідають сумісності конфігурації моделей OpenClaw. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Статус у списку. Пригнічуйте лише тоді, коли рядок узагалі не має з’являтися. |
| `statusReason`  | `string`                                                       | Необов’язкова причина, що показується зі статусом, відмінним від available.  |
| `replaces`      | `string[]`                                                     | Старіші локальні для провайдера ідентифікатори моделей, які ця модель замінює. |
| `replacedBy`    | `string`                                                       | Локальний для провайдера ідентифікатор моделі-замінника для застарілих рядків. |
| `tags`          | `string[]`                                                     | Стабільні теги, які використовують засоби вибору й фільтри.                  |

Поля пригнічення:

| Поле                       | Тип        | Що це означає                                                                                            |
| -------------------------- | ---------- | -------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Ідентифікатор провайдера для upstream-рядка, який треба пригнітити. Має належати цьому plugin або бути оголошеним як належний alias. |
| `model`                    | `string`   | Локальний для провайдера ідентифікатор моделі, який треба пригнітити.                                    |
| `reason`                   | `string`   | Необов’язкове повідомлення, що показується, коли пригнічений рядок запитують напряму.                    |
| `when.baseUrlHosts`        | `string[]` | Необов’язковий список ефективних хостів базової URL-адреси провайдера, потрібних для застосування пригнічення. |
| `when.providerConfigApiIn` | `string[]` | Необов’язковий список точних значень `api` конфігурації провайдера, потрібних для застосування пригнічення. |

Не розміщуйте дані лише часу виконання в `modelCatalog`. Використовуйте `static` лише тоді, коли
рядки маніфесту достатньо повні, щоб поверхні списків із фільтрацією за провайдером і засоби вибору могли пропускати
виявлення registry/runtime. Використовуйте `refreshable`, коли рядки маніфесту корисні
як початкові елементи списку або доповнення, але оновлення/кеш може додати більше рядків пізніше;
рядки refreshable самі по собі не є авторитетними. Використовуйте `runtime`, коли OpenClaw
має завантажити runtime провайдера, щоб знати список.

## Довідник modelIdNormalization

Використовуйте `modelIdNormalization` для дешевого очищення ідентифікаторів моделей, що належить провайдеру і має
відбутися до завантаження runtime провайдера. Це зберігає alias-и, як-от короткі назви моделей,
локальні для провайдера legacy-ідентифікатори та правила префіксів проксі, у маніфесті plugin-власника
замість таблиць вибору моделей у core.

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

| Поле                                 | Тип                     | Що це означає                                                                             |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Точні alias-и ідентифікаторів моделей без урахування регістру. Значення повертаються як записані. |
| `stripPrefixes`                      | `string[]`              | Префікси, які треба вилучити перед пошуком alias; корисно для legacy-дублювання provider/model. |
| `prefixWhenBare`                     | `string`                | Префікс, який треба додати, коли нормалізований ідентифікатор моделі ще не містить `/`.   |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Умовні правила префіксів для bare-ідентифікаторів після пошуку alias, ключовані за `modelPrefix` і `prefix`. |

## Довідник providerEndpoints

Використовуйте `providerEndpoints` для класифікації endpoint-ів, яку загальна політика запитів
має знати до завантаження runtime провайдера. Core усе ще визначає значення кожного
`endpointClass`; маніфести plugin володіють метаданими хоста й базової URL-адреси.

Поля endpoint-а:

| Поле                           | Тип        | Що це означає                                                                                  |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Відомий core-клас endpoint-а, наприклад `openrouter`, `moonshot-native` або `google-vertex`.   |
| `hosts`                        | `string[]` | Точні імена хостів, що відповідають класу endpoint-а.                                          |
| `hostSuffixes`                 | `string[]` | Суфікси хостів, що відповідають класу endpoint-а. Додавайте префікс `.` для зіставлення лише суфікса домену. |
| `baseUrls`                     | `string[]` | Точні нормалізовані базові HTTP(S) URL-адреси, що відповідають класу endpoint-а.               |
| `googleVertexRegion`           | `string`   | Статичний регіон Google Vertex для точних глобальних хостів.                                   |
| `googleVertexRegionHostSuffix` | `string`   | Суфікс, який треба вилучити з відповідних хостів, щоб відкрити префікс регіону Google Vertex.  |

## Довідник providerRequest

Використовуйте `providerRequest` для дешевих метаданих сумісності запитів, потрібних загальній
політиці запитів без завантаження runtime провайдера. Залишайте специфічне для поведінки
переписування payload у runtime hooks провайдера або спільних helper-ах родини провайдерів.

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

| Поле                  | Тип          | Що це означає                                                                        |
| --------------------- | ------------ | ------------------------------------------------------------------------------------ |
| `family`              | `string`     | Мітка родини провайдера, яку використовують загальні рішення й діагностика сумісності запитів. |
| `compatibilityFamily` | `"moonshot"` | Необов’язковий bucket сумісності родини провайдера для спільних helper-ів запитів.   |
| `openAICompletions`   | `object`     | Прапорці запитів completions, сумісних з OpenAI, наразі `supportsStreamingUsage`.    |

## Довідник modelPricing

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

| Поле         | Тип               | Що це означає                                                                                      |
| ------------ | ----------------- | -------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Установіть `false` для локальних/self-hosted провайдерів, які ніколи не мають отримувати ціни OpenRouter або LiteLLM. |
| `openRouter` | `false \| object` | Відображення для пошуку цін OpenRouter. `false` вимикає пошук OpenRouter для цього провайдера.     |
| `liteLLM`    | `false \| object` | Відображення для пошуку цін LiteLLM. `false` вимикає пошук LiteLLM для цього провайдера.           |

Поля джерела:

| Поле                       | Тип                | Що це означає                                                                                                        |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Ідентифікатор провайдера в зовнішньому каталозі, коли він відрізняється від ідентифікатора провайдера OpenClaw, наприклад `z-ai` для провайдера `zai`. |
| `passthroughProviderModel` | `boolean`          | Розглядайте ідентифікатори моделей зі скісною рискою як вкладені посилання provider/model; корисно для проксі-провайдерів, як-от OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Додаткові варіанти ідентифікаторів моделей зовнішнього каталогу. `version-dots` пробує ідентифікатори версій із крапками, як-от `claude-opus-4.6`. |

### OpenClaw Provider Index

OpenClaw Provider Index — це preview-метадані, що належать OpenClaw, для провайдерів,
чиї plugins можуть ще не бути встановлені. Він не є частиною маніфесту plugin.
Маніфести plugin залишаються авторитетним джерелом для встановлених plugin. Provider Index — це
внутрішній fallback-контракт, який майбутні поверхні installable-provider і pre-install
model picker використовуватимуть, коли plugin провайдера не встановлено.

Порядок авторитетності каталогу:

1. Конфігурація користувача.
2. Маніфест установленого plugin `modelCatalog`.
3. Кеш каталогу моделей після явного оновлення.
4. Preview-рядки OpenClaw Provider Index.

Індекс провайдерів не повинен містити секрети, увімкнений стан, runtime hooks або
актуальні дані моделей, специфічні для облікового запису. Його preview-каталоги використовують ту саму
форму рядка провайдера `modelCatalog`, що й маніфести Plugin, але мають залишатися обмеженими
стабільними метаданими відображення, якщо поля runtime adapter, як-от `api`,
`baseUrl`, ціни або прапорці сумісності, не підтримуються навмисно узгодженими з
маніфестом установленого Plugin. Провайдери з актуальним виявленням `/models` мають
записувати оновлені рядки через явний шлях кешу каталогу моделей, а не
змушувати звичайний listing або onboarding викликати API провайдера.

Записи Індексу провайдерів також можуть містити метадані installable-plugin для провайдерів,
чий Plugin переміщено з core або який інакше ще не встановлено. Ці
метадані віддзеркалюють патерн каталогу каналів: назви пакета, npm install spec,
очікуваної цілісності та дешевих міток вибору автентифікації достатньо, щоб показати
опцію installable setup. Після встановлення Plugin його маніфест перемагає, а
запис Індексу провайдерів ігнорується для цього провайдера.

Застарілі capability-ключі верхнього рівня вважаються deprecated. Використовуйте `openclaw doctor --fix`, щоб
перемістити `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` і `webSearchProviders` під `contracts`; звичайне
завантаження маніфесту більше не трактує ці поля верхнього рівня як ownership
capability.

## Маніфест проти package.json

Ці два файли виконують різні завдання:

| Файл                   | Для чого використовувати                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Виявлення, валідація конфігурації, метадані вибору автентифікації та UI-підказки, які мають існувати до запуску коду Plugin                         |
| `package.json`         | Метадані npm, встановлення залежностей і блок `openclaw`, що використовується для entrypoints, install gating, setup або метаданих каталогу |

Якщо ви не впевнені, де мають бути певні метадані, користуйтеся таким правилом:

- якщо OpenClaw має знати це перед завантаженням коду Plugin, помістіть це в `openclaw.plugin.json`
- якщо це стосується пакування, entry files або поведінки npm install, помістіть це в `package.json`

### Поля package.json, які впливають на виявлення

Деякі pre-runtime метадані Plugin навмисно розміщуються в `package.json` у
блоці `openclaw`, а не в `openclaw.plugin.json`.

Важливі приклади:

| Поле                                                             | Що воно означає                                                                                                                                                                        |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | Оголошує native entrypoints Plugin. Має залишатися всередині директорії пакета Plugin.                                                                                                   |
| `openclaw.runtimeExtensions`                                      | Оголошує built JavaScript runtime entrypoints для встановлених пакетів. Має залишатися всередині директорії пакета Plugin.                                                                 |
| `openclaw.setupEntry`                                             | Легкий setup-only entrypoint, що використовується під час onboarding, відкладеного запуску каналу та read-only статусу каналу/виявлення SecretRef. Має залишатися всередині директорії пакета Plugin. |
| `openclaw.runtimeSetupEntry`                                      | Оголошує built JavaScript setup entrypoint для встановлених пакетів. Потребує `setupEntry`, має існувати й має залишатися всередині директорії пакета Plugin.                         |
| `openclaw.channel`                                                | Дешеві метадані каталогу каналів, як-от labels, docs paths, aliases і selection copy.                                                                                                 |
| `openclaw.channel.commands`                                       | Статичні native command і native skill auto-default метадані, які використовуються поверхнями config, audit і command-list до завантаження channel runtime.                                          |
| `openclaw.channel.configuredState`                                | Легкі метадані перевірки configured-state, що можуть відповісти, «чи вже існує env-only setup?» без завантаження повного channel runtime.                                         |
| `openclaw.channel.persistedAuthState`                             | Легкі метадані перевірки persisted-auth, що можуть відповісти, «чи вже є щось авторизоване?» без завантаження повного channel runtime.                                               |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Підказки install/update для bundled і зовні опублікованих Plugins.                                                                                                                   |
| `openclaw.install.defaultChoice`                                  | Бажаний шлях встановлення, коли доступно кілька джерел встановлення.                                                                                                                  |
| `openclaw.install.minHostVersion`                                 | Мінімальна підтримувана версія OpenClaw host, з semver floor на кшталт `>=2026.3.22` або `>=2026.5.1-beta.1`.                                                                             |
| `openclaw.install.expectedIntegrity`                              | Очікуваний рядок цілісності npm dist, наприклад `sha512-...`; install і update flows перевіряють отриманий артефакт за ним.                                                            |
| `openclaw.install.allowInvalidConfigRecovery`                     | Дозволяє вузький шлях recovery з перевстановленням bundled-plugin, коли конфігурація недійсна.                                                                                                       |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Дає змогу setup-only поверхням каналу завантажуватися перед повним Plugin каналу під час запуску.                                                                                                 |

Метадані маніфесту визначають, які варіанти provider/channel/setup з’являються в
onboarding перед завантаженням runtime. `package.json#openclaw.install` повідомляє
onboarding, як отримати або увімкнути цей Plugin, коли користувач вибирає один із цих
варіантів. Не переміщуйте install hints у `openclaw.plugin.json`.

`openclaw.install.minHostVersion` застосовується під час install і завантаження
реєстру маніфестів для non-bundled джерел Plugin. Недійсні значення відхиляються;
новіші, але дійсні значення пропускають external Plugins на старіших hosts. Bundled source
Plugins вважаються co-versioned із checkout host.

Точне закріплення npm-версії вже міститься в `npmSpec`, наприклад
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Офіційні external catalog
entries мають поєднувати точні specs з `expectedIntegrity`, щоб update flows fail
closed, якщо отриманий npm artifact більше не відповідає pinned release.
Interactive onboarding досі пропонує trusted registry npm specs, включно з bare
package names і dist-tags, для сумісності. Catalog diagnostics можуть
розрізняти exact, floating, integrity-pinned, missing-integrity, package-name
mismatch і invalid default-choice sources. Вони також попереджають, коли
`expectedIntegrity` присутній, але немає дійсного npm source, який він може pin.
Коли `expectedIntegrity` присутній,
install/update flows застосовують його; коли його пропущено, registry resolution
записується без integrity pin.

Channel Plugins мають надавати `openclaw.setupEntry`, коли status, channel list
або SecretRef scans мають ідентифікувати налаштовані облікові записи без завантаження повного
runtime. Setup entry має надавати метадані каналу разом із setup-safe config,
status і secrets adapters; залишайте network clients, gateway listeners і
transport runtimes у головному extension entrypoint.

Поля runtime entrypoint не перевизначають перевірки меж пакета для source
entrypoint fields. Наприклад, `openclaw.runtimeExtensions` не може зробити
escaping path `openclaw.extensions` придатним для завантаження.

`openclaw.install.allowInvalidConfigRecovery` навмисно вузький. Він не
робить довільні зламані configs installable. Наразі він лише дозволяє install
flows відновлюватися після конкретних застарілих помилок upgrade bundled-plugin, як-от
відсутній шлях bundled Plugin або застарілий запис `channels.<id>` для того самого
bundled Plugin. Непов’язані помилки config все одно блокують install і спрямовують операторів
до `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` — це metadata пакета для крихітного checker
module:

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

Використовуйте це, коли setup, doctor, status або read-only presence flows потребують дешевої
yes/no auth probe до завантаження повного Plugin каналу. Persisted auth state —
це не configured channel state: не використовуйте ці метадані для auto-enable Plugins,
repair runtime dependencies або вирішення, чи має завантажуватися channel runtime.
Target export має бути невеликою функцією, що читає лише persisted state; не
спрямовуйте її через повний channel runtime barrel.

`openclaw.channel.configuredState` має таку саму форму для дешевих env-only
configured checks:

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

Використовуйте це, коли канал може відповісти configured-state з env або інших невеликих
non-runtime inputs. Якщо перевірка потребує повного config resolution або справжнього
channel runtime, залишайте цю логіку в hook Plugin `config.hasConfiguredState`.

## Пріоритет виявлення (дублікати ідентифікаторів Plugin)

OpenClaw виявляє Plugins з кількох roots (bundled, global install, workspace, явні config-selected paths). Якщо два виявлені елементи мають той самий `id`, зберігається лише маніфест із **найвищим пріоритетом**; дублікати з нижчим пріоритетом відкидаються замість завантаження поруч із ним.

Пріоритет, від найвищого до найнижчого:

1. **Config-selected** — шлях, явно закріплений у `plugins.entries.<id>`
2. **Bundled** — Plugins, що постачаються з OpenClaw
3. **Global install** — Plugins, встановлені в глобальний корінь Plugin OpenClaw
4. **Workspace** — Plugins, виявлені відносно поточного workspace

Наслідки:

- Forked або застаріла копія bundled Plugin, що лежить у workspace, не shadow bundled build.
- Щоб справді перевизначити bundled Plugin локальним, закріпіть його через `plugins.entries.<id>`, щоб він переміг за пріоритетом, а не покладайтеся на workspace discovery.
- Відкидання дублікатів логуються, щоб Doctor і startup diagnostics могли вказати на відкинуту копію.

## Вимоги JSON Schema

- **Кожен Plugin має постачати JSON Schema**, навіть якщо він не приймає config.
- Порожня schema прийнятна (наприклад, `{ "type": "object", "additionalProperties": false }`).
- Schemas валідуються під час читання/запису config, а не під час runtime.

## Поведінка валідації

- Невідомі ключі `channels.*` є **помилками**, якщо тільки ідентифікатор каналу не оголошено в
  маніфесті plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` і `plugins.slots.*`
  мають посилатися на **виявлювані** ідентифікатори plugin. Невідомі ідентифікатори є **помилками**.
- Якщо plugin встановлено, але він має пошкоджений або відсутній маніфест чи схему,
  валідація завершується невдало, а Doctor повідомляє про помилку plugin.
- Якщо конфігурація plugin існує, але plugin **вимкнено**, конфігурація зберігається, а
  **попередження** відображається в Doctor і журналах.

Див. [довідник із конфігурації](/uk/gateway/configuration), щоб переглянути повну схему `plugins.*`.

## Примітки

- Маніфест є **обов’язковим для нативних plugin OpenClaw**, зокрема для завантажень із локальної файлової системи. Runtime все одно завантажує модуль plugin окремо; маніфест потрібен лише для виявлення й валідації.
- Нативні маніфести розбираються за допомогою JSON5, тому коментарі, кінцеві коми та ключі без лапок приймаються, якщо підсумкове значення все одно є об’єктом.
- Завантажувач маніфестів читає лише документовані поля маніфесту. Уникайте власних ключів верхнього рівня.
- `channels`, `providers`, `cliBackends` і `skills` можна не вказувати, якщо plugin вони не потрібні.
- `providerDiscoveryEntry` має залишатися легковагим і не повинен імпортувати широкий runtime-код; використовуйте його для статичних метаданих каталогу провайдерів або вузьких дескрипторів виявлення, а не для виконання під час запиту.
- Ексклюзивні види plugin вибираються через `plugins.slots.*`: `kind: "memory"` через `plugins.slots.memory`, `kind: "context-engine"` через `plugins.slots.contextEngine` (за замовчуванням `legacy`).
- Оголошуйте ексклюзивний вид plugin у цьому маніфесті. Runtime-запис `OpenClawPluginDefinition.kind` застарів і залишається лише як резервний варіант сумісності для старіших plugin.
- Метадані змінних середовища (`setup.providers[].envVars`, застарілі `providerAuthEnvVars` і `channelEnvVars`) є лише декларативними. Статус, аудит, валідація доставки cron та інші поверхні лише для читання все одно застосовують довіру до plugin і політику ефективної активації, перш ніж вважати змінну середовища налаштованою.
- Для runtime-метаданих майстра, яким потрібен код провайдера, див. [runtime-хуки провайдера](/uk/plugins/architecture-internals#provider-runtime-hooks).
- Якщо ваш plugin залежить від нативних модулів, задокументуйте кроки збирання та будь-які вимоги до allowlist менеджера пакетів (наприклад, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Пов’язане

<CardGroup cols={3}>
  <Card title="Створення plugin" href="/uk/plugins/building-plugins" icon="rocket">
    Початок роботи з plugin.
  </Card>
  <Card title="Архітектура plugin" href="/uk/plugins/architecture" icon="diagram-project">
    Внутрішня архітектура та модель можливостей.
  </Card>
  <Card title="Огляд SDK" href="/uk/plugins/sdk-overview" icon="book">
    Довідник Plugin SDK та імпорти підшляхів.
  </Card>
</CardGroup>
