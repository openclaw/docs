---
read_when:
    - Вам потрібна автоматизація на основі подій для `/new`, `/reset`, `/stop` і подій життєвого циклу агента
    - Ви хочете створювати, встановлювати або налагоджувати хуки
summary: 'Хуки: автоматизація на основі подій для команд і подій життєвого циклу'
title: Хуки
x-i18n:
    generated_at: "2026-04-24T07:31:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e6246f25272208d9a9ff2f186bcd3a463c78ea24b833f0259174d0f7f0cbea6
    source_path: automation/hooks.md
    workflow: 15
---

Хуки — це невеликі скрипти, які запускаються, коли щось відбувається всередині Gateway. Їх можна виявляти з директорій і переглядати через `openclaw hooks`. Gateway завантажує внутрішні хуки лише після того, як ви ввімкнете хуки або налаштуєте принаймні один запис хука, hook pack, застарілий обробник чи додаткову директорію хуків.

В OpenClaw є два види хуків:

- **Внутрішні хуки** (ця сторінка): запускаються всередині Gateway, коли спрацьовують події агента, наприклад `/new`, `/reset`, `/stop` або події життєвого циклу.
- **Webhooks**: зовнішні HTTP-ендпоїнти, які дозволяють іншим системам запускати роботу в OpenClaw. Див. [Webhooks](/uk/automation/cron-jobs#webhooks).

Хуки також можуть постачатися всередині плагінів. `openclaw hooks list` показує як окремі хуки, так і хуки, керовані плагінами.

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
| `command:new`            | Виконано команду `/new`                         |
| `command:reset`          | Виконано команду `/reset`                       |
| `command:stop`           | Виконано команду `/stop`                        |
| `command`                | Будь-яка подія команди (загальний слухач)       |
| `session:compact:before` | Перед тим, як Compaction узагальнює історію     |
| `session:compact:after`  | Після завершення Compaction                     |
| `session:patch`          | Коли властивості сесії змінюються               |
| `agent:bootstrap`        | Перед інʼєкцією bootstrap-файлів робочої області |
| `gateway:startup`        | Після запуску каналів і завантаження хуків      |
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

Тут розміщується докладна документація.
```

**Поля метаданих** (`metadata.openclaw`):

| Поле      | Опис                                                 |
| ---------- | ---------------------------------------------------- |
| `emoji`    | Emoji для відображення в CLI                         |
| `events`   | Масив подій, які потрібно слухати                    |
| `export`   | Іменований експорт для використання (типово `"default"`) |
| `os`       | Потрібні платформи (наприклад, `["darwin", "linux"]`) |
| `requires` | Обовʼязкові `bins`, `anyBins`, `env` або шляхи `config` |
| `always`   | Обходити перевірки придатності (boolean)             |
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

Кожна подія містить: `type`, `action`, `sessionKey`, `timestamp`, `messages` (додавайте через push, щоб надіслати користувачу), і `context` (дані, специфічні для події). Контексти хуків агентів і tool plugin також можуть містити `trace` — контекст діагностичного трасування лише для читання, сумісний із W3C, який плагіни можуть передавати у структуровані логи для кореляції OTEL.

### Основні моменти контексту подій

**Події команд** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Події повідомлень** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (дані, специфічні для провайдера, зокрема `senderId`, `senderName`, `guildId`).

**Події повідомлень** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Події повідомлень** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Події повідомлень** (`message:preprocessed`): `context.bodyForAgent` (остаточне збагачене тіло), `context.from`, `context.channelId`.

**Події bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (змінюваний масив), `context.agentId`.

**Події patch сесії** (`session:patch`): `context.sessionEntry`, `context.patch` (лише змінені поля), `context.cfg`. Лише привілейовані клієнти можуть викликати події patch.

**Події Compaction**: `session:compact:before` містить `messageCount`, `tokenCount`. `session:compact:after` додатково містить `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

## Виявлення хуків

Хуки виявляються з таких директорій у порядку зростання пріоритету перевизначення:

1. **Вбудовані хуки**: постачаються з OpenClaw
2. **Хуки плагінів**: хуки, вбудовані у встановлені плагіни
3. **Керовані хуки**: `~/.openclaw/hooks/` (встановлені користувачем, спільні для всіх робочих областей). Додаткові директорії з `hooks.internal.load.extraDirs` мають той самий пріоритет.
4. **Хуки робочої області**: `<workspace>/hooks/` (для кожного агента окремо, типово вимкнені, доки їх явно не ввімкнути)

Хуки робочої області можуть додавати нові назви хуків, але не можуть перевизначати вбудовані, керовані або надані плагінами хуки з тією самою назвою.

Gateway пропускає виявлення внутрішніх хуків під час запуску, доки внутрішні хуки не налаштовані. Увімкніть вбудований або керований хук через `openclaw hooks enable <name>`, встановіть hook pack або встановіть `hooks.internal.enabled=true`, щоб долучитися. Коли ви вмикаєте один іменований хук, Gateway завантажує лише обробник цього хука; `hooks.internal.enabled=true`, додаткові директорії хуків і застарілі обробники вмикають широке виявлення.

### Hook pack

Hook pack — це npm-пакети, які експортують хуки через `openclaw.hooks` у `package.json`. Встановлення:

```bash
openclaw plugins install <path-or-spec>
```

Npm-специфікації підтримуються лише для реєстру (назва пакета + необовʼязкова точна версія або dist-tag). Git/URL/file-специфікації та діапазони semver відхиляються.

## Вбудовані хуки

| Хук                  | Події                         | Що робить                                             |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | Зберігає контекст сесії до `<workspace>/memory/`      |
| bootstrap-extra-files | `agent:bootstrap`              | Інʼєктує додаткові bootstrap-файли за glob-шаблонами  |
| command-logger        | `command`                      | Логує всі команди до `~/.openclaw/logs/commands.log`  |
| boot-md               | `gateway:startup`              | Запускає `BOOT.md`, коли запускається gateway         |

Увімкнення будь-якого вбудованого хука:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Докладніше про session-memory

Витягує останні 15 повідомлень користувача/асистента, генерує описовий slug імені файла через LLM і зберігає в `<workspace>/memory/YYYY-MM-DD-slug.md`. Потрібно, щоб було налаштовано `workspace.dir`.

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

Шляхи обчислюються відносно робочої області. Завантажуються лише розпізнані bootstrap-базові імена (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Докладніше про command-logger

Логує кожну slash-команду до `~/.openclaw/logs/commands.log`.

<a id="boot-md"></a>

### Докладніше про boot-md

Запускає `BOOT.md` з активної робочої області під час запуску gateway.

## Хуки плагінів

Плагіни можуть реєструвати хуки через Plugin SDK для глибшої інтеграції: перехоплення викликів інструментів, модифікації промптів, керування потоком повідомлень тощо. Plugin SDK надає 28 хуків, що охоплюють визначення моделі, життєвий цикл агента, потік повідомлень, виконання інструментів, координацію субагентів і життєвий цикл gateway.

Повний довідник хуків плагінів, включно з `before_tool_call`, `before_agent_reply`, `before_install` та всіма іншими хуками плагінів, див. у [Plugin Architecture](/uk/plugins/architecture-internals#provider-runtime-hooks).

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

# Показати зведення придатності
openclaw hooks check

# Увімкнути/вимкнути
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## Найкращі практики

- **Тримайте обробники швидкими.** Хуки виконуються під час обробки команд. Запускайте важку роботу у фоновому режимі через `void processInBackground(event)`.
- **Коректно обробляйте помилки.** Обгортайте ризиковані операції в try/catch; не кидайте винятки, щоб інші обробники теж могли виконатися.
- **Фільтруйте події якомога раніше.** Одразу повертайтеся, якщо тип/дія події не є релевантними.
- **Використовуйте конкретні ключі подій.** Надавайте перевагу `"events": ["command:new"]` замість `"events": ["command"]`, щоб зменшити накладні витрати.

## Усунення проблем

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

- [Довідник CLI: hooks](/uk/cli/hooks)
- [Webhooks](/uk/automation/cron-jobs#webhooks)
- [Plugin Architecture](/uk/plugins/architecture-internals#provider-runtime-hooks) — повний довідник хуків плагінів
- [Конфігурація](/uk/gateway/configuration-reference#hooks)
