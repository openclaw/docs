---
read_when:
    - Вы добавляете мастер настройки в плагин
    - Вам нужно понимать разницу между setup-entry.ts и index.ts
    - Вы определяете схемы конфигурации плагинов или метаданные openclaw в package.json
sidebarTitle: Setup and config
summary: Мастера настройки, setup-entry.ts, схемы конфигурации и метаданные package.json
title: Настройка и конфигурация Plugin
x-i18n:
    generated_at: "2026-07-12T11:44:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3b47e1f18a92871c442980168e302c82d7aa9a38b38bbbeed4add9dd6479365b
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Справочная информация об упаковке плагинов (метаданные `package.json`), манифестах (`openclaw.plugin.json`), точках входа настройки и схемах конфигурации.

<Tip>
**Ищете пошаговое руководство?** Практические руководства рассматривают упаковку в контексте: [плагины каналов](/ru/plugins/sdk-channel-plugins#step-1-package-and-manifest) и [плагины провайдеров](/ru/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Метаданные пакета

В вашем `package.json` должно быть поле `openclaw`, которое сообщает системе плагинов, какие возможности предоставляет ваш плагин:

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
Для внешней публикации в ClawHub требуются `compat` и `build`. Канонические фрагменты для публикации находятся в `docs/snippets/plugin-publish/`.
</Note>

### Поля `openclaw`

<ParamField path="extensions" type="string[]">
  Файлы точек входа (относительно корня пакета). Допустимые исходные точки входа для разработки в рабочей области и из рабочей копии Git.
</ParamField>
<ParamField path="runtimeExtensions" type="string[]">
  Собранные JavaScript-аналоги для `extensions`, предпочтительные при загрузке OpenClaw установленного пакета npm. Порядок разрешения исходных и собранных файлов описан в разделе [Точки входа SDK](/ru/plugins/sdk-entrypoints).
</ParamField>
<ParamField path="setupEntry" type="string">
  Облегчённая точка входа только для настройки (необязательно).
</ParamField>
<ParamField path="runtimeSetupEntry" type="string">
  Собранный JavaScript-аналог для `setupEntry`. Также требуется задать `setupEntry`.
</ParamField>
<ParamField path="plugin" type="object">
  Резервные идентификационные данные плагина `{ id, label }`, используемые, когда у плагина нет метаданных канала или провайдера, из которых можно получить идентификатор или название.
</ParamField>
<ParamField path="channel" type="object">
  Метаданные каталога каналов для настройки, выбора, быстрого запуска и отображения состояния.
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
Идентификаторы провайдеров (`providers: string[]`) относятся к метаданным манифеста, а не пакета. Объявляйте их в `openclaw.plugin.json`, а не здесь — см. [Манифест плагина](/ru/plugins/manifest).
</Note>

### `openclaw.channel`

`openclaw.channel` — это легковесные метаданные пакета для обнаружения каналов и интерфейсов настройки до загрузки среды выполнения.

| Поле                                   | Тип        | Значение                                                                      |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | Канонический идентификатор канала.                                             |
| `label`                                | `string`   | Основное название канала.                                                      |
| `selectionLabel`                       | `string`   | Название в интерфейсе выбора и настройки, если оно должно отличаться от `label`. |
| `detailLabel`                          | `string`   | Дополнительное название для более подробных каталогов каналов и интерфейсов состояния. |
| `docsPath`                             | `string`   | Путь к документации для ссылок в интерфейсах настройки и выбора.               |
| `docsLabel`                            | `string`   | Переопределённое название для ссылок на документацию, если оно должно отличаться от идентификатора канала. |
| `blurb`                                | `string`   | Краткое описание для первоначальной настройки и каталога.                      |
| `order`                                | `number`   | Порядок сортировки в каталогах каналов.                                        |
| `aliases`                              | `string[]` | Дополнительные псевдонимы для поиска при выборе канала.                        |
| `preferOver`                           | `string[]` | Идентификаторы плагинов или каналов с более низким приоритетом, которые этот канал должен опережать. |
| `systemImage`                          | `string`   | Необязательное имя значка или системного изображения для каталогов каналов в интерфейсе. |
| `selectionDocsPrefix`                  | `string`   | Текст-префикс перед ссылками на документацию в интерфейсах выбора.             |
| `selectionDocsOmitLabel`               | `boolean`  | Показывать путь к документации напрямую вместо ссылки с названием в тексте интерфейса выбора. |
| `selectionExtras`                      | `string[]` | Дополнительные короткие строки, добавляемые в текст интерфейса выбора.         |
| `markdownCapable`                      | `boolean`  | Помечает канал как поддерживающий Markdown для принятия решений о форматировании исходящих сообщений. |
| `exposure`                             | `object`   | Управление видимостью канала в настройке, списках настроенных каналов и документации. |
| `quickstartAllowFrom`                  | `boolean`  | Включает для этого канала стандартный процесс настройки быстрого запуска `allowFrom`. |
| `forceAccountBinding`                  | `boolean`  | Требует явной привязки учётной записи, даже если существует только одна учётная запись. |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | При разрешении целей объявлений для этого канала отдаёт предпочтение поиску по сеансу. |

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

- `configured`: включать канал в списки настроенных каналов и интерфейсы состояния
- `setup`: включать канал в интерактивные средства выбора при настройке и конфигурировании
- `docs`: помечать канал как общедоступный в документации и навигации

<Note>
`showConfigured` и `showInSetup` по-прежнему поддерживаются как устаревшие псевдонимы. Предпочтительно использовать `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` относится к метаданным пакета, а не манифеста.

| Поле                         | Тип                                 | Значение                                                                          |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Каноническая спецификация ClawHub для установки, обновления и установки по требованию при первоначальной настройке. |
| `npmSpec`                    | `string`                            | Каноническая спецификация npm для резервных процессов установки и обновления.     |
| `localPath`                  | `string`                            | Путь для локальной разработки или встроенной установки.                           |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Предпочтительный источник установки, когда доступно несколько источников.          |
| `minHostVersion`             | `string`                            | Минимальная поддерживаемая версия OpenClaw: `>=x.y.z` или `>=x.y.z-prerelease`.    |
| `expectedIntegrity`          | `string`                            | Ожидаемая строка целостности дистрибутива npm, обычно `sha512-...`, для установок с закреплённой версией. |
| `allowInvalidConfigRecovery` | `boolean`                           | Позволяет процессам переустановки встроенного плагина восстанавливаться после определённых сбоев из-за устаревшей конфигурации. |
| `requiredPlatformPackages`   | `string[]`                          | Обязательные платформенные псевдонимы пакетов npm, проверяемые при установке через npm. |

<AccordionGroup>
  <Accordion title="Поведение при первоначальной настройке">
    Интерактивная первоначальная настройка использует `openclaw.install` в интерфейсах установки по требованию: если ваш плагин предоставляет варианты аутентификации провайдера или метаданные настройки и каталога канала до загрузки среды выполнения, первоначальная настройка может предложить установку из ClawHub, npm или локального источника, установить или включить плагин, а затем продолжить выбранный процесс. Варианты ClawHub используют `clawhubSpec` и при наличии имеют приоритет; для вариантов npm требуются доверенные метаданные каталога со значением `npmSpec` из реестра (точные версии и `expectedIntegrity` являются необязательными закреплениями и проверяются при установке или обновлении, если заданы). Указывайте «что показывать» в `openclaw.plugin.json`, а «как это установить» — в `package.json`.
  </Accordion>
  <Accordion title="Проверка minHostVersion">
    Если задано `minHostVersion`, оно проверяется как при установке, так и при загрузке реестра манифестов невстроенных плагинов. Более старые хосты пропускают внешние плагины; некорректные строки версий отклоняются. Предполагается, что версии встроенных плагинов из исходного кода совпадают с версией рабочей копии хоста.
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
    `allowInvalidConfigRecovery` не является общим способом обхода ошибок в повреждённых конфигурациях. Он предназначен только для узкого сценария восстановления встроенного плагина и позволяет переустановке или настройке исправлять известные последствия обновления, например отсутствующий путь к встроенному плагину или устаревшую запись `channels.<id>` для того же плагина. Если конфигурация повреждена по несвязанным причинам, установка всё равно завершается безопасным отказом и предлагает оператору выполнить `openclaw doctor --fix`.
  </Accordion>
</AccordionGroup>

### Отложенная полная загрузка

Плагины каналов могут включить отложенную загрузку следующим образом:

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

Когда этот режим включён, OpenClaw загружает только `setupEntry` на этапе запуска до начала прослушивания, даже для уже настроенных каналов. Полная точка входа загружается после того, как Gateway начинает прослушивать подключения.

<Warning>
Включайте отложенную загрузку, только если `setupEntry` регистрирует всё, что требуется Gateway до начала прослушивания: регистрацию канала, HTTP-маршруты и методы Gateway. Если обязательные для запуска возможности предоставляет полная точка входа, сохраняйте поведение по умолчанию.
</Warning>

Если ваши точки входа настройки и полной загрузки регистрируют RPC-методы Gateway, используйте для них префикс, относящийся к конкретному плагину. Зарезервированные пространства имён администрирования ядра (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) остаются под управлением ядра и всегда нормализуются до `operator.admin`.

## Манифест плагина

Каждый нативный Plugin должен поставляться с файлом `openclaw.plugin.json` в корне пакета. OpenClaw использует его для проверки конфигурации без выполнения кода Plugin.

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Adds My Plugin capabilities to OpenClaw",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "Webhook verification secret"
      }
    }
  }
}
```

Для Plugin каналов добавьте `channels` (а для Plugin провайдеров — `providers`):

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

Даже Plugin без конфигурации должны содержать схему. Пустая схема допустима:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Полное описание схемы см. в разделе [Манифест Plugin](/ru/plugins/manifest).

## Публикация в ClawHub

Для пакетов Skills и Plugin используются разные команды публикации в ClawHub. Для пакетов Plugin используйте специальную команду для пакетов:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
`clawhub skill publish <path>` — это другая команда, предназначенная для публикации папки Skills, а не пакета Plugin. См. раздел [Публикация в ClawHub](/ru/clawhub/publishing).
</Note>

## Точка входа настройки

`setup-entry.ts` — облегчённая альтернатива `index.ts`, которую OpenClaw загружает, когда требуются только интерфейсы настройки (первоначальная настройка, исправление конфигурации, проверка отключённого канала):

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Это позволяет не загружать тяжёлый код среды выполнения (криптографические библиотеки, регистрации CLI, фоновые службы) во время процессов настройки.

Встроенные каналы рабочей области, которые хранят безопасные для настройки экспорты во вспомогательных модулях, могут использовать `defineBundledChannelSetupEntry(...)` из `openclaw/plugin-sdk/channel-entry-contract` вместо `defineSetupPluginEntry(...)`. Этот контракт для встроенных компонентов также поддерживает необязательный экспорт `runtime`, благодаря чему связывание среды выполнения во время настройки может оставаться облегчённым и явным.

<AccordionGroup>
  <Accordion title="Когда OpenClaw использует setupEntry вместо полной точки входа">
    - Канал отключён, но для него требуются интерфейсы настройки или первоначальной настройки.
    - Канал включён, но не настроен.
    - Включена отложенная загрузка (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Что должен регистрировать setupEntry">
    - Объект Plugin канала (через `defineSetupPluginEntry`).
    - Все маршруты HTTP, необходимые до начала прослушивания Gateway.
    - Все методы Gateway, необходимые при запуске.

    Эти запускаемые при старте методы Gateway всё равно не должны использовать зарезервированные пространства имён администрирования ядра, такие как `config.*` или `update.*`.

  </Accordion>
  <Accordion title="Что НЕ следует включать в setupEntry">
    - Регистрации CLI.
    - Фоновые службы.
    - Тяжёлые импорты среды выполнения (криптография, SDK).
    - Методы Gateway, необходимые только после запуска.

  </Accordion>
</AccordionGroup>

### Узкие импорты вспомогательных средств настройки

Для часто выполняемых путей, используемых только при настройке, предпочитайте узкие интерфейсы вспомогательных средств настройки более общему модулю `plugin-sdk/setup`, если вам нужна только часть интерфейса настройки:

| Путь импорта                        | Назначение                                                                                | Основные экспорты                                                                                                                                                                                                                                                                                                           |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | вспомогательные средства среды выполнения для настройки, доступные в `setupEntry` и при отложенном запуске канала | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | устаревший псевдоним для совместимости; используйте `plugin-sdk/setup-runtime`                            | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                 |
| `plugin-sdk/setup-tools`           | вспомогательные средства CLI, архива и документации для настройки и установки                                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

Используйте более общий интерфейс `plugin-sdk/setup`, когда вам требуется полный набор общих инструментов настройки, включая вспомогательные средства изменения конфигурации, такие как `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Используйте `createSetupTranslator(...)` для фиксированного текста мастера настройки. Он следует локали мастера CLI (сначала `OPENCLAW_LOCALE`, затем системные переменные локали) и при отсутствии перевода использует английский язык. Храните относящийся к конкретному Plugin текст настройки в коде этого Plugin, а общие ключи каталога используйте только для общих меток настройки, текста состояния и текста настройки официальных встроенных Plugin.

Адаптеры изменения конфигурации при настройке остаются безопасными для импорта в часто выполняемых путях. Поиск поверхности контракта продвижения встроенной конфигурации с одной учётной записью выполняется лениво, поэтому импорт `plugin-sdk/setup-runtime` не запускает обнаружение поверхности встроенного контракта до фактического использования адаптера.

### Управляемое каналом продвижение конфигурации с одной учётной записью

Когда канал переходит от конфигурации верхнего уровня с одной учётной записью к `channels.<id>.accounts.*`, стандартное общее поведение перемещает продвигаемые значения уровня учётной записи в `accounts.default`.

Встроенные каналы могут сузить или переопределить это продвижение через свою поверхность контракта настройки:

- `singleAccountKeysToMove`: дополнительные ключи верхнего уровня, которые следует переместить в продвигаемую учётную запись
- `namedAccountPromotionKeys`: если именованные учётные записи уже существуют, в продвигаемую учётную запись перемещаются только эти ключи; общие ключи политик и доставки остаются в корне канала
- `resolveSingleAccountPromotionTarget(...)`: выбор существующей учётной записи, которая получит продвигаемые значения

<Note>
Текущим встроенным примером является Matrix. Если уже существует ровно одна именованная учётная запись Matrix или если `defaultAccount` указывает на существующий неканонический ключ, такой как `Ops`, при продвижении эта учётная запись сохраняется вместо создания новой записи `accounts.default`.
</Note>

## Схема конфигурации

Конфигурация Plugin проверяется по JSON Schema из манифеста. Пользователи настраивают Plugin следующим образом:

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

При регистрации ваш Plugin получает эту конфигурацию в `api.pluginConfig`.

Для конфигурации конкретного канала вместо этого используйте раздел конфигурации канала:

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

Используйте `buildChannelConfigSchema`, чтобы преобразовать схему Zod в обёртку `ChannelConfigSchema`, применяемую в принадлежащих Plugin артефактах конфигурации:

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

Если контракт уже описан в виде JSON Schema или TypeBox, используйте прямое вспомогательное средство, чтобы OpenClaw мог пропустить преобразование Zod в JSON Schema в путях обработки метаданных:

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

Для сторонних Plugin контрактом пути холодной загрузки по-прежнему является манифест Plugin: скопируйте созданную JSON Schema в `openclaw.plugin.json#channelConfigs`, чтобы схема конфигурации, настройка и пользовательские интерфейсы могли проверять `channels.<id>` без загрузки кода среды выполнения.

## Мастера настройки

Plugin каналов могут предоставлять интерактивные мастера настройки для `openclaw onboard`. Мастер представляет собой объект `ChannelSetupWizard` в `ChannelPlugin`:

```typescript
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/channel-setup";

const setupWizard: ChannelSetupWizard = {
  channel: "my-channel",
  status: {
    configuredLabel: "Connected",
    unconfiguredLabel: "Not configured",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "Bot token",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "Use MY_CHANNEL_BOT_TOKEN from environment?",
      keepPrompt: "Keep current token?",
      inputPrompt: "Enter your bot token:",
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

`ChannelSetupWizard` также поддерживает `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` и другие возможности. Полный пример встроенного Plugin см. в файле `src/setup-core.ts` Plugin Discord.

<AccordionGroup>
  <Accordion title="Общие запросы allowFrom">
    Для запросов списка разрешённых отправителей личных сообщений, которым требуется только стандартная последовательность `note -> prompt -> parse -> merge -> patch`, предпочитайте общие вспомогательные средства настройки из `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` и `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Стандартное состояние настройки канала">
    Для блоков состояния настройки канала, различающихся только метками, оценками и необязательными дополнительными строками, предпочитайте `createStandardChannelSetupStatus(...)` из `openclaw/plugin-sdk/setup` самостоятельному созданию одинакового объекта `status` в каждом Plugin.
  </Accordion>
  <Accordion title="Необязательная поверхность настройки канала">
    Для необязательных поверхностей настройки, которые должны отображаться только в определённых контекстах, используйте `createOptionalChannelSetupSurface` из `openclaw/plugin-sdk/channel-setup`:

    ```typescript
    import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

    const setupSurface = createOptionalChannelSetupSurface({
      channel: "my-channel",
      label: "My Channel",
      npmSpec: "@myorg/openclaw-my-channel",
      docsPath: "/channels/my-channel",
    });
    // Returns { setupAdapter, setupWizard }
    ```

    `plugin-sdk/channel-setup` также экспортирует низкоуровневые конструкторы `createOptionalChannelSetupAdapter(...)` и `createOptionalChannelSetupWizard(...)`, когда требуется только одна часть этой поверхности необязательной установки.

    Сгенерированный необязательный адаптер/мастер работает по принципу запрета по умолчанию при реальной записи конфигурации. В `validateInput`, `applyAccountConfig` и `finalize` повторно используется одно сообщение о необходимости установки, а если задан `docsPath`, к нему добавляется ссылка на документацию.

  </Accordion>
  <Accordion title="Вспомогательные средства настройки на основе исполняемых файлов">
    Для интерфейсов настройки на основе исполняемых файлов используйте общие делегирующие вспомогательные средства вместо копирования одной и той же логики работы с исполняемыми файлами и состояниями в каждый канал:

    - `createDetectedBinaryStatus(...)` — для блоков состояния, различающихся только подписями, подсказками, оценками и обнаружением исполняемого файла
    - `createCliPathTextInput(...)` — для текстовых полей ввода, содержащих путь
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` и `createDelegatedResolveConfigured(...)` — когда `setupEntry` должен отложенно перенаправлять вызовы более сложному полному мастеру
    - `createDelegatedTextInputShouldPrompt(...)` — когда `setupEntry` должен делегировать только принятие решения `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Публикация и установка

**Внешние плагины:** опубликуйте в [ClawHub](/ru/clawhub), затем установите:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    Спецификации пакетов без префикса устанавливаются из npm во время перехода при запуске, если только имя не совпадает с идентификатором встроенного или официального плагина; в этом случае OpenClaw вместо этого использует соответствующую локальную или официальную копию. Для детерминированного выбора источника используйте `clawhub:`, `npm:`, `git:` или `npm-pack:` — см. раздел [Управление плагинами](/ru/plugins/manage-plugins).

  </Tab>
  <Tab title="Только ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="Спецификация пакета npm">
    Используйте npm, если пакет ещё не перенесён в ClawHub или если во время миграции
    требуется прямой путь установки из npm:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Плагины в репозитории:** разместите их в дереве рабочего пространства встроенных плагинов; они будут автоматически обнаружены во время сборки.

<Info>
При установке из npm команда `openclaw plugins install` устанавливает пакет в отдельный проект плагина в каталоге `~/.openclaw/npm/projects` с отключёнными скриптами жизненного цикла (`--ignore-scripts`). Используйте для зависимостей плагина только JS/TS и избегайте пакетов, требующих сборки через `postinstall`.
</Info>

<Note>
При запуске Gateway зависимости плагинов не устанавливаются. За согласование зависимостей отвечают процессы установки из npm, git и ClawHub; зависимости локальных плагинов должны быть установлены заранее.
</Note>

Метаданные встроенных пакетов задаются явно, а не выводятся из собранного JavaScript при запуске Gateway. Зависимости среды выполнения должны находиться в пакете плагина, которому они принадлежат; при запуске пакет OpenClaw никогда не восстанавливает и не зеркалирует зависимости плагинов.

## Связанные материалы

- [Создание плагинов](/ru/plugins/building-plugins) — пошаговое руководство по началу работы
- [Манифест плагина](/ru/plugins/manifest) — полное справочное описание схемы манифеста
- [Точки входа SDK](/ru/plugins/sdk-entrypoints) — `definePluginEntry` и `defineChannelPluginEntry`
