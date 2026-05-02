---
read_when:
    - Встановлення або налаштування Plugin
    - Розуміння правил виявлення та завантаження Plugin
    - Робота з пакетами Plugin, сумісними з Codex/Claude
sidebarTitle: Install and Configure
summary: Установлення, налаштування та керування Plugin OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-05-02T11:23:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 97ec11a601445fa948d5639a6d461bcf3846a3c70d3eb304a66243a3d8ce810a
    source_path: tools/plugin.md
    workflow: 16
---

Плагіни розширюють OpenClaw новими можливостями: каналами, постачальниками моделей,
агентськими середовищами, інструментами, Skills, мовленням, транскрипцією в реальному часі, голосом у реальному часі, розумінням медіа, генерацією зображень, генерацією відео, отриманням вебданих, вебпошуком тощо. Деякі плагіни є **основними** (постачаються з OpenClaw), інші
є **зовнішніми**. Більшість зовнішніх плагінів публікуються та виявляються через
[ClawHub](/uk/tools/clawhub). Npm залишається підтримуваним для прямих встановлень і для
тимчасового набору пакетів плагінів, що належать OpenClaw, доки ця міграція завершується.

## Швидкий старт

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

  <Step title="Перевірте плагін">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Використовуйте `--runtime`, коли потрібно підтвердити зареєстровані інструменти, сервіси, методи gateway,
    хуки або команди CLI, якими володіє плагін. Звичайний `inspect` є холодною
    перевіркою маніфесту/реєстру й навмисно уникає імпорту runtime плагіна.

  </Step>
</Steps>

Якщо ви віддаєте перевагу керуванню безпосередньо з чату, увімкніть `commands.plugins: true` і використовуйте:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Шлях встановлення використовує той самий розпізнавач, що й CLI: локальний шлях/архів, явний
`clawhub:<pkg>`, явний `npm:<pkg>`, явний `git:<repo>` або проста специфікація пакета
(спочатку ClawHub, потім резервний npm).

Якщо конфігурація недійсна, встановлення зазвичай аварійно завершується закрито й спрямовує вас до
`openclaw doctor --fix`. Єдиний виняток для відновлення — вузький шлях перевстановлення bundled-plugin
для плагінів, які явно вмикають
`openclaw.install.allowInvalidConfigRecovery`.
Під час запуску Gateway недійсна конфігурація одного плагіна ізолюється до цього плагіна:
запуск записує в журнал проблему `plugins.entries.<id>.config`, пропускає цей плагін під час
завантаження та залишає інші плагіни й канали онлайн. Запустіть `openclaw doctor --fix`,
щоб помістити погану конфігурацію плагіна в карантин, вимкнувши цей запис плагіна та видаливши
його недійсне конфігураційне навантаження; звичайна резервна копія конфігурації зберігає попередні значення.
Коли конфігурація каналу посилається на плагін, який більше не виявляється, але той самий
застарілий ідентифікатор плагіна залишається в конфігурації плагінів або записах встановлення, запуск Gateway
записує попередження в журнал і пропускає цей канал замість блокування всіх інших каналів.
Запустіть `openclaw doctor --fix`, щоб видалити застарілі записи каналу/плагіна; невідомі
ключі каналів без доказів застарілого плагіна все одно провалюють валідацію, щоб друкарські помилки лишалися
видимими.
Якщо встановлено `plugins.enabled: false`, застарілі посилання на плагіни вважаються інертними:
запуск Gateway пропускає роботу з виявлення/завантаження плагінів, а `openclaw doctor` зберігає
вимкнену конфігурацію плагінів замість автоматичного видалення. Повторно ввімкніть плагіни перед
запуском очищення doctor, якщо хочете видалити застарілі ідентифікатори плагінів.

Встановлення залежностей плагінів відбувається лише під час явних потоків install/update або
відновлення doctor. Запуск Gateway, перезавантаження конфігурації та перевірка runtime не
запускають менеджери пакетів і не відновлюють дерева залежностей. Локальні плагіни вже повинні
мати встановлені залежності, тоді як плагіни npm, git і ClawHub встановлюються
в керованих коренях плагінів OpenClaw. Залежності npm можуть підійматися
всередині керованого npm-кореня OpenClaw; install/update сканує цей керований корінь перед
довірою, а uninstall видаляє npm-керовані пакети через npm. Зовнішні плагіни
та користувацькі шляхи завантаження все одно потрібно встановлювати через `openclaw plugins install`.
Див. [Розв’язання залежностей плагінів](/uk/plugins/dependency-resolution) щодо
життєвого циклу під час встановлення.

Вихідні checkout-и є pnpm workspace-ами. Якщо ви клонуєте OpenClaw, щоб працювати над bundled
плагінами, запустіть `pnpm install`; після цього OpenClaw завантажує bundled плагіни з
`extensions/<id>`, тож зміни й пакетно-локальні залежності використовуються безпосередньо.
Звичайні кореневі встановлення npm призначені для пакетованого OpenClaw, а не для розробки
з source checkout.

## Типи плагінів

OpenClaw розпізнає два формати плагінів:

| Формат     | Як це працює                                                       | Приклади                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Нативний** | `openclaw.plugin.json` + runtime-модуль; виконується в процесі       | Офіційні плагіни, спільнотні npm-пакети               |
| **Пакет** | Codex/Claude/Cursor-сумісна структура; зіставляється з можливостями OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва відображаються в `openclaw plugins list`. Див. [Пакети плагінів](/uk/plugins/bundles) для деталей про пакети.

Якщо ви пишете нативний плагін, почніть із [Створення плагінів](/uk/plugins/building-plugins)
і [Огляду Plugin SDK](/uk/plugins/sdk-overview).

## Точки входу пакета

Нативні npm-пакети плагінів мають оголошувати `openclaw.extensions` у `package.json`.
Кожен запис має залишатися всередині каталогу пакета та розв’язуватися в читабельний
runtime-файл або у TypeScript-файл вихідного коду з виведеним побудованим JavaScript
відповідником, наприклад `src/index.ts` до `dist/index.js`.

Використовуйте `openclaw.runtimeExtensions`, коли опубліковані runtime-файли не розташовані за
тими самими шляхами, що й вихідні записи. Коли `runtimeExtensions` присутній, він має містити
рівно один запис для кожного запису `extensions`. Невідповідні списки провалюють встановлення та
виявлення плагіна замість тихого повернення до шляхів вихідного коду. Якщо ви також
публікуєте `openclaw.setupEntry`, використовуйте `openclaw.runtimeSetupEntry` для його побудованого
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

## Офіційні плагіни

### Npm-пакети, що належать OpenClaw, під час міграції

ClawHub є основним шляхом дистрибуції для більшості плагінів. Поточні пакетовані
релізи OpenClaw уже містять багато офіційних плагінів, тому вони не потребують
окремих встановлень npm у звичайних налаштуваннях. Доки кожен плагін, що належить OpenClaw, не
мігрує до ClawHub, OpenClaw все ще постачає деякі пакети плагінів `@openclaw/*` на
npm для старіших/користувацьких встановлень і прямих npm-процесів.

Якщо npm повідомляє, що пакет плагіна `@openclaw/*` застарів, ця версія пакета
походить зі старішої зовнішньої гілки пакетів. Використовуйте bundled плагін із
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
    - `memory-core` — bundled пошук пам’яті (за замовчуванням через `plugins.slots.memory`)
    - `memory-lancedb` — довготривала пам’ять на базі LanceDB з автоматичним recall/capture (встановіть `plugins.slots.memory = "memory-lancedb"`)

    Див. [Memory LanceDB](/uk/plugins/memory-lancedb) щодо OpenAI-сумісного
    налаштування embedding, прикладів Ollama, лімітів recall і усунення несправностей.

  </Accordion>

  <Accordion title="Постачальники мовлення (увімкнені за замовчуванням)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` — bundled плагін браузера для інструмента браузера, CLI `openclaw browser`, gateway-методу `browser.request`, runtime браузера та стандартного сервісу керування браузером (увімкнений за замовчуванням; вимкніть перед заміною)
    - `copilot-proxy` — міст VS Code Copilot Proxy (вимкнений за замовчуванням)

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
| `allow`          | Список дозволених плагінів (необов’язково)                               |
| `deny`           | Список заборонених плагінів (необов’язково; заборона має пріоритет)                     |
| `load.paths`     | Додаткові файли/каталоги плагінів                            |
| `slots`          | Ексклюзивні селектори слотів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>` | Перемикачі + конфігурація для окремого плагіна                               |

`plugins.allow` є ексклюзивним. Коли він непорожній, завантажуватися
або відкривати інструменти можуть лише перелічені плагіни, навіть якщо `tools.allow` містить `"*"` або конкретну назву інструмента, яким володіє плагін. Якщо allowlist інструментів посилається на інструменти плагінів, додайте ідентифікатори плагінів-власників
до `plugins.allow` або видаліть `plugins.allow`; `openclaw doctor` попереджає про таку
форму.

Зміни конфігурації **вимагають перезапуску gateway**. Якщо Gateway працює з увімкненим спостереженням за конфігурацією
та перезапуском у процесі (стандартний шлях `openclaw gateway`), цей
перезапуск зазвичай виконується автоматично невдовзі після запису конфігурації.
Підтримуваного шляху hot-reload для runtime-коду нативного плагіна або lifecycle
хуків немає; перезапустіть процес Gateway, який обслуговує живий канал, перш ніж
очікувати виконання оновленого коду `register(api)`, хуків `api.on(...)`, інструментів, сервісів або
provider/runtime хуків.

`openclaw plugins list` — це локальний знімок реєстру/config Plugin. Увімкнений там Plugin
`enabled` означає, що збережений реєстр і поточний config дозволяють
Plugin брати участь. Це не доводить, що вже запущений віддалений дочірній процес
Gateway перезапустився з тим самим кодом Plugin. У налаштуваннях VPS/container із
процесами-обгортками надсилайте перезапуски фактичному процесу `openclaw gateway run`
або використовуйте `openclaw gateway restart` для запущеного Gateway.

<Accordion title="Стани Plugin: вимкнений vs відсутній vs недійсний">
  - **Вимкнений**: Plugin існує, але правила ввімкнення вимкнули його. Config збережено.
  - **Відсутній**: config посилається на id Plugin, який виявлення не знайшло.
  - **Недійсний**: Plugin існує, але його config не відповідає оголошеній схемі. Запуск Gateway пропускає лише цей Plugin; `openclaw doctor --fix` може помістити недійсний запис у карантин, вимкнувши його та видаливши payload його config.

</Accordion>

## Виявлення та пріоритет

OpenClaw сканує Plugins у такому порядку (перший збіг перемагає):

<Steps>
  <Step title="Шляхи config">
    `plugins.load.paths` — явні шляхи до файлів або каталогів. Шляхи, що вказують
    назад на власні packaged каталоги bundled plugins OpenClaw, ігноруються;
    виконайте `openclaw doctor --fix`, щоб видалити ці застарілі alias.
  </Step>

  <Step title="Plugins робочої області">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` і `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Глобальні Plugins">
    `~/.openclaw/<plugin-root>/*.ts` і `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Bundled plugins">
    Постачаються з OpenClaw. Багато з них увімкнено за замовчуванням (провайдери моделей, мовлення).
    Інші потребують явного ввімкнення.
  </Step>
</Steps>

Packaged installs та Docker images зазвичай знаходять bundled plugins із
скомпільованого дерева `dist/extensions`. Якщо вихідний каталог bundled plugin
bind-mounted поверх відповідного packaged source path, наприклад
`/app/extensions/synology-chat`, OpenClaw розглядає цей змонтований вихідний каталог
як bundled source overlay і виявляє його перед packaged bundle
`/app/dist/extensions/synology-chat`. Це зберігає працездатність container loops
для maintainer без перемикання кожного bundled plugin назад на TypeScript source.
Задайте `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, щоб примусово використовувати packaged dist bundles,
навіть коли присутні source overlay mounts.

### Правила ввімкнення

- `plugins.enabled: false` вимикає всі Plugins і пропускає роботу з виявлення/завантаження Plugin
- `plugins.deny` завжди має перевагу над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей Plugin
- Plugins із робочої області **вимкнені за замовчуванням** (мають бути явно ввімкнені)
- Bundled plugins дотримуються вбудованого набору default-on, якщо його не перевизначено
- Exclusive slots можуть примусово ввімкнути вибраний Plugin для цього slot
- Деякі bundled opt-in Plugins вмикаються автоматично, коли config називає
  поверхню, що належить Plugin, наприклад provider model ref, channel config або harness
  runtime
- Застарілий config Plugin зберігається, поки активне `plugins.enabled: false`;
  повторно ввімкніть Plugins перед запуском очищення doctor, якщо хочете видалити застарілі ids
- Маршрути сімейства OpenAI Codex зберігають окремі межі Plugin:
  `openai-codex/*` належить OpenAI Plugin, тоді як bundled Codex
  app-server Plugin вибирається через `agentRuntime.id: "codex"` або застарілі
  refs моделей `codex/*`

## Усунення проблем із runtime hooks

Якщо Plugin відображається в `plugins list`, але побічні ефекти `register(api)` або hooks
не виконуються в живому chat traffic, спершу перевірте таке:

- Виконайте `openclaw gateway status --deep --require-rpc` і підтвердьте, що активні
  URL Gateway, profile, config path і process саме ті, які ви редагуєте.
- Перезапустіть live Gateway після змін install/config/code Plugin. У wrapper
  containers PID 1 може бути лише supervisor; перезапустіть або надішліть signal дочірньому
  процесу `openclaw gateway run`.
- Використайте `openclaw plugins inspect <id> --runtime --json`, щоб підтвердити реєстрації hooks і
  diagnostics. Non-bundled conversation hooks, як-от `llm_input`,
  `llm_output`, `before_agent_finalize` і `agent_end`, потребують
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання моделей віддавайте перевагу `before_model_resolve`. Він виконується перед model
  resolution для agent turns; `llm_output` виконується лише після того, як спроба моделі
  створить assistant output.
- Для підтвердження effective session model використовуйте `openclaw sessions` або
  поверхні session/status Gateway, а під час налагодження provider payloads запускайте
  Gateway з `--raw-stream --raw-stream-path <path>`.

### Повільне налаштування інструментів Plugin

Якщо agent turns ніби зависають під час підготовки tools, увімкніть trace logging і
перевірте рядки часу виконання plugin tool factory:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Шукайте:

```text
[trace:plugin-tools] factory timings ...
```

Зведення перелічує total factory time і найповільніші plugin tool factories,
зокрема id Plugin, оголошені tool names, result shape і чи є tool
optional. Повільні рядки підвищуються до warnings, коли один factory займає
щонайменше 1s або загальна підготовка plugin tool factory займає щонайменше 5s.

OpenClaw кешує успішні результати plugin tool factory для повторних resolutions
із тим самим effective request context. Cache key включає effective
runtime config, workspace, agent/session ids, sandbox policy, browser settings,
delivery context, requester identity і ownership state, тому factories, які
залежать від цих trusted fields, повторно виконуються, коли context змінюється.

Якщо один Plugin домінує за часом, перевірте його runtime registrations:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Потім оновіть, перевстановіть або вимкніть цей Plugin. Автори Plugin мають переносити
дороге завантаження залежностей за шлях виконання tool, замість того щоб робити це
всередині tool factory.

### Дублювання ownership каналу або tool

Симптоми:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Це означає, що більш ніж один увімкнений Plugin намагається володіти тим самим channel,
setup flow або tool name. Найпоширеніша причина — зовнішній channel Plugin,
встановлений поруч із bundled plugin, який тепер надає той самий channel id.

Кроки налагодження:

- Виконайте `openclaw plugins list --enabled --verbose`, щоб побачити кожен увімкнений Plugin
  і origin.
- Виконайте `openclaw plugins inspect <id> --runtime --json` для кожного підозрюваного Plugin і
  порівняйте `channels`, `channelConfigs`, `tools` і diagnostics.
- Виконайте `openclaw plugins registry --refresh` після встановлення або видалення
  plugin packages, щоб збережені metadata відображали поточний install.
- Перезапустіть Gateway після змін install, registry або config.

Варіанти виправлення:

- Якщо один Plugin навмисно замінює інший для того самого channel id, бажаний
  Plugin має оголосити `channelConfigs.<channel-id>.preferOver` з
  id Plugin нижчого пріоритету. Див. [/plugins/manifest#replacing-another-channel-plugin](/uk/plugins/manifest#replacing-another-channel-plugin).
- Якщо дублювання випадкове, вимкніть один бік через
  `plugins.entries.<plugin-id>.enabled: false` або видаліть застарілий install
  Plugin.
- Якщо ви явно ввімкнули обидва Plugins, OpenClaw зберігає цей запит і
  повідомляє про conflict. Виберіть одного owner для channel або перейменуйте належні Plugin
  tools, щоб runtime surface була однозначною.

## Slots Plugin (exclusive categories)

Деякі categories є exclusive (одночасно активна лише одна):

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

| Slot            | Що контролює          | Default             |
| --------------- | --------------------- | ------------------- |
| `memory`        | Active memory Plugin  | `memory-core`       |
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

openclaw plugins install <package>         # install (ClawHub first, then npm)
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

Bundled plugins постачаються з OpenClaw. Багато з них увімкнено за замовчуванням (наприклад,
bundled model providers, bundled speech providers і bundled browser
Plugin). Інші bundled plugins усе ще потребують `openclaw plugins enable <id>`.

`--force` перезаписує наявний installed Plugin або hook pack на місці. Використовуйте
`openclaw plugins update <id-or-npm-spec>` для routine upgrades tracked npm
Plugins. Він не підтримується з `--link`, який повторно використовує source path замість
копіювання поверх managed install target.

Коли `plugins.allow` уже задано, `openclaw plugins install` додає
id installed Plugin до цього allowlist перед його ввімкненням. Якщо той самий id Plugin
присутній у `plugins.deny`, install видаляє цей застарілий deny entry, щоб
explicit install можна було завантажити одразу після restart.

OpenClaw зберігає постійний локальний реєстр Plugin як холодну модель читання для
інвентаризації Plugin, володіння внесками та планування запуску. Потоки встановлення, оновлення,
видалення, увімкнення та вимкнення оновлюють цей реєстр після зміни стану Plugin.
Той самий файл `plugins/installs.json` зберігає довговічні метадані встановлення в
верхньорівневому `installRecords` і відновлювані метадані маніфесту в `plugins`. Якщо
реєстр відсутній, застарілий або недійсний, `openclaw plugins registry
--refresh` перебудовує його подання маніфестів із записів встановлення, політики конфігурації та
метаданих маніфесту/пакета без завантаження runtime-модулів Plugin.
`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних встановлень. Передавання
специфікації npm-пакета з dist-tag або точною версією зіставляє назву пакета
назад із відстежуваним записом Plugin і записує нову специфікацію для майбутніх оновлень.
Передавання назви пакета без версії переводить точно закріплене встановлення назад на
стандартну лінію випусків реєстру. Якщо встановлений npm Plugin уже відповідає
розв’язаній версії та записаній ідентичності артефакту, OpenClaw пропускає оновлення
без завантаження, перевстановлення або перезапису конфігурації.

`--pin` працює лише з npm. Він не підтримується з `--marketplace`, тому що
встановлення з marketplace зберігають метадані джерела marketplace замість npm-специфікації.

`--dangerously-force-unsafe-install` — це аварійне перевизначення для хибних
спрацьовувань вбудованого сканера небезпечного коду. Воно дозволяє встановлення
Plugin і оновлення Plugin продовжуватися попри вбудовані знахідки `critical`, але все одно
не обходить блокування політики `before_install` Plugin або блокування через помилку сканування.
Сканування встановлення ігнорують поширені тестові файли та каталоги, як-от `tests/`,
`__tests__/`, `*.test.*` і `*.spec.*`, щоб не блокувати запаковані тестові моки;
оголошені runtime-точки входу Plugin все одно скануються, навіть якщо вони використовують одну з
цих назв.

Цей CLI-прапорець застосовується лише до потоків встановлення/оновлення Plugin. Встановлення
залежностей Skills, підтримані Gateway, натомість використовують відповідне перевизначення запиту
`dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим
потоком завантаження/встановлення Skills із ClawHub.

Якщо Plugin, який ви опублікували в ClawHub, приховано або заблоковано скануванням, відкрийте
панель ClawHub або запустіть `clawhub package rescan <name>`, щоб попросити ClawHub перевірити
його знову. `--dangerously-force-unsafe-install` впливає лише на встановлення на вашій власній
машині; він не просить ClawHub повторно сканувати Plugin і не робить заблокований випуск
публічним.

Сумісні bundles беруть участь у тому самому потоці переліку/перегляду/увімкнення/вимкнення
Plugin. Поточна runtime-підтримка охоплює Skills у bundles, Claude command-skills,
типові значення Claude `settings.json`, типові значення Claude `.lsp.json` і оголошені в маніфесті
`lspServers`, Cursor command-skills, а також сумісні каталоги хуків Codex.

`openclaw plugins inspect <id>` також повідомляє виявлені можливості bundle, а також
підтримувані або непідтримувані записи серверів MCP і LSP для Plugin, підтриманих bundle.

Джерела marketplace можуть бути відомою назвою Claude marketplace з
`~/.claude/plugins/known_marketplaces.json`, локальним коренем marketplace або шляхом
`marketplace.json`, скороченням GitHub на кшталт `owner/repo`, URL репозиторію GitHub
або git URL. Для віддалених marketplace записи Plugin мають залишатися всередині
клонованого репозиторію marketplace і використовувати лише відносні джерела шляхів.

Докладні відомості див. у [довіднику CLI `openclaw plugins`](/uk/cli/plugins).

## Огляд Plugin API

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

OpenClaw завантажує об’єкт входу й викликає `register(api)` під час активації
Plugin. Завантажувач усе ще повертається до `activate(api)` для старіших Plugin,
але вбудовані Plugin і нові зовнішні Plugin мають розглядати `register` як
публічний контракт.

`api.registrationMode` повідомляє Plugin, чому його точку входу завантажують:

| Режим           | Значення                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Runtime-активація. Реєструйте інструменти, хуки, служби, команди, маршрути та інші живі побічні ефекти.                              |
| `discovery`     | Виявлення можливостей лише для читання. Реєструйте провайдерів і метадані; довірений код входу Plugin може завантажуватися, але пропускайте живі побічні ефекти. |
| `setup-only`    | Завантаження метаданих налаштування каналу через легку точку входу налаштування.                                                                |
| `setup-runtime` | Завантаження налаштування каналу, якому також потрібна runtime-точка входу.                                                                         |
| `cli-metadata`  | Лише збирання метаданих CLI-команд.                                                                                            |

Точки входу Plugin, які відкривають сокети, бази даних, фонові воркери або довгоживучі
клієнти, мають захищати ці побічні ефекти через `api.registrationMode === "full"`.
Завантаження discovery кешуються окремо від активаційних завантажень і не замінюють
запущений реєстр Gateway. Discovery не активує, але не є вільним від імпорту:
OpenClaw може виконувати довірену точку входу Plugin або модуль Plugin каналу, щоб побудувати
знімок. Тримайте верхні рівні модулів легкими та без побічних ефектів, а мережеві
клієнти, підпроцеси, слухачі, читання облікових даних і запуск служб переносіть
за шляхи повного runtime.

Поширені методи реєстрації:

| Метод                                   | Що він реєструє             |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Провайдер моделі (LLM)      |
| `registerChannel`                       | Канал чату                  |
| `registerTool`                          | Інструмент агента           |
| `registerHook` / `on(...)`              | Хуки життєвого циклу        |
| `registerSpeechProvider`                | Text-to-speech / STT        |
| `registerRealtimeTranscriptionProvider` | Потоковий STT               |
| `registerRealtimeVoiceProvider`         | Дуплексний голос у реальному часі |
| `registerMediaUnderstandingProvider`    | Аналіз зображень/аудіо      |
| `registerImageGenerationProvider`       | Генерація зображень         |
| `registerMusicGenerationProvider`       | Генерація музики            |
| `registerVideoGenerationProvider`       | Генерація відео             |
| `registerWebFetchProvider`              | Провайдер web fetch / scrape |
| `registerWebSearchProvider`             | Вебпошук                    |
| `registerHttpRoute`                     | HTTP-ендпоінт               |
| `registerCommand` / `registerCli`       | CLI-команди                 |
| `registerContextEngine`                 | Рушій контексту             |
| `registerService`                       | Фонова служба               |

Поведінка запобіжників хуків для типізованих хуків життєвого циклу:

- `before_tool_call`: `{ block: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: `{ block: false }` нічого не робить і не скасовує попереднє блокування.
- `before_install`: `{ block: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `before_install`: `{ block: false }` нічого не робить і не скасовує попереднє блокування.
- `message_sending`: `{ cancel: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `message_sending`: `{ cancel: false }` нічого не робить і не скасовує попереднє скасування.

Нативний Codex app-server мостить події нативних інструментів Codex назад у цю
поверхню хуків. Plugin можуть блокувати нативні інструменти Codex через `before_tool_call`,
спостерігати результати через `after_tool_call` і брати участь у схваленнях Codex
`PermissionRequest`. Міст поки що не переписує аргументи нативних інструментів Codex.
Точна межа підтримки runtime Codex міститься в
[контракті підтримки Codex harness v1](/uk/plugins/codex-harness#v1-support-contract).

Повну поведінку типізованих хуків див. в [огляді SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Створення Plugin](/uk/plugins/building-plugins) — створіть власний Plugin
- [Bundles Plugin](/uk/plugins/bundles) — сумісність bundle Codex/Claude/Cursor
- [Маніфест Plugin](/uk/plugins/manifest) — схема маніфесту
- [Реєстрація інструментів](/uk/plugins/building-plugins#registering-agent-tools) — додайте інструменти агента в Plugin
- [Внутрішня архітектура Plugin](/uk/plugins/architecture) — модель можливостей і конвеєр завантаження
- [Plugin спільноти](/uk/plugins/community) — сторонні списки
