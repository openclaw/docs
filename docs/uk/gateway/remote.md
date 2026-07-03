---
read_when:
    - Запуск або усунення несправностей налаштувань віддаленого Gateway
summary: Віддалений доступ за допомогою Gateway WS, SSH-тунелів і tailnet-мереж
title: Віддалений доступ
x-i18n:
    generated_at: "2026-07-03T23:41:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb6fd38698480f1dff93a6e4819082711e8e4395556a2fd85a8eb772ef6fbe31
    source_path: gateway/remote.md
    workflow: 16
---

Цей репозиторій підтримує віддалений доступ до Gateway, утримуючи один Gateway (master), запущений на виділеному хості (настільному комп’ютері/сервері), і підключаючи до нього клієнтів.

- Для **операторів (ви / застосунок macOS)**: прямий WebSocket у LAN/Tailnet найпростіший, коли gateway доступний; тунелювання SSH — універсальний резервний варіант.
- Для **вузлів (iOS/Android і майбутні пристрої)**: підключайтеся до **WebSocket** Gateway (LAN/tailnet або SSH-тунель за потреби).

## Основна ідея

- WebSocket Gateway зазвичай прив’язується до **local loopback** на налаштованому порту (типово 18789).
- Для віддаленого використання відкрийте його через Tailscale Serve або довірену прив’язку LAN/Tailnet, або переадресуйте порт local loopback через SSH.

## Типові налаштування VPN і tailnet

Уявляйте **хост Gateway** як місце, де живе агент. Він володіє сеансами, профілями автентифікації, каналами та станом. Ваш ноутбук, настільний комп’ютер і вузли підключаються до цього хоста.

### Постійно ввімкнений Gateway у вашому tailnet

Запустіть Gateway на постійному хості (VPS або домашньому сервері) і звертайтеся до нього через **Tailscale** або SSH.

- **Найкращий UX:** залиште `gateway.bind: "loopback"` і використовуйте **Tailscale Serve** для Control UI.
- **Довірені LAN/Tailnet:** прив’яжіть gateway до приватного інтерфейсу й підключайтеся напряму з `gateway.remote.transport: "direct"`.
- **Резервний варіант:** залиште local loopback плюс SSH-тунель з будь-якої машини, якій потрібен доступ.
- **Приклади:** [exe.dev](/uk/install/exe-dev) (проста VM) або [Hetzner](/uk/install/hetzner) (production VPS).

Ідеально, коли ваш ноутбук часто засинає, але ви хочете, щоб агент був постійно ввімкнений.

### Домашній настільний комп’ютер запускає Gateway

Ноутбук **не** запускає агента. Він підключається віддалено:

- Використовуйте віддалений режим застосунку macOS (Settings → General → OpenClaw runs).
- Застосунок підключається напряму, коли gateway доступний у LAN/Tailnet, або відкриває й керує SSH-тунелем, коли ви вибираєте SSH.

Runbook: [віддалений доступ macOS](/uk/platforms/mac/remote).

### Ноутбук запускає Gateway

Залиште Gateway локальним, але безпечно відкрийте доступ до нього:

- SSH-тунель до ноутбука з інших машин, або
- Tailscale Serve для Control UI, залишаючи Gateway доступним лише через local loopback.

Посібники: [Tailscale](/uk/gateway/tailscale) і [огляд Web](/uk/web).

## Потік команд (що де запускається)

Одна служба gateway володіє станом + каналами. Вузли є периферійними.

Приклад потоку (Telegram → вузол):

- Повідомлення Telegram надходить до **Gateway**.
- Gateway запускає **агента** й вирішує, чи викликати інструмент вузла.
- Gateway викликає **вузол** через WebSocket Gateway (`node.*` RPC).
- Вузол повертає результат; Gateway відповідає назад у Telegram.

Примітки:

- **Вузли не запускають службу gateway.** На кожному хості має працювати лише один gateway, якщо ви навмисно не запускаєте ізольовані профілі (див. [Кілька gateway](/uk/gateway/multiple-gateways)).
- «Режим вузла» застосунку macOS — це просто клієнт вузла через WebSocket Gateway.

## SSH-тунель (CLI + інструменти)

Створіть локальний тунель до віддаленого Gateway WS:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Коли тунель активний:

- `openclaw health` і `openclaw status --deep` тепер досягають віддаленого gateway через `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` і `openclaw gateway call` також можуть націлюватися на переадресовану URL-адресу через `--url`, коли потрібно.

<Note>
Замініть `18789` на налаштований `gateway.port` (або `--port`, або `OPENCLAW_GATEWAY_PORT`).
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

Коли gateway доступний лише через local loopback, залиште URL як `ws://127.0.0.1:18789` і спершу відкрийте SSH-тунель.
У транспорті SSH-тунелю застосунку macOS виявлені імена хостів gateway належать до
`gateway.remote.sshTarget`; `gateway.remote.url` залишається локальною URL-адресою тунелю.
Якщо ці порти відрізняються, установіть `gateway.remote.remotePort` як порт gateway на
хості SSH.
Перевірка ключа хоста типово сувора. Керовані псевдоніми можуть явно використовувати
свою ефективну політику довіри OpenSSH за допомогою
`gateway.remote.sshHostKeyPolicy: "openssh"`; перегляньте відповідні користувацькі та системні
налаштування SSH, перш ніж увімкнути це.

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

Визначення облікових даних Gateway дотримується одного спільного контракту для шляхів call/probe/status і моніторингу exec-approval у Discord. Node-host використовує той самий базовий контракт з одним винятком для локального режиму (він навмисно ігнорує `gateway.remote.*`):

- Явні облікові дані (`--token`, `--password` або інструмент `gatewayToken`) завжди мають пріоритет на шляхах виклику, які приймають явну автентифікацію.
- Безпека перевизначення URL:
  - Перевизначення URL у CLI (`--url`) ніколи не повторно використовують неявні облікові дані config/env.
  - Перевизначення URL через env (`OPENCLAW_GATEWAY_URL`) можуть використовувати лише облікові дані env (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Типові значення локального режиму:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (віддалений резервний варіант застосовується лише коли локальне введення токена автентифікації не задано)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (віддалений резервний варіант застосовується лише коли локальне введення пароля автентифікації не задано)
- Типові значення віддаленого режиму:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Виняток локального режиму Node-host: `gateway.remote.token` / `gateway.remote.password` ігноруються.
- Перевірки токенів remote probe/status типово суворі: вони використовують лише `gateway.remote.token` (без локального резервного токена), коли націлюються на віддалений режим.
- Перевизначення env Gateway використовують лише `OPENCLAW_GATEWAY_*`.

## Віддалений доступ Chat UI

WebChat більше не використовує окремий HTTP-порт. SwiftUI Chat UI підключається напряму до WebSocket Gateway.

- Переадресуйте `18789` через SSH (див. вище), потім підключайте клієнтів до `ws://127.0.0.1:18789`.
- Для прямого режиму LAN/Tailnet підключайте клієнтів до налаштованої приватної URL-адреси `ws://` або захищеної `wss://`.
- На macOS віддавайте перевагу віддаленому режиму застосунку, який автоматично керує вибраним транспортом.

## Віддалений режим застосунку macOS

Застосунок рядка меню macOS може керувати тим самим налаштуванням від початку до кінця (віддалені перевірки статусу, WebChat і переадресація Voice Wake).

Runbook: [віддалений доступ macOS](/uk/platforms/mac/remote).

## Правила безпеки (remote/VPN)

Коротко: **залишайте Gateway доступним лише через local loopback**, якщо ви не впевнені, що вам потрібна прив’язка.

- **Local loopback + SSH/Tailscale Serve** — найбезпечніше типове рішення (без публічного доступу).
- Plaintext `ws://` приймається для local loopback, LAN, link-local, `.local`, `.ts.net` і хостів Tailscale CGNAT. Публічні віддалені хости мають використовувати `wss://`.
- **Прив’язки поза local loopback** (`lan`/`tailnet`/`custom` або `auto`, коли local loopback недоступний) мають використовувати автентифікацію gateway: токен, пароль або identity-aware reverse proxy з `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` — це джерела облікових даних клієнта. Вони **не** налаштовують автентифікацію сервера самі по собі.
- Локальні шляхи виклику можуть використовувати `gateway.remote.*` як резервний варіант лише коли `gateway.auth.*` не задано.
- Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef і не вирішено, визначення завершується закрито (без маскування віддаленим резервним варіантом).
- `gateway.remote.tlsFingerprint` закріплює віддалений TLS-сертифікат під час використання `wss://`, включно з прямим режимом macOS. Без налаштованого або раніше збереженого pin macOS закріплює сертифікат першого використання лише після успішної звичайної системної довіри; gateway із самопідписаними сертифікатами або приватним CA, яким macOS ще не довіряє, потребують явного відбитка або Remote over SSH.
- **Tailscale Serve** може автентифікувати трафік Control UI/WebSocket через identity
  headers, коли `gateway.auth.allowTailscale: true`; кінцеві точки HTTP API не
  використовують цю автентифікацію заголовків Tailscale, а натомість дотримуються звичайного HTTP
  режиму автентифікації gateway. Цей потік без токена припускає, що хост gateway є довіреним. Установіть його на
  `false`, якщо ви хочете автентифікацію зі спільним секретом усюди.
- Автентифікація **Trusted-proxy** типово очікує налаштування identity-aware proxy поза local loopback.
  Reverse proxy на тому самому хості через local loopback потребують явного `gateway.auth.trustedProxy.allowLoopback = true`.
- Ставтеся до керування з браузера як до операторського доступу: лише tailnet + навмисне спарювання вузлів.

Докладно: [Безпека](/uk/gateway/security).

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

Замініть `<REMOTE_IP>` і `<REMOTE_USER>` своїми значеннями.

#### Крок 2: скопіюйте ключ SSH (одноразово)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### Крок 3: налаштуйте токен gateway

Збережіть токен у конфігурації, щоб він зберігався між перезапусками:

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

Тунель запускатиметься автоматично під час входу, перезапускатиметься після збою й підтримуватиме переадресований порт активним.

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

| Запис конфігурації                   | Що він робить                                               |
| ------------------------------------ | ----------------------------------------------------------- |
| `LocalForward 18789 127.0.0.1:18789` | Переадресовує локальний порт 18789 на віддалений порт 18789 |
| `ssh -N`                             | SSH без виконання віддалених команд (лише переадресація портів) |
| `KeepAlive`                          | Автоматично перезапускає тунель у разі збою                 |
| `RunAtLoad`                          | Запускає тунель, коли LaunchAgent завантажується під час входу |

## Пов’язане

- [Tailscale](/uk/gateway/tailscale)
- [Автентифікація](/uk/gateway/authentication)
- [Налаштування віддаленого gateway](/uk/gateway/remote-gateway-readme)
