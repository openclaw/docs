---
read_when:
    - Вам потрібна автоматизація, керована подіями, для /new, /reset, /stop і подій життєвого циклу агента
    - Ви хочете створювати, встановлювати або налагоджувати хуки
summary: 'Хуки: подієво-керована автоматизація для команд і подій життєвого циклу'
title: Хуки
x-i18n:
    generated_at: "2026-05-05T08:03:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 321eb7a583d5e8c90d2c2026f6e1cf46cd207bef52213774b469a8d46b993967
    source_path: automation/hooks.md
    workflow: 16
---

Хуки — це невеликі скрипти, які запускаються, коли щось відбувається всередині Gateway. Їх можна виявляти в каталогах і переглядати за допомогою `openclaw hooks`. Gateway завантажує внутрішні хуки лише після того, як ви ввімкнете хуки або налаштуєте принаймні один запис хука, пакет хуків, застарілий обробник чи додатковий каталог хуків.

В OpenClaw є два типи хуків:

- **Внутрішні хуки** (ця сторінка): запускаються всередині Gateway, коли спрацьовують події агента, як-от `/new`, `/reset`, `/stop` або події життєвого циклу.
- **Webhook-и**: зовнішні HTTP-ендпоїнти, які дають змогу іншим системам запускати роботу в OpenClaw. Див. [Webhook-и](/uk/automation/cron-jobs#webhooks).

Хуки також можуть постачатися всередині plugins. `openclaw hooks list` показує як окремі хуки, так і хуки, керовані plugin.

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

| Подія                    | Коли вона спрацьовує                                      |
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | Видано команду `/new`                                      |
| `command:reset`          | Видано команду `/reset`                                    |
| `command:stop`           | Видано команду `/stop`                                     |
| `command`                | Будь-яка подія команди (загальний слухач)                  |
| `session:compact:before` | Перед тим, як Compaction підсумовує історію                |
| `session:compact:after`  | Після завершення Compaction                                |
| `session:patch`          | Коли змінено властивості сесії                             |
| `agent:bootstrap`        | Перед вставленням файлів початкового налаштування робочої області |
| `gateway:startup`        | Після запуску каналів і завантаження хуків                 |
| `gateway:shutdown`       | Коли починається завершення роботи gateway                 |
| `gateway:pre-restart`    | Перед очікуваним перезапуском gateway                      |
| `message:received`       | Вхідне повідомлення з будь-якого каналу                    |
| `message:transcribed`    | Після завершення транскрибування аудіо                     |
| `message:preprocessed`   | Після завершення або пропуску попередньої обробки медіа та посилань |
| `message:sent`           | Доставлено вихідне повідомлення                            |

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

| Поле       | Опис                                                  |
| ---------- | ----------------------------------------------------- |
| `emoji`    | Емодзі для відображення в CLI                         |
| `events`   | Масив подій, які потрібно слухати                     |
| `export`   | Іменований експорт для використання (за замовчуванням `"default"`) |
| `os`       | Потрібні платформи (наприклад, `["darwin", "linux"]`) |
| `requires` | Потрібні шляхи `bins`, `anyBins`, `env` або `config`  |
| `always`   | Обійти перевірки придатності (булеве значення)        |
| `install`  | Методи встановлення                                   |

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

Кожна подія містить: `type`, `action`, `sessionKey`, `timestamp`, `messages` (додайте елемент, щоб надіслати користувачу), і `context` (дані, специфічні для події). Контексти хуків агента та інструментального plugin також можуть містити `trace`, контекст діагностичного трасування, сумісний із W3C і доступний лише для читання, який plugins можуть передавати в структуровані журнали для кореляції OTEL.

### Основні дані контексту подій

**Події команд** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Події повідомлень** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (дані, специфічні для провайдера, зокрема `senderId`, `senderName`, `guildId`). `context.content` віддає перевагу непорожньому тілу команди для повідомлень, схожих на команди, а потім повертається до сирого вхідного тіла та загального тіла; воно не містить збагачення, призначеного лише для агента, як-от історія гілки або підсумки посилань.

**Події повідомлень** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Події повідомлень** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Події повідомлень** (`message:preprocessed`): `context.bodyForAgent` (остаточне збагачене тіло), `context.from`, `context.channelId`.

**Події початкового налаштування** (`agent:bootstrap`): `context.bootstrapFiles` (змінюваний масив), `context.agentId`.

**Події виправлення сесії** (`session:patch`): `context.sessionEntry`, `context.patch` (лише змінені поля), `context.cfg`. Лише привілейовані клієнти можуть запускати події виправлення.

**Події Compaction**: `session:compact:before` містить `messageCount`, `tokenCount`. `session:compact:after` додає `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` фіксує, що користувач видає `/stop`; це життєвий цикл скасування/команди, а не шлюз фіналізації агента. Plugins, яким потрібно переглянути природну фінальну відповідь і попросити агента виконати ще один прохід, мають натомість використовувати типізований хук plugin `before_agent_finalize`. Див. [Хуки Plugin](/uk/plugins/hooks).

**Події життєвого циклу Gateway**: `gateway:shutdown` містить `reason` і `restartExpectedMs` та спрацьовує, коли починається завершення роботи gateway. `gateway:pre-restart` містить той самий контекст, але спрацьовує лише тоді, коли завершення роботи є частиною очікуваного перезапуску й надано скінченне значення `restartExpectedMs`. Під час завершення роботи очікування кожного хука життєвого циклу виконується за принципом найкращого зусилля й має обмеження, щоб завершення роботи продовжувалося, якщо обробник зависає.

## Виявлення хуків

Хуки виявляються в цих каталогах у порядку зростання пріоритету перевизначення:

1. **Вбудовані хуки**: постачаються з OpenClaw
2. **Хуки Plugin**: хуки, вбудовані у встановлені plugins
3. **Керовані хуки**: `~/.openclaw/hooks/` (встановлені користувачем, спільні для робочих областей). Додаткові каталоги з `hooks.internal.load.extraDirs` мають той самий пріоритет.
4. **Хуки робочої області**: `<workspace>/hooks/` (для кожного агента, вимкнені за замовчуванням, доки їх явно не ввімкнуть)

Хуки робочої області можуть додавати нові назви хуків, але не можуть перевизначати вбудовані, керовані або надані plugin хуки з тією самою назвою.

Gateway пропускає виявлення внутрішніх хуків під час запуску, доки внутрішні хуки не налаштовано. Увімкніть вбудований або керований хук за допомогою `openclaw hooks enable <name>`, установіть пакет хуків або задайте `hooks.internal.enabled=true`, щоб явно погодитися. Коли ви вмикаєте один іменований хук, Gateway завантажує лише обробник цього хука; `hooks.internal.enabled=true`, додаткові каталоги хуків і застарілі обробники вмикають широке виявлення.

### Пакети хуків

Пакети хуків — це npm-пакети, які експортують хуки через `openclaw.hooks` у `package.json`. Установіть за допомогою:

```bash
openclaw plugins install <path-or-spec>
```

Специфікації npm підтримуються лише з реєстру (назва пакета + необов’язкова точна версія або dist-tag). Специфікації Git/URL/file і діапазони semver відхиляються.

## Вбудовані хуки

| Хук                   | Події                                             | Що він робить                                                |
| --------------------- | ------------------------------------------------- | ------------------------------------------------------------ |
| session-memory        | `command:new`, `command:reset`                    | Зберігає контекст сесії в `<workspace>/memory/`              |
| bootstrap-extra-files | `agent:bootstrap`                                 | Вставляє додаткові bootstrap-файли з glob-шаблонів           |
| command-logger        | `command`                                         | Записує всі команди в `~/.openclaw/logs/commands.log`        |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Надсилає видимі сповіщення в чаті, коли Compaction сесії починається/завершується |
| boot-md               | `gateway:startup`                                 | Запускає `BOOT.md`, коли запускається Gateway                |

Увімкніть будь-який вбудований хук:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### подробиці session-memory

Витягує останні 15 повідомлень користувача/асистента й зберігає їх у `<workspace>/memory/YYYY-MM-DD-HHMM.md` з використанням локальної дати хоста. Захоплення пам’яті виконується у фоні, тому підтвердження `/new` і `/reset` не затримуються через читання транскрипту або необов’язкове генерування slug. Установіть `hooks.internal.entries.session-memory.llmSlug: true`, щоб генерувати описові slug для імен файлів за допомогою налаштованої моделі. Потрібно, щоб було налаштовано `workspace.dir`.

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

Шляхи розв’язуються відносно робочого простору. Завантажуються лише розпізнані базові імена bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### подробиці command-logger

Записує кожну slash-команду в `~/.openclaw/logs/commands.log`.

<a id="compaction-notifier"></a>

### подробиці compaction-notifier

Надсилає короткі статусні повідомлення в поточну розмову, коли OpenClaw починає й завершує Compaction транскрипту сесії. Це робить довгі кроки менш заплутаними в чат-інтерфейсах, оскільки користувач бачить, що асистент підсумовує контекст і продовжить після Compaction.

<a id="boot-md"></a>

### подробиці boot-md

Запускає `BOOT.md` з активного робочого простору, коли запускається Gateway.

## Хуки Plugin

Plugins можуть реєструвати типізовані хуки через Plugin SDK для глибшої інтеграції:
перехоплення викликів інструментів, змінювання промптів, керування потоком повідомлень тощо.
Використовуйте хуки plugin, коли вам потрібні `before_tool_call`, `before_agent_reply`,
`before_install` або інші хуки життєвого циклу в межах процесу.

Повну довідку з хуків plugin див. у [Хуки Plugin](/uk/plugins/hooks).

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

## Довідка CLI

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

- **Тримайте обробники швидкими.** Хуки виконуються під час обробки команд. Запускайте важку роботу у фоновому режимі без очікування через `void processInBackground(event)`.
- **Обробляйте помилки коректно.** Обгортайте ризиковані операції в try/catch; не кидайте винятки, щоб інші обробники могли виконатися.
- **Фільтруйте події на ранньому етапі.** Негайно повертайтеся, якщо тип/дія події не є релевантними.
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

### Хук не відповідає умовам

```bash
openclaw hooks info my-hook
```

Перевірте відсутні бінарні файли (PATH), змінні середовища, значення конфігурації або сумісність з ОС.

### Хук не виконується

1. Перевірте, що хук увімкнено: `openclaw hooks list`
2. Перезапустіть процес Gateway, щоб хуки перезавантажилися.
3. Перевірте журнали Gateway: `./scripts/clawlog.sh | grep hook`

## Пов’язане

- [Довідник CLI: хуки](/uk/cli/hooks)
- [Webhook](/uk/automation/cron-jobs#webhooks)
- [Хуки Plugin](/uk/plugins/hooks) — хуки життєвого циклу Plugin у процесі
- [Конфігурація](/uk/gateway/configuration-reference#hooks)
