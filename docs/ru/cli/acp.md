---
read_when:
    - Настройка интеграций IDE на основе ACP
    - Отладка маршрутизации сеансов ACP к Gateway
summary: Запустите мост ACP для интеграций с IDE
title: ACP
x-i18n:
    generated_at: "2026-06-28T22:41:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 79fa816811f78c3fa59577342e568868ef63e88f5262fd954e346ed46b02afc3
    source_path: cli/acp.md
    workflow: 16
---

Запустите мост [Agent Client Protocol (ACP)](https://agentclientprotocol.com/), который взаимодействует с OpenClaw Gateway.

Эта команда говорит по ACP через stdio для IDE и пересылает запросы в Gateway
через WebSocket. Она сопоставляет ACP-сессии с ключами сессий Gateway.

`openclaw acp` — это ACP-мост на базе Gateway, а не полноценная ACP-нативная
среда редактора. Он сосредоточен на маршрутизации сессий, доставке запросов и
базовых потоковых обновлениях.

Если вы хотите, чтобы внешний MCP-клиент напрямую работал с разговорами каналов
OpenClaw, а не размещал сессию ACP harness, используйте вместо этого
[`openclaw mcp serve`](/ru/cli/mcp).

## Чем это не является

Эту страницу часто путают с сессиями ACP harness.

`openclaw acp` означает:

- OpenClaw выступает как ACP-сервер
- IDE или ACP-клиент подключается к OpenClaw
- OpenClaw пересылает эту работу в сессию Gateway

Это отличается от [ACP Agents](/ru/tools/acp-agents), где OpenClaw запускает
внешний harness, например Codex или Claude Code, через `acpx`.

Краткое правило:

- редактор/клиент хочет говорить с OpenClaw по ACP: используйте `openclaw acp`
- OpenClaw должен запустить Codex/Claude/Gemini как ACP harness: используйте `/acp spawn` и [ACP Agents](/ru/tools/acp-agents)

## Матрица совместимости

| Область ACP                                                           | Статус             | Примечания                                                                                                                                                                                                                                          |
| --------------------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Реализовано        | Основной поток моста через stdio к Gateway chat/send + abort.                                                                                                                                                                                       |
| `listSessions`, slash-команды                                         | Реализовано        | Список сессий работает с состоянием сессий Gateway, с ограниченной курсорной пагинацией и фильтрацией `cwd`, когда строки сессий Gateway содержат метаданные рабочей области; команды объявляются через `available_commands_update`.              |
| Метаданные происхождения сессий                                       | Реализовано        | Списки сессий и снимки информации о сессиях включают родительскую и дочернюю линию OpenClaw в `_meta`, чтобы ACP-клиенты могли отображать графы субагентов без частных боковых каналов Gateway.                                                     |
| `resumeSession`, `closeSession`                                       | Реализовано        | Resume повторно привязывает ACP-сессию к существующей сессии Gateway без повторного воспроизведения истории. Close отменяет активную работу моста, разрешает ожидающие запросы как отмененные и освобождает состояние сессии моста.                |
| `loadSession`                                                         | Частично           | Повторно привязывает ACP-сессию к ключу сессии Gateway и воспроизводит историю журнала ACP-событий для сессий, созданных мостом. Более старые сессии или сессии без журнала используют резервный вариант с сохраненным текстом пользователя/ассистента. |
| Содержимое запроса (`text`, встроенный `resource`, изображения)       | Частично           | Текст/ресурсы разворачиваются во вход чата; изображения становятся вложениями Gateway.                                                                                                                                                              |
| Режимы сессии                                                         | Частично           | `session/set_mode` поддерживается, и мост предоставляет начальные элементы управления сессией на базе Gateway для уровня размышления, подробности инструментов, рассуждений, детализации использования и действий с повышенными правами. Более широкие ACP-нативные поверхности режимов/конфигурации пока вне области. |
| Информация о сессии и обновления использования                        | Частично           | Мост отправляет уведомления `session_info_update` и best-effort `usage_update` из кэшированных снимков сессии Gateway. Использование приблизительно и отправляется только когда итоговые данные токенов Gateway помечены как свежие.              |
| Потоковая передача инструментов                                       | Частично           | События `tool_call` / `tool_call_update` включают необработанный ввод/вывод, текстовое содержимое и best-effort расположения файлов, когда аргументы/результаты инструментов Gateway их раскрывают. Встроенные терминалы и более богатый diff-нативный вывод пока не раскрываются. |
| Подтверждения exec                                                    | Частично           | Запросы подтверждения exec от Gateway во время активных ACP-ходов запроса передаются ACP-клиенту через `session/request_permission`.                                                                                                                 |
| MCP-серверы на сессию (`mcpServers`)                                  | Не поддерживается  | Режим моста отклоняет запросы MCP-серверов на сессию. Настраивайте MCP на Gateway или агенте OpenClaw.                                                                                                                                             |
| Методы файловой системы клиента (`fs/read_text_file`, `fs/write_text_file`) | Не поддерживается  | Мост не вызывает методы файловой системы ACP-клиента.                                                                                                                                                                                              |
| Терминальные методы клиента (`terminal/*`)                            | Не поддерживается  | Мост не создает терминалы ACP-клиента и не передает идентификаторы терминалов через вызовы инструментов.                                                                                                                                           |
| Планы сессий / потоковая передача мыслей                              | Не поддерживается  | Сейчас мост отправляет текст вывода и статус инструментов, а не ACP-обновления планов или мыслей.                                                                                                                                                  |

## Известные ограничения

- `loadSession` может воспроизвести полную историю журнала ACP-событий только
  для сессий, созданных мостом. Более старые сессии или сессии без журнала
  по-прежнему используют резервную расшифровку и не восстанавливают исторические
  вызовы инструментов или системные уведомления.
- Если несколько ACP-клиентов используют один и тот же ключ сессии Gateway,
  маршрутизация событий и отмен выполняется best-effort, а не строго изолированно
  для каждого клиента. Предпочитайте изолированные по умолчанию сессии
  `acp-bridge:<uuid>`, когда нужны чистые локальные ходы редактора.
- Состояния остановки Gateway переводятся в причины остановки ACP, но это
  сопоставление менее выразительно, чем у полностью ACP-нативной среды.
- Начальные элементы управления сессией сейчас раскрывают сфокусированное
  подмножество настроек Gateway: уровень размышления, подробность инструментов,
  рассуждения, детализацию использования и действия с повышенными правами.
  Выбор модели и элементы управления exec-хостом пока не раскрываются как
  параметры конфигурации ACP.
- `session_info_update` и `usage_update` выводятся из снимков сессии Gateway,
  а не из live ACP-нативного учета среды выполнения. Использование приблизительно,
  не содержит данных о стоимости и отправляется только когда Gateway помечает
  итоговые данные токенов как свежие.
- Данные сопровождения инструментов предоставляются best-effort. Мост может
  показывать пути к файлам, которые появляются в известных аргументах/результатах
  инструментов, но пока не отправляет ACP-терминалы или структурированные файловые
  diff.
- Ретрансляция подтверждений exec ограничена активным ACP-ходом запроса;
  подтверждения из других сессий Gateway игнорируются.

## Использование

```bash
openclaw acp

# Remote Gateway
openclaw acp --url wss://gateway-host:18789 --token <token>

# Remote Gateway (token from file)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Attach to an existing session key
openclaw acp --session agent:main:main

# Attach by label (must already exist)
openclaw acp --session-label "support inbox"

# Reset the session key before the first prompt
openclaw acp --session agent:main:main --reset-session
```

## ACP-клиент (отладка)

Используйте встроенный ACP-клиент, чтобы проверить работоспособность моста без IDE.
Он запускает ACP-мост и позволяет вводить запросы интерактивно.

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Модель разрешений (режим отладки клиента):

- Автоматическое подтверждение основано на allowlist и применяется только к доверенным идентификаторам основных инструментов.
- Автоматическое подтверждение `read` ограничено текущим рабочим каталогом (`--cwd`, если задан).
- ACP автоматически подтверждает только узкие readonly-классы: scoped-вызовы `read` в пределах активного cwd плюс readonly-инструменты поиска (`search`, `web_search`, `memory_search`). Неизвестные/неосновные инструменты, чтения вне области, инструменты с возможностью exec, инструменты control-plane, изменяющие инструменты и интерактивные потоки всегда требуют явного подтверждения запроса.
- Предоставленный сервером `toolCall.kind` рассматривается как недоверенные метаданные (не как источник авторизации).
- Эта политика ACP-моста отделена от разрешений ACPX harness. Если вы запускаете OpenClaw через backend `acpx`, `plugins.entries.acpx.config.permissionMode=approve-all` — это аварийный переключатель "yolo" для этой сессии harness.

## Smoke-тестирование протокола

Для отладки на уровне протокола запустите Gateway с изолированным состоянием и
управляйте `openclaw acp` через stdio с помощью ACP JSON-RPC-клиента. Покройте
`initialize`, `session/new`, `session/list` с абсолютным `cwd`, `session/resume`,
`session/close`, повторное закрытие и отсутствующее возобновление.

Доказательство должно включать объявленные возможности жизненного цикла, строку
сессии на базе Gateway, уведомления об обновлениях и журнал Gateway `sessions.list`:

```json
{
  "initialize": {
    "protocolVersion": 1,
    "agentCapabilities": {
      "sessionCapabilities": {
        "list": {},
        "resume": {},
        "close": {}
      }
    }
  },
  "listSessions": {
    "sessions": [
      {
        "sessionId": "agent:main:acp-smoke",
        "cwd": "/path/to/workspace",
        "_meta": {
          "sessionKey": "agent:main:acp-smoke",
          "kind": "direct"
        }
      }
    ],
    "nextCursor": null
  },
  "notifications": ["session_info_update", "available_commands_update", "usage_update"],
  "gatewayLogTail": ["[gateway] ready", "[ws] ⇄ res ✓ sessions.list 305ms"]
}
```

Не используйте `openclaw gateway call sessions.list` как единственное доказательство ACP. Этот
CLI-путь может запросить повышение операторской области свежего токена; корректность
ACP-моста доказывается ACP stdio-фреймами плюс журналом Gateway `sessions.list`.

## Как это использовать

Используйте ACP, когда IDE (или другой клиент) говорит по Agent Client Protocol и вы хотите,
чтобы он управлял сессией OpenClaw Gateway.

1. Убедитесь, что Gateway запущен (локально или удаленно).
2. Настройте целевой Gateway (конфигурацией или флагами).
3. Укажите вашей IDE запускать `openclaw acp` через stdio.

Пример конфигурации (с сохранением):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Пример прямого запуска (без записи конфигурации):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# preferred for local process safety
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Выбор агентов

ACP не выбирает агентов напрямую. Он маршрутизирует по ключу сессии Gateway.

Используйте ключи сессий в области агента, чтобы выбрать конкретного агента:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Каждый сеанс ACP сопоставляется с одним ключом сеанса Gateway. У одного агента может быть много
сеансов; по умолчанию ACP использует изолированный сеанс `acp-bridge:<uuid>`, если вы не переопределите
ключ или метку.

Посеансовые `mcpServers` не поддерживаются в режиме моста. Если клиент ACP
отправляет их во время `newSession` или `loadSession`, мост возвращает понятную
ошибку, а не молча игнорирует их.

Если вы хотите, чтобы сеансы на базе ACPX видели инструменты Plugin OpenClaw или выбранные
встроенные инструменты, такие как `cron`, включите ACPX MCP-мосты на стороне Gateway вместо
попытки передать посеансовые `mcpServers`. См.
[Агенты ACP](/ru/tools/acp-agents-setup#plugin-tools-mcp-bridge) и
[MCP-мост инструментов OpenClaw](/ru/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## Использование из `acpx` (Codex, Claude, другие клиенты ACP)

Если вы хотите, чтобы агент для программирования, такой как Codex или Claude Code, общался с вашим
ботом OpenClaw через ACP, используйте `acpx` со встроенной целью `openclaw`.

Типичный поток:

1. Запустите Gateway и убедитесь, что мост ACP может до него достучаться.
2. Направьте `acpx openclaw` на `openclaw acp`.
3. Укажите ключ сеанса OpenClaw, который должен использовать агент для программирования.

Примеры:

```bash
# One-shot request into your default OpenClaw ACP session
acpx openclaw exec "Summarize the active OpenClaw session state."

# Persistent named session for follow-up turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

Если вы хотите, чтобы `acpx openclaw` каждый раз использовал конкретный Gateway и ключ сеанса,
переопределите команду агента `openclaw` в `~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Для локальной копии OpenClaw в репозитории используйте прямую точку входа CLI вместо
dev-runner, чтобы поток ACP оставался чистым. Например:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Это самый простой способ позволить Codex, Claude Code или другому ACP-совместимому клиенту
получать контекстную информацию от агента OpenClaw без скрейпинга терминала.

## Настройка редактора Zed

Добавьте пользовательского агента ACP в `~/.config/zed/settings.json` (или используйте интерфейс настроек Zed):

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": ["acp"],
      "env": {}
    }
  }
}
```

Чтобы указать конкретный Gateway или агента:

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": [
        "acp",
        "--url",
        "wss://gateway-host:18789",
        "--token",
        "<token>",
        "--session",
        "agent:design:main"
      ],
      "env": {}
    }
  }
}
```

В Zed откройте панель Agent и выберите "OpenClaw ACP", чтобы начать тред.

## Сопоставление сеансов

По умолчанию сеансы моста ACP получают изолированный ключ сеанса Gateway с
префиксом `acp-bridge:`. Эти сеансы моста обычной модели синтетические и
подпадают под очистку устаревших записей и ограничения на количество записей. Чтобы повторно использовать известный сеанс,
передайте ключ или метку сеанса:

- `--session <key>`: использовать конкретный ключ сеанса Gateway.
- `--session-label <label>`: разрешить существующий сеанс по метке.
- `--reset-session`: создать новый id сеанса для этого ключа (тот же ключ, новый transcript).

Если ваш клиент ACP поддерживает метаданные, вы можете переопределить параметры для каждого сеанса:

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

Подробнее о ключах сеансов см. в [/concepts/session](/ru/concepts/session).

## Параметры

- `--url <url>`: URL WebSocket Gateway (по умолчанию `gateway.remote.url`, если настроен).
- `--token <token>`: токен аутентификации Gateway.
- `--token-file <path>`: прочитать токен аутентификации Gateway из файла.
- `--password <password>`: пароль аутентификации Gateway.
- `--password-file <path>`: прочитать пароль аутентификации Gateway из файла.
- `--session <key>`: ключ сеанса по умолчанию.
- `--session-label <label>`: метка сеанса по умолчанию для разрешения.
- `--require-existing`: завершиться с ошибкой, если ключ/метка сеанса не существует.
- `--reset-session`: сбросить ключ сеанса перед первым использованием.
- `--no-prefix-cwd`: не добавлять рабочий каталог в начало prompts.
- `--provenance <off|meta|meta+receipt>`: включить метаданные происхождения ACP или квитанции.
- `--verbose, -v`: подробное логирование в stderr.

Примечание по безопасности:

- `--token` и `--password` могут быть видны в списках локальных процессов в некоторых системах.
- Предпочитайте `--token-file`/`--password-file` или переменные окружения (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- Разрешение аутентификации Gateway следует общему контракту, который используют другие клиенты Gateway:
  - локальный режим: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> резервный вариант `gateway.remote.*` только когда `gateway.auth.*` не задан (настроенные, но неразрешенные локальные SecretRefs отказывают безопасно)
  - удаленный режим: `gateway.remote.*` с резервным вариантом env/config по правилам приоритета для удаленного режима
  - `--url` безопасен для переопределения и не переиспользует неявные учетные данные config/env; передавайте явные `--token`/`--password` (или варианты с файлами)
- Дочерние процессы backend выполнения ACP получают `OPENCLAW_SHELL=acp`, что можно использовать для контекстно-зависимых правил shell/profile.
- `openclaw acp client` задает `OPENCLAW_SHELL=acp-client` для запущенного процесса моста.

### Параметры `acp client`

- `--cwd <dir>`: рабочий каталог для сеанса ACP.
- `--server <command>`: команда сервера ACP (по умолчанию: `openclaw`).
- `--server-args <args...>`: дополнительные аргументы, передаваемые серверу ACP.
- `--server-verbose`: включить подробное логирование на сервере ACP.
- `--verbose, -v`: подробное логирование клиента.

## Связанные материалы

- [Справочник CLI](/ru/cli)
- [Агенты ACP](/ru/tools/acp-agents)
