---
read_when:
    - Предоставление доступа к интерфейсу управления Gateway за пределами localhost
    - Автоматизация доступа к панели управления через tailnet или публичную сеть
summary: Интеграция Tailscale Serve/Funnel для панели управления Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-07-12T11:27:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e201a64ac427994401fae1b934d94e0c5afe976b4acd34d45b059978f5f1807e
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw может автоматически настроить Tailscale **Serve** (для tailnet) или **Funnel** (для публичного доступа) для панели управления Gateway и порта WebSocket. При этом Gateway остаётся привязанным к loopback, а Tailscale обеспечивает HTTPS, маршрутизацию и (для Serve) заголовки идентификации.

## Режимы

`gateway.tailscale.mode`:

| Режим          | Поведение                                                                    |
| --------------- | --------------------------------------------------------------------------- |
| `serve`         | Serve только для tailnet через `tailscale serve`. Gateway остаётся на `127.0.0.1`. |
| `funnel`        | Публичный HTTPS через `tailscale funnel`. Требуется общий пароль.            |
| `off` (по умолчанию) | Автоматизация Tailscale отключена.                                      |

В выводе состояния и аудита для этого режима OpenClaw Serve/Funnel используется термин **доступ через Tailscale**. Значение `off` означает, что OpenClaw не управляет Serve или Funnel; это не означает, что локальный демон Tailscale остановлен или вышел из учётной записи.

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

Откройте: `https://<magicdns>/` (или настроенный путь `gateway.controlUi.basePath`)

Чтобы предоставить доступ к интерфейсу управления через именованную службу Tailscale вместо имени хоста устройства, задайте в `gateway.tailscale.serviceName` имя службы:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve", serviceName: "svc:openclaw" },
  },
}
```

После этого при запуске вместо имени хоста устройства будет указан URL службы: `https://openclaw.<tailnet-name>.ts.net/`. Для Tailscale Services хост должен быть одобренным тегированным узлом в вашей tailnet. Перед включением этой настройки задайте тег и одобрите службу в Tailscale, иначе команда `tailscale serve --service=...` завершится ошибкой при запуске Gateway.

### Только tailnet (привязка к IP-адресу Tailnet)

Используйте эту конфигурацию, чтобы Gateway прослушивал непосредственно IP-адрес Tailnet без Serve/Funnel:

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Подключение с другого устройства Tailnet:

- Интерфейс управления: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

<Note>
При наличии подходящего для привязки IPv4-адреса Tailnet Gateway также обязательно использует `http://127.0.0.1:18789` для аутентифицированных клиентов на том же хосте. Если при запуске адрес Tailnet недоступен, используется только loopback; перезапустите Gateway после появления доступа к Tailscale, чтобы добавить прямой доступ через Tailnet. Ни один из этих путей не предоставляет доступ из локальной сети или Интернета.
</Note>

### Публичный Интернет (Funnel + общий пароль)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" },
  },
}
```

Предпочтительно использовать `OPENCLAW_GATEWAY_PASSWORD`, а не сохранять пароль на диске в конфигурации.

## Примеры CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Аутентификация

`gateway.auth.mode` управляет установлением соединения:

| Режим                                                  | Назначение                                                                         |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `none`                                                 | Только приватный входящий доступ                                                   |
| `token` (по умолчанию, если задан `OPENCLAW_GATEWAY_TOKEN`) | Общий токен                                                                   |
| `password`                                             | Общий секрет через `OPENCLAW_GATEWAY_PASSWORD` или конфигурацию                    |
| `trusted-proxy`                                        | Обратный прокси с учётом идентификации; см. [Аутентификация через доверенный прокси](/ru/gateway/trusted-proxy-auth) |

### Заголовки идентификации Tailscale (только Serve)

Если задано `tailscale.mode: "serve"`, а `gateway.auth.allowTailscale` имеет значение `true`, для аутентификации интерфейса управления/WebSocket вместо токена или пароля могут использоваться заголовки идентификации Tailscale (`tailscale-user-login`). Перед принятием запроса OpenClaw проверяет заголовок: получает сведения об адресе `x-forwarded-for` запроса через локальный демон Tailscale (`tailscale whois`) и сопоставляет полученное имя входа со значением заголовка. Запрос соответствует условиям этого способа аутентификации, только если он поступает через loopback и содержит заголовки Tailscale `x-forwarded-for`, `x-forwarded-proto` и `x-forwarded-host`.

Этот способ без токена предполагает, что хост Gateway является доверенным. Если на том же хосте может выполняться недоверенный локальный код, задайте `gateway.auth.allowTailscale: false` и вместо этого требуйте аутентификацию по токену или паролю.

Область действия обхода:

- Применяется только к аутентификации WebSocket интерфейса управления. Конечные точки HTTP API (`/v1/*`, `/tools/invoke`, `/api/channels/*` и т. д.) никогда не используют аутентификацию по заголовкам идентификации Tailscale; для них всегда применяется обычный режим HTTP-аутентификации Gateway.
- Для операторских сеансов интерфейса управления, в которых браузер уже предоставляет идентификатор устройства, проверенная идентификация Tailscale позволяет пропустить цикл сопряжения с начальным токеном/QR-кодом.
- Идентификация самого устройства не обходится: клиенты без идентификатора устройства по-прежнему отклоняются, а подключения с ролью узла по-прежнему проходят обычные проверки сопряжения и аутентификации.

## Примечания

- Для Tailscale Serve/Funnel требуется установленный CLI `tailscale` с выполненным входом.
- При `tailscale.mode: "funnel"` запуск отклоняется, если режим аутентификации не равен `password`, чтобы предотвратить незащищённый публичный доступ.
- `gateway.tailscale.serviceName` применяется только в режиме Serve и передаётся команде `tailscale serve --service=<name>`. Значение должно соответствовать формату Tailscale `svc:<dns-label>`, например `svc:openclaw`. Tailscale требует, чтобы хостами службы были тегированные узлы; кроме того, перед публикацией службы через Serve может потребоваться её одобрение в консоли администратора.
- `gateway.tailscale.resetOnExit` отменяет конфигурацию `tailscale serve`/`tailscale funnel` при завершении работы.
- `gateway.tailscale.preserveFunnel: true` сохраняет активным настроенный извне маршрут `tailscale funnel` при перезапусках Gateway. При `mode: "serve"` OpenClaw проверяет `tailscale funnel status` перед повторным применением Serve и пропускает его, если маршрут Funnel уже охватывает порт Gateway. Политика OpenClaw, требующая пароль для управляемого OpenClaw режима Funnel, остаётся неизменной.
- `gateway.bind: "tailnet"` использует прямую привязку к Tailnet (без HTTPS и Serve/Funnel), а при наличии IPv4-адреса Tailnet также обязательный локальный адрес `127.0.0.1`; в противном случае используется только loopback.
- `gateway.bind: "auto"` предпочитает loopback; используйте `tailnet`, чтобы ограничить сетевой доступ Tailnet, сохранив доступ через loopback с того же хоста.
- Serve/Funnel предоставляют доступ только к **интерфейсу управления Gateway и WS**. Узлы подключаются через ту же конечную точку WS Gateway, поэтому Serve также обеспечивает доступ для узлов.

### Требования и ограничения Tailscale

- Для Serve в вашей tailnet должен быть включён HTTPS; если он отсутствует, CLI предложит включить его.
- Serve добавляет заголовки идентификации Tailscale, а Funnel — нет.
- Для Funnel требуются Tailscale версии 1.38.3 или новее, MagicDNS, включённый HTTPS и атрибут узла funnel.
- Funnel поддерживает через TLS только порты `443`, `8443` и `10000`.
- Для Funnel в macOS требуется вариант приложения Tailscale с открытым исходным кодом.

## Управление браузером (удалённый Gateway + локальный браузер)

Чтобы запустить Gateway на одном компьютере, а управлять браузером на другом, запустите **хост узла** на компьютере с браузером и подключите оба компьютера к одной tailnet. Gateway перенаправляет действия браузера узлу; отдельный сервер управления или URL Serve не требуется.

Не используйте Funnel для управления браузером; относитесь к сопряжению узла как к операторскому доступу.

## Подробнее

- Обзор Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Команда `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Обзор Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Команда `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Связанные разделы

- [Удалённый доступ](/ru/gateway/remote)
- [Обнаружение](/ru/gateway/discovery)
- [Аутентификация](/ru/gateway/authentication)
