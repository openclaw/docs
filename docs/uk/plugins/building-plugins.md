---
read_when:
    - Ви хочете створити новий Plugin для OpenClaw
    - Вам потрібен швидкий старт для розробки Plugin
    - Ви додаєте до OpenClaw новий канал, провайдера, інструмент або іншу можливість
sidebarTitle: Getting Started
summary: Створіть свій перший Plugin для OpenClaw за лічені хвилини
title: Створення Plugin
x-i18n:
    generated_at: "2026-04-27T07:09:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 11c92fe91a4365e5774c0da9e70991a119217c517cd419a7f1307b50dea53378
    source_path: plugins/building-plugins.md
    workflow: 15
---

Plugins розширюють OpenClaw новими можливостями: канали, провайдери моделей,
мовлення, транскрибування в реальному часі, голос у реальному часі, розуміння медіа, генерація зображень, генерація відео, web fetch, web search, інструменти агентів або будь-яка
комбінація.

Вам не потрібно додавати свій Plugin до репозиторію OpenClaw. Опублікуйте його в
[ClawHub](/uk/tools/clawhub) або npm, і користувачі встановлять його за допомогою
`openclaw plugins install <package-name>`. OpenClaw спочатку пробує ClawHub і
автоматично переходить до npm у разі потреби.

## Передумови

- Node >= 22 і менеджер пакетів (npm або pnpm)
- Знання TypeScript (ESM)
- Для Plugin у репозиторії: клонований репозиторій і виконаний `pnpm install`

## Який тип Plugin?

<CardGroup cols={3}>
  <Card title="Channel Plugin" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Підключіть OpenClaw до платформи обміну повідомленнями (Discord, IRC тощо)
  </Card>
  <Card title="Provider Plugin" icon="cpu" href="/uk/plugins/sdk-provider-plugins">
    Додайте провайдера моделі (LLM, проксі або користувацьку кінцеву точку)
  </Card>
  <Card title="Tool / hook Plugin" icon="wrench" href="/uk/plugins/hooks">
    Зареєструйте інструменти агента, event hooks або сервіси — продовження нижче
  </Card>
</CardGroup>

Для Channel Plugin, встановлення якого не гарантується на момент запуску онбордингу/налаштування,
використовуйте `createOptionalChannelSetupSurface(...)` з
`openclaw/plugin-sdk/channel-setup`. Він створює пару адаптера налаштування й майстра,
яка повідомляє про вимогу встановлення й блокує реальні записи конфігурації
до встановлення Plugin.

## Швидкий старт: Tool Plugin

Цей покроковий приклад створює мінімальний Plugin, який реєструє інструмент агента. Для Channel
і Provider Plugin є окремі посібники за наведеними вище посиланнями.

<Steps>
  <Step title="Створіть пакет і маніфест">
    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-my-plugin",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "my-plugin",
      "name": "My Plugin",
      "description": "Додає користувацький інструмент до OpenClaw",
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Кожному Plugin потрібен маніфест, навіть якщо конфігурації немає. Див.
    [Маніфест](/uk/plugins/manifest), щоб переглянути повну схему. Канонічні фрагменти
    публікації в ClawHub містяться в `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Напишіть точку входу">

    ```typescript
    // index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { Type } from "@sinclair/typebox";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Do a thing",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return { content: [{ type: "text", text: `Got: ${params.input}` }] };
          },
        });
      },
    });
    ```

    `definePluginEntry` призначений для Plugin, які не є Channel Plugin. Для каналів використовуйте
    `defineChannelPluginEntry` — див. [Channel Plugins](/uk/plugins/sdk-channel-plugins).
    Повний перелік параметрів точки входу див. у [Точки входу](/uk/plugins/sdk-entrypoints).

  </Step>

  <Step title="Протестуйте й опублікуйте">

    **Зовнішні Plugin:** перевірте й опублікуйте за допомогою ClawHub, а потім установіть:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw також перевіряє ClawHub перед npm для простих специфікацій пакетів на кшталт
    `@myorg/openclaw-my-plugin`.

    **Plugin у репозиторії:** розмістіть у дереві workspace вбудованих Plugin — вони виявляються автоматично.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Можливості Plugin

Один Plugin може реєструвати будь-яку кількість можливостей через об’єкт `api`:

| Capability             | Registration method                              | Detailed guide                                                                  |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Текстовий inference (LLM)   | `api.registerProvider(...)`                      | [Provider Plugins](/uk/plugins/sdk-provider-plugins)                               |
| Бекенд inference для CLI  | `api.registerCliBackend(...)`                    | [CLI Backends](/uk/gateway/cli-backends)                                           |
| Channel / обмін повідомленнями    | `api.registerChannel(...)`                       | [Channel Plugins](/uk/plugins/sdk-channel-plugins)                                 |
| Мовлення (TTS/STT)       | `api.registerSpeechProvider(...)`                | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Транскрибування в реальному часі | `api.registerRealtimeTranscriptionProvider(...)` | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Голос у реальному часі         | `api.registerRealtimeVoiceProvider(...)`         | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Розуміння медіа    | `api.registerMediaUnderstandingProvider(...)`    | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація зображень       | `api.registerImageGenerationProvider(...)`       | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація музики       | `api.registerMusicGenerationProvider(...)`       | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація відео       | `api.registerVideoGenerationProvider(...)`       | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web fetch              | `api.registerWebFetchProvider(...)`              | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web search             | `api.registerWebSearchProvider(...)`             | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Проміжний шар результатів інструментів | `api.registerAgentToolResultMiddleware(...)`     | [Огляд SDK](/uk/plugins/sdk-overview#registration-api)                          |
| Інструменти агента            | `api.registerTool(...)`                          | Нижче                                                                           |
| Користувацькі команди        | `api.registerCommand(...)`                       | [Точки входу](/uk/plugins/sdk-entrypoints)                                        |
| Hooks Plugin           | `api.on(...)`                                    | [Plugin hooks](/uk/plugins/hooks)                                                  |
| Внутрішні event hooks   | `api.registerHook(...)`                          | [Точки входу](/uk/plugins/sdk-entrypoints)                                        |
| HTTP-маршрути            | `api.registerHttpRoute(...)`                     | [Внутрішні компоненти](/uk/plugins/architecture-internals#gateway-http-routes)                |
| Підкоманди CLI        | `api.registerCli(...)`                           | [Точки входу](/uk/plugins/sdk-entrypoints)                                        |

Повний API реєстрації див. у [Огляд SDK](/uk/plugins/sdk-overview#registration-api).

Вбудовані Plugins можуть використовувати `api.registerAgentToolResultMiddleware(...)`, коли їм
потрібне асинхронне переписування результатів інструментів до того, як модель побачить вивід. Оголосіть
цільові runtime у `contracts.agentToolResultMiddleware`, наприклад
`["pi", "codex"]`. Це шов довірених вбудованих Plugin; зовнішнім
Plugin слід надавати перевагу звичайним hooks Plugin OpenClaw, якщо OpenClaw не отримає
явної політики довіри для цієї можливості.

Якщо ваш Plugin реєструє користувацькі методи gateway RPC, залишайте їх у
префіксі, специфічному для Plugin. Простори імен адміністрування ядра (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди визначаються як
`operator.admin`, навіть якщо Plugin запитує вужчу область.

Семантика захисту hooks, про яку слід пам’ятати:

- `before_tool_call`: `{ block: true }` є остаточним і зупиняє обробники з нижчим пріоритетом.
- `before_tool_call`: `{ block: false }` обробляється як відсутність рішення.
- `before_tool_call`: `{ requireApproval: true }` призупиняє виконання агента й запитує схвалення користувача через накладку схвалення exec, кнопки Telegram, взаємодії Discord або команду `/approve` у будь-якому каналі.
- `before_install`: `{ block: true }` є остаточним і зупиняє обробники з нижчим пріоритетом.
- `before_install`: `{ block: false }` обробляється як відсутність рішення.
- `message_sending`: `{ cancel: true }` є остаточним і зупиняє обробники з нижчим пріоритетом.
- `message_sending`: `{ cancel: false }` обробляється як відсутність рішення.
- `message_received`: надавайте перевагу типізованому полю `threadId`, коли потрібна маршрутизація вхідних thread/topic. `metadata` залишайте для додаткових даних, специфічних для каналу.
- `message_sending`: надавайте перевагу типізованим полям маршрутизації `replyToId` / `threadId` замість ключів metadata, специфічних для каналу.

Команда `/approve` обробляє і схвалення exec, і схвалення Plugin з обмеженим резервним сценарієм: якщо ідентифікатор схвалення exec не знайдено, OpenClaw повторно пробує той самий ідентифікатор через схвалення Plugin. Переспрямування схвалення Plugin можна окремо налаштувати через `approvals.plugin` у конфігурації.

Якщо користувацькі механізми схвалення мають виявляти той самий випадок обмеженого резервного сценарію,
використовуйте `isApprovalNotFoundError` з `openclaw/plugin-sdk/error-runtime`,
а не ручне зіставлення рядків про завершення строку дії схвалення.

Приклади й довідник hooks див. у [Plugin hooks](/uk/plugins/hooks).

## Реєстрація інструментів агента

Інструменти — це типізовані функції, які може викликати LLM. Вони можуть бути обов’язковими (завжди
доступними) або необов’язковими (користувач сам вирішує, чи вмикати):

```typescript
register(api) {
  // Required tool — always available
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Optional tool — user must add to allowlist
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Run a workflow",
      parameters: Type.Object({ pipeline: Type.String() }),
      async execute(_id, params) {
        return { content: [{ type: "text", text: params.pipeline }] };
      },
    },
    { optional: true },
  );
}
```

Користувачі вмикають необов’язкові інструменти в конфігурації:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Назви інструментів не повинні конфліктувати з інструментами ядра (конфліктні пропускаються)
- Використовуйте `optional: true` для інструментів із побічними ефектами або додатковими вимогами до бінарних файлів
- Користувачі можуть увімкнути всі інструменти Plugin, додавши ідентифікатор Plugin до `tools.allow`

## Угоди щодо імпорту

Завжди імпортуйте з цільових шляхів `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

Повний довідник щодо підшляхів див. у [Огляд SDK](/uk/plugins/sdk-overview).

У межах вашого Plugin використовуйте локальні barrel-файли (`api.ts`, `runtime-api.ts`) для
внутрішніх імпортів — ніколи не імпортуйте власний Plugin через його шлях SDK.

Для Provider Plugin зберігайте допоміжні засоби, специфічні для провайдера, у цих barrel-файлах
кореня пакета, якщо тільки цей шов справді не є загальним. Поточні вбудовані приклади:

- Anthropic: обгортки потоку Claude і helper-и для `service_tier` / beta
- OpenAI: конструктори провайдерів, helper-и для моделей за замовчуванням, провайдери реального часу
- OpenRouter: конструктор провайдера плюс helper-и для онбордингу/конфігурації

Якщо helper корисний лише в межах одного пакета вбудованого провайдера, залишайте його на
цьому шві кореня пакета замість перенесення до `openclaw/plugin-sdk/*`.

Деякі згенеровані шви helper-ів `openclaw/plugin-sdk/<bundled-id>` досі існують для
супроводу вбудованих Plugin і сумісності, наприклад
`plugin-sdk/feishu-setup` або `plugin-sdk/zalo-setup`. Розглядайте їх як зарезервовані
поверхні, а не як типовий шаблон для нових сторонніх Plugin.

## Контрольний список перед поданням

<Check>**package.json** має правильні метадані `openclaw`</Check>
<Check>Маніфест **openclaw.plugin.json** присутній і валідний</Check>
<Check>Точка входу використовує `defineChannelPluginEntry` або `definePluginEntry`</Check>
<Check>Усі імпорти використовують цільові шляхи `plugin-sdk/<subpath>`</Check>
<Check>Внутрішні імпорти використовують локальні модулі, а не самоімпорти через SDK</Check>
<Check>Тести проходять (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` проходить (для Plugin у репозиторії)</Check>

## Тестування бета-релізу

1. Слідкуйте за тегами релізів GitHub у [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) і підпишіться через `Watch` > `Releases`. Бета-теги мають вигляд `v2026.3.N-beta.1`. Ви також можете ввімкнути сповіщення для офіційного X-акаунта OpenClaw [@openclaw](https://x.com/openclaw) про анонси релізів.
2. Протестуйте свій Plugin на бета-тезі щойно він з’явиться. Вікно до стабільного релізу зазвичай триває лише кілька годин.
3. Після тестування напишіть у гілці вашого Plugin у Discord-каналі `plugin-forum` або `all good`, або що саме зламалося. Якщо у вас ще немає гілки, створіть її.
4. Якщо щось зламалося, створіть або оновіть issue з назвою `Beta blocker: <plugin-name> - <summary>` і додайте мітку `beta-blocker`. Посилання на issue додайте у свою гілку.
5. Відкрийте PR до `main` з назвою `fix(<plugin-id>): beta blocker - <summary>` і додайте посилання на issue і в PR, і у вашу гілку в Discord. Контриб’ютори не можуть додавати мітки до PR, тому назва є сигналом на боці PR для супровідників і автоматизації. Блокери з PR зливаються; блокери без PR можуть усе одно потрапити в реліз. Супровідники стежать за цими гілками під час бета-тестування.
6. Відсутність повідомлень означає, що все гаразд. Якщо ви пропустите вікно, ваш виправлений код, імовірно, потрапить у наступний цикл.

## Наступні кроки

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Створіть Plugin каналу обміну повідомленнями
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/uk/plugins/sdk-provider-plugins">
    Створіть Plugin провайдера моделі
  </Card>
  <Card title="Огляд SDK" icon="book-open" href="/uk/plugins/sdk-overview">
    Карта імпортів і довідник API реєстрації
  </Card>
  <Card title="Допоміжні засоби runtime" icon="settings" href="/uk/plugins/sdk-runtime">
    TTS, пошук, субагент через api.runtime
  </Card>
  <Card title="Тестування" icon="test-tubes" href="/uk/plugins/sdk-testing">
    Утиліти та шаблони тестування
  </Card>
  <Card title="Маніфест Plugin" icon="file-json" href="/uk/plugins/manifest">
    Повний довідник зі схеми маніфесту
  </Card>
</CardGroup>

## Пов’язане

- [Архітектура Plugin](/uk/plugins/architecture) — поглиблений розбір внутрішньої архітектури
- [Огляд SDK](/uk/plugins/sdk-overview) — довідник SDK Plugin
- [Маніфест](/uk/plugins/manifest) — формат маніфесту plugin
- [Channel Plugins](/uk/plugins/sdk-channel-plugins) — створення плагінів каналів
- [Provider Plugins](/uk/plugins/sdk-provider-plugins) — створення плагінів провайдерів
