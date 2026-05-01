---
read_when:
    - Ви створюєте Plugin для OpenClaw
    - Потрібно випустити схему конфігурації Plugin або налагодити помилки валідації Plugin
summary: Маніфест Plugin + вимоги до схеми JSON (сувора перевірка конфігурації)
title: Маніфест Plugin
x-i18n:
    generated_at: "2026-05-01T21:40:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: cb611c247a395ad03bef21fe5cf801f66f4529980521996ddda11453b5a0eab2
    source_path: plugins/manifest.md
    workflow: 16
---

Ця сторінка стосується лише **нативного маніфесту Plugin OpenClaw**.

Про сумісні макети пакетів див. [пакети Plugin](/uk/plugins/bundles).

Сумісні формати пакетів використовують інші файли маніфестів:

- Пакет Codex: `.codex-plugin/plugin.json`
- Пакет Claude: `.claude-plugin/plugin.json` або стандартний макет компонента Claude
  без маніфесту
- Пакет Cursor: `.cursor-plugin/plugin.json`

OpenClaw також автоматично виявляє ці макети пакетів, але вони не перевіряються
за схемою `openclaw.plugin.json`, описаною тут.

Для сумісних пакетів OpenClaw наразі читає метадані пакета та оголошені
корені Skills, корені команд Claude, стандартні значення `settings.json` пакета Claude,
стандартні значення LSP пакета Claude та підтримувані набори hooks, коли макет відповідає
очікуванням runtime OpenClaw.

Кожен нативний Plugin OpenClaw **повинен** постачати файл `openclaw.plugin.json` у
**корені Plugin**. OpenClaw використовує цей маніфест для перевірки конфігурації
**без виконання коду Plugin**. Відсутні або недійсні маніфести вважаються
помилками Plugin і блокують перевірку конфігурації.

Див. повний посібник із системи Plugin: [Plugins](/uk/tools/plugin).
Про нативну модель можливостей і поточні рекомендації щодо зовнішньої сумісності:
[Модель можливостей](/uk/plugins/architecture#public-capability-model).

## Що робить цей файл

`openclaw.plugin.json` — це метадані, які OpenClaw читає **до завантаження вашого
коду Plugin**. Усе нижче має бути достатньо дешевим для перевірки без запуску
runtime Plugin.

**Використовуйте його для:**

- ідентичності Plugin, перевірки конфігурації та підказок UI конфігурації
- метаданих автентифікації, onboarding і налаштування (псевдонім, автоматичне ввімкнення, env vars провайдера, варіанти автентифікації)
- підказок активації для поверхонь control plane
- скороченого володіння сімейством моделей
- статичних знімків володіння можливостями (`contracts`)
- метаданих QA runner, які спільний хост `openclaw qa` може перевіряти
- метаданих конфігурації для конкретного каналу, об’єднаних у каталог і поверхні перевірки

**Не використовуйте його для:** реєстрації поведінки runtime, оголошення точок входу коду
або метаданих встановлення npm. Вони належать до коду вашого Plugin і `package.json`.

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

| Поле                                 | Обов’язкове | Тип                              | Що означає                                                                                                                                                                                                                     |
| ------------------------------------ | ----------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Так         | `string`                         | Канонічний id plugin. Це id, який використовується в `plugins.entries.<id>`.                                                                                                                                                    |
| `configSchema`                       | Так         | `object`                         | Вбудована JSON Schema для конфігурації цього plugin.                                                                                                                                                                           |
| `enabledByDefault`                   | Ні          | `true`                           | Позначає bundled plugin як увімкнений за замовчуванням. Опустіть це поле або задайте будь-яке значення, відмінне від `true`, щоб лишити plugin вимкненим за замовчуванням.                                                     |
| `legacyPluginIds`                    | Ні          | `string[]`                       | Застарілі id, які нормалізуються до цього канонічного id plugin.                                                                                                                                                               |
| `autoEnableWhenConfiguredProviders`  | Ні          | `string[]`                       | Id провайдерів, які мають автоматично вмикати цей plugin, коли auth, config або посилання на модель згадують їх.                                                                                                              |
| `kind`                               | Ні          | `"memory"` \| `"context-engine"` | Оголошує ексклюзивний тип plugin, який використовується `plugins.slots.*`.                                                                                                                                                     |
| `channels`                           | Ні          | `string[]`                       | Id каналів, що належать цьому plugin. Використовується для виявлення та перевірки конфігурації.                                                                                                                                |
| `providers`                          | Ні          | `string[]`                       | Id провайдерів, що належать цьому plugin.                                                                                                                                                                                      |
| `providerDiscoveryEntry`             | Ні          | `string`                         | Шлях до легкого модуля виявлення провайдера, відносно кореня plugin, для метаданих каталогу провайдерів у межах маніфесту, які можна завантажити без активації повного runtime plugin.                                       |
| `modelSupport`                       | Ні          | `object`                         | Скорочені метадані сімейства моделей, що належать маніфесту, які використовуються для автоматичного завантаження plugin перед runtime.                                                                                         |
| `modelCatalog`                       | Ні          | `object`                         | Декларативні метадані каталогу моделей для провайдерів, що належать цьому plugin. Це контракт control-plane для майбутнього read-only спискування, onboarding, вибору моделей, псевдонімів і приглушення без завантаження runtime plugin. |
| `modelPricing`                       | Ні          | `object`                         | Політика зовнішнього пошуку цін, що належить провайдеру. Використовуйте її, щоб виключити локальних/self-hosted провайдерів із віддалених каталогів цін або зіставити посилання провайдерів з id каталогів OpenRouter/LiteLLM без жорсткого кодування id провайдерів у core. |
| `modelIdNormalization`               | Ні          | `object`                         | Очищення псевдонімів/префіксів id моделей, що належить провайдеру й має виконуватися до завантаження runtime провайдера.                                                                                                      |
| `providerEndpoints`                  | Ні          | `object[]`                       | Метадані endpoint host/baseUrl, що належать маніфесту, для маршрутів провайдерів, які core має класифікувати до завантаження runtime провайдера.                                                                              |
| `providerRequest`                    | Ні          | `object`                         | Дешеві метадані сімейства провайдерів і сумісності запитів, які використовуються загальною політикою запитів до завантаження runtime провайдера.                                                                              |
| `cliBackends`                        | Ні          | `string[]`                       | Id backend CLI inference, що належать цьому plugin. Використовується для автоматичної активації під час запуску з явних посилань у конфігурації.                                                                               |
| `syntheticAuthRefs`                  | Ні          | `string[]`                       | Посилання на провайдерів або backend CLI, для яких synthetic auth hook, що належить plugin, має перевірятися під час cold model discovery до завантаження runtime.                                                            |
| `nonSecretAuthMarkers`               | Ні          | `string[]`                       | Значення placeholder API key, що належать bundled plugin і представляють несекретний локальний, OAuth або ambient credential стан.                                                                                              |
| `commandAliases`                     | Ні          | `object[]`                       | Імена команд, що належать цьому plugin і мають створювати plugin-aware діагностику конфігурації та CLI до завантаження runtime.                                                                                                |
| `providerAuthEnvVars`                | Ні          | `Record<string, string[]>`       | Застарілі сумісні env-метадані для пошуку auth/status провайдера. Для нових plugins віддавайте перевагу `setup.providers[].envVars`; OpenClaw усе ще читає це під час періоду вилучення.                                     |
| `providerAuthAliases`                | Ні          | `Record<string, string>`         | Id провайдерів, які мають повторно використовувати інший id провайдера для auth lookup, наприклад coding provider, що спільно використовує API key базового провайдера й auth profiles.                                      |
| `channelEnvVars`                     | Ні          | `Record<string, string[]>`       | Дешеві env-метадані каналу, які OpenClaw може перевіряти без завантаження коду plugin. Використовуйте це для env-driven налаштування каналу або auth surfaces, які мають бачити загальні помічники запуску/конфігурації.      |
| `providerAuthChoices`                | Ні          | `object[]`                       | Дешеві метадані auth-choice для onboarding pickers, preferred-provider resolution і простого wiring прапорів CLI.                                                                                                              |
| `activation`                         | Ні          | `object`                         | Дешеві метадані планувальника активації для startup, provider, command, channel, route і capability-triggered loading. Лише метадані; runtime plugin усе ще відповідає за фактичну поведінку.                                |
| `setup`                              | Ні          | `object`                         | Дешеві дескриптори setup/onboarding, які discovery та setup surfaces можуть перевіряти без завантаження runtime plugin.                                                                                                        |
| `qaRunners`                          | Ні          | `object[]`                       | Дешеві дескриптори QA runner, які використовуються спільним host `openclaw qa` до завантаження runtime plugin.                                                                                                                 |
| `contracts`                          | Ні          | `object`                         | Статичний snapshot bundled capability для external auth hooks, speech, realtime transcription, realtime voice, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search і володіння tools. |
| `mediaUnderstandingProviderMetadata` | Ні          | `Record<string, object>`         | Дешеві media-understanding defaults для id провайдерів, оголошених у `contracts.mediaUnderstandingProviders`.                                                                                                                  |
| `channelConfigs`                     | Ні          | `Record<string, object>`         | Метадані конфігурації каналу, що належать маніфесту й об’єднуються з discovery та validation surfaces до завантаження runtime.                                                                                                |
| `skills`                             | Ні          | `string[]`                       | Каталоги Skills для завантаження, відносно кореня plugin.                                                                                                                                                                       |
| `name`                               | Ні          | `string`                         | Зручна для читання назва plugin.                                                                                                                                                                                                |
| `description`                        | Ні          | `string`                         | Короткий підсумок, що показується на plugin surfaces.                                                                                                                                                                           |
| `version`                            | Ні          | `string`                         | Інформаційна версія plugin.                                                                                                                                                                                                     |
| `uiHints`                            | Ні          | `Record<string, object>`         | Мітки UI, placeholder-и та підказки чутливості для полів конфігурації.                                                                                                                                                         |

## Довідник providerAuthChoices

Кожен запис `providerAuthChoices` описує один варіант onboarding або auth.
OpenClaw читає це до завантаження runtime провайдера.
Списки налаштування провайдера використовують ці варіанти з маніфесту, варіанти setup,
отримані з дескрипторів, і метадані install-catalog без завантаження runtime провайдера.

| Поле                 | Обов’язкове | Тип                                             | Що це означає                                                                                                        |
| -------------------- | ----------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `provider`           | Так         | `string`                                        | ID постачальника, якому належить цей вибір.                                                                          |
| `method`             | Так         | `string`                                        | ID методу автентифікації, до якого потрібно спрямувати.                                                              |
| `choiceId`           | Так         | `string`                                        | Стабільний ID вибору автентифікації, який використовують потоки онбордингу та CLI.                                   |
| `choiceLabel`        | Ні          | `string`                                        | Мітка, видима користувачу. Якщо її пропущено, OpenClaw повертається до `choiceId`.                                   |
| `choiceHint`         | Ні          | `string`                                        | Короткий допоміжний текст для засобу вибору.                                                                         |
| `assistantPriority`  | Ні          | `number`                                        | Нижчі значення сортуються раніше в інтерактивних засобах вибору, керованих асистентом.                               |
| `assistantVisibility` | Ні         | `"visible"` \| `"manual-only"`                  | Приховує вибір із засобів вибору асистента, але все ще дозволяє ручний вибір у CLI.                                  |
| `deprecatedChoiceIds` | Ні         | `string[]`                                      | Застарілі ID вибору, які мають переспрямовувати користувачів до цього вибору-заміни.                                 |
| `groupId`            | Ні          | `string`                                        | Необов’язковий ID групи для групування пов’язаних варіантів.                                                         |
| `groupLabel`         | Ні          | `string`                                        | Мітка для цієї групи, видима користувачу.                                                                            |
| `groupHint`          | Ні          | `string`                                        | Короткий допоміжний текст для групи.                                                                                 |
| `optionKey`          | Ні          | `string`                                        | Внутрішній ключ параметра для простих потоків автентифікації з одним прапорцем.                                      |
| `cliFlag`            | Ні          | `string`                                        | Назва прапорця CLI, наприклад `--openrouter-api-key`.                                                                |
| `cliOption`          | Ні          | `string`                                        | Повна форма параметра CLI, наприклад `--openrouter-api-key <key>`.                                                   |
| `cliDescription`     | Ні          | `string`                                        | Опис, що використовується в довідці CLI.                                                                             |
| `onboardingScopes`   | Ні          | `Array<"text-inference" \| "image-generation">` | У яких поверхнях онбордингу має з’являтися цей вибір. Якщо пропущено, типовим значенням є `["text-inference"]`.     |

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

| Поле        | Обов’язкове | Тип               | Що це означає                                                              |
| ----------- | ----------- | ----------------- | -------------------------------------------------------------------------- |
| `name`      | Так         | `string`          | Назва команди, що належить цьому Plugin.                                   |
| `kind`      | Ні          | `"runtime-slash"` | Позначає alias як slash-команду чату, а не кореневу команду CLI.           |
| `cliCommand` | Ні         | `string`          | Пов’язана коренева команда CLI, яку варто запропонувати для операцій CLI, якщо така існує. |

## Довідник activation

Використовуйте `activation`, коли Plugin може дешево оголосити, які події control plane
мають включати його до плану активації/завантаження.

Цей блок є метаданими планувальника, а не lifecycle API. Він не реєструє
runtime-поведінку, не замінює `register(...)` і не гарантує, що
код Plugin уже виконано. Планувальник активації використовує ці поля, щоб
звузити список кандидатів Plugin перед fallback до наявних метаданих володіння
маніфесту, як-от `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` і hooks.

Надавайте перевагу найвужчим метаданим, які вже описують володіння. Використовуйте
`providers`, `channels`, `commandAliases`, дескриптори setup або `contracts`,
коли ці поля виражають зв’язок. Використовуйте `activation` для додаткових підказок
планувальнику, які не можна представити цими полями володіння.
Використовуйте top-level `cliBackends` для runtime-alias CLI, як-от `claude-cli`,
`codex-cli` або `google-gemini-cli`; `activation.onAgentHarnesses` призначено лише для
вбудованих ID agent harness, які ще не мають поля володіння.

Цей блок є лише метаданими. Він не реєструє runtime-поведінку і не
замінює `register(...)`, `setupEntry` чи інші runtime/plugin entrypoints.
Поточні споживачі використовують його як підказку для звуження перед ширшим завантаженням Plugin, тому
відсутність метаданих активації зазвичай лише впливає на продуктивність; вона не має
змінювати коректність, доки ще існують legacy fallback володіння маніфесту.

Кожен Plugin має свідомо встановлювати `activation.onStartup`, оскільки OpenClaw переходить
від неявних startup-імпортів. Установіть його в `true` лише тоді, коли Plugin повинен
виконуватися під час запуску Gateway. Установіть його в `false`, коли Plugin інертний під час
startup і має завантажуватися лише через вужчі тригери. Пропуск `onStartup` зберігає
застарілий legacy implicit startup sidecar fallback для Plugin без
статичних метаданих можливостей; майбутні версії можуть припинити startup-завантаження цих
Plugin, якщо вони не оголосять `activation.onStartup: true`. Звіти про статус і сумісність
Plugin попереджають із `legacy-implicit-startup-sidecar`, коли Plugin
досі покладається на цей fallback.

Для тестування міграції встановіть
`OPENCLAW_DISABLE_LEGACY_IMPLICIT_STARTUP_SIDECARS=1`, щоб вимкнути лише цей
застарілий fallback. Цей opt-in режим не блокує явні
Plugin з `activation.onStartup: true` або Plugin, завантажені каналом, конфігурацією,
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

| Поле              | Обов’язкове | Тип                                                  | Що це означає                                                                                                                                                                                                                 |
| ----------------- | ----------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`       | Ні          | `boolean`                                            | Явна активація під час запуску Gateway. Кожен Plugin має встановлювати це поле. `true` імпортує Plugin під час запуску; `false` відмовляється від застарілого implicit sidecar startup fallback, якщо інший відповідний тригер не вимагає завантаження. |
| `onProviders`     | Ні          | `string[]`                                           | ID постачальників, які мають включати цей Plugin до планів активації/завантаження.                                                                                                                                            |
| `onAgentHarnesses` | Ні         | `string[]`                                           | Runtime ID вбудованих agent harness, які мають включати цей Plugin до планів активації/завантаження. Використовуйте top-level `cliBackends` для alias backend CLI.                                                            |
| `onCommands`      | Ні          | `string[]`                                           | ID команд, які мають включати цей Plugin до планів активації/завантаження.                                                                                                                                                    |
| `onChannels`      | Ні          | `string[]`                                           | ID каналів, які мають включати цей Plugin до планів активації/завантаження.                                                                                                                                                   |
| `onRoutes`        | Ні          | `string[]`                                           | Типи маршрутів, які мають включати цей Plugin до планів активації/завантаження.                                                                                                                                               |
| `onConfigPaths`   | Ні          | `string[]`                                           | Шляхи конфігурації відносно кореня, які мають включати цей Plugin до планів startup/завантаження, коли шлях присутній і не вимкнений явно.                                                                                   |
| `onCapabilities`  | Ні          | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Широкі підказки можливостей, які використовує планування активації control plane. Надавайте перевагу вужчим полям, коли це можливо.                                                                                           |

Поточні live-споживачі:

- Планування запуску Gateway використовує `activation.onStartup` для явного startup
  імпорту та відмови від застарілого implicit sidecar startup fallback
- планування CLI, запущене командою, fallback до legacy
  `commandAliases[].cliCommand` або `commandAliases[].name`
- планування запуску agent-runtime використовує `activation.onAgentHarnesses` для
  вбудованих harness і top-level `cliBackends[]` для runtime-alias CLI
- планування setup/каналу, запущене каналом, fallback до legacy `channels[]`
  володіння, коли явні метадані активації каналу відсутні
- планування Plugin під час startup використовує `activation.onConfigPaths` для неканальних root
  поверхонь конфігурації, як-от блок `browser` вбудованого browser Plugin
- планування setup/runtime, запущене постачальником, fallback до legacy
  `providers[]` і top-level `cliBackends[]` володіння, коли явні метадані активації постачальника
  відсутні

Діагностика планувальника може відрізняти явні підказки активації від fallback
володіння маніфесту. Наприклад, `activation-command-hint` означає, що
`activation.onCommands` збігся, а `manifest-command-alias` означає, що
планувальник натомість використав володіння `commandAliases`. Ці reason labels призначені для
діагностики хоста й тестів; автори Plugin мають і надалі оголошувати метадані,
які найкраще описують володіння.

## Довідник qaRunners

Використовуйте `qaRunners`, коли Plugin додає один або кілька transport runner під
спільним коренем `openclaw qa`. Тримайте ці метадані дешевими й статичними; runtime
Plugin усе ще володіє фактичною реєстрацією CLI через легку
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

| Поле          | Обов’язкове | Тип      | Що означає                                                               |
| ------------- | ----------- | -------- | ------------------------------------------------------------------------ |
| `commandName` | Так         | `string` | Підкоманда, змонтована під `openclaw qa`, наприклад `matrix`.            |
| `description` | Ні          | `string` | Резервний довідковий текст, що використовується, коли спільному хосту потрібна команда-заглушка. |

## довідник setup

Використовуйте `setup`, коли поверхням налаштування й онбордингу потрібні дешеві метадані, що належать plugin,
перш ніж завантажиться runtime.

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

Верхньорівневий `cliBackends` залишається чинним і далі описує бекенди CLI-виведення.
`setup.cliBackends` — це специфічна для setup поверхня дескрипторів для
потоків control-plane/setup, які мають залишатися лише метаданими.

Коли `setup.providers` і `setup.cliBackends` наявні, вони є пріоритетною
поверхнею пошуку за дескрипторами для виявлення setup. Якщо дескриптор лише
звужує кандидатний plugin, а setup все ще потребує багатших runtime-хуків під час налаштування,
установіть `requiresRuntime: true` і залиште `setup-api` як
резервний шлях виконання.

OpenClaw також включає `setup.providers[].envVars` у загальну автентифікацію provider і
пошуки env-var. `providerAuthEnvVars` лишається підтримуваним через адаптер сумісності
під час вікна застарівання, але небандловані plugins, які досі його використовують,
отримують діагностику manifest. Нові plugins мають розміщувати метадані env для setup/status
у `setup.providers[].envVars`.

OpenClaw також може виводити прості варіанти setup з `setup.providers[].authMethods`,
коли запис setup недоступний або коли `setup.requiresRuntime: false`
оголошує, що runtime для setup не потрібен. Явні записи `providerAuthChoices` лишаються
пріоритетними для кастомних міток, CLI-прапорців, області онбордингу та метаданих assistant.

Установлюйте `requiresRuntime: false` лише тоді, коли цих дескрипторів достатньо для
поверхні setup. OpenClaw трактує явне `false` як контракт лише на дескрипторах
і не виконуватиме `setup-api` або `openclaw.setupEntry` для пошуку setup. Якщо
plugin лише з дескрипторами все одно постачає один із цих runtime-записів setup,
OpenClaw повідомляє додаткову діагностику й продовжує її ігнорувати. Пропущений
`requiresRuntime` зберігає застарілу резервну поведінку, щоб наявні plugins, які додали
дескриптори без цього прапорця, не зламалися.

Оскільки пошук setup може виконувати код `setup-api`, що належить plugin, нормалізовані
значення `setup.providers[].id` і `setup.cliBackends[]` мають залишатися унікальними серед
виявлених plugins. Неоднозначне володіння завершується відмовою замість вибору
переможця за порядком виявлення.

Коли runtime setup таки виконується, діагностика реєстру setup повідомляє про розходження дескрипторів,
якщо `setup-api` реєструє provider або CLI-бекенд, які не оголошені дескрипторами
manifest, або якщо дескриптор не має відповідної runtime-реєстрації.
Ця діагностика є додатковою й не відхиляє застарілі plugins.

### довідник setup.providers

| Поле           | Обов’язкове | Тип        | Що означає                                                                                          |
| -------------- | ----------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `id`           | Так         | `string`   | Id provider, відкритий під час setup або онбордингу. Тримайте нормалізовані id глобально унікальними. |
| `authMethods`  | Ні          | `string[]` | Id методів setup/auth, які цей provider підтримує без завантаження повного runtime.                 |
| `envVars`      | Ні          | `string[]` | Env vars, які загальні поверхні setup/status можуть перевіряти до завантаження runtime plugin.      |
| `authEvidence` | Ні          | `object[]` | Дешеві локальні перевірки доказів auth для providers, що можуть автентифікуватися через несекретні маркери. |

`authEvidence` призначено для локальних маркерів облікових даних, що належать provider і можуть бути
перевірені без завантаження runtime-коду. Ці перевірки мають залишатися дешевими й локальними:
без мережевих викликів, без читання keychain або secret-manager, без shell-команд і без
проб provider API.

Підтримувані записи доказів:

| Поле              | Обов’язкове | Тип        | Що означає                                                                                                      |
| ----------------- | ----------- | ---------- | --------------------------------------------------------------------------------------------------------------- |
| `type`            | Так         | `string`   | Наразі `local-file-with-env`.                                                                                   |
| `fileEnvVar`      | Ні          | `string`   | Env var, що містить явний шлях до файла облікових даних.                                                        |
| `fallbackPaths`   | Ні          | `string[]` | Локальні шляхи до файлів облікових даних, що перевіряються, коли `fileEnvVar` відсутня або порожня. Підтримує `${HOME}` і `${APPDATA}`. |
| `requiresAnyEnv`  | Ні          | `string[]` | Принаймні одна з перелічених env var має бути непорожньою, перш ніж доказ стане чинним.                         |
| `requiresAllEnv`  | Ні          | `string[]` | Кожна перелічена env var має бути непорожньою, перш ніж доказ стане чинним.                                     |
| `credentialMarker` | Так        | `string`   | Несекретний маркер, що повертається, коли доказ наявний.                                                        |
| `source`          | Ні          | `string`   | Користувацька мітка джерела для виводу auth/status.                                                             |

### поля setup

| Поле               | Обов’язкове | Тип        | Що означає                                                                                             |
| ------------------ | ----------- | ---------- | ------------------------------------------------------------------------------------------------------ |
| `providers`        | Ні          | `object[]` | Дескриптори setup provider, відкриті під час setup і онбордингу.                                       |
| `cliBackends`      | Ні          | `string[]` | Id бекендів часу setup, що використовуються для пошуку setup спершу за дескрипторами. Тримайте нормалізовані id глобально унікальними. |
| `configMigrations` | Ні          | `string[]` | Id міграцій конфігурації, що належать поверхні setup цього plugin.                                     |
| `requiresRuntime`  | Ні          | `boolean`  | Чи setup все ще потребує виконання `setup-api` після пошуку за дескрипторами.                          |

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

| Поле          | Тип        | Що означає                                  |
| ------------- | ---------- | ------------------------------------------- |
| `label`       | `string`   | Користувацька мітка поля.                   |
| `help`        | `string`   | Короткий допоміжний текст.                  |
| `tags`        | `string[]` | Необов’язкові UI-теги.                      |
| `advanced`    | `boolean`  | Позначає поле як розширене.                 |
| `sensitive`   | `boolean`  | Позначає поле як секретне або чутливе.      |
| `placeholder` | `string`   | Текст заповнювача для полів форми.          |

## довідник contracts

Використовуйте `contracts` лише для статичних метаданих володіння capability, які OpenClaw може
читати без імпорту runtime plugin.

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

| Поле                             | Тип        | Що означає                                                                       |
| -------------------------------- | ---------- | -------------------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Id фабрик розширень app-server Codex, наразі `codex-app-server`.                 |
| `agentToolResultMiddleware`      | `string[]` | Runtime id, для яких бандлований plugin може зареєструвати middleware результатів tool. |
| `externalAuthProviders`          | `string[]` | Id provider, чий хук зовнішнього профілю auth належить цьому plugin.             |
| `speechProviders`                | `string[]` | Id speech provider, що належать цьому plugin.                                    |
| `realtimeTranscriptionProviders` | `string[]` | Id realtime-transcription provider, що належать цьому plugin.                    |
| `realtimeVoiceProviders`         | `string[]` | Id realtime-voice provider, що належать цьому plugin.                            |
| `memoryEmbeddingProviders`       | `string[]` | Id memory embedding provider, що належать цьому plugin.                          |
| `mediaUnderstandingProviders`    | `string[]` | Id media-understanding provider, що належать цьому plugin.                       |
| `imageGenerationProviders`       | `string[]` | Id image-generation provider, що належать цьому plugin.                          |
| `videoGenerationProviders`       | `string[]` | Id video-generation provider, що належать цьому plugin.                          |
| `webFetchProviders`              | `string[]` | Id web-fetch provider, що належать цьому plugin.                                 |
| `webSearchProviders`             | `string[]` | Id web-search provider, що належать цьому plugin.                                |
| `migrationProviders`             | `string[]` | Id import provider, що належать цьому plugin для `openclaw migrate`.             |
| `tools`                          | `string[]` | Назви agent tools, що належать цьому plugin для бандлованих перевірок контрактів. |

`contracts.embeddedExtensionFactories` збережено для бандлованих фабрик розширень Codex,
призначених лише для app-server. Бандловані перетворення результатів tool мають
оголошувати `contracts.agentToolResultMiddleware` і реєструватися через
`api.registerAgentToolResultMiddleware(...)`. Зовнішні plugins не можуть
реєструвати middleware результатів tool, оскільки цей seam може переписувати вивід tool
із високим рівнем довіри до того, як його побачить модель.

Provider plugins, що реалізують `resolveExternalAuthProfiles`, мають оголошувати
`contracts.externalAuthProviders`. Plugins без цього оголошення все одно проходять
через застарілий резервний шлях сумісності, але він повільніший і
буде вилучений після вікна міграції.

Бандловані providers memory embedding мають оголошувати
`contracts.memoryEmbeddingProviders` для кожного id адаптера, який вони відкривають, зокрема
вбудованих адаптерів на кшталт `local`. Самостійні CLI-шляхи використовують цей manifest
contract, щоб завантажити лише власний plugin до того, як повний runtime Gateway
зареєструє providers.

## довідник mediaUnderstandingProviderMetadata

Використовуйте `mediaUnderstandingProviderMetadata`, коли провайдер розуміння медіа має
типові моделі, пріоритет резервної автоавтентифікації або вбудовану підтримку документів,
які потрібні загальним допоміжним засобам ядра до завантаження середовища виконання. Ключі також мають бути оголошені в
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

| Поле                   | Тип                                 | Що це означає                                                                  |
| ---------------------- | ----------------------------------- | ------------------------------------------------------------------------------ |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Можливості медіа, які надає цей провайдер.                                     |
| `defaultModels`        | `Record<string, string>`            | Типові зіставлення можливостей із моделями, що використовуються, коли конфігурація не задає модель. |
| `autoPriority`         | `Record<string, number>`            | Менші числа сортуються раніше для автоматичного резервного вибору провайдера на основі облікових даних. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Вбудовані вхідні документи, які підтримує провайдер.                           |

## Довідник `channelConfigs`

Використовуйте `channelConfigs`, коли Plugin каналу потребує дешевих метаданих конфігурації до
завантаження середовища виконання. Виявлення налаштування/стану каналу в режимі лише для читання може використовувати ці метадані
безпосередньо для налаштованих зовнішніх каналів, коли запис налаштування недоступний, або
коли `setup.requiresRuntime: false` оголошує, що середовище виконання для налаштування непотрібне.

`channelConfigs` — це метадані маніфесту Plugin, а не новий розділ користувацької конфігурації
верхнього рівня. Користувачі й надалі налаштовують екземпляри каналів у `channels.<channel-id>`.
OpenClaw читає метадані маніфесту, щоб визначити, який Plugin володіє цим налаштованим
каналом, до виконання коду середовища виконання Plugin.

Для Plugin каналу `configSchema` і `channelConfigs` описують різні
шляхи:

- `configSchema` перевіряє `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` перевіряє `channels.<channel-id>`

Невбудовані plugins, які оголошують `channels[]`, також мають оголошувати відповідні
записи `channelConfigs`. Без них OpenClaw усе ще може завантажити Plugin, але
схема конфігурації, налаштування й поверхні інтерфейсу керування на холодному шляху не зможуть знати
форму параметрів, що належать каналу, доки не виконається середовище виконання Plugin.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` і
`nativeSkillsAutoEnabled` можуть оголошувати статичні типові значення `auto` для перевірок конфігурації команд,
які виконуються до завантаження середовища виконання каналу. Вбудовані канали також можуть публікувати
такі самі типові значення через `package.json#openclaw.channel.commands` разом
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

| Поле          | Тип                      | Що це означає                                                                  |
| ------------- | ------------------------ | ------------------------------------------------------------------------------ |
| `schema`      | `object`                 | JSON Schema для `channels.<id>`. Обов’язкова для кожного оголошеного запису конфігурації каналу. |
| `uiHints`     | `Record<string, object>` | Необов’язкові підказки для міток/заповнювачів/чутливих даних інтерфейсу для цього розділу конфігурації каналу. |
| `label`       | `string`                 | Мітка каналу, що об’єднується з поверхнями вибору й інспектування, коли метадані середовища виконання ще не готові. |
| `description` | `string`                 | Короткий опис каналу для поверхонь інспектування й каталогу.                  |
| `commands`    | `object`                 | Статичні автоматичні типові значення вбудованих команд і вбудованих Skills для перевірок конфігурації до середовища виконання. |
| `preferOver`  | `string[]`               | Застарілі або нижчопріоритетні ідентифікатори plugins, які цей канал має випереджати на поверхнях вибору. |

### Заміна іншого Plugin каналу

Використовуйте `preferOver`, коли ваш Plugin є бажаним власником для ідентифікатора каналу, який
може також надавати інший Plugin. Типові випадки — перейменований ідентифікатор Plugin,
окремий Plugin, що замінює вбудований Plugin, або підтримуваний форк, який
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

Коли налаштовано `channels.chat`, OpenClaw враховує ідентифікатор каналу та
ідентифікатор бажаного Plugin. Якщо нижчопріоритетний Plugin було вибрано лише тому, що
він вбудований або ввімкнений за замовчуванням, OpenClaw вимикає його в ефективній
конфігурації середовища виконання, щоб один Plugin володів каналом і його інструментами. Явний вибір користувача
все одно має перевагу: якщо користувач явно вмикає обидва plugins, OpenClaw
зберігає цей вибір і повідомляє діагностику дубльованих каналів/інструментів замість
тихої зміни запитаного набору plugins.

Обмежуйте `preferOver` лише ідентифікаторами plugins, які справді можуть надавати той самий канал.
Це не загальне поле пріоритету, і воно не перейменовує ключі користувацької конфігурації.

## Довідник `modelSupport`

Використовуйте `modelSupport`, коли OpenClaw має виводити ваш Plugin провайдера з
скорочених ідентифікаторів моделей, як-от `gpt-5.5` або `claude-sonnet-4.6`, до завантаження середовища виконання
Plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw застосовує такий порядок пріоритетів:

- явні посилання `provider/model` використовують метадані маніфесту `providers` власника
- `modelPatterns` мають перевагу над `modelPrefixes`
- якщо збігаються один невбудований Plugin і один вбудований Plugin, перемагає невбудований
  Plugin
- решта неоднозначностей ігнорується, доки користувач або конфігурація не задасть провайдера

Поля:

| Поле            | Тип        | Що це означає                                                                  |
| --------------- | ---------- | ------------------------------------------------------------------------------ |
| `modelPrefixes` | `string[]` | Префікси, які зіставляються через `startsWith` зі скороченими ідентифікаторами моделей. |
| `modelPatterns` | `string[]` | Джерела регулярних виразів, що зіставляються зі скороченими ідентифікаторами моделей після видалення суфікса профілю. |

## Довідник `modelCatalog`

Використовуйте `modelCatalog`, коли OpenClaw має знати метадані моделей провайдера до
завантаження середовища виконання Plugin. Це джерело, що належить маніфесту, для фіксованих рядків каталогу,
псевдонімів провайдерів, правил пригнічення та режиму виявлення. Оновлення середовища виконання
й надалі належить коду середовища виконання провайдера, але маніфест повідомляє ядру, коли потрібне середовище виконання.

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

| Поле           | Тип                                                      | Що це означає                                                                  |
| -------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `providers`    | `Record<string, object>`                                 | Рядки каталогу для ідентифікаторів провайдерів, що належать цьому Plugin. Ключі також мають з’являтися в `providers` верхнього рівня. |
| `aliases`      | `Record<string, object>`                                 | Псевдоніми провайдерів, які мають розв’язуватися до власного провайдера для планування каталогу або пригнічення. |
| `suppressions` | `object[]`                                               | Рядки моделей з іншого джерела, які цей Plugin пригнічує з причини, специфічної для провайдера. |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Чи можна читати каталог провайдера з метаданих маніфесту, оновлювати його в кеш або чи потрібне середовище виконання. |

`aliases` бере участь у пошуку власника провайдера для планування каталогу моделей.
Цілі псевдонімів мають бути провайдерами верхнього рівня, що належать тому самому Plugin. Коли
список, відфільтрований за провайдером, використовує псевдонім, OpenClaw може читати маніфест власника та
застосовувати перевизначення API/базової URL-адреси псевдоніма без завантаження середовища виконання провайдера.
Псевдоніми не розгортають нефільтровані списки каталогу; широкі списки виводять лише рядки
канонічного провайдера-власника.

`suppressions` замінює старий хук середовища виконання провайдера `suppressBuiltInModel`.
Записи пригнічення враховуються лише тоді, коли провайдер належить Plugin або
оголошений як ключ `modelCatalog.aliases`, що вказує на власного провайдера. Хуки пригнічення
середовища виконання більше не викликаються під час розв’язання моделей.

Поля провайдера:

| Поле      | Тип                      | Що це означає                                                        |
| --------- | ------------------------ | -------------------------------------------------------------------- |
| `baseUrl` | `string`                 | Необов’язкова типова базова URL-адреса для моделей у цьому каталозі провайдера. |
| `api`     | `ModelApi`               | Необов’язковий типовий адаптер API для моделей у цьому каталозі провайдера. |
| `headers` | `Record<string, string>` | Необов’язкові статичні заголовки, які застосовуються до цього каталогу провайдера. |
| `models`  | `object[]`               | Обов’язкові рядки моделей. Рядки без `id` ігноруються.              |

Поля моделі:

| Поле           | Тип                                                            | Що це означає                                                                                 |
| -------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `id`           | `string`                                                       | Локальний для провайдера ідентифікатор моделі, без префікса `provider/`.                      |
| `name`         | `string`                                                       | Необов’язкова відображувана назва.                                                            |
| `api`          | `ModelApi`                                                     | Необов’язкове перевизначення API для окремої моделі.                                          |
| `baseUrl`      | `string`                                                       | Необов’язкове перевизначення базової URL-адреси для окремої моделі.                           |
| `headers`      | `Record<string, string>`                                       | Необов’язкові статичні заголовки для окремої моделі.                                          |
| `input`        | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Модальності, які приймає модель.                                                              |
| `reasoning`    | `boolean`                                                      | Чи надає модель поведінку міркування.                                                         |
| `contextWindow` | `number`                                                      | Нативне контекстне вікно провайдера.                                                          |
| `contextTokens` | `number`                                                      | Необов’язкове ефективне обмеження контексту під час виконання, коли воно відрізняється від `contextWindow`. |
| `maxTokens`    | `number`                                                       | Максимальна кількість вихідних токенів, якщо відома.                                          |
| `cost`         | `object`                                                       | Необов’язкова ціна в USD за мільйон токенів, зокрема необов’язкове `tieredPricing`.           |
| `compat`       | `object`                                                       | Необов’язкові прапорці сумісності, що відповідають сумісності конфігурації моделей OpenClaw. |
| `status`       | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Статус у списку. Приховуйте лише тоді, коли рядок узагалі не має з’являтися.                  |
| `statusReason` | `string`                                                       | Необов’язкова причина, що показується зі статусом, відмінним від доступного.                  |
| `replaces`     | `string[]`                                                     | Старіші локальні для провайдера ідентифікатори моделей, які ця модель замінює.                |
| `replacedBy`   | `string`                                                       | Локальний для провайдера ідентифікатор моделі-заміни для застарілих рядків.                   |
| `tags`         | `string[]`                                                     | Стабільні теги, які використовують засоби вибору та фільтри.                                  |

Поля приховування:

| Поле                      | Тип        | Що це означає                                                                                         |
| ------------------------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| `provider`                | `string`   | Ідентифікатор провайдера для upstream-рядка, який потрібно приховати. Має належати цьому plugin або бути оголошеним як належний псевдонім. |
| `model`                   | `string`   | Локальний для провайдера ідентифікатор моделі, який потрібно приховати.                               |
| `reason`                  | `string`   | Необов’язкове повідомлення, що показується, коли прихований рядок запитують напряму.                 |
| `when.baseUrlHosts`       | `string[]` | Необов’язковий список ефективних хостів базових URL провайдера, потрібних перед застосуванням приховування. |
| `when.providerConfigApiIn` | `string[]` | Необов’язковий список точних значень `api` з конфігурації провайдера, потрібних перед застосуванням приховування. |

Не розміщуйте дані лише часу виконання в `modelCatalog`. Використовуйте `static` лише тоді, коли рядки маніфесту достатньо повні, щоб поверхні списку з фільтрацією за провайдером і засоби вибору могли пропустити виявлення через реєстр або runtime. Використовуйте `refreshable`, коли рядки маніфесту корисні як початкові або додаткові елементи списку, але оновлення чи кеш можуть додати більше рядків пізніше; рядки `refreshable` самі по собі не є авторитетними. Використовуйте `runtime`, коли OpenClaw має завантажити runtime провайдера, щоб знати список.

## Довідка modelIdNormalization

Використовуйте `modelIdNormalization` для дешевого очищення ідентифікаторів моделей, що належить провайдеру й має відбутися до завантаження runtime провайдера. Це зберігає псевдоніми, як-от короткі назви моделей, локальні для провайдера застарілі ідентифікатори та правила префіксів проксі, у маніфесті власного plugin, а не в основних таблицях вибору моделей.

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
| `aliases`                            | `Record<string,string>` | Точні псевдоніми ідентифікаторів моделей без урахування регістру. Значення повертаються як записані. |
| `stripPrefixes`                      | `string[]`              | Префікси, які потрібно видалити перед пошуком псевдоніма; корисно для застарілого дублювання provider/model. |
| `prefixWhenBare`                     | `string`                | Префікс, який потрібно додати, коли нормалізований ідентифікатор моделі ще не містить `/`.    |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Умовні правила префіксації bare-id після пошуку псевдоніма, ключовані за `modelPrefix` і `prefix`. |

## Довідка providerEndpoints

Використовуйте `providerEndpoints` для класифікації endpoint, яку загальна політика запитів має знати до завантаження runtime провайдера. Core і далі володіє значенням кожного `endpointClass`; маніфести plugin володіють метаданими хоста й базової URL-адреси.

Поля endpoint:

| Поле                          | Тип        | Що це означає                                                                                       |
| ----------------------------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `endpointClass`               | `string`   | Відомий core-клас endpoint, як-от `openrouter`, `moonshot-native` або `google-vertex`.              |
| `hosts`                       | `string[]` | Точні імена хостів, що відповідають класу endpoint.                                                 |
| `hostSuffixes`                | `string[]` | Суфікси хостів, що відповідають класу endpoint. Додавайте префікс `.` для зіставлення лише суфікса домену. |
| `baseUrls`                    | `string[]` | Точні нормалізовані базові HTTP(S) URL-адреси, що відповідають класу endpoint.                      |
| `googleVertexRegion`          | `string`   | Статичний регіон Google Vertex для точних глобальних хостів.                                        |
| `googleVertexRegionHostSuffix` | `string`  | Суфікс, який потрібно вилучити з відповідних хостів, щоб відкрити префікс регіону Google Vertex.    |

## Довідка providerRequest

Використовуйте `providerRequest` для дешевих метаданих сумісності запитів, потрібних загальній політиці запитів без завантаження runtime провайдера. Тримайте переписування payload, специфічне для поведінки, у runtime-хуках провайдера або спільних допоміжних функціях сімейства провайдерів.

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

| Поле                  | Тип          | Що це означає                                                                                  |
| --------------------- | ------------ | ---------------------------------------------------------------------------------------------- |
| `family`              | `string`     | Мітка сімейства провайдерів, яку використовують загальні рішення щодо сумісності запитів і діагностика. |
| `compatibilityFamily` | `"moonshot"` | Необов’язковий бакет сумісності сімейства провайдерів для спільних допоміжних функцій запитів. |
| `openAICompletions`   | `object`     | Прапорці запитів completions, сумісних з OpenAI, наразі `supportsStreamingUsage`.               |

## Довідка modelPricing

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
| `external`   | `boolean`         | Установіть `false` для локальних або self-hosted провайдерів, які ніколи не мають отримувати ціни OpenRouter або LiteLLM. |
| `openRouter` | `false \| object` | Відображення для пошуку цін OpenRouter. `false` вимикає пошук OpenRouter для цього провайдера.        |
| `liteLLM`    | `false \| object` | Відображення для пошуку цін LiteLLM. `false` вимикає пошук LiteLLM для цього провайдера.              |

Поля джерела:

| Поле                       | Тип                | Що це означає                                                                                          |
| -------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------ |
| `provider`                 | `string`           | Ідентифікатор провайдера зовнішнього каталогу, коли він відрізняється від ідентифікатора провайдера OpenClaw, наприклад `z-ai` для провайдера `zai`. |
| `passthroughProviderModel` | `boolean`          | Розглядати ідентифікатори моделей із скісною рискою як вкладені посилання provider/model, корисно для проксі-провайдерів, таких як OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Додаткові варіанти ідентифікаторів моделей зовнішнього каталогу. `version-dots` пробує ідентифікатори версій із крапками, як-от `claude-opus-4.6`. |

### Індекс провайдерів OpenClaw

Індекс провайдерів OpenClaw — це preview-метадані, якими володіє OpenClaw, для провайдерів, чиї plugins можуть ще не бути встановлені. Він не є частиною маніфесту plugin. Маніфести plugin залишаються авторитетним джерелом щодо встановлених plugin. Індекс провайдерів — це внутрішній fallback-контракт, який майбутні поверхні installable-provider і засобів вибору моделей до встановлення використовуватимуть, коли plugin провайдера не встановлено.

Порядок авторитетності каталогу:

1. Конфігурація користувача.
2. `modelCatalog` маніфесту встановленого plugin.
3. Кеш каталогу моделей після явного оновлення.
4. Preview-рядки Індексу провайдерів OpenClaw.

Індекс провайдерів не повинен містити секрети, увімкнений стан, runtime-хуки або
живі дані моделей, специфічні для облікового запису. Його preview-каталоги використовують ту саму
форму рядка провайдера `modelCatalog`, що й маніфести плагінів, але мають залишатися обмеженими
стабільними метаданими відображення, якщо поля runtime-адаптера, як-от `api`,
`baseUrl`, ціни або прапорці сумісності, не підтримуються навмисно узгодженими з
маніфестом установленого плагіна. Провайдери з live-виявленням `/models` мають
записувати оновлені рядки через явний шлях кешу каталогу моделей замість того,
щоб звичайний список або onboarding викликав API провайдера.

Записи Індексу провайдерів також можуть містити метадані installable-plugin для провайдерів,
чий плагін було винесено з core або інакше ще не встановлено. Ці
метадані віддзеркалюють патерн каталогу каналів: назви пакета, npm install spec,
очікуваної цілісності та дешевих міток вибору автентифікації достатньо, щоб показати
інсталюваний варіант налаштування. Після встановлення плагіна його маніфест має пріоритет, а
запис Індексу провайдерів для цього провайдера ігнорується.

Застарілі capability-ключі верхнього рівня deprecated. Використовуйте `openclaw doctor --fix`, щоб
перемістити `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` і `webSearchProviders` під `contracts`; звичайне
завантаження маніфесту більше не розглядає ці поля верхнього рівня як володіння
capability.

## Manifest проти package.json

Ці два файли виконують різні завдання:

| Файл                   | Для чого використовувати                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Виявлення, валідація config, метадані вибору автентифікації та підказки UI, які мають існувати до запуску коду плагіна                         |
| `package.json`         | Метадані npm, встановлення залежностей і блок `openclaw`, що використовується для entrypoint-ів, install gating, setup або метаданих каталогу |

Якщо ви не впевнені, де має бути певна частина метаданих, скористайтеся цим правилом:

- якщо OpenClaw має знати це до завантаження коду плагіна, помістіть це в `openclaw.plugin.json`
- якщо це стосується пакування, entry-файлів або поведінки npm install, помістіть це в `package.json`

### Поля package.json, які впливають на виявлення

Деякі pre-runtime метадані плагіна навмисно живуть у `package.json` під
блоком `openclaw` замість `openclaw.plugin.json`.

Важливі приклади:

| Поле                                                             | Що воно означає                                                                                                                                                                        |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | Оголошує native entrypoint-и плагіна. Має залишатися всередині каталогу пакета плагіна.                                                                                                   |
| `openclaw.runtimeExtensions`                                      | Оголошує зібрані JavaScript runtime entrypoint-и для встановлених пакетів. Має залишатися всередині каталогу пакета плагіна.                                                                 |
| `openclaw.setupEntry`                                             | Легкий setup-only entrypoint, що використовується під час onboarding, відкладеного запуску каналу та read-only status/SecretRef discovery каналу. Має залишатися всередині каталогу пакета плагіна. |
| `openclaw.runtimeSetupEntry`                                      | Оголошує зібраний JavaScript setup entrypoint для встановлених пакетів. Потребує `setupEntry`, має існувати й залишатися всередині каталогу пакета плагіна.                         |
| `openclaw.channel`                                                | Дешеві метадані каталогу каналів, як-от мітки, шляхи до документації, псевдоніми та текст вибору.                                                                                                 |
| `openclaw.channel.commands`                                       | Статичні native command і native skill auto-default метадані, що використовуються config, audit і command-list поверхнями до завантаження runtime каналу.                                          |
| `openclaw.channel.configuredState`                                | Легкі метадані перевірки configured-state, які можуть відповісти «чи вже існує env-only setup?» без завантаження повного runtime каналу.                                         |
| `openclaw.channel.persistedAuthState`                             | Легкі метадані перевірки persisted-auth, які можуть відповісти «чи хтось уже ввійшов?» без завантаження повного runtime каналу.                                               |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Підказки install/update для вбудованих і зовнішньо опублікованих плагінів.                                                                                                                   |
| `openclaw.install.defaultChoice`                                  | Бажаний шлях встановлення, коли доступно кілька джерел встановлення.                                                                                                                  |
| `openclaw.install.minHostVersion`                                 | Мінімальна підтримувана версія хоста OpenClaw, з використанням semver floor на кшталт `>=2026.3.22`.                                                                                                    |
| `openclaw.install.expectedIntegrity`                              | Очікуваний рядок npm dist integrity, як-от `sha512-...`; потоки install і update перевіряють отриманий артефакт за ним.                                                            |
| `openclaw.install.allowInvalidConfigRecovery`                     | Дозволяє вузький шлях відновлення reinstall для вбудованого плагіна, коли config недійсний.                                                                                                       |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Дозволяє setup-only поверхням каналу завантажуватися перед повним плагіном каналу під час startup.                                                                                                 |

Метадані маніфесту визначають, які варіанти провайдера/каналу/setup з’являються в
onboarding до завантаження runtime. `package.json#openclaw.install` повідомляє
onboarding, як отримати або ввімкнути цей плагін, коли користувач вибирає один із цих
варіантів. Не переносіть install-підказки в `openclaw.plugin.json`.

`openclaw.install.minHostVersion` застосовується під час install і завантаження
registry маніфестів. Недійсні значення відхиляються; новіші, але дійсні значення пропускають
плагін на старіших хостах.

Точне pinning npm-версії вже живе в `npmSpec`, наприклад
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Офіційні external catalog
entries мають поєднувати exact specs з `expectedIntegrity`, щоб update flows fail
closed, якщо отриманий npm artifact більше не відповідає pinned release.
Інтерактивний onboarding досі пропонує trusted registry npm specs, включно з bare
package names і dist-tags, для сумісності. Діагностика каталогу може
розрізняти exact, floating, integrity-pinned, missing-integrity, package-name
mismatch і invalid default-choice sources. Вона також попереджає, коли
`expectedIntegrity` присутній, але немає дійсного npm source, який він може pin.
Коли `expectedIntegrity` присутній,
install/update flows enforce it; коли його omitted, registry resolution
записується без integrity pin.

Плагіни каналів мають надавати `openclaw.setupEntry`, коли status, channel list
або SecretRef scans мають визначити configured accounts без завантаження повного
runtime. Setup entry має expose метадані каналу плюс setup-safe config,
status і secrets adapters; тримайте network clients, gateway listeners і
transport runtimes в основному entrypoint розширення.

Поля runtime entrypoint не перевизначають перевірки меж пакета для source
entrypoint fields. Наприклад, `openclaw.runtimeExtensions` не може зробити
escaping path `openclaw.extensions` придатним до завантаження.

`openclaw.install.allowInvalidConfigRecovery` навмисно вузький. Він не
робить довільні зламані configs installable. Сьогодні він лише дозволяє install
flows відновлюватися після конкретних stale bundled-plugin upgrade failures, таких як
відсутній шлях bundled plugin або stale запис `channels.<id>` для того самого
bundled plugin. Непов’язані config errors досі block install і спрямовують операторів
до `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` є метаданими пакета для крихітного checker
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

Використовуйте це, коли setup, doctor, status або read-only presence flows потребують cheap
yes/no auth probe до завантаження повного плагіна каналу. Persisted auth state не є
configured channel state: не використовуйте ці метадані, щоб auto-enable plugins,
repair runtime dependencies або вирішувати, чи має завантажуватися runtime каналу.
Цільовий export має бути невеликою function, яка читає лише persisted state; не
маршрутизуйте його через повний runtime barrel каналу.

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

Використовуйте це, коли канал може відповісти про configured-state з env або інших tiny
non-runtime inputs. Якщо перевірка потребує full config resolution або реального
runtime каналу, тримайте цю логіку в hook плагіна `config.hasConfiguredState`
замість цього.

## Пріоритет виявлення (дубльовані id плагінів)

OpenClaw виявляє плагіни з кількох коренів (вбудовані, глобальне встановлення, workspace, явні config-selected paths). Якщо два виявлення мають однаковий `id`, зберігається лише маніфест із **найвищим пріоритетом**; дублікати з нижчим пріоритетом відкидаються замість завантаження поруч із ним.

Пріоритет від найвищого до найнижчого:

1. **Config-selected** — шлях, явно pinned у `plugins.entries.<id>`
2. **Bundled** — плагіни, що постачаються з OpenClaw
3. **Global install** — плагіни, встановлені в глобальний корінь плагінів OpenClaw
4. **Workspace** — плагіни, виявлені відносно поточного workspace

Наслідки:

- Forked або stale копія bundled plugin, що лежить у workspace, не затінить bundled build.
- Щоб справді перевизначити bundled plugin локальним, pin його через `plugins.entries.<id>`, щоб він виграв за пріоритетом, а не покладався на workspace discovery.
- Відкидання дублікатів логуються, щоб Doctor і startup diagnostics могли вказати на відкинуту копію.

## Вимоги JSON Schema

- **Кожен плагін має постачати JSON Schema**, навіть якщо він не приймає config.
- Порожня schema прийнятна (наприклад, `{ "type": "object", "additionalProperties": false }`).
- Schemas валідуються під час config read/write, а не в runtime.

## Поведінка валідації

- Невідомі ключі `channels.*` є **помилками**, якщо ідентифікатор каналу не оголошено маніфестом Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` і `plugins.slots.*`
  мають посилатися на **доступні для виявлення** ідентифікатори Plugin. Невідомі ідентифікатори є **помилками**.
- Якщо Plugin встановлено, але його маніфест або схема пошкоджені чи відсутні,
  перевірка завершується невдало, а Doctor повідомляє про помилку Plugin.
- Якщо конфігурація Plugin існує, але Plugin **вимкнено**, конфігурація зберігається, а
  **попередження** відображається в Doctor + журналах.

Повну схему `plugins.*` див. у [довіднику з конфігурації](/uk/gateway/configuration).

## Примітки

- Маніфест є **обов’язковим для нативних Plugin OpenClaw**, зокрема для завантажень із локальної файлової системи. Runtime все одно завантажує модуль Plugin окремо; маніфест потрібен лише для виявлення та перевірки.
- Нативні маніфести аналізуються за допомогою JSON5, тому коментарі, завершальні коми й ключі без лапок приймаються, якщо кінцеве значення все ще є об’єктом.
- Завантажувач маніфестів читає лише задокументовані поля маніфесту. Уникайте власних ключів верхнього рівня.
- `channels`, `providers`, `cliBackends` і `skills` можна опустити, якщо Plugin вони не потрібні.
- `providerDiscoveryEntry` має залишатися легким і не повинен імпортувати широкий runtime-код; використовуйте його для статичних метаданих каталогу провайдерів або вузьких дескрипторів виявлення, а не для виконання під час запиту.
- Ексклюзивні види Plugin вибираються через `plugins.slots.*`: `kind: "memory"` через `plugins.slots.memory`, `kind: "context-engine"` через `plugins.slots.contextEngine` (за замовчуванням `legacy`).
- Оголошуйте ексклюзивний вид Plugin у цьому маніфесті. Runtime-запис `OpenClawPluginDefinition.kind` застарів і залишається лише як резервна сумісність для старіших Plugin.
- Метадані змінних середовища (`setup.providers[].envVars`, застарілі `providerAuthEnvVars` і `channelEnvVars`) є лише декларативними. Статус, аудит, перевірка доставки Cron та інші поверхні лише для читання все одно застосовують довіру до Plugin і політику ефективної активації, перш ніж вважати змінну середовища налаштованою.
- Для runtime-метаданих майстра, яким потрібен код провайдера, див. [runtime-хуки провайдера](/uk/plugins/architecture-internals#provider-runtime-hooks).
- Якщо ваш Plugin залежить від нативних модулів, задокументуйте кроки збірки та будь-які вимоги до allowlist менеджера пакетів (наприклад, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Пов’язане

<CardGroup cols={3}>
  <Card title="Створення Plugin" href="/uk/plugins/building-plugins" icon="rocket">
    Початок роботи з Plugin.
  </Card>
  <Card title="Архітектура Plugin" href="/uk/plugins/architecture" icon="diagram-project">
    Внутрішня архітектура та модель можливостей.
  </Card>
  <Card title="Огляд SDK" href="/uk/plugins/sdk-overview" icon="book">
    Довідник Plugin SDK та імпорти підшляхів.
  </Card>
</CardGroup>
