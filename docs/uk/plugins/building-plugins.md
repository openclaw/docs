---
read_when:
    - Ви хочете створити новий OpenClaw Plugin
    - Вам потрібен короткий посібник для швидкого старту з розробки Plugin
    - Ви додаєте новий канал, провайдера, інструмент або іншу можливість до OpenClaw
sidebarTitle: Getting Started
summary: Створіть свій перший Plugin для OpenClaw за лічені хвилини
title: Створення Pluginів
x-i18n:
    generated_at: "2026-05-02T19:11:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: b42170b40094f89a63b1497c08ec31e397931dd536bd6faeeb8bc3c123ae45d1
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins розширюють OpenClaw новими можливостями: каналами, провайдерами моделей,
мовленням, транскрипцією в реальному часі, голосом у реальному часі, розумінням медіа, генерацією зображень,
генерацією відео, web fetch, web search, інструментами агента або будь-якою
комбінацією.

Вам не потрібно додавати свій plugin до репозиторію OpenClaw. Опублікуйте його в
[ClawHub](/uk/tools/clawhub), а користувачі встановлять за допомогою
`openclaw plugins install clawhub:<package-name>`. Bare package specs усе ще
встановлюються з npm під час launch cutover.

## Передумови

- Node >= 22 і менеджер пакетів (npm або pnpm)
- Знайомство з TypeScript (ESM)
- Для plugins у репозиторії: репозиторій клоновано і виконано `pnpm install`. Розробка plugin з
  source checkout підтримується лише з pnpm, бо OpenClaw завантажує bundled
  plugins з workspace-пакетів `extensions/*`.

## Який тип plugin?

<CardGroup cols={3}>
  <Card title="Channel plugin" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Підключіть OpenClaw до платформи обміну повідомленнями (Discord, IRC тощо)
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/uk/plugins/sdk-provider-plugins">
    Додайте провайдера моделей (LLM, проксі або власний endpoint)
  </Card>
  <Card title="Tool / hook plugin" icon="wrench" href="/uk/plugins/hooks">
    Зареєструйте інструменти агента, event hooks або сервіси — продовжуйте нижче
  </Card>
</CardGroup>

Для channel plugin, який не гарантовано буде встановлено під час onboarding/setup,
використовуйте `createOptionalChannelSetupSurface(...)` з
`openclaw/plugin-sdk/channel-setup`. Він створює пару setup adapter + wizard,
яка повідомляє про вимогу встановлення і fail closed для реальних записів конфігурації,
доки plugin не встановлено.

## Швидкий старт: tool plugin

У цьому покроковому прикладі створюється мінімальний plugin, який реєструє інструмент агента. Channel
і provider plugins мають окремі посібники, посилання на які наведено вище.

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

    Кожному plugin потрібен manifest, навіть без конфігурації. Інструменти, зареєстровані під час runtime,
    мають бути перелічені в `contracts.tools`, щоб OpenClaw міг виявити власника
    plugin без завантаження runtime кожного plugin. Plugins також мають навмисно оголошувати
    `activation.onStartup`. У цьому прикладі встановлено `true`. Див.
    [Manifest](/uk/plugins/manifest) для повної schema. Канонічні фрагменти публікації в ClawHub
    розміщені в `docs/snippets/plugin-publish/`.

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

    `definePluginEntry` призначено для не-channel plugins. Для каналів використовуйте
    `defineChannelPluginEntry` — див. [Channel Plugins](/uk/plugins/sdk-channel-plugins).
    Повні параметри entry point див. у [Entry Points](/uk/plugins/sdk-entrypoints).

  </Step>

  <Step title="Протестуйте й опублікуйте">

    **Зовнішні plugins:** перевірте й опублікуйте через ClawHub, потім встановіть:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    Bare package specs на кшталт `@myorg/openclaw-my-plugin` встановлюються з npm під час
    launch cutover. Використовуйте `clawhub:`, коли потрібне resolution через ClawHub.

    **Plugins у репозиторії:** розмістіть під деревом bundled plugin workspace — їх буде автоматично виявлено.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Можливості Plugin

Один plugin може зареєструвати будь-яку кількість можливостей через об’єкт `api`:

| Можливість             | Метод реєстрації                              | Докладний посібник                                                                  |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Текстовий inference (LLM)   | `api.registerProvider(...)`                      | [Provider Plugins](/uk/plugins/sdk-provider-plugins)                               |
| Backend для CLI inference  | `api.registerCliBackend(...)`                    | [CLI Backends](/uk/gateway/cli-backends)                                           |
| Канал / обмін повідомленнями    | `api.registerChannel(...)`                       | [Channel Plugins](/uk/plugins/sdk-channel-plugins)                                 |
| Мовлення (TTS/STT)       | `api.registerSpeechProvider(...)`                | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Транскрипція в реальному часі | `api.registerRealtimeTranscriptionProvider(...)` | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Голос у реальному часі         | `api.registerRealtimeVoiceProvider(...)`         | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Розуміння медіа    | `api.registerMediaUnderstandingProvider(...)`    | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація зображень       | `api.registerImageGenerationProvider(...)`       | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація музики       | `api.registerMusicGenerationProvider(...)`       | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація відео       | `api.registerVideoGenerationProvider(...)`       | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web fetch              | `api.registerWebFetchProvider(...)`              | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web search             | `api.registerWebSearchProvider(...)`             | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Middleware результатів інструментів | `api.registerAgentToolResultMiddleware(...)`     | [SDK Overview](/uk/plugins/sdk-overview#registration-api)                          |
| Інструменти агента            | `api.registerTool(...)`                          | Нижче                                                                           |
| Власні команди        | `api.registerCommand(...)`                       | [Entry Points](/uk/plugins/sdk-entrypoints)                                        |
| Hooks Plugin           | `api.on(...)`                                    | [Plugin hooks](/uk/plugins/hooks)                                                  |
| Внутрішні event hooks   | `api.registerHook(...)`                          | [Entry Points](/uk/plugins/sdk-entrypoints)                                        |
| HTTP-маршрути            | `api.registerHttpRoute(...)`                     | [Internals](/uk/plugins/architecture-internals#gateway-http-routes)                |
| Підкоманди CLI        | `api.registerCli(...)`                           | [Entry Points](/uk/plugins/sdk-entrypoints)                                        |

Повний registration API див. у [SDK Overview](/uk/plugins/sdk-overview#registration-api).

Bundled plugins можуть використовувати `api.registerAgentToolResultMiddleware(...)`, коли їм
потрібне асинхронне переписування результатів інструментів до того, як модель побачить output. Оголосіть
цільові runtimes у `contracts.agentToolResultMiddleware`, наприклад
`["pi", "codex"]`. Це довірений seam для bundled-plugin; зовнішнім
plugins варто надавати перевагу звичайним hooks OpenClaw plugin, якщо OpenClaw не додасть
явну trust policy для цієї можливості.

Якщо ваш plugin реєструє власні Gateway RPC-методи, тримайте їх на
префіксі, специфічному для plugin. Core admin namespaces (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) лишаються зарезервованими й завжди resolve до
`operator.admin`, навіть якщо plugin просить вужчий scope.

Семантика hook guard, яку варто пам’ятати:

- `before_tool_call`: `{ block: true }` є terminal і зупиняє handlers із нижчим priority.
- `before_tool_call`: `{ block: false }` трактується як відсутність рішення.
- `before_tool_call`: `{ requireApproval: true }` призупиняє виконання агента й просить користувача підтвердити дію через exec approval overlay, кнопки Telegram, взаємодії Discord або команду `/approve` у будь-якому каналі.
- `before_install`: `{ block: true }` є terminal і зупиняє handlers із нижчим priority.
- `before_install`: `{ block: false }` трактується як відсутність рішення.
- `message_sending`: `{ cancel: true }` є terminal і зупиняє handlers із нижчим priority.
- `message_sending`: `{ cancel: false }` трактується як відсутність рішення.
- `message_received`: надавайте перевагу typed полю `threadId`, коли потрібна маршрутизація вхідного thread/topic. Залишайте `metadata` для channel-specific додаткових даних.
- `message_sending`: надавайте перевагу typed полям маршрутизації `replyToId` / `threadId` замість channel-specific metadata keys.

Команда `/approve` обробляє як exec, так і plugin approvals з обмеженим fallback: коли exec approval id не знайдено, OpenClaw повторює той самий id через plugin approvals. Пересилання plugin approval можна налаштувати незалежно через `approvals.plugin` у конфігурації.

Якщо власна approval plumbing має визначати той самий випадок bounded fallback,
використовуйте `isApprovalNotFoundError` з `openclaw/plugin-sdk/error-runtime`
замість ручного зіставлення рядків approval-expiry.

Приклади й довідку hooks див. у [Plugin hooks](/uk/plugins/hooks).

## Реєстрація інструментів агента

Інструменти — це типізовані функції, які LLM може викликати. Вони можуть бути required (завжди
доступні) або optional (користувач вмикає сам):

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

Кожен інструмент, зареєстрований через `api.registerTool(...)`, також має бути оголошений у
manifest plugin:

```json
{
  "contracts": {
    "tools": ["my_tool", "workflow_tool"]
  }
}
```

OpenClaw фіксує й кешує перевірений descriptor із зареєстрованого інструмента,
тож plugins не дублюють `description` або schema data у manifest. Контракт
manifest лише оголошує ownership і discovery; виконання все одно викликає
живу зареєстровану реалізацію інструмента.

Користувачі вмикають optional tools у конфігурації:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Назви інструментів не мають конфліктувати з core tools (конфлікти пропускаються)
- Інструменти з некоректно сформованими об’єктами реєстрації, зокрема без `parameters`, пропускаються й повідомляються в діагностиці Plugin замість того, щоб ламати запуски агентів
- Використовуйте `optional: true` для інструментів із побічними ефектами або додатковими вимогами до бінарних файлів
- Користувачі можуть увімкнути всі інструменти з Plugin, додавши ідентифікатор Plugin до `tools.allow`

## Реєстрація команд CLI

Plugin-и можуть додавати кореневі групи команд `openclaw` через `api.registerCli`. Надайте
`descriptors` для кожного кореня команди верхнього рівня, щоб OpenClaw міг показувати й маршрутизувати
команду без передчасного завантаження кожного середовища виконання Plugin.

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

Після встановлення перевірте реєстрацію середовища виконання та виконайте команду:

```bash
openclaw plugins inspect demo-plugin --runtime --json
openclaw demo-plugin ping
```

## Угоди щодо імпорту

Завжди імпортуйте зі сфокусованих шляхів `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

Повний довідник підшляхів див. в [Огляді SDK](/uk/plugins/sdk-overview).

Усередині вашого Plugin використовуйте локальні barrel-файли (`api.ts`, `runtime-api.ts`) для
внутрішніх імпортів — ніколи не імпортуйте власний Plugin через його шлях SDK.

Для Plugin-ів провайдерів тримайте специфічні для провайдера допоміжні засоби в цих barrel-файлах
кореня пакета, якщо межа не є справді загальною. Поточні вбудовані приклади:

- Anthropic: обгортки потоків Claude і допоміжні засоби `service_tier` / beta
- OpenAI: конструктори провайдерів, допоміжні засоби моделей за замовчуванням, realtime-провайдери
- OpenRouter: конструктор провайдера та допоміжні засоби onboarding/конфігурації

Якщо допоміжний засіб корисний лише всередині одного вбудованого пакета провайдера, тримайте його на цій
межі кореня пакета замість просування в `openclaw/plugin-sdk/*`.

Деякі згенеровані допоміжні межі `openclaw/plugin-sdk/<bundled-id>` усе ще існують для
супроводу вбудованих Plugin-ів, коли вони мають відстежене використання власником. Сприймайте їх як
зарезервовані поверхні, а не як типовий шаблон для нових сторонніх Plugin-ів.

## Контрольний список перед поданням

<Check>**package.json** має коректні метадані `openclaw`</Check>
<Check>Маніфест **openclaw.plugin.json** присутній і валідний</Check>
<Check>Точка входу використовує `defineChannelPluginEntry` або `definePluginEntry`</Check>
<Check>Усі імпорти використовують сфокусовані шляхи `plugin-sdk/<subpath>`</Check>
<Check>Внутрішні імпорти використовують локальні модулі, а не самоімпорти SDK</Check>
<Check>Тести проходять (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` проходить (для Plugin-ів у репозиторії)</Check>

## Тестування beta-релізів

1. Стежте за тегами релізів GitHub на [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) і підпишіться через `Watch` > `Releases`. Beta-теги мають вигляд `v2026.3.N-beta.1`. Ви також можете ввімкнути сповіщення для офіційного X-акаунта OpenClaw [@openclaw](https://x.com/openclaw), щоб отримувати оголошення про релізи.
2. Протестуйте свій Plugin із beta-тегом одразу після його появи. Вікно до stable зазвичай становить лише кілька годин.
3. Після тестування напишіть у гілці свого Plugin в Discord-каналі `plugin-forum` або `all good`, або що зламалося. Якщо у вас ще немає гілки, створіть її.
4. Якщо щось ламається, відкрийте або оновіть issue з назвою `Beta blocker: <plugin-name> - <summary>` і застосуйте мітку `beta-blocker`. Додайте посилання на issue у свою гілку.
5. Відкрийте PR до `main` з назвою `fix(<plugin-id>): beta blocker - <summary>` і додайте посилання на issue як у PR, так і у своїй Discord-гілці. Контриб’ютори не можуть додавати мітки до PR, тому назва є сигналом з боку PR для мейнтейнерів і автоматизації. Блокери з PR зливаються; блокери без PR можуть усе одно потрапити в реліз. Мейнтейнери стежать за цими гілками під час beta-тестування.
6. Мовчання означає зелений статус. Якщо ви пропустите вікно, ваше виправлення, ймовірно, потрапить у наступний цикл.

## Наступні кроки

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Створіть Plugin каналу повідомлень
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/uk/plugins/sdk-provider-plugins">
    Створіть Plugin провайдера моделей
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/uk/plugins/sdk-overview">
    Довідник карти імпортів і API реєстрації
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/uk/plugins/sdk-runtime">
    TTS, пошук, субагент через api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/uk/plugins/sdk-testing">
    Тестові утиліти та шаблони
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/uk/plugins/manifest">
    Повний довідник схеми маніфесту
  </Card>
</CardGroup>

## Пов’язане

- [Архітектура Plugin](/uk/plugins/architecture) — глибокий огляд внутрішньої архітектури
- [Огляд SDK](/uk/plugins/sdk-overview) — довідник Plugin SDK
- [Маніфест](/uk/plugins/manifest) — формат маніфесту Plugin
- [Plugin-и каналів](/uk/plugins/sdk-channel-plugins) — створення Plugin-ів каналів
- [Plugin-и провайдерів](/uk/plugins/sdk-provider-plugins) — створення Plugin-ів провайдерів
