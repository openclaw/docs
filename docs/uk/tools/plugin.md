---
read_when:
    - Встановлення або налаштування плагінів
    - Розуміння правил виявлення та завантаження Plugin
    - Робота з пакетами Plugin, сумісними з Codex/Claude
sidebarTitle: Install and Configure
summary: Встановлюйте, налаштовуйте та керуйте Plugin OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-05-02T19:23:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: d553c917d9054f4cb5a244ffd0d749c37f6dde230a5887b6b71ba7cf39fcefe5
    source_path: tools/plugin.md
    workflow: 16
---

Plugins розширюють OpenClaw новими можливостями: каналами, провайдерами моделей,
агентними каркасами, інструментами, Skills, мовленням, транскрипцією в реальному часі,
голосом у реальному часі, розумінням медіа, генерацією зображень, генерацією відео, веботриманням, вебпошуком
тощо. Деякі Plugins є **core** (постачаються з OpenClaw), інші
є **зовнішніми**. Більшість зовнішніх Plugins публікуються та знаходяться через
[ClawHub](/uk/tools/clawhub). Npm і надалі підтримується для прямих установлень і для
тимчасового набору пакетів Plugins, що належать OpenClaw, доки ця міграція завершується.

## Швидкий старт

Приклади встановлення, виведення списку, видалення, оновлення та публікації для копіювання дивіться в
[Керування Plugins](/uk/plugins/manage-plugins).

<Steps>
  <Step title="Подивитися, що завантажено">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Встановити Plugin">
    ```bash
    # Search ClawHub plugins
    openclaw plugins search "calendar"

    # From ClawHub
    openclaw plugins install clawhub:openclaw-codex-app-server

    # From npm
    openclaw plugins install npm:@acme/openclaw-plugin

    # From git
    openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0

    # From a local directory or archive
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Перезапустити Gateway">
    ```bash
    openclaw gateway restart
    ```

    Потім налаштуйте в `plugins.entries.\<id\>.config` у вашому файлі конфігурації.

  </Step>

  <Step title="Керування через чат">
    У запущеному Gateway команди лише для власника `/plugins enable` і `/plugins disable`
    запускають перезавантажувач конфігурації Gateway. Gateway перезавантажує runtime-поверхні Plugin
    у процесі, а нові ходи агента перебудовують свій список інструментів з
    оновленого реєстру. `/plugins install` змінює вихідний код Plugin, тому
    Gateway запитує перезапуск замість того, щоб вдавати, ніби поточний процес може
    безпечно перезавантажити вже імпортовані модулі.

  </Step>

  <Step title="Перевірити Plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Використовуйте `--runtime`, коли потрібно довести зареєстровані інструменти, сервіси, gateway
    методи, hooks або CLI-команди, що належать Plugin. Звичайний `inspect` є холодною
    перевіркою маніфесту/реєстру й навмисно уникає імпорту runtime Plugin.

  </Step>
</Steps>

Якщо ви віддаєте перевагу керуванню через чат, увімкніть `commands.plugins: true` і використовуйте:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Шлях установлення використовує той самий resolver, що й CLI: локальний шлях/архів, явний
`clawhub:<pkg>`, явний `npm:<pkg>`, явний `git:<repo>` або специфікацію пакета без префікса
через npm.

Якщо конфігурація недійсна, встановлення зазвичай завершується закрито й спрямовує вас до
`openclaw doctor --fix`. Єдиний виняток відновлення — вузький шлях перевстановлення bundled-plugin
для Plugins, які погоджуються на
`openclaw.install.allowInvalidConfigRecovery`.
Під час запуску Gateway недійсна конфігурація одного Plugin ізолюється до цього Plugin:
запуск записує в журнал проблему `plugins.entries.<id>.config`, пропускає цей Plugin під час
завантаження й залишає інші Plugins і канали онлайн. Запустіть `openclaw doctor --fix`,
щоб помістити погану конфігурацію Plugin у карантин, вимкнувши цей запис Plugin і видаливши
його недійсний payload конфігурації; звичайна резервна копія конфігурації зберігає попередні значення.
Коли конфігурація каналу посилається на Plugin, який більше не виявляється, але той самий застарілий id Plugin
залишається в конфігурації Plugin або записах установлення, запуск Gateway
записує попередження в журнал і пропускає цей канал замість блокування всіх інших каналів.
Запустіть `openclaw doctor --fix`, щоб видалити застарілі записи каналу/Plugin; невідомі
ключі каналів без доказів застарілого Plugin і надалі не проходять перевірку, щоб помилки введення залишалися
видимими.
Якщо встановлено `plugins.enabled: false`, застарілі посилання на Plugin вважаються інертними:
запуск Gateway пропускає роботу з виявлення/завантаження Plugin, а `openclaw doctor` зберігає
вимкнену конфігурацію Plugin замість автоматичного видалення. Знову ввімкніть Plugins перед
запуском очищення doctor, якщо хочете видалити застарілі id Plugin.

Встановлення залежностей Plugin відбувається лише під час явних потоків install/update або
repair у doctor. Запуск Gateway, перезавантаження конфігурації та runtime-інспекція не
запускають менеджери пакетів і не ремонтують дерева залежностей. Локальні Plugins уже повинні
мати встановлені залежності, тоді як npm, git і ClawHub Plugins
встановлюються в керовані корені Plugin OpenClaw. Залежності npm можуть hoist-итися
в межах керованого npm-кореня OpenClaw; install/update сканує цей керований корінь перед
довірою, а uninstall видаляє пакети, керовані npm, через npm. Зовнішні Plugins
і користувацькі шляхи завантаження все одно потрібно встановлювати через `openclaw plugins install`.
Використовуйте `openclaw plugins list --json`, щоб побачити статичний `dependencyStatus` для кожного
видимого Plugin без імпорту runtime-коду або ремонту залежностей.
Дивіться [Розв’язання залежностей Plugin](/uk/plugins/dependency-resolution) щодо
життєвого циклу під час установлення.

Вихідні checkout-и є pnpm workspaces. Якщо ви клонували OpenClaw, щоб працювати над bundled
Plugins, запустіть `pnpm install`; тоді OpenClaw завантажує bundled Plugins з
`extensions/<id>`, тож правки й локальні залежності пакета використовуються напряму.
Звичайні npm-встановлення в корені призначені для упакованого OpenClaw, а не для розробки
з source checkout.

## Типи Plugin

OpenClaw розпізнає два формати Plugin:

| Формат     | Як це працює                                                       | Приклади                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + runtime-модуль; виконується в процесі     | Офіційні Plugins, npm-пакети спільноти                 |
| **Bundle** | Сумісна з Codex/Claude/Cursor структура; зіставляється з функціями OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва відображаються в `openclaw plugins list`. Дивіться [Plugin Bundles](/uk/plugins/bundles) для деталей bundle.

Якщо ви пишете native Plugin, почніть із [Створення Plugins](/uk/plugins/building-plugins)
та [Огляду Plugin SDK](/uk/plugins/sdk-overview).

## Точки входу пакета

Native npm-пакети Plugin повинні оголошувати `openclaw.extensions` у `package.json`.
Кожен запис має залишатися всередині каталогу пакета й резолвитися до читабельного
runtime-файла або до вихідного TypeScript-файла з виведеним збудованим JavaScript
peer, наприклад `src/index.ts` до `dist/index.js`.

Використовуйте `openclaw.runtimeExtensions`, коли опубліковані runtime-файли не розташовані за
тими самими шляхами, що й вихідні записи. За наявності `runtimeExtensions` має містити
рівно один запис для кожного запису `extensions`. Невідповідні списки провалюють установлення й
виявлення Plugin замість тихого fallback до вихідних шляхів. Якщо ви також
публікуєте `openclaw.setupEntry`, використовуйте `openclaw.runtimeSetupEntry` для його збудованого
JavaScript peer; цей файл обов’язковий, якщо оголошений.

```json
{
  "name": "@acme/openclaw-plugin",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"]
  }
}
```

## Офіційні Plugins

### Npm-пакети, що належать OpenClaw, під час міграції

ClawHub є основним шляхом дистрибуції для більшості Plugins. Поточні упаковані
релізи OpenClaw уже містять багато офіційних Plugins, тому вони не потребують
окремих npm-встановлень у звичайних налаштуваннях. Доки кожен Plugin, що належить OpenClaw,
не мігрує до ClawHub, OpenClaw і надалі постачає деякі пакети Plugins `@openclaw/*` на
npm для старіших/користувацьких установлень і прямих npm-процесів.

Якщо npm повідомляє про пакет Plugin `@openclaw/*` як deprecated, ця версія пакета
походить зі старішої зовнішньої лінійки пакетів. Використовуйте bundled Plugin з
поточного OpenClaw або локальний checkout, доки не буде опубліковано новіший npm-пакет.

| Plugin          | Пакет                      | Документація                               |
| --------------- | -------------------------- | ------------------------------------------ |
| BlueBubbles     | `@openclaw/bluebubbles`    | [BlueBubbles](/uk/channels/bluebubbles)       |
| Discord         | `@openclaw/discord`        | [Discord](/uk/channels/discord)               |
| Feishu          | `@openclaw/feishu`         | [Feishu](/uk/channels/feishu)                 |
| Matrix          | `@openclaw/matrix`         | [Matrix](/uk/channels/matrix)                 |
| Mattermost      | `@openclaw/mattermost`     | [Mattermost](/uk/channels/mattermost)         |
| Microsoft Teams | `@openclaw/msteams`        | [Microsoft Teams](/uk/channels/msteams)       |
| Nextcloud Talk  | `@openclaw/nextcloud-talk` | [Nextcloud Talk](/uk/channels/nextcloud-talk) |
| Nostr           | `@openclaw/nostr`          | [Nostr](/uk/channels/nostr)                   |
| Synology Chat   | `@openclaw/synology-chat`  | [Synology Chat](/uk/channels/synology-chat)   |
| Tlon            | `@openclaw/tlon`           | [Tlon](/uk/channels/tlon)                     |
| WhatsApp        | `@openclaw/whatsapp`       | [WhatsApp](/uk/channels/whatsapp)             |
| Zalo            | `@openclaw/zalo`           | [Zalo](/uk/channels/zalo)                     |
| Zalo Personal   | `@openclaw/zalouser`       | [Zalo Personal](/uk/plugins/zalouser)         |

### Core (постачається з OpenClaw)

<AccordionGroup>
  <Accordion title="Провайдери моделей (увімкнені за замовчуванням)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory Plugins">
    - `memory-core` — bundled пошук пам’яті (за замовчуванням через `plugins.slots.memory`)
    - `memory-lancedb` — довготривала пам’ять на базі LanceDB з auto-recall/capture (встановіть `plugins.slots.memory = "memory-lancedb"`)

    Дивіться [Memory LanceDB](/uk/plugins/memory-lancedb) щодо налаштування embeddings, сумісних з OpenAI,
    прикладів Ollama, обмежень recall і усунення несправностей.

  </Accordion>

  <Accordion title="Провайдери мовлення (увімкнені за замовчуванням)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` — bundled browser Plugin для browser tool, CLI `openclaw browser`, gateway-методу `browser.request`, browser runtime і сервісу керування браузером за замовчуванням (увімкнений за замовчуванням; вимкніть перед заміною)
    - `copilot-proxy` — міст VS Code Copilot Proxy (вимкнений за замовчуванням)

  </Accordion>
</AccordionGroup>

Шукаєте сторонні Plugins? Дивіться [Plugins спільноти](/uk/plugins/community).

## Конфігурація

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| Поле            | Опис                                                       |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Головний перемикач (за замовчуванням: `true`)             |
| `allow`          | Allowlist Plugin (необов’язково)                          |
| `deny`           | Denylist Plugin (необов’язково; deny має перевагу)        |
| `load.paths`     | Додаткові файли/каталоги Plugin                           |
| `slots`          | Селектори ексклюзивних слотів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>` | Перемикачі + конфігурація для кожного Plugin              |

`plugins.allow` є ексклюзивним. Коли він непорожній, можуть завантажуватися
або відкривати інструменти лише перелічені Plugins, навіть якщо `tools.allow` містить `"*"` або конкретну
назву інструмента, що належить Plugin. Якщо allowlist інструментів посилається на інструменти Plugin, додайте id Plugins-власників
до `plugins.allow` або видаліть `plugins.allow`; `openclaw doctor` попереджає про цю
форму.

Зміни конфігурації, внесені через `/plugins enable` або `/plugins disable`, запускають
перезавантаження Plugin Gateway у межах процесу. Нові ходи агента перебудовують свій список інструментів із
оновленого реєстру Plugin. Операції, що змінюють джерело, як-от install,
update і uninstall, усе ще перезапускають процес Gateway, оскільки вже імпортовані
модулі Plugin не можна безпечно замінити на місці.

`openclaw plugins list` — це локальний знімок реєстру/конфігурації Plugin. 
Plugin зі станом `enabled` там означає, що збережений реєстр і поточна конфігурація дозволяють
Plugin брати участь. Це не доводить, що вже запущений віддалений Gateway
перезавантажився або перезапустився з тим самим кодом Plugin. У налаштуваннях VPS/контейнерів
із процесами-обгортками надсилайте перезапуски або записи, що запускають перезавантаження, до фактичного
процесу `openclaw gateway run`, або використовуйте `openclaw gateway restart` для
запущеного Gateway, коли перезавантаження повідомляє про збій.

<Accordion title="Стани Plugin: вимкнений vs відсутній vs недійсний">
  - **Вимкнений**: Plugin існує, але правила ввімкнення вимкнули його. Конфігурація зберігається.
  - **Відсутній**: конфігурація посилається на id Plugin, який виявлення не знайшло.
  - **Недійсний**: Plugin існує, але його конфігурація не відповідає оголошеній схемі. Запуск Gateway пропускає лише цей Plugin; `openclaw doctor --fix` може ізолювати недійсний запис, вимкнувши його та видаливши його конфігураційне навантаження.

</Accordion>

## Виявлення та пріоритет

OpenClaw сканує Plugin у такому порядку (перший збіг перемагає):

<Steps>
  <Step title="Шляхи конфігурації">
    `plugins.load.paths` — явні шляхи до файлів або директорій. Шляхи, що вказують
    назад на власні запаковані директорії вбудованих Plugin OpenClaw, ігноруються;
    запустіть `openclaw doctor --fix`, щоб видалити ці застарілі псевдоніми.
  </Step>

  <Step title="Plugin робочої області">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` і `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Глобальні Plugin">
    `~/.openclaw/<plugin-root>/*.ts` і `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Вбудовані Plugin">
    Постачаються з OpenClaw. Багато з них увімкнено за замовчуванням (провайдери моделей, мовлення).
    Інші потребують явного ввімкнення.
  </Step>
</Steps>

Запаковані встановлення та Docker-образи зазвичай розв’язують вбудовані Plugin з
скомпільованого дерева `dist/extensions`. Якщо директорію джерела вбудованого Plugin
змонтовано поверх відповідного запакованого шляху джерела, наприклад
`/app/extensions/synology-chat`, OpenClaw розглядає цю змонтовану директорію джерела
як накладення вбудованого джерела та виявляє її перед запакованим бандлом
`/app/dist/extensions/synology-chat`. Це зберігає працездатність контейнерних
циклів мейнтейнерів без перемикання кожного вбудованого Plugin назад на джерело TypeScript.
Установіть `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, щоб примусово використовувати запаковані dist-бандли,
навіть коли наявні монтування накладень джерела.

### Правила ввімкнення

- `plugins.enabled: false` вимикає всі Plugin і пропускає роботу з виявлення/завантаження Plugin
- `plugins.deny` завжди має перевагу над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей Plugin
- Plugin з робочої області **вимкнені за замовчуванням** (їх потрібно явно ввімкнути)
- Вбудовані Plugin дотримуються вбудованого набору ввімкнених за замовчуванням, якщо це не перевизначено
- Ексклюзивні слоти можуть примусово ввімкнути вибраний Plugin для цього слота
- Деякі вбудовані opt-in Plugin вмикаються автоматично, коли конфігурація називає
  поверхню, що належить Plugin, як-от посилання на модель провайдера, конфігурація каналу або runtime
  harness
- Застаріла конфігурація Plugin зберігається, доки активний `plugins.enabled: false`;
  повторно ввімкніть Plugin перед запуском очищення doctor, якщо хочете видалити застарілі id
- Маршрути Codex сімейства OpenAI зберігають окремі межі Plugin:
  `openai-codex/*` належить OpenAI Plugin, тоді як вбудований Plugin app-server Codex
  вибирається через `agentRuntime.id: "codex"` або застарілі посилання на модель
  `codex/*`

## Усунення несправностей runtime hooks

Якщо Plugin з’являється в `plugins list`, але побічні ефекти `register(api)` або hooks
не виконуються в живому чат-трафіку, спершу перевірте це:

- Запустіть `openclaw gateway status --deep --require-rpc` і підтвердьте, що активні
  URL Gateway, профіль, шлях конфігурації та процес є саме тими, які ви редагуєте.
- Перезапустіть live Gateway після змін установлення/конфігурації/коду Plugin. У контейнерах-обгортках
  PID 1 може бути лише супервізором; перезапустіть або сигналізуйте дочірньому
  процесу `openclaw gateway run`.
- Використовуйте `openclaw plugins inspect <id> --runtime --json`, щоб підтвердити реєстрації hook і
  діагностику. Невбудовані hooks розмови, як-от `llm_input`,
  `llm_output`, `before_agent_finalize` і `agent_end`, потребують
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання моделей віддавайте перевагу `before_model_resolve`. Він виконується перед розв’язанням моделі
  для ходів агента; `llm_output` виконується лише після того, як спроба моделі
  створює вивід асистента.
- Для доказу ефективної моделі сесії використовуйте `openclaw sessions` або
  поверхні сесії/статусу Gateway і, під час налагодження payload провайдера, запускайте
  Gateway з `--raw-stream --raw-stream-path <path>`.

### Повільне налаштування інструментів Plugin

Якщо здається, що ходи агента зависають під час підготовки інструментів, увімкніть trace-логування і
перевірте рядки часу фабрик інструментів Plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Шукайте:

```text
[trace:plugin-tools] factory timings ...
```

Зведення перелічує загальний час фабрик і найповільніші фабрики інструментів Plugin,
зокрема id Plugin, оголошені назви інструментів, форму результату та чи є інструмент
необов’язковим. Повільні рядки підвищуються до попереджень, коли одна фабрика займає
щонайменше 1 с або загальна підготовка фабрик інструментів Plugin займає щонайменше 5 с.

OpenClaw кешує успішні результати фабрик інструментів Plugin для повторних розв’язань
із тим самим ефективним контекстом запиту. Ключ кешу містить ефективну
runtime-конфігурацію, робочу область, id агента/сесії, політику sandbox, налаштування браузера,
контекст доставлення, ідентичність запитувача та стан власності, тому фабрики, що
залежать від цих довірених полів, виконуються повторно, коли контекст змінюється.

Якщо один Plugin домінує в таймінгах, перевірте його runtime-реєстрації:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Потім оновіть, перевстановіть або вимкніть цей Plugin. Автори Plugin мають перенести
дороге завантаження залежностей за шлях виконання інструмента замість виконання його
всередині фабрики інструмента.

### Дублювання володіння каналом або інструментом

Симптоми:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Це означає, що більш ніж один увімкнений Plugin намагається володіти тим самим каналом,
потоком налаштування або назвою інструмента. Найпоширеніша причина — зовнішній Plugin каналу,
установлений поруч із вбудованим Plugin, який тепер надає той самий id каналу.

Кроки налагодження:

- Запустіть `openclaw plugins list --enabled --verbose`, щоб побачити кожен увімкнений Plugin
  і походження.
- Запустіть `openclaw plugins inspect <id> --runtime --json` для кожного підозрюваного Plugin і
  порівняйте `channels`, `channelConfigs`, `tools` і діагностику.
- Запустіть `openclaw plugins registry --refresh` після встановлення або видалення
  пакетів Plugin, щоб збережені метадані відображали поточне встановлення.
- Перезапустіть Gateway після змін установлення, реєстру або конфігурації.

Варіанти виправлення:

- Якщо один Plugin навмисно замінює інший для того самого id каналу, бажаний
  Plugin має оголосити `channelConfigs.<channel-id>.preferOver` з
  id Plugin нижчого пріоритету. Див. [/plugins/manifest#replacing-another-channel-plugin](/uk/plugins/manifest#replacing-another-channel-plugin).
- Якщо дублювання випадкове, вимкніть одну сторону через
  `plugins.entries.<plugin-id>.enabled: false` або видаліть застаріле встановлення
  Plugin.
- Якщо ви явно ввімкнули обидва Plugin, OpenClaw зберігає цей запит і
  повідомляє про конфлікт. Виберіть одного власника каналу або перейменуйте інструменти,
  що належать Plugin, щоб runtime-поверхня була однозначною.

## Слоти Plugin (ексклюзивні категорії)

Деякі категорії є ексклюзивними (активною може бути лише одна за раз):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // or "none" to disable
      contextEngine: "legacy", // or a plugin id
    },
  },
}
```

| Слот            | Що він контролює      | Типове значення      |
| --------------- | --------------------- | ------------------- |
| `memory`        | Active memory plugin  | `memory-core`       |
| `contextEngine` | Active context engine | `legacy` (built-in) |

## Довідник CLI

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
openclaw plugins search <query>            # search ClawHub plugin catalog
openclaw plugins inspect <id>              # static detail
openclaw plugins inspect <id> --runtime    # registered hooks/tools/CLI/gateway methods
openclaw plugins inspect <id> --json       # machine-readable
openclaw plugins inspect --all             # fleet-wide table
openclaw plugins info <id>                 # inspect alias
openclaw plugins doctor                    # diagnostics
openclaw plugins registry                  # inspect persisted registry state
openclaw plugins registry --refresh        # rebuild persisted registry
openclaw doctor --fix                      # repair plugin registry state

openclaw plugins install <package>         # install from npm by default
openclaw plugins install clawhub:<pkg>     # install from ClawHub only
openclaw plugins install npm:<pkg>         # install from npm only
openclaw plugins install git:<repo>        # install from git
openclaw plugins install git:<repo>@<ref>  # install from git ref
openclaw plugins install <spec> --force    # overwrite existing install
openclaw plugins install <path>            # install from local path
openclaw plugins install -l <path>         # link (no copy) for dev
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # record exact resolved npm spec
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # update one plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # update all
openclaw plugins uninstall <id>          # remove config and plugin index records
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

# Verify runtime registrations after install.
openclaw plugins inspect <id> --runtime --json

# Run plugin-owned CLI commands directly from the OpenClaw root CLI.
openclaw <plugin-command> --help

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Вбудовані Plugin постачаються з OpenClaw. Багато з них увімкнено за замовчуванням (наприклад,
вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований браузерний
Plugin). Інші вбудовані Plugin усе ще потребують `openclaw plugins enable <id>`.

`--force` перезаписує наявний установлений Plugin або hook pack на місці. Використовуйте
`openclaw plugins update <id-or-npm-spec>` для звичайних оновлень відстежуваних npm
Plugin. Це не підтримується з `--link`, який повторно використовує шлях джерела замість
копіювання поверх керованої цілі встановлення.

Коли `plugins.allow` уже задано, `openclaw plugins install` додає
id встановленого Plugin до цього allowlist перед його ввімкненням. Якщо той самий id Plugin
присутній у `plugins.deny`, install видаляє цей застарілий запис deny, щоб
явно встановлений Plugin можна було одразу завантажити після перезапуску.

OpenClaw зберігає сталий локальний реєстр plugin як холодну модель читання для
інвентаризації plugin, володіння внесками та планування запуску. Потоки install, update,
uninstall, enable і disable оновлюють цей реєстр після зміни стану plugin.
Той самий файл `plugins/installs.json` зберігає довговічні метадані встановлення в
верхньорівневому `installRecords` і перебудовувані метадані маніфестів у `plugins`. Якщо
реєстр відсутній, застарілий або недійсний, `openclaw plugins registry
--refresh` перебудовує його подання маніфестів із записів встановлення, політики конфігурації та
метаданих маніфесту/пакета без завантаження runtime-модулів plugin.
`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних встановлень. Передання
специфікації npm-пакета з dist-tag або точною версією зіставляє назву пакета
назад із відстежуваним записом plugin і записує нову специфікацію для майбутніх оновлень.
Передання назви пакета без версії повертає точно закріплене встановлення назад до
стандартної лінії випусків реєстру. Якщо встановлений npm plugin уже відповідає
розв’язаній версії та записаній ідентичності артефакту, OpenClaw пропускає оновлення
без завантаження, перевстановлення або перезапису конфігурації.
Коли `openclaw update` запускається на beta-каналі, записи npm і ClawHub
plugin стандартної лінії спочатку пробують `@beta` і повертаються до default/latest, якщо beta-випуску
plugin не існує. Точні версії та явні теги залишаються закріпленими.

`--pin` підтримується лише для npm. Він не підтримується з `--marketplace`, бо
встановлення з marketplace зберігають метадані джерела marketplace замість npm-специфікації.

`--dangerously-force-unsafe-install` — це аварійне перевизначення для хибних
спрацювань вбудованого сканера небезпечного коду. Воно дозволяє встановлення
plugin і оновлення plugin продовжуватися попри вбудовані знахідки рівня `critical`, але все одно
не обходить блокування політикою plugin `before_install` або блокування через збій сканування.
Сканування встановлення ігнорує типові тестові файли та каталоги, як-от `tests/`,
`__tests__/`, `*.test.*` і `*.spec.*`, щоб не блокувати запаковані тестові моки;
оголошені runtime-точки входу plugin все одно скануються, навіть якщо вони використовують одну з
цих назв.

Цей прапорець CLI застосовується лише до потоків install/update для plugin. Встановлення
залежностей Skills на базі Gateway натомість використовують відповідне перевизначення запиту
`dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим
потоком завантаження/встановлення Skills із ClawHub.

Якщо plugin, який ви опублікували на ClawHub, приховано або заблоковано скануванням, відкрийте
панель ClawHub або запустіть `clawhub package rescan <name>`, щоб попросити ClawHub перевірити
його знову. `--dangerously-force-unsafe-install` впливає лише на встановлення на вашій власній
машині; він не просить ClawHub повторно просканувати plugin або зробити заблокований випуск
публічним.

Сумісні bundles беруть участь у тому самому потоці списку/огляду/увімкнення/вимкнення
plugin. Поточна runtime-підтримка включає bundle Skills, Claude command-skills,
стандартні значення Claude `settings.json`, стандартні значення Claude `.lsp.json` та оголошені в маніфесті
`lspServers`, Cursor command-skills і сумісні каталоги Codex hooks.

`openclaw plugins inspect <id>` також повідомляє виявлені можливості bundle плюс
підтримувані або непідтримувані записи MCP і LSP server для plugin на основі bundle.

Джерела marketplace можуть бути відомою назвою Claude marketplace з
`~/.claude/plugins/known_marketplaces.json`, локальним коренем marketplace або шляхом до
`marketplace.json`, скороченням GitHub на кшталт `owner/repo`, URL репозиторію GitHub
або git URL. Для віддалених marketplaces записи plugin мають залишатися всередині
клонованого репозиторію marketplace і використовувати лише відносні джерела шляхів.

Див. [довідник CLI `openclaw plugins`](/uk/cli/plugins) для повної інформації.

## Огляд Plugin API

Native plugins експортують entry object, який надає `register(api)`. Старіші
plugins усе ще можуть використовувати `activate(api)` як застарілий alias, але нові plugins повинні
використовувати `register`.

```typescript
export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
    api.registerChannel({
      /* ... */
    });
  },
});
```

OpenClaw завантажує entry object і викликає `register(api)` під час
активації plugin. Loader усе ще відступає до `activate(api)` для старіших plugins,
але bundled plugins і нові external plugins повинні вважати `register`
публічним контрактом.

`api.registrationMode` повідомляє plugin, чому його entry завантажується:

| Режим           | Значення                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Runtime-активація. Реєструйте tools, hooks, services, commands, routes та інші активні побічні ефекти.                              |
| `discovery`     | Виявлення можливостей лише для читання. Реєструйте providers і metadata; довірений entry code plugin може завантажуватися, але пропускайте активні побічні ефекти. |
| `setup-only`    | Завантаження метаданих налаштування channel через легкий setup entry.                                                                |
| `setup-runtime` | Завантаження налаштування channel, яке також потребує runtime entry.                                                                         |
| `cli-metadata`  | Лише збирання метаданих команд CLI.                                                                                            |

Plugin entries, які відкривають sockets, databases, background workers або довгоживучі
clients, повинні захищати ці побічні ефекти за допомогою `api.registrationMode === "full"`.
Discovery-завантаження кешуються окремо від activation-завантажень і не замінюють
запущений реєстр Gateway. Discovery не активує, але не є вільним від imports:
OpenClaw може виконати довірений entry plugin або модуль channel plugin, щоб побудувати
snapshot. Тримайте top-level модулів легкими та без побічних ефектів, а
network clients, subprocesses, listeners, читання credentials і запуск services переносіть
за full-runtime шляхи.

Поширені методи реєстрації:

| Метод                                   | Що він реєструє              |
| --------------------------------------- | ---------------------------- |
| `registerProvider`                      | Model provider (LLM)         |
| `registerChannel`                       | Chat channel                 |
| `registerTool`                          | Agent tool                   |
| `registerHook` / `on(...)`              | Lifecycle hooks              |
| `registerSpeechProvider`                | Text-to-speech / STT         |
| `registerRealtimeTranscriptionProvider` | Streaming STT                |
| `registerRealtimeVoiceProvider`         | Duplex realtime voice        |
| `registerMediaUnderstandingProvider`    | Аналіз image/audio           |
| `registerImageGenerationProvider`       | Генерація images             |
| `registerMusicGenerationProvider`       | Генерація music              |
| `registerVideoGenerationProvider`       | Генерація video              |
| `registerWebFetchProvider`              | Provider для web fetch / scrape |
| `registerWebSearchProvider`             | Web search                   |
| `registerHttpRoute`                     | HTTP endpoint                |
| `registerCommand` / `registerCli`       | Команди CLI                  |
| `registerContextEngine`                 | Context engine               |
| `registerService`                       | Background service           |

Поведінка guard для типізованих lifecycle hooks:

- `before_tool_call`: `{ block: true }` є кінцевим; handlers із нижчим priority пропускаються.
- `before_tool_call`: `{ block: false }` є no-op і не очищає попередній block.
- `before_install`: `{ block: true }` є кінцевим; handlers із нижчим priority пропускаються.
- `before_install`: `{ block: false }` є no-op і не очищає попередній block.
- `message_sending`: `{ cancel: true }` є кінцевим; handlers із нижчим priority пропускаються.
- `message_sending`: `{ cancel: false }` є no-op і не очищає попередній cancel.

Native Codex app-server передає події Codex-native tools назад у цю
поверхню hooks. Plugins можуть блокувати native Codex tools через `before_tool_call`,
спостерігати результати через `after_tool_call` і брати участь у затвердженнях Codex
`PermissionRequest`. Bridge поки що не переписує аргументи Codex-native tools.
Точна межа підтримки Codex runtime описана в
[контракті підтримки Codex harness v1](/uk/plugins/codex-harness#v1-support-contract).

Повну поведінку типізованих hooks див. в [огляді SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Створення plugins](/uk/plugins/building-plugins) — створіть власний plugin
- [Plugin bundles](/uk/plugins/bundles) — сумісність bundles Codex/Claude/Cursor
- [Маніфест plugin](/uk/plugins/manifest) — схема маніфесту
- [Реєстрація tools](/uk/plugins/building-plugins#registering-agent-tools) — додайте agent tools у plugin
- [Внутрішня архітектура plugin](/uk/plugins/architecture) — модель можливостей і pipeline завантаження
- [Спільнотні plugins](/uk/plugins/community) — сторонні listings
