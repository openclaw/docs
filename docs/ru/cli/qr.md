---
read_when:
    - Вы хотите быстро связать мобильное приложение Node с Gateway
    - Вам нужен вывод setup-code для удалённой или ручной передачи
summary: Справочник CLI для `openclaw qr` (сгенерировать QR-код для сопряжения с мобильным устройством + код настройки)
title: QR
x-i18n:
    generated_at: "2026-06-28T22:45:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d08bbeb69627dafea45c912af4e92c08cd5c79d4ae52bb3f0a6fba5e789acb51
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

Сгенерируйте QR-код для привязки мобильного устройства и код настройки из текущей конфигурации Gateway.

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
- `--url <url>`: переопределить URL шлюза, используемый в полезной нагрузке
- `--public-url <url>`: переопределить публичный URL, используемый в полезной нагрузке
- `--token <token>`: переопределить токен Gateway, относительно которого аутентифицируется поток начальной настройки
- `--password <password>`: переопределить пароль Gateway, относительно которого аутентифицируется поток начальной настройки
- `--setup-code-only`: вывести только код настройки
- `--no-ascii`: пропустить отрисовку QR в ASCII
- `--json`: вывести JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Примечания

- `--token` и `--password` являются взаимоисключающими.
- Сам код настройки теперь содержит непрозрачный короткоживущий `bootstrapToken`, а не общий токен/пароль Gateway.
- Встроенная начальная настройка по коду настройки возвращает основной токен `node` с `scopes: []` плюс ограниченный токен передачи управления `operator` для доверенной настройки мобильного устройства.
- Переданный токен оператора ограничен `operator.approvals`, `operator.read`, `operator.talk.secrets` и `operator.write`; для `operator.admin` и `operator.pairing` требуется отдельная утверждённая привязка оператора или поток выдачи токена.
- Привязка мобильного устройства отказывает безопасным образом для Tailscale/публичных URL Gateway вида `ws://`. Частные LAN-адреса и Bonjour-хосты `.local` по-прежнему поддерживаются через `ws://`, но мобильные маршруты Tailscale/публичные маршруты должны использовать Tailscale Serve/Funnel или URL Gateway вида `wss://`.
- С `--remote` OpenClaw требует либо `gateway.remote.url`, либо
  `gateway.tailscale.mode=serve|funnel`.
- С `--remote`, если фактически активные удалённые учётные данные настроены как SecretRefs и вы не передаёте `--token` или `--password`, команда извлекает их из активного снимка Gateway. Если Gateway недоступен, команда быстро завершается с ошибкой.
- Без `--remote` локальные SecretRefs аутентификации Gateway извлекаются, когда не передано переопределение аутентификации через CLI:
  - `gateway.auth.token` извлекается, когда может победить аутентификация по токену (явный `gateway.auth.mode="token"` или выведенный режим, где не побеждает ни один источник пароля).
  - `gateway.auth.password` извлекается, когда может победить аутентификация по паролю (явный `gateway.auth.mode="password"` или выведенный режим без побеждающего токена из аутентификации/окружения).
- Если настроены и `gateway.auth.token`, и `gateway.auth.password` (включая SecretRefs), а `gateway.auth.mode` не задан, разрешение кода настройки завершается ошибкой, пока режим не будет задан явно.
- Примечание о расхождении версий Gateway: этот путь команды требует Gateway с поддержкой `secrets.resolve`; более старые Gateway возвращают ошибку неизвестного метода.
- После сканирования утвердите привязку устройства с помощью:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## Связанные материалы

- [Справочник CLI](/ru/cli)
- [Привязка](/ru/cli/pairing)
