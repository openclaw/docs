---
read_when:
    - Подключение Codex, Claude Code или другого MCP-клиента к каналам на базе OpenClaw
    - Запуск `openclaw mcp serve`
    - Управление определениями MCP-серверов, сохраненными OpenClaw
sidebarTitle: MCP
summary: Предоставляйте доступ к диалогам каналов OpenClaw через MCP и управляйте сохранёнными определениями серверов MCP
title: MCP
x-i18n:
    generated_at: "2026-06-28T22:44:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f2bf7050a3a712f761e3008c978f14a7576c9c6fa69d139894acbdcc0f20894b
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` выполняет две задачи:

- запускает OpenClaw как MCP-сервер с помощью `openclaw mcp serve`
- управляет исходящими определениями MCP-серверов, управляемыми OpenClaw, с помощью `list`, `show`, `status`, `doctor`, `probe`, `add`, `set`, `configure`, `tools`, `login`, `logout`, `reload` и `unset`

Иными словами:

- `serve` — это OpenClaw, выступающий как MCP-сервер
- остальные подкоманды — это OpenClaw, выступающий как клиентский реестр MCP для MCP-серверов, которые его среды выполнения могут использовать позже

<Note>
  `list`, `show`, `set` и `unset` только читают и записывают управляемые OpenClaw записи `mcp.servers` в конфигурации OpenClaw. Они не включают серверы mcporter из `config/mcporter.json`; для этого реестра используйте `mcporter list`.
</Note>

Используйте [`openclaw acp`](/ru/cli/acp), когда OpenClaw должен сам размещать сеанс кодового harness и маршрутизировать эту среду выполнения через ACP.

## Выберите правильный путь MCP

У OpenClaw есть несколько поверхностей MCP. Выберите ту, которая соответствует тому, кто владеет средой выполнения агента и кто владеет инструментами.

| Цель                                                                | Используйте                                                                  | Почему                                                                                                             |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Разрешить внешнему MCP-клиенту читать/отправлять беседы каналов OpenClaw | `openclaw mcp serve`                                                 | OpenClaw является MCP-сервером и предоставляет беседы на базе Gateway через stdio.                                 |
| Сохранить сторонние MCP-серверы для запусков агентов, управляемых OpenClaw        | `openclaw mcp add`, `set`, `configure`, `tools`, `login`             | OpenClaw является клиентским реестром MCP и позже проецирует эти серверы в подходящие среды выполнения.               |
| Проверить сохраненный сервер без запуска хода агента                  | `openclaw mcp status`, `doctor`, `probe`                             | `status` и `doctor` проверяют конфигурацию; `probe` открывает живое MCP-соединение и перечисляет возможности.               |
| Редактировать конфигурацию MCP из браузера                                      | Control UI `/mcp`                                                    | Страница показывает инвентарь, включение, сводки OAuth/фильтров, подсказки команд и scoped-редактор `mcp`.         |
| Дать Codex app-server scoped нативный MCP-сервер                    | `mcp.servers.<name>.codex`                                           | Блок `codex` влияет только на проекцию потоков Codex app-server и удаляется перед передачей нативной конфигурации. |
| Запускать сеансы harness, размещенные через ACP                                     | [`openclaw acp`](/ru/cli/acp) и [ACP Agents](/ru/tools/acp-agents-setup) | Режим ACP-моста не принимает внедрение MCP-сервера на уровне сеанса; настройте мосты gateway/plugin вместо этого.     |

<Tip>
Если вы не уверены, какой путь вам нужен, начните с `openclaw mcp status --verbose`. Он показывает, что OpenClaw сохранил, не запуская MCP-серверы.
</Tip>

## OpenClaw как MCP-сервер

Это путь `openclaw mcp serve`.

### Когда использовать `serve`

Используйте `openclaw mcp serve`, когда:

- Codex, Claude Code или другой MCP-клиент должен напрямую взаимодействовать с беседами каналов на базе OpenClaw
- у вас уже есть локальный или удаленный OpenClaw Gateway с маршрутизируемыми сеансами
- вам нужен один MCP-сервер, который работает с разными канал backend OpenClaw вместо запуска отдельных мостов для каждого канала

Используйте [`openclaw acp`](/ru/cli/acp) вместо этого, когда OpenClaw должен сам размещать кодовую среду выполнения и держать сеанс агента внутри OpenClaw.

### Как это работает

`openclaw mcp serve` запускает stdio MCP-сервер. MCP-клиент владеет этим процессом. Пока клиент держит stdio-сеанс открытым, мост подключается к локальному или удаленному OpenClaw Gateway через WebSocket и предоставляет маршрутизированные беседы каналов через MCP.

<Steps>
  <Step title="Client spawns the bridge">
    MCP-клиент запускает `openclaw mcp serve`.
  </Step>
  <Step title="Bridge connects to Gateway">
    Мост подключается к OpenClaw Gateway через WebSocket.
  </Step>
  <Step title="Sessions become MCP conversations">
    Маршрутизированные сеансы становятся MCP-беседами и инструментами транскрипта/истории.
  </Step>
  <Step title="Live events queue">
    Живые события помещаются в очередь в памяти, пока мост подключен.
  </Step>
  <Step title="Optional Claude push">
    Если включен режим канала Claude, тот же сеанс также может получать push-уведомления, специфичные для Claude.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Important behavior">
    - состояние живой очереди начинается, когда мост подключается
    - более старая история транскрипта читается через `messages_read`
    - push-уведомления Claude существуют только пока MCP-сеанс активен
    - когда клиент отключается, мост завершается, а живая очередь исчезает
    - одноразовые точки входа агента, такие как `openclaw agent` и `openclaw infer model run`, завершают любые встроенные MCP-среды выполнения, которые они открывают, когда ответ завершен, поэтому повторные сценарные запуски не накапливают дочерние процессы stdio MCP
    - stdio MCP-серверы, запущенные OpenClaw (встроенные или настроенные пользователем), завершаются как дерево процессов при остановке, поэтому дочерние подпроцессы, запущенные сервером, не остаются после выхода родительского stdio-клиента
    - удаление или сброс сеанса освобождает MCP-клиентов этого сеанса через общий путь очистки среды выполнения, поэтому не остается зависших stdio-соединений, привязанных к удаленному сеансу

  </Accordion>
</AccordionGroup>

### Выберите режим клиента

Используйте один и тот же мост двумя разными способами:

<Tabs>
  <Tab title="Generic MCP clients">
    Только стандартные MCP-инструменты. Используйте `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` и инструменты одобрения.
  </Tab>
  <Tab title="Claude Code">
    Стандартные MCP-инструменты плюс адаптер канала, специфичный для Claude. Включите `--claude-channel-mode on` или оставьте значение по умолчанию `auto`.
  </Tab>
</Tabs>

<Note>
Сегодня `auto` ведет себя так же, как `on`. Обнаружения возможностей клиента пока нет.
</Note>

### Что предоставляет `serve`

Мост использует существующие метаданные маршрутов сеансов Gateway, чтобы предоставлять беседы на базе каналов. Беседа появляется, когда у OpenClaw уже есть состояние сеанса с известным маршрутом, таким как:

- `channel`
- метаданные получателя или назначения
- необязательный `accountId`
- необязательный `threadId`

Это дает MCP-клиентам одно место, чтобы:

- перечислять недавние маршрутизированные беседы
- читать недавнюю историю транскрипта
- ждать новые входящие события
- отправлять ответ обратно через тот же маршрут
- видеть запросы одобрения, которые поступают, пока мост подключен

### Использование

<Tabs>
  <Tab title="Local Gateway">
    ```bash
    openclaw mcp serve
    ```
  </Tab>
  <Tab title="Remote Gateway (token)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
    ```
  </Tab>
  <Tab title="Remote Gateway (password)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password
    ```
  </Tab>
  <Tab title="Verbose / Claude off">
    ```bash
    openclaw mcp serve --verbose
    openclaw mcp serve --claude-channel-mode off
    ```
  </Tab>
</Tabs>

### Инструменты моста

Текущий мост предоставляет эти MCP-инструменты:

<AccordionGroup>
  <Accordion title="conversations_list">
    Перечисляет недавние беседы на базе сеансов, у которых уже есть метаданные маршрута в состоянии сеанса Gateway.

    Полезные фильтры:

    - `limit`
    - `search`
    - `channel`
    - `includeDerivedTitles`
    - `includeLastMessage`

  </Accordion>
  <Accordion title="conversation_get">
    Возвращает одну беседу по `session_key` с использованием прямого поиска сеанса Gateway.
  </Accordion>
  <Accordion title="messages_read">
    Читает недавние сообщения транскрипта для одной беседы на базе сеанса.
  </Accordion>
  <Accordion title="attachments_fetch">
    Извлекает нетекстовые блоки содержимого сообщения из одного сообщения транскрипта. Это представление метаданных поверх содержимого транскрипта, а не отдельное долговечное хранилище blob-вложений.
  </Accordion>
  <Accordion title="events_poll">
    Читает живые события в очереди, начиная с числового курсора.
  </Accordion>
  <Accordion title="events_wait">
    Выполняет long-polling, пока не придет следующее подходящее событие в очереди или не истечет тайм-аут.

    Используйте это, когда универсальному MCP-клиенту нужна доставка почти в реальном времени без push-протокола, специфичного для Claude.

  </Accordion>
  <Accordion title="messages_send">
    Отправляет текст обратно через тот же маршрут, уже записанный в сеансе.

    Текущее поведение:

    - требует существующий маршрут беседы
    - использует канал, получателя, id учетной записи и id потока сеанса
    - отправляет только текст

  </Accordion>
  <Accordion title="permissions_list_open">
    Перечисляет ожидающие запросы одобрения exec/plugin, которые мост наблюдал с момента подключения к Gateway.
  </Accordion>
  <Accordion title="permissions_respond">
    Разрешает один ожидающий запрос одобрения exec/plugin с помощью:

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### Модель событий

Мост держит очередь событий в памяти, пока он подключен.

Текущие типы событий:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- очередь только живая; она начинается, когда запускается MCP-мост
- `events_poll` и `events_wait` сами по себе не воспроизводят более старую историю Gateway
- долговечный backlog следует читать через `messages_read`

</Warning>

### Уведомления канала Claude

Мост также может предоставлять уведомления канала, специфичные для Claude. Это эквивалент OpenClaw адаптера канала Claude Code: стандартные MCP-инструменты остаются доступными, но живые входящие сообщения также могут приходить как MCP-уведомления, специфичные для Claude.

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`: только стандартные MCP-инструменты.
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on`: включить уведомления канала Claude.
  </Tab>
  <Tab title="auto (default)">
    `--claude-channel-mode auto`: текущее значение по умолчанию; то же поведение моста, что и `on`.
  </Tab>
</Tabs>

Когда режим канала Claude включен, сервер объявляет экспериментальные возможности Claude и может выдавать:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Текущее поведение моста:

- входящие сообщения транскрипта `user` пересылаются как `notifications/claude/channel`
- запросы разрешений Claude, полученные через MCP, отслеживаются в памяти
- если связанная беседа позже отправляет `yes abcde` или `no abcde`, мост преобразует это в `notifications/claude/channel/permission`
- эти уведомления существуют только для живого сеанса; если MCP-клиент отключается, цели для push нет

Это намеренно специфично для клиента. Универсальные MCP-клиенты должны полагаться на стандартные инструменты polling.

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
  Подробные журналы в stderr.
</ParamField>

<Tip>
По возможности предпочитайте `--token-file` или `--password-file` секретам, переданным напрямую.
</Tip>

### Граница безопасности и доверия

Мост не придумывает маршрутизацию. Он только предоставляет доступ к беседам, которые Gateway уже умеет маршрутизировать.

Это означает:

- списки разрешенных отправителей, привязка и доверие на уровне канала по-прежнему относятся к базовой конфигурации канала OpenClaw
- `messages_send` может отвечать только через существующий сохраненный маршрут
- состояние подтверждений действует только в реальном времени/в памяти для текущего сеанса моста
- аутентификация моста должна использовать те же элементы управления токеном или паролем Gateway, которым вы доверили бы любой другой удаленный клиент Gateway

Если беседа отсутствует в `conversations_list`, обычная причина не в конфигурации MCP. Это отсутствующие или неполные метаданные маршрута в базовом сеансе Gateway.

### Тестирование

OpenClaw поставляется с детерминированным Docker smoke-тестом для этого моста:

```bash
pnpm test:docker:mcp-channels
```

Этот smoke-тест:

- запускает контейнер Gateway с предварительно заполненными данными
- запускает второй контейнер, который порождает `openclaw mcp serve`
- проверяет обнаружение бесед, чтение транскриптов, чтение метаданных вложений, поведение очереди живых событий и маршрутизацию исходящей отправки
- проверяет уведомления каналов и разрешений в стиле Claude через реальный stdio-мост MCP

Это самый быстрый способ доказать, что мост работает, без подключения реальной учетной записи Telegram, Discord или iMessage к тестовому запуску.

Более широкий контекст тестирования см. в разделе [Тестирование](/ru/help/testing).

### Устранение неполадок

<AccordionGroup>
  <Accordion title="Беседы не возвращаются">
    Обычно это означает, что сеанс Gateway еще не маршрутизируем. Убедитесь, что в базовом сеансе сохранены канал/провайдер, получатель и необязательные метаданные маршрута учетной записи/потока.
  </Accordion>
  <Accordion title="events_poll или events_wait пропускает более старые сообщения">
    Ожидаемо. Живая очередь запускается при подключении моста. Читайте более старую историю транскрипта через `messages_read`.
  </Accordion>
  <Accordion title="Уведомления Claude не появляются">
    Проверьте все следующее:

    - клиент держал сеанс stdio MCP открытым
    - `--claude-channel-mode` имеет значение `on` или `auto`
    - клиент действительно понимает специфичные для Claude методы уведомлений
    - входящее сообщение произошло после подключения моста

  </Accordion>
  <Accordion title="Подтверждения отсутствуют">
    `permissions_list_open` показывает только запросы подтверждения, наблюдавшиеся, пока мост был подключен. Это не надежный API истории подтверждений.
  </Accordion>
</AccordionGroup>

## OpenClaw как реестр клиентов MCP

Это путь `openclaw mcp list`, `show`, `status`, `doctor`, `probe`, `add`, `set`,
`configure`, `tools`, `login`, `logout`, `reload` и `unset`.

Эти команды не предоставляют OpenClaw через MCP. Они управляют определениями MCP-серверов под управлением OpenClaw в `mcp.servers` в конфигурации OpenClaw. Они не читают серверы mcporter из `config/mcporter.json`.

Эти сохраненные определения предназначены для сред выполнения, которые OpenClaw запускает или настраивает позже, например встроенного OpenClaw и других адаптеров сред выполнения. OpenClaw хранит определения централизованно, чтобы этим средам выполнения не требовалось поддерживать собственные дублирующиеся списки MCP-серверов.

<AccordionGroup>
  <Accordion title="Важное поведение">
    - эти команды только читают или записывают конфигурацию OpenClaw
    - `status`, `list`, `show`, `doctor` без `--probe`, `set`, `configure`, `tools`, `logout`, `reload` и `unset` не подключаются к целевому MCP-серверу
    - `login` выполняет сетевой поток MCP OAuth для настроенного HTTP-сервера и сохраняет полученные локальные учетные данные
    - `status --verbose` выводит разрешенные подсказки транспорта, аутентификации, тайм-аута, фильтра и параллельных вызовов инструментов без подключения
    - `doctor` проверяет сохраненные определения на локальные проблемы настройки, такие как отсутствующие команды stdio, недопустимые рабочие каталоги, отсутствующие TLS-файлы, отключенные серверы, буквальные чувствительные значения заголовков/env и неполная авторизация OAuth
    - `doctor --probe` добавляет такое же доказательство живого подключения, как `probe`, после прохождения статических проверок
    - `probe` подключается к выбранному серверу или всем настроенным серверам, перечисляет инструменты и сообщает о возможностях/диагностике
    - `add` строит определение из флагов и выполняет probe перед сохранением, если не задан `--no-probe` или сначала не требуется авторизация OAuth
    - адаптеры сред выполнения решают, какие формы транспорта они фактически поддерживают во время выполнения
    - `enabled: false` сохраняет сервер, но исключает его из обнаружения встроенной средой выполнения
    - `timeout` и `connectTimeout` задают тайм-ауты запросов и подключений для каждого сервера в секундах
    - `supportsParallelToolCalls: true` помечает серверы, которые адаптеры могут вызывать параллельно
    - HTTP-серверы могут использовать статические заголовки, OAuth-вход, управление проверкой TLS и пути к сертификату/ключу mTLS
    - встроенный OpenClaw предоставляет настроенные инструменты MCP в обычных профилях инструментов `coding` и `messaging`; `minimal` по-прежнему скрывает их, а `tools.deny: ["bundle-mcp"]` явно отключает их
    - серверные `toolFilter.include` и `toolFilter.exclude` фильтруют обнаруженные MCP-инструменты до того, как они станут инструментами OpenClaw
    - серверы, объявляющие ресурсы или prompts, также предоставляют служебные инструменты для перечисления/чтения ресурсов и перечисления/получения prompts; эти сгенерированные служебные имена (`resources_list`, `resources_read`, `prompts_list`, `prompts_get`) используют тот же фильтр include/exclude
    - динамические изменения списка MCP-инструментов инвалидируют кэшированный каталог для этого сеанса; следующее обнаружение/использование обновляет данные с сервера
    - повторяющиеся сбои запросов/протокола MCP-инструментов ненадолго приостанавливают этот сервер, чтобы один неисправный сервер не занимал весь ход
    - сеансовые bundled MCP-среды выполнения удаляются после `mcp.sessionIdleTtlMs` миллисекунд простоя (по умолчанию 10 минут; задайте `0`, чтобы отключить), а одноразовые встроенные запуски очищают их в конце запуска

  </Accordion>
</AccordionGroup>

Адаптеры сред выполнения могут нормализовать этот общий реестр в форму, которую ожидает их нижестоящий клиент. Например, встроенный OpenClaw использует значения `transport` OpenClaw напрямую, а Claude Code и Gemini получают нативные для CLI значения `type`, такие как `http`, `sse` или `stdio`.

Codex app-server также учитывает необязательный блок `codex` на каждом сервере. Это
проекционные метаданные OpenClaw только для потоков Codex app-server; они не
изменяют сеансы ACP, общую конфигурацию Codex harness или другие адаптеры сред выполнения.
Используйте непустой `codex.agents`, чтобы проецировать сервер только в конкретные
идентификаторы агентов OpenClaw. Пустые, blank или недопустимые списки агентов отклоняются проверкой
конфигурации и пропускаются путем проекции среды выполнения, а не становятся
глобальными. Используйте `codex.defaultToolsApprovalMode` (`auto`, `prompt` или `approve`),
чтобы сгенерировать нативный для Codex `default_tools_approval_mode` для доверенного сервера.
OpenClaw удаляет метаданные `codex` перед передачей нативной конфигурации `mcp_servers`
в Codex.

### Сохраненные определения MCP-серверов

OpenClaw также хранит облегченный реестр MCP-серверов в конфигурации для поверхностей, которым нужны MCP-определения под управлением OpenClaw.

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
- `show` без имени выводит полный настроенный объект MCP-сервера.
- `status` классифицирует настроенные транспорты без подключения. `--verbose` включает разрешенные сведения о запуске, тайм-ауте, OAuth, фильтре и параллельных вызовах.
- `doctor` выполняет статические проверки без подключения. Добавьте `--probe`, когда команда также должна проверить, что включенные серверы подключаются.
- `probe` подключается и сообщает количество инструментов, поддержку ресурсов/prompts, поддержку изменений списка и диагностику.
- `add` принимает stdio-флаги, такие как `--command`, `--arg`, `--env` и `--cwd`, или HTTP-флаги, такие как `--url`, `--transport`, `--header`, `--auth oauth`, TLS, тайм-аут и флаги выбора инструментов.
- `set` ожидает одно значение JSON-объекта в командной строке.
- `configure` обновляет включенность, фильтры инструментов, тайм-ауты, OAuth, TLS и подсказки параллельных вызовов инструментов без замены всего определения сервера.
- `tools` обновляет фильтры инструментов для каждого сервера. Записи include/exclude — это имена MCP-инструментов и простые glob-шаблоны `*`.
- `login` запускает поток OAuth для HTTP-серверов, настроенных с `auth: "oauth"`. Первый запуск выводит URL авторизации; повторно запустите с `--code` после подтверждения.
- `logout` очищает сохраненные учетные данные OAuth для указанного сервера, не удаляя сохраненное определение сервера.
- `reload` удаляет кэшированные внутрипроцессные MCP-среды выполнения. Процессам Gateway или агентов в другом процессе по-прежнему нужен собственный путь перезагрузки или рестарта.
- Используйте `transport: "streamable-http"` для Streamable HTTP MCP-серверов. `openclaw mcp set` также нормализует нативный для CLI `type: "http"` к той же канонической форме конфигурации для совместимости.
- `unset` завершается с ошибкой, если указанный сервер не существует.

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
  <Tab title="Файловая система">
    ```bash
    openclaw mcp add files \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-filesystem \
      --arg "$HOME/Documents" \
      --include 'read_file,list_directory,search_files'
    openclaw mcp doctor files --probe
    ```

    Ограничивайте файловые серверы самым маленьким деревом каталогов, которое агент должен читать или редактировать.

  </Tab>
  <Tab title="Память">
    ```bash
    openclaw mcp add memory \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-memory
    openclaw mcp probe memory --json
    ```

    Используйте фильтр инструментов, если сервер предоставляет инструменты записи, которые не должны быть доступны обычным агентам.

  </Tab>
  <Tab title="Локальный скрипт">
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

    Используйте OAuth, когда удаленный сервер его поддерживает. Если сервер требует статические заголовки, не фиксируйте буквальные bearer-токены в репозитории.

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

Используйте `--json` для скриптов и панелей мониторинга. Наборы полей со временем могут расширяться, поэтому потребители должны игнорировать неизвестные ключи.

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

    `doctor --json` завершается с ненулевым кодом, когда у любого включенного проверяемого сервера есть ошибка. Предупреждения выводятся, но сами по себе не приводят к сбою команды.

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

    `probe` открывает живой сеанс клиента MCP. Используйте его для проверки доступности и возможностей, а не для статических аудитов конфигурации.

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

Запускает локальный дочерний процесс и взаимодействует через stdin/stdout.

| Поле                       | Описание                              |
| -------------------------- | ------------------------------------- |
| `command`                  | Исполняемый файл для запуска (обязательно) |
| `args`                     | Массив аргументов командной строки    |
| `env`                      | Дополнительные переменные окружения   |
| `cwd` / `workingDirectory` | Рабочий каталог процесса              |

<Warning>
**Фильтр безопасности Stdio env**

OpenClaw отклоняет ключи env запуска интерпретатора, которые могут изменить запуск stdio MCP-сервера до первого RPC, даже если они появляются в блоке `env` сервера. Заблокированные ключи включают `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH` и похожие переменные управления средой выполнения. Запуск отклоняет их с ошибкой конфигурации, чтобы они не могли внедрить неявную прелюдию, подменить интерпретатор, включить отладчик или перенаправить вывод среды выполнения против stdio-процесса. Обычные учетные данные, прокси и серверные переменные env (`GITHUB_TOKEN`, `HTTP_PROXY`, пользовательские `*_API_KEY` и т. д.) не затрагиваются.

Если вашему MCP-серверу действительно нужна одна из заблокированных переменных, задайте ее в процессе хоста Gateway, а не в `env` stdio-сервера.
</Warning>

### Транспорт SSE / HTTP

Подключается к удаленному MCP-серверу по HTTP Server-Sent Events.

| Поле                           | Описание                                                       |
| ------------------------------ | -------------------------------------------------------------- |
| `url`                          | HTTP- или HTTPS-URL удаленного сервера (обязательно)           |
| `headers`                      | Необязательная карта HTTP-заголовков ключ-значение (например, auth-токены) |
| `connectionTimeoutMs`          | Тайм-аут подключения для сервера в мс (необязательно)          |
| `connectTimeout`               | Тайм-аут подключения для сервера в секундах (необязательно)    |
| `timeout` / `requestTimeoutMs` | Тайм-аут MCP-запроса для сервера в секундах или мс             |
| `auth: "oauth"`                | Использовать хранилище OAuth-токенов MCP и `openclaw mcp login` |
| `sslVerify`                    | Устанавливайте false только для явно доверенных частных HTTPS-точек доступа |
| `clientCert` / `clientKey`     | Пути к клиентскому сертификату и ключу mTLS                    |
| `supportsParallelToolCalls`    | Подсказка, что параллельные вызовы безопасны для этого сервера |

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

Чувствительные значения в `url` (userinfo) и `headers` редактируются в журналах и выводе статуса. `openclaw mcp doctor` предупреждает, когда похожие на чувствительные записи `headers` или `env` содержат буквальные значения, чтобы операторы могли вынести эти значения из зафиксированной конфигурации.

### Рабочий процесс OAuth

OAuth предназначен для HTTP MCP-серверов, которые объявляют поддержку потока OAuth MCP. Статические заголовки `Authorization` игнорируются для сервера, пока включен `auth: "oauth"`.

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

    OpenClaw выводит URL авторизации и сохраняет временное состояние OAuth verifier в каталоге состояния OpenClaw.

  </Step>
  <Step title="Finish with the code">
    После одобрения в браузере передайте возвращенный код обратно в OpenClaw.

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
    Logout удаляет сохраненные учетные данные OAuth, но сохраняет определение сервера.

    ```bash
    openclaw mcp logout docs
    ```

  </Step>
</Steps>

Если провайдер ротирует токены или состояние авторизации зависло, выполните `openclaw mcp logout <name>`, затем повторите `login`. `logout` может очистить учетные данные сохраненного HTTP-сервера даже после удаления `auth: "oauth"` из конфигурации, если имя сервера и URL по-прежнему идентифицируют запись хранилища учетных данных.

### Транспорт Streamable HTTP

`streamable-http` — дополнительный вариант транспорта наряду с `sse` и `stdio`. Он использует HTTP-стриминг для двунаправленного взаимодействия с удаленными MCP-серверами.

| Поле                           | Описание                                                       |
| ------------------------------ | -------------------------------------------------------------- |
| `url`                          | HTTP- или HTTPS-URL удаленного сервера (обязательно)           |
| `transport`                    | Установите `"streamable-http"`, чтобы выбрать этот транспорт; если значение опущено, OpenClaw использует `sse` |
| `headers`                      | Необязательная карта HTTP-заголовков ключ-значение (например, auth-токены) |
| `connectionTimeoutMs`          | Тайм-аут подключения для сервера в мс (необязательно)          |
| `connectTimeout`               | Тайм-аут подключения для сервера в секундах (необязательно)    |
| `timeout` / `requestTimeoutMs` | Тайм-аут MCP-запроса для сервера в секундах или мс             |
| `auth: "oauth"`                | Использовать хранилище OAuth-токенов MCP и `openclaw mcp login` |
| `sslVerify`                    | Устанавливайте false только для явно доверенных частных HTTPS-точек доступа |
| `clientCert` / `clientKey`     | Пути к клиентскому сертификату и ключу mTLS                    |
| `supportsParallelToolCalls`    | Подсказка, что параллельные вызовы безопасны для этого сервера |

Конфигурация OpenClaw использует `transport: "streamable-http"` как каноническое написание. Значения CLI-native MCP `type: "http"` принимаются при сохранении через `openclaw mcp set` и исправляются `openclaw doctor --fix` в существующей конфигурации, но именно `transport` напрямую потребляется встроенным OpenClaw.

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
Команды реестра не запускают мост канала. Только `probe` и `doctor --probe` открывают живой сеанс клиента MCP, чтобы доказать доступность целевого сервера.
</Note>

## Control UI

Браузерный Control UI включает выделенную страницу настроек MCP по адресу `/mcp`. Она показывает количество настроенных серверов, сводки по включению/OAuth/фильтрам, строки транспорта для каждого сервера, элементы управления включением/отключением, распространенные команды CLI и редактор с областью действия для секции конфигурации `mcp`.

Используйте страницу для операторских правок и быстрой инвентаризации. Используйте `openclaw mcp doctor --probe` или `openclaw mcp probe`, когда нужна живая проверка сервера.

Рабочий процесс оператора:

1. Откройте Control UI и выберите **MCP**.
2. Проверьте сводные карточки для общего числа, включенных, OAuth и отфильтрованных серверов.
3. Используйте строку каждого сервера для подсказок по транспорту, аутентификации, фильтру, тайм-ауту и командам.
4. Переключайте включение, когда хотите сохранить определение, но исключить его из обнаружения во время выполнения.
5. Отредактируйте scoped-раздел конфигурации `mcp` для структурных изменений, таких как новые серверы, заголовки, TLS, метаданные OAuth или фильтры инструментов.
6. Выберите **Сохранить**, чтобы только сохранить конфигурацию, или **Сохранить и опубликовать**, чтобы применить ее через путь конфигурации Gateway.
7. Запустите `openclaw mcp doctor --probe`, когда нужно live-подтверждение, что отредактированный сервер запускается и выводит список инструментов.

Примечания:

- фрагменты команд заключают имена серверов в кавычки, чтобы необычные имена оставались пригодными для копирования в shell
- отображаемые URL-подобные значения редактируются перед отображением, если содержат встроенные учетные данные
- страница сама не запускает MCP-транспорты
- активным средам выполнения может потребоваться `openclaw mcp reload`, публикация конфигурации Gateway или перезапуск процесса в зависимости от того, какой процесс владеет MCP-клиентами

## Текущие ограничения

На этой странице документируется мост в том виде, в котором он поставляется сегодня.

Текущие ограничения:

- обнаружение бесед зависит от существующих метаданных маршрута сессии Gateway
- нет универсального push-протокола помимо адаптера, специфичного для Claude
- инструментов для редактирования сообщений или реакций пока нет
- транспорт HTTP/SSE/streamable-http подключается к одному удаленному серверу; мультиплексированного upstream пока нет
- `permissions_list_open` включает только подтверждения, замеченные, пока мост подключен

## Связанные материалы

- [Справочник CLI](/ru/cli)
- [Plugins](/ru/cli/plugins)
