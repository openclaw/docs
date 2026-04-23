---
read_when:
    - Ви хочете створити новий Plugin OpenClaw
    - Вам потрібен швидкий старт для розробки Plugin-ів
    - Ви додаєте до OpenClaw новий channel, provider, tool або іншу capability
sidebarTitle: Getting Started
summary: Створіть свій перший Plugin OpenClaw за лічені хвилини
title: Створення Plugin-ів
x-i18n:
    generated_at: "2026-04-23T21:02:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: f3e753c686faff7a942937e8b209b31460d6d377bc50ef54eda3dee529599c68
    source_path: plugins/building-plugins.md
    workflow: 15
---

Plugin-и розширюють OpenClaw новими можливостями: channels, model provider-ами,
speech, realtime transcription, realtime voice, розумінням медіа, генерацією зображень,
генерацією відео, web fetch, web search, agent tools або будь-якою
комбінацією.

Вам не потрібно додавати свій Plugin до репозиторію OpenClaw. Опублікуйте його в
[ClawHub](/uk/tools/clawhub) або npm, а користувачі встановлять його через
`openclaw plugins install <package-name>`. OpenClaw спочатку пробує ClawHub і
автоматично переходить до npm у разі потреби.

## Передумови

- Node >= 22 і package manager (npm або pnpm)
- Знайомство з TypeScript (ESM)
- Для in-repo Plugin-ів: клонований репозиторій і виконаний `pnpm install`

## Який саме Plugin?

<CardGroup cols={3}>
  <Card title="Plugin channel" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Підключає OpenClaw до платформи обміну повідомленнями (Discord, IRC тощо)
  </Card>
  <Card title="Plugin provider" icon="cpu" href="/uk/plugins/sdk-provider-plugins">
    Додає model provider (LLM, proxy або власний endpoint)
  </Card>
  <Card title="Plugin tool / hook" icon="wrench">
    Реєструє agent tools, event hooks або сервіси — продовження нижче
  </Card>
</CardGroup>

Якщо Plugin channel є необов’язковим і може бути не встановлений під час виконання
onboarding/setup, використовуйте `createOptionalChannelSetupSurface(...)` з
`openclaw/plugin-sdk/channel-setup`. Він створює адаптер setup + пару wizard,
які повідомляють про вимогу встановлення та завершуються fail-closed під час реальних записів у config,
доки Plugin не буде встановлено.

## Швидкий старт: Plugin tool

Цей walkthrough створює мінімальний Plugin, який реєструє agent tool. Для Plugin-ів channel
і provider є окремі посібники за посиланнями вище.

<Steps>
  <Step title="Створіть package і manifest">
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
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Кожен Plugin потребує manifest, навіть якщо у нього немає config. Повну schema див. у
    [Manifest](/uk/plugins/manifest). Канонічні фрагменти для публікації в ClawHub
    знаходяться в `docs/snippets/plugin-publish/`.

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

    `definePluginEntry` призначено для не-channel Plugin-ів. Для channels використовуйте
    `defineChannelPluginEntry` — див. [Channel Plugins](/uk/plugins/sdk-channel-plugins).
    Повний перелік параметрів entry point див. у [Entry Points](/uk/plugins/sdk-entrypoints).

  </Step>

  <Step title="Протестуйте та опублікуйте">

    **Зовнішні Plugin-и:** перевірте й опублікуйте через ClawHub, потім встановіть:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw також перевіряє ClawHub перед npm для звичайних package spec-ів, як-от
    `@myorg/openclaw-my-plugin`.

    **In-repo Plugin-и:** розміщуйте їх у дереві workspace bundled Plugin-ів — вони визначаються автоматично.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Можливості Plugin-а

Один Plugin може зареєструвати будь-яку кількість можливостей через об’єкт `api`:

| Можливість              | Метод реєстрації                               | Детальний посібник                                                              |
| ----------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------- |
| Text inference (LLM)    | `api.registerProvider(...)`                    | [Provider Plugins](/uk/plugins/sdk-provider-plugins)                               |
| CLI inference backend   | `api.registerCliBackend(...)`                  | [CLI Backends](/uk/gateway/cli-backends)                                           |
| Channel / messaging     | `api.registerChannel(...)`                     | [Channel Plugins](/uk/plugins/sdk-channel-plugins)                                 |
| Speech (TTS/STT)        | `api.registerSpeechProvider(...)`              | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Realtime transcription  | `api.registerRealtimeTranscriptionProvider(...)` | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Realtime voice          | `api.registerRealtimeVoiceProvider(...)`       | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Розуміння медіа         | `api.registerMediaUnderstandingProvider(...)`  | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація зображень     | `api.registerImageGenerationProvider(...)`     | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація музики        | `api.registerMusicGenerationProvider(...)`     | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація відео         | `api.registerVideoGenerationProvider(...)`     | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web fetch               | `api.registerWebFetchProvider(...)`            | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web search              | `api.registerWebSearchProvider(...)`           | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Embedded Pi extension   | `api.registerEmbeddedExtensionFactory(...)`    | [SDK Overview](/uk/plugins/sdk-overview#registration-api)                          |
| Agent tools             | `api.registerTool(...)`                        | Нижче                                                                           |
| Власні команди          | `api.registerCommand(...)`                     | [Entry Points](/uk/plugins/sdk-entrypoints)                                        |
| Event hooks             | `api.registerHook(...)`                        | [Entry Points](/uk/plugins/sdk-entrypoints)                                        |
| HTTP routes             | `api.registerHttpRoute(...)`                   | [Internals](/uk/plugins/architecture#gateway-http-routes)                          |
| Підкоманди CLI          | `api.registerCli(...)`                         | [Entry Points](/uk/plugins/sdk-entrypoints)                                        |

Повний API реєстрації див. у [SDK Overview](/uk/plugins/sdk-overview#registration-api).

Використовуйте `api.registerEmbeddedExtensionFactory(...)`, коли Plugin потребує
Pi-native hook-ів embedded-runner, наприклад асинхронного переписування `tool_result`
до того, як буде згенеровано фінальне повідомлення з результатом tool. Віддавайте перевагу звичайним hook-ам Plugin OpenClaw, коли робота не потребує таймінгу Pi extension.

Якщо ваш Plugin реєструє власні методи gateway RPC, тримайте їх під
специфічним для Plugin-а префіксом. Простори імен core admin (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди розв’язуються до
`operator.admin`, навіть якщо Plugin запитує вужчий scope.

Семантика guard hook-ів, яку варто пам’ятати:

- `before_tool_call`: `{ block: true }` є остаточним рішенням і зупиняє handler-и нижчого пріоритету.
- `before_tool_call`: `{ block: false }` трактується як відсутність рішення.
- `before_tool_call`: `{ requireApproval: true }` призупиняє виконання агента й запитує схвалення користувача через overlay схвалення exec, кнопки Telegram, взаємодії Discord або команду `/approve` у будь-якому каналі.
- `before_install`: `{ block: true }` є остаточним рішенням і зупиняє handler-и нижчого пріоритету.
- `before_install`: `{ block: false }` трактується як відсутність рішення.
- `message_sending`: `{ cancel: true }` є остаточним рішенням і зупиняє handler-и нижчого пріоритету.
- `message_sending`: `{ cancel: false }` трактується як відсутність рішення.
- `message_received`: віддавайте перевагу типізованому полю `threadId`, коли вам потрібна вхідна маршрутизація thread/topic. `metadata` залишайте для специфічних для каналу доповнень.
- `message_sending`: віддавайте перевагу типізованим полям маршрутизації `replyToId` / `threadId` замість специфічних для каналу ключів metadata.

Команда `/approve` обробляє і схвалення exec, і схвалення Plugin-ів із обмеженим fallback: коли ID схвалення exec не знайдено, OpenClaw повторно пробує той самий ID через схвалення Plugin-а. Forwarding схвалень Plugin-ів можна налаштовувати незалежно через `approvals.plugin` у config.

Якщо власна логіка схвалення має виявляти той самий випадок обмеженого fallback,
використовуйте `isApprovalNotFoundError` з `openclaw/plugin-sdk/error-runtime`, а не звіряйте вручну рядки про спливання схвалення.

Докладніше див. [SDK Overview hook decision semantics](/uk/plugins/sdk-overview#hook-decision-semantics).

## Реєстрація agent tools

Tools — це типізовані функції, які може викликати LLM. Вони можуть бути обов’язковими (завжди
доступними) або необов’язковими (opt-in для користувача):

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

- Назви tool-ів не повинні конфліктувати з core tools (конфлікти пропускаються)
- Використовуйте `optional: true` для tool-ів із побічними ефектами або додатковими вимогами до бінарних файлів
- Користувачі можуть увімкнути всі tools певного Plugin-а, додавши ID Plugin-а до `tools.allow`

## Правила import

Завжди імпортуйте з фокусованих шляхів `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

Повний довідник щодо subpath див. у [SDK Overview](/uk/plugins/sdk-overview).

Усередині вашого Plugin-а використовуйте локальні barrel-файли (`api.ts`, `runtime-api.ts`) для
внутрішніх import-ів — ніколи не імпортуйте власний Plugin через його SDK path.

Для Plugin-ів provider-ів тримайте специфічні для provider-а helper-и в цих barrel-ах кореня package,
якщо лише цей seam не є справді загальним. Поточні bundled-приклади:

- Anthropic: wrapper-и stream Claude і helper-и `service_tier` / beta
- OpenAI: builder-и provider-а, helper-и типової моделі, realtime provider-и
- OpenRouter: builder provider-а плюс helper-и onboarding/config

Якщо helper корисний лише всередині одного bundled package provider-а, тримайте його на seam цього
кореня package замість того, щоб піднімати його до `openclaw/plugin-sdk/*`.

Деякі згенеровані helper seam-и `openclaw/plugin-sdk/<bundled-id>` усе ще існують для
підтримки bundled Plugin-ів і сумісності, наприклад
`plugin-sdk/feishu-setup` або `plugin-sdk/zalo-setup`. Вважайте їх зарезервованими
поверхнями, а не типовим шаблоном для нових сторонніх Plugin-ів.

## Контрольний список перед поданням

<Check>**package.json** містить коректні metadata `openclaw`</Check>
<Check>Manifest **openclaw.plugin.json** наявний і коректний</Check>
<Check>Entry point використовує `defineChannelPluginEntry` або `definePluginEntry`</Check>
<Check>Усі import-и використовують фокусовані шляхи `plugin-sdk/<subpath>`</Check>
<Check>Внутрішні import-и використовують локальні модулі, а не self-import-и через SDK</Check>
<Check>Тести проходять (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` проходить успішно (для in-repo Plugin-ів)</Check>

## Тестування beta-релізів

1. Стежте за GitHub release tag-ами в [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) і підпишіться через `Watch` > `Releases`. Beta tag-и мають вигляд `v2026.3.N-beta.1`. Ви також можете ввімкнути сповіщення для офіційного X-акаунта OpenClaw [@openclaw](https://x.com/openclaw) для анонсів релізів.
2. Перевірте свій Plugin на beta tag щойно він з’явиться. Вікно до stable зазвичай триває лише кілька годин.
3. Після тестування напишіть у thread вашого Plugin-а в каналі Discord `plugin-forum`, вказавши або `all good`, або що саме зламалося. Якщо у вас ще немає thread, створіть його.
4. Якщо щось зламалося, створіть або оновіть issue з назвою `Beta blocker: <plugin-name> - <summary>` і додайте label `beta-blocker`. Додайте посилання на issue у свій thread.
5. Відкрийте PR до `main` з назвою `fix(<plugin-id>): beta blocker - <summary>` і додайте посилання на issue і в PR, і у свій Discord thread. Учасники не можуть додавати label-и до PR, тому назва є сигналом на боці PR для супровідників і автоматизації. Blocker-и з PR будуть merged; blocker-и без PR можуть усе одно потрапити в реліз. Під час beta-тестування супровідники стежать за цими thread-ами.
6. Тиша означає зелений статус. Якщо ви пропустили вікно, ваше виправлення, імовірно, потрапить у наступний цикл.

## Подальші кроки

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Створіть Plugin каналу обміну повідомленнями
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/uk/plugins/sdk-provider-plugins">
    Створіть Plugin model provider-а
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/uk/plugins/sdk-overview">
    Довідник import map і API реєстрації
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/uk/plugins/sdk-runtime">
    TTS, search, subagent через api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/uk/plugins/sdk-testing">
    Утиліти та шаблони тестування
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/uk/plugins/manifest">
    Повний довідник schema manifest
  </Card>
</CardGroup>

## Пов’язане

- [Архітектура Plugin-ів](/uk/plugins/architecture) — поглиблений розбір внутрішньої архітектури
- [SDK Overview](/uk/plugins/sdk-overview) — довідник Plugin SDK
- [Manifest](/uk/plugins/manifest) — формат manifest Plugin-а
- [Channel Plugins](/uk/plugins/sdk-channel-plugins) — створення Plugin-ів каналів
- [Provider Plugins](/uk/plugins/sdk-provider-plugins) — створення Plugin-ів provider-ів
