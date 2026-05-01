---
read_when:
    - Встановлення або налаштування плагінів
    - Розуміння правил виявлення та завантаження плагінів
    - Робота з пакетами Plugin, сумісними з Codex/Claude
sidebarTitle: Install and Configure
summary: Встановлюйте, налаштовуйте та керуйте плагінами OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-05-01T04:39:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 69f876df0c2ed3ff356ada9462b56f2b5a65a662b64b328ecc97d8b463036934
    source_path: tools/plugin.md
    workflow: 16
---

Плагіни розширюють OpenClaw новими можливостями: канали, провайдери моделей,
агентні середовища, інструменти, Skills, мовлення, транскрипція в реальному часі, голос у реальному часі, розуміння медіа, генерація зображень, генерація відео, веб-отримання, веб-пошук тощо. Деякі плагіни є **основними** (постачаються з OpenClaw), інші
є **зовнішніми**. Більшість зовнішніх плагінів публікуються й знаходяться через
[ClawHub](/uk/tools/clawhub). Npm і надалі підтримується для прямих встановлень і для
тимчасового набору пакетів плагінів, що належать OpenClaw, доки ця міграція завершується.

## Швидкий старт

<Steps>
  <Step title="Перегляньте, що завантажено">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Установіть плагін">
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

Якщо ви віддаєте перевагу керуванню, природному для чату, увімкніть `commands.plugins: true` і використовуйте:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Шлях установлення використовує той самий резолвер, що й CLI: локальний шлях/архів, явний
`clawhub:<pkg>`, явний `npm:<pkg>` або специфікація пакета без префікса (спочатку ClawHub, потім
резервний npm).

Якщо конфігурація недійсна, установлення зазвичай завершується закрито й указує на
`openclaw doctor --fix`. Єдиний виняток для відновлення — вузький шлях перевстановлення вбудованого плагіна
для плагінів, які явно вмикають
`openclaw.install.allowInvalidConfigRecovery`.
Під час запуску Gateway недійсна конфігурація одного плагіна ізолюється лише до цього плагіна:
запуск записує в журнал проблему `plugins.entries.<id>.config`, пропускає цей плагін під час
завантаження й залишає інші плагіни та канали онлайн. Запустіть `openclaw doctor --fix`,
щоб помістити погану конфігурацію плагіна в карантин, вимкнувши цей запис плагіна та видаливши
його недійсне конфігураційне навантаження; звичайна резервна копія конфігурації зберігає попередні значення.
Коли конфігурація каналу посилається на плагін, який більше неможливо знайти, але той самий
застарілий ідентифікатор плагіна залишається в конфігурації плагінів або записах установлення, запуск Gateway
записує попередження й пропускає цей канал замість блокування всіх інших каналів.
Запустіть `openclaw doctor --fix`, щоб видалити застарілі записи каналів/плагінів; невідомі
ключі каналів без доказів застарілого плагіна все одно не проходять валідацію, щоб помилки друку залишалися
видимими.
Якщо встановлено `plugins.enabled: false`, застарілі посилання на плагіни розглядаються як неактивні:
запуск Gateway пропускає виявлення/завантаження плагінів, а `openclaw doctor` зберігає
вимкнену конфігурацію плагінів замість автоматичного видалення її. Знову ввімкніть плагіни перед
запуском очищення doctor, якщо хочете видалити застарілі ідентифікатори плагінів.

Пакетовані встановлення OpenClaw не встановлюють наперед усе дерево runtime-залежностей кожного вбудованого плагіна.
Коли вбудований плагін, що належить OpenClaw, активний із
конфігурації плагінів, застарілої конфігурації каналу або маніфесту, увімкненого за замовчуванням, запуск
відновлює лише runtime-залежності, оголошені цим плагіном, перед його імпортом.
Сам лише збережений стан автентифікації каналу не активує вбудований канал для
відновлення runtime-залежностей під час запуску Gateway.
Явне вимкнення усе ще має пріоритет: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` і `channels.<id>.enabled: false`
запобігають автоматичному відновленню вбудованих runtime-залежностей для цього плагіна/каналу.
Непорожній `plugins.allow` також обмежує відновлення вбудованих runtime-залежностей,
увімкнених за замовчуванням; явне ввімкнення вбудованого каналу (`channels.<id>.enabled: true`) усе ще може
відновити залежності плагіна цього каналу.
Зовнішні плагіни й користувацькі шляхи завантаження все одно мають бути встановлені через
`openclaw plugins install`.

## Типи Plugin

OpenClaw розпізнає два формати плагінів:

| Формат     | Як це працює                                                       | Приклади                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Нативний** | `openclaw.plugin.json` + runtime-модуль; виконується в процесі       | Офіційні плагіни, npm-пакети спільноти               |
| **Bundle** | Макет, сумісний із Codex/Claude/Cursor; зіставляється з функціями OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва відображаються в `openclaw plugins list`. Див. [Plugin Bundles](/uk/plugins/bundles) для деталей про bundle.

Якщо ви пишете нативний плагін, почніть із [Створення плагінів](/uk/plugins/building-plugins)
і [Огляду Plugin SDK](/uk/plugins/sdk-overview).

## Точки входу пакета

Нативні npm-пакети плагінів мають оголошувати `openclaw.extensions` у `package.json`.
Кожен запис має залишатися всередині директорії пакета й резолвитися в читабельний
runtime-файл або у TypeScript-файл вихідного коду з виведеним зібраним JavaScript-
аналогом, наприклад `src/index.ts` до `dist/index.js`.

Використовуйте `openclaw.runtimeExtensions`, коли опубліковані runtime-файли не розташовані за
тими самими шляхами, що й записи вихідного коду. Якщо `runtimeExtensions` присутній, він має містити
рівно один запис для кожного запису `extensions`. Невідповідні списки призводять до помилки встановлення та
виявлення плагінів, замість тихого резервного повернення до шляхів вихідного коду.

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
окремих npm-встановлень у звичайних налаштуваннях. Доки кожен плагін, що належить OpenClaw,
не мігрує до ClawHub, OpenClaw і надалі постачає деякі пакети плагінів `@openclaw/*` на
npm для старіших/користувацьких встановлень і прямих npm-процесів.

Якщо npm повідомляє, що пакет плагіна `@openclaw/*` застарілий, ця версія пакета
походить зі старішої лінійки зовнішніх пакетів. Використовуйте вбудований плагін із
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
  <Accordion title="Провайдери моделей (увімкнено за замовчуванням)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Плагіни пам’яті">
    - `memory-core` — вбудований пошук пам’яті (за замовчуванням через `plugins.slots.memory`)
    - `memory-lancedb` — довготривала пам’ять, що встановлюється на вимогу, з автоматичним пригадуванням/захопленням (установіть `plugins.slots.memory = "memory-lancedb"`)

    Див. [Memory LanceDB](/uk/plugins/memory-lancedb) для налаштування embeddings, сумісних з OpenAI,
    прикладів Ollama, обмежень пригадування та усунення несправностей.

  </Accordion>

  <Accordion title="Провайдери мовлення (увімкнено за замовчуванням)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` — вбудований плагін браузера для browser tool, CLI `openclaw browser`, gateway-методу `browser.request`, browser runtime і сервісу керування браузером за замовчуванням (увімкнено за замовчуванням; вимкніть перед заміною)
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
| `allow`          | Список дозволених плагінів (необов’язково)                               |
| `deny`           | Список заборонених плагінів (необов’язково; заборона має пріоритет)                     |
| `load.paths`     | Додаткові файли/директорії плагінів                            |
| `slots`          | Ексклюзивні селектори слотів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>` | Перемикачі + конфігурація для окремого плагіна                               |

`plugins.allow` є ексклюзивним. Коли він непорожній, завантажуватися
або надавати інструменти можуть лише перелічені плагіни, навіть якщо `tools.allow` містить `"*"` або конкретну
назву інструмента, що належить плагіну. Якщо список дозволених інструментів посилається на інструменти плагінів, додайте ідентифікатори плагінів-власників
до `plugins.allow` або видаліть `plugins.allow`; `openclaw doctor` попереджає про таку
форму.

Зміни конфігурації **потребують перезапуску gateway**. Якщо Gateway працює з відстеженням конфігурації
та ввімкненим перезапуском у процесі (стандартний шлях `openclaw gateway`), цей
перезапуск зазвичай виконується автоматично через мить після запису конфігурації.
Немає підтримуваного шляху hot-reload для runtime-коду нативного плагіна або lifecycle
hooks; перезапустіть процес Gateway, який обслуговує live-канал, перш ніж
очікувати виконання оновленого коду `register(api)`, hooks `api.on(...)`, інструментів, сервісів або
provider/runtime hooks.

`openclaw plugins list` — це локальний знімок реєстру/конфігурації плагінів. Плагін
`enabled` там означає, що збережений реєстр і поточна конфігурація дозволяють
плагіну брати участь. Це не доводить, що вже запущений віддалений дочірній процес Gateway
перезапустився в той самий код плагіна. У налаштуваннях VPS/container із
wrapper-процесами надсилайте перезапуски до фактичного процесу `openclaw gateway run`
або використовуйте `openclaw gateway restart` щодо запущеного Gateway.

<Accordion title="Стани плагіна: вимкнений, відсутній, недійсний">
  - **Вимкнений**: плагін існує, але правила ввімкнення вимкнули його. Конфігурація зберігається.
  - **Відсутній**: конфігурація посилається на ідентифікатор плагіна, який виявлення не знайшло.
  - **Недійсний**: плагін існує, але його конфігурація не відповідає оголошеній схемі. Запуск Gateway пропускає лише цей плагін; `openclaw doctor --fix` може помістити недійсний запис у карантин, вимкнувши його та видаливши його конфігураційне навантаження.

</Accordion>

## Виявлення та пріоритет

OpenClaw сканує плагіни в такому порядку (перший збіг перемагає):

<Steps>
  <Step title="Шляхи конфігурації">
    `plugins.load.paths` — явні шляхи до файлів або каталогів. Шляхи, що вказують
    назад на власні упаковані каталоги вбудованих Plugin OpenClaw, ігноруються;
    запустіть `openclaw doctor --fix`, щоб прибрати ці застарілі псевдоніми.
  </Step>

  <Step title="Plugin робочої області">
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

Упаковані встановлення та образи Docker зазвичай вирішують вбудовані Plugin з
скомпільованого дерева `dist/extensions`. Якщо вихідний каталог вбудованого Plugin
змонтовано поверх відповідного упакованого шляху до джерел, наприклад
`/app/extensions/synology-chat`, OpenClaw розглядає цей змонтований вихідний каталог
як накладку джерел вбудованого Plugin і виявляє його перед упакованим
бандлом `/app/dist/extensions/synology-chat`. Це зберігає працездатність
контейнерних циклів супровідників без перемикання кожного вбудованого Plugin
назад на джерела TypeScript. Установіть `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`,
щоб примусово використовувати упаковані бандли dist навіть за наявності
змонтованих накладок джерел.

### Правила ввімкнення

- `plugins.enabled: false` вимикає всі Plugin і пропускає роботу з виявлення/завантаження Plugin
- `plugins.deny` завжди має перевагу над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей Plugin
- Plugin з робочої області **вимкнені за замовчуванням** (їх потрібно явно ввімкнути)
- Вбудовані Plugin дотримуються вбудованого набору, увімкненого за замовчуванням, якщо це не перевизначено
- Ексклюзивні слоти можуть примусово ввімкнути вибраний Plugin для цього слота
- Деякі вбудовані opt-in Plugin вмикаються автоматично, коли конфігурація називає
  поверхню, що належить Plugin, як-от посилання на модель провайдера, конфігурацію каналу або
  середовище виконання harness
- Застаріла конфігурація Plugin зберігається, доки активне `plugins.enabled: false`;
  повторно ввімкніть Plugin перед запуском очищення doctor, якщо хочете видалити застарілі id
- Маршрути Codex родини OpenAI зберігають окремі межі Plugin:
  `openai-codex/*` належить Plugin OpenAI, тоді як вбудований Plugin сервера застосунку Codex
  вибирається через `agentRuntime.id: "codex"` або застарілі
  посилання на моделі `codex/*`

## Усунення проблем із runtime hooks

Якщо Plugin відображається в `plugins list`, але побічні ефекти або hooks
`register(api)` не виконуються в живому трафіку чату, спершу перевірте таке:

- Запустіть `openclaw gateway status --deep --require-rpc` і підтвердьте, що активні
  URL Gateway, профіль, шлях конфігурації та процес є тими, які ви редагуєте.
- Перезапустіть живий Gateway після змін встановлення/конфігурації/коду Plugin. У wrapper
  контейнерах PID 1 може бути лише supervisor; перезапустіть або надішліть сигнал дочірньому
  процесу `openclaw gateway run`.
- Використовуйте `openclaw plugins inspect <id> --json`, щоб підтвердити реєстрації hooks і
  діагностику. Невбудовані conversation hooks, як-от `llm_input`,
  `llm_output`, `before_agent_finalize` і `agent_end`, потребують
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання моделей віддавайте перевагу `before_model_resolve`. Він виконується перед
  вирішенням моделі для ходів агента; `llm_output` виконується лише після того, як спроба моделі
  створить відповідь асистента.
- Для підтвердження ефективної моделі сесії використовуйте `openclaw sessions` або
  поверхні сесії/статусу Gateway, а під час налагодження payload провайдера запускайте
  Gateway з `--raw-stream --raw-stream-path <path>`.

### Дублювання володіння каналом або інструментом

Симптоми:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Це означає, що кілька ввімкнених Plugin намагаються володіти тим самим каналом,
потоком налаштування або назвою інструмента. Найпоширеніша причина — зовнішній Plugin каналу,
встановлений поруч із вбудованим Plugin, який тепер надає той самий id каналу.

Кроки налагодження:

- Запустіть `openclaw plugins list --enabled --verbose`, щоб побачити кожен увімкнений Plugin
  і його походження.
- Запустіть `openclaw plugins inspect <id> --json` для кожного підозрюваного Plugin і
  порівняйте `channels`, `channelConfigs`, `tools` і діагностику.
- Запустіть `openclaw plugins registry --refresh` після встановлення або видалення
  пакетів Plugin, щоб збережені метадані відображали поточне встановлення.
- Перезапустіть Gateway після змін встановлення, реєстру або конфігурації.

Варіанти виправлення:

- Якщо один Plugin навмисно замінює інший для того самого id каналу, бажаний
  Plugin має оголосити `channelConfigs.<channel-id>.preferOver` з
  id Plugin нижчого пріоритету. Див. [/plugins/manifest#replacing-another-channel-plugin](/uk/plugins/manifest#replacing-another-channel-plugin).
- Якщо дублювання випадкове, вимкніть одну сторону за допомогою
  `plugins.entries.<plugin-id>.enabled: false` або видаліть застаріле встановлення Plugin.
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
openclaw plugins inspect <id>              # deep detail
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

Вбудовані Plugin постачаються з OpenClaw. Багато з них увімкнено за замовчуванням (наприклад,
вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований браузерний
Plugin). Інші вбудовані Plugin усе ще потребують `openclaw plugins enable <id>`.

`--force` перезаписує наявний установлений Plugin або hook pack на місці. Використовуйте
`openclaw plugins update <id-or-npm-spec>` для звичайних оновлень відстежуваних npm
Plugin. Це не підтримується з `--link`, який повторно використовує вихідний шлях замість
копіювання до керованої цілі встановлення.

Коли `plugins.allow` уже задано, `openclaw plugins install` додає
id установленого Plugin до цього allowlist перед його ввімкненням. Якщо той самий id Plugin
наявний у `plugins.deny`, install видаляє цей застарілий запис deny, щоб
явне встановлення можна було завантажити відразу після перезапуску.

OpenClaw зберігає постійний локальний реєстр Plugin як модель холодного читання для
інвентаризації Plugin, володіння внесками та планування запуску. Потоки install, update,
uninstall, enable і disable оновлюють цей реєстр після зміни стану Plugin.
Той самий файл `plugins/installs.json` зберігає довговічні метадані встановлення у
верхньорівневому `installRecords` і перебудовувані метадані manifest у `plugins`. Якщо
реєстр відсутній, застарілий або недійсний, `openclaw plugins registry
--refresh` перебудовує його представлення manifest із записів встановлення, політики конфігурації та
метаданих manifest/package без завантаження runtime-модулів Plugin.
`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних встановлень. Передавання
специфікації npm-пакета з dist-tag або точною версією зіставляє назву пакета
назад із відстежуваним записом Plugin і записує нову специфікацію для майбутніх оновлень.
Передавання назви пакета без версії повертає точно закріплене встановлення до
стандартної release line реєстру. Якщо встановлений npm Plugin уже відповідає
вирішеній версії та записаній ідентичності артефакту, OpenClaw пропускає оновлення
без завантаження, перевстановлення або переписування конфігурації.

`--pin` призначений лише для npm. Він не підтримується з `--marketplace`, тому що
marketplace-встановлення зберігають метадані джерела marketplace замість npm-специфікації.

`--dangerously-force-unsafe-install` — це аварійне перевизначення для хибних
спрацьовувань вбудованого сканера небезпечного коду. Воно дозволяє встановленням Plugin
і оновленням Plugin продовжуватися попри вбудовані findings рівня `critical`, але все одно
не обходить блокування політики Plugin `before_install` або блокування через збій сканування.
Сканування встановлення ігнорують поширені тестові файли та каталоги, як-от `tests/`,
`__tests__/`, `*.test.*` і `*.spec.*`, щоб не блокувати упаковані тестові mocks;
оголошені runtime entrypoints Plugin усе одно скануються, навіть якщо використовують одну з
цих назв.

Цей прапорець CLI застосовується лише до потоків встановлення/оновлення Plugin. Встановлення
залежностей Skills на базі Gateway натомість використовують відповідне перевизначення запиту
`dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком
завантаження/встановлення Skills з ClawHub.

Якщо Plugin, який ви опублікували на ClawHub, приховано або заблоковано скануванням, відкрийте
панель ClawHub або запустіть `clawhub package rescan <name>`, щоб попросити ClawHub
перевірити його знову. `--dangerously-force-unsafe-install` впливає лише на встановлення на вашому
власному комп'ютері; він не просить ClawHub повторно сканувати Plugin або робити заблокований
реліз публічним.

Сумісні бандли беруть участь у тому самому потоці list/inspect/enable/disable для Plugin.
Поточна підтримка runtime включає bundle skills, command-skills Claude,
стандартні значення Claude `settings.json`, стандартні значення Claude `.lsp.json` і оголошені в manifest
`lspServers`, command-skills Cursor і сумісні каталоги hooks Codex.

`openclaw plugins inspect <id>` також повідомляє виявлені можливості бандла, а також
підтримувані або непідтримувані записи серверів MCP і LSP для Plugin на основі бандлів.

Джерела marketplace можуть бути відомою назвою marketplace Claude з
`~/.claude/plugins/known_marketplaces.json`, локальним коренем marketplace або шляхом
`marketplace.json`, скороченням GitHub на кшталт `owner/repo`, URL репозиторію GitHub
або git URL. Для віддалених marketplace записи Plugin мають залишатися всередині
клонованого репозиторію marketplace і використовувати лише відносні джерела шляхів.

Див. [довідник CLI `openclaw plugins`](/uk/cli/plugins) для повних подробиць.

## Огляд API Plugin

Нативні Plugin експортують об'єкт entry, який надає `register(api)`. Старіші
Plugin усе ще можуть використовувати `activate(api)` як застарілий псевдонім, але нові Plugin мають
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
активації плагіна. Завантажувач досі повертається до `activate(api)` для старіших плагінів,
але вбудовані плагіни та нові зовнішні плагіни мають вважати `register`
публічним контрактом.

`api.registrationMode` повідомляє плагіну, чому завантажується його вхід:

| Режим           | Значення                                                                                                                         |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Активація під час виконання. Реєструйте інструменти, хуки, сервіси, команди, маршрути та інші активні побічні ефекти.           |
| `discovery`     | Виявлення можливостей лише для читання. Реєструйте провайдерів і метадані; довірений код входу плагіна може завантажуватися, але пропускайте активні побічні ефекти. |
| `setup-only`    | Завантаження метаданих налаштування каналу через полегшений вхід налаштування.                                                   |
| `setup-runtime` | Завантаження налаштування каналу, якому також потрібен вхід середовища виконання.                                                |
| `cli-metadata`  | Лише збирання метаданих команд CLI.                                                                                              |

Входи плагінів, які відкривають сокети, бази даних, фонові воркери або довгоживучі
клієнти, мають захищати ці побічні ефекти умовою `api.registrationMode === "full"`.
Завантаження для виявлення кешуються окремо від завантажень активації та не замінюють
поточний реєстр Gateway. Виявлення не активує, але не є вільним від імпортів:
OpenClaw може виконати довірений вхід плагіна або модуль плагіна каналу, щоб побудувати
знімок. Тримайте верхній рівень модулів легким і без побічних ефектів, а мережеві
клієнти, підпроцеси, слухачі, читання облікових даних і запуск сервісів переносіть
за шляхи повного середовища виконання.

Поширені методи реєстрації:

| Метод                                   | Що він реєструє                       |
| --------------------------------------- | ------------------------------------- |
| `registerProvider`                      | Провайдер моделі (LLM)                |
| `registerChannel`                       | Канал чату                            |
| `registerTool`                          | Інструмент агента                     |
| `registerHook` / `on(...)`              | Хуки життєвого циклу                  |
| `registerSpeechProvider`                | Перетворення тексту на мовлення / STT |
| `registerRealtimeTranscriptionProvider` | Потокове STT                          |
| `registerRealtimeVoiceProvider`         | Дуплексний голос у реальному часі     |
| `registerMediaUnderstandingProvider`    | Аналіз зображень/аудіо                |
| `registerImageGenerationProvider`       | Генерація зображень                   |
| `registerMusicGenerationProvider`       | Генерація музики                      |
| `registerVideoGenerationProvider`       | Генерація відео                       |
| `registerWebFetchProvider`              | Провайдер веботримання / скрейпінгу   |
| `registerWebSearchProvider`             | Вебпошук                              |
| `registerHttpRoute`                     | HTTP-ендпойнт                         |
| `registerCommand` / `registerCli`       | Команди CLI                           |
| `registerContextEngine`                 | Рушій контексту                       |
| `registerService`                       | Фоновий сервіс                        |

Поведінка захисту хуків для типізованих хуків життєвого циклу:

- `before_tool_call`: `{ block: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: `{ block: false }` нічого не робить і не скасовує попереднє блокування.
- `before_install`: `{ block: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `before_install`: `{ block: false }` нічого не робить і не скасовує попереднє блокування.
- `message_sending`: `{ cancel: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `message_sending`: `{ cancel: false }` нічого не робить і не скасовує попереднє скасування.

Запуски нативного app-server Codex передають події нативних інструментів Codex назад у цю
поверхню хуків. Плагіни можуть блокувати нативні інструменти Codex через `before_tool_call`,
спостерігати результати через `after_tool_call` і брати участь у схваленнях Codex
`PermissionRequest`. Міст ще не переписує аргументи нативних інструментів Codex.
Точна межа підтримки середовища виконання Codex описана в
[контракті підтримки Codex harness v1](/uk/plugins/codex-harness#v1-support-contract).

Повну поведінку типізованих хуків див. в [огляді SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Створення плагінів](/uk/plugins/building-plugins) — створіть власний плагін
- [Пакети плагінів](/uk/plugins/bundles) — сумісність пакетів Codex/Claude/Cursor
- [Маніфест плагіна](/uk/plugins/manifest) — схема маніфесту
- [Реєстрація інструментів](/uk/plugins/building-plugins#registering-agent-tools) — додайте інструменти агента в плагіні
- [Внутрішня архітектура плагінів](/uk/plugins/architecture) — модель можливостей і конвеєр завантаження
- [Плагіни спільноти](/uk/plugins/community) — списки сторонніх плагінів
