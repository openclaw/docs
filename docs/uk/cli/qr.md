---
read_when:
    - Ви хочете швидко сполучити застосунок мобільного вузла з gateway
    - Вам потрібен вивід коду налаштування для віддаленого/ручного поширення
summary: Довідка CLI для `openclaw qr` (генерація QR-коду сполучення для мобільного пристрою + коду налаштування)
title: qr
x-i18n:
    generated_at: "2026-04-23T06:19:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: ee6469334ad09037318f938c7ac609b7d5e3385c0988562501bb02a1bfa411ff
    source_path: cli/qr.md
    workflow: 15
---

# `openclaw qr`

Згенеруйте QR-код сполучення для мобільного пристрою та код налаштування на основі вашої поточної конфігурації Gateway.

## Використання

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## Параметри

- `--remote`: віддавати перевагу `gateway.remote.url`; якщо його не задано, `gateway.tailscale.mode=serve|funnel` усе одно може надати віддалений публічний URL
- `--url <url>`: перевизначити URL gateway, що використовується в корисному навантаженні
- `--public-url <url>`: перевизначити публічний URL, що використовується в корисному навантаженні
- `--token <token>`: перевизначити, відносно якого токена gateway автентифікується bootstrap-потік
- `--password <password>`: перевизначити, відносно якого пароля gateway автентифікується bootstrap-потік
- `--setup-code-only`: вивести лише код налаштування
- `--no-ascii`: пропустити ASCII-відтворення QR-коду
- `--json`: вивести JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Примітки

- `--token` і `--password` є взаємовиключними.
- Сам код налаштування тепер містить непрозорий короткоживучий `bootstrapToken`, а не спільний токен/пароль gateway.
- У вбудованому bootstrap-потоці node/operator основний токен Node, як і раніше, потрапляє з `scopes: []`.
- Якщо bootstrap-передача також видає операторський токен, він лишається обмеженим списком дозволів bootstrap: `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`.
- Перевірки областей дії bootstrap мають префікс ролі. Цей список дозволів оператора задовольняє лише операторські запити; ролям, відмінним від оператора, як і раніше потрібні області дії під префіксом їхньої власної ролі.
- Сполучення мобільного пристрою завершується за принципом fail closed для URL gateway `ws://` через Tailscale/публічні маршрути. Приватний LAN `ws://` і далі підтримується, але для мобільних маршрутів через Tailscale/публічні мережі слід використовувати Tailscale Serve/Funnel або URL gateway `wss://`.
- Із `--remote` OpenClaw вимагає або `gateway.remote.url`, або
  `gateway.tailscale.mode=serve|funnel`.
- Із `--remote`, якщо фактично активні віддалені облікові дані налаштовані як SecretRef і ви не передаєте `--token` або `--password`, команда отримує їх з активного знімка gateway. Якщо gateway недоступний, команда завершується помилкою одразу.
- Без `--remote` локальні SecretRef автентифікації gateway розв’язуються, якщо не передано перевизначення автентифікації через CLI:
  - `gateway.auth.token` розв’язується, коли може перемогти автентифікація токеном (явний `gateway.auth.mode="token"` або виведений режим, де жодне джерело пароля не перемагає).
  - `gateway.auth.password` розв’язується, коли може перемогти автентифікація паролем (явний `gateway.auth.mode="password"` або виведений режим без токена-переможця з auth/env).
- Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password` (включно з SecretRef), а `gateway.auth.mode` не задано, розв’язання коду налаштування завершується помилкою, доки режим не буде явно встановлено.
- Примітка про розсинхронізацію версій Gateway: цей шлях команди вимагає gateway, який підтримує `secrets.resolve`; старіші gateway повертають помилку unknown-method.
- Після сканування схваліть сполучення пристрою за допомогою:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`
