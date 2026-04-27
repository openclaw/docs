---
read_when:
    - Встановлення або налаштування Plugins
    - Розуміння правил виявлення та завантаження Plugins
    - Робота з пакетами Plugins, сумісними з Codex/Claude
sidebarTitle: Install and Configure
summary: Встановлюйте, налаштовуйте та керуйте Plugins OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-04-27T23:14:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: f3465cb1f7e304c0ffd59ae9a4c586237f99f1dc861e93821f9a9d1fea4e371d
    source_path: tools/plugin.md
    workflow: 15
---

Plugins розширюють OpenClaw новими можливостями: канали, провайдери моделей,
середовища агентів, інструменти, Skills, мовлення, транскрипція в реальному часі, голос у реальному
часі, розуміння медіа, генерація зображень, генерація відео, отримання даних із вебу, вебпошук
тощо. Деякі Plugins є **основними** (постачаються з OpenClaw), інші —
**зовнішніми** (опубліковані в npm спільнотою).

## Швидкий старт

<Steps>
  <Step title="Перегляньте, що завантажено">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Установіть Plugin">
    ```bash
    # Із npm
    openclaw plugins install @openclaw/voice-call

    # Із локального каталогу або архіву
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

Якщо ви віддаєте перевагу керуванню безпосередньо з чату, увімкніть `commands.plugins: true` і використовуйте:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Шлях встановлення використовує той самий механізм визначення, що й CLI: локальний шлях/архів, явний
`clawhub:<pkg>`, явний `npm:<pkg>` або специфікація пакета без префікса (спочатку ClawHub, потім
резервний варіант через npm).

Якщо конфігурація недійсна, встановлення зазвичай завершується безпечною відмовою й пропонує
`openclaw doctor --fix`. Єдиний виняток для відновлення — вузький шлях
перевстановлення вбудованого Plugin для Plugins, які погоджуються на
`openclaw.install.allowInvalidConfigRecovery`.
Під час запуску Gateway недійсна конфігурація одного Plugin ізолюється на рівні цього Plugin:
під час запуску журналюється проблема `plugins.entries.<id>.config`, цей Plugin пропускається під час
завантаження, а інші Plugins і канали залишаються онлайн. Виконайте `openclaw doctor --fix`,
щоб ізолювати некоректну конфігурацію Plugin, вимкнувши запис цього Plugin і видаливши
його недійсне корисне навантаження конфігурації; звичайна резервна копія конфігурації зберігає попередні значення.
Коли конфігурація каналу посилається на Plugin, який більше неможливо виявити, але той самий
застарілий ідентифікатор Plugin залишається в конфігурації Plugin або записах встановлення, під час запуску Gateway
журналюються попередження, і цей канал пропускається замість блокування всіх інших каналів.
Виконайте `openclaw doctor --fix`, щоб видалити застарілі записи каналу/Plugin; невідомі
ключі каналів без ознак застарілого Plugin усе ще не проходять перевірку, щоб опечатки лишалися помітними.
Якщо встановлено `plugins.enabled: false`, застарілі посилання на Plugins вважаються неактивними:
під час запуску Gateway пропускається виявлення/завантаження Plugins, а `openclaw doctor` зберігає
вимкнену конфігурацію Plugin замість автоматичного видалення. Знову ввімкніть Plugins перед
запуском очищення doctor, якщо хочете видалити застарілі ідентифікатори Plugin.

Пакетні інсталяції OpenClaw не встановлюють завчасно все дерево залежностей середовища виконання для кожного вбудованого Plugin.
Коли вбудований Plugin, що належить OpenClaw, активний через
конфігурацію Plugin, застарілу конфігурацію каналу або маніфест із увімкненням за замовчуванням, під час запуску
відновлюються лише задекларовані залежності середовища виконання цього Plugin перед його імпортом.
Лише збережений стан автентифікації каналу сам по собі не активує вбудований канал для відновлення
залежностей середовища виконання під час запуску Gateway.
Явне вимкнення все одно має пріоритет: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` і `channels.<id>.enabled: false`
запобігають автоматичному відновленню вбудованих залежностей середовища виконання для цього Plugin/каналу.
Непорожній `plugins.allow` також обмежує відновлення залежностей середовища виконання для вбудованих Plugins, увімкнених за замовчуванням;
явне ввімкнення вбудованого каналу (`channels.<id>.enabled: true`) усе ще може
відновити залежності Plugin цього каналу.
Зовнішні Plugins і власні шляхи завантаження все одно потрібно встановлювати через
`openclaw plugins install`.

## Типи Plugins

OpenClaw розпізнає два формати Plugins:

| Формат     | Як це працює                                                     | Приклади                                               |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| **Нативний** | `openclaw.plugin.json` + модуль середовища виконання; виконується в процесі | Офіційні Plugins, npm-пакети спільноти                 |
| **Пакет** | Сумісний із Codex/Claude/Cursor макет; зіставляється з можливостями OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва відображаються в `openclaw plugins list`. Докладніше про пакети див. у [Пакети Plugin](/uk/plugins/bundles).

Якщо ви пишете нативний Plugin, почніть із [Створення Plugins](/uk/plugins/building-plugins)
і [Огляд SDK Plugin](/uk/plugins/sdk-overview).

## Точки входу пакета

Нативні npm-пакети Plugins мають оголошувати `openclaw.extensions` у `package.json`.
Кожен запис має залишатися в межах каталогу пакета та вказувати на придатний для читання
файл середовища виконання або на вихідний файл TypeScript із виведеним з нього
зібраним JavaScript-файлом, наприклад `src/index.ts` до `dist/index.js`.

Використовуйте `openclaw.runtimeExtensions`, коли опубліковані файли середовища виконання не розміщені
за тими самими шляхами, що й вихідні записи. Якщо це поле задано,
`runtimeExtensions` має містити рівно один запис для кожного запису `extensions`. Невідповідні списки призводять до збою встановлення та
виявлення Plugin, а не до мовчазного повернення до шляхів вихідного коду.

```json
{
  "name": "@acme/openclaw-plugin",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"]
  }
}
```

## Офіційні Plugins

### Доступні для встановлення (npm)

| Plugin          | Пакет                  | Документація                         |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/uk/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/uk/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/uk/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/uk/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/uk/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/uk/plugins/zalouser)   |

### Основні (постачаються з OpenClaw)

<AccordionGroup>
  <Accordion title="Провайдери моделей (увімкнені за замовчуванням)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugins пам’яті">
    - `memory-core` — вбудований пошук пам’яті (типово через `plugins.slots.memory`)
    - `memory-lancedb` — довготривала пам’ять із встановленням на вимогу з автоматичним пригадуванням/захопленням (установіть `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Провайдери мовлення (увімкнені за замовчуванням)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` — вбудований Plugin браузера для інструмента браузера, CLI `openclaw browser`, методу Gateway `browser.request`, середовища виконання браузера та служби керування браузером за замовчуванням (увімкнений за замовчуванням; вимкніть його перед заміною)
    - `copilot-proxy` — міст VS Code Copilot Proxy (вимкнений за замовчуванням)
  </Accordion>
</AccordionGroup>

Шукаєте сторонні Plugins? Див. [Plugins спільноти](/uk/plugins/community).

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
| `allow`          | Список дозволених Plugins (необов’язково)                |
| `deny`           | Список заборонених Plugins (необов’язково; заборона має пріоритет) |
| `load.paths`     | Додаткові файли/каталоги Plugins                          |
| `slots`          | Селектори ексклюзивних слотів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>` | Перемикачі та конфігурація для окремого Plugin            |

Зміни конфігурації **потребують перезапуску Gateway**. Якщо Gateway запущено з
відстеженням конфігурації та внутрішньопроцесним перезапуском (типовий шлях `openclaw gateway`),
цей перезапуск зазвичай виконується автоматично невдовзі після запису конфігурації.
Підтримуваного шляху гарячого перезавантаження для нативного коду середовища виконання Plugin або хуків життєвого циклу немає;
перезапустіть процес Gateway, який обслуговує живий канал, перш ніж
очікувати, що оновлений код `register(api)`, хуки `api.on(...)`, інструменти, служби або
хуки провайдера/середовища виконання почнуть працювати.

`openclaw plugins list` — це локальний знімок реєстру/конфігурації Plugins. Позначка
`enabled` для Plugin там означає, що збережений реєстр і поточна конфігурація дозволяють цьому
Plugin брати участь у роботі. Це не доводить, що вже запущений віддалений дочірній Gateway
перезапустився з тим самим кодом Plugin. У конфігураціях VPS/контейнерів з
обгортками процесів надсилайте перезапуски до фактичного процесу `openclaw gateway run`,
або використовуйте `openclaw gateway restart` для запущеного Gateway.

<Accordion title="Стани Plugin: вимкнений vs відсутній vs недійсний">
  - **Вимкнений**: Plugin існує, але правила ввімкнення вимкнули його. Конфігурація зберігається.
  - **Відсутній**: конфігурація посилається на ідентифікатор Plugin, який не знайдено під час виявлення.
  - **Недійсний**: Plugin існує, але його конфігурація не відповідає оголошеній схемі. Під час запуску Gateway пропускається лише цей Plugin; `openclaw doctor --fix` може ізолювати недійсний запис, вимкнувши його та видаливши його корисне навантаження конфігурації.
</Accordion>

## Виявлення та пріоритет

OpenClaw сканує Plugins в такому порядку (перший збіг має пріоритет):

<Steps>
  <Step title="Шляхи конфігурації">
    `plugins.load.paths` — явні шляхи до файлів або каталогів. Шляхи, які
    вказують назад на власні паковані каталоги вбудованих Plugins OpenClaw, ігноруються;
    виконайте `openclaw doctor --fix`, щоб видалити ці застарілі псевдоніми.
  </Step>

  <Step title="Plugins робочого простору">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` і `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Глобальні Plugins">
    `~/.openclaw/<plugin-root>/*.ts` і `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Вбудовані Plugins">
    Постачаються з OpenClaw. Багато з них увімкнені за замовчуванням (провайдери моделей, мовлення).
    Інші потребують явного ввімкнення.
  </Step>
</Steps>

Пакетні інсталяції та Docker-образи зазвичай визначають вбудовані Plugins із
скомпільованого дерева `dist/extensions`. Якщо каталог вихідного коду вбудованого Plugin
примонтовано bind-монтуванням поверх відповідного пакованого шляху вихідного коду, наприклад
`/app/extensions/synology-chat`, OpenClaw трактує цей примонтований каталог вихідного коду
як накладання джерела вбудованого Plugin і виявляє його раніше за пакований
пакет `/app/dist/extensions/synology-chat`. Це дає змогу циклам роботи супровідників у контейнерах
працювати без повернення кожного вбудованого Plugin до вихідного коду TypeScript.
Установіть `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, щоб примусово використовувати
паковані пакети dist, навіть коли присутні монтування з накладанням вихідного коду.

### Правила ввімкнення

- `plugins.enabled: false` вимикає всі Plugins і пропускає роботу з виявлення/завантаження Plugins
- `plugins.deny` завжди має пріоритет над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей Plugin
- Plugins із походженням із робочого простору **типово вимкнені** (їх потрібно явно ввімкнути)
- Вбудовані Plugins дотримуються вбудованого набору типово ввімкнених, якщо не задано перевизначення
- Ексклюзивні слоти можуть примусово ввімкнути вибраний Plugin для цього слота
- Деякі вбудовані Plugins з добровільним увімкненням автоматично вмикаються, коли конфігурація називає
  поверхню, що належить Plugin, наприклад посилання на модель провайдера, конфігурацію каналу або
  середовище виконання harness
- Застаріла конфігурація Plugin зберігається, поки активний `plugins.enabled: false`;
  знову ввімкніть Plugins перед запуском очищення doctor, якщо хочете видалити застарілі ідентифікатори
- Маршрути Codex сімейства OpenAI зберігають окремі межі Plugins:
  `openai-codex/*` належить Plugin OpenAI, тоді як вбудований Plugin
  app-server Codex вибирається через `agentRuntime.id: "codex"` або застарілі
  посилання на модель `codex/*`

## Усунення проблем із хуками середовища виконання

Якщо Plugin з’являється в `plugins list`, але побічні ефекти або хуки `register(api)`
не виконуються в трафіку живого чату, спочатку перевірте таке:

- Виконайте `openclaw gateway status --deep --require-rpc` і підтвердьте, що активні
  URL Gateway, профіль, шлях до конфігурації та процес — саме ті, які ви редагуєте.
- Перезапустіть живий Gateway після змін встановлення/конфігурації/коду Plugin. У контейнерах
  з обгортками PID 1 може бути лише супервізором; перезапустіть або надішліть сигнал дочірньому
  процесу `openclaw gateway run`.
- Використайте `openclaw plugins inspect <id> --json`, щоб підтвердити реєстрацію хуків і
  діагностику. Для не вбудованих хукiв розмови, таких як `llm_input`,
  `llm_output`, `before_agent_finalize` і `agent_end`, потрібен
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання моделей надавайте перевагу `before_model_resolve`. Він виконується перед
  визначенням моделі для кроків агента; `llm_output` виконується лише після того, як спроба моделі
  створить вивід асистента.
- Для підтвердження фактичної моделі сесії використовуйте `openclaw sessions` або
  поверхні сесії/стану Gateway, а під час налагодження корисних навантажень провайдера запускайте
  Gateway з `--raw-stream --raw-stream-path <path>`.

### Дубльоване володіння каналом або інструментом

Симптоми:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Це означає, що більше ніж один увімкнений Plugin намагається володіти тим самим каналом,
потоком налаштування або назвою інструмента. Найпоширеніша причина — зовнішній Plugin каналу,
встановлений поруч із вбудованим Plugin, який тепер надає той самий ідентифікатор каналу.

Кроки налагодження:

- Виконайте `openclaw plugins list --enabled --verbose`, щоб побачити кожен увімкнений Plugin
  та його походження.
- Виконайте `openclaw plugins inspect <id> --json` для кожного підозрілого Plugin і
  порівняйте `channels`, `channelConfigs`, `tools` та діагностику.
- Виконайте `openclaw plugins registry --refresh` після встановлення або видалення
  пакетів Plugin, щоб збережені метадані відображали поточне встановлення.
- Перезапустіть Gateway після змін встановлення, реєстру або конфігурації.

Варіанти виправлення:

- Якщо один Plugin навмисно замінює інший для того самого ідентифікатора каналу,
  бажаний Plugin має оголосити `channelConfigs.<channel-id>.preferOver` з
  ідентифікатором Plugin нижчого пріоритету. Див. [/plugins/manifest#replacing-another-channel-plugin](/uk/plugins/manifest#replacing-another-channel-plugin).
- Якщо дублювання випадкове, вимкніть одну зі сторін через
  `plugins.entries.<plugin-id>.enabled: false` або видаліть застаріле встановлення Plugin.
- Якщо ви явно ввімкнули обидва Plugins, OpenClaw зберігає цей запит і
  повідомляє про конфлікт. Виберіть одного власника для каналу або перейменуйте
  інструменти, що належать Plugin, щоб поверхня середовища виконання була однозначною.

## Слоти Plugin (ексклюзивні категорії)

Деякі категорії є ексклюзивними (одночасно активним може бути лише один):

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

| Слот            | Що він керує            | За замовчуванням      |
| --------------- | ----------------------- | --------------------- |
| `memory`        | Active Memory Plugin    | `memory-core`         |
| `contextEngine` | Активний рушій контексту | `legacy` (вбудований) |

## Довідник CLI

```bash
openclaw plugins list                       # компактний список
openclaw plugins list --enabled            # лише ввімкнені Plugins
openclaw plugins list --verbose            # детальні рядки для кожного Plugin
openclaw plugins list --json               # машиночитний список
openclaw plugins inspect <id>              # докладні деталі
openclaw plugins inspect <id> --json       # машиночитний формат
openclaw plugins inspect --all             # таблиця для всього набору
openclaw plugins info <id>                 # псевдонім inspect
openclaw plugins doctor                    # діагностика
openclaw plugins registry                  # перегляд збереженого стану реєстру
openclaw plugins registry --refresh        # перебудова збереженого реєстру
openclaw doctor --fix                      # відновлення стану реєстру Plugin

openclaw plugins install <package>         # встановлення (спочатку ClawHub, потім npm)
openclaw plugins install clawhub:<pkg>     # встановлення лише з ClawHub
openclaw plugins install npm:<pkg>         # встановлення лише з npm
openclaw plugins install <spec> --force    # перезаписати наявне встановлення
openclaw plugins install <path>            # встановлення з локального шляху
openclaw plugins install -l <path>         # зв’язування (без копіювання) для розробки
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # записати точну визначену npm-специфікацію
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # оновити один Plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # оновити все
openclaw plugins uninstall <id>          # видалити конфігурацію та записи індексу Plugin
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Вбудовані Plugins постачаються разом із OpenClaw. Багато з них увімкнені за замовчуванням (наприклад,
вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований Plugin
браузера). Інші вбудовані Plugins усе ще потребують `openclaw plugins enable <id>`.

`--force` перезаписує наявний встановлений Plugin або набір хуків на місці. Використовуйте
`openclaw plugins update <id-or-npm-spec>` для звичайних оновлень відстежуваних npm
Plugins. Цей параметр не підтримується з `--link`, який повторно використовує шлях до джерела
замість копіювання в керовану ціль встановлення.

Коли `plugins.allow` уже задано, `openclaw plugins install` додає
ідентифікатор встановленого Plugin до цього списку allow перед його ввімкненням. Якщо той самий ідентифікатор Plugin
присутній у `plugins.deny`, встановлення видаляє цей застарілий запис deny, щоб
явно встановлений Plugin можна було одразу завантажити після перезапуску.

OpenClaw зберігає локальний реєстр Plugin як холодну модель читання для
обліку Plugins, володіння внесками та планування запуску. Потоки встановлення, оновлення,
видалення, ввімкнення та вимкнення оновлюють цей реєстр після зміни стану Plugin.
Той самий файл `plugins/installs.json` зберігає довговічні метадані встановлення у
верхньорівневому `installRecords` і метадані маніфесту, які можна перебудувати, у `plugins`. Якщо
реєстр відсутній, застарілий або недійсний, `openclaw plugins registry
--refresh` перебудовує його представлення маніфесту з записів встановлення, політики конфігурації та
метаданих маніфесту/пакета без завантаження модулів середовища виконання Plugin.
`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних встановлень. Передавання
npm-специфікації пакета з dist-tag або точною версією знову зіставляє назву пакета
із записом відстежуваного Plugin і записує нову специфікацію для майбутніх оновлень.
Передавання назви пакета без версії повертає точно закріплене встановлення назад до
типової лінії випуску реєстру. Якщо встановлений npm Plugin уже відповідає
визначеній версії та записаній ідентичності артефакта, OpenClaw пропускає оновлення
без завантаження, перевстановлення або переписування конфігурації.

`--pin` працює лише для npm. Він не підтримується з `--marketplace`, оскільки
встановлення з marketplace зберігають метадані джерела marketplace замість npm-специфікації.

`--dangerously-force-unsafe-install` — це аварійне перевизначення для хибнопозитивних
спрацювань вбудованого сканера небезпечного коду. Воно дозволяє продовжити встановлення
та оновлення Plugin попри вбудовані результати `critical`, але все одно
не обходить блокування політики Plugin `before_install` або блокування через збої сканування.
Сканування встановлення ігнорує типові тестові файли та каталоги, такі як `tests/`,
`__tests__/`, `*.test.*` і `*.spec.*`, щоб уникнути блокування пакетованих тестових моків;
задекларовані точки входу середовища виконання Plugin усе одно скануються, навіть якщо вони використовують одну
з цих назв.

Цей прапорець CLI застосовується лише до потоків встановлення/оновлення Plugin. Встановлення залежностей Skills
через Gateway натомість використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` лишається окремим потоком завантаження/встановлення Skills із ClawHub.

Сумісні пакети беруть участь у тому самому потоці list/inspect/enable/disable
для Plugins. Поточна підтримка середовища виконання включає Skills пакетів, command-skills Claude,
типові значення Claude `settings.json`, типові значення Claude `.lsp.json` і
`lspServers`, оголошені в маніфесті, command-skills Cursor і сумісні каталоги
хуків Codex.

`openclaw plugins inspect <id>` також повідомляє про виявлені можливості пакетів, а також
підтримувані або непідтримувані записи MCP- і LSP-серверів для Plugins на основі пакетів.

Джерелами marketplace можуть бути назва відомого marketplace Claude з
`~/.claude/plugins/known_marketplaces.json`, локальний корінь marketplace або шлях до
`marketplace.json`, скорочений запис GitHub на кшталт `owner/repo`, URL репозиторію GitHub
або URL git. Для віддалених marketplace записи Plugin мають залишатися в межах
клонованого репозиторію marketplace і використовувати лише відносні шляхи джерел.

Повні відомості див. у [довіднику CLI `openclaw plugins`](/uk/cli/plugins).

## Огляд API Plugin

Нативні Plugins експортують об’єкт точки входу, який надає `register(api)`. Старіші
Plugins усе ще можуть використовувати `activate(api)` як застарілий псевдонім, але нові Plugins повинні
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

OpenClaw завантажує об’єкт точки входу та викликає `register(api)` під час
активації Plugin. Завантажувач усе ще повертається до `activate(api)` для старіших Plugins,
але вбудовані Plugins і нові зовнішні Plugins повинні вважати `register` публічним контрактом.

`api.registrationMode` повідомляє Plugin, чому завантажується його точка входу:

| Режим          | Значення                                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `full`         | Активація середовища виконання. Реєструйте інструменти, хуки, служби, команди, маршрути та інші побічні ефекти живого середовища. |
| `discovery`    | Виявлення можливостей лише для читання. Реєструйте провайдерів і метадані; код точки входу довіреного Plugin може завантажуватися, але живі побічні ефекти слід пропускати. |
| `setup-only`   | Завантаження метаданих налаштування каналу через полегшену точку входу налаштування.                                                |
| `setup-runtime`| Завантаження налаштування каналу, яке також потребує точки входу середовища виконання.                                              |
| `cli-metadata` | Лише збирання метаданих команд CLI.                                                                                                  |

Точки входу Plugin, які відкривають сокети, бази даних, фонові працівники або довготривалі
клієнти, повинні захищати ці побічні ефекти умовою `api.registrationMode === "full"`.
Завантаження для виявлення кешуються окремо від активаційних завантажень і не замінюють
реєстр запущеного Gateway. Виявлення не активує, але й не є вільним від імпорту:
OpenClaw може обчислювати модуль точки входу довіреного Plugin або модуль Plugin каналу, щоб зібрати
знімок. Тримайте верхній рівень модулів легким і без побічних ефектів та переносіть
мережеві клієнти, підпроцеси, слухачі, читання облікових даних і запуск служб
за шляхи повного середовища виконання.

Поширені методи реєстрації:

| Метод                                  | Що він реєструє             |
| -------------------------------------- | --------------------------- |
| `registerProvider`                     | Провайдер моделі (LLM)      |
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
| `registerWebFetchProvider`             | Провайдер отримання/скрейпінгу вебу |
| `registerWebSearchProvider`            | Вебпошук                    |
| `registerHttpRoute`                    | HTTP-ендпойнт               |
| `registerCommand` / `registerCli`      | Команди CLI                 |
| `registerContextEngine`                | Рушій контексту             |
| `registerService`                      | Фонова служба               |

Поведінка захисту хуків для типізованих хуків життєвого циклу:

- `before_tool_call`: `{ block: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: `{ block: false }` не виконує жодної дії та не скасовує раніше встановлене блокування.
- `before_install`: `{ block: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `before_install`: `{ block: false }` не виконує жодної дії та не скасовує раніше встановлене блокування.
- `message_sending`: `{ cancel: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `message_sending`: `{ cancel: false }` не виконує жодної дії та не скасовує раніше встановлене скасування.

Нативні запуски app-server Codex повертають події нативних інструментів Codex назад у цю
поверхню хуків. Plugins можуть блокувати нативні інструменти Codex через `before_tool_call`,
спостерігати за результатами через `after_tool_call` і брати участь у схваленнях
`PermissionRequest` Codex. Міст поки що не переписує аргументи нативних інструментів Codex.
Точна межа підтримки середовища виконання Codex описана в
[контракті підтримки Codex harness v1](/uk/plugins/codex-harness#v1-support-contract).

Повну поведінку типізованих хуків див. в [огляді SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Створення plugins](/uk/plugins/building-plugins) — створіть власний Plugin
- [Пакети Plugin](/uk/plugins/bundles) — сумісність пакетів Codex/Claude/Cursor
- [Маніфест Plugin](/uk/plugins/manifest) — схема маніфесту
- [Реєстрація інструментів](/uk/plugins/building-plugins#registering-agent-tools) — додайте інструменти агента в Plugin
- [Внутрішня архітектура Plugin](/uk/plugins/architecture) — модель можливостей і конвеєр завантаження
- [Plugins спільноти](/uk/plugins/community) — сторонні списки
