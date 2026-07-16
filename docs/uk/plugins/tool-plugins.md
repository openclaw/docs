---
read_when:
    - Ви хочете створити простий плагін OpenClaw, який лише додає інструменти агента
    - Ви хочете використовувати defineToolPlugin замість написання метаданих маніфесту плагіна вручну
    - Вам потрібно створити каркас, згенерувати, перевірити, протестувати або опублікувати плагін, що містить лише інструменти
sidebarTitle: Tool Plugins
summary: Створюйте прості типізовані інструменти агента за допомогою defineToolPlugin і openclaw plugins init/build/validate
title: Плагіни інструментів
x-i18n:
    generated_at: "2026-07-16T18:30:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fb9187e1d8aed88eee5c99dcdce89f70cd0d4f930b97aaac2ff868037d63adc1
    source_path: plugins/tool-plugins.md
    workflow: 16
---

`defineToolPlugin` створює плагін, який лише додає інструменти, доступні для виклику агентом: без
каналу, постачальника моделей, перехоплювача, служби чи серверної частини налаштування. Він генерує
метадані маніфесту, потрібні OpenClaw для виявлення інструментів без завантаження
коду середовища виконання плагіна.

Для плагінів постачальників, каналів, перехоплювачів, служб або плагінів зі змішаними можливостями натомість почніть із
[Створення плагінів](/uk/plugins/building-plugins), [Плагіни каналів](/uk/plugins/sdk-channel-plugins)
або [Плагіни постачальників](/uk/plugins/sdk-provider-plugins).

## Вимоги

- Node 22.22.3+, Node 24.15+ або Node 25.9+.
- Вивід пакета TypeScript ESM.
- `typebox` у `dependencies` (не лише в `devDependencies` — згенерований
  плагін імпортує його під час виконання).
- `openclaw >=2026.5.17`, перша версія, що експортує
  `openclaw/plugin-sdk/tool-plugin`.
- Корінь пакета, що постачається з `dist/`, `openclaw.plugin.json` і
  `package.json`.

## Швидкий початок

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm install
npm run plugin:build
npm run plugin:validate
npm test
```

`plugins init` створює каркас:

| Файл                   | Призначення                                                           |
| ---------------------- | ----------------------------------------------------------------- |
| `src/index.ts`         | Точка входу `defineToolPlugin` з одним інструментом `echo`                     |
| `src/index.test.ts`    | Тест метаданих, що перевіряє список інструментів                             |
| `tsconfig.json`        | Вивід NodeNext TypeScript до `dist/`                             |
| `vitest.config.ts`     | Конфігурація Vitest для `src/**/*.test.ts`                              |
| `package.json`         | Скрипти, залежності середовища виконання, `openclaw.extensions: ["./dist/index.js"]` |
| `openclaw.plugin.json` | Згенеровані метадані маніфесту для початкового інструмента                  |

`npm run plugin:build` запускає `npm run build` (tsc), а потім
`openclaw plugins build --entry ./dist/index.js`. `npm run plugin:validate`
повторно збирає та запускає `openclaw plugins validate --entry ./dist/index.js`.
Успішна перевірка виводить:

```text
Плагін stock-quotes є дійсним.
```

Параметри `openclaw plugins init <id>`:

| Прапорець                 | Типове значення            | Результат                                 |
| -------------------- | ------------------ | -------------------------------------- |
| `--directory <path>` | `<id>`             | Каталог виводу                       |
| `--name <name>`      | `<id>` з великих літер | Відображуване ім’я                           |
| `--type <type>`      | `tool`             | Тип каркаса: `tool` або `provider`    |
| `--force`            | вимкнено                | Перезаписати наявний каталог виводу |

## Написання інструмента

`defineToolPlugin` приймає ідентифікаційні дані плагіна, необов’язкову схему конфігурації та
статичний список інструментів. Типи параметрів і конфігурації виводяться зі
схем TypeBox.

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

Назви інструментів є стабільним API. Вибирайте унікальні назви в нижньому регістрі,
достатньо конкретні, щоб уникнути конфліктів з основними інструментами або іншими плагінами.

## Необов’язкові інструменти та фабрики інструментів

Установіть `optional: true`, якщо користувачі мають явно додати інструмент до списку дозволених, перш ніж його
буде надіслано моделі. `openclaw plugins build` записує відповідний
запис маніфесту `toolMetadata.<tool>.optional`, щоб OpenClaw міг визначити, що
інструмент є необов’язковим, без завантаження коду середовища виконання плагіна.

```typescript
tool({
  name: "workflow_run",
  description: "Run an external workflow.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  execute: ({ goal }) => ({ queued: true, goal }),
});
```

Використовуйте `factory`, коли інструменту потрібен контекст інструмента середовища виконання до його
створення — щоб відмовитися від участі в конкретному запуску, перевірити стан пісочниці або прив’язати
допоміжні засоби середовища виконання. Метадані залишаються статичними, хоча конкретний інструмент створюється
під час виконання.

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

Фабрики все одно заздалегідь оголошують фіксовану назву інструмента. Використовуйте `definePluginEntry`
безпосередньо, коли плагін динамічно обчислює назви інструментів або поєднує інструменти
з перехоплювачами, службами, постачальниками чи командами.

## Повернені значення

`defineToolPlugin` обгортає звичайні повернені значення у формат результату інструмента
OpenClaw:

- Поверніть рядок, якщо модель має побачити саме цей текст.
- Поверніть JSON-сумісне значення, якщо потрібно, щоб модель побачила форматований JSON,
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

Використовуйте фабрику інструмента, коли потрібен власний `AgentToolResult` або коли потрібно повторно використати
наявну реалізацію `api.registerTool`.

## Конфігурація

`configSchema` є необов’язковим. Якщо його пропустити, OpenClaw застосовує сувору схему порожнього об’єкта;
згенерований маніфест усе одно містить `configSchema`.

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "No Config Tools",
  description: "Adds tools that do not need configuration.",
  tools: () => [],
});
```

За наявності `configSchema` тип другого аргументу `execute` виводиться з нього:

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

OpenClaw зчитує конфігурацію плагіна з його запису в конфігурації Gateway. Не
вписуйте секрети безпосередньо у вихідний код або приклади документації; використовуйте конфігурацію, змінні
середовища або SecretRefs відповідно до моделі безпеки плагіна.

## Згенеровані метадані

OpenClaw має прочитати маніфест плагіна до імпорту коду його середовища виконання.
`defineToolPlugin` надає для цього статичні метадані, а
`openclaw plugins build` записує їх у пакет. Повторно запускайте генератор після
зміни ідентифікатора, назви, опису, схеми конфігурації, активації або назв
інструментів плагіна:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Згенерований маніфест для плагіна з одним інструментом:

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

`contracts.tools` є важливим контрактом виявлення: він повідомляє OpenClaw, якому
плагіну належить кожен інструмент, без завантаження середовища виконання кожного встановленого плагіна.
Застарілий маніфест може призвести до відсутності інструмента у виявленні або до того, що помилку
реєстрації буде помилково приписано іншому плагіну.

## Метадані пакета

`openclaw plugins build` також узгоджує `package.json` з вибраною точкою входу
середовища виконання:

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

Постачайте зібраний JavaScript (`./dist/index.js`), а не точку входу вихідного коду TypeScript.
Точки входу вихідного коду працюють лише для локальної розробки в робочому просторі.

## Перевірка в CI

`plugins build --check` завершується помилкою без перезаписування файлів, якщо згенеровані метадані
застаріли:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
npm test
```

`plugins validate` перевіряє, що:

- `openclaw.plugin.json` існує та успішно проходить звичайний завантажувач маніфесту.
- Поточна точка входу експортує метадані `defineToolPlugin`.
- Поля згенерованого маніфесту відповідають метаданим точки входу.
- `contracts.tools` відповідає оголошеним назвам інструментів.
- `package.json` спрямовує `openclaw.extensions` на вибрану точку входу середовища виконання.

## Локальне встановлення та перевірка

З окремого репозиторію OpenClaw або встановленого CLI установіть пакет за шляхом:

```bash
openclaw plugins install ./stock-quotes
openclaw plugins inspect stock-quotes --runtime
```

Для швидкої перевірки запакованої версії спочатку створіть пакет і встановіть tar-архів:

```bash
npm pack
openclaw plugins install npm-pack:./openclaw-plugin-stock-quotes-0.1.0.tgz
openclaw plugins inspect stock-quotes --runtime --json
```

Після встановлення перезапустіть або перезавантажте Gateway і попросіть агента використати
інструмент. Якщо інструмент не відображається, перевірте середовище виконання плагіна й фактичний
каталог інструментів, перш ніж змінювати код (див. [Усунення несправностей](#troubleshooting)).

## Публікація

Коли пакет буде готовий, опублікуйте його через ClawHub. `clawhub package publish`
приймає джерело: локальну папку, репозиторій GitHub (`owner/repo[@ref]`) або
URL-адресу tar-архіву.

```bash
clawhub package publish ./stock-quotes --dry-run
clawhub package publish ./stock-quotes
```

Установіть із явним локатором ClawHub:

```bash
openclaw plugins install clawhub:your-org/stock-quotes
```

Специфікації пакетів npm без префікса все ще встановлюються з npm під час перехідного періоду запуску, але
ClawHub є рекомендованою платформою виявлення та розповсюдження плагінів
OpenClaw. Відомості про область власника та перевірку
випуску див. у розділі [Публікація в ClawHub](/uk/clawhub/publishing).

## Усунення несправностей

### `plugin entry not found: ./dist/index.js`

Вибраного файла точки входу не існує. Запустіть `npm run build`, а потім повторно запустіть
`openclaw plugins build --entry ./dist/index.js` або
`openclaw plugins validate --entry ./dist/index.js`.

### `plugin entry does not expose defineToolPlugin metadata`

Точка входу не експортувала значення, створене за допомогою `defineToolPlugin`. Переконайтеся, що
експорт модуля за замовчуванням є результатом `defineToolPlugin(...)`, або передайте
правильну точку входу за допомогою `--entry`.

### `openclaw.plugin.json generated metadata is stale`

Маніфест більше не відповідає метаданим точки входу. Запустіть:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Зафіксуйте зміни як у `openclaw.plugin.json`, так і в `package.json`.

### `package.json openclaw.extensions must include ./dist/index.js`

Метадані пакета вказують на іншу точку входу середовища виконання. Запустіть
`openclaw plugins build --entry ./dist/index.js`, щоб генератор узгодив
метадані пакета з точкою входу, яку потрібно постачати.

### `Cannot find package 'typebox'`

Зібраний плагін імпортує `typebox` під час виконання. Залиште його в `dependencies`,
повторно встановіть залежності, перебудуйте та повторно запустіть перевірку.

### Інструмент не відображається після встановлення

Перевірте наведене нижче в такому порядку:

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. `openclaw.plugin.json` має `contracts.tools` з очікуваними назвами інструментів.
4. `package.json` має `openclaw.extensions: ["./dist/index.js"]`.
5. Gateway було перезапущено або перезавантажено після встановлення плагіна.

## Див. також

- [Створення плагінів](/uk/plugins/building-plugins)
- [Точки входу плагіна](/uk/plugins/sdk-entrypoints)
- [Підшляхи SDK плагіна](/uk/plugins/sdk-subpaths)
- [Маніфест плагіна](/uk/plugins/manifest)
- [CLI плагінів](/uk/cli/plugins)
- [Публікація в ClawHub](/uk/clawhub/publishing)
