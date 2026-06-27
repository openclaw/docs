---
read_when:
    - Запуск або усунення несправностей віддалених налаштувань Gateway
summary: Віддалений доступ за допомогою Gateway WS, SSH-тунелів і tailnet'ів
title: Віддалений доступ
x-i18n:
    generated_at: "2026-06-27T17:35:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f5f885026fe76acb46f49955c6e485e08714a5cc5e90c165d20e25cea1acf864
    source_path: gateway/remote.md
    workflow: 16
---

Цей репозиторій підтримує віддалений доступ до Gateway, підтримуючи один Gateway (головний) запущеним на виділеному хості (настільному комп’ютері/сервері) і підключаючи до нього клієнтів.

- Для **операторів (ви / застосунок macOS)**: прямий LAN/Tailnet WebSocket найпростіший, коли gateway доступний; SSH-тунелювання — універсальний резервний варіант.
- Для **вузлів (iOS/Android і майбутні пристрої)**: підключайтеся до **WebSocket** Gateway (LAN/tailnet або SSH-тунель за потреби).

## Основна ідея

- WebSocket Gateway зазвичай прив’язується до **loopback** на налаштованому вами порту (за замовчуванням 18789).
- Для віддаленого використання відкрийте його через Tailscale Serve або довірену прив’язку LAN/Tailnet, або перенаправте loopback-порт через SSH.

## Типові налаштування VPN і tailnet

Уявляйте **хост Gateway** як місце, де живе агент. Він володіє сесіями, профілями автентифікації, каналами та станом. Ваш ноутбук, настільний комп’ютер і вузли підключаються до цього хоста.

### Постійно ввімкнений Gateway у вашому tailnet

Запустіть Gateway на постійному хості (VPS або домашній сервер) і підключайтеся до нього через **Tailscale** або SSH.

- **Найкращий UX:** залиште `gateway.bind: "loopback"` і використовуйте **Tailscale Serve** для Control UI.
- **Довірені LAN/Tailnet:** прив’яжіть gateway до приватного інтерфейсу й підключайтеся напряму з `gateway.remote.transport: "direct"`.
- **Резервний варіант:** залиште loopback плюс SSH-тунель із будь-якої машини, якій потрібен доступ.
- **Приклади:** [exe.dev](/uk/install/exe-dev) (проста VM) або [Hetzner](/uk/install/hetzner) (виробничий VPS).

Ідеально, коли ваш ноутбук часто засинає, але ви хочете, щоб агент завжди був увімкнений.

### Домашній настільний комп’ютер запускає Gateway

Ноутбук **не** запускає агента. Він підключається віддалено:

- Використовуйте віддалений режим застосунку macOS (Налаштування → Загальні → OpenClaw runs).
- Застосунок підключається напряму, коли gateway доступний у LAN/Tailnet, або відкриває й керує SSH-тунелем, коли ви вибираєте SSH.

Інструкція: [віддалений доступ macOS](/uk/platforms/mac/remote).

### Ноутбук запускає Gateway

Тримайте Gateway локальним, але відкривайте його безпечно:

- SSH-тунель до ноутбука з інших машин, або
- Tailscale Serve для Control UI і залиште Gateway лише на loopback.

Посібники: [Tailscale](/uk/gateway/tailscale) і [Огляд Web](/uk/web).

## Потік команд (що де запускається)

Один сервіс gateway володіє станом і каналами. Вузли є периферійними пристроями.

Приклад потоку (Telegram → вузол):

- Повідомлення Telegram надходить до **Gateway**.
- Gateway запускає **агента** й вирішує, чи викликати інструмент вузла.
- Gateway викликає **вузол** через WebSocket Gateway (`node.*` RPC).
- Вузол повертає результат; Gateway відповідає назад у Telegram.

Примітки:

- **Вузли не запускають сервіс gateway.** На хост має бути лише один gateway, якщо ви навмисно не запускаєте ізольовані профілі (див. [Кілька gateway](/uk/gateway/multiple-gateways)).
- «Режим вузла» застосунку macOS — це просто клієнт вузла через WebSocket Gateway.

## SSH-тунель (CLI + інструменти)

Створіть локальний тунель до віддаленого Gateway WS:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Коли тунель піднято:

- `openclaw health` і `openclaw status --deep` тепер досягають віддаленого gateway через `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` і `openclaw gateway call` також можуть за потреби націлюватися на перенаправлений URL через `--url`.

<Note>
Замініть `18789` на ваш налаштований `gateway.port` (або `--port`, або `OPENCLAW_GATEWAY_PORT`).
</Note>

<Warning>
Коли ви передаєте `--url`, CLI не повертається до облікових даних із конфігурації чи середовища. Додайте `--token` або `--password` явно. Відсутність явних облікових даних є помилкою.
</Warning>

## Віддалені типові значення CLI

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

Коли gateway доступний лише через loopback, залиште URL як `ws://127.0.0.1:18789` і спочатку відкрийте SSH-тунель.
У транспорті SSH-тунелю застосунку macOS виявлені імена хостів gateway належать до
`gateway.remote.sshTarget`; `gateway.remote.url` залишається локальним URL тунелю.
Якщо ці порти відрізняються, задайте `gateway.remote.remotePort` як порт gateway на
SSH-хості.

Для gateway, який уже доступний у довіреній LAN або Tailnet, використовуйте прямий режим:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      transport: "direct",
      url: "ws://192.168.0.202:18789",
      token: "your-token",
    },
  },
}
```

## Пріоритет облікових даних

Розв’язання облікових даних Gateway дотримується одного спільного контракту для шляхів call/probe/status і моніторингу exec-approval у Discord. Node-host використовує той самий базовий контракт з одним винятком для локального режиму (він навмисно ігнорує `gateway.remote.*`):

- Явні облікові дані (`--token`, `--password` або інструментальний `gatewayToken`) завжди мають перевагу на шляхах виклику, які приймають явну автентифікацію.
- Безпека перевизначення URL:
  - Перевизначення URL у CLI (`--url`) ніколи не повторно використовують неявні облікові дані з конфігурації/env.
  - Перевизначення URL через env (`OPENCLAW_GATEWAY_URL`) можуть використовувати лише облікові дані env (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Типові значення локального режиму:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (віддалений резервний варіант застосовується лише коли локальний вхідний auth token не задано)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (віддалений резервний варіант застосовується лише коли локальний вхідний auth password не задано)
- Типові значення віддаленого режиму:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Виняток локального режиму Node-host: `gateway.remote.token` / `gateway.remote.password` ігноруються.
- Перевірки token для віддалених probe/status суворі за замовчуванням: вони використовують лише `gateway.remote.token` (без резервного переходу до локального token), коли ціллю є віддалений режим.
- Перевизначення env для Gateway використовують лише `OPENCLAW_GATEWAY_*`.

## Віддалений доступ Chat UI

WebChat більше не використовує окремий HTTP-порт. Chat UI SwiftUI підключається напряму до WebSocket Gateway.

- Перенаправте `18789` через SSH (див. вище), потім підключайте клієнтів до `ws://127.0.0.1:18789`.
- Для прямого режиму LAN/Tailnet підключайте клієнтів до налаштованого приватного `ws://` або захищеного `wss://` URL.
- На macOS надавайте перевагу віддаленому режиму застосунку, який автоматично керує вибраним транспортом.

## Віддалений режим застосунку macOS

Застосунок рядка меню macOS може керувати тим самим налаштуванням від початку до кінця (віддалені перевірки стану, WebChat і перенаправлення Voice Wake).

Інструкція: [віддалений доступ macOS](/uk/platforms/mac/remote).

## Правила безпеки (віддалено/VPN)

Коротко: **тримайте Gateway лише на loopback**, якщо ви не впевнені, що вам потрібна прив’язка.

- **Loopback + SSH/Tailscale Serve** — найбезпечніше типове значення (без публічного відкриття).
- Відкритий текст `ws://` приймається для loopback, LAN, link-local, `.local`, `.ts.net` і хостів Tailscale CGNAT. Публічні віддалені хости мають використовувати `wss://`.
- **Прив’язки не до loopback** (`lan`/`tailnet`/`custom` або `auto`, коли loopback недоступний) мають використовувати автентифікацію gateway: token, password або identity-aware reverse proxy з `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` є джерелами облікових даних клієнта. Вони **не** налаштовують автентифікацію сервера самі по собі.
- Локальні шляхи виклику можуть використовувати `gateway.remote.*` як резервний варіант лише коли `gateway.auth.*` не задано.
- Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef і не розв’язано, розв’язання завершується закрито (без маскування віддаленим резервним варіантом).
- `gateway.remote.tlsFingerprint` закріплює віддалений TLS-сертифікат під час використання `wss://`, зокрема в прямому режимі macOS. Без налаштованого або раніше збереженого закріплення macOS закріплює сертифікат першого використання лише після проходження звичайної системної довіри; gateway із самопідписаними або приватними CA, яким macOS ще не довіряє, потребують явного fingerprint або Remote over SSH.
- **Tailscale Serve** може автентифікувати трафік Control UI/WebSocket через identity
  headers, коли `gateway.auth.allowTailscale: true`; кінцеві точки HTTP API не
  використовують цю автентифікацію заголовками Tailscale і натомість дотримуються звичайного режиму HTTP
  auth gateway. Цей потік без token припускає, що хост gateway є довіреним. Установіть
  `false`, якщо хочете shared-secret auth всюди.
- Автентифікація **Trusted-proxy** за замовчуванням очікує налаштування identity-aware proxy не на loopback.
  Reverse proxy на тому самому хості через loopback потребують явного `gateway.auth.trustedProxy.allowLoopback = true`.
- Ставтеся до керування з браузера як до доступу оператора: лише tailnet + навмисне сполучення вузла.

Докладніше: [Безпека](/uk/gateway/security).

### macOS: постійний SSH-тунель через LaunchAgent

Для клієнтів macOS, які підключаються до віддаленого gateway, найпростіше постійне налаштування використовує запис конфігурації SSH `LocalForward` плюс LaunchAgent, щоб підтримувати тунель живим після перезавантажень і збоїв.

#### Крок 1: додайте конфігурацію SSH

Відредагуйте `~/.ssh/config`:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

Замініть `<REMOTE_IP>` і `<REMOTE_USER>` на свої значення.

#### Крок 2: скопіюйте SSH-ключ (одноразово)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### Крок 3: налаштуйте token gateway

Збережіть token у конфігурації, щоб він зберігався після перезапусків:

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

Перевірте, чи тунель запущено:

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

| Запис конфігурації                  | Що він робить                                              |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | Перенаправляє локальний порт 18789 на віддалений порт 18789 |
| `ssh -N`                             | SSH без виконання віддалених команд (лише перенаправлення портів) |
| `KeepAlive`                          | Автоматично перезапускає тунель, якщо він аварійно завершується |
| `RunAtLoad`                          | Запускає тунель, коли LaunchAgent завантажується під час входу |

## Пов’язане

- [Tailscale](/uk/gateway/tailscale)
- [Автентифікація](/uk/gateway/authentication)
- [Налаштування віддаленого gateway](/uk/gateway/remote-gateway-readme)
