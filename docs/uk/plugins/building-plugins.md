---
read_when:
    - Ви хочете створити новий Plugin OpenClaw
    - Вам потрібен короткий посібник для швидкого старту з розробки Plugin
    - Ви додаєте новий канал, провайдера, інструмент або іншу можливість в OpenClaw
sidebarTitle: Getting Started
summary: Створіть свій перший Plugin OpenClaw за лічені хвилини
title: Створення плагінів
x-i18n:
    generated_at: "2026-05-02T01:11:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: e05c82cd810ed400a293cf0c336efeb6e5a6e081b144eb89150407754a98bc19
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins розширюють OpenClaw новими можливостями: канали, постачальники моделей,
мовлення, транскрипція в реальному часі, голос у реальному часі, розуміння
медіа, генерація зображень, генерація відео, web fetch, web search, інструменти агента або будь-яка
комбінація.

Вам не потрібно додавати свій plugin до репозиторію OpenClaw. Опублікуйте в
[ClawHub](/uk/tools/clawhub), і користувачі встановлять його через
`openclaw plugins install <package-name>`. OpenClaw спочатку пробує ClawHub і
автоматично повертається до npm для пакетів, які все ще використовують дистрибуцію npm.

## Передумови

- Node >= 22 і менеджер пакетів (npm або pnpm)
- Знайомство з TypeScript (ESM)
- Для plugins у репозиторії: репозиторій клоновано й виконано `pnpm install`. Розробка plugin із
  checkout вихідного коду підтримує лише pnpm, бо OpenClaw завантажує bundled
  plugins з пакетів workspace `extensions/*`.

## Який тип plugin?

<CardGroup cols={3}>
  <Card title="Channel plugin" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Підключіть OpenClaw до платформи обміну повідомленнями (Discord, IRC тощо)
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/uk/plugins/sdk-provider-plugins">
    Додайте постачальника моделей (LLM, proxy або власний endpoint)
  </Card>
  <Card title="Tool / hook plugin" icon="wrench" href="/uk/plugins/hooks">
    Зареєструйте інструменти агента, event hooks або сервіси — продовжуйте нижче
  </Card>
</CardGroup>

Для channel plugin, який не гарантовано буде встановлено під час onboarding/setup,
використовуйте `createOptionalChannelSetupSurface(...)` з
`openclaw/plugin-sdk/channel-setup`. Він створює пару setup adapter + wizard,
яка повідомляє про вимогу встановлення й завершується закрито під час реальних записів конфігурації,
доки plugin не буде встановлено.

## Швидкий старт: tool plugin

Цей посібник створює мінімальний plugin, який реєструє інструмент агента. Для channel
і provider plugins є окремі посібники за посиланнями вище.

<Steps>
  <Step title="Create the package and manifest">
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

    Кожному plugin потрібен manifest, навіть без конфігурації, і кожен plugin має
    свідомо оголошувати `activation.onStartup`. Інструментам, зареєстрованим під час runtime,
    потрібен імпорт під час startup, тому в цьому прикладі встановлено `true`. Див.
    [Manifest](/uk/plugins/manifest) для повної схеми. Канонічні фрагменти публікації ClawHub
    містяться в `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Write the entry point">

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

    `definePluginEntry` призначений для plugins, що не є channel plugins. Для channels використовуйте
    `defineChannelPluginEntry` — див. [Channel Plugins](/uk/plugins/sdk-channel-plugins).
    Повні параметри entry point див. у [Entry Points](/uk/plugins/sdk-entrypoints).

  </Step>

  <Step title="Test and publish">

    **Зовнішні plugins:** перевірте й опублікуйте через ClawHub, потім встановіть:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw також перевіряє ClawHub перед npm для bare package specs на кшталт
    `@myorg/openclaw-my-plugin`; npm залишається fallback для пакетів, які ще
    не мігрували до ClawHub.

    **Plugins у репозиторії:** розмістіть під bundled plugin workspace tree — буде виявлено автоматично.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Можливості Plugin

Один plugin може зареєструвати будь-яку кількість можливостей через об'єкт `api`:

| Можливість             | Метод реєстрації                              | Докладний посібник                                                                  |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Text inference (LLM)   | `api.registerProvider(...)`                      | [Provider Plugins](/uk/plugins/sdk-provider-plugins)                               |
| CLI inference backend  | `api.registerCliBackend(...)`                    | [CLI Backends](/uk/gateway/cli-backends)                                           |
| Channel / messaging    | `api.registerChannel(...)`                       | [Channel Plugins](/uk/plugins/sdk-channel-plugins)                                 |
| Speech (TTS/STT)       | `api.registerSpeechProvider(...)`                | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
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
| Plugin hooks           | `api.on(...)`                                    | [Plugin hooks](/uk/plugins/hooks)                                                  |
| Internal event hooks   | `api.registerHook(...)`                          | [Entry Points](/uk/plugins/sdk-entrypoints)                                        |
| HTTP routes            | `api.registerHttpRoute(...)`                     | [Internals](/uk/plugins/architecture-internals#gateway-http-routes)                |
| CLI subcommands        | `api.registerCli(...)`                           | [Entry Points](/uk/plugins/sdk-entrypoints)                                        |

Повний registration API див. у [SDK Overview](/uk/plugins/sdk-overview#registration-api).

Bundled plugins можуть використовувати `api.registerAgentToolResultMiddleware(...)`, коли їм
потрібне асинхронне переписування результату інструмента до того, як модель побачить вивід. Оголосіть
цільові runtimes у `contracts.agentToolResultMiddleware`, наприклад
`["pi", "codex"]`. Це довірений seam для bundled-plugin; зовнішнім
plugins варто надавати перевагу звичайним OpenClaw plugin hooks, доки OpenClaw не отримає
явну trust policy для цієї можливості.

Якщо ваш plugin реєструє власні gateway RPC methods, тримайте їх на
префіксі, специфічному для plugin. Core admin namespaces (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди resolve до
`operator.admin`, навіть якщо plugin просить вужчий scope.

Семантика hook guard, яку варто пам'ятати:

- `before_tool_call`: `{ block: true }` є terminal і зупиняє handlers з нижчим пріоритетом.
- `before_tool_call`: `{ block: false }` обробляється як відсутність рішення.
- `before_tool_call`: `{ requireApproval: true }` призупиняє виконання агента й запитує підтвердження користувача через exec approval overlay, кнопки Telegram, взаємодії Discord або команду `/approve` у будь-якому channel.
- `before_install`: `{ block: true }` є terminal і зупиняє handlers з нижчим пріоритетом.
- `before_install`: `{ block: false }` обробляється як відсутність рішення.
- `message_sending`: `{ cancel: true }` є terminal і зупиняє handlers з нижчим пріоритетом.
- `message_sending`: `{ cancel: false }` обробляється як відсутність рішення.
- `message_received`: надавайте перевагу типізованому полю `threadId`, коли потрібна inbound thread/topic routing. Залишайте `metadata` для channel-specific extras.
- `message_sending`: надавайте перевагу типізованим routing fields `replyToId` / `threadId` замість channel-specific metadata keys.

Команда `/approve` обробляє як exec, так і plugin approvals з обмеженим fallback: коли exec approval id не знайдено, OpenClaw повторює той самий id через plugin approvals. Пересилання plugin approval можна налаштувати незалежно через `approvals.plugin` у config.

Якщо власна approval plumbing має виявити той самий випадок bounded fallback,
надавайте перевагу `isApprovalNotFoundError` з `openclaw/plugin-sdk/error-runtime`
замість ручного зіставлення рядків про expiry approval.

Приклади й довідник hooks див. у [Plugin hooks](/uk/plugins/hooks).

## Реєстрація інструментів агента

Tools — це типізовані функції, які може викликати LLM. Вони можуть бути required (завжди
доступні) або optional (opt-in користувача):

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

Користувачі вмикають optional tools у config:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Імена tools не мають конфліктувати з core tools (конфлікти пропускаються)
- Tools з некоректними registration objects, зокрема без `parameters`, пропускаються й повідомляються в plugin diagnostics замість того, щоб ламати agent runs
- Використовуйте `optional: true` для tools із побічними ефектами або додатковими binary requirements
- Користувачі можуть увімкнути всі tools з plugin, додавши plugin id до `tools.allow`

## Реєстрація CLI commands

Plugins можуть додавати кореневі групи команд `openclaw` через `api.registerCli`. Надайте
`descriptors` для кожного top-level command root, щоб OpenClaw міг показувати й route
команду без eager loading кожного plugin runtime.

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

## Угоди щодо імпорту

Завжди імпортуйте зі сфокусованих шляхів `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

Повний довідник підшляхів див. у [Огляді SDK](/uk/plugins/sdk-overview).

У межах вашого plugin використовуйте локальні barrel-файли (`api.ts`, `runtime-api.ts`) для
внутрішніх імпортів — ніколи не імпортуйте власний plugin через його шлях SDK.

Для provider plugins тримайте допоміжні засоби, специфічні для постачальника, у цих package-root
barrels, якщо seam не є справді універсальним. Поточні вбудовані приклади:

- Anthropic: обгортки потоків Claude і допоміжні засоби `service_tier` / beta
- OpenAI: конструктори постачальників, допоміжні засоби моделей за замовчуванням, постачальники realtime
- OpenRouter: конструктор постачальника плюс допоміжні засоби onboarding/config

Якщо допоміжний засіб корисний лише всередині одного вбудованого пакета постачальника, залиште його на цьому
package-root seam замість просування до `openclaw/plugin-sdk/*`.

Деякі згенеровані допоміжні seams `openclaw/plugin-sdk/<bundled-id>` усе ще існують для
супроводу bundled-plugin, коли для них відстежується використання власником. Розглядайте їх як
зарезервовані поверхні, а не як типовий шаблон для нових third-party plugins.

## Контрольний список перед поданням

<Check>**package.json** має правильні метадані `openclaw`</Check>
<Check>Маніфест **openclaw.plugin.json** присутній і валідний</Check>
<Check>Точка входу використовує `defineChannelPluginEntry` або `definePluginEntry`</Check>
<Check>Усі імпорти використовують сфокусовані шляхи `plugin-sdk/<subpath>`</Check>
<Check>Внутрішні імпорти використовують локальні модулі, а не self-imports SDK</Check>
<Check>Тести проходять (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` проходить (для in-repo plugins)</Check>

## Тестування beta-релізу

1. Стежте за тегами релізів GitHub на [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) і підпишіться через `Watch` > `Releases`. Beta-теги мають вигляд `v2026.3.N-beta.1`. Також можна ввімкнути сповіщення для офіційного акаунта OpenClaw в X [@openclaw](https://x.com/openclaw), щоб отримувати оголошення про релізи.
2. Протестуйте свій plugin із beta-тегом щойно він з'явиться. Вікно до stable зазвичай триває лише кілька годин.
3. Після тестування напишіть у гілці свого plugin у каналі Discord `plugin-forum`: або `all good`, або що саме зламалося. Якщо у вас ще немає гілки, створіть її.
4. Якщо щось зламалося, відкрийте або оновіть issue із заголовком `Beta blocker: <plugin-name> - <summary>` і застосуйте мітку `beta-blocker`. Додайте посилання на issue у свою гілку.
5. Відкрийте PR до `main` із заголовком `fix(<plugin-id>): beta blocker - <summary>` і додайте посилання на issue як у PR, так і у своїй гілці Discord. Contributors не можуть ставити мітки на PR, тому заголовок є сигналом з боку PR для maintainers і automation. Blockers із PR буде змерджено; blockers без PR можуть усе одно потрапити в реліз. Maintainers стежать за цими гілками під час beta-тестування.
6. Мовчання означає зелений статус. Якщо ви пропустите це вікно, ваше виправлення, ймовірно, потрапить у наступний цикл.

## Наступні кроки

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Створіть plugin каналу обміну повідомленнями
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/uk/plugins/sdk-provider-plugins">
    Створіть plugin постачальника моделей
  </Card>
  <Card title="Огляд SDK" icon="book-open" href="/uk/plugins/sdk-overview">
    Карта імпортів і довідник API реєстрації
  </Card>
  <Card title="Допоміжні засоби runtime" icon="settings" href="/uk/plugins/sdk-runtime">
    TTS, пошук, subagent через api.runtime
  </Card>
  <Card title="Тестування" icon="test-tubes" href="/uk/plugins/sdk-testing">
    Тестові утиліти й шаблони
  </Card>
  <Card title="Маніфест Plugin" icon="file-json" href="/uk/plugins/manifest">
    Повний довідник схеми маніфесту
  </Card>
</CardGroup>

## Пов'язане

- [Архітектура Plugin](/uk/plugins/architecture) — глибокий огляд внутрішньої архітектури
- [Огляд SDK](/uk/plugins/sdk-overview) — довідник Plugin SDK
- [Маніфест](/uk/plugins/manifest) — формат маніфесту plugin
- [Channel Plugins](/uk/plugins/sdk-channel-plugins) — створення channel plugins
- [Provider Plugins](/uk/plugins/sdk-provider-plugins) — створення provider plugins
