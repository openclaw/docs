---
read_when:
    - Вам потрібна подієво-керована автоматизація для /new, /reset, /stop і подій життєвого циклу агента
    - Ви хочете створити, встановити або налагодити хуки
summary: 'Хуки: автоматизація на основі подій для команд і подій життєвого циклу'
title: Хуки
x-i18n:
    generated_at: "2026-05-11T20:20:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 02f44dd117d52040ea1205521c6ecd4eb410510175e2312e2584a15e6df27d96
    source_path: automation/hooks.md
    workflow: 16
---

Хуки — це невеликі скрипти, які запускаються, коли щось відбувається всередині Gateway. Їх можна виявляти з каталогів і переглядати за допомогою `openclaw hooks`. Gateway завантажує внутрішні хуки лише після того, як ви ввімкнете хуки або налаштуєте принаймні один запис хука, пакет хуків, застарілий обробник чи додатковий каталог хуків.

В OpenClaw є два типи хуків:

- **Внутрішні хуки** (ця сторінка): запускаються всередині Gateway, коли спрацьовують події агента, як-от `/new`, `/reset`, `/stop` або події життєвого циклу.
- **Webhooks**: зовнішні HTTP-кінцеві точки, які дають змогу іншим системам запускати роботу в OpenClaw. Див. [Webhooks](/uk/automation/cron-jobs#webhooks).

Хуки також можуть постачатися всередині plugins. `openclaw hooks list` показує як автономні хуки, так і хуки, керовані plugin.

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

| Подія                    | Коли спрацьовує                                           |
| ------------------------ | --------------------------------------------------------- |
| `command:new`            | Видано команду `/new`                                     |
| `command:reset`          | Видано команду `/reset`                                   |
| `command:stop`           | Видано команду `/stop`                                    |
| `command`                | Будь-яка подія команди (загальний слухач)                 |
| `session:compact:before` | Перед тим, як compaction підсумовує історію               |
| `session:compact:after`  | Після завершення compaction                               |
| `session:patch`          | Коли змінюються властивості сесії                         |
| `agent:bootstrap`        | Перед вставленням bootstrap-файлів робочої області        |
| `gateway:startup`        | Після запуску каналів і завантаження хуків                |
| `gateway:shutdown`       | Коли починається завершення роботи gateway                |
| `gateway:pre-restart`    | Перед очікуваним перезапуском gateway                     |
| `message:received`       | Вхідне повідомлення з будь-якого каналу                   |
| `message:transcribed`    | Після завершення транскрибування аудіо                    |
| `message:preprocessed`   | Після завершення або пропуску попередньої обробки медіа й посилань |
| `message:sent`           | Доставлено вихідне повідомлення                           |

## Написання хуків

### Структура хука

Кожен хук — це каталог, що містить два файли:

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

| Поле      | Опис                                                 |
| ---------- | ---------------------------------------------------- |
| `emoji`    | Емодзі для відображення в CLI                        |
| `events`   | Масив подій, які потрібно слухати                    |
| `export`   | Іменований експорт для використання (типово `"default"`) |
| `os`       | Потрібні платформи (наприклад, `["darwin", "linux"]`) |
| `requires` | Потрібні шляхи `bins`, `anyBins`, `env` або `config` |
| `always`   | Обійти перевірки придатності (boolean)               |
| `install`  | Методи встановлення                                  |

### Реалізація обробника

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // Your logic here

  // Optionally send message to user
  event.messages.push("Hook executed!");
};

export default handler;
```

Кожна подія містить: `type`, `action`, `sessionKey`, `timestamp`, `messages` (додавайте через push, щоб надіслати користувачу) і `context` (дані, специфічні для події). Контексти хуків агента й tool plugin також можуть містити `trace` — діагностичний контекст трасування, сумісний із W3C і доступний лише для читання, який plugins можуть передавати в структуровані журнали для кореляції OTEL.

### Основне про контекст подій

**Події команд** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Події повідомлень** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (дані, специфічні для провайдера, зокрема `senderId`, `senderName`, `guildId`). `context.content` віддає перевагу непорожньому тілу команди для повідомлень, схожих на команди, потім повертається до сирого вхідного тіла та загального тіла; воно не містить збагачення, призначеного лише для агента, такого як історія треду чи підсумки посилань.

**Події повідомлень** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Події повідомлень** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Події повідомлень** (`message:preprocessed`): `context.bodyForAgent` (остаточне збагачене тіло), `context.from`, `context.channelId`.

**Bootstrap-події** (`agent:bootstrap`): `context.bootstrapFiles` (змінюваний масив), `context.agentId`.

**Події patch сесії** (`session:patch`): `context.sessionEntry`, `context.patch` (лише змінені поля), `context.cfg`. Події patch можуть запускати лише привілейовані клієнти.

**Події Compaction**: `session:compact:before` містить `messageCount`, `tokenCount`. `session:compact:after` додає `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` фіксує, що користувач видає `/stop`; це життєвий цикл скасування/команди, а не шлюз фіналізації агента. Plugins, яким потрібно перевірити природну фінальну відповідь і попросити агента виконати ще один прохід, мають натомість використовувати типізований plugin-хук `before_agent_finalize`. Див. [Plugin-хуки](/uk/plugins/hooks).

**Події життєвого циклу Gateway**: `gateway:shutdown` містить `reason` і `restartExpectedMs` та спрацьовує, коли починається завершення роботи gateway. `gateway:pre-restart` містить той самий контекст, але спрацьовує лише тоді, коли завершення роботи є частиною очікуваного перезапуску й надано скінченне значення `restartExpectedMs`. Під час завершення роботи очікування кожного хука життєвого циклу є best-effort і обмеженим, щоб завершення роботи продовжувалося, якщо обробник зависає.

Між подією `gateway:shutdown` (або `gateway:pre-restart`) і рештою послідовності завершення роботи gateway також запускає типізований plugin-хук `session_end` для кожної сесії, яка все ще була активною, коли процес зупинився. Значення `reason` події — `shutdown` для звичайної зупинки SIGTERM/SIGINT і `restart`, коли закриття було заплановано як частину очікуваного перезапуску. Це спорожнення обмежене, тому повільний обробник `session_end` не може заблокувати вихід процесу, а сесії, які вже були фіналізовані через replace / reset / delete / compaction, пропускаються, щоб уникнути подвійного спрацьовування.

## Виявлення хуків

Хуки виявляються з цих каталогів у порядку зростання пріоритету перевизначення:

1. **Вбудовані хуки**: постачаються з OpenClaw
2. **Plugin-хуки**: хуки, що постачаються всередині встановлених plugins
3. **Керовані хуки**: `~/.openclaw/hooks/` (встановлені користувачем, спільні для робочих областей). Додаткові каталоги з `hooks.internal.load.extraDirs` мають такий самий пріоритет.
4. **Хуки робочої області**: `<workspace>/hooks/` (для окремого агента, вимкнені за замовчуванням, доки їх явно не ввімкнуть)

Хуки робочої області можуть додавати нові назви хуків, але не можуть перевизначати вбудовані, керовані або надані plugin хуки з тією самою назвою.

Gateway пропускає виявлення внутрішніх хуків під час запуску, доки внутрішні хуки не налаштовано. Увімкніть вбудований або керований хук за допомогою `openclaw hooks enable <name>`, встановіть пакет хуків або встановіть `hooks.internal.enabled=true`, щоб увімкнути їх. Коли ви вмикаєте один іменований хук, Gateway завантажує лише обробник цього хука; `hooks.internal.enabled=true`, додаткові каталоги хуків і застарілі обробники вмикають широке виявлення.

### Пакети хуків

Пакети хуків — це npm-пакети, які експортують хуки через `openclaw.hooks` у `package.json`. Установіть за допомогою:

```bash
openclaw plugins install <path-or-spec>
```

Специфікації npm підтримуються лише з registry (назва пакета + необов’язкова точна версія або dist-tag). Git/URL/file-специфікації та semver-діапазони відхиляються.

## Вбудовані хуки

| Хук                   | Події                                             | Що робить                                                     |
| --------------------- | ------------------------------------------------- | ------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | Зберігає контекст сесії в `<workspace>/memory/`               |
| bootstrap-extra-files | `agent:bootstrap`                                 | Вставляє додаткові bootstrap-файли з glob-шаблонів            |
| command-logger        | `command`                                         | Записує всі команди в `~/.openclaw/logs/commands.log`         |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Надсилає видимі повідомлення в чаті, коли compaction сесії починається/завершується |
| boot-md               | `gateway:startup`                                 | Запускає `BOOT.md`, коли gateway стартує                      |

Увімкніть будь-який вбудований хук:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Подробиці session-memory

Витягує останні 15 повідомлень користувача/асистента та зберігає їх у `<workspace>/memory/YYYY-MM-DD-HHMM.md`, використовуючи локальну дату хоста. Захоплення пам’яті виконується у фоновому режимі, тому підтвердження `/new` і `/reset` не затримуються читанням транскрипта або необов’язковою генерацією slug. Установіть `hooks.internal.entries.session-memory.llmSlug: true`, щоб генерувати описові slug-и назв файлів за допомогою налаштованої моделі. Потрібно, щоб було налаштовано `workspace.dir`.

<a id="bootstrap-extra-files"></a>

### Конфігурація bootstrap-extra-files

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

Шляхи визначаються відносно робочої області. Завантажуються лише розпізнані bootstrap-базові назви (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Подробиці command-logger

Записує кожну slash-команду в `~/.openclaw/logs/commands.log`.

<a id="compaction-notifier"></a>

### Подробиці compaction-notifier

Надсилає короткі статусні повідомлення в поточну розмову, коли OpenClaw починає й завершує ущільнення транскрипта сесії. Це робить довгі ходи менш заплутаними на чат-поверхнях, оскільки користувач бачить, що асистент підсумовує контекст і продовжить після compaction.

<a id="boot-md"></a>

### Подробиці boot-md

Запускає `BOOT.md` з активної робочої області, коли gateway стартує.

## Plugin-хуки

Plugins можуть реєструвати типізовані хуки через Plugin SDK для глибшої інтеграції: перехоплення викликів інструментів, змінення prompts, керування потоком повідомлень тощо. Використовуйте plugin-хуки, коли вам потрібні `before_tool_call`, `before_agent_reply`, `before_install` або інші хуки життєвого циклу всередині процесу.

Повний довідник plugin-хуків див. у [Plugin-хуки](/uk/plugins/hooks).

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

Змінні середовища для окремих хуків:

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

Додаткові каталоги хуків:

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
Застарілий формат конфігурації масиву `hooks.internal.handlers` досі підтримується для зворотної сумісності, але нові хуки мають використовувати систему на основі виявлення.
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

- **Тримайте обробники швидкими.** Хуки виконуються під час обробки команд. Запускайте важку роботу у режимі «запустити й забути» за допомогою `void processInBackground(event)`.
- **Обробляйте помилки коректно.** Обгортайте ризиковані операції в try/catch; не викидайте винятки, щоб інші обробники могли виконатися.
- **Фільтруйте події рано.** Одразу повертайтеся, якщо тип/дія події не є релевантними.
- **Використовуйте конкретні ключі подій.** Надавайте перевагу `"events": ["command:new"]` замість `"events": ["command"]`, щоб зменшити накладні витрати.

## Усунення несправностей

### Хук не виявлено

```bash
# Verify directory structure
ls -la ~/.openclaw/hooks/my-hook/
# Should show: HOOK.md, handler.ts

# List all discovered hooks
openclaw hooks list
```

### Хук не придатний

```bash
openclaw hooks info my-hook
```

Перевірте на відсутність бінарних файлів (PATH), змінних середовища, значень конфігурації або сумісності з ОС.

### Хук не виконується

1. Переконайтеся, що хук увімкнено: `openclaw hooks list`
2. Перезапустіть процес Gateway, щоб хуки перезавантажилися.
3. Перевірте журнали Gateway: `./scripts/clawlog.sh | grep hook`

## Пов’язане

- [Довідник CLI: хуки](/uk/cli/hooks)
- [Webhooks](/uk/automation/cron-jobs#webhooks)
- [Plugin-хуки](/uk/plugins/hooks) — внутрішньопроцесні хуки життєвого циклу Plugin
- [Конфігурація](/uk/gateway/configuration-reference#hooks)
