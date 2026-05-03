---
read_when:
    - Встановлення або налаштування Plugin
    - Розуміння правил виявлення та завантаження Plugin
    - Робота з пакетами Plugin, сумісними з Codex/Claude
sidebarTitle: Install and Configure
summary: Встановлення, налаштування й керування плагінами OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-05-03T17:12:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 30e3cffc15c5c52dd539e21103c207c9e38955f9fd3acd561a52964eefafb8f0
    source_path: tools/plugin.md
    workflow: 16
---

Plugins розширюють OpenClaw новими можливостями: канали, постачальники моделей,
середовища агентів, інструменти, Skills, мовлення, транскрипція в реальному часі,
голос у реальному часі, розуміння медіа, генерація зображень, генерація відео, веботримання, вебпошук
та інше. Деякі plugins є **основними** (постачаються з OpenClaw), інші
є **зовнішніми**. Більшість зовнішніх plugins публікуються й виявляються через
[ClawHub](/uk/tools/clawhub). Npm і далі підтримується для прямих установлень і для
тимчасового набору пакетів plugins, що належать OpenClaw, поки ця міграція завершується.

## Швидкий старт

Приклади встановлення, перегляду списку, видалення, оновлення та публікації для копіювання і вставлення див.
[Керування plugins](/uk/plugins/manage-plugins).

<Steps>
  <Step title="See what is loaded">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Install a plugin">
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

  <Step title="Restart the Gateway">
    ```bash
    openclaw gateway restart
    ```

    Потім налаштуйте в `plugins.entries.\<id\>.config` у вашому файлі конфігурації.

  </Step>

  <Step title="Chat-native management">
    У запущеному Gateway доступні лише власнику `/plugins enable` і `/plugins disable`
    запускають перезавантажувач конфігурації Gateway. Gateway перезавантажує runtime-поверхні
    plugin у поточному процесі, а нові ходи агента перебудовують свій список інструментів з
    оновленого реєстру. `/plugins install` змінює вихідний код plugin, тому
    Gateway запитує перезапуск замість того, щоб удавати, ніби поточний процес може
    безпечно перезавантажити вже імпортовані модулі.

  </Step>

  <Step title="Verify the plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Використовуйте `--runtime`, коли потрібно довести зареєстровані інструменти, сервіси, методи gateway,
    хуки або CLI-команди, що належать plugin. Звичайний `inspect` є холодною
    перевіркою маніфесту/реєстру й навмисно уникає імпорту runtime plugin.

  </Step>
</Steps>

Якщо ви віддаєте перевагу керуванню безпосередньо з чату, увімкніть `commands.plugins: true` і використовуйте:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Шлях встановлення використовує той самий резолвер, що й CLI: локальний шлях/архів, явний
`clawhub:<pkg>`, явний `npm:<pkg>`, явний `git:<repo>` або проста специфікація пакета
через npm.

Якщо конфігурація недійсна, встановлення зазвичай відмовляє закрито й спрямовує вас до
`openclaw doctor --fix`. Єдиний виняток для відновлення — вузький шлях перевстановлення
вбудованого plugin для plugins, які явно обирають
`openclaw.install.allowInvalidConfigRecovery`.
Під час запуску Gateway недійсна конфігурація plugin відмовляє закрито, як і будь-яка інша недійсна
конфігурація. Запустіть `openclaw doctor --fix`, щоб ізолювати погану конфігурацію plugin,
вимкнувши цей запис plugin і видаливши його недійсне корисне навантаження конфігурації; звичайна
резервна копія конфігурації зберігає попередні значення.
Коли конфігурація каналу посилається на plugin, який більше не виявляється, але той самий
застарілий id plugin лишається в конфігурації plugin або записах установлення, запуск Gateway
записує попередження в журнали й пропускає цей канал замість блокування всіх інших каналів.
Запустіть `openclaw doctor --fix`, щоб видалити застарілі записи каналу/plugin; невідомі
ключі каналів без доказів застарілого plugin і далі не проходять валідацію, щоб помилки друку залишались
помітними.
Якщо задано `plugins.enabled: false`, застарілі посилання на plugin трактуються як інертні:
запуск Gateway пропускає роботу з виявлення/завантаження plugin, а `openclaw doctor` зберігає
вимкнену конфігурацію plugin замість автоматичного видалення. Повторно ввімкніть plugins перед
запуском очищення doctor, якщо хочете видалити застарілі id plugin.

Установлення залежностей plugin відбувається лише під час явних потоків install/update або
виправлення doctor. Запуск Gateway, перезавантаження конфігурації та інспекція runtime не
запускають менеджери пакетів і не відновлюють дерева залежностей. Локальні plugins вже повинні
мати встановлені залежності, тоді як npm, git і ClawHub plugins встановлюються
в керовані корені plugin OpenClaw. Залежності npm можуть бути підняті
в межах керованого npm-кореня OpenClaw; install/update сканує цей керований корінь перед
довірою, а uninstall видаляє керовані npm пакети через npm. Зовнішні plugins
і власні шляхи завантаження все одно мають бути встановлені через `openclaw plugins install`.
Використовуйте `openclaw plugins list --json`, щоб побачити статичний `dependencyStatus` для кожного
видимого plugin без імпорту runtime-коду або відновлення залежностей.
Див. [Розв’язання залежностей Plugin](/uk/plugins/dependency-resolution) щодо
життєвого циклу під час встановлення.

Для npm-встановлень змінні селектори, такі як `latest` або dist-tag, розв’язуються
перед установленням, а потім закріплюються на точній перевіреній версії в керованому
npm-корені OpenClaw. Після завершення npm OpenClaw перевіряє, що встановлений
запис `package-lock.json` досі відповідає розв’язаній версії та цілісності. Якщо
npm записує інші метадані пакета, установлення завершується помилкою, а керований пакет
відкочується замість прийняття іншого артефакту plugin.

Вихідні checkout-и є pnpm workspaces. Якщо ви клонуєте OpenClaw, щоб працювати над вбудованими
plugins, запустіть `pnpm install`; після цього OpenClaw завантажує вбудовані plugins з
`extensions/<id>`, тому зміни та локальні для пакета залежності використовуються напряму.
Звичайні встановлення в npm root призначені для пакетованого OpenClaw, а не для розробки
у checkout вихідного коду.

## Типи Plugin

OpenClaw розпізнає два формати plugin:

| Формат     | Як це працює                                                       | Приклади                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Нативний** | `openclaw.plugin.json` + runtime-модуль; виконується в процесі       | Офіційні plugins, npm-пакети спільноти               |
| **Bundle** | Сумісна з Codex/Claude/Cursor структура; зіставляється з функціями OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва з’являються в `openclaw plugins list`. Див. [Plugin Bundles](/uk/plugins/bundles) для подробиць про bundle.

Якщо ви пишете нативний plugin, почніть з [Створення Plugins](/uk/plugins/building-plugins)
і [Огляд Plugin SDK](/uk/plugins/sdk-overview).

## Точки входу пакета

Нативні npm-пакети plugin мають оголошувати `openclaw.extensions` у `package.json`.
Кожен запис має залишатися всередині каталогу пакета й розв’язуватися до читабельного
runtime-файлу або до вихідного TypeScript-файлу з виведеним зібраним JavaScript
відповідником, як-от `src/index.ts` до `dist/index.js`.
Пакетовані встановлення мають постачати цей JavaScript runtime-вивід. Резервний варіант із
вихідним TypeScript призначений для checkout-ів вихідного коду та шляхів локальної розробки, а не для
npm-пакетів, установлених у керований корінь plugin OpenClaw.

Використовуйте `openclaw.runtimeExtensions`, коли опубліковані runtime-файли не розміщені за
тими самими шляхами, що й вихідні записи. Коли `runtimeExtensions` присутній, він має містити
рівно один запис для кожного запису `extensions`. Невідповідні списки провалюють встановлення та
виявлення plugin, а не тихо повертаються до вихідних шляхів. Якщо ви також
публікуєте `openclaw.setupEntry`, використовуйте `openclaw.runtimeSetupEntry` для його зібраного
JavaScript-відповідника; цей файл є обов’язковим, коли оголошений.

```json
{
  "name": "@acme/openclaw-plugin",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"]
  }
}
```

## Офіційні plugins

### Npm-пакети, що належать OpenClaw, під час міграції

ClawHub є основним шляхом розповсюдження для більшості plugins. Поточні пакетовані
випуски OpenClaw уже містять багато офіційних plugins, тому в нормальних налаштуваннях їм не потрібні
окремі npm-встановлення. Поки кожен plugin, що належить OpenClaw, не
мігрував до ClawHub, OpenClaw і далі постачає деякі пакети plugin `@openclaw/*` в
npm для старіших/власних установлень і прямих npm-процесів.

Якщо npm повідомляє, що пакет plugin `@openclaw/*` застарілий, ця версія пакета
походить зі старішої лінійки зовнішніх пакетів. Використовуйте вбудований plugin з
поточного OpenClaw або локальний checkout, доки не буде опубліковано новіший npm-пакет.

| Plugin          | Пакет                    | Документація                                       |
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

### Основні (постачаються з OpenClaw)

<AccordionGroup>
  <Accordion title="Model providers (enabled by default)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory plugins">
    - `memory-core` — вбудований пошук пам’яті (типово через `plugins.slots.memory`)
    - `memory-lancedb` — довгострокова пам’ять на основі LanceDB з автоматичним пригадуванням/захопленням (задайте `plugins.slots.memory = "memory-lancedb"`)

    Див. [Memory LanceDB](/uk/plugins/memory-lancedb) щодо сумісного з OpenAI
    налаштування embeddings, прикладів Ollama, обмежень пригадування та усунення несправностей.

  </Accordion>

  <Accordion title="Speech providers (enabled by default)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Other">
    - `browser` — вбудований browser plugin для інструмента browser, CLI `openclaw browser`, gateway-методу `browser.request`, browser runtime і стандартного сервісу керування browser (увімкнено типово; вимкніть перед заміною)
    - `copilot-proxy` — міст VS Code Copilot Proxy (вимкнено типово)

  </Accordion>
</AccordionGroup>

Шукаєте сторонні plugins? Див. [Plugins спільноти](/uk/plugins/community).

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

| Поле            | Опис                                               |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Головний перемикач (за замовчуванням: `true`)                           |
| `allow`          | Список дозволених Plugin (необов'язково)                               |
| `deny`           | Список заборонених Plugin (необов'язково; заборона має пріоритет)                     |
| `load.paths`     | Додаткові файли/каталоги Plugin                            |
| `slots`          | Ексклюзивні селектори слотів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>` | Перемикачі та конфігурація для окремих Plugin                               |

`plugins.allow` є ексклюзивним. Коли він непорожній, завантажуватися
або надавати інструменти можуть лише перелічені Plugin, навіть якщо `tools.allow` містить `"*"` або конкретну назву
інструмента, що належить Plugin. Якщо список дозволених інструментів посилається на інструменти Plugin, додайте ідентифікатори Plugin-власників
до `plugins.allow` або вилучіть `plugins.allow`; `openclaw doctor` попереджає про таку
форму.

Зміни конфігурації, внесені через `/plugins enable` або `/plugins disable`, запускають
перезавантаження Plugin Gateway у межах процесу. Нові ходи агента перебудовують свій список інструментів із
оновленого реєстру Plugin. Операції, що змінюють джерело, як-от встановлення,
оновлення та видалення, усе ще перезапускають процес Gateway, оскільки вже імпортовані
модулі Plugin не можна безпечно замінити на місці.

`openclaw plugins list` — це локальний знімок реєстру/конфігурації Plugin. Plugin зі станом
`enabled` там означає, що збережений реєстр і поточна конфігурація дозволяють цьому
Plugin брати участь. Це не доводить, що вже запущений віддалений Gateway
перезавантажився або перезапустився з тим самим кодом Plugin. У налаштуваннях VPS/контейнерів
із процесами-обгортками надсилайте перезапуски або записи, що запускають перезавантаження, фактичному
процесу `openclaw gateway run`, або використовуйте `openclaw gateway restart` для
запущеного Gateway, коли перезавантаження повідомляє про помилку.

<Accordion title="Стани Plugin: вимкнений, відсутній, недійсний">
  - **Вимкнений**: Plugin існує, але правила ввімкнення його вимкнули. Конфігурація зберігається.
  - **Відсутній**: конфігурація посилається на ідентифікатор Plugin, який виявлення не знайшло.
  - **Недійсний**: Plugin існує, але його конфігурація не відповідає оголошеній схемі. Запуск Gateway пропускає лише цей Plugin; `openclaw doctor --fix` може помістити недійсний запис у карантин, вимкнувши його та вилучивши його конфігураційне навантаження.

</Accordion>

## Виявлення та пріоритет

OpenClaw сканує Plugin у такому порядку (перший збіг перемагає):

<Steps>
  <Step title="Шляхи конфігурації">
    `plugins.load.paths` — явні шляхи до файлів або каталогів. Шляхи, що вказують
    назад на власні упаковані каталоги вбудованих Plugin OpenClaw, ігноруються;
    виконайте `openclaw doctor --fix`, щоб вилучити ці застарілі псевдоніми.
  </Step>

  <Step title="Plugin робочого простору">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` і `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Глобальні Plugin">
    `~/.openclaw/<plugin-root>/*.ts` і `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Вбудовані Plugin">
    Постачаються з OpenClaw. Багато з них увімкнені за замовчуванням (постачальники моделей, мовлення).
    Інші потребують явного ввімкнення.
  </Step>
</Steps>

Упаковані встановлення та образи Docker зазвичай визначають вбудовані Plugin з
скомпільованого дерева `dist/extensions`. Якщо вихідний каталог вбудованого Plugin
змонтовано поверх відповідного упакованого вихідного шляху, наприклад
`/app/extensions/synology-chat`, OpenClaw розглядає цей змонтований вихідний каталог
як вбудоване вихідне накладання та виявляє його перед упакованим
пакетом `/app/dist/extensions/synology-chat`. Це зберігає працездатність контейнерних
циклів супровідників без перемикання кожного вбудованого Plugin назад на вихідний код TypeScript.
Установіть `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, щоб примусово використовувати упаковані dist-пакети
навіть за наявності змонтованих вихідних накладань.

### Правила ввімкнення

- `plugins.enabled: false` вимикає всі Plugin і пропускає роботу з виявлення/завантаження Plugin
- `plugins.deny` завжди має пріоритет над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей Plugin
- Plugin з походженням із робочого простору **вимкнені за замовчуванням** (їх потрібно явно ввімкнути)
- Вбудовані Plugin дотримуються вбудованого набору ввімкнених за замовчуванням, якщо це не перевизначено
- Ексклюзивні слоти можуть примусово ввімкнути вибраний Plugin для цього слота
- Деякі вбудовані opt-in Plugin вмикаються автоматично, коли конфігурація називає
  поверхню, що належить Plugin, як-от посилання на модель постачальника, конфігурація каналу або
  runtime стенда
- Застаріла конфігурація Plugin зберігається, доки активний `plugins.enabled: false`;
  повторно ввімкніть Plugin перед запуском очищення doctor, якщо хочете вилучити застарілі ідентифікатори
- Маршрути Codex сімейства OpenAI зберігають окремі межі Plugin:
  `openai-codex/*` належить OpenAI Plugin, тоді як вбудований Plugin app-server Codex
  вибирається через `agentRuntime.id: "codex"` або застарілі
  посилання на модель `codex/*`

## Усунення проблем із runtime-хуками

Якщо Plugin відображається в `plugins list`, але побічні ефекти або хуки `register(api)`
не виконуються в живому чат-трафіку, спершу перевірте це:

- Виконайте `openclaw gateway status --deep --require-rpc` і підтвердьте, що активні
  URL Gateway, профіль, шлях конфігурації та процес є саме тими, які ви редагуєте.
- Перезапустіть живий Gateway після змін встановлення/конфігурації/коду Plugin. У контейнерах-обгортках
  PID 1 може бути лише супервізором; перезапустіть або надішліть сигнал дочірньому
  процесу `openclaw gateway run`.
- Використайте `openclaw plugins inspect <id> --runtime --json`, щоб підтвердити реєстрації хуків і
  діагностику. Невбудованим хукам розмови, як-от `llm_input`,
  `llm_output`, `before_agent_finalize` і `agent_end`, потрібен
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання моделей віддавайте перевагу `before_model_resolve`. Він виконується перед розв'язанням моделі
  для ходів агента; `llm_output` виконується лише після того, як спроба моделі
  створить вивід асистента.
- Для підтвердження ефективної моделі сесії використовуйте `openclaw sessions` або
  поверхні сесії/статусу Gateway, а під час налагодження навантажень постачальника запускайте
  Gateway з `--raw-stream --raw-stream-path <path>`.

### Повільне налаштування інструментів Plugin

Якщо здається, що ходи агента зависають під час підготовки інструментів, увімкніть трасувальне логування та
перевірте рядки часу виконання фабрики інструментів Plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Шукайте:

```text
[trace:plugin-tools] factory timings ...
```

Зведення перелічує загальний час фабрики та найповільніші фабрики інструментів Plugin,
включно з ідентифікатором Plugin, оголошеними назвами інструментів, формою результату та тим, чи є інструмент
необов'язковим. Повільні рядки підвищуються до попереджень, коли одна фабрика займає
щонайменше 1 с або загальна підготовка фабрик інструментів Plugin займає щонайменше 5 с.

OpenClaw кешує успішні результати фабрик інструментів Plugin для повторних розв'язань
з тим самим ефективним контекстом запиту. Ключ кешу включає ефективну
runtime-конфігурацію, робочий простір, ідентифікатори агента/сесії, політику пісочниці, налаштування браузера,
контекст доставки, ідентичність запитувача та стан власності, тому фабрики, що
залежать від цих довірених полів, повторно виконуються, коли контекст змінюється.

Якщо один Plugin домінує за часом, перевірте його runtime-реєстрації:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Потім оновіть, перевстановіть або вимкніть цей Plugin. Автори Plugin мають переносити
дороге завантаження залежностей у шлях виконання інструмента, а не робити це
всередині фабрики інструмента.

### Дубльоване володіння каналом або інструментом

Симптоми:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Це означає, що більш ніж один увімкнений Plugin намагається володіти тим самим каналом,
потоком налаштування або назвою інструмента. Найпоширеніша причина — зовнішній Plugin каналу,
установлений поруч із вбудованим Plugin, який тепер надає той самий ідентифікатор каналу.

Кроки налагодження:

- Виконайте `openclaw plugins list --enabled --verbose`, щоб побачити кожен увімкнений Plugin
  і його походження.
- Виконайте `openclaw plugins inspect <id> --runtime --json` для кожного підозрюваного Plugin і
  порівняйте `channels`, `channelConfigs`, `tools` та діагностику.
- Виконайте `openclaw plugins registry --refresh` після встановлення або вилучення
  пакетів Plugin, щоб збережені метадані відображали поточне встановлення.
- Перезапустіть Gateway після змін встановлення, реєстру або конфігурації.

Варіанти виправлення:

- Якщо один Plugin навмисно замінює інший для того самого ідентифікатора каналу, бажаний
  Plugin має оголосити `channelConfigs.<channel-id>.preferOver` з
  ідентифікатором Plugin нижчого пріоритету. Див. [/plugins/manifest#replacing-another-channel-plugin](/uk/plugins/manifest#replacing-another-channel-plugin).
- Якщо дублювання випадкове, вимкніть один бік за допомогою
  `plugins.entries.<plugin-id>.enabled: false` або вилучіть застаріле встановлення Plugin.
- Якщо ви явно ввімкнули обидва Plugin, OpenClaw зберігає цей запит і
  повідомляє про конфлікт. Виберіть одного власника для каналу або перейменуйте інструменти, що належать Plugin,
  щоб runtime-поверхня була однозначною.

## Слоти Plugin (ексклюзивні категорії)

Деякі категорії ексклюзивні (активною може бути лише одна одночасно):

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

| Слот            | Що він контролює      | За замовчуванням             |
| --------------- | --------------------- | ------------------- |
| `memory`        | Активний Plugin пам'яті  | `memory-core`       |
| `contextEngine` | Активний рушій контексту | `legacy` (вбудований) |

## Довідка CLI

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

Пакетні плагіни постачаються з OpenClaw. Багато з них увімкнено за замовчуванням (наприклад
пакетні постачальники моделей, пакетні постачальники мовлення та пакетний браузерний
плагін). Інші пакетні плагіни все ще потребують `openclaw plugins enable <id>`.

`--force` перезаписує наявний установлений плагін або набір хуків на місці. Використовуйте
`openclaw plugins update <id-or-npm-spec>` для звичайних оновлень відстежуваних npm
плагінів. Він не підтримується разом із `--link`, який повторно використовує шлях до джерела замість
копіювання поверх керованої цілі встановлення.

Коли `plugins.allow` уже задано, `openclaw plugins install` додає
ідентифікатор установленого плагіна до цього списку дозволених перед його ввімкненням. Якщо той самий ідентифікатор плагіна
є в `plugins.deny`, встановлення видаляє цей застарілий запис заборони, щоб
явно встановлений плагін можна було завантажити одразу після перезапуску.

OpenClaw зберігає постійний локальний реєстр плагінів як модель холодного читання для
інвентаризації плагінів, володіння внесками та планування запуску. Потоки встановлення, оновлення,
видалення, увімкнення та вимкнення оновлюють цей реєстр після зміни стану плагіна.
Той самий файл `plugins/installs.json` зберігає довговічні метадані встановлення у
верхньорівневому `installRecords` і відновлювані метадані маніфестів у `plugins`. Якщо
реєстр відсутній, застарілий або недійсний, `openclaw plugins registry
--refresh` перебудовує його подання маніфестів із записів встановлення, політики конфігурації та
метаданих маніфестів/пакетів без завантаження модулів середовища виконання плагінів.
`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних встановлень. Передавання
специфікації npm пакета з dist-tag або точною версією зіставляє назву пакета
назад із відстежуваним записом плагіна та записує нову специфікацію для майбутніх оновлень.
Передавання назви пакета без версії повертає встановлення з точно зафіксованою версією назад до
стандартної лінії випусків реєстру. Якщо встановлений npm плагін уже відповідає
розв’язаній версії та записаній ідентичності артефакту, OpenClaw пропускає оновлення
без завантаження, перевстановлення або переписування конфігурації.
Коли `openclaw update` виконується на beta-каналі, записи npm і ClawHub
плагінів стандартної лінії спершу пробують `@beta` і повертаються до default/latest, коли beta-випуску
плагіна немає. Точні версії та явні теги залишаються зафіксованими.

`--pin` призначений лише для npm. Він не підтримується з `--marketplace`, тому що
встановлення з маркетплейсу зберігають метадані джерела маркетплейсу замість npm специфікації.

`--dangerously-force-unsafe-install` — це аварійне перевизначення для хибних
спрацьовувань вбудованого сканера небезпечного коду. Воно дозволяє встановлення
плагінів і оновлення плагінів продовжуватися попри вбудовані знахідки `critical`, але все одно
не обходить блокування політики плагінів `before_install` або блокування через помилку сканування.
Сканування під час встановлення ігнорують поширені тестові файли й каталоги, як-от `tests/`,
`__tests__/`, `*.test.*` і `*.spec.*`, щоб не блокувати запаковані тестові моки;
оголошені вхідні точки середовища виконання плагіна все одно скануються, навіть якщо вони використовують одну з
цих назв.

Цей прапорець CLI застосовується лише до потоків встановлення/оновлення плагінів. Встановлення
залежностей Skills через Gateway використовують натомість відповідне перевизначення запиту
`dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком
завантаження/встановлення Skills із ClawHub.

Якщо плагін, який ви опублікували на ClawHub, приховано або заблоковано скануванням, відкрийте
панель ClawHub або виконайте `clawhub package rescan <name>`, щоб попросити ClawHub перевірити
його знову. `--dangerously-force-unsafe-install` впливає лише на встановлення на вашому власному
комп’ютері; він не просить ClawHub повторно просканувати плагін або зробити заблокований випуск
публічним.

Сумісні бандли беруть участь у тому самому потоці списку/інспектування/увімкнення/вимкнення
плагінів. Поточна підтримка середовища виконання охоплює бандлові Skills, command-skills Claude,
типові значення Claude `settings.json`, типові значення Claude `.lsp.json` і оголошені в маніфесті
`lspServers`, command-skills Cursor і сумісні каталоги хуків Codex.

`openclaw plugins inspect <id>` також повідомляє виявлені можливості бандла, а також
підтримувані або непідтримувані записи серверів MCP і LSP для плагінів на основі бандлів.

Джерела маркетплейсу можуть бути відомою Claude назвою маркетплейсу з
`~/.claude/plugins/known_marketplaces.json`, локальним коренем маркетплейсу або шляхом до
`marketplace.json`, скороченням GitHub на кшталт `owner/repo`, URL репозиторію GitHub
або git URL. Для віддалених маркетплейсів записи плагінів мають залишатися всередині
клонованого репозиторію маркетплейсу та використовувати лише відносні джерела шляхів.

Повні відомості дивіться в [довіднику CLI `openclaw plugins`](/uk/cli/plugins).

## Огляд API плагінів

Нативні плагіни експортують об’єкт входу, який надає `register(api)`. Старіші
плагіни все ще можуть використовувати `activate(api)` як застарілий псевдонім, але новим плагінам слід
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
активації плагіна. Завантажувач усе ще повертається до `activate(api)` для старіших плагінів,
але пакетні плагіни та нові зовнішні плагіни мають розглядати `register` як
публічний контракт.

`api.registrationMode` повідомляє плагіну, чому його вхід завантажується:

| Режим           | Значення                                                                                                                         |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Активація середовища виконання. Реєструйте інструменти, хуки, служби, команди, маршрути та інші активні побічні ефекти.          |
| `discovery`     | Виявлення можливостей лише для читання. Реєструйте постачальників і метадані; довірений код входу плагіна може завантажуватися, але пропускайте активні побічні ефекти. |
| `setup-only`    | Завантаження метаданих налаштування каналу через легкий вхід налаштування.                                                       |
| `setup-runtime` | Завантаження налаштування каналу, якому також потрібен вхід середовища виконання.                                                |
| `cli-metadata`  | Лише збирання метаданих команд CLI.                                                                                              |

Входи плагінів, які відкривають сокети, бази даних, фонові робочі процеси або довгоживучі
клієнти, мають обмежувати ці побічні ефекти умовою `api.registrationMode === "full"`.
Завантаження виявлення кешуються окремо від активаційних завантажень і не замінюють
поточний реєстр Gateway. Виявлення є неактиваційним, але не без імпорту:
OpenClaw може виконати довірений вхід плагіна або модуль плагіна каналу, щоб побудувати
знімок. Тримайте верхні рівні модулів легкими та без побічних ефектів, а
мережеві клієнти, підпроцеси, слухачі, читання облікових даних і запуск служб
переносьте за шляхи повного середовища виконання.

Поширені методи реєстрації:

| Метод                                   | Що він реєструє                         |
| --------------------------------------- | --------------------------------------- |
| `registerProvider`                      | Постачальник моделей (LLM)              |
| `registerChannel`                       | Канал чату                              |
| `registerTool`                          | Інструмент агента                       |
| `registerHook` / `on(...)`              | Хуки життєвого циклу                    |
| `registerSpeechProvider`                | Перетворення тексту на мовлення / STT   |
| `registerRealtimeTranscriptionProvider` | Потоковий STT                           |
| `registerRealtimeVoiceProvider`         | Дуплексний голос у реальному часі       |
| `registerMediaUnderstandingProvider`    | Аналіз зображень/аудіо                  |
| `registerImageGenerationProvider`       | Генерація зображень                     |
| `registerMusicGenerationProvider`       | Генерація музики                        |
| `registerVideoGenerationProvider`       | Генерація відео                         |
| `registerWebFetchProvider`              | Постачальник веботримання / скрейпінгу  |
| `registerWebSearchProvider`             | Вебпошук                                |
| `registerHttpRoute`                     | HTTP кінцева точка                      |
| `registerCommand` / `registerCli`       | Команди CLI                             |
| `registerContextEngine`                 | Рушій контексту                         |
| `registerService`                       | Фонова служба                           |

Поведінка захисту хуків для типізованих хуків життєвого циклу:

- `before_tool_call`: `{ block: true }` є кінцевим; обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: `{ block: false }` є no-op і не очищує попереднє блокування.
- `before_install`: `{ block: true }` є кінцевим; обробники з нижчим пріоритетом пропускаються.
- `before_install`: `{ block: false }` є no-op і не очищує попереднє блокування.
- `message_sending`: `{ cancel: true }` є кінцевим; обробники з нижчим пріоритетом пропускаються.
- `message_sending`: `{ cancel: false }` є no-op і не очищує попереднє скасування.

Нативний app-server Codex мостить нативні події інструментів Codex назад у цю
поверхню хуків. Плагіни можуть блокувати нативні інструменти Codex через `before_tool_call`,
спостерігати результати через `after_tool_call` і брати участь у схваленнях Codex
`PermissionRequest`. Міст поки що не переписує аргументи нативних інструментів Codex.
Точна межа підтримки середовища виконання Codex описана в
[контракті підтримки Codex harness v1](/uk/plugins/codex-harness#v1-support-contract).

Повну поведінку типізованих хуків дивіться в [огляді SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Створення плагінів](/uk/plugins/building-plugins) — створіть власний плагін
- [Бандли плагінів](/uk/plugins/bundles) — сумісність бандлів Codex/Claude/Cursor
- [Маніфест плагіна](/uk/plugins/manifest) — схема маніфесту
- [Реєстрація інструментів](/uk/plugins/building-plugins#registering-agent-tools) — додайте інструменти агента в плагіні
- [Внутрішня архітектура плагінів](/uk/plugins/architecture) — модель можливостей і конвеєр завантаження
- [Плагіни спільноти](/uk/plugins/community) — списки сторонніх розробників
