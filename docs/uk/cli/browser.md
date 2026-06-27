---
read_when:
    - Ви використовуєте `openclaw browser` і хочете приклади для типових завдань
    - Ви хочете керувати браузером, що працює на іншій машині, через хост Node
    - Ви хочете підʼєднатися до локального Chrome, у якому виконано вхід, через Chrome MCP
summary: Довідник CLI для `openclaw browser` (життєвий цикл, профілі, вкладки, дії, стан і налагодження)
title: Браузер
x-i18n:
    generated_at: "2026-06-27T17:19:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9e45a6b89f23623c25b61d41273151b60da1fc415b5d3c901d8c555d8244f7a
    source_path: cli/browser.md
    workflow: 16
---

# `openclaw browser`

Керуйте поверхнею керування браузером OpenClaw і виконуйте браузерні дії (життєвий цикл, профілі, вкладки, знімки стану, скриншоти, навігація, введення, емуляція стану та налагодження).

Пов’язано:

- Інструмент браузера + API: [Інструмент браузера](/uk/tools/browser)

## Поширені прапорці

- `--url <gatewayWsUrl>`: URL WebSocket Gateway (типово з конфігурації).
- `--token <token>`: токен Gateway (якщо потрібен).
- `--timeout <ms>`: тайм-аут запиту (мс).
- `--expect-final`: чекати фінальної відповіді Gateway.
- `--browser-profile <name>`: вибрати профіль браузера (типово з конфігурації).
- `--json`: машинозчитуваний вивід (де підтримується).

## Швидкий старт (локально)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Агенти можуть виконати таку саму перевірку готовності за допомогою `browser({ action: "doctor" })`.

## Швидке усунення несправностей

Якщо `start` завершується помилкою `not reachable after start`, спершу усувайте несправність готовності CDP. Якщо `start` і `tabs` успішні, але `open` або `navigate` завершується помилкою, площина керування браузером справна, а збій зазвичай спричинений політикою SSRF для навігації.

Мінімальна послідовність:

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Докладні настанови: [Усунення несправностей браузера](/uk/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## Життєвий цикл

```bash
openclaw browser status
openclaw browser doctor
openclaw browser doctor --deep
openclaw browser start
openclaw browser start --headless
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

Примітки:

- `doctor --deep` додає живу перевірку знімка стану. Це корисно, коли базова
  готовність CDP зелена, але вам потрібен доказ, що поточну вкладку можна інспектувати.
- Для профілів `attachOnly` і віддалених профілів CDP `openclaw browser stop` закриває
  активний сеанс керування й очищає тимчасові перевизначення емуляції, навіть якщо
  OpenClaw не запускав процес браузера самостійно.
- Для локальних керованих профілів `openclaw browser stop` зупиняє породжений процес
  браузера.
- `openclaw browser start --headless` застосовується лише до цього запиту запуску і
  тільки коли OpenClaw запускає локальний керований браузер. Він не переписує
  `browser.headless` або конфігурацію профілю і є no-op для браузера, який уже працює.
- На хостах Linux без `DISPLAY` або `WAYLAND_DISPLAY` локальні керовані профілі
  автоматично запускаються безголово, якщо `OPENCLAW_BROWSER_HEADLESS=0`,
  `browser.headless=false` або `browser.profiles.<name>.headless=false`
  явно не запитує видимий браузер.

## Якщо команда відсутня

Якщо `openclaw browser` є невідомою командою, перевірте `plugins.allow` у
`~/.openclaw/openclaw.json`.

Коли `plugins.allow` присутній, явно додайте вбудований Plugin браузера до списку,
якщо конфігурація ще не має кореневого блока `browser`:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Явний кореневий блок `browser`, наприклад `browser.enabled=true` або
`browser.profiles.<name>`, також активує вбудований Plugin браузера за
обмежувального списку дозволених Plugin.

Пов’язано: [Інструмент браузера](/uk/tools/browser#missing-browser-command-or-tool)

## Профілі

Профілі — це іменовані конфігурації маршрутизації браузера. На практиці:

- `openclaw`: запускає спеціальний керований OpenClaw екземпляр Chrome або під’єднується до нього (ізольований каталог даних користувача).
- `user`: керує вашим наявним сеансом Chrome із виконаним входом через Chrome DevTools MCP.
- користувацькі профілі CDP: вказують на локальну або віддалену кінцеву точку CDP.

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

Використати конкретний профіль:

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

`tabs` спершу повертає `suggestedTargetId`, потім стабільний `tabId`, як-от `t1`,
необов’язкову мітку та сирий `targetId`. Агенти мають передавати
`suggestedTargetId` назад у `focus`, `close`, знімки стану та дії. Ви можете
призначити мітку за допомогою `open --label`, `tab new --label` або `tab label`;
мітки, ідентифікатори вкладок, сирі ідентифікатори цілей і унікальні префікси
target-id усі приймаються.
Поле запиту все ще називається `targetId` для сумісності, але воно приймає
ці посилання на вкладки. Розглядайте сирі ідентифікатори цілей як діагностичні
дескриптори, а не як довговічну пам’ять агента.
Коли Chromium замінює базову сиру ціль під час навігації або надсилання форми,
OpenClaw зберігає стабільний `tabId`/мітку прив’язаними до вкладки-заміни,
коли може довести збіг. Сирі ідентифікатори цілей залишаються мінливими; віддавайте
перевагу `suggestedTargetId`.

## Знімок стану / скриншот / дії

Знімок стану:

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

- `--full-page` призначений лише для захоплень сторінки; його не можна поєднувати з `--ref`
  або `--element`.
- Профілі `existing-session` / `user` підтримують скриншоти сторінки та скриншоти
  `--ref` з виводу знімка стану, але не скриншоти CSS `--element`.
- `--labels` накладає поточні посилання знімка стану на скриншот. На
  профілях із Playwright він працює з `--full-page` (накладання міток на всю
  сторінку), `--ref` (накладання міток вирізки елемента за посиланням ARIA) і `--element`
  (накладання міток вирізки елемента за селектором CSS); у режимах вирізки елемента мітки
  проєктуються відносно елемента. Відповідь також містить масив
  `annotations` із рамкою кожного посилання. Кожен елемент має `ref`,
  `number`, `role`, необов’язкове `name` і `box: {x, y, width, height}`;
  координати вказані у просторі захопленого зображення (viewport / fullpage /
  відносно елемента). Поле пропускається, коли воно порожнє.
  Профілі `existing-session` рендерять накладання chrome-mcp на скриншотах сторінки,
  але не використовують помічник проєкції Playwright і не включають
  `annotations`; скриншоти CSS `--element` там не підтримуються. Без
  Playwright або chrome-mcp скриншоти з мітками недоступні. Попередні
  випуски ігнорували `--full-page`, `--ref` і `--element` на скриншотах
  Playwright із мітками та завжди повертали захоплення viewport; тепер скриншоти
  з мітками поважають ці області.
- `snapshot --urls` додає знайдені призначення посилань до знімків стану AI, щоб
  агенти могли вибирати прямі цілі навігації, а не здогадуватися лише за текстом
  посилання.

Навігація/клік/введення (UI-автоматизація на основі посилань):

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
openclaw browser evaluate --fn 'const title = document.title; return title;'
openclaw browser evaluate --timeout-ms 30000 --fn 'async () => { await window.ready; return true; }'
```

`evaluate --fn` приймає вихідний код функції, вираз або тіло інструкцій.
Тіла інструкцій обгортаються як async-функції, тому використовуйте `return` для значення,
яке хочете отримати назад. Використовуйте `evaluate --timeout-ms <ms>`, коли функції
на стороні сторінки може знадобитися більше часу, ніж типовий тайм-аут evaluate.

Відповіді дій повертають поточний сирий `targetId` після заміни сторінки,
спричиненої дією, коли OpenClaw може довести вкладку-заміщення. Скрипти все одно мають
зберігати й передавати `suggestedTargetId`/мітки для довготривалих робочих процесів.

Помічники для файлів і діалогів:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser upload media://inbound/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
```

Керовані профілі Chrome зберігають звичайні завантаження, спричинені кліком, у каталог
завантажень OpenClaw (`/tmp/openclaw/downloads` типово або налаштований тимчасовий
корінь). Використовуйте `waitfordownload` або `download`, коли агенту потрібно чекати
на конкретний файл і повернути його шлях; ці явні очікувачі володіють наступним завантаженням.
Завантаження файлів приймають файли з тимчасового кореня uploads OpenClaw і керовані OpenClaw
вхідні медіа, включно з посиланнями `media://inbound/<id>` і відносними до пісочниці
`media/inbound/<id>`. Вкладені media refs, обхід каталогів і довільні
локальні шляхи залишаються відхиленими.
Коли дія відкриває модальний діалог, відповідь дії повертає
`blockedByDialog` з `browserState.dialogs.pending`; передайте `--dialog-id`, щоб
відповісти на нього напряму. Діалоги, оброблені поза OpenClaw, з’являються під
`browserState.dialogs.recent`.

## Стан і сховище

Viewport + емуляція:

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

Cookies + сховище:

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
openclaw browser create-profile --name chrome-port --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser --browser-profile chrome-live tabs
```

Типовий шлях existing-session — це автоматичне під’єднання Chrome MCP лише на хості. Якщо браузер уже
працює з кінцевою точкою DevTools, передайте `--cdp-url`, щоб Chrome MCP натомість під’єднався до цієї кінцевої точки.
Для Docker, Browserless або інших віддалених налаштувань, де семантика Chrome MCP не потрібна, використовуйте
профіль CDP.

Поточні обмеження existing-session:

- дії на основі знімків використовують посилання, а не CSS-селектори
- `browser.actionTimeoutMs` задає типове значення 60000 мс для підтримуваних запитів `act`, коли
  виклики не передають `timeoutMs`; `timeoutMs` для окремого виклику все одно має пріоритет.
- `click` підтримує лише клацання лівою кнопкою
- `type` не підтримує `slowly=true`
- `press` не підтримує `delayMs`
- `hover`, `scrollintoview`, `drag`, `select`, `fill` і `evaluate` відхиляють
  перевизначення таймауту для окремого виклику
- `select` підтримує лише одне значення
- `wait --load networkidle` не підтримується для профілів наявних сеансів (працює з керованими та raw/віддаленими CDP)
- завантаження файлів потребує `--ref` / `--input-ref`, не підтримує CSS
  `--element` і наразі підтримує лише один файл за раз
- хуки діалогів не підтримують `--timeout`
- знімки екрана підтримують захоплення сторінки та `--ref`, але не CSS `--element`
- `responsebody`, перехоплення завантажень, експорт PDF і пакетні дії все ще
  потребують керованого браузера або raw CDP-профілю

## Віддалене керування браузером (проксі вузла-хоста)

Якщо Gateway працює на іншій машині, ніж браузер, запустіть **вузол-хост** на машині, де є Chrome/Brave/Edge/Chromium. Gateway проксуватиме дії браузера до цього вузла (окремий сервер керування браузером не потрібен).

Використовуйте `gateway.nodes.browser.mode`, щоб керувати автоматичною маршрутизацією, і `gateway.nodes.browser.node`, щоб закріпити конкретний вузол, якщо підключено кілька.

Безпека + віддалене налаштування: [Інструмент браузера](/uk/tools/browser), [Віддалений доступ](/uk/gateway/remote), [Tailscale](/uk/gateway/tailscale), [Безпека](/uk/gateway/security)

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Браузер](/uk/tools/browser)
