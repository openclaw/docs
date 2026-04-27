---
read_when:
    - Ви хочете автоматизацію на основі подій для `/new`, `/reset`, `/stop` і подій життєвого циклу агента
    - Ви хочете створювати, встановлювати або налагоджувати хуки
summary: 'Хуки: автоматизація на основі подій для команд і подій життєвого циклу'
title: Хуки
x-i18n:
    generated_at: "2026-04-27T12:48:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: a6c567ab79fbff8228d174816e9fb4613f0544ea15a99b5917190a4066af0f57
    source_path: automation/hooks.md
    workflow: 15
---

Хуки — це невеликі скрипти, які запускаються, коли щось відбувається всередині Gateway. Їх можна знаходити в каталогах і переглядати за допомогою `openclaw hooks`. Gateway завантажує внутрішні хуки лише після того, як ви ввімкнете хуки або налаштуєте принаймні один запис хука, пак хука, застарілий обробник чи додатковий каталог хуків.

В OpenClaw є два види хуків:

- **Внутрішні хуки** (ця сторінка): запускаються всередині Gateway, коли спрацьовують події агента, як-от `/new`, `/reset`, `/stop` або події життєвого циклу.
- **Webhooks**: зовнішні HTTP-ендпоїнти, які дають змогу іншим системам запускати роботу в OpenClaw. Див. [Webhooks](/uk/automation/cron-jobs#webhooks).

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

| Подія                    | Коли спрацьовує                                          |
| ------------------------ | -------------------------------------------------------- |
| `command:new`            | Видано команду `/new`                                    |
| `command:reset`          | Видано команду `/reset`                                  |
| `command:stop`           | Видано команду `/stop`                                   |
| `command`                | Будь-яка подія команди (загальний слухач)                |
| `session:compact:before` | До того, як Compaction підсумує історію                  |
| `session:compact:after`  | Після завершення Compaction                              |
| `session:patch`          | Коли властивості сесії змінено                           |
| `agent:bootstrap`        | До того, як буде впроваджено файли bootstrap робочої теки |
| `gateway:startup`        | Після запуску каналів і завантаження хуків               |
| `gateway:shutdown`       | Коли починається завершення роботи gateway               |
| `gateway:pre-restart`    | До очікуваного перезапуску gateway                       |
| `message:received`       | Вхідне повідомлення з будь-якого каналу                  |
| `message:transcribed`    | Після завершення транскрибування аудіо                   |
| `message:preprocessed`   | Після завершення або пропуску попередньої обробки медіа та посилань |
| `message:sent`           | Вихідне повідомлення доставлено                          |

## Написання хуків

### Структура хука

Кожен хук — це каталог, що містить два файли:

```text
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

Тут розміщується детальна документація.
```

**Поля метаданих** (`metadata.openclaw`):

| Поле      | Опис                                                 |
| --------- | ---------------------------------------------------- |
| `emoji`   | Emoji для відображення в CLI                         |
| `events`  | Масив подій, які слід слухати                        |
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

  console.log(`[my-hook] Спрацювала команда new`);
  // Ваша логіка тут

  // За потреби надішліть повідомлення користувачу
  event.messages.push("Хук виконано!");
};

export default handler;
```

Кожна подія містить: `type`, `action`, `sessionKey`, `timestamp`, `messages` (додайте через push, щоб надіслати користувачу), і `context` (дані, специфічні для події). Контексти хуків плагінів агента та інструментів також можуть містити `trace` — контекст діагностичного трасування лише для читання, сумісний із W3C, який плагіни можуть передавати в структуровані журнали для кореляції OTEL.

### Основні елементи контексту подій

**Події команд** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Події повідомлень** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (дані, специфічні для провайдера, зокрема `senderId`, `senderName`, `guildId`).

**Події повідомлень** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Події повідомлень** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Події повідомлень** (`message:preprocessed`): `context.bodyForAgent` (остаточний збагачений вміст), `context.from`, `context.channelId`.

**Події bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (змінюваний масив), `context.agentId`.

**Події patch сесії** (`session:patch`): `context.sessionEntry`, `context.patch` (лише змінені поля), `context.cfg`. Події patch можуть запускати лише привілейовані клієнти.

**Події Compaction**: `session:compact:before` містить `messageCount`, `tokenCount`. `session:compact:after` додатково містить `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` спостерігає за тим, як користувач видає `/stop`; це скасування/життєвий цикл команди, а не бар’єр фіналізації агента. Плагінам, яким потрібно перевірити природну фінальну відповідь і попросити агента зробити ще один прохід, слід натомість використовувати типізований хук плагіна `before_agent_finalize`. Див. [Plugin hooks](/uk/plugins/hooks).

**Події життєвого циклу Gateway**: `gateway:shutdown` містить `reason` і `restartExpectedMs` та спрацьовує, коли починається завершення роботи gateway. `gateway:pre-restart` містить той самий контекст, але спрацьовує лише тоді, коли завершення роботи є частиною очікуваного перезапуску і передано скінченне значення `restartExpectedMs`. Під час завершення роботи очікування кожного хука життєвого циклу є best-effort і обмежене за часом, тому завершення роботи триває навіть якщо обробник зависає.

## Виявлення хуків

Хуки виявляються в таких каталогах у порядку зростання пріоритету перевизначення:

1. **Вбудовані хуки**: постачаються разом з OpenClaw
2. **Хуки плагінів**: хуки, вбудовані у встановлені плагіни
3. **Керовані хуки**: `~/.openclaw/hooks/` (встановлені користувачем, спільні для всіх робочих тек). Додаткові каталоги з `hooks.internal.load.extraDirs` мають той самий пріоритет.
4. **Хуки робочої теки**: `<workspace>/hooks/` (для конкретного агента, типово вимкнені, доки їх явно не ввімкнути)

Хуки робочої теки можуть додавати нові назви хуків, але не можуть перевизначати вбудовані, керовані або надані плагінами хуки з тією самою назвою.

Gateway пропускає виявлення внутрішніх хуків під час запуску, доки внутрішні хуки не будуть налаштовані. Увімкніть вбудований або керований хук за допомогою `openclaw hooks enable <name>`, встановіть пак хука або задайте `hooks.internal.enabled=true`, щоб увімкнути цю можливість. Коли ви вмикаєте один іменований хук, Gateway завантажує лише обробник цього хука; `hooks.internal.enabled=true`, додаткові каталоги хуків і застарілі обробники вмикають широке виявлення.

### Паки хуків

Паки хуків — це npm-пакети, які експортують хуки через `openclaw.hooks` у `package.json`. Встановлення:

```bash
openclaw plugins install <path-or-spec>
```

Npm-специфікації підтримують лише реєстр (назва пакета + необов’язкова точна версія або dist-tag). Git/URL/file-специфікації та діапазони semver відхиляються.

## Вбудовані хуки

| Хук                  | Події                         | Що робить                                           |
| -------------------- | ----------------------------- | --------------------------------------------------- |
| session-memory       | `command:new`, `command:reset` | Зберігає контекст сесії в `<workspace>/memory/`     |
| bootstrap-extra-files | `agent:bootstrap`            | Впроваджує додаткові bootstrap-файли за glob-шаблонами |
| command-logger       | `command`                     | Логує всі команди в `~/.openclaw/logs/commands.log` |
| boot-md              | `gateway:startup`             | Запускає `BOOT.md` під час запуску gateway          |

Увімкнути будь-який вбудований хук:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Докладно про session-memory

Витягує останні 15 повідомлень користувача/асистента, генерує описовий slug назви файлу через LLM і зберігає в `<workspace>/memory/YYYY-MM-DD-slug.md`, використовуючи локальну дату хоста. Потрібно, щоб було налаштовано `workspace.dir`.

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

Шляхи обчислюються відносно робочої теки. Завантажуються лише розпізнані базові назви bootstrap-файлів (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Докладно про command-logger

Логує кожну slash-команду в `~/.openclaw/logs/commands.log`.

<a id="boot-md"></a>

### Докладно про boot-md

Запускає `BOOT.md` з активної робочої теки під час запуску gateway.

## Хуки плагінів

Плагіни можуть реєструвати типізовані хуки через Plugin SDK для глибшої інтеграції:
перехоплення викликів інструментів, зміни промптів, керування потоком повідомлень тощо.
Використовуйте хуки плагінів, коли вам потрібні `before_tool_call`, `before_agent_reply`,
`before_install` або інші внутрішньопроцесні хуки життєвого циклу.

Повний довідник щодо хуків плагінів дивіться в [Plugin hooks](/uk/plugins/hooks).

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

# Показати детальну інформацію про хук
openclaw hooks info <hook-name>

# Показати зведення придатності
openclaw hooks check

# Увімкнути/вимкнути
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## Рекомендовані практики

- **Робіть обробники швидкими.** Хуки запускаються під час обробки команд. Запускайте важку роботу у фоновому режимі без очікування через `void processInBackground(event)`.
- **Коректно обробляйте помилки.** Обгорніть ризиковані операції в try/catch; не викидайте помилки, щоб інші обробники могли виконатися.
- **Фільтруйте події рано.** Одразу повертайтеся, якщо тип/дія події не є релевантними.
- **Використовуйте конкретні ключі подій.** Віддавайте перевагу `"events": ["command:new"]` замість `"events": ["command"]`, щоб зменшити накладні витрати.

## Усунення несправностей

### Хук не виявлено

```bash
# Перевірити структуру каталогу
ls -la ~/.openclaw/hooks/my-hook/
# Має показати: HOOK.md, handler.ts

# Перелічити всі виявлені хуки
openclaw hooks list
```

### Хук не придатний

```bash
openclaw hooks info my-hook
```

Перевірте, чи не бракує бінарних файлів (PATH), змінних середовища, значень конфігурації або сумісності з ОС.

### Хук не виконується

1. Переконайтеся, що хук увімкнено: `openclaw hooks list`
2. Перезапустіть процес gateway, щоб хуки перезавантажилися.
3. Перевірте журнали gateway: `./scripts/clawlog.sh | grep hook`

## Пов’язане

- [Довідник CLI: hooks](/uk/cli/hooks)
- [Webhooks](/uk/automation/cron-jobs#webhooks)
- [Plugin hooks](/uk/plugins/hooks) — внутрішньопроцесні хуки життєвого циклу плагіна
- [Конфігурація](/uk/gateway/configuration-reference#hooks)
