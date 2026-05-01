---
read_when:
    - Встановлення або налаштування плагінів
    - Розуміння правил виявлення та завантаження Plugin
    - Робота з пакетами Plugin, сумісними з Codex/Claude
sidebarTitle: Install and Configure
summary: Встановлюйте, налаштовуйте та керуйте плагінами OpenClaw
title: Плагіни
x-i18n:
    generated_at: "2026-05-01T07:54:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2df8aca086aafbd8f268820f1ccc2425079c69f1a673a4c2ea163aba1358ff51
    source_path: tools/plugin.md
    workflow: 16
---

Plugins розширюють OpenClaw новими можливостями: канали, постачальники моделей,
обв’язки агентів, інструменти, Skills, мовлення, транскрипція в реальному часі,
голос у реальному часі, розуміння медіа, генерація зображень, генерація відео,
веботримання, вебпошук тощо. Деякі plugins є **core** (постачаються з OpenClaw), інші
є **external**. Більшість external plugins публікуються та виявляються через
[ClawHub](/uk/tools/clawhub). Npm і надалі підтримується для прямих установлень і для
тимчасового набору пакетів plugins, що належать OpenClaw, доки ця міграція завершується.

## Швидкий старт

<Steps>
  <Step title="Подивіться, що завантажено">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Установіть plugin">
    ```bash
    # From npm
    openclaw plugins install npm:@acme/openclaw-plugin

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
</Steps>

Якщо ви віддаєте перевагу керуванню безпосередньо з чату, увімкніть `commands.plugins: true` і використовуйте:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Шлях установлення використовує той самий резолвер, що й CLI: локальний шлях/архів, явний
`clawhub:<pkg>`, явний `npm:<pkg>` або звичайна специфікація пакета (спершу ClawHub, потім
резервний npm).

Якщо конфігурація недійсна, установлення зазвичай завершується закритою помилкою та спрямовує вас до
`openclaw doctor --fix`. Єдиний виняток для відновлення — вузький шлях перевстановлення
вбудованого plugin для plugins, які явно вмикають
`openclaw.install.allowInvalidConfigRecovery`.
Під час запуску Gateway недійсна конфігурація одного plugin ізолюється до цього plugin:
запуск записує проблему `plugins.entries.<id>.config` у журнал, пропускає цей plugin під час
завантаження та залишає інші plugins і канали онлайн. Запустіть `openclaw doctor --fix`,
щоб помістити неправильну конфігурацію plugin у карантин, вимкнувши цей запис plugin і видаливши
його недійсне корисне навантаження конфігурації; звичайна резервна копія конфігурації зберігає попередні значення.
Коли конфігурація каналу посилається на plugin, який більше не можна виявити, але той самий
застарілий id plugin залишається в конфігурації plugin або записах установлення, запуск Gateway
записує попередження та пропускає цей канал замість блокування всіх інших каналів.
Запустіть `openclaw doctor --fix`, щоб видалити застарілі записи каналу/plugin; невідомі
ключі каналу без доказів застарілого plugin і надалі провалюють валідацію, щоб описки залишалися
видимими.
Якщо встановлено `plugins.enabled: false`, застарілі посилання на plugin вважаються інертними:
запуск Gateway пропускає роботу з виявлення/завантаження plugin, а `openclaw doctor` зберігає
вимкнену конфігурацію plugin замість її автоматичного видалення. Повторно ввімкніть plugins перед
запуском очищення doctor, якщо хочете видалити застарілі ids plugin.

Пакетовані встановлення OpenClaw не встановлюють завчасно дерево runtime-залежностей кожного
вбудованого plugin. Коли вбудований plugin, що належить OpenClaw, активний із
конфігурації plugin, застарілої конфігурації каналу або типово ввімкненого маніфесту, запуск
виправляє лише оголошені runtime-залежності цього plugin перед його імпортом.
Сам лише збережений стан автентифікації каналу не активує вбудований канал для
виправлення runtime-залежностей під час запуску Gateway.
Явне вимкнення усе ще має пріоритет: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` і `channels.<id>.enabled: false`
запобігають автоматичному виправленню runtime-залежностей вбудованого plugin/каналу.
Непорожній `plugins.allow` також обмежує виправлення runtime-залежностей типово ввімкнених
вбудованих plugins; явне ввімкнення вбудованого каналу (`channels.<id>.enabled: true`) усе ще може
виправити залежності plugin цього каналу.
External plugins і власні шляхи завантаження все одно треба встановлювати через
`openclaw plugins install`.
Див. [Вирішення залежностей Plugin](/uk/plugins/dependency-resolution), щоб ознайомитися з повним
життєвим циклом планування та підготовки.

## Типи Plugin

OpenClaw розпізнає два формати plugin:

| Формат     | Як це працює                                                       | Приклади                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + runtime-модуль; виконується в процесі       | Офіційні plugins, пакети npm спільноти               |
| **Bundle** | макет, сумісний із Codex/Claude/Cursor; зіставляється з функціями OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва відображаються в `openclaw plugins list`. Див. [Пакети Plugin](/uk/plugins/bundles), щоб дізнатися подробиці про bundles.

Якщо ви пишете native plugin, почніть із [Створення Plugins](/uk/plugins/building-plugins)
і [Огляд Plugin SDK](/uk/plugins/sdk-overview).

## Точки входу пакетів

Пакети npm native plugin мають оголошувати `openclaw.extensions` у `package.json`.
Кожен запис має залишатися всередині каталогу пакета та резолвитися в читаний
runtime-файл або у вихідний файл TypeScript із виведеним зібраним JavaScript
відповідником, як-от `src/index.ts` до `dist/index.js`.

Використовуйте `openclaw.runtimeExtensions`, коли опубліковані runtime-файли не розташовані за тими
самими шляхами, що й вихідні записи. Якщо `runtimeExtensions` присутній, він має містити
рівно один запис для кожного запису `extensions`. Невідповідні списки спричиняють збій установлення та
виявлення plugin, а не тихий резервний перехід до вихідних шляхів.

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

### Пакети npm, що належать OpenClaw, під час міграції

ClawHub є основним шляхом розповсюдження для більшості plugins. Поточні пакетовані
релізи OpenClaw вже містять багато офіційних plugins, тому в типових налаштуваннях для них не потрібні
окремі npm-установлення. Доки кожен plugin, що належить OpenClaw, не буде
мігровано до ClawHub, OpenClaw і надалі постачає деякі пакети plugins `@openclaw/*` на
npm для старіших/власних установлень і прямих npm-процесів.

Якщо npm повідомляє, що пакет plugin `@openclaw/*` застарілий, ця версія пакета
походить зі старішої зовнішньої гілки пакетів. Використовуйте вбудований plugin із
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
  <Accordion title="Постачальники моделей (увімкнені за замовчуванням)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugins пам’яті">
    - `memory-core` — вбудований пошук у пам’яті (за замовчуванням через `plugins.slots.memory`)
    - `memory-lancedb` — довготривала пам’ять із установленням на вимогу та автоматичним пригадуванням/захопленням (встановіть `plugins.slots.memory = "memory-lancedb"`)

    Див. [Memory LanceDB](/uk/plugins/memory-lancedb), щоб налаштувати сумісні з OpenAI
    embeddings, переглянути приклади Ollama, ліміти пригадування та усунення несправностей.

  </Accordion>

  <Accordion title="Постачальники мовлення (увімкнені за замовчуванням)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` — вбудований browser plugin для інструмента browser, CLI `openclaw browser`, Gateway-методу `browser.request`, runtime browser і типового сервісу керування browser (увімкнений за замовчуванням; вимкніть перед заміною)
    - `copilot-proxy` — міст VS Code Copilot Proxy (вимкнений за замовчуванням)

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
| `allow`          | Список дозволених plugins (необов’язково)                               |
| `deny`           | Список заборонених plugins (необов’язково; заборона має пріоритет)                     |
| `load.paths`     | Додаткові файли/каталоги plugin                            |
| `slots`          | Селектори ексклюзивних слотів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>` | Перемикачі + конфігурація для окремого plugin                               |

`plugins.allow` є ексклюзивним. Коли він непорожній, завантажуватися
або показувати інструменти можуть лише перелічені plugins, навіть якщо `tools.allow` містить `"*"` або конкретну
назву інструмента, що належить plugin. Якщо список дозволених інструментів посилається на інструменти plugin, додайте ids
відповідних plugins до `plugins.allow` або видаліть `plugins.allow`; `openclaw doctor` попереджає про таку
форму.

Зміни конфігурації **потребують перезапуску gateway**. Якщо Gateway працює з увімкненими
спостереженням за конфігурацією + перезапуском у процесі (типовий шлях `openclaw gateway`), цей
перезапуск зазвичай виконується автоматично за мить після запису конфігурації.
Підтримуваного шляху hot-reload для runtime-коду native plugin або lifecycle
hooks немає; перезапустіть процес Gateway, який обслуговує живий канал, перш ніж
очікувати запуску оновленого коду `register(api)`, hooks `api.on(...)`, інструментів, сервісів або
provider/runtime hooks.

`openclaw plugins list` — це локальний знімок реєстру/конфігурації plugin. Plugin зі станом
`enabled` там означає, що збережений реєстр і поточна конфігурація дозволяють
plugin брати участь. Це не доводить, що вже запущений дочірній процес віддаленого Gateway
перезапустився з тим самим кодом plugin. У VPS/контейнерних налаштуваннях із
wrapper-процесами надсилайте перезапуски фактичному процесу `openclaw gateway run`
або використовуйте `openclaw gateway restart` проти запущеного Gateway.

<Accordion title="Стани Plugin: disabled vs missing vs invalid">
  - **Disabled**: plugin існує, але правила ввімкнення його вимкнули. Конфігурація зберігається.
  - **Missing**: конфігурація посилається на id plugin, який виявлення не знайшло.
  - **Invalid**: plugin існує, але його конфігурація не відповідає оголошеній схемі. Запуск Gateway пропускає лише цей plugin; `openclaw doctor --fix` може помістити недійсний запис у карантин, вимкнувши його та видаливши його корисне навантаження конфігурації.

</Accordion>

## Виявлення та пріоритетність

OpenClaw сканує plugins у такому порядку (перший збіг перемагає):

<Steps>
  <Step title="Шляхи конфігурації">
    `plugins.load.paths` — явні шляхи до файлів або каталогів. Шляхи, які вказують
    назад на власні упаковані каталоги bundled plugin OpenClaw, ігноруються;
    запустіть `openclaw doctor --fix`, щоб видалити ці застарілі псевдоніми.
  </Step>

  <Step title="Plugin робочої області">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` і `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Глобальні plugin">
    `~/.openclaw/<plugin-root>/*.ts` і `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Bundled plugins">
    Постачаються з OpenClaw. Багато з них увімкнені за замовчуванням (провайдери моделей, мовлення).
    Інші потребують явного ввімкнення.
  </Step>
</Steps>

Упаковані інсталяції та Docker-образи зазвичай знаходять bundled plugins у
скомпільованому дереві `dist/extensions`. Якщо вихідний каталог bundled plugin
змонтувати поверх відповідного упакованого вихідного шляху, наприклад
`/app/extensions/synology-chat`, OpenClaw розглядає цей змонтований вихідний
каталог як накладення bundled source і виявляє його перед упакованим бандлом
`/app/dist/extensions/synology-chat`. Це дає змогу циклам контейнерів для
супровідників працювати без перемикання кожного bundled plugin назад на
вихідний TypeScript. Установіть `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`,
щоб примусово використовувати упаковані dist-бандли, навіть коли наявні
змонтовані накладення вихідного коду.

### Правила ввімкнення

- `plugins.enabled: false` вимикає всі plugins і пропускає роботу з виявлення/завантаження plugin
- `plugins.deny` завжди має пріоритет над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей plugin
- Plugins із робочої області **вимкнені за замовчуванням** (їх потрібно явно ввімкнути)
- Bundled plugins дотримуються вбудованого набору ввімкнених за замовчуванням, якщо це не перевизначено
- Ексклюзивні слоти можуть примусово ввімкнути вибраний plugin для цього слота
- Деякі bundled opt-in plugins вмикаються автоматично, коли конфігурація називає
  поверхню, що належить plugin, як-от посилання на модель провайдера, конфігурація каналу або runtime
  harness
- Застаріла конфігурація plugin зберігається, доки активний `plugins.enabled: false`;
  повторно ввімкніть plugins перед запуском очищення doctor, якщо хочете видалити застарілі id
- Маршрути Codex родини OpenAI зберігають окремі межі plugin:
  `openai-codex/*` належить до OpenAI plugin, тоді як bundled Codex
  app-server plugin вибирається через `agentRuntime.id: "codex"` або застарілі
  посилання на моделі `codex/*`

## Усунення несправностей runtime hooks

Якщо plugin з’являється в `plugins list`, але побічні ефекти або hooks
`register(api)` не виконуються в живому чат-трафіку, спершу перевірте таке:

- Запустіть `openclaw gateway status --deep --require-rpc` і підтвердьте, що активні
  URL Gateway, профіль, шлях конфігурації та процес саме ті, які ви редагуєте.
- Перезапустіть живий Gateway після змін у встановленні/config/code plugin. У wrapper
  containers PID 1 може бути лише супервізором; перезапустіть або надішліть сигнал дочірньому
  процесу `openclaw gateway run`.
- Використайте `openclaw plugins inspect <id> --runtime --json`, щоб підтвердити реєстрації hooks і
  діагностику. Небандлові hooks розмови, як-от `llm_input`,
  `llm_output`, `before_agent_finalize` і `agent_end`, потребують
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання моделей віддавайте перевагу `before_model_resolve`. Він виконується перед
  розв’язанням моделі для ходів агента; `llm_output` виконується лише після того, як спроба моделі
  створить вивід асистента.
- Для підтвердження ефективної моделі сесії використовуйте `openclaw sessions` або
  поверхні сесії/статусу Gateway, а під час налагодження payload провайдера запускайте
  Gateway з `--raw-stream --raw-stream-path <path>`.

### Дублювання власника каналу або інструмента

Симптоми:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Це означає, що більше ніж один увімкнений plugin намагається володіти тим самим каналом,
потоком налаштування або назвою інструмента. Найпоширеніша причина — зовнішній channel plugin,
встановлений поруч із bundled plugin, який тепер надає той самий id каналу.

Кроки налагодження:

- Запустіть `openclaw plugins list --enabled --verbose`, щоб побачити кожен увімкнений plugin
  і походження.
- Запустіть `openclaw plugins inspect <id> --runtime --json` для кожного підозрюваного plugin і
  порівняйте `channels`, `channelConfigs`, `tools` і діагностику.
- Запустіть `openclaw plugins registry --refresh` після встановлення або видалення
  пакетів plugin, щоб збережені метадані відображали поточне встановлення.
- Перезапустіть Gateway після змін установлення, реєстру або конфігурації.

Варіанти виправлення:

- Якщо один plugin навмисно замінює інший для того самого id каналу, бажаний
  plugin має оголосити `channelConfigs.<channel-id>.preferOver` з id plugin
  нижчого пріоритету. Див. [/plugins/manifest#replacing-another-channel-plugin](/uk/plugins/manifest#replacing-another-channel-plugin).
- Якщо дублювання випадкове, вимкніть одну зі сторін через
  `plugins.entries.<plugin-id>.enabled: false` або видаліть застаріле встановлення plugin.
- Якщо ви явно ввімкнули обидва plugins, OpenClaw зберігає цей запит і
  повідомляє про конфлікт. Виберіть одного власника для каналу або перейменуйте
  інструменти, що належать plugin, щоб runtime-поверхня була однозначною.

## Слоти plugin (ексклюзивні категорії)

Деякі категорії ексклюзивні (одночасно активна лише одна):

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
| `memory`        | Plugin active memory  | `memory-core`       |
| `contextEngine` | Активний context engine | `legacy` (вбудований) |

## Довідник CLI

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
openclaw plugins inspect <id>              # static detail
openclaw plugins inspect <id> --runtime    # registered hooks/tools/diagnostics
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

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Bundled plugins постачаються з OpenClaw. Багато з них увімкнені за замовчуванням (наприклад
bundled providers моделей, bundled providers мовлення та bundled browser
plugin). Інші bundled plugins усе ще потребують `openclaw plugins enable <id>`.

`--force` перезаписує наявний встановлений plugin або hook pack на місці. Використовуйте
`openclaw plugins update <id-or-npm-spec>` для планових оновлень відстежуваних npm
plugins. Він не підтримується разом із `--link`, який повторно використовує вихідний шлях замість
копіювання поверх керованої цілі встановлення.

Коли `plugins.allow` уже задано, `openclaw plugins install` додає
id встановленого plugin до цього allowlist перед його ввімкненням. Якщо той самий id plugin
є в `plugins.deny`, install видаляє цей застарілий deny-запис, щоб
явно встановлений plugin можна було завантажити одразу після перезапуску.

OpenClaw зберігає постійний локальний реєстр plugin як модель холодного читання для
інвентаризації plugin, власності внесків і планування запуску. Потоки install, update,
uninstall, enable і disable оновлюють цей реєстр після зміни стану plugin.
Той самий файл `plugins/installs.json` зберігає довговічні метадані встановлення в
верхньорівневих `installRecords` і відновлювані метадані маніфесту в `plugins`. Якщо
реєстр відсутній, застарілий або недійсний, `openclaw plugins registry
--refresh` відновлює його подання маніфестів із записів встановлення, політики конфігурації та
метаданих manifest/package без завантаження runtime-модулів plugin.
`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних встановлень. Передавання
npm package spec із dist-tag або точною версією розв’язує назву пакета
назад до відстежуваного запису plugin і записує новий spec для майбутніх оновлень.
Передавання назви пакета без версії переміщує точно pinned install назад до
стандартної release line реєстру. Якщо встановлений npm plugin уже відповідає
розв’язаній версії та записаній artifact identity, OpenClaw пропускає оновлення
без завантаження, повторного встановлення або переписування конфігурації.

`--pin` працює лише для npm. Він не підтримується з `--marketplace`, тому що
marketplace-встановлення зберігають метадані джерела marketplace замість npm spec.

`--dangerously-force-unsafe-install` — аварійний override для хибних
спрацювань вбудованого сканера небезпечного коду. Він дає змогу встановленням plugin
і оновленням plugin продовжуватися попри вбудовані знахідки рівня `critical`, але все одно
не обходить блокування політик plugin `before_install` або блокування через помилки сканування.
Сканування встановлення ігнорують поширені тестові файли й каталоги, як-от `tests/`,
`__tests__/`, `*.test.*` і `*.spec.*`, щоб не блокувати упаковані тестові mocks;
оголошені runtime entrypoints plugin усе одно скануються, навіть якщо використовують одну з
цих назв.

Цей CLI flag застосовується лише до потоків install/update plugin. Встановлення залежностей skills
через Gateway натомість використовують відповідний override запиту
`dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком
завантаження/встановлення skill із ClawHub.

Якщо plugin, який ви опублікували на ClawHub, приховано або заблоковано скануванням, відкрийте
панель ClawHub або запустіть `clawhub package rescan <name>`, щоб попросити ClawHub перевірити
його знову. `--dangerously-force-unsafe-install` впливає лише на встановлення на вашому власному
комп’ютері; він не просить ClawHub пересканувати plugin або зробити заблокований реліз
публічним.

Сумісні bundles беруть участь у тому самому потоці list/inspect/enable/disable для plugin.
Поточна runtime-підтримка охоплює bundle skills, Claude command-skills,
стандартні значення Claude `settings.json`, стандартні значення Claude `.lsp.json` і оголошені в маніфесті
`lspServers`, Cursor command-skills і сумісні каталоги hooks Codex.

`openclaw plugins inspect <id>` також повідомляє виявлені можливості bundle, а також
підтримувані або непідтримувані записи MCP і LSP server для bundle-backed plugins.

Джерела marketplace можуть бути відомою назвою Claude marketplace з
`~/.claude/plugins/known_marketplaces.json`, локальним коренем marketplace або
шляхом `marketplace.json`, GitHub-скороченням на кшталт `owner/repo`, URL repo
GitHub або git URL. Для віддалених marketplaces записи plugin мають залишатися всередині
клонованого marketplace repo і використовувати лише відносні джерела шляхів.

Повні відомості див. у [довіднику CLI `openclaw plugins`](/uk/cli/plugins).

## Огляд API plugin

Власні плагіни експортують об’єкт входу, який надає `register(api)`. Старіші
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

OpenClaw завантажує об’єкт входу й викликає `register(api)` під час
активації плагіна. Завантажувач усе ще повертається до `activate(api)` для старіших плагінів,
але вбудовані плагіни та нові зовнішні плагіни мають вважати `register`
публічним контрактом.

`api.registrationMode` повідомляє плагіну, чому його об’єкт входу завантажується:

| Режим           | Значення                                                                                                                         |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Активація під час виконання. Реєструйте інструменти, хуки, сервіси, команди, маршрути та інші активні побічні ефекти.            |
| `discovery`     | Виявлення можливостей лише для читання. Реєструйте провайдерів і метадані; довірений код входу плагіна може завантажуватися, але пропускайте активні побічні ефекти. |
| `setup-only`    | Завантаження метаданих налаштування каналу через полегшений вхід налаштування.                                                   |
| `setup-runtime` | Завантаження налаштування каналу, якому також потрібен вхід часу виконання.                                                      |
| `cli-metadata`  | Лише збирання метаданих команд CLI.                                                                                              |

Входи плагінів, які відкривають сокети, бази даних, фонові воркери або довгоживучі
клієнти, мають обмежувати ці побічні ефекти умовою `api.registrationMode === "full"`.
Завантаження виявлення кешуються окремо від активаційних завантажень і не замінюють
поточний реєстр Gateway. Виявлення не активує плагін, але не є вільним від імпорту:
OpenClaw може виконати довірений вхід плагіна або модуль плагіна каналу, щоб побудувати
знімок. Тримайте верхні рівні модулів легкими й без побічних ефектів, а мережеві
клієнти, підпроцеси, слухачі, читання облікових даних і запуск сервісів переносьте
за шляхи повного часу виконання.

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
| `registerWebFetchProvider`              | Провайдер отримання вебданих / скрейпінгу |
| `registerWebSearchProvider`             | Вебпошук                    |
| `registerHttpRoute`                     | HTTP-ендпойнт               |
| `registerCommand` / `registerCli`       | Команди CLI                 |
| `registerContextEngine`                 | Контекстний рушій           |
| `registerService`                       | Фоновий сервіс              |

Поведінка guard для типізованих хуків життєвого циклу:

- `before_tool_call`: `{ block: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: `{ block: false }` не виконує дії й не скасовує попередній блок.
- `before_install`: `{ block: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `before_install`: `{ block: false }` не виконує дії й не скасовує попередній блок.
- `message_sending`: `{ cancel: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `message_sending`: `{ cancel: false }` не виконує дії й не скасовує попереднє скасування.

Власний app-server Codex прокидає події власних інструментів Codex назад у цю
поверхню хуків. Плагіни можуть блокувати власні інструменти Codex через `before_tool_call`,
спостерігати результати через `after_tool_call` і брати участь у схваленнях Codex
`PermissionRequest`. Міст ще не переписує аргументи власних інструментів Codex.
Точна межа підтримки часу виконання Codex описана в
[контракті підтримки Codex harness v1](/uk/plugins/codex-harness#v1-support-contract).

Повну поведінку типізованих хуків див. в [огляді SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Створення плагінів](/uk/plugins/building-plugins) — створіть власний плагін
- [Пакети плагінів](/uk/plugins/bundles) — сумісність пакетів Codex/Claude/Cursor
- [Маніфест плагіна](/uk/plugins/manifest) — схема маніфесту
- [Реєстрація інструментів](/uk/plugins/building-plugins#registering-agent-tools) — додайте інструменти агента в плагін
- [Внутрішня архітектура плагінів](/uk/plugins/architecture) — модель можливостей і конвеєр завантаження
- [Плагіни спільноти](/uk/plugins/community) — сторонні каталоги
