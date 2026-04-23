---
read_when:
    - Запуск або налагодження процесу Gateway
summary: Runbook для сервісу Gateway, життєвого циклу та операцій
title: Runbook Gateway
x-i18n:
    generated_at: "2026-04-23T20:53:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1828c4cc57a145f0888292cd31b93c6de57e518cc6e3c5ecf1d63d4567dc78a2
    source_path: gateway/index.md
    workflow: 15
---

Використовуйте цю сторінку для запуску Gateway у перший день і для операцій другого дня з сервісом Gateway.

<CardGroup cols={2}>
  <Card title="Глибоке усунення несправностей" icon="siren" href="/uk/gateway/troubleshooting">
    Діагностика від симптому з точними послідовностями команд і сигнатурами логів.
  </Card>
  <Card title="Налаштування" icon="sliders" href="/uk/gateway/configuration">
    Практичний посібник із налаштування + повний довідник конфігурації.
  </Card>
  <Card title="Керування секретами" icon="key-round" href="/uk/gateway/secrets">
    Контракт SecretRef, поведінка snapshot у runtime та операції migrate/reload.
  </Card>
  <Card title="Контракт плану секретів" icon="shield-check" href="/uk/gateway/secrets-plan-contract">
    Точні правила target/path для `secrets apply` і поведінка auth-profile лише через ref.
  </Card>
</CardGroup>

## Локальний запуск за 5 хвилин

<Steps>
  <Step title="Запустіть Gateway">

```bash
openclaw gateway --port 18789
# debug/trace дублюються в stdio
openclaw gateway --port 18789 --verbose
# примусово завершити listener на вибраному порту, потім запустити
openclaw gateway --force
```

  </Step>

  <Step title="Перевірте стан сервісу">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Здорова базова лінія: `Runtime: running`, `Connectivity probe: ok` і `Capability: ...`, що відповідає тому, чого ви очікуєте. Використовуйте `openclaw gateway status --require-rpc`, коли вам потрібен доказ RPC із read-scope, а не лише досяжність.

  </Step>

  <Step title="Перевірте готовність каналів">

```bash
openclaw channels status --probe
```

За наявності досяжного Gateway ця команда виконує живі поканальні перевірки per-account і необов’язкові аудити.
Якщо Gateway недосяжний, CLI використовує fallback до підсумків каналів лише з конфігурації замість
живого виводу probe.

  </Step>
</Steps>

<Note>
Перезавантаження конфігурації Gateway відстежує активний шлях до файлу конфігурації (розв’язаний з типових значень profile/state або `OPENCLAW_CONFIG_PATH`, якщо задано).
Типовий режим — `gateway.reload.mode="hybrid"`.
Після першого успішного завантаження запущений процес обслуговує активний snapshot конфігурації в пам’яті; успішне перезавантаження атомарно замінює цей snapshot.
</Note>

## Модель runtime

- Один постійно запущений процес для маршрутизації, control plane і підключень каналів.
- Єдиний мультиплексований порт для:
  - WebSocket control/RPC
  - HTTP API, сумісні з OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Control UI і hooks
- Типовий режим bind: `loopback`.
- Автентифікація типово обов’язкова. Схеми зі спільним секретом використовують
  `gateway.auth.token` / `gateway.auth.password` (або
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), а для non-loopback
  схем із reverse proxy можна використовувати `gateway.auth.mode: "trusted-proxy"`.

## Endpoint-и, сумісні з OpenAI

Найцінніша поверхня сумісності OpenClaw зараз:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Чому цей набір важливий:

- Більшість інтеграцій Open WebUI, LobeChat і LibreChat спочатку перевіряють `/v1/models`.
- Багато pipeline для RAG і пам’яті очікують `/v1/embeddings`.
- Клієнти з agent-native дедалі частіше віддають перевагу `/v1/responses`.

Примітка щодо планування:

- `/v1/models` орієнтований на агентів: він повертає `openclaw`, `openclaw/default` і `openclaw/<agentId>`.
- `openclaw/default` — це стабільний псевдонім, який завжди вказує на налаштованого типового агента.
- Використовуйте `x-openclaw-model`, якщо хочете override для backend provider/model; інакше продовжує діяти звичайне налаштування моделі та embeddings вибраного агента.

Усе це працює на головному порту Gateway і використовує ту саму межу довіреної автентифікації оператора, що й решта HTTP API Gateway.

### Пріоритет порту й bind

| Setting      | Resolution order                                              |
| ------------ | ------------------------------------------------------------- |
| Порт Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Режим bind   | CLI/override → `gateway.bind` → `loopback`                    |

### Режими гарячого перезавантаження

| `gateway.reload.mode` | Behavior                                                |
| --------------------- | ------------------------------------------------------- |
| `off`                 | Без перезавантаження конфігурації                       |
| `hot`                 | Застосовувати лише зміни, безпечні для hot-reload       |
| `restart`             | Перезапускати при змінах, що потребують reload          |
| `hybrid` (типово)     | Застосовувати hot, коли безпечно, і перезапускати за потреби |

## Набір команд оператора

```bash
openclaw gateway status
openclaw gateway status --deep   # додає системне сканування сервісів
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` призначено для додаткового виявлення сервісів (LaunchDaemons/systemd system
units/schtasks), а не для глибшої перевірки стану RPC.

## Кілька Gateway (на одному хості)

У більшості встановлень слід запускати один Gateway на машину. Один Gateway може обслуговувати кількох
агентів і канали.

Кілька Gateway потрібні лише тоді, коли вам навмисно потрібна ізоляція або резервний бот.

Корисні перевірки:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Що очікувати:

- `gateway status --deep` може повідомляти `Other gateway-like services detected (best effort)`
  і виводити підказки з очищення, коли все ще існують застарілі встановлення launchd/systemd/schtasks.
- `gateway probe` може попереджати про `multiple reachable gateways`, коли відповідає
  більше однієї цілі.
- Якщо це навмисно, ізолюйте порти, config/state і корені workspace для кожного Gateway.

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

Докладне налаштування: [/gateway/multiple-gateways](/uk/gateway/multiple-gateways).

## Віддалений доступ

Бажано: Tailscale/VPN.
Fallback: SSH-тунель.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Потім підключайте клієнти локально до `ws://127.0.0.1:18789`.

<Warning>
SSH-тунелі не обходять автентифікацію Gateway. Для автентифікації зі спільним секретом клієнти все одно
мають надсилати `token`/`password` навіть через тунель. Для режимів з ідентичністю
запит усе одно має задовольняти цей шлях автентифікації.
</Warning>

Див.: [Remote Gateway](/uk/gateway/remote), [Автентифікація](/uk/gateway/authentication), [Tailscale](/uk/gateway/tailscale).

## Нагляд і життєвий цикл сервісу

Для надійності на рівні production використовуйте запуск під наглядом.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Мітки LaunchAgent: `ai.openclaw.gateway` (типово) або `ai.openclaw.<profile>` (іменований profile). `openclaw doctor` перевіряє й виправляє дрейф конфігурації сервісу.

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Щоб сервіс зберігався після виходу з системи, увімкніть lingering:

```bash
sudo loginctl enable-linger <user>
```

Приклад ручного user-unit, коли вам потрібен власний шлях встановлення:

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

Керований автозапуск у нативному Windows використовує Scheduled Task з назвою `OpenClaw Gateway`
(або `OpenClaw Gateway (<profile>)` для іменованих profile). Якщо створення Scheduled Task
заборонено, OpenClaw використовує fallback до per-user launcher у папці Startup, який вказує на `gateway.cmd` у каталозі стану.

  </Tab>

  <Tab title="Linux (system service)">

Використовуйте system unit для багатокористувацьких/постійно ввімкнених хостів.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Використовуйте те саме тіло сервісу, що й для user unit, але встановіть його в
`/etc/systemd/system/openclaw-gateway[-<profile>].service` і скоригуйте
`ExecStart=`, якщо ваш binary `openclaw` розташований в іншому місці.

  </Tab>
</Tabs>

## Швидкий шлях для dev profile

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Типові значення включають ізольований state/config і базовий порт Gateway `19001`.

## Короткий довідник протоколу (погляд оператора)

- Першим фреймом клієнта має бути `connect`.
- Gateway повертає snapshot `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, limits/policy).
- `hello-ok.features.methods` / `events` — це консервативний список для discovery, а не
  згенерований дамп кожного викликаного helper-route.
- Запити: `req(method, params)` → `res(ok/payload|error)`.
- Типові події: `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, події життєвого циклу pairing/approval і `shutdown`.

Запуски агентів мають два етапи:

1. Негайне підтвердження прийняття (`status:"accepted"`)
2. Фінальна відповідь завершення (`status:"ok"|"error"`), із потоковими подіями `agent` між ними.

Див. повну документацію протоколу: [Протокол Gateway](/uk/gateway/protocol).

## Операційні перевірки

### Liveness

- Відкрийте WS і надішліть `connect`.
- Очікуйте відповідь `hello-ok` зі snapshot.

### Readiness

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Відновлення після пропусків

Події не відтворюються повторно. Якщо є пропуски в послідовності, оновіть стан (`health`, `system-presence`) перед продовженням.

## Типові сигнатури збоїв

| Signature                                                      | Likely issue                                                                    |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | Non-loopback bind без валідного шляху автентифікації Gateway                    |
| `another gateway instance is already listening` / `EADDRINUSE` | Конфлікт порту                                                                  |
| `Gateway start blocked: set gateway.mode=local`                | У конфігурації задано remote mode, або в пошкодженій конфігурації бракує позначки local-mode |
| `unauthorized` during connect                                  | Невідповідність автентифікації між клієнтом і Gateway                           |

Для повних послідовностей діагностики використовуйте [Усунення несправностей Gateway](/uk/gateway/troubleshooting).

## Гарантії безпеки

- Клієнти протоколу Gateway завершуються помилкою одразу, коли Gateway недоступний (без неявного fallback напряму до каналу).
- Невалідні або не-`connect` перші фрейми відхиляються, а з’єднання закривається.
- Коректне завершення роботи надсилає подію `shutdown` перед закриттям сокета.

---

Пов’язане:

- [Усунення несправностей](/uk/gateway/troubleshooting)
- [Фоновий процес](/uk/gateway/background-process)
- [Налаштування](/uk/gateway/configuration)
- [Health](/uk/gateway/health)
- [Doctor](/uk/gateway/doctor)
- [Автентифікація](/uk/gateway/authentication)
