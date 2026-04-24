---
read_when:
    - Встановлення або налаштування плагінів
    - Розуміння правил виявлення та завантаження плагінів
    - Робота з сумісними з Codex/Claude пакетами плагінів
sidebarTitle: Install and Configure
summary: Встановлюйте, налаштовуйте та керуйте плагінами OpenClaw
title: Плагіни
x-i18n:
    generated_at: "2026-04-24T05:42:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: a93114ddb312552f4c321b6e318f3e19810cf5059dd0c68fde93da41936566b8
    source_path: tools/plugin.md
    workflow: 15
---

Плагіни розширюють OpenClaw новими можливостями: канали, постачальники моделей,
інструменти, Skills, мовлення, транскрипція в реальному часі, голос у реальному часі,
розуміння медіа, генерація зображень, генерація відео, отримання даних з вебу, вебпошук
та інше. Деякі плагіни є **core** (постачаються разом з OpenClaw), інші —
**external** (опубліковані спільнотою в npm).

## Швидкий початок

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

Шлях встановлення використовує той самий механізм визначення, що й CLI: локальний
шлях/архів, явний `clawhub:<pkg>` або специфікація пакета без префікса
(спочатку ClawHub, потім резервно npm).

Якщо конфігурація недійсна, встановлення зазвичай безпечно завершується з помилкою і вказує на
`openclaw doctor --fix`. Єдиний виняток для відновлення — вузький шлях
перевстановлення вбудованого плагіна для плагінів, які явно підтримують
`openclaw.install.allowInvalidConfigRecovery`.

У пакетних інсталяціях OpenClaw не виконується завчасне встановлення всього дерева
runtime-залежностей кожного вбудованого плагіна. Коли вбудований плагін, що належить OpenClaw, активний через
конфігурацію плагіна, застарілу конфігурацію каналу або маніфест із увімкненням за замовчуванням,
під час запуску відновлюються лише оголошені runtime-залежності цього плагіна перед його імпортом.
External-плагіни та користувацькі шляхи завантаження, як і раніше, потрібно встановлювати через
`openclaw plugins install`.

## Типи плагінів

OpenClaw розпізнає два формати плагінів:

| Формат     | Як це працює                                                      | Приклади                                               |
| ---------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + runtime-модуль; виконується в тому ж процесі | Офіційні плагіни, пакети npm від спільноти             |
| **Bundle** | Сумісне з Codex/Claude/Cursor компонування; зіставляється з можливостями OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва відображаються в `openclaw plugins list`. Див. [Пакети плагінів](/uk/plugins/bundles) для деталей про пакети.

Якщо ви пишете native-плагін, почніть з [Створення плагінів](/uk/plugins/building-plugins)
та [Огляд Plugin SDK](/uk/plugins/sdk-overview).

## Офіційні плагіни

### Доступні для встановлення (npm)

| Плагін          | Пакет                 | Документація                         |
| --------------- | --------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`    | [Matrix](/uk/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`   | [Microsoft Teams](/uk/channels/msteams) |
| Nostr           | `@openclaw/nostr`     | [Nostr](/uk/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/uk/plugins/voice-call)   |
| Zalo            | `@openclaw/zalo`      | [Zalo](/uk/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`  | [Zalo Personal](/uk/plugins/zalouser)   |

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
    - `memory-core` — вбудований пошук у пам’яті (типово через `plugins.slots.memory`)
    - `memory-lancedb` — довготривала пам’ять зі встановленням на вимогу з автоматичним пригадуванням/захопленням (встановіть `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Постачальники мовлення (увімкнені за замовчуванням)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` — вбудований browser-плагін для browser-інструмента, CLI `openclaw browser`, методу Gateway `browser.request`, browser runtime та стандартного сервісу керування browser (увімкнений за замовчуванням; вимкніть його перед заміною)
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

| Поле             | Опис                                                      |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Головний перемикач (типово: `true`)                       |
| `allow`          | Список дозволених плагінів (необов’язково)                |
| `deny`           | Список заборонених плагінів (необов’язково; deny має пріоритет) |
| `load.paths`     | Додаткові файли/каталоги плагінів                         |
| `slots`          | Селектори ексклюзивних слотів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>` | Перемикачі та конфігурація для окремого плагіна           |

Зміни конфігурації **потребують перезапуску gateway**. Якщо Gateway працює з увімкненими
відстеженням конфігурації та внутрішньопроцесним перезапуском (типовий шлях `openclaw gateway`),
цей перезапуск зазвичай виконується автоматично невдовзі після запису змін у конфігурацію.

<Accordion title="Стани плагінів: вимкнений, відсутній, недійсний">
  - **Вимкнений**: плагін існує, але правила ввімкнення його вимкнули. Конфігурація зберігається.
  - **Відсутній**: конфігурація посилається на ідентифікатор плагіна, який не було знайдено під час виявлення.
  - **Недійсний**: плагін існує, але його конфігурація не відповідає оголошеній схемі.
</Accordion>

## Виявлення та пріоритет

OpenClaw сканує плагіни в такому порядку (перше співпадіння перемагає):

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
    Інші потребують явного ввімкнення.
  </Step>
</Steps>

### Правила ввімкнення

- `plugins.enabled: false` вимикає всі плагіни
- `plugins.deny` завжди має пріоритет над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей плагін
- Плагіни з робочого простору **вимкнені за замовчуванням** (їх треба явно ввімкнути)
- Вбудовані плагіни дотримуються вбудованого набору, увімкненого за замовчуванням, якщо не перевизначено
- Ексклюзивні слоти можуть примусово ввімкнути вибраний для цього слота плагін
- Деякі вбудовані плагіни з режимом явного підключення автоматично вмикаються, коли конфігурація вказує
  на поверхню, що належить плагіну, наприклад посилання на модель постачальника, конфігурацію каналу або runtime
  harness
- Маршрути Codex сімейства OpenAI зберігають окремі межі плагінів:
  `openai-codex/*` належить плагіну OpenAI, тоді як вбудований плагін
  app-server Codex вибирається через `embeddedHarness.runtime: "codex"` або застарілі
  посилання на модель `codex/*`

## Слоти плагінів (ексклюзивні категорії)

Деякі категорії є ексклюзивними (одночасно активний лише один плагін):

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
| `memory`        | Active Memory plugin    | `memory-core`       |
| `contextEngine` | Активний механізм контексту | `legacy` (вбудований) |

## Довідка CLI

```bash
openclaw plugins list                       # стислий перелік
openclaw plugins list --enabled            # лише завантажені плагіни
openclaw plugins list --verbose            # детальні рядки для кожного плагіна
openclaw plugins list --json               # перелік у машиночитному форматі
openclaw plugins inspect <id>              # докладна інформація
openclaw plugins inspect <id> --json       # машиночитний формат
openclaw plugins inspect --all             # таблиця для всього набору
openclaw plugins info <id>                 # псевдонім для inspect
openclaw plugins doctor                    # діагностика

openclaw plugins install <package>         # встановити (спочатку ClawHub, потім npm)
openclaw plugins install clawhub:<pkg>     # встановити лише з ClawHub
openclaw plugins install <spec> --force    # перезаписати наявне встановлення
openclaw plugins install <path>            # встановити з локального шляху
openclaw plugins install -l <path>         # підключити (без копіювання) для розробки
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # зберегти точну розв’язану npm-специфікацію
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
вбудовані постачальники моделей, вбудовані постачальники мовлення та вбудований browser-плагін).
Інші вбудовані плагіни все одно потребують `openclaw plugins enable <id>`.

`--force` перезаписує наявний встановлений плагін або пакет хуків на місці. Використовуйте
`openclaw plugins update <id-or-npm-spec>` для звичайних оновлень відстежуваних npm-плагінів.
Він не підтримується з `--link`, який повторно використовує шлях до джерела замість
копіювання в кероване місце встановлення.

Коли `plugins.allow` уже задано, `openclaw plugins install` додає
ідентифікатор встановленого плагіна до цього списку allow перед його ввімкненням, щоб установлені
плагіни можна було одразу завантажити після перезапуску.

`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних установлень. Передача
специфікації npm-пакета з dist-tag або точною версією зіставляє назву пакета
назад із записом відстежуваного плагіна і зберігає нову специфікацію для майбутніх оновлень.
Передача назви пакета без версії переводить точне закріплене встановлення назад на
типову лінійку релізів реєстру. Якщо встановлений npm-плагін уже відповідає
розв’язаній версії та збереженій ідентичності артефакту, OpenClaw пропускає оновлення
без завантаження, перевстановлення чи перезапису конфігурації.

`--pin` працює лише для npm. Він не підтримується з `--marketplace`, оскільки
встановлення з marketplace зберігають метадані джерела marketplace замість npm-специфікації.

`--dangerously-force-unsafe-install` — це аварійний режим обходу для хибних
спрацьовувань вбудованого сканера небезпечного коду. Він дозволяє продовжити встановлення
та оновлення плагінів попри вбудовані результати `critical`, але все одно
не обходить блокування політики плагіна `before_install` або блокування через помилки сканування.

Цей прапорець CLI застосовується лише до процесів встановлення/оновлення плагінів. Встановлення залежностей Skills через Gateway
натомість використовують відповідний параметр запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install`
залишається окремим процесом завантаження/встановлення Skills через ClawHub.

Сумісні пакети беруть участь у тому самому процесі list/inspect/enable/disable
для плагінів. Поточна підтримка runtime охоплює bundle Skills, Claude command-skills,
типові значення Claude `settings.json`, типові значення Claude `.lsp.json` і
оголошені в маніфесті типові значення `lspServers`, Cursor command-skills і сумісні каталоги хуків Codex.

`openclaw plugins inspect <id>` також повідомляє про виявлені можливості пакета, а також
підтримувані чи непідтримувані записи серверів MCP і LSP для плагінів на основі пакетів.

Джерелами marketplace можуть бути відома назва Claude marketplace з
`~/.claude/plugins/known_marketplaces.json`, локальний корінь marketplace або шлях до
`marketplace.json`, скорочений запис GitHub на кшталт `owner/repo`, URL репозиторію GitHub
або git URL. Для віддалених marketplace записи плагінів мають залишатися в межах
клонованого репозиторію marketplace і використовувати лише відносні шляхи як джерела.

Див. [довідку CLI `openclaw plugins`](/uk/cli/plugins) для повної інформації.

## Огляд Plugin API

Native-плагіни експортують об’єкт entry, який надає `register(api)`. Старіші
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

OpenClaw завантажує об’єкт entry і викликає `register(api)` під час активації
плагіна. Завантажувач усе ще використовує `activate(api)` як запасний варіант для старіших плагінів,
але вбудовані плагіни та нові external-плагіни мають розглядати `register` як
публічний контракт.

Поширені методи реєстрації:

| Метод                                   | Що він реєструє            |
| --------------------------------------- | -------------------------- |
| `registerProvider`                      | Постачальник моделей (LLM) |
| `registerChannel`                       | Канал чату                 |
| `registerTool`                          | Інструмент агента          |
| `registerHook` / `on(...)`              | Хуки життєвого циклу       |
| `registerSpeechProvider`                | Синтез мовлення / STT      |
| `registerRealtimeTranscriptionProvider` | Потоковий STT              |
| `registerRealtimeVoiceProvider`         | Двоспрямований голос у реальному часі |
| `registerMediaUnderstandingProvider`    | Аналіз зображень/аудіо     |
| `registerImageGenerationProvider`       | Генерація зображень        |
| `registerMusicGenerationProvider`       | Генерація музики           |
| `registerVideoGenerationProvider`       | Генерація відео            |
| `registerWebFetchProvider`              | Постачальник отримання/скрапінгу з вебу |
| `registerWebSearchProvider`             | Вебпошук                   |
| `registerHttpRoute`                     | HTTP-ендпоінт              |
| `registerCommand` / `registerCli`       | Команди CLI                |
| `registerContextEngine`                 | Механізм контексту         |
| `registerService`                       | Фонова служба              |

Поведінка guard-хуків для типізованих хуків життєвого циклу:

- `before_tool_call`: `{ block: true }` є остаточним; обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: `{ block: false }` не має ефекту і не скасовує попереднє блокування.
- `before_install`: `{ block: true }` є остаточним; обробники з нижчим пріоритетом пропускаються.
- `before_install`: `{ block: false }` не має ефекту і не скасовує попереднє блокування.
- `message_sending`: `{ cancel: true }` є остаточним; обробники з нижчим пріоритетом пропускаються.
- `message_sending`: `{ cancel: false }` не має ефекту і не скасовує попереднє скасування.

Для повної інформації про поведінку типізованих хуків див. [Огляд SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Створення плагінів](/uk/plugins/building-plugins) — створіть власний плагін
- [Пакети плагінів](/uk/plugins/bundles) — сумісність пакетів Codex/Claude/Cursor
- [Маніфест плагіна](/uk/plugins/manifest) — схема маніфесту
- [Реєстрація інструментів](/uk/plugins/building-plugins#registering-agent-tools) — додавання агентських інструментів у плагін
- [Внутрішня архітектура плагінів](/uk/plugins/architecture) — модель можливостей і конвеєр завантаження
- [Плагіни спільноти](/uk/plugins/community) — сторонні каталоги
