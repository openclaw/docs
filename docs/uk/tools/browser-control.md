---
read_when:
    - Написання сценаріїв або налагодження браузера агента через локальний API керування
    - Шукаєте довідку CLI для `openclaw browser`
    - Додавання користувацької автоматизації браузера зі знімками та refs
summary: Довідник API керування браузером OpenClaw, CLI та сценарних дій
title: API керування браузером
x-i18n:
    generated_at: "2026-06-27T18:23:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ccfd1ec996b0fc211e2aefa0554e0fa5c7b0899ca981836134a3741b38bf7600
    source_path: tools/browser-control.md
    workflow: 16
---

Для налаштування, конфігурації та усунення несправностей див. [Браузер](/uk/tools/browser).
Ця сторінка є довідником для локального керівного HTTP API, CLI `openclaw browser`
і шаблонів скриптів (знімки, посилання, очікування, потоки налагодження).

## Керівний API (необов’язково)

Лише для локальних інтеграцій Gateway надає невеликий loopback HTTP API.
Цей окремий сервер є opt-in — задайте змінну середовища
`OPENCLAW_EAGER_BROWSER_CONTROL_SERVER=1` у середовищі сервісу gateway
і перезапустіть gateway, перш ніж HTTP endpoint-и стануть доступними. Без
цієї змінної браузерний runtime керування все одно працює через CLI та
інструменти агента, але ніщо не слухає керівний loopback-порт.

- Статус/запуск/зупинка: `GET /`, `POST /start`, `POST /stop`
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

Усі endpoint-и приймають `?profile=<name>`. `POST /start?headless=true` запитує
одноразовий headless-запуск для локальних керованих профілів без зміни збереженої
конфігурації браузера; профілі attach-only, remote CDP і existing-session
відхиляють це перевизначення, бо OpenClaw не запускає ці процеси браузера.

Для endpoint-ів вкладок `targetId` є назвою поля сумісності. Надавайте перевагу
передаванню `suggestedTargetId` з `GET /tabs` або `POST /tabs/open`; мітки та
handle-и `tabId`, як-от `t1`, також приймаються. Сирі target id CDP і унікальні
сирі префікси target-id досі працюють, але це несталі діагностичні handle-и.

Якщо налаштовано автентифікацію gateway зі спільним секретом, браузерні HTTP-маршрути також потребують автентифікації:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` або HTTP Basic auth із цим паролем

Примітки:

- Цей окремий loopback браузерний API **не** споживає trusted-proxy або
  заголовки ідентичності Tailscale Serve.
- Якщо `gateway.auth.mode` має значення `none` або `trusted-proxy`, ці loopback
  браузерні маршрути не успадковують ці режими з ідентичністю; тримайте їх лише loopback.

### Контракт помилок `/act`

`POST /act` використовує структуровану відповідь про помилку для перевірки на рівні маршруту та
збоїв політики:

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

Інші runtime-збої все ще можуть повертати `{ "error": "<message>" }` без поля
`code`.

### Вимога Playwright

Деякі функції (navigate/act/AI snapshot/role snapshot, скриншоти елементів,
PDF) потребують Playwright. Якщо Playwright не встановлено, ці endpoint-и повертають
чітку помилку 501.

Що все ще працює без Playwright:

- ARIA snapshots
- Role-style знімки доступності (`--interactive`, `--compact`,
  `--depth`, `--efficient`), коли доступний WebSocket CDP для окремої вкладки. Це
  fallback для інспекції та виявлення refs; Playwright залишається основним
  рушієм дій.
- Скриншоти сторінок для керованого браузера `openclaw`, коли доступний
  WebSocket CDP для окремої вкладки
- Скриншоти сторінок для профілів `existing-session` / Chrome MCP
- Ref-based скриншоти `existing-session` (`--ref`) з виводу snapshot

Що все ще потребує Playwright:

- `navigate`
- `act`
- AI snapshots, що залежать від нативного формату AI snapshot Playwright
- Скриншоти елементів за CSS-селектором (`--element`)
- Повний експорт браузера в PDF

Скриншоти елементів також відхиляють `--full-page`; маршрут повертає `fullPage is
not supported for element screenshots`.

Якщо ви бачите `Playwright is not available in this gateway build`, у запакованому
Gateway бракує основної браузерної runtime-залежності. Перевстановіть або оновіть
OpenClaw, а потім перезапустіть gateway. Для Docker також установіть браузерні
бінарні файли Chromium, як показано нижче.

#### Встановлення Playwright у Docker

Якщо ваш Gateway працює в Docker, уникайте `npx playwright` (конфлікти npm override).
Для власних образів вбудуйте Chromium в образ:

```bash
OPENCLAW_INSTALL_BROWSER=1 ./scripts/docker/setup.sh
```

Для наявного образу натомість установіть через bundled CLI:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Щоб зберігати завантаження браузера, задайте `PLAYWRIGHT_BROWSERS_PATH` (наприклад,
`/home/node/.cache/ms-playwright`) і переконайтеся, що `/home/node` зберігається через
`OPENCLAW_HOME_VOLUME` або bind mount. OpenClaw автоматично виявляє збережений
Chromium у Linux. Див. [Docker](/uk/install/docker).

## Як це працює (внутрішньо)

Невеликий loopback керівний сервер приймає HTTP-запити й підключається до браузерів на основі Chromium через CDP. Розширені дії (click/type/snapshot/PDF) проходять через Playwright поверх CDP; коли Playwright відсутній, доступні лише операції без Playwright. Агент бачить один стабільний інтерфейс, тоді як локальні/віддалені браузери й профілі вільно змінюються під ним.

## Короткий довідник CLI

Усі команди приймають `--browser-profile <name>` для вибору конкретного профілю та `--json` для машиночитного виводу.

<AccordionGroup>

<Accordion title="Основи: статус, вкладки, відкрити/фокусувати/закрити">

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

<Accordion title="Інспекція: скриншот, знімок, консоль, помилки, запити">

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

<Accordion title="Дії: навігація, клік, введення, перетягування, очікування, evaluate">

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

- `upload` і `dialog` — це виклики **arming**; запускайте їх перед кліком/натисканням, яке відкриває chooser/dialog. Якщо дія відкриває модальне вікно, відповідь дії містить `blockedByDialog` і `browserState.dialogs.pending`; передайте цей `dialogId`, щоб відповісти напряму. Діалоги, оброблені поза OpenClaw, з’являються в `browserState.dialogs.recent`.
- `click`/`type`/тощо потребують `ref` зі `snapshot` (числовий `12`, role ref `e12` або actionable ARIA ref `ax12`). CSS-селектори навмисно не підтримуються для дій. Використовуйте `click-coords`, коли видима позиція у viewport є єдиною надійною ціллю.
- Шляхи завантаження й трасування обмежені тимчасовими коренями OpenClaw: `/tmp/openclaw{,/downloads}` (fallback: `${os.tmpdir()}/openclaw/...`).
- `upload` приймає файли з тимчасового кореня завантажень OpenClaw і
  керовані OpenClaw inbound media. На керовані inbound media можна посилатися як
  `media://inbound/<id>`, sandbox-relative `media/inbound/<id>` або resolved
  path усередині керованого каталогу inbound media. Вкладені media refs,
  traversal, symlinks, hardlinks і довільні локальні шляхи все ще відхиляються.
- `upload` також може встановлювати файлові input-и напряму через `--input-ref` або `--element`.

Стабільні id вкладок і мітки переживають заміну сирого target Chromium, коли OpenClaw
може довести вкладку-заміну, наприклад та сама URL-адреса або одна стара вкладка стає
однією новою вкладкою після надсилання форми. Сирі target ids усе ще несталі; у скриптах
надавайте перевагу `suggestedTargetId` з `tabs`.

Коротко про прапорці snapshot:

- `--format ai` (типово з Playwright): AI-знімок із числовими refs (`aria-ref="<n>"`).
- `--format aria`: дерево доступності з refs `axN`. Коли Playwright доступний, OpenClaw прив’язує refs із backend DOM ids до активної сторінки, щоб подальші дії могли їх використовувати; інакше вважайте вивід призначеним лише для інспекції.
- `--efficient` (або `--mode efficient`): компактний пресет знімка ролей. Установіть `browser.snapshotDefaults.mode: "efficient"`, щоб зробити це типовим режимом (див. [конфігурацію Gateway](/uk/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` примусово вмикають знімок ролей із refs `ref=e12`. `--frame "<iframe>"` обмежує знімки ролей iframe.
- Із Playwright `--labels` додає знімок екрана з накладеними мітками refs
  (друкує `MEDIA:<path>`) плюс масив `annotations` з обмежувальною рамкою
  кожного ref. Для `screenshot` мітки на базі Playwright працюють із `--full-page`,
  `--ref` і `--element`; для `snapshot` супровідний знімок екрана залишається
  лише в межах viewport. Профілі existing-session/chrome-mcp відтворюють накладені
  мітки на знімках сторінки, але не повертають `annotations` і не використовують
  допоміжний механізм проєкції Playwright для full-page/ref/element. Без Playwright
  або chrome-mcp знімки екрана з мітками недоступні.
- `--urls` додає знайдені призначення посилань до AI-знімків.

## Знімки та refs

OpenClaw підтримує два стилі "snapshot":

- **AI-знімок (числові refs)**: `openclaw browser snapshot` (типово; `--format ai`)
  - Вивід: текстовий знімок, що містить числові refs.
  - Дії: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Усередині ref розв’язується через `aria-ref` Playwright.

- **Знімок ролей (refs ролей на кшталт `e12`)**: `openclaw browser snapshot --interactive` (або `--compact`, `--depth`, `--selector`, `--frame`)
  - Вивід: список/дерево на основі ролей із `[ref=e12]` (та необов’язковим `[nth=1]`).
  - Дії: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Усередині ref розв’язується через `getByRole(...)` (плюс `nth()` для дублікатів).
  - Додайте `--labels`, щоб включити знімок екрана з накладеними мітками `e12`. У
    профілях на базі Playwright це також повертає метадані обмежувальних рамок
    для кожного ref (`annotations[]`).
  - Додайте `--urls`, коли текст посилання неоднозначний і агенту потрібні конкретні
    цілі навігації.

- **ARIA-знімок (ARIA refs на кшталт `ax12`)**: `openclaw browser snapshot --format aria`
  - Вивід: дерево доступності як структуровані вузли.
  - Дії: `openclaw browser click ax12` працює, коли шлях знімка може прив’язати
    ref через Playwright і Chrome backend DOM ids.
- Якщо Playwright недоступний, ARIA-знімки все ще можуть бути корисними для
  інспекції, але refs можуть бути непридатними для дій. Повторно зробіть знімок
  із `--format ai` або `--interactive`, коли потрібні refs для дій.
- Docker-доказ для резервного шляху raw-CDP: `pnpm test:docker:browser-cdp-snapshot`
  запускає Chromium із CDP, виконує `browser doctor --deep` і перевіряє, що знімки
  ролей містять URL посилань, клікабельні елементи, підняті за курсором, і метадані iframe.

Поведінка refs:

- Refs **не є стабільними між навігаціями**; якщо щось не спрацювало, повторно запустіть `snapshot` і використайте новий ref.
- `/act` повертає поточний необроблений `targetId` після заміни, спричиненої дією,
  коли може довести вкладку-заміну. Продовжуйте використовувати стабільні ids/мітки
  вкладок для подальших команд.
- Якщо знімок ролей було зроблено з `--frame`, refs ролей обмежені цим iframe до наступного знімка ролей.
- Невідомі або застарілі refs `axN` швидко завершуються помилкою замість переходу до
  селектора `aria-ref` Playwright. Коли це трапляється, зробіть новий знімок на тій самій вкладці.

## Покращення очікування

Можна очікувати не лише час/текст:

- Очікування URL (глоби підтримуються Playwright):
  - `openclaw browser wait --url "**/dash"`
- Очікування стану завантаження:
  - `openclaw browser wait --load networkidle`
  - Підтримується в керованих профілях `openclaw` і raw/remote CDP. Профілі `user` та `existing-session` відхиляють `networkidle`; використовуйте там очікування `--url`, `--text`, селектор або `--fn`.
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
2. Використайте `click <ref>` / `type <ref>` (у режимі interactive надавайте перевагу refs ролей)
3. Якщо все ще не вдається: `openclaw browser highlight <ref>`, щоб побачити, на що націлюється Playwright
4. Якщо сторінка поводиться дивно:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Для глибокого налагодження: запишіть trace:
   - `openclaw browser trace start`
   - відтворіть проблему
   - `openclaw browser trace stop` (друкує `TRACE:<path>`)

## JSON-вивід

`--json` призначено для скриптів і структурованих інструментів.

Приклади:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Знімки ролей у JSON містять `refs` плюс невеликий блок `stats` (lines/chars/refs/interactive), щоб інструменти могли оцінювати розмір і щільність payload.

## Стан і параметри середовища

Це корисно для робочих процесів "змусити сайт поводитися як X":

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Сховище: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Заголовки: `set headers --headers-json '{"X-Debug":"1"}'` (застарілий `set headers --json '{"X-Debug":"1"}'` залишається підтримуваним)
- HTTP basic auth: `set credentials user pass` (або `--clear`)
- Геолокація: `set geo <lat> <lon> --origin "https://example.com"` (або `--clear`)
- Media: `set media dark|light|no-preference|none`
- Часовий пояс / локаль: `set timezone ...`, `set locale ...`
- Пристрій / viewport:
  - `set device "iPhone 14"` (пресети пристроїв Playwright)
  - `set viewport 1280 720`

## Безпека та приватність

- Профіль браузера openclaw може містити сеанси з виконаним входом; ставтеся до нього як до чутливого.
- `browser act kind=evaluate` / `openclaw browser evaluate` і `wait --fn`
  виконують довільний JavaScript у контексті сторінки. Prompt injection може
  скеровувати це. Вимкніть це за допомогою `browser.evaluateEnabled=false`, якщо воно вам не потрібне.
- `openclaw browser evaluate --fn` приймає джерело функції, вираз або
  тіло інструкцій. Тіла інструкцій обгортаються як асинхронні функції, тому використовуйте
  `return` для значення, яке потрібно отримати назад. Використовуйте `--timeout-ms <ms>`, коли
  функції на боці сторінки може знадобитися більше часу, ніж типовий timeout evaluate.
- Для входів і приміток щодо anti-bot (X/Twitter тощо) див. [Вхід у браузері + публікація в X/Twitter](/uk/tools/browser-login).
- Тримайте хост Gateway/Node приватним (local loopback або лише tailnet).
- Віддалені CDP endpoints потужні; тунелюйте й захищайте їх.

Приклад strict-mode (типово блокує приватні/внутрішні призначення):

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
- [Усунення несправностей браузера WSL2 для Windows remote CDP](/uk/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
