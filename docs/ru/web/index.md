---
read_when:
    - Вы хотите получить доступ к Gateway через Tailscale
    - Вам нужен браузерный интерфейс управления и редактирование конфигурации
summary: 'Веб-интерфейсы Gateway: интерфейс управления, режимы привязки и безопасность'
title: Веб
x-i18n:
    generated_at: "2026-07-12T11:59:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 413fb029d95241f5c6043b28825727cdee52b2fa8cbe998fbbd6e3ff7b81467b
    source_path: web/index.md
    workflow: 16
---

Gateway обслуживает небольшой **браузерный интерфейс управления** (Vite + Lit) на том же порту, что и WebSocket Gateway:

- по умолчанию: `http://<host>:18789/`
- с `gateway.tls.enabled: true`: `https://<host>:18789/`
- необязательный префикс: задайте `gateway.controlUi.basePath` (например, `/openclaw`)

Возможности описаны в разделе [Интерфейс управления](/ru/web/control-ui). На этой странице рассматриваются режимы привязки, безопасность и другие веб-интерфейсы.

## Конфигурация (включено по умолчанию)

Интерфейс управления **включён по умолчанию**, если присутствуют ресурсы (`dist/control-ui`):

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath необязателен
  },
}
```

## Вебхуки

Когда задано `hooks.enabled=true`, Gateway также предоставляет конечную точку Webhook на том же HTTP-сервере. Сведения об аутентификации и полезных нагрузках см. в описании `hooks` в [справочнике по конфигурации Gateway](/ru/gateway/configuration-reference#hooks).

## Административный HTTP RPC

`POST /api/v1/admin/rpc` предоставляет выбранные методы плоскости управления Gateway через HTTP. По умолчанию отключён; регистрируется только при включённом плагине `admin-http-rpc`. Модель аутентификации, разрешённые методы и сравнение с API WebSocket см. в разделе [Административный HTTP RPC](/ru/plugins/admin-http-rpc).

## Доступ через Tailscale

<Tabs>
  <Tab title="Встроенный Serve (рекомендуется)">
    Оставьте Gateway на local loopback и разрешите Tailscale Serve проксировать его:

    ```json5
    {
      gateway: {
        bind: "loopback",
        tailscale: { mode: "serve" },
      },
    }
    ```

    Запустите Gateway:

    ```bash
    openclaw gateway
    ```

    Откройте `https://<magicdns>/` (или настроенный путь `gateway.controlUi.basePath`).

  </Tab>
  <Tab title="Привязка к tailnet + токен">
    ```json5
    {
      gateway: {
        bind: "tailnet",
        controlUi: { enabled: true },
        auth: { mode: "token", token: "your-token" },
      },
    }
    ```

    Запустите Gateway (в этом примере без local loopback используется аутентификация с токеном общего секрета):

    ```bash
    openclaw gateway
    ```

    Откройте `http://<tailscale-ip>:18789/` (или настроенный путь `gateway.controlUi.basePath`).

  </Tab>
  <Tab title="Публичный интернет (Funnel)">
    ```json5
    {
      gateway: {
        bind: "loopback",
        tailscale: { mode: "funnel" },
        auth: { mode: "password" }, // или OPENCLAW_GATEWAY_PASSWORD
      },
    }
    ```

    Для `tailscale.mode: "funnel"` требуется `gateway.auth.mode: "password"`; и Serve, и Funnel требуют `gateway.bind: "loopback"`.

  </Tab>
</Tabs>

## Примечания по безопасности

- По умолчанию для Gateway требуется аутентификация: токен, пароль, доверенный прокси или, если они включены, заголовки идентификации Tailscale Serve.
- Привязки не к local loopback также **требуют** аутентификацию Gateway: аутентификацию по токену/паролю или обратный прокси с поддержкой идентификации и `gateway.auth.mode: "trusted-proxy"`.
- Мастер первоначальной настройки по умолчанию создаёт аутентификацию с общим секретом и обычно генерирует токен Gateway даже при использовании local loopback.
- В режиме общего секрета интерфейс отправляет `connect.params.auth.token` или `connect.params.auth.password` во время установки соединения WebSocket.
- При `gateway.tls.enabled: true` локальные вспомогательные средства панели управления и состояния формируют URL-адреса `https://` и URL-адреса WebSocket `wss://`.
- В режимах с передачей идентификации (Tailscale Serve, `trusted-proxy`) проверка аутентификации WebSocket выполняется по заголовкам запроса, а не по общему секрету.
- Для публичных развёртываний интерфейса управления с привязкой не к local loopback явно задайте `gateway.controlUi.allowedOrigins` (полные источники). Для local loopback, RFC1918/локальных адресов канального уровня, `.local`, `.ts.net` и узлов Tailscale CGNAT частные загрузки из того же источника принимаются и без этого параметра.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback: true` включает резервное определение источника по заголовку Host; это опасное ослабление безопасности.
- При использовании Serve заголовки идентификации Tailscale удовлетворяют требованиям аутентификации интерфейса управления и WebSocket, если задано `gateway.auth.allowTailscale: true` (токен или пароль не требуются). Конечные точки HTTP API не используют заголовки идентификации Tailscale; они всегда следуют обычному режиму HTTP-аутентификации Gateway. Задайте `gateway.auth.allowTailscale: false`, чтобы требовать явные учётные данные даже при доступе через Serve. Этот режим без токена предполагает, что сам узел Gateway является доверенным. См. разделы [Tailscale](/ru/gateway/tailscale) и [Безопасность](/ru/gateway/security).

## Сборка интерфейса

Gateway обслуживает статические файлы из `dist/control-ui`:

```bash
pnpm ui:build
```
