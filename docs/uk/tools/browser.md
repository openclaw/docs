---
read_when:
    - Додавання автоматизації браузера, керованої агентом
    - Налагодження того, чому OpenClaw втручається у ваш власний Chrome
    - Реалізація налаштувань браузера + життєвого циклу в застосунку macOS
summary: Інтегрований сервіс керування браузером + команди дій
title: Browser (керований OpenClaw)
x-i18n:
    generated_at: "2026-04-23T21:13:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3232ec0627004aabd8fe7c73efa237949e4148a9648de7a12951c2af54608d4b
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw може запускати **виділений профіль Chrome/Brave/Edge/Chromium**, яким керує агент.
Він ізольований від вашого особистого браузера й керується через невеликий локальний
сервіс керування всередині Gateway (лише loopback).

Погляд для початківців:

- Думайте про це як про **окремий браузер лише для агента**.
- Профіль `openclaw` **не** торкається вашого особистого профілю браузера.
- Агент може **відкривати вкладки, читати сторінки, натискати й вводити текст** у безпечній зоні.
- Вбудований профіль `user` підключається до вашої реальної signed-in сесії Chrome через Chrome MCP.

## Що ви отримуєте

- Окремий профіль браузера з назвою **openclaw** (типово з помаранчевим акцентом).
- Детерміноване керування вкладками (list/open/focus/close).
- Дії агента (click/type/drag/select), snapshot-и, screenshot-и, PDF.
- Необов’язкова підтримка кількох профілів (`openclaw`, `work`, `remote`, ...).

Цей браузер **не** є вашим щоденним браузером. Це безпечна, ізольована поверхня для
автоматизації та перевірки агентом.

## Швидкий старт

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Якщо ви отримуєте “Browser disabled”, увімкніть його в config (див. нижче) і перезапустіть
Gateway.

Якщо `openclaw browser` взагалі відсутній або агент каже, що інструмент browser
недоступний, перейдіть до [Відсутня команда або інструмент browser](/uk/tools/browser#missing-browser-command-or-tool).

## Керування Plugin-ом

Типовий інструмент `browser` — це bundled Plugin. Вимкніть його, щоб замінити іншим Plugin-ом, який реєструє той самий інструмент `browser`:

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

Типові значення потребують і `plugins.entries.browser.enabled`, **і** `browser.enabled=true`. Вимкнення лише Plugin-а прибирає CLI `openclaw browser`, gateway method `browser.request`, інструмент агента та сервіс керування як єдине ціле; ваш `browser.*` config залишається недоторканим для заміни.

Зміни config browser вимагають перезапуску Gateway, щоб Plugin міг повторно зареєструвати свій сервіс.

## Відсутня команда або інструмент browser

Якщо `openclaw browser` невідомий після оновлення, `browser.request` відсутній або агент повідомляє, що інструмент browser недоступний, звичайна причина — список `plugins.allow`, у якому немає `browser`. Додайте його:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true` і `tools.alsoAllow: ["browser"]` не замінюють членство в allowlist — allowlist шлюзує завантаження Plugin-ів, а політика інструментів запускається лише після завантаження. Повне видалення `plugins.allow` також відновлює типову поведінку.

## Профілі: `openclaw` vs `user`

- `openclaw`: керований, ізольований браузер (розширення не потрібне).
- `user`: вбудований профіль підключення Chrome MCP до вашої **реальної signed-in сесії Chrome**.

Для викликів інструмента browser агентом:

- Типово: використовується ізольований браузер `openclaw`.
- Надавайте перевагу `profile="user"`, коли важливі наявні signed-in сесії, а користувач
  знаходиться за комп’ютером і може натиснути/схвалити будь-який prompt підключення.
- `profile` — це явне перевизначення, коли ви хочете конкретний режим браузера.

Задайте `browser.defaultProfile: "openclaw"`, якщо хочете використовувати керований режим типово.

## Конфігурація

Налаштування browser зберігаються в `~/.openclaw/openclaw.json`.

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
    // cdpUrl: "http://127.0.0.1:18792", // застаріле перевизначення single-profile
    remoteCdpTimeoutMs: 1500, // timeout HTTP-доступності remote CDP (мс)
    remoteCdpHandshakeTimeoutMs: 3000, // timeout рукостискання WebSocket remote CDP (мс)
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

<Accordion title="Порти й доступність">

- Сервіс керування прив’язується до loopback на порту, похідному від `gateway.port` (типово `18791` = gateway + 2). Перевизначення `gateway.port` або `OPENCLAW_GATEWAY_PORT` зсуває похідні порти в тому самому сімействі.
- Локальні профілі `openclaw` автоматично призначають `cdpPort`/`cdpUrl`; задавайте їх лише для remote CDP. `cdpUrl` типово вказує на керований локальний CDP-порт, якщо його не задано.
- `remoteCdpTimeoutMs` застосовується до перевірок HTTP-доступності remote (не-loopback) CDP; `remoteCdpHandshakeTimeoutMs` застосовується до рукостискань WebSocket remote CDP.

</Accordion>

<Accordion title="Політика SSRF">

- Навігація browser і open-tab захищені від SSRF до навігації та найкращим зусиллям повторно перевіряються на фінальному `http(s)` URL після неї.
- У strict SSRF mode також перевіряються виявлення endpoint-ів remote CDP і probe `/json/version` (`cdpUrl`).
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` типово вимкнено; вмикайте лише коли доступ browser до приватної мережі навмисно вважається довіреним.
- `browser.ssrfPolicy.allowPrivateNetwork` усе ще підтримується як застарілий псевдонім.

</Accordion>

<Accordion title="Поведінка профілів">

- `attachOnly: true` означає ніколи не запускати локальний браузер; лише підключатися, якщо він уже запущений.
- `color` (на верхньому рівні та для кожного профілю) тонує UI браузера, щоб ви могли бачити, який профіль активний.
- Типовий профіль — `openclaw` (керований standalone). Використовуйте `defaultProfile: "user"`, щоб перейти до signed-in користувацького браузера.
- Порядок auto-detect: системний типовий браузер, якщо він Chromium-based; інакше Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` використовує Chrome DevTools MCP замість raw CDP. Не задавайте `cdpUrl` для цього driver-а.
- Задайте `browser.profiles.<name>.userDataDir`, коли профіль existing-session має підключатися до non-default Chromium user profile (Brave, Edge тощо).

</Accordion>

</AccordionGroup>

## Використання Brave (або іншого Chromium-based браузера)

Якщо ваш **системний типовий** браузер є Chromium-based (Chrome/Brave/Edge тощо),
OpenClaw використовує його автоматично. Задайте `browser.executablePath`, щоб перевизначити
auto-detection:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
```

Або задайте його в config, окремо для кожної платформи:

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

## Локальне vs віддалене керування

- **Локальне керування (типово):** Gateway запускає loopback-сервіс керування і може запускати локальний браузер.
- **Віддалене керування (node host):** запустіть node host на машині, де є браузер; Gateway буде proxy-ювати browser actions до нього.
- **Remote CDP:** задайте `browser.profiles.<name>.cdpUrl` (або `browser.cdpUrl`), щоб
  підключитися до віддаленого Chromium-based браузера. У цьому випадку OpenClaw не запускатиме локальний браузер.

Поведінка зупинки відрізняється залежно від режиму профілю:

- локальні керовані профілі: `openclaw browser stop` зупиняє процес браузера, який
  запустив OpenClaw
- профілі attach-only і remote CDP: `openclaw browser stop` закриває активну
  session керування й скидає перевизначення емуляції Playwright/CDP (viewport,
  color scheme, locale, timezone, offline mode та подібний стан), навіть
  якщо OpenClaw не запускав жодного процесу браузера

Remote CDP URL можуть містити auth:

- Query token-и (наприклад, `https://provider.example?token=<token>`)
- HTTP Basic auth (наприклад, `https://user:pass@provider.example`)

OpenClaw зберігає auth під час виклику endpoint-ів `/json/*` і під час підключення
до WebSocket CDP. Надавайте перевагу змінним середовища або менеджерам секретів для
token-ів замість комітування їх у config-файли.

## Node browser proxy (нульова конфігурація типово)

Якщо ви запускаєте **node host** на машині, де є ваш браузер, OpenClaw може
автоматично маршрутизувати виклики browser tool до цього вузла без додаткової browser-конфігурації.
Це типовий шлях для віддалених gateway.

Примітки:

- Node host надає свій локальний сервіс керування browser через **proxy command**.
- Профілі беруться з власної config вузла `browser.profiles` (так само, як і локально).
- `nodeHost.browserProxy.allowProfiles` необов’язковий. Залиште його порожнім для застарілої/типової поведінки: усі налаштовані профілі залишаються доступними через proxy, включно з маршрутами create/delete профілів.
- Якщо ви задаєте `nodeHost.browserProxy.allowProfiles`, OpenClaw трактує це як межу least-privilege: націлюватися можна лише на профілі з allowlist, а маршрути create/delete сталих профілів блокуються на поверхні proxy.
- Вимкнення, якщо ви цього не хочете:
  - На вузлі: `nodeHost.browserProxy.enabled=false`
  - На gateway: `gateway.nodes.browser.mode="off"`

## Browserless (хостований remote CDP)

[Browserless](https://browserless.io) — це хостований сервіс Chromium, який надає
URL підключення CDP через HTTPS і WebSocket. OpenClaw може використовувати будь-яку з цих форм, але
для remote browser profile найпростіший варіант — прямий WebSocket URL
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

- Замініть `<BROWSERLESS_API_KEY>` на ваш справжній token Browserless.
- Виберіть endpoint регіону, який відповідає вашому акаунту Browserless (див. їхню документацію).
- Якщо Browserless дає вам HTTPS base URL, ви можете або перетворити його на
  `wss://` для прямого CDP-підключення, або залишити HTTPS URL і дозволити OpenClaw
  виявити `/json/version`.

## Direct WebSocket CDP provider-и

Деякі хостовані browser-сервіси надають **прямий WebSocket** endpoint замість
стандартного HTTP-based CDP discovery (`/json/version`). OpenClaw приймає три
форми CDP URL і автоматично вибирає правильну стратегію підключення:

- **HTTP(S) discovery** — `http://host[:port]` або `https://host[:port]`.
  OpenClaw викликає `/json/version`, щоб виявити URL WebSocket debugger, а потім
  підключається. Fallback на WebSocket відсутній.
- **Прямі WebSocket endpoint-и** — `ws://host[:port]/devtools/<kind>/<id>` або
  `wss://...` зі шляхом `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw підключається напряму через рукостискання WebSocket і повністю пропускає
  `/json/version`.
- **Голі корені WebSocket** — `ws://host[:port]` або `wss://host[:port]` без
  шляху `/devtools/...` (наприклад, [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw спочатку пробує HTTP
  discovery через `/json/version` (нормалізуючи схему до `http`/`https`);
  якщо discovery повертає `webSocketDebuggerUrl`, він використовується, інакше OpenClaw
  переходить до прямого рукостискання WebSocket на голому корені. Це дає змогу
  голому `ws://`, спрямованому на локальний Chrome, усе одно підключатися, оскільки Chrome лише
  приймає WebSocket upgrades на конкретному per-target path із
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
  з [dashboard Overview](https://www.browserbase.com/overview).
- Замініть `<BROWSERBASE_API_KEY>` на ваш справжній API key Browserbase.
- Browserbase автоматично створює browser session під час WebSocket connect, тож
  крок ручного створення session не потрібен.
- Безкоштовний рівень дозволяє одну одночасну session і одну browser-годину на місяць.
  Ліміти платних планів див. в [pricing](https://www.browserbase.com/pricing).
- Повний довідник API, SDK guide і приклади інтеграції див. в [документації Browserbase](https://docs.browserbase.com).

## Безпека

Ключові ідеї:

- Керування browser доступне лише через loopback; доступ проходить через auth Gateway або pairing вузла.
- Standalone loopback browser HTTP API використовує **лише auth через shared secret**:
  bearer auth через gateway token, `x-openclaw-password` або HTTP Basic auth з
  налаштованим gateway password.
- Identity headers Tailscale Serve і `gateway.auth.mode: "trusted-proxy"` **не**
  автентифікують цей standalone loopback browser API.
- Якщо керування browser увімкнене і shared-secret auth не налаштований, OpenClaw
  автоматично генерує `gateway.auth.token` під час startup і зберігає його в config.
- OpenClaw **не** генерує цей token автоматично, коли `gateway.auth.mode` уже має значення
  `password`, `none` або `trusted-proxy`.
- Тримайте Gateway і будь-які node host-и в приватній мережі (Tailscale); уникайте публічного доступу.
- Ставтеся до remote CDP URL/token-ів як до секретів; надавайте перевагу env-змінним або secrets manager.

Поради щодо remote CDP:

- Коли можливо, надавайте перевагу зашифрованим endpoint-ам (HTTPS або WSS) і короткоживучим token-ам.
- Уникайте вбудовування довгоживучих token-ів безпосередньо в config-файли.

## Профілі (кілька браузерів)

OpenClaw підтримує кілька іменованих профілів (конфігурації маршрутизації). Профілі можуть бути:

- **керовані OpenClaw**: виділений екземпляр Chromium-based браузера з власним каталогом user data + портом CDP
- **віддалені**: явний URL CDP (Chromium-based браузер, що працює десь ще)
- **наявна session**: ваш наявний профіль Chrome через auto-connect Chrome DevTools MCP

Типові значення:

- Профіль `openclaw` автоматично створюється, якщо його немає.
- Профіль `user` вбудований для existing-session attach через Chrome MCP.
- Профілі existing-session, окрім `user`, вмикаються через opt-in; створюйте їх через `--driver existing-session`.
- Локальні порти CDP типово виділяються з **18800–18899**.
- Видалення профілю переміщує його локальний каталог даних до Trash.

Усі endpoint-и керування приймають `?profile=<name>`; CLI використовує `--browser-profile`.

## Existing-session через Chrome DevTools MCP

OpenClaw також може підключатися до запущеного профілю Chromium-based браузера через
офіційний Chrome DevTools MCP server. Це повторно використовує вкладки та стан login, які
вже відкриті в цьому профілі браузера.

Офіційні довідкові матеріали та налаштування:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Вбудований профіль:

- `user`

Необов’язково: створіть власний кастомний existing-session profile, якщо хочете
іншу назву, колір або каталог даних браузера.

Типова поведінка:

- Вбудований профіль `user` використовує auto-connect Chrome MCP, який націлюється на
  типовий локальний профіль Google Chrome.

Використовуйте `userDataDir` для Brave, Edge, Chromium або non-default профілю Chrome:

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

1. Відкрийте inspect-сторінку цього браузера для remote debugging.
2. Увімкніть remote debugging.
3. Тримайте браузер запущеним і схваліть prompt підключення, коли OpenClaw підключатиметься.

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

Як виглядає успіх:

- `status` показує `driver: existing-session`
- `status` показує `transport: chrome-mcp`
- `status` показує `running: true`
- `tabs` перелічує вже відкриті вкладки браузера
- `snapshot` повертає refs із вибраної live-вкладки

Що перевірити, якщо attach не працює:

- цільовий Chromium-based браузер має версію `144+`
- у inspect-сторінці цього браузера ввімкнено remote debugging
- браузер показав prompt згоди на attach, і ви його схвалили
- `openclaw doctor` мігрує стару extension-based browser-config і перевіряє, що
  Chrome локально встановлений для типових auto-connect профілів, але він не може
  ввімкнути browser-side remote debugging за вас

Використання агентом:

- Використовуйте `profile="user"`, коли вам потрібен signed-in стан браузера користувача.
- Якщо ви використовуєте кастомний existing-session profile, передайте його явну назву.
- Обирайте цей режим лише тоді, коли користувач знаходиться за комп’ютером і може схвалити
  prompt attach.
- Gateway або node host можуть запускати `npx chrome-devtools-mcp@latest --autoConnect`

Примітки:

- Цей шлях ризикованіший, ніж ізольований профіль `openclaw`, тому що він може
  діяти всередині вашої signed-in session браузера.
- OpenClaw не запускає браузер для цього driver-а; він лише підключається.
- Тут OpenClaw використовує офіційний потік `--autoConnect` Chrome DevTools MCP. Якщо
  задано `userDataDir`, він передається далі, щоб націлюватися на цей каталог user data.
- Existing-session може підключатися на вибраному host-і або через підключений
  browser node. Якщо Chrome живе деінде і browser node не підключений, використовуйте
  remote CDP або node host.

<Accordion title="Обмеження можливостей existing-session">

Порівняно з керованим профілем `openclaw`, driver-и existing-session більш обмежені:

- **Screenshot-и** — page capture і capture елементів через `--ref` працюють; CSS-селектори `--element` — ні. `--full-page` не можна поєднувати з `--ref` або `--element`. Playwright не потрібен для page- або ref-based screenshot-ів.
- **Дії** — `click`, `type`, `hover`, `scrollIntoView`, `drag` і `select` потребують snapshot ref-ів (без CSS selector-ів). `click` працює лише лівою кнопкою миші. `type` не підтримує `slowly=true`; використовуйте `fill` або `press`. `press` не підтримує `delayMs`. `hover`, `scrollIntoView`, `drag`, `select`, `fill` і `evaluate` не підтримують timeout-и для окремих викликів. `select` приймає лише одне значення.
- **Wait / upload / dialog** — `wait --url` підтримує точні, підрядкові й glob-шаблони; `wait --load networkidle` не підтримується. Upload hook-и вимагають `ref` або `inputRef`, по одному файлу за раз, без CSS `element`. Dialog hook-и не підтримують перевизначення timeout.
- **Можливості лише для managed** — batch action-и, експорт PDF, перехоплення download і `responsebody` усе ще потребують шляху керованого браузера.

</Accordion>

## Гарантії ізоляції

- **Виділений каталог user data**: ніколи не торкається вашого особистого профілю браузера.
- **Виділені порти**: уникає `9222`, щоб не конфліктувати з dev-workflow.
- **Детерміноване керування вкладками**: цілиться у вкладки через `targetId`, а не «останню вкладку».

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
- Linux: шукає `google-chrome`, `brave`, `microsoft-edge`, `chromium` тощо.
- Windows: перевіряє типові шляхи встановлення.

## API керування (необов’язково)

Для локальних інтеграцій Gateway надає невеликий loopback HTTP API:

- Status/start/stop: `GET /`, `POST /start`, `POST /stop`
- Вкладки: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/screenshot: `GET /snapshot`, `POST /screenshot`
- Дії: `POST /navigate`, `POST /act`
- Hook-и: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Downloads: `POST /download`, `POST /wait/download`
- Налагодження: `GET /console`, `POST /pdf`
- Налагодження: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Мережа: `POST /response/body`
- Стан: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Стан: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Налаштування: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Усі endpoint-и приймають `?profile=<name>`.

Якщо налаштовано shared-secret gateway auth, browser HTTP routes теж вимагають auth:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` або HTTP Basic auth із цим password

Примітки:

- Цей standalone loopback browser API **не** споживає trusted-proxy або
  identity headers Tailscale Serve.
- Якщо `gateway.auth.mode` має значення `none` або `trusted-proxy`, ці loopback browser
  routes не успадковують ці identity-bearing режими; тримайте їх доступними лише через loopback.

### Контракт помилок `/act`

`POST /act` використовує структуровану відповідь про помилку для route-level validation і
policy failure:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Поточні значення `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` відсутній або нерозпізнаний.
- `ACT_INVALID_REQUEST` (HTTP 400): payload дії не пройшов normalisation або validation.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` було використано з непідтримуваним видом дії.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (або `wait --fn`) вимкнено в config.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): top-level або batched `targetId` конфліктує з ціллю запиту.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): дія не підтримується для профілів existing-session.

Інші runtime-failure усе ще можуть повертати `{ "error": "<message>" }` без
поля `code`.

### Вимога Playwright

Деякі можливості (`navigate`/`act`/AI snapshot/role snapshot, screenshot-и елементів,
PDF) потребують Playwright. Якщо Playwright не встановлено, ці endpoint-и повертають
чітку помилку 501.

Що все ще працює без Playwright:

- ARIA snapshot-и
- Page screenshot-и для керованого браузера `openclaw`, коли доступний CDP
  WebSocket для окремої вкладки
- Page screenshot-и для профілів `existing-session` / Chrome MCP
- Screenshot-и existing-session на основі `--ref` із виводу snapshot

Що все ще потребує Playwright:

- `navigate`
- `act`
- AI snapshot-и / role snapshot-и
- Screenshot-и елементів через CSS selector (`--element`)
- Повний експорт PDF браузера

Screenshot-и елементів також відхиляють `--full-page`; route повертає `fullPage is
not supported for element screenshots`.

Якщо ви бачите `Playwright is not available in this gateway build`, відновіть runtime-залежності bundled browser Plugin-а так, щоб `playwright-core` було встановлено,
а потім перезапустіть gateway. Для packaged-install виконайте `openclaw doctor --fix`.
Для Docker також встановіть binary Chromium browser, як показано нижче.

#### Встановлення Playwright у Docker

Якщо ваш Gateway працює в Docker, уникайте `npx playwright` (конфлікти npm override).
Використовуйте bundled CLI:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Щоб зберігати завантаження браузера, задайте `PLAYWRIGHT_BROWSERS_PATH` (наприклад,
`/home/node/.cache/ms-playwright`) і переконайтеся, що `/home/node` зберігається через
`OPENCLAW_HOME_VOLUME` або bind mount. Див. [Docker](/uk/install/docker).

## Як це працює (внутрішньо)

Невеликий loopback control server приймає HTTP-запити та підключається до Chromium-based браузерів через CDP. Розширені дії (click/type/snapshot/PDF) проходять через Playwright поверх CDP; коли Playwright відсутній, доступні лише операції без Playwright. Агент бачить один стабільний інтерфейс, тоді як локальні/віддалені браузери та профілі можуть вільно підмінятися під ним.

## Короткий довідник CLI

Усі команди приймають `--browser-profile <name>` для націлювання на конкретний профіль і `--json` для машинозчитуваного виводу.

<AccordionGroup>

<Accordion title="Базове: status, tabs, open/focus/close">

```bash
openclaw browser status
openclaw browser start
openclaw browser stop            # також очищує emulation для attach-only/remote CDP
openclaw browser tabs
openclaw browser tab             # скорочення для поточної вкладки
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
openclaw browser screenshot --ref 12        # або --ref e12
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
openclaw browser click 12 --double           # або e12 для role-ref
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
openclaw browser set credentials user pass            # --clear для видалення
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

Примітки:

- `upload` і `dialog` — це виклики **arming**; запускайте їх перед click/press, який викликає chooser/dialog.
- `click`/`type`/тощо вимагають `ref` із `snapshot` (числовий `12` або role-ref `e12`). CSS-селектори навмисно не підтримуються для дій.
- Шляхи download, trace і upload обмежені temp-root OpenClaw: `/tmp/openclaw{,/downloads,/uploads}` (fallback: `${os.tmpdir()}/openclaw/...`).
- `upload` також може напряму задавати file input через `--input-ref` або `--element`.

Коротко про прапорці snapshot:

- `--format ai` (типово з Playwright): AI snapshot із числовими ref (`aria-ref="<n>"`).
- `--format aria`: accessibility tree, без ref; лише для inspection.
- `--efficient` (або `--mode efficient`): компактний preset role snapshot. Задайте `browser.snapshotDefaults.mode: "efficient"`, щоб зробити це типовим (див. [Конфігурація Gateway](/uk/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` примусово використовують role snapshot із ref у форматі `ref=e12`. `--frame "<iframe>"` обмежує role snapshot цим iframe.
- `--labels` додає viewport-only screenshot з overlay-мітками ref (друкує `MEDIA:<path>`).

## Snapshot-и та ref

OpenClaw підтримує два стилі “snapshot”:

- **AI snapshot (числові ref):** `openclaw browser snapshot` (типово; `--format ai`)
  - Вивід: текстовий snapshot, який включає числові ref.
  - Дії: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Внутрішньо ref визначається через Playwright `aria-ref`.

- **Role snapshot (role-ref на кшталт `e12`):** `openclaw browser snapshot --interactive` (або `--compact`, `--depth`, `--selector`, `--frame`)
  - Вивід: список/дерево на основі role з `[ref=e12]` (і необов’язковим `[nth=1]`).
  - Дії: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Внутрішньо ref визначається через `getByRole(...)` (плюс `nth()` для дублікатів).
  - Додайте `--labels`, щоб включити viewport screenshot з overlay-мітками `e12`.

Поведінка ref:

- Ref **не є стабільними між навігаціями**; якщо щось не працює, знову запустіть `snapshot` і використовуйте свіжий ref.
- Якщо role snapshot було зроблено з `--frame`, role-ref обмежуються цим iframe до наступного role snapshot.

## Посилені можливості wait

Можна чекати не лише на час/текст:

- Чекати URL (glob-патерни підтримуються Playwright):
  - `openclaw browser wait --url "**/dash"`
- Чекати стан завантаження:
  - `openclaw browser wait --load networkidle`
- Чекати JS-predicate:
  - `openclaw browser wait --fn "window.ready===true"`
- Чекати, поки selector стане видимим:
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

Коли дія не вдається (наприклад, “not visible”, “strict mode violation”, “covered”):

1. `openclaw browser snapshot --interactive`
2. Використовуйте `click <ref>` / `type <ref>` (у interactive mode надавайте перевагу role-ref)
3. Якщо все ще не працює: `openclaw browser highlight <ref>`, щоб побачити, на що націлюється Playwright
4. Якщо сторінка поводиться дивно:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Для глибокого налагодження: запишіть trace:
   - `openclaw browser trace start`
   - відтворіть проблему
   - `openclaw browser trace stop` (друкує `TRACE:<path>`)

## JSON-вивід

`--json` призначений для scripting і структурованих інструментів.

Приклади:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Role snapshot у JSON містять `refs` плюс невеликий блок `stats` (lines/chars/refs/interactive), щоб інструменти могли оцінювати розмір і щільність payload.

## Параметри стану та середовища

Корисні для сценаріїв “змусь сайт поводитися як X”:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'` (застарілий `set headers --json '{"X-Debug":"1"}'` усе ще підтримується)
- HTTP Basic auth: `set credentials user pass` (або `--clear`)
- Геолокація: `set geo <lat> <lon> --origin "https://example.com"` (або `--clear`)
- Media: `set media dark|light|no-preference|none`
- Timezone / locale: `set timezone ...`, `set locale ...`
- Device / viewport:
  - `set device "iPhone 14"` (device preset-и Playwright)
  - `set viewport 1280 720`

## Безпека і приватність

- Профіль браузера openclaw може містити signed-in sessions; ставтеся до нього як до чутливого.
- `browser act kind=evaluate` / `openclaw browser evaluate` і `wait --fn`
  виконують довільний JavaScript у page context. Prompt injection може
  спрямовувати це. Вимкніть через `browser.evaluateEnabled=false`, якщо вам це не потрібно.
- Для входів і нотаток про anti-bot (X/Twitter тощо) див. [Логін у browser + постинг у X/Twitter](/uk/tools/browser-login).
- Тримайте Gateway/node host приватними (лише loopback або tailnet).
- Endpoint-и remote CDP дуже потужні; тунелюйте й захищайте їх.

Приклад strict mode (типово блокувати private/internal destination):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // необов’язковий точний дозвіл
    },
  },
}
```

## Усунення несправностей

Для Linux-specific проблем (особливо snap Chromium) див.
[Усунення несправностей browser у Linux](/uk/tools/browser-linux-troubleshooting).

Для конфігурацій із Gateway у WSL2 + Chrome у Windows на різних хостах див.
[Усунення несправностей WSL2 + Windows + remote Chrome CDP](/uk/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Помилка запуску CDP vs SSRF block під час навігації

Це різні класи збоїв, і вони вказують на різні шляхи коду.

- **Помилка запуску або готовності CDP** означає, що OpenClaw не може підтвердити, що control plane браузера здоровий.
- **Navigation SSRF block** означає, що control plane браузера здоровий, але ціль page navigation відхиляється політикою.

Поширені приклади:

- Помилка запуску або готовності CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- Navigation SSRF block:
  - потоки `open`, `navigate`, snapshot або відкриття вкладок завершуються помилкою browser/network policy, тоді як `start` і `tabs` усе ще працюють

Використовуйте цю мінімальну послідовність, щоб розрізнити їх:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Як читати результати:

- Якщо `start` завершується помилкою `not reachable after start`, спочатку налагоджуйте готовність CDP.
- Якщо `start` успішний, але `tabs` не працює, control plane усе ще нездоровий. Розглядайте це як проблему досяжності CDP, а не навігації сторінки.
- Якщо `start` і `tabs` успішні, але `open` або `navigate` не працюють, control plane браузера піднятий, і проблема в політиці навігації або цільовій сторінці.
- Якщо `start`, `tabs` і `open` усі успішні, базовий шлях керування керованим браузером здоровий.

Важливі деталі поведінки:

- Конфігурація browser типово використовує fail-closed policy object для SSRF, навіть коли ви не задаєте `browser.ssrfPolicy`.
- Для локального керованого профілю `openclaw` через loopback перевірки здоров’я CDP навмисно пропускають SSRF-обмеження досяжності browser для власного локального control plane OpenClaw.
- Захист навігації є окремим. Успішний результат `start` або `tabs` не означає, що пізніша ціль `open` або `navigate` дозволена.

Поради з безпеки:

- **Не** послаблюйте SSRF policy browser типово.
- Надавайте перевагу вузьким виняткам для host, таким як `hostnameAllowlist` або `allowedHostnames`, замість широкого доступу до приватної мережі.
- Використовуйте `dangerouslyAllowPrivateNetwork: true` лише в навмисно довірених середовищах, де потрібен і перевірений доступ browser до приватної мережі.

## Інструменти агента + як працює керування

Агент отримує **один інструмент** для автоматизації browser:

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Як це відображається:

- `browser snapshot` повертає стабільне дерево UI (AI або ARIA).
- `browser act` використовує `ref` ID зі snapshot для click/type/drag/select.
- `browser screenshot` захоплює пікселі (повна сторінка або елемент).
- `browser` приймає:
  - `profile` для вибору іменованого browser profile (`openclaw`, `chrome` або remote CDP).
  - `target` (`sandbox` | `host` | `node`) для вибору, де живе браузер.
  - У sandboxed sessions `target: "host"` вимагає `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Якщо `target` пропущено: sandboxed sessions типово використовують `sandbox`, не-sandbox sessions — `host`.
  - Якщо підключено browser-capable node, інструмент може автоматично маршрутизуватися до нього, якщо тільки ви явно не зафіксуєте `target="host"` або `target="node"`.

Це робить поведінку агента детермінованою й дозволяє уникати крихких selector-ів.

## Пов’язане

- [Огляд інструментів](/uk/tools) — усі доступні інструменти агента
- [Пісочниця](/uk/gateway/sandboxing) — керування браузером у sandboxed-середовищах
- [Безпека](/uk/gateway/security) — ризики керування браузером і зміцнення безпеки
