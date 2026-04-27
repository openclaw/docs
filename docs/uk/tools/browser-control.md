---
read_when:
    - Створення сценаріїв або налагодження браузера агента через локальний API керування
    - Шукаєте довідник CLI `openclaw browser`
    - Додавання власної автоматизації браузера зі snapshot-ами та ref-ами
summary: API керування браузером OpenClaw, довідник CLI та дії для сценаріїв
title: API керування браузером
x-i18n:
    generated_at: "2026-04-27T14:22:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8bd0c0e5a5be9a8ec865c932d28456ace6a047d15a534a79c0b81a5e8904736f
    source_path: tools/browser-control.md
    workflow: 15
---

Інструкції з налаштування, конфігурації та усунення несправностей дивіться в [Browser](/uk/tools/browser).
Ця сторінка є довідником для локального HTTP API керування, CLI `openclaw browser`
і шаблонів сценаріїв (snapshot-и, ref-и, очікування, налагоджувальні сценарії).

## API керування (необов’язково)

Лише для локальних інтеграцій Gateway надає невеликий loopback HTTP API:

- Стан/запуск/зупинка: `GET /`, `POST /start`, `POST /stop`
- Вкладки: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/screenshot: `GET /snapshot`, `POST /screenshot`
- Дії: `POST /navigate`, `POST /act`
- Хуки: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Завантаження: `POST /download`, `POST /wait/download`
- Дозволи: `POST /permissions/grant`
- Налагодження: `GET /console`, `POST /pdf`
- Налагодження: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Мережа: `POST /response/body`
- Стан: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Стан: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Налаштування: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Усі endpoints приймають `?profile=<name>`. `POST /start?headless=true` запитує
одноразовий headless-запуск для локальних керованих профілів без зміни збереженої
конфігурації браузера; профілі attach-only, remote CDP і existing-session відхиляють
це перевизначення, оскільки OpenClaw не запускає ці процеси браузера.

Якщо налаштовано auth Gateway через shared secret, HTTP-маршрути браузера теж вимагають auth:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` або HTTP Basic auth із цим паролем

Примітки:

- Цей окремий loopback API браузера **не** використовує trusted-proxy або
  заголовки ідентичності Tailscale Serve.
- Якщо `gateway.auth.mode` має значення `none` або `trusted-proxy`, ці loopback-маршрути браузера
  не успадковують ці режими з передачею ідентичності; залишайте їх лише loopback.

### Контракт помилок `/act`

`POST /act` використовує структуровану відповідь помилки для перевірки на рівні маршруту та
збоїв policy:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Поточні значення `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` відсутній або не розпізнаний.
- `ACT_INVALID_REQUEST` (HTTP 400): payload дії не пройшов нормалізацію або перевірку.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` використано з непідтримуваним типом дії.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (або `wait --fn`) вимкнено конфігурацією.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): верхньорівневий або пакетний `targetId` конфліктує з ціллю запиту.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): дія не підтримується для профілів existing-session.

Інші збої під час виконання все ще можуть повертати `{ "error": "<message>" }` без поля
`code`.

### Вимога Playwright

Для деяких можливостей (navigate/act/AI snapshot/role snapshot, screenshots елементів,
PDF) потрібен Playwright. Якщо Playwright не встановлено, ці endpoints повертають
зрозумілу помилку 501.

Що все ще працює без Playwright:

- ARIA snapshot-и
- Snapshot-и спеціальних можливостей у стилі role (`--interactive`, `--compact`,
  `--depth`, `--efficient`), коли доступний WebSocket CDP для окремої вкладки. Це
  fallback для інспекції та пошуку ref-ів; Playwright залишається основним рушієм дій.
- Screenshot-и сторінки для керованого браузера `openclaw`, коли доступний WebSocket CDP
  для окремої вкладки
- Screenshot-и сторінки для профілів `existing-session` / Chrome MCP
- Screenshot-и на основі ref-ів (`--ref`) для `existing-session` із виводу snapshot

Що все ще потребує Playwright:

- `navigate`
- `act`
- AI snapshot-и, які залежать від нативного формату AI snapshot у Playwright
- Screenshot-и елементів за CSS-selector (`--element`)
- повний експорт PDF браузера

Screenshot-и елементів також відхиляють `--full-page`; маршрут повертає `fullPage is
not supported for element screenshots`.

Якщо ви бачите `Playwright is not available in this gateway build`, відновіть залежності runtime
bundled browser plugin, щоб було встановлено `playwright-core`,
а потім перезапустіть Gateway. Для пакетних встановлень виконайте `openclaw doctor --fix`.
Для Docker також встановіть двійкові файли браузера Chromium, як показано нижче.

#### Установлення Playwright у Docker

Якщо ваш Gateway працює в Docker, уникайте `npx playwright` (конфлікти npm override).
Використовуйте bundled CLI:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Щоб зберігати завантаження браузера, установіть `PLAYWRIGHT_BROWSERS_PATH` (наприклад,
`/home/node/.cache/ms-playwright`) і переконайтеся, що `/home/node` зберігається через
`OPENCLAW_HOME_VOLUME` або bind mount. Див. [Docker](/uk/install/docker).

## Як це працює (внутрішньо)

Невеликий loopback-сервер керування приймає HTTP-запити й підключається до браузерів на базі Chromium через CDP. Розширені дії (click/type/snapshot/PDF) виконуються через Playwright поверх CDP; коли Playwright відсутній, доступні лише операції без Playwright. Агент бачить один стабільний інтерфейс, тоді як локальні/віддалені браузери та профілі вільно підміняються під ним.

## Короткий довідник CLI

Усі команди приймають `--browser-profile <name>` для націлення на конкретний профіль і `--json` для машиночитаного виводу.

<AccordionGroup>

<Accordion title="Основи: стан, вкладки, open/focus/close">

```bash
openclaw browser status
openclaw browser start
openclaw browser start --headless # одноразовий локальний керований headless-запуск
openclaw browser stop            # також очищає емуляцію для профілів attach-only/remote CDP
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
openclaw browser click 12 --double           # або e12 для role ref-ів
openclaw browser click-coords 120 340        # координати viewport
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

- `upload` і `dialog` — це виклики **попереднього озброєння**; запускайте їх перед click/press, який активує chooser/dialog.
- `click`/`type`/тощо потребують `ref` із `snapshot` (числовий `12`, role ref `e12` або дієвий ARIA ref `ax12`). CSS selectors навмисно не підтримуються для дій. Використовуйте `click-coords`, коли єдиною надійною ціллю є видима позиція у viewport.
- Шляхи download, trace і upload обмежені тимчасовими кореневими каталогами OpenClaw: `/tmp/openclaw{,/downloads,/uploads}` (fallback: `${os.tmpdir()}/openclaw/...`).
- `upload` також може напряму задавати file input через `--input-ref` або `--element`.

Стабільні id вкладок і мітки переживають заміну raw target у Chromium, коли OpenClaw
може довести, що вкладку замінено, наприклад однакова URL-адреса або одна стара вкладка стає
однією новою після надсилання форми. Raw target id все одно нестабільні; у сценаріях
віддавайте перевагу `suggestedTargetId` з `tabs`.

Коротко про прапорці snapshot:

- `--format ai` (типово з Playwright): AI snapshot із числовими ref-ами (`aria-ref="<n>"`).
- `--format aria`: дерево спеціальних можливостей із ref-ами `axN`. Коли Playwright доступний, OpenClaw прив’язує ref-и через backend DOM id до живої сторінки, щоб наступні дії могли їх використовувати; інакше сприймайте вивід лише як інспекційний.
- `--efficient` (або `--mode efficient`): компактний preset role snapshot. Установіть `browser.snapshotDefaults.mode: "efficient"`, щоб зробити це типовим (див. [Конфігурація Gateway](/uk/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` примусово використовують role snapshot із ref-ами `ref=e12`. `--frame "<iframe>"` обмежує role snapshot-и конкретним iframe.
- `--labels` додає screenshot лише viewport із накладеними мітками ref (виводить `MEDIA:<path>`).
- `--urls` додає виявлені адреси посилань до AI snapshot-ів.

## Snapshot-и та ref-и

OpenClaw підтримує два стилі “snapshot”:

- **AI snapshot (числові ref-и)**: `openclaw browser snapshot` (типово; `--format ai`)
  - Вивід: текстовий snapshot, який містить числові ref-и.
  - Дії: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Внутрішньо ref визначається через `aria-ref` у Playwright.

- **Role snapshot (role ref-и на кшталт `e12`)**: `openclaw browser snapshot --interactive` (або `--compact`, `--depth`, `--selector`, `--frame`)
  - Вивід: список/дерево на основі role з `[ref=e12]` (і необов’язково `[nth=1]`).
  - Дії: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Внутрішньо ref визначається через `getByRole(...)` (плюс `nth()` для дублікатів).
  - Додайте `--labels`, щоб включити screenshot viewport із накладеними мітками `e12`.
  - Додайте `--urls`, коли текст посилання неоднозначний і агенту потрібні конкретні
    цілі навігації.

- **ARIA snapshot (ARIA ref-и на кшталт `ax12`)**: `openclaw browser snapshot --format aria`
  - Вивід: дерево спеціальних можливостей як структуровані вузли.
  - Дії: `openclaw browser click ax12` працює, коли шлях snapshot може прив’язати
    ref через Playwright і Chrome backend DOM id.
- Якщо Playwright недоступний, ARIA snapshot-и все одно можуть бути корисними для
  інспекції, але ref-и можуть бути непридатними для дій. Зробіть новий snapshot із `--format ai`
  або `--interactive`, коли вам потрібні ref-и для дій.
- Docker-підтвердження для шляху fallback raw-CDP: `pnpm test:docker:browser-cdp-snapshot`
  запускає Chromium з CDP, виконує `browser doctor --deep` і перевіряє, що role
  snapshot-и містять URL посилань, елементи для click, підвищені курсором, і метадані iframe.

Поведінка ref-ів:

- Ref-и **не є стабільними між навігаціями**; якщо щось не спрацювало, знову виконайте `snapshot` і використайте свіжий ref.
- `/act` повертає поточний raw `targetId` після заміни, спричиненої дією,
  коли може довести, що вкладку було замінено. Для наступних команд і далі
  використовуйте стабільні id/мітки вкладок.
- Якщо role snapshot було зроблено з `--frame`, role ref-и обмежуються цим iframe до наступного role snapshot.
- Невідомі або застарілі ref-и `axN` завершуються помилкою відразу, замість
  переходу до selector `aria-ref` у Playwright. Коли таке стається, виконайте
  новий snapshot на тій самій вкладці.

## Розширені можливості wait

Можна чекати не лише час/текст:

- Очікування URL (підтримуються glob-шаблони Playwright):
  - `openclaw browser wait --url "**/dash"`
- Очікування стану завантаження:
  - `openclaw browser wait --load networkidle`
- Очікування предиката JS:
  - `openclaw browser wait --fn "window.ready===true"`
- Очікування, поки selector стане видимим:
  - `openclaw browser wait "#main"`

Їх можна поєднувати:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Сценарії налагодження

Коли дія завершується помилкою (наприклад, “not visible”, “strict mode violation”, “covered”):

1. `openclaw browser snapshot --interactive`
2. Використайте `click <ref>` / `type <ref>` (в interactive mode віддавайте перевагу role ref-ам)
3. Якщо все одно не спрацьовує: `openclaw browser highlight <ref>`, щоб побачити, на що саме націлюється Playwright
4. Якщо сторінка поводиться дивно:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Для глибокого налагодження: запишіть trace:
   - `openclaw browser trace start`
   - відтворіть проблему
   - `openclaw browser trace stop` (виведе `TRACE:<path>`)

## Вивід JSON

`--json` призначений для сценаріїв і структурованих інструментів.

Приклади:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Role snapshot-и у форматі JSON містять `refs` і невеликий блок `stats` (lines/chars/refs/interactive), щоб інструменти могли оцінювати розмір і щільність payload.

## Параметри стану й середовища

Вони корисні для сценаріїв на кшталт «змусити сайт поводитися як X»:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'` (застарілий `set headers --json '{"X-Debug":"1"}'` і далі підтримується)
- HTTP Basic auth: `set credentials user pass` (або `--clear`)
- Geolocation: `set geo <lat> <lon> --origin "https://example.com"` (або `--clear`)
- Media: `set media dark|light|no-preference|none`
- Timezone / locale: `set timezone ...`, `set locale ...`
- Device / viewport:
  - `set device "iPhone 14"` (preset-и пристроїв Playwright)
  - `set viewport 1280 720`

## Безпека і приватність

- Профіль браузера openclaw може містити сесії з виконаним входом; вважайте його чутливим.
- `browser act kind=evaluate` / `openclaw browser evaluate` і `wait --fn`
  виконують довільний JavaScript у контексті сторінки. Prompt injection може
  спрямовувати це. Вимкніть через `browser.evaluateEnabled=false`, якщо вам це не потрібно.
- Для входів і приміток про anti-bot (X/Twitter тощо) див. [Browser login + публікація в X/Twitter](/uk/tools/browser-login).
- Тримайте хост Gateway/node приватним (лише loopback або тільки tailnet).
- Remote CDP endpoints мають широкі можливості; використовуйте тунелювання і захищайте їх.

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
- [Усунення несправностей Browser у Linux](/uk/tools/browser-linux-troubleshooting)
- [Усунення несправностей Browser у WSL2](/uk/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
