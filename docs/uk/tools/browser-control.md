---
read_when:
    - Скриптування або налагодження браузера агента через локальний API керування
    - Шукаєте довідник CLI `openclaw browser`
    - Додавання власної автоматизації браузера зі snapshot і ref
summary: API керування браузером OpenClaw, довідник CLI та дії для скриптування
title: API керування браузером
x-i18n:
    generated_at: "2026-04-25T00:03:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: ec7b6e83b231fefc9c4a63fabde9bdaeb2ea2b2a8ab64943e179a7af5ed4badc
    source_path: tools/browser-control.md
    workflow: 15
---

Для налаштування, конфігурації та усунення несправностей див. [Browser](/uk/tools/browser).
Ця сторінка — довідник для локального HTTP API керування, CLI `openclaw browser`
і шаблонів скриптування (snapshot, ref, очікування, потоки налагодження).

## API керування (необов’язково)

Лише для локальних інтеграцій Gateway надає невеликий loopback HTTP API:

- Статус/запуск/зупинка: `GET /`, `POST /start`, `POST /stop`
- Вкладки: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/screenshot: `GET /snapshot`, `POST /screenshot`
- Дії: `POST /navigate`, `POST /act`
- Hooks: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Завантаження: `POST /download`, `POST /wait/download`
- Налагодження: `GET /console`, `POST /pdf`
- Налагодження: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Мережа: `POST /response/body`
- Стан: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Стан: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Налаштування: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Усі кінцеві точки приймають `?profile=<name>`.

Якщо налаштовано auth gateway зі спільним секретом, HTTP-маршрути браузера також потребують auth:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` або HTTP Basic auth із цим паролем

Примітки:

- Цей окремий loopback API браузера **не** використовує заголовки ідентичності trusted-proxy або
  Tailscale Serve.
- Якщо `gateway.auth.mode` має значення `none` або `trusted-proxy`, ці loopback-маршрути браузера
  не успадковують ці режими з ідентифікаційними даними; залишайте їх лише для loopback.

### Контракт помилок `/act`

`POST /act` використовує структуровану відповідь помилки для перевірки на рівні маршруту і
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

Інші збої під час виконання все ще можуть повертати `{ "error": "<message>" }` без
поля `code`.

### Вимога Playwright

Деякі функції (navigate/act/AI snapshot/role snapshot, screenshot елемента,
PDF) потребують Playwright. Якщо Playwright не встановлено, ці кінцеві точки повертають
зрозумілу помилку 501.

Що все ще працює без Playwright:

- ARIA snapshot
- Screenshot сторінки для керованого браузера `openclaw`, коли доступний CDP
  WebSocket для кожної вкладки
- Screenshot сторінки для профілів `existing-session` / Chrome MCP
- Screenshot на основі ref для `existing-session` (`--ref`) з виводу snapshot

Що все ще потребує Playwright:

- `navigate`
- `act`
- AI snapshot / role snapshot
- Screenshot елемента за CSS-selector (`--element`)
- повний експорт PDF браузера

Screenshot елемента також відхиляють `--full-page`; маршрут повертає `fullPage is
not supported for element screenshots`.

Якщо ви бачите `Playwright is not available in this gateway build`, відновіть
залежності runtime вбудованого Plugin браузера, щоб було встановлено `playwright-core`,
а потім перезапустіть gateway. Для пакетних встановлень виконайте `openclaw doctor --fix`.
Для Docker також встановіть бінарні файли браузера Chromium, як показано нижче.

#### Встановлення Playwright у Docker

Якщо ваш Gateway працює в Docker, уникайте `npx playwright` (конфлікти перевизначення npm).
Натомість використовуйте вбудований CLI:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Щоб зберігати завантаження браузера, задайте `PLAYWRIGHT_BROWSERS_PATH` (наприклад,
`/home/node/.cache/ms-playwright`) і переконайтеся, що `/home/node` зберігається через
`OPENCLAW_HOME_VOLUME` або bind mount. Див. [Docker](/uk/install/docker).

## Як це працює (внутрішньо)

Невеликий loopback-сервер керування приймає HTTP-запити та підключається до браузерів на базі Chromium через CDP. Розширені дії (click/type/snapshot/PDF) виконуються через Playwright поверх CDP; коли Playwright відсутній, доступні лише операції без Playwright. Агент бачить один стабільний інтерфейс, тоді як локальні/віддалені браузери й профілі можуть вільно змінюватися під ним.

## Короткий довідник CLI

Усі команди приймають `--browser-profile <name>` для націлювання на конкретний профіль і `--json` для машинозчитуваного виводу.

<AccordionGroup>

<Accordion title="Основи: статус, вкладки, open/focus/close">

```bash
openclaw browser status
openclaw browser start
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

<Accordion title="Інспекція: screenshot, snapshot, console, errors, requests">

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

<Accordion title="Дії: navigate, click, type, drag, wait, evaluate">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # or e12 for role refs
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

- `upload` і `dialog` — це виклики **arming**; запускайте їх перед click/press, що запускає вибір файлу/діалог.
- `click`/`type`/тощо потребують `ref` із `snapshot` (числовий `12` або role ref `e12`). CSS selectors навмисно не підтримуються для дій.
- Шляхи download, trace і upload обмежені тимчасовими коренями OpenClaw: `/tmp/openclaw{,/downloads,/uploads}` (резервний варіант: `${os.tmpdir()}/openclaw/...`).
- `upload` також може напряму встановлювати file input через `--input-ref` або `--element`.

Коротко про прапорці snapshot:

- `--format ai` (типово з Playwright): AI snapshot із числовими ref (`aria-ref="<n>"`).
- `--format aria`: дерево доступності, без ref; лише для інспекції.
- `--efficient` (або `--mode efficient`): компактний preset role snapshot. Задайте `browser.snapshotDefaults.mode: "efficient"`, щоб зробити це типовим значенням (див. [Gateway configuration](/uk/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` примусово вмикають role snapshot із ref виду `ref=e12`. `--frame "<iframe>"` обмежує role snapshot вказаним iframe.
- `--labels` додає screenshot лише видимої області з накладеними позначками ref (виводить `MEDIA:<path>`).
- `--urls` додає виявлені адреси посилань до AI snapshot.

## Snapshot і ref

OpenClaw підтримує два стилі “snapshot”:

- **AI snapshot (числові ref)**: `openclaw browser snapshot` (типово; `--format ai`)
  - Вивід: текстовий snapshot, який містить числові ref.
  - Дії: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Внутрішньо ref розв’язується через `aria-ref` у Playwright.

- **Role snapshot (role ref на кшталт `e12`)**: `openclaw browser snapshot --interactive` (або `--compact`, `--depth`, `--selector`, `--frame`)
  - Вивід: список/дерево на основі ролей із `[ref=e12]` (і необов’язковим `[nth=1]`).
  - Дії: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Внутрішньо ref розв’язується через `getByRole(...)` (плюс `nth()` для дублікатів).
  - Додайте `--labels`, щоб включити screenshot видимої області з накладеними позначками `e12`.
  - Додайте `--urls`, коли текст посилання неоднозначний і агенту потрібні конкретні
    цілі навігації.

Поведінка ref:

- Ref **не є стабільними між переходами**; якщо щось не спрацювало, знову виконайте `snapshot` і використайте новий ref.
- Якщо role snapshot було зроблено з `--frame`, role ref обмежуються цим iframe до наступного role snapshot.

## Розширені можливості очікування

Можна очікувати не лише час/текст:

- Очікування URL (glob-шаблони підтримуються Playwright):
  - `openclaw browser wait --url "**/dash"`
- Очікування стану завантаження:
  - `openclaw browser wait --load networkidle`
- Очікування JS-предиката:
  - `openclaw browser wait --fn "window.ready===true"`
- Очікування, поки selector стане видимим:
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
2. Використайте `click <ref>` / `type <ref>` (у інтерактивному режимі віддавайте перевагу role ref)
3. Якщо все одно не спрацьовує: `openclaw browser highlight <ref>`, щоб побачити, на що націлений Playwright
4. Якщо сторінка поводиться дивно:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Для глибокого налагодження: запишіть trace:
   - `openclaw browser trace start`
   - відтворіть проблему
   - `openclaw browser trace stop` (виводить `TRACE:<path>`)

## JSON-вивід

`--json` призначений для скриптування й структурованих інструментів.

Приклади:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Role snapshot у JSON включають `refs` плюс невеликий блок `stats` (рядки/символи/ref/interactive), щоб інструменти могли оцінювати розмір і щільність payload.

## Параметри стану та середовища

Вони корисні для потоків на кшталт “змусити сайт поводитися як X”:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'` (застарілий `set headers --json '{"X-Debug":"1"}'` усе ще підтримується)
- HTTP basic auth: `set credentials user pass` (або `--clear`)
- Геолокація: `set geo <lat> <lon> --origin "https://example.com"` (або `--clear`)
- Media: `set media dark|light|no-preference|none`
- Часовий пояс / локаль: `set timezone ...`, `set locale ...`
- Пристрій / viewport:
  - `set device "iPhone 14"` (preset пристроїв Playwright)
  - `set viewport 1280 720`

## Безпека та приватність

- Профіль браузера openclaw може містити активні сеанси входу; вважайте його чутливим.
- `browser act kind=evaluate` / `openclaw browser evaluate` і `wait --fn`
  виконують довільний JavaScript у контексті сторінки. Prompt injection може
  спрямувати це. Вимкніть його через `browser.evaluateEnabled=false`, якщо він вам не потрібен.
- Для входу на сайти та приміток щодо антибот-захисту (X/Twitter тощо) див. [Browser login + X/Twitter posting](/uk/tools/browser-login).
- Тримайте хост Gateway/node приватним (лише loopback або лише tailnet).
- Віддалені кінцеві точки CDP мають широкі можливості; тунелюйте й захищайте їх.

Приклад strict-mode (типово блокує приватні/внутрішні цілі призначення):

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

- [Browser](/uk/tools/browser) — огляд, конфігурація, профілі, безпека
- [Browser login](/uk/tools/browser-login) — вхід на сайти
- [Усунення несправностей Browser на Linux](/uk/tools/browser-linux-troubleshooting)
- [Усунення несправностей Browser у WSL2](/uk/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
