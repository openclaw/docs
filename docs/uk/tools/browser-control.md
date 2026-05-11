---
read_when:
    - Скриптування або налагодження браузера агента через локальний API керування
    - Шукаєте довідник CLI `openclaw browser`
    - Додавання власної браузерної автоматизації зі знімками та посиланнями
summary: API керування браузером OpenClaw, довідник CLI та дії сценаріїв
title: API керування браузером
x-i18n:
    generated_at: "2026-05-11T20:59:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 317ac82cb9060ae1f9495a992dcbb25356ef23b98a5802cf0ed65d1720c2a57d
    source_path: tools/browser-control.md
    workflow: 16
---

Для налаштування, конфігурації та усунення несправностей див. [Браузер](/uk/tools/browser).
Ця сторінка є довідником для локального керівного HTTP API, CLI `openclaw browser`
і шаблонів сценаріїв (знімки, посилання, очікування, потоки налагодження).

## Керівний API (необов'язково)

Лише для локальних інтеграцій Gateway надає невеликий HTTP API зворотної петлі:

- Стан/запуск/зупинка: `GET /`, `POST /start`, `POST /stop`
- Вкладки: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Знімок/знімок екрана: `GET /snapshot`, `POST /screenshot`
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
одноразовий headless-запуск для локальних керованих профілів без зміни збереженої
конфігурації браузера; профілі attach-only, віддаленого CDP і наявних сеансів відхиляють
це перевизначення, бо OpenClaw не запускає ці процеси браузера.

Якщо налаштовано автентифікацію Gateway зі спільним секретом, HTTP-маршрути браузера також потребують автентифікації:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` або HTTP Basic auth із цим паролем

Примітки:

- Цей автономний API браузера зворотної петлі **не** споживає заголовки ідентичності довіреного проксі або
  Tailscale Serve.
- Якщо `gateway.auth.mode` має значення `none` або `trusted-proxy`, ці маршрути браузера зворотної петлі
  не успадковують ці режими з ідентичністю; тримайте їх доступними лише через зворотну петлю.

### Контракт помилок `/act`

`POST /act` використовує структуровану відповідь про помилку для валідації на рівні маршруту та
відмов політик:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Поточні значення `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` відсутній або нерозпізнаний.
- `ACT_INVALID_REQUEST` (HTTP 400): корисне навантаження дії не пройшло нормалізацію або валідацію.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` використано з непідтримуваним типом дії.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (або `wait --fn`) вимкнено конфігурацією.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): верхньорівневий або пакетний `targetId` конфліктує з ціллю запиту.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): дія не підтримується для профілів наявних сеансів.

Інші помилки під час виконання все ще можуть повертати `{ "error": "<message>" }` без
поля `code`.

### Вимога Playwright

Деякі функції (навігація/дія/знімок AI/рольовий знімок, знімки елементів екрана,
PDF) потребують Playwright. Якщо Playwright не встановлено, ці кінцеві точки повертають
чітку помилку 501.

Що все ще працює без Playwright:

- Знімки ARIA
- Рольові знімки доступності (`--interactive`, `--compact`,
  `--depth`, `--efficient`), коли доступний CDP WebSocket для вкладки. Це
  резервний варіант для інспекції та виявлення посилань; Playwright залишається основним
  рушієм дій.
- Знімки сторінок екрана для керованого браузера `openclaw`, коли доступний CDP
  WebSocket для вкладки
- Знімки сторінок екрана для профілів `existing-session` / Chrome MCP
- Знімки екрана на основі посилань `existing-session` (`--ref`) з виводу знімка

Що все ще потребує Playwright:

- `navigate`
- `act`
- Знімки AI, які залежать від нативного формату знімків AI у Playwright
- Знімки елементів екрана за CSS-селектором (`--element`)
- повний експорт браузера в PDF

Знімки елементів екрана також відхиляють `--full-page`; маршрут повертає `fullPage is
not supported for element screenshots`.

Якщо бачите `Playwright is not available in this gateway build`, у запакованому
Gateway відсутня основна залежність середовища виконання браузера. Перевстановіть або оновіть
OpenClaw, а потім перезапустіть Gateway. Для Docker також установіть бінарні файли браузера
Chromium, як показано нижче.

#### Встановлення Docker Playwright

Якщо ваш Gateway працює в Docker, уникайте `npx playwright` (конфлікти перевизначень npm).
Для власних образів вбудуйте Chromium в образ:

```bash
OPENCLAW_INSTALL_BROWSER=1 ./scripts/docker/setup.sh
```

Для наявного образу натомість установіть через вбудований CLI:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Щоб зберігати завантаження браузера, задайте `PLAYWRIGHT_BROWSERS_PATH` (наприклад,
`/home/node/.cache/ms-playwright`) і переконайтеся, що `/home/node` зберігається через
`OPENCLAW_HOME_VOLUME` або bind mount. OpenClaw автоматично виявляє збережений
Chromium у Linux. Див. [Docker](/uk/install/docker).

## Як це працює (внутрішньо)

Невеликий керівний сервер зворотної петлі приймає HTTP-запити й підключається до браузерів на основі Chromium через CDP. Розширені дії (клацання/введення/знімок/PDF) проходять через Playwright поверх CDP; коли Playwright відсутній, доступні лише операції без Playwright. Агент бачить один стабільний інтерфейс, тоді як локальні/віддалені браузери й профілі вільно змінюються під ним.

## Короткий довідник CLI

Усі команди приймають `--browser-profile <name>` для вибору конкретного профілю та `--json` для машинозчитуваного виводу.

<AccordionGroup>

<Accordion title="Основи: стан, вкладки, відкрити/фокусувати/закрити">

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

<Accordion title="Стан: cookie, сховище, офлайн, заголовки, геодані, пристрій">

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

- `upload` і `dialog` є викликами **підготовки**; запускайте їх перед клацанням/натисканням, що спричиняє вибір файлу/діалог.
- `click`/`type`/тощо потребують `ref` зі `snapshot` (числовий `12`, рольове посилання `e12` або дієве ARIA-посилання `ax12`). CSS-селектори навмисно не підтримуються для дій. Використовуйте `click-coords`, коли видима позиція у viewport є єдиною надійною ціллю.
- Шляхи завантаження, трасування та вивантаження обмежені тимчасовими коренями OpenClaw: `/tmp/openclaw{,/downloads,/uploads}` (резервний варіант: `${os.tmpdir()}/openclaw/...`).
- `upload` також може напряму задавати файлові поля введення через `--input-ref` або `--element`.

Стабільні ідентифікатори та мітки вкладок переживають заміну необробленої цілі Chromium, коли OpenClaw
може довести вкладку-заміну, наприклад ту саму URL-адресу або перетворення однієї старої вкладки на
одну нову вкладку після надсилання форми. Необроблені ідентифікатори цілей усе ще мінливі; у сценаріях надавайте перевагу
`suggestedTargetId` із `tabs`.

Короткий огляд прапорців знімків:

- `--format ai` (типово з Playwright): знімок AI з числовими посиланнями (`aria-ref="<n>"`).
- `--format aria`: дерево доступності з посиланнями `axN`. Коли Playwright доступний, OpenClaw прив'язує посилання з backend DOM ids до живої сторінки, щоб наступні дії могли їх використовувати; інакше вважайте вивід лише інспекційним.
- `--efficient` (або `--mode efficient`): компактний пресет рольового знімка. Задайте `browser.snapshotDefaults.mode: "efficient"`, щоб зробити це типовим значенням (див. [конфігурацію Gateway](/uk/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` примусово вмикають рольовий знімок із посиланнями `ref=e12`. `--frame "<iframe>"` обмежує рольові знімки iframe.
- `--labels` додає знімок екрана лише viewport з накладеними мітками посилань (друкує `MEDIA:<path>`).
- `--urls` додає виявлені призначення посилань до знімків AI.

## Знімки та посилання

OpenClaw підтримує два стилі "знімків":

- **Знімок AI (числові посилання)**: `openclaw browser snapshot` (типово; `--format ai`)
  - Вивід: текстовий знімок, який містить числові посилання.
  - Дії: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Внутрішньо посилання розв'язується через `aria-ref` Playwright.

- **Рольовий знімок (рольові посилання на кшталт `e12`)**: `openclaw browser snapshot --interactive` (або `--compact`, `--depth`, `--selector`, `--frame`)
  - Вивід: рольовий список/дерево з `[ref=e12]` (і необов'язковим `[nth=1]`).
  - Дії: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Внутрішньо посилання розв'язується через `getByRole(...)` (плюс `nth()` для дублікатів).
  - Додайте `--labels`, щоб включити знімок екрана viewport з накладеними мітками `e12`.
  - Додайте `--urls`, коли текст посилання неоднозначний і агенту потрібні конкретні
    цілі навігації.

- **Знімок ARIA (ARIA-посилання, як-от `ax12`)**: `openclaw browser snapshot --format aria`
  - Вивід: дерево доступності як структуровані вузли.
  - Дії: `openclaw browser click ax12` працює, коли шлях знімка може прив’язати
    посилання через DOM-ідентифікатори бекенду Playwright і Chrome.
- Якщо Playwright недоступний, знімки ARIA все одно можуть бути корисними для
  інспектування, але посилання можуть бути непридатними для дій. Повторно зробіть знімок із `--format ai`
  або `--interactive`, коли потрібні посилання для дій.
- Docker-доказ для резервного шляху raw-CDP: `pnpm test:docker:browser-cdp-snapshot`
  запускає Chromium із CDP, виконує `browser doctor --deep` і перевіряє, що рольові
  знімки містять URL посилань, клікабельні елементи, підвищені курсором, і метадані iframe.

Поведінка посилань:

- Посилання **не стабільні між навігаціями**; якщо щось не спрацьовує, повторно запустіть `snapshot` і використайте свіже посилання.
- `/act` повертає поточний raw `targetId` після заміни, спричиненої дією,
  коли може довести вкладку заміни. Продовжуйте використовувати стабільні ідентифікатори/мітки вкладок для
  наступних команд.
- Якщо рольовий знімок було зроблено з `--frame`, рольові посилання обмежені цим iframe до наступного рольового знімка.
- Невідомі або застарілі посилання `axN` швидко завершуються помилкою замість переходу до
  селектора Playwright `aria-ref`. Коли це трапляється, зробіть свіжий знімок на тій самій вкладці.

## Розширені можливості очікування

Можна чекати не лише на час/текст:

- Очікувати URL (глоби підтримуються Playwright):
  - `openclaw browser wait --url "**/dash"`
- Очікувати стан завантаження:
  - `openclaw browser wait --load networkidle`
- Очікувати JS-предикат:
  - `openclaw browser wait --fn "window.ready===true"`
- Очікувати, доки селектор стане видимим:
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

Коли дія завершується помилкою (наприклад, "not visible", "strict mode violation", "covered"):

1. `openclaw browser snapshot --interactive`
2. Використайте `click <ref>` / `type <ref>` (віддавайте перевагу рольовим посиланням в інтерактивному режимі)
3. Якщо все ще не вдається: `openclaw browser highlight <ref>`, щоб побачити, на що націлюється Playwright
4. Якщо сторінка поводиться дивно:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Для глибокого налагодження: запишіть трасу:
   - `openclaw browser trace start`
   - відтворіть проблему
   - `openclaw browser trace stop` (друкує `TRACE:<path>`)

## JSON-вивід

`--json` призначений для скриптів і структурованих інструментів.

Приклади:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Рольові знімки в JSON містять `refs` плюс невеликий блок `stats` (lines/chars/refs/interactive), щоб інструменти могли оцінювати розмір і щільність payload.

## Параметри стану та середовища

Вони корисні для робочих процесів на кшталт "зробити так, щоб сайт поводився як X":

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Сховище: `storage local|session get|set|clear`
- Офлайн: `set offline on|off`
- Заголовки: `set headers --headers-json '{"X-Debug":"1"}'` (застарілий `set headers --json '{"X-Debug":"1"}'` досі підтримується)
- HTTP basic auth: `set credentials user pass` (або `--clear`)
- Геолокація: `set geo <lat> <lon> --origin "https://example.com"` (або `--clear`)
- Media: `set media dark|light|no-preference|none`
- Часовий пояс / локаль: `set timezone ...`, `set locale ...`
- Пристрій / viewport:
  - `set device "iPhone 14"` (пресети пристроїв Playwright)
  - `set viewport 1280 720`

## Безпека та приватність

- Профіль браузера openclaw може містити активні сеанси входу; ставтеся до нього як до чутливих даних.
- `browser act kind=evaluate` / `openclaw browser evaluate` і `wait --fn`
  виконують довільний JavaScript у контексті сторінки. Prompt injection може керувати
  цим. Вимкніть це за допомогою `browser.evaluateEnabled=false`, якщо воно вам не потрібне.
- Про входи й примітки щодо антибот-захисту (X/Twitter тощо) див. [Вхід у браузері + публікація в X/Twitter](/uk/tools/browser-login).
- Тримайте хост Gateway/node приватним (loopback або лише tailnet).
- Віддалені кінцеві точки CDP потужні; тунелюйте й захищайте їх.

Приклад strict-mode (блокувати приватні/внутрішні призначення за замовчуванням):

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
- [Усунення несправностей браузера в WSL2](/uk/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
