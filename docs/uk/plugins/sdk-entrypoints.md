---
read_when:
    - Вам потрібен точний сигнатурний тип definePluginEntry або defineChannelPluginEntry
    - Ви хочете зрозуміти режим реєстрації (повний vs setup vs метадані CLI)
    - Ви шукаєте параметри точки входу
sidebarTitle: Entry Points
summary: Довідка для definePluginEntry, defineChannelPluginEntry і defineSetupPluginEntry
title: Точки входу Plugin
x-i18n:
    generated_at: "2026-04-21T22:18:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 304501849aa835b775f9b7b85c507aaeb532f90bf6473d7644f0e41144d9a914
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

# Точки входу Plugin

Кожен plugin експортує типовий об’єкт точки входу. SDK надає три допоміжні функції для
їх створення.

Для встановлених plugin-ів `package.json` має спрямовувати завантаження під час виконання на зібраний
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

`extensions` і `setupEntry` залишаються чинними записами вихідного коду для розробки у workspace та git
checkout. `runtimeExtensions` і `runtimeSetupEntry` мають пріоритет, коли OpenClaw завантажує встановлений package, і дають змогу npm package-ам уникати компіляції TypeScript під час виконання. Якщо встановлений package оголошує лише запис вихідного коду TypeScript, OpenClaw використає відповідний зібраний `dist/*.js` peer, якщо він існує, а потім повернеться до вихідного коду TypeScript.

<Tip>
  **Шукаєте покрокове пояснення?** Дивіться [Channel Plugins](/uk/plugins/sdk-channel-plugins)
  або [Provider Plugins](/uk/plugins/sdk-provider-plugins) для покрокових інструкцій.
</Tip>

## `definePluginEntry`

**Імпорт:** `openclaw/plugin-sdk/plugin-entry`

Для plugin-ів провайдерів, plugin-ів інструментів, plugin-ів хуків і всього, що **не є**
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

| Поле           | Тип                                                              | Обов’язкове | Типове значення     |
| -------------- | ---------------------------------------------------------------- | ----------- | ------------------- |
| `id`           | `string`                                                         | Так         | —                   |
| `name`         | `string`                                                         | Так         | —                   |
| `description`  | `string`                                                         | Так         | —                   |
| `kind`         | `string`                                                         | Ні          | —                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Ні          | Порожня схема об’єкта |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Так         | —                   |

- `id` має збігатися з вашим маніфестом `openclaw.plugin.json`.
- `kind` призначене для ексклюзивних слотів: `"memory"` або `"context-engine"`.
- `configSchema` може бути функцією для лінивого обчислення.
- OpenClaw розв’язує та мемоізує цю схему під час першого доступу, тому дорогі
  побудовники схем виконуються лише один раз.

## `defineChannelPluginEntry`

**Імпорт:** `openclaw/plugin-sdk/channel-core`

Обгортає `definePluginEntry` логікою, специфічною для каналів. Автоматично викликає
`api.registerChannel({ plugin })`, надає необов’язковий seam метаданих CLI для кореневої довідки та
обмежує `registerFull` відповідно до режиму реєстрації.

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

| Поле                  | Тип                                                              | Обов’язкове | Типове значення     |
| --------------------- | ---------------------------------------------------------------- | ----------- | ------------------- |
| `id`                  | `string`                                                         | Так         | —                   |
| `name`                | `string`                                                         | Так         | —                   |
| `description`         | `string`                                                         | Так         | —                   |
| `plugin`              | `ChannelPlugin`                                                  | Так         | —                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Ні          | Порожня схема об’єкта |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Ні          | —                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Ні          | —                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Ні          | —                   |

- `setRuntime` викликається під час реєстрації, тож ви можете зберегти посилання на runtime
  (зазвичай через `createPluginRuntimeStore`). Воно пропускається під час захоплення
  метаданих CLI.
- `registerCliMetadata` виконується як під час `api.registrationMode === "cli-metadata"`,
  так і під час `api.registrationMode === "full"`.
  Використовуйте його як канонічне місце для дескрипторів CLI, що належать каналу, щоб
  коренева довідка залишалася без активації, а звичайна реєстрація команд CLI залишалася сумісною
  з повним завантаженням plugin-ів.
- `registerFull` виконується лише коли `api.registrationMode === "full"`. Воно пропускається
  під час завантаження лише для setup.
- Як і у `definePluginEntry`, `configSchema` може бути лінивою фабрикою, а OpenClaw
  мемоізує розв’язану схему під час першого доступу.
- Для кореневих команд CLI, що належать plugin-у, віддавайте перевагу `api.registerCli(..., { descriptors: [...] })`,
  якщо хочете, щоб команда залишалася ліниво завантажуваною без зникнення з
  дерева розбору кореневого CLI. Для channel plugin-ів краще реєструвати ці дескриптори
  з `registerCliMetadata(...)`, а `registerFull(...)` зосередити на роботі, потрібній лише під час виконання.
- Якщо `registerFull(...)` також реєструє методи Gateway RPC, залишайте їх на
  префіксі, специфічному для plugin-а. Зарезервовані простори імен core admin (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) завжди примусово приводяться до
  `operator.admin`.

## `defineSetupPluginEntry`

**Імпорт:** `openclaw/plugin-sdk/channel-core`

Для полегшеного файлу `setup-entry.ts`. Повертає лише `{ plugin }` без
логіки runtime або CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw завантажує це замість повної точки входу, коли канал вимкнено,
не налаштовано або коли ввімкнено відкладене завантаження. Див.
[Setup and Config](/uk/plugins/sdk-setup#setup-entry), щоб зрозуміти, коли це має значення.

На практиці поєднуйте `defineSetupPluginEntry(...)` із вузькими сімействами
допоміжних функцій setup:

- `openclaw/plugin-sdk/setup-runtime` для безпечних для runtime допоміжних функцій setup, таких як
  import-safe адаптери патчів setup, вивід lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries` і делеговані проксі setup
- `openclaw/plugin-sdk/channel-setup` для поверхонь setup з необов’язковим встановленням
- `openclaw/plugin-sdk/setup-tools` для допоміжних функцій setup/install CLI/archive/docs

Тримайте важкі SDK, реєстрацію CLI та довгоживучі runtime-сервіси в повній
точці входу.

Вбудовані workspace-канали, які розділяють поверхні setup і runtime, можуть
замість цього використовувати `defineBundledChannelSetupEntry(...)` з
`openclaw/plugin-sdk/channel-entry-contract`. Цей контракт дає змогу
точці входу setup зберігати безпечні для setup експорти plugin/secrets, водночас надаючи
setter runtime:

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

Використовуйте цей вбудований контракт лише тоді, коли потокам setup справді потрібен полегшений
setter runtime до завантаження повної точки входу каналу.

## Режим реєстрації

`api.registrationMode` повідомляє вашому plugin-у, як саме його було завантажено:

| Режим            | Коли                              | Що реєструвати                                                                          |
| ---------------- | --------------------------------- | --------------------------------------------------------------------------------------- |
| `"full"`         | Звичайний запуск Gateway          | Усе                                                                                     |
| `"setup-only"`   | Вимкнений/неналаштований канал    | Лише реєстрацію каналу                                                                  |
| `"setup-runtime"`| Потік setup із доступним runtime  | Реєстрацію каналу плюс лише полегшений runtime, потрібний до завантаження повної точки входу |
| `"cli-metadata"` | Коренева довідка / захоплення метаданих CLI | Лише дескриптори CLI                                                              |

`defineChannelPluginEntry` обробляє це розділення автоматично. Якщо ви використовуєте
`definePluginEntry` безпосередньо для каналу, перевіряйте режим самостійно:

```typescript
register(api) {
  if (api.registrationMode === "cli-metadata" || api.registrationMode === "full") {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Heavy runtime-only registrations
  api.registerService(/* ... */);
}
```

Розглядайте `"setup-runtime"` як вікно, у якому поверхні запуску лише для setup
мають існувати без повторного входу в повний вбудований runtime каналу. Добре підходять
реєстрація каналу, безпечні для setup HTTP-маршрути, безпечні для setup методи Gateway і
делеговані допоміжні функції setup. Важкі фонові сервіси, реєстратори CLI та
завантаження SDK провайдерів/клієнтів, як і раніше, мають належати `"full"`.

Зокрема для реєстраторів CLI:

- використовуйте `descriptors`, коли реєстратор володіє однією або кількома кореневими командами і ви
  хочете, щоб OpenClaw ліниво завантажував справжній модуль CLI під час першого виклику
- переконайтеся, що ці дескриптори охоплюють кожний корінь команди верхнього рівня, який відкриває
  реєстратор
- використовуйте лише `commands` тільки для шляхів сумісності з eager-завантаженням

## Форми plugin-ів

OpenClaw класифікує завантажені plugin-и за їхньою поведінкою під час реєстрації:

| Форма                 | Опис                                              |
| --------------------- | ------------------------------------------------- |
| **plain-capability**  | Один тип capability (наприклад, лише provider)    |
| **hybrid-capability** | Кілька типів capability (наприклад, provider + speech) |
| **hook-only**         | Лише hooks, без capabilities                      |
| **non-capability**    | Tools/commands/services, але без capabilities     |

Використовуйте `openclaw plugins inspect <id>`, щоб побачити форму plugin-а.

## Пов’язане

- [SDK Overview](/uk/plugins/sdk-overview) — API реєстрації та довідка щодо subpath
- [Runtime Helpers](/uk/plugins/sdk-runtime) — `api.runtime` і `createPluginRuntimeStore`
- [Setup and Config](/uk/plugins/sdk-setup) — маніфест, точка входу setup, відкладене завантаження
- [Channel Plugins](/uk/plugins/sdk-channel-plugins) — побудова об’єкта `ChannelPlugin`
- [Provider Plugins](/uk/plugins/sdk-provider-plugins) — реєстрація провайдерів і hooks
