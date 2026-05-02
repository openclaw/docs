---
read_when:
    - Установлення або налаштування плагінів
    - Розуміння правил виявлення та завантаження Plugin
    - Робота з пакетами Plugin, сумісними з Codex/Claude
sidebarTitle: Install and Configure
summary: Встановлюйте, налаштовуйте та керуйте Plugin OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-05-02T19:03:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 378ce95601d5b97a30bc046b8f987d17d0a40c1e48ecb3f66e02a1810b20e027
    source_path: tools/plugin.md
    workflow: 16
---

Розширення Plugin додають OpenClaw нові можливості: канали, постачальників моделей,
обгортки агентів, інструменти, Skills, мовлення, транскрипцію в реальному часі,
голос у реальному часі, розуміння медіа, генерацію зображень, генерацію відео, отримання веб-вмісту, веб-пошук
та інше. Деякі розширення Plugin є **основними** (постачаються з OpenClaw), інші
є **зовнішніми**. Більшість зовнішніх розширень Plugin публікуються й знаходяться через
[ClawHub](/uk/tools/clawhub). Npm і надалі підтримується для прямих встановлень і для
тимчасового набору пакетів Plugin, що належать OpenClaw, доки ця міграція завершується.

## Швидкий старт

<Steps>
  <Step title="Перегляньте, що завантажено">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Встановіть розширення Plugin">
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

  <Step title="Керування безпосередньо з чату">
    У запущеному Gateway команди лише для власника `/plugins enable` і `/plugins disable`
    запускають перезавантажувач конфігурації Gateway. Gateway перезавантажує поверхні
    часу виконання Plugin у процесі, а нові ходи агента перебудовують свій список інструментів із
    оновленого реєстру. `/plugins install` змінює вихідний код Plugin, тому
    Gateway запитує перезапуск, а не вдає, що поточний процес може
    безпечно перезавантажити вже імпортовані модулі.

  </Step>

  <Step title="Перевірте розширення Plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Використовуйте `--runtime`, коли потрібно підтвердити зареєстровані інструменти, сервіси, методи Gateway,
    хуки або CLI-команди, що належать Plugin. Звичайний `inspect` є холодною
    перевіркою маніфесту/реєстру й навмисно уникає імпорту часу виконання Plugin.

  </Step>
</Steps>

Якщо ви віддаєте перевагу керуванню безпосередньо з чату, увімкніть `commands.plugins: true` і використовуйте:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Шлях встановлення використовує той самий резолвер, що й CLI: локальний шлях/архів, явний
`clawhub:<pkg>`, явний `npm:<pkg>`, явний `git:<repo>` або специфікація пакета без префікса
(спершу ClawHub, потім резервний npm).

Якщо конфігурація недійсна, встановлення зазвичай завершується відмовою безпечним способом і спрямовує вас до
`openclaw doctor --fix`. Єдиний виняток для відновлення — вузький шлях перевстановлення
вбудованого Plugin для розширень Plugin, які погоджуються на
`openclaw.install.allowInvalidConfigRecovery`.
Під час запуску Gateway недійсна конфігурація одного Plugin ізолюється до цього Plugin:
запуск журналює проблему `plugins.entries.<id>.config`, пропускає цей Plugin під час
завантаження й залишає інші розширення Plugin і канали онлайн. Запустіть `openclaw doctor --fix`,
щоб ізолювати погану конфігурацію Plugin, вимкнувши цей запис Plugin і видаливши
його недійсне конфігураційне навантаження; звичайна резервна копія конфігурації зберігає попередні значення.
Коли конфігурація каналу посилається на Plugin, який більше не можна виявити, але той самий
застарілий ідентифікатор Plugin залишається в конфігурації Plugin або записах встановлення, запуск Gateway
журналює попередження й пропускає цей канал замість блокування всіх інших каналів.
Запустіть `openclaw doctor --fix`, щоб видалити застарілі записи каналу/Plugin; невідомі
ключі каналів без доказів застарілого Plugin і надалі не проходять валідацію, щоб помилки введення залишалися
видимими.
Якщо встановлено `plugins.enabled: false`, застарілі посилання на Plugin вважаються інертними:
запуск Gateway пропускає виявлення/завантаження Plugin, а `openclaw doctor` зберігає
вимкнену конфігурацію Plugin замість автоматичного видалення. Знову ввімкніть розширення Plugin перед
запуском очищення doctor, якщо хочете видалити застарілі ідентифікатори Plugin.

Встановлення залежностей Plugin відбувається лише під час явного встановлення/оновлення або
потоків відновлення doctor. Запуск Gateway, перезавантаження конфігурації та інспекція часу виконання
не запускають менеджери пакетів і не відновлюють дерева залежностей. Локальні розширення Plugin мають уже
мати встановлені залежності, тоді як npm, git і ClawHub Plugin встановлюються
в керовані корені Plugin OpenClaw. Залежності npm можуть підніматися
в межах керованого npm-кореня OpenClaw; встановлення/оновлення сканує цей керований корінь перед
довірою, а видалення прибирає керовані npm пакети через npm. Зовнішні розширення Plugin
і власні шляхи завантаження все одно потрібно встановлювати через `openclaw plugins install`.
Використовуйте `openclaw plugins list --json`, щоб побачити статичний `dependencyStatus` для кожного
видимого Plugin без імпорту коду часу виконання чи відновлення залежностей.
Див. [вирішення залежностей Plugin](/uk/plugins/dependency-resolution) для життєвого циклу
під час встановлення.

Вихідні checkout-и є pnpm-workspace. Якщо ви клонуєте OpenClaw, щоб працювати над вбудованими
розширеннями Plugin, запустіть `pnpm install`; тоді OpenClaw завантажує вбудовані розширення Plugin з
`extensions/<id>`, тож зміни та локальні залежності пакетів використовуються напряму.
Звичайні кореневі встановлення npm призначені для пакетованого OpenClaw, а не для розробки
з вихідного checkout-а.

## Типи Plugin

OpenClaw розпізнає два формати Plugin:

| Формат      | Як це працює                                                    | Приклади                                                |
| ----------- | --------------------------------------------------------------- | ------------------------------------------------------- |
| **Нативний** | `openclaw.plugin.json` + модуль часу виконання; виконується в процесі | Офіційні розширення Plugin, npm-пакети спільноти        |
| **Bundle**  | макет, сумісний із Codex/Claude/Cursor; зіставляється з можливостями OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва відображаються в `openclaw plugins list`. Див. [пакети Plugin](/uk/plugins/bundles), щоб дізнатися подробиці про bundle.

Якщо ви пишете нативний Plugin, почніть зі [створення розширень Plugin](/uk/plugins/building-plugins)
та [огляду Plugin SDK](/uk/plugins/sdk-overview).

## Точки входу пакетів

Нативні npm-пакети Plugin мають оголошувати `openclaw.extensions` у `package.json`.
Кожен запис має залишатися всередині каталогу пакета й розв’язуватися до читабельного
файлу часу виконання або до вихідного файлу TypeScript із виведеним зібраним JavaScript-
відповідником, наприклад від `src/index.ts` до `dist/index.js`.

Використовуйте `openclaw.runtimeExtensions`, коли опубліковані файли часу виконання не розміщені за
тими самими шляхами, що й вихідні записи. Якщо `runtimeExtensions` присутній, він має містити
рівно один запис для кожного запису `extensions`. Невідповідні списки провалюють встановлення та
виявлення Plugin, а не мовчки повертаються до вихідних шляхів. Якщо ви також
публікуєте `openclaw.setupEntry`, використовуйте `openclaw.runtimeSetupEntry` для його зібраного
JavaScript-відповідника; цей файл є обов’язковим, коли його оголошено.

```json
{
  "name": "@acme/openclaw-plugin",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"]
  }
}
```

## Офіційні розширення Plugin

### Npm-пакети, що належать OpenClaw, під час міграції

ClawHub є основним шляхом розповсюдження для більшості розширень Plugin. Поточні пакетовані
релізи OpenClaw уже включають багато офіційних розширень Plugin, тому їм не потрібні
окремі встановлення npm у звичайних налаштуваннях. Доки кожен Plugin, що належить OpenClaw,
не мігрував до ClawHub, OpenClaw і надалі постачає деякі пакети Plugin `@openclaw/*`
на npm для старіших/власних встановлень і прямих npm-процесів.

Якщо npm повідомляє, що пакет Plugin `@openclaw/*` застарілий, ця версія пакета
належить до старішої зовнішньої лінійки пакетів. Використовуйте вбудований Plugin із
поточного OpenClaw або локального checkout-а, доки не буде опубліковано новіший npm-пакет.

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

### Основні (постачаються з OpenClaw)

<AccordionGroup>
  <Accordion title="Постачальники моделей (увімкнено за замовчуванням)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugin пам’яті">
    - `memory-core` — вбудований пошук у пам’яті (за замовчуванням через `plugins.slots.memory`)
    - `memory-lancedb` — довгострокова пам’ять на базі LanceDB з автоматичним пригадуванням/захопленням (встановіть `plugins.slots.memory = "memory-lancedb"`)

    Див. [Memory LanceDB](/uk/plugins/memory-lancedb), щоб дізнатися про налаштування
    ембедингів, сумісних з OpenAI, приклади Ollama, ліміти пригадування та усунення несправностей.

  </Accordion>

  <Accordion title="Постачальники мовлення (увімкнено за замовчуванням)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` — вбудований браузерний Plugin для браузерного інструмента, CLI `openclaw browser`, методу Gateway `browser.request`, часу виконання браузера та стандартного сервісу керування браузером (увімкнено за замовчуванням; вимкніть перед заміною)
    - `copilot-proxy` — міст VS Code Copilot Proxy (вимкнено за замовчуванням)

  </Accordion>
</AccordionGroup>

Шукаєте сторонні розширення Plugin? Див. [розширення Plugin від спільноти](/uk/plugins/community).

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

| Поле            | Опис                                                      |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Головний перемикач (за замовчуванням: `true`)             |
| `allow`          | Список дозволених розширень Plugin (необов’язково)        |
| `deny`           | Список заборонених розширень Plugin (необов’язково; заборона має пріоритет) |
| `load.paths`     | Додаткові файли/каталоги розширень Plugin                 |
| `slots`          | Ексклюзивні селектори слотів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>` | Перемикачі + конфігурація для окремого Plugin             |

`plugins.allow` є ексклюзивним. Коли він непорожній, завантажуватися
або надавати інструменти можуть лише перелічені розширення Plugin, навіть якщо `tools.allow` містить `"*"` або конкретну
назву інструмента, що належить Plugin. Якщо список дозволених інструментів посилається на інструменти Plugin, додайте ідентифікатори розширень Plugin,
яким вони належать, до `plugins.allow` або видаліть `plugins.allow`; `openclaw doctor` попереджає про таку
форму.

Зміни конфігурації, внесені через `/plugins enable` або `/plugins disable`, запускають
перезавантаження Plugin у процесі Gateway. Нові ходи агента перебудовують свій список інструментів із
оновленого реєстру Plugin. Операції, що змінюють джерела, як-от install,
update та uninstall, усе ще перезапускають процес Gateway, тому що вже імпортовані
модулі Plugin неможливо безпечно замінити на місці.

`openclaw plugins list` — це локальний знімок реєстру/конфігурації Plugin. Plugin зі станом
`enabled` там означає, що збережений реєстр і поточна конфігурація дозволяють
Plugin брати участь. Це не доводить, що вже запущений віддалений Gateway
перезавантажився або перезапустився з тим самим кодом Plugin. У налаштуваннях VPS/контейнерів
із процесами-обгортками надсилайте перезапуски або записи, що запускають перезавантаження, до фактичного
процесу `openclaw gateway run`, або використовуйте `openclaw gateway restart` для
запущеного Gateway, коли перезавантаження повідомляє про збій.

<Accordion title="Стани Plugin: вимкнений, відсутній, недійсний">
  - **Вимкнений**: Plugin існує, але правила ввімкнення вимкнули його. Конфігурація збережена.
  - **Відсутній**: конфігурація посилається на id Plugin, який виявлення не знайшло.
  - **Недійсний**: Plugin існує, але його конфігурація не відповідає оголошеній схемі. Запуск Gateway пропускає лише цей Plugin; `openclaw doctor --fix` може ізолювати недійсний запис, вимкнувши його та видаливши його конфігураційне навантаження.

</Accordion>

## Виявлення та пріоритет

OpenClaw сканує Plugin у такому порядку (перший збіг перемагає):

<Steps>
  <Step title="Шляхи конфігурації">
    `plugins.load.paths` — явні шляхи до файлів або каталогів. Шляхи, що вказують
    назад на власні упаковані каталоги вбудованих Plugin OpenClaw, ігноруються;
    запустіть `openclaw doctor --fix`, щоб видалити ці застарілі псевдоніми.
  </Step>

  <Step title="Plugin робочої області">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` і `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Глобальні Plugin">
    `~/.openclaw/<plugin-root>/*.ts` і `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Вбудовані Plugin">
    Постачаються з OpenClaw. Багато з них увімкнені за замовчуванням (провайдери моделей, мовлення).
    Інші потребують явного ввімкнення.
  </Step>
</Steps>

Упаковані встановлення та Docker-образи зазвичай знаходять вбудовані Plugin у
скомпільованому дереві `dist/extensions`. Якщо каталог джерел вбудованого Plugin
змонтовано поверх відповідного упакованого шляху джерел, наприклад
`/app/extensions/synology-chat`, OpenClaw розглядає цей змонтований каталог джерел
як накладення джерел вбудованого Plugin і виявляє його перед упакованим
пакетом `/app/dist/extensions/synology-chat`. Це зберігає працездатність контейнерних
циклів супровідників без перемикання кожного вбудованого Plugin назад на джерела TypeScript.
Установіть `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, щоб примусово використовувати упаковані dist-пакети
навіть за наявності змонтованих накладень джерел.

### Правила ввімкнення

- `plugins.enabled: false` вимикає всі Plugin і пропускає роботу з виявлення/завантаження Plugin
- `plugins.deny` завжди має перевагу над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей Plugin
- Plugin із робочої області **вимкнені за замовчуванням** (їх потрібно явно ввімкнути)
- Вбудовані Plugin дотримуються вбудованого набору ввімкнення за замовчуванням, якщо це не перевизначено
- Ексклюзивні слоти можуть примусово ввімкнути вибраний Plugin для цього слота
- Деякі вбудовані opt-in Plugin вмикаються автоматично, коли конфігурація називає
  поверхню, що належить Plugin, як-от посилання на модель провайдера, конфігурацію каналу або runtime
  harness
- Застаріла конфігурація Plugin зберігається, доки активний `plugins.enabled: false`;
  повторно ввімкніть Plugin перед запуском очищення doctor, якщо хочете видалити застарілі id
- Маршрути Codex сімейства OpenAI зберігають окремі межі Plugin:
  `openai-codex/*` належить до OpenAI Plugin, тоді як вбудований Plugin сервера застосунку Codex
  вибирається через `agentRuntime.id: "codex"` або застарілі
  посилання на моделі `codex/*`

## Усунення несправностей runtime-хуків

Якщо Plugin з’являється в `plugins list`, але побічні ефекти або хуки `register(api)`
не виконуються в живому чат-трафіку, спершу перевірте це:

- Запустіть `openclaw gateway status --deep --require-rpc` і підтвердьте, що активні
  URL Gateway, профіль, шлях конфігурації та процес є саме тими, які ви редагуєте.
- Перезапустіть живий Gateway після змін установлення/конфігурації/коду Plugin. У контейнерах-обгортках
  PID 1 може бути лише супервізором; перезапустіть або просигналізуйте дочірній
  процес `openclaw gateway run`.
- Використовуйте `openclaw plugins inspect <id> --runtime --json`, щоб підтвердити реєстрації хуків і
  діагностику. Невбудовані хуки розмови, як-от `llm_input`,
  `llm_output`, `before_agent_finalize` і `agent_end`, потребують
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання моделей надавайте перевагу `before_model_resolve`. Він виконується до розв’язання
  моделі для ходів агента; `llm_output` виконується лише після того, як спроба моделі
  створить вивід асистента.
- Для підтвердження ефективної моделі сеансу використовуйте `openclaw sessions` або
  поверхні сеансу/статусу Gateway, а під час налагодження навантажень провайдера запускайте
  Gateway із `--raw-stream --raw-stream-path <path>`.

### Повільне налаштування інструментів Plugin

Якщо ходи агента, здається, зависають під час підготовки інструментів, увімкніть трасувальне журналювання та
перевірте рядки часу виконання фабрик інструментів Plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Шукайте:

```text
[trace:plugin-tools] factory timings ...
```

Підсумок перелічує загальний час фабрик і найповільніші фабрики інструментів Plugin,
включно з id Plugin, оголошеними назвами інструментів, формою результату та тим, чи є інструмент
необов’язковим. Повільні рядки підвищуються до попереджень, коли одна фабрика триває
щонайменше 1 с або загальна підготовка фабрик інструментів Plugin триває щонайменше 5 с.

OpenClaw кешує успішні результати фабрик інструментів Plugin для повторних розв’язань
з тим самим ефективним контекстом запиту. Ключ кешу містить ефективну
runtime-конфігурацію, робочу область, id агента/сеансу, політику sandbox, налаштування браузера,
контекст доставки, ідентичність запитувача та стан володіння, тому фабрики, що
залежать від цих довірених полів, повторно запускаються, коли контекст змінюється.

Якщо один Plugin домінує в часі, перевірте його runtime-реєстрації:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Потім оновіть, перевстановіть або вимкніть цей Plugin. Автори Plugin мають переносити
дороге завантаження залежностей за шлях виконання інструмента, а не робити це
всередині фабрики інструмента.

### Дублювання володіння каналом або інструментом

Симптоми:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Це означає, що більше ніж один увімкнений Plugin намагається володіти тим самим каналом,
потоком налаштування або назвою інструмента. Найпоширеніша причина — зовнішній Plugin каналу,
встановлений поруч із вбудованим Plugin, який тепер надає той самий id каналу.

Кроки налагодження:

- Запустіть `openclaw plugins list --enabled --verbose`, щоб побачити кожен увімкнений Plugin
  і його походження.
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
  повідомляє про конфлікт. Виберіть одного власника для каналу або перейменуйте інструменти,
  що належать Plugin, щоб runtime-поверхня була однозначною.

## Слоти Plugin (ексклюзивні категорії)

Деякі категорії є ексклюзивними (активна лише одна за раз):

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

| Слот            | Що він контролює      | Типове значення     |
| --------------- | --------------------- | ------------------- |
| `memory`        | Active Memory Plugin  | `memory-core`       |
| `contextEngine` | Активний рушій контексту | `legacy` (вбудований) |

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

openclaw plugins install <package>         # install (readiness-gated ClawHub, then npm)
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

Вбудовані Plugin постачаються з OpenClaw. Багато з них увімкнені за замовчуванням (наприклад
вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований браузерний
Plugin). Інші вбудовані Plugin усе ще потребують `openclaw plugins enable <id>`.

`--force` перезаписує на місці вже встановлений Plugin або набір хуків. Використовуйте
`openclaw plugins update <id-or-npm-spec>` для звичайних оновлень відстежуваних npm
Plugin. Це не підтримується з `--link`, який повторно використовує шлях джерел замість
копіювання поверх керованої цілі встановлення.

Коли `plugins.allow` уже задано, `openclaw plugins install` додає
id встановленого Plugin до цього списку allow перед його ввімкненням. Якщо той самий id Plugin
наявний у `plugins.deny`, install видаляє цей застарілий запис deny, щоб
явне встановлення можна було завантажити одразу після перезапуску.

OpenClaw зберігає постійний локальний реєстр Plugin як холодну модель читання для
інвентарю plugin, власності внесків і планування запуску. Потоки встановлення, оновлення,
видалення, увімкнення та вимкнення оновлюють цей реєстр після зміни стану plugin.
Той самий файл `plugins/installs.json` зберігає довговічні метадані встановлення в
верхньорівневому `installRecords` і відновлювані метадані маніфестів у `plugins`. Якщо
реєстр відсутній, застарілий або недійсний, `openclaw plugins registry
--refresh` перебудовує його представлення маніфестів із записів встановлення, політики
конфігурації та метаданих маніфесту/пакета без завантаження runtime-модулів plugin.
`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних встановлень. Передавання
специфікації npm-пакета з dist-tag або точною версією зіставляє назву пакета
назад із відстежуваним записом plugin і записує нову специфікацію для майбутніх оновлень.
Передавання назви пакета без версії повертає точно закріплене встановлення назад до
типової лінії випусків реєстру. Якщо встановлений npm plugin уже відповідає
визначеній версії та записаній ідентичності артефакту, OpenClaw пропускає оновлення
без завантаження, повторного встановлення або переписування конфігурації.

`--pin` працює лише з npm. Він не підтримується з `--marketplace`, тому що
marketplace-встановлення зберігають метадані джерела marketplace замість npm-специфікації.

`--dangerously-force-unsafe-install` — аварійне перевизначення для хибних
спрацювань вбудованого сканера небезпечного коду. Воно дозволяє встановлення plugin
та оновлення plugin продовжувати попри вбудовані знахідки `critical`, але все одно
не обходить блокування політики plugin `before_install` або блокування через збій сканування.
Сканування встановлення ігнорують поширені тестові файли й каталоги, як-от `tests/`,
`__tests__/`, `*.test.*` і `*.spec.*`, щоб не блокувати запаковані тестові моки;
оголошені runtime-точки входу plugin все одно скануються, навіть якщо вони використовують одну з
цих назв.

Цей прапорець CLI застосовується лише до потоків встановлення/оновлення plugin. Встановлення
залежностей skill через Gateway використовують відповідне перевизначення запиту
`dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` лишається окремим
потоком завантаження/встановлення skill із ClawHub.

Якщо plugin, який ви опублікували на ClawHub, приховано або заблоковано скануванням, відкрийте
панель ClawHub або запустіть `clawhub package rescan <name>`, щоб попросити ClawHub перевірити
його ще раз. `--dangerously-force-unsafe-install` впливає лише на встановлення на вашій власній
машині; він не просить ClawHub повторно просканувати plugin або зробити заблокований випуск
публічним.

Сумісні bundles беруть участь у тому самому потоці списку/інспекції/увімкнення/вимкнення
plugin. Поточна runtime-підтримка включає bundle skills, command-skills Claude,
типові значення Claude `settings.json`, типові значення Claude `.lsp.json` і оголошені в маніфесті
`lspServers`, command-skills Cursor і сумісні каталоги hook Codex.

`openclaw plugins inspect <id>` також повідомляє виявлені можливості bundle, а також
підтримувані або непідтримувані записи MCP- і LSP-серверів для plugin на основі bundle.

Джерелами marketplace можуть бути відома назва marketplace Claude з
`~/.claude/plugins/known_marketplaces.json`, локальний корінь marketplace або
шлях `marketplace.json`, скорочення GitHub на кшталт `owner/repo`, URL репозиторію GitHub
або git URL. Для віддалених marketplaces записи plugin мають залишатися всередині
клонованого репозиторію marketplace і використовувати лише відносні джерела шляхів.

Див. [довідник CLI `openclaw plugins`](/uk/cli/plugins) для повних подробиць.

## Огляд API Plugin

Нативні plugins експортують об’єкт входу, який надає `register(api)`. Старіші
plugins усе ще можуть використовувати `activate(api)` як legacy-псевдонім, але нові plugins мають
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

OpenClaw завантажує об’єкт входу й викликає `register(api)` під час активації plugin.
Loader усе ще повертається до `activate(api)` для старіших plugins,
але bundled plugins і нові зовнішні plugins мають розглядати `register` як
публічний контракт.

`api.registrationMode` повідомляє plugin, навіщо завантажується його entry:

| Режим           | Значення                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Runtime-активація. Реєструйте tools, hooks, services, commands, routes та інші живі побічні ефекти.                              |
| `discovery`     | Read-only виявлення можливостей. Реєструйте providers і metadata; довірений код entry plugin може завантажуватися, але пропускайте живі побічні ефекти. |
| `setup-only`    | Завантаження метаданих налаштування каналу через легковаговий setup entry.                                                       |
| `setup-runtime` | Завантаження налаштування каналу, якому також потрібен runtime entry.                                                            |
| `cli-metadata`  | Лише збирання метаданих команд CLI.                                                                                              |

Entry plugin, які відкривають sockets, databases, background workers або довгоживучі
clients, мають захищати ці побічні ефекти перевіркою `api.registrationMode === "full"`.
Завантаження discovery кешуються окремо від activating loads і не замінюють
поточний registry Gateway. Discovery не активує, але й не є import-free:
OpenClaw може виконати довірений entry plugin або module channel plugin, щоб побудувати
snapshot. Тримайте верхні рівні модулів легковаговими й без побічних ефектів, а
network clients, subprocesses, listeners, credential reads і service startup
переносьте за full-runtime paths.

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
| `registerMediaUnderstandingProvider`    | Аналіз зображень/аудіо       |
| `registerImageGenerationProvider`       | Генерація зображень          |
| `registerMusicGenerationProvider`       | Генерація музики             |
| `registerVideoGenerationProvider`       | Генерація відео              |
| `registerWebFetchProvider`              | Web fetch / scrape provider  |
| `registerWebSearchProvider`             | Web search                   |
| `registerHttpRoute`                     | HTTP endpoint                |
| `registerCommand` / `registerCli`       | Команди CLI                  |
| `registerContextEngine`                 | Context engine               |
| `registerService`                       | Background service           |

Поведінка guard для типізованих lifecycle hooks:

- `before_tool_call`: `{ block: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: `{ block: false }` є no-op і не знімає попереднє блокування.
- `before_install`: `{ block: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `before_install`: `{ block: false }` є no-op і не знімає попереднє блокування.
- `message_sending`: `{ cancel: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `message_sending`: `{ cancel: false }` є no-op і не скасовує попередній cancel.

Native Codex app-server прокидає bridge-події Codex-native tools назад у цю
hook-поверхню. Plugins можуть блокувати Native Codex tools через `before_tool_call`,
спостерігати результати через `after_tool_call` і брати участь у схваленнях Codex
`PermissionRequest`. Bridge ще не переписує аргументи Codex-native tools.
Точна межа підтримки runtime Codex описана в
[контракті підтримки Codex harness v1](/uk/plugins/codex-harness#v1-support-contract).

Повну поведінку типізованих hook див. в [огляді SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Створення plugins](/uk/plugins/building-plugins) — створіть власний plugin
- [Bundles Plugin](/uk/plugins/bundles) — сумісність bundles Codex/Claude/Cursor
- [Маніфест Plugin](/uk/plugins/manifest) — схема маніфесту
- [Реєстрація tools](/uk/plugins/building-plugins#registering-agent-tools) — додайте agent tools у plugin
- [Внутрішня архітектура Plugin](/uk/plugins/architecture) — модель можливостей і pipeline завантаження
- [Спільнотні plugins](/uk/plugins/community) — списки сторонніх розробників
