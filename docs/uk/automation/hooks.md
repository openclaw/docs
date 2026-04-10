---
read_when:
    - Вам потрібна автоматизація на основі подій для /new, /reset, /stop і подій життєвого циклу агента
    - Вам потрібно створити, встановити або налагодити хуки
summary: 'Хуки: автоматизація на основі подій для команд і подій життєвого циклу'
title: Хуки
x-i18n:
    generated_at: "2026-04-10T20:41:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 14296398e4042d442ebdf071a07c6be99d4afda7cbf3c2b934e76dc5539742c7
    source_path: automation/hooks.md
    workflow: 15
---

# Хуки

Хуки — це невеликі скрипти, які запускаються, коли щось відбувається всередині Gateway. Вони автоматично виявляються в каталогах, і їх можна переглядати за допомогою `openclaw hooks`.

В OpenClaw є два типи хуків:

- **Внутрішні хуки** (ця сторінка): запускаються всередині Gateway, коли спрацьовують події агента, як-от `/new`, `/reset`, `/stop` або події життєвого циклу.
- **Вебхуки**: зовнішні HTTP-ендпоїнти, які дозволяють іншим системам запускати роботу в OpenClaw. Див. [Вебхуки](/uk/automation/cron-jobs#webhooks).

Хуки також можуть бути вбудовані в плагіни. `openclaw hooks list` показує як окремі хуки, так і хуки, якими керують плагіни.

## Швидкий старт

```bash
# Список доступних хуків
openclaw hooks list

# Увімкнути хук
openclaw hooks enable session-memory

# Перевірити стан хуків
openclaw hooks check

# Отримати докладну інформацію
openclaw hooks info session-memory
```

## Типи подій

| Подія                    | Коли спрацьовує                                |
| ------------------------ | ---------------------------------------------- |
| `command:new`            | Видано команду `/new`                          |
| `command:reset`          | Видано команду `/reset`                        |
| `command:stop`           | Видано команду `/stop`                         |
| `command`                | Будь-яка подія команди (загальний слухач)      |
| `session:compact:before` | Перед тим, як ущільнення підсумовує історію    |
| `session:compact:after`  | Після завершення ущільнення                    |
| `session:patch`          | Коли властивості сесії змінюються              |
| `agent:bootstrap`        | Перед вставленням bootstrap-файлів workspace   |
| `gateway:startup`        | Після запуску каналів і завантаження хуків     |
| `message:received`       | Вхідне повідомлення з будь-якого каналу        |
| `message:transcribed`    | Після завершення транскрибування аудіо         |
| `message:preprocessed`   | Після завершення обробки медіа та посилань     |
| `message:sent`           | Вихідне повідомлення доставлено                |

## Написання хуків

### Структура хука

Кожен хук — це каталог, що містить два файли:

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

| Поле       | Опис                                                         |
| ---------- | ------------------------------------------------------------ |
| `emoji`    | Emoji для відображення в CLI                                 |
| `events`   | Масив подій для прослуховування                              |
| `export`   | Іменований експорт для використання (типово `"default"`)     |
| `os`       | Потрібні платформи (наприклад, `["darwin", "linux"]`)        |
| `requires` | Потрібні `bins`, `anyBins`, `env` або шляхи `config`         |
| `always`   | Обійти перевірки відповідності (boolean)                     |
| `install`  | Методи встановлення                                          |

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

Кожна подія містить: `type`, `action`, `sessionKey`, `timestamp`, `messages` (додавайте через push, щоб надіслати користувачу), і `context` (дані, специфічні для події).

### Основні елементи контексту подій

**Події команд** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Події повідомлень** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (дані, специфічні для провайдера, включно з `senderId`, `senderName`, `guildId`).

**Події повідомлень** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Події повідомлень** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Події повідомлень** (`message:preprocessed`): `context.bodyForAgent` (остаточний збагачений вміст), `context.from`, `context.channelId`.

**Події bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (змінюваний масив), `context.agentId`.

**Події patch сесії** (`session:patch`): `context.sessionEntry`, `context.patch` (лише змінені поля), `context.cfg`. Лише привілейовані клієнти можуть запускати події patch.

**Події ущільнення**: `session:compact:before` включає `messageCount`, `tokenCount`. `session:compact:after` додає `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

## Виявлення хуків

Хуки виявляються з таких каталогів у порядку зростання пріоритету перевизначення:

1. **Вбудовані хуки**: постачаються разом з OpenClaw
2. **Хуки плагінів**: хуки, вбудовані у встановлені плагіни
3. **Керовані хуки**: `~/.openclaw/hooks/` (встановлені користувачем, спільні для всіх workspace). Додаткові каталоги з `hooks.internal.load.extraDirs` мають той самий пріоритет.
4. **Хуки workspace**: `<workspace>/hooks/` (для окремого агента, типово вимкнені, доки їх явно не увімкнути)

Хуки workspace можуть додавати нові назви хуків, але не можуть перевизначати вбудовані, керовані або надані плагінами хуки з тією ж назвою.

### Набори хуків

Набори хуків — це npm-пакети, які експортують хуки через `openclaw.hooks` у `package.json`. Встановлення:

```bash
openclaw plugins install <path-or-spec>
```

Npm-специфікації підтримують лише реєстр (назва пакета + необов’язкова точна версія або dist-tag). Специфікації Git/URL/file і діапазони semver відхиляються.

## Вбудовані хуки

| Хук                   | Події                          | Що він робить                                         |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | Зберігає контекст сесії в `<workspace>/memory/`       |
| bootstrap-extra-files | `agent:bootstrap`              | Вставляє додаткові bootstrap-файли з glob-шаблонів    |
| command-logger        | `command`                      | Логує всі команди в `~/.openclaw/logs/commands.log`   |
| boot-md               | `gateway:startup`              | Запускає `BOOT.md`, коли запускається gateway         |

Увімкнути будь-який вбудований хук:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Докладніше про session-memory

Витягує останні 15 повідомлень користувача/асистента, генерує описовий slug імені файлу через LLM і зберігає його в `<workspace>/memory/YYYY-MM-DD-slug.md`. Потрібно, щоб було налаштовано `workspace.dir`.

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

Шляхи обчислюються відносно workspace. Завантажуються лише розпізнані базові назви bootstrap-файлів (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Докладніше про command-logger

Логує кожну slash-команду в `~/.openclaw/logs/commands.log`.

<a id="boot-md"></a>

### Докладніше про boot-md

Запускає `BOOT.md` з активного workspace під час запуску gateway.

## Хуки плагінів

Плагіни можуть реєструвати хуки через Plugin SDK для глибшої інтеграції: перехоплення викликів інструментів, зміни промптів, керування потоком повідомлень тощо. Plugin SDK надає 28 хуків, що охоплюють визначення моделі, життєвий цикл агента, потік повідомлень, виконання інструментів, координацію субагентів і життєвий цикл gateway.

Повний довідник із хуків плагінів, включно з `before_tool_call`, `before_agent_reply`, `before_install` та всіма іншими хуками плагінів, див. у [Архітектура плагінів](/uk/plugins/architecture#provider-runtime-hooks).

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
Застарілий формат конфігурації масиву `hooks.internal.handlers` усе ще підтримується для зворотної сумісності, але нові хуки мають використовувати систему на основі виявлення.
</Note>

## Довідка CLI

```bash
# Список усіх хуків (додайте --eligible, --verbose або --json)
openclaw hooks list

# Показати докладну інформацію про хук
openclaw hooks info <hook-name>

# Показати зведення про відповідність
openclaw hooks check

# Увімкнути/вимкнути
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## Рекомендовані практики

- **Робіть обробники швидкими.** Хуки запускаються під час обробки команд. Для важких задач використовуйте fire-and-forget через `void processInBackground(event)`.
- **Коректно обробляйте помилки.** Обгортайте ризиковані операції в try/catch; не викидайте винятки, щоб інші обробники могли виконатися.
- **Рано фільтруйте події.** Одразу повертайтеся, якщо тип/дія події не є релевантними.
- **Використовуйте конкретні ключі подій.** Надавайте перевагу `"events": ["command:new"]` замість `"events": ["command"]`, щоб зменшити накладні витрати.

## Усунення неполадок

### Хук не виявлено

```bash
# Перевірте структуру каталогу
ls -la ~/.openclaw/hooks/my-hook/
# Має показати: HOOK.md, handler.ts

# Список усіх виявлених хуків
openclaw hooks list
```

### Хук не відповідає умовам

```bash
openclaw hooks info my-hook
```

Перевірте відсутні бінарні файли (PATH), змінні середовища, значення конфігурації або сумісність з ОС.

### Хук не виконується

1. Переконайтеся, що хук увімкнено: `openclaw hooks list`
2. Перезапустіть процес gateway, щоб хуки перезавантажилися.
3. Перевірте логи gateway: `./scripts/clawlog.sh | grep hook`

## Пов’язане

- [Довідка CLI: hooks](/cli/hooks)
- [Вебхуки](/uk/automation/cron-jobs#webhooks)
- [Архітектура плагінів](/uk/plugins/architecture#provider-runtime-hooks) — повний довідник із хуків плагінів
- [Конфігурація](/uk/gateway/configuration-reference#hooks)
