---
read_when:
    - Ви додаєте майстер налаштування для Plugin
    - Потрібно зрозуміти setup-entry.ts порівняно з index.ts
    - Ви визначаєте схеми конфігурації Plugin або метадані openclaw у package.json
sidebarTitle: Setup and config
summary: Майстри налаштування, setup-entry.ts, схеми конфігурації та метадані package.json
title: Налаштування та конфігурація Plugin
x-i18n:
    generated_at: "2026-05-02T02:49:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 322cf8988da686d5bf7577f9825f6f8decb738f91563e4022c14bf16dca22824
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Довідка з пакування Plugin (метадані `package.json`), маніфестів (`openclaw.plugin.json`), записів налаштування та схем конфігурації.

<Tip>
**Шукаєте покроковий посібник?** Практичні посібники розглядають пакування в контексті: [Plugin каналів](/uk/plugins/sdk-channel-plugins#step-1-package-and-manifest) і [Plugin провайдерів](/uk/plugins/sdk-provider-plugins#step-1-package-and-manifest).
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
Якщо ви публікуєте Plugin зовнішньо на ClawHub, ці поля `compat` і `build` є обов’язковими. Канонічні фрагменти для публікації розташовані в `docs/snippets/plugin-publish/`.
</Note>

### Поля `openclaw`

<ParamField path="extensions" type="string[]">
  Файли точок входу (відносно кореня пакета).
</ParamField>
<ParamField path="setupEntry" type="string">
  Легка точка входу лише для налаштування (необов’язково).
</ParamField>
<ParamField path="channel" type="object">
  Метадані каталогу каналів для поверхонь налаштування, вибору, швидкого старту та стану.
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

`openclaw.channel` — це легкі метадані пакета для виявлення каналів і поверхонь налаштування до завантаження runtime.

| Поле                                   | Тип        | Що це означає                                                                 |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | Канонічний ідентифікатор каналу.                                              |
| `label`                                | `string`   | Основна мітка каналу.                                                         |
| `selectionLabel`                       | `string`   | Мітка вибору/налаштування, коли вона має відрізнятися від `label`.            |
| `detailLabel`                          | `string`   | Вторинна докладна мітка для розширених каталогів каналів і поверхонь стану.   |
| `docsPath`                             | `string`   | Шлях документації для посилань налаштування й вибору.                         |
| `docsLabel`                            | `string`   | Перевизначає мітку, використану для посилань на документацію, коли вона має відрізнятися від ідентифікатора каналу. |
| `blurb`                                | `string`   | Короткий опис для onboarding/каталогу.                                        |
| `order`                                | `number`   | Порядок сортування в каталогах каналів.                                       |
| `aliases`                              | `string[]` | Додаткові псевдоніми пошуку для вибору каналу.                                |
| `preferOver`                           | `string[]` | Ідентифікатори Plugin/каналів із нижчим пріоритетом, які цей канал має випереджати. |
| `systemImage`                          | `string`   | Необов’язкова назва іконки/system-image для UI-каталогів каналів.             |
| `selectionDocsPrefix`                  | `string`   | Текст префікса перед посиланнями на документацію в поверхнях вибору.          |
| `selectionDocsOmitLabel`               | `boolean`  | Показувати шлях документації напряму замість підписаного посилання на документацію в тексті вибору. |
| `selectionExtras`                      | `string[]` | Додаткові короткі рядки, додані до тексту вибору.                             |
| `markdownCapable`                      | `boolean`  | Позначає канал як здатний працювати з Markdown для рішень щодо вихідного форматування. |
| `exposure`                             | `object`   | Керування видимістю каналу для налаштування, списків налаштованого та поверхонь документації. |
| `quickstartAllowFrom`                  | `boolean`  | Додає цей канал до стандартного потоку налаштування швидкого старту `allowFrom`. |
| `forceAccountBinding`                  | `boolean`  | Вимагати явну прив’язку облікового запису, навіть коли існує лише один обліковий запис. |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Надавати перевагу пошуку сеансу під час визначення цілей оголошень для цього каналу. |

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

- `configured`: включати канал у поверхні списків налаштованого/стану
- `setup`: включати канал в інтерактивні засоби вибору налаштування/конфігурування
- `docs`: позначати канал як публічний у поверхнях документації/навігації

<Note>
`showConfigured` і `showInSetup` залишаються підтримуваними як застарілі псевдоніми. Надавайте перевагу `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` — це метадані пакета, а не метадані маніфесту.

| Поле                         | Тип                  | Що це означає                                                                     |
| ---------------------------- | -------------------- | --------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Канонічна npm-специфікація для потоків встановлення/оновлення.                    |
| `localPath`                  | `string`             | Локальний шлях розробки або шлях встановлення в комплекті.                        |
| `defaultChoice`              | `"npm"` \| `"local"` | Бажане джерело встановлення, коли доступні обидва.                                |
| `minHostVersion`             | `string`             | Мінімальна підтримувана версія OpenClaw у формі `>=x.y.z` або `>=x.y.z-prerelease`. |
| `expectedIntegrity`          | `string`             | Очікуваний рядок цілісності npm dist, зазвичай `sha512-...`, для закріплених встановлень. |
| `allowInvalidConfigRecovery` | `boolean`            | Дозволяє потокам перевстановлення Plugin у комплекті відновлюватися після конкретних збоїв через застарілу конфігурацію. |

<AccordionGroup>
  <Accordion title="Onboarding behavior">
    Інтерактивний onboarding також використовує `openclaw.install` для поверхонь встановлення на вимогу. Якщо ваш Plugin надає вибір автентифікації провайдера або метадані налаштування/каталогу каналу до завантаження runtime, onboarding може показати цей вибір, запропонувати npm або локальне встановлення, встановити чи ввімкнути Plugin, а потім продовжити вибраний потік. Варіанти npm для onboarding потребують довірених метаданих каталогу з реєстровим `npmSpec`; точні версії та `expectedIntegrity` є необов’язковими закріпленнями. Якщо `expectedIntegrity` присутній, потоки встановлення/оновлення забезпечують його дотримання. Зберігайте метадані "що показувати" в `openclaw.plugin.json`, а метадані "як це встановити" — у `package.json`.
  </Accordion>
  <Accordion title="minHostVersion enforcement">
    Якщо `minHostVersion` задано, і встановлення, і завантаження реєстру маніфестів для невбудованих Plugin забезпечують його дотримання. Старіші хости пропускають зовнішні Plugin; недійсні рядки версій відхиляються. Вбудовані вихідні Plugin вважаються версіонованими разом із checkout хоста.
  </Accordion>
  <Accordion title="Pinned npm installs">
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
  <Accordion title="allowInvalidConfigRecovery scope">
    `allowInvalidConfigRecovery` не є загальним обходом для зламаних конфігурацій. Він призначений лише для вузького відновлення Plugin у комплекті, щоб перевстановлення/налаштування могло виправити відомі залишки після оновлення, як-от відсутній шлях Plugin у комплекті або застарілий запис `channels.<id>` для того самого Plugin. Якщо конфігурація зламана з не пов’язаних причин, встановлення все одно безпечно завершується помилкою й повідомляє оператору запустити `openclaw doctor --fix`.
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
Вмикайте відкладене завантаження лише тоді, коли ваш `setupEntry` реєструє все, що потрібно Gateway до початку прослуховування (реєстрація каналу, HTTP-маршрути, методи gateway). Якщо повна точка входу володіє потрібними можливостями запуску, залиште поведінку за замовчуванням.
</Warning>

Якщо ваша точка входу setup/full реєструє gateway RPC-методи, тримайте їх на префіксі, специфічному для Plugin. Зарезервовані основні простори імен адміністратора (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) залишаються у власності core і завжди вирішуються до `operator.admin`.

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

Навіть Plugin без конфігурації мають постачати схему. Порожня схема є дійсною:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Див. [Маніфест Plugin](/uk/plugins/manifest) для повної довідки зі схеми.

## Публікація ClawHub

Для пакетів Plugin використовуйте специфічну для пакетів команду ClawHub:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
Застарілий псевдонім публікації лише для skills призначений для skills. Пакети Plugin мають завжди використовувати `clawhub package publish`.
</Note>

## Запис налаштування

Файл `setup-entry.ts` є легкою альтернативою `index.ts`, яку OpenClaw завантажує, коли потрібні лише поверхні налаштування (онбординг, відновлення конфігурації, перевірка вимкненого каналу).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Це уникає завантаження важкого коду runtime (криптографічних бібліотек, реєстрацій CLI, фонових сервісів) під час потоків налаштування.

Вбудовані канали робочої області, які тримають безпечні для налаштування експорти в супровідних модулях, можуть використовувати `defineBundledChannelSetupEntry(...)` з `openclaw/plugin-sdk/channel-entry-contract` замість `defineSetupPluginEntry(...)`. Цей вбудований контракт також підтримує необов’язковий експорт `runtime`, щоб runtime-зв’язування під час налаштування залишалося легким і явним.

<AccordionGroup>
  <Accordion title="Коли OpenClaw використовує setupEntry замість повного entry">
    - Канал вимкнено, але йому потрібні поверхні налаштування/онбордингу.
    - Канал увімкнено, але не налаштовано.
    - Увімкнено відкладене завантаження (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Що setupEntry має реєструвати">
    - Об’єкт Plugin каналу (через `defineSetupPluginEntry`).
    - Будь-які HTTP-маршрути, потрібні до запуску прослуховування Gateway.
    - Будь-які методи Gateway, потрібні під час запуску.

    Ці стартові методи Gateway все одно мають уникати зарезервованих core-просторів імен адміністрування, як-от `config.*` або `update.*`.

  </Accordion>
  <Accordion title="Чого setupEntry НЕ має містити">
    - Реєстрацій CLI.
    - Фонових сервісів.
    - Важких імпортів runtime (криптографія, SDK).
    - Методів Gateway, потрібних лише після запуску.

  </Accordion>
</AccordionGroup>

### Вузькі імпорти допоміжних засобів налаштування

Для гарячих шляхів лише налаштування віддавайте перевагу вузьким швам допоміжних засобів налаштування замість ширшої обгортки `plugin-sdk/setup`, коли вам потрібна лише частина поверхні налаштування:

| Шлях імпорту                       | Для чого використовувати                                                                  | Ключові експорти                                                                                                                                                                                                                                                                             |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | runtime-допоміжні засоби під час налаштування, які залишаються доступними в `setupEntry` / відкладеному запуску каналу | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | адаптери налаштування облікового запису з урахуванням середовища                          | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | допоміжні засоби CLI/архівів/документації для налаштування/встановлення                   | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

Використовуйте ширший шов `plugin-sdk/setup`, коли вам потрібен повний спільний інструментарій налаштування, зокрема допоміжні засоби патчів конфігурації, як-от `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Адаптери патчів налаштування залишаються безпечними для імпорту на гарячому шляху. Їхній пошук поверхні контракту вбудованого підвищення одного облікового запису є лінивим, тож імпорт `plugin-sdk/setup-runtime` не завантажує заздалегідь виявлення вбудованої поверхні контракту до фактичного використання адаптера.

### Підвищення одного облікового запису, що належить каналу

Коли канал переходить від конфігурації одного облікового запису верхнього рівня до `channels.<id>.accounts.*`, стандартна спільна поведінка переносить підвищені значення, прив’язані до облікового запису, в `accounts.default`.

Вбудовані канали можуть звузити або перевизначити це підвищення через свою поверхню контракту налаштування:

- `singleAccountKeysToMove`: додаткові ключі верхнього рівня, які слід перенести до підвищеного облікового запису
- `namedAccountPromotionKeys`: коли іменовані облікові записи вже існують, лише ці ключі переносяться до підвищеного облікового запису; спільні ключі політики/доставки залишаються в корені каналу
- `resolveSingleAccountPromotionTarget(...)`: вибирає, який наявний обліковий запис отримує підвищені значення

<Note>
Matrix є поточним вбудованим прикладом. Якщо вже існує рівно один іменований обліковий запис Matrix або якщо `defaultAccount` вказує на наявний неканонічний ключ, як-от `Ops`, підвищення зберігає цей обліковий запис замість створення нового запису `accounts.default`.
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

Для сторонніх plugins контракт холодного шляху все ще є маніфестом Plugin: віддзеркальте згенеровану JSON Schema в `openclaw.plugin.json#channelConfigs`, щоб схема конфігурації, налаштування й UI-поверхні могли перевіряти `channels.<id>` без завантаження runtime-коду.

## Майстри налаштування

Plugins каналів можуть надавати інтерактивні майстри налаштування для `openclaw onboard`. Майстер є об’єктом `ChannelSetupWizard` у `ChannelPlugin`:

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
    Для запитів списку дозволених DM, яким потрібен лише стандартний потік `note -> prompt -> parse -> merge -> patch`, віддавайте перевагу спільним допоміжним засобам налаштування з `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` і `createNestedChannelParsedAllowFromPrompt(...)`.
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

    `plugin-sdk/channel-setup` також надає нижчерівневі побудовники `createOptionalChannelSetupAdapter(...)` і `createOptionalChannelSetupWizard(...)`, коли вам потрібна лише одна половина цієї поверхні необов’язкового встановлення.

    Згенерований необов’язковий адаптер/майстер закрито відмовляє для реальних записів конфігурації. Вони повторно використовують одне повідомлення про необхідність встановлення в `validateInput`, `applyAccountConfig` і `finalize`, а також додають посилання на документацію, коли задано `docsPath`.

  </Accordion>
  <Accordion title="Допоміжні засоби налаштування на основі binary">
    Для UI налаштування на основі binary віддавайте перевагу спільним делегованим допоміжним засобам замість копіювання того самого зв’язування binary/статусу в кожен канал:

    - `createDetectedBinaryStatus(...)` для блоків статусу, що відрізняються лише мітками, підказками, оцінками та виявленням binary
    - `createCliPathTextInput(...)` для текстових полів на основі шляху
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` і `createDelegatedResolveConfigured(...)`, коли `setupEntry` потрібно ліниво переспрямовувати до важчого повного майстра
    - `createDelegatedTextInputShouldPrompt(...)`, коли `setupEntry` потрібно лише делегувати рішення `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Публікація та встановлення

**Зовнішні plugins:** опублікуйте в [ClawHub](/uk/tools/clawhub), потім встановіть:

<Tabs>
  <Tab title="Автоматично (ClawHub, потім npm)">
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
    Використовуйте npm, коли пакет ще не переміщено до ClawHub або коли вам потрібен
    прямий шлях встановлення npm під час міграції:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugins у репозиторії:** розміщуйте під деревом робочої області вбудованих plugins, і вони автоматично виявлятимуться під час збірки.

**Користувачі можуть встановити:**

```bash
openclaw plugins install <package-name>
```

<Info>
Для встановлень із npm `openclaw plugins install` встановлює пакет у `~/.openclaw/npm` з вимкненими lifecycle-скриптами. Тримайте дерева залежностей Plugin чистими JS/TS і уникайте пакетів, які потребують `postinstall`-збірок.
</Info>

<Note>
Запуск Gateway не встановлює залежності Plugin. Потоки встановлення npm/git/ClawHub відповідають за збіжність залежностей; локальні plugins уже мають мати встановлені свої залежності.
</Note>

Метадані вбудованого пакета задаються явно, а не виводяться зі зібраного JavaScript під час запуску Gateway. Runtime-залежності мають бути в пакеті Plugin, якому вони належать; запуск пакетованого OpenClaw ніколи не виправляє й не дзеркалить залежності Plugin.

## Пов’язане

- [Створення plugins](/uk/plugins/building-plugins) — покроковий посібник для початку роботи
- [Маніфест Plugin](/uk/plugins/manifest) — повна довідка зі схеми маніфесту
- [Точки входу SDK](/uk/plugins/sdk-entrypoints) — `definePluginEntry` та `defineChannelPluginEntry`
