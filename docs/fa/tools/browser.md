---
read_when:
    - افزودن خودکارسازی مرورگر کنترل‌شده توسط عامل
    - اشکال‌زدایی دربارهٔ اینکه چرا OpenClaw با Chrome خودتان تداخل ایجاد می‌کند
    - پیاده‌سازی تنظیمات مرورگر + چرخهٔ حیات در برنامهٔ macOS
summary: سرویس کنترل مرورگر یکپارچه + فرمان‌های اقدام
title: مرورگر (مدیریت‌شده توسط OpenClaw)
x-i18n:
    generated_at: "2026-05-06T09:45:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3588ee1205d34df7604f1c660829c5f373b0fa76080d36c460f4ed4a08777a39
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw می‌تواند یک **پروفایل اختصاصی Chrome/Brave/Edge/Chromium** را اجرا کند که عامل آن را کنترل می‌کند.
این پروفایل از مرورگر شخصی شما جداست و از طریق یک سرویس کنترل محلی کوچک
داخل Gateway مدیریت می‌شود (فقط loopback).

نمای مبتدیان:

- آن را مانند یک **مرورگر جداگانه و فقط برای عامل** در نظر بگیرید.
- پروفایل `openclaw` به پروفایل مرورگر شخصی شما **دست نمی‌زند**.
- عامل می‌تواند در یک مسیر امن **زبانه‌ها را باز کند، صفحه‌ها را بخواند، کلیک کند و تایپ کند**.
- پروفایل داخلی `user` از طریق Chrome MCP به نشست واقعی Chrome شما که وارد آن شده‌اید متصل می‌شود.

## چه چیزی دریافت می‌کنید

- یک پروفایل مرورگر جداگانه با نام **openclaw** (به‌طور پیش‌فرض با رنگ تاکیدی نارنجی).
- کنترل قطعی زبانه‌ها (فهرست/باز کردن/تمرکز/بستن).
- اقدامات عامل (کلیک/تایپ/کشیدن/انتخاب)، snapshotها، screenshotها، PDFها.
- یک skill همراه `browser-automation` که وقتی Plugin مرورگر فعال باشد، چرخه بازیابی snapshot،
  زبانه پایدار، مرجع کهنه و مانع دستی را به عامل‌ها آموزش می‌دهد.
- پشتیبانی اختیاری از چند پروفایل (`openclaw`، `work`، `remote`، ...).

این مرورگر، مرورگر روزمره شما **نیست**. این یک سطح امن و ایزوله برای
اتوماسیون و راستی‌آزمایی عامل است.

## شروع سریع

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

اگر پیام "Browser disabled" را دریافت کردید، آن را در config فعال کنید (پایین را ببینید) و
Gateway را دوباره راه‌اندازی کنید.

اگر `openclaw browser` کلا وجود ندارد، یا عامل می‌گوید ابزار مرورگر
در دسترس نیست، به [فرمان یا ابزار مرورگر پیدا نمی‌شود](/fa/tools/browser#missing-browser-command-or-tool) بروید.

## کنترل Plugin

ابزار پیش‌فرض `browser` یک Plugin همراه است. برای جایگزین کردن آن با Plugin دیگری که همان نام ابزار `browser` را ثبت می‌کند، آن را غیرفعال کنید:

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

پیش‌فرض‌ها هم به `plugins.entries.browser.enabled` **و هم** به `browser.enabled=true` نیاز دارند. غیرفعال کردن فقط Plugin، CLI `openclaw browser`، روش Gateway با نام `browser.request`، ابزار عامل و سرویس کنترل را به‌صورت یک واحد حذف می‌کند؛ config مربوط به `browser.*` شما برای جایگزین دست‌نخورده می‌ماند.

تغییرات config مرورگر به راه‌اندازی مجدد Gateway نیاز دارند تا Plugin بتواند سرویس خود را دوباره ثبت کند.

## راهنمای عامل

نکته پروفایل ابزار: `tools.profile: "coding"` شامل `web_search` و
`web_fetch` است، اما ابزار کامل `browser` را شامل نمی‌شود. اگر عامل یا یک
زیرعامل ایجادشده باید از اتوماسیون مرورگر استفاده کند، مرورگر را در مرحله
پروفایل اضافه کنید:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

برای یک عامل منفرد، از `agents.list[].tools.alsoAllow: ["browser"]` استفاده کنید.
`tools.subagents.tools.allow: ["browser"]` به‌تنهایی کافی نیست، چون سیاست زیرعامل
بعد از فیلتر کردن پروفایل اعمال می‌شود.

Plugin مرورگر دو سطح راهنمایی عامل ارائه می‌کند:

- توضیح ابزار `browser` قرارداد فشرده و همیشه‌فعال را حمل می‌کند: پروفایل
  درست را انتخاب کنید، refs را روی همان زبانه نگه دارید، برای هدف‌گیری زبانه
  از `tabId`/labels استفاده کنید و برای کار چندمرحله‌ای skill مرورگر را بارگذاری کنید.
- skill همراه `browser-automation` چرخه عملیاتی طولانی‌تر را حمل می‌کند:
  ابتدا status/tabs را بررسی کنید، زبانه‌های وظیفه را برچسب‌گذاری کنید، پیش از اقدام snapshot بگیرید، پس از تغییرات UI دوباره snapshot بگیرید، refs کهنه را یک‌بار بازیابی کنید، و login/2FA/captcha یا
  موانع camera/microphone را به‌جای حدس زدن به‌عنوان اقدام دستی گزارش کنید.

Skills همراه Plugin وقتی Plugin فعال باشد در Skills موجود عامل فهرست می‌شوند.
دستورالعمل‌های کامل skill در صورت نیاز بارگذاری می‌شوند، بنابراین نوبت‌های معمولی
هزینه کامل token را نمی‌پردازند.

## فرمان یا ابزار مرورگر پیدا نمی‌شود

اگر پس از upgrade، `openclaw browser` ناشناخته است، `browser.request` وجود ندارد، یا عامل ابزار مرورگر را ناموجود گزارش می‌کند، علت معمول یک فهرست `plugins.allow` است که `browser` را حذف کرده و هیچ بلوک config ریشه‌ای `browser` وجود ندارد. آن را اضافه کنید:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

یک بلوک ریشه‌ای صریح `browser`، برای مثال `browser.enabled=true` یا `browser.profiles.<name>`، حتی زیر یک `plugins.allow` محدودکننده نیز Plugin مرورگر همراه را فعال می‌کند و با رفتار config کانال هم‌خوان است. `plugins.entries.browser.enabled=true` و `tools.alsoAllow: ["browser"]` به‌تنهایی جایگزین عضویت در allowlist نمی‌شوند. حذف کامل `plugins.allow` نیز پیش‌فرض را برمی‌گرداند.

## پروفایل‌ها: `openclaw` در برابر `user`

- `openclaw`: مرورگر مدیریت‌شده و ایزوله (بدون نیاز به افزونه).
- `user`: پروفایل داخلی اتصال Chrome MCP برای نشست **واقعی Chrome که وارد آن شده‌اید**.

برای فراخوانی‌های ابزار مرورگر توسط عامل:

- پیش‌فرض: از مرورگر ایزوله `openclaw` استفاده کنید.
- وقتی نشست‌های واردشده موجود اهمیت دارند و کاربر پشت رایانه است تا روی هر درخواست اتصال کلیک/تایید کند، `profile="user"` را ترجیح دهید.
- وقتی یک حالت مرورگر مشخص می‌خواهید، `profile` override صریح است.

اگر می‌خواهید حالت مدیریت‌شده به‌طور پیش‌فرض استفاده شود، `browser.defaultProfile: "openclaw"` را تنظیم کنید.

## پیکربندی

تنظیمات مرورگر در `~/.openclaw/openclaw.json` قرار دارند.

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

<Accordion title="پورت‌ها و دسترسی‌پذیری">

- سرویس کنترل به loopback روی پورتی متصل می‌شود که از `gateway.port` مشتق شده است (پیش‌فرض `18791` = gateway + 2). override کردن `gateway.port` یا `OPENCLAW_GATEWAY_PORT` پورت‌های مشتق‌شده را در همان خانواده جابه‌جا می‌کند.
- پروفایل‌های محلی `openclaw` به‌صورت خودکار `cdpPort`/`cdpUrl` را تخصیص می‌دهند؛ این‌ها را فقط برای CDP راه دور تنظیم کنید. وقتی `cdpUrl` تنظیم نشده باشد، مقدار پیش‌فرض آن پورت CDP محلی مدیریت‌شده است.
- `remoteCdpTimeoutMs` برای بررسی‌های دسترسی‌پذیری CDP HTTP راه دور و `attachOnly`
  و درخواست‌های HTTP باز کردن زبانه اعمال می‌شود؛ `remoteCdpHandshakeTimeoutMs` برای
  handshakeهای CDP WebSocket آن‌ها اعمال می‌شود.
- `localLaunchTimeoutMs` بودجه زمانی برای یک فرایند Chrome مدیریت‌شده که به‌صورت محلی راه‌اندازی شده است تا endpoint مربوط به CDP HTTP خود را نمایش دهد. `localCdpReadyTimeoutMs`
  بودجه زمانی بعدی برای آماده‌بودن CDP websocket پس از کشف فرایند است.
  این مقادیر را روی Raspberry Pi، VPSهای کم‌توان یا سخت‌افزارهای قدیمی‌تر که Chromium
  در آن‌ها کند شروع می‌شود افزایش دهید. مقادیر باید اعداد صحیح مثبت تا `120000` ms باشند؛ مقادیر
  config نامعتبر رد می‌شوند.
- شکست‌های تکراری راه‌اندازی/آماده‌سازی Chrome مدیریت‌شده برای هر
  پروفایل circuit-break می‌شوند. پس از چند شکست پیاپی، OpenClaw تلاش‌های راه‌اندازی جدید را
  برای مدت کوتاهی متوقف می‌کند، به‌جای اینکه در هر فراخوانی ابزار مرورگر Chromium را اجرا کند. مشکل
  startup را برطرف کنید، اگر مرورگر لازم نیست آن را غیرفعال کنید، یا پس از تعمیر
  Gateway را دوباره راه‌اندازی کنید.
- `actionTimeoutMs` بودجه زمانی پیش‌فرض برای درخواست‌های `act` مرورگر است، وقتی فراخواننده `timeoutMs` را ارسال نمی‌کند. انتقال client یک پنجره slack کوچک اضافه می‌کند تا انتظارهای طولانی بتوانند به‌جای timeout شدن در مرز HTTP کامل شوند.
- `tabCleanup` پاک‌سازی best-effort برای زبانه‌هایی است که توسط نشست‌های مرورگر عامل اصلی باز شده‌اند. پاک‌سازی چرخه عمر subagent، cron و ACP همچنان زبانه‌های ردیابی‌شده صریح خود را در پایان نشست می‌بندد؛ نشست‌های اصلی زبانه‌های فعال را قابل استفاده مجدد نگه می‌دارند و سپس زبانه‌های ردیابی‌شده idle یا اضافی را در پس‌زمینه می‌بندند.

</Accordion>

<Accordion title="سیاست SSRF">

- ناوبری مرورگر و open-tab پیش از ناوبری با محافظ SSRF بررسی می‌شوند و سپس با best-effort روی URL نهایی `http(s)` دوباره بررسی می‌شوند.
- در حالت SSRF سخت‌گیرانه، کشف endpoint راه دور CDP و probeهای `/json/version` (`cdpUrl`) نیز بررسی می‌شوند.
- متغیرهای محیطی Gateway/provider یعنی `HTTP_PROXY`، `HTTPS_PROXY`، `ALL_PROXY` و `NO_PROXY` به‌طور خودکار مرورگر مدیریت‌شده توسط OpenClaw را proxy نمی‌کنند. Chrome مدیریت‌شده به‌طور پیش‌فرض مستقیم راه‌اندازی می‌شود تا تنظیمات proxy مربوط به provider بررسی‌های SSRF مرورگر را ضعیف نکنند.
- برای proxy کردن خود مرورگر مدیریت‌شده، flagهای proxy صریح Chrome را از طریق `browser.extraArgs` ارسال کنید، مثل `--proxy-server=...` یا `--proxy-pac-url=...`. حالت SSRF سخت‌گیرانه، مسیریابی proxy صریح مرورگر را مسدود می‌کند مگر اینکه دسترسی مرورگر به شبکه خصوصی عمدا فعال شده باشد.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` به‌طور پیش‌فرض خاموش است؛ فقط وقتی فعال کنید که دسترسی مرورگر به شبکه خصوصی عمدا مورد اعتماد باشد.
- `browser.ssrfPolicy.allowPrivateNetwork` همچنان به‌عنوان alias قدیمی پشتیبانی می‌شود.

</Accordion>

<Accordion title="رفتار پروفایل">

- `attachOnly: true` یعنی هرگز مرورگر محلی را اجرا نکن؛ فقط اگر مرورگری از قبل در حال اجراست به آن متصل شو.
- `headless` را می‌توان به‌صورت سراسری یا برای هر پروفایل مدیریت‌شده محلی تنظیم کرد. مقادیر هر پروفایل `browser.headless` را نادیده می‌گیرند، بنابراین یک پروفایل محلی اجراشده می‌تواند headless بماند، در حالی که پروفایل دیگر همچنان قابل‌مشاهده باشد.
- `POST /start?headless=true` و `openclaw browser start --headless` برای پروفایل‌های مدیریت‌شده محلی یک اجرای headless یک‌باره درخواست می‌کنند، بدون اینکه `browser.headless` یا پیکربندی پروفایل را بازنویسی کنند. پروفایل‌های existing-session، attach-only و remote CDP این نادیده‌گیری را رد می‌کنند، چون OpenClaw فرایندهای آن مرورگرها را اجرا نمی‌کند.
- روی میزبان‌های Linux بدون `DISPLAY` یا `WAYLAND_DISPLAY`، پروفایل‌های مدیریت‌شده محلی زمانی که نه محیط و نه پیکربندی پروفایل/سراسری به‌صراحت حالت headed را انتخاب نکرده باشد، به‌طور خودکار به headless پیش‌فرض می‌شوند. `openclaw browser status --json` مقدار `headlessSource` را به‌صورت `env`، `profile`، `config`، `request`، `linux-display-fallback` یا `default` گزارش می‌کند.
- `OPENCLAW_BROWSER_HEADLESS=1` اجرای مدیریت‌شده محلی را برای فرایند فعلی به حالت headless اجبار می‌کند. `OPENCLAW_BROWSER_HEADLESS=0` حالت headed را برای شروع‌های عادی اجبار می‌کند و روی میزبان‌های Linux بدون سرور نمایش، خطایی قابل‌اقدام برمی‌گرداند؛ درخواست صریح `start --headless` همچنان برای همان اجرای واحد اولویت دارد.
- `executablePath` را می‌توان به‌صورت سراسری یا برای هر پروفایل مدیریت‌شده محلی تنظیم کرد. مقادیر هر پروفایل `browser.executablePath` را نادیده می‌گیرند، بنابراین پروفایل‌های مدیریت‌شده مختلف می‌توانند مرورگرهای مختلف مبتنی بر Chromium را اجرا کنند. هر دو شکل، `~` را برای دایرکتوری خانه سیستم‌عامل شما می‌پذیرند.
- `color` (در سطح بالا و برای هر پروفایل) رابط کاربری مرورگر را رنگی می‌کند تا بتوانید ببینید کدام پروفایل فعال است.
- پروفایل پیش‌فرض `openclaw` است (مدیریت‌شده مستقل). برای استفاده از مرورگر کاربر واردشده، از `defaultProfile: "user"` استفاده کنید.
- ترتیب تشخیص خودکار: مرورگر پیش‌فرض سیستم اگر مبتنی بر Chromium باشد؛ در غیر این صورت Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` به‌جای CDP خام از Chrome DevTools MCP استفاده می‌کند. برای این driver مقدار `cdpUrl` را تنظیم نکنید.
- زمانی `browser.profiles.<name>.userDataDir` را تنظیم کنید که یک پروفایل existing-session باید به یک پروفایل کاربری غیرپیش‌فرض Chromium متصل شود (Brave، Edge و غیره). این مسیر نیز `~` را برای دایرکتوری خانه سیستم‌عامل شما می‌پذیرد.

</Accordion>

</AccordionGroup>

## استفاده از Brave یا مرورگر دیگری مبتنی بر Chromium

اگر مرورگر **پیش‌فرض سیستم** شما مبتنی بر Chromium باشد (Chrome/Brave/Edge/و غیره)،
OpenClaw به‌طور خودکار از آن استفاده می‌کند. برای نادیده‌گرفتن تشخیص خودکار،
`browser.executablePath` را تنظیم کنید. مقادیر `executablePath` در سطح بالا و برای هر پروفایل، `~`
را برای دایرکتوری خانه سیستم‌عامل شما می‌پذیرند:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

یا آن را در پیکربندی، برای هر پلتفرم تنظیم کنید:

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

`executablePath` هر پروفایل فقط بر پروفایل‌های مدیریت‌شده محلی اثر می‌گذارد که OpenClaw
آن‌ها را اجرا می‌کند. پروفایل‌های `existing-session` در عوض به مرورگری که از قبل در حال اجراست
متصل می‌شوند، و پروفایل‌های remote CDP از مرورگر پشت `cdpUrl` استفاده می‌کنند.

## کنترل محلی در برابر کنترل راه‌دور

- **کنترل محلی (پیش‌فرض):** Gateway سرویس کنترل حلقه‌بازگشتی را شروع می‌کند و می‌تواند یک مرورگر محلی را اجرا کند.
- **کنترل راه‌دور (میزبان Node):** یک میزبان Node را روی دستگاهی اجرا کنید که مرورگر را دارد؛ Gateway کنش‌های مرورگر را به آن پراکسی می‌کند.
- **Remote CDP:** مقدار `browser.profiles.<name>.cdpUrl` (یا `browser.cdpUrl`) را تنظیم کنید تا به یک مرورگر راه‌دور مبتنی بر Chromium متصل شوید. در این حالت، OpenClaw مرورگر محلی را اجرا نمی‌کند.
- برای سرویس‌های CDP مدیریت‌شده بیرونی روی حلقه‌بازگشتی (برای مثال Browserless در
  Docker که روی `127.0.0.1` منتشر شده است)، `attachOnly: true` را نیز تنظیم کنید. CDP حلقه‌بازگشتی
  بدون `attachOnly` به‌عنوان پروفایل مرورگر مدیریت‌شده محلی OpenClaw در نظر گرفته می‌شود.
- `headless` فقط بر پروفایل‌های مدیریت‌شده محلی اثر می‌گذارد که OpenClaw اجرا می‌کند. مرورگرهای existing-session یا remote CDP را دوباره راه‌اندازی یا تغییر نمی‌دهد.
- `executablePath` از همان قاعده پروفایل مدیریت‌شده محلی پیروی می‌کند. تغییر آن روی یک پروفایل مدیریت‌شده محلی در حال اجرا، آن پروفایل را برای راه‌اندازی مجدد/همگام‌سازی علامت‌گذاری می‌کند تا اجرای بعدی از باینری جدید استفاده کند.

رفتار توقف بر اساس حالت پروفایل متفاوت است:

- پروفایل‌های مدیریت‌شده محلی: `openclaw browser stop` فرایند مرورگری را متوقف می‌کند که OpenClaw اجرا کرده است
- پروفایل‌های attach-only و remote CDP: `openclaw browser stop` نشست کنترل فعال را می‌بندد و نادیده‌گیری‌های شبیه‌سازی Playwright/CDP (viewport، color scheme، locale، timezone، offline mode و وضعیت‌های مشابه) را آزاد می‌کند، حتی با اینکه هیچ فرایند مرورگری توسط OpenClaw اجرا نشده است

نشانی‌های remote CDP می‌توانند شامل احراز هویت باشند:

- توکن‌های پرس‌وجو (مثلاً `https://provider.example?token=<token>`)
- احراز هویت HTTP Basic (مثلاً `https://user:pass@provider.example`)

OpenClaw هنگام فراخوانی endpointهای `/json/*` و هنگام اتصال به CDP WebSocket،
احراز هویت را حفظ می‌کند. برای توکن‌ها، به‌جای ثبت آن‌ها در فایل‌های پیکربندی،
از متغیرهای محیطی یا مدیرهای اسرار استفاده کنید.

## پراکسی مرورگر Node (پیش‌فرض بدون پیکربندی)

اگر یک **میزبان Node** را روی دستگاهی اجرا کنید که مرورگر شما را دارد، OpenClaw می‌تواند
فراخوانی‌های ابزار مرورگر را بدون هیچ پیکربندی مرورگر اضافه‌ای به‌طور خودکار به آن Node
مسیریابی کند. این مسیر پیش‌فرض برای Gatewayهای راه‌دور است.

نکات:

- میزبان Node سرور کنترل مرورگر محلی خود را از طریق یک **فرمان پراکسی** ارائه می‌کند.
- پروفایل‌ها از پیکربندی `browser.profiles` خود Node می‌آیند (همانند حالت محلی).
- `nodeHost.browserProxy.allowProfiles` اختیاری است. برای رفتار قدیمی/پیش‌فرض آن را خالی بگذارید: همه پروفایل‌های پیکربندی‌شده از طریق پراکسی قابل‌دسترسی می‌مانند، از جمله مسیرهای ایجاد/حذف پروفایل.
- اگر `nodeHost.browserProxy.allowProfiles` را تنظیم کنید، OpenClaw آن را به‌عنوان مرز حداقل‌دسترسی در نظر می‌گیرد: فقط پروفایل‌های موجود در allowlist می‌توانند هدف قرار بگیرند، و مسیرهای پایدار ایجاد/حذف پروفایل روی سطح پراکسی مسدود می‌شوند.
- اگر آن را نمی‌خواهید، غیرفعال کنید:
  - روی Node: `nodeHost.browserProxy.enabled=false`
  - روی gateway: `gateway.nodes.browser.mode="off"`

## Browserless (remote CDP میزبانی‌شده)

[Browserless](https://browserless.io) یک سرویس Chromium میزبانی‌شده است که نشانی‌های اتصال
CDP را از طریق HTTPS و WebSocket ارائه می‌کند. OpenClaw می‌تواند از هر دو شکل استفاده کند، اما
برای یک پروفایل مرورگر راه‌دور، ساده‌ترین گزینه نشانی مستقیم WebSocket
از مستندات اتصال Browserless است.

مثال:

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

نکات:

- `<BROWSERLESS_API_KEY>` را با توکن واقعی Browserless خود جایگزین کنید.
- endpoint منطقه‌ای را انتخاب کنید که با حساب Browserless شما مطابقت دارد (مستندات آن‌ها را ببینید).
- اگر Browserless به شما یک URL پایه HTTPS بدهد، می‌توانید یا آن را برای اتصال مستقیم CDP به `wss://` تبدیل کنید یا URL مربوط به HTTPS را نگه دارید و اجازه دهید OpenClaw `/json/version` را کشف کند.

### Browserless Docker روی همان میزبان

وقتی Browserless در Docker به‌صورت self-hosted اجرا می‌شود و OpenClaw روی میزبان اجرا می‌شود، با Browserless مانند یک سرویس CDP مدیریت‌شده بیرونی برخورد کنید:

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

نشانی موجود در `browser.profiles.browserless.cdpUrl` باید از فرایند OpenClaw قابل‌دسترسی باشد. Browserless همچنین باید یک endpoint قابل‌دسترسی مطابق را اعلام کند؛ مقدار Browserless `EXTERNAL` را روی همان پایه WebSocket عمومی-به-OpenClaw تنظیم کنید، مانند `ws://127.0.0.1:3000`، `ws://browserless:3000` یا یک نشانی شبکه خصوصی پایدار Docker. اگر `/json/version` مقدار `webSocketDebuggerUrl` را نشان دهد که به نشانی‌ای اشاره می‌کند که OpenClaw نمی‌تواند به آن برسد، CDP HTTP ممکن است سالم به نظر برسد، در حالی که اتصال WebSocket همچنان شکست می‌خورد.

برای یک پروفایل Browserless حلقه‌بازگشتی، `attachOnly` را تنظیم‌نشده رها نکنید. بدون
`attachOnly`، OpenClaw پورت حلقه‌بازگشتی را به‌عنوان یک پروفایل مرورگر مدیریت‌شده محلی
در نظر می‌گیرد و ممکن است گزارش کند که پورت در حال استفاده است اما متعلق به OpenClaw نیست.

## ارائه‌دهندگان CDP با WebSocket مستقیم

برخی سرویس‌های مرورگر میزبانی‌شده به‌جای کشف CDP استاندارد مبتنی بر HTTP (`/json/version`)، یک endpoint **WebSocket مستقیم** ارائه می‌کنند. OpenClaw سه شکل URL مربوط به CDP را می‌پذیرد و راهبرد اتصال درست را به‌طور خودکار انتخاب می‌کند:

- **کشف HTTP(S)** - `http://host[:port]` یا `https://host[:port]`.
  OpenClaw برای کشف URL اشکال‌زدای WebSocket، `/json/version` را فراخوانی می‌کند، سپس
  متصل می‌شود. هیچ fallback مربوط به WebSocket وجود ندارد.
- **Endpointهای WebSocket مستقیم** - `ws://host[:port]/devtools/<kind>/<id>` یا
  `wss://...` با مسیر `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw مستقیماً از طریق WebSocket handshake متصل می‌شود و
  `/json/version` را کاملاً رد می‌کند.
- **ریشه‌های WebSocket ساده** - `ws://host[:port]` یا `wss://host[:port]` بدون
  مسیر `/devtools/...` (مثلاً [Browserless](https://browserless.io)،
  [Browserbase](https://www.browserbase.com)). OpenClaw ابتدا کشف HTTP
  `/json/version` را امتحان می‌کند (با عادی‌سازی scheme به `http`/`https`)؛
  اگر کشف، `webSocketDebuggerUrl` برگرداند از آن استفاده می‌شود، در غیر این صورت OpenClaw
  به WebSocket handshake مستقیم در ریشه ساده fallback می‌کند. اگر endpoint اعلام‌شده
  WebSocket، CDP handshake را رد کند اما ریشه ساده پیکربندی‌شده آن را بپذیرد،
  OpenClaw به همان ریشه نیز fallback می‌کند. این باعث می‌شود یک `ws://` ساده
  که به Chrome محلی اشاره دارد همچنان متصل شود، چون Chrome ارتقاهای WebSocket
  را فقط روی مسیر ویژه هر target از `/json/version` می‌پذیرد، در حالی که ارائه‌دهندگان
  میزبانی‌شده همچنان می‌توانند از endpoint ریشه WebSocket خود استفاده کنند، وقتی endpoint
  کشف آن‌ها URL کوتاه‌عمری را اعلام می‌کند که برای Playwright CDP مناسب نیست.

### Browserbase

[Browserbase](https://www.browserbase.com) یک پلتفرم ابری برای اجرای
مرورگرهای headless با حل CAPTCHA داخلی، حالت stealth و پراکسی‌های مسکونی است.

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

نکات:

- [ثبت‌نام کنید](https://www.browserbase.com/sign-up) و **API Key** خود را
  از [داشبورد Overview](https://www.browserbase.com/overview) کپی کنید.
- `<BROWSERBASE_API_KEY>` را با کلید API واقعی Browserbase خود جایگزین کنید.
- Browserbase هنگام اتصال WebSocket به‌طور خودکار یک نشست مرورگر ایجاد می‌کند، بنابراین هیچ مرحله دستی برای ایجاد نشست لازم نیست.
- پلن رایگان یک نشست هم‌زمان و یک ساعت مرورگر در ماه را مجاز می‌کند.
  برای محدودیت‌های پلن‌های پولی، [pricing](https://www.browserbase.com/pricing) را ببینید.
- برای مرجع کامل API، راهنماهای SDK و مثال‌های یکپارچه‌سازی، [مستندات Browserbase](https://docs.browserbase.com) را ببینید.

## امنیت

ایده‌های کلیدی:

- کنترل مرورگر فقط local loopback است؛ جریان‌های دسترسی از طریق احراز هویت Gateway یا جفت‌سازی Node عبور می‌کنند.
- HTTP API مرورگر local loopback مستقل فقط از **احراز هویت با راز مشترک** استفاده می‌کند:
  احراز هویت bearer با توکن Gateway، `x-openclaw-password`، یا احراز هویت HTTP Basic با
  گذرواژه پیکربندی‌شده Gateway.
- سرآیندهای هویت Tailscale Serve و `gateway.auth.mode: "trusted-proxy"`
  این API مرورگر local loopback مستقل را
  **احراز هویت نمی‌کنند**.
- اگر کنترل مرورگر فعال باشد و هیچ احراز هویت با راز مشترکی پیکربندی نشده باشد، OpenClaw
  هنگام راه‌اندازی `gateway.auth.token` را به‌صورت خودکار تولید می‌کند و آن را در پیکربندی ماندگار می‌سازد.
- وقتی `gateway.auth.mode` از قبل
  `password`، `none`، یا `trusted-proxy` باشد، OpenClaw آن توکن را به‌صورت خودکار تولید **نمی‌کند**.
- Gateway و هر میزبان Node را روی یک شبکه خصوصی (Tailscale) نگه دارید؛ از در معرض عموم قرار دادن آن‌ها خودداری کنید.
- URLها/توکن‌های CDP راه‌دور را مانند اسرار مدیریت کنید؛ env vars یا مدیر اسرار را ترجیح دهید.

نکته‌های CDP راه‌دور:

- در صورت امکان، endpointهای رمزگذاری‌شده (HTTPS یا WSS) و توکن‌های کوتاه‌عمر را ترجیح دهید.
- از قرار دادن مستقیم توکن‌های بلندمدت در فایل‌های پیکربندی خودداری کنید.

## پروفایل‌ها (چندمرورگری)

OpenClaw از چند پروفایل نام‌دار (پیکربندی‌های مسیریابی) پشتیبانی می‌کند. پروفایل‌ها می‌توانند چنین باشند:

- **openclaw-managed**: یک نمونه مرورگر اختصاصی مبتنی بر Chromium با دایرکتوری داده کاربر خودش + پورت CDP
- **remote**: یک URL صریح CDP (مرورگر مبتنی بر Chromium که جای دیگری اجرا می‌شود)
- **existing session**: پروفایل Chrome موجود شما از طریق اتصال خودکار Chrome DevTools MCP

پیش‌فرض‌ها:

- اگر پروفایل `openclaw` موجود نباشد، به‌صورت خودکار ساخته می‌شود.
- پروفایل `user` برای اتصال به نشست موجود Chrome MCP به‌صورت توکار وجود دارد.
- پروفایل‌های نشست موجود، فراتر از `user`، اختیاری هستند؛ آن‌ها را با `--driver existing-session` بسازید.
- پورت‌های CDP محلی به‌طور پیش‌فرض از **18800-18899** تخصیص داده می‌شوند.
- حذف یک پروفایل، دایرکتوری داده محلی آن را به Trash منتقل می‌کند.

همه endpointهای کنترل `?profile=<name>` را می‌پذیرند؛ CLI از `--browser-profile` استفاده می‌کند.

## نشست موجود از طریق Chrome DevTools MCP

OpenClaw همچنین می‌تواند از طریق سرور رسمی Chrome DevTools MCP به یک پروفایل مرورگر مبتنی بر Chromium در حال اجرا متصل شود. این کار تب‌ها و وضعیت ورود
از قبل باز در آن پروفایل مرورگر را دوباره استفاده می‌کند.

منابع رسمی پیش‌زمینه و راه‌اندازی:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

پروفایل توکار:

- `user`

اختیاری: اگر نام، رنگ، یا دایرکتوری داده مرورگر متفاوتی می‌خواهید، پروفایل نشست موجود سفارشی خودتان را بسازید.

رفتار پیش‌فرض:

- پروفایل توکار `user` از اتصال خودکار Chrome MCP استفاده می‌کند که پروفایل محلی پیش‌فرض Google Chrome را هدف می‌گیرد.

برای Brave، Edge، Chromium، یا پروفایل غیرپیش‌فرض Chrome از `userDataDir` استفاده کنید.
`~` به دایرکتوری خانه سیستم‌عامل شما گسترش می‌یابد:

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

سپس در مرورگر متناظر:

1. صفحه inspect آن مرورگر را برای اشکال‌زدایی راه‌دور باز کنید.
2. اشکال‌زدایی راه‌دور را فعال کنید.
3. مرورگر را در حال اجرا نگه دارید و وقتی OpenClaw متصل می‌شود، اعلان تأیید اتصال را تأیید کنید.

صفحه‌های inspect رایج:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

آزمون smoke اتصال زنده:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

موفقیت چه شکلی دارد:

- `status` نشان می‌دهد `driver: existing-session`
- `status` نشان می‌دهد `transport: chrome-mcp`
- `status` نشان می‌دهد `running: true`
- `tabs` تب‌های مرورگر از قبل باز شما را فهرست می‌کند
- `snapshot` از تب زنده انتخاب‌شده ref برمی‌گرداند

اگر اتصال کار نکرد، چه چیزهایی را بررسی کنید:

- مرورگر هدف مبتنی بر Chromium نسخه `144+` است
- اشکال‌زدایی راه‌دور در صفحه inspect آن مرورگر فعال است
- مرورگر اعلان رضایت اتصال را نشان داده و شما آن را پذیرفته‌اید
- `openclaw doctor` پیکربندی قدیمی مرورگر مبتنی بر افزونه را مهاجرت می‌دهد و بررسی می‌کند که
  Chrome برای پروفایل‌های اتصال خودکار پیش‌فرض به‌صورت محلی نصب شده باشد، اما نمی‌تواند
  اشکال‌زدایی راه‌دور سمت مرورگر را برای شما فعال کند

استفاده عامل:

- وقتی به وضعیت مرورگر واردشده کاربر نیاز دارید، از `profile="user"` استفاده کنید.
- اگر از پروفایل نشست موجود سفارشی استفاده می‌کنید، همان نام پروفایل صریح را پاس دهید.
- این حالت را فقط وقتی انتخاب کنید که کاربر پشت رایانه حضور دارد تا اعلان اتصال را تأیید کند.
- Gateway یا میزبان Node می‌تواند `npx chrome-devtools-mcp@latest --autoConnect` را spawn کند

یادداشت‌ها:

- این مسیر از پروفایل ایزوله `openclaw` پرریسک‌تر است، چون می‌تواند
  داخل نشست مرورگر واردشده شما عمل کند.
- OpenClaw مرورگر را برای این driver راه‌اندازی نمی‌کند؛ فقط متصل می‌شود.
- OpenClaw اینجا از جریان رسمی Chrome DevTools MCP `--autoConnect` استفاده می‌کند. اگر
  `userDataDir` تنظیم شده باشد، برای هدف‌گیری آن دایرکتوری داده کاربر عبور داده می‌شود.
- نشست موجود می‌تواند روی میزبان انتخاب‌شده یا از طریق یک
  Node مرورگر متصل attach شود. اگر Chrome جای دیگری قرار دارد و هیچ Node مرورگری متصل نیست، به‌جای آن از
  CDP راه‌دور یا میزبان Node استفاده کنید.

### راه‌اندازی سفارشی Chrome MCP

وقتی جریان پیش‌فرض
`npx chrome-devtools-mcp@latest` چیزی نیست که می‌خواهید (میزبان‌های آفلاین،
نسخه‌های پین‌شده، باینری‌های vendored)، سرور Chrome DevTools MCP ایجادشده را برای هر پروفایل override کنید:

| فیلد        | کاری که انجام می‌دهد                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | فایل اجرایی برای spawn کردن به‌جای `npx`. همان‌طور که هست resolve می‌شود؛ مسیرهای مطلق رعایت می‌شوند.                                          |
| `mcpArgs`    | آرایه آرگومان که عیناً به `mcpCommand` پاس داده می‌شود. آرگومان‌های پیش‌فرض `chrome-devtools-mcp@latest --autoConnect` را جایگزین می‌کند. |

وقتی `cdpUrl` روی یک پروفایل نشست موجود تنظیم شده باشد، OpenClaw از
`--autoConnect` صرف‌نظر می‌کند و endpoint را به‌صورت خودکار به Chrome MCP forward می‌کند:

- `http(s)://...` → `--browserUrl <url>` (endpoint کشف HTTP DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (CDP WebSocket مستقیم).

پرچم‌های endpoint و `userDataDir` را نمی‌توان ترکیب کرد: وقتی `cdpUrl` تنظیم شده باشد،
`userDataDir` برای راه‌اندازی Chrome MCP نادیده گرفته می‌شود، چون Chrome MCP به
مرورگر در حال اجرا پشت endpoint متصل می‌شود، نه اینکه یک دایرکتوری
پروفایل را باز کند.

<Accordion title="محدودیت‌های قابلیت نشست موجود">

در مقایسه با پروفایل مدیریت‌شده `openclaw`، driverهای نشست موجود محدودتر هستند:

- **اسکرین‌شات‌ها** - ثبت صفحه و ثبت عنصر با `--ref` کار می‌کند؛ selectorهای CSS `--element` کار نمی‌کنند. `--full-page` نمی‌تواند با `--ref` یا `--element` ترکیب شود. Playwright برای اسکرین‌شات‌های صفحه یا عنصر مبتنی بر ref لازم نیست.
- **کنش‌ها** - `click`، `type`، `hover`، `scrollIntoView`، `drag`، و `select` به refهای snapshot نیاز دارند (بدون selectorهای CSS). `click-coords` روی مختصات viewport قابل مشاهده کلیک می‌کند و به ref snapshot نیاز ندارد. `click` فقط دکمه چپ است. `type` از `slowly=true` پشتیبانی نمی‌کند؛ از `fill` یا `press` استفاده کنید. `press` از `delayMs` پشتیبانی نمی‌کند. `type`، `hover`، `scrollIntoView`، `drag`، `select`، `fill`، و `evaluate` از timeoutهای جداگانه برای هر فراخوانی پشتیبانی نمی‌کنند. `select` یک مقدار واحد را می‌پذیرد.
- **انتظار / بارگذاری / dialog** - `wait --url` از الگوهای دقیق، زیررشته، و glob پشتیبانی می‌کند؛ `wait --load networkidle` پشتیبانی نمی‌شود. hookهای بارگذاری به `ref` یا `inputRef` نیاز دارند، هر بار یک فایل، بدون CSS `element`. hookهای dialog از overrideهای timeout پشتیبانی نمی‌کنند.
- **قابلیت‌های فقط مدیریت‌شده** - کنش‌های دسته‌ای، خروجی PDF، رهگیری دانلود، و `responsebody` همچنان به مسیر مرورگر مدیریت‌شده نیاز دارند.

</Accordion>

## تضمین‌های ایزوله‌سازی

- **دایرکتوری داده کاربر اختصاصی**: هرگز به پروفایل مرورگر شخصی شما دست نمی‌زند.
- **پورت‌های اختصاصی**: از `9222` اجتناب می‌کند تا با جریان‌های کاری توسعه برخورد نکند.
- **کنترل تب قطعی**: `tabs` ابتدا `suggestedTargetId` را برمی‌گرداند، سپس
  handleهای پایدار `tabId` مانند `t1`، labelهای اختیاری، و `targetId` خام را.
  Agentها باید از `suggestedTargetId` دوباره استفاده کنند؛ شناسه‌های خام برای
  اشکال‌زدایی و سازگاری همچنان در دسترس می‌مانند.

## انتخاب مرورگر

هنگام راه‌اندازی محلی، OpenClaw اولین مورد موجود را انتخاب می‌کند:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

می‌توانید با `browser.executablePath` override کنید.

پلتفرم‌ها:

- macOS: `/Applications` و `~/Applications` را بررسی می‌کند.
- Linux: مکان‌های رایج Chrome/Brave/Edge/Chromium زیر `/usr/bin`،
  `/snap/bin`، `/opt/google`، `/opt/brave.com`، `/usr/lib/chromium`، و
  `/usr/lib/chromium-browser` را بررسی می‌کند.
- Windows: مکان‌های نصب رایج را بررسی می‌کند.

## Control API (اختیاری)

برای اسکریپت‌نویسی و اشکال‌زدایی، Gateway یک
**Control API کوچک HTTP فقط local loopback** به‌همراه CLI متناظر `openclaw browser` ارائه می‌کند (snapshotها، refها، تقویت‌کننده‌های wait،
خروجی JSON، جریان‌های کاری اشکال‌زدایی). برای مرجع کامل، [Browser control API](/fa/tools/browser-control) را ببینید.

## عیب‌یابی

برای مشکلات ویژه Linux (به‌ویژه snap Chromium)،
[Browser troubleshooting](/fa/tools/browser-linux-troubleshooting) را ببینید.

برای راه‌اندازی‌های split-host با WSL2 Gateway + Windows Chrome،
[WSL2 + Windows + remote Chrome CDP troubleshooting](/fa/tools/browser-wsl2-windows-remote-cdp-troubleshooting) را ببینید.

### شکست راه‌اندازی CDP در برابر مسدودسازی SSRF ناوبری

این‌ها دسته‌های شکست متفاوتی هستند و به مسیرهای کد متفاوتی اشاره می‌کنند.

- **شکست راه‌اندازی یا readiness مربوط به CDP** یعنی OpenClaw نمی‌تواند تأیید کند که صفحه کنترل مرورگر سالم است.
- **مسدودسازی SSRF ناوبری** یعنی صفحه کنترل مرورگر سالم است، اما هدف ناوبری صفحه توسط policy رد می‌شود.

نمونه‌های رایج:

- شکست راه‌اندازی یا readiness مربوط به CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` وقتی یک
    سرویس CDP خارجی local loopback بدون `attachOnly: true` پیکربندی شده باشد
- مسدودسازی SSRF ناوبری:
  - جریان‌های `open`، `navigate`، snapshot، یا باز کردن تب با خطای policy مرورگر/شبکه شکست می‌خورند در حالی که `start` و `tabs` همچنان کار می‌کنند

از این توالی حداقلی برای جدا کردن این دو استفاده کنید:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

نحوه خواندن نتایج:

- اگر `start` با `not reachable after start` شکست خورد، ابتدا readiness مربوط به CDP را عیب‌یابی کنید.
- اگر `start` موفق شد اما `tabs` شکست خورد، صفحه کنترل همچنان ناسالم است. این را یک مشکل دسترسی‌پذیری CDP در نظر بگیرید، نه مشکل ناوبری صفحه.
- اگر `start` و `tabs` موفق شدند اما `open` یا `navigate` شکست خورد، صفحه کنترل مرورگر بالا است و شکست در policy ناوبری یا صفحه هدف است.
- اگر `start`، `tabs`، و `open` همگی موفق شدند، مسیر پایه کنترل مرورگر مدیریت‌شده سالم است.

جزئیات رفتاری مهم:

- پیکربندی مرورگر به‌طور پیش‌فرض، حتی وقتی `browser.ssrfPolicy` را پیکربندی نمی‌کنید، از یک شیء policy شکست‌بسته SSRF استفاده می‌کند.
- برای پروفایل مدیریت‌شده local loopback `openclaw`، بررسی‌های سلامت CDP عمداً اجرای دسترسی‌پذیری SSRF مرورگر را برای صفحه کنترل محلی خود OpenClaw رد می‌کنند.
- محافظت ناوبری جداست. نتیجه موفق `start` یا `tabs` به این معنی نیست که هدف بعدی `open` یا `navigate` مجاز است.

راهنمای امنیتی:

- به‌طور پیش‌فرض policy SSRF مرورگر را شل **نکنید**.
- به‌جای دسترسی گسترده به شبکه خصوصی، استثناهای محدود میزبان مانند `hostnameAllowlist` یا `allowedHostnames` را ترجیح دهید.
- از `dangerouslyAllowPrivateNetwork: true` فقط در محیط‌های عمداً قابل اعتماد استفاده کنید که دسترسی مرورگر به شبکه خصوصی لازم و بازبینی‌شده است.

## ابزارهای Agent + نحوه کار کنترل

Agent برای خودکارسازی مرورگر **یک ابزار** دریافت می‌کند:

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

نحوه نگاشت آن:

- `browser snapshot` یک درخت رابط کاربری پایدار (AI یا ARIA) برمی‌گرداند.
- `browser act` از شناسه‌های `ref` در snapshot برای کلیک/تایپ/کشیدن/انتخاب استفاده می‌کند.
- `browser screenshot` پیکسل‌ها را ثبت می‌کند (کل صفحه، عنصر، یا ارجاع‌های برچسب‌دار).
- `browser doctor` آمادگی Gateway، Plugin، پروفایل، مرورگر و زبانه را بررسی می‌کند.
- `browser` می‌پذیرد:
  - `profile` برای انتخاب یک پروفایل مرورگر نام‌گذاری‌شده (openclaw، chrome، یا CDP راه‌دور).
  - `target` (`sandbox` | `host` | `node`) برای انتخاب محل اجرای مرورگر.
  - در نشست‌های sandbox‌شده، `target: "host"` به `agents.defaults.sandbox.browser.allowHostControl=true` نیاز دارد.
  - اگر `target` حذف شود: نشست‌های sandbox‌شده به‌طور پیش‌فرض از `sandbox` استفاده می‌کنند، و نشست‌های غیر sandbox به‌طور پیش‌فرض از `host`.
  - اگر یک node با قابلیت مرورگر متصل باشد، ابزار ممکن است به‌طور خودکار به آن مسیریابی کند، مگر اینکه `target="host"` یا `target="node"` را ثابت کنید.

این کار عامل را قطعی نگه می‌دارد و از selectorهای شکننده جلوگیری می‌کند.

## مرتبط

- [نمای کلی ابزارها](/fa/tools) - همه ابزارهای عامل در دسترس
- [Sandboxing](/fa/gateway/sandboxing) - کنترل مرورگر در محیط‌های sandbox‌شده
- [امنیت](/fa/gateway/security) - ریسک‌های کنترل مرورگر و سخت‌سازی
