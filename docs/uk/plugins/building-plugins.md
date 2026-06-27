---
doc-schema-version: 1
read_when:
    - Ви хочете створити новий OpenClaw plugin
    - Вам потрібен короткий посібник із розробки Plugin
    - Ви вибираєте між документацією каналу, провайдера, бекенду CLI, інструмента або hook
sidebarTitle: Getting Started
summary: Створіть свій перший Plugin OpenClaw за лічені хвилини
title: Створення plugins
x-i18n:
    generated_at: "2026-06-27T17:48:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8991b9e857af76b4fecc15a5feb9bd6659af91a4b7518f59c83ca091dc7f705c
    source_path: plugins/building-plugins.md
    workflow: 16
---

Плагіни розширюють OpenClaw без змін у ядрі. Плагін може додати канал
обміну повідомленнями, постачальника моделей, локальний CLI-бекенд, інструмент
агента, хук, постачальника медіа або іншу можливість, що належить плагіну.

Вам не потрібно додавати зовнішній плагін до репозиторію OpenClaw. Опублікуйте
пакет у [ClawHub](/uk/clawhub), і користувачі встановлять його за допомогою:

```bash
openclaw plugins install clawhub:<package-name>
```

Специфікації пакетів без префікса все ще встановлюються з npm під час
перехідного запуску. Використовуйте префікс `clawhub:`, коли потрібне
розв’язання через ClawHub.

## Вимоги

- Використовуйте Node 22.19 або новішу версію та менеджер пакетів, як-от `npm` або `pnpm`.
- Знайтеся на TypeScript ESM-модулях.
- Для роботи з вбудованим у репозиторій плагіном клонуйте репозиторій і виконайте `pnpm install`.
  Розробка плагінів із вихідного checkout підтримує лише pnpm, тому що OpenClaw завантажує вбудовані
  плагіни з workspace-пакетів `extensions/*`.

## Виберіть форму плагіна

<CardGroup cols={2}>
  <Card title="Channel plugin" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Під’єднайте OpenClaw до платформи обміну повідомленнями.
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/uk/plugins/sdk-provider-plugins">
    Додайте постачальника моделей, медіа, пошуку, отримання даних, мовлення або realtime.
  </Card>
  <Card title="CLI backend plugin" icon="terminal" href="/uk/plugins/cli-backend-plugins">
    Запускайте локальний AI CLI через fallback моделей OpenClaw.
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
    зібрані JavaScript-файли. Дивіться [точки входу SDK](/uk/plugins/sdk-entrypoints) для повного
    контракту точки входу.

    Кожному плагіну потрібен маніфест, навіть якщо він не має конфігурації.
    Runtime-інструменти мають бути вказані в `contracts.tools`, щоб OpenClaw міг
    виявляти власника без завчасного завантаження кожного runtime плагіна.
    Задавайте `activation.onStartup` навмисно. Цей приклад запускається під час
    запуску Gateway.

    Довірені хостом поверхні плагінів також обмежуються маніфестом і потребують
    явного ввімкнення для встановлених плагінів. Якщо встановлений плагін
    реєструє `api.registerAgentToolResultMiddleware(...)`, оголосіть кожен
    цільовий runtime у `contracts.agentToolResultMiddleware`. Якщо він реєструє
    `api.registerTrustedToolPolicy(...)`, оголосіть кожен id політики в
    `contracts.trustedToolPolicies`. Ці оголошення узгоджують перевірку під час
    встановлення з runtime-реєстрацією.

    Для кожного поля маніфесту дивіться [маніфест Plugin](/uk/plugins/manifest).

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

    Використовуйте `definePluginEntry` для неканальних плагінів. Канальні плагіни
    використовують `defineChannelPluginEntry`.

  </Step>

  <Step title="Test the runtime">
    Для встановленого або зовнішнього плагіна перевірте завантажений runtime:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Якщо плагін реєструє CLI-команду, також запустіть цю команду. Наприклад,
    демо-команда повинна мати підтвердження виконання, як-от
    `openclaw demo-plugin ping`.

    Для вбудованого плагіна в цьому репозиторії OpenClaw виявляє пакети
    плагінів із вихідного checkout у workspace `extensions/*`. Запустіть
    найближчий цільовий тест:

    ```bash
    pnpm test -- extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Publish">
    Перевірте пакет перед публікацією:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    Канонічні фрагменти ClawHub містяться в `docs/snippets/plugin-publish/`.

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
потребують явної згоди користувача.

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

Користувачі вмикають його через `tools.allow`:

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for all tools from one plugin
}
```

Необов’язкові інструменти керують тим, чи буде інструмент відкритий для моделі.
Використовуйте [запити дозволів плагіна](/uk/plugins/plugin-permission-requests),
коли інструмент або хук має запитувати схвалення після того, як модель його
вибере, і до виконання дії.

Використовуйте необов’язкові інструменти для побічних ефектів, незвичних
бінарних файлів або можливостей, які не слід відкривати за замовчуванням.
Назви інструментів не повинні конфліктувати з інструментами ядра; конфлікти
пропускаються та повідомляються в діагностиці плагінів. Некоректні
реєстрації, зокрема дескриптори інструментів без `parameters`, пропускаються й
повідомляються так само. Зареєстровані інструменти — це типізовані функції,
які модель може викликати після проходження перевірок політики та allowlist.

Фабрики інструментів отримують наданий runtime об’єкт контексту. Використовуйте
`ctx.activeModel`, коли інструменту потрібно логувати, відображати або
адаптуватися до активної моделі для поточного ходу. Об’єкт може містити
`provider`, `modelId` і `modelRef`. Розглядайте його як інформаційні
runtime-метадані, а не як межу безпеки проти локального оператора,
встановленого коду плагіна або зміненого runtime OpenClaw. Чутливі локальні
інструменти все одно мають вимагати явного ввімкнення плагіном або оператором
і завершуватися закрито, коли метадані активної моделі відсутні або непридатні.

Маніфест оголошує власника та виявлення; виконання все одно викликає живу
зареєстровану реалізацію інструмента. Узгоджуйте
`toolMetadata.<tool>.optional: true` з `api.registerTool(..., { optional: true })`,
щоб OpenClaw міг не завантажувати runtime цього плагіна, доки інструмент не
буде явно додано до allowlist.

## Угоди імпорту

Імпортуйте зі сфокусованих підшляхів SDK:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

Не імпортуйте із застарілого кореневого barrel:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

У пакеті вашого плагіна використовуйте локальні barrel-файли, як-от `api.ts` і
`runtime-api.ts`, для внутрішніх імпортів. Не імпортуйте власний плагін через
шлях SDK. Допоміжні засоби, специфічні для постачальника, мають залишатися в
пакеті постачальника, якщо межа не є справді загальною.

Власні RPC-методи Gateway — це розширена точка входу. Тримайте їх на
префіксі, специфічному для плагіна; простори імен адміністрування ядра, як-от
`config.*`, `exec.approvals.*`, `operator.admin.*`, `wizard.*` і `update.*`,
залишаються зарезервованими й розв’язуються в `operator.admin`. Міст
`openclaw/plugin-sdk/gateway-method-runtime` зарезервований для HTTP-маршрутів
плагінів, які оголошують `contracts.gatewayMethodDispatch: ["authenticated-request"]`.

Повну мапу імпортів дивіться в [огляді Plugin SDK](/uk/plugins/sdk-overview).

## Контрольний список перед надсиланням

<Check>**package.json** має коректні метадані `openclaw`</Check>
<Check>Маніфест **openclaw.plugin.json** присутній і валідний</Check>
<Check>Точка входу використовує `defineChannelPluginEntry` або `definePluginEntry`</Check>
<Check>Усі імпорти використовують сфокусовані шляхи `plugin-sdk/<subpath>`</Check>
<Check>Внутрішні імпорти використовують локальні модулі, а не SDK self-imports</Check>
<Check>Тести проходять (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` проходить (для плагінів у репозиторії)</Check>

## Тестування з beta-релізами

1. Стежте за тегами GitHub-релізів у [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) і підпишіться через `Watch` > `Releases`. Beta-теги мають вигляд `v2026.3.N-beta.1`. Також можна ввімкнути сповіщення для офіційного X-акаунта OpenClaw [@openclaw](https://x.com/openclaw), щоб отримувати оголошення про релізи.
2. Протестуйте свій плагін із beta-тегом, щойно він з’явиться. Вікно до stable зазвичай становить лише кілька годин.
3. Напишіть у треді свого плагіна в Discord-каналі `plugin-forum` після тестування: або `all good`, або що зламалося. Якщо у вас ще немає треду, створіть його.
4. Якщо щось зламалося, відкрийте або оновіть issue з назвою `Beta blocker: <plugin-name> - <summary>` і застосуйте мітку `beta-blocker`. Додайте посилання на issue у свій тред.
5. Відкрийте PR до `main` з назвою `fix(<plugin-id>): beta blocker - <summary>` і додайте посилання на issue як у PR, так і у свій Discord-тред. Contributors не можуть ставити мітки на PR, тому назва є сигналом на боці PR для maintainer’ів і автоматизації. Блокери з PR зливаються; блокери без PR можуть усе одно потрапити в реліз. Maintainer’и стежать за цими тредами під час beta-тестування.
6. Мовчання означає зелений статус. Якщо ви пропустите вікно, ваше виправлення, ймовірно, потрапить у наступний цикл.

## Наступні кроки

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Створіть плагін каналу обміну повідомленнями
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/uk/plugins/sdk-provider-plugins">
    Створіть плагін постачальника моделей
  </Card>
  <Card title="CLI Backend Plugins" icon="terminal" href="/uk/plugins/cli-backend-plugins">
    Зареєструйте локальний AI CLI-бекенд
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/uk/plugins/sdk-overview">
    Мапа імпортів і довідник API реєстрації
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/uk/plugins/sdk-runtime">
    TTS, пошук, subagent через api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/uk/plugins/sdk-testing">
    Тестові утиліти та патерни
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/uk/plugins/manifest">
    Повний довідник схеми маніфесту
  </Card>
</CardGroup>

## Пов’язане

- [Хуки Plugin](/uk/plugins/hooks)
- [Архітектура Plugin](/uk/plugins/architecture)
