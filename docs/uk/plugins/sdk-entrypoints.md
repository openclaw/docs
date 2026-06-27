---
read_when:
    - Вам потрібна точна сигнатура типу defineToolPlugin, definePluginEntry або defineChannelPluginEntry
    - Ви хочете зрозуміти режим реєстрації (full vs setup vs метадані CLI)
    - Ви переглядаєте параметри точки входу
sidebarTitle: Entry Points
summary: Довідник для defineToolPlugin, definePluginEntry, defineChannelPluginEntry і defineSetupPluginEntry
title: Точки входу Plugin
x-i18n:
    generated_at: "2026-06-27T18:04:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 49c024020202b754bde9bfa3f2a880332f1a5b4b19b397e59ae83c2673871211
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Кожен Plugin експортує типовий об’єкт входу. SDK надає допоміжні засоби для
їх створення.

Для встановлених Plugin `package.json` має спрямовувати завантаження середовища
виконання на зібраний JavaScript, коли він доступний:

```json
{
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "setupEntry": "./src/setup-entry.ts",
    "runtimeSetupEntry": "./dist/setup-entry.js"
  }
}
```

`extensions` і `setupEntry` залишаються чинними вихідними точками входу для
розробки в робочому просторі та git checkout. `runtimeExtensions` і
`runtimeSetupEntry` є бажаними, коли OpenClaw завантажує встановлений пакет, і
дозволяють npm-пакетам уникати компіляції TypeScript під час виконання. Явні
точки входу середовища виконання є обов’язковими: `runtimeSetupEntry` вимагає
`setupEntry`, а відсутні артефакти `runtimeExtensions` або `runtimeSetupEntry`
спричиняють помилку встановлення/виявлення замість мовчазного повернення до
вихідного коду. Якщо встановлений пакет оголошує лише вихідну точку входу
TypeScript, OpenClaw використає відповідний зібраний peer `dist/*.js`, коли він
існує, а потім повернеться до вихідного коду TypeScript.

Усі шляхи точок входу мають залишатися всередині каталогу пакета Plugin. Точки
входу середовища виконання та виведені зібрані JavaScript peer не роблять
дійсним вихідний шлях `extensions` або `setupEntry`, що виходить за межі
каталогу.

<Tip>
  **Шукаєте покроковий посібник?** Див. [Інструментальні Plugin](/uk/plugins/tool-plugins),
  [Канальні Plugin](/uk/plugins/sdk-channel-plugins) або
  [Провайдерські Plugin](/uk/plugins/sdk-provider-plugins) для покрокових інструкцій.
</Tip>

## `defineToolPlugin`

**Імпорт:** `openclaw/plugin-sdk/tool-plugin`

Для простих Plugin, які лише додають інструменти агента. `defineToolPlugin`
зберігає вихідний код авторингу невеликим, виводить типи конфігурації та
параметрів інструментів зі схем TypeBox, обгортає звичайні повернені значення у
формат результату інструмента OpenClaw і надає статичні метадані, які
`openclaw plugins build` записує в маніфест Plugin.

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

export default defineToolPlugin({
  id: "stock-quotes",
  name: "Stock Quotes",
  description: "Fetch stock quotes.",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "API key." })),
  }),
  tools: (tool) => [
    tool({
      name: "quote",
      label: "Quote",
      description: "Fetch a quote.",
      parameters: Type.Object({
        symbol: Type.String({ description: "Ticker symbol." }),
      }),
      execute: async ({ symbol }, config) => ({ symbol, hasKey: Boolean(config.apiKey) }),
    }),
  ],
});
```

- `configSchema` є необов’язковою. Якщо її пропущено, OpenClaw використовує
  строгу схему порожнього об’єкта, а згенерований маніфест усе одно містить
  `configSchema`.
- `execute` повертає звичайний рядок або JSON-серіалізоване значення. Допоміжний
  засіб обгортає його як текстовий результат інструмента з `details`.
- Імена інструментів статичні. `openclaw plugins build` виводить
  `contracts.tools` з оголошених інструментів, тому авторам не потрібно
  дублювати імена вручну.
- Завантаження середовища виконання залишається строгим. Установленим Plugin все
  ще потрібні `openclaw.plugin.json` і `openclaw.extensions` у `package.json`;
  OpenClaw не виконує код Plugin, щоб вивести відсутні дані маніфесту.

## `definePluginEntry`

**Імпорт:** `openclaw/plugin-sdk/plugin-entry`

Для провайдерських Plugin, розширених інструментальних Plugin, Plugin із hook та
всього, що **не** є каналом обміну повідомленнями.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Short summary",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
  },
});
```

| Поле          | Тип                                                              | Обов’язково | За замовчуванням        |
| ------------- | ---------------------------------------------------------------- | ----------- | ----------------------- |
| `id`          | `string`                                                         | Так         | -                       |
| `name`        | `string`                                                         | Так         | -                       |
| `description` | `string`                                                         | Так         | -                       |
| `kind`        | `string`                                                         | Ні          | -                       |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Ні          | Схема порожнього об’єкта |
| `register`    | `(api: OpenClawPluginApi) => void`                               | Так         | -                       |

- `id` має збігатися з вашим маніфестом `openclaw.plugin.json`.
- `kind` призначений для ексклюзивних слотів: `"memory"` або `"context-engine"`.
- `configSchema` може бути функцією для лінивого обчислення.
- OpenClaw розв’язує та мемоїзує цю схему під час першого доступу, тому дорогі
  побудовники схем виконуються лише один раз.

## `defineChannelPluginEntry`

**Імпорт:** `openclaw/plugin-sdk/channel-core`

Обгортає `definePluginEntry` канальною проводкою. Автоматично викликає
`api.registerChannel({ plugin })`, надає необов’язковий шов метаданих CLI
кореневої довідки та обмежує `registerFull` режимом реєстрації.

```typescript
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineChannelPluginEntry({
  id: "my-channel",
  name: "My Channel",
  description: "Short summary",
  plugin: myChannelPlugin,
  setRuntime: setMyRuntime,
  registerCliMetadata(api) {
    api.registerCli(/* ... */);
  },
  registerFull(api) {
    api.registerGatewayMethod(/* ... */);
  },
});
```

| Поле                 | Тип                                                              | Обов’язково | За замовчуванням        |
| -------------------- | ---------------------------------------------------------------- | ----------- | ----------------------- |
| `id`                 | `string`                                                         | Так         | -                       |
| `name`               | `string`                                                         | Так         | -                       |
| `description`        | `string`                                                         | Так         | -                       |
| `plugin`             | `ChannelPlugin`                                                  | Так         | -                       |
| `configSchema`       | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Ні          | Схема порожнього об’єкта |
| `setRuntime`         | `(runtime: PluginRuntime) => void`                               | Ні          | -                       |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                              | Ні          | -                       |
| `registerFull`       | `(api: OpenClawPluginApi) => void`                              | Ні          | -                       |

- `setRuntime` викликається під час реєстрації, щоб ви могли зберегти посилання
  на середовище виконання (зазвичай через `createPluginRuntimeStore`). Під час
  захоплення метаданих CLI його пропускають.
- `registerCliMetadata` виконується під час `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"` і
  `api.registrationMode === "full"`.
  Використовуйте його як канонічне місце для CLI-дескрипторів, якими володіє
  канал, щоб коренева довідка залишалася без активації, знімки виявлення
  містили статичні метадані команд, а звичайна реєстрація команд CLI лишалася
  сумісною з повними завантаженнями Plugin.
- Реєстрація виявлення є безактиваційною, але не безімпортною. OpenClaw може
  обчислювати довірену точку входу Plugin і модуль канального Plugin, щоб
  побудувати знімок, тому тримайте імпорти верхнього рівня без побічних ефектів,
  а сокети, клієнти, workers і сервіси розміщуйте за шляхами лише для `"full"`.
- `registerFull` виконується лише коли `api.registrationMode === "full"`. Його
  пропускають під час завантаження лише для налаштування.
- Як і `definePluginEntry`, `configSchema` може бути лінивою фабрикою, а
  OpenClaw мемоїзує розв’язану схему під час першого доступу.
- Для кореневих команд CLI, якими володіє Plugin, віддавайте перевагу
  `api.registerCli(..., { descriptors: [...] })`, коли хочете, щоб команда
  лишалася ліниво завантажуваною, але не зникала з дерева розбору кореневого CLI.
  Для команд можливостей парних вузлів віддавайте перевагу
  `api.registerNodeCliFeature(...)`, щоб команда потрапила під `openclaw nodes`.
  Для інших вкладених команд Plugin додайте `parentPath` і реєструйте команди на
  об’єкті `program`, переданому реєстратору; OpenClaw розв’язує його до
  батьківської команди перед викликом Plugin. Для канальних Plugin віддавайте
  перевагу реєстрації цих дескрипторів із `registerCliMetadata(...)` і
  зосереджуйте `registerFull(...)` на роботі лише середовища виконання.
- Якщо `registerFull(...)` також реєструє RPC-методи Gateway, тримайте їх на
  префіксі, специфічному для Plugin. Зарезервовані простори імен адміністрування
  ядра (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) завжди
  примусово переводяться в `operator.admin`.

## `defineSetupPluginEntry`

**Імпорт:** `openclaw/plugin-sdk/channel-core`

Для легкого файла `setup-entry.ts`. Повертає лише `{ plugin }` без проводки
середовища виконання або CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw завантажує це замість повної точки входу, коли канал вимкнено,
не налаштовано або коли ввімкнено відкладене завантаження. Див.
[Налаштування та конфігурація](/uk/plugins/sdk-setup#setup-entry), щоб дізнатися,
коли це має значення.

На практиці поєднуйте `defineSetupPluginEntry(...)` із вузькими сімействами
допоміжних засобів налаштування:

- `openclaw/plugin-sdk/setup-runtime` для безпечних для середовища виконання
  допоміжних засобів налаштування, таких як `createSetupTranslator`,
  import-safe адаптери патчів налаштування, вивід нотаток пошуку,
  `promptResolvedAllowFrom`, `splitSetupEntries` і делеговані проксі
  налаштування
- `openclaw/plugin-sdk/channel-setup` для поверхонь налаштування необов’язкового
  встановлення
- `openclaw/plugin-sdk/setup-tools` для допоміжних засобів CLI/архіву/документації
  для налаштування/встановлення

Тримайте важкі SDK, реєстрацію CLI та довгоживучі сервіси середовища виконання
у повній точці входу.

Вбудовані канали робочого простору, які розділяють поверхні налаштування та
середовища виконання, можуть натомість використовувати
`defineBundledChannelSetupEntry(...)` з
`openclaw/plugin-sdk/channel-entry-contract`. Цей контракт дозволяє точці входу
налаштування зберігати безпечні для налаштування експорти Plugin/secrets, водночас
надаючи setter середовища виконання:

```typescript
import { defineBundledChannelSetupEntry } from "openclaw/plugin-sdk/channel-entry-contract";

export default defineBundledChannelSetupEntry({
  importMetaUrl: import.meta.url,
  plugin: {
    specifier: "./channel-plugin-api.js",
    exportName: "myChannelPlugin",
  },
  runtime: {
    specifier: "./runtime-api.js",
    exportName: "setMyChannelRuntime",
  },
  registerSetupRuntime(api) {
    api.registerHttpRoute({
      path: "/my-channel/events",
      auth: "plugin",
      handler: async (req, res) => {
        /* setup-safe route */
      },
    });
  },
});
```

Використовуйте цей вбудований контракт лише тоді, коли потокам налаштування
справді потрібен легкий setter середовища виконання або безпечна для
налаштування поверхня Gateway до завантаження повної точки входу каналу.
`registerSetupRuntime` виконується лише для завантажень `"setup-runtime"`; тримайте
його обмеженим маршрутами або методами лише для конфігурації, які мають існувати
до відкладеної повної активації.

## Режим реєстрації

`api.registrationMode` повідомляє вашому Plugin, як його було завантажено:

| Режим             | Коли                              | Що реєструвати                                                                                                                     |
| ----------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | Звичайний запуск Gateway          | Усе                                                                                                                                |
| `"discovery"`     | Виявлення можливостей лише для читання | Реєстрація каналу плюс статичні дескриптори CLI; вхідний код може завантажуватися, але пропускайте сокети, воркери, клієнти й сервіси |
| `"setup-only"`    | Вимкнений/неналаштований канал    | Лише реєстрація каналу                                                                                                             |
| `"setup-runtime"` | Потік налаштування з доступним runtime | Реєстрація каналу плюс лише легкий runtime, потрібний до завантаження повного входу                                                |
| `"cli-metadata"`  | Коренева довідка / захоплення метаданих CLI | Лише дескриптори CLI                                                                                                               |

`defineChannelPluginEntry` обробляє цей поділ автоматично. Якщо ви використовуєте
`definePluginEntry` безпосередньо для каналу, перевіряйте режим самостійно:

```typescript
register(api) {
  if (
    api.registrationMode === "cli-metadata" ||
    api.registrationMode === "discovery" ||
    api.registrationMode === "full"
  ) {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Heavy runtime-only registrations
  api.registerService(/* ... */);
}
```

Режим виявлення створює знімок реєстру без активації. Він усе ще може виконувати
вхід Plugin і об’єкт канального Plugin, щоб OpenClaw міг зареєструвати можливості
каналу та статичні дескриптори CLI. Сприймайте оцінювання модулів під час виявлення як
довірене, але легке: жодних мережевих клієнтів, підпроцесів, слухачів, підключень до бази
даних, фонових воркерів, читання облікових даних чи інших живих побічних ефектів runtime
на верхньому рівні.

Сприймайте `"setup-runtime"` як вікно, у якому поверхні запуску лише для налаштування мають
існувати без повторного входу в повний runtime вбудованого каналу. Добре підходять
реєстрація каналу, безпечні для налаштування HTTP-маршрути, безпечні для налаштування
методи Gateway і делеговані помічники налаштування. Важкі фонові сервіси, реєстратори CLI
та початкове завантаження SDK провайдерів/клієнтів усе ще належать до `"full"`.

Зокрема для реєстраторів CLI:

- використовуйте `descriptors`, коли реєстратор володіє однією або кількома кореневими командами, і ви
  хочете, щоб OpenClaw ліниво завантажував справжній модуль CLI під час першого виклику
- переконайтеся, що ці дескриптори покривають кожен корінь команди верхнього рівня, який відкриває
  реєстратор
- обмежуйте імена команд у дескрипторах літерами, цифрами, дефісом і підкресленням,
  починаючи з літери або цифри; OpenClaw відхиляє імена дескрипторів поза
  цією формою та вилучає керівні послідовності термінала з описів перед
  відображенням довідки
- використовуйте лише `commands` тільки для шляхів сумісності з негайним завантаженням

## Форми Plugin

OpenClaw класифікує завантажені plugins за їхньою поведінкою реєстрації:

| Форма                 | Опис                                               |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Один тип можливості (наприклад, лише провайдер)    |
| **hybrid-capability** | Кілька типів можливостей (наприклад, провайдер + мовлення) |
| **hook-only**         | Лише хуки, без можливостей                         |
| **non-capability**    | Інструменти/команди/сервіси, але без можливостей   |

Використовуйте `openclaw plugins inspect <id>`, щоб побачити форму plugin.

## Пов’язане

- [Огляд SDK](/uk/plugins/sdk-overview) - API реєстрації та довідник підшляхів
- [Помічники runtime](/uk/plugins/sdk-runtime) - `api.runtime` і `createPluginRuntimeStore`
- [Налаштування та конфігурація](/uk/plugins/sdk-setup) - маніфест, вхід налаштування, відкладене завантаження
- [Канальні Plugins](/uk/plugins/sdk-channel-plugins) - побудова об’єкта `ChannelPlugin`
- [Plugins провайдерів](/uk/plugins/sdk-provider-plugins) - реєстрація провайдера та хуки
