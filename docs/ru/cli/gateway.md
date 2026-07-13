---
read_when:
    - Запуск Gateway из CLI (для разработки или на серверах)
    - Отладка аутентификации Gateway, режимов привязки и подключения
    - Обнаружение шлюзов через Bonjour (локальный + глобальный DNS-SD)
sidebarTitle: Gateway
summary: CLI OpenClaw Gateway (`openclaw gateway`) — запуск, запрос и обнаружение шлюзов
title: Gateway
x-i18n:
    generated_at: "2026-07-13T19:37:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: fbbd236611d20a703b64719c2f05a95554107b8e847fb1a4dca55025890f238d
    source_path: cli/gateway.md
    workflow: 16
---

Gateway — это сервер WebSocket OpenClaw (каналы, узлы, сеансы, хуки). Все приведённые ниже подкоманды находятся в пространстве имён `openclaw gateway ...`.

<CardGroup cols={3}>
  <Card title="Обнаружение Bonjour" href="/ru/gateway/bonjour">
    Настройка локального mDNS и глобального DNS-SD.
  </Card>
  <Card title="Обзор обнаружения" href="/ru/gateway/discovery">
    Как OpenClaw объявляет шлюзы и находит их.
  </Card>
  <Card title="Конфигурация" href="/ru/gateway/configuration">
    Ключи конфигурации Gateway верхнего уровня.
  </Card>
</CardGroup>

## Запуск Gateway

```bash
openclaw gateway
openclaw gateway run   # эквивалентная явная форма
```

<AccordionGroup>
  <Accordion title="Поведение при запуске">
    - Не запускается, если `gateway.mode=local` не задан в `~/.openclaw/openclaw.json`. Для разовых запусков и разработки используйте `--allow-unconfigured`; этот параметр обходит проверку, не записывая и не исправляя конфигурацию.
    - `openclaw onboard --mode local` и `openclaw setup` записывают `gateway.mode=local`. Если файл конфигурации существует, но `gateway.mode` отсутствует, конфигурация считается повреждённой или перезаписанной, и Gateway не пытается самостоятельно определить `local` — повторно выполните первоначальную настройку, задайте ключ вручную или передайте `--allow-unconfigured`.
    - Привязка не только к loopback-интерфейсу без аутентификации блокируется.
    - Значения `--bind` `lan`, `tailnet` и `custom` сейчас разрешаются только через IPv4; при самостоятельной настройке хоста только с IPv6 перед Gateway требуется дополнительный компонент или прокси с IPv4.
    - `SIGUSR1` при наличии разрешения запускает перезапуск внутри процесса. `commands.restart` (по умолчанию включён) управляет отправленным извне `SIGUSR1`; задайте значение `false`, чтобы блокировать ручные перезапуски с помощью сигналов ОС, сохранив возможность перезапуска через команду `gateway restart`, инструмент Gateway, а также применение или обновление конфигурации.
    - `SIGINT`/`SIGTERM` останавливают процесс, но не восстанавливают пользовательское состояние терминала. Если CLI обёрнут в TUI или используется ввод в необработанном режиме, восстановите терминал самостоятельно перед завершением работы.

  </Accordion>
</AccordionGroup>

### Параметры

<ParamField path="--port <port>" type="number">
  Порт WebSocket (по умолчанию берётся из конфигурации или переменной среды; обычно `18789`).
</ParamField>
<ParamField path="--bind <mode>" type="string">
  Режим привязки: `loopback` (по умолчанию), `lan`, `tailnet`, `auto`, `custom`.
</ParamField>
<ParamField path="--token <token>" type="string">
  Общий токен для `connect.params.auth.token`. По умолчанию используется `OPENCLAW_GATEWAY_TOKEN`, если он задан.
</ParamField>
<ParamField path="--auth <mode>" type="string">
  Режим аутентификации: `none`, `token`, `password`, `trusted-proxy`.
</ParamField>
<ParamField path="--password <password>" type="string">
  Пароль для `--auth password`.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  Читать пароль Gateway из файла.
</ParamField>
<ParamField path="--tailscale <mode>" type="string">
  Предоставление доступа через Tailscale: `off`, `serve`, `funnel`.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Сбросить конфигурацию Tailscale serve/funnel при завершении работы.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Запустить без обязательной проверки `gateway.mode=local`. Только для разовой начальной настройки и разработки; конфигурация не сохраняется и не исправляется.
</ParamField>
<ParamField path="--dev" type="boolean">
  Создать конфигурацию и рабочую область для разработки, если они отсутствуют (без `BOOTSTRAP.md`).
</ParamField>
<ParamField path="--reset" type="boolean">
  Сбросить конфигурацию для разработки, учётные данные, сеансы и рабочую область. Требуется `--dev`.
</ParamField>
<ParamField path="--force" type="boolean">
  Перед запуском завершить любой существующий процесс, прослушивающий целевой порт.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Подробное журналирование в stdout/stderr.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Показывать в консоли только журналы серверной части CLI (также включает stdout/stderr).
</ParamField>
<ParamField path="--ws-log <style>" type="string" default="auto">
  Стиль журнала WebSocket: `auto`, `full`, `compact`.
</ParamField>
<ParamField path="--compact" type="boolean">
  Псевдоним для `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Записывать необработанные события потока модели в JSONL.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Путь к JSONL необработанного потока.
</ParamField>

`--claude-cli-logs` — устаревший псевдоним для `--cli-backend-logs`.

Для `--bind custom` задайте в `gateway.customBindHost` адрес IPv4. Любой адрес, кроме `127.0.0.1` или `0.0.0.0`, также требует `127.0.0.1` на том же порту для клиентов на этом же хосте; запуск завершается ошибкой, если хотя бы один из слушателей не может выполнить привязку. Подстановочный адрес `0.0.0.0` не добавляет отдельный обязательный псевдоним. При самостоятельной настройке хоста только с IPv6 перед Gateway требуется дополнительный компонент или прокси с IPv4.

## Перезапуск Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
openclaw gateway restart --wait 30s
```

`--safe` запрашивает у работающего Gateway предварительную проверку активных задач и планирует один объединённый перезапуск после их завершения. Ожидание ограничено параметром `gateway.reload.deferralTimeoutMs` (по умолчанию 5 минут / `300000`); после исчерпания лимита перезапуск выполняется принудительно. Задайте `deferralTimeoutMs: 0`, чтобы вместо принудительного перезапуска ждать неограниченно долго, периодически выводя предупреждения о незавершённых задачах. `--safe` нельзя использовать вместе с `--force` или `--wait`.

`--skip-deferral` обходит проверку отложенного перезапуска из-за активных задач при безопасном перезапуске, поэтому Gateway перезапускается немедленно даже при наличии заявленных блокирующих факторов. Для него требуется `--safe` — используйте этот параметр, если откладывание зависло из-за неконтролируемой задачи.

`--wait <duration>` переопределяет лимит ожидания завершения задач для обычного, небезопасного перезапуска. Принимает значение в миллисекундах без суффикса или с суффиксами единиц `ms`, `s`, `m`, `h`, `d` (например, `30s`, `5m`, `1h30m`); `--wait 0` задаёт неограниченное ожидание. Несовместим с `--force` и `--safe`.

`--force` пропускает ожидание завершения активных задач и выполняет немедленный перезапуск. Обычная команда `restart` без флагов сохраняет существующее поведение перезапуска через диспетчер служб.

<Warning>
Указанный непосредственно `--password` может отображаться в локальном списке процессов. Предпочтительно использовать `--password-file`, переменную среды или `gateway.auth.password` на основе SecretRef.
</Warning>

### Профилирование Gateway

- `OPENCLAW_GATEWAY_STARTUP_TRACE=1` записывает длительность этапов запуска, включая задержку `eventLoopMax` для каждого этапа и длительность построения таблиц поиска плагинов (индекс установленных компонентов, реестр манифестов, планирование запуска, построение карты владельцев).
- `OPENCLAW_GATEWAY_RESTART_TRACE=1` записывает относящиеся к перезапуску строки `restart trace:`: обработку сигналов, ожидание завершения активных задач, этапы остановки, следующий запуск, время готовности и показатели памяти.
- `OPENCLAW_DIAGNOSTICS=timeline` вместе с `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` записывает в режиме максимальных усилий хронологию диагностики запуска в формате JSONL для внешних стендов контроля качества (эквивалент конфигурации `diagnostics.flags: ["timeline"]`; путь по-прежнему задаётся только через переменную среды). Добавьте `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1`, чтобы включить выборки цикла событий.
- `pnpm build`, а затем `pnpm test:startup:gateway -- --runs 5 --warmup 1` измеряют производительность запуска Gateway через собранную точку входа CLI: первый вывод процесса, `/healthz`, `/readyz`, длительность этапов трассировки запуска, задержку цикла событий и время построения таблиц поиска плагинов.
- `pnpm build`, а затем `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` измеряют производительность внутрипроцессного перезапуска в macOS или Linux (в Windows не поддерживается; для перезапуска требуется `SIGUSR1`). Используется `SIGUSR1`; в дочернем процессе включаются обе трассировки и записываются следующие `/healthz`, следующие `/readyz`, время недоступности, время готовности, CPU, RSS и показатели трассировки перезапуска.
- `/healthz` проверяет работоспособность процесса; `/readyz` проверяет готовность к использованию. Рассматривайте строки трассировки и результаты измерений как сигнал для определения ответственного компонента, а не как полный вывод о производительности на основе одного интервала или замера.

## Запрос к работающему Gateway

Все команды запросов используют RPC через WebSocket.

<Tabs>
  <Tab title="Режимы вывода">
    - По умолчанию: удобочитаемый вывод (с цветами в TTY).
    - `--json`: машиночитаемый JSON (без оформления и индикатора выполнения).
    - `--no-color` (или `NO_COLOR=1`): отключить ANSI, сохранив удобочитаемую компоновку.

  </Tab>
  <Tab title="Общие параметры">
    - `--url <url>`: URL WebSocket для Gateway.
    - `--token <token>`: токен Gateway.
    - `--password <password>`: пароль Gateway.
    - `--timeout <ms>`: время ожидания или лимит времени (значение по умолчанию зависит от команды; см. описание каждой команды ниже).
    - `--expect-final`: ожидать «окончательного» ответа (вызовы агента).

  </Tab>
</Tabs>

<Note>
Если задан `--url`, CLI не использует резервные учётные данные из конфигурации или переменных среды. Передайте `--token` или `--password` явно. Отсутствие явно заданных учётных данных является ошибкой.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

`/healthz` — проверка работоспособности процесса: она завершается, как только сервер способен ответить по HTTP. `/readyz` строже и продолжает сообщать о неготовности, пока запускаемые вспомогательные процессы плагинов, каналы или настроенные хуки ещё переходят в рабочее состояние. Подробные локальные или аутентифицированные ответы `/readyz` содержат диагностический блок `eventLoop` (задержка, загрузка, отношение к числу ядер CPU, флаг `degraded`).

<ParamField path="--port <port>" type="number">
  Обращаться к локальному Gateway на loopback-интерфейсе через этот порт. Для данного вызова переопределяет `OPENCLAW_GATEWAY_URL` и `OPENCLAW_GATEWAY_PORT`.
</ParamField>

### `gateway usage-cost`

Получить сводки расходов на использование из журналов сеансов.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --agent work --json
openclaw gateway usage-cost --all-agents
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Количество учитываемых дней.
</ParamField>
<ParamField path="--agent <id>" type="string">
  Ограничить сводку одним идентификатором настроенного агента.
</ParamField>
<ParamField path="--all-agents" type="boolean">
  Объединить данные всех настроенных агентов. Нельзя использовать вместе с `--agent`.
</ParamField>

### `gateway stability`

Получить последние данные диагностического регистратора стабильности из работающего Gateway.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  Максимальное количество включаемых последних событий (не более `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Фильтровать по типу диагностического события, например `payload.large` или `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Включать только события после указанного номера диагностической последовательности.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Читать сохранённый пакет данных о стабильности вместо обращения к работающему Gateway. `--bundle latest` (или отдельный `--bundle`) выбирает новейший пакет в каталоге состояния; также можно напрямую передать путь к JSON-файлу пакета.
</ParamField>
<ParamField path="--export" type="boolean">
  Записать ZIP-архив с диагностическими данными для передачи службе поддержки вместо вывода сведений о стабильности.
</ParamField>
<ParamField path="--output <path>" type="string">
  Путь вывода для `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Конфиденциальность и поведение пакета">
    - Записи сохраняют операционные метаданные: названия событий, количества, размеры в байтах, показатели памяти, состояние очереди и сеанса, идентификаторы одобрений, названия каналов и плагинов, а также отредактированные сводки сеансов. Они не содержат текст чата, тела Webhook, результаты инструментов, необработанные тела запросов и ответов, токены, файлы cookie, секретные значения, имена хостов и необработанные идентификаторы сеансов. Установите `diagnostics.enabled: false`, чтобы полностью отключить средство записи.
    - При фатальном завершении Gateway, тайм-ауте остановки или сбое запуска после перезапуска тот же диагностический снимок записывается в `~/.openclaw/logs/stability/openclaw-stability-*.json`, если средство записи содержит события. Просмотрите новейший пакет с помощью `openclaw gateway stability --bundle latest`; `--limit`, `--type` и `--since-seq` также применяются к выводу пакета.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Создаёт локальный ZIP-архив диагностики, предназначенный для отчётов об ошибках. Модель конфиденциальности и содержимое пакета описаны в разделе [Экспорт диагностики](/ru/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Путь к выходному ZIP-архиву. По умолчанию создаётся экспорт для службы поддержки в каталоге состояния.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Максимальное количество включаемых очищенных строк журнала.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Максимальный объём журнала в байтах для проверки.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket Gateway для снимка работоспособности.
</ParamField>
<ParamField path="--token <token>" type="string">
  Токен Gateway для снимка работоспособности.
</ParamField>
<ParamField path="--password <password>" type="string">
  Пароль Gateway для снимка работоспособности.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Тайм-аут снимка состояния и работоспособности.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Пропустить поиск сохранённого пакета стабильности.
</ParamField>
<ParamField path="--json" type="boolean">
  Вывести записанный путь, размер и манифест в формате JSON.
</ParamField>

Экспорт объединяет в пакет: `manifest.json` (перечень файлов), `summary.md` (сводка Markdown), `diagnostics.json` (сводка верхнего уровня по конфигурации, журналам, обнаружению, стабильности, состоянию и работоспособности), `config/sanitized.json`, `status/gateway-status.json`, `health/gateway-health.json`, `logs/openclaw-sanitized.jsonl` и `stability/latest.json`, если пакет существует.

Экспорт предназначен для передачи другим лицам. Он сохраняет операционные сведения, полезные для отладки: безопасные поля журналов, названия подсистем, коды состояния, длительности, настроенные режимы, порты, идентификаторы плагинов и провайдеров, несекретные параметры функций и отредактированные операционные сообщения журналов. При этом он исключает или редактирует текст чата, тела Webhook, результаты инструментов, учётные данные, файлы cookie, идентификаторы учётных записей и сообщений, текст запросов и инструкций, имена хостов и секретные значения. Если сообщение журнала похоже на текст полезной нагрузки пользователя, чата или инструмента (например, «пользователь сказал», «текст чата», «результат инструмента», «тело Webhook»), экспорт сохраняет только факт пропуска сообщения и количество его байтов.

### `gateway status`

Показывает службу Gateway (launchd/systemd/schtasks), а также необязательную проверку подключения и аутентификации.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Добавить явную цель проверки. Настроенная удалённая цель и localhost по-прежнему проверяются.
</ParamField>
<ParamField path="--token <token>" type="string">
  Аутентификация по токену для проверки.
</ParamField>
<ParamField path="--password <password>" type="string">
  Аутентификация по паролю для проверки.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Тайм-аут проверки.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Пропустить проверку подключения (показать только службу).
</ParamField>
<ParamField path="--deep" type="boolean">
  Также сканировать службы системного уровня.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Расширить проверку подключения до проверки чтения и завершить работу с ненулевым кодом при её сбое. Нельзя использовать вместе с `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Семантика состояния">
    - Остаётся доступной для диагностики, даже если локальная конфигурация CLI отсутствует или недействительна.
    - Вывод по умолчанию подтверждает состояние службы, подключение WebSocket и возможность аутентификации, видимую во время рукопожатия, но не операции чтения, записи или администрирования.
    - Проверки не вносят изменений при первой аутентификации устройства: они повторно используют существующий кэшированный токен устройства, если он есть, но никогда не создают новую идентичность устройства CLI или запись сопряжения только для чтения исключительно для проверки состояния.
    - По возможности разрешает настроенные SecretRef аутентификации для проверки. Если обязательный SecretRef не разрешён, `--json` сообщает `rpc.authWarning` при сбое подключения или аутентификации проверки; явно передайте `--token`/`--password` либо исправьте источник секрета. После успешного завершения проверки предупреждения о неразрешённой аутентификации подавляются.
    - Вывод JSON содержит `gateway.version`, если его сообщает работающий Gateway; `--require-rpc` может использовать данные RPC `status.runtimeVersion`, если проверка рукопожатия не может предоставить метаданные версии.
    - Используйте `--require-rpc` в скриптах и автоматизации, когда работающей прослушивающей службы недостаточно и также требуется работоспособность RPC с областью чтения.
    - `--deep` сканирует дополнительные установки launchd/systemd/schtasks; если найдено несколько служб, похожих на Gateway, человекочитаемый вывод показывает рекомендации по очистке (обычно следует запускать один Gateway на каждом компьютере) и, когда применимо, сообщает о недавней передаче перезапуска диспетчером.
    - `--deep` также выполняет проверку конфигурации с учётом плагинов (`pluginValidation: "full"`) и показывает предупреждения манифеста плагина (например, об отсутствии метаданных конфигурации канала). Значение `gateway status` по умолчанию сохраняет быстрый путь только для чтения, пропускающий проверку плагинов.
    - Человекочитаемый вывод содержит разрешённый путь к файлу журнала, а также пути и сведения о действительности конфигурации CLI и службы, чтобы упростить диагностику расхождений профиля или каталога состояния.

  </Accordion>
  <Accordion title="Проверки расхождения аутентификации Linux systemd">
    - Проверки расхождения аутентификации службы считывают из юнита как `Environment=`, так и `EnvironmentFile=` (включая `%h`, пути в кавычках, несколько файлов и необязательные файлы `-`).
    - Разрешает SecretRef `gateway.auth.token` с помощью объединённого окружения среды выполнения (сначала окружение команды службы, затем резервное окружение процесса).
    - Проверки расхождения токенов пропускают разрешение токена конфигурации, если аутентификация по токену фактически не активна (`gateway.auth.mode` явно имеет значение `password`/`none`/`trusted-proxy` либо режим не задан, пароль может иметь приоритет и ни один кандидат на токен не может получить приоритет).

  </Accordion>
</AccordionGroup>

### `gateway probe`

Команда «отладить всё». Она всегда проверяет:

- настроенный удалённый Gateway (если задан) и
- localhost (интерфейс обратной связи), **даже если настроен удалённый Gateway**.

Передача `--url` добавляет эту явную цель перед обеими остальными. В человекочитаемом выводе цели обозначаются как `URL (explicit)`, `Remote (configured)` / `Remote (configured, inactive)` и `Local loopback`.

<Note>
Если доступно несколько целей проверки, выводятся все. SSH-туннель, URL TLS/прокси и настроенный удалённый URL могут указывать на один и тот же Gateway даже при разных транспортных портах; `multiple_gateways` предназначен для доступных шлюзов, которые различаются или чья идентичность неоднозначна. Запуск нескольких шлюзов поддерживается для изолированных профилей (например, резервного бота), но в большинстве установок работает один Gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  Использовать этот порт для локальной цели проверки через интерфейс обратной связи и удалённого порта SSH-туннеля. Без `--url` выбирается только локальная цель через интерфейс обратной связи вместо URL среды настроенного Gateway, порта окружения или удалённых целей.
</ParamField>

<AccordionGroup>
  <Accordion title="Интерпретация">
    - `Reachable: yes` означает, что хотя бы одна цель приняла подключение WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` сообщает, что проверке удалось подтвердить об аутентификации, отдельно от доступности.
    - `Read probe: ok` означает, что подробные вызовы RPC с областью чтения (`health`/`status`/`system-presence`/`config.get`) также завершились успешно.
    - `Read probe: limited - missing scope: operator.read` означает, что подключение выполнено успешно, но RPC с областью чтения ограничен. Это отображается как **ухудшенная** доступность, а не полный сбой.
    - `Read probe: failed` после `Connect: ok` означает, что WebSocket подключился, но последующая диагностика чтения завершилась по тайм-ауту или со сбоем — это также **ухудшенное состояние**, а не недоступность.
    - Как и `gateway status`, проверка повторно использует существующие кэшированные данные аутентификации устройства, но не создаёт идентичность устройства или состояние сопряжения при первом использовании.
    - Код завершения ненулевой только в том случае, если ни одна проверенная цель недоступна.

  </Accordion>
  <Accordion title="Вывод JSON">
    Верхний уровень:

    - `ok`: хотя бы одна цель доступна.
    - `degraded`: хотя бы одна цель приняла подключение, но не завершила полную подробную диагностику RPC.
    - `capability`: лучшая возможность среди доступных целей (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` или `unknown`).
    - `primaryTargetId`: лучшая цель, которую следует считать активной, в следующем порядке: явный URL, SSH-туннель, настроенная удалённая цель, локальный интерфейс обратной связи.
    - `warnings[]`: записи предупреждений по мере возможности с `code`, `message` и необязательным `targetIds`.
    - `network`: подсказки URL для локального интерфейса обратной связи и tailnet, полученные из текущей конфигурации и сетевых параметров хоста.
    - `discovery.timeoutMs` / `discovery.count`: фактический бюджет обнаружения и количество результатов, использованные в этом проходе проверки.

    Для каждой цели (`targets[].connect`): `ok` (доступность и классификация ухудшенного состояния), `rpcOk` (успешность полного подробного RPC), `scopeLimited` (сбой подробного RPC из-за отсутствия области оператора).

    Для каждой цели (`targets[].auth`): `role` и `scopes`, указанные в `hello-ok`, если доступны, а также отображаемая классификация `capability`.

  </Accordion>
  <Accordion title="Распространённые коды предупреждений">
    - `ssh_tunnel_failed`: не удалось настроить SSH-туннель; команда перешла к прямым проверкам.
    - `multiple_gateways`: были доступны разные идентичности Gateway либо OpenClaw не смог подтвердить, что доступные цели являются одним и тем же Gateway. SSH-туннель, URL прокси или настроенный удалённый URL к одному и тому же Gateway не вызывают это предупреждение.
    - `auth_secretref_unresolved`: настроенный SecretRef аутентификации не удалось разрешить для цели, проверка которой завершилась сбоем.
    - `probe_scope_limited`: подключение WebSocket выполнено успешно, но проверка чтения была ограничена из-за отсутствия `operator.read`.
    - `local_tls_runtime_unavailable`: локальный TLS Gateway включён, но OpenClaw не удалось загрузить отпечаток локального сертификата.

  </Accordion>
</AccordionGroup>

#### Удалённое подключение по SSH (аналог режима приложения Mac)

Режим приложения macOS "Remote over SSH" использует локальное перенаправление порта, чтобы удалённый Gateway, доступный только через интерфейс обратной связи, стал доступен по адресу `ws://127.0.0.1:<port>`.

Эквивалент для CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` или `user@host:port` (порт по умолчанию — `22`).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  Файл идентификации.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  Выбрать первый обнаруженный хост Gateway в качестве цели SSH из разрешённой конечной точки обнаружения (`local.` и настроенный глобальный домен, если он задан). Подсказки только из TXT игнорируются.
</ParamField>

Настройки конфигурации по умолчанию (необязательно): `gateway.remote.sshTarget`, `gateway.remote.sshIdentity`.

### `gateway call <method>`

Низкоуровневая вспомогательная функция RPC.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"limit": 200}'
```

<ParamField path="--params <json>" type="string" default="{}">
  Строка с объектом JSON для параметров.
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
<ParamField path="--timeout <ms>" type="number" default="10000">
  Лимит времени ожидания.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  В основном предназначено для RPC в стиле агентов, которые передают промежуточные события перед окончательными данными.
</ParamField>
<ParamField path="--json" type="boolean">
  Машиночитаемый вывод JSON.
</ParamField>

<Note>
`--params` должен быть допустимым JSON, а каждый метод проверяет собственную структуру параметров (лишние поля и поля с неверными именами отклоняются).
</Note>

## Управление службой Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### Установка с обёрткой

Используйте `--wrapper`, когда управляемая служба должна запускаться через другой исполняемый файл, например через промежуточный модуль диспетчера секретов или вспомогательную программу запуска от имени другого пользователя. Обёртка получает обычные аргументы Gateway и отвечает за последующий вызов через exec файла `openclaw` или Node с этими аргументами.

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

Обёртку также можно задать через окружение. `gateway install` проверяет, что путь указывает на исполняемый файл, записывает обёртку в `ProgramArguments` службы и сохраняет `OPENCLAW_WRAPPER` в окружении службы для последующих принудительных переустановок, обновлений и исправлений с помощью doctor.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Чтобы удалить сохранённую обёртку, очистите `OPENCLAW_WRAPPER` при переустановке:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Параметры команд">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node>` (по умолчанию: `node`), `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="Поведение жизненного цикла">
    - Используйте `gateway restart` для перезапуска управляемой службы. Не объединяйте `gateway stop` и `gateway start` в цепочку вместо перезапуска.
    - В macOS команда `gateway stop` по умолчанию использует `launchctl bootout`, что удаляет LaunchAgent из текущего сеанса загрузки без сохранения состояния отключения: автоматическое восстановление KeepAlive остаётся активным при будущих сбоях, а `gateway start` повторно включает службу без ручного выполнения `launchctl enable`. Передайте `--disable`, чтобы надолго отключить KeepAlive и RunAtLoad и не допустить повторного запуска Gateway до следующего явного выполнения `gateway start`; используйте этот вариант, если остановка вручную должна сохраняться после перезагрузок.
    - Команды жизненного цикла принимают `--json` для использования в сценариях.

  </Accordion>
  <Accordion title="Аутентификация и SecretRef при установке">
    - Когда для аутентификации по токену требуется токен, а `gateway.auth.token` управляется через SecretRef, `gateway install` проверяет возможность разрешения SecretRef, но не сохраняет разрешённый токен в метаданных окружения службы.
    - Если для аутентификации по токену требуется токен, а настроенный SecretRef токена не разрешается, установка завершается с отказом вместо сохранения резервного токена в виде обычного текста.
    - Для аутентификации по паролю в `gateway run` предпочитайте `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` или `gateway.auth.password` на основе SecretRef, а не встроенное значение `--password`.
    - В режиме автоматического определения аутентификации доступный только в оболочке `OPENCLAW_GATEWAY_PASSWORD` не отменяет требования к токену при установке; при установке управляемой службы используйте постоянную конфигурацию (`gateway.auth.password` или параметр конфигурации `env`).
    - Если настроены и `gateway.auth.token`, и `gateway.auth.password`, а `gateway.auth.mode` не задан, установка блокируется до явного выбора режима.

  </Accordion>
</AccordionGroup>

## Обнаружение шлюзов (Bonjour)

`gateway discover` выполняет поиск маяков Gateway (`_openclaw-gw._tcp`).

- Многоадресный DNS-SD: `local.`
- Одноадресный DNS-SD (глобальный Bonjour): выберите домен (например, `openclaw.internal.`) и настройте раздельный DNS и DNS-сервер; см. раздел [Bonjour](/ru/gateway/bonjour).

Маяк объявляют только шлюзы, на которых включено обнаружение Bonjour (по умолчанию).

Подсказки TXT в каждом маяке: `role` (подсказка о роли шлюза), `transport` (подсказка о транспорте, например `gateway`), `gatewayPort` (порт WebSocket, обычно `18789`), `tailnetDns` (имя хоста MagicDNS, если доступно), `gatewayTls` / `gatewayTlsSha256` (включение TLS и отпечаток сертификата). `sshPort` и `cliPath` публикуются только в режиме полного обнаружения (`discovery.mdns.mode: "full"`; по умолчанию используется `"minimal"`, при котором они не публикуются — в этом случае клиенты по умолчанию используют порт `22` для целевых узлов SSH).

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Время ожидания для каждой команды (обзор/разрешение).
</ParamField>
<ParamField path="--json" type="boolean">
  Машиночитаемый вывод (также отключает оформление и индикатор выполнения).
</ParamField>

Примеры:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- Сканирует `local.`, а также настроенный глобальный домен, если он включён.
- `wsUrl` в выводе JSON формируется из разрешённой конечной точки службы, а не только из подсказок TXT, таких как `lanHost` или `tailnetDns`.
- `discovery.mdns.mode` управляет публикацией `sshPort`/`cliPath` как в mDNS `local.`, так и в глобальном DNS-SD (см. выше).

</Note>

## Связанные материалы

- [Справочник CLI](/ru/cli)
- [Практическое руководство по Gateway](/ru/gateway)
