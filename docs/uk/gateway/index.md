---
read_when:
    - Запуск або налагодження процесу gateway
summary: Операційний посібник для служби Gateway, її життєвого циклу та експлуатації
title: Операційний посібник Gateway
x-i18n:
    generated_at: "2026-04-06T15:28:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: fd2c21036e88612861ef2195b8ff7205aca31386bb11558614ade8d1a54fdebd
    source_path: gateway/index.md
    workflow: 15
---

# Операційний посібник Gateway

Використовуйте цю сторінку для запуску Gateway у перший день і для операційної роботи надалі.

<CardGroup cols={2}>
  <Card title="Поглиблене усунення неполадок" icon="siren" href="/uk/gateway/troubleshooting">
    Діагностика за симптомами з точними послідовностями команд і сигнатурами журналів.
  </Card>
  <Card title="Configuration" icon="sliders" href="/uk/gateway/configuration">
    Практичний посібник із налаштування + повний довідник конфігурації.
  </Card>
  <Card title="Керування секретами" icon="key-round" href="/uk/gateway/secrets">
    Контракт SecretRef, поведінка знімків під час виконання та операції міграції/перезавантаження.
  </Card>
  <Card title="Контракт плану секретів" icon="shield-check" href="/uk/gateway/secrets-plan-contract">
    Точні правила target/path для `secrets apply` і поведінка профілю автентифікації лише з посиланнями.
  </Card>
</CardGroup>

## Локальний запуск за 5 хвилин

<Steps>
  <Step title="Запустіть Gateway">

```bash
openclaw gateway --port 18789
# debug/trace дзеркально виводяться у stdio
openclaw gateway --port 18789 --verbose
# примусово завершує процес, що слухає вибраний порт, а потім запускає
openclaw gateway --force
```

  </Step>

  <Step title="Перевірте стан служби">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Базовий справний стан: `Runtime: running` і `RPC probe: ok`.

  </Step>

  <Step title="Перевірте готовність каналів">

```bash
openclaw channels status --probe
```

За доступного gateway ця команда виконує живі перевірки каналів для кожного облікового запису та необов’язкові аудити.
Якщо gateway недоступний, CLI повертається до зведень каналів лише за конфігурацією
замість виводу живих probe-перевірок.

  </Step>
</Steps>

<Note>
Перезавантаження конфігурації Gateway відстежує активний шлях до файла конфігурації (визначений із типових значень профілю/стану або через `OPENCLAW_CONFIG_PATH`, якщо його задано).
Типовий режим — `gateway.reload.mode="hybrid"`.
Після першого успішного завантаження запущений процес обслуговує активний знімок конфігурації в пам’яті; успішне перезавантаження атомарно підміняє цей знімок.
</Note>

## Модель виконання

- Один постійно активний процес для маршрутизації, control plane та підключень каналів.
- Один мультиплексований порт для:
  - контролю WebSocket/RPC
  - HTTP API, сумісних з OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Control UI та hooks
- Типовий режим прив’язки: `loopback`.
- Автентифікація за замовчуванням обов’язкова. Налаштування зі спільним секретом використовують
  `gateway.auth.token` / `gateway.auth.password` (або
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), а конфігурації
  reverse proxy поза loopback можуть використовувати `gateway.auth.mode: "trusted-proxy"`.

## Кінцеві точки, сумісні з OpenAI

Найважливіша поверхня сумісності OpenClaw тепер така:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Чому цей набір важливий:

- Більшість інтеграцій Open WebUI, LobeChat і LibreChat спочатку перевіряють `/v1/models`.
- Багато конвеєрів RAG і пам’яті очікують `/v1/embeddings`.
- Клієнти, орієнтовані на агентів, дедалі частіше надають перевагу `/v1/responses`.

Примітка щодо планування:

- `/v1/models` орієнтований насамперед на агентів: він повертає `openclaw`, `openclaw/default` і `openclaw/<agentId>`.
- `openclaw/default` — це стабільний псевдонім, який завжди вказує на налаштованого агента за замовчуванням.
- Використовуйте `x-openclaw-model`, якщо вам потрібно перевизначити постачальника/модель бекенда; інакше вибраний агент і надалі керуватиме звичайним налаштуванням моделі та вбудовувань.

Усе це працює на основному порту Gateway і використовує той самий довірений периметр автентифікації оператора, що й решта HTTP API Gateway.

### Пріоритет порту та режиму прив’язки

| Параметр | Порядок визначення |
| -------- | ------------------ |
| Порт Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Режим прив’язки | CLI/override → `gateway.bind` → `loopback` |

### Режими гарячого перезавантаження

| `gateway.reload.mode` | Поведінка |
| --------------------- | --------- |
| `off`                 | Без перезавантаження конфігурації |
| `hot`                 | Застосовує лише зміни, безпечні для hot-reload |
| `restart`             | Перезапускає за змін, що вимагають перезапуску |
| `hybrid` (типово)     | Гаряче застосовує, коли безпечно, і перезапускає, коли потрібно |

## Набір команд оператора

```bash
openclaw gateway status
openclaw gateway status --deep   # додає сканування служби на рівні системи
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` призначено для додаткового виявлення служб (LaunchDaemons/systemd system
units/schtasks), а не для глибшої RPC-перевірки стану.

## Кілька gateway на одному хості

У більшості встановлень має працювати один gateway на машину. Один gateway може обслуговувати кількох
агентів і канали.

Кілька gateway потрібні лише тоді, коли вам навмисно потрібна ізоляція або резервний бот.

Корисні перевірки:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Що очікувати:

- `gateway status --deep` може повідомити `Other gateway-like services detected (best effort)`
  і вивести підказки з очищення, якщо навколо лишилися застарілі встановлення launchd/systemd/schtasks.
- `gateway probe` може попередити про `multiple reachable gateways`, коли відповідає
  більше однієї цілі.
- Якщо це навмисно, ізолюйте порти, config/state і корені workspace для кожного gateway окремо.

Детальне налаштування: [/gateway/multiple-gateways](/uk/gateway/multiple-gateways).

## Віддалений доступ

Рекомендовано: Tailscale/VPN.
Резервний варіант: SSH-тунель.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Потім підключайте клієнти локально до `ws://127.0.0.1:18789`.

<Warning>
SSH-тунелі не обходять автентифікацію gateway. Для автентифікації зі спільним секретом клієнти все одно
мають надсилати `token`/`password` навіть через тунель. Для режимів з ідентифікацією
запит усе одно має задовольняти цей шлях автентифікації.
</Warning>

Див.: [Remote Gateway](/uk/gateway/remote), [Authentication](/uk/gateway/authentication), [Tailscale](/uk/gateway/tailscale).

## Нагляд і життєвий цикл служби

Для надійності на рівні production використовуйте запуск під наглядом.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Мітки LaunchAgent: `ai.openclaw.gateway` (типово) або `ai.openclaw.<profile>` (іменований профіль). `openclaw doctor` перевіряє і виправляє дрейф конфігурації служби.

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Щоб служба лишалася активною після виходу з сеансу, увімкніть lingering:

```bash
sudo loginctl enable-linger <user>
```

Приклад user-unit вручну, коли потрібен власний шлях встановлення:

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

Керований нативний автозапуск у Windows використовує Scheduled Task з назвою `OpenClaw Gateway`
(або `OpenClaw Gateway (<profile>)` для іменованих профілів). Якщо створення Scheduled Task
заборонено, OpenClaw переходить до launcher у Startup-folder для поточного користувача,
який вказує на `gateway.cmd` у каталозі стану.

  </Tab>

  <Tab title="Linux (system service)">

Використовуйте системний unit для багатокористувацьких/постійно активних хостів.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Використовуйте той самий вміст служби, що й для user unit, але встановіть його в
`/etc/systemd/system/openclaw-gateway[-<profile>].service` і скоригуйте
`ExecStart=`, якщо ваш бінарний файл `openclaw` розташований в іншому місці.

  </Tab>
</Tabs>

## Кілька gateway на одному хості

У більшості конфігурацій має працювати **один** Gateway.
Використовуйте кілька лише для суворої ізоляції/резервування (наприклад, профіль відновлення).

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

Див.: [Multiple gateways](/uk/gateway/multiple-gateways).

### Швидкий шлях для dev-профілю

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Типові значення включають ізольовані state/config і базовий порт gateway `19001`.

## Коротка довідка з протоколу (погляд оператора)

- Перший кадр клієнта має бути `connect`.
- Gateway повертає знімок `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, limits/policy).
- `hello-ok.features.methods` / `events` — це консервативний список виявлення, а не
  згенерований дамп усіх доступних маршрутів helper.
- Запити: `req(method, params)` → `res(ok/payload|error)`.
- До поширених подій належать `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, події життєвого циклу pairing/approval і `shutdown`.

Запуски агентів складаються з двох етапів:

1. Негайне підтвердження прийняття (`status:"accepted"`)
2. Остаточна відповідь завершення (`status:"ok"|"error"`), із потоковими подіями `agent` між ними.

Повну документацію з протоколу див.: [Gateway Protocol](/uk/gateway/protocol).

## Операційні перевірки

### Перевірка доступності

- Відкрийте WS і надішліть `connect`.
- Очікуйте відповідь `hello-ok` зі знімком.

### Перевірка готовності

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Відновлення після пропусків

Події не відтворюються повторно. За пропусків у послідовності оновіть стан (`health`, `system-presence`), перш ніж продовжувати.

## Типові сигнатури збоїв

| Сигнатура | Імовірна проблема |
| --------- | ----------------- |
| `refusing to bind gateway ... without auth` | Прив’язка не до loopback без дійсного шляху автентифікації gateway |
| `another gateway instance is already listening` / `EADDRINUSE` | Конфлікт порту |
| `Gateway start blocked: set gateway.mode=local` | У конфігурації встановлено remote mode або в пошкодженій конфігурації відсутній штамп local-mode |
| `unauthorized` during connect | Невідповідність автентифікації між клієнтом і gateway |

Щоб отримати повні послідовності діагностики, скористайтеся [Gateway Troubleshooting](/uk/gateway/troubleshooting).

## Гарантії безпеки

- Клієнти протоколу Gateway швидко завершуються з помилкою, коли Gateway недоступний (без неявного fallback на прямий канал).
- Некоректні перші кадри або кадри не типу `connect` відхиляються, і з’єднання закривається.
- Коректне завершення роботи надсилає подію `shutdown` перед закриттям сокета.

---

Пов’язані сторінки:

- [Troubleshooting](/uk/gateway/troubleshooting)
- [Background Process](/uk/gateway/background-process)
- [Configuration](/uk/gateway/configuration)
- [Health](/uk/gateway/health)
- [Doctor](/uk/gateway/doctor)
- [Authentication](/uk/gateway/authentication)
