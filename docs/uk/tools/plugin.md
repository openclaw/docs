---
read_when:
    - Встановлення або налаштування Plugin-ів
    - Розуміння правил виявлення та завантаження Plugin-ів
    - Робота з наборами Plugin-ів, сумісними з Codex/Claude
sidebarTitle: Install and Configure
summary: Встановлення, налаштування та керування Plugin OpenClaw
title: Plugin-и
x-i18n:
    generated_at: "2026-04-26T00:29:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: b87c861ba38215bb3cf134356f4f630ea4a08ffcd63b8e8a8ad697f9b66fe2c0
    source_path: tools/plugin.md
    workflow: 15
---

Plugin-и розширюють OpenClaw новими можливостями: канали, постачальники моделей, каркаси агентів, інструменти, Skills, мовлення, транскрипція в реальному часі, голос у реальному часі, розуміння медіа, генерація зображень, генерація відео, отримання вебданих, вебпошук тощо. Деякі Plugin-и є **core** (постачаються з OpenClaw), інші — **external** (публікуються спільнотою в npm).

## Швидкий старт

<Steps>
  <Step title="Переглянути, що завантажено">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Встановити Plugin">
    ```bash
    # З npm
    openclaw plugins install @openclaw/voice-call

    # Із локального каталогу або архіву
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

Шлях встановлення використовує той самий механізм розв’язання, що й CLI: локальний шлях/архів, явний `clawhub:<pkg>` або специфікація пакета без префікса (спочатку ClawHub, потім резервний перехід до npm).

Якщо конфігурація невалідна, встановлення зазвичай завершується із безпечним блокуванням і вказує вам на `openclaw doctor --fix`. Єдиний виняток для відновлення — вузький шлях перевстановлення вбудованого Plugin для Plugin-ів, які підтримують
`openclaw.install.allowInvalidConfigRecovery`.

Пакетні встановлення OpenClaw не виконують завчасне встановлення всього дерева залежностей часу виконання для кожного вбудованого Plugin. Коли вбудований Plugin, що належить OpenClaw, активний через конфігурацію Plugin, застарілу конфігурацію каналу або маніфест із типовим увімкненням, під час запуску відновлюються лише оголошені залежності часу виконання цього Plugin перед його імпортом. Явне вимкнення все одно має пріоритет: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` і `channels.<id>.enabled: false` запобігають автоматичному відновленню вбудованих залежностей часу виконання для цього Plugin/каналу.
External Plugin-и та власні шляхи завантаження, як і раніше, потрібно встановлювати через
`openclaw plugins install`.

## Типи Plugin-ів

OpenClaw розпізнає два формати Plugin-ів:

| Формат     | Як це працює                                                   | Приклади                                               |
| ---------- | -------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + модуль часу виконання; виконується в межах процесу | Офіційні Plugin-и, пакети npm від спільноти            |
| **Bundle** | Макет, сумісний із Codex/Claude/Cursor; відображається на можливості OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва відображаються в `openclaw plugins list`. Див. [Набори Plugin-ів](/uk/plugins/bundles), щоб дізнатися подробиці про набори.

Якщо ви пишете Native Plugin, почніть із [Створення Plugin-ів](/uk/plugins/building-plugins)
та [Огляду SDK Plugin](/uk/plugins/sdk-overview).

## Офіційні Plugin-и

### Доступні для встановлення (npm)

| Plugin          | Пакет                 | Документація                         |
| --------------- | --------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/uk/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/uk/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/uk/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/uk/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/uk/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/uk/plugins/zalouser)   |

### Core (постачаються з OpenClaw)

<AccordionGroup>
  <Accordion title="Постачальники моделей (увімкнені типово)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugin-и пам’яті">
    - `memory-core` — вбудований пошук у пам’яті (типово через `plugins.slots.memory`)
    - `memory-lancedb` — довготривала пам’ять із встановленням на вимогу з автоматичним пригадуванням/захопленням (установіть `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Постачальники мовлення (увімкнені типово)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` — вбудований Plugin браузера для інструмента browser, CLI `openclaw browser`, методу gateway `browser.request`, середовища виконання browser і типової служби керування браузером (увімкнений типово; вимкніть його перед заміною)
    - `copilot-proxy` — міст VS Code Copilot Proxy (типово вимкнений)
  </Accordion>
</AccordionGroup>

Шукаєте сторонні Plugin-и? Див. [Plugin-и спільноти](/uk/plugins/community).

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
| `enabled`        | Головний перемикач (типово: `true`)                       |
| `allow`          | Список дозволених Plugin-ів (необов’язково)               |
| `deny`           | Список заборонених Plugin-ів (необов’язково; заборона має пріоритет) |
| `load.paths`     | Додаткові файли/каталоги Plugin-ів                        |
| `slots`          | Селектори ексклюзивних слотів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>` | Перемикачі та конфігурація для окремого Plugin            |

Зміни конфігурації **потребують перезапуску gateway**. Якщо Gateway працює зі
спостереженням за конфігурацією та увімкненим перезапуском у межах процесу
(типовий шлях `openclaw gateway`), цей перезапуск зазвичай виконується
автоматично невдовзі після запису змін конфігурації.
Підтримуваного шляху гарячого перезавантаження для нативного коду часу виконання Plugin або хуків життєвого циклу немає; перезапустіть процес Gateway, який обслуговує активний канал, перш ніж очікувати, що оновлений код `register(api)`, хуки `api.on(...)`, інструменти, служби або хуки постачальника/часу виконання почнуть працювати.

`openclaw plugins list` — це локальний знімок реєстру/конфігурації Plugin-ів. Плагін зі станом
`enabled` там означає, що збережений реєстр і поточна конфігурація дозволяють
Plugin брати участь у роботі. Це не доводить, що вже запущений віддалений дочірній процес Gateway
було перезапущено з тим самим кодом Plugin. У конфігураціях VPS/контейнерів з
процесами-обгортками надсилайте перезапуски фактичному процесу `openclaw gateway run`,
або використовуйте `openclaw gateway restart` для запущеного Gateway.

<Accordion title="Стани Plugin-ів: вимкнений, відсутній, невалідний">
  - **Вимкнений**: Plugin існує, але правила ввімкнення його вимкнули. Конфігурація зберігається.
  - **Відсутній**: конфігурація посилається на ідентифікатор Plugin, який не було знайдено під час виявлення.
  - **Невалідний**: Plugin існує, але його конфігурація не відповідає оголошеній схемі.
</Accordion>

## Виявлення та пріоритет

OpenClaw сканує Plugin-и в такому порядку (перше знайдене співпадіння перемагає):

<Steps>
  <Step title="Шляхи конфігурації">
    `plugins.load.paths` — явні шляхи до файлів або каталогів.
  </Step>

  <Step title="Plugin-и робочої області">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` і `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Глобальні Plugin-и">
    `~/.openclaw/<plugin-root>/*.ts` і `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Вбудовані Plugin-и">
    Постачаються з OpenClaw. Багато з них типово увімкнено (постачальники моделей, мовлення).
    Інші потребують явного ввімкнення.
  </Step>
</Steps>

### Правила ввімкнення

- `plugins.enabled: false` вимикає всі Plugin-и
- `plugins.deny` завжди має пріоритет над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей Plugin
- Plugin-и з робочої області **типово вимкнені** (їх потрібно явно ввімкнути)
- Вбудовані Plugin-и дотримуються вбудованого набору з типовим увімкненням, якщо не перевизначено
- Ексклюзивні слоти можуть примусово ввімкнути вибраний Plugin для цього слота
- Деякі вбудовані Plugin-и з режимом opt-in автоматично ввімкнуться, коли конфігурація називає
  поверхню, що належить Plugin, наприклад посилання на модель постачальника, конфігурацію каналу або середовище виконання harness
- Маршрути Codex сімейства OpenAI зберігають окремі межі Plugin-ів:
  `openai-codex/*` належить Plugin OpenAI, тоді як вбудований Plugin сервера застосунку Codex
  вибирається через `embeddedHarness.runtime: "codex"` або застарілі
  посилання на моделі `codex/*`

## Усунення проблем із хуками часу виконання

Якщо Plugin відображається в `plugins list`, але побічні ефекти `register(api)` або хуки
не виконуються в активному трафіку чату, спочатку перевірте таке:

- Виконайте `openclaw gateway status --deep --require-rpc` і підтвердьте, що активні
  URL Gateway, профіль, шлях конфігурації та процес — саме ті, які ви редагуєте.
- Перезапустіть активний Gateway після змін встановлення/конфігурації/коду Plugin. У контейнерах
  з обгортками PID 1 може бути лише супервізором; перезапустіть або надішліть сигнал дочірньому
  процесу `openclaw gateway run`.
- Використовуйте `openclaw plugins inspect <id> --json`, щоб підтвердити реєстрації хуків і
  діагностику. Для невбудованих хуків розмови, таких як `llm_input`,
  `llm_output`, `before_agent_finalize` і `agent_end`, потрібен
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання моделей надавайте перевагу `before_model_resolve`. Він виконується перед розв’язанням моделі для ходів агента; `llm_output` виконується лише після того, як спроба моделі створює вивід помічника.
- Для підтвердження фактичної моделі сеансу використовуйте `openclaw sessions` або
  поверхні сеансу/стану Gateway, а під час налагодження корисних навантажень постачальника запускайте
  Gateway з `--raw-stream --raw-stream-path <path>`.

### Дублювання володіння каналом або інструментом

Симптоми:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Це означає, що кілька ввімкнених Plugin-ів намагаються володіти тим самим каналом,
потоком налаштування або назвою інструмента. Найпоширеніша причина — зовнішній Plugin каналу,
встановлений поруч із вбудованим Plugin, який тепер надає той самий ідентифікатор каналу.

Кроки налагодження:

- Виконайте `openclaw plugins list --enabled --verbose`, щоб побачити кожен увімкнений Plugin
  і його походження.
- Виконайте `openclaw plugins inspect <id> --json` для кожного підозрілого Plugin і
  порівняйте `channels`, `channelConfigs`, `tools` і діагностику.
- Виконайте `openclaw plugins registry --refresh` після встановлення або видалення
  пакетів Plugin, щоб збережені метадані відображали поточне встановлення.
- Перезапустіть Gateway після змін встановлення, реєстру або конфігурації.

Варіанти виправлення:

- Якщо один Plugin навмисно замінює інший для того самого ідентифікатора каналу, бажаний Plugin має оголосити `channelConfigs.<channel-id>.preferOver` із
  ідентифікатором Plugin нижчого пріоритету. Див. [/plugins/manifest#replacing-another-channel-plugin](/uk/plugins/manifest#replacing-another-channel-plugin).
- Якщо дублювання випадкове, вимкніть одну зі сторін через
  `plugins.entries.<plugin-id>.enabled: false` або видаліть застаріле встановлення Plugin.
- Якщо ви явно ввімкнули обидва Plugin-и, OpenClaw зберігає цей запит і
  повідомляє про конфлікт. Виберіть одного власника для каналу або перейменуйте інструменти, що належать Plugin, щоб поверхня часу виконання була однозначною.

## Слоти Plugin-ів (ексклюзивні категорії)

Деякі категорії є ексклюзивними (одночасно активний лише один):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // або "none", щоб вимкнути
      contextEngine: "legacy", // або ідентифікатор Plugin
    },
  },
}
```

| Слот            | Що він керує              | Типове значення      |
| --------------- | ------------------------- | -------------------- |
| `memory`        | Active Memory Plugin      | `memory-core`        |
| `contextEngine` | Активний рушій контексту  | `legacy` (вбудований) |

## Довідник CLI

```bash
openclaw plugins list                       # компактний перелік
openclaw plugins list --enabled            # лише увімкнені Plugin-и
openclaw plugins list --verbose            # рядки з подробицями для кожного Plugin
openclaw plugins list --json               # машинозчитуваний перелік
openclaw plugins inspect <id>              # докладна інформація
openclaw plugins inspect <id> --json       # машинозчитуваний формат
openclaw plugins inspect --all             # таблиця для всього набору
openclaw plugins info <id>                 # псевдонім inspect
openclaw plugins doctor                    # діагностика
openclaw plugins registry                  # переглянути стан збереженого реєстру
openclaw plugins registry --refresh        # перебудувати збережений реєстр
openclaw doctor --fix                      # відновити стан реєстру Plugin-ів

openclaw plugins install <package>         # встановити (спочатку ClawHub, потім npm)
openclaw plugins install clawhub:<pkg>     # встановити лише з ClawHub
openclaw plugins install <spec> --force    # перезаписати наявне встановлення
openclaw plugins install <path>            # встановити з локального шляху
openclaw plugins install -l <path>         # підключити (без копіювання) для розробки
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # записати точну розв’язану специфікацію npm
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

Вбудовані Plugin-и постачаються разом з OpenClaw. Багато з них увімкнені типово (наприклад,
вбудовані постачальники моделей, вбудовані постачальники мовлення та вбудований Plugin
browser). Інші вбудовані Plugin-и все одно потребують `openclaw plugins enable <id>`.

`--force` перезаписує наявний встановлений Plugin або набір хуків на місці. Використовуйте
`openclaw plugins update <id-or-npm-spec>` для звичайних оновлень відстежуваних npm
Plugin-ів. Це не підтримується разом із `--link`, який повторно використовує шлях до джерела замість
копіювання в кероване цільове місце встановлення.

Коли `plugins.allow` уже задано, `openclaw plugins install` додає
ідентифікатор встановленого Plugin до цього списку дозволених перед його ввімкненням, тож після
перезапуску встановлення можна завантажити одразу.

OpenClaw зберігає локальний реєстр Plugin-ів як модель холодного читання для
обліку Plugin-ів, володіння внесками та планування запуску. Потоки встановлення, оновлення,
видалення, увімкнення та вимкнення оновлюють цей реєстр після зміни стану Plugin.
Той самий файл `plugins/installs.json` зберігає стійкі метадані встановлення у
верхньорівневих `installRecords` і метадані маніфесту, які можна перебудувати, у `plugins`. Якщо
реєстр відсутній, застарілий або невалідний, `openclaw plugins registry
--refresh` перебудовує його представлення маніфесту на основі записів встановлення, політики конфігурації та
метаданих маніфесту/пакета без завантаження модулів часу виконання Plugin.
`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних встановлень. Передавання
специфікації npm-пакета з dist-tag або точною версією розв’язує назву пакета
назад у відстежуваний запис Plugin і записує нову специфікацію для майбутніх оновлень.
Передавання назви пакета без версії повертає точно закріплене встановлення
до типової лінійки випуску реєстру. Якщо встановлений npm Plugin уже відповідає
розв’язаній версії та записаній ідентичності артефакту, OpenClaw пропускає оновлення
без завантаження, перевстановлення або переписування конфігурації.

`--pin` працює лише для npm. Він не підтримується з `--marketplace`, оскільки
встановлення з marketplace зберігають метадані джерела marketplace замість специфікації npm.

`--dangerously-force-unsafe-install` — це аварійне перевизначення для хибнопозитивних
спрацювань вбудованого сканера небезпечного коду. Воно дозволяє продовжити встановлення
та оновлення Plugin попри вбудовані знахідки `critical`, але все одно
не обходить блокування політики Plugin `before_install` або блокування через збої сканування.

Цей прапорець CLI застосовується лише до потоків встановлення/оновлення Plugin. Встановлення
залежностей Skills через Gateway натомість використовують відповідне перевизначення запиту
`dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` лишається окремим потоком
завантаження/встановлення Skills через ClawHub.

Сумісні набори беруть участь у тих самих потоках list/inspect/enable/disable
для Plugin-ів. Поточна підтримка часу виконання охоплює Skills із наборів, command-skills Claude,
типові значення Claude `settings.json`, типові значення Claude `.lsp.json` та
`lspServers`, оголошені в маніфесті, command-skills Cursor і сумісні каталоги хуків Codex.

`openclaw plugins inspect <id>` також повідомляє про виявлені можливості набору, а також
підтримувані або непідтримувані записи серверів MCP і LSP для Plugin-ів на основі наборів.

Джерелами marketplace можуть бути відома назва marketplace Claude з
`~/.claude/plugins/known_marketplaces.json`, локальний корінь marketplace або шлях
`marketplace.json`, скорочений запис GitHub на кшталт `owner/repo`, URL репозиторію GitHub
або URL git. Для віддалених marketplace записи Plugin мають залишатися всередині
клонованого репозиторію marketplace і використовувати лише відносні шляхи до джерел.

Див. [довідник CLI `openclaw plugins`](/uk/cli/plugins), щоб отримати повні відомості.

## Огляд API Plugin

Native Plugin-и експортують об’єкт входу, який надає `register(api)`. Старіші
Plugin-и все ще можуть використовувати `activate(api)` як застарілий псевдонім, але нові Plugin-и мають
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
активації Plugin. Завантажувач усе ще повертається до `activate(api)` для старіших Plugin-ів,
але вбудовані Plugin-и та нові зовнішні Plugin-и мають розглядати `register` як
публічний контракт.

`api.registrationMode` повідомляє Plugin, чому завантажується його точка входу:

| Режим           | Значення                                                                                                                        |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Активація часу виконання. Реєструє інструменти, хуки, служби, команди, маршрути та інші живі побічні ефекти.                  |
| `discovery`     | Виявлення можливостей лише для читання. Реєструє постачальників і метадані; код точки входу довіреного Plugin може завантажуватися, але має пропускати живі побічні ефекти. |
| `setup-only`    | Завантаження метаданих налаштування каналу через полегшену точку входу налаштування.                                            |
| `setup-runtime` | Завантаження налаштування каналу, якому також потрібна точка входу часу виконання.                                              |
| `cli-metadata`  | Лише збирання метаданих команди CLI.                                                                                             |

Точки входу Plugin, які відкривають сокети, бази даних, фонові працівники або довготривалих
клієнтів, мають захищати ці побічні ефекти умовою `api.registrationMode === "full"`.
Завантаження для виявлення кешуються окремо від завантажень для активації й не замінюють
реєстр запущеного Gateway. Виявлення не активує, але й не є вільним від імпорту:
OpenClaw може виконувати trusted Plugin entry або модуль channel plugin, щоб побудувати
знімок. Робіть верхні рівні модулів легкими й без побічних ефектів, а мережевих клієнтів,
підпроцеси, прослуховувачі, читання облікових даних і запуск служб переносіть
у шляхи повного часу виконання.

Поширені методи реєстрації:

| Метод                                  | Що реєструє                 |
| -------------------------------------- | --------------------------- |
| `registerProvider`                     | Постачальник моделі (LLM)   |
| `registerChannel`                      | Канал чату                  |
| `registerTool`                         | Інструмент агента           |
| `registerHook` / `on(...)`             | Хуки життєвого циклу        |
| `registerSpeechProvider`               | Синтез мовлення / STT       |
| `registerRealtimeTranscriptionProvider`| Потоковий STT               |
| `registerRealtimeVoiceProvider`        | Двобічний голос у реальному часі |
| `registerMediaUnderstandingProvider`   | Аналіз зображень/аудіо      |
| `registerImageGenerationProvider`      | Генерація зображень         |
| `registerMusicGenerationProvider`      | Генерація музики            |
| `registerVideoGenerationProvider`      | Генерація відео             |
| `registerWebFetchProvider`             | Постачальник web fetch / scrape |
| `registerWebSearchProvider`            | Вебпошук                    |
| `registerHttpRoute`                    | Кінцева точка HTTP          |
| `registerCommand` / `registerCli`      | Команди CLI                 |
| `registerContextEngine`                | Рушій контексту             |
| `registerService`                      | Фонова служба               |

Поведінка захисту хуків для типізованих хуків життєвого циклу:

- `before_tool_call`: `{ block: true }` є фінальним; обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: `{ block: false }` нічого не змінює і не скасовує попереднє блокування.
- `before_install`: `{ block: true }` є фінальним; обробники з нижчим пріоритетом пропускаються.
- `before_install`: `{ block: false }` нічого не змінює і не скасовує попереднє блокування.
- `message_sending`: `{ cancel: true }` є фінальним; обробники з нижчим пріоритетом пропускаються.
- `message_sending`: `{ cancel: false }` нічого не змінює і не скасовує попереднє скасування.

Native Codex app-server повертає події інструментів Codex-native через цей
інтерфейс хуків. Plugin-и можуть блокувати Codex-native інструменти через `before_tool_call`,
спостерігати за результатами через `after_tool_call` і брати участь у схваленнях
`PermissionRequest` Codex. Міст поки що не переписує аргументи інструментів Codex-native.
Точна межа підтримки часу виконання Codex описана в
[контракті підтримки Codex harness v1](/uk/plugins/codex-harness#v1-support-contract).

Щоб отримати повну інформацію про типізовану поведінку хуків, див. [огляд SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Створення Plugin-ів](/uk/plugins/building-plugins) — створіть власний Plugin
- [Набори Plugin-ів](/uk/plugins/bundles) — сумісність наборів Codex/Claude/Cursor
- [Маніфест Plugin](/uk/plugins/manifest) — схема маніфесту
- [Реєстрація інструментів](/uk/plugins/building-plugins#registering-agent-tools) — додавання інструментів агента в Plugin
- [Внутрішня архітектура Plugin-ів](/uk/plugins/architecture) — модель можливостей і конвеєр завантаження
- [Plugin-и спільноти](/uk/plugins/community) — переліки сторонніх Plugin-ів
