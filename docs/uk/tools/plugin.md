---
read_when:
    - Встановлення або налаштування Plugin
    - Розуміння правил виявлення та завантаження Plugin
    - Робота з пакетами Plugin, сумісними з Codex/Claude
sidebarTitle: Install and Configure
summary: Встановлюйте, налаштовуйте й керуйте плагінами OpenClaw
title: Плагіни
x-i18n:
    generated_at: "2026-05-02T02:02:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9e68612f5bf538ba8f38d96bd85a0b4f044e203ecf647caef070965a4a96d99b
    source_path: tools/plugin.md
    workflow: 16
---

Плагіни розширюють OpenClaw новими можливостями: каналами, постачальниками моделей,
оболонками агентів, інструментами, Skills, мовленням, транскрибуванням у реальному часі, голосом у реальному часі,
розумінням медіа, генерацією зображень, генерацією відео, веб-отриманням, веб-пошуком
тощо. Деякі плагіни є **основними** (постачаються з OpenClaw), інші
є **зовнішніми**. Більшість зовнішніх плагінів публікуються й знаходяться через
[ClawHub](/uk/tools/clawhub). Npm залишається підтримуваним для прямих установлень і для
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

    Використовуйте `--runtime`, коли потрібно підтвердити зареєстровані інструменти, сервіси, методи Gateway,
    хуки або CLI-команди, що належать плагіну. Звичайний `inspect` є холодною
    перевіркою маніфесту/реєстру й навмисно уникає імпортування середовища виконання плагіна.

  </Step>
</Steps>

Якщо ви віддаєте перевагу керуванню прямо з чату, увімкніть `commands.plugins: true` і використовуйте:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Шлях установлення використовує той самий резолвер, що й CLI: локальний шлях/архів, явний
`clawhub:<pkg>`, явний `npm:<pkg>`, явний `git:<repo>` або просту специфікацію пакета
(спочатку ClawHub, потім резервний npm).

Якщо конфігурація недійсна, установлення зазвичай завершується закрито й спрямовує вас до
`openclaw doctor --fix`. Єдиний виняток для відновлення — вузький шлях перевстановлення вбудованого плагіна
для плагінів, які вмикають
`openclaw.install.allowInvalidConfigRecovery`.
Під час запуску Gateway недійсна конфігурація одного плагіна ізолюється до цього плагіна:
запуск записує проблему `plugins.entries.<id>.config` у журнали, пропускає цей плагін під час
завантаження та залишає інші плагіни й канали онлайн. Запустіть `openclaw doctor --fix`,
щоб помістити неправильну конфігурацію плагіна в карантин, вимкнувши цей запис плагіна й видаливши
його недійсний конфігураційний вміст; звичайна резервна копія конфігурації зберігає попередні значення.
Коли конфігурація каналу посилається на плагін, який більше не можна знайти, але той самий
застарілий ідентифікатор плагіна залишається в конфігурації плагінів або записах установлення, запуск Gateway
записує попередження й пропускає цей канал замість блокування всіх інших каналів.
Запустіть `openclaw doctor --fix`, щоб видалити застарілі записи каналу/плагіна; невідомі
ключі каналів без ознак застарілого плагіна все ще спричиняють помилку валідації, щоб друкарські помилки залишалися
помітними.
Якщо встановлено `plugins.enabled: false`, застарілі посилання на плагіни вважаються інертними:
запуск Gateway пропускає виявлення/завантаження плагінів, а `openclaw doctor` зберігає
вимкнену конфігурацію плагінів замість автоматичного видалення. Знову ввімкніть плагіни перед
запуском очищення doctor, якщо хочете видалити застарілі ідентифікатори плагінів.

Установлення залежностей плагіна відбувається лише під час явних потоків установлення/оновлення або
ремонту doctor. Запуск Gateway, перезавантаження конфігурації та інспекція середовища виконання
не запускають менеджери пакетів і не ремонтують дерева залежностей. Локальні плагіни вже повинні
мати встановлені залежності, тоді як npm, git і ClawHub-плагіни
встановлюються в керовані OpenClaw корені плагінів. Залежності npm можуть підійматися
в межах керованого npm-кореня OpenClaw; установлення/оновлення сканує цей керований корінь перед
довірою, а видалення прибирає керовані npm пакети через npm. Зовнішні плагіни
й користувацькі шляхи завантаження все одно мають установлюватися через `openclaw plugins install`.
Див. [Розв’язання залежностей плагінів](/uk/plugins/dependency-resolution) щодо
життєвого циклу під час установлення.

Вихідні checkout-и є pnpm workspace-ами. Якщо ви клонуєте OpenClaw, щоб працювати над вбудованими
плагінами, запустіть `pnpm install`; після цього OpenClaw завантажує вбудовані плагіни з
`extensions/<id>`, тож редагування й локальні залежності пакета використовуються напряму.
Звичайні кореневі встановлення npm призначені для запакованого OpenClaw, а не для розробки
з вихідного checkout-а.

## Типи плагінів

OpenClaw розпізнає два формати плагінів:

| Формат     | Як це працює                                                       | Приклади                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Нативний** | `openclaw.plugin.json` + модуль середовища виконання; виконується в процесі       | Офіційні плагіни, спільнотні npm-пакети               |
| **Bundle** | Сумісна з Codex/Claude/Cursor структура; зіставляється з функціями OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва відображаються в `openclaw plugins list`. Див. [Plugin Bundles](/uk/plugins/bundles) для деталей про bundle-и.

Якщо ви пишете нативний плагін, почніть із [Створення плагінів](/uk/plugins/building-plugins)
і [Огляду Plugin SDK](/uk/plugins/sdk-overview).

## Точки входу пакета

Npm-пакети нативних плагінів мають оголошувати `openclaw.extensions` у `package.json`.
Кожен запис має залишатися всередині каталогу пакета й розв’язуватися в читаний
файл середовища виконання або у файл вихідного коду TypeScript з виведеним зібраним JavaScript-
відповідником, наприклад `src/index.ts` до `dist/index.js`.

Використовуйте `openclaw.runtimeExtensions`, коли опубліковані файли середовища виконання не розташовані
за тими самими шляхами, що й вихідні записи. Якщо присутній `runtimeExtensions`, він має містити
рівно один запис для кожного запису `extensions`. Невідповідні списки спричиняють помилку встановлення й
виявлення плагінів замість тихого повернення до вихідних шляхів. Якщо ви також
публікуєте `openclaw.setupEntry`, використовуйте `openclaw.runtimeSetupEntry` для його зібраного
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

ClawHub є основним шляхом розповсюдження для більшості плагінів. Поточні запаковані
випуски OpenClaw уже містять багато офіційних плагінів, тому вони не потребують
окремих npm-установлень у звичайних налаштуваннях. Доки кожен плагін, що належить OpenClaw, не
мігрує до ClawHub, OpenClaw усе ще постачає деякі пакети плагінів `@openclaw/*` на
npm для старіших/користувацьких установлень і прямих npm-процесів.

Якщо npm повідомляє про пакет плагіна `@openclaw/*` як застарілий, ця версія пакета
належить до старішої зовнішньої гілки пакетів. Використовуйте вбудований плагін із
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
  <Accordion title="Постачальники моделей (увімкнено за замовчуванням)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Плагіни пам’яті">
    - `memory-core` — вбудований пошук пам’яті (за замовчуванням через `plugins.slots.memory`)
    - `memory-lancedb` — довготривала пам’ять на базі LanceDB з автоматичним пригадуванням/захопленням (встановіть `plugins.slots.memory = "memory-lancedb"`)

    Див. [Memory LanceDB](/uk/plugins/memory-lancedb) для налаштування embeddings, сумісних з OpenAI,
    прикладів Ollama, обмежень пригадування та усунення несправностей.

  </Accordion>

  <Accordion title="Постачальники мовлення (увімкнено за замовчуванням)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` — вбудований browser-плагін для інструмента browser, CLI `openclaw browser`, gateway-методу `browser.request`, середовища виконання browser і стандартного сервісу керування browser (увімкнено за замовчуванням; вимкніть перед заміною)
    - `copilot-proxy` — міст VS Code Copilot Proxy (вимкнено за замовчуванням)

  </Accordion>
</AccordionGroup>

Шукаєте сторонні плагіни? Див. [Спільнотні плагіни](/uk/plugins/community).

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
| `entries.\<id\>` | Перемикачі й конфігурація для окремого плагіна                               |

`plugins.allow` є ексклюзивним. Коли він непорожній, завантажуватися
або відкривати інструменти можуть лише перелічені плагіни, навіть якщо `tools.allow` містить `"*"` або конкретну
назву інструмента, що належить плагіну. Якщо список дозволених інструментів посилається на інструменти плагінів, додайте ідентифікатори плагінів-власників
до `plugins.allow` або видаліть `plugins.allow`; `openclaw doctor` попереджає про таку
форму.

Зміни конфігурації **потребують перезапуску gateway**. Якщо Gateway працює з увімкненим спостереженням за конфігурацією
та перезапуском у процесі (стандартний шлях `openclaw gateway`), такий
перезапуск зазвичай виконується автоматично за мить після запису конфігурації.
Немає підтримуваного шляху гарячого перезавантаження для нативного коду середовища виконання плагіна або lifecycle-
хуків; перезапустіть процес Gateway, який обслуговує живий канал, перш ніж
очікувати виконання оновленого коду `register(api)`, хуків `api.on(...)`, інструментів, сервісів або
provider/runtime-хуків.

`openclaw plugins list` — це локальний знімок реєстру/конфігурації плагінів. Увімкнений
там плагін означає, що збережений реєстр і поточна конфігурація дозволяють
плагіну брати участь. Це не доводить, що вже запущений віддалений дочірній процес Gateway
перезапустився з тим самим кодом плагіна. У VPS/container-налаштуваннях із
процесами-обгортками надсилайте перезапуски до фактичного процесу `openclaw gateway run`
або використовуйте `openclaw gateway restart` проти запущеного Gateway.

<Accordion title="Стани Plugin: вимкнений vs відсутній vs недійсний">
  - **Вимкнений**: plugin існує, але правила ввімкнення вимкнули його. Конфігурація зберігається.
  - **Відсутній**: конфігурація посилається на id plugin, який виявлення не знайшло.
  - **Недійсний**: plugin існує, але його конфігурація не відповідає оголошеній схемі. Запуск Gateway пропускає лише цей plugin; `openclaw doctor --fix` може ізолювати недійсний запис, вимкнувши його та видаливши його конфігураційне навантаження.

</Accordion>

## Виявлення та пріоритет

OpenClaw сканує plugins у такому порядку (перший збіг перемагає):

<Steps>
  <Step title="Шляхи конфігурації">
    `plugins.load.paths` — явні шляхи до файлів або каталогів. Шляхи, що вказують
    назад на власні упаковані каталоги bundled plugin OpenClaw, ігноруються;
    виконайте `openclaw doctor --fix`, щоб видалити ці застарілі псевдоніми.
  </Step>

  <Step title="Plugins робочої області">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` і `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Глобальні plugins">
    `~/.openclaw/<plugin-root>/*.ts` і `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Bundled plugins">
    Постачаються з OpenClaw. Багато з них увімкнено за замовчуванням (постачальники моделей, мовлення).
    Інші потребують явного ввімкнення.
  </Step>
</Steps>

Упаковані інсталяції та Docker-образи зазвичай розв’язують bundled plugins із
скомпільованого дерева `dist/extensions`. Якщо каталог джерел bundled plugin
змонтовано поверх відповідного упакованого шляху джерел, наприклад
`/app/extensions/synology-chat`, OpenClaw розглядає цей змонтований каталог джерел
як overlay bundled source і виявляє його перед упакованим bundle
`/app/dist/extensions/synology-chat`. Це зберігає робочими контейнерні
цикли супровідників без повернення кожного bundled plugin до TypeScript-джерел.
Установіть `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, щоб примусово використовувати упаковані dist bundles
навіть за наявності змонтованих source overlay.

### Правила ввімкнення

- `plugins.enabled: false` вимикає всі plugins і пропускає роботу з виявлення/завантаження plugin
- `plugins.deny` завжди має перевагу над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей plugin
- Plugins із робочої області **вимкнені за замовчуванням** (їх потрібно явно ввімкнути)
- Bundled plugins дотримуються вбудованого набору ввімкнених за замовчуванням, якщо це не перевизначено
- Ексклюзивні слоти можуть примусово ввімкнути вибраний plugin для цього слота
- Деякі bundled opt-in plugins вмикаються автоматично, коли конфігурація називає
  поверхню, що належить plugin, наприклад посилання на модель постачальника, конфігурацію каналу або runtime
  harness
- Застаріла конфігурація plugin зберігається, доки активний `plugins.enabled: false`;
  знову ввімкніть plugins перед запуском очищення doctor, якщо хочете видалити застарілі ids
- Маршрути Codex сімейства OpenAI зберігають окремі межі plugin:
  `openai-codex/*` належить OpenAI plugin, тоді як bundled Codex
  app-server plugin вибирається через `agentRuntime.id: "codex"` або застарілі
  посилання на моделі `codex/*`

## Усунення проблем із runtime hooks

Якщо plugin з’являється в `plugins list`, але побічні ефекти `register(api)` або hooks
не виконуються в живому трафіку чату, спочатку перевірте таке:

- Виконайте `openclaw gateway status --deep --require-rpc` і підтвердьте, що активні
  URL Gateway, профіль, шлях конфігурації та процес є саме тими, які ви редагуєте.
- Перезапустіть живий Gateway після змін інсталяції/config/code plugin. У wrapper
  containers PID 1 може бути лише supervisor; перезапустіть або надішліть сигнал дочірньому
  процесу `openclaw gateway run`.
- Використайте `openclaw plugins inspect <id> --runtime --json`, щоб підтвердити реєстрації hooks і
  діагностику. Non-bundled conversation hooks, як-от `llm_input`,
  `llm_output`, `before_agent_finalize` і `agent_end`, потребують
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання моделей надавайте перевагу `before_model_resolve`. Він виконується перед розв’язанням моделі
  для ходів агента; `llm_output` виконується лише після того, як спроба моделі
  створить вивід assistant.
- Для доказу ефективної моделі сесії використовуйте `openclaw sessions` або
  поверхні сесії/статусу Gateway і, під час налагодження provider payloads, запускайте
  Gateway з `--raw-stream --raw-stream-path <path>`.

### Повільне налаштування інструментів plugin

Якщо ходи агента, здається, зависають під час підготовки інструментів, увімкніть trace logging і
перевірте рядки часу виконання factory інструментів plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Шукайте:

```text
[trace:plugin-tools] factory timings ...
```

Підсумок перелічує загальний час factory і найповільніші factories інструментів plugin,
зокрема id plugin, оголошені назви інструментів, форму результату та чи є інструмент
необов’язковим. Повільні рядки підвищуються до warnings, коли один factory займає
щонайменше 1s або загальна підготовка factory інструментів plugin займає щонайменше 5s.

Якщо один plugin домінує в часі, перевірте його runtime registrations:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Потім оновіть, перевстановіть або вимкніть цей plugin. Автори Plugin мають переносити
дороге завантаження залежностей за шлях виконання інструмента, а не робити це
всередині tool factory.

### Дублювання власності каналу або інструмента

Симптоми:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Це означає, що більше ніж один увімкнений plugin намагається володіти тим самим каналом,
setup flow або назвою інструмента. Найпоширеніша причина — зовнішній channel plugin,
встановлений поруч із bundled plugin, який тепер надає той самий channel id.

Кроки налагодження:

- Виконайте `openclaw plugins list --enabled --verbose`, щоб побачити кожен увімкнений plugin
  і його походження.
- Виконайте `openclaw plugins inspect <id> --runtime --json` для кожного підозрюваного plugin і
  порівняйте `channels`, `channelConfigs`, `tools` і діагностику.
- Виконайте `openclaw plugins registry --refresh` після встановлення або видалення
  пакетів plugin, щоб збережені метадані відображали поточну інсталяцію.
- Перезапустіть Gateway після змін інсталяції, registry або конфігурації.

Варіанти виправлення:

- Якщо один plugin навмисно замінює інший для того самого channel id, бажаний
  plugin має оголосити `channelConfigs.<channel-id>.preferOver` з
  id plugin нижчого пріоритету. Див. [/plugins/manifest#replacing-another-channel-plugin](/uk/plugins/manifest#replacing-another-channel-plugin).
- Якщо дублювання випадкове, вимкніть одну сторону за допомогою
  `plugins.entries.<plugin-id>.enabled: false` або видаліть застарілу інсталяцію plugin.
- Якщо ви явно ввімкнули обидва plugins, OpenClaw зберігає цей запит і
  повідомляє про конфлікт. Виберіть одного власника для каналу або перейменуйте інструменти,
  що належать plugin, щоб runtime surface була однозначною.

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

| Слот            | Що він контролює      | За замовчуванням             |
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

Bundled plugins постачаються з OpenClaw. Багато з них увімкнено за замовчуванням (наприклад
bundled model providers, bundled speech providers і bundled browser
plugin). Інші bundled plugins усе ще потребують `openclaw plugins enable <id>`.

`--force` перезаписує наявний установлений plugin або hook pack на місці. Використовуйте
`openclaw plugins update <id-or-npm-spec>` для звичайних оновлень відстежуваних npm
plugins. Це не підтримується з `--link`, який повторно використовує шлях джерел замість
копіювання поверх керованої цілі інсталяції.

Коли `plugins.allow` уже встановлено, `openclaw plugins install` додає
id встановленого plugin до цього allowlist перед увімкненням. Якщо той самий id plugin
наявний у `plugins.deny`, install видаляє цей застарілий deny-запис, щоб
явна інсталяція одразу завантажувалася після перезапуску.

OpenClaw зберігає постійний локальний registry plugin як cold read model для
інвентарю plugin, власності внесків і планування запуску. Потоки install, update,
uninstall, enable і disable оновлюють цей registry після зміни стану plugin.
Той самий файл `plugins/installs.json` зберігає довговічні метадані інсталяції в
верхньорівневому `installRecords` і перебудовувані manifest metadata в `plugins`. Якщо
registry відсутній, застарілий або недійсний, `openclaw plugins registry
--refresh` перебудовує його manifest view із записів інсталяції, config policy і
metadata manifest/package без завантаження runtime modules plugin.
`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних інсталяцій. Передавання
npm package spec із dist-tag або точною версією розв’язує назву пакета
назад до відстежуваного запису plugin і записує нову spec для майбутніх оновлень.
Передавання назви пакета без версії переміщує точну закріплену інсталяцію назад до
стандартної release line registry. Якщо встановлений npm plugin уже відповідає
розв’язаній версії та записаній ідентичності артефакту, OpenClaw пропускає оновлення
без завантаження, перевстановлення або переписування конфігурації.

`--pin` підтримується лише для npm. Він не підтримується з `--marketplace`, оскільки
marketplace installs зберігають metadata marketplace source замість npm spec.

`--dangerously-force-unsafe-install` — це аварійне перевизначення для хибних
спрацьовувань вбудованого сканера небезпечного коду. Воно дозволяє продовжувати
встановлення Plugin і оновлення Plugin попри вбудовані знахідки рівня
`critical`, але все одно не обходить блокування політик Plugin `before_install`
або блокування через збій сканування. Сканування встановлення ігнорує поширені
тестові файли й каталоги, як-от `tests/`, `__tests__/`, `*.test.*` і
`*.spec.*`, щоб не блокувати запаковані тестові моки; оголошені runtime-точки
входу Plugin все одно скануються, навіть якщо використовують одну з цих назв.

Цей прапорець CLI застосовується лише до потоків встановлення/оновлення Plugin.
Встановлення залежностей Skills за підтримки Gateway натомість використовують
відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як
`openclaw skills install` залишається окремим потоком завантаження/встановлення
Skills із ClawHub.

Якщо Plugin, який ви опублікували на ClawHub, приховано або заблоковано
скануванням, відкрийте панель ClawHub або виконайте
`clawhub package rescan <name>`, щоб попросити ClawHub перевірити його ще раз.
`--dangerously-force-unsafe-install` впливає лише на встановлення на вашому
власному комп’ютері; він не просить ClawHub повторно сканувати Plugin і не
робить заблокований випуск публічним.

Сумісні пакети беруть участь у тому самому потоці списку/перегляду/увімкнення/вимкнення
Plugin. Поточна підтримка runtime охоплює пакетні Skills, командні Skills Claude,
типові значення Claude `settings.json`, типові значення Claude `.lsp.json` і
оголошені в маніфесті типові значення `lspServers`, командні Skills Cursor і
сумісні каталоги хуків Codex.

`openclaw plugins inspect <id>` також повідомляє виявлені можливості пакета, а
також підтримувані або непідтримувані записи серверів MCP і LSP для Plugin на
основі пакетів.

Джерелами маркетплейсу можуть бути назва відомого маркетплейсу Claude з
`~/.claude/plugins/known_marketplaces.json`, корінь локального маркетплейсу або
шлях до `marketplace.json`, скорочення GitHub на кшталт `owner/repo`, URL
репозиторію GitHub або git URL. Для віддалених маркетплейсів записи Plugin мають
залишатися всередині клонованого репозиторію маркетплейсу й використовувати лише
джерела з відносними шляхами.

Повні відомості див. у [довіднику CLI `openclaw plugins`](/uk/cli/plugins).

## Огляд API Plugin

Нативні Plugin експортують об’єкт входу, який надає `register(api)`. Старіші
Plugin можуть усе ще використовувати `activate(api)` як застарілий псевдонім,
але нові Plugin мають використовувати `register`.

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
але вбудовані Plugin і нові зовнішні Plugin мають вважати `register` публічним
контрактом.

`api.registrationMode` повідомляє Plugin, чому його запис завантажується:

| Режим           | Значення                                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Активація runtime. Реєструє інструменти, хуки, сервіси, команди, маршрути та інші активні побічні ефекти.                      |
| `discovery`     | Виявлення можливостей лише для читання. Реєструє провайдерів і метадані; довірений код входу Plugin може завантажуватися, але активні побічні ефекти слід пропускати. |
| `setup-only`    | Завантаження метаданих налаштування каналу через полегшений запис налаштування.                                                |
| `setup-runtime` | Завантаження налаштування каналу, якому також потрібен запис runtime.                                                          |
| `cli-metadata`  | Лише збирання метаданих команд CLI.                                                                                            |

Записи Plugin, які відкривають сокети, бази даних, фонові воркери або
довготривалі клієнти, мають захищати ці побічні ефекти перевіркою
`api.registrationMode === "full"`. Завантаження виявлення кешуються окремо від
активаційних завантажень і не замінюють запущений реєстр Gateway. Виявлення є
неактиваційним, але не без імпорту: OpenClaw може виконати довірений запис
Plugin або модуль Plugin каналу, щоб побудувати знімок. Тримайте верхні рівні
модулів легкими й без побічних ефектів, а мережеві клієнти, підпроцеси,
слухачі, читання облікових даних і запуск сервісів переносьте за шляхи повного
runtime.

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
| `registerWebFetchProvider`              | Провайдер веботримання / скрапінгу  |
| `registerWebSearchProvider`             | Вебпошук                            |
| `registerHttpRoute`                     | HTTP-ендпойнт                       |
| `registerCommand` / `registerCli`       | Команди CLI                         |
| `registerContextEngine`                 | Рушій контексту                     |
| `registerService`                       | Фоновий сервіс                      |

Поведінка захисту хуків для типізованих хуків життєвого циклу:

- `before_tool_call`: `{ block: true }` є кінцевим; обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: `{ block: false }` не виконує дії й не скасовує попереднє блокування.
- `before_install`: `{ block: true }` є кінцевим; обробники з нижчим пріоритетом пропускаються.
- `before_install`: `{ block: false }` не виконує дії й не скасовує попереднє блокування.
- `message_sending`: `{ cancel: true }` є кінцевим; обробники з нижчим пріоритетом пропускаються.
- `message_sending`: `{ cancel: false }` не виконує дії й не скасовує попереднє скасування.

Нативний сервер застосунку Codex передає нативні події інструментів Codex назад
у цю поверхню хуків. Plugin можуть блокувати нативні інструменти Codex через
`before_tool_call`, спостерігати результати через `after_tool_call` і брати
участь у схваленнях Codex `PermissionRequest`. Міст поки що не переписує
аргументи нативних інструментів Codex. Точна межа підтримки runtime Codex
описана в [контракті підтримки Codex harness v1](/uk/plugins/codex-harness#v1-support-contract).

Повну поведінку типізованих хуків див. в [огляді SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Створення Plugin](/uk/plugins/building-plugins) — створіть власний Plugin
- [Пакети Plugin](/uk/plugins/bundles) — сумісність пакетів Codex/Claude/Cursor
- [Маніфест Plugin](/uk/plugins/manifest) — схема маніфесту
- [Реєстрація інструментів](/uk/plugins/building-plugins#registering-agent-tools) — додайте інструменти агента в Plugin
- [Внутрішня архітектура Plugin](/uk/plugins/architecture) — модель можливостей і конвеєр завантаження
- [Спільнотні Plugin](/uk/plugins/community) — списки сторонніх Plugin
