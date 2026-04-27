---
read_when:
    - Запуск або налагодження процесу gateway
summary: Посібник з експлуатації для служби Gateway, життєвого циклу та операцій
title: Посібник з експлуатації Gateway
x-i18n:
    generated_at: "2026-04-27T14:18:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 14f3d288c426848bc176291ff084a2b63b00e81739cd02f31fdf517d230d8111
    source_path: gateway/index.md
    workflow: 15
---

Використовуйте цю сторінку для запуску в перший день і операцій на другий день для служби Gateway.

<CardGroup cols={2}>
  <Card title="Глибоке усунення несправностей" icon="siren" href="/uk/gateway/troubleshooting">
    Діагностика, що починається із симптомів, із точними послідовностями команд і сигнатурами логів.
  </Card>
  <Card title="Конфігурація" icon="sliders" href="/uk/gateway/configuration">
    Практичний посібник із налаштування + повний довідник із конфігурації.
  </Card>
  <Card title="Керування секретами" icon="key-round" href="/uk/gateway/secrets">
    Контракт SecretRef, поведінка знімка під час виконання та операції міграції/перезавантаження.
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
# debug/trace дублюються в stdio
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

Базовий стан справної роботи: `Runtime: running`, `Connectivity probe: ok` і `Capability: ...`, що відповідає вашим очікуванням. Використовуйте `openclaw gateway status --require-rpc`, коли вам потрібне підтвердження RPC із правами читання, а не лише досяжність.

  </Step>

  <Step title="Перевірте готовність каналів">

```bash
openclaw channels status --probe
```

За наявності доступного gateway це запускає живі перевірки каналів для кожного облікового запису та необов’язкові аудити.
Якщо gateway недоступний, CLI повертається до зведень каналів лише за конфігурацією
замість виводу живих перевірок.

  </Step>
</Steps>

<Note>
Перезавантаження конфігурації Gateway відстежує шлях до активного файла конфігурації (визначений із типових значень profile/state або `OPENCLAW_CONFIG_PATH`, якщо його задано).
Типовий режим — `gateway.reload.mode="hybrid"`.
Після першого успішного завантаження процес, що виконується, обслуговує активний знімок конфігурації в пам’яті; успішне перезавантаження атомарно замінює цей знімок.
</Note>

## Модель виконання

- Один постійно запущений процес для маршрутизації, control plane і підключень каналів.
- Один мультиплексований порт для:
  - керування/RPC через WebSocket
  - HTTP API, сумісних з OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Control UI і хуків
- Типовий режим прив’язки: `loopback`.
- Автентифікація за замовчуванням обов’язкова. Налаштування зі спільним секретом використовують
  `gateway.auth.token` / `gateway.auth.password` (або
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), а для конфігурацій
  зі зворотним проксі не в режимі loopback можна використовувати `gateway.auth.mode: "trusted-proxy"`.

## Кінцеві точки, сумісні з OpenAI

Найцінніша поверхня сумісності OpenClaw зараз така:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Чому цей набір важливий:

- Більшість інтеграцій Open WebUI, LobeChat і LibreChat спочатку звертаються до `/v1/models`.
- Багато конвеєрів RAG і пам’яті очікують `/v1/embeddings`.
- Клієнти, орієнтовані на агентів, дедалі частіше віддають перевагу `/v1/responses`.

Примітка для планування:

- `/v1/models` орієнтований на агентів: він повертає `openclaw`, `openclaw/default` і `openclaw/<agentId>`.
- `openclaw/default` — це стабільний псевдонім, який завжди вказує на налаштованого агента за замовчуванням.
- Використовуйте `x-openclaw-model`, коли потрібне перевизначення backend-провайдера/моделі; інакше керування зберігають звичайна модель і конфігурація embedding вибраного агента.

Усе це працює на основному порту Gateway і використовує ту саму межу автентифікації довіреного оператора, що й решта HTTP API Gateway.

### Пріоритет порту та режиму прив’язки

| Параметр     | Порядок визначення                                             |
| ------------ | -------------------------------------------------------------- |
| Порт Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Режим прив’язки | CLI/override → `gateway.bind` → `loopback`                  |

Установлені служби gateway записують визначений `--port` у метадані супервізора. Після зміни `gateway.port` виконайте `openclaw doctor --fix` або `openclaw gateway install --force`, щоб launchd/systemd/schtasks запускали процес на новому порту.

Під час запуску Gateway використовуються ті самі фактичні порт і прив’язка, коли він ініціалізує локальні
Control UI origins для прив’язок не в режимі loopback. Наприклад, `--bind lan --port 3000`
ініціалізує `http://localhost:3000` і `http://127.0.0.1:3000` до того, як почнеться
перевірка під час виконання. Явно додайте будь-які origin віддаленого браузера, наприклад URL HTTPS-проксі, до
`gateway.controlUi.allowedOrigins`.

### Режими гарячого перезавантаження

| `gateway.reload.mode` | Поведінка                                  |
| --------------------- | ------------------------------------------ |
| `off`                 | Без перезавантаження конфігурації          |
| `hot`                 | Застосовувати лише безпечні для hot зміни  |
| `restart`             | Перезапуск при змінах, що вимагають reload |
| `hybrid` (типово)     | Hot-застосування, коли безпечно, і перезапуск, коли потрібно |

## Набір команд оператора

```bash
openclaw gateway status
openclaw gateway status --deep   # додає перевірку служби на рівні системи
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` призначений для додаткового виявлення служб (LaunchDaemons/systemd system
units/schtasks), а не для глибшої перевірки стану RPC.

## Кілька gateway (на одному хості)

У більшості інсталяцій має працювати один gateway на машину. Один gateway може обслуговувати кількох
агентів і канали.

Кілька gateway потрібні лише тоді, коли вам навмисно потрібна ізоляція або rescue bot.

Корисні перевірки:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Що очікувати:

- `gateway status --deep` може повідомляти `Other gateway-like services detected (best effort)`
  і виводити підказки щодо очищення, якщо залишилися застарілі інсталяції launchd/systemd/schtasks.
- `gateway probe` може попереджати про `multiple reachable gateways`, коли відповідає
  більше ніж одна ціль.
- Якщо це навмисно, ізолюйте порти, config/state і корені робочих просторів для кожного gateway.

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

## Кінцева точка мозку реального часу VoiceClaw

OpenClaw надає сумісну з VoiceClaw кінцеву точку WebSocket реального часу за адресою
`/voiceclaw/realtime`. Використовуйте її, коли клієнт VoiceClaw для настільного комп’ютера має напряму
підключатися до мозку OpenClaw у реальному часі замість окремого relay-процесу.

Кінцева точка використовує Gemini Live для аудіо в реальному часі й викликає OpenClaw як
мозок, напряму надаючи інструменти OpenClaw для Gemini Live. Виклики інструментів повертають
негайний результат `working`, щоб голосовий хід залишався чутливим, після чого OpenClaw
асинхронно виконує фактичний інструмент і вставляє результат назад у
живу сесію. Задайте `GEMINI_API_KEY` у середовищі процесу gateway. Якщо
увімкнено автентифікацію gateway, клієнт для настільного комп’ютера надсилає токен або пароль gateway
у своєму першому повідомленні `session.config`.

Доступ до мозку реального часу виконує команди агента OpenClaw, авторизовані власником. Обмежуйте
`gateway.auth.mode: "none"` лише тестовими екземплярами в режимі тільки loopback. Для нелокальних
підключень до мозку реального часу потрібна автентифікація gateway.

Для ізольованого тестового gateway запустіть окремий екземпляр із власними портом, конфігурацією
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

Рекомендовано: Tailscale/VPN.
Запасний варіант: SSH-тунель.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Після цього підключайте клієнти локально до `ws://127.0.0.1:18789`.

<Warning>
SSH-тунелі не обходять автентифікацію gateway. Для автентифікації зі спільним секретом клієнти все одно
мають надсилати `token`/`password` навіть через тунель. Для режимів із ідентифікацією
запит усе одно має задовольняти цей шлях автентифікації.
</Warning>

Див.: [Remote Gateway](/uk/gateway/remote), [Authentication](/uk/gateway/authentication), [Tailscale](/uk/gateway/tailscale).

## Нагляд і життєвий цикл служби

Для надійності на рівні production використовуйте запуски під наглядом.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Для перезапусків використовуйте `openclaw gateway restart`. Не поєднуйте `openclaw gateway stop` і `openclaw gateway start`; у macOS `gateway stop` навмисно вимикає LaunchAgent перед його зупинкою.

Мітки LaunchAgent: `ai.openclaw.gateway` (типово) або `ai.openclaw.<profile>` (іменований profile). `openclaw doctor` перевіряє і виправляє дрейф конфігурації служби.

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

Приклад user unit вручну, коли потрібен власний шлях установлення:

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
заборонено, OpenClaw переходить до засобу запуску через Startup-folder для поточного користувача,
який вказує на `gateway.cmd` у каталозі state.

  </Tab>

  <Tab title="Linux (system service)">

Використовуйте system unit для багатокористувацьких/постійно увімкнених хостів.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Використовуйте той самий вміст служби, що й для user unit, але встановлюйте його в
`/etc/systemd/system/openclaw-gateway[-<profile>].service` і скоригуйте
`ExecStart=`, якщо ваш бінарний файл `openclaw` розташований в іншому місці.

Не дозволяйте також `openclaw doctor --fix` встановлювати службу gateway на рівні користувача для того самого profile/порту. Doctor відмовляється від такого автоматичного встановлення, коли знаходить системну службу gateway OpenClaw; використовуйте `OPENCLAW_SERVICE_REPAIR_POLICY=external`, коли життєвим циклом керує system unit.

  </Tab>
</Tabs>

## Швидкий шлях для dev profile

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Типові значення включають ізольовані state/config і базовий порт gateway `19001`.

## Короткий довідник протоколу (погляд оператора)

- Першим фреймом клієнта має бути `connect`.
- Gateway повертає знімок `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, limits/policy).
- `hello-ok.features.methods` / `events` — це консервативний список виявлення, а не
  згенерований дамп кожного допоміжного маршруту, який можна викликати.
- Запити: `req(method, params)` → `res(ok/payload|error)`.
- Типові події включають `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, події життєвого циклу pairing/approval і `shutdown`.

Запуски агента — двоетапні:

1. Негайне підтвердження прийняття (`status:"accepted"`)
2. Остаточна відповідь про завершення (`status:"ok"|"error"`), із потоковими подіями `agent` між ними.

Див. повну документацію протоколу: [Gateway Protocol](/uk/gateway/protocol).

## Операційні перевірки

### Доступність

- Відкрийте WS і надішліть `connect`.
- Очікуйте відповідь `hello-ok` зі знімком.

### Готовність

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Відновлення після розривів

Події не відтворюються повторно. Якщо є розриви в послідовності, оновіть стан (`health`, `system-presence`), перш ніж продовжувати.

## Типові сигнатури збоїв

| Signature                                                      | Ймовірна проблема                                                                |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | Прив’язка не в режимі loopback без дійсного шляху автентифікації gateway         |
| `another gateway instance is already listening` / `EADDRINUSE` | Конфлікт порту                                                                   |
| `Gateway start blocked: set gateway.mode=local`                | У конфігурації встановлено віддалений режим, або в пошкодженій конфігурації відсутній штамп локального режиму |
| `unauthorized` during connect                                  | Невідповідність автентифікації між клієнтом і gateway                            |

Для повних послідовностей діагностики використовуйте [Gateway Troubleshooting](/uk/gateway/troubleshooting).

## Гарантії безпеки

- Клієнти протоколу Gateway швидко завершуються з помилкою, коли Gateway недоступний (без неявного резервного переходу напряму до каналу).
- Недійсні перші фрейми або перші фрейми не `connect` відхиляються, а з’єднання закривається.
- Плавне завершення роботи надсилає подію `shutdown` перед закриттям сокета.

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
