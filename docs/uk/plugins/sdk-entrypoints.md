---
read_when:
    - Вам потрібна точна сигнатура типу `defineToolPlugin`, `definePluginEntry` або `defineChannelPluginEntry`
    - Ви хочете зрозуміти режим реєстрації (повний, налаштування або метадані CLI)
    - Ви шукаєте варіанти точок входу
sidebarTitle: Entry Points
summary: Довідка щодо defineToolPlugin, definePluginEntry, defineChannelPluginEntry і defineSetupPluginEntry
title: Точки входу Plugin
x-i18n:
    generated_at: "2026-07-16T18:27:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8b2133dbe4ee650b27e110d472b38284d557f715829e3f0d73f8dc6c910c7c99
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Кожен plugin експортує об’єкт запису за замовчуванням. SDK надає допоміжну функцію для
кожної форми запису: `defineToolPlugin`, `definePluginEntry`,
`defineChannelPluginEntry`, `defineSetupPluginEntry`.

<Tip>
  **Шукаєте покроковий огляд?** Покрокові посібники див. у розділах [Plugin інструментів](/uk/plugins/tool-plugins),
  [Plugin каналів](/uk/plugins/sdk-channel-plugins) або
  [Plugin провайдерів](/uk/plugins/sdk-provider-plugins).
</Tip>

## Записи пакета

Установлені plugins спрямовують поля `package.json` `openclaw` як на вихідні, так і на
зібрані записи:

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

- `extensions` і `setupEntry` — це вихідні записи, які використовуються для розробки
  в робочому просторі та в отриманій копії git.
- `runtimeExtensions` і `runtimeSetupEntry` є пріоритетними для встановлених
  пакетів: завдяки їм npm-пакети можуть не виконувати компіляцію TypeScript під час виконання.
- `runtimeExtensions`, якщо наявний, має відповідати `extensions` за довжиною масиву
  (записи утворюють пари за позиціями). `runtimeSetupEntry` потребує `setupEntry`.
- Якщо артефакт `runtimeExtensions`/`runtimeSetupEntry` оголошено, але
  він відсутній, установлення/виявлення завершується помилкою пакування; OpenClaw не
  переходить неявно до вихідного коду. Перехід до вихідного коду (нижче) застосовується лише тоді, коли
  запис середовища виконання взагалі не оголошено.
- Якщо встановлений пакет оголошує лише вихідний запис TypeScript, OpenClaw
  шукає відповідний зібраний парний файл `dist/*.js` (або `.mjs`/`.cjs`) і використовує його;
  інакше він переходить до вихідного коду TypeScript.
- Усі шляхи записів мають залишатися в каталозі пакета plugin. Записи
  середовища виконання та виведені парні зібрані JS-файли не роблять чинним шлях вихідного коду `extensions` або
  `setupEntry`, що виходить за межі каталогу.

## `defineToolPlugin`

**Імпорт:** `openclaw/plugin-sdk/tool-plugin`

Для plugins, які лише додають інструменти агента. Зберігає вихідний код компактним, виводить типи
конфігурації та параметрів інструментів зі схем TypeBox, обгортає звичайні повернені значення у
формат результатів інструментів OpenClaw та надає статичні метадані, які
`openclaw plugins build` записує в маніфест plugin (`contracts.tools`,
`configSchema`).

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

- `configSchema` є необов’язковим; якщо його пропустити, використовується строга схема порожнього об’єкта
  (згенерований маніфест усе одно містить `configSchema`).
- `execute` повертає звичайний рядок або значення, яке можна серіалізувати в JSON; допоміжна функція
  обгортає його як текстовий результат інструмента з `details`, установленим у початкове
  (не перетворене на рядок) повернене значення.
- Для власних результатів інструментів `openclaw/plugin-sdk/tool-results` експортує
  `textResult` і `jsonResult`.
- Назви інструментів статичні, тому `openclaw plugins build` виводить
  `contracts.tools` з оголошених інструментів без ручного дублювання назв.
- Завантаження середовища виконання залишається строгим: установленим plugins усе одно потрібні
  `openclaw.plugin.json` і `package.json` `openclaw.extensions`. OpenClaw
  ніколи не виконує код plugin, щоб вивести відсутні дані маніфесту.

## `definePluginEntry`

**Імпорт:** `openclaw/plugin-sdk/plugin-entry`

Для plugins провайдерів, розширених plugins інструментів, plugins перехоплень і всього, що
**не є** каналом обміну повідомленнями.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Short summary",
  register(api) {
    api.registerProvider({/* ... */});
    api.registerTool({/* ... */});
  },
});
```

| Поле                      | Тип                                                              | Обов’язкове | За замовчуванням       |
| ------------------------- | ---------------------------------------------------------------- | ----------- | ---------------------- |
| `id`                      | `string`                                                         | Так         | -                      |
| `name`                    | `string`                                                         | Так         | -                      |
| `description`             | `string`                                                         | Так         | -                      |
| `kind`                    | `string` (застаріле, див. нижче)                                 | Ні          | -                      |
| `configSchema`            | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Ні          | Схема порожнього об’єкта |
| `reload`                  | `OpenClawPluginReloadRegistration`                               | Ні          | -                      |
| `nodeHostCommands`        | `OpenClawPluginNodeHostCommand[]`                                | Ні          | -                      |
| `securityAuditCollectors` | `OpenClawPluginSecurityAuditCollector[]`                         | Ні          | -                      |
| `register`                | `(api: OpenClawPluginApi) => void`                               | Так         | -                      |

- `id` має відповідати вашому маніфесту `openclaw.plugin.json`.
- Зовнішні каталоги сеансів використовують
  `openclaw/plugin-sdk/session-catalog` і
  `api.registerSessionCatalog({ id, label, list, read, continueSession?, archive? })`.
  Ядро володіє методами Gateway `sessions.catalog.*`; провайдери повертають проєкції хоста,
  сеансу та нормалізованого транскрипту без реєстрації RPC.
- `kind` застаріло: натомість оголосіть ексклюзивний слот (`"memory"` або
  `"context-engine"`) у полі `kind` маніфесту `openclaw.plugin.json`.
  `kind` запису середовища виконання залишається лише як сумісний резервний варіант для
  старіших plugins.
- `configSchema` може бути функцією для лінивого обчислення. OpenClaw розв’язує та
  мемоізує схему під час першого доступу, тому ресурсомісткі побудовники схем виконуються лише
  один раз.
- Дескриптор `nodeHostCommands` може визначати `isAvailable({ config, env })`.
  Повернення `false` вилучає цю команду та її можливість з оголошення Gateway
  безголового вузла. OpenClaw обчислює його за локальною конфігурацією запуску
  вузла; обробники команд усе одно мають перевіряти доступність під час
  виклику.

## `defineChannelPluginEntry`

**Імпорт:** `openclaw/plugin-sdk/channel-core`

Обгортає `definePluginEntry` з підключенням, специфічним для каналу: автоматично
викликає `api.registerChannel({ plugin })`, надає необов’язкову точку інтеграції метаданих CLI
для кореневої довідки та обмежує `registerFull` режимом реєстрації.

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

| Поле                  | Тип                                                              | Обов’язкове | За замовчуванням       |
| --------------------- | ---------------------------------------------------------------- | ----------- | ---------------------- |
| `id`                  | `string`                                                         | Так         | -                      |
| `name`                | `string`                                                         | Так         | -                      |
| `description`         | `string`                                                         | Так         | -                      |
| `plugin`              | `ChannelPlugin`                                                  | Так         | -                      |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Ні          | Схема порожнього об’єкта |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Ні          | -                      |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Ні          | -                      |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Ні          | -                      |

Зворотні виклики виконуються відповідно до режиму реєстрації (повна таблиця в розділі
[Режим реєстрації](#registration-mode)):

- `setRuntime` виконується в кожному режимі, крім `"cli-metadata"` і
  `"tool-discovery"`. Зберігайте тут посилання на середовище виконання, зазвичай через
  `createPluginRuntimeStore`.
- `registerCliMetadata` виконується для `"cli-metadata"`, `"discovery"` і
  `"full"`. Використовуйте його як канонічне місце для дескрипторів CLI, якими володіє канал,
  щоб коренева довідка не спричиняла активації, знімки виявлення містили статичні
  метадані команд, а звичайна реєстрація CLI залишалася сумісною з повним
  завантаженням plugin.
- `registerFull` виконується лише для `"full"` і `"tool-discovery"`. Для
  `"tool-discovery"` він виконується _замість_ реєстрації каналу: OpenClaw
  повністю пропускає `registerChannel`/`setRuntime` і викликає лише
  `registerFull`, тому будь-яка реєстрація провайдера/інструмента, потрібна вашому каналу для
  автономного виявлення чи виконання інструментів, має міститися там, а не за звичайним
  налаштуванням каналу.
- Реєстрація виявлення не спричиняє активації, але не виконується без імпорту: OpenClaw може
  обчислити довірений запис plugin і модуль plugin каналу, щоб побудувати
  знімок. Імпорти верхнього рівня не повинні мати побічних ефектів, а сокети,
  клієнти, воркери та служби слід розміщувати лише в шляхах `"full"`.
- Як і `definePluginEntry`, `configSchema` може бути лінивою фабрикою; OpenClaw
  мемоізує розв’язану схему під час першого доступу.

Реєстрація CLI:

- Використовуйте `api.registerCli(..., { descriptors: [...] })` для кореневих
  команд CLI, якими володіє plugin і які потрібно завантажувати ліниво без зникнення з кореневого дерева
  синтаксичного аналізу CLI. Назви дескрипторів мають складатися з літер, цифр, дефісів і
  підкреслень та починатися з літери або цифри; OpenClaw відхиляє інші
  форми й вилучає керівні послідовності термінала з описів перед
  відтворенням довідки. Охопіть кожен корінь команди верхнього рівня, який надає реєстратор.
  Лише `commands` залишається на шляху сумісності з негайним завантаженням.
- Використовуйте `api.registerNodeCliFeature(...)` для команд функцій спареного вузла, щоб
  вони розміщувалися під `openclaw nodes` (еквівалент
  `registerCli(registrar, { parentPath: ["nodes"], ... })`).
- Для інших вкладених команд plugin додайте `parentPath` і реєструйте команди
  в об’єкті `program`, переданому реєстратору; OpenClaw розв’язує його до
  батьківської команди перед викликом plugin.
- Для plugins каналів реєструйте дескриптори CLI з `registerCliMetadata`
  і зосередьте `registerFull` лише на роботі середовища виконання.
- Якщо `registerFull` також реєструє методи RPC Gateway, використовуйте для них
  префікс, специфічний для plugin. Зарезервовані простори назв адміністрування ядра (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) завжди примусово перетворюються на
  `operator.admin`.

## `defineSetupPluginEntry`

**Імпорт:** `openclaw/plugin-sdk/channel-core`

Для полегшеного файлу `setup-entry.ts`. Повертає лише `{ plugin }` без
підключення середовища виконання або CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw завантажує це замість повної точки входу, коли канал вимкнено,
не налаштовано або ввімкнено відкладене завантаження. Відомості про те,
коли це має значення, див. у розділі [Налаштування та конфігурація](/uk/plugins/sdk-setup#setup-entry).

Поєднуйте `defineSetupPluginEntry(...)` з вузькоспеціалізованими сімействами допоміжних засобів налаштування:

| Імпорт                              | Призначення                                                                                                                                                                            |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/setup-runtime` | Безпечні для середовища виконання допоміжні засоби налаштування: `createSetupTranslator`, безпечні для імпорту адаптери виправлень налаштування, виведення приміток пошуку, `promptResolvedAllowFrom`, `splitSetupEntries`, делеговані проксі налаштування |
| `openclaw/plugin-sdk/channel-setup` | Поверхні налаштування необов’язкового встановлення                                                                                                                                                    |
| `openclaw/plugin-sdk/setup-tools`   | Допоміжні засоби CLI, архіву й документації для налаштування та встановлення                                                                                                                                       |

Зберігайте важкі SDK, реєстрацію CLI та довготривалі служби середовища виконання
в повній точці входу.

Вбудовані канали робочого простору, які розділяють поверхні налаштування й середовища виконання, натомість можуть використовувати
`defineBundledChannelSetupEntry(...)` з
`openclaw/plugin-sdk/channel-entry-contract`. Це дає змогу точці входу
налаштування зберігати безпечні для налаштування експорти плагіна й секретів, водночас надаючи сеттер
середовища виконання:

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
        /* безпечний для налаштування маршрут */
      },
    });
  },
});
```

Використовуйте це лише тоді, коли процес налаштування справді потребує легкого сеттера середовища виконання або
безпечної для налаштування поверхні Gateway до завантаження повної точки входу каналу.
`registerSetupRuntime` виконується лише для завантажень `"setup-runtime"`; обмежуйте його
маршрутами або методами лише для конфігурації, які мають існувати до відкладеної
повної активації.

## Режим реєстрації

`api.registrationMode` повідомляє плагіну, як його було завантажено:

| Режим               | Коли                                               | Що реєструвати                                                                                                        |
| ------------------ | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`           | Звичайний запуск Gateway                             | Усе                                                                                                              |
| `"discovery"`      | Виявлення можливостей лише для читання                     | Реєстрація каналу та статичні дескриптори CLI; код точки входу може завантажуватися, але пропускайте сокети, воркери, клієнти та служби |
| `"tool-discovery"` | Обмежене завантаження для переліку або запуску інструментів певних плагінів | Лише реєстрація можливостей та інструментів; без активації каналу                                                                |
| `"setup-only"`     | Вимкнений або неналаштований канал                      | Лише реєстрація каналу                                                                                               |
| `"setup-runtime"`  | Процес налаштування з доступним середовищем виконання                  | Реєстрація каналу та лише легке середовище виконання, потрібне до завантаження повної точки входу                               |
| `"cli-metadata"`   | Коренева довідка / захоплення метаданих CLI                   | Лише дескриптори CLI                                                                                                    |

`defineChannelPluginEntry` обробляє це розділення автоматично. Якщо для каналу ви безпосередньо використовуєте
`definePluginEntry`, перевіряйте режим самостійно й пам’ятайте,
що `"tool-discovery"` пропускає реєстрацію каналу:

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

  if (api.registrationMode === "tool-discovery") {
    // Реєструйте лише поверхні можливостей (провайдери/інструменти), без каналу.
    return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Важкі реєстрації лише для середовища виконання
  api.registerService(/* ... */);
}
```

Довготривалі служби можуть надсилати невеликі події інвалідації або життєвого циклу через
контекст своєї служби:

```typescript
api.registerService({
  id: "index-events",
  start(ctx) {
    ctx.gatewayEvents?.emit("changed", { revision: 1 }, { scope: "operator.read" });
  },
});
```

OpenClaw додає до цього простір імен `plugin.<plugin-id>.changed`. Назви подій складаються з одного
сегмента в нижньому регістрі, корисне навантаження має бути обмеженим JSON, а область дії має бути
`operator.read`, `operator.write` або `operator.admin`. Емітер існує лише
протягом часу роботи служби та відкликається після зупинки або невдалого запуску. Надавайте перевагу
корисному навантаженню з версією чи інвалідацією, а не повним записам, щоб авторизовані клієнти повторно зчитували
канонічний стан через обмежені за областю дії методи Gateway плагіна.

Режим виявлення створює знімок реєстру без активації. Він усе ще може
виконувати точку входу плагіна та об’єкт плагіна каналу, щоб OpenClaw міг
зареєструвати можливості каналу й статичні дескриптори CLI. Вважайте виконання
модуля в режимі виявлення довіреним, але легким: без мережевих клієнтів,
підпроцесів, слухачів, з’єднань із базою даних, фонових воркерів,
читання облікових даних або інших активних побічних ефектів середовища виконання на верхньому рівні.

Вважайте `"setup-runtime"` вікном, у якому поверхні запуску лише для налаштування мають
існувати без повторного входу до повного середовища виконання вбудованого каналу. Доречними є
реєстрація каналу, безпечні для налаштування HTTP-маршрути, безпечні для налаштування методи Gateway
та делеговані допоміжні засоби налаштування. Важкі фонові служби, реєстратори CLI та
ініціалізація SDK провайдерів і клієнтів усе ще належать до `"full"`.

## Форми плагінів

OpenClaw класифікує завантажені плагіни за їхньою поведінкою реєстрації:

| Форма                 | Опис                                        |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Один тип можливостей (наприклад, лише провайдер)           |
| **hybrid-capability** | Кілька типів можливостей (наприклад, провайдер + мовлення) |
| **hook-only**         | Лише хуки, без можливостей                        |
| **non-capability**    | Інструменти/команди/служби, але без можливостей        |

Щоб переглянути форму плагіна, використовуйте `openclaw plugins inspect <id>`.

## Пов’язані матеріали

- [Огляд SDK](/uk/plugins/sdk-overview) — API реєстрації та довідник підшляхів
- [Допоміжні засоби середовища виконання](/uk/plugins/sdk-runtime) — `api.runtime` і `createPluginRuntimeStore`
- [Налаштування та конфігурація](/uk/plugins/sdk-setup) — маніфест, точка входу налаштування, відкладене завантаження
- [Плагіни каналів](/uk/plugins/sdk-channel-plugins) — створення об’єкта `ChannelPlugin`
- [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins) — реєстрація провайдерів і хуки
