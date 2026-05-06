---
read_when:
    - Додавання керованої агентом автоматизації браузера
    - Діагностика того, чому openclaw заважає роботі вашого власного Chrome
    - Реалізація налаштувань браузера + життєвого циклу в застосунку macOS
summary: Інтегрована служба керування браузером + команди дій
title: Браузер (під керуванням OpenClaw)
x-i18n:
    generated_at: "2026-05-06T03:01:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3588ee1205d34df7604f1c660829c5f373b0fa76080d36c460f4ed4a08777a39
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw може запускати **окремий профіль Chrome/Brave/Edge/Chromium**, яким керує агент.
Він ізольований від вашого особистого браузера й керується через невелику локальну
службу керування всередині Gateway (лише loopback).

Початкове уявлення:

- Думайте про це як про **окремий браузер лише для агента**.
- Профіль `openclaw` **не** торкається вашого особистого профілю браузера.
- Агент може **відкривати вкладки, читати сторінки, натискати й вводити текст** у безпечному контурі.
- Вбудований профіль `user` під'єднується до вашої справжньої авторизованої сесії Chrome через Chrome MCP.

## Що ви отримуєте

- Окремий профіль браузера з назвою **openclaw** (помаранчевий акцент за замовчуванням).
- Детерміноване керування вкладками (список/відкрити/сфокусувати/закрити).
- Дії агента (натискання/введення/перетягування/вибір), знімки стану, скриншоти, PDF.
- Вбудований skill `browser-automation`, який навчає агентів циклу відновлення
  для знімків стану, стабільних вкладок, застарілих посилань і ручних блокерів,
  коли Plugin браузера ввімкнено.
- Додаткова підтримка кількох профілів (`openclaw`, `work`, `remote`, ...).

Цей браузер **не** призначений для щоденного використання. Це безпечна, ізольована поверхня для
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

Стандартний інструмент `browser` є вбудованим Plugin. Вимкніть його, щоб замінити іншим Plugin, який реєструє ту саму назву інструмента `browser`:

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

Для стандартної роботи потрібні і `plugins.entries.browser.enabled`, **і** `browser.enabled=true`. Вимкнення лише Plugin прибирає CLI `openclaw browser`, метод Gateway `browser.request`, інструмент агента й службу керування як єдине ціле; ваша конфігурація `browser.*` залишається незмінною для заміни.

Зміни конфігурації браузера потребують перезапуску Gateway, щоб Plugin міг повторно зареєструвати свою службу.

## Настанови для агента

Примітка щодо профілю інструментів: `tools.profile: "coding"` містить `web_search` і
`web_fetch`, але не містить повний інструмент `browser`. Якщо агент або
створений підагент має використовувати автоматизацію браузера, додайте browser на етапі
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
Лише `tools.subagents.tools.allow: ["browser"]` недостатньо, бо політика підагента
застосовується після фільтрації профілю.

Plugin браузера постачається з двома рівнями настанов для агента:

- Опис інструмента `browser` містить компактний постійний контракт: вибирайте
  правильний профіль, тримайте refs у межах тієї самої вкладки, використовуйте `tabId`/мітки для
  націлювання на вкладки й завантажуйте browser skill для багатоетапної роботи.
- Вбудований skill `browser-automation` містить довший робочий цикл:
  спочатку перевірити status/tabs, позначити вкладки завдання, зробити snapshot перед дією, повторно зробити snapshot
  після змін UI, один раз відновитися після stale refs і повідомляти про login/2FA/captcha або
  блокери camera/microphone як про ручну дію замість здогадок.

Skills, вбудовані в Plugin, перелічуються серед доступних Skills агента, коли
Plugin увімкнено. Повні інструкції skill завантажуються на вимогу, тож звичайні
ходи не оплачують повну вартість у токенах.

## Відсутня команда або інструмент браузера

Якщо `openclaw browser` невідома після оновлення, `browser.request` відсутній або агент повідомляє, що інструмент браузера недоступний, звична причина — список `plugins.allow`, який пропускає `browser`, і відсутній кореневий блок конфігурації `browser`. Додайте його:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Явний кореневий блок `browser`, наприклад `browser.enabled=true` або `browser.profiles.<name>`, активує вбудований Plugin браузера навіть за обмежувального `plugins.allow`, відповідно до поведінки конфігурації каналів. `plugins.entries.browser.enabled=true` і `tools.alsoAllow: ["browser"]` самі по собі не замінюють членство в allowlist. Повне видалення `plugins.allow` також відновлює стандартну поведінку.

## Профілі: `openclaw` проти `user`

- `openclaw`: керований, ізольований браузер (розширення не потрібне).
- `user`: вбудований профіль під'єднання Chrome MCP для вашої **справжньої авторизованої Chrome**
  сесії.

Для викликів інструмента браузера агентом:

- За замовчуванням: використовуйте ізольований браузер `openclaw`.
- Надавайте перевагу `profile="user"`, коли важливі наявні авторизовані сесії, а користувач
  перебуває за комп'ютером, щоб натиснути/підтвердити будь-який запит на під'єднання.
- `profile` — це явне перевизначення, коли потрібен конкретний режим браузера.

Установіть `browser.defaultProfile: "openclaw"`, якщо хочете керований режим за замовчуванням.

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

<Accordion title="Порти й доступність">

- Служба керування прив'язується до loopback на порту, похідному від `gateway.port` (за замовчуванням `18791` = gateway + 2). Перевизначення `gateway.port` або `OPENCLAW_GATEWAY_PORT` зсуває похідні порти в тому самому сімействі.
- Локальні профілі `openclaw` автоматично призначають `cdpPort`/`cdpUrl`; задавайте їх лише для віддаленого CDP. `cdpUrl` за замовчуванням відповідає керованому локальному порту CDP, якщо не задано.
- `remoteCdpTimeoutMs` застосовується до віддалених і `attachOnly` перевірок доступності CDP HTTP
  та HTTP-запитів відкриття вкладок; `remoteCdpHandshakeTimeoutMs` застосовується до
  їхніх CDP WebSocket рукостискань.
- `localLaunchTimeoutMs` — це бюджет для локально запущеного керованого процесу Chrome,
  щоб відкрити свій CDP HTTP endpoint. `localCdpReadyTimeoutMs` — це
  подальший бюджет для готовності CDP websocket після виявлення процесу.
  Збільшуйте ці значення на Raspberry Pi, слабких VPS або старішому обладнанні, де Chromium
  запускається повільно. Значення мають бути додатними цілими числами до `120000` мс; недійсні
  значення конфігурації відхиляються.
- Повторювані збої запуску/готовності керованого Chrome розмикаються окремо для кожного
  профілю. Після кількох послідовних збоїв OpenClaw ненадовго призупиняє нові спроби
  запуску замість того, щоб створювати Chromium на кожен виклик інструмента браузера. Виправте
  проблему запуску, вимкніть браузер, якщо він не потрібен, або перезапустіть
  Gateway після виправлення.
- `actionTimeoutMs` — це стандартний бюджет для запитів браузера `act`, коли викликач не передає `timeoutMs`. Клієнтський транспорт додає невелике вікно запасу, щоб довгі очікування могли завершитися замість timeout на межі HTTP.
- `tabCleanup` — це очищення best-effort для вкладок, відкритих сесіями браузера основного агента. Очищення життєвого циклу підагентів, cron і ACP усе ще закриває їхні явно відстежувані вкладки наприкінці сесії; основні сесії зберігають активні вкладки придатними для повторного використання, а потім закривають неактивні або надлишкові відстежувані вкладки у фоновому режимі.

</Accordion>

<Accordion title="Політика SSRF">

- Навігація браузера та відкриття вкладок захищені SSRF-перевіркою перед навігацією та best-effort повторно перевіряються на фінальному URL `http(s)` після неї.
- У суворому режимі SSRF також перевіряються виявлення віддаленого CDP endpoint і probes `/json/version` (`cdpUrl`).
- Змінні середовища Gateway/provider `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` і `NO_PROXY` не проксіюють автоматично браузер, керований OpenClaw. Керований Chrome за замовчуванням запускається напряму, щоб проксі-налаштування provider не послаблювали SSRF-перевірки браузера.
- Щоб проксіювати сам керований браузер, передайте явні прапорці проксі Chrome через `browser.extraArgs`, наприклад `--proxy-server=...` або `--proxy-pac-url=...`. Суворий режим SSRF блокує явну маршрутизацію браузера через проксі, якщо доступ браузера до приватної мережі не ввімкнено навмисно.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` вимкнено за замовчуванням; вмикайте лише тоді, коли доступ браузера до приватної мережі навмисно вважається довіреним.
- `browser.ssrfPolicy.allowPrivateNetwork` залишається підтримуваним як застарілий alias.

</Accordion>

<Accordion title="Поведінка профілю">

- `attachOnly: true` означає ніколи не запускати локальний браузер; лише підключатися, якщо він уже запущений.
- `headless` можна задати глобально або для кожного локального керованого профілю. Значення на рівні профілю перевизначають `browser.headless`, тож один локально запущений профіль може залишатися headless, а інший - видимим.
- `POST /start?headless=true` і `openclaw browser start --headless` запитують
  одноразовий headless-запуск для локальних керованих профілів без перезапису
  `browser.headless` або конфігурації профілю. Профілі з наявним сеансом,
  attach-only і віддалені CDP-профілі відхиляють це перевизначення, бо OpenClaw не запускає ці
  браузерні процеси.
- На Linux-хостах без `DISPLAY` або `WAYLAND_DISPLAY` локальні керовані профілі
  автоматично за замовчуванням переходять у headless-режим, коли ні середовище, ні профільна/глобальна
  конфігурація явно не вибирає режим із вікном. `openclaw browser status --json`
  повідомляє `headlessSource` як `env`, `profile`, `config`,
  `request`, `linux-display-fallback` або `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` примусово запускає локальні керовані профілі у headless-режимі для
  поточного процесу. `OPENCLAW_BROWSER_HEADLESS=0` примусово вмикає режим із вікном для звичайних
  запусків і повертає дієву помилку на Linux-хостах без сервера відображення;
  явний запит `start --headless` усе одно має пріоритет для цього одного запуску.
- `executablePath` можна задати глобально або для кожного локального керованого профілю. Значення на рівні профілю перевизначають `browser.executablePath`, тож різні керовані профілі можуть запускати різні браузери на базі Chromium. Обидві форми приймають `~` для домашнього каталогу вашої ОС.
- `color` (верхнього рівня та на рівні профілю) підфарбовує інтерфейс браузера, щоб ви бачили, який профіль активний.
- Профіль за замовчуванням - `openclaw` (керований автономний). Використовуйте `defaultProfile: "user"`, щоб увімкнути браузер користувача з виконаним входом.
- Порядок автовиявлення: системний браузер за замовчуванням, якщо він на базі Chromium; інакше Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` використовує Chrome DevTools MCP замість сирого CDP. Не задавайте `cdpUrl` для цього драйвера.
- Задайте `browser.profiles.<name>.userDataDir`, коли профіль existing-session має підключатися до нестандартного профілю користувача Chromium (Brave, Edge тощо). Цей шлях також приймає `~` для домашнього каталогу вашої ОС.

</Accordion>

</AccordionGroup>

## Використання Brave або іншого браузера на базі Chromium

Якщо ваш **системний браузер за замовчуванням** базується на Chromium (Chrome/Brave/Edge/тощо),
OpenClaw використовує його автоматично. Задайте `browser.executablePath`, щоб перевизначити
автовиявлення. Значення `executablePath` верхнього рівня та на рівні профілю приймають `~`
для домашнього каталогу вашої ОС:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

Або задайте це в конфігурації, окремо для кожної платформи:

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
- **Віддалене керування (хост Node):** запустіть хост Node на машині, де є браузер; Gateway проксіює браузерні дії до нього.
- **Віддалений CDP:** задайте `browser.profiles.<name>.cdpUrl` (або `browser.cdpUrl`), щоб
  підключитися до віддаленого браузера на базі Chromium. У цьому випадку OpenClaw не запускатиме локальний браузер.
- Для зовнішньо керованих CDP-сервісів на loopback (наприклад Browserless у
  Docker, опублікований на `127.0.0.1`) також задайте `attachOnly: true`. Loopback CDP
  без `attachOnly` вважається локальним профілем браузера, керованим OpenClaw.
- `headless` впливає лише на локальні керовані профілі, які OpenClaw запускає. Він не перезапускає й не змінює браузери existing-session або віддалені CDP-браузери.
- `executablePath` дотримується того самого правила для локального керованого профілю. Його зміна в
  запущеному локальному керованому профілі позначає цей профіль для перезапуску/узгодження, щоб
  наступний запуск використовував новий виконуваний файл.

Поведінка зупинки відрізняється залежно від режиму профілю:

- локальні керовані профілі: `openclaw browser stop` зупиняє браузерний процес, який
  запустив OpenClaw
- attach-only і віддалені CDP-профілі: `openclaw browser stop` закриває активний
  сеанс керування та звільняє перевизначення емуляції Playwright/CDP (viewport,
  колірну схему, локаль, часовий пояс, offline-режим і подібний стан), навіть
  якщо OpenClaw не запускав браузерний процес

Віддалені CDP URL можуть містити автентифікацію:

- Токени в запиті (наприклад, `https://provider.example?token=<token>`)
- HTTP Basic auth (наприклад, `https://user:pass@provider.example`)

OpenClaw зберігає автентифікацію під час викликів кінцевих точок `/json/*` і під час підключення
до CDP WebSocket. Для токенів надавайте перевагу змінним середовища або менеджерам секретів
замість комітування їх у конфігураційні файли.

## Проксі браузера Node (типовий варіант без конфігурації)

Якщо ви запускаєте **хост Node** на машині, де є ваш браузер, OpenClaw може
автоматично маршрутизувати виклики браузерних інструментів до цього Node без додаткової конфігурації браузера.
Це типовий шлях для віддалених Gateway.

Примітки:

- Хост Node надає свій локальний сервер керування браузером через **проксі-команду**.
- Профілі надходять із власної конфігурації `browser.profiles` цього Node (так само, як локально).
- `nodeHost.browserProxy.allowProfiles` необов'язковий. Залиште його порожнім для застарілої/типової поведінки: усі налаштовані профілі залишаються доступними через проксі, включно з маршрутами створення/видалення профілю.
- Якщо ви задаєте `nodeHost.browserProxy.allowProfiles`, OpenClaw сприймає це як межу мінімальних привілеїв: цільовими можуть бути лише профілі зі списку дозволених, а постійні маршрути створення/видалення профілю блокуються на поверхні проксі.
- Вимкніть, якщо це вам не потрібно:
  - На Node: `nodeHost.browserProxy.enabled=false`
  - На Gateway: `gateway.nodes.browser.mode="off"`

## Browserless (розміщений віддалений CDP)

[Browserless](https://browserless.io) - це розміщений сервіс Chromium, який надає
URL підключення CDP через HTTPS і WebSocket. OpenClaw може використовувати обидві форми, але
для профілю віддаленого браузера найпростіший варіант - прямий WebSocket URL
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

- Замініть `<BROWSERLESS_API_KEY>` на ваш справжній токен Browserless.
- Виберіть регіональну кінцеву точку, що відповідає вашому обліковому запису Browserless (див. їхню документацію).
- Якщо Browserless надає базовий HTTPS URL, ви можете або перетворити його на
  `wss://` для прямого CDP-підключення, або залишити HTTPS URL і дозволити OpenClaw
  виявити `/json/version`.

### Browserless Docker на тому самому хості

Коли Browserless самостійно розміщений у Docker, а OpenClaw працює на хості, вважайте
Browserless зовнішньо керованим CDP-сервісом:

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
OpenClaw. Browserless також має рекламувати відповідну доступну кінцеву точку;
задайте Browserless `EXTERNAL` на ту саму публічну для OpenClaw базу WebSocket, як-от
`ws://127.0.0.1:3000`, `ws://browserless:3000` або стабільну приватну адресу
мережі Docker. Якщо `/json/version` повертає `webSocketDebuggerUrl`, що вказує на
адресу, недоступну для OpenClaw, CDP HTTP може виглядати справним, тоді як
підключення WebSocket усе одно завершується з помилкою.

Не залишайте `attachOnly` незаданим для loopback-профілю Browserless. Без
`attachOnly` OpenClaw вважає loopback-порт локальним керованим профілем браузера
і може повідомити, що порт використовується, але не належить OpenClaw.

## Прямі WebSocket CDP-провайдери

Деякі розміщені браузерні сервіси надають **пряму WebSocket** кінцеву точку замість
стандартного HTTP-виявлення CDP (`/json/version`). OpenClaw приймає три
форми CDP URL і автоматично вибирає правильну стратегію підключення:

- **HTTP(S)-виявлення** - `http://host[:port]` або `https://host[:port]`.
  OpenClaw викликає `/json/version`, щоб виявити URL WebSocket debugger, а потім
  підключається. Без резервного WebSocket.
- **Прямі WebSocket-кінцеві точки** - `ws://host[:port]/devtools/<kind>/<id>` або
  `wss://...` зі шляхом `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw підключається напряму через WebSocket handshake і повністю пропускає
  `/json/version`.
- **Голі WebSocket-корені** - `ws://host[:port]` або `wss://host[:port]` без
  шляху `/devtools/...` (наприклад, [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw спершу пробує HTTP
  виявлення `/json/version` (нормалізуючи схему до `http`/`https`);
  якщо виявлення повертає `webSocketDebuggerUrl`, використовується він, інакше OpenClaw
  переходить до прямого WebSocket handshake на голому корені. Якщо оголошена
  WebSocket-кінцева точка відхиляє CDP handshake, але налаштований голий корінь
  приймає його, OpenClaw також повертається до цього кореня. Це дає змогу голому `ws://`,
  спрямованому на локальний Chrome, усе одно підключитися, бо Chrome приймає WebSocket
  upgrades лише на конкретному шляху для цілі з `/json/version`, тоді як розміщені
  провайдери все ще можуть використовувати свою кореневу WebSocket-кінцеву точку, коли їхня кінцева точка
  виявлення оголошує короткочасний URL, непридатний для Playwright CDP.

### Browserbase

[Browserbase](https://www.browserbase.com) - це хмарна платформа для запуску
headless-браузерів із вбудованим розв'язанням CAPTCHA, stealth-режимом і residential
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
  з [панелі огляду](https://www.browserbase.com/overview).
- Замініть `<BROWSERBASE_API_KEY>` на ваш справжній API-ключ Browserbase.
- Browserbase автоматично створює браузерний сеанс під час WebSocket-підключення, тож
  крок ручного створення сеансу не потрібен.
- Безкоштовний рівень дозволяє один одночасний сеанс і одну браузерну годину на місяць.
  Див. [ціни](https://www.browserbase.com/pricing) щодо лімітів платних планів.
- Див. [документацію Browserbase](https://docs.browserbase.com) для повної довідки API,
  посібників SDK і прикладів інтеграції.

## Безпека

Ключові ідеї:

- Керування браузером доступне лише через loopback; доступ проходить через автентифікацію Gateway або спарювання Node.
- Автономний loopback HTTP API браузера використовує **лише автентифікацію спільним секретом**:
  bearer-автентифікацію токеном Gateway, `x-openclaw-password` або HTTP Basic auth із
  налаштованим паролем Gateway.
- Заголовки ідентичності Tailscale Serve і `gateway.auth.mode: "trusted-proxy"` **не**
  автентифікують цей автономний loopback API браузера.
- Якщо керування браузером увімкнено, а автентифікацію спільним секретом не налаштовано, OpenClaw
  автоматично генерує `gateway.auth.token` під час запуску та зберігає його в конфігурації.
- OpenClaw **не** генерує цей токен автоматично, коли `gateway.auth.mode` уже має
  значення `password`, `none` або `trusted-proxy`.
- Тримайте Gateway і будь-які хости Node у приватній мережі (Tailscale); уникайте публічного доступу.
- Вважайте віддалені CDP URL/токени секретами; надавайте перевагу змінним середовища або менеджеру секретів.

Поради щодо віддаленого CDP:

- За можливості надавайте перевагу зашифрованим кінцевим точкам (HTTPS або WSS) і короткоживучим токенам.
- Уникайте вбудовування довгоживучих токенів безпосередньо у файли конфігурації.

## Профілі (кілька браузерів)

OpenClaw підтримує кілька іменованих профілів (конфігурацій маршрутизації). Профілі можуть бути:

- **керовані OpenClaw**: окремий екземпляр браузера на базі Chromium із власним каталогом даних користувача + портом CDP
- **віддалені**: явний CDP URL (браузер на базі Chromium, що працює в іншому місці)
- **наявний сеанс**: ваш наявний профіль Chrome через авто-підключення Chrome DevTools MCP

Типові значення:

- Профіль `openclaw` створюється автоматично, якщо його немає.
- Профіль `user` вбудований для приєднання Chrome MCP до наявного сеансу.
- Профілі наявного сеансу, крім `user`, вмикаються явно; створюйте їх із `--driver existing-session`.
- Локальні порти CDP типово виділяються з діапазону **18800-18899**.
- Видалення профілю переміщує його локальний каталог даних у Кошик.

Усі кінцеві точки керування приймають `?profile=<name>`; CLI використовує `--browser-profile`.

## Наявний сеанс через Chrome DevTools MCP

OpenClaw також може приєднуватися до запущеного профілю браузера на базі Chromium через
офіційний сервер Chrome DevTools MCP. Це повторно використовує вкладки та стан входу,
які вже відкриті в цьому профілі браузера.

Офіційні довідкові матеріали й інструкції з налаштування:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Вбудований профіль:

- `user`

Необов’язково: створіть власний користувацький профіль наявного сеансу, якщо хочете
інше ім’я, колір або каталог даних браузера.

Типова поведінка:

- Вбудований профіль `user` використовує авто-підключення Chrome MCP, яке націлюється на
  типовий локальний профіль Google Chrome.

Використовуйте `userDataDir` для Brave, Edge, Chromium або нетипового профілю Chrome.
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
3. Залиште браузер запущеним і схваліть запит на підключення, коли OpenClaw приєднається.

Поширені сторінки inspect:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Швидка live-перевірка приєднання:

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
- `tabs` перелічує ваші вже відкриті вкладки браузера
- `snapshot` повертає посилання з вибраної live-вкладки

Що перевірити, якщо приєднання не працює:

- цільовий браузер на базі Chromium має версію `144+`
- віддалене налагодження ввімкнено на сторінці inspect цього браузера
- браузер показав запит згоди на приєднання, і ви його прийняли
- `openclaw doctor` мігрує стару конфігурацію браузера на основі extension і перевіряє, що
  Chrome встановлено локально для типових профілів авто-підключення, але він не може
  ввімкнути для вас віддалене налагодження на стороні браузера

Використання агентом:

- Використовуйте `profile="user"`, коли потрібен стан браузера користувача з виконаним входом.
- Якщо ви використовуєте користувацький профіль наявного сеансу, передайте його явну назву.
- Обирайте цей режим лише тоді, коли користувач перебуває за комп’ютером, щоб схвалити запит
  на приєднання.
- Gateway або хост Node може запускати `npx chrome-devtools-mcp@latest --autoConnect`

Примітки:

- Цей шлях має вищий ризик, ніж ізольований профіль `openclaw`, оскільки він може
  діяти всередині вашого сеансу браузера, де виконано вхід.
- OpenClaw не запускає браузер для цього драйвера; він лише приєднується.
- OpenClaw тут використовує офіційний потік Chrome DevTools MCP `--autoConnect`. Якщо
  `userDataDir` задано, його передають далі для націлення на цей каталог даних користувача.
- Наявний сеанс може приєднатися на вибраному хості або через підключений
  Node браузера. Якщо Chrome розташований в іншому місці й Node браузера не підключено, використовуйте
  віддалений CDP або хост Node.

### Користувацький запуск Chrome MCP

Перевизначте запущений сервер Chrome DevTools MCP для кожного профілю, коли типовий
потік `npx chrome-devtools-mcp@latest` не відповідає вашим потребам (офлайн-хости,
закріплені версії, вендорні бінарні файли):

| Поле         | Що робить                                                                                                                  |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Виконуваний файл для запуску замість `npx`. Розв’язується як є; абсолютні шляхи враховуються.                              |
| `mcpArgs`    | Масив аргументів, що передається дослівно до `mcpCommand`. Замінює типові аргументи `chrome-devtools-mcp@latest --autoConnect`. |

Коли `cdpUrl` задано в профілі наявного сеансу, OpenClaw пропускає
`--autoConnect` і автоматично передає кінцеву точку до Chrome MCP:

- `http(s)://...` → `--browserUrl <url>` (кінцева точка виявлення DevTools HTTP).
- `ws(s)://...` → `--wsEndpoint <url>` (прямий WebSocket CDP).

Прапорці кінцевої точки й `userDataDir` не можна поєднувати: коли `cdpUrl` задано,
`userDataDir` ігнорується для запуску Chrome MCP, оскільки Chrome MCP приєднується до
запущеного браузера за кінцевою точкою, а не відкриває каталог
профілю.

<Accordion title="Обмеження функції наявного сеансу">

Порівняно з керованим профілем `openclaw`, драйвери наявного сеансу мають більше обмежень:

- **Знімки екрана** - знімки сторінок і знімки елементів `--ref` працюють; CSS-селектори `--element` ні. `--full-page` не можна поєднувати з `--ref` або `--element`. Playwright не потрібен для знімків сторінок або елементів на основі ref.
- **Дії** - `click`, `type`, `hover`, `scrollIntoView`, `drag` і `select` потребують snapshot refs (без CSS-селекторів). `click-coords` клацає координати видимої області перегляду й не потребує snapshot ref. `click` підтримує лише ліву кнопку. `type` не підтримує `slowly=true`; використовуйте `fill` або `press`. `press` не підтримує `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` і `evaluate` не підтримують тайм-аути для окремих викликів. `select` приймає одне значення.
- **Очікування / завантаження / діалог** - `wait --url` підтримує точні збіги, підрядки та glob-шаблони; `wait --load networkidle` не підтримується. Хуки завантаження потребують `ref` або `inputRef`, по одному файлу за раз, без CSS `element`. Хуки діалогів не підтримують перевизначення тайм-ауту.
- **Функції лише для керованого браузера** - пакетні дії, експорт PDF, перехоплення завантажень і `responsebody` досі потребують керованого шляху браузера.

</Accordion>

## Гарантії ізоляції

- **Окремий каталог даних користувача**: ніколи не торкається вашого особистого профілю браузера.
- **Окремі порти**: уникає `9222`, щоб запобігти конфліктам із робочими процесами розробки.
- **Детерміноване керування вкладками**: `tabs` спершу повертає `suggestedTargetId`, потім
  стабільні дескриптори `tabId`, як-от `t1`, необов’язкові мітки та сирий `targetId`.
  Агенти мають повторно використовувати `suggestedTargetId`; сирі id залишаються доступними для
  налагодження та сумісності.

## Вибір браузера

Під час локального запуску OpenClaw обирає перший доступний:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Можна перевизначити через `browser.executablePath`.

Платформи:

- macOS: перевіряє `/Applications` і `~/Applications`.
- Linux: перевіряє поширені розташування Chrome/Brave/Edge/Chromium у `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` і
  `/usr/lib/chromium-browser`.
- Windows: перевіряє поширені місця встановлення.

## API керування (необов’язково)

Для скриптів і налагодження Gateway надає невеликий **loopback-only HTTP
API керування**, а також відповідний CLI `openclaw browser` (знімки, refs, wait
power-ups, вивід JSON, робочі процеси налагодження). Див.
[API керування браузером](/uk/tools/browser-control) для повної довідки.

## Усунення несправностей

Для проблем, специфічних для Linux (особливо snap Chromium), див.
[Усунення несправностей браузера](/uk/tools/browser-linux-troubleshooting).

Для конфігурацій із розділеними хостами WSL2 Gateway + Windows Chrome див.
[Усунення несправностей WSL2 + Windows + віддаленого Chrome CDP](/uk/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Збій запуску CDP проти блокування навігації SSRF

Це різні класи збоїв, і вони вказують на різні шляхи коду.

- **Збій запуску або готовності CDP** означає, що OpenClaw не може підтвердити справність площини керування браузером.
- **Блокування навігації SSRF** означає, що площина керування браузером справна, але ціль навігації сторінки відхилена політикою.

Поширені приклади:

- Збій запуску або готовності CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` коли
    зовнішню CDP-службу loopback налаштовано без `attachOnly: true`
- Блокування навігації SSRF:
  - потоки `open`, `navigate`, snapshot або відкриття вкладки завершуються помилкою політики браузера/мережі, тоді як `start` і `tabs` усе ще працюють

Використовуйте цю мінімальну послідовність, щоб розділити ці два випадки:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Як читати результати:

- Якщо `start` завершується помилкою `not reachable after start`, спершу усувайте проблему готовності CDP.
- Якщо `start` успішний, але `tabs` завершується помилкою, площина керування все ще несправна. Розглядайте це як проблему досяжності CDP, а не проблему навігації сторінки.
- Якщо `start` і `tabs` успішні, але `open` або `navigate` завершується помилкою, площина керування браузером працює, а збій міститься в політиці навігації або цільовій сторінці.
- Якщо `start`, `tabs` і `open` усі успішні, базовий шлях керування керованим браузером справний.

Важливі деталі поведінки:

- Конфігурація браузера типово використовує fail-closed об’єкт політики SSRF, навіть якщо ви не налаштовуєте `browser.ssrfPolicy`.
- Для локального керованого профілю loopback `openclaw` перевірки стану CDP навмисно пропускають застосування досяжності браузерної SSRF для власної локальної площини керування OpenClaw.
- Захист навігації є окремим. Успішний результат `start` або `tabs` не означає, що пізніша ціль `open` або `navigate` дозволена.

Настанови з безпеки:

- **Не** послаблюйте політику SSRF браузера за замовчуванням.
- Надавайте перевагу вузьким виняткам для хостів, як-от `hostnameAllowlist` або `allowedHostnames`, замість широкого доступу до приватної мережі.
- Використовуйте `dangerouslyAllowPrivateNetwork: true` лише в навмисно довірених середовищах, де доступ браузера до приватної мережі потрібний і перевірений.

## Інструменти агента + як працює керування

Агент отримує **один інструмент** для автоматизації браузера:

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Як це зіставляється:

- `browser snapshot` повертає стабільне дерево UI (AI або ARIA).
- `browser act` використовує ідентифікатори `ref` зі знімка, щоб натискати/вводити/перетягувати/вибирати.
- `browser screenshot` захоплює пікселі (повна сторінка, елемент або позначені посилання).
- `browser doctor` перевіряє готовність Gateway, Plugin, профілю, браузера та вкладки.
- `browser` приймає:
  - `profile` для вибору іменованого профілю браузера (openclaw, chrome або віддалений CDP).
  - `target` (`sandbox` | `host` | `node`) для вибору, де розміщений браузер.
  - У сесіях із пісочницею `target: "host"` вимагає `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Якщо `target` пропущено: сесії з пісочницею за замовчуванням використовують `sandbox`, сесії без пісочниці — `host`.
  - Якщо підключено вузол із підтримкою браузера, інструмент може автоматично маршрутизувати до нього, якщо ви не зафіксуєте `target="host"` або `target="node"`.

Це зберігає детермінованість агента й уникає крихких селекторів.

## Пов’язане

- [Огляд інструментів](/uk/tools) - усі доступні інструменти агента
- [Пісочниця](/uk/gateway/sandboxing) - керування браузером у середовищах із пісочницею
- [Безпека](/uk/gateway/security) - ризики керування браузером і посилення захисту
