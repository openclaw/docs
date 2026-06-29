---
read_when:
    - Вам нужна точная сигнатура типа defineToolPlugin, definePluginEntry или defineChannelPluginEntry
    - Вы хотите понять режим регистрации (полный, настройка или метаданные CLI)
    - Вы просматриваете варианты точки входа
sidebarTitle: Entry Points
summary: Справочник по defineToolPlugin, definePluginEntry, defineChannelPluginEntry и defineSetupPluginEntry
title: Точки входа Plugin
x-i18n:
    generated_at: "2026-06-28T23:32:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 49c024020202b754bde9bfa3f2a880332f1a5b4b19b397e59ae83c2673871211
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Каждый Plugin экспортирует объект входа по умолчанию. SDK предоставляет вспомогательные функции для
их создания.

Для установленных Plugin `package.json` должен направлять загрузку среды выполнения на собранный
JavaScript, когда он доступен:

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

`extensions` и `setupEntry` остаются допустимыми исходными точками входа для разработки в рабочей
области и checkout из git. `runtimeExtensions` и `runtimeSetupEntry` предпочтительны,
когда OpenClaw загружает установленный пакет, и позволяют npm-пакетам обходиться без компиляции
TypeScript во время выполнения. Явные точки входа среды выполнения обязательны: `runtimeSetupEntry`
требует `setupEntry`, а отсутствующие артефакты `runtimeExtensions` или `runtimeSetupEntry`
приводят к ошибке установки или обнаружения вместо тихого отката к исходникам. Если
установленный пакет объявляет только исходную точку входа TypeScript, OpenClaw использует
соответствующий собранный peer `dist/*.js`, если он существует, а затем откатится к исходникам
TypeScript.

Все пути входа должны оставаться внутри каталога пакета Plugin. Точки входа среды выполнения
и выведенные peer-файлы собранного JavaScript не делают допустимым исходный путь `extensions` или
`setupEntry`, выходящий за пределы пакета.

<Tip>
  **Ищете пошаговое руководство?** См. [Tool Plugins](/ru/plugins/tool-plugins),
  [Channel Plugins](/ru/plugins/sdk-channel-plugins) или
  [Provider Plugins](/ru/plugins/sdk-provider-plugins) для пошаговых руководств.
</Tip>

## `defineToolPlugin`

**Импорт:** `openclaw/plugin-sdk/tool-plugin`

Для простых Plugin, которые только добавляют инструменты агента. `defineToolPlugin` сохраняет
исходный код для авторинга небольшим, выводит типы конфигурации и параметров инструмента из схем
TypeBox, оборачивает простые возвращаемые значения в формат результата инструмента OpenClaw и
предоставляет статические метаданные, которые `openclaw plugins build` записывает в манифест
Plugin.

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

export default defineToolPlugin({
  id: "stock-quotes",
  name: "Stock Quotes",
  description: "Fetch stock quotes.",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "API key." })),
  }),
  tools: (tool) => [
    tool({
      name: "quote",
      label: "Quote",
      description: "Fetch a quote.",
      parameters: Type.Object({
        symbol: Type.String({ description: "Ticker symbol." }),
      }),
      execute: async ({ symbol }, config) => ({ symbol, hasKey: Boolean(config.apiKey) }),
    }),
  ],
});
```

- `configSchema` необязателен. Если он опущен, OpenClaw использует строгую схему пустого объекта,
  а сгенерированный манифест все равно включает `configSchema`.
- `execute` возвращает простую строку или JSON-сериализуемое значение. Вспомогательная функция
  оборачивает его как текстовый результат инструмента с `details`.
- Имена инструментов статичны. `openclaw plugins build` выводит `contracts.tools`
  из объявленных инструментов, поэтому авторам не нужно вручную дублировать имена.
- Загрузка среды выполнения остается строгой. Установленным Plugin по-прежнему нужны
  `openclaw.plugin.json` и `package.json` `openclaw.extensions`; OpenClaw не
  выполняет код Plugin для вывода отсутствующих данных манифеста.

## `definePluginEntry`

**Импорт:** `openclaw/plugin-sdk/plugin-entry`

Для provider Plugin, продвинутых tool Plugin, hook Plugin и всего, что
**не** является каналом сообщений.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Short summary",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
  },
});
```

| Поле          | Тип                                                              | Обязательно | По умолчанию        |
| ------------- | ---------------------------------------------------------------- | ----------- | ------------------- |
| `id`          | `string`                                                         | Да          | -                   |
| `name`        | `string`                                                         | Да          | -                   |
| `description` | `string`                                                         | Да          | -                   |
| `kind`        | `string`                                                         | Нет         | -                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Нет       | Схема пустого объекта |
| `register`    | `(api: OpenClawPluginApi) => void`                               | Да          | -                   |

- `id` должен совпадать с вашим манифестом `openclaw.plugin.json`.
- `kind` предназначен для эксклюзивных слотов: `"memory"` или `"context-engine"`.
- `configSchema` может быть функцией для ленивого вычисления.
- OpenClaw разрешает и мемоизирует эту схему при первом доступе, поэтому дорогостоящие
  построители схем запускаются только один раз.

## `defineChannelPluginEntry`

**Импорт:** `openclaw/plugin-sdk/channel-core`

Оборачивает `definePluginEntry` в канал-специфичную проводку. Автоматически вызывает
`api.registerChannel({ plugin })`, предоставляет необязательный шов метаданных CLI корневой справки
и ограничивает `registerFull` режимом регистрации.

```typescript
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineChannelPluginEntry({
  id: "my-channel",
  name: "My Channel",
  description: "Short summary",
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

| Поле                 | Тип                                                              | Обязательно | По умолчанию        |
| -------------------- | ---------------------------------------------------------------- | ----------- | ------------------- |
| `id`                 | `string`                                                         | Да          | -                   |
| `name`               | `string`                                                         | Да          | -                   |
| `description`        | `string`                                                         | Да          | -                   |
| `plugin`             | `ChannelPlugin`                                                  | Да          | -                   |
| `configSchema`       | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Нет         | Схема пустого объекта |
| `setRuntime`         | `(runtime: PluginRuntime) => void`                               | Нет         | -                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                              | Нет         | -                   |
| `registerFull`       | `(api: OpenClawPluginApi) => void`                               | Нет         | -                   |

- `setRuntime` вызывается во время регистрации, чтобы вы могли сохранить ссылку на среду выполнения
  (обычно через `createPluginRuntimeStore`). Он пропускается во время захвата метаданных CLI.
- `registerCliMetadata` выполняется во время `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"` и
  `api.registrationMode === "full"`.
  Используйте его как каноническое место для принадлежащих каналу дескрипторов CLI, чтобы корневая справка
  оставалась неактивирующей, снимки обнаружения включали статические метаданные команд, а
  обычная регистрация команд CLI оставалась совместимой с полной загрузкой Plugin.
- Регистрация обнаружения не активирует Plugin, но не свободна от импортов. OpenClaw может
  вычислять доверенную точку входа Plugin и модуль channel Plugin для построения
  снимка, поэтому держите импорты верхнего уровня без побочных эффектов и размещайте сокеты,
  клиенты, воркеры и сервисы за путями только для `"full"`.
- `registerFull` выполняется только когда `api.registrationMode === "full"`. Он пропускается
  при загрузке только для настройки.
- Как и `definePluginEntry`, `configSchema` может быть ленивой фабрикой, и OpenClaw
  мемоизирует разрешенную схему при первом доступе.
- Для принадлежащих Plugin корневых команд CLI предпочитайте `api.registerCli(..., { descriptors: [...] })`,
  когда хотите, чтобы команда оставалась лениво загружаемой и при этом не исчезала из
  корневого дерева разбора CLI. Для команд функций парных узлов предпочитайте
  `api.registerNodeCliFeature(...)`, чтобы команда попадала под `openclaw nodes`.
  Для других вложенных команд Plugin добавьте `parentPath` и регистрируйте команды на
  объекте `program`, переданном регистратору; OpenClaw разрешает его в
  родительскую команду перед вызовом Plugin. Для channel Plugin предпочитайте
  регистрировать эти дескрипторы из `registerCliMetadata(...)` и держать
  `registerFull(...)` сосредоточенным на работе только среды выполнения.
- Если `registerFull(...)` также регистрирует методы Gateway RPC, держите их на
  префиксе, специфичном для Plugin. Зарезервированные пространства имен администрирования ядра (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) всегда приводятся к
  `operator.admin`.

## `defineSetupPluginEntry`

**Импорт:** `openclaw/plugin-sdk/channel-core`

Для легковесного файла `setup-entry.ts`. Возвращает только `{ plugin }` без
среды выполнения или проводки CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw загружает его вместо полной точки входа, когда канал отключен,
не настроен или когда включена отложенная загрузка. См.
[Настройка и конфигурация](/ru/plugins/sdk-setup#setup-entry), чтобы понять, когда это важно.

На практике сочетайте `defineSetupPluginEntry(...)` с узкими семействами вспомогательных функций настройки:

- `openclaw/plugin-sdk/setup-runtime` для безопасных для среды выполнения вспомогательных функций настройки, таких как
  `createSetupTranslator`, import-safe адаптеры патчей настройки, вывод примечаний поиска,
  `promptResolvedAllowFrom`, `splitSetupEntries` и делегированные прокси настройки
- `openclaw/plugin-sdk/channel-setup` для поверхностей настройки optional-install
- `openclaw/plugin-sdk/setup-tools` для вспомогательных функций CLI/архива/документации настройки и установки

Держите тяжелые SDK, регистрацию CLI и долгоживущие сервисы среды выполнения в полной
точке входа.

Встроенные каналы рабочей области, которые разделяют поверхности настройки и среды выполнения, могут использовать
`defineBundledChannelSetupEntry(...)` из
`openclaw/plugin-sdk/channel-entry-contract`. Этот контракт позволяет
точке входа настройки сохранять безопасные для настройки экспорты Plugin/секретов, при этом все еще предоставляя
сеттер среды выполнения:

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
        /* setup-safe route */
      },
    });
  },
});
```

Используйте этот встроенный контракт только когда потокам настройки действительно нужен легковесный сеттер
среды выполнения или безопасная для настройки поверхность Gateway до загрузки полной точки входа канала.
`registerSetupRuntime` выполняется только для загрузок `"setup-runtime"`; ограничьте его
маршрутами или методами только для конфигурации, которые должны существовать до отложенной полной активации.

## Режим регистрации

`api.registrationMode` сообщает вашему Plugin, как он был загружен:

| Режим             | Когда                             | Что регистрировать                                                                                                            |
| ----------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | Обычный запуск Gateway            | Все                                                                                                                           |
| `"discovery"`     | Обнаружение возможностей только для чтения | Регистрация канала плюс статические дескрипторы CLI; код входа может загружаться, но пропускайте сокеты, воркеры, клиенты и сервисы |
| `"setup-only"`    | Отключенный/ненастроенный канал   | Только регистрация канала                                                                                                     |
| `"setup-runtime"` | Поток настройки с доступным рантаймом | Регистрация канала плюс только легковесный рантайм, необходимый до загрузки полного входа                                     |
| `"cli-metadata"`  | Корневая справка / сбор метаданных CLI | Только дескрипторы CLI                                                                                                        |

`defineChannelPluginEntry` обрабатывает это разделение автоматически. Если вы используете
`definePluginEntry` напрямую для канала, проверяйте режим самостоятельно:

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

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Heavy runtime-only registrations
  api.registerService(/* ... */);
}
```

Режим обнаружения создает неактивирующий снимок реестра. Он все еще может выполнять
вход Plugin и объект Plugin канала, чтобы OpenClaw мог зарегистрировать возможности
канала и статические дескрипторы CLI. Считайте выполнение модуля при обнаружении
доверенным, но легковесным: никаких сетевых клиентов, подпроцессов, слушателей, подключений
к базам данных, фоновых воркеров, чтения учетных данных или других побочных эффектов живого
рантайма на верхнем уровне.

Считайте `"setup-runtime"` окном, в котором поверхности запуска только для настройки должны
существовать без повторного входа в полный встроенный рантайм канала. Хорошо подходят
регистрация канала, безопасные для настройки HTTP-маршруты, безопасные для настройки методы
Gateway и делегированные помощники настройки. Тяжелые фоновые сервисы, регистраторы CLI и
инициализация SDK провайдеров/клиентов по-прежнему относятся к `"full"`.

Конкретно для регистраторов CLI:

- используйте `descriptors`, когда регистратор владеет одной или несколькими корневыми командами и вы
  хотите, чтобы OpenClaw лениво загружал настоящий модуль CLI при первом вызове
- убедитесь, что эти дескрипторы покрывают каждый корень команды верхнего уровня, предоставляемый
  регистратором
- ограничивайте имена команд в дескрипторах буквами, цифрами, дефисом и подчеркиванием,
  начиная с буквы или цифры; OpenClaw отклоняет имена дескрипторов вне
  этой формы и удаляет терминальные управляющие последовательности из описаний перед
  отображением справки
- используйте только `commands` лишь для путей энергичной совместимости

## Формы Plugin

OpenClaw классифицирует загруженные плагины по их поведению регистрации:

| Форма                 | Описание                                           |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Один тип возможности (например, только провайдер)  |
| **hybrid-capability** | Несколько типов возможностей (например, провайдер + речь) |
| **hook-only**         | Только хуки, без возможностей                      |
| **non-capability**    | Инструменты/команды/сервисы, но без возможностей   |

Используйте `openclaw plugins inspect <id>`, чтобы увидеть форму плагина.

## Связанные материалы

- [Обзор SDK](/ru/plugins/sdk-overview) - API регистрации и справочник подпутей
- [Помощники рантайма](/ru/plugins/sdk-runtime) - `api.runtime` и `createPluginRuntimeStore`
- [Настройка и конфигурация](/ru/plugins/sdk-setup) - манифест, вход настройки, отложенная загрузка
- [Plugin каналов](/ru/plugins/sdk-channel-plugins) - создание объекта `ChannelPlugin`
- [Plugin провайдеров](/ru/plugins/sdk-provider-plugins) - регистрация провайдера и хуки
