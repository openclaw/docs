---
read_when:
    - Запуск Gateway из CLI (разработка или серверы)
    - Отладка аутентификации Gateway, режимов привязки и подключения
    - Обнаружение Gateway через Bonjour (локальный и глобальный DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — запускайте, запрашивайте и обнаруживайте шлюзы
title: Gateway
x-i18n:
    generated_at: "2026-06-30T14:17:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c33900a9bdc61c1e922e424dbfce139c6591a7a5071ed8263b172e19bdf653b
    source_path: cli/gateway.md
    workflow: 16
---

Gateway — это WebSocket-сервер OpenClaw (каналы, узлы, сеансы, хуки). Подкоманды на этой странице находятся в `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Bonjour discovery" href="/ru/gateway/bonjour">
    Настройка локального mDNS + глобального DNS-SD.
  </Card>
  <Card title="Discovery overview" href="/ru/gateway/discovery">
    Как OpenClaw объявляет о Gateway и находит их.
  </Card>
  <Card title="Configuration" href="/ru/gateway/configuration">
    Ключи конфигурации Gateway верхнего уровня.
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
  <Accordion title="Startup behavior">
    - По умолчанию Gateway отказывается запускаться, если в `~/.openclaw/openclaw.json` не задано `gateway.mode=local`. Используйте `--allow-unconfigured` для разовых запусков или запусков в разработке.
    - Ожидается, что `openclaw onboard --mode local` и `openclaw setup` записывают `gateway.mode=local`. Если файл существует, но `gateway.mode` отсутствует, считайте это поврежденной или перезаписанной конфигурацией и исправьте ее, а не предполагайте неявно локальный режим.
    - Если файл существует, а `gateway.mode` отсутствует, Gateway считает это подозрительным повреждением конфигурации и отказывается «угадывать local» за вас.
    - Привязка за пределами loopback без аутентификации блокируется (защитное ограничение).
    - `lan`, `tailnet` и `custom` сейчас разрешаются по путям BYOH только для IPv4.
    - IPv6-only BYOH сейчас не поддерживается на этом пути нативно. Используйте IPv4-sidecar или прокси, если сам хост доступен только по IPv6.
    - `SIGUSR1` запускает перезапуск внутри процесса, когда это разрешено (`commands.restart` включен по умолчанию; задайте `commands.restart: false`, чтобы заблокировать ручной перезапуск, при этом применение/обновление через инструмент или конфигурацию Gateway останется разрешенным).
    - Обработчики `SIGINT`/`SIGTERM` останавливают процесс Gateway, но не восстанавливают пользовательское состояние терминала. Если вы оборачиваете CLI с помощью TUI или ввода в raw-режиме, восстановите терминал перед выходом.

  </Accordion>
</AccordionGroup>

### Параметры

<ParamField path="--port <port>" type="number">
  Порт WebSocket (значение по умолчанию берется из конфигурации/env; обычно `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Режим привязки слушателя. `lan`, `tailnet` и `custom` сейчас разрешаются по путям только для IPv4.
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
  Читать пароль Gateway из файла.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Открыть доступ к Gateway через Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Сбрасывать конфигурацию Tailscale serve/funnel при завершении работы.
</ParamField>
<ParamField path="--bind custom + gateway.customBindHost" type="string">
  Сейчас ожидает IPv4-адрес. Для IPv6-only BYOH разместите IPv4-sidecar или прокси перед Gateway и укажите OpenClaw на эту IPv4-конечную точку.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Разрешить запуск Gateway без `gateway.mode=local` в конфигурации. Обходит защиту запуска только для разовой/dev-загрузки; не записывает и не исправляет файл конфигурации.
</ParamField>
<ParamField path="--dev" type="boolean">
  Создать dev-конфигурацию + рабочую область, если они отсутствуют (пропускает BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Сбросить dev-конфигурацию + учетные данные + сеансы + рабочую область (требует `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  Завершить любой существующий слушатель на выбранном порту перед запуском.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Подробные журналы.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Показывать в консоли только журналы бэкенда CLI (и включить stdout/stderr).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  Стиль журнала WebSocket.
</ParamField>
<ParamField path="--compact" type="boolean">
  Псевдоним для `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Записывать необработанные события потока модели в jsonl.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Путь к необработанному потоку jsonl.
</ParamField>

## Перезапуск Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
```

`openclaw gateway restart --safe` просит работающий Gateway предварительно проверить активную работу и запланировать один объединенный перезапуск после ее завершения. Безопасный перезапуск по умолчанию ждет активную работу до настроенного `gateway.reload.deferralTimeoutMs` (по умолчанию 5 минут); когда этот лимит истекает, перезапуск выполняется принудительно. Задайте `gateway.reload.deferralTimeoutMs` равным `0` для бессрочного безопасного ожидания, которое никогда не принуждает перезапуск. Обычный `restart` сохраняет существующее поведение менеджера сервиса; `--force` остается немедленным путем переопределения.

`openclaw gateway restart --safe --skip-deferral` выполняет тот же скоординированный с учетом OpenClaw перезапуск, что и `--safe`, но обходит блок отсрочки активной работы, поэтому Gateway инициирует перезапуск сразу, даже если сообщается о блокировщиках. Используйте его как аварийный выход для оператора, когда отсрочка закреплена зависшим запуском задачи, а один только `--safe` может быть ограничен `gateway.reload.deferralTimeoutMs`. `--skip-deferral` требует `--safe`.

<Warning>
Встроенный `--password` может быть раскрыт в локальных списках процессов. Предпочитайте `--password-file`, env или `gateway.auth.password` с поддержкой SecretRef.
</Warning>

### Профилирование Gateway

- Задайте `OPENCLAW_GATEWAY_STARTUP_TRACE=1`, чтобы журналировать длительности фаз при запуске Gateway, включая задержку `eventLoopMax` по фазам и времена таблиц поиска Plugin для installed-index, реестра manifest, планирования запуска и работы owner-map.
- Задайте `OPENCLAW_GATEWAY_RESTART_TRACE=1`, чтобы журналировать строки `restart trace:` в области перезапуска для обработки сигнала перезапуска, ожидания завершения активной работы, фаз остановки, следующего запуска, времени готовности и метрик памяти.
- Задайте `OPENCLAW_DIAGNOSTICS=timeline` с `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>`, чтобы записывать best-effort JSONL-хронологию диагностик запуска для внешних QA-harness. Вы также можете включить флаг через `diagnostics.flags: ["timeline"]` в конфигурации; путь по-прежнему задается через env. Добавьте `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1`, чтобы включить выборки event loop.
- Сначала выполните `pnpm build`, затем `pnpm test:startup:gateway -- --runs 5 --warmup 1`, чтобы измерить запуск Gateway относительно собранной точки входа CLI. Бенчмарк записывает первый вывод процесса, `/healthz`, `/readyz`, длительности startup trace, задержку event loop и подробности времени таблиц поиска Plugin.
- Сначала выполните `pnpm build`, затем `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5`, чтобы измерить перезапуск Gateway внутри процесса относительно собранной точки входа CLI на macOS или Linux. Бенчмарк перезапуска использует SIGUSR1, включает и startup trace, и restart trace в дочернем процессе, а также записывает следующие `/healthz`, следующие `/readyz`, время простоя, время готовности, CPU, RSS и метрики restart trace.
- Считайте `/healthz` проверкой живости, а `/readyz` — готовностью к использованию. Строки трассировки и вывод бенчмарка предназначены для атрибуции владельцу; не считайте один промежуток трассировки или одну выборку полноценным выводом о производительности.

## Запрос к работающему Gateway

Все команды запросов используют WebSocket RPC.

<Tabs>
  <Tab title="Output modes">
    - По умолчанию: человекочитаемый формат (цветной в TTY).
    - `--json`: машиночитаемый JSON (без оформления/спиннера).
    - `--no-color` (или `NO_COLOR=1`): отключить ANSI, сохранив человекочитаемую разметку.

  </Tab>
  <Tab title="Shared options">
    - `--url <url>`: WebSocket URL Gateway.
    - `--token <token>`: токен Gateway.
    - `--password <password>`: пароль Gateway.
    - `--timeout <ms>`: таймаут/бюджет (зависит от команды).
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

HTTP-конечная точка `/healthz` — это проверка живости: она возвращает ответ, когда сервер может отвечать по HTTP. HTTP-конечная точка `/readyz` строже и остается красной, пока startup-sidecar для Plugin, каналы или настроенные хуки еще стабилизируются. Локальные или аутентифицированные подробные ответы готовности включают диагностический блок `eventLoop` с задержкой event loop, использованием event loop, соотношением ядер CPU и флагом `degraded`.

<ParamField path="--port <port>" type="number">
  Нацелиться на Gateway через local loopback на этом порту. Это переопределяет `OPENCLAW_GATEWAY_URL` и `OPENCLAW_GATEWAY_PORT` для вызова health.
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
  Ограничить сводку затрат одним настроенным id агента.
</ParamField>
<ParamField path="--all-agents" type="boolean">
  Агрегировать сводку затрат по всем настроенным агентам. Нельзя сочетать с `--agent`.
</ParamField>

### `gateway stability`

Получить недавний регистратор диагностической стабильности из работающего Gateway.

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
  Читать сохраненный пакет стабильности вместо вызова работающего Gateway. Используйте `--bundle latest` (или просто `--bundle`) для новейшего пакета в каталоге состояния либо передайте путь к JSON-пакету напрямую.
</ParamField>
<ParamField path="--export" type="boolean">
  Записать общедоступный zip с диагностикой для поддержки вместо вывода деталей стабильности.
</ParamField>
<ParamField path="--output <path>" type="string">
  Путь вывода для `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacy and bundle behavior">
    - Записи сохраняют операционные метаданные: имена событий, счетчики, размеры в байтах, показания памяти, состояние очереди/сеанса, имена каналов/Plugin и отредактированные сводки сеансов. Они не сохраняют текст чата, тела webhook, выводы инструментов, необработанные тела запросов или ответов, токены, cookies, секретные значения, имена хостов или необработанные id сеансов. Задайте `diagnostics.enabled: false`, чтобы полностью отключить регистратор.
    - При фатальных завершениях Gateway, таймаутах остановки и сбоях запуска после перезапуска OpenClaw записывает тот же диагностический снимок в `~/.openclaw/logs/stability/openclaw-stability-*.json`, когда у регистратора есть события. Просмотрите новейший пакет с помощью `openclaw gateway stability --bundle latest`; `--limit`, `--type` и `--since-seq` также применяются к выводу пакета.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Записать локальный zip с диагностикой, предназначенный для прикрепления к отчетам об ошибках. О модели приватности и содержимом пакета см. [Diagnostics Export](/ru/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Путь выходного zip-файла. По умолчанию используется экспорт для поддержки в каталоге состояния.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Максимальное количество санитизированных строк журнала для включения.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Максимальное количество байтов журнала для проверки.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket для Gateway для снимка работоспособности.
</ParamField>
<ParamField path="--token <token>" type="string">
  Токен Gateway для снимка работоспособности.
</ParamField>
<ParamField path="--password <password>" type="string">
  Пароль Gateway для снимка работоспособности.
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

Экспорт содержит манифест, сводку Markdown, форму конфигурации, санитизированные сведения конфигурации, санитизированные сводки журналов, санитизированные снимки статуса/работоспособности Gateway и самый новый пакет стабильности, если он существует.

Он предназначен для передачи другим людям. Он сохраняет операционные сведения, которые помогают при отладке, такие как безопасные поля журналов OpenClaw, имена подсистем, коды статуса, длительности, настроенные режимы, порты, идентификаторы plugin, идентификаторы провайдеров, несекретные настройки функций и отредактированные операционные сообщения журналов. Он пропускает или редактирует текст чатов, тела Webhook, вывод инструментов, учетные данные, cookies, идентификаторы учетных записей/сообщений, текст промптов/инструкций, имена хостов и секретные значения. Когда сообщение в стиле LogTape похоже на текст полезной нагрузки пользователя/чата/инструмента, экспорт сохраняет только факт, что сообщение было пропущено, и его размер в байтах.

### `gateway status`

`gateway status` показывает службу Gateway (launchd/systemd/schtasks) плюс необязательную проверку возможности подключения/аутентификации.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Добавить явную цель проверки. Настроенный удаленный адрес и localhost все равно проверяются.
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
  Повысить проверку подключения по умолчанию до проверки чтения и завершиться с ненулевым кодом, если эта проверка чтения завершается ошибкой. Нельзя сочетать с `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Семантика статуса">
    - `gateway status` остается доступной для диагностики, даже когда локальная конфигурация CLI отсутствует или недействительна.
    - `gateway status` по умолчанию доказывает состояние службы, подключение WebSocket и возможность аутентификации, видимую во время рукопожатия. Она не доказывает операции чтения/записи/администрирования.
    - Диагностические проверки не выполняют мутаций для первичной аутентификации устройства: они повторно используют существующий кэшированный токен устройства, когда он есть, но не создают новую идентичность устройства CLI или запись связывания устройства только для чтения только для проверки статуса.
    - `gateway status` по возможности разрешает настроенные SecretRefs аутентификации для аутентификации проверки.
    - Если обязательный SecretRef аутентификации не разрешен в этом пути команды, `gateway status --json` сообщает `rpc.authWarning`, когда проверка подключения/аутентификации завершается ошибкой; передайте `--token`/`--password` явно или сначала разрешите источник секрета.
    - Если проверка успешна, предупреждения о неразрешенных ссылках аутентификации подавляются, чтобы избежать ложных срабатываний.
    - Когда проверка включена, вывод JSON включает `gateway.version`, если запущенный Gateway сообщает ее; `--require-rpc` может откатиться к полезной нагрузке RPC `status.runtimeVersion`, если последующая проверка рукопожатия не может предоставить метаданные версии.
    - Используйте `--require-rpc` в скриптах и автоматизации, когда прослушивающей службы недостаточно и вам также нужны исправные RPC-вызовы с областью чтения.
    - `--deep` добавляет best-effort-сканирование дополнительных установок launchd/systemd/schtasks. Когда обнаружено несколько служб, похожих на gateway, человекочитаемый вывод печатает подсказки по очистке и предупреждает, что большинство конфигураций должны запускать один gateway на машину.
    - `--deep` также сообщает о недавней передаче перезапуска супервизора Gateway, когда процесс службы штатно завершился для внешнего перезапуска супервизором.
    - `--deep` запускает проверку конфигурации в режиме с учетом plugin (`pluginValidation: "full"`) и показывает предупреждения настроенных манифестов plugin (например, отсутствующие метаданные конфигурации канала), чтобы smoke-проверки установки и обновления их находили. `gateway status` по умолчанию сохраняет быстрый путь только для чтения, который пропускает проверку plugin.
    - Человекочитаемый вывод включает разрешенный путь файлового журнала плюс снимок путей/действительности конфигурации CLI и службы, чтобы помочь диагностировать дрейф профиля или каталога состояния.

  </Accordion>
  <Accordion title="Проверки дрейфа аутентификации Linux systemd">
    - В установках Linux systemd проверки дрейфа аутентификации службы читают значения `Environment=` и `EnvironmentFile=` из unit (включая `%h`, пути в кавычках, несколько файлов и необязательные файлы с `-`).
    - Проверки дрейфа разрешают SecretRefs `gateway.auth.token` с использованием объединенного runtime-окружения (сначала окружение команды службы, затем резервно окружение процесса).
    - Если аутентификация токеном фактически не активна (явный `gateway.auth.mode` со значением `password`/`none`/`trusted-proxy` либо режим не задан, когда пароль может выиграть и ни один кандидат токена не может выиграть), проверки дрейфа токена пропускают разрешение токена конфигурации.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` — команда «отладить все». Она всегда проверяет:

- ваш настроенный удаленный gateway (если задан), и
- localhost (loopback) **даже если удаленный адрес настроен**.

Если передать `--url`, эта явная цель добавляется перед обеими. Человекочитаемый вывод помечает цели так:

- `URL (explicit)`
- `Remote (configured)` или `Remote (configured, inactive)`
- `Local loopback`

<Note>
Если достижимы несколько целей проверки, команда выводит их все. SSH-туннель, TLS/proxy URL и настроенный удаленный URL могут указывать на один и тот же gateway, даже если их транспортные порты различаются; `multiple_gateways` зарезервирован для отдельных или неоднозначных по идентичности достижимых gateway. Несколько gateway поддерживаются, когда вы используете изолированные профили (например, rescue bot), но большинство установок все равно запускают один gateway.
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
    - `Reachable: yes` означает, что как минимум одна цель приняла подключение WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` сообщает, что проверка смогла доказать об аутентификации. Это отдельно от достижимости.
    - `Read probe: ok` означает, что RPC-вызовы деталей с областью чтения (`health`/`status`/`system-presence`/`config.get`) также успешно выполнены.
    - `Read probe: limited - missing scope: operator.read` означает, что подключение успешно, но RPC с областью чтения ограничен. Это сообщается как **ухудшенная** достижимость, а не полный сбой.
    - `Read probe: failed` после `Connect: ok` означает, что Gateway принял подключение WebSocket, но последующая диагностика чтения истекла по тайм-ауту или завершилась ошибкой. Это также **ухудшенная** достижимость, а не недостижимый Gateway.
    - Как и `gateway status`, probe повторно использует существующую кэшированную аутентификацию устройства, но не создает первичную идентичность устройства или состояние связывания.
    - Код выхода ненулевой только когда ни одна проверенная цель не достижима.

  </Accordion>
  <Accordion title="Вывод JSON">
    Верхний уровень:

    - `ok`: как минимум одна цель достижима.
    - `degraded`: как минимум одна цель приняла подключение, но не завершила полную детальную RPC-диагностику.
    - `capability`: лучшая возможность, обнаруженная среди достижимых целей (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` или `unknown`).
    - `primaryTargetId`: лучшая цель, которую следует считать активным победителем, в таком порядке: явный URL, SSH-туннель, настроенный удаленный адрес, затем local loopback.
    - `warnings[]`: best-effort-записи предупреждений с `code`, `message` и необязательными `targetIds`.
    - `network`: подсказки URL local loopback/tailnet, полученные из текущей конфигурации и сетевых параметров хоста.
    - `discovery.timeoutMs` и `discovery.count`: фактически использованный бюджет/количество результатов обнаружения для этого прохода проверки.

    Для каждой цели (`targets[].connect`):

    - `ok`: достижимость после подключения и классификации ухудшения.
    - `rpcOk`: полный успех детального RPC.
    - `scopeLimited`: детальный RPC завершился ошибкой из-за отсутствующей области оператора.

    Для каждой цели (`targets[].auth`):

    - `role`: роль аутентификации, сообщенная в `hello-ok`, когда доступна.
    - `scopes`: предоставленные области, сообщенные в `hello-ok`, когда доступны.
    - `capability`: показанная классификация возможности аутентификации для этой цели.

  </Accordion>
  <Accordion title="Распространенные коды предупреждений">
    - `ssh_tunnel_failed`: не удалось настроить SSH-туннель; команда вернулась к прямым проверкам.
    - `multiple_gateways`: были достижимы отдельные идентичности gateway, или OpenClaw не смог доказать, что достижимые цели являются одним и тем же gateway. SSH-туннель, proxy URL или настроенный удаленный URL к тому же gateway не вызывают это предупреждение.
    - `auth_secretref_unresolved`: настроенный SecretRef аутентификации не удалось разрешить для цели с ошибкой.
    - `probe_scope_limited`: подключение WebSocket успешно, но проверка чтения была ограничена отсутствующим `operator.read`.

  </Accordion>
</AccordionGroup>

#### Удаленный доступ через SSH (паритет с приложением Mac)

Режим приложения macOS «Remote over SSH» использует локальный проброс порта, чтобы удаленный gateway (который может быть привязан только к loopback) стал доступен по `ws://127.0.0.1:<port>`.

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
  Выбрать первый обнаруженный хост gateway как SSH-цель из разрешенной конечной точки обнаружения (`local.` плюс настроенный домен глобальной сети, если есть). Подсказки только TXT игнорируются.
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
  Строка JSON-объекта для params.
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
  В основном для RPC в стиле агентов, которые перед финальной полезной нагрузкой передают промежуточные события потоково.
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

Используйте `--wrapper`, когда управляемая служба должна запускаться через другой исполняемый файл, например через
прослойку менеджера секретов или вспомогательную программу запуска от имени другого пользователя. Обертка получает обычные аргументы Gateway и
отвечает за то, чтобы в итоге выполнить `openclaw` или Node с этими аргументами через exec.

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

Обертку также можно задать через окружение. `gateway install` проверяет, что путь указывает на
исполняемый файл, записывает обертку в `ProgramArguments` службы и сохраняет
`OPENCLAW_WRAPPER` в окружении службы для последующих принудительных переустановок, обновлений и исправлений через doctor.

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
    - Используйте `gateway restart`, чтобы перезапустить управляемую службу. Не объединяйте `gateway stop` и `gateway start` в цепочку как замену перезапуску.
    - В macOS `gateway stop` по умолчанию использует `launchctl bootout`, что удаляет LaunchAgent из текущего сеанса загрузки без сохранения отключения — автоматическое восстановление KeepAlive остается активным для будущих сбоев, а `gateway start` заново включает службу без ручного `launchctl enable`. Передайте `--disable`, чтобы постоянно подавить KeepAlive и RunAtLoad, чтобы Gateway не запускался повторно до следующего явного `gateway start`; используйте это, когда ручная остановка должна переживать перезагрузки или перезапуски системы.
    - `gateway restart --safe` просит работающий Gateway предварительно проверить активную работу и запланировать один объединенный перезапуск после завершения активной работы. Безопасный перезапуск по умолчанию ждет активную работу до настроенного `gateway.reload.deferralTimeoutMs` (по умолчанию 5 минут); когда этот лимит истекает, перезапуск выполняется принудительно. Установите `gateway.reload.deferralTimeoutMs` в `0` для бессрочного безопасного ожидания, которое никогда не принуждает перезапуск. `--safe` нельзя сочетать с `--force` или `--wait`.
    - `gateway restart --wait 30s` переопределяет настроенный лимит ожидания завершения работы для этого перезапуска. Числа без единиц измеряются в миллисекундах; принимаются единицы вроде `s`, `m` и `h`. `--wait 0` ждет бессрочно.
    - `gateway restart --safe --skip-deferral` выполняет безопасный перезапуск с учетом OpenClaw, но обходит шлюз отсрочки, поэтому Gateway инициирует перезапуск сразу, даже если сообщается о блокировках. Это аварийный выход для оператора при зависших отсрочках выполнений задач; требует `--safe`.
    - `gateway restart --force` пропускает ожидание завершения активной работы и перезапускает сразу. Используйте это, когда оператор уже проверил перечисленные блокирующие задачи и хочет немедленно вернуть Gateway в работу.
    - Команды жизненного цикла принимают `--json` для сценариев.

  </Accordion>
  <Accordion title="Аутентификация и SecretRefs во время установки">
    - Когда аутентификация по токену требует токен и `gateway.auth.token` управляется через SecretRef, `gateway install` проверяет, что SecretRef разрешается, но не сохраняет разрешенный токен в метаданные окружения службы.
    - Если аутентификация по токену требует токен, а настроенный SecretRef токена не разрешается, установка завершается закрытым отказом вместо сохранения резервного открытого текста.
    - Для аутентификации по паролю в `gateway run` предпочитайте `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` или `gateway.auth.password` на базе SecretRef вместо встроенного `--password`.
    - В режиме выводимой аутентификации доступный только в оболочке `OPENCLAW_GATEWAY_PASSWORD` не ослабляет требования к токену при установке; используйте долговременную конфигурацию (`gateway.auth.password` или `env` в конфигурации) при установке управляемой службы.
    - Если настроены и `gateway.auth.token`, и `gateway.auth.password`, а `gateway.auth.mode` не задан, установка блокируется, пока режим не будет задан явно.

  </Accordion>
</AccordionGroup>

## Обнаружение Gateway (Bonjour)

`gateway discover` сканирует маяки Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): выберите домен (пример: `openclaw.internal.`) и настройте split DNS + DNS-сервер; см. [Bonjour](/ru/gateway/bonjour).

Только Gateway с включенным обнаружением Bonjour (по умолчанию) публикуют маяк.

Записи обнаружения Wide-Area могут включать следующие TXT-подсказки:

- `role` (подсказка роли Gateway)
- `transport` (подсказка транспорта, например `gateway`)
- `gatewayPort` (порт WebSocket, обычно `18789`)
- `sshPort` (только режим полного обнаружения; клиенты по умолчанию используют `22` для целей SSH, когда он отсутствует)
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
  Машиночитаемый вывод (также отключает оформление/индикатор выполнения).
</ParamField>

Примеры:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI сканирует `local.` плюс настроенный домен Wide-Area, когда он включен.
- `wsUrl` в выводе JSON формируется из разрешенной конечной точки сервиса, а не из подсказок только в TXT, таких как `lanHost` или `tailnetDns`.
- В mDNS `local.` и Wide-Area DNS-SD, `sshPort` и `cliPath` публикуются только когда `discovery.mdns.mode` равен `full`.

</Note>

## См. также

- [Справочник CLI](/ru/cli)
- [Runbook Gateway](/ru/gateway)
