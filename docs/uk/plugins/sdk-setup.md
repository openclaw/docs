---
read_when:
    - Ви додаєте майстер налаштування до plugin
    - Потрібно зрозуміти setup-entry.ts порівняно з index.ts
    - Ви визначаєте схеми конфігурації Plugin або метадані openclaw у package.json
sidebarTitle: Setup and config
summary: Майстри налаштування, setup-entry.ts, схеми конфігурації та метадані package.json
title: Налаштування та конфігурація Plugin
x-i18n:
    generated_at: "2026-06-27T18:05:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a6ca729c40270e9280fb61d8891e53b1c351c0afcc9f894c515be06b02fece95
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Довідник із пакування plugins (метадані `package.json`), маніфестів (`openclaw.plugin.json`), записів налаштування та схем конфігурації.

<Tip>
**Шукаєте покроковий посібник?** Практичні посібники пояснюють пакування в контексті: [Канальні plugins](/uk/plugins/sdk-channel-plugins#step-1-package-and-manifest) і [Provider plugins](/uk/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Метадані пакета

Вашому `package.json` потрібне поле `openclaw`, яке повідомляє системі plugins, що надає ваш plugin:

<Tabs>
  <Tab title="Plugin каналу">
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
  <Tab title="Provider plugin / базовий рівень ClawHub">
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
Якщо ви публікуєте plugin зовні на ClawHub, ці поля `compat` і `build` є обов’язковими. Канонічні фрагменти для публікації містяться в `docs/snippets/plugin-publish/`.
</Note>

### Поля `openclaw`

<ParamField path="extensions" type="string[]">
  Файли точок входу (відносно кореня пакета).
</ParamField>
<ParamField path="setupEntry" type="string">
  Легковагий запис лише для налаштування (необов’язково).
</ParamField>
<ParamField path="channel" type="object">
  Метадані каталогу каналів для поверхонь налаштування, вибору, швидкого старту та стану.
</ParamField>
<ParamField path="providers" type="string[]">
  Ідентифікатори providers, зареєстровані цим plugin.
</ParamField>
<ParamField path="install" type="object">
  Підказки встановлення: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  Прапорці поведінки запуску.
</ParamField>

### `openclaw.channel`

`openclaw.channel` — це прості метадані пакета для виявлення каналів і поверхонь налаштування до завантаження runtime.

| Поле                                   | Тип        | Що це означає                                                                 |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | Канонічний ідентифікатор каналу.                                              |
| `label`                                | `string`   | Основна мітка каналу.                                                         |
| `selectionLabel`                       | `string`   | Мітка вибору/налаштування, коли вона має відрізнятися від `label`.            |
| `detailLabel`                          | `string`   | Вторинна деталізована мітка для розширених каталогів каналів і поверхонь стану. |
| `docsPath`                             | `string`   | Шлях документації для посилань налаштування та вибору.                        |
| `docsLabel`                            | `string`   | Перевизначена мітка для посилань документації, коли вона має відрізнятися від ідентифікатора каналу. |
| `blurb`                                | `string`   | Короткий опис для onboarding/каталогу.                                        |
| `order`                                | `number`   | Порядок сортування в каталогах каналів.                                       |
| `aliases`                              | `string[]` | Додаткові псевдоніми для пошуку під час вибору каналу.                        |
| `preferOver`                           | `string[]` | Ідентифікатори plugins/каналів із нижчим пріоритетом, які цей канал має випереджати. |
| `systemImage`                          | `string`   | Необов’язкова назва іконки/системного зображення для UI-каталогів каналів.    |
| `selectionDocsPrefix`                  | `string`   | Текст-префікс перед посиланнями документації на поверхнях вибору.             |
| `selectionDocsOmitLabel`               | `boolean`  | Показувати шлях документації напряму замість підписаного посилання на документацію в тексті вибору. |
| `selectionExtras`                      | `string[]` | Додаткові короткі рядки, що додаються в тексті вибору.                        |
| `markdownCapable`                      | `boolean`  | Позначає канал як придатний до markdown для рішень щодо вихідного форматування. |
| `exposure`                             | `object`   | Елементи керування видимістю каналу для налаштування, списків сконфігурованих каналів і поверхонь документації. |
| `quickstartAllowFrom`                  | `boolean`  | Долучає цей канал до стандартного потоку налаштування швидкого старту `allowFrom`. |
| `forceAccountBinding`                  | `boolean`  | Вимагає явного прив’язування облікового запису, навіть коли існує лише один обліковий запис. |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Надає перевагу пошуку сеансу під час визначення цілей оголошень для цього каналу. |

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

- `configured`: включати канал у поверхні списків сконфігурованих каналів/стану
- `setup`: включати канал в інтерактивні засоби вибору налаштування/конфігурації
- `docs`: позначати канал як публічний на поверхнях документації/навігації

<Note>
`showConfigured` і `showInSetup` залишаються підтримуваними як застарілі псевдоніми. Надавайте перевагу `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` — це метадані пакета, а не метадані маніфесту.

| Поле                         | Тип                                 | Що це означає                                                                  |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Канонічна специфікація ClawHub для потоків встановлення/оновлення та onboarding зі встановленням на вимогу. |
| `npmSpec`                    | `string`                            | Канонічна специфікація npm для резервних потоків встановлення/оновлення.       |
| `localPath`                  | `string`                            | Локальний шлях розробки або шлях встановлення bundled-варіанта.                 |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Бажане джерело встановлення, коли доступно кілька джерел.                       |
| `minHostVersion`             | `string`                            | Мінімальна підтримувана версія OpenClaw у формі `>=x.y.z` або `>=x.y.z-prerelease`. |
| `expectedIntegrity`          | `string`                            | Очікуваний рядок цілісності npm dist, зазвичай `sha512-...`, для закріплених встановлень. |
| `allowInvalidConfigRecovery` | `boolean`                           | Дозволяє потокам перевстановлення bundled-plugin відновлюватися після певних збоїв застарілої конфігурації. |
| `requiredPlatformPackages`   | `string[]`                          | Обов’язкові платформозалежні npm-псевдоніми, що перевіряються під час встановлення npm. |

<AccordionGroup>
  <Accordion title="Поведінка onboarding">
    Інтерактивний onboarding також використовує `openclaw.install` для поверхонь встановлення на вимогу. Якщо ваш plugin показує варіанти автентифікації provider або метадані налаштування/каталогу каналів до завантаження runtime, onboarding може показати цей вибір, запросити ClawHub, npm або локальне встановлення, встановити чи ввімкнути plugin, а потім продовжити вибраний потік. Варіанти onboarding ClawHub використовують `clawhubSpec` і мають перевагу, коли присутні; варіанти npm потребують довірених метаданих каталогу зі специфікацією реєстру `npmSpec`; точні версії та `expectedIntegrity` є необов’язковими npm-закріпленнями. Якщо `expectedIntegrity` присутнє, потоки встановлення/оновлення примусово застосовують його для npm. Зберігайте метадані "що показувати" в `openclaw.plugin.json`, а метадані "як це встановити" — у `package.json`.
  </Accordion>
  <Accordion title="Застосування minHostVersion">
    Якщо `minHostVersion` задано, його застосовують і встановлення, і завантаження реєстру маніфестів для небундльованих plugins. Старіші hosts пропускають зовнішні plugins; недійсні рядки версій відхиляються. Bundled source plugins вважаються такими, що мають ту саму версію, що й host checkout.
  </Accordion>
  <Accordion title="Закріплені встановлення npm">
    Для закріплених встановлень npm зберігайте точну версію в `npmSpec` і додайте очікувану цілісність артефакту:

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
    `allowInvalidConfigRecovery` не є загальним обходом для пошкоджених конфігурацій. Воно призначене лише для вузького відновлення bundled-plugin, щоб перевстановлення/налаштування могло виправити відомі залишки після оновлення, як-от відсутній шлях bundled plugin або застарілий запис `channels.<id>` для того самого plugin. Якщо конфігурацію пошкоджено з непов’язаних причин, встановлення все одно завершується закрито й повідомляє оператору запустити `openclaw doctor --fix`.
  </Accordion>
</AccordionGroup>

### Відкладене повне завантаження

Канальні plugins можуть увімкнути відкладене завантаження за допомогою:

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

Коли це ввімкнено, OpenClaw завантажує лише `setupEntry` під час фази запуску перед прослуховуванням, навіть для вже сконфігурованих каналів. Повний запис завантажується після того, як gateway починає прослуховування.

<Warning>
Увімкніть відкладене завантаження лише тоді, коли ваш `setupEntry` реєструє все, що потрібно gateway до початку прослуховування (реєстрація каналу, HTTP-маршрути, методи gateway). Якщо повний запис володіє необхідними можливостями запуску, залиште стандартну поведінку.
</Warning>

Якщо ваш setup/full entry реєструє gateway RPC-методи, тримайте їх на префіксі, специфічному для plugin. Зарезервовані простори імен core admin (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) залишаються у власності core і завжди визначаються як `operator.admin`.

## Маніфест Plugin

Кожен native plugin має постачати `openclaw.plugin.json` у корені пакета. OpenClaw використовує його для перевірки конфігурації без виконання коду plugin.

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

Для канальних plugins додайте `kind` і `channels`:

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

Навіть plugins без конфігурації мають постачати схему. Порожня схема є дійсною:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Див. [маніфест Plugin](/uk/plugins/manifest) для повної довідки зі схемою.

## Публікація ClawHub

Для пакетів plugin використовуйте команду ClawHub, специфічну для пакета:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
Застарілий псевдонім публікації лише для skills призначений для skills. Пакети plugin завжди мають використовувати `clawhub package publish`.
</Note>

## Точка входу налаштування

Файл `setup-entry.ts` — це легка альтернатива `index.ts`, яку OpenClaw завантажує, коли йому потрібні лише поверхні налаштування (онбординг, виправлення конфігурації, перевірка вимкненого каналу).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Це дає змогу не завантажувати важкий runtime-код (криптографічні бібліотеки, реєстрації CLI, фонові служби) під час потоків налаштування.

Пакетовані канали workspace, які тримають безпечні для налаштування експорти в допоміжних модулях, можуть використовувати `defineBundledChannelSetupEntry(...)` з `openclaw/plugin-sdk/channel-entry-contract` замість `defineSetupPluginEntry(...)`. Цей пакетований контракт також підтримує необов'язковий експорт `runtime`, щоб runtime-зв'язування під час налаштування залишалося легким і явним.

<AccordionGroup>
  <Accordion title="Коли OpenClaw використовує setupEntry замість повної точки входу">
    - Канал вимкнено, але йому потрібні поверхні налаштування/онбордингу.
    - Канал увімкнено, але не налаштовано.
    - Увімкнено відкладене завантаження (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Що setupEntry має зареєструвати">
    - Об'єкт channel plugin (через `defineSetupPluginEntry`).
    - Будь-які HTTP-маршрути, потрібні до запуску прослуховування gateway.
    - Будь-які методи gateway, потрібні під час запуску.

    Ці стартові методи gateway все одно мають уникати зарезервованих просторів імен адміністрування ядра, таких як `config.*` або `update.*`.

  </Accordion>
  <Accordion title="Що setupEntry НЕ має містити">
    - Реєстрації CLI.
    - Фонові служби.
    - Важкі runtime-імпорти (криптографія, SDK).
    - Методи Gateway, потрібні лише після запуску.

  </Accordion>
</AccordionGroup>

### Вузькі імпорти помічників налаштування

Для гарячих шляхів, призначених лише для налаштування, віддавайте перевагу вузьким швам помічників налаштування над ширшою парасолькою `plugin-sdk/setup`, коли вам потрібна лише частина поверхні налаштування:

| Шлях імпорту                       | Для чого використовувати                                                                  | Ключові експорти                                                                                                                                                                                                                                                                                                      |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | runtime-помічники під час налаштування, доступні в `setupEntry` / відкладеному запуску каналу | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | застарілий псевдонім сумісності; використовуйте `plugin-sdk/setup-runtime`                 | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                 |
| `plugin-sdk/setup-tools`           | помічники CLI/архіву/документації для налаштування/інсталяції                              | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                        |

Використовуйте ширший шов `plugin-sdk/setup`, коли вам потрібен повний спільний набір інструментів налаштування, включно з помічниками виправлення конфігурації, такими як `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Використовуйте `createSetupTranslator(...)` для фіксованого тексту майстра налаштування. Він дотримується
локалі майстра CLI (`OPENCLAW_LOCALE`, потім системних змінних локалі) і
повертається до англійської. Тримайте специфічний для plugin текст налаштування в коді, що належить plugin, і використовуйте
ключі спільного каталогу лише для загальних міток налаштування, тексту стану та офіційного
тексту налаштування пакетованих plugin.

Адаптери виправлення налаштування залишаються безпечними для гарячого шляху під час імпорту. Їхній пошук поверхні контракту пакетованого просування одного облікового запису є лінивим, тож імпорт `plugin-sdk/setup-runtime` не завантажує наперед виявлення поверхні пакетованого контракту до фактичного використання адаптера.

### Просування одного облікового запису, що належить каналу

Коли канал оновлюється з конфігурації верхнього рівня з одним обліковим записом до `channels.<id>.accounts.*`, типова спільна поведінка полягає в переміщенні просунутих значень рівня облікового запису в `accounts.default`.

Пакетовані канали можуть звузити або перевизначити це просування через свою поверхню контракту налаштування:

- `singleAccountKeysToMove`: додаткові ключі верхнього рівня, які мають перейти до просунутого облікового запису
- `namedAccountPromotionKeys`: коли іменовані облікові записи вже існують, лише ці ключі переходять до просунутого облікового запису; спільні ключі політики/доставки залишаються в корені каналу
- `resolveSingleAccountPromotionTarget(...)`: вибрати, який наявний обліковий запис отримує просунуті значення

<Note>
Matrix — поточний пакетований приклад. Якщо вже існує рівно один іменований обліковий запис Matrix або якщо `defaultAccount` вказує на наявний неканонічний ключ, такий як `Ops`, просування зберігає цей обліковий запис замість створення нового запису `accounts.default`.
</Note>

## Схема конфігурації

Конфігурація plugin перевіряється за JSON Schema у вашому маніфесті. Користувачі налаштовують plugins через:

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

Використовуйте `buildChannelConfigSchema`, щоб перетворити схему Zod на обгортку `ChannelConfigSchema`, яку використовують артефакти конфігурації, що належать plugin:

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

Якщо ви вже описуєте контракт як JSON Schema або TypeBox, використовуйте прямий помічник, щоб OpenClaw міг пропустити перетворення Zod на JSON Schema на шляхах метаданих:

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

Для сторонніх plugins контракт холодного шляху все ще є маніфестом plugin: віддзеркальте згенеровану JSON Schema в `openclaw.plugin.json#channelConfigs`, щоб схема конфігурації, налаштування та UI-поверхні могли перевіряти `channels.<id>` без завантаження runtime-коду.

## Майстри налаштування

Channel plugins можуть надавати інтерактивні майстри налаштування для `openclaw onboard`. Майстер — це об'єкт `ChannelSetupWizard` у `ChannelPlugin`:

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

Тип `ChannelSetupWizard` підтримує `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` тощо. Дивіться повні приклади в пакетованих пакетах plugin (наприклад, plugin Discord `src/channel.setup.ts`).

<AccordionGroup>
  <Accordion title="Спільні підказки allowFrom">
    Для підказок списку дозволених DM, яким потрібен лише стандартний потік `note -> prompt -> parse -> merge -> patch`, віддавайте перевагу спільним помічникам налаштування з `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` і `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Стандартний стан налаштування каналу">
    Для блоків стану налаштування каналу, які відрізняються лише мітками, оцінками та необов'язковими додатковими рядками, віддавайте перевагу `createStandardChannelSetupStatus(...)` з `openclaw/plugin-sdk/setup` замість ручного створення того самого об'єкта `status` у кожному plugin.
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

    `plugin-sdk/channel-setup` також надає нижчорівневі збирачі `createOptionalChannelSetupAdapter(...)` і `createOptionalChannelSetupWizard(...)`, коли вам потрібна лише одна половина цієї поверхні необов'язкової інсталяції.

    Згенерований необов'язковий адаптер/майстер відмовляє закрито під час реальних записів конфігурації. Вони повторно використовують одне повідомлення про потрібну інсталяцію в `validateInput`, `applyAccountConfig` і `finalize`, а також додають посилання на документацію, коли задано `docsPath`.

  </Accordion>
  <Accordion title="Помічники налаштування на основі бінарного файла">
    Для UI налаштування на основі бінарного файла віддавайте перевагу спільним делегованим помічникам замість копіювання однакового зв'язувального коду бінарного файла/стану в кожен канал:

    - `createDetectedBinaryStatus(...)` для блоків стану, які відрізняються лише мітками, підказками, оцінками та виявленням бінарного файла
    - `createCliPathTextInput(...)` для текстових вводів на основі шляху
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` і `createDelegatedResolveConfigured(...)`, коли `setupEntry` має ліниво переслати до важчого повного майстра
    - `createDelegatedTextInputShouldPrompt(...)`, коли `setupEntry` потрібно лише делегувати рішення `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Публікація та встановлення

**Зовнішні плагіни:** опублікуйте в [ClawHub](/uk/clawhub), а потім установіть:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    Специфікації пакетів без префікса встановлюються з npm під час запускового переходу.

  </Tab>
  <Tab title="ClawHub only">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm package spec">
    Використовуйте npm, коли пакет ще не переміщено до ClawHub або коли вам потрібен
    прямий шлях встановлення з npm під час міграції:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Плагіни в репозиторії:** розмістіть їх у дереві робочого простору вбудованих плагінів, і їх буде автоматично виявлено під час збірки.

**Користувачі можуть установити:**

```bash
openclaw plugins install <package-name>
```

<Info>
Для встановлень із npm `openclaw plugins install` встановлює пакет у проєкт для кожного плагіна в `~/.openclaw/npm/projects` із вимкненими lifecycle-скриптами. Тримайте дерева залежностей плагінів суто на JS/TS та уникайте пакетів, які потребують збірок `postinstall`.
</Info>

<Note>
Запуск Gateway не встановлює залежності плагінів. Потоки встановлення npm/git/ClawHub відповідають за узгодження залежностей; локальні плагіни вже повинні мати встановлені залежності.
</Note>

Метадані вбудованого пакета є явними, а не виводяться зі зібраного JavaScript під час запуску Gateway. Runtime-залежності мають бути в пакеті плагіна, якому вони належать; запуск упакованого OpenClaw ніколи не виправляє й не дзеркалить залежності плагінів.

## Пов’язане

- [Створення плагінів](/uk/plugins/building-plugins) — покроковий посібник із початку роботи
- [Маніфест Plugin](/uk/plugins/manifest) — повний довідник схеми маніфесту
- [Точки входу SDK](/uk/plugins/sdk-entrypoints) — `definePluginEntry` і `defineChannelPluginEntry`
