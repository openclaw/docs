---
read_when:
    - Ви хочете створити новий Plugin OpenClaw.
    - Вам потрібен швидкий старт для розробки Plugin.
    - Ви додаєте до OpenClaw новий канал, провайдера, інструмент або іншу можливість.
sidebarTitle: Getting Started
summary: Створіть свій перший Plugin OpenClaw за лічені хвилини
title: Створення Plugin
x-i18n:
    generated_at: "2026-04-27T12:52:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7bdae7b858a04f8c8b65be8b909aba528fc7ae0781856161d7b09e9bed8442e3
    source_path: plugins/building-plugins.md
    workflow: 15
---

Плагіни розширюють OpenClaw новими можливостями: канали, провайдери моделей,
мовлення, транскрипція в реальному часі, голос у реальному часі, розуміння
медіа, генерація зображень, генерація відео, web fetch, web search, інструменти agent або будь-яка
комбінація з цього.

Вам не потрібно додавати свій плагін до репозиторію OpenClaw. Опублікуйте його в
[ClawHub](/uk/tools/clawhub) або npm, і користувачі встановлюватимуть його через
`openclaw plugins install <package-name>`. OpenClaw спочатку намагається знайти пакет у ClawHub, а
потім автоматично переходить до npm.

## Передумови

- Node >= 22 і менеджер пакетів (npm або pnpm)
- Знайомство з TypeScript (ESM)
- Для плагінів у репозиторії: клонований репозиторій і виконаний `pnpm install`

## Який тип плагіна?

<CardGroup cols={3}>
  <Card title="Плагін каналу" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Підключіть OpenClaw до платформи обміну повідомленнями (Discord, IRC тощо)
  </Card>
  <Card title="Плагін провайдера" icon="cpu" href="/uk/plugins/sdk-provider-plugins">
    Додайте провайдера моделі (LLM, proxy або власний endpoint)
  </Card>
  <Card title="Плагін інструмента / хука" icon="wrench" href="/uk/plugins/hooks">
    Зареєструйте інструменти agent, хуки подій або сервіси — продовження нижче
  </Card>
</CardGroup>

Для плагіна каналу, який не гарантовано буде встановлено, коли запускається onboarding/setup,
використовуйте `createOptionalChannelSetupSurface(...)` з
`openclaw/plugin-sdk/channel-setup`. Він створює адаптер setup + пару wizard,
яка повідомляє про вимогу встановлення й безпечно завершує роботу під час реального запису конфігурації,
доки плагін не буде встановлено.

## Швидкий старт: плагін інструмента

Цей покроковий приклад створює мінімальний плагін, який реєструє інструмент agent. Для плагінів каналів
і провайдерів існують окремі посібники, посилання на які наведено вище.

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

    Кожному плагіну потрібен маніфест, навіть якщо конфігурації немає. Див.
    [Маніфест](/uk/plugins/manifest), щоб переглянути повну схему. Канонічні фрагменти
    публікації в ClawHub розміщені в `docs/snippets/plugin-publish/`.

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

    `definePluginEntry` призначений для плагінів, які не є каналами. Для каналів використовуйте
    `defineChannelPluginEntry` — див. [Плагіни каналів](/uk/plugins/sdk-channel-plugins).
    Повний перелік параметрів точки входу див. у [Точки входу](/uk/plugins/sdk-entrypoints).

  </Step>

  <Step title="Протестуйте й опублікуйте">

    **Зовнішні плагіни:** перевірте й опублікуйте через ClawHub, а потім установіть:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw також перевіряє ClawHub перед npm для звичайних специфікацій пакетів на кшталт
    `@myorg/openclaw-my-plugin`.

    **Плагіни в репозиторії:** розмістіть їх у дереві робочого простору вбудованих плагінів — вони будуть виявлені автоматично.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Можливості плагінів

Один плагін може реєструвати будь-яку кількість можливостей через об’єкт `api`:

| Можливість             | Метод реєстрації                              | Детальний посібник                                                             |
| ---------------------- | --------------------------------------------- | ------------------------------------------------------------------------------ |
| Текстовий inference (LLM)   | `api.registerProvider(...)`                      | [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins)                               |
| Бекенд inference CLI  | `api.registerCliBackend(...)`                    | [CLI Backends](/uk/gateway/cli-backends)                                           |
| Канал / обмін повідомленнями    | `api.registerChannel(...)`                       | [Плагіни каналів](/uk/plugins/sdk-channel-plugins)                                 |
| Мовлення (TTS/STT)       | `api.registerSpeechProvider(...)`                | [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Транскрипція в реальному часі | `api.registerRealtimeTranscriptionProvider(...)` | [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Голос у реальному часі         | `api.registerRealtimeVoiceProvider(...)`         | [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Розуміння медіа    | `api.registerMediaUnderstandingProvider(...)`    | [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація зображень       | `api.registerImageGenerationProvider(...)`       | [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація музики       | `api.registerMusicGenerationProvider(...)`       | [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація відео       | `api.registerVideoGenerationProvider(...)`       | [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web fetch              | `api.registerWebFetchProvider(...)`              | [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web search             | `api.registerWebSearchProvider(...)`             | [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Проміжний шар результатів інструментів | `api.registerAgentToolResultMiddleware(...)`     | [Огляд SDK](/uk/plugins/sdk-overview#registration-api)                          |
| Інструменти agent            | `api.registerTool(...)`                          | Нижче                                                                           |
| Власні команди        | `api.registerCommand(...)`                       | [Точки входу](/uk/plugins/sdk-entrypoints)                                        |
| Хуки плагіна           | `api.on(...)`                                    | [Хуки плагіна](/uk/plugins/hooks)                                                  |
| Внутрішні хуки подій   | `api.registerHook(...)`                          | [Точки входу](/uk/plugins/sdk-entrypoints)                                        |
| HTTP-маршрути            | `api.registerHttpRoute(...)`                     | [Внутрішні деталі](/uk/plugins/architecture-internals#gateway-http-routes)                |
| Підкоманди CLI        | `api.registerCli(...)`                           | [Точки входу](/uk/plugins/sdk-entrypoints)                                        |

Повний API реєстрації див. в [Огляді SDK](/uk/plugins/sdk-overview#registration-api).

Вбудовані плагіни можуть використовувати `api.registerAgentToolResultMiddleware(...)`, коли
їм потрібне асинхронне переписування результату інструмента до того, як модель побачить вивід. Оголошуйте
цільові середовища виконання в `contracts.agentToolResultMiddleware`, наприклад
`["pi", "codex"]`. Це seam для довірених вбудованих плагінів; зовнішні
плагіни мають надавати перевагу звичайним хукам плагінів OpenClaw, якщо тільки в OpenClaw не з’явиться
явна політика довіри для цієї можливості.

Якщо ваш плагін реєструє власні RPC-методи gateway, залишайте їх у
префіксі, специфічному для плагіна. Простори імен базового адміністрування (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди розв’язуються до
`operator.admin`, навіть якщо плагін запитує вужчий обсяг.

Семантика захисту хуків, про яку варто пам’ятати:

- `before_tool_call`: `{ block: true }` є термінальним і зупиняє обробники з нижчим пріоритетом.
- `before_tool_call`: `{ block: false }` трактується як відсутність рішення.
- `before_tool_call`: `{ requireApproval: true }` призупиняє виконання agent і запитує у користувача схвалення через overlay схвалення exec, кнопки Telegram, взаємодії Discord або команду `/approve` у будь-якому каналі.
- `before_install`: `{ block: true }` є термінальним і зупиняє обробники з нижчим пріоритетом.
- `before_install`: `{ block: false }` трактується як відсутність рішення.
- `message_sending`: `{ cancel: true }` є термінальним і зупиняє обробники з нижчим пріоритетом.
- `message_sending`: `{ cancel: false }` трактується як відсутність рішення.
- `message_received`: надавайте перевагу типізованому полю `threadId`, коли вам потрібна маршрутизація вхідних thread/topic. Зберігайте `metadata` для специфічних для каналу додаткових даних.
- `message_sending`: надавайте перевагу типізованим полям маршрутизації `replyToId` / `threadId` замість специфічних для каналу ключів metadata.

Команда `/approve` обробляє як схвалення exec, так і схвалення плагінів з обмеженим резервним механізмом: коли id схвалення exec не знайдено, OpenClaw повторно перевіряє той самий id через схвалення плагінів. Переадресацію схвалень плагінів можна налаштувати окремо через `approvals.plugin` у конфігурації.

Якщо власна логіка схвалення має виявити той самий випадок обмеженого резервного переходу,
використовуйте `isApprovalNotFoundError` з `openclaw/plugin-sdk/error-runtime`
замість ручного зіставлення рядків завершення строку дії схвалення.

Приклади та довідник хуків див. у [Хуки плагіна](/uk/plugins/hooks).

## Реєстрація інструментів agent

Інструменти — це типізовані функції, які може викликати LLM. Вони можуть бути
обов’язковими (завжди доступними) або необов’язковими (за згодою користувача):

```typescript
register(api) {
  // Обов’язковий інструмент — завжди доступний
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Необов’язковий інструмент — користувач має додати його до списку дозволів
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

- Назви інструментів не повинні конфліктувати з базовими інструментами (конфлікти пропускаються)
- Інструменти з некоректними об’єктами реєстрації, зокрема без `parameters`, пропускаються й повідомляються в діагностиці плагіна замість того, щоб ламати виконання agent
- Використовуйте `optional: true` для інструментів із побічними ефектами або додатковими вимогами до двійкових файлів
- Користувачі можуть увімкнути всі інструменти з плагіна, додавши id плагіна до `tools.allow`

## Угоди щодо імпортів

Завжди імпортуйте з цільових шляхів `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Неправильно: монолітний корінь (застаріло, буде видалено)
import { ... } from "openclaw/plugin-sdk";
```

Повний довідник підшляхів див. в [Огляді SDK](/uk/plugins/sdk-overview).

Усередині свого плагіна використовуйте локальні barrel-файли (`api.ts`, `runtime-api.ts`) для
внутрішніх імпортів — ніколи не імпортуйте власний плагін через його шлях SDK.

Для плагінів провайдерів зберігайте допоміжні засоби, специфічні для провайдера, у цих
barrel-файлах кореня пакета, якщо тільки seam не є справді загальним. Поточні
приклади вбудованих:

- Anthropic: обгортки потоків Claude і допоміжні засоби `service_tier` / beta
- OpenAI: конструктори провайдерів, допоміжні засоби типових моделей, провайдери realtime
- OpenRouter: конструктор провайдера плюс допоміжні засоби onboarding/config

Якщо допоміжний засіб корисний лише всередині одного вбудованого пакета провайдера, залишайте його на цьому
seam кореня пакета замість того, щоб переносити його в `openclaw/plugin-sdk/*`.

Деякі згенеровані seam-допоміжні засоби `openclaw/plugin-sdk/<bundled-id>` все ще існують для
супроводу вбудованих плагінів і сумісності, наприклад
`plugin-sdk/feishu-setup` або `plugin-sdk/zalo-setup`. Ставтеся до них як до зарезервованих
поверхонь, а не як до типової моделі для нових сторонніх плагінів.

## Контрольний список перед поданням

<Check>**package.json** має правильні метадані `openclaw`</Check>
<Check>Маніфест **openclaw.plugin.json** присутній і коректний</Check>
<Check>Точка входу використовує `defineChannelPluginEntry` або `definePluginEntry`</Check>
<Check>Усі імпорти використовують цільові шляхи `plugin-sdk/<subpath>`</Check>
<Check>Внутрішні імпорти використовують локальні модулі, а не self-import через SDK</Check>
<Check>Тести проходять (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` проходить (плагіни в репозиторії)</Check>

## Тестування beta-випусків

1. Стежте за тегами випусків GitHub у [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) і підпишіться через `Watch` > `Releases`. Beta-теги мають вигляд `v2026.3.N-beta.1`. Ви також можете ввімкнути сповіщення для офіційного акаунта OpenClaw у X [@openclaw](https://x.com/openclaw), щоб отримувати оголошення про випуски.
2. Перевірте свій плагін на beta-тегу щойно він з’явиться. Вікно перед stable зазвичай триває лише кілька годин.
3. Після тестування напишіть у гілці свого плагіна в каналі Discord `plugin-forum`: або `all good`, або що саме зламалося. Якщо у вас ще немає гілки, створіть її.
4. Якщо щось зламалося, відкрийте або оновіть issue із заголовком `Beta blocker: <plugin-name> - <summary>` і застосуйте мітку `beta-blocker`. Додайте посилання на issue у свою гілку.
5. Відкрийте PR до `main` із заголовком `fix(<plugin-id>): beta blocker - <summary>` і додайте посилання на issue і в PR, і у свою гілку Discord. Учасники не можуть призначати мітки PR, тому заголовок є сигналом на боці PR для супровідників та автоматизації. Блокери з PR будуть злиті; блокери без нього можуть усе одно потрапити у випуск. Супровідники стежать за цими гілками під час beta-тестування.
6. Відсутність повідомлень означає, що все добре. Якщо ви пропустили вікно, ваше виправлення, найімовірніше, потрапить до наступного циклу.

## Наступні кроки

<CardGroup cols={2}>
  <Card title="Плагіни каналів" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Створіть плагін каналу обміну повідомленнями
  </Card>
  <Card title="Плагіни провайдерів" icon="cpu" href="/uk/plugins/sdk-provider-plugins">
    Створіть плагін провайдера моделей
  </Card>
  <Card title="Огляд SDK" icon="book-open" href="/uk/plugins/sdk-overview">
    Карта імпортів і довідник API реєстрації
  </Card>
  <Card title="Допоміжні засоби середовища виконання" icon="settings" href="/uk/plugins/sdk-runtime">
    TTS, пошук, subagent через api.runtime
  </Card>
  <Card title="Тестування" icon="test-tubes" href="/uk/plugins/sdk-testing">
    Утиліти та шаблони тестування
  </Card>
  <Card title="Маніфест плагіна" icon="file-json" href="/uk/plugins/manifest">
    Повний довідник схеми маніфесту
  </Card>
</CardGroup>

## Пов’язано

- [Архітектура плагінів](/uk/plugins/architecture) — поглиблений огляд внутрішньої архітектури
- [Огляд SDK](/uk/plugins/sdk-overview) — довідник SDK Plugin
- [Маніфест](/uk/plugins/manifest) — формат маніфесту плагіна
- [Плагіни каналів](/uk/plugins/sdk-channel-plugins) — створення плагінів каналів
- [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins) — створення плагінів провайдерів
