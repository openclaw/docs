---
read_when:
    - Ви хочете створити новий Plugin для OpenClaw
    - Вам потрібен короткий посібник для швидкого старту з розробки Plugin
    - Ви додаєте до OpenClaw новий канал, провайдера, інструмент або іншу можливість
sidebarTitle: Getting Started
summary: Створіть свій перший Plugin для OpenClaw за кілька хвилин
title: Створення Plugin
x-i18n:
    generated_at: "2026-04-28T11:18:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 69411f22977b521adebcdaf1f6ac7592055aa800dd22f284bef4adef08027438
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugin-и розширюють OpenClaw новими можливостями: каналами, постачальниками моделей,
мовленням, транскрипцією в реальному часі, голосом у реальному часі, розумінням медіа, генерацією зображень,
генерацією відео, web fetch, web search, інструментами агентів або будь-якою
комбінацією.

Вам не потрібно додавати свій plugin до репозиторію OpenClaw. Опублікуйте в
[ClawHub](/uk/tools/clawhub) або npm, і користувачі встановлять його за допомогою
`openclaw plugins install <package-name>`. OpenClaw спершу пробує ClawHub і
автоматично повертається до npm.

## Передумови

- Node >= 22 і менеджер пакетів (npm або pnpm)
- Знайомство з TypeScript (ESM)
- Для plugin-ів у репозиторії: репозиторій клоновано і виконано `pnpm install`

## Який тип plugin-а?

<CardGroup cols={3}>
  <Card title="Channel plugin" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Підключіть OpenClaw до платформи обміну повідомленнями (Discord, IRC тощо)
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/uk/plugins/sdk-provider-plugins">
    Додайте постачальника моделей (LLM, проксі або власний endpoint)
  </Card>
  <Card title="Tool / hook plugin" icon="wrench" href="/uk/plugins/hooks">
    Зареєструйте інструменти агента, event hooks або сервіси — продовжуйте нижче
  </Card>
</CardGroup>

Для channel plugin, який не гарантовано буде встановлено під час запуску onboarding/setup,
використовуйте `createOptionalChannelSetupSurface(...)` з
`openclaw/plugin-sdk/channel-setup`. Він створює пару adapter + wizard для налаштування,
яка повідомляє про вимогу встановлення й fail closed під час реальних записів конфігурації,
доки plugin не встановлено.

## Швидкий старт: tool plugin

Цей покроковий посібник створює мінімальний plugin, який реєструє інструмент агента. Channel
і provider plugin-и мають окремі посібники за посиланнями вище.

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

    Кожному plugin-у потрібен manifest, навіть без конфігурації, і кожен plugin має
    свідомо оголошувати `activation.onStartup`. Інструменти, зареєстровані під час виконання, потребують
    імпорту під час запуску, тому цей приклад встановлює значення `true`. Дивіться
    [Manifest](/uk/plugins/manifest) для повної схеми. Канонічні фрагменти публікації ClawHub
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

    `definePluginEntry` призначений для plugin-ів, що не є каналами. Для каналів використовуйте
    `defineChannelPluginEntry` — дивіться [Channel Plugins](/uk/plugins/sdk-channel-plugins).
    Повні параметри entry point дивіться в [Entry Points](/uk/plugins/sdk-entrypoints).

  </Step>

  <Step title="Протестуйте й опублікуйте">

    **Зовнішні plugin-и:** перевірте й опублікуйте через ClawHub, потім установіть:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw також перевіряє ClawHub перед npm для простих специфікацій пакетів, як-от
    `@myorg/openclaw-my-plugin`.

    **Plugin-и в репозиторії:** розмістіть у дереві workspace bundled plugin-ів — їх буде виявлено автоматично.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Можливості Plugin

Один plugin може зареєструвати будь-яку кількість можливостей через об’єкт `api`:

| Можливість             | Метод реєстрації                              | Детальний посібник                                                                  |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Текстове inference (LLM)   | `api.registerProvider(...)`                      | [Provider Plugins](/uk/plugins/sdk-provider-plugins)                               |
| Backend inference для CLI  | `api.registerCliBackend(...)`                    | [CLI Backends](/uk/gateway/cli-backends)                                           |
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
| Plugin hooks           | `api.on(...)`                                    | [Plugin hooks](/uk/plugins/hooks)                                                  |
| Внутрішні event hooks   | `api.registerHook(...)`                          | [Entry Points](/uk/plugins/sdk-entrypoints)                                        |
| HTTP маршрути            | `api.registerHttpRoute(...)`                     | [Internals](/uk/plugins/architecture-internals#gateway-http-routes)                |
| Підкоманди CLI        | `api.registerCli(...)`                           | [Entry Points](/uk/plugins/sdk-entrypoints)                                        |

Повний registration API дивіться в [SDK Overview](/uk/plugins/sdk-overview#registration-api).

Bundled plugin-и можуть використовувати `api.registerAgentToolResultMiddleware(...)`, коли їм
потрібне асинхронне переписування результатів інструментів до того, як модель побачить вивід. Оголошуйте
цільові runtime-и в `contracts.agentToolResultMiddleware`, наприклад
`["pi", "codex"]`. Це довірений seam для bundled plugin-ів; зовнішнім
plugin-ам варто надавати перевагу звичайним OpenClaw plugin hooks, якщо OpenClaw не отримає
явну trust policy для цієї можливості.

Якщо ваш plugin реєструє власні gateway RPC methods, тримайте їх на
префіксі, специфічному для plugin-а. Основні admin namespaces (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди resolve to
`operator.admin`, навіть якщо plugin запитує вужчий scope.

Семантика hook guard, яку варто пам’ятати:

- `before_tool_call`: `{ block: true }` є terminal і зупиняє обробники з нижчим пріоритетом.
- `before_tool_call`: `{ block: false }` трактується як відсутність рішення.
- `before_tool_call`: `{ requireApproval: true }` призупиняє виконання агента й запитує схвалення користувача через exec approval overlay, кнопки Telegram, взаємодії Discord або команду `/approve` у будь-якому каналі.
- `before_install`: `{ block: true }` є terminal і зупиняє обробники з нижчим пріоритетом.
- `before_install`: `{ block: false }` трактується як відсутність рішення.
- `message_sending`: `{ cancel: true }` є terminal і зупиняє обробники з нижчим пріоритетом.
- `message_sending`: `{ cancel: false }` трактується як відсутність рішення.
- `message_received`: надавайте перевагу типізованому полю `threadId`, коли потрібна маршрутизація вхідних thread/topic. Залишайте `metadata` для додаткових даних, специфічних для каналу.
- `message_sending`: надавайте перевагу типізованим полям маршрутизації `replyToId` / `threadId` замість ключів metadata, специфічних для каналу.

Команда `/approve` обробляє як exec, так і plugin approvals з обмеженим fallback: коли exec approval id не знайдено, OpenClaw повторює той самий id через plugin approvals. Пересилання plugin approval можна налаштувати незалежно через `approvals.plugin` у конфігурації.

Якщо власній approval plumbing потрібно виявити той самий випадок обмеженого fallback,
надавайте перевагу `isApprovalNotFoundError` з `openclaw/plugin-sdk/error-runtime`
замість ручного зіставлення рядків закінчення строку дії approval.

Приклади й довідник hook дивіться в [Plugin hooks](/uk/plugins/hooks).

## Реєстрація інструментів агента

Інструменти — це типізовані функції, які може викликати LLM. Вони можуть бути обов’язковими (завжди
доступними) або optional (користувач вмикає сам):

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

Користувачі вмикають optional інструменти в конфігурації:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Назви інструментів не мають конфліктувати з core tools (конфлікти пропускаються)
- Інструменти з некоректними об’єктами реєстрації, зокрема без `parameters`, пропускаються й показуються в діагностиці plugin-а замість того, щоб ламати запуски агента
- Використовуйте `optional: true` для інструментів із побічними ефектами або додатковими вимогами до бінарних файлів
- Користувачі можуть увімкнути всі інструменти з plugin-а, додавши plugin id до `tools.allow`

## Конвенції імпорту

Завжди імпортуйте з цільових шляхів `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

Повну довідку subpath дивіться в [SDK Overview](/uk/plugins/sdk-overview).

У межах свого плагіна використовуйте локальні barrel-файли (`api.ts`, `runtime-api.ts`) для
внутрішніх імпортів — ніколи не імпортуйте власний плагін через його SDK-шлях.

Для плагінів провайдерів тримайте специфічні для провайдера допоміжні засоби в цих barrel-файлах кореня пакета,
якщо seam не є справді універсальним. Поточні вбудовані приклади:

- Anthropic: обгортки потоку Claude та допоміжні засоби `service_tier` / beta
- OpenAI: конструктори провайдерів, допоміжні засоби моделей за замовчуванням, realtime-провайдери
- OpenRouter: конструктор провайдера, а також допоміжні засоби онбордингу/конфігурації

Якщо допоміжний засіб корисний лише всередині одного вбудованого пакета провайдера, тримайте його на цьому
seam кореня пакета замість просування в `openclaw/plugin-sdk/*`.

Деякі згенеровані допоміжні seams `openclaw/plugin-sdk/<bundled-id>` усе ще існують для
супроводу вбудованих плагінів, коли вони мають відстежуване використання власником. Розглядайте їх як
зарезервовані поверхні, а не як типовий шаблон для нових сторонніх плагінів.

## Контрольний список перед поданням

<Check>**package.json** має коректні метадані `openclaw`</Check>
<Check>Маніфест **openclaw.plugin.json** присутній і валідний</Check>
<Check>Точка входу використовує `defineChannelPluginEntry` або `definePluginEntry`</Check>
<Check>Усі імпорти використовують сфокусовані шляхи `plugin-sdk/<subpath>`</Check>
<Check>Внутрішні імпорти використовують локальні модулі, а не SDK самоімпорти</Check>
<Check>Тести проходять (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` проходить (для плагінів у репозиторії)</Check>

## Тестування beta-релізу

1. Стежте за тегами релізів GitHub у [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) і підпишіться через `Watch` > `Releases`. Beta-теги мають вигляд `v2026.3.N-beta.1`. Ви також можете ввімкнути сповіщення для офіційного X-акаунта OpenClaw [@openclaw](https://x.com/openclaw), щоб отримувати оголошення про релізи.
2. Протестуйте свій плагін із beta-тегом одразу після його появи. Вікно до stable зазвичай становить лише кілька годин.
3. Після тестування напишіть у треді свого плагіна в Discord-каналі `plugin-forum`: або `all good`, або що зламалося. Якщо у вас ще немає треду, створіть його.
4. Якщо щось зламалося, відкрийте або оновіть issue з назвою `Beta blocker: <plugin-name> - <summary>` і застосуйте мітку `beta-blocker`. Додайте посилання на issue у свій тред.
5. Відкрийте PR до `main` з назвою `fix(<plugin-id>): beta blocker - <summary>` і додайте посилання на issue як у PR, так і у свій Discord-тред. Контриб’ютори не можуть ставити мітки на PR, тому назва є сигналом на боці PR для мейнтейнерів і автоматизації. Блокери з PR буде змарджено; блокери без нього можуть потрапити в реліз як є. Мейнтейнери стежать за цими тредами під час beta-тестування.
6. Мовчання означає зелений статус. Якщо ви пропустите вікно, ваш виправлення, найімовірніше, потрапить у наступний цикл.

## Наступні кроки

<CardGroup cols={2}>
  <Card title="Плагіни каналів" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Створіть плагін каналу обміну повідомленнями
  </Card>
  <Card title="Плагіни провайдерів" icon="cpu" href="/uk/plugins/sdk-provider-plugins">
    Створіть плагін провайдера моделей
  </Card>
  <Card title="Огляд SDK" icon="book-open" href="/uk/plugins/sdk-overview">
    Довідник import map і API реєстрації
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/uk/plugins/sdk-runtime">
    TTS, пошук, subagent через api.runtime
  </Card>
  <Card title="Тестування" icon="test-tubes" href="/uk/plugins/sdk-testing">
    Тестові утиліти та шаблони
  </Card>
  <Card title="Маніфест плагіна" icon="file-json" href="/uk/plugins/manifest">
    Повний довідник схеми маніфесту
  </Card>
</CardGroup>

## Пов’язане

- [Архітектура плагінів](/uk/plugins/architecture) — поглиблений огляд внутрішньої архітектури
- [Огляд SDK](/uk/plugins/sdk-overview) — довідник Plugin SDK
- [Маніфест](/uk/plugins/manifest) — формат маніфесту плагіна
- [Плагіни каналів](/uk/plugins/sdk-channel-plugins) — створення плагінів каналів
- [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins) — створення плагінів провайдерів
