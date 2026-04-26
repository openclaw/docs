---
read_when:
    - Ви додаєте майстер налаштування до Plugin
    - Вам потрібно зрозуміти різницю між `setup-entry.ts` і `index.ts`
    - Ви визначаєте схеми конфігурації Plugin або метадані `openclaw` у `package.json`
sidebarTitle: Setup and config
summary: майстри налаштування, `setup-entry.ts`, схеми конфігурації та метадані `package.json`
title: налаштування Plugin і конфігурація
x-i18n:
    generated_at: "2026-04-26T08:15:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: d5ac08bf43af0a15e4ed797eb3a732d15f24f67304efbac7d74e6f24ffe67af9
    source_path: plugins/sdk-setup.md
    workflow: 15
---

Довідка щодо пакування Plugin (метадані `package.json`), маніфестів (`openclaw.plugin.json`), точок входу налаштування та схем конфігурації.

<Tip>
**Потрібен покроковий приклад?** Практичні посібники розглядають пакування в контексті: [плагіни каналів](/uk/plugins/sdk-channel-plugins#step-1-package-and-manifest) і [плагіни провайдерів](/uk/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Метадані пакета

У вашому `package.json` має бути поле `openclaw`, яке повідомляє системі Plugin, що надає ваш Plugin:

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
  <Tab title="Plugin провайдера / базова конфігурація ClawHub">
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
Якщо ви публікуєте Plugin зовні у ClawHub, поля `compat` і `build` є обов’язковими. Канонічні фрагменти для публікації містяться в `docs/snippets/plugin-publish/`.
</Note>

### Поля `openclaw`

<ParamField path="extensions" type="string[]">
  Файли точок входу (відносно кореня пакета).
</ParamField>
<ParamField path="setupEntry" type="string">
  Легка точка входу лише для налаштування (необов’язково).
</ParamField>
<ParamField path="channel" type="object">
  Метадані каталогу каналів для налаштування, вибору, швидкого старту та поверхонь стану.
</ParamField>
<ParamField path="providers" type="string[]">
  Ідентифікатори провайдерів, зареєстрованих цим Plugin.
</ParamField>
<ParamField path="install" type="object">
  Підказки для встановлення: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  Прапорці поведінки запуску.
</ParamField>

### `openclaw.channel`

`openclaw.channel` — це недорогі метадані пакета для виявлення каналів і поверхонь налаштування до завантаження середовища виконання.

| Поле                                   | Тип        | Що це означає                                                               |
| -------------------------------------- | ---------- | --------------------------------------------------------------------------- |
| `id`                                   | `string`   | Канонічний ідентифікатор каналу.                                            |
| `label`                                | `string`   | Основна мітка каналу.                                                       |
| `selectionLabel`                       | `string`   | Мітка у виборі/налаштуванні, якщо вона має відрізнятися від `label`.        |
| `detailLabel`                          | `string`   | Вторинна мітка для багатших каталогів каналів і поверхонь стану.            |
| `docsPath`                             | `string`   | Шлях до документації для посилань у налаштуванні та виборі.                 |
| `docsLabel`                            | `string`   | Мітка-перевизначення для посилань на документацію, якщо вона має відрізнятися від ідентифікатора каналу. |
| `blurb`                                | `string`   | Короткий опис для онбордингу/каталогу.                                      |
| `order`                                | `number`   | Порядок сортування в каталогах каналів.                                     |
| `aliases`                              | `string[]` | Додаткові псевдоніми для пошуку під час вибору каналу.                      |
| `preferOver`                           | `string[]` | Ідентифікатори Plugin/каналів з нижчим пріоритетом, які цей канал має випереджати. |
| `systemImage`                          | `string`   | Необов’язкова назва іконки/системного зображення для UI-каталогів каналів.  |
| `selectionDocsPrefix`                  | `string`   | Текст-префікс перед посиланнями на документацію в поверхнях вибору.         |
| `selectionDocsOmitLabel`               | `boolean`  | Показувати шлях до документації безпосередньо замість іменованого посилання в тексті вибору. |
| `selectionExtras`                      | `string[]` | Додаткові короткі рядки, що додаються в тексті вибору.                      |
| `markdownCapable`                      | `boolean`  | Позначає канал як сумісний з markdown для рішень щодо вихідного форматування. |
| `exposure`                             | `object`   | Керування видимістю каналу для налаштування, списків налаштованого та поверхонь документації. |
| `quickstartAllowFrom`                  | `boolean`  | Додає цей канал до стандартного потоку налаштування швидкого старту `allowFrom`. |
| `forceAccountBinding`                  | `boolean`  | Вимагає явного прив’язування облікового запису навіть тоді, коли існує лише один обліковий запис. |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Віддавати перевагу пошуку сесії під час визначення цілей оголошень для цього каналу. |

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

- `configured`: включати канал до поверхонь списку налаштованих каналів/стану
- `setup`: включати канал до інтерактивних засобів вибору налаштування/конфігурації
- `docs`: позначати канал як публічний у поверхнях документації/навігації

<Note>
`showConfigured` і `showInSetup` залишаються підтримуваними як застарілі псевдоніми. Рекомендовано використовувати `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` — це метадані пакета, а не метадані маніфесту.

| Поле                         | Тип                  | Що це означає                                                                    |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Канонічна специфікація npm для потоків встановлення/оновлення.                   |
| `localPath`                  | `string`             | Локальний шлях встановлення для розробки або вбудованого використання.           |
| `defaultChoice`              | `"npm"` \| `"local"` | Бажане джерело встановлення, коли доступні обидва варіанти.                      |
| `minHostVersion`             | `string`             | Мінімальна підтримувана версія OpenClaw у форматі `>=x.y.z`.                     |
| `expectedIntegrity`          | `string`             | Очікуваний рядок цілісності npm dist, зазвичай `sha512-...`, для зафіксованих встановлень. |
| `allowInvalidConfigRecovery` | `boolean`            | Дозволяє потокам перевстановлення вбудованих Plugin відновлюватися після певних збоїв через застарілу конфігурацію. |

<AccordionGroup>
  <Accordion title="Поведінка онбордингу">
    Інтерактивний онбординг також використовує `openclaw.install` для поверхонь встановлення на вимогу. Якщо ваш Plugin показує варіанти автентифікації провайдера або метадані налаштування/каталогу каналів до завантаження середовища виконання, онбординг може показати цей вибір, запропонувати npm або локальне встановлення, встановити або увімкнути Plugin, а потім продовжити вибраний потік. Варіанти онбордингу через npm потребують довірених метаданих каталогу з реєстровим `npmSpec`; точні версії та `expectedIntegrity` є необов’язковими фіксаціями. Якщо `expectedIntegrity` задано, потоки встановлення/оновлення застосовують його перевірку. Зберігайте метадані «що показувати» в `openclaw.plugin.json`, а метадані «як це встановити» — у `package.json`.
  </Accordion>
  <Accordion title="Застосування `minHostVersion`">
    Якщо встановлено `minHostVersion`, і встановлення, і завантаження через реєстр маніфестів застосовують це обмеження. Старіші хости пропускають Plugin; некоректні рядки версій відхиляються.
  </Accordion>
  <Accordion title="Зафіксовані npm-встановлення">
    Для зафіксованих npm-встановлень зберігайте точну версію в `npmSpec` і додавайте очікувану цілісність артефакту:

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
  <Accordion title="Область дії `allowInvalidConfigRecovery`">
    `allowInvalidConfigRecovery` — це не загальний обхід для зламаних конфігурацій. Він призначений лише для вузького відновлення вбудованих Plugin, щоб перевстановлення/налаштування могли виправити відомі залишки після оновлення, наприклад відсутній шлях до вбудованого Plugin або застарілий запис `channels.<id>` для цього самого Plugin. Якщо конфігурація зламана з не пов’язаних причин, встановлення все одно безпечно завершується відмовою і повідомляє оператору виконати `openclaw doctor --fix`.
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

Якщо це увімкнено, OpenClaw завантажує лише `setupEntry` на етапі запуску до початку прослуховування, навіть для вже налаштованих каналів. Повна точка входу завантажується після того, як Gateway почне прослуховування.

<Warning>
Увімкнюйте відкладене завантаження лише тоді, коли ваш `setupEntry` реєструє все, що Gateway потрібно до початку прослуховування (реєстрація каналу, HTTP-маршрути, методи Gateway). Якщо повна точка входу володіє необхідними можливостями запуску, залишайте стандартну поведінку.
</Warning>

Якщо ваша точка входу налаштування/повна точка входу реєструє методи Gateway RPC, використовуйте для них префікс, специфічний для Plugin. Зарезервовані простори імен адміністратора ядра (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) залишаються у власності ядра і завжди зіставляються з `operator.admin`.

## Маніфест Plugin

Кожен нативний Plugin має постачатися з `openclaw.plugin.json` у корені пакета. OpenClaw використовує його для валідації конфігурації без виконання коду Plugin.

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

Навіть Plugin без конфігурації мають постачатися зі схемою. Порожня схема є коректною:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Повну довідку щодо схеми дивіться в розділі [Маніфест Plugin](/uk/plugins/manifest).

## Публікація в ClawHub

Для пакетів Plugin використовуйте спеціальну команду ClawHub для пакетів:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
Застарілий псевдонім публікації лише для Skills призначений для Skills. Пакети Plugin завжди мають використовувати `clawhub package publish`.
</Note>

## Точка входу налаштування

Файл `setup-entry.ts` — це легка альтернатива `index.ts`, яку OpenClaw завантажує, коли йому потрібні лише поверхні налаштування (онбординг, відновлення конфігурації, перевірка вимкнених каналів).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Це дає змогу уникнути завантаження важкого коду середовища виконання (криптобібліотек, реєстрацій CLI, фонових сервісів) під час потоків налаштування.

Вбудовані канали workspace, які тримають безпечні для налаштування експорти в sidecar-модулях, можуть використовувати `defineBundledChannelSetupEntry(...)` з `openclaw/plugin-sdk/channel-entry-contract` замість `defineSetupPluginEntry(...)`. Цей вбудований контракт також підтримує необов’язковий експорт `runtime`, щоб налаштування зв’язування runtime під час налаштування залишалося легким і явним.

<AccordionGroup>
  <Accordion title="Коли OpenClaw використовує setupEntry замість повної точки входу">
    - Канал вимкнено, але йому потрібні поверхні налаштування/онбордингу.
    - Канал увімкнено, але не налаштовано.
    - Увімкнено відкладене завантаження (`deferConfiguredChannelFullLoadUntilAfterListen`).
  </Accordion>
  <Accordion title="Що має реєструвати setupEntry">
    - Об’єкт Plugin каналу (через `defineSetupPluginEntry`).
    - Усі HTTP-маршрути, потрібні до того, як Gateway почне прослуховування.
    - Усі методи Gateway, потрібні під час запуску.

    Ці стартові методи Gateway усе одно мають уникати зарезервованих просторів імен адміністратора ядра, таких як `config.*` або `update.*`.

  </Accordion>
  <Accordion title="Що НЕ має містити setupEntry">
    - Реєстрації CLI.
    - Фонові сервіси.
    - Важкі імпорти runtime (crypto, SDK).
    - Методи Gateway, потрібні лише після запуску.
  </Accordion>
</AccordionGroup>

### Вузькі імпорти допоміжних засобів налаштування

Для гарячих шляхів лише налаштування віддавайте перевагу вузьким допоміжним швам налаштування замість ширшого umbrella `plugin-sdk/setup`, коли вам потрібна лише частина поверхні налаштування:

| Шлях імпорту                       | Використовуйте для                                                                          | Ключові експорти                                                                                                                                                                                                                                                                              |
| ---------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | допоміжні засоби runtime під час налаштування, які лишаються доступними в `setupEntry` / відкладеному запуску каналу | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | адаптери налаштування облікових записів з урахуванням середовища                            | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                         |
| `plugin-sdk/setup-tools`           | допоміжні засоби CLI/архіву/документації для налаштування/встановлення                      | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                               |

Використовуйте ширший шов `plugin-sdk/setup`, коли вам потрібен повний спільний набір інструментів налаштування, включно з допоміжними засобами патчів конфігурації, такими як `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Адаптери патчів налаштування залишаються безпечними для імпорту на гарячому шляху. Їхній пошук поверхні контракту просування одного облікового запису у вбудованому режимі є ледачим, тому імпорт `plugin-sdk/setup-runtime` не завантажує завчасно виявлення поверхні вбудованого контракту до фактичного використання адаптера.

### Просування одного облікового запису під контролем каналу

Коли канал оновлюється від верхньорівневої конфігурації одного облікового запису до `channels.<id>.accounts.*`, стандартна спільна поведінка переміщує значення, що стали прив’язаними до облікового запису, у `accounts.default`.

Вбудовані канали можуть звузити або перевизначити це просування через свою поверхню контракту налаштування:

- `singleAccountKeysToMove`: додаткові ключі верхнього рівня, які слід перемістити до просунутого облікового запису
- `namedAccountPromotionKeys`: коли іменовані облікові записи вже існують, лише ці ключі переміщуються до просунутого облікового запису; спільні ключі політики/доставки залишаються в корені каналу
- `resolveSingleAccountPromotionTarget(...)`: вибір наявного облікового запису, який отримає просунуті значення

<Note>
Matrix — поточний вбудований приклад. Якщо вже існує рівно один іменований обліковий запис Matrix або якщо `defaultAccount` вказує на наявний неканонічний ключ, такий як `Ops`, просування зберігає цей обліковий запис замість створення нового запису `accounts.default`.
</Note>

## Схема конфігурації

Конфігурація Plugin перевіряється на відповідність JSON Schema у вашому маніфесті. Користувачі налаштовують Plugin через:

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

Використовуйте `buildChannelConfigSchema`, щоб перетворити схему Zod на обгортку `ChannelConfigSchema`, яка використовується артефактами конфігурації під контролем Plugin:

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

Для сторонніх Plugin холодний шлях контракту все ще лишається за маніфестом Plugin: віддзеркальте згенеровану JSON Schema в `openclaw.plugin.json#channelConfigs`, щоб схема конфігурації, налаштування та поверхні UI могли перевіряти `channels.<id>` без завантаження коду runtime.

## Майстри налаштування

Plugin каналів можуть надавати інтерактивні майстри налаштування для `openclaw onboard`. Майстер — це об’єкт `ChannelSetupWizard` у `ChannelPlugin`:

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

Тип `ChannelSetupWizard` підтримує `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` тощо. Повні приклади дивіться у вбудованих пакетах Plugin (наприклад, Plugin Discord `src/channel.setup.ts`).

<AccordionGroup>
  <Accordion title="Спільні запити allowFrom">
    Для запитів DM allowlist, яким потрібен лише стандартний потік `note -> prompt -> parse -> merge -> patch`, віддавайте перевагу спільним допоміжним засобам налаштування з `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` і `createNestedChannelParsedAllowFromPrompt(...)`.
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
    // Повертає { setupAdapter, setupWizard }
    ```

    `plugin-sdk/channel-setup` також надає нижчорівневі білдери `createOptionalChannelSetupAdapter(...)` і `createOptionalChannelSetupWizard(...)`, коли вам потрібна лише одна половина цієї необов’язкової поверхні встановлення.

    Згенеровані необов’язкові адаптер/майстер безпечно завершуються відмовою на реальних записах конфігурації. Вони повторно використовують одне повідомлення про обов’язкове встановлення для `validateInput`, `applyAccountConfig` і `finalize`, а також додають посилання на документацію, якщо задано `docsPath`.

  </Accordion>
  <Accordion title="Допоміжні засоби налаштування з бінарною основою">
    Для UI налаштування з бінарною основою віддавайте перевагу спільним делегованим допоміжним засобам замість копіювання однакового glue-коду для binary/status у кожен канал:

    - `createDetectedBinaryStatus(...)` для блоків статусу, які відрізняються лише мітками, підказками, оцінками та виявленням binary
    - `createCliPathTextInput(...)` для текстових вводів, що спираються на шлях
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` і `createDelegatedResolveConfigured(...)`, коли `setupEntry` має ледачо переспрямовувати до важчого повного майстра
    - `createDelegatedTextInputShouldPrompt(...)`, коли `setupEntry` має лише делегувати рішення `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Публікація та встановлення

**Зовнішні Plugin:** опублікуйте в [ClawHub](/uk/tools/clawhub) або npm, а потім встановіть:

<Tabs>
  <Tab title="Авто (спочатку ClawHub, потім npm)">
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
  <Tab title="Специфікація npm-пакета">
    Відповідного перевизначення `npm:` немає. Використовуйте звичайну специфікацію npm-пакета, коли вам потрібен шлях npm після відкату з ClawHub:

    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugin у репозиторії:** розмістіть у дереві workspace вбудованих Plugin, і їх буде автоматично виявлено під час збірки.

**Користувачі можуть встановити:**

```bash
openclaw plugins install <package-name>
```

<Info>
Для встановлень із джерела npm `openclaw plugins install` запускає локальний для проєкту `npm install --ignore-scripts` (без lifecycle scripts), ігноруючи успадковані глобальні налаштування npm install. Зберігайте дерева залежностей Plugin чистими JS/TS та уникайте пакетів, яким потрібні збірки через `postinstall`.
</Info>

<Note>
Вбудовані Plugin, що належать OpenClaw, — єдиний виняток для відновлення під час запуску: коли пакетне встановлення бачить один із них увімкненим через конфігурацію Plugin, застарілу конфігурацію каналу або його вбудований маніфест із увімкненням за замовчуванням, під час запуску виконуються встановлення відсутніх залежностей runtime цього Plugin перед імпортом. Стороннім Plugin не слід покладатися на встановлення під час запуску; і надалі використовуйте явний інсталятор Plugin.
</Note>

## Пов’язане

- [Створення Plugin](/uk/plugins/building-plugins) — покроковий посібник для початку роботи
- [Маніфест Plugin](/uk/plugins/manifest) — повна довідка щодо схеми маніфесту
- [Точки входу SDK](/uk/plugins/sdk-entrypoints) — `definePluginEntry` і `defineChannelPluginEntry`
