---
read_when:
    - Вы хотите получить доступ к Gateway через Tailscale
    - Вам нужен браузерный Control UI и редактирование конфигурации
summary: 'Веб-поверхности Gateway: Control UI, режимы привязки и безопасность'
title: Веб
x-i18n:
    generated_at: "2026-06-28T23:57:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c6b0c9f4ff53af295eb4eef7290d5d6b70c52543f57a9e83c7f8a635a2b35cd
    source_path: web/index.md
    workflow: 16
---

Gateway обслуживает небольшой **браузерный интерфейс управления** (Vite + Lit) на том же порту, что и WebSocket Gateway:

- по умолчанию: `http://<host>:18789/`
- с `gateway.tls.enabled: true`: `https://<host>:18789/`
- необязательный префикс: задайте `gateway.controlUi.basePath` (например, `/openclaw`)

Возможности описаны в [интерфейсе управления](/ru/web/control-ui). Остальная часть этой страницы посвящена режимам привязки, безопасности и поверхностям, доступным из веба.

## Webhook

Когда `hooks.enabled=true`, Gateway также предоставляет небольшой endpoint Webhook на том же HTTP-сервере.
См. [конфигурацию Gateway](/ru/gateway/configuration) → `hooks` для аутентификации и payload.

## Административный HTTP RPC

Административный HTTP RPC предоставляет выбранные методы плоскости управления Gateway по адресу `POST /api/v1/admin/rpc`.
По умолчанию он отключен и регистрируется только при включенном plugin `admin-http-rpc`.
См. [Административный HTTP RPC](/ru/plugins/admin-http-rpc) для модели аутентификации, разрешенных методов и сравнения с WebSocket.

## Конфигурация (включено по умолчанию)

Интерфейс управления **включен по умолчанию**, когда присутствуют ресурсы (`dist/control-ui`).
Им можно управлять через конфигурацию:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath optional
  },
}
```

## Доступ через Tailscale

### Интегрированный Serve (рекомендуется)

Оставьте Gateway на loopback и позвольте Tailscale Serve проксировать его:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Затем запустите gateway:

```bash
openclaw gateway
```

Откройте:

- `https://<magicdns>/` (или настроенный вами `gateway.controlUi.basePath`)

### Привязка к Tailnet + токен

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

Затем запустите gateway (этот пример не на loopback использует аутентификацию
по токену общего секрета):

```bash
openclaw gateway
```

Откройте:

- `http://<tailscale-ip>:18789/` (или настроенный вами `gateway.controlUi.basePath`)

### Публичный интернет (Funnel)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" }, // or OPENCLAW_GATEWAY_PASSWORD
  },
}
```

## Примечания по безопасности

- Аутентификация Gateway требуется по умолчанию (токен, пароль, доверенный прокси или заголовки идентификации Tailscale Serve, если включены).
- Привязки не к loopback все равно **требуют** аутентификацию gateway. На практике это означает аутентификацию по токену/паролю или обратный прокси с учетом идентификации и `gateway.auth.mode: "trusted-proxy"`.
- Мастер по умолчанию создает аутентификацию с общим секретом и обычно генерирует
  токен gateway (даже на loopback).
- В режиме общего секрета UI отправляет `connect.params.auth.token` или
  `connect.params.auth.password`.
- Когда `gateway.tls.enabled: true`, локальная панель управления и вспомогательные средства статуса отображают
  URL панели управления с `https://` и URL WebSocket с `wss://`.
- В режимах с идентификацией, таких как Tailscale Serve или `trusted-proxy`, проверка
  аутентификации WebSocket вместо этого удовлетворяется заголовками запроса.
- Для публичных развертываний интерфейса управления не на loopback явно задайте `gateway.controlUi.allowedOrigins`
  (полные origins). Приватные загрузки из LAN/Tailnet с тем же origin принимаются для loopback,
  RFC1918/link-local, `.local`, `.ts.net` и хостов Tailscale CGNAT.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` включает
  резервный режим origin по заголовку Host, но это опасное снижение безопасности.
- При Serve заголовки идентификации Tailscale могут удовлетворять аутентификацию Control UI/WebSocket,
  когда `gateway.auth.allowTailscale` равно `true` (токен/пароль не требуется).
  Endpoint HTTP API не используют эти заголовки идентификации Tailscale; вместо этого они следуют
  обычному режиму HTTP-аутентификации gateway. Задайте
  `gateway.auth.allowTailscale: false`, чтобы требовать явные учетные данные. См.
  [Tailscale](/ru/gateway/tailscale) и [Безопасность](/ru/gateway/security). Этот
  поток без токена предполагает, что хост gateway является доверенным.
- `gateway.tailscale.mode: "funnel"` требует `gateway.auth.mode: "password"` (общий пароль).

## Сборка UI

Gateway обслуживает статические файлы из `dist/control-ui`. Соберите их с помощью:

```bash
pnpm ui:build
```
