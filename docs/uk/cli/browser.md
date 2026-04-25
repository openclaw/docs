---
read_when:
    - Ви використовуєте `openclaw browser` і хочете приклади для поширених завдань
    - Ви хочете керувати браузером, що працює на іншій машині, через хост Node
    - Ви хочете підключитися до свого локального Chrome, у якому виконано вхід, через Chrome MCP
summary: Довідник CLI для `openclaw browser` (життєвий цикл, профілі, вкладки, дії, стан і налагодження)
title: Браузер
x-i18n:
    generated_at: "2026-04-25T10:18:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: d97ba217f59832f57105d988c731a84e0259ffabad844b167f12a82ee315fff9
    source_path: cli/browser.md
    workflow: 15
---

# `openclaw browser`

Керуйте поверхнею керування браузером OpenClaw і виконуйте дії в браузері (життєвий цикл, профілі, вкладки, знімки, скриншоти, навігація, введення, емуляція стану та налагодження).

Пов’язане:

- Інструмент Browser + API: [Інструмент Browser](/uk/tools/browser)

## Поширені прапорці

- `--url <gatewayWsUrl>`: URL Gateway WebSocket (типово з конфігурації).
- `--token <token>`: токен Gateway (за потреби).
- `--timeout <ms>`: тайм-аут запиту (мс).
- `--expect-final`: чекати на фінальну відповідь Gateway.
- `--browser-profile <name>`: вибрати профіль браузера (типовий з конфігурації).
- `--json`: вивід у машиночитному форматі (де підтримується).

## Швидкий старт (локально)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Агенти можуть виконати таку саму перевірку готовності за допомогою `browser({ action: "doctor" })`.

## Швидке усунення несправностей

Якщо `start` завершується з помилкою `not reachable after start`, спочатку усуньте проблеми з готовністю CDP. Якщо `start` і `tabs` успішні, але `open` або `navigate` завершуються з помилкою, площина керування браузером працює справно, і збій зазвичай пов’язаний із політикою SSRF навігації.

Мінімальна послідовність:

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Докладні вказівки: [Усунення несправностей Browser](/uk/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## Життєвий цикл

```bash
openclaw browser status
openclaw browser doctor
openclaw browser start
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

Примітки:

- Для профілів `attachOnly` і віддалених CDP `openclaw browser stop` закриває
  активний сеанс керування та скидає тимчасові перевизначення емуляції, навіть
  коли OpenClaw не запускав процес браузера самостійно.
- Для локальних керованих профілів `openclaw browser stop` зупиняє породжений
  процес браузера.
- На хостах Linux без `DISPLAY` або `WAYLAND_DISPLAY` локальні керовані профілі
  автоматично працюють у безголовому режимі, якщо тільки
  `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless=false` або
  `browser.profiles.<name>.headless=false` явно не вимагає видимого браузера.

## Якщо команда відсутня

Якщо `openclaw browser` є невідомою командою, перевірте `plugins.allow` у
`~/.openclaw/openclaw.json`.

Коли `plugins.allow` присутній, вбудований плагін браузера має бути вказаний
явно:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true` не відновлює підкоманду CLI, коли список дозволених
плагінів виключає `browser`.

Пов’язане: [Інструмент Browser](/uk/tools/browser#missing-browser-command-or-tool)

## Профілі

Профілі — це іменовані конфігурації маршрутизації браузера. На практиці:

- `openclaw`: запускає або підключається до окремого екземпляра Chrome, яким керує OpenClaw (ізольований каталог даних користувача).
- `user`: керує вашим наявним сеансом Chrome, у якому виконано вхід, через Chrome DevTools MCP.
- користувацькі профілі CDP: вказують на локальну або віддалену кінцеву точку CDP.

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

Використання конкретного профілю:

```bash
openclaw browser --browser-profile work tabs
```

## Вкладки

```bash
openclaw browser tabs
openclaw browser tab new --label docs
openclaw browser tab label t1 docs
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://docs.openclaw.ai --label docs
openclaw browser focus docs
openclaw browser close t1
```

`tabs` спочатку повертає `suggestedTargetId`, потім стабільний `tabId`, наприклад `t1`,
необов’язкову мітку та необроблений `targetId`. Агенти мають передавати
`suggestedTargetId` назад у `focus`, `close`, знімки та дії. Ви можете
призначити мітку за допомогою `open --label`, `tab new --label` або `tab label`; мітки,
ідентифікатори вкладок, необроблені ідентифікатори цілей і унікальні префікси
ідентифікаторів цілей — усе це приймається.

## Знімок / скриншот / дії

Знімок:

```bash
openclaw browser snapshot
openclaw browser snapshot --urls
```

Скриншот:

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
openclaw browser screenshot --labels
```

Примітки:

- `--full-page` призначений лише для захоплення сторінки; його не можна поєднувати з `--ref`
  або `--element`.
- Профілі `existing-session` / `user` підтримують скриншоти сторінки та скриншоти `--ref`
  з виводу знімка, але не підтримують скриншоти CSS `--element`.
- `--labels` накладає поточні посилання зі знімка на скриншот.
- `snapshot --urls` додає виявлені адреси посилань до знімків AI, щоб
  агенти могли вибирати прямі цілі навігації замість того, щоб вгадувати лише за
  текстом посилання.

Навігація/клік/введення (автоматизація UI на основі ref):

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
openclaw browser click-coords 120 340
openclaw browser type <ref> "hello"
openclaw browser press Enter
openclaw browser hover <ref>
openclaw browser scrollintoview <ref>
openclaw browser drag <startRef> <endRef>
openclaw browser select <ref> OptionA OptionB
openclaw browser fill --fields '[{"ref":"1","value":"Ada"}]'
openclaw browser wait --text "Done"
openclaw browser evaluate --fn '(el) => el.textContent' --ref <ref>
```

Допоміжні команди для файлів і діалогів:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
```

Керовані профілі Chrome зберігають звичайні завантаження, ініційовані кліком, у каталог завантажень OpenClaw
(типово `/tmp/openclaw/downloads` або налаштований корінь тимчасових файлів).
Використовуйте `waitfordownload` або `download`, коли агенту потрібно дочекатися
конкретного файла й повернути його шлях; ці явні очікування беруть на себе
наступне завантаження.

## Стан і сховище

Область перегляду + емуляція:

```bash
openclaw browser resize 1280 720
openclaw browser set viewport 1280 720
openclaw browser set offline on
openclaw browser set media dark
openclaw browser set timezone Europe/London
openclaw browser set locale en-GB
openclaw browser set geo 51.5074 -0.1278 --accuracy 25
openclaw browser set device "iPhone 14"
openclaw browser set headers '{"x-test":"1"}'
openclaw browser set credentials myuser mypass
```

Файли cookie + сховище:

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url https://example.com
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set token abc123
openclaw browser storage session clear
```

## Налагодження

```bash
openclaw browser console --level error
openclaw browser pdf
openclaw browser responsebody "**/api"
openclaw browser highlight <ref>
openclaw browser errors --clear
openclaw browser requests --filter api
openclaw browser trace start
openclaw browser trace stop --out trace.zip
```

## Наявний Chrome через MCP

Використовуйте вбудований профіль `user` або створіть власний профіль `existing-session`:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser --browser-profile chrome-live tabs
```

Цей шлях призначений лише для хоста. Для Docker, безголових серверів, Browserless або інших віддалених середовищ використовуйте натомість профіль CDP.

Поточні обмеження existing-session:

- дії на основі знімка використовують ref, а не селектори CSS
- `browser.actionTimeoutMs` для підтримуваних запитів `act` за замовчуванням становить 60000 мс, коли
  виклики не передають `timeoutMs`; `timeoutMs` для окремого виклику все одно має пріоритет.
- `click` підтримує лише клацання лівою кнопкою
- `type` не підтримує `slowly=true`
- `press` не підтримує `delayMs`
- `hover`, `scrollintoview`, `drag`, `select`, `fill` і `evaluate` відхиляють
  перевизначення тайм-ауту для окремого виклику
- `select` підтримує лише одне значення
- `wait --load networkidle` не підтримується
- вивантаження файлів потребує `--ref` / `--input-ref`, не підтримує CSS
  `--element` і наразі підтримує по одному файлу за раз
- хуки діалогів не підтримують `--timeout`
- скриншоти підтримують захоплення сторінки та `--ref`, але не CSS `--element`
- `responsebody`, перехоплення завантажень, експорт PDF і пакетні дії, як і раніше,
  потребують керованого браузера або сирого профілю CDP

## Віддалене керування браузером (проксі хоста node)

Якщо Gateway працює на іншій машині, ніж браузер, запустіть **node host** на машині, де є Chrome/Brave/Edge/Chromium. Gateway проксіюватиме дії браузера до цього вузла (окремий сервер керування браузером не потрібен).

Використовуйте `gateway.nodes.browser.mode` для керування автоматичною маршрутизацією і `gateway.nodes.browser.node` для прив’язки до конкретного вузла, якщо підключено кілька вузлів.

Безпека й віддалене налаштування: [Інструмент Browser](/uk/tools/browser), [Віддалений доступ](/uk/gateway/remote), [Tailscale](/uk/gateway/tailscale), [Безпека](/uk/gateway/security)

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Browser](/uk/tools/browser)
