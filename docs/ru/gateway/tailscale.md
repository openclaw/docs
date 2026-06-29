---
read_when:
    - Предоставление доступа к интерфейсу управления Gateway за пределами localhost
    - Автоматизация доступа к tailnet или публичной панели управления
summary: Интегрированный Tailscale Serve/Funnel для панели мониторинга Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-06-28T23:01:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 35944eba19cd82d373b25c602b66d1b76f35ad63aa90767bb1c7ef75549fe905
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw может автоматически настроить Tailscale **Serve** (tailnet) или **Funnel** (публичный доступ) для панели Gateway и порта WebSocket. При этом Gateway остается привязанным к loopback-интерфейсу, а Tailscale предоставляет HTTPS, маршрутизацию и (для Serve) заголовки идентификации.

## Режимы

- `serve`: Serve только для tailnet через `tailscale serve`. Gateway остается на `127.0.0.1`.
- `funnel`: Публичный HTTPS через `tailscale funnel`. OpenClaw требует общий пароль.
- `off`: Значение по умолчанию (без автоматизации Tailscale).

Вывод статуса и аудита использует **экспозицию Tailscale** для этого режима OpenClaw Serve/Funnel. `off` означает, что OpenClaw не управляет Serve или Funnel; это не означает, что локальный демон Tailscale остановлен или вышел из учетной записи.

## Аутентификация

Задайте `gateway.auth.mode`, чтобы управлять handshake:

- `none` (только частный входящий доступ)
- `token` (по умолчанию, когда задан `OPENCLAW_GATEWAY_TOKEN`)
- `password` (общий секрет через `OPENCLAW_GATEWAY_PASSWORD` или конфигурацию)
- `trusted-proxy` (identity-aware reverse proxy; см. [Аутентификация через доверенный прокси](/ru/gateway/trusted-proxy-auth))

Когда `tailscale.mode = "serve"` и `gateway.auth.allowTailscale` имеет значение `true`, аутентификация Control UI/WebSocket может использовать заголовки идентификации Tailscale (`tailscale-user-login`) без передачи токена/пароля. OpenClaw проверяет идентичность, разрешая адрес `x-forwarded-for` через локальный демон Tailscale (`tailscale whois`) и сопоставляя его с заголовком перед принятием запроса. OpenClaw считает запрос Serve только тогда, когда он поступает с loopback и содержит заголовки Tailscale `x-forwarded-for`, `x-forwarded-proto` и `x-forwarded-host`.
Для операторских сессий Control UI, включающих идентичность устройства браузера, этот проверенный путь Serve также пропускает цикл сопряжения устройства. Он не обходит идентичность устройства браузера: клиенты без устройства по-прежнему отклоняются, а node-role или не относящиеся к Control UI подключения WebSocket по-прежнему проходят обычные проверки сопряжения и аутентификации.
HTTP API endpoints (например, `/v1/*`, `/tools/invoke` и `/api/channels/*`) **не** используют аутентификацию по заголовкам идентификации Tailscale. Они по-прежнему следуют обычному режиму HTTP-аутентификации Gateway: аутентификация с общим секретом по умолчанию или намеренно настроенная схема trusted-proxy / private-ingress `none`.
Этот поток без токена предполагает, что хост Gateway является доверенным. Если на том же хосте может выполняться недоверенный локальный код, отключите `gateway.auth.allowTailscale` и вместо этого требуйте аутентификацию токеном/паролем.
Чтобы требовать явные учетные данные с общим секретом, задайте `gateway.auth.allowTailscale: false` и используйте `gateway.auth.mode: "token"` или `"password"`.

## Примеры конфигурации

### Только tailnet (Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Откройте: `https://<magicdns>/` (или настроенный вами `gateway.controlUi.basePath`)

Чтобы открыть Control UI через именованную Tailscale Service вместо имени хоста устройства, задайте `gateway.tailscale.serviceName` равным имени Service:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve", serviceName: "svc:openclaw" },
  },
}
```

В приведенном выше примере запуск сообщает URL Service как `https://openclaw.<tailnet-name>.ts.net/` вместо имени хоста устройства.
Tailscale Services требуют, чтобы хост был утвержденным тегированным узлом в вашем tailnet. Настройте тег и утвердите Service в Tailscale перед включением этой опции, иначе `tailscale serve --service=...` завершится ошибкой во время запуска Gateway.

### Только tailnet (привязка к IP Tailnet)

Используйте это, когда хотите, чтобы Gateway слушал напрямую на IP Tailnet (без Serve/Funnel).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Подключение с другого устройства Tailnet:

- Control UI: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

<Note>
Loopback (`http://127.0.0.1:18789`) **не** будет работать в этом режиме.
</Note>

### Публичный интернет (Funnel + общий пароль)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" },
  },
}
```

Предпочитайте `OPENCLAW_GATEWAY_PASSWORD` вместо записи пароля на диск.

## Примеры CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Примечания

- Tailscale Serve/Funnel требует установленного CLI `tailscale` и входа в учетную запись.
- `tailscale.mode: "funnel"` отказывается запускаться, если режим аутентификации не `password`, чтобы избежать публичной экспозиции.
- `gateway.tailscale.serviceName` применяется только к режиму Serve и передается в `tailscale serve --service=<name>`. Значение должно использовать формат имени Tailscale Service `svc:<dns-label>`, например `svc:openclaw`. Tailscale требует, чтобы хосты Service были тегированными узлами, а Service может потребовать утверждения в консоли администратора, прежде чем Serve сможет его опубликовать.
- Задайте `gateway.tailscale.resetOnExit`, если хотите, чтобы OpenClaw отменял конфигурацию `tailscale serve` или `tailscale funnel` при завершении работы.
- Задайте `gateway.tailscale.preserveFunnel: true`, чтобы сохранить внешне настроенный маршрут `tailscale funnel` активным между перезапусками Gateway. Когда это включено и Gateway работает в `mode: "serve"`, OpenClaw проверяет `tailscale funnel status` перед повторным применением Serve и пропускает его, когда маршрут Funnel уже покрывает порт Gateway. Политика Funnel, управляемого OpenClaw, только с паролем не меняется.
- `gateway.bind: "tailnet"` — это прямая привязка Tailnet (без HTTPS, без Serve/Funnel).
- `gateway.bind: "auto"` предпочитает loopback; используйте `tailnet`, если хотите только Tailnet.
- Serve/Funnel открывают только **Gateway control UI + WS**. Узлы подключаются через тот же endpoint Gateway WS, поэтому Serve может работать для доступа узлов.

## Управление браузером (удаленный Gateway + локальный браузер)

Если вы запускаете Gateway на одной машине, но хотите управлять браузером на другой машине, запустите **хост узла** на машине с браузером и держите обе машины в одном tailnet.
Gateway будет проксировать действия браузера на узел; отдельный сервер управления или URL Serve не требуется.

Избегайте Funnel для управления браузером; относитесь к сопряжению узлов как к операторскому доступу.

## Предварительные требования и ограничения Tailscale

- Serve требует включенного HTTPS для вашего tailnet; CLI выводит запрос, если он отсутствует.
- Serve внедряет заголовки идентификации Tailscale; Funnel — нет.
- Funnel требует Tailscale v1.38.3+, MagicDNS, включенный HTTPS и атрибут funnel node.
- Funnel поддерживает только порты `443`, `8443` и `10000` поверх TLS.
- Funnel на macOS требует open-source варианта приложения Tailscale.

## Подробнее

- Обзор Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Команда `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Обзор Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Команда `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Связанные материалы

- [Удаленный доступ](/ru/gateway/remote)
- [Обнаружение](/ru/gateway/discovery)
- [Аутентификация](/ru/gateway/authentication)
