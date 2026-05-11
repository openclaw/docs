---
read_when:
    - Ви хочете створити новий OpenClaw Plugin
    - Вам потрібен посібник зі швидкого старту для розробки Plugin
    - Ви додаєте новий канал, провайдера, інструмент або іншу можливість до OpenClaw
sidebarTitle: Getting Started
summary: Створіть свій перший OpenClaw Plugin за лічені хвилини
title: Створення Plugin
x-i18n:
    generated_at: "2026-05-11T20:45:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 320ea03395cd702e62831e3b6bb3e44443b4a00701f3e6d35d7c9e556e3bb258
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins розширюють OpenClaw новими можливостями: каналами, провайдерами моделей,
мовленням, транскрипцією в реальному часі, голосом у реальному часі, розумінням медіа, генерацією зображень, генерацією відео, web fetch, web search, інструментами агентів або будь-якою
комбінацією.

Вам не потрібно додавати свій plugin до репозиторію OpenClaw. Опублікуйте його в
[ClawHub](/uk/clawhub), і користувачі встановлять його за допомогою
`openclaw plugins install clawhub:<package-name>`. Прості специфікації пакетів усе ще
встановлюються з npm під час перехідного запуску.

## Передумови

- Node >= 22 і менеджер пакетів (npm або pnpm)
- Знайомство з TypeScript (ESM)
- Для plugins у репозиторії: репозиторій клоновано, а `pnpm install` виконано. Розробка plugin
  з checkout вихідного коду підтримується лише через pnpm, оскільки OpenClaw завантажує bundled
  plugins з пакетів workspace `extensions/*`.

## Який тип plugin?

<CardGroup cols={3}>
  <Card title="Channel plugin" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Під’єднайте OpenClaw до платформи обміну повідомленнями (Discord, IRC тощо)
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/uk/plugins/sdk-provider-plugins">
    Додайте провайдера моделей (LLM, proxy або користувацький endpoint)
  </Card>
  <Card title="CLI backend plugin" icon="terminal" href="/uk/plugins/cli-backend-plugins">
    Зіставте локальний AI CLI з текстовим fallback runner OpenClaw
  </Card>
  <Card title="Tool / hook plugin" icon="wrench" href="/uk/plugins/hooks">
    Зареєструйте інструменти агентів, event hooks або сервіси - продовжуйте нижче
  </Card>
</CardGroup>

Для channel plugin, який не гарантовано буде встановлено під час onboarding/setup,
використовуйте `createOptionalChannelSetupSurface(...)` з
`openclaw/plugin-sdk/channel-setup`. Він створює пару setup adapter + wizard,
яка повідомляє про вимогу встановлення і fail closed під час реальних записів конфігурації,
доки plugin не буде встановлено.

## Швидкий старт: tool plugin

Цей покроковий посібник створює мінімальний plugin, який реєструє інструмент агента. Для channel
і provider plugins є окремі посібники за посиланнями вище.

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

    Кожному plugin потрібен manifest, навіть без config. Інструменти, зареєстровані під час виконання,
    мають бути перелічені в `contracts.tools`, щоб OpenClaw міг виявити plugin-власник
    без завантаження runtime кожного plugin. Plugins також мають свідомо оголошувати
    `activation.onStartup`. У цьому прикладі для нього встановлено `true`. Повну схему див.
    у [Manifest](/uk/plugins/manifest). Канонічні фрагменти публікації ClawHub
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

    `definePluginEntry` призначений для plugins, які не є каналами. Для каналів використовуйте
    `defineChannelPluginEntry` - див. [Channel Plugins](/uk/plugins/sdk-channel-plugins).
    Повні параметри entry point див. у [Entry Points](/uk/plugins/sdk-entrypoints).

  </Step>

  <Step title="Перевірте й опублікуйте">

    **Зовнішні plugins:** перевірте й опублікуйте за допомогою ClawHub, потім установіть:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    Голі специфікації пакетів, як-от `@myorg/openclaw-my-plugin`, установлюються з npm під час
    переходу на запуск. Використовуйте `clawhub:`, коли потрібне розв’язання через ClawHub.

    **Plugin у репозиторії:** розмістіть під деревом робочого простору bundled plugin - виявляється автоматично.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Можливості Plugin

Один plugin може зареєструвати будь-яку кількість можливостей через об’єкт `api`:

| Можливість            | Метод реєстрації                                | Докладний посібник                                                              |
| --------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------- |
| Текстовий інференс (LLM) | `api.registerProvider(...)`                      | [Provider Plugins](/uk/plugins/sdk-provider-plugins)                               |
| Бекенд інференсу CLI  | `api.registerCliBackend(...)`                    | [CLI Backend Plugins](/uk/plugins/cli-backend-plugins)                             |
| Канал / обмін повідомленнями | `api.registerChannel(...)`                       | [Channel Plugins](/uk/plugins/sdk-channel-plugins)                                 |
| Мовлення (TTS/STT)    | `api.registerSpeechProvider(...)`                | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Транскрипція в реальному часі | `api.registerRealtimeTranscriptionProvider(...)` | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Голос у реальному часі | `api.registerRealtimeVoiceProvider(...)`         | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Розуміння медіа       | `api.registerMediaUnderstandingProvider(...)`    | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація зображень   | `api.registerImageGenerationProvider(...)`       | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація музики      | `api.registerMusicGenerationProvider(...)`       | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація відео       | `api.registerVideoGenerationProvider(...)`       | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Отримання даних з вебу | `api.registerWebFetchProvider(...)`              | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Вебпошук              | `api.registerWebSearchProvider(...)`             | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Middleware для результатів інструментів | `api.registerAgentToolResultMiddleware(...)`     | [Огляд SDK](/uk/plugins/sdk-overview#registration-api)                             |
| Інструменти агента    | `api.registerTool(...)`                          | Нижче                                                                           |
| Користувацькі команди | `api.registerCommand(...)`                       | [Точки входу](/uk/plugins/sdk-entrypoints)                                         |
| Хуки Plugin           | `api.on(...)`                                    | [Хуки Plugin](/uk/plugins/hooks)                                                   |
| Внутрішні хуки подій  | `api.registerHook(...)`                          | [Точки входу](/uk/plugins/sdk-entrypoints)                                         |
| HTTP-маршрути         | `api.registerHttpRoute(...)`                     | [Внутрішні механізми](/uk/plugins/architecture-internals#gateway-http-routes)      |
| Підкоманди CLI        | `api.registerCli(...)`                           | [Точки входу](/uk/plugins/sdk-entrypoints)                                         |

Повний API реєстрації див. в [огляді SDK](/uk/plugins/sdk-overview#registration-api).

Bundled plugins можуть використовувати `api.registerAgentToolResultMiddleware(...)`, коли їм
потрібне асинхронне переписування результату інструмента до того, як модель побачить вивід. Оголосіть
цільові середовища виконання в `contracts.agentToolResultMiddleware`, наприклад
`["pi", "codex"]`. Це довірений seam для bundled plugin; зовнішнім
plugins варто надавати перевагу звичайним хукам Plugin OpenClaw, якщо OpenClaw не додасть
явну політику довіри для цієї можливості.

Якщо ваш plugin реєструє користувацькі RPC-методи Gateway, тримайте їх під
префіксом, специфічним для plugin. Основні адміністративні простори імен (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди розв’язуються в
`operator.admin`, навіть якщо plugin просить вужчу область дії.

Семантика захисту хуків, яку слід мати на увазі:

- `before_tool_call`: `{ block: true }` є термінальним і зупиняє обробники з нижчим пріоритетом.
- `before_tool_call`: `{ block: false }` трактується як відсутність рішення.
- `before_tool_call`: `{ requireApproval: true }` призупиняє виконання агента й запитує схвалення користувача через оверлей схвалення exec, кнопки Telegram, взаємодії Discord або команду `/approve` у будь-якому каналі.
- `before_install`: `{ block: true }` є термінальним і зупиняє обробники з нижчим пріоритетом.
- `before_install`: `{ block: false }` трактується як відсутність рішення.
- `message_sending`: `{ cancel: true }` є термінальним і зупиняє обробники з нижчим пріоритетом.
- `message_sending`: `{ cancel: false }` трактується як відсутність рішення.
- `message_received`: надавайте перевагу типізованому полю `threadId`, коли потрібна маршрутизація вхідного ланцюжка/теми. Залишайте `metadata` для специфічних для каналу додаткових даних.
- `message_sending`: надавайте перевагу типізованим полям маршрутизації `replyToId` / `threadId` замість специфічних для каналу ключів metadata.

Команда `/approve` обробляє як exec-схвалення, так і схвалення plugin з обмеженим резервним варіантом: коли id exec-схвалення не знайдено, OpenClaw повторює спробу з тим самим id через схвалення plugin. Пересилання схвалень plugin можна налаштувати незалежно через `approvals.plugin` у конфігурації.

Якщо користувацькі механізми схвалення мають виявляти той самий випадок обмеженого резервного варіанта,
надавайте перевагу `isApprovalNotFoundError` з `openclaw/plugin-sdk/error-runtime`
замість ручного зіставлення рядків про завершення строку дії схвалення.

Приклади та довідник хуків див. у [хуках Plugin](/uk/plugins/hooks).

## Реєстрація інструментів агента

Інструменти - це типізовані функції, які може викликати LLM. Вони можуть бути обов’язковими (завжди
доступні) або необов’язковими (користувач увімкне самостійно):

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

Фабрики інструментів отримують об’єкт контексту, наданий runtime. Використовуйте
`ctx.activeModel`, коли інструменту потрібно журналювати, показувати або адаптуватися до активної
моделі для поточного ходу. Об’єкт може містити `provider`, `modelId` і
`modelRef`. Сприймайте його як інформаційні runtime-метадані, а не як межу безпеки
проти локального оператора, встановленого коду plugin або модифікованого
runtime OpenClaw. Для чутливих локальних інструментів зберігайте явне підтвердження від plugin або оператора
та відмовляйте за замовчуванням, коли метадані активної моделі відсутні або невідповідні.

Кожен інструмент, зареєстрований через `api.registerTool(...)`, також має бути оголошений у
маніфесті plugin:

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

OpenClaw захоплює й кешує перевірений дескриптор із зареєстрованого інструмента,
тому plugins не дублюють `description` або дані схеми в маніфесті. Контракт
маніфесту лише оголошує власність і виявлення; виконання все одно викликає
живу зареєстровану реалізацію інструмента.
Установіть `toolMetadata.<tool>.optional: true` для інструментів, зареєстрованих через
`api.registerTool(..., { optional: true })`, щоб OpenClaw міг не завантажувати
runtime цього plugin, доки інструмент явно не буде внесено до списку дозволених.

Користувачі вмикають необов’язкові інструменти в конфігурації:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Назви інструментів не мають конфліктувати з інструментами ядра (конфлікти пропускаються)
- Інструменти з некоректно сформованими об’єктами реєстрації, зокрема без `parameters`, пропускаються й повідомляються в діагностиці plugin замість того, щоб зривати запуски агентів
- Використовуйте `optional: true` для інструментів із побічними ефектами або додатковими вимогами до бінарних файлів
- Користувачі можуть увімкнути всі інструменти з plugin, додавши id plugin до `tools.allow`

## Реєстрація команд CLI

Plugins можуть додавати кореневі групи команд `openclaw` за допомогою `api.registerCli`. Надайте
`descriptors` для кожного кореня команди верхнього рівня, щоб OpenClaw міг показувати й маршрутизувати
команду без завчасного завантаження runtime кожного plugin.

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

Після встановлення перевірте runtime-реєстрацію та виконайте команду:

```bash
openclaw plugins inspect demo-plugin --runtime --json
openclaw demo-plugin ping
```

## Угоди щодо імпортів

Завжди імпортуйте зі сфокусованих шляхів `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

Повний довідник підшляхів див. у [Огляді SDK](/uk/plugins/sdk-overview).

У межах вашого plugin використовуйте локальні barrel-файли (`api.ts`, `runtime-api.ts`) для
внутрішніх імпортів - ніколи не імпортуйте власний plugin через його SDK-шлях.

Для provider plugins тримайте специфічні для провайдера helpers у цих barrel-файлах кореня пакета,
якщо seam не є справді універсальним. Поточні вбудовані приклади:

- Anthropic: обгортки Claude stream і helpers `service_tier` / beta
- OpenAI: конструктори провайдера, helpers моделей за замовчуванням, realtime-провайдери
- OpenRouter: конструктор провайдера та helpers onboarding/конфігурації

Якщо helper корисний лише всередині одного вбудованого пакета провайдера, тримайте його на цьому
seam кореня пакета замість просування в `openclaw/plugin-sdk/*`.

Деякі згенеровані helper seams `openclaw/plugin-sdk/<bundled-id>` усе ще існують для
обслуговування вбудованих plugins, коли вони мають відстежене використання власником. Вважайте їх
зарезервованими поверхнями, а не типовим шаблоном для нових сторонніх plugins.

## Контрольний список перед поданням

<Check>**package.json** має коректні метадані `openclaw`</Check>
<Check>Маніфест **openclaw.plugin.json** присутній і валідний</Check>
<Check>Точка входу використовує `defineChannelPluginEntry` або `definePluginEntry`</Check>
<Check>Усі імпорти використовують сфокусовані шляхи `plugin-sdk/<subpath>`</Check>
<Check>Внутрішні імпорти використовують локальні модулі, а не самоімпорти SDK</Check>
<Check>Тести проходять (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` проходить (для plugins у репозиторії)</Check>

## Тестування beta-релізу

1. Стежте за тегами релізів GitHub на [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) і підпишіться через `Watch` > `Releases`. Beta-теги мають вигляд `v2026.3.N-beta.1`. Також можна ввімкнути сповіщення для офіційного X-акаунта OpenClaw [@openclaw](https://x.com/openclaw), щоб отримувати оголошення про релізи.
2. Протестуйте свій plugin із beta-тегом одразу після його появи. Вікно перед stable зазвичай становить лише кілька годин.
3. Напишіть у треді свого plugin у Discord-каналі `plugin-forum` після тестування: або `all good`, або що зламалося. Якщо у вас ще немає треду, створіть його.
4. Якщо щось ламається, відкрийте або оновіть issue з назвою `Beta blocker: <plugin-name> - <summary>` і застосуйте мітку `beta-blocker`. Додайте посилання на issue у свій тред.
5. Відкрийте PR до `main` із назвою `fix(<plugin-id>): beta blocker - <summary>` і додайте посилання на issue як у PR, так і у ваш Discord-тред. Contributors не можуть ставити мітки на PR, тому назва є сигналом на стороні PR для maintainers і автоматизації. Blockers із PR буде змерджено; blockers без PR можуть бути випущені попри це. Maintainers стежать за цими тредами під час beta-тестування.
6. Мовчання означає зелений статус. Якщо ви пропустите вікно, ваше виправлення, ймовірно, потрапить у наступний цикл.

## Наступні кроки

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Створіть plugin каналу повідомлень
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/uk/plugins/sdk-provider-plugins">
    Створіть plugin провайдера моделей
  </Card>
  <Card title="CLI Backend Plugins" icon="terminal" href="/uk/plugins/cli-backend-plugins">
    Зареєструйте локальний бекенд AI CLI
  </Card>
  <Card title="Огляд SDK" icon="book-open" href="/uk/plugins/sdk-overview">
    Мапа імпортів і довідник API реєстрації
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/uk/plugins/sdk-runtime">
    TTS, пошук, subagent через api.runtime
  </Card>
  <Card title="Тестування" icon="test-tubes" href="/uk/plugins/sdk-testing">
    Утиліти й шаблони тестування
  </Card>
  <Card title="Маніфест Plugin" icon="file-json" href="/uk/plugins/manifest">
    Повний довідник схеми маніфесту
  </Card>
</CardGroup>

## Пов’язане

- [Архітектура Plugin](/uk/plugins/architecture) - глибокий огляд внутрішньої архітектури
- [Огляд SDK](/uk/plugins/sdk-overview) - довідник Plugin SDK
- [Маніфест](/uk/plugins/manifest) - формат маніфесту plugin
- [Channel Plugins](/uk/plugins/sdk-channel-plugins) - створення channel plugins
- [Provider Plugins](/uk/plugins/sdk-provider-plugins) - створення provider plugins
