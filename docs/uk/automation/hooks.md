---
read_when:
    - Вам потрібна автоматизація на основі подій для `/new`, `/reset`, `/stop` і подій життєвого циклу агента
    - Ви хочете створити, встановити або налагодити хуки
summary: 'Хуки: автоматизація на основі подій для команд і подій життєвого циклу'
title: Хуки
x-i18n:
    generated_at: "2026-04-20T18:52:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 16ce72899cc0eb4366c3a1d0a18da51aa8ce26d16ccc98efb975f2ad7269efd1
    source_path: automation/hooks.md
    workflow: 15
---

# Хуки

Хуки — це невеликі скрипти, які запускаються, коли щось відбувається всередині Gateway. Їх можна виявляти з директорій та переглядати через `openclaw hooks`. Gateway завантажує внутрішні хуки лише після того, як ви ввімкнете хуки або налаштуєте принаймні один запис хука, пакунок хуків, застарілий обробник чи додаткову директорію хуків.

В OpenClaw є два типи хуків:

- **Внутрішні хуки** (ця сторінка): запускаються всередині Gateway, коли спрацьовують події агента, наприклад `/new`, `/reset`, `/stop` або події життєвого циклу.
- **Webhooks**: зовнішні HTTP-ендпоїнти, які дозволяють іншим системам запускати роботу в OpenClaw. Див. [Webhooks](/uk/automation/cron-jobs#webhooks).

Хуки також можуть постачатися в складі plugin. `openclaw hooks list` показує як окремі хуки, так і хуки, якими керують plugin.

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
| `command:new`            | Видано команду `/new`                           |
| `command:reset`          | Видано команду `/reset`                         |
| `command:stop`           | Видано команду `/stop`                          |
| `command`                | Будь-яка подія команди (загальний слухач)       |
| `session:compact:before` | Перед тим, як Compaction підсумує історію       |
| `session:compact:after`  | Після завершення Compaction                     |
| `session:patch`          | Коли змінюються властивості сесії               |
| `agent:bootstrap`        | Перед впровадженням bootstrap-файлів workspace  |
| `gateway:startup`        | Після запуску каналів і завантаження хуків      |
| `message:received`       | Вхідне повідомлення з будь-якого каналу         |
| `message:transcribed`    | Після завершення транскрибування аудіо          |
| `message:preprocessed`   | Після завершення обробки всіх медіа та посилань |
| `message:sent`           | Вихідне повідомлення доставлено                 |

## Написання хуків

### Структура хука

Кожен хук — це директорія з двома файлами:

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

| Поле       | Опис                                                 |
| ---------- | ---------------------------------------------------- |
| `emoji`    | Emoji для відображення в CLI                         |
| `events`   | Масив подій, які потрібно прослуховувати             |
| `export`   | Іменований експорт для використання (типово `"default"`) |
| `os`       | Потрібні платформи (наприклад, `["darwin", "linux"]`) |
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

### Основні дані context подій

**Події команд** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Події повідомлень** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (дані, специфічні для провайдера, зокрема `senderId`, `senderName`, `guildId`).

**Події повідомлень** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Події повідомлень** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Події повідомлень** (`message:preprocessed`): `context.bodyForAgent` (кінцеве збагачене тіло), `context.from`, `context.channelId`.

**Події bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (змінюваний масив), `context.agentId`.

**Події patch сесії** (`session:patch`): `context.sessionEntry`, `context.patch` (лише змінені поля), `context.cfg`. Лише привілейовані клієнти можуть ініціювати події patch.

**Події Compaction**: `session:compact:before` містить `messageCount`, `tokenCount`. `session:compact:after` додатково містить `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

## Виявлення хуків

Хуки виявляються з таких директорій у порядку зростання пріоритету перевизначення:

1. **Вбудовані хуки**: постачаються разом з OpenClaw
2. **Хуки plugin**: хуки, вбудовані у встановлені plugin
3. **Керовані хуки**: `~/.openclaw/hooks/` (встановлюються користувачем, спільні для всіх workspace). Додаткові директорії з `hooks.internal.load.extraDirs` мають той самий пріоритет.
4. **Хуки workspace**: `<workspace>/hooks/` (для окремого агента, типово вимкнені, доки їх явно не ввімкнуть)

Хуки workspace можуть додавати нові імена хуків, але не можуть перевизначати вбудовані, керовані або надані plugin хуки з тією самою назвою.

Gateway пропускає виявлення внутрішніх хуків під час запуску, доки внутрішні хуки не буде налаштовано. Увімкніть вбудований або керований хук через `openclaw hooks enable <name>`, встановіть пакунок хуків або задайте `hooks.internal.enabled=true`, щоб увімкнути цю можливість.

### Пакунки хуків

Пакунки хуків — це npm-пакети, які експортують хуки через `openclaw.hooks` у `package.json`. Встановлення:

```bash
openclaw plugins install <path-or-spec>
```

Npm-специфікації підтримуються лише для реєстру (назва пакета + необов’язкова точна версія або dist-tag). Специфікації Git/URL/file та діапазони semver відхиляються.

## Вбудовані хуки

| Хук                  | Події                         | Що робить                                              |
| -------------------- | ----------------------------- | ------------------------------------------------------ |
| session-memory       | `command:new`, `command:reset` | Зберігає контекст сесії в `<workspace>/memory/`        |
| bootstrap-extra-files | `agent:bootstrap`             | Впроваджує додаткові bootstrap-файли за glob-шаблонами |
| command-logger       | `command`                     | Логує всі команди в `~/.openclaw/logs/commands.log`    |
| boot-md              | `gateway:startup`             | Запускає `BOOT.md`, коли стартує gateway               |

Увімкнення будь-якого вбудованого хука:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Подробиці session-memory

Витягує останні 15 повідомлень користувача/асистента, генерує описовий slug назви файлу через LLM і зберігає в `<workspace>/memory/YYYY-MM-DD-slug.md`. Потребує налаштованого `workspace.dir`.

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

Шляхи обчислюються відносно workspace. Завантажуються лише розпізнавані базові назви bootstrap-файлів (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Подробиці command-logger

Логує кожну slash-команду в `~/.openclaw/logs/commands.log`.

<a id="boot-md"></a>

### Подробиці boot-md

Запускає `BOOT.md` з активного workspace під час старту gateway.

## Хуки plugin

Plugin можуть реєструвати хуки через Plugin SDK для глибшої інтеграції: перехоплення викликів інструментів, зміни prompt, керування потоком повідомлень тощо. Plugin SDK надає 28 хуків, що охоплюють визначення моделі, життєвий цикл агента, потік повідомлень, виконання інструментів, координацію субагентів і життєвий цикл gateway.

Повний довідник по хуках plugin, зокрема `before_tool_call`, `before_agent_reply`, `before_install` та всі інші хуки plugin, див. у [Архітектура plugin](/uk/plugins/architecture#provider-runtime-hooks).

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

# Показати докладну інформацію про хук
openclaw hooks info <hook-name>

# Показати зведення про придатність
openclaw hooks check

# Увімкнути/вимкнути
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## Рекомендовані практики

- **Підтримуйте швидкість обробників.** Хуки виконуються під час обробки команд. Запускайте важкі завдання у фоновому режимі без очікування через `void processInBackground(event)`.
- **Коректно обробляйте помилки.** Обгорніть ризиковані операції в try/catch; не кидайте винятки, щоб інші обробники могли виконатися.
- **Рано фільтруйте події.** Відразу повертайтеся, якщо тип/дія події не є релевантними.
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

Перевірте, чи не бракує бінарних файлів (PATH), змінних середовища, значень конфігурації або сумісності з ОС.

### Хук не виконується

1. Переконайтеся, що хук увімкнено: `openclaw hooks list`
2. Перезапустіть процес gateway, щоб хуки перезавантажилися.
3. Перевірте логи gateway: `./scripts/clawlog.sh | grep hook`

## Пов’язане

- [Довідник CLI: hooks](/cli/hooks)
- [Webhooks](/uk/automation/cron-jobs#webhooks)
- [Архітектура plugin](/uk/plugins/architecture#provider-runtime-hooks) — повний довідник по хуках plugin
- [Конфігурація](/uk/gateway/configuration-reference#hooks)
