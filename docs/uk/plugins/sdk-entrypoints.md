---
read_when:
    - Потрібна точна сигнатура типу definePluginEntry або defineChannelPluginEntry
    - Ви хочете зрозуміти режим реєстрації (full проти setup проти метаданих CLI)
    - Ви переглядаєте параметри точки входу
sidebarTitle: Entry Points
summary: Довідник із definePluginEntry, defineChannelPluginEntry і defineSetupPluginEntry
title: Точки входу Plugin
x-i18n:
    generated_at: "2026-05-07T15:11:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2fecc65b8f196f3b40daee2e6087759b8786b033e1cd0c3d3b5695c9f8a3f66a
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Кожен plugin експортує типовий об’єкт входу. SDK надає три допоміжні засоби для
їх створення.

Для встановлених plugins `package.json` має спрямовувати завантаження runtime на зібраний
JavaScript, коли він доступний:

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

`extensions` і `setupEntry` залишаються чинними вихідними точками входу для розробки
в робочому просторі та git checkout. `runtimeExtensions` і `runtimeSetupEntry` є
бажаними, коли OpenClaw завантажує встановлений пакет, і дають змогу npm-пакетам
уникати runtime-компіляції TypeScript. Явні runtime-точки входу обов’язкові:
`runtimeSetupEntry` вимагає `setupEntry`, а відсутні артефакти `runtimeExtensions`
або `runtimeSetupEntry` спричиняють помилку встановлення/виявлення замість тихого
повернення до вихідного коду. Якщо встановлений пакет оголошує лише вихідну точку
входу TypeScript, OpenClaw використає відповідний зібраний peer `dist/*.js`, коли
він існує, а потім повернеться до вихідного TypeScript.

Усі шляхи входу мають залишатися всередині каталогу пакета plugin. Runtime-точки
входу та виведені зібрані JavaScript peers не роблять вихідний шлях `extensions` або
`setupEntry`, що виходить назовні, чинним.

<Tip>
  **Шукаєте покроковий огляд?** Див. [Channel Plugins](/uk/plugins/sdk-channel-plugins)
  або [Provider Plugins](/uk/plugins/sdk-provider-plugins) для покрокових посібників.
</Tip>

## `definePluginEntry`

**Імпорт:** `openclaw/plugin-sdk/plugin-entry`

Для provider plugins, tool plugins, hook plugins і всього, що **не є**
каналом обміну повідомленнями.

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

| Поле          | Тип                                                              | Обов’язково | Типове значення        |
| -------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`           | `string`                                                         | Так      | -                   |
| `name`         | `string`                                                         | Так      | -                   |
| `description`  | `string`                                                         | Так      | -                   |
| `kind`         | `string`                                                         | Ні       | -                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Ні       | Схема порожнього об’єкта |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Так      | -                   |

- `id` має відповідати вашому маніфесту `openclaw.plugin.json`.
- `kind` призначено для ексклюзивних слотів: `"memory"` або `"context-engine"`.
- `configSchema` може бути функцією для лінивого обчислення.
- OpenClaw розв’язує та мемоізує цю схему під час першого доступу, тому дорогі
  побудовники схем виконуються лише один раз.

## `defineChannelPluginEntry`

**Імпорт:** `openclaw/plugin-sdk/channel-core`

Огортає `definePluginEntry` проводкою, специфічною для каналів. Автоматично викликає
`api.registerChannel({ plugin })`, відкриває опційний seam метаданих CLI для root-help
і обмежує `registerFull` режимом реєстрації.

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

| Поле                 | Тип                                                              | Обов’язково | Типове значення        |
| --------------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`                  | `string`                                                         | Так      | -                   |
| `name`                | `string`                                                         | Так      | -                   |
| `description`         | `string`                                                         | Так      | -                   |
| `plugin`              | `ChannelPlugin`                                                  | Так      | -                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Ні       | Схема порожнього об’єкта |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Ні       | -                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Ні       | -                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Ні       | -                   |

- `setRuntime` викликається під час реєстрації, щоб ви могли зберегти посилання на runtime
  (зазвичай через `createPluginRuntimeStore`). Він пропускається під час
  захоплення метаданих CLI.
- `registerCliMetadata` виконується під час `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"` і
  `api.registrationMode === "full"`.
  Використовуйте його як канонічне місце для CLI-дескрипторів, якими володіє канал, щоб root help
  залишався неактивуючим, discovery-знімки містили статичні метадані команд, а
  звичайна реєстрація команд CLI залишалася сумісною з повним завантаженням plugin.
- Реєстрація discovery є неактивуючою, але не вільною від імпорту. OpenClaw може
  обчислювати довірену точку входу plugin і модуль channel plugin для побудови
  знімка, тому тримайте імпорти верхнього рівня без побічних ефектів і розміщуйте сокети,
  клієнти, workers та сервіси за шляхами лише для `"full"`.
- `registerFull` виконується лише коли `api.registrationMode === "full"`. Він пропускається
  під час setup-only завантаження.
- Як і `definePluginEntry`, `configSchema` може бути лінивою фабрикою, а OpenClaw
  мемоізує розв’язану схему під час першого доступу.
- Для root CLI-команд, якими володіє plugin, віддавайте перевагу `api.registerCli(..., { descriptors: [...] })`,
  коли потрібно, щоб команда залишалася ліниво завантажуваною, не зникаючи з
  дерева розбору root CLI. Для команд функцій paired-node віддавайте перевагу
  `api.registerNodeCliFeature(...)`, щоб команда потрапляла під `openclaw nodes`.
  Для інших вкладених команд plugin додайте `parentPath` і реєструйте команди на
  об’єкті `program`, переданому реєстратору; OpenClaw розв’язує його до
  батьківської команди перед викликом plugin. Для channel plugins віддавайте перевагу
  реєстрації цих дескрипторів із `registerCliMetadata(...)` і тримайте
  `registerFull(...)` зосередженим на роботі лише runtime.
- Якщо `registerFull(...)` також реєструє gateway RPC-методи, тримайте їх на
  префіксі, специфічному для plugin. Зарезервовані core admin namespaces (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) завжди примусово переводяться до
  `operator.admin`.

## `defineSetupPluginEntry`

**Імпорт:** `openclaw/plugin-sdk/channel-core`

Для легкого файла `setup-entry.ts`. Повертає лише `{ plugin }` без
runtime або CLI-проводки.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw завантажує це замість повної точки входу, коли канал вимкнено,
не налаштовано або коли ввімкнено відкладене завантаження. Див.
[Setup and Config](/uk/plugins/sdk-setup#setup-entry), щоб дізнатися, коли це важливо.

На практиці поєднуйте `defineSetupPluginEntry(...)` з вузькими сімействами
допоміжних засобів setup:

- `openclaw/plugin-sdk/setup-runtime` для runtime-безпечних setup-допоміжних засобів, таких як
  import-safe setup patch adapters, lookup-note output,
  `promptResolvedAllowFrom`, `splitSetupEntries` і делеговані setup proxies
- `openclaw/plugin-sdk/channel-setup` для optional-install setup surfaces
- `openclaw/plugin-sdk/setup-tools` для setup/install CLI/archive/docs допоміжних засобів

Тримайте важкі SDK, реєстрацію CLI і довгоживучі runtime-сервіси в повній
точці входу.

Bundled workspace channels, які розділяють setup і runtime surfaces, можуть натомість використовувати
`defineBundledChannelSetupEntry(...)` з
`openclaw/plugin-sdk/channel-entry-contract`. Цей контракт дає setup-точці входу змогу
зберігати setup-safe plugin/secrets exports, водночас усе ще відкриваючи
runtime setter:

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
});
```

Використовуйте цей bundled contract лише тоді, коли setup flows справді потребують легкого runtime
setter до завантаження повної точки входу каналу.

## Режим реєстрації

`api.registrationMode` повідомляє вашому plugin, як його було завантажено:

| Режим              | Коли                              | Що реєструвати                                                                                                         |
| ----------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | Звичайний запуск gateway          | Усе                                                                                                                    |
| `"discovery"`     | Виявлення можливостей лише для читання | Реєстрація каналу плюс статичні CLI-дескриптори; код точки входу може завантажуватися, але пропускайте сокети, workers, клієнти й сервіси |
| `"setup-only"`    | Вимкнений/не налаштований канал   | Лише реєстрація каналу                                                                                                  |
| `"setup-runtime"` | Setup flow із доступним runtime   | Реєстрація каналу плюс лише легкий runtime, потрібний до завантаження повної точки входу                                |
| `"cli-metadata"`  | Захоплення root help / метаданих CLI | Лише CLI-дескриптори                                                                                                    |

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

Режим discovery будує неактивуючий знімок реєстру. Він усе ще може обчислювати
точку входу plugin і об’єкт channel plugin, щоб OpenClaw міг реєструвати можливості
каналу та статичні CLI-дескриптори. Сприймайте обчислення модуля в discovery як
довірене, але легке: жодних мережевих клієнтів, subprocesses, listeners, підключень до баз даних,
background workers, читання облікових даних або інших live runtime побічних ефектів на верхньому рівні.

Сприймайте `"setup-runtime"` як вікно, у якому startup surfaces лише для setup мають
існувати без повторного входу в повний bundled channel runtime. Добре підходять
реєстрація каналу, setup-safe HTTP routes, setup-safe gateway methods і
делеговані setup helpers. Важкі background services, CLI registrars і
provider/client SDK bootstraps усе ще належать до `"full"`.

Окремо для CLI registrars:

- використовуйте `descriptors`, коли реєстратор володіє однією або кількома кореневими командами і ви
  хочете, щоб OpenClaw ліниво завантажував справжній модуль CLI під час першого виклику
- переконайтеся, що ці дескриптори охоплюють кожен корінь команди верхнього рівня, який відкриває
  реєстратор
- обмежуйте імена команд дескрипторів літерами, цифрами, дефісом і підкресленням,
  починаючи з літери або цифри; OpenClaw відхиляє імена дескрипторів поза
  цією формою та видаляє керівні послідовності термінала з описів перед
  відображенням довідки
- використовуйте лише `commands` тільки для шляхів нетерплячої сумісності

## Форми Plugin

OpenClaw класифікує завантажені plugins за їхньою поведінкою реєстрації:

| Форма                 | Опис                                               |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Один тип можливості (наприклад, лише provider)     |
| **hybrid-capability** | Кілька типів можливостей (наприклад, provider + speech) |
| **hook-only**         | Лише хуки, без можливостей                         |
| **non-capability**    | Інструменти/команди/сервіси, але без можливостей  |

Використовуйте `openclaw plugins inspect <id>`, щоб побачити форму plugin.

## Пов’язане

- [Огляд SDK](/uk/plugins/sdk-overview) - API реєстрації та довідник підшляхів
- [Допоміжні засоби Runtime](/uk/plugins/sdk-runtime) - `api.runtime` і `createPluginRuntimeStore`
- [Налаштування та конфігурація](/uk/plugins/sdk-setup) - маніфест, точка входу налаштування, відкладене завантаження
- [Channel Plugins](/uk/plugins/sdk-channel-plugins) - побудова об’єкта `ChannelPlugin`
- [Provider Plugins](/uk/plugins/sdk-provider-plugins) - реєстрація provider і хуки
