---
read_when:
    - Вам потрібна точна сигнатура типу `definePluginEntry` або `defineChannelPluginEntry`
    - Ви хочете зрозуміти режим реєстрації (повний, налаштування чи метадані CLI)
    - Ви шукаєте параметри точки входу
sidebarTitle: Entry Points
summary: Довідка щодо definePluginEntry, defineChannelPluginEntry і defineSetupPluginEntry
title: Точки входу Plugin
x-i18n:
    generated_at: "2026-05-01T21:40:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: a29e7e12c38fb579bb78a0e1e753edafc43298c2795504969c3477c849a5d74d
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Кожен Plugin експортує стандартний об’єкт входу. SDK надає три допоміжні функції для
їх створення.

Для встановлених Plugins `package.json` має спрямовувати завантаження runtime на зібраний
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
у workspace та git checkout. `runtimeExtensions` і `runtimeSetupEntry` є бажаними,
коли OpenClaw завантажує встановлений пакет, і дають змогу npm-пакетам уникати runtime-компіляції
TypeScript. Явні runtime-точки входу є обов’язковими: `runtimeSetupEntry`
потребує `setupEntry`, а відсутні артефакти `runtimeExtensions` або `runtimeSetupEntry`
призводять до помилки встановлення чи виявлення замість мовчазного fallback до джерела. Якщо
встановлений пакет оголошує лише вихідну точку входу TypeScript, OpenClaw використає
відповідний зібраний peer `dist/*.js`, коли він існує, а потім fallback до вихідного
TypeScript.

Усі шляхи точок входу мають залишатися всередині каталогу пакета Plugin. Runtime-точки входу
та виведені зібрані JavaScript peers не роблять чинним вихідний шлях `extensions` або
`setupEntry`, який виходить за межі пакета.

<Tip>
  **Потрібен покроковий огляд?** Див. [Channel Plugins](/uk/plugins/sdk-channel-plugins)
  або [Provider Plugins](/uk/plugins/sdk-provider-plugins) для покрокових посібників.
</Tip>

## `definePluginEntry`

**Імпорт:** `openclaw/plugin-sdk/plugin-entry`

Для provider Plugins, tool Plugins, hook Plugins і всього, що **не є**
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

| Поле          | Тип                                                              | Обов’язкове | Типово                    |
| ------------- | ---------------------------------------------------------------- | ----------- | ------------------------- |
| `id`          | `string`                                                         | Так         | —                         |
| `name`        | `string`                                                         | Так         | —                         |
| `description` | `string`                                                         | Так         | —                         |
| `kind`        | `string`                                                         | Ні          | —                         |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Ні          | Схема порожнього об’єкта |
| `register`    | `(api: OpenClawPluginApi) => void`                               | Так         | —                         |

- `id` має відповідати вашому маніфесту `openclaw.plugin.json`.
- `kind` призначений для ексклюзивних слотів: `"memory"` або `"context-engine"`.
- `configSchema` може бути функцією для відкладеного обчислення.
- OpenClaw розв’язує та memoizes цю схему під час першого доступу, тому затратні побудовники схем
  виконуються лише один раз.

## `defineChannelPluginEntry`

**Імпорт:** `openclaw/plugin-sdk/channel-core`

Огортає `definePluginEntry` із wiring, специфічним для каналу. Автоматично викликає
`api.registerChannel({ plugin })`, надає необов’язковий seam метаданих CLI для root-help
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

| Поле                 | Тип                                                              | Обов’язкове | Типово                    |
| -------------------- | ---------------------------------------------------------------- | ----------- | ------------------------- |
| `id`                 | `string`                                                         | Так         | —                         |
| `name`               | `string`                                                         | Так         | —                         |
| `description`        | `string`                                                         | Так         | —                         |
| `plugin`             | `ChannelPlugin`                                                  | Так         | —                         |
| `configSchema`       | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Ні          | Схема порожнього об’єкта |
| `setRuntime`         | `(runtime: PluginRuntime) => void`                               | Ні          | —                         |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Ні          | —                         |
| `registerFull`       | `(api: OpenClawPluginApi) => void`                               | Ні          | —                         |

- `setRuntime` викликається під час реєстрації, щоб ви могли зберегти посилання на runtime
  (зазвичай через `createPluginRuntimeStore`). Під час захоплення метаданих CLI його пропускають.
- `registerCliMetadata` виконується під час `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"` та
  `api.registrationMode === "full"`.
  Використовуйте його як канонічне місце для CLI-дескрипторів, що належать каналу, щоб root help
  залишалася без активації, знімки виявлення містили статичні метадані команд, а
  звичайна реєстрація CLI-команд залишалася сумісною з повними завантаженнями Plugin.
- Реєстрація виявлення є неактивуючою, але не вільною від імпорту. OpenClaw може
  виконати довірену точку входу Plugin і модуль channel Plugin для побудови
  знімка, тому тримайте top-level imports без побічних ефектів і розміщуйте sockets,
  clients, workers і services за шляхами лише для `"full"`.
- `registerFull` виконується лише коли `api.registrationMode === "full"`. Його пропускають
  під час завантаження лише для setup.
- Як і `definePluginEntry`, `configSchema` може бути відкладеною фабрикою, а OpenClaw
  memoizes розв’язану схему під час першого доступу.
- Для root CLI-команд, що належать Plugin, надавайте перевагу `api.registerCli(..., { descriptors: [...] })`,
  коли хочете, щоб команда залишалася lazy-loaded, не зникаючи з
  дерева розбору root CLI. Для channel Plugins надавайте перевагу реєстрації цих дескрипторів
  із `registerCliMetadata(...)` і тримайте `registerFull(...)` зосередженим на роботі лише runtime.
- Якщо `registerFull(...)` також реєструє методи Gateway RPC, тримайте їх на
  префіксі, специфічному для Plugin. Зарезервовані core admin namespaces (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) завжди примусово переводяться в
  `operator.admin`.

## `defineSetupPluginEntry`

**Імпорт:** `openclaw/plugin-sdk/channel-core`

Для легкого файла `setup-entry.ts`. Повертає лише `{ plugin }` без
runtime або CLI wiring.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw завантажує це замість повної точки входу, коли канал вимкнений,
не налаштований або коли ввімкнене відкладене завантаження. Див.
[Setup and Config](/uk/plugins/sdk-setup#setup-entry), щоб дізнатися, коли це має значення.

На практиці поєднуйте `defineSetupPluginEntry(...)` із вузькими сімействами setup helpers:

- `openclaw/plugin-sdk/setup-runtime` для runtime-safe setup helpers, таких як
  import-safe setup patch adapters, lookup-note output,
  `promptResolvedAllowFrom`, `splitSetupEntries` і делеговані setup proxies
- `openclaw/plugin-sdk/channel-setup` для optional-install setup surfaces
- `openclaw/plugin-sdk/setup-tools` для setup/install CLI/archive/docs helpers

Тримайте важкі SDK, реєстрацію CLI та довгоживучі runtime-сервіси у повній
точці входу.

Bundled workspace channels, які розділяють setup і runtime surfaces, можуть натомість використовувати
`defineBundledChannelSetupEntry(...)` з
`openclaw/plugin-sdk/channel-entry-contract`. Цей contract дає setup entry змогу
зберігати setup-safe plugin/secrets exports, водночас усе ще надаючи
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

`api.registrationMode` повідомляє вашому Plugin, як його було завантажено:

| Режим             | Коли                              | Що реєструвати                                                                                                         |
| ----------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | Звичайний запуск Gateway          | Усе                                                                                                                    |
| `"discovery"`     | Read-only capability discovery    | Реєстрація каналу плюс статичні CLI-дескриптори; код точки входу може завантажуватися, але пропускайте sockets, workers, clients і services |
| `"setup-only"`    | Вимкнений/неналаштований канал    | Лише реєстрація каналу                                                                                                 |
| `"setup-runtime"` | Setup flow з доступним runtime    | Реєстрація каналу плюс лише легкий runtime, потрібний до завантаження повної точки входу                               |
| `"cli-metadata"`  | Root help / захоплення метаданих CLI | Лише CLI-дескриптори                                                                                                   |

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

Режим discovery будує неактивуючий знімок реєстру. Він все ще може виконати
точку входу Plugin і об’єкт channel Plugin, щоб OpenClaw міг зареєструвати
можливості каналу та статичні CLI-дескриптори. Ставтеся до виконання модуля в discovery як до
довіреного, але легкого: жодних network clients, subprocesses, listeners, database
connections, background workers, credential reads або інших live runtime side
effects на top level.

Сприймайте `"setup-runtime"` як вікно, у якому setup-only startup surfaces мають
існувати без повторного входу в повний bundled channel runtime. Добре підходять
реєстрація каналу, setup-safe HTTP routes, setup-safe Gateway methods і
делеговані setup helpers. Важкі background services, CLI registrars і
provider/client SDK bootstraps усе ще належать до `"full"`.

Для CLI registrars зокрема:

- використовуйте `descriptors`, коли registrar володіє однією чи кількома root-командами і ви
  хочете, щоб OpenClaw lazy-load реальний CLI-модуль під час першого виклику
- переконайтеся, що ці descriptors покривають кожен root top-level command, який надає
  registrar
- обмежуйте імена команд descriptors літерами, цифрами, дефісом і підкресленням,
  починаючи з літери або цифри; OpenClaw відхиляє імена descriptors поза
  цією формою та видаляє terminal control sequences з описів перед
  відтворенням help
- використовуйте лише `commands` тільки для eager compatibility paths

## Форми Plugin

OpenClaw класифікує завантажені плагіни за їхньою поведінкою реєстрації:

| Форма                 | Опис                                               |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Один тип можливості (наприклад, лише provider)     |
| **hybrid-capability** | Кілька типів можливостей (наприклад, provider + speech) |
| **hook-only**         | Лише hooks, без можливостей                        |
| **non-capability**    | Tools/commands/services, але без можливостей       |

Використовуйте `openclaw plugins inspect <id>`, щоб переглянути форму плагіна.

## Пов’язане

- [Огляд SDK](/uk/plugins/sdk-overview) — API реєстрації та довідник subpath
- [Допоміжні засоби Runtime](/uk/plugins/sdk-runtime) — `api.runtime` і `createPluginRuntimeStore`
- [Налаштування та конфігурація](/uk/plugins/sdk-setup) — manifest, setup entry, відкладене завантаження
- [Channel Plugins](/uk/plugins/sdk-channel-plugins) — створення об’єкта `ChannelPlugin`
- [Provider Plugins](/uk/plugins/sdk-provider-plugins) — реєстрація provider і hooks
