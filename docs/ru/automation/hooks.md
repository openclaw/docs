---
read_when:
    - Вы хотите событийно-управляемую автоматизацию для /new, /reset, /stop и событий жизненного цикла агента
    - Вы хотите собрать, установить или отладить хуки
summary: 'Хуки: событийно-ориентированная автоматизация для команд и событий жизненного цикла'
title: Хуки
x-i18n:
    generated_at: "2026-06-28T22:32:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0259739b0547ba4826b540d392c6d6b72c6bec24fd50d5e297817694fd728438
    source_path: automation/hooks.md
    workflow: 16
---

Хуки — это небольшие скрипты, которые запускаются, когда внутри Gateway что-то происходит. Их можно обнаруживать в каталогах и просматривать с помощью `openclaw hooks`. Gateway загружает внутренние хуки только после того, как вы включите хуки или настроите хотя бы одну запись хука, пакет хуков, устаревший обработчик или дополнительный каталог хуков.

В OpenClaw есть два вида хуков:

- **Внутренние хуки** (эта страница): запускаются внутри Gateway при событиях агента, таких как `/new`, `/reset`, `/stop`, или событиях жизненного цикла.
- **Webhook**: внешние HTTP-эндпоинты, которые позволяют другим системам запускать работу в OpenClaw. См. [Webhook](/ru/automation/cron-jobs#webhooks).

Хуки также могут поставляться внутри Plugin. `openclaw hooks list` показывает как отдельные хуки, так и хуки, управляемые Plugin.

## Выберите подходящую поверхность

В OpenClaw есть несколько поверхностей расширения, которые выглядят похоже, но решают разные задачи:

| Если вы хотите...                                                                                                     | Используйте...                        | Почему                                                                                       |
| --------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------- |
| Сохранить снимок при `/new`, записать `/reset` в журнал, вызвать внешний API после `message:sent` или добавить грубую операторскую автоматизацию | Внутренние хуки (`HOOK.md`, эта страница) | Файловые хуки предназначены для управляемых оператором побочных эффектов и автоматизации команд/жизненного цикла |
| Переписывать промпты, блокировать инструменты, отменять исходящие сообщения или добавлять упорядоченное middleware/политики | Типизированные хуки Plugin через `api.on(...)` | Типизированные хуки имеют явные контракты, приоритеты, правила слияния и семантику блокировки/отмены |
| Добавить экспорт только для телеметрии или наблюдаемость                                                               | Диагностические события               | Наблюдаемость — это отдельная шина событий, а не поверхность хуков политик                    |

Используйте внутренние хуки, когда вам нужна автоматизация, которая ведет себя как небольшая установленная интеграция. Используйте типизированные хуки Plugin, когда нужен контроль жизненного цикла во время выполнения.

## Быстрый старт

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

## Типы событий

| Событие                  | Когда срабатывает                                        |
| ------------------------ | -------------------------------------------------------- |
| `command:new`            | Выдана команда `/new`                                    |
| `command:reset`          | Выдана команда `/reset`                                  |
| `command:stop`           | Выдана команда `/stop`                                   |
| `command`                | Любое событие команды (общий слушатель)                  |
| `session:compact:before` | Перед тем как Compaction суммирует историю               |
| `session:compact:after`  | После завершения Compaction                              |
| `session:patch`          | Когда изменяются свойства сессии                         |
| `agent:bootstrap`        | Перед внедрением файлов начальной настройки рабочей области |
| `gateway:startup`        | После запуска каналов и загрузки хуков                   |
| `gateway:shutdown`       | Когда начинается завершение работы Gateway               |
| `gateway:pre-restart`    | Перед ожидаемым перезапуском Gateway                     |
| `message:received`       | Входящее сообщение из любого канала                      |
| `message:transcribed`    | После завершения транскрибации аудио                     |
| `message:preprocessed`   | После завершения или пропуска предварительной обработки медиа и ссылок |
| `message:sent`           | Исходящее сообщение доставлено                           |

## Написание хуков

### Структура хука

Каждый хук — это каталог, содержащий два файла:

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

**Поля метаданных** (`metadata.openclaw`):

| Поле       | Описание                                             |
| ---------- | ---------------------------------------------------- |
| `emoji`    | Emoji для отображения в CLI                          |
| `events`   | Массив событий для прослушивания                     |
| `export`   | Именованный экспорт для использования (по умолчанию `"default"`) |
| `os`       | Требуемые платформы (например, `["darwin", "linux"]`) |
| `requires` | Требуемые пути `bins`, `anyBins`, `env` или `config` |
| `always`   | Обход проверок пригодности (логическое значение)     |
| `install`  | Методы установки                                     |

### Реализация обработчика

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // Your logic here

  // Optionally send a reply on replyable surfaces
  event.messages.push("Hook executed!");
};

export default handler;
```

Каждое событие включает: `type`, `action`, `sessionKey`, `timestamp`, `messages` (добавляйте сюда ответы только на поверхностях, поддерживающих ответы) и `context` (данные, специфичные для события). Контексты хуков агента и инструментального Plugin также могут включать `trace` — доступный только для чтения W3C-совместимый диагностический контекст трассировки, который Plugin могут передавать в структурированные журналы для корреляции OTEL.

`event.messages` доставляется автоматически только на поверхностях, поддерживающих ответы, таких как
`command:*` и `message:received`. События только жизненного цикла, такие как
`agent:bootstrap`, `session:*`, `gateway:*` или `message:sent`, не имеют
канала ответа и игнорируют добавленные сообщения.

### Основные сведения о контексте событий

**События команд** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**События сообщений** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (данные, специфичные для провайдера, включая `senderId`, `senderName`, `guildId`). `context.content` предпочитает непустое тело команды для сообщений, похожих на команды, затем откатывается к необработанному входящему телу и универсальному телу; оно не включает обогащение только для агента, такое как история треда или сводки ссылок.

**События сообщений** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**События сообщений** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**События сообщений** (`message:preprocessed`): `context.bodyForAgent` (итоговое обогащенное тело), `context.from`, `context.channelId`.

**События начальной настройки** (`agent:bootstrap`): `context.bootstrapFiles` (изменяемый массив), `context.agentId`.

**События исправления сессии** (`session:patch`): `context.sessionEntry`, `context.patch` (только измененные поля), `context.cfg`. Только привилегированные клиенты могут запускать события исправления.

**События Compaction**: `session:compact:before` включает `messageCount`, `tokenCount`. `session:compact:after` добавляет `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` наблюдает, что пользователь выдал `/stop`; это жизненный цикл отмены/команды,
а не шлюз финализации агента. Plugin, которым нужно проверить
естественный финальный ответ и попросить агента сделать еще один проход, должны использовать типизированный
хук Plugin `before_agent_finalize`. См. [Хуки Plugin](/ru/plugins/hooks).

**События жизненного цикла Gateway**: `gateway:shutdown` включает `reason` и `restartExpectedMs` и срабатывает, когда начинается завершение работы Gateway. `gateway:pre-restart` включает тот же контекст, но срабатывает только тогда, когда завершение работы является частью ожидаемого перезапуска и предоставлено конечное значение `restartExpectedMs`. Во время завершения работы ожидание каждого хука жизненного цикла выполняется по принципу best-effort и ограничено, чтобы завершение продолжалось, если обработчик зависнет. Бюджет ожидания по умолчанию составляет 5 секунд для `gateway:shutdown` и 10 секунд для `gateway:pre-restart`.

Используйте `gateway:pre-restart` для коротких уведомлений о перезапуске, пока каналы еще доступны:

```typescript
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export default async function handler(event) {
  if (event.type !== "gateway" || event.action !== "pre-restart") {
    return;
  }

  const restartInSeconds = Math.ceil(event.context.restartExpectedMs / 1000);
  await execFileAsync("openclaw", [
    "system",
    "event",
    "--mode",
    "now",
    "--text",
    `Gateway restarting in ~${restartInSeconds}s (${event.context.reason}). Checkpoint now.`,
  ]);
}
```

Между событием `gateway:shutdown` (или `gateway:pre-restart`) и остальной последовательностью завершения gateway также запускает типизированный хук Plugin `session_end` для каждой сессии, которая все еще была активна при остановке процесса. `reason` события равен `shutdown` для обычной остановки SIGTERM/SIGINT и `restart`, когда закрытие было запланировано как часть ожидаемого перезапуска. Этот drain ограничен, поэтому медленный обработчик `session_end` не может заблокировать выход процесса, а сессии, которые уже были финализированы через replace / reset / delete / compaction, пропускаются, чтобы избежать двойного срабатывания.

## Обнаружение хуков

Хуки обнаруживаются в этих каталогах, в порядке возрастания приоритета переопределения:

1. **Встроенные хуки**: поставляются с OpenClaw
2. **Хуки Plugin**: хуки, поставляемые внутри установленных Plugin
3. **Управляемые хуки**: `~/.openclaw/hooks/` (установленные пользователем, общие для рабочих областей). Дополнительные каталоги из `hooks.internal.load.extraDirs` имеют тот же приоритет.
4. **Хуки рабочей области**: `<workspace>/hooks/` (для каждого агента, по умолчанию отключены до явного включения)

Хуки рабочей области могут добавлять новые имена хуков, но не могут переопределять встроенные, управляемые или предоставленные Plugin хуки с тем же именем.

Gateway пропускает обнаружение внутренних хуков при запуске, пока внутренние хуки не настроены. Включите встроенный или управляемый хук с помощью `openclaw hooks enable <name>`, установите пакет хуков или задайте `hooks.internal.enabled=true`, чтобы явно включить их. Когда вы включаете один именованный хук, Gateway загружает только обработчик этого хука; `hooks.internal.enabled=true`, дополнительные каталоги хуков и устаревшие обработчики включают широкое обнаружение.

### Пакеты хуков

Пакеты хуков — это npm-пакеты, которые экспортируют хуки через `openclaw.hooks` в `package.json`. Установите с помощью:

```bash
openclaw plugins install <path-or-spec>
```

Спецификации npm поддерживают только реестр (имя пакета + необязательная точная версия или dist-tag). Спецификации Git/URL/file и диапазоны semver отклоняются.

## Встроенные хуки

| Хук                   | События                                           | Что делает                                                     |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | Сохраняет контекст сессии в `<workspace>/memory/`              |
| bootstrap-extra-files | `agent:bootstrap`                                 | Внедряет дополнительные файлы начальной загрузки из glob-шаблонов |
| command-logger        | `command`                                         | Записывает все команды в `~/.openclaw/logs/commands.log`       |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Отправляет видимые уведомления в чат при начале/завершении compaction сессии |
| boot-md               | `gateway:startup`                                 | Запускает `BOOT.md` при запуске gateway                        |

Включите любой встроенный хук:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Подробности session-memory

Извлекает последние 15 сообщений пользователя/ассистента и сохраняет их в `<workspace>/memory/YYYY-MM-DD-HHMM.md` с использованием локальной даты хоста. Захват памяти выполняется в фоновом режиме, поэтому подтверждения `/new` и `/reset` не задерживаются чтением транскрипта или необязательной генерацией slug. Задайте `hooks.internal.entries.session-memory.llmSlug: true`, чтобы генерировать описательные slug в именах файлов с помощью настроенной модели. Требует настроенного `workspace.dir`.

<a id="bootstrap-extra-files"></a>

### Конфигурация bootstrap-extra-files

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

Пути разрешаются относительно рабочего пространства. Загружаются только распознанные базовые имена файлов начальной загрузки (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Подробности command-logger

Записывает каждую slash-команду в `~/.openclaw/logs/commands.log`.

<a id="compaction-notifier"></a>

### Подробности compaction-notifier

Отправляет короткие статусные сообщения в текущий разговор, когда OpenClaw начинает и завершает сжатие транскрипта сессии. Это делает длинные обращения менее запутанными в чат-интерфейсах, потому что пользователь видит, что ассистент резюмирует контекст и продолжит после сжатия.

<a id="boot-md"></a>

### Подробности boot-md

Запускает `BOOT.md` из активного рабочего пространства при запуске gateway.

## Хуки Plugin

Plugins могут регистрировать типизированные хуки через Plugin SDK для более глубокой интеграции:
перехвата вызовов инструментов, изменения prompts, управления потоком сообщений и других задач.
Используйте хуки Plugin, когда вам нужны `before_tool_call`, `before_agent_reply`,
`before_install` или другие хуки жизненного цикла внутри процесса.

Внутренние хуки, управляемые Plugin, отличаются: они участвуют в описанной на этой странице
крупнозернистой системе событий команд/жизненного цикла и отображаются в `openclaw hooks list` как
`plugin:<id>`. Используйте их для побочных эффектов и совместимости с наборами хуков, а не
для упорядоченного middleware или шлюзов политик.

Полный справочник по хукам Plugin см. в разделе [Хуки Plugin](/ru/plugins/hooks).

## Конфигурация

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

Переменные окружения для отдельных хуков:

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

Дополнительные каталоги хуков:

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
Устаревший формат конфигурации массива `hooks.internal.handlers` по-прежнему поддерживается для обратной совместимости, но новые хуки должны использовать систему на основе обнаружения.
</Note>

## Справочник CLI

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

## Рекомендации

- **Держите обработчики быстрыми.** Хуки выполняются во время обработки команд. Запускайте тяжелую работу без ожидания результата с помощью `void processInBackground(event)`.
- **Обрабатывайте ошибки корректно.** Оборачивайте рискованные операции в try/catch; не выбрасывайте исключения, чтобы могли выполниться другие обработчики.
- **Фильтруйте события заранее.** Немедленно возвращайтесь, если тип/действие события не относится к делу.
- **Используйте конкретные ключи событий.** Предпочитайте `"events": ["command:new"]` вместо `"events": ["command"]`, чтобы снизить накладные расходы.

## Устранение неполадок

### Хук не обнаружен

```bash
# Verify directory structure
ls -la ~/.openclaw/hooks/my-hook/
# Should show: HOOK.md, handler.ts

# List all discovered hooks
openclaw hooks list
```

### Хук не подходит

```bash
openclaw hooks info my-hook
```

Проверьте отсутствующие бинарные файлы (PATH), переменные окружения, значения конфигурации или совместимость с ОС.

### Хук не выполняется

1. Убедитесь, что хук включен: `openclaw hooks list`
2. Перезапустите процесс gateway, чтобы хуки перезагрузились.
3. Проверьте логи gateway: `./scripts/clawlog.sh | grep hook`

## Связанные разделы

- [Справочник CLI: хуки](/ru/cli/hooks)
- [Webhooks](/ru/automation/cron-jobs#webhooks)
- [Хуки Plugin](/ru/plugins/hooks) — хуки жизненного цикла Plugin внутри процесса
- [Конфигурация](/ru/gateway/configuration-reference#hooks)
