---
read_when:
    - Надання доступу до інтерфейсу керування Gateway поза межами localhost
    - Автоматизація доступу до тейлнету або публічної панелі керування
summary: Інтегрований Tailscale Serve/Funnel для панелі керування Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-05-11T20:39:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: e3a90145b9884f31d43fabaddabe17e6ba017dabaec6e6e7d263dacefb33f1b6
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw може автоматично налаштовувати Tailscale **Serve** (tailnet) або **Funnel** (публічний доступ) для панелі Gateway і порту WebSocket. Це залишає Gateway прив’язаним до loopback, тоді як Tailscale забезпечує HTTPS, маршрутизацію і (для Serve) заголовки ідентичності.

## Режими

- `serve`: Serve лише для tailnet через `tailscale serve`. Gateway залишається на `127.0.0.1`.
- `funnel`: Публічний HTTPS через `tailscale funnel`. OpenClaw вимагає спільний пароль.
- `off`: Типово (без автоматизації Tailscale).

У статусі та виводі аудиту для цього режиму OpenClaw Serve/Funnel використовується **експозиція Tailscale**. `off` означає, що OpenClaw не керує Serve або Funnel; це не означає, що локальний демон Tailscale зупинений або вийшов з облікового запису.

## Автентифікація

Установіть `gateway.auth.mode`, щоб керувати рукостисканням:

- `none` (лише приватний вхідний трафік)
- `token` (типово, коли встановлено `OPENCLAW_GATEWAY_TOKEN`)
- `password` (спільний секрет через `OPENCLAW_GATEWAY_PASSWORD` або конфігурацію)
- `trusted-proxy` (зворотний проксі з урахуванням ідентичності; див. [Автентифікація довіреного проксі](/uk/gateway/trusted-proxy-auth))

Коли `tailscale.mode = "serve"` і `gateway.auth.allowTailscale` має значення `true`, автентифікація Control UI/WebSocket може використовувати заголовки ідентичності Tailscale (`tailscale-user-login`) без надання токена або пароля. OpenClaw перевіряє ідентичність, розв’язуючи адресу `x-forwarded-for` через локальний демон Tailscale (`tailscale whois`) і зіставляючи її із заголовком перед прийняттям. OpenClaw розглядає запит як Serve лише тоді, коли він надходить із loopback із заголовками Tailscale `x-forwarded-for`, `x-forwarded-proto` і `x-forwarded-host`.
Для операторських сеансів Control UI, які містять ідентичність пристрою браузера, цей перевірений шлях Serve також пропускає цикл сполучення пристрою. Він не обходить ідентичність пристрою браузера: клієнти без пристрою все одно відхиляються, а підключення WebSocket з роллю вузла або не з Control UI все одно проходять звичайні перевірки сполучення й автентифікації.
Кінцеві точки HTTP API (наприклад, `/v1/*`, `/tools/invoke` і `/api/channels/*`) **не** використовують автентифікацію за заголовками ідентичності Tailscale. Вони й надалі використовують звичайний режим HTTP-автентифікації Gateway: автентифікацію зі спільним секретом за замовчуванням або навмисно налаштовану схему trusted-proxy / приватного вхідного трафіку `none`.
Цей потік без токена припускає, що хост Gateway є довіреним. Якщо на тому самому хості може виконуватися недовірений локальний код, вимкніть `gateway.auth.allowTailscale` і натомість вимагайте автентифікацію токеном або паролем.
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

Відкрийте: `https://<magicdns>/` (або ваш налаштований `gateway.controlUi.basePath`)

### Лише tailnet (прив’язка до IP tailnet)

Використовуйте це, коли хочете, щоб Gateway слухав безпосередньо на IP tailnet (без Serve/Funnel).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Підключення з іншого пристрою tailnet:

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

Надавайте перевагу `OPENCLAW_GATEWAY_PASSWORD`, а не фіксуйте пароль на диску.

## Приклади CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Примітки

- Для Tailscale Serve/Funnel потрібно, щоб CLI `tailscale` був встановлений і виконаний вхід.
- `tailscale.mode: "funnel"` відмовляється запускатися, якщо режим автентифікації не `password`, щоб уникнути публічного розкриття.
- Установіть `gateway.tailscale.resetOnExit`, якщо хочете, щоб OpenClaw скасовував конфігурацію `tailscale serve` або `tailscale funnel` під час завершення роботи.
- Установіть `gateway.tailscale.preserveFunnel: true`, щоб зберігати зовнішньо налаштований маршрут `tailscale funnel` активним між перезапусками Gateway. Коли це ввімкнено і Gateway працює в `mode: "serve"`, OpenClaw перевіряє `tailscale funnel status` перед повторним застосуванням Serve і пропускає його, якщо маршрут Funnel уже покриває порт Gateway. Керована OpenClaw політика Funnel лише з паролем не змінюється.
- `gateway.bind: "tailnet"` — це пряма прив’язка до tailnet (без HTTPS, без Serve/Funnel).
- `gateway.bind: "auto"` надає перевагу loopback; використовуйте `tailnet`, якщо потрібен лише tailnet.
- Serve/Funnel відкривають лише **Control UI Gateway + WS**. Вузли підключаються через ту саму кінцеву точку Gateway WS, тому Serve може працювати для доступу вузлів.

## Керування браузером (віддалений Gateway + локальний браузер)

Якщо ви запускаєте Gateway на одній машині, але хочете керувати браузером на іншій машині, запустіть **хост вузла** на машині браузера й тримайте обидві в одному tailnet. Gateway проксіюватиме дії браузера до вузла; окремий сервер керування або URL Serve не потрібні.

Уникайте Funnel для керування браузером; розглядайте сполучення вузла як операторський доступ.

## Передумови та обмеження Tailscale

- Serve вимагає ввімкненого HTTPS для вашого tailnet; CLI покаже підказку, якщо його немає.
- Serve додає заголовки ідентичності Tailscale; Funnel цього не робить.
- Funnel вимагає Tailscale v1.38.3+, MagicDNS, увімкненого HTTPS і атрибута вузла funnel.
- Funnel підтримує лише порти `443`, `8443` і `10000` через TLS.
- Funnel на macOS вимагає варіант програми Tailscale з відкритим кодом.

## Докладніше

- Огляд Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Команда `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Огляд Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Команда `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Пов’язане

- [Віддалений доступ](/uk/gateway/remote)
- [Виявлення](/uk/gateway/discovery)
- [Автентифікація](/uk/gateway/authentication)
