---
read_when:
    - Ви додаєте майстер налаштування до Plugin
    - Потрібно зрозуміти setup-entry.ts порівняно з index.ts
    - Ви визначаєте схеми конфігурації плагіна або метадані openclaw у package.json
sidebarTitle: Setup and config
summary: Майстри налаштування, setup-entry.ts, схеми конфігурації та метадані package.json
title: Налаштування та конфігурація Plugin
x-i18n:
    generated_at: "2026-05-02T14:31:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9474dbbbc984e19019f7d14c7d63d944c544868407f7908df282bc7c080dc0c2
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Довідник із пакування плагінів (метадані `package.json`), маніфестів (`openclaw.plugin.json`), записів налаштування та схем конфігурації.

<Tip>
**Шукаєте покроковий посібник?** Практичні посібники охоплюють пакування в контексті: [Плагіни каналів](/uk/plugins/sdk-channel-plugins#step-1-package-and-manifest) і [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Метадані пакета

Ваш `package.json` потребує поля `openclaw`, яке повідомляє системі плагінів, що надає ваш плагін:

<Tabs>
  <Tab title="Плагін каналу">
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
  <Tab title="Плагін провайдера / базовий шаблон ClawHub">
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
Якщо ви публікуєте плагін зовнішньо в ClawHub, ці поля `compat` і `build` є обов’язковими. Канонічні фрагменти для публікації розміщені в `docs/snippets/plugin-publish/`.
</Note>

### Поля `openclaw`

<ParamField path="extensions" type="string[]">
  Файли точок входу (відносно кореня пакета).
</ParamField>
<ParamField path="setupEntry" type="string">
  Легка точка входу лише для налаштування (необов’язково).
</ParamField>
<ParamField path="channel" type="object">
  Метадані каталогу каналів для поверхонь налаштування, вибору, швидкого старту та статусу.
</ParamField>
<ParamField path="providers" type="string[]">
  Ідентифікатори провайдерів, які реєструє цей плагін.
</ParamField>
<ParamField path="install" type="object">
  Підказки встановлення: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  Прапорці поведінки запуску.
</ParamField>

### `openclaw.channel`

`openclaw.channel` — це легкі метадані пакета для виявлення каналів і поверхонь налаштування до завантаження середовища виконання.

| Поле                                   | Тип        | Що означає                                                                    |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | Канонічний ідентифікатор каналу.                                              |
| `label`                                | `string`   | Основна мітка каналу.                                                         |
| `selectionLabel`                       | `string`   | Мітка вибору/налаштування, коли вона має відрізнятися від `label`.            |
| `detailLabel`                          | `string`   | Вторинна докладна мітка для розширених каталогів каналів і поверхонь статусу. |
| `docsPath`                             | `string`   | Шлях документації для посилань налаштування й вибору.                         |
| `docsLabel`                            | `string`   | Перевизначена мітка для посилань документації, коли вона має відрізнятися від ідентифікатора каналу. |
| `blurb`                                | `string`   | Короткий опис для первинного налаштування/каталогу.                           |
| `order`                                | `number`   | Порядок сортування в каталогах каналів.                                       |
| `aliases`                              | `string[]` | Додаткові псевдоніми пошуку для вибору каналу.                                |
| `preferOver`                           | `string[]` | Ідентифікатори плагінів/каналів нижчого пріоритету, які цей канал має випереджати. |
| `systemImage`                          | `string`   | Необов’язкова назва іконки/system-image для UI-каталогів каналу.              |
| `selectionDocsPrefix`                  | `string`   | Текст префікса перед посиланнями документації в поверхнях вибору.             |
| `selectionDocsOmitLabel`               | `boolean`  | Показувати шлях документації напряму замість підписаного посилання документації в тексті вибору. |
| `selectionExtras`                      | `string[]` | Додаткові короткі рядки, що додаються до тексту вибору.                       |
| `markdownCapable`                      | `boolean`  | Позначає канал як здатний працювати з Markdown для рішень щодо вихідного форматування. |
| `exposure`                             | `object`   | Параметри видимості каналу для налаштування, списків налаштованого та поверхонь документації. |
| `quickstartAllowFrom`                  | `boolean`  | Додає цей канал до стандартного процесу налаштування швидкого старту `allowFrom`. |
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

- `configured`: включати канал у налаштовані/статусні поверхні списків
- `setup`: включати канал в інтерактивні селектори налаштування/конфігурування
- `docs`: позначати канал як публічний у поверхнях документації/навігації

<Note>
`showConfigured` і `showInSetup` залишаються підтримуваними як застарілі псевдоніми. Надавайте перевагу `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` — це метадані пакета, а не метадані маніфесту.

| Поле                         | Тип                                 | Що означає                                                                        |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Канонічна специфікація ClawHub для процесів встановлення/оновлення та встановлення на вимогу під час первинного налаштування. |
| `npmSpec`                    | `string`                            | Канонічна специфікація npm для резервних процесів встановлення/оновлення.         |
| `localPath`                  | `string`                            | Шлях локальної розробки або вбудованого встановлення.                             |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Бажане джерело встановлення, коли доступно кілька джерел.                         |
| `minHostVersion`             | `string`                            | Мінімальна підтримувана версія OpenClaw у форматі `>=x.y.z` або `>=x.y.z-prerelease`. |
| `expectedIntegrity`          | `string`                            | Очікуваний рядок цілісності npm-дистрибутива, зазвичай `sha512-...`, для закріплених встановлень. |
| `allowInvalidConfigRecovery` | `boolean`                           | Дає змогу процесам перевстановлення вбудованого плагіна відновлюватися після конкретних збоїв через застарілу конфігурацію. |

<AccordionGroup>
  <Accordion title="Поведінка первинного налаштування">
    Інтерактивне первинне налаштування також використовує `openclaw.install` для поверхонь встановлення на вимогу. Якщо ваш плагін надає варіанти автентифікації провайдера або метадані налаштування/каталогу каналу до завантаження середовища виконання, первинне налаштування може показати цей вибір, запропонувати встановлення з ClawHub, npm або локального джерела, встановити чи ввімкнути плагін, а потім продовжити вибраний процес. Варіанти ClawHub для первинного налаштування використовують `clawhubSpec` і мають перевагу, коли вони наявні; варіанти npm потребують довірених метаданих каталогу з реєстровим `npmSpec`; точні версії та `expectedIntegrity` є необов’язковими npm-закріпленнями. Якщо `expectedIntegrity` наявний, процеси встановлення/оновлення застосовують його для npm. Зберігайте метадані «що показувати» в `openclaw.plugin.json`, а метадані «як це встановити» — у `package.json`.
  </Accordion>
  <Accordion title="Застосування minHostVersion">
    Якщо `minHostVersion` задано, і встановлення, і завантаження невбудованого реєстру маніфестів застосовують це обмеження. Старіші хости пропускають зовнішні плагіни; недійсні рядки версій відхиляються. Вважається, що вбудовані вихідні плагіни мають ту саму версію, що й робоча копія хоста.
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
    `allowInvalidConfigRecovery` не є загальним обходом для зламаних конфігурацій. Він призначений лише для вузького відновлення вбудованих плагінів, щоб перевстановлення/налаштування могло виправляти відомі залишки після оновлення, як-от відсутній шлях вбудованого плагіна або застарілий запис `channels.<id>` для того самого плагіна. Якщо конфігурація зламана з непов’язаних причин, встановлення все одно завершується відмовою й повідомляє оператору запустити `openclaw doctor --fix`.
  </Accordion>
</AccordionGroup>

### Відкладене повне завантаження

Плагіни каналів можуть увімкнути відкладене завантаження так:

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

Коли це ввімкнено, OpenClaw завантажує лише `setupEntry` під час фази запуску перед прослуховуванням, навіть для вже налаштованих каналів. Повна точка входу завантажується після того, як Gateway починає прослуховування.

<Warning>
Вмикайте відкладене завантаження лише тоді, коли ваш `setupEntry` реєструє все, що потрібно Gateway до початку прослуховування (реєстрація каналу, HTTP-маршрути, методи Gateway). Якщо повна точка входу володіє потрібними можливостями запуску, залиште стандартну поведінку.
</Warning>

Якщо ваша точка входу setup/full реєструє RPC-методи Gateway, тримайте їх на префіксі, специфічному для плагіна. Зарезервовані простори імен адміністрування ядра (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) залишаються у власності ядра й завжди розв’язуються до `operator.admin`.

## Маніфест Plugin

Кожен нативний плагін має містити `openclaw.plugin.json` у корені пакета. OpenClaw використовує його для перевірки конфігурації без виконання коду плагіна.

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

Для плагінів каналів додайте `kind` і `channels`:

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

Навіть плагіни без конфігурації мають містити схему. Порожня схема є дійсною:

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

Для пакетів плагінів використовуйте специфічну для пакета команду ClawHub:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
Застарілий псевдонім публікації лише для skills призначений для skills. Пакети Plugin мають завжди використовувати `clawhub package publish`.
</Note>

## Запис налаштування

Файл `setup-entry.ts` — це легка альтернатива `index.ts`, яку OpenClaw завантажує, коли йому потрібні лише поверхні налаштування (первинне налаштування, відновлення конфігурації, інспекція вимкненого каналу).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Це дає змогу не завантажувати важкий код виконання (криптографічні бібліотеки, реєстрації CLI, фонові служби) під час потоків налаштування.

Вбудовані канали робочої області, які тримають безпечні для налаштування експорти в допоміжних модулях, можуть використовувати `defineBundledChannelSetupEntry(...)` з `openclaw/plugin-sdk/channel-entry-contract` замість `defineSetupPluginEntry(...)`. Цей вбудований контракт також підтримує необов’язковий експорт `runtime`, щоб зв’язування середовища виконання під час налаштування залишалося легким і явним.

<AccordionGroup>
  <Accordion title="Коли OpenClaw використовує setupEntry замість повного запису">
    - Канал вимкнено, але йому потрібні поверхні налаштування/первинного налаштування.
    - Канал увімкнено, але не налаштовано.
    - Увімкнено відкладене завантаження (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Що має зареєструвати setupEntry">
    - Об’єкт Plugin каналу (через `defineSetupPluginEntry`).
    - Будь-які HTTP-маршрути, потрібні до прослуховування gateway.
    - Будь-які методи gateway, потрібні під час запуску.

    Ці методи gateway запуску все одно мають уникати зарезервованих просторів імен адміністрування ядра, як-от `config.*` або `update.*`.

  </Accordion>
  <Accordion title="Що setupEntry НЕ має містити">
    - Реєстрації CLI.
    - Фонові служби.
    - Важкі імпорти середовища виконання (crypto, SDK).
    - Методи Gateway, потрібні лише після запуску.

  </Accordion>
</AccordionGroup>

### Вузькі імпорти помічників налаштування

Для гарячих шляхів лише налаштування надавайте перевагу вузьким швам помічників налаштування замість ширшого парасолькового `plugin-sdk/setup`, коли вам потрібна лише частина поверхні налаштування:

| Шлях імпорту                       | Для чого використовувати                                                                 | Ключові експорти                                                                                                                                                                                                                                                                             |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | помічники середовища виконання під час налаштування, що залишаються доступними в `setupEntry` / відкладеному запуску каналу | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | адаптери налаштування облікового запису з урахуванням середовища                          | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | помічники CLI/archive/docs для налаштування/встановлення                                  | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

Використовуйте ширший шов `plugin-sdk/setup`, коли вам потрібен повний спільний набір інструментів налаштування, зокрема помічники виправлення конфігурації, як-от `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Адаптери виправлень налаштування безпечні для гарячого шляху під час імпорту. Їхній вбудований пошук поверхні контракту просування одного облікового запису є ледачим, тому імпорт `plugin-sdk/setup-runtime` не завантажує завчасно виявлення вбудованої поверхні контракту до фактичного використання адаптера.

### Просування одного облікового запису, яким володіє канал

Коли канал переходить від конфігурації верхнього рівня для одного облікового запису до `channels.<id>.accounts.*`, стандартна спільна поведінка переносить просунуті значення області облікового запису в `accounts.default`.

Вбудовані канали можуть звузити або перевизначити це просування через свою поверхню контракту налаштування:

- `singleAccountKeysToMove`: додаткові ключі верхнього рівня, які мають перейти до просунутого облікового запису
- `namedAccountPromotionKeys`: коли іменовані облікові записи вже існують, лише ці ключі переходять до просунутого облікового запису; спільні ключі політики/доставки залишаються в корені каналу
- `resolveSingleAccountPromotionTarget(...)`: вибрати, який наявний обліковий запис отримає просунуті значення

<Note>
Matrix є поточним вбудованим прикладом. Якщо вже існує рівно один іменований обліковий запис Matrix або якщо `defaultAccount` вказує на наявний неканонічний ключ, як-от `Ops`, просування зберігає цей обліковий запис замість створення нового запису `accounts.default`.
</Note>

## Схема конфігурації

Конфігурація Plugin перевіряється за JSON Schema у вашому manifest. Користувачі налаштовують plugins через:

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

Для сторонніх plugins контракт холодного шляху все ще є manifest Plugin: віддзеркальте згенеровану JSON Schema в `openclaw.plugin.json#channelConfigs`, щоб схема конфігурації, налаштування та поверхні UI могли інспектувати `channels.<id>` без завантаження коду виконання.

## Майстри налаштування

Plugins каналів можуть надавати інтерактивні майстри налаштування для `openclaw onboard`. Майстер — це об’єкт `ChannelSetupWizard` на `ChannelPlugin`:

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

Тип `ChannelSetupWizard` підтримує `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` та інше. Повні приклади дивіться у вбудованих пакетах plugins (наприклад, Plugin Discord `src/channel.setup.ts`).

<AccordionGroup>
  <Accordion title="Спільні prompts allowFrom">
    Для prompts списку дозволених DM, яким потрібен лише стандартний потік `note -> prompt -> parse -> merge -> patch`, надавайте перевагу спільним помічникам налаштування з `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` і `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Стандартний статус налаштування каналу">
    Для блоків статусу налаштування каналу, які відрізняються лише мітками, оцінками та необов’язковими додатковими рядками, надавайте перевагу `createStandardChannelSetupStatus(...)` з `openclaw/plugin-sdk/setup` замість ручного створення того самого об’єкта `status` у кожному Plugin.
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

    `plugin-sdk/channel-setup` також надає нижчорівневі конструктори `createOptionalChannelSetupAdapter(...)` і `createOptionalChannelSetupWizard(...)`, коли вам потрібна лише одна половина цієї необов’язкової поверхні встановлення.

    Згенерований необов’язковий адаптер/майстер закривається з відмовою для реальних записів конфігурації. Вони повторно використовують одне повідомлення про потрібне встановлення в `validateInput`, `applyAccountConfig` і `finalize`, а також додають посилання на docs, коли задано `docsPath`.

  </Accordion>
  <Accordion title="Помічники налаштування на основі binary">
    Для UI налаштування на основі binary надавайте перевагу спільним делегованим помічникам замість копіювання того самого зв’язувального коду binary/status у кожен канал:

    - `createDetectedBinaryStatus(...)` для блоків статусу, які відрізняються лише мітками, підказками, оцінками та виявленням binary
    - `createCliPathTextInput(...)` для текстових введень на основі шляху
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` і `createDelegatedResolveConfigured(...)`, коли `setupEntry` має ледаче переспрямувати до важчого повного майстра
    - `createDelegatedTextInputShouldPrompt(...)`, коли `setupEntry` має лише делегувати рішення `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Публікація та встановлення

**Зовнішні plugins:** опублікуйте в [ClawHub](/uk/tools/clawhub), потім встановіть:

<Tabs>
  <Tab title="Автоматично (спочатку ClawHub, потім npm)">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    OpenClaw спочатку пробує ClawHub і автоматично повертається до npm.

  </Tab>
  <Tab title="Лише ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="Специфікація пакета npm">
    Використовуйте npm, коли пакет ще не переміщено до ClawHub або коли під час міграції потрібен
    прямий шлях встановлення npm:

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
Для інсталяцій із джерелом npm `openclaw plugins install` встановлює пакет у `~/.openclaw/npm` з вимкненими сценаріями життєвого циклу. Тримайте дерева залежностей Plugin суто JS/TS і уникайте пакетів, які потребують збірок `postinstall`.
</Info>

<Note>
Запуск Gateway не встановлює залежності Plugin. Потоки встановлення npm/git/ClawHub відповідають за узгодження залежностей; локальні plugins уже повинні мати встановлені залежності.
</Note>

Метадані вбудованого пакета є явними, а не виводяться зі зібраного JavaScript під час запуску Gateway. Runtime-залежності мають бути в пакеті Plugin, якому вони належать; запуск упакованого OpenClaw ніколи не відновлює й не дзеркалить залежності Plugin.

## Пов’язане

- [Створення plugins](/uk/plugins/building-plugins) — покроковий посібник для початку роботи
- [Маніфест Plugin](/uk/plugins/manifest) — повний довідник схеми маніфесту
- [Точки входу SDK](/uk/plugins/sdk-entrypoints) — `definePluginEntry` і `defineChannelPluginEntry`
