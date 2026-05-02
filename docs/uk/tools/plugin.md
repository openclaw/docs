---
read_when:
    - Встановлення або налаштування плагінів
    - Розуміння правил виявлення та завантаження Plugin
    - Робота з пакетами Plugin, сумісними з Codex/Claude
sidebarTitle: Install and Configure
summary: Встановлення, налаштування та керування плагінами OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-05-02T03:16:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9378ef4a6aef26949148702f2f6d8537811869511e8830ae5c3d560ff06d98b
    source_path: tools/plugin.md
    workflow: 16
---

Plugins розширюють OpenClaw новими можливостями: канали, постачальники моделей,
оболонки агентів, інструменти, skills, мовлення, транскрипція в реальному часі,
голос у реальному часі, розуміння медіа, генерація зображень, генерація відео,
отримання вебданих, вебпошук тощо. Деякі plugins є **основними** (постачаються з OpenClaw), інші
є **зовнішніми**. Більшість зовнішніх plugins публікуються й виявляються через
[ClawHub](/uk/tools/clawhub). Npm і надалі підтримується для прямих встановлень і для
тимчасового набору пакетів plugins, що належать OpenClaw, доки ця міграція завершується.

## Швидкий старт

<Steps>
  <Step title="Перегляньте, що завантажено">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Установіть plugin">
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

  <Step title="Перевірте plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Використовуйте `--runtime`, коли потрібно підтвердити зареєстровані інструменти, сервіси, методи gateway,
    hooks або CLI-команди, що належать plugin. Звичайний `inspect` — це холодна
    перевірка маніфесту/реєстру, яка навмисно уникає імпорту runtime plugin.

  </Step>
</Steps>

Якщо ви віддаєте перевагу керуванню, природному для чату, увімкніть `commands.plugins: true` і використовуйте:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Шлях встановлення використовує той самий резолвер, що й CLI: локальний шлях/архів, явний
`clawhub:<pkg>`, явний `npm:<pkg>`, явний `git:<repo>` або проста специфікація пакета
(спершу ClawHub, потім резервний npm).

Якщо конфігурація недійсна, встановлення зазвичай безпечно завершується помилкою й спрямовує вас до
`openclaw doctor --fix`. Єдиний виняток для відновлення — вузький шлях повторного встановлення bundled-plugin
для plugins, які явно вмикають
`openclaw.install.allowInvalidConfigRecovery`.
Під час запуску Gateway недійсна конфігурація одного plugin ізолюється до цього plugin:
запуск записує в лог проблему `plugins.entries.<id>.config`, пропускає цей plugin під час
завантаження й залишає інші plugins і канали онлайн. Запустіть `openclaw doctor --fix`,
щоб помістити погану конфігурацію plugin у карантин, вимкнувши цей запис plugin і видаливши
його недійсне конфігураційне навантаження; звичайна резервна копія конфігурації зберігає попередні значення.
Коли конфігурація каналу посилається на plugin, який більше не можна виявити, але той самий
застарілий ідентифікатор plugin залишається в конфігурації plugin або записах встановлення, запуск Gateway
записує попередження й пропускає цей канал замість блокування всіх інших каналів.
Запустіть `openclaw doctor --fix`, щоб видалити застарілі записи каналу/plugin; невідомі
ключі каналів без доказів застарілого plugin і надалі не проходять валідацію, тож помилки введення залишаються
видимими.
Якщо встановлено `plugins.enabled: false`, застарілі посилання на plugin вважаються інертними:
запуск Gateway пропускає роботу з виявлення/завантаження plugin, а `openclaw doctor` зберігає
вимкнену конфігурацію plugin замість автоматичного видалення. Увімкніть plugins повторно перед
запуском очищення doctor, якщо хочете видалити застарілі ідентифікатори plugin.

Встановлення залежностей plugin відбувається лише під час явних потоків встановлення/оновлення або
ремонту doctor. Запуск Gateway, перезавантаження конфігурації та runtime-перевірка не
запускають менеджери пакетів і не ремонтують дерева залежностей. Локальні plugins уже мають
мати встановлені залежності, тоді як npm, git і ClawHub plugins
встановлюються в керованих коренях plugins OpenClaw. Залежності npm можуть бути підняті
в межах керованого npm-кореня OpenClaw; встановлення/оновлення сканує цей керований корінь перед
довірою, а видалення прибирає npm-керовані пакети через npm. Зовнішні plugins
і користувацькі шляхи завантаження все одно мають встановлюватися через `openclaw plugins install`.
Див. [Розв’язання залежностей Plugin](/uk/plugins/dependency-resolution) щодо життєвого циклу
під час встановлення.

Вихідні checkout-и є pnpm workspaces. Якщо ви клонуєте OpenClaw, щоб працювати над bundled
plugins, запустіть `pnpm install`; після цього OpenClaw завантажує bundled plugins з
`extensions/<id>`, тож зміни й локальні залежності пакета використовуються напряму.
Звичайні кореневі встановлення npm призначені для packaged OpenClaw, а не для розробки
з source checkout.

## Типи Plugin

OpenClaw розпізнає два формати plugin:

| Формат     | Як це працює                                                     | Приклади                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + runtime-модуль; виконується в процесі       | Офіційні plugins, пакети спільноти npm               |
| **Bundle** | Макет, сумісний із Codex/Claude/Cursor; зіставляється з функціями OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва відображаються в `openclaw plugins list`. Див. [Plugin Bundles](/uk/plugins/bundles) для подробиць про bundle.

Якщо ви пишете native plugin, почніть із [Створення Plugins](/uk/plugins/building-plugins)
та [Огляду Plugin SDK](/uk/plugins/sdk-overview).

## Точки входу пакета

Пакети npm із native plugin мають оголошувати `openclaw.extensions` у `package.json`.
Кожен запис має залишатися всередині каталогу пакета й розв’язуватися в доступний для читання
runtime-файл або у вихідний файл TypeScript з виведеним збудованим JavaScript
відповідником, наприклад від `src/index.ts` до `dist/index.js`.

Використовуйте `openclaw.runtimeExtensions`, коли опубліковані runtime-файли не розташовані за
тими самими шляхами, що й вихідні записи. Коли `runtimeExtensions` присутній, він має містити
рівно один запис для кожного запису `extensions`. Невідповідні списки спричиняють помилку встановлення й
виявлення plugin замість тихого повернення до вихідних шляхів. Якщо ви також
публікуєте `openclaw.setupEntry`, використовуйте `openclaw.runtimeSetupEntry` для його збудованого
JavaScript-відповідника; цей файл обов’язковий, якщо його оголошено.

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

ClawHub є основним шляхом розповсюдження для більшості plugins. Поточні packaged
релізи OpenClaw уже містять багато офіційних plugins, тому вони не потребують
окремих встановлень npm у звичайних налаштуваннях. Доки кожен plugin, що належить OpenClaw, не
мігрував до ClawHub, OpenClaw усе ще постачає деякі пакети plugins `@openclaw/*` на
npm для старіших/користувацьких встановлень і прямих npm-процесів.

Якщо npm повідомляє, що пакет plugin `@openclaw/*` застарілий, ця версія пакета
належить до старішої зовнішньої лінійки пакетів. Використовуйте bundled plugin із
поточного OpenClaw або локальний checkout, доки не буде опубліковано новіший пакет npm.

| Plugin          | Пакет                      | Документація                               |
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

  <Accordion title="Memory plugins">
    - `memory-core` — bundled memory search (типово через `plugins.slots.memory`)
    - `memory-lancedb` — довгострокова пам’ять на базі LanceDB з автоматичним recall/capture (установіть `plugins.slots.memory = "memory-lancedb"`)

    Див. [Memory LanceDB](/uk/plugins/memory-lancedb) щодо OpenAI-сумісного
    налаштування embeddings, прикладів Ollama, обмежень recall і усунення несправностей.

  </Accordion>

  <Accordion title="Постачальники мовлення (увімкнено за замовчуванням)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` — bundled browser plugin для browser tool, CLI `openclaw browser`, gateway-методу `browser.request`, browser runtime і типового сервісу керування browser (увімкнено за замовчуванням; вимкніть перед заміною)
    - `copilot-proxy` — міст VS Code Copilot Proxy (вимкнено за замовчуванням)

  </Accordion>
</AccordionGroup>

Шукаєте сторонні plugins? Див. [Community Plugins](/uk/plugins/community).

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
| `enabled`        | Головний перемикач (типово: `true`)                       |
| `allow`          | Allowlist plugins (необов’язково)                         |
| `deny`           | Denylist plugins (необов’язково; deny має пріоритет)      |
| `load.paths`     | Додаткові файли/каталоги plugins                          |
| `slots`          | Ексклюзивні селектори слотів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>` | Перемикачі й конфігурація для окремого plugin             |

`plugins.allow` є ексклюзивним. Коли він непорожній, завантажуватися
або надавати інструменти можуть лише перелічені plugins, навіть якщо `tools.allow` містить `"*"` або конкретну назву
інструмента, що належить plugin. Якщо allowlist інструментів посилається на інструменти plugin, додайте ідентифікатори plugins-власників
до `plugins.allow` або видаліть `plugins.allow`; `openclaw doctor` попереджає про таку
структуру.

Зміни конфігурації **потребують перезапуску gateway**. Якщо Gateway працює з config
watch + увімкненим in-process restart (типовий шлях `openclaw gateway`), цей
перезапуск зазвичай виконується автоматично невдовзі після запису конфігурації.
Підтримуваного шляху hot-reload для runtime-коду native plugin або lifecycle
hooks немає; перезапустіть процес Gateway, який обслуговує live-канал, перш ніж
очікувати, що оновлений код `register(api)`, hooks `api.on(...)`, інструменти, сервіси або
provider/runtime hooks почнуть виконуватися.

`openclaw plugins list` — це локальний знімок реєстру/конфігурації плагінів. Плагін зі станом
`enabled` там означає, що збережений реєстр і поточна конфігурація дозволяють
плагіну брати участь. Це не доводить, що вже запущений віддалений дочірній процес
Gateway перезапустився з тим самим кодом плагіна. У налаштуваннях VPS/контейнерів
із процесами-обгортками надсилайте перезапуски фактичному процесу
`openclaw gateway run` або використовуйте `openclaw gateway restart` для запущеного Gateway.

<Accordion title="Стани плагіна: вимкнений, відсутній, недійсний">
  - **Вимкнений**: плагін існує, але правила ввімкнення вимкнули його. Конфігурацію збережено.
  - **Відсутній**: конфігурація посилається на ідентифікатор плагіна, який виявлення не знайшло.
  - **Недійсний**: плагін існує, але його конфігурація не відповідає оголошеній схемі. Запуск Gateway пропускає лише цей плагін; `openclaw doctor --fix` може ізолювати недійсний запис, вимкнувши його та видаливши його конфігураційне навантаження.

</Accordion>

## Виявлення та пріоритет

OpenClaw шукає плагіни в такому порядку (перший збіг перемагає):

<Steps>
  <Step title="Шляхи конфігурації">
    `plugins.load.paths` — явні шляхи до файлів або каталогів. Шляхи, що вказують
    назад на власні пакетовані каталоги вбудованих плагінів OpenClaw, ігноруються;
    запустіть `openclaw doctor --fix`, щоб видалити ці застарілі псевдоніми.
  </Step>

  <Step title="Плагіни робочої області">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` і `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Глобальні плагіни">
    `~/.openclaw/<plugin-root>/*.ts` і `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Вбудовані плагіни">
    Постачаються з OpenClaw. Багато з них увімкнені типово (постачальники моделей, мовлення).
    Інші потребують явного ввімкнення.
  </Step>
</Steps>

Пакетовані встановлення й Docker-образи зазвичай розв’язують вбудовані плагіни з
скомпільованого дерева `dist/extensions`. Якщо вихідний каталог вбудованого плагіна
змонтовано bind mount поверх відповідного пакетованого вихідного шляху, наприклад
`/app/extensions/synology-chat`, OpenClaw розглядає цей змонтований вихідний каталог
як вихідне накладання вбудованого плагіна й виявляє його перед пакетованим
пакетом `/app/dist/extensions/synology-chat`. Це зберігає працездатність контейнерних
циклів супровідників без перемикання кожного вбудованого плагіна назад на вихідний
код TypeScript. Установіть `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, щоб примусово
використовувати пакетовані dist-пакети навіть за наявності змонтованих вихідних накладань.

### Правила ввімкнення

- `plugins.enabled: false` вимикає всі плагіни й пропускає роботу з виявлення/завантаження плагінів
- `plugins.deny` завжди має перевагу над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей плагін
- Плагіни з робочої області **вимкнені типово** (їх потрібно явно ввімкнути)
- Вбудовані плагіни дотримуються вбудованого набору типово ввімкнених, якщо це не перевизначено
- Ексклюзивні слоти можуть примусово ввімкнути вибраний плагін для цього слота
- Деякі вбудовані opt-in плагіни вмикаються автоматично, коли конфігурація називає
  поверхню, що належить плагіну, як-от посилання на модель постачальника, конфігурацію каналу або
  runtime harness
- Застаріла конфігурація плагіна зберігається, поки активне `plugins.enabled: false`;
  повторно ввімкніть плагіни перед запуском очищення doctor, якщо хочете видалити застарілі ідентифікатори
- Маршрути Codex родини OpenAI зберігають окремі межі плагінів:
  `openai-codex/*` належить плагіну OpenAI, тоді як вбудований плагін сервера застосунку Codex
  вибирається через `agentRuntime.id: "codex"` або застарілі
  посилання на моделі `codex/*`

## Усунення несправностей runtime-хуків

Якщо плагін з’являється в `plugins list`, але побічні ефекти або хуки
`register(api)` не виконуються в живому чат-трафіку, спершу перевірте таке:

- Запустіть `openclaw gateway status --deep --require-rpc` і підтвердьте, що активні
  URL Gateway, профіль, шлях конфігурації та процес є саме тими, які ви редагуєте.
- Перезапустіть живий Gateway після змін встановлення/конфігурації/коду плагіна. У контейнерах
  з обгортками PID 1 може бути лише supervisor; перезапустіть або надішліть сигнал дочірньому
  процесу `openclaw gateway run`.
- Використайте `openclaw plugins inspect <id> --runtime --json`, щоб підтвердити реєстрації хуків і
  діагностику. Невбудовані хуки розмов, як-от `llm_input`,
  `llm_output`, `before_agent_finalize` і `agent_end`, потребують
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання моделей надавайте перевагу `before_model_resolve`. Він виконується перед розв’язанням моделі
  для ходів агента; `llm_output` виконується лише після того, як спроба моделі
  створить вивід асистента.
- Для підтвердження ефективної моделі сесії використовуйте `openclaw sessions` або
  поверхні сесій/статусу Gateway, а під час налагодження навантажень постачальника запускайте
  Gateway із `--raw-stream --raw-stream-path <path>`.

### Повільне налаштування інструментів плагіна

Якщо ходи агента, здається, зависають під час підготовки інструментів, увімкніть трасувальне логування та
перевірте рядки часу виконання фабрик інструментів плагінів:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Шукайте:

```text
[trace:plugin-tools] factory timings ...
```

Зведення перелічує загальний час фабрик і найповільніші фабрики інструментів плагінів,
зокрема ідентифікатор плагіна, оголошені назви інструментів, форму результату й те, чи є інструмент
необов’язковим. Повільні рядки підвищуються до попереджень, коли одна фабрика займає
щонайменше 1 с або загальна підготовка фабрик інструментів плагінів займає щонайменше 5 с.

Якщо один плагін домінує за часом, перевірте його runtime-реєстрації:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Потім оновіть, перевстановіть або вимкніть цей плагін. Автори плагінів мають переносити
дороге завантаження залежностей за шлях виконання інструмента, а не виконувати його
всередині фабрики інструмента.

### Дублювання власності каналу або інструмента

Симптоми:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Це означає, що кілька ввімкнених плагінів намагаються володіти тим самим каналом,
потоком налаштування або назвою інструмента. Найпоширеніша причина — зовнішній плагін каналу,
встановлений поруч із вбудованим плагіном, який тепер надає той самий ідентифікатор каналу.

Кроки налагодження:

- Запустіть `openclaw plugins list --enabled --verbose`, щоб побачити кожен увімкнений плагін
  і його походження.
- Запустіть `openclaw plugins inspect <id> --runtime --json` для кожного підозрюваного плагіна й
  порівняйте `channels`, `channelConfigs`, `tools` і діагностику.
- Запустіть `openclaw plugins registry --refresh` після встановлення або видалення
  пакетів плагінів, щоб збережені метадані відображали поточне встановлення.
- Перезапустіть Gateway після змін встановлення, реєстру або конфігурації.

Варіанти виправлення:

- Якщо один плагін навмисно замінює інший для того самого ідентифікатора каналу, бажаний
  плагін має оголосити `channelConfigs.<channel-id>.preferOver` з
  ідентифікатором плагіна з нижчим пріоритетом. Див. [/plugins/manifest#replacing-another-channel-plugin](/uk/plugins/manifest#replacing-another-channel-plugin).
- Якщо дублювання випадкове, вимкніть один бік за допомогою
  `plugins.entries.<plugin-id>.enabled: false` або видаліть застаріле встановлення
  плагіна.
- Якщо ви явно ввімкнули обидва плагіни, OpenClaw зберігає цей запит і
  повідомляє про конфлікт. Виберіть одного власника для каналу або перейменуйте інструменти,
  що належать плагіну, щоб runtime-поверхня була однозначною.

## Слоти плагінів (ексклюзивні категорії)

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

| Слот            | Що він контролює      | Типове значення     |
| --------------- | --------------------- | ------------------- |
| `memory`        | Плагін Active Memory  | `memory-core`       |
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

Вбудовані плагіни постачаються з OpenClaw. Багато з них увімкнені типово (наприклад
вбудовані постачальники моделей, вбудовані постачальники мовлення та вбудований браузерний
плагін). Інші вбудовані плагіни все ще потребують `openclaw plugins enable <id>`.

`--force` перезаписує наявний встановлений плагін або пакет хуків на місці. Використовуйте
`openclaw plugins update <id-or-npm-spec>` для звичайних оновлень відстежуваних npm
плагінів. Це не підтримується з `--link`, який повторно використовує вихідний шлях замість
копіювання поверх керованої цілі встановлення.

Коли `plugins.allow` уже задано, `openclaw plugins install` додає
ідентифікатор встановленого плагіна до цього allowlist перед його ввімкненням. Якщо той самий ідентифікатор плагіна
наявний у `plugins.deny`, встановлення видаляє цей застарілий deny-запис, щоб
явне встановлення можна було одразу завантажити після перезапуску.

OpenClaw зберігає сталий локальний реєстр плагінів як модель холодного читання для
інвентарю плагінів, власності внесків і планування запуску. Потоки встановлення, оновлення,
видалення, ввімкнення та вимкнення оновлюють цей реєстр після зміни стану плагіна.
Той самий файл `plugins/installs.json` зберігає сталі метадані встановлення в
верхньорівневому `installRecords` і відновлювані метадані маніфестів у `plugins`. Якщо
реєстр відсутній, застарілий або недійсний, `openclaw plugins registry
--refresh` перебудовує його подання маніфестів із записів встановлення, політики конфігурації та
метаданих маніфестів/пакетів без завантаження runtime-модулів плагінів.
`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних встановлень. Передавання
npm package spec з dist-tag або точною версією розв’язує назву пакета
назад до відстежуваного запису плагіна й записує новий spec для майбутніх оновлень.
Передавання назви пакета без версії переміщує точно закріплене встановлення назад на
типову release line реєстру. Якщо встановлений npm-плагін уже відповідає
розв’язаній версії та записаній ідентичності артефакта, OpenClaw пропускає оновлення
без завантаження, перевстановлення або переписування конфігурації.

`--pin` працює лише з npm. Він не підтримується з `--marketplace`, тому що встановлення з marketplace зберігають метадані джерела marketplace замість специфікації npm.

`--dangerously-force-unsafe-install` — це аварійне перевизначення для хибнопозитивних спрацювань вбудованого сканера небезпечного коду. Воно дає змогу продовжити встановлення й оновлення плагінів попри вбудовані знахідки рівня `critical`, але все одно не обходить блокування політик `before_install` плагіна або блокування через збій сканування. Сканування під час встановлення ігнорує типові тестові файли й каталоги, як-от `tests/`, `__tests__/`, `*.test.*` і `*.spec.*`, щоб не блокувати запаковані тестові моки; оголошені runtime-точки входу плагіна все одно скануються, навіть якщо використовують одну з цих назв.

Цей прапорець CLI застосовується лише до потоків встановлення/оновлення плагінів. Встановлення залежностей Skills, підтримані Gateway, натомість використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком завантаження/встановлення Skills із ClawHub.

Якщо плагін, який ви опублікували в ClawHub, приховано або заблоковано скануванням, відкрийте панель ClawHub або виконайте `clawhub package rescan <name>`, щоб попросити ClawHub перевірити його знову. `--dangerously-force-unsafe-install` впливає лише на встановлення на вашому власному комп’ютері; він не просить ClawHub повторно просканувати плагін і не робить заблокований реліз публічним.

Сумісні пакети беруть участь у тому самому потоці списку/перевірки/увімкнення/вимкнення плагінів. Поточна підтримка runtime включає Skills пакета, command-skills Claude, типові значення Claude `settings.json`, типові значення Claude `.lsp.json` і оголошені в маніфесті `lspServers`, command-skills Cursor і сумісні каталоги хуків Codex.

`openclaw plugins inspect <id>` також повідомляє про виявлені можливості пакета, а також підтримувані або непідтримувані записи серверів MCP і LSP для плагінів на основі пакетів.

Джерелами marketplace можуть бути відома назва marketplace Claude з `~/.claude/plugins/known_marketplaces.json`, локальний корінь marketplace або шлях `marketplace.json`, скорочення GitHub на кшталт `owner/repo`, URL репозиторію GitHub або git URL. Для віддалених marketplace записи плагінів мають залишатися всередині клонованого репозиторію marketplace і використовувати лише джерела з відносними шляхами.

Див. [довідник CLI `openclaw plugins`](/uk/cli/plugins) для повних відомостей.

## Огляд API Plugin

Нативні плагіни експортують об’єкт входу, який надає `register(api)`. Старіші плагіни ще можуть використовувати `activate(api)` як застарілий псевдонім, але нові плагіни мають використовувати `register`.

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

OpenClaw завантажує об’єкт входу й викликає `register(api)` під час активації плагіна. Завантажувач усе ще відступає до `activate(api)` для старіших плагінів, але вбудовані плагіни й нові зовнішні плагіни мають вважати `register` публічним контрактом.

`api.registrationMode` повідомляє плагіну, чому його вхід завантажується:

| Режим           | Значення                                                                                                                         |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Активація runtime. Реєструйте інструменти, хуки, сервіси, команди, маршрути й інші живі побічні ефекти.                         |
| `discovery`     | Виявлення можливостей лише для читання. Реєструйте провайдерів і метадані; довірений код входу плагіна може завантажуватися, але пропускайте живі побічні ефекти. |
| `setup-only`    | Завантаження метаданих налаштування каналу через легковаговий вхід налаштування.                                                 |
| `setup-runtime` | Завантаження налаштування каналу, якому також потрібен runtime-вхід.                                                             |
| `cli-metadata`  | Лише збирання метаданих команд CLI.                                                                                              |

Входи плагінів, які відкривають сокети, бази даних, фонових працівників або довгоживучі клієнти, мають захищати ці побічні ефекти через `api.registrationMode === "full"`. Завантаження для виявлення кешуються окремо від завантажень активації й не замінюють запущений реєстр Gateway. Виявлення не активує, але не є вільним від імпорту: OpenClaw може виконати довірений вхід плагіна або модуль канального плагіна, щоб побудувати знімок. Тримайте верхні рівні модулів легковаговими й без побічних ефектів, а мережевих клієнтів, підпроцеси, слухачі, читання облікових даних і запуск сервісів переміщуйте за шляхи повного runtime.

Поширені методи реєстрації:

| Метод                                   | Що він реєструє                  |
| --------------------------------------- | -------------------------------- |
| `registerProvider`                      | Провайдер моделі (LLM)           |
| `registerChannel`                       | Канал чату                       |
| `registerTool`                          | Інструмент агента                |
| `registerHook` / `on(...)`              | Хуки життєвого циклу             |
| `registerSpeechProvider`                | Перетворення тексту на мовлення / STT |
| `registerRealtimeTranscriptionProvider` | Потокове STT                     |
| `registerRealtimeVoiceProvider`         | Дуплексний голос у реальному часі |
| `registerMediaUnderstandingProvider`    | Аналіз зображень/аудіо           |
| `registerImageGenerationProvider`       | Генерація зображень              |
| `registerMusicGenerationProvider`       | Генерація музики                 |
| `registerVideoGenerationProvider`       | Генерація відео                  |
| `registerWebFetchProvider`              | Провайдер отримання / скрапінгу з web |
| `registerWebSearchProvider`             | Пошук у web                      |
| `registerHttpRoute`                     | HTTP endpoint                    |
| `registerCommand` / `registerCli`       | Команди CLI                      |
| `registerContextEngine`                 | Рушій контексту                  |
| `registerService`                       | Фоновий сервіс                   |

Поведінка захисту хуків для типізованих хуків життєвого циклу:

- `before_tool_call`: `{ block: true }` є кінцевим; обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: `{ block: false }` не виконує дії й не скасовує попереднє блокування.
- `before_install`: `{ block: true }` є кінцевим; обробники з нижчим пріоритетом пропускаються.
- `before_install`: `{ block: false }` не виконує дії й не скасовує попереднє блокування.
- `message_sending`: `{ cancel: true }` є кінцевим; обробники з нижчим пріоритетом пропускаються.
- `message_sending`: `{ cancel: false }` не виконує дії й не скасовує попереднє скасування.

Нативний app-server Codex повертає події нативних інструментів Codex через міст у цю поверхню хуків. Плагіни можуть блокувати нативні інструменти Codex через `before_tool_call`, спостерігати результати через `after_tool_call` і брати участь у схваленнях Codex `PermissionRequest`. Міст поки що не переписує аргументи нативних інструментів Codex. Точна межа підтримки runtime Codex описана в [контракті підтримки Codex harness v1](/uk/plugins/codex-harness#v1-support-contract).

Повну поведінку типізованих хуків див. в [огляді SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Створення плагінів](/uk/plugins/building-plugins) — створіть власний плагін
- [Пакети Plugin](/uk/plugins/bundles) — сумісність пакетів Codex/Claude/Cursor
- [Маніфест Plugin](/uk/plugins/manifest) — схема маніфесту
- [Реєстрація інструментів](/uk/plugins/building-plugins#registering-agent-tools) — додайте інструменти агента в плагін
- [Внутрішня архітектура Plugin](/uk/plugins/architecture) — модель можливостей і конвеєр завантаження
- [Плагіни спільноти](/uk/plugins/community) — списки сторонніх плагінів
