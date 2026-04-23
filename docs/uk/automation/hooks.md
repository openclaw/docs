---
read_when:
    - Ви хочете автоматизацію на основі подій для /new, /reset, /stop і подій життєвого циклу агента
    - Ви хочете створювати, встановлювати або налагоджувати хуки
summary: 'Хуки: автоматизація на основі подій для команд і подій життєвого циклу'
title: Хуки
x-i18n:
    generated_at: "2026-04-23T20:43:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 93d26dfe9e04d3e3de070223f4e186a31bd3afb854f1b0e5f5bff893a69538d6
    source_path: automation/hooks.md
    workflow: 15
---

Хуки — це невеликі скрипти, які запускаються, коли всередині Gateway щось відбувається. Їх можна виявляти в каталогах і переглядати за допомогою `openclaw hooks`. Gateway завантажує внутрішні хуки лише після того, як ви ввімкнете хуки або налаштуєте принаймні один запис хука, пак хука, застарілий обробник чи додатковий каталог хуків.

В OpenClaw є два типи хуків:

- **Внутрішні хуки** (ця сторінка): виконуються всередині Gateway, коли спрацьовують події агента, наприклад `/new`, `/reset`, `/stop` або події життєвого циклу.
- **Webhook-и**: зовнішні HTTP-адреси, які дають змогу іншим системам запускати роботу в OpenClaw. Див. [Webhook-и](/uk/automation/cron-jobs#webhooks).

Хуки також можуть постачатися всередині Plugin-ів. `openclaw hooks list` показує як окремі хуки, так і хуки, якими керують Plugin-и.

## Швидкий старт

```bash
# Перелічити доступні хуки
openclaw hooks list

# Увімкнути хук
openclaw hooks enable session-memory

# Перевірити стан хуків
openclaw hooks check

# Отримати докладну інформацію
openclaw hooks info session-memory
```

## Типи подій

| Подія                    | Коли спрацьовує                                 |
| ------------------------ | ----------------------------------------------- |
| `command:new`            | Виконано команду `/new`                         |
| `command:reset`          | Виконано команду `/reset`                       |
| `command:stop`           | Виконано команду `/stop`                        |
| `command`                | Будь-яка подія команди (загальний слухач)       |
| `session:compact:before` | Перед тим як Compaction підсумує історію        |
| `session:compact:after`  | Після завершення Compaction                     |
| `session:patch`          | Коли змінюються властивості сесії               |
| `agent:bootstrap`        | Перед впровадженням bootstrap-файлів workspace  |
| `gateway:startup`        | Після запуску каналів і завантаження хуків      |
| `message:received`       | Вхідне повідомлення з будь-якого каналу         |
| `message:transcribed`    | Після завершення транскрибування аудіо          |
| `message:preprocessed`   | Після завершення обробки всіх медіа й посилань  |
| `message:sent`           | Вихідне повідомлення доставлено                 |

## Написання хуків

### Структура хука

Кожен хук — це каталог, який містить два файли:

```
my-hook/
├── HOOK.md          # Метадані + документація
└── handler.ts       # Реалізація обробника
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

| Поле       | Опис                                                   |
| ---------- | ------------------------------------------------------ |
| `emoji`    | Emoji для відображення в CLI                           |
| `events`   | Масив подій, які потрібно слухати                      |
| `export`   | Іменований експорт для використання (типово `"default"`) |
| `os`       | Потрібні платформи (наприклад, `["darwin", "linux"]`)  |
| `requires` | Необхідні `bins`, `anyBins`, `env` або шляхи `config`  |
| `always`   | Обхід перевірок відповідності (boolean)                |
| `install`  | Методи встановлення                                    |

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

Кожна подія включає: `type`, `action`, `sessionKey`, `timestamp`, `messages` (додавайте через push, щоб надіслати користувачу), і `context` (дані, специфічні для події).

### Основні моменти контексту подій

**Події команд** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Події повідомлень** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (дані, специфічні для провайдера, зокрема `senderId`, `senderName`, `guildId`).

**Події повідомлень** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Події повідомлень** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Події повідомлень** (`message:preprocessed`): `context.bodyForAgent` (остаточне збагачене тіло), `context.from`, `context.channelId`.

**Bootstrap-події** (`agent:bootstrap`): `context.bootstrapFiles` (змінюваний масив), `context.agentId`.

**Події patch сесії** (`session:patch`): `context.sessionEntry`, `context.patch` (лише змінені поля), `context.cfg`. Лише привілейовані клієнти можуть ініціювати події patch.

**Події Compaction**: `session:compact:before` містить `messageCount`, `tokenCount`. `session:compact:after` додатково містить `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

## Виявлення хуків

Хуки виявляються в таких каталогах, у порядку зростання пріоритету перевизначення:

1. **Вбудовані хуки**: постачаються з OpenClaw
2. **Plugin-хуки**: хуки, вбудовані у встановлені Plugin-и
3. **Керовані хуки**: `~/.openclaw/hooks/` (встановлені користувачем, спільні для всіх workspace). Додаткові каталоги з `hooks.internal.load.extraDirs` мають той самий пріоритет.
4. **Хуки workspace**: `<workspace>/hooks/` (для окремого агента, типово вимкнені, доки їх явно не ввімкнути)

Хуки workspace можуть додавати нові назви хуків, але не можуть перевизначати вбудовані, керовані або надані Plugin-ом хуки з тією самою назвою.

Gateway пропускає виявлення внутрішніх хуків під час запуску, доки внутрішні хуки не налаштовано. Увімкніть вбудований або керований хук за допомогою `openclaw hooks enable <name>`, встановіть пак хуків або задайте `hooks.internal.enabled=true`, щоб підтвердити використання. Коли ви вмикаєте один іменований хук, Gateway завантажує лише обробник цього хука; `hooks.internal.enabled=true`, додаткові каталоги хуків і застарілі обробники вмикають широке виявлення.

### Пакети хуків

Пакети хуків — це npm-пакети, які експортують хуки через `openclaw.hooks` у `package.json`. Встановлення:

```bash
openclaw plugins install <path-or-spec>
```

Npm-специфікації підтримуються лише для реєстру (назва пакета + необов’язкова точна версія або dist-tag). Специфікації Git/URL/файлів і діапазони semver відхиляються.

## Вбудовані хуки

| Хук                   | Події                          | Що робить                                             |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | Зберігає контекст сесії в `<workspace>/memory/`       |
| bootstrap-extra-files | `agent:bootstrap`              | Впроваджує додаткові bootstrap-файли з glob-шаблонів  |
| command-logger        | `command`                      | Логує всі команди до `~/.openclaw/logs/commands.log`  |
| boot-md               | `gateway:startup`              | Виконує `BOOT.md` під час запуску gateway             |

Увімкнути будь-який вбудований хук:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Докладніше про session-memory

Витягує останні 15 повідомлень користувача/асистента, генерує описовий slug імені файлу через LLM і зберігає його в `<workspace>/memory/YYYY-MM-DD-slug.md`. Потребує налаштованого `workspace.dir`.

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

Шляхи обчислюються відносно workspace. Завантажуються лише розпізнавані bootstrap-базові імена (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Докладніше про command-logger

Логує кожну slash-команду до `~/.openclaw/logs/commands.log`.

<a id="boot-md"></a>

### Докладніше про boot-md

Виконує `BOOT.md` з активного workspace під час запуску gateway.

## Plugin-хуки

Plugin-и можуть реєструвати хуки через Plugin SDK для глибшої інтеграції: перехоплення викликів інструментів, змінення prompt-ів, керування потоком повідомлень тощо. Plugin SDK надає 28 хуків, що охоплюють визначення моделі, життєвий цикл агента, потік повідомлень, виконання інструментів, координацію субагентів і життєвий цикл gateway.

Повний довідник по Plugin-хуках, включно з `before_tool_call`, `before_agent_reply`, `before_install` та всіма іншими Plugin-хуками, див. у [Архітектура Plugin-ів](/uk/plugins/architecture#provider-runtime-hooks).

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

Змінні середовища для кожного хука:

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

## Довідник CLI

```bash
# Перелічити всі хуки (додайте --eligible, --verbose або --json)
openclaw hooks list

# Показати докладну інформацію про хук
openclaw hooks info <hook-name>

# Показати зведення відповідності
openclaw hooks check

# Увімкнути/вимкнути
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## Рекомендовані практики

- **Підтримуйте швидкодію обробників.** Хуки запускаються під час обробки команд. Для важкої роботи використовуйте fire-and-forget через `void processInBackground(event)`.
- **Коректно обробляйте помилки.** Обгортайте ризиковані операції в try/catch; не кидайте винятки, щоб інші обробники могли виконатися.
- **Фільтруйте події якомога раніше.** Негайно повертайтеся, якщо тип/дія події не є релевантними.
- **Використовуйте конкретні ключі подій.** Надавайте перевагу `"events": ["command:new"]` замість `"events": ["command"]`, щоб зменшити накладні витрати.

## Усунення несправностей

### Хук не виявлено

```bash
# Перевірити структуру каталогу
ls -la ~/.openclaw/hooks/my-hook/
# Має показати: HOOK.md, handler.ts

# Перелічити всі виявлені хуки
openclaw hooks list
```

### Хук не відповідає вимогам

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
- [Webhook-и](/uk/automation/cron-jobs#webhooks)
- [Архітектура Plugin-ів](/uk/plugins/architecture#provider-runtime-hooks) — повний довідник по Plugin-хуках
- [Конфігурація](/uk/gateway/configuration-reference#hooks)
