---
read_when:
    - Додавання автоматизації браузера під керуванням агента
    - Налагодження, чому openclaw втручається у ваш власний Chrome
    - Реалізація налаштувань браузера та життєвого циклу в застосунку macOS
summary: Інтегрована служба керування браузером + команди дій
title: Браузер (керований OpenClaw)
x-i18n:
    generated_at: "2026-04-19T09:45:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: dac051a4e963545af045f97e2222777595c1a0865170dcc15407932f21703fd0
    source_path: tools/browser.md
    workflow: 15
---

# Браузер (керований openclaw)

OpenClaw може запускати **окремий профіль Chrome/Brave/Edge/Chromium**, яким керує агент.
Він ізольований від вашого особистого браузера та керується через невеликий локальний
сервіс керування всередині Gateway (лише loopback).

Погляд для початківців:

- Думайте про це як про **окремий браузер лише для агента**.
- Профіль `openclaw` **не** торкається профілю вашого особистого браузера.
- Агент може **відкривати вкладки, читати сторінки, натискати та вводити текст** у безпечному середовищі.
- Вбудований профіль `user` під’єднується до вашої справжньої сесії Chrome із входом через Chrome MCP.

## Що ви отримуєте

- Окремий профіль браузера з назвою **openclaw** (помаранчевий акцент за замовчуванням).
- Детерміноване керування вкладками (перелік/відкриття/фокус/закриття).
- Дії агента (натискання/введення/перетягування/вибір), знімки стану, скриншоти, PDF.
- Необов’язкова підтримка кількох профілів (`openclaw`, `work`, `remote`, ...).

Цей браузер **не** є вашим щоденним основним браузером. Це безпечне, ізольоване середовище для
автоматизації та перевірки агентом.

## Швидкий старт

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Якщо ви отримуєте “Browser disabled”, увімкніть його в конфігурації (див. нижче) і перезапустіть
Gateway.

Якщо `openclaw browser` повністю відсутній або агент каже, що інструмент браузера
недоступний, перейдіть до [Відсутня команда або інструмент browser](/uk/tools/browser#missing-browser-command-or-tool).

## Керування Plugin

Типовий інструмент `browser` тепер є вбудованим Plugin, який постачається
увімкненим за замовчуванням. Це означає, що ви можете вимкнути або замінити його, не видаляючи решту
системи Plugin OpenClaw:

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

Вимкніть вбудований Plugin перед встановленням іншого Plugin, який надає
те саме ім’я інструмента `browser`. Типова робота браузера потребує обох умов:

- `plugins.entries.browser.enabled` не вимкнено
- `browser.enabled=true`

Якщо ви вимкнете лише Plugin, тоді вбудований CLI браузера (`openclaw browser`),
метод gateway (`browser.request`), інструмент агента та типовий сервіс керування браузером
усі зникнуть одночасно. Ваш конфіг `browser.*` залишиться незмінним, щоб
його міг повторно використати замінний Plugin.

Вбудований Plugin браузера тепер також володіє реалізацією середовища виконання браузера.
У ядрі залишаються лише спільні допоміжні засоби Plugin SDK та сумісні повторні експорти для
старих внутрішніх шляхів імпорту. На практиці це означає, що видалення або заміна пакета Plugin браузера
прибирає функціональність браузера замість того, щоб залишати другу реалізацію середовища виконання,
якою володіє ядро.

Зміни конфігурації браузера, як і раніше, потребують перезапуску Gateway, щоб вбудований Plugin
міг повторно зареєструвати свій сервіс браузера з новими налаштуваннями.

## Відсутня команда або інструмент browser

Якщо після оновлення `openclaw browser` раптово стає невідомою командою або
агент повідомляє, що інструмент браузера відсутній, найпоширеніша причина — це
обмежувальний список `plugins.allow`, у якому немає `browser`.

Приклад зламаної конфігурації:

```json5
{
  plugins: {
    allow: ["telegram"],
  },
}
```

Виправлення — додати `browser` до списку дозволених Plugin:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Важливі примітки:

- Самого `browser.enabled=true` недостатньо, якщо задано `plugins.allow`.
- Самого `plugins.entries.browser.enabled=true` також недостатньо, якщо задано `plugins.allow`.
- `tools.alsoAllow: ["browser"]` **не** завантажує вбудований Plugin браузера. Це лише коригує політику інструментів після того, як Plugin уже завантажено.
- Якщо вам не потрібен обмежувальний список дозволених Plugin, видалення `plugins.allow` також відновлює типову поведінку вбудованого браузера.

Типові симптоми:

- `openclaw browser` є невідомою командою.
- `browser.request` відсутній.
- Агент повідомляє, що інструмент браузера недоступний або відсутній.

## Профілі: `openclaw` проти `user`

- `openclaw`: керований, ізольований браузер (розширення не потрібне).
- `user`: вбудований профіль підключення Chrome MCP до вашої **справжньої сесії Chrome із входом**.

Для викликів інструмента браузера агентом:

- За замовчуванням: використовується ізольований браузер `openclaw`.
- Надавайте перевагу `profile="user"`, коли важливі наявні сесії з виконаним входом і користувач
  перебуває за комп’ютером, щоб натиснути/підтвердити будь-який запит на підключення.
- `profile` — це явне перевизначення, коли вам потрібен конкретний режим браузера.

Установіть `browser.defaultProfile: "openclaw"`, якщо хочете, щоб керований режим був типовим.

## Конфігурація

Налаштування браузера розташовані в `~/.openclaw/openclaw.json`.

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
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
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

Примітки:

- Сервіс керування браузером прив’язується до loopback на порту, похідному від `gateway.port`
  (за замовчуванням: `18791`, тобто gateway + 2).
- Якщо ви перевизначите порт Gateway (`gateway.port` або `OPENCLAW_GATEWAY_PORT`),
  похідні порти браузера змістяться, щоб залишатися в тій самій «родині».
- `cdpUrl` за замовчуванням відповідає локальному керованому порту CDP, якщо не задано.
- `remoteCdpTimeoutMs` застосовується до перевірок доступності віддаленого CDP (не-loopback).
- `remoteCdpHandshakeTimeoutMs` застосовується до перевірок доступності WebSocket-з’єднання віддаленого CDP.
- Навігація браузера/відкриття вкладки захищені від SSRF перед переходом, а після переходу виконується повторна перевірка найкращими зусиллями для фінальної `http(s)` URL-адреси.
- У суворому режимі SSRF також перевіряються виявлення/зондування віддалених кінцевих точок CDP (`cdpUrl`, включно з пошуками `/json/version`).
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` за замовчуванням вимкнено. Установлюйте `true` лише тоді, коли ви свідомо довіряєте доступу браузера до приватної мережі.
- `browser.ssrfPolicy.allowPrivateNetwork` залишається підтримуваним як застарілий псевдонім для сумісності.
- `attachOnly: true` означає «ніколи не запускати локальний браузер; лише під’єднуватися, якщо він уже запущений».
- `color` та `color` для окремого профілю тонують інтерфейс браузера, щоб ви могли бачити, який профіль активний.
- Профіль за замовчуванням — `openclaw` (окремий браузер під керуванням OpenClaw). Використовуйте `defaultProfile: "user"`, щоб вибрати браузер користувача з виконаним входом.
- Порядок авто-виявлення: системний браузер за замовчуванням, якщо він базується на Chromium; інакше Chrome → Brave → Edge → Chromium → Chrome Canary.
- Локальні профілі `openclaw` автоматично призначають `cdpPort`/`cdpUrl` — задавайте їх лише для віддаленого CDP.
- `driver: "existing-session"` використовує Chrome DevTools MCP замість сирого CDP. Не
  задавайте `cdpUrl` для цього драйвера.
- Установіть `browser.profiles.<name>.userDataDir`, коли профіль existing-session
  має підключатися до нестандартного користувацького профілю Chromium, такого як Brave або Edge.

## Використання Brave (або іншого браузера на базі Chromium)

Якщо вашим **системним браузером за замовчуванням** є браузер на базі Chromium (Chrome/Brave/Edge тощо),
OpenClaw використовує його автоматично. Установіть `browser.executablePath`, щоб перевизначити
авто-виявлення:

Приклад CLI:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
```

```json5
// macOS
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
  }
}

// Windows
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
  }
}

// Linux
{
  browser: {
    executablePath: "/usr/bin/brave-browser"
  }
}
```

## Локальне та віддалене керування

- **Локальне керування (за замовчуванням):** Gateway запускає сервіс керування loopback і може запускати локальний браузер.
- **Віддалене керування (вузол-хост):** запустіть вузол-хост на машині, де є браузер; Gateway проксуватиме до нього дії браузера.
- **Віддалений CDP:** установіть `browser.profiles.<name>.cdpUrl` (або `browser.cdpUrl`), щоб
  підключитися до віддаленого браузера на базі Chromium. У цьому випадку OpenClaw не запускатиме локальний браузер.

Поведінка під час зупинки відрізняється залежно від режиму профілю:

- локальні керовані профілі: `openclaw browser stop` зупиняє процес браузера, який
  запустив OpenClaw
- профілі лише з підключенням і профілі віддаленого CDP: `openclaw browser stop` закриває активну
  сесію керування та скидає перевизначення емуляції Playwright/CDP (viewport,
  колірну схему, локаль, часовий пояс, офлайн-режим та подібний стан), навіть
  якщо OpenClaw не запускав жодного процесу браузера

URL віддаленого CDP можуть містити автентифікацію:

- Токени запиту (наприклад, `https://provider.example?token=<token>`)
- HTTP Basic auth (наприклад, `https://user:pass@provider.example`)

OpenClaw зберігає автентифікацію під час виклику кінцевих точок `/json/*` і під час підключення
до WebSocket CDP. Віддавайте перевагу змінним середовища або менеджерам секретів для
токенів замість збереження їх у файлах конфігурації.

## Проксі браузера вузла (zero-config за замовчуванням)

Якщо ви запускаєте **вузол-хост** на машині, де є ваш браузер, OpenClaw може
автоматично маршрутизувати виклики інструмента браузера до цього вузла без будь-якої додаткової конфігурації браузера.
Це типовий шлях для віддалених gateway.

Примітки:

- Вузол-хост надає свій локальний сервер керування браузером через **proxy command**.
- Профілі беруться з власної конфігурації вузла `browser.profiles` (так само, як локально).
- `nodeHost.browserProxy.allowProfiles` є необов’язковим. Залиште його порожнім для застарілої/типової поведінки: усі налаштовані профілі залишаються доступними через проксі, включно з маршрутами створення/видалення профілів.
- Якщо ви задаєте `nodeHost.browserProxy.allowProfiles`, OpenClaw сприймає це як межу найменших привілеїв: можна звертатися лише до профілів зі списку дозволених, а маршрути створення/видалення постійних профілів блокуються на поверхні проксі.
- Вимкніть це, якщо не хочете використовувати:
  - На вузлі: `nodeHost.browserProxy.enabled=false`
  - На gateway: `gateway.nodes.browser.mode="off"`

## Browserless (хостований віддалений CDP)

[Browserless](https://browserless.io) — це хостований сервіс Chromium, який надає
URL підключення CDP через HTTPS і WebSocket. OpenClaw може використовувати будь-яку форму, але
для профілю віддаленого браузера найпростішим варіантом є прямий URL WebSocket
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
- Виберіть кінцеву точку регіону, яка відповідає вашому обліковому запису Browserless (див. їхню документацію).
- Якщо Browserless надає вам базову URL-адресу HTTPS, ви можете або перетворити її на
  `wss://` для прямого підключення CDP, або залишити URL HTTPS і дозволити OpenClaw
  виявити `/json/version`.

## Провайдери прямого WebSocket CDP

Деякі хостовані сервіси браузерів надають **пряму кінцеву точку WebSocket** замість
стандартного виявлення CDP на основі HTTP (`/json/version`). OpenClaw приймає три
форми URL CDP і автоматично вибирає правильну стратегію підключення:

- **Виявлення HTTP(S)** — `http://host[:port]` або `https://host[:port]`.
  OpenClaw викликає `/json/version`, щоб виявити URL WebSocket debugger, а потім
  підключається. Резервного переходу на WebSocket немає.
- **Прямі кінцеві точки WebSocket** — `ws://host[:port]/devtools/<kind>/<id>` або
  `wss://...` зі шляхом `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw підключається напряму через WebSocket handshake і повністю пропускає
  `/json/version`.
- **Кореневі адреси WebSocket без шляху** — `ws://host[:port]` або `wss://host[:port]` без
  шляху `/devtools/...` (наприклад, [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw спочатку пробує HTTP
  виявлення через `/json/version` (нормалізуючи схему до `http`/`https`);
  якщо виявлення повертає `webSocketDebuggerUrl`, він використовується, інакше OpenClaw
  переходить до прямого WebSocket handshake на кореневій адресі без шляху. Це охоплює
  як віддалені порти налагодження у стилі Chrome, так і провайдерів лише з WebSocket.

Звичайні `ws://host:port` / `wss://host:port` без шляху `/devtools/...`,
спрямовані на локальний екземпляр Chrome, підтримуються через резервну
схему з пріоритетом виявлення — Chrome приймає WebSocket upgrade лише на конкретному
шляху для браузера або цілі, поверненому `/json/version`, тому handshake лише на корені
завершиться невдачею.

### Browserbase

[Browserbase](https://www.browserbase.com) — це хмарна платформа для запуску
headless-браузерів із вбудованим розв’язанням CAPTCHA, stealth mode та residential
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
  з [панелі керування Overview](https://www.browserbase.com/overview).
- Замініть `<BROWSERBASE_API_KEY>` на ваш справжній API key Browserbase.
- Browserbase автоматично створює сесію браузера під час підключення WebSocket, тому
  ручний крок створення сесії не потрібен.
- Безкоштовний тариф дозволяє одну одночасну сесію та одну годину браузера на місяць.
  Обмеження платних тарифів дивіться в [pricing](https://www.browserbase.com/pricing).
- Повний довідник API,
  посібники з SDK та приклади інтеграції дивіться в [документації Browserbase](https://docs.browserbase.com).

## Безпека

Ключові ідеї:

- Керування браузером доступне лише через loopback; доступ проходить через автентифікацію Gateway або спарювання вузлів.
- Окремий loopback HTTP API браузера використовує **лише автентифікацію за спільним секретом**:
  bearer auth через токен gateway, `x-openclaw-password` або HTTP Basic auth із
  налаштованим паролем gateway.
- Заголовки ідентичності Tailscale Serve та `gateway.auth.mode: "trusted-proxy"`
  **не** автентифікують цей окремий loopback API браузера.
- Якщо керування браузером увімкнено і не налаштовано жодної автентифікації за спільним секретом, OpenClaw
  автоматично генерує `gateway.auth.token` під час запуску та зберігає його в конфігурації.
- OpenClaw **не** генерує цей токен автоматично, якщо `gateway.auth.mode` уже має значення
  `password`, `none` або `trusted-proxy`.
- Тримайте Gateway і будь-які вузли-хости у приватній мережі (Tailscale); уникайте публічного доступу.
- Розглядайте URL/токени віддаленого CDP як секрети; віддавайте перевагу змінним середовища або менеджеру секретів.

Поради щодо віддаленого CDP:

- За можливості віддавайте перевагу зашифрованим кінцевим точкам (HTTPS або WSS) і токенам із коротким строком дії.
- Уникайте вбудовування довгоживучих токенів безпосередньо у файли конфігурації.

## Профілі (кілька браузерів)

OpenClaw підтримує кілька іменованих профілів (конфігурацій маршрутизації). Профілі можуть бути такими:

- **керовані openclaw**: окремий екземпляр браузера на базі Chromium із власним каталогом користувацьких даних + портом CDP
- **віддалені**: явна URL-адреса CDP (браузер на базі Chromium працює десь в іншому місці)
- **наявна сесія**: ваш наявний профіль Chrome через автопідключення Chrome DevTools MCP

За замовчуванням:

- Профіль `openclaw` створюється автоматично, якщо його немає.
- Профіль `user` є вбудованим для підключення до наявної сесії Chrome MCP.
- Профілі наявної сесії, окрім `user`, вмикаються явно; створюйте їх за допомогою `--driver existing-session`.
- Локальні порти CDP за замовчуванням виділяються з діапазону **18800–18899**.
- Видалення профілю переміщує його локальний каталог даних до Смітника.

Усі кінцеві точки керування приймають `?profile=<name>`; CLI використовує `--browser-profile`.

## Existing-session через Chrome DevTools MCP

OpenClaw також може підключатися до запущеного профілю браузера на базі Chromium через
офіційний сервер Chrome DevTools MCP. Це повторно використовує вкладки та стан входу,
які вже відкриті в цьому профілі браузера.

Офіційні довідкові матеріали та налаштування:

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
3. Тримайте браузер запущеним і підтвердьте запит на підключення, коли OpenClaw під’єднається.

Поширені сторінки inspect:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Smoke test для живого підключення:

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
- `tabs` показує перелік уже відкритих вкладок браузера
- `snapshot` повертає refs з вибраної активної вкладки

Що перевірити, якщо підключення не працює:

- цільовий браузер на базі Chromium має версію `144+`
- у сторінці inspect цього браузера увімкнено віддалене налагодження
- браузер показав запит на згоду підключення, і ви його підтвердили
- `openclaw doctor` мігрує стару конфігурацію браузера на основі розширення і перевіряє,
  що Chrome локально встановлено для типових профілів автопідключення, але він не може
  увімкнути віддалене налагодження на боці браузера за вас

Використання агентом:

- Використовуйте `profile="user"`, коли вам потрібен стан браузера користувача з виконаним входом.
- Якщо ви використовуєте власний профіль existing-session, передайте явну назву цього профілю.
- Вибирайте цей режим лише тоді, коли користувач перебуває за комп’ютером, щоб підтвердити
  запит на підключення.
- Gateway або вузол-хост можуть запускати `npx chrome-devtools-mcp@latest --autoConnect`

Примітки:

- Цей шлях має вищий ризик, ніж ізольований профіль `openclaw`, оскільки він може
  діяти всередині вашої сесії браузера з виконаним входом.
- OpenClaw не запускає браузер для цього драйвера; він підключається лише до
  наявної сесії.
- OpenClaw тут використовує офіційний потік `--autoConnect` Chrome DevTools MCP. Якщо
  задано `userDataDir`, OpenClaw передає його далі, щоб націлитися на цей явний
  каталог користувацьких даних Chromium.
- Скріншоти existing-session підтримують захоплення сторінки та захоплення елементів через `--ref`
  зі знімків стану, але не підтримують CSS-селектори `--element`.
- Скріншоти сторінки existing-session працюють без Playwright через Chrome MCP.
  Скріншоти елементів за ref (`--ref`) там теж працюють, але `--full-page`
  не можна поєднувати з `--ref` або `--element`.
- Дії existing-session все ще обмеженіші, ніж у шляху керованого браузера:
  - `click`, `type`, `hover`, `scrollIntoView`, `drag` і `select` потребують
    snapshot refs замість CSS-селекторів
  - `click` підтримує лише ліву кнопку миші (без перевизначення кнопок або модифікаторів)
  - `type` не підтримує `slowly=true`; використовуйте `fill` або `press`
  - `press` не підтримує `delayMs`
  - `hover`, `scrollIntoView`, `drag`, `select`, `fill` і `evaluate` не
    підтримують перевизначення timeout для окремого виклику
  - `select` наразі підтримує лише одне значення
- Existing-session `wait --url` підтримує точні, підрядкові та glob-шаблони,
  як і інші драйвери браузера. `wait --load networkidle` поки не підтримується.
- Хуки завантаження файлів existing-session вимагають `ref` або `inputRef`, підтримують по одному файлу за раз і не підтримують CSS-націлювання через `element`.
- Хуки діалогів existing-session не підтримують перевизначення timeout.
- Деякі можливості все ще потребують шляху керованого браузера, зокрема пакетні
  дії, експорт PDF, перехоплення завантажень і `responsebody`.
- Existing-session є локальним для хоста. Якщо Chrome розташований на іншій машині або
  в іншому просторі імен мережі, натомість використовуйте віддалений CDP або вузол-хост.

## Гарантії ізоляції

- **Окремий каталог користувацьких даних**: ніколи не торкається профілю вашого особистого браузера.
- **Окремі порти**: уникає `9222`, щоб запобігти конфліктам із робочими процесами розробки.
- **Детерміноване керування вкладками**: націлювання на вкладки за `targetId`, а не за принципом «остання вкладка».

## Вибір браузера

Під час локального запуску OpenClaw вибирає перший доступний:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Ви можете перевизначити це за допомогою `browser.executablePath`.

Платформи:

- macOS: перевіряються `/Applications` і `~/Applications`.
- Linux: шукає `google-chrome`, `brave`, `microsoft-edge`, `chromium` тощо.
- Windows: перевіряє типові місця встановлення.

## API керування (необов’язково)

Лише для локальних інтеграцій Gateway надає невеликий loopback HTTP API:

- Стан/запуск/зупинка: `GET /`, `POST /start`, `POST /stop`
- Вкладки: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Знімок стану/скриншот: `GET /snapshot`, `POST /screenshot`
- Дії: `POST /navigate`, `POST /act`
- Хуки: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Завантаження: `POST /download`, `POST /wait/download`
- Налагодження: `GET /console`, `POST /pdf`
- Налагодження: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Мережа: `POST /response/body`
- Стан: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Стан: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Налаштування: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Усі кінцеві точки приймають `?profile=<name>`.

Якщо налаштовано автентифікацію gateway за спільним секретом, маршрути браузера HTTP також вимагають автентифікації:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` або HTTP Basic auth із цим паролем

Примітки:

- Цей окремий loopback API браузера **не** використовує trusted-proxy або
  заголовки ідентичності Tailscale Serve.
- Якщо `gateway.auth.mode` має значення `none` або `trusted-proxy`, ці loopback-маршрути браузера
  не успадковують ці режими з передаванням ідентичності; залишайте їх доступними лише через loopback.

### Контракт помилок `/act`

`POST /act` використовує структуровану відповідь про помилку для валідації на рівні маршруту та
збоїв політик:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Поточні значення `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` відсутній або не розпізнаний.
- `ACT_INVALID_REQUEST` (HTTP 400): корисне навантаження дії не пройшло нормалізацію або валідацію.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` було використано з непідтримуваним типом дії.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (або `wait --fn`) вимкнено в конфігурації.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): верхньорівневий або пакетний `targetId` конфліктує з ціллю запиту.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): дія не підтримується для профілів existing-session.

Інші збої під час виконання все ще можуть повертати `{ "error": "<message>" }` без
поля `code`.

### Вимога Playwright

Деякі можливості (`navigate`/`act`/AI snapshot/role snapshot, скриншоти елементів,
PDF) потребують Playwright. Якщо Playwright не встановлено, ці кінцеві точки повертають
зрозумілу помилку 501.

Що все ще працює без Playwright:

- ARIA snapshots
- Скріншоти сторінки для керованого браузера `openclaw`, коли доступний WebSocket
  CDP для окремої вкладки
- Скріншоти сторінки для профілів `existing-session` / Chrome MCP
- Скріншоти `existing-session` на основі ref (`--ref`) з виводу snapshot

Що все ще потребує Playwright:

- `navigate`
- `act`
- AI snapshots / role snapshots
- Скріншоти елементів за CSS-селектором (`--element`)
- Повний експорт PDF браузера

Скріншоти елементів також відхиляють `--full-page`; маршрут повертає `fullPage is
not supported for element screenshots`.

Якщо ви бачите `Playwright is not available in this gateway build`, установіть повний
пакет Playwright (не `playwright-core`) і перезапустіть gateway або перевстановіть
OpenClaw з підтримкою браузера.

#### Установлення Playwright у Docker

Якщо ваш Gateway працює в Docker, уникайте `npx playwright` (конфлікти npm override).
Натомість використовуйте вбудований CLI:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Щоб зберігати завантажені браузери, установіть `PLAYWRIGHT_BROWSERS_PATH` (наприклад,
`/home/node/.cache/ms-playwright`) і переконайтеся, що `/home/node` зберігається через
`OPENCLAW_HOME_VOLUME` або bind mount. Див. [Docker](/uk/install/docker).

## Як це працює (внутрішньо)

Потік верхнього рівня:

- Невеликий **сервер керування** приймає HTTP-запити.
- Він підключається до браузерів на базі Chromium (Chrome/Brave/Edge/Chromium) через **CDP**.
- Для розширених дій (click/type/snapshot/PDF) він використовує **Playwright** поверх
  CDP.
- Коли Playwright відсутній, доступні лише операції без Playwright.

Ця архітектура надає агенту стабільний, детермінований інтерфейс і водночас дозволяє
вам змінювати локальні/віддалені браузери та профілі.

## Короткий довідник CLI

Усі команди приймають `--browser-profile <name>` для націлювання на конкретний профіль.
Усі команди також приймають `--json` для машинозчитуваного виводу (стабільні корисні навантаження).

Базові команди:

- `openclaw browser status`
- `openclaw browser start`
- `openclaw browser stop`
- `openclaw browser tabs`
- `openclaw browser tab`
- `openclaw browser tab new`
- `openclaw browser tab select 2`
- `openclaw browser tab close 2`
- `openclaw browser open https://example.com`
- `openclaw browser focus abcd1234`
- `openclaw browser close abcd1234`

Перевірка та огляд:

- `openclaw browser screenshot`
- `openclaw browser screenshot --full-page`
- `openclaw browser screenshot --ref 12`
- `openclaw browser screenshot --ref e12`
- `openclaw browser snapshot`
- `openclaw browser snapshot --format aria --limit 200`
- `openclaw browser snapshot --interactive --compact --depth 6`
- `openclaw browser snapshot --efficient`
- `openclaw browser snapshot --labels`
- `openclaw browser snapshot --selector "#main" --interactive`
- `openclaw browser snapshot --frame "iframe#main" --interactive`
- `openclaw browser console --level error`

Примітка щодо життєвого циклу:

- Для профілів лише з підключенням і профілів віддаленого CDP `openclaw browser stop` усе ще є
  правильною командою очищення після тестів. Вона закриває активну сесію керування і
  очищає тимчасові перевизначення емуляції замість завершення базового
  браузера.
- `openclaw browser errors --clear`
- `openclaw browser requests --filter api --clear`
- `openclaw browser pdf`
- `openclaw browser responsebody "**/api" --max-chars 5000`

Дії:

- `openclaw browser navigate https://example.com`
- `openclaw browser resize 1280 720`
- `openclaw browser click 12 --double`
- `openclaw browser click e12 --double`
- `openclaw browser type 23 "hello" --submit`
- `openclaw browser press Enter`
- `openclaw browser hover 44`
- `openclaw browser scrollintoview e12`
- `openclaw browser drag 10 11`
- `openclaw browser select 9 OptionA OptionB`
- `openclaw browser download e12 report.pdf`
- `openclaw browser waitfordownload report.pdf`
- `openclaw browser upload /tmp/openclaw/uploads/file.pdf`
- `openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'`
- `openclaw browser dialog --accept`
- `openclaw browser wait --text "Done"`
- `openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"`
- `openclaw browser evaluate --fn '(el) => el.textContent' --ref 7`
- `openclaw browser highlight e12`
- `openclaw browser trace start`
- `openclaw browser trace stop`

Стан:

- `openclaw browser cookies`
- `openclaw browser cookies set session abc123 --url "https://example.com"`
- `openclaw browser cookies clear`
- `openclaw browser storage local get`
- `openclaw browser storage local set theme dark`
- `openclaw browser storage session clear`
- `openclaw browser set offline on`
- `openclaw browser set headers --headers-json '{"X-Debug":"1"}'`
- `openclaw browser set credentials user pass`
- `openclaw browser set credentials --clear`
- `openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"`
- `openclaw browser set geo --clear`
- `openclaw browser set media dark`
- `openclaw browser set timezone America/New_York`
- `openclaw browser set locale en-US`
- `openclaw browser set device "iPhone 14"`

Примітки:

- `upload` і `dialog` — це виклики **попереднього озброєння**; запускайте їх перед click/press,
  які запускають file chooser або dialog.
- Шляхи виводу download і trace обмежені тимчасовими кореневими каталогами OpenClaw:
  - traces: `/tmp/openclaw` (резервний варіант: `${os.tmpdir()}/openclaw`)
  - downloads: `/tmp/openclaw/downloads` (резервний варіант: `${os.tmpdir()}/openclaw/downloads`)
- Шляхи upload обмежені тимчасовим кореневим каталогом upload OpenClaw:
  - uploads: `/tmp/openclaw/uploads` (резервний варіант: `${os.tmpdir()}/openclaw/uploads`)
- `upload` також може напряму задавати file inputs через `--input-ref` або `--element`.
- `snapshot`:
  - `--format ai` (типово, коли встановлено Playwright): повертає AI snapshot із числовими refs (`aria-ref="<n>"`).
  - `--format aria`: повертає дерево accessibility (без refs; лише для огляду).
  - `--efficient` (або `--mode efficient`): компактний preset role snapshot (interactive + compact + depth + менший maxChars).
  - Типове значення конфігурації (лише для tool/CLI): установіть `browser.snapshotDefaults.mode: "efficient"`, щоб використовувати efficient snapshots, коли викликаюча сторона не передає режим (див. [Конфігурація Gateway](/uk/gateway/configuration-reference#browser)).
  - Параметри role snapshot (`--interactive`, `--compact`, `--depth`, `--selector`) примусово використовують snapshot на основі ролей із refs на кшталт `ref=e12`.
  - `--frame "<iframe selector>"` обмежує role snapshots певним iframe (у парі з role refs на кшталт `e12`).
  - `--interactive` виводить плоский, простий для вибору список інтерактивних елементів (найкраще для виконання дій).
  - `--labels` додає скриншот лише viewport із накладеними мітками ref (друкує `MEDIA:<path>`).
- `click`/`type`/тощо потребують `ref` із `snapshot` (або числовий `12`, або role ref `e12`).
  CSS-селектори навмисно не підтримуються для дій.

## Snapshots і refs

OpenClaw підтримує два стилі “snapshot”:

- **AI snapshot (числові refs)**: `openclaw browser snapshot` (типово; `--format ai`)
  - Вивід: текстовий snapshot, який містить числові refs.
  - Дії: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Внутрішньо ref визначається через Playwright `aria-ref`.

- **Role snapshot (role refs на кшталт `e12`)**: `openclaw browser snapshot --interactive` (або `--compact`, `--depth`, `--selector`, `--frame`)
  - Вивід: список/дерево на основі ролей із `[ref=e12]` (і необов’язково `[nth=1]`).
  - Дії: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Внутрішньо ref визначається через `getByRole(...)` (плюс `nth()` для дублікатів).
  - Додайте `--labels`, щоб включити скриншот viewport із накладеними мітками `e12`.

Поведінка ref:

- Refs **не є стабільними між переходами**; якщо щось не спрацювало, знову запустіть `snapshot` і використайте новий ref.
- Якщо role snapshot було зроблено з `--frame`, role refs обмежуються цим iframe до наступного role snapshot.

## Розширені можливості wait

Ви можете чекати не лише час/текст:

- Очікування URL (glob-патерни підтримуються Playwright):
  - `openclaw browser wait --url "**/dash"`
- Очікування стану завантаження:
  - `openclaw browser wait --load networkidle`
- Очікування JS-предиката:
  - `openclaw browser wait --fn "window.ready===true"`
- Очікування, поки селектор стане видимим:
  - `openclaw browser wait "#main"`

Їх можна комбінувати:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Робочі процеси налагодження

Коли дія завершується помилкою (наприклад, “not visible”, “strict mode violation”, “covered”):

1. `openclaw browser snapshot --interactive`
2. Використайте `click <ref>` / `type <ref>` (надавайте перевагу role refs в interactive mode)
3. Якщо все ще не працює: `openclaw browser highlight <ref>`, щоб побачити, на що націлюється Playwright
4. Якщо сторінка поводиться дивно:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Для глибокого налагодження: запишіть trace:
   - `openclaw browser trace start`
   - відтворіть проблему
   - `openclaw browser trace stop` (друкує `TRACE:<path>`)

## Вивід JSON

`--json` призначений для скриптів і структурованих інструментів.

Приклади:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Role snapshots у JSON містять `refs` плюс невеликий блок `stats` (lines/chars/refs/interactive), щоб інструменти могли оцінювати розмір і щільність корисного навантаження.

## Параметри стану та середовища

Вони корисні для робочих процесів на кшталт “змусь сайт поводитися як X”:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'` (застарілий `set headers --json '{"X-Debug":"1"}'` також залишається підтримуваним)
- HTTP basic auth: `set credentials user pass` (або `--clear`)
- Geolocation: `set geo <lat> <lon> --origin "https://example.com"` (або `--clear`)
- Media: `set media dark|light|no-preference|none`
- Timezone / locale: `set timezone ...`, `set locale ...`
- Device / viewport:
  - `set device "iPhone 14"` (preset-пристрої Playwright)
  - `set viewport 1280 720`

## Безпека та приватність

- Профіль браузера openclaw може містити сесії з виконаним входом; ставтеся до нього як до чутливого.
- `browser act kind=evaluate` / `openclaw browser evaluate` і `wait --fn`
  виконують довільний JavaScript у контексті сторінки. Prompt injection може
  спрямувати це. Вимкніть це через `browser.evaluateEnabled=false`, якщо воно вам не потрібне.
- Про входи та примітки щодо anti-bot (X/Twitter тощо) див. [Вхід у браузері + публікація в X/Twitter](/uk/tools/browser-login).
- Тримайте Gateway/вузол-хост у приватному доступі (лише loopback або tailnet).
- Кінцеві точки віддаленого CDP мають великі можливості; тунелюйте й захищайте їх.

Приклад суворого режиму (типово блокує приватні/внутрішні адреси призначення):

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

## Усунення несправностей

Для проблем, специфічних для Linux (особливо snap Chromium), див.
[Усунення несправностей браузера](/uk/tools/browser-linux-troubleshooting).

Для конфігурацій із розділеними хостами WSL2 Gateway + Windows Chrome див.
[WSL2 + Windows + усунення несправностей віддаленого Chrome CDP](/uk/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Помилка запуску CDP проти блокування SSRF під час навігації

Це різні класи помилок, і вони вказують на різні шляхи коду.

- **Помилка запуску CDP або готовності** означає, що OpenClaw не може підтвердити, що площина керування браузером працює нормально.
- **Блокування SSRF під час навігації** означає, що площина керування браузером працює нормально, але ціль переходу сторінки відхиляється політикою.

Поширені приклади:

- Помилка запуску CDP або готовності:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- Блокування SSRF під час навігації:
  - потоки `open`, `navigate`, snapshot або відкриття вкладок завершуються помилкою політики браузера/мережі, тоді як `start` і `tabs` усе ще працюють

Використайте цю мінімальну послідовність, щоб розрізнити ці два випадки:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Як читати результати:

- Якщо `start` завершується помилкою `not reachable after start`, спочатку усувайте проблеми з готовністю CDP.
- Якщо `start` успішний, але `tabs` завершується помилкою, площина керування все ще нездорова. Розглядайте це як проблему досяжності CDP, а не проблему навігації сторінкою.
- Якщо `start` і `tabs` успішні, але `open` або `navigate` завершується помилкою, тоді площина керування браузером працює, а збій пов’язаний із політикою навігації або цільовою сторінкою.
- Якщо `start`, `tabs` і `open` усі успішні, базовий шлях керування керованим браузером працює нормально.

Важливі деталі поведінки:

- Конфігурація браузера за замовчуванням використовує fail-closed об’єкт політики SSRF, навіть якщо ви не налаштовуєте `browser.ssrfPolicy`.
- Для локального loopback керованого профілю `openclaw` перевірки стану CDP навмисно пропускають перевірку досяжності SSRF браузера для власної локальної площини керування OpenClaw.
- Захист навігації є окремим. Успішний результат `start` або `tabs` не означає, що пізніша ціль `open` або `navigate` буде дозволена.

Рекомендації з безпеки:

- **Не** послаблюйте політику SSRF браузера за замовчуванням.
- Віддавайте перевагу вузьким виняткам для хостів, таким як `hostnameAllowlist` або `allowedHostnames`, замість широкого доступу до приватної мережі.
- Використовуйте `dangerouslyAllowPrivateNetwork: true` лише в навмисно довірених середовищах, де доступ браузера до приватної мережі потрібен і перевірений.

Приклад: навігацію заблоковано, площина керування працює

- `start` успішний
- `tabs` успішний
- `open http://internal.example` завершується помилкою

Зазвичай це означає, що запуск браузера працює нормально, а ціль навігації потребує перегляду політики.

Приклад: запуск заблоковано до того, як навігація стає важливою

- `start` завершується помилкою `not reachable after start`
- `tabs` також завершується помилкою або не може виконатися

Це вказує на запуск браузера або досяжність CDP, а не на проблему зі списком дозволених URL сторінки.

## Інструменти агента + як працює керування

Агент отримує **один інструмент** для автоматизації браузера:

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Як це зіставляється:

- `browser snapshot` повертає стабільне дерево UI (AI або ARIA).
- `browser act` використовує ID `ref` зі snapshot для click/type/drag/select.
- `browser screenshot` захоплює пікселі (усю сторінку або елемент).
- `browser` приймає:
  - `profile` для вибору іменованого профілю браузера (openclaw, chrome або remote CDP).
  - `target` (`sandbox` | `host` | `node`) для вибору, де знаходиться браузер.
  - У sandboxed-сеансах `target: "host"` вимагає `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Якщо `target` не вказано: sandboxed-сеанси за замовчуванням використовують `sandbox`, а не-sandbox-сеанси — `host`.
  - Якщо підключено вузол із підтримкою браузера, інструмент може автоматично маршрутизуватися до нього, якщо ви явно не зафіксуєте `target="host"` або `target="node"`.

Це зберігає детермінованість агента й уникає крихких селекторів.

## Пов’язане

- [Огляд інструментів](/uk/tools) — усі доступні інструменти агента
- [Ізоляція](/uk/gateway/sandboxing) — керування браузером в ізольованих середовищах
- [Безпека](/uk/gateway/security) — ризики керування браузером і посилення захисту
