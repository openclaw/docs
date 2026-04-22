---
read_when:
    - Ви хочете створити новий Plugin для OpenClaw
    - Вам потрібен короткий посібник зі швидкого старту для розробки Plugin-ів
    - Ви додаєте новий канал, провайдера, інструмент або іншу можливість до OpenClaw
sidebarTitle: Getting Started
summary: Створіть свій перший Plugin для OpenClaw за лічені хвилини
title: Створення Plugin-ів
x-i18n:
    generated_at: "2026-04-22T17:55:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35faa4e2722a58aa12330103b42d2dd6e14e56ee46720883d0945a984d991f79
    source_path: plugins/building-plugins.md
    workflow: 15
---

# Створення Plugin-ів

Plugin-и розширюють OpenClaw новими можливостями: канали, провайдери моделей,
мовлення, транскрипція в реальному часі, голос у реальному часі, розуміння медіа, генерація
зображень, генерація відео, веб-отримання, веб-пошук, інструменти агента або будь-яка
комбінація.

Вам не потрібно додавати свій Plugin до репозиторію OpenClaw. Опублікуйте його в
[ClawHub](/uk/tools/clawhub) або npm, і користувачі встановлять його за допомогою
`openclaw plugins install <package-name>`. OpenClaw спочатку намагається використати ClawHub, а
потім автоматично переходить до npm.

## Передумови

- Node >= 22 і менеджер пакетів (npm або pnpm)
- Знайомство з TypeScript (ESM)
- Для Plugin-ів у репозиторії: клонований репозиторій і виконаний `pnpm install`

## Який тип Plugin-а?

<CardGroup cols={3}>
  <Card title="Channel plugin" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Підключіть OpenClaw до платформи обміну повідомленнями (Discord, IRC тощо)
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/uk/plugins/sdk-provider-plugins">
    Додайте провайдера моделей (LLM, проксі або користувацьку кінцеву точку)
  </Card>
  <Card title="Tool / hook plugin" icon="wrench">
    Зареєструйте інструменти агента, хуки подій або сервіси — продовження нижче
  </Card>
</CardGroup>

Якщо Channel plugin є необов’язковим і може бути не встановлений, коли виконується
onboarding/налаштування, використовуйте `createOptionalChannelSetupSurface(...)` з
`openclaw/plugin-sdk/channel-setup`. Він створює пару адаптера налаштування + майстра,
яка повідомляє про вимогу встановлення і блокує реальні записи конфігурації
до встановлення Plugin-а.

## Швидкий старт: Tool plugin

У цьому прикладі створюється мінімальний Plugin, який реєструє інструмент агента. Для Channel
plugin-ів і Provider plugin-ів є окремі посібники за посиланнями вище.

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
      "description": "Adds a custom tool to OpenClaw",
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Кожному Plugin-у потрібен маніфест, навіть без конфігурації. Див.
    [Manifest](/uk/plugins/manifest) для повної схеми. Канонічні фрагменти публікації ClawHub
    розміщені в `docs/snippets/plugin-publish/`.

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

    `definePluginEntry` призначений для Plugin-ів, які не є каналами. Для каналів використовуйте
    `defineChannelPluginEntry` — див. [Channel Plugins](/uk/plugins/sdk-channel-plugins).
    Повний перелік параметрів точки входу див. у [Entry Points](/uk/plugins/sdk-entrypoints).

  </Step>

  <Step title="Протестуйте й опублікуйте">

    **Зовнішні Plugin-и:** виконайте перевірку та опублікуйте в ClawHub, потім встановіть:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw також перевіряє ClawHub перед npm для простих специфікацій пакетів, як-от
    `@myorg/openclaw-my-plugin`.

    **Plugin-и в репозиторії:** розміщуйте в дереві робочого простору bundled Plugin-ів — вони виявляються автоматично.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Можливості Plugin-ів

Один Plugin може зареєструвати будь-яку кількість можливостей через об’єкт `api`:

| Можливість             | Метод реєстрації                                | Докладний посібник                                                              |
| ---------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------- |
| Текстова інференція (LLM) | `api.registerProvider(...)`                  | [Provider Plugins](/uk/plugins/sdk-provider-plugins)                               |
| Бекенд інференції CLI  | `api.registerCliBackend(...)`                   | [CLI Backends](/uk/gateway/cli-backends)                                           |
| Канал / обмін повідомленнями | `api.registerChannel(...)`               | [Channel Plugins](/uk/plugins/sdk-channel-plugins)                                 |
| Мовлення (TTS/STT)     | `api.registerSpeechProvider(...)`               | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Транскрипція в реальному часі | `api.registerRealtimeTranscriptionProvider(...)` | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Голос у реальному часі | `api.registerRealtimeVoiceProvider(...)`        | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Розуміння медіа        | `api.registerMediaUnderstandingProvider(...)`   | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація зображень    | `api.registerImageGenerationProvider(...)`      | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація музики       | `api.registerMusicGenerationProvider(...)`      | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація відео        | `api.registerVideoGenerationProvider(...)`      | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Веб-отримання          | `api.registerWebFetchProvider(...)`             | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Веб-пошук              | `api.registerWebSearchProvider(...)`            | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Вбудоване розширення Pi | `api.registerEmbeddedExtensionFactory(...)`    | [SDK Overview](/uk/plugins/sdk-overview#registration-api)                          |
| Інструменти агента     | `api.registerTool(...)`                         | Нижче                                                                           |
| Користувацькі команди  | `api.registerCommand(...)`                      | [Entry Points](/uk/plugins/sdk-entrypoints)                                        |
| Хуки подій             | `api.registerHook(...)`                         | [Entry Points](/uk/plugins/sdk-entrypoints)                                        |
| HTTP-маршрути          | `api.registerHttpRoute(...)`                    | [Internals](/uk/plugins/architecture#gateway-http-routes)                          |
| Підкоманди CLI         | `api.registerCli(...)`                          | [Entry Points](/uk/plugins/sdk-entrypoints)                                        |

Повний API реєстрації див. у [SDK Overview](/uk/plugins/sdk-overview#registration-api).

Використовуйте `api.registerEmbeddedExtensionFactory(...)`, коли Plugin потребує
Pi-native hook-ів embedded-runner, наприклад асинхронного переписування `tool_result`
перед тим, як буде надіслано фінальне повідомлення з результатом інструмента. Віддавайте перевагу звичайним хукам Plugin-ів OpenClaw, коли
робота не потребує таймінгу розширення Pi.

Якщо ваш Plugin реєструє користувацькі Gateway RPC-методи, використовуйте для них
префікс, специфічний для Plugin-а. Простори імен адміністрування ядра (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими і завжди зіставляються з
`operator.admin`, навіть якщо Plugin запитує вужчу область дії.

Семантика guard-хуків, про яку варто пам’ятати:

- `before_tool_call`: `{ block: true }` є термінальним результатом і зупиняє обробники з нижчим пріоритетом.
- `before_tool_call`: `{ block: false }` розглядається як відсутність рішення.
- `before_tool_call`: `{ requireApproval: true }` призупиняє виконання агента і запитує в користувача схвалення через overlay схвалення exec, кнопки Telegram, взаємодії Discord або команду `/approve` у будь-якому каналі.
- `before_install`: `{ block: true }` є термінальним результатом і зупиняє обробники з нижчим пріоритетом.
- `before_install`: `{ block: false }` розглядається як відсутність рішення.
- `message_sending`: `{ cancel: true }` є термінальним результатом і зупиняє обробники з нижчим пріоритетом.
- `message_sending`: `{ cancel: false }` розглядається як відсутність рішення.
- `message_received`: надавайте перевагу типізованому полю `threadId`, коли вам потрібна маршрутизація вхідних потоків/тем. `metadata` залишайте для специфічних для каналу доповнень.
- `message_sending`: надавайте перевагу типізованим полям маршрутизації `replyToId` / `threadId` замість специфічних для каналу ключів metadata.

Команда `/approve` обробляє як схвалення exec, так і схвалення Plugin-ів, із обмеженим резервним сценарієм: коли ідентифікатор схвалення exec не знайдено, OpenClaw повторно пробує той самий ідентифікатор через схвалення Plugin-ів. Переспрямування схвалення Plugin-ів можна налаштувати окремо через `approvals.plugin` у конфігурації.

Якщо для користувацької логіки схвалення потрібно виявити той самий обмежений резервний сценарій,
використовуйте `isApprovalNotFoundError` з `openclaw/plugin-sdk/error-runtime`
замість ручного зіставлення рядків про завершення строку дії схвалення.

Докладніше див. у [SDK Overview hook decision semantics](/uk/plugins/sdk-overview#hook-decision-semantics).

## Реєстрація інструментів агента

Інструменти — це типізовані функції, які може викликати LLM. Вони можуть бути обов’язковими (завжди
доступними) або необов’язковими (користувач вмикає їх самостійно):

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

- Назви інструментів не повинні конфліктувати з інструментами ядра (конфлікти пропускаються)
- Використовуйте `optional: true` для інструментів із побічними ефектами або додатковими вимогами до бінарних файлів
- Користувачі можуть увімкнути всі інструменти з Plugin-а, додавши ідентифікатор Plugin-а до `tools.allow`

## Угоди щодо імпортів

Завжди імпортуйте з цільових шляхів `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

Повний довідник щодо підшляхів див. у [SDK Overview](/uk/plugins/sdk-overview).

У межах вашого Plugin-а використовуйте локальні barrel-файли (`api.ts`, `runtime-api.ts`) для
внутрішніх імпортів — ніколи не імпортуйте власний Plugin через його шлях SDK.

Для Provider plugin-ів зберігайте специфічні для провайдера допоміжні функції в цих barrel-файлах кореня пакета,
якщо тільки межа не є справді загальною. Поточні bundled-приклади:

- Anthropic: обгортки потоків Claude і допоміжні функції `service_tier` / beta
- OpenAI: конструктори провайдерів, допоміжні функції моделей за замовчуванням, провайдери реального часу
- OpenRouter: конструктор провайдера плюс допоміжні функції onboarding/конфігурації

Якщо допоміжна функція корисна лише всередині одного bundled-пакета провайдера, залишайте її на
цьому package-root seam замість перенесення до `openclaw/plugin-sdk/*`.

Деякі згенеровані helper seam-и `openclaw/plugin-sdk/<bundled-id>` усе ще існують для
підтримки bundled Plugin-ів і сумісності, наприклад
`plugin-sdk/feishu-setup` або `plugin-sdk/zalo-setup`. Ставтеся до них як до зарезервованих
поверхонь, а не як до типової моделі для нових сторонніх Plugin-ів.

## Контрольний список перед поданням

<Check>**package.json** має коректні метадані `openclaw`</Check>
<Check>Маніфест **openclaw.plugin.json** присутній і валідний</Check>
<Check>Точка входу використовує `defineChannelPluginEntry` або `definePluginEntry`</Check>
<Check>Усі імпорти використовують цільові шляхи `plugin-sdk/<subpath>`</Check>
<Check>Внутрішні імпорти використовують локальні модулі, а не self-import-и через SDK</Check>
<Check>Тести проходять (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` проходить (для Plugin-ів у репозиторії)</Check>

## Тестування бета-релізу

1. Стежте за тегами релізів GitHub у [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) і підпишіться через `Watch` > `Releases`. Бета-теги мають вигляд `v2026.3.N-beta.1`. Ви також можете ввімкнути сповіщення для офіційного акаунта OpenClaw у X [@openclaw](https://x.com/openclaw) для анонсів релізів.
2. Протестуйте свій Plugin на бета-тегу, щойно він з’явиться. Вікно до стабільного релізу зазвичай триває лише кілька годин.
3. Після тестування напишіть у гілці вашого Plugin-а в каналі Discord `plugin-forum`: або `all good`, або що саме зламалося. Якщо у вас ще немає гілки, створіть її.
4. Якщо щось зламалося, відкрийте або оновіть issue з назвою `Beta blocker: <plugin-name> - <summary>` і застосуйте мітку `beta-blocker`. Додайте посилання на issue у вашу гілку.
5. Відкрийте PR до `main` з назвою `fix(<plugin-id>): beta blocker - <summary>` і додайте посилання на issue як у PR, так і у вашій гілці Discord. Учасники не можуть додавати мітки до PR, тому назва — це сигнал на боці PR для супроводжувачів і автоматизації. Блокери з PR будуть злиті; блокери без нього можуть усе одно потрапити в реліз. Супроводжувачі стежать за цими гілками під час бета-тестування.
6. Відсутність повідомлень означає, що все гаразд. Якщо ви пропустите вікно, ваш виправлений код, імовірно, потрапить у наступний цикл.

## Наступні кроки

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Створіть Plugin каналу обміну повідомленнями
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/uk/plugins/sdk-provider-plugins">
    Створіть Plugin провайдера моделей
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/uk/plugins/sdk-overview">
    Карта імпортів і довідник API реєстрації
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/uk/plugins/sdk-runtime">
    TTS, пошук, subagent через api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/uk/plugins/sdk-testing">
    Утиліти та шаблони тестування
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/uk/plugins/manifest">
    Повний довідник схеми маніфесту
  </Card>
</CardGroup>

## Пов’язане

- [Plugin Architecture](/uk/plugins/architecture) — глибоке занурення у внутрішню архітектуру
- [SDK Overview](/uk/plugins/sdk-overview) — довідник SDK Plugin-ів
- [Manifest](/uk/plugins/manifest) — формат маніфесту plugin-а
- [Channel Plugins](/uk/plugins/sdk-channel-plugins) — створення channel plugin-ів
- [Provider Plugins](/uk/plugins/sdk-provider-plugins) — створення provider plugin-ів
