---
read_when:
    - Встановлення або налаштування плагінів
    - Розуміння правил виявлення та завантаження плагінів
    - Робота з сумісними з Codex/Claude пакетами плагінів
sidebarTitle: Install and Configure
summary: Встановлюйте, налаштовуйте та керуйте плагінами OpenClaw
title: Плагіни
x-i18n:
    generated_at: "2026-04-28T00:03:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7cd8b279b49611bb556e71210cf86eb54b4dc291021df2ae376ad718113ac0de
    source_path: tools/plugin.md
    workflow: 15
---

Плагіни розширюють OpenClaw новими можливостями: канали, постачальники моделей, обв’язки агентів, інструменти, Skills, мовлення, транскрипція в реальному часі, голос у реальному часі, розуміння медіа, генерація зображень, генерація відео, отримання даних із вебу, вебпошук тощо. Деякі плагіни є **core** (постачаються разом з OpenClaw), інші — **external** (опубліковані спільнотою в npm).

## Швидкий старт

<Steps>
  <Step title="Подивіться, що завантажено">
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

Якщо ви надаєте перевагу керуванню безпосередньо в чаті, увімкніть `commands.plugins: true` і використовуйте:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Шлях установлення використовує той самий механізм розпізнавання, що й CLI: локальний шлях/архів, явний `clawhub:<pkg>`, явний `npm:<pkg>` або специфікація пакета без префікса (спочатку ClawHub, потім резервний варіант npm).

Якщо конфігурація недійсна, установлення зазвичай безпечно завершується з відмовою та вказує вам на `openclaw doctor --fix`. Єдиний виняток для відновлення — вузький шлях перевстановлення вбудованого плагіна для плагінів, які використовують
`openclaw.install.allowInvalidConfigRecovery`.
Під час запуску Gateway недійсна конфігурація одного плагіна ізолюється лише до цього плагіна:
під час запуску в журналі фіксується проблема `plugins.entries.<id>.config`, цей плагін пропускається під час завантаження, а інші плагіни та канали залишаються онлайн. Запустіть `openclaw doctor --fix`,
щоб ізолювати неправильну конфігурацію плагіна, вимкнувши цей запис плагіна та видаливши його недійсний вміст конфігурації; звичайна резервна копія конфігурації збереже попередні значення.
Коли конфігурація каналу посилається на плагін, який більше неможливо виявити, але той самий застарілий ідентифікатор плагіна залишається в конфігурації плагіна або записах установлення, під час запуску Gateway
журналюються попередження, і цей канал пропускається замість блокування всіх інших каналів.
Запустіть `openclaw doctor --fix`, щоб видалити застарілі записи каналу/плагіна; невідомі ключі каналу без ознак застарілого плагіна все одно не проходять валідацію, щоб помилки в написанні залишалися помітними.
Якщо встановлено `plugins.enabled: false`, застарілі посилання на плагіни вважаються неактивними:
під час запуску Gateway пропускаються роботи з виявлення/завантаження плагінів, а `openclaw doctor` зберігає вимкнену конфігурацію плагіна замість її автоматичного видалення. Знову ввімкніть плагіни перед
запуском очищення doctor, якщо хочете видалити застарілі ідентифікатори плагінів.

Пакетні інсталяції OpenClaw не встановлюють завчасно все дерево залежностей середовища виконання для кожного вбудованого плагіна.
Коли вбудований плагін, який належить OpenClaw, активний через конфігурацію
плагіна, застарілу конфігурацію каналу або маніфест із увімкненням за замовчуванням, під час запуску
виправляються лише оголошені залежності середовища виконання цього плагіна перед його імпортом.
Лише збережений стан автентифікації каналу сам по собі не активує вбудований канал для виправлення
залежностей середовища виконання під час запуску Gateway.
Явне вимкнення все одно має пріоритет: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` і `channels.<id>.enabled: false`
запобігають автоматичному виправленню вбудованих залежностей середовища виконання для цього плагіна/каналу.
Непорожній `plugins.allow` також обмежує виправлення вбудованих залежностей середовища виконання для вбудованих плагінів, увімкнених за замовчуванням;
явне ввімкнення вбудованого каналу (`channels.<id>.enabled: true`) усе ще може виправити залежності плагіна цього каналу.
External-плагіни та користувацькі шляхи завантаження, як і раніше, потрібно встановлювати через
`openclaw plugins install`.

## Типи плагінів

OpenClaw розпізнає два формати плагінів:

| Формат     | Як це працює                                                    | Приклади                                               |
| ---------- | --------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + модуль середовища виконання; виконується в межах процесу | Офіційні плагіни, npm-пакети спільноти                 |
| **Bundle** | Сумісний із Codex/Claude/Cursor макет; зіставляється з можливостями OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва відображаються в `openclaw plugins list`. Докладніше про пакети див. у [Plugin Bundles](/uk/plugins/bundles).

Якщо ви пишете Native-плагін, почніть із [Building Plugins](/uk/plugins/building-plugins)
та [Plugin SDK Overview](/uk/plugins/sdk-overview).

## Точки входу пакета

Npm-пакети Native-плагінів мають оголошувати `openclaw.extensions` у `package.json`.
Кожен запис має залишатися в межах каталогу пакета та вказувати на доступний для читання
файл середовища виконання або на вихідний файл TypeScript з виведеним
зібраним JavaScript-відповідником, наприклад `src/index.ts` до `dist/index.js`.

Використовуйте `openclaw.runtimeExtensions`, якщо опубліковані файли середовища виконання не розміщені за тими самими шляхами, що й записи вихідного коду. Якщо цей параметр присутній, `runtimeExtensions` має містити
рівно один запис для кожного запису `extensions`. Невідповідні списки призводять до помилки встановлення та
виявлення плагіна замість тихого резервного переходу до шляхів вихідного коду.

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

| Плагін          | Пакет                  | Документація                         |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/uk/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/uk/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/uk/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/uk/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/uk/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/uk/plugins/zalouser)   |

### Core (постачаються разом з OpenClaw)

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
    - `memory-lancedb` — довготривала пам’ять з установленням на вимогу, автоматичним пригадуванням/захопленням (установіть `plugins.slots.memory = "memory-lancedb"`)

    Див. [Memory LanceDB](/uk/plugins/memory-lancedb), щоб дізнатися про
    налаштування ембедингів, сумісних з OpenAI, приклади Ollama, ліміти пригадування та усунення несправностей.

  </Accordion>

  <Accordion title="Постачальники мовлення (увімкнені за замовчуванням)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` — вбудований browser-плагін для browser-інструмента, CLI `openclaw browser`, методу Gateway `browser.request`, browser runtime і служби керування браузером за замовчуванням (увімкнений за замовчуванням; вимкніть його перед заміною)
    - `copilot-proxy` — міст VS Code Copilot Proxy (за замовчуванням вимкнений)
  </Accordion>
</AccordionGroup>

Шукаєте сторонні плагіни? Див. [Community Plugins](/uk/plugins/community).

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
| --------------- | --------------------------------------------------------- |
| `enabled`       | Головний перемикач (типово: `true`)                       |
| `allow`         | Список дозволених плагінів (необов’язково)                |
| `deny`          | Список заборонених плагінів (необов’язково; заборона має пріоритет) |
| `load.paths`    | Додаткові файли/каталоги плагінів                         |
| `slots`         | Селектори ексклюзивних слотів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>` | Перемикачі та конфігурація для окремого плагіна          |

Зміни конфігурації **потребують перезапуску Gateway**. Якщо Gateway запущений з
відстеженням конфігурації та внутрішньопроцесним перезапуском (стандартний шлях `openclaw gateway`),
цей перезапуск зазвичай виконується автоматично невдовзі після запису змін конфігурації.
Підтримуваного шляху гарячого перезавантаження для коду середовища виконання Native-плагіна або хуків життєвого циклу немає;
перезапустіть процес Gateway, який обслуговує активний канал, перш ніж
очікувати, що оновлений код `register(api)`, хуки `api.on(...)`, інструменти, служби або
хуки постачальника/runtime почнуть виконуватися.

`openclaw plugins list` — це локальний знімок реєстру/конфігурації плагінів. Позначка
`enabled` для плагіна там означає, що збережений реєстр і поточна конфігурація дозволяють
плагіну брати участь у роботі. Це не доводить, що вже запущений віддалений дочірній процес Gateway
було перезапущено з тим самим кодом плагіна. У середовищах VPS/контейнерів з
процесами-обгортками надсилайте перезапуски фактичному процесу `openclaw gateway run`
або використовуйте `openclaw gateway restart` для запущеного Gateway.

<Accordion title="Стани плагіна: вимкнений vs відсутній vs недійсний">
  - **Вимкнений**: плагін існує, але правила ввімкнення вимкнули його. Конфігурація зберігається.
  - **Відсутній**: конфігурація посилається на ідентифікатор плагіна, який не було знайдено під час виявлення.
  - **Недійсний**: плагін існує, але його конфігурація не відповідає оголошеній схемі. Під час запуску Gateway пропускається лише цей плагін; `openclaw doctor --fix` може ізолювати недійсний запис, вимкнувши його та видаливши його вміст конфігурації.
</Accordion>

## Виявлення та пріоритетність

OpenClaw сканує плагіни в такому порядку (перше знайдене збіг має пріоритет):

<Steps>
  <Step title="Шляхи конфігурації">
    `plugins.load.paths` — явні шляхи до файлів або каталогів. Шляхи, які вказують
    назад на власні каталогі пакетних вбудованих плагінів OpenClaw, ігноруються;
    запустіть `openclaw doctor --fix`, щоб видалити ці застарілі псевдоніми.
  </Step>

  <Step title="Плагіни робочого простору">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` і `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Глобальні плагіни">
    `~/.openclaw/<plugin-root>/*.ts` і `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Вбудовані плагіни">
    Постачаються разом з OpenClaw. Багато з них увімкнені за замовчуванням (постачальники моделей, мовлення).
    Інші потребують явного ввімкнення.
  </Step>
</Steps>

Пакетні інсталяції та Docker-образи зазвичай визначають вбудовані плагіни з
зібраного дерева `dist/extensions`. Якщо каталог вихідного коду вбудованого плагіна
монтується bind-монтуванням поверх відповідного пакетного шляху вихідного коду, наприклад
`/app/extensions/synology-chat`, OpenClaw розглядає цей змонтований каталог вихідного коду
як накладання вихідного коду вбудованого плагіна та виявляє його раніше за пакетний
пакет `/app/dist/extensions/synology-chat`. Це дозволяє циклам роботи супровідників у контейнерах
працювати без перемикання кожного вбудованого плагіна назад на вихідний код TypeScript.
Установіть `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, щоб примусово використовувати пакетні dist-збірки,
навіть якщо присутні змонтовані накладання вихідного коду.

### Правила ввімкнення

- `plugins.enabled: false` вимикає всі плагіни й пропускає роботу з виявлення/завантаження плагінів
- `plugins.deny` завжди має пріоритет над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей плагін
- Плагіни з робочого простору **вимкнені за замовчуванням** (їх потрібно явно ввімкнути)
- Вбудовані плагіни дотримуються вбудованого набору, увімкненого за замовчуванням, якщо це не перевизначено
- Ексклюзивні слоти можуть примусово ввімкнути вибраний плагін для цього слота
- Деякі вбудовані opt-in плагіни вмикаються автоматично, коли конфігурація називає
  поверхню, що належить плагіну, наприклад посилання на модель постачальника, конфігурацію каналу або
  runtime обв’язки
- Застаріла конфігурація плагіна зберігається, поки активне `plugins.enabled: false`;
  знову ввімкніть плагіни перед запуском очищення doctor, якщо хочете видалити застарілі ідентифікатори
- Маршрути Codex сімейства OpenAI зберігають окремі межі плагінів:
  `openai-codex/*` належить плагіну OpenAI, тоді як вбудований плагін Codex
  app-server вибирається через `agentRuntime.id: "codex"` або застарілі
  посилання на модель `codex/*`

## Усунення проблем із runtime-хуками

Якщо плагін з’являється в `plugins list`, але побічні ефекти `register(api)` або хуки
не запускаються в трафіку живого чату, спочатку перевірте таке:

- Запустіть `openclaw gateway status --deep --require-rpc` і підтвердьте, що активні
  URL Gateway, профіль, шлях до конфігурації та процес — саме ті, які ви редагуєте.
- Перезапустіть активний Gateway після змін установлення/конфігурації/коду плагіна. У контейнерах
  з обгортками PID 1 може бути лише супервізором; перезапустіть або надішліть сигнал дочірньому
  процесу `openclaw gateway run`.
- Використайте `openclaw plugins inspect <id> --json`, щоб підтвердити реєстрацію хуків і
  діагностику. Для невбудованих conversation-хуків, таких як `llm_input`,
  `llm_output`, `before_agent_finalize` і `agent_end`, потрібен
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання моделей надавайте перевагу `before_model_resolve`. Він запускається до
  розв’язання моделі для ходів агента; `llm_output` запускається лише після того, як спроба моделі
  дає відповідь асистента.
- Для підтвердження фактичної моделі сесії використовуйте `openclaw sessions` або
  поверхні сесії/статусу Gateway, а під час налагодження payload постачальника запускайте
  Gateway з `--raw-stream --raw-stream-path <path>`.

### Дублювання володіння каналом або інструментом

Симптоми:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Це означає, що більш ніж один увімкнений плагін намагається володіти тим самим каналом,
потоком налаштування або назвою інструмента. Найпоширеніша причина — зовнішній плагін каналу,
установлений поруч із вбудованим плагіном, який тепер надає той самий ідентифікатор каналу.

Кроки налагодження:

- Запустіть `openclaw plugins list --enabled --verbose`, щоб побачити кожен увімкнений плагін
  і його походження.
- Запустіть `openclaw plugins inspect <id> --json` для кожного підозрюваного плагіна та
  порівняйте `channels`, `channelConfigs`, `tools` і діагностику.
- Запустіть `openclaw plugins registry --refresh` після встановлення або видалення
  пакетів плагінів, щоб збережені метадані відображали поточний стан установлення.
- Перезапустіть Gateway після змін установлення, реєстру або конфігурації.

Варіанти виправлення:

- Якщо один плагін навмисно замінює інший для того самого ідентифікатора каналу,
  бажаний плагін має оголосити `channelConfigs.<channel-id>.preferOver` із
  ідентифікатором плагіна з нижчим пріоритетом. Див. [/plugins/manifest#replacing-another-channel-plugin](/uk/plugins/manifest#replacing-another-channel-plugin).
- Якщо дублювання випадкове, вимкніть одну зі сторін через
  `plugins.entries.<plugin-id>.enabled: false` або видаліть застаріле встановлення плагіна.
- Якщо ви явно ввімкнули обидва плагіни, OpenClaw зберігає цей запит і
  повідомляє про конфлікт. Виберіть одного власника для каналу або перейменуйте інструменти,
  що належать плагіну, щоб поверхня runtime була однозначною.

## Слоти плагінів (ексклюзивні категорії)

Деякі категорії є ексклюзивними (одночасно може бути активним лише один):

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

| Слот            | Що він контролює        | Типово              |
| --------------- | ----------------------- | ------------------- |
| `memory`        | Active Memory plugin    | `memory-core`       |
| `contextEngine` | Активний рушій контексту | `legacy` (вбудований) |

## Довідка CLI

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

Вбудовані плагіни постачаються разом з OpenClaw. Багато з них увімкнені за замовчуванням (наприклад,
вбудовані постачальники моделей, вбудовані постачальники мовлення та вбудований
browser-плагін). Інші вбудовані плагіни все ще потребують `openclaw plugins enable <id>`.

`--force` перезаписує наявний установлений плагін або hook pack на місці. Використовуйте
`openclaw plugins update <id-or-npm-spec>` для звичайних оновлень відстежуваних npm-
плагінів. Він не підтримується з `--link`, який повторно використовує шлях до джерела
замість копіювання в керовану ціль установлення.

Коли `plugins.allow` уже встановлено, `openclaw plugins install` додає
ідентифікатор встановленого плагіна до цього списку дозволених перед його ввімкненням. Якщо той самий ідентифікатор плагіна
присутній у `plugins.deny`, установлення видаляє цей застарілий запис deny, щоб
явно встановлений плагін можна було одразу завантажити після перезапуску.

OpenClaw зберігає локальний реєстр плагінів як постійну модель холодного читання для
інвентаризації плагінів, володіння внесками та планування запуску. Потоки встановлення, оновлення,
видалення, увімкнення та вимкнення оновлюють цей реєстр після зміни стану
плагіна. Той самий файл `plugins/installs.json` зберігає довговічні метадані встановлення у
верхньорівневому `installRecords` та відновлювані метадані маніфесту в `plugins`. Якщо
реєстр відсутній, застарілий або недійсний, `openclaw plugins registry
--refresh` перебудовує його представлення маніфесту із записів установлення, політики конфігурації та
метаданих маніфесту/пакета без завантаження runtime-модулів плагіна.
`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних установлень. Передавання
специфікації npm-пакета з dist-tag або точною версією зводить назву пакета
назад до відстежуваного запису плагіна та записує нову специфікацію для майбутніх оновлень.
Передавання назви пакета без версії повертає точно зафіксоване встановлення назад до
типової лінії випуску реєстру. Якщо встановлений npm-плагін уже відповідає
розв’язаній версії та записаній ідентичності артефакту, OpenClaw пропускає оновлення
без завантаження, перевстановлення або перезапису конфігурації.

`--pin` є лише для npm. Він не підтримується з `--marketplace`, тому що
установлення з marketplace зберігають метадані джерела marketplace замість npm-специфікації.

`--dangerously-force-unsafe-install` — це аварійне перевизначення для хибнопозитивних
спрацювань вбудованого сканера небезпечного коду. Воно дозволяє встановлення плагінів
та оновлення плагінів попри вбудовані знахідки рівня `critical`, але все одно
не обходить блокування політики плагіна `before_install` або блокування через помилки сканування.
Сканування встановлення ігнорують поширені тестові файли та каталоги, такі як `tests/`,
`__tests__/`, `*.test.*` і `*.spec.*`, щоб не блокувати пакетні тестові моки;
оголошені runtime-точки входу плагіна все одно скануються, навіть якщо вони використовують одну з
цих назв.

Цей прапорець CLI застосовується лише до потоків встановлення/оновлення плагінів. Установлення залежностей Skills через Gateway
замість цього використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як
`openclaw skills install` залишається окремим потоком завантаження/установлення Skills із ClawHub.

Сумісні пакети беруть участь у тому самому потоці list/inspect/enable/disable
для плагінів. Поточна підтримка runtime охоплює Skills у пакетах, Claude command-skills,
значення за замовчуванням Claude `settings.json`, значення за замовчуванням Claude `.lsp.json` і оголошені в маніфесті
`lspServers`, Cursor command-skills та сумісні каталоги хуків Codex.

`openclaw plugins inspect <id>` також повідомляє про виявлені можливості пакета, а також
підтримувані або непідтримувані записи MCP і LSP-серверів для плагінів на основі пакетів.

Джерела marketplace можуть бути відомою назвою marketplace Claude з
`~/.claude/plugins/known_marketplaces.json`, локальним коренем marketplace або шляхом до
`marketplace.json`, скороченим записом GitHub на кшталт `owner/repo`, URL репозиторію GitHub або git URL. Для віддалених marketplace записи плагінів мають залишатися в межах
клонованого репозиторію marketplace і використовувати лише відносні шляхи джерел.

Див. повну інформацію в [довідці CLI `openclaw plugins`](/uk/cli/plugins).

## Огляд API плагінів

Native-плагіни експортують вхідний об’єкт, який надає `register(api)`. Старіші
плагіни все ще можуть використовувати `activate(api)` як застарілий псевдонім, але нові плагіни повинні
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

OpenClaw завантажує вхідний об’єкт і викликає `register(api)` під час
активації плагіна. Завантажувач усе ще повертається до `activate(api)` для старіших плагінів,
але вбудовані плагіни та нові зовнішні плагіни мають розглядати `register` як
публічний контракт.

`api.registrationMode` повідомляє плагіну, чому завантажується його вхідний об’єкт:

| Режим          | Значення                                                                                                                         |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`         | Активація runtime. Реєструйте інструменти, хуки, служби, команди, маршрути та інші побічні ефекти активної роботи.            |
| `discovery`    | Виявлення можливостей лише для читання. Реєструйте постачальників і метадані; код вхідного об’єкта довіреного плагіна може завантажуватися, але пропускайте побічні ефекти активної роботи. |
| `setup-only`   | Завантаження метаданих налаштування каналу через полегшений вхідний об’єкт налаштування.                                        |
| `setup-runtime` | Завантаження налаштування каналу, яке також потребує runtime-вхідного об’єкта.                                                  |
| `cli-metadata` | Лише збирання метаданих команди CLI.                                                                                             |

Записи плагінів, які відкривають сокети, бази даних, фонові воркери або довгоживучі
клієнти, повинні захищати ці побічні ефекти за допомогою `api.registrationMode === "full"`.
Завантаження для виявлення кешуються окремо від активаційних завантажень і не замінюють
реєстр запущеного Gateway. Виявлення не активує runtime, але й не є вільним від імпорту:
OpenClaw може обчислювати довірений вхідний об’єкт плагіна або модуль channel-плагіна, щоб побудувати
знімок. Робіть верхні рівні модуля легкими та без побічних ефектів, а мережевих клієнтів,
підпроцеси, слухачів, зчитування облікових даних і запуск служб переносіть у шляхи повного runtime.

Поширені методи реєстрації:

| Метод                                   | Що він реєструє            |
| --------------------------------------- | -------------------------- |
| `registerProvider`                      | Постачальник моделей (LLM) |
| `registerChannel`                       | Канал чату                 |
| `registerTool`                          | Інструмент агента          |
| `registerHook` / `on(...)`              | Хуки життєвого циклу       |
| `registerSpeechProvider`                | Text-to-speech / STT       |
| `registerRealtimeTranscriptionProvider` | Потоковий STT              |
| `registerRealtimeVoiceProvider`         | Двосторонній голос у реальному часі |
| `registerMediaUnderstandingProvider`    | Аналіз зображень/аудіо     |
| `registerImageGenerationProvider`       | Генерація зображень        |
| `registerMusicGenerationProvider`       | Генерація музики           |
| `registerVideoGenerationProvider`       | Генерація відео            |
| `registerWebFetchProvider`              | Постачальник отримання/скрапінгу вебданих |
| `registerWebSearchProvider`             | Вебпошук                   |
| `registerHttpRoute`                     | HTTP-ендпойнт              |
| `registerCommand` / `registerCli`       | Команди CLI                |
| `registerContextEngine`                 | Рушій контексту            |
| `registerService`                       | Фонова служба              |

Поведінка guard-хуків для типізованих хуків життєвого циклу:

- `before_tool_call`: `{ block: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: `{ block: false }` нічого не робить і не скасовує раніше встановлене блокування.
- `before_install`: `{ block: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `before_install`: `{ block: false }` нічого не робить і не скасовує раніше встановлене блокування.
- `message_sending`: `{ cancel: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `message_sending`: `{ cancel: false }` нічого не робить і не скасовує раніше встановлене скасування.

Native Codex app-server повертає через міст події інструментів Codex-native назад у цю
поверхню хуків. Плагіни можуть блокувати native-інструменти Codex через `before_tool_call`,
спостерігати результати через `after_tool_call` і брати участь у схваленнях
Codex `PermissionRequest`. Міст поки що не переписує аргументи native-інструментів Codex. Точна межа підтримки runtime Codex описана в
[Codex harness v1 support contract](/uk/plugins/codex-harness#v1-support-contract).

Щоб дізнатися про повну поведінку типізованих хуків, див. [огляд SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Building plugins](/uk/plugins/building-plugins) — створення власного плагіна
- [Plugin bundles](/uk/plugins/bundles) — сумісність пакетів Codex/Claude/Cursor
- [Plugin manifest](/uk/plugins/manifest) — схема маніфесту
- [Registering tools](/uk/plugins/building-plugins#registering-agent-tools) — додавання інструментів агента в плагін
- [Plugin internals](/uk/plugins/architecture) — модель можливостей і конвеєр завантаження
- [Community plugins](/uk/plugins/community) — сторонні списки
