---
read_when:
    - Ви додаєте майстер налаштування до Plugin
    - Потрібно розуміти різницю між setup-entry.ts та index.ts
    - Ви визначаєте схеми конфігурації Plugin або метадані openclaw у package.json
sidebarTitle: Setup and config
summary: Майстри налаштування, setup-entry.ts, схеми конфігурації та метадані package.json
title: Налаштування та конфігурація Plugin
x-i18n:
    generated_at: "2026-04-28T11:20:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: b915993d7fc2ace1a21da551be5afec831c72974e1d89d4381e85f3b0ac759a6
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Довідник із пакування Plugin (`package.json` metadata), маніфестів (`openclaw.plugin.json`), setup-записів і схем конфігурації.

<Tip>
**Шукаєте покроковий посібник?** Практичні посібники пояснюють пакування в контексті: [Channel plugins](/uk/plugins/sdk-channel-plugins#step-1-package-and-manifest) і [Provider plugins](/uk/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Метадані пакета

Ваш `package.json` потребує поля `openclaw`, яке повідомляє системі Plugin, що надає ваш Plugin:

<Tabs>
  <Tab title="Channel plugin">
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
  <Tab title="Provider plugin / ClawHub baseline">
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
  </Tab>
</Tabs>

<Note>
Якщо ви публікуєте Plugin зовнішньо на ClawHub, ці поля `compat` і `build` обов’язкові. Канонічні фрагменти для публікації містяться в `docs/snippets/plugin-publish/`.
</Note>

### Поля `openclaw`

<ParamField path="extensions" type="string[]">
  Файли точок входу (відносно кореня пакета).
</ParamField>
<ParamField path="setupEntry" type="string">
  Легкий запис лише для setup (необов’язково).
</ParamField>
<ParamField path="channel" type="object">
  Метадані каталогу каналу для setup, вибору, quickstart і поверхонь статусу.
</ParamField>
<ParamField path="providers" type="string[]">
  Ідентифікатори провайдерів, зареєстровані цим Plugin.
</ParamField>
<ParamField path="install" type="object">
  Підказки для встановлення: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  Прапорці поведінки запуску.
</ParamField>

### `openclaw.channel`

`openclaw.channel` — це легкі метадані пакета для виявлення каналів і setup-поверхонь до завантаження runtime.

| Поле                                   | Тип        | Що це означає                                                                 |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | Канонічний ідентифікатор каналу.                                              |
| `label`                                | `string`   | Основна мітка каналу.                                                         |
| `selectionLabel`                       | `string`   | Мітка вибору/setup, коли вона має відрізнятися від `label`.                   |
| `detailLabel`                          | `string`   | Вторинна детальна мітка для розширених каталогів каналів і поверхонь статусу. |
| `docsPath`                             | `string`   | Шлях документації для посилань setup і вибору.                                |
| `docsLabel`                            | `string`   | Перевизначає мітку для посилань документації, коли вона має відрізнятися від ідентифікатора каналу. |
| `blurb`                                | `string`   | Короткий опис для онбордингу/каталогу.                                        |
| `order`                                | `number`   | Порядок сортування в каталогах каналів.                                       |
| `aliases`                              | `string[]` | Додаткові псевдоніми пошуку для вибору каналу.                                |
| `preferOver`                           | `string[]` | Нижчопріоритетні ідентифікатори Plugin/каналів, які цей канал має випереджати. |
| `systemImage`                          | `string`   | Необов’язкова назва іконки/system-image для UI-каталогів каналів.             |
| `selectionDocsPrefix`                  | `string`   | Текст префікса перед посиланнями документації в поверхнях вибору.             |
| `selectionDocsOmitLabel`               | `boolean`  | Показувати шлях документації напряму замість підписаного посилання документації в тексті вибору. |
| `selectionExtras`                      | `string[]` | Додаткові короткі рядки, що додаються до тексту вибору.                       |
| `markdownCapable`                      | `boolean`  | Позначає канал як здатний працювати з markdown для рішень щодо вихідного форматування. |
| `exposure`                             | `object`   | Керування видимістю каналу для setup, налаштованих списків і поверхонь документації. |
| `quickstartAllowFrom`                  | `boolean`  | Долучає цей канал до стандартного quickstart-потоку setup `allowFrom`.        |
| `forceAccountBinding`                  | `boolean`  | Вимагає явного прив’язування облікового запису, навіть коли існує лише один обліковий запис. |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Надає перевагу пошуку сесії під час визначення цілей оголошень для цього каналу. |

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

- `configured`: включати канал у налаштовані/статусні поверхні списків
- `setup`: включати канал в інтерактивні засоби вибору setup/configure
- `docs`: позначати канал як публічний у поверхнях документації/навігації

<Note>
`showConfigured` і `showInSetup` залишаються підтримуваними як застарілі псевдоніми. Надавайте перевагу `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` — це метадані пакета, а не метадані маніфесту.

| Поле                         | Тип                  | Що це означає                                                                  |
| ---------------------------- | -------------------- | ------------------------------------------------------------------------------ |
| `npmSpec`                    | `string`             | Канонічна npm-специфікація для потоків встановлення/оновлення.                 |
| `localPath`                  | `string`             | Локальний шлях розробки або шлях встановлення в комплекті.                     |
| `defaultChoice`              | `"npm"` \| `"local"` | Бажане джерело встановлення, коли доступні обидва.                             |
| `minHostVersion`             | `string`             | Мінімальна підтримувана версія OpenClaw у формі `>=x.y.z`.                     |
| `expectedIntegrity`          | `string`             | Очікуваний рядок цілісності npm dist, зазвичай `sha512-...`, для закріплених встановлень. |
| `allowInvalidConfigRecovery` | `boolean`            | Дозволяє потокам перевстановлення bundled-plugin відновлюватися після конкретних збоїв застарілої конфігурації. |

<AccordionGroup>
  <Accordion title="Поведінка онбордингу">
    Інтерактивний онбординг також використовує `openclaw.install` для поверхонь встановлення на вимогу. Якщо ваш Plugin надає варіанти автентифікації провайдера або метадані setup/каталогу каналу до завантаження runtime, онбординг може показати цей вибір, запросити npm чи локальне встановлення, встановити або увімкнути Plugin, а потім продовжити вибраний потік. Варіанти npm-онбордингу потребують довірених метаданих каталогу з реєстровим `npmSpec`; точні версії та `expectedIntegrity` є необов’язковими закріпленнями. Якщо `expectedIntegrity` присутній, потоки встановлення/оновлення забезпечують його дотримання. Зберігайте метадані «що показувати» в `openclaw.plugin.json`, а метадані «як це встановити» — у `package.json`.
  </Accordion>
  <Accordion title="Застосування minHostVersion">
    Якщо `minHostVersion` задано, його застосовують і встановлення, і завантаження registry маніфестів. Старіші хости пропускають Plugin; недійсні рядки версій відхиляються.
  </Accordion>
  <Accordion title="Закріплені npm-встановлення">
    Для закріплених npm-встановлень зберігайте точну версію в `npmSpec` і додайте очікувану цілісність артефакта:

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
  <Accordion title="Область дії allowInvalidConfigRecovery">
    `allowInvalidConfigRecovery` не є загальним обходом для зламаних конфігурацій. Він призначений лише для вузького відновлення bundled-plugin, щоб перевстановлення/setup могли виправити відомі залишки після оновлення, як-от відсутній шлях до bundled Plugin або застарілий запис `channels.<id>` для того самого Plugin. Якщо конфігурація зламана з непов’язаних причин, встановлення все одно завершується закрито та повідомляє оператору запустити `openclaw doctor --fix`.
  </Accordion>
</AccordionGroup>

### Відкладене повне завантаження

Channel plugins можуть увімкнути відкладене завантаження за допомогою:

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

Коли це ввімкнено, OpenClaw завантажує лише `setupEntry` під час фази запуску до початку прослуховування, навіть для вже налаштованих каналів. Повний запис завантажується після того, як Gateway починає прослуховування.

<Warning>
Вмикайте відкладене завантаження лише тоді, коли ваш `setupEntry` реєструє все, що потрібно Gateway до початку прослуховування (реєстрацію каналу, HTTP-маршрути, методи Gateway). Якщо повний запис володіє потрібними можливостями запуску, залиште типову поведінку.
</Warning>

Якщо ваш setup/повний запис реєструє RPC-методи Gateway, тримайте їх на префіксі, специфічному для Plugin. Зарезервовані основні простори імен адміністрування (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) залишаються у власності core і завжди розв’язуються в `operator.admin`.

## Маніфест Plugin

Кожен native Plugin повинен постачати `openclaw.plugin.json` у корені пакета. OpenClaw використовує його для перевірки конфігурації без виконання коду Plugin.

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

Для Channel plugins додайте `kind` і `channels`:

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

Навіть Plugin без конфігурації повинні постачати схему. Порожня схема є дійсною:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Див. [Маніфест Plugin](/uk/plugins/manifest) для повного довідника схеми.

## Публікація в ClawHub

Для пакетів Plugin використовуйте команду ClawHub, специфічну для пакета:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
Застарілий псевдонім публікації лише для Skills призначений для Skills. Пакети Plugin завжди мають використовувати `clawhub package publish`.
</Note>

## Setup-запис

Файл `setup-entry.ts` — це легка альтернатива `index.ts`, яку OpenClaw завантажує, коли йому потрібні лише setup-поверхні (онбординг, виправлення конфігурації, інспекція вимкненого каналу).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Це дає змогу не завантажувати важкий runtime-код (криптографічні бібліотеки, реєстрації CLI, фонові служби) під час потоків налаштування.

Вбудовані канали робочого простору, які тримають setup-безпечні експорти в допоміжних модулях, можуть використовувати `defineBundledChannelSetupEntry(...)` з `openclaw/plugin-sdk/channel-entry-contract` замість `defineSetupPluginEntry(...)`. Цей вбудований контракт також підтримує необов’язковий експорт `runtime`, щоб runtime-зв’язування під час налаштування залишалося легким і явним.

<AccordionGroup>
  <Accordion title="Коли OpenClaw використовує setupEntry замість повного entry">
    - Канал вимкнено, але йому потрібні поверхні налаштування/onboarding.
    - Канал увімкнено, але не налаштовано.
    - Увімкнено відкладене завантаження (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Що setupEntry має реєструвати">
    - Об’єкт plugin каналу (через `defineSetupPluginEntry`).
    - Будь-які HTTP-маршрути, потрібні до gateway listen.
    - Будь-які gateway-методи, потрібні під час запуску.

    Ці startup gateway-методи все одно мають уникати зарезервованих core admin namespaces, як-от `config.*` або `update.*`.

  </Accordion>
  <Accordion title="Що setupEntry НЕ має містити">
    - Реєстрації CLI.
    - Фонові служби.
    - Важкі runtime-імпорти (crypto, SDK).
    - Gateway-методи, потрібні лише після запуску.

  </Accordion>
</AccordionGroup>

### Вузькі імпорти помічників налаштування

Для гарячих setup-only шляхів віддавайте перевагу вузьким seam помічників налаштування замість ширшої парасольки `plugin-sdk/setup`, коли вам потрібна лише частина поверхні налаштування:

| Шлях імпорту                       | Для чого використовувати                                                                  | Ключові експорти                                                                                                                                                                                                                                                                             |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | runtime-помічники часу налаштування, доступні в `setupEntry` / відкладеному запуску каналу | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | environment-aware адаптери налаштування акаунтів                                           | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | помічники CLI/archive/docs для налаштування/встановлення                                  | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

Використовуйте ширший seam `plugin-sdk/setup`, коли потрібен повний спільний набір інструментів налаштування, включно з помічниками config-patch, як-от `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Адаптери patch налаштування залишаються безпечними для hot-path під час імпорту. Їхній bundled single-account promotion contract-surface lookup є lazy, тож імпорт `plugin-sdk/setup-runtime` не завантажує eager-виявлення bundled contract-surface до фактичного використання адаптера.

### Просування single-account, яким володіє канал

Коли канал переходить від single-account top-level config до `channels.<id>.accounts.*`, стандартна спільна поведінка переміщує просунуті значення з областю дії акаунта в `accounts.default`.

Вбудовані канали можуть звузити або перевизначити це просування через свою setup contract surface:

- `singleAccountKeysToMove`: додаткові top-level ключі, які слід перемістити в просунутий акаунт
- `namedAccountPromotionKeys`: коли іменовані акаунти вже існують, лише ці ключі переміщуються в просунутий акаунт; спільні ключі policy/delivery залишаються в корені каналу
- `resolveSingleAccountPromotionTarget(...)`: виберіть, який наявний акаунт отримає просунуті значення

<Note>
Matrix є поточним вбудованим прикладом. Якщо вже існує рівно один іменований акаунт Matrix або якщо `defaultAccount` вказує на наявний неканонічний ключ, як-от `Ops`, просування зберігає цей акаунт замість створення нового запису `accounts.default`.
</Note>

## Схема конфігурації

Plugin config перевіряється за JSON Schema у вашому manifest. Користувачі налаштовують plugins через:

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

Ваш plugin отримує цю конфігурацію як `api.pluginConfig` під час реєстрації.

Для конфігурації, специфічної для каналу, натомість використовуйте розділ конфігурації каналу:

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

Використовуйте `buildChannelConfigSchema`, щоб перетворити Zod-схему на wrapper `ChannelConfigSchema`, який використовується plugin-owned артефактами конфігурації:

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

Для сторонніх plugins cold-path контрактом усе ще є plugin manifest: віддзеркальте згенеровану JSON Schema в `openclaw.plugin.json#channelConfigs`, щоб схема конфігурації, налаштування та UI-поверхні могли інспектувати `channels.<id>` без завантаження runtime-коду.

## Майстри налаштування

Channel plugins можуть надавати інтерактивні майстри налаштування для `openclaw onboard`. Майстер є об’єктом `ChannelSetupWizard` на `ChannelPlugin`:

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

Тип `ChannelSetupWizard` підтримує `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` та інше. Повні приклади дивіться у вбудованих пакетах plugins (наприклад, Discord plugin `src/channel.setup.ts`).

<AccordionGroup>
  <Accordion title="Спільні підказки allowFrom">
    Для підказок allowlist у DM, яким потрібен лише стандартний потік `note -> prompt -> parse -> merge -> patch`, віддавайте перевагу спільним помічникам налаштування з `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` і `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Стандартний статус налаштування каналу">
    Для блоків статусу налаштування каналу, які відрізняються лише labels, scores і необов’язковими extra lines, віддавайте перевагу `createStandardChannelSetupStatus(...)` з `openclaw/plugin-sdk/setup` замість ручного створення того самого об’єкта `status` у кожному plugin.
  </Accordion>
  <Accordion title="Необов’язкова поверхня налаштування каналу">
    Для необов’язкових поверхонь налаштування, які мають з’являтися лише в певних контекстах, використовуйте `createOptionalChannelSetupSurface` з `openclaw/plugin-sdk/channel-setup`:

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

    `plugin-sdk/channel-setup` також надає нижчорівневі builders `createOptionalChannelSetupAdapter(...)` і `createOptionalChannelSetupWizard(...)`, коли вам потрібна лише одна половина цієї optional-install поверхні.

    Згенерований optional adapter/wizard закривається з відмовою під час реальних записів конфігурації. Вони повторно використовують одне повідомлення install-required у `validateInput`, `applyAccountConfig` і `finalize`, а також додають посилання на docs, коли задано `docsPath`.

  </Accordion>
  <Accordion title="Помічники налаштування на базі binary">
    Для UI налаштування на базі binary віддавайте перевагу спільним delegated помічникам замість копіювання однакової binary/status зв’язки в кожен канал:

    - `createDetectedBinaryStatus(...)` для блоків статусу, які відрізняються лише labels, hints, scores і binary detection
    - `createCliPathTextInput(...)` для path-backed text inputs
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` і `createDelegatedResolveConfigured(...)`, коли `setupEntry` має lazy-передавати керування важчому повному майстру
    - `createDelegatedTextInputShouldPrompt(...)`, коли `setupEntry` потрібно лише делегувати рішення `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Публікація та встановлення

**Зовнішні plugins:** опублікуйте в [ClawHub](/uk/tools/clawhub) або npm, а потім установіть:

<Tabs>
  <Tab title="Автоматично (спочатку ClawHub, потім npm)">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    OpenClaw спочатку пробує ClawHub і автоматично переходить до npm у разі невдачі.

  </Tab>
  <Tab title="Лише ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="Специфікація пакета npm">
    Немає відповідного override `npm:`. Використовуйте звичайну специфікацію пакета npm, коли вам потрібен шлях npm після fallback із ClawHub:

    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**In-repo plugins:** розмістіть їх у дереві робочого простору вбудованих plugins, і вони автоматично виявлятимуться під час build.

**Користувачі можуть установлювати:**

```bash
openclaw plugins install <package-name>
```

<Info>
Для встановлень із npm, `openclaw plugins install` виконує project-local `npm install --ignore-scripts` (без lifecycle scripts), ігноруючи успадковані глобальні налаштування встановлення npm. Тримайте дерева залежностей plugin суто JS/TS і уникайте пакетів, які потребують `postinstall` builds.
</Info>

<Note>
Вбудовані плагіни, що належать OpenClaw, є єдиним винятком для відновлення під час запуску: коли пакетне встановлення бачить, що один із них увімкнено конфігурацією плагіна, застарілою конфігурацією каналу або його вбудованим маніфестом із типово ввімкненим станом, запуск встановлює відсутні runtime-залежності цього плагіна перед імпортом. Сторонні плагіни не повинні покладатися на встановлення під час запуску; продовжуйте використовувати явний інсталятор плагінів.
</Note>

## Пов’язане

- [Створення плагінів](/uk/plugins/building-plugins) — покроковий посібник для початку роботи
- [Маніфест плагіна](/uk/plugins/manifest) — повний довідник схеми маніфесту
- [Точки входу SDK](/uk/plugins/sdk-entrypoints) — `definePluginEntry` і `defineChannelPluginEntry`
