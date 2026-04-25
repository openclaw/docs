---
read_when:
    - Додавання browser-автоматизації під керуванням агента
    - Налагодження того, чому openclaw втручається у ваш власний Chrome
    - Реалізація налаштувань browser і життєвого циклу в застосунку macOS
summary: Інтегрований сервіс керування browser + команди дій
title: Browser (керований OpenClaw)
x-i18n:
    generated_at: "2026-04-25T05:59:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: e150084059ae485cfb83ef70fd9d5d3ca46c5bd42431df3667857192009ec14c
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw може запускати **окремий профіль Chrome/Brave/Edge/Chromium**, яким керує агент.
Він ізольований від вашого особистого браузера й керується через невеликий локальний
сервіс керування всередині Gateway (лише loopback).

Погляд для початківців:

- Думайте про це як про **окремий браузер лише для агента**.
- Профіль `openclaw` **не** зачіпає ваш особистий профіль браузера.
- Агент може **відкривати вкладки, читати сторінки, натискати й вводити текст** у безпечному середовищі.
- Вбудований профіль `user` під’єднується до вашої реальної сесії Chrome із входом через Chrome MCP.

## Що ви отримуєте

- Окремий профіль браузера з назвою **openclaw** (типово з помаранчевим акцентом).
- Детерміноване керування вкладками (список/відкриття/фокус/закриття).
- Дії агента (натискання/введення/перетягування/вибір), snapshots, screenshots, PDFs.
- Вбудований Skills `browser-automation`, який навчає агентів циклу відновлення snapshot,
  stable-tab, stale-ref і manual-blocker, коли browser Plugin увімкнено.
- Необов’язкова підтримка кількох профілів (`openclaw`, `work`, `remote`, ...).

Цей browser **не** є вашим щоденним браузером. Це безпечна, ізольована поверхня для
автоматизації та перевірки агентом.

## Швидкий старт

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Якщо ви отримуєте «Browser disabled», увімкніть його в конфігурації (див. нижче) і перезапустіть
Gateway.

Якщо `openclaw browser` взагалі відсутній або агент каже, що browser tool
недоступний, перейдіть до [Відсутня команда або інструмент browser](/uk/tools/browser#missing-browser-command-or-tool).

## Керування Plugin

Типовий інструмент `browser` — це вбудований Plugin. Вимкніть його, щоб замінити іншим Plugin, який реєструє той самий інструмент `browser`:

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

Типові значення потребують і `plugins.entries.browser.enabled`, **і** `browser.enabled=true`. Вимкнення лише Plugin прибирає CLI `openclaw browser`, gateway-метод `browser.request`, інструмент агента та сервіс керування як єдине ціле; ваша конфігурація `browser.*` залишається недоторканою для заміни.

Зміни конфігурації Browser потребують перезапуску Gateway, щоб Plugin міг повторно зареєструвати свій сервіс.

## Вказівки для агента

Browser Plugin постачається з двома рівнями вказівок для агента:

- Опис інструмента `browser` містить компактний завжди активний контракт: оберіть
  правильний профіль, тримайте refs в межах тієї самої вкладки, використовуйте `tabId`/мітки для
  націлювання на вкладки та завантажуйте browser skill для багатоетапної роботи.
- Вбудований Skills `browser-automation` містить довший операційний цикл:
  спочатку перевіряйте status/tabs, позначайте вкладки завдання, робіть snapshot перед дією,
  повторно робіть snapshot після змін UI, один раз відновлюйте stale refs і повідомляйте
  про блокування входом/2FA/captcha або camera/microphone як про ручну дію, а не вгадуйте.

Skills, вбудовані в Plugin, перелічуються серед доступних Skills агента, коли
Plugin увімкнено. Повні інструкції Skills завантажуються за потреби, тож звичайні
ходи не несуть повної вартості токенів.

## Відсутня команда або інструмент browser

Якщо після оновлення `openclaw browser` невідомий, відсутній `browser.request` або агент повідомляє, що browser tool недоступний, зазвичай причиною є список `plugins.allow`, у якому немає `browser`. Додайте його:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true` і `tools.alsoAllow: ["browser"]` не замінюють членство в allowlist — allowlist керує завантаженням Plugin, а політика інструментів починає працювати лише після завантаження. Повне видалення `plugins.allow` також відновлює типову поведінку.

## Профілі: `openclaw` vs `user`

- `openclaw`: керований, ізольований browser (розширення не потрібне).
- `user`: вбудований профіль підключення Chrome MCP до вашої **реальної сесії Chrome**
  з уже виконаним входом.

Для викликів інструмента browser агентом:

- Типово: використовуйте ізольований browser `openclaw`.
- Віддавайте перевагу `profile="user"`, коли важливі вже активні сесії з входом і користувач
  перебуває за комп’ютером, щоб натиснути/схвалити будь-який запит на підключення.
- `profile` — це явне перевизначення, коли вам потрібен конкретний режим браузера.

Встановіть `browser.defaultProfile: "openclaw"`, якщо хочете типово використовувати керований режим.

## Конфігурація

Налаштування Browser зберігаються в `~/.openclaw/openclaw.json`.

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

- Сервіс керування прив’язується до loopback на порті, похідному від `gateway.port` (типово `18791` = gateway + 2). Перевизначення `gateway.port` або `OPENCLAW_GATEWAY_PORT` зміщує похідні порти в тій самій сім’ї.
- Локальні профілі `openclaw` автоматично призначають `cdpPort`/`cdpUrl`; задавайте їх лише для віддаленого CDP. Якщо `cdpUrl` не задано, типово використовується керований локальний порт CDP.
- `remoteCdpTimeoutMs` застосовується до перевірок досяжності HTTP віддаленого (не loopback) CDP; `remoteCdpHandshakeTimeoutMs` застосовується до рукостискань WebSocket віддаленого CDP.
- `tabCleanup` — це best-effort очищення вкладок, відкритих сесіями browser основного агента. Очищення життєвого циклу subagent, Cron і ACP все одно закриває їхні явно відстежувані вкладки в кінці сесії; основні сесії зберігають активні вкладки придатними до повторного використання, а потім у фоновому режимі закривають неактивні або зайві відстежувані вкладки.

</Accordion>

<Accordion title="Політика SSRF">

- Навігація browser і open-tab захищені SSRF-перевіркою до навігації та best-effort повторно перевіряються на фінальному `http(s)` URL після неї.
- У суворому режимі SSRF також перевіряються виявлення віддаленого endpoint CDP та probe `/json/version` (`cdpUrl`).
- Змінні середовища gateway/provider `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` і `NO_PROXY` не проксіюють автоматично browser, керований OpenClaw. Керований Chrome типово запускається напряму, щоб налаштування проксі провайдера не послаблювали SSRF-перевірки browser.
- Щоб проксіювати сам керований browser, передайте явні прапори проксі Chrome через `browser.extraArgs`, наприклад `--proxy-server=...` або `--proxy-pac-url=...`. Суворий режим SSRF блокує явну маршрутизацію browser через проксі, якщо доступ browser до приватної мережі не був навмисно ввімкнений.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` типово вимкнено; вмикайте лише тоді, коли доступ browser до приватної мережі є навмисно довіреним.
- `browser.ssrfPolicy.allowPrivateNetwork` і далі підтримується як застарілий псевдонім.

</Accordion>

<Accordion title="Поведінка профілю">

- `attachOnly: true` означає ніколи не запускати локальний browser; лише під’єднуватися, якщо він уже працює.
- `headless` можна задавати глобально або для кожного локального керованого профілю. Значення для профілю перевизначають `browser.headless`, тож один локально запущений профіль може залишатися headless, тоді як інший — видимим.
- `executablePath` можна задавати глобально або для кожного локального керованого профілю. Значення для профілю перевизначають `browser.executablePath`, тож різні керовані профілі можуть запускати різні браузери на основі Chromium.
- `color` (верхній рівень і для кожного профілю) тонує UI браузера, щоб ви могли бачити, який профіль активний.
- Типовий профіль — `openclaw` (керований окремий). Використовуйте `defaultProfile: "user"`, щоб типово перейти на browser користувача з активним входом.
- Порядок автовизначення: системний типовий браузер, якщо він на базі Chromium; інакше Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` використовує Chrome DevTools MCP замість сирого CDP. Не задавайте `cdpUrl` для цього драйвера.
- Встановіть `browser.profiles.<name>.userDataDir`, коли профіль existing-session має під’єднуватися до нетипового профілю користувача Chromium (Brave, Edge тощо).

</Accordion>

</AccordionGroup>

## Використання Brave (або іншого браузера на базі Chromium)

Якщо вашим **системним типовим** браузером є браузер на базі Chromium (Chrome/Brave/Edge тощо),
OpenClaw використовує його автоматично. Встановіть `browser.executablePath`, щоб перевизначити
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

`executablePath` для профілю впливає лише на локальні керовані профілі, які запускає OpenClaw.
Профілі `existing-session` натомість під’єднуються до вже запущеного браузера,
а профілі віддаленого CDP використовують браузер за `cdpUrl`.

## Локальне та віддалене керування

- **Локальне керування (типово):** Gateway запускає loopback-сервіс керування і може запускати локальний browser.
- **Віддалене керування (host Node):** запустіть host Node на машині, де є browser; Gateway проксіює до нього дії browser.
- **Віддалений CDP:** встановіть `browser.profiles.<name>.cdpUrl` (або `browser.cdpUrl`), щоб
  під’єднатися до віддаленого браузера на базі Chromium. У цьому випадку OpenClaw не запускатиме локальний browser.
- `headless` впливає лише на локальні керовані профілі, які запускає OpenClaw. Він не перезапускає й не змінює browser existing-session або віддалений CDP.
- `executablePath` підпорядковується тому самому правилу локального керованого профілю. Його зміна для
  активного локального керованого профілю позначає профіль для перезапуску/узгодження, щоб
  наступний запуск використовував новий бінарний файл.

Поведінка зупинки відрізняється залежно від режиму профілю:

- локальні керовані профілі: `openclaw browser stop` зупиняє процес browser, який
  запустив OpenClaw
- профілі attach-only і віддаленого CDP: `openclaw browser stop` закриває активну
  сесію керування та скидає перевизначення емуляції Playwright/CDP (viewport,
  color scheme, locale, timezone, offline mode та подібний стан), навіть
  якщо OpenClaw не запускав жодного процесу browser

URL віддаленого CDP можуть містити auth:

- Query-токени (наприклад, `https://provider.example?token=<token>`)
- HTTP Basic auth (наприклад, `https://user:pass@provider.example`)

OpenClaw зберігає auth під час викликів endpoints `/json/*` і під час підключення
до WebSocket CDP. Для токенів краще використовувати змінні середовища або менеджери секретів,
а не зберігати їх у файлах конфігурації.

## Проксі browser для Node (нульова конфігурація за замовчуванням)

Якщо ви запускаєте **host Node** на машині, де є ваш browser, OpenClaw може
автоматично маршрутизувати виклики browser tool до цього node без додаткової конфігурації browser.
Це типовий шлях для віддалених Gateway.

Примітки:

- Host Node надає свій локальний сервер керування browser через **proxy command**.
- Профілі беруться з власної конфігурації `browser.profiles` node (так само, як локально).
- `nodeHost.browserProxy.allowProfiles` є необов’язковим. Залиште його порожнім для застарілої/типової поведінки: усі налаштовані профілі залишаються доступними через proxy, включно з маршрутами створення/видалення профілів.
- Якщо ви задаєте `nodeHost.browserProxy.allowProfiles`, OpenClaw розглядає це як межу найменших привілеїв: можна націлюватися лише на профілі з allowlist, а маршрути створення/видалення постійних профілів блокуються на поверхні proxy.
- Вимкнення, якщо це не потрібно:
  - На node: `nodeHost.browserProxy.enabled=false`
  - На gateway: `gateway.nodes.browser.mode="off"`

## Browserless (хостингований віддалений CDP)

[Browserless](https://browserless.io) — це хостингований сервіс Chromium, який надає
URL підключення CDP через HTTPS і WebSocket. OpenClaw може використовувати будь-яку форму, але
для профілю віддаленого browser найпростішим варіантом є прямий URL WebSocket
з документації підключення Browserless.

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

- Замініть `<BROWSERLESS_API_KEY>` на свій справжній токен Browserless.
- Оберіть endpoint регіону, який відповідає вашому обліковому запису Browserless (див. їхню документацію).
- Якщо Browserless надає вам базовий URL HTTPS, ви можете або перетворити його на
  `wss://` для прямого підключення CDP, або залишити URL HTTPS і дозволити OpenClaw
  виявити `/json/version`.

## Прямі WebSocket-провайдери CDP

Деякі хостинговані сервіси browser надають **прямий endpoint WebSocket** замість
стандартного виявлення CDP на основі HTTP (`/json/version`). OpenClaw приймає три
форми URL CDP й автоматично вибирає правильну стратегію підключення:

- **Виявлення через HTTP(S)** — `http://host[:port]` або `https://host[:port]`.
  OpenClaw викликає `/json/version`, щоб виявити URL відладчика WebSocket, а потім
  підключається. Резервного переходу на WebSocket немає.
- **Прямі endpoints WebSocket** — `ws://host[:port]/devtools/<kind>/<id>` або
  `wss://...` зі шляхом `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw підключається напряму через рукостискання WebSocket і повністю пропускає
  `/json/version`.
- **Кореневі URL WebSocket без шляху** — `ws://host[:port]` або `wss://host[:port]` без
  шляху `/devtools/...` (наприклад, [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw спочатку намагається виконати HTTP
  виявлення `/json/version` (нормалізуючи схему до `http`/`https`);
  якщо виявлення повертає `webSocketDebuggerUrl`, він використовується, інакше OpenClaw
  резервно переходить до прямого рукостискання WebSocket на порожньому корені. Це дозволяє
  підключатися і до порожнього `ws://`, спрямованого на локальний Chrome, оскільки Chrome приймає
  оновлення до WebSocket лише на конкретному шляху для цілі, отриманому з
  `/json/version`.

### Browserbase

[Browserbase](https://www.browserbase.com) — це хмарна платформа для запуску
headless-браузерів із вбудованим розв’язанням CAPTCHA, stealth mode і residential
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
  з [Overview dashboard](https://www.browserbase.com/overview).
- Замініть `<BROWSERBASE_API_KEY>` на свій справжній API key Browserbase.
- Browserbase автоматично створює сесію browser під час підключення WebSocket, тому
  окремий крок ручного створення сесії не потрібен.
- Безкоштовний тариф дозволяє одну одночасну сесію та одну browser-годину на місяць.
  Ліміти платних планів див. у [pricing](https://www.browserbase.com/pricing).
- Повний довідник API, керівництва по SDK та приклади інтеграції див. у [документації Browserbase](https://docs.browserbase.com).

## Безпека

Ключові ідеї:

- Керування browser доступне лише через loopback; доступ проходить через auth Gateway або pairing node.
- Окремий loopback HTTP API browser використовує **лише автентифікацію спільним секретом**:
  bearer auth через токен gateway, `x-openclaw-password` або HTTP Basic auth із
  налаштованим паролем gateway.
- Заголовки ідентичності Tailscale Serve і `gateway.auth.mode: "trusted-proxy"`
  **не** автентифікують цей окремий loopback API browser.
- Якщо керування browser увімкнено, а auth зі спільним секретом не налаштовано, OpenClaw
  автоматично генерує `gateway.auth.token` під час запуску й зберігає його в конфігурації.
- OpenClaw **не** генерує цей токен автоматично, якщо `gateway.auth.mode` вже має значення
  `password`, `none` або `trusted-proxy`.
- Тримайте Gateway і будь-які host Node у приватній мережі (Tailscale); уникайте публічної доступності.
- Розглядайте URL/токени віддаленого CDP як секрети; віддавайте перевагу змінним середовища або менеджеру секретів.

Поради для віддаленого CDP:

- Віддавайте перевагу зашифрованим endpoints (HTTPS або WSS) і короткоживучим токенам, де це можливо.
- Уникайте вбудовування довгоживучих токенів безпосередньо у файли конфігурації.

## Профілі (кілька браузерів)

OpenClaw підтримує кілька іменованих профілів (конфігурацій маршрутизації). Профілі можуть бути:

- **керовані openclaw**: окремий екземпляр браузера на базі Chromium із власним каталогом даних користувача + портом CDP
- **віддалені**: явний URL CDP (браузер на базі Chromium працює деінде)
- **наявна сесія**: ваш наявний профіль Chrome через автопідключення Chrome DevTools MCP

Типові значення:

- Профіль `openclaw` автоматично створюється, якщо його немає.
- Профіль `user` вбудований для підключення existing-session через Chrome MCP.
- Профілі existing-session, окрім `user`, вмикаються явно; створюйте їх через `--driver existing-session`.
- Локальні порти CDP типово виділяються з діапазону **18800–18899**.
- Видалення профілю переміщує його локальний каталог даних до кошика.

Усі endpoints керування приймають `?profile=<name>`; CLI використовує `--browser-profile`.

## Наявна сесія через Chrome DevTools MCP

OpenClaw також може підключатися до запущеного профілю browser на базі Chromium через
офіційний сервер Chrome DevTools MCP. Це повторно використовує вкладки й стан входу,
які вже відкриті в цьому профілі browser.

Офіційні довідкові матеріали й інструкції з налаштування:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Вбудований профіль:

- `user`

Необов’язково: створіть власний профіль existing-session, якщо хочете
іншу назву, колір або каталог даних browser.

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

Потім у відповідному browser:

1. Відкрийте сторінку inspect цього browser для remote debugging.
2. Увімкніть remote debugging.
3. Залиште browser запущеним і схваліть запит на підключення, коли OpenClaw під’єднається.

Поширені inspect-сторінки:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Smoke-тест живого підключення:

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
- `tabs` перелічує ваші вже відкриті вкладки browser
- `snapshot` повертає refs із вибраної живої вкладки

Що перевірити, якщо підключення не працює:

- цільовий browser на базі Chromium має версію `144+`
- remote debugging увімкнено на inspect-сторінці цього browser
- browser показав запит на згоду на підключення, і ви його схвалили
- `openclaw doctor` мігрує стару конфігурацію browser на основі розширення і перевіряє,
  що Chrome локально встановлено для типових профілів автопідключення, але він не може
  увімкнути remote debugging у самому browser замість вас

Використання агентом:

- Використовуйте `profile="user"`, коли потрібен стан browser користувача з активним входом.
- Якщо ви використовуєте власний профіль existing-session, передавайте його явну назву.
- Обирайте цей режим лише тоді, коли користувач перебуває за комп’ютером, щоб схвалити
  запит на підключення.
- Gateway або host Node може запускати `npx chrome-devtools-mcp@latest --autoConnect`

Примітки:

- Цей шлях ризикованіший за ізольований профіль `openclaw`, оскільки він може
  діяти у вашій browser-сесії з активним входом.
- OpenClaw не запускає browser для цього драйвера; він лише підключається.
- Тут OpenClaw використовує офіційний потік Chrome DevTools MCP `--autoConnect`. Якщо
  встановлено `userDataDir`, його буде передано далі для націлювання на цей каталог даних користувача.
- Existing-session може підключатися на вибраному host або через підключений
  browser Node. Якщо Chrome працює деінде і browser Node не підключено, використовуйте
  віддалений CDP або host Node.

<Accordion title="Обмеження можливостей existing-session">

Порівняно з керованим профілем `openclaw`, драйвери existing-session мають більше обмежень:

- **Знімки екрана** — працюють захоплення сторінки та захоплення елементів через `--ref`; CSS-селектори `--element` не працюють. `--full-page` не можна поєднувати з `--ref` або `--element`. Для знімків екрана сторінки чи елементів на основі ref Playwright не потрібен.
- **Дії** — `click`, `type`, `hover`, `scrollIntoView`, `drag` і `select` потребують snapshot refs (без CSS-селекторів). `click` працює лише для лівої кнопки миші. `type` не підтримує `slowly=true`; використовуйте `fill` або `press`. `press` не підтримує `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` і `evaluate` не підтримують тайм-аути для окремого виклику. `select` приймає одне значення.
- **Wait / upload / dialog** — `wait --url` підтримує точні збіги, підрядки та glob-шаблони; `wait --load networkidle` не підтримується. Хуки завантаження потребують `ref` або `inputRef`, по одному файлу за раз, без CSS `element`. Хуки діалогів не підтримують перевизначення timeout.
- **Функції лише для керованого режиму** — пакетні дії, експорт PDF, перехоплення завантажень і `responsebody` як і раніше потребують шляху керованого browser.

</Accordion>

## Гарантії ізоляції

- **Окремий каталог даних користувача**: ніколи не торкається вашого особистого профілю browser.
- **Окремі порти**: уникає `9222`, щоб не створювати конфліктів із робочими процесами розробки.
- **Детерміноване керування вкладками**: `tabs` повертає спочатку `suggestedTargetId`, потім
  стабільні дескриптори `tabId`, такі як `t1`, необов’язкові мітки та сирий `targetId`.
  Агенти мають повторно використовувати `suggestedTargetId`; сирі id залишаються доступними для
  налагодження та сумісності.

## Вибір browser

Під час локального запуску OpenClaw вибирає перший доступний browser:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Ви можете перевизначити це через `browser.executablePath`.

Платформи:

- macOS: перевіряє `/Applications` і `~/Applications`.
- Linux: шукає `google-chrome`, `brave`, `microsoft-edge`, `chromium` тощо.
- Windows: перевіряє типові шляхи встановлення.

## API керування (необов’язково)

Для сценаріїв і налагодження Gateway надає невеликий **HTTP API керування, доступний лише через loopback**,
а також відповідний CLI `openclaw browser` (snapshots, refs, розширені можливості wait,
вивід JSON, сценарії налагодження). Повний довідник див. у
[API керування Browser](/uk/tools/browser-control).

## Усунення проблем

Для проблем, специфічних для Linux (особливо Chromium у snap), див.
[Усунення проблем Browser](/uk/tools/browser-linux-troubleshooting).

Для конфігурацій із розділеними host WSL2 Gateway + Windows Chrome див.
[Усунення проблем WSL2 + Windows + віддалений Chrome CDP](/uk/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Збій запуску CDP vs SSRF-блокування навігації

Це різні класи збоїв, і вони вказують на різні шляхи коду.

- **Збій запуску або готовності CDP** означає, що OpenClaw не може підтвердити справність control plane browser.
- **SSRF-блокування навігації** означає, що control plane browser справний, але ціль навігації сторінки відхилена політикою.

Поширені приклади:

- Збій запуску або готовності CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- SSRF-блокування навігації:
  - потоки `open`, `navigate`, snapshot або відкриття вкладок завершуються помилкою політики browser/мережі, тоді як `start` і `tabs` усе ще працюють

Використовуйте цю мінімальну послідовність, щоб відрізнити одне від іншого:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Як читати результати:

- Якщо `start` завершується помилкою `not reachable after start`, спочатку усувайте проблему готовності CDP.
- Якщо `start` успішний, але `tabs` завершується помилкою, control plane усе ще несправний. Розглядайте це як проблему досяжності CDP, а не проблему навігації сторінки.
- Якщо `start` і `tabs` успішні, але `open` або `navigate` завершується помилкою, control plane browser працює, а збій полягає в політиці навігації або цільовій сторінці.
- Якщо `start`, `tabs` і `open` усі успішні, базовий шлях керування керованим browser справний.

Важливі деталі поведінки:

- Конфігурація Browser типово використовує fail-closed об’єкт політики SSRF, навіть якщо ви не налаштовуєте `browser.ssrfPolicy`.
- Для локального керованого профілю loopback `openclaw` перевірки справності CDP навмисно пропускають примусову SSRF-перевірку досяжності browser для власного локального control plane OpenClaw.
- Захист навігації є окремим. Успішний результат `start` або `tabs` не означає, що пізніша ціль `open` або `navigate` дозволена.

Рекомендації з безпеки:

- **Не** послаблюйте політику SSRF browser типово.
- Віддавайте перевагу вузьким виняткам для хостів, таким як `hostnameAllowlist` або `allowedHostnames`, замість широкого доступу до приватної мережі.
- Використовуйте `dangerouslyAllowPrivateNetwork: true` лише в навмисно довірених середовищах, де доступ browser до приватної мережі потрібен і перевірений.

## Інструменти агента + як працює керування

Агент отримує **один інструмент** для автоматизації browser:

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Як це зіставляється:

- `browser snapshot` повертає стабільне дерево UI (AI або ARIA).
- `browser act` використовує `ref` ID зі snapshot для click/type/drag/select.
- `browser screenshot` захоплює пікселі (вся сторінка, елемент або позначені refs).
- `browser doctor` перевіряє готовність Gateway, Plugin, профілю, browser і вкладки.
- `browser` приймає:
  - `profile`, щоб вибрати іменований профіль browser (openclaw, chrome або віддалений CDP).
  - `target` (`sandbox` | `host` | `node`), щоб вибрати, де живе browser.
  - У sandbox-сесіях `target: "host"` потребує `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Якщо `target` пропущено: sandbox-сесії типово використовують `sandbox`, несandbox-сесії — `host`.
  - Якщо підключено node із підтримкою browser, інструмент може автоматично маршрутизуватися до нього, якщо лише ви явно не зафіксували `target="host"` або `target="node"`.

Це зберігає детермінованість агента й дозволяє уникати крихких селекторів.

## Пов’язано

- [Огляд інструментів](/uk/tools) — усі доступні інструменти агента
- [Ізоляція](/uk/gateway/sandboxing) — керування browser в ізольованих середовищах
- [Безпека](/uk/gateway/security) — ризики та зміцнення керування browser
