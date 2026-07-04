---
doc-schema-version: 1
read_when:
    - Ви хочете створити новий Plugin OpenClaw
    - Вам потрібен короткий стартовий посібник із розробки Plugin
    - Ви обираєте між документацією каналу, провайдера, бекенду CLI, інструмента або hook
sidebarTitle: Getting Started
summary: Створіть свій перший Plugin OpenClaw за лічені хвилини
title: Створення Pluginів
x-i18n:
    generated_at: "2026-07-04T15:33:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e4bceff518e0b2b3b06573a96edb2af65bbe8662d049323045cd1c80fc6f328f
    source_path: plugins/building-plugins.md
    workflow: 16
---

Плагіни розширюють OpenClaw без змін у ядрі. Плагін може додати канал
обміну повідомленнями, постачальника моделей, локальний CLI-бекенд, інструмент
агента, hook, постачальника медіа або іншу можливість, що належить плагіну.

Вам не потрібно додавати зовнішній плагін до репозиторію OpenClaw. Опублікуйте
пакет у [ClawHub](/uk/clawhub), і користувачі встановлять його за допомогою:

```bash
openclaw plugins install clawhub:<package-name>
```

Специфікації пакетів без префікса все ще встановлюються з npm під час
перехідного запуску. Використовуйте префікс `clawhub:`, коли хочете розв’язання
через ClawHub.

## Вимоги

- Використовуйте Node 22.19+, Node 23.11+ або Node 24+ і менеджер пакетів, наприклад `npm` або `pnpm`.
- Знайтеся на TypeScript ESM-модулях.
- Для роботи з вбудованим у репозиторій плагіном клонуйте репозиторій і виконайте `pnpm install`.
  Розробка плагінів із вихідного checkout підтримує лише pnpm, оскільки OpenClaw завантажує вбудовані
  плагіни з пакетів робочого простору `extensions/*`.

## Виберіть форму плагіна

<CardGroup cols={2}>
  <Card title="Channel plugin" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Підключіть OpenClaw до платформи обміну повідомленнями.
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/uk/plugins/sdk-provider-plugins">
    Додайте постачальника моделей, медіа, пошуку, fetch, мовлення або realtime.
  </Card>
  <Card title="CLI backend plugin" icon="terminal" href="/uk/plugins/cli-backend-plugins">
    Запускайте локальний AI CLI через резервний вибір моделей OpenClaw.
  </Card>
  <Card title="Tool plugin" icon="wrench" href="/uk/plugins/tool-plugins">
    Реєструйте інструменти агента.
  </Card>
</CardGroup>

## Швидкий старт

Створіть мінімальний плагін інструмента, зареєструвавши один обов’язковий
інструмент агента. Це найкоротша корисна форма плагіна, яка показує пакет,
маніфест, точку входу та локальне підтвердження.

<Steps>
  <Step title="Create package metadata">
    <CodeGroup>

```json package.json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "typebox": "1.1.39"
  },
  "peerDependencies": {
    "openclaw": ">=2026.3.24-beta.2"
  },
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

    Опубліковані зовнішні плагіни мають спрямовувати runtime-точки входу на
    зібрані JavaScript-файли. Повний контракт точок входу див. у
    [точках входу SDK](/uk/plugins/sdk-entrypoints).

    Кожному плагіну потрібен маніфест, навіть якщо він не має конфігурації.
    Runtime-інструменти мають бути вказані в `contracts.tools`, щоб OpenClaw міг
    виявляти належність без жадібного завантаження runtime кожного плагіна.
    Задавайте `activation.onStartup` свідомо. Цей приклад запускається під час
    запуску Gateway.

    Довірені хостом поверхні плагінів також обмежуються маніфестом і потребують
    явного ввімкнення для встановлених плагінів. Якщо встановлений плагін
    реєструє `api.registerAgentToolResultMiddleware(...)`, оголосіть кожен
    цільовий runtime у `contracts.agentToolResultMiddleware`. Якщо він реєструє
    `api.registerTrustedToolPolicy(...)`, оголосіть кожен id політики в
    `contracts.trustedToolPolicies`. Ці оголошення узгоджують перевірку під час
    встановлення з runtime-реєстрацією.

    Для кожного поля маніфесту див. [маніфест Plugin](/uk/plugins/manifest).

  </Step>

  <Step title="Register the tool">
    ```typescript index.ts
    import { Type } from "typebox";
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Echo one input value",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return {
              content: [{ type: "text", text: `Got: ${params.input}` }],
            };
          },
        });
      },
    });
    ```

    Використовуйте `definePluginEntry` для плагінів, які не є каналами.
    Канальні плагіни використовують `defineChannelPluginEntry`.

  </Step>

  <Step title="Test the runtime">
    Для встановленого або зовнішнього плагіна перевірте завантажений runtime:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Якщо плагін реєструє CLI-команду, також запустіть цю команду. Наприклад,
    demo-команда має мати підтвердження виконання, таке як
    `openclaw demo-plugin ping`.

    Для вбудованого плагіна в цьому репозиторії OpenClaw виявляє пакети
    плагінів із вихідного checkout у робочому просторі `extensions/*`. Запустіть
    найближчий цільовий тест:

    ```bash
    pnpm test -- extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Test the package install">
    Перед публікацією готового до пакування плагіна протестуйте ту саму форму
    встановлення, яку отримають користувачі. Спочатку додайте крок збирання,
    спрямуйте runtime-точки входу, як-от `openclaw.extensions`, на зібраний
    JavaScript на кшталт `./dist/index.js`, і переконайтеся, що `npm pack`
    містить цей вивід `dist/`. Вихідні TypeScript-точки входу призначені лише
    для вихідних checkout і локальних шляхів розробки.

    Потім запакуйте плагін і встановіть tarball через `npm-pack:`:

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:` використовує керований OpenClaw npm-проєкт для кожного плагіна,
    тому виявляє помилки runtime-залежностей, які може приховати тестування
    вихідного checkout. Це підтверджує форму пакета й залежностей, а не офіційну
    довіру, пов’язану з каталогом. Runtime-імпорти мають бути в `dependencies`
    або `optionalDependencies`; залежності, залишені лише в `devDependencies`,
    не буде встановлено для керованого runtime-проєкту.

    Не використовуйте встановлення з необробленого архіву або шляху як остаточне
    підтвердження для офіційної чи привілейованої поведінки плагіна. Необроблені
    джерела корисні для локального налагодження, але вони не підтверджують той
    самий шлях залежностей, що встановлення з npm або ClawHub. Якщо ваш плагін
    покладається на довірений офіційний статус плагіна, додайте друге
    підтвердження через офіційне встановлення на основі каталогу або шлях
    опублікованого пакета, який фіксує офіційну довіру. Деталі щодо кореня
    встановлення й володіння залежностями див. у
    [розв’язанні залежностей Plugin](/uk/plugins/dependency-resolution).

  </Step>

  <Step title="Publish">
    Перевірте пакет перед публікацією:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    Канонічні фрагменти ClawHub розміщені в `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Install">
    Встановіть опублікований пакет через ClawHub:

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## Реєстрація інструментів

Інструменти можуть бути обов’язковими або необов’язковими. Обов’язкові
інструменти завжди доступні, коли плагін увімкнено. Необов’язкові інструменти
потребують явного вибору користувача.

```typescript
register(api) {
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

Кожен інструмент, зареєстрований через `api.registerTool(...)`, також має бути
оголошений у маніфесті плагіна:

```json
{
  "contracts": {
    "tools": ["workflow_tool"]
  },
  "toolMetadata": {
    "workflow_tool": {
      "optional": true
    }
  }
}
```

Користувачі вмикають їх через `tools.allow`:

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for all tools from one plugin
}
```

Необов’язкові інструменти визначають, чи буде інструмент відкрито для моделі.
Використовуйте [запити дозволів плагіна](/uk/plugins/plugin-permission-requests),
коли інструмент або hook має попросити схвалення після того, як модель вибере
його, але до запуску дії.

Використовуйте необов’язкові інструменти для побічних ефектів, незвичних
бінарних файлів або можливостей, які не слід відкривати за замовчуванням.
Назви інструментів не мають конфліктувати з інструментами ядра; конфлікти
пропускаються й повідомляються в діагностиці плагінів. Некоректні реєстрації,
зокрема дескриптори інструментів без `parameters`, пропускаються й
повідомляються так само. Зареєстровані інструменти є типізованими функціями,
які модель може викликати після проходження перевірок політик і allowlist.

Фабрики інструментів отримують runtime-контекстний об’єкт. Використовуйте
`ctx.activeModel`, коли інструменту потрібно журналювати, показувати або
адаптуватися до активної моделі для поточного ходу. Об’єкт може містити
`provider`, `modelId` і `modelRef`. Сприймайте його як інформаційні
runtime-метадані, а не як межу безпеки проти локального оператора,
встановленого коду плагіна або зміненого runtime OpenClaw. Чутливі локальні
інструменти все одно мають вимагати явного opt-in плагіна або оператора й
завершуватися із закритою відмовою, коли метадані активної моделі відсутні або
непридатні.

Маніфест оголошує володіння та виявлення; виконання все одно викликає живу
зареєстровану реалізацію інструмента. Тримайте `toolMetadata.<tool>.optional: true`
узгодженим із `api.registerTool(..., { optional: true })`, щоб OpenClaw міг
уникати завантаження runtime цього плагіна, доки інструмент не буде явно
додано до allowlist.

## Угоди щодо імпортів

Імпортуйте з вузьких підшляхів SDK:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

Не імпортуйте із застарілого кореневого barrel:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

У межах пакета вашого плагіна використовуйте локальні barrel-файли, як-от
`api.ts` і `runtime-api.ts`, для внутрішніх імпортів. Не імпортуйте власний
плагін через шлях SDK. Допоміжні функції, специфічні для постачальника, мають
залишатися в пакеті постачальника, якщо межа не є справді загальною.

Користувацькі RPC-методи Gateway є розширеною точкою входу. Тримайте їх на
префіксі, специфічному для плагіна; простори імен адміністрування ядра, як-от
`config.*`, `exec.approvals.*`, `operator.admin.*`, `wizard.*` і `update.*`,
залишаються зарезервованими та розв’язуються в `operator.admin`. Міст
`openclaw/plugin-sdk/gateway-method-runtime` зарезервований для HTTP-маршрутів
плагінів, які оголошують `contracts.gatewayMethodDispatch: ["authenticated-request"]`.

Повну карту імпортів див. в [огляді SDK Plugin](/uk/plugins/sdk-overview).

## Контрольний список перед поданням

<Check>**package.json** має коректні метадані `openclaw`</Check>
<Check>Маніфест **openclaw.plugin.json** наявний і дійсний</Check>
<Check>Точка входу використовує `defineChannelPluginEntry` або `definePluginEntry`</Check>
<Check>Усі імпорти використовують вузькі шляхи `plugin-sdk/<subpath>`</Check>
<Check>Внутрішні імпорти використовують локальні модулі, а не самоімпорти SDK</Check>
<Check>Тести проходять (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` проходить (плагіни в репозиторії)</Check>

## Тестування з beta-релізами

1. Стежте за тегами релізів GitHub у [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) і підпишіться через `Watch` > `Releases`. Бета-теги мають вигляд `v2026.3.N-beta.1`. Також можна ввімкнути сповіщення для офіційного акаунта OpenClaw в X [@openclaw](https://x.com/openclaw), щоб отримувати оголошення про релізи.
2. Протестуйте свій plugin із бета-тегом, щойно він з'явиться. Вікно перед стабільним релізом зазвичай триває лише кілька годин.
3. Після тестування напишіть у гілці свого plugin у каналі Discord `plugin-forum`: або `all good`, або що саме зламалося. Якщо у вас ще немає гілки, створіть її.
4. Якщо щось зламається, відкрийте або оновіть issue з назвою `Beta blocker: <plugin-name> - <summary>` і застосуйте мітку `beta-blocker`. Додайте посилання на issue у свою гілку.
5. Відкрийте PR до `main` з назвою `fix(<plugin-id>): beta blocker - <summary>` і додайте посилання на issue як у PR, так і у свою гілку Discord. Учасники не можуть додавати мітки до PR, тому назва є сигналом на боці PR для мейнтейнерів і автоматизації. Блокери з PR об'єднують; блокери без PR можуть потрапити в реліз попри це. Мейнтейнері стежать за цими гілками під час бета-тестування.
6. Мовчання означає зелений статус. Якщо ви пропустите вікно, ваш fix, імовірно, потрапить у наступний цикл.

## Наступні кроки

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Створіть plugin каналу повідомлень
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/uk/plugins/sdk-provider-plugins">
    Створіть plugin постачальника моделі
  </Card>
  <Card title="CLI Backend Plugins" icon="terminal" href="/uk/plugins/cli-backend-plugins">
    Зареєструйте локальний бекенд AI CLI
  </Card>
  <Card title="Огляд SDK" icon="book-open" href="/uk/plugins/sdk-overview">
    Довідник з import map і API реєстрації
  </Card>
  <Card title="Помічники runtime" icon="settings" href="/uk/plugins/sdk-runtime">
    TTS, пошук, subagent через api.runtime
  </Card>
  <Card title="Тестування" icon="test-tubes" href="/uk/plugins/sdk-testing">
    Тестові утиліти й патерни
  </Card>
  <Card title="Маніфест Plugin" icon="file-json" href="/uk/plugins/manifest">
    Повний довідник зі схеми маніфесту
  </Card>
</CardGroup>

## Пов'язане

- [Хуки Plugin](/uk/plugins/hooks)
- [Архітектура Plugin](/uk/plugins/architecture)
