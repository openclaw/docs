---
read_when:
    - Додавання автоматизації браузера, керованої агентом
    - Налагодження причин, через які openclaw втручається у ваш власний Chrome
    - Реалізація налаштувань браузера та життєвого циклу в застосунку macOS
summary: Інтегрований сервіс керування браузером + команди дій
title: Браузер (керований OpenClaw)
x-i18n:
    generated_at: "2026-04-25T17:34:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: c4a136bf08703bd108badcd01c02e961d76785f8d23d1c5035e5038963885796
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw може запускати **окремий профіль Chrome/Brave/Edge/Chromium**, яким керує агент.
Він ізольований від вашого особистого браузера та керується через невеликий локальний
сервіс керування всередині Gateway (лише loopback).

Пояснення для початківців:

- Думайте про це як про **окремий браузер лише для агента**.
- Профіль `openclaw` **не** торкається вашого особистого профілю браузера.
- Агент може **відкривати вкладки, читати сторінки, натискати та вводити текст** у безпечній смузі.
- Вбудований профіль `user` приєднується до вашої справжньої авторизованої сесії Chrome через Chrome MCP.

## Що ви отримуєте

- Окремий профіль браузера з назвою **openclaw** (за замовчуванням з помаранчевим акцентом).
- Детерміноване керування вкладками (перелік/відкриття/фокусування/закриття).
- Дії агента (натискання/введення/перетягування/вибір), знімки стану, скриншоти, PDF.
- Вбудований Skill `browser-automation`, який навчає агентів циклу відновлення snapshot,
  stable-tab, stale-ref і manual-blocker, коли ввімкнено browser Plugin.
- Необов’язкову підтримку кількох профілів (`openclaw`, `work`, `remote`, ...).

Цей браузер **не** є вашим щоденним браузером. Це безпечна, ізольована поверхня для
автоматизації та перевірки агентом.

## Швидкий старт

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Якщо ви бачите “Browser disabled”, увімкніть його в конфігурації (див. нижче) і перезапустіть
Gateway.

Якщо `openclaw browser` взагалі відсутня або агент каже, що browser tool
недоступний, перейдіть до [Відсутня команда або інструмент браузера](/uk/tools/browser#missing-browser-command-or-tool).

## Керування Plugin

Стандартний інструмент `browser` — це вбудований Plugin. Вимкніть його, щоб замінити іншим Plugin, який реєструє ту саму назву інструмента `browser`:

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

Для стандартної поведінки потрібні і `plugins.entries.browser.enabled`, і `browser.enabled=true`. Вимкнення лише Plugin прибирає CLI `openclaw browser`, Gateway-метод `browser.request`, інструмент агента і сервіс керування як єдине ціле; ваша конфігурація `browser.*` залишається недоторканою для заміни.

Зміни конфігурації браузера потребують перезапуску Gateway, щоб Plugin міг повторно зареєструвати свій сервіс.

## Вказівки для агента

Примітка щодо профілю інструментів: `tools.profile: "coding"` включає `web_search` і
`web_fetch`, але не включає повний інструмент `browser`. Якщо агент або
породжений sub-agent має використовувати автоматизацію браузера, додайте browser
на етапі профілю:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Для одного агента використовуйте `agents.list[].tools.alsoAllow: ["browser"]`.
Одного лише `tools.subagents.tools.allow: ["browser"]` недостатньо, тому що policy sub-agent-а
застосовується після фільтрації профілю.

Browser Plugin постачається з двома рівнями вказівок для агента:

- Опис інструмента `browser` містить компактний завжди активний контракт: вибирайте
  правильний профіль, зберігайте refs в межах тієї самої вкладки, використовуйте `tabId`/мітки для
  націлювання на вкладки та завантажуйте browser Skill для багатокрокової роботи.
- Вбудований Skill `browser-automation` містить довший робочий цикл:
  спочатку перевіряйте status/tabs, позначайте вкладки завдання, робіть snapshot перед діями,
  повторно робіть snapshot після змін UI, один раз відновлюйте stale refs і повідомляйте про
  блокування входом/2FA/captcha або камерою/мікрофоном як про ручну дію, а не вгадуйте.

Skills, що постачаються разом із Plugin, перелічуються в доступних Skills агента, коли
Plugin увімкнено. Повні інструкції Skill завантажуються за потреби, тому звичайні
ходи не платять повну вартість у токенах.

## Відсутня команда або інструмент браузера

Якщо `openclaw browser` невідома після оновлення, `browser.request` відсутній або агент повідомляє, що інструмент браузера недоступний, звичайною причиною є список `plugins.allow`, у якому немає `browser`. Додайте його:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true` і `tools.alsoAllow: ["browser"]` не замінюють членство в allowlist — allowlist керує завантаженням Plugin, а policy інструмента застосовується лише після завантаження. Повне видалення `plugins.allow` також повертає стандартну поведінку.

## Профілі: `openclaw` проти `user`

- `openclaw`: керований, ізольований браузер (розширення не потрібне).
- `user`: вбудований профіль приєднання Chrome MCP до вашої **справжньої авторизованої сесії Chrome**.

Для викликів browser tool агентом:

- За замовчуванням: використовуйте ізольований браузер `openclaw`.
- Надавайте перевагу `profile="user"`, коли важливі наявні авторизовані сесії і користувач
  перебуває за комп’ютером, щоб натиснути/підтвердити будь-який запит на приєднання.
- `profile` — це явне перевизначення, коли вам потрібен конкретний режим браузера.

Установіть `browser.defaultProfile: "openclaw"`, якщо хочете, щоб керований режим був типовим.

## Конфігурація

Налаштування браузера знаходяться в `~/.openclaw/openclaw.json`.

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

- Сервіс керування прив’язується до loopback на порту, похідному від `gateway.port` (типово `18791` = gateway + 2). Перевизначення `gateway.port` або `OPENCLAW_GATEWAY_PORT` зсуває похідні порти в тій самій групі.
- Локальні профілі `openclaw` автоматично призначають `cdpPort`/`cdpUrl`; задавайте їх лише для віддаленого CDP. Якщо `cdpUrl` не задано, типово використовується керований локальний порт CDP.
- `remoteCdpTimeoutMs` застосовується до перевірок доступності HTTP для віддалених (не-loopback) кінцевих точок CDP; `remoteCdpHandshakeTimeoutMs` застосовується до WebSocket-handshake віддаленого CDP.
- `localLaunchTimeoutMs` — це бюджет часу для того, щоб локально запущений керований процес Chrome
  відкрив свою кінцеву точку CDP HTTP. `localCdpReadyTimeoutMs` — це
  наступний бюджет для готовності websocket CDP після виявлення процесу.
  Збільшуйте ці значення на Raspberry Pi, недорогих VPS або старішому обладнанні, де Chromium
  запускається повільно. Значення обмежено 120000 мс.
- `actionTimeoutMs` — це стандартний бюджет часу для запитів browser `act`, коли викликач не передає `timeoutMs`. Транспорт клієнта додає невелике додаткове вікно, щоб довгі очікування могли завершитися, а не завершувалися через timeout на межі HTTP.
- `tabCleanup` — це best-effort очищення вкладок, відкритих primary-agent browser sessions. Очищення життєвого циклу subagent, Cron і ACP усе одно закриває їхні явно відстежувані вкладки в кінці сесії; primary sessions зберігають активні вкладки придатними для повторного використання, а потім у фоновому режимі закривають неактивні або зайві відстежувані вкладки.

</Accordion>

<Accordion title="Політика SSRF">

- Навігація браузера і open-tab захищені від SSRF перед переходом і повторно перевіряються в режимі best-effort на фінальному URL `http(s)` після цього.
- У строгому режимі SSRF також перевіряються виявлення віддалених кінцевих точок CDP і запити `/json/version` (`cdpUrl`).
- Змінні середовища Gateway/provider-а `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` і `NO_PROXY` не проксіюють автоматично браузер, керований OpenClaw. Керований Chrome за замовчуванням запускається напряму, щоб налаштування proxy provider-а не послаблювали перевірки SSRF браузера.
- Щоб проксіювати сам керований браузер, передайте явні прапорці proxy Chrome через `browser.extraArgs`, такі як `--proxy-server=...` або `--proxy-pac-url=...`. Строгий режим SSRF блокує явну маршрутизацію browser proxy, якщо доступ браузера до private-network не ввімкнено навмисно.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` за замовчуванням вимкнено; вмикайте лише тоді, коли доступ браузера до private-network навмисно вважається довіреним.
- `browser.ssrfPolicy.allowPrivateNetwork` залишається підтримуваним як застарілий псевдонім.

</Accordion>

<Accordion title="Поведінка профілів">

- `attachOnly: true` означає ніколи не запускати локальний браузер; лише приєднуватися, якщо він уже працює.
- `headless` можна задати глобально або для окремого локального керованого профілю. Значення для профілю перевизначають `browser.headless`, тому один локально запущений профіль може залишатися headless, а інший — видимим.
- `POST /start?headless=true` і `openclaw browser start --headless` запитують
  одноразовий headless-запуск для локальних керованих профілів без перезапису
  `browser.headless` або конфігурації профілю. Профілі existing-session, attach-only і
  remote CDP відхиляють це перевизначення, тому що OpenClaw не запускає ці
  процеси браузера.
- На Linux-хостах без `DISPLAY` або `WAYLAND_DISPLAY` локальні керовані профілі
  за замовчуванням автоматично переходять у режим headless, коли ні середовище, ні конфігурація профілю/глобальна
  явно не вибирають режим з вікном. `openclaw browser status --json`
  повідомляє `headlessSource` як `env`, `profile`, `config`,
  `request`, `linux-display-fallback` або `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` примусово вмикає headless для локальних керованих запусків у
  поточному процесі. `OPENCLAW_BROWSER_HEADLESS=0` примусово вмикає режим з вікном для звичайних
  запусків і повертає зрозумілу помилку на Linux-хостах без display server;
  явний запит `start --headless` усе одно має пріоритет для цього одного запуску.
- `executablePath` можна задати глобально або для окремого локального керованого профілю. Значення для профілю перевизначають `browser.executablePath`, тому різні керовані профілі можуть запускати різні браузери на базі Chromium.
- `color` (верхній рівень і для кожного профілю) тонує UI браузера, щоб ви могли бачити, який профіль активний.
- Профіль за замовчуванням — `openclaw` (керований автономний). Використовуйте `defaultProfile: "user"`, щоб увімкнути браузер авторизованого користувача.
- Порядок автовиявлення: системний браузер за замовчуванням, якщо він на базі Chromium; інакше Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` використовує Chrome DevTools MCP замість сирого CDP. Не задавайте `cdpUrl` для цього driver.
- Установіть `browser.profiles.<name>.userDataDir`, коли профіль existing-session має приєднуватися до не стандартного профілю користувача Chromium (Brave, Edge тощо).

</Accordion>

</AccordionGroup>

## Використовуйте Brave (або інший браузер на базі Chromium)

Якщо вашим **системним браузером за замовчуванням** є браузер на базі Chromium (Chrome/Brave/Edge тощо),
OpenClaw використовує його автоматично. Установіть `browser.executablePath`, щоб перевизначити
автовиявлення. `~` розгортається до домашнього каталогу вашої ОС:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

Або задайте це в конфігурації, для кожної платформи:

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

`executablePath` для окремого профілю впливає лише на локальні керовані профілі, які запускає OpenClaw.
Профілі `existing-session` натомість приєднуються до вже запущеного браузера,
а віддалені профілі CDP використовують браузер, що стоїть за `cdpUrl`.

## Локальне та віддалене керування

- **Локальне керування (типово):** Gateway запускає сервіс керування на loopback і може запускати локальний браузер.
- **Віддалене керування (node host):** запустіть node host на машині, де є браузер; Gateway проксуватиме до нього дії браузера.
- **Віддалений CDP:** установіть `browser.profiles.<name>.cdpUrl` (або `browser.cdpUrl`), щоб
  приєднатися до віддаленого браузера на базі Chromium. У такому разі OpenClaw не запускатиме локальний браузер.
- Для зовнішньо керованих сервісів CDP на loopback (наприклад Browserless у
  Docker, опублікований на `127.0.0.1`) також установіть `attachOnly: true`. CDP на loopback
  без `attachOnly` вважається локальним профілем браузера, керованим OpenClaw.
- `headless` впливає лише на локальні керовані профілі, які запускає OpenClaw. Він не перезапускає і не змінює браузери `existing-session` або віддалені CDP.
- `executablePath` підпорядковується тому самому правилу локального керованого профілю. Його зміна для
  запущеного локального керованого профілю позначає цей профіль для restart/reconcile, щоб
  наступний запуск використовував новий binary.

Поведінка зупинки відрізняється залежно від режиму профілю:

- локальні керовані профілі: `openclaw browser stop` зупиняє процес браузера, який
  запустив OpenClaw
- профілі attach-only і віддалені профілі CDP: `openclaw browser stop` закриває активну
  сесію керування й скидає overrides емуляції Playwright/CDP (viewport,
  колірну схему, locale, часовий пояс, offline mode та подібний стан), навіть
  якщо OpenClaw не запускав жодного процесу браузера

URL віддаленого CDP можуть містити auth:

- Query-токени (наприклад, `https://provider.example?token=<token>`)
- HTTP Basic auth (наприклад, `https://user:pass@provider.example`)

OpenClaw зберігає auth під час виклику кінцевих точок `/json/*` і під час підключення
до WebSocket CDP. Для токенів віддавайте перевагу змінним середовища або менеджерам секретів, а не комітам їх у файли конфігурації.

## Node browser proxy (нульова конфігурація за замовчуванням)

Якщо ви запускаєте **node host** на машині, де є ваш браузер, OpenClaw може
автоматично маршрутизувати виклики browser tool до цього node без жодної додаткової конфігурації браузера.
Це типовий шлях для віддалених Gateway.

Примітки:

- Node host експонує свій локальний сервер керування браузером через **proxy command**.
- Профілі беруться з власної конфігурації `browser.profiles` node (так само, як локально).
- `nodeHost.browserProxy.allowProfiles` необов’язковий. Залиште його порожнім для застарілої/типової поведінки: усі налаштовані профілі залишаються доступними через proxy, включно з маршрутами створення/видалення профілів.
- Якщо ви встановите `nodeHost.browserProxy.allowProfiles`, OpenClaw трактуватиме це як межу найменших привілеїв: можна буде націлюватися лише на профілі з allowlist, а маршрути створення/видалення постійних профілів будуть заблоковані на поверхні proxy.
- Вимкніть, якщо він вам не потрібен:
  - На node: `nodeHost.browserProxy.enabled=false`
  - На gateway: `gateway.nodes.browser.mode="off"`

## Browserless (розміщений віддалений CDP)

[Browserless](https://browserless.io) — це розміщений сервіс Chromium, який експонує
URL підключення CDP через HTTPS і WebSocket. OpenClaw може використовувати обидві форми, але
для профілю віддаленого браузера найпростішим варіантом є прямий URL WebSocket
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
- Виберіть регіональну кінцеву точку, яка відповідає вашому обліковому запису Browserless (див. їхню документацію).
- Якщо Browserless надає вам базовий URL HTTPS, ви можете або перетворити його на
  `wss://` для прямого підключення CDP, або залишити URL HTTPS і дозволити OpenClaw
  виявити `/json/version`.

### Browserless Docker на тому самому хості

Коли Browserless self-hosted у Docker, а OpenClaw працює на хості, розглядайте
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
OpenClaw. Browserless також має оголошувати відповідну досяжну кінцеву точку;
установіть Browserless `EXTERNAL` на ту саму базу WebSocket, публічну для OpenClaw, наприклад
`ws://127.0.0.1:3000`, `ws://browserless:3000` або стабільну приватну адресу
мережі Docker. Якщо `/json/version` повертає `webSocketDebuggerUrl`, що вказує на
адресу, недосяжну для OpenClaw, HTTP CDP може виглядати справним, тоді як
приєднання по WebSocket усе одно завершуватиметься помилкою.

Не залишайте `attachOnly` не встановленим для профілю Browserless на loopback. Без
`attachOnly` OpenClaw трактує порт loopback як локальний профіль браузера,
керований OpenClaw, і може повідомляти, що порт використовується, але не належить OpenClaw.

## Прямі provider-и WebSocket CDP

Деякі розміщені browser-сервіси експонують **пряму кінцеву точку WebSocket**, а не
стандартне виявлення CDP на основі HTTP (`/json/version`). OpenClaw приймає три
форми URL CDP і автоматично вибирає правильну стратегію підключення:

- **HTTP(S) discovery** — `http://host[:port]` або `https://host[:port]`.
  OpenClaw викликає `/json/version`, щоб виявити URL налагоджувача WebSocket, а потім
  підключається. Без fallback на WebSocket.
- **Прямі кінцеві точки WebSocket** — `ws://host[:port]/devtools/<kind>/<id>` або
  `wss://...` зі шляхом `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw підключається безпосередньо через handshake WebSocket і повністю пропускає
  `/json/version`.
- **Корені WebSocket без шляху** — `ws://host[:port]` або `wss://host[:port]` без
  шляху `/devtools/...` (наприклад, [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw спочатку пробує HTTP
  discovery `/json/version` (нормалізуючи схему до `http`/`https`);
  якщо discovery повертає `webSocketDebuggerUrl`, він використовується, інакше OpenClaw
  переходить до прямого handshake WebSocket на корені без шляху. Якщо оголошена
  кінцева точка WebSocket відхиляє handshake CDP, але налаштований корінь без шляху
  його приймає, OpenClaw також переходить на цей корінь. Це дозволяє простому `ws://`,
  вказаному на локальний Chrome, усе ж підключатися, оскільки Chrome приймає оновлення
  WebSocket лише на конкретному шляху для цілі з `/json/version`, тоді як розміщені
  provider-и можуть використовувати свій кореневий WebSocket endpoint, коли їхній endpoint
  discovery оголошує короткоживучий URL, який не підходить для Playwright CDP.

### Browserbase

[Browserbase](https://www.browserbase.com) — це хмарна платформа для запуску
браузерів у режимі headless із вбудованим розв’язанням CAPTCHA, stealth mode і residential
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

- [Зареєструйтеся](https://www.browserbase.com/sign-up) і скопіюйте свій **API Key**
  з [панелі Overview](https://www.browserbase.com/overview).
- Замініть `<BROWSERBASE_API_KEY>` на ваш справжній API-ключ Browserbase.
- Browserbase автоматично створює сесію браузера під час підключення WebSocket, тому
  крок ручного створення сесії не потрібен.
- Безкоштовний тариф дозволяє одну одночасну сесію і одну browser-годину на місяць.
  Обмеження платних тарифів дивіться в [pricing](https://www.browserbase.com/pricing).
- Повний
  довідник API, посібники з SDK та приклади інтеграції дивіться в [документації Browserbase](https://docs.browserbase.com).

## Безпека

Ключові ідеї:

- Керування браузером доступне лише через loopback; доступ проходить через auth Gateway або pairing node.
- Автономний HTTP API браузера на loopback використовує **лише auth зі спільним секретом**:
  bearer auth через токен gateway, `x-openclaw-password` або HTTP Basic auth із
  налаштованим паролем gateway.
- Заголовки ідентифікації Tailscale Serve і `gateway.auth.mode: "trusted-proxy"`
  **не** автентифікують цей автономний loopback browser API.
- Якщо керування браузером увімкнено і жоден auth зі спільним секретом не налаштовано, OpenClaw
  автоматично генерує `gateway.auth.token` під час запуску і зберігає його в конфігурації.
- OpenClaw **не** генерує цей токен автоматично, коли `gateway.auth.mode` вже має значення
  `password`, `none` або `trusted-proxy`.
- Тримайте Gateway і будь-які node host на приватній мережі (Tailscale); уникайте публічного доступу.
- Ставтеся до URL/токенів віддаленого CDP як до секретів; віддавайте перевагу змінним env або менеджеру секретів.

Поради щодо віддаленого CDP:

- За можливості віддавайте перевагу зашифрованим кінцевим точкам (HTTPS або WSS) і короткоживучим токенам.
- Уникайте вбудовування довгоживучих токенів безпосередньо у файли конфігурації.

## Профілі (кілька браузерів)

OpenClaw підтримує кілька іменованих профілів (конфігурацій маршрутизації). Профілі можуть бути:

- **керовані OpenClaw**: окремий браузер на базі Chromium із власним каталогом даних користувача + портом CDP
- **віддалені**: явний URL CDP (браузер на базі Chromium, що працює деінде)
- **наявна сесія**: ваш наявний профіль Chrome через автопідключення Chrome DevTools MCP

Типові значення:

- Профіль `openclaw` автоматично створюється, якщо його немає.
- Профіль `user` вбудований для приєднання existing-session через Chrome MCP.
- Профілі existing-session, крім `user`, вмикаються явно; створюйте їх із `--driver existing-session`.
- Локальні порти CDP за замовчуванням виділяються з діапазону **18800–18899**.
- Видалення профілю переміщує його локальний каталог даних у Trash.

Усі кінцеві точки керування приймають `?profile=<name>`; CLI використовує `--browser-profile`.

## Наявна сесія через Chrome DevTools MCP

OpenClaw також може приєднуватися до запущеного профілю браузера на базі Chromium через
офіційний сервер Chrome DevTools MCP. Це повторно використовує вкладки і стан входу,
уже відкриті в цьому профілі браузера.

Офіційні довідкові матеріали та посилання на налаштування:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Вбудований профіль:

- `user`

Необов’язково: створіть власний custom-профіль existing-session, якщо вам потрібні
інша назва, колір або каталог даних браузера.

Типова поведінка:

- Вбудований профіль `user` використовує автопідключення Chrome MCP, яке націлюється на
  типовий локальний профіль Google Chrome.

Використовуйте `userDataDir` для Brave, Edge, Chromium або не стандартного профілю Chrome:

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

1. Відкрийте inspect-сторінку цього браузера для віддаленого налагодження.
2. Увімкніть віддалене налагодження.
3. Залиште браузер запущеним і підтвердьте запит на підключення, коли OpenClaw приєднається.

Поширені inspect-сторінки:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Smoke-тест live attach:

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
- `tabs` перелічує вже відкриті вкладки вашого браузера
- `snapshot` повертає refs із вибраної live-вкладки

Що перевірити, якщо приєднання не працює:

- цільовий браузер на базі Chromium має версію `144+`
- у inspect-сторінці цього браузера ввімкнено remote debugging
- браузер показав запит на приєднання, і ви його підтвердили
- `openclaw doctor` мігрує стару конфігурацію браузера на основі extension і перевіряє, що
  Chrome локально встановлено для типових профілів auto-connect, але не може
  увімкнути remote debugging у самому браузері за вас

Використання агентом:

- Використовуйте `profile="user"`, коли вам потрібен стан авторизованого браузера користувача.
- Якщо ви використовуєте custom-профіль existing-session, передайте явну назву цього профілю.
- Вибирайте цей режим лише тоді, коли користувач перебуває за комп’ютером, щоб підтвердити
  запит на приєднання.
- Gateway або node host може запускати `npx chrome-devtools-mcp@latest --autoConnect`

Примітки:

- Цей шлях ризикованіший, ніж ізольований профіль `openclaw`, тому що він може
  виконувати дії у вашій авторизованій сесії браузера.
- OpenClaw не запускає браузер для цього driver; він лише приєднується.
- Тут OpenClaw використовує офіційний потік Chrome DevTools MCP `--autoConnect`. Якщо
  встановлено `userDataDir`, його буде передано далі для націлювання на цей каталог даних користувача.
- Existing-session може приєднуватися на вибраному хості або через підключений
  browser node. Якщо Chrome знаходиться в іншому місці й жоден browser node не підключено, використовуйте
  натомість remote CDP або node host.

### Custom-запуск Chrome MCP

Перевизначте сервер Chrome DevTools MCP, що запускається для окремого профілю, коли типовий
потік `npx chrome-devtools-mcp@latest` вам не підходить (офлайн-хости,
закріплені версії, vendored binary):

| Поле        | Що воно робить                                                                                                               |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Виконуваний файл, який запускається замість `npx`. Розв’язується як є; абсолютні шляхи підтримуються.                        |
| `mcpArgs`    | Масив аргументів, який дослівно передається до `mcpCommand`. Замінює типові аргументи `chrome-devtools-mcp@latest --autoConnect`. |

Коли для профілю existing-session встановлено `cdpUrl`, OpenClaw пропускає
`--autoConnect` і автоматично передає endpoint до Chrome MCP:

- `http(s)://...` → `--browserUrl <url>` (endpoint HTTP discovery DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (прямий WebSocket CDP).

Прапорці endpoint і `userDataDir` не можна поєднувати: коли встановлено `cdpUrl`,
`userDataDir` ігнорується для запуску Chrome MCP, оскільки Chrome MCP приєднується до
запущеного браузера за endpoint, а не відкриває каталог профілю.

<Accordion title="Обмеження можливостей existing-session">

Порівняно з керованим профілем `openclaw`, driver-и existing-session мають більше обмежень:

- **Скриншоти** — працюють захоплення сторінки і захоплення елемента через `--ref`; селектори CSS `--element` не підтримуються. `--full-page` не можна поєднувати з `--ref` або `--element`. Для скриншотів сторінки чи елементів на основі ref Playwright не потрібен.
- **Дії** — `click`, `type`, `hover`, `scrollIntoView`, `drag` і `select` потребують refs зі snapshot (без CSS-селекторів). `click-coords` натискає по видимих координатах viewport і не потребує ref зі snapshot. `click` підтримує лише ліву кнопку миші. `type` не підтримує `slowly=true`; використовуйте `fill` або `press`. `press` не підтримує `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` і `evaluate` не підтримують timeout для окремого виклику. `select` приймає одне значення.
- **Wait / upload / dialog** — `wait --url` підтримує точний збіг, підрядок і glob-шаблони; `wait --load networkidle` не підтримується. Hooks завантаження потребують `ref` або `inputRef`, по одному файлу за раз, без CSS `element`. Hooks dialog не підтримують перевизначення timeout.
- **Можливості лише для керованого режиму** — пакетні дії, експорт PDF, перехоплення завантажень і `responsebody` усе ще потребують шляху керованого браузера.

</Accordion>

## Гарантії ізоляції

- **Окремий каталог даних користувача**: ніколи не торкається вашого особистого профілю браузера.
- **Окремі порти**: уникає `9222`, щоб не конфліктувати з робочими dev-процесами.
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
- Linux: перевіряє поширені розташування Chrome/Brave/Edge/Chromium у `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` і
  `/usr/lib/chromium-browser`.
- Windows: перевіряє поширені місця встановлення.

## API керування (необов’язково)

Для скриптів і налагодження Gateway надає невеликий **HTTP API керування лише для loopback**
разом із відповідним CLI `openclaw browser` (snapshot, refs, розширення wait,
JSON-вивід, сценарії налагодження). Повний довідник дивіться в
[API керування браузером](/uk/tools/browser-control).

## Усунення несправностей

Для проблем, специфічних для Linux (особливо snap Chromium), дивіться
[Усунення несправностей браузера](/uk/tools/browser-linux-troubleshooting).

Для конфігурацій із розділеними хостами WSL2 Gateway + Windows Chrome дивіться
[Усунення несправностей WSL2 + Windows + remote Chrome CDP](/uk/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Помилка запуску CDP vs SSRF-блокування навігації

Це різні класи збоїв, і вони вказують на різні шляхи коду.

- **Помилка запуску або готовності CDP** означає, що OpenClaw не може підтвердити, що площина керування браузером справна.
- **SSRF-блокування навігації** означає, що площина керування браузером справна, але ціль навігації сторінки відхиляється політикою.

Поширені приклади:

- Помилка запуску або готовності CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw`, коли
    зовнішній loopback-сервіс CDP налаштовано без `attachOnly: true`
- SSRF-блокування навігації:
  - потоки `open`, `navigate`, snapshot або відкриття вкладок завершуються помилкою через політику browser/network, тоді як `start` і `tabs` усе ще працюють

Використовуйте цю мінімальну послідовність, щоб відрізнити одне від іншого:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Як читати результати:

- Якщо `start` завершується помилкою `not reachable after start`, спершу усувайте проблему готовності CDP.
- Якщо `start` успішний, але `tabs` завершується помилкою, площина керування все ще несправна. Розглядайте це як проблему доступності CDP, а не проблему навігації сторінки.
- Якщо `start` і `tabs` успішні, але `open` або `navigate` завершуються помилкою, площина керування браузером працює, а помилка в політиці навігації або цільовій сторінці.
- Якщо `start`, `tabs` і `open` усі успішні, базовий шлях керування керованим браузером справний.

Важливі деталі поведінки:

- Конфігурація браузера типово використовує об’єкт політики SSRF із fail-closed, навіть якщо ви не налаштовуєте `browser.ssrfPolicy`.
- Для локального керованого профілю loopback `openclaw` перевірки справності CDP навмисно пропускають примусове застосування browser SSRF reachability для власної локальної площини керування OpenClaw.
- Захист навігації є окремим. Успішний результат `start` або `tabs` не означає, що пізніша ціль `open` або `navigate` дозволена.

Вказівки з безпеки:

- **Не** послаблюйте політику browser SSRF за замовчуванням.
- Надавайте перевагу вузьким виняткам для хостів, таким як `hostnameAllowlist` або `allowedHostnames`, а не широкому доступу до private-network.
- Використовуйте `dangerouslyAllowPrivateNetwork: true` лише в навмисно довірених середовищах, де доступ браузера до private-network потрібен і перевірений.

## Інструменти агента + як працює керування

Агент отримує **один інструмент** для автоматизації браузера:

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Як це зіставляється:

- `browser snapshot` повертає стабільне дерево UI (AI або ARIA).
- `browser act` використовує `ref` ID зі snapshot для click/type/drag/select.
- `browser screenshot` захоплює пікселі (вся сторінка, елемент або refs із мітками).
- `browser doctor` перевіряє готовність Gateway, Plugin, профілю, браузера і вкладки.
- `browser` приймає:
  - `profile`, щоб вибрати іменований профіль браузера (openclaw, chrome або remote CDP).
  - `target` (`sandbox` | `host` | `node`), щоб вибрати, де розташовано браузер.
  - У sandboxed sessions `target: "host"` потребує `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Якщо `target` не вказано: sandboxed sessions типово використовують `sandbox`, а не-sandbox sessions — `host`.
  - Якщо підключено node із підтримкою браузера, інструмент може автоматично маршрутизуватися до нього, якщо ви не зафіксували `target="host"` або `target="node"`.

Це зберігає детермінованість агента та дозволяє уникати крихких селекторів.

## Пов’язане

- [Огляд інструментів](/uk/tools) — усі доступні інструменти агента
- [Пісочниця](/uk/gateway/sandboxing) — керування браузером у sandboxed environments
- [Безпека](/uk/gateway/security) — ризики керування браузером і зміцнення захисту
