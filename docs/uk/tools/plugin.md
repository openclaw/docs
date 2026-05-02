---
read_when:
    - Встановлення або налаштування Plugin
    - Розуміння правил виявлення та завантаження Plugin
    - Робота з пакетами Plugin, сумісними з Codex/Claude
sidebarTitle: Install and Configure
summary: Установлюйте, налаштовуйте та керуйте Plugin OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-05-02T01:11:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: dee1689b502a1ce60f4921d216f8d8a00fbb131bc993cfabb4e0295825c1fdb2
    source_path: tools/plugin.md
    workflow: 16
---

Plugins розширюють OpenClaw новими можливостями: channels, model providers,
agent harnesses, tools, skills, speech, realtime transcription, realtime
voice, media-understanding, image generation, video generation, web fetch, web
search тощо. Деякі Plugins є **core** (постачаються з OpenClaw), інші
є **external**. Більшість external Plugins публікуються та знаходяться через
[ClawHub](/uk/tools/clawhub). Npm залишається підтримуваним для прямих установлень і для
тимчасового набору пакетів Plugins, що належать OpenClaw, доки ця міграція завершується.

## Швидкий старт

<Steps>
  <Step title="Перегляньте, що завантажено">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Установіть Plugin">
    ```bash
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

  <Step title="Перевірте Plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Використовуйте `--runtime`, коли потрібно підтвердити зареєстровані tools, services, gateway
    methods, hooks або команди CLI, що належать Plugin. Звичайний `inspect` — це холодна
    перевірка manifest/registry, яка навмисно уникає імпорту runtime Plugin.

  </Step>
</Steps>

Якщо ви віддаєте перевагу керуванню безпосередньо з чату, увімкніть `commands.plugins: true` і використовуйте:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Шлях установлення використовує той самий resolver, що й CLI: локальний шлях/archive, явний
`clawhub:<pkg>`, явний `npm:<pkg>`, явний `git:<repo>` або bare package
spec (спочатку ClawHub, потім npm fallback).

Якщо конфігурація недійсна, установлення зазвичай безпечно завершується помилкою і спрямовує вас до
`openclaw doctor --fix`. Єдиний виняток для відновлення — вузький шлях перевстановлення bundled-plugin
для Plugins, які явно ввімкнули
`openclaw.install.allowInvalidConfigRecovery`.
Під час запуску Gateway недійсна конфігурація одного Plugin ізолюється до цього Plugin:
запуск записує проблему `plugins.entries.<id>.config` у logs, пропускає цей Plugin під час
завантаження та залишає інші Plugins і channels онлайн. Запустіть `openclaw doctor --fix`,
щоб помістити погану конфігурацію Plugin у карантин, вимкнувши цей запис Plugin і видаливши
його недійсне config payload; звичайна резервна копія конфігурації зберігає попередні значення.
Коли channel config посилається на Plugin, який більше не можна виявити, але той самий
застарілий plugin id залишається в plugin config або install records, запуск Gateway
записує warnings і пропускає цей channel замість блокування всіх інших channels.
Запустіть `openclaw doctor --fix`, щоб видалити застарілі channel/plugin entries; невідомі
channel keys без evidence застарілого Plugin усе одно не проходять validation, тож помилки введення
залишаються видимими.
Якщо встановлено `plugins.enabled: false`, застарілі посилання на Plugins вважаються неактивними:
запуск Gateway пропускає роботу з discovery/load Plugin, а `openclaw doctor` зберігає
вимкнену plugin config замість автоматичного видалення. Повторно ввімкніть Plugins перед
запуском doctor cleanup, якщо хочете видалити застарілі plugin ids.

Установлення залежностей Plugin відбувається лише під час явних install/update або
doctor repair flows. Запуск Gateway, перезавантаження конфігурації та runtime inspection
не запускають package managers і не ремонтують dependency trees. Локальні Plugins уже повинні
мати встановлені залежності, тоді як npm, git і ClawHub Plugins встановлюються
під керованими OpenClaw plugin roots із package-local
dependencies. External Plugins і custom load paths усе ще потрібно встановлювати
через `openclaw plugins install`.
Див. [Розв’язання залежностей Plugin](/uk/plugins/dependency-resolution) для життєвого циклу
під час установлення.

Source checkouts — це pnpm workspaces. Якщо ви клонували OpenClaw, щоб працювати над bundled
Plugins, запустіть `pnpm install`; після цього OpenClaw завантажує bundled Plugins з
`extensions/<id>`, тож edits і package-local dependencies використовуються напряму.
Звичайні npm root installs призначені для packaged OpenClaw, а не для розробки
source checkout.

## Типи Plugin

OpenClaw розпізнає два формати Plugin:

| Формат     | Як це працює                                                     | Приклади                                               |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + runtime module; виконується in-process  | Офіційні Plugins, пакети community npm                 |
| **Bundle** | Codex/Claude/Cursor-compatible layout; зіставляється з функціями OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва відображаються в `openclaw plugins list`. Див. [Plugin Bundles](/uk/plugins/bundles) для деталей bundle.

Якщо ви пишете native Plugin, почніть із [Створення Plugins](/uk/plugins/building-plugins)
та [Огляду Plugin SDK](/uk/plugins/sdk-overview).

## Точки входу пакета

Native plugin npm packages мають оголошувати `openclaw.extensions` у `package.json`.
Кожен entry має залишатися всередині package directory і розв’язуватися до читабельного
runtime file або до TypeScript source file з inferred built JavaScript
peer, наприклад від `src/index.ts` до `dist/index.js`.

Використовуйте `openclaw.runtimeExtensions`, коли опубліковані runtime files не розташовані за
тими самими paths, що й source entries. Якщо він присутній, `runtimeExtensions` має містити
рівно один entry для кожного `extensions` entry. Несумісні списки призводять до помилки install і
plugin discovery замість мовчазного fallback до source paths. Якщо ви також
публікуєте `openclaw.setupEntry`, використовуйте `openclaw.runtimeSetupEntry` для його built
JavaScript peer; цей файл обов’язковий, якщо його оголошено.

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

### Пакети npm, що належать OpenClaw, під час міграції

ClawHub — основний шлях розповсюдження для більшості Plugins. Поточні packaged
OpenClaw releases уже містять багато офіційних Plugins, тож у звичайних налаштуваннях
їм не потрібні окремі npm installs. Доки кожен Plugin, що належить OpenClaw, не
мігрує до ClawHub, OpenClaw усе ще постачає деякі `@openclaw/*` plugin packages на
npm для older/custom installs і прямих npm workflows.

Якщо npm повідомляє про `@openclaw/*` plugin package як deprecated, ця package
version походить зі старішого external package train. Використовуйте bundled Plugin з
поточного OpenClaw або local checkout, доки не буде опубліковано новіший npm package.

| Plugin          | Пакет                      | Документація                                |
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

  <Accordion title="Memory Plugins">
    - `memory-core` — bundled memory search (за замовчуванням через `plugins.slots.memory`)
    - `memory-lancedb` — long-term memory на базі LanceDB з auto-recall/capture (встановіть `plugins.slots.memory = "memory-lancedb"`)

    Див. [Memory LanceDB](/uk/plugins/memory-lancedb) для OpenAI-compatible
    налаштування embeddings, прикладів Ollama, recall limits і troubleshooting.

  </Accordion>

  <Accordion title="Постачальники мовлення (увімкнено за замовчуванням)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` — bundled browser Plugin для browser tool, `openclaw browser` CLI, `browser.request` gateway method, browser runtime і default browser control service (увімкнено за замовчуванням; вимкніть перед заміною)
    - `copilot-proxy` — bridge VS Code Copilot Proxy (вимкнено за замовчуванням)

  </Accordion>
</AccordionGroup>

Шукаєте сторонні Plugins? Див. [Community Plugins](/uk/plugins/community).

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
| `allow`          | Plugin allowlist (необов’язково)                          |
| `deny`           | Plugin denylist (необов’язково; deny має пріоритет)       |
| `load.paths`     | Додаткові plugin files/directories                        |
| `slots`          | Exclusive slot selectors (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>` | Перемикачі + конфігурація для окремого Plugin             |

`plugins.allow` є exclusive. Коли він непорожній, завантажуватися
або exposing tools можуть лише перелічені Plugins, навіть якщо `tools.allow` містить `"*"` або конкретну
назву tool, що належить Plugin. Якщо tool allowlist посилається на plugin tools, додайте owning plugin ids
до `plugins.allow` або видаліть `plugins.allow`; `openclaw doctor` попереджає про таку
форму.

Зміни конфігурації **потребують перезапуску Gateway**. Якщо Gateway працює з config
watch + in-process restart enabled (стандартний шлях `openclaw gateway`), цей
restart зазвичай виконується автоматично за мить після запису config.
Немає підтримуваного hot-reload path для native plugin runtime code або lifecycle
hooks; перезапустіть процес Gateway, який обслуговує live channel, перш ніж
очікувати виконання оновленого коду `register(api)`, hooks `api.on(...)`, tools, services або
provider/runtime hooks.

`openclaw plugins list` — це локальний знімок plugin registry/config. Позначка
`enabled` для Plugin там означає, що persisted registry і поточна config дозволяють
Plugin брати участь. Це не підтверджує, що вже запущений remote Gateway
child перезапустився з тим самим plugin code. У VPS/container setups з
wrapper processes надсилайте restarts до фактичного процесу `openclaw gateway run`
або використовуйте `openclaw gateway restart` проти запущеного Gateway.

<Accordion title="Стани Plugin: вимкнений, відсутній, недійсний">
  - **Вимкнений**: plugin існує, але правила ввімкнення його вимкнули. Конфігурація зберігається.
  - **Відсутній**: конфігурація посилається на id plugin, який виявлення не знайшло.
  - **Недійсний**: plugin існує, але його конфігурація не відповідає оголошеній схемі. Запуск Gateway пропускає лише цей plugin; `openclaw doctor --fix` може помістити недійсний запис у карантин, вимкнувши його та видаливши його конфігураційне навантаження.

</Accordion>

## Виявлення та пріоритет

OpenClaw сканує plugins у такому порядку (перший збіг перемагає):

<Steps>
  <Step title="Шляхи конфігурації">
    `plugins.load.paths` — явні шляхи до файлів або каталогів. Шляхи, які вказують
    назад на власні упаковані каталоги вбудованих plugin OpenClaw, ігноруються;
    запустіть `openclaw doctor --fix`, щоб видалити ці застарілі псевдоніми.
  </Step>

  <Step title="Plugins робочої області">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` і `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Глобальні plugins">
    `~/.openclaw/<plugin-root>/*.ts` і `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Вбудовані plugins">
    Постачаються з OpenClaw. Багато з них увімкнено за замовчуванням (постачальники моделей, мовлення).
    Інші потребують явного ввімкнення.
  </Step>
</Steps>

Упаковані інсталяції та образи Docker зазвичай розв’язують вбудовані plugins із
скомпільованого дерева `dist/extensions`. Якщо каталог джерельного коду вбудованого plugin
змонтовано поверх відповідного упакованого шляху до джерельного коду, наприклад
`/app/extensions/synology-chat`, OpenClaw трактує цей змонтований каталог джерельного коду
як накладання вбудованого джерельного коду та виявляє його перед упакованим
бандлом `/app/dist/extensions/synology-chat`. Це зберігає працездатність контейнерних
циклів супровідників без перемикання кожного вбудованого plugin назад на джерельний код TypeScript.
Установіть `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, щоб примусово використовувати упаковані dist-бандли
навіть за наявності змонтованих накладань джерельного коду.

### Правила ввімкнення

- `plugins.enabled: false` вимикає всі plugins і пропускає роботу з виявлення/завантаження plugin
- `plugins.deny` завжди має пріоритет над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей plugin
- Plugins із робочої області **вимкнені за замовчуванням** (їх потрібно явно ввімкнути)
- Вбудовані plugins дотримуються вбудованого набору ввімкнення за замовчуванням, якщо це не перевизначено
- Ексклюзивні слоти можуть примусово ввімкнути вибраний plugin для цього слота
- Деякі вбудовані opt-in plugins автоматично вмикаються, коли конфігурація називає
  поверхню, що належить plugin, наприклад посилання на модель постачальника, конфігурацію каналу або середовище виконання
  harness
- Застаріла конфігурація plugin зберігається, доки активний `plugins.enabled: false`;
  повторно ввімкніть plugins перед запуском очищення doctor, якщо хочете видалити застарілі id
- Маршрути Codex родини OpenAI зберігають окремі межі plugin:
  `openai-codex/*` належить до plugin OpenAI, тоді як вбудований plugin сервера застосунку Codex
  вибирається через `agentRuntime.id: "codex"` або застарілі
  посилання на моделі `codex/*`

## Усунення несправностей runtime hooks

Якщо plugin з’являється в `plugins list`, але побічні ефекти або hooks `register(api)`
не виконуються в живому чат-трафіку, спершу перевірте це:

- Запустіть `openclaw gateway status --deep --require-rpc` і підтвердьте, що активні
  URL Gateway, профіль, шлях конфігурації та процес є саме тими, які ви редагуєте.
- Перезапустіть живий Gateway після змін інсталяції/config/code plugin. У контейнерах-обгортках
  PID 1 може бути лише супервізором; перезапустіть або надішліть сигнал дочірньому
  процесу `openclaw gateway run`.
- Використайте `openclaw plugins inspect <id> --runtime --json`, щоб підтвердити реєстрації hooks і
  діагностику. Невбудовані conversation hooks, як-от `llm_input`,
  `llm_output`, `before_agent_finalize` і `agent_end`, потребують
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання моделей надавайте перевагу `before_model_resolve`. Він виконується перед розв’язанням моделі
  для ходів агента; `llm_output` виконується лише після того, як спроба моделі
  створить вивід асистента.
- Для підтвердження ефективної моделі сеансу використовуйте `openclaw sessions` або
  поверхні сеансів/статусу Gateway і, під час налагодження payload постачальника, запускайте
  Gateway з `--raw-stream --raw-stream-path <path>`.

### Повільне налаштування інструментів plugin

Якщо здається, що ходи агента зависають під час підготовки інструментів, увімкніть trace-журналювання та
перевірте рядки часу виконання фабрик інструментів plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Шукайте:

```text
[trace:plugin-tools] factory timings ...
```

Підсумок перелічує загальний час фабрик і найповільніші фабрики інструментів plugin,
включно з id plugin, оголошеними назвами інструментів, формою результату та тим, чи є інструмент
необов’язковим. Повільні рядки підвищуються до попереджень, коли одна фабрика триває
щонайменше 1 с або загальна підготовка фабрик інструментів plugin триває щонайменше 5 с.

Якщо один plugin домінує за часом, перевірте його runtime-реєстрації:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Потім оновіть, перевстановіть або вимкніть цей plugin. Автори Plugin повинні переносити
дороге завантаження залежностей за шлях виконання інструмента, а не робити це
всередині фабрики інструмента.

### Дублювання власника каналу або інструмента

Симптоми:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Це означає, що більш ніж один увімкнений plugin намагається володіти тим самим каналом,
потоком налаштування або назвою інструмента. Найпоширеніша причина — зовнішній plugin каналу,
установлений поруч із вбудованим plugin, який тепер надає той самий id каналу.

Кроки налагодження:

- Запустіть `openclaw plugins list --enabled --verbose`, щоб побачити кожен увімкнений plugin
  і походження.
- Запустіть `openclaw plugins inspect <id> --runtime --json` для кожного підозрюваного plugin і
  порівняйте `channels`, `channelConfigs`, `tools` і діагностику.
- Запустіть `openclaw plugins registry --refresh` після встановлення або видалення
  пакетів plugin, щоб збережені метадані відображали поточну інсталяцію.
- Перезапустіть Gateway після змін інсталяції, реєстру або конфігурації.

Варіанти виправлення:

- Якщо один plugin навмисно замінює інший для того самого id каналу, бажаний
  plugin має оголосити `channelConfigs.<channel-id>.preferOver` з
  id plugin нижчого пріоритету. Див. [/plugins/manifest#replacing-another-channel-plugin](/uk/plugins/manifest#replacing-another-channel-plugin).
- Якщо дублювання випадкове, вимкніть одну зі сторін за допомогою
  `plugins.entries.<plugin-id>.enabled: false` або видаліть застарілу інсталяцію
  plugin.
- Якщо ви явно ввімкнули обидва plugins, OpenClaw зберігає цей запит і
  повідомляє про конфлікт. Виберіть одного власника для каналу або перейменуйте інструменти,
  що належать plugin, щоб runtime-поверхня була однозначною.

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

| Слот            | Що він контролює      | Типове значення             |
| --------------- | --------------------- | ------------------- |
| `memory`        | Plugin active memory  | `memory-core`       |
| `contextEngine` | Активний рушій контексту | `legacy` (вбудований) |

## Довідник CLI

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
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

Вбудовані plugins постачаються з OpenClaw. Багато з них увімкнено за замовчуванням (наприклад
вбудовані постачальники моделей, вбудовані постачальники мовлення та вбудований browser
plugin). Інші вбудовані plugins усе ще потребують `openclaw plugins enable <id>`.

`--force` перезаписує наявний установлений plugin або hook pack на місці. Використовуйте
`openclaw plugins update <id-or-npm-spec>` для регулярних оновлень відстежуваних npm
plugins. Він не підтримується з `--link`, який повторно використовує шлях до джерельного коду замість
копіювання поверх керованої цілі інсталяції.

Коли `plugins.allow` уже встановлено, `openclaw plugins install` додає
id установленого plugin до цього allowlist перед його ввімкненням. Якщо той самий id plugin
наявний у `plugins.deny`, інсталяція видаляє цей застарілий deny-запис, щоб
явна інсталяція могла завантажуватися одразу після перезапуску.

OpenClaw підтримує збережений локальний реєстр plugin як модель холодного читання для
інвентарю plugin, власності внесків і планування запуску. Потоки install, update,
uninstall, enable і disable оновлюють цей реєстр після зміни стану plugin.
Той самий файл `plugins/installs.json` зберігає сталі метадані інсталяції в
верхньорівневому `installRecords` і метадані маніфестів, які можна перебудувати, у `plugins`. Якщо
реєстр відсутній, застарілий або недійсний, `openclaw plugins registry
--refresh` перебудовує його manifest view із записів інсталяцій, політики конфігурації та
метаданих manifest/package без завантаження runtime-модулів plugin.
`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних інсталяцій. Передавання
специфікації npm-пакета з dist-tag або точною версією розв’язує назву пакета
назад до відстежуваного запису plugin і записує нову специфікацію для майбутніх оновлень.
Передавання назви пакета без версії повертає точно закріплену інсталяцію назад до
типової лінії випуску реєстру. Якщо встановлений npm plugin уже відповідає
розв’язаній версії та записаній ідентичності артефакту, OpenClaw пропускає оновлення
без завантаження, перевстановлення або перезапису конфігурації.

`--pin` доступний лише для npm. Він не підтримується з `--marketplace`, оскільки
marketplace-інсталяції зберігають метадані джерела marketplace замість npm-специфікації.

`--dangerously-force-unsafe-install` — це аварійне перевизначення для хибних спрацювань вбудованого сканера небезпечного коду. Воно дає змогу встановленням плагінів і оновленням плагінів продовжуватися попри вбудовані знахідки рівня `critical`, але все одно не обходить блокування політики плагіна `before_install` або блокування через збій сканування. Сканування під час встановлення ігнорують поширені тестові файли й каталоги, як-от `tests/`, `__tests__/`, `*.test.*` і `*.spec.*`, щоб не блокувати запаковані тестові моки; оголошені runtime-точки входу плагіна все одно скануються, навіть якщо використовують одну з цих назв.

Цей прапорець CLI застосовується лише до потоків встановлення/оновлення плагінів. Встановлення залежностей Skills, підтримані Gateway, натомість використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком завантаження/встановлення Skills із ClawHub.

Якщо плагін, який ви опублікували на ClawHub, приховано або заблоковано скануванням, відкрийте панель ClawHub або виконайте `clawhub package rescan <name>`, щоб попросити ClawHub перевірити його знову. `--dangerously-force-unsafe-install` впливає лише на встановлення на вашому власному комп'ютері; він не просить ClawHub повторно просканувати плагін і не робить заблокований реліз публічним.

Сумісні пакети беруть участь у тому самому потоці списку/перегляду/увімкнення/вимкнення плагінів. Поточна runtime-підтримка охоплює Skills пакетів, командні Skills Claude, типові значення Claude `settings.json`, типові значення Claude `.lsp.json` і оголошених у маніфесті `lspServers`, командні Skills Cursor, а також сумісні каталоги хуків Codex.

`openclaw plugins inspect <id>` також повідомляє виявлені можливості пакета, а також підтримувані або непідтримувані записи серверів MCP і LSP для плагінів на основі пакетів.

Джерелами marketplace можуть бути відома назва marketplace Claude з `~/.claude/plugins/known_marketplaces.json`, локальний корінь marketplace або шлях `marketplace.json`, GitHub-скорочення на кшталт `owner/repo`, URL репозиторію GitHub або git URL. Для віддалених marketplace записи плагінів мають залишатися всередині клонованого репозиторію marketplace і використовувати лише джерела з відносними шляхами.

Дивіться [довідник CLI `openclaw plugins`](/uk/cli/plugins), щоб отримати повні подробиці.

## Огляд API Plugin

Нативні плагіни експортують об'єкт входу, який надає `register(api)`. Старіші плагіни можуть усе ще використовувати `activate(api)` як застарілий псевдонім, але нові плагіни мають використовувати `register`.

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

OpenClaw завантажує об'єкт входу й викликає `register(api)` під час активації плагіна. Завантажувач усе ще повертається до `activate(api)` для старіших плагінів, але вбудовані плагіни й нові зовнішні плагіни мають розглядати `register` як публічний контракт.

`api.registrationMode` повідомляє плагіну, чому завантажується його вхід:

| Режим           | Значення                                                                                                                               |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Runtime-активація. Реєструйте інструменти, хуки, сервіси, команди, маршрути та інші активні побічні ефекти.                            |
| `discovery`     | Виявлення можливостей лише для читання. Реєструйте провайдерів і метадані; довірений код входу плагіна може завантажуватися, але пропускайте активні побічні ефекти. |
| `setup-only`    | Завантаження метаданих налаштування каналу через легковаговий вхід налаштування.                                                       |
| `setup-runtime` | Завантаження налаштування каналу, якому також потрібен runtime-вхід.                                                                    |
| `cli-metadata`  | Лише збирання метаданих команд CLI.                                                                                                    |

Входи плагінів, які відкривають сокети, бази даних, фонові worker-и або довгоживучі клієнти, мають захищати ці побічні ефекти умовою `api.registrationMode === "full"`. Завантаження виявлення кешуються окремо від активаційних завантажень і не замінюють запущений реєстр Gateway. Виявлення не активує, але не є вільним від імпорту: OpenClaw може виконати довірений вхід плагіна або модуль канального плагіна, щоб побудувати знімок. Тримайте верхні рівні модулів легковаговими й без побічних ефектів, а мережеві клієнти, subprocess-и, слухачі, читання облікових даних і запуск сервісів переміщуйте за шляхи full-runtime.

Поширені методи реєстрації:

| Метод                                   | Що він реєструє                    |
| --------------------------------------- | ---------------------------------- |
| `registerProvider`                      | Провайдер моделі (LLM)             |
| `registerChannel`                       | Канал чату                         |
| `registerTool`                          | Інструмент агента                  |
| `registerHook` / `on(...)`              | Хуки життєвого циклу               |
| `registerSpeechProvider`                | Text-to-speech / STT               |
| `registerRealtimeTranscriptionProvider` | Streaming STT                      |
| `registerRealtimeVoiceProvider`         | Дуплексний голос у реальному часі  |
| `registerMediaUnderstandingProvider`    | Аналіз зображень/аудіо             |
| `registerImageGenerationProvider`       | Генерація зображень                |
| `registerMusicGenerationProvider`       | Генерація музики                   |
| `registerVideoGenerationProvider`       | Генерація відео                    |
| `registerWebFetchProvider`              | Провайдер web fetch / scrape       |
| `registerWebSearchProvider`             | Вебпошук                           |
| `registerHttpRoute`                     | HTTP endpoint                      |
| `registerCommand` / `registerCli`       | Команди CLI                        |
| `registerContextEngine`                 | Рушій контексту                    |
| `registerService`                       | Фоновий сервіс                     |

Поведінка захисту хуків для типізованих хуків життєвого циклу:

- `before_tool_call`: `{ block: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: `{ block: false }` є no-op і не скасовує попереднє блокування.
- `before_install`: `{ block: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `before_install`: `{ block: false }` є no-op і не скасовує попереднє блокування.
- `message_sending`: `{ cancel: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `message_sending`: `{ cancel: false }` є no-op і не скасовує попереднє скасування.

Нативний Codex app-server передає події нативних інструментів Codex назад у цю поверхню хуків через bridge. Плагіни можуть блокувати нативні інструменти Codex через `before_tool_call`, спостерігати результати через `after_tool_call` і брати участь у схваленнях Codex `PermissionRequest`. Bridge поки що не переписує аргументи нативних інструментів Codex. Точна межа runtime-підтримки Codex описана в [контракті підтримки Codex harness v1](/uk/plugins/codex-harness#v1-support-contract).

Повну поведінку типізованих хуків дивіться в [огляді SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов'язане

- [Створення плагінів](/uk/plugins/building-plugins) — створіть власний плагін
- [Пакети плагінів](/uk/plugins/bundles) — сумісність пакетів Codex/Claude/Cursor
- [Маніфест плагіна](/uk/plugins/manifest) — схема маніфеста
- [Реєстрація інструментів](/uk/plugins/building-plugins#registering-agent-tools) — додайте інструменти агента в плагін
- [Внутрішня архітектура плагінів](/uk/plugins/architecture) — модель можливостей і pipeline завантаження
- [Плагіни спільноти](/uk/plugins/community) — списки від сторонніх розробників
