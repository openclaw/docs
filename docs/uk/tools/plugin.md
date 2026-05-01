---
read_when:
    - Встановлення або налаштування плагінів
    - Розуміння правил виявлення та завантаження Plugin
    - Робота з пакетами Plugin, сумісними з Codex/Claude
sidebarTitle: Install and Configure
summary: Встановлення, налаштування та керування плагінами OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-05-01T22:18:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 45d4804c55d70000cf471d9d258204ef0028c30d5a731750c37f5d40991b72a0
    source_path: tools/plugin.md
    workflow: 16
---

Plugin-и розширюють OpenClaw новими можливостями: каналами, постачальниками моделей,
обгортками агентів, інструментами, Skills, мовленням, транскрипцією в реальному часі, голосом у реальному часі, розумінням медіа, генерацією зображень, генерацією відео, web fetch, web
search тощо. Деякі Plugin-и є **основними** (постачаються з OpenClaw), інші
є **зовнішніми**. Більшість зовнішніх Plugin-ів публікуються й виявляються через
[ClawHub](/uk/tools/clawhub). Npm лишається підтримуваним для прямих встановлень і для
тимчасового набору пакетів Plugin-ів, що належать OpenClaw, доки ця міграція завершується.

## Швидкий старт

<Steps>
  <Step title="Перегляньте, що завантажено">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Встановіть Plugin">
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

    Потім налаштуйте в `plugins.entries.\<id\>.config` у вашому конфігураційному файлі.

  </Step>

  <Step title="Перевірте Plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Використовуйте `--runtime`, коли потрібно підтвердити зареєстровані інструменти, служби, методи Gateway,
    хуки або CLI-команди, що належать Plugin-у. Звичайний `inspect` є холодною
    перевіркою маніфесту/реєстру й навмисно уникає імпорту runtime Plugin-а.

  </Step>
</Steps>

Якщо ви віддаєте перевагу керуванню, природному для чату, увімкніть `commands.plugins: true` і використовуйте:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Шлях встановлення використовує той самий resolver, що й CLI: локальний шлях/архів, явний
`clawhub:<pkg>`, явний `npm:<pkg>`, явний `git:<repo>` або специфікація пакета
без префікса (спочатку ClawHub, потім fallback до npm).

Якщо конфігурація недійсна, встановлення зазвичай завершується закритою відмовою та спрямовує вас до
`openclaw doctor --fix`. Єдиний виняток для відновлення — вузький шлях
повторного встановлення bundled-plugin для Plugin-ів, які ввімкнули
`openclaw.install.allowInvalidConfigRecovery`.
Під час запуску Gateway недійсна конфігурація одного Plugin-а ізолюється до цього Plugin-а:
запуск записує проблему `plugins.entries.<id>.config` у журнали, пропускає цей Plugin під час
завантаження й залишає інші Plugin-и та канали онлайн. Запустіть `openclaw doctor --fix`,
щоб помістити погану конфігурацію Plugin-а в карантин, вимкнувши цей запис Plugin-а та видаливши
його недійсний конфігураційний payload; звичайна резервна копія конфігурації зберігає попередні значення.
Коли конфігурація каналу посилається на Plugin, який більше не виявляється, але той самий
застарілий id Plugin-а лишається в конфігурації Plugin-а або записах встановлення, запуск Gateway
записує попередження й пропускає цей канал замість блокування всіх інших каналів.
Запустіть `openclaw doctor --fix`, щоб видалити застарілі записи каналу/Plugin-а; невідомі
ключі каналів без доказів застарілого Plugin-а все одно не проходять валідацію, щоб друкарські помилки лишалися
видимими.
Якщо задано `plugins.enabled: false`, застарілі посилання на Plugin-и трактуються як інертні:
запуск Gateway пропускає роботу з виявлення/завантаження Plugin-ів, а `openclaw doctor` зберігає
вимкнену конфігурацію Plugin-а замість автоматичного видалення. Повторно увімкніть Plugin-и перед
запуском очищення doctor, якщо хочете видалити застарілі id Plugin-ів.

Встановлення залежностей Plugin-а відбувається лише під час явного встановлення/оновлення або
потоків ремонту doctor. Запуск Gateway, перезавантаження конфігурації та runtime-інспекція не
запускають пакетні менеджери й не ремонтують дерева залежностей. Локальні Plugin-и вже мають
мати встановлені залежності, тоді як npm-, git- і ClawHub-Plugin-и
встановлюються в керованих OpenClaw коренях Plugin-ів із локальними для пакета
залежностями. Зовнішні Plugin-и та власні шляхи завантаження все одно потрібно встановлювати
через `openclaw plugins install`.
Див. [Розв’язання залежностей Plugin-а](/uk/plugins/dependency-resolution) щодо
життєвого циклу під час встановлення.

## Типи Plugin-ів

OpenClaw розпізнає два формати Plugin-ів:

| Формат     | Як це працює                                                       | Приклади                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + runtime-модуль; виконується в процесі       | Офіційні Plugin-и, npm-пакети спільноти               |
| **Bundle** | Сумісна з Codex/Claude/Cursor структура; відображається на функції OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва відображаються в `openclaw plugins list`. Див. [Комплекти Plugin-ів](/uk/plugins/bundles) для подробиць про bundle.

Якщо ви пишете native Plugin, почніть зі [Створення Plugin-ів](/uk/plugins/building-plugins)
і [Огляду Plugin SDK](/uk/plugins/sdk-overview).

## Точки входу пакета

Npm-пакети native Plugin-ів мають оголошувати `openclaw.extensions` у `package.json`.
Кожен запис має лишатися всередині каталогу пакета й розв’язуватися в читабельний
runtime-файл або у вихідний TypeScript-файл з інферованим зібраним JavaScript
peer, наприклад `src/index.ts` до `dist/index.js`.

Використовуйте `openclaw.runtimeExtensions`, коли опубліковані runtime-файли не розташовані за
тими самими шляхами, що й вихідні записи. Якщо присутній, `runtimeExtensions` має містити
рівно один запис для кожного запису `extensions`. Невідповідні списки спричиняють помилку встановлення та
виявлення Plugin-а замість мовчазного fallback до шляхів джерел. Якщо ви також
публікуєте `openclaw.setupEntry`, використовуйте `openclaw.runtimeSetupEntry` для його зібраного
JavaScript peer; цей файл є обов’язковим, коли оголошений.

```json
{
  "name": "@acme/openclaw-plugin",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"]
  }
}
```

## Офіційні Plugin-и

### Npm-пакети, що належать OpenClaw, під час міграції

ClawHub є основним шляхом розповсюдження для більшості Plugin-ів. Поточні пакетовані
релізи OpenClaw уже містять багато офіційних Plugin-ів, тож вони не потребують
окремих npm-встановлень у звичайних налаштуваннях. Доки кожен Plugin, що належить OpenClaw, не
мігрував до ClawHub, OpenClaw все ще постачає деякі пакети Plugin-ів `@openclaw/*` на
npm для старіших/власних встановлень і прямих npm-процесів.

Якщо npm повідомляє, що пакет Plugin-а `@openclaw/*` є deprecated, ця версія пакета
походить зі старішої зовнішньої лінійки пакетів. Використовуйте bundled Plugin з
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

  <Accordion title="Plugin-и пам’яті">
    - `memory-core` — bundled пошук пам’яті (за замовчуванням через `plugins.slots.memory`)
    - `memory-lancedb` — довгострокова пам’ять на базі LanceDB з автоматичним recall/capture (задайте `plugins.slots.memory = "memory-lancedb"`)

    Див. [Memory LanceDB](/uk/plugins/memory-lancedb) щодо OpenAI-сумісного
    налаштування embedding, прикладів Ollama, лімітів recall і усунення несправностей.

  </Accordion>

  <Accordion title="Постачальники мовлення (увімкнені за замовчуванням)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` — bundled Plugin браузера для інструмента браузера, CLI `openclaw browser`, методу Gateway `browser.request`, browser runtime і стандартної служби керування браузером (увімкнено за замовчуванням; вимкніть перед заміною)
    - `copilot-proxy` — міст VS Code Copilot Proxy (вимкнено за замовчуванням)

  </Accordion>
</AccordionGroup>

Шукаєте сторонні Plugin-и? Див. [Plugin-и спільноти](/uk/plugins/community).

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
| `allow`          | Allowlist Plugin-ів (необов’язково)                               |
| `deny`           | Denylist Plugin-ів (необов’язково; deny має пріоритет)                     |
| `load.paths`     | Додаткові файли/каталоги Plugin-ів                            |
| `slots`          | Ексклюзивні селектори слотів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>` | Перемикачі + конфігурація для окремого Plugin-а                               |

`plugins.allow` є ексклюзивним. Коли він непорожній, завантажуватися або
експонувати інструменти можуть лише перелічені Plugin-и, навіть якщо `tools.allow` містить `"*"` або конкретну назву
інструмента, що належить Plugin-у. Якщо allowlist інструментів посилається на інструменти Plugin-а, додайте id Plugin-ів-власників
до `plugins.allow` або видаліть `plugins.allow`; `openclaw doctor` попереджає про таку
форму.

Зміни конфігурації **потребують перезапуску Gateway**. Якщо Gateway запущено з config
watch + in-process restart увімкненими (стандартний шлях `openclaw gateway`), цей
перезапуск зазвичай виконується автоматично через мить після запису конфігурації.
Підтримуваного шляху hot-reload для runtime-коду native Plugin-а або lifecycle
хуків немає; перезапустіть процес Gateway, який обслуговує живий канал, перш ніж
очікувати виконання оновленого коду `register(api)`, хуків `api.on(...)`, інструментів, служб або
provider/runtime хуків.

`openclaw plugins list` — це локальний знімок реєстру/конфігурації Plugin-ів. Plugin зі статусом
`enabled` там означає, що збережений реєстр і поточна конфігурація дозволяють
Plugin-у брати участь. Це не доводить, що вже запущений віддалений дочірній процес Gateway
перезапустився з тим самим кодом Plugin-а. У налаштуваннях VPS/контейнерів з
wrapper-процесами надсилайте перезапуски фактичному процесу `openclaw gateway run`,
або використовуйте `openclaw gateway restart` проти запущеного Gateway.

<Accordion title="Стани Plugin-а: вимкнений, відсутній, недійсний">
  - **Вимкнений**: Plugin існує, але правила ввімкнення вимкнули його. Конфігурація зберігається.
  - **Відсутній**: конфігурація посилається на id Plugin-а, який виявлення не знайшло.
  - **Недійсний**: Plugin існує, але його конфігурація не відповідає оголошеній схемі. Запуск Gateway пропускає лише цей Plugin; `openclaw doctor --fix` може помістити недійсний запис у карантин, вимкнувши його та видаливши його конфігураційний payload.

</Accordion>

## Виявлення та пріоритет

OpenClaw сканує plugins у такому порядку (перша відповідність перемагає):

<Steps>
  <Step title="Шляхи конфігурації">
    `plugins.load.paths` — явні шляхи до файлів або каталогів. Шляхи, що вказують
    назад на власні упаковані каталоги bundled plugin OpenClaw, ігноруються;
    запустіть `openclaw doctor --fix`, щоб видалити ці застарілі псевдоніми.
  </Step>

  <Step title="Plugins робочого простору">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` і `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Глобальні plugins">
    `~/.openclaw/<plugin-root>/*.ts` і `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Bundled plugins">
    Постачаються з OpenClaw. Багато з них увімкнено за замовчуванням (провайдери моделей, мовлення).
    Інші потребують явного ввімкнення.
  </Step>
</Steps>

Упаковані встановлення та Docker-образи зазвичай розв’язують bundled plugins із
скомпільованого дерева `dist/extensions`. Якщо каталог вихідного коду bundled plugin
підмонтовано поверх відповідного упакованого шляху до вихідного коду, наприклад
`/app/extensions/synology-chat`, OpenClaw розглядає цей змонтований каталог вихідного коду
як накладення bundled source і виявляє його перед упакованим bundle
`/app/dist/extensions/synology-chat`. Це зберігає працездатність контейнерних
циклів мейнтейнерів без перемикання кожного bundled plugin назад на вихідний код TypeScript.
Установіть `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, щоб примусово використовувати упаковані dist bundles
навіть за наявності змонтованих накладень вихідного коду.

### Правила ввімкнення

- `plugins.enabled: false` вимикає всі plugins і пропускає роботу з виявлення/завантаження plugins
- `plugins.deny` завжди має пріоритет над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей plugin
- Plugins із робочого простору **вимкнені за замовчуванням** (їх потрібно явно ввімкнути)
- Bundled plugins дотримуються вбудованого набору ввімкнених за замовчуванням, якщо це не перевизначено
- Ексклюзивні слоти можуть примусово ввімкнути вибраний plugin для цього слота
- Деякі bundled opt-in plugins вмикаються автоматично, коли конфігурація називає
  поверхню, що належить plugin, наприклад посилання на модель провайдера, конфігурацію каналу або runtime
  harness
- Застаріла конфігурація plugin зберігається, доки активний `plugins.enabled: false`;
  знову ввімкніть plugins перед запуском очищення doctor, якщо хочете видалити застарілі ids
- Маршрути Codex сімейства OpenAI зберігають окремі межі plugin:
  `openai-codex/*` належить OpenAI plugin, тоді як bundled Codex
  app-server plugin вибирається через `agentRuntime.id: "codex"` або застарілі
  посилання на моделі `codex/*`

## Усунення несправностей runtime hooks

Якщо plugin з’являється в `plugins list`, але побічні ефекти або hooks
`register(api)` не виконуються в живому чат-трафіку, спершу перевірте таке:

- Запустіть `openclaw gateway status --deep --require-rpc` і підтвердьте, що активні
  URL Gateway, профіль, шлях конфігурації та процес є саме тими, які ви редагуєте.
- Перезапустіть живий Gateway після змін встановлення/config/code plugin. У wrapper
  containers PID 1 може бути лише supervisor; перезапустіть або надішліть сигнал дочірньому
  процесу `openclaw gateway run`.
- Використайте `openclaw plugins inspect <id> --runtime --json`, щоб підтвердити реєстрації hooks і
  діагностику. Небандловані conversation hooks, як-от `llm_input`,
  `llm_output`, `before_agent_finalize` і `agent_end`, потребують
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання моделей віддавайте перевагу `before_model_resolve`. Він виконується перед розв’язанням моделі
  для ходів агента; `llm_output` виконується лише після того, як спроба моделі
  створює вивід асистента.
- Для підтвердження ефективної моделі сесії використовуйте `openclaw sessions` або
  поверхні сесії/статусу Gateway, а під час налагодження payloads провайдера запускайте
  Gateway з `--raw-stream --raw-stream-path <path>`.

### Повільне налаштування інструментів plugin

Якщо ходи агента наче зависають під час підготовки інструментів, увімкніть trace logging і
перевірте рядки часу виконання factory інструментів plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Шукайте:

```text
[trace:plugin-tools] factory timings ...
```

Зведення перелічує загальний час factory і найповільніші factory інструментів plugin,
зокрема plugin id, оголошені назви інструментів, форму результату та чи є інструмент
необов’язковим. Повільні рядки підвищуються до попереджень, коли одна factory триває
щонайменше 1 с або загальна підготовка factory інструментів plugin триває щонайменше 5 с.

Якщо один plugin домінує в часі виконання, перевірте його runtime registrations:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Потім оновіть, перевстановіть або вимкніть цей plugin. Автори Plugin повинні переносити
дороге завантаження залежностей за шлях виконання інструмента, а не виконувати його
всередині tool factory.

### Дублювання власності каналу або інструмента

Симптоми:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Це означає, що більше ніж один увімкнений plugin намагається володіти тим самим каналом,
потоком налаштування або назвою інструмента. Найпоширеніша причина — зовнішній channel plugin,
встановлений поруч із bundled plugin, який тепер надає той самий channel id.

Кроки налагодження:

- Запустіть `openclaw plugins list --enabled --verbose`, щоб побачити кожен увімкнений plugin
  і його походження.
- Запустіть `openclaw plugins inspect <id> --runtime --json` для кожного підозрюваного plugin і
  порівняйте `channels`, `channelConfigs`, `tools` і diagnostics.
- Запустіть `openclaw plugins registry --refresh` після встановлення або видалення
  plugin packages, щоб збережені metadata відображали поточне встановлення.
- Перезапустіть Gateway після змін install, registry або config.

Варіанти виправлення:

- Якщо один plugin навмисно замінює інший для того самого channel id, бажаний
  plugin має оголосити `channelConfigs.<channel-id>.preferOver` з id plugin нижчого пріоритету.
  Див. [/plugins/manifest#replacing-another-channel-plugin](/uk/plugins/manifest#replacing-another-channel-plugin).
- Якщо дублювання випадкове, вимкніть одну сторону через
  `plugins.entries.<plugin-id>.enabled: false` або видаліть застаріле встановлення plugin.
- Якщо ви явно ввімкнули обидва plugins, OpenClaw зберігає цей запит і
  повідомляє про конфлікт. Виберіть одного власника для каналу або перейменуйте інструменти,
  що належать plugin, щоб runtime surface була однозначною.

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

| Слот            | Що він контролює      | Значення за замовчуванням |
| --------------- | --------------------- | ------------------- |
| `memory`        | Plugin активної пам’яті  | `memory-core`       |
| `contextEngine` | Активний context engine | `legacy` (вбудований) |

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

Bundled plugins постачаються з OpenClaw. Багато з них увімкнено за замовчуванням (наприклад
bundled model providers, bundled speech providers і bundled browser
plugin). Інші bundled plugins все ще потребують `openclaw plugins enable <id>`.

`--force` перезаписує наявний встановлений plugin або hook pack на місці. Використовуйте
`openclaw plugins update <id-or-npm-spec>` для звичайних оновлень відстежуваних npm
plugins. Це не підтримується з `--link`, який повторно використовує шлях вихідного коду замість
копіювання поверх керованої цілі встановлення.

Коли `plugins.allow` уже встановлено, `openclaw plugins install` додає
id встановленого plugin до цього allowlist перед його ввімкненням. Якщо той самий plugin id
присутній у `plugins.deny`, install видаляє цей застарілий запис deny, щоб
явне встановлення можна було завантажити одразу після перезапуску.

OpenClaw зберігає локальний реєстр plugin як модель холодного читання для
інвентаризації plugins, власності внесків і планування запуску. Потоки install, update,
uninstall, enable і disable оновлюють цей registry після зміни стану plugin.
Той самий файл `plugins/installs.json` зберігає довговічні install metadata у
верхньорівневому `installRecords` і відновлювані manifest metadata у `plugins`. Якщо
registry відсутній, застарілий або недійсний, `openclaw plugins registry
--refresh` перебудовує його manifest view із install records, config policy і
manifest/package metadata без завантаження runtime modules plugin.
`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних install. Передавання
npm package spec з dist-tag або exact version розв’язує назву пакета
назад до відстежуваного запису plugin і записує новий spec для майбутніх updates.
Передавання назви пакета без версії повертає точне pinned install назад до
типової release line registry. Якщо встановлений npm plugin уже відповідає
розв’язаній версії та записаній artifact identity, OpenClaw пропускає update
без завантаження, перевстановлення або перезапису config.

`--pin` працює лише для npm. Він не підтримується з `--marketplace`, тому що
marketplace installs зберігають metadata джерела marketplace замість npm spec.

`--dangerously-force-unsafe-install` — це аварійне перевизначення для хибних
спрацьовувань вбудованого dangerous-code scanner. Воно дозволяє plugin installs
і plugin updates продовжуватися після вбудованих findings рівня `critical`, але все одно
не обходить блокування політики `before_install` plugin або блокування через scan failure.
Install scans ігнорують поширені тестові файли й каталоги, як-от `tests/`,
`__tests__/`, `*.test.*` і `*.spec.*`, щоб не блокувати упаковані test mocks;
оголошені runtime entrypoints plugin усе одно скануються, навіть якщо вони використовують одну з
цих назв.

Цей CLI flag застосовується лише до потоків install/update plugin. Встановлення залежностей Skills
на базі Gateway натомість використовують відповідний override запиту
`dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком
завантаження/встановлення ClawHub skill.

Якщо Plugin, який ви опублікували на ClawHub, приховано або заблоковано скануванням, відкрийте
панель ClawHub або запустіть `clawhub package rescan <name>`, щоб попросити ClawHub перевірити
його знову. `--dangerously-force-unsafe-install` впливає лише на встановлення на вашому власному
комп’ютері; він не просить ClawHub повторно просканувати Plugin і не робить заблокований випуск
публічним.

Сумісні пакети беруть участь у тому самому потоці перегляду списку/інспектування/увімкнення/вимкнення
Plugins. Поточна підтримка середовища виконання охоплює пакетні Skills, command-skills Claude,
типові значення Claude `settings.json`, типові значення Claude `.lsp.json` і оголошені в маніфесті
`lspServers`, command-skills Cursor, а також сумісні каталоги хуків Codex.

`openclaw plugins inspect <id>` також повідомляє виявлені можливості пакета, а також
підтримувані або непідтримувані записи серверів MCP і LSP для Plugins на основі пакетів.

Джерелами маркетплейсу можуть бути відома назва маркетплейсу Claude з
`~/.claude/plugins/known_marketplaces.json`, локальний корінь маркетплейсу або шлях
`marketplace.json`, скорочення GitHub на кшталт `owner/repo`, URL репозиторію GitHub
або git URL. Для віддалених маркетплейсів записи Plugins мають залишатися всередині
клонованого репозиторію маркетплейсу й використовувати лише джерела з відносними шляхами.

Докладні відомості див. у [довіднику CLI `openclaw plugins`](/uk/cli/plugins).

## Огляд API Plugin

Нативні Plugins експортують об’єкт входу, який надає `register(api)`. Старіші
Plugins усе ще можуть використовувати `activate(api)` як застарілий псевдонім, але нові Plugins мають
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
Завантажувач усе ще повертається до `activate(api)` для старіших Plugins,
але вбудовані Plugins і нові зовнішні Plugins мають розглядати `register` як
публічний контракт.

`api.registrationMode` повідомляє Plugin, чому завантажується його вхід:

| Режим           | Значення                                                                                                                         |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Активація середовища виконання. Реєструє інструменти, хуки, сервіси, команди, маршрути та інші активні побічні ефекти.          |
| `discovery`     | Виявлення можливостей лише для читання. Реєструє провайдерів і метадані; довірений код входу Plugin може завантажуватися, але має пропускати активні побічні ефекти. |
| `setup-only`    | Завантаження метаданих налаштування каналу через полегшений вхід налаштування.                                                   |
| `setup-runtime` | Завантаження налаштування каналу, якому також потрібен вхід середовища виконання.                                                |
| `cli-metadata`  | Лише збирання метаданих команд CLI.                                                                                              |

Записи Plugins, які відкривають сокети, бази даних, фонові воркери або довготривалих
клієнтів, мають захищати ці побічні ефекти умовою `api.registrationMode === "full"`.
Завантаження виявлення кешуються окремо від завантажень активації й не замінюють
поточний реєстр Gateway. Виявлення не активує, але не є вільним від імпорту:
OpenClaw може виконувати довірений вхід Plugin або модуль Plugin каналу, щоб побудувати
знімок. Тримайте верхні рівні модулів легкими й без побічних ефектів, а мережеві
клієнти, підпроцеси, слухачі, читання облікових даних і запуск сервісів перемістіть
за шляхи повного середовища виконання.

Поширені методи реєстрації:

| Метод                                   | Що він реєструє                         |
| --------------------------------------- | --------------------------------------- |
| `registerProvider`                      | Провайдер моделі (LLM)                  |
| `registerChannel`                       | Канал чату                              |
| `registerTool`                          | Інструмент агента                       |
| `registerHook` / `on(...)`              | Хуки життєвого циклу                    |
| `registerSpeechProvider`                | Перетворення тексту на мовлення / STT   |
| `registerRealtimeTranscriptionProvider` | Потокове STT                            |
| `registerRealtimeVoiceProvider`         | Дуплексний голос у реальному часі       |
| `registerMediaUnderstandingProvider`    | Аналіз зображень/аудіо                  |
| `registerImageGenerationProvider`       | Генерація зображень                     |
| `registerMusicGenerationProvider`       | Генерація музики                        |
| `registerVideoGenerationProvider`       | Генерація відео                         |
| `registerWebFetchProvider`              | Провайдер веботримання / скрейпінгу     |
| `registerWebSearchProvider`             | Вебпошук                                |
| `registerHttpRoute`                     | Кінцева точка HTTP                      |
| `registerCommand` / `registerCli`       | Команди CLI                             |
| `registerContextEngine`                 | Рушій контексту                         |
| `registerService`                       | Фоновий сервіс                          |

Поведінка захисту хуків для типізованих хуків життєвого циклу:

- `before_tool_call`: `{ block: true }` є завершальним; обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: `{ block: false }` не виконує жодної дії й не скасовує попереднє блокування.
- `before_install`: `{ block: true }` є завершальним; обробники з нижчим пріоритетом пропускаються.
- `before_install`: `{ block: false }` не виконує жодної дії й не скасовує попереднє блокування.
- `message_sending`: `{ cancel: true }` є завершальним; обробники з нижчим пріоритетом пропускаються.
- `message_sending`: `{ cancel: false }` не виконує жодної дії й не скасовує попереднє скасування.

Нативний сервер застосунку Codex передає нативні події інструментів Codex назад у цю
поверхню хуків. Plugins можуть блокувати нативні інструменти Codex через `before_tool_call`,
спостерігати результати через `after_tool_call` і брати участь у схваленнях Codex
`PermissionRequest`. Міст поки що не переписує аргументи нативних інструментів Codex.
Точна межа підтримки середовища виконання Codex описана в
[контракті підтримки v1 середовища Codex](/uk/plugins/codex-harness#v1-support-contract).

Повну поведінку типізованих хуків див. в [огляді SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Створення Plugins](/uk/plugins/building-plugins) — створіть власний Plugin
- [Пакети Plugins](/uk/plugins/bundles) — сумісність пакетів Codex/Claude/Cursor
- [Маніфест Plugin](/uk/plugins/manifest) — схема маніфесту
- [Реєстрація інструментів](/uk/plugins/building-plugins#registering-agent-tools) — додайте інструменти агента в Plugin
- [Внутрішня архітектура Plugins](/uk/plugins/architecture) — модель можливостей і конвеєр завантаження
- [Спільнотні Plugins](/uk/plugins/community) — списки сторонніх Plugins
