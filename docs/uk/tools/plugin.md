---
read_when:
    - Установлення або налаштування Plugin
    - Розуміння правил виявлення та завантаження Plugin
    - Робота з пакетами Plugin, сумісними з Codex/Claude
sidebarTitle: Install and Configure
summary: Установлення, налаштування та керування Plugin OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-04-27T14:22:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 367bbf1b9aae767e13ac0bfde8f2b341f3f62bac4723080b4204ff13dee8aba0
    source_path: tools/plugin.md
    workflow: 15
---

Plugin розширюють OpenClaw новими можливостями: канали, провайдери моделей,
harness агентів, інструменти, Skills, мовлення, транскрипція в реальному часі, голос у реальному
часі, розуміння медіа, генерація зображень, генерація відео, web fetch, web
search тощо. Деякі Plugin є **core** (постачаються з OpenClaw), інші
є **external** (публікуються спільнотою в npm).

## Швидкий старт

<Steps>
  <Step title="Подивитися, що завантажено">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Установити Plugin">
    ```bash
    # З npm
    openclaw plugins install @openclaw/voice-call

    # З локального каталогу або архіву
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Перезапустити Gateway">
    ```bash
    openclaw gateway restart
    ```

    Потім налаштуйте в `plugins.entries.\<id\>.config` у вашому файлі конфігурації.

  </Step>
</Steps>

Якщо ви надаєте перевагу керуванню безпосередньо в чаті, увімкніть `commands.plugins: true` і використовуйте:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Шлях установлення використовує той самий механізм визначення, що й CLI: локальний
шлях/архів, явний `clawhub:<pkg>`, явний `npm:<pkg>` або проста специфікація пакета
(спочатку ClawHub, потім резервний варіант npm).

Якщо конфігурація невалідна, установлення зазвичай завершується із захистом і вказує на
`openclaw doctor --fix`. Єдиний виняток відновлення — вузький шлях перевстановлення вбудованого Plugin
для Plugin, які погоджуються на
`openclaw.install.allowInvalidConfigRecovery`.
Під час запуску Gateway невалідна конфігурація одного Plugin ізолюється лише цим Plugin:
під час запуску записується проблема `plugins.entries.<id>.config`, цей Plugin пропускається під час
завантаження, а інші Plugin і канали залишаються онлайн. Виконайте `openclaw doctor --fix`,
щоб ізолювати погану конфігурацію Plugin шляхом вимкнення запису цього Plugin і видалення
його невалідного корисного навантаження конфігурації; звичайне резервне копіювання конфігурації зберігає попередні значення.
Коли конфігурація каналу посилається на Plugin, який більше неможливо виявити, але той самий
застарілий id Plugin залишається в конфігурації Plugin або записах установлення, під час запуску Gateway
записуються попередження, і цей канал пропускається замість блокування всіх інших каналів.
Виконайте `openclaw doctor --fix`, щоб видалити застарілі записи каналу/Plugin; невідомі
ключі каналу без ознак застарілого Plugin все одно не проходять валідацію, щоб помилки в назвах залишалися видимими.

Пакетні інсталяції OpenClaw не встановлюють завчасно все дерево
залежностей середовища виконання кожного вбудованого Plugin. Коли вбудований Plugin, що належить OpenClaw, активний із
конфігурації Plugin, застарілої конфігурації каналу або маніфесту, увімкненого за замовчуванням, під час запуску
відновлюються лише оголошені залежності середовища виконання цього Plugin перед його імпортом.
Сам по собі збережений стан автентифікації каналу не активує вбудований канал для відновлення
залежностей середовища виконання під час запуску Gateway.
Явне вимкнення все одно має пріоритет: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` і `channels.<id>.enabled: false`
запобігають автоматичному відновленню залежностей середовища виконання вбудованого Plugin/каналу.
Непорожній `plugins.allow` також обмежує стандартне відновлення залежностей середовища виконання для вбудованих Plugin, увімкнених за замовчуванням;
явне ввімкнення вбудованого каналу (`channels.<id>.enabled: true`) усе ще може
відновити залежності Plugin цього каналу.
External Plugin і власні шляхи завантаження, як і раніше, потрібно встановлювати через
`openclaw plugins install`.

## Типи Plugin

OpenClaw розпізнає два формати Plugin:

| Формат     | Як це працює                                                    | Приклади                                               |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + модуль runtime; виконується в процесі   | Офіційні Plugin, npm-пакети спільноти                  |
| **Bundle** | Сумісний із Codex/Claude/Cursor макет; зіставляється з можливостями OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва відображаються в `openclaw plugins list`. Докладніше про пакети див. у [Пакети Plugin](/uk/plugins/bundles).

Якщо ви пишете native Plugin, почніть із [Створення Plugin](/uk/plugins/building-plugins)
та [Огляду Plugin SDK](/uk/plugins/sdk-overview).

## Точки входу пакета

Npm-пакети native Plugin мають оголошувати `openclaw.extensions` у `package.json`.
Кожен запис має залишатися в межах каталогу пакета й визначатися в доступний для читання
файл runtime або у вихідний файл TypeScript із виведеним зібраним JavaScript-файлом-парою,
наприклад `src/index.ts` до `dist/index.js`.

Використовуйте `openclaw.runtimeExtensions`, коли опубліковані файли runtime не розміщені за
тими самими шляхами, що й вихідні записи. Якщо параметр присутній,
`runtimeExtensions` має містити рівно один запис для кожного запису в `extensions`. Невідповідні списки призводять до помилки встановлення та
виявлення Plugin, а не до тихого повернення до вихідних шляхів.

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

### Доступні для встановлення (npm)

| Plugin          | Пакет                 | Документація                         |
| --------------- | --------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`    | [Matrix](/uk/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`   | [Microsoft Teams](/uk/channels/msteams) |
| Nostr           | `@openclaw/nostr`     | [Nostr](/uk/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call`| [Voice Call](/uk/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`      | [Zalo](/uk/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`  | [Zalo Personal](/uk/plugins/zalouser)   |

### Core (постачаються з OpenClaw)

<AccordionGroup>
  <Accordion title="Провайдери моделей (увімкнені за замовчуванням)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugin пам’яті">
    - `memory-core` — вбудований пошук у пам’яті (стандартно через `plugins.slots.memory`)
    - `memory-lancedb` — довготривала пам’ять із автоматичним відновленням/захопленням, що встановлюється на вимогу (установіть `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Провайдери мовлення (увімкнені за замовчуванням)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` — вбудований Plugin браузера для інструмента browser, CLI `openclaw browser`, методу gateway `browser.request`, runtime браузера та стандартного сервісу керування браузером (увімкнений за замовчуванням; вимкніть його перед заміною)
    - `copilot-proxy` — міст VS Code Copilot Proxy (вимкнений за замовчуванням)
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

| Поле             | Опис                                                      |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Головний перемикач (стандартно: `true`)                  |
| `allow`          | Список дозволених Plugin (необов’язково)                 |
| `deny`           | Список заборонених Plugin (необов’язково; deny перемагає)|
| `load.paths`     | Додаткові файли/каталоги Plugin                          |
| `slots`          | Вибір ексклюзивних слотів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>` | Перемикачі + конфігурація для конкретного Plugin         |

Зміни конфігурації **потребують перезапуску gateway**. Якщо Gateway працює з
відстеженням конфігурації + увімкненим перезапуском у процесі (стандартний шлях `openclaw gateway`),
цей перезапуск зазвичай виконується автоматично невдовзі після запису змін конфігурації.
Підтримуваного шляху hot-reload для коду runtime native Plugin або хуків життєвого циклу немає;
перезапустіть процес Gateway, який обслуговує активний канал, перш ніж
очікувати, що оновлений код `register(api)`, хуки `api.on(...)`, інструменти, сервіси або
хуки провайдера/runtime почнуть виконуватися.

`openclaw plugins list` — це локальний знімок реєстру/конфігурації Plugin. Плагін зі статусом
`enabled` там означає, що збережений реєстр і поточна конфігурація дозволяють
Plugin брати участь. Це не доводить, що вже запущений віддалений дочірній Gateway
було перезапущено з тим самим кодом Plugin. У конфігураціях VPS/контейнерів з
процесами-обгортками надсилайте перезапуски фактичному процесу `openclaw gateway run`,
або використовуйте `openclaw gateway restart` для запущеного Gateway.

<Accordion title="Стани Plugin: вимкнений, відсутній, невалідний">
  - **Вимкнений**: Plugin існує, але правила ввімкнення його вимкнули. Конфігурація зберігається.
  - **Відсутній**: конфігурація посилається на id Plugin, який не було знайдено під час виявлення.
  - **Невалідний**: Plugin існує, але його конфігурація не відповідає оголошеній схемі. Під час запуску Gateway пропускається лише цей Plugin; `openclaw doctor --fix` може ізолювати невалідний запис, вимкнувши його й видаливши його корисне навантаження конфігурації.
</Accordion>

## Виявлення та пріоритет

OpenClaw сканує Plugin у такому порядку (перемагає перший збіг):

<Steps>
  <Step title="Шляхи з конфігурації">
    `plugins.load.paths` — явні шляхи до файлу або каталогу. Шляхи, які вказують
    назад на власні каталогі вбудованих Plugin із пакетної версії OpenClaw, ігноруються;
    виконайте `openclaw doctor --fix`, щоб видалити ці застарілі псевдоніми.
  </Step>

  <Step title="Plugin робочого простору">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` і `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Глобальні Plugin">
    `~/.openclaw/<plugin-root>/*.ts` і `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Вбудовані Plugin">
    Постачаються з OpenClaw. Багато з них увімкнені за замовчуванням (провайдери моделей, мовлення).
    Інші потребують явного ввімкнення.
  </Step>
</Steps>

Пакетні інсталяції та Docker-образи зазвичай визначають вбудовані Plugin із
скомпільованого дерева `dist/extensions`. Якщо каталог вихідного коду вбудованого Plugin
змонтовано поверх відповідного пакетного шляху вихідного коду, наприклад
`/app/extensions/synology-chat`, OpenClaw трактує цей змонтований каталог вихідного коду
як накладення вбудованого вихідного коду й виявляє його раніше за пакетний
пакет `/app/dist/extensions/synology-chat`. Це дозволяє підтримувати цикли роботи
контейнерів мейнтейнерів без перемикання кожного вбудованого Plugin назад на вихідний код TypeScript.
Установіть `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, щоб примусово використовувати пакетні dist-пакети
навіть за наявності змонтованих накладень вихідного коду.

### Правила ввімкнення

- `plugins.enabled: false` вимикає всі Plugin
- `plugins.deny` завжди має пріоритет над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей Plugin
- Plugin із робочого простору **вимкнені за замовчуванням** (їх потрібно явно ввімкнути)
- Вбудовані Plugin дотримуються вбудованого набору стандартно ввімкнених, якщо не перевизначено
- Ексклюзивні слоти можуть примусово ввімкнути вибраний Plugin для цього слота
- Деякі вбудовані opt-in Plugin вмикаються автоматично, коли конфігурація називає
  поверхню, що належить Plugin, наприклад посилання на модель провайдера, конфігурацію каналу або runtime
  harness
- Маршрути Codex сімейства OpenAI зберігають окремі межі Plugin:
  `openai-codex/*` належить Plugin OpenAI, тоді як вбудований
  Plugin сервера застосунку Codex вибирається через `agentRuntime.id: "codex"` або застарілі
  посилання на моделі `codex/*`

## Усунення неполадок із хуками runtime

Якщо Plugin відображається в `plugins list`, але побічні ефекти `register(api)` або хуки
не виконуються в трафіку активного чату, спочатку перевірте таке:

- Виконайте `openclaw gateway status --deep --require-rpc` і підтвердьте, що активні
  URL Gateway, профіль, шлях конфігурації та процес — саме ті, які ви редагуєте.
- Перезапускайте активний Gateway після змін установлення/конфігурації/коду Plugin. У контейнерах
  з обгортками PID 1 може бути лише супервізором; перезапустіть або надішліть сигнал дочірньому
  процесу `openclaw gateway run`.
- Використовуйте `openclaw plugins inspect <id> --json`, щоб підтвердити реєстрації хуків і
  діагностику. Невбудовані хуки розмов, такі як `llm_input`,
  `llm_output`, `before_agent_finalize` і `agent_end`, потребують
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання моделі надавайте перевагу `before_model_resolve`. Він запускається до
  визначення моделі для ходів агента; `llm_output` запускається лише після того,
  як спроба з моделлю створить вивід асистента.
- Для підтвердження фактичної моделі сесії використовуйте `openclaw sessions` або
  поверхні сесії/статусу Gateway, а під час налагодження корисних навантажень провайдера запускайте
  Gateway з `--raw-stream --raw-stream-path <path>`.

### Дубльоване володіння каналом або інструментом

Симптоми:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Це означає, що більше ніж один увімкнений Plugin намагається володіти тим самим каналом,
потоком налаштування або назвою інструмента. Найчастіша причина — external плагін каналу,
встановлений поруч із вбудованим Plugin, який тепер надає той самий id каналу.

Кроки налагодження:

- Виконайте `openclaw plugins list --enabled --verbose`, щоб побачити кожен увімкнений Plugin
  та його походження.
- Виконайте `openclaw plugins inspect <id> --json` для кожного підозрюваного Plugin і
  порівняйте `channels`, `channelConfigs`, `tools` і діагностику.
- Виконайте `openclaw plugins registry --refresh` після встановлення або видалення
  пакетів Plugin, щоб збережені метадані відображали поточне встановлення.
- Перезапустіть Gateway після змін установлення, реєстру або конфігурації.

Варіанти виправлення:

- Якщо один Plugin навмисно замінює інший для того самого id каналу,
  пріоритетний Plugin має оголошувати `channelConfigs.<channel-id>.preferOver` із
  id Plugin нижчого пріоритету. Див. [/plugins/manifest#replacing-another-channel-plugin](/uk/plugins/manifest#replacing-another-channel-plugin).
- Якщо дублювання випадкове, вимкніть одну зі сторін за допомогою
  `plugins.entries.<plugin-id>.enabled: false` або видаліть застаріле встановлення Plugin.
- Якщо ви явно ввімкнули обидва Plugin, OpenClaw зберігає цей запит і
  повідомляє про конфлікт. Виберіть одного власника для каналу або перейменуйте
  інструменти, що належать Plugin, щоб поверхня runtime залишалася однозначною.

## Слоти Plugin (ексклюзивні категорії)

Деякі категорії є ексклюзивними (одночасно активним може бути лише один):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // або "none", щоб вимкнути
      contextEngine: "legacy", // або id Plugin
    },
  },
}
```

| Слот            | Чим керує                | Стандартне значення |
| --------------- | ------------------------ | ------------------- |
| `memory`        | Активний Plugin пам’яті  | `memory-core`       |
| `contextEngine` | Активний рушій контексту | `legacy` (вбудований) |

## Довідник CLI

```bash
openclaw plugins list                       # стислий список
openclaw plugins list --enabled            # лише ввімкнені Plugin
openclaw plugins list --verbose            # докладні рядки по кожному Plugin
openclaw plugins list --json               # список у машиночитному форматі
openclaw plugins inspect <id>              # докладна інформація
openclaw plugins inspect <id> --json       # машиночитний формат
openclaw plugins inspect --all             # таблиця для всього набору
openclaw plugins info <id>                 # псевдонім inspect
openclaw plugins doctor                    # діагностика
openclaw plugins registry                  # перевірити збережений стан реєстру
openclaw plugins registry --refresh        # перебудувати збережений реєстр
openclaw doctor --fix                      # відновити стан реєстру Plugin

openclaw plugins install <package>         # установити (спочатку ClawHub, потім npm)
openclaw plugins install clawhub:<pkg>     # установити лише з ClawHub
openclaw plugins install npm:<pkg>         # установити лише з npm
openclaw plugins install <spec> --force    # перезаписати наявне встановлення
openclaw plugins install <path>            # установити з локального шляху
openclaw plugins install -l <path>         # зв’язати (без копіювання) для розробки
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # записати точну визначену специфікацію npm
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # оновити один Plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # оновити всі
openclaw plugins uninstall <id>          # видалити конфігурацію та записи індексу Plugin
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Вбудовані Plugin постачаються з OpenClaw. Багато з них увімкнені за замовчуванням (наприклад,
вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований Plugin
browser). Інші вбудовані Plugin все одно потребують `openclaw plugins enable <id>`.

`--force` перезаписує вже встановлений Plugin або пакет hook в тому самому місці. Використовуйте
`openclaw plugins update <id-or-npm-spec>` для звичайних оновлень відстежуваних npm-
Plugin. Це не підтримується разом із `--link`, який повторно використовує шлях до джерела
замість копіювання в ціль керованого встановлення.

Якщо `plugins.allow` уже задано, `openclaw plugins install` додає
id встановленого Plugin до цього списку дозволених значень перед його ввімкненням. Якщо той самий id Plugin
присутній у `plugins.deny`, установлення видаляє цей застарілий запис deny, щоб
явно встановлений Plugin можна було одразу завантажити після перезапуску.

OpenClaw зберігає локальний реєстр Plugin як модель холодного читання для
обліку Plugin, володіння внесками та планування запуску. Потоки встановлення, оновлення,
видалення, увімкнення та вимкнення оновлюють цей реєстр після зміни стану Plugin.
Той самий файл `plugins/installs.json` зберігає довготривалі метадані встановлення у
верхньорівневому `installRecords` і відновлювані метадані маніфесту в `plugins`. Якщо
реєстр відсутній, застарілий або невалідний, `openclaw plugins registry
--refresh` перебудовує його подання маніфесту із записів установлення, політики конфігурації та
метаданих маніфесту/пакета без завантаження модулів runtime Plugin.
`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних установлень. Передавання
специфікації npm-пакета з dist-tag або точною версією визначає назву пакета
назад до відстежуваного запису Plugin і записує нову специфікацію для майбутніх оновлень.
Передавання назви пакета без версії переводить точно закріплене встановлення назад на
стандартну лінію випусків реєстру. Якщо встановлений npm Plugin уже відповідає
визначеній версії та записаній ідентичності артефакта, OpenClaw пропускає оновлення
без завантаження, перевстановлення чи перезапису конфігурації.

`--pin` підтримується лише для npm. Він не підтримується з `--marketplace`, оскільки
встановлення з marketplace зберігають метадані джерела marketplace замість специфікації npm.

`--dangerously-force-unsafe-install` — це аварійне перевизначення для хибнопозитивних
спрацьовувань вбудованого сканера небезпечного коду. Воно дозволяє продовжувати встановлення
та оновлення Plugin попри вбудовані findings рівня `critical`, але все одно
не обходить блокування політик Plugin `before_install` або блокування через збої сканування.
Сканування встановлення ігнорують поширені тестові файли й каталоги, такі як `tests/`,
`__tests__/`, `*.test.*` і `*.spec.*`, щоб не блокувати запаковані тестові моки;
оголошені точки входу runtime Plugin усе одно скануються, навіть якщо використовують одну з
цих назв.

Цей прапорець CLI застосовується лише до потоків встановлення/оновлення Plugin. Установлення залежностей Skills
через Gateway натомість використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком завантаження/встановлення Skills із ClawHub.

Сумісні пакети беруть участь у тих самих потоках list/inspect/enable/disable Plugin. Поточна підтримка runtime включає Skills із пакетів, command-skills Claude,
стандартні значення Claude `settings.json`, стандартні значення Claude `.lsp.json` і
оголошених у маніфесті `lspServers`, command-skills Cursor та сумісні каталоги hook Codex.

`openclaw plugins inspect <id>` також повідомляє про виявлені можливості пакета, а також
підтримувані або непідтримувані записи серверів MCP і LSP для Plugin на основі пакетів.

Джерелами marketplace можуть бути відома назва marketplace Claude з
`~/.claude/plugins/known_marketplaces.json`, локальний корінь marketplace або шлях до
`marketplace.json`, скорочення GitHub на кшталт `owner/repo`, URL репозиторію GitHub
або URL git. Для віддалених marketplace записи Plugin мають залишатися всередині
клонованого репозиторію marketplace і використовувати лише відносні шляхи джерел.

Повні відомості див. у [`openclaw plugins` — довідник CLI](/uk/cli/plugins).

## Огляд Plugin API

Native Plugin експортують об’єкт входу, який надає `register(api)`. Старіші
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

OpenClaw завантажує об’єкт входу й викликає `register(api)` під час
активації Plugin. Завантажувач усе ще повертається до `activate(api)` для старіших Plugin,
але вбудовані Plugin і нові external Plugin мають вважати `register` публічним контрактом.

`api.registrationMode` повідомляє Plugin, чому завантажується його запис:

| Режим           | Значення                                                                                                                         |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Активація runtime. Реєструйте інструменти, хуки, сервіси, команди, маршрути та інші побічні ефекти активного середовища.        |
| `discovery`     | Лише для читання виявлення можливостей. Реєструйте провайдери й метадані; код входу довіреного Plugin може завантажуватися, але пропускайте активні побічні ефекти. |
| `setup-only`    | Завантаження метаданих налаштування каналу через полегшений запис налаштування.                                                  |
| `setup-runtime` | Завантаження налаштування каналу, якому також потрібен запис runtime.                                                             |
| `cli-metadata`  | Лише збирання метаданих команди CLI.                                                                                              |

Записи Plugin, які відкривають сокети, бази даних, фонові воркери або довготривалі
клієнти, мають захищати такі побічні ефекти перевіркою `api.registrationMode === "full"`.
Завантаження discovery кешуються окремо від активаційних завантажень і не замінюють
реєстр запущеного Gateway. Discovery не активує, але й не є вільним від імпорту:
OpenClaw може виконувати trusted запис Plugin або модуль канального Plugin, щоб зібрати
знімок. Тримайте верхній рівень модулів легким і без побічних ефектів, а мережеві клієнти,
підпроцеси, слухачі, читання облікових даних і запуск сервісів переносіть
за шляхи повного runtime.

Поширені методи реєстрації:

| Метод                                   | Що він реєструє             |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Провайдер моделі (LLM)      |
| `registerChannel`                       | Канал чату                  |
| `registerTool`                          | Інструмент агента           |
| `registerHook` / `on(...)`              | Хуки життєвого циклу        |
| `registerSpeechProvider`                | Синтез мовлення / STT       |
| `registerRealtimeTranscriptionProvider` | Потоковий STT               |
| `registerRealtimeVoiceProvider`         | Двобічний голос у реальному часі |
| `registerMediaUnderstandingProvider`    | Аналіз зображень/аудіо      |
| `registerImageGenerationProvider`       | Генерація зображень         |
| `registerMusicGenerationProvider`       | Генерація музики            |
| `registerVideoGenerationProvider`       | Генерація відео             |
| `registerWebFetchProvider`              | Провайдер web fetch / scrape |
| `registerWebSearchProvider`             | Web search                  |
| `registerHttpRoute`                     | HTTP-ендпоїнт               |
| `registerCommand` / `registerCli`       | Команди CLI                 |
| `registerContextEngine`                 | Рушій контексту             |
| `registerService`                       | Фоновий сервіс              |

Поведінка захисту hook для типізованих хуків життєвого циклу:

- `before_tool_call`: `{ block: true }` є термінальним; обробники нижчого пріоритету пропускаються.
- `before_tool_call`: `{ block: false }` не робить нічого й не скасовує попереднє блокування.
- `before_install`: `{ block: true }` є термінальним; обробники нижчого пріоритету пропускаються.
- `before_install`: `{ block: false }` не робить нічого й не скасовує попереднє блокування.
- `message_sending`: `{ cancel: true }` є термінальним; обробники нижчого пріоритету пропускаються.
- `message_sending`: `{ cancel: false }` не робить нічого й не скасовує попереднє скасування.

Native сервер застосунку Codex передає події інструментів Codex-native назад у цю
поверхню hook. Plugin можуть блокувати native інструменти Codex через `before_tool_call`,
спостерігати результати через `after_tool_call` і брати участь у погодженнях
`PermissionRequest` Codex. Міст поки що не переписує аргументи інструментів Codex-native.
Точна межа підтримки runtime Codex описана в
[Контракті підтримки harness Codex v1](/uk/plugins/codex-harness#v1-support-contract).

Повну поведінку типізованих hook див. в [Огляді SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Створення Plugin](/uk/plugins/building-plugins) — створіть власний Plugin
- [Пакети Plugin](/uk/plugins/bundles) — сумісність пакетів Codex/Claude/Cursor
- [Маніфест Plugin](/uk/plugins/manifest) — схема маніфесту
- [Реєстрація інструментів](/uk/plugins/building-plugins#registering-agent-tools) — додавання інструментів агента в Plugin
- [Внутрішня будова Plugin](/uk/plugins/architecture) — модель можливостей і конвеєр завантаження
- [Plugin спільноти](/uk/plugins/community) — сторонні списки
