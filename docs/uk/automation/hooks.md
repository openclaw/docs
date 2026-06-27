---
read_when:
    - Вам потрібна автоматизація на основі подій для /new, /reset, /stop і подій життєвого циклу агента
    - Ви хочете створювати, встановлювати або налагоджувати хуки
summary: 'Хуки: автоматизація на основі подій для команд і подій життєвого циклу'
title: Хуки
x-i18n:
    generated_at: "2026-06-27T17:08:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0259739b0547ba4826b540d392c6d6b72c6bec24fd50d5e297817694fd728438
    source_path: automation/hooks.md
    workflow: 16
---

Хуки — це невеликі скрипти, які запускаються, коли щось відбувається всередині Gateway. Їх можна виявляти з каталогів і переглядати за допомогою `openclaw hooks`. Gateway завантажує внутрішні хуки лише після того, як ви ввімкнете хуки або налаштуєте принаймні один запис хука, пакет хуків, застарілий обробник чи додатковий каталог хуків.

В OpenClaw є два типи хуків:

- **Внутрішні хуки** (ця сторінка): запускаються всередині Gateway, коли спрацьовують події агента, як-от `/new`, `/reset`, `/stop` або події життєвого циклу.
- **Webhook-и**: зовнішні HTTP-кінцеві точки, які дають іншим системам змогу запускати роботу в OpenClaw. Див. [Webhook-и](/uk/automation/cron-jobs#webhooks).

Хуки також можуть постачатися всередині плагінів. `openclaw hooks list` показує як окремі хуки, так і хуки, керовані плагінами.

## Виберіть правильну поверхню

OpenClaw має кілька поверхонь розширення, які виглядають схожими, але розв’язують різні задачі:

| Якщо ви хочете...                                                                                                     | Використовуйте...                                | Чому                                                                                           |
| --------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------- |
| Зберегти знімок на `/new`, журналювати `/reset`, викликати зовнішній API після `message:sent` або додати грубу операторську автоматизацію | Внутрішні хуки (`HOOK.md`, ця сторінка) | Файлові хуки призначені для побічних ефектів, керованих оператором, і автоматизації команд/життєвого циклу |
| Переписувати промпти, блокувати інструменти, скасовувати вихідні повідомлення або додавати впорядковане проміжне ПЗ/політику                              | Типізовані хуки плагінів через `api.on(...)`  | Типізовані хуки мають явні контракти, пріоритети, правила злиття та семантику блокування/скасування      |
| Додати лише експорт телеметрії або спостережуваність                                                                            | Діагностичні події                     | Спостережуваність — це окрема шина подій, а не поверхня політичних хуків                              |

Використовуйте внутрішні хуки, коли вам потрібна автоматизація, що поводиться як невелика встановлена інтеграція. Використовуйте типізовані хуки плагінів, коли вам потрібен контроль життєвого циклу під час виконання.

## Швидкий старт

```bash
# List available hooks
openclaw hooks list

# Enable a hook
openclaw hooks enable session-memory

# Check hook status
openclaw hooks check

# Get detailed information
openclaw hooks info session-memory
```

## Типи подій

| Подія                    | Коли спрацьовує                                              |
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | Видано команду `/new`                                      |
| `command:reset`          | Видано команду `/reset`                                    |
| `command:stop`           | Видано команду `/stop`                                     |
| `command`                | Будь-яка подія команди (загальний слухач)                       |
| `session:compact:before` | Перед тим як Compaction підсумує історію                       |
| `session:compact:after`  | Після завершення Compaction                                 |
| `session:patch`          | Коли змінено властивості сесії                       |
| `agent:bootstrap`        | Перед ін’єкцією файлів початкового налаштування робочого простору              |
| `gateway:startup`        | Після запуску каналів і завантаження хуків                  |
| `gateway:shutdown`       | Коли починається завершення роботи gateway                               |
| `gateway:pre-restart`    | Перед очікуваним перезапуском gateway                         |
| `message:received`       | Вхідне повідомлення з будь-якого каналу                           |
| `message:transcribed`    | Після завершення транскрибування аудіо                        |
| `message:preprocessed`   | Після завершення або пропуску попередньої обробки медіа й посилань |
| `message:sent`           | Доставлено вихідне повідомлення                                 |

## Написання хуків

### Структура хука

Кожен хук — це каталог із двома файлами:

```
my-hook/
├── HOOK.md          # Metadata + documentation
└── handler.ts       # Handler implementation
```

### Формат HOOK.md

```markdown
---
name: my-hook
description: "Short description of what this hook does"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

Detailed documentation goes here.
```

**Поля метаданих** (`metadata.openclaw`):

| Поле      | Опис                                          |
| ---------- | ---------------------------------------------------- |
| `emoji`    | Емодзі для відображення в CLI                                |
| `events`   | Масив подій для прослуховування                        |
| `export`   | Іменований експорт для використання (типово `"default"`)        |
| `os`       | Потрібні платформи (наприклад, `["darwin", "linux"]`)     |
| `requires` | Потрібні шляхи `bins`, `anyBins`, `env` або `config` |
| `always`   | Обійти перевірки придатності (булеве значення)                  |
| `install`  | Методи встановлення                                 |

### Реалізація обробника

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // Your logic here

  // Optionally send a reply on replyable surfaces
  event.messages.push("Hook executed!");
};

export default handler;
```

Кожна подія містить: `type`, `action`, `sessionKey`, `timestamp`, `messages` (додавайте відповіді сюди лише на поверхнях, що підтримують відповідь) і `context` (дані, специфічні для події). Контексти хуків агента й інструментальних плагінів також можуть містити `trace` — діагностичний контекст трасування лише для читання, сумісний із W3C, який плагіни можуть передавати в структуровані журнали для кореляції OTEL.

`event.messages` автоматично доставляється лише на поверхнях, що підтримують відповідь, як-от
`command:*` і `message:received`. Події лише життєвого циклу, як-от
`agent:bootstrap`, `session:*`, `gateway:*` або `message:sent`, не мають
каналу відповіді й ігнорують додані повідомлення.

### Основне про контекст подій

**Події команд** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Події повідомлень** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (дані, специфічні для провайдера, включно з `senderId`, `senderName`, `guildId`). `context.content` віддає перевагу непорожньому тілу команди для повідомлень, схожих на команди, потім повертається до сирого вхідного тіла та загального тіла; він не містить збагачення лише для агента, як-от історія треду чи підсумки посилань.

**Події повідомлень** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Події повідомлень** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Події повідомлень** (`message:preprocessed`): `context.bodyForAgent` (остаточне збагачене тіло), `context.from`, `context.channelId`.

**Події початкового налаштування** (`agent:bootstrap`): `context.bootstrapFiles` (змінний масив), `context.agentId`.

**Події латання сесії** (`session:patch`): `context.sessionEntry`, `context.patch` (лише змінені поля), `context.cfg`. Лише привілейовані клієнти можуть запускати події латання.

**Події Compaction**: `session:compact:before` містить `messageCount`, `tokenCount`. `session:compact:after` додає `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` спостерігає, як користувач видає `/stop`; це життєвий цикл скасування/команди,
а не шлюз фіналізації агента. Плагіни, яким потрібно перевірити
природну фінальну відповідь і попросити агента виконати ще один прохід, мають використовувати типізований
хук плагіна `before_agent_finalize` натомість. Див. [хуки Plugin](/uk/plugins/hooks).

**Події життєвого циклу Gateway**: `gateway:shutdown` містить `reason` і `restartExpectedMs` та спрацьовує, коли починається завершення роботи gateway. `gateway:pre-restart` містить той самий контекст, але спрацьовує лише тоді, коли завершення роботи є частиною очікуваного перезапуску й надано скінченне значення `restartExpectedMs`. Під час завершення роботи очікування кожного хука життєвого циклу виконується за принципом найкращого зусилля та має межу, щоб завершення роботи продовжувалося, якщо обробник зависне. Типовий бюджет очікування становить 5 секунд для `gateway:shutdown` і 10 секунд для `gateway:pre-restart`.

Використовуйте `gateway:pre-restart` для коротких сповіщень про перезапуск, поки канали ще доступні:

```typescript
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export default async function handler(event) {
  if (event.type !== "gateway" || event.action !== "pre-restart") {
    return;
  }

  const restartInSeconds = Math.ceil(event.context.restartExpectedMs / 1000);
  await execFileAsync("openclaw", [
    "system",
    "event",
    "--mode",
    "now",
    "--text",
    `Gateway restarting in ~${restartInSeconds}s (${event.context.reason}). Checkpoint now.`,
  ]);
}
```

Між подією `gateway:shutdown` (або `gateway:pre-restart`) і рештою послідовності завершення роботи gateway також запускає типізований хук плагіна `session_end` для кожної сесії, яка ще була активною, коли процес зупинився. Значення `reason` цієї події — `shutdown` для звичайної зупинки SIGTERM/SIGINT і `restart`, коли закриття було заплановано як частину очікуваного перезапуску. Це осушення має межу, щоб повільний обробник `session_end` не міг заблокувати вихід процесу, а сесії, які вже були фіналізовані через replace / reset / delete / compaction, пропускаються, щоб уникнути подвійного спрацювання.

## Виявлення хуків

Хуки виявляються з цих каталогів у порядку зростання пріоритету перевизначення:

1. **Вбудовані хуки**: постачаються з OpenClaw
2. **Хуки плагінів**: хуки, що постачаються всередині встановлених плагінів
3. **Керовані хуки**: `~/.openclaw/hooks/` (встановлені користувачем, спільні між робочими просторами). Додаткові каталоги з `hooks.internal.load.extraDirs` мають такий самий пріоритет.
4. **Хуки робочого простору**: `<workspace>/hooks/` (для кожного агента, типово вимкнені, доки їх явно не ввімкнуть)

Хуки робочого простору можуть додавати нові назви хуків, але не можуть перевизначати вбудовані, керовані або надані плагінами хуки з тією самою назвою.

Gateway пропускає виявлення внутрішніх хуків під час запуску, доки внутрішні хуки не налаштовано. Увімкніть вбудований або керований хук за допомогою `openclaw hooks enable <name>`, установіть пакет хуків або задайте `hooks.internal.enabled=true`, щоб явно ввімкнути їх. Коли ви вмикаєте один іменований хук, Gateway завантажує лише обробник цього хука; `hooks.internal.enabled=true`, додаткові каталоги хуків і застарілі обробники вмикають широке виявлення.

### Пакети хуків

Пакети хуків — це npm-пакети, які експортують хуки через `openclaw.hooks` у `package.json`. Установіть за допомогою:

```bash
openclaw plugins install <path-or-spec>
```

Специфікації npm підтримують лише registry (назва пакета + необов’язкова точна версія або dist-tag). Специфікації Git/URL/file і діапазони semver відхиляються.

## Вбудовані хуки

| Hook                  | Події                                             | Що робить                                                     |
| --------------------- | ------------------------------------------------- | ------------------------------------------------------------ |
| session-memory        | `command:new`, `command:reset`                    | Зберігає контекст сеансу в `<workspace>/memory/`             |
| bootstrap-extra-files | `agent:bootstrap`                                 | Вставляє додаткові bootstrap-файли з glob-шаблонів           |
| command-logger        | `command`                                         | Записує всі команди в `~/.openclaw/logs/commands.log`        |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Надсилає видимі сповіщення в чаті, коли Compaction починається/завершується |
| boot-md               | `gateway:startup`                                 | Запускає `BOOT.md`, коли Gateway стартує                     |

Увімкніть будь-який вбудований hook:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### подробиці session-memory

Витягує останні 15 повідомлень користувача/асистента й зберігає в `<workspace>/memory/YYYY-MM-DD-HHMM.md` з використанням локальної дати хоста. Захоплення пам’яті виконується у фоновому режимі, тому підтвердження `/new` і `/reset` не затримуються через читання транскрипту або необов’язкову генерацію slug. Установіть `hooks.internal.entries.session-memory.llmSlug: true`, щоб генерувати описові slug для імен файлів за допомогою налаштованої моделі. Потрібно налаштувати `workspace.dir`.

<a id="bootstrap-extra-files"></a>

### конфігурація bootstrap-extra-files

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "bootstrap-extra-files": {
          "enabled": true,
          "paths": ["packages/*/AGENTS.md", "packages/*/TOOLS.md"]
        }
      }
    }
  }
}
```

Шляхи визначаються відносно робочого простору. Завантажуються лише розпізнані базові назви bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### подробиці command-logger

Записує кожну slash-команду в `~/.openclaw/logs/commands.log`.

<a id="compaction-notifier"></a>

### подробиці compaction-notifier

Надсилає короткі статусні повідомлення в поточну розмову, коли OpenClaw починає й завершує стискання транскрипту сеансу. Це робить довгі ходи менш заплутаними на чат-поверхнях, бо користувач бачить, що асистент підсумовує контекст і продовжить після Compaction.

<a id="boot-md"></a>

### подробиці boot-md

Запускає `BOOT.md` з активного робочого простору, коли Gateway стартує.

## Plugin hooks

Plugins можуть реєструвати типізовані hooks через Plugin SDK для глибшої інтеграції:
перехоплення викликів інструментів, змінення prompts, керування потоком повідомлень тощо.
Використовуйте plugin hooks, коли потрібні `before_tool_call`, `before_agent_reply`,
`before_install` або інші внутрішньопроцесні hooks життєвого циклу.

Внутрішні hooks, керовані Plugins, відрізняються: вони беруть участь у грубій системі
подій команд/життєвого циклу цієї сторінки й відображаються в `openclaw hooks list` як
`plugin:<id>`. Використовуйте їх для побічних ефектів і сумісності з hook packs, а не
для впорядкованого middleware або policy gates.

Повний довідник plugin hooks див. у [Plugin hooks](/uk/plugins/hooks).

## Конфігурація

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "session-memory": { "enabled": true },
        "command-logger": { "enabled": false }
      }
    }
  }
}
```

Змінні середовища для окремих hooks:

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "my-hook": {
          "enabled": true,
          "env": { "MY_CUSTOM_VAR": "value" }
        }
      }
    }
  }
}
```

Додаткові каталоги hooks:

```json
{
  "hooks": {
    "internal": {
      "load": {
        "extraDirs": ["/path/to/more/hooks"]
      }
    }
  }
}
```

<Note>
Застарілий формат конфігурації масиву `hooks.internal.handlers` усе ще підтримується для зворотної сумісності, але нові hooks мають використовувати систему на основі виявлення.
</Note>

## Довідник CLI

```bash
# List all hooks (add --eligible, --verbose, or --json)
openclaw hooks list

# Show detailed info about a hook
openclaw hooks info <hook-name>

# Show eligibility summary
openclaw hooks check

# Enable/disable
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## Найкращі практики

- **Тримайте handlers швидкими.** Hooks виконуються під час обробки команд. Запускайте важку роботу без очікування результату за допомогою `void processInBackground(event)`.
- **Обробляйте помилки коректно.** Обгортайте ризиковані операції в try/catch; не кидайте винятки, щоб інші handlers могли виконатися.
- **Фільтруйте події рано.** Повертайтеся негайно, якщо тип/дія події не релевантні.
- **Використовуйте конкретні ключі подій.** Надавайте перевагу `"events": ["command:new"]` замість `"events": ["command"]`, щоб зменшити накладні витрати.

## Усунення несправностей

### Hook не виявлено

```bash
# Verify directory structure
ls -la ~/.openclaw/hooks/my-hook/
# Should show: HOOK.md, handler.ts

# List all discovered hooks
openclaw hooks list
```

### Hook не придатний

```bash
openclaw hooks info my-hook
```

Перевірте відсутні binaries (PATH), змінні середовища, значення конфігурації або сумісність з ОС.

### Hook не виконується

1. Переконайтеся, що hook увімкнено: `openclaw hooks list`
2. Перезапустіть процес Gateway, щоб hooks перезавантажилися.
3. Перевірте журнали Gateway: `./scripts/clawlog.sh | grep hook`

## Пов’язане

- [Довідник CLI: hooks](/uk/cli/hooks)
- [Webhooks](/uk/automation/cron-jobs#webhooks)
- [Plugin hooks](/uk/plugins/hooks) — внутрішньопроцесні hooks життєвого циклу Plugin
- [Конфігурація](/uk/gateway/configuration-reference#hooks)
