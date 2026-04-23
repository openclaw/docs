---
read_when:
    - Ви використовуєте `openclaw browser` і хочете приклади для поширених завдань
    - Ви хочете керувати браузером, що працює на іншій машині, через хост node
    - Ви хочете під’єднатися до свого локального Chrome, у якому вже виконано вхід, через Chrome MCP
summary: Довідка CLI для `openclaw browser` (життєвий цикл, профілі, вкладки, дії, стан і налагодження)
title: браузер
x-i18n:
    generated_at: "2026-04-23T06:17:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0cf1a5168e690121d4fc4eac984580c89bc50844f15558413ba6d8a635da2ed6
    source_path: cli/browser.md
    workflow: 15
---

# `openclaw browser`

Керуйте поверхнею керування браузером OpenClaw і запускайте дії браузера (життєвий цикл, профілі, вкладки, знімки стану, знімки екрана, навігація, введення, емуляція стану та налагодження).

Пов’язане:

- Інструмент браузера + API: [Інструмент браузера](/uk/tools/browser)

## Поширені прапорці

- `--url <gatewayWsUrl>`: URL WebSocket Gateway (типово з конфігурації).
- `--token <token>`: токен Gateway (за потреби).
- `--timeout <ms>`: тайм-аут запиту (мс).
- `--expect-final`: чекати фінальної відповіді Gateway.
- `--browser-profile <name>`: вибрати профіль браузера (типовий з конфігурації).
- `--json`: машинозчитуваний вивід (де підтримується).

## Швидкий старт (локально)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

## Швидке усунення несправностей

Якщо `start` завершується помилкою `not reachable after start`, спочатку перевірте готовність CDP. Якщо `start` і `tabs` виконуються успішно, але `open` або `navigate` завершується помилкою, площина керування браузером справна, а причина збою зазвичай у політиці SSRF для навігації.

Мінімальна послідовність:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Детальні вказівки: [Усунення несправностей браузера](/uk/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## Життєвий цикл

```bash
openclaw browser status
openclaw browser start
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

Примітки:

- Для профілів `attachOnly` і віддаленого CDP команда `openclaw browser stop` закриває активний сеанс керування та очищає тимчасові перевизначення емуляції, навіть якщо OpenClaw сам не запускав процес браузера.
- Для локальних керованих профілів `openclaw browser stop` зупиняє запущений процес браузера.

## Якщо команда відсутня

Якщо `openclaw browser` є невідомою командою, перевірте `plugins.allow` у `~/.openclaw/openclaw.json`.

Коли `plugins.allow` присутній, вбудований Plugin браузера має бути явно вказаний:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true` не відновлює підкоманду CLI, якщо список дозволених plugin виключає `browser`.

Пов’язане: [Інструмент браузера](/uk/tools/browser#missing-browser-command-or-tool)

## Профілі

Профілі — це іменовані конфігурації маршрутизації браузера. На практиці:

- `openclaw`: запускає або під’єднується до окремого екземпляра Chrome під керуванням OpenClaw (ізольований каталог даних користувача).
- `user`: керує вашою наявною сесією Chrome із виконаним входом через Chrome DevTools MCP.
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
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://docs.openclaw.ai
openclaw browser focus <targetId>
openclaw browser close <targetId>
```

## Знімок стану / знімок екрана / дії

Знімок стану:

```bash
openclaw browser snapshot
```

Знімок екрана:

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
```

Примітки:

- `--full-page` призначений лише для захоплення сторінки; його не можна поєднувати з `--ref` або `--element`.
- Профілі `existing-session` / `user` підтримують знімки екрана сторінки та знімки екрана з `--ref` із виводу знімка стану, але не підтримують знімки екрана CSS `--element`.

Навігація/клік/введення (автоматизація UI на основі ref):

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

Цей шлях працює лише на хості. Для Docker, headless-серверів, Browserless або інших віддалених налаштувань замість цього використовуйте профіль CDP.

Поточні обмеження existing-session:

- дії на основі знімка стану використовують ref, а не CSS-селектори
- `click` підтримує лише клік лівою кнопкою
- `type` не підтримує `slowly=true`
- `press` не підтримує `delayMs`
- `hover`, `scrollintoview`, `drag`, `select`, `fill` і `evaluate` відхиляють перевизначення тайм-ауту для окремих викликів
- `select` підтримує лише одне значення
- `wait --load networkidle` не підтримується
- вивантаження файлів потребує `--ref` / `--input-ref`, не підтримує CSS `--element` і наразі підтримує один файл за раз
- гачки діалогів не підтримують `--timeout`
- знімки екрана підтримують захоплення сторінки та `--ref`, але не CSS `--element`
- `responsebody`, перехоплення завантажень, експорт PDF і пакетні дії, як і раніше, потребують керованого браузера або профілю raw CDP

## Віддалене керування браузером (проксі хоста node)

Якщо Gateway працює на іншій машині, ніж браузер, запустіть **хост node** на машині, де є Chrome/Brave/Edge/Chromium. Gateway проксіюватиме дії браузера до цього node (окремий сервер керування браузером не потрібен).

Використовуйте `gateway.nodes.browser.mode`, щоб керувати автоматичною маршрутизацією, і `gateway.nodes.browser.node`, щоб закріпити конкретний node, якщо під’єднано кілька.

Безпека й віддалене налаштування: [Інструмент браузера](/uk/tools/browser), [Віддалений доступ](/uk/gateway/remote), [Tailscale](/uk/gateway/tailscale), [Безпека](/uk/gateway/security)
