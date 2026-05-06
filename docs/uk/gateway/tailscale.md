---
read_when:
    - Відкриття доступу до інтерфейсу керування Gateway за межами localhost
    - Автоматизація доступу до tailnet або публічної панелі керування
summary: Інтеграція Tailscale Serve/Funnel для панелі керування Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-05-06T15:54:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89a2094dc5d9250b3af2dcc991e83099bdf6fc4039c86358ca57f7e58899196d
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw може автоматично налаштовувати Tailscale **Serve** (tailnet) або **Funnel** (публічний доступ) для панелі Gateway і порту WebSocket. Це залишає Gateway прив’язаним до loopback, тоді як Tailscale забезпечує HTTPS, маршрутизацію та (для Serve) заголовки ідентичності.

## Режими

- `serve`: Serve лише для tailnet через `tailscale serve`. Gateway залишається на `127.0.0.1`.
- `funnel`: Публічний HTTPS через `tailscale funnel`. OpenClaw вимагає спільний пароль.
- `off`: Типово (без автоматизації Tailscale).

У виводі стану й аудиту для цього режиму OpenClaw Serve/Funnel використовується **експозиція Tailscale**. `off` означає, що OpenClaw не керує Serve або Funnel; це не означає, що локальний daemon Tailscale зупинено або з нього виконано вихід.

## Автентифікація

Установіть `gateway.auth.mode`, щоб керувати рукостисканням:

- `none` (лише приватний вхідний трафік)
- `token` (типово, коли встановлено `OPENCLAW_GATEWAY_TOKEN`)
- `password` (спільний секрет через `OPENCLAW_GATEWAY_PASSWORD` або конфігурацію)
- `trusted-proxy` (зворотний проксі з урахуванням ідентичності; див. [Автентифікація через довірений проксі](/uk/gateway/trusted-proxy-auth))

Коли `tailscale.mode = "serve"` і `gateway.auth.allowTailscale` має значення `true`, автентифікація Control UI/WebSocket може використовувати заголовки ідентичності Tailscale (`tailscale-user-login`) без надання токена/пароля. OpenClaw перевіряє ідентичність, розв’язуючи адресу `x-forwarded-for` через локальний daemon Tailscale (`tailscale whois`) і зіставляючи її із заголовком, перш ніж прийняти її. OpenClaw вважає запит Serve лише тоді, коли він надходить із loopback із заголовками Tailscale `x-forwarded-for`, `x-forwarded-proto` і `x-forwarded-host`.
Для операторських сеансів Control UI, які містять ідентичність пристрою браузера, цей перевірений шлях Serve також пропускає круговий обмін для сполучення пристрою. Він не обходить ідентичність пристрою браузера: клієнти без пристрою все одно відхиляються, а з’єднання WebSocket з роллю вузла або не-Control UI все одно проходять звичайні перевірки сполучення й автентифікації.
Кінцеві точки HTTP API (наприклад `/v1/*`, `/tools/invoke` і `/api/channels/*`) **не** використовують автентифікацію через заголовки ідентичності Tailscale. Вони й надалі дотримуються звичайного режиму HTTP-автентифікації gateway: автентифікація зі спільним секретом типово або навмисно налаштований trusted-proxy / приватний вхідний `none`.
Цей потік без токена припускає, що хост gateway є довіреним. Якщо на тому самому хості може виконуватися недовірений локальний код, вимкніть `gateway.auth.allowTailscale` і натомість вимагайте автентифікацію токеном/паролем.
Щоб вимагати явні облікові дані зі спільним секретом, установіть `gateway.auth.allowTailscale: false` і використовуйте `gateway.auth.mode: "token"` або `"password"`.

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

### Лише tailnet (прив’язка до IP Tailnet)

Використовуйте це, коли хочете, щоб Gateway прослуховував безпосередньо IP Tailnet (без Serve/Funnel).

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
Loopback (`http://127.0.0.1:18789`) **не** працюватиме в цьому режимі.
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

Надавайте перевагу `OPENCLAW_GATEWAY_PASSWORD`, а не коміту пароля на диск.

## Приклади CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Примітки

- Tailscale Serve/Funnel вимагає встановленого CLI `tailscale` і входу в обліковий запис.
- `tailscale.mode: "funnel"` відмовляється запускатися, якщо режим автентифікації не `password`, щоб уникнути публічної експозиції.
- Установіть `gateway.tailscale.resetOnExit`, якщо хочете, щоб OpenClaw скасовував конфігурацію `tailscale serve` або `tailscale funnel` під час завершення роботи.
- `gateway.bind: "tailnet"` — це пряма прив’язка до Tailnet (без HTTPS, без Serve/Funnel).
- `gateway.bind: "auto"` надає перевагу loopback; використовуйте `tailnet`, якщо потрібен лише Tailnet.
- Serve/Funnel відкривають доступ лише до **Control UI Gateway + WS**. Вузли підключаються через ту саму кінцеву точку Gateway WS, тому Serve може працювати для доступу вузлів.

## Керування браузером (віддалений Gateway + локальний браузер)

Якщо ви запускаєте Gateway на одному комп’ютері, але хочете керувати браузером на іншому комп’ютері, запустіть **хост вузла** на комп’ютері з браузером і тримайте обидва в одному tailnet.
Gateway проксіюватиме дії браузера до вузла; окремий сервер керування або URL Serve не потрібні.

Уникайте Funnel для керування браузером; розглядайте сполучення вузлів як операторський доступ.

## Передумови й обмеження Tailscale

- Serve вимагає ввімкненого HTTPS для вашого tailnet; CLI показує запит, якщо його бракує.
- Serve додає заголовки ідентичності Tailscale; Funnel цього не робить.
- Funnel вимагає Tailscale v1.38.3+, MagicDNS, увімкненого HTTPS і атрибута вузла funnel.
- Funnel підтримує лише порти `443`, `8443` і `10000` через TLS.
- Funnel на macOS вимагає open-source варіант застосунку Tailscale.

## Дізнатися більше

- Огляд Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Команда `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Огляд Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Команда `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Пов’язане

- [Віддалений доступ](/uk/gateway/remote)
- [Виявлення](/uk/gateway/discovery)
- [Автентифікація](/uk/gateway/authentication)
