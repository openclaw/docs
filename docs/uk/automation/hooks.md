---
read_when:
    - Вам потрібна автоматизація на основі подій для `/new`, `/reset`, `/stop` і подій життєвого циклу агента
    - Ви хочете створювати, встановлювати або налагоджувати хуки
summary: 'Хуки: автоматизація на основі подій для команд і подій життєвого циклу'
title: Хуки
x-i18n:
    generated_at: "2026-04-27T11:10:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: f5e63700c90456dfc26de8545ad4382d6d34bcfd8896966d88e008da5c690255
    source_path: automation/hooks.md
    workflow: 15
---

Хуки — це невеликі скрипти, які запускаються, коли щось відбувається всередині Gateway. Їх можна виявляти з директорій та переглядати за допомогою `openclaw hooks`. Gateway завантажує внутрішні хуки лише після того, як ви ввімкнете хуки або налаштуєте принаймні один запис хука, пак хука, застарілий обробник або додаткову директорію хуків.

В OpenClaw є два типи хуків:

- **Внутрішні хуки** (ця сторінка): запускаються всередині Gateway, коли спрацьовують події агента, як-от `/new`, `/reset`, `/stop` або події життєвого циклу.
- **Webhooks**: зовнішні HTTP-ендпоїнти, які дозволяють іншим системам запускати роботу в OpenClaw. Див. [Webhooks](/uk/automation/cron-jobs#webhooks).

Хуки також можуть постачатися всередині плагінів. `openclaw hooks list` показує як окремі хуки, так і хуки, якими керують плагіни.

## Швидкий старт

```bash
# Перелічити доступні хуки
openclaw hooks list

# Увімкнути хук
openclaw hooks enable session-memory

# Перевірити стан хуків
openclaw hooks check

# Отримати детальну інформацію
openclaw hooks info session-memory
```

## Типи подій

| Подія                    | Коли спрацьовує                                 |
| ------------------------ | ----------------------------------------------- |
| `command:new`            | Видано команду `/new`                           |
| `command:reset`          | Видано команду `/reset`                         |
| `command:stop`           | Видано команду `/stop`                          |
| `command`                | Будь-яка подія команди (загальний слухач)       |
| `session:compact:before` | Перед тим, як Compaction підсумує історію       |
| `session:compact:after`  | Після завершення Compaction                     |
| `session:patch`          | Коли властивості сесії змінено                  |
| `agent:bootstrap`        | Перед інʼєкцією bootstrap-файлів робочої області |
| `gateway:startup`        | Після запуску каналів і завантаження хуків      |
| `gateway:shutdown`       | Коли починається завершення роботи gateway      |
| `gateway:pre-restart`    | Перед очікуваним перезапуском gateway           |
| `message:received`       | Вхідне повідомлення з будь-якого каналу         |
| `message:transcribed`    | Після завершення транскрибування аудіо          |
| `message:preprocessed`   | Після завершення обробки всіх медіа та посилань |
| `message:sent`           | Вихідне повідомлення доставлено                 |

## Написання хуків

### Структура хука

Кожен хук — це директорія, що містить два файли:

```
my-hook/
├── HOOK.md          # Метадані + документація
└── handler.ts       # Реалізація обробника
```

### Формат HOOK.md

```markdown
---
name: my-hook
description: "Короткий опис того, що робить цей хук"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

Детальна документація наведена тут.
```

**Поля метаданих** (`metadata.openclaw`):

| Поле       | Опис                                                  |
| ---------- | ----------------------------------------------------- |
| `emoji`    | Emoji для відображення в CLI                          |
| `events`   | Масив подій, які потрібно слухати                     |
| `export`   | Іменований експорт для використання (типово `"default"`) |
| `os`       | Обовʼязкові платформи (наприклад, `["darwin", "linux"]`) |
| `requires` | Обовʼязкові шляхи `bins`, `anyBins`, `env` або `config` |
| `always`   | Обійти перевірки придатності (boolean)                |
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

Кожна подія містить: `type`, `action`, `sessionKey`, `timestamp`, `messages` (додавайте через push, щоб надіслати користувачеві), і `context` (дані, специфічні для події). Контексти хуків агентів і tool plugin також можуть містити `trace` — контекст діагностичного трасування лише для читання, сумісний із W3C, який плагіни можуть передавати в структуровані логи для кореляції OTEL.

### Основні моменти контексту подій

**Події команд** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Події повідомлень** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (дані, специфічні для провайдера, включно з `senderId`, `senderName`, `guildId`).

**Події повідомлень** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Події повідомлень** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Події повідомлень** (`message:preprocessed`): `context.bodyForAgent` (фінальне збагачене тіло), `context.from`, `context.channelId`.

**Події bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (змінюваний масив), `context.agentId`.

**Події patch сесії** (`session:patch`): `context.sessionEntry`, `context.patch` (лише змінені поля), `context.cfg`. Лише привілейовані клієнти можуть ініціювати події patch.

**Події Compaction**: `session:compact:before` містить `messageCount`, `tokenCount`. `session:compact:after` додатково містить `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` спостерігає за тим, як користувач видає `/stop`; це життєвий цикл скасування/команди, а не фінальний барʼєр завершення агента. Плагіни, яким потрібно перевірити природну фінальну відповідь і попросити агента зробити ще один прохід, мають використовувати типізований хук плагіна `before_agent_finalize`. Див. [Plugin hooks](/uk/plugins/hooks).

**Події життєвого циклу Gateway**: `gateway:shutdown` містить `reason` і `restartExpectedMs` та спрацьовує, коли починається завершення роботи gateway. `gateway:pre-restart` містить той самий контекст, але спрацьовує лише тоді, коли завершення роботи є частиною очікуваного перезапуску й передано скінченне значення `restartExpectedMs`. Під час завершення роботи очікування кожного хука життєвого циклу є best-effort і обмежується, щоб завершення роботи продовжувалося, навіть якщо обробник зависає.

## Виявлення хуків

Хуки виявляються в таких директоріях у порядку зростання пріоритету перевизначення:

1. **Вбудовані хуки**: постачаються разом з OpenClaw
2. **Хуки плагінів**: хуки, що постачаються всередині встановлених плагінів
3. **Керовані хуки**: `~/.openclaw/hooks/` (встановлені користувачем, спільні для всіх робочих областей). Додаткові директорії з `hooks.internal.load.extraDirs` мають такий самий пріоритет.
4. **Хуки робочої області**: `<workspace>/hooks/` (для кожного агента окремо, типово вимкнені, доки їх явно не ввімкнути)

Хуки робочої області можуть додавати нові імена хуків, але не можуть перевизначати вбудовані, керовані або надані плагінами хуки з тією самою назвою.

Gateway пропускає виявлення внутрішніх хуків під час запуску, доки внутрішні хуки не налаштовано. Увімкніть вбудований або керований хук за допомогою `openclaw hooks enable <name>`, установіть пак хука або задайте `hooks.internal.enabled=true`, щоб виконати opt-in. Коли ви вмикаєте один іменований хук, Gateway завантажує лише обробник цього хука; `hooks.internal.enabled=true`, додаткові директорії хуків і застарілі обробники виконують opt-in до широкого виявлення.

### Паки хуків

Паки хуків — це npm-пакети, які експортують хуки через `openclaw.hooks` у `package.json`. Встановлення:

```bash
openclaw plugins install <path-or-spec>
```

Специфікації npm підтримують лише реєстр (назва пакета + необовʼязкова точна версія або dist-tag). Специфікації Git/URL/file і діапазони semver відхиляються.

## Вбудовані хуки

| Хук                  | Події                          | Що він робить                                        |
| -------------------- | ------------------------------ | ---------------------------------------------------- |
| session-memory       | `command:new`, `command:reset` | Зберігає контекст сесії в `<workspace>/memory/`      |
| bootstrap-extra-files | `agent:bootstrap`             | Інʼєктує додаткові bootstrap-файли з glob-шаблонів   |
| command-logger       | `command`                      | Логує всі команди в `~/.openclaw/logs/commands.log`  |
| boot-md              | `gateway:startup`              | Запускає `BOOT.md` під час старту gateway            |

Увімкнути будь-який вбудований хук:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Докладніше про session-memory

Витягує останні 15 повідомлень користувача/асистента, генерує описовий slug імені файла через LLM і зберігає в `<workspace>/memory/YYYY-MM-DD-slug.md`, використовуючи локальну дату хоста. Потрібно, щоб було налаштовано `workspace.dir`.

<a id="bootstrap-extra-files"></a>

### Налаштування bootstrap-extra-files

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

Шляхи обчислюються відносно робочої області. Завантажуються лише розпізнані базові імена bootstrap-файлів (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Докладніше про command-logger

Логує кожну slash-команду в `~/.openclaw/logs/commands.log`.

<a id="boot-md"></a>

### Докладніше про boot-md

Запускає `BOOT.md` з активної робочої області під час старту gateway.

## Хуки плагінів

Плагіни можуть реєструвати типізовані хуки через Plugin SDK для глибшої інтеграції:
перехоплення викликів інструментів, зміни промптів, керування потоком повідомлень тощо.
Використовуйте хуки плагінів, коли вам потрібні `before_tool_call`, `before_agent_reply`,
`before_install` або інші in-process хуки життєвого циклу.

Повний довідник з хуків плагінів див. у [Plugin hooks](/uk/plugins/hooks).

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

Змінні середовища для окремого хука:

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

Додаткові директорії хуків:

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
Застарілий формат конфігурації масиву `hooks.internal.handlers` усе ще підтримується для зворотної сумісності, але нові хуки мають використовувати систему на основі виявлення.
</Note>

## Довідник CLI

```bash
# Перелічити всі хуки (додайте --eligible, --verbose або --json)
openclaw hooks list

# Показати детальну інформацію про хук
openclaw hooks info <hook-name>

# Показати зведення щодо придатності
openclaw hooks check

# Увімкнути/вимкнути
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## Рекомендовані практики

- **Робіть обробники швидкими.** Хуки виконуються під час обробки команд. Для важкої роботи використовуйте fire-and-forget через `void processInBackground(event)`.
- **Обробляйте помилки коректно.** Обгортайте ризиковані операції в try/catch; не кидайте винятки, щоб інші обробники могли виконатися.
- **Фільтруйте події на ранньому етапі.** Одразу повертайтеся, якщо тип/дія події не є релевантними.
- **Використовуйте конкретні ключі подій.** Віддавайте перевагу `"events": ["command:new"]` замість `"events": ["command"]`, щоб зменшити накладні витрати.

## Усунення несправностей

### Хук не виявляється

```bash
# Перевірити структуру директорії
ls -la ~/.openclaw/hooks/my-hook/
# Має показати: HOOK.md, handler.ts

# Перелічити всі виявлені хуки
openclaw hooks list
```

### Хук непридатний

```bash
openclaw hooks info my-hook
```

Перевірте відсутні бінарні файли (PATH), змінні середовища, значення конфігурації або сумісність з ОС.

### Хук не виконується

1. Переконайтеся, що хук увімкнено: `openclaw hooks list`
2. Перезапустіть процес gateway, щоб хуки перезавантажилися.
3. Перевірте логи gateway: `./scripts/clawlog.sh | grep hook`

## Повʼязане

- [CLI Reference: hooks](/uk/cli/hooks)
- [Webhooks](/uk/automation/cron-jobs#webhooks)
- [Plugin hooks](/uk/plugins/hooks) — in-process хуки життєвого циклу плагінів
- [Configuration](/uk/gateway/configuration-reference#hooks)
