---
read_when:
    - Створення інструментів для хоста, які не можуть використовувати RPC-клієнт WebSocket для Gateway
    - Надання доступу до автоматизації адміністрування Gateway через приватну довірену точку входу
    - Аудит моделі безпеки HTTP-доступу до методів Gateway
summary: Надайте доступ до вибраних методів площини керування Gateway через вбудований Plugin admin-http-rpc, який потрібно явно ввімкнути
title: Plugin адміністративного HTTP RPC
x-i18n:
    generated_at: "2026-07-12T13:28:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0709081efd0ce65cef7edac54df9a71978cbad17e2b25df83ac9075de938376c
    source_path: plugins/admin-http-rpc.md
    workflow: 16
---

Вбудований plugin `admin-http-rpc` надає через HTTP дозволений список методів площини керування Gateway для довіреної автоматизації на хості, яка не може підтримувати відкрите WebSocket-з’єднання з Gateway.

Він постачається з OpenClaw, але за замовчуванням вимкнений; коли його вимкнено, маршрут не реєструється. Коли його ввімкнено, він додає `POST /api/v1/admin/rpc` до того самого прослуховувача, що й Gateway (`http://<gateway-host>:<port>/api/v1/admin/rpc`).

Вмикайте його лише для приватних інструментів хоста, автоматизації в tailnet або довіреної внутрішньої точки входу. Ніколи не надавайте прямий доступ до цього маршруту з публічного Інтернету.

## Перед увімкненням

Адміністративний HTTP RPC — це повноцінна операторська поверхня площини керування: будь-який клієнт, що проходить HTTP-автентифікацію Gateway, може викликати наведені нижче дозволені методи. Вмикайте його, лише якщо виконуються всі ці умови:

- Клієнт є довіреним для керування Gateway.
- Клієнт не може використовувати RPC-клієнт WebSocket.
- Маршрут доступний лише через loopback, tailnet або приватну автентифіковану точку входу.
- Ви перевірили дозволені методи, і вони відповідають автоматизації, яку плануєте запускати.

Для клієнтів OpenClaw та інтерактивних інструментів, які можуть підтримувати відкрите WebSocket-з’єднання з Gateway, натомість використовуйте WebSocket RPC.

## Увімкнення

Увімкніть вбудований plugin:

<Tabs>
  <Tab title="CLI">
    ```bash
    openclaw plugins enable admin-http-rpc
    openclaw gateway restart
    ```
  </Tab>
  <Tab title="Конфігурація">
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

Маршрут реєструється під час запуску plugin, тому після зміни конфігурації plugin перезапустіть Gateway.

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

Успішна відповідь містить `ok: true`:

```json
{
  "id": "generated-request-id",
  "ok": true,
  "payload": {
    "status": "ok"
  }
}
```

Коли plugin вимкнено, маршрут повертає `404`, оскільки він не зареєстрований.

## Автентифікація

Маршрут plugin використовує HTTP-автентифікацію Gateway.

Поширені способи автентифікації:

- автентифікація за спільним секретом (`gateway.auth.mode="token"` або `"password"`): `Authorization: Bearer <token-or-password>`
- довірена HTTP-автентифікація з даними ідентичності (`gateway.auth.mode="trusted-proxy"`): спрямуйте маршрут через налаштований проксі-сервер із підтримкою ідентичності та дозвольте йому додати необхідні заголовки ідентичності
- відкрита автентифікація приватної точки входу (`gateway.auth.mode="none"`): заголовок автентифікації не потрібен

## Модель безпеки

Розглядайте цей plugin як повноцінну операторську поверхню Gateway.

- Увімкнення plugin навмисно надає доступ до дозволених адміністративних методів RPC за адресою `/api/v1/admin/rpc`.
- Plugin оголошує зарезервований контракт маніфесту `contracts.gatewayMethodDispatch: ["authenticated-request"]`, який дає змогу його HTTP-маршруту, автентифікованому через Gateway, передавати методи площини керування всередині процесу. Це не пісочниця: контракт запобігає випадковому використанню зарезервованих допоміжних засобів SDK, але довірені plugins усе одно виконуються в процесі Gateway.
- Автентифікація за спільним секретом у форматі Bearer (`token`/`password`) підтверджує володіння операторським секретом Gateway; вужчі заголовки `x-openclaw-scopes` у цьому режимі ігноруються, а звичайні повні операторські дозволи за замовчуванням відновлюються.
- Довірена HTTP-автентифікація з даними ідентичності (режим `trusted-proxy`) враховує `x-openclaw-scopes`, якщо його вказано.
- `gateway.auth.mode="none"` означає, що цей маршрут не потребує автентифікації, якщо plugin увімкнено. Використовуйте цей режим лише за приватною точкою входу, якій ви повністю довіряєте.
- Після успішної автентифікації маршруту plugin запити передаються через ті самі обробники методів Gateway і перевірки областей доступу, що й WebSocket RPC.
- Маршрут залишається доступним під час підготовленої оренди призупинення. Обмежена перевірка запитів і локальна відповідь виявлення `commands.list` залишаються доступними. Серед методів, що передаються до Gateway, лише `gateway.suspend.prepare`, `gateway.suspend.status` і `gateway.suspend.resume` можуть виконуватися, коли приймання запитів закрито; інші дозволені методи повертають звичайну повторювану відповідь Gateway `UNAVAILABLE`.
- Залишайте цей маршрут доступним лише через loopback, tailnet або приватну довірену точку входу. Не надавайте прямий доступ до нього з публічного Інтернету. Використовуйте окремі Gateway, коли клієнти належать до різних меж довіри.

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

- `id` (рядок, необов’язкове): копіюється у відповідь. Якщо його не вказано, генерується UUID.
- `method` (рядок, обов’язкове): ім’я дозволеного методу Gateway.
- `params` (будь-який тип, необов’язкове): параметри конкретного методу.

Максимальний розмір тіла запиту за замовчуванням становить 1 МБ.

## Відповідь

Успішні відповіді використовують формат RPC Gateway:

```json
{
  "id": "optional-request-id",
  "ok": true,
  "payload": {}
}
```

Помилки методів Gateway використовують такий формат:

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

Статус HTTP відповідає коду помилки:

| Код помилки                | Статус HTTP |
| -------------------------- | ----------- |
| `INVALID_REQUEST`          | 400         |
| `APPROVAL_NOT_FOUND`       | 404         |
| `NOT_LINKED`, `NOT_PAIRED` | 409         |
| `UNAVAILABLE`              | 503         |
| `AGENT_TIMEOUT`            | 504         |
| будь-який інший код        | 500         |

## Дозволені методи

- виявлення: `commands.list`
  Повертає імена методів HTTP RPC, дозволених цим plugin.
- Gateway: `health`, `status`, `logs.tail`, `usage.status`, `usage.cost`, `gateway.restart.request`, `gateway.suspend.prepare`, `gateway.suspend.status`, `gateway.suspend.resume`
- конфігурація: `config.get`, `config.schema`, `config.schema.lookup`, `config.set`, `config.patch`, `config.apply`
- канали: `channels.status`, `channels.start`, `channels.stop`, `channels.logout`
- веб: `web.login.start`, `web.login.wait`
- моделі: `models.list`, `models.authStatus`
- агенти: `agents.list`, `agents.create`, `agents.update`, `agents.delete`
- схвалення: `exec.approvals.get`, `exec.approvals.set`, `exec.approvals.node.get`, `exec.approvals.node.set`
- Cron: `cron.status`, `cron.list`, `cron.get`, `cron.runs`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`
- пристрої: `device.pair.list`, `device.pair.approve`, `device.pair.reject`, `device.pair.remove`
- вузли: `node.list`, `node.describe`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, `node.rename`
- завдання: `tasks.list`, `tasks.get`, `tasks.cancel`
- діагностика: `doctor.memory.status`, `update.status`

Інші методи Gateway заблоковані, доки їх не буде додано навмисно.

## Порівняння з WebSocket

Звичайний шлях RPC через WebSocket Gateway залишається рекомендованим API площини керування для клієнтів OpenClaw. Використовуйте адміністративний HTTP RPC лише для інструментів хоста, яким потрібна HTTP-поверхня запит-відповідь.

WebSocket-клієнти зі спільним токеном без довіреної ідентичності пристрою не можуть самостійно оголошувати адміністративні області доступу під час підключення. Адміністративний HTTP RPC навмисно дотримується наявної моделі довіреного HTTP-оператора: коли plugin увімкнено, Bearer-автентифікація за спільним секретом вважається повним операторським доступом до цієї адміністративної поверхні.

## Усунення несправностей

`404 Not Found`

: Plugin вимкнено, Gateway не було перезапущено після його увімкнення або запит надсилається до іншого процесу Gateway.

`401 Unauthorized`

: Запит не пройшов HTTP-автентифікацію Gateway. Перевірте Bearer-токен або заголовки ідентичності `trusted-proxy`.

`405 Method Not Allowed`

: У запиті використано метод, відмінний від `POST`.

`413 Payload Too Large`

: Розмір тіла запиту перевищив обмеження в 1 МБ.

`400 INVALID_REQUEST`

: Тіло запиту не є коректним JSON, поле `method` відсутнє, методу немає в дозволеному списку plugin або ідентифікатор відновлення після призупинення не відповідає активній оренді.

`503 UNAVAILABLE`

: Метод Gateway запускається, обмежений за частотою, призупинений або очікує завершення конкурентної операції призупинення чи відновлення. Перевірте `error.details`, якщо воно наявне, і зачекайте `error.retryAfterMs` перед повторною спробою.

## Пов’язані матеріали

- [Області доступу оператора](/uk/gateway/operator-scopes)
- [Безпека Gateway](/uk/gateway/security)
- [Віддалений доступ](/uk/gateway/remote)
- [Маніфест plugin](/uk/plugins/manifest#contracts-reference)
- [Підшляхи SDK](/uk/plugins/sdk-subpaths)
