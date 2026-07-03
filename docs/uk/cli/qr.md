---
read_when:
    - Ви хочете швидко зв’язати мобільний застосунок вузла з Gateway
    - Потрібен вивід setup-code для віддаленого/ручного надання доступу
summary: Довідник CLI для `openclaw qr` (згенерувати QR-код для мобільного сполучення + код налаштування)
title: QR
x-i18n:
    generated_at: "2026-07-03T17:41:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2a0d71fb7be0734a015084bfb5edef74953310d384964eab9cccbabf7c497e3
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

Згенеруйте QR-код для мобільного сполучення та код налаштування з поточної конфігурації Gateway.

## Використання

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## Параметри

- `--remote`: надавати перевагу `gateway.remote.url`; якщо його не задано, `gateway.tailscale.mode=serve|funnel` все ще може надати віддалений публічний URL
- `--url <url>`: перевизначити URL Gateway, який використовується в payload
- `--public-url <url>`: перевизначити публічний URL, який використовується в payload
- `--token <token>`: перевизначити, за яким токеном Gateway автентифікується потік початкового налаштування
- `--password <password>`: перевизначити, за яким паролем Gateway автентифікується потік початкового налаштування
- `--setup-code-only`: вивести лише код налаштування
- `--no-ascii`: пропустити ASCII-відтворення QR-коду
- `--json`: вивести JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Примітки

- `--token` і `--password` є взаємовиключними.
- Сам код налаштування тепер містить непрозорий короткочасний `bootstrapToken`, а не спільний токен/пароль Gateway.
- Вбудоване початкове налаштування через код налаштування повертає основний токен `node` із `scopes: []` плюс обмежений токен передавання `operator` для довіреного мобільного онбордингу.
- Переданий токен оператора обмежено `operator.approvals`, `operator.read`, `operator.talk.secrets` і `operator.write`; scopes для змін сполучення та `operator.admin` усе ще потребують окремого схваленого сполучення оператора або потоку токена.
- Мобільне сполучення відмовляє безпечно для Tailscale/публічних URL Gateway `ws://`. Приватні LAN-адреси й хости Bonjour `.local` залишаються підтримуваними через `ws://`, але Tailscale/публічні мобільні маршрути мають використовувати Tailscale Serve/Funnel або URL Gateway `wss://`.
- З `--remote` OpenClaw вимагає або `gateway.remote.url`, або
  `gateway.tailscale.mode=serve|funnel`.
- З `--remote`, якщо фактично активні віддалені облікові дані налаштовано як SecretRefs і ви не передаєте `--token` або `--password`, команда розв’язує їх з активного знімка Gateway. Якщо Gateway недоступний, команда швидко завершується з помилкою.
- Без `--remote` SecretRefs автентифікації локального Gateway розв’язуються, коли не передано перевизначення автентифікації CLI:
  - `gateway.auth.token` розв’язується, коли автентифікація за токеном може перемогти (явний `gateway.auth.mode="token"` або виведений режим, у якому не перемагає жодне джерело пароля).
  - `gateway.auth.password` розв’язується, коли автентифікація за паролем може перемогти (явний `gateway.auth.mode="password"` або виведений режим без переможного токена з auth/env).
- Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password` (включно з SecretRefs), а `gateway.auth.mode` не задано, розв’язання коду налаштування завершується з помилкою, доки режим не буде задано явно.
- Примітка про розбіжність версій Gateway: цей шлях команди потребує Gateway, який підтримує `secrets.resolve`; старіші Gateway повертають помилку невідомого методу.
- Після сканування схваліть сполучення пристрою за допомогою:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Сполучення](/uk/cli/pairing)
