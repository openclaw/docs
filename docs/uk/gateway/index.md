---
read_when:
    - Запуск або налагодження процесу Gateway
summary: Посібник із Gateway service, його життєвого циклу та операцій
title: Посібник із Gateway
x-i18n:
    generated_at: "2026-04-24T20:11:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1d82474bc6485cc14a0be74154e08ba54455031cdae37916de5bc615d3e01a4
    source_path: gateway/index.md
    workflow: 15
---

Використовуйте цю сторінку для старту в перший день і операцій другого дня для служби Gateway.

<CardGroup cols={2}>
  <Card title="Глибоке усунення несправностей" icon="siren" href="/uk/gateway/troubleshooting">
    Діагностика від симптомів із точними послідовностями команд і сигнатурами логів.
  </Card>
  <Card title="Конфігурація" icon="sliders" href="/uk/gateway/configuration">
    Посібник із налаштування, орієнтований на задачі, + повний довідник із конфігурації.
  </Card>
  <Card title="Керування секретами" icon="key-round" href="/uk/gateway/secrets">
    Контракт SecretRef, поведінка знімка часу виконання та операції міграції/перезавантаження.
  </Card>
  <Card title="Контракт плану секретів" icon="shield-check" href="/uk/gateway/secrets-plan-contract">
    Точні правила target/path для `secrets apply` і поведінка auth-profile лише з ref.
  </Card>
</CardGroup>

## 5-хвилинний локальний запуск

<Steps>
  <Step title="Запустіть Gateway">

```bash
openclaw gateway --port 18789
# debug/trace дублюються у stdio
openclaw gateway --port 18789 --verbose
# примусово завершує listener на вибраному порту, потім запускає
openclaw gateway --force
```

  </Step>

  <Step title="Перевірте стан служби">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Справна базова конфігурація: `Runtime: running`, `Connectivity probe: ok` і `Capability: ...`, що відповідає вашим очікуванням. Використовуйте `openclaw gateway status --require-rpc`, коли вам потрібне підтвердження RPC із read-scope, а не лише досяжність.

  </Step>

  <Step title="Перевірте готовність каналу">

```bash
openclaw channels status --probe
```

За наявності доступного Gateway це виконує живі перевірки каналів для кожного облікового запису та необов’язкові аудити.
Якщо Gateway недоступний, CLI повертається до зведень каналів лише на основі конфігурації
замість виводу живих перевірок.

  </Step>
</Steps>

<Note>
Перезавантаження конфігурації Gateway відстежує шлях до активного файлу конфігурації (визначений із типових значень профілю/стану або `OPENCLAW_CONFIG_PATH`, якщо задано).
Типовий режим — `gateway.reload.mode="hybrid"`.
Після першого успішного завантаження запущений процес обслуговує активний знімок конфігурації в пам’яті; успішне перезавантаження атомарно замінює цей знімок.
</Note>

## Модель часу виконання

- Один постійно активний процес для маршрутизації, control plane і підключень каналів.
- Один мультиплексований порт для:
  - WebSocket control/RPC
  - HTTP API, сумісних з OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Control UI і хуків
- Типовий режим прив’язки: `loopback`.
- Автентифікація типово обов’язкова. Конфігурації зі спільним секретом використовують
  `gateway.auth.token` / `gateway.auth.password` (або
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), а для не-loopback
  конфігурацій зі зворотним проксі можна використовувати `gateway.auth.mode: "trusted-proxy"`.

## Сумісні з OpenAI endpoint-и

Найцінніша поверхня сумісності OpenClaw зараз така:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Чому цей набір важливий:

- Більшість інтеграцій Open WebUI, LobeChat і LibreChat спочатку перевіряють `/v1/models`.
- Багато RAG- і memory-конвеєрів очікують `/v1/embeddings`.
- Клієнти, орієнтовані на агентів, дедалі частіше надають перевагу `/v1/responses`.

Примітка щодо планування:

- `/v1/models` орієнтований насамперед на агентів: він повертає `openclaw`, `openclaw/default` і `openclaw/<agentId>`.
- `openclaw/default` — це стабільний псевдонім, який завжди вказує на налаштованого типового агента.
- Використовуйте `x-openclaw-model`, коли вам потрібно перевизначити backend provider/model; інакше керування зберігають звичайна модель і налаштування embeddings вибраного агента.

Усе це працює на основному порту Gateway і використовує ту саму межу автентифікації довіреного оператора, що й решта HTTP API Gateway.

### Пріоритет порту та прив’язки

| Налаштування | Порядок визначення                                             |
| ------------ | -------------------------------------------------------------- |
| Порт Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Режим bind   | CLI/override → `gateway.bind` → `loopback`                    |

### Режими hot reload

| `gateway.reload.mode` | Поведінка                                  |
| --------------------- | ------------------------------------------ |
| `off`                 | Без перезавантаження конфігурації          |
| `hot`                 | Застосовує лише hot-safe зміни             |
| `restart`             | Перезапускає за змін, що вимагають reload  |
| `hybrid` (типово)     | Hot-apply, коли безпечно, restart за потреби |

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

`gateway status --deep` призначено для додаткового виявлення служб (системні
одиниці LaunchDaemons/systemd/schtasks), а не для глибшої перевірки стану RPC.

## Кілька Gateway (на одному хості)

У більшості інсталяцій слід запускати один Gateway на машину. Один Gateway може обслуговувати кілька
агентів і каналів.

Кілька Gateway потрібні лише тоді, коли вам навмисно потрібна ізоляція або rescue bot.

Корисні перевірки:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Чого очікувати:

- `gateway status --deep` може повідомити `Other gateway-like services detected (best effort)`
  і вивести підказки з очищення, якщо ще залишилися застарілі інсталяції launchd/systemd/schtasks.
- `gateway probe` може попереджати про `multiple reachable gateways`, коли відповідає
  більше ніж одна ціль.
- Якщо це навмисно, ізолюйте порти, config/state і корені workspace для кожного Gateway.

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

## Endpoint мозку реального часу VoiceClaw

OpenClaw надає сумісний із VoiceClaw endpoint WebSocket реального часу за адресою
`/voiceclaw/realtime`. Використовуйте його, коли клієнт VoiceClaw для настільних систем має напряму
підключатися до мозку OpenClaw реального часу замість проходження через окремий relay-
процес.

Endpoint використовує Gemini Live для аудіо реального часу та викликає OpenClaw як
мозок, безпосередньо надаючи інструменти OpenClaw для Gemini Live. Виклики інструментів повертають
негайний результат `working`, щоб зберігати чутливість голосового ходу, після чого OpenClaw
виконує фактичний інструмент асинхронно й повертає результат назад у
живу сесію. Установіть `GEMINI_API_KEY` у середовищі процесу Gateway. Якщо
автентифікацію Gateway увімкнено, клієнт для настільних систем надсилає токен або пароль Gateway
у своєму першому повідомленні `session.config`.

Доступ до мозку реального часу виконує команди агента OpenClaw, авторизовані власником. Залишайте
`gateway.auth.mode: "none"` лише для тестових екземплярів, доступних тільки через loopback. Для нелокальних
підключень до мозку реального часу потрібна автентифікація Gateway.

Для ізольованого тестового Gateway запустіть окремий екземпляр із власними портом, конфігурацією
та станом:

```bash
OPENCLAW_CONFIG_PATH=/path/to/openclaw-realtime/openclaw.json \
OPENCLAW_STATE_DIR=/path/to/openclaw-realtime/state \
OPENCLAW_SKIP_CHANNELS=1 \
GEMINI_API_KEY=... \
openclaw gateway --port 19789
```

Потім налаштуйте VoiceClaw на використання:

```text
ws://127.0.0.1:19789/voiceclaw/realtime
```

## Віддалений доступ

Бажано: Tailscale/VPN.
Резервний варіант: SSH-тунель.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Потім підключайте клієнтів локально до `ws://127.0.0.1:18789`.

<Warning>
SSH-тунелі не обходять автентифікацію Gateway. Для автентифікації зі спільним секретом клієнти все одно
мають надсилати `token`/`password` навіть через тунель. Для режимів, що несуть ідентичність,
запит усе одно має задовольняти цей шлях автентифікації.
</Warning>

Див.: [Remote Gateway](/uk/gateway/remote), [Authentication](/uk/gateway/authentication), [Tailscale](/uk/gateway/tailscale).

## Нагляд і життєвий цикл служби

Для надійності, подібної до production, використовуйте запуски під наглядом.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Мітки LaunchAgent: `ai.openclaw.gateway` (типово) або `ai.openclaw.<profile>` (іменований профіль). `openclaw doctor` перевіряє та виправляє розходження конфігурації служби.

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Для збереження після виходу з системи ввімкніть lingering:

```bash
sudo loginctl enable-linger <user>
```

Приклад ручної user-unit, коли потрібен власний шлях інсталяції:

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
(або `OpenClaw Gateway (<profile>)` для іменованих профілів). Якщо створення Scheduled Task
заборонено, OpenClaw перемикається на launcher у папці Startup для поточного користувача, який вказує на `gateway.cmd` у каталозі стану.

  </Tab>

  <Tab title="Linux (system service)">

Використовуйте системну одиницю для багатокористувацьких/постійно активних хостів.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Використовуйте те саме тіло служби, що й для user unit, але інсталюйте його в
`/etc/systemd/system/openclaw-gateway[-<profile>].service` і скоригуйте
`ExecStart=`, якщо ваш бінарний файл `openclaw` розташований в іншому місці.

  </Tab>
</Tabs>

## Швидкий шлях для dev profile

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Типові значення включають ізольований state/config і базовий порт Gateway `19001`.

## Короткий довідник з протоколу (погляд оператора)

- Першим кадром клієнта має бути `connect`.
- Gateway повертає знімок `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, limits/policy).
- `hello-ok.features.methods` / `events` — це консервативний список виявлення, а не
  згенерований дамп кожного доступного helper route.
- Запити: `req(method, params)` → `res(ok/payload|error)`.
- Типові події включають `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, події життєвого циклу pairing/approval і `shutdown`.

Запуски агентів — двоетапні:

1. Негайне підтвердження прийняття (`status:"accepted"`)
2. Остаточна відповідь про завершення (`status:"ok"|"error"`), зі streaming-подіями `agent` між ними.

Див. повну документацію протоколу: [Gateway Protocol](/uk/gateway/protocol).

## Операційні перевірки

### Живучість

- Відкрийте WS і надішліть `connect`.
- Очікуйте відповідь `hello-ok` зі знімком.

### Готовність

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Відновлення після пропусків

Події не відтворюються повторно. За пропусків у послідовності оновіть стан (`health`, `system-presence`), перш ніж продовжувати.

## Типові сигнатури збоїв

| Сигнатура                                                      | Ймовірна проблема                                                               |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | Прив’язка не-loopback без дійсного шляху автентифікації Gateway                 |
| `another gateway instance is already listening` / `EADDRINUSE` | Конфлікт порту                                                                  |
| `Gateway start blocked: set gateway.mode=local`                | У конфігурації встановлено віддалений режим або в пошкодженій конфігурації відсутній штамп локального режиму |
| `unauthorized` during connect                                  | Невідповідність автентифікації між клієнтом і Gateway                           |

Для повних послідовностей діагностики використовуйте [Gateway Troubleshooting](/uk/gateway/troubleshooting).

## Гарантії безпеки

- Клієнти протоколу Gateway швидко завершуються з помилкою, коли Gateway недоступний (без неявного fallback напряму до каналу).
- Некоректні перші кадри або перші кадри не `connect` відхиляються, а з’єднання закривається.
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
