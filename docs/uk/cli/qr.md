---
read_when:
    - Ви хочете швидко створити пару між застосунком мобільного вузла та Gateway
    - Потрібен вивід setup-code для віддаленого/ручного надання доступу
summary: Довідник CLI для `openclaw qr` (згенерувати QR-код для сполучення мобільного пристрою + код налаштування)
title: QR
x-i18n:
    generated_at: "2026-05-06T02:11:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2e8f86b860701dcd625b6573070e30ed26a2f3fda9e5e7998723c8058de498b
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

Згенеруйте QR для сполучення мобільного пристрою та код налаштування з поточної конфігурації Gateway.

## Використання

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## Параметри

- `--remote`: віддати перевагу `gateway.remote.url`; якщо його не задано, `gateway.tailscale.mode=serve|funnel` усе ще може надати віддалену публічну URL-адресу
- `--url <url>`: перевизначити URL-адресу gateway, що використовується в payload
- `--public-url <url>`: перевизначити публічну URL-адресу, що використовується в payload
- `--token <token>`: перевизначити, за яким токеном gateway проходить автентифікацію bootstrap-потік
- `--password <password>`: перевизначити, за яким паролем gateway проходить автентифікацію bootstrap-потік
- `--setup-code-only`: вивести лише код налаштування
- `--no-ascii`: пропустити ASCII-відображення QR
- `--json`: вивести JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Примітки

- `--token` і `--password` взаємовиключні.
- Сам код налаштування тепер містить непрозорий короткочасний `bootstrapToken`, а не спільний токен/пароль gateway.
- У вбудованому bootstrap-потоці для вузла/оператора основний токен вузла все ще потрапляє з `scopes: []`.
- Якщо bootstrap-передача також видає токен оператора, він залишається обмеженим allowlist для bootstrap: `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`.
- Перевірки scope для bootstrap мають префікс ролі. Цей allowlist оператора задовольняє лише запити оператора; ролям, що не є операторами, усе ще потрібні scope під власним префіксом ролі.
- Сполучення мобільного пристрою завершується закритою відмовою для URL-адрес gateway `ws://` через Tailscale/публічні маршрути. Приватні LAN-адреси та хости Bonjour `.local` залишаються підтримуваними через `ws://`, але мобільні маршрути Tailscale/публічні маршрути мають використовувати Tailscale Serve/Funnel або URL-адресу gateway `wss://`.
- З `--remote` OpenClaw вимагає або `gateway.remote.url`, або
  `gateway.tailscale.mode=serve|funnel`.
- З `--remote`, якщо фактично активні віддалені облікові дані налаштовано як SecretRefs і ви не передаєте `--token` або `--password`, команда розв’язує їх з активного знімка gateway. Якщо gateway недоступний, команда швидко завершується з помилкою.
- Без `--remote` локальні SecretRefs автентифікації gateway розв’язуються, коли не передано CLI-перевизначення автентифікації:
  - `gateway.auth.token` розв’язується, коли автентифікація токеном може перемогти (явний `gateway.auth.mode="token"` або виведений режим, у якому жодне джерело пароля не перемагає).
  - `gateway.auth.password` розв’язується, коли автентифікація паролем може перемогти (явний `gateway.auth.mode="password"` або виведений режим без переможного токена з auth/env).
- Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password` (включно з SecretRefs), а `gateway.auth.mode` не задано, розв’язання коду налаштування завершується помилкою, доки режим не буде задано явно.
- Примітка щодо розбіжності версій Gateway: цей шлях команди вимагає gateway, який підтримує `secrets.resolve`; старіші gateway повертають помилку невідомого методу.
- Після сканування підтвердьте сполучення пристрою за допомогою:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Сполучення](/uk/cli/pairing)
