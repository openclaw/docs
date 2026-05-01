---
read_when:
    - Встановлення або налаштування плагінів
    - Розуміння правил виявлення та завантаження Plugin
    - Робота з пакетами Plugin, сумісними з Codex/Claude
sidebarTitle: Install and Configure
summary: Встановлення, налаштування та керування Plugin-ами OpenClaw
title: Плагіни
x-i18n:
    generated_at: "2026-05-01T20:43:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0991eac5bc54f7f5e0446747c7f9b81cce0a279e30412af53ce7b66539952708
    source_path: tools/plugin.md
    workflow: 16
---

Плагіни розширюють OpenClaw новими можливостями: каналами, постачальниками моделей,
агентними середовищами, інструментами, Skills, мовленням, транскрипцією в реальному часі,
голосом у реальному часі, розумінням медіа, генерацією зображень, генерацією відео, web fetch, web
search та іншим. Деякі плагіни є **основними** (постачаються з OpenClaw), інші
є **зовнішніми**. Більшість зовнішніх плагінів публікуються й знаходяться через
[ClawHub](/uk/tools/clawhub). Npm залишається підтримуваним для прямих встановлень і для
тимчасового набору пакетів плагінів, що належать OpenClaw, доки ця міграція завершується.

## Швидкий старт

<Steps>
  <Step title="Подивіться, що завантажено">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Встановіть плагін">
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

  <Step title="Перевірте плагін">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Використовуйте `--runtime`, коли потрібно підтвердити зареєстровані інструменти, сервіси, gateway
    методи, хуки або CLI-команди, що належать плагіну. Звичайний `inspect` — це холодна
    перевірка маніфесту/реєстру, яка навмисно уникає імпорту runtime плагіна.

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
(спочатку ClawHub, потім fallback на npm).

Якщо конфігурація недійсна, встановлення зазвичай завершується закритою відмовою й спрямовує вас до
`openclaw doctor --fix`. Єдиний виняток для відновлення — вузький шлях перевстановлення bundled-plugin
для плагінів, які явно погодилися на
`openclaw.install.allowInvalidConfigRecovery`.
Під час запуску Gateway недійсна конфігурація одного плагіна ізолюється до цього плагіна:
запуск записує проблему `plugins.entries.<id>.config` у логи, пропускає цей плагін під час
завантаження й залишає інші плагіни та канали онлайн. Запустіть `openclaw doctor --fix`,
щоб помістити погану конфігурацію плагіна в карантин, вимкнувши цей запис плагіна й видаливши
його недійсний config payload; звичайна резервна копія конфігурації зберігає попередні значення.
Коли конфігурація каналу посилається на плагін, який більше не можна знайти, але той самий
застарілий id плагіна залишається в конфігурації плагіна або записах встановлення, запуск Gateway
записує попередження в логи й пропускає цей канал замість блокування всіх інших каналів.
Запустіть `openclaw doctor --fix`, щоб видалити застарілі записи каналу/плагіна; невідомі
ключі каналів без доказів застарілого плагіна все ще провалюють валідацію, щоб помилки введення
залишалися видимими.
Якщо встановлено `plugins.enabled: false`, застарілі посилання на плагіни вважаються інертними:
запуск Gateway пропускає роботу з виявлення/завантаження плагінів, а `openclaw doctor` зберігає
вимкнену конфігурацію плагінів замість автоматичного видалення. Знову ввімкніть плагіни перед
запуском очищення doctor, якщо хочете видалити застарілі id плагінів.

Встановлення залежностей плагінів відбувається лише під час явних потоків install/update або
repair у doctor. Запуск Gateway, перезавантаження конфігурації та runtime-інспекція
не запускають менеджери пакетів і не ремонтують дерева залежностей. Локальні плагіни вже мають
мати встановлені залежності, тоді як npm, git і ClawHub плагіни встановлюються
в керовані корені плагінів OpenClaw із package-local
залежностями. Зовнішні плагіни й користувацькі шляхи завантаження все одно мають бути встановлені
через `openclaw plugins install`.
Див. [Вирішення залежностей плагінів](/uk/plugins/dependency-resolution) щодо
життєвого циклу під час встановлення.

## Типи плагінів

OpenClaw розпізнає два формати плагінів:

| Формат     | Як це працює                                                       | Приклади                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + runtime-модуль; виконується в процесі       | Офіційні плагіни, npm-пакети спільноти               |
| **Bundle** | Codex/Claude/Cursor-сумісна структура; зіставляється з можливостями OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва відображаються в `openclaw plugins list`. Див. [Пакети плагінів](/uk/plugins/bundles) для деталей про пакети.

Якщо ви пишете native-плагін, почніть із [Створення плагінів](/uk/plugins/building-plugins)
та [Огляду Plugin SDK](/uk/plugins/sdk-overview).

## Точки входу пакета

Npm-пакети native-плагінів мають оголошувати `openclaw.extensions` у `package.json`.
Кожен запис має залишатися всередині каталогу пакета й резолвитися у читабельний
runtime-файл або у вихідний TypeScript-файл з виведеним збудованим JavaScript
peer, наприклад `src/index.ts` до `dist/index.js`.

Використовуйте `openclaw.runtimeExtensions`, коли опубліковані runtime-файли не розташовані за
тими самими шляхами, що й source-записи. Якщо `runtimeExtensions` присутній, він має містити
рівно один запис для кожного запису `extensions`. Невідповідні списки провалюють встановлення й
виявлення плагіна замість тихого fallback до source-шляхів.

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

ClawHub — основний шлях розповсюдження для більшості плагінів. Поточні пакетовані
релізи OpenClaw уже містять багато офіційних плагінів, тому в нормальних установках вони не потребують
окремих npm-встановлень. Доки кожен плагін, що належить OpenClaw, не мігрує
до ClawHub, OpenClaw усе ще постачає деякі пакети плагінів `@openclaw/*` в
npm для старіших/користувацьких встановлень і прямих npm-процесів.

Якщо npm повідомляє, що пакет плагіна `@openclaw/*` deprecated, ця версія пакета
походить зі старішої зовнішньої лінійки пакетів. Використовуйте bundled-плагін із
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

### Core (постачається з OpenClaw)

<AccordionGroup>
  <Accordion title="Постачальники моделей (увімкнені за замовчуванням)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Плагіни пам'яті">
    - `memory-core` — bundled-пошук пам'яті (за замовчуванням через `plugins.slots.memory`)
    - `memory-lancedb` — довготривала пам'ять install-on-demand з auto-recall/capture (встановіть `plugins.slots.memory = "memory-lancedb"`)

    Див. [Memory LanceDB](/uk/plugins/memory-lancedb) щодо OpenAI-сумісного
    налаштування embeddings, прикладів Ollama, лімітів recall і усунення несправностей.

  </Accordion>

  <Accordion title="Постачальники мовлення (увімкнені за замовчуванням)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` — bundled-плагін браузера для browser tool, `openclaw browser` CLI, `browser.request` gateway method, browser runtime і default browser control service (увімкнено за замовчуванням; вимкніть перед заміною)
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
| `allow`          | Allowlist плагінів (необов'язково)                               |
| `deny`           | Denylist плагінів (необов'язково; deny має пріоритет)                     |
| `load.paths`     | Додаткові файли/каталоги плагінів                            |
| `slots`          | Ексклюзивні селектори слотів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>` | Перемикачі + конфігурація для кожного плагіна                               |

`plugins.allow` є ексклюзивним. Коли він непорожній, завантажуватися
або надавати інструменти можуть лише перелічені плагіни, навіть якщо `tools.allow` містить `"*"` або конкретну
назву інструмента, що належить плагіну. Якщо allowlist інструментів посилається на інструменти плагінів, додайте id плагінів-власників
до `plugins.allow` або видаліть `plugins.allow`; `openclaw doctor` попереджає про таку
форму.

Зміни конфігурації **потребують перезапуску gateway**. Якщо Gateway працює з увімкненими config
watch + in-process restart (типовий шлях `openclaw gateway`), цей
перезапуск зазвичай виконується автоматично за мить після запису конфігурації.
Немає підтримуваного шляху hot-reload для runtime-коду native-плагіна або lifecycle
hooks; перезапустіть процес Gateway, який обслуговує live-канал, перш ніж
очікувати, що оновлений код `register(api)`, хуки `api.on(...)`, інструменти, сервіси або
provider/runtime hooks почнуть виконуватися.

`openclaw plugins list` — це локальний snapshot реєстру/конфігурації плагінів.
Плагін зі статусом `enabled` там означає, що збережений реєстр і поточна конфігурація дозволяють
плагіну брати участь. Це не доводить, що вже запущений віддалений дочірній процес Gateway
перезапустився з тим самим кодом плагіна. У VPS/container-установках із
wrapper-процесами надсилайте перезапуски фактичному процесу `openclaw gateway run`
або використовуйте `openclaw gateway restart` проти запущеного Gateway.

<Accordion title="Стани плагіна: disabled vs missing vs invalid">
  - **Disabled**: плагін існує, але правила ввімкнення його вимкнули. Конфігурація зберігається.
  - **Missing**: конфігурація посилається на id плагіна, який discovery не знайшов.
  - **Invalid**: плагін існує, але його конфігурація не відповідає оголошеній схемі. Запуск Gateway пропускає лише цей плагін; `openclaw doctor --fix` може помістити недійсний запис у карантин, вимкнувши його й видаливши його config payload.

</Accordion>

## Виявлення й пріоритет

OpenClaw сканує плагіни в такому порядку (перший збіг перемагає):

<Steps>
  <Step title="Шляхи конфігурації">
    `plugins.load.paths` — явні шляхи до файлів або каталогів. Шляхи, що вказують
    назад на власні каталоги упакованих вбудованих Plugin OpenClaw, ігноруються;
    виконайте `openclaw doctor --fix`, щоб прибрати ці застарілі псевдоніми.
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

Упаковані встановлення та образи Docker зазвичай визначають вбудовані Plugin з
скомпільованого дерева `dist/extensions`. Якщо каталог вихідного коду вбудованого Plugin
змонтовано bind mount поверх відповідного упакованого шляху вихідного коду, наприклад
`/app/extensions/synology-chat`, OpenClaw розглядає цей змонтований каталог вихідного коду
як накладку джерела вбудованого Plugin і виявляє його перед упакованим бандлом
`/app/dist/extensions/synology-chat`. Це зберігає працездатність контейнерних циклів
супровідників без перемикання кожного вбудованого Plugin назад на вихідний код TypeScript.
Встановіть `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, щоб примусово використовувати упаковані dist-бандли
навіть за наявності змонтованих накладок вихідного коду.

### Правила ввімкнення

- `plugins.enabled: false` вимикає всі Plugin і пропускає роботу з виявлення/завантаження Plugin
- `plugins.deny` завжди має пріоритет над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей Plugin
- Plugin, що походять із робочого простору, **вимкнені за замовчуванням** (їх потрібно явно ввімкнути)
- Вбудовані Plugin дотримуються вбудованого набору ввімкнених за замовчуванням, якщо це не перевизначено
- Ексклюзивні слоти можуть примусово ввімкнути вибраний Plugin для цього слота
- Деякі вбудовані opt-in Plugin вмикаються автоматично, коли конфігурація називає
  поверхню, що належить Plugin, як-от посилання на модель провайдера, конфігурацію каналу або
  середовище виконання harness
- Застаріла конфігурація Plugin зберігається, доки активний `plugins.enabled: false`;
  повторно ввімкніть Plugin перед запуском очищення doctor, якщо хочете видалити застарілі id
- Маршрути Codex родини OpenAI зберігають окремі межі Plugin:
  `openai-codex/*` належить OpenAI Plugin, тоді як вбудований Plugin сервера застосунку Codex
  вибирається через `agentRuntime.id: "codex"` або застарілі посилання на моделі
  `codex/*`

## Усунення проблем із runtime hooks

Якщо Plugin відображається у `plugins list`, але побічні ефекти або hooks
`register(api)` не виконуються в live-трафіку чату, спершу перевірте таке:

- Виконайте `openclaw gateway status --deep --require-rpc` і підтвердьте, що активні
  URL Gateway, профіль, шлях конфігурації та процес саме ті, які ви редагуєте.
- Перезапустіть live Gateway після змін встановлення/конфігурації/коду Plugin. У wrapper
  контейнерах PID 1 може бути лише супервізором; перезапустіть або надішліть сигнал дочірньому
  процесу `openclaw gateway run`.
- Використайте `openclaw plugins inspect <id> --runtime --json`, щоб підтвердити реєстрації hooks і
  діагностику. Невбудовані hooks розмови, як-от `llm_input`,
  `llm_output`, `before_agent_finalize` і `agent_end`, потребують
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання моделей надавайте перевагу `before_model_resolve`. Він виконується до
  розв’язання моделі для ходів агента; `llm_output` виконується лише після того, як спроба моделі
  створить відповідь асистента.
- Для підтвердження ефективної моделі сесії використовуйте `openclaw sessions` або
  поверхні сесії/статусу Gateway, а під час налагодження payload провайдера запускайте
  Gateway з `--raw-stream --raw-stream-path <path>`.

### Дублювання володіння каналом або інструментом

Симптоми:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Це означає, що більше ніж один увімкнений Plugin намагається володіти тим самим каналом,
потоком налаштування або назвою інструмента. Найпоширеніша причина — зовнішній Plugin каналу,
встановлений поруч із вбудованим Plugin, який тепер надає той самий id каналу.

Кроки налагодження:

- Виконайте `openclaw plugins list --enabled --verbose`, щоб побачити кожен увімкнений Plugin
  і його походження.
- Виконайте `openclaw plugins inspect <id> --runtime --json` для кожного підозрюваного Plugin і
  порівняйте `channels`, `channelConfigs`, `tools` та діагностику.
- Виконайте `openclaw plugins registry --refresh` після встановлення або видалення
  пакетів Plugin, щоб збережені метадані відображали поточне встановлення.
- Перезапустіть Gateway після змін встановлення, реєстру або конфігурації.

Варіанти виправлення:

- Якщо один Plugin навмисно замінює інший для того самого id каналу, бажаний
  Plugin має оголосити `channelConfigs.<channel-id>.preferOver` з id Plugin
  нижчого пріоритету. Див. [/plugins/manifest#replacing-another-channel-plugin](/uk/plugins/manifest#replacing-another-channel-plugin).
- Якщо дублювання випадкове, вимкніть одну зі сторін за допомогою
  `plugins.entries.<plugin-id>.enabled: false` або видаліть застаріле встановлення
  Plugin.
- Якщо ви явно ввімкнули обидва Plugin, OpenClaw зберігає цей запит і
  повідомляє про конфлікт. Виберіть одного власника для каналу або перейменуйте
  інструменти, що належать Plugin, щоб поверхня runtime була однозначною.

## Слоти Plugin (ексклюзивні категорії)

Деякі категорії є ексклюзивними (активною одночасно може бути лише одна):

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
| `memory`        | Plugin активної пам’яті  | `memory-core`       |
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
Plugin). Інші вбудовані Plugin усе ще потребують `openclaw plugins enable <id>`.

`--force` перезаписує наявний встановлений Plugin або hook pack на місці. Використовуйте
`openclaw plugins update <id-or-npm-spec>` для звичайних оновлень відстежуваних npm
Plugin. Це не підтримується з `--link`, який повторно використовує шлях вихідного коду замість
копіювання поверх керованої цілі встановлення.

Коли `plugins.allow` уже задано, `openclaw plugins install` додає id
встановленого Plugin до цього allowlist перед його ввімкненням. Якщо той самий id Plugin
присутній у `plugins.deny`, встановлення видаляє цей застарілий запис deny, щоб
явне встановлення можна було завантажити одразу після перезапуску.

OpenClaw зберігає сталий локальний реєстр Plugin як модель холодного читання для
інвентаризації Plugin, володіння внесками та планування запуску. Потоки встановлення, оновлення,
видалення, ввімкнення та вимкнення оновлюють цей реєстр після зміни стану Plugin.
Той самий файл `plugins/installs.json` зберігає довговічні метадані встановлення у
верхньорівневому `installRecords` і відновлювані метадані маніфестів у `plugins`. Якщо
реєстр відсутній, застарілий або недійсний, `openclaw plugins registry
--refresh` перебудовує його подання маніфестів із записів встановлення, політики конфігурації та
метаданих маніфесту/пакета без завантаження runtime-модулів Plugin.
`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних встановлень. Передавання
специфікації npm-пакета з dist-tag або точною версією зіставляє назву пакета
назад із записом відстежуваного Plugin і записує нову специфікацію для майбутніх оновлень.
Передавання назви пакета без версії повертає точно закріплене встановлення назад до
типової лінії випусків реєстру. Якщо встановлений npm Plugin уже відповідає
розв’язаній версії та записаній ідентичності артефакту, OpenClaw пропускає оновлення
без завантаження, перевстановлення або перезапису конфігурації.

`--pin` призначений лише для npm. Він не підтримується з `--marketplace`, тому що
встановлення з marketplace зберігають метадані джерела marketplace замість npm-специфікації.

`--dangerously-force-unsafe-install` — це аварійне перевизначення для хибних
спрацьовувань вбудованого сканера небезпечного коду. Воно дозволяє встановлення Plugin
і оновлення Plugin продовжуватися після вбудованих висновків `critical`, але все одно
не обходить блокування політики Plugin `before_install` або блокування через помилку сканування.
Сканування встановлення ігнорують типові тестові файли та каталоги, як-от `tests/`,
`__tests__/`, `*.test.*` і `*.spec.*`, щоб не блокувати упаковані тестові mocks;
оголошені runtime-точки входу Plugin усе одно скануються, навіть якщо вони використовують одну з
цих назв.

Цей прапорець CLI застосовується лише до потоків встановлення/оновлення Plugin. Встановлення
залежностей Skills, що підтримуються Gateway, натомість використовують відповідне перевизначення запиту
`dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком
завантаження/встановлення Skills із ClawHub.

Якщо Plugin, який ви опублікували на ClawHub, приховано або заблоковано скануванням, відкрийте
панель ClawHub або виконайте `clawhub package rescan <name>`, щоб попросити ClawHub перевірити
його знову. `--dangerously-force-unsafe-install` впливає лише на встановлення на вашій власній
машині; він не просить ClawHub повторно просканувати Plugin або зробити заблокований реліз
публічним.

Сумісні бандли беруть участь у тому самому потоці списку/перевірки/ввімкнення/вимкнення
Plugin. Поточна підтримка runtime включає Skills бандлів, command-skills Claude,
типові значення Claude `settings.json`, типові значення Claude `.lsp.json` і оголошені в маніфесті
`lspServers`, command-skills Cursor і сумісні каталоги hooks Codex.

`openclaw plugins inspect <id>` також повідомляє про виявлені можливості бандлів, а також
підтримувані або непідтримувані записи серверів MCP і LSP для Plugin на основі бандлів.

Джерелами marketplace можуть бути відома Claude назва marketplace з
`~/.claude/plugins/known_marketplaces.json`, локальний корінь marketplace або
шлях `marketplace.json`, скорочений запис GitHub на кшталт `owner/repo`, URL
репозиторію GitHub або git URL. Для віддалених marketplace записи Plugin мають
залишатися всередині клонованого репозиторію marketplace і використовувати лише
відносні джерела шляхів.

Повні відомості див. у [довіднику CLI `openclaw plugins`](/uk/cli/plugins).

## Огляд API Plugin

Нативні Plugin експортують об’єкт входу, який надає `register(api)`. Старіші
Plugin можуть досі використовувати `activate(api)` як застарілий псевдонім, але
нові Plugin мають використовувати `register`.

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
Plugin. Завантажувач досі повертається до `activate(api)` для старіших Plugin,
але вбудовані Plugin і нові зовнішні Plugin мають вважати `register` публічним
контрактом.

`api.registrationMode` повідомляє Plugin, чому завантажується його вхід:

| Режим           | Значення                                                                                                                               |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Активація під час виконання. Реєструйте інструменти, хуки, служби, команди, маршрути та інші активні побічні ефекти.                 |
| `discovery`     | Виявлення можливостей лише для читання. Реєструйте провайдери й метадані; довірений код входу Plugin може завантажуватися, але пропускайте активні побічні ефекти. |
| `setup-only`    | Завантаження метаданих налаштування каналу через легкий вхід налаштування.                                                            |
| `setup-runtime` | Завантаження налаштування каналу, якому також потрібен вхід середовища виконання.                                                      |
| `cli-metadata`  | Лише збирання метаданих команд CLI.                                                                                                    |

Входи Plugin, які відкривають сокети, бази даних, фонових працівників або
довгоживучих клієнтів, мають захищати ці побічні ефекти через `api.registrationMode === "full"`.
Завантаження виявлення кешуються окремо від завантажень активації та не замінюють
поточний реєстр Gateway. Виявлення не активує, але не є вільним від імпорту:
OpenClaw може обчислити довірений вхід Plugin або модуль Plugin каналу, щоб
побудувати знімок. Тримайте верхній рівень модулів легким і без побічних ефектів,
а мережевих клієнтів, підпроцеси, слухачів, читання облікових даних і запуск
служб переміщуйте за шляхи повного середовища виконання.

Поширені методи реєстрації:

| Метод                                   | Що реєструє                         |
| --------------------------------------- | ----------------------------------- |
| `registerProvider`                      | Провайдер моделі (LLM)              |
| `registerChannel`                       | Канал чату                          |
| `registerTool`                          | Інструмент агента                   |
| `registerHook` / `on(...)`              | Хуки життєвого циклу                |
| `registerSpeechProvider`                | Перетворення тексту на мовлення / STT |
| `registerRealtimeTranscriptionProvider` | Потокове STT                        |
| `registerRealtimeVoiceProvider`         | Дуплексний голос у реальному часі   |
| `registerMediaUnderstandingProvider`    | Аналіз зображень/аудіо              |
| `registerImageGenerationProvider`       | Генерація зображень                 |
| `registerMusicGenerationProvider`       | Генерація музики                    |
| `registerVideoGenerationProvider`       | Генерація відео                     |
| `registerWebFetchProvider`              | Провайдер Web fetch / scrape        |
| `registerWebSearchProvider`             | Вебпошук                            |
| `registerHttpRoute`                     | HTTP endpoint                       |
| `registerCommand` / `registerCli`       | Команди CLI                         |
| `registerContextEngine`                 | Рушій контексту                     |
| `registerService`                       | Фонова служба                       |

Поведінка захисту хуків для типізованих хуків життєвого циклу:

- `before_tool_call`: `{ block: true }` є кінцевим; обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: `{ block: false }` не виконує жодної дії й не скасовує попереднє блокування.
- `before_install`: `{ block: true }` є кінцевим; обробники з нижчим пріоритетом пропускаються.
- `before_install`: `{ block: false }` не виконує жодної дії й не скасовує попереднє блокування.
- `message_sending`: `{ cancel: true }` є кінцевим; обробники з нижчим пріоритетом пропускаються.
- `message_sending`: `{ cancel: false }` не виконує жодної дії й не скасовує попереднє скасування.

Нативний сервер застосунку Codex передає нативні для Codex події інструментів
назад у цю поверхню хуків. Plugin можуть блокувати нативні інструменти Codex
через `before_tool_call`, спостерігати результати через `after_tool_call` і
брати участь у схваленнях Codex `PermissionRequest`. Міст ще не переписує
аргументи нативних інструментів Codex. Точна межа підтримки середовища виконання
Codex описана в [контракті підтримки Codex harness v1](/uk/plugins/codex-harness#v1-support-contract).

Повну поведінку типізованих хуків див. в [огляді SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Створення Plugin](/uk/plugins/building-plugins) — створіть власний Plugin
- [Пакети Plugin](/uk/plugins/bundles) — сумісність пакетів Codex/Claude/Cursor
- [Маніфест Plugin](/uk/plugins/manifest) — схема маніфесту
- [Реєстрація інструментів](/uk/plugins/building-plugins#registering-agent-tools) — додайте інструменти агента в Plugin
- [Внутрішня архітектура Plugin](/uk/plugins/architecture) — модель можливостей і конвеєр завантаження
- [Plugin спільноти](/uk/plugins/community) — списки сторонніх розробників
