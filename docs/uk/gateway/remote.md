---
read_when:
    - Запуск або усунення несправностей віддалених конфігурацій gateway
summary: Віддалений доступ через SSH-тунелі (Gateway WS) і tailnet-и
title: Віддалений доступ
x-i18n:
    generated_at: "2026-04-23T20:54:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68846d05fdbeb2e0041df2db02923b4b508170ce62c99b46e1c4099fed029aab
    source_path: gateway/remote.md
    workflow: 15
---

# Віддалений доступ (SSH, тунелі та tailnet-и)

Цей репозиторій підтримує «віддалену роботу через SSH», якщо тримати один Gateway (основний) запущеним на виділеному хості (desktop/server) і підключати клієнти до нього.

- Для **операторів (вас / застосунку macOS)**: SSH-тунелювання — універсальний запасний варіант.
- Для **вузлів (iOS/Android і майбутні пристрої)**: підключайтеся до **WebSocket** Gateway (LAN/tailnet або SSH-тунель за потреби).

## Основна ідея

- Gateway WebSocket прив’язується до **loopback** на налаштованому порту (типово 18789).
- Для віддаленого використання ви пробрасываєте цей loopback-порт через SSH (або використовуєте tailnet/VPN і менше покладаєтесь на тунелі).

## Поширені конфігурації VPN/tailnet (де живе агент)

Думайте про **хост Gateway** як про місце, «де живе агент». Він володіє sessions, профілями автентифікації, каналами та станом.
Ваш laptop/desktop (і вузли) підключаються до цього хоста.

### 1) Завжди ввімкнений Gateway у вашому tailnet (VPS або домашній сервер)

Запустіть Gateway на постійному хості та звертайтеся до нього через **Tailscale** або SSH.

- **Найкращий UX:** тримайте `gateway.bind: "loopback"` і використовуйте **Tailscale Serve** для UI Control.
- **Запасний варіант:** залишайте loopback + SSH-тунель із будь-якої машини, якій потрібен доступ.
- **Приклади:** [exe.dev](/uk/install/exe-dev) (проста VM) або [Hetzner](/uk/install/hetzner) (production VPS).

Це ідеально, коли ваш laptop часто засинає, але ви хочете, щоб агент був завжди ввімкнений.

### 2) Домашній desktop запускає Gateway, laptop — віддалене керування

Laptop **не** запускає агента. Він підключається віддалено:

- Використовуйте режим застосунку macOS **Remote over SSH** (Settings → General → “OpenClaw runs”).
- Застосунок відкриває та керує тунелем, тож WebChat + перевірки стану «просто працюють».

Runbook: [віддалений доступ macOS](/uk/platforms/mac/remote).

### 3) Laptop запускає Gateway, віддалений доступ з інших машин

Залишайте Gateway локальним, але відкривайте його безпечно:

- SSH-тунель до laptop з інших машин, або
- Tailscale Serve для UI Control і залишайте Gateway доступним лише через loopback.

Посібник: [Tailscale](/uk/gateway/tailscale) і [Огляд Web](/uk/web).

## Потік команд (що і де запускається)

Один сервіс gateway володіє станом + каналами. Вузли є периферією.

Приклад потоку (Telegram → вузол):

- Повідомлення Telegram приходить до **Gateway**.
- Gateway запускає **агента** і вирішує, чи викликати інструмент вузла.
- Gateway викликає **вузол** через Gateway WebSocket (`node.*` RPC).
- Вузол повертає результат; Gateway надсилає відповідь назад у Telegram.

Примітки:

- **Вузли не запускають сервіс gateway.** На хості має працювати лише один gateway, якщо тільки ви навмисно не запускаєте ізольовані профілі (див. [Кілька Gateway-ів](/uk/gateway/multiple-gateways)).
- «Режим вузла» в застосунку macOS — це просто клієнт вузла поверх Gateway WebSocket.

## SSH-тунель (CLI + інструменти)

Створіть локальний тунель до віддаленого Gateway WS:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Коли тунель піднято:

- `openclaw health` і `openclaw status --deep` тепер звертаються до віддаленого gateway через `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` і `openclaw gateway call` також можуть за потреби націлюватися на проброшений URL через `--url`.

Примітка: замініть `18789` на ваш налаштований `gateway.port` (або `--port`/`OPENCLAW_GATEWAY_PORT`).
Примітка: коли ви передаєте `--url`, CLI не повертається до облікових даних із config або environment.
Явно додавайте `--token` або `--password`. Відсутність явних облікових даних є помилкою.

## Типові віддалені значення CLI

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

Коли gateway доступний лише через loopback, залишайте URL як `ws://127.0.0.1:18789` і спочатку відкривайте SSH-тунель.

## Пріоритет облікових даних

Визначення облікових даних Gateway слідує єдиному спільному контракту для шляхів call/probe/status і моніторингу схвалень exec у Discord. Хост Node використовує той самий базовий контракт з одним винятком для локального режиму (він навмисно ігнорує `gateway.remote.*`):

- Явні облікові дані (`--token`, `--password` або інструмент `gatewayToken`) завжди мають пріоритет на шляхах call, які приймають явну автентифікацію.
- Безпека перевизначення URL:
  - Перевизначення URL у CLI (`--url`) ніколи не повторно використовують неявні облікові дані з config/env.
  - Перевизначення URL через env (`OPENCLAW_GATEWAY_URL`) можуть використовувати лише облікові дані env (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Типові значення локального режиму:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (remote fallback застосовується лише коли вхід локального auth token не заданий)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (remote fallback застосовується лише коли вхід локального auth password не заданий)
- Типові значення віддаленого режиму:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Виняток локального режиму для хоста Node: `gateway.remote.token` / `gateway.remote.password` ігноруються.
- Перевірки token для віддалених probe/status типово суворі: вони використовують лише `gateway.remote.token` (без fallback на локальний token) при націлюванні на remote mode.
- Перевизначення Gateway через env використовують лише `OPENCLAW_GATEWAY_*`.

## UI чату через SSH

WebChat більше не використовує окремий HTTP-порт. Чат-UI SwiftUI підключається безпосередньо до Gateway WebSocket.

- Пробросьте `18789` через SSH (див. вище), а потім підключайте клієнтів до `ws://127.0.0.1:18789`.
- На macOS надавайте перевагу режиму застосунку “Remote over SSH”, який автоматично керує тунелем.

## Застосунок macOS "Remote over SSH"

Застосунок macOS у menu bar може керувати цією ж конфігурацією наскрізно (віддалені перевірки стану, WebChat і переспрямування Voice Wake).

Runbook: [віддалений доступ macOS](/uk/platforms/mac/remote).

## Правила безпеки (remote/VPN)

Коротко: **тримайте Gateway доступним лише через loopback**, якщо тільки ви не впевнені, що вам потрібен bind.

- **Loopback + SSH/Tailscale Serve** — найбезпечніший типовий варіант (без публічного доступу).
- Plaintext `ws://` типово дозволений лише для loopback. Для довірених приватних мереж
  задайте `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` у процесі клієнта як аварійний варіант.
- **Non-loopback bind-и** (`lan`/`tailnet`/`custom` або `auto`, коли loopback недоступний) мають використовувати автентифікацію gateway: token, password або reverse proxy з урахуванням identity через `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` — це джерела облікових даних клієнта. Вони **не** налаштовують автентифікацію сервера самі по собі.
- Локальні шляхи call можуть використовувати `gateway.remote.*` як fallback лише коли `gateway.auth.*` не задано.
- Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef і їх не вдалося визначити, визначення завершується fail-closed (без маскування через remote fallback).
- `gateway.remote.tlsFingerprint` фіксує сертифікат remote TLS при використанні `wss://`.
- **Tailscale Serve** може автентифікувати трафік UI Control/WebSocket через identity-заголовки, коли `gateway.auth.allowTailscale: true`; endpoint-и HTTP API не
  використовують цю автентифікацію через заголовки Tailscale і натомість дотримуються звичайного режиму HTTP-auth gateway. Цей безтокеновий потік припускає, що хост gateway є довіреним. Задайте `false`, якщо хочете shared-secret автентифікацію всюди.
- Автентифікація **trusted-proxy** призначена лише для конфігурацій з identity-aware proxy поза loopback.
  Reverse proxy на тому самому хості з loopback не задовольняють `gateway.auth.mode: "trusted-proxy"`.
- Ставтеся до керування браузером як до операторського доступу: лише tailnet + навмисний pairing вузла.

Глибший розбір: [Безпека](/uk/gateway/security).

### macOS: постійний SSH-тунель через LaunchAgent

Для клієнтів macOS, які підключаються до віддаленого gateway, найпростіша постійна конфігурація використовує запис SSH-конфігурації `LocalForward` плюс LaunchAgent для підтримання тунелю після перезавантажень і збоїв.

#### Крок 1: додайте SSH-конфігурацію

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

#### Крок 3: налаштуйте токен gateway

Збережіть токен у config, щоб він переживав перезапуски:

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

Тунель автоматично стартуватиме під час входу в систему, перезапускатиметься після збою та підтримуватиме проброшений порт активним.

Примітка: якщо у вас залишився `com.openclaw.ssh-tunnel` LaunchAgent від старішої конфігурації, вивантажте й видаліть його.

#### Усунення несправностей

Перевірити, чи працює тунель:

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

Перезапустити тунель:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

Зупинити тунель:

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| Запис конфігурації                    | Що він робить                                                   |
| ------------------------------------ | --------------------------------------------------------------- |
| `LocalForward 18789 127.0.0.1:18789` | Пробрасыває локальний порт 18789 на віддалений порт 18789       |
| `ssh -N`                             | SSH без виконання віддалених команд (лише проброс портів)       |
| `KeepAlive`                          | Автоматично перезапускає тунель у разі збою                     |
| `RunAtLoad`                          | Запускає тунель, коли LaunchAgent завантажується під час входу  |
