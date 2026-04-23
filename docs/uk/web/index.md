---
read_when:
    - Ви хочете отримати доступ до Gateway через Tailscale
    - Ви хочете браузерний Control UI і редагування конфігурації
summary: 'Вебповерхні Gateway: Control UI, режими прив’язки та безпека'
title: Веб
x-i18n:
    generated_at: "2026-04-23T06:20:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: cf1a173143782557ecd2e79b28694308709dc945700a509148856255d5cef773
    source_path: web/index.md
    workflow: 15
---

# Веб (Gateway)

Gateway віддає невеликий **браузерний Control UI** (Vite + Lit) з того самого порту, що й WebSocket Gateway:

- типово: `http://<host>:18789/`
- необов’язковий префікс: задайте `gateway.controlUi.basePath` (наприклад, `/openclaw`)

Можливості описані в [Control UI](/uk/web/control-ui).
Ця сторінка зосереджена на режимах прив’язки, безпеці та вебповерхнях.

## Webhook

Коли `hooks.enabled=true`, Gateway також надає невеликий ендпойнт webhook на тому самому HTTP-сервері.
Див. [Конфігурація Gateway](/uk/gateway/configuration) → `hooks` щодо автентифікації та навантажень.

## Конфігурація (увімкнено за замовчуванням)

Control UI **увімкнено за замовчуванням**, коли наявні ресурси (`dist/control-ui`).
Ви можете керувати ним через конфігурацію:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath optional
  },
}
```

## Доступ через Tailscale

### Інтегрований Serve (рекомендовано)

Тримайте Gateway на loopback і дозвольте Tailscale Serve проксувати його:

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

Потім запустіть gateway (цей приклад не-loopback використовує автентифікацію
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

- Автентифікація Gateway потрібна за замовчуванням (токен, пароль, trusted-proxy або заголовки ідентичності Tailscale Serve, якщо ввімкнено).
- Прив’язки не до loopback все одно **потребують** автентифікації gateway. На практиці це означає автентифікацію токеном/паролем або reverse proxy з awareness ідентичності з `gateway.auth.mode: "trusted-proxy"`.
- Майстер за замовчуванням створює автентифікацію зі спільним секретом і зазвичай генерує
  токен gateway (навіть на loopback).
- У режимі спільного секрету UI надсилає `connect.params.auth.token` або
  `connect.params.auth.password`.
- У режимах із передаванням ідентичності, таких як Tailscale Serve або `trusted-proxy`, перевірка автентифікації
  WebSocket натомість задовольняється з заголовків запиту.
- Для розгортань Control UI не на loopback задайте `gateway.controlUi.allowedOrigins`
  явно (повні origins). Без цього запуск gateway за замовчуванням буде відхилено.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` вмикає
  резервний режим origin через заголовок Host, але це небезпечне зниження рівня безпеки.
- З Serve заголовки ідентичності Tailscale можуть задовольнити автентифікацію Control UI/WebSocket,
  коли `gateway.auth.allowTailscale` має значення `true` (токен/пароль не потрібні).
  Ендпойнти HTTP API не використовують ці заголовки ідентичності Tailscale; вони дотримуються
  звичайного режиму HTTP-автентифікації gateway. Установіть
  `gateway.auth.allowTailscale: false`, щоб вимагати явні облікові дані. Див.
  [Tailscale](/uk/gateway/tailscale) і [Безпека](/uk/gateway/security). Цей
  безтокенний потік передбачає, що хост gateway є довіреним.
- `gateway.tailscale.mode: "funnel"` вимагає `gateway.auth.mode: "password"` (спільний пароль).

## Збирання UI

Gateway віддає статичні файли з `dist/control-ui`. Зберіть їх за допомогою:

```bash
pnpm ui:build
```
