---
read_when:
    - Відкриття Control UI Gateway поза localhost
    - Автоматизація доступу до панелі через tailnet або публічного доступу
summary: Інтегрований Tailscale Serve/Funnel для панелі Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-04-27T06:25:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: e5bc0a90ce8105017f5f52bad4a40609711f4bd4538437916c020680d3e9eda4
    source_path: gateway/tailscale.md
    workflow: 15
---

OpenClaw може автоматично налаштовувати Tailscale **Serve** (tailnet) або **Funnel** (публічно) для
панелі Gateway і порту WebSocket. Це дозволяє залишати Gateway прив’язаним до loopback, тоді як
Tailscale забезпечує HTTPS, маршрутизацію і (для Serve) заголовки ідентичності.

## Режими

- `serve`: Serve лише для tailnet через `tailscale serve`. Gateway залишається на `127.0.0.1`.
- `funnel`: Публічний HTTPS через `tailscale funnel`. OpenClaw вимагає спільний пароль.
- `off`: Типово (без автоматизації Tailscale).

У виводі status і audit для цього режиму OpenClaw Serve/Funnel використовується термін **Tailscale exposure**.
`off` означає, що OpenClaw не керує Serve або Funnel; це не означає, що
локальний демон Tailscale зупинено або з нього вийшли.

## Автентифікація

Установіть `gateway.auth.mode`, щоб керувати handshake:

- `none` (лише приватний ingress)
- `token` (типово, коли встановлено `OPENCLAW_GATEWAY_TOKEN`)
- `password` (спільний секрет через `OPENCLAW_GATEWAY_PASSWORD` або config)
- `trusted-proxy` (reverse proxy з урахуванням ідентичності; див. [Автентифікація Trusted Proxy](/uk/gateway/trusted-proxy-auth))

Коли `tailscale.mode = "serve"` і `gateway.auth.allowTailscale` має значення `true`,
автентифікація для Control UI/WebSocket може використовувати заголовки ідентичності Tailscale
(`tailscale-user-login`) без надання token/password. OpenClaw перевіряє
ідентичність, визначаючи адресу `x-forwarded-for` через локальний демон Tailscale
(`tailscale whois`) і звіряючи її із заголовком перед прийняттям.
OpenClaw вважає запит Serve лише тоді, коли він надходить із loopback із
заголовками Tailscale `x-forwarded-for`, `x-forwarded-proto` і `x-forwarded-host`.
Для сеансів операторів Control UI, які включають ідентичність пристрою браузера, цей
перевірений шлях Serve також пропускає цикл взаємного сполучення пристрою. Це не обходить
ідентичність пристрою браузера: клієнти без пристрою все одно відхиляються, а з’єднання вузлів
або WebSocket-з’єднання не для Control UI, як і раніше, проходять звичайні перевірки pairing і
автентифікації.
Кінцеві точки HTTP API (наприклад `/v1/*`, `/tools/invoke` і `/api/channels/*`)
**не** використовують автентифікацію через заголовки ідентичності Tailscale. Вони, як і раніше, підкоряються
звичайному режиму HTTP-автентифікації gateway: типово це автентифікація через спільний секрет або
спеціально налаштований trusted-proxy / приватний ingress `none`.
Цей безтокеновий потік виходить з того, що хост gateway є довіреним. Якщо на тому самому хості
може виконуватися недовірений локальний код, вимкніть `gateway.auth.allowTailscale` і натомість
вимагайте автентифікацію через token/password.
Щоб вимагати явні облікові дані зі спільним секретом, установіть `gateway.auth.allowTailscale: false`
і використовуйте `gateway.auth.mode: "token"` або `"password"`.

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

Відкрити: `https://<magicdns>/` (або ваш налаштований `gateway.controlUi.basePath`)

### Лише tailnet (прив’язка до Tailnet IP)

Використовуйте це, якщо хочете, щоб Gateway слухав безпосередньо на Tailnet IP (без Serve/Funnel).

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

<Note>
Loopback (`http://127.0.0.1:18789`) у цьому режимі **не** працюватиме.
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

Краще використовувати `OPENCLAW_GATEWAY_PASSWORD`, ніж зберігати пароль на диску.

## Приклади CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Примітки

- Tailscale Serve/Funnel вимагає, щоб CLI `tailscale` був установлений і в ньому було виконано вхід.
- `tailscale.mode: "funnel"` відмовляється запускатися, якщо режим автентифікації не `password`, щоб уникнути публічного відкриття.
- Установіть `gateway.tailscale.resetOnExit`, якщо хочете, щоб OpenClaw скасовував конфігурацію `tailscale serve`
  або `tailscale funnel` під час завершення роботи.
- `gateway.bind: "tailnet"` — це пряма прив’язка до Tailnet (без HTTPS, без Serve/Funnel).
- `gateway.bind: "auto"` надає перевагу loopback; використовуйте `tailnet`, якщо хочете лише Tailnet.
- Serve/Funnel відкривають лише **control UI + WS Gateway**. Вузли підключаються через
  ту саму кінцеву точку Gateway WS, тому Serve може працювати для доступу вузлів.

## Керування браузером (віддалений Gateway + локальний браузер)

Якщо ви запускаєте Gateway на одній машині, але хочете керувати браузером на іншій,
запустіть **хост вузла** на машині з браузером і тримайте обидві машини в одній tailnet.
Gateway проксіюватиме дії браузера до вузла; окремий сервер керування або URL Serve не потрібні.

Уникайте Funnel для керування браузером; ставтеся до pairing вузлів так само, як до доступу операторів.

## Передумови й обмеження Tailscale

- Serve вимагає, щоб для вашої tailnet було ввімкнено HTTPS; CLI підкаже, якщо цього бракує.
- Serve додає заголовки ідентичності Tailscale; Funnel — ні.
- Funnel вимагає Tailscale v1.38.3+, MagicDNS, увімкнений HTTPS і атрибут вузла funnel.
- Funnel підтримує лише порти `443`, `8443` і `10000` через TLS.
- Funnel на macOS вимагає варіант застосунку Tailscale з відкритим кодом.

## Дізнатися більше

- Огляд Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Команда `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Огляд Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Команда `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Пов’язане

- [Віддалений доступ](/uk/gateway/remote)
- [Виявлення](/uk/gateway/discovery)
- [Автентифікація](/uk/gateway/authentication)
