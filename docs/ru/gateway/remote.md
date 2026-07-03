---
read_when:
    - Запуск или устранение неполадок удаленных настроек Gateway
summary: Удаленный доступ с использованием Gateway WS, SSH-туннелей и tailnets
title: Удаленный доступ
x-i18n:
    generated_at: "2026-07-03T23:39:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb6fd38698480f1dff93a6e4819082711e8e4395556a2fd85a8eb772ef6fbe31
    source_path: gateway/remote.md
    workflow: 16
---

Этот репозиторий поддерживает удаленный доступ к Gateway, удерживая один Gateway (master) запущенным на выделенном хосте (настольном компьютере/сервере) и подключая к нему клиентов.

- Для **операторов (вы / приложение macOS)**: прямой LAN/Tailnet WebSocket проще всего, когда gateway доступен; SSH-туннелирование — универсальный резервный вариант.
- Для **узлов (iOS/Android и будущие устройства)**: подключайтесь к Gateway **WebSocket** (LAN/tailnet или SSH-туннель при необходимости).

## Основная идея

- Gateway WebSocket обычно привязывается к **loopback** на настроенном порту (по умолчанию 18789).
- Для удаленного использования откройте его через Tailscale Serve или доверенную привязку LAN/Tailnet либо перенаправьте loopback-порт через SSH.

## Распространенные конфигурации VPN и tailnet

Думайте о **хосте Gateway** как о месте, где живет агент. Он владеет сессиями, профилями аутентификации, каналами и состоянием. Ваш ноутбук, настольный компьютер и узлы подключаются к этому хосту.

### Постоянно включенный Gateway в вашем tailnet

Запустите Gateway на постоянном хосте (VPS или домашнем сервере) и подключайтесь к нему через **Tailscale** или SSH.

- **Лучший UX:** оставьте `gateway.bind: "loopback"` и используйте **Tailscale Serve** для интерфейса управления.
- **Доверенная LAN/Tailnet:** привяжите gateway к приватному интерфейсу и подключайтесь напрямую с `gateway.remote.transport: "direct"`.
- **Резервный вариант:** оставьте loopback и SSH-туннель с любой машины, которой нужен доступ.
- **Примеры:** [exe.dev](/ru/install/exe-dev) (простая VM) или [Hetzner](/ru/install/hetzner) (производственный VPS).

Идеально, если ваш ноутбук часто засыпает, но вы хотите, чтобы агент всегда был включен.

### Домашний настольный компьютер запускает Gateway

Ноутбук **не** запускает агент. Он подключается удаленно:

- Используйте удаленный режим приложения macOS (Настройки → Основные → OpenClaw запускается).
- Приложение подключается напрямую, когда gateway доступен в LAN/Tailnet, или открывает и управляет SSH-туннелем, когда вы выбираете SSH.

Пошаговая инструкция: [удаленный доступ macOS](/ru/platforms/mac/remote).

### Ноутбук запускает Gateway

Оставьте Gateway локальным, но безопасно откройте доступ к нему:

- SSH-туннель к ноутбуку с других машин, или
- Tailscale Serve для интерфейса управления и Gateway только на loopback.

Руководства: [Tailscale](/ru/gateway/tailscale) и [обзор веб-интерфейса](/ru/web).

## Поток команд (что где запускается)

Одна служба gateway владеет состоянием + каналами. Узлы являются периферией.

Пример потока (Telegram → узел):

- Сообщение Telegram приходит в **Gateway**.
- Gateway запускает **агент** и решает, нужно ли вызвать инструмент узла.
- Gateway вызывает **узел** через Gateway WebSocket (`node.*` RPC).
- Узел возвращает результат; Gateway отвечает обратно в Telegram.

Примечания:

- **Узлы не запускают службу gateway.** На хост должен приходиться только один gateway, если только вы намеренно не запускаете изолированные профили (см. [несколько gateway](/ru/gateway/multiple-gateways)).
- «Режим узла» приложения macOS — это просто клиент узла поверх Gateway WebSocket.

## SSH-туннель (CLI + инструменты)

Создайте локальный туннель к удаленному Gateway WS:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Когда туннель поднят:

- `openclaw health` и `openclaw status --deep` теперь достигают удаленного gateway через `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` и `openclaw gateway call` также могут при необходимости обращаться к перенаправленному URL через `--url`.

<Note>
Замените `18789` на настроенный `gateway.port` (или `--port`, или `OPENCLAW_GATEWAY_PORT`).
</Note>

<Warning>
Когда вы передаете `--url`, CLI не использует резервно учетные данные из конфигурации или окружения. Укажите `--token` или `--password` явно. Отсутствие явных учетных данных является ошибкой.
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
В транспорте SSH-туннеля приложения macOS обнаруженные имена хостов gateway должны находиться в
`gateway.remote.sshTarget`; `gateway.remote.url` остается локальным URL туннеля.
Если эти порты различаются, задайте `gateway.remote.remotePort` равным порту gateway на
SSH-хосте.
Проверка ключа хоста по умолчанию строгая. Управляемые псевдонимы могут явно использовать
свою действующую политику доверия OpenSSH с
`gateway.remote.sshHostKeyPolicy: "openssh"`; перед включением проверьте соответствующие пользовательские и системные
настройки SSH.

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

Разрешение учетных данных Gateway следует одному общему контракту для путей call/probe/status и мониторинга Discord exec-approval. Node-host использует тот же базовый контракт с одним исключением локального режима (он намеренно игнорирует `gateway.remote.*`):

- Явные учетные данные (`--token`, `--password` или инструмент `gatewayToken`) всегда имеют приоритет на путях вызова, которые принимают явную аутентификацию.
- Безопасность переопределения URL:
  - Переопределения URL в CLI (`--url`) никогда не переиспользуют неявные учетные данные из конфигурации/окружения.
  - Переопределения URL через окружение (`OPENCLAW_GATEWAY_URL`) могут использовать только учетные данные из окружения (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Значения по умолчанию локального режима:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (удаленный резервный вариант применяется только когда локальный ввод токена аутентификации не задан)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (удаленный резервный вариант применяется только когда локальный ввод пароля аутентификации не задан)
- Значения по умолчанию удаленного режима:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Исключение локального режима Node-host: `gateway.remote.token` / `gateway.remote.password` игнорируются.
- Проверки токена для удаленных probe/status по умолчанию строгие: при нацеливании на удаленный режим они используют только `gateway.remote.token` (без резервного локального токена).
- Переопределения окружения Gateway используют только `OPENCLAW_GATEWAY_*`.

## Удаленный доступ к UI чата

WebChat больше не использует отдельный HTTP-порт. UI чата SwiftUI подключается напрямую к Gateway WebSocket.

- Перенаправьте `18789` через SSH (см. выше), затем подключайте клиентов к `ws://127.0.0.1:18789`.
- Для прямого режима LAN/Tailnet подключайте клиентов к настроенному приватному URL `ws://` или защищенному URL `wss://`.
- На macOS предпочитайте удаленный режим приложения, который автоматически управляет выбранным транспортом.

## Удаленный режим приложения macOS

Приложение строки меню macOS может полностью управлять той же конфигурацией (удаленные проверки статуса, WebChat и перенаправление Voice Wake).

Пошаговая инструкция: [удаленный доступ macOS](/ru/platforms/mac/remote).

## Правила безопасности (удаленный доступ/VPN)

Коротко: **держите Gateway только на loopback**, если вы не уверены, что вам нужна привязка.

- **Loopback + SSH/Tailscale Serve** — самый безопасный вариант по умолчанию (без публичного доступа).
- Открытый `ws://` принимается для loopback, LAN, link-local, `.local`, `.ts.net` и хостов Tailscale CGNAT. Публичные удаленные хосты должны использовать `wss://`.
- **Привязки не к loopback** (`lan`/`tailnet`/`custom` или `auto`, когда loopback недоступен) должны использовать аутентификацию gateway: токен, пароль или reverse proxy с поддержкой идентичности и `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` являются источниками учетных данных клиента. Сами по себе они **не** настраивают серверную аутентификацию.
- Локальные пути вызова могут использовать `gateway.remote.*` как резервный вариант только когда `gateway.auth.*` не задан.
- Если `gateway.auth.token` / `gateway.auth.password` явно настроены через SecretRef и не разрешены, разрешение завершается закрыто (без маскирующего удаленного резервного варианта).
- `gateway.remote.tlsFingerprint` закрепляет удаленный TLS-сертификат при использовании `wss://`, включая прямой режим macOS. Без настроенного или ранее сохраненного закрепления macOS закрепляет сертификат при первом использовании только после успешной обычной системной проверки доверия; gateway с самоподписанными сертификатами или частным CA, которым macOS еще не доверяет, требуют явный fingerprint или удаленный доступ через SSH.
- **Tailscale Serve** может аутентифицировать трафик интерфейса управления/WebSocket через заголовки идентичности,
  когда `gateway.auth.allowTailscale: true`; конечные точки HTTP API не
  используют эту аутентификацию заголовками Tailscale и вместо этого следуют обычному режиму HTTP-аутентификации
  gateway. Этот поток без токена предполагает, что хост gateway доверенный. Установите
  `false`, если хотите аутентификацию общим секретом везде.
- Аутентификация **trusted-proxy** по умолчанию ожидает настройки reverse proxy с поддержкой идентичности не на loopback.
  Reverse proxy на том же хосте через loopback требуют явного `gateway.auth.trustedProxy.allowLoopback = true`.
- Относитесь к управлению из браузера как к операторскому доступу: только tailnet + осознанное сопряжение узлов.

Подробно: [безопасность](/ru/gateway/security).

### macOS: постоянный SSH-туннель через LaunchAgent

Для клиентов macOS, подключающихся к удаленному gateway, самая простая постоянная конфигурация использует запись SSH `LocalForward` плюс LaunchAgent, чтобы туннель оставался живым после перезагрузок и сбоев.

#### Шаг 1: добавьте конфигурацию SSH

Отредактируйте `~/.ssh/config`:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

Замените `<REMOTE_IP>` и `<REMOTE_USER>` своими значениями.

#### Шаг 2: скопируйте SSH-ключ (один раз)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### Шаг 3: настройте токен gateway

Сохраните токен в конфигурации, чтобы он сохранялся между перезапусками:

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

Туннель будет автоматически запускаться при входе в систему, перезапускаться при сбое и поддерживать перенаправленный порт активным.

<Note>
Если у вас остался LaunchAgent `com.openclaw.ssh-tunnel` от более старой конфигурации, выгрузите и удалите его.
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

| Запись конфигурации                  | Что она делает                                               |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | Перенаправляет локальный порт 18789 на удаленный порт 18789  |
| `ssh -N`                             | SSH без выполнения удаленных команд (только перенаправление портов) |
| `KeepAlive`                          | Автоматически перезапускает туннель при сбое                 |
| `RunAtLoad`                          | Запускает туннель, когда LaunchAgent загружается при входе   |

## Связанные материалы

- [Tailscale](/ru/gateway/tailscale)
- [Аутентификация](/ru/gateway/authentication)
- [Настройка удаленного gateway](/ru/gateway/remote-gateway-readme)
