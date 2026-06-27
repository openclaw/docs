---
read_when:
    - Створення інструментів хоста, які не можуть використовувати клієнт Gateway WebSocket RPC
    - Надання доступу до автоматизації адміністрування Gateway через приватну довірену точку входу
    - Аудит моделі безпеки для HTTP-доступу до методів Gateway
summary: Надати доступ до вибраних методів площини керування Gateway через вбудований Plugin admin-http-rpc, який вмикається явно
title: Адміністративний HTTP RPC Plugin
x-i18n:
    generated_at: "2026-06-27T17:48:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f701ef6be7457cd518ecb80b7ec5dade61bb057d62f4ca90984a4c1aa8fdf700
    source_path: plugins/admin-http-rpc.md
    workflow: 16
---

Вбудований Plugin `admin-http-rpc` надає вибрані методи площини керування Gateway через HTTP для довіреної автоматизації хоста, яка не може використовувати звичайний клієнт Gateway WebSocket RPC.

Plugin входить до складу OpenClaw, але типово вимкнений. Коли його вимкнено, маршрут не реєструється. Коли його ввімкнено, він додає:

- `POST /api/v1/admin/rpc`
- той самий слухач, що й Gateway: `http://<gateway-host>:<port>/api/v1/admin/rpc`

Вмикайте його лише для приватних інструментів хоста, автоматизації tailnet або довіреного внутрішнього ingress. Не відкривайте цей маршрут напряму для публічного інтернету.

## Перед увімкненням

Адміністративний HTTP RPC — це повна операторська поверхня площини керування. Будь-який викликач, що проходить HTTP-автентифікацію Gateway, може викликати дозволені методи на цій сторінці.

Використовуйте його, коли виконуються всі ці умови:

- Викликачу довірено керувати Gateway.
- Викликач не може використовувати клієнт WebSocket RPC.
- Маршрут доступний лише через loopback, tailnet або приватний автентифікований ingress.
- Ви переглянули дозволені методи, і вони відповідають автоматизації, яку ви плануєте запускати.

Використовуйте шлях WebSocket RPC для клієнтів OpenClaw та інтерактивних інструментів, які можуть тримати WebSocket-з’єднання з Gateway відкритим.

## Увімкнення

Увімкніть вбудований Plugin:

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

Маршрут реєструється під час запуску Plugin. Перезапустіть Gateway після зміни конфігурації Plugin.

Вимкніть його, коли HTTP-поверхня більше не потрібна:

```bash
openclaw plugins disable admin-http-rpc
openclaw gateway restart
```

## Перевірка маршруту

Використовуйте `health` як найменший безпечний запит:

```bash
curl -sS http://<gateway-host>:<port>/api/v1/admin/rpc \
  -H 'Authorization: Bearer <gateway-token>' \
  -H 'Content-Type: application/json' \
  -d '{"method":"health","params":{}}'
```

Успішна відповідь має `ok: true`:

```json
{
  "id": "generated-request-id",
  "ok": true,
  "payload": {
    "status": "ok"
  }
}
```

Коли Plugin вимкнено, маршрут повертає `404`, бо його не зареєстровано.

## Автентифікація

Маршрут Plugin використовує HTTP-автентифікацію Gateway.

Поширені шляхи автентифікації:

- автентифікація зі спільним секретом (`gateway.auth.mode="token"` або `"password"`): `Authorization: Bearer <token-or-password>`
- довірена HTTP-автентифікація з ідентичністю (`gateway.auth.mode="trusted-proxy"`): маршрутизуйте через налаштований identity-aware proxy і дозвольте йому вставити потрібні заголовки ідентичності
- відкритий доступ через приватний ingress (`gateway.auth.mode="none"`): заголовок автентифікації не потрібен

## Модель безпеки

Ставтеся до цього Plugin як до повної операторської поверхні Gateway.

- Увімкнення Plugin навмисно надає доступ до дозволених адміністративних методів RPC за адресою `/api/v1/admin/rpc`.
- Plugin оголошує зарезервований контракт маніфесту `contracts.gatewayMethodDispatch: ["authenticated-request"]`, щоб його HTTP-маршрут, автентифікований Gateway, міг диспетчеризувати методи площини керування в процесі.
- Bearer-автентифікація зі спільним секретом підтверджує володіння операторським секретом gateway.
- Для автентифікації `token` і `password` вужчі заголовки `x-openclaw-scopes` ігноруються, а звичайні повні операторські значення за замовчуванням відновлюються.
- Довірені HTTP-режими з ідентичністю враховують `x-openclaw-scopes`, коли він наявний.
- `gateway.auth.mode="none"` означає, що цей маршрут не автентифікований, якщо Plugin увімкнено. Використовуйте це лише за приватним ingress, якому ви повністю довіряєте.
- Запити диспетчеризуються через ті самі обробники методів Gateway і перевірки scope, що й WebSocket RPC, після успішної автентифікації маршруту Plugin.
- Тримайте цей маршрут на loopback, tailnet або приватному довіреному ingress. Не відкривайте його напряму для публічного інтернету.
- Контракти маніфесту Plugin не є sandbox. Вони запобігають випадковому використанню зарезервованих допоміжних засобів SDK; довірені Plugin усе одно виконуються в процесі Gateway.

Використовуйте окремі gateway, коли викликачі перетинають межі довіри.

## Запит

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

- `id` (рядок, необов’язково): копіюється у відповідь. UUID генерується, якщо поле пропущено.
- `method` (рядок, обов’язково): назва дозволеного методу Gateway.
- `params` (будь-що, необов’язково): параметри, специфічні для методу.

Типовий максимальний розмір тіла запиту становить 1 MB.

## Відповідь

Успішні відповіді використовують форму Gateway RPC:

```json
{
  "id": "optional-request-id",
  "ok": true,
  "payload": {}
}
```

Помилки методів Gateway використовують:

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

HTTP-статус відповідає помилці Gateway, коли це можливо. Наприклад, `INVALID_REQUEST` повертає `400`, а `UNAVAILABLE` повертає `503`.

## Дозволені методи

- discovery: `commands.list`
  Повертає назви методів HTTP RPC, дозволені цим Plugin.
- gateway: `health`, `status`, `logs.tail`, `usage.status`, `usage.cost`, `gateway.restart.request`
- config: `config.get`, `config.schema`, `config.schema.lookup`, `config.set`, `config.patch`, `config.apply`
- channels: `channels.status`, `channels.start`, `channels.stop`, `channels.logout`
- web: `web.login.start`, `web.login.wait`
- models: `models.list`, `models.authStatus`
- agents: `agents.list`, `agents.create`, `agents.update`, `agents.delete`
- approvals: `exec.approvals.get`, `exec.approvals.set`, `exec.approvals.node.get`, `exec.approvals.node.set`
- cron: `cron.status`, `cron.list`, `cron.get`, `cron.runs`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`
- devices: `device.pair.list`, `device.pair.approve`, `device.pair.reject`, `device.pair.remove`
- nodes: `node.list`, `node.describe`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, `node.rename`
- tasks: `tasks.list`, `tasks.get`, `tasks.cancel`
- diagnostics: `doctor.memory.status`, `update.status`

Інші методи Gateway заблоковані, доки їх навмисно не додадуть.

## Порівняння з WebSocket

Звичайний шлях Gateway WebSocket RPC залишається рекомендованим API площини керування для клієнтів OpenClaw. Використовуйте адміністративний HTTP RPC лише для інструментів хоста, яким потрібна HTTP-поверхня запит/відповідь.

Клієнти WebSocket зі спільним токеном без довіреної ідентичності пристрою не можуть самостійно оголошувати адміністративні scope під час підключення. Адміністративний HTTP RPC навмисно дотримується наявної моделі довіреного HTTP-оператора: коли Plugin увімкнено, bearer-автентифікація зі спільним секретом трактується як повний операторський доступ до цієї адміністративної поверхні.

## Усунення несправностей

`404 Not Found`

: Plugin вимкнено, Gateway не було перезапущено після його увімкнення, або запит надсилається до іншого процесу Gateway.

`401 Unauthorized`

: Запит не задовольнив HTTP-автентифікацію Gateway. Перевірте bearer-токен або заголовки ідентичності trusted-proxy.

`400 INVALID_REQUEST`

: Тіло запиту не є дійсним JSON, поле `method` відсутнє, або метод не входить до allowlist Plugin.

`503 UNAVAILABLE`

: Обробник методу Gateway недоступний. Перевірте журнали Gateway і повторіть спробу після завершення запуску Gateway.

## Пов’язане

- [Операторські scope](/uk/gateway/operator-scopes)
- [Безпека Gateway](/uk/gateway/security)
- [Віддалений доступ](/uk/gateway/remote)
- [Маніфест Plugin](/uk/plugins/manifest#contracts)
- [Підшляхи SDK](/uk/plugins/sdk-subpaths)
