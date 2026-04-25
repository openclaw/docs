---
read_when:
    - Додавання автоматизації браузера, керованої агентом
    - Налагодження причин, через які OpenClaw втручається у роботу вашого власного Chrome
    - Реалізація налаштувань браузера та керування його життєвим циклом у застосунку macOS
summary: Інтегрований сервіс керування браузером + команди дій
title: Браузер (під керуванням OpenClaw)
x-i18n:
    generated_at: "2026-04-25T12:59:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2f6915568d2119d2473fc4ee489a03582ffd34218125835d5e073476d3009896
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw може запускати **окремий профіль Chrome/Brave/Edge/Chromium**, яким керує агент.
Він ізольований від вашого особистого браузера та керується через невеликий локальний
сервіс керування всередині Gateway (лише loopback).

Погляд для початківців:

- Думайте про це як про **окремий браузер лише для агента**.
- Профіль `openclaw` **не** взаємодіє з профілем вашого особистого браузера.
- Агент може **відкривати вкладки, читати сторінки, натискати та вводити текст** у безпечному середовищі.
- Вбудований профіль `user` підключається до вашої справжньої авторизованої сесії Chrome через Chrome MCP.

## Що ви отримуєте

- Окремий профіль браузера з назвою **openclaw** (типово з помаранчевим акцентом).
- Детерміноване керування вкладками (список/відкриття/фокусування/закриття).
- Дії агента (натискання/введення/перетягування/вибір), знімки стану, скриншоти, PDF.
- Вбудований навик `browser-automation`, який навчає агентів циклу відновлення snapshot,
  stable-tab, stale-ref і manual-blocker, коли ввімкнено Plugin браузера.
- Необов’язкова підтримка кількох профілів (`openclaw`, `work`, `remote`, ...).

Цей браузер **не** призначений для вашого повсякденного використання. Це безпечна, ізольована поверхня для
автоматизації та перевірки агентом.

## Швидкий старт

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
недоступний, перейдіть до [Відсутня команда браузера або інструмент](/uk/tools/browser#missing-browser-command-or-tool).

## Керування Plugin

Типовий інструмент `browser` є вбудованим Plugin. Вимкніть його, щоб замінити іншим Plugin, який реєструє той самий інструмент `browser`:

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

Для типових налаштувань потрібні і `plugins.entries.browser.enabled`, **і** `browser.enabled=true`. Якщо вимкнути лише Plugin, це прибере CLI `openclaw browser`, метод Gateway `browser.request`, інструмент агента та сервіс керування як єдине ціле; ваша конфігурація `browser.*` залишиться недоторканою для заміни.

Зміни конфігурації браузера потребують перезапуску Gateway, щоб Plugin міг повторно зареєструвати свій сервіс.

## Вказівки для агента

Plugin браузера постачається з двома рівнями вказівок для агента:

- Опис інструмента `browser` містить компактний, завжди активний контракт: вибирати
  правильний профіль, зберігати refs у межах тієї самої вкладки, використовувати `tabId`/мітки для
  націлювання на вкладки та завантажувати навик браузера для багатокрокової роботи.
- Вбудований навик `browser-automation` містить довший робочий цикл:
  спочатку перевіряти статус/вкладки, позначати вкладки завдання, робити snapshot перед дією,
  повторно робити snapshot після змін UI, один раз відновлювати stale refs і повідомляти про блокування через login/2FA/captcha або
  camera/microphone як про ручну дію замість здогадок.

Навички, вбудовані в Plugin, перелічуються в доступних навичках агента, коли
Plugin увімкнено. Повні інструкції навику завантажуються на вимогу, тому звичайні
ходи не сплачують повну вартість у токенах.

## Відсутня команда браузера або інструмент

Якщо після оновлення `openclaw browser` невідома, `browser.request` відсутній або агент повідомляє, що інструмент браузера недоступний, звичайною причиною є список `plugins.allow`, у якому немає `browser`. Додайте його:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true` і `tools.alsoAllow: ["browser"]` не замінюють членство в allowlist — allowlist керує завантаженням Plugin, а політика інструментів застосовується лише після завантаження. Видалення `plugins.allow` повністю також відновлює типову поведінку.

## Профілі: `openclaw` проти `user`

- `openclaw`: керований, ізольований браузер (розширення не потрібне).
- `user`: вбудований профіль підключення Chrome MCP до вашої **справжньої авторизованої сесії Chrome**.

Для викликів інструмента браузера агентом:

- Типово: використовуйте ізольований браузер `openclaw`.
- Віддавайте перевагу `profile="user"`, коли важливі наявні авторизовані сесії і користувач
  перебуває за комп’ютером, щоб натиснути/підтвердити будь-який запит на підключення.
- `profile` — це явне перевизначення, коли вам потрібен конкретний режим браузера.

Установіть `browser.defaultProfile: "openclaw"`, якщо хочете, щоб керований режим був типовим.

## Конфігурація

Налаштування браузера розташовані в `~/.openclaw/openclaw.json`.

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
    actionTimeoutMs: 60000, // типовий тайм-аут дії браузера (мс)
    tabCleanup: {
      enabled: true, // типово: true
      idleMinutes: 120, // установіть 0, щоб вимкнути очищення неактивних вкладок
      maxTabsPerSession: 8, // установіть 0, щоб вимкнути обмеження на сесію
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

- Сервіс керування прив’язується до loopback на порту, похідному від `gateway.port` (типово `18791` = Gateway + 2). Перевизначення `gateway.port` або `OPENCLAW_GATEWAY_PORT` зміщує похідні порти в тій самій групі.
- Локальні профілі `openclaw` автоматично призначають `cdpPort`/`cdpUrl`; задавайте їх лише для віддаленого CDP. Якщо `cdpUrl` не вказано, типово використовується локальний керований порт CDP.
- `remoteCdpTimeoutMs` застосовується до перевірок HTTP-доступності віддаленого (не loopback) CDP; `remoteCdpHandshakeTimeoutMs` застосовується до рукостискань WebSocket віддаленого CDP.
- `localLaunchTimeoutMs` — це бюджет часу для того, щоб локально запущений керований процес Chrome
  відкрив свою HTTP-адресу CDP. `localCdpReadyTimeoutMs` — це
  наступний бюджет часу для готовності websocket CDP після виявлення процесу.
  Збільшуйте ці значення на Raspberry Pi, бюджетних VPS або старішому обладнанні, де Chromium
  запускається повільно. Значення обмежені 120000 мс.
- `actionTimeoutMs` — це типовий бюджет часу для запитів браузера `act`, коли викликач не передає `timeoutMs`. Транспорт клієнта додає невелике додаткове вікно, щоб довгі очікування могли завершитися, а не обриватися на межі HTTP через тайм-аут.
- `tabCleanup` — це best-effort очищення вкладок, відкритих основними сесіями браузера агента. Очищення життєвого циклу Subagent, Cron і ACP усе ще закриває їхні явно відстежувані вкладки наприкінці сесії; основні сесії зберігають активні вкладки доступними для повторного використання, а потім у фоновому режимі закривають неактивні або зайві відстежувані вкладки.

</Accordion>

<Accordion title="Політика SSRF">

- Навігація браузера та open-tab захищені від SSRF перед навігацією, а після цього проходять повторну best-effort перевірку на фінальному URL `http(s)`.
- У суворому режимі SSRF також перевіряються виявлення віддалених кінцевих точок CDP і запити `/json/version` (`cdpUrl`).
- Змінні середовища Gateway/provider `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` і `NO_PROXY` не проксіюють автоматично браузер під керуванням OpenClaw. Керований Chrome типово запускається напряму, тому налаштування проксі provider не послаблюють перевірки SSRF браузера.
- Щоб проксіювати сам керований браузер, передайте явні прапорці проксі Chrome через `browser.extraArgs`, наприклад `--proxy-server=...` або `--proxy-pac-url=...`. Суворий режим SSRF блокує явну маршрутизацію браузерного проксі, якщо доступ браузера до приватної мережі не був навмисно ввімкнений.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` типово вимкнено; вмикайте лише тоді, коли доступ браузера до приватної мережі навмисно вважається довіреним.
- `browser.ssrfPolicy.allowPrivateNetwork` і далі підтримується як застарілий псевдонім.

</Accordion>

<Accordion title="Поведінка профілів">

- `attachOnly: true` означає ніколи не запускати локальний браузер; лише підключатися, якщо він уже запущений.
- `headless` можна задавати глобально або для кожного локального керованого профілю. Значення для конкретного профілю мають пріоритет над `browser.headless`, тому один локально запущений профіль може залишатися headless, тоді як інший буде видимим.
- `POST /start?headless=true` і `openclaw browser start --headless` запитують
  одноразовий запуск у режимі headless для локальних керованих профілів без переписування
  `browser.headless` або конфігурації профілю. Профілі existing-session, attach-only і
  remote CDP відхиляють це перевизначення, оскільки OpenClaw не запускає ці
  процеси браузера.
- На Linux-хостах без `DISPLAY` або `WAYLAND_DISPLAY` локальні керовані профілі
  типово автоматично переходять у headless, якщо ні середовище, ні конфігурація профілю/глобальна
  конфігурація явно не вибирають видимий режим. `openclaw browser status --json`
  повідомляє `headlessSource` як `env`, `profile`, `config`,
  `request`, `linux-display-fallback` або `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` примусово запускає локальні керовані профілі в режимі headless для
  поточного процесу. `OPENCLAW_BROWSER_HEADLESS=0` примусово вмикає видимий режим для звичайних
  запусків і повертає зрозумілу помилку на Linux-хостах без display server;
  явний запит `start --headless` усе одно має пріоритет для цього одного запуску.
- `executablePath` можна задавати глобально або для кожного локального керованого профілю. Значення для конкретного профілю мають пріоритет над `browser.executablePath`, тому різні керовані профілі можуть запускати різні браузери на основі Chromium.
- `color` (на верхньому рівні та для кожного профілю) тонує UI браузера, щоб ви могли бачити, який профіль активний.
- Типовий профіль — `openclaw` (керований окремий). Використовуйте `defaultProfile: "user"`, щоб перейти на авторизований браузер користувача.
- Порядок автовиявлення: системний типовий браузер, якщо він на основі Chromium; інакше Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` використовує Chrome DevTools MCP замість сирого CDP. Не встановлюйте `cdpUrl` для цього driver.
- Установіть `browser.profiles.<name>.userDataDir`, коли профіль existing-session має підключатися до нетипового профілю користувача Chromium (Brave, Edge тощо).

</Accordion>

</AccordionGroup>

## Використання Brave (або іншого браузера на основі Chromium)

Якщо ваш **системний типовий** браузер працює на основі Chromium (Chrome/Brave/Edge тощо),
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

`executablePath` для конкретного профілю впливає лише на локальні керовані профілі, які запускає OpenClaw.
Профілі `existing-session` натомість підключаються до вже запущеного браузера,
а профілі remote CDP використовують браузер, який стоїть за `cdpUrl`.

## Локальне та віддалене керування

- **Локальне керування (типово):** Gateway запускає loopback-сервіс керування і може запускати локальний браузер.
- **Віддалене керування (вузол-хост):** запустіть вузол-хост на машині, де є браузер; Gateway проксіюватиме до нього дії браузера.
- **Remote CDP:** установіть `browser.profiles.<name>.cdpUrl` (або `browser.cdpUrl`), щоб
  підключитися до віддаленого браузера на основі Chromium. У цьому випадку OpenClaw не запускатиме локальний браузер.
- `headless` впливає лише на локальні керовані профілі, які запускає OpenClaw. Це не перезапускає і не змінює браузери existing-session або remote CDP.
- `executablePath` підпорядковується тому самому правилу локальних керованих профілів. Його зміна для
  запущеного локального керованого профілю позначає цей профіль для перезапуску/узгодження, щоб
  наступний запуск використовував новий бінарний файл.

Поведінка зупинки відрізняється залежно від режиму профілю:

- локальні керовані профілі: `openclaw browser stop` зупиняє процес браузера, який
  запустив OpenClaw
- профілі attach-only і remote CDP: `openclaw browser stop` закриває активну
  сесію керування та скидає перевизначення емуляції Playwright/CDP (viewport,
  color scheme, locale, timezone, offline mode та подібний стан), навіть
  якщо OpenClaw не запускав жодного процесу браузера

URL віддаленого CDP можуть містити автентифікацію:

- Токени запиту (наприклад, `https://provider.example?token=<token>`)
- HTTP Basic auth (наприклад, `https://user:pass@provider.example`)

OpenClaw зберігає автентифікаційні дані під час викликів кінцевих точок `/json/*` і під час підключення
до WebSocket CDP. Для токенів краще використовувати змінні середовища або менеджери секретів замість
запису їх у файли конфігурації.

## Проксі браузера вузла (типово без конфігурації)

Якщо ви запускаєте **вузол-хост** на машині, де є ваш браузер, OpenClaw може
автоматично спрямовувати виклики інструмента браузера до цього вузла без додаткової конфігурації браузера.
Це типовий шлях для віддалених Gateway.

Примітки:

- Вузол-хост надає свій локальний сервер керування браузером через **proxy command**.
- Профілі беруться з власної конфігурації `browser.profiles` вузла (так само, як локально).
- `nodeHost.browserProxy.allowProfiles` необов’язковий. Залиште його порожнім для застарілої/типової поведінки: усі налаштовані профілі залишаються доступними через проксі, включно з маршрутами створення/видалення профілів.
- Якщо ви задаєте `nodeHost.browserProxy.allowProfiles`, OpenClaw трактує це як межу найменших привілеїв: можна звертатися лише до профілів з allowlist, а маршрути створення/видалення постійних профілів блокуються на поверхні проксі.
- Вимкніть це, якщо воно вам не потрібне:
  - На вузлі: `nodeHost.browserProxy.enabled=false`
  - На Gateway: `gateway.nodes.browser.mode="off"`

## Browserless (хостинговий remote CDP)

[Browserless](https://browserless.io) — це хостинговий сервіс Chromium, який надає
URL підключення CDP через HTTPS і WebSocket. OpenClaw може використовувати будь-який із цих форматів, але
для віддаленого профілю браузера найпростішим варіантом є прямий URL WebSocket
з документації з підключення Browserless.

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
- Виберіть кінцеву точку регіону, яка відповідає вашому обліковому запису Browserless (див. їхню документацію).
- Якщо Browserless надає вам базовий URL HTTPS, ви можете або перетворити його на
  `wss://` для прямого підключення CDP, або залишити URL HTTPS і дозволити OpenClaw
  виявити `/json/version`.

## Провайдери прямого WebSocket CDP

Деякі хостингові сервіси браузерів надають **пряму кінцеву точку WebSocket** замість
стандартного виявлення CDP на основі HTTP (`/json/version`). OpenClaw приймає три
форми URL CDP і автоматично вибирає правильну стратегію підключення:

- **HTTP(S) discovery** — `http://host[:port]` або `https://host[:port]`.
  OpenClaw викликає `/json/version`, щоб виявити URL debugger WebSocket, а потім
  підключається. Без fallback на WebSocket.
- **Прямі кінцеві точки WebSocket** — `ws://host[:port]/devtools/<kind>/<id>` або
  `wss://...` зі шляхом `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw підключається напряму через рукостискання WebSocket і повністю пропускає
  `/json/version`.
- **Корені bare WebSocket** — `ws://host[:port]` або `wss://host[:port]` без
  шляху `/devtools/...` (наприклад, [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw спочатку намагається виконати HTTP
  виявлення через `/json/version` (нормалізуючи схему до `http`/`https`);
  якщо виявлення повертає `webSocketDebuggerUrl`, він використовується, інакше OpenClaw
  переходить до прямого рукостискання WebSocket на bare-корені. Це дозволяє
  bare `ws://`, спрямованому на локальний Chrome, усе одно підключатися, оскільки Chrome
  приймає оновлення WebSocket лише на конкретному шляху для цілі з
  `/json/version`.

### Browserbase

[Browserbase](https://www.browserbase.com) — це хмарна платформа для запуску
headless-браузерів із вбудованим розв’язанням CAPTCHA, stealth mode і резидентними
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

- [Зареєструйтеся](https://www.browserbase.com/sign-up) і скопіюйте свій **API Key**
  з [панелі Overview](https://www.browserbase.com/overview).
- Замініть `<BROWSERBASE_API_KEY>` на ваш справжній API key Browserbase.
- Browserbase автоматично створює сесію браузера під час підключення WebSocket, тому
  окремий крок ручного створення сесії не потрібен.
- Безкоштовний тариф дозволяє одну одночасну сесію та одну браузерну годину на місяць.
  Обмеження платних тарифів дивіться в [pricing](https://www.browserbase.com/pricing).
- Повний довідник API, посібники з SDK та приклади інтеграції дивіться в [документації Browserbase](https://docs.browserbase.com).

## Безпека

Ключові ідеї:

- Керування браузером доступне лише через loopback; доступ проходить через автентифікацію Gateway або pairing вузла.
- Окремий loopback HTTP API браузера використовує **лише автентифікацію через shared-secret**:
  bearer auth за токеном Gateway, `x-openclaw-password` або HTTP Basic auth із
  налаштованим паролем Gateway.
- Заголовки ідентичності Tailscale Serve і `gateway.auth.mode: "trusted-proxy"`
  **не** автентифікують цей окремий loopback API браузера.
- Якщо керування браузером увімкнено і не налаштовано жодної shared-secret auth, OpenClaw
  автоматично генерує `gateway.auth.token` під час запуску та зберігає його в конфігурації.
- OpenClaw **не** генерує цей токен автоматично, якщо `gateway.auth.mode` уже має значення
  `password`, `none` або `trusted-proxy`.
- Тримайте Gateway і будь-які вузли-хости в приватній мережі (Tailscale); уникайте публічного доступу.
- Вважайте URL/токени remote CDP секретами; надавайте перевагу змінним середовища або менеджеру секретів.

Поради щодо remote CDP:

- За можливості віддавайте перевагу зашифрованим кінцевим точкам (HTTPS або WSS) і короткоживучим токенам.
- Уникайте вбудовування довгоживучих токенів безпосередньо у файли конфігурації.

## Профілі (кілька браузерів)

OpenClaw підтримує кілька іменованих профілів (конфігурацій маршрутизації). Профілі можуть бути:

- **під керуванням OpenClaw**: окремий екземпляр браузера на основі Chromium із власним каталогом даних користувача + портом CDP
- **віддалені**: явний URL CDP (браузер на основі Chromium запущено деінде)
- **наявна сесія**: ваш наявний профіль Chrome через автопідключення Chrome DevTools MCP

Типові значення:

- Профіль `openclaw` створюється автоматично, якщо відсутній.
- Профіль `user` вбудований для підключення existing-session через Chrome MCP.
- Профілі existing-session, окрім `user`, вмикаються лише явно; створюйте їх через `--driver existing-session`.
- Локальні порти CDP типово виділяються з діапазону **18800–18899**.
- Видалення профілю переміщує його локальний каталог даних до Trash.

Усі кінцеві точки керування приймають `?profile=<name>`; CLI використовує `--browser-profile`.

## Наявна сесія через Chrome DevTools MCP

OpenClaw також може підключатися до запущеного профілю браузера на основі Chromium через
офіційний сервер Chrome DevTools MCP. Це повторно використовує вкладки та стан входу,
які вже відкриті в цьому профілі браузера.

Офіційні довідкові матеріали та посилання на налаштування:

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

1. Відкрийте сторінку inspect цього браузера для remote debugging.
2. Увімкніть remote debugging.
3. Не закривайте браузер і підтвердьте запит на підключення, коли OpenClaw приєднається.

Поширені сторінки inspect:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Живий smoke test підключення:

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
- `snapshot` повертає refs із вибраної живої вкладки

Що перевірити, якщо підключення не працює:

- цільовий браузер на основі Chromium має версію `144+`
- remote debugging увімкнено на сторінці inspect цього браузера
- браузер показав запит на згоду на підключення, і ви його прийняли
- `openclaw doctor` мігрує стару конфігурацію браузера на основі розширення і перевіряє,
  що Chrome локально встановлено для типових профілів автопідключення, але він не може
  увімкнути remote debugging у браузері замість вас

Використання агентом:

- Використовуйте `profile="user"`, коли вам потрібен стан авторизованого браузера користувача.
- Якщо ви використовуєте власний профіль existing-session, передайте явну назву цього профілю.
- Вибирайте цей режим лише тоді, коли користувач перебуває за комп’ютером, щоб підтвердити
  запит на підключення.
- Gateway або вузол-хост може запускати `npx chrome-devtools-mcp@latest --autoConnect`

Примітки:

- Цей шлях має вищий ризик, ніж ізольований профіль `openclaw`, оскільки він може
  виконувати дії у вашій авторизованій сесії браузера.
- OpenClaw не запускає браузер для цього driver; він лише підключається.
- Тут OpenClaw використовує офіційний потік Chrome DevTools MCP `--autoConnect`. Якщо
  задано `userDataDir`, його буде передано далі для націлювання на цей каталог даних користувача.
- Existing-session може підключатися на вибраному хості або через підключений
  browser Node. Якщо Chrome розташований деінде і жоден browser Node не підключено, використовуйте
  remote CDP або вузол-хост натомість.

### Власний запуск Chrome MCP

Перевизначте сервер Chrome DevTools MCP, який запускається для конкретного профілю, коли типовий
потік `npx chrome-devtools-mcp@latest` вам не підходить (офлайн-хости,
закріплені версії, вендорні бінарні файли):

| Поле         | Що воно робить                                                                                                             |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Виконуваний файл, який запускати замість `npx`. Розв’язується як є; абсолютні шляхи підтримуються.                        |
| `mcpArgs`    | Масив аргументів, який без змін передається до `mcpCommand`. Замінює типові аргументи `chrome-devtools-mcp@latest --autoConnect`. |

Коли для профілю existing-session задано `cdpUrl`, OpenClaw пропускає
`--autoConnect` і автоматично передає кінцеву точку до Chrome MCP:

- `http(s)://...` → `--browserUrl <url>` (кінцева точка HTTP discovery DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (прямий WebSocket CDP).

Прапорці кінцевої точки та `userDataDir` не можна поєднувати: коли задано `cdpUrl`,
`userDataDir` ігнорується під час запуску Chrome MCP, оскільки Chrome MCP підключається до
запущеного браузера за цією кінцевою точкою, а не відкриває каталог
профілю.

<Accordion title="Обмеження можливостей existing-session">

Порівняно з керованим профілем `openclaw`, драйвери existing-session мають більше обмежень:

- **Скриншоти** — знімки сторінки та знімки елементів через `--ref` працюють; CSS-селектори `--element` — ні. `--full-page` не можна поєднувати з `--ref` або `--element`. Playwright не потрібен для скриншотів сторінки або елементів на основі ref.
- **Дії** — `click`, `type`, `hover`, `scrollIntoView`, `drag` і `select` потребують snapshot refs (без CSS-селекторів). `click-coords` натискає видимі координати viewport і не потребує snapshot ref. `click` підтримує лише ліву кнопку миші. `type` не підтримує `slowly=true`; використовуйте `fill` або `press`. `press` не підтримує `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` і `evaluate` не підтримують тайм-аути для окремих викликів. `select` приймає одне значення.
- **Очікування / завантаження файлів / діалогові вікна** — `wait --url` підтримує точний збіг, підрядок і glob-шаблони; `wait --load networkidle` не підтримується. Хуки завантаження файлів потребують `ref` або `inputRef`, по одному файлу за раз, без CSS `element`. Хуки діалогових вікон не підтримують перевизначення тайм-ауту.
- **Можливості лише для керованого режиму** — пакетні дії, експорт PDF, перехоплення завантажень і `responsebody` усе ще потребують шляху керованого браузера.

</Accordion>

## Гарантії ізоляції

- **Окремий каталог даних користувача**: ніколи не взаємодіє з профілем вашого особистого браузера.
- **Окремі порти**: уникає `9222`, щоб не створювати конфліктів із робочими процесами розробки.
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

Для сценаріїв і налагодження Gateway надає невеликий **HTTP API керування
лише для loopback**, а також відповідний CLI `openclaw browser` (snapshots, refs, wait
power-ups, вивід JSON, робочі процеси налагодження). Див.
[API керування браузером](/uk/tools/browser-control) для повного довідника.

## Усунення несправностей

Для проблем, специфічних для Linux (особливо snap Chromium), див.
[Усунення несправностей браузера](/uk/tools/browser-linux-troubleshooting).

Для конфігурацій із розділеними хостами WSL2 Gateway + Windows Chrome див.
[Усунення несправностей WSL2 + Windows + remote Chrome CDP](/uk/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Помилка запуску CDP проти блокування SSRF під час навігації

Це різні класи помилок, і вони вказують на різні шляхи коду.

- **Помилка запуску або готовності CDP** означає, що OpenClaw не може підтвердити, що площина керування браузером справна.
- **Блокування SSRF під час навігації** означає, що площина керування браузером справна, але ціль переходу сторінки відхиляється політикою.

Поширені приклади:

- Помилка запуску або готовності CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- Блокування SSRF під час навігації:
  - потоки `open`, `navigate`, snapshot або відкриття вкладок завершуються з помилкою політики браузера/мережі, тоді як `start` і `tabs` усе ще працюють

Використайте цю мінімальну послідовність, щоб відрізнити одне від іншого:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Як читати результати:

- Якщо `start` завершується помилкою `not reachable after start`, спочатку усувайте проблему готовності CDP.
- Якщо `start` успішний, але `tabs` завершується помилкою, площина керування все ще несправна. Розглядайте це як проблему доступності CDP, а не проблему навігації сторінки.
- Якщо `start` і `tabs` успішні, але `open` або `navigate` завершуються помилкою, площина керування браузером працює, а збій пов’язаний із політикою навігації або цільовою сторінкою.
- Якщо `start`, `tabs` і `open` усі успішні, базовий шлях керування керованим браузером справний.

Важливі деталі поведінки:

- Конфігурація браузера типово використовує об’єкт політики SSRF fail-closed, навіть якщо ви не налаштовуєте `browser.ssrfPolicy`.
- Для локального керованого профілю loopback `openclaw` перевірки справності CDP навмисно пропускають застосування перевірок доступності SSRF браузера для власної локальної площини керування OpenClaw.
- Захист навігації є окремим. Успішний результат `start` або `tabs` не означає, що пізніша ціль `open` або `navigate` дозволена.

Вказівки з безпеки:

- **Не** послаблюйте політику SSRF браузера типово.
- Віддавайте перевагу вузьким виняткам для хостів, таким як `hostnameAllowlist` або `allowedHostnames`, замість широкого доступу до приватної мережі.
- Використовуйте `dangerouslyAllowPrivateNetwork: true` лише в навмисно довірених середовищах, де доступ браузера до приватної мережі потрібен і перевірений.

## Інструменти агента + як працює керування

Агент отримує **один інструмент** для автоматизації браузера:

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Як це відображається:

- `browser snapshot` повертає стабільне дерево UI (AI або ARIA).
- `browser act` використовує ID `ref` зі snapshot для click/type/drag/select.
- `browser screenshot` захоплює пікселі (повна сторінка, елемент або позначені refs).
- `browser doctor` перевіряє готовність Gateway, Plugin, профілю, браузера і вкладки.
- `browser` приймає:
  - `profile` для вибору іменованого профілю браузера (openclaw, chrome або remote CDP).
  - `target` (`sandbox` | `host` | `node`) для вибору місця, де розташований браузер.
  - У sandboxed-сесіях `target: "host"` вимагає `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Якщо `target` не вказано: sandboxed-сесії типово використовують `sandbox`, несandbox-сесії — `host`.
  - Якщо підключено Node із підтримкою браузера, інструмент може автоматично маршрутизуватися до нього, якщо ви явно не зафіксуєте `target="host"` або `target="node"`.

Це зберігає детермінованість агента та допомагає уникати крихких селекторів.

## Пов’язане

- [Огляд інструментів](/uk/tools) — усі доступні інструменти агента
- [Пісочниця](/uk/gateway/sandboxing) — керування браузером у sandboxed-середовищах
- [Безпека](/uk/gateway/security) — ризики керування браузером і посилення захисту
