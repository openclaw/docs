---
read_when:
    - Встановлення або налаштування плагінів
    - Розуміння правил виявлення та завантаження плагінів
    - Робота з сумісними з Codex/Claude наборами плагінів
sidebarTitle: Install and Configure
summary: Встановлюйте, налаштовуйте та керуйте плагінами OpenClaw
title: Плагіни
x-i18n:
    generated_at: "2026-04-24T14:42:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 947bb7ffc13280fd63f79bb68cb18a37c6614144b91a83afd38e5ac3c5187aed
    source_path: tools/plugin.md
    workflow: 15
---

Плагіни розширюють OpenClaw новими можливостями: канали, постачальники моделей,
каркаси агентів, інструменти, Skills, мовлення, транскрипція в реальному часі, голос у реальному
часі, розуміння медіа, генерація зображень, генерація відео, отримання даних з вебу, вебпошук
та інше. Деякі плагіни є **core** (постачаються з OpenClaw), інші —
**external** (опубліковані в npm спільнотою).

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

Якщо ви надаєте перевагу керуванню безпосередньо в чаті, увімкніть `commands.plugins: true` і використовуйте:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Шлях встановлення використовує той самий механізм визначення, що й CLI: локальний
шлях/архів, явний `clawhub:<pkg>` або специфікація пакета без префікса (спочатку ClawHub, потім резервний варіант через npm).

Якщо конфігурація невалідна, встановлення зазвичай завершується безпечним блокуванням і
вказує вам на `openclaw doctor --fix`. Єдиний виняток для відновлення — вузький шлях перевстановлення вбудованого плагіна
для плагінів, які явно підтримують
`openclaw.install.allowInvalidConfigRecovery`.

Пакетні встановлення OpenClaw не виконують завчасне встановлення всього дерева
залежностей часу виконання кожного вбудованого плагіна. Коли вбудований плагін OpenClaw активний через
конфігурацію плагінів, застарілу конфігурацію каналу або маніфест із увімкненням за замовчуванням,
відновлення під час запуску виправляє лише оголошені залежності часу виконання цього плагіна перед його імпортом.
External-плагіни та власні шляхи завантаження, як і раніше, потрібно встановлювати через
`openclaw plugins install`.

## Типи плагінів

OpenClaw розпізнає два формати плагінів:

| Формат     | Як це працює                                                     | Приклади                                               |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + модуль часу виконання; виконується в процесі | Офіційні плагіни, пакети npm від спільноти             |
| **Bundle** | Сумісне з Codex/Claude/Cursor компонування; зіставляється з можливостями OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва відображаються в `openclaw plugins list`. Докладніше про bundles див. у [Набори плагінів](/uk/plugins/bundles).

Якщо ви пишете native-плагін, почніть із [Створення плагінів](/uk/plugins/building-plugins)
і [Огляду Plugin SDK](/uk/plugins/sdk-overview).

## Офіційні плагіни

### Доступні для встановлення (npm)

| Плагін          | Пакет                 | Документація                         |
| --------------- | --------------------- | ----------------------------------- |
| Matrix          | `@openclaw/matrix`     | [Matrix](/uk/channels/matrix)          |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/uk/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/uk/channels/nostr)            |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/uk/plugins/voice-call)   |
| Zalo            | `@openclaw/zalo`       | [Zalo](/uk/channels/zalo)              |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/uk/plugins/zalouser)  |

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
    - `memory-core` — вбудований пошук у пам’яті (за замовчуванням через `plugins.slots.memory`)
    - `memory-lancedb` — довготривала пам’ять із встановленням за потреби та автоматичним згадуванням/захопленням (установіть `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Постачальники мовлення (увімкнені за замовчуванням)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` — вбудований браузерний Plugin для browser tool, CLI `openclaw browser`, методу Gateway `browser.request`, browser runtime та служби керування браузером за замовчуванням (увімкнений за замовчуванням; вимкніть його перед заміною)
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
| `enabled`        | Головний перемикач (за замовчуванням: `true`)             |
| `allow`          | Список дозволених плагінів (необов’язково)                |
| `deny`           | Список заборонених плагінів (необов’язково; заборона має пріоритет) |
| `load.paths`     | Додаткові файли/каталоги плагінів                         |
| `slots`          | Селектори ексклюзивних слотів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>` | Перемикачі та конфігурація для окремого плагіна           |

Зміни конфігурації **потребують перезапуску gateway**. Якщо Gateway працює з
відстеженням конфігурації та увімкненим перезапуском у процесі (типовий шлях `openclaw gateway`),
такий перезапуск зазвичай виконується автоматично невдовзі після запису конфігурації.
Підтримуваного шляху гарячого перезавантаження для native runtime-коду плагінів або lifecycle hooks немає;
перезапустіть процес Gateway, який обслуговує активний канал, перш ніж
очікувати, що оновлений код `register(api)`, хуки `api.on(...)`, інструменти, сервіси або
хуки постачальника/runtime почнуть виконуватися.

`openclaw plugins list` — це локальний знімок CLI/конфігурації. Плагін зі станом `loaded`
там означає, що плагін можна виявити та завантажити з конфігурації/файлів, видимих для цього
запуску CLI. Це не доводить, що вже запущений віддалений дочірній процес Gateway
було перезапущено в той самий код плагіна. У конфігураціях VPS/контейнерів з процесами-обгортками
надсилайте перезапуск фактичному процесу `openclaw gateway run` або використовуйте
`openclaw gateway restart` щодо запущеного Gateway.

<Accordion title="Стани плагіна: вимкнений, відсутній, невалідний">
  - **Вимкнений**: плагін існує, але правила ввімкнення його вимкнули. Конфігурація зберігається.
  - **Відсутній**: конфігурація посилається на ідентифікатор плагіна, який виявлення не знайшло.
  - **Невалідний**: плагін існує, але його конфігурація не відповідає оголошеній схемі.
</Accordion>

## Виявлення та пріоритет

OpenClaw сканує плагіни в такому порядку (перше збігле входження має пріоритет):

<Steps>
  <Step title="Шляхи конфігурації">
    `plugins.load.paths` — явні шляхи до файлу або каталогу.
  </Step>

  <Step title="Плагіни робочого простору">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` і `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Глобальні плагіни">
    `~/.openclaw/<plugin-root>/*.ts` і `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Вбудовані плагіни">
    Постачаються з OpenClaw. Багато з них увімкнені за замовчуванням (постачальники моделей, мовлення).
    Інші потребують явного ввімкнення.
  </Step>
</Steps>

### Правила ввімкнення

- `plugins.enabled: false` вимикає всі плагіни
- `plugins.deny` завжди має пріоритет над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей плагін
- Плагіни з походженням із робочого простору **вимкнені за замовчуванням** (їх потрібно явно ввімкнути)
- Вбудовані плагіни дотримуються вбудованого набору значень за замовчуванням, якщо це не перевизначено
- Ексклюзивні слоти можуть примусово ввімкнути вибраний плагін для цього слота
- Деякі вбудовані opt-in-плагіни вмикаються автоматично, коли конфігурація вказує
  поверхню, що належить плагіну, наприклад посилання на модель постачальника, конфігурацію каналу або
  runtime каркаса
- Маршрути Codex сімейства OpenAI зберігають окремі межі плагінів:
  `openai-codex/*` належить плагіну OpenAI, тоді як вбудований плагін
  app-server Codex вибирається через `embeddedHarness.runtime: "codex"` або застарілі
  посилання на моделі `codex/*`

## Усунення проблем із runtime hooks

Якщо плагін з’являється в `plugins list`, але побічні ефекти `register(api)` або hooks
не виконуються в реальному трафіку чату, спочатку перевірте таке:

- Виконайте `openclaw gateway status --deep --require-rpc` і підтвердьте, що активні
  URL Gateway, профіль, шлях конфігурації та процес — саме ті, які ви редагуєте.
- Перезапустіть активний Gateway після змін встановлення/конфігурації/коду плагіна. У контейнерах
  з обгортками PID 1 може бути лише супервізором; перезапустіть або надішліть сигнал дочірньому
  процесу `openclaw gateway run`.
- Використовуйте `openclaw plugins inspect <id> --json`, щоб підтвердити реєстрації hooks і
  діагностику. Для не вбудованих хуків розмови, таких як `llm_input`,
  `llm_output` і `agent_end`, потрібне
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання моделей надавайте перевагу `before_model_resolve`. Він виконується до
  визначення моделі для ходів агента; `llm_output` виконується лише після того, як спроба моделі
  сформує відповідь помічника.
- Щоб підтвердити ефективну модель сесії, використовуйте `openclaw sessions` або
  поверхні сесії/стану Gateway, а під час налагодження payload-даних постачальника запускайте
  Gateway з `--raw-stream --raw-stream-path <path>`.

## Слоти плагінів (ексклюзивні категорії)

Деякі категорії є ексклюзивними (одночасно активним може бути лише один плагін):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // або "none" для вимкнення
      contextEngine: "legacy", // або ідентифікатор плагіна
    },
  },
}
```

| Слот            | Що він контролює      | Значення за замовчуванням |
| --------------- | --------------------- | ------------------------- |
| `memory`        | Active Memory плагін  | `memory-core`             |
| `contextEngine` | Активний рушій контексту | `legacy` (вбудований)  |

## Довідка CLI

```bash
openclaw plugins list                       # компактний перелік
openclaw plugins list --enabled            # лише завантажені плагіни
openclaw plugins list --verbose            # докладні рядки для кожного плагіна
openclaw plugins list --json               # машиночитаний перелік
openclaw plugins inspect <id>              # докладна інформація
openclaw plugins inspect <id> --json       # машиночитаний формат
openclaw plugins inspect --all             # таблиця для всього набору
openclaw plugins info <id>                 # псевдонім inspect
openclaw plugins doctor                    # діагностика

openclaw plugins install <package>         # встановлення (спочатку ClawHub, потім npm)
openclaw plugins install clawhub:<pkg>     # встановлення лише з ClawHub
openclaw plugins install <spec> --force    # перезаписати наявне встановлення
openclaw plugins install <path>            # встановлення з локального шляху
openclaw plugins install -l <path>         # підключення (без копіювання) для розробки
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # зафіксувати точну визначену специфікацію npm
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

Вбудовані плагіни постачаються разом з OpenClaw. Багато з них увімкнені за замовчуванням (наприклад,
вбудовані постачальники моделей, вбудовані постачальники мовлення та вбудований browser
Plugin). Інші вбудовані плагіни, як і раніше, потребують `openclaw plugins enable <id>`.

`--force` перезаписує наявний встановлений плагін або набір hook-пакетів на місці. Використовуйте
`openclaw plugins update <id-or-npm-spec>` для звичайних оновлень відстежуваних npm
плагінів. Він не підтримується разом із `--link`, який повторно використовує вихідний шлях
замість копіювання в керовану ціль встановлення.

Коли `plugins.allow` уже задано, `openclaw plugins install` додає
ідентифікатор встановленого плагіна до цього списку дозволених перед його ввімкненням, тому встановлені плагіни
можна одразу завантажувати після перезапуску.

`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних встановлень. Передавання
специфікації npm-пакета з dist-tag або точною версією зіставляє назву пакета
назад із записом відстежуваного плагіна та зберігає нову специфікацію для майбутніх оновлень.
Передавання назви пакета без версії переводить точно зафіксоване встановлення назад на
типову лінійку релізів реєстру. Якщо встановлений npm-плагін уже відповідає
визначеній версії та збереженій ідентичності артефакту, OpenClaw пропускає оновлення
без завантаження, перевстановлення або переписування конфігурації.

`--pin` доступний лише для npm. Він не підтримується з `--marketplace`, оскільки
встановлення з marketplace зберігають метадані джерела marketplace замість специфікації npm.

`--dangerously-force-unsafe-install` — це аварійний обхідний параметр для хибних
спрацьовувань вбудованого сканера небезпечного коду. Він дозволяє встановленням і оновленням плагінів
продовжуватися попри вбудовані критичні знахідки `critical`, але все одно
не обходить блокування політики плагіна `before_install` або блокування через помилки сканування.

Цей прапорець CLI застосовується лише до потоків встановлення/оновлення плагінів. Установлення залежностей Skills
через Gateway натомість використовують відповідний параметр запиту `dangerouslyForceUnsafeInstall`,
тоді як `openclaw skills install` залишається окремим потоком завантаження/встановлення Skills через ClawHub.

Сумісні bundles беруть участь у тому самому потоці list/inspect/enable/disable
плагінів. Поточна підтримка runtime включає bundle Skills, command-Skills для Claude,
типові значення Claude `settings.json`, типові значення Claude `.lsp.json` і
`lspServers`, оголошені в маніфесті, command-Skills для Cursor і сумісні каталоги hook-ів Codex.

`openclaw plugins inspect <id>` також повідомляє про виявлені можливості bundle, а також
підтримувані або непідтримувані записи серверів MCP і LSP для плагінів на основі bundles.

Джерелами marketplace можуть бути відома для Claude назва marketplace з
`~/.claude/plugins/known_marketplaces.json`, локальний корінь marketplace або шлях до
`marketplace.json`, скорочений запис GitHub на кшталт `owner/repo`, URL репозиторію GitHub
або URL git. Для віддалених marketplace записи плагінів мають залишатися всередині
клонованого репозиторію marketplace та використовувати лише відносні шляхи джерел.

Повні відомості див. у [довідці CLI `openclaw plugins`](/uk/cli/plugins).

## Огляд API плагінів

Native-плагіни експортують об’єкт entry, який надає `register(api)`. Старіші
плагіни все ще можуть використовувати `activate(api)` як застарілий псевдонім, але новим плагінам слід
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

OpenClaw завантажує об’єкт entry і викликає `register(api)` під час
активації плагіна. Завантажувач усе ще використовує резервний перехід до `activate(api)` для старіших плагінів,
але вбудовані плагіни та нові external-плагіни мають вважати `register`
публічним контрактом.

Поширені методи реєстрації:

| Метод                                  | Що він реєструє                |
| --------------------------------------- | ------------------------------ |
| `registerProvider`                      | Постачальник моделей (LLM)     |
| `registerChannel`                       | Канал чату                     |
| `registerTool`                          | Інструмент агента              |
| `registerHook` / `on(...)`              | Lifecycle hooks                |
| `registerSpeechProvider`                | Text-to-speech / STT           |
| `registerRealtimeTranscriptionProvider` | Потокове STT                   |
| `registerRealtimeVoiceProvider`         | Двобічний голос у реальному часі |
| `registerMediaUnderstandingProvider`    | Аналіз зображень/аудіо         |
| `registerImageGenerationProvider`       | Генерація зображень            |
| `registerMusicGenerationProvider`       | Генерація музики               |
| `registerVideoGenerationProvider`       | Генерація відео                |
| `registerWebFetchProvider`              | Постачальник web fetch / scrape |
| `registerWebSearchProvider`             | Вебпошук                       |
| `registerHttpRoute`                     | HTTP endpoint                  |
| `registerCommand` / `registerCli`       | Команди CLI                    |
| `registerContextEngine`                 | Рушій контексту                |
| `registerService`                       | Фонова служба                  |

Поведінка guard-умов hook-ів для типізованих lifecycle hooks:

- `before_tool_call`: `{ block: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: `{ block: false }` не виконує жодної дії і не скасовує попереднє блокування.
- `before_install`: `{ block: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `before_install`: `{ block: false }` не виконує жодної дії і не скасовує попереднє блокування.
- `message_sending`: `{ cancel: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `message_sending`: `{ cancel: false }` не виконує жодної дії і не скасовує попереднє попереднє скасування.

Повну інформацію про поведінку типізованих hook-ів див. в [огляді SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Створення плагінів](/uk/plugins/building-plugins) — створіть власний плагін
- [Набори плагінів](/uk/plugins/bundles) — сумісність bundles Codex/Claude/Cursor
- [Маніфест плагіна](/uk/plugins/manifest) — схема маніфесту
- [Реєстрація інструментів](/uk/plugins/building-plugins#registering-agent-tools) — додавання інструментів агента в плагіні
- [Внутрішня будова плагінів](/uk/plugins/architecture) — модель можливостей і конвеєр завантаження
- [Плагіни спільноти](/uk/plugins/community) — сторонні переліки
