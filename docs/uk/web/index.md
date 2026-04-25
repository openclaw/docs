---
read_when:
    - Ви хочете отримати доступ до Gateway через Tailscale
    - Ви хочете використовувати браузерний Control UI і редагування конфігурації
summary: 'Веб-інтерфейси Gateway: Control UI, режими прив’язки та безпека'
title: Веб-інтерфейс
x-i18n:
    generated_at: "2026-04-25T10:49:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 424704a35ce3a0f5960486372514751cc93ae90e4b75d0ed114e045664256d2d
    source_path: web/index.md
    workflow: 15
---

Gateway веб-інтерфейси: Control UI, режими прив’язки та безпека

Веб-інтерфейс

Ви хочете отримати доступ до Gateway через Tailscale

Ви хочете використовувати браузерний Control UI і редагування конфігурації

Gateway надає невеликий **браузерний Control UI** (Vite + Lit) з того ж порту, що й WebSocket Gateway:

- за замовчуванням: `http://<host>:18789/`
- з `gateway.tls.enabled: true`: `https://<host>:18789/`
- необов’язковий префікс: задайте `gateway.controlUi.basePath` (наприклад, `/openclaw`)

Можливості описано в [Control UI](/uk/web/control-ui).
Ця сторінка зосереджена на режимах прив’язки, безпеці та веб-інтерфейсах.

## Webhook

Коли `hooks.enabled=true`, Gateway також відкриває невеликий endpoint Webhook на тому самому HTTP-сервері.
Див. [Конфігурація Gateway](/uk/gateway/configuration) → `hooks` для автентифікації та payload.

## Конфігурація (увімкнено за замовчуванням)

Control UI **увімкнено за замовчуванням**, якщо наявні ресурси (`dist/control-ui`).
Ви можете керувати ним через конфігурацію:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath optional
  },
}
```

## Доступ через Tailscale

### Integrated Serve (рекомендовано)

Залиште Gateway на local loopback і дозвольте Tailscale Serve проксіювати його:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Потім запустіть gateway:

```bash
openclaw gateway
```

Відкрийте:

- `https://<magicdns>/` (або ваш налаштований `gateway.controlUi.basePath`)

### Прив’язка до tailnet + токен

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

Потім запустіть gateway (цей приклад без loopback використовує автентифікацію
токеном зі спільним секретом):

```bash
openclaw gateway
```

Відкрийте:

- `http://<tailscale-ip>:18789/` (або ваш налаштований `gateway.controlUi.basePath`)

### Публічний інтернет (Funnel)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" }, // or OPENCLAW_GATEWAY_PASSWORD
  },
}
```

## Примітки щодо безпеки

- Автентифікація Gateway за замовчуванням є обов’язковою (токен, пароль, trusted-proxy або заголовки ідентифікації Tailscale Serve, якщо ввімкнено).
- Прив’язки не до loopback все одно **вимагають** автентифікації gateway. На практиці це означає автентифікацію токеном/паролем або reverse proxy з урахуванням ідентичності з `gateway.auth.mode: "trusted-proxy"`.
- Майстер за замовчуванням створює автентифікацію зі спільним секретом і зазвичай генерує
  токен gateway (навіть на loopback).
- У режимі спільного секрету UI надсилає `connect.params.auth.token` або
  `connect.params.auth.password`.
- Коли `gateway.tls.enabled: true`, локальні помічники dashboard і status відображають
  URL dashboard із `https://` і URL WebSocket із `wss://`.
- Натомість у режимах з передаванням ідентичності, таких як Tailscale Serve або `trusted-proxy`, перевірка автентифікації WebSocket задовольняється заголовками запиту.
- Для розгортань Control UI не на loopback явно задайте `gateway.controlUi.allowedOrigins`
  (повні origins). Без цього запуск gateway за замовчуванням буде відхилено.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` вмикає
  режим резервного використання origin із заголовка Host, але це небезпечне послаблення безпеки.
- Із Serve заголовки ідентифікації Tailscale можуть задовольняти автентифікацію Control UI/WebSocket,
  коли `gateway.auth.allowTailscale` має значення `true` (токен/пароль не потрібні).
  endpoint HTTP API не використовують ці заголовки ідентифікації Tailscale; натомість вони дотримуються
  звичайного режиму HTTP-автентифікації gateway. Установіть
  `gateway.auth.allowTailscale: false`, щоб вимагати явні облікові дані. Див.
  [Tailscale](/uk/gateway/tailscale) і [Безпека](/uk/gateway/security). Цей
  безтокеновий потік передбачає, що хост gateway є довіреним.
- `gateway.tailscale.mode: "funnel"` вимагає `gateway.auth.mode: "password"` (спільний пароль).

## Збирання UI

Gateway надає статичні файли з `dist/control-ui`. Зберіть їх за допомогою:

```bash
pnpm ui:build
```
