---
read_when:
    - Ви хочете створити новий Plugin для OpenClaw
    - Вам потрібен короткий посібник зі швидкого старту для розробки Plugin-ів
    - Ви додаєте новий канал, провайдера, інструмент або іншу можливість до OpenClaw
sidebarTitle: Getting Started
summary: Створіть свій перший Plugin для OpenClaw за лічені хвилини
title: Створення Plugin-ів
x-i18n:
    generated_at: "2026-04-28T02:18:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 25b2f3f05a468d0ce017eb67877511f0e551f62322f16a00fee9f8b367a25494
    source_path: plugins/building-plugins.md
    workflow: 15
---

Plugin-и розширюють OpenClaw новими можливостями: канали, провайдери моделей,
мовлення, транскрибування в реальному часі, голос у реальному часі, розуміння медіа, генерація зображень,
генерація відео, отримання даних із вебу, вебпошук, інструменти агента або будь-яку
комбінацію.

Вам не потрібно додавати свій Plugin до репозиторію OpenClaw. Опублікуйте його в
[ClawHub](/uk/tools/clawhub) або npm, і користувачі встановлять його за допомогою
`openclaw plugins install <package-name>`. OpenClaw спочатку намагається використати ClawHub, а
потім автоматично переключається на npm.

## Передумови

- Node >= 22 і менеджер пакетів (npm або pnpm)
- Знання TypeScript (ESM)
- Для Plugin-ів у репозиторії: клонований репозиторій і виконаний `pnpm install`

## Який тип Plugin-а?

<CardGroup cols={3}>
  <Card title="Plugin каналу" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Підключіть OpenClaw до платформи обміну повідомленнями (Discord, IRC тощо)
  </Card>
  <Card title="Plugin провайдера" icon="cpu" href="/uk/plugins/sdk-provider-plugins">
    Додайте провайдера моделей (LLM, проксі або власну кінцеву точку)
  </Card>
  <Card title="Plugin інструментів / хуків" icon="wrench" href="/uk/plugins/hooks">
    Зареєструйте інструменти агента, хуки подій або сервіси — продовжуйте нижче
  </Card>
</CardGroup>

Для Plugin-а каналу, який не гарантовано встановлено під час виконання онбордингу/налаштування,
використовуйте `createOptionalChannelSetupSurface(...)` з
`openclaw/plugin-sdk/channel-setup`. Він створює пару адаптера налаштування + майстра,
яка повідомляє про вимогу встановлення і блокує реальний запис конфігурації
доти, доки Plugin не буде встановлено.

## Швидкий старт: Plugin інструмента

У цьому прикладі створюється мінімальний Plugin, який реєструє інструмент агента. Plugin-и каналів
і провайдерів мають окремі посібники, посилання на які наведено вище.

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

    Кожному Plugin-у потрібен маніфест, навіть без конфігурації, і кожен Plugin має
    явно визначати `activation.onStartup`. Інструментам, зареєстрованим під час виконання,
    потрібен імпорт під час запуску, тому в цьому прикладі встановлено значення `true`. Див.
    [Manifest](/uk/plugins/manifest) для повної схеми. Канонічні фрагменти публікації в ClawHub
    розміщено в `docs/snippets/plugin-publish/`.

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

    `definePluginEntry` призначено для Plugin-ів, які не є каналами. Для каналів використовуйте
    `defineChannelPluginEntry` — див. [Channel Plugins](/uk/plugins/sdk-channel-plugins).
    Повний список параметрів точки входу див. у [Entry Points](/uk/plugins/sdk-entrypoints).

  </Step>

  <Step title="Протестуйте й опублікуйте">

    **Зовнішні Plugin-и:** перевірте й опублікуйте за допомогою ClawHub, а потім встановіть:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw також перевіряє ClawHub перед npm для звичайних специфікацій пакетів, таких як
    `@myorg/openclaw-my-plugin`.

    **Plugin-и в репозиторії:** розміщуйте в дереві робочого простору вбудованих Plugin-ів — їх буде виявлено автоматично.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Можливості Plugin-а

Один Plugin може реєструвати будь-яку кількість можливостей через об’єкт `api`:

| Можливість            | Метод реєстрації                               | Докладний посібник                                                             |
| --------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------ |
| Текстовий inference (LLM) | `api.registerProvider(...)`                      | [Provider Plugins](/uk/plugins/sdk-provider-plugins)                              |
| Бекенд inference для CLI | `api.registerCliBackend(...)`                    | [CLI Backends](/uk/gateway/cli-backends)                                          |
| Канал / повідомлення  | `api.registerChannel(...)`                     | [Channel Plugins](/uk/plugins/sdk-channel-plugins)                                |
| Мовлення (TTS/STT)    | `api.registerSpeechProvider(...)`              | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Транскрибування в реальному часі | `api.registerRealtimeTranscriptionProvider(...)` | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Голос у реальному часі | `api.registerRealtimeVoiceProvider(...)`         | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Розуміння медіа       | `api.registerMediaUnderstandingProvider(...)`  | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація зображень   | `api.registerImageGenerationProvider(...)`     | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація музики      | `api.registerMusicGenerationProvider(...)`     | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація відео       | `api.registerVideoGenerationProvider(...)`     | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Отримання даних із вебу | `api.registerWebFetchProvider(...)`              | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Вебпошук              | `api.registerWebSearchProvider(...)`           | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Middleware результатів інструментів | `api.registerAgentToolResultMiddleware(...)`     | [SDK Overview](/uk/plugins/sdk-overview#registration-api)                         |
| Інструменти агента    | `api.registerTool(...)`                        | Нижче                                                                          |
| Власні команди        | `api.registerCommand(...)`                     | [Entry Points](/uk/plugins/sdk-entrypoints)                                       |
| Хуки Plugin-а         | `api.on(...)`                                  | [Plugin hooks](/uk/plugins/hooks)                                                 |
| Внутрішні хуки подій  | `api.registerHook(...)`                        | [Entry Points](/uk/plugins/sdk-entrypoints)                                       |
| HTTP-маршрути         | `api.registerHttpRoute(...)`                   | [Internals](/uk/plugins/architecture-internals#gateway-http-routes)               |
| Підкоманди CLI        | `api.registerCli(...)`                         | [Entry Points](/uk/plugins/sdk-entrypoints)                                       |

Повний API реєстрації див. у [SDK Overview](/uk/plugins/sdk-overview#registration-api).

Вбудовані Plugin-и можуть використовувати `api.registerAgentToolResultMiddleware(...)`, коли їм
потрібне асинхронне переписування результатів інструментів до того, як модель побачить вивід. Укажіть
цільові середовища виконання в `contracts.agentToolResultMiddleware`, наприклад
`["pi", "codex"]`. Це довірений інтерфейс для вбудованих Plugin-ів; зовнішнім
Plugin-ам слід надавати перевагу звичайним хукам Plugin-ів OpenClaw, якщо тільки в OpenClaw не з’явиться
явна політика довіри для цієї можливості.

Якщо ваш Plugin реєструє власні методи Gateway RPC, використовуйте для них
префікс, специфічний для Plugin-а. Простори імен адміністрування ядра (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими і завжди
зіставляються з `operator.admin`, навіть якщо Plugin запитує вужчу область дії.

Семантика захисту хуків, про яку слід пам’ятати:

- `before_tool_call`: `{ block: true }` є кінцевим рішенням і зупиняє обробники з нижчим пріоритетом.
- `before_tool_call`: `{ block: false }` розглядається як відсутність рішення.
- `before_tool_call`: `{ requireApproval: true }` призупиняє виконання агента і запитує схвалення користувача через оверлей схвалення exec, кнопки Telegram, взаємодії Discord або команду `/approve` у будь-якому каналі.
- `before_install`: `{ block: true }` є кінцевим рішенням і зупиняє обробники з нижчим пріоритетом.
- `before_install`: `{ block: false }` розглядається як відсутність рішення.
- `message_sending`: `{ cancel: true }` є кінцевим рішенням і зупиняє обробники з нижчим пріоритетом.
- `message_sending`: `{ cancel: false }` розглядається як відсутність рішення.
- `message_received`: віддавайте перевагу типізованому полю `threadId`, коли потрібна маршрутизація вхідних потоків/тем. Зберігайте `metadata` для додаткових даних, специфічних для каналу.
- `message_sending`: віддавайте перевагу типізованим полям маршрутизації `replyToId` / `threadId` замість ключів metadata, специфічних для каналу.

Команда `/approve` обробляє як схвалення exec, так і схвалення Plugin-ів із обмеженим запасним механізмом: якщо ідентифікатор схвалення exec не знайдено, OpenClaw повторно перевіряє той самий ідентифікатор через схвалення Plugin-ів. Переспрямування схвалення Plugin-ів можна налаштувати окремо через `approvals.plugin` у конфігурації.

Якщо власній логіці схвалення потрібно виявляти той самий випадок із обмеженим запасним механізмом,
використовуйте `isApprovalNotFoundError` з `openclaw/plugin-sdk/error-runtime`
замість ручного зіставлення рядків про завершення терміну дії схвалення.

Приклади та довідку по хуках див. у [Plugin hooks](/uk/plugins/hooks).

## Реєстрація інструментів агента

Інструменти — це типізовані функції, які може викликати LLM. Вони можуть бути обов’язковими
(завжди доступними) або необов’язковими (користувач має явно увімкнути їх):

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
- Інструменти з некоректними об’єктами реєстрації, зокрема без `parameters`, пропускаються і відображаються в діагностиці Plugin-а замість того, щоб ламати запуски агента
- Використовуйте `optional: true` для інструментів із побічними ефектами або додатковими вимогами до бінарних файлів
- Користувачі можуть увімкнути всі інструменти з Plugin-а, додавши ідентифікатор Plugin-а до `tools.allow`

## Правила імпорту

Завжди імпортуйте зі спеціалізованих шляхів `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

Повний перелік підшляхів див. у [SDK Overview](/uk/plugins/sdk-overview).

У межах вашого Plugin-а використовуйте локальні barrel-файли (`api.ts`, `runtime-api.ts`) для
внутрішніх імпортів — ніколи не імпортуйте власний Plugin через його шлях SDK.

Для Plugin-ів провайдерів зберігайте допоміжні засоби, специфічні для провайдера, у цих
barrel-файлах у корені пакета, якщо тільки інтерфейс не є справді загальним. Поточні вбудовані приклади:

- Anthropic: обгортки потоків Claude і допоміжні засоби `service_tier` / beta
- OpenAI: конструктори провайдерів, допоміжні засоби для моделей за замовчуванням, провайдери реального часу
- OpenRouter: конструктор провайдера плюс допоміжні засоби онбордингу/конфігурації

Якщо допоміжний засіб корисний лише всередині одного пакета вбудованого провайдера, зберігайте його
в цьому інтерфейсі кореня пакета замість того, щоб переносити його в `openclaw/plugin-sdk/*`.

Деякі згенеровані інтерфейси допоміжних засобів `openclaw/plugin-sdk/<bundled-id>` усе ще існують для
підтримки вбудованих Plugin-ів і сумісності, наприклад
`plugin-sdk/feishu-setup` або `plugin-sdk/zalo-setup`. Розглядайте їх як зарезервовані
поверхні, а не як шаблон за замовчуванням для нових сторонніх Plugin-ів.

## Контрольний список перед поданням

<Check>**package.json** має правильні метадані `openclaw`</Check>
<Check>Маніфест **openclaw.plugin.json** присутній і коректний</Check>
<Check>Точка входу використовує `defineChannelPluginEntry` або `definePluginEntry`</Check>
<Check>Усі імпорти використовують спеціалізовані шляхи `plugin-sdk/<subpath>`</Check>
<Check>Внутрішні імпорти використовують локальні модулі, а не самоімпорти через SDK</Check>
<Check>Тести проходять (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` проходить успішно (для Plugin-ів у репозиторії)</Check>

## Тестування beta-релізів

1. Стежте за тегами релізів GitHub у [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) і підпишіться через `Watch` > `Releases`. Beta-теги мають вигляд `v2026.3.N-beta.1`. Ви також можете увімкнути сповіщення для офіційного X-акаунта OpenClaw [@openclaw](https://x.com/openclaw) про анонси релізів.
2. Перевірте свій Plugin на beta-тегу щойно він з’явиться. Вікно до stable-релізу зазвичай триває лише кілька годин.
3. Після тестування напишіть у гілці вашого Plugin-а в каналі Discord `plugin-forum`: або `all good`, або що саме зламалося. Якщо у вас ще немає гілки, створіть її.
4. Якщо щось зламається, створіть або оновіть issue із заголовком `Beta blocker: <plugin-name> - <summary>` і застосуйте мітку `beta-blocker`. Додайте посилання на issue у свою гілку.
5. Відкрийте PR до `main` із заголовком `fix(<plugin-id>): beta blocker - <summary>` і додайте посилання на issue як у PR, так і у вашу гілку Discord. Учасники не можуть ставити мітки PR, тому заголовок є сигналом на боці PR для мейнтейнерів і автоматизації. Блокери з PR буде змерджено; блокери без нього все одно можуть потрапити в реліз. Мейнтейнери стежать за цими гілками під час beta-тестування.
6. Тиша означає, що все добре. Якщо ви пропустите це вікно, ваше виправлення, ймовірно, потрапить у наступний цикл.

## Наступні кроки

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Створіть Plugin каналу обміну повідомленнями
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/uk/plugins/sdk-provider-plugins">
    Створіть Plugin провайдера моделей
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/uk/plugins/sdk-overview">
    Карта імпортів і довідка з API реєстрації
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/uk/plugins/sdk-runtime">
    TTS, пошук, subagent через api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/uk/plugins/sdk-testing">
    Утиліти та шаблони тестування
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/uk/plugins/manifest">
    Повна довідка зі схеми маніфесту
  </Card>
</CardGroup>

## Пов’язане

- [Plugin Architecture](/uk/plugins/architecture) — поглиблений огляд внутрішньої архітектури
- [SDK Overview](/uk/plugins/sdk-overview) — довідка по Plugin SDK
- [Manifest](/uk/plugins/manifest) — формат маніфесту Plugin-а
- [Channel Plugins](/uk/plugins/sdk-channel-plugins) — створення Plugin-ів каналів
- [Provider Plugins](/uk/plugins/sdk-provider-plugins) — створення Plugin-ів провайдерів
