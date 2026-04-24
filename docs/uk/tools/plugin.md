---
read_when:
    - Встановлення або налаштування плагінів
    - Розуміння правил виявлення та завантаження плагінів
    - Робота з сумісними з Codex/Claude наборами плагінів
sidebarTitle: Install and Configure
summary: Встановлення, налаштування та керування плагінами OpenClaw
title: Плагіни
x-i18n:
    generated_at: "2026-04-24T16:58:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1f4968e70dc215dc50916f2d180121ce2afbe90e6bb2a85d3fe0bd8d989244fd
    source_path: tools/plugin.md
    workflow: 15
---

Плагіни розширюють OpenClaw новими можливостями: канали, постачальники моделей,
agent harnesses, інструменти, Skills, мовлення, транскрипція в реальному часі, голос у реальному
часі, розуміння медіа, генерація зображень, генерація відео, отримання даних з вебу, вебпошук
та інше. Деякі плагіни є **core** (постачаються разом з OpenClaw), інші
є **external** (опубліковані спільнотою в npm).

## Швидкий старт

<Steps>
  <Step title="Подивіться, що завантажено">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Встановіть плагін">
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

Якщо ви віддаєте перевагу керуванню безпосередньо в чаті, увімкніть `commands.plugins: true` і використовуйте:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Шлях встановлення використовує той самий механізм резолюції, що й CLI: локальний
шлях/архів, явний `clawhub:<pkg>` або специфікація пакета без префікса (спочатку
ClawHub, потім резервний варіант npm).

Якщо конфігурація некоректна, встановлення зазвичай завершується із захистом від помилок і пропонує
скористатися `openclaw doctor --fix`. Єдиний виняток для відновлення — це вузький шлях
перевстановлення вбудованого плагіна для плагінів, які підтримують
`openclaw.install.allowInvalidConfigRecovery`.

Пакетні встановлення OpenClaw не виконують завчасне встановлення всього дерева залежностей
середовища виконання для кожного вбудованого плагіна. Коли вбудований плагін OpenClaw є активним через
конфігурацію плагіна, застарілу конфігурацію каналу або маніфест, увімкнений за замовчуванням,
під час запуску відновлюються лише оголошені цим плагіном залежності середовища виконання
перед його імпортом. Явне вимкнення все одно має пріоритет: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` і `channels.<id>.enabled: false`
запобігають автоматичному відновленню залежностей середовища виконання для цього вбудованого плагіна/каналу.
External плагіни та власні шляхи завантаження, як і раніше, потрібно встановлювати через
`openclaw plugins install`.

## Типи плагінів

OpenClaw розпізнає два формати плагінів:

| Формат     | Як це працює                                                      | Приклади                                               |
| ---------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + модуль середовища виконання; виконується в межах процесу | Офіційні плагіни, npm-пакети спільноти                 |
| **Bundle** | Сумісне з Codex/Claude/Cursor компонування; зіставляється з можливостями OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва відображаються в `openclaw plugins list`. Докладніше про набори див. в [Набори плагінів](/uk/plugins/bundles).

Якщо ви пишете native плагін, почніть з [Створення плагінів](/uk/plugins/building-plugins)
і [Огляду Plugin SDK](/uk/plugins/sdk-overview).

## Офіційні плагіни

### Доступні для встановлення (npm)

| Плагін          | Пакет                 | Документація                         |
| --------------- | --------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/uk/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/uk/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/uk/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/uk/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/uk/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/uk/plugins/zalouser)   |

### Core (постачаються разом з OpenClaw)

<AccordionGroup>
  <Accordion title="Постачальники моделей (увімкнено за замовчуванням)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Плагіни пам’яті">
    - `memory-core` — вбудований пошук у пам’яті (типово через `plugins.slots.memory`)
    - `memory-lancedb` — довготривала пам’ять із встановленням за потреби, автоматичним пригадуванням/захопленням (встановіть `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Постачальники мовлення (увімкнено за замовчуванням)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` — вбудований browser плагін для browser tool, CLI `openclaw browser`, методу Gateway `browser.request`, browser runtime і типового сервісу керування browser (увімкнено за замовчуванням; вимкніть перед заміною)
    - `copilot-proxy` — міст VS Code Copilot Proxy (типово вимкнено)
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

| Поле             | Опис                                                      |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Головний перемикач (типово: `true`)                       |
| `allow`          | Список дозволених плагінів (необов’язково)                |
| `deny`           | Список заборонених плагінів (необов’язково; заборона має пріоритет) |
| `load.paths`     | Додаткові файли/каталоги плагінів                         |
| `slots`          | Селектори ексклюзивних слотів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>` | Перемикачі та конфігурація для окремого плагіна           |

Зміни конфігурації **потребують перезапуску Gateway**. Якщо Gateway запущено з
відстеженням конфігурації та увімкненим перезапуском у межах процесу (типовий шлях `openclaw gateway`),
цей перезапуск зазвичай виконується автоматично невдовзі після застосування запису конфігурації.
Підтримуваного шляху гарячого перезавантаження для native коду середовища виконання плагінів або lifecycle
hooks немає; перезапустіть процес Gateway, який обслуговує активний канал, перш ніж
очікувати, що оновлений код `register(api)`, хуки `api.on(...)`, інструменти, сервіси або
хуки постачальника/середовища виконання почнуть працювати.

`openclaw plugins list` — це локальний знімок CLI/конфігурації. Позначка `loaded` для плагіна там
означає, що плагін можна виявити та завантажити з конфігурації/файлів, які бачить
цей виклик CLI. Це не доводить, що вже запущений віддалений дочірній процес Gateway
було перезапущено в той самий код плагіна. У налаштуваннях VPS/контейнерів з процесами-обгортками
надсилайте перезапуски фактичному процесу `openclaw gateway run` або
використовуйте `openclaw gateway restart` для запущеного Gateway.

<Accordion title="Стани плагіна: вимкнений, відсутній або некоректний">
  - **Вимкнений**: плагін існує, але правила ввімкнення його вимкнули. Конфігурація зберігається.
  - **Відсутній**: конфігурація посилається на ідентифікатор плагіна, який не було знайдено під час виявлення.
  - **Некоректний**: плагін існує, але його конфігурація не відповідає оголошеній схемі.
</Accordion>

## Виявлення та пріоритетність

OpenClaw сканує плагіни в такому порядку (перше співпадіння має пріоритет):

<Steps>
  <Step title="Шляхи з конфігурації">
    `plugins.load.paths` — явні шляхи до файлів або каталогів.
  </Step>

  <Step title="Плагіни робочого простору">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` і `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Глобальні плагіни">
    `~/.openclaw/<plugin-root>/*.ts` і `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Вбудовані плагіни">
    Постачаються разом з OpenClaw. Багато з них увімкнено за замовчуванням (постачальники моделей, мовлення).
    Для інших потрібне явне ввімкнення.
  </Step>
</Steps>

### Правила ввімкнення

- `plugins.enabled: false` вимикає всі плагіни
- `plugins.deny` завжди має пріоритет над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей плагін
- Плагіни з робочого простору **типово вимкнені** (їх потрібно явно ввімкнути)
- Вбудовані плагіни дотримуються вбудованого набору, увімкненого за замовчуванням, якщо не перевизначено
- Ексклюзивні слоти можуть примусово ввімкнути вибраний плагін для цього слота
- Деякі вбудовані opt-in плагіни вмикаються автоматично, коли конфігурація задає
  surface, що належить плагіну, наприклад посилання на модель постачальника, конфігурацію каналу або harness
  runtime
- Маршрути Codex сімейства OpenAI зберігають окремі межі між плагінами:
  `openai-codex/*` належить плагіну OpenAI, тоді як вбудований плагін Codex
  app-server вибирається через `embeddedHarness.runtime: "codex"` або застарілі
  посилання на модель `codex/*`

## Усунення проблем із хуками середовища виконання

Якщо плагін відображається в `plugins list`, але побічні ефекти `register(api)` або hooks
не спрацьовують у живому чат-трафіку, спочатку перевірте таке:

- Запустіть `openclaw gateway status --deep --require-rpc` і переконайтеся, що активні
  URL Gateway, профіль, шлях до конфігурації та процес — це саме ті, які ви редагуєте.
- Перезапустіть активний Gateway після змін у встановленні/конфігурації/коді плагіна. У контейнерах
  з обгортками процес PID 1 може бути лише супервізором; перезапустіть або надішліть сигнал дочірньому
  процесу `openclaw gateway run`.
- Використайте `openclaw plugins inspect <id> --json`, щоб підтвердити реєстрації hooks і
  діагностику. Невбудовані conversation hooks, такі як `llm_input`,
  `llm_output` і `agent_end`, потребують
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання моделей надавайте перевагу `before_model_resolve`. Він запускається до
  визначення моделі для ходів агента; `llm_output` запускається лише після того, як спроба моделі
  створить вивід асистента.
- Щоб підтвердити фактичну модель сесії, використовуйте `openclaw sessions` або
  поверхні Gateway session/status, а під час налагодження payloads постачальника запускайте
  Gateway з `--raw-stream --raw-stream-path <path>`.

## Слоти плагінів (ексклюзивні категорії)

Деякі категорії є ексклюзивними (одночасно може бути активним лише один плагін):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // або "none", щоб вимкнути
      contextEngine: "legacy", // або ідентифікатор плагіна
    },
  },
}
```

| Слот            | Що він контролює        | Типове значення     |
| --------------- | ----------------------- | ------------------- |
| `memory`        | Active Memory плагін    | `memory-core`       |
| `contextEngine` | Активний рушій контексту | `legacy` (вбудований) |

## Довідник CLI

```bash
openclaw plugins list                       # компактний перелік
openclaw plugins list --enabled            # лише завантажені плагіни
openclaw plugins list --verbose            # докладні рядки для кожного плагіна
openclaw plugins list --json               # машиночитаний перелік
openclaw plugins inspect <id>              # докладна інформація
openclaw plugins inspect <id> --json       # машиночитаний формат
openclaw plugins inspect --all             # таблиця для всіх
openclaw plugins info <id>                 # псевдонім для inspect
openclaw plugins doctor                    # діагностика

openclaw plugins install <package>         # встановлення (спочатку ClawHub, потім npm)
openclaw plugins install clawhub:<pkg>     # встановлення лише з ClawHub
openclaw plugins install <spec> --force    # перезаписати наявне встановлення
openclaw plugins install <path>            # встановлення з локального шляху
openclaw plugins install -l <path>         # підключення (без копіювання) для розробки
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # зафіксувати точну розв’язану npm-специфікацію
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # оновити один плагін
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # оновити всі
openclaw plugins uninstall <id>          # видалити записи конфігурації/встановлення
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Вбудовані плагіни постачаються разом з OpenClaw. Багато з них увімкнено за замовчуванням (наприклад,
вбудовані постачальники моделей, вбудовані постачальники мовлення та вбудований
browser плагін). Інші вбудовані плагіни все одно потребують `openclaw plugins enable <id>`.

`--force` перезаписує наявний встановлений плагін або набір hooks на місці. Використовуйте
`openclaw plugins update <id-or-npm-spec>` для звичайних оновлень відстежуваних npm
плагінів. Це не підтримується разом із `--link`, який повторно використовує вихідний шлях
замість копіювання в кероване місце встановлення.

Коли `plugins.allow` уже задано, `openclaw plugins install` додає
ідентифікатор встановленого плагіна до цього списку дозволених перед його ввімкненням, щоб установлені плагіни
можна було одразу завантажити після перезапуску.

`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних встановлень. Передавання
npm-специфікації пакета з dist-tag або точною версією зводить назву пакета
назад до запису відстежуваного плагіна та зберігає нову специфікацію для майбутніх оновлень.
Передавання назви пакета без версії повертає точно зафіксоване встановлення до
типової лінії випусків реєстру. Якщо встановлений npm плагін уже відповідає
розв’язаній версії та збереженій ідентичності артефакту, OpenClaw пропускає оновлення
без завантаження, перевстановлення або перезапису конфігурації.

`--pin` працює лише для npm. Він не підтримується разом із `--marketplace`, оскільки
встановлення з marketplace зберігають метадані джерела marketplace замість npm-специфікації.

`--dangerously-force-unsafe-install` — це аварійне перевизначення для хибнопозитивних
спрацьовувань вбудованого сканера небезпечного коду. Воно дозволяє продовжити встановлення
та оновлення плагінів попри вбудовані результати рівня `critical`, але все одно
не обходить блокування політики плагіна `before_install` або блокування через помилку сканування.

Цей прапорець CLI застосовується лише до потоків встановлення/оновлення плагінів. Встановлення залежностей Skills
через Gateway натомість використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як
`openclaw skills install` залишається окремим потоком завантаження/встановлення Skills із ClawHub.

Сумісні набори беруть участь у тому самому потоці list/inspect/enable/disable для плагінів.
Поточна підтримка середовища виконання включає bundle Skills, command-skills Claude,
типові значення Claude `settings.json`, типові значення Claude `.lsp.json` і
оголошених у маніфесті `lspServers`, command-skills Cursor та сумісні каталоги hooks Codex.

`openclaw plugins inspect <id>` також повідомляє про виявлені можливості набору, а також
підтримувані й непідтримувані записи серверів MCP і LSP для плагінів на основі наборів.

Джерелами marketplace можуть бути відома назва marketplace Claude з
`~/.claude/plugins/known_marketplaces.json`, локальний корінь marketplace або шлях до
`marketplace.json`, скорочений запис GitHub на кшталт `owner/repo`, URL репозиторію GitHub
або URL git. Для віддалених marketplace записи плагінів мають залишатися в межах
клонованого репозиторію marketplace та використовувати лише відносні джерела шляхів.

Повні відомості див. у [довіднику CLI `openclaw plugins`](/uk/cli/plugins).

## Огляд API плагінів

Native плагіни експортують об’єкт входу, який надає `register(api)`. Старіші
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

OpenClaw завантажує об’єкт входу та викликає `register(api)` під час
активації плагіна. Завантажувач усе ще використовує резервний перехід до `activate(api)` для старіших плагінів,
але вбудовані плагіни та нові external плагіни повинні вважати `register` публічним контрактом.

Поширені методи реєстрації:

| Метод                                  | Що він реєструє            |
| -------------------------------------- | -------------------------- |
| `registerProvider`                     | Постачальник моделей (LLM) |
| `registerChannel`                      | Канал чату                 |
| `registerTool`                         | Інструмент агента          |
| `registerHook` / `on(...)`             | Lifecycle hooks            |
| `registerSpeechProvider`               | Синтез мовлення / STT      |
| `registerRealtimeTranscriptionProvider`| Потоковий STT              |
| `registerRealtimeVoiceProvider`        | Двобічний голос у реальному часі |
| `registerMediaUnderstandingProvider`   | Аналіз зображень/аудіо     |
| `registerImageGenerationProvider`      | Генерація зображень        |
| `registerMusicGenerationProvider`      | Генерація музики           |
| `registerVideoGenerationProvider`      | Генерація відео            |
| `registerWebFetchProvider`             | Постачальник веб-отримання / збирання |
| `registerWebSearchProvider`            | Вебпошук                   |
| `registerHttpRoute`                    | HTTP endpoint              |
| `registerCommand` / `registerCli`      | Команди CLI                |
| `registerContextEngine`                | Рушій контексту            |
| `registerService`                      | Фоновий сервіс             |

Поведінка guard hooks для типізованих lifecycle hooks:

- `before_tool_call`: `{ block: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: `{ block: false }` не має ефекту та не скасовує раніше встановлене блокування.
- `before_install`: `{ block: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `before_install`: `{ block: false }` не має ефекту та не скасовує раніше встановлене блокування.
- `message_sending`: `{ cancel: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `message_sending`: `{ cancel: false }` не має ефекту та не скасовує раніше встановлене скасування.

Native Codex app-server повертає події інструментів, нативних для Codex, назад у цю
поверхню hooks через міст. Плагіни можуть блокувати нативні інструменти Codex через `before_tool_call`,
спостерігати за результатами через `after_tool_call` і брати участь у погодженнях
`PermissionRequest` Codex. Міст поки що не переписує аргументи інструментів, нативних для Codex.

Повну поведінку типізованих hooks див. в [Огляді SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Створення плагінів](/uk/plugins/building-plugins) — створіть власний плагін
- [Набори плагінів](/uk/plugins/bundles) — сумісність наборів Codex/Claude/Cursor
- [Маніфест плагіна](/uk/plugins/manifest) — схема маніфесту
- [Реєстрація інструментів](/uk/plugins/building-plugins#registering-agent-tools) — додавання інструментів агента в плагін
- [Внутрішня архітектура плагінів](/uk/plugins/architecture) — модель можливостей і конвеєр завантаження
- [Плагіни спільноти](/uk/plugins/community) — сторонні добірки
