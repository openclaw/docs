---
read_when:
    - Ви хочете створити новий Plugin для OpenClaw
    - Вам потрібен короткий посібник із розробки Plugin
    - Ви додаєте до OpenClaw новий канал, провайдера, інструмент або іншу можливість
sidebarTitle: Getting Started
summary: Створіть свій перший Plugin для OpenClaw за кілька хвилин
title: Створення плагінів
x-i18n:
    generated_at: "2026-05-02T05:25:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2cf85c1c1c1f6ae6752f7fb8d842a420bffac6ebaf4d64803fb8bb8ab9f6f83c
    source_path: plugins/building-plugins.md
    workflow: 16
---

Плагіни розширюють OpenClaw новими можливостями: каналами, провайдерами моделей,
мовленням, транскрипцією в реальному часі, голосом у реальному часі, розумінням медіа, генерацією зображень,
генерацією відео, вебзавантаженням, вебпошуком, інструментами агента або будь-якою
комбінацією.

Вам не потрібно додавати свій плагін до репозиторію OpenClaw. Опублікуйте його в
[ClawHub](/uk/tools/clawhub), і користувачі встановлять його за допомогою
`openclaw plugins install <package-name>`. OpenClaw спершу пробує ClawHub і
автоматично повертається до npm для пакетів, які все ще використовують розповсюдження через npm.

## Передумови

- Node >= 22 і менеджер пакетів (npm або pnpm)
- Знайомство з TypeScript (ESM)
- Для плагінів у репозиторії: репозиторій клоновано й виконано `pnpm install`. Розробка плагінів
  із checkout вихідного коду підтримує лише pnpm, оскільки OpenClaw завантажує вбудовані
  плагіни з workspace-пакетів `extensions/*`.

## Який тип плагіна?

<CardGroup cols={3}>
  <Card title="Плагін каналу" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Підключіть OpenClaw до платформи обміну повідомленнями (Discord, IRC тощо)
  </Card>
  <Card title="Плагін провайдера" icon="cpu" href="/uk/plugins/sdk-provider-plugins">
    Додайте провайдера моделей (LLM, проксі або власний endpoint)
  </Card>
  <Card title="Плагін інструмента / hook" icon="wrench" href="/uk/plugins/hooks">
    Зареєструйте інструменти агента, event hooks або сервіси — продовжуйте нижче
  </Card>
</CardGroup>

Для плагіна каналу, який не гарантовано буде встановлено під час запуску onboarding/setup,
використовуйте `createOptionalChannelSetupSurface(...)` з
`openclaw/plugin-sdk/channel-setup`. Він створює пару setup adapter + wizard,
яка повідомляє про вимогу встановлення й завершується без змін під час реальних записів конфігурації,
доки плагін не встановлено.

## Швидкий старт: плагін інструмента

Цей walkthrough створює мінімальний плагін, який реєструє інструмент агента. Для плагінів каналів
і провайдерів є окремі посібники, посилання на які наведено вище.

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

    Кожному плагіну потрібен manifest, навіть без конфігурації. Інструменти, зареєстровані під час виконання,
    мають бути перелічені в `contracts.tools`, щоб OpenClaw міг визначити відповідальний
    плагін без завантаження runtime кожного плагіна. Плагіни також мають свідомо оголошувати
    `activation.onStartup`. У цьому прикладі встановлено значення `true`. Див.
    [Manifest](/uk/plugins/manifest) для повної схеми. Канонічні snippets публікації ClawHub
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

    `definePluginEntry` призначений для плагінів, що не є каналами. Для каналів використовуйте
    `defineChannelPluginEntry` — див. [Плагіни каналів](/uk/plugins/sdk-channel-plugins).
    Повні параметри entry point див. у [Entry Points](/uk/plugins/sdk-entrypoints).

  </Step>

  <Step title="Протестуйте й опублікуйте">

    **Зовнішні плагіни:** перевірте та опублікуйте через ClawHub, потім встановіть:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw також перевіряє ClawHub перед npm для простих специфікацій пакетів, як-от
    `@myorg/openclaw-my-plugin`; npm залишається fallback для пакетів, які ще
    не мігрували до ClawHub.

    **Плагіни в репозиторії:** розмістіть у дереві workspace вбудованих плагінів — їх буде автоматично виявлено.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Можливості плагіна

Один плагін може зареєструвати будь-яку кількість можливостей через об’єкт `api`:

| Можливість             | Метод реєстрації                                 | Детальний посібник                                                              |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Текстовий inference (LLM) | `api.registerProvider(...)`                      | [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins)                            |
| Backend inference для CLI | `api.registerCliBackend(...)`                    | [Backends CLI](/uk/gateway/cli-backends)                                           |
| Канал / повідомлення   | `api.registerChannel(...)`                       | [Плагіни каналів](/uk/plugins/sdk-channel-plugins)                                 |
| Мовлення (TTS/STT)     | `api.registerSpeechProvider(...)`                | [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Транскрипція в реальному часі | `api.registerRealtimeTranscriptionProvider(...)` | [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Голос у реальному часі | `api.registerRealtimeVoiceProvider(...)`         | [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Розуміння медіа        | `api.registerMediaUnderstandingProvider(...)`    | [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація зображень    | `api.registerImageGenerationProvider(...)`       | [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація музики       | `api.registerMusicGenerationProvider(...)`       | [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація відео        | `api.registerVideoGenerationProvider(...)`       | [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Вебзавантаження        | `api.registerWebFetchProvider(...)`              | [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Вебпошук               | `api.registerWebSearchProvider(...)`             | [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Middleware результатів інструментів | `api.registerAgentToolResultMiddleware(...)`     | [Огляд SDK](/uk/plugins/sdk-overview#registration-api)                             |
| Інструменти агента     | `api.registerTool(...)`                          | Нижче                                                                           |
| Власні команди         | `api.registerCommand(...)`                       | [Entry Points](/uk/plugins/sdk-entrypoints)                                        |
| Hooks плагіна          | `api.on(...)`                                    | [Hooks плагіна](/uk/plugins/hooks)                                                 |
| Внутрішні event hooks  | `api.registerHook(...)`                          | [Entry Points](/uk/plugins/sdk-entrypoints)                                        |
| HTTP-маршрути          | `api.registerHttpRoute(...)`                     | [Внутрішня архітектура](/uk/plugins/architecture-internals#gateway-http-routes)    |
| Підкоманди CLI         | `api.registerCli(...)`                           | [Entry Points](/uk/plugins/sdk-entrypoints)                                        |

Повний API реєстрації див. в [Огляді SDK](/uk/plugins/sdk-overview#registration-api).

Вбудовані плагіни можуть використовувати `api.registerAgentToolResultMiddleware(...)`, коли їм
потрібне асинхронне переписування результату інструмента до того, як модель побачить output. Оголошуйте
цільові runtimes у `contracts.agentToolResultMiddleware`, наприклад
`["pi", "codex"]`. Це довірений seam для вбудованих плагінів; зовнішнім
плагінам варто надавати перевагу звичайним hooks плагінів OpenClaw, доки OpenClaw не матиме
явної політики довіри для цієї можливості.

Якщо ваш плагін реєструє власні RPC-методи Gateway, тримайте їх у
префіксі, специфічному для плагіна. Простори імен core admin (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди resolve до
`operator.admin`, навіть якщо плагін просить вужчий scope.

Семантика guard для hooks, яку варто пам’ятати:

- `before_tool_call`: `{ block: true }` є terminal і зупиняє handlers із нижчим пріоритетом.
- `before_tool_call`: `{ block: false }` розглядається як відсутність рішення.
- `before_tool_call`: `{ requireApproval: true }` призупиняє виконання агента й запитує в користувача схвалення через exec approval overlay, кнопки Telegram, Discord interactions або команду `/approve` на будь-якому каналі.
- `before_install`: `{ block: true }` є terminal і зупиняє handlers із нижчим пріоритетом.
- `before_install`: `{ block: false }` розглядається як відсутність рішення.
- `message_sending`: `{ cancel: true }` є terminal і зупиняє handlers із нижчим пріоритетом.
- `message_sending`: `{ cancel: false }` розглядається як відсутність рішення.
- `message_received`: надавайте перевагу типізованому полю `threadId`, коли потрібна маршрутизація вхідних thread/topic. Залишайте `metadata` для додаткових даних, специфічних для каналу.
- `message_sending`: надавайте перевагу типізованим полям маршрутизації `replyToId` / `threadId` замість ключів metadata, специфічних для каналу.

Команда `/approve` обробляє як exec approvals, так і approvals плагінів із bounded fallback: коли id exec approval не знайдено, OpenClaw повторює той самий id через approvals плагінів. Forwarding approvals плагінів можна налаштовувати незалежно через `approvals.plugin` у конфігурації.

Якщо власний approval plumbing має виявляти той самий bounded fallback-випадок,
надавайте перевагу `isApprovalNotFoundError` з `openclaw/plugin-sdk/error-runtime`
замість ручного зіставлення рядків про expiry approval.

Приклади й довідник hooks див. у [Hooks плагіна](/uk/plugins/hooks).

## Реєстрація інструментів агента

Інструменти — це типізовані функції, які може викликати LLM. Вони можуть бути обов’язковими (завжди
доступними) або опціональними (користувач вмикає їх сам):

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
manifest плагіна:

```json
{
  "contracts": {
    "tools": ["my_tool", "workflow_tool"]
  }
}
```

Користувачі вмикають опціональні інструменти в конфігурації:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Назви інструментів не повинні конфліктувати з основними інструментами (конфліктні пропускаються)
- Інструменти з некоректно сформованими об’єктами реєстрації, зокрема без `parameters`, пропускаються й повідомляються в діагностиці plugin замість того, щоб ламати запуски агента
- Використовуйте `optional: true` для інструментів із побічними ефектами або додатковими вимогами до бінарних файлів
- Користувачі можуть увімкнути всі інструменти з plugin, додавши ідентифікатор plugin до `tools.allow`

## Реєстрація команд CLI

Plugins можуть додавати кореневі групи команд `openclaw` за допомогою `api.registerCli`. Надавайте
`descriptors` для кожного кореня команди верхнього рівня, щоб OpenClaw міг показувати й маршрутизувати
команду без завчасного завантаження кожного середовища виконання plugin.

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

Повний довідник підшляхів див. у [Огляді SDK](/uk/plugins/sdk-overview).

Усередині свого plugin використовуйте локальні barrel-файли (`api.ts`, `runtime-api.ts`) для
внутрішніх імпортів — ніколи не імпортуйте власний plugin через його шлях SDK.

Для provider plugins тримайте специфічні для провайдера допоміжні засоби в цих barrel-файлах кореня пакета,
якщо межа не є справді узагальненою. Поточні вбудовані приклади:

- Anthropic: обгортки потоків Claude та допоміжні засоби `service_tier` / beta
- OpenAI: конструктори провайдера, допоміжні засоби моделей за замовчуванням, realtime-провайдери
- OpenRouter: конструктор провайдера та допоміжні засоби onboarding/конфігурації

Якщо допоміжний засіб корисний лише всередині одного вбудованого пакета провайдера, залишайте його на цій
межі кореня пакета замість просування в `openclaw/plugin-sdk/*`.

Деякі згенеровані допоміжні межі `openclaw/plugin-sdk/<bundled-id>` досі існують для
супроводу вбудованих plugin, коли для них відстежується використання власником. Вважайте їх
зарезервованими поверхнями, а не типовим шаблоном для нових сторонніх plugins.

## Контрольний список перед поданням

<Check>**package.json** має коректні метадані `openclaw`</Check>
<Check>Маніфест **openclaw.plugin.json** наявний і валідний</Check>
<Check>Точка входу використовує `defineChannelPluginEntry` або `definePluginEntry`</Check>
<Check>Усі імпорти використовують сфокусовані шляхи `plugin-sdk/<subpath>`</Check>
<Check>Внутрішні імпорти використовують локальні модулі, а не самоімпорти SDK</Check>
<Check>Тести проходять (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` проходить (для plugins у репозиторії)</Check>

## Тестування beta-релізу

1. Стежте за тегами релізів GitHub у [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) і підпишіться через `Watch` > `Releases`. Beta-теги мають вигляд `v2026.3.N-beta.1`. Також можна ввімкнути сповіщення для офіційного X-акаунта OpenClaw [@openclaw](https://x.com/openclaw), щоб отримувати оголошення про релізи.
2. Тестуйте свій plugin з beta-тегом щойно він з’явиться. Вікно до stable зазвичай становить лише кілька годин.
3. Після тестування напишіть у гілці свого plugin у каналі Discord `plugin-forum` або `all good`, або що саме зламалося. Якщо гілки ще немає, створіть її.
4. Якщо щось зламалося, відкрийте або оновіть issue з назвою `Beta blocker: <plugin-name> - <summary>` і застосуйте мітку `beta-blocker`. Додайте посилання на issue у свою гілку.
5. Відкрийте PR до `main` з назвою `fix(<plugin-id>): beta blocker - <summary>` і додайте посилання на issue і в PR, і у свою гілку Discord. Contributors не можуть ставити мітки на PR, тому назва є сигналом на боці PR для maintainers та автоматизації. Блокери з PR зливаються; блокери без PR можуть усе одно потрапити в реліз. Maintainers стежать за цими гілками під час beta-тестування.
6. Мовчання означає зелений статус. Якщо ви пропустите це вікно, ваше виправлення, імовірно, потрапить у наступний цикл.

## Наступні кроки

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Створити plugin каналу повідомлень
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/uk/plugins/sdk-provider-plugins">
    Створити plugin провайдера моделей
  </Card>
  <Card title="Огляд SDK" icon="book-open" href="/uk/plugins/sdk-overview">
    Мапа імпортів і довідник API реєстрації
  </Card>
  <Card title="Допоміжні засоби середовища виконання" icon="settings" href="/uk/plugins/sdk-runtime">
    TTS, пошук, субагент через api.runtime
  </Card>
  <Card title="Тестування" icon="test-tubes" href="/uk/plugins/sdk-testing">
    Тестові утиліти й шаблони
  </Card>
  <Card title="Маніфест Plugin" icon="file-json" href="/uk/plugins/manifest">
    Повний довідник схеми маніфесту
  </Card>
</CardGroup>

## Пов’язане

- [Архітектура Plugin](/uk/plugins/architecture) — докладний огляд внутрішньої архітектури
- [Огляд SDK](/uk/plugins/sdk-overview) — довідник Plugin SDK
- [Маніфест](/uk/plugins/manifest) — формат маніфесту plugin
- [Channel Plugins](/uk/plugins/sdk-channel-plugins) — створення plugins каналів
- [Provider Plugins](/uk/plugins/sdk-provider-plugins) — створення plugins провайдерів
