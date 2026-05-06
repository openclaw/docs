---
read_when:
    - Запуск або налагодження процесу Gateway
summary: Операційний посібник для служби Gateway, її життєвого циклу та експлуатації
title: Операційний посібник Gateway
x-i18n:
    generated_at: "2026-05-06T01:50:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4e62275a9619209a2f630d2911961441243d62a9141052f49a04f77201d70a8c
    source_path: gateway/index.md
    workflow: 16
---

Використовуйте цю сторінку для запуску служби Gateway у перший день і для операційної підтримки надалі.

<CardGroup cols={2}>
  <Card title="Поглиблене усунення несправностей" icon="siren" href="/uk/gateway/troubleshooting">
    Діагностика від симптомів із точними послідовностями команд і сигнатурами журналів.
  </Card>
  <Card title="Конфігурація" icon="sliders" href="/uk/gateway/configuration">
    Посібник із налаштування, орієнтований на завдання, і повний довідник конфігурації.
  </Card>
  <Card title="Керування секретами" icon="key-round" href="/uk/gateway/secrets">
    Контракт SecretRef, поведінка знімка під час виконання та операції migrate/reload.
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

  <Step title="Перевірте справність служби">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Справний базовий стан: `Runtime: running`, `Connectivity probe: ok` і `Capability: ...`, що відповідає вашим очікуванням. Використовуйте `openclaw gateway status --require-rpc`, коли потрібне підтвердження RPC з областю читання, а не лише доступність.

  </Step>

  <Step title="Перевірте готовність каналу">

```bash
openclaw channels status --probe
```

За доступного Gateway це виконує live-перевірки каналів для кожного облікового запису й необов’язкові аудити.
Якщо Gateway недоступний, CLI натомість повертається до зведень каналів лише з конфігурації
замість виводу live-перевірки.

  </Step>
</Steps>

<Note>
Перезавантаження конфігурації Gateway відстежує активний шлях до файлу конфігурації (визначений зі стандартних значень профілю/стану або з `OPENCLAW_CONFIG_PATH`, якщо задано).
Стандартний режим: `gateway.reload.mode="hybrid"`.
Після першого успішного завантаження запущений процес обслуговує активний знімок конфігурації в пам’яті; успішне перезавантаження атомарно замінює цей знімок.
</Note>

## Модель виконання

- Один постійно запущений процес для маршрутизації, control plane і підключень каналів.
- Один мультиплексований порт для:
  - WebSocket control/RPC
  - HTTP API, сумісні з OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Control UI і хуки
- Стандартний режим прив’язки: `loopback`.
- Автентифікація потрібна за замовчуванням. Налаштування зі спільним секретом використовують
  `gateway.auth.token` / `gateway.auth.password` (або
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), а reverse-proxy налаштування не через loopback
  можуть використовувати `gateway.auth.mode: "trusted-proxy"`.

## Сумісні з OpenAI кінцеві точки

Найцінніша поверхня сумісності OpenClaw тепер така:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Чому цей набір важливий:

- Більшість інтеграцій Open WebUI, LobeChat і LibreChat спочатку перевіряють `/v1/models`.
- Багато RAG- і memory-конвеєрів очікують `/v1/embeddings`.
- Клієнти, нативні для агентів, дедалі частіше віддають перевагу `/v1/responses`.

Примітка щодо планування:

- `/v1/models` орієнтовано передусім на агентів: він повертає `openclaw`, `openclaw/default` і `openclaw/<agentId>`.
- `openclaw/default` — це стабільний псевдонім, який завжди відповідає налаштованому стандартному агенту.
- Використовуйте `x-openclaw-model`, коли потрібне перевизначення бекенд-провайдера/моделі; інакше керування залишається за звичайною моделлю й embedding-налаштуванням вибраного агента.

Усе це працює на головному порту Gateway і використовує ту саму межу автентифікації довіреного оператора, що й решта HTTP API Gateway.

### Пріоритет порту та прив’язки

| Налаштування | Порядок визначення                                           |
| ------------ | ------------------------------------------------------------- |
| Порт Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Режим прив’язки | CLI/override → `gateway.bind` → `loopback`                    |

Встановлені служби Gateway записують визначений `--port` у метадані супервізора. Після зміни `gateway.port` виконайте `openclaw doctor --fix` або `openclaw gateway install --force`, щоб launchd/systemd/schtasks запускав процес на новому порту.

Під час запуску Gateway використовує той самий ефективний порт і прив’язку, коли заповнює локальні
джерела Control UI для прив’язок не через loopback. Наприклад, `--bind lan --port 3000`
додає `http://localhost:3000` і `http://127.0.0.1:3000` до того, як виконується
перевірка під час виконання. Явно додайте всі віддалені джерела браузера, наприклад HTTPS proxy URL, до
`gateway.controlUi.allowedOrigins`.

### Режими гарячого перезавантаження

| `gateway.reload.mode` | Поведінка                                  |
| --------------------- | ------------------------------------------ |
| `off`                 | Без перезавантаження конфігурації          |
| `hot`                 | Застосовувати лише hot-safe зміни          |
| `restart`             | Перезапускати за змін, що потребують перезапуску |
| `hybrid` (стандартно) | Hot-застосування, коли безпечно, перезапуск, коли потрібно |

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

## Кілька Gateway (на одному хості)

Більшість інсталяцій мають запускати один gateway на машину. Один gateway може обслуговувати кількох
агентів і каналів.

Кілька gateway потрібні лише тоді, коли ви свідомо хочете ізоляцію або резервного бота.

Корисні перевірки:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Очікувана поведінка:

- `gateway status --deep` може повідомити `Other gateway-like services detected (best effort)`
  і надрукувати підказки з очищення, коли застарілі інсталяції launchd/systemd/schtasks ще залишаються.
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

Детальне налаштування: [/gateway/multiple-gateways](/uk/gateway/multiple-gateways).

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
запит все одно має задовольняти цей шлях автентифікації.
</Warning>

Див.: [Віддалений Gateway](/uk/gateway/remote), [Автентифікація](/uk/gateway/authentication), [Tailscale](/uk/gateway/tailscale).

## Нагляд і життєвий цикл служби

Використовуйте supervised-запуски для надійності, подібної до production.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Використовуйте `openclaw gateway restart` для перезапусків. Не поєднуйте `openclaw gateway stop` і `openclaw gateway start`; на macOS `gateway stop` навмисно вимикає LaunchAgent перед його зупинкою.

Мітки LaunchAgent: `ai.openclaw.gateway` (стандартно) або `ai.openclaw.<profile>` (іменований профіль). `openclaw doctor` аудитує та виправляє дрейф конфігурації служби.

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Для збереження після виходу із системи увімкніть lingering:

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
(або `OpenClaw Gateway (<profile>)` для іменованих профілів). Якщо створення Scheduled Task
заборонено, OpenClaw повертається до launcher у Startup-folder для кожного користувача,
який вказує на `gateway.cmd` усередині каталогу стану.

  </Tab>

  <Tab title="Linux (system service)">

Використовуйте system unit для багато-користувацьких/постійно ввімкнених хостів.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Використовуйте той самий body служби, що й для user unit, але встановіть його в
`/etc/systemd/system/openclaw-gateway[-<profile>].service` і налаштуйте
`ExecStart=`, якщо ваш бінарний файл `openclaw` розташований деінде.

Не дозволяйте також `openclaw doctor --fix` установлювати gateway-службу рівня користувача для того самого профілю/порту. Doctor відмовляється від такої автоматичної інсталяції, коли знаходить system-level службу OpenClaw gateway; використовуйте `OPENCLAW_SERVICE_REPAIR_POLICY=external`, коли system unit керує життєвим циклом.

  </Tab>
</Tabs>

## Швидкий шлях для dev-профілю

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Стандартні значення включають ізольований стан/конфігурацію та базовий порт Gateway `19001`.

## Короткий довідник протоколу (погляд оператора)

- Першим кадром клієнта має бути `connect`.
- Gateway повертає знімок `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, limits/policy).
- `hello-ok.features.methods` / `events` — це консервативний список для виявлення, а не
  згенерований дамп кожного доступного маршруту helper.
- Запити: `req(method, params)` → `res(ok/payload|error)`.
- Поширені події включають `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, події життєвого циклу pairing/approval і `shutdown`.

Запуски агентів двоетапні:

1. Негайне підтвердження прийняття (`status:"accepted"`)
2. Фінальна відповідь завершення (`status:"ok"|"error"`) зі streamed-подіями `agent` між ними.

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

## Поширені сигнатури збоїв

| Сигнатура                                                      | Імовірна проблема                                                              |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | Прив’язка не через loopback без дійсного шляху автентифікації gateway          |
| `another gateway instance is already listening` / `EADDRINUSE` | Конфлікт портів                                                                 |
| `Gateway start blocked: set gateway.mode=local`                | Конфігурацію встановлено в remote-режим або stamp local-mode відсутній у пошкодженій конфігурації |
| `unauthorized` during connect                                  | Невідповідність автентифікації між клієнтом і gateway                          |

Для повних діагностичних послідовностей використовуйте [Усунення несправностей Gateway](/uk/gateway/troubleshooting).

## Гарантії безпеки

- Клієнти протоколу Gateway швидко завершуються з помилкою, коли Gateway недоступний (без неявного резервного переходу на прямий канал).
- Недійсні перші фрейми або перші фрейми, що не є фреймами підключення, відхиляються та закриваються.
- Коректне завершення роботи надсилає подію `shutdown` перед закриттям сокета.

---

Пов’язане:

- [Усунення несправностей](/uk/gateway/troubleshooting)
- [Фоновий процес](/uk/gateway/background-process)
- [Конфігурація](/uk/gateway/configuration)
- [Стан](/uk/gateway/health)
- [Doctor](/uk/gateway/doctor)
- [Автентифікація](/uk/gateway/authentication)

## Пов’язане

- [Конфігурація](/uk/gateway/configuration)
- [Усунення несправностей Gateway](/uk/gateway/troubleshooting)
- [Віддалений доступ](/uk/gateway/remote)
- [Керування секретами](/uk/gateway/secrets)
