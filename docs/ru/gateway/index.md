---
read_when:
    - Запуск или отладка процесса Gateway
summary: Руководство по эксплуатации сервиса Gateway, его жизненному циклу и операциям
title: Руководство по эксплуатации Gateway
x-i18n:
    generated_at: "2026-06-28T22:57:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b0bbbcad26df135e1475cbeb14f1299b48bae62be759b2e6c6f82164d175601b
    source_path: gateway/index.md
    workflow: 16
---

Используйте эту страницу для запуска сервиса Gateway в первый день и эксплуатации во второй день.

<CardGroup cols={2}>
  <Card title="Deep troubleshooting" icon="siren" href="/ru/gateway/troubleshooting">
    Диагностика от симптомов с точными цепочками команд и сигнатурами логов.
  </Card>
  <Card title="Configuration" icon="sliders" href="/ru/gateway/configuration">
    Руководство по настройке, ориентированное на задачи, и полный справочник конфигурации.
  </Card>
  <Card title="Secrets management" icon="key-round" href="/ru/gateway/secrets">
    Контракт SecretRef, поведение снимка во время выполнения и операции миграции/перезагрузки.
  </Card>
  <Card title="Secrets plan contract" icon="shield-check" href="/ru/gateway/secrets-plan-contract">
    Точные правила цели/пути `secrets apply` и поведение профиля аутентификации только по ссылкам.
  </Card>
</CardGroup>

## Локальный запуск за 5 минут

<Steps>
  <Step title="Start the Gateway">

```bash
openclaw gateway --port 18789
# debug/trace mirrored to stdio
openclaw gateway --port 18789 --verbose
# force-kill listener on selected port, then start
openclaw gateway --force
```

  </Step>

  <Step title="Verify service health">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Базовое исправное состояние: `Runtime: running`, `Connectivity probe: ok` и `Capability: ...`, соответствующий ожидаемому. Используйте `openclaw gateway status --require-rpc`, когда нужно подтверждение RPC с областью чтения, а не только доступность.

  </Step>

  <Step title="Validate channel readiness">

```bash
openclaw channels status --probe
```

При доступном gateway это запускает живые проверки каналов для каждой учетной записи и дополнительные аудиты.
Если gateway недоступен, CLI вместо вывода живой проверки возвращается к сводкам каналов только из конфигурации.

  </Step>
</Steps>

<Note>
Перезагрузка конфигурации Gateway отслеживает путь активного файла конфигурации (полученный из профиля/состояния по умолчанию или из `OPENCLAW_CONFIG_PATH`, если он задан).
Режим по умолчанию: `gateway.reload.mode="hybrid"`.
После первой успешной загрузки работающий процесс обслуживает активный снимок конфигурации в памяти; успешная перезагрузка атомарно заменяет этот снимок.
</Note>

## Модель времени выполнения

- Один постоянно работающий процесс для маршрутизации, плоскости управления и подключений каналов.
- Один мультиплексированный порт для:
  - Управления/RPC по WebSocket
  - HTTP API (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - HTTP-маршрутов Plugin, например необязательного `/api/v1/admin/rpc`
  - Control UI и хуков
- Режим привязки по умолчанию: `loopback`.
- По умолчанию требуется аутентификация. Настройки с общим секретом используют
  `gateway.auth.token` / `gateway.auth.password` (или
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), а настройки reverse proxy
  не для loopback могут использовать `gateway.auth.mode: "trusted-proxy"`.

## OpenAI-совместимые конечные точки

Самая важная поверхность совместимости OpenClaw теперь:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Почему этот набор важен:

- Большинство интеграций Open WebUI, LobeChat и LibreChat сначала проверяют `/v1/models`.
- Многие конвейеры RAG и памяти ожидают `/v1/embeddings`.
- Клиенты, ориентированные на агентов, все чаще предпочитают `/v1/responses`.

Примечание по планированию:

- `/v1/models` ориентирован на агентов: он возвращает `openclaw`, `openclaw/default` и `openclaw/<agentId>`.
- `openclaw/default` — стабильный псевдоним, который всегда сопоставляется с настроенным агентом по умолчанию.
- Используйте `x-openclaw-model`, когда нужно переопределить backend-провайдера/модель; иначе обычная модель и настройка embeddings выбранного агента остаются управляющими.

Все эти конечные точки работают на основном порту Gateway и используют ту же доверенную границу аутентификации оператора, что и остальная HTTP API Gateway.

Административный HTTP RPC (`POST /api/v1/admin/rpc`) — это отдельный, по умолчанию отключенный маршрут Plugin для инструментов хоста, которые не могут использовать WebSocket RPC. См. [Административный HTTP RPC](/ru/plugins/admin-http-rpc).

### Приоритет порта и привязки

| Параметр     | Порядок разрешения                                           |
| ------------ | ------------------------------------------------------------ |
| Порт Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Режим привязки | CLI/переопределение → `gateway.bind` → `loopback`          |

Установленные сервисы gateway записывают разрешенный `--port` в метаданные supervisor. После изменения `gateway.port` запустите `openclaw doctor --fix` или `openclaw gateway install --force`, чтобы launchd/systemd/schtasks запускали процесс на новом порту.

Запуск Gateway использует тот же эффективный порт и привязку, когда подготавливает локальные
источники Control UI для привязок не к loopback. Например, `--bind lan --port 3000`
подготавливает `http://localhost:3000` и `http://127.0.0.1:3000` перед выполнением
runtime-проверки. Явно добавьте любые удаленные источники браузера, например HTTPS proxy URL, в
`gateway.controlUi.allowedOrigins`.

### Режимы горячей перезагрузки

| `gateway.reload.mode` | Поведение                                  |
| --------------------- | ------------------------------------------ |
| `off`                 | Без перезагрузки конфигурации              |
| `hot`                 | Применять только изменения, безопасные для hot-режима |
| `restart`             | Перезапускать при изменениях, требующих перезапуска |
| `hybrid` (по умолчанию) | Применять hot-режим, когда безопасно, перезапускать, когда требуется |

## Набор команд оператора

```bash
openclaw gateway status
openclaw gateway status --deep   # adds a system-level service scan
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` предназначен для дополнительного обнаружения сервисов (LaunchDaemons/systemd system
units/schtasks), а не для более глубокой проверки здоровья RPC.

## Несколько gateway на одном хосте

В большинстве установок следует запускать один gateway на машину. Один gateway может размещать несколько
агентов и каналов.

Несколько gateway нужны только тогда, когда вы намеренно хотите изоляцию или rescue bot.

Полезные проверки:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Чего ожидать:

- `gateway status --deep` может сообщить `Other gateway-like services detected (best effort)`
  и вывести подсказки по очистке, когда устаревшие установки launchd/systemd/schtasks все еще присутствуют.
- `gateway probe` может предупредить о `multiple reachable gateway identities`, когда отвечают разные
  gateway или когда OpenClaw не может доказать, что достижимые цели являются одним и тем же gateway.
  SSH-туннель, proxy URL или настроенный удаленный URL к тому же gateway — это один
  gateway с несколькими транспортами, даже если порты транспортов различаются.
- Если это намеренно, изолируйте порты, конфигурацию/состояние и корни рабочих областей для каждого gateway.

Чеклист для каждого экземпляра:

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

## Удаленный доступ

Предпочтительно: Tailscale/VPN.
Резервный вариант: SSH-туннель.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Затем подключайте клиентов локально к `ws://127.0.0.1:18789`.

<Warning>
SSH-туннели не обходят аутентификацию gateway. Для аутентификации с общим секретом клиенты все равно
должны отправлять `token`/`password` даже через туннель. Для режимов с идентичностью
запрос все равно должен удовлетворять этому пути аутентификации.
</Warning>

См.: [Удаленный Gateway](/ru/gateway/remote), [Аутентификация](/ru/gateway/authentication), [Tailscale](/ru/gateway/tailscale).

## Надзор и жизненный цикл сервиса

Используйте запуск под надзором для надежности, похожей на production.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Используйте `openclaw gateway restart` для перезапусков. Не объединяйте `openclaw gateway stop` и `openclaw gateway start` как замену перезапуску.

В macOS `gateway stop` по умолчанию использует `launchctl bootout` — это удаляет LaunchAgent из текущей загрузочной сессии без постоянного отключения, поэтому автоматическое восстановление KeepAlive все еще работает после неожиданных сбоев, а `gateway start` повторно включает его чисто. Чтобы постоянно подавить автоматический повторный запуск между перезагрузками, передайте `--disable`: `openclaw gateway stop --disable`.

Метки LaunchAgent: `ai.openclaw.gateway` (по умолчанию) или `ai.openclaw.<profile>` (именованный профиль). `openclaw doctor` проверяет и исправляет дрейф конфигурации сервиса.

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Для сохранения работы после выхода из системы включите lingering:

```bash
sudo loginctl enable-linger <user>
```

Пример пользовательского unit вручную, когда нужен пользовательский путь установки:

```ini
[Unit]
Description=OpenClaw Gateway
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

  </Tab>

  <Tab title="Windows (native)">

```powershell
openclaw gateway install
openclaw gateway status --json
openclaw gateway restart
openclaw gateway stop
```

Управляемый нативный запуск Windows использует Scheduled Task с именем `OpenClaw Gateway`
(или `OpenClaw Gateway (<profile>)` для именованных профилей). Если создание Scheduled Task
запрещено, OpenClaw возвращается к launcher в папке автозагрузки текущего пользователя,
который указывает на `gateway.cmd` внутри каталога состояния.

  </Tab>

  <Tab title="Linux (system service)">

Используйте системный unit для много пользовательских/постоянно включенных хостов.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Используйте то же тело сервиса, что и для пользовательского unit, но установите его в
`/etc/systemd/system/openclaw-gateway[-<profile>].service` и настройте
`ExecStart=`, если ваш бинарный файл `openclaw` находится в другом месте.

Не позволяйте также `openclaw doctor --fix` устанавливать gateway-сервис уровня пользователя для того же профиля/порта. Doctor отказывается от такой автоматической установки, когда находит системный сервис OpenClaw gateway; используйте `OPENCLAW_SERVICE_REPAIR_POLICY=external`, когда системный unit владеет жизненным циклом.

  </Tab>
</Tabs>

## Быстрый путь dev-профиля

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Значения по умолчанию включают изолированные состояние/конфигурацию и базовый порт gateway `19001`.

## Краткий справочник протокола (вид оператора)

- Первый кадр клиента должен быть `connect`.
- Gateway возвращает снимок `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, limits/policy).
- `hello-ok.features.methods` / `events` — это консервативный список обнаружения, а не
  сгенерированный дамп каждого вызываемого вспомогательного маршрута.
- Запросы: `req(method, params)` → `res(ok/payload|error)`.
- Частые события включают `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.operation`, `session.tool`, `sessions.changed`,
  `presence`, `tick`, `health`, `heartbeat`, события жизненного цикла сопряжения/одобрения
  и `shutdown`.

Запуски агента двухэтапные:

1. Немедленное подтверждение принятия (`status:"accepted"`)
2. Итоговый ответ завершения (`status:"ok"|"error"`) с потоковыми событиями `agent` между ними.

См. полную документацию протокола: [Протокол Gateway](/ru/gateway/protocol).

## Операционные проверки

### Работоспособность

- Откройте WS и отправьте `connect`.
- Ожидайте ответ `hello-ok` со снимком.

### Готовность

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Восстановление после пропусков

События не воспроизводятся повторно. При пропусках последовательности обновите состояние (`health`, `system-presence`) перед продолжением.

## Частые сигнатуры отказов

| Сигнатура                                                      | Вероятная проблема                                                                    |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | Привязка не к интерфейсу обратной петли без действительного пути аутентификации Gateway                             |
| `another gateway instance is already listening` / `EADDRINUSE` | Конфликт порта                                                                   |
| `Gateway start blocked: set gateway.mode=local`                | В конфигурации задан удаленный режим, или в поврежденной конфигурации отсутствует метка локального режима |
| `unauthorized` during connect                                  | Несоответствие аутентификации между клиентом и Gateway                                        |

Для полных цепочек диагностики используйте [Устранение неполадок Gateway](/ru/gateway/troubleshooting).

## Гарантии безопасности

- Клиенты протокола Gateway быстро завершаются с ошибкой, когда Gateway недоступен (без неявного отката к прямому каналу).
- Недопустимые или не являющиеся подключением первые кадры отклоняются и закрываются.
- Корректное завершение работы отправляет событие `shutdown` перед закрытием сокета.

---

Связанные разделы:

- [Устранение неполадок](/ru/gateway/troubleshooting)
- [Фоновый процесс](/ru/gateway/background-process)
- [Конфигурация](/ru/gateway/configuration)
- [Состояние](/ru/gateway/health)
- [Doctor](/ru/gateway/doctor)
- [Аутентификация](/ru/gateway/authentication)

## Связанные разделы

- [Конфигурация](/ru/gateway/configuration)
- [Устранение неполадок Gateway](/ru/gateway/troubleshooting)
- [Удаленный доступ](/ru/gateway/remote)
- [Управление секретами](/ru/gateway/secrets)
