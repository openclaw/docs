---
read_when:
    - Запуск або усунення несправностей віддалених конфігурацій gateway
summary: Віддалений доступ за допомогою SSH-тунелів (Gateway WS) і tailnet
title: Віддалений доступ
x-i18n:
    generated_at: "2026-04-24T18:10:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 91f53a1f6798f56b3752c96c01f6944c4b5e9ee649ae58975a2669a099203e40
    source_path: gateway/remote.md
    workflow: 15
---

Цей репозиторій підтримує “віддалено через SSH”, зберігаючи один Gateway (основний) запущеним на виділеному хості (настільний ПК/сервер) і підключаючи до нього клієнти.

- Для **операторів (вас / застосунку macOS)**: SSH-тунелювання — універсальний резервний варіант.
- Для **Node (iOS/Android і майбутніх пристроїв)**: підключайтеся до **WebSocket** Gateway (LAN/tailnet або SSH-тунель за потреби).

## Основна ідея

- WebSocket Gateway прив’язується до **loopback** на налаштованому порту (типово 18789).
- Для віддаленого використання ви переспрямовуєте цей loopback-порт через SSH (або використовуєте tailnet/VPN і менше покладаєтеся на тунелювання).

## Поширені конфігурації VPN/tailnet (де живе агент)

Сприймайте **хост Gateway** як місце, “де живе агент”. Він володіє сесіями, профілями автентифікації, каналами та станом.
Ваш ноутбук/настільний ПК (і Node) підключаються до цього хоста.

### 1) Завжди увімкнений Gateway у вашому tailnet (VPS або домашній сервер)

Запустіть Gateway на постійному хості та звертайтеся до нього через **Tailscale** або SSH.

- **Найкращий UX:** залиште `gateway.bind: "loopback"` і використовуйте **Tailscale Serve** для Control UI.
- **Резервний варіант:** залиште loopback + SSH-тунель з будь-якої машини, якій потрібен доступ.
- **Приклади:** [exe.dev](/uk/install/exe-dev) (проста VM) або [Hetzner](/uk/install/hetzner) (production VPS).

Це ідеально, коли ваш ноутбук часто переходить у сон, але ви хочете, щоб агент був завжди увімкнений.

### 2) Домашній настільний ПК запускає Gateway, ноутбук — віддалене керування

Ноутбук **не** запускає агента. Він підключається віддалено:

- Використовуйте режим **Remote over SSH** у застосунку macOS (Settings → General → “OpenClaw runs”).
- Застосунок відкриває та керує тунелем, тому WebChat + перевірки стану “просто працюють”.

Runbook: [віддалений доступ macOS](/uk/platforms/mac/remote).

### 3) Ноутбук запускає Gateway, віддалений доступ з інших машин

Залишайте Gateway локальним, але безпечно відкривайте до нього доступ:

- SSH-тунель до ноутбука з інших машин, або
- Tailscale Serve для Control UI, залишаючи Gateway доступним лише через loopback.

Посібник: [Tailscale](/uk/gateway/tailscale) і [огляд Web](/uk/web).

## Потік команд (що де запускається)

Один сервіс gateway володіє станом і каналами. Node — це периферія.

Приклад потоку (Telegram → Node):

- Повідомлення Telegram надходить до **Gateway**.
- Gateway запускає **агента** і вирішує, чи викликати інструмент Node.
- Gateway викликає **Node** через WebSocket Gateway (RPC `node.*`).
- Node повертає результат; Gateway надсилає відповідь назад у Telegram.

Примітки:

- **Node не запускають сервіс gateway.** На одному хості має працювати лише один gateway, якщо ви свідомо не запускаєте ізольовані профілі (див. [Кілька Gateway](/uk/gateway/multiple-gateways)).
- “Режим Node” у застосунку macOS — це просто клієнт Node через WebSocket Gateway.

## SSH-тунель (CLI + інструменти)

Створіть локальний тунель до віддаленого WS Gateway:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Коли тунель піднято:

- `openclaw health` і `openclaw status --deep` тепер досягають віддаленого gateway через `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` і `openclaw gateway call` також можуть звертатися до переспрямованого URL через `--url`, коли це потрібно.

Примітка: замініть `18789` на ваше налаштоване значення `gateway.port` (або `--port`/`OPENCLAW_GATEWAY_PORT`).
Примітка: коли ви передаєте `--url`, CLI не використовує резервний варіант із конфігурації або облікових даних середовища.
Явно вкажіть `--token` або `--password`. Відсутність явно заданих облікових даних є помилкою.

## Типові віддалені параметри CLI

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

Логіка визначення облікових даних Gateway дотримується одного спільного контракту для шляхів call/probe/status і моніторингу Discord exec-approval. Node-host використовує той самий базовий контракт з одним винятком для локального режиму (він навмисно ігнорує `gateway.remote.*`):

- Явно передані облікові дані (`--token`, `--password` або `gatewayToken` інструмента) завжди мають найвищий пріоритет у шляхах call, які приймають явну автентифікацію.
- Безпека перевизначення URL:
  - Перевизначення URL у CLI (`--url`) ніколи не використовують неявні облікові дані з config/env.
  - Перевизначення URL через env (`OPENCLAW_GATEWAY_URL`) можуть використовувати лише облікові дані з env (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Типові параметри локального режиму:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (віддалений резервний варіант застосовується лише тоді, коли локальне джерело токена автентифікації не задане)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (віддалений резервний варіант застосовується лише тоді, коли локальне джерело пароля автентифікації не задане)
- Типові параметри віддаленого режиму:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Виняток локального режиму для Node-host: `gateway.remote.token` / `gateway.remote.password` ігноруються.
- Перевірки token у віддалених probe/status за замовчуванням суворі: вони використовують лише `gateway.remote.token` (без резервного варіанта локального токена) при зверненні до віддаленого режиму.
- Перевизначення env для Gateway використовують лише `OPENCLAW_GATEWAY_*`.

## Chat UI через SSH

WebChat більше не використовує окремий HTTP-порт. SwiftUI chat UI підключається безпосередньо до WebSocket Gateway.

- Переспрямуйте `18789` через SSH (див. вище), а потім підключайте клієнти до `ws://127.0.0.1:18789`.
- На macOS надавайте перевагу режиму “Remote over SSH” у застосунку, який автоматично керує тунелем.

## macOS app "Remote over SSH"

Застосунок у рядку меню macOS може керувати тією самою конфігурацією наскрізно (віддалені перевірки стану, WebChat і переспрямування Voice Wake).

Runbook: [віддалений доступ macOS](/uk/platforms/mac/remote).

## Правила безпеки (remote/VPN)

Коротко: **залишайте Gateway доступним лише через loopback**, якщо ви не впевнені, що вам потрібна прив’язка.

- **Loopback + SSH/Tailscale Serve** — найбезпечніший стандартний варіант (без публічної експозиції).
- Простий `ws://` типово дозволений лише для loopback. Для довірених приватних мереж
  встановіть `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` у процесі клієнта як
  аварійний виняток. Еквівалента в `openclaw.json` немає; це має бути змінна
  середовища процесу клієнта, який встановлює WebSocket-з’єднання.
- **Прив’язки не до loopback** (`lan`/`tailnet`/`custom` або `auto`, коли loopback недоступний) мають використовувати автентифікацію gateway: token, password або reverse proxy з урахуванням ідентичності з `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` — це джерела облікових даних клієнта. Вони **не** налаштовують автентифікацію сервера самі по собі.
- Локальні шляхи call можуть використовувати `gateway.remote.*` як резервний варіант лише тоді, коли `gateway.auth.*` не задано.
- Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef, але не розв’язано, розв’язання завершується в закритому режимі (без маскування віддаленим резервним варіантом).
- `gateway.remote.tlsFingerprint` фіксує віддалений TLS-сертифікат при використанні `wss://`.
- **Tailscale Serve** може автентифікувати трафік Control UI/WebSocket через заголовки
  ідентичності, коли `gateway.auth.allowTailscale: true`; кінцеві точки HTTP API не
  використовують цю автентифікацію заголовками Tailscale і натомість дотримуються
  звичайного режиму HTTP-автентифікації gateway. Цей безтокеновий потік передбачає, що
  хост gateway є довіреним. Встановіть `false`, якщо хочете всюди використовувати
  автентифікацію зі спільним секретом.
- Автентифікація **trusted-proxy** призначена лише для конфігурацій identity-aware proxy без loopback.
  Reverse proxy на тому самому хості через loopback не відповідають `gateway.auth.mode: "trusted-proxy"`.
- Ставтеся до керування browser так само, як до операторського доступу: лише tailnet + свідоме сполучення Node.

Детальніше: [Безпека](/uk/gateway/security).

### macOS: постійний SSH-тунель через LaunchAgent

Для клієнтів macOS, що підключаються до віддаленого gateway, найпростіша постійна конфігурація використовує запис SSH `LocalForward` у config разом із LaunchAgent, щоб підтримувати тунель активним після перезавантажень і збоїв.

#### Крок 1: додайте SSH config

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

Збережіть token у config, щоб він зберігався після перезапусків:

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

Тунель автоматично запускатиметься під час входу в систему, перезапускатиметься після збою та підтримуватиме активність переспрямованого порту.

Примітка: якщо у вас залишився `com.openclaw.ssh-tunnel` LaunchAgent зі старішої конфігурації, вивантажте та видаліть його.

#### Усунення несправностей

Перевірте, чи працює тунель:

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

| Запис config                         | Що він робить                                                |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | Переспрямовує локальний порт 18789 на віддалений порт 18789  |
| `ssh -N`                             | SSH без виконання віддалених команд (лише переспрямування портів) |
| `KeepAlive`                          | Автоматично перезапускає тунель у разі збою                  |
| `RunAtLoad`                          | Запускає тунель, коли LaunchAgent завантажується під час входу |

## Пов’язане

- [Tailscale](/uk/gateway/tailscale)
- [Автентифікація](/uk/gateway/authentication)
- [Налаштування віддаленого gateway](/uk/gateway/remote-gateway-readme)
