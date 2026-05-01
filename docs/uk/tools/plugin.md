---
read_when:
    - Встановлення або налаштування плагінів
    - Розуміння правил виявлення та завантаження Plugin
    - Робота з пакетами Plugin, сумісними з Codex/Claude
sidebarTitle: Install and Configure
summary: Встановлення, налаштування та керування Plugin OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-05-01T21:40:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0dbb4d0102f3f2060fe13aa5e6ae1b24080a456f223e985ccfa390106e94f4d8
    source_path: tools/plugin.md
    workflow: 16
---

Plugin-и розширюють OpenClaw новими можливостями: каналами, провайдерами моделей,
обв’язками агентів, інструментами, Skills, мовленням, транскрипцією в реальному часі, голосом у реальному часі, розумінням медіа, генерацією зображень, генерацією відео, отриманням вебвмісту, вебпошуком
і не тільки. Деякі Plugin-и є **core** (постачаються з OpenClaw), інші
є **зовнішніми**. Більшість зовнішніх Plugin-ів публікуються й знаходяться через
[ClawHub](/uk/tools/clawhub). Npm і надалі підтримується для прямих встановлень і для
тимчасового набору пакетів Plugin-ів, що належать OpenClaw, доки ця міграція завершується.

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

    Використовуйте `--runtime`, коли потрібно підтвердити зареєстровані інструменти, сервіси, gateway
    методи, хуки або CLI-команди, що належать Plugin-у. Звичайний `inspect` — це холодна
    перевірка маніфесту/реєстру, яка навмисно уникає імпортування runtime Plugin-а.

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
(спочатку ClawHub, потім резервно npm).

Якщо конфігурація недійсна, встановлення зазвичай завершується без змін і спрямовує вас до
`openclaw doctor --fix`. Єдиний виняток відновлення — вузький шлях перевстановлення вбудованого Plugin-а для Plugin-ів, які увімкнули
`openclaw.install.allowInvalidConfigRecovery`.
Під час запуску Gateway недійсна конфігурація одного Plugin-а ізолюється до цього Plugin-а:
запуск журналює проблему `plugins.entries.<id>.config`, пропускає цей Plugin під час
завантаження та залишає інші Plugin-и й канали онлайн. Запустіть `openclaw doctor --fix`,
щоб помістити проблемну конфігурацію Plugin-а в карантин, вимкнувши цей запис Plugin-а й вилучивши
його недійсний конфігураційний payload; звичайна резервна копія конфігурації зберігає попередні значення.
Коли конфігурація каналу посилається на Plugin, який більше не виявляється, але той самий застарілий id Plugin-а залишається в конфігурації Plugin-ів або записах встановлення, запуск Gateway
журналює попередження й пропускає цей канал замість блокування всіх інших каналів.
Запустіть `openclaw doctor --fix`, щоб вилучити застарілі записи каналу/Plugin-а; невідомі
ключі каналів без ознак застарілого Plugin-а й надалі не проходять валідацію, щоб друкарські помилки залишалися
помітними.
Якщо встановлено `plugins.enabled: false`, застарілі посилання на Plugin-и вважаються інертними:
запуск Gateway пропускає виявлення/завантаження Plugin-ів, а `openclaw doctor` зберігає
вимкнену конфігурацію Plugin-ів замість автоматичного вилучення. Знову ввімкніть Plugin-и перед
запуском очищення doctor, якщо хочете вилучити застарілі id Plugin-ів.

Встановлення залежностей Plugin-а відбувається лише під час явних потоків install/update або
doctor repair. Запуск Gateway, перезавантаження конфігурації та runtime-інспекція не
запускають менеджери пакетів і не ремонтують дерева залежностей. Локальні Plugin-и вже повинні
мати встановлені залежності, тоді як npm, git і ClawHub Plugin-и
встановлюються в керовані корені Plugin-ів OpenClaw із локальними для пакета
залежностями. Зовнішні Plugin-и та власні шляхи завантаження все одно потрібно встановлювати
через `openclaw plugins install`.
Див. [Розв’язання залежностей Plugin-а](/uk/plugins/dependency-resolution) щодо
життєвого циклу під час встановлення.

## Типи Plugin-ів

OpenClaw розпізнає два формати Plugin-ів:

| Формат     | Як це працює                                                       | Приклади                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + runtime-модуль; виконується в процесі       | Офіційні Plugin-и, community npm-пакети               |
| **Bundle** | Макет, сумісний із Codex/Claude/Cursor; зіставляється з можливостями OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва відображаються в `openclaw plugins list`. Див. [Plugin Bundles](/uk/plugins/bundles) щодо деталей bundle.

Якщо ви пишете native Plugin, почніть із [Створення Plugin-ів](/uk/plugins/building-plugins)
і [Огляду Plugin SDK](/uk/plugins/sdk-overview).

## Точки входу пакетів

Npm-пакети native Plugin-ів мають оголошувати `openclaw.extensions` у `package.json`.
Кожен запис має залишатися всередині директорії пакета й резолвитися в читабельний
runtime-файл або у TypeScript-файл вихідного коду з виведеним побудованим JavaScript
відповідником, як-от `src/index.ts` до `dist/index.js`.

Використовуйте `openclaw.runtimeExtensions`, коли опубліковані runtime-файли не розташовані за
тими самими шляхами, що й вихідні записи. За наявності `runtimeExtensions` має містити
рівно один запис для кожного запису `extensions`. Невідповідні списки призводять до помилки встановлення та
виявлення Plugin-а замість тихого відкату до шляхів вихідного коду. Якщо ви також
публікуєте `openclaw.setupEntry`, використовуйте `openclaw.runtimeSetupEntry` для його побудованого
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

## Офіційні Plugin-и

### Npm-пакети, що належать OpenClaw, під час міграції

ClawHub є основним шляхом розповсюдження для більшості Plugin-ів. Поточні пакетовані
релізи OpenClaw вже містять багато офіційних Plugin-ів, тож вони не потребують
окремих npm-встановлень у звичайних налаштуваннях. Доки кожен Plugin, що належить OpenClaw, не
мігрував до ClawHub, OpenClaw і надалі постачає деякі пакети Plugin-ів `@openclaw/*` в
npm для старіших/власних встановлень і прямих npm-процесів.

Якщо npm повідомляє, що пакет Plugin-а `@openclaw/*` застарілий, ця версія пакета
походить зі старішої зовнішньої лінійки пакетів. Використовуйте вбудований Plugin із
поточного OpenClaw або локальний checkout, доки новіший npm-пакет не буде опубліковано.

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
  <Accordion title="Провайдери моделей (увімкнено за замовчуванням)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory Plugin-и">
    - `memory-core` — вбудований пошук memory (за замовчуванням через `plugins.slots.memory`)
    - `memory-lancedb` — довготривала memory на базі LanceDB з auto-recall/capture (встановіть `plugins.slots.memory = "memory-lancedb"`)

    Див. [Memory LanceDB](/uk/plugins/memory-lancedb) щодо OpenAI-сумісного
    налаштування embeddings, прикладів Ollama, лімітів recall і усунення несправностей.

  </Accordion>

  <Accordion title="Провайдери мовлення (увімкнено за замовчуванням)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` — вбудований browser Plugin для browser tool, CLI `openclaw browser`, gateway-методу `browser.request`, browser runtime і стандартного сервісу керування браузером (увімкнено за замовчуванням; вимкніть перед заміною)
    - `copilot-proxy` — міст VS Code Copilot Proxy (вимкнено за замовчуванням)

  </Accordion>
</AccordionGroup>

Шукаєте сторонні Plugin-и? Див. [Community Plugins](/uk/plugins/community).

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
| `load.paths`     | Додаткові файли/директорії Plugin-ів                            |
| `slots`          | Ексклюзивні селектори слотів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>` | Перемикачі + конфігурація для окремого Plugin-а                               |

`plugins.allow` є ексклюзивним. Коли він непорожній, завантажуватися або
надавати інструменти можуть лише перелічені Plugin-и, навіть якщо `tools.allow` містить `"*"` або конкретну назву
інструмента, що належить Plugin-у. Якщо allowlist інструментів посилається на інструменти Plugin-ів, додайте id Plugin-ів-власників
до `plugins.allow` або вилучіть `plugins.allow`; `openclaw doctor` попереджає про таку
форму.

Зміни конфігурації **потребують перезапуску gateway**. Якщо Gateway працює з увімкненими config
watch + in-process restart (стандартний шлях `openclaw gateway`), такий
перезапуск зазвичай виконується автоматично за мить після запису конфігурації.
Немає підтримуваного шляху hot-reload для runtime-коду native Plugin-а або lifecycle
hooks; перезапустіть процес Gateway, який обслуговує активний канал, перш ніж
очікувати запуску оновленого коду `register(api)`, хуків `api.on(...)`, інструментів, сервісів або
provider/runtime hooks.

`openclaw plugins list` — це локальний snapshot реєстру/конфігурації Plugin-ів. Plugin зі станом
`enabled` там означає, що збережений реєстр і поточна конфігурація дозволяють
Plugin-у брати участь. Це не доводить, що вже запущений віддалений дочірній процес Gateway
перезапустився з тим самим кодом Plugin-а. У налаштуваннях VPS/контейнерів із
процесами-обгортками надсилайте перезапуски фактичному процесу `openclaw gateway run`
або використовуйте `openclaw gateway restart` для запущеного Gateway.

<Accordion title="Стани Plugin-а: вимкнений, відсутній або недійсний">
  - **Вимкнений**: Plugin існує, але правила ввімкнення вимкнули його. Конфігурація зберігається.
  - **Відсутній**: конфігурація посилається на id Plugin-а, який discovery не знайшов.
  - **Недійсний**: Plugin існує, але його конфігурація не відповідає оголошеній схемі. Запуск Gateway пропускає лише цей Plugin; `openclaw doctor --fix` може помістити недійсний запис у карантин, вимкнувши його й вилучивши його конфігураційний payload.

</Accordion>

## Виявлення та пріоритетність

OpenClaw сканує plugins у такому порядку (перше співпадіння перемагає):

<Steps>
  <Step title="Шляхи конфігурації">
    `plugins.load.paths` — явні шляхи до файлів або директорій. Шляхи, що вказують
    назад на власні упаковані директорії bundled plugin OpenClaw, ігноруються;
    запустіть `openclaw doctor --fix`, щоб видалити ці застарілі псевдоніми.
  </Step>

  <Step title="Workspace plugins">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` і `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Глобальні plugins">
    `~/.openclaw/<plugin-root>/*.ts` і `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Bundled plugins">
    Постачаються з OpenClaw. Багато з них увімкнені за замовчуванням (провайдери моделей, мовлення).
    Інші потребують явного ввімкнення.
  </Step>
</Steps>

Упаковані встановлення та Docker-образи зазвичай розв’язують bundled plugins з
скомпільованого дерева `dist/extensions`. Якщо директорію джерел bundled plugin
змонтовано bind mount поверх відповідного упакованого шляху джерел, наприклад
`/app/extensions/synology-chat`, OpenClaw розглядає цю змонтовану директорію
джерел як bundled source overlay і виявляє її перед упакованим бандлом
`/app/dist/extensions/synology-chat`. Це зберігає працездатність контейнерних
циклів супровідників без перемикання кожного bundled plugin назад на джерела TypeScript.
Установіть `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, щоб примусово
використовувати упаковані dist-бандли, навіть коли наявні source overlay mounts.

### Правила ввімкнення

- `plugins.enabled: false` вимикає всі plugins і пропускає роботу виявлення/завантаження Plugin
- `plugins.deny` завжди має пріоритет над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей Plugin
- Plugins з походженням workspace **вимкнені за замовчуванням** (їх потрібно явно ввімкнути)
- Bundled plugins дотримуються вбудованого набору default-on, якщо його не перевизначено
- Ексклюзивні слоти можуть примусово ввімкнути вибраний Plugin для цього слота
- Деякі bundled opt-in plugins вмикаються автоматично, коли конфігурація називає
  surface, що належить Plugin, як-от посилання на модель провайдера, конфігурацію каналу або runtime harness
- Застаріла конфігурація Plugin зберігається, доки активний `plugins.enabled: false`;
  повторно ввімкніть plugins перед запуском очищення doctor, якщо хочете видалити застарілі id
- Маршрути Codex сімейства OpenAI зберігають окремі межі Plugin:
  `openai-codex/*` належить OpenAI plugin, тоді як bundled Codex
  app-server plugin вибирається через `agentRuntime.id: "codex"` або legacy
  посилання на моделі `codex/*`

## Усунення несправностей runtime hooks

Якщо Plugin з’являється у `plugins list`, але побічні ефекти або hooks
`register(api)` не запускаються в live chat traffic, спочатку перевірте це:

- Запустіть `openclaw gateway status --deep --require-rpc` і підтвердьте, що активні
  URL Gateway, профіль, шлях конфігурації та процес є саме тими, які ви редагуєте.
- Перезапустіть live Gateway після змін встановлення/конфігурації/коду Plugin. У wrapper
  containers PID 1 може бути лише супервізором; перезапустіть або надішліть сигнал дочірньому
  процесу `openclaw gateway run`.
- Використовуйте `openclaw plugins inspect <id> --runtime --json`, щоб підтвердити реєстрації hooks і
  діагностику. Non-bundled conversation hooks, як-от `llm_input`,
  `llm_output`, `before_agent_finalize` і `agent_end`, потребують
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання моделей віддавайте перевагу `before_model_resolve`. Він виконується перед
  розв’язанням моделі для agent turns; `llm_output` запускається лише після того, як спроба моделі
  створить assistant output.
- Для підтвердження фактичної моделі сесії використовуйте `openclaw sessions` або
  поверхні сесії/статусу Gateway, а під час налагодження provider payloads запускайте
  Gateway з `--raw-stream --raw-stream-path <path>`.

### Дублювання власності каналу або інструмента

Симптоми:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Це означає, що більш ніж один увімкнений Plugin намагається володіти тим самим каналом,
потоком налаштування або назвою інструмента. Найпоширеніша причина — зовнішній channel plugin,
встановлений поруч із bundled plugin, який тепер надає той самий channel id.

Кроки налагодження:

- Запустіть `openclaw plugins list --enabled --verbose`, щоб побачити кожен увімкнений Plugin
  і його походження.
- Запустіть `openclaw plugins inspect <id> --runtime --json` для кожного підозрюваного Plugin і
  порівняйте `channels`, `channelConfigs`, `tools` і діагностику.
- Запустіть `openclaw plugins registry --refresh` після встановлення або видалення
  plugin packages, щоб збережені metadata відображали поточне встановлення.
- Перезапустіть Gateway після змін встановлення, registry або конфігурації.

Варіанти виправлення:

- Якщо один Plugin навмисно замінює інший для того самого channel id, бажаний
  Plugin має оголосити `channelConfigs.<channel-id>.preferOver` з
  нижчопріоритетним plugin id. Див. [/plugins/manifest#replacing-another-channel-plugin](/uk/plugins/manifest#replacing-another-channel-plugin).
- Якщо дублювання випадкове, вимкніть одну сторону через
  `plugins.entries.<plugin-id>.enabled: false` або видаліть застаріле встановлення Plugin.
- Якщо ви явно ввімкнули обидва plugins, OpenClaw зберігає цей запит і
  повідомляє про конфлікт. Виберіть одного власника для каналу або перейменуйте інструменти,
  що належать Plugin, щоб runtime surface була однозначною.

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

| Слот            | Що він контролює      | За замовчуванням    |
| --------------- | --------------------- | ------------------- |
| `memory`        | Plugin active memory  | `memory-core`       |
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

Bundled plugins постачаються з OpenClaw. Багато з них увімкнені за замовчуванням (наприклад
bundled model providers, bundled speech providers і bundled browser
plugin). Інші bundled plugins все ще потребують `openclaw plugins enable <id>`.

`--force` перезаписує наявний встановлений Plugin або hook pack на місці. Використовуйте
`openclaw plugins update <id-or-npm-spec>` для регулярних оновлень відстежуваних npm
plugins. Це не підтримується з `--link`, який повторно використовує шлях джерел замість
копіювання поверх керованої цілі встановлення.

Коли `plugins.allow` уже задано, `openclaw plugins install` додає id
встановленого Plugin до цього allowlist перед його ввімкненням. Якщо той самий plugin id
присутній у `plugins.deny`, install видаляє цей застарілий запис deny, щоб
явне встановлення можна було одразу завантажити після перезапуску.

OpenClaw зберігає persistent local plugin registry як cold read model для
інвентаризації Plugin, власності contributions і планування запуску. Потоки install, update,
uninstall, enable і disable оновлюють цей registry після зміни стану Plugin.
Той самий файл `plugins/installs.json` зберігає довговічні install metadata у
top-level `installRecords` і перебудовувані manifest metadata у `plugins`. Якщо
registry відсутній, застарілий або недійсний, `openclaw plugins registry
--refresh` перебудовує його manifest view з install records, config policy і
manifest/package metadata без завантаження runtime modules Plugin.
`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних встановлень. Передавання
npm package spec з dist-tag або точною версією розв’язує package name
назад до відстежуваного запису Plugin і записує новий spec для майбутніх оновлень.
Передавання package name без версії переводить exact pinned install назад на
лінію релізів за замовчуванням registry. Якщо встановлений npm plugin уже відповідає
розв’язаній версії та записаній ідентичності артефакта, OpenClaw пропускає оновлення
без завантаження, перевстановлення або перезапису конфігурації.

`--pin` є лише для npm. Він не підтримується з `--marketplace`, тому що
marketplace installs зберігають metadata джерела marketplace замість npm spec.

`--dangerously-force-unsafe-install` — це аварійне перевизначення для хибних
спрацювань вбудованого dangerous-code scanner. Воно дозволяє встановлення Plugin
і оновлення Plugin продовжуватися попри вбудовані findings рівня `critical`, але все одно
не обходить блокування plugin `before_install` policy або блокування через scan-failure.
Install scans ігнорують типові тестові файли та директорії, як-от `tests/`,
`__tests__/`, `*.test.*` і `*.spec.*`, щоб не блокувати packaged test mocks;
оголошені runtime entrypoints Plugin усе одно скануються, навіть якщо вони використовують одну з
цих назв.

Цей CLI flag застосовується лише до потоків install/update Plugin. Встановлення skill
dependencies через Gateway використовують відповідне override запиту
`dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком
завантаження/встановлення Skills з ClawHub.

Якщо Plugin, який ви опублікували на ClawHub, прихований або заблокований скануванням, відкрийте
dashboard ClawHub або запустіть `clawhub package rescan <name>`, щоб попросити ClawHub перевірити
його знову. `--dangerously-force-unsafe-install` впливає лише на встановлення на вашому власному
комп’ютері; він не просить ClawHub повторно сканувати Plugin або робити заблокований реліз
публічним.

Сумісні бандли беруть участь у тому самому потоці list/inspect/enable/disable для Plugin.
Поточна підтримка runtime включає bundle skills, Claude command-skills,
типові значення Claude `settings.json`, типові значення Claude `.lsp.json` і manifest-declared
`lspServers`, Cursor command-skills і сумісні директорії Codex hooks.

`openclaw plugins inspect <id>` також повідомляє виявлені можливості bundle, а також
підтримувані або непідтримувані записи серверів MCP і LSP для bundle-backed plugins.

Джерелами маркетплейсу можуть бути відома Claude назва маркетплейсу з
`~/.claude/plugins/known_marketplaces.json`, локальний корінь маркетплейсу або
шлях `marketplace.json`, скорочення GitHub на кшталт `owner/repo`, URL репозиторію
GitHub або git URL. Для віддалених маркетплейсів записи плагінів мають залишатися всередині
клонованого репозиторію маркетплейсу й використовувати лише відносні джерела шляхів.

Повні відомості див. у [довідці CLI `openclaw plugins`](/uk/cli/plugins).

## Огляд API Plugin

Нативні плагіни експортують об’єкт входу, який надає `register(api)`. Старіші
плагіни можуть іще використовувати `activate(api)` як застарілий псевдонім, але нові плагіни мають
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

OpenClaw завантажує об’єкт входу й викликає `register(api)` під час активації плагіна.
Завантажувач усе ще повертається до `activate(api)` для старіших плагінів,
але вбудовані плагіни й нові зовнішні плагіни мають розглядати `register` як
публічний контракт.

`api.registrationMode` повідомляє плагіну, чому завантажується його вхід:

| Режим           | Значення                                                                                                                         |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Активація під час виконання. Реєструє інструменти, хуки, служби, команди, маршрути та інші активні побічні ефекти.               |
| `discovery`     | Доступне лише для читання виявлення можливостей. Реєструє провайдерів і метадані; довірений код входу плагіна може завантажуватися, але активні побічні ефекти слід пропускати. |
| `setup-only`    | Завантаження метаданих налаштування каналу через легковаговий вхід налаштування.                                                 |
| `setup-runtime` | Завантаження налаштування каналу, якому також потрібен вхід часу виконання.                                                      |
| `cli-metadata`  | Лише збирання метаданих команд CLI.                                                                                              |

Входи плагінів, які відкривають сокети, бази даних, фонових працівників або довгоживучі
клієнти, мають захищати ці побічні ефекти умовою `api.registrationMode === "full"`.
Завантаження виявлення кешуються окремо від завантажень активації й не замінюють
поточний реєстр Gateway. Виявлення не активує, але й не є вільним від імпортів:
OpenClaw може виконати довірений вхід плагіна або модуль канального плагіна, щоб побудувати
знімок. Тримайте верхні рівні модулів легковаговими й без побічних ефектів, а
мережевих клієнтів, підпроцеси, слухачі, читання облікових даних і запуск служб
переносьте за шляхи повного виконання.

Поширені методи реєстрації:

| Метод                                   | Що він реєструє             |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Провайдер моделі (LLM)      |
| `registerChannel`                       | Канал чату                  |
| `registerTool`                          | Інструмент агента           |
| `registerHook` / `on(...)`              | Хуки життєвого циклу        |
| `registerSpeechProvider`                | Перетворення тексту на мовлення / STT |
| `registerRealtimeTranscriptionProvider` | Потоковий STT               |
| `registerRealtimeVoiceProvider`         | Дуплексний голос у реальному часі |
| `registerMediaUnderstandingProvider`    | Аналіз зображень/аудіо      |
| `registerImageGenerationProvider`       | Генерація зображень         |
| `registerMusicGenerationProvider`       | Генерація музики            |
| `registerVideoGenerationProvider`       | Генерація відео             |
| `registerWebFetchProvider`              | Провайдер вебзавантаження / скрейпінгу |
| `registerWebSearchProvider`             | Вебпошук                    |
| `registerHttpRoute`                     | HTTP endpoint               |
| `registerCommand` / `registerCli`       | Команди CLI                 |
| `registerContextEngine`                 | Рушій контексту             |
| `registerService`                       | Фонова служба               |

Поведінка захисту хуків для типізованих хуків життєвого циклу:

- `before_tool_call`: `{ block: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: `{ block: false }` є no-op і не скасовує попередній блок.
- `before_install`: `{ block: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `before_install`: `{ block: false }` є no-op і не скасовує попередній блок.
- `message_sending`: `{ cancel: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `message_sending`: `{ cancel: false }` є no-op і не скасовує попереднє скасування.

Нативний сервер застосунку Codex передає нативні для Codex події інструментів назад у цю
поверхню хуків. Плагіни можуть блокувати нативні інструменти Codex через `before_tool_call`,
спостерігати результати через `after_tool_call` і брати участь у схваленнях Codex
`PermissionRequest`. Міст поки що не переписує аргументи нативних інструментів Codex.
Точна межа підтримки середовища виконання Codex описана в
[контракті підтримки Codex harness v1](/uk/plugins/codex-harness#v1-support-contract).

Повну поведінку типізованих хуків див. в [огляді SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Створення плагінів](/uk/plugins/building-plugins) — створіть власний плагін
- [Пакети плагінів](/uk/plugins/bundles) — сумісність пакетів Codex/Claude/Cursor
- [Маніфест Plugin](/uk/plugins/manifest) — схема маніфесту
- [Реєстрація інструментів](/uk/plugins/building-plugins#registering-agent-tools) — додайте інструменти агента в плагін
- [Внутрішня архітектура Plugin](/uk/plugins/architecture) — модель можливостей і конвеєр завантаження
- [Плагіни спільноти](/uk/plugins/community) — сторонні каталоги
