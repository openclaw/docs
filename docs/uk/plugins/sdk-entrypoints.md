---
read_when:
    - Потрібна точна сигнатура типу definePluginEntry або defineChannelPluginEntry
    - Ви хочете зрозуміти режим реєстрації (повний, налаштування чи метадані CLI)
    - Ви переглядаєте параметри точки входу
sidebarTitle: Entry Points
summary: Довідка щодо definePluginEntry, defineChannelPluginEntry і defineSetupPluginEntry
title: Точки входу Plugin
x-i18n:
    generated_at: "2026-05-06T03:09:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 296fded1572c4f95cc6c2eb8a7069a310ec05cce673003f81e86a916708cc85c
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Кожен Plugin експортує типовий об’єкт входу. SDK надає три допоміжні функції для
їх створення.

Для встановлених Plugin `package.json` має спрямовувати runtime-завантаження на зібраний
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

`extensions` і `setupEntry` залишаються чинними вихідними входами для розробки
в робочій області та git checkout. `runtimeExtensions` і `runtimeSetupEntry` є
бажаними, коли OpenClaw завантажує встановлений пакет, і дають змогу npm-пакетам
уникати runtime-компіляції TypeScript. Явні runtime-входи є обов’язковими: `runtimeSetupEntry`
потребує `setupEntry`, а відсутні артефакти `runtimeExtensions` або `runtimeSetupEntry`
спричиняють помилку встановлення/виявлення замість тихого повернення до джерела. Якщо
встановлений пакет оголошує лише вихідний вхід TypeScript, OpenClaw використає
відповідний зібраний одноранговий файл `dist/*.js`, коли він існує, а потім повернеться
до джерела TypeScript.

Усі шляхи входу мають залишатися всередині каталогу пакета Plugin. Runtime-входи
та виведені зібрані однорангові JavaScript-файли не роблять чинним вихідний шлях
`extensions` або `setupEntry`, що виходить за межі пакета.

<Tip>
  **Шукаєте покроковий приклад?** Див. [Channel Plugins](/uk/plugins/sdk-channel-plugins)
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

| Поле           | Тип                                                              | Обов’язкове | Типове значення        |
| -------------- | ---------------------------------------------------------------- | ----------- | ---------------------- |
| `id`           | `string`                                                         | Так         | -                      |
| `name`         | `string`                                                         | Так         | -                      |
| `description`  | `string`                                                         | Так         | -                      |
| `kind`         | `string`                                                         | Ні          | -                      |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Ні          | Схема порожнього об’єкта |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Так         | -                      |

- `id` має збігатися з вашим маніфестом `openclaw.plugin.json`.
- `kind` призначено для ексклюзивних слотів: `"memory"` або `"context-engine"`.
- `configSchema` може бути функцією для лінивого обчислення.
- OpenClaw розв’язує та мемоїзує цю схему під час першого доступу, тому дорогі
  побудовники схем виконуються лише один раз.

## `defineChannelPluginEntry`

**Імпорт:** `openclaw/plugin-sdk/channel-core`

Огортає `definePluginEntry` специфічним для каналу підключенням. Автоматично викликає
`api.registerChannel({ plugin })`, надає необов’язковий seam метаданих CLI для довідки
кореневого рівня та обмежує `registerFull` режимом реєстрації.

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

| Поле                  | Тип                                                              | Обов’язкове | Типове значення        |
| --------------------- | ---------------------------------------------------------------- | ----------- | ---------------------- |
| `id`                  | `string`                                                         | Так         | -                      |
| `name`                | `string`                                                         | Так         | -                      |
| `description`         | `string`                                                         | Так         | -                      |
| `plugin`              | `ChannelPlugin`                                                  | Так         | -                      |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Ні          | Схема порожнього об’єкта |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Ні          | -                      |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Ні          | -                      |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Ні          | -                      |

- `setRuntime` викликається під час реєстрації, щоб ви могли зберегти посилання на runtime
  (зазвичай через `createPluginRuntimeStore`). Його пропускають під час захоплення
  метаданих CLI.
- `registerCliMetadata` виконується під час `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"` і
  `api.registrationMode === "full"`.
  Використовуйте його як канонічне місце для CLI-дескрипторів, якими володіє канал, щоб довідка
  кореневого рівня залишалася без активації, знімки виявлення містили статичні метадані команд, а
  звичайна реєстрація CLI-команд залишалася сумісною з повними завантаженнями Plugin.
- Реєстрація виявлення є неактивуючою, але не вільною від імпортів. OpenClaw може
  виконати довірений вхід Plugin і модуль channel plugin, щоб побудувати
  знімок, тому тримайте імпорти верхнього рівня без побічних ефектів і розміщуйте сокети,
  клієнти, workers і сервіси за шляхами лише для `"full"`.
- `registerFull` виконується лише коли `api.registrationMode === "full"`. Його пропускають
  під час завантаження лише для налаштування.
- Як і `definePluginEntry`, `configSchema` може бути лінивою фабрикою, а OpenClaw
  мемоїзує розв’язану схему під час першого доступу.
- Для кореневих CLI-команд, якими володіє Plugin, віддавайте перевагу `api.registerCli(..., { descriptors: [...] })`,
  коли хочете, щоб команда залишалася ліниво завантажуваною, не зникаючи з
  дерева розбору кореневого CLI. Для channel plugins віддавайте перевагу реєстрації цих дескрипторів
  із `registerCliMetadata(...)` і тримайте `registerFull(...)` зосередженим на роботі лише runtime.
- Якщо `registerFull(...)` також реєструє gateway RPC-методи, тримайте їх на
  префіксі, специфічному для Plugin. Зарезервовані простори імен адміністрування ядра (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) завжди примусово переводяться в
  `operator.admin`.

## `defineSetupPluginEntry`

**Імпорт:** `openclaw/plugin-sdk/channel-core`

Для легкого файлу `setup-entry.ts`. Повертає лише `{ plugin }` без
runtime або CLI-підключення.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw завантажує його замість повного входу, коли канал вимкнений,
не налаштований або коли ввімкнено відкладене завантаження. Див.
[Налаштування та конфігурація](/uk/plugins/sdk-setup#setup-entry), щоб дізнатися, коли це важливо.

На практиці поєднуйте `defineSetupPluginEntry(...)` з вузькими сімействами допоміжних функцій
для налаштування:

- `openclaw/plugin-sdk/setup-runtime` для runtime-безпечних допоміжних функцій налаштування, як-от
  import-safe setup patch adapters, вивід lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries` і делеговані проксі налаштування
- `openclaw/plugin-sdk/channel-setup` для поверхонь налаштування optional-install
- `openclaw/plugin-sdk/setup-tools` для допоміжних функцій setup/install CLI/archive/docs

Тримайте важкі SDK, реєстрацію CLI та довгоживучі runtime-сервіси в повному
вході.

Вбудовані канали робочої області, які розділяють поверхні налаштування та runtime, можуть натомість використовувати
`defineBundledChannelSetupEntry(...)` з
`openclaw/plugin-sdk/channel-entry-contract`. Цей контракт дає змогу
входу налаштування зберігати setup-safe експорти plugin/secrets, водночас усе ще надаючи
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

Використовуйте цей вбудований контракт лише тоді, коли потокам налаштування справді потрібен легкий runtime
setter до завантаження повного входу каналу.

## Режим реєстрації

`api.registrationMode` повідомляє вашому Plugin, як його було завантажено:

| Режим             | Коли                              | Що реєструвати                                                                                                                   |
| ----------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | Звичайний запуск Gateway          | Усе                                                                                                                              |
| `"discovery"`     | Виявлення можливостей лише для читання | Реєстрація каналу плюс статичні CLI-дескриптори; код входу може завантажуватися, але пропускайте сокети, workers, клієнти та сервіси |
| `"setup-only"`    | Вимкнений/неналаштований канал    | Лише реєстрація каналу                                                                                                           |
| `"setup-runtime"` | Потік налаштування з доступним runtime | Реєстрація каналу плюс лише легкий runtime, потрібний до завантаження повного входу                                               |
| `"cli-metadata"`  | Коренева довідка / захоплення метаданих CLI | Лише CLI-дескриптори                                                                                                             |

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

Режим виявлення будує неактивуючий знімок реєстру. Він усе ще може виконати
вхід Plugin і об’єкт channel plugin, щоб OpenClaw міг зареєструвати можливості каналу
та статичні CLI-дескриптори. Сприймайте виконання модуля під час виявлення як
довірене, але легке: жодних мережевих клієнтів, підпроцесів, слухачів, підключень до баз даних,
фонових workers, читання облікових даних або інших живих runtime-побічних ефектів
на верхньому рівні.

Сприймайте `"setup-runtime"` як вікно, у якому мають існувати поверхні запуску лише для налаштування
без повторного входу в повний runtime вбудованого каналу. Добре підходять
реєстрація каналу, setup-safe HTTP-маршрути, setup-safe gateway-методи та
делеговані допоміжні функції налаштування. Важкі фонові сервіси, реєстратори CLI та
ініціалізації SDK provider/client усе ще належать до `"full"`.

Для реєстраторів CLI зокрема:

- використовуйте `descriptors`, коли реєстратор володіє однією або кількома кореневими командами і ви
  хочете, щоб OpenClaw ліниво завантажував справжній CLI-модуль під час першого виклику
- переконайтеся, що ці дескриптори охоплюють кожен корінь команди верхнього рівня, відкритий
  реєстратором
- обмежуйте назви команд дескрипторів літерами, цифрами, дефісом і підкресленням,
  починаючи з літери або цифри; OpenClaw відхиляє назви дескрипторів поза
  цією формою та вилучає послідовності керування терміналом з описів перед
  відображенням довідки
- використовуйте лише `commands` тільки для eager шляхів сумісності

## Форми Plugin

OpenClaw класифікує завантажені плагіни за їхньою поведінкою реєстрації:

| Форма                 | Опис                                               |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Один тип capability (наприклад, лише provider)     |
| **hybrid-capability** | Кілька типів capability (наприклад, provider + speech) |
| **hook-only**         | Лише hooks, без capabilities                       |
| **non-capability**    | Tools/commands/services, але без capabilities      |

Використовуйте `openclaw plugins inspect <id>`, щоб побачити форму плагіна.

## Пов’язане

- [Огляд SDK](/uk/plugins/sdk-overview) - API реєстрації та довідник subpath
- [Допоміжні засоби runtime](/uk/plugins/sdk-runtime) - `api.runtime` і `createPluginRuntimeStore`
- [Налаштування та конфігурація](/uk/plugins/sdk-setup) - manifest, точка входу setup, відкладене завантаження
- [Канальні плагіни](/uk/plugins/sdk-channel-plugins) - створення об’єкта `ChannelPlugin`
- [Provider-плагіни](/uk/plugins/sdk-provider-plugins) - реєстрація provider і hooks
