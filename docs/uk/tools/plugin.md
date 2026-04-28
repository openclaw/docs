---
read_when:
    - Установлення або налаштування плагінів
    - Розуміння правил виявлення та завантаження Plugin
    - Робота з пакетами Plugin, сумісними з Codex/Claude
sidebarTitle: Install and Configure
summary: Встановлюйте, налаштовуйте та керуйте Plugin OpenClaw
title: Плагіни
x-i18n:
    generated_at: "2026-04-28T11:27:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2daf99b9f4b14f8af1a7aaf0fb0e467a758fdd3a100d6b2bdf0e8c4a175616aa
    source_path: tools/plugin.md
    workflow: 16
---

Плагіни розширюють OpenClaw новими можливостями: каналами, постачальниками моделей,
оболонками агентів, інструментами, skills, мовленням, транскрипцією в реальному часі, голосом у реальному часі,
розумінням медіа, генерацією зображень, генерацією відео, отриманням даних з вебу, вебпошуком
і не тільки. Деякі плагіни є **основними** (постачаються з OpenClaw), інші
є **зовнішніми** (публікуються спільнотою в npm).

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
    openclaw plugins install @openclaw/voice-call

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
</Steps>

Якщо ви віддаєте перевагу керуванню безпосередньо з чату, увімкніть `commands.plugins: true` і використовуйте:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Шлях установлення використовує той самий резолвер, що й CLI: локальний шлях/архів, явний
`clawhub:<pkg>`, явний `npm:<pkg>` або звичайна специфікація пакета (спершу ClawHub, потім
резервний npm).

Якщо конфігурація недійсна, установлення зазвичай завершується закритою відмовою й спрямовує вас до
`openclaw doctor --fix`. Єдиний виняток для відновлення — вузький шлях повторного встановлення
вбудованого плагіна для плагінів, які вмикають
`openclaw.install.allowInvalidConfigRecovery`.
Під час запуску Gateway недійсна конфігурація одного плагіна ізолюється до цього плагіна:
запуск записує проблему `plugins.entries.<id>.config` у журнали, пропускає цей плагін під час
завантаження й залишає інші плагіни та канали онлайн. Запустіть `openclaw doctor --fix`,
щоб ізолювати помилкову конфігурацію плагіна, вимкнувши цей запис плагіна й видаливши
його недійсне конфігураційне навантаження; звичайна резервна копія конфігурації зберігає попередні значення.
Коли конфігурація каналу посилається на плагін, який більше не виявляється, але той самий
застарілий id плагіна лишається в конфігурації плагіна або записах установлення, запуск Gateway
записує попередження й пропускає цей канал замість блокування всіх інших каналів.
Запустіть `openclaw doctor --fix`, щоб видалити застарілі записи каналу/плагіна; невідомі
ключі каналів без ознак застарілого плагіна все ще не проходять валідацію, щоб помилки введення
лишалися помітними.
Якщо встановлено `plugins.enabled: false`, застарілі посилання на плагіни розглядаються як інертні:
запуск Gateway пропускає роботу з виявлення/завантаження плагінів, а `openclaw doctor` зберігає
вимкнену конфігурацію плагіна замість автоматичного видалення. Повторно ввімкніть плагіни перед
запуском очищення doctor, якщо хочете видалити застарілі id плагінів.

Пакетовані встановлення OpenClaw не встановлюють завчасно дерево runtime-залежностей кожного
вбудованого плагіна. Коли вбудований плагін, що належить OpenClaw, активний із
конфігурації плагіна, застарілої конфігурації каналу або маніфесту з типовим увімкненням, запуск
відновлює лише оголошені runtime-залежності цього плагіна перед його імпортом.
Сам лише збережений стан автентифікації каналу не активує вбудований канал для
відновлення runtime-залежностей під час запуску Gateway.
Явне вимкнення усе ще має пріоритет: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` і `channels.<id>.enabled: false`
запобігають автоматичному відновленню вбудованих runtime-залежностей для цього плагіна/каналу.
Непорожній `plugins.allow` також обмежує відновлення вбудованих runtime-залежностей,
увімкнених за замовчуванням; явне ввімкнення вбудованого каналу (`channels.<id>.enabled: true`) усе ще може
відновити залежності плагіна цього каналу.
Зовнішні плагіни й користувацькі шляхи завантаження все одно потрібно встановлювати через
`openclaw plugins install`.

## Типи плагінів

OpenClaw розпізнає два формати плагінів:

| Формат     | Як це працює                                                       | Приклади                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Нативний** | `openclaw.plugin.json` + runtime-модуль; виконується в процесі       | Офіційні плагіни, npm-пакети спільноти               |
| **Bundle** | Сумісна з Codex/Claude/Cursor структура; зіставляється з можливостями OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва відображаються в `openclaw plugins list`. Докладніше про Bundle див. у [Plugin Bundles](/uk/plugins/bundles).

Якщо ви пишете нативний плагін, почніть із [Створення плагінів](/uk/plugins/building-plugins)
і [Огляд Plugin SDK](/uk/plugins/sdk-overview).

## Точки входу пакета

Npm-пакети нативних плагінів мають оголошувати `openclaw.extensions` у `package.json`.
Кожен запис має лишатися всередині каталогу пакета й резолвитися до читабельного
runtime-файла або до TypeScript-файла джерельного коду з виведеним збудованим JavaScript-парником,
наприклад `src/index.ts` до `dist/index.js`.

Використовуйте `openclaw.runtimeExtensions`, коли опубліковані runtime-файли не розташовані
за тими самими шляхами, що й записи джерел. Якщо `runtimeExtensions` присутній, він має містити
рівно один запис для кожного запису `extensions`. Невідповідні списки спричиняють помилку встановлення та
виявлення плагінів замість тихого резервного переходу до шляхів джерел.

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

### Доступні для встановлення (npm)

| Плагін          | Пакет                | Документація                                 |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/uk/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/uk/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/uk/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/uk/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/uk/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/uk/plugins/zalouser)   |

### Основні (постачаються з OpenClaw)

<AccordionGroup>
  <Accordion title="Постачальники моделей (увімкнені за замовчуванням)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Плагіни пам’яті">
    - `memory-core` — вбудований пошук у пам’яті (за замовчуванням через `plugins.slots.memory`)
    - `memory-lancedb` — довготривала пам’ять із установленням на вимогу та автоматичним пригадуванням/захопленням (задайте `plugins.slots.memory = "memory-lancedb"`)

    Див. [Memory LanceDB](/uk/plugins/memory-lancedb) щодо налаштування embedding, сумісного з OpenAI,
    прикладів Ollama, обмежень пригадування й усунення несправностей.

  </Accordion>

  <Accordion title="Постачальники мовлення (увімкнені за замовчуванням)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` — вбудований браузерний плагін для інструмента браузера, CLI `openclaw browser`, gateway-методу `browser.request`, runtime браузера та типового сервісу керування браузером (увімкнений за замовчуванням; вимкніть перед заміною)
    - `copilot-proxy` — міст VS Code Copilot Proxy (вимкнений за замовчуванням)

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
| `load.paths`     | Додаткові файли/каталоги плагінів                            |
| `slots`          | Ексклюзивні селектори слотів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>` | Перемикачі й конфігурація для окремого плагіна                               |

Зміни конфігурації **потребують перезапуску Gateway**. Якщо Gateway працює з увімкненим
спостереженням за конфігурацією та перезапуском у процесі (типовий шлях `openclaw gateway`), цей
перезапуск зазвичай виконується автоматично за мить після запису конфігурації.
Підтримуваного шляху гарячого перезавантаження для runtime-коду нативного плагіна або lifecycle-хуків
немає; перезапустіть процес Gateway, який обслуговує живий канал, перш ніж
очікувати виконання оновленого коду `register(api)`, хуків `api.on(...)`, інструментів, сервісів або
provider/runtime-хуків.

`openclaw plugins list` — це локальний знімок реєстру/конфігурації плагінів.
Плагін зі станом `enabled` там означає, що збережений реєстр і поточна конфігурація дозволяють
плагіну брати участь. Це не доводить, що вже запущений віддалений дочірній процес Gateway
перезапустився з тим самим кодом плагіна. У налаштуваннях VPS/контейнерів із
процесами-обгортками надсилайте перезапуски фактичному процесу `openclaw gateway run`
або використовуйте `openclaw gateway restart` для запущеного Gateway.

<Accordion title="Стани плагіна: вимкнений, відсутній, недійсний">
  - **Вимкнений**: плагін існує, але правила ввімкнення вимкнули його. Конфігурація зберігається.
  - **Відсутній**: конфігурація посилається на id плагіна, який не було знайдено під час виявлення.
  - **Недійсний**: плагін існує, але його конфігурація не відповідає оголошеній схемі. Запуск Gateway пропускає лише цей плагін; `openclaw doctor --fix` може ізолювати недійсний запис, вимкнувши його й видаливши його конфігураційне навантаження.

</Accordion>

## Виявлення та пріоритет

OpenClaw сканує плагіни в такому порядку (перший збіг перемагає):

<Steps>
  <Step title="Шляхи конфігурації">
    `plugins.load.paths` — явні шляхи до файлів або каталогів. Шляхи, які вказують
    назад на власні пакетовані каталоги вбудованих плагінів OpenClaw, ігноруються;
    запустіть `openclaw doctor --fix`, щоб видалити ці застарілі псевдоніми.
  </Step>

  <Step title="Плагіни робочого простору">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` і `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Глобальні плагіни">
    `~/.openclaw/<plugin-root>/*.ts` і `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Вбудовані плагіни">
    Постачаються з OpenClaw. Багато з них увімкнені за замовчуванням (постачальники моделей, мовлення).
    Інші потребують явного ввімкнення.
  </Step>
</Steps>

Пакетовані встановлення та Docker-образи зазвичай резолвлять вбудовані плагіни з
скомпільованого дерева `dist/extensions`. Якщо каталог джерел вбудованого плагіна
змонтовано поверх відповідного пакетованого шляху джерел, наприклад
`/app/extensions/synology-chat`, OpenClaw розглядає цей змонтований каталог джерел
як оверлей вбудованих джерел і виявляє його перед пакетованим
бандлом `/app/dist/extensions/synology-chat`. Це підтримує цикли роботи контейнерів для мейнтейнерів
без перемикання кожного вбудованого плагіна назад на TypeScript-джерела.
Задайте `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, щоб примусово використовувати пакетовані dist-бандли
навіть за наявності змонтованих оверлеїв джерел.

### Правила ввімкнення

- `plugins.enabled: false` вимикає всі плагіни та пропускає роботу з виявлення/завантаження плагінів
- `plugins.deny` завжди має пріоритет над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей плагін
- Плагіни, що походять із робочого простору, **вимкнені за замовчуванням** (їх потрібно явно ввімкнути)
- Вбудовані плагіни дотримуються вбудованого набору, увімкненого за замовчуванням, якщо це не перевизначено
- Ексклюзивні слоти можуть примусово ввімкнути вибраний плагін для цього слота
- Деякі вбудовані плагіни з явним увімкненням вмикаються автоматично, коли конфігурація називає
  поверхню, що належить плагіну, наприклад посилання на модель провайдера, конфігурацію каналу або середовище виконання harness
- Застаріла конфігурація плагіна зберігається, поки активний `plugins.enabled: false`;
  повторно ввімкніть плагіни перед запуском очищення doctor, якщо хочете видалити застарілі id
- Маршрути Codex родини OpenAI зберігають окремі межі плагінів:
  `openai-codex/*` належить плагіну OpenAI, тоді як вбудований плагін сервера застосунку Codex
  вибирається через `agentRuntime.id: "codex"` або застарілі посилання на моделі
  `codex/*`

## Усунення проблем із хуками середовища виконання

Якщо плагін з’являється в `plugins list`, але побічні ефекти або хуки `register(api)`
не запускаються в живому чат-трафіку, спершу перевірте таке:

- Запустіть `openclaw gateway status --deep --require-rpc` і переконайтеся, що активні
  URL Gateway, профіль, шлях конфігурації та процес є саме тими, які ви редагуєте.
- Перезапустіть живий Gateway після змін встановлення/конфігурації/коду плагіна. У wrapper-
  контейнерах PID 1 може бути лише супервізором; перезапустіть або надішліть сигнал дочірньому
  процесу `openclaw gateway run`.
- Використовуйте `openclaw plugins inspect <id> --json`, щоб підтвердити реєстрації хуків і
  діагностику. Невбудовані хуки розмови, як-от `llm_input`,
  `llm_output`, `before_agent_finalize` і `agent_end`, потребують
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання моделей віддавайте перевагу `before_model_resolve`. Він виконується перед
  розв’язанням моделі для ходів агента; `llm_output` виконується лише після того, як спроба моделі
  створює відповідь асистента.
- Для підтвердження ефективної моделі сесії використовуйте `openclaw sessions` або
  поверхні сесії/статусу Gateway, а під час налагодження payload провайдера запускайте
  Gateway з `--raw-stream --raw-stream-path <path>`.

### Дублювання володіння каналом або інструментом

Симптоми:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Це означає, що більше ніж один увімкнений плагін намагається володіти тим самим каналом,
потоком налаштування або назвою інструмента. Найпоширеніша причина — зовнішній плагін каналу,
встановлений поряд із вбудованим плагіном, який тепер надає той самий id каналу.

Кроки налагодження:

- Запустіть `openclaw plugins list --enabled --verbose`, щоб побачити кожен увімкнений плагін
  і його походження.
- Запустіть `openclaw plugins inspect <id> --json` для кожного підозрюваного плагіна та
  порівняйте `channels`, `channelConfigs`, `tools` і діагностику.
- Запустіть `openclaw plugins registry --refresh` після встановлення або видалення
  пакетів плагінів, щоб збережені метадані відображали поточне встановлення.
- Перезапустіть Gateway після змін встановлення, реєстру або конфігурації.

Варіанти виправлення:

- Якщо один плагін навмисно замінює інший для того самого id каналу, бажаний плагін має
  оголосити `channelConfigs.<channel-id>.preferOver` з id плагіна нижчого пріоритету. Див. [/plugins/manifest#replacing-another-channel-plugin](/uk/plugins/manifest#replacing-another-channel-plugin).
- Якщо дублювання випадкове, вимкніть одну сторону через
  `plugins.entries.<plugin-id>.enabled: false` або видаліть застаріле встановлення плагіна.
- Якщо ви явно ввімкнули обидва плагіни, OpenClaw зберігає цей запит і
  повідомляє про конфлікт. Виберіть одного власника для каналу або перейменуйте інструменти, що належать плагіну,
  щоб поверхня середовища виконання була однозначною.

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

| Слот            | Що він контролює      | Типове значення             |
| --------------- | --------------------- | ------------------- |
| `memory`        | Плагін активної пам’яті  | `memory-core`       |
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

Вбудовані плагіни постачаються з OpenClaw. Багато з них увімкнені за замовчуванням (наприклад
вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований browser-
плагін). Інші вбудовані плагіни все ще потребують `openclaw plugins enable <id>`.

`--force` перезаписує наявний встановлений плагін або пакет хуків на місці. Використовуйте
`openclaw plugins update <id-or-npm-spec>` для звичайних оновлень відстежуваних npm-
плагінів. Це не підтримується з `--link`, який повторно використовує вихідний шлях замість
копіювання в керовану ціль встановлення.

Коли `plugins.allow` уже задано, `openclaw plugins install` додає
id встановленого плагіна до цього allowlist перед його ввімкненням. Якщо той самий id плагіна
присутній у `plugins.deny`, встановлення видаляє цей застарілий deny-запис, щоб
явне встановлення одразу могло завантажитися після перезапуску.

OpenClaw зберігає локальний реєстр плагінів як cold read model для
інвентаризації плагінів, володіння внесками та планування запуску. Потоки встановлення, оновлення,
видалення, увімкнення та вимкнення оновлюють цей реєстр після зміни стану плагінів.
Той самий файл `plugins/installs.json` зберігає довговічні метадані встановлення у
верхньорівневому `installRecords` і перебудовувані метадані маніфестів у `plugins`. Якщо
реєстр відсутній, застарілий або недійсний, `openclaw plugins registry
--refresh` перебудовує його подання маніфестів із записів встановлення, політики конфігурації та
метаданих маніфестів/пакетів без завантаження модулів середовища виконання плагінів.
`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних встановлень. Передання
специфікації npm-пакета з dist-tag або точною версією розв’язує назву пакета
назад до відстежуваного запису плагіна та записує нову специфікацію для майбутніх оновлень.
Передання назви пакета без версії переводить точно закріплене встановлення назад на
типову release line реєстру. Якщо встановлений npm-плагін уже відповідає
розв’язаній версії та записаній ідентичності артефакта, OpenClaw пропускає оновлення
без завантаження, перевстановлення або переписування конфігурації.

`--pin` працює лише для npm. Він не підтримується з `--marketplace`, тому що
marketplace-встановлення зберігають метадані джерела marketplace замість npm-специфікації.

`--dangerously-force-unsafe-install` — це break-glass перевизначення для хибних
спрацьовувань вбудованого сканера небезпечного коду. Воно дозволяє встановлення плагінів
і оновлення плагінів продовжуватися попри вбудовані знахідки `critical`, але все одно
не обходить блокування політикою `before_install` плагіна або блокування через помилку сканування.
Сканування встановлення ігнорують поширені тестові файли й каталоги, як-от `tests/`,
`__tests__/`, `*.test.*` і `*.spec.*`, щоб не блокувати запаковані тестові моки;
оголошені entrypoint середовища виконання плагіна все одно скануються, навіть якщо вони використовують одну з
цих назв.

Цей CLI-прапорець застосовується лише до потоків встановлення/оновлення плагінів. Встановлення
залежностей skill, підтримані Gateway, натомість використовують відповідне перевизначення запиту
`dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком
завантаження/встановлення skill із ClawHub.

Сумісні bundles беруть участь у тому самому потоці list/inspect/enable/disable
плагінів. Поточна підтримка середовища виконання охоплює bundle skills, command-skills Claude,
типові значення Claude `settings.json`, типові значення Claude `.lsp.json` і оголошені в маніфесті
`lspServers`, command-skills Cursor і сумісні каталоги хуків Codex.

`openclaw plugins inspect <id>` також повідомляє виявлені можливості bundle, а також
підтримувані або непідтримувані записи MCP і LSP-серверів для плагінів, підтриманих bundle.

Джерела marketplace можуть бути відомою назвою marketplace Claude з
`~/.claude/plugins/known_marketplaces.json`, локальним коренем marketplace або
шляхом `marketplace.json`, GitHub-скороченням на кшталт `owner/repo`, URL GitHub repo
або git URL. Для віддалених marketplace записи плагінів мають залишатися всередині
клонованого marketplace repo і використовувати лише відносні джерела шляхів.

Повні подробиці див. у [довіднику CLI `openclaw plugins`](/uk/cli/plugins).

## Огляд API Plugin

Нативні плагіни експортують entry object, який відкриває `register(api)`. Старіші
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

OpenClaw завантажує entry object і викликає `register(api)` під час активації плагіна.
Loader усе ще повертається до `activate(api)` для старіших плагінів,
але вбудовані плагіни та нові зовнішні плагіни мають розглядати `register` як
публічний контракт.

`api.registrationMode` повідомляє плагіну, чому завантажується його entry:

| Режим            | Значення                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Активація середовища виконання. Реєструйте інструменти, хуки, сервіси, команди, маршрути та інші живі побічні ефекти.                              |
| `discovery`     | Виявлення можливостей лише для читання. Реєструйте провайдерів і метадані; довірений entry-код плагіна може завантажуватися, але пропускайте живі побічні ефекти. |
| `setup-only`    | Завантаження метаданих налаштування каналу через легковаговий setup entry.                                                                |
| `setup-runtime` | Завантаження налаштування каналу, якому також потрібен runtime entry.                                                                         |
| `cli-metadata`  | Лише збирання метаданих CLI-команд.                                                                                            |

Plugin-записи, які відкривають сокети, бази даних, фонові воркери або довгоживучі
клієнти, мають захищати ці побічні ефекти за допомогою `api.registrationMode === "full"`.
Завантаження для виявлення кешуються окремо від активувальних завантажень і не замінюють
поточний реєстр Gateway. Виявлення не активує, але не є вільним від імпортів:
OpenClaw може виконати довірений plugin-запис або модуль channel plugin, щоб створити
знімок. Тримайте верхній рівень модулів легким і без побічних ефектів, а мережеві клієнти,
підпроцеси, слухачі, читання облікових даних і запуск сервісів переносьте
за шляхи повного runtime.

Поширені методи реєстрації:

| Метод                                   | Що він реєструє             |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Постачальник моделей (LLM)  |
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
| `registerWebFetchProvider`              | Постачальник web fetch / scrape |
| `registerWebSearchProvider`             | Вебпошук                    |
| `registerHttpRoute`                     | HTTP-кінцева точка          |
| `registerCommand` / `registerCli`       | Команди CLI                 |
| `registerContextEngine`                 | Рушій контексту             |
| `registerService`                       | Фоновий сервіс              |

Поведінка захисту хуків для типізованих хуків життєвого циклу:

- `before_tool_call`: `{ block: true }` є завершальним; обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: `{ block: false }` нічого не робить і не скасовує попереднє блокування.
- `before_install`: `{ block: true }` є завершальним; обробники з нижчим пріоритетом пропускаються.
- `before_install`: `{ block: false }` нічого не робить і не скасовує попереднє блокування.
- `message_sending`: `{ cancel: true }` є завершальним; обробники з нижчим пріоритетом пропускаються.
- `message_sending`: `{ cancel: false }` нічого не робить і не скасовує попереднє скасування.

Нативний app-server Codex запускає міст, який повертає Codex-native події інструментів у цю
поверхню хуків. Plugins можуть блокувати нативні інструменти Codex через `before_tool_call`,
спостерігати результати через `after_tool_call` і брати участь у схваленнях Codex
`PermissionRequest`. Міст поки що не переписує Codex-native аргументи інструментів.
Точна межа підтримки runtime Codex описана в
[контракті підтримки Codex harness v1](/uk/plugins/codex-harness#v1-support-contract).

Повну поведінку типізованих хуків див. в [огляді SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Створення plugins](/uk/plugins/building-plugins) — створіть власний plugin
- [Пакети Plugin](/uk/plugins/bundles) — сумісність пакетів Codex/Claude/Cursor
- [Маніфест Plugin](/uk/plugins/manifest) — схема маніфесту
- [Реєстрація інструментів](/uk/plugins/building-plugins#registering-agent-tools) — додайте інструменти агента в plugin
- [Внутрішня архітектура Plugin](/uk/plugins/architecture) — модель можливостей і конвеєр завантаження
- [Спільнотні plugins](/uk/plugins/community) — списки сторонніх plugins
