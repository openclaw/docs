---
read_when:
    - Встановлення або налаштування Plugin
    - Розуміння правил виявлення та завантаження Plugin
    - Робота з пакетами Plugin, сумісними з Codex/Claude
sidebarTitle: Install and Configure
summary: Встановлюйте, налаштовуйте та керуйте Plugin OpenClaw
title: Плагіни
x-i18n:
    generated_at: "2026-05-06T00:47:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a95dc1a960347fb7a4f43547c5be68f5a87fae0f90ed510d6619b457d644185
    source_path: tools/plugin.md
    workflow: 16
---

Плагіни розширюють OpenClaw новими можливостями: канали, постачальники моделей,
обв’язки агентів, інструменти, Skills, мовлення, транскрипція в реальному часі,
голос у реальному часі, розуміння медіа, генерація зображень, генерація відео,
отримання вебданих, вебпошук тощо. Деякі плагіни є **основними** (постачаються з OpenClaw), інші
є **зовнішніми**. Більшість зовнішніх плагінів публікуються й виявляються через
[ClawHub](/uk/tools/clawhub). npm і надалі підтримується для прямих встановлень і для
тимчасового набору пакетів плагінів, що належать OpenClaw, доки ця міграція завершиться.

## Швидкий старт

Приклади встановлення, списку, видалення, оновлення та публікації для копіювання див.
у [Керування плагінами](/uk/plugins/manage-plugins).

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

    Потім налаштуйте в `plugins.entries.\<id\>.config` у своєму файлі конфігурації.

  </Step>

  <Step title="Керування з чату">
    У запущеному Gateway команди `/plugins enable` і `/plugins disable`, доступні лише власнику,
    запускають перезавантажувач конфігурації Gateway. Gateway перезавантажує інтерфейси
    плагінів під час виконання в поточному процесі, а нові звернення агента перебудовують свій список інструментів з
    оновленого реєстру. `/plugins install` змінює вихідний код плагіна, тому
    Gateway запитує перезапуск замість того, щоб удавати, ніби поточний процес може
    безпечно перезавантажити вже імпортовані модулі.

  </Step>

  <Step title="Перевірте плагін">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Використовуйте `--runtime`, коли потрібно довести зареєстровані інструменти, служби, методи Gateway,
    хуки або CLI-команди, що належать плагіну. Звичайний `inspect` є холодною
    перевіркою маніфесту/реєстру й навмисно уникає імпортування середовища виконання плагіна.

  </Step>
</Steps>

Якщо ви віддаєте перевагу керуванню безпосередньо з чату, увімкніть `commands.plugins: true` і використовуйте:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Шлях встановлення використовує той самий резолвер, що й CLI: локальний шлях/архів, явний
`clawhub:<pkg>`, явний `npm:<pkg>`, явний `git:<repo>` або непозначену специфікацію пакета
через npm.

Якщо конфігурація недійсна, встановлення зазвичай завершується безпечною відмовою та скеровує вас до
`openclaw doctor --fix`. Єдиний виняток для відновлення — вузький шлях перевстановлення
вбудованого плагіна для плагінів, які явно вмикають
`openclaw.install.allowInvalidConfigRecovery`.
Під час запуску Gateway недійсна конфігурація плагіна завершується безпечною відмовою, як і будь-яка інша недійсна
конфігурація. Запустіть `openclaw doctor --fix`, щоб ізолювати неправильну конфігурацію плагіна,
вимкнувши цей запис плагіна та видаливши його недійсне корисне навантаження конфігурації; звичайна
резервна копія конфігурації зберігає попередні значення.
Коли конфігурація каналу посилається на плагін, який більше не виявляється, але той самий
застарілий ідентифікатор плагіна залишається в конфігурації плагіна або записах встановлення, запуск Gateway
записує попередження в журнали та пропускає цей канал замість блокування всіх інших каналів.
Запустіть `openclaw doctor --fix`, щоб видалити застарілі записи каналу/плагіна; невідомі
ключі каналу без доказів застарілого плагіна й надалі не проходять валідацію, щоб помилки введення залишалися
видимими.
Якщо встановлено `plugins.enabled: false`, застарілі посилання на плагіни вважаються інертними:
запуск Gateway пропускає роботу з виявлення/завантаження плагінів, а `openclaw doctor` зберігає
вимкнену конфігурацію плагінів замість її автоматичного видалення. Повторно ввімкніть плагіни перед
запуском очищення doctor, якщо хочете видалити застарілі ідентифікатори плагінів.

Встановлення залежностей Plugin відбувається лише під час явних потоків встановлення/оновлення або
відновлення doctor. Запуск Gateway, перезавантаження конфігурації та перевірка під час виконання
не запускають менеджери пакетів і не відновлюють дерева залежностей. Локальні плагіни вже повинні
мати встановлені залежності, тоді як плагіни npm, git і ClawHub встановлюються
під керованими коренями плагінів OpenClaw. Залежності npm можуть бути підійняті
в межах керованого npm-кореня OpenClaw; встановлення/оновлення сканує цей керований корінь перед
тим, як довіряти йому, а видалення прибирає керовані npm-пакети через npm. Зовнішні плагіни
та користувацькі шляхи завантаження все одно потрібно встановлювати через `openclaw plugins install`.
Використовуйте `openclaw plugins list --json`, щоб побачити статичний `dependencyStatus` для кожного
видимого плагіна без імпортування коду виконання або відновлення залежностей.
Див. [Розв’язання залежностей Plugin](/uk/plugins/dependency-resolution) щодо життєвого циклу
під час встановлення.

Для встановлень npm змінні селектори, як-от `latest` або dist-тег, розв’язуються
перед встановленням, а потім закріплюються за точною перевіреною версією в керованому
npm-корені OpenClaw. Після завершення npm OpenClaw перевіряє, що встановлений
запис `package-lock.json` усе ще відповідає розв’язаній версії та цілісності. Якщо
npm записує інші метадані пакета, встановлення завершується помилкою, а керований пакет
відкочується замість прийняття іншого артефакту плагіна.

Робочі копії вихідного коду є робочими областями pnpm. Якщо ви клонуєте OpenClaw, щоб працювати над вбудованими
плагінами, запустіть `pnpm install`; після цього OpenClaw завантажує вбудовані плагіни з
`extensions/<id>`, тож зміни та локальні залежності пакета використовуються безпосередньо.
Звичайні встановлення в npm-корінь призначені для пакетованого OpenClaw, а не для розробки
в робочій копії вихідного коду.

## Типи Plugin

OpenClaw розпізнає два формати плагінів:

| Формат     | Як це працює                                                       | Приклади                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Нативний** | `openclaw.plugin.json` + модуль виконання; виконується в межах процесу       | Офіційні плагіни, npm-пакети спільноти               |
| **Пакет** | Макет, сумісний із Codex/Claude/Cursor; зіставляється з функціями OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва відображаються в `openclaw plugins list`. Див. [Пакети Plugin](/uk/plugins/bundles) щодо деталей пакетів.

Якщо ви пишете нативний плагін, почніть із [Створення плагінів](/uk/plugins/building-plugins)
та [Огляду SDK Plugin](/uk/plugins/sdk-overview).

## Точки входу пакета

Нативні npm-пакети плагінів мають оголошувати `openclaw.extensions` у `package.json`.
Кожен запис має залишатися всередині каталогу пакета та розв’язуватися в читабельний
файл виконання або у вихідний файл TypeScript із виведеним зібраним відповідником JavaScript,
наприклад `src/index.ts` до `dist/index.js`.
Пакетовані встановлення мають постачати цей вихідний JavaScript-файл виконання. Резервний варіант
вихідного TypeScript-коду призначений для робочих копій вихідного коду та локальних шляхів розробки, а не для
npm-пакетів, встановлених у керований корінь плагінів OpenClaw.

Якщо попередження керованого пакета каже, що він `requires compiled runtime output for
TypeScript entry ...`, пакет було опубліковано без JavaScript-файлів,
потрібних OpenClaw під час виконання. Це проблема пакування плагіна, а не локальна проблема
конфігурації. Оновіть або перевстановіть плагін після того, як видавець повторно опублікує скомпільований
JavaScript, або вимкніть/видаліть цей плагін, доки виправлений пакет не стане доступним.

Використовуйте `openclaw.runtimeExtensions`, коли опубліковані файли виконання не розташовані за
тими самими шляхами, що й вихідні записи. Коли `runtimeExtensions` наявний, він має містити
рівно один запис для кожного запису `extensions`. Невідповідні списки спричиняють збій встановлення та
виявлення плагіна замість тихого повернення до вихідних шляхів. Якщо ви також
публікуєте `openclaw.setupEntry`, використовуйте `openclaw.runtimeSetupEntry` для його зібраного
JavaScript-відповідника; цей файл є обов’язковим, коли його оголошено.

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

### npm-пакети, що належать OpenClaw, під час міграції

ClawHub є основним шляхом розповсюдження для більшості плагінів. Поточні пакетовані
релізи OpenClaw уже містять багато офіційних плагінів, тому вони не потребують
окремих npm-встановлень у звичайних налаштуваннях. Доки кожен плагін, що належить OpenClaw,
не мігрує до ClawHub, OpenClaw усе ще постачає деякі пакети плагінів `@openclaw/*` на
npm для старіших/користувацьких встановлень і прямих npm-процесів.

Якщо npm повідомляє, що пакет плагіна `@openclaw/*` застарів, ця версія пакета
походить зі старішої зовнішньої лінійки пакетів. Використовуйте вбудований плагін із
поточного OpenClaw або локальної робочої копії, доки новіший npm-пакет не буде опубліковано.

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
  <Accordion title="Постачальники моделей (увімкнено за замовчуванням)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Плагіни пам’яті">
    - `memory-core` — вбудований пошук у пам’яті (за замовчуванням через `plugins.slots.memory`)
    - `memory-lancedb` — довготривала пам’ять на базі LanceDB з автоматичним пригадуванням/захопленням (встановіть `plugins.slots.memory = "memory-lancedb"`)

    Див. [Memory LanceDB](/uk/plugins/memory-lancedb) щодо налаштування ембедингів, сумісних з OpenAI,
    прикладів Ollama, обмежень пригадування та усунення несправностей.

  </Accordion>

  <Accordion title="Постачальники мовлення (увімкнено за замовчуванням)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` — вбудований плагін браузера для інструмента браузера, CLI `openclaw browser`, методу Gateway `browser.request`, виконання браузера та стандартної служби керування браузером (увімкнено за замовчуванням; вимкніть перед заміною)
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

| Поле              | Опис                                               |
| ------------------ | --------------------------------------------------------- |
| `enabled`          | Головний перемикач (типово: `true`)                           |
| `allow`            | Список дозволених Plugin (необов’язково)                               |
| `bundledDiscovery` | Режим виявлення вбудованих Plugin (`allowlist` типово)    |
| `deny`             | Список заборонених Plugin (необов’язково; заборона має пріоритет)                     |
| `load.paths`       | Додаткові файли/каталоги Plugin                            |
| `slots`            | Ексклюзивні селектори слотів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>`   | Перемикачі + конфігурація для окремих Plugin                               |

`plugins.allow` є ексклюзивним. Коли він непорожній, завантажуватися
або надавати інструменти можуть лише перелічені Plugin, навіть якщо `tools.allow` містить `"*"` або конкретну назву інструмента,
що належить Plugin. Якщо список дозволених інструментів посилається на інструменти Plugin, додайте ідентифікатори власницьких Plugin
до `plugins.allow` або вилучіть `plugins.allow`; `openclaw doctor` попереджає про таку
форму.

`plugins.bundledDiscovery` для нових конфігурацій типово має значення `"allowlist"`, тож
обмежувальний інвентар `plugins.allow` також блокує пропущені вбудовані провайдерські
Plugin, зокрема виявлення провайдера вебпошуку під час виконання. Doctor позначає старіші
обмежувальні конфігурації списку дозволених значенням `"compat"` під час міграції, щоб оновлення зберігали
успадковану поведінку вбудованих провайдерів, доки оператор не ввімкне суворіший режим.
Порожній `plugins.allow` і далі трактується як незаданий/відкритий.

Зміни конфігурації, зроблені через `/plugins enable` або `/plugins disable`, запускають
перезавантаження Plugin у процесі Gateway. Нові ходи агента перебудовують свій список інструментів із
оновленого реєстру Plugin. Операції, що змінюють джерело, як-от встановлення,
оновлення та видалення, усе ще перезапускають процес Gateway, оскільки вже імпортовані
модулі Plugin неможливо безпечно замінити на місці.

`openclaw plugins list` — це локальний знімок реєстру/конфігурації Plugin. Позначений як
`enabled` Plugin там означає, що збережений реєстр і поточна конфігурація дозволяють
Plugin брати участь. Це не доводить, що вже запущений віддалений Gateway
перезавантажився або перезапустився з тим самим кодом Plugin. У середовищах VPS/контейнерів
із процесами-обгортками надсилайте перезапуски або записи, що запускають перезавантаження, до фактичного
процесу `openclaw gateway run`, або використовуйте `openclaw gateway restart` для
запущеного Gateway, коли перезавантаження повідомляє про збій.

<Accordion title="Стани Plugin: вимкнений, відсутній, недійсний">
  - **Вимкнений**: Plugin існує, але правила ввімкнення його вимкнули. Конфігурація зберігається.
  - **Відсутній**: конфігурація посилається на ідентифікатор Plugin, який виявлення не знайшло.
  - **Недійсний**: Plugin існує, але його конфігурація не відповідає оголошеній схемі. Запуск Gateway пропускає лише цей Plugin; `openclaw doctor --fix` може ізолювати недійсний запис, вимкнувши його та видаливши його конфігураційне навантаження.

</Accordion>

## Виявлення та пріоритет

OpenClaw сканує Plugin у такому порядку (перший збіг перемагає):

<Steps>
  <Step title="Шляхи конфігурації">
    `plugins.load.paths` — явні шляхи до файлів або каталогів. Шляхи, які вказують
    назад на власні запаковані каталоги вбудованих Plugin OpenClaw, ігноруються;
    запустіть `openclaw doctor --fix`, щоб видалити ці застарілі псевдоніми.
  </Step>

  <Step title="Plugin робочої області">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` і `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Глобальні Plugin">
    `~/.openclaw/<plugin-root>/*.ts` і `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Вбудовані Plugin">
    Постачаються з OpenClaw. Багато з них увімкнені типово (провайдери моделей, мовлення).
    Інші потребують явного ввімкнення.
  </Step>
</Steps>

Запаковані встановлення та образи Docker зазвичай вирішують вбудовані Plugin з
скомпільованого дерева `dist/extensions`. Якщо вихідний каталог вбудованого Plugin
змонтовано поверх відповідного запакованого вихідного шляху, наприклад
`/app/extensions/synology-chat`, OpenClaw трактує цей змонтований вихідний каталог
як вихідне накладання вбудованого Plugin і виявляє його перед запакованим
пакетом `/app/dist/extensions/synology-chat`. Це зберігає працездатність контейнерних
циклів супровідників без перемикання кожного вбудованого Plugin назад на вихідний код TypeScript.
Задайте `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, щоб примусово використовувати запаковані dist-пакети,
навіть коли присутні монтування вихідних накладань.

### Правила ввімкнення

- `plugins.enabled: false` вимикає всі Plugin і пропускає роботу з виявлення/завантаження Plugin
- `plugins.deny` завжди має пріоритет над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей Plugin
- Plugin з робочої області **типово вимкнені** (їх потрібно явно ввімкнути)
- Вбудовані Plugin дотримуються вбудованого набору типово ввімкнених, якщо це не перевизначено
- Ексклюзивні слоти можуть примусово ввімкнути вибраний Plugin для цього слота
- Деякі вбудовані opt-in Plugin вмикаються автоматично, коли конфігурація називає
  поверхню, що належить Plugin, як-от посилання на провайдерську модель, конфігурацію каналу або runtime
  harness
- Застаріла конфігурація Plugin зберігається, доки активний `plugins.enabled: false`;
  повторно ввімкніть Plugin перед запуском очищення doctor, якщо хочете видалити застарілі ідентифікатори
- Маршрути Codex родини OpenAI зберігають окремі межі Plugin:
  `openai-codex/*` належить Plugin OpenAI, тоді як вбудований Plugin сервера застосунку Codex
  вибирається через `agentRuntime.id: "codex"` або застарілі
  посилання на моделі `codex/*`

## Усунення несправностей runtime-хуків

Якщо Plugin з’являється в `plugins list`, але побічні ефекти `register(api)` або хуки
не виконуються в живому трафіку чату, спершу перевірте це:

- Запустіть `openclaw gateway status --deep --require-rpc` і підтвердьте, що активні
  URL Gateway, профіль, шлях конфігурації та процес є саме тими, які ви редагуєте.
- Перезапустіть живий Gateway після змін встановлення/конфігурації/коду Plugin. У контейнерах-обгортках
  PID 1 може бути лише супервізором; перезапустіть або просигналізуйте дочірній
  процес `openclaw gateway run`.
- Використайте `openclaw plugins inspect <id> --runtime --json`, щоб підтвердити реєстрації хуків і
  діагностику. Невбудованим розмовним хукам, як-от `llm_input`,
  `llm_output`, `before_agent_finalize` і `agent_end`, потрібен
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання моделей віддавайте перевагу `before_model_resolve`. Він виконується до
  вирішення моделі для ходів агента; `llm_output` виконується лише після того, як спроба моделі
  створила вихід помічника.
- Для доказу ефективної моделі сесії використовуйте `openclaw sessions` або
  поверхні сесії/статусу Gateway, а під час налагодження провайдерських payload запускайте
  Gateway з `--raw-stream --raw-stream-path <path>`.

### Повільне налаштування інструментів Plugin

Якщо ходи агента ніби зависають під час підготовки інструментів, увімкніть трасувальне логування та
перевірте рядки таймінгів фабрик інструментів Plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Шукайте:

```text
[trace:plugin-tools] factory timings ...
```

Зведення перелічує загальний час фабрик і найповільніші фабрики інструментів Plugin,
зокрема ідентифікатор Plugin, оголошені назви інструментів, форму результату та чи є інструмент
необов’язковим. Повільні рядки підвищуються до попереджень, коли одна фабрика займає
щонайменше 1 с або загальна підготовка фабрик інструментів Plugin займає щонайменше 5 с.

OpenClaw кешує успішні результати фабрик інструментів Plugin для повторних вирішень
з тим самим ефективним контекстом запиту. Ключ кешу містить ефективну
runtime-конфігурацію, робочу область, ідентифікатори агента/сесії, політику sandbox, налаштування браузера,
контекст доставки, ідентичність запитувача та стан власності, тож фабрики, які
залежать від цих довірених полів, запускаються повторно, коли контекст змінюється.

Якщо один Plugin домінує в таймінгах, перевірте його runtime-реєстрації:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Потім оновіть, перевстановіть або вимкніть цей Plugin. Автори Plugin мають переносити
дороге завантаження залежностей за шлях виконання інструмента, а не робити його
всередині фабрики інструментів.

### Дублювання володіння каналом або інструментом

Симптоми:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Це означає, що більше ніж один увімкнений Plugin намагається володіти тим самим каналом,
потоком налаштування або назвою інструмента. Найпоширеніша причина — зовнішній Plugin каналу,
встановлений поруч із вбудованим Plugin, який тепер надає той самий ідентифікатор каналу.

Кроки налагодження:

- Запустіть `openclaw plugins list --enabled --verbose`, щоб побачити кожен увімкнений Plugin
  і походження.
- Запустіть `openclaw plugins inspect <id> --runtime --json` для кожного підозрюваного Plugin і
  порівняйте `channels`, `channelConfigs`, `tools` і діагностику.
- Запустіть `openclaw plugins registry --refresh` після встановлення або видалення
  пакетів Plugin, щоб збережені метадані відображали поточне встановлення.
- Перезапустіть Gateway після змін встановлення, реєстру або конфігурації.

Варіанти виправлення:

- Якщо один Plugin навмисно замінює інший для того самого ідентифікатора каналу, бажаний
  Plugin має оголосити `channelConfigs.<channel-id>.preferOver` з ідентифікатором Plugin
  нижчого пріоритету. Див. [/plugins/manifest#replacing-another-channel-plugin](/uk/plugins/manifest#replacing-another-channel-plugin).
- Якщо дублювання випадкове, вимкніть один бік за допомогою
  `plugins.entries.<plugin-id>.enabled: false` або видаліть застаріле встановлення Plugin.
- Якщо ви явно ввімкнули обидва Plugin, OpenClaw зберігає цей запит і
  повідомляє про конфлікт. Виберіть одного власника для каналу або перейменуйте інструменти,
  що належать Plugin, щоб runtime-поверхня була однозначною.

## Слоти Plugin (ексклюзивні категорії)

Деякі категорії є ексклюзивними (лише одна активна за раз):

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
| `memory`        | Plugin активної пам’яті  | `memory-core`       |
| `contextEngine` | Активний рушій контексту | `legacy` (вбудований) |

## Довідка CLI

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

openclaw plugins install <package>         # install from npm by default
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

Вбудовані plugins постачаються разом з OpenClaw. Багато з них увімкнено за замовчуванням (наприклад,
вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований браузерний
Plugin). Інші вбудовані plugins усе ще потребують `openclaw plugins enable <id>`.

`--force` перезаписує наявний встановлений Plugin або пакет хуків на місці. Використовуйте
`openclaw plugins update <id-or-npm-spec>` для звичайних оновлень відстежуваних npm
plugins. Це не підтримується з `--link`, який повторно використовує шлях до джерела замість
копіювання до керованої цілі встановлення.

Коли `plugins.allow` уже задано, `openclaw plugins install` додає id
встановленого Plugin до цього allowlist перед його ввімкненням. Якщо той самий id Plugin
присутній у `plugins.deny`, встановлення видаляє цей застарілий deny-запис, щоб
явне встановлення було одразу доступне для завантаження після перезапуску.

OpenClaw зберігає сталий локальний реєстр Plugin як модель холодного читання для
інвентаризації Plugin, володіння внесками та планування запуску. Потоки встановлення, оновлення,
видалення, ввімкнення та вимкнення оновлюють цей реєстр після зміни стану Plugin.
Той самий файл `plugins/installs.json` зберігає довговічні метадані встановлення в
верхньорівневому `installRecords` і відновлювані метадані маніфестів у `plugins`. Якщо
реєстр відсутній, застарілий або недійсний, `openclaw plugins registry
--refresh` перебудовує його подання маніфестів із записів встановлення, політики конфігурації та
метаданих маніфестів/пакетів без завантаження runtime-модулів Plugin.
`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних встановлень. Передавання
специфікації npm-пакета з dist-tag або точною версією зіставляє назву пакета
назад із відстежуваним записом Plugin і записує нову специфікацію для майбутніх оновлень.
Передавання назви пакета без версії переводить точно закріплене встановлення назад на
типову лінію релізів реєстру. Якщо встановлений npm Plugin уже відповідає
визначеній версії та записаній ідентичності артефакту, OpenClaw пропускає оновлення
без завантаження, перевстановлення або переписування конфігурації.
Коли `openclaw update` запускається в beta-каналі, npm і ClawHub
записи Plugin типової лінії спершу пробують `@beta` і повертаються до default/latest, якщо beta-релізу Plugin
не існує. Точні версії та явні теги залишаються закріпленими.

`--pin` призначено лише для npm. Він не підтримується з `--marketplace`, тому що
marketplace-встановлення зберігають метадані джерела marketplace замість npm-специфікації.

`--dangerously-force-unsafe-install` — це аварійне перевизначення для хибних
спрацьовувань вбудованого сканера небезпечного коду. Воно дозволяє встановлення Plugin
і оновлення Plugin продовжуватися попри вбудовані знахідки `critical`, але все одно
не обходить блокування політики Plugin `before_install` або блокування через збій сканування.
Сканування встановлення ігнорують поширені тестові файли та каталоги, як-от `tests/`,
`__tests__/`, `*.test.*` і `*.spec.*`, щоб не блокувати запаковані тестові моки;
оголошені runtime-точки входу Plugin усе одно скануються, навіть якщо вони використовують одну з
цих назв.

Цей прапорець CLI застосовується лише до потоків встановлення/оновлення Plugin. Gateway-backed встановлення залежностей skill
натомість використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`,
тоді як `openclaw skills install` залишається окремим потоком завантаження/встановлення skill із ClawHub.

Якщо Plugin, який ви опублікували в ClawHub, приховано або заблоковано скануванням, відкрийте
панель ClawHub або запустіть `clawhub package rescan <name>`, щоб попросити ClawHub перевірити
його знову. `--dangerously-force-unsafe-install` впливає лише на встановлення на вашому власному
комп’ютері; він не просить ClawHub повторно сканувати Plugin і не робить заблокований реліз
публічним.

Сумісні bundles беруть участь у тому самому потоці списку/інспектування/ввімкнення/вимкнення Plugin.
Поточна runtime-підтримка охоплює bundle skills, Claude command-skills,
типові значення Claude `settings.json`, типові значення Claude `.lsp.json` і оголошені в маніфесті
`lspServers`, Cursor command-skills і сумісні каталоги хуків Codex.

`openclaw plugins inspect <id>` також повідомляє про виявлені можливості bundle, а також
підтримувані або непідтримувані записи MCP- і LSP-серверів для bundle-backed plugins.

Джерелами marketplace можуть бути відома назва marketplace Claude з
`~/.claude/plugins/known_marketplaces.json`, локальний корінь marketplace або
шлях `marketplace.json`, GitHub-скорочення на кшталт `owner/repo`, URL GitHub-репозиторію
або git URL. Для віддалених marketplaces записи Plugin мають залишатися всередині
клонованого репозиторію marketplace і використовувати лише джерела з відносними шляхами.

Повні відомості див. у [довіднику CLI `openclaw plugins`](/uk/cli/plugins).

## Огляд API Plugin

Нативні plugins експортують об’єкт входу, який надає `register(api)`. Старіші
plugins усе ще можуть використовувати `activate(api)` як legacy-псевдонім, але нові plugins мають
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
активації Plugin. Завантажувач досі повертається до `activate(api)` для старіших plugins,
але вбудовані plugins і нові зовнішні plugins мають розглядати `register` як
публічний контракт.

`api.registrationMode` повідомляє Plugin, чому його точку входу завантажують:

| Режим           | Значення                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Runtime-активація. Реєструйте tools, hooks, services, commands, routes та інші live side effects.                              |
| `discovery`     | Виявлення можливостей лише для читання. Реєструйте провайдерів і метадані; код довіреної точки входу Plugin може завантажуватися, але пропускайте live side effects. |
| `setup-only`    | Завантаження метаданих налаштування каналу через легку точку входу налаштування.                                                                |
| `setup-runtime` | Завантаження налаштування каналу, якому також потрібна runtime-точка входу.                                                                         |
| `cli-metadata`  | Лише збирання метаданих команд CLI.                                                                                            |

Точки входу Plugin, які відкривають sockets, databases, background workers або довгоживучі
clients, мають захищати ці side effects перевіркою `api.registrationMode === "full"`.
Завантаження discovery кешуються окремо від активаційних завантажень і не замінюють
запущений реєстр Gateway. Discovery не активує Plugin, але не є import-free:
OpenClaw може виконати довірену точку входу Plugin або модуль channel Plugin, щоб побудувати
snapshot. Тримайте верхні рівні модулів легкими та без side effects, а
network clients, subprocesses, listeners, читання облікових даних і запуск services
переносьте за full-runtime шляхи.

Поширені методи реєстрації:

| Метод                                   | Що він реєструє             |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Провайдер моделей (LLM)     |
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
| `registerWebSearchProvider`             | Web search                  |
| `registerHttpRoute`                     | HTTP-ендпоінт               |
| `registerCommand` / `registerCli`       | Команди CLI                 |
| `registerContextEngine`                 | Рушій контексту             |
| `registerService`                       | Фонова служба               |

Поведінка guard для типізованих хуків життєвого циклу:

- `before_tool_call`: `{ block: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: `{ block: false }` не виконує дій і не скасовує попереднє блокування.
- `before_install`: `{ block: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `before_install`: `{ block: false }` не виконує дій і не скасовує попереднє блокування.
- `message_sending`: `{ cancel: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `message_sending`: `{ cancel: false }` не виконує дій і не скасовує попереднє скасування.

Нативний Codex app-server передає bridge Codex-native події tools назад на цю
поверхню хуків. Plugins можуть блокувати нативні Codex tools через `before_tool_call`,
спостерігати результати через `after_tool_call` і брати участь у схваленнях Codex
`PermissionRequest`. Bridge поки що не переписує аргументи Codex-native tools.
Точна межа runtime-підтримки Codex описана в
[контракті підтримки Codex harness v1](/uk/plugins/codex-harness#v1-support-contract).

Повну поведінку типізованих хуків див. в [огляді SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Створення Plugin](/uk/plugins/building-plugins) — створіть власний Plugin
- [Пакети Plugin](/uk/plugins/bundles) — сумісність пакетів Codex/Claude/Cursor
- [Маніфест Plugin](/uk/plugins/manifest) — схема маніфесту
- [Реєстрація інструментів](/uk/plugins/building-plugins#registering-agent-tools) — додайте інструменти агента в Plugin
- [Внутрішня архітектура Plugin](/uk/plugins/architecture) — модель можливостей і конвеєр завантаження
- [Спільнотні Plugin](/uk/plugins/community) — списки сторонніх розробників
