---
read_when:
    - Ви хочете швидко з’єднати mobile Node app із Gateway
    - Вам потрібен вивід setup-code для віддаленого/ручного поширення
summary: Довідник CLI для `openclaw qr` (згенерувати QR для mobile pairing + код налаштування)
title: QR
x-i18n:
    generated_at: "2026-04-23T20:48:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 03ffe8c5ed51bec78e3c01f3e24ec1bbe195a862041b2cc0908500c1cb46c717
    source_path: cli/qr.md
    workflow: 15
---

# `openclaw qr`

Згенерувати QR для mobile pairing і setup code з поточної конфігурації Gateway.

## Використання

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## Параметри

- `--remote`: віддавати перевагу `gateway.remote.url`; якщо його не задано, `gateway.tailscale.mode=serve|funnel` все одно може надати віддалений публічний URL
- `--url <url>`: перевизначити URL Gateway, що використовується в payload
- `--public-url <url>`: перевизначити публічний URL, що використовується в payload
- `--token <token>`: перевизначити, який токен Gateway використовує bootstrap flow для автентифікації
- `--password <password>`: перевизначити, який пароль Gateway використовує bootstrap flow для автентифікації
- `--setup-code-only`: вивести лише setup code
- `--no-ascii`: пропустити ASCII-відтворення QR
- `--json`: вивести JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Примітки

- `--token` і `--password` взаємовиключні.
- Сам setup code тепер містить непрозорий короткоживучий `bootstrapToken`, а не спільний токен/пароль Gateway.
- У вбудованому bootstrap flow node/operator основний токен Node, як і раніше, створюється з `scopes: []`.
- Якщо передавання bootstrap також видає токен оператора, він залишається обмеженим allowlist bootstrap: `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`.
- Перевірки областей bootstrap мають префікси ролей. Цей allowlist оператора задовольняє лише запити оператора; для неоператорних ролей, як і раніше, потрібні області під власним префіксом ролі.
- Mobile pairing безпечно завершується відмовою для URL Gateway `ws://` через Tailscale/публічний доступ. Приватний LAN `ws://` і далі підтримується, але для mobile-маршрутів через Tailscale/публічний доступ слід використовувати Tailscale Serve/Funnel або URL Gateway `wss://`.
- З `--remote` OpenClaw потребує або `gateway.remote.url`, або
  `gateway.tailscale.mode=serve|funnel`.
- З `--remote`, якщо фактично активні віддалені облікові дані налаштовано як SecretRef і ви не передаєте `--token` або `--password`, команда розв’язує їх з активного snapshot Gateway. Якщо Gateway недоступний, команда завершується помилкою одразу.
- Без `--remote` локальні SecretRef автентифікації Gateway розв’язуються, якщо не передано перевизначення автентифікації через CLI:
  - `gateway.auth.token` розв’язується, коли може перемогти автентифікація токеном (явне `gateway.auth.mode="token"` або виведений режим, де жодне джерело пароля не перемагає).
  - `gateway.auth.password` розв’язується, коли може перемогти автентифікація паролем (явне `gateway.auth.mode="password"` або виведений режим без токена-переможця з auth/env).
- Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password` (зокрема через SecretRef), а `gateway.auth.mode` не задано, розв’язання setup code завершується помилкою, доки режим не буде задано явно.
- Примітка про розбіжність версій Gateway: цей шлях команди потребує Gateway, який підтримує `secrets.resolve`; старіші Gateway повертають помилку unknown-method.
- Після сканування схваліть pairing пристрою командами:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`
