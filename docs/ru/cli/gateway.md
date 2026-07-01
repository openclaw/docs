---
read_when:
    - Запуск Gateway из CLI (разработка или серверы)
    - Отладка аутентификации Gateway, режимов привязки и подключения
    - Обнаружение Gateway через Bonjour (локальный + глобальный DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — запуск, запросы и обнаружение шлюзов
title: Gateway
x-i18n:
    generated_at: "2026-07-01T08:21:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 80f329ebd154f6fd0e87869c498c58fc6d5276a21934f8a36837653bd68a2d22
    source_path: cli/gateway.md
    workflow: 16
---

Gateway — это WebSocket-сервер OpenClaw (каналы, узлы, сеансы, хуки). Подкоманды на этой странице находятся в `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Обнаружение Bonjour" href="/ru/gateway/bonjour">
    Настройка локального mDNS + глобального DNS-SD.
  </Card>
  <Card title="Обзор обнаружения" href="/ru/gateway/discovery">
    Как OpenClaw объявляет и находит шлюзы.
  </Card>
  <Card title="Конфигурация" href="/ru/gateway/configuration">
    Ключи конфигурации gateway верхнего уровня.
  </Card>
</CardGroup>

## Запуск Gateway

Запустите локальный процесс Gateway:

```bash
openclaw gateway
```

Псевдоним для запуска на переднем плане:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="Поведение при запуске">
    - По умолчанию Gateway отказывается запускаться, если в `~/.openclaw/openclaw.json` не задано `gateway.mode=local`. Используйте `--allow-unconfigured` для разовых запусков или запусков в разработке.
    - Ожидается, что `openclaw onboard --mode local` и `openclaw setup` записывают `gateway.mode=local`. Если файл существует, но `gateway.mode` отсутствует, считайте это поврежденной или перезаписанной конфигурацией и исправьте ее, а не предполагайте локальный режим неявно.
    - Если файл существует и `gateway.mode` отсутствует, Gateway считает это подозрительным повреждением конфигурации и отказывается «угадывать local» за вас.
    - Привязка за пределами loopback без аутентификации блокируется (защитное ограничение).
    - `lan`, `tailnet` и `custom` сейчас разрешаются через IPv4-only пути BYOH.
    - IPv6-only BYOH сегодня не поддерживается нативно на этом пути. Используйте IPv4 sidecar или прокси, если сам хост является IPv6-only.
    - `SIGUSR1` запускает перезапуск внутри процесса, когда это разрешено (`commands.restart` включен по умолчанию; задайте `commands.restart: false`, чтобы заблокировать ручной перезапуск, при этом применение/обновление инструмента и конфигурации gateway останутся разрешенными).
    - Обработчики `SIGINT`/`SIGTERM` останавливают процесс gateway, но не восстанавливают пользовательское состояние терминала. Если вы оборачиваете CLI через TUI или ввод в raw-mode, восстановите терминал перед выходом.

  </Accordion>
</AccordionGroup>

### Параметры

<ParamField path="--port <port>" type="number">
  Порт WebSocket (значение по умолчанию берется из конфигурации/env; обычно `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Режим привязки слушателя. `lan`, `tailnet` и `custom` сейчас разрешаются через IPv4-only пути.
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
  Прочитать пароль gateway из файла.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Открыть доступ к Gateway через Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Сбросить конфигурацию Tailscale serve/funnel при завершении работы.
</ParamField>
<ParamField path="--bind custom + gateway.customBindHost" type="string">
  Сегодня ожидает IPv4-адрес. Для IPv6-only BYOH разместите IPv4 sidecar или прокси перед Gateway и укажите OpenClaw на эту IPv4-конечную точку.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Разрешить запуск gateway без `gateway.mode=local` в конфигурации. Обходит защиту запуска только для разовой/dev начальной загрузки; не записывает и не исправляет файл конфигурации.
</ParamField>
<ParamField path="--dev" type="boolean">
  Создать dev-конфигурацию + workspace, если они отсутствуют (пропускает BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Сбросить dev-конфигурацию + учетные данные + сеансы + workspace (требует `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  Завершить любой существующий слушатель на выбранном порту перед запуском.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Подробные журналы.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Показывать в консоли только журналы backend CLI (и включить stdout/stderr).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  Стиль журналов WebSocket.
</ParamField>
<ParamField path="--compact" type="boolean">
  Псевдоним для `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Записывать raw-события потока модели в jsonl.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Путь к raw-потоку jsonl.
</ParamField>

## Перезапуск Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
```

`openclaw gateway restart --safe` просит работающий Gateway предварительно проверить активную работу и запланировать один объединенный перезапуск после завершения активной работы. По умолчанию безопасный перезапуск ждет активную работу до настроенного `gateway.reload.deferralTimeoutMs` (по умолчанию 5 минут); когда этот бюджет истекает, перезапуск выполняется принудительно. Задайте `gateway.reload.deferralTimeoutMs` равным `0` для бессрочного безопасного ожидания, которое никогда не принуждает перезапуск. Обычный `restart` сохраняет существующее поведение service-manager; `--force` остается путем немедленного переопределения.

`openclaw gateway restart --safe --skip-deferral` выполняет тот же координированный с учетом OpenClaw перезапуск, что и `--safe`, но обходит блок отсрочки активной работы, поэтому Gateway отправляет перезапуск немедленно, даже когда сообщается о блокировщиках. Используйте это как аварийный выход оператора, когда отсрочка удерживается зависшим выполнением задачи, а один только `--safe` может быть ограничен `gateway.reload.deferralTimeoutMs`. `--skip-deferral` требует `--safe`.

<Warning>
Встроенный `--password` может быть виден в локальных списках процессов. Предпочитайте `--password-file`, env или `gateway.auth.password` на базе SecretRef.
</Warning>

### Профилирование Gateway

- Задайте `OPENCLAW_GATEWAY_STARTUP_TRACE=1`, чтобы записывать тайминги фаз при запуске Gateway, включая задержку `eventLoopMax` по фазам и тайминги таблиц поиска plugin для installed-index, реестра manifest, планирования запуска и работы owner-map.
- Задайте `OPENCLAW_GATEWAY_RESTART_TRACE=1`, чтобы записывать строки `restart trace:` в области перезапуска для обработки сигнала перезапуска, ожидания активной работы, фаз завершения, следующего старта, тайминга готовности и метрик памяти.
- Задайте `OPENCLAW_DIAGNOSTICS=timeline` с `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>`, чтобы записывать best-effort JSONL timeline диагностики запуска для внешних QA harnesses. Вы также можете включить флаг через `diagnostics.flags: ["timeline"]` в конфигурации; путь по-прежнему передается через env. Добавьте `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1`, чтобы включить выборки event-loop.
- Сначала выполните `pnpm build`, затем `pnpm test:startup:gateway -- --runs 5 --warmup 1`, чтобы измерить запуск Gateway относительно собранной точки входа CLI. Benchmark записывает первый вывод процесса, `/healthz`, `/readyz`, тайминги startup trace, задержку event-loop и детали таймингов таблиц поиска plugin.
- Сначала выполните `pnpm build`, затем `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5`, чтобы измерить перезапуск Gateway внутри процесса относительно собранной точки входа CLI на macOS или Linux. Benchmark перезапуска использует SIGUSR1, включает в дочернем процессе и startup, и restart trace, а также записывает следующий `/healthz`, следующий `/readyz`, downtime, тайминг готовности, CPU, RSS и метрики restart trace.
- Считайте `/healthz` индикатором живости, а `/readyz` — пригодной готовностью. Строки trace и вывод benchmark предназначены для атрибуции владельцам; не считайте один span trace или одну выборку полным выводом о производительности.

## Запрос работающего Gateway

Все команды запросов используют WebSocket RPC.

<Tabs>
  <Tab title="Режимы вывода">
    - По умолчанию: удобочитаемый формат (с цветом в TTY).
    - `--json`: машиночитаемый JSON (без оформления/spinner).
    - `--no-color` (или `NO_COLOR=1`): отключить ANSI, сохранив человекочитаемую компоновку.

  </Tab>
  <Tab title="Общие параметры">
    - `--url <url>`: WebSocket URL Gateway.
    - `--token <token>`: токен Gateway.
    - `--password <password>`: пароль Gateway.
    - `--timeout <ms>`: timeout/budget (зависит от команды).
    - `--expect-final`: ждать "final" ответ (вызовы agent).

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

HTTP-конечная точка `/healthz` — это probe живости: она возвращает ответ, когда сервер может отвечать по HTTP. HTTP-конечная точка `/readyz` строже и остается красной, пока startup sidecars plugin, каналы или настроенные hooks еще стабилизируются. Локальные или аутентифицированные подробные ответы готовности включают диагностический блок `eventLoop` с задержкой event-loop, использованием event-loop, соотношением ядер CPU и флагом `degraded`.

<ParamField path="--port <port>" type="number">
  Нацелиться на Gateway через local loopback на этом порту. Это переопределяет `OPENCLAW_GATEWAY_URL` и `OPENCLAW_GATEWAY_PORT` для health-вызова.
</ParamField>

### `gateway usage-cost`

Получить сводки usage-cost из журналов сеансов.

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
  Ограничить сводку стоимости одним настроенным id agent.
</ParamField>
<ParamField path="--all-agents" type="boolean">
  Агрегировать сводку стоимости по всем настроенным agents. Нельзя сочетать с `--agent`.
</ParamField>

### `gateway stability`

Получить недавний recorder диагностической стабильности из работающего Gateway.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  Максимальное количество недавних событий для включения (макс. `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Фильтровать по типу диагностического события, например `payload.large` или `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Включать только события после диагностического sequence number.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Читать сохраненный bundle стабильности вместо вызова работающего Gateway. Используйте `--bundle latest` (или просто `--bundle`) для новейшего bundle в каталоге состояния либо передайте путь к JSON bundle напрямую.
</ParamField>
<ParamField path="--export" type="boolean">
  Записать zip с диагностикой поддержки, пригодный для передачи, вместо вывода деталей стабильности.
</ParamField>
<ParamField path="--output <path>" type="string">
  Путь вывода для `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Приватность и поведение bundle">
    - Записи сохраняют операционные metadata: имена событий, счетчики, размеры в байтах, показания памяти, состояние очереди/сеанса, approval ids, имена channel/plugin и отредактированные сводки сеансов. Они не сохраняют текст чата, тела webhook, вывод инструментов, raw-тела запросов или ответов, токены, cookies, значения секретов, hostnames или raw id сеансов. Задайте `diagnostics.enabled: false`, чтобы полностью отключить recorder.
    - При фатальных завершениях Gateway, тайм-аутах shutdown и сбоях запуска при restart OpenClaw записывает тот же диагностический snapshot в `~/.openclaw/logs/stability/openclaw-stability-*.json`, когда у recorder есть события. Изучите новейший bundle с помощью `openclaw gateway stability --bundle latest`; `--limit`, `--type` и `--since-seq` также применяются к выводу bundle.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Записать локальный zip с диагностикой, предназначенный для прикрепления к bug reports. О модели приватности и содержимом bundle см. [Экспорт диагностики](/ru/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Путь выходного zip-файла. По умолчанию используется экспорт для поддержки в каталоге состояния.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Максимальное количество очищенных строк журнала для включения.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Максимальное количество байт журнала для проверки.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket Gateway для снимка состояния работоспособности.
</ParamField>
<ParamField path="--token <token>" type="string">
  Токен Gateway для снимка состояния работоспособности.
</ParamField>
<ParamField path="--password <password>" type="string">
  Пароль Gateway для снимка состояния работоспособности.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Тайм-аут снимка статуса/работоспособности.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Пропустить поиск сохраненного пакета стабильности.
</ParamField>
<ParamField path="--json" type="boolean">
  Вывести записанный путь, размер и манифест как JSON.
</ParamField>

Экспорт содержит манифест, сводку Markdown, форму конфигурации, очищенные сведения конфигурации, очищенные сводки журналов, очищенные снимки статуса/работоспособности Gateway и самый новый пакет стабильности, если он существует.

Он предназначен для совместного использования. Он сохраняет операционные сведения, полезные для отладки, такие как безопасные поля журналов OpenClaw, имена подсистем, коды статуса, длительности, настроенные режимы, порты, идентификаторы Plugin, идентификаторы провайдеров, несекретные настройки функций и отредактированные операционные сообщения журнала. Он опускает или редактирует текст чата, тела webhook, вывод инструментов, учетные данные, cookies, идентификаторы аккаунтов/сообщений, текст подсказок/инструкций, имена хостов и секретные значения. Когда сообщение в стиле LogTape выглядит как пользовательский/чатовый/инструментальный текст полезной нагрузки, экспорт сохраняет только факт, что сообщение было опущено, и количество его байт.

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
  Повысить стандартную проверку подключения до проверки чтения и завершиться с ненулевым кодом, если эта проверка чтения завершается ошибкой. Нельзя сочетать с `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Семантика статуса">
    - `gateway status` остается доступной для диагностики, даже когда локальная конфигурация CLI отсутствует или недействительна.
    - Стандартная `gateway status` подтверждает состояние службы, подключение WebSocket и возможность аутентификации, видимую во время рукопожатия. Она не подтверждает операции чтения/записи/администрирования.
    - Диагностические проверки не изменяют состояние при первой аутентификации устройства: они повторно используют существующий кэшированный токен устройства, если он есть, но не создают новую идентичность устройства CLI или запись сопряжения устройства только для чтения только для проверки статуса.
    - `gateway status` по возможности разрешает настроенные auth SecretRefs для аутентификации проверки.
    - Если обязательный auth SecretRef не разрешен в этом пути команды, `gateway status --json` сообщает `rpc.authWarning`, когда подключение/аутентификация проверки завершается ошибкой; передайте `--token`/`--password` явно или сначала разрешите источник секрета.
    - Если проверка успешна, предупреждения о неразрешенных auth-ref подавляются, чтобы избежать ложных срабатываний.
    - Когда проверка включена, вывод JSON включает `gateway.version`, если запущенный Gateway ее сообщает; `--require-rpc` может откатиться к полезной нагрузке RPC `status.runtimeVersion`, если последующая проверка рукопожатия не может предоставить метаданные версии.
    - Используйте `--require-rpc` в скриптах и автоматизации, когда прослушивающей службы недостаточно и вызовы RPC с областью чтения также должны быть работоспособны.
    - `--deep` добавляет best-effort-сканирование дополнительных установок launchd/systemd/schtasks. Когда обнаружено несколько служб, похожих на gateway, вывод для пользователя печатает подсказки по очистке и предупреждает, что в большинстве установок следует запускать один gateway на машину.
    - `--deep` также сообщает о недавней передаче перезапуска супервизора Gateway, когда процесс службы штатно завершился для внешнего перезапуска супервизором.
    - `--deep` запускает проверку конфигурации в режиме с учетом Plugin (`pluginValidation: "full"`) и показывает предупреждения настроенного манифеста Plugin (например, отсутствующие метаданные конфигурации канала), чтобы smoke-проверки установки и обновления их обнаруживали. Стандартная `gateway status` сохраняет быстрый путь только для чтения, который пропускает проверку Plugin.
    - Вывод для пользователя включает разрешенный путь файлового журнала, а также снимок путей/валидности конфигурации CLI и службы, чтобы помочь диагностировать расхождение профиля или каталога состояния.

  </Accordion>
  <Accordion title="Проверки расхождения аутентификации Linux systemd">
    - В установках Linux systemd проверки расхождения аутентификации службы читают значения `Environment=` и `EnvironmentFile=` из unit-файла (включая `%h`, пути в кавычках, несколько файлов и необязательные файлы с `-`).
    - Проверки расхождения разрешают SecretRefs `gateway.auth.token` с использованием объединенного runtime-окружения (сначала окружение команды службы, затем fallback на окружение процесса).
    - Если аутентификация токеном фактически не активна (явный `gateway.auth.mode` со значением `password`/`none`/`trusted-proxy` или не заданный режим, где пароль может победить и ни один кандидат токена не может победить), проверки расхождения токена пропускают разрешение токена конфигурации.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` — это команда «отладить все». Она всегда проверяет:

- ваш настроенный удаленный gateway (если задан), и
- localhost (local loopback) **даже если настроен удаленный**.

Если вы передаете `--url`, эта явная цель добавляется перед обеими. Вывод для пользователя помечает цели так:

- `URL (explicit)`
- `Remote (configured)` или `Remote (configured, inactive)`
- `Local loopback`

<Note>
Если доступны несколько целей проверки, команда печатает их все. SSH-туннель, URL TLS/proxy и настроенный удаленный URL могут указывать на один и тот же gateway, даже если их транспортные порты различаются; `multiple_gateways` предназначен для достижимых gateway, которые являются разными или имеют неоднозначную идентичность. Несколько gateway поддерживаются, когда вы используете изолированные профили (например, rescue bot), но большинство установок все равно запускают один gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  Использовать этот порт для цели проверки local loopback и удаленного порта SSH-туннеля. Без `--url` это выбирает цель local loopback вместо URL окружения настроенного gateway, порта окружения или удаленных целей.
</ParamField>

<AccordionGroup>
  <Accordion title="Интерпретация">
    - `Reachable: yes` означает, что хотя бы одна цель приняла подключение WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` сообщает, что проверка смогла подтвердить об аутентификации. Это отдельно от достижимости.
    - `Read probe: ok` означает, что вызовы RPC детализации с областью чтения (`health`/`status`/`system-presence`/`config.get`) также успешно выполнены.
    - `Read probe: limited - missing scope: operator.read` означает, что подключение успешно, но RPC с областью чтения ограничен. Это сообщается как **ухудшенная** достижимость, а не полный сбой.
    - `Read probe: failed` после `Connect: ok` означает, что Gateway принял соединение WebSocket, но последующая диагностика чтения превысила тайм-аут или завершилась ошибкой. Это также **ухудшенная** достижимость, а не недостижимый Gateway.
    - Как и `gateway status`, probe повторно использует существующую кэшированную аутентификацию устройства, но не создает идентичность устройства или состояние сопряжения при первом использовании.
    - Код выхода ненулевой только когда ни одна проверенная цель не достижима.

  </Accordion>
  <Accordion title="Вывод JSON">
    Верхний уровень:

    - `ok`: хотя бы одна цель достижима.
    - `degraded`: хотя бы одна цель приняла подключение, но не завершила полную подробную RPC-диагностику.
    - `capability`: лучшая возможность, замеченная среди достижимых целей (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` или `unknown`).
    - `primaryTargetId`: лучшая цель, которую следует считать активным победителем, в таком порядке: явный URL, SSH-туннель, настроенная удаленная цель, затем local loopback.
    - `warnings[]`: best-effort-записи предупреждений с `code`, `message` и необязательными `targetIds`.
    - `network`: подсказки URL local loopback/tailnet, полученные из текущей конфигурации и сетевых данных хоста.
    - `discovery.timeoutMs` и `discovery.count`: фактически использованный бюджет обнаружения/количество результатов для этого прохода проверки.

    Для каждой цели (`targets[].connect`):

    - `ok`: достижимость после подключения + классификация ухудшенного состояния.
    - `rpcOk`: полный успех подробного RPC.
    - `scopeLimited`: подробный RPC завершился ошибкой из-за отсутствующей области оператора.

    Для каждой цели (`targets[].auth`):

    - `role`: роль аутентификации, сообщенная в `hello-ok`, когда доступна.
    - `scopes`: предоставленные области, сообщенные в `hello-ok`, когда доступны.
    - `capability`: показанная классификация возможности аутентификации для этой цели.

  </Accordion>
  <Accordion title="Распространенные коды предупреждений">
    - `ssh_tunnel_failed`: настройка SSH-туннеля завершилась ошибкой; команда откатилась к прямым проверкам.
    - `multiple_gateways`: были достижимы разные идентичности gateway, или OpenClaw не смог доказать, что достижимые цели являются одним и тем же gateway. SSH-туннель, URL proxy или настроенный удаленный URL к тому же gateway не вызывают это предупреждение.
    - `auth_secretref_unresolved`: настроенный auth SecretRef не удалось разрешить для цели с ошибкой.
    - `probe_scope_limited`: подключение WebSocket успешно, но проверка чтения была ограничена из-за отсутствующего `operator.read`.

  </Accordion>
</AccordionGroup>

#### Удаленный доступ через SSH (паритет с приложением Mac)

Режим приложения macOS «Удаленный доступ через SSH» использует локальную переадресацию порта, чтобы удаленный gateway (который может быть привязан только к loopback) стал доступен по `ws://127.0.0.1:<port>`.

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
  Выбрать первый обнаруженный хост gateway как цель SSH из разрешенной конечной точки обнаружения (`local.` плюс настроенный глобальный домен, если есть). Подсказки только TXT игнорируются.
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
  Строка JSON-объекта для параметров.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket Gateway.
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
  В основном для RPC в стиле агента, которые перед финальной полезной нагрузкой передают промежуточные события.
</ParamField>
<ParamField path="--json" type="boolean">
  Машиночитаемый вывод JSON.
</ParamField>

<Note>
`--params` должен быть действительным JSON.
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
прослойку менеджера секретов или помощник для запуска от имени другого пользователя. Обертка получает обычные аргументы Gateway и
отвечает за последующий exec `openclaw` или Node с этими аргументами.

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

Вы также можете задать обертку через окружение. `gateway install` проверяет, что путь указывает на
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
  <Accordion title="Параметры команд">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="Поведение жизненного цикла">
    - Используйте `gateway restart`, чтобы перезапустить управляемый сервис. Не связывайте `gateway stop` и `gateway start` в цепочку как замену перезапуску.
    - В macOS `gateway stop` по умолчанию использует `launchctl bootout`, что удаляет LaunchAgent из текущего загрузочного сеанса без сохранения отключения — автоматическое восстановление KeepAlive остается активным для будущих сбоев, а `gateway start` повторно включает сервис без ручного `launchctl enable`. Передайте `--disable`, чтобы постоянно подавить KeepAlive и RunAtLoad, чтобы Gateway не запускался снова до следующего явного `gateway start`; используйте это, когда ручная остановка должна переживать перезагрузки или рестарты системы.
    - `gateway restart --safe` просит работающий Gateway предварительно проверить активную работу и запланировать один объединенный перезапуск после завершения активной работы. Безопасный перезапуск по умолчанию ожидает активную работу до настроенного `gateway.reload.deferralTimeoutMs` (по умолчанию 5 минут); когда этот бюджет истекает, перезапуск выполняется принудительно. Установите `gateway.reload.deferralTimeoutMs` в `0` для бессрочного безопасного ожидания, которое никогда не выполняет принудительный перезапуск. `--safe` нельзя сочетать с `--force` или `--wait`.
    - `gateway restart --wait 30s` переопределяет настроенный бюджет ожидания завершения работы для этого перезапуска. Числа без единиц измеряются в миллисекундах; поддерживаются единицы вроде `s`, `m` и `h`. `--wait 0` ждет бессрочно.
    - `gateway restart --safe --skip-deferral` выполняет безопасный перезапуск с учетом OpenClaw, но обходит шлюз отсрочки, поэтому Gateway немедленно выдает событие перезапуска, даже если сообщаются блокировщики. Аварийный выход для оператора при зависших отсрочках запусков задач; требует `--safe`.
    - `gateway restart --force` пропускает ожидание завершения активной работы и перезапускает немедленно. Используйте это, когда оператор уже проверил перечисленные блокировщики задач и хочет вернуть Gateway в работу прямо сейчас.
    - Команды жизненного цикла принимают `--json` для сценариев.

  </Accordion>
  <Accordion title="Auth и SecretRefs во время установки">
    - Когда token auth требует токен, а `gateway.auth.token` управляется через SecretRef, `gateway install` проверяет, что SecretRef можно разрешить, но не сохраняет разрешенный токен в метаданные окружения сервиса.
    - Если token auth требует токен, а настроенный SecretRef токена не разрешается, установка завершается отказом вместо сохранения fallback в виде открытого текста.
    - Для password auth в `gateway run` предпочитайте `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` или `gateway.auth.password` на базе SecretRef вместо встроенного `--password`.
    - В выводимом режиме auth заданный только в оболочке `OPENCLAW_GATEWAY_PASSWORD` не смягчает требования к токену при установке; при установке управляемого сервиса используйте устойчивую конфигурацию (`gateway.auth.password` или config `env`).
    - Если настроены и `gateway.auth.token`, и `gateway.auth.password`, а `gateway.auth.mode` не задан, установка блокируется, пока режим не будет задан явно.

  </Accordion>
</AccordionGroup>

## Обнаружение Gateway (Bonjour)

`gateway discover` сканирует маяки Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): выберите домен (пример: `openclaw.internal.`) и настройте split DNS + DNS-сервер; см. [Bonjour](/ru/gateway/bonjour).

Только Gateway с включенным обнаружением Bonjour (по умолчанию) объявляют маяк.

Записи обнаружения wide-area могут включать эти подсказки TXT:

- `role` (подсказка роли Gateway)
- `transport` (подсказка транспорта, например `gateway`)
- `gatewayPort` (порт WebSocket, обычно `18789`)
- `sshPort` (только режим полного обнаружения; клиенты по умолчанию используют SSH-цели на `22`, когда он отсутствует)
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
  Машиночитаемый вывод (также отключает стилизацию/спиннер).
</ParamField>

Примеры:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI сканирует `local.` плюс настроенный wide-area домен, когда он включен.
- `wsUrl` в выводе JSON выводится из разрешенной конечной точки сервиса, а не из подсказок только TXT, таких как `lanHost` или `tailnetDns`.
- В `local.` mDNS и wide-area DNS-SD `sshPort` и `cliPath` публикуются только когда `discovery.mdns.mode` равен `full`.

</Note>

## Связанные материалы

- [Справочник CLI](/ru/cli)
- [Ранбук Gateway](/ru/gateway)
