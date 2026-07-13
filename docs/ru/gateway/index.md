---
read_when:
    - Запуск или отладка процесса Gateway
summary: Инструкция по эксплуатации службы Gateway, её жизненному циклу и операциям
title: Руководство по эксплуатации Gateway
x-i18n:
    generated_at: "2026-07-13T18:11:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: d8b50b6041905c321887ea0f579f8d4c3b74552b2b72c37ec655e43a53dfc130
    source_path: gateway/index.md
    workflow: 16
---

Используйте эту страницу для первоначального запуска и последующей эксплуатации службы Gateway.

<CardGroup cols={2}>
  <Card title="Углублённое устранение неполадок" icon="siren" href="/ru/gateway/troubleshooting">
    Диагностика по симптомам с точными последовательностями команд и сигнатурами журналов.
  </Card>
  <Card title="Конфигурация" icon="sliders" href="/ru/gateway/configuration">
    Руководство по настройке на основе задач и полный справочник по конфигурации.
  </Card>
  <Card title="Управление секретами" icon="key-round" href="/ru/gateway/secrets">
    Контракт SecretRef, поведение снимка среды выполнения и операции миграции и перезагрузки.
  </Card>
  <Card title="Контракт плана секретов" icon="shield-check" href="/ru/gateway/secrets-plan-contract">
    Точные правила цели/пути `secrets apply` и поведение профиля аутентификации, использующего только ссылки.
  </Card>
</CardGroup>

## Локальный запуск за 5 минут

<Steps>
  <Step title="Запустите Gateway">

```bash
openclaw gateway --port 18789
# отладочные данные и трассировка дублируются в стандартный ввод-вывод
openclaw gateway --port 18789 --verbose
# принудительно завершить процесс, прослушивающий выбранный порт, затем запустить
openclaw gateway --force
```

  </Step>

  <Step title="Проверьте работоспособность службы">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Базовые признаки нормальной работы: `Runtime: running`, `Connectivity probe: ok` и строка `Capability`, соответствующая ожидаемому значению. Используйте `openclaw gateway status --require-rpc` для проверки RPC с областью чтения, а не только доступности.

  </Step>

  <Step title="Проверьте готовность каналов">

```bash
openclaw channels status --probe
```

Если Gateway доступен, команда выполняет оперативные проверки каналов для каждой учётной записи и необязательные аудиты. Если Gateway недоступен, CLI возвращается к сводкам каналов только на основе конфигурации.

  </Step>
</Steps>

<Note>
Перезагрузка конфигурации Gateway отслеживает путь к активному файлу конфигурации (определяемый из профиля и стандартных параметров состояния либо из `OPENCLAW_CONFIG_PATH`, если он задан). Режим по умолчанию — `gateway.reload.mode="hybrid"`. После первой успешной загрузки запущенный процесс обслуживает активный снимок конфигурации в памяти; успешная перезагрузка атомарно заменяет этот снимок.
</Note>

## Модель среды выполнения

- Один постоянно работающий процесс для маршрутизации, плоскости управления и подключений каналов.
- Один мультиплексированный порт для:
  - управления и RPC через WebSocket
  - HTTP API (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - HTTP-маршрутов плагинов, например необязательного `/api/v1/admin/rpc`
  - интерфейса управления и хуков
- Режим привязки по умолчанию: `loopback`. В обнаруженной контейнерной среде фактическое значение по умолчанию — `auto` (разрешается в `0.0.0.0` для перенаправления портов), если не активен режим serve/funnel Tailscale, который всегда принудительно использует `loopback`.
- По умолчанию требуется аутентификация. Конфигурации с общим секретом используют `gateway.auth.token` / `gateway.auth.password` (или `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), а конфигурации обратного прокси не через loopback могут использовать `gateway.auth.mode: "trusted-proxy"`.

## Эндпоинты, совместимые с OpenAI

Наиболее значимая поверхность совместимости OpenClaw:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Почему этот набор важен:

- Большинство интеграций Open WebUI, LobeChat и LibreChat сначала проверяют `/v1/models`.
- Многие конвейеры RAG и памяти ожидают `/v1/embeddings`.
- Клиенты, ориентированные на агентов, всё чаще предпочитают `/v1/responses`.

`/v1/models` в первую очередь ориентирован на агентов: он возвращает `openclaw`, `openclaw/default` и `openclaw/<agentId>` для каждого настроенного агента. `openclaw/default` — стабильный псевдоним, всегда сопоставляемый с настроенным агентом по умолчанию. Отправляйте `x-openclaw-model`, когда требуется переопределить серверного поставщика или модель; в противном случае управление сохраняют обычные настройки модели и эмбеддингов выбранного агента.

Все эти эндпоинты работают на основном порту Gateway и используют ту же доверенную границу аутентификации оператора, что и остальная часть HTTP API Gateway.

Административный HTTP RPC (`POST /api/v1/admin/rpc`) — это отдельный, по умолчанию отключённый маршрут плагина для инструментов хоста, которые не могут использовать RPC через WebSocket. См. [Административный HTTP RPC](/ru/plugins/admin-http-rpc).

### Приоритет порта и привязки

| Параметр      | Порядок разрешения                                                     |
| ------------ | -------------------------------------------------------------------- |
| Порт Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789`        |
| Режим привязки    | CLI/переопределение → `gateway.bind` → `loopback` (или `auto` в контейнерах) |

Установленные службы Gateway записывают разрешённое значение `--port` в метаданные супервизора. После изменения `gateway.port` выполните `openclaw doctor --fix` или `openclaw gateway install --force`, чтобы launchd/systemd/schtasks запускал процесс на новом порту.

При запуске Gateway использует тот же фактический порт и режим привязки для формирования локальных источников интерфейса управления при привязках не к loopback. Например, `--bind lan --port 3000` добавляет `http://localhost:3000` и `http://127.0.0.1:3000` до выполнения проверки среды выполнения. Явно добавьте все источники удалённых браузеров, например HTTPS-адреса прокси, в `gateway.controlUi.allowedOrigins`.

### Режимы горячей перезагрузки

| `gateway.reload.mode` | Поведение                                   |
| --------------------- | ------------------------------------------ |
| `off`                 | Без перезагрузки конфигурации                           |
| `hot`                 | Применять только изменения, безопасные для горячей перезагрузки                |
| `restart`             | Перезапускать при изменениях, требующих перезагрузки         |
| `hybrid` (по умолчанию)    | Применять без перезапуска, когда это безопасно, и перезапускать при необходимости |

## Набор команд оператора

```bash
openclaw gateway status
openclaw gateway status --deep   # добавляет проверку служб на уровне системы
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` предназначен для дополнительного обнаружения служб (LaunchDaemons/системных модулей systemd/schtasks), а не для более глубокой проверки работоспособности RPC.

## Несколько экземпляров Gateway на одном хосте

В большинстве установок следует запускать один Gateway на машину. Один Gateway может обслуживать несколько агентов и каналов. Несколько экземпляров Gateway нужны только тогда, когда вы намеренно хотите обеспечить изоляцию или использовать резервного бота.

Полезные проверки:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Ожидаемое поведение:

- `gateway status --deep` может сообщать `Other gateway-like services detected (best effort)` и выводить рекомендации по очистке, если сохраняются устаревшие установки launchd/systemd/schtasks.
- `gateway probe` может предупреждать о `multiple reachable gateway identities`, когда отвечают разные экземпляры Gateway или когда OpenClaw не может доказать, что доступные цели являются одним и тем же Gateway. SSH-туннель, URL-адрес прокси или настроенный удалённый URL-адрес к одному Gateway представляют собой один Gateway с несколькими транспортами, даже если транспортные порты различаются.
- Если это сделано намеренно, изолируйте порты, конфигурацию и состояние, а также корневые каталоги рабочих пространств для каждого Gateway.

Контрольный список для каждого экземпляра:

- Уникальный `gateway.port`
- Уникальный `OPENCLAW_CONFIG_PATH`
- Уникальный `OPENCLAW_STATE_DIR`
- Уникальный `agents.defaults.workspace`

Пример:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

Подробная настройка: [/gateway/multiple-gateways](/ru/gateway/multiple-gateways).

## Удалённый доступ

Предпочтительно: Tailscale/VPN.
Резервный вариант: SSH-туннель.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

Затем подключайте клиенты локально к `ws://127.0.0.1:18789`.

<Warning>
SSH-туннели не позволяют обойти аутентификацию Gateway. При аутентификации с общим секретом клиенты даже через туннель
должны отправлять `token`/`password`. В режимах с передачей удостоверения
запрос всё равно должен удовлетворять требованиям соответствующего пути аутентификации.
</Warning>

См.: [Удалённый Gateway](/ru/gateway/remote), [Аутентификация](/ru/gateway/authentication), [Tailscale](/ru/gateway/tailscale).

## Надзор и жизненный цикл службы

Для надёжности на уровне производственной среды используйте запуск под управлением супервизора.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Используйте `openclaw gateway restart` для перезапуска. Не используйте последовательный вызов `openclaw gateway stop` и `openclaw gateway start` вместо перезапуска.

В macOS `gateway stop` по умолчанию использует `launchctl bootout`. Это удаляет LaunchAgent из текущего сеанса загрузки без постоянного отключения, поэтому автоматическое восстановление KeepAlive продолжает работать после непредвиденных сбоев, а `gateway start` корректно включает службу повторно. Чтобы постоянно запрещать автоматический повторный запуск после перезагрузок, передайте `--disable`: `openclaw gateway stop --disable`.

Метки LaunchAgent: `ai.openclaw.gateway` (по умолчанию) или `ai.openclaw.<profile>` (именованный профиль). `openclaw doctor` проверяет и исправляет расхождения конфигурации службы.

  </Tab>

  <Tab title="Linux (пользовательская служба systemd)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Чтобы служба продолжала работать после выхода из системы, включите lingering:

```bash
sudo loginctl enable-linger $(whoami)
```

На сервере без графической среды также убедитесь, что задан `XDG_RUNTIME_DIR` (`export XDG_RUNTIME_DIR=/run/user/$(id -u)`), прежде чем повторять команды `systemctl --user`.

Пример пользовательского модуля для случая, когда требуется нестандартный путь установки:

```ini
[Unit]
Description=Gateway OpenClaw
After=network-online.target
Wants=network-online.target
StartLimitBurst=5
StartLimitIntervalSec=60

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
RestartPreventExitStatus=78
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

  </Tab>

  <Tab title="Windows (нативный режим)">

```powershell
openclaw gateway install
openclaw gateway status --json
openclaw gateway restart
openclaw gateway stop
```

Управляемый запуск в Windows использует запланированную задачу с именем `OpenClaw Gateway`
(или `OpenClaw Gateway (<profile>)` для именованных профилей). Если в создании запланированной задачи
отказано, OpenClaw использует средство запуска из пользовательской папки автозагрузки,
которое указывает на `gateway.cmd` в каталоге состояния.

  </Tab>

  <Tab title="Linux (системная служба)">

Используйте системный модуль для многопользовательских и постоянно работающих хостов.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Используйте то же содержимое службы, что и для пользовательского модуля, но установите его в
`/etc/systemd/system/openclaw-gateway[-<profile>].service` и скорректируйте
`ExecStart=`, если исполняемый файл `openclaw` находится в другом месте.

Не разрешайте `openclaw doctor --fix` также устанавливать пользовательскую службу Gateway для того же профиля и порта. Doctor отказывается от такой автоматической установки, если обнаруживает системную службу Gateway OpenClaw; используйте `OPENCLAW_SERVICE_REPAIR_POLICY=external`, когда жизненным циклом управляет системный модуль.

  </Tab>
</Tabs>

При ошибках недопустимой конфигурации процесс завершается с кодом `78`. Системные модули systemd в Linux используют `RestartPreventExitStatus=78`, чтобы прекратить повторные запуски до исправления конфигурации. В launchd и планировщике заданий Windows нет эквивалентного правила остановки по коду завершения, поэтому Gateway также сохраняет историю быстрых некорректных запусков и после повторяющихся сбоев запуска подавляет автоматический запуск учётных записей каналов и поставщиков. В этом безопасном режиме плоскость управления всё равно запускается для проверки и исправления, горячая перезагрузка конфигурации и `secrets.reload` не выполняют автоматический перезапуск каналов, а явный запрос оператора `channels.start` может отменить это ограничение.

## Быстрый запуск профиля разработки

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

По умолчанию используются изолированные состояние и конфигурация, а также базовый порт Gateway `19001`.

## Краткий справочник по протоколу для оператора

- Первым кадром клиента должен быть `connect`.
- Gateway возвращает кадр `hello-ok` с `snapshot` (`presence`, `health`, `stateVersion`, `uptimeMs`), а также ограничениями `policy` (`maxPayload`, `maxBufferedBytes`, `tickIntervalMs`).
- `hello-ok.features.methods` / `events` — это консервативный список для обнаружения, а не
  автоматически созданный перечень всех доступных для вызова вспомогательных маршрутов.
- Запросы: `req(method, params)` → `res(ok/payload|error)`.
- К распространённым событиям относятся `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.operation`, `session.tool`, включаемые по желанию
  `session.approval`, `sessions.changed`, `presence`, `tick`, `health`,
  `heartbeat`, события жизненного цикла сопряжения и подтверждения, а также `shutdown`.

Запуски агента выполняются в два этапа:

1. Немедленное подтверждение принятия (`status:"accepted"`)
2. Итоговый ответ о завершении (`status:"ok"|"error"`), между ними передаются потоковые события `agent`.

Полную документацию протокола см. в разделе [Протокол Gateway](/ru/gateway/protocol).

## Операционные проверки

### Доступность

- Откройте WS-соединение и отправьте `connect`.
- Ожидайте ответ `hello-ok` со снимком состояния.

### Готовность

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Восстановление после пропусков

События не воспроизводятся повторно. При пропусках в последовательности обновите состояние (`health`, `system-presence`), прежде чем продолжить.

## Типичные признаки сбоев

| Признак                                                        | Вероятная проблема                                                              |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | Привязка не к loopback-интерфейсу без допустимого способа аутентификации Gateway |
| `another gateway instance is already listening` / `EADDRINUSE` | Конфликт портов                                                                 |
| `Gateway start blocked: set gateway.mode=local`                | В конфигурации задан удалённый режим либо в повреждённой конфигурации отсутствует `gateway.mode` |
| `unauthorized` при подключении                                 | Несоответствие параметров аутентификации клиента и Gateway                      |

Полные последовательности диагностики см. в разделе [Устранение неполадок Gateway](/ru/gateway/troubleshooting).

## Гарантии безопасности

- Клиенты протокола Gateway немедленно завершают работу с ошибкой, если Gateway недоступен (без неявного перехода к прямому каналу).
- Недопустимые первые кадры и первые кадры, не предназначенные для подключения, отклоняются, после чего соединение закрывается.
- При корректном завершении работы перед закрытием сокета отправляется событие `shutdown`.

## Связанные разделы

- [Конфигурация](/ru/gateway/configuration)
- [Устранение неполадок Gateway](/ru/gateway/troubleshooting)
- [Фоновый процесс](/ru/gateway/background-process)
- [Состояние системы](/ru/gateway/health)
- [Doctor](/ru/gateway/doctor)
- [Аутентификация](/ru/gateway/authentication)
- [Удалённый доступ](/ru/gateway/remote)
- [Управление секретами](/ru/gateway/secrets)
