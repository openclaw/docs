---
read_when:
    - Ви додаєте майстер налаштування до Plugin
    - Потрібно зрозуміти різницю між setup-entry.ts та index.ts
    - Ви визначаєте схеми конфігурації Plugin або метадані openclaw у package.json
sidebarTitle: Setup and config
summary: Майстри налаштування, setup-entry.ts, схеми конфігурації та метадані package.json
title: Налаштування та конфігурація Plugin
x-i18n:
    generated_at: "2026-05-02T15:47:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3975be167ef48e4840fa1abc2a0412f0fc5ab569898742ebc11a1c52f89871c9
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Довідник із пакування Plugin (`package.json` metadata), маніфестів (`openclaw.plugin.json`), записів налаштування та схем конфігурації.

<Tip>
**Шукаєте покроковий посібник?** Практичні посібники пояснюють пакування в контексті: [Plugin каналів](/uk/plugins/sdk-channel-plugins#step-1-package-and-manifest) і [Plugin провайдерів](/uk/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Метадані пакета

Ваш `package.json` має містити поле `openclaw`, яке повідомляє системі Plugin, що надає ваш Plugin:

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
Якщо ви публікуєте Plugin зовнішньо на ClawHub, ці поля `compat` і `build` є обов’язковими. Канонічні фрагменти для публікації розміщено в `docs/snippets/plugin-publish/`.
</Note>

### Поля `openclaw`

<ParamField path="extensions" type="string[]">
  Файли точок входу (відносно кореня пакета).
</ParamField>
<ParamField path="setupEntry" type="string">
  Полегшена точка входу лише для налаштування (необов’язково).
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
  Прапорці поведінки запуску.
</ParamField>

### `openclaw.channel`

`openclaw.channel` — це легкі метадані пакета для виявлення каналів і поверхонь налаштування до завантаження runtime.

| Поле                                   | Тип        | Що це означає                                                                 |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | Канонічний ідентифікатор каналу.                                              |
| `label`                                | `string`   | Основна мітка каналу.                                                         |
| `selectionLabel`                       | `string`   | Мітка вибору/налаштування, коли вона має відрізнятися від `label`.            |
| `detailLabel`                          | `string`   | Вторинна детальна мітка для розширених каталогів каналів і поверхонь статусу. |
| `docsPath`                             | `string`   | Шлях документації для посилань налаштування та вибору.                        |
| `docsLabel`                            | `string`   | Перевизначена мітка для посилань документації, коли вона має відрізнятися від ідентифікатора каналу. |
| `blurb`                                | `string`   | Короткий опис для onboarding/каталогу.                                        |
| `order`                                | `number`   | Порядок сортування в каталогах каналів.                                       |
| `aliases`                              | `string[]` | Додаткові псевдоніми пошуку для вибору каналу.                                |
| `preferOver`                           | `string[]` | Ідентифікатори Plugin/каналів із нижчим пріоритетом, які цей канал має випереджати. |
| `systemImage`                          | `string`   | Необов’язкова назва іконки/system-image для каталогів UI каналів.             |
| `selectionDocsPrefix`                  | `string`   | Текст-префікс перед посиланнями документації на поверхнях вибору.             |
| `selectionDocsOmitLabel`               | `boolean`  | Показувати шлях документації напряму замість підписаного посилання документації у тексті вибору. |
| `selectionExtras`                      | `string[]` | Додаткові короткі рядки, додані до тексту вибору.                             |
| `markdownCapable`                      | `boolean`  | Позначає канал як сумісний із markdown для рішень щодо вихідного форматування. |
| `exposure`                             | `object`   | Керування видимістю каналу для налаштування, списків налаштованих каналів і поверхонь документації. |
| `quickstartAllowFrom`                  | `boolean`  | Увімкнути цей канал у стандартний потік налаштування швидкого старту `allowFrom`. |
| `forceAccountBinding`                  | `boolean`  | Вимагати явну прив’язку акаунта, навіть коли існує лише один акаунт.          |
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

- `configured`: включати канал у поверхні списків налаштованих/статусних елементів
- `setup`: включати канал в інтерактивні засоби вибору для налаштування/конфігурації
- `docs`: позначати канал як публічний у поверхнях документації/навігації

<Note>
`showConfigured` і `showInSetup` залишаються підтримуваними як застарілі псевдоніми. Надавайте перевагу `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` — це метадані пакета, а не метадані маніфесту.

| Поле                         | Тип                                 | Що це означає                                                                     |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Канонічна специфікація ClawHub для потоків встановлення/оновлення та onboarding встановлення на вимогу. |
| `npmSpec`                    | `string`                            | Канонічна специфікація npm для резервних потоків встановлення/оновлення.          |
| `localPath`                  | `string`                            | Локальний шлях розробки або шлях bundled встановлення.                            |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Бажане джерело встановлення, коли доступно кілька джерел.                         |
| `minHostVersion`             | `string`                            | Мінімальна підтримувана версія OpenClaw у формі `>=x.y.z` або `>=x.y.z-prerelease`. |
| `expectedIntegrity`          | `string`                            | Очікуваний рядок цілісності npm dist, зазвичай `sha512-...`, для закріплених встановлень. |
| `allowInvalidConfigRecovery` | `boolean`                           | Дозволяє потокам перевстановлення bundled Plugin відновлюватися після певних збоїв застарілої конфігурації. |

<AccordionGroup>
  <Accordion title="Поведінка onboarding">
    Інтерактивний onboarding також використовує `openclaw.install` для поверхонь встановлення на вимогу. Якщо ваш Plugin показує варіанти автентифікації провайдера або метадані налаштування/каталогу каналу до завантаження runtime, onboarding може показати цей варіант, запропонувати встановлення через ClawHub, npm або локальне встановлення, встановити чи ввімкнути Plugin, а потім продовжити вибраний потік. Варіанти onboarding ClawHub використовують `clawhubSpec` і мають пріоритет, коли присутні; варіанти npm потребують довірених метаданих каталогу з реєстровим `npmSpec`; точні версії та `expectedIntegrity` є необов’язковими закріпленнями npm. Якщо `expectedIntegrity` присутній, потоки встановлення/оновлення примусово застосовують його для npm. Зберігайте метадані «що показувати» в `openclaw.plugin.json`, а метадані «як це встановити» — у `package.json`.
  </Accordion>
  <Accordion title="Застосування minHostVersion">
    Якщо `minHostVersion` задано, і встановлення, і завантаження реєстру маніфестів для небundled Plugin примусово його застосовують. Старіші хости пропускають зовнішні Plugin; недійсні рядки версій відхиляються. Bundled вихідні Plugin вважаються такими, що мають ту саму версію, що й checkout хоста.
  </Accordion>
  <Accordion title="Закріплені встановлення npm">
    Для закріплених встановлень npm зберігайте точну версію в `npmSpec` і додайте очікувану цілісність артефакта:

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
    `allowInvalidConfigRecovery` не є загальним обходом для зламаних конфігурацій. Він призначений лише для вузького відновлення bundled Plugin, щоб перевстановлення/налаштування могло виправити відомі залишки після оновлення, як-от відсутній шлях bundled Plugin або застарілий запис `channels.<id>` для того самого Plugin. Якщо конфігурація зламана з інших причин, встановлення все одно завершується закрито й повідомляє оператору запустити `openclaw doctor --fix`.
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

Коли це ввімкнено, OpenClaw завантажує лише `setupEntry` під час фази запуску до початку прослуховування, навіть для вже налаштованих каналів. Повна точка входу завантажується після того, як Gateway починає прослуховування.

<Warning>
Умикайте відкладене завантаження лише тоді, коли ваш `setupEntry` реєструє все, що потрібно Gateway до початку прослуховування (реєстрація каналу, HTTP-маршрути, методи gateway). Якщо повна точка входу володіє потрібними можливостями запуску, залиште стандартну поведінку.
</Warning>

Якщо ваша точка входу для налаштування/повна точка входу реєструє методи RPC gateway, тримайте їх на префіксі, специфічному для Plugin. Зарезервовані простори імен основного адміністрування (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) залишаються у власності core і завжди розв’язуються в `operator.admin`.

## Маніфест Plugin

Кожен нативний Plugin має постачати `openclaw.plugin.json` у корені пакета. OpenClaw використовує це для валідації конфігурації без виконання коду Plugin.

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

Навіть Plugin без конфігурації мають постачати схему. Порожня схема є допустимою:

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

## Публікація ClawHub

Для пакетів Plugin використовуйте команду ClawHub, специфічну для пакета:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
Застарілий псевдонім публікації лише для skill призначений для skills. Пакети Plugin завжди мають використовувати `clawhub package publish`.
</Note>

## Запис налаштування

Файл `setup-entry.ts` — це легка альтернатива `index.ts`, яку OpenClaw завантажує, коли йому потрібні лише поверхні налаштування (онбординг, відновлення конфігурації, перевірка вимкненого каналу).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Це дає змогу не завантажувати важкий runtime-код (криптографічні бібліотеки, реєстрації CLI, фонові сервіси) під час потоків налаштування.

Вбудовані канали робочого простору, які зберігають setup-безпечні експорти в допоміжних модулях, можуть використовувати `defineBundledChannelSetupEntry(...)` з `openclaw/plugin-sdk/channel-entry-contract` замість `defineSetupPluginEntry(...)`. Цей вбудований контракт також підтримує необов’язковий експорт `runtime`, щоб runtime-зв’язування під час налаштування залишалося легким і явним.

<AccordionGroup>
  <Accordion title="Коли OpenClaw використовує setupEntry замість повного запису">
    - Канал вимкнено, але йому потрібні поверхні налаштування/онбордингу.
    - Канал увімкнено, але не налаштовано.
    - Увімкнено відкладене завантаження (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Що setupEntry має зареєструвати">
    - Об’єкт Plugin каналу (через `defineSetupPluginEntry`).
    - Будь-які HTTP-маршрути, потрібні до прослуховування gateway.
    - Будь-які методи gateway, потрібні під час запуску.

    Ці методи gateway для запуску все одно мають уникати зарезервованих основних адміністративних просторів імен, як-от `config.*` або `update.*`.

  </Accordion>
  <Accordion title="Що setupEntry НЕ має містити">
    - Реєстрації CLI.
    - Фонові сервіси.
    - Важкі runtime-імпорти (криптографія, SDK).
    - Методи Gateway, потрібні лише після запуску.

  </Accordion>
</AccordionGroup>

### Вузькі імпорти помічників налаштування

Для гарячих шляхів лише налаштування віддавайте перевагу вузьким seam помічників налаштування замість ширшої парасольки `plugin-sdk/setup`, коли вам потрібна лише частина поверхні налаштування:

| Шлях імпорту                       | Для чого використовувати                                                                  | Ключові експорти                                                                                                                                                                                                                                                                             |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | runtime-помічники часу налаштування, доступні в `setupEntry` / відкладеному запуску каналу | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | адаптери налаштування облікових записів з урахуванням середовища                          | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | помічники CLI/архівів/документації для налаштування/встановлення                           | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

Використовуйте ширший seam `plugin-sdk/setup`, коли потрібен повний спільний набір інструментів налаштування, включно з помічниками патчів конфігурації, як-от `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Адаптери патчів налаштування залишаються безпечними для гарячого шляху під час імпорту. Їхній вбудований пошук контрактної поверхні просування одного облікового запису є лінивим, тому імпорт `plugin-sdk/setup-runtime` не завантажує наперед виявлення вбудованої контрактної поверхні до фактичного використання адаптера.

### Просування одного облікового запису, яким володіє канал

Коли канал оновлюється з top-level конфігурації одного облікового запису до `channels.<id>.accounts.*`, стандартна спільна поведінка переносить просунуті значення з областю дії облікового запису в `accounts.default`.

Вбудовані канали можуть звузити або перевизначити це просування через свою контрактну поверхню налаштування:

- `singleAccountKeysToMove`: додаткові top-level ключі, які потрібно перенести в просунутий обліковий запис
- `namedAccountPromotionKeys`: коли іменовані облікові записи вже існують, лише ці ключі переносяться в просунутий обліковий запис; спільні ключі політики/доставки залишаються в корені каналу
- `resolveSingleAccountPromotionTarget(...)`: вибрати, який наявний обліковий запис отримає просунуті значення

<Note>
Matrix є поточним вбудованим прикладом. Якщо вже існує рівно один іменований обліковий запис Matrix або якщо `defaultAccount` вказує на наявний неканонічний ключ, як-от `Ops`, просування зберігає цей обліковий запис замість створення нового запису `accounts.default`.
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

### Побудова схем конфігурації каналів

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

Для сторонніх plugins холодним контрактом шляху все ще є маніфест Plugin: віддзеркальте згенеровану JSON Schema в `openclaw.plugin.json#channelConfigs`, щоб схема конфігурації, налаштування та UI-поверхні могли перевіряти `channels.<id>` без завантаження runtime-коду.

## Майстри налаштування

Канальні plugins можуть надавати інтерактивні майстри налаштування для `openclaw onboard`. Майстер — це об’єкт `ChannelSetupWizard` у `ChannelPlugin`:

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

Тип `ChannelSetupWizard` підтримує `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` тощо. Повні приклади див. у пакетах вбудованих plugins (наприклад, Plugin Discord `src/channel.setup.ts`).

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

    `plugin-sdk/channel-setup` також надає нижчорівневі конструктори `createOptionalChannelSetupAdapter(...)` і `createOptionalChannelSetupWizard(...)`, коли потрібна лише одна половина цієї поверхні необов’язкового встановлення.

    Згенерований необов’язковий адаптер/майстер закрито відмовляється від реальних записів конфігурації. Вони повторно використовують одне повідомлення про потрібне встановлення в `validateInput`, `applyAccountConfig` і `finalize`, а також додають посилання на документацію, коли задано `docsPath`.

  </Accordion>
  <Accordion title="Помічники налаштування на основі бінарних файлів">
    Для UI налаштування на основі бінарних файлів віддавайте перевагу спільним делегованим помічникам замість копіювання тієї самої зв’язки бінарного файла/статусу в кожен канал:

    - `createDetectedBinaryStatus(...)` для блоків статусу, які відрізняються лише мітками, підказками, оцінками та виявленням бінарного файла
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

    OpenClaw спершу пробує ClawHub і автоматично повертається до npm.

  </Tab>
  <Tab title="Лише ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="Специфікація пакета npm">
    Використовуйте npm, коли пакет ще не перенесено до ClawHub або коли під час міграції потрібен прямий шлях встановлення npm:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugin у репозиторії:** розмістіть їх у дереві робочого простору bundled plugin, і вони автоматично виявлятимуться під час збирання.

**Користувачі можуть встановлювати:**

```bash
openclaw plugins install <package-name>
```

<Info>
Для встановлень із npm `openclaw plugins install` встановлює пакет у `~/.openclaw/npm` з вимкненими lifecycle scripts. Тримайте дерева залежностей plugin чистими JS/TS і уникайте пакетів, які потребують збирання через `postinstall`.
</Info>

<Note>
Запуск Gateway не встановлює залежності plugin. Потоки встановлення npm/git/ClawHub відповідають за узгодження залежностей; локальні plugin вже повинні мати встановлені залежності.
</Note>

Метадані bundled package є явними, а не виводяться зі зібраного JavaScript під час запуску gateway. Runtime-залежності мають бути в пакеті plugin, якому вони належать; запуск упакованого OpenClaw ніколи не ремонтує і не дзеркалить залежності plugin.

## Пов’язане

- [Створення plugins](/uk/plugins/building-plugins) — покроковий посібник для початку роботи
- [Маніфест Plugin](/uk/plugins/manifest) — повна довідка схеми маніфесту
- [Точки входу SDK](/uk/plugins/sdk-entrypoints) — `definePluginEntry` і `defineChannelPluginEntry`
