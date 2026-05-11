---
read_when:
    - Додавання автоматизації браузера, керованої агентом
    - Налагодження того, чому OpenClaw втручається в роботу вашого власного Chrome
    - Реалізація налаштувань браузера + життєвого циклу в застосунку macOS
summary: Інтегрована служба керування браузером + команди дій
title: Браузер (керований OpenClaw)
x-i18n:
    generated_at: "2026-05-11T20:59:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51a78cc860ef4951548aba1e60bc686dfc19c156f69b6a59cf7c671eeaa67a0a
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw може запускати **окремий профіль Chrome/Brave/Edge/Chromium**, яким керує агент.
Він ізольований від вашого особистого браузера й керується через невелику локальну
службу керування всередині Gateway (лише loopback).

Погляд для початківців:

- Сприймайте це як **окремий браузер лише для агента**.
- Профіль `openclaw` **не** зачіпає ваш особистий профіль браузера.
- Агент може **відкривати вкладки, читати сторінки, натискати й вводити текст** у безпечному режимі.
- Вбудований профіль `user` під'єднується до вашого реального сеансу Chrome із входом через Chrome MCP.

## Що ви отримуєте

- Окремий профіль браузера з назвою **openclaw** (типово з помаранчевим акцентом).
- Детерміноване керування вкладками (список/відкриття/фокус/закриття).
- Дії агента (натискання/введення/перетягування/вибір), знімки стану, скриншоти, PDF.
- Вбудований skill `browser-automation`, який навчає агентів циклу відновлення для snapshot,
  стабільних вкладок, застарілих посилань і ручних блокерів, коли Plugin браузера
  увімкнено.
- Необов'язкова підтримка кількох профілів (`openclaw`, `work`, `remote`, ...).

Цей браузер **не** призначений для щоденного користування. Це безпечна, ізольована поверхня для
автоматизації та перевірки агентом.

## Швидкий старт

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Якщо ви отримуєте "Browser disabled", увімкніть його в конфігурації (див. нижче) і перезапустіть
Gateway.

Якщо `openclaw browser` повністю відсутня або агент повідомляє, що інструмент браузера
недоступний, перейдіть до [Відсутня команда або інструмент браузера](/uk/tools/browser#missing-browser-command-or-tool).

## Керування Plugin

Типовий інструмент `browser` є вбудованим Plugin. Вимкніть його, щоб замінити іншим Plugin, який реєструє ту саму назву інструмента `browser`:

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

Для типових налаштувань потрібні і `plugins.entries.browser.enabled`, **і** `browser.enabled=true`. Вимкнення лише Plugin видаляє CLI `openclaw browser`, метод Gateway `browser.request`, інструмент агента та службу керування як єдиний блок; ваша конфігурація `browser.*` залишається незмінною для заміни.

Зміни конфігурації браузера потребують перезапуску Gateway, щоб Plugin міг повторно зареєструвати свою службу.

## Настанови для агента

Примітка щодо профілю інструментів: `tools.profile: "coding"` містить `web_search` і
`web_fetch`, але не містить повного інструмента `browser`. Якщо агент або
створений субагент має використовувати автоматизацію браузера, додайте браузер на етапі
профілю:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Для одного агента використовуйте `agents.list[].tools.alsoAllow: ["browser"]`.
Лише `tools.subagents.tools.allow: ["browser"]` недостатньо, тому що політика субагента
застосовується після фільтрації профілю.

Plugin браузера постачається з двома рівнями настанов для агента:

- Опис інструмента `browser` містить компактний постійно активний контракт: вибирайте
  правильний профіль, тримайте посилання в межах тієї самої вкладки, використовуйте `tabId`/мітки для
  вибору цільової вкладки та завантажуйте browser skill для багатоетапної роботи.
- Вбудований skill `browser-automation` містить довший робочий цикл:
  спочатку перевіряйте стан/вкладки, позначайте вкладки завдання, робіть snapshot перед дією, повторно робіть snapshot
  після змін UI, один раз відновлюйте застарілі посилання та повідомляйте про блокери входу/2FA/captcha або
  камери/мікрофона як про ручну дію замість здогадок.

Skills, вбудовані в Plugin, перелічені серед доступних Skills агента, коли
Plugin увімкнено. Повні інструкції skill завантажуються на вимогу, тому звичайні
ходи не сплачують повну вартість у токенах.

## Відсутня команда або інструмент браузера

Якщо `openclaw browser` невідома після оновлення, `browser.request` відсутній або агент повідомляє, що інструмент браузера недоступний, зазвичай причина полягає в списку `plugins.allow`, який не містить `browser`, і відсутності кореневого блока конфігурації `browser`. Додайте його:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Явний кореневий блок `browser`, наприклад `browser.enabled=true` або `browser.profiles.<name>`, активує вбудований Plugin браузера навіть за обмежувального `plugins.allow`, відповідно до поведінки конфігурації каналів. `plugins.entries.browser.enabled=true` і `tools.alsoAllow: ["browser"]` самі по собі не замінюють членство в allowlist. Повне видалення `plugins.allow` також відновлює типовий стан.

## Профілі: `openclaw` і `user`

- `openclaw`: керований, ізольований браузер (розширення не потрібне).
- `user`: вбудований профіль під'єднання Chrome MCP для вашого **реального сеансу Chrome із входом**.

Для викликів інструмента браузера агентом:

- Типово: використовуйте ізольований браузер `openclaw`.
- Надавайте перевагу `profile="user"`, коли важливі наявні сеанси з входом і користувач
  перебуває за комп'ютером, щоб натиснути/схвалити будь-який запит на під'єднання.
- `profile` є явним перевизначенням, коли потрібен конкретний режим браузера.

Установіть `browser.defaultProfile: "openclaw"`, якщо хочете, щоб керований режим був типовим.

## Конфігурація

Налаштування браузера зберігаються в `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // default: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // legacy single-profile override
    remoteCdpTimeoutMs: 1500, // remote CDP HTTP timeout (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // remote CDP WebSocket handshake timeout (ms)
    localLaunchTimeoutMs: 15000, // local managed Chrome discovery timeout (ms)
    localCdpReadyTimeoutMs: 8000, // local managed post-launch CDP readiness timeout (ms)
    actionTimeoutMs: 60000, // default browser act timeout (ms)
    tabCleanup: {
      enabled: true, // default: true
      idleMinutes: 120, // set 0 to disable idle cleanup
      maxTabsPerSession: 8, // set 0 to disable the per-session cap
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

- Служба керування прив'язується до loopback на порту, похідному від `gateway.port` (типово `18791` = gateway + 2). Перевизначення `gateway.port` або `OPENCLAW_GATEWAY_PORT` зміщує похідні порти в тій самій групі.
- Локальні профілі `openclaw` автоматично призначають `cdpPort`/`cdpUrl`; задавайте їх лише для віддаленого CDP. `cdpUrl` типово вказує на керований локальний порт CDP, якщо не заданий.
- `remoteCdpTimeoutMs` застосовується до перевірок HTTP-доступності віддаленого CDP і `attachOnly`,
  а також до HTTP-запитів відкриття вкладок; `remoteCdpHandshakeTimeoutMs` застосовується до
  їхніх WebSocket-рукостискань CDP.
- `localLaunchTimeoutMs` — це бюджет часу для локально запущеного керованого процесу Chrome,
  щоб відкрити свій HTTP-ендпоінт CDP. `localCdpReadyTimeoutMs` — це
  наступний бюджет для готовності CDP websocket після виявлення процесу.
  Збільшуйте ці значення на Raspberry Pi, слабких VPS або старішому обладнанні, де Chromium
  запускається повільно. Значення мають бути додатними цілими числами до `120000` мс; недійсні
  значення конфігурації відхиляються.
- Повторні помилки запуску/готовності керованого Chrome перериваються запобіжником окремо для
  кожного профілю. Після кількох послідовних помилок OpenClaw ненадовго призупиняє нові спроби
  запуску замість створення Chromium під час кожного виклику інструмента браузера. Виправте
  проблему запуску, вимкніть браузер, якщо він не потрібен, або перезапустіть
  Gateway після виправлення.
- `actionTimeoutMs` — типовий бюджет часу для запитів браузера `act`, коли викликач не передає `timeoutMs`. Клієнтський транспорт додає невелике резервне вікно, щоб довгі очікування могли завершитися замість тайм-ауту на HTTP-межі.
- `tabCleanup` — це best-effort очищення вкладок, відкритих сеансами браузера основного агента. Очищення життєвого циклу субагентів, cron і ACP усе одно закриває їхні явно відстежувані вкладки наприкінці сеансу; основні сеанси зберігають активні вкладки придатними для повторного використання, а потім у фоновому режимі закривають неактивні або зайві відстежувані вкладки.

</Accordion>

<Accordion title="Політика SSRF">

- Навігація браузера та відкриття вкладок захищені SSRF-перевіркою перед навігацією та, у межах best-effort, повторно перевіряються на фінальному URL `http(s)` після цього.
- У строгому режимі SSRF також перевіряються виявлення віддаленого ендпоінта CDP і проби `/json/version` (`cdpUrl`).
- Змінні середовища Gateway/provider `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` і `NO_PROXY` не проксіюють автоматично браузер, керований OpenClaw. Керований Chrome типово запускається напряму, щоб налаштування проксі провайдера не послаблювали SSRF-перевірки браузера.
- Щоб проксіювати сам керований браузер, передайте явні прапорці проксі Chrome через `browser.extraArgs`, наприклад `--proxy-server=...` або `--proxy-pac-url=...`. Строгий режим SSRF блокує явну маршрутизацію через проксі браузера, якщо доступ браузера до приватної мережі не ввімкнено навмисно.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` типово вимкнено; вмикайте лише тоді, коли доступ браузера до приватної мережі навмисно вважається довіреним.
- `browser.ssrfPolicy.allowPrivateNetwork` залишається підтримуваним як застарілий псевдонім.

</Accordion>

<Accordion title="Поведінка профілю">

- `attachOnly: true` означає: ніколи не запускати локальний браузер; лише підключатися, якщо він уже працює.
- `headless` можна задати глобально або для окремого локального керованого профілю. Значення на рівні профілю перевизначають `browser.headless`, тому один локально запущений профіль може залишатися headless, тоді як інший буде видимим.
- `POST /start?headless=true` і `openclaw browser start --headless` запитують
  одноразовий headless-запуск для локальних керованих профілів без перезапису
  `browser.headless` або конфігурації профілю. Профілі з наявним сеансом, attach-only і
  віддалені CDP-профілі відхиляють це перевизначення, оскільки OpenClaw не запускає ці
  браузерні процеси.
- На Linux-хостах без `DISPLAY` або `WAYLAND_DISPLAY` локальні керовані профілі
  автоматично використовують headless за замовчуванням, коли ні середовище, ні профільна/глобальна
  конфігурація явно не вибирає режим із видимим вікном. `openclaw browser status --json`
  повідомляє `headlessSource` як `env`, `profile`, `config`,
  `request`, `linux-display-fallback` або `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` примусово запускає локальні керовані профілі в headless для
  поточного процесу. `OPENCLAW_BROWSER_HEADLESS=0` примусово вмикає режим із видимим вікном для звичайних
  запусків і повертає дієву помилку на Linux-хостах без сервера відображення;
  явний запит `start --headless` усе одно має пріоритет для цього одного запуску.
- `executablePath` можна задати глобально або для окремого локального керованого профілю. Значення на рівні профілю перевизначають `browser.executablePath`, тому різні керовані профілі можуть запускати різні браузери на основі Chromium. Обидві форми приймають `~` для домашнього каталогу вашої ОС.
- `color` (верхнього рівня та на рівні профілю) підфарбовує UI браузера, щоб було видно, який профіль активний.
- Профіль за замовчуванням — `openclaw` (керований автономний). Використовуйте `defaultProfile: "user"`, щоб увімкнути браузер користувача з виконаним входом.
- Порядок автовиявлення: системний браузер за замовчуванням, якщо він на основі Chromium; інакше Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` використовує Chrome DevTools MCP замість необробленого CDP. Не задавайте `cdpUrl` для цього драйвера.
- Задайте `browser.profiles.<name>.userDataDir`, коли профіль existing-session має підключатися до нестандартного профілю користувача Chromium (Brave, Edge тощо). Цей шлях також приймає `~` для домашнього каталогу вашої ОС.

</Accordion>

</AccordionGroup>

## Використання Brave або іншого браузера на основі Chromium

Якщо ваш **системний браузер за замовчуванням** побудований на Chromium (Chrome/Brave/Edge/тощо),
OpenClaw використовує його автоматично. Задайте `browser.executablePath`, щоб перевизначити
автовиявлення. Значення `executablePath` верхнього рівня та на рівні профілю приймають `~`
для домашнього каталогу вашої ОС:

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

`executablePath` на рівні профілю впливає лише на локальні керовані профілі, які OpenClaw
запускає. Профілі `existing-session` натомість підключаються до вже запущеного браузера,
а віддалені CDP-профілі використовують браузер за `cdpUrl`.

## Локальне й віддалене керування

- **Локальне керування (за замовчуванням):** Gateway запускає службу керування loopback і може запускати локальний браузер.
- **Віддалене керування (node host):** запустіть node host на машині, де є браузер; Gateway проксіює дії браузера до нього.
- **Віддалений CDP:** задайте `browser.profiles.<name>.cdpUrl` (або `browser.cdpUrl`), щоб
  підключитися до віддаленого браузера на основі Chromium. У цьому разі OpenClaw не запускатиме локальний браузер.
- Для зовнішньо керованих CDP-сервісів на loopback (наприклад, Browserless у
  Docker, опублікований на `127.0.0.1`) також задайте `attachOnly: true`. Loopback CDP
  без `attachOnly` обробляється як локальний профіль браузера, керований OpenClaw.
- `headless` впливає лише на локальні керовані профілі, які запускає OpenClaw. Він не перезапускає й не змінює браузери existing-session або віддалені CDP-браузери.
- `executablePath` дотримується того самого правила локального керованого профілю. Його зміна для
  запущеного локального керованого профілю позначає цей профіль для перезапуску/узгодження, щоб
  наступний запуск використав новий двійковий файл.

Поведінка зупинки відрізняється залежно від режиму профілю:

- локальні керовані профілі: `openclaw browser stop` зупиняє браузерний процес, який
  запустив OpenClaw
- attach-only і віддалені CDP-профілі: `openclaw browser stop` закриває активний
  сеанс керування та звільняє перевизначення емуляції Playwright/CDP (viewport,
  колірна схема, locale, timezone, offline mode і подібний стан), навіть
  якщо OpenClaw не запускав браузерний процес

Віддалені CDP URL можуть містити автентифікацію:

- Токени запиту (наприклад, `https://provider.example?token=<token>`)
- HTTP Basic auth (наприклад, `https://user:pass@provider.example`)

OpenClaw зберігає автентифікацію під час виклику `/json/*` endpoint-ів і під час підключення
до CDP WebSocket. Надавайте перевагу змінним середовища або менеджерам секретів для
токенів замість коміту їх у конфігураційні файли.

## Node-проксі браузера (нульова конфігурація за замовчуванням)

Якщо ви запускаєте **node host** на машині, де є ваш браузер, OpenClaw може
автоматично маршрутизувати виклики браузерних інструментів до цього node без додаткової конфігурації браузера.
Це шлях за замовчуванням для віддалених Gateway.

Примітки:

- Node-хост відкриває свій локальний сервер керування браузером через **команду проксі**.
- Профілі беруться з власної конфігурації `browser.profiles` node (так само, як локально).
- `nodeHost.browserProxy.allowProfiles` є необов’язковим. Залиште його порожнім для legacy/типової поведінки: усі налаштовані профілі залишаються доступними через проксі, включно з маршрутами створення/видалення профілів.
- Якщо ви задаєте `nodeHost.browserProxy.allowProfiles`, OpenClaw трактує це як межу найменших привілеїв: цільовими можуть бути лише профілі з allowlist, а постійні маршрути створення/видалення профілів блокуються на поверхні проксі.
- Вимкніть, якщо це вам не потрібно:
  - На node: `nodeHost.browserProxy.enabled=false`
  - На gateway: `gateway.nodes.browser.mode="off"`

## Browserless (розміщений віддалений CDP)

[Browserless](https://browserless.io) — це розміщений Chromium-сервіс, який відкриває
URL підключення CDP через HTTPS і WebSocket. OpenClaw може використовувати будь-яку форму, але
для віддаленого профілю браузера найпростіший варіант — прямий WebSocket URL
з документації Browserless щодо підключення.

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

- Замініть `<BROWSERLESS_API_KEY>` на ваш реальний токен Browserless.
- Виберіть endpoint регіону, який відповідає вашому обліковому запису Browserless (див. їхню документацію).
- Якщо Browserless надає вам базовий HTTPS URL, ви можете або перетворити його на
  `wss://` для прямого CDP-підключення, або залишити HTTPS URL і дозволити OpenClaw
  виявити `/json/version`.

### Browserless Docker на тому самому хості

Коли Browserless самостійно розміщено в Docker, а OpenClaw працює на хості, розглядайте
Browserless як зовнішньо керований CDP-сервіс:

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

Адреса в `browser.profiles.browserless.cdpUrl` має бути доступною з процесу
OpenClaw. Browserless також має рекламувати відповідний доступний endpoint;
задайте Browserless `EXTERNAL` як ту саму публічну для OpenClaw базу WebSocket, наприклад
`ws://127.0.0.1:3000`, `ws://browserless:3000` або стабільну приватну адресу мережі
Docker. Якщо `/json/version` повертає `webSocketDebuggerUrl`, що вказує на
адресу, недоступну для OpenClaw, CDP HTTP може виглядати справним, тоді як підключення
WebSocket усе одно завершується невдачею.

Не залишайте `attachOnly` незаданим для loopback-профілю Browserless. Без
`attachOnly` OpenClaw трактує loopback-порт як локальний керований профіль браузера
і може повідомити, що порт використовується, але не належить OpenClaw.

## Прямі WebSocket CDP-провайдери

Деякі розміщені браузерні сервіси відкривають **прямий WebSocket** endpoint, а не
стандартне виявлення CDP на основі HTTP (`/json/version`). OpenClaw приймає три
форми CDP URL і автоматично вибирає правильну стратегію підключення:

- **HTTP(S)-виявлення** - `http://host[:port]` або `https://host[:port]`.
  OpenClaw викликає `/json/version`, щоб виявити URL WebSocket debugger, а потім
  підключається. Без резервного переходу на WebSocket.
- **Прямі WebSocket endpoint-и** - `ws://host[:port]/devtools/<kind>/<id>` або
  `wss://...` зі шляхом `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw підключається напряму через WebSocket-handshake і повністю пропускає
  `/json/version`.
- **Голі WebSocket-корені** - `ws://host[:port]` або `wss://host[:port]` без
  шляху `/devtools/...` (наприклад, [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw спершу пробує HTTP
  виявлення `/json/version` (нормалізуючи схему до `http`/`https`);
  якщо виявлення повертає `webSocketDebuggerUrl`, використовується він, інакше OpenClaw
  переходить до прямого WebSocket-handshake на голому корені. Якщо рекламований
  WebSocket endpoint відхиляє CDP-handshake, але налаштований голий корінь
  приймає його, OpenClaw також переходить на цей корінь. Це дає змогу голому `ws://`,
  спрямованому на локальний Chrome, усе одно підключитися, оскільки Chrome приймає WebSocket
  upgrades лише на конкретному шляху кожної цілі з `/json/version`, тоді як розміщені
  провайдери все ще можуть використовувати свій кореневий WebSocket endpoint, коли їхній endpoint
  виявлення рекламує короткоживучий URL, непридатний для Playwright CDP.

### Browserbase

[Browserbase](https://www.browserbase.com) — це хмарна платформа для запуску
headless-браузерів із вбудованим розв’язанням CAPTCHA, stealth mode і житловими
проксі.

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

- [Зареєструйтеся](https://www.browserbase.com/sign-up) і скопіюйте ваш **API Key**
  з [оглядової панелі](https://www.browserbase.com/overview).
- Замініть `<BROWSERBASE_API_KEY>` на ваш реальний API-ключ Browserbase.
- Browserbase автоматично створює сеанс браузера під час WebSocket-підключення, тому
  ручний крок створення сеансу не потрібен.
- Безплатний рівень дозволяє один одночасний сеанс і одну браузерну годину на місяць.
  Див. [ціни](https://www.browserbase.com/pricing) щодо обмежень платних планів.
- Див. [документацію Browserbase](https://docs.browserbase.com) для повного довідника API,
  посібників SDK і прикладів інтеграції.

## Безпека

Ключові ідеї:

- Керування браузером доступне лише через local loopback; доступ проходить через автентифікацію Gateway або сполучення вузлів.
- Окремий HTTP API браузера local loopback використовує **лише автентифікацію зі спільним секретом**:
  bearer-автентифікацію токеном gateway, `x-openclaw-password` або HTTP Basic auth із
  налаштованим паролем gateway.
- Заголовки ідентичності Tailscale Serve і `gateway.auth.mode: "trusted-proxy"` **не**
  автентифікують цей окремий API браузера local loopback.
- Якщо керування браузером увімкнено, а автентифікацію зі спільним секретом не налаштовано, OpenClaw
  генерує gateway-токен лише на час виконання для цього запуску. Налаштуйте
  `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` або
  `OPENCLAW_GATEWAY_PASSWORD` явно, якщо клієнтам потрібен стабільний секрет між
  перезапусками.
- OpenClaw **не** генерує цей токен автоматично, коли `gateway.auth.mode` уже має значення
  `password`, `none` або `trusted-proxy`.
- Тримайте Gateway і будь-які хости вузлів у приватній мережі (Tailscale); уникайте публічного доступу.
- Вважайте віддалені CDP URL/токени секретами; надавайте перевагу змінним середовища або менеджеру секретів.

Поради щодо віддаленого CDP:

- За можливості надавайте перевагу зашифрованим кінцевим точкам (HTTPS або WSS) і короткоживучим токенам.
- Уникайте вбудовування довгоживучих токенів безпосередньо у файли конфігурації.

## Профілі (кілька браузерів)

OpenClaw підтримує кілька іменованих профілів (конфігурацій маршрутизації). Профілі можуть бути:

- **керовані OpenClaw**: виділений екземпляр браузера на основі Chromium із власним каталогом даних користувача + портом CDP
- **віддалені**: явний CDP URL (браузер на основі Chromium, що працює деінде)
- **наявний сеанс**: ваш наявний профіль Chrome через автоматичне підключення Chrome DevTools MCP

Типові значення:

- Профіль `openclaw` створюється автоматично, якщо його немає.
- Профіль `user` вбудований для приєднання до наявного сеансу Chrome MCP.
- Профілі наявного сеансу, крім `user`, є опційними; створюйте їх із `--driver existing-session`.
- Локальні порти CDP типово виділяються з діапазону **18800-18899**.
- Видалення профілю переміщує його локальний каталог даних у Смітник.

Усі кінцеві точки керування приймають `?profile=<name>`; CLI використовує `--browser-profile`.

## Наявний сеанс через Chrome DevTools MCP

OpenClaw також може приєднатися до запущеного профілю браузера на основі Chromium через
офіційний сервер Chrome DevTools MCP. Це повторно використовує вкладки та стан входу,
які вже відкриті в цьому профілі браузера.

Офіційні довідкові матеріали та інструкції з налаштування:

- [Chrome для розробників: використання Chrome DevTools MCP із вашим сеансом браузера](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [README Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Вбудований профіль:

- `user`

Необов’язково: створіть власний користувацький профіль наявного сеансу, якщо вам потрібні
інша назва, колір або каталог даних браузера.

Типова поведінка:

- Вбудований профіль `user` використовує автоматичне підключення Chrome MCP, яке націлене на
  типовий локальний профіль Google Chrome.

Використовуйте `userDataDir` для Brave, Edge, Chromium або нестандартного профілю Chrome.
`~` розгортається до домашнього каталогу вашої ОС:

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
3. Тримайте браузер запущеним і підтвердьте запит на підключення, коли OpenClaw приєднається.

Поширені сторінки inspect:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Швидка перевірка live-приєднання:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

Як виглядає успіх:

- `status` показує `driver: existing-session`
- `status` показує `transport: chrome-mcp`
- `status` показує `running: true`
- `tabs` перелічує вже відкриті вкладки вашого браузера
- `snapshot` повертає посилання з вибраної live-вкладки

Що перевірити, якщо приєднання не працює:

- цільовий браузер на основі Chromium має версію `144+`
- віддалене налагодження увімкнено на сторінці inspect цього браузера
- браузер показав запит згоди на приєднання, і ви його прийняли
- `openclaw doctor` мігрує стару конфігурацію браузера на основі розширення та перевіряє, що
  Chrome встановлено локально для типових профілів автоматичного підключення, але не може
  увімкнути для вас віддалене налагодження на боці браузера

Використання агентом:

- Використовуйте `profile="user"`, коли потрібен стан браузера користувача з виконаним входом.
- Якщо ви використовуєте користувацький профіль наявного сеансу, передайте цю явну назву профілю.
- Обирайте цей режим лише тоді, коли користувач за комп’ютером і може підтвердити запит
  на приєднання.
- Gateway або хост вузла може запускати `npx chrome-devtools-mcp@latest --autoConnect`

Примітки:

- Цей шлях ризикованіший за ізольований профіль `openclaw`, оскільки він може
  діяти всередині вашого сеансу браузера з виконаним входом.
- OpenClaw не запускає браузер для цього драйвера; він лише приєднується.
- OpenClaw тут використовує офіційний потік Chrome DevTools MCP `--autoConnect`. Якщо
  задано `userDataDir`, він передається далі, щоб націлитися на цей каталог даних користувача.
- Наявний сеанс може приєднуватися на вибраному хості або через підключений
  браузерний вузол. Якщо Chrome розташований деінде й браузерний вузол не підключено, натомість використовуйте
  віддалений CDP або хост вузла.

### Користувацький запуск Chrome MCP

Перевизначте створюваний сервер Chrome DevTools MCP для кожного профілю, коли типовий
потік `npx chrome-devtools-mcp@latest` вам не підходить (офлайн-хости,
закріплені версії, вендоровані двійкові файли):

| Поле         | Що воно робить                                                                                                             |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Виконуваний файл для запуску замість `npx`. Розв’язується як є; абсолютні шляхи підтримуються.                             |
| `mcpArgs`    | Масив аргументів, що передається дослівно до `mcpCommand`. Замінює типові аргументи `chrome-devtools-mcp@latest --autoConnect`. |

Коли `cdpUrl` задано в профілі наявного сеансу, OpenClaw пропускає
`--autoConnect` і автоматично передає кінцеву точку до Chrome MCP:

- `http(s)://...` → `--browserUrl <url>` (кінцева точка HTTP-виявлення DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (прямий CDP WebSocket).

Прапорці кінцевої точки та `userDataDir` не можна поєднувати: коли задано `cdpUrl`,
`userDataDir` ігнорується для запуску Chrome MCP, оскільки Chrome MCP приєднується до
запущеного браузера за кінцевою точкою, а не відкриває каталог
профілю.

<Accordion title="Обмеження функцій наявного сеансу">

Порівняно з керованим профілем `openclaw`, драйвери наявного сеансу мають більше обмежень:

- **Знімки екрана** - захоплення сторінок і захоплення елементів через `--ref` працюють; CSS-селектори `--element` не працюють. `--full-page` не можна поєднувати з `--ref` або `--element`. Playwright не потрібен для знімків сторінок або елементів на основі ref.
- **Дії** - `click`, `type`, `hover`, `scrollIntoView`, `drag` і `select` потребують ref зі snapshot (без CSS-селекторів). `click-coords` натискає координати видимої області перегляду й не потребує ref зі snapshot. `click` підтримує лише ліву кнопку. `type` не підтримує `slowly=true`; використовуйте `fill` або `press`. `press` не підтримує `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` і `evaluate` не підтримують тайм-аути для окремих викликів. `select` приймає одне значення.
- **Очікування / завантаження / діалог** - `wait --url` підтримує точні, підрядкові та glob-шаблони; `wait --load networkidle` не підтримується. Хуки завантаження потребують `ref` або `inputRef`, один файл за раз, без CSS `element`. Хуки діалогів не підтримують перевизначення тайм-ауту.
- **Функції лише для керованого браузера** - пакетні дії, експорт PDF, перехоплення завантажень і `responsebody` досі потребують шляху керованого браузера.

</Accordion>

## Гарантії ізоляції

- **Виділений каталог даних користувача**: ніколи не торкається вашого особистого профілю браузера.
- **Виділені порти**: уникає `9222`, щоб запобігти конфліктам із робочими процесами розробки.
- **Детерміноване керування вкладками**: `tabs` спочатку повертає `suggestedTargetId`, потім
  стабільні дескриптори `tabId`, як-от `t1`, необов’язкові мітки та сирий `targetId`.
  Агенти мають повторно використовувати `suggestedTargetId`; сирі ідентифікатори залишаються доступними для
  налагодження та сумісності.

## Вибір браузера

Під час локального запуску OpenClaw вибирає перший доступний:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Можна перевизначити за допомогою `browser.executablePath`.

Платформи:

- macOS: перевіряє `/Applications` і `~/Applications`.
- Linux: перевіряє поширені розташування Chrome/Brave/Edge/Chromium у `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` і
  `/usr/lib/chromium-browser`, а також керований Playwright Chromium у
  `PLAYWRIGHT_BROWSERS_PATH` або `~/.cache/ms-playwright`.
- Windows: перевіряє поширені розташування встановлення.

## API керування (необов’язково)

Для скриптів і налагодження Gateway надає невеликий **HTTP API керування лише через local loopback**
плюс відповідний CLI `openclaw browser` (snapshots, refs, посилення wait,
вивід JSON, робочі процеси налагодження). Повний довідник див.
у [API керування браузером](/uk/tools/browser-control).

## Усунення несправностей

Для проблем, специфічних для Linux (особливо snap Chromium), див.
[Усунення несправностей браузера](/uk/tools/browser-linux-troubleshooting).

Для конфігурацій із розділеними хостами WSL2 Gateway + Windows Chrome див.
[Усунення несправностей WSL2 + Windows + віддалений Chrome CDP](/uk/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Збій запуску CDP проти блокування navigation SSRF

Це різні класи збоїв, і вони вказують на різні шляхи коду.

- **Збій запуску або готовності CDP** означає, що OpenClaw не може підтвердити справність площини керування браузером.
- **Блокування navigation SSRF** означає, що площина керування браузером справна, але ціль навігації сторінки відхилена політикою.

Поширені приклади:

- Збій запуску або готовності CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw`, коли
    налаштовано зовнішню службу CDP через loopback без `attachOnly: true`
- Блокування navigation SSRF:
  - потоки `open`, `navigate`, snapshot або відкриття вкладок завершуються з помилкою політики браузера/мережі, тоді як `start` і `tabs` усе ще працюють

Використовуйте цю мінімальну послідовність, щоб розділити ці два випадки:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Як читати результати:

- Якщо `start` завершується з помилкою `not reachable after start`, спочатку усувайте проблему готовності CDP.
- Якщо `start` успішний, але `tabs` завершується з помилкою, площина керування все ще несправна. Розглядайте це як проблему досяжності CDP, а не проблему навігації сторінки.
- Якщо `start` і `tabs` успішні, але `open` або `navigate` завершується з помилкою, площина керування браузером працює, а збій пов’язаний із політикою навігації або цільовою сторінкою.
- Якщо `start`, `tabs` і `open` усі успішні, базовий шлях керування керованим браузером справний.

Важливі деталі поведінки:

- Конфігурація браузера типово має об’єкт політики SSRF із режимом fail-closed, навіть якщо ви не налаштовуєте `browser.ssrfPolicy`.
- Для локального профілю керованого `openclaw` через local loopback перевірки справності CDP навмисно пропускають застосування досяжності SSRF браузера для власної локальної площини керування OpenClaw.
- Захист навігації є окремим. Успішний результат `start` або `tabs` не означає, що пізніша ціль `open` або `navigate` дозволена.

Настанови з безпеки:

- **Не** послаблюйте політику SSRF браузера за замовчуванням.
- Надавайте перевагу вузьким виняткам для хостів, як-от `hostnameAllowlist` або `allowedHostnames`, замість широкого доступу до приватної мережі.
- Використовуйте `dangerouslyAllowPrivateNetwork: true` лише в навмисно довірених середовищах, де доступ браузера до приватної мережі потрібен і перевірений.

## Інструменти агента + як працює керування

Агент отримує **один інструмент** для автоматизації браузера:

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Як це зіставляється:

- `browser snapshot` повертає стабільне дерево UI (ШІ або ARIA).
- `browser act` використовує ідентифікатори `ref` зі знімка для клацання/введення/перетягування/вибору.
- `browser screenshot` захоплює пікселі (повну сторінку, елемент або позначені refs).
- `browser doctor` перевіряє готовність Gateway, Plugin, профілю, браузера й вкладки.
- `browser` приймає:
  - `profile` для вибору іменованого профілю браузера (openclaw, chrome або віддалений CDP).
  - `target` (`sandbox` | `host` | `node`) для вибору місця, де працює браузер.
  - У сесіях із пісочницею `target: "host"` вимагає `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Якщо `target` пропущено: сесії з пісочницею за замовчуванням використовують `sandbox`, а сесії без пісочниці - `host`.
  - Якщо підключено вузол із підтримкою браузера, інструмент може автоматично маршрутизуватися до нього, якщо ви не закріпите `target="host"` або `target="node"`.

Це зберігає детермінованість агента й допомагає уникати крихких селекторів.

## Пов’язане

- [Огляд інструментів](/uk/tools) - усі доступні інструменти агента
- [Пісочниця](/uk/gateway/sandboxing) - керування браузером у середовищах із пісочницею
- [Безпека](/uk/gateway/security) - ризики керування браузером і посилення захисту
