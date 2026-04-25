---
read_when:
    - Ви використовуєте `openclaw browser` і хочете приклади для поширених завдань
    - Ви хочете керувати браузером, що працює на іншій машині, через хост вузла
    - Ви хочете під’єднатися до свого локального Chrome, у якому вже виконано вхід, через Chrome MCP
summary: Довідник CLI для `openclaw browser` (життєвий цикл, профілі, вкладки, дії, стан і налагодження)
title: Браузер
x-i18n:
    generated_at: "2026-04-25T00:01:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe7dcbc830044db4814fa1671807baae82ddcb32bd5228b165bfdbcddd5128de
    source_path: cli/browser.md
    workflow: 15
---

# `openclaw browser`

Керуйте поверхнею керування браузером OpenClaw і виконуйте дії в браузері (життєвий цикл, профілі, вкладки, знімки, скриншоти, навігація, введення, емуляція стану та налагодження).

Пов’язане:

- Інструмент Browser + API: [інструмент Browser](/uk/tools/browser)

## Поширені прапорці

- `--url <gatewayWsUrl>`: URL WebSocket Gateway (типово з конфігурації).
- `--token <token>`: токен Gateway (за потреби).
- `--timeout <ms>`: тайм-аут запиту (мс).
- `--expect-final`: чекати фінальну відповідь Gateway.
- `--browser-profile <name>`: вибрати профіль браузера (типовий береться з конфігурації).
- `--json`: машинозчитуваний вивід (де підтримується).

## Швидкий старт (локально)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

## Швидке усунення несправностей

Якщо `start` завершується помилкою `not reachable after start`, спочатку перевірте готовність CDP. Якщо `start` і `tabs` працюють, але `open` або `navigate` не працює, площина керування браузером справна, а збій зазвичай пов’язаний із політикою SSRF навігації.

Мінімальна послідовність:

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Докладні вказівки: [усунення несправностей Browser](/uk/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## Життєвий цикл

```bash
openclaw browser status
openclaw browser doctor
openclaw browser start
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

Примітки:

- Для профілів `attachOnly` і віддалених CDP `openclaw browser stop` закриває активний сеанс керування та скидає тимчасові перевизначення емуляції, навіть якщо OpenClaw сам не запускав процес браузера.
- Для локальних керованих профілів `openclaw browser stop` зупиняє породжений процес браузера.

## Якщо команда відсутня

Якщо `openclaw browser` є невідомою командою, перевірте `plugins.allow` у `~/.openclaw/openclaw.json`.

Коли `plugins.allow` присутній, вбудований плагін браузера має бути явно вказаний у списку:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true` не відновлює підкоманду CLI, якщо список дозволених плагінів виключає `browser`.

Пов’язане: [інструмент Browser](/uk/tools/browser#missing-browser-command-or-tool)

## Профілі

Профілі — це іменовані конфігурації маршрутизації браузера. На практиці:

- `openclaw`: запускає або під’єднується до окремого екземпляра Chrome, яким керує OpenClaw (ізольований каталог користувацьких даних).
- `user`: керує вашим наявним сеансом Chrome, у якому вже виконано вхід, через Chrome DevTools MCP.
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

`tabs` спочатку повертає `suggestedTargetId`, потім стабільний `tabId`, наприклад `t1`, необов’язкову мітку та сирий `targetId`. Агенти мають передавати `suggestedTargetId` назад у `focus`, `close`, знімки та дії. Ви можете призначити мітку за допомогою `open --label`, `tab new --label` або `tab label`; мітки, ідентифікатори вкладок, сирі ідентифікатори цілей і унікальні префікси ідентифікаторів цілей — усе це підтримується.

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

- `--full-page` призначений лише для захоплення сторінки; його не можна поєднувати з `--ref` або `--element`.
- Профілі `existing-session` / `user` підтримують скриншоти сторінок і скриншоти `--ref` із виводу знімка, але не підтримують скриншоти CSS `--element`.
- `--labels` накладає поточні посилання знімка на скриншот.
- `snapshot --urls` додає виявлені адреси посилань до AI-знімків, щоб агенти могли вибирати прямі цілі навігації замість здогадок лише за текстом посилання.

Navigate/click/type (автоматизація UI на основі ref):

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
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

Цей шлях доступний лише на хості. Для Docker, headless-серверів, Browserless або інших віддалених сценаріїв використовуйте профіль CDP.

Поточні обмеження existing-session:

- дії на основі знімків використовують ref, а не CSS-селектори
- `click` підтримує лише лівий клік
- `type` не підтримує `slowly=true`
- `press` не підтримує `delayMs`
- `hover`, `scrollintoview`, `drag`, `select`, `fill` і `evaluate` відхиляють перевизначення тайм-ауту для окремого виклику
- `select` підтримує лише одне значення
- `wait --load networkidle` не підтримується
- завантаження файлів вимагає `--ref` / `--input-ref`, не підтримує CSS `--element` і наразі підтримує лише один файл за раз
- обробники діалогів не підтримують `--timeout`
- скриншоти підтримують захоплення сторінки та `--ref`, але не CSS `--element`
- `responsebody`, перехоплення завантажень, експорт PDF і пакетні дії, як і раніше, вимагають керованого браузера або сирого профілю CDP

## Віддалене керування браузером (проксі хоста вузла)

Якщо Gateway працює на іншій машині, ніж браузер, запустіть **хост вузла** на машині, де є Chrome/Brave/Edge/Chromium. Gateway проксуватиме дії браузера до цього вузла (окремий сервер керування браузером не потрібен).

Використовуйте `gateway.nodes.browser.mode` для керування автоматичною маршрутизацією та `gateway.nodes.browser.node`, щоб закріпити конкретний вузол, якщо під’єднано кілька вузлів.

Безпека й віддалене налаштування: [інструмент Browser](/uk/tools/browser), [віддалений доступ](/uk/gateway/remote), [Tailscale](/uk/gateway/tailscale), [безпека](/uk/gateway/security)

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Browser](/uk/tools/browser)
