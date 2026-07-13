---
read_when:
    - Вы хотите создать простой плагин OpenClaw, который лишь добавляет инструменты агента
    - Вы хотите использовать defineToolPlugin вместо написания метаданных манифеста плагина вручную
    - Вам нужно создать каркас, сгенерировать, проверить, протестировать или опубликовать плагин, содержащий только инструменты
sidebarTitle: Tool Plugins
summary: Создавайте простые типизированные инструменты агента с помощью defineToolPlugin и openclaw plugins init/build/validate
title: Плагины инструментов
x-i18n:
    generated_at: "2026-07-13T20:10:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: fb9187e1d8aed88eee5c99dcdce89f70cd0d4f930b97aaac2ff868037d63adc1
    source_path: plugins/tool-plugins.md
    workflow: 16
---

`defineToolPlugin` создаёт плагин, который добавляет только инструменты, вызываемые агентом: без
канала, поставщика моделей, обработчика, службы или серверной части настройки. Он создаёт
метаданные манифеста, необходимые OpenClaw для обнаружения инструментов без загрузки
кода среды выполнения плагина.

Для плагинов поставщиков, каналов, обработчиков, служб или плагинов со смешанными возможностями начните с
[Создание плагинов](/ru/plugins/building-plugins), [Плагины каналов](/ru/plugins/sdk-channel-plugins)
или [Плагины поставщиков](/ru/plugins/sdk-provider-plugins).

## Требования

- Node 22.22.3+, Node 24.15+ или Node 25.9+.
- Выходной пакет TypeScript ESM.
- `typebox` в `dependencies` (не только в `devDependencies` — созданный
  плагин импортирует его во время выполнения).
- `openclaw >=2026.5.17` — первая версия, экспортирующая
  `openclaw/plugin-sdk/tool-plugin`.
- Корень пакета, содержащий `dist/`, `openclaw.plugin.json` и
  `package.json`.

## Быстрый старт

```bash
openclaw plugins init stock-quotes --name "Котировки акций"
cd stock-quotes
npm install
npm run plugin:build
npm run plugin:validate
npm test
```

`plugins init` создаёт:

| Файл                   | Назначение                                                           |
| ---------------------- | ----------------------------------------------------------------- |
| `src/index.ts`         | Точка входа `defineToolPlugin` с одним инструментом `echo`                     |
| `src/index.test.ts`    | Тест метаданных, проверяющий список инструментов                             |
| `tsconfig.json`        | Выходные данные NodeNext TypeScript в `dist/`                             |
| `vitest.config.ts`     | Конфигурация Vitest для `src/**/*.test.ts`                              |
| `package.json`         | Скрипты, зависимости среды выполнения, `openclaw.extensions: ["./dist/index.js"]` |
| `openclaw.plugin.json` | Созданные метаданные манифеста для исходного инструмента                  |

`npm run plugin:build` запускает `npm run build` (tsc), а затем
`openclaw plugins build --entry ./dist/index.js`. `npm run plugin:validate`
повторно выполняет сборку и запускает `openclaw plugins validate --entry ./dist/index.js`.
При успешной проверке выводится:

```text
Плагин stock-quotes действителен.
```

Параметры `openclaw plugins init <id>`:

| Флаг                 | Значение по умолчанию            | Действие                                 |
| -------------------- | ------------------ | -------------------------------------- |
| `--directory <path>` | `<id>`             | Каталог вывода                       |
| `--name <name>`      | `<id>` в заглавном регистре | Отображаемое имя                           |
| `--type <type>`      | `tool`             | Тип шаблона: `tool` или `provider`    |
| `--force`            | выключено                | Перезаписать существующий каталог вывода |

## Написание инструмента

`defineToolPlugin` принимает идентификационные данные плагина, необязательную схему конфигурации и
статический список инструментов. Типы параметров и конфигурации выводятся из
схем TypeBox.

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

export default defineToolPlugin({
  id: "stock-quotes",
  name: "Котировки акций",
  description: "Получение снимков котировок акций.",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "Ключ API котировок." })),
    baseUrl: Type.Optional(Type.String({ description: "Базовый URL API котировок." })),
  }),
  tools: (tool) => [
    tool({
      name: "stock_quote",
      label: "Котировка акции",
      description: "Получение снимка котировки акции.",
      parameters: Type.Object({
        symbol: Type.String({ description: "Биржевой символ, например OPEN." }),
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
достаточно конкретные, чтобы избежать конфликтов с основными инструментами или другими плагинами.

## Необязательные инструменты и фабрики инструментов

Задайте `optional: true`, если пользователи должны явно добавить инструмент в список разрешённых, прежде чем он
будет отправлен модели. `openclaw plugins build` записывает соответствующую
запись манифеста `toolMetadata.<tool>.optional`, поэтому OpenClaw может определить, что
инструмент является необязательным, без загрузки кода среды выполнения плагина.

```typescript
tool({
  name: "workflow_run",
  description: "Запуск внешнего рабочего процесса.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  execute: ({ goal }) => ({ queued: true, goal }),
});
```

Используйте `factory`, когда для создания инструмента требуется контекст инструмента среды выполнения —
чтобы отказаться от него для конкретного запуска, проверить состояние песочницы или привязать
вспомогательные функции среды выполнения. Метаданные остаются статическими, хотя конкретный инструмент создаётся
во время выполнения.

```typescript
tool({
  name: "local_workflow",
  description: "Запуск локального рабочего процесса вне изолированных сеансов.",
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
напрямую, когда плагин динамически вычисляет имена инструментов или объединяет инструменты
с обработчиками, службами, поставщиками или командами.

## Возвращаемые значения

`defineToolPlugin` оборачивает обычные возвращаемые значения в формат результата инструмента
OpenClaw:

- Возвращайте строку, если модель должна увидеть именно этот текст.
- Возвращайте JSON-совместимое значение, если модель должна увидеть форматированный JSON,
  а OpenClaw — сохранить исходное значение в `details`.

```typescript
tool({
  name: "echo_text",
  description: "Повторение входного текста.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => input,
});
```

```typescript
tool({
  name: "echo_json",
  description: "Повторение входных данных в виде структурированного JSON.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => ({ input, length: input.length }),
});
```

Используйте фабрику инструментов, когда требуется пользовательский `AgentToolResult` или необходимо повторно использовать
существующую реализацию `api.registerTool`.

## Конфигурация

`configSchema` является необязательной. Если её опустить, OpenClaw применит строгую схему пустого объекта;
созданный манифест всё равно будет содержать `configSchema`.

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "Инструменты без конфигурации",
  description: "Добавляет инструменты, которым не требуется конфигурация.",
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
  name: "Настроенные инструменты",
  description: "Добавляет настроенные инструменты.",
  configSchema,
  tools: (tool) => [
    tool({
      name: "configured_ping",
      description: "Проверка доступности конфигурации.",
      parameters: Type.Object({}),
      execute: (_params, config) => ({ hasKey: config.apiKey.length > 0 }),
    }),
  ],
});
```

OpenClaw считывает конфигурацию плагина из записи плагина в конфигурации Gateway. Не
указывайте секреты непосредственно в исходном коде или примерах документации; используйте конфигурацию, переменные
окружения или SecretRefs в соответствии с моделью безопасности плагина.

## Созданные метаданные

OpenClaw должен прочитать манифест плагина до импорта кода среды выполнения плагина.
`defineToolPlugin` предоставляет для этого статические метаданные, а
`openclaw plugins build` записывает их в пакет. Повторно запускайте генератор после
изменения идентификатора, имени, описания, схемы конфигурации, активации или имён
инструментов плагина:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Созданный манифест для плагина с одним инструментом:

```json
{
  "id": "stock-quotes",
  "name": "Котировки акций",
  "description": "Получение снимков котировок акций.",
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
плагину принадлежит каждый инструмент, без загрузки среды выполнения каждого установленного плагина. Из-за
устаревшего манифеста инструмент может отсутствовать при обнаружении либо ошибка регистрации
может быть ошибочно приписана другому плагину.

## Метаданные пакета

`openclaw plugins build` также согласует `package.json` с выбранной точкой входа
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

Публикуйте собранный JavaScript (`./dist/index.js`), а не точку входа исходного кода TypeScript.
Точки входа исходного кода работают только при локальной разработке в рабочей области.

## Проверка в CI

`plugins build --check` завершается с ошибкой без перезаписи файлов, если созданные метаданные
устарели:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
npm test
```

`plugins validate` проверяет следующее:

- `openclaw.plugin.json` существует и проходит обычную загрузку манифеста.
- Текущая точка входа экспортирует метаданные `defineToolPlugin`.
- Поля созданного манифеста соответствуют метаданным точки входа.
- `contracts.tools` соответствует объявленным именам инструментов.
- `package.json` направляет `openclaw.extensions` на выбранную точку входа среды выполнения.

## Локальная установка и проверка

Из отдельной копии OpenClaw или установленного CLI установите пакет по его пути:

```bash
openclaw plugins install ./stock-quotes
openclaw plugins inspect stock-quotes --runtime
```

Для проверки упакованной версии сначала создайте пакет и установите tar-архив:

```bash
npm pack
openclaw plugins install npm-pack:./openclaw-plugin-stock-quotes-0.1.0.tgz
openclaw plugins inspect stock-quotes --runtime --json
```

После установки перезапустите или перезагрузите Gateway и попросите агента использовать
инструмент. Если инструмент не отображается, проверьте среду выполнения плагина и действующий
каталог инструментов, прежде чем изменять код (см. [Устранение неполадок](#troubleshooting)).

## Публикация

Когда пакет будет готов, опубликуйте его через ClawHub. `clawhub package publish`
принимает источник: локальную папку, репозиторий GitHub (`owner/repo[@ref]`) или
URL tar-архива.

```bash
clawhub package publish ./stock-quotes --dry-run
clawhub package publish ./stock-quotes
```

Установите с явным указателем ClawHub:

```bash
openclaw plugins install clawhub:your-org/stock-quotes
```

Спецификации пакетов npm без префикса по-прежнему устанавливаются из npm во время перехода при запуске, но
ClawHub является предпочтительной системой обнаружения и распространения плагинов
OpenClaw. Сведения об области владельца и проверке
выпуска см. в разделе [Публикация в ClawHub](/ru/clawhub/publishing).

## Устранение неполадок

### `plugin entry not found: ./dist/index.js`

Выбранный файл точки входа не существует. Запустите `npm run build`, затем повторно запустите
`openclaw plugins build --entry ./dist/index.js` или
`openclaw plugins validate --entry ./dist/index.js`.

### `plugin entry does not expose defineToolPlugin metadata`

Точка входа не экспортировала значение, созданное `defineToolPlugin`. Убедитесь, что
экспорт модуля по умолчанию является результатом `defineToolPlugin(...)`, либо передайте
правильную точку входа с помощью `--entry`.

### `openclaw.plugin.json generated metadata is stale`

Манифест больше не соответствует метаданным точки входа. Выполните:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Зафиксируйте изменения как `openclaw.plugin.json`, так и `package.json`.

### `package.json openclaw.extensions must include ./dist/index.js`

Метаданные пакета указывают на другую точку входа среды выполнения. Запустите
`openclaw plugins build --entry ./dist/index.js`, чтобы генератор согласовал
метаданные пакета с точкой входа, которую вы намерены опубликовать.

### `Cannot find package 'typebox'`

Собранный плагин импортирует `typebox` во время выполнения. Оставьте его в `dependencies`,
повторно установите зависимости, выполните сборку и снова запустите проверку.

### Инструмент не отображается после установки

Проверьте следующее по порядку:

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. `openclaw.plugin.json` содержит `contracts.tools` с ожидаемыми именами инструментов.
4. `package.json` содержит `openclaw.extensions: ["./dist/index.js"]`.
5. Gateway был перезапущен или перезагружен после установки плагина.

## См. также

- [Создание плагинов](/ru/plugins/building-plugins)
- [Точки входа плагинов](/ru/plugins/sdk-entrypoints)
- [Подпути SDK плагинов](/ru/plugins/sdk-subpaths)
- [Манифест плагина](/ru/plugins/manifest)
- [CLI плагинов](/ru/cli/plugins)
- [Публикация в ClawHub](/ru/clawhub/publishing)
