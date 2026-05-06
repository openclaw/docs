---
read_when:
    - Додавання керованої агентом автоматизації браузера
    - Діагностика того, чому OpenClaw заважає вашому власному Chrome
    - Реалізація налаштувань браузера та життєвого циклу в застосунку macOS
summary: Інтегрована служба керування браузером + команди дій
title: Браузер (керований OpenClaw)
x-i18n:
    generated_at: "2026-05-06T12:51:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1c9f79b4f8b9921724130b4793584facf1bfbe2de5fb21faa54274a4294dedd0
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw може запускати **виділений профіль Chrome/Brave/Edge/Chromium**, яким керує агент.
Він ізольований від вашого особистого браузера й керується через невелику локальну
службу керування всередині Gateway (лише loopback).

Погляд для початківців:

- Думайте про нього як про **окремий браузер лише для агента**.
- Профіль `openclaw` **не** торкається вашого особистого профілю браузера.
- Агент може **відкривати вкладки, читати сторінки, клацати й вводити текст** у безпечному каналі.
- Вбудований профіль `user` підʼєднується до вашого справжнього сеансу Chrome із виконаним входом через Chrome MCP.

## Що ви отримуєте

- Окремий профіль браузера з назвою **openclaw** (за замовчуванням із помаранчевим акцентом).
- Детерміноване керування вкладками (перелік/відкриття/фокус/закриття).
- Дії агента (клацання/введення/перетягування/вибір), знімки стану, скриншоти, PDF.
- Вбудований skill `browser-automation`, який навчає агентів циклу відновлення
  для знімків стану, стабільних вкладок, застарілих посилань і ручних блокерів, коли
  browser plugin увімкнено.
- Додаткова підтримка кількох профілів (`openclaw`, `work`, `remote`, ...).

Цей браузер **не** є вашим щоденним браузером. Це безпечна ізольована поверхня для
автоматизації й перевірки агентом.

## Швидкий старт

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Якщо ви отримали "Browser disabled", увімкніть його в конфігурації (див. нижче) і перезапустіть
Gateway.

Якщо `openclaw browser` повністю відсутня або агент каже, що browser tool
недоступний, перейдіть до [Відсутня команда або інструмент браузера](/uk/tools/browser#missing-browser-command-or-tool).

## Керування Plugin

Стандартний інструмент `browser` є вбудованим plugin. Вимкніть його, щоб замінити іншим plugin, який реєструє ту саму назву інструмента `browser`:

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

Для стандартних значень потрібні і `plugins.entries.browser.enabled`, **і** `browser.enabled=true`. Вимкнення лише plugin видаляє CLI `openclaw browser`, gateway-метод `browser.request`, інструмент агента й службу керування як єдине ціле; ваша конфігурація `browser.*` залишається неушкодженою для заміни.

Зміни конфігурації браузера потребують перезапуску Gateway, щоб plugin міг повторно зареєструвати свою службу.

## Настанови для агента

Примітка щодо профілю інструментів: `tools.profile: "coding"` містить `web_search` і
`web_fetch`, але не містить повний інструмент `browser`. Якщо агент або
створений підагент має використовувати автоматизацію браузера, додайте браузер на етапі
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
Самого `tools.subagents.tools.allow: ["browser"]` недостатньо, бо політика підагентів
застосовується після фільтрації профілю.

Browser plugin постачає два рівні настанов для агента:

- Опис інструмента `browser` містить компактний постійно активний контракт: вибирайте
  правильний профіль, тримайте посилання в межах тієї самої вкладки, використовуйте `tabId`/мітки для
  націлювання на вкладки й завантажуйте browser skill для багатоетапної роботи.
- Вбудований skill `browser-automation` містить довший робочий цикл:
  спершу перевірити статус/вкладки, позначити вкладки завдання, зробити знімок стану перед дією, повторно зробити знімок
  після змін UI, один раз відновитися після застарілих посилань і повідомляти про вхід/2FA/captcha або
  блокери камери/мікрофона як про ручну дію замість здогадок.

Skills, вбудовані в plugin, перелічені серед доступних агенту skills, коли
plugin увімкнено. Повні інструкції skill завантажуються на вимогу, тому звичайні
ходи не платять повну вартість у токенах.

## Відсутня команда або інструмент браузера

Якщо `openclaw browser` невідома після оновлення, `browser.request` відсутній або агент повідомляє, що інструмент browser недоступний, звична причина — список `plugins.allow`, який не містить `browser`, і відсутній кореневий блок конфігурації `browser`. Додайте його:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Явний кореневий блок `browser`, наприклад `browser.enabled=true` або `browser.profiles.<name>`, активує вбудований browser plugin навіть за обмежувального `plugins.allow`, відповідно до поведінки конфігурації каналів. `plugins.entries.browser.enabled=true` і `tools.alsoAllow: ["browser"]` самі по собі не замінюють членство в allowlist. Повне видалення `plugins.allow` також відновлює стандартну поведінку.

## Профілі: `openclaw` проти `user`

- `openclaw`: керований, ізольований браузер (розширення не потрібне).
- `user`: вбудований профіль підʼєднання Chrome MCP для вашого **справжнього Chrome із виконаним входом**
  сеансу.

Для викликів browser tool агентом:

- За замовчуванням: використовуйте ізольований браузер `openclaw`.
- Надавайте перевагу `profile="user"`, коли важливі наявні сеанси з виконаним входом і користувач
  перебуває за компʼютером, щоб клацнути/підтвердити будь-який запит підʼєднання.
- `profile` є явним перевизначенням, коли потрібен конкретний режим браузера.

Встановіть `browser.defaultProfile: "openclaw"`, якщо хочете керований режим за замовчуванням.

## Конфігурація

Налаштування браузера містяться в `~/.openclaw/openclaw.json`.

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

<Accordion title="Ports and reachability">

- Служба керування привʼязується до loopback на порту, похідному від `gateway.port` (за замовчуванням `18791` = gateway + 2). Перевизначення `gateway.port` або `OPENCLAW_GATEWAY_PORT` зміщує похідні порти в тій самій групі.
- Локальні профілі `openclaw` автоматично призначають `cdpPort`/`cdpUrl`; встановлюйте їх лише для віддаленого CDP. `cdpUrl` за замовчуванням вказує на керований локальний порт CDP, якщо не заданий.
- `remoteCdpTimeoutMs` застосовується до перевірок досяжності HTTP для віддалених і `attachOnly` CDP
  та HTTP-запитів відкриття вкладок; `remoteCdpHandshakeTimeoutMs` застосовується до
  їхніх CDP WebSocket handshake.
- `localLaunchTimeoutMs` — це бюджет для локально запущеного керованого процесу Chrome,
  щоб відкрити свій HTTP endpoint CDP. `localCdpReadyTimeoutMs` — це
  подальший бюджет для готовності CDP websocket після виявлення процесу.
  Збільшуйте їх на Raspberry Pi, VPS нижчого класу або старішому обладнанні, де Chromium
  запускається повільно. Значення мають бути додатними цілими числами до `120000` ms; некоректні
  значення конфігурації відхиляються.
- Повторні збої запуску/готовності керованого Chrome розриваються circuit breaker для кожного
  профілю. Після кількох послідовних збоїв OpenClaw ненадовго призупиняє нові спроби
  запуску замість того, щоб створювати Chromium під час кожного виклику browser tool. Виправте
  проблему запуску, вимкніть браузер, якщо він не потрібен, або перезапустіть
  Gateway після виправлення.
- `actionTimeoutMs` — це стандартний бюджет для запитів browser `act`, коли викликач не передає `timeoutMs`. Клієнтський транспорт додає невелике резервне вікно, щоб довгі очікування могли завершитися замість тайм-ауту на межі HTTP.
- `tabCleanup` — це best-effort очищення вкладок, відкритих основними сеансами браузера агента. Підагент, cron і очищення життєвого циклу ACP все одно закривають свої явно відстежувані вкладки наприкінці сеансу; основні сеанси зберігають активні вкладки придатними для повторного використання, а потім закривають неактивні або надлишкові відстежувані вкладки у фоновому режимі.

</Accordion>

<Accordion title="SSRF policy">

- Навігація браузера й відкриття вкладок захищені SSRF-перевірками перед навігацією та, за можливості, повторно перевіряються на фінальному `http(s)` URL після цього.
- У строгому режимі SSRF виявлення віддаленого CDP endpoint і probes `/json/version` (`cdpUrl`) також перевіряються.
- Змінні середовища Gateway/provider `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` і `NO_PROXY` не проксіюють автоматично браузер, керований OpenClaw. Керований Chrome за замовчуванням запускається напряму, щоб налаштування proxy провайдера не послаблювали SSRF-перевірки браузера.
- Щоб проксіювати сам керований браузер, передайте явні прапорці proxy Chrome через `browser.extraArgs`, як-от `--proxy-server=...` або `--proxy-pac-url=...`. Строгий режим SSRF блокує явну маршрутизацію proxy браузера, якщо доступ браузера до приватної мережі не ввімкнено навмисно.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` вимкнено за замовчуванням; вмикайте лише тоді, коли доступ браузера до приватної мережі навмисно вважається довіреним.
- `browser.ssrfPolicy.allowPrivateNetwork` залишається підтримуваним як застарілий alias.

</Accordion>

<Accordion title="Profile behavior">

- `attachOnly: true` означає ніколи не запускати локальний браузер; під'єднуватися лише якщо він уже запущений.
- `headless` можна встановити глобально або для окремого локального керованого профілю. Значення профілю перевизначають `browser.headless`, тож один локально запущений профіль може залишатися headless, а інший залишатися видимим.
- `POST /start?headless=true` і `openclaw browser start --headless` запитують
  одноразовий headless-запуск для локальних керованих профілів без переписування
  `browser.headless` або конфігурації профілю. Профілі з наявним сеансом, attach-only і
  віддалені CDP-профілі відхиляють перевизначення, оскільки OpenClaw не запускає ці
  браузерні процеси.
- На Linux-хостах без `DISPLAY` або `WAYLAND_DISPLAY` локальні керовані профілі
  автоматично переходять у headless за замовчуванням, коли ні середовище, ні профільна/глобальна
  конфігурація явно не вибирають headed-режим. `openclaw browser status --json`
  повідомляє `headlessSource` як `env`, `profile`, `config`,
  `request`, `linux-display-fallback` або `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` примусово запускає локальні керовані профілі headless для
  поточного процесу. `OPENCLAW_BROWSER_HEADLESS=0` примусово вмикає headed-режим для звичайних
  запусків і повертає придатну до дії помилку на Linux-хостах без дисплейного сервера;
  явний запит `start --headless` усе одно має перевагу для цього одного запуску.
- `executablePath` можна встановити глобально або для окремого локального керованого профілю. Значення профілю перевизначають `browser.executablePath`, тож різні керовані профілі можуть запускати різні браузери на основі Chromium. Обидві форми приймають `~` для домашнього каталогу вашої ОС.
- `color` (верхнього рівня і для профілю) підфарбовує інтерфейс браузера, щоб було видно, який профіль активний.
- Типовий профіль — `openclaw` (керований автономний). Використовуйте `defaultProfile: "user"`, щоб вибрати браузер користувача з виконаним входом.
- Порядок автовиявлення: системний браузер за замовчуванням, якщо він на основі Chromium; інакше Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` використовує Chrome DevTools MCP замість сирого CDP. Не встановлюйте `cdpUrl` для цього драйвера.
- Встановіть `browser.profiles.<name>.userDataDir`, коли профіль existing-session має під'єднуватися до нетипового користувацького профілю Chromium (Brave, Edge тощо). Цей шлях також приймає `~` для домашнього каталогу вашої ОС.

</Accordion>

</AccordionGroup>

## Використовуйте Brave або інший браузер на основі Chromium

Якщо ваш **системний браузер за замовчуванням** базується на Chromium (Chrome/Brave/Edge/тощо),
OpenClaw використовує його автоматично. Встановіть `browser.executablePath`, щоб перевизначити
автовиявлення. Значення `executablePath` верхнього рівня і для профілю приймають `~`
для домашнього каталогу вашої ОС:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

Або встановіть це в конфігурації для кожної платформи:

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

Профільний `executablePath` впливає лише на локальні керовані профілі, які
запускає OpenClaw. Профілі `existing-session` натомість під'єднуються до вже запущеного браузера,
а віддалені CDP-профілі використовують браузер за `cdpUrl`.

## Локальне й віддалене керування

- **Локальне керування (за замовчуванням):** Gateway запускає loopback-сервіс керування і може запускати локальний браузер.
- **Віддалене керування (node host):** запустіть node host на машині, де є браузер; Gateway проксіює дії браузера до нього.
- **Віддалений CDP:** встановіть `browser.profiles.<name>.cdpUrl` (або `browser.cdpUrl`), щоб
  під'єднатися до віддаленого браузера на основі Chromium. У цьому випадку OpenClaw не запускатиме локальний браузер.
- Для зовнішньо керованих CDP-сервісів на loopback (наприклад Browserless у
  Docker, опублікований на `127.0.0.1`) також встановіть `attachOnly: true`. Loopback CDP
  без `attachOnly` розглядається як локальний браузерний профіль, керований OpenClaw.
- `headless` впливає лише на локальні керовані профілі, які запускає OpenClaw. Він не перезапускає і не змінює браузери existing-session або віддалені CDP-браузери.
- `executablePath` дотримується того самого правила локального керованого профілю. Його зміна в
  запущеному локальному керованому профілі позначає цей профіль для перезапуску/узгодження, щоб
  наступний запуск використовував новий виконуваний файл.

Поведінка зупинки відрізняється залежно від режиму профілю:

- локальні керовані профілі: `openclaw browser stop` зупиняє браузерний процес, який
  запустив OpenClaw
- attach-only і віддалені CDP-профілі: `openclaw browser stop` закриває активний
  сеанс керування і звільняє перевизначення емуляції Playwright/CDP (viewport,
  колірну схему, локаль, часовий пояс, офлайн-режим і подібний стан), навіть
  якщо OpenClaw не запускав жодного браузерного процесу

Віддалені CDP URL можуть містити автентифікацію:

- Токени запиту (наприклад, `https://provider.example?token=<token>`)
- HTTP Basic auth (наприклад, `https://user:pass@provider.example`)

OpenClaw зберігає автентифікацію під час виклику кінцевих точок `/json/*` і під час підключення
до CDP WebSocket. Для токенів віддавайте перевагу змінним середовища або менеджерам секретів
замість комітування їх у конфігураційні файли.

## Node browser proxy (типовий варіант без конфігурації)

Якщо ви запускаєте **node host** на машині, де є ваш браузер, OpenClaw може
автоматично маршрутизувати виклики браузерних інструментів до цього node без додаткової конфігурації браузера.
Це типовий шлях для віддалених Gateway.

Примітки:

- Node host надає свій локальний сервер керування браузером через **proxy command**.
- Профілі беруться з власної конфігурації `browser.profiles` цього node (так само, як локально).
- `nodeHost.browserProxy.allowProfiles` є необов'язковим. Залиште його порожнім для застарілої/типової поведінки: усі налаштовані профілі залишаються доступними через proxy, включно з маршрутами створення/видалення профілів.
- Якщо встановити `nodeHost.browserProxy.allowProfiles`, OpenClaw трактує це як межу мінімальних привілеїв: ціллю можуть бути лише профілі з allowlist, а постійні маршрути створення/видалення профілів блокуються на поверхні proxy.
- Вимкніть, якщо це вам не потрібно:
  - На node: `nodeHost.browserProxy.enabled=false`
  - На gateway: `gateway.nodes.browser.mode="off"`

## Browserless (розміщений віддалений CDP)

[Browserless](https://browserless.io) — це розміщений сервіс Chromium, який надає
URL підключення CDP через HTTPS і WebSocket. OpenClaw може використовувати будь-яку форму, але
для віддаленого браузерного профілю найпростіший варіант — прямий WebSocket URL
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
- Виберіть регіональну кінцеву точку, що відповідає вашому обліковому запису Browserless (див. їхню документацію).
- Якщо Browserless надає HTTPS базовий URL, ви можете або перетворити його на
  `wss://` для прямого CDP-підключення, або залишити HTTPS URL і дозволити OpenClaw
  виявити `/json/version`.

### Browserless Docker на тому самому хості

Коли Browserless самостійно розгорнуто в Docker, а OpenClaw працює на хості, розглядайте
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
OpenClaw. Browserless також має рекламувати відповідну доступну кінцеву точку;
встановіть Browserless `EXTERNAL` у той самий публічний для OpenClaw WebSocket-базис, наприклад
`ws://127.0.0.1:3000`, `ws://browserless:3000` або стабільну приватну адресу мережі Docker.
Якщо `/json/version` повертає `webSocketDebuggerUrl`, що вказує на адресу,
недоступну для OpenClaw, CDP HTTP може виглядати справним, тоді як WebSocket-під'єднання
все одно не вдаватиметься.

Не залишайте `attachOnly` невстановленим для loopback-профілю Browserless. Без
`attachOnly` OpenClaw трактує loopback-порт як локальний керований браузерний
профіль і може повідомити, що порт використовується, але не належить OpenClaw.

## Прямі постачальники WebSocket CDP

Деякі розміщені браузерні сервіси надають **пряму WebSocket** кінцеву точку, а не
стандартне HTTP-виявлення CDP (`/json/version`). OpenClaw приймає три
форми CDP URL і автоматично вибирає правильну стратегію підключення:

- **HTTP(S)-виявлення** - `http://host[:port]` або `https://host[:port]`.
  OpenClaw викликає `/json/version`, щоб виявити WebSocket debugger URL, а потім
  підключається. Без WebSocket fallback.
- **Прямі WebSocket кінцеві точки** - `ws://host[:port]/devtools/<kind>/<id>` або
  `wss://...` зі шляхом `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw підключається напряму через WebSocket handshake і повністю пропускає
  `/json/version`.
- **Голі WebSocket-корені** - `ws://host[:port]` або `wss://host[:port]` без
  шляху `/devtools/...` (наприклад [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw спершу пробує HTTP
  виявлення `/json/version` (нормалізуючи схему до `http`/`https`);
  якщо виявлення повертає `webSocketDebuggerUrl`, він використовується, інакше OpenClaw
  повертається до прямого WebSocket handshake на голому корені. Якщо рекламована
  WebSocket кінцева точка відхиляє CDP handshake, але налаштований голий корінь
  приймає його, OpenClaw також повертається до цього кореня. Це дозволяє голому `ws://`,
  спрямованому на локальний Chrome, все одно підключитися, оскільки Chrome приймає WebSocket
  upgrade лише на конкретному шляху цілі з `/json/version`, тоді як розміщені
  постачальники можуть і далі використовувати свою кореневу WebSocket кінцеву точку, коли їхня кінцева точка
  виявлення рекламує короткоживучий URL, непридатний для Playwright CDP.

### Browserbase

[Browserbase](https://www.browserbase.com) — це хмарна платформа для запуску
headless-браузерів із вбудованим розв'язанням CAPTCHA, stealth mode і резидентськими
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
- Замініть `<BROWSERBASE_API_KEY>` на ваш справжній API-ключ Browserbase.
- Browserbase автоматично створює браузерний сеанс під час WebSocket-підключення, тому
  ручний крок створення сеансу не потрібен.
- Безкоштовний рівень дозволяє один одночасний сеанс і одну браузерну годину на місяць.
  Див. [ціни](https://www.browserbase.com/pricing) щодо обмежень платних планів.
- Див. [документацію Browserbase](https://docs.browserbase.com) для повного API
  довідника, посібників SDK і прикладів інтеграції.

## Безпека

Ключові ідеї:

- Керування браузером доступне лише через loopback; доступ проходить через автентифікацію Gateway або спарювання Node.
- Автономний HTTP API браузера через loopback використовує **лише автентифікацію зі спільним секретом**:
  bearer-автентифікацію токеном Gateway, `x-openclaw-password` або HTTP Basic auth із
  налаштованим паролем Gateway.
- Заголовки ідентичності Tailscale Serve і `gateway.auth.mode: "trusted-proxy"` 
  **не** автентифікують цей автономний API браузера через loopback.
- Якщо керування браузером увімкнено, а автентифікацію зі спільним секретом не налаштовано, OpenClaw
  генерує токен Gateway лише на час виконання для цього запуску. Налаштуйте
  `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` або
  `OPENCLAW_GATEWAY_PASSWORD` явно, якщо клієнтам потрібен стабільний секрет між
  перезапусками.
- OpenClaw **не** генерує цей токен автоматично, коли `gateway.auth.mode` уже має значення
  `password`, `none` або `trusted-proxy`.
- Тримайте Gateway і будь-які хости Node у приватній мережі (Tailscale); уникайте публічного доступу.
- Вважайте віддалені URL-адреси/токени CDP секретами; надавайте перевагу змінним середовища або менеджеру секретів.

Поради щодо віддаленого CDP:

- За можливості надавайте перевагу зашифрованим кінцевим точкам (HTTPS або WSS) і короткостроковим токенам.
- Уникайте вбудовування довгострокових токенів безпосередньо у файли конфігурації.

## Профілі (кілька браузерів)

OpenClaw підтримує кілька іменованих профілів (конфігурацій маршрутизації). Профілі можуть бути:

- **openclaw-managed**: виділений екземпляр браузера на основі Chromium із власним каталогом даних користувача + портом CDP
- **remote**: явна URL-адреса CDP (браузер на основі Chromium, що працює деінде)
- **existing session**: ваш наявний профіль Chrome через автоматичне підключення Chrome DevTools MCP

Типові значення:

- Профіль `openclaw` створюється автоматично, якщо його немає.
- Профіль `user` вбудований для приєднання до наявного сеансу Chrome MCP.
- Профілі наявних сеансів, окрім `user`, потребують явного ввімкнення; створюйте їх із `--driver existing-session`.
- Локальні порти CDP типово виділяються з діапазону **18800-18899**.
- Видалення профілю переміщує його локальний каталог даних до Кошика.

Усі кінцеві точки керування приймають `?profile=<name>`; CLI використовує `--browser-profile`.

## Наявний сеанс через Chrome DevTools MCP

OpenClaw також може приєднуватися до запущеного профілю браузера на основі Chromium через
офіційний сервер Chrome DevTools MCP. Це повторно використовує вкладки та стан входу,
які вже відкриті в цьому профілі браузера.

Офіційні довідкові матеріали та налаштування:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Вбудований профіль:

- `user`

Необов'язково: створіть власний профіль наявного сеансу, якщо вам потрібна
інша назва, колір або каталог даних браузера.

Типова поведінка:

- Вбудований профіль `user` використовує автоматичне підключення Chrome MCP, яке націлене на
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

1. Відкрийте сторінку перевірки цього браузера для віддаленого налагодження.
2. Увімкніть віддалене налагодження.
3. Залиште браузер запущеним і підтвердьте запит на підключення, коли OpenClaw приєднується.

Поширені сторінки перевірки:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Smoke-тест живого приєднання:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

Ознаки успіху:

- `status` показує `driver: existing-session`
- `status` показує `transport: chrome-mcp`
- `status` показує `running: true`
- `tabs` перелічує вже відкриті вкладки браузера
- `snapshot` повертає посилання з вибраної живої вкладки

Що перевірити, якщо приєднання не працює:

- цільовий браузер на основі Chromium має версію `144+`
- віддалене налагодження ввімкнено на сторінці перевірки цього браузера
- браузер показав запит згоди на приєднання, і ви його прийняли
- `openclaw doctor` мігрує стару конфігурацію браузера на основі Plugin і перевіряє, що
  Chrome установлено локально для типових профілів автоматичного підключення, але він не може
  ввімкнути для вас віддалене налагодження на боці браузера

Використання агентом:

- Використовуйте `profile="user"`, коли потрібен стан браузера користувача з виконаним входом.
- Якщо ви використовуєте власний профіль наявного сеансу, передайте цю явну назву профілю.
- Вибирайте цей режим лише тоді, коли користувач перебуває за комп'ютером, щоб підтвердити запит
  на приєднання.
- Gateway або хост Node може запускати `npx chrome-devtools-mcp@latest --autoConnect`

Примітки:

- Цей шлях має вищий ризик, ніж ізольований профіль `openclaw`, тому що він може
  діяти всередині вашого сеансу браузера з виконаним входом.
- OpenClaw не запускає браузер для цього драйвера; він лише приєднується.
- OpenClaw тут використовує офіційний потік Chrome DevTools MCP `--autoConnect`. Якщо
  `userDataDir` задано, його передають далі, щоб націлитися на цей каталог даних користувача.
- Наявний сеанс може приєднуватися на вибраному хості або через підключений
  браузерний Node. Якщо Chrome розміщений деінде, а браузерний Node не підключено, використовуйте
  віддалений CDP або хост Node.

### Власний запуск Chrome MCP

Перевизначте сервер Chrome DevTools MCP, який запускається, для кожного профілю, коли типовий
потік `npx chrome-devtools-mcp@latest` не відповідає вашим потребам (офлайн-хости,
закріплені версії, вендорні бінарні файли):

| Поле         | Що воно робить                                                                                                             |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Виконуваний файл для запуску замість `npx`. Розв'язується як є; абсолютні шляхи підтримуються.                            |
| `mcpArgs`    | Масив аргументів, що передається дослівно до `mcpCommand`. Замінює типові аргументи `chrome-devtools-mcp@latest --autoConnect`. |

Коли `cdpUrl` задано в профілі наявного сеансу, OpenClaw пропускає
`--autoConnect` і автоматично передає кінцеву точку до Chrome MCP:

- `http(s)://...` → `--browserUrl <url>` (кінцева точка HTTP-виявлення DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (прямий WebSocket CDP).

Прапорці кінцевої точки та `userDataDir` не можна поєднувати: коли `cdpUrl` задано,
`userDataDir` ігнорується для запуску Chrome MCP, оскільки Chrome MCP приєднується до
запущеного браузера за кінцевою точкою, а не відкриває каталог
профілю.

<Accordion title="Обмеження функції наявного сеансу">

Порівняно з керованим профілем `openclaw`, драйвери наявних сеансів мають більше обмежень:

- **Знімки екрана** - захоплення сторінки та захоплення елементів через `--ref` працюють; CSS-селектори `--element` не працюють. `--full-page` не можна поєднувати з `--ref` або `--element`. Playwright не потрібен для знімків сторінки або елементів на основі ref.
- **Дії** - `click`, `type`, `hover`, `scrollIntoView`, `drag` і `select` потребують refs зі знімка (без CSS-селекторів). `click-coords` натискає видимі координати viewport і не потребує ref зі знімка. `click` підтримує лише ліву кнопку. `type` не підтримує `slowly=true`; використовуйте `fill` або `press`. `press` не підтримує `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` і `evaluate` не підтримують тайм-аути для окремих викликів. `select` приймає одне значення.
- **Очікування / завантаження / діалог** - `wait --url` підтримує точні шаблони, підрядки та glob-шаблони; `wait --load networkidle` не підтримується. Хуки завантаження потребують `ref` або `inputRef`, по одному файлу за раз, без CSS `element`. Хуки діалогів не підтримують перевизначення тайм-ауту.
- **Функції лише для керованого режиму** - пакетні дії, експорт PDF, перехоплення завантажень і `responsebody` усе ще потребують керованого шляху браузера.

</Accordion>

## Гарантії ізоляції

- **Виділений каталог даних користувача**: ніколи не торкається вашого особистого профілю браузера.
- **Виділені порти**: уникає `9222`, щоб запобігти конфліктам із робочими процесами розробки.
- **Детерміноване керування вкладками**: `tabs` спочатку повертає `suggestedTargetId`, потім
  стабільні дескриптори `tabId`, такі як `t1`, необов'язкові мітки та сирий `targetId`.
  Агенти мають повторно використовувати `suggestedTargetId`; сирі ідентифікатори залишаються доступними для
  налагодження та сумісності.

## Вибір браузера

Під час локального запуску OpenClaw вибирає перший доступний:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Ви можете перевизначити це за допомогою `browser.executablePath`.

Платформи:

- macOS: перевіряє `/Applications` і `~/Applications`.
- Linux: перевіряє поширені розташування Chrome/Brave/Edge/Chromium у `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` і
  `/usr/lib/chromium-browser`.
- Windows: перевіряє поширені розташування встановлення.

## API керування (необов'язково)

Для сценаріїв і налагодження Gateway надає невеликий **HTTP API керування лише через loopback**
плюс відповідний CLI `openclaw browser` (знімки, refs, розширення очікування,
JSON-вивід, робочі процеси налагодження). Повну довідку див. у
[API керування браузером](/uk/tools/browser-control).

## Усунення неполадок

Для проблем, специфічних для Linux (особливо snap Chromium), див.
[Усунення неполадок браузера](/uk/tools/browser-linux-troubleshooting).

Для налаштувань із розділеними хостами WSL2 Gateway + Windows Chrome див.
[Усунення неполадок WSL2 + Windows + віддалений Chrome CDP](/uk/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Помилка запуску CDP проти блокування навігації SSRF

Це різні класи помилок, і вони вказують на різні шляхи коду.

- **Помилка запуску або готовності CDP** означає, що OpenClaw не може підтвердити справність площини керування браузером.
- **Блокування навігації SSRF** означає, що площина керування браузером справна, але ціль навігації сторінки відхилена політикою.

Поширені приклади:

- Помилка запуску або готовності CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` коли
    зовнішню службу CDP через loopback налаштовано без `attachOnly: true`
- Блокування навігації SSRF:
  - потоки `open`, `navigate`, snapshot або відкриття вкладок завершуються помилкою політики браузера/мережі, тоді як `start` і `tabs` усе ще працюють

Використовуйте цю мінімальну послідовність, щоб розділити ці два випадки:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Як читати результати:

- Якщо `start` завершується помилкою `not reachable after start`, спочатку усуньте проблему готовності CDP.
- Якщо `start` успішний, але `tabs` завершується помилкою, площина керування все ще несправна. Вважайте це проблемою досяжності CDP, а не проблемою навігації сторінкою.
- Якщо `start` і `tabs` успішні, але `open` або `navigate` завершується помилкою, площина керування браузером працює, а помилка в політиці навігації або цільовій сторінці.
- Якщо `start`, `tabs` і `open` усі успішні, базовий шлях керування керованим браузером справний.

Важливі деталі поведінки:

- Конфігурація браузера типово використовує об'єкт політики SSRF із закритою відмовою, навіть якщо ви не налаштовуєте `browser.ssrfPolicy`.
- Для локального керованого профілю `openclaw` через loopback перевірки справності CDP навмисно пропускають застосування досяжності SSRF браузера для власної локальної площини керування OpenClaw.
- Захист навігації окремий. Успішний результат `start` або `tabs` не означає, що пізніша ціль `open` або `navigate` дозволена.

Настанови з безпеки:

- **Не** послаблюйте політику SSRF браузера типово.
- Надавайте перевагу вузьким виняткам для хостів, таким як `hostnameAllowlist` або `allowedHostnames`, замість широкого доступу до приватної мережі.
- Використовуйте `dangerouslyAllowPrivateNetwork: true` лише в навмисно довірених середовищах, де доступ браузера до приватної мережі потрібен і перевірений.

## Інструменти агента + як працює керування

Агент отримує **один інструмент** для автоматизації браузера:

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Як це зіставляється:

- `browser snapshot` повертає стабільне дерево інтерфейсу (AI або ARIA).
- `browser act` використовує ідентифікатори `ref` зі знімка, щоб клацати/вводити/перетягувати/вибирати.
- `browser screenshot` захоплює пікселі (усю сторінку, елемент або позначені refs).
- `browser doctor` перевіряє готовність Gateway, plugin, профілю, браузера й вкладки.
- `browser` приймає:
  - `profile` для вибору іменованого профілю браузера (openclaw, chrome або віддаленого CDP).
  - `target` (`sandbox` | `host` | `node`) для вибору, де розташований браузер.
  - У sandbox-сеансах `target: "host"` потребує `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Якщо `target` пропущено: sandbox-сеанси за замовчуванням використовують `sandbox`, несandbox-сеанси за замовчуванням використовують `host`.
  - Якщо підключено вузол із підтримкою браузера, інструмент може автоматично маршрутизувати до нього, якщо ви не зафіксуєте `target="host"` або `target="node"`.

Це зберігає детермінованість агента й дає змогу уникати крихких селекторів.

## Пов’язане

- [Огляд інструментів](/uk/tools) - усі доступні інструменти агента
- [Sandboxing](/uk/gateway/sandboxing) - керування браузером у sandbox-середовищах
- [Безпека](/uk/gateway/security) - ризики керування браузером і посилення захисту
