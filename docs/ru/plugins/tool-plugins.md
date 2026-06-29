---
read_when:
    - Вы хотите создать простой Plugin OpenClaw, который только добавляет инструменты агента
    - Вы хотите использовать defineToolPlugin вместо ручного написания метаданных манифеста Plugin
    - Вам нужно создать каркас, сгенерировать, проверить, протестировать или опубликовать Plugin, содержащий только инструменты
sidebarTitle: Tool Plugins
summary: Создавайте простые типизированные инструменты агента с помощью defineToolPlugin и openclaw plugins init/build/validate
title: Plugins для инструментов
x-i18n:
    generated_at: "2026-06-28T23:33:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5e0ead3e9162b0e9e930a7a69dcd4a72a78063dae09a173efb70d0db32f73c9a
    source_path: plugins/tool-plugins.md
    workflow: 16
---

Плагины инструментов добавляют в OpenClaw инструменты, вызываемые агентом, без добавления канала,
поставщика модели, hook, сервиса или backend настройки. Используйте `defineToolPlugin`, когда
плагин владеет фиксированным списком инструментов и вы хотите, чтобы OpenClaw сгенерировал
метаданные манифеста, которые сохраняют эти инструменты доступными для обнаружения без загрузки runtime-кода.

Рекомендуемый процесс:

1. Создайте каркас пакета с помощью `openclaw plugins init`.
2. Напишите инструменты с `defineToolPlugin`.
3. Соберите JavaScript.
4. Сгенерируйте метаданные `openclaw.plugin.json` и `package.json` с помощью
   `openclaw plugins build`.
5. Проверьте сгенерированные метаданные перед публикацией или установкой.

Для плагинов поставщиков, каналов, hook, сервисов или плагинов со смешанными возможностями начните с
[Создание плагинов](/ru/plugins/building-plugins), [Плагины каналов](/ru/plugins/sdk-channel-plugins)
или [Плагины поставщиков](/ru/plugins/sdk-provider-plugins).

## Требования

- Node >= 22.
- Вывод пакета TypeScript ESM.
- `typebox` для схем конфигурации и параметров инструментов.
- `openclaw >=2026.5.17`, первая версия OpenClaw, которая экспортирует
  `openclaw/plugin-sdk/tool-plugin`.
- Корень пакета, который может поставлять `dist/`, `openclaw.plugin.json` и
  `package.json`.

Сгенерированный плагин импортирует `typebox` во время выполнения, поэтому держите `typebox` в
`dependencies`, а не только в `devDependencies`.

## Быстрый старт

Создайте новый пакет плагина:

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm install
npm run plugin:build
npm run plugin:validate
npm test
```

Каркас создает:

- `src/index.ts`: entry `defineToolPlugin` с инструментом `echo`.
- `src/index.test.ts`: небольшой тест метаданных.
- `tsconfig.json`: вывод TypeScript NodeNext в `dist/`.
- `package.json`: скрипты, runtime-зависимости и
  `openclaw.extensions: ["./dist/index.js"]`.
- `openclaw.plugin.json`: сгенерированные метаданные манифеста для начального инструмента.

Ожидаемый вывод проверки:

```text
Plugin stock-quotes is valid.
```

## Написание инструмента

`defineToolPlugin` принимает идентификацию плагина, необязательную схему конфигурации и
статический список инструментов. Типы параметров и конфигурации выводятся из схем TypeBox.

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

Имена инструментов являются стабильным API. Выбирайте имена, которые уникальны, написаны в нижнем регистре и
достаточно конкретны, чтобы избежать конфликтов с инструментами core или другими плагинами.

## Необязательные и фабричные инструменты

Установите `optional: true`, когда пользователи должны явно добавить инструмент в allowlist, прежде чем он
будет отправлен модели:

```typescript
tool({
  name: "workflow_run",
  description: "Run an external workflow.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  execute: ({ goal }) => ({ queued: true, goal }),
});
```

`openclaw plugins build` записывает соответствующую запись манифеста `toolMetadata.<tool>.optional`,
чтобы OpenClaw мог обнаружить инструмент без загрузки runtime-кода плагина.

Используйте `factory`, когда инструменту нужен runtime-контекст инструмента, прежде чем его можно будет
создать. Фабрика сохраняет метаданные статическими, позволяя инструменту отказаться от конкретного запуска,
проверить состояние sandbox или привязать runtime-помощники.

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

Фабрики по-прежнему предназначены для фиксированных имен инструментов. Используйте `definePluginEntry` напрямую, когда
плагин вычисляет имена инструментов динамически или объединяет инструменты с hook,
сервисами, поставщиками, командами или другими runtime-поверхностями.

## Возвращаемые значения

`defineToolPlugin` оборачивает простые возвращаемые значения в формат результата инструмента OpenClaw:

- Верните строку, когда модель должна увидеть именно этот текст.
- Верните JSON-совместимое значение, когда вы хотите, чтобы модель увидела форматированный JSON,
  а OpenClaw сохранил исходное значение в `details`.

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

Используйте фабричный инструмент, когда нужно вернуть собственный `AgentToolResult` или повторно использовать
существующую реализацию `api.registerTool`. Используйте `definePluginEntry` вместо
`defineToolPlugin`, когда вам нужны полностью динамические инструменты или смешанные возможности
плагина.

## Конфигурация

`configSchema` необязательна. Если вы ее опустите, OpenClaw использует строгую схему пустого объекта,
и сгенерированный манифест все равно будет включать `configSchema`.

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "No Config Tools",
  description: "Adds tools that do not need configuration.",
  tools: () => [],
});
```

Когда вы включаете `configSchema`, второй аргумент `execute` типизируется на основе
схемы:

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

OpenClaw читает конфигурацию плагина из записи плагина в конфигурации Gateway. Не
зашивайте секреты в исходный код или примеры в документации. Используйте конфигурацию, переменные окружения
или SecretRefs согласно модели безопасности плагина.

## Сгенерированные метаданные

OpenClaw обнаруживает установленные плагины по холодным метаданным. Он должен уметь читать
манифест плагина до импорта runtime-кода плагина. Поэтому `defineToolPlugin`
предоставляет статические метаданные, а `openclaw plugins build` записывает эти
метаданные в пакет.

Запускайте генератор после изменения id, имени, описания, схемы конфигурации,
активации или имен инструментов плагина:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Для плагина с одним инструментом сгенерированный манифест выглядит так:

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

`contracts.tools` — важный контракт обнаружения. Он сообщает OpenClaw, какой
плагин владеет каждым инструментом, без загрузки runtime-кода каждого установленного плагина. Если
манифест устарел, инструмент может отсутствовать при обнаружении или неправильный плагин
может быть указан как причина ошибки регистрации.

## Метаданные пакета

Для простого процесса tool-plugin `openclaw plugins build` выравнивает
`package.json` с выбранной единственной runtime-точкой входа:

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

Используйте собранный JavaScript, например `./dist/index.js`, для установленных пакетов. Исходные
entry полезны при разработке в workspace, но опубликованные пакеты не должны
зависеть от runtime-загрузки TypeScript.

## Проверка в CI

Используйте `plugins build --check`, чтобы CI падал, когда сгенерированные метаданные устарели, без
перезаписи файлов:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
npm test
```

`plugins validate` проверяет, что:

- `openclaw.plugin.json` существует и проходит обычный загрузчик манифеста.
- Текущая entry экспортирует метаданные `defineToolPlugin`.
- Сгенерированные поля манифеста соответствуют метаданным entry.
- `contracts.tools` соответствует объявленным именам инструментов.
- `package.json` указывает `openclaw.extensions` на выбранную runtime-entry.

## Локальная установка и проверка

Из отдельного checkout OpenClaw или установленного CLI установите путь пакета:

```bash
openclaw plugins install ./stock-quotes
openclaw plugins inspect stock-quotes --runtime
```

Для пакетного smoke сначала упакуйте и установите tarball:

```bash
npm pack
openclaw plugins install npm-pack:./openclaw-plugin-stock-quotes-0.1.0.tgz
openclaw plugins inspect stock-quotes --runtime --json
```

После установки запустите или перезапустите Gateway и попросите агента использовать
инструмент. Если вы отлаживаете видимость инструмента, проверьте runtime плагина и
эффективный каталог инструментов перед изменением кода.

## Публикация

Публикуйте через ClawHub, когда пакет готов:

```bash
clawhub package publish your-org/stock-quotes --dry-run
clawhub package publish your-org/stock-quotes
```

Установите с явным локатором ClawHub:

```bash
openclaw plugins install clawhub:your-org/stock-quotes
```

Простые npm package specs остаются поддерживаемыми во время перехода при запуске, но ClawHub
является предпочтительной поверхностью обнаружения и распространения для плагинов OpenClaw.

## Устранение неполадок

### `plugin entry not found: ./dist/index.js`

Выбранный entry-файл не существует. Запустите `npm run build`, затем повторно выполните
`openclaw plugins build --entry ./dist/index.js` или
`openclaw plugins validate --entry ./dist/index.js`.

### `plugin entry does not expose defineToolPlugin metadata`

Entry не экспортировал значение, созданное `defineToolPlugin`. Проверьте, что
default export модуля является результатом `defineToolPlugin(...)`, или передайте правильную
entry с `--entry`.

### `openclaw.plugin.json generated metadata is stale`

Манифест больше не соответствует метаданным entry. Запустите:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Закоммитьте изменения как `openclaw.plugin.json`, так и `package.json`.

### `package.json openclaw.extensions must include ./dist/index.js`

Метаданные пакета указывают на другую runtime-entry. Запустите
`openclaw plugins build --entry ./dist/index.js`, чтобы генератор выровнял
метаданные пакета с entry, которую вы собираетесь поставлять.

### `Cannot find package 'typebox'`

Собранный плагин импортирует `typebox` во время выполнения. Держите `typebox` в
`dependencies`, переустановите зависимости пакета, пересоберите и повторно выполните проверку.

### Инструмент не появляется после установки

Проверьте следующее по порядку:

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. В `openclaw.plugin.json` есть `contracts.tools` с ожидаемыми именами инструментов.
4. В `package.json` есть `openclaw.extensions: ["./dist/index.js"]`.
5. Gateway был перезапущен или перезагружен после установки плагина.

## См. также

- [Создание плагинов](/ru/plugins/building-plugins)
- [Точки входа плагинов](/ru/plugins/sdk-entrypoints)
- [Подпути Plugin SDK](/ru/plugins/sdk-subpaths)
- [Манифест плагина](/ru/plugins/manifest)
- [CLI плагинов](/ru/cli/plugins)
- [Публикация ClawHub](/ru/clawhub/publishing)
