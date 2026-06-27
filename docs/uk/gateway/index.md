---
read_when:
    - Запуск або налагодження процесу Gateway
summary: Runbook для сервісу Gateway, життєвого циклу та операцій
title: Посібник з експлуатації Gateway
x-i18n:
    generated_at: "2026-06-27T17:33:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b0bbbcad26df135e1475cbeb14f1299b48bae62be759b2e6c6f82164d175601b
    source_path: gateway/index.md
    workflow: 16
---

Використовуйте цю сторінку для запуску Gateway service у перший день і для операцій другого дня.

<CardGroup cols={2}>
  <Card title="Поглиблене усунення несправностей" icon="siren" href="/uk/gateway/troubleshooting">
    Діагностика від симптомів із точними послідовностями команд і сигнатурами журналів.
  </Card>
  <Card title="Конфігурація" icon="sliders" href="/uk/gateway/configuration">
    Орієнтований на завдання посібник із налаштування + повний довідник конфігурації.
  </Card>
  <Card title="Керування секретами" icon="key-round" href="/uk/gateway/secrets">
    Контракт SecretRef, поведінка runtime snapshot і операції міграції/перезавантаження.
  </Card>
  <Card title="Контракт плану секретів" icon="shield-check" href="/uk/gateway/secrets-plan-contract">
    Точні правила цілі/шляху `secrets apply` і поведінка профілю автентифікації лише за посиланням.
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

  <Step title="Перевірте справність служби">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Базовий справний стан: `Runtime: running`, `Connectivity probe: ok` і `Capability: ...`, що відповідає вашим очікуванням. Використовуйте `openclaw gateway status --require-rpc`, коли потрібне підтвердження RPC з областю читання, а не лише доступність.

  </Step>

  <Step title="Перевірте готовність каналів">

```bash
openclaw channels status --probe
```

За доступного gateway це виконує live-перевірки каналів для кожного облікового запису й необов’язкові аудити.
Якщо gateway недоступний, CLI натомість повертається до підсумків каналів лише з конфігурації,
без виводу live-перевірок.

  </Step>
</Steps>

<Note>
Перезавантаження конфігурації Gateway відстежує шлях активного файла конфігурації (визначений із типових значень профілю/стану або з `OPENCLAW_CONFIG_PATH`, якщо задано).
Типовий режим — `gateway.reload.mode="hybrid"`.
Після першого успішного завантаження запущений процес обслуговує активний знімок конфігурації в пам’яті; успішне перезавантаження атомарно замінює цей знімок.
</Note>

## Модель виконання

- Один постійно запущений процес для маршрутизації, control plane і підключень каналів.
- Один мультиплексований порт для:
  - WebSocket-керування/RPC
  - HTTP API (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - HTTP-маршрутів Plugin, як-от необов’язковий `/api/v1/admin/rpc`
  - Control UI і хуків
- Типовий режим прив’язки: `loopback`.
- Автентифікація потрібна за замовчуванням. Налаштування зі спільним секретом використовують
  `gateway.auth.token` / `gateway.auth.password` (або
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), а налаштування reverse proxy
  не через loopback можуть використовувати `gateway.auth.mode: "trusted-proxy"`.

## OpenAI-сумісні endpoints

Найцінніша поверхня сумісності OpenClaw тепер така:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Чому цей набір важливий:

- Більшість інтеграцій Open WebUI, LobeChat і LibreChat спершу перевіряють `/v1/models`.
- Багато RAG- і memory-конвеєрів очікують `/v1/embeddings`.
- Agent-native клієнти дедалі частіше віддають перевагу `/v1/responses`.

Примітка щодо планування:

- `/v1/models` орієнтований насамперед на agent: він повертає `openclaw`, `openclaw/default` і `openclaw/<agentId>`.
- `openclaw/default` — стабільний псевдонім, який завжди відповідає налаштованому типовому agent.
- Використовуйте `x-openclaw-model`, коли потрібне перевизначення backend-провайдера/моделі; інакше звичайні налаштування моделі та embeddings вибраного agent залишаються керівними.

Усе це працює на основному порту Gateway і використовує ту саму межу автентифікації довіреного оператора, що й решта HTTP API Gateway.

Admin HTTP RPC (`POST /api/v1/admin/rpc`) — це окремий, типово вимкнений маршрут Plugin для host tooling, який не може використовувати WebSocket RPC. Див. [Admin HTTP RPC](/uk/plugins/admin-http-rpc).

### Пріоритет порту й прив’язки

| Налаштування | Порядок визначення                                           |
| ------------ | ------------------------------------------------------------- |
| Порт Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Режим прив’язки | CLI/override → `gateway.bind` → `loopback`                    |

Встановлені служби gateway записують визначений `--port` у metadata супервізора. Після зміни `gateway.port` запустіть `openclaw doctor --fix` або `openclaw gateway install --force`, щоб launchd/systemd/schtasks запускали процес на новому порту.

Під час запуску Gateway використовує той самий фактичний порт і прив’язку, коли засіває локальні
джерела Control UI для прив’язок не через loopback. Наприклад, `--bind lan --port 3000`
засіває `http://localhost:3000` і `http://127.0.0.1:3000` до запуску runtime-
валідації. Додавайте будь-які джерела віддаленого браузера, як-от HTTPS proxy URLs, до
`gateway.controlUi.allowedOrigins` явно.

### Режими гарячого перезавантаження

| `gateway.reload.mode` | Поведінка                                   |
| --------------------- | ------------------------------------------ |
| `off`                 | Без перезавантаження конфігурації          |
| `hot`                 | Застосовувати лише hot-safe зміни          |
| `restart`             | Перезапускати за змін, що потребують перезапуску |
| `hybrid` (типово)     | Застосовувати гаряче, коли безпечно; перезапускати, коли потрібно |

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

`gateway status --deep` призначено для додаткового виявлення служб (LaunchDaemons/systemd system
units/schtasks), а не для глибшої RPC-перевірки справності.

## Кілька gateways (той самий host)

Більшість установок мають запускати один gateway на машину. Один gateway може розміщувати кілька
agents і каналів.

Кілька gateways потрібні лише тоді, коли ви навмисно хочете ізоляцію або rescue bot.

Корисні перевірки:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Очікувана поведінка:

- `gateway status --deep` може повідомити `Other gateway-like services detected (best effort)`
  і вивести підказки з очищення, коли застарілі встановлення launchd/systemd/schtasks усе ще присутні.
- `gateway probe` може попередити про `multiple reachable gateway identities`, коли відповідають різні
  gateways або коли OpenClaw не може довести, що доступні цілі є тим самим gateway.
  SSH tunnel, proxy URL або налаштований remote URL до того самого gateway — це один
  gateway із кількома transport, навіть якщо порти transport відрізняються.
- Якщо це навмисно, ізолюйте порти, config/state і корені workspace для кожного gateway.

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
Резервний варіант: SSH-тунель.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Потім підключайте клієнти локально до `ws://127.0.0.1:18789`.

<Warning>
SSH-тунелі не обходять автентифікацію gateway. Для автентифікації зі спільним секретом клієнти все одно
мають надсилати `token`/`password` навіть через тунель. Для режимів із передаванням ідентичності
запит усе одно має відповідати цьому шляху автентифікації.
</Warning>

Див.: [Віддалений Gateway](/uk/gateway/remote), [Автентифікація](/uk/gateway/authentication), [Tailscale](/uk/gateway/tailscale).

## Нагляд і життєвий цикл служби

Використовуйте запуск під наглядом для надійності, подібної до продакшн-середовища.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Використовуйте `openclaw gateway restart` для перезапусків. Не поєднуйте `openclaw gateway stop` і `openclaw gateway start` як заміну перезапуску.

На macOS `gateway stop` типово використовує `launchctl bootout` — це вилучає LaunchAgent із поточної сесії завантаження без постійного вимкнення, тож автоматичне відновлення KeepAlive усе одно працює після неочікуваних збоїв, а `gateway start` повторно вмикає службу коректно. Щоб постійно приглушити автоматичний повторний запуск між перезавантаженнями, передайте `--disable`: `openclaw gateway stop --disable`.

Мітки LaunchAgent: `ai.openclaw.gateway` (типово) або `ai.openclaw.<profile>` (іменований профіль). `openclaw doctor` перевіряє та виправляє розбіжності конфігурації служби.

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Для збереження роботи після виходу з системи ввімкніть lingering:

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

Нативний керований запуск Windows використовує заплановане завдання з назвою `OpenClaw Gateway`
(або `OpenClaw Gateway (<profile>)` для іменованих профілів). Якщо створення запланованого завдання
заборонено, OpenClaw повертається до лаунчера в теці автозапуску поточного користувача,
який вказує на `gateway.cmd` всередині каталогу стану.

  </Tab>

  <Tab title="Linux (system service)">

Використовуйте system unit для багатокористувацьких або постійно ввімкнених хостів.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Використовуйте той самий вміст служби, що й для user unit, але встановіть його в
`/etc/systemd/system/openclaw-gateway[-<profile>].service` і скоригуйте
`ExecStart=`, якщо ваш бінарний файл `openclaw` розташований в іншому місці.

Також не дозволяйте `openclaw doctor --fix` встановлювати службу gateway рівня користувача для того самого профілю/порту. Doctor відмовляється від такого автоматичного встановлення, коли знаходить службу OpenClaw gateway системного рівня; використовуйте `OPENCLAW_SERVICE_REPAIR_POLICY=external`, коли system unit володіє життєвим циклом.

  </Tab>
</Tabs>

## Швидкий шлях для dev-профілю

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Типові значення включають ізольовані стан/конфігурацію та базовий порт gateway `19001`.

## Короткий довідник протоколу (погляд оператора)

- Першим кадром клієнта має бути `connect`.
- Gateway повертає знімок `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, обмеження/політика).
- `hello-ok.features.methods` / `events` — це консервативний список для виявлення, а не
  згенерований дамп кожного callable helper route.
- Запити: `req(method, params)` → `res(ok/payload|error)`.
- Поширені події включають `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.operation`, `session.tool`, `sessions.changed`,
  `presence`, `tick`, `health`, `heartbeat`, події життєвого циклу pairing/approval
  і `shutdown`.

Запуски агента мають два етапи:

1. Негайне підтвердження прийняття (`status:"accepted"`)
2. Фінальна відповідь про завершення (`status:"ok"|"error"`), із потоковими подіями `agent` між ними.

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

### Відновлення після пропусків

Події не відтворюються повторно. У разі пропусків послідовності оновіть стан (`health`, `system-presence`) перед продовженням.

## Поширені ознаки збоїв

| Сигнатура                                                      | Ймовірна проблема                                                               |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | Прив’язка не до loopback без дійсного шляху автентифікації Gateway             |
| `another gateway instance is already listening` / `EADDRINUSE` | Конфлікт порту                                                                  |
| `Gateway start blocked: set gateway.mode=local`                | Конфігурацію встановлено в remote-режим, або в пошкодженій конфігурації бракує позначки local-режиму |
| `unauthorized` during connect                                  | Невідповідність автентифікації між клієнтом і Gateway                           |

Для повних діагностичних послідовностей використовуйте [Усунення несправностей Gateway](/uk/gateway/troubleshooting).

## Гарантії безпеки

- Клієнти протоколу Gateway швидко завершуються з помилкою, коли Gateway недоступний (без неявного fallback до прямого каналу).
- Недійсні або не-connect перші кадри відхиляються й закриваються.
- Коректне завершення роботи надсилає подію `shutdown` перед закриттям сокета.

---

Пов’язане:

- [Усунення несправностей](/uk/gateway/troubleshooting)
- [Фоновий процес](/uk/gateway/background-process)
- [Конфігурація](/uk/gateway/configuration)
- [Стан справності](/uk/gateway/health)
- [Doctor](/uk/gateway/doctor)
- [Автентифікація](/uk/gateway/authentication)

## Пов’язане

- [Конфігурація](/uk/gateway/configuration)
- [Усунення несправностей Gateway](/uk/gateway/troubleshooting)
- [Віддалений доступ](/uk/gateway/remote)
- [Керування секретами](/uk/gateway/secrets)
