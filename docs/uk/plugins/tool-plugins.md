---
read_when:
    - Ви хочете створити простий Plugin OpenClaw, який лише додає інструменти агента
    - Ви хочете використовувати defineToolPlugin замість ручного написання метаданих маніфесту плагіна
    - Вам потрібно створити каркас, згенерувати, валідувати, протестувати або опублікувати Plugin лише для інструментів
sidebarTitle: Tool Plugins
summary: Створюйте прості типізовані інструменти агента за допомогою defineToolPlugin і openclaw plugins init/build/validate
title: Plugin інструментів
x-i18n:
    generated_at: "2026-06-27T18:07:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5e0ead3e9162b0e9e930a7a69dcd4a72a78063dae09a173efb70d0db32f73c9a
    source_path: plugins/tool-plugins.md
    workflow: 16
---

Tool plugins додають до OpenClaw інструменти, які може викликати агент, без додавання каналу,
постачальника моделей, hook, сервісу або setup-бекенду. Використовуйте `defineToolPlugin`, коли
plugin володіє фіксованим списком інструментів і ви хочете, щоб OpenClaw згенерував manifest
metadata, яка зберігає ці інструменти доступними для виявлення без завантаження runtime-коду.

Рекомендований процес:

1. Створіть каркас пакета за допомогою `openclaw plugins init`.
2. Напишіть інструменти з `defineToolPlugin`.
3. Зберіть JavaScript.
4. Згенеруйте metadata `openclaw.plugin.json` і `package.json` за допомогою
   `openclaw plugins build`.
5. Перевірте згенеровану metadata перед публікацією або встановленням.

Для plugin-ів постачальників, каналів, hook-ів, сервісів або зі змішаними можливостями натомість почніть із
[Побудова plugin-ів](/uk/plugins/building-plugins), [Channel Plugins](/uk/plugins/sdk-channel-plugins)
або [Provider Plugins](/uk/plugins/sdk-provider-plugins).

## Вимоги

- Node >= 22.
- Вивід пакета TypeScript ESM.
- `typebox` для schemas конфігурації та параметрів інструментів.
- `openclaw >=2026.5.17`, перша версія OpenClaw, яка експортує
  `openclaw/plugin-sdk/tool-plugin`.
- Корінь пакета, який може постачати `dist/`, `openclaw.plugin.json` і
  `package.json`.

Згенерований plugin імпортує `typebox` під час runtime, тому тримайте `typebox` у
`dependencies`, а не лише в `devDependencies`.

## Швидкий старт

Створіть новий пакет plugin:

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm install
npm run plugin:build
npm run plugin:validate
npm test
```

Каркас створює:

- `src/index.ts`: вхід `defineToolPlugin` з інструментом `echo`.
- `src/index.test.ts`: невеликий тест metadata.
- `tsconfig.json`: вивід TypeScript NodeNext у `dist/`.
- `package.json`: scripts, runtime dependencies і
  `openclaw.extensions: ["./dist/index.js"]`.
- `openclaw.plugin.json`: згенерована manifest metadata для початкового інструмента.

Очікуваний вивід перевірки:

```text
Plugin stock-quotes is valid.
```

## Напишіть інструмент

`defineToolPlugin` приймає ідентичність plugin, необов’язкову schema конфігурації та
статичний список інструментів. Типи параметрів і конфігурації виводяться зі schemas TypeBox.

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

export default defineToolPlugin({
  id: "stock-quotes",
  name: "Stock Quotes",
  description: "Fetch stock quote snapshots.",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "Quote API key." })),
    baseUrl: Type.Optional(Type.String({ description: "Quote API base URL." })),
  }),
  tools: (tool) => [
    tool({
      name: "stock_quote",
      label: "Stock Quote",
      description: "Fetch a stock quote snapshot.",
      parameters: Type.Object({
        symbol: Type.String({ description: "Ticker symbol, for example OPEN." }),
      }),
      async execute({ symbol }, config, context) {
        context.signal?.throwIfAborted();
        return {
          symbol: symbol.toUpperCase(),
          configured: Boolean(config.apiKey),
          baseUrl: config.baseUrl ?? "https://api.example.com",
        };
      },
    }),
  ],
});
```

Назви інструментів є стабільним API. Обирайте назви, які є унікальними, написані малими літерами та
достатньо конкретні, щоб уникати конфліктів із core-інструментами або іншими plugin-ами.

## Необов’язкові інструменти та factory-інструменти

Установіть `optional: true`, коли користувачі мають явно додати інструмент до allowlist перед тим, як його
буде надіслано моделі:

```typescript
tool({
  name: "workflow_run",
  description: "Run an external workflow.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  execute: ({ goal }) => ({ queued: true, goal }),
});
```

`openclaw plugins build` записує відповідний запис manifest `toolMetadata.<tool>.optional`,
щоб OpenClaw міг виявити інструмент без завантаження runtime-коду plugin.

Використовуйте `factory`, коли інструменту потрібен runtime-контекст інструмента, перш ніж його можна
створити. Factory зберігає metadata статичною, водночас дозволяючи інструменту відмовитися для
конкретного запуску, перевірити стан sandbox або прив’язати runtime helpers.

```typescript
tool({
  name: "local_workflow",
  description: "Run a local workflow outside sandboxed sessions.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  factory({ api, toolContext }) {
    if (toolContext.sandboxed) {
      return null;
    }
    return createLocalWorkflowTool(api);
  },
});
```

Factories усе ще призначені для фіксованих назв інструментів. Використовуйте `definePluginEntry` напряму, коли
plugin обчислює назви інструментів динамічно або поєднує інструменти з hooks,
сервісами, постачальниками, командами чи іншими runtime-поверхнями.

## Значення повернення

`defineToolPlugin` обгортає звичайні значення повернення у формат tool-result OpenClaw:

- Поверніть рядок, коли модель має побачити саме цей текст.
- Поверніть JSON-сумісне значення, коли ви хочете, щоб модель побачила відформатований JSON,
  а OpenClaw зберіг початкове значення в `details`.

```typescript
tool({
  name: "echo_text",
  description: "Echo input text.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => input,
});
```

```typescript
tool({
  name: "echo_json",
  description: "Echo input as structured JSON.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => ({ input, length: input.length }),
});
```

Використовуйте factory-інструмент, коли потрібно повернути власний `AgentToolResult` або повторно використати
наявну реалізацію `api.registerTool`. Використовуйте `definePluginEntry` замість
`defineToolPlugin`, коли потрібні повністю динамічні інструменти або змішані можливості plugin.

## Конфігурація

`configSchema` є необов’язковою. Якщо ви її пропустите, OpenClaw використає сувору schema порожнього об’єкта,
а згенерований manifest усе одно міститиме `configSchema`.

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "No Config Tools",
  description: "Adds tools that do not need configuration.",
  tools: () => [],
});
```

Коли ви додаєте `configSchema`, другий аргумент `execute` типізується зі
schema:

```typescript
const configSchema = Type.Object({
  apiKey: Type.String(),
});

export default defineToolPlugin({
  id: "configured-tools",
  name: "Configured Tools",
  description: "Adds configured tools.",
  configSchema,
  tools: (tool) => [
    tool({
      name: "configured_ping",
      description: "Check whether configuration is available.",
      parameters: Type.Object({}),
      execute: (_params, config) => ({ hasKey: config.apiKey.length > 0 }),
    }),
  ],
});
```

OpenClaw читає конфігурацію plugin із запису plugin у конфігурації Gateway. Не
вшивайте секрети в source або приклади в документації. Використовуйте конфігурацію, змінні середовища
або SecretRefs відповідно до моделі безпеки plugin.

## Згенерована metadata

OpenClaw виявляє встановлені plugin-и з cold metadata. Він має бути здатен прочитати
manifest plugin перед імпортом runtime-коду plugin. Тому `defineToolPlugin`
надає статичну metadata, а `openclaw plugins build` записує цю
metadata у пакет.

Запускайте генератор після зміни id, name, description, config schema,
activation або назв інструментів plugin:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Для plugin з одним інструментом згенерований manifest має такий вигляд:

```json
{
  "id": "stock-quotes",
  "name": "Stock Quotes",
  "description": "Fetch stock quote snapshots.",
  "version": "0.1.0",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  },
  "activation": {
    "onStartup": true
  },
  "contracts": {
    "tools": ["stock_quote"]
  }
}
```

`contracts.tools` є важливим контрактом виявлення. Він повідомляє OpenClaw, який
plugin володіє кожним інструментом, без завантаження runtime кожного встановленого plugin. Якщо
manifest застарів, інструмент може бути відсутній у виявленні або за помилку реєстрації
може бути помилково звинувачено не той plugin.

## Metadata пакета

Для простого процесу tool-plugin `openclaw plugins build` узгоджує
`package.json` з вибраним єдиним runtime-входом:

```json
{
  "type": "module",
  "files": ["dist", "openclaw.plugin.json", "README.md"],
  "dependencies": {
    "typebox": "^1.1.38"
  },
  "peerDependencies": {
    "openclaw": ">=2026.5.17"
  },
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

Використовуйте зібраний JavaScript, як-от `./dist/index.js`, для встановлених пакетів. Source
entries корисні під час розробки в workspace, але опубліковані пакети не повинні
залежати від runtime-завантаження TypeScript.

## Перевірка в CI

Використовуйте `plugins build --check`, щоб CI падав, коли згенерована metadata застаріла, без
перезапису файлів:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
npm test
```

`plugins validate` перевіряє, що:

- `openclaw.plugin.json` існує та проходить звичайний manifest loader.
- Поточний entry експортує metadata `defineToolPlugin`.
- Згенеровані поля manifest збігаються з entry metadata.
- `contracts.tools` збігається з оголошеними назвами інструментів.
- `package.json` спрямовує `openclaw.extensions` на вибраний runtime entry.

## Локальне встановлення та перевірка

З окремого checkout OpenClaw або встановленого CLI встановіть шлях пакета:

```bash
openclaw plugins install ./stock-quotes
openclaw plugins inspect stock-quotes --runtime
```

Для packaged smoke спершу запакуйте, а потім встановіть tarball:

```bash
npm pack
openclaw plugins install npm-pack:./openclaw-plugin-stock-quotes-0.1.0.tgz
openclaw plugins inspect stock-quotes --runtime --json
```

Після встановлення запустіть або перезапустіть Gateway і попросіть агента використати
інструмент. Якщо ви налагоджуєте видимість інструментів, перевірте runtime plugin і
ефективний каталог інструментів перед зміною коду.

## Публікація

Публікуйте через ClawHub, коли пакет готовий:

```bash
clawhub package publish your-org/stock-quotes --dry-run
clawhub package publish your-org/stock-quotes
```

Встановлюйте з явним локатором ClawHub:

```bash
openclaw plugins install clawhub:your-org/stock-quotes
```

Bare npm package specs залишаються підтримуваними під час launch cutover, але ClawHub
є пріоритетною поверхнею виявлення та розповсюдження для plugin-ів OpenClaw.

## Усунення несправностей

### `plugin entry not found: ./dist/index.js`

Вибраний entry file не існує. Запустіть `npm run build`, потім повторно запустіть
`openclaw plugins build --entry ./dist/index.js` або
`openclaw plugins validate --entry ./dist/index.js`.

### `plugin entry does not expose defineToolPlugin metadata`

Entry не експортував значення, створене `defineToolPlugin`. Перевірте, що
default export модуля є результатом `defineToolPlugin(...)`, або передайте правильний
entry за допомогою `--entry`.

### `openclaw.plugin.json generated metadata is stale`

Manifest більше не збігається з entry metadata. Запустіть:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Закомітьте зміни і `openclaw.plugin.json`, і `package.json`.

### `package.json openclaw.extensions must include ./dist/index.js`

Metadata пакета вказує на інший runtime entry. Запустіть
`openclaw plugins build --entry ./dist/index.js`, щоб генератор узгодив
metadata пакета з entry, який ви маєте намір постачати.

### `Cannot find package 'typebox'`

Зібраний plugin імпортує `typebox` під час runtime. Тримайте `typebox` у
`dependencies`, перевстановіть залежності пакета, перебудуйте та повторно запустіть перевірку.

### Інструмент не з’являється після встановлення

Перевірте це по черзі:

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. `openclaw.plugin.json` має `contracts.tools` з очікуваними назвами інструментів.
4. `package.json` має `openclaw.extensions: ["./dist/index.js"]`.
5. Gateway було перезапущено або перезавантажено після встановлення plugin.

## Дивіться також

- [Побудова plugin-ів](/uk/plugins/building-plugins)
- [Entry points plugin](/uk/plugins/sdk-entrypoints)
- [Subpaths Plugin SDK](/uk/plugins/sdk-subpaths)
- [Manifest plugin](/uk/plugins/manifest)
- [CLI plugin-ів](/uk/cli/plugins)
- [Публікація ClawHub](/uk/clawhub/publishing)
