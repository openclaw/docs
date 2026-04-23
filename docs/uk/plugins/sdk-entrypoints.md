---
read_when:
    - Вам потрібен точний сигнатурний тип `definePluginEntry` або `defineChannelPluginEntry`
    - Ви хочете зрозуміти режим реєстрації (`full` vs `setup` vs метадані CLI)
    - Ви шукаєте параметри точок входу
sidebarTitle: Entry Points
summary: Довідник для `definePluginEntry`, `defineChannelPluginEntry` і `defineSetupPluginEntry`
title: Точки входу Plugin-а
x-i18n:
    generated_at: "2026-04-23T21:03:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 517559e16416cbf9d152a0ca2e09f57de92ff65277fec768cbaf38d9de62e051
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

Кожен Plugin експортує типовий entry object. SDK надає три helper-и для
їх створення.

Для встановлених Plugin-ів `package.json` має вказувати runtime-завантаження на зібраний
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

`extensions` і `setupEntry` залишаються коректними source-entry для розробки у workspace і git
checkout. `runtimeExtensions` і `runtimeSetupEntry` мають пріоритет,
коли OpenClaw завантажує встановлений package, і дозволяють npm-пакетам уникати runtime-компіляції TypeScript. Якщо встановлений package оголошує лише source-entry TypeScript, OpenClaw використає відповідний зібраний peer `dist/*.js`, коли він існує, а потім повернеться до source TypeScript.

Усі шляхи entry мають залишатися всередині каталогу package Plugin-а. Runtime entry
і виведені peer-и зібраного JavaScript не роблять escaping-source-path у `extensions` або
`setupEntry` коректним.

<Tip>
  **Шукаєте покроковий посібник?** Див. [Channel Plugins](/uk/plugins/sdk-channel-plugins)
  або [Provider Plugins](/uk/plugins/sdk-provider-plugins) для покрокових інструкцій.
</Tip>

## `definePluginEntry`

**Імпорт:** `openclaw/plugin-sdk/plugin-entry`

Для Plugin-ів provider-ів, Plugin-ів інструментів, Plugin-ів hooks і всього, що **не є**
каналом повідомлень.

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

| Поле          | Тип                                                              | Обов’язково | Типове значення      |
| ------------- | ---------------------------------------------------------------- | ----------- | -------------------- |
| `id`          | `string`                                                         | Так         | —                    |
| `name`        | `string`                                                         | Так         | —                    |
| `description` | `string`                                                         | Так         | —                    |
| `kind`        | `string`                                                         | Ні          | —                    |
| `configSchema`| `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Ні          | Порожня object schema |
| `register`    | `(api: OpenClawPluginApi) => void`                               | Так         | —                    |

- `id` має збігатися з вашим manifest `openclaw.plugin.json`.
- `kind` призначено для виключних slot-ів: `"memory"` або `"context-engine"`.
- `configSchema` може бути функцією для лінивого обчислення.
- OpenClaw визначає й memoizes цю schema при першому доступі, тож дорогі schema-builder-и
  запускаються лише один раз.

## `defineChannelPluginEntry`

**Імпорт:** `openclaw/plugin-sdk/channel-core`

Обгортає `definePluginEntry` специфічним для каналу wiring. Автоматично викликає
`api.registerChannel({ plugin })`, надає необов’язковий seam метаданих CLI root-help і шлюзує `registerFull` за режимом реєстрації.

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

| Поле                  | Тип                                                              | Обов’язково | Типове значення      |
| --------------------- | ---------------------------------------------------------------- | ----------- | -------------------- |
| `id`                  | `string`                                                         | Так         | —                    |
| `name`                | `string`                                                         | Так         | —                    |
| `description`         | `string`                                                         | Так         | —                    |
| `plugin`              | `ChannelPlugin`                                                  | Так         | —                    |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Ні          | Порожня object schema |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Ні          | —                    |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Ні          | —                    |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Ні          | —                    |

- `setRuntime` викликається під час реєстрації, щоб ви могли зберегти посилання на runtime
  (зазвичай через `createPluginRuntimeStore`). Він пропускається під час захоплення
  метаданих CLI.
- `registerCliMetadata` виконується і під час `api.registrationMode === "cli-metadata"`,
  і під час `api.registrationMode === "full"`.
  Використовуйте його як канонічне місце для дескрипторів CLI, якими володіє канал, щоб root help
  залишався без активації, водночас звичайна реєстрація команд CLI залишалася сумісною
  з повним завантаженням Plugin-а.
- `registerFull` виконується лише коли `api.registrationMode === "full"`. Він пропускається
  під час завантаження лише для setup.
- Як і в `definePluginEntry`, `configSchema` може бути лінивою factory, і OpenClaw
  memoizes визначену schema при першому доступі.
- Для Plugin-ів із власними root CLI-командами надавайте перевагу `api.registerCli(..., { descriptors: [...] })`,
  коли хочете, щоб команда залишалася lazy-loaded, не зникаючи з
  дерева розбору root CLI. Для channel Plugin-ів надавайте перевагу реєстрації цих дескрипторів
  з `registerCliMetadata(...)`, а `registerFull(...)` залишайте зосередженим на роботі лише для runtime.
- Якщо `registerFull(...)` також реєструє gateway RPC methods, тримайте їх на
  Plugin-specific prefix. Зарезервовані базові admin-namespaces (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) завжди примусово приводяться до
  `operator.admin`.

## `defineSetupPluginEntry`

**Імпорт:** `openclaw/plugin-sdk/channel-core`

Для полегшеного файла `setup-entry.ts`. Повертає лише `{ plugin }` без
wiring runtime або CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw завантажує це замість повного entry, коли канал вимкнено,
не налаштовано або коли ввімкнено deferred loading. Див.
[Setup і Config](/uk/plugins/sdk-setup#setup-entry), щоб зрозуміти, коли це важливо.

На практиці поєднуйте `defineSetupPluginEntry(...)` із вузькими helper-family для setup:

- `openclaw/plugin-sdk/setup-runtime` для runtime-safe helper-ів setup, таких як
  import-safe setup patch adapter-и, вивід lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries` і delegated setup proxy
- `openclaw/plugin-sdk/channel-setup` для поверхонь setup з необов’язковим встановленням
- `openclaw/plugin-sdk/setup-tools` для helper-ів setup/install CLI/archive/docs

Тримайте важкі SDK, реєстрацію CLI та довготривалі runtime-сервіси в повному
entry.

Bundled workspace-канали, які розділяють поверхні setup і runtime, можуть
використовувати `defineBundledChannelSetupEntry(...)` з
`openclaw/plugin-sdk/channel-entry-contract`. Цей контракт дозволяє
setup-entry зберігати setup-safe-експорти plugin/secrets, водночас усе ще надаючи setter runtime:

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

Використовуйте цей bundled-контракт лише тоді, коли потокам setup справді потрібен полегшений runtime setter
до завантаження повного entry каналу.

## Режим реєстрації

`api.registrationMode` повідомляє вашому Plugin-у, як саме його було завантажено:

| Режим            | Коли                                | Що реєструвати                                                                      |
| ---------------- | ----------------------------------- | ------------------------------------------------------------------------------------ |
| `"full"`         | Звичайний запуск gateway            | Усе                                                                                  |
| `"setup-only"`   | Вимкнений/не налаштований канал     | Лише реєстрацію каналу                                                               |
| `"setup-runtime"`| Потік setup з доступним runtime     | Реєстрацію каналу плюс лише полегшений runtime, потрібний до завантаження повного entry |
| `"cli-metadata"` | Захоплення root help / метаданих CLI| Лише дескриптори CLI                                                                 |

`defineChannelPluginEntry` обробляє цей поділ автоматично. Якщо ви
використовуєте `definePluginEntry` напряму для каналу, перевіряйте режим самі:

```typescript
register(api) {
  if (api.registrationMode === "cli-metadata" || api.registrationMode === "full") {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Важкі реєстрації лише для runtime
  api.registerService(/* ... */);
}
```

Сприймайте `"setup-runtime"` як вікно, у якому поверхні startup лише для setup мають
існувати без повторного входу в повний bundled runtime каналу. Добре підходять
реєстрація каналу, setup-safe HTTP routes, setup-safe gateway methods і
delegated setup helper-и. Важкі background-сервіси, реєстратори CLI і bootstraps SDK provider/client, як і раніше, належать до `"full"`.

Зокрема для реєстраторів CLI:

- використовуйте `descriptors`, коли реєстратор володіє однією або кількома root-командами і ви
  хочете, щоб OpenClaw lazy-load-ив реальний CLI-модуль при першому виклику
- переконайтеся, що ці дескриптори охоплюють кожен root top-level command, який надає
  реєстратор
- використовуйте лише `commands` лише для eager-шляхів сумісності

## Форми Plugin-ів

OpenClaw класифікує завантажені Plugin-и за їхньою поведінкою під час реєстрації:

| Форма                 | Опис                                               |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Один тип можливостей (наприклад, лише provider)    |
| **hybrid-capability** | Кілька типів можливостей (наприклад, provider + speech) |
| **hook-only**         | Лише hooks, без можливостей                        |
| **non-capability**    | Інструменти/команди/сервіси, але без можливостей   |

Використовуйте `openclaw plugins inspect <id>`, щоб побачити форму Plugin-а.

## Пов’язане

- [Огляд SDK](/uk/plugins/sdk-overview) — API реєстрації й довідник підшляхів
- [Runtime Helpers](/uk/plugins/sdk-runtime) — `api.runtime` і `createPluginRuntimeStore`
- [Setup і Config](/uk/plugins/sdk-setup) — manifest, setup entry, deferred loading
- [Channel Plugins](/uk/plugins/sdk-channel-plugins) — побудова об’єкта `ChannelPlugin`
- [Provider Plugins](/uk/plugins/sdk-provider-plugins) — реєстрація provider-а і hooks
