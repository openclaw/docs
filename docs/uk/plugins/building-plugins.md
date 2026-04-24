---
read_when:
    - Ви хочете створити новий Plugin для OpenClaw
    - Вам потрібен швидкий старт для розробки Plugin-ів
    - Ви додаєте новий канал, провайдера, інструмент або іншу можливість до OpenClaw
sidebarTitle: Getting Started
summary: Створіть свій перший Plugin для OpenClaw за лічені хвилини
title: Створення Plugin-ів
x-i18n:
    generated_at: "2026-04-24T20:32:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: fc6a4b97c403d7d381fae13e3815737a4b21144755e924bdf9d63c22d4cac844
    source_path: plugins/building-plugins.md
    workflow: 15
---

Plugin-и розширюють OpenClaw новими можливостями: канали, провайдери моделей,
мовлення, транскрибування в реальному часі, голос у реальному часі, розуміння медіа, генерація
зображень, генерація відео, отримання вебданих, вебпошук, інструменти агентів або
будь-яка комбінація.

Вам не потрібно додавати свій Plugin до репозиторію OpenClaw. Опублікуйте його в
[ClawHub](/uk/tools/clawhub) або npm, і користувачі встановлять його за допомогою
`openclaw plugins install <package-name>`. OpenClaw спочатку намагається використати ClawHub, а
потім автоматично переходить до npm.

## Передумови

- Node >= 22 і менеджер пакетів (npm або pnpm)
- Знайомство з TypeScript (ESM)
- Для Plugin-ів у репозиторії: клонований репозиторій і виконано `pnpm install`

## Який тип Plugin-а?

<CardGroup cols={3}>
  <Card title="Plugin каналу" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Підключіть OpenClaw до платформи обміну повідомленнями (Discord, IRC тощо)
  </Card>
  <Card title="Plugin провайдера" icon="cpu" href="/uk/plugins/sdk-provider-plugins">
    Додайте провайдера моделей (LLM, проксі або власний endpoint)
  </Card>
  <Card title="Plugin інструмента / hook" icon="wrench" href="/uk/plugins/hooks">
    Зареєструйте інструменти агента, event hooks або сервіси — продовження нижче
  </Card>
</CardGroup>

Для Plugin-а каналу, який не гарантовано буде встановлений під час виконання
onboarding/setup, використовуйте `createOptionalChannelSetupSurface(...)` з
`openclaw/plugin-sdk/channel-setup`. Він створює пару адаптера setup + wizard,
яка повідомляє про вимогу встановлення та блокує реальні записи конфігурації,
доки Plugin не буде встановлено.

## Швидкий старт: Plugin інструмента

Цей посібник створює мінімальний Plugin, який реєструє інструмент агента. Для Plugin-ів
каналів і провайдерів є окремі посібники за посиланнями вище.

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

    Кожному Plugin-у потрібен маніфест, навіть якщо в ньому немає конфігурації. Див.
    [Manifest](/uk/plugins/manifest) для повної схеми. Канонічні фрагменти публікації в ClawHub
    містяться в `docs/snippets/plugin-publish/`.

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
    Повний список параметрів точки входу див. у [Entry Points](/uk/plugins/sdk-entrypoints).

  </Step>

  <Step title="Протестуйте й опублікуйте">

    **Зовнішні Plugin-и:** виконайте перевірку та опублікуйте через ClawHub, а потім встановіть:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw також перевіряє ClawHub перед npm для звичайних специфікацій пакетів, таких як
    `@myorg/openclaw-my-plugin`.

    **Plugin-и в репозиторії:** розмістіть у дереві workspace вбудованих Plugin-ів — вони будуть виявлені автоматично.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Можливості Plugin-а

Один Plugin може реєструвати будь-яку кількість можливостей через об’єкт `api`:

| Можливість            | Метод реєстрації                               | Докладний посібник                                                              |
| --------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------- |
| Текстова інференція (LLM) | `api.registerProvider(...)`                 | [Provider Plugins](/uk/plugins/sdk-provider-plugins)                               |
| Backend інференції CLI | `api.registerCliBackend(...)`                 | [CLI Backends](/uk/gateway/cli-backends)                                           |
| Канал / повідомлення  | `api.registerChannel(...)`                     | [Channel Plugins](/uk/plugins/sdk-channel-plugins)                                 |
| Мовлення (TTS/STT)    | `api.registerSpeechProvider(...)`              | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Транскрибування в реальному часі | `api.registerRealtimeTranscriptionProvider(...)` | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Голос у реальному часі | `api.registerRealtimeVoiceProvider(...)`      | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Розуміння медіа       | `api.registerMediaUnderstandingProvider(...)`  | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація зображень   | `api.registerImageGenerationProvider(...)`     | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація музики      | `api.registerMusicGenerationProvider(...)`     | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація відео       | `api.registerVideoGenerationProvider(...)`     | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Отримання вебданих    | `api.registerWebFetchProvider(...)`            | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Вебпошук              | `api.registerWebSearchProvider(...)`           | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Middleware результатів інструментів | `api.registerAgentToolResultMiddleware(...)` | [SDK Overview](/uk/plugins/sdk-overview#registration-api)                          |
| Інструменти агентів   | `api.registerTool(...)`                        | Нижче                                                                           |
| Користувацькі команди | `api.registerCommand(...)`                     | [Entry Points](/uk/plugins/sdk-entrypoints)                                        |
| Plugin hooks          | `api.on(...)`                                  | [Plugin hooks](/uk/plugins/hooks)                                                  |
| Внутрішні event hooks | `api.registerHook(...)`                        | [Entry Points](/uk/plugins/sdk-entrypoints)                                        |
| HTTP-маршрути         | `api.registerHttpRoute(...)`                   | [Internals](/uk/plugins/architecture-internals#gateway-http-routes)                |
| Підкоманди CLI        | `api.registerCli(...)`                         | [Entry Points](/uk/plugins/sdk-entrypoints)                                        |

Повний API реєстрації див. у [SDK Overview](/uk/plugins/sdk-overview#registration-api).

Вбудовані Plugin-и можуть використовувати `api.registerAgentToolResultMiddleware(...)`, коли їм
потрібне асинхронне переписування результатів інструментів до того, як модель побачить вивід. Вкажіть
цільові harnesses у `contracts.agentToolResultMiddleware`, наприклад
`["pi", "codex-app-server"]`. Це довірений механізм для вбудованих Plugin-ів; зовнішнім
Plugin-ам варто надавати перевагу звичайним Plugin hooks OpenClaw, якщо тільки OpenClaw не отримає
явну політику довіри для цієї можливості.

Якщо ваш Plugin реєструє користувацькі методи gateway RPC, використовуйте
префікс, специфічний для Plugin-а. Простори імен адміністрування ядра (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди відповідають
`operator.admin`, навіть якщо Plugin запитує вужчу область доступу.

Семантика захисту hooks, про яку слід пам’ятати:

- `before_tool_call`: `{ block: true }` є остаточним рішенням і зупиняє обробники з нижчим пріоритетом.
- `before_tool_call`: `{ block: false }` розглядається як відсутність рішення.
- `before_tool_call`: `{ requireApproval: true }` призупиняє виконання агента й запитує у користувача підтвердження через overlay підтвердження exec, кнопки Telegram, взаємодії Discord або команду `/approve` у будь-якому каналі.
- `before_install`: `{ block: true }` є остаточним рішенням і зупиняє обробники з нижчим пріоритетом.
- `before_install`: `{ block: false }` розглядається як відсутність рішення.
- `message_sending`: `{ cancel: true }` є остаточним рішенням і зупиняє обробники з нижчим пріоритетом.
- `message_sending`: `{ cancel: false }` розглядається як відсутність рішення.
- `message_received`: надавайте перевагу типізованому полю `threadId`, коли вам потрібна маршрутизація вхідних потоків/тем. `metadata` залишайте для додаткових даних, специфічних для каналу.
- `message_sending`: надавайте перевагу типізованим полям маршрутизації `replyToId` / `threadId`, а не ключам metadata, специфічним для каналу.

Команда `/approve` обробляє як підтвердження exec, так і підтвердження Plugin-ів з обмеженим fallback: якщо ідентифікатор підтвердження exec не знайдено, OpenClaw повторно пробує той самий ідентифікатор через підтвердження Plugin-ів. Переспрямування підтверджень Plugin-ів можна налаштувати окремо через `approvals.plugin` у конфігурації.

Якщо користувацька логіка підтвердження має визначати той самий випадок обмеженого fallback,
використовуйте `isApprovalNotFoundError` з `openclaw/plugin-sdk/error-runtime`
замість ручного зіставлення рядків закінчення терміну підтвердження.

Приклади й довідник hooks див. у [Plugin hooks](/uk/plugins/hooks).

## Реєстрація інструментів агентів

Інструменти — це типізовані функції, які може викликати LLM. Вони можуть бути обов’язковими (завжди
доступні) або необов’язковими (користувач сам вмикає їх):

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

Повний довідник підшляхів див. у [SDK Overview](/uk/plugins/sdk-overview).

У межах вашого Plugin-а використовуйте локальні barrel-файли (`api.ts`, `runtime-api.ts`) для
внутрішніх імпортів — ніколи не імпортуйте власний Plugin через його шлях SDK.

Для Plugin-ів провайдерів зберігайте допоміжні функції, специфічні для провайдера, у цих barrel-файлах
кореня пакета, якщо тільки цей механізм не є справді загальним. Поточні вбудовані приклади:

- Anthropic: обгортки потоків Claude і допоміжні засоби `service_tier` / beta
- OpenAI: конструктори провайдерів, допоміжні засоби для моделей за замовчуванням, провайдери реального часу
- OpenRouter: конструктор провайдера плюс допоміжні засоби onboarding/config

Якщо допоміжний засіб корисний лише в межах одного пакета вбудованого провайдера, залишайте його
на цьому рівні пакета замість перенесення до `openclaw/plugin-sdk/*`.

Деякі згенеровані механізми допоміжних засобів `openclaw/plugin-sdk/<bundled-id>` усе ще існують для
підтримки вбудованих Plugin-ів і сумісності, наприклад
`plugin-sdk/feishu-setup` або `plugin-sdk/zalo-setup`. Розглядайте їх як зарезервовані
поверхні, а не як типовий шаблон для нових сторонніх Plugin-ів.

## Контрольний список перед поданням

<Check>**package.json** має коректні метадані `openclaw`</Check>
<Check>Маніфест **openclaw.plugin.json** присутній і валідний</Check>
<Check>Точка входу використовує `defineChannelPluginEntry` або `definePluginEntry`</Check>
<Check>Усі імпорти використовують цільові шляхи `plugin-sdk/<subpath>`</Check>
<Check>Внутрішні імпорти використовують локальні модулі, а не self-imports через SDK</Check>
<Check>Тести проходять (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` проходить (для Plugin-ів у репозиторії)</Check>

## Тестування beta-релізів

1. Слідкуйте за тегами релізів GitHub у [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) і підпишіться через `Watch` > `Releases`. Beta-теги мають вигляд `v2026.3.N-beta.1`. Ви також можете ввімкнути сповіщення для офіційного акаунта OpenClaw у X [@openclaw](https://x.com/openclaw) для анонсів релізів.
2. Протестуйте свій Plugin на beta-тегу щойно він з’явиться. Вікно до stable зазвичай становить лише кілька годин.
3. Після тестування напишіть у гілці вашого Plugin-а в каналі Discord `plugin-forum`: або `all good`, або що саме зламалося. Якщо у вас ще немає гілки, створіть її.
4. Якщо щось зламалося, створіть або оновіть issue з назвою `Beta blocker: <plugin-name> - <summary>` і застосуйте мітку `beta-blocker`. Додайте посилання на issue у свою гілку.
5. Відкрийте PR до `main` з назвою `fix(<plugin-id>): beta blocker - <summary>` і додайте посилання на issue як у PR, так і у вашій гілці Discord. Учасники не можуть ставити мітки на PR, тому назва є сигналом на боці PR для мейнтейнерів і автоматизації. Блокери з PR будуть злиті; блокери без нього все одно можуть потрапити в реліз. Під час beta-тестування мейнтейнери стежать за цими гілками.
6. Відсутність повідомлень означає, що все добре. Якщо ви пропустите це вікно, ваше виправлення, імовірно, потрапить уже в наступний цикл.

## Подальші кроки

<CardGroup cols={2}>
  <Card title="Plugins каналів" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Створіть Plugin каналу обміну повідомленнями
  </Card>
  <Card title="Plugins провайдерів" icon="cpu" href="/uk/plugins/sdk-provider-plugins">
    Створіть Plugin провайдера моделей
  </Card>
  <Card title="Огляд SDK" icon="book-open" href="/uk/plugins/sdk-overview">
    Карта імпортів і довідник API реєстрації
  </Card>
  <Card title="Допоміжні засоби runtime" icon="settings" href="/uk/plugins/sdk-runtime">
    TTS, пошук, subagent через api.runtime
  </Card>
  <Card title="Тестування" icon="test-tubes" href="/uk/plugins/sdk-testing">
    Утиліти та шаблони тестування
  </Card>
  <Card title="Маніфест Plugin-а" icon="file-json" href="/uk/plugins/manifest">
    Повний довідник зі схеми маніфесту
  </Card>
</CardGroup>

## Пов’язане

- [Plugin Architecture](/uk/plugins/architecture) — детальний огляд внутрішньої архітектури
- [SDK Overview](/uk/plugins/sdk-overview) — довідник SDK Plugin-ів
- [Manifest](/uk/plugins/manifest) — формат маніфесту plugin-а
- [Channel Plugins](/uk/plugins/sdk-channel-plugins) — створення Plugin-ів каналів
- [Provider Plugins](/uk/plugins/sdk-provider-plugins) — створення Plugin-ів провайдерів
