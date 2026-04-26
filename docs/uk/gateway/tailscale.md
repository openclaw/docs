---
read_when:
    - Відкриття інтерфейсу керування Gateway за межами localhost
    - Автоматизація доступу до панелі керування через tailnet або публічно
summary: Інтегровано Tailscale Serve/Funnel для панелі Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-04-26T08:50:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: b5966490f8e85774b5149ed29cf7fd4b108eb438f94f5f74a3e5aa3e3b39568a
    source_path: gateway/tailscale.md
    workflow: 15
---

OpenClaw може автоматично налаштовувати Tailscale **Serve** (tailnet) або **Funnel** (публічно) для
панелі керування Gateway і порту WebSocket. Це дозволяє залишати Gateway прив’язаним до loopback, тоді як
Tailscale надає HTTPS, маршрутизацію та (для Serve) заголовки ідентифікації.

## Режими

- `serve`: Serve лише для Tailnet через `tailscale serve`. Gateway залишається на `127.0.0.1`.
- `funnel`: Публічний HTTPS через `tailscale funnel`. OpenClaw вимагає спільний пароль.
- `off`: Типово (без автоматизації Tailscale).

У виводі стану та аудиту для цього режиму OpenClaw Serve/Funnel використовується **Tailscale exposure**.
`off` означає, що OpenClaw не керує Serve або Funnel; це не означає, що
локальний демон Tailscale зупинений або вийшов із системи.

## Автентифікація

Установіть `gateway.auth.mode`, щоб керувати handshake:

- `none` (лише приватний вхідний доступ)
- `token` (типово, коли встановлено `OPENCLAW_GATEWAY_TOKEN`)
- `password` (спільний секрет через `OPENCLAW_GATEWAY_PASSWORD` або конфігурацію)
- `trusted-proxy` (reverse proxy з урахуванням ідентифікації; див. [Автентифікація Trusted Proxy](/uk/gateway/trusted-proxy-auth))

Коли `tailscale.mode = "serve"` і `gateway.auth.allowTailscale` має значення `true`,
автентифікація Control UI/WebSocket може використовувати заголовки ідентифікації Tailscale
(`tailscale-user-login`) без передавання токена/пароля. OpenClaw перевіряє
ідентифікацію, визначаючи адресу `x-forwarded-for` через локальний демон Tailscale
(`tailscale whois`) і звіряючи її із заголовком перед прийняттям. OpenClaw
вважає запит Serve лише тоді, коли він надходить із loopback із заголовками
Tailscale `x-forwarded-for`, `x-forwarded-proto` і `x-forwarded-host`.
Для сесій оператора Control UI, що включають ідентифікацію пристрою браузера, цей
перевірений шлях Serve також пропускає цикл pairing пристрою. Це не обходить
ідентифікацію пристрою браузера: клієнти без пристрою все одно відхиляються, а підключення
Node-role або WebSocket, що не належать до Control UI, як і раніше проходять звичайні перевірки pairing та
автентифікації.
Кінцеві точки HTTP API (наприклад, `/v1/*`, `/tools/invoke` і `/api/channels/*`)
**не** використовують автентифікацію через заголовки ідентифікації Tailscale. Вони, як і раніше, дотримуються
звичайного режиму HTTP-автентифікації Gateway: типово це автентифікація зі спільним секретом,
або навмисно налаштована схема `trusted-proxy` / `none` для приватного доступу.
Цей безтокенний потік передбачає, що хост Gateway є довіреним. Якщо на тому самому хості
може виконуватися недовірений локальний код, вимкніть `gateway.auth.allowTailscale` і натомість
вимагайте автентифікацію через токен/пароль.
Щоб вимагати явні облікові дані зі спільним секретом, установіть `gateway.auth.allowTailscale: false`
і використовуйте `gateway.auth.mode: "token"` або `"password"`.

## Приклади конфігурації

### Лише Tailnet (Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Відкрити: `https://<magicdns>/` (або ваш налаштований `gateway.controlUi.basePath`)

### Лише Tailnet (прив’язка до IP Tailnet)

Використовуйте це, якщо хочете, щоб Gateway слухав безпосередньо на IP Tailnet (без Serve/Funnel).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Підключення з іншого пристрою Tailnet:

- Control UI: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

Примітка: loopback (`http://127.0.0.1:18789`) у цьому режимі **не** працюватиме.

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

Надавайте перевагу `OPENCLAW_GATEWAY_PASSWORD`, а не збереженню пароля на диск.

## Приклади CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Примітки

- Tailscale Serve/Funnel вимагає, щоб CLI `tailscale` був установлений і виконав вхід.
- `tailscale.mode: "funnel"` відмовляється запускатися, якщо режим автентифікації не `password`, щоб уникнути публічного доступу.
- Установіть `gateway.tailscale.resetOnExit`, якщо хочете, щоб OpenClaw скасовував конфігурацію `tailscale serve`
  або `tailscale funnel` під час завершення роботи.
- `gateway.bind: "tailnet"` — це пряма прив’язка до Tailnet (без HTTPS, без Serve/Funnel).
- `gateway.bind: "auto"` надає перевагу loopback; використовуйте `tailnet`, якщо хочете лише Tailnet.
- Serve/Funnel відкривають лише **панель керування Gateway + WS**. Nodes підключаються через
  ту саму кінцеву точку Gateway WS, тож Serve може працювати і для доступу Node.

## Керування браузером (віддалений Gateway + локальний браузер)

Якщо ви запускаєте Gateway на одній машині, але хочете керувати браузером на іншій,
запустіть **хост Node** на машині з браузером і залиште обидві машини в одному tailnet.
Gateway проксіюватиме дії браузера до Node; окремий сервер керування або URL Serve не потрібні.

Уникайте Funnel для керування браузером; ставтеся до pairing Node так само, як до доступу оператора.

## Передумови та обмеження Tailscale

- Serve вимагає ввімкненого HTTPS для вашого tailnet; CLI запропонує це, якщо його бракує.
- Serve додає заголовки ідентифікації Tailscale; Funnel — ні.
- Funnel вимагає Tailscale v1.38.3+, MagicDNS, увімкнений HTTPS і атрибут вузла funnel.
- Funnel підтримує лише порти `443`, `8443` і `10000` через TLS.
- Funnel на macOS вимагає варіант застосунку Tailscale з відкритим кодом.

## Докладніше

- Огляд Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Команда `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Огляд Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Команда `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Пов’язане

- [Віддалений доступ](/uk/gateway/remote)
- [Виявлення](/uk/gateway/discovery)
- [Автентифікація](/uk/gateway/authentication)
