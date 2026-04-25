---
read_when:
    - Ви додаєте майстер налаштування до Plugin
    - Вам потрібно зрозуміти різницю між `setup-entry.ts` і `index.ts`
    - Ви визначаєте схеми конфігурації Plugin або метадані openclaw у `package.json`
sidebarTitle: Setup and Config
summary: Майстри налаштування, `setup-entry.ts`, схеми конфігурації та метадані `package.json`
title: Налаштування Plugin і конфігурація
x-i18n:
    generated_at: "2026-04-25T05:57:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 487cff34e0f9ae307a7c920dfc3cb0a8bbf2cac5e137abd8be4d1fbed19200ca
    source_path: plugins/sdk-setup.md
    workflow: 15
---

Довідка щодо пакування Plugin (метадані `package.json`), маніфестів
(`openclaw.plugin.json`), setup entry і схем конфігурації.

<Tip>
  **Потрібен покроковий приклад?** Практичні посібники розглядають пакування в контексті:
  [Плагіни каналів](/uk/plugins/sdk-channel-plugins#step-1-package-and-manifest) і
  [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Метадані пакета

Ваш `package.json` має містити поле `openclaw`, яке повідомляє системі Plugin, що
надає ваш Plugin:

**Plugin каналу:**

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

**Plugin провайдера / базовий варіант публікації ClawHub:**

```json openclaw-clawhub-package.json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
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

Якщо ви публікуєте Plugin зовні в ClawHub, ці поля `compat` і `build`
є обов’язковими. Канонічні фрагменти для публікації розміщено в
`docs/snippets/plugin-publish/`.

### Поля `openclaw`

| Поле        | Тип        | Опис                                                                                                                        |
| ----------- | ---------- | --------------------------------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | Файли точок входу (відносно кореня пакета)                                                                                  |
| `setupEntry` | `string`   | Полегшена точка входу лише для налаштування (необов’язково)                                                                 |
| `channel`    | `object`   | Метадані каталогу каналів для налаштування, вибору, quickstart і поверхонь status                                           |
| `providers`  | `string[]` | Id провайдерів, зареєстрованих цим Plugin                                                                                   |
| `install`    | `object`   | Підказки для встановлення: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Прапорці поведінки запуску                                                                                                  |

### `openclaw.channel`

`openclaw.channel` — це недорогі метадані пакета для виявлення каналів і поверхонь
налаштування до завантаження runtime.

| Поле                                  | Тип        | Що це означає                                                                |
| ------------------------------------- | ---------- | ---------------------------------------------------------------------------- |
| `id`                                   | `string`   | Канонічний id каналу.                                                        |
| `label`                                | `string`   | Основна мітка каналу.                                                        |
| `selectionLabel`                       | `string`   | Мітка для picker/налаштування, якщо вона має відрізнятися від `label`.       |
| `detailLabel`                          | `string`   | Вторинна детальна мітка для багатших каталогів каналів і поверхонь status.   |
| `docsPath`                             | `string`   | Шлях до документації для посилань із налаштування та вибору.                 |
| `docsLabel`                            | `string`   | Перевизначена мітка для посилань на документацію, якщо вона має відрізнятися від id каналу. |
| `blurb`                                | `string`   | Короткий опис для онбордингу/каталогу.                                       |
| `order`                                | `number`   | Порядок сортування в каталогах каналів.                                      |
| `aliases`                              | `string[]` | Додаткові псевдоніми для пошуку під час вибору каналу.                       |
| `preferOver`                           | `string[]` | Id Plugin/каналів із нижчим пріоритетом, які цей канал має випереджати.      |
| `systemImage`                          | `string`   | Необов’язкова назва icon/system-image для UI-каталогів каналів.              |
| `selectionDocsPrefix`                  | `string`   | Текст-префікс перед посиланнями на документацію в поверхнях вибору.          |
| `selectionDocsOmitLabel`               | `boolean`  | Показувати шлях до документації безпосередньо замість підписаного посилання в тексті вибору. |
| `selectionExtras`                      | `string[]` | Додаткові короткі рядки, додані в тексті вибору.                             |
| `markdownCapable`                      | `boolean`  | Позначає канал як сумісний із Markdown для рішень про вихідне форматування.  |
| `exposure`                             | `object`   | Керування видимістю каналу для налаштування, списків налаштованого і поверхонь документації. |
| `quickstartAllowFrom`                  | `boolean`  | Додає цей канал до стандартного потоку quickstart `allowFrom`.               |
| `forceAccountBinding`                  | `boolean`  | Вимагає явної прив’язки облікового запису, навіть якщо існує лише один обліковий запис. |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Віддавати перевагу пошуку сесії під час визначення цілей announce для цього каналу. |

Приклад:

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

`exposure` підтримує:

- `configured`: включати канал до поверхонь списку налаштованого/status
- `setup`: включати канал до інтерактивних picker налаштування/configure
- `docs`: позначати канал як публічний у поверхнях документації/навігації

`showConfigured` і `showInSetup` як і раніше підтримуються як застарілі псевдоніми. Надавайте
перевагу `exposure`.

### `openclaw.install`

`openclaw.install` — це метадані пакета, а не метадані маніфесту.

| Поле                        | Тип                  | Що це означає                                                                  |
| --------------------------- | -------------------- | ------------------------------------------------------------------------------ |
| `npmSpec`                    | `string`             | Канонічний npm spec для потоків встановлення/оновлення.                        |
| `localPath`                  | `string`             | Локальний шлях встановлення для розробки або вбудованого використання.         |
| `defaultChoice`              | `"npm"` \| `"local"` | Бажане джерело встановлення, коли доступні обидва варіанти.                    |
| `minHostVersion`             | `string`             | Мінімальна підтримувана версія OpenClaw у формі `>=x.y.z`.                     |
| `expectedIntegrity`          | `string`             | Очікуваний рядок цілісності npm dist, зазвичай `sha512-...`, для фіксованих встановлень. |
| `allowInvalidConfigRecovery` | `boolean`            | Дозволяє потокам перевстановлення вбудованих Plugin відновлюватися після певних збоїв застарілої конфігурації. |

Інтерактивний онбординг також використовує `openclaw.install` для поверхонь
встановлення на вимогу. Якщо ваш Plugin надає варіанти auth провайдера або метадані
налаштування/каталогу каналу до завантаження runtime, онбординг може показати цей вибір,
запропонувати npm чи локальне встановлення, встановити або ввімкнути Plugin, а потім
продовжити вибраний потік. Варіанти онбордингу npm потребують довірених метаданих каталогу з
registry `npmSpec`; точні версії та `expectedIntegrity` — необов’язкові фіксації. Якщо
`expectedIntegrity` присутній, потоки встановлення/оновлення забезпечують його перевірку. Тримайте
метадані «що показувати» в `openclaw.plugin.json`, а метадані «як це встановлювати» —
у `package.json`.

Якщо задано `minHostVersion`, і встановлення, і завантаження реєстру маніфестів
застосовують цю перевірку. Старіші host пропускають Plugin; недійсні рядки версій відхиляються.

Для фіксованих npm-встановлень зберігайте точну версію в `npmSpec` і додавайте
очікувану цілісність артефакту:

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

`allowInvalidConfigRecovery` — це не загальний обхід для зламаних конфігурацій. Він
призначений лише для вузького відновлення вбудованих Plugin, щоб перевстановлення/налаштування могло виправити
відомі залишки оновлення, як-от відсутній шлях до вбудованого Plugin або застарілий запис `channels.<id>`
для того самого Plugin. Якщо конфігурацію зламано з інших причин, встановлення
все одно працює в режимі fail closed і повідомляє оператору виконати `openclaw doctor --fix`.

### Відкладене повне завантаження

Плагіни каналів можуть увімкнути відкладене завантаження так:

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

Коли це ввімкнено, OpenClaw завантажує лише `setupEntry` під час фази запуску до початку прослуховування,
навіть для вже налаштованих каналів. Повна точка входу завантажується після того, як
gateway починає прослуховування.

<Warning>
  Вмикайте відкладене завантаження лише тоді, коли ваш `setupEntry` реєструє все, що
  gateway потребує до початку прослуховування (реєстрацію каналу, HTTP-маршрути, методи
  Gateway). Якщо повна точка входу володіє потрібними можливостями запуску, залишайте
  стандартну поведінку.
</Warning>

Якщо ваш setup/full entry реєструє методи RPC gateway, тримайте їх у
префіксі, специфічному для Plugin. Зарезервовані простори імен core admin (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) залишаються у володінні core і завжди зіставляються
з `operator.admin`.

## Маніфест Plugin

Кожен нативний Plugin має постачати `openclaw.plugin.json` у корені пакета.
OpenClaw використовує це для перевірки конфігурації без виконання коду Plugin.

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

Для Plugin каналів додайте `kind` і `channels`:

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

Навіть Plugin без конфігурації мають постачати схему. Порожня схема є дійсною:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Див. [Маніфест Plugin](/uk/plugins/manifest) для повної довідки щодо схеми.

## Публікація в ClawHub

Для пакетів Plugin використовуйте команду ClawHub, специфічну для пакетів:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Застарілий псевдонім публікації лише для skills призначений для Skills. Пакети Plugin
завжди мають використовувати `clawhub package publish`.

## Setup entry

Файл `setup-entry.ts` — це полегшена альтернатива `index.ts`, яку
OpenClaw завантажує, коли йому потрібні лише поверхні налаштування (онбординг, відновлення конфігурації,
перевірка вимкнених каналів).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Це дає змогу уникнути завантаження важкого runtime-коду (криптобібліотек, реєстрацій CLI,
фонових сервісів) під час потоків налаштування.

Вбудовані workspace-канали, які тримають безпечні для налаштування експорти в sidecar-модулях, можуть
використовувати `defineBundledChannelSetupEntry(...)` з
`openclaw/plugin-sdk/channel-entry-contract` замість
`defineSetupPluginEntry(...)`. Цей вбудований контракт також підтримує необов’язковий
експорт `runtime`, щоб зв’язування runtime під час налаштування залишалося легким і явним.

**Коли OpenClaw використовує `setupEntry` замість повної точки входу:**

- Канал вимкнений, але потребує поверхонь налаштування/онбордингу
- Канал увімкнений, але не налаштований
- Увімкнено відкладене завантаження (`deferConfiguredChannelFullLoadUntilAfterListen`)

**Що має реєструвати `setupEntry`:**

- Об’єкт Plugin каналу (через `defineSetupPluginEntry`)
- Будь-які HTTP-маршрути, потрібні до початку прослуховування gateway
- Будь-які методи gateway, потрібні під час запуску

Ці методи gateway для запуску все одно мають уникати зарезервованих просторів імен
core admin, таких як `config.*` або `update.*`.

**Що НЕ має містити `setupEntry`:**

- Реєстрації CLI
- Фонові сервіси
- Важкі runtime-імпорти (crypto, SDK)
- Методи gateway, потрібні лише після запуску

### Вузькі імпорти допоміжних засобів налаштування

Для гарячих шляхів лише для налаштування віддавайте перевагу вузьким seams допоміжних засобів налаштування замість ширшого
umbrella `plugin-sdk/setup`, коли вам потрібна лише частина поверхні налаштування:

| Шлях імпорту                      | Використовуйте для                                                                    | Ключові експорти                                                                                                                                                                                                                                                                             |
| --------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | допоміжні засоби runtime під час налаштування, які залишаються доступними в `setupEntry` / відкладеному запуску каналу | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | адаптери налаштування облікового запису з урахуванням середовища                      | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | допоміжні засоби налаштування/встановлення CLI/архівів/документації                   | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                               |

Використовуйте ширший seam `plugin-sdk/setup`, коли вам потрібен повний спільний
інструментарій налаштування, включно з допоміжними засобами patch конфігурації, такими як
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

Адаптери patch для налаштування залишаються безпечними для імпорту на гарячому шляху. Їхній вбудований
ледачий пошук поверхні контракту для просування одного облікового запису є lazy, тому імпорт
`plugin-sdk/setup-runtime` не завантажує eagerly виявлення вбудованої поверхні контракту до фактичного використання адаптера.

### Просування одного облікового запису, яким володіє канал

Коли канал оновлюється з конфігурації верхнього рівня з одним обліковим записом до
`channels.<id>.accounts.*`, стандартна спільна поведінка переносить значення
на рівні просунутого облікового запису до `accounts.default`.

Вбудовані канали можуть звузити або перевизначити це просування через свою поверхню
контракту налаштування:

- `singleAccountKeysToMove`: додаткові ключі верхнього рівня, які слід перемістити до
  просунутого облікового запису
- `namedAccountPromotionKeys`: коли іменовані облікові записи вже існують, лише ці
  ключі переміщуються до просунутого облікового запису; спільні ключі policy/delivery лишаються в корені каналу
- `resolveSingleAccountPromotionTarget(...)`: вибрати, який наявний обліковий запис
  отримає просунуті значення

Matrix — поточний вбудований приклад. Якщо вже існує рівно один іменований обліковий запис Matrix
або якщо `defaultAccount` вказує на наявний неканонічний ключ, такий як `Ops`,
просування зберігає цей обліковий запис замість створення нового запису `accounts.default`.

## Схема конфігурації

Конфігурація Plugin перевіряється на відповідність JSON Schema у вашому маніфесті. Користувачі
налаштовують plugins через:

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

Ваш Plugin отримує цю конфігурацію як `api.pluginConfig` під час реєстрації.

Для конфігурації, специфічної для каналу, використовуйте натомість розділ конфігурації каналу:

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

### Побудова схем конфігурації каналу

Використовуйте `buildChannelConfigSchema`, щоб перетворити схему Zod на
обгортку `ChannelConfigSchema`, яка використовується артефактами конфігурації, якими володіє Plugin:

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

Для сторонніх plugins контракт холодного шляху як і раніше є маніфестом Plugin:
віддзеркальте згенеровану JSON Schema в `openclaw.plugin.json#channelConfigs`, щоб
схема конфігурації, налаштування та поверхні UI могли перевіряти `channels.<id>` без
завантаження runtime-коду.

## Майстри налаштування

Плагіни каналів можуть надавати інтерактивні майстри налаштування для `openclaw onboard`.
Майстер — це об’єкт `ChannelSetupWizard` у `ChannelPlugin`:

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

Тип `ChannelSetupWizard` підтримує `credentials`, `textInputs`,
`dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` тощо.
Див. пакети вбудованих Plugin (наприклад, Plugin Discord `src/channel.setup.ts`) для
повних прикладів.

Для prompt allowlist у DM, яким потрібен лише стандартний потік
`note -> prompt -> parse -> merge -> patch`, віддавайте перевагу спільним допоміжним засобам налаштування
з `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)` і
`createNestedChannelParsedAllowFromPrompt(...)`.

Для блоків status налаштування каналу, які відрізняються лише мітками, оцінками та необов’язковими
додатковими рядками, віддавайте перевагу `createStandardChannelSetupStatus(...)` з
`openclaw/plugin-sdk/setup` замість ручного створення однакового об’єкта `status` у
кожному Plugin.

Для необов’язкових поверхонь налаштування, які мають з’являтися лише в певних контекстах, використовуйте
`createOptionalChannelSetupSurface` з `openclaw/plugin-sdk/channel-setup`:

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

`plugin-sdk/channel-setup` також надає lower-level
конструктори `createOptionalChannelSetupAdapter(...)` і
`createOptionalChannelSetupWizard(...)`, коли вам потрібна лише одна половина
цієї необов’язкової поверхні встановлення.

Згенеровані необов’язкові adapter/wizard працюють у режимі fail closed на реальних записах конфігурації. Вони
повторно використовують одне повідомлення про необхідність встановлення в `validateInput`,
`applyAccountConfig` і `finalize`, а також додають посилання на документацію, коли задано `docsPath`.

Для UI налаштування на основі binary віддавайте перевагу спільним делегованим helper замість
копіювання того самого glue binary/status у кожен канал:

- `createDetectedBinaryStatus(...)` для блоків status, які відрізняються лише мітками,
  підказками, оцінками та виявленням binary
- `createCliPathTextInput(...)` для text input на основі шляху
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` і
  `createDelegatedResolveConfigured(...)`, коли `setupEntry` має lazily пересилати до
  важчого повного майстра
- `createDelegatedTextInputShouldPrompt(...)`, коли `setupEntry` має лише
  делегувати рішення `textInputs[*].shouldPrompt`

## Публікація та встановлення

**Зовнішні plugins:** публікуйте в [ClawHub](/uk/tools/clawhub) або npm, а потім встановлюйте:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw спочатку пробує ClawHub і автоматично переходить до npm. Ви також можете
явно примусово використати ClawHub:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # лише ClawHub
```

Відповідного перевизначення `npm:` немає. Використовуйте звичайний npm package spec, коли
хочете шлях npm після fallback із ClawHub:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Plugins у репозиторії:** розмістіть їх у дереві workspace вбудованих Plugin, і вони будуть автоматично
виявлені під час збірки.

**Користувачі можуть встановити:**

```bash
openclaw plugins install <package-name>
```

<Info>
  Для встановлень із npm `openclaw plugins install` запускає
  `npm install --ignore-scripts` (без lifecycle scripts). Тримайте дерева залежностей Plugin
  чистими JS/TS та уникайте пакетів, які потребують збірок `postinstall`.
</Info>

Вбудовані plugins, якими володіє лише OpenClaw, є винятком для відновлення під час запуску: коли
пакетне встановлення бачить один із них увімкненим через конфігурацію plugin, застарілу конфігурацію каналу або
його вбудований маніфест із увімкненням за замовчуванням, запуск встановлює відсутні
runtime-залежності цього plugin до імпорту. Сторонні plugins не повинні покладатися на встановлення
під час запуску; і надалі використовуйте явний інсталятор plugin.

## Пов’язане

- [Точки входу SDK](/uk/plugins/sdk-entrypoints) — `definePluginEntry` і `defineChannelPluginEntry`
- [Маніфест Plugin](/uk/plugins/manifest) — повна довідка щодо схеми маніфесту
- [Створення plugins](/uk/plugins/building-plugins) — покроковий посібник для початку роботи
