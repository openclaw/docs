---
read_when:
    - Ви використовуєте `openclaw browser` і хочете приклади для поширених завдань
    - Ви хочете керувати браузером, що працює на іншій машині, через вузол-хост
    - Ви хочете під’єднатися до вашого локального Chrome із виконаним входом через Chrome MCP
summary: Довідник CLI для `openclaw browser` (життєвий цикл, профілі, вкладки, дії, стан і налагодження)
title: Браузер
x-i18n:
    generated_at: "2026-04-25T09:15:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8516a139ad04c20df6fadb261b4fd7175a145cee7edd3cec51d8acdbfe40de26
    source_path: cli/browser.md
    workflow: 15
---

# `openclaw browser`

Керуйте поверхнею керування браузером OpenClaw і запускайте дії браузера (життєвий цикл, профілі, вкладки, знімки, знімки екрана, навігація, введення, емуляція стану та налагодження).

Пов’язане:

- Інструмент браузера + API: [Інструмент браузера](/uk/tools/browser)

## Поширені прапорці

- `--url <gatewayWsUrl>`: URL WebSocket Gateway (типово з конфігурації).
- `--token <token>`: токен Gateway (якщо потрібен).
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

Якщо `start` завершується помилкою `not reachable after start`, спочатку усуньте проблеми з готовністю CDP. Якщо `start` і `tabs` виконуються успішно, але `open` або `navigate` завершуються помилкою, площина керування браузером працює справно, а причиною збою зазвичай є політика SSRF навігації.

Мінімальна послідовність:

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Докладні вказівки: [Усунення несправностей браузера](/uk/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## Життєвий цикл

```bash
openclaw browser status
openclaw browser doctor
openclaw browser start
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

Примітки:

- Для профілів `attachOnly` і віддалених профілів CDP `openclaw browser stop` закриває активний сеанс керування та очищає тимчасові перевизначення емуляції, навіть якщо OpenClaw сам не запускав процес браузера.
- Для локальних керованих профілів `openclaw browser stop` зупиняє породжений процес браузера.

## Якщо команда відсутня

Якщо `openclaw browser` є невідомою командою, перевірте `plugins.allow` у `~/.openclaw/openclaw.json`.

Коли `plugins.allow` присутній, вбудований Plugin браузера має бути явно вказаний у списку:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true` не відновлює підкоманду CLI, якщо список дозволених Plugin не містить `browser`.

Пов’язане: [Інструмент браузера](/uk/tools/browser#missing-browser-command-or-tool)

## Профілі

Профілі — це іменовані конфігурації маршрутизації браузера. На практиці:

- `openclaw`: запускає або під’єднується до окремого екземпляра Chrome, керованого OpenClaw (ізольований каталог даних користувача).
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

`tabs` спочатку повертає `suggestedTargetId`, потім стабільний `tabId`, наприклад `t1`, необов’язкову мітку та сирий `targetId`. Агенти мають передавати `suggestedTargetId` назад у `focus`, `close`, знімки та дії. Ви можете призначити мітку за допомогою `open --label`, `tab new --label` або `tab label`; підтримуються мітки, ідентифікатори вкладок, сирі ідентифікатори цілей і унікальні префікси ідентифікаторів цілей.

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

- `--full-page` призначений лише для знімків сторінки; його не можна поєднувати з `--ref` або `--element`.
- Профілі `existing-session` / `user` підтримують знімки екрана сторінок і знімки `--ref` з виводу snapshot, але не підтримують знімки CSS `--element`.
- `--labels` накладає поточні посилання snapshot на знімок екрана.
- `snapshot --urls` додає виявлені адреси посилань до AI-знімків, щоб агенти могли вибирати прямі цілі навігації замість того, щоб вгадувати лише за текстом посилання.

Navigate/click/type (автоматизація UI на основі ref):

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

Керовані профілі Chrome зберігають звичайні завантаження, ініційовані кліком, до каталогу завантажень OpenClaw (`/tmp/openclaw/downloads` типово або налаштований корінь тимчасових файлів). Використовуйте `waitfordownload` або `download`, коли агенту потрібно дочекатися конкретного файлу та повернути шлях до нього; ці явні очікувачі керують наступним завантаженням.

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
openclaw browser --browser-profile chrome-live tabs
```

Цей шлях працює лише на хості. Для Docker, headless-серверів, Browserless або інших віддалених конфігурацій використовуйте профіль CDP.

Поточні обмеження existing-session:

- дії, керовані snapshot, використовують refs, а не CSS-селектори
- `browser.actionTimeoutMs` типово застосовує до підтримуваних запитів `act` значення 60000 мс, коли виклики не передають `timeoutMs`; значення `timeoutMs` для конкретного виклику все одно має пріоритет.
- `click` підтримує лише лівий клік
- `type` не підтримує `slowly=true`
- `press` не підтримує `delayMs`
- `hover`, `scrollintoview`, `drag`, `select`, `fill` і `evaluate` відхиляють перевизначення тайм-ауту для конкретного виклику
- `select` підтримує лише одне значення
- `wait --load networkidle` не підтримується
- вивантаження файлів вимагає `--ref` / `--input-ref`, не підтримує CSS `--element` і наразі підтримує лише один файл за раз
- гачки діалогів не підтримують `--timeout`
- знімки екрана підтримують знімки сторінок і `--ref`, але не CSS `--element`
- `responsebody`, перехоплення завантажень, експорт PDF і пакетні дії все ще потребують керованого браузера або сирого профілю CDP

## Віддалене керування браузером (проксі вузла-хоста)

Якщо Gateway працює на іншій машині, ніж браузер, запустіть **вузол-хост** на машині, де є Chrome/Brave/Edge/Chromium. Gateway проксуватиме дії браузера на цей вузол (окремий сервер керування браузером не потрібен).

Використовуйте `gateway.nodes.browser.mode` для керування автоматичною маршрутизацією і `gateway.nodes.browser.node` для закріплення за конкретним вузлом, якщо підключено кілька вузлів.

Безпека + віддалене налаштування: [Інструмент браузера](/uk/tools/browser), [Віддалений доступ](/uk/gateway/remote), [Tailscale](/uk/gateway/tailscale), [Безпека](/uk/gateway/security)

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Браузер](/uk/tools/browser)
