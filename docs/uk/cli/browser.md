---
read_when:
    - Ви використовуєте `openclaw browser` і хочете приклади для поширених завдань
    - Ви хочете керувати браузером, що працює на іншій машині, через хост Node
    - Ви хочете підключитися до вашого локального Chrome із виконаним входом через Chrome MCP
summary: Довідник CLI для `openclaw browser` (життєвий цикл, профілі, вкладки, дії, стан і налагодження)
title: Браузер
x-i18n:
    generated_at: "2026-04-26T00:29:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 327fea6dc23c58c94dcf67b4ce53a6afbf204fbf64523c3d0bcb7c727594e659
    source_path: cli/browser.md
    workflow: 15
---

# `openclaw browser`

Керуйте поверхнею керування браузером OpenClaw і запускайте дії браузера (життєвий цикл, профілі, вкладки, знімки, знімки екрана, навігація, введення, емуляція стану та налагодження).

Пов’язане:

- Інструмент Browser + API: [інструмент Browser](/uk/tools/browser)

## Поширені прапорці

- `--url <gatewayWsUrl>`: URL WebSocket Gateway (типово з конфігурації).
- `--token <token>`: токен Gateway (якщо потрібен).
- `--timeout <ms>`: тайм-аут запиту (мс).
- `--expect-final`: чекати фінальної відповіді Gateway.
- `--browser-profile <name>`: вибрати профіль браузера (типовий із конфігурації).
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

Якщо `start` завершується помилкою `not reachable after start`, спочатку усуньте проблеми з готовністю CDP. Якщо `start` і `tabs` успішні, але `open` або `navigate` не працює, площина керування браузером справна, а причиною збою зазвичай є політика SSRF навігації.

Мінімальна послідовність:

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Детальні вказівки: [усунення несправностей Browser](/uk/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## Життєвий цикл

```bash
openclaw browser status
openclaw browser doctor
openclaw browser start
openclaw browser start --headless
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

Примітки:

- Для профілів `attachOnly` і віддаленого CDP `openclaw browser stop` закриває активний сеанс керування та очищає тимчасові перевизначення емуляції, навіть якщо OpenClaw не запускав сам процес браузера.
- Для локальних керованих профілів `openclaw browser stop` зупиняє породжений процес браузера.
- `openclaw browser start --headless` застосовується лише до цього запиту запуску і лише коли OpenClaw запускає локальний керований браузер. Він не переписує `browser.headless` або конфігурацію профілю та нічого не робить для браузера, який уже запущено.
- На хостах Linux без `DISPLAY` або `WAYLAND_DISPLAY` локальні керовані профілі автоматично запускаються в headless-режимі, якщо лише `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless=false` або `browser.profiles.<name>.headless=false` явно не вимагає видимий браузер.

## Якщо команди немає

Якщо `openclaw browser` є невідомою командою, перевірте `plugins.allow` у `~/.openclaw/openclaw.json`.

Коли `plugins.allow` присутній, вбудований Plugin browser має бути явно вказаний у списку:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true` не відновлює підкоманду CLI, коли список дозволених Plugin не містить `browser`.

Пов’язане: [інструмент Browser](/uk/tools/browser#missing-browser-command-or-tool)

## Профілі

Профілі — це іменовані конфігурації маршрутизації браузера. На практиці:

- `openclaw`: запускає або підключається до окремого керованого OpenClaw екземпляра Chrome (ізольований каталог даних користувача).
- `user`: керує вашим наявним сеансом Chrome із виконаним входом через Chrome DevTools MCP.
- власні профілі CDP: вказують на локальну або віддалену кінцеву точку CDP.

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

`tabs` спочатку повертає `suggestedTargetId`, потім стабільний `tabId`, наприклад `t1`, необов’язкову мітку та сирий `targetId`. Агенти мають передавати `suggestedTargetId` назад у `focus`, `close`, знімки та дії. Ви можете призначити мітку за допомогою `open --label`, `tab new --label` або `tab label`; підтримуються мітки, ідентифікатори вкладок, сирі ідентифікатори цілей і унікальні префікси target-id.
Коли Chromium замінює базову сиру ціль під час навігації або надсилання форми, OpenClaw зберігає стабільний `tabId`/мітку прив’язаними до вкладки-заміни, коли може довести відповідність. Сирі ідентифікатори цілей залишаються нестабільними; надавайте перевагу `suggestedTargetId`.

## Знімок / знімок екрана / дії

Знімок:

```bash
openclaw browser snapshot
openclaw browser snapshot --urls
```

Знімок екрана:

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
openclaw browser screenshot --labels
```

Примітки:

- `--full-page` призначений лише для захоплення сторінки; його не можна поєднувати з `--ref` або `--element`.
- Профілі `existing-session` / `user` підтримують знімки екрана сторінки та знімки екрана `--ref` із виводу snapshot, але не знімки екрана CSS `--element`.
- `--labels` накладає поточні посилання snapshot на знімок екрана.
- `snapshot --urls` додає виявлені призначення посилань до AI-знімків, щоб агенти могли вибирати прямі цілі навігації, а не вгадувати лише за текстом посилання.

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

Відповіді дій повертають поточний сирий `targetId` після заміни сторінки, спричиненої дією, коли OpenClaw може довести вкладку-заміну. Сценарії все одно мають зберігати й передавати `suggestedTargetId`/мітки для довготривалих робочих процесів.

Допоміжні засоби для файлів і діалогів:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
```

Керовані профілі Chrome зберігають звичайні завантаження, ініційовані кліком, у каталозі завантажень OpenClaw (`/tmp/openclaw/downloads` типово або налаштований тимчасовий корінь). Використовуйте `waitfordownload` або `download`, коли агенту потрібно дочекатися конкретного файлу й повернути його шлях; ці явні очікувачі прив’язують наступне завантаження до себе.

## Стан і сховище

Вікно перегляду + емуляція:

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

Цей шлях працює лише на хості. Для Docker, headless-серверів, Browserless або інших віддалених налаштувань натомість використовуйте профіль CDP.

Поточні обмеження existing-session:

- дії, керовані snapshot, використовують ref, а не CSS-селектори
- `browser.actionTimeoutMs` для підтримуваних запитів `act` за замовчуванням становить 60000 мс, коли виклики не передають `timeoutMs`; `timeoutMs` для окремого виклику все одно має пріоритет.
- `click` підтримує лише лівий клік
- `type` не підтримує `slowly=true`
- `press` не підтримує `delayMs`
- `hover`, `scrollintoview`, `drag`, `select`, `fill` і `evaluate` відхиляють перевизначення тайм-ауту для окремого виклику
- `select` підтримує лише одне значення
- `wait --load networkidle` не підтримується
- вивантаження файлів вимагає `--ref` / `--input-ref`, не підтримує CSS `--element` і наразі підтримує по одному файлу за раз
- перехоплення діалогів не підтримує `--timeout`
- знімки екрана підтримують захоплення сторінки й `--ref`, але не CSS `--element`
- `responsebody`, перехоплення завантажень, експорт PDF і пакетні дії, як і раніше, вимагають керований браузер або сирий профіль CDP

## Віддалене керування браузером (проксі хоста Node)

Якщо Gateway працює на іншій машині, ніж браузер, запустіть **хост Node** на машині, де є Chrome/Brave/Edge/Chromium. Gateway проксіюватиме дії браузера до цього вузла (окремий сервер керування браузером не потрібен).

Використовуйте `gateway.nodes.browser.mode`, щоб керувати автоматичною маршрутизацією, і `gateway.nodes.browser.node`, щоб закріпити конкретний Node, якщо підключено кілька.

Безпека + віддалене налаштування: [інструмент Browser](/uk/tools/browser), [віддалений доступ](/uk/gateway/remote), [Tailscale](/uk/gateway/tailscale), [безпека](/uk/gateway/security)

## Пов’язане

- [довідник CLI](/uk/cli)
- [Browser](/uk/tools/browser)
