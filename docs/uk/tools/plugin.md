---
read_when:
    - Встановлення або налаштування плагінів
    - Розуміння виявлення плагінів і правил завантаження
    - Робота з сумісними з Codex/Claude наборами плагінів
sidebarTitle: Install and Configure
summary: Встановлюйте, налаштовуйте та керуйте плагінами OpenClaw
title: Плагіни
x-i18n:
    generated_at: "2026-04-23T13:33:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 63aa1b5ed9e3aaa2117b78137a457582b00ea47d94af7da3780ddae38e8e3665
    source_path: tools/plugin.md
    workflow: 15
---

# Плагіни

Плагіни розширюють OpenClaw новими можливостями: канали, провайдери моделей,
інструменти, Skills, мовлення, транскрипція в реальному часі, голос у реальному часі,
розуміння медіа, генерація зображень, генерація відео, отримання даних із вебу, вебпошук
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

Якщо ви надаєте перевагу керуванню безпосередньо з чату, увімкніть `commands.plugins: true` і використовуйте:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Шлях установлення використовує той самий механізм визначення, що й CLI: локальний
шлях/архів, явний `clawhub:<pkg>` або специфікація пакета без префікса
(спочатку ClawHub, потім резервний перехід на npm).

Якщо конфігурація некоректна, установлення зазвичай безпечно завершується з відмовою і вказує вам на
`openclaw doctor --fix`. Єдиний виняток для відновлення — вузький шлях перевстановлення вбудованого плагіна
для плагінів, які підтримують
`openclaw.install.allowInvalidConfigRecovery`.

Упаковані встановлення OpenClaw не встановлюють завчасно все дерево залежностей
runtime кожного вбудованого плагіна. Коли вбудований плагін, що належить OpenClaw, активний через
конфігурацію плагіна, застарілу конфігурацію каналу або маніфест із увімкненням за замовчуванням,
під час запуску відновлюються лише оголошені runtime-залежності цього плагіна перед його імпортом.
External-плагіни та власні шляхи завантаження, як і раніше, потрібно встановлювати через
`openclaw plugins install`.

## Типи плагінів

OpenClaw розпізнає два формати плагінів:

| Формат     | Як це працює                                                    | Приклади                                               |
| ---------- | --------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + runtime-модуль; виконується в процесі  | Офіційні плагіни, пакети npm від спільноти             |
| **Bundle** | Сумісне компонування Codex/Claude/Cursor; зіставляється з можливостями OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва відображаються в `openclaw plugins list`. Докладніше про набори див. у [Набори плагінів](/uk/plugins/bundles).

Якщо ви пишете native-плагін, почніть із [Створення плагінів](/uk/plugins/building-plugins)
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

### Core (постачаються з OpenClaw)

<AccordionGroup>
  <Accordion title="Провайдери моделей (увімкнено за замовчуванням)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Плагіни пам’яті">
    - `memory-core` — вбудований пошук у пам’яті (типово через `plugins.slots.memory`)
    - `memory-lancedb` — довготривала пам’ять з установленням за потреби з автоматичним пригадуванням/захопленням (установіть `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Провайдери мовлення (увімкнено за замовчуванням)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` — вбудований browser-плагін для browser-інструмента, CLI `openclaw browser`, методу Gateway `browser.request`, browser-runtime та служби керування browser за замовчуванням (увімкнено за замовчуванням; вимкніть перед його заміною)
    - `copilot-proxy` — міст VS Code Copilot Proxy (вимкнено за замовчуванням)
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

Зміни конфігурації **потребують перезапуску Gateway**. Якщо Gateway запущено з
відстеженням конфігурації та внутрішньопроцесним перезапуском (типовий шлях `openclaw gateway`),
цей перезапуск зазвичай виконується автоматично невдовзі після запису конфігурації.

<Accordion title="Стани плагінів: вимкнений, відсутній, недійсний">
  - **Вимкнений**: плагін існує, але правила ввімкнення його вимкнули. Конфігурація зберігається.
  - **Відсутній**: конфігурація посилається на ідентифікатор плагіна, який не було знайдено під час виявлення.
  - **Недійсний**: плагін існує, але його конфігурація не відповідає оголошеній схемі.
</Accordion>

## Виявлення та пріоритет

OpenClaw сканує плагіни в такому порядку (перше знайдене збіг має пріоритет):

<Steps>
  <Step title="Шляхи з конфігурації">
    `plugins.load.paths` — явні шляхи до файлу або каталогу.
  </Step>

  <Step title="Плагіни робочого простору">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` і `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Глобальні плагіни">
    `~/.openclaw/<plugin-root>/*.ts` і `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Вбудовані плагіни">
    Постачаються з OpenClaw. Багато з них увімкнено за замовчуванням (провайдери моделей, мовлення).
    Інші потребують явного ввімкнення.
  </Step>
</Steps>

### Правила ввімкнення

- `plugins.enabled: false` вимикає всі плагіни
- `plugins.deny` завжди має пріоритет над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей плагін
- Плагіни з робочого простору **типово вимкнені** (їх потрібно явно ввімкнути)
- Вбудовані плагіни дотримуються вбудованого набору, увімкненого за замовчуванням, якщо це не перевизначено
- Ексклюзивні слоти можуть примусово ввімкнути вибраний плагін для цього слота

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

| Слот            | Що він керує          | Типове значення     |
| --------------- | --------------------- | ------------------- |
| `memory`        | Active Memory plugin  | `memory-core`       |
| `contextEngine` | Активний рушій контексту | `legacy` (вбудований) |

## Довідка CLI

```bash
openclaw plugins list                       # компактний перелік
openclaw plugins list --enabled            # лише завантажені плагіни
openclaw plugins list --verbose            # рядки з подробицями для кожного плагіна
openclaw plugins list --json               # машиночитаний перелік
openclaw plugins inspect <id>              # докладна інформація
openclaw plugins inspect <id> --json       # машиночитаний формат
openclaw plugins inspect --all             # таблиця для всього набору
openclaw plugins info <id>                 # псевдонім inspect
openclaw plugins doctor                    # діагностика

openclaw plugins install <package>         # установити (спочатку ClawHub, потім npm)
openclaw plugins install clawhub:<pkg>     # установити лише з ClawHub
openclaw plugins install <spec> --force    # перезаписати наявне встановлення
openclaw plugins install <path>            # установити з локального шляху
openclaw plugins install -l <path>         # підключити (без копіювання) для розробки
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # записати точну визначену специфікацію npm
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

Вбудовані плагіни постачаються з OpenClaw. Багато з них увімкнено за замовчуванням (наприклад,
вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований browser-
плагін). Інші вбудовані плагіни все одно потребують `openclaw plugins enable <id>`.

`--force` перезаписує наявний встановлений плагін або набір хуків на місці. Використовуйте
`openclaw plugins update <id-or-npm-spec>` для звичайних оновлень відстежуваних npm-
плагінів. Він не підтримується разом із `--link`, який повторно використовує вихідний шлях
замість копіювання в кероване місце встановлення.

Коли `plugins.allow` уже задано, `openclaw plugins install` додає
ідентифікатор встановленого плагіна до цього списку allow перед його ввімкненням, щоб установлені плагіни
можна було одразу завантажити після перезапуску.

`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних встановлень. Передавання
специфікації npm-пакета з dist-tag або точною версією зіставляє ім’я пакета
назад із записом відстежуваного плагіна та записує нову специфікацію для майбутніх оновлень.
Передавання імені пакета без версії переводить точно зафіксоване встановлення назад на
типову лінію випусків реєстру. Якщо встановлений npm-плагін уже відповідає
визначеній версії та записаній ідентичності артефакту, OpenClaw пропускає оновлення
без завантаження, перевстановлення або перезапису конфігурації.

`--pin` працює лише для npm. Він не підтримується з `--marketplace`, оскільки
встановлення з marketplace зберігають метадані джерела marketplace замість специфікації npm.

`--dangerously-force-unsafe-install` — це аварійне перевизначення для хибнопозитивних
спрацювань вбудованого сканера небезпечного коду. Воно дозволяє продовжити встановлення
та оновлення плагінів попри вбудовані результати рівня `critical`, але все одно
не обходить блокування політики плагіна `before_install` або блокування через збій сканування.

Цей прапорець CLI застосовується лише до потоків встановлення/оновлення плагінів. Установлення
залежностей Skills через Gateway використовують натомість відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком
завантаження/встановлення Skills із ClawHub.

Сумісні набори беруть участь у тих самих потоках list/inspect/enable/disable
для плагінів. Поточна підтримка runtime включає bundle Skills, Claude command-skills,
значення за замовчуванням Claude `settings.json`, значення за замовчуванням Claude `.lsp.json` і оголошені в маніфесті
`lspServers`, Cursor command-skills і сумісні каталоги хуків Codex.

`openclaw plugins inspect <id>` також повідомляє про виявлені можливості набору, а також
підтримувані або непідтримувані записи серверів MCP і LSP для плагінів на основі наборів.

Джерелами marketplace можуть бути відома назва marketplace Claude з
`~/.claude/plugins/known_marketplaces.json`, локальний корінь marketplace або
шлях до `marketplace.json`, скорочений запис GitHub на кшталт `owner/repo`, URL репозиторію GitHub
або git URL. Для віддалених marketplace записи плагінів мають залишатися в межах
клонованого репозиторію marketplace і використовувати лише відносні джерела шляхів.

Повні відомості див. у [довідці CLI `openclaw plugins`](/uk/cli/plugins).

## Огляд API плагінів

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

OpenClaw завантажує об’єкт entry і викликає `register(api)` під час
активації плагіна. Для старіших плагінів завантажувач усе ще використовує резервний перехід на `activate(api)`,
але вбудовані плагіни та нові external-плагіни мають розглядати `register` як
публічний контракт.

Поширені методи реєстрації:

| Метод                                   | Що він реєструє            |
| --------------------------------------- | -------------------------- |
| `registerProvider`                      | Провайдер моделі (LLM)     |
| `registerChannel`                       | Канал чату                 |
| `registerTool`                          | Інструмент агента          |
| `registerHook` / `on(...)`              | Хуки життєвого циклу       |
| `registerSpeechProvider`                | Синтез мовлення / STT      |
| `registerRealtimeTranscriptionProvider` | Потоковий STT              |
| `registerRealtimeVoiceProvider`         | Двобічний голос у реальному часі |
| `registerMediaUnderstandingProvider`    | Аналіз зображень/аудіо     |
| `registerImageGenerationProvider`       | Генерація зображень        |
| `registerMusicGenerationProvider`       | Генерація музики           |
| `registerVideoGenerationProvider`       | Генерація відео            |
| `registerWebFetchProvider`              | Провайдер отримання / збирання даних із вебу |
| `registerWebSearchProvider`             | Вебпошук                   |
| `registerHttpRoute`                     | HTTP-ендпоінт              |
| `registerCommand` / `registerCli`       | Команди CLI                |
| `registerContextEngine`                 | Рушій контексту            |
| `registerService`                       | Фонова служба              |

Поведінка guard-хуків для типізованих хуків життєвого циклу:

- `before_tool_call`: `{ block: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: `{ block: false }` нічого не змінює і не скасовує попереднє блокування.
- `before_install`: `{ block: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `before_install`: `{ block: false }` нічого не змінює і не скасовує попереднє блокування.
- `message_sending`: `{ cancel: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `message_sending`: `{ cancel: false }` нічого не змінює і не скасовує попереднє скасування.

Повну інформацію про поведінку типізованих хуків див. в [огляді SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язані матеріали

- [Створення плагінів](/uk/plugins/building-plugins) — створіть власний плагін
- [Набори плагінів](/uk/plugins/bundles) — сумісність наборів Codex/Claude/Cursor
- [Маніфест Plugin](/uk/plugins/manifest) — схема маніфесту
- [Реєстрація інструментів](/uk/plugins/building-plugins#registering-agent-tools) — додавання інструментів агента в плагін
- [Внутрішня будова Plugin](/uk/plugins/architecture) — модель можливостей і конвеєр завантаження
- [Плагіни спільноти](/uk/plugins/community) — сторонні добірки
