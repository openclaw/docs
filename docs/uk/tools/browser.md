---
read_when:
    - Додавання автоматизації браузера під керуванням агента
    - Налагодження причин, чому openclaw втручається у роботу вашого власного Chrome
    - Реалізація налаштувань Browser + життєвого циклу в застосунку macOS
summary: Інтегрований сервіс керування браузером + команди дій
title: Browser (керований OpenClaw)
x-i18n:
    generated_at: "2026-04-25T00:04:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba8f0233c787ba03b9dd9349918367b9a2ec08ef4fac2367e100aa2b42c311ff
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw може запускати **окремий профіль Chrome/Brave/Edge/Chromium**, яким керує агент.
Він ізольований від вашого особистого браузера та керується через невеликий локальний
сервіс керування всередині Gateway (лише loopback).

Пояснення для початківців:

- Думайте про це як про **окремий браузер лише для агента**.
- Профіль `openclaw` **не** торкається профілю вашого особистого браузера.
- Агент може **відкривати вкладки, читати сторінки, натискати й вводити текст** у безпечному середовищі.
- Вбудований профіль `user` під’єднується до вашого справжнього сеансу Chrome, у якому виконано вхід, через Chrome MCP.

## Що ви отримуєте

- Окремий профіль браузера з назвою **openclaw** (типово з помаранчевим акцентом).
- Детерміноване керування вкладками (список/відкрити/фокус/закрити).
- Дії агента (click/type/drag/select), знімки, скриншоти, PDF.
- Вбудований skill `browser-automation`, який навчає агентів циклу відновлення snapshot,
  stable-tab, stale-ref і manual-blocker, коли Plugin браузера увімкнено.
- Необов’язкова підтримка кількох профілів (`openclaw`, `work`, `remote`, ...).

Цей браузер — **не** ваш щоденний основний браузер. Це безпечна, ізольована поверхня для
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

Якщо `openclaw browser` узагалі відсутній або агент каже, що інструмент Browser
недоступний, перейдіть до [Відсутня команда browser або інструмент](/uk/tools/browser#missing-browser-command-or-tool).

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

Для типових налаштувань потрібні і `plugins.entries.browser.enabled`, і `browser.enabled=true`. Вимкнення лише Plugin прибирає CLI `openclaw browser`, метод gateway `browser.request`, інструмент агента та сервіс керування як єдине ціле; ваша конфігурація `browser.*` залишається недоторканою для заміни.

Зміни конфігурації Browser вимагають перезапуску Gateway, щоб Plugin міг знову зареєструвати свій сервіс.

## Вказівки для агента

Plugin браузера постачається з двома рівнями вказівок для агента:

- Опис інструмента `browser` містить компактний завжди активний контракт: вибирати
  правильний профіль, тримати ref в межах тієї самої вкладки, використовувати
  `tabId`/мітки для націлювання на вкладки та завантажувати skill браузера для багатокрокової роботи.
- Вбудований skill `browser-automation` містить довший робочий цикл:
  спочатку перевіряти статус/вкладки, позначати вкладки завдань, робити snapshot перед дією,
  повторно робити snapshot після змін UI, один раз відновлюватися після stale ref і
  повідомляти про login/2FA/captcha або блокування camera/microphone як про ручну дію, а не вгадувати.

Skills, що постачаються разом із Plugin, перелічено в доступних skills агента, коли
Plugin увімкнено. Повні інструкції skill завантажуються на вимогу, тому звичайні
ходи не оплачують повну вартість токенів.

## Відсутня команда browser або інструмент

Якщо після оновлення `openclaw browser` невідомий, `browser.request` відсутній або агент повідомляє, що інструмент browser недоступний, звичайною причиною є список `plugins.allow`, у якому немає `browser`. Додайте його:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true` і `tools.alsoAllow: ["browser"]` не замінюють членство в allowlist — allowlist керує завантаженням Plugin, а політика інструментів застосовується лише після завантаження. Повне видалення `plugins.allow` також відновлює типову поведінку.

## Профілі: `openclaw` проти `user`

- `openclaw`: керований, ізольований Browser (розширення не потрібне).
- `user`: вбудований профіль під’єднання Chrome MCP до вашого **справжнього Chrome із виконаним входом**.

Для викликів інструмента Browser агентом:

- Типово: використовуйте ізольований Browser `openclaw`.
- Надавайте перевагу `profile="user"`, коли важливі наявні сеанси з виконаним входом і користувач
  перебуває за комп’ютером, щоб натиснути/схвалити будь-який запит на під’єднання.
- `profile` — це явне перевизначення, коли вам потрібен конкретний режим браузера.

Установіть `browser.defaultProfile: "openclaw"`, якщо хочете типово використовувати керований режим.

## Конфігурація

Налаштування Browser розміщено в `~/.openclaw/openclaw.json`.

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

<AccordionGroup>

<Accordion title="Порти та доступність">

- Сервіс керування прив’язується до loopback на порту, похідному від `gateway.port` (типово `18791` = gateway + 2). Перевизначення `gateway.port` або `OPENCLAW_GATEWAY_PORT` зсуває похідні порти в тому самому сімействі.
- Локальні профілі `openclaw` автоматично призначають `cdpPort`/`cdpUrl`; задавайте їх лише для віддаленого CDP. Якщо `cdpUrl` не задано, він типово вказує на локальний керований порт CDP.
- `remoteCdpTimeoutMs` застосовується до перевірок доступності HTTP для віддаленого (не-loopback) CDP; `remoteCdpHandshakeTimeoutMs` застосовується до WebSocket-handshake віддаленого CDP.

</Accordion>

<Accordion title="Політика SSRF">

- Навігація Browser і відкриття вкладки захищені від SSRF до навігації та повторно перевіряються за найкращої можливості на фінальному URL `http(s)` після неї.
- У строгому режимі SSRF також перевіряються виявлення віддаленої кінцевої точки CDP і проби `/json/version` (`cdpUrl`).
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` типово вимкнено; вмикайте лише тоді, коли доступ Browser до приватної мережі навмисно довірений.
- `browser.ssrfPolicy.allowPrivateNetwork` і далі підтримується як застарілий псевдонім.

</Accordion>

<Accordion title="Поведінка профілів">

- `attachOnly: true` означає ніколи не запускати локальний Browser; лише під’єднуватися, якщо він уже працює.
- `color` (на верхньому рівні та для кожного профілю) підфарбовує UI браузера, щоб ви могли бачити, який профіль активний.
- Типовий профіль — `openclaw` (керований автономний). Використовуйте `defaultProfile: "user"`, щоб типово перейти на браузер користувача з виконаним входом.
- Порядок автовиявлення: системний типовий браузер, якщо він на базі Chromium; інакше Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` використовує Chrome DevTools MCP замість сирого CDP. Не задавайте `cdpUrl` для цього драйвера.
- Установіть `browser.profiles.<name>.userDataDir`, коли профіль existing-session має під’єднуватися до нетипового користувацького профілю Chromium (Brave, Edge тощо).

</Accordion>

</AccordionGroup>

## Використання Brave (або іншого браузера на базі Chromium)

Якщо вашим **системним типовим** браузером є браузер на базі Chromium (Chrome/Brave/Edge тощо),
OpenClaw використовує його автоматично. Установіть `browser.executablePath`, щоб перевизначити
автовиявлення:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
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

## Локальне та віддалене керування

- **Локальне керування (типово):** Gateway запускає loopback-сервіс керування та може запускати локальний Browser.
- **Віддалене керування (хост вузла):** запустіть хост вузла на машині, де є браузер; Gateway проксуватиме до нього дії Browser.
- **Віддалений CDP:** установіть `browser.profiles.<name>.cdpUrl` (або `browser.cdpUrl`), щоб
  під’єднатися до віддаленого браузера на базі Chromium. У цьому випадку OpenClaw не запускатиме локальний Browser.

Поведінка зупинки відрізняється залежно від режиму профілю:

- локальні керовані профілі: `openclaw browser stop` зупиняє процес браузера, який
  запустив OpenClaw
- профілі attach-only і віддалені профілі CDP: `openclaw browser stop` закриває активний
  сеанс керування та скидає перевизначення емуляції Playwright/CDP (viewport,
  колірна схема, locale, timezone, offline mode та подібний стан), навіть
  якщо OpenClaw не запускав жодного процесу браузера

Віддалені URL CDP можуть містити auth:

- токени в query (наприклад, `https://provider.example?token=<token>`)
- HTTP Basic auth (наприклад, `https://user:pass@provider.example`)

OpenClaw зберігає auth під час викликів кінцевих точок `/json/*` і під час під’єднання
до WebSocket CDP. Для токенів надавайте перевагу змінним середовища або менеджерам секретів
замість коміту їх у файли конфігурації.

## Проксі Browser вузла (типова поведінка без конфігурації)

Якщо ви запускаєте **хост вузла** на машині, де є ваш браузер, OpenClaw може
автоматично маршрутизувати виклики інструмента Browser до цього вузла без жодної додаткової конфігурації Browser.
Це типовий шлях для віддалених Gateway.

Примітки:

- Хост вузла надає свій локальний сервер керування браузером через **проксі-команду**.
- Профілі беруться з власної конфігурації `browser.profiles` вузла (так само, як локально).
- `nodeHost.browserProxy.allowProfiles` є необов’язковим. Залиште його порожнім для застарілої/типової поведінки: усі налаштовані профілі залишаються доступними через проксі, включно з маршрутами створення/видалення профілів.
- Якщо ви задаєте `nodeHost.browserProxy.allowProfiles`, OpenClaw розглядає це як межу мінімальних привілеїв: лише профілі з allowlist можуть бути ціллю, а маршрути створення/видалення постійних профілів блокуються на поверхні проксі.
- Вимкніть, якщо не хочете це використовувати:
  - На вузлі: `nodeHost.browserProxy.enabled=false`
  - На gateway: `gateway.nodes.browser.mode="off"`

## Browserless (розміщений віддалений CDP)

[Browserless](https://browserless.io) — це розміщений сервіс Chromium, який надає
URL під’єднання CDP через HTTPS і WebSocket. OpenClaw може використовувати будь-яку форму, але
для профілю віддаленого браузера найпростішим варіантом є прямий URL WebSocket
із документації Browserless щодо під’єднання.

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
- Виберіть регіональну кінцеву точку, яка відповідає вашому обліковому запису Browserless (див. їхню документацію).
- Якщо Browserless надає вам базовий URL HTTPS, ви можете або перетворити його на
  `wss://` для прямого під’єднання CDP, або залишити URL HTTPS і дозволити OpenClaw
  виявити `/json/version`.

## Прямі провайдери WebSocket CDP

Деякі розміщені сервіси браузерів надають **пряму кінцеву точку WebSocket** замість
стандартного виявлення CDP на основі HTTP (`/json/version`). OpenClaw приймає три
форми URL CDP і автоматично вибирає правильну стратегію під’єднання:

- **Виявлення HTTP(S)** — `http://host[:port]` або `https://host[:port]`.
  OpenClaw викликає `/json/version`, щоб виявити URL WebSocket debugger, а потім
  під’єднується. Fallback на WebSocket немає.
- **Прямі кінцеві точки WebSocket** — `ws://host[:port]/devtools/<kind>/<id>` або
  `wss://...` зі шляхом `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw під’єднується безпосередньо через WebSocket handshake і повністю пропускає
  `/json/version`.
- **Кореневі URL WebSocket без шляху** — `ws://host[:port]` або `wss://host[:port]` без
  шляху `/devtools/...` (наприклад, [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw спочатку пробує HTTP-виявлення
  через `/json/version` (нормалізуючи схему до `http`/`https`);
  якщо виявлення повертає `webSocketDebuggerUrl`, використовується він, інакше OpenClaw
  переходить до прямого WebSocket handshake на корені без шляху. Це дозволяє
  bare `ws://`, спрямованому на локальний Chrome, усе ж під’єднатися, оскільки Chrome приймає
  WebSocket upgrade лише на конкретному шляху для цілі з
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
  з [панелі Overview](https://www.browserbase.com/overview).
- Замініть `<BROWSERBASE_API_KEY>` на свій справжній ключ API Browserbase.
- Browserbase автоматично створює сеанс браузера під час WebSocket-під’єднання, тому
  окремий крок ручного створення сеансу не потрібен.
- Безкоштовний тариф дозволяє один одночасний сеанс і одну браузерну годину на місяць.
  Обмеження платних тарифів дивіться в [pricing](https://www.browserbase.com/pricing).
- Повний довідник API, посібники з SDK і приклади інтеграції дивіться в [документації Browserbase](https://docs.browserbase.com).

## Безпека

Ключові ідеї:

- Керування Browser доступне лише через loopback; доступ проходить через автентифікацію Gateway або pairing вузла.
- Окремий loopback HTTP API Browser використовує **лише автентифікацію через shared secret**:
  bearer auth через токен gateway, `x-openclaw-password` або HTTP Basic auth із
  налаштованим паролем gateway.
- Заголовки ідентичності Tailscale Serve і `gateway.auth.mode: "trusted-proxy"`
  **не** автентифікують цей окремий loopback API Browser.
- Якщо керування Browser увімкнено й не налаштовано жодної автентифікації через shared secret, OpenClaw
  автоматично генерує `gateway.auth.token` під час запуску та зберігає його в конфігурації.
- OpenClaw **не** генерує цей токен автоматично, якщо `gateway.auth.mode` уже має значення
  `password`, `none` або `trusted-proxy`.
- Тримайте Gateway і будь-які хости вузлів у приватній мережі (Tailscale); уникайте публічного доступу.
- Сприймайте віддалені URL/токени CDP як секрети; надавайте перевагу змінним середовища або менеджеру секретів.

Поради щодо віддаленого CDP:

- За можливості використовуйте шифровані кінцеві точки (HTTPS або WSS) і короткоживучі токени.
- Уникайте вбудовування довгоживучих токенів безпосередньо у файли конфігурації.

## Профілі (кілька браузерів)

OpenClaw підтримує кілька іменованих профілів (конфігурацій маршрутизації). Профілі можуть бути:

- **керованими OpenClaw**: окремий екземпляр браузера на базі Chromium із власним каталогом користувацьких даних і портом CDP
- **віддаленими**: явний URL CDP (браузер на базі Chromium працює деінде)
- **наявним сеансом**: ваш наявний профіль Chrome через автопід’єднання Chrome DevTools MCP

Типова поведінка:

- Профіль `openclaw` створюється автоматично, якщо його немає.
- Профіль `user` вбудований для existing-session attach через Chrome MCP.
- Профілі existing-session, окрім `user`, створюються за бажанням; створюйте їх через `--driver existing-session`.
- Локальні порти CDP типово виділяються з діапазону **18800–18899**.
- Видалення профілю переміщує його локальний каталог даних до Trash.

Усі кінцеві точки керування приймають `?profile=<name>`; CLI використовує `--browser-profile`.

## Existing-session через Chrome DevTools MCP

OpenClaw також може під’єднатися до профілю браузера на базі Chromium, що вже працює, через
офіційний сервер Chrome DevTools MCP. Це дозволяє повторно використовувати вкладки та стан входу,
які вже відкриті в цьому профілі браузера.

Офіційні довідкові матеріали та посилання для налаштування:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Вбудований профіль:

- `user`

Необов’язково: створіть власний профіль existing-session, якщо хочете
іншу назву, колір або каталог даних браузера.

Типова поведінка:

- Вбудований профіль `user` використовує автопід’єднання Chrome MCP, яке націлюється на
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
3. Залиште браузер запущеним і схваліть запит на під’єднання, коли OpenClaw під’єднається.

Поширені сторінки inspect:

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
- `snapshot` повертає ref із вибраної live-вкладки

Що перевірити, якщо під’єднання не працює:

- цільовий браузер на базі Chromium має версію `144+`
- у сторінці inspect цього браузера увімкнено віддалене налагодження
- браузер показав запит на згоду на під’єднання, і ви його схвалили
- `openclaw doctor` мігрує стару конфігурацію браузера на основі розширення й перевіряє, що
  Chrome локально встановлено для типових профілів автопід’єднання, але він не може
  увімкнути віддалене налагодження з боку браузера за вас

Використання агентом:

- Використовуйте `profile="user"`, коли потрібен стан браузера користувача з виконаним входом.
- Якщо ви використовуєте власний профіль existing-session, передавайте явну назву цього профілю.
- Вибирайте цей режим лише тоді, коли користувач перебуває за комп’ютером, щоб схвалити
  запит на під’єднання.
- Gateway або хост вузла може запускати `npx chrome-devtools-mcp@latest --autoConnect`

Примітки:

- Цей шлях є ризикованішим, ніж ізольований профіль `openclaw`, оскільки він може
  діяти всередині вашого браузера із виконаним входом.
- OpenClaw не запускає браузер для цього драйвера; він лише під’єднується.
- Тут OpenClaw використовує офіційний потік Chrome DevTools MCP `--autoConnect`. Якщо
  задано `userDataDir`, він передається далі для націлювання на цей каталог користувацьких даних.
- Existing-session може під’єднуватися на вибраному хості або через під’єднаний
  вузол Browser. Якщо Chrome працює деінде й жоден вузол Browser не під’єднано, використовуйте
  віддалений CDP або хост вузла.

<Accordion title="Обмеження можливостей existing-session">

Порівняно з керованим профілем `openclaw`, драйвери existing-session мають більше обмежень:

- **Скриншоти** — захоплення сторінки і захоплення елементів через `--ref` працюють; CSS-селектори `--element` — ні. `--full-page` не можна поєднувати з `--ref` або `--element`. Для скриншотів сторінки або елементів на основі ref Playwright не потрібен.
- **Дії** — `click`, `type`, `hover`, `scrollIntoView`, `drag` і `select` вимагають snapshot ref (без CSS-селекторів). `click` підтримує лише ліву кнопку. `type` не підтримує `slowly=true`; використовуйте `fill` або `press`. `press` не підтримує `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` і `evaluate` не підтримують тайм-аути для окремого виклику. `select` приймає одне значення.
- **Очікування / upload / dialog** — `wait --url` підтримує точний збіг, підрядок і glob-шаблони; `wait --load networkidle` не підтримується. Хуки upload вимагають `ref` або `inputRef`, по одному файлу за раз, без CSS `element`. Хуки dialog не підтримують перевизначення тайм-ауту.
- **Функції лише для керованого режиму** — пакетні дії, експорт PDF, перехоплення завантажень і `responsebody` і далі потребують шляху керованого браузера.

</Accordion>

## Гарантії ізоляції

- **Окремий каталог користувацьких даних**: ніколи не торкається профілю вашого особистого браузера.
- **Окремі порти**: уникає `9222`, щоб запобігти конфліктам із робочими процесами розробки.
- **Детерміноване керування вкладками**: `tabs` спочатку повертає `suggestedTargetId`, потім
  стабільні дескриптори `tabId`, такі як `t1`, необов’язкові мітки та сирий `targetId`.
  Агенти мають повторно використовувати `suggestedTargetId`; сирі id залишаються доступними для
  налагодження та сумісності.

## Вибір браузера

Під час локального запуску OpenClaw вибирає перший доступний браузер:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Ви можете перевизначити це через `browser.executablePath`.

Платформи:

- macOS: перевіряє `/Applications` і `~/Applications`.
- Linux: шукає `google-chrome`, `brave`, `microsoft-edge`, `chromium` тощо.
- Windows: перевіряє поширені шляхи встановлення.

## API керування (необов’язково)

Для скриптів і налагодження Gateway надає невеликий **HTTP API керування лише для loopback**
та відповідний CLI `openclaw browser` (знімки, ref, розширені можливості wait,
JSON-вивід, робочі процеси налагодження). Повний довідник дивіться в
[API керування Browser](/uk/tools/browser-control).

## Усунення несправностей

Проблеми, специфічні для Linux (особливо snap Chromium), див. у
[усуненні несправностей Browser](/uk/tools/browser-linux-troubleshooting).

Для сценаріїв із розділеними хостами WSL2 Gateway + Windows Chrome див.:
[усунення несправностей WSL2 + Windows + віддалений Chrome CDP](/uk/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Збій запуску CDP проти блокування SSRF навігації

Це різні класи збоїв, і вони вказують на різні шляхи коду.

- **Збій запуску CDP або готовності** означає, що OpenClaw не може підтвердити, що площина керування браузером справна.
- **Блокування SSRF навігації** означає, що площина керування браузером справна, але ціль переходу на сторінку відхиляється політикою.

Поширені приклади:

- Збій запуску CDP або готовності:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- Блокування SSRF навігації:
  - `open`, `navigate`, snapshot або потоки відкриття вкладок завершуються помилкою browser/network policy, тоді як `start` і `tabs` і далі працюють

Скористайтеся цією мінімальною послідовністю, щоб відрізнити одне від іншого:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Як читати результати:

- Якщо `start` завершується помилкою `not reachable after start`, спочатку усувайте проблему готовності CDP.
- Якщо `start` успішний, але `tabs` завершується помилкою, площина керування все ще несправна. Розглядайте це як проблему доступності CDP, а не навігації сторінкою.
- Якщо `start` і `tabs` успішні, але `open` або `navigate` завершується помилкою, площина керування браузером працює, а збій пов’язаний із політикою навігації або цільовою сторінкою.
- Якщо `start`, `tabs` і `open` усі успішні, базовий шлях керування керованим браузером справний.

Важливі подробиці поведінки:

- Конфігурація Browser типово використовує fail-closed об’єкт політики SSRF, навіть якщо ви не налаштовуєте `browser.ssrfPolicy`.
- Для локального керованого профілю `openclaw` на loopback перевірки справності CDP навмисно пропускають перевірку доступності SSRF Browser для власної локальної площини керування OpenClaw.
- Захист навігації є окремим. Успішний результат `start` або `tabs` не означає, що пізніша ціль `open` або `navigate` буде дозволена.

Рекомендації щодо безпеки:

- **Не** послаблюйте політику SSRF Browser типово.
- Надавайте перевагу вузьким виняткам для хостів, таким як `hostnameAllowlist` або `allowedHostnames`, замість широкого доступу до приватної мережі.
- Використовуйте `dangerouslyAllowPrivateNetwork: true` лише в навмисно довірених середовищах, де доступ Browser до приватної мережі потрібен і пройшов перевірку.

## Інструменти агента + як працює керування

Агент отримує **один інструмент** для автоматизації Browser:

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Як це зіставляється:

- `browser snapshot` повертає стабільне дерево UI (AI або ARIA).
- `browser act` використовує `ref` id зі snapshot для click/type/drag/select.
- `browser screenshot` захоплює пікселі (повна сторінка, елемент або ref із мітками).
- `browser doctor` перевіряє готовність Gateway, Plugin, профілю, браузера та вкладки.
- `browser` приймає:
  - `profile` для вибору іменованого профілю браузера (openclaw, chrome або віддалений CDP).
  - `target` (`sandbox` | `host` | `node`) для вибору місця, де працює браузер.
  - У sandbox-сеансах `target: "host"` вимагає `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Якщо `target` не вказано: sandbox-сеанси типово використовують `sandbox`, сеанси без sandbox — `host`.
  - Якщо під’єднано вузол із підтримкою Browser, інструмент може автоматично маршрутизуватися до нього, якщо ви явно не закріпите `target="host"` або `target="node"`.

Це забезпечує детерміновану роботу агента й дає змогу уникати крихких селекторів.

## Пов’язане

- [Огляд інструментів](/uk/tools) — усі доступні інструменти агента
- [Sandboxing](/uk/gateway/sandboxing) — керування Browser у sandbox-середовищах
- [Безпека](/uk/gateway/security) — ризики керування Browser і заходи захисту
