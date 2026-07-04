---
read_when:
    - Вы хотите быстро связать мобильное приложение Node с Gateway
    - Вам нужен вывод setup-code для удаленного или ручного предоставления доступа
summary: Справочник CLI для `openclaw qr` (создать QR-код сопряжения с мобильным устройством + код настройки)
title: QR
x-i18n:
    generated_at: "2026-07-04T18:12:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81d15c9d551960c6f5677649b481e447ecda55a395957746959b4ecf81712bdb
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

Сгенерируйте QR-код сопряжения для мобильного устройства и код настройки из текущей конфигурации Gateway.

## Использование

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## Параметры

- `--remote`: предпочитать `gateway.remote.url`; если он не задан, `gateway.tailscale.mode=serve|funnel` всё равно может предоставить удалённый публичный URL
- `--url <url>`: переопределить URL Gateway, используемый в полезной нагрузке
- `--public-url <url>`: переопределить публичный URL, используемый в полезной нагрузке
- `--token <token>`: переопределить токен Gateway, по которому поток начальной загрузки выполняет аутентификацию
- `--password <password>`: переопределить пароль Gateway, по которому поток начальной загрузки выполняет аутентификацию
- `--setup-code-only`: вывести только код настройки
- `--no-ascii`: пропустить отрисовку ASCII QR
- `--json`: вывести JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Примечания

- `--token` и `--password` являются взаимоисключающими.
- Сам код настройки теперь содержит непрозрачный краткоживущий `bootstrapToken`, а не общий токен/пароль Gateway.
- Встроенная начальная загрузка по коду настройки возвращает основной токен `node` с `scopes: []` и ограниченный токен передачи управления `operator` для доверенной мобильной регистрации.
- Переданный токен оператора ограничен `operator.approvals`, `operator.read`, `operator.talk.secrets` и `operator.write`; области мутаций сопряжения и `operator.admin` всё ещё требуют отдельного одобренного сопряжения оператора или потока токена.
- Мобильное сопряжение закрыто отклоняет Tailscale/публичные URL Gateway с `ws://`. Частные адреса LAN и хосты Bonjour `.local` по-прежнему поддерживаются через `ws://`, но Tailscale/публичные мобильные маршруты должны использовать Tailscale Serve/Funnel или URL Gateway с `wss://`.
- С `--remote` OpenClaw требует либо `gateway.remote.url`, либо
  `gateway.tailscale.mode=serve|funnel`.
- С `--remote`, если фактически активные удалённые учётные данные настроены как SecretRefs и вы не передаёте `--token` или `--password`, команда разрешает их из активного снимка Gateway. Если Gateway недоступен, команда быстро завершается с ошибкой.
- Без `--remote` SecretRefs локальной аутентификации Gateway разрешаются, когда не передано переопределение аутентификации CLI:
  - `gateway.auth.token` разрешается, когда токенная аутентификация может победить (явный `gateway.auth.mode="token"` или выведенный режим, в котором не побеждает ни один источник пароля).
  - `gateway.auth.password` разрешается, когда парольная аутентификация может победить (явный `gateway.auth.mode="password"` или выведенный режим без победившего токена из auth/env).
- Если настроены и `gateway.auth.token`, и `gateway.auth.password` (включая SecretRefs), а `gateway.auth.mode` не задан, разрешение кода настройки завершается ошибкой, пока режим не будет задан явно.
- Примечание о расхождении версий Gateway: этот путь команды требует Gateway с поддержкой `secrets.resolve`; более старые Gateway возвращают ошибку неизвестного метода.
- Официальные приложения OpenClaw для iOS и Android подключаются автоматически, когда их
  метаданные кода настройки совпадают. Если запрос остаётся ожидающим (например, для
  неофициального клиента или при несовпадении метаданных), проверьте и одобрите его с помощью:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## Связанные разделы

- [Справочник CLI](/ru/cli)
- [Сопряжение](/ru/cli/pairing)
