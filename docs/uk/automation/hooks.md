---
read_when:
    - Вам потрібна подієво-керована автоматизація для /new, /reset, /stop і подій життєвого циклу агента
    - Ви хочете створювати, встановлювати або налагоджувати хуки
summary: 'Хуки: подієво-керована автоматизація для команд і подій життєвого циклу'
title: Хуки
x-i18n:
    generated_at: "2026-05-03T13:47:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 15f0d120ccf7314a991da5d66e65e5c78375222a846ba01d7a04ddfe1f02cb32
    source_path: automation/hooks.md
    workflow: 16
---

Hooks — це невеликі скрипти, які запускаються, коли щось відбувається всередині Gateway. Їх можна виявляти з директорій і переглядати за допомогою `openclaw hooks`. Gateway завантажує внутрішні hooks лише після того, як ви ввімкнете hooks або налаштуєте принаймні один запис hook, пакет hook, застарілий обробник чи додаткову директорію hooks.

В OpenClaw є два типи hooks:

- **Внутрішні hooks** (ця сторінка): запускаються всередині Gateway, коли спрацьовують події агента, як-от `/new`, `/reset`, `/stop` або події життєвого циклу.
- **Webhook-и**: зовнішні HTTP endpoint-и, які дають іншим системам змогу запускати роботу в OpenClaw. Див. [Webhook-и](/uk/automation/cron-jobs#webhooks).

Hooks також можуть бути включені до plugins. `openclaw hooks list` показує як окремі hooks, так і hooks, керовані plugins.

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
| ------------------------ | --------------------------------------------------------- |
| `command:new`            | Видано команду `/new`                                     |
| `command:reset`          | Видано команду `/reset`                                   |
| `command:stop`           | Видано команду `/stop`                                    |
| `command`                | Будь-яка подія команди (загальний слухач)                 |
| `session:compact:before` | Перед тим, як compaction підсумовує історію               |
| `session:compact:after`  | Після завершення compaction                               |
| `session:patch`          | Коли змінюються властивості сесії                         |
| `agent:bootstrap`        | Перед вставленням bootstrap-файлів робочого простору      |
| `gateway:startup`        | Після запуску каналів і завантаження hooks                |
| `gateway:shutdown`       | Коли починається завершення роботи gateway                |
| `gateway:pre-restart`    | Перед очікуваним перезапуском gateway                     |
| `message:received`       | Вхідне повідомлення з будь-якого каналу                   |
| `message:transcribed`    | Після завершення транскрипції аудіо                       |
| `message:preprocessed`   | Після завершення або пропуску попередньої обробки медіа й посилань |
| `message:sent`           | Вихідне повідомлення доставлено                           |

## Написання hooks

### Структура hook

Кожен hook — це директорія, що містить два файли:

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

| Поле      | Опис                                                 |
| ---------- | ---------------------------------------------------- |
| `emoji`    | Емодзі для відображення в CLI                        |
| `events`   | Масив подій, які потрібно слухати                    |
| `export`   | Іменований export для використання (за замовчуванням `"default"`) |
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

Кожна подія містить: `type`, `action`, `sessionKey`, `timestamp`, `messages` (додайте елемент, щоб надіслати користувачу), і `context` (дані, специфічні для події). Контексти hooks agents і tool plugins також можуть містити `trace`, діагностичний контекст трасування лише для читання, сумісний із W3C, який plugins можуть передавати в структуровані журнали для кореляції OTEL.

### Основні моменти контексту подій

**Події команд** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Події повідомлень** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (дані, специфічні для провайдера, зокрема `senderId`, `senderName`, `guildId`). `context.content` надає перевагу непорожньому тілу команди для повідомлень, схожих на команди, а потім повертається до сирого вхідного тіла та загального тіла; він не містить збагачення лише для агента, такого як історія треду чи підсумки посилань.

**Події повідомлень** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Події повідомлень** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Події повідомлень** (`message:preprocessed`): `context.bodyForAgent` (фінальне збагачене тіло), `context.from`, `context.channelId`.

**Bootstrap-події** (`agent:bootstrap`): `context.bootstrapFiles` (змінюваний масив), `context.agentId`.

**Події patch сесії** (`session:patch`): `context.sessionEntry`, `context.patch` (лише змінені поля), `context.cfg`. Лише привілейовані клієнти можуть запускати patch-події.

**Події compaction**: `session:compact:before` містить `messageCount`, `tokenCount`. `session:compact:after` додає `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` спостерігає за тим, як користувач видає `/stop`; це життєвий цикл скасування/команди, а не шлюз фіналізації агента. Plugins, яким потрібно переглянути природну фінальну відповідь і попросити агента виконати ще один прохід, мають натомість використовувати типізований plugin hook `before_agent_finalize`. Див. [Plugin hooks](/uk/plugins/hooks).

**Події життєвого циклу Gateway**: `gateway:shutdown` містить `reason` і `restartExpectedMs` та спрацьовує, коли починається завершення роботи gateway. `gateway:pre-restart` містить той самий контекст, але спрацьовує лише тоді, коли завершення роботи є частиною очікуваного перезапуску й надано скінченне значення `restartExpectedMs`. Під час завершення роботи очікування кожного lifecycle hook виконується за принципом best-effort і має обмеження, щоб завершення роботи продовжувалося, якщо обробник зависає.

## Виявлення hooks

Hooks виявляються з цих директорій, у порядку зростання пріоритету перевизначення:

1. **Вбудовані hooks**: постачаються з OpenClaw
2. **Plugin hooks**: hooks, включені до встановлених plugins
3. **Керовані hooks**: `~/.openclaw/hooks/` (встановлені користувачем, спільні для робочих просторів). Додаткові директорії з `hooks.internal.load.extraDirs` мають той самий пріоритет.
4. **Hooks робочого простору**: `<workspace>/hooks/` (для окремого агента, вимкнені за замовчуванням, доки їх явно не ввімкнуть)

Hooks робочого простору можуть додавати нові назви hooks, але не можуть перевизначати вбудовані, керовані або надані plugins hooks із тією самою назвою.

Gateway пропускає виявлення внутрішніх hooks під час запуску, доки внутрішні hooks не налаштовано. Увімкніть вбудований або керований hook за допомогою `openclaw hooks enable <name>`, установіть пакет hook або задайте `hooks.internal.enabled=true`, щоб увімкнути цю можливість. Коли ви вмикаєте один іменований hook, Gateway завантажує лише обробник цього hook; `hooks.internal.enabled=true`, додаткові директорії hooks і застарілі обробники вмикають широке виявлення.

### Пакети hooks

Пакети hooks — це npm-пакети, які експортують hooks через `openclaw.hooks` у `package.json`. Установіть за допомогою:

```bash
openclaw plugins install <path-or-spec>
```

Npm specs обмежені registry-only (назва пакета + необов’язкова точна версія або dist-tag). Git/URL/file specs і діапазони semver відхиляються.

## Вбудовані hooks

| Hook                  | Події                                             | Що робить                                                     |
| --------------------- | ------------------------------------------------- | ------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | Зберігає контекст сесії в `<workspace>/memory/`               |
| bootstrap-extra-files | `agent:bootstrap`                                 | Вставляє додаткові bootstrap-файли з glob-шаблонів            |
| command-logger        | `command`                                         | Журналює всі команди в `~/.openclaw/logs/commands.log`        |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Надсилає видимі повідомлення в чаті, коли compaction сесії починається/завершується |
| boot-md               | `gateway:startup`                                 | Запускає `BOOT.md`, коли gateway стартує                      |

Увімкніть будь-який вбудований hook:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Деталі session-memory

Витягує останні 15 повідомлень користувача/асистента, генерує описовий slug імені файлу через LLM і зберігає в `<workspace>/memory/YYYY-MM-DD-slug.md` з використанням локальної дати хоста. Потрібно, щоб `workspace.dir` було налаштовано.

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

Шляхи вирішуються відносно робочого простору. Завантажуються лише розпізнані базові назви bootstrap-файлів (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Деталі command-logger

Журналює кожну slash-команду в `~/.openclaw/logs/commands.log`.

<a id="compaction-notifier"></a>

### Деталі compaction-notifier

Надсилає короткі статусні повідомлення в поточну розмову, коли OpenClaw починає та завершує compacting транскрипту сесії. Це робить довгі ходи менш заплутаними на чат-поверхнях, бо користувач бачить, що асистент підсумовує контекст і продовжить після compaction.

<a id="boot-md"></a>

### Деталі boot-md

Запускає `BOOT.md` з активного робочого простору, коли gateway стартує.

## Plugin hooks

Plugins можуть реєструвати типізовані hooks через Plugin SDK для глибшої інтеграції:
перехоплення tool calls, змінення prompts, керування потоком повідомлень тощо.
Використовуйте plugin hooks, коли вам потрібні `before_tool_call`, `before_agent_reply`,
`before_install` або інші lifecycle hooks у процесі.

Повний довідник plugin hook див. у [Plugin hooks](/uk/plugins/hooks).

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

Змінні середовища для окремого hook:

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

Додаткові директорії hooks:

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
Застарілий формат конфігурації масиву `hooks.internal.handlers` досі підтримується для зворотної сумісності, але нові hooks мають використовувати систему на основі виявлення.
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

- **Зберігайте обробники швидкими.** Хуки виконуються під час обробки команд. Запускайте важку роботу у фоновому режимі без очікування результату за допомогою `void processInBackground(event)`.
- **Обробляйте помилки коректно.** Обгортайте ризиковані операції в try/catch; не кидайте винятки, щоб інші обробники могли виконатися.
- **Фільтруйте події якомога раніше.** Негайно повертайтеся, якщо тип/дія події не релевантні.
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

### Хук не придатний

```bash
openclaw hooks info my-hook
```

Перевірте відсутні двійкові файли (PATH), змінні середовища, значення конфігурації або сумісність з ОС.

### Хук не виконується

1. Переконайтеся, що хук увімкнено: `openclaw hooks list`
2. Перезапустіть процес Gateway, щоб хуки перезавантажилися.
3. Перевірте логи Gateway: `./scripts/clawlog.sh | grep hook`

## Пов’язане

- [Довідник CLI: хуки](/uk/cli/hooks)
- [Webhook-и](/uk/automation/cron-jobs#webhooks)
- [Хуки Plugin](/uk/plugins/hooks) — внутрішньопроцесні хуки життєвого циклу Plugin
- [Конфігурація](/uk/gateway/configuration-reference#hooks)
