---
read_when:
    - Ви додаєте майстер налаштування для Plugin
    - Потрібно зрозуміти різницю між setup-entry.ts і index.ts
    - Ви визначаєте схеми конфігурації plugin або метадані `openclaw` у `package.json`
sidebarTitle: Setup and config
summary: Майстри налаштування, setup-entry.ts, схеми конфігурації та метадані package.json
title: Налаштування та конфігурація Plugin
x-i18n:
    generated_at: "2026-05-11T20:51:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e6c59d7201cc1402cd648a37fc498fbb7e4043a661dcd39c2e62fcf01067879
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Довідник із пакування плагінів (метадані `package.json`), маніфестів (`openclaw.plugin.json`), записів налаштування та схем конфігурації.

<Tip>
**Шукаєте покроковий посібник?** Практичні посібники описують пакування в контексті: [плагіни каналів](/uk/plugins/sdk-channel-plugins#step-1-package-and-manifest) і [плагіни провайдерів](/uk/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Метадані пакета

Вашому `package.json` потрібне поле `openclaw`, яке повідомляє системі плагінів, що надає ваш плагін:

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
Якщо ви публікуєте плагін зовні на ClawHub, ці поля `compat` і `build` обов’язкові. Канонічні фрагменти для публікації розміщені в `docs/snippets/plugin-publish/`.
</Note>

### Поля `openclaw`

<ParamField path="extensions" type="string[]">
  Файли точок входу (відносно кореня пакета).
</ParamField>
<ParamField path="setupEntry" type="string">
  Легковаговий запис лише для налаштування (необов’язково).
</ParamField>
<ParamField path="channel" type="object">
  Метадані каталогу каналів для налаштування, вибирача, швидкого старту й поверхонь стану.
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

`openclaw.channel` — це легкі метадані пакета для виявлення каналів і поверхонь налаштування до завантаження runtime.

| Поле                                   | Тип        | Що означає                                                                       |
| -------------------------------------- | ---------- | -------------------------------------------------------------------------------- |
| `id`                                   | `string`   | Канонічний ідентифікатор каналу.                                                 |
| `label`                                | `string`   | Основна мітка каналу.                                                            |
| `selectionLabel`                       | `string`   | Мітка вибирача/налаштування, коли вона має відрізнятися від `label`.             |
| `detailLabel`                          | `string`   | Вторинна детальна мітка для розширених каталогів каналів і поверхонь стану.      |
| `docsPath`                             | `string`   | Шлях документації для посилань налаштування й вибору.                            |
| `docsLabel`                            | `string`   | Перевизначення мітки для посилань документації, коли вона має відрізнятися від ідентифікатора каналу. |
| `blurb`                                | `string`   | Короткий опис для онбордингу/каталогу.                                           |
| `order`                                | `number`   | Порядок сортування в каталогах каналів.                                          |
| `aliases`                              | `string[]` | Додаткові псевдоніми пошуку для вибору каналу.                                   |
| `preferOver`                           | `string[]` | Ідентифікатори плагінів/каналів нижчого пріоритету, які цей канал має випереджати. |
| `systemImage`                          | `string`   | Необов’язкова назва іконки/system-image для каталогів UI каналів.                |
| `selectionDocsPrefix`                  | `string`   | Текст-префікс перед посиланнями документації в поверхнях вибору.                 |
| `selectionDocsOmitLabel`               | `boolean`  | Показувати шлях документації напряму замість підписаного посилання документації в тексті вибору. |
| `selectionExtras`                      | `string[]` | Додаткові короткі рядки, додані до тексту вибору.                                |
| `markdownCapable`                      | `boolean`  | Позначає канал як сумісний із markdown для рішень щодо вихідного форматування.   |
| `exposure`                             | `object`   | Елементи керування видимістю каналу для налаштування, списків налаштованого й поверхонь документації. |
| `quickstartAllowFrom`                  | `boolean`  | Долучає цей канал до стандартного потоку налаштування швидкого старту `allowFrom`. |
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

- `configured`: включати канал у поверхні списків налаштованого/стану
- `setup`: включати канал в інтерактивні вибирачі налаштування/конфігурування
- `docs`: позначати канал як публічний у поверхнях документації/навігації

<Note>
`showConfigured` і `showInSetup` залишаються підтримуваними як застарілі псевдоніми. Віддавайте перевагу `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` — це метадані пакета, а не метадані маніфесту.

| Поле                        | Тип                                 | Що означає                                                                       |
| ---------------------------- | ----------------------------------- | -------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Канонічна специфікація ClawHub для встановлення/оновлення та потоків онбордингу з установленням на вимогу. |
| `npmSpec`                    | `string`                            | Канонічна специфікація npm для резервних потоків встановлення/оновлення.         |
| `localPath`                  | `string`                            | Локальний шлях розробки або комплектного встановлення.                           |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Бажане джерело встановлення, коли доступні кілька джерел.                        |
| `minHostVersion`             | `string`                            | Мінімальна підтримувана версія OpenClaw у формі `>=x.y.z` або `>=x.y.z-prerelease`. |
| `expectedIntegrity`          | `string`                            | Очікуваний рядок цілісності npm dist, зазвичай `sha512-...`, для закріплених встановлень. |
| `allowInvalidConfigRecovery` | `boolean`                           | Дозволяє потокам перевстановлення комплектних плагінів відновлюватися після конкретних збоїв застарілої конфігурації. |

<AccordionGroup>
  <Accordion title="Onboarding behavior">
    Інтерактивний онбординг також використовує `openclaw.install` для поверхонь установлення на вимогу. Якщо ваш плагін надає варіанти автентифікації провайдера або метадані налаштування/каталогу каналів до завантаження runtime, онбординг може показати цей вибір, запросити встановлення через ClawHub, npm або локально, встановити чи ввімкнути плагін, а потім продовжити вибраний потік. Варіанти онбордингу ClawHub використовують `clawhubSpec` і мають перевагу, коли присутні; варіанти npm потребують довірених метаданих каталогу з registry `npmSpec`; точні версії та `expectedIntegrity` є необов’язковими фіксаціями npm. Якщо `expectedIntegrity` присутнє, потоки встановлення/оновлення примусово застосовують його для npm. Зберігайте метадані «що показувати» в `openclaw.plugin.json`, а метадані «як це встановити» — у `package.json`.
  </Accordion>
  <Accordion title="minHostVersion enforcement">
    Якщо `minHostVersion` задано, його застосовують і встановлення, і завантаження реєстру маніфестів для некомплектних плагінів. Старіші хости пропускають зовнішні плагіни; недійсні рядки версій відхиляються. Комплектні вихідні плагіни вважаються співверсійними з checkout хоста.
  </Accordion>
  <Accordion title="Pinned npm installs">
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
  <Accordion title="allowInvalidConfigRecovery scope">
    `allowInvalidConfigRecovery` не є загальним обходом для зламаних конфігурацій. Він призначений лише для вузького відновлення комплектних плагінів, щоб перевстановлення/налаштування могло виправити відомі залишки після оновлення, як-от відсутній шлях комплектного плагіна або застарілий запис `channels.<id>` для того самого плагіна. Якщо конфігурація зламана з не пов’язаних причин, установлення все одно завершується закритою помилкою й повідомляє оператору запустити `openclaw doctor --fix`.
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

Коли це ввімкнено, OpenClaw завантажує лише `setupEntry` під час фази запуску до прослуховування, навіть для вже налаштованих каналів. Повний запис завантажується після того, як gateway починає прослуховування.

<Warning>
Умикайте відкладене завантаження лише тоді, коли ваш `setupEntry` реєструє все, що gateway потребує до початку прослуховування (реєстрація каналу, HTTP-маршрути, методи gateway). Якщо повний запис володіє потрібними можливостями запуску, залиште поведінку за замовчуванням.
</Warning>

Якщо ваш запис налаштування/повний запис реєструє RPC-методи gateway, тримайте їх на префіксі, специфічному для плагіна. Зарезервовані простори імен адміністрування core (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) залишаються у власності core і завжди зіставляються з `operator.admin`.

## Маніфест плагіна

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

Див. [Маніфест плагіна](/uk/plugins/manifest) для повного довідника схеми.

## Публікація в ClawHub

Для пакетів плагінів використовуйте команду ClawHub, специфічну для пакета:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
Застарілий alias публікації лише для skills призначений для skills. Пакети Plugin завжди мають використовувати `clawhub package publish`.
</Note>

## Запис налаштування

Файл `setup-entry.ts` — це легка альтернатива `index.ts`, яку OpenClaw завантажує, коли йому потрібні лише поверхні налаштування (онбординг, виправлення конфігурації, перевірка вимкненого каналу).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Це дає змогу не завантажувати важкий runtime-код (криптографічні бібліотеки, реєстрації CLI, фонові сервіси) під час потоків налаштування.

Пакетні канали робочого простору, які тримають setup-safe експорти в sidecar-модулях, можуть використовувати `defineBundledChannelSetupEntry(...)` з `openclaw/plugin-sdk/channel-entry-contract` замість `defineSetupPluginEntry(...)`. Цей пакетний контракт також підтримує необов’язковий експорт `runtime`, щоб runtime-зв’язування під час налаштування залишалося легким і явним.

<AccordionGroup>
  <Accordion title="Коли OpenClaw використовує setupEntry замість повного entry">
    - Канал вимкнено, але йому потрібні поверхні налаштування/онбордингу.
    - Канал увімкнено, але не налаштовано.
    - Увімкнено відкладене завантаження (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Що setupEntry має зареєструвати">
    - Об’єкт channel plugin (через `defineSetupPluginEntry`).
    - Будь-які HTTP routes, потрібні до gateway listen.
    - Будь-які gateway methods, потрібні під час запуску.

    Ці startup gateway methods усе одно мають уникати зарезервованих core admin namespaces, як-от `config.*` або `update.*`.

  </Accordion>
  <Accordion title="Що setupEntry НЕ має містити">
    - Реєстрації CLI.
    - Фонові сервіси.
    - Важкі runtime imports (crypto, SDKs).
    - Gateway methods, потрібні лише після запуску.

  </Accordion>
</AccordionGroup>

### Вузькі імпорти помічників налаштування

Для гарячих setup-only шляхів віддавайте перевагу вузьким швам помічників налаштування замість ширшого umbrella `plugin-sdk/setup`, коли вам потрібна лише частина поверхні налаштування:

| Шлях імпорту                       | Для чого використовувати                                                                  | Ключові експорти                                                                                                                                                                                                                                                                             |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | runtime-помічники під час налаштування, доступні в `setupEntry` / deferred channel startup | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | застарілий compatibility alias; використовуйте `plugin-sdk/setup-runtime`                 | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | помічники setup/install CLI/archive/docs                                                   | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

Використовуйте ширший шов `plugin-sdk/setup`, коли потрібен повний спільний toolbox налаштування, включно з config-patch помічниками, як-от `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Setup patch adapters залишаються безпечними для hot-path під час імпорту. Їхній пакетний single-account promotion contract-surface lookup є лінивим, тому імпорт `plugin-sdk/setup-runtime` не завантажує заздалегідь bundled contract-surface discovery до фактичного використання адаптера.

### Channel-owned single-account promotion

Коли канал оновлюється з single-account top-level config до `channels.<id>.accounts.*`, стандартна спільна поведінка переносить promoted account-scoped values до `accounts.default`.

Пакетні канали можуть звузити або перевизначити це promotion через свою setup contract surface:

- `singleAccountKeysToMove`: додаткові top-level keys, які мають перейти до promoted account
- `namedAccountPromotionKeys`: коли named accounts уже існують, лише ці keys переходять до promoted account; shared policy/delivery keys залишаються в корені каналу
- `resolveSingleAccountPromotionTarget(...)`: вибрати, який наявний account отримає promoted values

<Note>
Matrix — поточний пакетний приклад. Якщо вже існує рівно один named Matrix account або якщо `defaultAccount` вказує на наявний non-canonical key, як-от `Ops`, promotion зберігає цей account замість створення нового запису `accounts.default`.
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

### Створення схем конфігурації каналів

Використовуйте `buildChannelConfigSchema`, щоб перетворити Zod schema на wrapper `ChannelConfigSchema`, який використовується plugin-owned config artifacts:

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

Якщо ви вже створюєте контракт як JSON Schema або TypeBox, використовуйте direct helper, щоб OpenClaw міг пропустити перетворення Zod-to-JSON-Schema на metadata paths:

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

Для third-party plugins cold-path contract усе ще є plugin manifest: віддзеркальте згенеровану JSON Schema в `openclaw.plugin.json#channelConfigs`, щоб schema конфігурації, налаштування та поверхні UI могли перевіряти `channels.<id>` без завантаження runtime-коду.

## Майстри налаштування

Channel plugins можуть надавати інтерактивні майстри налаштування для `openclaw onboard`. Майстер — це об’єкт `ChannelSetupWizard` у `ChannelPlugin`:

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

Тип `ChannelSetupWizard` підтримує `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` та інше. Повні приклади дивіться в пакетах bundled plugin (наприклад, у Discord Plugin `src/channel.setup.ts`).

<AccordionGroup>
  <Accordion title="Спільні підказки allowFrom">
    Для DM allowlist prompts, яким потрібен лише стандартний потік `note -> prompt -> parse -> merge -> patch`, віддавайте перевагу спільним setup helpers з `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` і `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Стандартний статус налаштування каналу">
    Для блоків channel setup status, які відрізняються лише labels, scores і необов’язковими extra lines, віддавайте перевагу `createStandardChannelSetupStatus(...)` з `openclaw/plugin-sdk/setup` замість ручного створення такого самого об’єкта `status` у кожному Plugin.
  </Accordion>
  <Accordion title="Необов’язкова поверхня налаштування каналу">
    Для optional setup surfaces, які мають з’являтися лише в певних контекстах, використовуйте `createOptionalChannelSetupSurface` з `openclaw/plugin-sdk/channel-setup`:

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

    `plugin-sdk/channel-setup` також надає lower-level builders `createOptionalChannelSetupAdapter(...)` і `createOptionalChannelSetupWizard(...)`, коли вам потрібна лише одна половина цієї optional-install surface.

    Згенеровані optional adapter/wizard fail closed для реальних config writes. Вони повторно використовують одне install-required message у `validateInput`, `applyAccountConfig` і `finalize`, а також додають docs link, коли задано `docsPath`.

  </Accordion>
  <Accordion title="Помічники налаштування на основі binary">
    Для binary-backed setup UIs віддавайте перевагу спільним delegated helpers замість копіювання однакового binary/status glue в кожен канал:

    - `createDetectedBinaryStatus(...)` для status blocks, які відрізняються лише labels, hints, scores і binary detection
    - `createCliPathTextInput(...)` для path-backed text inputs
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` і `createDelegatedResolveConfigured(...)`, коли `setupEntry` має ліниво пересилати до важчого full wizard
    - `createDelegatedTextInputShouldPrompt(...)`, коли `setupEntry` має лише делегувати рішення `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Публікація та встановлення

**Зовнішні plugins:** опублікуйте в [ClawHub](/uk/clawhub), потім встановіть:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    Bare package specs встановлюються з npm під час launch cutover.

  </Tab>
  <Tab title="Лише ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="специфікація пакета npm">
    Використовуйте npm, коли package ще не переміщено до ClawHub, або коли потрібен
    прямий шлях встановлення npm під час міграції:

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
Для встановлень із npm `openclaw plugins install` установлює пакет у `~/.openclaw/npm` із вимкненими сценаріями життєвого циклу. Тримайте дерева залежностей плагінів суто JS/TS і уникайте пакетів, які потребують збірок `postinstall`.
</Info>

<Note>
Запуск Gateway не встановлює залежності плагінів. Потоки встановлення npm/git/ClawHub відповідають за узгодження залежностей; локальні плагіни вже повинні мати встановлені залежності.
</Note>

Метадані вбудованого пакета є явними, а не виводяться зі зібраного JavaScript під час запуску Gateway. Runtime-залежності належать пакету плагіна, який ними володіє; запуск упакованого OpenClaw ніколи не відновлює й не дзеркалює залежності плагінів.

## Пов’язане

- [Створення плагінів](/uk/plugins/building-plugins) — покроковий посібник для початку роботи
- [Маніфест Plugin](/uk/plugins/manifest) — повний довідник схеми маніфесту
- [Точки входу SDK](/uk/plugins/sdk-entrypoints) — `definePluginEntry` і `defineChannelPluginEntry`
