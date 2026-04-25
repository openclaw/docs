---
read_when:
    - Створення сценаріїв або налагодження браузера агента через локальний API керування
    - Шукаєте довідник CLI `openclaw browser`
    - Додавання власної автоматизації браузера за допомогою знімків і посилань
summary: API керування браузером OpenClaw, довідник CLI та дії сценаріїв
title: API керування браузером
x-i18n:
    generated_at: "2026-04-25T06:34:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: e9d18da48dfb6cf127fabbaa056411162640ab62e15690617138af3c23ee19c9
    source_path: tools/browser-control.md
    workflow: 15
---

Для налаштування, конфігурації та усунення несправностей див. [Browser](/uk/tools/browser).
Ця сторінка є довідником для локального HTTP API керування, CLI `openclaw browser`
та шаблонів сценаріїв (знімки, посилання, очікування, потоки налагодження).

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

Усі кінцеві точки приймають `?profile=<name>`.

Якщо налаштовано автентифікацію Gateway зі спільним секретом, HTTP-маршрути браузера також вимагають автентифікації:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` або HTTP Basic auth із цим паролем

Примітки:

- Цей окремий loopback API браузера **не** використовує заголовки trusted-proxy або заголовки ідентичності Tailscale Serve.
- Якщо `gateway.auth.mode` має значення `none` або `trusted-proxy`, ці loopback-маршрути браузера не успадковують ці режими з передаванням ідентичності; залишайте їх доступними лише через loopback.

### Контракт помилок `/act`

`POST /act` використовує структуровану відповідь про помилку для перевірки на рівні маршруту та збоїв політики:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Поточні значення `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): відсутній `kind` або його не розпізнано.
- `ACT_INVALID_REQUEST` (HTTP 400): не вдалося нормалізувати або перевірити корисне навантаження дії.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` було використано з непідтримуваним типом дії.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (або `wait --fn`) вимкнено конфігурацією.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): верхньорівневий або пакетний `targetId` конфліктує з ціллю запиту.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): дія не підтримується для профілів existing-session.

Інші збої під час виконання все ще можуть повертати `{ "error": "<message>" }` без поля `code`.

### Вимога Playwright

Деякі можливості (`navigate`/`act`/AI snapshot/role snapshot, скриншоти елементів,
PDF) потребують Playwright. Якщо Playwright не встановлено, ці кінцеві точки повертають
зрозумілу помилку 501.

Що все ще працює без Playwright:

- Знімки ARIA
- Скриншоти сторінки для керованого браузера `openclaw`, коли доступний
  WebSocket CDP для окремої вкладки
- Скриншоти сторінки для профілів `existing-session` / Chrome MCP
- Скриншоти за посиланням для `existing-session` (`--ref`) з виводу snapshot

Що все ще потребує Playwright:

- `navigate`
- `act`
- AI snapshots / role snapshots
- Скриншоти елементів за CSS-селекторами (`--element`)
- Експорт повного PDF браузера

Скриншоти елементів також відхиляють `--full-page`; маршрут повертає `fullPage is
not supported for element screenshots`.

Якщо ви бачите `Playwright is not available in this gateway build`, відновіть
залежності середовища виконання комплектного browser Plugin, щоб було встановлено
`playwright-core`, а потім перезапустіть Gateway. Для пакетних установок виконайте `openclaw doctor --fix`.
Для Docker також установіть двійкові файли браузера Chromium, як показано нижче.

#### Установлення Playwright у Docker

Якщо ваш Gateway працює в Docker, уникайте `npx playwright` (конфлікти перевизначення npm).
Натомість використовуйте комплектний CLI:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Щоб зберігати завантаження браузера, задайте `PLAYWRIGHT_BROWSERS_PATH` (наприклад,
`/home/node/.cache/ms-playwright`) і переконайтеся, що `/home/node` зберігається через
`OPENCLAW_HOME_VOLUME` або bind mount. Див. [Docker](/uk/install/docker).

## Як це працює (внутрішньо)

Невеликий loopback-сервер керування приймає HTTP-запити та підключається до браузерів на основі Chromium через CDP. Розширені дії (click/type/snapshot/PDF) виконуються через Playwright поверх CDP; коли Playwright відсутній, доступні лише операції без Playwright. Агент бачить один стабільний інтерфейс, тоді як локальні/віддалені браузери та профілі вільно змінюються під ним.

## Короткий довідник CLI

Усі команди приймають `--browser-profile <name>` для націлювання на конкретний профіль і `--json` для машинозчитуваного виводу.

<AccordionGroup>

<Accordion title="Основи: стан, вкладки, open/focus/close">

```bash
openclaw browser status
openclaw browser start
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

<Accordion title="Інспекція: screenshot, snapshot, console, errors, requests">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # або --ref e12 для role refs
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
openclaw browser click 12 --double           # або e12 для role refs
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

- `upload` і `dialog` — це виклики **підготовки**; виконайте їх перед click/press, що запускає file chooser або dialog.
- `click`/`type`/тощо потребують `ref` із `snapshot` (числовий `12` або role ref `e12`). CSS-селектори навмисно не підтримуються для дій. Використовуйте `click-coords`, коли єдиною надійною ціллю є видима позиція в області перегляду.
- Шляхи для download, trace і upload обмежені тимчасовими коренями OpenClaw: `/tmp/openclaw{,/downloads,/uploads}` (резервний варіант: `${os.tmpdir()}/openclaw/...`).
- `upload` також може напряму задавати file input через `--input-ref` або `--element`.

Коротко про прапорці snapshot:

- `--format ai` (типово з Playwright): AI snapshot із числовими посиланнями (`aria-ref="<n>"`).
- `--format aria`: дерево доступності, без посилань; лише для інспекції.
- `--efficient` (або `--mode efficient`): компактний пресет role snapshot. Установіть `browser.snapshotDefaults.mode: "efficient"`, щоб зробити його типовим (див. [Конфігурація Gateway](/uk/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` примусово використовують role snapshot із посиланнями `ref=e12`. `--frame "<iframe>"` обмежує role snapshots певним iframe.
- `--labels` додає скриншот лише області перегляду з накладеними мітками посилань (виводить `MEDIA:<path>`).
- `--urls` додає виявлені адреси посилань до AI snapshots.

## Знімки та посилання

OpenClaw підтримує два стилі “snapshot”:

- **AI snapshot (числові посилання)**: `openclaw browser snapshot` (типово; `--format ai`)
  - Вивід: текстовий знімок, що містить числові посилання.
  - Дії: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Внутрішньо посилання визначається через `aria-ref` у Playwright.

- **Role snapshot (role refs на кшталт `e12`)**: `openclaw browser snapshot --interactive` (або `--compact`, `--depth`, `--selector`, `--frame`)
  - Вивід: список/дерево на основі ролей із `[ref=e12]` (і необов’язковим `[nth=1]`).
  - Дії: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Внутрішньо посилання визначається через `getByRole(...)` (плюс `nth()` для дублікатів).
  - Додайте `--labels`, щоб включити скриншот області перегляду з накладеними мітками `e12`.
  - Додайте `--urls`, коли текст посилання неоднозначний і агенту потрібні конкретні
    цілі навігації.

Поведінка посилань:

- Посилання **не є стабільними між переходами**; якщо щось не спрацьовує, повторно виконайте `snapshot` і використайте нове посилання.
- Якщо role snapshot було зроблено з `--frame`, role refs обмежуються цим iframe до наступного role snapshot.

## Розширені можливості wait

Можна чекати не лише час або текст:

- Очікування URL (глоби підтримуються Playwright):
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

Коли дія не спрацьовує (наприклад, “not visible”, “strict mode violation”, “covered”):

1. `openclaw browser snapshot --interactive`
2. Використайте `click <ref>` / `type <ref>` (віддавайте перевагу role refs в interactive mode)
3. Якщо це все ще не працює: `openclaw browser highlight <ref>`, щоб побачити, на що саме націлюється Playwright
4. Якщо сторінка поводиться дивно:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Для глибокого налагодження: запишіть trace:
   - `openclaw browser trace start`
   - відтворіть проблему
   - `openclaw browser trace stop` (виводить `TRACE:<path>`)

## Вивід JSON

`--json` призначено для сценаріїв і структурованих інструментів.

Приклади:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Role snapshots у JSON містять `refs`, а також невеликий блок `stats` (lines/chars/refs/interactive), щоб інструменти могли оцінювати розмір і щільність корисного навантаження.

## Параметри стану та середовища

Вони корисні для потоків “змусити сайт поводитися як X”:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Сховище: `storage local|session get|set|clear`
- Офлайн: `set offline on|off`
- Заголовки: `set headers --headers-json '{"X-Debug":"1"}'` (застарілий `set headers --json '{"X-Debug":"1"}'` також лишається підтримуваним)
- HTTP basic auth: `set credentials user pass` (або `--clear`)
- Геолокація: `set geo <lat> <lon> --origin "https://example.com"` (або `--clear`)
- Медіа: `set media dark|light|no-preference|none`
- Часовий пояс / локаль: `set timezone ...`, `set locale ...`
- Пристрій / область перегляду:
  - `set device "iPhone 14"` (пресети пристроїв Playwright)
  - `set viewport 1280 720`

## Безпека та приватність

- Профіль браузера openclaw може містити сеанси з виконаним входом; вважайте його чутливим.
- `browser act kind=evaluate` / `openclaw browser evaluate` і `wait --fn`
  виконують довільний JavaScript у контексті сторінки. Prompt injection може на це
  вплинути. Вимкніть це через `browser.evaluateEnabled=false`, якщо воно вам не потрібне.
- Для входу на сайти та приміток щодо антибот-захисту (X/Twitter тощо) див. [Browser login + X/Twitter posting](/uk/tools/browser-login).
- Тримайте хост Gateway/node приватним (лише loopback або лише tailnet).
- Віддалені кінцеві точки CDP мають широкі можливості; використовуйте тунелювання та захищайте їх.

Приклад strict mode (типово блокувати приватні/внутрішні адреси призначення):

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
- [Browser Linux troubleshooting](/uk/tools/browser-linux-troubleshooting)
- [Browser WSL2 troubleshooting](/uk/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
