---
read_when:
    - Запуск или устранение неполадок удаленных настроек Gateway
summary: Удаленный доступ через Gateway WS, SSH-туннели и tailnet-сети
title: Удаленный доступ
x-i18n:
    generated_at: "2026-06-28T22:59:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f5f885026fe76acb46f49955c6e485e08714a5cc5e90c165d20e25cea1acf864
    source_path: gateway/remote.md
    workflow: 16
---

Этот репозиторий поддерживает удаленный доступ к Gateway, сохраняя один Gateway (главный) запущенным на выделенном хосте (настольном компьютере/сервере) и подключая к нему клиенты.

- Для **операторов (вас / приложения macOS)**: прямой WebSocket по LAN/Tailnet проще всего, когда gateway доступен; SSH-туннелирование — универсальный резервный вариант.
- Для **узлов (iOS/Android и будущих устройств)**: подключайтесь к **WebSocket** Gateway (LAN/tailnet или SSH-туннель по необходимости).

## Основная идея

- WebSocket Gateway обычно привязывается к **loopback** на настроенном порту (по умолчанию 18789).
- Для удаленного использования откройте его через Tailscale Serve или доверенную привязку LAN/Tailnet, либо пробросьте loopback-порт через SSH.

## Распространенные схемы VPN и tailnet

Думайте о **хосте Gateway** как о месте, где живет агент. Он владеет сеансами, профилями авторизации, каналами и состоянием. Ваш ноутбук, настольный компьютер и узлы подключаются к этому хосту.

### Постоянно включенный Gateway в вашем tailnet

Запустите Gateway на постоянном хосте (VPS или домашнем сервере) и подключайтесь к нему через **Tailscale** или SSH.

- **Лучший UX:** оставьте `gateway.bind: "loopback"` и используйте **Tailscale Serve** для Control UI.
- **Доверенная LAN/Tailnet:** привяжите gateway к частному интерфейсу и подключайтесь напрямую с `gateway.remote.transport: "direct"`.
- **Резервный вариант:** оставьте loopback плюс SSH-туннель с любой машины, которой нужен доступ.
- **Примеры:** [exe.dev](/ru/install/exe-dev) (простая ВМ) или [Hetzner](/ru/install/hetzner) (производственный VPS).

Идеально, когда ваш ноутбук часто засыпает, но вы хотите, чтобы агент был всегда включен.

### Домашний настольный компьютер запускает Gateway

Ноутбук **не** запускает агент. Он подключается удаленно:

- Используйте удаленный режим приложения macOS (Settings → General → OpenClaw runs).
- Приложение подключается напрямую, когда gateway доступен в LAN/Tailnet, или открывает и управляет SSH-туннелем, когда вы выбираете SSH.

Runbook: [удаленный доступ macOS](/ru/platforms/mac/remote).

### Ноутбук запускает Gateway

Оставьте Gateway локальным, но безопасно откройте к нему доступ:

- SSH-туннель к ноутбуку с других машин, или
- Tailscale Serve для Control UI, оставив Gateway доступным только через loopback.

Руководства: [Tailscale](/ru/gateway/tailscale) и [веб-обзор](/ru/web).

## Поток команд (что где выполняется)

Одна служба gateway владеет состоянием и каналами. Узлы являются периферийными устройствами.

Пример потока (Telegram → узел):

- Сообщение Telegram приходит в **Gateway**.
- Gateway запускает **агент** и решает, нужно ли вызвать инструмент узла.
- Gateway вызывает **узел** через WebSocket Gateway (`node.*` RPC).
- Узел возвращает результат; Gateway отправляет ответ обратно в Telegram.

Примечания:

- **Узлы не запускают службу gateway.** На одном хосте должен работать только один gateway, если вы не запускаете изолированные профили намеренно (см. [несколько gateway](/ru/gateway/multiple-gateways)).
- «Режим узла» в приложении macOS — это просто клиент узла поверх WebSocket Gateway.

## SSH-туннель (CLI + инструменты)

Создайте локальный туннель к удаленному Gateway WS:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Когда туннель поднят:

- `openclaw health` и `openclaw status --deep` теперь обращаются к удаленному gateway через `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` и `openclaw gateway call` также могут при необходимости указывать на проброшенный URL через `--url`.

<Note>
Замените `18789` на настроенный `gateway.port` (или `--port`, или `OPENCLAW_GATEWAY_PORT`).
</Note>

<Warning>
Когда вы передаете `--url`, CLI не откатывается к учетным данным из конфигурации или окружения. Явно укажите `--token` или `--password`. Отсутствие явных учетных данных является ошибкой.
</Warning>

## Удаленные значения по умолчанию для CLI

Вы можете сохранить удаленную цель, чтобы команды CLI использовали ее по умолчанию:

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

Когда gateway доступен только через loopback, оставьте URL `ws://127.0.0.1:18789` и сначала откройте SSH-туннель.
В SSH-туннельном транспорте приложения macOS обнаруженные имена хостов gateway должны быть в
`gateway.remote.sshTarget`; `gateway.remote.url` остается URL локального туннеля.
Если эти порты отличаются, задайте `gateway.remote.remotePort` равным порту gateway на
SSH-хосте.

Для gateway, уже доступного в доверенной LAN или Tailnet, используйте прямой режим:

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

## Приоритет учетных данных

Разрешение учетных данных Gateway следует одному общему контракту для путей call/probe/status и мониторинга exec-approval в Discord. Node-host использует тот же базовый контракт с одним исключением для локального режима (он намеренно игнорирует `gateway.remote.*`):

- Явные учетные данные (`--token`, `--password` или `gatewayToken` инструмента) всегда имеют приоритет на путях вызова, которые принимают явную авторизацию.
- Безопасность переопределения URL:
  - Переопределения URL в CLI (`--url`) никогда не используют неявные учетные данные из config/env повторно.
  - Переопределения URL из env (`OPENCLAW_GATEWAY_URL`) могут использовать только учетные данные env (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Значения по умолчанию в локальном режиме:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (удаленный резерв применяется только когда локальный входной auth token не задан)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (удаленный резерв применяется только когда локальный входной auth password не задан)
- Значения по умолчанию в удаленном режиме:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Исключение локального режима Node-host: `gateway.remote.token` / `gateway.remote.password` игнорируются.
- Проверки token для удаленных probe/status по умолчанию строгие: при работе с удаленным режимом они используют только `gateway.remote.token` (без резервного перехода к локальному token).
- Переопределения env для Gateway используют только `OPENCLAW_GATEWAY_*`.

## Удаленный доступ Chat UI

WebChat больше не использует отдельный HTTP-порт. SwiftUI chat UI подключается напрямую к WebSocket Gateway.

- Пробросьте `18789` через SSH (см. выше), затем подключайте клиентов к `ws://127.0.0.1:18789`.
- Для прямого режима LAN/Tailnet подключайте клиентов к настроенному частному URL `ws://` или защищенному URL `wss://`.
- На macOS предпочитайте удаленный режим приложения, который автоматически управляет выбранным транспортом.

## Удаленный режим приложения macOS

Приложение строки меню macOS может управлять той же схемой от начала до конца (удаленные проверки состояния, WebChat и проброс Voice Wake).

Runbook: [удаленный доступ macOS](/ru/platforms/mac/remote).

## Правила безопасности (удаленный доступ/VPN)

Коротко: **оставляйте Gateway доступным только через loopback**, если вы не уверены, что вам нужна привязка.

- **Loopback + SSH/Tailscale Serve** — самый безопасный вариант по умолчанию (без публичного доступа).
- Открытый `ws://` принимается для loopback, LAN, link-local, `.local`, `.ts.net` и хостов Tailscale CGNAT. Публичные удаленные хосты должны использовать `wss://`.
- **Привязки не к loopback** (`lan`/`tailnet`/`custom` или `auto`, когда loopback недоступен) должны использовать auth gateway: token, password или identity-aware reverse proxy с `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` являются источниками учетных данных клиента. Сами по себе они **не** настраивают auth сервера.
- Локальные пути вызова могут использовать `gateway.remote.*` как резерв только когда `gateway.auth.*` не задан.
- Если `gateway.auth.token` / `gateway.auth.password` явно настроен через SecretRef и не разрешен, разрешение завершается закрыто (без маскировки удаленным резервом).
- `gateway.remote.tlsFingerprint` закрепляет удаленный TLS-сертификат при использовании `wss://`, включая прямой режим macOS. Без настроенного или ранее сохраненного закрепления macOS закрепляет сертификат при первом использовании только после прохождения обычной системной проверки доверия; gateway с самоподписанными сертификатами или частным CA, которым macOS еще не доверяет, требуют явный fingerprint или Remote over SSH.
- **Tailscale Serve** может аутентифицировать трафик Control UI/WebSocket через identity
  headers, когда `gateway.auth.allowTailscale: true`; конечные точки HTTP API не
  используют эту Tailscale header auth и вместо этого следуют обычному HTTP
  auth-режиму gateway. Этот поток без token предполагает, что хост gateway доверенный. Установите
  `false`, если хотите shared-secret auth везде.
- **Trusted-proxy** auth по умолчанию ожидает настройки non-loopback identity-aware proxy.
  Same-host loopback reverse proxies требуют явного `gateway.auth.trustedProxy.allowLoopback = true`.
- Относитесь к управлению из браузера как к операторскому доступу: только tailnet + осознанное сопряжение узлов.

Подробно: [безопасность](/ru/gateway/security).

### macOS: постоянный SSH-туннель через LaunchAgent

Для клиентов macOS, подключающихся к удаленному gateway, самая простая постоянная настройка использует запись SSH `LocalForward` в конфигурации плюс LaunchAgent, чтобы поддерживать туннель живым после перезагрузок и сбоев.

#### Шаг 1: добавьте конфигурацию SSH

Отредактируйте `~/.ssh/config`:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

Замените `<REMOTE_IP>` и `<REMOTE_USER>` на свои значения.

#### Шаг 2: скопируйте SSH-ключ (один раз)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### Шаг 3: настройте token gateway

Сохраните token в конфигурации, чтобы он сохранялся после перезапусков:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### Шаг 4: создайте LaunchAgent

Сохраните это как `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`:

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

#### Шаг 5: загрузите LaunchAgent

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

Туннель будет автоматически запускаться при входе в систему, перезапускаться при сбое и поддерживать проброшенный порт активным.

<Note>
Если у вас остался LaunchAgent `com.openclaw.ssh-tunnel` от старой настройки, выгрузите и удалите его.
</Note>

#### Устранение неполадок

Проверьте, запущен ли туннель:

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

Перезапустите туннель:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

Остановите туннель:

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| Запись конфигурации                  | Что она делает                                              |
| ------------------------------------ | ----------------------------------------------------------- |
| `LocalForward 18789 127.0.0.1:18789` | Пробрасывает локальный порт 18789 на удаленный порт 18789   |
| `ssh -N`                             | SSH без выполнения удаленных команд (только проброс портов) |
| `KeepAlive`                          | Автоматически перезапускает туннель, если он аварийно завершился |
| `RunAtLoad`                          | Запускает туннель при загрузке LaunchAgent во время входа в систему |

## Связанные материалы

- [Tailscale](/ru/gateway/tailscale)
- [Аутентификация](/ru/gateway/authentication)
- [Настройка удаленного gateway](/ru/gateway/remote-gateway-readme)
