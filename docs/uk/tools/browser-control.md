---
read_when:
    - Створення сценаріїв або налагодження браузера агента через локальний API керування
    - Шукаєте довідник CLI для `openclaw browser`
    - Додавання власної автоматизації браузера зі знімками та посиланнями на елементи
summary: API керування браузером OpenClaw, довідник CLI та дії сценаріїв
title: API керування браузером
x-i18n:
    generated_at: "2026-07-16T18:39:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8063f55c9881e45e65492dc40e2902bf05feb08ae9a74986ba2d7621e0dbe71a
    source_path: tools/browser-control.md
    workflow: 16
---

Для налаштування, конфігурації та усунення несправностей див. [Браузер](/uk/tools/browser).
Ця сторінка містить довідку щодо локального керівного HTTP API, `openclaw browser`
CLI та шаблонів сценаріїв (знімки, посилання, очікування, потоки налагодження).

## Керівний API (необов’язково)

Лише для локальних інтеграцій Gateway надає невеликий HTTP API на інтерфейсі зворотного зв’язку.
Цей автономний сервер вмикається окремо — задайте змінну середовища
`OPENCLAW_EAGER_BROWSER_CONTROL_SERVER=1` у середовищі служби Gateway
і перезапустіть Gateway, перш ніж HTTP-кінцеві точки стануть доступними. Без
цієї змінної середовище керування браузером і далі працює через CLI та
інструменти агента, але порт керування на інтерфейсі зворотного зв’язку не прослуховується.

- Стан/запуск/зупинення: `GET /`, `GET /doctor`, `POST /start`, `POST /stop`, `POST /reset-profile`
- Профілі: `GET /profiles`, `POST /profiles/create`, `DELETE /profiles/:name`
- Вкладки: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`, `POST /tabs/action`
- Знімок/знімок екрана: `GET /snapshot`, `POST /screenshot`
- Дії: `POST /navigate`, `POST /act`
- Обробники: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Завантаження: `POST /download`, `POST /wait/download`
- Дозволи: `POST /permissions/grant`
- Налагодження: `GET /console`, `POST /pdf`
- Налагодження: `GET /errors`, `GET /requests`, `GET /dialogs`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Мережа: `POST /response/body`
- Стан: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Стан: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Налаштування: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

`POST /tabs/action` — це пакетна форма, яку CLI внутрішньо використовує для
підкоманд `browser tab` (`{"action":"new"|"label"|"select"|"close"|"list", ...}`);
для безпосередніх сценаріїв надавайте перевагу наведеним вище спеціалізованим маршрутам вкладок.

Усі кінцеві точки приймають `?profile=<name>`. `POST /start?headless=true` запитує
одноразовий запуск у безголовому режимі для локальних керованих профілів без зміни збереженої
конфігурації браузера; профілі лише для підключення, віддаленого CDP та наявних сеансів
відхиляють це перевизначення, оскільки OpenClaw не запускає ці браузерні процеси.

Для кінцевих точок вкладок `targetId` є назвою поля сумісності. Надавайте перевагу передаванню
`suggestedTargetId` з `GET /tabs` або `POST /tabs/open`; також приймаються мітки й дескриптори `tabId`,
як-от `t1`. Необроблені ідентифікатори цілей CDP та унікальні префікси необроблених
ідентифікаторів цілей також працюють, але це нестабільні діагностичні дескриптори.

Якщо налаштовано автентифікацію Gateway за спільним секретом, HTTP-маршрути браузера також потребують автентифікації:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` або базова HTTP-автентифікація з цим паролем

Примітки:

- Цей автономний браузерний API на інтерфейсі зворотного зв’язку **не** використовує заголовки ідентичності довіреного проксі або
  Tailscale Serve.
- Якщо `gateway.auth.mode` має значення `none` або `trusted-proxy`, ці браузерні маршрути
  на інтерфейсі зворотного зв’язку не успадковують відповідні режими передавання ідентичності; залишайте їх доступними лише через цей інтерфейс.

### Контракт помилок `/act`

`POST /act` використовує структуровану відповідь про помилку для помилок перевірки на рівні маршруту та
порушень політик:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Поточні значення `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` відсутній або не розпізнаний.
- `ACT_INVALID_REQUEST` (HTTP 400): корисне навантаження дії не пройшло нормалізацію або перевірку.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` використано з непідтримуваним типом дії.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (або `wait --fn`) вимкнено конфігурацією.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): верхньорівневий або пакетний `targetId` конфліктує з ціллю запиту.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): дія не підтримується для профілів наявних сеансів.

Інші помилки середовища виконання все ще можуть повертати `{ "error": "<message>" }` без
поля `code`.

### Вимога Playwright

Деякі функції (навігація/дія/знімок ШІ/рольовий знімок, знімки елементів,
PDF) потребують Playwright. Якщо Playwright не встановлено, ці кінцеві точки повертають
зрозумілу помилку 501.

Що й далі працює без Playwright:

- Знімки ARIA
- Знімки доступності в рольовому стилі (`--interactive`, `--compact`,
  `--depth`, `--efficient`), коли доступний WebSocket CDP для окремої вкладки. Це
  резервний варіант для перевірки та пошуку посилань; Playwright залишається основним
  рушієм дій.
- Знімки сторінки для керованого браузера `openclaw`, коли доступний WebSocket CDP
  для окремої вкладки
- Знімки сторінки для профілів `existing-session` / Chrome MCP
- Знімки елементів на основі посилань `existing-session` (`--ref`) із виводу знімка

Що й далі потребує Playwright:

- `navigate`
- `act`
- Знімки ШІ, які залежать від власного формату знімків ШІ Playwright
- Знімки елементів за CSS-селекторами (`--element`)
- повний експорт браузера у PDF

Знімки елементів також відхиляють `--full-page`; маршрут повертає `fullPage is
not supported for element screenshots`.

Якщо з’являється `Playwright is not available in this gateway build`, у пакованому
Gateway відсутня основна залежність середовища виконання браузера. Перевстановіть або оновіть
OpenClaw, а потім перезапустіть Gateway. Для Docker також установіть двійкові файли браузера
Chromium, як показано нижче.

#### Установлення Playwright у Docker

Якщо Gateway працює в Docker, уникайте `npx playwright` (конфлікти перевизначень npm).
Для власних образів додайте Chromium безпосередньо до образу:

```bash
OPENCLAW_INSTALL_BROWSER=1 ./scripts/docker/setup.sh
```

Для наявного образу натомість установіть його через вбудований CLI:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Щоб зберігати завантаження браузера, задайте `PLAYWRIGHT_BROWSERS_PATH` (наприклад,
`/home/node/.cache/ms-playwright`) і переконайтеся, що `/home/node` зберігається через
`OPENCLAW_HOME_VOLUME` або прив’язане монтування. OpenClaw автоматично виявляє збережений
Chromium у Linux. Див. [Docker](/uk/install/docker).

## Як це працює (внутрішня будова)

Невеликий керівний сервер на інтерфейсі зворотного зв’язку приймає HTTP-запити та підключається до браузерів на основі Chromium через CDP. Розширені дії (клацання/введення/знімок/PDF) виконуються через Playwright поверх CDP; якщо Playwright відсутній, доступні лише операції, що не потребують Playwright. Агент бачить один стабільний інтерфейс, тоді як локальні й віддалені браузери та профілі можуть вільно змінюватися під ним.

## Коротка довідка CLI

Усі команди приймають `--browser-profile <name>` для вибору певного профілю та `--json` для машинозчитуваного виводу.

<AccordionGroup>

<Accordion title="Основи: стан, вкладки, відкриття/фокусування/закриття">

```bash
openclaw browser status
openclaw browser doctor
openclaw browser doctor --deep    # додати перевірку за допомогою актуального знімка
openclaw browser start
openclaw browser start --headless # одноразовий запуск локального керованого браузера в безголовому режимі
openclaw browser stop            # також скидає емуляцію для профілів лише для підключення/віддаленого CDP
openclaw browser reset-profile   # переміщує дані браузера профілю до Кошика
openclaw browser tabs
openclaw browser tab             # скорочення для поточної вкладки
openclaw browser tab new
openclaw browser tab new --label research
openclaw browser tab label abcd1234 research
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="Профілі: перегляд, створення, видалення">

```bash
openclaw browser profiles
openclaw browser create-profile --name research --color "#0066CC"
openclaw browser create-profile --name attach --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser delete-profile --name research
```

</Accordion>

<Accordion title="Перевірка: знімок екрана, знімок, консоль, помилки, запити">

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
openclaw browser snapshot --out snapshot.txt
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
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref e12
openclaw browser upload media://inbound/file.pdf
openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
openclaw browser wait --text "Done"
openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"
openclaw browser evaluate --fn '(el) => el.textContent' --ref 7
openclaw browser evaluate --fn 'const title = document.title; return title;'
openclaw browser evaluate --timeout-ms 30000 --fn 'async () => { await window.ready; return true; }'
openclaw browser highlight e12
openclaw browser trace start
openclaw browser trace stop
```

</Accordion>

<Accordion title="Стан: файли cookie, сховище, автономний режим, заголовки, геолокація, пристрій">

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

- Інструмент `browser`, доступний агенту, надає `action=download` (обов’язкові `ref` і
  `path`) та `action=waitfordownload` (необов’язковий `path`). Обидва повертають збережену
  URL-адресу завантаження, запропоноване ім’я файлу та захищений локальний шлях. Явне перехоплення
  завантажень доступне для керованих профілів Playwright; профілі
  наявних сеансів повертають помилку непідтримуваної операції.
- Віддавайте перевагу атомарним завантаженням через засіб вибору файлів: передавайте тригер `--ref` разом із завантаженням, щоб OpenClaw підготував і виконав натискання в одному запиті. `upload` лише зі шляхами залишається підтримуваним, коли наступний тригер викликається навмисно. Використовуйте `--input-ref` або `--element`, щоб безпосередньо задати значення поля введення файлу. `dialog` — це виклик підготовки; виконайте його перед натисканням кнопки або клавіші, що відкриває діалогове вікно. Якщо дія відкриває модальне вікно, відповідь дії містить `blockedByDialog` і `browserState.dialogs.pending`; передайте цей `dialogId`, щоб відповісти безпосередньо. Діалогові вікна, оброблені поза OpenClaw, відображаються в `browserState.dialogs.recent`.
- `click`/`type`/тощо потребують `ref` з `snapshot` (числовий `12`, посилання ролі `e12` або придатне до дії посилання ARIA `ax12`). CSS-селектори навмисно не підтримуються для дій. Використовуйте `click-coords`, коли єдиною надійною ціллю є позиція у видимій області перегляду.
- Шляхи завантажень і трасувань обмежені тимчасовими кореневими каталогами OpenClaw: `/tmp/openclaw{,/downloads}` (резервний варіант: `${os.tmpdir()}/openclaw/...`).
- `upload` приймає файли з кореневого каталогу тимчасових завантажень OpenClaw і
  керованих OpenClaw вхідних медіафайлів. На керовані вхідні медіафайли можна посилатися як
  `media://inbound/<id>`, відносний щодо пісочниці `media/inbound/<id>` або визначений
  шлях у каталозі керованих вхідних медіафайлів. Вкладені посилання на медіафайли,
  обхід каталогів, символічні посилання, жорсткі посилання та довільні локальні шляхи, як і раніше, відхиляються.
- `upload` також може безпосередньо задавати значення полів введення файлів через `--input-ref` або `--element`.

Стабільні ідентифікатори та мітки вкладок зберігаються після заміни необробленої цілі Chromium, коли OpenClaw
може підтвердити вкладку-заміну, наприклад у разі унікальної старої/нової пари для тієї самої URL-адреси або
коли одна стара вкладка стає однією новою вкладкою після надсилання форми. Неоднозначні
заміни з однаковими URL-адресами отримують нові дескриптори. Ідентифікатори необроблених цілей усе ще
нестабільні; у скриптах віддавайте перевагу `suggestedTargetId` з `tabs`.

Короткий огляд прапорців знімків:

- `--format ai` (типово з Playwright): ШІ-знімок із числовими посиланнями (`aria-ref="<n>"`).
- `--format aria`: дерево доступності з посиланнями `axN`. Коли Playwright доступний, OpenClaw прив’язує посилання за допомогою внутрішніх DOM-ідентифікаторів до активної сторінки, щоб наступні дії могли їх використовувати; інакше вважайте результат придатним лише для перевірки.
- `--efficient` (або `--mode efficient`): компактний набір параметрів знімка ролей. Задайте `browser.snapshotDefaults.mode: "efficient"`, щоб зробити його типовим (див. [конфігурацію Gateway](/uk/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` примусово створюють знімок ролей із посиланнями `ref=e12`. `--frame "<iframe>"` обмежує знімки ролей областю iframe.
- З Playwright `--labels` додає знімок екрана з накладеними мітками посилань
  (виводить `MEDIA:<path>`), а також масив `annotations` з обмежувальною
  рамкою кожного посилання. У `screenshot` мітки на основі Playwright працюють з `--full-page`,
  `--ref` і `--element`; у `snapshot` супровідний знімок екрана залишається
  обмеженим областю перегляду. Профілі наявних сеансів/chrome-mcp відображають накладені мітки на
  знімках екрана сторінки, але не повертають `annotations` і не використовують допоміжний засіб Playwright
  для проєкції повної сторінки/посилання/елемента. Без Playwright або chrome-mcp
  знімки екрана з мітками недоступні.
- `--urls` додає знайдені адреси призначення посилань до ШІ-знімків.

## Знімки та посилання

OpenClaw підтримує два стилі «знімків»:

- **ШІ-знімок (числові посилання)**: `openclaw browser snapshot` (типово; `--format ai`)
  - Результат: текстовий знімок, що містить числові посилання.
  - Дії: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Внутрішньо посилання визначається через `aria-ref` Playwright.

- **Знімок ролей (посилання ролей на кшталт `e12`)**: `openclaw browser snapshot --interactive` (або `--compact`, `--depth`, `--selector`, `--frame`)
  - Результат: список/дерево на основі ролей із `[ref=e12]` (і необов’язковим `[nth=1]`).
  - Дії: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Внутрішньо посилання визначається через `getByRole(...)` (а для дублікатів також через `nth()`).
  - Додайте `--labels`, щоб включити знімок екрана з накладеними мітками `e12`. У
    профілях на основі Playwright це також повертає метадані обмежувальної рамки для кожного посилання
    (`annotations[]`).
  - Додайте `--urls`, коли текст посилання неоднозначний і агенту потрібні конкретні
    цілі навігації.

- **Знімок ARIA (посилання ARIA на кшталт `ax12`)**: `openclaw browser snapshot --format aria`
  - Результат: дерево доступності у вигляді структурованих вузлів.
  - Дії: `openclaw browser click ax12` працює, коли шлях створення знімка може прив’язати
    посилання через Playwright і внутрішні DOM-ідентифікатори Chrome.
- Якщо Playwright недоступний, знімки ARIA все одно можуть бути корисними для
  перевірки, але посилання можуть бути непридатними до дій. Повторно створіть знімок за допомогою `--format ai`
  або `--interactive`, коли потрібні посилання для дій.
- Підтвердження Docker для резервного шляху через необроблений CDP: `pnpm test:docker:browser-cdp-snapshot`
  запускає Chromium із CDP, виконує `browser doctor --deep` і перевіряє, що знімки ролей
  містять URL-адреси посилань, елементи, визначені за курсором як доступні для натискання, і метадані iframe.

Поведінка посилань:

- Посилання **нестабільні між переходами**; якщо щось не працює, повторно виконайте `snapshot` і використайте нове посилання.
- `/act` повертає поточний необроблений `targetId` після заміни, спричиненої дією,
  коли може підтвердити вкладку-заміну. Надалі використовуйте стабільні ідентифікатори/мітки вкладок для
  наступних команд.
- Якщо знімок ролей було створено з `--frame`, посилання ролей обмежуються цим iframe до наступного знімка ролей.
- Невідомі або застарілі посилання `axN` одразу спричиняють помилку замість переходу до
  селектора `aria-ref` Playwright. У такому разі створіть новий знімок на тій самій вкладці.

## Розширені можливості очікування

Можна очікувати не лише час або текст:

- Очікування URL-адреси (Playwright підтримує шаблони):
  - `openclaw browser wait --url "**/dash"`
- Очікування стану завантаження:
  - `openclaw browser wait --load networkidle`
  - Підтримується в керованих `openclaw` і необроблених/віддалених профілях CDP. Профілі, що використовують драйвер `existing-session` (зокрема типовий профіль `user`), відхиляють `networkidle`; використовуйте в них очікування `--url`, `--text`, селектор або `--fn`.
- Очікування предиката JS:
  - `openclaw browser wait --fn "window.ready===true"`
- Очікування, доки селектор стане видимим:
  - `openclaw browser wait "#main"`

Їх можна поєднувати:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Процеси налагодження

Коли дія завершується невдало (наприклад, «не видно», «порушення суворого режиму», «перекрито»):

1. `openclaw browser snapshot --interactive`
2. Використовуйте `click <ref>` / `type <ref>` (в інтерактивному режимі віддавайте перевагу посиланням ролей)
3. Якщо дія все одно не працює: `openclaw browser highlight <ref>`, щоб побачити, на що націлюється Playwright
4. Якщо сторінка поводиться дивно:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Для поглибленого налагодження запишіть трасування:
   - `openclaw browser trace start`
   - відтворіть проблему
   - `openclaw browser trace stop` (виводить `TRACE:<path>`)

## Виведення JSON

`--json` призначений для скриптів та інструментів структурованої обробки.

Приклади:

```bash
openclaw browser --json status
openclaw browser --json snapshot --interactive
openclaw browser --json requests --filter api
openclaw browser --json cookies
```

Знімки ролей у JSON містять `refs` і невеликий блок `stats` (рядки/символи/посилання/інтерактивні елементи), щоб інструменти могли оцінювати розмір і щільність корисного навантаження.

## Параметри стану та середовища

Вони корисні для процесів на кшталт «змусити сайт поводитися як X»:

- Файли cookie: `cookies`, `cookies set`, `cookies clear`
- Сховище: `storage local|session get|set|clear`
- Автономний режим: `set offline on|off`
- Заголовки: `set headers --headers-json '{"X-Debug":"1"}'` (або позиційна форма `set headers '{"X-Debug":"1"}'`)
- Базова автентифікація HTTP: `set credentials user pass` (або `--clear`)
- Геолокація: `set geo <lat> <lon> --origin "https://example.com"` (або `--clear`)
- Медіа: `set media dark|light|no-preference|none`
- Часовий пояс / локаль: `set timezone ...`, `set locale ...`
- Пристрій / область перегляду:
  - `set device "iPhone 14"` (набори параметрів пристроїв Playwright)
  - `set viewport 1280 720`

## Безпека та конфіденційність

- Профіль браузера openclaw може містити активні сеанси входу; вважайте його конфіденційним.
- `browser act kind=evaluate` / `openclaw browser evaluate` і `wait --fn`
  виконують довільний JavaScript у контексті сторінки. Ін’єкція промпту може керувати
  цим. Вимкніть це за допомогою `browser.evaluateEnabled=false`, якщо воно не потрібне.
- `openclaw browser evaluate --fn` приймає вихідний код функції, вираз або
  тіло інструкції. Тіла інструкцій обгортаються в асинхронні функції, тому використовуйте
  `return` для значення, яке потрібно отримати. Використовуйте `--timeout-ms <ms>`, коли
  функції на стороні сторінки може знадобитися більше часу, ніж передбачає типовий час очікування обчислення.
- Примітки щодо входу та захисту від ботів (X/Twitter тощо) див. у розділі [Вхід у браузері та публікація в X/Twitter](/uk/tools/browser-login).
- Зберігайте хост Gateway/вузла приватним (лише loopback або tailnet).
- Віддалені кінцеві точки CDP мають широкі можливості; використовуйте тунелювання та захищайте їх.

Приклад суворого режиму (типово блокувати приватні/внутрішні адреси призначення):

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

## Пов’язані матеріали

- [Браузер](/uk/tools/browser) — огляд, конфігурація, профілі, безпека
- [Вхід у браузері](/uk/tools/browser-login) — вхід на сайти
- [Усунення несправностей браузера в Linux](/uk/tools/browser-linux-troubleshooting)
- [Усунення несправностей браузера у WSL2](/uk/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
