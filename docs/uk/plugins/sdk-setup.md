---
read_when:
    - Ви додаєте майстер налаштування до плагіна
    - Вам потрібно зрозуміти різницю між setup-entry.ts і index.ts
    - Ви визначаєте схеми конфігурації плагіна або метадані openclaw у package.json
sidebarTitle: Setup and Config
summary: Майстри налаштування, setup-entry.ts, схеми конфігурації та метадані package.json
title: Налаштування плагінів і конфігурація
x-i18n:
    generated_at: "2026-04-05T22:37:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: eac2586516d27bcd94cc4c259fe6274c792b3f9938c7ddd6dbf04a6dbb988dc9
    source_path: plugins/sdk-setup.md
    workflow: 15
---

# Налаштування плагінів і конфігурація

Довідник щодо пакування плагінів (метадані `package.json`), маніфестів
(`openclaw.plugin.json`), точок входу налаштування та схем конфігурації.

<Tip>
  **Шукаєте покроковий посібник?** Практичні інструкції розглядають пакування в контексті:
  [Channel Plugins](/uk/plugins/sdk-channel-plugins#step-1-package-and-manifest) і
  [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Метадані пакета

Вашому `package.json` потрібне поле `openclaw`, яке повідомляє системі плагінів, що
саме надає ваш плагін:

**Плагін каналу:**

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

**Плагін провайдера / базовий варіант для публікації ClawHub:**

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

Якщо ви публікуєте плагін зовнішньо в ClawHub, поля `compat` і `build`
є обов’язковими. Канонічні фрагменти для публікації знаходяться в
`docs/snippets/plugin-publish/`.

### Поля `openclaw`

| Поле         | Тип        | Опис                                                                                                           |
| ------------ | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | Файли точок входу (відносно кореня пакета)                                                                     |
| `setupEntry` | `string`   | Легка точка входу лише для налаштування (необов’язково)                                                        |
| `channel`    | `object`   | Метадані каталогу каналів для налаштування, вибору, швидкого старту та поверхонь стану                         |
| `providers`  | `string[]` | Ідентифікатори провайдерів, зареєстрованих цим плагіном                                                        |
| `install`    | `object`   | Підказки для встановлення: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Прапорці поведінки під час запуску                                                                             |

### `openclaw.channel`

`openclaw.channel` — це недорогі метадані пакета для виявлення каналів і
поверхонь налаштування до завантаження середовища виконання.

| Поле                                   | Тип        | Що це означає                                                                 |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | Канонічний ідентифікатор каналу.                                              |
| `label`                                | `string`   | Основна мітка каналу.                                                         |
| `selectionLabel`                       | `string`   | Мітка у виборі/налаштуванні, якщо вона має відрізнятися від `label`.          |
| `detailLabel`                          | `string`   | Додаткова мітка для багатших каталогів каналів і поверхонь стану.             |
| `docsPath`                             | `string`   | Шлях до документації для посилань налаштування й вибору.                      |
| `docsLabel`                            | `string`   | Перевизначення мітки для посилань на документацію, якщо вона має відрізнятися від ідентифікатора каналу. |
| `blurb`                                | `string`   | Короткий опис для онбордингу/каталогу.                                        |
| `order`                                | `number`   | Порядок сортування в каталогах каналів.                                       |
| `aliases`                              | `string[]` | Додаткові псевдоніми пошуку для вибору каналу.                                |
| `preferOver`                           | `string[]` | Ідентифікатори плагінів/каналів нижчого пріоритету, які цей канал має випереджати. |
| `systemImage`                          | `string`   | Необов’язкова назва значка/system-image для UI-каталогів каналів.             |
| `selectionDocsPrefix`                  | `string`   | Текст-префікс перед посиланнями на документацію в поверхнях вибору.           |
| `selectionDocsOmitLabel`               | `boolean`  | Показувати шлях до документації напряму замість підписаного посилання в тексті вибору. |
| `selectionExtras`                      | `string[]` | Додаткові короткі рядки, додані в тексті вибору.                              |
| `markdownCapable`                      | `boolean`  | Позначає канал як сумісний із Markdown для рішень щодо вихідного форматування. |
| `exposure`                             | `object`   | Керування видимістю каналу для налаштування, списків налаштованих каналів і поверхонь документації. |
| `quickstartAllowFrom`                  | `boolean`  | Вмикає для цього каналу стандартний потік налаштування quickstart `allowFrom`. |
| `forceAccountBinding`                  | `boolean`  | Вимагає явної прив’язки облікового запису, навіть якщо існує лише один обліковий запис. |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Надає перевагу пошуку сесії під час визначення announce-target для цього каналу. |

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

- `configured`: включати канал до поверхонь переліку налаштованих каналів/стану
- `setup`: включати канал до інтерактивних засобів вибору налаштування/конфігурації
- `docs`: позначати канал як публічний у поверхнях документації/навігації

`showConfigured` і `showInSetup` залишаються підтримуваними як застарілі псевдоніми. Рекомендується
`exposure`.

### `openclaw.install`

`openclaw.install` — це метадані пакета, а не метадані маніфесту.

| Поле                         | Тип                  | Що це означає                                                                   |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Канонічна npm-специфікація для потоків встановлення/оновлення.                  |
| `localPath`                  | `string`             | Локальний шлях для розробки або вбудованого встановлення.                       |
| `defaultChoice`              | `"npm"` \| `"local"` | Бажане джерело встановлення, коли доступні обидва варіанти.                     |
| `minHostVersion`             | `string`             | Мінімальна підтримувана версія OpenClaw у формі `>=x.y.z`.                      |
| `allowInvalidConfigRecovery` | `boolean`            | Дає змогу потокам перевстановлення вбудованих плагінів відновлюватися після окремих збоїв через застарілу конфігурацію. |

Якщо задано `minHostVersion`, його перевіряють як під час встановлення, так і
під час завантаження реєстру маніфестів. Старіші хости пропускають плагін;
некоректні рядки версій відхиляються.

`allowInvalidConfigRecovery` — це не загальний обхід для зламаних конфігурацій. Він
призначений лише для вузького відновлення вбудованих плагінів, щоб перевстановлення/налаштування
могло виправити відомі залишки після оновлення, як-от відсутній шлях до вбудованого плагіна або застарілий запис `channels.<id>`
для цього самого плагіна. Якщо конфігурація зламана з інших причин, встановлення
все одно завершується із закритою відмовою та пропонує оператору виконати `openclaw doctor --fix`.

### Відкладене повне завантаження

Плагіни каналів можуть увімкнути відкладене завантаження за допомогою:

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

Якщо цю можливість увімкнено, OpenClaw завантажує лише `setupEntry` під час
передслуховувальної фази запуску, навіть для вже налаштованих каналів. Повна точка входу
завантажується після того, як gateway починає слухати.

<Warning>
  Вмикайте відкладене завантаження лише тоді, коли ваш `setupEntry` реєструє все,
  що gateway потрібно до початку прослуховування (реєстрацію каналів, HTTP-маршрути,
  методи gateway). Якщо повна точка входу володіє необхідними можливостями запуску, залиште
  поведінку за замовчуванням.
</Warning>

Якщо ваш setup/full entry реєструє RPC-методи gateway, залишайте їх на
префіксі, специфічному для плагіна. Зарезервовані простори імен основного адміністратора (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) належать ядру й завжди зіставляються
з `operator.admin`.

## Маніфест плагіна

Кожен нативний плагін має постачатися з `openclaw.plugin.json` у корені пакета.
OpenClaw використовує його для перевірки конфігурації без виконання коду плагіна.

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

Для плагінів каналів додайте `kind` і `channels`:

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

Навіть плагіни без конфігурації мають постачатися зі схемою. Порожня схема є коректною:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Див. [Plugin Manifest](/uk/plugins/manifest), щоб отримати повний довідник зі схеми.

## Публікація в ClawHub

Для пакетів плагінів використовуйте команду ClawHub, специфічну для пакета:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Застарілий псевдонім публікації лише для skills призначений для Skills. Пакети плагінів
завжди мають використовувати `clawhub package publish`.

## Точка входу налаштування

Файл `setup-entry.ts` — це легка альтернатива `index.ts`, яку
OpenClaw завантажує, коли йому потрібні лише поверхні налаштування (онбординг, відновлення конфігурації,
перевірка вимкнених каналів).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Це дає змогу уникнути завантаження важкого runtime-коду (криптографічних бібліотек, реєстрацій CLI,
фонових сервісів) під час потоків налаштування.

**Коли OpenClaw використовує `setupEntry` замість повної точки входу:**

- Канал вимкнено, але потрібні поверхні налаштування/онбордингу
- Канал увімкнено, але не налаштовано
- Увімкнено відкладене завантаження (`deferConfiguredChannelFullLoadUntilAfterListen`)

**Що має реєструвати `setupEntry`:**

- Об’єкт плагіна каналу (через `defineSetupPluginEntry`)
- Будь-які HTTP-маршрути, потрібні до початку прослуховування gateway
- Будь-які методи gateway, потрібні під час запуску

Ці методи gateway для запуску все одно мають уникати зарезервованих
просторів імен основного адміністратора, як-от `config.*` або `update.*`.

**Що НЕ має містити `setupEntry`:**

- Реєстрації CLI
- Фонові сервіси
- Важкі імпорти runtime (криптографія, SDK)
- Методи gateway, потрібні лише після запуску

### Вузькі імпорти допоміжних засобів налаштування

Для гарячих шляхів лише налаштування віддавайте перевагу вузьким швам допоміжних засобів налаштування замість ширшої
парасольки `plugin-sdk/setup`, коли вам потрібна лише частина поверхні налаштування:

| Шлях імпорту                       | Використовуйте для                                                                       | Ключові експорти                                                                                                                                                                                                                                                                              |
| ---------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | допоміжні засоби runtime під час налаштування, які залишаються доступними в `setupEntry` / відкладеному запуску каналу | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | адаптери налаштування облікових записів, що враховують середовище                       | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                         |
| `plugin-sdk/setup-tools`           | допоміжні засоби CLI/архівів/документації для налаштування/встановлення                 | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

Використовуйте ширший шов `plugin-sdk/setup`, коли вам потрібен повний спільний
набір інструментів налаштування, включно з допоміжними засобами patch-конфігурації, такими як
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

Адаптери patch для налаштування залишаються безпечними для імпорту на гарячому шляху. Їхня вбудована
ледача перевірка contract-surface для підвищення одного облікового запису
є лінивою, тому імпорт `plugin-sdk/setup-runtime` не завантажує завчасно
виявлення вбудованої contract-surface до фактичного використання адаптера.

### Підвищення одного облікового запису, яке належить каналу

Коли канал оновлюється з верхньорівневої конфігурації одного облікового запису до
`channels.<id>.accounts.*`, типовою спільною поведінкою є переміщення значень,
що належать обліковому запису, до `accounts.default`.

Вбудовані канали можуть звузити або перевизначити це підвищення через свою
contract-surface налаштування:

- `singleAccountKeysToMove`: додаткові верхньорівневі ключі, які слід перемістити до
  підвищеного облікового запису
- `namedAccountPromotionKeys`: коли іменовані облікові записи вже існують, лише ці
  ключі переміщуються до підвищеного облікового запису; спільні ключі політики/доставки залишаються в корені
  каналу
- `resolveSingleAccountPromotionTarget(...)`: вибір наявного облікового запису,
  який отримує підвищені значення

Matrix — поточний вбудований приклад. Якщо вже існує рівно один іменований обліковий запис Matrix
або якщо `defaultAccount` вказує на наявний неканонічний ключ, наприклад
`Ops`, підвищення зберігає цей обліковий запис замість створення нового запису
`accounts.default`.

## Схема конфігурації

Конфігурація плагіна перевіряється відповідно до JSON Schema у вашому маніфесті. Користувачі
налаштовують плагіни через:

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

Ваш плагін отримує цю конфігурацію як `api.pluginConfig` під час реєстрації.

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

Використовуйте `buildChannelConfigSchema` з `openclaw/plugin-sdk/core`, щоб перетворити
схему Zod на обгортку `ChannelConfigSchema`, яку перевіряє OpenClaw:

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/core";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

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
`dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` та інші можливості.
Див. пакети вбудованих плагінів (наприклад, плагін Discord `src/channel.setup.ts`) для
повних прикладів.

Для запитів списку дозволених DM, яким потрібен лише стандартний
потік `note -> prompt -> parse -> merge -> patch`, віддавайте перевагу спільним допоміжним засобам налаштування
з `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)` і
`createNestedChannelParsedAllowFromPrompt(...)`.

Для блоків статусу налаштування каналу, які відрізняються лише мітками, оцінками та необов’язковими
додатковими рядками, віддавайте перевагу `createStandardChannelSetupStatus(...)` з
`openclaw/plugin-sdk/setup` замість ручного створення однакового об’єкта `status` у
кожному плагіні.

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

`plugin-sdk/channel-setup` також надає низькорівневі
конструктори `createOptionalChannelSetupAdapter(...)` і
`createOptionalChannelSetupWizard(...)`, коли вам потрібна лише одна половина
цієї необов’язкової поверхні встановлення.

Згенеровані необов’язкові adapter/wizard відмовляють у закритому режимі під час реальних записів конфігурації. Вони
повторно використовують одне повідомлення про необхідність встановлення у `validateInput`,
`applyAccountConfig` і `finalize`, а також додають посилання на документацію, якщо задано `docsPath`.

Для UI налаштування, що спираються на бінарні файли, віддавайте перевагу спільним делегованим допоміжним засобам замість
копіювання однакового glue-коду бінарних файлів/стану в кожен канал:

- `createDetectedBinaryStatus(...)` для блоків стану, що відрізняються лише мітками,
  підказками, оцінками та виявленням бінарного файла
- `createCliPathTextInput(...)` для текстових полів на основі шляху
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` і
  `createDelegatedResolveConfigured(...)`, коли `setupEntry` має ліниво переспрямовувати до
  важчого повного майстра
- `createDelegatedTextInputShouldPrompt(...)`, коли `setupEntry` потрібно лише
  делегувати рішення `textInputs[*].shouldPrompt`

## Публікація та встановлення

**Зовнішні плагіни:** опублікуйте в [ClawHub](/uk/tools/clawhub) або npm, а потім встановіть:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw спочатку намагається використати ClawHub і автоматично переходить до npm у разі невдачі. Ви також можете
явно примусово використати ClawHub:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # Лише ClawHub
```

Відповідного перевизначення `npm:` не існує. Використовуйте звичайну специфікацію npm-пакета, коли
вам потрібен шлях npm після резервного переходу з ClawHub:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Плагіни в репозиторії:** розмістіть їх у дереві workspace вбудованих плагінів, і вони
автоматично виявлятимуться під час збірки.

**Користувачі можуть встановлювати:**

```bash
openclaw plugins install <package-name>
```

<Info>
  Для встановлень із джерела npm `openclaw plugins install` виконує
  `npm install --ignore-scripts` (без lifecycle-скриптів). Зберігайте дерева залежностей плагіна
  чистими JS/TS і уникайте пакетів, які потребують збірок через `postinstall`.
</Info>

## Пов’язане

- [SDK Entry Points](/uk/plugins/sdk-entrypoints) -- `definePluginEntry` і `defineChannelPluginEntry`
- [Plugin Manifest](/uk/plugins/manifest) -- повний довідник зі схемою маніфесту
- [Building Plugins](/uk/plugins/building-plugins) -- покроковий посібник для початку роботи
