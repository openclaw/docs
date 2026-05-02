---
read_when:
    - Встановлення або налаштування Plugin
    - Розуміння виявлення Plugin і правил завантаження
    - Робота з пакетами Plugin, сумісними з Codex/Claude
sidebarTitle: Install and Configure
summary: Встановлюйте, налаштовуйте та керуйте Plugin OpenClaw
title: Плагіни
x-i18n:
    generated_at: "2026-05-02T19:11:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: eb4c15f9d38dcd1d3f868a20dc2b703064fc874e8e92505dc039f44df2a42ef9
    source_path: tools/plugin.md
    workflow: 16
---

Плагіни розширюють OpenClaw новими можливостями: каналами, постачальниками моделей,
середовищами агентів, інструментами, Skills, мовленням, транскрипцією в реальному часі, голосом у реальному
часі, розумінням медіа, генерацією зображень, генерацією відео, вебвибіркою, веб
пошуком тощо. Деякі плагіни є **основними** (постачаються з OpenClaw), інші
є **зовнішніми**. Більшість зовнішніх плагінів публікуються й виявляються через
[ClawHub](/uk/tools/clawhub). Npm і далі підтримується для прямих установлень і для
тимчасового набору пакетів плагінів, що належать OpenClaw, доки ця міграція завершується.

## Швидкий старт

Приклади встановлення, перегляду списку, видалення, оновлення та публікації для копіювання й вставляння див.
[Керування плагінами](/uk/plugins/manage-plugins).

<Steps>
  <Step title="Перегляньте, що завантажено">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Установіть плагін">
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

    Потім налаштуйте в `plugins.entries.\<id\>.config` у вашому конфігураційному файлі.

  </Step>

  <Step title="Керування з чату">
    У запущеному Gateway команди лише для власника `/plugins enable` і `/plugins disable`
    запускають перезавантажувач конфігурації Gateway. Gateway перезавантажує runtime-
    поверхні плагінів у процесі, а нові ходи агента перебудовують свій список інструментів з
    оновленого реєстру. `/plugins install` змінює вихідний код плагіна, тому
    Gateway запитує перезапуск замість того, щоб удавати, ніби поточний процес може
    безпечно перезавантажити вже імпортовані модулі.

  </Step>

  <Step title="Перевірте плагін">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Використовуйте `--runtime`, коли потрібно довести наявність зареєстрованих інструментів, служб, методів Gateway,
    хуків або CLI-команд, що належать плагіну. Звичайний `inspect` є холодною
    перевіркою маніфесту/реєстру й навмисно уникає імпортування runtime плагіна.

  </Step>
</Steps>

Якщо ви віддаєте перевагу керуванню з чату, увімкніть `commands.plugins: true` і використовуйте:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Шлях установлення використовує той самий резолвер, що й CLI: локальний шлях/архів, явний
`clawhub:<pkg>`, явний `npm:<pkg>`, явний `git:<repo>` або проста специфікація пакета
через npm.

Якщо конфігурація недійсна, установлення зазвичай завершується закритою відмовою та спрямовує вас до
`openclaw doctor --fix`. Єдиний виняток для відновлення — вузький шлях перевстановлення
вбудованого плагіна для плагінів, які явно вмикають
`openclaw.install.allowInvalidConfigRecovery`.
Під час запуску Gateway недійсна конфігурація одного плагіна ізолюється до цього плагіна:
запуск записує в журнал проблему `plugins.entries.<id>.config`, пропускає цей плагін під час
завантаження та залишає інші плагіни й канали онлайн. Запустіть `openclaw doctor --fix`,
щоб помістити погану конфігурацію плагіна в карантин, вимкнувши цей запис плагіна та видаливши
його недійсне конфігураційне навантаження; звичайна резервна копія конфігурації зберігає попередні значення.
Коли конфігурація каналу посилається на плагін, який більше не виявляється, але той самий
застарілий ідентифікатор плагіна лишається в конфігурації плагінів або записах установлення, запуск Gateway
записує попередження й пропускає цей канал замість того, щоб блокувати всі інші канали.
Запустіть `openclaw doctor --fix`, щоб видалити застарілі записи каналу/плагіна; невідомі
ключі каналів без ознак застарілого плагіна й далі не проходять валідацію, щоб помилки набору
лишалися видимими.
Якщо задано `plugins.enabled: false`, застарілі посилання на плагіни вважаються інертними:
запуск Gateway пропускає роботу з виявлення/завантаження плагінів, а `openclaw doctor` зберігає
вимкнену конфігурацію плагінів замість автоматичного видалення. Увімкніть плагіни знову перед
запуском очищення doctor, якщо хочете видалити застарілі ідентифікатори плагінів.

Установлення залежностей плагіна відбувається лише під час явних потоків установлення/оновлення або
ремонту через doctor. Запуск Gateway, перезавантаження конфігурації та перевірка runtime не
запускають менеджери пакетів і не ремонтують дерева залежностей. Локальні плагіни повинні вже
мати встановлені залежності, тоді як плагіни npm, git і ClawHub
установлюються в керовані корені плагінів OpenClaw. Залежності npm можуть бути hoisted
у межах керованого npm-кореня OpenClaw; установлення/оновлення сканує цей керований корінь перед
довірою, а видалення прибирає керовані npm пакети через npm. Зовнішні плагіни
та користувацькі шляхи завантаження все одно потрібно встановлювати через `openclaw plugins install`.
Використовуйте `openclaw plugins list --json`, щоб побачити статичний `dependencyStatus` для кожного
видимого плагіна без імпортування runtime-коду або ремонту залежностей.
Див. [Розв’язання залежностей плагінів](/uk/plugins/dependency-resolution) щодо життєвого циклу
під час установлення.

Вихідні checkout-и є pnpm workspaces. Якщо ви клонуєте OpenClaw, щоб працювати над вбудованими
плагінами, запустіть `pnpm install`; після цього OpenClaw завантажує вбудовані плагіни з
`extensions/<id>`, тож зміни й локальні для пакета залежності використовуються напряму.
Звичайні кореневі встановлення npm призначені для пакетованого OpenClaw, а не для розробки
з checkout вихідного коду.

## Типи плагінів

OpenClaw розпізнає два формати плагінів:

| Формат     | Як це працює                                                       | Приклади                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Нативний** | `openclaw.plugin.json` + runtime-модуль; виконується в процесі       | Офіційні плагіни, спільнотні npm-пакети               |
| **Bundle** | Макет, сумісний із Codex/Claude/Cursor; зіставляється з можливостями OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва з’являються в `openclaw plugins list`. Див. [Plugin Bundles](/uk/plugins/bundles) для деталей bundle.

Якщо ви пишете нативний плагін, почніть з [Створення плагінів](/uk/plugins/building-plugins)
і [Огляд Plugin SDK](/uk/plugins/sdk-overview).

## Точки входу пакета

Нативні npm-пакети плагінів повинні оголошувати `openclaw.extensions` у `package.json`.
Кожен запис має залишатися всередині каталогу пакета й розв’язуватися до читабельного
runtime-файлу або до TypeScript-файлу вихідного коду з виведеним зібраним JavaScript
аналогом, наприклад `src/index.ts` до `dist/index.js`.

Використовуйте `openclaw.runtimeExtensions`, коли опубліковані runtime-файли не розташовані за
тими самими шляхами, що й вихідні записи. Коли `runtimeExtensions` присутній, він має містити
рівно один запис для кожного запису `extensions`. Невідповідні списки спричиняють відмову встановлення та
виявлення плагіна замість мовчазного fallback до шляхів вихідного коду. Якщо ви також
публікуєте `openclaw.setupEntry`, використовуйте `openclaw.runtimeSetupEntry` для його зібраного
JavaScript-аналога; цей файл є обов’язковим, коли його оголошено.

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

### Npm-пакети, що належать OpenClaw, під час міграції

ClawHub є основним шляхом розповсюдження для більшості плагінів. Поточні пакетовані
релізи OpenClaw уже містять багато офіційних плагінів, тому вони не потребують
окремих npm-установлень у звичайних конфігураціях. Доки кожен плагін, що належить OpenClaw,
не мігрує до ClawHub, OpenClaw і далі постачає деякі пакети плагінів `@openclaw/*`
на npm для старіших/користувацьких установлень і прямих npm-процесів.

Якщо npm повідомляє, що пакет плагіна `@openclaw/*` застарілий, ця версія пакета
походить зі старішої лінійки зовнішніх пакетів. Використовуйте вбудований плагін з
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
  <Accordion title="Постачальники моделей (увімкнені за замовчуванням)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Плагіни пам’яті">
    - `memory-core` — вбудований пошук пам’яті (типово через `plugins.slots.memory`)
    - `memory-lancedb` — довготривала пам’ять на базі LanceDB з автоматичним recall/capture (задайте `plugins.slots.memory = "memory-lancedb"`)

    Див. [Memory LanceDB](/uk/plugins/memory-lancedb) щодо налаштування embedding,
    сумісного з OpenAI, прикладів Ollama, лімітів recall і усунення несправностей.

  </Accordion>

  <Accordion title="Постачальники мовлення (увімкнені за замовчуванням)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` — вбудований browser-плагін для browser tool, CLI `openclaw browser`, методу Gateway `browser.request`, browser runtime і типової служби керування browser (увімкнено за замовчуванням; вимкніть перед заміною)
    - `copilot-proxy` — міст VS Code Copilot Proxy (вимкнено за замовчуванням)

  </Accordion>
</AccordionGroup>

Шукаєте сторонні плагіни? Див. [Плагіни спільноти](/uk/plugins/community).

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
| `allow`          | Allowlist плагінів (необов’язково)                               |
| `deny`           | Denylist плагінів (необов’язково; deny має перевагу)                     |
| `load.paths`     | Додаткові файли/каталоги плагінів                            |
| `slots`          | Ексклюзивні селектори слотів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>` | Перемикачі + конфігурація для окремого плагіна                               |

`plugins.allow` є ексклюзивним. Коли він непорожній, завантажуватися
або надавати інструменти можуть лише перелічені плагіни, навіть якщо `tools.allow` містить `"*"` або конкретну
назву інструмента, що належить плагіну. Якщо allowlist інструментів посилається на інструменти плагіна, додайте ідентифікатори плагінів-власників
до `plugins.allow` або видаліть `plugins.allow`; `openclaw doctor` попереджає про таку
форму.

Зміни конфігурації, зроблені через `/plugins enable` або `/plugins disable`, запускають
перезавантаження Plugin у Gateway в межах поточного процесу. Нові ходи агента перебудовують список інструментів із
оновленого реєстру Plugin. Операції, що змінюють джерело, як-от install,
update і uninstall, усе ще перезапускають процес Gateway, оскільки вже імпортовані
модулі Plugin не можна безпечно замінити на місці.

`openclaw plugins list` — це локальний знімок реєстру Plugin/конфігурації. Plugin зі станом
`enabled` там означає, що збережений реєстр і поточна конфігурація дозволяють
Plugin брати участь. Це не доводить, що вже запущений віддалений Gateway
перезавантажився або перезапустився з тим самим кодом Plugin. У налаштуваннях VPS/контейнерів
із процесами-обгортками надсилайте перезапуски або записи, що запускають перезавантаження, до фактичного
процесу `openclaw gateway run`, або використовуйте `openclaw gateway restart` для
запущеного Gateway, коли перезавантаження повідомляє про помилку.

<Accordion title="Стани Plugin: disabled vs missing vs invalid">
  - **Disabled**: Plugin існує, але правила ввімкнення вимкнули його. Конфігурація зберігається.
  - **Missing**: конфігурація посилається на ідентифікатор Plugin, який виявлення не знайшло.
  - **Invalid**: Plugin існує, але його конфігурація не відповідає оголошеній схемі. Запуск Gateway пропускає лише цей Plugin; `openclaw doctor --fix` може помістити недійсний запис у карантин, вимкнувши його й видаливши його конфігураційне навантаження.

</Accordion>

## Виявлення та пріоритет

OpenClaw сканує Plugin у такому порядку (перше зіставлення перемагає):

<Steps>
  <Step title="Шляхи конфігурації">
    `plugins.load.paths` — явні шляхи до файлів або каталогів. Шляхи, що вказують
    назад на власні пакетовані каталоги вбудованих Plugin OpenClaw, ігноруються;
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

Пакетовані інсталяції та Docker-образи зазвичай розв’язують вбудовані Plugin з
скомпільованого дерева `dist/extensions`. Якщо вихідний каталог вбудованого Plugin
змонтовано поверх відповідного пакетованого вихідного шляху, наприклад
`/app/extensions/synology-chat`, OpenClaw розглядає цей змонтований вихідний каталог
як вихідне перекриття вбудованого Plugin і виявляє його перед пакетованим
бандлом `/app/dist/extensions/synology-chat`. Це зберігає працездатність контейнерних
циклів мейнтейнерів без перемикання кожного вбудованого Plugin назад на TypeScript-джерело.
Установіть `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, щоб примусово використовувати пакетовані dist-бандли
навіть за наявності змонтованих вихідних перекриттів.

### Правила ввімкнення

- `plugins.enabled: false` вимикає всі Plugin і пропускає роботу з виявлення/завантаження Plugin
- `plugins.deny` завжди має пріоритет над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей Plugin
- Plugin з робочої області **вимкнені за замовчуванням** (їх потрібно явно ввімкнути)
- Вбудовані Plugin дотримуються вбудованого набору ввімкнених за замовчуванням, якщо це не перевизначено
- Ексклюзивні слоти можуть примусово ввімкнути вибраний Plugin для цього слота
- Деякі вбудовані opt-in Plugin вмикаються автоматично, коли конфігурація називає
  поверхню, що належить Plugin, як-от посилання на модель провайдера, конфігурацію каналу або
  середовище виконання harness
- Застаріла конфігурація Plugin зберігається, поки активний `plugins.enabled: false`;
  повторно ввімкніть Plugin перед запуском очищення doctor, якщо хочете видалити застарілі ідентифікатори
- Маршрути Codex сімейства OpenAI зберігають окремі межі Plugin:
  `openai-codex/*` належить OpenAI Plugin, тоді як вбудований Plugin app-server Codex
  вибирається через `agentRuntime.id: "codex"` або застарілі
  посилання на моделі `codex/*`

## Усунення несправностей runtime-хуків

Якщо Plugin з’являється в `plugins list`, але побічні ефекти `register(api)` або хуки
не виконуються в живому чат-трафіку, спершу перевірте таке:

- Запустіть `openclaw gateway status --deep --require-rpc` і підтвердьте, що активні
  URL Gateway, профіль, шлях конфігурації та процес є саме тими, які ви редагуєте.
- Перезапустіть живий Gateway після змін інсталяції/конфігурації/коду Plugin. У контейнерах-обгортках
  PID 1 може бути лише супервізором; перезапустіть або надішліть сигнал дочірньому
  процесу `openclaw gateway run`.
- Використовуйте `openclaw plugins inspect <id> --runtime --json`, щоб підтвердити реєстрації хуків і
  діагностику. Невбудовані хуки розмови, як-от `llm_input`,
  `llm_output`, `before_agent_finalize` і `agent_end`, потребують
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання моделей віддавайте перевагу `before_model_resolve`. Він виконується до розв’язання моделі
  для ходів агента; `llm_output` виконується лише після того, як спроба моделі
  створить вивід асистента.
- Для підтвердження ефективної моделі сесії використовуйте `openclaw sessions` або
  поверхні сесії/статусу Gateway, а під час налагодження навантажень провайдера запускайте
  Gateway з `--raw-stream --raw-stream-path <path>`.

### Повільне налаштування інструментів Plugin

Якщо здається, що ходи агента зависають під час підготовки інструментів, увімкніть трасувальне журналювання та
перевірте рядки часу фабрик інструментів Plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Шукайте:

```text
[trace:plugin-tools] factory timings ...
```

Підсумок містить загальний час фабрик і найповільніші фабрики інструментів Plugin,
зокрема ідентифікатор Plugin, оголошені назви інструментів, форму результату та чи є інструмент
необов’язковим. Повільні рядки підвищуються до попереджень, коли одна фабрика займає
щонайменше 1 с або загальна підготовка фабрик інструментів Plugin займає щонайменше 5 с.

OpenClaw кешує успішні результати фабрик інструментів Plugin для повторних розв’язань
з тим самим ефективним контекстом запиту. Ключ кешу містить ефективну
runtime-конфігурацію, робочу область, ідентифікатори агента/сесії, політику sandbox, налаштування браузера,
контекст доставки, ідентичність запитувача та стан володіння, тому фабрики, які
залежать від цих довірених полів, запускаються повторно, коли контекст змінюється.

Якщо один Plugin домінує в часі, перевірте його runtime-реєстрації:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Потім оновіть, перевстановіть або вимкніть цей Plugin. Автори Plugin мають перенести
дороге завантаження залежностей за шлях виконання інструмента, а не виконувати його
всередині фабрики інструмента.

### Дублювання володіння каналом або інструментом

Симптоми:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Це означає, що кілька ввімкнених Plugin намагаються володіти тим самим каналом,
потоком налаштування або назвою інструмента. Найпоширеніша причина — зовнішній Plugin каналу,
інстальований поруч із вбудованим Plugin, який тепер надає той самий ідентифікатор каналу.

Кроки налагодження:

- Запустіть `openclaw plugins list --enabled --verbose`, щоб побачити кожен увімкнений Plugin
  і походження.
- Запустіть `openclaw plugins inspect <id> --runtime --json` для кожного підозрюваного Plugin і
  порівняйте `channels`, `channelConfigs`, `tools` і діагностику.
- Запустіть `openclaw plugins registry --refresh` після інсталяції або видалення
  пакетів Plugin, щоб збережені метадані відображали поточну інсталяцію.
- Перезапустіть Gateway після змін інсталяції, реєстру або конфігурації.

Варіанти виправлення:

- Якщо один Plugin навмисно замінює інший для того самого ідентифікатора каналу, бажаний
  Plugin має оголосити `channelConfigs.<channel-id>.preferOver` з
  ідентифікатором Plugin нижчого пріоритету. Див. [/plugins/manifest#replacing-another-channel-plugin](/uk/plugins/manifest#replacing-another-channel-plugin).
- Якщо дублювання випадкове, вимкніть одну сторону через
  `plugins.entries.<plugin-id>.enabled: false` або видаліть застарілу інсталяцію Plugin.
- Якщо ви явно ввімкнули обидва Plugin, OpenClaw зберігає цей запит і
  повідомляє про конфлікт. Виберіть одного власника каналу або перейменуйте інструменти, що належать Plugin,
  щоб runtime-поверхня була однозначною.

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

| Слот            | Що він контролює      | Типове значення     |
| --------------- | --------------------- | ------------------- |
| `memory`        | Plugin active memory  | `memory-core`       |
| `contextEngine` | Активний контекстний рушій | `legacy` (вбудований) |

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

Вбудовані Plugin постачаються з OpenClaw. Багато з них увімкнені за замовчуванням (наприклад
вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований браузерний
Plugin). Інші вбудовані Plugin усе ще потребують `openclaw plugins enable <id>`.

`--force` перезаписує на місці вже інстальований Plugin або пакет хуків. Використовуйте
`openclaw plugins update <id-or-npm-spec>` для звичайних оновлень відстежуваних npm
Plugin. Він не підтримується з `--link`, який повторно використовує вихідний шлях замість
копіювання до керованої цілі інсталяції.

Коли `plugins.allow` уже задано, `openclaw plugins install` додає
ідентифікатор інстальованого Plugin до цього allowlist перед його ввімкненням. Якщо той самий ідентифікатор Plugin
присутній у `plugins.deny`, install видаляє цей застарілий deny-запис, щоб
явна інсталяція була одразу доступна для завантаження після перезапуску.

OpenClaw зберігає персистентний локальний реєстр плагінів як холодну модель читання для
інвентарю плагінів, володіння внесками та планування запуску. Потоки встановлення, оновлення,
видалення, увімкнення та вимкнення оновлюють цей реєстр після зміни стану плагіна.
Той самий файл `plugins/installs.json` зберігає довговічні метадані встановлення у
верхньорівневому `installRecords` і відновлювані метадані маніфестів у `plugins`. Якщо
реєстр відсутній, застарілий або недійсний, `openclaw plugins registry
--refresh` перебудовує його подання маніфестів із записів встановлення, політики конфігурації та
метаданих маніфеста/пакета без завантаження runtime-модулів плагіна.
`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних встановлень. Передавання
специфікації npm-пакета з dist-tag або точною версією зіставляє назву пакета
назад із відстежуваним записом плагіна та записує нову специфікацію для майбутніх оновлень.
Передавання назви пакета без версії повертає встановлення, закріплене на точній версії, назад до
стандартної лінії випусків реєстру. Якщо встановлений npm-плагін уже відповідає
визначеній версії та записаній ідентичності артефакта, OpenClaw пропускає оновлення
без завантаження, перевстановлення або перезапису конфігурації.

`--pin` працює лише з npm. Він не підтримується з `--marketplace`, тому що
marketplace-встановлення зберігають метадані джерела marketplace замість npm-специфікації.

`--dangerously-force-unsafe-install` — це аварійне перевизначення для хибних
спрацювань вбудованого сканера небезпечного коду. Воно дозволяє встановлення
та оновлення плагінів продовжуватися після вбудованих знахідок `critical`, але все одно
не обходить блокування політики плагіна `before_install` або блокування через помилки сканування.
Сканування встановлень ігнорують поширені тестові файли та каталоги, як-от `tests/`,
`__tests__/`, `*.test.*` і `*.spec.*`, щоб не блокувати запаковані тестові моки;
оголошені runtime-точки входу плагіна все одно скануються, навіть якщо використовують одну з
цих назв.

Цей прапорець CLI застосовується лише до потоків встановлення/оновлення плагінів. Встановлення
залежностей Skills через Gateway використовують натомість відповідне перевизначення запиту
`dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим
потоком завантаження/встановлення Skills із ClawHub.

Якщо плагін, який ви опублікували на ClawHub, приховано або заблоковано скануванням, відкрийте
панель керування ClawHub або виконайте `clawhub package rescan <name>`, щоб попросити ClawHub
перевірити його знову. `--dangerously-force-unsafe-install` впливає лише на встановлення на вашій
власній машині; він не просить ClawHub повторно просканувати плагін і не робить заблокований випуск
публічним.

Сумісні бандли беруть участь у тому самому потоці списку/перегляду/увімкнення/вимкнення
плагінів. Поточна runtime-підтримка охоплює Skills у бандлах, command-skills Claude,
стандартні значення Claude `settings.json`, стандартні значення Claude `.lsp.json` і оголошені
в маніфесті `lspServers`, command-skills Cursor і сумісні каталоги хуків Codex.

`openclaw plugins inspect <id>` також повідомляє виявлені можливості бандла, а також
підтримувані або непідтримувані записи серверів MCP і LSP для плагінів на основі бандлів.

Джерелами marketplace можуть бути відома Claude назва marketplace з
`~/.claude/plugins/known_marketplaces.json`, локальний корінь marketplace або шлях
`marketplace.json`, скорочення GitHub на кшталт `owner/repo`, URL репозиторію GitHub
або git URL. Для віддалених marketplace записи плагінів мають залишатися всередині
клонованого репозиторію marketplace і використовувати лише джерела з відносними шляхами.

Див. [довідку CLI `openclaw plugins`](/uk/cli/plugins), щоб отримати повні подробиці.

## Огляд API Plugin

Нативні плагіни експортують об’єкт входу, який надає `register(api)`. Старіші
плагіни все ще можуть використовувати `activate(api)` як застарілий псевдонім, але нові плагіни мають
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
активації плагіна. Завантажувач усе ще відкочується до `activate(api)` для старіших плагінів,
але вбудовані плагіни та нові зовнішні плагіни мають розглядати `register` як
публічний контракт.

`api.registrationMode` повідомляє плагіну, чому його точку входу завантажують:

| Режим           | Значення                                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Runtime-активація. Реєструйте інструменти, хуки, сервіси, команди, маршрути та інші активні побічні ефекти.                    |
| `discovery`     | Виявлення можливостей лише для читання. Реєструйте провайдерів і метадані; довірений код входу плагіна може завантажуватися, але пропускайте активні побічні ефекти. |
| `setup-only`    | Завантаження метаданих налаштування каналу через легку точку входу налаштування.                                                |
| `setup-runtime` | Завантаження налаштування каналу, якому також потрібна runtime-точка входу.                                                     |
| `cli-metadata`  | Лише збирання метаданих команд CLI.                                                                                             |

Точки входу плагінів, які відкривають сокети, бази даних, фонові worker-процеси або довгоживучі
клієнти, мають захищати ці побічні ефекти умовою `api.registrationMode === "full"`.
Завантаження виявлення кешуються окремо від активаційних завантажень і не замінюють
запущений реєстр Gateway. Виявлення не активує плагін, але не є вільним від імпортів:
OpenClaw може виконати довірену точку входу плагіна або модуль плагіна каналу, щоб побудувати
знімок. Тримайте верхні рівні модулів легкими та без побічних ефектів, а
мережеві клієнти, підпроцеси, слухачі, читання облікових даних і запуск сервісів
переносьте за шляхи повного runtime.

Поширені методи реєстрації:

| Метод                                   | Що він реєструє                         |
| --------------------------------------- | --------------------------------------- |
| `registerProvider`                      | Провайдер моделі (LLM)                  |
| `registerChannel`                       | Чат-канал                               |
| `registerTool`                          | Інструмент агента                       |
| `registerHook` / `on(...)`              | Хуки життєвого циклу                    |
| `registerSpeechProvider`                | Перетворення тексту на мовлення / STT   |
| `registerRealtimeTranscriptionProvider` | Потокове STT                            |
| `registerRealtimeVoiceProvider`         | Дуплексний голос у реальному часі       |
| `registerMediaUnderstandingProvider`    | Аналіз зображень/аудіо                  |
| `registerImageGenerationProvider`       | Генерація зображень                     |
| `registerMusicGenerationProvider`       | Генерація музики                        |
| `registerVideoGenerationProvider`       | Генерація відео                         |
| `registerWebFetchProvider`              | Провайдер отримання веб-вмісту / скрейпінгу |
| `registerWebSearchProvider`             | Вебпошук                                |
| `registerHttpRoute`                     | HTTP endpoint                           |
| `registerCommand` / `registerCli`       | Команди CLI                             |
| `registerContextEngine`                 | Рушій контексту                         |
| `registerService`                       | Фоновий сервіс                          |

Поведінка захисту хуків для типізованих хуків життєвого циклу:

- `before_tool_call`: `{ block: true }` є кінцевим; обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: `{ block: false }` нічого не робить і не скасовує попереднє блокування.
- `before_install`: `{ block: true }` є кінцевим; обробники з нижчим пріоритетом пропускаються.
- `before_install`: `{ block: false }` нічого не робить і не скасовує попереднє блокування.
- `message_sending`: `{ cancel: true }` є кінцевим; обробники з нижчим пріоритетом пропускаються.
- `message_sending`: `{ cancel: false }` нічого не робить і не скасовує попереднє скасування.

Нативний app-server Codex прокладає події нативних інструментів Codex назад у цю
поверхню хуків. Плагіни можуть блокувати нативні інструменти Codex через `before_tool_call`,
спостерігати результати через `after_tool_call` і брати участь у схваленнях Codex
`PermissionRequest`. Міст поки що не переписує аргументи нативних інструментів Codex.
Точна межа runtime-підтримки Codex описана в
[контракті підтримки Codex harness v1](/uk/plugins/codex-harness#v1-support-contract).

Повну поведінку типізованих хуків див. в [огляді SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Створення плагінів](/uk/plugins/building-plugins) — створіть власний плагін
- [Бандли плагінів](/uk/plugins/bundles) — сумісність бандлів Codex/Claude/Cursor
- [Маніфест плагіна](/uk/plugins/manifest) — схема маніфеста
- [Реєстрація інструментів](/uk/plugins/building-plugins#registering-agent-tools) — додайте інструменти агента в плагін
- [Внутрішня архітектура плагінів](/uk/plugins/architecture) — модель можливостей і конвеєр завантаження
- [Спільнотні плагіни](/uk/plugins/community) — списки сторонніх плагінів
