---
read_when:
    - Вы хотите быстро связать мобильное приложение Node с Gateway
    - Вам нужен вывод setup-code для удаленного или ручного предоставления доступа
summary: Справочник CLI для `openclaw qr` (создание QR-кода для сопряжения мобильного устройства + код настройки)
title: QR
x-i18n:
    generated_at: "2026-07-03T17:34:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2a0d71fb7be0734a015084bfb5edef74953310d384964eab9cccbabf7c497e3
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

Создайте QR-код для мобильного сопряжения и код настройки из текущей конфигурации Gateway.

## Использование

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## Параметры

- `--remote`: предпочитать `gateway.remote.url`; если он не задан, `gateway.tailscale.mode=serve|funnel` все равно может предоставить удаленный публичный URL
- `--url <url>`: переопределить URL Gateway, используемый в полезной нагрузке
- `--public-url <url>`: переопределить публичный URL, используемый в полезной нагрузке
- `--token <token>`: переопределить токен Gateway, с которым аутентифицируется процесс начальной загрузки
- `--password <password>`: переопределить пароль Gateway, с которым аутентифицируется процесс начальной загрузки
- `--setup-code-only`: вывести только код настройки
- `--no-ascii`: пропустить отрисовку ASCII QR
- `--json`: вывести JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Примечания

- `--token` и `--password` являются взаимоисключающими.
- Сам код настройки теперь содержит непрозрачный короткоживущий `bootstrapToken`, а не общий токен/пароль Gateway.
- Встроенная начальная загрузка через код настройки возвращает основной токен `node` с `scopes: []` и ограниченный токен передачи `operator` для доверенной мобильной настройки.
- Переданный токен оператора ограничен `operator.approvals`, `operator.read`, `operator.talk.secrets` и `operator.write`; области изменения сопряжения и `operator.admin` по-прежнему требуют отдельного утвержденного сопряжения оператора или процесса получения токена.
- Мобильное сопряжение отказывает в закрытом режиме для URL Gateway `ws://` через Tailscale/публичный доступ. Частные LAN-адреса и хосты Bonjour `.local` по-прежнему поддерживаются через `ws://`, но мобильные маршруты Tailscale/публичного доступа должны использовать Tailscale Serve/Funnel или URL Gateway `wss://`.
- С `--remote` OpenClaw требует либо `gateway.remote.url`, либо
  `gateway.tailscale.mode=serve|funnel`.
- С `--remote`, если фактически активные удаленные учетные данные настроены как SecretRefs и вы не передаете `--token` или `--password`, команда разрешает их из активного снимка Gateway. Если Gateway недоступен, команда быстро завершается с ошибкой.
- Без `--remote` SecretRefs локальной аутентификации Gateway разрешаются, когда не передано CLI-переопределение аутентификации:
  - `gateway.auth.token` разрешается, когда аутентификация по токену может иметь приоритет (явный `gateway.auth.mode="token"` или выведенный режим, в котором ни один источник пароля не имеет приоритета).
  - `gateway.auth.password` разрешается, когда аутентификация по паролю может иметь приоритет (явный `gateway.auth.mode="password"` или выведенный режим без приоритетного токена из auth/env).
- Если настроены и `gateway.auth.token`, и `gateway.auth.password` (включая SecretRefs), а `gateway.auth.mode` не задан, разрешение кода настройки завершается ошибкой, пока режим не будет задан явно.
- Примечание о расхождении версий Gateway: этот путь команды требует Gateway с поддержкой `secrets.resolve`; более старые Gateway возвращают ошибку неизвестного метода.
- После сканирования утвердите сопряжение устройства с помощью:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## Связанные материалы

- [Справочник CLI](/ru/cli)
- [Сопряжение](/ru/cli/pairing)
