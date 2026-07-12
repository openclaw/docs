---
read_when:
    - Запуск Gateway из CLI (для разработки или на серверах)
    - Отладка аутентификации Gateway, режимов привязки и подключения
    - Обнаружение Gateway через Bonjour (локальная и глобальная DNS-SD)
sidebarTitle: Gateway
summary: CLI Gateway OpenClaw (`openclaw gateway`) — запуск, запрос и обнаружение шлюзов
title: Gateway
x-i18n:
    generated_at: "2026-07-12T11:16:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 75f8f4bebe585b213f486f08bf20015aeb89ca4d179f6d96c1008ec9d1cd00ea
    source_path: cli/gateway.md
    workflow: 16
---

Gateway — это WebSocket-сервер OpenClaw (каналы, узлы, сеансы, обработчики). Все приведённые ниже подкоманды находятся в пространстве `openclaw gateway ...`.

<CardGroup cols={3}>
  <Card title="Обнаружение Bonjour" href="/ru/gateway/bonjour">
    Настройка локального mDNS и глобального DNS-SD.
  </Card>
  <Card title="Обзор обнаружения" href="/ru/gateway/discovery">
    Как OpenClaw объявляет о шлюзах и находит их.
  </Card>
  <Card title="Конфигурация" href="/ru/gateway/configuration">
    Ключи верхнего уровня конфигурации Gateway.
  </Card>
</CardGroup>

## Запуск Gateway

```bash
openclaw gateway
openclaw gateway run   # эквивалентная явная форма
```

<AccordionGroup>
  <Accordion title="Поведение при запуске">
    - Запуск отклоняется, если в `~/.openclaw/openclaw.json` не задано `gateway.mode=local`. Для разовых запусков или запуска при разработке используйте `--allow-unconfigured`; этот флаг обходит проверку, не записывая и не исправляя конфигурацию.
    - `openclaw onboard --mode local` и `openclaw setup` записывают `gateway.mode=local`. Если файл конфигурации существует, но `gateway.mode` отсутствует, конфигурация считается повреждённой или перезаписанной, и Gateway не будет самостоятельно подставлять `local` — повторно выполните первоначальную настройку, задайте ключ вручную или передайте `--allow-unconfigured`.
    - Привязка к адресам за пределами loopback без аутентификации блокируется.
    - В настоящее время значения `lan`, `tailnet` и `custom` параметра `--bind` разрешаются только по путям IPv4; для конфигураций с собственным хостом, поддерживающих только IPv6, требуется вспомогательный компонент IPv4 или прокси перед Gateway.
    - `SIGUSR1` инициирует перезапуск внутри процесса, если это разрешено. `commands.restart` (по умолчанию включён) управляет отправляемым извне `SIGUSR1`; установите значение `false`, чтобы заблокировать ручные перезапуски посредством сигнала ОС, сохранив возможность перезапуска через команду `gateway restart`, инструмент Gateway и применение или обновление конфигурации.
    - `SIGINT`/`SIGTERM` останавливают процесс, но не восстанавливают нестандартное состояние терминала — если CLI обёрнут в TUI или использует ввод в необработанном режиме, восстановите терминал самостоятельно перед завершением работы.

  </Accordion>
</AccordionGroup>

### Параметры

<ParamField path="--port <port>" type="number">
  Порт WebSocket (по умолчанию берётся из конфигурации или переменных окружения; обычно `18789`).
</ParamField>
<ParamField path="--bind <mode>" type="string">
  Режим привязки: `loopback` (по умолчанию), `lan`, `tailnet`, `auto`, `custom`.
</ParamField>
<ParamField path="--token <token>" type="string">
  Общий токен для `connect.params.auth.token`. Если задана переменная `OPENCLAW_GATEWAY_TOKEN`, по умолчанию используется её значение.
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
  Публикация через Tailscale: `off`, `serve`, `funnel`.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Сбрасывать конфигурацию Tailscale serve/funnel при завершении работы.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Запустить без обязательного требования `gateway.mode=local`. Только для разовой загрузки или разработки; конфигурация не сохраняется и не исправляется.
</ParamField>
<ParamField path="--dev" type="boolean">
  Создать конфигурацию и рабочее пространство для разработки, если они отсутствуют (без `BOOTSTRAP.md`).
</ParamField>
<ParamField path="--reset" type="boolean">
  Сбросить конфигурацию для разработки, учётные данные, сеансы и рабочее пространство. Требует `--dev`.
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

Для `--bind custom` задайте в `gateway.customBindHost` IPv4-адрес. Для любого адреса, кроме `127.0.0.1` и `0.0.0.0`, также требуется `127.0.0.1` на том же порту для клиентов на этом же хосте; запуск завершится ошибкой, если хотя бы один из слушателей не сможет выполнить привязку. Подстановочный адрес `0.0.0.0` не добавляет отдельный обязательный псевдоним. Для конфигураций с собственным хостом, поддерживающих только IPv6, требуется вспомогательный компонент IPv4 или прокси перед Gateway.

## Перезапуск Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
openclaw gateway restart --wait 30s
```

`--safe` запрашивает у работающего Gateway предварительную проверку активных задач и планирование одного объединённого перезапуска после их завершения. Время ожидания ограничивается `gateway.reload.deferralTimeoutMs` (по умолчанию 5 минут / `300000`); после исчерпания лимита выполняется принудительный перезапуск. Установите `deferralTimeoutMs: 0`, чтобы ждать неограниченно долго, периодически выводя предупреждения о незавершённой работе, а не выполнять принудительный перезапуск. `--safe` нельзя сочетать с `--force` или `--wait`.

`--skip-deferral` обходит проверку отсрочки из-за активных задач при безопасном перезапуске, поэтому Gateway перезапускается немедленно даже при наличии заявленных блокирующих факторов. Параметр требует `--safe` — используйте его, если отсрочка зависла из-за неконтролируемой задачи.

`--wait <duration>` переопределяет лимит ожидания завершения задач для обычного, небезопасного перезапуска. Принимаются значения в миллисекундах без суффикса или с суффиксами единиц `ms`, `s`, `m`, `h`, `d` (например, `30s`, `5m`, `1h30m`); `--wait 0` означает неограниченное ожидание. Несовместим с `--force` и `--safe`.

`--force` пропускает ожидание завершения активных задач и немедленно выполняет перезапуск. Обычный `restart` без флагов сохраняет существующее поведение перезапуска через диспетчер служб.

<Warning>
Встроенный параметр `--password` может быть виден в локальном списке процессов. Предпочтительно использовать `--password-file`, переменную окружения или `gateway.auth.password` на основе SecretRef.
</Warning>

### Профилирование Gateway

- `OPENCLAW_GATEWAY_STARTUP_TRACE=1` записывает длительность этапов запуска, включая задержку `eventLoopMax` для каждого этапа и время работы с таблицами поиска Plugin (индекс установленных компонентов, реестр манифестов, планирование запуска, обработка карты владельцев).
- `OPENCLAW_GATEWAY_RESTART_TRACE=1` записывает строки `restart trace:`, относящиеся к перезапуску: обработку сигналов, ожидание завершения активных задач, этапы остановки, следующий запуск, время достижения готовности и показатели памяти.
- `OPENCLAW_DIAGNOSTICS=timeline` совместно с `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` записывает, насколько это возможно, временную шкалу диагностики запуска в формате JSONL для внешних средств контроля качества (эквивалентно конфигурации `diagnostics.flags: ["timeline"]`; путь по-прежнему задаётся только через переменную окружения). Добавьте `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1`, чтобы включить выборки цикла событий.
- `pnpm build`, а затем `pnpm test:startup:gateway -- --runs 5 --warmup 1` измеряют производительность запуска Gateway через собранную точку входа CLI: первый вывод процесса, `/healthz`, `/readyz`, длительность этапов трассировки запуска, задержку цикла событий и время работы с таблицами поиска Plugin.
- `pnpm build`, а затем `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` измеряют производительность внутрипроцессного перезапуска в macOS или Linux (Windows не поддерживается; для перезапуска требуется `SIGUSR1`). Используется `SIGUSR1`, в дочернем процессе включаются обе трассировки и записываются следующие результаты `/healthz` и `/readyz`, время простоя, время достижения готовности, загрузка ЦП, RSS и показатели трассировки перезапуска.
- `/healthz` проверяет работоспособность процесса; `/readyz` — готовность к использованию. Рассматривайте строки трассировки и результаты измерений как сведения для определения ответственного компонента, а не как окончательный вывод о производительности на основе одного интервала или замера.

## Запрос к работающему Gateway

Все команды запросов используют RPC через WebSocket.

<Tabs>
  <Tab title="Режимы вывода">
    - По умолчанию: удобочитаемый формат (цветной в TTY).
    - `--json`: машиночитаемый JSON (без оформления и индикатора выполнения).
    - `--no-color` (или `NO_COLOR=1`): отключить ANSI, сохранив удобочитаемую компоновку.

  </Tab>
  <Tab title="Общие параметры">
    - `--url <url>`: URL WebSocket для Gateway.
    - `--token <token>`: токен Gateway.
    - `--password <password>`: пароль Gateway.
    - `--timeout <ms>`: время ожидания или лимит времени (значение по умолчанию зависит от команды; см. описание каждой команды ниже).
    - `--expect-final`: ждать «окончательного» ответа (вызовы агента).

  </Tab>
</Tabs>

<Note>
Если задан `--url`, CLI не использует резервные учётные данные из конфигурации или переменных окружения. Явно передайте `--token` или `--password`. Отсутствие явно заданных учётных данных является ошибкой.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

`/healthz` — это проверка работоспособности: она возвращает результат, как только сервер может отвечать по HTTP. `/readyz` предъявляет более строгие требования и остаётся в состоянии ошибки, пока вспомогательные процессы Plugin, каналы или настроенные обработчики ещё инициализируются. Подробные локальные или аутентифицированные ответы `/readyz` содержат диагностический блок `eventLoop` (задержка, загрузка, отношение к числу ядер ЦП, флаг `degraded`).

<ParamField path="--port <port>" type="number">
  Обращаться к локальному Gateway через local loopback на этом порту. Для этого вызова переопределяет `OPENCLAW_GATEWAY_URL` и `OPENCLAW_GATEWAY_PORT`.
</ParamField>

### `gateway usage-cost`

Получить сводные данные о стоимости использования из журналов сеансов.

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
  Объединить данные всех настроенных агентов. Нельзя сочетать с `--agent`.
</ParamField>

### `gateway stability`

Получить последние данные регистратора диагностической стабильности из работающего Gateway.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  Максимальное количество последних событий (не более `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Фильтровать по типу диагностического события, например `payload.large` или `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Включать только события после указанного номера диагностической последовательности.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Читать сохранённый пакет данных о стабильности вместо обращения к работающему Gateway. `--bundle latest` (или просто `--bundle`) выбирает новейший пакет в каталоге состояния; также можно напрямую передать путь к JSON-файлу пакета.
</ParamField>
<ParamField path="--export" type="boolean">
  Записать ZIP-архив с диагностикой для передачи в службу поддержки вместо вывода подробных сведений о стабильности.
</ParamField>
<ParamField path="--output <path>" type="string">
  Путь вывода для `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Конфиденциальность и поведение пакетов">
    - Записи сохраняют эксплуатационные метаданные: названия событий, счётчики, размеры в байтах, показания памяти, состояние очередей и сеансов, идентификаторы подтверждений, названия каналов и Plugin, а также отредактированные сводки сеансов. Они не содержат текст чатов, тела Webhook, вывод инструментов, необработанные тела запросов и ответов, токены, файлы cookie, секретные значения, имена хостов и необработанные идентификаторы сеансов. Установите `diagnostics.enabled: false`, чтобы полностью отключить регистратор.
    - При фатальном завершении Gateway, превышении времени ожидания остановки или сбое запуска после перезапуска тот же диагностический снимок записывается в `~/.openclaw/logs/stability/openclaw-stability-*.json`, если регистратор содержит события. Просмотрите новейший пакет с помощью `openclaw gateway stability --bundle latest`; параметры `--limit`, `--type` и `--since-seq` также применяются к выводу пакета.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Записать локальный ZIP-архив с диагностикой, предназначенный для отчётов об ошибках. О модели конфиденциальности и содержимом пакета см. в разделе [Экспорт диагностики](/ru/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Путь к выходному ZIP-архиву. По умолчанию экспорт для службы поддержки сохраняется в каталоге состояния.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Максимальное количество строк очищенного журнала для включения.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Максимальное количество байтов журнала для проверки.
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
  Время ожидания снимка статуса и состояния работоспособности.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Пропустить поиск сохранённого пакета стабильности.
</ParamField>
<ParamField path="--json" type="boolean">
  Вывести путь к записанному файлу, его размер и манифест в формате JSON.
</ParamField>

Экспорт включает: `manifest.json` (перечень файлов), `summary.md` (сводка в формате Markdown), `diagnostics.json` (сводка верхнего уровня по конфигурации, журналам, обнаружению, стабильности, статусу и состоянию работоспособности), `config/sanitized.json`, `status/gateway-status.json`, `health/gateway-health.json`, `logs/openclaw-sanitized.jsonl` и `stability/latest.json`, если пакет существует.

Экспорт предназначен для передачи другим лицам. Он сохраняет полезные для отладки эксплуатационные сведения — безопасные поля журналов, названия подсистем, коды состояния, длительности, настроенные режимы, порты, идентификаторы плагинов и провайдеров, несекретные настройки функций и отредактированные эксплуатационные сообщения журналов — и исключает или редактирует текст чатов, тела webhook, результаты инструментов, учётные данные, файлы cookie, идентификаторы учётных записей и сообщений, текст запросов и инструкций, имена хостов и секретные значения. Если сообщение журнала похоже на содержимое данных пользователя, чата или инструмента (например, «пользователь сказал», «текст чата», «результат инструмента», «тело webhook»), экспорт сохраняет только сведения о том, что сообщение было исключено, и количество его байтов.

### `gateway status`

Показывает службу Gateway (launchd/systemd/schtasks) и, при необходимости, результат проверки подключения и аутентификации.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Добавить явно заданную цель проверки. Настроенный удалённый адрес и localhost по-прежнему проверяются.
</ParamField>
<ParamField path="--token <token>" type="string">
  Аутентификация проверки с помощью токена.
</ParamField>
<ParamField path="--password <password>" type="string">
  Аутентификация проверки с помощью пароля.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Время ожидания проверки.
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
  <Accordion title="Семантика статуса">
    - Остаётся доступной для диагностики, даже если локальная конфигурация CLI отсутствует или недействительна.
    - Вывод по умолчанию подтверждает состояние службы, подключение WebSocket и возможность аутентификации, видимую на этапе рукопожатия, но не операции чтения, записи или администрирования.
    - При первой аутентификации устройства проверки не изменяют состояние: они повторно используют существующий кэшированный токен устройства, если он есть, но никогда не создают новую идентичность устройства CLI или запись о сопряжении только для чтения исключительно ради проверки статуса.
    - По возможности разрешает настроенные SecretRef аутентификации для проверки. Если обязательный SecretRef не разрешён, при сбое подключения или аутентификации проверки параметр `--json` сообщает `rpc.authWarning`; явно передайте `--token`/`--password` или исправьте источник секрета. После успешного прохождения проверки предупреждения о неразрешённой аутентификации подавляются.
    - Вывод JSON содержит `gateway.version`, когда работающий Gateway сообщает эту версию; если проверка рукопожатия не может предоставить метаданные версии, `--require-rpc` может использовать данные RPC `status.runtimeVersion`.
    - Используйте `--require-rpc` в сценариях и автоматизации, когда одной прослушивающей службы недостаточно и также требуется работоспособность RPC с областью чтения.
    - `--deep` ищет дополнительные установки launchd/systemd/schtasks; если найдено несколько служб, похожих на Gateway, текстовый вывод содержит рекомендации по очистке (обычно на одном компьютере следует запускать один Gateway) и, когда применимо, сообщает о недавней передаче управления после перезапуска супервизора.
    - `--deep` также выполняет проверку конфигурации с учётом плагинов (`pluginValidation: "full"`) и отображает предупреждения манифеста плагина (например, об отсутствии метаданных конфигурации канала). По умолчанию `gateway status` использует быстрый путь только для чтения, пропускающий проверку плагинов.
    - Текстовый вывод содержит разрешённый путь к файлу журнала, а также пути и сведения о допустимости конфигураций CLI и службы, чтобы упростить диагностику расхождений профиля или каталога состояния.

  </Accordion>
  <Accordion title="Проверки расхождения аутентификации Linux systemd">
    - Проверки расхождения аутентификации службы считывают из юнита как `Environment=`, так и `EnvironmentFile=` (включая `%h`, пути в кавычках, несколько файлов и необязательные файлы с префиксом `-`).
    - Разрешает SecretRef `gateway.auth.token` с использованием объединённого окружения времени выполнения (сначала окружение команды службы, затем резервно окружение процесса).
    - Проверки расхождения токена пропускают разрешение токена конфигурации, когда аутентификация с помощью токена фактически неактивна (`gateway.auth.mode` явно задан как `password`/`none`/`trusted-proxy` либо режим не задан, пароль может иметь приоритет и ни один возможный токен не может получить приоритет).

  </Accordion>
</AccordionGroup>

### `gateway probe`

Команда для «отладки всего». Она всегда проверяет:

- настроенный удалённый Gateway (если он задан) и
- localhost (local loopback), **даже если настроен удалённый адрес**.

Передача `--url` добавляет эту явно заданную цель перед обеими остальными. В текстовом выводе цели обозначаются как `URL (explicit)`, `Remote (configured)` / `Remote (configured, inactive)` и `Local loopback`.

<Note>
Если доступны несколько целей проверки, выводятся все. Туннель SSH, URL TLS/прокси и настроенный удалённый URL могут указывать на один и тот же Gateway даже при разных транспортных портах; `multiple_gateways` используется только для доступных Gateway с различными или неоднозначными идентичностями. Запуск нескольких Gateway поддерживается для изолированных профилей (например, резервного бота), но в большинстве установок работает один Gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  Использовать этот порт для локальной цели проверки local loopback и удалённого порта туннеля SSH. Без `--url` выбирается только локальная цель local loopback вместо URL окружения настроенного Gateway, порта окружения или удалённых целей.
</ParamField>

<AccordionGroup>
  <Accordion title="Интерпретация">
    - `Reachable: yes` означает, что хотя бы одна цель приняла подключение WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` сообщает, какие возможности аутентификации удалось подтвердить проверкой, отдельно от доступности.
    - `Read probe: ok` означает, что подробные вызовы RPC с областью чтения (`health`/`status`/`system-presence`/`config.get`) также выполнены успешно.
    - `Read probe: limited - missing scope: operator.read` означает, что подключение выполнено успешно, но RPC с областью чтения ограничен. Это считается **сниженной** доступностью, а не полным сбоем.
    - `Read probe: failed` после `Connect: ok` означает, что соединение WebSocket установлено, но последующая диагностика чтения завершилась по времени ожидания или с ошибкой — это также **сниженная доступность**, а не недоступность.
    - Как и `gateway status`, проверка повторно использует существующую кэшированную аутентификацию устройства, но не создаёт идентичность устройства или состояние сопряжения при первом использовании.
    - Код завершения ненулевой, только если ни одна проверенная цель не доступна.

  </Accordion>
  <Accordion title="Вывод JSON">
    Верхний уровень:

    - `ok`: хотя бы одна цель доступна.
    - `degraded`: хотя бы одна цель приняла подключение, но не завершила полную подробную диагностику RPC.
    - `capability`: лучшая возможность среди доступных целей (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` или `unknown`).
    - `primaryTargetId`: наиболее подходящая цель, которую следует считать активной; порядок приоритета: явно заданный URL, туннель SSH, настроенный удалённый адрес, local loopback.
    - `warnings[]`: записи предупреждений, формируемые по возможности, с полями `code`, `message` и необязательным `targetIds`.
    - `network`: подсказки по URL local loopback/tailnet, полученные из текущей конфигурации и сетевых параметров хоста.
    - `discovery.timeoutMs` / `discovery.count`: фактически использованные для этого прохода проверки лимит времени и количество результатов обнаружения.

    Для каждой цели (`targets[].connect`): `ok` (доступность и классификация сниженного состояния), `rpcOk` (успешность полной подробной диагностики RPC), `scopeLimited` (сбой подробного RPC из-за отсутствия области оператора).

    Для каждой цели (`targets[].auth`): `role` и `scopes`, сообщённые в `hello-ok`, если они доступны, а также полученная классификация `capability`.

  </Accordion>
  <Accordion title="Распространённые коды предупреждений">
    - `ssh_tunnel_failed`: не удалось настроить туннель SSH; команда перешла к прямым проверкам.
    - `multiple_gateways`: были доступны Gateway с различными идентичностями либо OpenClaw не удалось подтвердить, что доступные цели являются одним и тем же Gateway. Туннель SSH, URL прокси или настроенный удалённый URL к одному и тому же Gateway не вызывают это предупреждение.
    - `auth_secretref_unresolved`: настроенный SecretRef аутентификации не удалось разрешить для цели, проверка которой завершилась с ошибкой.
    - `probe_scope_limited`: подключение WebSocket выполнено успешно, но проверка чтения была ограничена из-за отсутствия `operator.read`.
    - `local_tls_runtime_unavailable`: локальный TLS Gateway включён, но OpenClaw не удалось загрузить отпечаток локального сертификата.

  </Accordion>
</AccordionGroup>

#### Удалённое подключение через SSH (соответствие приложению для Mac)

Режим приложения macOS `Remote over SSH` использует локальную переадресацию порта, чтобы удалённый Gateway, доступный только через loopback, стал доступен по адресу `ws://127.0.0.1:<port>`.

Эквивалент в CLI:

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
  Выбрать первый обнаруженный хост Gateway в качестве цели SSH из разрешённой конечной точки обнаружения (`local.` и настроенного глобального домена, если он задан). Подсказки только из TXT игнорируются.
</ParamField>

Настройки конфигурации по умолчанию (необязательно): `gateway.remote.sshTarget`, `gateway.remote.sshIdentity`.

### `gateway call <method>`

Низкоуровневый вспомогательный инструмент RPC.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"limit": 200}'
```

<ParamField path="--params <json>" type="string" default="{}">
  Строка объекта JSON с параметрами.
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
<ParamField path="--timeout <ms>" type="number" default="10000">
  Лимит времени ожидания.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  В основном используется для RPC в стиле агента, которые передают промежуточные события перед итоговыми данными.
</ParamField>
<ParamField path="--json" type="boolean">
  Машиночитаемый вывод JSON.
</ParamField>

<Note>
`--params` должен содержать допустимый JSON, а каждый метод проверяет собственную структуру параметров (лишние поля и поля с неверными именами отклоняются).
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

Используйте `--wrapper`, если управляемая служба должна запускаться через другой исполняемый файл, например через адаптер диспетчера секретов или вспомогательную программу запуска от имени другого пользователя. Обёртка получает обычные аргументы Gateway и отвечает за последующий запуск через `exec` команды `openclaw` или Node с этими аргументами.

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

Обёртку также можно задать через окружение. `gateway install` проверяет, что путь указывает на исполняемый файл, добавляет обёртку в `ProgramArguments` службы и сохраняет `OPENCLAW_WRAPPER` в окружении службы для последующих принудительных переустановок, обновлений и исправлений с помощью doctor.

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
    - `gateway install`: `--port`, `--runtime <node|bun>` (по умолчанию: `node`), `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="Поведение жизненного цикла">
    - Для перезапуска управляемой службы используйте `gateway restart`. Не выполняйте последовательно `gateway stop` и `gateway start` вместо перезапуска.
    - В macOS команда `gateway stop` по умолчанию использует `launchctl bootout`, который удаляет LaunchAgent из текущего сеанса загрузки, не сохраняя состояние отключения: автоматическое восстановление KeepAlive остаётся активным при будущих сбоях, а `gateway start` корректно включает службу снова без ручного выполнения `launchctl enable`. Передайте `--disable`, чтобы надолго отключить KeepAlive и RunAtLoad и предотвратить повторный запуск Gateway до следующего явного вызова `gateway start`; используйте этот параметр, если остановка вручную должна сохраняться после перезагрузки.
    - Команды жизненного цикла поддерживают `--json` для использования в скриптах.

  </Accordion>
  <Accordion title="Аутентификация и SecretRef во время установки">
    - Когда для аутентификации по токену требуется токен, а `gateway.auth.token` управляется через SecretRef, команда `gateway install` проверяет возможность разрешения SecretRef, но не сохраняет разрешённый токен в метаданных окружения службы.
    - Если для аутентификации по токену требуется токен, но настроенный SecretRef токена не разрешается, установка завершается с ошибкой вместо сохранения резервного значения в виде открытого текста.
    - Для аутентификации по паролю при использовании `gateway run` предпочитайте `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` или параметр `gateway.auth.password` на основе SecretRef вместо встроенного `--password`.
    - В режиме автоматического определения аутентификации переменная `OPENCLAW_GATEWAY_PASSWORD`, заданная только в оболочке, не отменяет требования к токену при установке; при установке управляемой службы используйте постоянную конфигурацию (`gateway.auth.password` или `env` в конфигурации).
    - Если настроены и `gateway.auth.token`, и `gateway.auth.password`, а `gateway.auth.mode` не задан, установка блокируется до явного задания режима.

  </Accordion>
</AccordionGroup>

## Обнаружение Gateway (Bonjour)

`gateway discover` ищет маяки Gateway (`_openclaw-gw._tcp`).

- Многоадресный DNS-SD: `local.`
- Одноадресный DNS-SD (глобальный Bonjour): выберите домен (например, `openclaw.internal.`) и настройте раздельный DNS и DNS-сервер; см. [Bonjour](/ru/gateway/bonjour).

Маяк публикуют только те Gateway, для которых включено обнаружение Bonjour (по умолчанию).

TXT-подсказки в каждом маяке: `role` (подсказка о роли Gateway), `transport` (подсказка о транспорте, например `gateway`), `gatewayPort` (порт WebSocket, обычно `18789`), `tailnetDns` (имя хоста MagicDNS, если доступно), `gatewayTls` / `gatewayTlsSha256` (включение TLS и отпечаток сертификата). `sshPort` и `cliPath` публикуются только в полном режиме обнаружения (`discovery.mdns.mode: "full"`; по умолчанию используется `"minimal"`, где они отсутствуют, поэтому клиенты по умолчанию используют для SSH порт `22`).

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Тайм-аут отдельной команды (поиск/разрешение).
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
- Выполняет поиск в `local.`, а также в настроенном глобальном домене, если он включён.
- Значение `wsUrl` в выводе JSON формируется из разрешённой конечной точки службы, а не только из TXT-подсказок, таких как `lanHost` или `tailnetDns`.
- Параметр `discovery.mdns.mode` управляет публикацией `sshPort`/`cliPath` как в mDNS `local.`, так и в глобальном DNS-SD (см. выше).

</Note>

## Связанные материалы

- [Справочник CLI](/ru/cli)
- [Руководство по эксплуатации Gateway](/ru/gateway)
