---
read_when:
    - Установлення або налаштування Plugin
    - Розуміння правил виявлення та завантаження Plugin
    - Робота з сумісними з Codex/Claude наборами Plugin
sidebarTitle: Install and Configure
summary: Установлення, налаштування та керування Plugin OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-04-25T03:44:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: ec77f80d0f68dbb4d0ce7b53bdbce642bce933afe3f20bc1eb99eb1301f2461a
    source_path: tools/plugin.md
    workflow: 15
---

Plugin розширюють OpenClaw новими можливостями: канали, провайдери моделей,
обв’язки агентів, інструменти, Skills, мовлення, транскрипція в реальному часі, голос у реальному часі,
розуміння медіа, генерація зображень, генерація відео, отримання вебданих, вебпошук тощо.
Деякі Plugin є **core** (постачаються з OpenClaw), інші —
**external** (опубліковані спільнотою в npm).

## Швидкий старт

<Steps>
  <Step title="Подивитися, що завантажено">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Установити Plugin">
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

Якщо ви віддаєте перевагу керуванню безпосередньо в чаті, увімкніть `commands.plugins: true` і використовуйте:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Шлях установлення використовує той самий механізм визначення, що й CLI: локальний
шлях/архів, явний `clawhub:<pkg>` або специфікація пакета без префікса
(спочатку ClawHub, потім резервний перехід до npm).

Якщо конфігурація недійсна, установлення зазвичай безпечно завершується відмовою і вказує на
`openclaw doctor --fix`. Єдиний виняток для відновлення — вузький шлях повторного встановлення
вбудованого Plugin для Plugin, які підтримують
`openclaw.install.allowInvalidConfigRecovery`.

Паковані інсталяції OpenClaw не встановлюють завчасно все дерево залежностей часу виконання
для кожного вбудованого Plugin. Коли вбудований Plugin, що належить OpenClaw, є активним через
конфігурацію Plugin, застарілу конфігурацію каналу або маніфест, увімкнений типово,
під час запуску відновлюються лише оголошені залежності часу виконання цього Plugin перед його імпортом.
Явне вимкнення все одно має пріоритет: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` і `channels.<id>.enabled: false`
запобігають автоматичному відновленню вбудованих залежностей часу виконання для цього Plugin/каналу.
External Plugin і користувацькі шляхи завантаження, як і раніше, потрібно встановлювати через
`openclaw plugins install`.

## Типи Plugin

OpenClaw розпізнає два формати Plugin:

| Формат     | Як це працює                                                    | Приклади                                               |
| ---------- | --------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + модуль часу виконання; виконується в межах процесу | Офіційні Plugin, пакети npm від спільноти              |
| **Bundle** | Сумісний із Codex/Claude/Cursor макет; зіставляється з можливостями OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва відображаються в `openclaw plugins list`. Докладніше про набори див. у [Plugin Bundles](/uk/plugins/bundles).

Якщо ви пишете native Plugin, почніть із [Building Plugins](/uk/plugins/building-plugins)
та [Plugin SDK Overview](/uk/plugins/sdk-overview).

## Офіційні Plugin

### Доступні для встановлення (npm)

| Plugin          | Пакет                  | Документація                          |
| --------------- | ---------------------- | ------------------------------------- |
| Matrix          | `@openclaw/matrix`     | [Matrix](/uk/channels/matrix)            |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/uk/channels/msteams)  |
| Nostr           | `@openclaw/nostr`      | [Nostr](/uk/channels/nostr)              |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/uk/plugins/voice-call)     |
| Zalo            | `@openclaw/zalo`       | [Zalo](/uk/channels/zalo)                |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/uk/plugins/zalouser)    |

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
    - `memory-lancedb` — довготривала пам’ять з установленням на вимогу з автоматичним пригадуванням/захопленням (установіть `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Провайдери мовлення (увімкнені типово)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` — вбудований Plugin браузера для інструмента браузера, CLI `openclaw browser`, методу gateway `browser.request`, середовища виконання браузера та типового сервісу керування браузером (увімкнено типово; вимкніть перед його заміною)
    - `copilot-proxy` — міст VS Code Copilot Proxy (типово вимкнений)
  </Accordion>
</AccordionGroup>

Шукаєте сторонні Plugin? Див. [Community Plugins](/uk/plugins/community).

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
| `allow`          | Список дозволених Plugin (необов’язково)                  |
| `deny`           | Список заборонених Plugin (необов’язково; `deny` має пріоритет) |
| `load.paths`     | Додаткові файли/каталоги Plugin                           |
| `slots`          | Селектори ексклюзивних слотів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>` | Перемикачі та конфігурація для окремого Plugin            |

Зміни конфігурації **потребують перезапуску Gateway**. Якщо Gateway запущено з
відстеженням конфігурації та ввімкненим перезапуском у межах процесу
(типовий шлях `openclaw gateway`), цей перезапуск зазвичай виконується
автоматично невдовзі після застосування змін конфігурації.
Підтримуваного шляху гарячого перезавантаження для native коду часу виконання Plugin або хуків
життєвого циклу немає; перезапустіть процес Gateway, який обслуговує активний канал,
перш ніж очікувати, що оновлений код `register(api)`, хуки `api.on(...)`, інструменти, сервіси або
хуки провайдера/часу виконання почнуть працювати.

`openclaw plugins list` — це локальний знімок CLI/конфігурації. Plugin зі станом `loaded`
там означає, що Plugin можна виявити та завантажити з конфігурації/файлів, які бачить
цей виклик CLI. Це не доводить, що вже запущений віддалений дочірній процес Gateway
перезапустився з тим самим кодом Plugin. У середовищах VPS/контейнерів з процесами-обгортками
надсилайте перезапуски до фактичного процесу `openclaw gateway run`, або використовуйте
`openclaw gateway restart` для запущеного Gateway.

<Accordion title="Стани Plugin: вимкнений, відсутній, недійсний">
  - **Вимкнений**: Plugin існує, але правила ввімкнення його вимкнули. Конфігурація зберігається.
  - **Відсутній**: конфігурація посилається на ідентифікатор Plugin, який не знайдено під час виявлення.
  - **Недійсний**: Plugin існує, але його конфігурація не відповідає оголошеній схемі.
</Accordion>

## Виявлення та пріоритет

OpenClaw сканує Plugin у такому порядку (перше знайдене збігання має пріоритет):

<Steps>
  <Step title="Шляхи з конфігурації">
    `plugins.load.paths` — явні шляхи до файлів або каталогів.
  </Step>

  <Step title="Plugin робочої області">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` і `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Глобальні Plugin">
    `~/.openclaw/<plugin-root>/*.ts` і `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Вбудовані Plugin">
    Постачаються з OpenClaw. Багато з них увімкнені типово (провайдери моделей, мовлення).
    Інші потребують явного ввімкнення.
  </Step>
</Steps>

### Правила ввімкнення

- `plugins.enabled: false` вимикає всі Plugin
- `plugins.deny` завжди має пріоритет над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей Plugin
- Plugin із робочої області **типово вимкнені** (їх треба явно ввімкнути)
- Вбудовані Plugin дотримуються вбудованого набору типово ввімкнених, якщо це не перевизначено
- Ексклюзивні слоти можуть примусово ввімкнути вибраний Plugin для цього слота
- Деякі вбудовані Plugin з добровільним увімкненням активуються автоматично, коли конфігурація вказує поверхню, що належить Plugin, наприклад посилання на модель провайдера, конфігурацію каналу або середовище виконання harness
- Маршрути Codex сімейства OpenAI зберігають окремі межі Plugin:
  `openai-codex/*` належить Plugin OpenAI, тоді як вбудований Plugin сервера застосунку Codex
  вибирається через `embeddedHarness.runtime: "codex"` або застарілі
  посилання на моделі `codex/*`

## Усунення проблем із хуками часу виконання

Якщо Plugin з’являється в `plugins list`, але побічні ефекти `register(api)` або хуки
не працюють у трафіку живого чату, спочатку перевірте таке:

- Запустіть `openclaw gateway status --deep --require-rpc` і підтвердьте, що активні
  URL Gateway, профіль, шлях до конфігурації та процес — саме ті, які ви редагуєте.
- Перезапустіть активний Gateway після змін установлення/конфігурації/коду Plugin. У контейнерах
  з обгортками PID 1 може бути лише супервізором; перезапустіть або надішліть сигнал дочірньому
  процесу `openclaw gateway run`.
- Використовуйте `openclaw plugins inspect <id> --json`, щоб підтвердити реєстрації хуків і
  діагностику. Для невбудованих хуків розмови, таких як `llm_input`,
  `llm_output` і `agent_end`, потрібен
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання моделі надавайте перевагу `before_model_resolve`. Він виконується перед
  визначенням моделі для ходів агента; `llm_output` виконується лише після того, як спроба моделі
  згенерує вихід асистента.
- Щоб підтвердити фактичну модель сесії, використовуйте `openclaw sessions` або
  поверхні сесії/стану Gateway, а під час налагодження корисних навантажень провайдера
  запускайте Gateway з `--raw-stream --raw-stream-path <path>`.

## Слоти Plugin (ексклюзивні категорії)

Деякі категорії є ексклюзивними (одночасно активною може бути лише одна):

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

| Слот            | Що він контролює         | Типове значення     |
| --------------- | ------------------------ | ------------------- |
| `memory`        | Active Memory Plugin     | `memory-core`       |
| `contextEngine` | Активний рушій контексту | `legacy` (вбудований) |

## Довідка CLI

```bash
openclaw plugins list                       # компактний перелік
openclaw plugins list --enabled            # лише завантажені Plugin
openclaw plugins list --verbose            # докладні рядки для кожного Plugin
openclaw plugins list --json               # машиночитаний перелік
openclaw plugins inspect <id>              # докладна інформація
openclaw plugins inspect <id> --json       # машиночитано
openclaw plugins inspect --all             # таблиця для всього набору
openclaw plugins info <id>                 # псевдонім inspect
openclaw plugins doctor                    # діагностика

openclaw plugins install <package>         # встановлення (спочатку ClawHub, потім npm)
openclaw plugins install clawhub:<pkg>     # встановлення лише з ClawHub
openclaw plugins install <spec> --force    # перезаписати наявне встановлення
openclaw plugins install <path>            # встановлення з локального шляху
openclaw plugins install -l <path>         # створити посилання (без копіювання) для розробки
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # записати точну визначену специфікацію npm
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # оновити один Plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # оновити всі
openclaw plugins uninstall <id>          # видалити записи конфігурації/встановлення
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Вбудовані Plugin постачаються разом з OpenClaw. Багато з них увімкнені типово (наприклад,
вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований Plugin
браузера). Інші вбудовані Plugin, як і раніше, потребують `openclaw plugins enable <id>`.

`--force` перезаписує наявний встановлений Plugin або набір хуків на місці. Використовуйте
`openclaw plugins update <id-or-npm-spec>` для звичайних оновлень відстежуваних npm
Plugin. Це не підтримується з `--link`, який повторно використовує вихідний шлях замість
копіювання до керованого цільового шляху встановлення.

Коли `plugins.allow` уже задано, `openclaw plugins install` додає
ідентифікатор встановленого Plugin до цього списку дозволених перед його ввімкненням, тож встановлені Plugin
можна одразу завантажити після перезапуску.

`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних встановлень. Передавання
специфікації npm-пакета з dist-tag або точною версією зіставляє назву пакета
назад із записом відстежуваного Plugin і записує нову специфікацію для майбутніх оновлень.
Передавання назви пакета без версії переводить точно закріплене встановлення назад на
типову лінійку випусків реєстру. Якщо встановлений npm Plugin уже відповідає
визначеній версії та записаній тотожності артефакту, OpenClaw пропускає оновлення
без завантаження, перевстановлення чи перезапису конфігурації.

`--pin` працює лише для npm. Він не підтримується з `--marketplace`, оскільки
встановлення з marketplace зберігають метадані джерела marketplace замість специфікації npm.

`--dangerously-force-unsafe-install` — це аварійне перевизначення для хибнопозитивних
спрацювань вбудованого сканера небезпечного коду. Воно дозволяє продовжити встановлення
та оновлення Plugin попри вбудовані критичні висновки `critical`, але
все одно не обходить блокування політики Plugin `before_install` або блокування через збій сканування.

Цей прапорець CLI застосовується лише до потоків встановлення/оновлення Plugin. Установлення
залежностей Skills через Gateway натомість використовують відповідне перевизначення запиту
`dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком
завантаження/встановлення Skills із ClawHub.

Сумісні набори беруть участь у тому самому потоці list/inspect/enable/disable для Plugin.
Поточна підтримка часу виконання включає Skills із наборів, command-skills Claude,
типові значення Claude `settings.json`, типові значення Claude `.lsp.json` і оголошені в маніфесті
`lspServers`, command-skills Cursor і сумісні каталоги хуків Codex.

`openclaw plugins inspect <id>` також повідомляє про виявлені можливості набору, а також
підтримувані або непідтримувані записи серверів MCP і LSP для Plugin, що працюють на основі наборів.

Джерелами marketplace можуть бути відома назва marketplace Claude з
`~/.claude/plugins/known_marketplaces.json`, локальний корінь marketplace або шлях до
`marketplace.json`, скорочений запис GitHub на кшталт `owner/repo`, URL репозиторію GitHub
або URL git. Для віддалених marketplace записи Plugin мають залишатися всередині
клонованого репозиторію marketplace і використовувати лише відносні шляхи джерел.

Повні відомості див. у [довідці CLI `openclaw plugins`](/uk/cli/plugins).

## Огляд API Plugin

Native Plugin експортують вхідний об’єкт, який надає `register(api)`. Старіші
Plugin усе ще можуть використовувати `activate(api)` як застарілий псевдонім, але нові Plugin мають
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
активації Plugin. Завантажувач усе ще повертається до `activate(api)` для старіших Plugin,
але вбудовані Plugin і нові external Plugin повинні розглядати `register` як
публічний контракт.

`api.registrationMode` повідомляє Plugin, чому завантажується його вхідний об’єкт:

| Режим           | Значення                                                                                                                        |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Активація часу виконання. Реєструє інструменти, хуки, сервіси, команди, маршрути та інші побічні ефекти живої роботи.          |
| `discovery`     | Виявлення можливостей лише для читання. Реєструє провайдери та метадані; код входу довіреного Plugin може завантажуватися, але побічні ефекти живої роботи слід пропускати. |
| `setup-only`    | Завантаження метаданих налаштування каналу через спрощений запис налаштування.                                                  |
| `setup-runtime` | Завантаження налаштування каналу, яке також потребує запису часу виконання.                                                     |
| `cli-metadata`  | Лише збирання метаданих команд CLI.                                                                                             |

Входи Plugin, які відкривають сокети, бази даних, фонові працівники або довгоживучі
клієнти, повинні захищати ці побічні ефекти перевіркою `api.registrationMode === "full"`.
Завантаження для виявлення кешуються окремо від активаційних завантажень і не замінюють
реєстр запущеного Gateway. Виявлення не активує, але й не обходиться без імпорту:
OpenClaw може обчислювати довірений вхід Plugin або модуль Plugin каналу, щоб побудувати
знімок. Зберігайте верхній рівень модулів легким і без побічних ефектів, а мережеві клієнти,
підпроцеси, слухачі, читання облікових даних і запуск сервісів переносіть
за межі шляхів повного часу виконання.

Поширені методи реєстрації:

| Метод                                  | Що реєструє                 |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Провайдер моделі (LLM)      |
| `registerChannel`                       | Канал чату                  |
| `registerTool`                          | Інструмент агента           |
| `registerHook` / `on(...)`              | Хуки життєвого циклу        |
| `registerSpeechProvider`                | Синтез мовлення / STT       |
| `registerRealtimeTranscriptionProvider` | Потоковий STT               |
| `registerRealtimeVoiceProvider`         | Двобічний голос у реальному часі |
| `registerMediaUnderstandingProvider`    | Аналіз зображень/аудіо      |
| `registerImageGenerationProvider`       | Генерація зображень         |
| `registerMusicGenerationProvider`       | Генерація музики            |
| `registerVideoGenerationProvider`       | Генерація відео             |
| `registerWebFetchProvider`              | Провайдер отримання/скрапінгу вебданих |
| `registerWebSearchProvider`             | Вебпошук                    |
| `registerHttpRoute`                     | HTTP-ендпойнт               |
| `registerCommand` / `registerCli`       | Команди CLI                 |
| `registerContextEngine`                 | Рушій контексту             |
| `registerService`                       | Фоновий сервіс              |

Поведінка захисту хуків для типізованих хуків життєвого циклу:

- `before_tool_call`: `{ block: true }` є остаточним; обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: `{ block: false }` нічого не робить і не скасовує раніше встановлене блокування.
- `before_install`: `{ block: true }` є остаточним; обробники з нижчим пріоритетом пропускаються.
- `before_install`: `{ block: false }` нічого не робить і не скасовує раніше встановлене блокування.
- `message_sending`: `{ cancel: true }` є остаточним; обробники з нижчим пріоритетом пропускаються.
- `message_sending`: `{ cancel: false }` нічого не робить і не скасовує раніше встановлене скасування.

Native сервер застосунку Codex повертає події інструментів Codex у цей
поверхневий рівень хуків через міст. Plugin можуть блокувати native інструменти Codex через `before_tool_call`,
спостерігати результати через `after_tool_call` і брати участь у схваленнях
`PermissionRequest` Codex. Міст поки що не переписує аргументи native інструментів Codex.
Точна межа підтримки часу виконання Codex описана в
[контракті підтримки Codex harness v1](/uk/plugins/codex-harness#v1-support-contract).

Докладно про типізовану поведінку хуків див. в [огляді SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Building Plugins](/uk/plugins/building-plugins) — створення власного Plugin
- [Plugin Bundles](/uk/plugins/bundles) — сумісність наборів Codex/Claude/Cursor
- [Plugin Manifest](/uk/plugins/manifest) — схема маніфесту
- [Registering Tools](/uk/plugins/building-plugins#registering-agent-tools) — додавання інструментів агента в Plugin
- [Plugin Internals](/uk/plugins/architecture) — модель можливостей і конвеєр завантаження
- [Community Plugins](/uk/plugins/community) — сторонні переліки
