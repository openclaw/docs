---
read_when:
    - Додавання автоматизації браузера, керованої агентом
    - Налагодження того, чому openclaw заважає вашому власному Chrome
    - Реалізація налаштувань браузера та його життєвого циклу в застосунку для macOS
summary: Інтегрований сервіс керування браузером + команди дій
title: Browser (керований OpenClaw)
x-i18n:
    generated_at: "2026-04-27T07:10:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0e576b013e49917b6d5b118c22d7b91a65e1f1997dc86eb51881ed30806dafe9
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw може запускати **окремий профіль Chrome/Brave/Edge/Chromium**, яким керує агент.
Він ізольований від вашого особистого браузера та керується через невеликий локальний
сервіс керування всередині Gateway (лише local loopback).

Погляд для початківців:

- Сприймайте це як **окремий браузер лише для агента**.
- Профіль `openclaw` **не** торкається вашого особистого профілю браузера.
- Агент може **відкривати вкладки, читати сторінки, натискати та вводити текст** у безпечному середовищі.
- Вбудований профіль `user` під’єднується до вашої справжньої авторизованої сесії Chrome через Chrome MCP.

## Що ви отримаєте

- Окремий профіль браузера з назвою **openclaw** (типово з помаранчевим акцентом).
- Детерміноване керування вкладками (список/відкрити/фокус/закрити).
- Дії агента (натискання/введення/перетягування/вибір), знімки стану, знімки екрана, PDF.
- Вбудований skill `browser-automation`, який навчає агентів циклу відновлення snapshot,
  stable-tab, stale-ref і manual-blocker, коли Plugin браузера увімкнено.
- Необов’язкова підтримка кількох профілів (`openclaw`, `work`, `remote`, ...).

Цей браузер **не** призначений для вашого щоденного використання. Це безпечна, ізольована поверхня для
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

Якщо ви отримуєте “Browser disabled”, увімкніть його в конфігурації (див. нижче) і перезапустіть
Gateway.

Якщо `openclaw browser` повністю відсутній або агент каже, що інструмент браузера
недоступний, перейдіть до [Відсутня команда або інструмент браузера](/uk/tools/browser#missing-browser-command-or-tool).

## Керування Plugin

Типовий інструмент `browser` — це вбудований Plugin. Вимкніть його, щоб замінити іншим Plugin, який реєструє той самий інструмент з назвою `browser`:

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

Для типових значень потрібні і `plugins.entries.browser.enabled`, і `browser.enabled=true`. Вимкнення лише Plugin прибирає CLI `openclaw browser`, метод Gateway `browser.request`, інструмент агента та сервіс керування як єдине ціле; ваш конфіг `browser.*` залишається незмінним для заміни.

Зміни конфігурації браузера потребують перезапуску Gateway, щоб Plugin міг повторно зареєструвати свій сервіс.

## Вказівки для агента

Примітка щодо профілю інструментів: `tools.profile: "coding"` включає `web_search` і
`web_fetch`, але не включає повний інструмент `browser`. Якщо агент або
породжений sub-agent має використовувати автоматизацію браузера, додайте browser на етапі профілю:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Для одного агента використовуйте `agents.list[].tools.alsoAllow: ["browser"]`.
Лише `tools.subagents.tools.allow: ["browser"]` недостатньо, тому що політика sub-agent
застосовується після фільтрації профілю.

Plugin браузера постачається з двома рівнями вказівок для агента:

- Опис інструмента `browser` містить компактний, завжди активний контракт: оберіть
  правильний профіль, зберігайте refs у межах тієї самої вкладки, використовуйте `tabId`/мітки для націлювання на вкладки та завантажуйте skill браузера для багатокрокової роботи.
- Вбудований skill `browser-automation` містить довший робочий цикл:
  спочатку перевірити статус/вкладки, позначити вкладки завдання, зробити snapshot перед дією, повторно зробити snapshot
  після змін в UI, один раз відновити stale refs і повідомляти про login/2FA/captcha або
  блокування camera/microphone як ручну дію замість здогадок.

Skills, вбудовані в Plugin, показуються в списку доступних skills агента, коли
Plugin увімкнений. Повні інструкції skill завантажуються за потреби, тому звичайні
звернення не несуть повної вартості токенів.

## Відсутня команда або інструмент браузера

Якщо після оновлення `openclaw browser` невідома, `browser.request` відсутній або агент повідомляє, що інструмент браузера недоступний, звичайна причина — список `plugins.allow`, у якому немає `browser`. Додайте його:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true` і `tools.alsoAllow: ["browser"]` не замінюють членство в allowlist — allowlist керує завантаженням Plugin, а політика інструментів запускається лише після завантаження. Видалення `plugins.allow` повністю також відновлює типову поведінку.

## Профілі: `openclaw` проти `user`

- `openclaw`: керований, ізольований браузер (розширення не потрібне).
- `user`: вбудований профіль під’єднання Chrome MCP до вашої **справжньої авторизованої сесії Chrome**.

Для викликів інструмента браузера агентом:

- Типово: використовуйте ізольований браузер `openclaw`.
- Віддавайте перевагу `profile="user"`, коли важливі наявні авторизовані сесії та користувач
  перебуває за комп’ютером, щоб натиснути/підтвердити будь-який запит на під’єднання.
- `profile` — це явне перевизначення, коли вам потрібен конкретний режим браузера.

Установіть `browser.defaultProfile: "openclaw"`, якщо хочете типово використовувати керований режим.

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

- Сервіс керування прив’язується до local loopback на порту, похідному від `gateway.port` (типово `18791` = gateway + 2). Перевизначення `gateway.port` або `OPENCLAW_GATEWAY_PORT` зсуває похідні порти в цій самій родині.
- Локальні профілі `openclaw` автоматично призначають `cdpPort`/`cdpUrl`; установлюйте їх лише для віддаленого CDP. Якщо `cdpUrl` не задано, типово використовується керований локальний порт CDP.
- `remoteCdpTimeoutMs` застосовується до перевірок HTTP-доступності віддаленого й `attachOnly` CDP
  та HTTP-запитів на відкриття вкладок; `remoteCdpHandshakeTimeoutMs` застосовується до
  їхніх CDP WebSocket handshakes.
- `localLaunchTimeoutMs` — це бюджет часу для локально запущеного керованого процесу Chrome,
  щоб він відкрив свій CDP HTTP endpoint. `localCdpReadyTimeoutMs` — це
  подальший бюджет для готовності CDP websocket після виявлення процесу.
  Збільшуйте ці значення на Raspberry Pi, бюджетних VPS або старішому обладнанні, де Chromium
  запускається повільно. Значення мають бути додатними цілими числами до `120000` мс; некоректні
  значення конфігурації відхиляються.
- `actionTimeoutMs` — це типовий бюджет для запитів browser `act`, коли викликач не передає `timeoutMs`. Транспорт клієнта додає невелике вікно запасу, щоб довгі очікування могли завершитися, а не завершувалися за таймаутом на межі HTTP.
- `tabCleanup` — це best-effort очищення вкладок, відкритих первинними сесіями браузера агента. Очищення життєвого циклу subagent, Cron і ACP, як і раніше, закриває їхні явно відстежувані вкладки наприкінці сесії; первинні сесії залишають активні вкладки придатними для повторного використання, а потім у фоновому режимі закривають неактивні або зайві відстежувані вкладки.

</Accordion>

<Accordion title="Політика SSRF">

- Навігація браузера й open-tab захищені від SSRF перед переходом і best-effort повторно перевіряються на фінальному `http(s)` URL після нього.
- У строгому режимі SSRF також перевіряються виявлення віддаленого endpoint CDP і запити `/json/version` (`cdpUrl`).
- Змінні середовища `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` і `NO_PROXY` Gateway/провайдера не проксіюють автоматично браузер, керований OpenClaw. Керований Chrome типово запускається напряму, щоб налаштування проксі провайдера не послаблювали перевірки SSRF браузера.
- Щоб проксіювати сам керований браузер, передайте явні прапорці проксі Chrome через `browser.extraArgs`, наприклад `--proxy-server=...` або `--proxy-pac-url=...`. Строгий режим SSRF блокує явну проксі-маршрутизацію браузера, якщо доступ браузера до приватної мережі не увімкнено навмисно.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` типово вимкнено; вмикайте лише тоді, коли доступ браузера до приватної мережі свідомо вважається довіреним.
- `browser.ssrfPolicy.allowPrivateNetwork` і далі підтримується як застарілий псевдонім.

</Accordion>

<Accordion title="Поведінка профілів">

- `attachOnly: true` означає ніколи не запускати локальний браузер; лише під’єднуватися, якщо він уже працює.
- `headless` можна задавати глобально або для окремого локального керованого профілю. Значення на рівні профілю перевизначають `browser.headless`, тому один локально запущений профіль може залишатися headless, тоді як інший — видимим.
- `POST /start?headless=true` і `openclaw browser start --headless` запитують
  одноразовий headless-запуск для локальних керованих профілів без перезапису
  `browser.headless` або конфігурації профілю. Профілі existing-session, attach-only і
  remote CDP відхиляють це перевизначення, тому що OpenClaw не запускає ці
  процеси браузера.
- На Linux-хостах без `DISPLAY` або `WAYLAND_DISPLAY` локальні керовані профілі
  типово автоматично переходять у headless, якщо ні середовище, ні конфігурація профілю/глобальна
  конфігурація явно не вибирають режим із вікном. `openclaw browser status --json`
  показує `headlessSource` як `env`, `profile`, `config`,
  `request`, `linux-display-fallback` або `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` примусово запускає локальні керовані профілі в headless для
  поточного процесу. `OPENCLAW_BROWSER_HEADLESS=0` примусово вмикає режим із вікном для звичайних
  запусків і повертає зрозумілу помилку на Linux-хостах без display server;
  явний запит `start --headless` усе одно має пріоритет для цього одного запуску.
- `executablePath` можна задавати глобально або для окремого локального керованого профілю. Значення на рівні профілю перевизначають `browser.executablePath`, тому різні керовані профілі можуть запускати різні браузери на базі Chromium. Обидві форми приймають `~` для домашнього каталогу вашої ОС.
- `color` (верхній рівень і рівень профілю) тонує UI браузера, щоб ви могли бачити, який профіль активний.
- Типовий профіль — `openclaw` (керований автономний). Використовуйте `defaultProfile: "user"`, щоб за замовчуванням працювати з авторизованим браузером користувача.
- Порядок автовиявлення: системний типовий браузер, якщо він на базі Chromium; інакше Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` використовує Chrome DevTools MCP замість сирого CDP. Не задавайте `cdpUrl` для цього драйвера.
- Установіть `browser.profiles.<name>.userDataDir`, коли профіль existing-session має під’єднуватися до нетипового профілю користувача Chromium (Brave, Edge тощо). Цей шлях також приймає `~` для домашнього каталогу вашої ОС.

</Accordion>

</AccordionGroup>

## Використання Brave або іншого браузера на базі Chromium

Якщо ваш **системний типовий** браузер працює на базі Chromium (Chrome/Brave/Edge тощо),
OpenClaw використовує його автоматично. Установіть `browser.executablePath`, щоб перевизначити
автовиявлення. Значення `executablePath` верхнього рівня та рівня профілю приймають `~`
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

`executablePath` на рівні профілю впливає лише на локальні керовані профілі, які запускає OpenClaw.
Профілі `existing-session` натомість під’єднуються до вже запущеного браузера,
а віддалені профілі CDP використовують браузер за `cdpUrl`.

## Локальне та віддалене керування

- **Локальне керування (типово):** Gateway запускає сервіс керування на loopback і може запускати локальний браузер.
- **Віддалене керування (хост Node):** запустіть хост Node на машині, де є браузер; Gateway проксіюватиме до нього дії браузера.
- **Віддалений CDP:** задайте `browser.profiles.<name>.cdpUrl` (або `browser.cdpUrl`), щоб
  під’єднатися до віддаленого браузера на базі Chromium. У цьому випадку OpenClaw не запускатиме локальний браузер.
- Для зовнішньо керованих сервісів CDP на loopback (наприклад, Browserless у
  Docker, опублікований на `127.0.0.1`) також задайте `attachOnly: true`. CDP на
  loopback без `attachOnly` вважається локальним профілем браузера, керованим OpenClaw.
- `headless` впливає лише на локальні керовані профілі, які запускає OpenClaw. Він не перезапускає і не змінює браузери existing-session або віддалені браузери CDP.
- `executablePath` підпорядковується тому ж правилу локального керованого профілю. Його зміна для
  запущеного локального керованого профілю позначає цей профіль для перезапуску/узгодження, щоб
  наступний запуск використовував новий бінарний файл.

Поведінка під час зупинки відрізняється залежно від режиму профілю:

- локальні керовані профілі: `openclaw browser stop` зупиняє процес браузера, який
  запустив OpenClaw
- профілі attach-only і віддалені профілі CDP: `openclaw browser stop` закриває активну
  сесію керування та скидає перевизначення емуляції Playwright/CDP (viewport,
  колірну схему, locale, часовий пояс, offline-режим та подібний стан),
  хоча OpenClaw не запускав жодного процесу браузера

Віддалені URL CDP можуть містити автентифікацію:

- токени запиту (наприклад, `https://provider.example?token=<token>`)
- HTTP Basic auth (наприклад, `https://user:pass@provider.example`)

OpenClaw зберігає цю автентифікацію під час виклику endpoint-ів `/json/*` і під час підключення
до CDP WebSocket. Для токенів надавайте перевагу змінним середовища або менеджерам секретів
замість збереження їх у файлах конфігурації.

## Проксі браузера Node (типова поведінка без додаткового налаштування)

Якщо ви запускаєте **хост Node** на машині, де є ваш браузер, OpenClaw може
автоматично маршрутизувати виклики інструмента браузера до цього node без жодної додаткової конфігурації браузера.
Це типовий шлях для віддалених gateway.

Примітки:

- Хост node надає свій локальний сервер керування браузером через **proxy command**.
- Профілі беруться з власної конфігурації `browser.profiles` node (такої самої, як локально).
- `nodeHost.browserProxy.allowProfiles` — необов’язковий. Залиште його порожнім для застарілої/типової поведінки: усі налаштовані профілі залишаються доступними через проксі, включно з маршрутами створення/видалення профілів.
- Якщо ви задаєте `nodeHost.browserProxy.allowProfiles`, OpenClaw трактує це як межу найменших привілеїв: можна націлюватися лише на профілі з allowlist, а маршрути створення/видалення постійних профілів блокуються на поверхні проксі.
- Вимкніть це, якщо воно вам не потрібне:
  - На node: `nodeHost.browserProxy.enabled=false`
  - На gateway: `gateway.nodes.browser.mode="off"`

## Browserless (хостинговий віддалений CDP)

[Browserless](https://browserless.io) — це хостингова служба Chromium, яка надає
URL підключення CDP через HTTPS і WebSocket. OpenClaw може використовувати будь-яку форму, але
для віддаленого профілю браузера найпростішим варіантом є прямий URL WebSocket
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

- Замініть `<BROWSERLESS_API_KEY>` на ваш справжній токен Browserless.
- Виберіть endpoint регіону, який відповідає вашому обліковому запису Browserless (див. їхню документацію).
- Якщо Browserless надає вам базовий URL HTTPS, ви можете або перетворити його на
  `wss://` для прямого CDP-підключення, або залишити URL HTTPS і дозволити OpenClaw
  виявити `/json/version`.

### Browserless Docker на тому ж хості

Коли Browserless самостійно розгорнуто в Docker, а OpenClaw працює на хості, розглядайте
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
OpenClaw. Browserless також має оголошувати відповідний досяжний endpoint; задайте
для Browserless `EXTERNAL` на ту саму публічно-доступну для OpenClaw базу WebSocket, наприклад
`ws://127.0.0.1:3000`, `ws://browserless:3000` або стабільну приватну адресу
мережі Docker. Якщо `/json/version` повертає `webSocketDebuggerUrl`, що вказує на
адресу, недосяжну для OpenClaw, CDP HTTP може виглядати справним, тоді як під’єднання до WebSocket усе одно не вдасться.

Не залишайте `attachOnly` незаданим для профілю Browserless на loopback. Без
`attachOnly` OpenClaw розглядає порт loopback як локальний керований профіль браузера
і може повідомити, що порт зайнятий, але не належить OpenClaw.

## Провайдери прямого WebSocket CDP

Деякі хостингові сервіси браузерів надають **прямий endpoint WebSocket** замість
стандартного виявлення CDP на основі HTTP (`/json/version`). OpenClaw приймає три
форми URL CDP і автоматично вибирає правильну стратегію підключення:

- **HTTP(S) виявлення** — `http://host[:port]` або `https://host[:port]`.
  OpenClaw викликає `/json/version`, щоб виявити URL відладчика WebSocket, а потім
  підключається. Резервного переходу на WebSocket немає.
- **Прямі endpoint-и WebSocket** — `ws://host[:port]/devtools/<kind>/<id>` або
  `wss://...` зі шляхом `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw підключається безпосередньо через handshake WebSocket і повністю пропускає
  `/json/version`.
- **Базові корені WebSocket** — `ws://host[:port]` або `wss://host[:port]` без
  шляху `/devtools/...` (наприклад, [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw спочатку пробує HTTP
  виявлення `/json/version` (нормалізуючи схему до `http`/`https`);
  якщо виявлення повертає `webSocketDebuggerUrl`, він використовується, інакше OpenClaw
  переходить до прямого handshake WebSocket на базовому корені. Якщо оголошений
  endpoint WebSocket відхиляє handshake CDP, але налаштований базовий корінь
  його приймає, OpenClaw також переходить до цього кореня. Це дозволяє базовому `ws://`,
  спрямованому на локальний Chrome, усе ж під’єднатися, оскільки Chrome приймає оновлення
  WebSocket лише на конкретному шляху для цілі з `/json/version`, тоді як хостингові
  провайдери все ще можуть використовувати свій кореневий endpoint WebSocket, коли їхній endpoint
  виявлення оголошує короткоживучий URL, непридатний для Playwright CDP.

### Browserbase

[Browserbase](https://www.browserbase.com) — це хмарна платформа для запуску
headless-браузерів із вбудованим розв’язанням CAPTCHA, stealth-режимом і residential
proxy.

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
  з [панелі Overview](https://www.browserbase.com/overview).
- Замініть `<BROWSERBASE_API_KEY>` на ваш справжній API-ключ Browserbase.
- Browserbase автоматично створює сесію браузера під час WebSocket-підключення, тож
  окремий крок ручного створення сесії не потрібен.
- Безкоштовний тариф дозволяє одну одночасну сесію і одну browser-hour на місяць.
  Обмеження платних тарифів дивіться в [pricing](https://www.browserbase.com/pricing).
- Повний довідник API, посібники з SDK та приклади інтеграції дивіться в [документації Browserbase](https://docs.browserbase.com).

## Безпека

Ключові ідеї:

- Керування браузером доступне лише через loopback; доступ проходить через auth Gateway або pairing node.
- Окремий HTTP API браузера на loopback використовує **лише автентифікацію спільним секретом**:
  bearer auth токеном gateway, `x-openclaw-password` або HTTP Basic auth із
  налаштованим паролем gateway.
- Заголовки ідентифікації Tailscale Serve та `gateway.auth.mode: "trusted-proxy"`
  **не** автентифікують цей окремий loopback API браузера.
- Якщо керування браузером увімкнено і не налаштовано жодної автентифікації спільним секретом, OpenClaw
  автоматично генерує `gateway.auth.token` під час запуску та зберігає його в конфігурації.
- OpenClaw **не** генерує цей токен автоматично, якщо `gateway.auth.mode` вже встановлено в
  `password`, `none` або `trusted-proxy`.
- Тримайте Gateway і будь-які хости node у приватній мережі (Tailscale); уникайте публічного доступу.
- Розглядайте віддалені URL/токени CDP як секрети; надавайте перевагу змінним середовища або менеджеру секретів.

Поради щодо віддаленого CDP:

- За можливості надавайте перевагу зашифрованим endpoint-ам (HTTPS або WSS) і короткоживучим токенам.
- Уникайте вбудовування довгоживучих токенів безпосередньо у файли конфігурації.

## Профілі (кілька браузерів)

OpenClaw підтримує кілька іменованих профілів (конфігурацій маршрутизації). Профілі можуть бути такими:

- **керовані OpenClaw**: окремий екземпляр браузера на базі Chromium із власним каталогом даних користувача + портом CDP
- **віддалені**: явний URL CDP (браузер на базі Chromium працює деінде)
- **наявна сесія**: ваш наявний профіль Chrome через автоматичне підключення Chrome DevTools MCP

Типові значення:

- Профіль `openclaw` створюється автоматично, якщо відсутній.
- Профіль `user` вбудований для під’єднання existing-session через Chrome MCP.
- Профілі existing-session, окрім `user`, вмикаються явно; створюйте їх за допомогою `--driver existing-session`.
- Локальні порти CDP типово виділяються з діапазону **18800–18899**.
- Видалення профілю переміщує його локальний каталог даних у Trash.

Усі endpoint-и керування приймають `?profile=<name>`; CLI використовує `--browser-profile`.

## Existing session через Chrome DevTools MCP

OpenClaw також може під’єднатися до запущеного профілю браузера на базі Chromium через
офіційний сервер Chrome DevTools MCP. Це повторно використовує вкладки та стан входу,
які вже відкриті в цьому профілі браузера.

Офіційні матеріали та посилання з налаштування:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [README Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Вбудований профіль:

- `user`

Необов’язково: створіть власний профіль existing-session, якщо хочете
іншу назву, колір або каталог даних браузера.

Типова поведінка:

- Вбудований профіль `user` використовує автоматичне підключення Chrome MCP, яке націлюється на
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
3. Залиште браузер запущеним і підтвердьте запит на підключення, коли OpenClaw приєднається.

Поширені сторінки inspect:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Живий smoke-тест під’єднання:

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
- `tabs` показує список уже відкритих вкладок вашого браузера
- `snapshot` повертає refs із вибраної живої вкладки

Що перевірити, якщо під’єднання не працює:

- цільовий браузер на базі Chromium має версію `144+`
- у сторінці inspect цього браузера увімкнено remote debugging
- браузер показав запит на згоду на під’єднання, і ви його підтвердили
- `openclaw doctor` мігрує стару конфігурацію браузера на базі розширення та перевіряє,
  що Chrome локально встановлено для типових профілів auto-connect, але він не може
  увімкнути remote debugging у самому браузері за вас

Використання агентом:

- Використовуйте `profile="user"`, коли потрібен авторизований стан браузера користувача.
- Якщо ви використовуєте власний профіль existing-session, передайте явну назву цього профілю.
- Обирайте цей режим лише тоді, коли користувач перебуває за комп’ютером, щоб підтвердити
  запит на під’єднання.
- Gateway або хост node може запускати `npx chrome-devtools-mcp@latest --autoConnect`

Примітки:

- Цей шлях є ризикованішим, ніж ізольований профіль `openclaw`, оскільки він може
  виконувати дії у вашій авторизованій сесії браузера.
- OpenClaw не запускає браузер для цього драйвера; він лише під’єднується.
- Тут OpenClaw використовує офіційний потік Chrome DevTools MCP `--autoConnect`. Якщо
  задано `userDataDir`, його буде передано далі для націлювання на цей каталог даних користувача.
- Existing-session може під’єднуватися на вибраному хості або через підключений
  браузерний node. Якщо Chrome працює деінде і жоден browser node не підключено, використовуйте
  віддалений CDP або хост node.

### Власний запуск Chrome MCP

Перевизначте сервер Chrome DevTools MCP, який запускається для кожного профілю, коли типовий
потік `npx chrome-devtools-mcp@latest` вам не підходить (офлайн-хости,
зафіксовані версії, вендорні бінарні файли):

| Поле        | Що воно робить                                                                                                              |
| ----------- | --------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Виконуваний файл, який запускається замість `npx`. Розв’язується як є; абсолютні шляхи підтримуються.                     |
| `mcpArgs`    | Масив аргументів, який без змін передається до `mcpCommand`. Замінює типові аргументи `chrome-devtools-mcp@latest --autoConnect`. |

Коли для профілю existing-session задано `cdpUrl`, OpenClaw пропускає
`--autoConnect` і автоматично передає endpoint до Chrome MCP:

- `http(s)://...` → `--browserUrl <url>` (endpoint HTTP-виявлення DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (прямий CDP WebSocket).

Прапорці endpoint-ів і `userDataDir` не можна поєднувати: коли задано `cdpUrl`,
`userDataDir` ігнорується під час запуску Chrome MCP, оскільки Chrome MCP під’єднується до
запущеного браузера за цим endpoint-ом, а не відкриває каталог профілю.

<Accordion title="Обмеження можливостей existing-session">

Порівняно з керованим профілем `openclaw`, драйвери existing-session мають більше обмежень:

- **Знімки екрана** — працюють захоплення сторінки та захоплення елементів через `--ref`; CSS-селектори `--element` не підтримуються. `--full-page` не можна поєднувати з `--ref` або `--element`. Playwright не потрібен для знімків екрана сторінки або елементів на основі ref.
- **Дії** — `click`, `type`, `hover`, `scrollIntoView`, `drag` і `select` вимагають snapshot refs (без CSS-селекторів). `click-coords` натискає по видимих координатах viewport і не вимагає snapshot ref. `click` підтримує лише ліву кнопку миші. `type` не підтримує `slowly=true`; використовуйте `fill` або `press`. `press` не підтримує `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` і `evaluate` не підтримують таймаути для окремих викликів. `select` приймає одне значення.
- **Очікування / вивантаження / діалоги** — `wait --url` підтримує точні, підрядкові та glob-шаблони; `wait --load networkidle` не підтримується. Хуки вивантаження вимагають `ref` або `inputRef`, по одному файлу за раз, без CSS `element`. Хуки діалогів не підтримують перевизначення таймаутів.
- **Функції лише для керованого режиму** — пакетні дії, експорт PDF, перехоплення завантажень і `responsebody` усе ще вимагають шляху керованого браузера.

</Accordion>

## Гарантії ізоляції

- **Окремий user data dir**: ніколи не торкається вашого особистого профілю браузера.
- **Окремі порти**: уникає `9222`, щоб не було конфліктів із dev-робочими процесами.
- **Детерміноване керування вкладками**: `tabs` спочатку повертає `suggestedTargetId`, а потім
  стабільні обробники `tabId`, як-от `t1`, необов’язкові мітки та сирий `targetId`.
  Агенти мають повторно використовувати `suggestedTargetId`; сирі id залишаються доступними для
  налагодження та сумісності.

## Вибір браузера

Під час локального запуску OpenClaw вибирає перший доступний варіант:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Ви можете перевизначити це через `browser.executablePath`.

Платформи:

- macOS: перевіряє `/Applications` і `~/Applications`.
- Linux: перевіряє поширені розташування Chrome/Brave/Edge/Chromium у `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` і
  `/usr/lib/chromium-browser`.
- Windows: перевіряє поширені місця встановлення.

## API керування (необов’язково)

Для скриптів і налагодження Gateway надає невеликий **HTTP API керування
лише для loopback** плюс відповідний CLI `openclaw browser` (snapshots, refs, wait
power-ups, вивід JSON, робочі процеси налагодження). Повний довідник дивіться в
[API керування браузером](/uk/tools/browser-control).

## Усунення несправностей

Для проблем, специфічних для Linux (особливо snap Chromium), дивіться
[Усунення несправностей браузера](/uk/tools/browser-linux-troubleshooting).

Для конфігурацій WSL2 Gateway + Windows Chrome на розділених хостах дивіться
[Усунення несправностей WSL2 + Windows + віддалений Chrome CDP](/uk/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Помилка запуску CDP проти блокування SSRF під час навігації

Це різні класи помилок, і вони вказують на різні шляхи в коді.

- **Помилка запуску або готовності CDP** означає, що OpenClaw не може підтвердити, що площина керування браузером працює справно.
- **Блокування SSRF під час навігації** означає, що площина керування браузером працює справно, але ціль переходу сторінки відхилено політикою.

Поширені приклади:

- Помилка запуску або готовності CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw`, коли
    зовнішній сервіс CDP на loopback налаштовано без `attachOnly: true`
- Блокування SSRF під час навігації:
  - потоки `open`, `navigate`, snapshot або відкриття вкладок завершуються з помилкою політики браузера/мережі, тоді як `start` і `tabs` усе ще працюють

Використайте цю мінімальну послідовність, щоб розрізнити ці два випадки:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Як читати результати:

- Якщо `start` завершується з `not reachable after start`, спочатку усувайте проблеми готовності CDP.
- Якщо `start` успішний, але `tabs` завершується помилкою, площина керування все ще несправна. Розглядайте це як проблему досяжності CDP, а не проблему навігації сторінкою.
- Якщо `start` і `tabs` успішні, але `open` або `navigate` завершуються помилкою, площина керування браузером працює, а проблема в політиці навігації або в цільовій сторінці.
- Якщо `start`, `tabs` і `open` усі успішні, базовий шлях керування керованим браузером працює справно.

Важливі деталі поведінки:

- Конфігурація браузера типово використовує fail-closed об’єкт політики SSRF, навіть якщо ви не налаштовуєте `browser.ssrfPolicy`.
- Для локального керованого профілю `openclaw` на loopback перевірки справності CDP навмисно пропускають перевірку досяжності SSRF браузера для власної локальної площини керування OpenClaw.
- Захист навігації є окремим. Успішний результат `start` або `tabs` не означає, що подальша ціль `open` або `navigate` дозволена.

Вказівки з безпеки:

- **Не** послаблюйте політику SSRF браузера типово.
- Надавайте перевагу вузьким виняткам для хостів, таким як `hostnameAllowlist` або `allowedHostnames`, замість широкого доступу до приватної мережі.
- Використовуйте `dangerouslyAllowPrivateNetwork: true` лише в навмисно довірених середовищах, де доступ браузера до приватної мережі потрібен і перевірений.

## Інструменти агента + як працює керування

Агент отримує **один інструмент** для автоматизації браузера:

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Як це зіставляється:

- `browser snapshot` повертає стабільне дерево UI (AI або ARIA).
- `browser act` використовує `ref` ID із snapshot для натискання/введення/перетягування/вибору.
- `browser screenshot` захоплює пікселі (усю сторінку, елемент або позначені refs).
- `browser doctor` перевіряє готовність Gateway, Plugin, профілю, браузера та вкладки.
- `browser` приймає:
  - `profile` для вибору іменованого профілю браузера (openclaw, chrome або віддалений CDP).
  - `target` (`sandbox` | `host` | `node`) для вибору, де розташований браузер.
  - У сесіях із sandbox `target: "host"` вимагає `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Якщо `target` не задано: сесії в sandbox типово використовують `sandbox`, а сесії без sandbox — `host`.
  - Якщо підключено node з підтримкою браузера, інструмент може автоматично маршрутизуватися до нього, якщо ви не зафіксуєте `target="host"` або `target="node"`.

Це зберігає детермінованість агента й допомагає уникати крихких селекторів.

## Пов’язане

- [Огляд інструментів](/uk/tools) — усі доступні інструменти агента
- [Ізоляція sandbox](/uk/gateway/sandboxing) — керування браузером у sandbox-середовищах
- [Безпека](/uk/gateway/security) — ризики керування браузером і посилення захисту
