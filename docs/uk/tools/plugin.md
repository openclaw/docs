---
read_when:
    - Встановлення або налаштування плагінів
    - Розуміння правил виявлення та завантаження плагінів
    - Робота з сумісними з Codex/Claude пакетами плагінів
sidebarTitle: Install and Configure
summary: Встановлення, налаштування та керування плагінами OpenClaw
title: Плагіни
x-i18n:
    generated_at: "2026-04-25T19:49:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: bbc819fc29f0bf58fce83223e43e2ddba3f199c71c6536e900ac6032f181d770
    source_path: tools/plugin.md
    workflow: 15
---

Плагіни розширюють OpenClaw новими можливостями: канали, постачальники моделей,
середовища агентів, інструменти, Skills, мовлення, транскрипція в реальному часі, голос у реальному
часі, розуміння медіа, генерація зображень, генерація відео, веб-отримання, веб-
пошук тощо. Деякі плагіни є **core** (постачаються з OpenClaw), інші —
**external** (опубліковані спільнотою в npm).

## Швидкий старт

<Steps>
  <Step title="Перегляньте, що завантажено">
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

Шлях встановлення використовує той самий механізм розв’язання, що й CLI: локальний
шлях/архів, явний `clawhub:<pkg>` або специфікація пакета без префікса (спочатку ClawHub, потім резервний перехід на npm).

Якщо конфігурація некоректна, встановлення зазвичай безпечно завершується відмовою і пропонує
скористатися `openclaw doctor --fix`. Єдиний виняток для відновлення — це вузький шлях
перевстановлення вбудованого плагіна для плагінів, які підтримують
`openclaw.install.allowInvalidConfigRecovery`.

Пакетні встановлення OpenClaw не встановлюють завчасно все дерево залежностей середовища виконання кожного вбудованого плагіна.
Коли вбудований плагін, що належить OpenClaw, активний через
конфігурацію плагіна, застарілу конфігурацію каналу або маніфест, увімкнений за замовчуванням,
під час запуску відновлюються лише оголошені цим плагіном залежності середовища виконання перед його імпортом.
Явне вимкнення все одно має пріоритет: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` і `channels.<id>.enabled: false`
запобігають автоматичному відновленню залежностей середовища виконання для цього плагіна/каналу.
External-плагіни та користувацькі шляхи завантаження, як і раніше, потрібно встановлювати через
`openclaw plugins install`.

## Типи плагінів

OpenClaw розпізнає два формати плагінів:

| Формат     | Як це працює                                                     | Приклади                                               |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + модуль середовища виконання; виконується в тому ж процесі | Офіційні плагіни, пакети npm від спільноти             |
| **Bundle** | Сумісне з Codex/Claude/Cursor компонування; відображається на можливості OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва відображаються в `openclaw plugins list`. Докладніше про пакети див. у [Plugin Bundles](/uk/plugins/bundles).

Якщо ви пишете native-плагін, почніть із [Building Plugins](/uk/plugins/building-plugins)
та [Plugin SDK Overview](/uk/plugins/sdk-overview).

## Офіційні плагіни

### Встановлювані (npm)

| Плагін          | Пакет                 | Документація                         |
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

  <Accordion title="Плагіни пам’яті">
    - `memory-core` — вбудований пошук у пам’яті (типово через `plugins.slots.memory`)
    - `memory-lancedb` — довгострокова пам’ять із встановленням за потреби та автоматичним пригадуванням/захопленням (встановіть `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Постачальники мовлення (увімкнені за замовчуванням)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` — вбудований browser-плагін для browser tool, CLI `openclaw browser`, методу Gateway `browser.request`, browser runtime та служби керування браузером за замовчуванням (увімкнений за замовчуванням; вимкніть його перед заміною)
    - `copilot-proxy` — міст VS Code Copilot Proxy (вимкнений за замовчуванням)
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

| Поле             | Опис                                                      |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Головний перемикач (типово: `true`)                       |
| `allow`          | Список дозволених плагінів (необов’язково)                |
| `deny`           | Список заборонених плагінів (необов’язково; deny має пріоритет) |
| `load.paths`     | Додаткові файли/каталоги плагінів                         |
| `slots`          | Селектори ексклюзивних слотів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>` | Перемикачі та конфігурація для окремого плагіна           |

Зміни конфігурації **потребують перезапуску Gateway**. Якщо Gateway запущено з
відстеженням конфігурації та перезапуском у процесі (типовий шлях `openclaw gateway`),
такий перезапуск зазвичай виконується автоматично невдовзі після запису конфігурації.
Підтримуваного шляху hot-reload для коду native-плагінів або хуків життєвого циклу немає;
перезапустіть процес Gateway, який обслуговує активний канал, перш ніж
очікувати, що оновлений код `register(api)`, хуки `api.on(...)`, інструменти, служби або
хуки постачальника/runtime почнуть виконуватися.

`openclaw plugins list` — це локальний знімок реєстру/конфігурації плагінів. Плагін зі
станом `enabled` там означає, що збережений реєстр і поточна конфігурація дозволяють
йому брати участь. Це не доводить, що вже запущений дочірній процес віддаленого Gateway
перезапустився з тим самим кодом плагіна. У VPS/контейнерних конфігураціях із
процесами-обгортками надсилайте перезапуск фактичному процесу `openclaw gateway run`,
або використовуйте `openclaw gateway restart` для запущеного Gateway.

<Accordion title="Стани плагіна: вимкнений, відсутній, некоректний">
  - **Disabled**: плагін існує, але правила увімкнення його вимкнули. Конфігурація зберігається.
  - **Missing**: конфігурація посилається на ідентифікатор плагіна, який не було знайдено під час виявлення.
  - **Invalid**: плагін існує, але його конфігурація не відповідає оголошеній схемі.
</Accordion>

## Виявлення та пріоритет

OpenClaw сканує плагіни в такому порядку (перше збіг — пріоритетний):

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
    Постачаються з OpenClaw. Багато з них увімкнено за замовчуванням (постачальники моделей, мовлення).
    Інші потребують явного ввімкнення.
  </Step>
</Steps>

### Правила увімкнення

- `plugins.enabled: false` вимикає всі плагіни
- `plugins.deny` завжди має пріоритет над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей плагін
- Плагіни з робочого простору **вимкнені за замовчуванням** (їх потрібно явно ввімкнути)
- Вбудовані плагіни дотримуються вбудованого набору, увімкненого за замовчуванням, якщо його не перевизначено
- Ексклюзивні слоти можуть примусово ввімкнути вибраний для цього слота плагін
- Деякі вбудовані плагіни з режимом opt-in вмикаються автоматично, коли конфігурація вказує поверхню, що належить плагіну,
  наприклад посилання на модель постачальника, конфігурацію каналу або
  runtime середовища
- Маршрути Codex родини OpenAI зберігають окремі межі плагінів:
  `openai-codex/*` належить плагіну OpenAI, тоді як вбудований плагін
  app-server Codex вибирається через `embeddedHarness.runtime: "codex"` або застарілі
  посилання на моделі `codex/*`

## Усунення проблем із хуками середовища виконання

Якщо плагін з’являється в `plugins list`, але побічні ефекти `register(api)` або хуки
не виконуються в трафіку живого чату, спочатку перевірте таке:

- Запустіть `openclaw gateway status --deep --require-rpc` і підтвердьте, що активні
  URL Gateway, профіль, шлях до конфігурації та процес — саме ті, які ви редагуєте.
- Перезапустіть активний Gateway після встановлення/зміни конфігурації/зміни коду плагіна. У контейнерах
  з обгортками PID 1 може бути лише супервізором; перезапустіть або надішліть сигнал дочірньому
  процесу `openclaw gateway run`.
- Використовуйте `openclaw plugins inspect <id> --json`, щоб підтвердити реєстрації хуків і
  діагностику. Для невбудованих розмовних хуків, таких як `llm_input`,
  `llm_output` і `agent_end`, потрібен
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання моделей надавайте перевагу `before_model_resolve`. Цей хук виконується до
  розв’язання моделі для ходів агента; `llm_output` виконується лише після того, як спроба
  моделі створить відповідь асистента.
- Щоб підтвердити фактичну модель сеансу, використовуйте `openclaw sessions` або
  поверхні сеансу/стану Gateway, а під час налагодження навантажень постачальника запускайте
  Gateway з `--raw-stream --raw-stream-path <path>`.

## Слоти плагінів (ексклюзивні категорії)

Деякі категорії є ексклюзивними (одночасно може бути активним лише один):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // або "none", щоб вимкнути
      contextEngine: "legacy", // або id плагіна
    },
  },
}
```

| Слот            | Що він контролює          | Типове значення     |
| --------------- | ------------------------- | ------------------- |
| `memory`        | Active Memory плагін      | `memory-core`       |
| `contextEngine` | Активний рушій контексту  | `legacy` (вбудований) |

## Довідник CLI

```bash
openclaw plugins list                       # компактний список
openclaw plugins list --enabled            # лише увімкнені плагіни
openclaw plugins list --verbose            # докладні рядки для кожного плагіна
openclaw plugins list --json               # машиночитаний список
openclaw plugins inspect <id>              # докладна інформація
openclaw plugins inspect <id> --json       # машиночитаний формат
openclaw plugins inspect --all             # таблиця для всіх
openclaw plugins info <id>                 # псевдонім для inspect
openclaw plugins doctor                    # діагностика
openclaw plugins registry                  # перевірка збереженого стану реєстру
openclaw plugins registry --refresh        # перебудувати збережений реєстр
openclaw doctor --fix                      # виправити стан міграції реєстру/журналу

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
openclaw plugins uninstall <id>          # видалити записи конфігурації та журналу встановлення
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Вбудовані плагіни постачаються разом з OpenClaw. Багато з них увімкнені за замовчуванням (наприклад,
вбудовані постачальники моделей, вбудовані постачальники мовлення та вбудований browser-
плагін). Інші вбудовані плагіни все ще потребують `openclaw plugins enable <id>`.

`--force` перезаписує наявний встановлений плагін або набір хуків на місці. Для
звичайних оновлень відстежуваних npm-плагінів використовуйте
`openclaw plugins update <id-or-npm-spec>`. Цей параметр не підтримується з `--link`, який повторно використовує вихідний шлях
замість копіювання в керовану ціль встановлення.

Коли `plugins.allow` уже встановлено, `openclaw plugins install` додає
ідентифікатор встановленого плагіна до цього списку дозволених перед його ввімкненням, тож встановлені плагіни
можна завантажувати одразу після перезапуску.

OpenClaw зберігає локальний реєстр плагінів як модель холодного читання для
інвентаризації плагінів, володіння внесками та планування запуску. Потоки встановлення, оновлення,
видалення, увімкнення та вимкнення оновлюють цей реєстр після зміни стану
плагіна. Якщо реєстр відсутній, застарів або некоректний, `openclaw plugins registry
--refresh` перебудовує його на основі довговічного журналу встановлень, політики конфігурації та
метаданих маніфесту/пакета без завантаження модулів середовища виконання плагіна.
Якщо на машині все ще є застарілі записи `plugins.installs` у конфігурації, виконайте
`openclaw doctor --fix`, щоб перемістити їх у керований
журнал `plugins/installs.json` і видалити копію з конфігурації.

`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних встановлень. Передавання
npm-специфікації пакета з dist-tag або точною версією розв’язує назву пакета
назад до запису відстежуваного плагіна та зберігає нову специфікацію для майбутніх оновлень.
Передавання назви пакета без версії переводить точно закріплене встановлення назад на
типову лінію релізів реєстру. Якщо встановлений npm-плагін уже відповідає
розв’язаній версії та збереженій ідентичності артефакту, OpenClaw пропускає оновлення
без завантаження, перевстановлення чи перезапису конфігурації.

`--pin` призначений лише для npm. Він не підтримується з `--marketplace`, оскільки
встановлення з marketplace зберігають метадані джерела marketplace замість npm-специфікації.

`--dangerously-force-unsafe-install` — це аварійне перевизначення для хибнопозитивних
спрацювань вбудованого сканера небезпечного коду. Воно дозволяє встановленням і оновленням плагінів
продовжуватися попри вбудовані результати `critical`, але все одно
не обходить блокування політики плагіна `before_install` або блокування через помилку сканування.

Цей прапорець CLI застосовується лише до потоків встановлення/оновлення плагінів. Встановлення залежностей Skills
через Gateway натомість використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install`
залишається окремим потоком завантаження/встановлення Skills з ClawHub.

Сумісні пакети беруть участь у тому самому потоці list/inspect/enable/disable
для плагінів. Поточна підтримка середовища виконання включає bundle Skills, Claude command-skills,
типові значення Claude `settings.json`, типові значення Claude `.lsp.json` і оголошених у маніфесті
`lspServers`, Cursor command-skills і сумісні каталоги хуків Codex.

`openclaw plugins inspect <id>` також повідомляє про виявлені можливості пакета, а також
підтримувані або непідтримувані записи серверів MCP і LSP для плагінів на основі пакетів.

Джерелами marketplace можуть бути відома назва Claude marketplace з
`~/.claude/plugins/known_marketplaces.json`, локальний корінь marketplace або шлях до
`marketplace.json`, скорочення GitHub на кшталт `owner/repo`, URL GitHub-репозиторію або URL git. Для віддалених marketplace
записи плагінів мають залишатися всередині клонованого репозиторію marketplace і використовувати лише
відносні шляхи як джерела.

Повні відомості див. у [довіднику CLI `openclaw plugins`](/uk/cli/plugins).

## Огляд API плагінів

Native-плагіни експортують об’єкт входу, який надає `register(api)`. Старіші
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

OpenClaw завантажує об’єкт входу та викликає `register(api)` під час
активації плагіна. Завантажувач усе ще повертається до `activate(api)` для старіших плагінів,
але вбудовані плагіни та нові external-плагіни мають розглядати `register` як
публічний контракт.

`api.registrationMode` повідомляє плагіну, чому завантажується його об’єкт входу:

| Режим           | Значення                                                                                                                         |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Активація середовища виконання. Реєструйте інструменти, хуки, служби, команди, маршрути та інші побічні ефекти в реальному часі. |
| `discovery`     | Виявлення можливостей лише для читання. Реєструйте постачальників і метадані; код входу довіреного плагіна може завантажуватися, але пропускайте побічні ефекти реального часу. |
| `setup-only`    | Завантаження метаданих налаштування каналу через полегшений об’єкт входу налаштування.                                           |
| `setup-runtime` | Завантаження налаштування каналу, яке також потребує об’єкта входу середовища виконання.                                         |
| `cli-metadata`  | Лише збирання метаданих команди CLI.                                                                                              |

Об’єкти входу плагінів, які відкривають сокети, бази даних, фонові воркери або довготривалі
клієнти, повинні захищати ці побічні ефекти умовою `api.registrationMode === "full"`.
Завантаження для виявлення кешуються окремо від завантажень активації та не замінюють
реєстр запущеного Gateway. Виявлення не активує, але й не є вільним від імпорту:
OpenClaw може обчислювати довірений об’єкт входу плагіна або модуль плагіна каналу, щоб побудувати
знімок. Тримайте верхні рівні модулів легкими та без побічних ефектів і переносьте
мережевих клієнтів, підпроцеси, слухачі, читання облікових даних і запуск служб
за шляхи повного середовища виконання.

Поширені методи реєстрації:

| Метод                                  | Що він реєструє            |
| -------------------------------------- | -------------------------- |
| `registerProvider`                     | Постачальник моделей (LLM) |
| `registerChannel`                      | Канал чату                 |
| `registerTool`                         | Інструмент агента          |
| `registerHook` / `on(...)`             | Хуки життєвого циклу       |
| `registerSpeechProvider`               | Перетворення тексту на мовлення / STT |
| `registerRealtimeTranscriptionProvider`| Потоковий STT              |
| `registerRealtimeVoiceProvider`        | Двоспрямований голос у реальному часі |
| `registerMediaUnderstandingProvider`   | Аналіз зображень/аудіо     |
| `registerImageGenerationProvider`      | Генерація зображень        |
| `registerMusicGenerationProvider`      | Генерація музики           |
| `registerVideoGenerationProvider`      | Генерація відео            |
| `registerWebFetchProvider`             | Постачальник веб-отримання / скрапінгу |
| `registerWebSearchProvider`            | Веб-пошук                  |
| `registerHttpRoute`                    | HTTP-ендпойнт              |
| `registerCommand` / `registerCli`      | Команди CLI                |
| `registerContextEngine`                | Рушій контексту            |
| `registerService`                      | Фонова служба              |

Поведінка захисту хуків для типізованих хуків життєвого циклу:

- `before_tool_call`: `{ block: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: `{ block: false }` нічого не робить і не скасовує попереднє блокування.
- `before_install`: `{ block: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `before_install`: `{ block: false }` нічого не робить і не скасовує попереднє блокування.
- `message_sending`: `{ cancel: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `message_sending`: `{ cancel: false }` нічого не робить і не скасовує попереднє скасування.

Native app-server Codex повертає події інструментів Codex-native назад у цю
поверхню хуків через міст. Плагіни можуть блокувати native-інструменти Codex через `before_tool_call`,
спостерігати за результатами через `after_tool_call` і брати участь у погодженнях
`PermissionRequest` Codex. Міст поки що не переписує аргументи
інструментів Codex-native. Точна межа підтримки середовища виконання Codex визначена в
[контракті підтримки Codex harness v1](/uk/plugins/codex-harness#v1-support-contract).

Повну інформацію про типізовану поведінку хуків див. в [огляді SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Building plugins](/uk/plugins/building-plugins) — створення власного плагіна
- [Plugin bundles](/uk/plugins/bundles) — сумісність пакетів Codex/Claude/Cursor
- [Plugin manifest](/uk/plugins/manifest) — схема маніфесту
- [Registering tools](/uk/plugins/building-plugins#registering-agent-tools) — додавання інструментів агента до плагіна
- [Plugin internals](/uk/plugins/architecture) — модель можливостей і конвеєр завантаження
- [Community plugins](/uk/plugins/community) — списки сторонніх плагінів
