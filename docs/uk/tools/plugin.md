---
read_when:
    - Встановлення або налаштування Plugin-ів
    - Розуміння правил виявлення та завантаження Plugin-ів
    - Робота з наборами Plugin-ів, сумісними з Codex/Claude
sidebarTitle: Install and Configure
summary: Встановлення, налаштування та керування Plugin OpenClaw
title: Plugin-і
x-i18n:
    generated_at: "2026-04-27T07:10:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 46e96d9f0a01bc18076bfe3e5d599eb5531da9b84f8c921d6570d6d140b1567d
    source_path: tools/plugin.md
    workflow: 15
---

Plugin-і розширюють OpenClaw новими можливостями: канали, провайдери моделей,
agent harnesses, інструменти, Skills, мовлення, транскрибування в реальному часі, voice у реальному
часі, розуміння медіа, генерація зображень, генерація відео, веботримання, вебпошук
та багато іншого. Деякі Plugin-і є **core** (постачаються з OpenClaw), інші —
**external** (публікуються спільнотою на npm).

## Швидкий старт

<Steps>
  <Step title="Подивитися, що завантажено">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Встановити Plugin">
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

Якщо ви віддаєте перевагу керуванню безпосередньо з чату, увімкніть `commands.plugins: true` і використовуйте:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Шлях встановлення використовує той самий механізм визначення, що й CLI: локальний
шлях/архів, явний `clawhub:<pkg>` або звичайна специфікація пакета (спочатку
ClawHub, потім резервний варіант npm).

Якщо конфігурація невалідна, встановлення зазвичай безпечно завершується відмовою і вказує вам на
`openclaw doctor --fix`. Єдиний виняток для відновлення — вузький шлях перевстановлення bundled Plugin
для Plugin-ів, які явно погоджуються на
`openclaw.install.allowInvalidConfigRecovery`.

Пакетні встановлення OpenClaw не встановлюють завчасно все дерево runtime-залежностей
кожного bundled Plugin. Коли bundled Plugin, що належить OpenClaw, активний через
конфігурацію Plugin, застарілу конфігурацію каналу або маніфест із типово ввімкненим станом,
під час запуску відновлюються лише оголошені runtime-залежності цього Plugin перед його імпортом.
Сам по собі збережений стан авторизації каналу не активує bundled канал для відновлення
runtime-залежностей під час запуску Gateway.
Явне вимкнення все одно має пріоритет: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` і `channels.<id>.enabled: false`
запобігають автоматичному відновленню bundled runtime-залежностей для цього Plugin/каналу.
Непорожній `plugins.allow` також обмежує відновлення runtime-залежностей bundled Plugin-ів,
увімкнених типово; явне ввімкнення bundled каналу (`channels.<id>.enabled: true`) усе ще може
відновити залежності Plugin цього каналу.
External Plugin-і та власні шляхи завантаження, як і раніше, потрібно встановлювати через
`openclaw plugins install`.

## Типи Plugin-ів

OpenClaw розпізнає два формати Plugin-ів:

| Формат     | Як це працює                                                      | Приклади                                               |
| ---------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + runtime-модуль; виконується в процесі    | Офіційні Plugin-і, npm-пакети спільноти                |
| **Bundle** | Сумісне з Codex/Claude/Cursor компонування; зіставляється з можливостями OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва відображаються в `openclaw plugins list`. Докладніше про bundle див. у [Plugin Bundles](/uk/plugins/bundles).

Якщо ви пишете native Plugin, почніть із [Створення Plugin-ів](/uk/plugins/building-plugins)
та [Огляду Plugin SDK](/uk/plugins/sdk-overview).

## Точки входу пакета

npm-пакети native Plugin-ів мають оголошувати `openclaw.extensions` у `package.json`.
Кожен запис має залишатися в межах каталогу пакета і вказувати на читабельний
runtime-файл або на вихідний файл TypeScript з автоматично визначеним зібраним JavaScript-відповідником,
наприклад `src/index.ts` до `dist/index.js`.

Використовуйте `openclaw.runtimeExtensions`, коли опубліковані runtime-файли не знаходяться
за тими самими шляхами, що й вихідні записи. Якщо `runtimeExtensions` присутній,
він має містити рівно один запис для кожного запису в `extensions`. Невідповідність списків
призводить до помилки встановлення та виявлення Plugin-ів, а не до мовчазного повернення до вихідних шляхів.

```json
{
  "name": "@acme/openclaw-plugin",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"]
  }
}
```

## Офіційні Plugin-і

### Доступні для встановлення (npm)

| Plugin          | Пакет                  | Документація                         |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/uk/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/uk/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/uk/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/uk/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/uk/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/uk/plugins/zalouser)   |

### Core (постачаються з OpenClaw)

<AccordionGroup>
  <Accordion title="Провайдери моделей (увімкнені типово)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugin-і пам’яті">
    - `memory-core` — bundled пошук пам’яті (типово через `plugins.slots.memory`)
    - `memory-lancedb` — довготривала пам’ять, що встановлюється на вимогу, з автоматичним recall/capture (встановіть `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Провайдери мовлення (увімкнені типово)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` — bundled Plugin браузера для інструмента браузера, CLI `openclaw browser`, методу Gateway `browser.request`, runtime браузера та типового сервісу керування браузером (увімкнений типово; вимкніть його перед заміною)
    - `copilot-proxy` — міст VS Code Copilot Proxy (типово вимкнений)
  </Accordion>
</AccordionGroup>

Шукаєте сторонні Plugin-і? Див. [Plugin-і спільноти](/uk/plugins/community).

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
| `allow`          | Список дозволених Plugin-ів (необов’язково)               |
| `deny`           | Список заборонених Plugin-ів (необов’язково; `deny` має пріоритет) |
| `load.paths`     | Додаткові файли/каталоги Plugin-ів                        |
| `slots`          | Вибір exclusive slot-ів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>` | Перемикачі та конфігурація для окремого Plugin            |

Зміни конфігурації **потребують перезапуску gateway**. Якщо Gateway працює з
відстеженням конфігурації та внутрішньопроцесним перезапуском (типовий шлях `openclaw gateway`),
цей перезапуск зазвичай виконується автоматично невдовзі після запису конфігурації.
Підтримуваного шляху гарячого перезавантаження для native runtime-коду Plugin-ів або lifecycle hook-ів немає;
перезапустіть процес Gateway, який обслуговує live-канал, перш ніж очікувати, що оновлений код
`register(api)`, hook-и `api.on(...)`, інструменти, сервіси або hook-и провайдера/runtime почнуть працювати.

`openclaw plugins list` — це локальний знімок реєстру/конфігурації Plugin-ів. Позначка
`enabled` для Plugin там означає, що збережений реєстр і поточна конфігурація дозволяють
цьому Plugin брати участь. Це не доводить, що вже запущений віддалений дочірній Gateway
було перезапущено з тим самим кодом Plugin. У конфігураціях VPS/контейнерів з
процесами-обгортками надсилайте перезапуск фактичному процесу `openclaw gateway run`,
або використовуйте `openclaw gateway restart` проти запущеного Gateway.

<Accordion title="Стани Plugin-ів: disabled vs missing vs invalid">
  - **Disabled**: Plugin існує, але правила ввімкнення його вимкнули. Конфігурація зберігається.
  - **Missing**: конфігурація посилається на ID Plugin, який не було знайдено під час виявлення.
  - **Invalid**: Plugin існує, але його конфігурація не відповідає оголошеній схемі.
</Accordion>

## Виявлення та пріоритет

OpenClaw сканує Plugin-і в такому порядку (перший збіг має пріоритет):

<Steps>
  <Step title="Шляхи з конфігурації">
    `plugins.load.paths` — явні шляхи до файлів або каталогів. Шляхи, які
    вказують назад на власні каталоги bundled Plugin-ів OpenClaw, ігноруються;
    запустіть `openclaw doctor --fix`, щоб видалити ці застарілі псевдоніми.
  </Step>

  <Step title="Plugin-і робочого простору">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` і `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Глобальні Plugin-і">
    `~/.openclaw/<plugin-root>/*.ts` і `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Bundled Plugin-і">
    Постачаються з OpenClaw. Багато з них увімкнені типово (провайдери моделей, мовлення).
    Інші потребують явного ввімкнення.
  </Step>
</Steps>

Пакетні встановлення та Docker-образи зазвичай визначають bundled Plugin-і з
зібраного дерева `dist/extensions`. Якщо каталог вихідного коду bundled Plugin
монтується поверх відповідного пакетного шляху вихідного коду, наприклад
`/app/extensions/synology-chat`, OpenClaw розглядає цей змонтований каталог вихідного коду
як накладання bundled source і виявляє його перед пакетним
bundle ` /app/dist/extensions/synology-chat`. Це зберігає робочі цикли супроводжувачів у контейнерах
без необхідності повертати кожен bundled Plugin до вихідного TypeScript-коду.
Встановіть `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, щоб примусово використовувати пакетні dist-bundle-и,
навіть якщо присутні монтування source overlay.

### Правила ввімкнення

- `plugins.enabled: false` вимикає всі Plugin-і
- `plugins.deny` завжди має пріоритет над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей Plugin
- Plugin-і з робочого простору **типово вимкнені** (їх потрібно явно ввімкнути)
- Bundled Plugin-і дотримуються вбудованого набору, увімкненого типово, якщо не перевизначено
- Exclusive slot-и можуть примусово ввімкнути вибраний Plugin для цього slot
- Деякі bundled opt-in Plugin-і вмикаються автоматично, коли конфігурація називає
  поверхню, що належить Plugin, наприклад посилання на модель провайдера, конфігурацію каналу або runtime harness
- Маршрути Codex сімейства OpenAI зберігають окремі межі Plugin-ів:
  `openai-codex/*` належить Plugin OpenAI, тоді як bundled Plugin сервера додатка Codex
  вибирається через `agentRuntime.id: "codex"` або застарілі посилання на модель `codex/*`

## Усунення проблем із runtime hook-ами

Якщо Plugin з’являється в `plugins list`, але побічні ефекти `register(api)` або hook-и
не спрацьовують у live-трафіку чату, спочатку перевірте таке:

- Запустіть `openclaw gateway status --deep --require-rpc` і підтвердьте, що активні
  URL Gateway, профіль, шлях конфігурації та процес — це саме ті, які ви редагуєте.
- Перезапустіть live Gateway після змін установлення/конфігурації/коду Plugin. У контейнерах
  з обгортками PID 1 може бути лише супервізором; перезапустіть або надішліть сигнал дочірньому
  процесу `openclaw gateway run`.
- Використовуйте `openclaw plugins inspect <id> --json`, щоб підтвердити реєстрації hook-ів і
  діагностику. Для небудованих hook-ів розмови, таких як `llm_input`,
  `llm_output`, `before_agent_finalize` і `agent_end`, потрібне
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання моделей віддавайте перевагу `before_model_resolve`. Він виконується до
  визначення моделі для ходів агента; `llm_output` запускається лише після того,
  як спроба моделі створить вивід помічника.
- Для підтвердження фактичної моделі сесії використовуйте `openclaw sessions` або
  поверхні сесії/статусу Gateway і, під час налагодження корисних навантажень провайдера,
  запускайте Gateway з `--raw-stream --raw-stream-path <path>`.

### Дублювання володіння каналом або інструментом

Ознаки:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Це означає, що більше ніж один увімкнений Plugin намагається володіти тим самим каналом,
потоком налаштування або назвою інструмента. Найпоширеніша причина — external plugin каналу,
встановлений поруч із bundled Plugin, який тепер надає той самий channel id.

Кроки налагодження:

- Запустіть `openclaw plugins list --enabled --verbose`, щоб побачити кожен увімкнений Plugin
  і його походження.
- Запустіть `openclaw plugins inspect <id> --json` для кожного підозрюваного Plugin і
  порівняйте `channels`, `channelConfigs`, `tools` і діагностику.
- Запустіть `openclaw plugins registry --refresh` після встановлення або видалення
  пакетів Plugin-ів, щоб збережені метадані відображали поточне встановлення.
- Перезапустіть Gateway після змін встановлення, реєстру або конфігурації.

Варіанти виправлення:

- Якщо один Plugin навмисно замінює інший для того самого channel id, бажаний
  Plugin має оголосити `channelConfigs.<channel-id>.preferOver` з id
  Plugin нижчого пріоритету. Див. [/plugins/manifest#replacing-another-channel-plugin](/uk/plugins/manifest#replacing-another-channel-plugin).
- Якщо дублювання випадкове, вимкніть одну зі сторін через
  `plugins.entries.<plugin-id>.enabled: false` або видаліть застаріле встановлення Plugin.
- Якщо ви явно ввімкнули обидва Plugin-и, OpenClaw зберігає цей запит і
  повідомляє про конфлікт. Виберіть одного власника для каналу або перейменуйте
  інструменти, що належать Plugin-у, щоб runtime-поверхня була однозначною.

## Plugin slots (ексклюзивні категорії)

Деякі категорії є ексклюзивними (одночасно може бути активним лише один):

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

| Slot            | Що він контролює      | Типове значення     |
| --------------- | --------------------- | ------------------- |
| `memory`        | Active Memory plugin  | `memory-core`       |
| `contextEngine` | Активний context engine | `legacy` (вбудований) |

## Довідка CLI

```bash
openclaw plugins list                       # компактний перелік
openclaw plugins list --enabled            # лише увімкнені Plugin-и
openclaw plugins list --verbose            # докладні рядки для кожного Plugin
openclaw plugins list --json               # перелік у машиночитному форматі
openclaw plugins inspect <id>              # глибока деталізація
openclaw plugins inspect <id> --json       # машиночитний формат
openclaw plugins inspect --all             # таблиця для всього набору
openclaw plugins info <id>                 # псевдонім для inspect
openclaw plugins doctor                    # діагностика
openclaw plugins registry                  # перегляд стану збереженого реєстру
openclaw plugins registry --refresh        # перебудова збереженого реєстру
openclaw doctor --fix                      # відновлення стану реєстру Plugin-ів

openclaw plugins install <package>         # встановити (спочатку ClawHub, потім npm)
openclaw plugins install clawhub:<pkg>     # встановити лише з ClawHub
openclaw plugins install <spec> --force    # перезаписати наявне встановлення
openclaw plugins install <path>            # встановити з локального шляху
openclaw plugins install -l <path>         # зв’язати (без копіювання) для розробки
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # зафіксувати точну розв’язану npm-специфікацію
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # оновити один Plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # оновити всі
openclaw plugins uninstall <id>          # видалити записи конфігурації та індексу Plugin
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Bundled Plugin-и постачаються з OpenClaw. Багато з них увімкнені типово (наприклад,
bundled провайдери моделей, bundled провайдери мовлення та bundled browser
Plugin). Інші bundled Plugin-и все одно потребують `openclaw plugins enable <id>`.

`--force` перезаписує наявний встановлений Plugin або hook pack на місці. Використовуйте
`openclaw plugins update <id-or-npm-spec>` для звичайних оновлень відстежуваних npm
Plugin-ів. Це не підтримується разом із `--link`, який повторно використовує вихідний шлях
замість копіювання в керовану ціль встановлення.

Коли `plugins.allow` уже встановлено, `openclaw plugins install` додає
id встановленого Plugin до цього allowlist перед його ввімкненням. Якщо id того самого Plugin
присутній у `plugins.deny`, встановлення видаляє цей застарілий запис deny, щоб
явно встановлений Plugin можна було одразу завантажити після перезапуску.

OpenClaw зберігає локальний реєстр Plugin-ів як модель холодного читання для
обліку Plugin-ів, володіння внесками та планування запуску. Потоки встановлення,
оновлення, видалення, ввімкнення та вимкнення оновлюють цей реєстр після зміни
стану Plugin-ів. Той самий файл `plugins/installs.json` зберігає довговічні метадані встановлення в
верхньорівневому `installRecords` і метадані маніфесту, які можна перебудувати, у `plugins`. Якщо
реєстр відсутній, застарів або невалідний, `openclaw plugins registry
--refresh` перебудовує його подання маніфесту на основі записів встановлення, політики конфігурації та
метаданих маніфесту/пакета без завантаження runtime-модулів Plugin-ів.
`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних встановлень. Передача
npm-специфікації пакета з dist-tag або точною версією зіставляє назву пакета
назад із записом відстежуваного Plugin і зберігає нову специфікацію для майбутніх оновлень.
Передача назви пакета без версії переводить точно зафіксоване встановлення назад на
типову лінію випуску реєстру. Якщо встановлений npm Plugin уже відповідає розв’язаній версії
та записаній ідентичності артефакту, OpenClaw пропускає оновлення без завантаження,
перевстановлення або перезапису конфігурації.

`--pin` призначений лише для npm. Він не підтримується з `--marketplace`, оскільки
встановлення з marketplace зберігають метадані джерела marketplace замість npm-специфікації.

`--dangerously-force-unsafe-install` — це аварійний override для хибнопозитивних
спрацьовувань вбудованого сканера небезпечного коду. Він дозволяє продовжити встановлення
та оновлення Plugin-ів попри вбудовані знахідки рівня `critical`, але все одно
не обходить блокування політики Plugin `before_install` або блокування через збій сканування.

Цей прапорець CLI застосовується лише до потоків встановлення/оновлення Plugin-ів. Встановлення
залежностей Skills через Gateway використовують натомість відповідний override запиту
`dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` лишається окремим потоком
завантаження/встановлення Skills з ClawHub.

Сумісні bundle беруть участь у тих самих потоках list/inspect/enable/disable
для Plugin-ів. Поточна підтримка runtime включає bundle Skills, Claude command-skills,
типові значення Claude `settings.json`, типові значення Claude `.lsp.json` і оголошені в маніфесті
`lspServers`, Cursor command-skills і сумісні каталоги hook Codex.

`openclaw plugins inspect <id>` також повідомляє про виявлені можливості bundle, а також
підтримувані й непідтримувані записи MCP і LSP server для Plugin-ів на основі bundle.

Джерела marketplace можуть бути відомою назвою marketplace Claude з
`~/.claude/plugins/known_marketplaces.json`, локальним коренем marketplace або шляхом до
`marketplace.json`, коротким записом GitHub на кшталт `owner/repo`, URL репозиторію GitHub
або git URL. Для віддалених marketplace записи Plugin-ів мають залишатися всередині
клонованого репозиторію marketplace і використовувати лише відносні джерела шляхів.

Див. [довідку CLI `openclaw plugins`](/uk/cli/plugins) для повних деталей.

## Огляд Plugin API

Native Plugin-и експортують об’єкт entry, який надає `register(api)`. Старіші
Plugin-и можуть і далі використовувати `activate(api)` як застарілий alias, але нові Plugin-и
мають використовувати `register`.

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

OpenClaw завантажує об’єкт entry і викликає `register(api)` під час активації
Plugin. Завантажувач усе ще повертається до `activate(api)` для старіших Plugin-ів,
але bundled Plugin-и та нові external Plugin-и мають розглядати `register` як
публічний контракт.

`api.registrationMode` повідомляє Plugin-у, чому завантажується його entry:

| Режим           | Значення                                                                                                                          |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Runtime-активація. Реєструйте інструменти, hook-и, сервіси, команди, маршрути та інші побічні ефекти live-середовища.          |
| `discovery`     | Лише читання для виявлення можливостей. Реєструйте провайдерів і метадані; код entry довіреного Plugin може завантажуватися, але пропускайте live-побічні ефекти. |
| `setup-only`    | Завантаження метаданих налаштування каналу через полегшений entry налаштування.                                                   |
| `setup-runtime` | Завантаження налаштування каналу, якому також потрібен runtime entry.                                                              |
| `cli-metadata`  | Лише збирання метаданих CLI-команд.                                                                                               |

Entry Plugin-ів, які відкривають сокети, бази даних, фонові воркери або довготривалі
клієнти, мають захищати ці побічні ефекти умовою `api.registrationMode === "full"`.
Завантаження discovery кешуються окремо від активаційних завантажень і не замінюють
реєстр запущеного Gateway. Discovery не активує, але й не є імпортонезалежним:
OpenClaw може обчислювати довірений entry Plugin або модуль channel Plugin, щоб побудувати
знімок. Робіть верхні рівні модуля легкими та без побічних ефектів, а мережевих клієнтів,
підпроцеси, слухачі, читання облікових даних і запуск сервісів переміщуйте
за межі full-runtime-шляхів.

Поширені методи реєстрації:

| Метод                                  | Що реєструє                 |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Провайдер моделі (LLM)      |
| `registerChannel`                       | Канал чату                  |
| `registerTool`                          | Інструмент агента           |
| `registerHook` / `on(...)`              | Lifecycle hook-и            |
| `registerSpeechProvider`                | Text-to-speech / STT        |
| `registerRealtimeTranscriptionProvider` | Потокове STT                |
| `registerRealtimeVoiceProvider`         | Двобічний voice у реальному часі |
| `registerMediaUnderstandingProvider`    | Аналіз зображень/аудіо      |
| `registerImageGenerationProvider`       | Генерація зображень         |
| `registerMusicGenerationProvider`       | Генерація музики            |
| `registerVideoGenerationProvider`       | Генерація відео             |
| `registerWebFetchProvider`              | Провайдер веботримання / скрапінгу |
| `registerWebSearchProvider`             | Вебпошук                    |
| `registerHttpRoute`                     | HTTP endpoint               |
| `registerCommand` / `registerCli`       | CLI-команди                 |
| `registerContextEngine`                 | Context engine              |
| `registerService`                       | Фоновий сервіс              |

Поведінка guard для типізованих lifecycle hook-ів:

- `before_tool_call`: `{ block: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: `{ block: false }` не робить нічого і не скасовує попереднє блокування.
- `before_install`: `{ block: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `before_install`: `{ block: false }` не робить нічого і не скасовує попереднє блокування.
- `message_sending`: `{ cancel: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `message_sending`: `{ cancel: false }` не робить нічого і не скасовує попереднє скасування.

Native Codex app-server повертає власні події інструментів Codex у цю
поверхню hook-ів через міст. Plugin-и можуть блокувати native інструменти Codex через `before_tool_call`,
спостерігати результати через `after_tool_call` і брати участь у погодженнях
Codex `PermissionRequest`. Міст поки що не переписує аргументи native інструментів Codex.
Точна межа підтримки runtime Codex визначена в
[контракті підтримки Codex harness v1](/uk/plugins/codex-harness#v1-support-contract).

Повну поведінку типізованих hook-ів див. в [огляді SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Створення Plugin-ів](/uk/plugins/building-plugins) — створіть власний Plugin
- [Plugin Bundles](/uk/plugins/bundles) — сумісність bundle Codex/Claude/Cursor
- [Маніфест Plugin](/uk/plugins/manifest) — схема маніфесту
- [Реєстрація інструментів](/uk/plugins/building-plugins#registering-agent-tools) — додайте інструменти агента в Plugin
- [Внутрішня будова Plugin-ів](/uk/plugins/architecture) — модель можливостей і конвеєр завантаження
- [Plugin-і спільноти](/uk/plugins/community) — списки сторонніх Plugin-ів
