---
read_when:
    - Ви додаєте майстер налаштування до Plugin
    - Вам потрібно зрозуміти різницю між setup-entry.ts і index.ts
    - Ви визначаєте схеми конфігурації Plugin або метадані openclaw у package.json
sidebarTitle: Setup and Config
summary: Майстри налаштування, setup-entry.ts, схеми конфігурації та метадані package.json
title: Налаштування Plugin і конфігурація
x-i18n:
    generated_at: "2026-04-23T21:03:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 25474e56927fa9d60616413191096f721ba542a7088717d80c277dfb34746d10
    source_path: plugins/sdk-setup.md
    workflow: 15
---

Довідка щодо пакування Plugin (`package.json` metadata), маніфестів
(`openclaw.plugin.json`), setup entry та схем конфігурації.

<Tip>
  **Шукаєте покроковий посібник?** Інструкції описують пакування в контексті:
  [Channel Plugins](/uk/plugins/sdk-channel-plugins#step-1-package-and-manifest) і
  [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-1-package-and-manifest).
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

**Plugin provider-а / базова лінія публікації ClawHub:**

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
обов’язкові. Канонічні фрагменти для публікації знаходяться в
`docs/snippets/plugin-publish/`.

### Поля `openclaw`

| Поле         | Тип        | Опис                                                                                                                     |
| ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| `extensions` | `string[]` | Файли entry point (відносно кореня пакета)                                                                               |
| `setupEntry` | `string`   | Полегшений entry лише для setup (необов’язковий)                                                                         |
| `channel`    | `object`   | Метадані каталогу каналів для setup, picker, quickstart і поверхонь status                                              |
| `providers`  | `string[]` | ID provider-ів, зареєстрованих цим Plugin                                                                                |
| `install`    | `object`   | Підказки встановлення: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Прапорці поведінки під час startup                                                                                       |

### `openclaw.channel`

`openclaw.channel` — це дешеві метадані пакета для виявлення каналу й поверхонь setup
до завантаження runtime.

| Поле                                   | Тип        | Що воно означає                                                              |
| -------------------------------------- | ---------- | ---------------------------------------------------------------------------- |
| `id`                                   | `string`   | Канонічний id каналу.                                                        |
| `label`                                | `string`   | Основна назва каналу.                                                        |
| `selectionLabel`                       | `string`   | Назва в picker/setup, коли вона має відрізнятися від `label`.               |
| `detailLabel`                          | `string`   | Вторинна назва для багатших каталогів каналів і поверхонь status.           |
| `docsPath`                             | `string`   | Шлях документації для setup і selection links.                              |
| `docsLabel`                            | `string`   | Назва для посилань на docs, коли вона має відрізнятися від id каналу.       |
| `blurb`                                | `string`   | Короткий опис для онбордингу/каталогу.                                      |
| `order`                                | `number`   | Порядок сортування в каталогах каналів.                                     |
| `aliases`                              | `string[]` | Додаткові lookup aliases для вибору каналу.                                 |
| `preferOver`                           | `string[]` | Plugin/channel id нижчого пріоритету, які цей канал має випереджати.        |
| `systemImage`                          | `string`   | Необов’язкова назва icon/system-image для UI-каталогів каналів.             |
| `selectionDocsPrefix`                  | `string`   | Текст-префікс перед посиланнями на docs у selection surfaces.               |
| `selectionDocsOmitLabel`               | `boolean`  | Показувати шлях docs напряму замість позначеного посилання в тексті вибору. |
| `selectionExtras`                      | `string[]` | Додаткові короткі рядки, що додаються в selection copy.                     |
| `markdownCapable`                      | `boolean`  | Позначає канал як здатний до markdown для рішень щодо вихідного форматування. |
| `exposure`                             | `object`   | Керування видимістю каналу для setup, списків налаштованого та docs surfaces. |
| `quickstartAllowFrom`                  | `boolean`  | Вмикає цей канал у стандартний flow `allowFrom` quickstart.                 |
| `forceAccountBinding`                  | `boolean`  | Вимагати явне прив’язування account навіть коли існує лише один account.    |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Віддавати перевагу session lookup під час розв’язання announce targets для цього каналу. |

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

- `configured`: включати канал у поверхні списків налаштованого/status-типу
- `setup`: включати канал в інтерактивні picker-и setup/configure
- `docs`: позначати канал як публічний у поверхнях docs/navigation

`showConfigured` і `showInSetup` усе ще підтримуються як legacy alias-и. Віддавайте
перевагу `exposure`.

### `openclaw.install`

`openclaw.install` — це метадані пакета, а не метадані маніфесту.

| Поле                         | Тип                  | Що воно означає                                                                  |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Канонічний npm spec для потоків install/update.                                  |
| `localPath`                  | `string`             | Локальний шлях встановлення для розробки або вбудованого варіанта.              |
| `defaultChoice`              | `"npm"` \| `"local"` | Бажане джерело встановлення, коли доступні обидва варіанти.                     |
| `minHostVersion`             | `string`             | Мінімально підтримувана версія OpenClaw у формі `>=x.y.z`.                      |
| `expectedIntegrity`          | `string`             | Очікуваний рядок npm dist integrity, зазвичай `sha512-...`, для pinned install. |
| `allowInvalidConfigRecovery` | `boolean`            | Дозволяє потокам перевстановлення вбудованого Plugin відновлюватися після певних stale-config failures. |

Інтерактивний онбординг також використовує `openclaw.install` для поверхонь
install-on-demand. Якщо ваш Plugin показує вибір auth provider-а або метадані setup/catalog channel до завантаження runtime, онбординг може показати цей варіант, запропонувати npm чи local install, установити або ввімкнути Plugin, а потім продовжити обраний
flow. Варіанти онбордингу через npm вимагають довірених метаданих каталогу з registry
`npmSpec`; точні версії та `expectedIntegrity` — необов’язкові pins. Якщо
`expectedIntegrity` наявний, потоки install/update його застосовують. Тримайте метадані "що
показувати" в `openclaw.plugin.json`, а метадані "як це встановлювати" — у
`package.json`.

Якщо задано `minHostVersion`, потоки install і завантаження manifest-registry обидва
застосовують його. Старіші host-и пропускають Plugin; невалідні рядки версії відхиляються.

Для pinned npm install тримайте точну версію в `npmSpec` і додавайте
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

`allowInvalidConfigRecovery` — це не загальний обхід для зламаних конфігурацій. Він призначений
лише для вузького відновлення вбудованих Plugin, щоб reinstall/setup могли виправити відомі залишки після оновлення на кшталт відсутнього шляху вбудованого Plugin або stale-запису `channels.<id>` для того самого Plugin. Якщо конфігурація зламана з інших причин, install усе одно завершується в закритий спосіб і просить оператора запустити `openclaw doctor --fix`.

### Відкладене повне завантаження

Plugin каналу може ввімкнути відкладене завантаження так:

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

Коли це ввімкнено, OpenClaw завантажує лише `setupEntry` під час фази startup
до початку listen, навіть для вже налаштованих каналів. Повний entry завантажується після того,
як gateway починає слухати.

<Warning>
  Увімкайте відкладене завантаження лише тоді, коли ваш `setupEntry` реєструє все, що
  потрібно gateway до початку listen (реєстрація каналу, HTTP routes,
  gateway methods). Якщо потрібні можливості startup належать повному entry, залишайте
  типову поведінку.
</Warning>

Якщо ваш setup/full entry реєструє gateway RPC methods, тримайте їх на
префіксі, специфічному для Plugin. Зарезервовані core admin namespaces (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) лишаються у власності core і завжди розв’язуються
як `operator.admin`.

## Маніфест Plugin

Кожен native Plugin має постачатися з `openclaw.plugin.json` у корені пакета.
OpenClaw використовує його для перевірки конфігурації без виконання коду Plugin.

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

Навіть plugins без конфігурації повинні мати схему. Порожня схема є валідною:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Повну довідку зі схеми див. в [Plugin Manifest](/uk/plugins/manifest).

## Публікація в ClawHub

Для пакетів Plugin використовуйте команду ClawHub, специфічну для пакета:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Legacy alias публікації лише для skills призначений для Skills. Пакети Plugin завжди
мають використовувати `clawhub package publish`.

## Setup entry

Файл `setup-entry.ts` — це полегшена альтернатива `index.ts`, яку
OpenClaw завантажує, коли йому потрібні лише поверхні setup (онбординг, відновлення конфігурації,
перевірка вимкненого каналу).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Це дає змогу не завантажувати важкий runtime code (crypto libraries, CLI registrations,
background services) під час потоків setup.

Вбудовані workspace channels, які тримають безпечні для setup exports у sidecar modules, можуть
використовувати `defineBundledChannelSetupEntry(...)` з
`openclaw/plugin-sdk/channel-entry-contract` замість
`defineSetupPluginEntry(...)`. Цей bundled contract також підтримує необов’язковий
export `runtime`, щоб wiring runtime під час setup залишався полегшеним і явним.

**Коли OpenClaw використовує `setupEntry` замість повного entry:**

- Канал вимкнено, але потрібні поверхні setup/onboarding
- Канал увімкнено, але не налаштовано
- Увімкнено відкладене завантаження (`deferConfiguredChannelFullLoadUntilAfterListen`)

**Що має реєструвати `setupEntry`:**

- Об’єкт channel plugin (через `defineSetupPluginEntry`)
- Будь-які HTTP routes, потрібні до початку listen gateway
- Будь-які gateway methods, потрібні під час startup

Ці gateway methods для startup однаково мають уникати зарезервованих core admin
namespaces, таких як `config.*` або `update.*`.

**Чого НЕ має містити `setupEntry`:**

- Реєстрації CLI
- Background services
- Важкі runtime imports (crypto, SDK)
- Gateway methods, потрібні лише після startup

### Вузькі імпорти helper-ів setup

Для гарячих шляхів лише setup надавайте перевагу вузьким seams helper-ів setup замість ширшої
парасольки `plugin-sdk/setup`, коли вам потрібна лише частина поверхні setup:

| Шлях імпорту                       | Використовуйте для                                                                     | Ключові exports                                                                                                                                                                                                                                                                               |
| ---------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | helper-и runtime під час setup, які лишаються доступними в `setupEntry` / відкладеному startup каналу | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | account setup adapters з урахуванням середовища                                       | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                         |
| `plugin-sdk/setup-tools`           | helper-и CLI/archive/docs для setup/install                                            | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                               |

Використовуйте ширший seam `plugin-sdk/setup`, коли вам потрібен повний спільний
набір інструментів setup, включно з helper-ами patch конфігурації, такими як
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

Adapters patch setup залишаються безпечними для імпорту в гарячому шляху. Їхній bundled
lookup contract-surface для single-account promotion є лінивим, тож імпорт
`plugin-sdk/setup-runtime` не завантажує eager-способом bundled contract-surface
discovery до фактичного використання adapter-а.

### Channel-owned single-account promotion

Коли канал оновлюється від top-level конфігурації single-account до
`channels.<id>.accounts.*`, типова спільна поведінка полягає в перенесенні
promoted account-scoped values у `accounts.default`.

Вбудовані канали можуть звузити або перевизначити це перенесення через свій setup
contract surface:

- `singleAccountKeysToMove`: додаткові top-level keys, які потрібно перенести в
  promoted account
- `namedAccountPromotionKeys`: коли іменовані accounts уже існують, лише ці
  keys переносяться в promoted account; спільні keys policy/delivery лишаються в корені
  каналу
- `resolveSingleAccountPromotionTarget(...)`: вибрати, який наявний account
  отримає promoted values

Поточний bundled-приклад — Matrix. Якщо вже існує рівно один іменований Matrix account
або якщо `defaultAccount` вказує на наявний неканонічний key на кшталт
`Ops`, перенесення зберігає цей account замість створення нового
запису `accounts.default`.

## Схема конфігурації

Конфігурація Plugin перевіряється відносно JSON Schema у вашому маніфесті. Користувачі
налаштовують plugins так:

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

Plugin каналу може надавати інтерактивні setup wizards для `openclaw onboard`.
Wizard — це об’єкт `ChannelSetupWizard` у `ChannelPlugin`:

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
`dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` та інше.
Повні приклади див. у пакетах вбудованих plugins (наприклад, Plugin Discord `src/channel.setup.ts`).

Для prompt-ів DM allowlist, яким потрібен лише стандартний
flow `note -> prompt -> parse -> merge -> patch`, віддавайте перевагу спільним helper-ам setup
із `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)` і
`createNestedChannelParsedAllowFromPrompt(...)`.

Для блоків status setup каналу, які відрізняються лише labels, scores і необов’язковими
додатковими рядками, віддавайте перевагу `createStandardChannelSetupStatus(...)` з
`openclaw/plugin-sdk/setup` замість ручного повторення того самого об’єкта `status` у
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

`plugin-sdk/channel-setup` також надає нижчорівневі builder-и
`createOptionalChannelSetupAdapter(...)` і
`createOptionalChannelSetupWizard(...)`, коли вам потрібна лише одна половина
цієї необов’язкової install-surface.

Згенеровані optional adapter/wizard завершуються в закритий спосіб під час реальних записів конфігурації. Вони
повторно використовують одне повідомлення про необхідність install у `validateInput`,
`applyAccountConfig` і `finalize`, а також додають посилання на docs, коли задано `docsPath`.

Для setup UI, прив’язаних до binary, надавайте перевагу спільним delegated helper-ам замість
копіювання однакового glue binary/status у кожен канал:

- `createDetectedBinaryStatus(...)` для блоків status, які відрізняються лише labels,
  hints, scores і виявленням binary
- `createCliPathTextInput(...)` для text inputs, прив’язаних до path
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` і
  `createDelegatedResolveConfigured(...)`, коли `setupEntry` має ліниво пересилати до важчого повного wizard
- `createDelegatedTextInputShouldPrompt(...)`, коли `setupEntry` потрібно лише
  делегувати рішення `textInputs[*].shouldPrompt`

## Публікація й установлення

**Зовнішні plugins:** публікуйте в [ClawHub](/uk/tools/clawhub) або npm, а потім установлюйте:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw спочатку пробує ClawHub і автоматично повертається до npm. Ви також
можете явно примусово вибрати ClawHub:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # лише ClawHub
```

Відповідного перевизначення `npm:` немає. Використовуйте звичайний npm package spec, коли
потрібен шлях npm після fallback із ClawHub:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Plugins у репозиторії:** розміщуйте в дереві workspace вбудованих plugins, і вони автоматично
виявлятимуться під час build.

**Користувачі можуть установлювати:**

```bash
openclaw plugins install <package-name>
```

<Info>
  Для встановлень із npm команда `openclaw plugins install` запускає
  `npm install --ignore-scripts` (без lifecycle scripts). Тримайте дерева
  залежностей Plugin чистими JS/TS і уникайте пакетів, що потребують збірок через `postinstall`.
</Info>

Вбудовані plugins, якими володіє OpenClaw, — єдиний виняток для startup repair: коли
пакетне встановлення бачить Plugin, увімкнений через конфігурацію plugin, legacy channel config або
його bundled manifest з default-enabled, startup установлює відсутні runtime dependencies цього plugin перед import. Сторонні plugins не повинні покладатися на
встановлення під час startup; і далі використовуйте явний installer plugin.

## Пов’язане

- [SDK Entry Points](/uk/plugins/sdk-entrypoints) -- `definePluginEntry` і `defineChannelPluginEntry`
- [Plugin Manifest](/uk/plugins/manifest) -- повна довідка зі схеми маніфесту
- [Building Plugins](/uk/plugins/building-plugins) -- покроковий посібник для початку роботи
