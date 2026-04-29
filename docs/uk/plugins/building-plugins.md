---
read_when:
    - Ви хочете створити новий Plugin для OpenClaw
    - Вам потрібен короткий посібник із розробки Plugin
    - Ви додаєте новий канал, провайдера, інструмент або іншу можливість до OpenClaw
sidebarTitle: Getting Started
summary: Створіть свій перший OpenClaw Plugin за лічені хвилини
title: Створення Plugin
x-i18n:
    generated_at: "2026-04-29T05:39:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 321f8870d0ce3be8dece21b07815eda6859dcb00941d9181d913b95f3d74d230
    source_path: plugins/building-plugins.md
    workflow: 16
---

Плагіни розширюють OpenClaw новими можливостями: каналами, провайдерами моделей,
мовленням, транскрипцією в реальному часі, голосом у реальному часі, розумінням медіа, генерацією зображень, генерацією відео, отриманням вебданих, вебпошуком, інструментами агента або будь-яким
поєднанням.

Не потрібно додавати свій плагін до репозиторію OpenClaw. Опублікуйте у
[ClawHub](/uk/tools/clawhub), і користувачі встановлять його за допомогою
`openclaw plugins install <package-name>`. OpenClaw спершу пробує ClawHub і
автоматично повертається до npm для пакетів, які все ще використовують розповсюдження через npm.

## Передумови

- Node >= 22 і менеджер пакетів (npm або pnpm)
- Знайомство з TypeScript (ESM)
- Для плагінів у репозиторії: репозиторій клоновано й виконано `pnpm install`

## Який тип плагіна?

<CardGroup cols={3}>
  <Card title="Channel plugin" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Підключіть OpenClaw до платформи обміну повідомленнями (Discord, IRC тощо)
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/uk/plugins/sdk-provider-plugins">
    Додайте провайдера моделей (LLM, проксі або користувацьку кінцеву точку)
  </Card>
  <Card title="Tool / hook plugin" icon="wrench" href="/uk/plugins/hooks">
    Зареєструйте інструменти агента, хуки подій або сервіси — продовжуйте нижче
  </Card>
</CardGroup>

Для плагіна каналу, який не гарантовано буде встановлено під час онбордингу/налаштування,
використовуйте `createOptionalChannelSetupSurface(...)` з
`openclaw/plugin-sdk/channel-setup`. Він створює пару з адаптера налаштування та майстра,
яка повідомляє про вимогу встановлення й безпечно блокує реальні записи конфігурації,
доки плагін не буде встановлено.

## Швидкий старт: плагін інструментів

У цьому покроковому прикладі створюється мінімальний плагін, який реєструє інструмент агента. Для плагінів
каналів і провайдерів є окремі посібники, посилання на які наведено вище.

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

    Кожному плагіну потрібен маніфест, навіть без конфігурації, і кожен плагін має
    свідомо оголошувати `activation.onStartup`. Інструменти, зареєстровані під час виконання, потребують
    імпорту під час запуску, тому в цьому прикладі встановлено `true`. Повну схему див. у
    [Маніфесті](/uk/plugins/manifest). Канонічні фрагменти для публікації у ClawHub
    розміщені в `docs/snippets/plugin-publish/`.

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

    `definePluginEntry` призначений для плагінів, які не є каналами. Для каналів використовуйте
    `defineChannelPluginEntry` — див. [Плагіни каналів](/uk/plugins/sdk-channel-plugins).
    Повний перелік параметрів точки входу див. у [Точках входу](/uk/plugins/sdk-entrypoints).

  </Step>

  <Step title="Test and publish">

    **Зовнішні плагіни:** перевірте й опублікуйте через ClawHub, потім установіть:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw також перевіряє ClawHub перед npm для простих специфікацій пакетів, як-от
    `@myorg/openclaw-my-plugin`; npm залишається резервним варіантом для пакетів, які
    ще не мігрували до ClawHub.

    **Плагіни в репозиторії:** розмістіть у дереві робочого простору вбудованих плагінів — їх буде виявлено автоматично.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Можливості Plugin

Один плагін може реєструвати будь-яку кількість можливостей через об'єкт `api`:

| Можливість             | Метод реєстрації                              | Докладний посібник                                                                  |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Текстовий інференс (LLM)   | `api.registerProvider(...)`                      | [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins)                               |
| Бекенд інференсу CLI  | `api.registerCliBackend(...)`                    | [Бекенди CLI](/uk/gateway/cli-backends)                                           |
| Канал / обмін повідомленнями    | `api.registerChannel(...)`                       | [Плагіни каналів](/uk/plugins/sdk-channel-plugins)                                 |
| Мовлення (TTS/STT)       | `api.registerSpeechProvider(...)`                | [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Транскрипція в реальному часі | `api.registerRealtimeTranscriptionProvider(...)` | [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Голос у реальному часі         | `api.registerRealtimeVoiceProvider(...)`         | [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Розуміння медіа    | `api.registerMediaUnderstandingProvider(...)`    | [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація зображень       | `api.registerImageGenerationProvider(...)`       | [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація музики       | `api.registerMusicGenerationProvider(...)`       | [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація відео       | `api.registerVideoGenerationProvider(...)`       | [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Отримання вебданих              | `api.registerWebFetchProvider(...)`              | [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Вебпошук             | `api.registerWebSearchProvider(...)`             | [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Проміжне ПЗ результатів інструментів | `api.registerAgentToolResultMiddleware(...)`     | [Огляд SDK](/uk/plugins/sdk-overview#registration-api)                          |
| Інструменти агента            | `api.registerTool(...)`                          | Нижче                                                                           |
| Користувацькі команди        | `api.registerCommand(...)`                       | [Точки входу](/uk/plugins/sdk-entrypoints)                                        |
| Хуки Plugin           | `api.on(...)`                                    | [Хуки Plugin](/uk/plugins/hooks)                                                  |
| Внутрішні хуки подій   | `api.registerHook(...)`                          | [Точки входу](/uk/plugins/sdk-entrypoints)                                        |
| HTTP-маршрути            | `api.registerHttpRoute(...)`                     | [Внутрішня архітектура](/uk/plugins/architecture-internals#gateway-http-routes)                |
| Підкоманди CLI        | `api.registerCli(...)`                           | [Точки входу](/uk/plugins/sdk-entrypoints)                                        |

Повний API реєстрації див. в [Огляді SDK](/uk/plugins/sdk-overview#registration-api).

Вбудовані плагіни можуть використовувати `api.registerAgentToolResultMiddleware(...)`, коли їм
потрібно асинхронно переписувати результат інструмента до того, як модель побачить вивід. Оголосіть
цільові середовища виконання в `contracts.agentToolResultMiddleware`, наприклад
`["pi", "codex"]`. Це довірена точка інтеграції для вбудованих плагінів; зовнішнім
плагінам слід надавати перевагу звичайним хукам плагінів OpenClaw, доки в OpenClaw не з'явиться
явна політика довіри для цієї можливості.

Якщо ваш плагін реєструє користувацькі RPC-методи Gateway, тримайте їх за
префіксом, специфічним для плагіна. Простори імен адміністрування ядра (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди розв'язуються до
`operator.admin`, навіть якщо плагін запитує вужчу область дії.

Семантика захисту хуків, яку варто пам'ятати:

- `before_tool_call`: `{ block: true }` є термінальним рішенням і зупиняє обробники з нижчим пріоритетом.
- `before_tool_call`: `{ block: false }` розглядається як відсутність рішення.
- `before_tool_call`: `{ requireApproval: true }` призупиняє виконання агента й запитує в користувача підтвердження через оверлей підтвердження виконання, кнопки Telegram, взаємодії Discord або команду `/approve` у будь-якому каналі.
- `before_install`: `{ block: true }` є термінальним рішенням і зупиняє обробники з нижчим пріоритетом.
- `before_install`: `{ block: false }` розглядається як відсутність рішення.
- `message_sending`: `{ cancel: true }` є термінальним рішенням і зупиняє обробники з нижчим пріоритетом.
- `message_sending`: `{ cancel: false }` розглядається як відсутність рішення.
- `message_received`: надавайте перевагу типізованому полю `threadId`, коли потрібна маршрутизація вхідних гілок/тем. Залишайте `metadata` для специфічних для каналу додаткових даних.
- `message_sending`: надавайте перевагу типізованим полям маршрутизації `replyToId` / `threadId` замість специфічних для каналу ключів метаданих.

Команда `/approve` обробляє як підтвердження виконання, так і підтвердження плагінів з обмеженим резервним пошуком: коли ідентифікатор підтвердження виконання не знайдено, OpenClaw повторно пробує той самий ідентифікатор серед підтверджень плагінів. Пересилання підтверджень плагінів можна налаштувати незалежно через `approvals.plugin` у конфігурації.

Якщо користувацький механізм підтверджень має виявляти той самий обмежений випадок резервного пошуку,
надавайте перевагу `isApprovalNotFoundError` з `openclaw/plugin-sdk/error-runtime`
замість ручного зіставлення рядків про закінчення строку дії підтвердження.

Приклади та довідку щодо хуків див. у [Хуках Plugin](/uk/plugins/hooks).

## Реєстрація інструментів агента

Інструменти — це типізовані функції, які може викликати LLM. Вони можуть бути обов'язковими (завжди
доступними) або необов'язковими (користувач вмикає за бажанням):

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

Користувачі вмикають необов'язкові інструменти в конфігурації:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Імена інструментів не повинні конфліктувати з основними інструментами (конфлікти пропускаються)
- Інструменти з некоректно сформованими об'єктами реєстрації, зокрема без `parameters`, пропускаються й повідомляються в діагностиці плагіна замість того, щоб ламати запуски агента
- Використовуйте `optional: true` для інструментів із побічними ефектами або додатковими вимогами до бінарних файлів
- Користувачі можуть увімкнути всі інструменти з плагіна, додавши ідентифікатор плагіна до `tools.allow`

## Угоди імпорту

Завжди імпортуйте зі сфокусованих шляхів `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

Повний довідник підшляхів див. у [огляді SDK](/uk/plugins/sdk-overview).

У межах вашого plugin використовуйте локальні barrel-файли (`api.ts`, `runtime-api.ts`) для
внутрішніх імпортів — ніколи не імпортуйте власний plugin через його шлях SDK.

Для плагінів провайдерів тримайте специфічні для провайдера допоміжні функції в цих barrel-файлах кореня пакета,
якщо seam не є справді універсальним. Поточні вбудовані приклади:

- Anthropic: обгортки потоків Claude і допоміжні функції `service_tier` / beta
- OpenAI: побудовники провайдерів, допоміжні функції моделей за замовчуванням, realtime-провайдери
- OpenRouter: побудовник провайдера плюс допоміжні функції onboarding/config

Якщо допоміжна функція корисна лише всередині одного вбудованого пакета провайдера, тримайте її на цьому
seam кореня пакета замість просування до `openclaw/plugin-sdk/*`.

Деякі згенеровані допоміжні seam `openclaw/plugin-sdk/<bundled-id>` досі існують для
обслуговування вбудованих плагінів, коли вони мають відстежене використання власником. Розглядайте їх як
зарезервовані поверхні, а не як типовий шаблон для нових сторонніх плагінів.

## Контрольний список перед надсиланням

<Check>**package.json** має коректні метадані `openclaw`</Check>
<Check>Маніфест **openclaw.plugin.json** присутній і валідний</Check>
<Check>Точка входу використовує `defineChannelPluginEntry` або `definePluginEntry`</Check>
<Check>Усі імпорти використовують сфокусовані шляхи `plugin-sdk/<subpath>`</Check>
<Check>Внутрішні імпорти використовують локальні модулі, а не самоімпорти SDK</Check>
<Check>Тести проходять (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` проходить (плагіни в репозиторії)</Check>

## Тестування beta-релізу

1. Стежте за тегами релізів GitHub на [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) і підпишіться через `Watch` > `Releases`. Beta-теги мають вигляд `v2026.3.N-beta.1`. Ви також можете ввімкнути сповіщення для офіційного X-акаунта OpenClaw [@openclaw](https://x.com/openclaw), щоб отримувати оголошення про релізи.
2. Протестуйте свій plugin із beta-тегом, щойно він з’явиться. Вікно до stable зазвичай триває лише кілька годин.
3. Напишіть у гілці вашого plugin у Discord-каналі `plugin-forum` після тестування: або `all good`, або що саме зламалося. Якщо у вас ще немає гілки, створіть її.
4. Якщо щось зламалося, відкрийте або оновіть issue з назвою `Beta blocker: <plugin-name> - <summary>` і застосуйте мітку `beta-blocker`. Додайте посилання на issue у свою гілку.
5. Відкрийте PR до `main` з назвою `fix(<plugin-id>): beta blocker - <summary>` і додайте посилання на issue як у PR, так і у вашу Discord-гілку. Учасники не можуть позначати PR мітками, тому назва є сигналом на боці PR для maintainers і автоматизації. Блокери з PR будуть об’єднані; блокери без PR можуть усе одно потрапити в реліз. Maintainers стежать за цими гілками під час beta-тестування.
6. Мовчання означає зелений статус. Якщо ви пропустите це вікно, ваше виправлення, ймовірно, потрапить у наступний цикл.

## Наступні кроки

<CardGroup cols={2}>
  <Card title="Канальні плагіни" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Створіть plugin каналу повідомлень
  </Card>
  <Card title="Плагіни провайдерів" icon="cpu" href="/uk/plugins/sdk-provider-plugins">
    Створіть plugin провайдера моделей
  </Card>
  <Card title="Огляд SDK" icon="book-open" href="/uk/plugins/sdk-overview">
    Довідник карти імпортів і API реєстрації
  </Card>
  <Card title="Допоміжні функції runtime" icon="settings" href="/uk/plugins/sdk-runtime">
    TTS, пошук, subagent через api.runtime
  </Card>
  <Card title="Тестування" icon="test-tubes" href="/uk/plugins/sdk-testing">
    Тестові утиліти та шаблони
  </Card>
  <Card title="Маніфест Plugin" icon="file-json" href="/uk/plugins/manifest">
    Повний довідник схеми маніфесту
  </Card>
</CardGroup>

## Пов’язане

- [Архітектура Plugin](/uk/plugins/architecture) — поглиблений огляд внутрішньої архітектури
- [Огляд SDK](/uk/plugins/sdk-overview) — довідник Plugin SDK
- [Маніфест](/uk/plugins/manifest) — формат маніфесту plugin
- [Канальні плагіни](/uk/plugins/sdk-channel-plugins) — створення плагінів каналів
- [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins) — створення плагінів провайдерів
