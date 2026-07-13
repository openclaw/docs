---
read_when:
    - Вы добавляете мастер настройки в плагин
    - Нужно понимать различие между setup-entry.ts и index.ts
    - Вы определяете схемы конфигурации плагинов или метаданные openclaw в package.json
sidebarTitle: Setup and config
summary: Мастера настройки, setup-entry.ts, схемы конфигурации и метаданные package.json
title: Настройка и конфигурация плагина
x-i18n:
    generated_at: "2026-07-13T20:09:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 3b47e1f18a92871c442980168e302c82d7aa9a38b38bbbeed4add9dd6479365b
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Справочник по упаковке плагинов (метаданные `package.json`), манифестам (`openclaw.plugin.json`), точкам входа настройки и схемам конфигурации.

<Tip>
**Ищете пошаговое руководство?** Практические руководства рассматривают упаковку в контексте: [Плагины каналов](/ru/plugins/sdk-channel-plugins#step-1-package-and-manifest) и [Плагины провайдеров](/ru/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Метаданные пакета

Вашему `package.json` требуется поле `openclaw`, которое сообщает системе плагинов, какие возможности предоставляет ваш плагин:

<Tabs>
  <Tab title="Плагин канала">
    ```json
    {
      "name": "@myorg/openclaw-my-channel",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "setupEntry": "./setup-entry.ts",
        "channel": {
          "id": "my-channel",
          "label": "My Channel",
          "blurb": "Short description of the channel."
        }
      }
    }
    ```
  </Tab>
  <Tab title="Плагин провайдера / базовая конфигурация ClawHub">
    ```json openclaw-clawhub-package.json
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
  </Tab>
</Tabs>

<Note>
Для внешней публикации в ClawHub требуются `compat` и `build`. Канонические примеры команд публикации находятся в `docs/snippets/plugin-publish/`.
</Note>

### Поля `openclaw`

<ParamField path="extensions" type="string[]">
  Файлы точек входа (относительно корня пакета). Допустимые исходные точки входа для разработки в рабочей области и Git-репозитории.
</ParamField>
<ParamField path="runtimeExtensions" type="string[]">
  Собранные аналоги на JavaScript для `extensions`, которым отдаётся предпочтение, когда OpenClaw загружает установленный npm-пакет. Порядок разрешения исходных и собранных файлов описан в разделе [Точки входа SDK](/ru/plugins/sdk-entrypoints).
</ParamField>
<ParamField path="setupEntry" type="string">
  Облегчённая точка входа только для настройки (необязательно).
</ParamField>
<ParamField path="runtimeSetupEntry" type="string">
  Собранный аналог на JavaScript для `setupEntry`. Также требуется задать `setupEntry`.
</ParamField>
<ParamField path="plugin" type="object">
  Резервные идентификационные данные плагина `{ id, label }`, используемые, когда у плагина нет метаданных канала или провайдера, из которых можно получить идентификатор или название.
</ParamField>
<ParamField path="channel" type="object">
  Метаданные каталога каналов для настройки, средства выбора, быстрого старта и отображения состояния.
</ParamField>
<ParamField path="install" type="object">
  Параметры установки: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`, `requiredPlatformPackages`.
</ParamField>
<ParamField path="startup" type="object">
  Флаги поведения при запуске.
</ParamField>
<ParamField path="compat" type="object">
  Диапазон версий `pluginApi`, поддерживаемый этим плагином. Обязателен для внешних публикаций в ClawHub.
</ParamField>

<Note>
Идентификаторы провайдеров (`providers: string[]`) относятся к метаданным манифеста, а не пакета. Объявляйте их в `openclaw.plugin.json`, а не здесь — см. раздел [Манифест плагина](/ru/plugins/manifest).
</Note>

### `openclaw.channel`

`openclaw.channel` — это легковесные метаданные пакета для обнаружения каналов и интерфейсов настройки до загрузки среды выполнения.

| Поле                                  | Тип       | Значение                                                                 |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | Канонический идентификатор канала.                                                         |
| `label`                                | `string`   | Основное название канала.                                                        |
| `selectionLabel`                       | `string`   | Название в средстве выбора или настройке, если оно должно отличаться от `label`.                        |
| `detailLabel`                          | `string`   | Дополнительное название с подробностями для расширенных каталогов каналов и интерфейсов состояния.       |
| `docsPath`                             | `string`   | Путь к документации для ссылок настройки и выбора.                                      |
| `docsLabel`                            | `string`   | Переопределённое название для ссылок на документацию, если оно должно отличаться от идентификатора канала. |
| `blurb`                                | `string`   | Краткое описание для первоначальной настройки или каталога.                                         |
| `order`                                | `number`   | Порядок сортировки в каталогах каналов.                                               |
| `aliases`                              | `string[]` | Дополнительные псевдонимы для поиска при выборе канала.                                   |
| `preferOver`                           | `string[]` | Идентификаторы плагинов или каналов с более низким приоритетом, которые этот канал должен опережать.                |
| `systemImage`                          | `string`   | Необязательное имя значка или системного изображения для каталогов каналов в интерфейсе.                      |
| `selectionDocsPrefix`                  | `string`   | Текст-префикс перед ссылками на документацию в интерфейсах выбора.                          |
| `selectionDocsOmitLabel`               | `boolean`  | Показывать путь к документации непосредственно вместо именованной ссылки на неё в тексте выбора. |
| `selectionExtras`                      | `string[]` | Дополнительные короткие строки, добавляемые в текст выбора.                               |
| `markdownCapable`                      | `boolean`  | Помечает канал как поддерживающий Markdown для принятия решений о форматировании исходящих сообщений.      |
| `exposure`                             | `object`   | Параметры видимости канала в настройке, списках настроенных каналов и документации.   |
| `quickstartAllowFrom`                  | `boolean`  | Подключает канал к стандартному процессу быстрого старта `allowFrom`.         |
| `forceAccountBinding`                  | `boolean`  | Требовать явной привязки учётной записи, даже если существует только одна учётная запись.           |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Отдавать предпочтение поиску по сеансу при разрешении целей объявлений для этого канала.       |

Пример:

```json
{
  "openclaw": {
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "selectionLabel": "My Channel (self-hosted)",
      "detailLabel": "My Channel Bot",
      "docsPath": "/channels/my-channel",
      "docsLabel": "my-channel",
      "blurb": "Webhook-based self-hosted chat integration.",
      "order": 80,
      "aliases": ["mc"],
      "preferOver": ["my-channel-legacy"],
      "selectionDocsPrefix": "Guide:",
      "selectionExtras": ["Markdown"],
      "markdownCapable": true,
      "exposure": {
        "configured": true,
        "setup": true,
        "docs": true
      },
      "quickstartAllowFrom": true
    }
  }
}
```

`exposure` поддерживает:

- `configured`: включать канал в интерфейсы списков настроенных каналов и состояния
- `setup`: включать канал в интерактивные средства выбора при настройке и конфигурировании
- `docs`: помечать канал как общедоступный в документации и интерфейсах навигации

<Note>
`showConfigured` и `showInSetup` по-прежнему поддерживаются как устаревшие псевдонимы. Предпочтительно использовать `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` относится к метаданным пакета, а не манифеста.

| Поле                        | Тип                                | Значение                                                                     |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Каноническая спецификация ClawHub для установки, обновления и установки по требованию при первоначальной настройке. |
| `npmSpec`                    | `string`                            | Каноническая спецификация npm для резервных процессов установки и обновления.                             |
| `localPath`                  | `string`                            | Путь для локальной разработки или встроенной установки.                                        |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Предпочтительный источник установки при наличии нескольких источников.                     |
| `minHostVersion`             | `string`                            | Минимальная поддерживаемая версия OpenClaw, `>=x.y.z` или `>=x.y.z-prerelease`.            |
| `expectedIntegrity`          | `string`                            | Ожидаемая строка целостности дистрибутива npm, обычно `sha512-...`, для установок с закреплённой версией.    |
| `allowInvalidConfigRecovery` | `boolean`                           | Позволяет процессам переустановки встроенных плагинов восстанавливаться после определённых ошибок устаревшей конфигурации.  |
| `requiredPlatformPackages`   | `string[]`                          | Обязательные платформозависимые псевдонимы npm, проверяемые при установке через npm.               |

<AccordionGroup>
  <Accordion title="Поведение при первоначальной настройке">
    Интерактивная первоначальная настройка использует `openclaw.install` для интерфейсов установки по требованию: если ваш плагин предоставляет варианты аутентификации провайдера или метаданные настройки и каталога каналов до загрузки среды выполнения, первоначальная настройка может предложить установку из ClawHub, npm или локального источника, установить или включить плагин, а затем продолжить выбранный процесс. Варианты ClawHub используют `clawhubSpec`, и им отдаётся предпочтение при наличии; для вариантов npm требуются доверенные метаданные каталога со значением реестра `npmSpec` (точные версии и `expectedIntegrity` являются необязательными закреплениями, которые применяются при установке или обновлении, если заданы). Храните сведения о том, «что показывать», в `openclaw.plugin.json`, а о том, «как это установить», — в `package.json`.
  </Accordion>
  <Accordion title="Проверка minHostVersion">
    Если задано `minHostVersion`, оно проверяется как при установке, так и при загрузке реестра манифестов для невстроенных плагинов. Более старые хосты пропускают внешние плагины; недопустимые строки версий отклоняются. Предполагается, что версии встроенных исходных плагинов совпадают с версией рабочей копии хоста.
  </Accordion>
  <Accordion title="Установки npm с закреплённой версией">
    Для установок npm с закреплённой версией укажите точную версию в `npmSpec` и добавьте ожидаемое значение целостности артефакта:

    ```json
    {
      "openclaw": {
        "install": {
          "npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3",
          "expectedIntegrity": "sha512-REPLACE_WITH_NPM_DIST_INTEGRITY",
          "defaultChoice": "npm"
        }
      }
    }
    ```

  </Accordion>
  <Accordion title="Область действия allowInvalidConfigRecovery">
    `allowInvalidConfigRecovery` не является универсальным способом обхода ошибок в конфигурации. Он предназначен только для узкого сценария восстановления встроенного плагина, позволяя переустановке или настройке исправлять известные последствия обновления, например отсутствующий путь к встроенному плагину или устаревшую запись `channels.<id>` для того же плагина. Если конфигурация нарушена по несвязанным причинам, установка всё равно завершается с запретом по умолчанию и предлагает оператору выполнить `openclaw doctor --fix`.
  </Accordion>
</AccordionGroup>

### Отложенная полная загрузка

Плагины каналов могут включить отложенную загрузку с помощью:

```json
{
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

Когда эта возможность включена, OpenClaw загружает только `setupEntry` на этапе запуска до начала прослушивания, даже для уже настроенных каналов. Полная точка входа загружается после того, как Gateway начинает прослушивание.

<Warning>
Включайте отложенную загрузку, только если ваш `setupEntry` регистрирует всё необходимое Gateway до начала прослушивания (регистрацию канала, HTTP-маршруты, методы Gateway). Если полная точка входа предоставляет обязательные возможности запуска, сохраняйте поведение по умолчанию.
</Warning>

Если ваша установочная/полная точка входа регистрирует RPC-методы Gateway, используйте для них префикс конкретного плагина. Зарезервированные пространства имён администрирования ядра (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) остаются под управлением ядра и всегда нормализуются в `operator.admin`.

## Манифест плагина

Каждый нативный плагин должен содержать `openclaw.plugin.json` в корне пакета. OpenClaw использует его для проверки конфигурации без выполнения кода плагина.

```json
{
  "id": "my-plugin",
  "name": "Мой плагин",
  "description": "Добавляет возможности «Моего плагина» в OpenClaw",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "Секрет проверки Webhook"
      }
    }
  }
}
```

Для плагинов каналов добавьте `channels` (а для плагинов провайдеров — `providers`):

```json
{
  "id": "my-channel",
  "channels": ["my-channel"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

Даже плагины без конфигурации должны содержать схему. Допускается пустая схема:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Полное описание схемы см. в разделе [Манифест плагина](/ru/plugins/manifest).

## Публикация в ClawHub

Для пакетов Skills и плагинов используются разные команды публикации в ClawHub. Для пакетов плагинов используйте специальную команду пакета:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
`clawhub skill publish <path>` — это другая команда, предназначенная для публикации папки навыка, а не пакета плагина. См. раздел [Публикация в ClawHub](/ru/clawhub/publishing).
</Note>

## Установочная точка входа

`setup-entry.ts` — облегчённая альтернатива `index.ts`, которую OpenClaw загружает, когда требуются только установочные поверхности (первоначальная настройка, исправление конфигурации, проверка отключённого канала):

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Это позволяет не загружать тяжёлый код среды выполнения (криптографические библиотеки, регистрации CLI, фоновые службы) во время процессов установки.

Встроенные каналы рабочей области, хранящие безопасные для установки экспорты во вспомогательных модулях, могут использовать `defineBundledChannelSetupEntry(...)` из `openclaw/plugin-sdk/channel-entry-contract` вместо `defineSetupPluginEntry(...)`. Этот контракт для встроенных компонентов также поддерживает необязательный экспорт `runtime`, благодаря чему связывание среды выполнения на этапе установки остаётся облегчённым и явным.

<AccordionGroup>
  <Accordion title="Когда OpenClaw использует setupEntry вместо полной точки входа">
    - Канал отключён, но ему требуются поверхности установки/первоначальной настройки.
    - Канал включён, но не настроен.
    - Включена отложенная загрузка (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Что должен регистрировать setupEntry">
    - Объект плагина канала (через `defineSetupPluginEntry`).
    - Все HTTP-маршруты, необходимые до начала прослушивания Gateway.
    - Все методы Gateway, необходимые во время запуска.

    Эти методы Gateway, необходимые при запуске, всё равно не должны использовать зарезервированные пространства имён администрирования ядра, такие как `config.*` или `update.*`.

  </Accordion>
  <Accordion title="Что setupEntry НЕ должен включать">
    - Регистрации CLI.
    - Фоновые службы.
    - Тяжёлые импорты среды выполнения (криптографию, SDK).
    - Методы Gateway, необходимые только после запуска.

  </Accordion>
</AccordionGroup>

### Узкие импорты вспомогательных функций установки

Для часто вызываемых путей, используемых только при установке, предпочитайте узкие интерфейсы вспомогательных функций установки более широкому универсальному интерфейсу `plugin-sdk/setup`, если вам нужна только часть установочной поверхности:

| Путь импорта                        | Назначение                                                                                | Основные экспорты                                                                                                                                                                                                                                                                                                           |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | вспомогательные функции среды выполнения для этапа установки, остающиеся доступными в `setupEntry` / при отложенном запуске канала | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | устаревший псевдоним совместимости; используйте `plugin-sdk/setup-runtime`                            | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                 |
| `plugin-sdk/setup-tools`           | вспомогательные функции CLI, архива и документации для установки/инсталляции                                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

Используйте более широкий интерфейс `plugin-sdk/setup`, когда требуется полный общий набор инструментов установки, включая вспомогательные функции изменения конфигурации, такие как `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Используйте `createSetupTranslator(...)` для фиксированных текстов мастера установки. Он учитывает локаль мастера CLI (`OPENCLAW_LOCALE`, затем системные переменные локали) и при невозможности её определить использует английский язык. Храните текст установки, относящийся к конкретному плагину, в коде этого плагина, а общие ключи каталога используйте только для общих меток установки, текста состояния и установочных текстов официальных встроенных плагинов.

Импорт адаптеров изменений установки остаётся безопасным для часто вызываемых путей. Поиск поверхности контракта повышения встроенной конфигурации с одной учётной записью выполняется лениво, поэтому импорт `plugin-sdk/setup-runtime` не приводит к немедленной загрузке механизма обнаружения поверхности встроенного контракта до фактического использования адаптера.

### Управляемое каналом повышение конфигурации с одной учётной записью

Когда канал переходит от конфигурации одной учётной записи верхнего уровня к `channels.<id>.accounts.*`, общее поведение по умолчанию перемещает повышаемые значения, относящиеся к учётной записи, в `accounts.default`.

Встроенные каналы могут сузить или переопределить это повышение через свою поверхность установочного контракта:

- `singleAccountKeysToMove`: дополнительные ключи верхнего уровня, которые следует переместить в повышаемую учётную запись
- `namedAccountPromotionKeys`: если именованные учётные записи уже существуют, в повышаемую учётную запись перемещаются только эти ключи; общие ключи политики/доставки остаются в корне канала
- `resolveSingleAccountPromotionTarget(...)`: выбор существующей учётной записи, которая получит повышаемые значения

<Note>
Matrix — текущий встроенный пример. Если уже существует ровно одна именованная учётная запись Matrix или если `defaultAccount` указывает на существующий неканонический ключ, такой как `Ops`, повышение сохраняет эту учётную запись вместо создания новой записи `accounts.default`.
</Note>

## Схема конфигурации

Конфигурация плагина проверяется по JSON Schema из вашего манифеста. Пользователи настраивают плагины следующим образом:

```json5
{
  plugins: {
    entries: {
      "my-plugin": {
        config: {
          webhookSecret: "abc123",
        },
      },
    },
  },
}
```

При регистрации ваш плагин получает эту конфигурацию как `api.pluginConfig`.

Для конфигурации конкретного канала используйте вместо этого раздел конфигурации канала:

```json5
{
  channels: {
    "my-channel": {
      token: "bot-token",
      allowFrom: ["user1", "user2"],
    },
  },
}
```

### Создание схем конфигурации каналов

Используйте `buildChannelConfigSchema`, чтобы преобразовать схему Zod в обёртку `ChannelConfigSchema`, используемую артефактами конфигурации, принадлежащими плагину:

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/channel-config-schema";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

Если контракт уже описан в JSON Schema или TypeBox, используйте прямую вспомогательную функцию, чтобы OpenClaw мог пропустить преобразование Zod в JSON Schema на путях обработки метаданных:

```typescript
import { Type } from "typebox";
import { buildJsonChannelConfigSchema } from "openclaw/plugin-sdk/channel-config-schema";

const configSchema = buildJsonChannelConfigSchema(
  Type.Object({
    token: Type.Optional(Type.String()),
    allowFrom: Type.Optional(Type.Array(Type.String())),
  }),
);
```

Для сторонних плагинов контрактом для редко вызываемых путей по-прежнему служит манифест плагина: скопируйте созданную JSON Schema в `openclaw.plugin.json#channelConfigs`, чтобы поверхности конфигурации, установки и пользовательского интерфейса могли проверять `channels.<id>` без загрузки кода среды выполнения.

## Мастера установки

Плагины каналов могут предоставлять интерактивные мастера установки для `openclaw onboard`. Мастер представляет собой объект `ChannelSetupWizard` в `ChannelPlugin`:

```typescript
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/channel-setup";

const setupWizard: ChannelSetupWizard = {
  channel: "my-channel",
  status: {
    configuredLabel: "Подключено",
    unconfiguredLabel: "Не настроено",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "Токен бота",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "Использовать MY_CHANNEL_BOT_TOKEN из окружения?",
      keepPrompt: "Сохранить текущий токен?",
      inputPrompt: "Введите токен бота:",
      inspect: ({ cfg, accountId }) => {
        const token = (cfg.channels as any)?.["my-channel"]?.token;
        return {
          accountConfigured: Boolean(token),
          hasConfiguredValue: Boolean(token),
        };
      },
    },
  ],
};
```

`ChannelSetupWizard` также поддерживает `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` и другие возможности. Полный пример встроенного плагина см. в `src/setup-core.ts` плагина Discord.

<AccordionGroup>
  <Accordion title="Общие запросы allowFrom">
    Для запросов списка разрешённых отправителей личных сообщений, которым требуется только стандартный процесс `note -> prompt -> parse -> merge -> patch`, предпочитайте общие вспомогательные функции установки из `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` и `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Стандартное состояние установки канала">
    Для блоков состояния установки канала, различающихся только метками, оценками и необязательными дополнительными строками, предпочитайте `createStandardChannelSetupStatus(...)` из `openclaw/plugin-sdk/setup` вместо ручного создания одного и того же объекта `status` в каждом плагине.
  </Accordion>
  <Accordion title="Необязательная установочная поверхность канала">
    Для необязательных установочных поверхностей, которые должны отображаться только в определённых контекстах, используйте `createOptionalChannelSetupSurface` из `openclaw/plugin-sdk/channel-setup`:

    ```typescript
    import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

    const setupSurface = createOptionalChannelSetupSurface({
      channel: "my-channel",
      label: "Мой канал",
      npmSpec: "@myorg/openclaw-my-channel",
      docsPath: "/channels/my-channel",
    });
    // Возвращает { setupAdapter, setupWizard }
    ```

    `plugin-sdk/channel-setup` также предоставляет низкоуровневые конструкторы `createOptionalChannelSetupAdapter(...)` и `createOptionalChannelSetupWizard(...)`, когда вам нужна только одна часть этой поверхности опциональной установки.

    Сгенерированные опциональные адаптер и мастер запрещают реальные записи конфигурации при ошибке. Они повторно используют одно сообщение о необходимости установки в `validateInput`, `applyAccountConfig` и `finalize` и добавляют ссылку на документацию, когда задано `docsPath`.

  </Accordion>
  <Accordion title="Вспомогательные средства настройки на основе исполняемых файлов">
    Для интерфейсов настройки на основе исполняемых файлов предпочитайте общие вспомогательные средства делегирования вместо копирования одинаковой связующей логики для исполняемых файлов и состояния в каждый канал:

    - `createDetectedBinaryStatus(...)` для блоков состояния, различающихся только метками, подсказками, оценками и обнаружением исполняемого файла
    - `createCliPathTextInput(...)` для текстовых полей ввода на основе пути
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` и `createDelegatedResolveConfigured(...)`, когда `setupEntry` должен лениво перенаправлять управление более ресурсоёмкому полному мастеру
    - `createDelegatedTextInputShouldPrompt(...)`, когда `setupEntry` должен только делегировать решение `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Публикация и установка

**Внешние плагины:** опубликуйте в [ClawHub](/ru/clawhub), затем установите:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    Простые спецификации пакетов устанавливаются из npm во время перехода при запуске, если имя не совпадает с идентификатором встроенного или официального плагина; в этом случае OpenClaw вместо этого использует соответствующую локальную или официальную копию. Для детерминированного выбора источника используйте `clawhub:`, `npm:`, `git:` или `npm-pack:` — см. [Управление плагинами](/ru/plugins/manage-plugins).

  </Tab>
  <Tab title="Только ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="Спецификация пакета npm">
    Используйте npm, если пакет ещё не перенесён в ClawHub или если во время
    миграции вам требуется прямой путь установки из npm:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Плагины в репозитории:** размещайте их в дереве рабочего пространства встроенных плагинов; они автоматически обнаруживаются во время сборки.

<Info>
Для установок из npm `openclaw plugins install` устанавливает пакет в отдельный проект плагина в `~/.openclaw/npm/projects` с отключёнными сценариями жизненного цикла (`--ignore-scripts`). Используйте для деревьев зависимостей плагинов только JS/TS и избегайте пакетов, требующих сборок `postinstall`.
</Info>

<Note>
При запуске Gateway зависимости плагинов не устанавливаются. За согласование зависимостей отвечают процессы установки из npm, git и ClawHub; зависимости локальных плагинов должны быть установлены заранее.
</Note>

Метаданные встроенных пакетов задаются явно, а не выводятся из собранного JavaScript при запуске Gateway. Зависимости среды выполнения должны находиться в пакете плагина, которому они принадлежат; запуск упакованного OpenClaw никогда не восстанавливает и не зеркалирует зависимости плагинов.

## Связанные материалы

- [Создание плагинов](/ru/plugins/building-plugins) — пошаговое руководство по началу работы
- [Манифест плагина](/ru/plugins/manifest) — полный справочник по схеме манифеста
- [Точки входа SDK](/ru/plugins/sdk-entrypoints) — `definePluginEntry` и `defineChannelPluginEntry`
