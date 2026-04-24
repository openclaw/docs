---
read_when:
    - Ви хочете створити новий Plugin для OpenClaw
    - Вам потрібен швидкий старт для розробки Plugin-ів
    - Ви додаєте новий канал, провайдера, інструмент або іншу можливість до OpenClaw
sidebarTitle: Getting Started
summary: Створіть свій перший Plugin для OpenClaw за лічені хвилини
title: Створення Plugin-ів
x-i18n:
    generated_at: "2026-04-24T17:33:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2989d85ebb7ef73a80de25bce5b156f9939c91fd0672c318aa2349bf079f6bc0
    source_path: plugins/building-plugins.md
    workflow: 15
---

Plugin-и розширюють OpenClaw новими можливостями: канали, провайдери моделей,
мовлення, транскрипція в реальному часі, голос у реальному часі, розуміння медіа, генерація зображень, відеогенерація, отримання вебвмісту, вебпошук, інструменти агентів або будь-яка
комбінація.

Вам не потрібно додавати свій Plugin до репозиторію OpenClaw. Опублікуйте його в
[ClawHub](/uk/tools/clawhub) або npm, і користувачі встановлять його за допомогою
`openclaw plugins install <package-name>`. OpenClaw спочатку звертається до ClawHub, а
потім автоматично переходить до npm.

## Передумови

- Node >= 22 і менеджер пакетів (npm або pnpm)
- Знайомство з TypeScript (ESM)
- Для Plugin-ів у репозиторії: клонований репозиторій і виконаний `pnpm install`

## Який тип Plugin-а?

<CardGroup cols={3}>
  <Card title="Plugin каналу" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Підключіть OpenClaw до платформи обміну повідомленнями (Discord, IRC тощо)
  </Card>
  <Card title="Plugin провайдера" icon="cpu" href="/uk/plugins/sdk-provider-plugins">
    Додайте провайдера моделей (LLM, проксі або власну кінцеву точку)
  </Card>
  <Card title="Plugin інструмента / хука" icon="wrench" href="/uk/plugins/hooks">
    Зареєструйте інструменти агента, хуки подій або сервіси — продовжуйте нижче
  </Card>
</CardGroup>

Для Plugin-а каналу, який не гарантовано буде встановлено під час запуску онбордингу/налаштування,
використовуйте `createOptionalChannelSetupSurface(...)` з
`openclaw/plugin-sdk/channel-setup`. Він створює пару адаптера налаштування й майстра,
яка повідомляє про вимогу встановлення та блокує реальні записи конфігурації,
доки Plugin не буде встановлено.

## Швидкий старт: Plugin інструмента

У цьому прикладі створюється мінімальний Plugin, який реєструє інструмент агента. Для Plugin-ів каналів
і провайдерів є окремі посібники, посилання на які наведено вище.

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
    [Manifest](/uk/plugins/manifest) для повної схеми. Канонічні фрагменти для публікації в ClawHub
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

    `definePluginEntry` призначено для Plugin-ів, які не є каналами. Для каналів використовуйте
    `defineChannelPluginEntry` — див. [Channel Plugins](/uk/plugins/sdk-channel-plugins).
    Повний перелік параметрів точки входу див. у [Entry Points](/uk/plugins/sdk-entrypoints).

  </Step>

  <Step title="Протестуйте й опублікуйте">

    **Зовнішні Plugin-и:** перевірте та опублікуйте через ClawHub, потім встановіть:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw також перевіряє ClawHub перед npm для звичайних специфікацій пакетів, таких як
    `@myorg/openclaw-my-plugin`.

    **Plugin-и в репозиторії:** розмістіть їх у дереві робочого простору bundled Plugin-ів — їх буде знайдено автоматично.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Можливості Plugin-а

Один Plugin може зареєструвати будь-яку кількість можливостей через об’єкт `api`:

| Можливість            | Метод реєстрації                                | Докладний посібник                                                            |
| --------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------- |
| Текстовий inference (LLM) | `api.registerProvider(...)`                      | [Provider Plugins](/uk/plugins/sdk-provider-plugins)                             |
| Бекенд inference для CLI | `api.registerCliBackend(...)`                    | [CLI Backends](/uk/gateway/cli-backends)                                         |
| Канал / обмін повідомленнями | `api.registerChannel(...)`                       | [Channel Plugins](/uk/plugins/sdk-channel-plugins)                               |
| Мовлення (TTS/STT)    | `api.registerSpeechProvider(...)`                | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Транскрипція в реальному часі | `api.registerRealtimeTranscriptionProvider(...)` | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Голос у реальному часі | `api.registerRealtimeVoiceProvider(...)`         | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Розуміння медіа       | `api.registerMediaUnderstandingProvider(...)`    | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація зображень   | `api.registerImageGenerationProvider(...)`       | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація музики      | `api.registerMusicGenerationProvider(...)`       | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Відеогенерація        | `api.registerVideoGenerationProvider(...)`       | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Отримання вебвмісту   | `api.registerWebFetchProvider(...)`              | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Вебпошук              | `api.registerWebSearchProvider(...)`             | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Вбудоване розширення Pi | `api.registerEmbeddedExtensionFactory(...)`      | [SDK Overview](/uk/plugins/sdk-overview#registration-api)                        |
| Інструменти агентів   | `api.registerTool(...)`                          | Нижче                                                                         |
| Користувацькі команди | `api.registerCommand(...)`                       | [Entry Points](/uk/plugins/sdk-entrypoints)                                      |
| Хуки Plugin-а         | `api.on(...)`                                    | [Plugin hooks](/uk/plugins/hooks)                                                |
| Внутрішні хуки подій  | `api.registerHook(...)`                          | [Entry Points](/uk/plugins/sdk-entrypoints)                                      |
| HTTP-маршрути         | `api.registerHttpRoute(...)`                     | [Internals](/uk/plugins/architecture-internals#gateway-http-routes)              |
| Підкоманди CLI        | `api.registerCli(...)`                           | [Entry Points](/uk/plugins/sdk-entrypoints)                                      |

Повний API реєстрації див. у [SDK Overview](/uk/plugins/sdk-overview#registration-api).

Використовуйте `api.registerEmbeddedExtensionFactory(...)`, коли Plugin-у потрібні
Pi-native хуки embedded-runner, наприклад асинхронне переписування `tool_result`
перед надсиланням фінального повідомлення з результатом інструмента. Віддавайте перевагу звичайним хукам Plugin-ів OpenClaw, якщо
робота не потребує таймінгу розширення Pi.

Якщо ваш Plugin реєструє власні RPC-методи Gateway, використовуйте для них
префікс, специфічний для Plugin-а. Простори імен адміністрування ядра (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди відповідають
`operator.admin`, навіть якщо Plugin запитує вужчу область доступу.

Семантика guard-хуків, про яку варто пам’ятати:

- `before_tool_call`: `{ block: true }` є термінальним і зупиняє обробники з нижчим пріоритетом.
- `before_tool_call`: `{ block: false }` вважається відсутністю рішення.
- `before_tool_call`: `{ requireApproval: true }` призупиняє виконання агента й запитує схвалення користувача через накладку схвалення exec, кнопки Telegram, взаємодії Discord або команду `/approve` в будь-якому каналі.
- `before_install`: `{ block: true }` є термінальним і зупиняє обробники з нижчим пріоритетом.
- `before_install`: `{ block: false }` вважається відсутністю рішення.
- `message_sending`: `{ cancel: true }` є термінальним і зупиняє обробники з нижчим пріоритетом.
- `message_sending`: `{ cancel: false }` вважається відсутністю рішення.
- `message_received`: віддавайте перевагу типізованому полю `threadId`, коли потрібна маршрутизація вхідних thread/topic. `metadata` залишайте для додаткових даних, специфічних для каналу.
- `message_sending`: віддавайте перевагу типізованим полям маршрутизації `replyToId` / `threadId` замість ключів metadata, специфічних для каналу.

Команда `/approve` обробляє як exec, так і схвалення Plugin-ів з обмеженим запасним варіантом: якщо ідентифікатор схвалення exec не знайдено, OpenClaw повторно перевіряє той самий ідентифікатор серед схвалень Plugin-ів. Переспрямування схвалень Plugin-ів можна окремо налаштувати через `approvals.plugin` у конфігурації.

Якщо власна логіка схвалення має визначати цей самий випадок обмеженого запасного варіанта,
використовуйте `isApprovalNotFoundError` з `openclaw/plugin-sdk/error-runtime`
замість ручного зіставлення рядків про завершення терміну дії схвалення.

Приклади та довідник по хуках див. у [Plugin hooks](/uk/plugins/hooks).

## Реєстрація інструментів агентів

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

- Назви інструментів не повинні конфліктувати з інструментами ядра (конфліктні буде пропущено)
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

Для Plugin-ів провайдерів зберігайте допоміжні функції, специфічні для провайдера, у цих barrel-файлах
у корені пакета, якщо лише межа не є справді загальною. Поточні bundled-приклади:

- Anthropic: обгортки потоків Claude і допоміжні засоби `service_tier` / beta
- OpenAI: конструктори провайдерів, допоміжні засоби для моделей за замовчуванням, провайдери realtime
- OpenRouter: конструктор провайдера плюс допоміжні засоби онбордингу/конфігурації

Якщо допоміжна функція корисна лише в межах одного bundled-пакета провайдера, залишайте її на
межі кореня цього пакета, а не піднімайте до `openclaw/plugin-sdk/*`.

Деякі згенеровані допоміжні межі `openclaw/plugin-sdk/<bundled-id>` усе ще існують для
підтримки bundled Plugin-ів і сумісності, наприклад
`plugin-sdk/feishu-setup` або `plugin-sdk/zalo-setup`. Розглядайте їх як зарезервовані
поверхні, а не як типовий шаблон для нових сторонніх Plugin-ів.

## Контрольний список перед поданням

<Check>**package.json** містить правильні метадані `openclaw`</Check>
<Check>Маніфест **openclaw.plugin.json** наявний і коректний</Check>
<Check>Точка входу використовує `defineChannelPluginEntry` або `definePluginEntry`</Check>
<Check>Усі імпорти використовують цільові шляхи `plugin-sdk/<subpath>`</Check>
<Check>Внутрішні імпорти використовують локальні модулі, а не самoімпорти SDK</Check>
<Check>Тести проходять (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` проходить (для Plugin-ів у репозиторії)</Check>

## Тестування бета-релізу

1. Стежте за тегами релізів GitHub у [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) і підпишіться через `Watch` > `Releases`. Бета-теги мають вигляд `v2026.3.N-beta.1`. Ви також можете ввімкнути сповіщення для офіційного акаунта OpenClaw у X [@openclaw](https://x.com/openclaw) для анонсів релізів.
2. Протестуйте свій Plugin на бета-тегу, щойно він з’явиться. Вікно до стабільного релізу зазвичай триває лише кілька годин.
3. Після тестування напишіть у треді вашого Plugin-а в каналі Discord `plugin-forum`: або `all good`, або що саме зламалося. Якщо у вас ще немає треду, створіть його.
4. Якщо щось зламалося, відкрийте або оновіть issue із заголовком `Beta blocker: <plugin-name> - <summary>` і застосуйте мітку `beta-blocker`. Додайте посилання на issue у свій тред.
5. Відкрийте PR до `main` із заголовком `fix(<plugin-id>): beta blocker - <summary>` і додайте посилання на issue як у PR, так і у вашому треді Discord. Учасники не можуть додавати мітки до PR, тому заголовок є сигналом на боці PR для мейнтейнерів і автоматизації. Блокери з PR будуть змерджені; блокери без нього можуть однаково потрапити в реліз. Мейнтейнери стежать за цими тредами під час бета-тестування.
6. Тиша означає, що все добре. Якщо ви пропустите вікно, ваш виправлений код, імовірно, потрапить до наступного циклу.

## Наступні кроки

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Створіть Plugin каналу обміну повідомленнями
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/uk/plugins/sdk-provider-plugins">
    Створіть Plugin провайдера моделей
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/uk/plugins/sdk-overview">
    Карта імпортів і довідник з API реєстрації
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/uk/plugins/sdk-runtime">
    TTS, пошук, subagent через api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/uk/plugins/sdk-testing">
    Утиліти та шаблони тестування
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/uk/plugins/manifest">
    Повний довідник зі схеми маніфесту
  </Card>
</CardGroup>

## Пов’язане

- [Plugin Architecture](/uk/plugins/architecture) — поглиблений огляд внутрішньої архітектури
- [SDK Overview](/uk/plugins/sdk-overview) — довідник по Plugin SDK
- [Manifest](/uk/plugins/manifest) — формат маніфесту Plugin-а
- [Channel Plugins](/uk/plugins/sdk-channel-plugins) — створення Plugin-ів каналів
- [Provider Plugins](/uk/plugins/sdk-provider-plugins) — створення Plugin-ів провайдерів
