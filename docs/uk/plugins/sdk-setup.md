---
read_when:
    - Ви додаєте майстер налаштування до Plugin
    - Вам потрібно зрозуміти різницю між `setup-entry.ts` і `index.ts`
    - Ви визначаєте схеми конфігурації Plugin або метадані `openclaw` у `package.json`
sidebarTitle: Setup and Config
summary: Майстри налаштування, `setup-entry.ts`, схеми конфігурації та метадані `package.json`
title: Налаштування Plugin і конфігурація
x-i18n:
    generated_at: "2026-04-25T21:54:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66c44a08db7c83ec981c92fadea54482e5d85af3cc3c4621916e3e0b1223d9a6
    source_path: plugins/sdk-setup.md
    workflow: 15
---

Довідник щодо пакування Plugin (метадані `package.json`), маніфестів
(`openclaw.plugin.json`), записів налаштування та схем конфігурації.

<Tip>
  **Шукаєте покрокове пояснення?** У practical-гайдах розглядається пакування в контексті:
  [Channel Plugins](/uk/plugins/sdk-channel-plugins#step-1-package-and-manifest) та
  [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Метадані пакунка

Ваш `package.json` має містити поле `openclaw`, яке повідомляє системі Plugin, що
надає ваш Plugin:

**Channel Plugin:**

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

**Provider Plugin / базовий шаблон публікації в ClawHub:**

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

Якщо ви публікуєте Plugin зовні в ClawHub, поля `compat` і `build`
є обов’язковими. Канонічні фрагменти для публікації розміщені в
`docs/snippets/plugin-publish/`.

### Поля `openclaw`

| Поле         | Тип        | Опис                                                                                                                    |
| ------------ | ---------- | ----------------------------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | Файли точок входу (відносно кореня пакунка)                                                                             |
| `setupEntry` | `string`   | Легка точка входу лише для налаштування (необов’язково)                                                                 |
| `channel`    | `object`   | Метадані каталогу Channel для налаштування, вибору, quickstart і поверхонь стану                                       |
| `providers`  | `string[]` | Ідентифікатори Provider, зареєстровані цим Plugin                                                                       |
| `install`    | `object`   | Підказки встановлення: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Прапори поведінки під час запуску                                                                                       |

### `openclaw.channel`

`openclaw.channel` — це недорогі метадані пакунка для виявлення Channel і поверхонь
налаштування до завантаження runtime.

| Поле                                   | Тип        | Що це означає                                                                 |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | Канонічний ідентифікатор Channel.                                             |
| `label`                                | `string`   | Основна мітка Channel.                                                        |
| `selectionLabel`                       | `string`   | Мітка для picker/налаштування, якщо вона має відрізнятися від `label`.        |
| `detailLabel`                          | `string`   | Додаткова детальна мітка для багатших каталогів Channel і поверхонь стану.    |
| `docsPath`                             | `string`   | Шлях документації для посилань у налаштуванні та виборі.                      |
| `docsLabel`                            | `string`   | Мітка-override для посилань на документацію, якщо вона має відрізнятися від id Channel. |
| `blurb`                                | `string`   | Короткий опис для онбордингу/каталогу.                                        |
| `order`                                | `number`   | Порядок сортування в каталогах Channel.                                       |
| `aliases`                              | `string[]` | Додаткові аліаси пошуку для вибору Channel.                                   |
| `preferOver`                           | `string[]` | Ідентифікатори Plugin/Channel нижчого пріоритету, які цей Channel має випереджати. |
| `systemImage`                          | `string`   | Необов’язкова назва іконки/system-image для каталогів UI Channel.             |
| `selectionDocsPrefix`                  | `string`   | Текст-префікс перед посиланнями на документацію в поверхнях вибору.           |
| `selectionDocsOmitLabel`               | `boolean`  | Показувати шлях документації напряму замість іменованого посилання в тексті вибору. |
| `selectionExtras`                      | `string[]` | Додаткові короткі рядки, що додаються в тексті вибору.                        |
| `markdownCapable`                      | `boolean`  | Позначає Channel як сумісний із markdown для рішень щодо вихідного форматування. |
| `exposure`                             | `object`   | Керування видимістю Channel для налаштування, списків налаштованого та поверхонь документації. |
| `quickstartAllowFrom`                  | `boolean`  | Додає цей Channel до стандартного quickstart-потоку налаштування `allowFrom`. |
| `forceAccountBinding`                  | `boolean`  | Вимагає явної прив’язки облікового запису, навіть якщо існує лише один обліковий запис. |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Надавати перевагу пошуку сесії під час визначення announce targets для цього Channel. |

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

- `configured`: включати Channel у поверхні списків налаштованого/стану
- `setup`: включати Channel в інтерактивні picker-и налаштування/конфігурації
- `docs`: позначати Channel як публічний у поверхнях документації/навігації

`showConfigured` і `showInSetup` усе ще підтримуються як застарілі аліаси. Надавайте
перевагу `exposure`.

### `openclaw.install`

`openclaw.install` — це метадані пакунка, а не метадані маніфесту.

| Поле                         | Тип                  | Що це означає                                                                     |
| ---------------------------- | -------------------- | --------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Канонічний npm spec для потоків встановлення/оновлення.                           |
| `localPath`                  | `string`             | Локальний шлях для розробки або вбудованого встановлення.                         |
| `defaultChoice`              | `"npm"` \| `"local"` | Бажане джерело встановлення, коли доступні обидва варіанти.                       |
| `minHostVersion`             | `string`             | Мінімальна підтримувана версія OpenClaw у форматі `>=x.y.z`.                      |
| `expectedIntegrity`          | `string`             | Очікуваний рядок цілісності npm dist, зазвичай `sha512-...`, для фіксованих встановлень. |
| `allowInvalidConfigRecovery` | `boolean`            | Дозволяє потокам перевстановлення вбудованого Plugin відновлюватися після окремих збоїв через застарілу конфігурацію. |

Інтерактивний онбординг також використовує `openclaw.install` для поверхонь
встановлення на вимогу. Якщо ваш Plugin надає варіанти автентифікації Provider або метадані
налаштування/каталогу Channel до завантаження runtime, онбординг може показати цей вибір,
запитати про npm чи локальне встановлення, встановити або ввімкнути Plugin, а потім
продовжити вибраний потік. Варіанти онбордингу через npm потребують довірених метаданих
каталогу з `npmSpec` реєстру; точні версії та `expectedIntegrity` — необов’язкові
фіксатори. Якщо присутній `expectedIntegrity`, потоки встановлення/оновлення
застосовують його перевірку. Зберігайте метадані “що показувати” в `openclaw.plugin.json`,
а метадані “як це встановлювати” — у `package.json`.

Якщо задано `minHostVersion`, і встановлення, і завантаження реєстру маніфестів
застосовують цю перевірку. Старіші хости пропускають Plugin; некоректні рядки версій
відхиляються.

Для фіксованих встановлень npm зберігайте точну версію в `npmSpec` і додавайте
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

`allowInvalidConfigRecovery` не є загальним обходом для зламаних конфігурацій. Воно
призначене лише для вузького відновлення вбудованого Plugin, щоб перевстановлення/налаштування
могло виправити відомі залишки після оновлення, як-от відсутній шлях до вбудованого Plugin
або застарілий запис `channels.<id>` для цього самого Plugin. Якщо конфігурація зламана з
непов’язаних причин, встановлення все одно безпечно завершується з відмовою й повідомляє
оператору виконати `openclaw doctor --fix`.

### Відкладене повне завантаження

Channel Plugins можуть увімкнути відкладене завантаження за допомогою:

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

Коли це ввімкнено, OpenClaw завантажує лише `setupEntry` під час фази запуску до
початку прослуховування, навіть для вже налаштованих Channel. Повна точка входу
завантажується після того, як Gateway починає слухати.

<Warning>
  Увімкнюйте відкладене завантаження лише тоді, коли ваш `setupEntry` реєструє все,
  що потрібно Gateway до початку прослуховування (реєстрація Channel, HTTP-маршрути,
  методи Gateway). Якщо необхідні можливості запуску належать повній точці входу,
  залишайте стандартну поведінку.
</Warning>

Якщо ваш запис налаштування/повний запис реєструє методи Gateway RPC, зберігайте їх
під префіксом, специфічним для Plugin. Зарезервовані простори імен core admin (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) залишаються під керуванням core і завжди
резолвляться до `operator.admin`.

## Маніфест Plugin

Кожен native Plugin має постачатися з `openclaw.plugin.json` у корені пакунка.
OpenClaw використовує його для валідації конфігурації без виконання коду Plugin.

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

Для Channel Plugins додайте `kind` і `channels`:

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

Навіть Plugins без конфігурації мають постачатися зі схемою. Порожня схема є валідною:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Див. [Plugin Manifest](/uk/plugins/manifest), щоб переглянути повний довідник схеми.

## Публікація в ClawHub

Для пакунків Plugin використовуйте команду ClawHub, специфічну для пакунків:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Застарілий аліас публікації лише для Skills призначений для Skills. Пакунки Plugin
завжди мають використовувати `clawhub package publish`.

## Точка входу налаштування

Файл `setup-entry.ts` — це легка альтернатива `index.ts`, яку OpenClaw завантажує,
коли потрібні лише поверхні налаштування (онбординг, відновлення конфігурації,
інспекція вимкненого Channel).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Це дає змогу уникнути завантаження важкого runtime-коду (бібліотеки crypto, реєстрації CLI,
фонові служби) під час потоків налаштування.

Вбудовані workspace Channel, які зберігають безпечні для налаштування експорти в sidecar-модулях, можуть
використовувати `defineBundledChannelSetupEntry(...)` з
`openclaw/plugin-sdk/channel-entry-contract` замість
`defineSetupPluginEntry(...)`. Цей вбудований контракт також підтримує необов’язковий
експорт `runtime`, щоб налаштування runtime під час setup залишалося легким і явним.

**Коли OpenClaw використовує `setupEntry` замість повної точки входу:**

- Channel вимкнено, але потрібні поверхні налаштування/онбордингу
- Channel увімкнено, але не налаштовано
- Увімкнено відкладене завантаження (`deferConfiguredChannelFullLoadUntilAfterListen`)

**Що має реєструвати `setupEntry`:**

- Об’єкт Channel Plugin (через `defineSetupPluginEntry`)
- Будь-які HTTP-маршрути, потрібні до того, як Gateway почне слухати
- Будь-які методи Gateway, потрібні під час запуску

Ці методи Gateway для запуску все одно мають уникати зарезервованих просторів
імен core admin, таких як `config.*` або `update.*`.

**Що НЕ має містити `setupEntry`:**

- Реєстрації CLI
- Фонові служби
- Важкі runtime-імпорти (crypto, SDK)
- Методи Gateway, потрібні лише після запуску

### Вузькі імпорти допоміжних засобів setup

Для гарячих шляхів лише setup віддавайте перевагу вузьким швам допоміжних засобів setup замість ширшого
парасолькового `plugin-sdk/setup`, якщо вам потрібна лише частина поверхні setup:

| Шлях імпорту                      | Використовуйте для                                                                          | Ключові експорти                                                                                                                                                                                                                                                                             |
| --------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | допоміжні засоби runtime під час setup, які залишаються доступними в `setupEntry` / відкладеному запуску Channel | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | адаптери setup облікових записів з урахуванням середовища                                  | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                       |
| `plugin-sdk/setup-tools`           | допоміжні засоби CLI/архіву/документації для setup/install                                  | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                             |

Використовуйте ширший шов `plugin-sdk/setup`, коли вам потрібен повний спільний
набір інструментів setup, включно з допоміжними засобами для patch конфігурації, такими як
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

Адаптери patch для setup залишаються безпечними для імпорту на гарячому шляху. Їхній вбудований
lazy-пошук поверхні контракту для single-account promotion є відкладеним, тому імпорт
`plugin-sdk/setup-runtime` не виконує жадібне завантаження виявлення поверхні вбудованого контракту
до моменту фактичного використання адаптера.

### Single-account promotion, що належить Channel

Коли Channel оновлюється з однорівневої top-level конфігурації одного облікового запису до
`channels.<id>.accounts.*`, типова спільна поведінка полягає в перенесенні
значень рівня облікового запису, що просуваються, до `accounts.default`.

Вбудовані Channel можуть звузити або перевизначити це просування через свою setup
поверхню контракту:

- `singleAccountKeysToMove`: додаткові ключі верхнього рівня, які слід перемістити до
  просунутого облікового запису
- `namedAccountPromotionKeys`: якщо іменовані облікові записи вже існують, лише ці
  ключі переміщуються до просунутого облікового запису; спільні ключі policy/delivery залишаються в корені
  Channel
- `resolveSingleAccountPromotionTarget(...)`: вибрати, який наявний обліковий запис
  отримає просунуті значення

Matrix — поточний вбудований приклад. Якщо вже існує рівно один іменований обліковий запис Matrix,
або якщо `defaultAccount` вказує на наявний неканонічний ключ, наприклад
`Ops`, просування зберігає цей обліковий запис замість створення нового запису
`accounts.default`.

## Схема конфігурації

Конфігурація Plugin перевіряється за JSON Schema у вашому маніфесті. Користувачі
налаштовують Plugins через:

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

Під час реєстрації ваш Plugin отримує цю конфігурацію як `api.pluginConfig`.

Для конфігурації, специфічної для Channel, використовуйте натомість секцію конфігурації Channel:

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

### Побудова схем конфігурації Channel

Використовуйте `buildChannelConfigSchema`, щоб перетворити схему Zod на
обгортку `ChannelConfigSchema`, яку використовують артефакти конфігурації, що належать Plugin:

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

Для сторонніх Plugins холодний шлях контракту все ще залишається маніфестом Plugin:
віддзеркальте згенеровану JSON Schema в `openclaw.plugin.json#channelConfigs`, щоб
поверхні схеми конфігурації, setup і UI могли перевіряти `channels.<id>` без
завантаження runtime-коду.

## Майстри налаштування

Channel Plugins можуть надавати інтерактивні майстри налаштування для `openclaw onboard`.
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
Повні приклади дивіться у вбудованих пакунках Plugin (наприклад, Plugin Discord `src/channel.setup.ts`).

Для prompt-ів списку дозволених DM, яким потрібен лише стандартний потік
`note -> prompt -> parse -> merge -> patch`, віддавайте перевагу спільним допоміжним засобам setup
з `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)` і
`createNestedChannelParsedAllowFromPrompt(...)`.

Для блоків статусу setup Channel, які відрізняються лише мітками, оцінками та необов’язковими
додатковими рядками, віддавайте перевагу `createStandardChannelSetupStatus(...)` з
`openclaw/plugin-sdk/setup` замість ручного створення того самого об’єкта `status` у
кожному Plugin.

Для необов’язкових поверхонь setup, які мають з’являтися лише в певних контекстах, використовуйте
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

`plugin-sdk/channel-setup` також надає нижчорівневі конструктори
`createOptionalChannelSetupAdapter(...)` і
`createOptionalChannelSetupWizard(...)`, коли вам потрібна лише одна половина
цієї необов’язкової поверхні встановлення.

Згенеровані необов’язкові adapter/wizard безпечно завершуються відмовою під час реальних записів конфігурації. Вони
повторно використовують одне повідомлення про необхідність встановлення в `validateInput`,
`applyAccountConfig` і `finalize`, а також додають посилання на документацію, якщо задано `docsPath`.

Для UI налаштування, що працюють через binary, віддавайте перевагу спільним делегованим helper-ам замість
копіювання того самого glue-коду binary/status у кожен Channel:

- `createDetectedBinaryStatus(...)` для блоків статусу, які відрізняються лише мітками,
  підказками, оцінками та виявленням binary
- `createCliPathTextInput(...)` для `textInputs`, що працюють зі шляхом
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` і
  `createDelegatedResolveConfigured(...)`, коли `setupEntry` має ліниво переспрямовувати до
  важчого повного wizard
- `createDelegatedTextInputShouldPrompt(...)`, коли `setupEntry` потрібно лише
  делегувати рішення `textInputs[*].shouldPrompt`

## Публікація та встановлення

**Зовнішні Plugins:** опублікуйте в [ClawHub](/uk/tools/clawhub) або npm, а потім встановіть:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw спочатку намагається використати ClawHub і автоматично переходить на npm у разі невдачі. Ви також
можете явно примусово використати ClawHub:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # лише ClawHub
```

Відповідного override `npm:` не існує. Використовуйте звичайний npm package spec, якщо
вам потрібен шлях через npm після fallback із ClawHub:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Plugins у репозиторії:** розмістіть їх у дереві workspace вбудованих Plugin, і вони автоматично
виявлятимуться під час збірки.

**Користувачі можуть встановити:**

```bash
openclaw plugins install <package-name>
```

<Info>
  Для встановлень із npm `openclaw plugins install` запускає
  локальний для проєкту `npm install --ignore-scripts` (без lifecycle scripts), ігноруючи
  успадковані глобальні налаштування встановлення npm. Зберігайте дерева залежностей Plugin у чистому JS/TS
  та уникайте пакунків, які потребують збірки через `postinstall`.
</Info>

Вбудовані Plugins, що належать OpenClaw, — єдиний виняток для відновлення під час запуску: коли
упаковане встановлення бачить один із них увімкненим через конфігурацію Plugin, застарілу конфігурацію Channel або
його вбудований маніфест із увімкненням за замовчуванням, під час запуску встановлюються відсутні
runtime-залежності цього Plugin перед імпортом. Стороннім Plugins не слід покладатися на встановлення
під час запуску; продовжуйте використовувати явний installer Plugin.

## Пов’язане

- [Точки входу SDK](/uk/plugins/sdk-entrypoints) — `definePluginEntry` і `defineChannelPluginEntry`
- [Маніфест Plugin](/uk/plugins/manifest) — повний довідник схеми маніфесту
- [Створення Plugins](/uk/plugins/building-plugins) — покроковий посібник для початку роботи
