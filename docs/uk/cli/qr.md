---
read_when:
    - Ви хочете швидко поєднати мобільний застосунок Node із Gateway
    - Вам потрібен вивід setup-code для віддаленого/ручного поширення
summary: Довідка CLI для `openclaw qr` (згенерувати QR-код мобільного сполучення + код налаштування)
title: QR
x-i18n:
    generated_at: "2026-06-27T17:22:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d08bbeb69627dafea45c912af4e92c08cd5c79d4ae52bb3f0a6fba5e789acb51
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

Згенеруйте QR-код мобільного сполучення та код налаштування з поточної конфігурації Gateway.

## Використання

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## Параметри

- `--remote`: віддати перевагу `gateway.remote.url`; якщо його не задано, `gateway.tailscale.mode=serve|funnel` усе ще може надати віддалений публічний URL
- `--url <url>`: перевизначити URL gateway, який використовується в корисному навантаженні
- `--public-url <url>`: перевизначити публічний URL, який використовується в корисному навантаженні
- `--token <token>`: перевизначити, за яким gateway-токеном автентифікується потік початкового налаштування
- `--password <password>`: перевизначити, за яким gateway-паролем автентифікується потік початкового налаштування
- `--setup-code-only`: вивести лише код налаштування
- `--no-ascii`: пропустити ASCII-відтворення QR
- `--json`: вивести JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Примітки

- `--token` і `--password` взаємно виключають одне одного.
- Сам код налаштування тепер містить непрозорий короткочасний `bootstrapToken`, а не спільний gateway-токен/пароль.
- Вбудоване початкове налаштування через код налаштування повертає основний токен `node` із `scopes: []` плюс обмежений токен передавання `operator` для довіреного мобільного онбордингу.
- Переданий operator-токен обмежено `operator.approvals`, `operator.read`, `operator.talk.secrets` і `operator.write`; для `operator.admin` і `operator.pairing` потрібне окреме схвалене operator-сполучення або потік токена.
- Мобільне сполучення завершується безпечною відмовою для Tailscale/публічних gateway-URL `ws://`. Приватні LAN-адреси та хости Bonjour `.local` і надалі підтримуються через `ws://`, але Tailscale/публічні мобільні маршрути мають використовувати Tailscale Serve/Funnel або gateway-URL `wss://`.
- З `--remote` OpenClaw вимагає або `gateway.remote.url`, або
  `gateway.tailscale.mode=serve|funnel`.
- З `--remote`, якщо фактично активні віддалені облікові дані налаштовано як SecretRefs і ви не передаєте `--token` або `--password`, команда розв’язує їх з активного знімка gateway. Якщо gateway недоступний, команда швидко завершується помилкою.
- Без `--remote` SecretRefs локальної gateway-автентифікації розв’язуються, коли не передано перевизначення автентифікації через CLI:
  - `gateway.auth.token` розв’язується, коли автентифікація токеном може перемогти (явний `gateway.auth.mode="token"` або виведений режим, у якому не перемагає жодне джерело пароля).
  - `gateway.auth.password` розв’язується, коли автентифікація паролем може перемогти (явний `gateway.auth.mode="password"` або виведений режим без переможного токена з auth/env).
- Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password` (зокрема SecretRefs), а `gateway.auth.mode` не задано, розв’язання коду налаштування завершується помилкою, доки режим не буде задано явно.
- Примітка про розбіжність версій Gateway: цей шлях команди потребує gateway, який підтримує `secrets.resolve`; старіші gateway повертають помилку невідомого методу.
- Після сканування схваліть сполучення пристрою за допомогою:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Сполучення](/uk/cli/pairing)
