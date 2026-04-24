---
read_when:
    - Ви хочете автоматизацію на основі подій для `/new`, `/reset`, `/stop` і подій життєвого циклу агента
    - Ви хочете створювати, встановлювати або налагоджувати хуки
summary: 'Хуки: автоматизація на основі подій для команд і подій життєвого циклу'
title: Хуки
x-i18n:
    generated_at: "2026-04-24T03:06:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e24d5a95748151059e34f8c9ff9910dbcd7a32e7cadb44d1fa25352ef3a09a6
    source_path: automation/hooks.md
    workflow: 15
---

Хуки — це невеликі скрипти, які запускаються, коли щось відбувається всередині Gateway. Їх можна виявляти з директорій і переглядати за допомогою `openclaw hooks`. Gateway завантажує внутрішні хуки лише після того, як ви ввімкнете хуки або налаштуєте принаймні один запис хука, hook pack, застарілий обробник чи додаткову директорію хуків.

В OpenClaw є два типи хуків:

- **Внутрішні хуки** (ця сторінка): запускаються всередині Gateway, коли спрацьовують події агента, як-от `/new`, `/reset`, `/stop` або події життєвого циклу.
- **Webhooks**: зовнішні HTTP-ендпоїнти, які дозволяють іншим системам запускати роботу в OpenClaw. Див. [Webhooks](/uk/automation/cron-jobs#webhooks).

Хуки також можуть постачатися в складі плагінів. `openclaw hooks list` показує як окремі хуки, так і хуки, керовані плагінами.

## Швидкий старт

```bash
# Перелічити доступні хуки
openclaw hooks list

# Увімкнути хук
openclaw hooks enable session-memory

# Перевірити статус хуків
openclaw hooks check

# Отримати докладну інформацію
openclaw hooks info session-memory
```

## Типи подій

| Подія                    | Коли спрацьовує                               |
| ------------------------ | --------------------------------------------- |
| `command:new`            | Видано команду `/new`                         |
| `command:reset`          | Видано команду `/reset`                       |
| `command:stop`           | Видано команду `/stop`                        |
| `command`                | Будь-яка подія команди (загальний слухач)     |
| `session:compact:before` | До того, як Compaction узагальнює історію     |
| `session:compact:after`  | Після завершення Compaction                   |
| `session:patch`          | Коли властивості сесії змінено                |
| `agent:bootstrap`        | До впровадження bootstrap-файлів робочого простору |
| `gateway:startup`        | Після запуску каналів і завантаження хуків    |
| `message:received`       | Вхідне повідомлення з будь-якого каналу       |
| `message:transcribed`    | Після завершення транскрибування аудіо        |
| `message:preprocessed`   | Після завершення обробки всіх медіа та посилань |
| `message:sent`           | Вихідне повідомлення доставлено               |

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

Тут міститься докладна документація.
```

**Поля метаданих** (`metadata.openclaw`):

| Поле       | Опис                                                 |
| ---------- | ---------------------------------------------------- |
| `emoji`    | Емодзі для відображення в CLI                        |
| `events`   | Масив подій, які потрібно слухати                    |
| `export`   | Іменований експорт для використання (типово `"default"`) |
| `os`       | Обов’язкові платформи (наприклад, `["darwin", "linux"]`) |
| `requires` | Обов’язкові `bins`, `anyBins`, `env` або шляхи `config` |
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

Кожна подія містить: `type`, `action`, `sessionKey`, `timestamp`, `messages` (додавайте через push, щоб надіслати користувачу), і `context` (дані, специфічні для події).

### Основні моменти щодо контексту подій

**Події команд** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Події повідомлень** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (дані, специфічні для провайдера, зокрема `senderId`, `senderName`, `guildId`).

**Події повідомлень** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Події повідомлень** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Події повідомлень** (`message:preprocessed`): `context.bodyForAgent` (остаточне збагачене тіло), `context.from`, `context.channelId`.

**Події bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (змінюваний масив), `context.agentId`.

**Події patch сесії** (`session:patch`): `context.sessionEntry`, `context.patch` (лише змінені поля), `context.cfg`. Лише привілейовані клієнти можуть викликати події patch.

**Події Compaction**: `session:compact:before` містить `messageCount`, `tokenCount`. `session:compact:after` додатково містить `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

## Виявлення хуків

Хуки виявляються в таких директоріях, у порядку зростання пріоритету перевизначення:

1. **Вбудовані хуки**: постачаються з OpenClaw
2. **Хуки плагінів**: хуки, що постачаються у складі встановлених плагінів
3. **Керовані хуки**: `~/.openclaw/hooks/` (встановлені користувачем, спільні для всіх робочих просторів). Додаткові директорії з `hooks.internal.load.extraDirs` мають такий самий пріоритет.
4. **Хуки робочого простору**: `<workspace>/hooks/` (для окремого агента, типово вимкнені, доки не будуть явно ввімкнені)

Хуки робочого простору можуть додавати нові назви хуків, але не можуть перевизначати вбудовані, керовані або надані плагінами хуки з тією самою назвою.

Gateway пропускає виявлення внутрішніх хуків під час запуску, доки внутрішні хуки не налаштовані. Увімкніть вбудований або керований хук через `openclaw hooks enable <name>`, встановіть hook pack або задайте `hooks.internal.enabled=true`, щоб долучитися. Коли ви вмикаєте один іменований хук, Gateway завантажує лише обробник цього хука; `hooks.internal.enabled=true`, додаткові директорії хуків і застарілі обробники вмикають широке виявлення.

### Hook packs

Hook packs — це npm-пакети, які експортують хуки через `openclaw.hooks` у `package.json`. Встановлення:

```bash
openclaw plugins install <path-or-spec>
```

Npm-специфікації підтримуються лише для реєстру (назва пакета + необов’язкова точна версія або dist-tag). Специфікації Git/URL/file і діапазони semver відхиляються.

## Вбудовані хуки

| Хук                  | Події                          | Що робить                                             |
| -------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory       | `command:new`, `command:reset` | Зберігає контекст сесії в `<workspace>/memory/`       |
| bootstrap-extra-files | `agent:bootstrap`             | Впроваджує додаткові bootstrap-файли за glob-шаблонами |
| command-logger       | `command`                      | Логує всі команди в `~/.openclaw/logs/commands.log`   |
| boot-md              | `gateway:startup`              | Запускає `BOOT.md` під час старту gateway             |

Увімкнути будь-який вбудований хук:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Докладніше про session-memory

Витягує останні 15 повідомлень користувача/асистента, генерує описовий slug імені файлу через LLM і зберігає у `<workspace>/memory/YYYY-MM-DD-slug.md`. Потрібно, щоб було налаштовано `workspace.dir`.

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

Шляхи розв’язуються відносно робочого простору. Завантажуються лише розпізнавані bootstrap-базові імена (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Докладніше про command-logger

Логує кожну slash-команду в `~/.openclaw/logs/commands.log`.

<a id="boot-md"></a>

### Докладніше про boot-md

Запускає `BOOT.md` з активного робочого простору під час старту gateway.

## Хуки плагінів

Плагіни можуть реєструвати хуки через Plugin SDK для глибшої інтеграції: перехоплення викликів інструментів, змінення промптів, керування потоком повідомлень тощо. Plugin SDK надає 28 хуків, що охоплюють визначення моделі, життєвий цикл агента, потік повідомлень, виконання інструментів, координацію підагентів і життєвий цикл gateway.

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
Застарілий формат конфігурації масиву `hooks.internal.handlers` і далі підтримується для зворотної сумісності, але нові хуки мають використовувати систему на основі виявлення.
</Note>

## Довідник CLI

```bash
# Перелічити всі хуки (додайте --eligible, --verbose або --json)
openclaw hooks list

# Показати докладну інформацію про хук
openclaw hooks info <hook-name>

# Показати зведення щодо придатності
openclaw hooks check

# Увімкнути/вимкнути
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## Найкращі практики

- **Тримайте обробники швидкими.** Хуки запускаються під час обробки команд. Для важкої роботи використовуйте fire-and-forget через `void processInBackground(event)`.
- **Коректно обробляйте помилки.** Обгортайте ризиковані операції в try/catch; не викидайте винятки, щоб інші обробники могли виконатися.
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

## Пов’язане

- [Довідник CLI: hooks](/uk/cli/hooks)
- [Webhooks](/uk/automation/cron-jobs#webhooks)
- [Plugin Architecture](/uk/plugins/architecture-internals#provider-runtime-hooks) — повний довідник хуків плагінів
- [Конфігурація](/uk/gateway/configuration-reference#hooks)
