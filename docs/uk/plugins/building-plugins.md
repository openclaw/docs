---
read_when:
    - Ви хочете створити новий Plugin для OpenClaw
    - Вам потрібен короткий посібник із розробки Plugin
    - Ви додаєте новий канал, провайдера, інструмент або іншу можливість до OpenClaw
sidebarTitle: Getting Started
summary: Створіть свій перший OpenClaw Plugin за кілька хвилин
title: Створення Plugin-ів
x-i18n:
    generated_at: "2026-05-06T04:01:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e9718f8226a3586db06eae6715502edbd7a286f448e24cbef0a08f19a921c3a
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins розширюють OpenClaw новими можливостями: каналами, провайдерами моделей,
мовленням, транскрипцією в реальному часі, голосом у реальному часі, розумінням медіа, генерацією зображень, генерацією відео, web fetch, web search, інструментами агентів або будь-якою
комбінацією.

Вам не потрібно додавати свій Plugin до репозиторію OpenClaw. Опублікуйте його в
[ClawHub](/uk/tools/clawhub), і користувачі встановлять його за допомогою
`openclaw plugins install clawhub:<package-name>`. Специфікації bare-пакетів усе ще
встановлюються з npm під час перехідного запуску.

## Передумови

- Node >= 22 і менеджер пакетів (npm або pnpm)
- Знання TypeScript (ESM)
- Для Plugins у репозиторії: репозиторій клоновано, а `pnpm install` виконано. Розробка Plugin із
  checkout вихідного коду підтримує лише pnpm, тому що OpenClaw завантажує bundled
  Plugins з workspace-пакетів `extensions/*`.

## Який тип Plugin?

<CardGroup cols={3}>
  <Card title="Channel Plugin" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Підключіть OpenClaw до платформи обміну повідомленнями (Discord, IRC тощо)
  </Card>
  <Card title="Provider Plugin" icon="cpu" href="/uk/plugins/sdk-provider-plugins">
    Додайте провайдера моделей (LLM, проксі або власний endpoint)
  </Card>
  <Card title="Tool / hook Plugin" icon="wrench" href="/uk/plugins/hooks">
    Зареєструйте інструменти агента, hooks або сервіси - продовжуйте нижче
  </Card>
</CardGroup>

Для Channel Plugin, який не гарантовано буде встановлено під час onboarding/setup,
використовуйте `createOptionalChannelSetupSurface(...)` з
`openclaw/plugin-sdk/channel-setup`. Він створює пару setup adapter + wizard,
яка повідомляє про вимогу встановлення й закрито відмовляє в реальних записах конфігурації,
доки Plugin не буде встановлено.

## Швидкий старт: tool Plugin

Цей покроковий посібник створює мінімальний Plugin, який реєструє інструмент агента. Для Channel
і Provider Plugins є окремі посібники, посилання на які наведено вище.

<Steps>
  <Step title="Створіть пакет і manifest">
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
      "description": "Adds a custom tool to OpenClaw",
      "contracts": {
        "tools": ["my_tool"]
      },
      "activation": {
        "onStartup": true
      },
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Кожному Plugin потрібен manifest, навіть без конфігурації. Інструменти, зареєстровані під час виконання,
    мають бути перелічені в `contracts.tools`, щоб OpenClaw міг знайти Plugin-власника
    без завантаження кожного runtime Plugin. Plugins також мають свідомо оголошувати
    `activation.onStartup`. У цьому прикладі встановлено `true`. Повну схему дивіться в
    [Manifest](/uk/plugins/manifest). Канонічні snippets публікації ClawHub
    містяться в `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Напишіть entry point">

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

    `definePluginEntry` призначений для Plugins, що не є каналами. Для каналів використовуйте
    `defineChannelPluginEntry` - дивіться [Channel Plugins](/uk/plugins/sdk-channel-plugins).
    Повні опції entry point дивіться в [Entry Points](/uk/plugins/sdk-entrypoints).

  </Step>

  <Step title="Протестуйте й опублікуйте">

    **Зовнішні Plugins:** перевірте й опублікуйте через ClawHub, потім встановіть:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    Bare-специфікації пакетів, як-от `@myorg/openclaw-my-plugin`, встановлюються з npm під час
    перехідного запуску. Використовуйте `clawhub:`, коли потрібна резолюція ClawHub.

    **Plugins у репозиторії:** розмістіть у дереві workspace bundled Plugin - їх буде знайдено автоматично.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Можливості Plugin

Один Plugin може зареєструвати будь-яку кількість можливостей через об'єкт `api`:

| Можливість             | Метод реєстрації                                | Докладний посібник                                                            |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Текстове inference (LLM) | `api.registerProvider(...)`                      | [Provider Plugins](/uk/plugins/sdk-provider-plugins)                               |
| Backend inference для CLI | `api.registerCliBackend(...)`                    | [CLI Backends](/uk/gateway/cli-backends)                                           |
| Канал / повідомлення   | `api.registerChannel(...)`                       | [Channel Plugins](/uk/plugins/sdk-channel-plugins)                                 |
| Мовлення (TTS/STT)     | `api.registerSpeechProvider(...)`                | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Транскрипція в реальному часі | `api.registerRealtimeTranscriptionProvider(...)` | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Голос у реальному часі | `api.registerRealtimeVoiceProvider(...)`         | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Розуміння медіа        | `api.registerMediaUnderstandingProvider(...)`    | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація зображень    | `api.registerImageGenerationProvider(...)`       | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація музики       | `api.registerMusicGenerationProvider(...)`       | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація відео        | `api.registerVideoGenerationProvider(...)`       | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web fetch              | `api.registerWebFetchProvider(...)`              | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web search             | `api.registerWebSearchProvider(...)`             | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Middleware результатів інструментів | `api.registerAgentToolResultMiddleware(...)`     | [SDK Overview](/uk/plugins/sdk-overview#registration-api)                          |
| Інструменти агента     | `api.registerTool(...)`                          | Нижче                                                                          |
| Власні команди         | `api.registerCommand(...)`                       | [Entry Points](/uk/plugins/sdk-entrypoints)                                        |
| Plugin hooks           | `api.on(...)`                                    | [Plugin hooks](/uk/plugins/hooks)                                                  |
| Внутрішні event hooks  | `api.registerHook(...)`                          | [Entry Points](/uk/plugins/sdk-entrypoints)                                        |
| HTTP routes            | `api.registerHttpRoute(...)`                     | [Internals](/uk/plugins/architecture-internals#gateway-http-routes)                |
| CLI subcommands        | `api.registerCli(...)`                           | [Entry Points](/uk/plugins/sdk-entrypoints)                                        |

Повний registration API дивіться в [SDK Overview](/uk/plugins/sdk-overview#registration-api).

Bundled Plugins можуть використовувати `api.registerAgentToolResultMiddleware(...)`, коли їм
потрібне асинхронне переписування результатів інструментів до того, як модель побачить output. Оголосіть
цільові runtimes у `contracts.agentToolResultMiddleware`, наприклад
`["pi", "codex"]`. Це довірена межа bundled Plugin; зовнішнім
Plugins варто віддавати перевагу звичайним hooks OpenClaw Plugin, доки OpenClaw не отримає
явну політику довіри для цієї можливості.

Якщо ваш Plugin реєструє власні Gateway RPC methods, тримайте їх на
префіксі, специфічному для Plugin. Core admin namespaces (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди резолвляться в
`operator.admin`, навіть якщо Plugin запитує вужчу scope.

Семантика hook guard, яку варто пам'ятати:

- `before_tool_call`: `{ block: true }` є термінальною і зупиняє handlers з нижчим пріоритетом.
- `before_tool_call`: `{ block: false }` трактується як відсутність рішення.
- `before_tool_call`: `{ requireApproval: true }` призупиняє виконання агента й запитує схвалення користувача через exec approval overlay, кнопки Telegram, взаємодії Discord або команду `/approve` у будь-якому каналі.
- `before_install`: `{ block: true }` є термінальною і зупиняє handlers з нижчим пріоритетом.
- `before_install`: `{ block: false }` трактується як відсутність рішення.
- `message_sending`: `{ cancel: true }` є термінальною і зупиняє handlers з нижчим пріоритетом.
- `message_sending`: `{ cancel: false }` трактується як відсутність рішення.
- `message_received`: віддавайте перевагу типізованому полю `threadId`, коли потрібна маршрутизація inbound thread/topic. Залишайте `metadata` для специфічних для каналу додаткових даних.
- `message_sending`: віддавайте перевагу типізованим полям маршрутизації `replyToId` / `threadId` замість специфічних для каналу ключів metadata.

Команда `/approve` обробляє як exec approvals, так і Plugin approvals з обмеженим fallback: коли exec approval id не знайдено, OpenClaw повторює той самий id через Plugin approvals. Пересилання Plugin approval можна налаштувати незалежно через `approvals.plugin` у конфігурації.

Якщо власна approval plumbing має виявляти той самий обмежений fallback-випадок,
віддавайте перевагу `isApprovalNotFoundError` з `openclaw/plugin-sdk/error-runtime`
замість ручного зіставлення рядків про expiration approval.

Приклади й довідник hooks дивіться в [Plugin hooks](/uk/plugins/hooks).

## Реєстрація інструментів агента

Інструменти - це типізовані функції, які LLM може викликати. Вони можуть бути required (завжди
доступні) або optional (користувач вмикає їх самостійно):

```typescript
register(api) {
  // Required tool - always available
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Optional tool - user must add to allowlist
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

Кожен інструмент, зареєстрований через `api.registerTool(...)`, також має бути оголошений у
manifest Plugin:

```json
{
  "contracts": {
    "tools": ["my_tool", "workflow_tool"]
  },
  "toolMetadata": {
    "workflow_tool": {
      "optional": true
    }
  }
}
```

OpenClaw захоплює та кешує перевірений дескриптор із зареєстрованого інструмента,
тому плагіни не дублюють дані `description` або схеми в маніфесті. Контракт
маніфесту лише оголошує власність і виявлення; виконання все одно викликає
актуальну зареєстровану реалізацію інструмента.
Задайте `toolMetadata.<tool>.optional: true` для інструментів, зареєстрованих через
`api.registerTool(..., { optional: true })`, щоб OpenClaw міг не завантажувати
runtime цього плагіна, доки інструмент явно не буде додано до списку дозволених.

Користувачі вмикають необов’язкові інструменти в конфігурації:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Назви інструментів не мають конфліктувати з основними інструментами (конфлікти пропускаються)
- Інструменти з некоректними об’єктами реєстрації, зокрема без `parameters`, пропускаються та повідомляються в діагностиці плагіна замість того, щоб ламати запуски агента
- Використовуйте `optional: true` для інструментів із побічними ефектами або додатковими вимогами до бінарних файлів
- Користувачі можуть увімкнути всі інструменти з плагіна, додавши id плагіна до `tools.allow`

## Реєстрація команд CLI

Плагіни можуть додавати кореневі групи команд `openclaw` за допомогою `api.registerCli`. Надайте
`descriptors` для кожного кореня команди верхнього рівня, щоб OpenClaw міг показувати та маршрутизувати
команду без завчасного завантаження runtime кожного плагіна.

```typescript
register(api) {
  api.registerCli(
    ({ program }) => {
      const demo = program
        .command("demo-plugin")
        .description("Run demo plugin commands");

      demo
        .command("ping")
        .description("Check that the plugin CLI is executable")
        .action(() => {
          console.log("demo-plugin:pong");
        });
    },
    {
      descriptors: [
        {
          name: "demo-plugin",
          description: "Run demo plugin commands",
          hasSubcommands: true,
        },
      ],
    },
  );
}
```

Після встановлення перевірте реєстрацію runtime і виконайте команду:

```bash
openclaw plugins inspect demo-plugin --runtime --json
openclaw demo-plugin ping
```

## Умовні правила імпорту

Завжди імпортуйте зі сфокусованих шляхів `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

Повний довідник підшляхів див. у [Огляді SDK](/uk/plugins/sdk-overview).

У своєму плагіні використовуйте локальні barrel-файли (`api.ts`, `runtime-api.ts`) для
внутрішніх імпортів - ніколи не імпортуйте власний плагін через його шлях SDK.

Для плагінів провайдерів тримайте специфічні для провайдера допоміжні функції в цих barrel-файлах
кореня пакета, якщо межа не є справді загальною. Поточні вбудовані приклади:

- Anthropic: обгортки потоків Claude і допоміжні функції `service_tier` / beta
- OpenAI: збирачі провайдерів, допоміжні функції моделей за замовчуванням, провайдери realtime
- OpenRouter: збирач провайдера плюс допоміжні функції onboarding/config

Якщо допоміжна функція корисна лише всередині одного вбудованого пакета провайдера, тримайте її на цій
межі кореня пакета замість просування до `openclaw/plugin-sdk/*`.

Деякі згенеровані допоміжні межі `openclaw/plugin-sdk/<bundled-id>` досі існують для
обслуговування вбудованих плагінів, коли вони мають відстежене використання власником. Розглядайте їх як
зарезервовані поверхні, а не як типовий шаблон для нових сторонніх плагінів.

## Контрольний список перед надсиланням

<Check>**package.json** має коректні метадані `openclaw`</Check>
<Check>Маніфест **openclaw.plugin.json** наявний і дійсний</Check>
<Check>Точка входу використовує `defineChannelPluginEntry` або `definePluginEntry`</Check>
<Check>Усі імпорти використовують сфокусовані шляхи `plugin-sdk/<subpath>`</Check>
<Check>Внутрішні імпорти використовують локальні модулі, а не самоімпорти SDK</Check>
<Check>Тести проходять (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` проходить (для плагінів у репозиторії)</Check>

## Тестування beta-релізу

1. Стежте за тегами релізів GitHub на [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) і підпишіться через `Watch` > `Releases`. Beta-теги мають вигляд `v2026.3.N-beta.1`. Ви також можете ввімкнути сповіщення для офіційного X-акаунта OpenClaw [@openclaw](https://x.com/openclaw), щоб отримувати оголошення про релізи.
2. Протестуйте свій плагін із beta-тегом, щойно він з’явиться. Вікно до stable зазвичай триває лише кілька годин.
3. Напишіть у гілці свого плагіна в каналі Discord `plugin-forum` після тестування: або `all good`, або що саме зламалося. Якщо у вас ще немає гілки, створіть її.
4. Якщо щось зламалося, відкрийте або оновіть issue з назвою `Beta blocker: <plugin-name> - <summary>` і застосуйте мітку `beta-blocker`. Додайте посилання на issue у свою гілку.
5. Відкрийте PR до `main` з назвою `fix(<plugin-id>): beta blocker - <summary>` і додайте посилання на issue як у PR, так і у своїй гілці Discord. Контриб’ютори не можуть ставити мітки на PR, тому назва є сигналом на боці PR для супровідників і автоматизації. Блокери з PR об’єднуються; блокери без PR можуть бути випущені попри це. Супровідники стежать за цими гілками під час beta-тестування.
6. Мовчання означає зелений статус. Якщо ви пропустите вікно, ваше виправлення, ймовірно, потрапить у наступний цикл.

## Наступні кроки

<CardGroup cols={2}>
  <Card title="Плагіни каналів" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Створіть плагін каналу повідомлень
  </Card>
  <Card title="Плагіни провайдерів" icon="cpu" href="/uk/plugins/sdk-provider-plugins">
    Створіть плагін провайдера моделей
  </Card>
  <Card title="Огляд SDK" icon="book-open" href="/uk/plugins/sdk-overview">
    Мапа імпортів і довідник API реєстрації
  </Card>
  <Card title="Допоміжні функції runtime" icon="settings" href="/uk/plugins/sdk-runtime">
    TTS, пошук, субагент через api.runtime
  </Card>
  <Card title="Тестування" icon="test-tubes" href="/uk/plugins/sdk-testing">
    Утиліти та шаблони тестування
  </Card>
  <Card title="Маніфест Plugin" icon="file-json" href="/uk/plugins/manifest">
    Повний довідник схеми маніфесту
  </Card>
</CardGroup>

## Пов’язане

- [Архітектура Plugin](/uk/plugins/architecture) - поглиблений огляд внутрішньої архітектури
- [Огляд SDK](/uk/plugins/sdk-overview) - довідник SDK для Plugin
- [Маніфест](/uk/plugins/manifest) - формат маніфесту плагіна
- [Плагіни каналів](/uk/plugins/sdk-channel-plugins) - створення плагінів каналів
- [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins) - створення плагінів провайдерів
