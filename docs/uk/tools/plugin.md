---
read_when:
    - Встановлення або налаштування плагінів
    - Розуміння правил виявлення й завантаження Plugin
    - Робота з пакетами Plugin, сумісними з Codex/Claude
sidebarTitle: Install and Configure
summary: Встановлення, налаштування та керування плагінами OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-05-01T21:00:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 32e89479c899f05756ba2853728ff9428e1b0ef866d336bba721a962f5546a8b
    source_path: tools/plugin.md
    workflow: 16
---

Plugin розширюють OpenClaw новими можливостями: канали, постачальники моделей,
оболонки агентів, інструменти, Skills, мовлення, транскрипція в реальному часі,
голос у реальному часі, розуміння медіа, генерація зображень, генерація відео,
отримання вебданих, вебпошук тощо. Деякі Plugin є **основними** (постачаються з OpenClaw), інші
є **зовнішніми**. Більшість зовнішніх Plugin публікуються та знаходяться через
[ClawHub](/uk/tools/clawhub). Npm залишається підтримуваним для прямих встановлень і для
тимчасового набору пакетів Plugin, що належать OpenClaw, доки ця міграція завершується.

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

    Використовуйте `--runtime`, коли потрібно підтвердити зареєстровані інструменти, служби, gateway
    методи, хуки або CLI-команди, що належать Plugin. Звичайний `inspect` є холодною
    перевіркою маніфесту/реєстру й навмисно не імпортує runtime Plugin.

  </Step>
</Steps>

Якщо ви віддаєте перевагу керуванню безпосередньо з чату, увімкніть `commands.plugins: true` і використовуйте:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Шлях встановлення використовує той самий розв’язувач, що й CLI: локальний шлях/архів, явний
`clawhub:<pkg>`, явний `npm:<pkg>`, явний `git:<repo>` або проста специфікація пакета
(спочатку ClawHub, потім запасний варіант npm).

Якщо конфігурація недійсна, встановлення зазвичай безпечно завершується помилкою і скеровує вас до
`openclaw doctor --fix`. Єдиний виняток для відновлення — вузький шлях
перевстановлення вбудованих Plugin для Plugin, які погоджуються на
`openclaw.install.allowInvalidConfigRecovery`.
Під час запуску Gateway недійсна конфігурація одного Plugin ізолюється до цього Plugin:
запуск записує в журнали проблему `plugins.entries.<id>.config`, пропускає цей Plugin під час
завантаження й залишає інші Plugin та канали онлайн. Запустіть `openclaw doctor --fix`,
щоб помістити погану конфігурацію Plugin у карантин, вимкнувши цей запис Plugin і видаливши
його недійсне конфігураційне навантаження; звичайна резервна копія конфігурації зберігає попередні значення.
Коли конфігурація каналу посилається на Plugin, який більше не вдається знайти, але той самий
застарілий ідентифікатор Plugin залишається в конфігурації Plugin або записах встановлення, запуск Gateway
записує попередження в журнали й пропускає цей канал замість блокування всіх інших каналів.
Запустіть `openclaw doctor --fix`, щоб видалити застарілі записи каналу/Plugin; невідомі
ключі каналів без доказів застарілого Plugin все одно не проходять валідацію, щоб помилки введення залишалися
видимими.
Якщо встановлено `plugins.enabled: false`, застарілі посилання на Plugin вважаються інертними:
запуск Gateway пропускає роботу з виявлення/завантаження Plugin, а `openclaw doctor` зберігає
вимкнену конфігурацію Plugin замість автоматичного видалення. Повторно увімкніть Plugin перед
запуском очищення doctor, якщо хочете видалити застарілі ідентифікатори Plugin.

Встановлення залежностей Plugin відбувається лише під час явних потоків встановлення/оновлення або
відновлення doctor. Запуск Gateway, перезавантаження конфігурації та runtime-інспекція не
запускають менеджери пакетів і не відновлюють дерева залежностей. Локальні Plugin уже повинні
мати встановлені залежності, тоді як npm, git і ClawHub Plugin
встановлюються під керованими коренями Plugin OpenClaw із локальними для пакета
залежностями. Зовнішні Plugin і користувацькі шляхи завантаження все одно мають встановлюватися
через `openclaw plugins install`.
Див. [Розв’язання залежностей Plugin](/uk/plugins/dependency-resolution) для життєвого циклу
під час встановлення.

## Типи Plugin

OpenClaw розпізнає два формати Plugin:

| Формат     | Як це працює                                                       | Приклади                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Нативний** | `openclaw.plugin.json` + runtime-модуль; виконується в процесі       | Офіційні Plugin, пакети npm спільноти               |
| **Bundle** | Сумісна з Codex/Claude/Cursor структура; зіставляється з можливостями OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва з’являються в `openclaw plugins list`. Див. [Пакети Plugin](/uk/plugins/bundles) для деталей пакетів.

Якщо ви пишете нативний Plugin, почніть із [Створення Plugin](/uk/plugins/building-plugins)
і [Огляд Plugin SDK](/uk/plugins/sdk-overview).

## Точки входу пакета

Пакети npm нативних Plugin мають оголошувати `openclaw.extensions` у `package.json`.
Кожен запис має залишатися всередині каталогу пакета й розв’язуватися в читабельний
runtime-файл або в початковий файл TypeScript з виведеним зібраним JavaScript
парним файлом, наприклад `src/index.ts` до `dist/index.js`.

Використовуйте `openclaw.runtimeExtensions`, коли опубліковані runtime-файли не розташовані за
тими самими шляхами, що й початкові записи. Коли `runtimeExtensions` присутній, він має містити
рівно один запис для кожного запису `extensions`. Невідповідні списки спричиняють помилку встановлення та
виявлення Plugin замість тихого повернення до початкових шляхів.

```json
{
  "name": "@acme/openclaw-plugin",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"]
  }
}
```

## Офіційні Plugin

### Npm-пакети, що належать OpenClaw, під час міграції

ClawHub є основним шляхом розповсюдження для більшості Plugin. Поточні упаковані
релізи OpenClaw уже містять багато офіційних Plugin, тож у звичайних налаштуваннях для них не потрібні
окремі npm-встановлення. Доки кожен Plugin, що належить OpenClaw, не
мігрує до ClawHub, OpenClaw все ще постачає деякі пакети Plugin `@openclaw/*` в
npm для старіших/користувацьких встановлень і прямих npm-процесів.

Якщо npm повідомляє, що пакет Plugin `@openclaw/*` є застарілим, ця версія пакета
походить зі старішої лінійки зовнішніх пакетів. Використовуйте вбудований Plugin із
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

  <Accordion title="Plugin пам’яті">
    - `memory-core` — вбудований пошук у пам’яті (за замовчуванням через `plugins.slots.memory`)
    - `memory-lancedb` — довготривала пам’ять на базі LanceDB з автоматичним пригадуванням/захопленням (встановіть `plugins.slots.memory = "memory-lancedb"`)

    Див. [Memory LanceDB](/uk/plugins/memory-lancedb) для налаштування
    OpenAI-сумісних embeddings, прикладів Ollama, обмежень пригадування та усунення несправностей.

  </Accordion>

  <Accordion title="Постачальники мовлення (увімкнені за замовчуванням)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` — вбудований Plugin браузера для browser tool, CLI `openclaw browser`, gateway-методу `browser.request`, runtime браузера та служби керування браузером за замовчуванням (увімкнено за замовчуванням; вимкніть перед заміною)
    - `copilot-proxy` — міст VS Code Copilot Proxy (вимкнено за замовчуванням)

  </Accordion>
</AccordionGroup>

Шукаєте сторонні Plugin? Див. [Plugin спільноти](/uk/plugins/community).

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
| `allow`          | Allowlist Plugin (необов’язково)                               |
| `deny`           | Denylist Plugin (необов’язково; deny має перевагу)                     |
| `load.paths`     | Додаткові файли/каталоги Plugin                            |
| `slots`          | Ексклюзивні селектори слотів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>` | Перемикачі + конфігурація для окремих Plugin                               |

`plugins.allow` є ексклюзивним. Коли він непорожній, завантажуватися або
відкривати інструменти можуть лише перелічені Plugin, навіть якщо `tools.allow` містить `"*"` або конкретну назву
інструмента, що належить Plugin. Якщо allowlist інструментів посилається на інструменти Plugin, додайте ідентифікатори Plugin-власників
до `plugins.allow` або видаліть `plugins.allow`; `openclaw doctor` попереджає про таку
форму.

Зміни конфігурації **потребують перезапуску gateway**. Якщо Gateway працює з увімкненими
спостереженням за конфігурацією та перезапуском у процесі (стандартний шлях `openclaw gateway`), цей
перезапуск зазвичай виконується автоматично невдовзі після запису конфігурації.
Підтримуваного шляху гарячого перезавантаження для runtime-коду нативного Plugin або lifecycle
хуків немає; перезапустіть процес Gateway, який обслуговує живий канал, перш ніж
очікувати виконання оновленого коду `register(api)`, хуків `api.on(...)`, інструментів, служб або
provider/runtime хуків.

`openclaw plugins list` — це локальний знімок реєстру/конфігурації Plugin. Позначений там як
`enabled` Plugin означає, що збережений реєстр і поточна конфігурація дозволяють
Plugin брати участь. Це не доводить, що вже запущений віддалений дочірній процес Gateway
перезапустився з тим самим кодом Plugin. У VPS/container налаштуваннях з
процесами-обгортками надсилайте перезапуски фактичному процесу `openclaw gateway run`
або використовуйте `openclaw gateway restart` для запущеного Gateway.

<Accordion title="Стани Plugin: вимкнений, відсутній, недійсний">
  - **Вимкнений**: Plugin існує, але правила ввімкнення його вимкнули. Конфігурація зберігається.
  - **Відсутній**: конфігурація посилається на ідентифікатор Plugin, який виявлення не знайшло.
  - **Недійсний**: Plugin існує, але його конфігурація не відповідає оголошеній схемі. Запуск Gateway пропускає лише цей Plugin; `openclaw doctor --fix` може помістити недійсний запис у карантин, вимкнувши його та видаливши його конфігураційне навантаження.

</Accordion>

## Виявлення та пріоритетність

OpenClaw сканує Plugin у такому порядку (перша відповідність перемагає):

<Steps>
  <Step title="Шляхи конфігурації">
    `plugins.load.paths` — явні шляхи до файлів або каталогів. Шляхи, що вказують
    назад на власні каталоги пакетних вбудованих Plugin OpenClaw, ігноруються;
    виконайте `openclaw doctor --fix`, щоб видалити ці застарілі псевдоніми.
  </Step>

  <Step title="Plugin робочого простору">
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

Пакетні встановлення та образи Docker зазвичай знаходять вбудовані Plugin у
скомпільованому дереві `dist/extensions`. Якщо вихідний каталог вбудованого Plugin
змонтовано поверх відповідного пакетного шляху до вихідного коду, наприклад
`/app/extensions/synology-chat`, OpenClaw розглядає цей змонтований вихідний каталог
як накладання вбудованого вихідного коду й виявляє його перед пакетним бандлом
`/app/dist/extensions/synology-chat`. Це зберігає працездатність контейнерних
циклів супровідників без перемикання кожного вбудованого Plugin назад на вихідний код TypeScript.
Установіть `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, щоб примусово використовувати пакетні dist-бандли
навіть за наявності монтувань накладання вихідного коду.

### Правила ввімкнення

- `plugins.enabled: false` вимикає всі Plugin і пропускає роботу з виявлення/завантаження Plugin
- `plugins.deny` завжди має пріоритет над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей Plugin
- Plugin, що походять із робочого простору, **вимкнені за замовчуванням** (їх потрібно явно ввімкнути)
- Вбудовані Plugin дотримуються вбудованого набору ввімкнених за замовчуванням, якщо це не перевизначено
- Ексклюзивні слоти можуть примусово ввімкнути вибраний Plugin для цього слота
- Деякі вбудовані Plugin з явним підключенням автоматично вмикаються, коли конфігурація називає
  поверхню, що належить Plugin, як-от посилання на модель провайдера, конфігурацію каналу або runtime
  тестового середовища
- Застаріла конфігурація Plugin зберігається, поки активне `plugins.enabled: false`;
  повторно ввімкніть Plugin перед запуском очищення doctor, якщо хочете видалити застарілі ids
- Маршрути Codex сімейства OpenAI зберігають окремі межі Plugin:
  `openai-codex/*` належить OpenAI Plugin, тоді як вбудований Plugin app-server Codex
  вибирається через `agentRuntime.id: "codex"` або застарілі посилання на моделі
  `codex/*`

## Усунення проблем runtime hooks

Якщо Plugin з’являється в `plugins list`, але побічні ефекти або hooks
`register(api)` не виконуються в живому чат-трафіку, спершу перевірте це:

- Виконайте `openclaw gateway status --deep --require-rpc` і переконайтеся, що активні
  URL Gateway, профіль, шлях конфігурації та процес є саме тими, які ви редагуєте.
- Перезапустіть живий Gateway після встановлення Plugin або змін конфігурації/коду. У wrapper
  контейнерах PID 1 може бути лише супервізором; перезапустіть або надішліть сигнал дочірньому
  процесу `openclaw gateway run`.
- Використовуйте `openclaw plugins inspect <id> --runtime --json`, щоб підтвердити реєстрації hook і
  діагностику. Невбудовані conversation hooks, як-от `llm_input`,
  `llm_output`, `before_agent_finalize` і `agent_end`, потребують
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання моделей надавайте перевагу `before_model_resolve`. Він виконується до розв’язання моделі
  для ходів агента; `llm_output` виконується лише після того, як спроба моделі
  створить вивід асистента.
- Для підтвердження ефективної моделі сеансу використовуйте `openclaw sessions` або
  поверхні сеансів/статусу Gateway, а під час налагодження payload провайдера запускайте
  Gateway з `--raw-stream --raw-stream-path <path>`.

### Дублювання володіння каналом або інструментом

Симптоми:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Це означає, що більш ніж один увімкнений Plugin намагається володіти тим самим каналом,
потоком налаштування або назвою інструмента. Найпоширеніша причина — зовнішній Plugin каналу,
встановлений поруч із вбудованим Plugin, який тепер надає той самий id каналу.

Кроки налагодження:

- Виконайте `openclaw plugins list --enabled --verbose`, щоб побачити кожен увімкнений Plugin
  і його походження.
- Виконайте `openclaw plugins inspect <id> --runtime --json` для кожного підозрюваного Plugin і
  порівняйте `channels`, `channelConfigs`, `tools` і діагностику.
- Виконайте `openclaw plugins registry --refresh` після встановлення або видалення
  пакетів Plugin, щоб збережені метадані відображали поточне встановлення.
- Перезапустіть Gateway після змін встановлення, реєстру або конфігурації.

Варіанти виправлення:

- Якщо один Plugin навмисно замінює інший для того самого id каналу, бажаний
  Plugin має оголосити `channelConfigs.<channel-id>.preferOver` з id Plugin
  нижчого пріоритету. Див. [/plugins/manifest#replacing-another-channel-plugin](/uk/plugins/manifest#replacing-another-channel-plugin).
- Якщо дублювання випадкове, вимкніть одну сторону через
  `plugins.entries.<plugin-id>.enabled: false` або видаліть застаріле встановлення Plugin.
- Якщо ви явно ввімкнули обидва Plugin, OpenClaw зберігає цей запит і
  повідомляє про конфлікт. Виберіть одного власника для каналу або перейменуйте інструменти,
  що належать Plugin, щоб runtime-поверхня була однозначною.

## Слоти Plugin (ексклюзивні категорії)

Деякі категорії є ексклюзивними (одночасно активна лише одна):

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

| Слот            | Що він контролює        | За замовчуванням   |
| --------------- | ----------------------- | ------------------ |
| `memory`        | Plugin Active memory    | `memory-core`      |
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

Вбудовані Plugin постачаються з OpenClaw. Багато з них увімкнено за замовчуванням (наприклад
вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований браузерний
Plugin). Інші вбудовані Plugin все ще потребують `openclaw plugins enable <id>`.

`--force` перезаписує наявний встановлений Plugin або hook pack на місці. Використовуйте
`openclaw plugins update <id-or-npm-spec>` для звичайних оновлень відстежуваних npm
Plugin. Він не підтримується з `--link`, який повторно використовує шлях до вихідного коду замість
копіювання в керовану ціль встановлення.

Коли `plugins.allow` уже задано, `openclaw plugins install` додає id
встановленого Plugin до цього allowlist перед його ввімкненням. Якщо той самий id Plugin
присутній у `plugins.deny`, встановлення видаляє цей застарілий запис deny, щоб
явне встановлення можна було завантажити одразу після перезапуску.

OpenClaw зберігає локальний реєстр Plugin як холодну модель читання для
інвентаризації Plugin, володіння внесками та планування запуску. Потоки встановлення, оновлення,
видалення, ввімкнення та вимкнення оновлюють цей реєстр після зміни стану Plugin.
Той самий файл `plugins/installs.json` зберігає довговічні метадані встановлення у
верхньорівневих `installRecords` і відновлювані метадані маніфестів у `plugins`. Якщо
реєстр відсутній, застарілий або недійсний, `openclaw plugins registry
--refresh` перебудовує його представлення маніфестів із записів встановлення, політики конфігурації та
метаданих manifest/package без завантаження runtime-модулів Plugin.
`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних встановлень. Передавання
npm package spec із dist-tag або точною версією розв’язує назву пакета
назад до відстежуваного запису Plugin і записує новий spec для майбутніх оновлень.
Передавання назви пакета без версії повертає точно pinned встановлення назад до
типової release line реєстру. Якщо встановлений npm Plugin уже відповідає
розв’язаній версії та записаній ідентичності артефакта, OpenClaw пропускає оновлення
без завантаження, повторного встановлення або переписування конфігурації.

`--pin` працює лише з npm. Він не підтримується з `--marketplace`, оскільки
встановлення з marketplace зберігають метадані джерела marketplace замість npm spec.

`--dangerously-force-unsafe-install` — аварійне перевизначення для хибнопозитивних
спрацювань вбудованого сканера небезпечного коду. Воно дозволяє встановлення Plugin
і оновлення Plugin продовжуватися попри вбудовані findings рівня `critical`, але все одно
не обходить блокування політики Plugin `before_install` або блокування через помилку сканування.
Сканування встановлення ігнорують поширені тестові файли та каталоги, як-от `tests/`,
`__tests__/`, `*.test.*` і `*.spec.*`, щоб не блокувати пакетні test mocks;
оголошені runtime-точки входу Plugin все одно скануються, навіть якщо вони використовують одну з
цих назв.

Цей прапорець CLI застосовується лише до потоків встановлення/оновлення Plugin. Встановлення
залежностей skill на основі Gateway натомість використовують відповідне перевизначення запиту
`dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком
завантаження/встановлення skill із ClawHub.

Якщо Plugin, який ви опублікували на ClawHub, приховано або заблоковано скануванням, відкрийте
панель ClawHub або виконайте `clawhub package rescan <name>`, щоб попросити ClawHub перевірити
його знову. `--dangerously-force-unsafe-install` впливає лише на встановлення на вашій власній
машині; він не просить ClawHub повторно сканувати Plugin або робити заблокований release
публічним.

Сумісні бандли беруть участь у тому самому потоці list/inspect/enable/disable
для Plugin. Поточна підтримка runtime включає bundle skills, Claude command-skills,
стандартні значення Claude `settings.json`, стандартні значення Claude `.lsp.json` і оголошені в маніфесті
`lspServers`, Cursor command-skills і сумісні каталоги hook Codex.

`openclaw plugins inspect <id>` також повідомляє виявлені можливості бандла, а також
підтримувані або непідтримувані записи серверів MCP і LSP для Plugin на основі бандлів.

Джерелами маркетплейсу можуть бути відома назва маркетплейсу Claude з
`~/.claude/plugins/known_marketplaces.json`, локальний корінь маркетплейсу або
шлях до `marketplace.json`, скорочення GitHub на кшталт `owner/repo`, URL
репозиторію GitHub або git URL. Для віддалених маркетплейсів записи Plugin
мають залишатися всередині клонованого репозиторію маркетплейсу та використовувати
лише відносні джерела шляхів.

Повні відомості див. у [довіднику CLI `openclaw plugins`](/uk/cli/plugins).

## Огляд API Plugin

Нативні Plugin експортують об'єкт входу, який надає `register(api)`. Старіші
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

OpenClaw завантажує об'єкт входу та викликає `register(api)` під час
активації Plugin. Завантажувач усе ще повертається до `activate(api)` для старіших Plugin,
але вбудовані Plugin і нові зовнішні Plugin мають розглядати `register` як
публічний контракт.

`api.registrationMode` повідомляє Plugin, чому його вхід завантажується:

| Режим           | Значення                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Активація в середовищі виконання. Реєструйте інструменти, хуки, служби, команди, маршрути та інші активні побічні ефекти.        |
| `discovery`     | Доступне лише для читання виявлення можливостей. Реєструйте провайдерів і метадані; довірений код входу Plugin може завантажуватися, але пропускайте активні побічні ефекти. |
| `setup-only`    | Завантаження метаданих налаштування каналу через легкий вхід налаштування.                                                        |
| `setup-runtime` | Завантаження налаштування каналу, якому також потрібен вхід середовища виконання.                                                  |
| `cli-metadata`  | Лише збирання метаданих команд CLI.                                                                                               |

Записи Plugin, які відкривають сокети, бази даних, фонові воркери або довготривалі
клієнти, мають захищати ці побічні ефекти умовою `api.registrationMode === "full"`.
Завантаження виявлення кешуються окремо від активаційних завантажень і не замінюють
поточний реєстр Gateway. Виявлення не є активаційним, але не є вільним від імпортів:
OpenClaw може виконати довірений вхід Plugin або модуль Plugin каналу, щоб побудувати
знімок. Тримайте верхні рівні модулів легкими та без побічних ефектів, а мережеві
клієнти, підпроцеси, слухачі, читання облікових даних і запуск служб переносьте
за шляхи повного середовища виконання.

Поширені методи реєстрації:

| Метод                                   | Що він реєструє             |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Провайдер моделі (LLM)      |
| `registerChannel`                       | Канал чату                  |
| `registerTool`                          | Інструмент агента           |
| `registerHook` / `on(...)`              | Хуки життєвого циклу        |
| `registerSpeechProvider`                | Перетворення тексту на мовлення / STT |
| `registerRealtimeTranscriptionProvider` | Потокове STT                |
| `registerRealtimeVoiceProvider`         | Дуплексний голос у реальному часі |
| `registerMediaUnderstandingProvider`    | Аналіз зображень/аудіо      |
| `registerImageGenerationProvider`       | Генерація зображень         |
| `registerMusicGenerationProvider`       | Генерація музики            |
| `registerVideoGenerationProvider`       | Генерація відео             |
| `registerWebFetchProvider`              | Провайдер веботримання / скрейпінгу |
| `registerWebSearchProvider`             | Вебпошук                    |
| `registerHttpRoute`                     | HTTP-ендпоінт               |
| `registerCommand` / `registerCli`       | Команди CLI                 |
| `registerContextEngine`                 | Рушій контексту             |
| `registerService`                       | Фонова служба               |

Поведінка захисту хуків для типізованих хуків життєвого циклу:

- `before_tool_call`: `{ block: true }` є кінцевим; обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: `{ block: false }` нічого не робить і не скасовує попереднє блокування.
- `before_install`: `{ block: true }` є кінцевим; обробники з нижчим пріоритетом пропускаються.
- `before_install`: `{ block: false }` нічого не робить і не скасовує попереднє блокування.
- `message_sending`: `{ cancel: true }` є кінцевим; обробники з нижчим пріоритетом пропускаються.
- `message_sending`: `{ cancel: false }` нічого не робить і не скасовує попереднє скасування.

Нативний сервер застосунку Codex повертає події нативних інструментів Codex через міст
на цю поверхню хуків. Plugin можуть блокувати нативні інструменти Codex через `before_tool_call`,
спостерігати результати через `after_tool_call` та брати участь у схваленнях Codex
`PermissionRequest`. Міст поки що не переписує аргументи нативних інструментів Codex.
Точна межа підтримки середовища виконання Codex описана в
[контракті підтримки Codex harness v1](/uk/plugins/codex-harness#v1-support-contract).

Повну поведінку типізованих хуків див. в [огляді SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов'язане

- [Створення Plugin](/uk/plugins/building-plugins) — створіть власний Plugin
- [Пакети Plugin](/uk/plugins/bundles) — сумісність пакетів Codex/Claude/Cursor
- [Маніфест Plugin](/uk/plugins/manifest) — схема маніфесту
- [Реєстрація інструментів](/uk/plugins/building-plugins#registering-agent-tools) — додайте інструменти агента в Plugin
- [Внутрішня архітектура Plugin](/uk/plugins/architecture) — модель можливостей і конвеєр завантаження
- [Спільнотні Plugin](/uk/plugins/community) — переліки сторонніх розробників
