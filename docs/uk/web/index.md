---
read_when:
    - Ви хочете отримати доступ до Gateway через Tailscale
    - Вам потрібні browser Control UI та редагування конфігурації
summary: 'Вебповерхні Gateway: Control UI, режими прив’язки та безпека'
title: Веб
x-i18n:
    generated_at: "2026-04-27T06:29:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1e357d1e9f4ad0286b9412cd0a684b6428180e0586eef76577ecb2909212fb2
    source_path: web/index.md
    workflow: 15
---

Gateway віддає невеликий **browser Control UI** (Vite + Lit) з того самого порту, що й WebSocket Gateway:

- за замовчуванням: `http://<host>:18789/`
- з `gateway.tls.enabled: true`: `https://<host>:18789/`
- необов’язковий префікс: задайте `gateway.controlUi.basePath` (наприклад, `/openclaw`)

Можливості описано в [Control UI](/uk/web/control-ui). Решта цієї сторінки зосереджена на режимах прив’язки, безпеці та вебповерхнях.

## Webhook

Коли `hooks.enabled=true`, Gateway також відкриває невеликий ендпойнт Webhook на тому самому HTTP-сервері.
Див. [Конфігурація Gateway](/uk/gateway/configuration) → `hooks` щодо автентифікації та payload.

## Конфігурація (увімкнено за замовчуванням)

Control UI **увімкнено за замовчуванням**, коли наявні ресурси (`dist/control-ui`).
Керувати ним можна через конфігурацію:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath optional
  },
}
```

## Доступ через Tailscale

### Інтегрований Serve (рекомендовано)

Залиште Gateway на loopback і дозвольте Tailscale Serve проксувати його:

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

- Автентифікація Gateway за замовчуванням обов’язкова (токен, пароль, trusted-proxy або заголовки identity Tailscale Serve, якщо вони ввімкнені).
- Прив’язки без loopback усе одно **вимагають** автентифікації gateway. На практиці це означає автентифікацію токеном/паролем або reverse proxy з урахуванням identity з `gateway.auth.mode: "trusted-proxy"`.
- Майстер за замовчуванням створює автентифікацію зі спільним секретом і зазвичай генерує
  токен gateway (навіть для loopback).
- У режимі спільного секрету UI надсилає `connect.params.auth.token` або
  `connect.params.auth.password`.
- Коли `gateway.tls.enabled: true`, локальні помічники dashboard і status відображають
  URL dashboard як `https://`, а URL WebSocket — як `wss://`.
- У режимах із передаванням identity, таких як Tailscale Serve або `trusted-proxy`,
  перевірка автентифікації WebSocket натомість задовольняється з заголовків запиту.
- Для розгортань Control UI без loopback явно задайте `gateway.controlUi.allowedOrigins`
  (повні origins). Без цього запуск gateway за замовчуванням буде відхилено.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` вмикає
  резервний режим визначення origin через заголовок Host, але це небезпечне послаблення безпеки.
- Із Serve заголовки identity Tailscale можуть задовольняти автентифікацію Control UI/WebSocket,
  коли `gateway.auth.allowTailscale` має значення `true` (токен/пароль не потрібні).
  Ендпойнти HTTP API не використовують ці заголовки identity Tailscale; вони
  натомість дотримуються звичайного режиму HTTP-автентифікації gateway. Установіть
  `gateway.auth.allowTailscale: false`, щоб вимагати явні облікові дані. Див.
  [Tailscale](/uk/gateway/tailscale) і [Безпека](/uk/gateway/security). Цей
  безтокенний потік передбачає, що хост gateway є довіреним.
- `gateway.tailscale.mode: "funnel"` вимагає `gateway.auth.mode: "password"` (спільний пароль).

## Збирання UI

Gateway віддає статичні файли з `dist/control-ui`. Зберіть їх за допомогою:

```bash
pnpm ui:build
```
