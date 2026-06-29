---
read_when:
    - Запуск безголового хоста Node
    - Сопряжение узла не на macOS для `system.run`
summary: Справочник CLI для `openclaw node` (хост узла без графического интерфейса)
title: Node
x-i18n:
    generated_at: "2026-06-28T22:44:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 03a1b02e90f8f5f7edcfb2e7fd75ef0cbbdeae79dc0ce91339f31a80daeaaa92
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Запустите **headless-хост Node**, который подключается к Gateway WebSocket и предоставляет
`system.run` / `system.which` на этой машине.

## Зачем использовать хост Node?

Используйте хост Node, когда хотите, чтобы агенты **запускали команды на других машинах** в вашей
сети без установки там полноценного сопутствующего приложения для macOS.

Типичные случаи использования:

- Запуск команд на удаленных Linux/Windows-машинах (серверы сборки, лабораторные машины, NAS).
- Оставить exec **изолированным в песочнице** на Gateway, но делегировать одобренные запуски другим хостам.
- Предоставить легковесную headless-цель выполнения для автоматизации или CI-узлов.

Выполнение по-прежнему защищено **одобрениями exec** и allowlist для каждого агента на
хосте Node, поэтому доступ к командам остается ограниченным и явным.

## Браузерный прокси (нулевая настройка)

Хосты Node автоматически объявляют браузерный прокси, если `browser.enabled` не
отключен на узле. Это позволяет агенту использовать браузерную автоматизацию на этом узле
без дополнительной настройки.

По умолчанию прокси предоставляет обычную поверхность браузерного профиля узла. Если вы
зададите `nodeHost.browserProxy.allowProfiles`, прокси станет ограничительным:
нацеливание на профили вне allowlist будет отклоняться, а маршруты создания/удаления
постоянных профилей будут блокироваться через прокси.

При необходимости отключите это на узле:

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## Запуск (на переднем плане)

```bash
openclaw node run --host <gateway-host> --port 18789
```

Параметры:

- `--host <host>`: хост Gateway WebSocket (по умолчанию: `127.0.0.1`)
- `--port <port>`: порт Gateway WebSocket (по умолчанию: `18789`)
- `--tls`: использовать TLS для подключения к Gateway
- `--tls-fingerprint <sha256>`: ожидаемый отпечаток TLS-сертификата (sha256)
- `--node-id <id>`: переопределить id узла (очищает токен сопряжения)
- `--display-name <name>`: переопределить отображаемое имя узла

## Аутентификация Gateway для хоста Node

`openclaw node run` и `openclaw node install` определяют аутентификацию Gateway из config/env (флагов `--token`/`--password` у команд node нет):

- Сначала проверяются `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Затем локальный резервный вариант config: `gateway.auth.token` / `gateway.auth.password`.
- В локальном режиме хост Node намеренно не наследует `gateway.remote.token` / `gateway.remote.password`.
- Если `gateway.auth.token` / `gateway.auth.password` явно настроен через SecretRef и не разрешен, разрешение аутентификации Node завершается fail-closed (без маскировки удаленным резервным вариантом).
- В `gateway.mode=remote` поля удаленного клиента (`gateway.remote.token` / `gateway.remote.password`) также допустимы согласно правилам удаленного приоритета.
- Разрешение аутентификации хоста Node учитывает только env vars `OPENCLAW_GATEWAY_*`.

Для узла, подключающегося к plaintext `ws://` Gateway, принимаются loopback, литералы
частных IP, `.local` и хосты Tailnet `*.ts.net`. Для других доверенных
частных DNS-имен задайте `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`; без этого
запуск узла завершится fail-closed и попросит использовать `wss://`, SSH-туннель или
Tailscale. Это opt-in через окружение процесса, а не ключ config
`openclaw.json`.
`openclaw node install` сохраняет его в контролируемый сервис узла, когда он
присутствует в окружении команды установки.

## Сервис (в фоне)

Установите headless-хост Node как пользовательский сервис.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Параметры:

- `--host <host>`: хост Gateway WebSocket (по умолчанию: `127.0.0.1`)
- `--port <port>`: порт Gateway WebSocket (по умолчанию: `18789`)
- `--tls`: использовать TLS для подключения к Gateway
- `--tls-fingerprint <sha256>`: ожидаемый отпечаток TLS-сертификата (sha256)
- `--node-id <id>`: переопределить id узла (очищает токен сопряжения)
- `--display-name <name>`: переопределить отображаемое имя узла
- `--runtime <runtime>`: среда выполнения сервиса (`node` или `bun`)
- `--force`: переустановить/перезаписать, если уже установлено

Управление сервисом:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Используйте `openclaw node run` для хоста Node на переднем плане (без сервиса).

Команды сервиса принимают `--json` для машиночитаемого вывода.

Хост Node повторно пытается подключиться при перезапуске Gateway и сетевых закрытиях внутри процесса. Если
Gateway сообщает о терминальной паузе аутентификации токена/пароля/bootstrap, хост Node
записывает детали закрытия в журнал и завершается с ненулевым кодом, чтобы launchd/systemd мог перезапустить его со
свежими config и учетными данными. Паузы, требующие сопряжения, остаются в потоке
переднего плана, чтобы ожидающий запрос можно было одобрить.

## Сопряжение

Первое подключение создает на Gateway ожидающий запрос сопряжения устройства (`role: node`).
Одобрите его через:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

В строго контролируемых сетях узлов оператор Gateway может явно включить
автоодобрение первичного сопряжения узлов из доверенных CIDR:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

По умолчанию это отключено. Это применяется только к новому сопряжению `role: node`
без запрошенных scopes. Клиенты оператора/браузера, Control UI, WebChat, а также обновления роли,
scope, metadata или public-key по-прежнему требуют ручного одобрения.

Если узел повторяет сопряжение с измененными данными аутентификации (role/scopes/public key),
предыдущий ожидающий запрос заменяется, и создается новый `requestId`.
Перед одобрением снова выполните `openclaw devices list`.

Хост Node хранит свой id узла, токен, отображаемое имя и сведения о подключении к Gateway в
`~/.openclaw/node.json`.

## Одобрения exec

`system.run` защищен локальными одобрениями exec:

- `$OPENCLAW_STATE_DIR/exec-approvals.json` или
  `~/.openclaw/exec-approvals.json`, если переменная не задана
- [Одобрения exec](/ru/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (редактирование с Gateway)

Для одобренного асинхронного exec на узле OpenClaw подготавливает канонический `systemRunPlan`
перед запросом. Последующая одобренная пересылка `system.run` повторно использует этот сохраненный
план, поэтому изменения полей command/cwd/session после создания запроса
одобрения отклоняются, а не меняют то, что выполняет узел.

## См. также

- [Справочник CLI](/ru/cli)
- [Узлы](/ru/nodes)
