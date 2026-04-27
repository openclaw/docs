---
read_when:
    - Встановлення або налаштування Plugin
    - Розуміння правил виявлення та завантаження Plugin
    - Робота з наборами Plugin, сумісними з Codex/Claude
sidebarTitle: Install and Configure
summary: Встановлення, налаштування та керування Plugin OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-04-27T12:55:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 238ea327ade599c8004d766edee37561ca1bad4c7db9a011f6618ef784e14fed
    source_path: tools/plugin.md
    workflow: 15
---

Plugin розширюють OpenClaw новими можливостями: канали, провайдери моделей,
agent harness-и, інструменти, Skills, мовлення, транскрипція в реальному часі,
голос у реальному часі, розуміння медіа, генерація зображень, генерація відео,
отримання вебданих, вебпошук тощо. Деякі Plugin є **core** (постачаються разом з OpenClaw), інші —
**зовнішніми** (публікуються спільнотою в npm).

## Швидкий старт

<Steps>
  <Step title="Подивіться, що завантажено">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Встановіть Plugin">
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

    Потім налаштуйте в `plugins.entries.\<id\>.config` у вашому файлі конфігурації.

  </Step>
</Steps>

Якщо ви надаєте перевагу керуванню безпосередньо з чату, увімкніть `commands.plugins: true` і використовуйте:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Шлях встановлення використовує той самий resolver, що й CLI: локальний
шлях/архів, явний `clawhub:<pkg>`, явний `npm:<pkg>` або проста специфікація пакета (спочатку
ClawHub, потім резервний варіант npm).

Якщо конфігурація некоректна, встановлення зазвичай завершується безпечною відмовою і вказує вам на
`openclaw doctor --fix`. Єдиний виняток для відновлення — вузький шлях
перевстановлення вбудованого Plugin для Plugin, які обирають
`openclaw.install.allowInvalidConfigRecovery`.
Під час запуску Gateway некоректна конфігурація одного Plugin ізолюється лише цим Plugin:
під час запуску логуються проблеми `plugins.entries.<id>.config`, цей Plugin пропускається під час
завантаження, а інші Plugin і канали залишаються онлайн. Запустіть `openclaw doctor --fix`,
щоб помістити некоректну конфігурацію Plugin в карантин, вимкнувши запис цього Plugin і видаливши
його некоректний payload конфігурації; звичайна резервна копія конфігурації зберігає попередні значення.
Коли конфігурація каналу посилається на Plugin, який більше не виявляється, але той самий
застарілий id Plugin залишається в конфігурації Plugin або записах установлення, запуск Gateway
логує попередження і пропускає цей канал замість блокування всіх інших каналів.
Запустіть `openclaw doctor --fix`, щоб видалити застарілі записи каналу/Plugin; невідомі
ключі каналу без ознак застарілого Plugin, як і раніше, не проходять перевірку, щоб
описки залишалися видимими.

Пакетні інсталяції OpenClaw не встановлюють завчасно все дерево runtime-залежностей
кожного вбудованого Plugin. Коли вбудований Plugin, що належить OpenClaw, активний через
конфігурацію Plugin, застарілу конфігурацію каналу або маніфест із типовим увімкненням,
під час запуску відновлюються лише оголошені runtime-залежності цього Plugin перед його імпортом.
Сам по собі збережений стан автентифікації каналу не активує вбудований канал для відновлення
runtime-залежностей під час запуску Gateway.
Явне вимкнення все одно має пріоритет: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` і `channels.<id>.enabled: false`
запобігають автоматичному відновленню runtime-залежностей для цього Plugin/каналу.
Непорожній `plugins.allow` також обмежує типове відновлення runtime-залежностей
для вбудованих Plugin; явне ввімкнення вбудованого каналу (`channels.<id>.enabled: true`) усе ще може
відновити залежності Plugin цього каналу.
Зовнішні Plugin і власні шляхи завантаження, як і раніше, треба встановлювати через
`openclaw plugins install`.

## Типи Plugin

OpenClaw розпізнає два формати Plugin:

| Формат     | Як це працює                                                     | Приклади                                               |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + runtime-модуль; виконується в межах процесу | Офіційні Plugin, пакети npm від спільноти              |
| **Bundle** | Макет, сумісний із Codex/Claude/Cursor; зіставляється з можливостями OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва відображаються в `openclaw plugins list`. Докладно про bundle див. [Набори Plugin](/uk/plugins/bundles).

Якщо ви пишете native Plugin, почніть із [Створення Plugin](/uk/plugins/building-plugins)
та [Огляду Plugin SDK](/uk/plugins/sdk-overview).

## Точки входу пакета

Пакети npm native Plugin мають оголошувати `openclaw.extensions` у `package.json`.
Кожен запис має залишатися в межах каталогу пакета та вказувати на читабельний
runtime-файл або на вихідний файл TypeScript із визначеним зібраним JavaScript-партнером,
наприклад `src/index.ts` до `dist/index.js`.

Використовуйте `openclaw.runtimeExtensions`, коли опубліковані runtime-файли не лежать
за тими самими шляхами, що й вихідні записи. Якщо поле присутнє, `runtimeExtensions` має містити
рівно один запис для кожного запису `extensions`. Невідповідні списки призводять до
помилки встановлення і виявлення Plugin замість тихого переходу до вихідних шляхів.

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
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/uk/plugins/voice-call)   |
| Zalo            | `@openclaw/zalo`      | [Zalo](/uk/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`  | [Zalo Personal](/uk/plugins/zalouser)   |

### Core (постачаються з OpenClaw)

<AccordionGroup>
  <Accordion title="Провайдери моделей (увімкнені типово)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugin пам’яті">
    - `memory-core` — вбудований пошук у пам’яті (типово через `plugins.slots.memory`)
    - `memory-lancedb` — довготривала пам’ять з установленням на вимогу з автоматичним поверненням/захопленням (встановіть `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Провайдери мовлення (увімкнені типово)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` — вбудований Plugin браузера для інструмента browser, CLI `openclaw browser`, методу gateway `browser.request`, runtime браузера та типової служби керування браузером (увімкнений типово; вимкніть його перед заміною)
    - `copilot-proxy` — міст VS Code Copilot Proxy (типово вимкнений)
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

| Поле            | Опис                                                     |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Головний перемикач (типово: `true`)                      |
| `allow`          | Список дозволених Plugin (необов’язково)                 |
| `deny`           | Список заборонених Plugin (необов’язково; deny має пріоритет) |
| `load.paths`     | Додаткові файли/каталоги Plugin                          |
| `slots`          | Селектори ексклюзивних слотів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>` | Перемикачі для окремих Plugin + конфігурація             |

Зміни конфігурації **вимагають перезапуску gateway**. Якщо Gateway запущено з
відстеженням конфігурації + перезапуском у межах процесу (типовий шлях `openclaw gateway`),
цей перезапуск зазвичай виконується автоматично невдовзі після запису конфігурації.
Підтримуваного шляху hot-reload для native runtime-коду Plugin або hooks життєвого циклу немає;
перезапустіть процес Gateway, який обслуговує live-канал, перш ніж очікувати, що оновлений код `register(api)`,
hooks `api.on(...)`, інструменти, служби або hooks provider/runtime почнуть працювати.

`openclaw plugins list` — це локальний snapshot реєстру/конфігурації Plugin. Plugin зі
станом `enabled` там означає, що збережений реєстр і поточна конфігурація дозволяють
цьому Plugin брати участь. Це не доводить, що вже запущений дочірній процес віддаленого Gateway
було перезапущено в той самий код Plugin. У VPS/контейнерних налаштуваннях з
процесами-обгортками надсилайте перезапуски фактичному процесу `openclaw gateway run`,
або використовуйте `openclaw gateway restart` для запущеного Gateway.

<Accordion title="Стани Plugin: disabled, missing, invalid">
  - **Disabled**: Plugin існує, але правила ввімкнення його вимкнули. Конфігурація зберігається.
  - **Missing**: конфігурація посилається на id Plugin, який виявлення не знайшло.
  - **Invalid**: Plugin існує, але його конфігурація не відповідає оголошеній схемі. Під час запуску Gateway пропускається лише цей Plugin; `openclaw doctor --fix` може помістити некоректний запис у карантин, вимкнувши його і видаливши його payload конфігурації.
</Accordion>

## Виявлення та пріоритетність

OpenClaw сканує Plugin у такому порядку (перший збіг перемагає):

<Steps>
  <Step title="Шляхи конфігурації">
    `plugins.load.paths` — явні шляхи до файлів або каталогів. Шляхи, які вказують
    назад на власні пакетні каталоги вбудованих Plugin OpenClaw, ігноруються;
    запустіть `openclaw doctor --fix`, щоб видалити ці застарілі псевдоніми.
  </Step>

  <Step title="Plugin робочого простору">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` і `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Глобальні Plugin">
    `~/.openclaw/<plugin-root>/*.ts` і `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Вбудовані Plugin">
    Постачаються разом з OpenClaw. Багато з них увімкнені типово (провайдери моделей, мовлення).
    Інші потребують явного ввімкнення.
  </Step>
</Steps>

Пакетні інсталяції та Docker-образи зазвичай визначають вбудовані Plugin із
скомпільованого дерева `dist/extensions`. Якщо каталог вихідних кодів вбудованого Plugin
монтується поверх відповідного пакетного шляху вихідного коду, наприклад
`/app/extensions/synology-chat`, OpenClaw розглядає цей змонтований каталог вихідного коду
як overlay джерела вбудованого Plugin і виявляє його раніше за пакетний
bundle `/app/dist/extensions/synology-chat`. Це зберігає цикли супроводу в контейнерах
працездатними без повернення кожного вбудованого Plugin до вихідного коду TypeScript.
Установіть `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, щоб примусово використовувати пакетні dist-bundle-и,
навіть коли присутні mount-налаштування source overlay.

### Правила ввімкнення

- `plugins.enabled: false` вимикає всі Plugin
- `plugins.deny` завжди має пріоритет над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей Plugin
- Plugin з походженням із робочого простору **типово вимкнені** (їх треба явно ввімкнути)
- Вбудовані Plugin дотримуються вбудованого набору типово ввімкнених, якщо не перевизначено
- Ексклюзивні слоти можуть примусово ввімкнути вибраний Plugin для цього слота
- Деякі вбудовані Plugin з опціональним увімкненням вмикаються автоматично, коли конфігурація називає
  поверхню, що належить Plugin, наприклад посилання на модель провайдера, конфігурацію каналу або
  runtime harness-а
- Маршрути Codex сімейства OpenAI зберігають окремі межі Plugin:
  `openai-codex/*` належить Plugin OpenAI, тоді як вбудований Plugin сервера застосунку Codex
  вибирається через `agentRuntime.id: "codex"` або застарілі
  посилання на модель `codex/*`

## Усунення проблем із runtime hooks

Якщо Plugin з’являється в `plugins list`, але побічні ефекти `register(api)` або hooks
не працюють у live-трафіку чату, спочатку перевірте таке:

- Запустіть `openclaw gateway status --deep --require-rpc` і підтвердьте, що активні
  URL Gateway, профіль, шлях до конфігурації та процес — саме ті, які ви редагуєте.
- Перезапустіть live Gateway після змін установлення/конфігурації/коду Plugin. У контейнерах
  з обгортками PID 1 може бути лише супервізором; перезапустіть або надішліть сигнал дочірньому
  процесу `openclaw gateway run`.
- Використовуйте `openclaw plugins inspect <id> --json`, щоб підтвердити реєстрацію hooks і
  діагностику. Невбудовані conversation hooks, такі як `llm_input`,
  `llm_output`, `before_agent_finalize` і `agent_end`, потребують
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання моделей віддавайте перевагу `before_model_resolve`. Він запускається до
  визначення моделі для ходів агента; `llm_output` запускається лише після того, як спроба моделі
  створила вихід assistant.
- Щоб підтвердити ефективну модель сесії, використовуйте `openclaw sessions` або
  поверхні session/status Gateway, а під час налагодження payload-ів провайдера запускайте
  Gateway з `--raw-stream --raw-stream-path <path>`.

### Дубльоване володіння каналом або інструментом

Симптоми:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Це означає, що більше ніж один увімкнений Plugin намагається володіти тим самим каналом,
потоком setup або ім’ям інструмента. Найпоширеніша причина — зовнішній Plugin каналу,
встановлений поруч із вбудованим Plugin, який тепер надає той самий id каналу.

Кроки налагодження:

- Запустіть `openclaw plugins list --enabled --verbose`, щоб побачити кожен увімкнений Plugin
  і його походження.
- Запустіть `openclaw plugins inspect <id> --json` для кожного підозрюваного Plugin і
  порівняйте `channels`, `channelConfigs`, `tools` і діагностику.
- Запустіть `openclaw plugins registry --refresh` після встановлення або видалення
  пакетів Plugin, щоб збережені метадані відображали поточну інсталяцію.
- Перезапустіть Gateway після змін установлення, реєстру або конфігурації.

Варіанти виправлення:

- Якщо один Plugin навмисно замінює інший для того самого id каналу, бажаний
  Plugin має оголосити `channelConfigs.<channel-id>.preferOver` з
  id Plugin нижчого пріоритету. Див. [/plugins/manifest#replacing-another-channel-plugin](/uk/plugins/manifest#replacing-another-channel-plugin).
- Якщо дубль створено випадково, вимкніть одну зі сторін через
  `plugins.entries.<plugin-id>.enabled: false` або видаліть застарілу інсталяцію Plugin.
- Якщо ви явно ввімкнули обидва Plugin, OpenClaw зберігає цей запит і
  повідомляє про конфлікт. Виберіть одного власника каналу або перейменуйте інструменти,
  що належать Plugin, щоб runtime-поверхня була однозначною.

## Слоти Plugin (ексклюзивні категорії)

Деякі категорії є ексклюзивними (одночасно активний лише один):

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

| Слот            | Що він керує            | Типове значення    |
| --------------- | ----------------------- | ------------------ |
| `memory`        | Active Memory Plugin    | `memory-core`      |
| `contextEngine` | Активний engine контексту | `legacy` (вбудований) |

## Довідник CLI

```bash
openclaw plugins list                       # компактний список
openclaw plugins list --enabled            # лише увімкнені Plugin
openclaw plugins list --verbose            # детальні рядки для кожного Plugin
openclaw plugins list --json               # машиночитний список
openclaw plugins inspect <id>              # детальна інформація
openclaw plugins inspect <id> --json       # машиночитний формат
openclaw plugins inspect --all             # таблиця для всього набору
openclaw plugins info <id>                 # псевдонім inspect
openclaw plugins doctor                    # діагностика
openclaw plugins registry                  # перевірити стан збереженого реєстру
openclaw plugins registry --refresh        # перебудувати збережений реєстр
openclaw doctor --fix                      # відновити стан реєстру Plugin

openclaw plugins install <package>         # встановити (спочатку ClawHub, потім npm)
openclaw plugins install clawhub:<pkg>     # встановити лише з ClawHub
openclaw plugins install npm:<pkg>         # встановити лише з npm
openclaw plugins install <spec> --force    # перезаписати наявну інсталяцію
openclaw plugins install <path>            # встановити з локального шляху
openclaw plugins install -l <path>         # зв’язати (без копіювання) для розробки
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # зберегти точну визначену npm-специфікацію
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

Вбудовані Plugin постачаються разом з OpenClaw. Багато з них увімкнені типово (наприклад,
вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований Plugin
browser). Інші вбудовані Plugin усе ще потребують `openclaw plugins enable <id>`.

`--force` перезаписує наявний встановлений Plugin або pack hooks на місці. Використовуйте
`openclaw plugins update <id-or-npm-spec>` для звичайних оновлень відстежуваних npm
Plugin. Він не підтримується з `--link`, який повторно використовує шлях до джерела
замість копіювання в керовану ціль інсталяції.

Коли `plugins.allow` уже встановлено, `openclaw plugins install` додає
id встановленого Plugin до цього списку allow перед його ввімкненням. Якщо той самий id Plugin
присутній у `plugins.deny`, під час установлення цей застарілий запис deny видаляється, щоб
явно встановлений Plugin можна було одразу завантажити після перезапуску.

OpenClaw підтримує збережений локальний реєстр Plugin як модель холодного читання для
інвентаризації Plugin, володіння внесками та планування запуску. Потоки install, update,
uninstall, enable і disable оновлюють цей реєстр після зміни стану Plugin.
Той самий файл `plugins/installs.json` зберігає стійкі метадані інсталяції у
верхньорівневому `installRecords` і відтворювані метадані маніфесту в `plugins`. Якщо
реєстр відсутній, застарів або некоректний, `openclaw plugins registry
--refresh` перебудовує його подання маніфесту з записів інсталяції, політики конфігурації та
метаданих маніфесту/пакета без завантаження runtime-модулів Plugin.
`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних інсталяцій. Передавання
npm-специфікації пакета з dist-tag або точною версією визначає ім’я пакета назад
до відстежуваного запису Plugin і зберігає нову специфікацію для майбутніх оновлень.
Передавання імені пакета без версії переводить інсталяцію з точно зафіксованою версією назад
на типову лінію випуску реєстру. Якщо встановлений npm Plugin уже відповідає
визначеній версії та збереженій ідентичності артефакту, OpenClaw пропускає оновлення
без завантаження, перевстановлення чи переписування конфігурації.

`--pin` працює лише з npm. Він не підтримується з `--marketplace`, оскільки
інсталяції з marketplace зберігають метадані джерела marketplace замість npm-специфікації.

`--dangerously-force-unsafe-install` — це аварійне перевизначення для хибнопозитивних
спрацьовувань вбудованого сканера небезпечного коду. Воно дає змогу встановленню
та оновленню Plugin продовжитися попри вбудовані findings рівня `critical`, але все одно
не обходить блокування політики `before_install` Plugin або блокування через збій сканування.

Цей прапорець CLI застосовується лише до потоків встановлення/оновлення Plugin. Установлення
залежностей Skills через Gateway використовують натомість відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` лишається окремим потоком завантаження/встановлення Skills із ClawHub.

Сумісні набори беруть участь у тих самих потоках list/inspect/enable/disable
Plugin. Поточна підтримка runtime включає bundle Skills, command-Skills Claude,
типові значення `settings.json` Claude, типові значення `.lsp.json` Claude та оголошені в маніфесті
`lspServers`, command-Skills Cursor і сумісні каталоги hooks Codex.

`openclaw plugins inspect <id>` також повідомляє про виявлені можливості bundle плюс
підтримувані або непідтримувані записи MCP і LSP server для Plugin на основі bundle.

Джерела marketplace можуть бути відомою назвою marketplace Claude з
`~/.claude/plugins/known_marketplaces.json`, локальним коренем marketplace або шляхом до
`marketplace.json`, скороченим записом GitHub на кшталт `owner/repo`, URL репозиторію GitHub або URL git. Для віддалених marketplace записи Plugin мають залишатися в межах
клонованого репозиторію marketplace і використовувати лише відносні шляхи до джерел.

Див. [`openclaw plugins` CLI reference](/uk/cli/plugins), щоб ознайомитися з повними подробицями.

## Огляд API Plugin

Native Plugin експортують об’єкт точки входу, який відкриває `register(api)`. Старіші
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

OpenClaw завантажує об’єкт точки входу й викликає `register(api)` під час
активації Plugin. Loader усе ще переходить до `activate(api)` для старіших Plugin,
але вбудовані Plugin і нові зовнішні Plugin мають розглядати `register` як
публічний контракт.

`api.registrationMode` повідомляє Plugin, чому завантажується його точка входу:

| Режим           | Значення                                                                                                                            |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Runtime-активація. Реєструйте інструменти, hooks, служби, команди, маршрути та інші побічні ефекти live-виконання.                 |
| `discovery`     | Виявлення можливостей лише для читання. Реєструйте провайдерів і метадані; довірений код точки входу Plugin може завантажуватися, але пропускайте побічні ефекти live-виконання. |
| `setup-only`    | Завантаження метаданих setup каналу через легку точку входу setup.                                                                  |
| `setup-runtime` | Завантаження setup каналу, якому також потрібна runtime-точка входу.                                                                |
| `cli-metadata`  | Лише збирання метаданих команди CLI.                                                                                                |

Точки входу Plugin, які відкривають сокети, бази даних, фонові працівники або довготривалі
клієнти, мають захищати ці побічні ефекти перевіркою `api.registrationMode === "full"`.
Завантаження discovery кешуються окремо від активаційних завантажень і не замінюють
реєстр запущеного Gateway. Discovery не активує, але й не є безімпортним:
OpenClaw може обчислювати довірену точку входу Plugin або модуль Plugin каналу для побудови
snapshot-а. Тримайте верхні рівні модулів легкими й без побічних ефектів, а мережевих клієнтів,
підпроцеси, слухачі, читання облікових даних і запуск служб переносіть
за межі повного runtime-шляху.

Поширені методи реєстрації:

| Метод                                  | Що він реєструє             |
| -------------------------------------- | --------------------------- |
| `registerProvider`                     | Провайдер моделі (LLM)      |
| `registerChannel`                      | Канал чату                  |
| `registerTool`                         | Інструмент агента           |
| `registerHook` / `on(...)`             | Hooks життєвого циклу       |
| `registerSpeechProvider`               | Text-to-speech / STT        |
| `registerRealtimeTranscriptionProvider`| Потоковий STT               |
| `registerRealtimeVoiceProvider`        | Двобічний голос у реальному часі |
| `registerMediaUnderstandingProvider`   | Аналіз зображень/аудіо      |
| `registerImageGenerationProvider`      | Генерація зображень         |
| `registerMusicGenerationProvider`      | Генерація музики            |
| `registerVideoGenerationProvider`      | Генерація відео             |
| `registerWebFetchProvider`             | Провайдер отримання / скрапінгу вебданих |
| `registerWebSearchProvider`            | Вебпошук                    |
| `registerHttpRoute`                    | Кінцева точка HTTP          |
| `registerCommand` / `registerCli`      | Команди CLI                 |
| `registerContextEngine`                | Engine контексту            |
| `registerService`                      | Фонова служба               |

Поведінка guard для типізованих hooks життєвого циклу:

- `before_tool_call`: `{ block: true }` є термінальним; обробники нижчого пріоритету пропускаються.
- `before_tool_call`: `{ block: false }` не виконує жодної дії та не скасовує попереднє блокування.
- `before_install`: `{ block: true }` є термінальним; обробники нижчого пріоритету пропускаються.
- `before_install`: `{ block: false }` не виконує жодної дії та не скасовує попереднє блокування.
- `message_sending`: `{ cancel: true }` є термінальним; обробники нижчого пріоритету пропускаються.
- `message_sending`: `{ cancel: false }` не виконує жодної дії та не скасовує попереднє скасування.

Native Codex app-server перекидає native-події інструментів Codex назад у цю
поверхню hooks. Plugin можуть блокувати native-інструменти Codex через `before_tool_call`,
спостерігати результати через `after_tool_call` і брати участь у схваленнях
`PermissionRequest` Codex. Міст поки що не переписує аргументи native-інструментів Codex.
Точна межа підтримки runtime Codex описана в
[контракті підтримки Codex harness v1](/uk/plugins/codex-harness#v1-support-contract).

Повну поведінку типізованих hooks див. в [огляді SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Створення Plugin](/uk/plugins/building-plugins) — створіть власний Plugin
- [Набори Plugin](/uk/plugins/bundles) — сумісність наборів Codex/Claude/Cursor
- [Маніфест Plugin](/uk/plugins/manifest) — схема маніфесту
- [Реєстрація інструментів](/uk/plugins/building-plugins#registering-agent-tools) — додавання інструментів агента в Plugin
- [Внутрішня архітектура Plugin](/uk/plugins/architecture) — модель можливостей і конвеєр завантаження
- [Plugin спільноти](/uk/plugins/community) — сторонні списки
