---
read_when:
    - Вам нужна точная сигнатура типа `defineToolPlugin`, `definePluginEntry` или `defineChannelPluginEntry`
    - Вы хотите понять режим регистрации (полный, настройка или метаданные CLI)
    - Вы просматриваете варианты точек входа
sidebarTitle: Entry Points
summary: Справочник по defineToolPlugin, definePluginEntry, defineChannelPluginEntry и defineSetupPluginEntry
title: Точки входа плагинов
x-i18n:
    generated_at: "2026-07-13T18:26:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: fba10e51604d6b83b5da265530565fddf3129c5a6e69c4f1a65d5455fe99ad83
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Каждый плагин экспортирует объект точки входа по умолчанию. SDK предоставляет вспомогательную функцию для
каждой формы точки входа: `defineToolPlugin`, `definePluginEntry`,
`defineChannelPluginEntry`, `defineSetupPluginEntry`.

<Tip>
  **Нужно пошаговое руководство?** См. [Плагины инструментов](/ru/plugins/tool-plugins),
  [Плагины каналов](/ru/plugins/sdk-channel-plugins) или
  [Плагины провайдеров](/ru/plugins/sdk-provider-plugins).
</Tip>

## Точки входа пакета

Установленные плагины указывают в полях `package.json` `openclaw` как исходные, так и
собранные точки входа:

```json
{
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "setupEntry": "./src/setup-entry.ts",
    "runtimeSetupEntry": "./dist/setup-entry.js"
  }
}
```

- `extensions` и `setupEntry` — исходные точки входа, используемые при разработке
  в рабочем пространстве и из рабочей копии git.
- `runtimeExtensions` и `runtimeSetupEntry` предпочтительны для установленных
  пакетов: они позволяют npm-пакетам не компилировать TypeScript во время выполнения.
- `runtimeExtensions`, если присутствует, должен совпадать с `extensions` по длине массива
  (точки входа попарно соответствуют друг другу по позиции). Для `runtimeSetupEntry` требуется `setupEntry`.
- Если артефакт `runtimeExtensions`/`runtimeSetupEntry` объявлен, но
  отсутствует, установка или обнаружение завершается ошибкой упаковки; OpenClaw не
  выполняет автоматический откат к исходному коду. Откат к исходному коду (см. ниже) применяется только тогда, когда
  точка входа среды выполнения вообще не объявлена.
- Если установленный пакет объявляет только исходную точку входа TypeScript, OpenClaw
  ищет соответствующую собранную точку входа `dist/*.js` (либо `.mjs`/`.cjs`) и использует её;
  в противном случае выполняется откат к исходному коду TypeScript.
- Все пути точек входа должны оставаться внутри каталога пакета плагина. Точки входа
  среды выполнения и автоматически определённые собранные JS-файлы не делают допустимым исходный путь `extensions` или
  `setupEntry`, выходящий за пределы каталога.

## `defineToolPlugin`

**Импорт:** `openclaw/plugin-sdk/tool-plugin`

Для плагинов, которые добавляют только инструменты агента. Сокращает исходный код, выводит типы конфигурации
и параметров инструментов из схем TypeBox, оборачивает обычные возвращаемые значения в
формат результата инструмента OpenClaw и предоставляет статические метаданные, которые
`openclaw plugins build` записывает в манифест плагина (`contracts.tools`,
`configSchema`).

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

export default defineToolPlugin({
  id: "stock-quotes",
  name: "Котировки акций",
  description: "Получение котировок акций.",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "Ключ API." })),
  }),
  tools: (tool) => [
    tool({
      name: "quote",
      label: "Котировка",
      description: "Получение котировки.",
      parameters: Type.Object({
        symbol: Type.String({ description: "Биржевой символ." }),
      }),
      execute: async ({ symbol }, config) => ({ symbol, hasKey: Boolean(config.apiKey) }),
    }),
  ],
});
```

- `configSchema` необязателен; если его опустить, используется строгая схема пустого объекта
  (созданный манифест всё равно содержит `configSchema`).
- `execute` возвращает обычную строку или сериализуемое в JSON значение; вспомогательная функция
  оборачивает его в текстовый результат инструмента, задавая для `details` исходное
  (не преобразованное в строку) возвращаемое значение.
- Для пользовательских результатов инструментов `openclaw/plugin-sdk/tool-results` экспортирует
  `textResult` и `jsonResult`.
- Имена инструментов статичны, поэтому `openclaw plugins build` формирует
  `contracts.tools` из объявленных инструментов без ручного дублирования имён.
- Загрузка среды выполнения остаётся строгой: установленным плагинам по-прежнему необходимы
  `openclaw.plugin.json` и `package.json` `openclaw.extensions`. OpenClaw
  никогда не выполняет код плагина для определения отсутствующих данных манифеста.

## `definePluginEntry`

**Импорт:** `openclaw/plugin-sdk/plugin-entry`

Для плагинов провайдеров, расширенных плагинов инструментов, плагинов перехватчиков и всего,
что **не является** каналом обмена сообщениями.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "Мой плагин",
  description: "Краткое описание",
  register(api) {
    api.registerProvider({/* ... */});
    api.registerTool({/* ... */});
  },
});
```

| Поле                      | Тип                                                              | Обязательно | Значение по умолчанию |
| ------------------------- | ---------------------------------------------------------------- | ----------- | --------------------- |
| `id`                      | `string`                                                         | Да          | -                     |
| `name`                    | `string`                                                         | Да          | -                     |
| `description`             | `string`                                                         | Да          | -                     |
| `kind`                    | `string` (устарело, см. ниже)                                    | Нет         | -                     |
| `configSchema`            | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Нет         | Схема пустого объекта |
| `reload`                  | `OpenClawPluginReloadRegistration`                               | Нет         | -                     |
| `nodeHostCommands`        | `OpenClawPluginNodeHostCommand[]`                                | Нет         | -                     |
| `securityAuditCollectors` | `OpenClawPluginSecurityAuditCollector[]`                         | Нет         | -                     |
| `register`                | `(api: OpenClawPluginApi) => void`                               | Да          | -                     |

- `id` должен соответствовать вашему манифесту `openclaw.plugin.json`.
- Внешние каталоги сеансов используют
  `openclaw/plugin-sdk/session-catalog` и
  `api.registerSessionCatalog({ id, label, list, read, continueSession?, archive? })`.
  Основной модуль отвечает за методы Gateway `sessions.catalog.*`; провайдеры возвращают проекции узла,
  сеанса и нормализованной расшифровки, не регистрируя RPC.
- `kind` устарел: вместо него объявите эксклюзивный слот (`"memory"` или
  `"context-engine"`) в поле `kind` манифеста `openclaw.plugin.json`.
  `kind` в точке входа среды выполнения сохраняется только как резервный механизм совместимости для
  старых плагинов.
- `configSchema` может быть функцией для отложенного вычисления. OpenClaw разрешает и
  мемоизирует схему при первом обращении, поэтому ресурсоёмкие построители схем выполняются
  только один раз.
- Дескриптор `nodeHostCommands` может определять `isAvailable({ config, env })`.
  Возврат `false` исключает эту команду и её возможность из объявления Gateway
  безголового узла. OpenClaw вычисляет это значение с использованием локальной
  конфигурации запуска узла; обработчики команд всё равно должны проверять доступность
  при вызове.

## `defineChannelPluginEntry`

**Импорт:** `openclaw/plugin-sdk/channel-core`

Дополняет `definePluginEntry` подключением, специфичным для канала: автоматически
вызывает `api.registerChannel({ plugin })`, предоставляет необязательную точку расширения метаданных CLI
для корневой справки и ограничивает `registerFull` режимом регистрации.

```typescript
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineChannelPluginEntry({
  id: "my-channel",
  name: "Мой канал",
  description: "Краткое описание",
  plugin: myChannelPlugin,
  setRuntime: setMyRuntime,
  registerCliMetadata(api) {
    api.registerCli(/* ... */);
  },
  registerFull(api) {
    api.registerGatewayMethod(/* ... */);
  },
});
```

| Поле                  | Тип                                                              | Обязательно | Значение по умолчанию |
| --------------------- | ---------------------------------------------------------------- | ----------- | --------------------- |
| `id`                  | `string`                                                         | Да          | -                     |
| `name`                | `string`                                                         | Да          | -                     |
| `description`         | `string`                                                         | Да          | -                     |
| `plugin`              | `ChannelPlugin`                                                  | Да          | -                     |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Нет         | Схема пустого объекта |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Нет         | -                     |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Нет         | -                     |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Нет         | -                     |

Обратные вызовы выполняются в зависимости от режима регистрации (полная таблица приведена в разделе
[Режим регистрации](#registration-mode)):

- `setRuntime` выполняется во всех режимах, кроме `"cli-metadata"` и
  `"tool-discovery"`. Сохраните здесь ссылку на среду выполнения, обычно через
  `createPluginRuntimeStore`.
- `registerCliMetadata` выполняется для `"cli-metadata"`, `"discovery"` и
  `"full"`. Используйте его как каноническое место для принадлежащих каналу дескрипторов CLI,
  чтобы корневая справка не активировала плагин, снимки обнаружения содержали статические
  метаданные команд, а обычная регистрация CLI сохраняла совместимость с полной
  загрузкой плагина.
- `registerFull` выполняется только для `"full"` и `"tool-discovery"`. Для
  `"tool-discovery"` он выполняется _вместо_ регистрации канала: OpenClaw
  полностью пропускает `registerChannel`/`setRuntime` и вызывает только
  `registerFull`, поэтому вся регистрация провайдеров или инструментов, необходимая каналу для
  автономного обнаружения или выполнения инструментов, должна находиться там, а не за обычной
  настройкой канала.
- Регистрация обнаружения не активирует плагин, но выполняет импорты: OpenClaw может
  вычислять доверенную точку входа плагина и модуль плагина канала для создания
  снимка. Импорты верхнего уровня не должны иметь побочных эффектов; сокеты,
  клиенты, рабочие процессы и службы следует размещать только в путях `"full"`.
- Как и `definePluginEntry`, `configSchema` может быть отложенной фабрикой; OpenClaw
  мемоизирует разрешённую схему при первом обращении.

Регистрация CLI:

- Используйте `api.registerCli(..., { descriptors: [...] })` для принадлежащих плагину корневых
  команд CLI, которые должны загружаться отложенно, но не исчезать из корневого дерева
  разбора CLI. Имена дескрипторов должны состоять из букв, цифр, дефисов и
  символов подчёркивания и начинаться с буквы или цифры; OpenClaw отклоняет другие
  формы и удаляет управляющие последовательности терминала из описаний перед
  отображением справки. Охватите каждый корень команды верхнего уровня, предоставляемый регистратором.
  Только `commands` остаётся на немедленно загружаемом пути совместимости.
- Используйте `api.registerNodeCliFeature(...)` для команд возможностей сопряжённого узла, чтобы
  они размещались в `openclaw nodes` (эквивалентно
  `registerCli(registrar, { parentPath: ["nodes"], ... })`).
- Для других вложенных команд плагина добавьте `parentPath` и регистрируйте команды
  в объекте `program`, переданном регистратору; OpenClaw разрешает его в
  родительскую команду перед вызовом плагина.
- Для плагинов каналов регистрируйте дескрипторы CLI из `registerCliMetadata`,
  а `registerFull` используйте только для работы, связанной со средой выполнения.
- Если `registerFull` также регистрирует методы RPC Gateway, используйте для них
  префикс, специфичный для плагина. Зарезервированные пространства имён администрирования основного модуля (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) всегда принудительно преобразуются в
  `operator.admin`.

## `defineSetupPluginEntry`

**Импорт:** `openclaw/plugin-sdk/channel-core`

Для облегчённого файла `setup-entry.ts`. Возвращает только `{ plugin }`, без
подключения среды выполнения или CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw загружает эту точку входа вместо полной, когда канал отключён,
не настроен или включена отложенная загрузка. Подробнее о том, когда это важно, см.
в разделе [Настройка и конфигурация](/ru/plugins/sdk-setup#setup-entry).

Сочетайте `defineSetupPluginEntry(...)` с узкими семействами вспомогательных средств настройки:

| Импорт                              | Назначение                                                                                                                                                                            |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/setup-runtime` | Безопасные для среды выполнения вспомогательные средства настройки: `createSetupTranslator`, безопасные для импорта адаптеры исправлений настройки, вывод примечаний поиска, `promptResolvedAllowFrom`, `splitSetupEntries`, делегированные прокси настройки |
| `openclaw/plugin-sdk/channel-setup` | Интерфейсы настройки для необязательной установки                                                                                                                                                    |
| `openclaw/plugin-sdk/setup-tools`   | Вспомогательные средства CLI, архивов и документации для настройки и установки                                                                                                                                       |

Оставляйте ресурсоёмкие SDK, регистрацию CLI и долгоживущие службы среды выполнения в
полной точке входа.

Встроенные каналы рабочей области, разделяющие интерфейсы настройки и среды выполнения, могут вместо этого использовать
`defineBundledChannelSetupEntry(...)` из
`openclaw/plugin-sdk/channel-entry-contract`. Это позволяет точке входа
настройки сохранять безопасные для настройки экспорты плагина и секретов, при этом предоставляя сеттер среды
выполнения:

```typescript
import { defineBundledChannelSetupEntry } from "openclaw/plugin-sdk/channel-entry-contract";

export default defineBundledChannelSetupEntry({
  importMetaUrl: import.meta.url,
  plugin: {
    specifier: "./channel-plugin-api.js",
    exportName: "myChannelPlugin",
  },
  runtime: {
    specifier: "./runtime-api.js",
    exportName: "setMyChannelRuntime",
  },
  registerSetupRuntime(api) {
    api.registerHttpRoute({
      path: "/my-channel/events",
      auth: "plugin",
      handler: async (req, res) => {
        /* безопасный для настройки маршрут */
      },
    });
  },
});
```

Используйте это только тогда, когда процессу настройки действительно требуется облегчённый сеттер среды выполнения или
безопасный для настройки интерфейс Gateway до загрузки полной точки входа канала.
`registerSetupRuntime` выполняется только при загрузках `"setup-runtime"`; ограничивайте его
маршрутами или методами только для конфигурации, которые должны существовать до отложенной
полной активации.

## Режим регистрации

`api.registrationMode` сообщает плагину, как он был загружен:

| Режим               | Когда                                               | Что регистрировать                                                                                                        |
| ------------------ | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`           | Обычный запуск Gateway                             | Всё                                                                                                              |
| `"discovery"`      | Обнаружение возможностей только для чтения                     | Регистрацию канала и статические дескрипторы CLI; код точки входа может загружаться, но не должен запускать сокеты, обработчики, клиенты и службы |
| `"tool-discovery"` | Ограниченная загрузка для перечисления или запуска инструментов определённых плагинов | Только регистрацию возможностей и инструментов; без активации канала                                                                |
| `"setup-only"`     | Отключённый или ненастроенный канал                      | Только регистрацию канала                                                                                               |
| `"setup-runtime"`  | Процесс настройки с доступной средой выполнения                  | Регистрацию канала и только облегчённую среду выполнения, необходимую до загрузки полной точки входа                               |
| `"cli-metadata"`   | Сбор метаданных корневой справки или CLI                   | Только дескрипторы CLI                                                                                                    |

`defineChannelPluginEntry` обрабатывает это разделение автоматически. Если вы используете
`definePluginEntry` непосредственно для канала, проверяйте режим самостоятельно и помните,
что `"tool-discovery"` пропускает регистрацию канала:

```typescript
register(api) {
  if (
    api.registrationMode === "cli-metadata" ||
    api.registrationMode === "discovery" ||
    api.registrationMode === "full"
  ) {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  if (api.registrationMode === "tool-discovery") {
    // Регистрировать только интерфейсы возможностей (провайдеры/инструменты), без канала.
    return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Ресурсоёмкие регистрации только для среды выполнения
  api.registerService(/* ... */);
}
```

Режим обнаружения создаёт снимок реестра без активации. При этом всё ещё могут
вычисляться точка входа плагина и объект плагина канала, чтобы OpenClaw мог
зарегистрировать возможности канала и статические дескрипторы CLI. Считайте вычисление
модуля при обнаружении доверенным, но облегчённым: никаких сетевых клиентов,
подпроцессов, слушателей, подключений к базе данных, фоновых обработчиков,
чтения учётных данных и других активных побочных эффектов среды выполнения на верхнем уровне.

Считайте `"setup-runtime"` периодом, когда интерфейсы запуска только для настройки должны
существовать без повторного входа в полную среду выполнения встроенного канала. Хорошо подходят
регистрация канала, безопасные для настройки HTTP-маршруты, безопасные для настройки методы Gateway
и делегированные вспомогательные средства настройки. Ресурсоёмкие фоновые службы, регистраторы CLI и
инициализация SDK провайдеров и клиентов по-прежнему должны находиться в `"full"`.

## Формы плагинов

OpenClaw классифицирует загруженные плагины по их поведению при регистрации:

| Форма                 | Описание                                        |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Один тип возможности (например, только провайдер)           |
| **hybrid-capability** | Несколько типов возможностей (например, провайдер и речь) |
| **hook-only**         | Только хуки, без возможностей                        |
| **non-capability**    | Инструменты, команды и службы, но без возможностей        |

Используйте `openclaw plugins inspect <id>`, чтобы узнать форму плагина.

## Связанные материалы

- [Обзор SDK](/ru/plugins/sdk-overview) — API регистрации и справочник подпутей
- [Вспомогательные средства среды выполнения](/ru/plugins/sdk-runtime) — `api.runtime` и `createPluginRuntimeStore`
- [Настройка и конфигурация](/ru/plugins/sdk-setup) — манифест, точка входа настройки, отложенная загрузка
- [Плагины каналов](/ru/plugins/sdk-channel-plugins) — создание объекта `ChannelPlugin`
- [Плагины провайдеров](/ru/plugins/sdk-provider-plugins) — регистрация провайдеров и хуки
