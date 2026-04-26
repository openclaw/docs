---
read_when:
    - Скриптування або налагодження браузера агента через локальний API керування
    - Шукаєте довідник CLI `openclaw browser`
    - Додавання власної автоматизації браузера зі знімками та ref-ами
summary: API керування браузером OpenClaw, довідник CLI та дії для скриптів
title: API керування браузером
x-i18n:
    generated_at: "2026-04-26T00:29:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: ebec67dbef0c63ac91f46736d73ec6f0ac21d5214cfcc47f6b8071923fe718c1
    source_path: tools/browser-control.md
    workflow: 15
---

Для налаштування, конфігурації та усунення несправностей див. [Browser](/uk/tools/browser).
Ця сторінка є довідником для локального HTTP API керування, CLI `openclaw browser`
та шаблонів скриптування (знімки, ref-и, очікування, потоки налагодження).

## API керування (необов’язково)

Лише для локальних інтеграцій Gateway надає невеликий loopback HTTP API:

- Статус/запуск/зупинка: `GET /`, `POST /start`, `POST /stop`
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

Усі ендпоїнти приймають `?profile=<name>`. `POST /start?headless=true` запитує
одноразовий headless-запуск для локальних керованих профілів без зміни збереженої
конфігурації браузера; профілі лише з підключенням, віддаленим CDP і наявною сесією
відхиляють це перевизначення, оскільки OpenClaw не запускає ці процеси браузера.

Якщо налаштовано auth Gateway зі спільним секретом, HTTP-маршрути браузера теж вимагають auth:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` або HTTP Basic auth з цим паролем

Примітки:

- Цей окремий loopback API браузера **не** використовує заголовки trusted-proxy або
  заголовки ідентичності Tailscale Serve.
- Якщо `gateway.auth.mode` має значення `none` або `trusted-proxy`, ці loopback-маршрути браузера
  не успадковують ці режими з передаванням ідентичності; залишайте їх доступними лише через loopback.

### Контракт помилок `/act`

`POST /act` використовує структуровану відповідь про помилку для валідації на рівні маршруту та
збоїв політики:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Поточні значення `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): відсутній `kind` або його не розпізнано.
- `ACT_INVALID_REQUEST` (HTTP 400): не вдалося нормалізувати або валідувати payload дії.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` використано з непідтримуваним типом дії.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (або `wait --fn`) вимкнено конфігурацією.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` верхнього рівня або в пакеті конфліктує з ціллю запиту.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): дія не підтримується для профілів наявної сесії.

Інші збої під час виконання все ще можуть повертати `{ "error": "<message>" }` без поля
`code`.

### Вимога Playwright

Для деяких можливостей (navigate/act/AI snapshot/role snapshot, скриншоти елементів,
PDF) потрібен Playwright. Якщо Playwright не встановлено, ці ендпоїнти повертають
зрозумілу помилку 501.

Що все ще працює без Playwright:

- ARIA-знімки
- Скриншоти сторінки для керованого браузера `openclaw`, коли доступний WebSocket
  CDP для кожної вкладки
- Скриншоти сторінки для профілів `existing-session` / Chrome MCP
- Скриншоти на основі ref для `existing-session` (`--ref`) з виводу snapshot

Що все ще потребує Playwright:

- `navigate`
- `act`
- AI-знімки / role snapshots
- Скриншоти елементів за CSS-селектором (`--element`)
- повний експорт PDF браузера

Скриншоти елементів також відхиляють `--full-page`; маршрут повертає `fullPage is
not supported for element screenshots`.

Якщо ви бачите `Playwright is not available in this gateway build`, відновіть
залежності runtime вбудованого Plugin браузера, щоб було встановлено `playwright-core`,
а потім перезапустіть Gateway. Для пакетних установок виконайте `openclaw doctor --fix`.
Для Docker також установіть двійкові файли браузера Chromium, як показано нижче.

#### Установлення Playwright у Docker

Якщо ваш Gateway працює в Docker, уникайте `npx playwright` (конфлікти перевизначень npm).
Натомість використовуйте вбудований CLI:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Щоб зберігати завантаження браузера, установіть `PLAYWRIGHT_BROWSERS_PATH` (наприклад,
`/home/node/.cache/ms-playwright`) і переконайтеся, що `/home/node` зберігається через
`OPENCLAW_HOME_VOLUME` або bind mount. Див. [Docker](/uk/install/docker).

## Як це працює (внутрішньо)

Невеликий loopback-сервер керування приймає HTTP-запити та підключається до браузерів на базі Chromium через CDP. Розширені дії (click/type/snapshot/PDF) виконуються через Playwright поверх CDP; коли Playwright відсутній, доступні лише операції без Playwright. Агент бачить один стабільний інтерфейс, тоді як локальні/віддалені браузери та профілі вільно змінюються під ним.

## Короткий довідник CLI

Усі команди приймають `--browser-profile <name>` для націлювання на конкретний профіль і `--json` для машиночитного виводу.

<AccordionGroup>

<Accordion title="Основи: status, tabs, open/focus/close">

```bash
openclaw browser status
openclaw browser start
openclaw browser start --headless # одноразовий локальний керований headless-запуск
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

- `upload` і `dialog` — це виклики **попереднього озброєння**; запускайте їх перед click/press, що запускає chooser/dialog.
- `click`/`type`/тощо вимагають `ref` із `snapshot` (числовий `12`, role ref `e12` або придатний до дії ARIA ref `ax12`). CSS-селектори навмисно не підтримуються для дій. Використовуйте `click-coords`, коли єдиною надійною ціллю є видима позиція в області перегляду.
- Шляхи download, trace і upload обмежені тимчасовими коренями OpenClaw: `/tmp/openclaw{,/downloads,/uploads}` (резервний варіант: `${os.tmpdir()}/openclaw/...`).
- `upload` також може напряму встановлювати file input через `--input-ref` або `--element`.

Стабільні id вкладок і мітки переживають заміну raw target у Chromium, коли OpenClaw
може довести, що це вкладка-замінник, наприклад, та сама URL-адреса або одна стара вкладка
перетворюється на одну нову після надсилання форми. Raw target id усе ще нестабільні; у скриптах
надавайте перевагу `suggestedTargetId` із `tabs`.

Коротко про прапорці snapshot:

- `--format ai` (типово з Playwright): AI-знімок із числовими ref-ами (`aria-ref="<n>"`).
- `--format aria`: дерево доступності з ref-ами `axN`. Коли Playwright доступний, OpenClaw прив’язує ref-и з backend DOM id до живої сторінки, щоб наступні дії могли їх використовувати; інакше сприймайте вивід лише як інспекційний.
- `--efficient` (або `--mode efficient`): компактний preset role snapshot. Установіть `browser.snapshotDefaults.mode: "efficient"`, щоб зробити це типовим значенням (див. [Конфігурація Gateway](/uk/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` примусово вмикають role snapshot з ref-ами `ref=e12`. `--frame "<iframe>"` обмежує role snapshot iframe.
- `--labels` додає скриншот лише області перегляду з накладеними ref-мітками (виводить `MEDIA:<path>`).
- `--urls` додає виявлені адреси посилань до AI-знімків.

## Знімки та ref-и

OpenClaw підтримує два стилі “snapshot”:

- **AI-знімок (числові ref-и)**: `openclaw browser snapshot` (типово; `--format ai`)
  - Вивід: текстовий знімок, що містить числові ref-и.
  - Дії: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Внутрішньо ref розв’язується через `aria-ref` Playwright.

- **Role snapshot (role ref-и на кшталт `e12`)**: `openclaw browser snapshot --interactive` (або `--compact`, `--depth`, `--selector`, `--frame`)
  - Вивід: список/дерево на основі ролей із `[ref=e12]` (і необов’язково `[nth=1]`).
  - Дії: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Внутрішньо ref розв’язується через `getByRole(...)` (плюс `nth()` для дублікатів).
  - Додайте `--labels`, щоб включити скриншот області перегляду з накладеними мітками `e12`.
  - Додайте `--urls`, коли текст посилання неоднозначний і агенту потрібні конкретні
    цілі навігації.

- **ARIA-знімок (ARIA ref-и на кшталт `ax12`)**: `openclaw browser snapshot --format aria`
  - Вивід: дерево доступності як структуровані вузли.
  - Дії: `openclaw browser click ax12` працює, коли шлях snapshot може прив’язати
    ref через Playwright і backend DOM id Chrome.
  - Якщо Playwright недоступний, ARIA-знімки все одно можуть бути корисними для
    інспекції, але ref-и можуть бути непридатними до дії. Повторно створіть snapshot з `--format ai`
    або `--interactive`, коли потрібні ref-и для дій.

Поведінка ref-ів:

- Ref-и **не є стабільними між навігаціями**; якщо щось не спрацювало, повторно виконайте `snapshot` і використайте свіжий ref.
- `/act` повертає поточний raw `targetId` після заміни, спричиненої дією,
  коли може довести, що це вкладка-замінник. Для наступних команд продовжуйте
  використовувати стабільні id вкладок/мітки.
- Якщо role snapshot було зроблено з `--frame`, role ref-и обмежуються цим iframe до наступного role snapshot.
- Невідомі або застарілі ref-и `axN` завершуються швидкою помилкою замість переходу до
  селектора `aria-ref` Playwright. Коли це трапляється, виконайте новий snapshot на тій самій вкладці.

## Розширені можливості очікування

Ви можете чекати не лише на час/текст:

- Очікування URL-адреси (підтримуються glob-шаблони Playwright):
  - `openclaw browser wait --url "**/dash"`
- Очікування стану завантаження:
  - `openclaw browser wait --load networkidle`
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

## Потоки налагодження

Коли дія завершується помилкою (наприклад, “not visible”, “strict mode violation”, “covered”):

1. `openclaw browser snapshot --interactive`
2. Використайте `click <ref>` / `type <ref>` (в інтерактивному режимі надавайте перевагу role ref-ам)
3. Якщо все одно не працює: `openclaw browser highlight <ref>`, щоб побачити, на що націлюється Playwright
4. Якщо сторінка поводиться дивно:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Для глибокого налагодження: запишіть trace:
   - `openclaw browser trace start`
   - відтворіть проблему
   - `openclaw browser trace stop` (виводить `TRACE:<path>`)

## Вивід JSON

`--json` призначено для скриптування та структурованих інструментів.

Приклади:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Role snapshots у JSON містять `refs` плюс невеликий блок `stats` (lines/chars/refs/interactive), щоб інструменти могли оцінювати розмір і щільність payload.

## Параметри стану та середовища

Вони корисні для сценаріїв “змусити сайт поводитися як X”:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'` (застарілий `set headers --json '{"X-Debug":"1"}'` усе ще підтримується)
- HTTP Basic auth: `set credentials user pass` (або `--clear`)
- Геолокація: `set geo <lat> <lon> --origin "https://example.com"` (або `--clear`)
- Media: `set media dark|light|no-preference|none`
- Часовий пояс / locale: `set timezone ...`, `set locale ...`
- Device / viewport:
  - `set device "iPhone 14"` (попередньо встановлені device Playwright)
  - `set viewport 1280 720`

## Безпека та приватність

- Профіль браузера openclaw може містити сеанси з виконаним входом; вважайте його чутливим.
- `browser act kind=evaluate` / `openclaw browser evaluate` і `wait --fn`
  виконують довільний JavaScript у контексті сторінки. Ін’єкція в підказку може
  скерувати це. Вимкніть це через `browser.evaluateEnabled=false`, якщо вам це не потрібно.
- Відомості про входи та примітки щодо anti-bot (X/Twitter тощо) див. у [Browser login + X/Twitter posting](/uk/tools/browser-login).
- Тримайте хост Gateway/node приватним (лише loopback або лише tailnet).
- Віддалені ендпоїнти CDP мають широкі можливості; тунелюйте та захищайте їх.

Приклад strict mode (типово блокувати приватні/внутрішні адресати):

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
