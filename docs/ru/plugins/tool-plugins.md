---
read_when:
    - Вы хотите создать простой плагин OpenClaw, который только добавляет инструменты агента
    - Вы хотите использовать defineToolPlugin вместо написания метаданных манифеста Plugin вручную
    - Вам необходимо создать каркас, сгенерировать, проверить, протестировать или опубликовать Plugin, содержащий только инструменты
sidebarTitle: Tool Plugins
summary: Создавайте простые типизированные инструменты агента с помощью defineToolPlugin и openclaw plugins init/build/validate
title: Плагины инструментов
x-i18n:
    generated_at: "2026-07-12T11:45:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 231eba96d4927b7411cb17d79b96e6df09ed111fc8a54eac0ca7717e58803d26
    source_path: plugins/tool-plugins.md
    workflow: 16
---

`defineToolPlugin` создаёт Plugin, который добавляет только инструменты, доступные для вызова агентом: без
канала, провайдера моделей, хука, сервиса или бэкенда настройки. Он генерирует
метаданные манифеста, необходимые OpenClaw для обнаружения инструментов без загрузки
кода среды выполнения Plugin.

Для Plugin провайдера, канала, хука, сервиса или со смешанными возможностями вместо этого начните с
[Создание Plugin](/ru/plugins/building-plugins), [Plugin каналов](/ru/plugins/sdk-channel-plugins)
или [Plugin провайдеров](/ru/plugins/sdk-provider-plugins).

## Требования

- Node 22.19+, Node 23.11+ или Node 24+.
- Выходной пакет TypeScript ESM.
- `typebox` в `dependencies` (не только в `devDependencies` — сгенерированный
  Plugin импортирует его во время выполнения).
- `openclaw >=2026.5.17` — первая версия, экспортирующая
  `openclaw/plugin-sdk/tool-plugin`.
- Корень пакета, включающий `dist/`, `openclaw.plugin.json` и
  `package.json`.

## Быстрый старт

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm install
npm run plugin:build
npm run plugin:validate
npm test
```

`plugins init` создаёт заготовки:

| Файл                   | Назначение                                                           |
| ---------------------- | ----------------------------------------------------------------- |
| `src/index.ts`         | Точка входа `defineToolPlugin` с одним инструментом `echo`                     |
| `src/index.test.ts`    | Тест метаданных, проверяющий список инструментов                             |
| `tsconfig.json`        | Вывод TypeScript NodeNext в `dist/`                             |
| `vitest.config.ts`     | Конфигурация Vitest для `src/**/*.test.ts`                              |
| `package.json`         | Скрипты, зависимости среды выполнения, `openclaw.extensions: ["./dist/index.js"]` |
| `openclaw.plugin.json` | Сгенерированные метаданные манифеста для исходного инструмента                  |

`npm run plugin:build` запускает `npm run build` (tsc), затем
`openclaw plugins build --entry ./dist/index.js`. `npm run plugin:validate`
повторно выполняет сборку и запускает `openclaw plugins validate --entry ./dist/index.js`.
При успешной проверке выводится:

```text
Plugin stock-quotes is valid.
```

Параметры `openclaw plugins init <id>`:

| Флаг                 | Значение по умолчанию            | Действие                                 |
| -------------------- | ------------------ | -------------------------------------- |
| `--directory <path>` | `<id>`             | Выходной каталог                       |
| `--name <name>`      | `<id>` с заглавными начальными буквами | Отображаемое имя                           |
| `--type <type>`      | `tool`             | Тип заготовки: `tool` или `provider`    |
| `--force`            | выключен                | Перезаписать существующий выходной каталог |

## Написание инструмента

`defineToolPlugin` принимает идентификационные данные Plugin, необязательную схему конфигурации и
статический список инструментов. Типы параметров и конфигурации выводятся из
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

Имена инструментов являются стабильным API. Выбирайте уникальные имена в нижнем регистре,
достаточно конкретные, чтобы избежать конфликтов с основными инструментами или другими Plugin.

## Необязательные инструменты и фабрики инструментов

Установите `optional: true`, если пользователи должны явно добавить инструмент в список разрешённых, прежде чем он
будет отправлен модели. `openclaw plugins build` записывает соответствующую запись манифеста
`toolMetadata.<tool>.optional`, поэтому OpenClaw может определить, что
инструмент необязателен, без загрузки кода среды выполнения Plugin.

```typescript
tool({
  name: "workflow_run",
  description: "Run an external workflow.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  execute: ({ goal }) => ({ queued: true, goal }),
});
```

Используйте `factory`, когда инструменту для создания нужен контекст инструмента среды выполнения —
чтобы отказаться от участия в конкретном запуске, проверить состояние песочницы или привязать
вспомогательные средства среды выполнения. Метаданные остаются статическими, хотя конкретный инструмент создаётся
во время выполнения.

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

Фабрики по-прежнему заранее объявляют фиксированное имя инструмента. Используйте `definePluginEntry`
напрямую, когда Plugin динамически вычисляет имена инструментов или сочетает инструменты
с хуками, сервисами, провайдерами или командами.

## Возвращаемые значения

`defineToolPlugin` оборачивает обычные возвращаемые значения в формат результата инструмента
OpenClaw:

- Возвращайте строку, когда модель должна увидеть именно этот текст.
- Возвращайте JSON-совместимое значение, если хотите, чтобы модель увидела форматированный JSON,
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

Используйте фабрику инструментов, когда требуется собственный `AgentToolResult` или нужно повторно использовать
существующую реализацию `api.registerTool`.

## Конфигурация

`configSchema` необязательна. Если её не указать, OpenClaw применяет строгую схему пустого объекта;
сгенерированный манифест всё равно содержит `configSchema`.

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "No Config Tools",
  description: "Adds tools that do not need configuration.",
  tools: () => [],
});
```

При наличии `configSchema` тип второго аргумента `execute` выводится из неё:

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

OpenClaw считывает конфигурацию Plugin из записи этого Plugin в конфигурации Gateway. Не
записывайте секреты непосредственно в исходный код или примеры документации; используйте конфигурацию, переменные
окружения или SecretRefs в соответствии с моделью безопасности Plugin.

## Сгенерированные метаданные

OpenClaw должен прочитать манифест Plugin до импорта кода среды выполнения Plugin.
`defineToolPlugin` предоставляет для этого статические метаданные, а
`openclaw plugins build` записывает их в пакет. Повторно запускайте генератор после
изменения идентификатора, имени, описания, схемы конфигурации, активации или имён
инструментов Plugin:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Сгенерированный манифест для Plugin с одним инструментом:

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

`contracts.tools` — важный контракт обнаружения: он сообщает OpenClaw, какому
Plugin принадлежит каждый инструмент, без загрузки среды выполнения каждого установленного Plugin. Устаревший
манифест может привести к тому, что инструмент исчезнет из обнаружения или ошибка регистрации
будет ошибочно отнесена к другому Plugin.

## Метаданные пакета

`openclaw plugins build` также приводит `package.json` в соответствие с выбранной точкой входа
среды выполнения:

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

Публикуйте собранный JavaScript (`./dist/index.js`), а не точку входа с исходным кодом TypeScript.
Точки входа с исходным кодом работают только при локальной разработке в рабочем пространстве.

## Проверка в CI

`plugins build --check` завершается ошибкой без перезаписи файлов, если сгенерированные метаданные
устарели:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
npm test
```

`plugins validate` проверяет следующее:

- `openclaw.plugin.json` существует и успешно проходит обычную загрузку манифеста.
- Текущая точка входа экспортирует метаданные `defineToolPlugin`.
- Поля сгенерированного манифеста соответствуют метаданным точки входа.
- `contracts.tools` соответствует объявленным именам инструментов.
- `package.json` направляет `openclaw.extensions` на выбранную точку входа среды выполнения.

## Локальная установка и проверка

Из отдельной рабочей копии OpenClaw или установленного CLI установите пакет по пути:

```bash
openclaw plugins install ./stock-quotes
openclaw plugins inspect stock-quotes --runtime
```

Для дымового теста пакета сначала упакуйте его и установите tar-архив:

```bash
npm pack
openclaw plugins install npm-pack:./openclaw-plugin-stock-quotes-0.1.0.tgz
openclaw plugins inspect stock-quotes --runtime --json
```

После установки перезапустите или перезагрузите Gateway и попросите агента использовать
инструмент. Если инструмент не отображается, проверьте среду выполнения Plugin и фактический
каталог инструментов, прежде чем изменять код (см. [Устранение неполадок](#troubleshooting)).

## Публикация

Когда пакет будет готов, опубликуйте его через ClawHub. `clawhub package publish`
принимает источник: локальную папку, репозиторий GitHub (`owner/repo[@ref]`) или
URL tar-архива.

```bash
clawhub package publish ./stock-quotes --dry-run
clawhub package publish ./stock-quotes
```

Установите с явным указанием расположения ClawHub:

```bash
openclaw plugins install clawhub:your-org/stock-quotes
```

Спецификации пакетов npm без префикса по-прежнему устанавливаются из npm во время перехода при запуске, но
ClawHub является предпочтительной площадкой обнаружения и распространения Plugin
OpenClaw. Сведения об области владельца и проверке выпуска см. в разделе
[Публикация в ClawHub](/ru/clawhub/publishing).

## Устранение неполадок

### `plugin entry not found: ./dist/index.js`

Выбранный файл точки входа не существует. Выполните `npm run build`, затем повторно запустите
`openclaw plugins build --entry ./dist/index.js` или
`openclaw plugins validate --entry ./dist/index.js`.

### `plugin entry does not expose defineToolPlugin metadata`

Точка входа не экспортировала значение, созданное `defineToolPlugin`. Убедитесь, что
экспорт модуля по умолчанию является результатом `defineToolPlugin(...)`, либо укажите
правильную точку входа с помощью `--entry`.

### `openclaw.plugin.json generated metadata is stale`

Манифест больше не соответствует метаданным точки входа. Выполните:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Зафиксируйте изменения как `openclaw.plugin.json`, так и `package.json`.

### `package.json openclaw.extensions must include ./dist/index.js`

Метаданные пакета указывают на другую точку входа среды выполнения. Выполните
`openclaw plugins build --entry ./dist/index.js`, чтобы генератор привёл
метаданные пакета в соответствие с точкой входа, которую вы намерены опубликовать.

### `Cannot find package 'typebox'`

Собранный Plugin импортирует `typebox` во время выполнения. Оставьте его в `dependencies`,
переустановите зависимости, повторно выполните сборку и проверку.

### Инструмент не появляется после установки

Проверьте следующее по порядку:

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. В `openclaw.plugin.json` раздел `contracts.tools` содержит ожидаемые имена инструментов.
4. В `package.json` указано `openclaw.extensions: ["./dist/index.js"]`.
5. После установки плагина Gateway был перезапущен или перезагружен.

## См. также

- [Создание плагинов](/ru/plugins/building-plugins)
- [Точки входа плагинов](/ru/plugins/sdk-entrypoints)
- [Подпути SDK плагинов](/ru/plugins/sdk-subpaths)
- [Манифест плагина](/ru/plugins/manifest)
- [CLI плагинов](/ru/cli/plugins)
- [Публикация в ClawHub](/ru/clawhub/publishing)
