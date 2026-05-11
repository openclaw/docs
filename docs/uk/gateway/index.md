---
read_when:
    - Запуск або налагодження процесу Gateway
summary: Операційний посібник для служби Gateway, її життєвого циклу та експлуатації
title: Операційний посібник Gateway
x-i18n:
    generated_at: "2026-05-11T20:38:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 54f868e0b263e346876fb5c4f6a359e8a6f6802871f6931668ebe57140ca2711
    source_path: gateway/index.md
    workflow: 16
---

Скористайтеся цією сторінкою для запуску в перший день і операцій другого дня для служби Gateway.

<CardGroup cols={2}>
  <Card title="Глибоке усунення несправностей" icon="siren" href="/uk/gateway/troubleshooting">
    Діагностика від симптомів із точними послідовностями команд і сигнатурами журналів.
  </Card>
  <Card title="Конфігурація" icon="sliders" href="/uk/gateway/configuration">
    Посібник із налаштування, орієнтований на завдання, + повний довідник із конфігурації.
  </Card>
  <Card title="Керування секретами" icon="key-round" href="/uk/gateway/secrets">
    Контракт SecretRef, поведінка знімка runtime та операції migrate/reload.
  </Card>
  <Card title="Контракт плану секретів" icon="shield-check" href="/uk/gateway/secrets-plan-contract">
    Точні правила цілі/шляху для `secrets apply` і поведінка auth-profile лише з посиланнями.
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

  <Step title="Перевірте стан служби">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Здоровий базовий стан: `Runtime: running`, `Connectivity probe: ok` і `Capability: ...`, що відповідає вашим очікуванням. Використовуйте `openclaw gateway status --require-rpc`, коли потрібне підтвердження RPC із read-scope, а не лише доступність.

  </Step>

  <Step title="Перевірте готовність каналу">

```bash
openclaw channels status --probe
```

За доступного gateway це запускає живі перевірки каналів для кожного облікового запису та необов’язкові аудити.
Якщо gateway недоступний, CLI натомість повертається до зведень каналів лише з конфігурації
замість виводу live probe.

  </Step>
</Steps>

<Note>
Перезавантаження конфігурації Gateway відстежує шлях активного файла конфігурації (визначений із типових значень profile/state або з `OPENCLAW_CONFIG_PATH`, якщо задано).
Типовий режим — `gateway.reload.mode="hybrid"`.
Після першого успішного завантаження запущений процес обслуговує активний знімок конфігурації в пам’яті; успішне перезавантаження атомарно замінює цей знімок.
</Note>

## Модель runtime

- Один постійно ввімкнений процес для маршрутизації, control plane і підключень каналів.
- Один мультиплексований порт для:
  - WebSocket control/RPC
  - HTTP API, сумісні з OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Control UI і hooks
- Типовий режим прив’язки: `loopback`.
- Auth потрібна за замовчуванням. Налаштування shared-secret використовують
  `gateway.auth.token` / `gateway.auth.password` (або
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), а reverse-proxy налаштування не для loopback
  можуть використовувати `gateway.auth.mode: "trusted-proxy"`.

## Endpoints, сумісні з OpenAI

Найефективніша поверхня сумісності OpenClaw тепер така:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Чому цей набір важливий:

- Більшість інтеграцій Open WebUI, LobeChat і LibreChat спочатку перевіряють `/v1/models`.
- Багато конвеєрів RAG і пам’яті очікують `/v1/embeddings`.
- Agent-native клієнти дедалі частіше віддають перевагу `/v1/responses`.

Примітка щодо планування:

- `/v1/models` орієнтований насамперед на agent: він повертає `openclaw`, `openclaw/default` і `openclaw/<agentId>`.
- `openclaw/default` — стабільний псевдонім, який завжди відповідає налаштованому типовому agent.
- Використовуйте `x-openclaw-model`, коли потрібне перевизначення backend provider/model; інакше звичайна модель і налаштування embeddings вибраного agent залишаються керівними.

Усе це працює на головному порту Gateway і використовує ту саму довірену межу operator auth, що й решта HTTP API Gateway.

### Пріоритет порту та прив’язки

| Налаштування | Порядок визначення                                          |
| ------------ | ----------------------------------------------------------- |
| Порт Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Режим прив’язки | CLI/override → `gateway.bind` → `loopback`                 |

Установлені служби gateway записують визначений `--port` у metadata supervisor. Після зміни `gateway.port` запустіть `openclaw doctor --fix` або `openclaw gateway install --force`, щоб launchd/systemd/schtasks запускали процес на новому порту.

Під час запуску Gateway використовує той самий ефективний порт і прив’язку, коли додає локальні
джерела Control UI для non-loopback прив’язок. Наприклад, `--bind lan --port 3000`
додає `http://localhost:3000` і `http://127.0.0.1:3000` до виконання runtime
validation. Додайте будь-які джерела віддаленого браузера, наприклад HTTPS proxy URLs, до
`gateway.controlUi.allowedOrigins` явно.

### Режими hot reload

| `gateway.reload.mode` | Поведінка                                  |
| --------------------- | ------------------------------------------ |
| `off`                 | Без перезавантаження конфігурації          |
| `hot`                 | Застосовувати лише hot-safe зміни          |
| `restart`             | Перезапускати за змін, що потребують перезапуску |
| `hybrid` (типово)     | Hot-apply, коли безпечно, перезапуск, коли потрібно |

## Набір команд operator

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

`gateway status --deep` призначена для додаткового виявлення служб (LaunchDaemons/systemd system
units/schtasks), а не для глибшої перевірки стану RPC.

## Кілька gateways (той самий host)

Більшість інсталяцій мають запускати один gateway на машину. Один gateway може обслуговувати кілька
agents і channels.

Кілька gateways потрібні лише тоді, коли ви навмисно хочете ізоляції або rescue bot.

Корисні перевірки:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Очікувана поведінка:

- `gateway status --deep` може повідомити `Other gateway-like services detected (best effort)`
  і вивести підказки з очищення, коли застарілі інсталяції launchd/systemd/schtasks усе ще присутні.
- `gateway probe` може попередити про `multiple reachable gateways`, коли відповідає більше ніж одна ціль.
- Якщо це навмисно, ізолюйте порти, config/state і корені workspace для кожного gateway.

Checklist для кожного екземпляра:

- Унікальний `gateway.port`
- Унікальний `OPENCLAW_CONFIG_PATH`
- Унікальний `OPENCLAW_STATE_DIR`
- Унікальний `agents.defaults.workspace`

Приклад:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

Детальне налаштування: [/gateway/multiple-gateways](/uk/gateway/multiple-gateways).

## Віддалений доступ

Рекомендовано: Tailscale/VPN.
Запасний варіант: SSH tunnel.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Потім підключайте клієнти локально до `ws://127.0.0.1:18789`.

<Warning>
SSH tunnels не обходять gateway auth. Для shared-secret auth клієнти все одно
мають надсилати `token`/`password` навіть через tunnel. Для режимів з identity-bearing
запит усе одно має відповідати цьому auth path.
</Warning>

Див.: [Віддалений Gateway](/uk/gateway/remote), [Автентифікація](/uk/gateway/authentication), [Tailscale](/uk/gateway/tailscale).

## Supervision і життєвий цикл служби

Використовуйте supervised запуски для надійності, подібної до production.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Використовуйте `openclaw gateway restart` для перезапусків. Не зв’язуйте `openclaw gateway stop` і `openclaw gateway start` як заміну перезапуску.

На macOS `gateway stop` за замовчуванням використовує `launchctl bootout` — це видаляє LaunchAgent із поточної boot session без постійного вимкнення, тож автоматичне відновлення KeepAlive і далі працює після неочікуваних збоїв, а `gateway start` повторно вмикає його коректно. Щоб постійно пригнітити auto-respawn між перезавантаженнями, передайте `--disable`: `openclaw gateway stop --disable`.

Мітки LaunchAgent: `ai.openclaw.gateway` (типово) або `ai.openclaw.<profile>` (іменований profile). `openclaw doctor` аудіює та виправляє drift конфігурації служби.

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Для збереження після logout увімкніть lingering:

```bash
sudo loginctl enable-linger <user>
```

Приклад ручного user-unit, коли потрібен власний шлях інсталяції:

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
(або `OpenClaw Gateway (<profile>)` для іменованих profiles). Якщо створення Scheduled Task
заборонено, OpenClaw повертається до launcher у Startup-folder для кожного користувача,
який вказує на `gateway.cmd` усередині state directory.

  </Tab>

  <Tab title="Linux (system service)">

Використовуйте system unit для multi-user/always-on hosts.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Використовуйте той самий service body, що й для user unit, але встановіть його в
`/etc/systemd/system/openclaw-gateway[-<profile>].service` і скоригуйте
`ExecStart=`, якщо ваш бінарний файл `openclaw` розташований в іншому місці.

Не дозволяйте також `openclaw doctor --fix` встановлювати user-level gateway service для того самого profile/port. Doctor відмовляється від такої автоматичної інсталяції, коли знаходить system-level службу OpenClaw gateway; використовуйте `OPENCLAW_SERVICE_REPAIR_POLICY=external`, коли system unit керує життєвим циклом.

  </Tab>
</Tabs>

## Швидкий шлях dev profile

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Типові значення включають ізольовані state/config і базовий порт gateway `19001`.

## Короткий довідник протоколу (operator view)

- Перший frame клієнта має бути `connect`.
- Gateway повертає знімок `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, limits/policy).
- `hello-ok.features.methods` / `events` — це консервативний список discovery, а не
  згенерований dump кожного доступного helper route.
- Запити: `req(method, params)` → `res(ok/payload|error)`.
- Поширені events включають `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, події життєвого циклу pairing/approval і `shutdown`.

Запуски agent мають два етапи:

1. Негайний accepted ack (`status:"accepted"`)
2. Фінальна відповідь completion (`status:"ok"|"error"`) зі streamed events `agent` між ними.

Див. повну документацію протоколу: [Протокол Gateway](/uk/gateway/protocol).

## Операційні перевірки

### Liveness

- Відкрити WS і надіслати `connect`.
- Очікувати відповідь `hello-ok` зі знімком.

### Readiness

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Відновлення після розривів

Events не відтворюються повторно. У разі розривів sequence оновіть state (`health`, `system-presence`) перед продовженням.

## Поширені сигнатури збоїв

| Сигнатура                                                      | Ймовірна проблема                                                                    |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | Прив’язування не до loopback без дійсного шляху автентифікації Gateway                             |
| `another gateway instance is already listening` / `EADDRINUSE` | Конфлікт порту                                                                   |
| `Gateway start blocked: set gateway.mode=local`                | Конфігурацію встановлено в віддалений режим, або позначка локального режиму відсутня в пошкодженій конфігурації |
| `unauthorized` during connect                                  | Невідповідність автентифікації між клієнтом і Gateway                                        |

Для повних послідовностей діагностики використовуйте [усунення несправностей Gateway](/uk/gateway/troubleshooting).

## Гарантії безпеки

- Клієнти протоколу Gateway швидко завершуються з помилкою, коли Gateway недоступний (без неявного запасного переходу до прямого каналу).
- Недійсні або непідключальні перші кадри відхиляються й закриваються.
- Коректне завершення роботи надсилає подію `shutdown` перед закриттям сокета.

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
