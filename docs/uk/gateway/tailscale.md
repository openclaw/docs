---
read_when:
    - Надання доступу до інтерфейсу керування Gateway поза межами localhost
    - Автоматизація доступу до панелі керування через tailnet або публічну мережу
summary: Інтегровані Tailscale Serve/Funnel для панелі керування Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-07-12T13:19:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e201a64ac427994401fae1b934d94e0c5afe976b4acd34d45b059978f5f1807e
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw може автоматично налаштувати Tailscale **Serve** (tailnet) або **Funnel** (публічний доступ) для панелі керування Gateway і порту WebSocket. Завдяки цьому Gateway залишається прив’язаним до local loopback, а Tailscale забезпечує HTTPS, маршрутизацію та (для Serve) заголовки ідентифікації.

## Режими

`gateway.tailscale.mode`:

| Режим           | Поведінка                                                                                 |
| --------------- | ----------------------------------------------------------------------------------------- |
| `serve`         | Serve лише в tailnet через `tailscale serve`. Gateway залишається на `127.0.0.1`.          |
| `funnel`        | Публічний HTTPS через `tailscale funnel`. Потребує спільного пароля.                       |
| `off` (типово)  | Без автоматизації Tailscale.                                                              |

У виводі стану та аудиту для цього режиму Serve/Funnel в OpenClaw використовується назва **доступність через Tailscale**. `off` означає, що OpenClaw не керує Serve або Funnel; це не означає, що локальний демон Tailscale зупинено або з нього вийшли.

## Приклади конфігурації

### Лише tailnet (Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Відкрийте: `https://<magicdns>/` (або налаштований вами `gateway.controlUi.basePath`)

Щоб опублікувати інтерфейс керування через іменовану службу Tailscale замість імені хоста пристрою, задайте для `gateway.tailscale.serviceName` назву служби:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve", serviceName: "svc:openclaw" },
  },
}
```

Після цього під час запуску URL-адреса служби відображатиметься як `https://openclaw.<tailnet-name>.ts.net/` замість імені хоста пристрою. Для служб Tailscale хост має бути схваленим позначеним тегом вузлом у вашій tailnet — налаштуйте тег і схваліть службу в Tailscale, перш ніж вмикати цю можливість, інакше команда `tailscale serve --service=...` завершиться помилкою під час запуску Gateway.

### Лише tailnet (прив’язка до IP-адреси Tailnet)

Скористайтеся цим варіантом, щоб Gateway прослуховував безпосередньо IP-адресу Tailnet без Serve/Funnel:

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Підключення з іншого пристрою в Tailnet:

- Інтерфейс керування: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

<Note>
За наявності придатної для прив’язки IPv4-адреси Tailnet Gateway також використовує `http://127.0.0.1:18789` для автентифікованих клієнтів на тому самому хості. Якщо під час запуску адреса Tailnet недоступна, використовується лише local loopback; перезапустіть Gateway після появи доступу до Tailscale, щоб додати прямий доступ через Tailnet. Жоден із цих шляхів не надає доступу з локальної мережі або публічного доступу.
</Note>

### Публічний інтернет (Funnel + спільний пароль)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" },
  },
}
```

Використовуйте `OPENCLAW_GATEWAY_PASSWORD` замість збереження пароля на диску.

## Приклади CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Автентифікація

`gateway.auth.mode` керує встановленням з’єднання:

| Режим                                                 | Сценарій використання                                                                  |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `none`                                                | Лише приватний вхідний доступ                                                          |
| `token` (типово, якщо задано `OPENCLAW_GATEWAY_TOKEN`)| Спільний токен                                                                         |
| `password`                                            | Спільний секрет через `OPENCLAW_GATEWAY_PASSWORD` або конфігурацію                     |
| `trusted-proxy`                                       | Зворотний проксі з урахуванням ідентичності; див. [Автентифікація через довірений проксі](/uk/gateway/trusted-proxy-auth) |

### Заголовки ідентифікації Tailscale (лише Serve)

Коли задано `tailscale.mode: "serve"` і `gateway.auth.allowTailscale` має значення `true`, для автентифікації інтерфейсу керування/WebSocket можна використовувати заголовки ідентифікації Tailscale (`tailscale-user-login`) замість токена або пароля. Перед прийняттям запиту OpenClaw перевіряє заголовок: визначає адресу `x-forwarded-for` запиту через локальний демон Tailscale (`tailscale whois`) і зіставляє її з логіном у заголовку. Запит відповідає вимогам цього шляху, лише якщо він надходить із local loopback і містить заголовки Tailscale `x-forwarded-for`, `x-forwarded-proto` та `x-forwarded-host`.

Цей процес без токена передбачає, що хост Gateway є довіреним. Якщо на тому самому хості може виконуватися недовірений локальний код, задайте `gateway.auth.allowTailscale: false` і натомість вимагайте автентифікацію за токеном або паролем.

Область дії обходу:

- Застосовується лише до автентифікації WebSocket інтерфейсу керування. Кінцеві точки HTTP API (`/v1/*`, `/tools/invoke`, `/api/channels/*` тощо) ніколи не використовують автентифікацію за заголовками ідентифікації Tailscale; вони завжди використовують звичайний режим HTTP-автентифікації Gateway.
- Для операторських сеансів інтерфейсу керування, які вже містять ідентичність браузерного пристрою, перевірена ідентичність Tailscale дає змогу пропустити цикл сполучення за початковим токеном або QR-кодом.
- Це не обходить саму перевірку ідентичності пристрою: клієнти без ідентичності пристрою все одно відхиляються, а з’єднання з роллю вузла й надалі проходять звичайні перевірки сполучення та автентифікації.

## Примітки

- Для Tailscale Serve/Funnel необхідно встановити CLI `tailscale` і ввійти в систему.
- `tailscale.mode: "funnel"` не запускається, якщо режим автентифікації не дорівнює `password`, щоб уникнути ненавмисного публічного доступу.
- `gateway.tailscale.serviceName` застосовується лише в режимі Serve і передається до `tailscale serve --service=<name>`. Значення має відповідати формату Tailscale `svc:<dns-label>`, наприклад `svc:openclaw`. Tailscale вимагає, щоб хости служб були вузлами з тегами, а служба може потребувати схвалення в консолі адміністратора, перш ніж Serve зможе її опублікувати.
- `gateway.tailscale.resetOnExit` скасовує конфігурацію `tailscale serve`/`tailscale funnel` під час завершення роботи.
- `gateway.tailscale.preserveFunnel: true` зберігає зовнішньо налаштований маршрут `tailscale funnel` активним після перезапусків Gateway. З `mode: "serve"` OpenClaw перевіряє `tailscale funnel status` перед повторним застосуванням Serve і пропускає його, якщо маршрут Funnel уже охоплює порт Gateway. Політика OpenClaw для керованого Funnel, що дозволяє лише пароль, не змінюється.
- `gateway.bind: "tailnet"` використовує пряму прив’язку до Tailnet (без HTTPS і Serve/Funnel), а також обов’язкову локальну адресу `127.0.0.1`, коли доступна IPv4-адреса Tailnet; інакше використовується лише local loopback.
- `gateway.bind: "auto"` надає перевагу local loopback; використовуйте `tailnet`, щоб обмежити мережеву доступність Tailnet, зберігаючи доступ через local loopback із того самого хоста.
- Serve/Funnel надають доступ лише до **інтерфейсу керування Gateway та WS**. Вузли підключаються через ту саму кінцеву точку WS Gateway, тому Serve також забезпечує доступ для вузлів.

### Передумови й обмеження Tailscale

- Serve потребує ввімкненого HTTPS для вашої tailnet; якщо його немає, CLI запропонує ввімкнути.
- Serve додає заголовки ідентифікації Tailscale; Funnel — ні.
- Для Funnel потрібні Tailscale v1.38.3+, MagicDNS, увімкнений HTTPS і атрибут вузла Funnel.
- Funnel підтримує через TLS лише порти `443`, `8443` і `10000`.
- Для Funnel у macOS потрібен варіант застосунку Tailscale з відкритим кодом.

## Керування браузером (віддалений Gateway + локальний браузер)

Щоб запустити Gateway на одному комп’ютері, але керувати браузером на іншому, запустіть **хост вузла** на комп’ютері з браузером і залиште обидва пристрої в одній tailnet. Gateway передає дії браузера до вузла через проксі; окремий сервер керування або URL-адреса Serve не потрібні.

Уникайте Funnel для керування браузером; ставтеся до сполучення вузлів як до операторського доступу.

## Докладніше

- Огляд Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Команда `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Огляд Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Команда `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Пов’язані матеріали

- [Віддалений доступ](/uk/gateway/remote)
- [Виявлення](/uk/gateway/discovery)
- [Автентифікація](/uk/gateway/authentication)
