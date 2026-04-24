---
read_when:
    - Виведення Control UI Gateway за межі localhost
    - Автоматизація доступу до панелі керування через tailnet або публічно
summary: Інтегрований Tailscale Serve/Funnel для панелі керування Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-04-24T18:11:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6042ddaf7194b34f003b1cdf5226f4693da22663d4007c65c79580e7f8ea2835
    source_path: gateway/tailscale.md
    workflow: 15
---

OpenClaw може автоматично налаштовувати Tailscale **Serve** (tailnet) або **Funnel** (публічно) для
панелі керування Gateway і порту WebSocket. Це дає змогу залишати Gateway прив’язаним до loopback, тоді як
Tailscale забезпечує HTTPS, маршрутизацію та (для Serve) заголовки ідентичності.

## Режими

- `serve`: Serve лише для tailnet через `tailscale serve`. Gateway залишається на `127.0.0.1`.
- `funnel`: Публічний HTTPS через `tailscale funnel`. OpenClaw вимагає спільний пароль.
- `off`: Типово (без автоматизації Tailscale).

## Автентифікація

Установіть `gateway.auth.mode`, щоб керувати handshake:

- `none` (лише приватний ingress)
- `token` (типово, коли встановлено `OPENCLAW_GATEWAY_TOKEN`)
- `password` (спільний секрет через `OPENCLAW_GATEWAY_PASSWORD` або конфігурацію)
- `trusted-proxy` (reverse proxy з урахуванням ідентичності; див. [Автентифікація Trusted Proxy](/uk/gateway/trusted-proxy-auth))

Коли `tailscale.mode = "serve"` і `gateway.auth.allowTailscale` має значення `true`,
автентифікація Control UI/WebSocket може використовувати заголовки ідентичності Tailscale
(`tailscale-user-login`) без передавання token/password. OpenClaw перевіряє
ідентичність, визначаючи адресу `x-forwarded-for` через локальний демон Tailscale
(`tailscale whois`) і зіставляючи її із заголовком перед прийняттям.
OpenClaw вважає запит Serve лише тоді, коли він надходить із loopback із
заголовками Tailscale `x-forwarded-for`, `x-forwarded-proto` і `x-forwarded-host`.
Endpoint HTTP API (наприклад, `/v1/*`, `/tools/invoke` і `/api/channels/*`)
**не** використовують автентифікацію за заголовками ідентичності Tailscale. Вони й далі дотримуються
звичайного режиму HTTP-автентифікації Gateway: типово автентифікація спільним секретом або
навмисно налаштований trusted-proxy / приватний ingress `none`.
Цей безтокеновий сценарій припускає, що хост Gateway є довіреним. Якщо на тому самому хості
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

### Лише tailnet (прив’язка до IP Tailnet)

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

Віддавайте перевагу `OPENCLAW_GATEWAY_PASSWORD` замість збереження пароля на диску.

## Приклади CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Примітки

- Tailscale Serve/Funnel вимагає, щоб CLI `tailscale` було встановлено та виконано вхід.
- `tailscale.mode: "funnel"` відмовляється запускатися, якщо режим автентифікації не `password`, щоб уникнути публічного відкриття доступу.
- Установіть `gateway.tailscale.resetOnExit`, якщо хочете, щоб OpenClaw скасовував конфігурацію `tailscale serve`
  або `tailscale funnel` під час завершення роботи.
- `gateway.bind: "tailnet"` — це пряма прив’язка до Tailnet (без HTTPS, без Serve/Funnel).
- `gateway.bind: "auto"` віддає перевагу loopback; використовуйте `tailnet`, якщо хочете лише Tailnet.
- Serve/Funnel відкривають лише **Control UI + WS Gateway**. Node підключаються через
  той самий endpoint Gateway WS, тож Serve може працювати і для доступу Node.

## Керування браузером (віддалений Gateway + локальний браузер)

Якщо ви запускаєте Gateway на одній машині, але хочете керувати браузером на іншій машині,
запустіть **хост Node** на машині з браузером і тримайте обидві машини в одному tailnet.
Gateway проксіюватиме дії браузера до Node; окремий сервер керування або URL Serve не потрібні.

Уникайте Funnel для керування браузером; ставтеся до сполучення Node так само, як до доступу оператора.

## Передумови та обмеження Tailscale

- Serve вимагає ввімкненого HTTPS для вашого tailnet; CLI запропонує це, якщо воно відсутнє.
- Serve додає заголовки ідентичності Tailscale; Funnel — ні.
- Funnel вимагає Tailscale v1.38.3+, MagicDNS, увімкненого HTTPS та атрибута вузла funnel.
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
