---
read_when:
    - Ви додаєте майстер налаштування до Plugin
    - Потрібно розуміти різницю між setup-entry.ts і index.ts
    - Ви визначаєте схеми конфігурації Plugin або метадані openclaw у package.json
sidebarTitle: Setup and config
summary: Майстри налаштування, setup-entry.ts, схеми конфігурації та метадані package.json
title: Налаштування та конфігурація Plugin
x-i18n:
    generated_at: "2026-04-29T05:39:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4785b95b4780341d373f119a2e08277e7ced9b92b7dd3c2b5dc0f49a64f659aa
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Довідник із пакування Plugin (метадані `package.json`), маніфестів (`openclaw.plugin.json`), записів налаштування та схем конфігурації.

<Tip>
**Шукаєте покроковий посібник?** Практичні посібники описують пакування в контексті: [Plugin каналів](/uk/plugins/sdk-channel-plugins#step-1-package-and-manifest) і [Plugin провайдерів](/uk/plugins/sdk-provider-plugins#step-1-package-and-manifest).
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
Якщо ви публікуєте Plugin зовні на ClawHub, ці поля `compat` і `build` є обов’язковими. Канонічні фрагменти для публікації розміщені в `docs/snippets/plugin-publish/`.
</Note>

### Поля `openclaw`

<ParamField path="extensions" type="string[]">
  Файли точок входу (відносно кореня пакета).
</ParamField>
<ParamField path="setupEntry" type="string">
  Легкий запис лише для налаштування (необов’язково).
</ParamField>
<ParamField path="channel" type="object">
  Метадані каталогу каналу для поверхонь налаштування, вибору, швидкого старту та стану.
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

`openclaw.channel` — це легкі метадані пакета для виявлення каналів і поверхонь налаштування до завантаження середовища виконання.

| Поле                                   | Тип        | Що це означає                                                                 |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | Канонічний ідентифікатор каналу.                                              |
| `label`                                | `string`   | Основна мітка каналу.                                                         |
| `selectionLabel`                       | `string`   | Мітка вибору/налаштування, коли вона має відрізнятися від `label`.            |
| `detailLabel`                          | `string`   | Вторинна детальна мітка для розширених каталогів каналів і поверхонь стану.   |
| `docsPath`                             | `string`   | Шлях документації для посилань налаштування та вибору.                        |
| `docsLabel`                            | `string`   | Перевизначення мітки для посилань документації, коли вона має відрізнятися від ідентифікатора каналу. |
| `blurb`                                | `string`   | Короткий опис для онбордингу/каталогу.                                        |
| `order`                                | `number`   | Порядок сортування в каталогах каналів.                                       |
| `aliases`                              | `string[]` | Додаткові псевдоніми пошуку для вибору каналу.                                |
| `preferOver`                           | `string[]` | Ідентифікатори Plugin/каналів із нижчим пріоритетом, які цей канал має випереджати. |
| `systemImage`                          | `string`   | Необов’язкова назва піктограми/system-image для UI-каталогів каналів.         |
| `selectionDocsPrefix`                  | `string`   | Текст префікса перед посиланнями документації на поверхнях вибору.            |
| `selectionDocsOmitLabel`               | `boolean`  | Показувати шлях документації напряму замість посилання документації з міткою в тексті вибору. |
| `selectionExtras`                      | `string[]` | Додаткові короткі рядки, додані до тексту вибору.                             |
| `markdownCapable`                      | `boolean`  | Позначає канал як здатний працювати з Markdown для рішень щодо вихідного форматування. |
| `exposure`                             | `object`   | Елементи керування видимістю каналу для налаштування, списків сконфігурованих елементів і поверхонь документації. |
| `quickstartAllowFrom`                  | `boolean`  | Включає цей канал у стандартний потік налаштування швидкого старту `allowFrom`. |
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

- `configured`: включати канал у поверхні списків налаштованих елементів/стану
- `setup`: включати канал в інтерактивні засоби вибору налаштування/конфігурації
- `docs`: позначати канал як публічно видимий у поверхнях документації/навігації

<Note>
`showConfigured` і `showInSetup` залишаються підтримуваними як застарілі псевдоніми. Надавайте перевагу `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` — це метадані пакета, а не метадані маніфесту.

| Поле                         | Тип                  | Що це означає                                                                  |
| ---------------------------- | -------------------- | ------------------------------------------------------------------------------ |
| `npmSpec`                    | `string`             | Канонічна npm-специфікація для потоків встановлення/оновлення.                 |
| `localPath`                  | `string`             | Локальний шлях розробки або вбудованого встановлення.                          |
| `defaultChoice`              | `"npm"` \| `"local"` | Бажане джерело встановлення, коли доступні обидва.                             |
| `minHostVersion`             | `string`             | Мінімальна підтримувана версія OpenClaw у формі `>=x.y.z`.                     |
| `expectedIntegrity`          | `string`             | Очікуваний рядок цілісності npm dist, зазвичай `sha512-...`, для закріплених встановлень. |
| `allowInvalidConfigRecovery` | `boolean`            | Дозволяє потокам перевстановлення вбудованих Plugin відновлюватися після конкретних збоїв застарілої конфігурації. |

<AccordionGroup>
  <Accordion title="Onboarding behavior">
    Інтерактивний онбординг також використовує `openclaw.install` для поверхонь встановлення на вимогу. Якщо ваш Plugin надає варіанти автентифікації провайдера або метадані налаштування/каталогу каналу до завантаження середовища виконання, онбординг може показати цей варіант, запросити вибір між npm і локальним встановленням, встановити або ввімкнути Plugin, а потім продовжити вибраний потік. Варіанти онбордингу через npm потребують довірених метаданих каталогу з реєстровим `npmSpec`; точні версії та `expectedIntegrity` є необов’язковими закріпленнями. Якщо `expectedIntegrity` присутній, потоки встановлення/оновлення застосовують його. Зберігайте метадані «що показувати» в `openclaw.plugin.json`, а метадані «як це встановити» — у `package.json`.
  </Accordion>
  <Accordion title="minHostVersion enforcement">
    Якщо `minHostVersion` задано, його застосовують і встановлення, і завантаження реєстру маніфестів. Старіші хости пропускають Plugin; недійсні рядки версій відхиляються.
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
    `allowInvalidConfigRecovery` не є загальним обходом для зламаних конфігурацій. Він призначений лише для вузького відновлення вбудованих Plugin, щоб перевстановлення/налаштування могло виправити відомі залишки після оновлення, як-от відсутній шлях вбудованого Plugin або застарілий запис `channels.<id>` для того самого Plugin. Якщо конфігурація зламана з непов’язаних причин, встановлення все одно завершується закритою помилкою й повідомляє оператору запустити `openclaw doctor --fix`.
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

Коли це ввімкнено, OpenClaw завантажує лише `setupEntry` під час передслухальної фази запуску, навіть для вже налаштованих каналів. Повний запис завантажується після того, як Gateway починає слухати.

<Warning>
Вмикайте відкладене завантаження лише тоді, коли ваш `setupEntry` реєструє все, що потрібно Gateway перед початком прослуховування (реєстрацію каналу, HTTP-маршрути, методи Gateway). Якщо повний запис володіє потрібними можливостями запуску, залиште стандартну поведінку.
</Warning>

Якщо ваш запис налаштування/повний запис реєструє RPC-методи Gateway, тримайте їх на префіксі, специфічному для Plugin. Зарезервовані простори імен адміністрування ядра (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) залишаються у власності ядра й завжди розв’язуються в `operator.admin`.

## Маніфест Plugin

Кожен нативний Plugin має постачати `openclaw.plugin.json` у корені пакета. OpenClaw використовує це для перевірки конфігурації без виконання коду Plugin.

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

Див. [Маніфест Plugin](/uk/plugins/manifest) для повного довідника схеми.

## Публікація в ClawHub

Для пакетів Plugin використовуйте специфічну для пакета команду ClawHub:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
Застарілий псевдонім публікації лише для Skills призначений для skills. Пакети Plugin завжди мають використовувати `clawhub package publish`.
</Note>

## Запис налаштування

Файл `setup-entry.ts` — це легка альтернатива `index.ts`, яку OpenClaw завантажує, коли йому потрібні лише поверхні налаштування (онбординг, виправлення конфігурації, перевірка вимкненого каналу).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Це запобігає завантаженню важкого runtime-коду (криптобібліотек, реєстрацій CLI, фонових служб) під час потоків налаштування.

Вбудовані канали робочого простору, які тримають безпечні для налаштування експорти в допоміжних модулях, можуть використовувати `defineBundledChannelSetupEntry(...)` з `openclaw/plugin-sdk/channel-entry-contract` замість `defineSetupPluginEntry(...)`. Цей вбудований контракт також підтримує необов’язковий експорт `runtime`, щоб runtime-підключення під час налаштування залишалося легким і явним.

<AccordionGroup>
  <Accordion title="Коли OpenClaw використовує setupEntry замість повного entry">
    - Канал вимкнено, але йому потрібні поверхні налаштування/онбордингу.
    - Канал увімкнено, але не налаштовано.
    - Увімкнено відкладене завантаження (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Що має реєструвати setupEntry">
    - Об’єкт Plugin каналу (через `defineSetupPluginEntry`).
    - Будь-які HTTP-маршрути, потрібні до прослуховування gateway.
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

Для гарячих шляхів лише налаштування віддавайте перевагу вузьким seams помічників налаштування, а не ширшій парасольці `plugin-sdk/setup`, коли вам потрібна лише частина поверхні налаштування:

| Шлях імпорту                      | Для чого використовувати                                                                   | Ключові експорти                                                                                                                                                                                                                                                                              |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | runtime-помічники часу налаштування, що залишаються доступними в `setupEntry` / відкладеному запуску каналу | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | адаптери налаштування акаунтів з урахуванням середовища                                    | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | помічники CLI/архівів/документації для налаштування/встановлення                           | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

Використовуйте ширший seam `plugin-sdk/setup`, коли потрібен повний спільний набір інструментів налаштування, зокрема помічники config-patch, такі як `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Адаптери патчів налаштування залишаються безпечними для гарячого шляху під час імпорту. Їхній вбудований lookup поверхні контракту просування одного акаунта є лінивим, тому імпорт `plugin-sdk/setup-runtime` не завантажує завчасно виявлення вбудованої поверхні контракту до фактичного використання адаптера.

### Просування одного акаунта, яким володіє канал

Коли канал оновлюється з top-level конфігурації одного акаунта до `channels.<id>.accounts.*`, стандартна спільна поведінка переміщує просунуті значення області акаунта в `accounts.default`.

Вбудовані канали можуть звузити або перевизначити це просування через свою поверхню контракту налаштування:

- `singleAccountKeysToMove`: додаткові top-level ключі, які мають перейти в просунутий акаунт
- `namedAccountPromotionKeys`: коли іменовані акаунти вже існують, лише ці ключі переходять у просунутий акаунт; спільні ключі політики/доставки залишаються в корені каналу
- `resolveSingleAccountPromotionTarget(...)`: вибирає, який наявний акаунт отримає просунуті значення

<Note>
Matrix є поточним вбудованим прикладом. Якщо вже існує рівно один іменований акаунт Matrix, або якщо `defaultAccount` вказує на наявний неканонічний ключ, такий як `Ops`, просування зберігає цей акаунт замість створення нового запису `accounts.default`.
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

Для сторонніх plugins cold-path контрактом усе ще є маніфест Plugin: віддзеркальте згенеровану JSON Schema в `openclaw.plugin.json#channelConfigs`, щоб схема конфігурації, налаштування й UI-поверхні могли інспектувати `channels.<id>` без завантаження runtime-коду.

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

Тип `ChannelSetupWizard` підтримує `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` та інше. Повні приклади дивіться у пакетах вбудованих plugins (наприклад, Plugin Discord `src/channel.setup.ts`).

<AccordionGroup>
  <Accordion title="Спільні підказки allowFrom">
    Для підказок allowlist у DM, яким потрібен лише стандартний потік `note -> prompt -> parse -> merge -> patch`, віддавайте перевагу спільним помічникам налаштування з `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` і `createNestedChannelParsedAllowFromPrompt(...)`.
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

    Згенерований необов’язковий adapter/wizard fail closed під час реальних записів конфігурації. Вони повторно використовують одне повідомлення про необхідне встановлення в `validateInput`, `applyAccountConfig` і `finalize`, а також додають посилання на документацію, коли встановлено `docsPath`.

  </Accordion>
  <Accordion title="Помічники налаштування на основі binary">
    Для UI налаштування на основі binary віддавайте перевагу спільним делегованим помічникам замість копіювання того самого glue для binary/status у кожен канал:

    - `createDetectedBinaryStatus(...)` для блоків статусу, які відрізняються лише мітками, підказками, оцінками та виявленням binary
    - `createCliPathTextInput(...)` для текстових input, що спираються на шлях
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` і `createDelegatedResolveConfigured(...)`, коли `setupEntry` має ліниво передавати керування важчому повному майстру
    - `createDelegatedTextInputShouldPrompt(...)`, коли `setupEntry` має лише делегувати рішення `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Публікація та встановлення

**Зовнішні plugins:** опублікуйте в [ClawHub](/uk/tools/clawhub), потім встановіть:

<Tabs>
  <Tab title="Авто (ClawHub, потім npm)">
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
    Використовуйте npm, коли пакет ще не переміщено до ClawHub, або коли під час міграції вам потрібен
    прямий шлях встановлення npm:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugins у репозиторії:** розмістіть їх у дереві робочого простору вбудованих plugins, і вони будуть автоматично виявлені під час збірки.

**Користувачі можуть установити:**

```bash
openclaw plugins install <package-name>
```

<Info>
Для встановлень із джерелом npm `openclaw plugins install` запускає локальний для проєкту `npm install --ignore-scripts` (без lifecycle-скриптів), ігноруючи успадковані глобальні налаштування встановлення npm. Тримайте дерева залежностей Plugin чистими JS/TS і уникайте пакетів, яким потрібні `postinstall` збірки.
</Info>

<Note>
Вбудовані плагіни, що належать OpenClaw, є єдиним винятком для відновлення під час запуску: коли пакетне встановлення бачить такий плагін увімкненим через конфігурацію плагіна, застарілу конфігурацію каналу або його вбудований маніфест із типово ввімкненим станом, запуск встановлює відсутні runtime-залежності цього плагіна перед імпортом. Сторонні плагіни не повинні покладатися на встановлення під час запуску; продовжуйте використовувати явний інсталятор плагінів.
</Note>

## Пов’язане

- [Створення плагінів](/uk/plugins/building-plugins) — покроковий посібник із початку роботи
- [Маніфест Plugin](/uk/plugins/manifest) — повний довідник схеми маніфесту
- [Точки входу SDK](/uk/plugins/sdk-entrypoints) — `definePluginEntry` і `defineChannelPluginEntry`
