---
read_when:
    - Ви хочете швидко поєднати мобільний застосунок вузла з Gateway
    - Вам потрібен вивід setup-code для віддаленого/ручного поширення
summary: Довідка CLI для `openclaw qr` (генерування QR-коду для мобільного сполучення + коду налаштування)
title: QR
x-i18n:
    generated_at: "2026-07-04T18:18:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81d15c9d551960c6f5677649b481e447ecda55a395957746959b4ecf81712bdb
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

- `--remote`: віддавати перевагу `gateway.remote.url`; якщо його не задано, `gateway.tailscale.mode=serve|funnel` все одно може надати віддалену публічну URL-адресу
- `--url <url>`: перевизначити URL Gateway, що використовується в корисному навантаженні
- `--public-url <url>`: перевизначити публічну URL-адресу, що використовується в корисному навантаженні
- `--token <token>`: перевизначити, за яким токеном Gateway потік початкового підключення виконує автентифікацію
- `--password <password>`: перевизначити, за яким паролем Gateway потік початкового підключення виконує автентифікацію
- `--setup-code-only`: вивести лише код налаштування
- `--no-ascii`: пропустити відтворення ASCII QR
- `--json`: вивести JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Примітки

- `--token` і `--password` є взаємовиключними.
- Сам код налаштування тепер містить непрозорий короткочасний `bootstrapToken`, а не спільний токен/пароль Gateway.
- Вбудоване початкове підключення через код налаштування повертає основний токен `node` із `scopes: []`, а також обмежений токен передавання `operator` для довіреного мобільного онбордингу.
- Переданий токен оператора обмежено до `operator.approvals`, `operator.read`, `operator.talk.secrets` і `operator.write`; області дії для змін сполучення та `operator.admin` усе ще потребують окремого схваленого сполучення оператора або потоку токена.
- Мобільне сполучення завершується відмовою для Tailscale/публічних URL Gateway з `ws://`. Приватні LAN-адреси та хости Bonjour `.local` і далі підтримуються через `ws://`, але Tailscale/публічні мобільні маршрути мають використовувати Tailscale Serve/Funnel або URL Gateway з `wss://`.
- З `--remote` OpenClaw потребує або `gateway.remote.url`, або
  `gateway.tailscale.mode=serve|funnel`.
- З `--remote`, якщо фактично активні віддалені облікові дані налаштовано як SecretRefs і ви не передаєте `--token` або `--password`, команда вирішує їх з активного знімка Gateway. Якщо Gateway недоступний, команда швидко завершується помилкою.
- Без `--remote` SecretRefs автентифікації локального Gateway вирішуються, коли не передано перевизначення автентифікації CLI:
  - `gateway.auth.token` вирішується, коли автентифікація за токеном може перемогти (явний `gateway.auth.mode="token"` або виведений режим, у якому не перемагає жодне джерело пароля).
  - `gateway.auth.password` вирішується, коли автентифікація за паролем може перемогти (явний `gateway.auth.mode="password"` або виведений режим без токена-переможця з auth/env).
- Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password` (зокрема SecretRefs), а `gateway.auth.mode` не задано, вирішення коду налаштування завершується помилкою, доки режим не буде задано явно.
- Примітка щодо розбіжності версій Gateway: цей шлях команди потребує Gateway, що підтримує `secrets.resolve`; старіші Gateway повертають помилку невідомого методу.
- Офіційні застосунки OpenClaw для iOS і Android підключаються автоматично, коли їхні
  метадані коду налаштування збігаються. Якщо запит залишається в очікуванні (наприклад, для
  неофіційного клієнта або невідповідних метаданих), перегляньте й схваліть його за допомогою:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Сполучення](/uk/cli/pairing)
