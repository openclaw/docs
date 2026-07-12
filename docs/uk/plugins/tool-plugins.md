---
read_when:
    - Ви хочете створити простий плагін OpenClaw, який лише додає інструменти агента
    - Ви хочете використовувати defineToolPlugin замість написання метаданих маніфесту плагіна вручну
    - Вам потрібно створити каркас, згенерувати, перевірити, протестувати або опублікувати Plugin, що містить лише інструменти
sidebarTitle: Tool Plugins
summary: Створюйте прості типізовані інструменти агента за допомогою defineToolPlugin і openclaw plugins init/build/validate
title: Плагіни інструментів
x-i18n:
    generated_at: "2026-07-12T13:39:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 231eba96d4927b7411cb17d79b96e6df09ed111fc8a54eac0ca7717e58803d26
    source_path: plugins/tool-plugins.md
    workflow: 16
---

`defineToolPlugin` створює плагін, який додає лише інструменти, доступні для виклику агентом: без
каналу, постачальника моделей, хуку, служби чи механізму налаштування. Він генерує
метадані маніфесту, потрібні OpenClaw для виявлення інструментів без завантаження
коду середовища виконання плагіна.

Для плагінів постачальників, каналів, хуків, служб або плагінів зі змішаними можливостями натомість почніть із
[Створення плагінів](/uk/plugins/building-plugins), [Плагінів каналів](/uk/plugins/sdk-channel-plugins)
або [Плагінів постачальників](/uk/plugins/sdk-provider-plugins).

## Вимоги

- Node 22.19+, Node 23.11+ або Node 24+.
- Вивід пакета TypeScript ESM.
- `typebox` у `dependencies` (не лише в `devDependencies` — згенерований
  плагін імпортує його під час виконання).
- `openclaw >=2026.5.17` — перша версія, що експортує
  `openclaw/plugin-sdk/tool-plugin`.
- Корінь пакета, який містить `dist/`, `openclaw.plugin.json` і
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
| `tsconfig.json`        | Вивід TypeScript NodeNext до `dist/`                             |
| `vitest.config.ts`     | Конфігурація Vitest для `src/**/*.test.ts`                              |
| `package.json`         | Скрипти, залежності середовища виконання, `openclaw.extensions: ["./dist/index.js"]` |
| `openclaw.plugin.json` | Згенеровані метадані маніфесту для початкового інструмента                  |

`npm run plugin:build` запускає `npm run build` (tsc), а потім
`openclaw plugins build --entry ./dist/index.js`. `npm run plugin:validate`
повторно виконує збірку й запускає `openclaw plugins validate --entry ./dist/index.js`.
Успішна перевірка виводить:

```text
Plugin stock-quotes is valid.
```

Параметри `openclaw plugins init <id>`:

| Прапорець                 | Типове значення            | Результат                                 |
| -------------------- | ------------------ | -------------------------------------- |
| `--directory <path>` | `<id>`             | Каталог виводу                       |
| `--name <name>`      | `<id>` у регістрі заголовка | Відображуване ім’я                           |
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
достатньо конкретні, щоб уникати конфліктів з основними інструментами чи іншими плагінами.

## Необов’язкові інструменти та фабрики інструментів

Установіть `optional: true`, якщо користувачі мають явно додати інструмент до списку дозволених, перш ніж його
буде надіслано моделі. `openclaw plugins build` записує відповідний запис маніфесту
`toolMetadata.<tool>.optional`, тож OpenClaw може визначити, що
інструмент необов’язковий, без завантаження коду середовища виконання плагіна.

```typescript
tool({
  name: "workflow_run",
  description: "Run an external workflow.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  execute: ({ goal }) => ({ queued: true, goal }),
});
```

Використовуйте `factory`, якщо інструменту потрібен контекст інструмента середовища виконання ще до його
створення — щоб відмовитися від участі в конкретному запуску, перевірити стан пісочниці або прив’язати
допоміжні засоби середовища виконання. Метадані залишаються статичними, навіть якщо конкретний інструмент створюється
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
з хуками, службами, постачальниками чи командами.

## Повернені значення

`defineToolPlugin` обгортає звичайні повернені значення у формат результату інструмента
OpenClaw:

- Повертайте рядок, якщо модель має побачити саме цей текст.
- Повертайте JSON-сумісне значення, якщо модель має побачити форматований JSON,
  а OpenClaw — зберегти початкове значення в `details`.

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

Використовуйте фабрику інструментів, якщо вам потрібен власний `AgentToolResult` або ви хочете повторно використати
наявну реалізацію `api.registerTool`.

## Конфігурація

`configSchema` є необов’язковою. Якщо її не вказано, OpenClaw застосовує строгу схему
порожнього об’єкта; згенерований маніфест усе одно містить `configSchema`.

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "No Config Tools",
  description: "Adds tools that do not need configuration.",
  tools: () => [],
});
```

За наявності `configSchema` тип другого аргументу `execute` виводиться з неї:

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

OpenClaw читає конфігурацію плагіна з його запису в конфігурації Gateway. Не
вбудовуйте секрети безпосередньо у вихідний код чи приклади документації; використовуйте конфігурацію, змінні
середовища або SecretRefs відповідно до моделі безпеки плагіна.

## Згенеровані метадані

OpenClaw має прочитати маніфест плагіна до імпортування коду його середовища виконання.
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

`contracts.tools` — важливий контракт виявлення: він повідомляє OpenClaw, якому
плагіну належить кожен інструмент, без завантаження середовища виконання кожного встановленого плагіна.
Застарілий маніфест може призвести до того, що інструмент не буде знайдено, або помилку
реєстрації буде помилково віднесено до іншого плагіна.

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

Публікуйте зібраний JavaScript (`./dist/index.js`), а не точку входу з вихідним кодом TypeScript.
Точки входу з вихідним кодом працюють лише для локальної розробки в робочому просторі.

## Перевірка в CI

`plugins build --check` завершується помилкою без перезапису файлів, якщо згенеровані метадані
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

З окремої робочої копії OpenClaw або встановленого CLI встановіть пакет за шляхом:

```bash
openclaw plugins install ./stock-quotes
openclaw plugins inspect stock-quotes --runtime
```

Для перевірки запакованої версії спочатку створіть пакет, а потім установіть tar-архів:

```bash
npm pack
openclaw plugins install npm-pack:./openclaw-plugin-stock-quotes-0.1.0.tgz
openclaw plugins inspect stock-quotes --runtime --json
```

Після встановлення перезапустіть або перезавантажте Gateway і попросіть агента використати
інструмент. Якщо інструмент не видно, перевірте середовище виконання плагіна та фактичний
каталог інструментів, перш ніж змінювати код (див. [Усунення несправностей](#troubleshooting)).

## Публікація

Публікуйте через ClawHub, коли пакет буде готовий. `clawhub package publish`
приймає джерело: локальну папку, репозиторій GitHub (`owner/repo[@ref]`) або
URL tar-архіву.

```bash
clawhub package publish ./stock-quotes --dry-run
clawhub package publish ./stock-quotes
```

Установлюйте з явним локатором ClawHub:

```bash
openclaw plugins install clawhub:your-org/stock-quotes
```

Специфікації пакетів npm без префікса все ще встановлюються з npm протягом перехідного періоду запуску, але
ClawHub є рекомендованим засобом виявлення та розповсюдження плагінів
OpenClaw. Відомості про область власника та перевірку випуску див. у розділі [Публікація в ClawHub](/uk/clawhub/publishing).

## Усунення несправностей

### `plugin entry not found: ./dist/index.js`

Вибраного файла точки входу не існує. Запустіть `npm run build`, а потім повторно виконайте
`openclaw plugins build --entry ./dist/index.js` або
`openclaw plugins validate --entry ./dist/index.js`.

### `plugin entry does not expose defineToolPlugin metadata`

Точка входу не експортує значення, створене за допомогою `defineToolPlugin`. Переконайтеся, що
експорт модуля за замовчуванням є результатом `defineToolPlugin(...)`, або передайте
правильну точку входу через `--entry`.

### `openclaw.plugin.json generated metadata is stale`

Маніфест більше не відповідає метаданим точки входу. Виконайте:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Закомітьте зміни як у `openclaw.plugin.json`, так і в `package.json`.

### `package.json openclaw.extensions must include ./dist/index.js`

Метадані пакета вказують на іншу точку входу середовища виконання. Запустіть
`openclaw plugins build --entry ./dist/index.js`, щоб генератор узгодив
метадані пакета з точкою входу, яку ви плануєте опублікувати.

### `Cannot find package 'typebox'`

Зібраний плагін імпортує `typebox` під час виконання. Залиште його в `dependencies`,
повторно встановіть залежності, виконайте збірку та перевірку.

### Інструмент не з’являється після встановлення

Перевірте наведене нижче в такому порядку:

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. `openclaw.plugin.json` містить `contracts.tools` з очікуваними назвами інструментів.
4. `package.json` містить `openclaw.extensions: ["./dist/index.js"]`.
5. Gateway було перезапущено або перезавантажено після встановлення плагіна.

## Дивіться також

- [Створення плагінів](/uk/plugins/building-plugins)
- [Точки входу плагіна](/uk/plugins/sdk-entrypoints)
- [Підшляхи SDK плагіна](/uk/plugins/sdk-subpaths)
- [Маніфест плагіна](/uk/plugins/manifest)
- [CLI плагінів](/uk/cli/plugins)
- [Публікація в ClawHub](/uk/clawhub/publishing)
