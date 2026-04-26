---
read_when:
    - Встановлення або налаштування Plugins
    - Розуміння правил виявлення та завантаження Plugins
    - Робота з сумісними з Codex/Claude пакетами Plugins
sidebarTitle: Install and Configure
summary: Встановлення, налаштування та керування Plugins OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-04-26T00:19:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 553c70416b9787437d46b3bd6f35570e532a3694c6c52d5d70e5014beed4328a
    source_path: tools/plugin.md
    workflow: 15
---

Plugins розширюють OpenClaw новими можливостями: канали, постачальники моделей, середовища виконання агентів, інструменти, Skills, мовлення, розпізнавання мовлення в реальному часі, голос у реальному часі, розуміння медіа, генерація зображень, генерація відео, отримання вебданих, вебпошук тощо. Деякі Plugins є **core** (постачаються з OpenClaw), інші — **external** (опубліковані спільнотою в npm).

## Швидкий старт

<Steps>
  <Step title="Перегляньте, що завантажено">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Встановіть Plugin">
    ```bash
    # З npm
    openclaw plugins install @openclaw/voice-call

    # З локального каталогу або архіву
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

Якщо ви надаєте перевагу керуванню через чат, увімкніть `commands.plugins: true` і використовуйте:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Шлях встановлення використовує той самий механізм розв’язання, що й CLI: локальний шлях/архів, явний
`clawhub:<pkg>` або специфікація пакета без префікса (спочатку ClawHub, потім резервний варіант через npm).

Якщо конфігурація невалідна, встановлення зазвичай безпечно завершується відмовою й спрямовує вас до
`openclaw doctor --fix`. Єдиний виняток для відновлення — вузький шлях перевстановлення вбудованого Plugin
для Plugins, які підтримують
`openclaw.install.allowInvalidConfigRecovery`.

Пакетні інсталяції OpenClaw не встановлюють наперед усе дерево залежностей середовища виконання кожного вбудованого Plugin.
Коли вбудований Plugin від OpenClaw активний через конфігурацію Plugin, застарілу конфігурацію каналу або маніфест
із увімкненням за замовчуванням, під час запуску відновлюються лише оголошені залежності середовища виконання цього Plugin перед його імпортом.
Явне вимкнення все одно має пріоритет: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` і `channels.<id>.enabled: false`
запобігають автоматичному відновленню залежностей середовища виконання для цього Plugin/каналу.
External Plugins і власні шляхи завантаження, як і раніше, потрібно встановлювати через
`openclaw plugins install`.

## Типи Plugins

OpenClaw розпізнає два формати Plugins:

| Формат     | Як це працює                                                     | Приклади                                               |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + модуль середовища виконання; виконується в поточному процесі | Офіційні Plugins, пакети npm від спільноти            |
| **Bundle** | Сумісне з Codex/Claude/Cursor компонування; зіставляється з можливостями OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва відображаються в `openclaw plugins list`. Докладніше про bundles див. у [Пакети Plugins](/uk/plugins/bundles).

Якщо ви пишете native Plugin, почніть із [Створення Plugins](/uk/plugins/building-plugins)
і [Огляду Plugin SDK](/uk/plugins/sdk-overview).

## Офіційні Plugins

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
  <Accordion title="Постачальники моделей (увімкнені за замовчуванням)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugins пам’яті">
    - `memory-core` — вбудований пошук у пам’яті (типово через `plugins.slots.memory`)
    - `memory-lancedb` — довготривала пам’ять із встановленням за потреби та автоматичним пригадуванням/захопленням (установіть `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Постачальники мовлення (увімкнені за замовчуванням)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` — вбудований browser Plugin для інструмента браузера, CLI `openclaw browser`, методу Gateway `browser.request`, середовища виконання браузера та стандартної служби керування браузером (увімкнений за замовчуванням; вимкніть його перед заміною)
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
| `allow`          | Список дозволених Plugins (необов’язково)                 |
| `deny`           | Список заборонених Plugins (необов’язково; deny має пріоритет) |
| `load.paths`     | Додаткові файли/каталоги Plugins                          |
| `slots`          | Селектори ексклюзивних слотів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>` | Перемикачі та конфігурація для окремого Plugin            |

Зміни конфігурації **потребують перезапуску gateway**. Якщо Gateway працює з
відстеженням конфігурації та внутрішньопроцесним перезапуском (типовий шлях `openclaw gateway`),
цей перезапуск зазвичай виконується автоматично невдовзі після запису конфігурації.
Підтримуваного шляху гарячого перезавантаження для native коду середовища виконання Plugin або хуків життєвого циклу немає;
перезапустіть процес Gateway, який обслуговує активний канал, перш ніж очікувати, що оновлений код `register(api)`,
хуки `api.on(...)`, інструменти, служби або хук-и постачальника/середовища виконання почнуть працювати.

`openclaw plugins list` — це локальний знімок реєстру/конфігурації Plugins. Позначка
`enabled` для Plugin означає, що збережений реєстр і поточна конфігурація дозволяють
Plugin брати участь у роботі. Це не доводить, що вже запущений віддалений дочірній процес Gateway
було перезапущено з тим самим кодом Plugin. У середовищах VPS/контейнерів із
процесами-обгортками надсилайте перезапуск реальному процесу `openclaw gateway run`,
або використовуйте `openclaw gateway restart` щодо запущеного Gateway.

<Accordion title="Стани Plugins: disabled vs missing vs invalid">
  - **Disabled**: Plugin існує, але правила ввімкнення його вимкнули. Конфігурація зберігається.
  - **Missing**: конфігурація посилається на ідентифікатор Plugin, який не знайдено під час виявлення.
  - **Invalid**: Plugin існує, але його конфігурація не відповідає оголошеній схемі.
</Accordion>

## Виявлення та пріоритетність

OpenClaw сканує Plugins у такому порядку (перше збігання має пріоритет):

<Steps>
  <Step title="Шляхи конфігурації">
    `plugins.load.paths` — явні шляхи до файлів або каталогів.
  </Step>

  <Step title="Plugins робочого простору">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` і `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Глобальні Plugins">
    `~/.openclaw/<plugin-root>/*.ts` і `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Вбудовані Plugins">
    Постачаються з OpenClaw. Багато з них увімкнені за замовчуванням (постачальники моделей, мовлення).
    Інші потребують явного ввімкнення.
  </Step>
</Steps>

### Правила ввімкнення

- `plugins.enabled: false` вимикає всі Plugins
- `plugins.deny` завжди має пріоритет над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей Plugin
- Plugins з походженням із робочого простору **вимкнені за замовчуванням** (їх потрібно явно ввімкнути)
- Вбудовані Plugins дотримуються вбудованого набору за замовчуванням, якщо не перевизначено
- Ексклюзивні слоти можуть примусово ввімкнути вибраний Plugin для цього слота
- Деякі вбудовані Plugins з явним opt-in вмикаються автоматично, коли конфігурація називає
  поверхню, що належить Plugin, наприклад посилання на модель постачальника, конфігурацію каналу або
  середовище виконання harness
- Маршрути Codex сімейства OpenAI зберігають окремі межі Plugins:
  `openai-codex/*` належить Plugin OpenAI, тоді як вбудований Plugin сервера застосунку Codex
  вибирається через `embeddedHarness.runtime: "codex"` або застарілі
  посилання на модель `codex/*`

## Усунення проблем із хуками середовища виконання

Якщо Plugin відображається в `plugins list`, але побічні ефекти `register(api)` або хуки
не працюють у трафіку активного чату, спочатку перевірте таке:

- Запустіть `openclaw gateway status --deep --require-rpc` і підтвердьте, що активні
  URL Gateway, профіль, шлях конфігурації та процес — саме ті, які ви редагуєте.
- Перезапустіть активний Gateway після змін установлення/конфігурації/коду Plugin. У контейнерах
  з обгортками PID 1 може бути лише супервізором; перезапустіть або надішліть сигнал дочірньому
  процесу `openclaw gateway run`.
- Використайте `openclaw plugins inspect <id> --json`, щоб підтвердити реєстрацію хуків і
  діагностику. Невбудовані хуки діалогу, такі як `llm_input`,
  `llm_output` і `agent_end`, потребують
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання моделей віддавайте перевагу `before_model_resolve`. Він виконується до
  розв’язання моделі для ходів агента; `llm_output` виконується лише після того, як спроба моделі
  створює вивід помічника.
- Щоб підтвердити фактичну модель сеансу, використовуйте `openclaw sessions` або
  поверхні сеансу/стану Gateway, а під час налагодження навантажень постачальника запускайте
  Gateway з `--raw-stream --raw-stream-path <path>`.

### Дублювання володіння каналом або інструментом

Симптоми:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Це означає, що більш ніж один увімкнений Plugin намагається володіти тим самим каналом,
потоком налаштування або назвою інструмента. Найпоширеніша причина — зовнішній Plugin каналу,
установлений поруч із вбудованим Plugin, який тепер надає той самий ідентифікатор каналу.

Кроки налагодження:

- Запустіть `openclaw plugins list --enabled --verbose`, щоб побачити кожен увімкнений Plugin
  і його походження.
- Запустіть `openclaw plugins inspect <id> --json` для кожного підозрюваного Plugin і
  порівняйте `channels`, `channelConfigs`, `tools` і діагностику.
- Запустіть `openclaw plugins registry --refresh` після встановлення або видалення
  пакетів Plugin, щоб збережені метадані відображали поточне встановлення.
- Перезапустіть Gateway після змін установлення, реєстру або конфігурації.

Варіанти виправлення:

- Якщо один Plugin навмисно замінює інший для того самого ідентифікатора каналу,
  бажаний Plugin має оголошувати `channelConfigs.<channel-id>.preferOver` із
  ідентифікатором Plugin нижчого пріоритету. Див. [/plugins/manifest#replacing-another-channel-plugin](/uk/plugins/manifest#replacing-another-channel-plugin).
- Якщо дублювання випадкове, вимкніть одну зі сторін через
  `plugins.entries.<plugin-id>.enabled: false` або видаліть застаріле встановлення Plugin.
- Якщо ви явно ввімкнули обидва Plugins, OpenClaw зберігає цей запит і
  повідомляє про конфлікт. Виберіть одного власника для каналу або перейменуйте інструменти, що належать Plugin,
  щоб поверхня середовища виконання була однозначною.

## Слоти Plugins (ексклюзивні категорії)

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

| Слот            | Що він контролює        | Значення за замовчуванням |
| --------------- | ----------------------- | ------------------------- |
| `memory`        | Active Memory Plugin    | `memory-core`             |
| `contextEngine` | Активний рушій контексту | `legacy` (вбудований)    |

## Довідник CLI

```bash
openclaw plugins list                       # компактний список
openclaw plugins list --enabled            # лише увімкнені Plugins
openclaw plugins list --verbose            # детальні рядки для кожного Plugin
openclaw plugins list --json               # машиночитний список
openclaw plugins inspect <id>              # детальна інформація
openclaw plugins inspect <id> --json       # машиночитний формат
openclaw plugins inspect --all             # таблиця для всього набору
openclaw plugins info <id>                 # псевдонім inspect
openclaw plugins doctor                    # діагностика
openclaw plugins registry                  # перегляд збереженого стану реєстру
openclaw plugins registry --refresh        # перебудувати збережений реєстр
openclaw doctor --fix                      # відновити стан реєстру Plugin

openclaw plugins install <package>         # встановити (спочатку ClawHub, потім npm)
openclaw plugins install clawhub:<pkg>     # встановити лише з ClawHub
openclaw plugins install <spec> --force    # перезаписати наявне встановлення
openclaw plugins install <path>            # встановити з локального шляху
openclaw plugins install -l <path>         # прив’язати (без копіювання) для розробки
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

Вбудовані Plugins постачаються разом з OpenClaw. Багато з них увімкнені за замовчуванням (наприклад,
вбудовані постачальники моделей, вбудовані постачальники мовлення та вбудований browser
Plugin). Інші вбудовані Plugins усе ще потрібно вмикати через `openclaw plugins enable <id>`.

`--force` перезаписує наявний встановлений Plugin або набір hooks на місці. Використовуйте
`openclaw plugins update <id-or-npm-spec>` для звичайних оновлень відстежуваних npm
Plugins. Цей прапорець не підтримується разом із `--link`, який повторно використовує вихідний шлях
замість копіювання в керовану ціль встановлення.

Коли `plugins.allow` уже встановлено, `openclaw plugins install` додає
ідентифікатор встановленого Plugin до цього списку дозволених перед його ввімкненням, тому встановлені Plugins
можна одразу завантажувати після перезапуску.

OpenClaw підтримує збережений локальний реєстр Plugins як модель холодного читання для
обліку Plugins, визначення власності внесків і планування запуску. Потоки встановлення, оновлення,
видалення, увімкнення та вимкнення оновлюють цей реєстр після зміни стану
Plugin. Той самий файл `plugins/installs.json` зберігає довговічні метадані встановлення в
верхньорівневих `installRecords` і перебудовувані метадані маніфесту в `plugins`. Якщо
реєстр відсутній, застарілий або невалідний, `openclaw plugins registry
--refresh` перебудовує його подання маніфесту з записів встановлення, політики конфігурації та
метаданих маніфесту/пакета без завантаження модулів середовища виконання Plugin.
`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних встановлень. Передавання
специфікації npm-пакета з dist-tag або точною версією розв’язує назву пакета
назад до запису відстежуваного Plugin і записує нову специфікацію для майбутніх оновлень.
Передавання назви пакета без версії повертає точно закріплене встановлення назад на
типову лінію випуску реєстру. Якщо встановлений npm Plugin уже відповідає
розв’язаній версії та записаній ідентичності артефакту, OpenClaw пропускає оновлення
без завантаження, перевстановлення або переписування конфігурації.

`--pin` працює лише з npm. Він не підтримується разом із `--marketplace`, оскільки
встановлення з marketplace зберігають метадані джерела marketplace замість специфікації npm.

`--dangerously-force-unsafe-install` — це аварійне перевизначення для хибнопозитивних
спрацювань вбудованого сканера небезпечного коду. Воно дозволяє встановленням Plugin
та оновленням Plugin продовжуватися попри вбудовані результати рівня `critical`, але все одно
не обходить блокування політики Plugin `before_install` або блокування через помилку сканування.

Цей прапорець CLI застосовується лише до потоків встановлення/оновлення Plugin. Встановлення залежностей Skill
через Gateway натомість використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як
`openclaw skills install` залишається окремим потоком завантаження/встановлення Skill через ClawHub.

Сумісні bundles беруть участь у тому самому потоці list/inspect/enable/disable для Plugins.
Поточна підтримка середовища виконання включає bundle Skills, command-skills Claude,
типові значення Claude `settings.json`, типові значення Claude `.lsp.json` і
`lspServers`, оголошені в маніфесті, command-skills Cursor та сумісні каталоги hooks Codex.

`openclaw plugins inspect <id>` також повідомляє про виявлені можливості bundle, а також
підтримувані або непідтримувані записи серверів MCP і LSP для Plugins на основі bundle.

Джерела marketplace можуть бути відомою назвою marketplace Claude з
`~/.claude/plugins/known_marketplaces.json`, локальним коренем marketplace або шляхом
`marketplace.json`, скороченим позначенням GitHub на кшталт `owner/repo`, URL репозиторію GitHub
або URL git. Для віддалених marketplace записи Plugin мають залишатися в межах
клонованого репозиторію marketplace та використовувати лише відносні джерела шляхів.

Повні відомості див. у [довіднику CLI `openclaw plugins`](/uk/cli/plugins).

## Огляд API Plugin

Native Plugins експортують об’єкт входу, який надає `register(api)`. Старіші
Plugins можуть усе ще використовувати `activate(api)` як застарілий псевдонім, але нові Plugins мають
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

OpenClaw завантажує об’єкт входу та викликає `register(api)` під час активації
Plugin. Завантажувач усе ще повертається до `activate(api)` для старіших Plugins,
але вбудовані Plugins і нові external Plugins мають розглядати `register` як
публічний контракт.

`api.registrationMode` повідомляє Plugin, чому завантажується його об’єкт входу:

| Режим           | Значення                                                                                                                         |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Активація середовища виконання. Реєструє інструменти, hooks, сервіси, команди, маршрути та інші побічні ефекти в живому режимі. |
| `discovery`     | Виявлення можливостей лише для читання. Реєструє постачальників і метадані; код входу довіреного Plugin може завантажуватися, але має пропускати побічні ефекти живого режиму. |
| `setup-only`    | Завантаження метаданих налаштування каналу через полегшений об’єкт налаштування.                                                 |
| `setup-runtime` | Завантаження налаштування каналу, якому також потрібен об’єкт середовища виконання.                                              |
| `cli-metadata`  | Лише збирання метаданих команд CLI.                                                                                               |

Об’єкти входу Plugin, які відкривають сокети, бази даних, фонові worker-и або довгоживучі
клієнти, мають захищати ці побічні ефекти перевіркою `api.registrationMode === "full"`.
Завантаження для discovery кешуються окремо від завантажень активації та не замінюють
реєстр запущеного Gateway. Discovery не активує, але й не є безімпортним:
OpenClaw може обчислювати довірений об’єкт входу Plugin або модуль Plugin каналу, щоб побудувати
знімок. Тримайте верхні рівні модулів легкими та без побічних ефектів і переносіть
мережеві клієнти, підпроцеси, слухачі, читання облікових даних і запуск сервісів
за шляхи повного середовища виконання.

Поширені методи реєстрації:

| Метод                                  | Що він реєструє            |
| --------------------------------------- | -------------------------- |
| `registerProvider`                      | Постачальник моделі (LLM)  |
| `registerChannel`                       | Канал чату                 |
| `registerTool`                          | Інструмент агента          |
| `registerHook` / `on(...)`              | Hooks життєвого циклу      |
| `registerSpeechProvider`                | Синтез мовлення / STT      |
| `registerRealtimeTranscriptionProvider` | Потоковий STT              |
| `registerRealtimeVoiceProvider`         | Двобічний голос у реальному часі |
| `registerMediaUnderstandingProvider`    | Аналіз зображень/аудіо     |
| `registerImageGenerationProvider`       | Генерація зображень        |
| `registerMusicGenerationProvider`       | Генерація музики           |
| `registerVideoGenerationProvider`       | Генерація відео            |
| `registerWebFetchProvider`              | Постачальник отримання/скрапінгу вебданих |
| `registerWebSearchProvider`             | Вебпошук                   |
| `registerHttpRoute`                     | HTTP endpoint              |
| `registerCommand` / `registerCli`       | Команди CLI                |
| `registerContextEngine`                 | Рушій контексту            |
| `registerService`                       | Фоновий сервіс             |

Поведінка захисту hooks для типізованих hooks життєвого циклу:

- `before_tool_call`: `{ block: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: `{ block: false }` нічого не робить і не скасовує попереднє блокування.
- `before_install`: `{ block: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `before_install`: `{ block: false }` нічого не робить і не скасовує попереднє блокування.
- `message_sending`: `{ cancel: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `message_sending`: `{ cancel: false }` нічого не робить і не скасовує попереднє скасування.

Native сервер застосунку Codex повертає події інструментів Codex-native через цю
поверхню hooks. Plugins можуть блокувати native інструменти Codex через `before_tool_call`,
спостерігати результати через `after_tool_call` і брати участь у схваленнях
`PermissionRequest` Codex. Міст поки що не переписує аргументи native інструментів Codex.
Точна межа підтримки середовища виконання Codex описана в
[контракті підтримки Codex harness v1](/uk/plugins/codex-harness#v1-support-contract).

Повну поведінку типізованих hooks див. в [огляді SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Створення Plugins](/uk/plugins/building-plugins) — створіть власний Plugin
- [Пакети Plugins](/uk/plugins/bundles) — сумісність пакетів Codex/Claude/Cursor
- [Маніфест Plugin](/uk/plugins/manifest) — схема маніфесту
- [Реєстрація інструментів](/uk/plugins/building-plugins#registering-agent-tools) — додавання інструментів агента в Plugin
- [Внутрішня архітектура Plugin](/uk/plugins/architecture) — модель можливостей і конвеєр завантаження
- [Plugins спільноти](/uk/plugins/community) — сторонні списки
