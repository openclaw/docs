---
read_when:
    - Ви додаєте майстер налаштування до plugin
    - Вам потрібно зрозуміти setup-entry.ts порівняно з index.ts
    - Ви визначаєте схеми конфігурації plugin або метадані openclaw у package.json
sidebarTitle: Setup and config
summary: Майстри налаштування, setup-entry.ts, схеми конфігурації та метадані package.json
title: Налаштування та конфігурація Plugin
x-i18n:
    generated_at: "2026-07-04T15:32:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0969ab2cc069389b8957b07e76591bc76fea7bee22125587fa067122d11bb024
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Довідник із пакування Plugin (`package.json` метадані), маніфестів (`openclaw.plugin.json`), записів налаштування та схем конфігурації.

<Tip>
**Шукаєте покроковий посібник?** Практичні посібники пояснюють пакування в контексті: [Plugin каналів](/uk/plugins/sdk-channel-plugins#step-1-package-and-manifest) і [Plugin провайдерів](/uk/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Метадані пакета

Ваш `package.json` потребує поля `openclaw`, яке повідомляє системі Plugin, що надає ваш Plugin:

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
  <Tab title="Plugin провайдера / базовий шаблон ClawHub">
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
Якщо ви публікуєте Plugin зовнішньо в ClawHub, ці поля `compat` і `build` обов’язкові. Канонічні фрагменти для публікації містяться в `docs/snippets/plugin-publish/`.
</Note>

### Поля `openclaw`

<ParamField path="extensions" type="string[]">
  Файли точок входу (відносно кореня пакета).
</ParamField>
<ParamField path="setupEntry" type="string">
  Легкий запис лише для налаштування (необов’язково).
</ParamField>
<ParamField path="channel" type="object">
  Метадані каталогу каналів для поверхонь налаштування, вибору, швидкого старту та статусу.
</ParamField>
<ParamField path="providers" type="string[]">
  Ідентифікатори провайдерів, зареєстровані цим Plugin.
</ParamField>
<ParamField path="install" type="object">
  Підказки встановлення: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  Прапорці поведінки під час запуску.
</ParamField>

### `openclaw.channel`

`openclaw.channel` — це легкі метадані пакета для виявлення каналів і поверхонь налаштування до завантаження середовища виконання.

| Поле                                   | Тип        | Що це означає                                                                 |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | Канонічний ідентифікатор каналу.                                              |
| `label`                                | `string`   | Основна мітка каналу.                                                         |
| `selectionLabel`                       | `string`   | Мітка вибору/налаштування, коли вона має відрізнятися від `label`.            |
| `detailLabel`                          | `string`   | Вторинна детальна мітка для розширених каталогів каналів і поверхонь статусу. |
| `docsPath`                             | `string`   | Шлях документації для посилань налаштування та вибору.                        |
| `docsLabel`                            | `string`   | Перевизначена мітка для посилань документації, коли вона має відрізнятися від ідентифікатора каналу. |
| `blurb`                                | `string`   | Короткий опис для онбордингу/каталогу.                                        |
| `order`                                | `number`   | Порядок сортування в каталогах каналів.                                       |
| `aliases`                              | `string[]` | Додаткові псевдоніми пошуку для вибору каналу.                                |
| `preferOver`                           | `string[]` | Ідентифікатори Plugin/каналів нижчого пріоритету, які цей канал має випереджати. |
| `systemImage`                          | `string`   | Необов’язкова назва піктограми/системного зображення для UI-каталогів каналів. |
| `selectionDocsPrefix`                  | `string`   | Текст-префікс перед посиланнями документації на поверхнях вибору.             |
| `selectionDocsOmitLabel`               | `boolean`  | Показувати шлях документації напряму замість підписаного посилання документації в тексті вибору. |
| `selectionExtras`                      | `string[]` | Додаткові короткі рядки, додані до тексту вибору.                             |
| `markdownCapable`                      | `boolean`  | Позначає канал як сумісний із markdown для рішень щодо вихідного форматування. |
| `exposure`                             | `object`   | Керування видимістю каналу для налаштування, налаштованих списків і поверхонь документації. |
| `quickstartAllowFrom`                  | `boolean`  | Долучає цей канал до стандартного потоку налаштування швидкого старту `allowFrom`. |
| `forceAccountBinding`                  | `boolean`  | Вимагає явного прив’язування облікового запису, навіть коли існує лише один обліковий запис. |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Надавати перевагу пошуку сеансу під час розв’язання цілей оголошення для цього каналу. |

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
- `setup`: включати канал в інтерактивні засоби вибору налаштування/конфігурації
- `docs`: позначати канал як публічний на поверхнях документації/навігації

<Note>
`showConfigured` і `showInSetup` лишаються підтримуваними як застарілі псевдоніми. Надавайте перевагу `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` — це метадані пакета, а не метадані маніфесту.

| Поле                         | Тип                                 | Що це означає                                                                     |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Канонічна специфікація ClawHub для встановлення/оновлення та потоків онбордингового встановлення на вимогу. |
| `npmSpec`                    | `string`                            | Канонічна специфікація npm для резервних потоків встановлення/оновлення.          |
| `localPath`                  | `string`                            | Локальний шлях розробки або вбудованого встановлення.                             |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Бажане джерело встановлення, коли доступно кілька джерел.                         |
| `minHostVersion`             | `string`                            | Мінімальна підтримувана версія OpenClaw у формі `>=x.y.z` або `>=x.y.z-prerelease`. |
| `expectedIntegrity`          | `string`                            | Очікуваний рядок цілісності npm dist, зазвичай `sha512-...`, для закріплених встановлень. |
| `allowInvalidConfigRecovery` | `boolean`                           | Дозволяє потокам перевстановлення вбудованого Plugin відновлюватися після конкретних збоїв застарілої конфігурації. |
| `requiredPlatformPackages`   | `string[]`                          | Обов’язкові платформозалежні псевдоніми npm, які перевіряються під час встановлення npm. |

<AccordionGroup>
  <Accordion title="Поведінка онбордингу">
    Інтерактивний онбординг також використовує `openclaw.install` для поверхонь встановлення на вимогу. Якщо ваш Plugin показує варіанти автентифікації провайдера або метадані налаштування/каталогу каналу до завантаження середовища виконання, онбординг може показати цей варіант, запропонувати ClawHub, npm або локальне встановлення, встановити чи ввімкнути Plugin, а потім продовжити вибраний потік. Варіанти онбордингу ClawHub використовують `clawhubSpec` і мають перевагу, коли присутні; варіанти npm потребують довірених метаданих каталогу з реєстровим `npmSpec`; точні версії та `expectedIntegrity` є необов’язковими закріпленнями npm. Якщо `expectedIntegrity` присутній, потоки встановлення/оновлення застосовують його для npm. Зберігайте метадані «що показувати» в `openclaw.plugin.json`, а метадані «як це встановити» — у `package.json`.
  </Accordion>
  <Accordion title="Застосування minHostVersion">
    Якщо `minHostVersion` задано, його застосовують і встановлення, і завантаження реєстру маніфестів для невбудованих Plugin. Старіші хости пропускають зовнішні Plugin; недійсні рядки версій відхиляються. Передбачається, що вбудовані вихідні Plugin мають ту саму версію, що й checkout хоста.
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
    `allowInvalidConfigRecovery` не є загальним обходом для зламаних конфігурацій. Він призначений лише для вузького відновлення вбудованого Plugin, щоб перевстановлення/налаштування могло виправити відомі залишки оновлення, як-от відсутній шлях вбудованого Plugin або застарілий запис `channels.<id>` для того самого Plugin. Якщо конфігурація зламана з непов’язаних причин, встановлення все одно завершується закритою відмовою й повідомляє оператору запустити `openclaw doctor --fix`.
  </Accordion>
</AccordionGroup>

### Відкладене повне завантаження

Plugin каналів можуть увімкнути відкладене завантаження за допомогою:

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

Коли це ввімкнено, OpenClaw завантажує лише `setupEntry` під час фази запуску до прослуховування, навіть для вже налаштованих каналів. Повний запис завантажується після того, як Gateway починає прослуховування.

<Warning>
Увімкніть відкладене завантаження лише тоді, коли ваш `setupEntry` реєструє все, що потрібно Gateway до початку прослуховування (реєстрація каналу, HTTP-маршрути, методи Gateway). Якщо повний запис володіє потрібними можливостями запуску, залиште типову поведінку.
</Warning>

Якщо ваш запис налаштування/повний запис реєструє RPC-методи Gateway, тримайте їх у префіксі, специфічному для Plugin. Зарезервовані основні адміністративні простори імен (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) залишаються у власності core і завжди розв’язуються в `operator.admin`.

## Маніфест Plugin

Кожен нативний Plugin має постачати `openclaw.plugin.json` у корені пакета. OpenClaw використовує його для перевірки конфігурації без виконання коду Plugin.

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

Навіть плагіни без конфігурації мають постачатися зі схемою. Порожня схема є валідною:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Повний довідник схеми див. у [маніфесті Plugin](/uk/plugins/manifest).

## Публікація в ClawHub

Для пакетів плагінів використовуйте команду ClawHub, призначену для пакетів:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
Застарілий псевдонім публікації лише для Skills призначений для Skills. Пакети Plugin завжди мають використовувати `clawhub package publish`.
</Note>

## Вхід налаштування

Файл `setup-entry.ts` — це легка альтернатива `index.ts`, яку OpenClaw завантажує, коли йому потрібні лише поверхні налаштування (початкове налаштування, виправлення конфігурації, перевірка вимкненого каналу).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Це дає змогу не завантажувати важкий runtime-код (криптографічні бібліотеки, реєстрації CLI, фонові служби) під час потоків налаштування.

Вбудовані канали робочого простору, які тримають безпечні для налаштування експорти в допоміжних модулях, можуть використовувати `defineBundledChannelSetupEntry(...)` з `openclaw/plugin-sdk/channel-entry-contract` замість `defineSetupPluginEntry(...)`. Цей вбудований контракт також підтримує необов’язковий експорт `runtime`, щоб wiring runtime під час налаштування залишався легким і явним.

<AccordionGroup>
  <Accordion title="Коли OpenClaw використовує setupEntry замість повного входу">
    - Канал вимкнений, але потребує поверхонь налаштування/початкового налаштування.
    - Канал увімкнений, але не налаштований.
    - Відкладене завантаження увімкнено (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Що setupEntry має зареєструвати">
    - Об’єкт Plugin каналу (через `defineSetupPluginEntry`).
    - Будь-які HTTP-маршрути, потрібні до прослуховування gateway.
    - Будь-які методи gateway, потрібні під час запуску.

    Ці методи gateway запуску все одно мають уникати зарезервованих просторів імен адміністрування core, як-от `config.*` або `update.*`.

  </Accordion>
  <Accordion title="Що setupEntry НЕ має містити">
    - Реєстрації CLI.
    - Фонові служби.
    - Важкі імпорти runtime (криптографія, SDK).
    - Методи Gateway, потрібні лише після запуску.

  </Accordion>
</AccordionGroup>

### Вузькі імпорти помічників налаштування

Для гарячих шляхів лише налаштування віддавайте перевагу вузьким швам помічників налаштування над ширшою парасолькою `plugin-sdk/setup`, коли вам потрібна лише частина поверхні налаштування:

| Шлях імпорту                       | Для чого використовувати                                                                 | Ключові експорти                                                                                                                                                                                                                                                                                                           |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | runtime-помічники часу налаштування, які залишаються доступними в `setupEntry` / відкладеному запуску каналу | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | застарілий псевдонім сумісності; використовуйте `plugin-sdk/setup-runtime`                            | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                 |
| `plugin-sdk/setup-tools`           | помічники CLI/архівів/документації для налаштування/встановлення                                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

Використовуйте ширший шов `plugin-sdk/setup`, коли вам потрібен повний спільний набір інструментів налаштування, включно з помічниками виправлення конфігурації, як-от `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Використовуйте `createSetupTranslator(...)` для фіксованого тексту майстра налаштування. Він дотримується локалі
майстра CLI (`OPENCLAW_LOCALE`, потім системних змінних локалі) і повертається
до англійської. Зберігайте специфічний для Plugin текст налаштування в коді, яким володіє Plugin, і використовуйте
спільні ключі каталогу лише для поширених міток налаштування, тексту статусу та офіційного
тексту налаштування вбудованих Plugin.

Адаптери виправлень налаштування залишаються безпечними для гарячого шляху під час імпорту. Їхній вбудований lookup поверхні контракту просування одного облікового запису є лінивим, тому імпорт `plugin-sdk/setup-runtime` не завантажує завчасно discovery вбудованої поверхні контракту до фактичного використання адаптера.

### Просування одного облікового запису, яким володіє канал

Коли канал оновлюється з конфігурації верхнього рівня для одного облікового запису до `channels.<id>.accounts.*`, стандартна спільна поведінка переміщує просунуті значення, прив’язані до облікового запису, в `accounts.default`.

Вбудовані канали можуть звузити або перевизначити це просування через свою поверхню контракту налаштування:

- `singleAccountKeysToMove`: додаткові ключі верхнього рівня, які мають перейти в просунутий обліковий запис
- `namedAccountPromotionKeys`: коли іменовані облікові записи вже існують, лише ці ключі переходять у просунутий обліковий запис; спільні ключі політики/доставки залишаються в корені каналу
- `resolveSingleAccountPromotionTarget(...)`: вибирає, який наявний обліковий запис отримує просунуті значення

<Note>
Matrix — поточний вбудований приклад. Якщо вже існує рівно один іменований обліковий запис Matrix або якщо `defaultAccount` вказує на наявний неканонічний ключ, як-от `Ops`, просування зберігає цей обліковий запис замість створення нового запису `accounts.default`.
</Note>

## Схема конфігурації

Конфігурація Plugin перевіряється за JSON Schema у вашому маніфесті. Користувачі налаштовують плагіни через:

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

### Побудова схем конфігурації каналів

Використовуйте `buildChannelConfigSchema`, щоб перетворити схему Zod на обгортку `ChannelConfigSchema`, яку використовують артефакти конфігурації, якими володіє Plugin:

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

Якщо ви вже створюєте контракт як JSON Schema або TypeBox, використовуйте прямий помічник, щоб OpenClaw міг пропустити перетворення Zod-to-JSON-Schema на шляхах метаданих:

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

Для сторонніх плагінів контракт холодного шляху все ще є маніфестом Plugin: віддзеркальте згенеровану JSON Schema в `openclaw.plugin.json#channelConfigs`, щоб схема конфігурації, налаштування та UI-поверхні могли перевіряти `channels.<id>` без завантаження runtime-коду.

## Майстри налаштування

Плагіни каналів можуть надавати інтерактивні майстри налаштування для `openclaw onboard`. Майстер — це об’єкт `ChannelSetupWizard` у `ChannelPlugin`:

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

Тип `ChannelSetupWizard` підтримує `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` тощо. Повні приклади див. у пакетах вбудованих Plugin (наприклад, Plugin Discord `src/channel.setup.ts`).

<AccordionGroup>
  <Accordion title="Спільні запити allowFrom">
    Для запитів allowlist DM, яким потрібен лише стандартний потік `note -> prompt -> parse -> merge -> patch`, віддавайте перевагу спільним помічникам налаштування з `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` і `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Стандартний статус налаштування каналу">
    Для блоків статусу налаштування каналу, які відрізняються лише мітками, оцінками та необов’язковими додатковими рядками, віддавайте перевагу `createStandardChannelSetupStatus(...)` з `openclaw/plugin-sdk/setup` замість ручного створення того самого об’єкта `status` у кожному Plugin.
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

    `plugin-sdk/channel-setup` також надає нижчорівневі builders `createOptionalChannelSetupAdapter(...)` і `createOptionalChannelSetupWizard(...)`, коли вам потрібна лише одна половина цієї поверхні необов’язкового встановлення.

    Згенерований необов’язковий адаптер/майстер відмовляє закрито під час реальних записів конфігурації. Вони повторно використовують одне повідомлення про необхідність встановлення в `validateInput`, `applyAccountConfig` і `finalize` та додають посилання на документацію, коли встановлено `docsPath`.

  </Accordion>
  <Accordion title="Помічники налаштування на основі бінарних файлів">
    Для UI налаштування на основі бінарних файлів віддавайте перевагу спільним делегованим помічникам замість копіювання того самого glue для бінарного файлу/статусу в кожен канал:

    - `createDetectedBinaryStatus(...)` для блоків стану, що відрізняються лише мітками, підказками, оцінками та виявленням бінарного файла
    - `createCliPathTextInput(...)` для текстових полів вводу на основі шляху
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` і `createDelegatedResolveConfigured(...)`, коли `setupEntry` потрібно відкладено переспрямувати до важчого повного майстра
    - `createDelegatedTextInputShouldPrompt(...)`, коли `setupEntry` потрібно лише делегувати рішення `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Публікація та встановлення

**Зовнішні плагіни:** опублікуйте в [ClawHub](/clawhub), потім установіть:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    Специфікації пакетів без префікса встановлюються з npm під час переходу на запуск.

  </Tab>
  <Tab title="Лише ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="Специфікація пакета npm">
    Використовуйте npm, коли пакет ще не перенесено до ClawHub або коли під час міграції потрібен
    прямий шлях установлення з npm:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Плагіни в репозиторії:** розмістіть їх у дереві робочої області вбудованих плагінів, і їх буде автоматично виявлено під час збірки.

**Користувачі можуть установити:**

```bash
openclaw plugins install <package-name>
```

<Info>
Для встановлень із npm `openclaw plugins install` встановлює пакет у проєкт окремого плагіна в `~/.openclaw/npm/projects` із вимкненими lifecycle-скриптами. Тримайте дерева залежностей плагінів чистими JS/TS і уникайте пакетів, які потребують збірок `postinstall`.
</Info>

<Note>
Запуск Gateway не встановлює залежності плагінів. Потоки встановлення npm/git/ClawHub відповідають за узгодження залежностей; локальні плагіни вже повинні мати встановлені залежності.
</Note>

Метадані вбудованого пакета є явними, а не виводяться зі зібраного JavaScript під час запуску Gateway. Runtime-залежності мають бути в пакеті плагіна, якому вони належать; запуск упакованого OpenClaw ніколи не виправляє й не дзеркалює залежності плагінів.

## Пов’язане

- [Створення плагінів](/uk/plugins/building-plugins) — покроковий посібник із початку роботи
- [Маніфест Plugin](/uk/plugins/manifest) — повний довідник схеми маніфесту
- [Точки входу SDK](/uk/plugins/sdk-entrypoints) — `definePluginEntry` і `defineChannelPluginEntry`
