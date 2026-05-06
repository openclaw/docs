---
read_when:
    - Запуск або усунення несправностей у віддалених розгортаннях Gateway
summary: Віддалений доступ за допомогою SSH-тунелів (Gateway WS) і tailnet-мереж
title: Віддалений доступ
x-i18n:
    generated_at: "2026-05-06T04:12:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: c6272f4ee9fa52091d461cd70be05ccf01c209c3b26fe98a71752f6ea86ea448
    source_path: gateway/remote.md
    workflow: 16
---

Цей репозиторій підтримує "remote over SSH", підтримуючи один Gateway (головний), запущений на виділеному хості (десктопі/сервері), і підключаючи до нього клієнтів.

- Для **операторів (вас / застосунку macOS)**: SSH-тунелювання є універсальним резервним варіантом.
- Для **nodes (iOS/Android і майбутніх пристроїв)**: підключайтеся до **WebSocket** Gateway (LAN/tailnet або SSH-тунель за потреби).

## Основна ідея

- WebSocket Gateway прив’язується до **loopback** на налаштованому вами порту (за замовчуванням 18789).
- Для віддаленого використання ви перенаправляєте цей loopback-порт через SSH (або використовуєте tailnet/VPN і менше тунелюєте).

## Поширені налаштування VPN і tailnet

Думайте про **хост Gateway** як про місце, де живе агент. Він володіє сесіями, профілями автентифікації, каналами й станом. Ваш ноутбук, десктоп і nodes підключаються до цього хоста.

### Постійно ввімкнений Gateway у вашому tailnet

Запустіть Gateway на постійному хості (VPS або домашньому сервері) і звертайтеся до нього через **Tailscale** або SSH.

- **Найкращий UX:** залиште `gateway.bind: "loopback"` і використовуйте **Tailscale Serve** для Control UI.
- **Резервний варіант:** залиште loopback плюс SSH-тунель із будь-якої машини, якій потрібен доступ.
- **Приклади:** [exe.dev](/uk/install/exe-dev) (проста VM) або [Hetzner](/uk/install/hetzner) (виробничий VPS).

Ідеально, коли ваш ноутбук часто засинає, але ви хочете, щоб агент був завжди ввімкнений.

### Домашній десктоп запускає Gateway

Ноутбук **не** запускає агента. Він підключається віддалено:

- Використовуйте режим **Remote over SSH** у застосунку macOS (Settings → General → OpenClaw runs).
- Застосунок відкриває тунель і керує ним, тож WebChat і перевірки стану просто працюють.

Інструкція: [віддалений доступ macOS](/uk/platforms/mac/remote).

### Ноутбук запускає Gateway

Тримайте Gateway локально, але безпечно відкрийте до нього доступ:

- SSH-тунель до ноутбука з інших машин, або
- Tailscale Serve для Control UI, залишивши Gateway лише на loopback.

Посібники: [Tailscale](/uk/gateway/tailscale) і [огляд Web](/uk/web).

## Потік команд (що де запускається)

Один сервіс Gateway володіє станом + каналами. Nodes є периферійними пристроями.

Приклад потоку (Telegram → node):

- Повідомлення Telegram надходить у **Gateway**.
- Gateway запускає **агента** й вирішує, чи викликати інструмент node.
- Gateway викликає **node** через WebSocket Gateway (`node.*` RPC).
- Node повертає результат; Gateway відповідає назад у Telegram.

Примітки:

- **Nodes не запускають сервіс gateway.** На одному хості має працювати лише один gateway, якщо тільки ви навмисно не запускаєте ізольовані профілі (див. [Кілька gateway](/uk/gateway/multiple-gateways)).
- "node mode" застосунку macOS — це просто клієнт node через WebSocket Gateway.

## SSH-тунель (CLI + інструменти)

Створіть локальний тунель до віддаленого Gateway WS:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Коли тунель піднято:

- `openclaw health` і `openclaw status --deep` тепер дістаються віддаленого gateway через `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` і `openclaw gateway call` також можуть за потреби спрямовуватися на перенаправлену URL-адресу через `--url`.

<Note>
Замініть `18789` на налаштований вами `gateway.port` (або `--port` чи `OPENCLAW_GATEWAY_PORT`).
</Note>

<Warning>
Коли ви передаєте `--url`, CLI не повертається до облікових даних із конфігурації чи середовища. Явно вкажіть `--token` або `--password`. Відсутність явних облікових даних є помилкою.
</Warning>

## Віддалені значення за замовчуванням для CLI

Ви можете зберегти віддалену ціль, щоб команди CLI використовували її за замовчуванням:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      url: "ws://127.0.0.1:18789",
      token: "your-token",
    },
  },
}
```

Коли gateway доступний лише через loopback, залишайте URL як `ws://127.0.0.1:18789` і спершу відкривайте SSH-тунель.
У SSH-тунельному транспорті застосунку macOS виявлені імена хостів gateway належать до
`gateway.remote.sshTarget`; `gateway.remote.url` залишається URL локального тунелю.

## Пріоритет облікових даних

Визначення облікових даних Gateway дотримується одного спільного контракту для шляхів call/probe/status і моніторингу exec-approval у Discord. Node-host використовує той самий базовий контракт з одним винятком для локального режиму (він навмисно ігнорує `gateway.remote.*`):

- Явні облікові дані (`--token`, `--password` або інструмент `gatewayToken`) завжди мають пріоритет на шляхах call, які приймають явну автентифікацію.
- Безпека перевизначення URL:
  - Перевизначення URL у CLI (`--url`) ніколи не використовують неявні облікові дані з конфігурації/env.
  - Перевизначення URL через env (`OPENCLAW_GATEWAY_URL`) можуть використовувати лише облікові дані env (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Значення за замовчуванням у локальному режимі:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (віддалений резервний варіант застосовується лише коли локальний ввід auth token не задано)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (віддалений резервний варіант застосовується лише коли локальний ввід auth password не задано)
- Значення за замовчуванням у віддаленому режимі:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Виняток локального режиму Node-host: `gateway.remote.token` / `gateway.remote.password` ігноруються.
- Перевірки token для віддалених probe/status за замовчуванням суворі: вони використовують лише `gateway.remote.token` (без резервного переходу на локальний token) під час роботи з віддаленим режимом.
- Перевизначення env для Gateway використовують лише `OPENCLAW_GATEWAY_*`.

## Chat UI через SSH

WebChat більше не використовує окремий HTTP-порт. Chat UI на SwiftUI підключається безпосередньо до WebSocket Gateway.

- Перенаправте `18789` через SSH (див. вище), потім підключіть клієнтів до `ws://127.0.0.1:18789`.
- На macOS віддавайте перевагу режиму "Remote over SSH" у застосунку, який автоматично керує тунелем.

## Remote over SSH у застосунку macOS

Застосунок рядка меню macOS може керувати тим самим налаштуванням наскрізно (віддалені перевірки статусу, WebChat і перенаправлення Voice Wake).

Інструкція: [віддалений доступ macOS](/uk/platforms/mac/remote).

## Правила безпеки (віддалено/VPN)

Коротко: **залишайте Gateway доступним лише через loopback**, якщо ви не впевнені, що вам потрібна прив’язка.

- **Loopback + SSH/Tailscale Serve** — найбезпечніше значення за замовчуванням (без публічного доступу).
- Відкритий текст `ws://` за замовчуванням працює лише через loopback. Для довірених приватних мереж
  встановіть `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` у процесі клієнта як
  аварійний варіант. Еквівалента в `openclaw.json` немає; це має бути середовище
  процесу для клієнта, який встановлює WebSocket-з’єднання.
- **Прив’язки не до loopback** (`lan`/`tailnet`/`custom`, або `auto`, коли loopback недоступний) мають використовувати автентифікацію gateway: token, password або identity-aware reverse proxy з `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` є джерелами облікових даних клієнта. Вони самі по собі **не** налаштовують автентифікацію сервера.
- Локальні шляхи call можуть використовувати `gateway.remote.*` як резервний варіант лише коли `gateway.auth.*` не задано.
- Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef і його не вдалося розв’язати, розв’язання завершується закрито (без маскування віддаленим резервним варіантом).
- `gateway.remote.tlsFingerprint` закріплює віддалений TLS-сертифікат під час використання `wss://`.
- **Tailscale Serve** може автентифікувати трафік Control UI/WebSocket через identity
  headers, коли `gateway.auth.allowTailscale: true`; кінцеві точки HTTP API не
  використовують цю автентифікацію заголовками Tailscale, а натомість дотримуються звичайного HTTP
  режиму автентифікації gateway. Цей потік без token припускає, що хост gateway довірений. Встановіть
  `false`, якщо хочете автентифікацію shared-secret усюди.
- Автентифікація **trusted-proxy** за замовчуванням очікує налаштування identity-aware proxy не на loopback.
  Reverse proxy на loopback на тому самому хості потребують явного `gateway.auth.trustedProxy.allowLoopback = true`.
- Ставтеся до керування з браузера як до операторського доступу: лише tailnet + навмисне спарювання node.

Докладніше: [Безпека](/uk/gateway/security).

### macOS: постійний SSH-тунель через LaunchAgent

Для клієнтів macOS, що підключаються до віддаленого gateway, найпростіше постійне налаштування використовує запис конфігурації SSH `LocalForward` плюс LaunchAgent, щоб підтримувати тунель живим після перезавантажень і збоїв.

#### Крок 1: додайте конфігурацію SSH

Відредагуйте `~/.ssh/config`:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

Замініть `<REMOTE_IP>` і `<REMOTE_USER>` на ваші значення.

#### Крок 2: скопіюйте SSH-ключ (одноразово)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### Крок 3: налаштуйте token gateway

Збережіть token у конфігурації, щоб він зберігався між перезапусками:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### Крок 4: створіть LaunchAgent

Збережіть це як `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>ai.openclaw.ssh-tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/ssh</string>
        <string>-N</string>
        <string>remote-gateway</string>
    </array>
    <key>KeepAlive</key>
    <true/>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

#### Крок 5: завантажте LaunchAgent

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

Тунель автоматично запускатиметься під час входу, перезапускатиметься після збою й підтримуватиме перенаправлений порт активним.

<Note>
Якщо у вас залишився LaunchAgent `com.openclaw.ssh-tunnel` зі старішого налаштування, вивантажте й видаліть його.
</Note>

#### Усунення несправностей

Перевірте, чи тунель працює:

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

Перезапустіть тунель:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

Зупиніть тунель:

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| Запис конфігурації                   | Що він робить                                               |
| ------------------------------------ | ----------------------------------------------------------- |
| `LocalForward 18789 127.0.0.1:18789` | Перенаправляє локальний порт 18789 на віддалений порт 18789 |
| `ssh -N`                             | SSH без виконання віддалених команд (лише port-forwarding)  |
| `KeepAlive`                          | Автоматично перезапускає тунель, якщо він аварійно завершується |
| `RunAtLoad`                          | Запускає тунель, коли LaunchAgent завантажується під час входу |

## Пов’язане

- [Tailscale](/uk/gateway/tailscale)
- [Автентифікація](/uk/gateway/authentication)
- [Налаштування віддаленого gateway](/uk/gateway/remote-gateway-readme)
