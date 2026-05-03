---
read_when:
    - Встановлення або налаштування Plugin
    - Розуміння правил виявлення та завантаження Plugin
    - Робота з пакетами Plugin, сумісними з Codex/Claude
sidebarTitle: Install and Configure
summary: Встановлюйте, налаштовуйте та керуйте плагінами OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-05-03T15:53:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 937623bf3bfd7832680264b28deaef58970b35fdae7cfa0e5731c097eccc38e6
    source_path: tools/plugin.md
    workflow: 16
---

Плагіни розширюють OpenClaw новими можливостями: канали, постачальники моделей,
оболонки агентів, інструменти, Skills, мовлення, транскрипція в реальному часі, голос у реальному часі,
розуміння медіа, генерація зображень, генерація відео, отримання вебвмісту, вебпошук
та інше. Деякі плагіни є **core** (постачаються з OpenClaw), інші
є **зовнішніми**. Більшість зовнішніх плагінів публікуються та знаходяться через
[ClawHub](/uk/tools/clawhub). Npm залишається підтримуваним для прямих встановлень і для
тимчасового набору пакетів плагінів, що належать OpenClaw, доки ця міграція завершується.

## Швидкий старт

Приклади встановлення, перегляду списку, видалення, оновлення та публікації для копіювання дивіться в
[Керування плагінами](/uk/plugins/manage-plugins).

<Steps>
  <Step title="Перегляньте, що завантажено">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Встановіть плагін">
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

  <Step title="Перезапустіть Gateway">
    ```bash
    openclaw gateway restart
    ```

    Потім налаштуйте в `plugins.entries.\<id\>.config` у вашому файлі конфігурації.

  </Step>

  <Step title="Керування в чаті">
    У запущеному Gateway команди лише для власника `/plugins enable` і `/plugins disable`
    запускають перезавантажувач конфігурації Gateway. Gateway перезавантажує runtime-поверхні плагінів
    у процесі, а нові ходи агента перебудовують список інструментів із
    оновленого реєстру. `/plugins install` змінює вихідний код плагіна, тому
    Gateway запитує перезапуск, замість удавати, що поточний процес може
    безпечно перезавантажити вже імпортовані модулі.

  </Step>

  <Step title="Перевірте плагін">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Використовуйте `--runtime`, коли потрібно довести зареєстровані інструменти, сервіси, методи Gateway,
    hooks або CLI-команди, що належать плагіну. Звичайний `inspect` є холодною
    перевіркою маніфесту/реєстру й навмисно уникає імпорту runtime плагіна.

  </Step>
</Steps>

Якщо ви віддаєте перевагу керуванню в чаті, увімкніть `commands.plugins: true` і використовуйте:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Шлях встановлення використовує той самий розв’язувач, що й CLI: локальний шлях/архів, явний
`clawhub:<pkg>`, явний `npm:<pkg>`, явний `git:<repo>` або проста специфікація пакета
через npm.

Якщо конфігурація недійсна, встановлення зазвичай завершується закритою відмовою й спрямовує вас до
`openclaw doctor --fix`. Єдиний виняток для відновлення — вузький шлях перевстановлення bundled-плагіна
для плагінів, які явно вмикають
`openclaw.install.allowInvalidConfigRecovery`.
Під час запуску Gateway недійсна конфігурація одного плагіна ізолюється до цього плагіна:
запуск записує проблему `plugins.entries.<id>.config`, пропускає цей плагін під час
завантаження та залишає інші плагіни й канали онлайн. Запустіть `openclaw doctor --fix`,
щоб ізолювати погану конфігурацію плагіна, вимкнувши цей запис плагіна та видаливши
його недійсне конфігураційне навантаження; звичайна резервна копія конфігурації зберігає попередні значення.
Коли конфігурація каналу посилається на плагін, який більше не можна знайти, але той самий
застарілий id плагіна залишається в конфігурації плагіна або записах встановлення, запуск Gateway
записує попередження та пропускає цей канал замість блокування всіх інших каналів.
Запустіть `openclaw doctor --fix`, щоб видалити застарілі записи каналу/плагіна; невідомі
ключі каналів без доказів застарілого плагіна все одно не проходять валідацію, щоб помилки введення залишалися
видимими.
Якщо встановлено `plugins.enabled: false`, застарілі посилання на плагіни вважаються інертними:
запуск Gateway пропускає виявлення/завантаження плагінів, а `openclaw doctor` зберігає
вимкнену конфігурацію плагіна замість автоматичного видалення. Повторно увімкніть плагіни перед
запуском очищення doctor, якщо хочете видалити застарілі id плагінів.

Встановлення залежностей плагіна відбувається лише під час явних потоків встановлення/оновлення або
ремонту doctor. Запуск Gateway, перезавантаження конфігурації та runtime-інспекція
не запускають менеджери пакетів і не ремонтують дерева залежностей. Локальні плагіни вже мають
мати встановлені залежності, тоді як npm-, git- і ClawHub-плагіни
встановлюються в керовані корені плагінів OpenClaw. Залежності npm можуть бути hoisted
у межах керованого npm-кореня OpenClaw; встановлення/оновлення сканує цей керований корінь перед
довірою, а видалення прибирає npm-керовані пакети через npm. Зовнішні плагіни
та власні шляхи завантаження все одно потрібно встановлювати через `openclaw plugins install`.
Використовуйте `openclaw plugins list --json`, щоб побачити статичний `dependencyStatus` для кожного
видимого плагіна без імпорту runtime-коду або ремонту залежностей.
Дивіться [Розв’язання залежностей Plugin](/uk/plugins/dependency-resolution) щодо життєвого циклу
під час встановлення.

Для npm-встановлень змінні селектори, як-от `latest` або dist-tag, розв’язуються
перед встановленням, а потім закріплюються за точною перевіреною версією в керованому
npm-корені OpenClaw. Після завершення npm OpenClaw перевіряє, що встановлений
запис `package-lock.json` усе ще відповідає розв’язаній версії та integrity. Якщо
npm записує інші метадані пакета, встановлення завершується помилкою, а керований пакет
відкочується замість прийняття іншого артефакту плагіна.

Вихідні checkout-и є pnpm-робочими просторами. Якщо ви клонуєте OpenClaw, щоб працювати над bundled
плагінами, запустіть `pnpm install`; тоді OpenClaw завантажує bundled плагіни з
`extensions/<id>`, тож правки й пакетно-локальні залежності використовуються напряму.
Звичайні встановлення кореня npm призначені для пакетованого OpenClaw, а не для розробки
з вихідного checkout-а.

## Типи плагінів

OpenClaw розпізнає два формати плагінів:

| Формат     | Як це працює                                                       | Приклади                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Нативний** | `openclaw.plugin.json` + runtime-модуль; виконується в процесі       | Офіційні плагіни, спільнотні npm-пакети               |
| **Bundle** | Codex/Claude/Cursor-сумісна структура; відображається на можливості OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва відображаються в `openclaw plugins list`. Дивіться [Plugin Bundles](/uk/plugins/bundles) для деталей bundle.

Якщо ви пишете нативний плагін, почніть із [Створення Plugins](/uk/plugins/building-plugins)
та [Огляду Plugin SDK](/uk/plugins/sdk-overview).

## Точки входу пакетів

Нативні npm-пакети плагінів мають оголошувати `openclaw.extensions` у `package.json`.
Кожен запис має залишатися всередині каталогу пакета й розв’язуватися в читабельний
runtime-файл або у вихідний файл TypeScript з виведеним збудованим JavaScript
аналогом, наприклад `src/index.ts` до `dist/index.js`.
Пакетовані встановлення мають постачати цей JavaScript runtime-вивід. Резервний варіант
вихідного TypeScript призначений для вихідних checkout-ів і локальних шляхів розробки, а не для
npm-пакетів, встановлених у керований корінь плагінів OpenClaw.

Використовуйте `openclaw.runtimeExtensions`, коли опубліковані runtime-файли не розташовані за
тими самими шляхами, що й вихідні записи. Якщо присутній, `runtimeExtensions` має містити
рівно один запис для кожного запису `extensions`. Невідповідні списки провалюють встановлення та
виявлення плагінів замість тихого повернення до вихідних шляхів. Якщо ви також
публікуєте `openclaw.setupEntry`, використовуйте `openclaw.runtimeSetupEntry` для його збудованого
JavaScript-аналога; цей файл обов’язковий, коли оголошений.

```json
{
  "name": "@acme/openclaw-plugin",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"]
  }
}
```

## Офіційні плагіни

### npm-пакети, що належать OpenClaw, під час міграції

ClawHub є основним шляхом розповсюдження для більшості плагінів. Поточні пакетовані
випуски OpenClaw уже містять багато офіційних плагінів, тому вони не потребують
окремих npm-встановлень у звичайних налаштуваннях. Доки кожен плагін, що належить OpenClaw,
не мігрує до ClawHub, OpenClaw усе ще постачає деякі пакети плагінів `@openclaw/*`
на npm для старіших/власних встановлень і прямих npm-процесів.

Якщо npm повідомляє, що пакет плагіна `@openclaw/*` застарілий, ця версія пакета
походить зі старішої зовнішньої лінійки пакетів. Використовуйте bundled плагін із
поточного OpenClaw або локальний checkout, доки не буде опубліковано новіший npm-пакет.

| Плагін          | Пакет                    | Документація                                       |
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
  <Accordion title="Постачальники моделей (увімкнено за замовчуванням)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Плагіни пам’яті">
    - `memory-core` — bundled пошук пам’яті (за замовчуванням через `plugins.slots.memory`)
    - `memory-lancedb` — довготривала пам’ять на базі LanceDB з автоматичним згадуванням/захопленням (встановіть `plugins.slots.memory = "memory-lancedb"`)

    Дивіться [Memory LanceDB](/uk/plugins/memory-lancedb) щодо налаштування embeddings, сумісних з OpenAI,
    прикладів Ollama, лімітів згадування та усунення несправностей.

  </Accordion>

  <Accordion title="Постачальники мовлення (увімкнено за замовчуванням)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` — bundled плагін браузера для інструмента браузера, CLI `openclaw browser`, методу gateway `browser.request`, runtime браузера та стандартного сервісу керування браузером (увімкнено за замовчуванням; вимкніть перед заміною)
    - `copilot-proxy` — міст VS Code Copilot Proxy (вимкнено за замовчуванням)

  </Accordion>
</AccordionGroup>

Шукаєте сторонні плагіни? Дивіться [Плагіни спільноти](/uk/plugins/community).

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

| Поле             | Опис                                                      |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Головний перемикач (типово: `true`)                       |
| `allow`          | Список дозволених Plugin (необов’язково)                  |
| `deny`           | Список заборонених Plugin (необов’язково; deny перемагає) |
| `load.paths`     | Додаткові файли/каталоги plugin                           |
| `slots`          | Ексклюзивні селектори слотів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>` | Перемикачі + конфігурація для окремого plugin             |

`plugins.allow` є ексклюзивним. Коли він непорожній, завантажуватися або
надавати інструменти можуть лише перелічені plugins, навіть якщо `tools.allow`
містить `"*"` або конкретну назву інструмента, що належить plugin. Якщо список
дозволених інструментів посилається на інструменти plugin, додайте ідентифікатори
відповідних plugins до `plugins.allow` або приберіть `plugins.allow`; `openclaw doctor`
попереджає про таку структуру.

Зміни конфігурації, внесені через `/plugins enable` або `/plugins disable`,
запускають перезавантаження plugins Gateway у поточному процесі. Нові ходи агента
перебудовують свій список інструментів з оновленого реєстру plugins. Операції,
що змінюють джерела, як-от встановлення, оновлення та видалення, і далі
перезапускають процес Gateway, бо вже імпортовані модулі plugin неможливо
безпечно замінити на місці.

`openclaw plugins list` — це локальний знімок реєстру/config plugins. Plugin
зі станом `enabled` там означає, що збережений реєстр і поточна config дозволяють
plugin брати участь. Це не доводить, що вже запущений віддалений Gateway
перезавантажився або перезапустився з тим самим кодом plugin. У налаштуваннях
VPS/контейнерів із процесами-обгортками надсилайте перезапуски або записи, що
запускають перезавантаження, до фактичного процесу `openclaw gateway run`, або
використовуйте `openclaw gateway restart` для запущеного Gateway, коли
перезавантаження повідомляє про помилку.

<Accordion title="Стани Plugin: вимкнений, відсутній, недійсний">
  - **Вимкнений**: plugin існує, але правила ввімкнення вимкнули його. Config збережено.
  - **Відсутній**: config посилається на ідентифікатор plugin, якого не знайшло виявлення.
  - **Недійсний**: plugin існує, але його config не відповідає оголошеній схемі. Запуск Gateway пропускає лише цей plugin; `openclaw doctor --fix` може ізолювати недійсний запис, вимкнувши його та вилучивши його config payload.

</Accordion>

## Виявлення та пріоритет

OpenClaw сканує plugins у такому порядку (перший збіг перемагає):

<Steps>
  <Step title="Шляхи config">
    `plugins.load.paths` — явні шляхи до файлів або каталогів. Шляхи, що вказують
    назад на власні паковані каталоги bundled plugins OpenClaw, ігноруються;
    запустіть `openclaw doctor --fix`, щоб прибрати ці застарілі aliases.
  </Step>

  <Step title="Plugins робочої області">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` і `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Глобальні plugins">
    `~/.openclaw/<plugin-root>/*.ts` і `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Bundled plugins">
    Постачаються з OpenClaw. Багато з них увімкнені типово (провайдери моделей, мовлення).
    Інші потребують явного ввімкнення.
  </Step>
</Steps>

Паковані встановлення та Docker-образи зазвичай розв’язують bundled plugins з
скомпільованого дерева `dist/extensions`. Якщо вихідний каталог bundled plugin
примонтовано поверх відповідного пакованого шляху джерел, наприклад
`/app/extensions/synology-chat`, OpenClaw розглядає цей примонтований каталог
джерел як overlay джерел bundled plugin і виявляє його перед пакованим bundle
`/app/dist/extensions/synology-chat`. Це зберігає працездатність контейнерних
циклів мейнтейнерів без перемикання кожного bundled plugin назад на джерела
TypeScript. Установіть `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, щоб
примусово використовувати паковані dist bundles, навіть коли присутні монтування
source overlay.

### Правила ввімкнення

- `plugins.enabled: false` вимикає всі plugins і пропускає роботу з виявлення/завантаження plugins
- `plugins.deny` завжди перемагає allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей plugin
- Plugins з робочої області **типово вимкнені** (їх потрібно явно ввімкнути)
- Bundled plugins дотримуються вбудованого набору default-on, якщо його не перевизначено
- Ексклюзивні слоти можуть примусово ввімкнути вибраний plugin для цього слота
- Деякі bundled opt-in plugins вмикаються автоматично, коли config називає
  поверхню, що належить plugin, як-от provider model ref, channel config або harness
  runtime
- Застаріла config plugin зберігається, поки активний `plugins.enabled: false`;
  повторно ввімкніть plugins перед запуском очищення doctor, якщо хочете вилучити застарілі ids
- Маршрути Codex сімейства OpenAI зберігають окремі межі plugin:
  `openai-codex/*` належить OpenAI plugin, тоді як bundled Codex
  app-server plugin вибирається через `agentRuntime.id: "codex"` або застарілі
  model refs `codex/*`

## Усунення проблем runtime hooks

Якщо plugin відображається в `plugins list`, але побічні ефекти або hooks
`register(api)` не виконуються в live chat traffic, спершу перевірте це:

- Запустіть `openclaw gateway status --deep --require-rpc` і підтвердьте, що активні
  URL Gateway, профіль, шлях config і процес саме ті, які ви редагуєте.
- Перезапустіть live Gateway після змін встановлення/config/коду plugin. У
  контейнерах-обгортках PID 1 може бути лише supervisor; перезапустіть або
  надішліть сигнал дочірньому процесу `openclaw gateway run`.
- Використайте `openclaw plugins inspect <id> --runtime --json`, щоб підтвердити реєстрації hooks і
  діагностику. Небандлові conversation hooks, як-от `llm_input`,
  `llm_output`, `before_agent_finalize` і `agent_end`, потребують
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання моделей надавайте перевагу `before_model_resolve`. Він виконується до
  розв’язання моделі для ходів агента; `llm_output` виконується лише після того, як спроба моделі
  створить assistant output.
- Для доказу ефективної моделі сесії використовуйте `openclaw sessions` або
  поверхні session/status Gateway, а під час налагодження provider payloads запускайте
  Gateway з `--raw-stream --raw-stream-path <path>`.

### Повільне налаштування інструментів plugin

Якщо ходи агента, схоже, зависають під час підготовки інструментів, увімкніть trace logging і
перевірте рядки таймінгів фабрик інструментів plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Шукайте:

```text
[trace:plugin-tools] factory timings ...
```

Підсумок перелічує загальний час фабрик і найповільніші фабрики інструментів plugin,
зокрема plugin id, оголошені назви інструментів, форму результату та чи є інструмент
необов’язковим. Повільні рядки підвищуються до warnings, коли одна фабрика займає
щонайменше 1 с або загальна підготовка фабрик інструментів plugin займає щонайменше 5 с.

OpenClaw кешує успішні результати фабрик інструментів plugin для повторних розв’язань
з тим самим ефективним контекстом запиту. Ключ кешу включає ефективну
runtime config, workspace, agent/session ids, sandbox policy, browser settings,
delivery context, requester identity і ownership state, тому фабрики, що
залежать від цих довірених полів, запускаються повторно, коли контекст змінюється.

Якщо один plugin домінує в таймінгах, перевірте його runtime registrations:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Потім оновіть, перевстановіть або вимкніть цей plugin. Авторам plugins слід переносити
дороге завантаження залежностей за шлях виконання інструмента, а не робити це
всередині фабрики інструмента.

### Дубльоване володіння каналом або інструментом

Симптоми:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Це означає, що кілька ввімкнених plugins намагаються володіти тим самим каналом,
потоком налаштування або назвою інструмента. Найпоширеніша причина — зовнішній
channel plugin, встановлений поруч із bundled plugin, який тепер надає той самий channel id.

Кроки налагодження:

- Запустіть `openclaw plugins list --enabled --verbose`, щоб побачити кожен увімкнений plugin
  і походження.
- Запустіть `openclaw plugins inspect <id> --runtime --json` для кожного підозрюваного plugin і
  порівняйте `channels`, `channelConfigs`, `tools` і діагностику.
- Запустіть `openclaw plugins registry --refresh` після встановлення або видалення
  packages plugin, щоб збережені metadata відображали поточне встановлення.
- Перезапустіть Gateway після змін встановлення, реєстру або config.

Варіанти виправлення:

- Якщо один plugin навмисно замінює інший для того самого channel id, бажаний
  plugin має оголосити `channelConfigs.<channel-id>.preferOver` з ідентифікатором
  plugin нижчого пріоритету. Див. [/plugins/manifest#replacing-another-channel-plugin](/uk/plugins/manifest#replacing-another-channel-plugin).
- Якщо дублікат випадковий, вимкніть одну сторону за допомогою
  `plugins.entries.<plugin-id>.enabled: false` або видаліть застаріле встановлення
  plugin.
- Якщо ви явно ввімкнули обидва plugins, OpenClaw зберігає цей запит і
  повідомляє про конфлікт. Виберіть одного власника для каналу або перейменуйте
  інструменти, що належать plugin, щоб runtime surface була однозначною.

## Слоти Plugin (ексклюзивні категорії)

Деякі категорії ексклюзивні (лише одна активна одночасно):

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

| Слот            | Що контролює          | Типово              |
| --------------- | --------------------- | ------------------- |
| `memory`        | Plugin активної пам’яті | `memory-core`       |
| `contextEngine` | Активний context engine | `legacy` (вбудований) |

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

Комплектні plugins постачаються з OpenClaw. Багато з них увімкнені за замовчуванням (наприклад
комплектні постачальники моделей, комплектні постачальники мовлення та комплектний браузерний
plugin). Інші комплектні plugins усе ще потребують `openclaw plugins enable <id>`.

`--force` перезаписує наявний встановлений plugin або пакет хуків на місці. Використовуйте
`openclaw plugins update <id-or-npm-spec>` для звичайних оновлень відстежуваних npm
plugins. Це не підтримується з `--link`, який повторно використовує шлях до джерела замість
копіювання поверх керованої цілі встановлення.

Коли `plugins.allow` уже задано, `openclaw plugins install` додає id
встановленого plugin до цього списку дозволів перед його ввімкненням. Якщо той самий id plugin
наявний у `plugins.deny`, встановлення видаляє цей застарілий запис заборони, щоб
явно встановлений plugin можна було завантажити одразу після перезапуску.

OpenClaw зберігає сталий локальний реєстр plugins як модель холодного читання для
інвентаризації plugins, володіння внесками та планування запуску. Потоки встановлення, оновлення,
видалення, ввімкнення та вимкнення оновлюють цей реєстр після зміни стану plugin.
Той самий файл `plugins/installs.json` зберігає довговічні метадані встановлення у
верхньорівневому `installRecords` і відновлювані метадані маніфесту в `plugins`. Якщо
реєстр відсутній, застарілий або недійсний, `openclaw plugins registry
--refresh` перебудовує його подання маніфестів із записів встановлення, політики конфігурації та
метаданих маніфесту/пакета без завантаження модулів runtime plugin.
`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних встановлень. Передавання
специфікації npm-пакета з dist-tag або точною версією зіставляє назву пакета
назад із відстежуваним записом plugin і записує нову специфікацію для майбутніх оновлень.
Передавання назви пакета без версії переміщує встановлення з точно зафіксованою версією назад до
типової лінії випусків реєстру. Якщо встановлений npm plugin уже відповідає
розв’язаній версії та записаній ідентичності артефакту, OpenClaw пропускає оновлення
без завантаження, перевстановлення або переписування конфігурації.
Коли `openclaw update` запускається на beta-каналі, записи plugins npm і ClawHub
типової лінії спочатку пробують `@beta` і повертаються до default/latest, коли beta-випуску plugin
не існує. Точні версії та явні теги залишаються зафіксованими.

`--pin` призначений лише для npm. Він не підтримується з `--marketplace`, оскільки
marketplace-встановлення зберігають метадані джерела marketplace замість npm-специфікації.

`--dangerously-force-unsafe-install` — це аварійне перевизначення для хибних
спрацьовувань вбудованого сканера небезпечного коду. Воно дозволяє встановлення plugins
і оновлення plugins продовжувати після вбудованих знахідок `critical`, але все одно
не обходить блокування політики plugin `before_install` або блокування через збій сканування.
Сканування встановлення ігнорують поширені тестові файли та каталоги, як-от `tests/`,
`__tests__/`, `*.test.*` і `*.spec.*`, щоб не блокувати запаковані тестові mocks;
оголошені runtime-точки входу plugin усе одно скануються, навіть якщо вони використовують одну з
цих назв.

Цей прапорець CLI застосовується лише до потоків встановлення/оновлення plugin. Встановлення
залежностей Skills на базі Gateway натомість використовують відповідне перевизначення запиту
`dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком
завантаження/встановлення Skills із ClawHub.

Якщо plugin, який ви опублікували на ClawHub, приховано або заблоковано скануванням, відкрийте
панель керування ClawHub або запустіть `clawhub package rescan <name>`, щоб попросити ClawHub
перевірити його знову. `--dangerously-force-unsafe-install` впливає лише на встановлення на вашій
власній машині; він не просить ClawHub повторно сканувати plugin і не робить заблокований випуск
публічним.

Сумісні bundles беруть участь у тому самому потоці списку/інспектування/ввімкнення/вимкнення
plugins. Поточна підтримка runtime охоплює bundle Skills, command-skills Claude,
типові значення Claude `settings.json`, типові значення Claude `.lsp.json` і
оголошені в маніфесті `lspServers`, command-skills Cursor і сумісні каталоги хуків Codex.

`openclaw plugins inspect <id>` також повідомляє виявлені можливості bundle, а також
підтримувані або непідтримувані записи серверів MCP і LSP для plugins на базі bundle.

Джерела marketplace можуть бути назвою відомого marketplace Claude з
`~/.claude/plugins/known_marketplaces.json`, локальним коренем marketplace або
шляхом `marketplace.json`, скороченням GitHub на кшталт `owner/repo`, URL репозиторію GitHub
або git URL. Для віддалених marketplaces записи plugins мають залишатися всередині
клонованого репозиторію marketplace і використовувати лише відносні джерела шляхів.

Див. [довідник CLI `openclaw plugins`](/uk/cli/plugins) для повної інформації.

## Огляд API Plugin

Нативні plugins експортують об’єкт входу, який відкриває `register(api)`. Старіші
plugins усе ще можуть використовувати `activate(api)` як застарілий alias, але нові plugins мають
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

OpenClaw завантажує об’єкт входу та викликає `register(api)` під час
активації plugin. Завантажувач усе ще повертається до `activate(api)` для старіших plugins,
але комплектні plugins і нові зовнішні plugins мають вважати `register`
публічним контрактом.

`api.registrationMode` повідомляє plugin, чому його точку входу завантажують:

| Режим           | Значення                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Runtime-активація. Реєструйте інструменти, хуки, служби, команди, маршрути та інші активні побічні ефекти.                              |
| `discovery`     | Виявлення можливостей лише для читання. Реєструйте постачальників і метадані; довірений код точки входу plugin може завантажуватися, але пропускайте активні побічні ефекти. |
| `setup-only`    | Завантаження метаданих налаштування каналу через легку точку входу налаштування.                                                                |
| `setup-runtime` | Завантаження налаштування каналу, якому також потрібна runtime-точка входу.                                                                         |
| `cli-metadata`  | Лише збирання метаданих команд CLI.                                                                                            |

Точки входу plugins, які відкривають сокети, бази даних, фонові workers або довготривалі
clients, мають захищати ці побічні ефекти через `api.registrationMode === "full"`.
Завантаження discovery кешуються окремо від активаційних завантажень і не замінюють
поточний реєстр Gateway. Discovery не активує, але не є вільним від імпорту:
OpenClaw може виконати довірену точку входу plugin або модуль channel plugin, щоб побудувати
snapshot. Тримайте верхні рівні модулів легкими та без побічних ефектів, а мережеві
clients, subprocesses, listeners, читання облікових даних і запуск служб перемістіть
за шляхи full-runtime.

Поширені методи реєстрації:

| Метод                                   | Що він реєструє             |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Постачальник моделей (LLM)  |
| `registerChannel`                       | Канал чату                  |
| `registerTool`                          | Інструмент агента           |
| `registerHook` / `on(...)`              | Хуки життєвого циклу        |
| `registerSpeechProvider`                | Text-to-speech / STT        |
| `registerRealtimeTranscriptionProvider` | Streaming STT               |
| `registerRealtimeVoiceProvider`         | Duplex realtime voice       |
| `registerMediaUnderstandingProvider`    | Аналіз зображень/аудіо      |
| `registerImageGenerationProvider`       | Генерація зображень         |
| `registerMusicGenerationProvider`       | Генерація музики            |
| `registerVideoGenerationProvider`       | Генерація відео             |
| `registerWebFetchProvider`              | Постачальник web fetch / scrape |
| `registerWebSearchProvider`             | Вебпошук                    |
| `registerHttpRoute`                     | HTTP endpoint               |
| `registerCommand` / `registerCli`       | Команди CLI                 |
| `registerContextEngine`                 | Context engine              |
| `registerService`                       | Фонова служба               |

Поведінка guard для типізованих хуків життєвого циклу:

- `before_tool_call`: `{ block: true }` є кінцевим; handlers із нижчим пріоритетом пропускаються.
- `before_tool_call`: `{ block: false }` не виконує дії й не очищує попередній block.
- `before_install`: `{ block: true }` є кінцевим; handlers із нижчим пріоритетом пропускаються.
- `before_install`: `{ block: false }` не виконує дії й не очищує попередній block.
- `message_sending`: `{ cancel: true }` є кінцевим; handlers із нижчим пріоритетом пропускаються.
- `message_sending`: `{ cancel: false }` не виконує дії й не очищує попередній cancel.

Нативний app-server Codex проводить події нативних інструментів Codex назад у цю
поверхню хуків. Plugins можуть блокувати нативні інструменти Codex через `before_tool_call`,
спостерігати результати через `after_tool_call` і брати участь у схваленнях Codex
`PermissionRequest`. Bridge ще не переписує аргументи нативних інструментів Codex.
Точна межа підтримки runtime Codex описана в
[контракті підтримки Codex harness v1](/uk/plugins/codex-harness#v1-support-contract).

Повну поведінку типізованих хуків див. в [огляді SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Створення plugins](/uk/plugins/building-plugins) — створіть власний plugin
- [Plugin bundles](/uk/plugins/bundles) — сумісність bundles Codex/Claude/Cursor
- [Маніфест Plugin](/uk/plugins/manifest) — схема маніфесту
- [Реєстрація інструментів](/uk/plugins/building-plugins#registering-agent-tools) — додайте інструменти агента в plugin
- [Внутрішня архітектура Plugin](/uk/plugins/architecture) — модель можливостей і pipeline завантаження
- [Спільнотні plugins](/uk/plugins/community) — сторонні списки
