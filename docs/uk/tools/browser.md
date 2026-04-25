---
read_when:
    - Додавання автоматизації браузера, керованої агентом
    - Налагодження причин, через які openclaw заважає роботі вашого Chrome
    - Реалізація налаштувань браузера та його життєвого циклу в застосунку macOS
summary: Інтегрована служба керування браузером + команди дій
title: Браузер (керований OpenClaw)
x-i18n:
    generated_at: "2026-04-25T18:14:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6379873662b21972493f62951c0fb87c4a9ec6350cec750acaf6a50235bd69c3
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw може запускати **окремий профіль Chrome/Brave/Edge/Chromium**, яким керує агент.
Він ізольований від вашого особистого браузера та керується через невелику локальну
службу керування всередині Gateway (лише loopback).

Пояснення для початківців:

- Думайте про нього як про **окремий браузер лише для агента**.
- Профіль `openclaw` **не** торкається вашого особистого профілю браузера.
- Агент може **відкривати вкладки, читати сторінки, натискати та вводити текст** у безпечному середовищі.
- Вбудований профіль `user` під’єднується до вашої справжньої авторизованої сесії Chrome через Chrome MCP.

## Що ви отримуєте

- Окремий профіль браузера з назвою **openclaw** (типово з помаранчевим акцентом).
- Детерміноване керування вкладками (список/відкрити/фокус/закрити).
- Дії агента (клік/введення/перетягування/вибір), знімки стану, скриншоти, PDF.
- Вбудований Skill `browser-automation`, який навчає агентів циклу роботи зі snapshot,
  stable-tab, stale-ref і відновленням після manual-blocker, коли ввімкнено
  Plugin браузера.
- Необов’язкова підтримка кількох профілів (`openclaw`, `work`, `remote`, ...).

Цей браузер **не** призначений для щоденного використання. Це безпечне, ізольоване середовище для
автоматизації та перевірки агентом.

## Швидкий початок

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Якщо ви отримуєте повідомлення “Browser disabled”, увімкніть його в конфігурації (див. нижче) і перезапустіть
Gateway.

Якщо `openclaw browser` взагалі відсутній або агент каже, що інструмент браузера
недоступний, перейдіть до [Відсутня команда або інструмент браузера](/uk/tools/browser#missing-browser-command-or-tool).

## Керування Plugin

Типовий інструмент `browser` — це вбудований Plugin. Вимкніть його, щоб замінити іншим Plugin, який реєструє той самий інструмент із назвою `browser`:

```json5
{
  plugins: {
    entries: {
      browser: {
        enabled: false,
      },
    },
  },
}
```

Для типових значень потрібні і `plugins.entries.browser.enabled`, і `browser.enabled=true`. Вимкнення лише Plugin прибирає CLI `openclaw browser`, метод Gateway `browser.request`, інструмент агента та службу керування як єдине ціле; ваша конфігурація `browser.*` при цьому залишається недоторканою для заміни.

Зміни конфігурації браузера вимагають перезапуску Gateway, щоб Plugin міг повторно зареєструвати свою службу.

## Вказівки для агента

Примітка щодо профілю інструментів: `tools.profile: "coding"` включає `web_search` і
`web_fetch`, але не включає повний інструмент `browser`. Якщо агент або
породжений субагент має використовувати автоматизацію браузера, додайте browser
на етапі профілю:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Для окремого агента використовуйте `agents.list[].tools.alsoAllow: ["browser"]`.
Одного лише `tools.subagents.tools.allow: ["browser"]` недостатньо, оскільки політика субагента
застосовується після фільтрації профілю.

Plugin браузера постачається з двома рівнями вказівок для агента:

- Опис інструмента `browser` містить компактний завжди активний контракт: вибирайте
  правильний профіль, зберігайте refs в межах тієї самої вкладки, використовуйте `tabId`/мітки для націлювання на вкладки та завантажуйте Skill браузера для багатокрокової роботи.
- Вбудований Skill `browser-automation` містить довший робочий цикл:
  спочатку перевірити status/tabs, позначити вкладки завдання, зробити snapshot перед дією,
  повторно знімати стан після змін UI, один раз відновлюватися після stale refs і повідомляти
  про login/2FA/captcha або блокування camera/microphone як про ручну дію, а не вгадувати.

Skills, що постачаються разом із Plugin, перелічуються в доступних Skills агента, коли
Plugin увімкнено. Повні інструкції Skill завантажуються на вимогу, тому звичайні
сеанси не оплачують повну вартість у токенах.

## Відсутня команда або інструмент браузера

Якщо після оновлення `openclaw browser` невідомий, `browser.request` відсутній або агент повідомляє, що інструмент браузера недоступний, звичайна причина — список `plugins.allow`, у якому немає `browser`. Додайте його:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true` і `tools.alsoAllow: ["browser"]` не замінюють членство в allowlist — allowlist керує завантаженням Plugin, а політика інструментів запускається лише після завантаження. Видалення `plugins.allow` повністю також відновлює типову поведінку.

## Профілі: `openclaw` vs `user`

- `openclaw`: керований, ізольований браузер (розширення не потрібне).
- `user`: вбудований профіль під’єднання Chrome MCP до вашої **справжньої авторизованої сесії Chrome**.

Для викликів інструмента браузера агентом:

- Типово: використовуйте ізольований браузер `openclaw`.
- Надавайте перевагу `profile="user"`, коли важливі вже наявні авторизовані сесії і користувач
  перебуває за комп’ютером, щоб натиснути/підтвердити будь-який запит на під’єднання.
- `profile` — це явне перевизначення, коли ви хочете конкретний режим браузера.

Установіть `browser.defaultProfile: "openclaw"`, якщо хочете, щоб типовим був керований режим.

## Конфігурація

Налаштування браузера зберігаються в `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // типово: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // вмикайте лише для довіреного доступу до приватної мережі
      // allowPrivateNetwork: true, // застарілий псевдонім
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // застаріле перевизначення одного профілю
    remoteCdpTimeoutMs: 1500, // тайм-аут HTTP віддаленого CDP (мс)
    remoteCdpHandshakeTimeoutMs: 3000, // тайм-аут рукостискання WebSocket віддаленого CDP (мс)
    localLaunchTimeoutMs: 15000, // тайм-аут виявлення локального керованого Chrome (мс)
    localCdpReadyTimeoutMs: 8000, // тайм-аут готовності локального керованого CDP після запуску (мс)
    actionTimeoutMs: 60000, // типовий тайм-аут дій браузера (мс)
    tabCleanup: {
      enabled: true, // типово: true
      idleMinutes: 120, // установіть 0, щоб вимкнути очищення неактивних вкладок
      maxTabsPerSession: 8, // установіть 0, щоб вимкнути ліміт на сеанс
      sweepMinutes: 5,
    },
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        headless: true,
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
      user: {
        driver: "existing-session",
        attachOnly: true,
        color: "#00AA00",
      },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
  },
}
```

<AccordionGroup>

<Accordion title="Порти та доступність">

- Служба керування прив’язується до loopback на порті, похідному від `gateway.port` (типово `18791` = Gateway + 2). Перевизначення `gateway.port` або `OPENCLAW_GATEWAY_PORT` зсуває похідні порти в тому самому сімействі.
- Локальні профілі `openclaw` автоматично призначають `cdpPort`/`cdpUrl`; задавайте їх лише для віддаленого CDP. Якщо `cdpUrl` не задано, типово використовується локальний керований порт CDP.
- `remoteCdpTimeoutMs` застосовується до перевірок доступності HTTP віддаленого та `attachOnly` CDP, а також до HTTP-запитів відкриття вкладок; `remoteCdpHandshakeTimeoutMs` застосовується до їхніх рукостискань WebSocket CDP.
- `localLaunchTimeoutMs` — це бюджет часу для локально запущеного керованого процесу Chrome,
  щоб він відкрив свою кінцеву точку HTTP CDP. `localCdpReadyTimeoutMs` — це
  подальший бюджет для готовності websocket CDP після виявлення процесу.
  Збільшуйте ці значення на Raspberry Pi, недорогих VPS або старішому обладнанні, де Chromium
  запускається повільно. Значення обмежені 120000 мс.
- `actionTimeoutMs` — це типовий бюджет часу для запитів browser `act`, коли викликаюча сторона не передає `timeoutMs`. Клієнтський транспорт додає невелике вікно запасу, щоб довгі очікування могли завершитися, а не обривалися на межі HTTP.
- `tabCleanup` — це очищення за принципом best-effort для вкладок, відкритих основними агентськими сеансами браузера. Очищення життєвого циклу субагента, Cron і ACP усе ще закриває їхні явно відстежувані вкладки наприкінці сеансу; основні сеанси зберігають активні вкладки придатними до повторного використання, а потім закривають неактивні або надлишкові відстежувані вкладки у фоновому режимі.

</Accordion>

<Accordion title="Політика SSRF">

- Навігація браузера та відкриття вкладок захищені від SSRF перед навігацією і повторно перевіряються за принципом best-effort на фінальному URL `http(s)` після цього.
- У строгому режимі SSRF також перевіряються виявлення віддаленої кінцевої точки CDP і проби `/json/version` (`cdpUrl`).
- Змінні середовища Gateway/provider `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` і `NO_PROXY` не проксіюють браузер, керований OpenClaw, автоматично. Керований Chrome типово запускається напряму, щоб налаштування проксі постачальника не послаблювали перевірки SSRF браузера.
- Щоб проксіювати сам керований браузер, передайте явні прапорці проксі Chrome через `browser.extraArgs`, наприклад `--proxy-server=...` або `--proxy-pac-url=...`. Строгий режим SSRF блокує явну проксі-маршрутизацію браузера, якщо доступ браузера до приватної мережі не ввімкнено навмисно.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` типово вимкнено; вмикайте лише тоді, коли доступ браузера до приватної мережі навмисно вважається довіреним.
- `browser.ssrfPolicy.allowPrivateNetwork` і надалі підтримується як застарілий псевдонім.

</Accordion>

<Accordion title="Поведінка профілю">

- `attachOnly: true` означає ніколи не запускати локальний браузер; лише під’єднуватися, якщо він уже запущений.
- `headless` можна задавати глобально або для кожного локального керованого профілю. Значення на рівні профілю мають пріоритет над `browser.headless`, тому один локально запущений профіль може залишатися headless, тоді як інший буде видимим.
- `POST /start?headless=true` і `openclaw browser start --headless` запитують
  одноразовий запуск у режимі headless для локальних керованих профілів без переписування
  `browser.headless` або конфігурації профілю. Профілі existing-session, attach-only і
  remote CDP відхиляють це перевизначення, оскільки OpenClaw не запускає ці
  процеси браузера.
- На хостах Linux без `DISPLAY` або `WAYLAND_DISPLAY` локальні керовані профілі
  автоматично переходять у режим headless, коли ні середовище, ні глобальна/профільна
  конфігурація явно не вибирає режим із вікном. `openclaw browser status --json`
  повідомляє `headlessSource` як `env`, `profile`, `config`,
  `request`, `linux-display-fallback` або `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` примусово вмикає headless для локальних керованих запусків у
  поточному процесі. `OPENCLAW_BROWSER_HEADLESS=0` примусово вмикає режим із вікном для звичайних
  запусків і повертає придатну до дії помилку на хостах Linux без сервера дисплея;
  явний запит `start --headless` усе одно має пріоритет для цього одного запуску.
- `executablePath` можна задавати глобально або для кожного локального керованого профілю. Значення на рівні профілю мають пріоритет над `browser.executablePath`, тому різні керовані профілі можуть запускати різні браузери на основі Chromium.
- `color` (верхній рівень і рівень профілю) тонує UI браузера, щоб ви бачили, який профіль активний.
- Типовий профіль — `openclaw` (керований автономний). Використовуйте `defaultProfile: "user"`, щоб перейти до браузера авторизованого користувача.
- Порядок автовиявлення: системний типовий браузер, якщо він на базі Chromium; інакше Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` використовує Chrome DevTools MCP замість сирого CDP. Не задавайте `cdpUrl` для цього драйвера.
- Установіть `browser.profiles.<name>.userDataDir`, коли профіль existing-session має під’єднуватися до нетипового профілю користувача Chromium (Brave, Edge тощо).

</Accordion>

</AccordionGroup>

## Використання Brave (або іншого браузера на базі Chromium)

Якщо ваш **системний типовий** браузер базується на Chromium (Chrome/Brave/Edge тощо),
OpenClaw використовує його автоматично. Установіть `browser.executablePath`, щоб перевизначити
автовиявлення. `~` розгортається до домашнього каталогу вашої ОС:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

Або задайте це в конфігурації для кожної платформи:

<Tabs>
  <Tab title="macOS">
```json5
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  },
}
```
  </Tab>
  <Tab title="Windows">
```json5
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
  },
}
```
  </Tab>
  <Tab title="Linux">
```json5
{
  browser: {
    executablePath: "/usr/bin/brave-browser",
  },
}
```
  </Tab>
</Tabs>

`executablePath` на рівні профілю впливає лише на локальні керовані профілі, які
запускає OpenClaw. Профілі `existing-session` натомість під’єднуються до вже запущеного браузера,
а віддалені профілі CDP використовують браузер за `cdpUrl`.

## Локальне vs віддалене керування

- **Локальне керування (типово):** Gateway запускає loopback-службу керування і може запускати локальний браузер.
- **Віддалене керування (вузол Node):** запустіть вузол Node на машині, де є браузер; Gateway проксіюватиме до нього дії браузера.
- **Віддалений CDP:** установіть `browser.profiles.<name>.cdpUrl` (або `browser.cdpUrl`), щоб
  під’єднатися до віддаленого браузера на базі Chromium. У цьому разі OpenClaw не запускатиме локальний браузер.
- Для зовнішньо керованих служб CDP на loopback (наприклад, Browserless у
  Docker, опублікований на `127.0.0.1`), також установіть `attachOnly: true`. CDP на loopback
  без `attachOnly` розглядається як локальний профіль браузера, керований OpenClaw.
- `headless` впливає лише на локальні керовані профілі, які запускає OpenClaw. Він не перезапускає і не змінює браузери existing-session або віддалені CDP.
- `executablePath` підпорядковується тому самому правилу локального керованого профілю. Його зміна на
  запущеному локальному керованому профілі позначає цей профіль для перезапуску/узгодження, щоб
  наступний запуск використовував новий бінарний файл.

Поведінка зупинки відрізняється залежно від режиму профілю:

- локальні керовані профілі: `openclaw browser stop` зупиняє процес браузера, який
  запустив OpenClaw
- профілі attach-only і віддалені профілі CDP: `openclaw browser stop` закриває активний
  сеанс керування та скидає перевизначення емуляції Playwright/CDP (viewport,
  колірну схему, локаль, часовий пояс, офлайн-режим і подібний стан), навіть
  якщо OpenClaw не запускав жодного процесу браузера

URL віддаленого CDP можуть містити автентифікацію:

- Токени в query (наприклад, `https://provider.example?token=<token>`)
- HTTP Basic auth (наприклад, `https://user:pass@provider.example`)

OpenClaw зберігає автентифікацію під час виклику кінцевих точок `/json/*` і під час підключення
до WebSocket CDP. Для токенів краще використовувати змінні середовища або менеджери секретів,
а не комітити їх у файли конфігурації.

## Проксі браузера Node (нульова конфігурація за замовчуванням)

Якщо ви запускаєте **вузол Node** на машині, де є ваш браузер, OpenClaw може
автоматично спрямовувати виклики інструмента браузера до цього вузла без додаткової конфігурації браузера.
Це типовий шлях для віддалених Gateway.

Примітки:

- Вузол Node надає свій локальний сервер керування браузером через **команду проксі**.
- Профілі надходять із власної конфігурації вузла `browser.profiles` (так само, як локально).
- `nodeHost.browserProxy.allowProfiles` є необов’язковим. Залиште його порожнім для застарілої/типової поведінки: усі налаштовані профілі залишаються доступними через проксі, включно з маршрутами створення/видалення профілів.
- Якщо ви задаєте `nodeHost.browserProxy.allowProfiles`, OpenClaw трактує це як межу найменших привілеїв: можна націлюватися лише на профілі з allowlist, а маршрути створення/видалення постійних профілів блокуються на поверхні проксі.
- Вимкніть, якщо не хочете цього:
  - На вузлі: `nodeHost.browserProxy.enabled=false`
  - На Gateway: `gateway.nodes.browser.mode="off"`

## Browserless (розміщений віддалений CDP)

[Browserless](https://browserless.io) — це розміщений сервіс Chromium, який надає
URL підключення CDP через HTTPS і WebSocket. OpenClaw може використовувати обидві форми, але
для віддаленого профілю браузера найпростішим варіантом є прямий URL WebSocket
із документації Browserless щодо підключення.

Приклад:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    remoteCdpTimeoutMs: 2000,
    remoteCdpHandshakeTimeoutMs: 4000,
    profiles: {
      browserless: {
        cdpUrl: "wss://production-sfo.browserless.io?token=<BROWSERLESS_API_KEY>",
        color: "#00AA00",
      },
    },
  },
}
```

Примітки:

- Замініть `<BROWSERLESS_API_KEY>` своїм справжнім токеном Browserless.
- Виберіть кінцеву точку регіону, що відповідає вашому обліковому запису Browserless (див. їхню документацію).
- Якщо Browserless надає вам базовий URL HTTPS, ви можете або перетворити його на
  `wss://` для прямого CDP-підключення, або залишити URL HTTPS і дозволити OpenClaw
  виявити `/json/version`.

### Browserless Docker на тому самому хості

Коли Browserless самостійно розміщено в Docker, а OpenClaw працює на хості, розглядайте
Browserless як зовнішньо керований сервіс CDP:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    profiles: {
      browserless: {
        cdpUrl: "ws://127.0.0.1:3000",
        attachOnly: true,
        color: "#00AA00",
      },
    },
  },
}
```

Адреса в `browser.profiles.browserless.cdpUrl` має бути досяжною з процесу
OpenClaw. Browserless також має повідомляти відповідну досяжну кінцеву точку;
установіть Browserless `EXTERNAL` на ту саму WebSocket-базу, публічно доступну для OpenClaw, наприклад
`ws://127.0.0.1:3000`, `ws://browserless:3000` або стабільну приватну адресу
мережі Docker. Якщо `/json/version` повертає `webSocketDebuggerUrl`, що вказує на
адресу, недосяжну для OpenClaw, HTTP CDP може виглядати справним, тоді як
під’єднання WebSocket усе одно не вдасться.

Не залишайте `attachOnly` незаданим для loopback-профілю Browserless. Без
`attachOnly` OpenClaw трактує порт loopback як локальний керований профіль браузера
і може повідомляти, що порт уже використовується, але не належить OpenClaw.

## Постачальники прямого WebSocket CDP

Деякі розміщені сервіси браузерів надають **пряму кінцеву точку WebSocket**, а не
стандартне HTTP-виявлення CDP (`/json/version`). OpenClaw приймає три форми URL CDP
і автоматично вибирає правильну стратегію підключення:

- **HTTP(S)-виявлення** — `http://host[:port]` або `https://host[:port]`.
  OpenClaw викликає `/json/version`, щоб виявити URL відлагоджувача WebSocket, а потім
  підключається. Резервного переходу на WebSocket немає.
- **Прямі кінцеві точки WebSocket** — `ws://host[:port]/devtools/<kind>/<id>` або
  `wss://...` зі шляхом `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw підключається напряму через рукостискання WebSocket і повністю пропускає
  `/json/version`.
- **Голі корені WebSocket** — `ws://host[:port]` або `wss://host[:port]` без
  шляху `/devtools/...` (наприклад, [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw спочатку пробує HTTP-виявлення
  `/json/version` (нормалізуючи схему до `http`/`https`);
  якщо виявлення повертає `webSocketDebuggerUrl`, він використовується, інакше OpenClaw
  переходить до прямого рукостискання WebSocket на голому корені. Якщо оголошена
  кінцева точка WebSocket відхиляє рукостискання CDP, але налаштований голий корінь
  його приймає, OpenClaw також переходить на цей корінь. Це дозволяє голому `ws://`,
  спрямованому на локальний Chrome, усе одно підключатися, оскільки Chrome приймає WebSocket
  upgrades лише на конкретному шляху для цілі з `/json/version`, тоді як розміщені
  постачальники можуть і далі використовувати свою кореневу кінцеву точку WebSocket, коли їхня кінцева точка
  виявлення оголошує короткоживучий URL, непридатний для Playwright CDP.

### Browserbase

[Browserbase](https://www.browserbase.com) — це хмарна платформа для запуску
headless-браузерів із вбудованим розв’язанням CAPTCHA, stealth mode і residential
proxies.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserbase",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      browserbase: {
        cdpUrl: "wss://connect.browserbase.com?apiKey=<BROWSERBASE_API_KEY>",
        color: "#F97316",
      },
    },
  },
}
```

Примітки:

- [Зареєструйтеся](https://www.browserbase.com/sign-up) і скопіюйте свій **API Key**
  з [панелі Overview](https://www.browserbase.com/overview).
- Замініть `<BROWSERBASE_API_KEY>` своїм справжнім API key Browserbase.
- Browserbase автоматично створює сеанс браузера під час підключення WebSocket, тому
  ручний крок створення сеансу не потрібен.
- Безплатний тариф дозволяє один одночасний сеанс і одну browser hour на місяць.
  Обмеження платних планів див. у [pricing](https://www.browserbase.com/pricing).
- Повний довідник API, посібники SDK і приклади інтеграції див. у [документації Browserbase](https://docs.browserbase.com).

## Безпека

Ключові ідеї:

- Керування браузером доступне лише через loopback; доступ проходить через автентифікацію Gateway або спарювання вузлів.
- Автономний loopback HTTP API браузера використовує **лише автентифікацію за спільним секретом**:
  bearer auth токеном Gateway, `x-openclaw-password` або HTTP Basic auth із
  налаштованим паролем Gateway.
- Заголовки ідентичності Tailscale Serve і `gateway.auth.mode: "trusted-proxy"`
  **не** автентифікують цей автономний loopback API браузера.
- Якщо керування браузером увімкнено, а автентифікацію за спільним секретом не налаштовано, OpenClaw
  автоматично генерує `gateway.auth.token` під час запуску і зберігає його в конфігурації.
- OpenClaw **не** генерує цей токен автоматично, якщо `gateway.auth.mode` уже має значення
  `password`, `none` або `trusted-proxy`.
- Тримайте Gateway і будь-які вузли Node у приватній мережі (Tailscale); уникайте публічного доступу.
- Ставтеся до URL/токенів віддаленого CDP як до секретів; віддавайте перевагу змінним середовища або менеджеру секретів.

Поради щодо віддаленого CDP:

- За можливості віддавайте перевагу зашифрованим кінцевим точкам (HTTPS або WSS) і короткоживучим токенам.
- Уникайте вбудовування довгоживучих токенів безпосередньо у файли конфігурації.

## Профілі (кілька браузерів)

OpenClaw підтримує кілька іменованих профілів (конфігурацій маршрутизації). Профілі можуть бути такими:

- **керовані OpenClaw**: окремий екземпляр браузера на базі Chromium із власним каталогом даних користувача + портом CDP
- **віддалені**: явний URL CDP (браузер на базі Chromium, що працює деінде)
- **наявний сеанс**: ваш наявний профіль Chrome через автопідключення Chrome DevTools MCP

Типові значення:

- Профіль `openclaw` створюється автоматично, якщо його немає.
- Профіль `user` вбудований для під’єднання existing-session через Chrome MCP.
- Профілі existing-session, окрім `user`, вмикаються за бажанням; створюйте їх за допомогою `--driver existing-session`.
- Локальні порти CDP типово виділяються з діапазону **18800–18899**.
- Видалення профілю переміщує його локальний каталог даних до Trash.

Усі кінцеві точки керування приймають `?profile=<name>`; CLI використовує `--browser-profile`.

## Наявний сеанс через Chrome DevTools MCP

OpenClaw також може під’єднуватися до запущеного профілю браузера на базі Chromium через
офіційний сервер Chrome DevTools MCP. Це повторно використовує вкладки та стан входу,
які вже відкриті в цьому профілі браузера.

Офіційні довідкові матеріали й посилання на налаштування:

- [Chrome for Developers: Використання Chrome DevTools MCP із сеансом браузера](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Вбудований профіль:

- `user`

Необов’язково: створіть власний профіль existing-session, якщо хочете
іншу назву, колір або каталог даних браузера.

Типова поведінка:

- Вбудований профіль `user` використовує автопідключення Chrome MCP, яке націлюється на
  типовий локальний профіль Google Chrome.

Використовуйте `userDataDir` для Brave, Edge, Chromium або нетипового профілю Chrome:

```json5
{
  browser: {
    profiles: {
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
    },
  },
}
```

Потім у відповідному браузері:

1. Відкрийте сторінку inspect цього браузера для віддаленого налагодження.
2. Увімкніть віддалене налагодження.
3. Не закривайте браузер і підтвердіть запит на підключення, коли OpenClaw під’єднається.

Поширені сторінки inspect:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Тест live attach smoke:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

Ознаки успішної роботи:

- `status` показує `driver: existing-session`
- `status` показує `transport: chrome-mcp`
- `status` показує `running: true`
- `tabs` перелічує вже відкриті вкладки вашого браузера
- `snapshot` повертає refs із вибраної активної вкладки

Що перевірити, якщо під’єднання не працює:

- цільовий браузер на базі Chromium має версію `144+`
- у сторінці inspect цього браузера ввімкнено віддалене налагодження
- браузер показав запит на під’єднання, і ви його підтвердили
- `openclaw doctor` переносить стару конфігурацію браузера на основі розширення та перевіряє,
  що Chrome локально встановлено для типових профілів автопідключення, але він не може
  увімкнути віддалене налагодження на боці браузера замість вас

Використання агентом:

- Використовуйте `profile="user"`, коли вам потрібен авторизований стан браузера користувача.
- Якщо ви використовуєте власний профіль existing-session, передайте явну назву цього профілю.
- Обирайте цей режим лише тоді, коли користувач перебуває за комп’ютером, щоб підтвердити
  запит на під’єднання.
- Gateway або вузол Node може запускати `npx chrome-devtools-mcp@latest --autoConnect`

Примітки:

- Цей шлях ризикованіший, ніж ізольований профіль `openclaw`, оскільки він може
  виконувати дії у вашій авторизованій сесії браузера.
- OpenClaw не запускає браузер для цього драйвера; він лише під’єднується.
- Тут OpenClaw використовує офіційний потік Chrome DevTools MCP `--autoConnect`. Якщо
  задано `userDataDir`, він передається далі для націлювання на цей каталог даних користувача.
- Existing-session може під’єднуватися на вибраному хості або через підключений
  вузол браузера. Якщо Chrome працює деінде й жоден вузол браузера не підключено, використовуйте
  віддалений CDP або вузол Node.

### Власний запуск Chrome MCP

Перевизначте сервер Chrome DevTools MCP, що запускається, для кожного профілю, якщо типовий
потік `npx chrome-devtools-mcp@latest` вам не підходить (офлайн-хости,
закріплені версії, vendored binary):

| Поле        | Що воно робить                                                                                                             |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Виконуваний файл, який запускається замість `npx`. Розв’язується як є; абсолютні шляхи підтримуються.                     |
| `mcpArgs`    | Масив аргументів, який передається дослівно до `mcpCommand`. Замінює типові аргументи `chrome-devtools-mcp@latest --autoConnect`. |

Коли `cdpUrl` задано для профілю existing-session, OpenClaw пропускає
`--autoConnect` і автоматично передає кінцеву точку до Chrome MCP:

- `http(s)://...` → `--browserUrl <url>` (кінцева точка HTTP-виявлення DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (прямий WebSocket CDP).

Прапорці кінцевої точки та `userDataDir` не можна поєднувати: коли задано `cdpUrl`,
`userDataDir` ігнорується під час запуску Chrome MCP, оскільки Chrome MCP під’єднується до
запущеного браузера за цією кінцевою точкою, а не відкриває каталог
профілю.

<Accordion title="Обмеження можливостей existing-session">

Порівняно з керованим профілем `openclaw`, драйвери existing-session мають більше обмежень:

- **Скриншоти** — працюють захоплення сторінки та захоплення елементів через `--ref`; CSS-селектори `--element` не підтримуються. `--full-page` не можна поєднувати з `--ref` або `--element`. Для скриншотів сторінки чи елементів за ref Playwright не потрібен.
- **Дії** — `click`, `type`, `hover`, `scrollIntoView`, `drag` і `select` потребують refs зі snapshot (без CSS-селекторів). `click-coords` натискає по видимих координатах viewport і не потребує snapshot ref. `click` підтримує лише ліву кнопку миші. `type` не підтримує `slowly=true`; використовуйте `fill` або `press`. `press` не підтримує `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` і `evaluate` не підтримують тайм-аути на рівні окремого виклику. `select` приймає одне значення.
- **Очікування / завантаження / діалог** — `wait --url` підтримує точний збіг, підрядок і glob-шаблони; `wait --load networkidle` не підтримується. Хуки завантаження файлів вимагають `ref` або `inputRef`, по одному файлу за раз, без CSS `element`. Хуки діалогів не підтримують перевизначення тайм-ауту.
- **Функції лише для керованого режиму** — пакетні дії, експорт PDF, перехоплення завантажень і `responsebody` досі вимагають шляху керованого браузера.

</Accordion>

## Гарантії ізоляції

- **Окремий каталог даних користувача**: ніколи не торкається вашого особистого профілю браузера.
- **Окремі порти**: уникає `9222`, щоб запобігти конфліктам із робочими процесами розробки.
- **Детерміноване керування вкладками**: `tabs` спочатку повертає `suggestedTargetId`, потім
  стабільні дескриптори `tabId`, такі як `t1`, необов’язкові мітки та сирий `targetId`.
  Агентам слід повторно використовувати `suggestedTargetId`; сирі id залишаються доступними для
  налагодження та сумісності.

## Вибір браузера

Під час локального запуску OpenClaw вибирає перший доступний:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Ви можете перевизначити це через `browser.executablePath`.

Платформи:

- macOS: перевіряє `/Applications` і `~/Applications`.
- Linux: перевіряє типові розташування Chrome/Brave/Edge/Chromium у `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` і
  `/usr/lib/chromium-browser`.
- Windows: перевіряє типові місця встановлення.

## API керування (необов’язково)

Для скриптів і налагодження Gateway надає невеликий **HTTP API керування
лише через loopback** плюс відповідний CLI `openclaw browser` (snapshot, refs, wait
power-ups, вивід JSON, робочі процеси налагодження). Повну довідку див. у
[API керування браузером](/uk/tools/browser-control).

## Усунення несправностей

Для проблем, специфічних для Linux (особливо snap Chromium), див.
[Усунення несправностей браузера](/uk/tools/browser-linux-troubleshooting).

Для конфігурацій WSL2 Gateway + Windows Chrome на розділених хостах див.
[WSL2 + Windows + усунення несправностей віддаленого Chrome CDP](/uk/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Помилка запуску CDP vs блокування навігації SSRF

Це різні класи збоїв, і вони вказують на різні шляхи коду.

- **Помилка запуску або готовності CDP** означає, що OpenClaw не може підтвердити справність площини керування браузером.
- **Блокування навігації SSRF** означає, що площина керування браузером справна, але ціль навігації сторінкою відхилено політикою.

Поширені приклади:

- Помилка запуску або готовності CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw`, коли
    зовнішню loopback-службу CDP налаштовано без `attachOnly: true`
- Блокування навігації SSRF:
  - потоки `open`, `navigate`, snapshot або відкриття вкладок завершуються з помилкою політики браузера/мережі, тоді як `start` і `tabs` усе ще працюють

Використайте цю мінімальну послідовність, щоб відрізнити одне від іншого:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Як читати результати:

- Якщо `start` завершується помилкою `not reachable after start`, спочатку усувайте проблему готовності CDP.
- Якщо `start` успішний, але `tabs` завершується помилкою, площина керування все ще несправна. Розглядайте це як проблему доступності CDP, а не проблему навігації сторінкою.
- Якщо `start` і `tabs` успішні, але `open` або `navigate` завершується помилкою, площина керування браузером працює, а збій пов’язаний із політикою навігації або цільовою сторінкою.
- Якщо `start`, `tabs` і `open` усі успішні, базовий шлях керування керованим браузером справний.

Важливі деталі поведінки:

- Конфігурація браузера типово використовує fail-closed об’єкт політики SSRF, навіть якщо ви не задаєте `browser.ssrfPolicy`.
- Для локального loopback-профілю `openclaw`, керованого OpenClaw, перевірки справності CDP навмисно пропускають перевірку доступності SSRF браузера для власної локальної площини керування OpenClaw.
- Захист навігації є окремим. Успішний результат `start` або `tabs` не означає, що пізніша ціль `open` або `navigate` буде дозволена.

Рекомендації з безпеки:

- **Не** послаблюйте політику SSRF браузера типово.
- Віддавайте перевагу вузьким виняткам для вузлів, таким як `hostnameAllowlist` або `allowedHostnames`, замість широкого доступу до приватної мережі.
- Використовуйте `dangerouslyAllowPrivateNetwork: true` лише в навмисно довірених середовищах, де доступ браузера до приватної мережі потрібен і перевірений.

## Інструменти агента + як працює керування

Агент отримує **один інструмент** для автоматизації браузера:

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Як це відображається:

- `browser snapshot` повертає стабільне дерево UI (AI або ARIA).
- `browser act` використовує id `ref` зі snapshot для click/type/drag/select.
- `browser screenshot` захоплює пікселі (повна сторінка, елемент або позначені refs).
- `browser doctor` перевіряє Gateway, Plugin, профіль, браузер і готовність вкладок.
- `browser` приймає:
  - `profile` для вибору іменованого профілю браузера (openclaw, chrome або віддалений CDP).
  - `target` (`sandbox` | `host` | `node`) для вибору, де розміщено браузер.
  - У sandbox-сеансах `target: "host"` вимагає `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Якщо `target` не задано: sandbox-сеанси типово використовують `sandbox`, сеанси без sandbox — `host`.
  - Якщо підключено вузол із підтримкою браузера, інструмент може автоматично спрямовуватися на нього, якщо ви явно не зафіксуєте `target="host"` або `target="node"`.

Це робить агента детермінованим і допомагає уникати крихких селекторів.

## Пов’язане

- [Огляд інструментів](/uk/tools) — усі доступні інструменти агента
- [Пісочниця](/uk/gateway/sandboxing) — керування браузером у sandbox-середовищах
- [Безпека](/uk/gateway/security) — ризики керування браузером і посилення захисту
