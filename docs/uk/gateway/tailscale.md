---
read_when:
    - Надання доступу до Control UI Gateway поза localhost
    - Автоматизація доступу до tailnet або публічної панелі керування
summary: Інтегрований Tailscale Serve/Funnel для панелі Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-06-27T17:37:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 35944eba19cd82d373b25c602b66d1b76f35ad63aa90767bb1c7ef75549fe905
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw може автоматично налаштовувати Tailscale **Serve** (tailnet) або **Funnel** (публічний) для
панелі Gateway і порту WebSocket. Завдяки цьому Gateway залишається прив’язаним до loopback, тоді як
Tailscale забезпечує HTTPS, маршрутизацію та (для Serve) заголовки ідентичності.

## Режими

- `serve`: Serve лише для tailnet через `tailscale serve`. Gateway залишається на `127.0.0.1`.
- `funnel`: Публічний HTTPS через `tailscale funnel`. OpenClaw вимагає спільний пароль.
- `off`: Типово (без автоматизації Tailscale).

Вивід стану та аудиту використовує **експозицію Tailscale** для цього режиму OpenClaw Serve/Funnel.
`off` означає, що OpenClaw не керує Serve або Funnel; це не означає, що
локальний демон Tailscale зупинено або що з нього виконано вихід.

## Автентифікація

Задайте `gateway.auth.mode`, щоб керувати рукостисканням:

- `none` (лише приватний вхідний доступ)
- `token` (типово, коли задано `OPENCLAW_GATEWAY_TOKEN`)
- `password` (спільний секрет через `OPENCLAW_GATEWAY_PASSWORD` або конфігурацію)
- `trusted-proxy` (реверсивний проксі з урахуванням ідентичності; див. [Автентифікація через довірений проксі](/uk/gateway/trusted-proxy-auth))

Коли `tailscale.mode = "serve"` і `gateway.auth.allowTailscale` дорівнює `true`,
автентифікація Control UI/WebSocket може використовувати заголовки ідентичності Tailscale
(`tailscale-user-login`) без надання токена/пароля. OpenClaw перевіряє
ідентичність, визначаючи адресу `x-forwarded-for` через локальний демон Tailscale
(`tailscale whois`) і зіставляючи її із заголовком перед прийняттям.
OpenClaw розглядає запит як Serve лише тоді, коли він надходить із loopback із
заголовками Tailscale `x-forwarded-for`, `x-forwarded-proto` і `x-forwarded-host`.
Для операторських сесій Control UI, які містять ідентичність пристрою браузера, цей
перевірений шлях Serve також пропускає цикл сполучення пристрою. Він не обходить
ідентичність пристрою браузера: клієнти без пристрою все одно відхиляються, а підключення
з роллю вузла або підключення WebSocket не з Control UI й далі проходять звичайні перевірки
сполучення та автентифікації.
Кінцеві точки HTTP API (наприклад `/v1/*`, `/tools/invoke` і `/api/channels/*`)
**не** використовують автентифікацію через заголовки ідентичності Tailscale. Вони й далі дотримуються
звичайного режиму HTTP-автентифікації Gateway: автентифікації спільним секретом за замовчуванням або навмисно
налаштованого trusted-proxy / private-ingress режиму `none`.
Цей безтокеновий потік припускає, що хост Gateway є довіреним. Якщо на тому самому хості
може виконуватися недовірений локальний код, вимкніть `gateway.auth.allowTailscale` і натомість вимагайте
автентифікацію токеном/паролем.
Щоб вимагати явні облікові дані зі спільним секретом, задайте `gateway.auth.allowTailscale: false`
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

Щоб відкрити Control UI через іменовану службу Tailscale замість
імені хоста пристрою, задайте `gateway.tailscale.serviceName` як назву служби:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve", serviceName: "svc:openclaw" },
  },
}
```

У наведеному вище прикладі під час запуску URL служби буде показано як
`https://openclaw.<tailnet-name>.ts.net/` замість імені хоста пристрою.
Служби Tailscale вимагають, щоб хост був затвердженим тегованим вузлом у вашому
tailnet. Налаштуйте тег і затвердьте службу в Tailscale перед увімкненням
цієї опції, інакше `tailscale serve --service=...` завершиться помилкою під час запуску Gateway.

### Лише tailnet (прив’язка до IP tailnet)

Використовуйте це, коли хочете, щоб Gateway слухав безпосередньо IP tailnet (без Serve/Funnel).

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

Надавайте перевагу `OPENCLAW_GATEWAY_PASSWORD`, а не фіксації пароля на диску.

## Приклади CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Примітки

- Tailscale Serve/Funnel вимагає, щоб CLI `tailscale` було встановлено і в ньому було виконано вхід.
- `tailscale.mode: "funnel"` відмовляється запускатися, якщо режим автентифікації не `password`, щоб уникнути публічного відкриття доступу.
- `gateway.tailscale.serviceName` застосовується лише до режиму Serve і передається до
  `tailscale serve --service=<name>`. Значення має використовувати формат назви служби Tailscale
  `svc:<dns-label>`, наприклад `svc:openclaw`.
  Tailscale вимагає, щоб хости служб були тегованими вузлами, а служба може потребувати
  затвердження в адмінконсолі, перш ніж Serve зможе її опублікувати.
- Задайте `gateway.tailscale.resetOnExit`, якщо хочете, щоб OpenClaw скасовував конфігурацію `tailscale serve`
  або `tailscale funnel` під час завершення роботи.
- Задайте `gateway.tailscale.preserveFunnel: true`, щоб зберігати зовнішньо налаштований
  маршрут `tailscale funnel` активним між перезапусками Gateway. Коли це ввімкнено і
  Gateway працює в `mode: "serve"`, OpenClaw перевіряє `tailscale funnel status`
  перед повторним застосуванням Serve і пропускає його, коли маршрут Funnel уже покриває
  порт Gateway. Політика Funnel, керована OpenClaw, лише з паролем не змінюється.
- `gateway.bind: "tailnet"` — це пряма прив’язка до tailnet (без HTTPS, без Serve/Funnel).
- `gateway.bind: "auto"` надає перевагу loopback; використовуйте `tailnet`, якщо хочете лише tailnet.
- Serve/Funnel відкривають лише **керівний інтерфейс Gateway + WS**. Вузли підключаються через
  ту саму кінцеву точку Gateway WS, тому Serve може працювати для доступу вузлів.

## Керування браузером (віддалений Gateway + локальний браузер)

Якщо ви запускаєте Gateway на одній машині, але хочете керувати браузером на іншій машині,
запустіть **хост вузла** на машині з браузером і тримайте обидві в одному tailnet.
Gateway проксіюватиме дії браузера до вузла; окремий сервер керування або URL Serve не потрібні.

Уникайте Funnel для керування браузером; розглядайте сполучення вузла як операторський доступ.

## Передумови та обмеження Tailscale

- Serve вимагає ввімкненого HTTPS для вашого tailnet; CLI підкаже, якщо його немає.
- Serve вставляє заголовки ідентичності Tailscale; Funnel цього не робить.
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
