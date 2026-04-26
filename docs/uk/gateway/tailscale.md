---
read_when:
    - Відкриття інтерфейсу керування Gateway поза межами localhost
    - Автоматизація доступу до панелі керування tailnet або публічної панелі керування
summary: Інтегровано Tailscale Serve/Funnel для панелі керування Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-04-26T00:52:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: a02a2bfc18c8b9f373257c236b86c250e0b4a1b67f200c62f04c42fed2a4b119
    source_path: gateway/tailscale.md
    workflow: 15
---

OpenClaw може автоматично налаштовувати Tailscale **Serve** (tailnet) або **Funnel** (публічний доступ) для панелі керування Gateway і порту WebSocket. Це дає змогу залишати Gateway прив’язаним до local loopback, тоді як Tailscale забезпечує HTTPS, маршрутизацію та (для Serve) заголовки ідентичності.

## Режими

- `serve`: Serve лише для Tailnet через `tailscale serve`. Gateway залишається на `127.0.0.1`.
- `funnel`: Публічний HTTPS через `tailscale funnel`. OpenClaw вимагає спільний пароль.
- `off`: Типово (без автоматизації Tailscale).

У статусі та виводі аудиту для цього режиму OpenClaw Serve/Funnel використовується **Tailscale exposure**. `off` означає, що OpenClaw не керує Serve або Funnel; це не означає, що локальний демон Tailscale зупинений або вийшов із системи.

## Автентифікація

Установіть `gateway.auth.mode`, щоб керувати рукостисканням:

- `none` (лише приватний вхідний доступ)
- `token` (типово, коли встановлено `OPENCLAW_GATEWAY_TOKEN`)
- `password` (спільний секрет через `OPENCLAW_GATEWAY_PASSWORD` або конфігурацію)
- `trusted-proxy` (реверс-проксі з урахуванням ідентичності; див. [Trusted Proxy Auth](/uk/gateway/trusted-proxy-auth))

Коли `tailscale.mode = "serve"` і `gateway.auth.allowTailscale` має значення `true`,
автентифікація Control UI/WebSocket може використовувати заголовки ідентичності Tailscale
(`tailscale-user-login`) без надання токена/пароля. OpenClaw перевіряє
ідентичність, визначаючи адресу `x-forwarded-for` через локальний демон Tailscale
(`tailscale whois`) і звіряючи її із заголовком перед прийняттям. OpenClaw
вважає запит Serve лише тоді, коли він надходить із loopback із
заголовками Tailscale `x-forwarded-for`, `x-forwarded-proto` і `x-forwarded-host`.
Кінцеві точки HTTP API (наприклад, `/v1/*`, `/tools/invoke` і `/api/channels/*`)
**не** використовують автентифікацію через заголовки ідентичності Tailscale. Вони, як і раніше, дотримуються
звичайного режиму HTTP-автентифікації gateway: типово це автентифікація зі спільним секретом або навмисно
налаштована схема `trusted-proxy` / приватного вхідного доступу `none`.
Цей потік без токена передбачає, що хост gateway є довіреним. Якщо на тому самому хості
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

Відкрийте: `https://<magicdns>/` (або ваш налаштований `gateway.controlUi.basePath`)

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

- Інтерфейс керування: `http://<tailscale-ip>:18789/`
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

Віддавайте перевагу `OPENCLAW_GATEWAY_PASSWORD`, а не збереженню пароля на диск.

## Приклади CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Примітки

- Tailscale Serve/Funnel вимагає, щоб CLI `tailscale` було встановлено та виконано вхід.
- `tailscale.mode: "funnel"` відмовляється запускатися, якщо режим автентифікації не `password`, щоб уникнути публічного доступу.
- Установіть `gateway.tailscale.resetOnExit`, якщо хочете, щоб OpenClaw скасовував конфігурацію `tailscale serve`
  або `tailscale funnel` під час завершення роботи.
- `gateway.bind: "tailnet"` — це пряма прив’язка Tailnet (без HTTPS, без Serve/Funnel).
- `gateway.bind: "auto"` надає перевагу loopback; використовуйте `tailnet`, якщо вам потрібен лише Tailnet.
- Serve/Funnel відкривають лише **інтерфейс керування Gateway + WS**. Nodes підключаються через
  ту саму кінцеву точку Gateway WS, тож Serve може працювати для доступу Node.

## Керування браузером (віддалений Gateway + локальний браузер)

Якщо ви запускаєте Gateway на одній машині, але хочете керувати браузером на іншій,
запустіть **хост node** на машині з браузером і тримайте обидві в одній tailnet.
Gateway проксуватиме дії браузера до node; окремий сервер керування або URL Serve не потрібні.

Уникайте Funnel для керування браузером; ставтеся до спарювання node так само, як до доступу оператора.

## Передумови та обмеження Tailscale

- Serve вимагає ввімкненого HTTPS для вашого tailnet; CLI запропонує це, якщо його бракує.
- Serve додає заголовки ідентичності Tailscale; Funnel — ні.
- Funnel вимагає Tailscale v1.38.3+, MagicDNS, увімкненого HTTPS і атрибута funnel node.
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
