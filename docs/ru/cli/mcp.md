---
read_when:
    - Подключение Codex, Claude Code или другого клиента MCP к каналам на базе OpenClaw
    - Выполнение `openclaw mcp serve`
    - Управление сохраненными в OpenClaw определениями MCP-серверов
sidebarTitle: MCP
summary: Предоставляйте разговоры каналов OpenClaw через MCP и управляйте сохраненными определениями серверов MCP
title: MCP
x-i18n:
    generated_at: "2026-06-30T22:28:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e979654cb17f5cb25b936039f9e4690ecfda41bc58ae073426a9e42978fa85dc
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` выполняет две задачи:

- запускает OpenClaw как MCP-сервер с помощью `openclaw mcp serve`
- управляет определениями исходящих MCP-серверов, управляемых OpenClaw, с помощью `list`, `show`, `status`, `doctor`, `probe`, `add`, `set`, `configure`, `tools`, `login`, `logout`, `reload` и `unset`

Иными словами:

- `serve` — это OpenClaw, работающий как MCP-сервер
- остальные подкоманды — это OpenClaw, работающий как клиентский реестр MCP для MCP-серверов, которые его среды выполнения могут использовать позже

<Note>
  `list`, `show`, `set` и `unset` только читают и записывают записи `mcp.servers`, управляемые OpenClaw, в конфигурации OpenClaw. Они не включают серверы mcporter из `config/mcporter.json`; для этого реестра используйте `mcporter list`.
</Note>

Используйте [`openclaw acp`](/ru/cli/acp), когда OpenClaw должен сам размещать сессию кодингового harness и маршрутизировать эту среду выполнения через ACP.

## Выберите правильный путь MCP

У OpenClaw есть несколько поверхностей MCP. Выберите ту, которая соответствует тому, кто владеет средой выполнения агента и кто владеет инструментами.

| Цель                                                                | Используйте                                                           | Почему                                                                                                                 |
| ------------------------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Позволить внешнему MCP-клиенту читать/отправлять разговоры каналов OpenClaw | `openclaw mcp serve`                                                  | OpenClaw является MCP-сервером и предоставляет разговоры на базе Gateway через stdio.                                  |
| Сохранить сторонние MCP-серверы для запусков агентов, управляемых OpenClaw | `openclaw mcp add`, `set`, `configure`, `tools`, `login`              | OpenClaw является клиентским реестром MCP и позже проецирует эти серверы в подходящие среды выполнения.                |
| Проверить сохраненный сервер без запуска хода агента                | `openclaw mcp status`, `doctor`, `probe`                              | `status` и `doctor` проверяют конфигурацию; `probe` открывает live MCP-соединение и перечисляет возможности.           |
| Редактировать конфигурацию MCP из браузера                          | Control UI `/mcp`                                                     | Страница показывает инвентарь, включение, сводки OAuth/фильтров, подсказки команд и scoped-редактор `mcp`.             |
| Дать серверу приложений Codex scoped native MCP-сервер              | `mcp.servers.<name>.codex`                                            | Блок `codex` влияет только на проекцию тредов сервера приложений Codex и удаляется перед передачей native-конфигурации. |
| Запускать сессии harness, размещенные через ACP                     | [`openclaw acp`](/ru/cli/acp) и [Агенты ACP](/ru/tools/acp-agents-setup)    | Режим ACP-моста не принимает внедрение MCP-сервера для отдельной сессии; вместо этого настройте мосты Gateway/Plugin.  |

<Tip>
Если вы не уверены, какой путь вам нужен, начните с `openclaw mcp status --verbose`. Он показывает, что OpenClaw сохранил, не запуская MCP-серверы.
</Tip>

## OpenClaw как MCP-сервер

Это путь `openclaw mcp serve`.

### Когда использовать `serve`

Используйте `openclaw mcp serve`, когда:

- Codex, Claude Code или другой MCP-клиент должен напрямую работать с разговорами каналов на базе OpenClaw
- у вас уже есть локальный или удаленный OpenClaw Gateway с маршрутизированными сессиями
- вам нужен один MCP-сервер, который работает со всеми канальными бэкендами OpenClaw, вместо запуска отдельных мостов для каждого канала

Вместо этого используйте [`openclaw acp`](/ru/cli/acp), когда OpenClaw должен сам размещать кодинговую среду выполнения и держать сессию агента внутри OpenClaw.

### Как это работает

`openclaw mcp serve` запускает stdio MCP-сервер. MCP-клиент владеет этим процессом. Пока клиент держит stdio-сессию открытой, мост подключается к локальному или удаленному OpenClaw Gateway через WebSocket и предоставляет маршрутизированные разговоры каналов через MCP.

<Steps>
  <Step title="Клиент запускает мост">
    MCP-клиент запускает `openclaw mcp serve`.
  </Step>
  <Step title="Мост подключается к Gateway">
    Мост подключается к OpenClaw Gateway через WebSocket.
  </Step>
  <Step title="Сессии становятся MCP-разговорами">
    Маршрутизированные сессии становятся MCP-разговорами и инструментами transcript/history.
  </Step>
  <Step title="Очередь live-событий">
    Live-события помещаются в очередь в памяти, пока мост подключен.
  </Step>
  <Step title="Необязательная push-отправка Claude">
    Если включен режим канала Claude, та же сессия также может получать push-уведомления, специфичные для Claude.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Важное поведение">
    - состояние live-очереди начинается, когда мост подключается
    - более старая история transcript читается с помощью `messages_read`
    - push-уведомления Claude существуют только пока MCP-сессия активна
    - когда клиент отключается, мост завершается, и live-очередь исчезает
    - одноразовые точки входа агента, такие как `openclaw agent` и `openclaw infer model run`, завершают любые bundled MCP-среды выполнения, которые они открывают, когда ответ завершен, поэтому повторные скриптовые запуски не накапливают дочерние stdio MCP-процессы
    - stdio MCP-серверы, запущенные OpenClaw (bundled или настроенные пользователем), завершаются как дерево процессов при выключении, поэтому дочерние подпроцессы, запущенные сервером, не сохраняются после выхода родительского stdio-клиента
    - удаление или сброс сессии освобождает MCP-клиенты этой сессии через общий путь очистки среды выполнения, поэтому не остается зависших stdio-соединений, связанных с удаленной сессией

  </Accordion>
</AccordionGroup>

### Выберите режим клиента

Используйте один и тот же мост двумя разными способами:

<Tabs>
  <Tab title="Универсальные MCP-клиенты">
    Только стандартные инструменты MCP. Используйте `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` и инструменты approvals.
  </Tab>
  <Tab title="Claude Code">
    Стандартные инструменты MCP плюс адаптер канала, специфичный для Claude. Включите `--claude-channel-mode on` или оставьте значение по умолчанию `auto`.
  </Tab>
</Tabs>

<Note>
Сегодня `auto` ведет себя так же, как `on`. Обнаружения возможностей клиента пока нет.
</Note>

### Что предоставляет `serve`

Мост использует существующие метаданные маршрутов сессий Gateway, чтобы предоставлять разговоры на базе каналов. Разговор появляется, когда у OpenClaw уже есть состояние сессии с известным маршрутом, например:

- `channel`
- метаданные получателя или назначения
- необязательный `accountId`
- необязательный `threadId`

Это дает MCP-клиентам одно место для того, чтобы:

- перечислять недавние маршрутизированные разговоры
- читать недавнюю историю transcript
- ждать новых входящих событий
- отправлять ответ обратно через тот же маршрут
- видеть запросы approvals, которые приходят, пока мост подключен

### Использование

<Tabs>
  <Tab title="Локальный Gateway">
    ```bash
    openclaw mcp serve
    ```
  </Tab>
  <Tab title="Удаленный Gateway (токен)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
    ```
  </Tab>
  <Tab title="Удаленный Gateway (пароль)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password
    ```
  </Tab>
  <Tab title="Подробно / Claude выключен">
    ```bash
    openclaw mcp serve --verbose
    openclaw mcp serve --claude-channel-mode off
    ```
  </Tab>
</Tabs>

### Инструменты моста

Текущий мост предоставляет эти инструменты MCP:

<AccordionGroup>
  <Accordion title="conversations_list">
    Перечисляет недавние разговоры на базе сессий, у которых уже есть метаданные маршрута в состоянии сессий Gateway.

    Полезные фильтры:

    - `limit`
    - `search`
    - `channel`
    - `includeDerivedTitles`
    - `includeLastMessage`

  </Accordion>
  <Accordion title="conversation_get">
    Возвращает один разговор по `session_key`, используя прямой поиск сессии Gateway.
  </Accordion>
  <Accordion title="messages_read">
    Читает недавние сообщения transcript для одного разговора на базе сессии.
  </Accordion>
  <Accordion title="attachments_fetch">
    Извлекает нетекстовые блоки содержимого сообщения из одного сообщения transcript. Это представление метаданных поверх содержимого transcript, а не отдельное долговечное хранилище вложений-blob.
  </Accordion>
  <Accordion title="events_poll">
    Читает live-события из очереди начиная с числового курсора.
  </Accordion>
  <Accordion title="events_wait">
    Выполняет long-polling до прибытия следующего подходящего события в очереди или истечения тайм-аута.

    Используйте это, когда универсальному MCP-клиенту нужна доставка почти в реальном времени без push-протокола, специфичного для Claude.

  </Accordion>
  <Accordion title="messages_send">
    Отправляет текст обратно через тот же маршрут, уже записанный в сессии.

    Текущее поведение:

    - требует существующий маршрут разговора
    - использует канал, получателя, идентификатор учетной записи и идентификатор треда сессии
    - отправляет только текст

  </Accordion>
  <Accordion title="permissions_list_open">
    Перечисляет ожидающие запросы approval для exec/plugin, которые мост наблюдал с момента подключения к Gateway.
  </Accordion>
  <Accordion title="permissions_respond">
    Разрешает один ожидающий запрос approval для exec/plugin с помощью:

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### Модель событий

Мост хранит очередь событий в памяти, пока он подключен.

Текущие типы событий:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- очередь только live; она начинается при запуске MCP-моста
- `events_poll` и `events_wait` сами по себе не воспроизводят более старую историю Gateway
- долговечный backlog следует читать с помощью `messages_read`

</Warning>

### Уведомления канала Claude

Мост также может предоставлять уведомления канала, специфичные для Claude. Это эквивалент адаптера канала Claude Code в OpenClaw: стандартные инструменты MCP остаются доступны, но live-входящие сообщения также могут приходить как MCP-уведомления, специфичные для Claude.

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`: только стандартные инструменты MCP.
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on`: включить уведомления канала Claude.
  </Tab>
  <Tab title="auto (по умолчанию)">
    `--claude-channel-mode auto`: текущее значение по умолчанию; то же поведение моста, что и `on`.
  </Tab>
</Tabs>

Когда режим канала Claude включен, сервер объявляет экспериментальные возможности Claude и может выдавать:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Текущее поведение моста:

- входящие сообщения transcript от `user` пересылаются как `notifications/claude/channel`
- запросы разрешений Claude, полученные через MCP, отслеживаются в памяти
- если владелец команды в связанном разговоре позже отправляет `yes abcde` или `no abcde`, мост преобразует это в `notifications/claude/channel/permission`
- эти уведомления доступны только для live-сессии; если MCP-клиент отключается, цели для push-отправки нет

Это намеренно специфично для клиента. Универсальным MCP-клиентам следует полагаться на стандартные инструменты polling.

### Конфигурация MCP-клиента

Пример конфигурации stdio-клиента:

```json
{
  "mcpServers": {
    "openclaw": {
      "command": "openclaw",
      "args": [
        "mcp",
        "serve",
        "--url",
        "wss://gateway-host:18789",
        "--token-file",
        "/path/to/gateway.token"
      ]
    }
  }
}
```

Для большинства универсальных MCP-клиентов начните со стандартной поверхности инструментов и игнорируйте режим Claude. Включайте режим Claude только для клиентов, которые действительно понимают методы уведомлений, специфичные для Claude.

### Параметры

`openclaw mcp serve` поддерживает:

<ParamField path="--url" type="string">
  URL WebSocket Gateway.
</ParamField>
<ParamField path="--token" type="string">
  Токен Gateway.
</ParamField>
<ParamField path="--token-file" type="string">
  Читать токен из файла.
</ParamField>
<ParamField path="--password" type="string">
  Пароль Gateway.
</ParamField>
<ParamField path="--password-file" type="string">
  Читать пароль из файла.
</ParamField>
<ParamField path="--claude-channel-mode" type='"auto" | "on" | "off"'>
  Режим уведомлений Claude.
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  Подробные логи в stderr.
</ParamField>

<Tip>
По возможности предпочитайте `--token-file` или `--password-file` вместо секретов, указанных прямо в командной строке.
</Tip>

### Безопасность и граница доверия

Мост не придумывает маршрутизацию. Он только предоставляет доступ к разговорам, которые Gateway уже умеет маршрутизировать.

Это означает:

- списки разрешенных отправителей, сопряжение и доверие на уровне канала по-прежнему относятся к базовой конфигурации канала OpenClaw
- `messages_send` может отвечать только через уже существующий сохраненный маршрут
- состояние одобрений является живым и хранится только в памяти для текущего сеанса моста
- для аутентификации моста следует использовать те же средства управления токеном или паролем Gateway, которым вы доверили бы любой другой удаленный клиент Gateway

Если разговор отсутствует в `conversations_list`, обычная причина не в конфигурации MCP. Причина — отсутствующие или неполные метаданные маршрута в базовом сеансе Gateway.

### Тестирование

OpenClaw поставляет детерминированный Docker-smoke для этого моста:

```bash
pnpm test:docker:mcp-channels
```

Этот smoke-тест:

- запускает контейнер Gateway с тестовыми данными
- запускает второй контейнер, который порождает `openclaw mcp serve`
- проверяет обнаружение разговоров, чтение транскриптов, чтение метаданных вложений, поведение живой очереди событий и маршрутизацию исходящей отправки
- проверяет уведомления каналов и разрешений в стиле Claude через настоящий stdio-мост MCP

Это самый быстрый способ доказать, что мост работает, не подключая настоящий аккаунт Telegram, Discord или iMessage к тестовому запуску.

Более широкий контекст тестирования см. в разделе [Тестирование](/ru/help/testing).

### Устранение неполадок

<AccordionGroup>
  <Accordion title="No conversations returned">
    Обычно это означает, что сеанс Gateway еще не маршрутизируем. Убедитесь, что в базовом сеансе сохранены канал/провайдер, получатель и необязательные метаданные маршрута аккаунта/потока.
  </Accordion>
  <Accordion title="events_poll or events_wait misses older messages">
    Ожидаемое поведение. Живая очередь запускается, когда мост подключается. Читайте более старую историю транскрипта с помощью `messages_read`.
  </Accordion>
  <Accordion title="Claude notifications do not show up">
    Проверьте все следующее:

    - клиент оставил stdio-сеанс MCP открытым
    - `--claude-channel-mode` имеет значение `on` или `auto`
    - клиент действительно понимает специфичные для Claude методы уведомлений
    - входящее сообщение произошло после подключения моста

  </Accordion>
  <Accordion title="Approvals are missing">
    `permissions_list_open` показывает только запросы на одобрение, замеченные, пока мост был подключен. Это не долговечный API истории одобрений.
  </Accordion>
</AccordionGroup>

## OpenClaw как реестр клиентов MCP

Это путь `openclaw mcp list`, `show`, `status`, `doctor`, `probe`, `add`, `set`,
`configure`, `tools`, `login`, `logout`, `reload` и `unset`.

Эти команды не предоставляют OpenClaw через MCP. Они управляют определениями MCP-серверов под управлением OpenClaw в `mcp.servers` в конфигурации OpenClaw. Они не читают серверы mcporter из `config/mcporter.json`.

Эти сохраненные определения предназначены для рантаймов, которые OpenClaw запускает или настраивает позже, например встроенного OpenClaw и других адаптеров рантайма. OpenClaw хранит определения централизованно, чтобы этим рантаймам не нужно было поддерживать собственные дублирующиеся списки MCP-серверов.

<AccordionGroup>
  <Accordion title="Important behavior">
    - эти команды только читают или записывают конфигурацию OpenClaw
    - `status`, `list`, `show`, `doctor` без `--probe`, `set`, `configure`, `tools`, `logout`, `reload` и `unset` не подключаются к целевому MCP-серверу
    - `login` выполняет сетевой OAuth-поток MCP для настроенного HTTP-сервера и сохраняет полученные локальные учетные данные
    - `status --verbose` печатает разрешенные подсказки транспорта, аутентификации, тайм-аута, фильтра и параллельных вызовов инструментов без подключения
    - `doctor` проверяет сохраненные определения на проблемы локальной настройки, такие как отсутствующие команды stdio, недопустимые рабочие каталоги, отсутствующие TLS-файлы, отключенные серверы, буквальные чувствительные значения заголовков/env и неполная OAuth-авторизация
    - `doctor --probe` добавляет то же доказательство живого подключения, что и `probe`, после прохождения статических проверок
    - `probe` подключается к выбранному серверу или ко всем настроенным серверам, перечисляет инструменты и сообщает о возможностях/диагностике
    - `add` строит определение из флагов и выполняет пробу перед сохранением, если не задан `--no-probe` или сначала не требуется OAuth-авторизация
    - адаптеры рантайма решают во время выполнения, какие формы транспорта они фактически поддерживают
    - `enabled: false` сохраняет сервер, но исключает его из обнаружения встроенным рантаймом
    - `timeout` и `connectTimeout` задают тайм-ауты запросов и подключений для каждого сервера в секундах
    - `supportsParallelToolCalls: true` помечает серверы, которые адаптеры могут вызывать параллельно
    - HTTP-серверы могут использовать статические заголовки, OAuth-вход, управление проверкой TLS и пути к сертификату/ключу mTLS
    - встроенный OpenClaw предоставляет настроенные инструменты MCP в обычных профилях инструментов `coding` и `messaging`; `minimal` по-прежнему скрывает их, а `tools.deny: ["bundle-mcp"]` отключает их явно
    - `toolFilter.include` и `toolFilter.exclude` для каждого сервера фильтруют обнаруженные инструменты MCP до того, как они станут инструментами OpenClaw
    - серверы, которые объявляют ресурсы или промпты, также предоставляют служебные инструменты для перечисления/чтения ресурсов и перечисления/получения промптов; эти сгенерированные служебные имена (`resources_list`, `resources_read`, `prompts_list`, `prompts_get`) используют тот же фильтр include/exclude
    - динамические изменения списка инструментов MCP делают кэшированный каталог для этого сеанса недействительным; следующее обнаружение/использование обновляет его с сервера
    - повторяющиеся сбои запросов/протокола инструментов MCP ненадолго приостанавливают этот сервер, чтобы один неисправный сервер не занимал весь ход
    - сеансовые bundled MCP-рантаймы удаляются после `mcp.sessionIdleTtlMs` миллисекунд простоя (по умолчанию 10 минут; задайте `0`, чтобы отключить), а одноразовые встроенные запуски очищают их в конце запуска

  </Accordion>
</AccordionGroup>

Адаптеры рантайма могут нормализовать этот общий реестр в форму, которую ожидает их нижестоящий клиент. Например, встроенный OpenClaw напрямую использует значения `transport` OpenClaw, а Claude Code и Gemini получают нативные для CLI значения `type`, такие как `http`, `sse` или `stdio`.

Codex app-server также учитывает необязательный блок `codex` на каждом сервере. Это
метаданные проекции OpenClaw только для потоков Codex app-server; они не
изменяют сеансы ACP, универсальную конфигурацию Codex harness или другие адаптеры рантайма.
Используйте непустые `codex.agents`, чтобы проецировать сервер только в конкретные
идентификаторы агентов OpenClaw. Пустые, незаполненные или недопустимые списки агентов отклоняются
валидацией конфигурации и пропускаются путем проекции рантайма, а не становятся
глобальными. Используйте `codex.defaultToolsApprovalMode` (`auto`, `prompt` или `approve`),
чтобы выдавать нативный для Codex `default_tools_approval_mode` для доверенного сервера.
OpenClaw удаляет метаданные `codex` перед передачей нативной конфигурации `mcp_servers`
в Codex.

### Сохраненные определения MCP-серверов

OpenClaw также хранит в конфигурации легковесный реестр MCP-серверов для поверхностей, которым нужны определения MCP под управлением OpenClaw.

Команды:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp status [--verbose]`
- `openclaw mcp doctor [name] [--probe]`
- `openclaw mcp probe [name]`
- `openclaw mcp add <name> [flags]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp configure <name> [flags]`
- `openclaw mcp tools <name> [--include csv] [--exclude csv] [--clear]`
- `openclaw mcp login <name> [--code code]`
- `openclaw mcp logout <name>`
- `openclaw mcp reload`
- `openclaw mcp unset <name>`

Примечания:

- `list` сортирует имена серверов.
- `show` без имени печатает полный настроенный объект MCP-сервера.
- `status` классифицирует настроенные транспорты без подключения. `--verbose` включает разрешенные сведения о запуске, тайм-ауте, OAuth, фильтре и параллельных вызовах.
- `doctor` выполняет статические проверки без подключения. Добавьте `--probe`, если команда также должна проверять, что включенные серверы подключаются.
- `probe` подключается и сообщает количество инструментов, поддержку ресурсов/промптов, поддержку изменений списка и диагностику.
- `add` принимает флаги stdio, такие как `--command`, `--arg`, `--env` и `--cwd`, или HTTP-флаги, такие как `--url`, `--transport`, `--header`, `--auth oauth`, TLS, тайм-аут и флаги выбора инструментов.
- `set` ожидает одно значение JSON-объекта в командной строке.
- `configure` обновляет включение, фильтры инструментов, тайм-ауты, OAuth, TLS и подсказки параллельных вызовов инструментов без замены всего определения сервера.
- `tools` обновляет фильтры инструментов для каждого сервера. Записи include/exclude — это имена инструментов MCP и простые globs `*`.
- `login` запускает OAuth-поток для HTTP-серверов, настроенных с `auth: "oauth"`. Первый запуск печатает URL авторизации; после одобрения запустите повторно с `--code`.
- `logout` очищает сохраненные OAuth-учетные данные для указанного сервера, не удаляя сохраненное определение сервера.
- `reload` освобождает кэшированные внутрипроцессные MCP-рантаймы. Процессам Gateway или агентам в другом процессе по-прежнему нужен собственный путь перезагрузки или перезапуска.
- Используйте `transport: "streamable-http"` для MCP-серверов Streamable HTTP. `openclaw mcp set` также нормализует нативный для CLI `type: "http"` в ту же каноническую форму конфигурации для совместимости.
- `unset` завершается ошибкой, если указанный сервер не существует.

Примеры:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp status --verbose
openclaw mcp doctor --probe
openclaw mcp probe context7 --json
openclaw mcp add memory --command npx --arg -y --arg @modelcontextprotocol/server-memory
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp tools context7 --include 'resolve-library-id,get-library-docs'
openclaw mcp set docs '{"url":"https://mcp.example.com","transport":"streamable-http"}'
openclaw mcp configure docs --timeout 20 --connect-timeout 5 --include 'search,read_*'
openclaw mcp configure docs --auth oauth --oauth-scope 'docs.read'
openclaw mcp login docs
openclaw mcp logout docs
openclaw mcp unset context7
```

### Распространенные рецепты серверов

Эти примеры только сохраняют определения серверов. После этого запустите `openclaw mcp doctor --probe`, чтобы доказать, что сервер запускается и предоставляет инструменты.

<Tabs>
  <Tab title="Filesystem">
    ```bash
    openclaw mcp add files \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-filesystem \
      --arg "$HOME/Documents" \
      --include 'read_file,list_directory,search_files'
    openclaw mcp doctor files --probe
    ```

    Ограничивайте серверы файловой системы самым маленьким деревом каталогов, которое агент должен читать или редактировать.

  </Tab>
  <Tab title="Memory">
    ```bash
    openclaw mcp add memory \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-memory
    openclaw mcp probe memory --json
    ```

    Используйте фильтр инструментов, если сервер предоставляет инструменты записи, которые не должны быть доступны обычным агентам.

  </Tab>
  <Tab title="Local script">
    ```bash
    openclaw mcp add local-tools \
      --command node \
      --arg ./dist/mcp-server.js \
      --cwd /srv/openclaw-tools \
      --env API_BASE=https://internal.example
    openclaw mcp status --verbose
    ```

    `doctor` проверяет, что `cwd` существует и что команда разрешается из настроенного окружения.

  </Tab>
  <Tab title="Remote HTTP">
    ```bash
    openclaw mcp add docs \
      --url https://mcp.example.com/mcp \
      --transport streamable-http \
      --auth oauth \
      --oauth-scope docs.read \
      --timeout 20 \
      --connect-timeout 5 \
      --include 'search,read_*'
    openclaw mcp doctor docs --probe
    ```

    Используйте OAuth, когда удаленный сервер его поддерживает. Если серверу требуются статические заголовки, не коммитьте литеральные bearer-токены.

  </Tab>
  <Tab title="Desktop/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,observe,click,type'
    openclaw mcp doctor cua-driver --probe
    ```

    Серверы прямого управления рабочим столом наследуют разрешения процесса, который они запускают. Используйте узкие фильтры инструментов и запросы разрешений на уровне ОС.

  </Tab>
</Tabs>

### Формы вывода JSON

Используйте `--json` для скриптов и панелей мониторинга. Наборы полей могут со временем расширяться, поэтому потребители должны игнорировать неизвестные ключи.

<AccordionGroup>
  <Accordion title="status --json">
    ```json
    {
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "configured": true,
          "enabled": true,
          "ok": true,
          "transport": "streamable-http",
          "launch": "streamable-http https://mcp.example.com/mcp",
          "auth": "oauth",
          "authStatus": {
            "hasTokens": true,
            "hasClientInformation": true,
            "hasCodeVerifier": false,
            "hasDiscoveryState": true,
            "hasLastAuthorizationUrl": false
          },
          "requestTimeoutMs": 20000,
          "connectionTimeoutMs": 5000,
          "toolFilter": {
            "include": ["search", "read_*"],
            "exclude": []
          },
          "supportsParallelToolCalls": true
        }
      ]
    }
    ```
  </Accordion>
  <Accordion title="doctor --json">
    ```json
    {
      "ok": false,
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "ok": false,
          "issues": [
            {
              "level": "error",
              "message": "OAuth credentials are not authorized; run openclaw mcp login docs"
            }
          ]
        }
      ]
    }
    ```

    `doctor --json` завершается с ненулевым кодом, когда на любом включенном проверяемом сервере есть ошибка. Предупреждения выводятся, но сами по себе не приводят к сбою команды.

  </Accordion>
  <Accordion title="probe --json">
    ```json
    {
      "path": "/home/user/.openclaw/openclaw.json",
      "generatedAt": "2026-05-31T09:00:00.000Z",
      "servers": {
        "docs": {
          "launch": "streamable-http https://mcp.example.com/mcp",
          "tools": 2,
          "resources": true,
          "prompts": false,
          "listChanged": {
            "tools": true,
            "resources": false,
            "prompts": false
          }
        }
      },
      "tools": ["docs__read_page", "docs__search"],
      "diagnostics": []
    }
    ```

    `probe` открывает живой сеанс MCP-клиента. Используйте его для проверки доступности и возможностей, а не для статических аудитов конфигурации.

  </Accordion>
</AccordionGroup>

Пример формы конфигурации:

```json
{
  "mcp": {
    "servers": {
      "context7": {
        "command": "uvx",
        "args": ["context7-mcp"]
      },
      "docs": {
        "url": "https://mcp.example.com",
        "transport": "streamable-http",
        "timeout": 20,
        "connectTimeout": 5,
        "supportsParallelToolCalls": true,
        "auth": "oauth",
        "oauth": {
          "scope": "docs.read"
        },
        "sslVerify": true,
        "clientCert": "/path/to/client.crt",
        "clientKey": "/path/to/client.key",
        "toolFilter": {
          "include": ["search_*"],
          "exclude": ["admin_*"]
        }
      }
    }
  }
}
```

### Транспорт Stdio

Запускает локальный дочерний процесс и обменивается данными через stdin/stdout.

| Поле                       | Описание                                  |
| -------------------------- | ----------------------------------------- |
| `command`                  | Исполняемый файл для запуска (обязательно) |
| `args`                     | Массив аргументов командной строки        |
| `env`                      | Дополнительные переменные окружения       |
| `cwd` / `workingDirectory` | Рабочий каталог процесса                  |

<Warning>
**Фильтр безопасности env для Stdio**

OpenClaw отклоняет ключи env запуска интерпретатора, которые могут изменить запуск stdio MCP-сервера до первого RPC, даже если они появляются в блоке `env` сервера. Заблокированные ключи включают `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH` и похожие переменные управления средой выполнения. Запуск отклоняет их с ошибкой конфигурации, чтобы они не могли внедрить неявную прелюдию, заменить интерпретатор, включить отладчик или перенаправить вывод среды выполнения против stdio-процесса. Обычные переменные учетных данных, прокси и серверные переменные env (`GITHUB_TOKEN`, `HTTP_PROXY`, пользовательские `*_API_KEY` и т. д.) не затрагиваются.

Если вашему MCP-серверу действительно нужна одна из заблокированных переменных, задайте ее в процессе хоста Gateway, а не в `env` stdio-сервера.
</Warning>

### Транспорт SSE / HTTP

Подключается к удаленному MCP-серверу через HTTP Server-Sent Events.

| Поле                           | Описание                                                                    |
| ------------------------------ | --------------------------------------------------------------------------- |
| `url`                          | HTTP- или HTTPS-URL удаленного сервера (обязательно)                        |
| `headers`                      | Необязательная карта ключ-значение HTTP-заголовков (например, auth-токены)  |
| `connectionTimeoutMs`          | Тайм-аут подключения для сервера в мс (необязательно)                       |
| `connectTimeout`               | Тайм-аут подключения для сервера в секундах (необязательно)                 |
| `timeout` / `requestTimeoutMs` | Тайм-аут MCP-запроса для сервера в секундах или мс                          |
| `auth: "oauth"`                | Использовать хранилище MCP OAuth-токенов и `openclaw mcp login`             |
| `sslVerify`                    | Устанавливайте false только для явно доверенных частных HTTPS-эндпоинтов    |
| `clientCert` / `clientKey`     | Пути к клиентскому сертификату и ключу mTLS                                 |
| `supportsParallelToolCalls`    | Подсказка, что параллельные вызовы безопасны для этого сервера              |

Пример:

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "auth": "oauth",
        "timeout": 20,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

Чувствительные значения в `url` (userinfo) и `headers` редактируются в журналах и выводе статуса. `openclaw mcp doctor` предупреждает, когда похожие на чувствительные записи `headers` или `env` содержат литеральные значения, чтобы операторы могли вынести эти значения из закоммиченной конфигурации.

### Рабочий процесс OAuth

OAuth предназначен для HTTP MCP-серверов, которые объявляют поддержку MCP OAuth flow. Статические заголовки `Authorization` игнорируются для сервера, пока включено `auth: "oauth"`.

<Steps>
  <Step title="Save the server">
    Добавьте или обновите сервер с `auth: "oauth"` и любыми необязательными метаданными OAuth.

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

  </Step>
  <Step title="Start login">
    Запустите вход, чтобы создать запрос авторизации.

    ```bash
    openclaw mcp login docs
    ```

    OpenClaw выводит URL авторизации и сохраняет временное состояние OAuth-верификатора в каталоге состояния OpenClaw.

  </Step>
  <Step title="Finish with the code">
    После подтверждения в браузере передайте возвращенный код обратно в OpenClaw.

    ```bash
    openclaw mcp login docs --code abc123
    ```

  </Step>
  <Step title="Check authorization">
    Используйте status или doctor, чтобы подтвердить наличие токенов.

    ```bash
    openclaw mcp status --verbose
    openclaw mcp doctor docs --probe
    ```

  </Step>
  <Step title="Clear credentials">
    Logout удаляет сохраненные учетные данные OAuth, но оставляет сохраненное определение сервера.

    ```bash
    openclaw mcp logout docs
    ```

  </Step>
</Steps>

Если провайдер ротирует токены или состояние авторизации зависло, выполните `openclaw mcp logout <name>`, затем повторите `login`. `logout` может очистить учетные данные для сохраненного HTTP-сервера даже после удаления `auth: "oauth"` из конфигурации, если имя сервера и URL все еще идентифицируют запись хранилища учетных данных.

### Транспорт Streamable HTTP

`streamable-http` — дополнительный вариант транспорта наряду с `sse` и `stdio`. Он использует HTTP-стриминг для двунаправленной связи с удаленными MCP-серверами.

| Поле                           | Описание                                                                                         |
| ------------------------------ | ------------------------------------------------------------------------------------------------ |
| `url`                          | HTTP- или HTTPS-URL удаленного сервера (обязательно)                                             |
| `transport`                    | Установите `"streamable-http"`, чтобы выбрать этот транспорт; если опущено, OpenClaw использует `sse` |
| `headers`                      | Необязательная карта ключ-значение HTTP-заголовков (например, auth-токены)                       |
| `connectionTimeoutMs`          | Тайм-аут подключения для сервера в мс (необязательно)                                            |
| `connectTimeout`               | Тайм-аут подключения для сервера в секундах (необязательно)                                      |
| `timeout` / `requestTimeoutMs` | Тайм-аут MCP-запроса для сервера в секундах или мс                                               |
| `auth: "oauth"`                | Использовать хранилище MCP OAuth-токенов и `openclaw mcp login`                                  |
| `sslVerify`                    | Устанавливайте false только для явно доверенных частных HTTPS-эндпоинтов                         |
| `clientCert` / `clientKey`     | Пути к клиентскому сертификату и ключу mTLS                                                      |
| `supportsParallelToolCalls`    | Подсказка, что параллельные вызовы безопасны для этого сервера                                   |

Конфигурация OpenClaw использует `transport: "streamable-http"` как каноническое написание. Значения MCP, нативные для CLI, `type: "http"` принимаются при сохранении через `openclaw mcp set` и исправляются `openclaw doctor --fix` в существующей конфигурации, но `transport` — это то, что встроенный OpenClaw потребляет напрямую.

Пример:

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectTimeout": 10,
        "timeout": 30,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

<Note>
Команды реестра не запускают мост канала. Только `probe` и `doctor --probe` открывают живой сеанс MCP-клиента, чтобы доказать доступность целевого сервера.
</Note>

## Control UI

Браузерный Control UI включает отдельную страницу настроек MCP по адресу `/mcp`. Она показывает количество настроенных серверов, сводки по включению/OAuth/фильтрам, строки транспорта для каждого сервера, элементы управления включением/отключением, распространенные CLI-команды и редактор с областью действия для раздела конфигурации `mcp`.

Используйте страницу для операторских правок и быстрой инвентаризации. Используйте `openclaw mcp doctor --probe` или `openclaw mcp probe`, когда нужно живое доказательство работы сервера.

Рабочий процесс оператора:

1. Откройте Control UI и выберите **MCP**.
2. Проверьте сводные карточки для общего числа серверов, включенных серверов, OAuth и отфильтрованных серверов.
3. Используйте строку каждого сервера для подсказок по транспорту, аутентификации, фильтру, тайм-ауту и командам.
4. Переключайте включение, когда нужно сохранить определение, но исключить его из обнаружения во время выполнения.
5. Отредактируйте секцию конфигурации `mcp` с заданной областью для структурных изменений, таких как новые серверы, заголовки, TLS, метаданные OAuth или фильтры инструментов.
6. Выберите **Сохранить**, чтобы только сохранить конфигурацию, или **Сохранить и опубликовать**, чтобы применить ее через путь конфигурации Gateway.
7. Запустите `openclaw mcp doctor --probe`, когда нужно живое подтверждение, что отредактированный сервер запускается и выводит список инструментов.

Примечания:

- фрагменты команд заключают имена серверов в кавычки, чтобы необычные имена оставались пригодными для копирования в shell
- отображаемые значения, похожие на URL, редактируются перед отображением, если содержат встроенные учетные данные
- страница сама не запускает MCP-транспорты
- активным средам выполнения может понадобиться `openclaw mcp reload`, публикация конфигурации Gateway или перезапуск процесса, в зависимости от того, какой процесс владеет MCP-клиентами

## Текущие ограничения

Эта страница документирует мост в том виде, в котором он поставляется сегодня.

Текущие ограничения:

- обнаружение бесед зависит от существующих метаданных маршрута сеанса Gateway
- нет универсального push-протокола помимо адаптера, специфичного для Claude
- инструментов для редактирования сообщений или реакций пока нет
- транспорт HTTP/SSE/streamable-http подключается к одному удаленному серверу; мультиплексированного upstream пока нет
- `permissions_list_open` включает только подтверждения, наблюдавшиеся, пока мост был подключен

## Связанные разделы

- [Справочник CLI](/ru/cli)
- [Plugins](/ru/cli/plugins)
