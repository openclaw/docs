---
read_when:
    - Встановлення або налаштування плагінів
    - Розуміння правил виявлення та завантаження Plugin
    - Робота з пакетами Plugin, сумісними з Codex/Claude
sidebarTitle: Install and Configure
summary: Встановлюйте, налаштовуйте та керуйте плагінами OpenClaw
title: Плагіни
x-i18n:
    generated_at: "2026-05-02T18:33:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 595552574751bde36eee4b3617afa1c1f10471d6191ae35b5f4b11518cb4b5d4
    source_path: tools/plugin.md
    workflow: 16
---

Плагіни розширюють OpenClaw новими можливостями: каналами, постачальниками моделей,
обв’язками агентів, інструментами, Skills, мовленням, транскрипцією в реальному часі, голосом у реальному часі, розумінням
медіа, генерацією зображень, генерацією відео, вебзавантаженням, вебпошуком
та іншим. Деякі плагіни є **основними** (постачаються з OpenClaw), інші
є **зовнішніми**. Більшість зовнішніх плагінів публікуються та знаходяться через
[ClawHub](/uk/tools/clawhub). Npm і надалі підтримується для прямих встановлень і для
тимчасового набору пакетів плагінів, що належать OpenClaw, доки ця міграція завершується.

## Швидкий старт

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
    У запущеному Gateway команди лише для власника `/plugins enable` і `/plugins disable`
    запускають перезавантажувач конфігурації Gateway. Gateway перезавантажує runtime-поверхні
    плагінів у процесі, а нові ходи агента перебудовують свій список інструментів з
    оновленого реєстру. `/plugins install` змінює вихідний код плагіна, тому
    Gateway запитує перезапуск, замість удавати, що поточний процес може
    безпечно перезавантажити вже імпортовані модулі.

  </Step>

  <Step title="Verify the plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Використовуйте `--runtime`, коли потрібно довести зареєстровані інструменти, служби, методи Gateway,
    хуки або CLI-команди, що належать плагіну. Звичайний `inspect` є холодною
    перевіркою маніфесту/реєстру й навмисно уникає імпорту runtime плагіна.

  </Step>
</Steps>

Якщо ви віддаєте перевагу керуванню безпосередньо з чату, увімкніть `commands.plugins: true` і використовуйте:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Шлях встановлення використовує той самий резолвер, що й CLI: локальний шлях/архів, явний
`clawhub:<pkg>`, явний `npm:<pkg>`, явний `git:<repo>` або просту специфікацію пакета
(спочатку ClawHub, потім резервний npm).

Якщо конфігурація недійсна, встановлення зазвичай аварійно зупиняється й спрямовує вас до
`openclaw doctor --fix`. Єдиний виняток для відновлення — вузький шлях перевстановлення
вбудованого плагіна для плагінів, які явно вмикають
`openclaw.install.allowInvalidConfigRecovery`.
Під час запуску Gateway недійсна конфігурація одного плагіна ізолюється до цього плагіна:
запуск записує проблему `plugins.entries.<id>.config` у журнали, пропускає цей плагін під час
завантаження та залишає інші плагіни й канали онлайн. Запустіть `openclaw doctor --fix`,
щоб помістити некоректну конфігурацію плагіна в карантин, вимкнувши цей запис плагіна й видаливши
його недійсне корисне навантаження конфігурації; звичайна резервна копія конфігурації зберігає попередні значення.
Коли конфігурація каналу посилається на плагін, який більше не виявляється, але той самий
застарілий id плагіна лишається в конфігурації плагінів або записах встановлення, запуск Gateway
записує попередження та пропускає цей канал замість блокування всіх інших каналів.
Запустіть `openclaw doctor --fix`, щоб видалити застарілі записи каналу/плагіна; невідомі
ключі каналів без доказів застарілого плагіна все ще не проходять валідацію, тож помилки введення залишаються
видимими.
Якщо встановлено `plugins.enabled: false`, застарілі посилання на плагіни вважаються інертними:
запуск Gateway пропускає виявлення/завантаження плагінів, а `openclaw doctor` зберігає
вимкнену конфігурацію плагінів замість її автоматичного видалення. Знову ввімкніть плагіни перед
запуском очищення doctor, якщо хочете видалити застарілі id плагінів.

Встановлення залежностей плагіна відбувається лише під час явних потоків встановлення/оновлення або
ремонту doctor. Запуск Gateway, перезавантаження конфігурації та runtime-інспекція не
запускають менеджери пакетів і не ремонтують дерева залежностей. Локальні плагіни вже мають
мати встановлені залежності, тоді як npm-, git- і ClawHub-плагіни
встановлюються під керованими коренями плагінів OpenClaw. Залежності npm можуть бути підняті
всередині керованого npm-кореня OpenClaw; встановлення/оновлення сканує цей керований корінь перед
довірою, а видалення прибирає npm-керовані пакети через npm. Зовнішні плагіни
та користувацькі шляхи завантаження все ще мають встановлюватися через `openclaw plugins install`.
Див. [Розв’язання залежностей плагінів](/uk/plugins/dependency-resolution) для життєвого циклу під час встановлення.

Вихідні checkout-и є pnpm workspaces. Якщо ви клонуєте OpenClaw, щоб працювати над вбудованими
плагінами, запустіть `pnpm install`; після цього OpenClaw завантажує вбудовані плагіни з
`extensions/<id>`, тож зміни та локальні для пакета залежності використовуються напряму.
Звичайні кореневі встановлення npm призначені для пакетованого OpenClaw, а не для розробки
з checkout вихідного коду.

## Типи плагінів

OpenClaw розпізнає два формати плагінів:

| Формат     | Як це працює                                                       | Приклади                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Нативний** | `openclaw.plugin.json` + runtime-модуль; виконується в процесі       | Офіційні плагіни, спільнотні npm-пакети               |
| **Bundle** | Сумісний із Codex/Claude/Cursor layout; зіставляється з можливостями OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва відображаються в `openclaw plugins list`. Див. [Plugin Bundles](/uk/plugins/bundles) для деталей bundle.

Якщо ви пишете нативний плагін, почніть з [Створення плагінів](/uk/plugins/building-plugins)
і [Огляд Plugin SDK](/uk/plugins/sdk-overview).

## Точки входу пакетів

Npm-пакети нативних плагінів мають оголошувати `openclaw.extensions` у `package.json`.
Кожен запис має залишатися всередині директорії пакета й розв’язуватися в читабельний
runtime-файл або TypeScript-файл вихідного коду з виведеним збудованим JavaScript
відповідником, наприклад `src/index.ts` до `dist/index.js`.

Використовуйте `openclaw.runtimeExtensions`, коли опубліковані runtime-файли не розташовані за
тими самими шляхами, що й записи вихідного коду. Якщо `runtimeExtensions` присутній, він має містити
рівно один запис для кожного запису `extensions`. Невідповідні списки призводять до помилки встановлення та
виявлення плагіна, а не мовчазного fallback до шляхів вихідного коду. Якщо ви також
публікуєте `openclaw.setupEntry`, використовуйте `openclaw.runtimeSetupEntry` для його збудованого
JavaScript-відповідника; цей файл є обов’язковим, якщо оголошений.

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

ClawHub є основним шляхом поширення для більшості плагінів. Поточні пакетовані
релізи OpenClaw уже включають багато офіційних плагінів, тому для них не потрібні
окремі npm-встановлення у звичайних налаштуваннях. Поки кожен плагін, що належить OpenClaw,
не мігрував до ClawHub, OpenClaw все ще постачає деякі пакети плагінів `@openclaw/*`
в npm для старіших/користувацьких встановлень і прямих npm-процесів.

Якщо npm повідомляє, що пакет плагіна `@openclaw/*` застарів, ця версія пакета
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

### Core (постачається з OpenClaw)

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
    - `memory-lancedb` — довгострокова пам’ять на базі LanceDB з автоматичним пригадуванням/захопленням (встановіть `plugins.slots.memory = "memory-lancedb"`)

    Див. [Memory LanceDB](/uk/plugins/memory-lancedb) для налаштування embeddings, сумісних з OpenAI,
    прикладів Ollama, лімітів пригадування та усунення несправностей.

  </Accordion>

  <Accordion title="Speech providers (enabled by default)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Other">
    - `browser` — вбудований браузерний плагін для браузерного інструмента, CLI `openclaw browser`, методу Gateway `browser.request`, runtime браузера та типової служби керування браузером (увімкнено типово; вимкніть перед заміною)
    - `copilot-proxy` — міст VS Code Copilot Proxy (вимкнено типово)

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
| `enabled`        | Головний перемикач (типово: `true`)                           |
| `allow`          | Allowlist плагінів (необов’язково)                               |
| `deny`           | Denylist плагінів (необов’язково; deny має перевагу)                     |
| `load.paths`     | Додаткові файли/директорії плагінів                            |
| `slots`          | Ексклюзивні селектори слотів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>` | Перемикачі та конфігурація для кожного плагіна                               |

`plugins.allow` є ексклюзивним. Коли він непорожній, завантажуватися
або надавати інструменти можуть лише перелічені плагіни, навіть якщо `tools.allow` містить `"*"` або конкретну
назву інструмента, що належить плагіну. Якщо allowlist інструментів посилається на інструменти плагінів, додайте id плагінів-власників
до `plugins.allow` або видаліть `plugins.allow`; `openclaw doctor` попереджає про таку
форму.

Зміни конфігурації, внесені через `/plugins enable` або `/plugins disable`, запускають
перезавантаження Plugin у Gateway в межах процесу. Нові ходи агента перебудовують свій список інструментів із
оновленого реєстру Plugin. Операції, що змінюють джерело, як-от встановлення,
оновлення та видалення, все ще перезапускають процес Gateway, оскільки вже імпортовані
модулі Plugin неможливо безпечно замінити на місці.

`openclaw plugins list` — це локальний знімок реєстру Plugin/конфігурації. Plugin зі станом
`enabled` там означає, що збережений реєстр і поточна конфігурація дозволяють
Plugin брати участь. Це не доводить, що вже запущений віддалений Gateway
перезавантажився або перезапустився з тим самим кодом Plugin. У налаштуваннях VPS/контейнерів
із процесами-обгортками надсилайте перезапуски або записи, що запускають перезавантаження, до фактичного
процесу `openclaw gateway run`, або використовуйте `openclaw gateway restart` для
запущеного Gateway, коли перезавантаження повідомляє про помилку.

<Accordion title="Стани Plugin: вимкнений, відсутній, недійсний">
  - **Вимкнений**: Plugin існує, але правила ввімкнення його вимкнули. Конфігурація зберігається.
  - **Відсутній**: конфігурація посилається на id Plugin, який виявлення не знайшло.
  - **Недійсний**: Plugin існує, але його конфігурація не відповідає оголошеній схемі. Запуск Gateway пропускає лише цей Plugin; `openclaw doctor --fix` може ізолювати недійсний запис, вимкнувши його та видаливши його конфігураційне навантаження.

</Accordion>

## Виявлення та пріоритет

OpenClaw сканує Plugin у такому порядку (перший збіг перемагає):

<Steps>
  <Step title="Шляхи конфігурації">
    `plugins.load.paths` — явні шляхи до файлів або каталогів. Шляхи, що вказують
    назад на власні запаковані каталоги вбудованих Plugin OpenClaw, ігноруються;
    виконайте `openclaw doctor --fix`, щоб видалити ці застарілі псевдоніми.
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

Запаковані встановлення та Docker-образи зазвичай знаходять вбудовані Plugin у
скомпільованому дереві `dist/extensions`. Якщо каталог джерела вбудованого Plugin
змонтовано поверх відповідного запакованого шляху джерела, наприклад
`/app/extensions/synology-chat`, OpenClaw розглядає цей змонтований каталог джерела
як накладення джерела вбудованого Plugin і виявляє його перед запакованим
пакетом `/app/dist/extensions/synology-chat`. Це зберігає працездатність контейнерних
циклів супровідників без перемикання кожного вбудованого Plugin назад на джерело TypeScript.
Установіть `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, щоб примусово використовувати запаковані dist-пакети,
навіть коли наявні змонтовані накладення джерела.

### Правила ввімкнення

- `plugins.enabled: false` вимикає всі Plugin і пропускає роботу з виявлення/завантаження Plugin
- `plugins.deny` завжди має пріоритет над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей Plugin
- Plugin з робочої області **вимкнені за замовчуванням** (їх потрібно явно ввімкнути)
- Вбудовані Plugin дотримуються вбудованого набору, увімкненого за замовчуванням, якщо не перевизначено
- Ексклюзивні слоти можуть примусово ввімкнути вибраний Plugin для цього слота
- Деякі вбудовані opt-in Plugin вмикаються автоматично, коли конфігурація називає
  поверхню, що належить Plugin, як-от посилання на модель провайдера, конфігурацію каналу або runtime
  стенда
- Застаріла конфігурація Plugin зберігається, поки активний `plugins.enabled: false`;
  повторно ввімкніть Plugin перед запуском очищення doctor, якщо хочете видалити застарілі id
- Маршрути Codex сімейства OpenAI зберігають окремі межі Plugin:
  `openai-codex/*` належить Plugin OpenAI, тоді як вбудований Plugin app-server Codex
  вибирається через `agentRuntime.id: "codex"` або застарілі посилання на моделі
  `codex/*`

## Усунення несправностей runtime-хуків

Якщо Plugin з'являється в `plugins list`, але побічні ефекти або хуки
`register(api)` не виконуються в живому чат-трафіку, спершу перевірте таке:

- Виконайте `openclaw gateway status --deep --require-rpc` і підтвердьте, що активні
  URL Gateway, профіль, шлях конфігурації та процес є саме тими, які ви редагуєте.
- Перезапустіть живий Gateway після змін у встановленні/конфігурації/коді Plugin. У контейнерах-обгортках
  PID 1 може бути лише супервізором; перезапустіть або надішліть сигнал дочірньому
  процесу `openclaw gateway run`.
- Використовуйте `openclaw plugins inspect <id> --runtime --json`, щоб підтвердити реєстрації хуків і
  діагностику. Невбудовані хуки розмови, як-от `llm_input`,
  `llm_output`, `before_agent_finalize` і `agent_end`, потребують
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання моделей надавайте перевагу `before_model_resolve`. Він виконується перед
  розв'язанням моделі для ходів агента; `llm_output` виконується лише після того, як спроба моделі
  створить відповідь асистента.
- Для підтвердження ефективної моделі сесії використовуйте `openclaw sessions` або
  поверхні сесії/стану Gateway, а під час налагодження payload-ів провайдера запускайте
  Gateway з `--raw-stream --raw-stream-path <path>`.

### Повільне налаштування інструментів Plugin

Якщо здається, що ходи агента зависають під час підготовки інструментів, увімкніть журналювання трасування та
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
необов'язковим. Повільні рядки підвищуються до попереджень, коли одна фабрика займає
щонайменше 1 с або загальна підготовка фабрик інструментів Plugin займає щонайменше 5 с.

OpenClaw кешує успішні результати фабрик інструментів Plugin для повторних розв'язань
з тим самим ефективним контекстом запиту. Ключ кешу містить ефективну
runtime-конфігурацію, робочу область, id агента/сесії, політику sandbox, налаштування браузера,
контекст доставки, ідентичність запитувача та стан власності, тому фабрики, які
залежать від цих довірених полів, повторно виконуються, коли контекст змінюється.

Якщо один Plugin домінує за часом, перевірте його runtime-реєстрації:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Потім оновіть, перевстановіть або вимкніть цей Plugin. Автори Plugin повинні переносити
дороге завантаження залежностей за шлях виконання інструмента, а не виконувати його
всередині фабрики інструментів.

### Дублювання власності каналу або інструмента

Симптоми:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Це означає, що більше ніж один увімкнений Plugin намагається володіти тим самим каналом,
потоком налаштування або назвою інструмента. Найпоширеніша причина — зовнішній Plugin каналу,
встановлений поруч із вбудованим Plugin, який тепер надає той самий id каналу.

Кроки налагодження:

- Виконайте `openclaw plugins list --enabled --verbose`, щоб побачити кожен увімкнений Plugin
  і походження.
- Виконайте `openclaw plugins inspect <id> --runtime --json` для кожного підозрюваного Plugin і
  порівняйте `channels`, `channelConfigs`, `tools` і діагностику.
- Виконайте `openclaw plugins registry --refresh` після встановлення або видалення
  пакетів Plugin, щоб збережені метадані відображали поточне встановлення.
- Перезапустіть Gateway після змін встановлення, реєстру або конфігурації.

Варіанти виправлення:

- Якщо один Plugin навмисно замінює інший для того самого id каналу, бажаний
  Plugin повинен оголосити `channelConfigs.<channel-id>.preferOver` з
  id Plugin нижчого пріоритету. Див. [/plugins/manifest#replacing-another-channel-plugin](/uk/plugins/manifest#replacing-another-channel-plugin).
- Якщо дублювання випадкове, вимкніть один бік через
  `plugins.entries.<plugin-id>.enabled: false` або видаліть застаріле встановлення
  Plugin.
- Якщо ви явно ввімкнули обидва Plugin, OpenClaw зберігає цей запит і
  повідомляє про конфлікт. Виберіть одного власника для каналу або перейменуйте інструменти,
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

| Слот            | Що він контролює      | За замовчуванням             |
| --------------- | --------------------- | ------------------- |
| `memory`        | Plugin активної пам'яті  | `memory-core`       |
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
Plugin). Інші вбудовані Plugin все ще потребують `openclaw plugins enable <id>`.

`--force` перезаписує наявний встановлений Plugin або пакет хуків на місці. Використовуйте
`openclaw plugins update <id-or-npm-spec>` для звичайних оновлень відстежуваних npm
Plugin. Він не підтримується з `--link`, який повторно використовує шлях джерела замість
копіювання в керовану ціль встановлення.

Коли `plugins.allow` вже встановлено, `openclaw plugins install` додає
id встановленого Plugin до цього allowlist перед його ввімкненням. Якщо той самий id Plugin
наявний у `plugins.deny`, install видаляє цей застарілий запис deny, щоб
явне встановлення можна було завантажити одразу після перезапуску.

OpenClaw зберігає персистентний локальний реєстр Plugin як холодну модель читання для
інвентарю Plugin, власності внесків і планування запуску. Потоки встановлення, оновлення,
видалення, увімкнення та вимкнення оновлюють цей реєстр після зміни стану Plugin.
Той самий файл `plugins/installs.json` зберігає довговічні метадані встановлення у
верхньорівневому `installRecords` і відновлювані метадані маніфесту в `plugins`. Якщо
реєстр відсутній, застарілий або недійсний, `openclaw plugins registry
--refresh` перебудовує його подання маніфестів із записів встановлення, політики конфігурації та
метаданих маніфесту/пакета без завантаження runtime-модулів Plugin.
`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних встановлень. Передавання
специфікації npm-пакета з dist-tag або точною версією зіставляє ім’я пакета
назад із відстежуваним записом Plugin і записує нову специфікацію для майбутніх оновлень.
Передавання імені пакета без версії повертає встановлення, закріплене за точною версією, назад до
типової лінії релізів реєстру. Якщо встановлений npm Plugin уже відповідає
розв’язаній версії та записаній ідентичності артефакту, OpenClaw пропускає оновлення
без завантаження, перевстановлення або переписування конфігурації.

`--pin` працює лише з npm. Він не підтримується з `--marketplace`, бо
marketplace-встановлення зберігають метадані джерела marketplace замість npm-специфікації.

`--dangerously-force-unsafe-install` — це аварійне перевизначення для хибних
спрацьовувань вбудованого сканера небезпечного коду. Воно дозволяє встановлення Plugin
і оновлення Plugin продовжуватися попри вбудовані знахідки рівня `critical`, але все одно
не обходить блокування політик Plugin `before_install` або блокування через помилки сканування.
Сканування встановлення ігнорує поширені тестові файли та каталоги, як-от `tests/`,
`__tests__/`, `*.test.*` і `*.spec.*`, щоб не блокувати запаковані тестові моки;
оголошені runtime-точки входу Plugin усе одно скануються, навіть якщо вони використовують одну з
цих назв.

Цей прапорець CLI застосовується лише до потоків встановлення/оновлення Plugin. Встановлення
залежностей Skills через Gateway натомість використовують відповідне перевизначення запиту
`dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком
завантаження/встановлення Skills із ClawHub.

Якщо Plugin, який ви опублікували в ClawHub, приховано або заблоковано скануванням, відкрийте
панель керування ClawHub або виконайте `clawhub package rescan <name>`, щоб попросити ClawHub перевірити
його знову. `--dangerously-force-unsafe-install` впливає лише на встановлення на вашій власній
машині; він не просить ClawHub повторно просканувати Plugin і не робить заблокований реліз
публічним.

Сумісні пакети беруть участь у тому самому потоці списку/інспекції/увімкнення/вимкнення Plugin.
Поточна runtime-підтримка охоплює bundle skills, Claude command-skills,
типові значення Claude `settings.json`, типові значення Claude `.lsp.json` і оголошених у маніфесті
`lspServers`, Cursor command-skills і сумісні каталоги Codex hook.

`openclaw plugins inspect <id>` також повідомляє виявлені можливості пакета, а також
підтримувані або непідтримувані записи MCP- і LSP-серверів для Plugin на основі пакетів.

Джерелами marketplace можуть бути відоме marketplace-ім’я Claude з
`~/.claude/plugins/known_marketplaces.json`, локальний корінь marketplace або шлях до
`marketplace.json`, GitHub-скорочення на кшталт `owner/repo`, URL репозиторію GitHub
або git URL. Для віддалених marketplace записи Plugin мають залишатися всередині
клонованого репозиторію marketplace і використовувати лише джерела з відносними шляхами.

Дивіться [довідник CLI `openclaw plugins`](/uk/cli/plugins) для повних подробиць.

## Огляд API Plugin

Нативні Plugin експортують об’єкт входу, який надає `register(api)`. Старіші
Plugin можуть усе ще використовувати `activate(api)` як застарілий псевдонім, але нові Plugin мають
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

OpenClaw завантажує об’єкт входу й викликає `register(api)` під час активації Plugin.
Завантажувач усе ще повертається до `activate(api)` для старіших Plugin,
але вбудовані Plugin і нові зовнішні Plugin мають вважати `register` публічним
контрактом.

`api.registrationMode` повідомляє Plugin, чому його точку входу завантажують:

| Режим           | Значення                                                                                                                         |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Runtime-активація. Реєструйте інструменти, hooks, сервіси, команди, маршрути та інші live-побічні ефекти.                       |
| `discovery`     | Виявлення можливостей лише для читання. Реєструйте провайдерів і метадані; довірений код входу Plugin може завантажуватися, але пропускайте live-побічні ефекти. |
| `setup-only`    | Завантаження метаданих налаштування каналу через легковагову точку входу налаштування.                                          |
| `setup-runtime` | Завантаження налаштування каналу, якому також потрібна runtime-точка входу.                                                      |
| `cli-metadata`  | Лише збирання метаданих команд CLI.                                                                                              |

Точки входу Plugin, які відкривають сокети, бази даних, фонові worker-и або довгоживучі
клієнти, мають захищати ці побічні ефекти перевіркою `api.registrationMode === "full"`.
Завантаження discovery кешуються окремо від активаційних завантажень і не замінюють
поточний реєстр Gateway. Discovery не активує, але й не є вільним від імпортів:
OpenClaw може виконати довірену точку входу Plugin або модуль канального Plugin, щоб побудувати
знімок. Тримайте верхні рівні модулів легковаговими й без побічних ефектів, а
мережеві клієнти, підпроцеси, listeners, читання облікових даних і запуск сервісів
переносьте за повні runtime-шляхи.

Поширені методи реєстрації:

| Метод                                   | Що він реєструє             |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Провайдер моделі (LLM)      |
| `registerChannel`                       | Чат-канал                   |
| `registerTool`                          | Інструмент агента           |
| `registerHook` / `on(...)`              | Lifecycle hooks             |
| `registerSpeechProvider`                | Text-to-speech / STT        |
| `registerRealtimeTranscriptionProvider` | Streaming STT               |
| `registerRealtimeVoiceProvider`         | Дуплексний голос у реальному часі |
| `registerMediaUnderstandingProvider`    | Аналіз зображень/аудіо      |
| `registerImageGenerationProvider`       | Генерація зображень         |
| `registerMusicGenerationProvider`       | Генерація музики            |
| `registerVideoGenerationProvider`       | Генерація відео             |
| `registerWebFetchProvider`              | Провайдер web fetch / scrape |
| `registerWebSearchProvider`             | Вебпошук                    |
| `registerHttpRoute`                     | HTTP endpoint               |
| `registerCommand` / `registerCli`       | Команди CLI                 |
| `registerContextEngine`                 | Рушій контексту             |
| `registerService`                       | Фоновий сервіс              |

Поведінка захисту hooks для типізованих lifecycle hooks:

- `before_tool_call`: `{ block: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: `{ block: false }` є no-op і не скасовує попередній block.
- `before_install`: `{ block: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `before_install`: `{ block: false }` є no-op і не скасовує попередній block.
- `message_sending`: `{ cancel: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `message_sending`: `{ cancel: false }` є no-op і не скасовує попередній cancel.

Нативний Codex app-server передає Codex-native події інструментів назад у цю
поверхню hooks. Plugin можуть блокувати нативні інструменти Codex через `before_tool_call`,
спостерігати результати через `after_tool_call` і брати участь у схваленнях Codex
`PermissionRequest`. Bridge поки що не переписує аргументи Codex-native інструментів.
Точна межа runtime-підтримки Codex описана в
[контракті підтримки Codex harness v1](/uk/plugins/codex-harness#v1-support-contract).

Повну поведінку типізованих hooks дивіться в [огляді SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Створення Plugin](/uk/plugins/building-plugins) — створіть власний Plugin
- [Пакети Plugin](/uk/plugins/bundles) — сумісність пакетів Codex/Claude/Cursor
- [Маніфест Plugin](/uk/plugins/manifest) — схема маніфесту
- [Реєстрація інструментів](/uk/plugins/building-plugins#registering-agent-tools) — додайте інструменти агента в Plugin
- [Внутрішня архітектура Plugin](/uk/plugins/architecture) — модель можливостей і конвеєр завантаження
- [Спільнотні Plugin](/uk/plugins/community) — сторонні списки
