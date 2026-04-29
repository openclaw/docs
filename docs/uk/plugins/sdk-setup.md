---
read_when:
    - Ви додаєте майстер налаштування для Plugin
    - Потрібно зрозуміти setup-entry.ts порівняно з index.ts
    - Ви визначаєте схеми конфігурації Plugin або метадані openclaw у package.json
sidebarTitle: Setup and config
summary: Майстри налаштування, setup-entry.ts, схеми конфігурації та метадані package.json
title: Налаштування та конфігурація Plugin
x-i18n:
    generated_at: "2026-04-29T22:27:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: ded93227e0db13311870a9f45f01c2a0892a7204262fab17d09fdecd7c71579a
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Довідник із пакування Plugin (метадані `package.json`), маніфестів (`openclaw.plugin.json`), записів налаштування та схем конфігурації.

<Tip>
**Шукаєте покроковий посібник?** Практичні посібники розглядають пакування в контексті: [Channel plugins](/uk/plugins/sdk-channel-plugins#step-1-package-and-manifest) і [Provider plugins](/uk/plugins/sdk-provider-plugins#step-1-package-and-manifest).
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
Якщо ви публікуєте Plugin зовні на ClawHub, ці поля `compat` і `build` є обовʼязковими. Канонічні фрагменти для публікації розташовані в `docs/snippets/plugin-publish/`.
</Note>

### Поля `openclaw`

<ParamField path="extensions" type="string[]">
  Файли точок входу (відносно кореня пакета).
</ParamField>
<ParamField path="setupEntry" type="string">
  Легка точка входу лише для налаштування (необовʼязково).
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
  Прапорці поведінки під час запуску.
</ParamField>

### `openclaw.channel`

`openclaw.channel` — це недорогі метадані пакета для виявлення каналів і поверхонь налаштування до завантаження середовища виконання.

| Поле                                   | Тип        | Що означає                                                                    |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | Канонічний ідентифікатор каналу.                                              |
| `label`                                | `string`   | Основна мітка каналу.                                                         |
| `selectionLabel`                       | `string`   | Мітка у виборі/налаштуванні, коли вона має відрізнятися від `label`.          |
| `detailLabel`                          | `string`   | Додаткова детальна мітка для розширених каталогів каналів і поверхонь стану.  |
| `docsPath`                             | `string`   | Шлях документації для посилань налаштування та вибору.                        |
| `docsLabel`                            | `string`   | Перевизначає мітку для посилань документації, коли вона має відрізнятися від ідентифікатора каналу. |
| `blurb`                                | `string`   | Короткий опис для онбордингу/каталогу.                                        |
| `order`                                | `number`   | Порядок сортування в каталогах каналів.                                       |
| `aliases`                              | `string[]` | Додаткові псевдоніми пошуку для вибору каналу.                                |
| `preferOver`                           | `string[]` | Ідентифікатори Plugin/каналів із нижчим пріоритетом, які цей канал має випереджати. |
| `systemImage`                          | `string`   | Необовʼязкова назва іконки/системного зображення для каталогів UI каналів.    |
| `selectionDocsPrefix`                  | `string`   | Текст-префікс перед посиланнями документації на поверхнях вибору.             |
| `selectionDocsOmitLabel`               | `boolean`  | Показувати шлях документації напряму замість підписаного посилання на документацію в тексті вибору. |
| `selectionExtras`                      | `string[]` | Додаткові короткі рядки, додані до тексту вибору.                             |
| `markdownCapable`                      | `boolean`  | Позначає канал як здатний працювати з markdown для рішень щодо вихідного форматування. |
| `exposure`                             | `object`   | Керування видимістю каналу для налаштування, налаштованих списків і поверхонь документації. |
| `quickstartAllowFrom`                  | `boolean`  | Увімкнути для цього каналу стандартний потік налаштування швидкого старту `allowFrom`. |
| `forceAccountBinding`                  | `boolean`  | Вимагати явної привʼязки облікового запису, навіть коли існує лише один обліковий запис. |
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

- `configured`: включати канал до поверхонь списків у стилі налаштованих/стану
- `setup`: включати канал до інтерактивних вибирачів налаштування/конфігурування
- `docs`: позначати канал як публічний для поверхонь документації/навігації

<Note>
`showConfigured` і `showInSetup` залишаються підтримуваними як застарілі псевдоніми. Надавайте перевагу `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` — це метадані пакета, а не метадані маніфесту.

| Поле                         | Тип                  | Що означає                                                                     |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Канонічна специфікація npm для потоків встановлення/оновлення.                  |
| `localPath`                  | `string`             | Локальний шлях розробки або шлях встановлення в комплекті.                      |
| `defaultChoice`              | `"npm"` \| `"local"` | Бажане джерело встановлення, коли доступні обидва.                              |
| `minHostVersion`             | `string`             | Мінімальна підтримувана версія OpenClaw у формі `>=x.y.z`.                      |
| `expectedIntegrity`          | `string`             | Очікуваний рядок цілісності npm dist, зазвичай `sha512-...`, для зафіксованих встановлень. |
| `allowInvalidConfigRecovery` | `boolean`            | Дозволяє потокам перевстановлення вбудованого Plugin відновлюватися після окремих помилок застарілої конфігурації. |

<AccordionGroup>
  <Accordion title="Onboarding behavior">
    Інтерактивний онбординг також використовує `openclaw.install` для поверхонь встановлення на вимогу. Якщо ваш Plugin надає варіанти автентифікації провайдера або метадані налаштування/каталогу каналу до завантаження середовища виконання, онбординг може показати цей вибір, запропонувати встановлення через npm або локально, встановити чи увімкнути Plugin, а потім продовжити вибраний потік. Варіанти онбордингу npm потребують довірених метаданих каталогу зі специфікацією реєстру `npmSpec`; точні версії та `expectedIntegrity` є необовʼязковими фіксаціями. Якщо `expectedIntegrity` присутній, потоки встановлення/оновлення застосовують його. Тримайте метадані «що показувати» в `openclaw.plugin.json`, а метадані «як це встановлювати» — у `package.json`.
  </Accordion>
  <Accordion title="minHostVersion enforcement">
    Якщо задано `minHostVersion`, і встановлення, і завантаження реєстру маніфестів застосовують його. Старіші хости пропускають Plugin; недійсні рядки версій відхиляються.
  </Accordion>
  <Accordion title="Pinned npm installs">
    Для зафіксованих встановлень npm тримайте точну версію в `npmSpec` і додайте очікувану цілісність артефакту:

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
    `allowInvalidConfigRecovery` не є загальним обходом для зламаних конфігурацій. Він призначений лише для вузького відновлення вбудованого Plugin, щоб перевстановлення/налаштування могло виправити відомі залишки після оновлення, як-от відсутній шлях вбудованого Plugin або застарілий запис `channels.<id>` для того самого Plugin. Якщо конфігурація зламана з неповʼязаних причин, встановлення все одно завершується закритою помилкою й повідомляє оператору запустити `openclaw doctor --fix`.
  </Accordion>
</AccordionGroup>

### Відкладене повне завантаження

Channel Plugin можуть увімкнути відкладене завантаження за допомогою:

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

Коли це ввімкнено, OpenClaw завантажує лише `setupEntry` під час фази запуску до початку прослуховування, навіть для вже налаштованих каналів. Повна точка входу завантажується після того, як Gateway починає прослуховувати.

<Warning>
Вмикайте відкладене завантаження лише тоді, коли ваш `setupEntry` реєструє все, що потрібно Gateway перед початком прослуховування (реєстрацію каналу, HTTP-маршрути, методи Gateway). Якщо повна точка входу володіє потрібними можливостями запуску, залиште поведінку за замовчуванням.
</Warning>

Якщо ваша точка входу налаштування/повна точка входу реєструє методи RPC Gateway, тримайте їх на префіксі, специфічному для Plugin. Зарезервовані простори імен адміністрування ядра (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) залишаються у власності ядра й завжди розвʼязуються в `operator.admin`.

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

Для Channel Plugin додайте `kind` і `channels`:

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
Застарілий псевдонім публікації лише для skill призначений для Skills. Пакети Plugin завжди мають використовувати `clawhub package publish`.
</Note>

## Точка входу налаштування

Файл `setup-entry.ts` — це легка альтернатива `index.ts`, яку OpenClaw завантажує, коли потрібні лише поверхні налаштування (онбординг, виправлення конфігурації, перевірка вимкненого каналу).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Це запобігає завантаженню важкого runtime-коду (криптографічних бібліотек, реєстрацій CLI, фонових сервісів) під час потоків налаштування.

Вбудовані канали робочого простору, які зберігають безпечні для налаштування експорти в допоміжних модулях, можуть використовувати `defineBundledChannelSetupEntry(...)` з `openclaw/plugin-sdk/channel-entry-contract` замість `defineSetupPluginEntry(...)`. Цей вбудований контракт також підтримує необов’язковий експорт `runtime`, щоб runtime-зв’язування під час налаштування залишалося легким і явним.

<AccordionGroup>
  <Accordion title="Коли OpenClaw використовує setupEntry замість повного entry">
    - Канал вимкнено, але йому потрібні поверхні налаштування/онбордингу.
    - Канал увімкнено, але не сконфігуровано.
    - Увімкнено відкладене завантаження (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Що setupEntry має реєструвати">
    - Об’єкт Plugin каналу (через `defineSetupPluginEntry`).
    - Будь-які HTTP-маршрути, потрібні до gateway listen.
    - Будь-які методи Gateway, потрібні під час запуску.

    Ці стартові методи Gateway усе одно мають уникати зарезервованих core admin просторів імен, як-от `config.*` або `update.*`.

  </Accordion>
  <Accordion title="Що setupEntry НЕ має містити">
    - Реєстрації CLI.
    - Фонові сервіси.
    - Важкі runtime-імпорти (криптографія, SDK).
    - Методи Gateway, потрібні лише після запуску.

  </Accordion>
</AccordionGroup>

### Вузькі імпорти помічників налаштування

Для гарячих шляхів лише налаштування віддавайте перевагу вузьким швам помічників налаштування над ширшим парасольковим `plugin-sdk/setup`, коли вам потрібна лише частина поверхні налаштування:

| Шлях імпорту                       | Для чого використовувати                                                                   | Ключові експорти                                                                                                                                                                                                                                                                             |
| ---------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | runtime-помічники часу налаштування, доступні в `setupEntry` / відкладеному запуску каналу | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | адаптери налаштування акаунта з урахуванням середовища                                     | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | помічники CLI/archive/docs для налаштування/інсталяції                                     | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

Використовуйте ширший шов `plugin-sdk/setup`, коли потрібен повний спільний набір інструментів налаштування, зокрема помічники config-patch на кшталт `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Адаптери патчів налаштування залишаються безпечними для гарячого шляху під час імпорту. Їхній вбудований пошук contract-surface для просування одного акаунта є лінивим, тому імпорт `plugin-sdk/setup-runtime` не завантажує завчасно виявлення вбудованої contract-surface до фактичного використання адаптера.

### Просування одного акаунта, кероване каналом

Коли канал оновлюється з конфігурації одного акаунта верхнього рівня до `channels.<id>.accounts.*`, стандартна спільна поведінка переміщує просунуті значення, прив’язані до акаунта, в `accounts.default`.

Вбудовані канали можуть звузити або перевизначити це просування через свою поверхню контракту налаштування:

- `singleAccountKeysToMove`: додаткові ключі верхнього рівня, які потрібно перемістити в просунутий акаунт
- `namedAccountPromotionKeys`: коли іменовані акаунти вже існують, лише ці ключі переміщуються в просунутий акаунт; спільні ключі політик/доставки залишаються в корені каналу
- `resolveSingleAccountPromotionTarget(...)`: вибрати, який наявний акаунт отримає просунуті значення

<Note>
Matrix — поточний вбудований приклад. Якщо вже існує рівно один іменований акаунт Matrix або якщо `defaultAccount` вказує на наявний неканонічний ключ, як-от `Ops`, просування зберігає цей акаунт замість створення нового запису `accounts.default`.
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

Ваш плагін отримує цю конфігурацію як `api.pluginConfig` під час реєстрації.

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

Використовуйте `buildChannelConfigSchema`, щоб перетворити схему Zod на обгортку `ChannelConfigSchema`, яку використовують артефакти конфігурації, що належать плагіну:

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

Для сторонніх плагінів контракт холодного шляху й надалі є маніфестом плагіна: віддзеркальте згенеровану JSON Schema в `openclaw.plugin.json#channelConfigs`, щоб схема конфігурації, налаштування та UI-поверхні могли інспектувати `channels.<id>` без завантаження runtime-коду.

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

Тип `ChannelSetupWizard` підтримує `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` тощо. Повні приклади дивіться у пакетах вбудованих плагінів (наприклад, Plugin Discord `src/channel.setup.ts`).

<AccordionGroup>
  <Accordion title="Спільні запити allowFrom">
    Для запитів DM allowlist, яким потрібен лише стандартний потік `note -> prompt -> parse -> merge -> patch`, віддавайте перевагу спільним помічникам налаштування з `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` і `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Стандартний статус налаштування каналу">
    Для блоків статусу налаштування каналу, які відрізняються лише мітками, оцінками та необов’язковими додатковими рядками, віддавайте перевагу `createStandardChannelSetupStatus(...)` з `openclaw/plugin-sdk/setup` замість ручного створення того самого об’єкта `status` у кожному плагіні.
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

    `plugin-sdk/channel-setup` також надає нижчорівневі конструктори `createOptionalChannelSetupAdapter(...)` і `createOptionalChannelSetupWizard(...)`, коли вам потрібна лише одна половина цієї поверхні необов’язкової інсталяції.

    Згенерований необов’язковий адаптер/майстер fail closed під час реальних записів конфігурації. Вони повторно використовують одне повідомлення про необхідність інсталяції в `validateInput`, `applyAccountConfig` і `finalize`, а також додають посилання на документацію, коли задано `docsPath`.

  </Accordion>
  <Accordion title="Помічники налаштування на основі бінарних файлів">
    Для UI налаштування на основі бінарних файлів віддавайте перевагу спільним делегованим помічникам замість копіювання однакового зв’язувального коду binary/status у кожен канал:

    - `createDetectedBinaryStatus(...)` для блоків статусу, які відрізняються лише мітками, підказками, оцінками та виявленням бінарного файлу
    - `createCliPathTextInput(...)` для текстових введень на основі шляхів
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` і `createDelegatedResolveConfigured(...)`, коли `setupEntry` має ліниво переспрямовувати до важчого повного майстра
    - `createDelegatedTextInputShouldPrompt(...)`, коли `setupEntry` має лише делегувати рішення `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Публікація та інсталяція

**Зовнішні плагіни:** опублікуйте в [ClawHub](/uk/tools/clawhub), потім інсталюйте:

<Tabs>
  <Tab title="Автоматично (спершу ClawHub, потім npm)">
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
    Використовуйте npm, коли пакет ще не переміщено до ClawHub або коли під час міграції потрібен
    прямий шлях інсталяції npm:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Плагіни в репозиторії:** розмістіть їх у дереві робочого простору вбудованих плагінів, і вони автоматично виявлятимуться під час збірки.

**Користувачі можуть інсталювати:**

```bash
openclaw plugins install <package-name>
```

<Info>
Для інсталяцій із джерела npm `openclaw plugins install` запускає локальний для проєкту `npm install --ignore-scripts` (без lifecycle-скриптів), ігноруючи успадковані глобальні налаштування npm install. Зберігайте дерева залежностей плагінів чистими JS/TS і уникайте пакетів, які потребують збірок `postinstall`.
</Info>

<Note>
Вбудовані плагіни, що належать OpenClaw, є єдиним винятком для виправлення під час запуску: коли пакетне встановлення виявляє, що один із них увімкнено через конфігурацію плагіна, застарілу конфігурацію каналу або його вбудований маніфест із типово ввімкненим станом, запуск встановлює відсутні runtime-залежності цього плагіна перед імпортом. Оператори можуть перевірити або виправити цей етап за допомогою `openclaw plugins deps`. Сторонні плагіни не повинні покладатися на встановлення під час запуску; продовжуйте використовувати явний інсталятор плагінів.
</Note>

Вбудовані runtime-залежності рівня пакета є явними метаданими, а не виводяться зі зібраного JavaScript під час запуску gateway. Якщо спільна коренева залежність OpenClaw має бути доступною всередині зовнішнього runtime-дзеркала вбудованого плагіна, оголосіть її в `openclaw.bundle.mirroredRootRuntimeDependencies` у кореневому маніфесті пакета.

## Пов’язане

- [Створення плагінів](/uk/plugins/building-plugins) — покроковий посібник для початку роботи
- [Маніфест Plugin](/uk/plugins/manifest) — повна довідка схеми маніфесту
- [Точки входу SDK](/uk/plugins/sdk-entrypoints) — `definePluginEntry` і `defineChannelPluginEntry`
