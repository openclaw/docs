---
read_when:
    - Запуск або налагодження процесу Gateway
summary: Операційний посібник для служби Gateway, життєвого циклу та операцій
title: Операційний посібник Gateway
x-i18n:
    generated_at: "2026-05-06T04:11:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 592eb379cc75402246676cbb23b1dca39b98f559c214c92983b5a3685cff7ab7
    source_path: gateway/index.md
    workflow: 16
---

Використовуйте цю сторінку для старту в день 1 і операцій дня 2 сервісу Gateway.

<CardGroup cols={2}>
  <Card title="Поглиблене усунення несправностей" icon="siren" href="/uk/gateway/troubleshooting">
    Діагностика від симптомів із точними ланцюжками команд і сигнатурами журналів.
  </Card>
  <Card title="Конфігурація" icon="sliders" href="/uk/gateway/configuration">
    Орієнтований на завдання посібник із налаштування + повний довідник конфігурації.
  </Card>
  <Card title="Керування секретами" icon="key-round" href="/uk/gateway/secrets">
    Контракт SecretRef, поведінка runtime-знімка та операції міграції/перезавантаження.
  </Card>
  <Card title="Контракт плану секретів" icon="shield-check" href="/uk/gateway/secrets-plan-contract">
    Точні правила цілі/шляху `secrets apply` і поведінка auth-profile лише з посиланнями.
  </Card>
</CardGroup>

## 5-хвилинний локальний запуск

<Steps>
  <Step title="Запустіть Gateway">

```bash
openclaw gateway --port 18789
# debug/trace mirrored to stdio
openclaw gateway --port 18789 --verbose
# force-kill listener on selected port, then start
openclaw gateway --force
```

  </Step>

  <Step title="Перевірте справність сервісу">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Справний базовий стан: `Runtime: running`, `Connectivity probe: ok` і `Capability: ...`, що відповідає очікуваному. Використовуйте `openclaw gateway status --require-rpc`, коли вам потрібне підтвердження RPC з областю читання, а не лише досяжність.

  </Step>

  <Step title="Перевірте готовність каналу">

```bash
openclaw channels status --probe
```

За доступного gateway це запускає живі перевірки каналів для кожного облікового запису та необов’язкові аудити.
Якщо gateway недосяжний, CLI натомість повертається до підсумків каналів лише з конфігурації
замість виводу живої перевірки.

  </Step>
</Steps>

<Note>
Перезавантаження конфігурації Gateway відстежує шлях активного файла конфігурації (визначений із типових значень профілю/стану або `OPENCLAW_CONFIG_PATH`, якщо задано).
Типовий режим — `gateway.reload.mode="hybrid"`.
Після першого успішного завантаження запущений процес обслуговує активний знімок конфігурації в пам’яті; успішне перезавантаження атомарно замінює цей знімок.
</Note>

## Runtime-модель

- Один постійно ввімкнений процес для маршрутизації, control plane і підключень каналів.
- Один мультиплексований порт для:
  - WebSocket control/RPC
  - HTTP API, сумісних з OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Control UI і hooks
- Типовий режим прив’язки: `loopback`.
- Автентифікація потрібна за замовчуванням. Налаштування зі спільним секретом використовують
  `gateway.auth.token` / `gateway.auth.password` (або
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), а non-loopback
  налаштування reverse-proxy можуть використовувати `gateway.auth.mode: "trusted-proxy"`.

## Ендпоїнти, сумісні з OpenAI

Найефективніша поверхня сумісності OpenClaw тепер така:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Чому цей набір важливий:

- Більшість інтеграцій Open WebUI, LobeChat і LibreChat спочатку перевіряють `/v1/models`.
- Багато RAG і memory-конвеєрів очікують `/v1/embeddings`.
- Agent-native клієнти дедалі частіше віддають перевагу `/v1/responses`.

Примітка щодо планування:

- `/v1/models` орієнтований передусім на агентів: він повертає `openclaw`, `openclaw/default` і `openclaw/<agentId>`.
- `openclaw/default` — стабільний псевдонім, який завжди відповідає налаштованому типовому агенту.
- Використовуйте `x-openclaw-model`, коли потрібне перевизначення backend provider/model; інакше контроль зберігає звичайна модель і налаштування embedding вибраного агента.

Усе це працює на основному порту Gateway і використовує ту саму довірену межу операторської автентифікації, що й решта HTTP API Gateway.

### Пріоритет порту та прив’язки

| Налаштування | Порядок визначення                                           |
| ------------ | ------------------------------------------------------------- |
| Порт Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Режим прив’язки | CLI/override → `gateway.bind` → `loopback`                    |

Установлені сервіси gateway записують визначений `--port` у метадані супервізора. Після зміни `gateway.port` запустіть `openclaw doctor --fix` або `openclaw gateway install --force`, щоб launchd/systemd/schtasks запускали процес на новому порту.

Під час запуску Gateway використовує той самий ефективний порт і прив’язку, коли початково задає локальні
origins Control UI для non-loopback прив’язок. Наприклад, `--bind lan --port 3000`
додає `http://localhost:3000` і `http://127.0.0.1:3000` до того, як виконується runtime
валідація. Додайте будь-які origins віддаленого браузера, як-от HTTPS proxy URLs, до
`gateway.controlUi.allowedOrigins` явно.

### Режими гарячого перезавантаження

| `gateway.reload.mode` | Поведінка                                  |
| --------------------- | ------------------------------------------ |
| `off`                 | Без перезавантаження конфігурації          |
| `hot`                 | Застосовувати лише hot-safe зміни          |
| `restart`             | Перезапускати за змін, що потребують перезапуску |
| `hybrid` (типово)     | Hot-застосування, коли безпечно, перезапуск, коли потрібно |

## Набір команд оператора

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

`gateway status --deep` призначено для додаткового виявлення сервісів (LaunchDaemons/systemd system
units/schtasks), а не для глибшої перевірки справності RPC.

## Кілька gateways (той самий host)

Більшість установок мають запускати один gateway на машину. Один gateway може обслуговувати кілька
агентів і каналів.

Кілька gateways потрібні лише тоді, коли ви навмисно хочете ізоляції або rescue bot.

Корисні перевірки:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Чого очікувати:

- `gateway status --deep` може повідомити `Other gateway-like services detected (best effort)`
  і вивести підказки з очищення, коли застарілі встановлення launchd/systemd/schtasks усе ще лишаються.
- `gateway probe` може попередити про `multiple reachable gateways`, коли відповідає більше ніж одна ціль.
- Якщо це навмисно, ізолюйте порти, конфігурацію/стан і корені workspace для кожного gateway.

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

Бажано: Tailscale/VPN.
Запасний варіант: SSH-тунель.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Потім підключайте клієнти локально до `ws://127.0.0.1:18789`.

<Warning>
SSH-тунелі не обходять автентифікацію gateway. Для автентифікації зі спільним секретом клієнти все одно
мають надсилати `token`/`password` навіть через тунель. Для режимів із передаванням ідентичності
запит усе одно має задовольняти цей шлях автентифікації.
</Warning>

Див.: [Віддалений Gateway](/uk/gateway/remote), [Автентифікація](/uk/gateway/authentication), [Tailscale](/uk/gateway/tailscale).

## Нагляд і життєвий цикл сервісу

Використовуйте supervised-запуски для надійності, подібної до production.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Використовуйте `openclaw gateway restart` для перезапусків. Не ланцюжте `openclaw gateway stop` і `openclaw gateway start`; на macOS `gateway stop` навмисно вимикає LaunchAgent перед зупинкою.

Мітки LaunchAgent — `ai.openclaw.gateway` (типово) або `ai.openclaw.<profile>` (іменований профіль). `openclaw doctor` аудіює та виправляє дрейф конфігурації сервісу.

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Для збереження роботи після виходу з системи увімкніть lingering:

```bash
sudo loginctl enable-linger <user>
```

Приклад ручного user-unit, коли потрібен власний шлях встановлення:

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

Нативний керований запуск Windows використовує Scheduled Task з назвою `OpenClaw Gateway`
(або `OpenClaw Gateway (<profile>)` для іменованих профілів). Якщо створення Scheduled Task
заборонено, OpenClaw повертається до launcher у Startup-folder для поточного користувача,
який вказує на `gateway.cmd` у каталозі стану.

  </Tab>

  <Tab title="Linux (system service)">

Використовуйте system unit для multi-user/always-on host.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Використовуйте той самий service body, що й user unit, але встановіть його в
`/etc/systemd/system/openclaw-gateway[-<profile>].service` і скоригуйте
`ExecStart=`, якщо ваш бінарний файл `openclaw` розташований деінде.

Не дозволяйте також `openclaw doctor --fix` встановлювати user-level gateway service для того самого профілю/порту. Doctor відмовляється від такого автоматичного встановлення, коли знаходить system-level OpenClaw gateway service; використовуйте `OPENCLAW_SERVICE_REPAIR_POLICY=external`, коли system unit керує життєвим циклом.

  </Tab>
</Tabs>

## Швидкий шлях dev profile

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Типові значення включають ізольовані стан/конфігурацію та базовий порт gateway `19001`.

## Короткий довідник протоколу (погляд оператора)

- Перший кадр клієнта має бути `connect`.
- Gateway повертає знімок `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, limits/policy).
- `hello-ok.features.methods` / `events` — консервативний список виявлення, а не
  згенерований дамп кожного викличного helper route.
- Запити: `req(method, params)` → `res(ok/payload|error)`.
- Поширені події включають `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, події життєвого циклу pairing/approval і `shutdown`.

Запуски агентів мають два етапи:

1. Негайне підтвердження прийняття (`status:"accepted"`)
2. Фінальна відповідь завершення (`status:"ok"|"error"`), зі streamed-подіями `agent` між ними.

Див. повну документацію протоколу: [Протокол Gateway](/uk/gateway/protocol).

## Операційні перевірки

### Liveness

- Відкрийте WS і надішліть `connect`.
- Очікуйте відповідь `hello-ok` зі знімком.

### Readiness

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Відновлення після розривів

Події не відтворюються повторно. У разі розривів послідовності оновіть стан (`health`, `system-presence`) перед продовженням.

## Поширені сигнатури збоїв

| Сигнатура                                                     | Ймовірна проблема                                                               |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | Non-loopback прив’язка без чинного шляху автентифікації gateway                 |
| `another gateway instance is already listening` / `EADDRINUSE` | Конфлікт порту                                                                  |
| `Gateway start blocked: set gateway.mode=local`                | Конфігурацію встановлено в remote mode, або stamp local-mode відсутній у пошкодженій конфігурації |
| `unauthorized` during connect                                  | Невідповідність автентифікації між клієнтом і gateway                           |

Для повних ланцюжків діагностики використовуйте [Усунення несправностей Gateway](/uk/gateway/troubleshooting).

## Гарантії безпеки

- Клієнти протоколу Gateway швидко завершують роботу з помилкою, коли Gateway недоступний (без неявного резервного переходу на прямий канал).
- Недійсні перші фрейми або перші фрейми, що не є фреймами підключення, відхиляються, а з’єднання закривається.
- Коректне завершення роботи видає подію `shutdown` перед закриттям сокета.

---

Пов’язане:

- [Усунення несправностей](/uk/gateway/troubleshooting)
- [Фоновий процес](/uk/gateway/background-process)
- [Конфігурація](/uk/gateway/configuration)
- [Стан](/uk/gateway/health)
- [Діагностика](/uk/gateway/doctor)
- [Автентифікація](/uk/gateway/authentication)

## Пов’язане

- [Конфігурація](/uk/gateway/configuration)
- [Усунення несправностей Gateway](/uk/gateway/troubleshooting)
- [Віддалений доступ](/uk/gateway/remote)
- [Керування секретами](/uk/gateway/secrets)
