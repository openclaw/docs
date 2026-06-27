---
read_when:
    - Ви хочете отримати доступ до Gateway через Tailscale
    - Вам потрібні браузерний Control UI і редагування конфігурації
summary: 'Вебповерхні Gateway: Control UI, режими прив’язки та безпека'
title: Веб
x-i18n:
    generated_at: "2026-06-27T18:31:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c6b0c9f4ff53af295eb4eef7290d5d6b70c52543f57a9e83c7f8a635a2b35cd
    source_path: web/index.md
    workflow: 16
---

Gateway надає невеликий **браузерний інтерфейс керування** (Vite + Lit) з того самого порту, що й Gateway WebSocket:

- за замовчуванням: `http://<host>:18789/`
- з `gateway.tls.enabled: true`: `https://<host>:18789/`
- необов'язковий префікс: установіть `gateway.controlUi.basePath` (наприклад, `/openclaw`)

Можливості описано в [інтерфейсі керування](/uk/web/control-ui). Решта цієї сторінки зосереджена на режимах прив'язування, безпеці та поверхнях, доступних через веб.

## Webhook-и

Коли `hooks.enabled=true`, Gateway також відкриває невелику кінцеву точку webhook на тому самому HTTP-сервері.
Див. [конфігурацію Gateway](/uk/gateway/configuration) → `hooks` для автентифікації та корисних навантажень.

## Адміністративний HTTP RPC

Адміністративний HTTP RPC відкриває вибрані методи площини керування Gateway на `POST /api/v1/admin/rpc`.
За замовчуванням він вимкнений і реєструється лише тоді, коли ввімкнено plugin `admin-http-rpc`.
Див. [адміністративний HTTP RPC](/uk/plugins/admin-http-rpc) щодо моделі автентифікації, дозволених методів і порівняння з WebSocket.

## Конфігурація (увімкнено за замовчуванням)

Інтерфейс керування **увімкнено за замовчуванням**, коли ресурси наявні (`dist/control-ui`).
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

- `https://<magicdns>/` (або налаштований вами `gateway.controlUi.basePath`)

### Прив'язування до Tailnet + токен

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

Потім запустіть gateway (цей приклад не для loopback використовує автентифікацію
токеном зі спільним секретом):

```bash
openclaw gateway
```

Відкрийте:

- `http://<tailscale-ip>:18789/` (або налаштований вами `gateway.controlUi.basePath`)

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

## Нотатки щодо безпеки

- Автентифікація Gateway потрібна за замовчуванням (токен, пароль, trusted-proxy або заголовки ідентичності Tailscale Serve, коли ввімкнено).
- Прив'язування не до loopback усе одно **потребують** автентифікації gateway. На практиці це означає автентифікацію токеном/паролем або reverse proxy з підтримкою ідентичності з `gateway.auth.mode: "trusted-proxy"`.
- Майстер за замовчуванням створює автентифікацію зі спільним секретом і зазвичай генерує
  токен gateway (навіть на loopback).
- У режимі спільного секрету UI надсилає `connect.params.auth.token` або
  `connect.params.auth.password`.
- Коли `gateway.tls.enabled: true`, локальна панель і допоміжні засоби стану відображають
  URL-адреси панелі з `https://` та URL-адреси WebSocket з `wss://`.
- У режимах із передаванням ідентичності, як-от Tailscale Serve або `trusted-proxy`,
  перевірка автентифікації WebSocket натомість задовольняється заголовками запиту.
- Для публічних розгортань інтерфейсу керування не на loopback явно задайте `gateway.controlUi.allowedOrigins`
  (повні origins). Приватні завантаження LAN/Tailnet із тим самим origin приймаються для loopback,
  RFC1918/link-local, `.local`, `.ts.net` і хостів Tailscale CGNAT.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` вмикає
  режим fallback origin за заголовком Host, але це небезпечне зниження рівня безпеки.
- Із Serve заголовки ідентичності Tailscale можуть задовольнити автентифікацію Control UI/WebSocket,
  коли `gateway.auth.allowTailscale` має значення `true` (токен/пароль не потрібні).
  Кінцеві точки HTTP API не використовують ці заголовки ідентичності Tailscale; натомість вони дотримуються
  звичайного режиму HTTP-автентифікації gateway. Установіть
  `gateway.auth.allowTailscale: false`, щоб вимагати явні облікові дані. Див.
  [Tailscale](/uk/gateway/tailscale) і [Безпека](/uk/gateway/security). Цей
  потік без токена припускає, що хост gateway є довіреним.
- `gateway.tailscale.mode: "funnel"` потребує `gateway.auth.mode: "password"` (спільний пароль).

## Збирання UI

Gateway надає статичні файли з `dist/control-ui`. Зберіть їх за допомогою:

```bash
pnpm ui:build
```
