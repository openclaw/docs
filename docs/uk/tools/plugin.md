---
read_when:
    - Встановлення або налаштування Plugin
    - Розуміння правил виявлення та завантаження Plugin
    - Робота з пакетами Plugin, сумісними з Codex/Claude
sidebarTitle: Install and Configure
summary: Встановлення, налаштування та керування Plugin OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-04-25T05:59:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 54a902eabd90e54e769429770cd56e1d89a8bb50aff4b9ed8a9f68d6685b77a8
    source_path: tools/plugin.md
    workflow: 15
---

Plugin розширюють OpenClaw новими можливостями: channels, provider моделей,
agent harness, tools, Skills, мовлення, realtime transcription, realtime
voice, media-understanding, image generation, video generation, web fetch, web
search тощо. Деякі Plugin є **core** (постачаються з OpenClaw), інші
є **external** (опубліковані спільнотою в npm).

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

    Потім налаштуйте в `plugins.entries.\<id\>.config` у вашому файлі config.

  </Step>
</Steps>

Якщо ви віддаєте перевагу керуванню безпосередньо в чаті, увімкніть `commands.plugins: true` і використовуйте:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Шлях встановлення використовує той самий resolver, що й CLI: локальний
шлях/архів, явний `clawhub:<pkg>` або специфікацію пакета без префікса (спочатку ClawHub, потім резервно npm).

Якщо config недійсний, встановлення зазвичай безпечно завершується відмовою й
спрямовує вас до `openclaw doctor --fix`. Єдиний виняток для відновлення — це вузький шлях
перевстановлення вбудованого Plugin для Plugin, які явно підтримують
`openclaw.install.allowInvalidConfigRecovery`.

У пакетних інсталяціях OpenClaw дерево runtime-залежностей кожного вбудованого Plugin
не встановлюється завчасно. Коли вбудований Plugin, що належить OpenClaw, активний через
config Plugin, застарілий config каналу або маніфест із увімкненням за замовчуванням,
під час запуску відновлюються лише задекларовані runtime-залежності цього Plugin
перед його імпортом. Явне вимкнення все одно має пріоритет: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` і `channels.<id>.enabled: false`
запобігають автоматичному відновленню runtime-залежностей вбудованого Plugin/каналу.
External Plugin і користувацькі шляхи завантаження все одно треба встановлювати через
`openclaw plugins install`.

## Типи Plugin

OpenClaw розпізнає два формати Plugin:

| Формат     | Як це працює                                                    | Приклади                                              |
| ---------- | --------------------------------------------------------------- | ----------------------------------------------------- |
| **Native** | `openclaw.plugin.json` + модуль runtime; виконується в процесі  | Офіційні Plugin, npm-пакети спільноти                 |
| **Bundle** | Сумісне з Codex/Claude/Cursor компонування; зіставляється з можливостями OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва з’являються в `openclaw plugins list`. Подробиці про bundle див. у [Пакети Plugin](/uk/plugins/bundles).

Якщо ви пишете native Plugin, почніть із [Створення Plugin](/uk/plugins/building-plugins)
і [Огляду SDK Plugin](/uk/plugins/sdk-overview).

## Офіційні Plugin

### Доступні для встановлення (npm)

| Plugin          | Пакет                 | Docs                                 |
| --------------- | --------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`    | [Matrix](/uk/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`   | [Microsoft Teams](/uk/channels/msteams) |
| Nostr           | `@openclaw/nostr`     | [Nostr](/uk/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call`| [Voice Call](/uk/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`      | [Zalo](/uk/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`  | [Zalo Personal](/uk/plugins/zalouser)   |

### Core (постачаються з OpenClaw)

<AccordionGroup>
  <Accordion title="Provider моделей (увімкнені за замовчуванням)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugin пам’яті">
    - `memory-core` — вбудований memory search (типово через `plugins.slots.memory`)
    - `memory-lancedb` — довготривала пам’ять, що встановлюється за потреби, з автоматичним пригадуванням/збереженням (задайте `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Provider мовлення (увімкнені за замовчуванням)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` — вбудований browser Plugin для browser tool, CLI `openclaw browser`, методу gateway `browser.request`, browser runtime і стандартного сервісу керування browser (увімкнено за замовчуванням; вимкніть перед заміною)
    - `copilot-proxy` — міст VS Code Copilot Proxy (типово вимкнений)
  </Accordion>
</AccordionGroup>

Шукаєте сторонні Plugin? Див. [Plugin спільноти](/uk/plugins/community).

## Configuration

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
| `enabled`        | Головний перемикач (за замовчуванням: `true`)             |
| `allow`          | Allowlist Plugin (необов’язково)                          |
| `deny`           | Denylist Plugin (необов’язково; deny має пріоритет)       |
| `load.paths`     | Додаткові файли/каталоги Plugin                           |
| `slots`          | Селектори ексклюзивних слотів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>` | Перемикачі та config для кожного Plugin                   |

Зміни config **потребують перезапуску gateway**. Якщо Gateway працює з
відстеженням config + внутрішньопроцесним перезапуском (типовий шлях `openclaw gateway`),
цей перезапуск зазвичай виконується автоматично невдовзі після запису config.
Підтримуваного шляху hot-reload для коду runtime native Plugin або hook життєвого циклу немає;
перезапустіть процес Gateway, який обслуговує активний канал, перш ніж очікувати, що оновлений код
`register(api)`, hook `api.on(...)`, tools, services або
hook provider/runtime почнуть працювати.

`openclaw plugins list` — це локальний знімок CLI/config. Стан `loaded` для Plugin
означає, що Plugin можна виявити та завантажити з config/файлів, які бачить цей
виклик CLI. Це не доводить, що вже запущений віддалений дочірній процес Gateway
перезапустився з тим самим кодом Plugin. У налаштуваннях VPS/container з wrapper-процесами
надсилайте перезапуск реальному процесу `openclaw gateway run` або використовуйте
`openclaw gateway restart` для запущеного Gateway.

<Accordion title="Стани Plugin: disabled vs missing vs invalid">
  - **Disabled**: Plugin існує, але правила ввімкнення його вимкнули. Config зберігається.
  - **Missing**: config посилається на id Plugin, який система виявлення не знайшла.
  - **Invalid**: Plugin існує, але його config не відповідає задекларованій схемі.
</Accordion>

## Виявлення та пріоритетність

OpenClaw сканує Plugin у такому порядку (перше збігання має пріоритет):

<Steps>
  <Step title="Шляхи config">
    `plugins.load.paths` — явні шляхи до файлів або каталогів.
  </Step>

  <Step title="Plugin робочого простору">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` і `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Глобальні Plugin">
    `~/.openclaw/<plugin-root>/*.ts` і `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Вбудовані Plugin">
    Постачаються з OpenClaw. Багато з них увімкнено за замовчуванням (provider моделей, мовлення).
    Інші потребують явного ввімкнення.
  </Step>
</Steps>

### Правила ввімкнення

- `plugins.enabled: false` вимикає всі Plugin
- `plugins.deny` завжди має пріоритет над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей Plugin
- Plugin із робочого простору **вимкнені за замовчуванням** (їх треба явно ввімкнути)
- Вбудовані Plugin дотримуються вбудованого набору default-on, якщо не перевизначено
- Ексклюзивні слоти можуть примусово вмикати вибраний Plugin для цього слота
- Деякі вбудовані Plugin з opt-in автоматично вмикаються, коли config називає
  поверхню, що належить Plugin, наприклад посилання на модель provider, config каналу або runtime harness
- Маршрути Codex сімейства OpenAI зберігають окремі межі Plugin:
  `openai-codex/*` належить Plugin OpenAI, тоді як вбудований Plugin сервера
  застосунку Codex вибирається через `embeddedHarness.runtime: "codex"` або застарілі
  посилання на моделі `codex/*`

## Усунення несправностей hook runtime

Якщо Plugin з’являється в `plugins list`, але побічні ефекти `register(api)` або hook
не виконуються в живому чат-трафіку, спочатку перевірте таке:

- Запустіть `openclaw gateway status --deep --require-rpc` і підтвердьте, що активні
  URL Gateway, профіль, шлях config і процес — саме ті, які ви редагуєте.
- Перезапустіть активний Gateway після змін встановлення/config/коду Plugin. У wrapper
  container PID 1 може бути лише супервізором; перезапустіть або надішліть сигнал дочірньому
  процесу `openclaw gateway run`.
- Використайте `openclaw plugins inspect <id> --json`, щоб підтвердити реєстрації hook і
  diagnostics. Hook розмов, не пов’язані з вбудованими Plugin, наприклад `llm_input`,
  `llm_output` і `agent_end`, потребують
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання моделей віддавайте перевагу `before_model_resolve`. Він виконується до
  розв’язання моделі для ходів агента; `llm_output` виконується лише після того,
  як спроба моделі створить вивід агента.
- Щоб підтвердити фактичну модель сесії, використовуйте `openclaw sessions` або
  поверхні сесії/статусу Gateway і, якщо ви налагоджуєте payload provider, запускайте
  Gateway з `--raw-stream --raw-stream-path <path>`.

## Слоти Plugin (ексклюзивні категорії)

Деякі категорії є ексклюзивними (одночасно може бути активним лише один Plugin):

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

| Слот            | Що контролює          | Типове значення     |
| --------------- | --------------------- | ------------------- |
| `memory`        | Активний Plugin пам’яті | `memory-core`     |
| `contextEngine` | Активний рушій контексту | `legacy` (вбудований) |

## Довідник CLI

```bash
openclaw plugins list                       # стислий перелік
openclaw plugins list --enabled            # лише завантажені Plugin
openclaw plugins list --verbose            # докладні рядки для кожного Plugin
openclaw plugins list --json               # машинозчитуваний перелік
openclaw plugins inspect <id>              # детальна інформація
openclaw plugins inspect <id> --json       # машинозчитуваний формат
openclaw plugins inspect --all             # загальна таблиця
openclaw plugins info <id>                 # псевдонім inspect
openclaw plugins doctor                    # діагностика

openclaw plugins install <package>         # встановити (спочатку ClawHub, потім npm)
openclaw plugins install clawhub:<pkg>     # встановити лише з ClawHub
openclaw plugins install <spec> --force    # перезаписати наявне встановлення
openclaw plugins install <path>            # встановити з локального шляху
openclaw plugins install -l <path>         # під’єднати (без копіювання) для розробки
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # зафіксувати точну розв’язану npm-специфікацію
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # оновити один Plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # оновити всі
openclaw plugins uninstall <id>          # видалити записи config/встановлення
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Вбудовані Plugin постачаються разом з OpenClaw. Багато з них увімкнені за замовчуванням (наприклад,
вбудовані provider моделей, вбудовані provider мовлення та вбудований browser
Plugin). Інші вбудовані Plugin усе ще потребують `openclaw plugins enable <id>`.

`--force` перезаписує наявний встановлений Plugin або пакет hook на місці. Для звичайних оновлень відстежуваних npm-
Plugin використовуйте `openclaw plugins update <id-or-npm-spec>`. Це не підтримується з `--link`, який повторно використовує шлях до джерела замість копіювання
до керованої цілі встановлення.

Коли `plugins.allow` уже задано, `openclaw plugins install` додає
id встановленого Plugin до цього allowlist перед його ввімкненням, тому після
перезапуску встановлені Plugin одразу можна завантажити.

`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних встановлень. Передавання
npm-специфікації пакета з dist-tag або точною версією розв’язує назву пакета
назад у запис відстежуваного Plugin і записує нову специфікацію для майбутніх оновлень.
Передавання назви пакета без версії повертає точно зафіксоване встановлення до
типової лінії релізів реєстру. Якщо встановлений npm Plugin уже відповідає
розв’язаній версії та зафіксованій ідентичності артефакту, OpenClaw пропускає оновлення
без завантаження, перевстановлення чи перезапису config.

`--pin` працює лише для npm. Він не підтримується з `--marketplace`, оскільки
встановлення з marketplace зберігають метадані джерела marketplace замість npm-специфікації.

`--dangerously-force-unsafe-install` — це аварійне перевизначення для хибнопозитивних
спрацьовувань вбудованого сканера небезпечного коду. Воно дозволяє встановленням
і оновленням Plugin продовжуватися попри вбудовані знахідки рівня `critical`, але все одно
не обходить блокування політики Plugin `before_install` або блокування через збій сканування.

Цей прапорець CLI застосовується лише до потоків встановлення/оновлення Plugin. Встановлення залежностей Skills через Gateway
натомість використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком завантаження/встановлення Skills із ClawHub.

Сумісні bundle беруть участь у тих самих потоках list/inspect/enable/disable
Plugin. Поточна підтримка runtime включає Skills bundle, command-skills Claude,
типові значення Claude `settings.json`, типові значення Claude `.lsp.json` і задекларовані в маніфесті
`lspServers`, command-skills Cursor і сумісні каталоги hook Codex.

`openclaw plugins inspect <id>` також повідомляє про виявлені можливості bundle, а також підтримувані
або непідтримувані записи MCP і LSP server для Plugin, що базуються на bundle.

Джерелами marketplace можуть бути відома назва marketplace Claude з
`~/.claude/plugins/known_marketplaces.json`, локальний корінь marketplace або шлях до
`marketplace.json`, скорочений запис GitHub на кшталт `owner/repo`, URL репозиторію GitHub
або URL git. Для віддалених marketplace записи Plugin мають залишатися всередині
клонованого репозиторію marketplace й використовувати лише відносні шляхи джерел.

Повні подробиці див. у [довіднику CLI `openclaw plugins`](/uk/cli/plugins).

## Огляд API Plugin

Native Plugin експортують об’єкт точки входу, який надає `register(api)`. Старіші
Plugin все ще можуть використовувати `activate(api)` як застарілий псевдонім, але нові Plugin мають
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
активації Plugin. Завантажувач усе ще використовує резервно `activate(api)` для старіших Plugin,
але вбудовані Plugin і нові external Plugin мають розглядати `register` як
публічний контракт.

`api.registrationMode` повідомляє Plugin, чому завантажується його точка входу:

| Режим           | Значення                                                                                                                          |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Активація runtime. Реєструйте tools, hooks, services, commands, routes та інші активні побічні ефекти.                          |
| `discovery`     | Виявлення можливостей у режимі лише для читання. Реєструйте provider і метадані; код точки входу довіреного Plugin може завантажуватися, але пропускайте активні побічні ефекти. |
| `setup-only`    | Завантаження метаданих налаштування каналу через полегшену точку входу налаштування.                                             |
| `setup-runtime` | Завантаження налаштування каналу, якому також потрібна точка входу runtime.                                                       |
| `cli-metadata`  | Лише збирання метаданих команд CLI.                                                                                               |

Точки входу Plugin, які відкривають сокети, бази даних, фонові worker, або довгоживучі
клієнти, мають захищати ці побічні ефекти умовою `api.registrationMode === "full"`.
Завантаження discovery кешуються окремо від активувальних завантажень і не замінюють
активний реєстр Gateway. Discovery — це неактивувальне, але не безімпортне завантаження:
OpenClaw може виконувати обчислення точки входу довіреного Plugin або модуля channel Plugin, щоб побудувати
знімок. Тримайте верхні рівні модулів легкими й без побічних ефектів, а мережеві
клієнти, підпроцеси, listener, читання облікових даних і запуск service переносіть
у шляхи повного runtime.

Поширені методи реєстрації:

| Метод                                  | Що реєструє                 |
| -------------------------------------- | --------------------------- |
| `registerProvider`                     | Provider моделі (LLM)       |
| `registerChannel`                      | Чат-канал                   |
| `registerTool`                         | Tool агента                 |
| `registerHook` / `on(...)`             | Hooks життєвого циклу       |
| `registerSpeechProvider`               | Перетворення text-to-speech / STT |
| `registerRealtimeTranscriptionProvider`| Потоковий STT               |
| `registerRealtimeVoiceProvider`        | Двосторонній realtime voice |
| `registerMediaUnderstandingProvider`   | Аналіз зображень/аудіо      |
| `registerImageGenerationProvider`      | Генерація зображень         |
| `registerMusicGenerationProvider`      | Генерація музики            |
| `registerVideoGenerationProvider`      | Генерація відео             |
| `registerWebFetchProvider`             | Provider web fetch / scrape |
| `registerWebSearchProvider`            | Вебпошук                    |
| `registerHttpRoute`                    | HTTP endpoint               |
| `registerCommand` / `registerCli`      | Команди CLI                 |
| `registerContextEngine`                | Рушій контексту             |
| `registerService`                      | Фонова service              |

Поведінка захисту hook для типізованих hook життєвого циклу:

- `before_tool_call`: `{ block: true }` — термінальне значення; handler з нижчим пріоритетом пропускаються.
- `before_tool_call`: `{ block: false }` — бездіяльність і не скасовує попереднє блокування.
- `before_install`: `{ block: true }` — термінальне значення; handler з нижчим пріоритетом пропускаються.
- `before_install`: `{ block: false }` — бездіяльність і не скасовує попереднє блокування.
- `message_sending`: `{ cancel: true }` — термінальне значення; handler з нижчим пріоритетом пропускаються.
- `message_sending`: `{ cancel: false }` — бездіяльність і не скасовує попереднє скасування.

Native app-server запусків Codex повертає події native tool Codex назад у цю
поверхню hook. Plugin можуть блокувати native tools Codex через `before_tool_call`,
спостерігати результати через `after_tool_call` і брати участь у погодженнях
Codex `PermissionRequest`. Міст поки що не переписує аргументи native tool Codex. Точна межа підтримки runtime Codex описана в
[контракті підтримки Codex harness v1](/uk/plugins/codex-harness#v1-support-contract).

Повну типізовану поведінку hook див. в [огляді SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Створення Plugin](/uk/plugins/building-plugins) — створіть власний Plugin
- [Пакети Plugin](/uk/plugins/bundles) — сумісність bundle Codex/Claude/Cursor
- [Маніфест Plugin](/uk/plugins/manifest) — схема маніфесту
- [Реєстрація tools](/uk/plugins/building-plugins#registering-agent-tools) — додавання tools агента в Plugin
- [Внутрішня архітектура Plugin](/uk/plugins/architecture) — модель можливостей і конвеєр завантаження
- [Plugin спільноти](/uk/plugins/community) — сторонні списки
