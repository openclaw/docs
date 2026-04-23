---
read_when:
    - Додавання автоматизації браузера, керованої агентом
    - Налагодження того, чому openclaw заважає роботі вашого власного Chrome
    - Реалізація налаштувань браузера та життєвого циклу в застосунку macOS
summary: Інтегрований сервіс керування браузером + команди дій
title: Браузер (керований OpenClaw)
x-i18n:
    generated_at: "2026-04-23T15:38:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc2eb4c6ee3eb85d4aa599164315a4b2355d8f6c628ee62af2e913b1d4bfc516
    source_path: tools/browser.md
    workflow: 15
---

# Браузер (керований openclaw)

OpenClaw може запускати **окремий профіль Chrome/Brave/Edge/Chromium**, яким керує агент.
Він ізольований від вашого особистого браузера та керується через невеликий локальний
сервіс керування всередині Gateway (лише loopback).

Погляд для початківців:

- Сприймайте це як **окремий браузер лише для агента**.
- Профіль `openclaw` **не** зачіпає ваш особистий профіль браузера.
- Агент може **відкривати вкладки, читати сторінки, натискати й вводити текст** у безпечному середовищі.
- Вбудований профіль `user` підключається до вашої справжньої сесії Chrome з виконаним входом через Chrome MCP.

## Що ви отримуєте

- Окремий профіль браузера з назвою **openclaw** (типово з помаранчевим акцентом).
- Детерміноване керування вкладками (перелік/відкриття/фокусування/закриття).
- Дії агента (натискання/введення/перетягування/вибір), знімки, скриншоти, PDF.
- Необов’язкова підтримка кількох профілів (`openclaw`, `work`, `remote`, ...).

Цей браузер **не** є вашим основним щоденним браузером. Це безпечна, ізольована поверхня для
автоматизації та перевірки агентом.

## Швидкий старт

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Якщо ви отримуєте “Browser disabled”, увімкніть це в конфігурації (див. нижче) і перезапустіть
Gateway.

Якщо `openclaw browser` повністю відсутня або агент каже, що інструмент браузера
недоступний, перейдіть до [Відсутня команда або інструмент браузера](/uk/tools/browser#missing-browser-command-or-tool).

## Керування Plugin

Типовий інструмент `browser` — це вбудований Plugin. Вимкніть його, щоб замінити іншим plugin, який реєструє той самий інструмент із назвою `browser`:

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

Для значень за замовчуванням потрібні і `plugins.entries.browser.enabled`, і `browser.enabled=true`. Якщо вимкнути лише plugin, це прибере CLI `openclaw browser`, gateway-метод `browser.request`, інструмент агента та сервіс керування як єдине ціле; ваша конфігурація `browser.*` залишиться недоторканою для заміни.

Зміни конфігурації браузера потребують перезапуску Gateway, щоб plugin міг повторно зареєструвати свій сервіс.

## Відсутня команда або інструмент браузера

Якщо після оновлення `openclaw browser` невідома, `browser.request` відсутній або агент повідомляє, що інструмент браузера недоступний, звичайною причиною є список `plugins.allow`, у якому немає `browser`. Додайте його:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true` і `tools.alsoAllow: ["browser"]` не замінюють наявність у списку allowlist — allowlist керує завантаженням plugin, а політика інструментів застосовується лише після завантаження. Повне видалення `plugins.allow` також відновлює типову поведінку.

## Профілі: `openclaw` проти `user`

- `openclaw`: керований, ізольований браузер (розширення не потрібне).
- `user`: вбудований профіль підключення Chrome MCP до вашої **справжньої сесії Chrome**
  з виконаним входом.

Для викликів інструмента браузера агентом:

- Типово: використовується ізольований браузер `openclaw`.
- Віддавайте перевагу `profile="user"`, коли важливі наявні сесії з виконаним входом і користувач
  перебуває за комп’ютером, щоб натиснути/підтвердити будь-який запит на підключення.
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

- Сервіс керування прив’язується до loopback на порту, похідному від `gateway.port` (типово `18791` = gateway + 2). Перевизначення `gateway.port` або `OPENCLAW_GATEWAY_PORT` зміщує похідні порти в межах тієї ж групи.
- Локальні профілі `openclaw` автоматично призначають `cdpPort`/`cdpUrl`; задавайте їх лише для віддаленого CDP. Якщо `cdpUrl` не задано, типово використовується керований локальний порт CDP.
- `remoteCdpTimeoutMs` застосовується до перевірок доступності HTTP віддаленого (не-loopback) CDP; `remoteCdpHandshakeTimeoutMs` застосовується до handshake WebSocket для віддаленого CDP.

</Accordion>

<Accordion title="Політика SSRF">

- Навігація браузера та open-tab захищені від SSRF перед переходом і повторно перевіряються в режимі best-effort за фінальною URL-адресою `http(s)` після цього.
- У строгому режимі SSRF також перевіряються виявлення віддаленої CDP endpoint і запити `/json/version` (`cdpUrl`).
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` типово вимкнено; вмикайте лише тоді, коли доступ браузера до приватної мережі є навмисно довіреним.
- `browser.ssrfPolicy.allowPrivateNetwork` і далі підтримується як застарілий псевдонім.

</Accordion>

<Accordion title="Поведінка профілю">

- `attachOnly: true` означає ніколи не запускати локальний браузер; лише підключатися, якщо він уже працює.
- `color` (верхнього рівня та для кожного профілю) забарвлює UI браузера, щоб ви могли бачити, який профіль активний.
- Типовий профіль — `openclaw` (керований автономний). Використайте `defaultProfile: "user"`, щоб перейти на браузер користувача з виконаним входом.
- Порядок автовизначення: системний типовий браузер, якщо він на основі Chromium; інакше Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` використовує Chrome DevTools MCP замість сирого CDP. Не задавайте `cdpUrl` для цього драйвера.
- Установіть `browser.profiles.<name>.userDataDir`, коли профіль existing-session має підключатися до нетипового профілю користувача Chromium (Brave, Edge тощо).

</Accordion>

</AccordionGroup>

## Використання Brave (або іншого браузера на основі Chromium)

Якщо вашим **системним типовим** браузером є браузер на основі Chromium (Chrome/Brave/Edge тощо),
OpenClaw використовує його автоматично. Установіть `browser.executablePath`, щоб перевизначити
автовизначення:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
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

## Локальне й віддалене керування

- **Локальне керування (типово):** Gateway запускає loopback-сервіс керування й може запускати локальний браузер.
- **Віддалене керування (node host):** запустіть node host на машині, де є браузер; Gateway проксуватиме до нього дії браузера.
- **Віддалений CDP:** задайте `browser.profiles.<name>.cdpUrl` (або `browser.cdpUrl`), щоб
  підключитися до віддаленого браузера на основі Chromium. У цьому випадку OpenClaw не запускатиме локальний браузер.

Поведінка зупинки відрізняється залежно від режиму профілю:

- локальні керовані профілі: `openclaw browser stop` зупиняє процес браузера, який
  запустив OpenClaw
- профілі лише для підключення та профілі з віддаленим CDP: `openclaw browser stop` закриває активну
  керувальну сесію та скидає перевизначення емуляції Playwright/CDP (viewport,
  колірну схему, локаль, часовий пояс, офлайн-режим та подібний стан), навіть
  якщо OpenClaw не запускав жодного процесу браузера

URL-адреси віддаленого CDP можуть містити автентифікацію:

- Токени в параметрах запиту (наприклад, `https://provider.example?token=<token>`)
- HTTP Basic auth (наприклад, `https://user:pass@provider.example`)

OpenClaw зберігає автентифікацію під час виклику endpoint `/json/*` і під час підключення
до WebSocket CDP. Для токенів віддавайте перевагу змінним середовища або менеджерам секретів,
а не зберіганню їх у файлах конфігурації.

## Node browser proxy (типова поведінка без конфігурації)

Якщо ви запускаєте **node host** на машині, де розташований ваш браузер, OpenClaw може
автоматично спрямовувати виклики інструмента браузера до цього вузла без будь-якої додаткової конфігурації браузера.
Це типовий шлях для віддалених gateway.

Примітки:

- Node host відкриває свій локальний сервер керування браузером через **proxy command**.
- Профілі беруться з власної конфігурації `browser.profiles` вузла (так само, як локально).
- `nodeHost.browserProxy.allowProfiles` — необов’язковий параметр. Залиште його порожнім для застарілої/типової поведінки: усі налаштовані профілі й далі доступні через proxy, включно з маршрутами створення/видалення профілів.
- Якщо ви задаєте `nodeHost.browserProxy.allowProfiles`, OpenClaw трактує це як межу найменших привілеїв: можна адресувати лише профілі з allowlist, а маршрути створення/видалення постійних профілів блокуються на поверхні proxy.
- Вимкніть це, якщо воно вам не потрібне:
  - На node: `nodeHost.browserProxy.enabled=false`
  - На gateway: `gateway.nodes.browser.mode="off"`

## Browserless (хостинговий віддалений CDP)

[Browserless](https://browserless.io) — це хостингова служба Chromium, яка надає
URL-адреси підключення CDP через HTTPS і WebSocket. OpenClaw може використовувати обидва варіанти, але
для віддаленого профілю браузера найпростішим варіантом є пряма URL-адреса WebSocket
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
- Виберіть endpoint регіону, що відповідає вашому обліковому запису Browserless (див. їхню документацію).
- Якщо Browserless надає вам базову URL-адресу HTTPS, ви можете або перетворити її на
  `wss://` для прямого підключення CDP, або залишити HTTPS URL, і тоді OpenClaw
  сам виконає виявлення `/json/version`.

## Постачальники прямого WebSocket CDP

Деякі хостингові служби браузерів надають **прямий endpoint WebSocket** замість
стандартного HTTP-виявлення CDP (`/json/version`). OpenClaw підтримує три форми
URL-адрес CDP і автоматично вибирає правильну стратегію підключення:

- **HTTP(S)-виявлення** — `http://host[:port]` або `https://host[:port]`.
  OpenClaw викликає `/json/version`, щоб виявити URL WebSocket debugger, а потім
  підключається. Резервного переходу на WebSocket немає.
- **Прямі endpoints WebSocket** — `ws://host[:port]/devtools/<kind>/<id>` або
  `wss://...` зі шляхом `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw підключається безпосередньо через handshake WebSocket і повністю пропускає
  `/json/version`.
- **Кореневі URL WebSocket без шляху** — `ws://host[:port]` або `wss://host[:port]` без
  шляху `/devtools/...` (наприклад, [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw спочатку пробує HTTP-виявлення
  `/json/version` (нормалізуючи схему до `http`/`https`);
  якщо виявлення повертає `webSocketDebuggerUrl`, він використовується, інакше OpenClaw
  переходить до прямого handshake WebSocket на корені без шляху. Це дозволяє
  bare `ws://`, спрямованому на локальний Chrome, все одно підключатися, оскільки Chrome
  приймає WebSocket upgrade лише на конкретному шляху для цілі з
  `/json/version`.

### Browserbase

[Browserbase](https://www.browserbase.com) — це хмарна платформа для запуску
headless-браузерів із вбудованим розв’язуванням CAPTCHA, stealth mode та
резидентними proxy.

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
- Замініть `<BROWSERBASE_API_KEY>` на свій справжній API key Browserbase.
- Browserbase автоматично створює сесію браузера під час підключення WebSocket, тож
  окремий крок ручного створення сесії не потрібен.
- Безкоштовний тариф дозволяє одну одночасну сесію та одну годину браузера на місяць.
  Див. [pricing](https://www.browserbase.com/pricing) щодо лімітів платних планів.
- Див. [документацію Browserbase](https://docs.browserbase.com) для повного
  довідника API, посібників зі SDK та прикладів інтеграції.

## Безпека

Ключові ідеї:

- Керування браузером доступне лише через loopback; доступ проходить через автентифікацію Gateway або pairing вузла.
- Автономний loopback HTTP API браузера використовує **лише автентифікацію shared-secret**:
  bearer auth за токеном gateway, `x-openclaw-password` або HTTP Basic auth із
  налаштованим паролем gateway.
- Заголовки ідентифікації Tailscale Serve і `gateway.auth.mode: "trusted-proxy"`
  **не** автентифікують цей автономний loopback API браузера.
- Якщо керування браузером увімкнено й shared-secret автентифікацію не налаштовано, OpenClaw
  автоматично генерує `gateway.auth.token` під час запуску та зберігає його в конфігурації.
- OpenClaw **не** генерує цей токен автоматично, коли `gateway.auth.mode` вже має значення
  `password`, `none` або `trusted-proxy`.
- Тримайте Gateway і будь-які node host у приватній мережі (Tailscale); уникайте публічного доступу.
- Ставтеся до URL-адрес/токенів віддаленого CDP як до секретів; віддавайте перевагу env vars або менеджеру секретів.

Поради щодо віддаленого CDP:

- За можливості віддавайте перевагу зашифрованим endpoint (HTTPS або WSS) і короткоживучим токенам.
- Уникайте вбудовування довгоживучих токенів безпосередньо у файли конфігурації.

## Профілі (кілька браузерів)

OpenClaw підтримує кілька іменованих профілів (конфігурацій маршрутизації). Профілі можуть бути такими:

- **керовані openclaw**: окремий екземпляр браузера на основі Chromium із власним каталогом user data + портом CDP
- **віддалені**: явна URL-адреса CDP (браузер на основі Chromium, що працює деінде)
- **наявна сесія**: ваш наявний профіль Chrome через автопідключення Chrome DevTools MCP

Типова поведінка:

- Профіль `openclaw` автоматично створюється, якщо його немає.
- Профіль `user` вбудований для підключення до наявної сесії Chrome MCP.
- Профілі наявної сесії, окрім `user`, вмикаються лише за бажанням; створюйте їх за допомогою `--driver existing-session`.
- Локальні порти CDP типово виділяються з діапазону **18800–18899**.
- Видалення профілю переміщує його локальний каталог даних у Trash.

Усі endpoint керування приймають `?profile=<name>`; CLI використовує `--browser-profile`.

## Existing-session через Chrome DevTools MCP

OpenClaw також може підключатися до вже запущеного профілю браузера на основі Chromium через
офіційний сервер Chrome DevTools MCP. Це повторно використовує вкладки та стан входу,
які вже відкриті в цьому профілі браузера.

Офіційні довідкові матеріали та посилання на налаштування:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Вбудований профіль:

- `user`

Необов’язково: створіть власний custom-профіль existing-session, якщо хочете
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
3. Залиште браузер запущеним і підтвердьте запит на підключення, коли OpenClaw під’єднається.

Типові сторінки inspect:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Live smoke test підключення:

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
- `tabs` перелічує вже відкриті вкладки браузера
- `snapshot` повертає refs з вибраної live-вкладки

Що перевірити, якщо підключення не працює:

- цільовий браузер на основі Chromium має версію `144+`
- у сторінці inspect цього браузера ввімкнено віддалене налагодження
- браузер показав запит на згоду на підключення, і ви його підтвердили
- `openclaw doctor` мігрує стару конфігурацію браузера на основі розширення та перевіряє,
  що Chrome локально встановлено для типових профілів автопідключення, але він не може
  увімкнути віддалене налагодження на боці браузера за вас

Використання агентом:

- Використовуйте `profile="user"`, коли потрібен стан браузера користувача з виконаним входом.
- Якщо ви використовуєте custom-профіль existing-session, передайте його явну назву профілю.
- Вибирайте цей режим лише тоді, коли користувач перебуває за комп’ютером, щоб підтвердити
  запит на підключення.
- Gateway або node host можуть запускати `npx chrome-devtools-mcp@latest --autoConnect`

Примітки:

- Цей шлях ризикованіший, ніж ізольований профіль `openclaw`, оскільки він може
  виконувати дії у вашій сесії браузера з виконаним входом.
- OpenClaw не запускає браузер для цього драйвера; він лише підключається.
- Тут OpenClaw використовує офіційний потік Chrome DevTools MCP `--autoConnect`. Якщо
  задано `userDataDir`, його буде передано далі для націлювання на цей каталог user data.
- Existing-session може підключатися на вибраному host або через підключений
  browser node. Якщо Chrome знаходиться деінде й browser node не підключено, використовуйте
  натомість віддалений CDP або node host.

<Accordion title="Обмеження функції existing-session">

Порівняно з керованим профілем `openclaw`, драйвери existing-session мають більше обмежень:

- **Скриншоти** — працюють знімки сторінки та знімки елементів через `--ref`; CSS-селектори `--element` не підтримуються. `--full-page` не можна поєднувати з `--ref` або `--element`. Для скриншотів сторінки чи елементів за ref Playwright не потрібен.
- **Дії** — `click`, `type`, `hover`, `scrollIntoView`, `drag` і `select` потребують snapshot refs (без CSS-селекторів). `click` працює лише для лівої кнопки миші. `type` не підтримує `slowly=true`; використовуйте `fill` або `press`. `press` не підтримує `delayMs`. `hover`, `scrollIntoView`, `drag`, `select`, `fill` і `evaluate` не підтримують timeout для окремого виклику. `select` приймає одне значення.
- **Очікування / вивантаження / діалог** — `wait --url` підтримує точні збіги, підрядки та glob-шаблони; `wait --load networkidle` не підтримується. Хуки вивантаження потребують `ref` або `inputRef`, по одному файлу за раз, без CSS `element`. Хуки діалогу не підтримують перевизначення timeout.
- **Функції лише для керованого режиму** — пакетні дії, експорт PDF, перехоплення завантажень і `responsebody` усе ще потребують шляху керованого браузера.

</Accordion>

## Гарантії ізоляції

- **Виділений каталог user data**: ніколи не торкається вашого особистого профілю браузера.
- **Виділені порти**: уникає `9222`, щоб запобігти конфліктам із dev-робочими процесами.
- **Детерміноване керування вкладками**: націлювання на вкладки через `targetId`, а не “остання вкладка”.

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
- Windows: перевіряє типові місця встановлення.

## API керування (необов’язково)

Лише для локальних інтеграцій Gateway надає невеликий loopback HTTP API:

- Стан/запуск/зупинка: `GET /`, `POST /start`, `POST /stop`
- Вкладки: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/скриншот: `GET /snapshot`, `POST /screenshot`
- Дії: `POST /navigate`, `POST /act`
- Хуки: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Завантаження: `POST /download`, `POST /wait/download`
- Налагодження: `GET /console`, `POST /pdf`
- Налагодження: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Мережа: `POST /response/body`
- Стан: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Стан: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Налаштування: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Усі endpoint приймають `?profile=<name>`.

Якщо налаштовано shared-secret автентифікацію gateway, HTTP-маршрути браузера також потребують автентифікації:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` або HTTP Basic auth із цим паролем

Примітки:

- Цей автономний loopback API браузера **не** використовує trusted-proxy або
  заголовки ідентифікації Tailscale Serve.
- Якщо `gateway.auth.mode` має значення `none` або `trusted-proxy`, ці loopback-маршрути браузера
  не успадковують ці режими з ідентифікацією; залишайте їх доступними лише через loopback.

### Контракт помилок `/act`

`POST /act` використовує структуровану відповідь помилки для валідації на рівні маршруту та
збоїв політики:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Поточні значення `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` відсутній або не розпізнається.
- `ACT_INVALID_REQUEST` (HTTP 400): payload дії не пройшов нормалізацію або валідацію.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` використано з непідтримуваним типом дії.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (або `wait --fn`) вимкнено конфігурацією.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` верхнього рівня або пакетний `targetId` конфліктує з ціллю запиту.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): дія не підтримується для профілів existing-session.

Інші збої під час виконання все ще можуть повертати `{ "error": "<message>" }` без
поля `code`.

### Вимога Playwright

Деякі функції (`navigate`/`act`/AI snapshot/role snapshot, скриншоти елементів,
PDF) потребують Playwright. Якщо Playwright не встановлено, ці endpoint повертають
чітку помилку 501.

Що все ще працює без Playwright:

- ARIA snapshots
- Скриншоти сторінки для керованого браузера `openclaw`, коли доступний WebSocket
  CDP для окремої вкладки
- Скриншоти сторінки для профілів `existing-session` / Chrome MCP
- Скриншоти existing-session за `ref` (`--ref`) з виводу snapshot

Що все ще потребує Playwright:

- `navigate`
- `act`
- AI snapshots / role snapshots
- Скриншоти елементів за CSS-селектором (`--element`)
- Повний експорт PDF браузера

Скриншоти елементів також відхиляють `--full-page`; маршрут повертає `fullPage is
not supported for element screenshots`.

Якщо ви бачите `Playwright is not available in this gateway build`, відновіть
runtime-залежності вбудованого browser plugin так, щоб було встановлено `playwright-core`,
а потім перезапустіть gateway. Для пакетних встановлень виконайте `openclaw doctor --fix`.
Для Docker також установіть бінарні файли браузера Chromium, як показано нижче.

#### Установлення Playwright у Docker

Якщо ваш Gateway працює в Docker, уникайте `npx playwright` (конфлікти npm override).
Натомість використовуйте вбудований CLI:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Щоб зберігати завантаження браузера, задайте `PLAYWRIGHT_BROWSERS_PATH` (наприклад,
`/home/node/.cache/ms-playwright`) і переконайтеся, що `/home/node` зберігається через
`OPENCLAW_HOME_VOLUME` або bind mount. Див. [Docker](/uk/install/docker).

## Як це працює (внутрішньо)

Невеликий loopback-сервер керування приймає HTTP-запити та підключається до браузерів на основі Chromium через CDP. Розширені дії (click/type/snapshot/PDF) проходять через Playwright поверх CDP; якщо Playwright відсутній, доступні лише операції без Playwright. Агент бачить один стабільний інтерфейс, тоді як локальні/віддалені браузери та профілі вільно змінюються під ним.

## Короткий довідник CLI

Усі команди приймають `--browser-profile <name>` для націлювання на конкретний профіль і `--json` для машиночитаного виводу.

<AccordionGroup>

<Accordion title="Основи: статус, вкладки, відкриття/фокусування/закриття">

```bash
openclaw browser status
openclaw browser start
openclaw browser stop            # also clears emulation on attach-only/remote CDP
openclaw browser tabs
openclaw browser tab             # shortcut for current tab
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="Інспекція: screenshot, snapshot, console, errors, requests">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # or --ref e12
openclaw browser snapshot
openclaw browser snapshot --format aria --limit 200
openclaw browser snapshot --interactive --compact --depth 6
openclaw browser snapshot --efficient
openclaw browser snapshot --labels
openclaw browser snapshot --selector "#main" --interactive
openclaw browser snapshot --frame "iframe#main" --interactive
openclaw browser console --level error
openclaw browser errors --clear
openclaw browser requests --filter api --clear
openclaw browser pdf
openclaw browser responsebody "**/api" --max-chars 5000
```

</Accordion>

<Accordion title="Дії: navigate, click, type, drag, wait, evaluate">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # or e12 for role refs
openclaw browser type 23 "hello" --submit
openclaw browser press Enter
openclaw browser hover 44
openclaw browser scrollintoview e12
openclaw browser drag 10 11
openclaw browser select 9 OptionA OptionB
openclaw browser download e12 report.pdf
openclaw browser waitfordownload report.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf
openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'
openclaw browser dialog --accept
openclaw browser wait --text "Done"
openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"
openclaw browser evaluate --fn '(el) => el.textContent' --ref 7
openclaw browser highlight e12
openclaw browser trace start
openclaw browser trace stop
```

</Accordion>

<Accordion title="Стан: cookies, storage, offline, headers, geo, device">

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url "https://example.com"
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set theme dark
openclaw browser storage session clear
openclaw browser set offline on
openclaw browser set headers --headers-json '{"X-Debug":"1"}'
openclaw browser set credentials user pass            # --clear to remove
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

Примітки:

- `upload` і `dialog` — це виклики **попереднього озброєння**; запускайте їх перед click/press, що викликає chooser/dialog.
- `click`/`type`/тощо потребують `ref` зі `snapshot` (числовий `12` або role ref `e12`). CSS-селектори навмисно не підтримуються для дій.
- Шляхи download, trace та upload обмежені тимчасовими коренями OpenClaw: `/tmp/openclaw{,/downloads,/uploads}` (резервний варіант: `${os.tmpdir()}/openclaw/...`).
- `upload` також може напряму задавати file input через `--input-ref` або `--element`.

Коротко про прапорці snapshot:

- `--format ai` (типово з Playwright): AI snapshot із числовими ref (`aria-ref="<n>"`).
- `--format aria`: дерево доступності, без ref; лише для інспекції.
- `--efficient` (або `--mode efficient`): компактний preset role snapshot. Установіть `browser.snapshotDefaults.mode: "efficient"`, щоб зробити це типовою поведінкою (див. [Конфігурація Gateway](/uk/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` примусово вмикають role snapshot із ref виду `e12`. `--frame "<iframe>"` обмежує role snapshots конкретним iframe.
- `--labels` додає скриншот лише видимої області з накладеними підписами ref (виводить `MEDIA:<path>`).

## Snapshots і ref

OpenClaw підтримує два стилі “snapshot”:

- **AI snapshot (числові ref)**: `openclaw browser snapshot` (типово; `--format ai`)
  - Вивід: текстовий snapshot, що містить числові ref.
  - Дії: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Внутрішньо ref розв’язується через `aria-ref` у Playwright.

- **Role snapshot (role ref на кшталт `e12`)**: `openclaw browser snapshot --interactive` (або `--compact`, `--depth`, `--selector`, `--frame`)
  - Вивід: список/дерево на основі ролей із `[ref=e12]` (і необов’язковим `[nth=1]`).
  - Дії: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Внутрішньо ref розв’язується через `getByRole(...)` (плюс `nth()` для дублікатів).
  - Додайте `--labels`, щоб включити скриншот видимої області з накладеними мітками `e12`.

Поведінка ref:

- Ref **не є стабільними між переходами**; якщо щось не спрацювало, повторно виконайте `snapshot` і використайте новий ref.
- Якщо role snapshot було зроблено з `--frame`, role ref обмежуються цим iframe до наступного role snapshot.

## Посилені можливості wait

Можна чекати не лише час/текст:

- Чекати URL (підтримуються glob-шаблони Playwright):
  - `openclaw browser wait --url "**/dash"`
- Чекати стан завантаження:
  - `openclaw browser wait --load networkidle`
- Чекати JS-predicate:
  - `openclaw browser wait --fn "window.ready===true"`
- Чекати, поки селектор стане видимим:
  - `openclaw browser wait "#main"`

Це можна комбінувати:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Робочі процеси налагодження

Коли дія не вдається (наприклад, “not visible”, “strict mode violation”, “covered”):

1. `openclaw browser snapshot --interactive`
2. Використайте `click <ref>` / `type <ref>` (в інтерактивному режимі віддавайте перевагу role ref)
3. Якщо все одно не працює: `openclaw browser highlight <ref>`, щоб побачити, на що саме націлюється Playwright
4. Якщо сторінка поводиться дивно:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Для глибокого налагодження запишіть trace:
   - `openclaw browser trace start`
   - відтворіть проблему
   - `openclaw browser trace stop` (виводить `TRACE:<path>`)

## Вивід JSON

`--json` призначений для сценаріїв і структурованих інструментів.

Приклади:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Role snapshots у JSON містять `refs` плюс невеликий блок `stats` (lines/chars/refs/interactive), щоб інструменти могли аналізувати розмір і щільність payload.

## Налаштування стану та середовища

Вони корисні для сценаріїв “змусити сайт поводитися як X”:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'` (застарілий варіант `set headers --json '{"X-Debug":"1"}'` і далі підтримується)
- HTTP basic auth: `set credentials user pass` (або `--clear`)
- Геолокація: `set geo <lat> <lon> --origin "https://example.com"` (або `--clear`)
- Media: `set media dark|light|no-preference|none`
- Часовий пояс / локаль: `set timezone ...`, `set locale ...`
- Пристрій / viewport:
  - `set device "iPhone 14"` (preset пристроїв Playwright)
  - `set viewport 1280 720`

## Безпека та приватність

- Профіль браузера openclaw може містити сесії з виконаним входом; ставтеся до нього як до чутливих даних.
- `browser act kind=evaluate` / `openclaw browser evaluate` і `wait --fn`
  виконують довільний JavaScript у контексті сторінки. Prompt injection може
  впливати на це. Вимкніть через `browser.evaluateEnabled=false`, якщо вам це не потрібно.
- Щодо входу в обліковий запис і приміток про anti-bot (X/Twitter тощо), див. [Вхід у браузері + публікація в X/Twitter](/uk/tools/browser-login).
- Тримайте Gateway/node host приватними (лише loopback або tailnet).
- Endpoint віддаленого CDP мають широкі можливості; використовуйте тунелі та захищайте їх.

Приклад strict mode (типово блокує приватні/внутрішні призначення):

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

## Усунення проблем

Для проблем, специфічних для Linux (особливо snap Chromium), див.
[Усунення проблем із браузером](/uk/tools/browser-linux-troubleshooting).

Для конфігурацій із розділеними host WSL2 Gateway + Windows Chrome див.
[WSL2 + Windows + усунення проблем віддаленого Chrome CDP](/uk/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Збій запуску CDP проти блокування SSRF під час навігації

Це різні класи збоїв, і вони вказують на різні шляхи в коді.

- **Збій запуску або готовності CDP** означає, що OpenClaw не може підтвердити, що площина керування браузером працює справно.
- **Блокування SSRF під час навігації** означає, що площина керування браузером працює справно, але ціль переходу сторінки відхиляється політикою.

Поширені приклади:

- Збій запуску або готовності CDP:
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

- Якщо `start` завершується помилкою `not reachable after start`, спочатку усувайте проблему готовності CDP.
- Якщо `start` успішний, але `tabs` завершується помилкою, площина керування все ще нездорова. Розглядайте це як проблему досяжності CDP, а не проблему навігації сторінки.
- Якщо `start` і `tabs` успішні, але `open` або `navigate` завершується помилкою, площина керування браузером працює, і збій пов’язаний із політикою навігації або цільовою сторінкою.
- Якщо `start`, `tabs` і `open` усі успішні, базовий шлях керування керованим браузером працює справно.

Важливі деталі поведінки:

- Конфігурація браузера типово використовує fail-closed об’єкт політики SSRF, навіть якщо ви не налаштовуєте `browser.ssrfPolicy`.
- Для локального керованого профілю loopback `openclaw` перевірки справності CDP навмисно пропускають застосування SSRF-перевірок браузера до власної локальної площини керування OpenClaw.
- Захист навігації є окремим. Успішний результат `start` або `tabs` не означає, що пізніша ціль `open` або `navigate` буде дозволена.

Рекомендації з безпеки:

- **Не** послаблюйте політику SSRF браузера типово.
- Віддавайте перевагу вузьким виняткам для host, таким як `hostnameAllowlist` або `allowedHostnames`, замість широкого доступу до приватної мережі.
- Використовуйте `dangerouslyAllowPrivateNetwork: true` лише в навмисно довірених середовищах, де доступ браузера до приватної мережі потрібен і перевірений.

## Інструменти агента + як працює керування

Агент отримує **один інструмент** для автоматизації браузера:

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Як це відображається:

- `browser snapshot` повертає стабільне дерево UI (AI або ARIA).
- `browser act` використовує `ref` ID зі snapshot для click/type/drag/select.
- `browser screenshot` захоплює пікселі (усю сторінку або елемент).
- `browser` приймає:
  - `profile` для вибору іменованого профілю браузера (openclaw, chrome або віддалений CDP).
  - `target` (`sandbox` | `host` | `node`) для вибору місця, де живе браузер.
  - У sandboxed-сесіях `target: "host"` потребує `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Якщо `target` не задано: sandboxed-сесії типово використовують `sandbox`, а не-sandbox-сесії — `host`.
  - Якщо підключено node з підтримкою браузера, інструмент може автоматично маршрутизуватися до нього, якщо ви явно не зафіксуєте `target="host"` або `target="node"`.

Це робить агента детермінованим і дає змогу уникати крихких селекторів.

## Пов’язане

- [Огляд інструментів](/uk/tools) — усі доступні інструменти агента
- [Ізоляція](/uk/gateway/sandboxing) — керування браузером в ізольованих середовищах
- [Безпека](/uk/gateway/security) — ризики керування браузером і посилення захисту
