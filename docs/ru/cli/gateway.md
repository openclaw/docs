---
read_when:
    - Запуск Gateway из CLI (разработка или серверы)
    - Отладка аутентификации Gateway, режимов привязки и подключения
    - Обнаружение Gateway через Bonjour (локальный + глобальный DNS-SD)
sidebarTitle: Gateway
summary: CLI OpenClaw Gateway (`openclaw gateway`) — запуск, запросы и обнаружение шлюзов
title: Gateway
x-i18n:
    generated_at: "2026-06-28T22:43:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de9aaeff1b592e867ffadf49a076e6e0f7069b966244b19d4eed91993c3ad738
    source_path: cli/gateway.md
    workflow: 16
---

Gateway — это WebSocket-сервер OpenClaw (каналы, узлы, сессии, хуки). Подкоманды на этой странице находятся в `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Обнаружение Bonjour" href="/ru/gateway/bonjour">
    Настройка локального mDNS + глобального DNS-SD.
  </Card>
  <Card title="Обзор обнаружения" href="/ru/gateway/discovery">
    Как OpenClaw объявляет и находит шлюзы.
  </Card>
  <Card title="Конфигурация" href="/ru/gateway/configuration">
    Ключи конфигурации Gateway верхнего уровня.
  </Card>
</CardGroup>

## Запуск Gateway

Запустите локальный процесс Gateway:

```bash
openclaw gateway
```

Алиас для запуска на переднем плане:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="Поведение при запуске">
    - По умолчанию Gateway отказывается запускаться, если в `~/.openclaw/openclaw.json` не задано `gateway.mode=local`. Используйте `--allow-unconfigured` для разовых запусков или запусков в разработке.
    - Ожидается, что `openclaw onboard --mode local` и `openclaw setup` запишут `gateway.mode=local`. Если файл существует, но `gateway.mode` отсутствует, считайте это поврежденной или перезаписанной конфигурацией и исправьте ее, вместо того чтобы неявно предполагать локальный режим.
    - Если файл существует, а `gateway.mode` отсутствует, Gateway считает это подозрительным повреждением конфигурации и отказывается «угадывать local» за вас.
    - Привязка за пределами loopback без аутентификации блокируется (защитное ограничение).
    - `lan`, `tailnet` и `custom` сейчас разрешаются через BYOH-пути только IPv4.
    - BYOH только с IPv6 сейчас нативно не поддерживается на этом пути. Используйте IPv4-sidecar или прокси, если сам хост работает только с IPv6.
    - `SIGUSR1` запускает внутрипроцессный перезапуск, когда это разрешено (`commands.restart` включен по умолчанию; задайте `commands.restart: false`, чтобы заблокировать ручной перезапуск, при этом применение/обновление через инструмент или конфигурацию gateway остается разрешенным).
    - Обработчики `SIGINT`/`SIGTERM` останавливают процесс Gateway, но не восстанавливают какое-либо пользовательское состояние терминала. Если вы оборачиваете CLI с помощью TUI или ввода в raw-режиме, восстановите терминал перед выходом.

  </Accordion>
</AccordionGroup>

### Параметры

<ParamField path="--port <port>" type="number">
  WebSocket-порт (значение по умолчанию берется из конфигурации/env; обычно `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Режим привязки слушателя. `lan`, `tailnet` и `custom` сейчас разрешаются через пути только IPv4.
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  Переопределение режима аутентификации.
</ParamField>
<ParamField path="--token <token>" type="string">
  Переопределение токена (также задает `OPENCLAW_GATEWAY_TOKEN` для процесса).
</ParamField>
<ParamField path="--password <password>" type="string">
  Переопределение пароля.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  Читать пароль gateway из файла.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Открыть доступ к Gateway через Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Сбрасывать конфигурацию Tailscale serve/funnel при завершении работы.
</ParamField>
<ParamField path="--bind custom + gateway.customBindHost" type="string">
  На сегодня ожидается IPv4-адрес. Для BYOH только с IPv6 разместите IPv4-sidecar или прокси перед Gateway и укажите OpenClaw этот IPv4 endpoint.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Разрешить запуск gateway без `gateway.mode=local` в конфигурации. Обходит защиту запуска только для разовой/dev-начальной настройки; не записывает и не исправляет файл конфигурации.
</ParamField>
<ParamField path="--dev" type="boolean">
  Создать dev-конфигурацию + workspace, если они отсутствуют (пропускает BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Сбросить dev-конфигурацию + учетные данные + сессии + workspace (требует `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  Завершить любой существующий слушатель на выбранном порту перед запуском.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Подробные логи.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Показывать в консоли только логи backend CLI (и включить stdout/stderr).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  Стиль логов WebSocket.
</ParamField>
<ParamField path="--compact" type="boolean">
  Алиас для `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Логировать сырые события потока модели в jsonl.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Путь для raw stream jsonl.
</ParamField>

## Перезапуск Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
```

`openclaw gateway restart --safe` просит работающий Gateway выполнить предварительную проверку активной работы OpenClaw перед перезапуском. Если активны операции в очереди, доставка ответов, встроенные запуски или запуски задач, Gateway сообщает о блокерах, объединяет повторяющиеся запросы безопасного перезапуска и перезапускается после завершения активной работы. Обычный `restart` сохраняет существующее поведение менеджера служб для совместимости. Используйте `--force` только тогда, когда вам явно нужен путь немедленного принудительного переопределения.

`openclaw gateway restart --safe --skip-deferral` выполняет тот же скоординированный перезапуск с учетом OpenClaw, что и `--safe`, но обходит gate отсрочки активной работы, поэтому Gateway немедленно выдает перезапуск даже при сообщенных блокерах. Используйте это как аварийный выход оператора, когда отсрочка закреплена зависшим запуском задачи и один только `--safe` ждал бы бесконечно. `--skip-deferral` требует `--safe`.

<Warning>
Inline `--password` может быть раскрыт в локальных списках процессов. Предпочитайте `--password-file`, env или `gateway.auth.password` на основе SecretRef.
</Warning>

### Профилирование Gateway

- Задайте `OPENCLAW_GATEWAY_STARTUP_TRACE=1`, чтобы логировать тайминги фаз при запуске Gateway, включая задержку `eventLoopMax` по фазам и тайминги таблиц поиска плагинов для installed-index, registry манифестов, планирования запуска и работы owner-map.
- Задайте `OPENCLAW_GATEWAY_RESTART_TRACE=1`, чтобы логировать строки `restart trace:` в рамках перезапуска для обработки сигнала перезапуска, ожидания завершения активной работы, фаз завершения, следующего запуска, тайминга готовности и метрик памяти.
- Задайте `OPENCLAW_DIAGNOSTICS=timeline` с `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>`, чтобы записывать best-effort JSONL-таймлайн диагностики запуска для внешних QA harnesses. Также можно включить флаг через `diagnostics.flags: ["timeline"]` в конфигурации; путь по-прежнему предоставляется через env. Добавьте `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1`, чтобы включить выборки event-loop.
- Сначала выполните `pnpm build`, затем `pnpm test:startup:gateway -- --runs 5 --warmup 1`, чтобы измерить запуск Gateway относительно собранной точки входа CLI. Бенчмарк записывает первый вывод процесса, `/healthz`, `/readyz`, тайминги startup trace, задержку event-loop и подробности таймингов таблиц поиска плагинов.
- Сначала выполните `pnpm build`, затем `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5`, чтобы измерить внутрипроцессный перезапуск Gateway относительно собранной точки входа CLI на macOS или Linux. Бенчмарк перезапуска использует SIGUSR1, включает в дочернем процессе и startup, и restart traces, а также записывает следующие `/healthz`, `/readyz`, downtime, тайминг готовности, CPU, RSS и метрики restart trace.
- Считайте `/healthz` проверкой живости, а `/readyz` — пригодной готовностью. Строки трассировки и вывод бенчмарка предназначены для атрибуции владельцу; не считайте один интервал трассировки или одну выборку полноценным выводом о производительности.

## Запрос к работающему Gateway

Все команды запросов используют WebSocket RPC.

<Tabs>
  <Tab title="Режимы вывода">
    - По умолчанию: человекочитаемый (цветной в TTY).
    - `--json`: машиночитаемый JSON (без стилизации/спиннера).
    - `--no-color` (или `NO_COLOR=1`): отключить ANSI, сохранив человекочитаемую компоновку.

  </Tab>
  <Tab title="Общие параметры">
    - `--url <url>`: WebSocket URL Gateway.
    - `--token <token>`: токен Gateway.
    - `--password <password>`: пароль Gateway.
    - `--timeout <ms>`: timeout/бюджет (зависит от команды).
    - `--expect-final`: ждать «final» response (вызовы агента).

  </Tab>
</Tabs>

<Note>
Когда вы задаете `--url`, CLI не откатывается к учетным данным из конфигурации или окружения. Передайте `--token` или `--password` явно. Отсутствие явных учетных данных является ошибкой.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

HTTP endpoint `/healthz` — это liveness probe: он возвращает ответ, когда сервер может отвечать по HTTP. HTTP endpoint `/readyz` строже и остается красным, пока startup sidecars плагинов, каналы или настроенные хуки еще стабилизируются. Локальные или аутентифицированные подробные ответы готовности включают диагностический блок `eventLoop` с задержкой event-loop, утилизацией event-loop, соотношением ядер CPU и флагом `degraded`.

<ParamField path="--port <port>" type="number">
  Нацелиться на локальный local loopback Gateway на этом порту. Это переопределяет `OPENCLAW_GATEWAY_URL` и `OPENCLAW_GATEWAY_PORT` для вызова health.
</ParamField>

### `gateway usage-cost`

Получить сводки usage-cost из логов сессий.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --agent work --json
openclaw gateway usage-cost --all-agents
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Количество дней для включения.
</ParamField>
<ParamField path="--agent <id>" type="string">
  Ограничить сводку расходов одним настроенным id агента.
</ParamField>
<ParamField path="--all-agents" type="boolean">
  Агрегировать сводку расходов по всем настроенным агентам. Нельзя сочетать с `--agent`.
</ParamField>

### `gateway stability`

Получить недавние данные регистратора диагностической стабильности из работающего Gateway.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  Максимальное количество недавних событий для включения (максимум `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Фильтровать по типу диагностического события, например `payload.large` или `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Включать только события после номера диагностической последовательности.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Читать сохраненный bundle стабильности вместо вызова работающего Gateway. Используйте `--bundle latest` (или просто `--bundle`) для новейшего bundle в каталоге состояния либо передайте путь к bundle JSON напрямую.
</ParamField>
<ParamField path="--export" type="boolean">
  Записать общий zip-файл диагностики поддержки вместо вывода сведений о стабильности.
</ParamField>
<ParamField path="--output <path>" type="string">
  Путь вывода для `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Конфиденциальность и поведение bundle">
    - Записи хранят операционные метаданные: имена событий, счетчики, размеры в байтах, показания памяти, состояние очередей/сессий, имена каналов/плагинов и отредактированные сводки сессий. Они не хранят текст чата, тела webhook, выводы инструментов, сырые тела запросов или ответов, токены, cookies, секретные значения, имена хостов или сырые id сессий. Задайте `diagnostics.enabled: false`, чтобы полностью отключить регистратор.
    - При фатальных завершениях Gateway, таймаутах завершения и сбоях запуска после перезапуска OpenClaw записывает тот же диагностический snapshot в `~/.openclaw/logs/stability/openclaw-stability-*.json`, когда у регистратора есть события. Изучите новейший bundle с помощью `openclaw gateway stability --bundle latest`; `--limit`, `--type` и `--since-seq` также применяются к выводу bundle.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Записать локальный zip диагностики, предназначенный для прикрепления к отчетам об ошибках. О модели конфиденциальности и содержимом bundle см. [Экспорт диагностики](/ru/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Путь к выходному zip-файлу. По умолчанию используется экспорт поддержки в каталоге состояния.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Максимальное количество очищенных строк журнала для включения.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Максимальный объем байтов журнала для проверки.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket для Gateway для снимка состояния работоспособности.
</ParamField>
<ParamField path="--token <token>" type="string">
  Токен Gateway для снимка состояния работоспособности.
</ParamField>
<ParamField path="--password <password>" type="string">
  Пароль Gateway для снимка состояния работоспособности.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Тайм-аут снимка состояния/работоспособности.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Пропустить поиск сохраненного пакета стабильности.
</ParamField>
<ParamField path="--json" type="boolean">
  Вывести записанный путь, размер и манифест в формате JSON.
</ParamField>

Экспорт содержит манифест, сводку Markdown, форму конфигурации, очищенные сведения о конфигурации, очищенные сводки журналов, очищенные снимки состояния/работоспособности Gateway и самый новый пакет стабильности, если он существует.

Он предназначен для передачи другим. Он сохраняет операционные сведения, которые помогают при отладке, такие как безопасные поля журналов OpenClaw, имена подсистем, коды состояния, длительности, настроенные режимы, порты, идентификаторы plugin, идентификаторы провайдеров, несекретные настройки функций и отредактированные операционные сообщения журналов. Он пропускает или редактирует текст чатов, тела webhook, вывод инструментов, учетные данные, cookie, идентификаторы учетных записей/сообщений, текст промптов/инструкций, имена хостов и секретные значения. Когда сообщение в стиле LogTape похоже на текст пользовательской/чатовой/инструментальной полезной нагрузки, экспорт сохраняет только факт, что сообщение было пропущено, и количество его байтов.

### `gateway status`

`gateway status` показывает службу Gateway (launchd/systemd/schtasks) и необязательную проверку возможности подключения/аутентификации.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Добавить явную цель проверки. Настроенные удаленная цель и localhost все равно проверяются.
</ParamField>
<ParamField path="--token <token>" type="string">
  Аутентификация токеном для проверки.
</ParamField>
<ParamField path="--password <password>" type="string">
  Аутентификация паролем для проверки.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Тайм-аут проверки.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Пропустить проверку подключения (представление только службы).
</ParamField>
<ParamField path="--deep" type="boolean">
  Также сканировать службы системного уровня.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Повысить проверку подключения по умолчанию до проверки чтения и завершить работу с ненулевым кодом, если эта проверка чтения не пройдет. Нельзя сочетать с `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Status semantics">
    - `gateway status` остается доступной для диагностики, даже если локальная конфигурация CLI отсутствует или недействительна.
    - `gateway status` по умолчанию подтверждает состояние службы, подключение WebSocket и возможность аутентификации, видимую во время рукопожатия. Она не подтверждает операции чтения/записи/администрирования.
    - Диагностические проверки не изменяют состояние при первичной аутентификации устройства: они повторно используют существующий кэшированный токен устройства, если он есть, но не создают новую идентичность устройства CLI или запись связывания устройства только для чтения только для проверки состояния.
    - `gateway status` по возможности разрешает настроенные SecretRefs аутентификации для аутентификации проверки.
    - Если требуемый SecretRef аутентификации не разрешен в этом пути команды, `gateway status --json` сообщает `rpc.authWarning`, когда проверка подключения/аутентификации не проходит; передайте `--token`/`--password` явно или сначала разрешите источник секрета.
    - Если проверка проходит успешно, предупреждения о неразрешенных ссылках аутентификации подавляются, чтобы избежать ложных срабатываний.
    - Когда проверка включена, вывод JSON включает `gateway.version`, если запущенный Gateway сообщает ее; `--require-rpc` может откатиться к полезной нагрузке RPC `status.runtimeVersion`, если последующая проверка рукопожатия не может предоставить метаданные версии.
    - Используйте `--require-rpc` в скриптах и автоматизации, когда прослушивающей службы недостаточно и требуется, чтобы RPC-вызовы с областью чтения тоже были работоспособны.
    - `--deep` добавляет best-effort-сканирование дополнительных установок launchd/systemd/schtasks. Когда обнаружено несколько служб, похожих на gateway, человекочитаемый вывод печатает подсказки по очистке и предупреждает, что в большинстве установок должен выполняться один gateway на машину.
    - `--deep` также сообщает о недавней передаче перезапуска супервизора Gateway, когда процесс службы завершился корректно для внешнего перезапуска супервизором.
    - `--deep` запускает проверку конфигурации в режиме с учетом plugin (`pluginValidation: "full"`) и показывает предупреждения настроенного манифеста plugin (например, отсутствующие метаданные конфигурации канала), чтобы smoke-проверки установки и обновления их ловили. `gateway status` по умолчанию сохраняет быстрый путь только для чтения, который пропускает проверку plugin.
    - Человекочитаемый вывод включает разрешенный путь к файловому журналу, а также снимок путей/действительности конфигурации CLI и службы, чтобы помочь диагностировать расхождение профиля или каталога состояния.

  </Accordion>
  <Accordion title="Linux systemd auth-drift checks">
    - В установках Linux systemd проверки расхождения аутентификации службы читают значения `Environment=` и `EnvironmentFile=` из unit (включая `%h`, пути в кавычках, несколько файлов и необязательные файлы `-`).
    - Проверки расхождения разрешают SecretRefs `gateway.auth.token` с использованием объединенного runtime-окружения (сначала окружение команды службы, затем резервно окружение процесса).
    - Если аутентификация токеном фактически не активна (явный `gateway.auth.mode` со значением `password`/`none`/`trusted-proxy` или режим не задан, когда пароль может иметь приоритет и ни один кандидат токена не может иметь приоритет), проверки расхождения токена пропускают разрешение токена конфигурации.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` — это команда «отладить все». Она всегда проверяет:

- ваш настроенный удаленный gateway (если задан), и
- localhost (loopback) **даже если удаленная цель настроена**.

Если передать `--url`, эта явная цель добавляется перед ними. Человекочитаемый вывод помечает цели так:

- `URL (explicit)`
- `Remote (configured)` или `Remote (configured, inactive)`
- `Local loopback`

<Note>
Если доступны несколько целей проверки, она печатает их все. SSH-туннель, URL TLS/proxy и настроенный удаленный URL могут указывать на один и тот же gateway, даже если их транспортные порты различаются; `multiple_gateways` зарезервировано для отдельных или неоднозначных по идентичности достижимых gateway. Несколько gateway поддерживаются при использовании изолированных профилей (например, rescue-бота), но большинство установок все равно запускают один gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  Использовать этот порт для цели проверки local loopback и удаленного порта SSH-туннеля. Без `--url` это выбирает цель local loopback вместо настроенного URL окружения gateway, порта окружения или удаленных целей.
</ParamField>

<AccordionGroup>
  <Accordion title="Interpretation">
    - `Reachable: yes` означает, что как минимум одна цель приняла подключение WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` сообщает, что проверка смогла подтвердить об аутентификации. Это отдельно от достижимости.
    - `Read probe: ok` означает, что подробные RPC-вызовы с областью чтения (`health`/`status`/`system-presence`/`config.get`) также прошли успешно.
    - `Read probe: limited - missing scope: operator.read` означает, что подключение прошло успешно, но RPC с областью чтения ограничен. Это сообщается как **деградировавшая** достижимость, а не полный сбой.
    - `Read probe: failed` после `Connect: ok` означает, что Gateway принял подключение WebSocket, но последующая диагностика чтения истекла по тайм-ауту или завершилась ошибкой. Это также **деградировавшая** достижимость, а не недостижимый Gateway.
    - Как и `gateway status`, проверка повторно использует существующую кэшированную аутентификацию устройства, но не создает первичную идентичность устройства или состояние связывания.
    - Код выхода ненулевой только когда ни одна проверенная цель недостижима.

  </Accordion>
  <Accordion title="JSON output">
    Верхний уровень:

    - `ok`: как минимум одна цель достижима.
    - `degraded`: как минимум одна цель приняла подключение, но не завершила полную подробную RPC-диагностику.
    - `capability`: лучшая возможность, увиденная среди достижимых целей (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` или `unknown`).
    - `primaryTargetId`: лучшая цель, которую следует считать активным победителем, в таком порядке: явный URL, SSH-туннель, настроенная удаленная цель, затем local loopback.
    - `warnings[]`: best-effort-записи предупреждений с `code`, `message` и необязательными `targetIds`.
    - `network`: подсказки URL local loopback/tailnet, выведенные из текущей конфигурации и сетевых настроек хоста.
    - `discovery.timeoutMs` и `discovery.count`: фактический бюджет обнаружения/количество результатов, использованные для этого прохода проверки.

    Для каждой цели (`targets[].connect`):

    - `ok`: достижимость после подключения + классификация деградации.
    - `rpcOk`: полный успех подробного RPC.
    - `scopeLimited`: подробный RPC завершился неудачно из-за отсутствующей области оператора.

    Для каждой цели (`targets[].auth`):

    - `role`: роль аутентификации, сообщенная в `hello-ok`, когда доступна.
    - `scopes`: предоставленные области, сообщенные в `hello-ok`, когда доступны.
    - `capability`: показанная классификация возможности аутентификации для этой цели.

  </Accordion>
  <Accordion title="Common warning codes">
    - `ssh_tunnel_failed`: настройка SSH-туннеля завершилась неудачно; команда вернулась к прямым проверкам.
    - `multiple_gateways`: были достижимы отдельные идентичности gateway, или OpenClaw не смог подтвердить, что достижимые цели являются одним и тем же gateway. SSH-туннель, URL proxy или настроенный удаленный URL к тому же gateway не вызывает это предупреждение.
    - `auth_secretref_unresolved`: настроенный SecretRef аутентификации не удалось разрешить для неудачной цели.
    - `probe_scope_limited`: подключение WebSocket прошло успешно, но проверка чтения была ограничена отсутствующей `operator.read`.

  </Accordion>
</AccordionGroup>

#### Удаленный доступ через SSH (паритет с приложением Mac)

Режим приложения macOS «Remote over SSH» использует локальную переадресацию порта, чтобы удаленный gateway (который может быть привязан только к loopback) стал доступен по `ws://127.0.0.1:<port>`.

Эквивалент CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` или `user@host:port` (порт по умолчанию `22`).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  Файл идентичности.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  Выбрать первый обнаруженный хост gateway в качестве цели SSH из разрешенной конечной точки обнаружения (`local.` плюс настроенный глобальный домен, если есть). Подсказки только TXT игнорируются.
</ParamField>

Конфигурация (необязательно, используется как значения по умолчанию):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Низкоуровневый помощник RPC.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  Строка объекта JSON для параметров.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket для Gateway.
</ParamField>
<ParamField path="--token <token>" type="string">
  Токен Gateway.
</ParamField>
<ParamField path="--password <password>" type="string">
  Пароль Gateway.
</ParamField>
<ParamField path="--timeout <ms>" type="number">
  Бюджет тайм-аута.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  В основном для RPC в стиле агентов, которые перед финальной полезной нагрузкой транслируют промежуточные события.
</ParamField>
<ParamField path="--json" type="boolean">
  Машиночитаемый вывод JSON.
</ParamField>

<Note>
`--params` должен быть допустимым JSON.
</Note>

## Управление службой Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### Установка с оберткой

Используйте `--wrapper`, когда управляемый сервис должен запускаться через другой исполняемый файл, например через
прослойку менеджера секретов или помощник запуска от другого пользователя. Обертка получает обычные аргументы Gateway и
отвечает за то, чтобы в итоге выполнить `openclaw` или Node с этими аргументами.

```bash
cat > ~/.local/bin/openclaw-doppler <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
exec doppler run --project my-project --config production -- openclaw "$@"
EOF
chmod +x ~/.local/bin/openclaw-doppler

openclaw gateway install --wrapper ~/.local/bin/openclaw-doppler --force
openclaw gateway restart
```

Также можно задать обертку через окружение. `gateway install` проверяет, что путь указывает на
исполняемый файл, записывает обертку в `ProgramArguments` сервиса и сохраняет
`OPENCLAW_WRAPPER` в окружении сервиса для последующих принудительных переустановок, обновлений и исправлений через doctor.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Чтобы удалить сохраненную обертку, очистите `OPENCLAW_WRAPPER` при переустановке:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Параметры команды">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="Поведение жизненного цикла">
    - Используйте `gateway restart`, чтобы перезапустить управляемый сервис. Не объединяйте `gateway stop` и `gateway start` как замену перезапуску.
    - В macOS `gateway stop` по умолчанию использует `launchctl bootout`, что удаляет LaunchAgent из текущего загрузочного сеанса без сохранения отключения — автоматическое восстановление KeepAlive остается активным для будущих сбоев, а `gateway start` снова чисто включает сервис без ручного `launchctl enable`. Передайте `--disable`, чтобы постоянно подавить KeepAlive и RunAtLoad, чтобы Gateway не запускался повторно до следующего явного `gateway start`; используйте это, когда ручная остановка должна сохраняться после перезагрузок или рестартов системы.
    - `gateway restart --safe` просит работающий Gateway предварительно проверить активную работу OpenClaw и отложить перезапуск, пока не завершатся доставка ответов, встроенные запуски и запуски задач. `--safe` нельзя сочетать с `--force` или `--wait`.
    - `gateway restart --wait 30s` переопределяет настроенный бюджет ожидания завершения перед перезапуском для этого перезапуска. Числа без единиц измеряются в миллисекундах; принимаются единицы вроде `s`, `m` и `h`. `--wait 0` ожидает неограниченно.
    - `gateway restart --safe --skip-deferral` выполняет безопасный перезапуск с учетом OpenClaw, но обходит шлюз откладывания, поэтому Gateway немедленно отправляет событие перезапуска, даже если сообщены блокирующие факторы. Аварийный выход для оператора при зависших отложениях запусков задач; требует `--safe`.
    - `gateway restart --force` пропускает ожидание завершения активной работы и немедленно перезапускает сервис. Используйте это, когда оператор уже проверил перечисленные блокировщики задач и хочет вернуть Gateway в работу сейчас.
    - Команды жизненного цикла принимают `--json` для скриптов.

  </Accordion>
  <Accordion title="Аутентификация и SecretRef во время установки">
    - Когда аутентификация по токену требует токен и `gateway.auth.token` управляется через SecretRef, `gateway install` проверяет, что SecretRef разрешается, но не сохраняет разрешенный токен в метаданные окружения сервиса.
    - Если аутентификация по токену требует токен, а настроенный токен SecretRef не разрешается, установка завершается закрытым отказом вместо сохранения резервного открытого текста.
    - Для аутентификации по паролю в `gateway run` предпочитайте `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` или `gateway.auth.password` на базе SecretRef вместо встроенного `--password`.
    - В режиме выводимой аутентификации только shell-переменная `OPENCLAW_GATEWAY_PASSWORD` не ослабляет требования к токену при установке; используйте долговечную конфигурацию (`gateway.auth.password` или config `env`) при установке управляемого сервиса.
    - Если настроены и `gateway.auth.token`, и `gateway.auth.password`, а `gateway.auth.mode` не задан, установка блокируется, пока режим не будет задан явно.

  </Accordion>
</AccordionGroup>

## Обнаружение Gateway (Bonjour)

`gateway discover` сканирует маяки Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): выберите домен (пример: `openclaw.internal.`) и настройте split DNS + DNS-сервер; см. [Bonjour](/ru/gateway/bonjour).

Только Gateway с включенным обнаружением Bonjour (по умолчанию) публикуют маяк.

Записи широкозонного обнаружения могут включать эти TXT-подсказки:

- `role` (подсказка роли Gateway)
- `transport` (подсказка транспорта, например `gateway`)
- `gatewayPort` (порт WebSocket, обычно `18789`)
- `sshPort` (только режим полного обнаружения; клиенты по умолчанию используют SSH-цели `22`, когда он отсутствует)
- `tailnetDns` (имя хоста MagicDNS, когда доступно)
- `gatewayTls` / `gatewayTlsSha256` (TLS включен + отпечаток сертификата)
- `cliPath` (только режим полного обнаружения)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Тайм-аут для команды (browse/resolve).
</ParamField>
<ParamField path="--json" type="boolean">
  Машиночитаемый вывод (также отключает стилизацию/индикатор).
</ParamField>

Примеры:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI сканирует `local.` плюс настроенный широкозонный домен, когда он включен.
- `wsUrl` в JSON-выводе выводится из разрешенной конечной точки сервиса, а не из TXT-only подсказок вроде `lanHost` или `tailnetDns`.
- В `local.` mDNS и широкозонном DNS-SD `sshPort` и `cliPath` публикуются только когда `discovery.mdns.mode` равен `full`.

</Note>

## Связанные материалы

- [Справочник CLI](/ru/cli)
- [Регламент Gateway](/ru/gateway)
