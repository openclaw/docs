---
read_when:
    - Запуск або усунення несправностей віддалених налаштувань Gateway
summary: Віддалений доступ за допомогою SSH-тунелів (Gateway WS) і тейлнетів
title: Віддалений доступ
x-i18n:
    generated_at: "2026-04-28T11:13:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 116ffba71801d3363eba293997ee4a5c8ad083a82298e57e68f678510263650a
    source_path: gateway/remote.md
    workflow: 16
---

Цей репозиторій підтримує “віддалений доступ через SSH”, утримуючи один Gateway (головний) запущеним на виділеному хості (настільному комп’ютері/сервері) і підключаючи до нього клієнтів.

- Для **операторів (вас / macOS-застосунку)**: SSH-тунелювання є універсальним резервним варіантом.
- Для **вузлів (iOS/Android і майбутніх пристроїв)**: підключайтеся до Gateway **WebSocket** (LAN/tailnet або SSH-тунель за потреби).

## Основна ідея

- Gateway WebSocket прив’язується до **loopback** на налаштованому порту (типово 18789).
- Для віддаленого використання ви переадресовуєте цей loopback-порт через SSH (або використовуєте tailnet/VPN і менше тунелювання).

## Поширені налаштування VPN і tailnet

Вважайте **хост Gateway** місцем, де живе агент. Він володіє сесіями, профілями автентифікації, каналами й станом. Ваш ноутбук, настільний комп’ютер і вузли підключаються до цього хоста.

### Постійно ввімкнений Gateway у вашій tailnet-мережі

Запустіть Gateway на постійному хості (VPS або домашньому сервері) і підключайтеся до нього через **Tailscale** або SSH.

- **Найкращий UX:** залиште `gateway.bind: "loopback"` і використовуйте **Tailscale Serve** для Control UI.
- **Резервний варіант:** залиште loopback плюс SSH-тунель з будь-якої машини, якій потрібен доступ.
- **Приклади:** [exe.dev](/uk/install/exe-dev) (проста VM) або [Hetzner](/uk/install/hetzner) (виробничий VPS).

Ідеально, коли ваш ноутбук часто переходить у сон, але ви хочете, щоб агент завжди був увімкнений.

### Домашній настільний комп’ютер запускає Gateway

Ноутбук **не** запускає агента. Він підключається віддалено:

- Використовуйте режим **Remote over SSH** у macOS-застосунку (Settings → General → OpenClaw runs).
- Застосунок відкриває тунель і керує ним, тому WebChat і перевірки справності просто працюють.

Інструкція: [віддалений доступ macOS](/uk/platforms/mac/remote).

### Ноутбук запускає Gateway

Тримайте Gateway локальним, але безпечно відкрийте до нього доступ:

- SSH-тунель до ноутбука з інших машин, або
- Tailscale Serve для Control UI і залиште Gateway доступним лише через loopback.

Посібники: [Tailscale](/uk/gateway/tailscale) і [огляд Web](/uk/web).

## Потік команд (що де запускається)

Один сервіс gateway володіє станом і каналами. Вузли є периферією.

Приклад потоку (Telegram → вузол):

- Повідомлення Telegram надходить до **Gateway**.
- Gateway запускає **агента** і вирішує, чи викликати інструмент вузла.
- Gateway викликає **вузол** через Gateway WebSocket (`node.*` RPC).
- Вузол повертає результат; Gateway відповідає назад у Telegram.

Примітки:

- **Вузли не запускають сервіс gateway.** На один хост має працювати лише один gateway, якщо ви навмисно не запускаєте ізольовані профілі (див. [Кілька gateway](/uk/gateway/multiple-gateways)).
- “Режим вузла” в macOS-застосунку — це просто клієнт вузла через Gateway WebSocket.

## SSH-тунель (CLI + інструменти)

Створіть локальний тунель до віддаленого Gateway WS:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Коли тунель піднято:

- `openclaw health` і `openclaw status --deep` тепер досягають віддаленого gateway через `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` і `openclaw gateway call` також можуть націлюватися на переадресовану URL-адресу через `--url`, коли потрібно.

<Note>
Замініть `18789` на налаштований вами `gateway.port` (або `--port`, або `OPENCLAW_GATEWAY_PORT`).
</Note>

<Warning>
Коли ви передаєте `--url`, CLI не повертається до облікових даних із конфігурації чи середовища. Явно вкажіть `--token` або `--password`. Відсутність явних облікових даних є помилкою.
</Warning>

## Віддалені типові значення CLI

Ви можете зберегти віддалену ціль, щоб команди CLI використовували її типово:

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

Коли gateway доступний лише через loopback, залиште URL як `ws://127.0.0.1:18789` і спершу відкрийте SSH-тунель.
У SSH-тунельному транспорті macOS-застосунку виявлені імена хостів gateway належать до
`gateway.remote.sshTarget`; `gateway.remote.url` залишається URL локального тунелю.

## Пріоритет облікових даних

Визначення облікових даних Gateway дотримується одного спільного контракту для шляхів call/probe/status і моніторингу схвалення виконання Discord. Node-host використовує той самий базовий контракт з одним винятком для локального режиму (він навмисно ігнорує `gateway.remote.*`):

- Явні облікові дані (`--token`, `--password` або інструмент `gatewayToken`) завжди мають пріоритет на шляхах виклику, які приймають явну автентифікацію.
- Безпека перевизначення URL:
  - Перевизначення URL у CLI (`--url`) ніколи не повторно використовують неявні облікові дані з конфігурації/середовища.
  - Перевизначення URL через середовище (`OPENCLAW_GATEWAY_URL`) можуть використовувати лише облікові дані середовища (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Типові значення локального режиму:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (віддалений резервний варіант застосовується лише коли локальне введення auth token не задано)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (віддалений резервний варіант застосовується лише коли локальне введення auth password не задано)
- Типові значення віддаленого режиму:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Виняток локального режиму Node-host: `gateway.remote.token` / `gateway.remote.password` ігноруються.
- Перевірки token для віддалених probe/status типово суворі: вони використовують лише `gateway.remote.token` (без локального резервного token), коли цільовим є віддалений режим.
- Перевизначення середовища Gateway використовують лише `OPENCLAW_GATEWAY_*`.

## Chat UI через SSH

WebChat більше не використовує окремий HTTP-порт. SwiftUI chat UI підключається безпосередньо до Gateway WebSocket.

- Переадресуйте `18789` через SSH (див. вище), потім підключайте клієнтів до `ws://127.0.0.1:18789`.
- На macOS віддавайте перевагу режиму “Remote over SSH” у застосунку, який автоматично керує тунелем.

## Remote over SSH у macOS-застосунку

Застосунок рядка меню macOS може керувати тим самим налаштуванням від початку до кінця (віддалені перевірки стану, WebChat і переадресація Voice Wake).

Інструкція: [віддалений доступ macOS](/uk/platforms/mac/remote).

## Правила безпеки (remote/VPN)

Коротко: **залишайте Gateway доступним лише через loopback**, якщо ви не впевнені, що вам потрібна прив’язка.

- **Loopback + SSH/Tailscale Serve** — найбезпечніше типове налаштування (без публічного доступу).
- Незашифрований `ws://` типово дозволений лише для loopback. Для довірених приватних мереж
  задайте `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` у клієнтському процесі як
  аварійний виняток. Еквівалента в `openclaw.json` немає; це має бути
  середовище процесу для клієнта, який встановлює WebSocket-з’єднання.
- **Прив’язки не до loopback** (`lan`/`tailnet`/`custom`, або `auto`, коли loopback недоступний) мають використовувати автентифікацію gateway: token, password або identity-aware reverse proxy з `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` є джерелами облікових даних клієнта. Вони **не** налаштовують серверну автентифікацію самі по собі.
- Локальні шляхи виклику можуть використовувати `gateway.remote.*` як резерв лише коли `gateway.auth.*` не задано.
- Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef і не може бути визначено, визначення завершується закрито (без маскування віддаленим резервним варіантом).
- `gateway.remote.tlsFingerprint` закріплює віддалений TLS-сертифікат під час використання `wss://`.
- **Tailscale Serve** може автентифікувати трафік Control UI/WebSocket через identity
  headers, коли `gateway.auth.allowTailscale: true`; кінцеві точки HTTP API не
  використовують цю Tailscale header auth, а натомість дотримуються звичайного HTTP
  auth mode gateway. Цей потік без token припускає, що хост gateway є довіреним. Установіть
  `false`, якщо хочете shared-secret auth всюди.
- Автентифікація **Trusted-proxy** типово очікує налаштувань identity-aware proxy не через loopback.
  Зворотні proxy на тому самому хості через loopback потребують явного `gateway.auth.trustedProxy.allowLoopback = true`.
- Ставтеся до керування з браузера як до доступу оператора: лише tailnet + свідоме спарювання вузлів.

Докладніше: [Безпека](/uk/gateway/security).

### macOS: постійний SSH-тунель через LaunchAgent

Для клієнтів macOS, які підключаються до віддаленого gateway, найпростіше постійне налаштування використовує запис конфігурації SSH `LocalForward` плюс LaunchAgent, щоб тримати тунель живим після перезавантажень і збоїв.

#### Крок 1: додайте конфігурацію SSH

Редагуйте `~/.ssh/config`:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

Замініть `<REMOTE_IP>` і `<REMOTE_USER>` своїми значеннями.

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

Тунель автоматично запускатиметься під час входу, перезапускатиметься після збою й підтримуватиме переадресований порт активним.

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

| Запис конфігурації                   | Що він робить                                                |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | Переадресовує локальний порт 18789 на віддалений порт 18789  |
| `ssh -N`                             | SSH без виконання віддалених команд (лише переадресація портів) |
| `KeepAlive`                          | Автоматично перезапускає тунель, якщо він завершується збоєм |
| `RunAtLoad`                          | Запускає тунель, коли LaunchAgent завантажується під час входу |

## Пов’язане

- [Tailscale](/uk/gateway/tailscale)
- [Автентифікація](/uk/gateway/authentication)
- [Налаштування віддаленого gateway](/uk/gateway/remote-gateway-readme)
