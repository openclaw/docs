---
read_when:
    - Вы добавляете мастер настройки в plugin
    - Вам нужно понимать setup-entry.ts в сравнении с index.ts
    - Вы определяете схемы конфигурации plugin или метаданные openclaw в package.json
sidebarTitle: Setup and config
summary: Мастера настройки, setup-entry.ts, схемы конфигурации и метаданные package.json
title: Настройка и конфигурация Plugin
x-i18n:
    generated_at: "2026-07-04T15:29:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0969ab2cc069389b8957b07e76591bc76fea7bee22125587fa067122d11bb024
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Справочник по упаковке Plugin (метаданные `package.json`), манифестам (`openclaw.plugin.json`), записям настройки и схемам конфигурации.

<Tip>
**Ищете пошаговое руководство?** Практические руководства рассматривают упаковку в контексте: [Plugin каналов](/ru/plugins/sdk-channel-plugins#step-1-package-and-manifest) и [Plugin провайдеров](/ru/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Метаданные пакета

Вашему `package.json` нужно поле `openclaw`, которое сообщает системе Plugin, что предоставляет ваш Plugin:

<Tabs>
  <Tab title="Plugin канала">
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
  <Tab title="Plugin провайдера / базовый вариант ClawHub">
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
Если вы публикуете Plugin внешне в ClawHub, эти поля `compat` и `build` обязательны. Канонические фрагменты для публикации находятся в `docs/snippets/plugin-publish/`.
</Note>

### Поля `openclaw`

<ParamField path="extensions" type="string[]">
  Файлы точек входа (относительно корня пакета).
</ParamField>
<ParamField path="setupEntry" type="string">
  Легковесная точка входа только для настройки (необязательно).
</ParamField>
<ParamField path="channel" type="object">
  Метаданные каталога каналов для настройки, выбора, быстрого старта и поверхностей статуса.
</ParamField>
<ParamField path="providers" type="string[]">
  Идентификаторы провайдеров, зарегистрированные этим Plugin.
</ParamField>
<ParamField path="install" type="object">
  Подсказки установки: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  Флаги поведения при запуске.
</ParamField>

### `openclaw.channel`

`openclaw.channel` — это недорогие метаданные пакета для обнаружения каналов и поверхностей настройки до загрузки рантайма.

| Поле                                   | Тип        | Что это означает                                                              |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | Канонический идентификатор канала.                                            |
| `label`                                | `string`   | Основная метка канала.                                                        |
| `selectionLabel`                       | `string`   | Метка в выборе/настройке, когда она должна отличаться от `label`.             |
| `detailLabel`                          | `string`   | Вторичная подробная метка для более богатых каталогов каналов и поверхностей статуса. |
| `docsPath`                             | `string`   | Путь документации для ссылок настройки и выбора.                              |
| `docsLabel`                            | `string`   | Переопределение метки для ссылок документации, когда она должна отличаться от идентификатора канала. |
| `blurb`                                | `string`   | Краткое описание для онбординга/каталога.                                     |
| `order`                                | `number`   | Порядок сортировки в каталогах каналов.                                       |
| `aliases`                              | `string[]` | Дополнительные псевдонимы поиска для выбора канала.                           |
| `preferOver`                           | `string[]` | Идентификаторы Plugin/каналов с более низким приоритетом, которые этот канал должен опережать. |
| `systemImage`                          | `string`   | Необязательное имя значка/системного изображения для UI-каталогов каналов.    |
| `selectionDocsPrefix`                  | `string`   | Текст префикса перед ссылками документации в поверхностях выбора.             |
| `selectionDocsOmitLabel`               | `boolean`  | Показывать путь документации напрямую вместо ссылки документации с меткой в тексте выбора. |
| `selectionExtras`                      | `string[]` | Дополнительные короткие строки, добавляемые в текст выбора.                   |
| `markdownCapable`                      | `boolean`  | Помечает канал как поддерживающий Markdown для решений по исходящему форматированию. |
| `exposure`                             | `object`   | Управление видимостью канала для настройки, списков настроенных каналов и поверхностей документации. |
| `quickstartAllowFrom`                  | `boolean`  | Подключает этот канал к стандартному потоку настройки быстрого старта `allowFrom`. |
| `forceAccountBinding`                  | `boolean`  | Требовать явную привязку аккаунта, даже когда существует только один аккаунт. |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Предпочитать поиск сеанса при разрешении целей объявлений для этого канала.   |

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

- `configured`: включать канал в поверхности списков настроенных каналов/статуса
- `setup`: включать канал в интерактивные средства выбора настройки/конфигурации
- `docs`: помечать канал как публичный в поверхностях документации/навигации

<Note>
`showConfigured` и `showInSetup` продолжают поддерживаться как устаревшие псевдонимы. Предпочитайте `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` — это метаданные пакета, а не метаданные манифеста.

| Поле                         | Тип                                 | Что это означает                                                               |
| ---------------------------- | ----------------------------------- | ------------------------------------------------------------------------------ |
| `clawhubSpec`                | `string`                            | Каноническая спецификация ClawHub для потоков установки/обновления и установки по требованию во время онбординга. |
| `npmSpec`                    | `string`                            | Каноническая спецификация npm для резервных потоков установки/обновления.      |
| `localPath`                  | `string`                            | Локальная разработческая или встроенная путь установки.                        |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Предпочитаемый источник установки, когда доступно несколько источников.        |
| `minHostVersion`             | `string`                            | Минимально поддерживаемая версия OpenClaw в форме `>=x.y.z` или `>=x.y.z-prerelease`. |
| `expectedIntegrity`          | `string`                            | Ожидаемая строка целостности npm dist, обычно `sha512-...`, для закрепленных установок. |
| `allowInvalidConfigRecovery` | `boolean`                           | Позволяет потокам переустановки встроенного Plugin восстанавливаться после конкретных сбоев из-за устаревшей конфигурации. |
| `requiredPlatformPackages`   | `string[]`                          | Обязательные платформенно-специфичные псевдонимы npm, проверяемые во время установки npm. |

<AccordionGroup>
  <Accordion title="Поведение онбординга">
    Интерактивный онбординг также использует `openclaw.install` для поверхностей установки по требованию. Если ваш Plugin предоставляет варианты авторизации провайдера или метаданные настройки/каталога канала до загрузки рантайма, онбординг может показать этот вариант, запросить ClawHub, npm или локальную установку, установить или включить Plugin, а затем продолжить выбранный поток. Варианты онбординга ClawHub используют `clawhubSpec` и предпочитаются, когда присутствуют; варианты npm требуют доверенных метаданных каталога со спецификацией реестра `npmSpec`; точные версии и `expectedIntegrity` являются необязательными закреплениями npm. Если `expectedIntegrity` присутствует, потоки установки/обновления принудительно проверяют его для npm. Храните метаданные «что показывать» в `openclaw.plugin.json`, а метаданные «как это установить» — в `package.json`.
  </Accordion>
  <Accordion title="Принудительная проверка minHostVersion">
    Если задан `minHostVersion`, он принудительно проверяется как при установке, так и при загрузке реестра манифестов невстроенных Plugin. Более старые хосты пропускают внешние Plugin; недопустимые строки версий отклоняются. Встроенные исходные Plugin считаются совпадающими по версии с checkout хоста.
  </Accordion>
  <Accordion title="Закрепленные установки npm">
    Для закрепленных установок npm храните точную версию в `npmSpec` и добавляйте ожидаемую целостность артефакта:

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
    `allowInvalidConfigRecovery` не является общим обходом для сломанных конфигураций. Он предназначен только для узкого восстановления встроенного Plugin, чтобы переустановка/настройка могла исправить известные остатки после обновления, например отсутствующий путь встроенного Plugin или устаревшую запись `channels.<id>` для того же Plugin. Если конфигурация сломана по несвязанным причинам, установка по-прежнему завершается закрытым сбоем и сообщает оператору запустить `openclaw doctor --fix`.
  </Accordion>
</AccordionGroup>

### Отложенная полная загрузка

Plugin каналов могут включить отложенную загрузку с помощью:

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

Когда это включено, OpenClaw загружает только `setupEntry` во время фазы запуска до начала прослушивания, даже для уже настроенных каналов. Полная точка входа загружается после того, как Gateway начинает прослушивание.

<Warning>
Включайте отложенную загрузку только тогда, когда ваш `setupEntry` регистрирует все, что нужно Gateway до начала прослушивания (регистрация канала, HTTP-маршруты, методы Gateway). Если полная точка входа владеет обязательными возможностями запуска, оставьте поведение по умолчанию.
</Warning>

Если ваша точка входа настройки/полная точка входа регистрирует RPC-методы Gateway, держите их на префиксе, специфичном для Plugin. Зарезервированные основные административные пространства имен (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) остаются во владении ядра и всегда разрешаются в `operator.admin`.

## Манифест Plugin

Каждый нативный Plugin должен поставлять `openclaw.plugin.json` в корне пакета. OpenClaw использует его для проверки конфигурации без выполнения кода Plugin.

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

Для Plugin каналов добавьте `kind` и `channels`:

```json
{
  "id": "my-channel",
  "kind": "channel",
  "channels": ["my-channel"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

Даже Plugin без конфигурации должен поставляться со схемой. Пустая схема допустима:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Полную справку по схеме см. в разделе [Манифест Plugin](/ru/plugins/manifest).

## Публикация в ClawHub

Для пакетов plugin используйте команду ClawHub, предназначенную для пакетов:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
Устаревший псевдоним публикации только для Skills предназначен для skills. Пакеты plugin всегда должны использовать `clawhub package publish`.
</Note>

## Точка входа setup

Файл `setup-entry.ts` — это легковесная альтернатива `index.ts`, которую OpenClaw загружает, когда ему нужны только поверхности настройки (онбординг, исправление конфигурации, проверка отключенного канала).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Это позволяет не загружать тяжелый runtime-код (криптографические библиотеки, регистрации CLI, фоновые сервисы) во время потоков настройки.

Встроенные каналы workspace, которые держат безопасные для setup экспорты во вспомогательных модулях, могут использовать `defineBundledChannelSetupEntry(...)` из `openclaw/plugin-sdk/channel-entry-contract` вместо `defineSetupPluginEntry(...)`. Этот встроенный контракт также поддерживает необязательный экспорт `runtime`, чтобы runtime-связка во время setup оставалась легковесной и явной.

<AccordionGroup>
  <Accordion title="Когда OpenClaw использует setupEntry вместо полной точки входа">
    - Канал отключен, но ему нужны поверхности setup/онбординга.
    - Канал включен, но не настроен.
    - Отложенная загрузка включена (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Что setupEntry должен регистрировать">
    - Объект channel plugin (через `defineSetupPluginEntry`).
    - Любые HTTP-маршруты, необходимые до запуска gateway listen.
    - Любые методы Gateway, необходимые во время запуска.

    Эти стартовые методы Gateway по-прежнему должны избегать зарезервированных core-пространств имен admin, таких как `config.*` или `update.*`.

  </Accordion>
  <Accordion title="Что setupEntry НЕ должен включать">
    - Регистрации CLI.
    - Фоновые сервисы.
    - Тяжелые runtime-импорты (криптография, SDK).
    - Методы Gateway, нужные только после запуска.

  </Accordion>
</AccordionGroup>

### Узкие импорты setup-хелперов

Для горячих путей, предназначенных только для setup, предпочитайте узкие границы setup-хелперов более широкому зонтичному `plugin-sdk/setup`, когда вам нужна только часть поверхности setup:

| Путь импорта                        | Для чего использовать                                                                                | Ключевые экспорты                                                                                                                                                                                                                                                                                                           |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | runtime-хелперы времени setup, которые остаются доступны в `setupEntry` / отложенном запуске канала | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | устаревший псевдоним совместимости; используйте `plugin-sdk/setup-runtime`                            | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                 |
| `plugin-sdk/setup-tools`           | setup/install CLI/archive/docs-хелперы                                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

Используйте более широкую границу `plugin-sdk/setup`, когда вам нужен полный общий набор инструментов setup, включая хелперы config-patch, такие как `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Используйте `createSetupTranslator(...)` для фиксированного текста мастера setup. Он следует локали
мастера CLI (`OPENCLAW_LOCALE`, затем системные переменные локали) и
откатывается на английский. Держите текст setup, специфичный для plugin, в коде, принадлежащем plugin, и используйте
общие ключи каталога только для общих меток setup, текста статуса и официального
текста setup встроенного plugin.

Адаптеры setup patch остаются безопасными для горячего пути при импорте. Их встроенный lookup поверхности контракта продвижения single-account ленивый, поэтому импорт `plugin-sdk/setup-runtime` не загружает заранее discovery встроенной contract-surface до фактического использования адаптера.

### Продвижение single-account, принадлежащее каналу

Когда канал обновляется с top-level конфигурации single-account до `channels.<id>.accounts.*`, стандартное общее поведение переносит продвигаемые account-scoped значения в `accounts.default`.

Встроенные каналы могут сузить или переопределить это продвижение через свою поверхность setup-контракта:

- `singleAccountKeysToMove`: дополнительные top-level ключи, которые должны перейти в продвигаемый аккаунт
- `namedAccountPromotionKeys`: когда именованные аккаунты уже существуют, только эти ключи переходят в продвигаемый аккаунт; общие ключи policy/delivery остаются в корне канала
- `resolveSingleAccountPromotionTarget(...)`: выбрать, какой существующий аккаунт получит продвигаемые значения

<Note>
Matrix — текущий встроенный пример. Если уже существует ровно один именованный аккаунт Matrix или если `defaultAccount` указывает на существующий неканонический ключ, такой как `Ops`, продвижение сохраняет этот аккаунт вместо создания новой записи `accounts.default`.
</Note>

## Схема конфигурации

Конфигурация Plugin проверяется по JSON Schema в вашем манифесте. Пользователи настраивают plugins через:

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

Ваш plugin получает эту конфигурацию как `api.pluginConfig` во время регистрации.

Для конфигурации, специфичной для канала, используйте вместо этого раздел конфигурации канала:

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

### Создание схем конфигурации канала

Используйте `buildChannelConfigSchema`, чтобы преобразовать схему Zod в обертку `ChannelConfigSchema`, используемую артефактами конфигурации, принадлежащими plugin:

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

Если вы уже описываете контракт как JSON Schema или TypeBox, используйте прямой хелпер, чтобы OpenClaw мог пропустить преобразование Zod-to-JSON-Schema на путях metadata:

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

Для сторонних plugins cold-path контрактом по-прежнему является манифест plugin: отразите сгенерированную JSON Schema в `openclaw.plugin.json#channelConfigs`, чтобы схема конфигурации, setup и UI-поверхности могли проверять `channels.<id>` без загрузки runtime-кода.

## Мастера setup

Channel plugins могут предоставлять интерактивные мастера setup для `openclaw onboard`. Мастер — это объект `ChannelSetupWizard` в `ChannelPlugin`:

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

Тип `ChannelSetupWizard` поддерживает `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` и многое другое. Полные примеры см. в пакетах встроенных plugins (например, plugin Discord `src/channel.setup.ts`).

<AccordionGroup>
  <Accordion title="Общие prompts allowFrom">
    Для prompts DM allowlist, которым нужен только стандартный поток `note -> prompt -> parse -> merge -> patch`, предпочитайте общие setup-хелперы из `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` и `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Стандартный статус setup канала">
    Для блоков статуса setup канала, которые различаются только метками, оценками и необязательными дополнительными строками, предпочитайте `createStandardChannelSetupStatus(...)` из `openclaw/plugin-sdk/setup` вместо ручного создания того же объекта `status` в каждом plugin.
  </Accordion>
  <Accordion title="Необязательная поверхность setup канала">
    Для необязательных setup-поверхностей, которые должны появляться только в определенных контекстах, используйте `createOptionalChannelSetupSurface` из `openclaw/plugin-sdk/channel-setup`:

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

    `plugin-sdk/channel-setup` также предоставляет низкоуровневые builders `createOptionalChannelSetupAdapter(...)` и `createOptionalChannelSetupWizard(...)`, когда вам нужна только одна половина этой optional-install поверхности.

    Сгенерированные optional adapter/wizard fail closed при реальных записях конфигурации. Они переиспользуют одно сообщение о необходимости установки в `validateInput`, `applyAccountConfig` и `finalize`, а также добавляют ссылку на docs, когда задан `docsPath`.

  </Accordion>
  <Accordion title="Setup-хелперы на основе бинарных файлов">
    Для setup UI на основе бинарных файлов предпочитайте общие делегированные хелперы вместо копирования одинаковой binary/status связки в каждый канал:

    - `createDetectedBinaryStatus(...)` для блоков статуса, которые различаются только метками, подсказками, оценками и бинарным обнаружением
    - `createCliPathTextInput(...)` для текстовых полей ввода, основанных на пути
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` и `createDelegatedResolveConfigured(...)`, когда `setupEntry` нужно лениво перенаправить в более тяжелый полный мастер
    - `createDelegatedTextInputShouldPrompt(...)`, когда `setupEntry` нужно только делегировать решение `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Публикация и установка

**Внешние Plugin:** опубликуйте в [ClawHub](/clawhub), затем установите:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    Спецификации пакетов без префикса устанавливаются из npm во время перехода при запуске.

  </Tab>
  <Tab title="Только ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="Спецификация пакета npm">
    Используйте npm, если пакет еще не перешел в ClawHub, или когда вам нужен
    прямой путь установки npm во время миграции:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugin в репозитории:** разместите их в дереве рабочей области встроенных Plugin, и они будут автоматически обнаружены во время сборки.

**Пользователи могут установить:**

```bash
openclaw plugins install <package-name>
```

<Info>
Для установок из npm `openclaw plugins install` устанавливает пакет в отдельный для каждого Plugin проект в `~/.openclaw/npm/projects` с отключенными сценариями жизненного цикла. Держите деревья зависимостей Plugin чистыми JS/TS и избегайте пакетов, которым требуются сборки `postinstall`.
</Info>

<Note>
Запуск Gateway не устанавливает зависимости Plugin. Потоки установки npm/git/ClawHub отвечают за сведение зависимостей; у локальных Plugin зависимости уже должны быть установлены.
</Note>

Метаданные встроенного пакета задаются явно, а не выводятся из собранного JavaScript при запуске gateway. Runtime-зависимости должны находиться в пакете Plugin, которому они принадлежат; запуск упакованного OpenClaw никогда не исправляет и не зеркалирует зависимости Plugin.

## См. также

- [Создание Plugin](/ru/plugins/building-plugins) — пошаговое руководство по началу работы
- [Манифест Plugin](/ru/plugins/manifest) — полный справочник схемы манифеста
- [Точки входа SDK](/ru/plugins/sdk-entrypoints) — `definePluginEntry` и `defineChannelPluginEntry`
