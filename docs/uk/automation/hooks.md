---
read_when:
    - Ви хочете автоматизацію на основі подій для `/new`, `/reset`, `/stop` і подій життєвого циклу агента
    - Ви хочете створити, встановити або налагодити хуки
summary: 'Хуки: автоматизація на основі подій для команд і подій життєвого циклу'
title: Хуки
x-i18n:
    generated_at: "2026-04-26T00:29:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: cf40a64449347ef750b4b0e0a83b80e2e8fdef87d92daa71f028d2bf6a3d3d22
    source_path: automation/hooks.md
    workflow: 15
---

Хуки — це невеликі скрипти, які запускаються, коли щось відбувається всередині Gateway. Їх можна виявляти з каталогів і переглядати через `openclaw hooks`. Gateway завантажує внутрішні хуки лише після того, як ви ввімкнете хуки або налаштуєте принаймні один запис хука, пак хука, застарілий обробник чи додатковий каталог хуків.

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

# Перевірити статус хуків
openclaw hooks check

# Отримати докладну інформацію
openclaw hooks info session-memory
```

## Типи подій

| Подія                    | Коли спрацьовує                              |
| ------------------------ | -------------------------------------------- |
| `command:new`            | Надіслано команду `/new`                     |
| `command:reset`          | Надіслано команду `/reset`                   |
| `command:stop`           | Надіслано команду `/stop`                    |
| `command`                | Будь-яка подія команди (загальний слухач)    |
| `session:compact:before` | Перед тим, як Compaction підсумує історію    |
| `session:compact:after`  | Після завершення Compaction                  |
| `session:patch`          | Коли властивості сесії змінюються            |
| `agent:bootstrap`        | Перед вставленням bootstrap-файлів робочої області |
| `gateway:startup`        | Після запуску каналів і завантаження хуків   |
| `message:received`       | Вхідне повідомлення з будь-якого каналу      |
| `message:transcribed`    | Після завершення транскрибування аудіо       |
| `message:preprocessed`   | Після завершення обробки всіх медіа й посилань |
| `message:sent`           | Вихідне повідомлення доставлено              |

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

| Поле      | Опис                                                 |
| --------- | ---------------------------------------------------- |
| `emoji`   | Емодзі для відображення в CLI                        |
| `events`  | Масив подій, які потрібно слухати                    |
| `export`  | Іменований експорт для використання (типово `"default"`) |
| `os`      | Обов’язкові платформи (наприклад, `["darwin", "linux"]`) |
| `requires` | Обов’язкові `bins`, `anyBins`, `env` або шляхи `config` |
| `always`  | Обійти перевірки придатності (boolean)               |
| `install` | Методи встановлення                                  |

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

Кожна подія містить: `type`, `action`, `sessionKey`, `timestamp`, `messages` (додавайте через push, щоб надіслати користувачу), і `context` (специфічні для події дані). Контексти хуків агентів і інструментальних плагінів також можуть містити `trace` — лише для читання W3C-сумісний діагностичний контекст трасування, який плагіни можуть передавати до структурованих логів для кореляції OTEL.

### Основні моменти контексту подій

**Події команд** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Події повідомлень** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (специфічні для провайдера дані, зокрема `senderId`, `senderName`, `guildId`).

**Події повідомлень** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Події повідомлень** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Події повідомлень** (`message:preprocessed`): `context.bodyForAgent` (остаточний збагачений вміст), `context.from`, `context.channelId`.

**Події Bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (змінюваний масив), `context.agentId`.

**Події patch сесії** (`session:patch`): `context.sessionEntry`, `context.patch` (лише змінені поля), `context.cfg`. Лише привілейовані клієнти можуть ініціювати події patch.

**Події Compaction**: `session:compact:before` включає `messageCount`, `tokenCount`. `session:compact:after` додатково містить `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` спостерігає за тим, як користувач надсилає `/stop`; це стосується скасування/життєвого циклу команди, а не завершення роботи агента. Плагіни, яким потрібно перевірити природну фінальну відповідь і попросити агента зробити ще один прохід, мають використовувати типізований хук плагіна `before_agent_finalize`. Див. [Plugin hooks](/uk/plugins/hooks).

## Виявлення хуків

Хуки виявляються з цих каталогів у порядку зростання пріоритету перевизначення:

1. **Вбудовані хуки**: постачаються з OpenClaw
2. **Хуки плагінів**: хуки, вбудовані у встановлені плагіни
3. **Керовані хуки**: `~/.openclaw/hooks/` (встановлені користувачем, спільні для всіх робочих областей). Додаткові каталоги з `hooks.internal.load.extraDirs` мають той самий пріоритет.
4. **Хуки робочої області**: `<workspace>/hooks/` (для окремого агента, типово вимкнені, доки їх явно не ввімкнути)

Хуки робочої області можуть додавати нові назви хуків, але не можуть перевизначати вбудовані, керовані або надані плагінами хуки з тією самою назвою.

Gateway пропускає виявлення внутрішніх хуків під час запуску, доки внутрішні хуки не буде налаштовано. Увімкніть вбудований або керований хук через `openclaw hooks enable <name>`, встановіть пак хуків або задайте `hooks.internal.enabled=true`, щоб явно ввімкнути цю можливість. Коли ви вмикаєте один іменований хук, Gateway завантажує лише обробник цього хука; `hooks.internal.enabled=true`, додаткові каталоги хуків і застарілі обробники вмикають широке виявлення.

### Паки хуків

Паки хуків — це npm-пакети, які експортують хуки через `openclaw.hooks` у `package.json`. Встановлення:

```bash
openclaw plugins install <path-or-spec>
```

Npm-специфікації підтримуються лише для реєстру (назва пакета + необов’язкова точна версія або dist-tag). Git/URL/file-специфікації та semver-діапазони відхиляються.

## Вбудовані хуки

| Хук                  | Події                         | Що робить                                             |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | Зберігає контекст сесії в `<workspace>/memory/`       |
| bootstrap-extra-files | `agent:bootstrap`              | Вставляє додаткові bootstrap-файли за glob-шаблонами  |
| command-logger        | `command`                      | Логує всі команди в `~/.openclaw/logs/commands.log`   |
| boot-md               | `gateway:startup`              | Виконує `BOOT.md` під час запуску gateway             |

Увімкніть будь-який вбудований хук:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Докладно про session-memory

Витягує останні 15 повідомлень користувача/асистента, генерує описовий slug імені файла через LLM і зберігає його в `<workspace>/memory/YYYY-MM-DD-slug.md`. Потребує налаштованого `workspace.dir`.

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

Шляхи обчислюються відносно робочої області. Завантажуються лише розпізнані базові назви bootstrap-файлів (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Докладно про command-logger

Логує кожну slash-команду в `~/.openclaw/logs/commands.log`.

<a id="boot-md"></a>

### Докладно про boot-md

Виконує `BOOT.md` з активної робочої області під час запуску gateway.

## Хуки плагінів

Плагіни можуть реєструвати типізовані хуки через Plugin SDK для глибшої інтеграції:
перехоплення викликів інструментів, зміни промптів, керування потоком повідомлень тощо.
Використовуйте хуки плагінів, коли вам потрібні `before_tool_call`, `before_agent_reply`,
`before_install` або інші внутрішньопроцесні хуки життєвого циклу.

Повний довідник по хуках плагінів див. у [Plugin hooks](/uk/plugins/hooks).

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
Застарілий формат конфігурації масиву `hooks.internal.handlers` усе ще підтримується для зворотної сумісності, але нові хуки мають використовувати систему на основі виявлення.
</Note>

## Довідник CLI

```bash
# Перелічити всі хуки (додайте --eligible, --verbose або --json)
openclaw hooks list

# Показати докладну інформацію про хук
openclaw hooks info <hook-name>

# Показати зведення придатності
openclaw hooks check

# Увімкнути/вимкнути
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## Найкращі практики

- **Підтримуйте швидку роботу обробників.** Хуки виконуються під час обробки команд. Для важкої роботи використовуйте fire-and-forget через `void processInBackground(event)`.
- **Коректно обробляйте помилки.** Обгортайте ризиковані операції в try/catch; не кидайте винятки, щоб інші обробники теж могли виконатися.
- **Фільтруйте події якомога раніше.** Відразу повертайтеся, якщо тип/дія події не стосується вашого випадку.
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
- [Plugin hooks](/uk/plugins/hooks) — внутрішньопроцесні хуки життєвого циклу плагіна
- [Конфігурація](/uk/gateway/configuration-reference#hooks)
