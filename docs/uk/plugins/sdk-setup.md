---
read_when:
    - Ви додаєте майстер налаштування до Plugin
    - Потрібно розібратися з setup-entry.ts і index.ts
    - Ви визначаєте схеми конфігурації Plugin або метадані openclaw у package.json
sidebarTitle: Setup and config
summary: Майстри налаштування, setup-entry.ts, схеми конфігурації та метадані package.json
title: Налаштування та конфігурація Plugin
x-i18n:
    generated_at: "2026-05-02T19:11:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0a89e113952b1809bc19b0535d0895b1f0e13ee7c57446a9f27817c03a8e6000
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Довідник із пакування plugin (`package.json` metadata), маніфестів (`openclaw.plugin.json`), записів налаштування та схем конфігурації.

<Tip>
**Шукаєте покроковий посібник?** Практичні посібники розглядають пакування в контексті: [Channel plugins](/uk/plugins/sdk-channel-plugins#step-1-package-and-manifest) і [Provider plugins](/uk/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Метадані пакета

Вашому `package.json` потрібне поле `openclaw`, яке повідомляє системі plugin, що надає ваш plugin:

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
  Легка точка входу лише для налаштування (необов’язково).
</ParamField>
<ParamField path="channel" type="object">
  Метадані каталогу каналу для поверхонь налаштування, вибору, швидкого старту та статусу.
</ParamField>
<ParamField path="providers" type="string[]">
  Ідентифікатори провайдерів, зареєстровані цим plugin.
</ParamField>
<ParamField path="install" type="object">
  Підказки встановлення: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  Прапорці поведінки запуску.
</ParamField>

### `openclaw.channel`

`openclaw.channel` — це легкі метадані пакета для виявлення каналів і поверхонь налаштування до завантаження runtime.

| Поле                                   | Тип        | Що це означає                                                                  |
| -------------------------------------- | ---------- | ------------------------------------------------------------------------------ |
| `id`                                   | `string`   | Канонічний ідентифікатор каналу.                                               |
| `label`                                | `string`   | Основна мітка каналу.                                                          |
| `selectionLabel`                       | `string`   | Мітка вибору/налаштування, коли вона має відрізнятися від `label`.             |
| `detailLabel`                          | `string`   | Вторинна детальна мітка для багатших каталогів каналів і поверхонь статусу.    |
| `docsPath`                             | `string`   | Шлях документації для посилань налаштування та вибору.                         |
| `docsLabel`                            | `string`   | Перевизначена мітка для посилань документації, коли вона має відрізнятися від ідентифікатора каналу. |
| `blurb`                                | `string`   | Короткий опис для онбордингу/каталогу.                                         |
| `order`                                | `number`   | Порядок сортування в каталогах каналів.                                        |
| `aliases`                              | `string[]` | Додаткові псевдоніми для пошуку під час вибору каналу.                         |
| `preferOver`                           | `string[]` | Ідентифікатори plugin/каналів із нижчим пріоритетом, які цей канал має випереджати. |
| `systemImage`                          | `string`   | Необов’язкова назва іконки/system-image для UI-каталогів каналів.              |
| `selectionDocsPrefix`                  | `string`   | Текст-префікс перед посиланнями документації на поверхнях вибору.              |
| `selectionDocsOmitLabel`               | `boolean`  | Показувати шлях документації напряму замість підписаного посилання документації в тексті вибору. |
| `selectionExtras`                      | `string[]` | Додаткові короткі рядки, додані до тексту вибору.                              |
| `markdownCapable`                      | `boolean`  | Позначає канал як здатний до markdown для рішень щодо вихідного форматування.  |
| `exposure`                             | `object`   | Елементи керування видимістю каналу для налаштування, списків налаштованих каналів і поверхонь документації. |
| `quickstartAllowFrom`                  | `boolean`  | Долучити цей канал до стандартного потоку налаштування швидкого старту `allowFrom`. |
| `forceAccountBinding`                  | `boolean`  | Вимагати явного прив’язування облікового запису, навіть коли існує лише один обліковий запис. |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Надавати перевагу пошуку сеансу під час визначення цілей оголошення для цього каналу. |

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

- `configured`: включати канал у поверхні списків налаштованих каналів/статусу
- `setup`: включати канал в інтерактивні засоби вибору налаштування/конфігурування
- `docs`: позначати канал як публічний у поверхнях документації/навігації

<Note>
`showConfigured` і `showInSetup` залишаються підтримуваними як застарілі псевдоніми. Надавайте перевагу `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` — це метадані пакета, а не метадані маніфесту.

| Поле                         | Тип                                 | Що це означає                                                                  |
| ---------------------------- | ----------------------------------- | ------------------------------------------------------------------------------ |
| `clawhubSpec`                | `string`                            | Канонічна специфікація ClawHub для встановлення/оновлення та потоків онбордингу зі встановленням на вимогу. |
| `npmSpec`                    | `string`                            | Канонічна npm-специфікація для резервних потоків встановлення/оновлення.       |
| `localPath`                  | `string`                            | Локальний шлях розробки або шлях встановлення в комплекті.                     |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Бажане джерело встановлення, коли доступно кілька джерел.                      |
| `minHostVersion`             | `string`                            | Мінімальна підтримувана версія OpenClaw у форматі `>=x.y.z` або `>=x.y.z-prerelease`. |
| `expectedIntegrity`          | `string`                            | Очікуваний рядок цілісності npm dist, зазвичай `sha512-...`, для закріплених встановлень. |
| `allowInvalidConfigRecovery` | `boolean`                           | Дозволяє потокам перевстановлення bundled-plugin відновлюватися після певних збоїв застарілої конфігурації. |

<AccordionGroup>
  <Accordion title="Поведінка онбордингу">
    Інтерактивний онбординг також використовує `openclaw.install` для поверхонь встановлення на вимогу. Якщо ваш plugin показує варіанти автентифікації провайдера або метадані налаштування/каталогу каналу до завантаження runtime, онбординг може показати цей вибір, запропонувати ClawHub, npm або локальне встановлення, встановити або ввімкнути plugin, а потім продовжити вибраний потік. Варіанти онбордингу ClawHub використовують `clawhubSpec` і мають перевагу, коли присутні; варіанти npm потребують довірених метаданих каталогу з реєстровим `npmSpec`; точні версії та `expectedIntegrity` є необов’язковими npm-закріпленнями. Якщо `expectedIntegrity` присутній, потоки встановлення/оновлення примусово застосовують його для npm. Зберігайте метадані "що показувати" в `openclaw.plugin.json`, а метадані "як це встановити" — у `package.json`.
  </Accordion>
  <Accordion title="Застосування minHostVersion">
    Якщо `minHostVersion` встановлено, його застосовують і встановлення, і завантаження non-bundled manifest-registry. Старіші хости пропускають зовнішні plugins; недійсні рядки версій відхиляються. Bundled source plugins вважаються співверсійними з checkout хоста.
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
    `allowInvalidConfigRecovery` не є загальним обходом для зламаних конфігурацій. Це лише для вузького відновлення bundled-plugin, щоб перевстановлення/налаштування могло виправити відомі залишки оновлення, як-от відсутній шлях bundled plugin або застарілий запис `channels.<id>` для того самого plugin. Якщо конфігурація зламана з непов’язаних причин, встановлення все одно завершується закрито й повідомляє оператору запустити `openclaw doctor --fix`.
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

Коли це ввімкнено, OpenClaw завантажує лише `setupEntry` під час фази запуску перед прослуховуванням, навіть для вже налаштованих каналів. Повна точка входу завантажується після того, як gateway починає прослуховувати.

<Warning>
Увімкніть відкладене завантаження лише тоді, коли ваш `setupEntry` реєструє все, що потрібно gateway до початку прослуховування (реєстрація каналу, HTTP-маршрути, методи gateway). Якщо повна точка входу володіє потрібними можливостями запуску, залиште поведінку за замовчуванням.
</Warning>

Якщо ваша точка входу setup/full реєструє методи gateway RPC, тримайте їх на префіксі, специфічному для plugin. Зарезервовані простори імен адміністрування ядра (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) залишаються у власності ядра й завжди визначаються як `operator.admin`.

## Маніфест Plugin

Кожен native plugin має постачати `openclaw.plugin.json` у корені пакета. OpenClaw використовує це для перевірки конфігурації без виконання коду plugin.

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

Для channel plugins додайте `kind` і `channels`:

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

Див. [Маніфест Plugin](/uk/plugins/manifest), щоб отримати повну довідку зі схеми.

## Публікація в ClawHub

Для пакетів plugin використовуйте команду ClawHub, специфічну для пакета:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
Застарілий псевдонім публікації лише для skills призначений для skills. Пакети Plugin завжди мають використовувати `clawhub package publish`.
</Note>

## Точка входу для налаштування

Файл `setup-entry.ts` — це легка альтернатива `index.ts`, яку OpenClaw завантажує, коли йому потрібні лише поверхні налаштування (онбординг, виправлення конфігурації, перевірка вимкненого каналу).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Це дає змогу не завантажувати важкий runtime-код (криптографічні бібліотеки, реєстрації CLI, фонові служби) під час потоків налаштування.

Пакетні канали workspace, які тримають безпечні для налаштування експорти в допоміжних модулях, можуть використовувати `defineBundledChannelSetupEntry(...)` з `openclaw/plugin-sdk/channel-entry-contract` замість `defineSetupPluginEntry(...)`. Цей пакетний контракт також підтримує необов’язковий експорт `runtime`, щоб runtime-зв’язування під час налаштування залишалося легким і явним.

<AccordionGroup>
  <Accordion title="Коли OpenClaw використовує setupEntry замість повної точки входу">
    - Канал вимкнений, але потребує поверхонь налаштування/онбордингу.
    - Канал увімкнений, але не налаштований.
    - Відкладене завантаження увімкнене (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Що setupEntry має реєструвати">
    - Об’єкт Plugin каналу (через `defineSetupPluginEntry`).
    - Будь-які HTTP-маршрути, потрібні до gateway listen.
    - Будь-які методи Gateway, потрібні під час запуску.

    Ці стартові методи Gateway усе одно мають уникати зарезервованих просторів імен адміністрування ядра, як-от `config.*` або `update.*`.

  </Accordion>
  <Accordion title="Що setupEntry НЕ має містити">
    - Реєстрації CLI.
    - Фонові служби.
    - Важкі runtime-імпорти (криптографія, SDK).
    - Методи Gateway, потрібні лише після запуску.

  </Accordion>
</AccordionGroup>

### Вузькі імпорти помічників налаштування

Для гарячих шляхів лише налаштування віддавайте перевагу вузьким seam помічників налаштування замість ширшого umbrella `plugin-sdk/setup`, коли вам потрібна лише частина поверхні налаштування:

| Шлях імпорту                       | Для чого використовувати                                                                  | Ключові експорти                                                                                                                                                                                                                                                                             |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | runtime-помічники часу налаштування, що залишаються доступними в `setupEntry` / відкладеному запуску каналу | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | адаптери налаштування облікового запису з урахуванням середовища                          | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | помічники setup/install CLI/archive/docs                                                  | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

Використовуйте ширший seam `plugin-sdk/setup`, коли вам потрібен повний спільний набір інструментів налаштування, включно з помічниками config-patch, як-от `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Адаптери setup patch залишаються безпечними для hot-path під час імпорту. Їхній пакетний lookup contract-surface для просування одного облікового запису є lazy, тому імпорт `plugin-sdk/setup-runtime` не завантажує eagerly виявлення bundled contract-surface до фактичного використання адаптера.

### Просування одного облікового запису, кероване каналом

Коли канал оновлюється з top-level конфігурації одного облікового запису до `channels.<id>.accounts.*`, стандартна спільна поведінка переміщує promoted значення, scoped до облікового запису, в `accounts.default`.

Пакетні канали можуть звузити або перевизначити це просування через свою поверхню контракту налаштування:

- `singleAccountKeysToMove`: додаткові top-level ключі, які мають переміститися в promoted обліковий запис
- `namedAccountPromotionKeys`: коли іменовані облікові записи вже існують, лише ці ключі переміщуються в promoted обліковий запис; спільні ключі policy/delivery залишаються в root каналу
- `resolveSingleAccountPromotionTarget(...)`: вибирає, який наявний обліковий запис отримує promoted значення

<Note>
Matrix — поточний пакетний приклад. Якщо вже існує рівно один іменований обліковий запис Matrix або якщо `defaultAccount` вказує на наявний неканонічний ключ, як-от `Ops`, просування зберігає цей обліковий запис замість створення нового запису `accounts.default`.
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

Для конфігурації, специфічної для каналу, використовуйте натомість секцію конфігурації каналу:

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

Використовуйте `buildChannelConfigSchema`, щоб перетворити схему Zod на wrapper `ChannelConfigSchema`, який використовується артефактами конфігурації, що належать Plugin:

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

Для сторонніх plugins контракт cold-path усе ще є маніфестом Plugin: віддзеркальте згенеровану JSON Schema в `openclaw.plugin.json#channelConfigs`, щоб схема конфігурації, налаштування та поверхні UI могли перевіряти `channels.<id>` без завантаження runtime-коду.

## Майстри налаштування

Plugins каналів можуть надавати інтерактивні майстри налаштування для `openclaw onboard`. Майстер — це об’єкт `ChannelSetupWizard` у `ChannelPlugin`:

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

Тип `ChannelSetupWizard` підтримує `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` та інше. Повні приклади дивіться в пакетах bundled plugin (наприклад, у Discord plugin `src/channel.setup.ts`).

<AccordionGroup>
  <Accordion title="Спільні запити allowFrom">
    Для запитів allowlist DM, яким потрібен лише стандартний потік `note -> prompt -> parse -> merge -> patch`, віддавайте перевагу спільним помічникам налаштування з `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` і `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Стандартний статус налаштування каналу">
    Для блоків статусу налаштування каналу, які відрізняються лише labels, scores і необов’язковими додатковими рядками, віддавайте перевагу `createStandardChannelSetupStatus(...)` з `openclaw/plugin-sdk/setup` замість ручного створення того самого об’єкта `status` у кожному Plugin.
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

    Згенеровані необов’язкові adapter/wizard fail closed для реальних записів конфігурації. Вони повторно використовують одне повідомлення про необхідність встановлення в `validateInput`, `applyAccountConfig` і `finalize`, а також додають посилання на docs, коли `docsPath` задано.

  </Accordion>
  <Accordion title="Помічники налаштування з binary-backed">
    Для UI налаштування з binary-backed віддавайте перевагу спільним delegated помічникам замість копіювання однакового binary/status glue в кожен канал:

    - `createDetectedBinaryStatus(...)` для блоків статусу, які відрізняються лише labels, hints, scores і виявленням binary
    - `createCliPathTextInput(...)` для text inputs, backed шляхом
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` і `createDelegatedResolveConfigured(...)`, коли `setupEntry` має lazy-forward до важчого повного майстра
    - `createDelegatedTextInputShouldPrompt(...)`, коли `setupEntry` має делегувати лише рішення `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Публікація та встановлення

**Зовнішні plugins:** опублікуйте в [ClawHub](/uk/tools/clawhub), потім установіть:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    Bare package specs установлюються з npm під час launch cutover.

  </Tab>
  <Tab title="Лише ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="Специфікація пакета npm">
    Використовуйте npm, коли пакет ще не переміщено до ClawHub, або коли вам потрібен
    прямий шлях установлення npm під час міграції:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Плагіни в репозиторії:** розмістіть їх у дереві робочої області вбудованих плагінів, і вони автоматично виявлятимуться під час збірки.

**Користувачі можуть установити:**

```bash
openclaw plugins install <package-name>
```

<Info>
Для встановлень із npm `openclaw plugins install` установлює пакет у `~/.openclaw/npm` із вимкненими сценаріями життєвого циклу. Тримайте дерева залежностей плагінів чистими JS/TS і уникайте пакетів, які потребують `postinstall` збірок.
</Info>

<Note>
Запуск Gateway не встановлює залежності плагінів. Потоки встановлення npm/git/ClawHub відповідають за узгодження залежностей; локальні плагіни вже повинні мати встановлені залежності.
</Note>

Метадані вбудованого пакета є явними, а не виведеними зі зібраного JavaScript під час запуску Gateway. Runtime-залежності мають бути в пакеті Plugin, якому вони належать; запуск упакованого OpenClaw ніколи не виправляє й не дзеркалює залежності плагінів.

## Пов’язане

- [Створення плагінів](/uk/plugins/building-plugins) — покроковий посібник для початку роботи
- [Маніфест Plugin](/uk/plugins/manifest) — повний довідник схеми маніфесту
- [Точки входу SDK](/uk/plugins/sdk-entrypoints) — `definePluginEntry` і `defineChannelPluginEntry`
