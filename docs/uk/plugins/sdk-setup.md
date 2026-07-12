---
read_when:
    - Ви додаєте майстер налаштування до плагіна
    - Вам потрібно зрозуміти різницю між setup-entry.ts та index.ts
    - Ви визначаєте схеми конфігурації плагінів або метадані openclaw у package.json
sidebarTitle: Setup and config
summary: Майстри налаштування, setup-entry.ts, схеми конфігурації та метадані package.json
title: Налаштування та конфігурація Plugin
x-i18n:
    generated_at: "2026-07-12T13:39:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3b47e1f18a92871c442980168e302c82d7aa9a38b38bbbeed4add9dd6479365b
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Довідка щодо пакування плагінів (метаданих `package.json`), маніфестів (`openclaw.plugin.json`), точок входу для налаштування та схем конфігурації.

<Tip>
**Шукаєте покрокову інструкцію?** Практичні посібники розглядають пакування в контексті: [плагіни каналів](/uk/plugins/sdk-channel-plugins#step-1-package-and-manifest) і [плагіни провайдерів](/uk/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Метадані пакета

Ваш `package.json` має містити поле `openclaw`, яке повідомляє системі плагінів, що надає ваш плагін:

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
  <Tab title="Плагін провайдера / базова конфігурація ClawHub">
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
Для зовнішньої публікації в ClawHub потрібні `compat` і `build`. Канонічні фрагменти для публікації містяться в `docs/snippets/plugin-publish/`.
</Note>

### Поля `openclaw`

<ParamField path="extensions" type="string[]">
  Файли точок входу (відносно кореня пакета). Допустимі початкові файли для розробки в робочому просторі та вивіреній копії git.
</ParamField>
<ParamField path="runtimeExtensions" type="string[]">
  Зібрані відповідники JavaScript для `extensions`, яким надається перевага, коли OpenClaw завантажує встановлений пакет npm. Порядок визначення початкових і зібраних файлів див. у розділі [Точки входу SDK](/uk/plugins/sdk-entrypoints).
</ParamField>
<ParamField path="setupEntry" type="string">
  Полегшена точка входу лише для налаштування (необов’язкова).
</ParamField>
<ParamField path="runtimeSetupEntry" type="string">
  Зібраний відповідник JavaScript для `setupEntry`. Потребує також заданого `setupEntry`.
</ParamField>
<ParamField path="plugin" type="object">
  Резервна ідентичність плагіна `{ id, label }`, яка використовується, коли плагін не має метаданих каналу або провайдера, з яких можна отримати ідентифікатор чи мітку.
</ParamField>
<ParamField path="channel" type="object">
  Метадані каталогу каналів для налаштування, засобу вибору, швидкого запуску та представлень стану.
</ParamField>
<ParamField path="install" type="object">
  Підказки щодо встановлення: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`, `requiredPlatformPackages`.
</ParamField>
<ParamField path="startup" type="object">
  Прапорці поведінки під час запуску.
</ParamField>
<ParamField path="compat" type="object">
  Діапазон версій `pluginApi`, які підтримує цей плагін. Обов’язковий для зовнішніх публікацій у ClawHub.
</ParamField>

<Note>
Ідентифікатори провайдерів (`providers: string[]`) — це метадані маніфесту, а не пакета. Оголошуйте їх у `openclaw.plugin.json`, а не тут — див. [Маніфест плагіна](/uk/plugins/manifest).
</Note>

### `openclaw.channel`

`openclaw.channel` — це легкі метадані пакета для виявлення каналів і представлень налаштування до завантаження середовища виконання.

| Поле                                   | Тип        | Значення                                                                      |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | Канонічний ідентифікатор каналу.                                              |
| `label`                                | `string`   | Основна мітка каналу.                                                         |
| `selectionLabel`                       | `string`   | Мітка в засобі вибору або налаштування, якщо вона має відрізнятися від `label`. |
| `detailLabel`                          | `string`   | Додаткова докладна мітка для розширених каталогів каналів і представлень стану. |
| `docsPath`                             | `string`   | Шлях до документації для посилань у налаштуванні та виборі.                   |
| `docsLabel`                            | `string`   | Альтернативна мітка для посилань на документацію, якщо вона має відрізнятися від ідентифікатора каналу. |
| `blurb`                                | `string`   | Короткий опис для початкового налаштування або каталогу.                      |
| `order`                                | `number`   | Порядок сортування в каталогах каналів.                                       |
| `aliases`                              | `string[]` | Додаткові псевдоніми пошуку для вибору каналу.                                |
| `preferOver`                           | `string[]` | Ідентифікатори плагінів або каналів із нижчим пріоритетом, які цей канал має випереджати. |
| `systemImage`                          | `string`   | Необов’язкова назва піктограми або системного зображення для каталогів каналів в інтерфейсі. |
| `selectionDocsPrefix`                  | `string`   | Текст-префікс перед посиланнями на документацію в представленнях вибору.      |
| `selectionDocsOmitLabel`               | `boolean`  | Показувати шлях до документації безпосередньо замість позначеного посилання на документацію в тексті вибору. |
| `selectionExtras`                      | `string[]` | Додаткові короткі рядки, що додаються до тексту вибору.                        |
| `markdownCapable`                      | `boolean`  | Позначає канал як такий, що підтримує Markdown, для ухвалення рішень щодо форматування вихідних повідомлень. |
| `exposure`                             | `object`   | Керування видимістю каналу в налаштуванні, списках налаштованих каналів і представленнях документації. |
| `quickstartAllowFrom`                  | `boolean`  | Долучає цей канал до стандартного процесу швидкого налаштування `allowFrom`.   |
| `forceAccountBinding`                  | `boolean`  | Вимагати явного прив’язування облікового запису, навіть якщо існує лише один обліковий запис. |
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

- `configured`: включати канал до представлень списків налаштованих каналів і стану
- `setup`: включати канал до інтерактивних засобів вибору налаштування та конфігурації
- `docs`: позначати канал як загальнодоступний у представленнях документації та навігації

<Note>
`showConfigured` і `showInSetup` надалі підтримуються як застарілі псевдоніми. Надавайте перевагу `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` — це метадані пакета, а не маніфесту.

| Поле                         | Тип                                 | Значення                                                                          |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Канонічна специфікація ClawHub для встановлення, оновлення та встановлення на вимогу під час початкового налаштування. |
| `npmSpec`                    | `string`                            | Канонічна специфікація npm для резервних процесів встановлення та оновлення.      |
| `localPath`                  | `string`                            | Локальний шлях для розробки або вбудованого встановлення.                         |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Бажане джерело встановлення, коли доступно кілька джерел.                         |
| `minHostVersion`             | `string`                            | Мінімальна підтримувана версія OpenClaw: `>=x.y.z` або `>=x.y.z-prerelease`.      |
| `expectedIntegrity`          | `string`                            | Очікуваний рядок цілісності дистрибутива npm, зазвичай `sha512-...`, для встановлень із закріпленою версією. |
| `allowInvalidConfigRecovery` | `boolean`                           | Дає змогу процесам повторного встановлення вбудованого плагіна відновлюватися після певних помилок застарілої конфігурації. |
| `requiredPlatformPackages`   | `string[]`                          | Обов’язкові псевдоніми npm для конкретної платформи, що перевіряються під час встановлення через npm. |

<AccordionGroup>
  <Accordion title="Поведінка початкового налаштування">
    Інтерактивне початкове налаштування використовує `openclaw.install` у представленнях встановлення на вимогу: якщо ваш плагін надає варіанти автентифікації провайдера або метадані налаштування чи каталогу каналів до завантаження середовища виконання, початкове налаштування може запропонувати встановлення з ClawHub, npm або локального джерела, установити чи ввімкнути плагін, а потім продовжити вибраний процес. Варіанти ClawHub використовують `clawhubSpec`, і їм надається перевага за наявності; для варіантів npm потрібні довірені метадані каталогу зі значенням `npmSpec` реєстру (точні версії та `expectedIntegrity` є необов’язковими закріпленнями, які застосовуються під час встановлення або оновлення, якщо їх задано). Зберігайте відомості про те, «що показувати», у `openclaw.plugin.json`, а про те, «як це встановити», — у `package.json`.
  </Accordion>
  <Accordion title="Застосування minHostVersion">
    Якщо задано `minHostVersion`, його вимоги застосовуються як під час встановлення, так і під час завантаження реєстру маніфестів невбудованих плагінів. Старіші хости пропускають зовнішні плагіни; некоректні рядки версій відхиляються. Вважається, що версія вбудованих плагінів із початкового коду збігається з версією вивіреної копії хоста.
  </Accordion>
  <Accordion title="Встановлення npm із закріпленою версією">
    Для встановлень npm із закріпленою версією зберігайте точну версію в `npmSpec` і додайте очікувану цілісність артефакту:

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
    `allowInvalidConfigRecovery` не є загальним способом обійти пошкоджені конфігурації. Воно призначене лише для вузького відновлення вбудованого плагіна, даючи повторному встановленню або налаштуванню змогу виправити відомі залишки оновлення, як-от відсутній шлях до вбудованого плагіна або застарілий запис `channels.<id>` для того самого плагіна. Якщо конфігурацію пошкоджено з непов’язаних причин, встановлення все одно завершується безпечною відмовою та повідомляє оператору запустити `openclaw doctor --fix`.
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

Коли цей параметр увімкнено, OpenClaw завантажує лише `setupEntry` під час етапу запуску до початку прослуховування, навіть для вже налаштованих каналів. Повна точка входу завантажується після того, як Gateway починає прослуховування.

<Warning>
Вмикайте відкладене завантаження, лише якщо ваш `setupEntry` реєструє все, що потрібно Gateway до початку прослуховування (реєстрацію каналу, маршрути HTTP, методи Gateway). Якщо повна точка входу відповідає за обов’язкові можливості запуску, збережіть типову поведінку.
</Warning>

Якщо ваша точка входу для налаштування або повна точка входу реєструє методи RPC Gateway, використовуйте для них префікс, специфічний для плагіна. Зарезервовані основні адміністративні простори імен (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) залишаються у власності ядра та завжди нормалізуються до `operator.admin`.

## Маніфест плагіна

Кожен нативний Plugin повинен постачати файл `openclaw.plugin.json` у корені пакета. OpenClaw використовує його для перевірки конфігурації без виконання коду Plugin.

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

Для Plugin каналів додайте `channels` (а для Plugin постачальників — `providers`):

```json
{
  "id": "my-channel",
  "channels": ["my-channel"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

Навіть Plugin без конфігурації повинні постачати схему. Порожня схема є допустимою:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Повний довідник зі схеми див. у розділі [Маніфест Plugin](/uk/plugins/manifest).

## Публікація в ClawHub

Пакети Skills і Plugin використовують окремі команди публікації в ClawHub. Для пакетів Plugin використовуйте спеціальну команду для пакетів:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
`clawhub skill publish <path>` — це інша команда для публікації каталогу Skills, а не пакета Plugin. Див. [Публікація в ClawHub](/uk/clawhub/publishing).
</Note>

## Точка входу налаштування

`setup-entry.ts` — це полегшена альтернатива `index.ts`, яку OpenClaw завантажує, коли потрібні лише поверхні налаштування (початкове налаштування, виправлення конфігурації, перевірка вимкненого каналу):

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Це дає змогу не завантажувати важкий код середовища виконання (криптографічні бібліотеки, реєстрації CLI, фонові служби) під час процесів налаштування.

Вбудовані канали робочого простору, які зберігають безпечні для налаштування експорти в допоміжних модулях, можуть використовувати `defineBundledChannelSetupEntry(...)` з `openclaw/plugin-sdk/channel-entry-contract` замість `defineSetupPluginEntry(...)`. Цей контракт для вбудованих компонентів також підтримує необов’язковий експорт `runtime`, щоб підключення середовища виконання під час налаштування залишалося легким і явним.

<AccordionGroup>
  <Accordion title="Коли OpenClaw використовує setupEntry замість повної точки входу">
    - Канал вимкнено, але йому потрібні поверхні налаштування або початкового налаштування.
    - Канал увімкнено, але не налаштовано.
    - Увімкнено відкладене завантаження (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Що має реєструвати setupEntry">
    - Об’єкт Plugin каналу (через `defineSetupPluginEntry`).
    - Усі маршрути HTTP, потрібні до початку прослуховування Gateway.
    - Усі методи Gateway, потрібні під час запуску.

    Ці методи Gateway для запуску все одно не повинні використовувати зарезервовані простори імен адміністрування ядра, як-от `config.*` або `update.*`.

  </Accordion>
  <Accordion title="Що setupEntry НЕ повинен містити">
    - Реєстрації CLI.
    - Фонові служби.
    - Важкі імпорти середовища виконання (криптографічні бібліотеки, SDK).
    - Методи Gateway, потрібні лише після запуску.

  </Accordion>
</AccordionGroup>

### Вузькоспеціалізовані імпорти допоміжних засобів налаштування

Для часто використовуваних шляхів, призначених лише для налаштування, надавайте перевагу вузькоспеціалізованим інтерфейсам допоміжних засобів налаштування замість ширшого універсального інтерфейсу `plugin-sdk/setup`, якщо вам потрібна лише частина поверхні налаштування:

| Шлях імпорту                      | Для чого використовувати                                                                    | Основні експорти                                                                                                                                                                                                                                                                                                      |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | допоміжні засоби середовища виконання під час налаштування, доступні в `setupEntry` / під час відкладеного запуску каналу | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | застарілий псевдонім сумісності; використовуйте `plugin-sdk/setup-runtime`                 | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                 |
| `plugin-sdk/setup-tools`           | допоміжні засоби CLI, архівів і документації для налаштування та встановлення              | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

Використовуйте ширший інтерфейс `plugin-sdk/setup`, якщо вам потрібен повний спільний набір інструментів налаштування, зокрема допоміжні засоби виправлення конфігурації, як-от `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Використовуйте `createSetupTranslator(...)` для фіксованого тексту майстра налаштування. Він використовує локаль майстра CLI (`OPENCLAW_LOCALE`, а потім системні змінні локалі) і за відсутності перекладу повертається до англійської мови. Зберігайте специфічний для Plugin текст налаштування в коді, що належить Plugin, а ключі спільного каталогу використовуйте лише для загальних міток налаштування, тексту стану й тексту налаштування офіційних вбудованих Plugin.

Адаптери виправлення налаштувань залишаються безпечними для імпорту в часто використовуваних шляхах. Пошук поверхні контракту для підвищення вбудованої конфігурації одного облікового запису виконується відкладено, тому імпорт `plugin-sdk/setup-runtime` не запускає завчасно виявлення поверхні вбудованого контракту, доки адаптер фактично не буде використано.

### Підвищення конфігурації одного облікового запису, кероване каналом

Коли канал переходить від конфігурації одного облікового запису верхнього рівня до `channels.<id>.accounts.*`, стандартна спільна поведінка переміщує підвищені значення, що стосуються облікового запису, до `accounts.default`.

Вбудовані канали можуть звузити або перевизначити це підвищення через свою поверхню контракту налаштування:

- `singleAccountKeysToMove`: додаткові ключі верхнього рівня, які потрібно перемістити до підвищеного облікового запису
- `namedAccountPromotionKeys`: якщо іменовані облікові записи вже існують, до підвищеного облікового запису переміщуються лише ці ключі; спільні ключі політики й доставки залишаються в корені каналу
- `resolveSingleAccountPromotionTarget(...)`: вибирає, який наявний обліковий запис отримає підвищені значення

<Note>
Matrix — поточний вбудований приклад. Якщо вже існує рівно один іменований обліковий запис Matrix або якщо `defaultAccount` указує на наявний неканонічний ключ, як-от `Ops`, підвищення зберігає цей обліковий запис замість створення нового запису `accounts.default`.
</Note>

## Схема конфігурації

Конфігурація Plugin перевіряється за схемою JSON у вашому маніфесті. Користувачі налаштовують Plugin так:

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

Якщо ви вже описуєте контракт як схему JSON або TypeBox, використовуйте безпосередній допоміжний засіб, щоб OpenClaw міг пропустити перетворення Zod на схему JSON у шляхах метаданих:

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

Для сторонніх Plugin контрактом холодного шляху й надалі є маніфест Plugin: віддзеркальте згенеровану схему JSON у `openclaw.plugin.json#channelConfigs`, щоб поверхні схеми конфігурації, налаштування та інтерфейсу користувача могли перевіряти `channels.<id>` без завантаження коду середовища виконання.

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

`ChannelSetupWizard` також підтримує `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` тощо. Повний приклад вбудованого Plugin див. у файлі `src/setup-core.ts` Plugin Discord.

<AccordionGroup>
  <Accordion title="Спільні запити allowFrom">
    Для запитів списку дозволених відправників особистих повідомлень, яким потрібен лише стандартний процес `примітка -> запит -> розбір -> об’єднання -> виправлення`, надавайте перевагу спільним допоміжним засобам налаштування з `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` і `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Стандартний стан налаштування каналу">
    Для блоків стану налаштування каналу, що відрізняються лише мітками, оцінками й необов’язковими додатковими рядками, надавайте перевагу `createStandardChannelSetupStatus(...)` з `openclaw/plugin-sdk/setup` замість ручного створення однакового об’єкта `status` у кожному Plugin.
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

    `plugin-sdk/channel-setup` також надає низькорівневі конструктори `createOptionalChannelSetupAdapter(...)` і `createOptionalChannelSetupWizard(...)`, якщо вам потрібна лише одна частина цієї поверхні необов’язкового встановлення.

    Згенеровані необов’язкові адаптер і майстер під час фактичного запису конфігурації завершують роботу з помилкою за замовчуванням. Вони повторно використовують одне повідомлення про необхідність установлення в `validateInput`, `applyAccountConfig` і `finalize` та додають посилання на документацію, коли задано `docsPath`.

  </Accordion>
  <Accordion title="Допоміжні засоби налаштування на основі бінарних файлів">
    Для інтерфейсів налаштування на основі бінарних файлів віддавайте перевагу спільним делегованим допоміжним засобам замість дублювання однакової логіки роботи з бінарними файлами та станами в кожному каналі:

    - `createDetectedBinaryStatus(...)` для блоків стану, які відрізняються лише мітками, підказками, оцінками та виявленням бінарного файла
    - `createCliPathTextInput(...)` для текстових полів введення шляхів
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` і `createDelegatedResolveConfigured(...)`, коли `setupEntry` має ліниво делегувати роботу складнішому повнофункціональному майстру
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

    Специфікації пакетів без префікса встановлюються з npm під час переходу на запуск, якщо назва не збігається з ідентифікатором вбудованого або офіційного плагіна; у такому разі OpenClaw натомість використовує відповідну локальну або офіційну копію. Для детермінованого вибору джерела використовуйте `clawhub:`, `npm:`, `git:` або `npm-pack:` — див. [Керування плагінами](/uk/plugins/manage-plugins).

  </Tab>
  <Tab title="Лише ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="Специфікація пакета npm">
    Використовуйте npm, якщо пакет ще не перенесено до ClawHub або якщо під час
    міграції потрібен прямий шлях установлення з npm:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Плагіни в репозиторії:** розміщуйте їх у дереві робочого простору вбудованих плагінів; вони автоматично виявляються під час збирання.

<Info>
Для встановлень із npm команда `openclaw plugins install` установлює пакет в окремий для кожного плагіна проєкт у `~/.openclaw/npm/projects` із вимкненими сценаріями життєвого циклу (`--ignore-scripts`). Використовуйте в деревах залежностей плагінів лише JS/TS і уникайте пакетів, які потребують збирання через `postinstall`.
</Info>

<Note>
Під час запуску Gateway залежності плагінів не встановлюються. Потоки встановлення з npm, git і ClawHub відповідають за узгодження залежностей; залежності локальних плагінів уже мають бути встановлені.
</Note>

Метадані вбудованих пакетів задаються явно, а не виводяться зі зібраного JavaScript під час запуску Gateway. Залежності середовища виконання мають бути в пакеті плагіна, якому вони належать; запуск упакованого OpenClaw ніколи не відновлює та не дублює залежності плагінів.

## Пов’язані матеріали

- [Створення плагінів](/uk/plugins/building-plugins) — покроковий посібник із початку роботи
- [Маніфест плагіна](/uk/plugins/manifest) — повний довідник зі схеми маніфесту
- [Точки входу SDK](/uk/plugins/sdk-entrypoints) — `definePluginEntry` і `defineChannelPluginEntry`
