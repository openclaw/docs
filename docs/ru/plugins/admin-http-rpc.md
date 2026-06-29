---
read_when:
    - Создание инструментов хоста, которые не могут использовать WebSocket RPC-клиент Gateway
    - Публикация административной автоматизации Gateway за частным доверенным ingress
    - Аудит модели безопасности для HTTP-доступа к методам Gateway
summary: Предоставить доступ к выбранным методам плоскости управления Gateway через встроенный, подключаемый по явному выбору Plugin admin-http-rpc
title: Admin HTTP RPC Plugin
x-i18n:
    generated_at: "2026-06-28T23:14:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f701ef6be7457cd518ecb80b7ec5dade61bb057d62f4ca90984a4c1aa8fdf700
    source_path: plugins/admin-http-rpc.md
    workflow: 16
---

Встроенный plugin `admin-http-rpc` открывает выбранные методы плоскости управления Gateway через HTTP для доверенной автоматизации хоста, которая не может использовать обычный WebSocket RPC-клиент Gateway.

Plugin включен в OpenClaw, но по умолчанию отключен. Когда он отключен, маршрут не регистрируется. Когда он включен, он добавляет:

- `POST /api/v1/admin/rpc`
- тот же слушатель, что и Gateway: `http://<gateway-host>:<port>/api/v1/admin/rpc`

Включайте его только для приватных инструментов хоста, автоматизации tailnet или доверенного внутреннего входа. Не открывайте этот маршрут напрямую в публичный интернет.

## Перед включением

Admin HTTP RPC — это полноценная операторская поверхность плоскости управления. Любой вызывающий клиент, прошедший HTTP-аутентификацию Gateway, может вызывать разрешенные методы на этой странице.

Используйте его, когда выполняются все эти условия:

- Вызывающему клиенту доверено управление Gateway.
- Вызывающий клиент не может использовать WebSocket RPC-клиент.
- Маршрут доступен только на loopback, в tailnet или через приватный аутентифицированный вход.
- Вы проверили разрешенные методы, и они соответствуют автоматизации, которую вы планируете запускать.

Используйте путь WebSocket RPC для клиентов OpenClaw и интерактивных инструментов, которые могут держать WebSocket-подключение Gateway открытым.

## Включение

Включите встроенный plugin:

<Tabs>
  <Tab title="CLI">
    ```bash
    openclaw plugins enable admin-http-rpc
    openclaw gateway restart
    ```
  </Tab>
  <Tab title="Config">
    ```json5
    {
      plugins: {
        entries: {
          "admin-http-rpc": { enabled: true },
        },
      },
    }
    ```
  </Tab>
</Tabs>

Маршрут регистрируется при запуске plugin. Перезапустите Gateway после изменения конфигурации plugin.

Отключите его, когда HTTP-поверхность больше не нужна:

```bash
openclaw plugins disable admin-http-rpc
openclaw gateway restart
```

## Проверка маршрута

Используйте `health` как самый маленький безопасный запрос:

```bash
curl -sS http://<gateway-host>:<port>/api/v1/admin/rpc \
  -H 'Authorization: Bearer <gateway-token>' \
  -H 'Content-Type: application/json' \
  -d '{"method":"health","params":{}}'
```

Успешный ответ содержит `ok: true`:

```json
{
  "id": "generated-request-id",
  "ok": true,
  "payload": {
    "status": "ok"
  }
}
```

Когда plugin отключен, маршрут возвращает `404`, потому что он не зарегистрирован.

## Аутентификация

Маршрут plugin использует HTTP-аутентификацию Gateway.

Распространенные пути аутентификации:

- аутентификация с общим секретом (`gateway.auth.mode="token"` или `"password"`): `Authorization: Bearer <token-or-password>`
- доверенная HTTP-аутентификация с удостоверением (`gateway.auth.mode="trusted-proxy"`): направляйте через настроенный прокси с учетом удостоверений и позвольте ему внедрить требуемые заголовки удостоверения
- открытая аутентификация через приватный вход (`gateway.auth.mode="none"`): заголовок аутентификации не требуется

## Модель безопасности

Относитесь к этому plugin как к полноценной операторской поверхности Gateway.

- Включение plugin намеренно предоставляет доступ к разрешенным admin RPC-методам по адресу `/api/v1/admin/rpc`.
- Plugin объявляет зарезервированный контракт манифеста `contracts.gatewayMethodDispatch: ["authenticated-request"]`, чтобы его HTTP-маршрут с аутентификацией Gateway мог диспетчеризовать методы плоскости управления внутри процесса.
- Bearer-аутентификация с общим секретом подтверждает владение операторским секретом gateway.
- Для аутентификации `token` и `password` более узкие заголовки `x-openclaw-scopes` игнорируются, а обычные полные операторские значения по умолчанию восстанавливаются.
- Доверенные HTTP-режимы с удостоверением учитывают `x-openclaw-scopes`, когда они присутствуют.
- `gateway.auth.mode="none"` означает, что этот маршрут не аутентифицирован, если plugin включен. Используйте это только за приватным входом, которому вы полностью доверяете.
- После прохождения аутентификации маршрута plugin запросы диспетчеризуются через те же обработчики методов Gateway и проверки областей доступа, что и WebSocket RPC.
- Держите этот маршрут на loopback, в tailnet или за приватным доверенным входом. Не открывайте его напрямую в публичный интернет.
- Контракты манифеста plugin не являются песочницей. Они предотвращают случайное использование зарезервированных вспомогательных средств SDK; доверенные plugins все равно выполняются в процессе Gateway.

Используйте отдельные gateway, когда вызывающие клиенты пересекают границы доверия.

## Запрос

```http
POST /api/v1/admin/rpc
Authorization: Bearer <gateway-token>
Content-Type: application/json
```

```json
{
  "id": "optional-request-id",
  "method": "health",
  "params": {}
}
```

Поля:

- `id` (строка, необязательно): копируется в ответ. UUID генерируется, если поле опущено.
- `method` (строка, обязательно): имя разрешенного метода Gateway.
- `params` (любое значение, необязательно): параметры, специфичные для метода.

Максимальный размер тела запроса по умолчанию — 1 МБ.

## Ответ

Успешные ответы используют форму Gateway RPC:

```json
{
  "id": "optional-request-id",
  "ok": true,
  "payload": {}
}
```

Ошибки методов Gateway используют:

```json
{
  "id": "optional-request-id",
  "ok": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "bad params"
  }
}
```

HTTP-статус по возможности следует ошибке Gateway. Например, `INVALID_REQUEST` возвращает `400`, а `UNAVAILABLE` возвращает `503`.

## Разрешенные методы

- обнаружение: `commands.list`
  Возвращает имена методов HTTP RPC, разрешенные этим plugin.
- gateway: `health`, `status`, `logs.tail`, `usage.status`, `usage.cost`, `gateway.restart.request`
- конфигурация: `config.get`, `config.schema`, `config.schema.lookup`, `config.set`, `config.patch`, `config.apply`
- каналы: `channels.status`, `channels.start`, `channels.stop`, `channels.logout`
- веб: `web.login.start`, `web.login.wait`
- модели: `models.list`, `models.authStatus`
- агенты: `agents.list`, `agents.create`, `agents.update`, `agents.delete`
- подтверждения: `exec.approvals.get`, `exec.approvals.set`, `exec.approvals.node.get`, `exec.approvals.node.set`
- cron: `cron.status`, `cron.list`, `cron.get`, `cron.runs`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`
- устройства: `device.pair.list`, `device.pair.approve`, `device.pair.reject`, `device.pair.remove`
- узлы: `node.list`, `node.describe`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, `node.rename`
- задачи: `tasks.list`, `tasks.get`, `tasks.cancel`
- диагностика: `doctor.memory.status`, `update.status`

Другие методы Gateway заблокированы, пока они не будут намеренно добавлены.

## Сравнение с WebSocket

Обычный путь Gateway WebSocket RPC остается предпочтительным API плоскости управления для клиентов OpenClaw. Используйте admin HTTP RPC только для инструментов хоста, которым нужна HTTP-поверхность запрос/ответ.

WebSocket-клиенты с общим токеном без доверенного удостоверения устройства не могут самостоятельно объявлять admin-области при подключении. Admin HTTP RPC намеренно следует существующей доверенной HTTP-модели оператора: когда plugin включен, bearer-аутентификация с общим секретом рассматривается как полный операторский доступ для этой admin-поверхности.

## Устранение неполадок

`404 Not Found`

: Plugin отключен, Gateway не был перезапущен после его включения, или запрос идет в другой процесс Gateway.

`401 Unauthorized`

: Запрос не удовлетворил HTTP-аутентификацию Gateway. Проверьте bearer-токен или заголовки удостоверения trusted-proxy.

`400 INVALID_REQUEST`

: Тело запроса не является допустимым JSON, поле `method` отсутствует, или метод не находится в списке разрешений plugin.

`503 UNAVAILABLE`

: Обработчик метода Gateway недоступен. Проверьте журналы Gateway и повторите попытку после завершения запуска Gateway.

## Связанные материалы

- [Операторские области](/ru/gateway/operator-scopes)
- [Безопасность Gateway](/ru/gateway/security)
- [Удаленный доступ](/ru/gateway/remote)
- [Манифест Plugin](/ru/plugins/manifest#contracts)
- [Подпути SDK](/ru/plugins/sdk-subpaths)
