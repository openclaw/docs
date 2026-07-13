---
read_when:
    - Предоставление доступа к интерфейсу управления Gateway за пределами localhost
    - Автоматизация доступа к панели управления через tailnet или публичную сеть
summary: Встроенные Tailscale Serve/Funnel для панели управления Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-07-13T18:15:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: e201a64ac427994401fae1b934d94e0c5afe976b4acd34d45b059978f5f1807e
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw может автоматически настроить Tailscale **Serve** (для tailnet) или **Funnel** (для публичного доступа) для панели управления Gateway и порта WebSocket. При этом Gateway остаётся привязанным к интерфейсу обратной петли, а Tailscale обеспечивает HTTPS, маршрутизацию и (для Serve) заголовки идентификации.

## Режимы

`gateway.tailscale.mode`:

| Режим            | Поведение                                                                    |
| --------------- | --------------------------------------------------------------------------- |
| `serve`         | Serve только в tailnet через `tailscale serve`. Gateway остаётся на `127.0.0.1`. |
| `funnel`        | Публичный HTTPS через `tailscale funnel`. Требуется общий пароль.            |
| `off` (по умолчанию) | Автоматизация Tailscale отключена.                                                    |

В выводе состояния и аудита для этого режима OpenClaw Serve/Funnel используется термин **доступ через Tailscale**. `off` означает, что OpenClaw не управляет Serve или Funnel; это не означает, что локальный демон Tailscale остановлен или вышел из системы.

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

Чтобы предоставить доступ к интерфейсу управления через именованную службу Tailscale вместо имени хоста устройства, задайте для `gateway.tailscale.serviceName` имя службы:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve", serviceName: "svc:openclaw" },
  },
}
```

После этого при запуске вместо имени хоста устройства отображается URL службы: `https://openclaw.<tailnet-name>.ts.net/`. Для Tailscale Services хост должен быть одобренным маркированным узлом в вашей tailnet — настройте тег и одобрите службу в Tailscale перед включением этой функции, иначе `tailscale serve --service=...` завершится ошибкой при запуске Gateway.

### Только tailnet (привязка к IP-адресу Tailnet)

Используйте этот вариант, чтобы Gateway напрямую прослушивал IP-адрес Tailnet без Serve/Funnel:

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
Если доступен пригодный для привязки IPv4-адрес Tailnet, Gateway также требует `http://127.0.0.1:18789` для аутентифицированных клиентов на том же хосте. Если при запуске адрес Tailnet недоступен, используется только интерфейс обратной петли; перезапустите Gateway после появления Tailscale, чтобы добавить прямой доступ через Tailnet. Ни один из этих вариантов не предоставляет доступ из локальной сети или интернета.
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

Вместо сохранения пароля на диске рекомендуется использовать `OPENCLAW_GATEWAY_PASSWORD`.

## Примеры CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Аутентификация

`gateway.auth.mode` управляет рукопожатием:

| Режим                                                   | Сценарий использования                                                                            |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `none`                                                 | Только закрытый входящий доступ                                                                |
| `token` (по умолчанию, если задан `OPENCLAW_GATEWAY_TOKEN`) | Общий токен                                                                        |
| `password`                                             | Общий секрет через `OPENCLAW_GATEWAY_PASSWORD` или конфигурацию                             |
| `trusted-proxy`                                        | Обратный прокси с учётом идентификации; см. [Аутентификация через доверенный прокси](/ru/gateway/trusted-proxy-auth) |

### Заголовки идентификации Tailscale (только Serve)

Если `tailscale.mode: "serve"` и `gateway.auth.allowTailscale` имеет значение `true`, аутентификация интерфейса управления/WebSocket может использовать заголовки идентификации Tailscale (`tailscale-user-login`) вместо токена или пароля. Перед принятием запроса OpenClaw проверяет заголовок: определяет адрес `x-forwarded-for` запроса через локальный демон Tailscale (`tailscale whois`) и сопоставляет его с именем входа в заголовке. Этот способ применяется к запросу только в том случае, если он поступает с интерфейса обратной петли и содержит заголовки Tailscale `x-forwarded-for`, `x-forwarded-proto` и `x-forwarded-host`.

Этот процесс без токена предполагает, что хост Gateway является доверенным. Если на том же хосте может выполняться недоверенный локальный код, задайте `gateway.auth.allowTailscale: false` и вместо этого требуйте аутентификацию с помощью токена или пароля.

Область действия обхода:

- Применяется только к аутентификации WebSocket интерфейса управления. Конечные точки HTTP API (`/v1/*`, `/tools/invoke`, `/api/channels/*` и т. д.) никогда не используют аутентификацию по заголовкам идентификации Tailscale; они всегда следуют обычному режиму HTTP-аутентификации Gateway.
- Для операторских сеансов интерфейса управления, которые уже содержат идентификационные данные устройства браузера, подтверждённая идентификация Tailscale позволяет пропустить обмен начальным токеном или QR-кодом для сопряжения.
- Идентификация самого устройства не обходится: клиенты без идентификации устройства по-прежнему отклоняются, а подключения с ролью узла всё равно проходят обычные проверки сопряжения и аутентификации.

## Примечания

- Для Tailscale Serve/Funnel требуется установленный CLI `tailscale` с выполненным входом.
- `tailscale.mode: "funnel"` не запускается, если режим аутентификации не равен `password`, чтобы избежать публичного доступа.
- `gateway.tailscale.serviceName` применяется только к режиму Serve и передаётся в `tailscale serve --service=<name>`. Значение должно использовать формат Tailscale `svc:<dns-label>`, например `svc:openclaw`. Tailscale требует, чтобы хосты службы были маркированными узлами, а перед публикацией службы через Serve может потребоваться её одобрение в консоли администратора.
- `gateway.tailscale.resetOnExit` отменяет конфигурацию `tailscale serve`/`tailscale funnel` при завершении работы.
- `gateway.tailscale.preserveFunnel: true` сохраняет внешне настроенный маршрут `tailscale funnel` при перезапусках Gateway. При `mode: "serve"` OpenClaw проверяет `tailscale funnel status` перед повторным применением Serve и пропускает его, если маршрут Funnel уже охватывает порт Gateway. Политика Funnel под управлением OpenClaw, допускающая только пароль, остаётся неизменной.
- `gateway.bind: "tailnet"` использует прямую привязку к Tailnet (без HTTPS и Serve/Funnel) вместе с обязательным локальным `127.0.0.1`, если доступен IPv4-адрес Tailnet; в противном случае используется только интерфейс обратной петли.
- `gateway.bind: "auto"` предпочитает интерфейс обратной петли; используйте `tailnet`, чтобы ограничить сетевой доступ Tailnet, сохранив доступ через интерфейс обратной петли на том же хосте.
- Serve/Funnel предоставляют доступ только к **интерфейсу управления Gateway и WS**. Узлы подключаются через ту же конечную точку WS Gateway, поэтому Serve также подходит для доступа узлов.

### Требования и ограничения Tailscale

- Для Serve в вашей tailnet должен быть включён HTTPS; если он отсутствует, CLI предложит включить его.
- Serve добавляет заголовки идентификации Tailscale, а Funnel — нет.
- Для Funnel требуются Tailscale v1.38.3+, MagicDNS, включённый HTTPS и атрибут узла Funnel.
- Funnel поддерживает через TLS только порты `443`, `8443` и `10000`.
- Для Funnel в macOS требуется вариант приложения Tailscale с открытым исходным кодом.

## Управление браузером (удалённый Gateway + локальный браузер)

Чтобы запустить Gateway на одном компьютере, но управлять браузером на другом, запустите **хост узла** на компьютере с браузером и подключите оба компьютера к одной tailnet. Gateway проксирует действия браузера на узел; отдельный сервер управления или URL Serve не требуется.

Не используйте Funnel для управления браузером; относитесь к сопряжению узла как к операторскому доступу.

## Дополнительные сведения

- Обзор Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Команда `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Обзор Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Команда `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Связанные материалы

- [Удалённый доступ](/ru/gateway/remote)
- [Обнаружение](/ru/gateway/discovery)
- [Аутентификация](/ru/gateway/authentication)
