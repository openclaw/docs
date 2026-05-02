---
read_when:
    - Вам потрібна автоматизація, керована подіями, для /new, /reset, /stop і подій життєвого циклу агента
    - Ви хочете створювати, встановлювати або налагоджувати хуки
summary: 'Хуки: подієво-орієнтована автоматизація для команд і подій життєвого циклу'
title: Хуки
x-i18n:
    generated_at: "2026-05-02T10:47:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 00ebf65dce03c8643fc1eac84c3915aaa00133c7f007a22483a845e61f055d6b
    source_path: automation/hooks.md
    workflow: 16
---

Хуки — це невеликі скрипти, які запускаються, коли щось відбувається всередині Gateway. Їх можна виявляти в каталогах і переглядати за допомогою `openclaw hooks`. Gateway завантажує внутрішні хуки лише після того, як ви ввімкнете хуки або налаштуєте принаймні один запис хука, пакет хуків, застарілий обробник чи додатковий каталог хуків.

В OpenClaw є два типи хуків:

- **Внутрішні хуки** (ця сторінка): запускаються всередині Gateway, коли спрацьовують події агента, як-от `/new`, `/reset`, `/stop` або події життєвого циклу.
- **Webhooks**: зовнішні HTTP-ендпоїнти, які дають іншим системам змогу запускати роботу в OpenClaw. Див. [Webhooks](/uk/automation/cron-jobs#webhooks).

Хуки також можуть постачатися в складі plugins. `openclaw hooks list` показує як автономні хуки, так і хуки, керовані plugins.

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
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | Видано команду `/new`                                      |
| `command:reset`          | Видано команду `/reset`                                    |
| `command:stop`           | Видано команду `/stop`                                     |
| `command`                | Будь-яка подія команди (загальний слухач)                  |
| `session:compact:before` | Перед тим як Compaction підсумовує історію                 |
| `session:compact:after`  | Після завершення Compaction                                |
| `session:patch`          | Коли змінено властивості сесії                             |
| `agent:bootstrap`        | Перед впровадженням файлів початкового налаштування робочого простору |
| `gateway:startup`        | Після запуску каналів і завантаження хуків                 |
| `gateway:shutdown`       | Коли починається вимкнення Gateway                         |
| `gateway:pre-restart`    | Перед очікуваним перезапуском Gateway                      |
| `message:received`       | Вхідне повідомлення з будь-якого каналу                    |
| `message:transcribed`    | Після завершення транскрибування аудіо                     |
| `message:preprocessed`   | Після завершення або пропуску попередньої обробки медіа й посилань |
| `message:sent`           | Вихідне повідомлення доставлено                            |

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

| Поле      | Опис                                                  |
| ---------- | ---------------------------------------------------- |
| `emoji`    | Емодзі для відображення в CLI                        |
| `events`   | Масив подій, які потрібно слухати                    |
| `export`   | Іменований експорт для використання (типово `"default"`) |
| `os`       | Потрібні платформи (наприклад, `["darwin", "linux"]`) |
| `requires` | Потрібні шляхи `bins`, `anyBins`, `env` або `config` |
| `always`   | Обійти перевірки придатності (булеве значення)       |
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

Кожна подія містить: `type`, `action`, `sessionKey`, `timestamp`, `messages` (додайте елемент, щоб надіслати користувачу), і `context` (дані, специфічні для події). Контексти хуків agents і tool plugins також можуть містити `trace` — діагностичний контекст трасування лише для читання, сумісний із W3C, який plugins можуть передавати в структуровані журнали для кореляції OTEL.

### Основні моменти контексту подій

**Події команд** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Події повідомлень** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (дані, специфічні для провайдера, зокрема `senderId`, `senderName`, `guildId`). `context.content` віддає перевагу непорожньому тілу команди для повідомлень, схожих на команди, потім повертається до сирого вхідного тіла та загального тіла; воно не містить збагачення лише для агента, як-от історії гілки або підсумків посилань.

**Події повідомлень** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Події повідомлень** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Події повідомлень** (`message:preprocessed`): `context.bodyForAgent` (кінцеве збагачене тіло), `context.from`, `context.channelId`.

**Події початкового налаштування** (`agent:bootstrap`): `context.bootstrapFiles` (змінюваний масив), `context.agentId`.

**Події латання сесії** (`session:patch`): `context.sessionEntry`, `context.patch` (лише змінені поля), `context.cfg`. Лише привілейовані клієнти можуть запускати події латання.

**Події Compaction**: `session:compact:before` містить `messageCount`, `tokenCount`. `session:compact:after` додає `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` фіксує, що користувач видає `/stop`; це життєвий цикл скасування/команди, а не шлюз фіналізації агента. Plugins, яким потрібно перевірити природну фінальну відповідь і попросити агента виконати ще один прохід, повинні натомість використовувати типізований хук plugin `before_agent_finalize`. Див. [Хуки plugins](/uk/plugins/hooks).

**Події життєвого циклу Gateway**: `gateway:shutdown` містить `reason` і `restartExpectedMs` та спрацьовує, коли починається вимкнення Gateway. `gateway:pre-restart` містить той самий контекст, але спрацьовує лише тоді, коли вимкнення є частиною очікуваного перезапуску й надано скінченне значення `restartExpectedMs`. Під час вимкнення очікування кожного хука життєвого циклу виконується за принципом найкращих зусиль і має обмеження, щоб вимкнення продовжилося, якщо обробник зависне.

## Виявлення хуків

Хуки виявляються з цих каталогів у порядку зростання пріоритету перевизначення:

1. **Вбудовані хуки**: постачаються з OpenClaw
2. **Хуки plugins**: хуки, що постачаються всередині встановлених plugins
3. **Керовані хуки**: `~/.openclaw/hooks/` (установлені користувачем, спільні для робочих просторів). Додаткові каталоги з `hooks.internal.load.extraDirs` мають той самий пріоритет.
4. **Хуки робочого простору**: `<workspace>/hooks/` (для окремого агента, вимкнені за замовчуванням, доки їх явно не ввімкнуть)

Хуки робочого простору можуть додавати нові імена хуків, але не можуть перевизначати вбудовані, керовані або надані plugins хуки з тим самим іменем.

Gateway пропускає виявлення внутрішніх хуків під час запуску, доки внутрішні хуки не налаштовано. Увімкніть вбудований або керований хук за допомогою `openclaw hooks enable <name>`, установіть пакет хуків або задайте `hooks.internal.enabled=true`, щоб увімкнути цю можливість. Коли ви вмикаєте один іменований хук, Gateway завантажує лише обробник цього хука; `hooks.internal.enabled=true`, додаткові каталоги хуків і застарілі обробники вмикають широке виявлення.

### Пакети хуків

Пакети хуків — це npm-пакети, які експортують хуки через `openclaw.hooks` у `package.json`. Установлення:

```bash
openclaw plugins install <path-or-spec>
```

Специфікації Npm доступні лише з реєстру (назва пакета + необов’язкова точна версія або dist-tag). Специфікації Git/URL/file і діапазони semver відхиляються.

## Вбудовані хуки

| Хук                   | Події                          | Що робить                                             |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | Зберігає контекст сеансу до `<workspace>/memory/`     |
| bootstrap-extra-files | `agent:bootstrap`              | Додає додаткові bootstrap-файли з glob-шаблонів       |
| command-logger        | `command`                      | Записує всі команди до `~/.openclaw/logs/commands.log` |
| boot-md               | `gateway:startup`              | Запускає `BOOT.md`, коли Gateway стартує              |

Увімкнути будь-який вбудований хук:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Подробиці session-memory

Витягує останні 15 повідомлень користувача/асистента, генерує описовий slug імені файлу через LLM і зберігає до `<workspace>/memory/YYYY-MM-DD-slug.md`, використовуючи локальну дату хоста. Потрібно налаштувати `workspace.dir`.

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

Шляхи визначаються відносно workspace. Завантажуються лише розпізнані базові імена bootstrap-файлів (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Подробиці command-logger

Записує кожну slash-команду до `~/.openclaw/logs/commands.log`.

<a id="boot-md"></a>

### Подробиці boot-md

Запускає `BOOT.md` з активного workspace, коли Gateway стартує.

## Plugin-хуки

Plugin-и можуть реєструвати типізовані хуки через Plugin SDK для глибшої інтеграції:
перехоплення викликів інструментів, змінення промптів, керування потоком повідомлень тощо.
Використовуйте Plugin-хуки, коли потрібні `before_tool_call`, `before_agent_reply`,
`before_install` або інші lifecycle-хуки в межах процесу.

Повний довідник Plugin-хуків див. у [Plugin-хуки](/uk/plugins/hooks).

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

- **Тримайте обробники швидкими.** Хуки виконуються під час обробки команд. Запускайте важку роботу у фоновому режимі без очікування через `void processInBackground(event)`.
- **Обробляйте помилки коректно.** Обгортайте ризиковані операції в try/catch; не кидайте винятки, щоб інші обробники могли виконатися.
- **Фільтруйте події якомога раніше.** Негайно повертайтеся, якщо тип/дія події не релевантні.
- **Використовуйте конкретні ключі подій.** Віддавайте перевагу `"events": ["command:new"]` замість `"events": ["command"]`, щоб зменшити накладні витрати.

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

Перевірте відсутні двійкові файли (PATH), змінні середовища, значення конфігурації або сумісність з ОС.

### Хук не виконується

1. Переконайтеся, що хук увімкнено: `openclaw hooks list`
2. Перезапустіть процес Gateway, щоб хуки перезавантажилися.
3. Перевірте журнали Gateway: `./scripts/clawlog.sh | grep hook`

## Пов’язане

- [Довідник CLI: хуки](/uk/cli/hooks)
- [Webhooks](/uk/automation/cron-jobs#webhooks)
- [Хуки Plugin](/uk/plugins/hooks) — внутрішньопроцесні хуки життєвого циклу Plugin
- [Конфігурація](/uk/gateway/configuration-reference#hooks)
