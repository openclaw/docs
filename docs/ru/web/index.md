---
read_when:
    - Вы хотите получить доступ к Gateway через Tailscale
    - Вам нужны браузерный интерфейс управления и редактирование конфигурации
summary: 'Веб-интерфейсы Gateway: интерфейс управления, режимы привязки и безопасность'
title: Веб
x-i18n:
    generated_at: "2026-07-13T18:52:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 413fb029d95241f5c6043b28825727cdee52b2fa8cbe998fbbd6e3ff7b81467b
    source_path: web/index.md
    workflow: 16
---

Gateway предоставляет небольшой **браузерный интерфейс управления** (Vite + Lit) на том же порту, что и WebSocket Gateway:

- по умолчанию: `http://<host>:18789/`
- с `gateway.tls.enabled: true`: `https://<host>:18789/`
- необязательный префикс: задайте `gateway.controlUi.basePath` (например, `/openclaw`)

Возможности описаны в разделе [Интерфейс управления](/ru/web/control-ui). На этой странице рассматриваются режимы привязки, безопасность и другие веб-интерфейсы.

## Конфигурация (включено по умолчанию)

Интерфейс управления **включён по умолчанию**, когда ресурсы доступны (`dist/control-ui`):

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath необязателен
  },
}
```

## Webhook

Если `hooks.enabled=true`, Gateway также предоставляет конечную точку Webhook на том же HTTP-сервере. Сведения об аутентификации и полезной нагрузке см. в разделе `hooks` [справочника по конфигурации Gateway](/ru/gateway/configuration-reference#hooks).

## Административный HTTP RPC

`POST /api/v1/admin/rpc` предоставляет выбранные методы плоскости управления Gateway через HTTP. По умолчанию отключён; регистрируется только при включённом плагине `admin-http-rpc`. Модель аутентификации, разрешённые методы и сравнение с API WebSocket см. в разделе [Административный HTTP RPC](/ru/plugins/admin-http-rpc).

## Доступ через Tailscale

<Tabs>
  <Tab title="Встроенный Serve (рекомендуется)">
    Оставьте Gateway привязанным к loopback-интерфейсу и используйте Tailscale Serve в качестве прокси:

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

    Откройте `https://<magicdns>/` (или настроенный вами `gateway.controlUi.basePath`).

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

    Запустите Gateway (в этом примере с привязкой не к loopback-интерфейсу используется аутентификация по токену с общим секретом):

    ```bash
    openclaw gateway
    ```

    Откройте `http://<tailscale-ip>:18789/` (или настроенный вами `gateway.controlUi.basePath`).

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

    Для `tailscale.mode: "funnel"` требуется `gateway.auth.mode: "password"`; для Serve и Funnel требуется `gateway.bind: "loopback"`.

  </Tab>
</Tabs>

## Примечания по безопасности

- По умолчанию требуется аутентификация Gateway: токен, пароль, доверенный прокси-сервер или, если они включены, заголовки идентификации Tailscale Serve.
- При привязке не к loopback-интерфейсу аутентификация Gateway также **обязательна**: аутентификация по токену/паролю или обратный прокси-сервер с проверкой идентификации и `gateway.auth.mode: "trusted-proxy"`.
- Мастер первоначальной настройки по умолчанию создаёт аутентификацию с общим секретом и обычно генерирует токен Gateway даже при привязке к loopback-интерфейсу.
- В режиме общего секрета интерфейс отправляет `connect.params.auth.token` или `connect.params.auth.password` во время установления соединения WebSocket.
- При использовании `gateway.tls.enabled: true` локальные вспомогательные средства панели управления и состояния формируют URL-адреса `https://` и URL-адреса WebSocket `wss://`.
- В режимах с передачей идентификационных данных (Tailscale Serve, `trusted-proxy`) проверка аутентификации WebSocket выполняется на основе заголовков запроса, а не общего секрета.
- При публичном развёртывании интерфейса управления с привязкой не к loopback-интерфейсу явно задайте `gateway.controlUi.allowedOrigins` (полные источники). Для loopback, RFC1918/link-local, `.local`, `.ts.net` и узлов Tailscale CGNAT частные загрузки из того же источника принимаются без этого параметра.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback: true` включает резервное определение источника по заголовку Host; это опасное ослабление безопасности.
- При использовании Serve заголовки идентификации Tailscale обеспечивают аутентификацию интерфейса управления/WebSocket, если `gateway.auth.allowTailscale: true` (токен или пароль не требуется). Конечные точки HTTP API не используют заголовки идентификации Tailscale; они всегда следуют обычному режиму HTTP-аутентификации Gateway. Задайте `gateway.auth.allowTailscale: false`, чтобы требовать явные учётные данные даже при использовании Serve. Этот режим без токена предполагает, что сам узел Gateway является доверенным. См. разделы [Tailscale](/ru/gateway/tailscale) и [Безопасность](/ru/gateway/security).

## Сборка интерфейса

Gateway предоставляет статические файлы из `dist/control-ui`:

```bash
pnpm ui:build
```
