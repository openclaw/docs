---
read_when:
    - Додавання автоматизації браузера під керуванням агента
    - З’ясування, чому openclaw втручається у ваш власний Chrome
    - Реалізація налаштувань і життєвого циклу браузера в застосунку macOS
summary: Інтегрований сервіс керування браузером + команди дій
title: Browser (керований OpenClaw)
x-i18n:
    generated_at: "2026-04-25T11:57:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f41583eea3554292822aec8858f9b2deb6d5bfd1f313039ee25f37bfb81bf8a
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw може запускати **виділений профіль Chrome/Brave/Edge/Chromium**, яким керує агент.
Він ізольований від вашого особистого браузера та керується через невеликий локальний
сервіс керування всередині Gateway (лише loopback).

Пояснення для початківців:

- Думайте про нього як про **окремий браузер лише для агента**.
- Профіль `openclaw` **не** торкається профілю вашого особистого браузера.
- Агент може **відкривати вкладки, читати сторінки, натискати й вводити текст** у безпечному режимі.
- Вбудований профіль `user` під’єднується до вашого справжнього сеансу Chrome з виконаним входом через Chrome MCP.

## Що ви отримуєте

- Окремий профіль браузера з назвою **openclaw** (помаранчевий акцент за замовчуванням).
- Детерміноване керування вкладками (перелік/відкриття/фокусування/закриття).
- Дії агента (натискання/введення/перетягування/вибір), знімки стану, знімки екрана, PDF.
- Вбудований skill `browser-automation`, який навчає агентів циклу відновлення snapshot,
  stable-tab, stale-ref і manual-blocker, коли увімкнено browser Plugin.
- Необов’язкова підтримка кількох профілів (`openclaw`, `work`, `remote`, ...).

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

Якщо `openclaw browser` взагалі відсутній або агент каже, що browser tool
недоступний, перейдіть до [Відсутня команда або tool браузера](/uk/tools/browser#missing-browser-command-or-tool).

## Керування Plugin

Типовий tool `browser` — це вбудований Plugin. Вимкніть його, щоб замінити іншим Plugin, який реєструє ту саму назву tool `browser`:

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

Типові налаштування потребують і `plugins.entries.browser.enabled`, і `browser.enabled=true`. Якщо вимкнути лише Plugin, це як єдиний блок прибирає CLI `openclaw browser`, метод Gateway `browser.request`, tool агента та сервіс керування; ваша конфігурація `browser.*` залишається недоторканою для заміни.

Зміни конфігурації браузера потребують перезапуску Gateway, щоб Plugin міг повторно зареєструвати свій сервіс.

## Вказівки для агента

Browser Plugin постачається з двома рівнями вказівок для агента:

- Опис tool `browser` містить компактний завжди активний контракт: обрати
  правильний профіль, тримати refs у межах тієї самої вкладки, використовувати `tabId`/мітки для
  націлювання на вкладки та завантажувати browser skill для багатоетапної роботи.
- Вбудований skill `browser-automation` містить довший робочий цикл:
  спочатку перевірити статус/вкладки, позначити мітками вкладки завдання, зробити snapshot перед дією,
  повторно зробити snapshot після змін UI, один раз відновити stale refs і повідомити про блокування через login/2FA/captcha або
  camera/microphone як про ручну дію, а не вгадувати.

Skills, вбудовані в Plugin, перелічуються в доступних Skills агента, коли
Plugin увімкнено. Повні інструкції skill завантажуються на вимогу, тому звичайні
ходи не сплачують повну вартість у токенах.

## Відсутня команда або tool браузера

Якщо `openclaw browser` невідомий після оновлення, `browser.request` відсутній або агент повідомляє, що browser tool недоступний, типовою причиною є список `plugins.allow`, у якому відсутній `browser`. Додайте його:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true` і `tools.alsoAllow: ["browser"]` не замінюють членство в allowlist — allowlist керує завантаженням Plugin, а політика tool починає діяти лише після завантаження. Повне видалення `plugins.allow` також відновлює типову поведінку.

## Профілі: `openclaw` і `user`

- `openclaw`: керований, ізольований браузер (розширення не потрібне).
- `user`: вбудований профіль під’єднання Chrome MCP до вашого **справжнього Chrome**
  із виконаним входом.

Для викликів tool браузера агентом:

- За замовчуванням: використовувати ізольований браузер `openclaw`.
- Віддавайте перевагу `profile="user"`, коли важливі наявні сеанси з виконаним входом і користувач
  перебуває за комп’ютером, щоб натиснути/підтвердити будь-який запит на під’єднання.
- `profile` — це явне перевизначення, коли ви хочете конкретний режим браузера.

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

- Сервіс керування прив’язується до loopback на порту, похідному від `gateway.port` (типово `18791` = gateway + 2). Перевизначення `gateway.port` або `OPENCLAW_GATEWAY_PORT` зсуває похідні порти в тій самій групі.
- Локальні профілі `openclaw` автоматично призначають `cdpPort`/`cdpUrl`; задавайте їх лише для віддаленого CDP. Якщо `cdpUrl` не вказано, типово використовується керований локальний порт CDP.
- `remoteCdpTimeoutMs` застосовується до перевірок доступності HTTP віддаленого (не-loopback) CDP; `remoteCdpHandshakeTimeoutMs` застосовується до WebSocket-handshake віддаленого CDP.
- `localLaunchTimeoutMs` — це бюджет часу, за який локально запущений керований процес Chrome
  має відкрити свій endpoint CDP HTTP. `localCdpReadyTimeoutMs` — це
  подальший бюджет часу на готовність websocket CDP після виявлення процесу.
  Збільшуйте ці значення на Raspberry Pi, дешевих VPS або старішому обладнанні, де Chromium
  запускається повільно. Значення обмежені 120000 мс.
- `actionTimeoutMs` — це типовий бюджет часу для запитів browser `act`, коли виклик не передає `timeoutMs`. Клієнтський транспорт додає невелике додаткове вікно, щоб довгі очікування могли завершитися, а не обривалися на межі HTTP.
- `tabCleanup` — це best-effort очищення вкладок, відкритих основними сеансами браузера агента. Підлеглий агент, Cron і очищення життєвого циклу ACP як і раніше закривають свої явно відстежувані вкладки в кінці сеансу; основні сеанси зберігають активні вкладки придатними до повторного використання, а потім у фоновому режимі закривають неактивні або зайві відстежувані вкладки.

</Accordion>

<Accordion title="Політика SSRF">

- Навігація браузера та open-tab захищені від SSRF перед навігацією, а потім URL `http(s)` у фінальному стані повторно перевіряється в режимі best-effort.
- У строгому режимі SSRF також перевіряються виявлення віддаленого endpoint CDP і запити `/json/version` (`cdpUrl`).
- Змінні середовища Gateway/provider `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` і `NO_PROXY` не проксіюють автоматично браузер, яким керує OpenClaw. Керований Chrome за замовчуванням запускається напряму, щоб налаштування проксі provider не послаблювали перевірки SSRF браузера.
- Щоб проксіювати сам керований браузер, передайте явні proxy-прапорці Chrome через `browser.extraArgs`, наприклад `--proxy-server=...` або `--proxy-pac-url=...`. Строгий режим SSRF блокує явну маршрутизацію браузера через proxy, якщо доступ браузера до приватної мережі не ввімкнено навмисно.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` вимкнено за замовчуванням; вмикайте лише тоді, коли доступ браузера до приватної мережі є свідомо довіреним.
- `browser.ssrfPolicy.allowPrivateNetwork` і далі підтримується як застарілий псевдонім.

</Accordion>

<Accordion title="Поведінка профілю">

- `attachOnly: true` означає ніколи не запускати локальний браузер; лише під’єднуватися, якщо він уже працює.
- `headless` можна задавати глобально або для окремого локального керованого профілю. Значення для профілю мають вищий пріоритет над `browser.headless`, тому один локально запущений профіль може залишатися headless, тоді як інший буде видимим.
- `POST /start?headless=true` і `openclaw browser start --headless` запитують
  одноразовий запуск у режимі headless для локальних керованих профілів без переписування
  `browser.headless` або конфігурації профілю. Профілі existing-session, attach-only і
  віддаленого CDP відхиляють це перевизначення, оскільки OpenClaw не запускає ці
  процеси браузера.
- На хостах Linux без `DISPLAY` або `WAYLAND_DISPLAY` локальні керовані профілі
  автоматично типово працюють у режимі headless, коли ні середовище, ні конфігурація профілю/глобальна
  конфігурація явно не вибирають режим із вікном. `openclaw browser status --json`
  повідомляє `headlessSource` як `env`, `profile`, `config`,
  `request`, `linux-display-fallback` або `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` примусово вмикає headless для локальних керованих запусків у
  поточному процесі. `OPENCLAW_BROWSER_HEADLESS=0` примусово вмикає режим із вікном для звичайних
  запусків і повертає практичну помилку на хостах Linux без сервера дисплея;
  явний запит `start --headless` усе одно має пріоритет для цього одного запуску.
- `executablePath` можна задавати глобально або для окремого локального керованого профілю. Значення для профілю мають вищий пріоритет над `browser.executablePath`, тому різні керовані профілі можуть запускати різні браузери на базі Chromium.
- `color` (верхній рівень і рівень профілю) тонують UI браузера, щоб ви бачили, який профіль активний.
- Профіль за замовчуванням — `openclaw` (керований автономний). Використайте `defaultProfile: "user"`, щоб за замовчуванням увімкнути браузер користувача з виконаним входом.
- Порядок автовизначення: системний браузер за замовчуванням, якщо він на базі Chromium; інакше Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` використовує Chrome DevTools MCP замість raw CDP. Не задавайте `cdpUrl` для цього driver.
- Установіть `browser.profiles.<name>.userDataDir`, коли профіль existing-session має під’єднуватися до нестандартного користувацького профілю Chromium (Brave, Edge тощо).

</Accordion>

</AccordionGroup>

## Використання Brave (або іншого браузера на базі Chromium)

Якщо вашим **системним браузером за замовчуванням** є браузер на базі Chromium (Chrome/Brave/Edge тощо),
OpenClaw використовує його автоматично. Установіть `browser.executablePath`, щоб перевизначити
автовизначення. `~` розгортається до домашнього каталогу вашої ОС:

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

`executablePath` для окремого профілю впливає лише на локальні керовані профілі, які OpenClaw
запускає сам. Профілі `existing-session` натомість під’єднуються до вже запущеного браузера,
а профілі віддаленого CDP використовують браузер, який стоїть за `cdpUrl`.

## Локальне й віддалене керування

- **Локальне керування (за замовчуванням):** Gateway запускає loopback-сервіс керування й може запускати локальний браузер.
- **Віддалене керування (host Node):** запустіть host Node на машині, де є браузер; Gateway проксіює до нього дії браузера.
- **Віддалений CDP:** установіть `browser.profiles.<name>.cdpUrl` (або `browser.cdpUrl`), щоб
  під’єднатися до віддаленого браузера на базі Chromium. У такому разі OpenClaw не запускатиме локальний браузер.
- `headless` впливає лише на локальні керовані профілі, які запускає OpenClaw. Він не перезапускає й не змінює браузери `existing-session` або віддаленого CDP.
- `executablePath` підпорядковується тому самому правилу локального керованого профілю. Його зміна для
  запущеного локального керованого профілю позначає цей профіль для restart/reconcile, щоб
  наступний запуск використовував новий двійковий файл.

Поведінка зупинки відрізняється залежно від режиму профілю:

- локальні керовані профілі: `openclaw browser stop` зупиняє процес браузера, який
  запустив OpenClaw
- профілі attach-only і віддаленого CDP: `openclaw browser stop` закриває активний
  сеанс керування та скидає перевизначення емуляції Playwright/CDP (viewport,
  color scheme, locale, timezone, offline mode та подібний стан), навіть
  якщо OpenClaw не запускав жодного процесу браузера

URL віддаленого CDP можуть містити автентифікацію:

- query-токени (наприклад, `https://provider.example?token=<token>`)
- HTTP Basic auth (наприклад, `https://user:pass@provider.example`)

OpenClaw зберігає ці дані автентифікації під час виклику endpoint `\/json/*` і під час підключення
до WebSocket CDP. Для токенів віддавайте перевагу змінним середовища або менеджерам секретів замість
запису їх у файли конфігурації.

## Node browser proxy (zero-config за замовчуванням)

Якщо ви запускаєте **host Node** на машині, де є ваш браузер, OpenClaw може
автоматично маршрутизувати виклики browser tool до цього Node без жодної додаткової конфігурації браузера.
Це типовий шлях для віддалених gateway.

Примітки:

- Host Node надає свій локальний сервер керування браузером через **proxy command**.
- Профілі беруться з власної конфігурації `browser.profiles` вузла (так само, як і локально).
- `nodeHost.browserProxy.allowProfiles` необов’язковий. Залиште його порожнім для legacy/типової поведінки: усі налаштовані профілі залишаються доступними через proxy, включно з маршрутами create/delete профілів.
- Якщо ви задаєте `nodeHost.browserProxy.allowProfiles`, OpenClaw розглядає це як межу найменших привілеїв: націлюватися можна лише на профілі з allowlist, а маршрути create/delete постійних профілів блокуються на поверхні proxy.
- Вимкніть це, якщо не хочете використовувати:
  - На Node: `nodeHost.browserProxy.enabled=false`
  - На gateway: `gateway.nodes.browser.mode="off"`

## Browserless (hosted remote CDP)

[Browserless](https://browserless.io) — це hosted-сервіс Chromium, який надає
URL підключення CDP через HTTPS і WebSocket. OpenClaw може використовувати будь-яку форму, але
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
- Виберіть endpoint регіону, який відповідає вашому обліковому запису Browserless (див. їхню документацію).
- Якщо Browserless надає вам базовий URL HTTPS, ви можете або перетворити його на
  `wss://` для прямого підключення CDP, або залишити URL HTTPS і дозволити OpenClaw
  виявити `/json/version`.

## Провайдери прямого WebSocket CDP

Деякі hosted-сервіси браузера надають **прямий endpoint WebSocket** замість
стандартного HTTP-виявлення CDP (`/json/version`). OpenClaw приймає три форми
URL CDP і автоматично вибирає правильну стратегію підключення:

- **HTTP(S)-виявлення** — `http://host[:port]` або `https://host[:port]`.
  OpenClaw викликає `/json/version`, щоб виявити URL WebSocket debugger, а потім
  підключається. Резервного переходу на WebSocket немає.
- **Прямі endpoints WebSocket** — `ws://host[:port]/devtools/<kind>/<id>` або
  `wss://...` зі шляхом `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw підключається безпосередньо через WebSocket-handshake і повністю пропускає
  `/json/version`.
- **Кореневі WebSocket без шляху** — `ws://host[:port]` або `wss://host[:port]` без
  шляху `/devtools/...` (наприклад, [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw спочатку пробує
  HTTP-виявлення `/json/version` (нормалізуючи схему до `http`/`https`);
  якщо в результаті виявлення повертається `webSocketDebuggerUrl`, він використовується, інакше OpenClaw
  переходить до прямого WebSocket-handshake на корені без шляху. Це дає змогу
  підключатися й для простого `ws://`, спрямованого на локальний Chrome, оскільки Chrome лише
  приймає WebSocket upgrades на конкретному шляху для цілі з
  `/json/version`.

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
- Browserbase автоматично створює сеанс браузера під час підключення WebSocket, тож
  ручний крок створення сеансу не потрібен.
- Безкоштовний тариф дозволяє один одночасний сеанс і одну browser hour на місяць.
  Див. [pricing](https://www.browserbase.com/pricing) щодо обмежень платних планів.
- Див. [документацію Browserbase](https://docs.browserbase.com) для повного
  довідника API, посібників із SDK та прикладів інтеграції.

## Безпека

Ключові ідеї:

- Керування браузером доступне лише через loopback; доступ проходить через автентифікацію Gateway або pairing вузла.
- Окремий loopback HTTP API браузера використовує **лише автентифікацію через shared-secret**:
  bearer auth із токеном gateway, `x-openclaw-password` або HTTP Basic auth із
  налаштованим паролем gateway.
- Заголовки ідентичності Tailscale Serve і `gateway.auth.mode: "trusted-proxy"`
  **не** автентифікують цей окремий loopback API браузера.
- Якщо керування браузером увімкнено й не налаштовано жодної автентифікації через shared-secret, OpenClaw
  автоматично генерує `gateway.auth.token` під час запуску й зберігає його в конфігурації.
- OpenClaw **не** генерує цей токен автоматично, якщо `gateway.auth.mode` уже має значення
  `password`, `none` або `trusted-proxy`.
- Тримайте Gateway і будь-які host Node у приватній мережі (Tailscale); уникайте публічного доступу.
- Ставтеся до URL/токенів віддаленого CDP як до секретів; віддавайте перевагу env vars або менеджеру секретів.

Поради щодо віддаленого CDP:

- За можливості віддавайте перевагу зашифрованим endpoint (`HTTPS` або `WSS`) і токенам із коротким строком дії.
- Уникайте вбудовування токенів із довгим строком дії безпосередньо у файли конфігурації.

## Профілі (кілька браузерів)

OpenClaw підтримує кілька іменованих профілів (конфігурацій маршрутизації). Профілі можуть бути:

- **керованими OpenClaw**: виділений екземпляр браузера на базі Chromium із власним каталогом користувацьких даних + портом CDP
- **віддаленими**: явний URL CDP (браузер на базі Chromium, запущений деінде)
- **наявним сеансом**: ваш наявний профіль Chrome через автопідключення Chrome DevTools MCP

Типова поведінка:

- Профіль `openclaw` створюється автоматично, якщо відсутній.
- Профіль `user` вбудований для attach до наявного сеансу Chrome MCP.
- Профілі existing-session, крім `user`, вмикаються лише явно; створюйте їх через `--driver existing-session`.
- Локальні порти CDP типово виділяються з діапазону **18800–18899**.
- Видалення профілю переміщує його локальний каталог даних до Trash.

Усі endpoints керування приймають `?profile=<name>`; CLI використовує `--browser-profile`.

## Наявний сеанс через Chrome DevTools MCP

OpenClaw також може під’єднуватися до запущеного профілю браузера на базі Chromium через
офіційний сервер Chrome DevTools MCP. Це повторно використовує вкладки та стан входу,
які вже відкриті в цьому профілі браузера.

Офіційні довідкові матеріали й матеріали з налаштування:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
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
3. Залиште браузер запущеним і підтвердьте запит на підключення, коли OpenClaw приєднається.

Типові сторінки inspect:

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

Ознаки успішного підключення:

- `status` показує `driver: existing-session`
- `status` показує `transport: chrome-mcp`
- `status` показує `running: true`
- `tabs` перелічує ваші вже відкриті вкладки браузера
- `snapshot` повертає refs із вибраної live-вкладки

Що перевірити, якщо підключення не працює:

- цільовий браузер на базі Chromium має версію `144+`
- у сторінці inspect цього браузера увімкнено віддалене налагодження
- браузер показав запит на згоду для підключення, і ви його підтвердили
- `openclaw doctor` мігрує стару конфігурацію браузера на основі розширення й перевіряє, що
  Chrome локально встановлений для типових профілів автопідключення, але він не може
  увімкнути віддалене налагодження на боці браузера за вас

Використання агентом:

- Використовуйте `profile="user"`, коли вам потрібен браузер користувача зі станом входу.
- Якщо ви використовуєте власний профіль existing-session, передайте явну назву цього профілю.
- Вибирайте цей режим лише тоді, коли користувач перебуває за комп’ютером, щоб підтвердити запит
  на підключення.
- Gateway або host Node може запускати `npx chrome-devtools-mcp@latest --autoConnect`

Примітки:

- Цей шлях має вищий ризик, ніж ізольований профіль `openclaw`, оскільки він може
  виконувати дії у вашому браузері з виконаним входом.
- OpenClaw не запускає браузер для цього driver; він лише під’єднується.
- Тут OpenClaw використовує офіційний потік Chrome DevTools MCP `--autoConnect`. Якщо
  задано `userDataDir`, його буде передано далі для націлювання на цей каталог користувацьких даних.
- Existing-session може під’єднуватися на вибраному host або через підключений
  browser Node. Якщо Chrome розташований деінде й не підключено browser Node, використовуйте
  натомість віддалений CDP або host Node.

<Accordion title="Обмеження функцій existing-session">

Порівняно з керованим профілем `openclaw`, драйвери existing-session мають більше обмежень:

- **Знімки екрана** — працюють захоплення сторінки та захоплення елемента через `--ref`; CSS-селектори `--element` не працюють. `--full-page` не можна поєднувати з `--ref` або `--element`. Для знімків екрана сторінки або елемента за `ref` Playwright не потрібен.
- **Дії** — `click`, `type`, `hover`, `scrollIntoView`, `drag` і `select` потребують snapshot refs (без CSS-селекторів). `click-coords` натискає видимі координати viewport і не потребує snapshot ref. `click` підтримує лише ліву кнопку миші. `type` не підтримує `slowly=true`; використовуйте `fill` або `press`. `press` не підтримує `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` і `evaluate` не підтримують тайм-аути для окремих викликів. `select` приймає одне значення.
- **Очікування / завантаження файлу / діалог** — `wait --url` підтримує точний збіг, підрядок і glob-шаблони; `wait --load networkidle` не підтримується. Hooks завантаження файлів потребують `ref` або `inputRef`, по одному файлу за раз, без CSS `element`. Hooks діалогів не підтримують перевизначення тайм-ауту.
- **Функції лише для керованого режиму** — пакетні дії, експорт PDF, перехоплення завантажень і `responsebody` як і раніше потребують шляху керованого браузера.

</Accordion>

## Гарантії ізоляції

- **Виділений каталог користувацьких даних**: ніколи не торкається профілю вашого особистого браузера.
- **Виділені порти**: уникає `9222`, щоб не створювати конфліктів із робочими процесами розробки.
- **Детерміноване керування вкладками**: `tabs` спочатку повертає `suggestedTargetId`, а потім
  стабільні дескриптори `tabId`, такі як `t1`, необов’язкові мітки та сирий `targetId`.
  Агенти мають повторно використовувати `suggestedTargetId`; сирі id залишаються доступними для
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
- Windows: перевіряє поширені місця встановлення.

## API керування (необов’язково)

Для автоматизації сценаріями та налагодження Gateway надає невеликий **loopback-only HTTP
API керування** плюс відповідний CLI `openclaw browser` (snapshot, refs, можливості wait,
вивід JSON, робочі процеси налагодження). Див.
[API керування браузером](/uk/tools/browser-control) для повного довідника.

## Усунення несправностей

Щодо проблем, специфічних для Linux (особливо snap Chromium), див.
[Усунення несправностей браузера](/uk/tools/browser-linux-troubleshooting).

Для конфігурацій із розділеними хостами WSL2 Gateway + Windows Chrome див.
[Усунення несправностей WSL2 + Windows + remote Chrome CDP](/uk/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Помилка запуску CDP проти блокування SSRF під час навігації

Це різні класи помилок, і вони вказують на різні шляхи коду.

- **Помилка запуску або готовності CDP** означає, що OpenClaw не може підтвердити, що площина керування браузером справна.
- **Блокування SSRF під час навігації** означає, що площина керування браузером справна, але ціль навігації сторінки відхиляється політикою.

Типові приклади:

- Помилка запуску або готовності CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- Блокування SSRF під час навігації:
  - потоки `open`, `navigate`, snapshot або відкриття вкладки завершуються помилкою політики браузера/мережі, тоді як `start` і `tabs` усе ще працюють

Використайте цю мінімальну послідовність, щоб відрізнити одне від іншого:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Як читати результати:

- Якщо `start` завершується помилкою `not reachable after start`, спочатку усувайте проблему готовності CDP.
- Якщо `start` успішний, але `tabs` завершується помилкою, площина керування все ще несправна. Розглядайте це як проблему доступності CDP, а не проблему навігації сторінки.
- Якщо `start` і `tabs` успішні, але `open` або `navigate` завершується помилкою, площина керування браузером працює, а проблема в політиці навігації або цільовій сторінці.
- Якщо `start`, `tabs` і `open` усі успішні, базовий шлях керування керованим браузером справний.

Важливі подробиці поведінки:

- Конфігурація браузера за замовчуванням використовує fail-closed об’єкт політики SSRF, навіть якщо ви не налаштовуєте `browser.ssrfPolicy`.
- Для локального керованого профілю loopback `openclaw` перевірки справності CDP навмисно пропускають застосування доступності SSRF браузера для власної локальної площини керування OpenClaw.
- Захист навігації є окремим. Успішний результат `start` або `tabs` не означає, що пізніша ціль `open` або `navigate` буде дозволена.

Вказівки з безпеки:

- **Не** послаблюйте політику SSRF браузера за замовчуванням.
- Віддавайте перевагу вузьким виняткам для host, таким як `hostnameAllowlist` або `allowedHostnames`, замість широкого доступу до приватної мережі.
- Використовуйте `dangerouslyAllowPrivateNetwork: true` лише в навмисно довірених середовищах, де доступ браузера до приватної мережі потрібен і перевірений.

## Tools агента + як працює керування

Агент отримує **один tool** для автоматизації браузера:

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Як це зіставляється:

- `browser snapshot` повертає стабільне дерево UI (AI або ARIA).
- `browser act` використовує ідентифікатори `ref` зі snapshot для click/type/drag/select.
- `browser screenshot` захоплює пікселі (повна сторінка, елемент або refs із мітками).
- `browser doctor` перевіряє готовність Gateway, Plugin, профілю, браузера та вкладки.
- `browser` приймає:
  - `profile` для вибору іменованого профілю браузера (openclaw, chrome або remote CDP).
  - `target` (`sandbox` | `host` | `node`) для вибору місця, де розташований браузер.
  - У sandboxed sessions `target: "host"` потребує `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Якщо `target` не вказано: sandboxed sessions за замовчуванням використовують `sandbox`, а не-sandbox sessions — `host`.
  - Якщо підключено Node із підтримкою браузера, tool може автоматично маршрутизуватися до нього, якщо ви не зафіксуєте `target="host"` або `target="node"`.

Це зберігає детермінованість агента й дає змогу уникати крихких селекторів.

## Пов’язане

- [Огляд Tools](/uk/tools) — усі доступні tools агента
- [Sandboxing](/uk/gateway/sandboxing) — керування браузером у sandboxed environments
- [Безпека](/uk/gateway/security) — ризики керування браузером і посилення захисту
