---
read_when:
    - Запуск або налагодження процесу Gateway
summary: Інструкція з експлуатації служби Gateway, її життєвого циклу та операцій
title: Посібник з експлуатації Gateway
x-i18n:
    generated_at: "2026-07-16T18:03:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d8b50b6041905c321887ea0f579f8d4c3b74552b2b72c37ec655e43a53dfc130
    source_path: gateway/index.md
    workflow: 16
---

Використовуйте цю сторінку для початкового запуску та подальшої експлуатації служби Gateway.

<CardGroup cols={2}>
  <Card title="Поглиблене усунення несправностей" icon="siren" href="/uk/gateway/troubleshooting">
    Діагностика за симптомами з точними послідовностями команд і сигнатурами журналів.
  </Card>
  <Card title="Конфігурація" icon="sliders" href="/uk/gateway/configuration">
    Орієнтований на завдання посібник із налаштування та повний довідник конфігурації.
  </Card>
  <Card title="Керування секретами" icon="key-round" href="/uk/gateway/secrets">
    Контракт SecretRef, поведінка знімка під час виконання та операції міграції й перезавантаження.
  </Card>
  <Card title="Контракт плану секретів" icon="shield-check" href="/uk/gateway/secrets-plan-contract">
    Точні правила цілі/шляху `secrets apply` і поведінка профілю автентифікації лише з посиланнями.
  </Card>
</CardGroup>

## Локальний запуск за 5 хвилин

<Steps>
  <Step title="Запустіть Gateway">

```bash
openclaw gateway --port 18789
# налагодження/трасування дублюється у stdio
openclaw gateway --port 18789 --verbose
# примусово завершує слухач на вибраному порту, а потім запускає
openclaw gateway --force
```

  </Step>

  <Step title="Перевірте стан служби">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Ознаки справного стану: `Runtime: running`, `Connectivity probe: ok` і рядок `Capability`, що відповідає очікуванням. Використовуйте `openclaw gateway status --require-rpc` для підтвердження RPC з областю читання, а не лише доступності.

  </Step>

  <Step title="Перевірте готовність каналів">

```bash
openclaw channels status --probe
```

За доступного Gateway ця команда виконує актуальні перевірки каналів окремо для кожного облікового запису та необов’язкові аудити. Якщо Gateway недоступний, CLI повертається до зведень каналів лише на основі конфігурації.

  </Step>
</Steps>

<Note>
Перезавантаження конфігурації Gateway відстежує активний шлях до файлу конфігурації (визначений зі стандартних значень профілю/стану або з `OPENCLAW_CONFIG_PATH`, якщо його задано). Стандартний режим — `gateway.reload.mode="hybrid"`. Після першого успішного завантаження запущений процес використовує активний знімок конфігурації в пам’яті; успішне перезавантаження атомарно замінює цей знімок.
</Note>

## Модель виконання

- Один постійно активний процес для маршрутизації, площини керування та з’єднань каналів.
- Один мультиплексований порт для:
  - керування/RPC через WebSocket
  - HTTP API (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - HTTP-маршрутів Plugin, наприклад необов’язкового `/api/v1/admin/rpc`
  - інтерфейсу керування та хуків
- Стандартний режим прив’язки: `loopback`. У виявленому контейнерному середовищі фактичне стандартне значення — `auto` (визначається як `0.0.0.0` для переспрямування портів), якщо не активовано Tailscale serve/funnel, що завжди примусово встановлює `loopback`.
- Автентифікація потрібна за замовчуванням. Налаштування зі спільним секретом використовують `gateway.auth.token` / `gateway.auth.password` (або `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), а налаштування з непрямим проксі поза loopback можуть використовувати `gateway.auth.mode: "trusted-proxy"`.

## Кінцеві точки, сумісні з OpenAI

Найефективніша поверхня сумісності OpenClaw:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Чому цей набір важливий:

- Більшість інтеграцій Open WebUI, LobeChat і LibreChat спочатку перевіряють `/v1/models`.
- Багато конвеєрів RAG і пам’яті очікують `/v1/embeddings`.
- Клієнти, орієнтовані на агентів, дедалі частіше віддають перевагу `/v1/responses`.

`/v1/models` насамперед орієнтована на агентів: вона повертає `openclaw`, `openclaw/default` і `openclaw/<agentId>` для кожного налаштованого агента. `openclaw/default` — стабільний псевдонім, який завжди зіставляється з налаштованим стандартним агентом. Надсилайте `x-openclaw-model`, коли потрібно перевизначити внутрішнього провайдера/модель; інакше керування зберігають звичайна модель і налаштування вбудовування вибраного агента.

Усі ці кінцеві точки працюють на основному порту Gateway і використовують ту саму довірену межу автентифікації оператора, що й решта HTTP API Gateway.

Адміністративний HTTP RPC (`POST /api/v1/admin/rpc`) — це окремий, стандартно вимкнений маршрут Plugin для інструментів хоста, які не можуть використовувати RPC через WebSocket. Див. [Адміністративний HTTP RPC](/uk/plugins/admin-http-rpc).

### Пріоритет порту та прив’язки

| Налаштування | Порядок визначення |
| ------------ | -------------------------------------------------------------------- |
| Порт Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789`        |
| Режим прив’язки | CLI/перевизначення → `gateway.bind` → `loopback` (або `auto` у контейнерах) |

Установлені служби Gateway записують визначений `--port` у метаданих супервізора. Після зміни `gateway.port` запустіть `openclaw doctor --fix` або `openclaw gateway install --force`, щоб launchd/systemd/schtasks запускав процес на новому порту.

Під час запуску Gateway використовує той самий фактичний порт і прив’язку, коли формує локальні джерела інтерфейсу керування для прив’язок поза loopback. Наприклад, `--bind lan --port 3000` додає `http://localhost:3000` і `http://127.0.0.1:3000` до перевірки конфігурації під час виконання. Явно додайте всі джерела віддалених браузерів, наприклад URL-адреси HTTPS-проксі, до `gateway.controlUi.allowedOrigins`.

### Режими гарячого перезавантаження

| `gateway.reload.mode` | Поведінка |
| --------------------- | ------------------------------------------ |
| `off`                 | Без перезавантаження конфігурації |
| `hot`                 | Застосовувати лише безпечні для гарячого оновлення зміни |
| `restart`             | Перезапускати в разі змін, що потребують перезавантаження |
| `hybrid` (за замовчуванням)    | Застосовувати гаряче оновлення, коли це безпечно, і перезапускати, коли потрібно |

## Набір команд оператора

```bash
openclaw gateway status
openclaw gateway status --deep   # додає сканування служб на рівні системи
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` призначено для додаткового виявлення служб (LaunchDaemons/системних модулів systemd/schtasks), а не для поглибленої перевірки стану RPC.

## Кілька Gateway (на одному хості)

У більшості інсталяцій слід запускати один Gateway на машину. Один Gateway може обслуговувати кілька агентів і каналів. Кілька Gateway потрібні лише для навмисної ізоляції або резервного бота.

Корисні перевірки:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Очікувана поведінка:

- `gateway status --deep` може повідомити про `Other gateway-like services detected (best effort)` і вивести підказки щодо очищення, якщо залишилися застарілі інсталяції launchd/systemd/schtasks.
- `gateway probe` може попередити про `multiple reachable gateway identities`, коли відповідають різні Gateway або коли OpenClaw не може підтвердити, що доступні цілі є тим самим Gateway. SSH-тунель, URL-адреса проксі або налаштована віддалена URL-адреса до того самого Gateway — це один Gateway із кількома транспортами, навіть якщо порти транспортів відрізняються.
- Якщо це зроблено навмисно, ізолюйте порти, конфігурацію/стан і кореневі каталоги робочих просторів для кожного Gateway.

Контрольний список для кожного екземпляра:

- Унікальний `gateway.port`
- Унікальний `OPENCLAW_CONFIG_PATH`
- Унікальний `OPENCLAW_STATE_DIR`
- Унікальний `agents.defaults.workspace`

Приклад:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

Докладне налаштування: [/gateway/multiple-gateways](/uk/gateway/multiple-gateways).

## Віддалений доступ

Рекомендовано: Tailscale/VPN.
Резервний варіант: SSH-тунель.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

Після цього підключайте клієнтів локально до `ws://127.0.0.1:18789`.

<Warning>
SSH-тунелі не обходять автентифікацію Gateway. Для автентифікації зі спільним секретом клієнти все одно
мають надсилати `token`/`password` навіть через тунель. Для режимів із підтвердженою ідентичністю
запит усе одно має задовольняти вимоги відповідного шляху автентифікації.
</Warning>

Див.: [Віддалений Gateway](/uk/gateway/remote), [Автентифікація](/uk/gateway/authentication), [Tailscale](/uk/gateway/tailscale).

## Нагляд і життєвий цикл служби

Для надійності на рівні виробничого середовища використовуйте запуск під наглядом.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Використовуйте `openclaw gateway restart` для перезапусків. Не об’єднуйте `openclaw gateway stop` і `openclaw gateway start` у ланцюжок як заміну перезапуску.

У macOS `gateway stop` за замовчуванням використовує `launchctl bootout`. Це видаляє LaunchAgent із поточного сеансу завантаження без постійного вимкнення, тому автоматичне відновлення KeepAlive продовжує працювати після неочікуваних аварій, а `gateway start` коректно вмикає його знову. Щоб назавжди придушити автоматичний повторний запуск після перезавантаження системи, передайте `--disable`: `openclaw gateway stop --disable`.

Мітки LaunchAgent: `ai.openclaw.gateway` (за замовчуванням) або `ai.openclaw.<profile>` (іменований профіль). `openclaw doctor` перевіряє та виправляє розбіжності в конфігурації служби.

  </Tab>

  <Tab title="Linux (користувацький systemd)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Щоб служба продовжувала працювати після виходу із системи, увімкніть lingering:

```bash
sudo loginctl enable-linger $(whoami)
```

На сервері без графічного інтерфейсу та сеансу робочого столу також переконайтеся, що `XDG_RUNTIME_DIR` задано (`export XDG_RUNTIME_DIR=/run/user/$(id -u)`), перш ніж повторювати команди `systemctl --user`.

Приклад користувацького модуля, установленого вручну, коли потрібен власний шлях інсталяції:

```ini
[Unit]
Description=OpenClaw Gateway
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

  <Tab title="Windows (нативний)">

```powershell
openclaw gateway install
openclaw gateway status --json
openclaw gateway restart
openclaw gateway stop
```

Керований запуск у нативному Windows використовує заплановане завдання з назвою `OpenClaw Gateway`
(або `OpenClaw Gateway (<profile>)` для іменованих профілів). Якщо створення запланованого завдання
заборонено, OpenClaw повертається до засобу запуску з папки автозавантаження користувача,
який указує на `gateway.cmd` у каталозі стану.

  </Tab>

  <Tab title="Linux (системна служба)">

Використовуйте системний модуль для багатокористувацьких/постійно активних хостів.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Використовуйте той самий вміст служби, що й для користувацького модуля, але встановіть його в
`/etc/systemd/system/openclaw-gateway[-<profile>].service` і скоригуйте
`ExecStart=`, якщо ваш виконуваний файл `openclaw` розташований в іншому місці.

Не дозволяйте `openclaw doctor --fix` також установлювати користувацьку службу Gateway для того самого профілю/порту. Doctor відмовляється від такої автоматичної інсталяції, коли знаходить системну службу OpenClaw Gateway; використовуйте `OPENCLAW_SERVICE_REPAIR_POLICY=external`, коли системний модуль керує життєвим циклом.

  </Tab>
</Tabs>

У разі помилок неприпустимої конфігурації процес завершується з кодом `78`. Модулі systemd у Linux використовують `RestartPreventExitStatus=78`, щоб припинити повторні запуски, доки конфігурацію не буде виправлено. launchd і планувальник завдань Windows не мають еквівалентного правила зупинки для окремого коду завершення, тому Gateway також зберігає історію швидких некоректних запусків і пригнічує автоматичний запуск облікових записів каналів/провайдерів після повторних помилок запуску. У цьому безпечному режимі площина керування все одно запускається для перевірки й виправлення, гарячі перезавантаження конфігурації та `secrets.reload` відмовляються автоматично перезапускати канали, а явний запит оператора `channels.start` може скасувати це пригнічення.

## Швидкий шлях для профілю розробки

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Стандартні значення включають ізольовані стан/конфігурацію та базовий порт Gateway `19001`.

## Короткий довідник протоколу (для оператора)

- Першим кадром клієнта має бути `connect`.
- Gateway повертає кадр `hello-ok` з `snapshot` (`presence`, `health`, `stateVersion`, `uptimeMs`), а також обмеженнями `policy` (`maxPayload`, `maxBufferedBytes`, `tickIntervalMs`).
- `hello-ok.features.methods` / `events` — це консервативний список для виявлення, а не
  згенерований перелік усіх доступних для виклику допоміжних маршрутів.
- Запити: `req(method, params)` → `res(ok/payload|error)`.
- До поширених подій належать `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.operation`, `session.tool`, необов’язкова
  `session.approval`, `sessions.changed`, `presence`, `tick`, `health`,
  `heartbeat`, події життєвого циклу сполучення/схвалення та `shutdown`.

Запуски агента відбуваються у два етапи:

1. Негайне підтвердження прийняття (`status:"accepted"`)
2. Остаточна відповідь про завершення (`status:"ok"|"error"`), між якими передаються потокові події `agent`.

Повну документацію протоколу див. у розділі [Протокол Gateway](/uk/gateway/protocol).

## Операційні перевірки

### Працездатність

- Відкрийте WS і надішліть `connect`.
- Очікуйте відповідь `hello-ok` зі знімком стану.

### Готовність

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Відновлення після пропуску

Події не відтворюються повторно. У разі пропусків у послідовності оновіть стан (`health`, `system-presence`), перш ніж продовжувати.

## Поширені ознаки помилок

| Ознака                                                         | Імовірна проблема                                                               |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | Прив’язування не до loopback-інтерфейсу без дійсного шляху автентифікації Gateway |
| `another gateway instance is already listening` / `EADDRINUSE` | Конфлікт портів                                                                  |
| `Gateway start blocked: set gateway.mode=local`                | У конфігурації встановлено віддалений режим або в пошкодженій конфігурації відсутній `gateway.mode` |
| `unauthorized` під час підключення                             | Невідповідність автентифікації між клієнтом і Gateway                            |

Повні послідовності діагностики див. у розділі [Усунення несправностей Gateway](/uk/gateway/troubleshooting).

## Гарантії безпеки

- Клієнти протоколу Gateway негайно завершують роботу з помилкою, коли Gateway недоступний (без неявного резервного переходу на прямий канал).
- Недійсні перші кадри або кадри, що не призначені для підключення, відхиляються, а з’єднання закривається.
- Під час коректного завершення роботи перед закриттям сокета надсилається подія `shutdown`.

## Пов’язані матеріали

- [Конфігурація](/uk/gateway/configuration)
- [Усунення несправностей Gateway](/uk/gateway/troubleshooting)
- [Фоновий процес](/uk/gateway/background-process)
- [Стан системи](/uk/gateway/health)
- [Doctor](/uk/gateway/doctor)
- [Автентифікація](/uk/gateway/authentication)
- [Віддалений доступ](/uk/gateway/remote)
- [Керування секретами](/uk/gateway/secrets)
