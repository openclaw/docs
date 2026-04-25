---
read_when:
    - Написання скриптів або налагодження браузера агента через локальний API керування
    - Шукаєте довідник CLI `openclaw browser`
    - Додавання власної автоматизації браузера зі знімками та посиланнями
summary: API керування браузером OpenClaw, довідник CLI та дії скриптів
title: API керування браузером
x-i18n:
    generated_at: "2026-04-25T10:49:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1515ca1e31e6fd8fd3e0f34f17ce309c52202e26ed3b79e24a460380efab040d
    source_path: tools/browser-control.md
    workflow: 15
---

Для налаштування, конфігурації та усунення несправностей див. [Browser](/uk/tools/browser).
Ця сторінка є довідником для локального HTTP API керування, CLI `openclaw browser`
та шаблонів написання скриптів (знімки, посилання, очікування, потоки налагодження).

## API керування (необов’язково)

Лише для локальних інтеграцій Gateway надає невеликий loopback HTTP API:

- Стан/запуск/зупинка: `GET /`, `POST /start`, `POST /stop`
- Вкладки: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Знімок/скриншот: `GET /snapshot`, `POST /screenshot`
- Дії: `POST /navigate`, `POST /act`
- Хуки: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Завантаження: `POST /download`, `POST /wait/download`
- Налагодження: `GET /console`, `POST /pdf`
- Налагодження: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Мережа: `POST /response/body`
- Стан: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Стан: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Налаштування: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Усі ендпойнти приймають `?profile=<name>`. `POST /start?headless=true` запитує
одноразовий запуск у режимі headless для локально керованих профілів без зміни
збереженої конфігурації браузера; профілі attach-only, remote CDP та existing-session відхиляють
це перевизначення, оскільки OpenClaw не запускає ці процеси браузера.

Якщо налаштовано автентифікацію Gateway через shared-secret, HTTP-маршрути браузера теж потребують автентифікації:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` або HTTP Basic auth із цим паролем

Примітки:

- Цей автономний loopback API браузера **не** використовує заголовки trusted-proxy або
  заголовки ідентифікації Tailscale Serve.
- Якщо `gateway.auth.mode` має значення `none` або `trusted-proxy`, ці loopback-маршрути браузера
  не успадковують ці режими з передаванням ідентифікації; залишайте їх доступними лише через loopback.

### Контракт помилок `/act`

`POST /act` використовує структуровану відповідь про помилку для перевірки на рівні маршруту та
збоїв політик:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Поточні значення `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` відсутній або не розпізнаний.
- `ACT_INVALID_REQUEST` (HTTP 400): корисне навантаження дії не пройшло нормалізацію або перевірку.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` використано з типом дії, який його не підтримує.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (або `wait --fn`) вимкнено конфігурацією.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): верхньорівневий або пакетний `targetId` конфліктує з цільовим запитом.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): дія не підтримується для профілів existing-session.

Інші збої під час виконання все ще можуть повертати `{ "error": "<message>" }` без поля
`code`.

### Вимога Playwright

Для деяких можливостей (navigate/act/AI snapshot/role snapshot, скриншоти елементів,
PDF) потрібен Playwright. Якщо Playwright не встановлено, ці ендпойнти повертають
зрозумілу помилку 501.

Що все ще працює без Playwright:

- Знімки ARIA
- Скриншоти сторінки для керованого браузера `openclaw`, коли для вкладки доступний
  WebSocket CDP
- Скриншоти сторінки для профілів `existing-session` / Chrome MCP
- Скриншоти на основі посилань `existing-session` (`--ref`) з виводу знімка

Що все ще потребує Playwright:

- `navigate`
- `act`
- AI snapshots / role snapshots
- Скриншоти елементів через CSS-селектор (`--element`)
- Експорт PDF усього браузера

Скриншоти елементів також відхиляють `--full-page`; маршрут повертає `fullPage is
not supported for element screenshots`.

Якщо ви бачите `Playwright is not available in this gateway build`, відновіть
залежності середовища виконання вбудованого browser Plugin, щоб було встановлено `playwright-core`,
а потім перезапустіть Gateway. Для пакетних установок виконайте `openclaw doctor --fix`.
Для Docker також установіть двійкові файли браузера Chromium, як показано нижче.

#### Установлення Playwright у Docker

Якщо ваш Gateway працює в Docker, уникайте `npx playwright` (конфлікти перевизначення npm).
Натомість використовуйте вбудований CLI:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Щоб зберігати завантажені браузери, установіть `PLAYWRIGHT_BROWSERS_PATH` (наприклад,
`/home/node/.cache/ms-playwright`) і переконайтеся, що `/home/node` зберігається через
`OPENCLAW_HOME_VOLUME` або bind mount. Див. [Docker](/uk/install/docker).

## Як це працює (внутрішньо)

Невеликий loopback-сервер керування приймає HTTP-запити та підключається до браузерів на базі Chromium через CDP. Розширені дії (click/type/snapshot/PDF) виконуються через Playwright поверх CDP; коли Playwright відсутній, доступні лише операції без Playwright. Агент бачить один стабільний інтерфейс, тоді як локальні/віддалені браузери та профілі вільно змінюються під ним.

## Короткий довідник CLI

Усі команди приймають `--browser-profile <name>` для націлювання на конкретний профіль, а також `--json` для машиночитного виводу.

<AccordionGroup>

<Accordion title="Основи: стан, вкладки, open/focus/close">

```bash
openclaw browser status
openclaw browser start
openclaw browser start --headless # одноразовий локальний керований запуск у режимі headless
openclaw browser stop            # також очищає емуляцію для attach-only/remote CDP
openclaw browser tabs
openclaw browser tab             # скорочення для поточної вкладки
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="Інспектування: screenshot, snapshot, console, errors, requests">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # або --ref e12
openclaw browser screenshot --labels
openclaw browser snapshot
openclaw browser snapshot --format aria --limit 200
openclaw browser snapshot --interactive --compact --depth 6
openclaw browser snapshot --efficient
openclaw browser snapshot --labels
openclaw browser snapshot --urls
openclaw browser snapshot --selector "#main" --interactive
openclaw browser snapshot --frame "iframe#main" --interactive
openclaw browser console --level error
openclaw browser errors --clear
openclaw browser requests --filter api --clear
openclaw browser pdf
openclaw browser responsebody "**/api" --max-chars 5000
```

</Accordion>

<Accordion title="Дії: navigate, click, type, drag, wait, evaluate">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # або e12 для рольових посилань
openclaw browser click-coords 120 340        # координати області перегляду
openclaw browser type 23 "hello" --submit
openclaw browser press Enter
openclaw browser hover 44
openclaw browser scrollintoview e12
openclaw browser drag 10 11
openclaw browser select 9 OptionA OptionB
openclaw browser download e12 report.pdf
openclaw browser waitfordownload report.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf
openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'
openclaw browser dialog --accept
openclaw browser wait --text "Done"
openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"
openclaw browser evaluate --fn '(el) => el.textContent' --ref 7
openclaw browser highlight e12
openclaw browser trace start
openclaw browser trace stop
```

</Accordion>

<Accordion title="Стан: cookies, storage, offline, headers, geo, device">

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url "https://example.com"
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set theme dark
openclaw browser storage session clear
openclaw browser set offline on
openclaw browser set headers --headers-json '{"X-Debug":"1"}'
openclaw browser set credentials user pass            # --clear для видалення
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

Примітки:

- `upload` і `dialog` — це виклики **підготовки**; виконуйте їх перед click/press, який запускає file chooser або діалог.
- `click`/`type`/тощо потребують `ref` зі `snapshot` (числовий `12`, рольове посилання `e12` або виконуване посилання ARIA `ax12`). CSS-селектори навмисно не підтримуються для дій. Використовуйте `click-coords`, коли видима позиція в області перегляду є єдиною надійною ціллю.
- Шляхи download, trace і upload обмежені тимчасовими коренями OpenClaw: `/tmp/openclaw{,/downloads,/uploads}` (резервний варіант: `${os.tmpdir()}/openclaw/...`).
- `upload` також може безпосередньо встановлювати file input через `--input-ref` або `--element`.

Коротко про прапорці snapshot:

- `--format ai` (типово з Playwright): AI snapshot із числовими посиланнями (`aria-ref="<n>"`).
- `--format aria`: дерево доступності з посиланнями `axN`. Коли Playwright доступний, OpenClaw прив’язує посилання з backend DOM id до живої сторінки, щоб подальші дії могли їх використовувати; інакше сприймайте вивід лише як засіб інспектування.
- `--efficient` (або `--mode efficient`): компактний попередньо встановлений режим role snapshot. Установіть `browser.snapshotDefaults.mode: "efficient"`, щоб зробити його типовим (див. [Конфігурація Gateway](/uk/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` примусово вмикають role snapshot із посиланнями `ref=e12`. `--frame "<iframe>"` обмежує role snapshots в межах iframe.
- `--labels` додає скриншот лише видимої області з накладеними мітками посилань (виводить `MEDIA:<path>`).
- `--urls` додає знайдені адреси посилань до AI snapshots.

## Знімки та посилання

OpenClaw підтримує два стилі “знімків”:

- **AI snapshot (числові посилання)**: `openclaw browser snapshot` (типово; `--format ai`)
  - Вивід: текстовий знімок, що містить числові посилання.
  - Дії: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Внутрішньо посилання розв’язується через Playwright `aria-ref`.

- **Role snapshot (рольові посилання на кшталт `e12`)**: `openclaw browser snapshot --interactive` (або `--compact`, `--depth`, `--selector`, `--frame`)
  - Вивід: список/дерево на основі ролей із `[ref=e12]` (і необов’язковим `[nth=1]`).
  - Дії: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Внутрішньо посилання розв’язується через `getByRole(...)` (плюс `nth()` для дублікатів).
  - Додайте `--labels`, щоб включити скриншот області перегляду з накладеними мітками `e12`.
  - Додайте `--urls`, коли текст посилання неоднозначний і агенту потрібні конкретні
    цілі навігації.

- **ARIA snapshot (посилання ARIA на кшталт `ax12`)**: `openclaw browser snapshot --format aria`
  - Вивід: дерево доступності як структуровані вузли.
  - Дії: `openclaw browser click ax12` працює, коли шлях знімка може прив’язати
    посилання через Playwright і Chrome backend DOM ids.
  - Якщо Playwright недоступний, знімки ARIA все одно можуть бути корисними для
    інспектування, але посилання можуть бути непридатними для дій. Повторно створіть знімок із `--format ai`
    або `--interactive`, коли вам потрібні посилання для дій.

Поведінка посилань:

- Посилання **не є стабільними між навігаціями**; якщо щось не спрацювало, повторно виконайте `snapshot` і використайте свіже посилання.
- Якщо role snapshot було зроблено з `--frame`, рольові посилання обмежуються цим iframe до наступного role snapshot.
- Невідомі або застарілі посилання `axN` завершуються швидкою помилкою замість переходу до
  селектора Playwright `aria-ref`. У такому разі створіть свіжий snapshot на тій самій вкладці.

## Розширені можливості wait

Можна чекати не лише час/текст:

- Очікування URL (підтримуються glob-шаблони Playwright):
  - `openclaw browser wait --url "**/dash"`
- Очікування стану завантаження:
  - `openclaw browser wait --load networkidle`
- Очікування JS-предиката:
  - `openclaw browser wait --fn "window.ready===true"`
- Очікування, поки селектор стане видимим:
  - `openclaw browser wait "#main"`

Їх можна комбінувати:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Потоки налагодження

Коли дія завершується помилкою (наприклад, “not visible”, “strict mode violation”, “covered”):

1. `openclaw browser snapshot --interactive`
2. Використайте `click <ref>` / `type <ref>` (у інтерактивному режимі надавайте перевагу рольовим посиланням)
3. Якщо все одно не працює: `openclaw browser highlight <ref>`, щоб побачити, на що націлюється Playwright
4. Якщо сторінка поводиться дивно:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Для глибокого налагодження: запишіть trace:
   - `openclaw browser trace start`
   - відтворіть проблему
   - `openclaw browser trace stop` (виводить `TRACE:<path>`)

## Вивід JSON

`--json` призначено для написання скриптів і структурованих інструментів.

Приклади:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Role snapshots у JSON містять `refs` плюс невеликий блок `stats` (lines/chars/refs/interactive), щоб інструменти могли оцінювати розмір і щільність корисного навантаження.

## Параметри стану та середовища

Вони корисні для потоків на кшталт “змусити сайт поводитися як X”:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'` (застарілий варіант `set headers --json '{"X-Debug":"1"}'` усе ще підтримується)
- HTTP Basic auth: `set credentials user pass` (або `--clear`)
- Geolocation: `set geo <lat> <lon> --origin "https://example.com"` (або `--clear`)
- Media: `set media dark|light|no-preference|none`
- Часовий пояс / локаль: `set timezone ...`, `set locale ...`
- Пристрій / область перегляду:
  - `set device "iPhone 14"` (попередньо встановлені пристрої Playwright)
  - `set viewport 1280 720`

## Безпека та конфіденційність

- Профіль браузера openclaw може містити сеанси з виконаним входом; вважайте його чутливим.
- `browser act kind=evaluate` / `openclaw browser evaluate` і `wait --fn`
  виконують довільний JavaScript у контексті сторінки. Ін’єкція підказок може
  на це впливати. Вимкніть це через `browser.evaluateEnabled=false`, якщо воно вам не потрібне.
- Для приміток щодо входу та anti-bot (X/Twitter тощо) див. [Browser login + X/Twitter posting](/uk/tools/browser-login).
- Тримайте вузол Gateway/node приватним (лише loopback або лише tailnet).
- Віддалені ендпойнти CDP мають широкі можливості; тунелюйте й захищайте їх.

Приклад strict mode (типово блокувати приватні/внутрішні призначення):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // необов’язковий точний дозвіл
    },
  },
}
```

## Пов’язане

- [Browser](/uk/tools/browser) — огляд, конфігурація, профілі, безпека
- [Browser login](/uk/tools/browser-login) — вхід на сайти
- [Усунення проблем Browser у Linux](/uk/tools/browser-linux-troubleshooting)
- [Усунення проблем Browser у WSL2](/uk/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
