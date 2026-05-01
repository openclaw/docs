---
read_when:
    - Скриптування або налагодження браузера агента через локальний API керування
    - Шукаєте довідник CLI `openclaw browser`
    - Додавання користувацької автоматизації браузера зі знімками та посиланнями
summary: API керування браузером OpenClaw, довідник CLI та скриптові дії
title: API керування браузером
x-i18n:
    generated_at: "2026-05-01T20:42:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef996319c09bfa8de9b5c3a340c68496ac3698295b62f4f07c79f3e233eda2a2
    source_path: tools/browser-control.md
    workflow: 16
---

Для налаштування, конфігурації та усунення несправностей див. [Браузер](/uk/tools/browser).
Ця сторінка є довідником для локального керівного HTTP API, CLI `openclaw browser`
і сценарних шаблонів (знімки, refs, очікування, потоки налагодження).

## Керівний API (необов’язково)

Лише для локальних інтеграцій Gateway надає невеликий loopback HTTP API:

- Статус/запуск/зупинка: `GET /`, `POST /start`, `POST /stop`
- Вкладки: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Знімок/знімок екрана: `GET /snapshot`, `POST /screenshot`
- Дії: `POST /navigate`, `POST /act`
- Перехоплювачі: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Завантаження: `POST /download`, `POST /wait/download`
- Дозволи: `POST /permissions/grant`
- Налагодження: `GET /console`, `POST /pdf`
- Налагодження: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Мережа: `POST /response/body`
- Стан: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Стан: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Налаштування: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Усі кінцеві точки приймають `?profile=<name>`. `POST /start?headless=true` запитує
одноразовий headless-запуск для локальних керованих профілів без зміни збереженої
конфігурації браузера; профілі attach-only, remote CDP та existing-session
відхиляють це перевизначення, тому що OpenClaw не запускає ці процеси браузера.

Якщо налаштовано автентифікацію Gateway зі спільним секретом, HTTP-маршрути браузера також потребують автентифікації:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` або HTTP Basic auth із цим паролем

Примітки:

- Цей окремий loopback API браузера **не** споживає trusted-proxy або
  заголовки ідентичності Tailscale Serve.
- Якщо `gateway.auth.mode` має значення `none` або `trusted-proxy`, ці loopback-маршрути браузера
  не успадковують ці режими з ідентичністю; тримайте їх лише loopback-only.

### Контракт помилок `/act`

`POST /act` використовує структуровану відповідь про помилку для перевірки на рівні маршруту та
збоїв політики:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Поточні значення `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` відсутній або не розпізнаний.
- `ACT_INVALID_REQUEST` (HTTP 400): корисне навантаження дії не пройшло нормалізацію або перевірку.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` використано з непідтримуваним типом дії.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (або `wait --fn`) вимкнено конфігурацією.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): верхньорівневий або пакетний `targetId` конфліктує з ціллю запиту.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): дія не підтримується для профілів existing-session.

Інші збої під час виконання все ще можуть повертати `{ "error": "<message>" }` без
поля `code`.

### Вимога Playwright

Деякі функції (navigate/act/AI snapshot/role snapshot, знімки елементів екрана,
PDF) потребують Playwright. Якщо Playwright не встановлено, ці кінцеві точки повертають
зрозумілу помилку 501.

Що все ще працює без Playwright:

- ARIA-знімки
- Знімки доступності у стилі ролей (`--interactive`, `--compact`,
  `--depth`, `--efficient`), коли доступний CDP WebSocket для вкладки. Це
  резервний варіант для інспекції та виявлення refs; Playwright залишається основним
  рушієм дій.
- Знімки екрана сторінки для керованого браузера `openclaw`, коли доступний CDP
  WebSocket для вкладки
- Знімки екрана сторінки для профілів `existing-session` / Chrome MCP
- Знімки екрана на основі refs для `existing-session` (`--ref`) з виводу знімка

Що все ще потребує Playwright:

- `navigate`
- `act`
- AI-знімки, що залежать від нативного формату AI-знімків Playwright
- Знімки елементів екрана за CSS-селектором (`--element`)
- повний експорт браузера в PDF

Знімки елементів екрана також відхиляють `--full-page`; маршрут повертає `fullPage is
not supported for element screenshots`.

Якщо ви бачите `Playwright is not available in this gateway build`, у запакованому
Gateway бракує основної браузерної runtime-залежності. Перевстановіть або оновіть
OpenClaw, потім перезапустіть gateway. Для Docker також установіть браузерні
бінарні файли Chromium, як показано нижче.

#### Установлення Playwright у Docker

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

Невеликий loopback керівний сервер приймає HTTP-запити та підключається до браузерів на основі Chromium через CDP. Розширені дії (click/type/snapshot/PDF) проходять через Playwright поверх CDP; коли Playwright відсутній, доступні лише операції без Playwright. Агент бачить один стабільний інтерфейс, тоді як локальні/віддалені браузери та профілі вільно змінюються під ним.

## Короткий довідник CLI

Усі команди приймають `--browser-profile <name>` для націлювання на конкретний профіль і `--json` для машинозчитуваного виводу.

<AccordionGroup>

<Accordion title="Основи: статус, вкладки, відкрити/сфокусувати/закрити">

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

<Accordion title="Інспекція: знімок екрана, знімок, консоль, помилки, запити">

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

<Accordion title="Дії: навігація, клацання, введення, перетягування, очікування, обчислення">

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

<Accordion title="Стан: cookies, сховище, офлайн, заголовки, геолокація, пристрій">

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

- `upload` і `dialog` — це виклики **підготовки**; запускайте їх перед click/press, що запускає chooser/dialog.
- `click`/`type`/тощо потребують `ref` зі `snapshot` (числовий `12`, role ref `e12` або actionable ARIA ref `ax12`). CSS-селектори навмисно не підтримуються для дій. Використовуйте `click-coords`, коли видима позиція у viewport є єдиною надійною ціллю.
- Шляхи download, trace і upload обмежені тимчасовими коренями OpenClaw: `/tmp/openclaw{,/downloads,/uploads}` (резервно: `${os.tmpdir()}/openclaw/...`).
- `upload` також може задавати файлові inputs напряму через `--input-ref` або `--element`.

Стабільні ідентифікатори вкладок і мітки переживають заміну сирої цілі Chromium, коли OpenClaw
може довести вкладку-заміну, наприклад той самий URL або одна стара вкладка, що стала
однією новою вкладкою після надсилання форми. Сирі target ids усе ще мінливі; у сценаріях віддавайте перевагу
`suggestedTargetId` з `tabs`.

Коротко про прапорці знімків:

- `--format ai` (типово з Playwright): AI-знімок із числовими refs (`aria-ref="<n>"`).
- `--format aria`: дерево доступності з refs `axN`. Коли Playwright доступний, OpenClaw прив’язує refs із backend DOM ids до живої сторінки, щоб подальші дії могли їх використовувати; інакше розглядайте вивід лише як інспекційний.
- `--efficient` (або `--mode efficient`): компактний пресет role snapshot. Задайте `browser.snapshotDefaults.mode: "efficient"`, щоб зробити його типовим (див. [Конфігурація Gateway](/uk/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` примусово використовують role snapshot з refs `ref=e12`. `--frame "<iframe>"` обмежує role snapshots iframe.
- `--labels` додає знімок екрана лише viewport з накладеними мітками refs (друкує `MEDIA:<path>`).
- `--urls` додає виявлені призначення посилань до AI-знімків.

## Знімки та refs

OpenClaw підтримує два стилі “snapshot”:

- **AI snapshot (numeric refs)**: `openclaw browser snapshot` (типово; `--format ai`)
  - Вивід: текстовий знімок, що містить числові refs.
  - Дії: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Внутрішньо ref вирішується через `aria-ref` Playwright.

- **Role snapshot (role refs на кшталт `e12`)**: `openclaw browser snapshot --interactive` (або `--compact`, `--depth`, `--selector`, `--frame`)
  - Вивід: список/дерево на основі ролей з `[ref=e12]` (і необов’язковим `[nth=1]`).
  - Дії: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Внутрішньо ref вирішується через `getByRole(...)` (плюс `nth()` для дублікатів).
  - Додайте `--labels`, щоб включити знімок екрана viewport з накладеними мітками `e12`.
  - Додайте `--urls`, коли текст посилання неоднозначний і агенту потрібні конкретні
    цілі навігації.

- **ARIA snapshot (ARIA refs на кшталт `ax12`)**: `openclaw browser snapshot --format aria`
  - Вивід: дерево доступності як структуровані вузли.
  - Дії: `openclaw browser click ax12` працює, коли шлях знімка може прив’язати
    ref через Playwright і Chrome backend DOM ids.
- Якщо Playwright недоступний, ARIA-знімки все ще можуть бути корисними для
  інспекції, але refs можуть бути недієвими. Зробіть повторний знімок із `--format ai`
  або `--interactive`, коли потрібні refs для дій.
- Docker-доказ для fallback-шляху raw-CDP: `pnpm test:docker:browser-cdp-snapshot`
  запускає Chromium з CDP, виконує `browser doctor --deep` і перевіряє, що role
  snapshots містять URL посилань, cursor-promoted clickables і метадані iframe.

Поведінка refs:

- Refs **не є стабільними між навігаціями**; якщо щось не вдається, повторно запустіть `snapshot` і використайте свіжий ref.
- `/act` повертає поточний сирий `targetId` після заміни, спричиненої дією,
  коли може підтвердити вкладку-заміну. Продовжуйте використовувати стабільні id/мітки вкладок для
  наступних команд.
- Якщо знімок ролей було зроблено з `--frame`, рольові refs обмежені цим iframe до наступного знімка ролей.
- Невідомі або застарілі refs `axN` швидко завершуються помилкою замість переходу до
  селектора Playwright `aria-ref`. Коли це трапляється, запустіть свіжий знімок на тій самій вкладці.

## Посилені можливості очікування

Можна очікувати не лише час/текст:

- Очікувати URL (глоби підтримуються Playwright):
  - `openclaw browser wait --url "**/dash"`
- Очікувати стан завантаження:
  - `openclaw browser wait --load networkidle`
- Очікувати JS-предикат:
  - `openclaw browser wait --fn "window.ready===true"`
- Очікувати, доки селектор стане видимим:
  - `openclaw browser wait "#main"`

Це можна поєднувати:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Робочі процеси налагодження

Коли дія завершується помилкою (наприклад, «not visible», «strict mode violation», «covered»):

1. `openclaw browser snapshot --interactive`
2. Використайте `click <ref>` / `type <ref>` (надавайте перевагу рольовим refs в інтерактивному режимі)
3. Якщо помилка залишається: `openclaw browser highlight <ref>`, щоб побачити, на що націлюється Playwright
4. Якщо сторінка поводиться дивно:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Для глибокого налагодження: запишіть трасу:
   - `openclaw browser trace start`
   - відтворіть проблему
   - `openclaw browser trace stop` (друкує `TRACE:<path>`)

## Вивід JSON

`--json` призначено для скриптів і структурованих інструментів.

Приклади:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Знімки ролей у JSON містять `refs` і невеликий блок `stats` (lines/chars/refs/interactive), щоб інструменти могли оцінювати розмір і щільність payload.

## Налаштування стану та середовища

Це корисно для робочих процесів «змусити сайт поводитися як X»:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'` (застарілий `set headers --json '{"X-Debug":"1"}'` досі підтримується)
- HTTP basic auth: `set credentials user pass` (або `--clear`)
- Geolocation: `set geo <lat> <lon> --origin "https://example.com"` (або `--clear`)
- Media: `set media dark|light|no-preference|none`
- Timezone / locale: `set timezone ...`, `set locale ...`
- Device / viewport:
  - `set device "iPhone 14"` (пресети пристроїв Playwright)
  - `set viewport 1280 720`

## Безпека та приватність

- Профіль браузера openclaw може містити сеанси з виконаним входом; поводьтеся з ним як із чутливими даними.
- `browser act kind=evaluate` / `openclaw browser evaluate` і `wait --fn`
  виконують довільний JavaScript у контексті сторінки. Prompt injection може спрямовувати
  це. Вимкніть це за допомогою `browser.evaluateEnabled=false`, якщо воно вам не потрібне.
- Примітки щодо входів і захисту від ботів (X/Twitter тощо) див. у [Вхід у браузері + публікація в X/Twitter](/uk/tools/browser-login).
- Тримайте хост Gateway/вузла приватним (loopback або лише tailnet).
- Віддалені кінцеві точки CDP мають широкі можливості; тунелюйте й захищайте їх.

Приклад strict-mode (за замовчуванням блокує приватні/внутрішні призначення):

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

- [Браузер](/uk/tools/browser) — огляд, конфігурація, профілі, безпека
- [Вхід у браузері](/uk/tools/browser-login) — вхід на сайти
- [Усунення неполадок браузера в Linux](/uk/tools/browser-linux-troubleshooting)
- [Усунення неполадок браузера WSL2](/uk/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
