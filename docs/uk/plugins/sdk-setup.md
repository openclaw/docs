---
read_when:
    - Ви додаєте майстер налаштування до Plugin
    - Потрібно розуміти відмінність між setup-entry.ts та index.ts
    - Ви визначаєте схеми конфігурації Plugin або метадані openclaw у package.json
sidebarTitle: Setup and config
summary: Майстри налаштування, setup-entry.ts, схеми конфігурації та метадані package.json
title: Налаштування та конфігурація Plugin
x-i18n:
    generated_at: "2026-04-29T16:09:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92f470a5c7e8fe06b9244a737de80c0509b26aa983d05e60dd1689cc628fc90d
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Довідник із пакування Plugin (`package.json` metadata), маніфестів (`openclaw.plugin.json`), setup-записів і config-схем.

<Tip>
**Шукаєте покроковий посібник?** Практичні посібники пояснюють пакування в контексті: [Channel plugins](/uk/plugins/sdk-channel-plugins#step-1-package-and-manifest) і [Provider plugins](/uk/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Package metadata

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
Якщо ви публікуєте Plugin зовні на ClawHub, ці поля `compat` і `build` є обов’язковими. Канонічні фрагменти для публікації розміщені в `docs/snippets/plugin-publish/`.
</Note>

### Поля `openclaw`

<ParamField path="extensions" type="string[]">
  Файли точок входу (відносно кореня пакета).
</ParamField>
<ParamField path="setupEntry" type="string">
  Полегшена точка входу лише для setup (необов’язково).
</ParamField>
<ParamField path="channel" type="object">
  Метадані каталогу каналу для setup, вибірника, quickstart і поверхонь status.
</ParamField>
<ParamField path="providers" type="string[]">
  Ідентифікатори provider, зареєстровані цим Plugin.
</ParamField>
<ParamField path="install" type="object">
  Підказки встановлення: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  Прапорці поведінки запуску.
</ParamField>

### `openclaw.channel`

`openclaw.channel` — це легкі метадані пакета для виявлення каналів і setup-поверхонь до завантаження runtime.

| Поле                                   | Тип        | Що це означає                                                                  |
| -------------------------------------- | ---------- | ------------------------------------------------------------------------------ |
| `id`                                   | `string`   | Канонічний ідентифікатор каналу.                                               |
| `label`                                | `string`   | Основна мітка каналу.                                                          |
| `selectionLabel`                       | `string`   | Мітка вибірника/setup, коли вона має відрізнятися від `label`.                 |
| `detailLabel`                          | `string`   | Додаткова мітка деталей для розширених каталогів каналів і поверхонь status.   |
| `docsPath`                             | `string`   | Шлях документації для setup і посилань вибору.                                 |
| `docsLabel`                            | `string`   | Перевизначає мітку для посилань документації, коли вона має відрізнятися від ідентифікатора каналу. |
| `blurb`                                | `string`   | Короткий опис для onboarding/каталогу.                                         |
| `order`                                | `number`   | Порядок сортування в каталогах каналів.                                        |
| `aliases`                              | `string[]` | Додаткові псевдоніми пошуку для вибору каналу.                                 |
| `preferOver`                           | `string[]` | Ідентифікатори Plugin/каналів нижчого пріоритету, які цей канал має випереджати. |
| `systemImage`                          | `string`   | Необов’язкова назва іконки/system-image для UI-каталогів каналів.              |
| `selectionDocsPrefix`                  | `string`   | Текст-префікс перед посиланнями документації на поверхнях вибору.              |
| `selectionDocsOmitLabel`               | `boolean`  | Показувати шлях документації напряму замість позначеного посилання документації в тексті вибору. |
| `selectionExtras`                      | `string[]` | Додаткові короткі рядки, додані до тексту вибору.                              |
| `markdownCapable`                      | `boolean`  | Позначає канал як сумісний із markdown для рішень щодо вихідного форматування. |
| `exposure`                             | `object`   | Елементи керування видимістю каналу для setup, налаштованих списків і поверхонь документації. |
| `quickstartAllowFrom`                  | `boolean`  | Додає цей канал до стандартного quickstart setup-потоку `allowFrom`.           |
| `forceAccountBinding`                  | `boolean`  | Вимагати явне прив’язування облікового запису, навіть коли існує лише один обліковий запис. |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Віддавати перевагу пошуку сесії під час визначення announce-цілей для цього каналу. |

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

- `configured`: включати канал у налаштовані/status-подібні поверхні списків
- `setup`: включати канал в інтерактивні setup/configure-вибірники
- `docs`: позначати канал як публічний на поверхнях документації/навігації

<Note>
`showConfigured` і `showInSetup` залишаються підтримуваними як застарілі псевдоніми. Надавайте перевагу `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` — це метадані пакета, а не метадані маніфесту.

| Поле                         | Тип                  | Що це означає                                                                   |
| ---------------------------- | -------------------- | ------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Канонічна npm-специфікація для потоків встановлення/оновлення.                 |
| `localPath`                  | `string`             | Локальний шлях розробки або bundled-шлях встановлення.                         |
| `defaultChoice`              | `"npm"` \| `"local"` | Бажане джерело встановлення, коли доступні обидва.                              |
| `minHostVersion`             | `string`             | Мінімальна підтримувана версія OpenClaw у формі `>=x.y.z`.                      |
| `expectedIntegrity`          | `string`             | Очікуваний рядок цілісності npm dist, зазвичай `sha512-...`, для закріплених встановлень. |
| `allowInvalidConfigRecovery` | `boolean`            | Дозволяє потокам перевстановлення bundled-Plugin відновлюватися після конкретних збоїв через застарілу config. |

<AccordionGroup>
  <Accordion title="Поведінка onboarding">
    Інтерактивний onboarding також використовує `openclaw.install` для поверхонь install-on-demand. Якщо ваш Plugin відкриває варіанти автентифікації provider або метадані setup/каталогу каналу до завантаження runtime, onboarding може показати цей варіант, попросити вибрати npm чи локальне встановлення, встановити або ввімкнути Plugin, а потім продовжити вибраний потік. Варіанти npm onboarding потребують довірених метаданих каталогу з registry `npmSpec`; точні версії та `expectedIntegrity` є необов’язковими закріпленнями. Якщо `expectedIntegrity` присутній, потоки встановлення/оновлення примусово його перевіряють. Зберігайте метадані "що показувати" в `openclaw.plugin.json`, а метадані "як це встановити" — у `package.json`.
  </Accordion>
  <Accordion title="Застосування minHostVersion">
    Якщо `minHostVersion` встановлено, і встановлення, і завантаження registry маніфестів застосовують його. Старіші hosts пропускають Plugin; некоректні рядки версій відхиляються.
  </Accordion>
  <Accordion title="Закріплені npm-встановлення">
    Для закріплених npm-встановлень тримайте точну версію в `npmSpec` і додайте очікувану цілісність артефакту:

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
    `allowInvalidConfigRecovery` не є загальним обходом для зламаних config. Він призначений лише для вузького відновлення bundled-Plugin, щоб перевстановлення/setup могли виправити відомі залишки після оновлення, як-от відсутній шлях bundled Plugin або застарілий запис `channels.<id>` для того самого Plugin. Якщо config зламана з непов’язаних причин, встановлення все одно завершується закритою відмовою й повідомляє оператору запустити `openclaw doctor --fix`.
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

Коли це ввімкнено, OpenClaw завантажує лише `setupEntry` під час фази запуску до прослуховування, навіть для вже налаштованих каналів. Повна точка входу завантажується після того, як Gateway починає слухати.

<Warning>
Вмикайте відкладене завантаження лише тоді, коли ваш `setupEntry` реєструє все, що потрібно Gateway до початку прослуховування (реєстрація каналу, HTTP-маршрути, методи gateway). Якщо повна точка входу володіє потрібними startup-можливостями, залиште поведінку за замовчуванням.
</Warning>

Якщо ваша setup/повна точка входу реєструє gateway RPC-методи, тримайте їх на префіксі, специфічному для Plugin. Зарезервовані core admin-простори назв (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) залишаються у власності core і завжди визначаються як `operator.admin`.

## Маніфест Plugin

Кожен native Plugin має постачати `openclaw.plugin.json` у корені пакета. OpenClaw використовує це для перевірки config без виконання коду Plugin.

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

Навіть Plugin без config мають постачати schema. Порожня schema є дійсною:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Див. [Маніфест Plugin](/uk/plugins/manifest) для повного довідника schema.

## Публікація ClawHub

Для пакетів Plugin використовуйте специфічну для пакета команду ClawHub:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
Застарілий alias публікації лише для Skills призначений для skills. Пакети Plugin завжди мають використовувати `clawhub package publish`.
</Note>

## Setup entry

Файл `setup-entry.ts` — це полегшена альтернатива `index.ts`, яку OpenClaw завантажує, коли йому потрібні лише setup-поверхні (onboarding, виправлення config, перевірка вимкненого каналу).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Це уникає завантаження важкого runtime-коду (криптографічних бібліотек, реєстрацій CLI, фонових сервісів) під час потоків налаштування.

Вбудовані канали робочої області, які тримають безпечні для налаштування експорти в допоміжних модулях, можуть використовувати `defineBundledChannelSetupEntry(...)` з `openclaw/plugin-sdk/channel-entry-contract` замість `defineSetupPluginEntry(...)`. Цей вбудований контракт також підтримує необов'язковий експорт `runtime`, щоб runtime-зв'язування під час налаштування залишалося легким і явним.

<AccordionGroup>
  <Accordion title="Коли OpenClaw використовує setupEntry замість повного entry">
    - Канал вимкнено, але йому потрібні поверхні налаштування/onboarding.
    - Канал увімкнено, але не налаштовано.
    - Відкладене завантаження увімкнено (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Що має реєструвати setupEntry">
    - Об'єкт Plugin каналу (через `defineSetupPluginEntry`).
    - Будь-які HTTP-маршрути, потрібні до початку прослуховування gateway.
    - Будь-які методи gateway, потрібні під час запуску.

    Ці методи gateway запуску все одно мають уникати зарезервованих адміністративних просторів імен core, таких як `config.*` або `update.*`.

  </Accordion>
  <Accordion title="Чого setupEntry НЕ має містити">
    - Реєстрації CLI.
    - Фонові сервіси.
    - Важкі runtime-імпорти (криптографія, SDK).
    - Методи Gateway, потрібні лише після запуску.

  </Accordion>
</AccordionGroup>

### Вузькі імпорти помічників налаштування

Для гарячих шляхів лише налаштування віддавайте перевагу вузьким швам помічників налаштування замість ширшої парасольки `plugin-sdk/setup`, коли вам потрібна лише частина поверхні налаштування:

| Шлях імпорту                       | Для чого використовувати                                                                  | Ключові експорти                                                                                                                                                                                                                                                                             |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | runtime-помічники часу налаштування, доступні в `setupEntry` / відкладеному запуску каналу | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | адаптери налаштування облікових записів з урахуванням середовища                          | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | помічники CLI/архівів/документації для налаштування/встановлення                          | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

Використовуйте ширший шов `plugin-sdk/setup`, коли вам потрібен повний спільний набір інструментів налаштування, зокрема помічники config-patch, такі як `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Адаптери патчів налаштування залишаються безпечними для гарячого шляху під час імпорту. Їхній вбудований пошук поверхні контракту просування одного облікового запису є лінивим, тому імпорт `plugin-sdk/setup-runtime` не завантажує завчасно виявлення вбудованої поверхні контракту до фактичного використання адаптера.

### Просування одного облікового запису, яким володіє канал

Коли канал оновлюється з конфігурації верхнього рівня для одного облікового запису до `channels.<id>.accounts.*`, типова спільна поведінка полягає в переміщенні просунутих значень області облікового запису в `accounts.default`.

Вбудовані канали можуть звузити або перевизначити це просування через свою поверхню контракту налаштування:

- `singleAccountKeysToMove`: додаткові ключі верхнього рівня, які мають перейти до просунутого облікового запису
- `namedAccountPromotionKeys`: коли іменовані облікові записи вже існують, лише ці ключі переходять до просунутого облікового запису; спільні ключі політики/доставки залишаються в корені каналу
- `resolveSingleAccountPromotionTarget(...)`: виберіть, який наявний обліковий запис отримає просунуті значення

<Note>
Matrix є поточним вбудованим прикладом. Якщо вже існує рівно один іменований обліковий запис Matrix, або якщо `defaultAccount` вказує на наявний неканонічний ключ, такий як `Ops`, просування зберігає цей обліковий запис замість створення нового запису `accounts.default`.
</Note>

## Схема конфігурації

Конфігурація Plugin перевіряється за JSON Schema у вашому маніфесті. Користувачі налаштовують plugins через:

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

Використовуйте `buildChannelConfigSchema`, щоб перетворити схему Zod на обгортку `ChannelConfigSchema`, яку використовують артефакти конфігурації, що належать Plugin:

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

Для сторонніх plugins контракт холодного шляху все ще є маніфестом Plugin: віддзеркальте згенеровану JSON Schema в `openclaw.plugin.json#channelConfigs`, щоб схема конфігурації, налаштування й UI-поверхні могли інспектувати `channels.<id>` без завантаження runtime-коду.

## Майстри налаштування

Канальні plugins можуть надавати інтерактивні майстри налаштування для `openclaw onboard`. Майстер є об'єктом `ChannelSetupWizard` у `ChannelPlugin`:

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

Тип `ChannelSetupWizard` підтримує `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` тощо. Дивіться пакети вбудованих plugins (наприклад, Discord plugin `src/channel.setup.ts`) для повних прикладів.

<AccordionGroup>
  <Accordion title="Спільні підказки allowFrom">
    Для підказок allowlist у DM, яким потрібен лише стандартний потік `note -> prompt -> parse -> merge -> patch`, віддавайте перевагу спільним помічникам налаштування з `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` і `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Стандартний статус налаштування каналу">
    Для блоків статусу налаштування каналу, що відрізняються лише мітками, оцінками та необов'язковими додатковими рядками, віддавайте перевагу `createStandardChannelSetupStatus(...)` з `openclaw/plugin-sdk/setup` замість ручного створення того самого об'єкта `status` у кожному Plugin.
  </Accordion>
  <Accordion title="Необов'язкова поверхня налаштування каналу">
    Для необов'язкових поверхонь налаштування, які мають з'являтися лише в певних контекстах, використовуйте `createOptionalChannelSetupSurface` з `openclaw/plugin-sdk/channel-setup`:

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

    `plugin-sdk/channel-setup` також надає нижчорівневі збирачі `createOptionalChannelSetupAdapter(...)` і `createOptionalChannelSetupWizard(...)`, коли вам потрібна лише одна половина цієї поверхні необов'язкового встановлення.

    Згенерований необов'язковий адаптер/майстер відмовляє закрито під час реальних записів конфігурації. Вони повторно використовують одне повідомлення про потрібне встановлення в `validateInput`, `applyAccountConfig` і `finalize`, а також додають посилання на документацію, коли `docsPath` задано.

  </Accordion>
  <Accordion title="Помічники налаштування на основі бінарних файлів">
    Для UI налаштування на основі бінарних файлів віддавайте перевагу спільним делегованим помічникам замість копіювання однакового glue-коду бінарного файлу/статусу в кожен канал:

    - `createDetectedBinaryStatus(...)` для блоків статусу, що відрізняються лише мітками, підказками, оцінками та виявленням бінарного файлу
    - `createCliPathTextInput(...)` для текстових вводів на основі шляху
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` і `createDelegatedResolveConfigured(...)`, коли `setupEntry` має ліниво переспрямовувати до важчого повного майстра
    - `createDelegatedTextInputShouldPrompt(...)`, коли `setupEntry` потрібно лише делегувати рішення `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Публікація та встановлення

**Зовнішні plugins:** опублікуйте в [ClawHub](/uk/tools/clawhub), потім установіть:

<Tabs>
  <Tab title="Автоматично (спочатку ClawHub, потім npm)">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    OpenClaw спочатку пробує ClawHub і автоматично переходить до npm як запасного варіанту.

  </Tab>
  <Tab title="Лише ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="Специфікація пакета npm">
    Використовуйте npm, коли пакет ще не переміщено до ClawHub, або коли вам потрібен
    прямий шлях встановлення npm під час міграції:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugins у репозиторії:** розмістіть їх під деревом робочої області вбудованих plugins, і вони будуть автоматично виявлені під час збірки.

**Користувачі можуть установити:**

```bash
openclaw plugins install <package-name>
```

<Info>
Для встановлень із джерелом npm `openclaw plugins install` запускає локальний для проєкту `npm install --ignore-scripts` (без lifecycle-скриптів), ігноруючи успадковані глобальні налаштування встановлення npm. Тримайте дерева залежностей Plugin чистими JS/TS і уникайте пакетів, які потребують збірок `postinstall`.
</Info>

<Note>
Вбудовані плагіни, що належать OpenClaw, є єдиним винятком для відновлення під час запуску: коли пакетне встановлення бачить, що один із них увімкнено конфігурацією плагіна, застарілою конфігурацією каналу або його вбудованим маніфестом із типовим увімкненням, запуск встановлює відсутні залежності середовища виконання цього плагіна перед імпортом. Сторонні плагіни не повинні покладатися на встановлення під час запуску; продовжуйте використовувати явний інсталятор плагінів.
</Note>

Вбудовані залежності середовища виконання на рівні пакета є явними метаданими, а не виводяться зі зібраного JavaScript під час запуску Gateway. Якщо спільна коренева залежність OpenClaw має бути доступна всередині зовнішнього дзеркала середовища виконання вбудованого плагіна, оголосіть її в `openclaw.bundle.mirroredRootRuntimeDependencies` у кореневому маніфесті пакета.

## Пов’язане

- [Створення плагінів](/uk/plugins/building-plugins) — покроковий посібник із початку роботи
- [Маніфест плагіна](/uk/plugins/manifest) — повний довідник схеми маніфесту
- [Точки входу SDK](/uk/plugins/sdk-entrypoints) — `definePluginEntry` і `defineChannelPluginEntry`
