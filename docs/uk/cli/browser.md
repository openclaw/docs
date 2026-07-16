---
read_when:
    - Ви використовуєте `openclaw browser` і хочете отримати приклади поширених завдань
    - Ви хочете керувати браузером, запущеним на іншому комп’ютері, через хост Node
    - Ви хочете підключитися до локального Chrome, у якому вже виконано вхід, через Chrome MCP
summary: Довідник CLI для `openclaw browser` (життєвий цикл, профілі, вкладки, дії, стан і налагодження)
title: Браузер
x-i18n:
    generated_at: "2026-07-16T17:37:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 50e9da3fa6899d830e38d8548313c70b5615c2ed3d70dd372a1fe147ff5db053
    source_path: cli/browser.md
    workflow: 16
---

# `openclaw browser`

Керуйте інтерфейсом керування браузером OpenClaw і виконуйте дії в браузері: керування життєвим циклом, профілями, вкладками, знімками, знімками екрана, навігацією, введенням, емуляцією стану та налагодженням.

Пов’язане: [Інструмент браузера](/uk/tools/browser)

## Загальні прапорці

- `--url <gatewayWsUrl>`: URL WebSocket Gateway (типово береться з конфігурації).
- `--token <token>`: токен Gateway (якщо потрібен).
- `--timeout <ms>`: час очікування запиту в мс (типово: `30000`).
- `--expect-final`: очікувати на остаточну відповідь Gateway.
- `--browser-profile <name>`: вибрати профіль браузера (типово: `openclaw` або `browser.defaultProfile`).
- `--json`: машинозчитуваний формат виведення (де підтримується). Це параметр рівня браузера, тому
  для однозначності розміщуйте його перед підкомандою, наприклад
  `openclaw browser --json status`. Розміщення в кінці, наприклад
  `openclaw browser status --json`, також працює, якщо вибрана дочірня команда не
  визначає власний параметр `--json`.

## Швидкий початок роботи (локально)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Агенти можуть виконувати таку саму перевірку готовності за допомогою `browser({ action: "doctor" })`.

## Швидке усунення несправностей

Якщо `start` завершується помилкою `not reachable after start`, спочатку перевірте готовність CDP. Якщо `start` і `tabs` виконуються успішно, але `open` або `navigate` завершується помилкою, рівень керування браузером справний, а причиною збою зазвичай є блокування політикою SSRF для навігації.

Мінімальна послідовність:

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Докладні вказівки: [Усунення несправностей браузера](/uk/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## Життєвий цикл

```bash
openclaw browser status
openclaw browser doctor
openclaw browser doctor --deep
openclaw browser start
openclaw browser start --headless
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

- `doctor --deep` додає активну перевірку знімка: це корисно, коли базова готовність CDP підтверджена, але потрібно довести, що поточну вкладку можна перевірити.
- Для запущеного локального керованого профілю `status` і `doctor` повертають кешовані
  діагностичні дані графічної підсистеми Chrome: класифікацію апаратного й програмного забезпечення, засіб візуалізації,
  бекенд, пристрій і драйвер, відомості про функції та стан їх вимкнення, а також можливості
  апаратно прискореного відео. `openclaw browser --json status` повертає повне структуроване корисне навантаження.
  Пасивна перевірка стану ніколи не запускає Chrome лише для збирання цих даних.
- `stop` закриває активний сеанс керування та очищає тимчасові перевизначення емуляції навіть для `attachOnly` і віддалених профілів CDP, у яких OpenClaw не запускав сам процес браузера. Для локальних керованих профілів `stop` також зупиняє породжений процес браузера.
- `start --headless` застосовується лише до цього запиту запуску й лише тоді, коли OpenClaw запускає локальний керований браузер. Він не змінює `browser.headless` або конфігурацію профілю й не виконує жодних дій для вже запущеного браузера.
- На хостах Linux без `DISPLAY` або `WAYLAND_DISPLAY` локальні керовані профілі автоматично запускаються в безголовому режимі, якщо `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless=false` або `browser.profiles.<name>.headless=false` явно не вимагає браузер із видимим інтерфейсом.

## Якщо команда відсутня

Якщо `openclaw browser` є невідомою командою, перевірте `plugins.allow` у `~/.openclaw/openclaw.json`. Якщо наявний `plugins.allow`, явно додайте вбудований Plugin браузера до списку, якщо конфігурація ще не містить кореневого блоку `browser`:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Явний кореневий блок `browser` (наприклад, `browser.enabled=true` або `browser.profiles.<name>`) також активує вбудований Plugin браузера за обмежувального списку дозволених плагінів.

Пов’язане: [Інструмент браузера](/uk/tools/browser#missing-browser-command-or-tool)

## Профілі

Профілі — це іменовані конфігурації маршрутизації браузера:

- `openclaw` (типово): запускає виділений екземпляр Chrome під керуванням OpenClaw або під’єднується до нього (ізольований каталог даних користувача).
- `user`: керує наявним сеансом Chrome із виконаним входом через Chrome DevTools MCP.
- власні профілі CDP: указують на локальну або віддалену кінцеву точку CDP.

```bash
openclaw browser profiles
openclaw browser system-profiles
openclaw browser system-profiles --browser brave
openclaw browser import-profile --browser chrome --system Default --into imported
openclaw browser import-profile --system "Profile 1" --into work --domains google.com,youtube.com
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

Використовуйте певний профіль із `--browser-profile <name>` у будь-якій підкоманді, наприклад `openclaw browser --browser-profile work tabs`.

У macOS команда `system-profiles` виводить реальні профілі Chrome, Brave, Edge або Chromium, доступні на хості. `import-profile` розшифровує їхні файли cookie після одноразового запиту згоди через macOS Keychain/Touch ID і вставляє їх у новий профіль під керуванням OpenClaw. Імпортуються лише файли cookie; локальне сховище та IndexedDB не змінюються. Деякі сеанси Google використовують прив’язані до пристрою облікові дані сеансу (DBSC), тому після імпорту може все одно знадобитися повторна автентифікація.

Коли застосунок macOS використовує локальний Gateway, він може один раз запропонувати цей імпорт і зробити ізольований імпортований профіль типовим для роботи агентів у браузері. Імпорт завжди потребує явного клацання; успішний імпорт або відхилення пропозиції запобігає подальшим автоматичним запитам, а пункт **Settings → General → Browser login** залишається доступним для повторного імпорту.

Імпорт системного профілю типово ввімкнений. Установіть `browser.allowSystemProfileImport=false`, щоб вимкнути імпорти як із CLI, так і запущені агентом. Імпорт виконується лише локально на хості й не може працювати через проксі браузерного вузла.

## Вкладки

```bash
openclaw browser tabs
openclaw browser tab new --label docs
openclaw browser tab label t1 docs
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://docs.openclaw.ai --label docs
openclaw browser focus docs
openclaw browser close t1
```

`tabs` спочатку повертає `suggestedTargetId`, потім стабільний `tabId` (наприклад, `t1`), необов’язкову мітку та необроблений `targetId`. Передавайте `suggestedTargetId` назад до `focus`, `close`, знімків і дій. Призначайте мітку за допомогою `open --label`, `tab new --label` або `tab label`; приймаються мітки, ідентифікатори вкладок, необроблені ідентифікатори цілей і унікальні префікси ідентифікаторів цілей. Для сумісності поле запиту досі має назву `targetId`, але приймає будь-яке з цих посилань на вкладку.

Необроблені ідентифікатори цілей — це мінливі діагностичні дескриптори, а не довготривала пам’ять агента: коли Chromium замінює базову необроблену ціль під час навігації або надсилання форми, OpenClaw зберігає стабільний `tabId`/мітку, пов’язану з новою вкладкою, якщо може достовірно встановити відповідність. Надавайте перевагу `suggestedTargetId`.

## Знімок / знімок екрана / дії

Знімок:

```bash
openclaw browser snapshot
openclaw browser snapshot --urls
```

Знімок екрана:

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
openclaw browser screenshot --labels
```

- `--full-page` призначений лише для знімків сторінки; його не можна поєднувати з `--ref` або `--element`.
- Профілі `existing-session` / `user` підтримують знімки екрана сторінки та знімки екрана `--ref` із результатів знімка, але не знімки екрана за CSS `--element`.
- `--labels` накладає посилання поточного знімка на знімок екрана. У профілях на основі Playwright він працює з `--full-page` (накладання на всю сторінку), `--ref` (накладання на обрізану ділянку елемента за посиланням ARIA) і `--element` (накладання на обрізану ділянку елемента за селектором CSS); у режимах обрізання за елементом мітки проєктуються відносно елемента. Відповідь також містить масив `annotations` (пропускається, якщо порожній) з обмежувальною рамкою кожного посилання: `ref`, `number`, `role`, необов’язковий `name` і `box: {x, y, width, height}` у системі координат захопленого зображення (область перегляду / повна сторінка / відносно елемента).
  Профілі `existing-session` відображають накладання chrome-mcp на знімках екрана сторінки, але не використовують допоміжний засіб проєкції Playwright і не містять `annotations`; знімки екрана за CSS `--element` там не підтримуються. Без Playwright або chrome-mcp знімки екрана з мітками недоступні.
- `snapshot --urls` додає знайдені адреси посилань до знімків для ШІ, щоб агенти могли вибирати безпосередні цілі навігації замість припущень лише на основі тексту посилання.

Навігація/клацання/введення (автоматизація інтерфейсу на основі посилань):

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
openclaw browser click-coords 120 340
openclaw browser type <ref> "hello"
openclaw browser press Enter
openclaw browser hover <ref>
openclaw browser scrollintoview <ref>
openclaw browser drag <startRef> <endRef>
openclaw browser select <ref> OptionA OptionB
openclaw browser fill --fields '[{"ref":"1","value":"Ada"}]'
openclaw browser wait --text "Done"
openclaw browser evaluate --fn '(el) => el.textContent' --ref <ref>
openclaw browser evaluate --fn 'const title = document.title; return title;'
openclaw browser evaluate --timeout-ms 30000 --fn 'async () => { await window.ready; return true; }'
```

`evaluate --fn` приймає вихідний код функції, вираз або тіло інструкції. Тіла інструкцій обгортаються в асинхронні функції, тому використовуйте `return` для значення, яке потрібно отримати. Використовуйте `--timeout-ms`, якщо функції на боці сторінки може знадобитися більше часу, ніж типовий час очікування обчислення. `browser.evaluateEnabled=false` (типово: `true`) вимикає і `evaluate`, і `wait --fn`.

Відповіді на дії повертають поточний необроблений `targetId` після спричиненої дією заміни сторінки, якщо OpenClaw може достовірно визначити нову вкладку. Для довготривалих робочих процесів скриптам однаково слід зберігати й передавати `suggestedTargetId`/мітки.

Допоміжні засоби для файлів і діалогових вікон:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser upload media://inbound/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
```

Керовані профілі Chrome зберігають звичайні завантаження, ініційовані клацанням, у каталозі завантажень OpenClaw (типово `/tmp/openclaw/downloads` або налаштований кореневий каталог тимчасових файлів). Використовуйте `waitfordownload` або `download`, коли агенту потрібно дочекатися певного файлу й повернути шлях до нього; ці явні засоби очікування отримують наступне завантаження. Для передавання приймаються файли з кореневого каталогу тимчасових передавань OpenClaw і вхідні медіафайли під керуванням OpenClaw, зокрема посилання `media://inbound/<id>` і `media/inbound/<id>` із шляхами відносно пісочниці. Вкладені посилання на медіафайли, обхід каталогів і довільні локальні шляхи відхиляються.

Коли дія відкриває модальне діалогове вікно, відповідь на дію повертає `blockedByDialog` з `browserState.dialogs.pending`; передайте `--dialog-id`, щоб відповісти на нього безпосередньо. Діалогові вікна, оброблені поза OpenClaw, відображаються в `browserState.dialogs.recent`.

## Стан і сховище

Область перегляду й емуляція:

```bash
openclaw browser resize 1280 720
openclaw browser set viewport 1280 720
openclaw browser set offline on
openclaw browser set media dark
openclaw browser set timezone Europe/London
openclaw browser set locale en-GB
openclaw browser set geo 51.5074 -0.1278 --accuracy 25
openclaw browser set device "iPhone 14"
openclaw browser set headers '{"x-test":"1"}'
openclaw browser set credentials myuser mypass
```

Файли cookie + сховище:

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url https://example.com
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set token abc123
openclaw browser storage session clear
```

## Налагодження

```bash
openclaw browser console --level error
openclaw browser pdf
openclaw browser responsebody "**/api"
openclaw browser highlight <ref>
openclaw browser errors --clear
openclaw browser requests --filter api
openclaw browser trace start
openclaw browser trace stop --out trace.zip
```

## Наявний Chrome через MCP

Скористайтеся вбудованим профілем `user` або створіть власний профіль `existing-session`:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser create-profile --name chrome-port --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser --browser-profile chrome-live tabs
```

Стандартний шлях existing-session призначений для автоматичного підключення Chrome MCP лише на хості. Якщо браузер уже запущено з кінцевою точкою DevTools, передайте `--cdp-url`, щоб Chrome MCP натомість підключився до цієї кінцевої точки. Для Docker, Browserless або інших віддалених конфігурацій, де семантика Chrome MCP не потрібна, натомість використовуйте профіль CDP.

Поточні обмеження existing-session:

- Дії на основі знімків використовують посилання, а не селектори CSS.
- `browser.actionTimeoutMs` за замовчуванням установлює для підтримуваних запитів `act` значення 60000 мс, якщо виклики не вказують `timeoutMs`; значення `timeoutMs` для окремого виклику все одно має пріоритет.
- `click` підтримує лише клацання лівою кнопкою.
- `type` не підтримує `slowly=true`.
- `press` не підтримує `delayMs`.
- `hover`, `scrollintoview`, `drag`, `select` і `fill` відхиляють перевизначення часу очікування для окремих викликів; `evaluate` приймає `--timeout-ms`.
- `select` підтримує лише одне значення.
- `wait --load networkidle` не підтримується (працює з керованими та необробленими/віддаленими профілями CDP).
- Для завантаження файлів потрібні `--ref` / `--input-ref`; селектор CSS `--element` не підтримується, і одночасно можна завантажити лише один файл.
- Обробники діалогових вікон не підтримують `--timeout`.
- Знімки екрана підтримують захоплення сторінки та `--ref`, але не селектор CSS `--element`.
- Для `responsebody`, перехоплення завантажень, експорту PDF і пакетних дій усе ще потрібен керований браузер або необроблений профіль CDP.

## Віддалене керування браузером (проксі хоста Node)

Якщо Gateway працює на іншому комп’ютері, ніж браузер, запустіть **хост Node** на комп’ютері, де встановлено Chrome/Brave/Edge/Chromium. Gateway пересилає дії браузера на цей вузол через проксі; окремий сервер керування браузером не потрібен.

Використовуйте `gateway.nodes.browser.mode` для керування автоматичною маршрутизацією та `gateway.nodes.browser.node`, щоб закріпити конкретний вузол, якщо підключено кілька.

Безпека + віддалене налаштування: [Інструмент браузера](/uk/tools/browser), [Віддалений доступ](/uk/gateway/remote), [Tailscale](/uk/gateway/tailscale), [Безпека](/uk/gateway/security)

## Пов’язані матеріали

- [Довідник CLI](/uk/cli)
- [Браузер](/uk/tools/browser)
