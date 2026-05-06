---
read_when:
    - Скриптування або налагодження браузера агента через локальний API керування
    - Шукаєте довідник CLI для `openclaw browser`
    - Додавання власної автоматизації браузера зі знімками та посиланнями
summary: API керування браузером OpenClaw, довідник CLI та дії для сценаріїв
title: API керування браузером
x-i18n:
    generated_at: "2026-05-06T03:31:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5367561122448fa21037c9125581eb38b7f01413310e9f9ca5880942acfffa5d
    source_path: tools/browser-control.md
    workflow: 16
---

Для налаштування, конфігурації та усунення несправностей див. [Browser](/uk/tools/browser).
Ця сторінка є довідником для локального керівного HTTP API, CLI `openclaw browser`
та шаблонів скриптингу (знімки, refs, очікування, налагоджувальні потоки).

## Керівний API (необов’язково)

Лише для локальних інтеграцій Gateway надає невеликий loopback HTTP API:

- Стан/запуск/зупинка: `GET /`, `POST /start`, `POST /stop`
- Вкладки: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Знімок/скриншот: `GET /snapshot`, `POST /screenshot`
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

Усі кінцеві точки приймають `?profile=<name>`. `POST /start?headless=true` запитує
одноразовий headless-запуск для локально керованих профілів без зміни збереженої
конфігурації браузера; профілі attach-only, віддалені CDP та existing-session відхиляють
це перевизначення, оскільки OpenClaw не запускає ці процеси браузера.

Якщо налаштована автентифікація Gateway зі спільним секретом, HTTP-маршрути браузера також потребують автентифікації:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` або HTTP Basic auth із цим паролем

Примітки:

- Цей автономний loopback API браузера **не** використовує заголовки ідентичності trusted-proxy або
  Tailscale Serve.
- Якщо `gateway.auth.mode` має значення `none` або `trusted-proxy`, ці loopback-маршрути браузера
  не успадковують ці режими з ідентичністю; тримайте їх лише loopback-only.

### Контракт помилок `/act`

`POST /act` використовує структуровану відповідь про помилку для валідації на рівні маршруту та
збоїв політик:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Поточні значення `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` відсутній або не розпізнаний.
- `ACT_INVALID_REQUEST` (HTTP 400): payload дії не пройшов нормалізацію або валідацію.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` використано з непідтримуваним типом дії.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (або `wait --fn`) вимкнено конфігурацією.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): верхньорівневий або пакетний `targetId` конфліктує з ціллю запиту.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): дія не підтримується для профілів existing-session.

Інші збої під час виконання все ще можуть повертати `{ "error": "<message>" }` без поля
`code`.

### Вимога Playwright

Деякі функції (navigate/act/AI snapshot/role snapshot, скриншоти елементів,
PDF) потребують Playwright. Якщо Playwright не встановлено, ці кінцеві точки повертають
зрозумілу помилку 501.

Що все ще працює без Playwright:

- ARIA-знімки
- Role-style знімки доступності (`--interactive`, `--compact`,
  `--depth`, `--efficient`), коли доступний CDP WebSocket для кожної вкладки. Це
  fallback для інспекції та виявлення refs; Playwright залишається основним
  рушієм дій.
- Скриншоти сторінки для керованого браузера `openclaw`, коли доступний CDP
  WebSocket для кожної вкладки
- Скриншоти сторінки для профілів `existing-session` / Chrome MCP
- Скриншоти на основі refs для `existing-session` (`--ref`) з виводу snapshot

Що все ще потребує Playwright:

- `navigate`
- `act`
- AI-знімки, які залежать від нативного формату AI snapshot Playwright
- Скриншоти елементів за CSS-селектором (`--element`)
- повний експорт браузера в PDF

Скриншоти елементів також відхиляють `--full-page`; маршрут повертає `fullPage is
not supported for element screenshots`.

Якщо ви бачите `Playwright is not available in this gateway build`, у запакованому
Gateway бракує основної залежності runtime браузера. Перевстановіть або оновіть
OpenClaw, потім перезапустіть gateway. Для Docker також встановіть бінарні файли
браузера Chromium, як показано нижче.

#### Встановлення Docker Playwright

Якщо ваш Gateway працює в Docker, уникайте `npx playwright` (конфлікти npm override).
Натомість використовуйте вбудований CLI:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Щоб зберігати завантаження браузера, задайте `PLAYWRIGHT_BROWSERS_PATH` (наприклад,
`/home/node/.cache/ms-playwright`) і переконайтеся, що `/home/node` зберігається через
`OPENCLAW_HOME_VOLUME` або bind mount. Див. [Docker](/uk/install/docker).

## Як це працює (внутрішньо)

Невеликий loopback-керівний сервер приймає HTTP-запити та підключається до браузерів на базі Chromium через CDP. Розширені дії (click/type/snapshot/PDF) проходять через Playwright поверх CDP; коли Playwright відсутній, доступні лише операції без Playwright. Агент бачить один стабільний інтерфейс, тоді як локальні/віддалені браузери та профілі вільно замінюються під ним.

## Короткий довідник CLI

Усі команди приймають `--browser-profile <name>` для вибору конкретного профілю та `--json` для машинозчитуваного виводу.

<AccordionGroup>

<Accordion title="Basics: status, tabs, open/focus/close">

```bash
openclaw browser status
openclaw browser start
openclaw browser start --headless # one-shot local managed headless launch
openclaw browser stop            # also clears emulation on attach-only/remote CDP
openclaw browser tabs
openclaw browser tab             # shortcut for current tab
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="Inspection: screenshot, snapshot, console, errors, requests">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # or --ref e12
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

<Accordion title="Actions: navigate, click, type, drag, wait, evaluate">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # or e12 for role refs
openclaw browser click-coords 120 340        # viewport coordinates
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

<Accordion title="State: cookies, storage, offline, headers, geo, device">

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url "https://example.com"
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set theme dark
openclaw browser storage session clear
openclaw browser set offline on
openclaw browser set headers --headers-json '{"X-Debug":"1"}'
openclaw browser set credentials user pass            # --clear to remove
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

Примітки:

- `upload` і `dialog` є викликами **підготовки**; запускайте їх перед click/press, який викликає chooser/dialog.
- `click`/`type`/тощо потребують `ref` зі `snapshot` (числовий `12`, role ref `e12` або actionable ARIA ref `ax12`). CSS-селектори навмисно не підтримуються для дій. Використовуйте `click-coords`, коли видима позиція у viewport є єдиною надійною ціллю.
- Шляхи download, trace та upload обмежені тимчасовими коренями OpenClaw: `/tmp/openclaw{,/downloads,/uploads}` (fallback: `${os.tmpdir()}/openclaw/...`).
- `upload` також може напряму задавати файлові input через `--input-ref` або `--element`.

Стабільні ids вкладок і labels переживають заміну Chromium raw-target, коли OpenClaw
може довести вкладку-заміну, наприклад той самий URL або одна стара вкладка стає
однією новою вкладкою після надсилання форми. Raw target ids все ще нестабільні; у скриптах надавайте перевагу
`suggestedTargetId` з `tabs`.

Прапорці snapshot коротко:

- `--format ai` (типово з Playwright): AI snapshot із числовими refs (`aria-ref="<n>"`).
- `--format aria`: дерево доступності з refs `axN`. Коли Playwright доступний, OpenClaw прив’язує refs з backend DOM ids до живої сторінки, щоб подальші дії могли їх використовувати; інакше розглядайте вивід лише як інспекційний.
- `--efficient` (або `--mode efficient`): компактний preset role snapshot. Задайте `browser.snapshotDefaults.mode: "efficient"`, щоб зробити це типовим (див. [конфігурацію Gateway](/uk/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` примусово створюють role snapshot із refs `ref=e12`. `--frame "<iframe>"` обмежує role snapshots iframe.
- `--labels` додає скриншот лише viewport із накладеними labels refs (друкує `MEDIA:<path>`).
- `--urls` додає виявлені цільові адреси посилань до AI snapshots.

## Snapshots і refs

OpenClaw підтримує два стилі "snapshot":

- **AI snapshot (числові refs)**: `openclaw browser snapshot` (типово; `--format ai`)
  - Вивід: текстовий snapshot, що містить числові refs.
  - Дії: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Внутрішньо ref розв’язується через `aria-ref` Playwright.

- **Role snapshot (role refs на кшталт `e12`)**: `openclaw browser snapshot --interactive` (або `--compact`, `--depth`, `--selector`, `--frame`)
  - Вивід: role-based список/дерево з `[ref=e12]` (і необов’язковим `[nth=1]`).
  - Дії: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Внутрішньо ref розв’язується через `getByRole(...)` (плюс `nth()` для дублікатів).
  - Додайте `--labels`, щоб включити скриншот viewport із накладеними labels `e12`.
  - Додайте `--urls`, коли текст посилання неоднозначний і агенту потрібні конкретні
    цілі навігації.

- **ARIA snapshot (ARIA refs на кшталт `ax12`)**: `openclaw browser snapshot --format aria`
  - Вивід: дерево доступності як структуровані вузли.
  - Дії: `openclaw browser click ax12` працює, коли шлях snapshot може прив’язати
    ref через Playwright і Chrome backend DOM ids.
- Якщо Playwright недоступний, ARIA snapshots все ще можуть бути корисними для
  інспекції, але refs можуть бути непридатними для дій. Повторно зробіть snapshot з `--format ai`
  або `--interactive`, коли вам потрібні refs для дій.
- Docker-доказ для fallback-шляху raw-CDP: `pnpm test:docker:browser-cdp-snapshot`
  запускає Chromium із CDP, виконує `browser doctor --deep` і перевіряє, що role
  snapshots містять URL посилань, clickables, підвищені курсором, та metadata iframe.

Поведінка refs:

- Refs **не стабільні між навігаціями**; якщо щось не вдається, повторно виконайте `snapshot` і використайте свіжий ref.
- `/act` повертає поточний необроблений `targetId` після заміни, спричиненої дією,
  коли може довести вкладку-заміну. Продовжуйте використовувати стабільні ідентифікатори/мітки вкладок для
  подальших команд.
- Якщо рольовий snapshot було зроблено з `--frame`, рольові refs обмежені цим iframe до наступного рольового snapshot.
- Невідомі або застарілі refs `axN` швидко завершуються помилкою замість переходу до
  селектора Playwright `aria-ref`. Коли це трапляється, виконайте свіжий snapshot на тій самій вкладці.

## Посилені можливості очікування

Можна очікувати не лише на час/текст:

- Очікування URL (globs підтримуються Playwright):
  - `openclaw browser wait --url "**/dash"`
- Очікування стану завантаження:
  - `openclaw browser wait --load networkidle`
- Очікування JS-предиката:
  - `openclaw browser wait --fn "window.ready===true"`
- Очікування, доки селектор стане видимим:
  - `openclaw browser wait "#main"`

Їх можна комбінувати:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Робочі процеси налагодження

Коли дія не вдається (наприклад, "not visible", "strict mode violation", "covered"):

1. `openclaw browser snapshot --interactive`
2. Використайте `click <ref>` / `type <ref>` (у інтерактивному режимі віддавайте перевагу рольовим refs)
3. Якщо все ще не вдається: `openclaw browser highlight <ref>`, щоб побачити, на що націлюється Playwright
4. Якщо сторінка поводиться дивно:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Для глибокого налагодження: запишіть trace:
   - `openclaw browser trace start`
   - відтворіть проблему
   - `openclaw browser trace stop` (виводить `TRACE:<path>`)

## Виведення JSON

`--json` призначено для скриптів і структурованих інструментів.

Приклади:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Рольові snapshots у JSON містять `refs` і невеликий блок `stats` (lines/chars/refs/interactive), щоб інструменти могли оцінювати розмір і щільність payload.

## Стан і параметри середовища

Вони корисні для робочих процесів "змусити сайт поводитися як X":

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Сховище: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Заголовки: `set headers --headers-json '{"X-Debug":"1"}'` (застаріле `set headers --json '{"X-Debug":"1"}'` і далі підтримується)
- Базова HTTP-автентифікація: `set credentials user pass` (або `--clear`)
- Геолокація: `set geo <lat> <lon> --origin "https://example.com"` (або `--clear`)
- Медіа: `set media dark|light|no-preference|none`
- Часовий пояс / локаль: `set timezone ...`, `set locale ...`
- Пристрій / viewport:
  - `set device "iPhone 14"` (пресети пристроїв Playwright)
  - `set viewport 1280 720`

## Безпека та приватність

- Профіль браузера openclaw може містити активні сеанси входу; ставтеся до нього як до конфіденційного.
- `browser act kind=evaluate` / `openclaw browser evaluate` і `wait --fn`
  виконують довільний JavaScript у контексті сторінки. Prompt injection може спрямовувати
  це. Вимкніть це за допомогою `browser.evaluateEnabled=false`, якщо воно вам не потрібне.
- Примітки щодо входів і антибот-захисту (X/Twitter тощо) дивіться в [Вхід у браузері + публікація в X/Twitter](/uk/tools/browser-login).
- Тримайте хост Gateway/Node приватним (loopback або лише tailnet).
- Віддалені кінцеві точки CDP мають широкі можливості; тунелюйте та захищайте їх.

Приклад строгого режиму (за замовчуванням блокує приватні/внутрішні призначення):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // optional exact allow
    },
  },
}
```

## Пов’язане

- [Браузер](/uk/tools/browser) - огляд, конфігурація, профілі, безпека
- [Вхід у браузері](/uk/tools/browser-login) - вхід на сайти
- [Усунення несправностей браузера в Linux](/uk/tools/browser-linux-troubleshooting)
- [Усунення несправностей браузера WSL2](/uk/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
