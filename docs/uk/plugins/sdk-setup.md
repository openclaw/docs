---
read_when:
    - Ви додаєте майстер налаштування до Plugin
    - Потрібно зрозуміти відмінності між setup-entry.ts і index.ts
    - Ви визначаєте схеми конфігурації Plugin або метадані openclaw у package.json
sidebarTitle: Setup and config
summary: Майстри налаштування, setup-entry.ts, схеми конфігурації та метадані package.json
title: Налаштування та конфігурація Plugin
x-i18n:
    generated_at: "2026-05-01T20:40:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: d61cbbeb3e9e303d098fcddf4ba101ff6717c232d5db4b36c28008c84bd32be8
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Довідник із пакування плагінів (метадані `package.json`), маніфестів (`openclaw.plugin.json`), записів налаштування та схем конфігурації.

<Tip>
**Шукаєте покроковий посібник?** Практичні посібники охоплюють пакування в контексті: [плагіни каналів](/uk/plugins/sdk-channel-plugins#step-1-package-and-manifest) і [плагіни провайдерів](/uk/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Метадані пакета

Ваш `package.json` потребує поля `openclaw`, яке повідомляє системі плагінів, що надає ваш плагін:

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
Якщо ви публікуєте плагін зовнішньо в ClawHub, ці поля `compat` і `build` обов’язкові. Канонічні фрагменти публікації розташовані в `docs/snippets/plugin-publish/`.
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
  Ідентифікатори провайдерів, зареєстровані цим плагіном.
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
| `detailLabel`                          | `string`   | Вторинна детальна мітка для розширених каталогів каналів і поверхонь статусу. |
| `docsPath`                             | `string`   | Шлях до документації для посилань налаштування та вибору.                     |
| `docsLabel`                            | `string`   | Перевизначення мітки для посилань на документацію, коли вона має відрізнятися від ідентифікатора каналу. |
| `blurb`                                | `string`   | Короткий опис для онбордингу/каталогу.                                        |
| `order`                                | `number`   | Порядок сортування в каталогах каналів.                                       |
| `aliases`                              | `string[]` | Додаткові псевдоніми пошуку для вибору каналу.                                |
| `preferOver`                           | `string[]` | Ідентифікатори плагінів/каналів із нижчим пріоритетом, які цей канал має випереджати. |
| `systemImage`                          | `string`   | Необов’язкова назва піктограми/системного зображення для UI-каталогів каналів. |
| `selectionDocsPrefix`                  | `string`   | Текст-префікс перед посиланнями на документацію в поверхнях вибору.           |
| `selectionDocsOmitLabel`               | `boolean`  | Показувати шлях документації напряму замість посилання на документацію з міткою в тексті вибору. |
| `selectionExtras`                      | `string[]` | Додаткові короткі рядки, додані до тексту вибору.                             |
| `markdownCapable`                      | `boolean`  | Позначає канал як придатний до markdown для рішень щодо вихідного форматування. |
| `exposure`                             | `object`   | Елементи керування видимістю каналу для налаштування, списків налаштованих каналів і поверхонь документації. |
| `quickstartAllowFrom`                  | `boolean`  | Додає цей канал до стандартного потоку швидкого старту `allowFrom`.           |
| `forceAccountBinding`                  | `boolean`  | Вимагає явного прив’язування облікового запису, навіть коли існує лише один обліковий запис. |
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

- `configured`: включати канал у поверхні списків налаштованих каналів/статусу
- `setup`: включати канал в інтерактивні засоби вибору налаштування/конфігурації
- `docs`: позначати канал як публічний у поверхнях документації/навігації

<Note>
`showConfigured` і `showInSetup` залишаються підтримуваними як застарілі псевдоніми. Надавайте перевагу `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` — це метадані пакета, а не метадані маніфесту.

| Поле                        | Тип                  | Що це означає                                                                  |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Канонічна специфікація npm для потоків встановлення/оновлення.                  |
| `localPath`                  | `string`             | Локальний шлях розробки або шлях до вбудованого встановлення.                   |
| `defaultChoice`              | `"npm"` \| `"local"` | Бажане джерело встановлення, коли доступні обидва.                              |
| `minHostVersion`             | `string`             | Мінімальна підтримувана версія OpenClaw у формі `>=x.y.z`.                      |
| `expectedIntegrity`          | `string`             | Очікуваний рядок цілісності npm dist, зазвичай `sha512-...`, для закріплених встановлень. |
| `allowInvalidConfigRecovery` | `boolean`            | Дозволяє потокам перевстановлення вбудованих плагінів відновлюватися після конкретних помилок застарілої конфігурації. |

<AccordionGroup>
  <Accordion title="Onboarding behavior">
    Інтерактивний онбординг також використовує `openclaw.install` для поверхонь встановлення на вимогу. Якщо ваш плагін показує варіанти автентифікації провайдера або метадані налаштування/каталогу каналу до завантаження середовища виконання, онбординг може показати цей вибір, запропонувати npm або локальне встановлення, встановити або ввімкнути плагін, а потім продовжити вибраний потік. Варіанти онбордингу npm потребують довірених метаданих каталогу з реєстровим `npmSpec`; точні версії та `expectedIntegrity` є необов’язковими закріпленнями. Якщо `expectedIntegrity` присутній, потоки встановлення/оновлення примусово його застосовують. Зберігайте метадані «що показувати» в `openclaw.plugin.json`, а метадані «як це встановити» — у `package.json`.
  </Accordion>
  <Accordion title="minHostVersion enforcement">
    Якщо `minHostVersion` задано, його примусово перевіряють як встановлення, так і завантаження реєстру маніфестів. Старіші хости пропускають плагін; недійсні рядки версій відхиляються.
  </Accordion>
  <Accordion title="Pinned npm installs">
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
  <Accordion title="allowInvalidConfigRecovery scope">
    `allowInvalidConfigRecovery` не є загальним обходом для пошкоджених конфігурацій. Він призначений лише для вузького відновлення вбудованих плагінів, щоб перевстановлення/налаштування могло виправити відомі залишки оновлення, як-от відсутній шлях до вбудованого плагіна або застарілий запис `channels.<id>` для того самого плагіна. Якщо конфігурація пошкоджена з непов’язаних причин, встановлення все одно завершується закритою відмовою й повідомляє оператору запустити `openclaw doctor --fix`.
  </Accordion>
</AccordionGroup>

### Відкладене повне завантаження

Плагіни каналів можуть увімкнути відкладене завантаження за допомогою:

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

Коли це ввімкнено, OpenClaw завантажує лише `setupEntry` під час етапу запуску до прослуховування, навіть для вже налаштованих каналів. Повний запис завантажується після того, як gateway починає прослуховування.

<Warning>
Вмикайте відкладене завантаження лише тоді, коли ваш `setupEntry` реєструє все, що потрібно gateway до початку прослуховування (реєстрація каналу, HTTP-маршрути, методи gateway). Якщо повний запис володіє потрібними можливостями запуску, залиште поведінку за замовчуванням.
</Warning>

Якщо ваш запис налаштування/повний запис реєструє RPC-методи gateway, тримайте їх на префіксі, специфічному для плагіна. Зарезервовані основні простори імен адміністрування (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) залишаються власністю core і завжди розв’язуються в `operator.admin`.

## Маніфест Plugin

Кожен нативний плагін має постачати `openclaw.plugin.json` у корені пакета. OpenClaw використовує це для перевірки конфігурації без виконання коду плагіна.

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

Навіть плагіни без конфігурації мають постачати схему. Порожня схема є дійсною:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Див. [маніфест Plugin](/uk/plugins/manifest) для повного довідника схеми.

## Публікація в ClawHub

Для пакетів плагінів використовуйте команду ClawHub, специфічну для пакета:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
Застарілий псевдонім публікації лише для skill призначений для skills. Пакети плагінів завжди мають використовувати `clawhub package publish`.
</Note>

## Запис налаштування

Файл `setup-entry.ts` — це легка альтернатива `index.ts`, яку OpenClaw завантажує, коли йому потрібні лише поверхні налаштування (онбординг, відновлення конфігурації, перевірка вимкненого каналу).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Це запобігає завантаженню важкого runtime-коду (криптографічних бібліотек, реєстрацій CLI, фонових сервісів) під час потоків налаштування.

Вбудовані канали робочого простору, які зберігають безпечні для налаштування експорти в допоміжних модулях, можуть використовувати `defineBundledChannelSetupEntry(...)` з `openclaw/plugin-sdk/channel-entry-contract` замість `defineSetupPluginEntry(...)`. Цей вбудований контракт також підтримує необов'язковий експорт `runtime`, щоб runtime-зв'язування під час налаштування залишалося легким і явним.

<AccordionGroup>
  <Accordion title="Коли OpenClaw використовує setupEntry замість повного entry">
    - Канал вимкнено, але йому потрібні поверхні налаштування/онбордингу.
    - Канал увімкнено, але не налаштовано.
    - Увімкнено відкладене завантаження (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Що setupEntry має зареєструвати">
    - Об'єкт Plugin каналу (через `defineSetupPluginEntry`).
    - Будь-які HTTP-маршрути, потрібні до прослуховування Gateway.
    - Будь-які методи Gateway, потрібні під час запуску.

    Ці стартові методи Gateway усе одно мають уникати зарезервованих адміністративних просторів імен ядра, таких як `config.*` або `update.*`.

  </Accordion>
  <Accordion title="Що setupEntry НЕ має містити">
    - Реєстрації CLI.
    - Фонові сервіси.
    - Важкі runtime-імпорти (криптографія, SDK).
    - Методи Gateway, потрібні лише після запуску.

  </Accordion>
</AccordionGroup>

### Вузькі імпорти помічників налаштування

Для гарячих шляхів, призначених лише для налаштування, надавайте перевагу вузьким швам помічників налаштування замість ширшої парасольки `plugin-sdk/setup`, коли вам потрібна лише частина поверхні налаштування:

| Шлях імпорту                       | Для чого використовувати                                                                  | Ключові експорти                                                                                                                                                                                                                                                                             |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | runtime-помічники часу налаштування, доступні в `setupEntry` / відкладеному запуску каналу | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | адаптери налаштування облікових записів з урахуванням середовища                          | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | помічники CLI/archive/docs для налаштування/встановлення                                  | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

Використовуйте ширший шов `plugin-sdk/setup`, коли потрібен повний спільний інструментарій налаштування, зокрема помічники config-patch, як-от `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Адаптери патчів налаштування залишаються безпечними для гарячого шляху під час імпорту. Їхній вбудований пошук поверхні контракту просування одного облікового запису є лінивим, тож імпорт `plugin-sdk/setup-runtime` не завантажує заздалегідь виявлення вбудованої поверхні контракту до фактичного використання адаптера.

### Просування одного облікового запису, кероване каналом

Коли канал оновлюється з конфігурації верхнього рівня для одного облікового запису до `channels.<id>.accounts.*`, стандартна спільна поведінка переміщує просунуті значення, що належать до області облікового запису, в `accounts.default`.

Вбудовані канали можуть звузити або перевизначити це просування через свою поверхню контракту налаштування:

- `singleAccountKeysToMove`: додаткові ключі верхнього рівня, які потрібно перемістити до просунутого облікового запису
- `namedAccountPromotionKeys`: коли іменовані облікові записи вже існують, лише ці ключі переміщуються до просунутого облікового запису; спільні ключі політики/доставки залишаються в корені каналу
- `resolveSingleAccountPromotionTarget(...)`: виберіть, який наявний обліковий запис отримає просунуті значення

<Note>
Matrix є поточним вбудованим прикладом. Якщо вже існує рівно один іменований обліковий запис Matrix або якщо `defaultAccount` вказує на наявний неканонічний ключ, такий як `Ops`, просування зберігає цей обліковий запис замість створення нового запису `accounts.default`.
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

Для сторонніх plugins холодним шляхом контракту все ще є маніфест Plugin: віддзеркальте згенеровану JSON Schema в `openclaw.plugin.json#channelConfigs`, щоб схема конфігурації, налаштування та UI-поверхні могли перевіряти `channels.<id>` без завантаження runtime-коду.

## Майстри налаштування

Plugins каналів можуть надавати інтерактивні майстри налаштування для `openclaw onboard`. Майстер є об'єктом `ChannelSetupWizard` у `ChannelPlugin`:

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

Тип `ChannelSetupWizard` підтримує `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` та інше. Повні приклади дивіться у пакетах вбудованих plugins (наприклад, у Plugin Discord `src/channel.setup.ts`).

<AccordionGroup>
  <Accordion title="Спільні запити allowFrom">
    Для запитів allowlist DM, яким потрібен лише стандартний потік `note -> prompt -> parse -> merge -> patch`, надавайте перевагу спільним помічникам налаштування з `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` і `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Стандартний статус налаштування каналу">
    Для блоків статусу налаштування каналу, які відрізняються лише мітками, оцінками та необов'язковими додатковими рядками, надавайте перевагу `createStandardChannelSetupStatus(...)` з `openclaw/plugin-sdk/setup` замість ручного створення того самого об'єкта `status` у кожному Plugin.
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

    `plugin-sdk/channel-setup` також надає нижчорівневі побудовники `createOptionalChannelSetupAdapter(...)` і `createOptionalChannelSetupWizard(...)`, коли вам потрібна лише одна половина цієї поверхні необов'язкового встановлення.

    Згенерований необов'язковий адаптер/майстер закривається безпечно у разі реальних записів конфігурації. Вони повторно використовують одне повідомлення про необхідність встановлення в `validateInput`, `applyAccountConfig` і `finalize` та додають посилання на документацію, коли задано `docsPath`.

  </Accordion>
  <Accordion title="Помічники налаштування на основі бінарних файлів">
    Для UI налаштування на основі бінарних файлів надавайте перевагу спільним делегованим помічникам замість копіювання того самого зв'язувального коду binary/status у кожен канал:

    - `createDetectedBinaryStatus(...)` для блоків статусу, які відрізняються лише мітками, підказками, оцінками та виявленням бінарного файлу
    - `createCliPathTextInput(...)` для текстових вводів на основі шляху
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` і `createDelegatedResolveConfigured(...)`, коли `setupEntry` має ліниво переспрямовувати до важчого повного майстра
    - `createDelegatedTextInputShouldPrompt(...)`, коли `setupEntry` потрібно лише делегувати рішення `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Публікація та встановлення

**Зовнішні plugins:** опублікуйте в [ClawHub](/uk/tools/clawhub), потім установіть:

<Tabs>
  <Tab title="Автоматично (ClawHub, потім npm)">
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
    Використовуйте npm, коли пакет ще не переміщено до ClawHub або коли вам потрібен
    прямий шлях встановлення npm під час міграції:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugins у репозиторії:** розміщуйте під деревом робочого простору вбудованих plugins, і їх буде автоматично виявлено під час збірки.

**Користувачі можуть установити:**

```bash
openclaw plugins install <package-name>
```

<Info>
Для встановлень із npm `openclaw plugins install` встановлює пакет у `~/.openclaw/npm` з вимкненими lifecycle-скриптами. Тримайте дерева залежностей Plugin чистими JS/TS і уникайте пакетів, які потребують збірок `postinstall`.
</Info>

<Note>
Запуск Gateway не встановлює залежності Plugin. Потоки встановлення npm/git/ClawHub відповідають за узгодження залежностей; локальні plugins уже повинні мати встановлені залежності.
</Note>

Метадані пакетів у комплекті задаються явно, а не виводяться зі зібраного JavaScript під час запуску Gateway. Залежності часу виконання мають бути в пакеті Plugin, якому вони належать; запуск запакованого OpenClaw ніколи не виправляє й не віддзеркалює залежності Plugin.

## Пов’язане

- [Створення plugins](/uk/plugins/building-plugins) — покроковий посібник для початку роботи
- [Маніфест Plugin](/uk/plugins/manifest) — повний довідник схеми маніфесту
- [Точки входу SDK](/uk/plugins/sdk-entrypoints) — `definePluginEntry` і `defineChannelPluginEntry`
