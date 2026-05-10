---
read_when:
    - افزودن خودکارسازی مرورگرِ کنترل‌شده توسط عامل
    - اشکال‌زدایی از اینکه چرا openclaw با Chrome خودتان تداخل ایجاد می‌کند
    - پیاده‌سازی تنظیمات مرورگر + چرخهٔ حیات در برنامهٔ macOS
summary: سرویس کنترل مرورگر یکپارچه + فرمان‌های کنش
title: مرورگر (مدیریت‌شده توسط OpenClaw)
x-i18n:
    generated_at: "2026-05-10T20:08:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51a78cc860ef4951548aba1e60bc686dfc19c156f69b6a59cf7c671eeaa67a0a
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw می‌تواند یک **نمایهٔ اختصاصی Chrome/Brave/Edge/Chromium** را اجرا کند که عامل آن را کنترل می‌کند.
این نمایه از مرورگر شخصی شما جدا است و از طریق یک سرویس کنترل محلی کوچک
درون Gateway مدیریت می‌شود (فقط loopback).

نمای مبتدی:

- آن را به‌صورت یک **مرورگر جداگانه و فقط مخصوص عامل** در نظر بگیرید.
- نمایهٔ `openclaw` به نمایهٔ مرورگر شخصی شما **دست نمی‌زند**.
- عامل می‌تواند در یک مسیر امن **زبانه باز کند، صفحه‌ها را بخواند، کلیک کند و تایپ کند**.
- نمایهٔ داخلی `user` از طریق Chrome MCP به نشست واقعی Chrome واردشدهٔ شما متصل می‌شود.

## آنچه دریافت می‌کنید

- یک نمایهٔ مرورگر جداگانه با نام **openclaw** (به‌طور پیش‌فرض با تأکید نارنجی).
- کنترل قطعی زبانه‌ها (فهرست/باز کردن/تمرکز/بستن).
- کنش‌های عامل (کلیک/تایپ/کشیدن/انتخاب)، نماگرفت‌ها، تصاویر صفحه، PDFها.
- یک Skill همراه `browser-automation` که وقتی Plugin مرورگر فعال باشد، چرخهٔ بازیابی نماگرفت،
  زبانهٔ پایدار، ارجاع منقضی، و مانع دستی را به عامل‌ها آموزش می‌دهد.
- پشتیبانی اختیاری از چند نمایه (`openclaw`، `work`، `remote`، ...).

این مرورگر، مرورگر روزمرهٔ شما **نیست**. این یک سطح امن و جداگانه برای
خودکارسازی و راستی‌آزمایی عامل است.

## شروع سریع

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

اگر پیام «Browser disabled» دریافت کردید، آن را در پیکربندی فعال کنید (پایین را ببینید) و
Gateway را دوباره راه‌اندازی کنید.

اگر `openclaw browser` به‌طور کامل وجود ندارد، یا عامل می‌گوید ابزار مرورگر
در دسترس نیست، به [فرمان یا ابزار مرورگر موجود نیست](/fa/tools/browser#missing-browser-command-or-tool) بروید.

## کنترل Plugin

ابزار پیش‌فرض `browser` یک Plugin همراه است. برای جایگزین‌کردن آن با Plugin دیگری که همان نام ابزار `browser` را ثبت می‌کند، آن را غیرفعال کنید:

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

پیش‌فرض‌ها هم به `plugins.entries.browser.enabled` **و هم** به `browser.enabled=true` نیاز دارند. غیرفعال‌کردن فقط Plugin، `openclaw browser` CLI، متد Gateway با نام `browser.request`، ابزار عامل، و سرویس کنترل را به‌عنوان یک واحد حذف می‌کند؛ پیکربندی `browser.*` شما برای جایگزین دست‌نخورده می‌ماند.

تغییرات پیکربندی مرورگر به راه‌اندازی دوبارهٔ Gateway نیاز دارند تا Plugin بتواند سرویس خود را دوباره ثبت کند.

## راهنمای عامل

نکتهٔ نمایهٔ ابزار: `tools.profile: "coding"` شامل `web_search` و
`web_fetch` است، اما ابزار کامل `browser` را شامل نمی‌شود. اگر عامل یا یک
زیرعامل ایجادشده باید از خودکارسازی مرورگر استفاده کند، مرورگر را در مرحلهٔ نمایه
اضافه کنید:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

برای یک عامل واحد، از `agents.list[].tools.alsoAllow: ["browser"]` استفاده کنید.
`tools.subagents.tools.allow: ["browser"]` به‌تنهایی کافی نیست، چون سیاست زیرعامل
پس از پالایش نمایه اعمال می‌شود.

Plugin مرورگر دو سطح راهنمای عامل ارائه می‌کند:

- توضیح ابزار `browser` قرارداد فشردهٔ همیشه‌فعال را حمل می‌کند: نمایهٔ درست را انتخاب کنید،
  ارجاع‌ها را روی همان زبانه نگه دارید، از `tabId`/برچسب‌ها برای هدف‌گیری زبانه
  استفاده کنید، و برای کار چندمرحله‌ای Skill مرورگر را بارگذاری کنید.
- Skill همراه `browser-automation` چرخهٔ عملیاتی طولانی‌تر را حمل می‌کند:
  ابتدا وضعیت/زبانه‌ها را بررسی کنید، زبانه‌های وظیفه را برچسب‌گذاری کنید، پیش از عمل نماگرفت بگیرید،
  پس از تغییرات UI دوباره نماگرفت بگیرید، ارجاع‌های منقضی را یک‌بار بازیابی کنید، و ورود/2FA/captcha یا
  موانع دوربین/میکروفون را به‌جای حدس‌زدن، به‌عنوان اقدام دستی گزارش کنید.

Skills همراه Plugin وقتی Plugin فعال باشد در Skills در دسترس عامل فهرست می‌شوند.
دستورالعمل‌های کامل Skill بر حسب تقاضا بارگذاری می‌شوند، بنابراین نوبت‌های معمول
هزینهٔ کامل توکن را پرداخت نمی‌کنند.

## فرمان یا ابزار مرورگر موجود نیست

اگر پس از ارتقا `openclaw browser` ناشناخته است، `browser.request` موجود نیست، یا عامل ابزار مرورگر را ناموجود گزارش می‌کند، علت معمول یک فهرست `plugins.allow` است که `browser` را جا انداخته و هیچ بلوک پیکربندی ریشهٔ `browser` وجود ندارد. آن را اضافه کنید:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

یک بلوک ریشهٔ صریح `browser`، برای مثال `browser.enabled=true` یا `browser.profiles.<name>`، حتی زیر یک `plugins.allow` محدودکننده نیز Plugin مرورگر همراه را فعال می‌کند و با رفتار پیکربندی کانال هم‌خوان است. `plugins.entries.browser.enabled=true` و `tools.alsoAllow: ["browser"]` به‌تنهایی جایگزین عضویت در فهرست مجاز نمی‌شوند. حذف کامل `plugins.allow` نیز پیش‌فرض را بازمی‌گرداند.

## نمایه‌ها: `openclaw` در برابر `user`

- `openclaw`: مرورگر مدیریت‌شده و جداگانه (بدون نیاز به افزونه).
- `user`: نمایهٔ اتصال داخلی Chrome MCP برای نشست **واقعی Chrome واردشدهٔ**
  شما.

برای فراخوانی‌های ابزار مرورگر عامل:

- پیش‌فرض: از مرورگر جداگانهٔ `openclaw` استفاده کنید.
- وقتی نشست‌های واردشدهٔ موجود اهمیت دارند و کاربر پشت رایانه است تا هر اعلان اتصال را کلیک/تأیید کند،
  `profile="user"` را ترجیح دهید.
- وقتی یک حالت مرورگر مشخص می‌خواهید، `profile` بازنویسی صریح است.

اگر می‌خواهید حالت مدیریت‌شده به‌طور پیش‌فرض باشد، `browser.defaultProfile: "openclaw"` را تنظیم کنید.

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

<Accordion title="Ports and reachability">

- سرویس کنترل به loopback روی پورتی متصل می‌شود که از `gateway.port` مشتق شده است (پیش‌فرض `18791` = gateway + 2). بازنویسی `gateway.port` یا `OPENCLAW_GATEWAY_PORT` پورت‌های مشتق‌شده را در همان خانواده جابه‌جا می‌کند.
- نمایه‌های محلی `openclaw` مقدارهای `cdpPort`/`cdpUrl` را خودکار اختصاص می‌دهند؛ این‌ها را فقط برای CDP راه‌دور تنظیم کنید. وقتی `cdpUrl` تنظیم نشده باشد، به‌طور پیش‌فرض به پورت CDP محلی مدیریت‌شده اشاره می‌کند.
- `remoteCdpTimeoutMs` برای بررسی‌های دسترسی‌پذیری HTTP مربوط به CDP راه‌دور و `attachOnly`
  و درخواست‌های HTTP بازکردن زبانه اعمال می‌شود؛ `remoteCdpHandshakeTimeoutMs` برای
  دست‌دهی‌های WebSocket مربوط به CDP آن‌ها اعمال می‌شود.
- `localLaunchTimeoutMs` بودجهٔ زمانی برای یک فرایند Chrome مدیریت‌شدهٔ محلیِ راه‌اندازی‌شده است
  تا نقطهٔ پایانی HTTP مربوط به CDP خود را ارائه کند. `localCdpReadyTimeoutMs` بودجهٔ
  پیگیری برای آماده‌بودن WebSocket مربوط به CDP پس از کشف فرایند است.
  این مقدارها را روی Raspberry Pi، VPSهای ضعیف، یا سخت‌افزار قدیمی‌تر که Chromium
  کند شروع می‌شود افزایش دهید. مقدارها باید عددهای صحیح مثبت تا `120000` میلی‌ثانیه باشند؛ مقدارهای
  پیکربندی نامعتبر رد می‌شوند.
- شکست‌های تکراری راه‌اندازی/آمادگی Chrome مدیریت‌شده به‌ازای هر
  نمایه مدارشکنی می‌شوند. پس از چند شکست متوالی، OpenClaw به‌جای ایجاد Chromium در هر فراخوانی ابزار مرورگر،
  تلاش‌های راه‌اندازی جدید را برای مدت کوتاهی متوقف می‌کند. مشکل راه‌اندازی را برطرف کنید،
  اگر مرورگر لازم نیست آن را غیرفعال کنید، یا پس از تعمیر Gateway را دوباره راه‌اندازی کنید.
- `actionTimeoutMs` بودجهٔ پیش‌فرض برای درخواست‌های `act` مرورگر است وقتی فراخواننده `timeoutMs` را ارسال نکند. انتقال کلاینت یک پنجرهٔ مهلت کوچک اضافه می‌کند تا انتظارهای طولانی بتوانند به پایان برسند و در مرز HTTP زمانشان تمام نشود.
- `tabCleanup` پاک‌سازی با بهترین تلاش برای زبانه‌هایی است که توسط نشست‌های مرورگر عامل اصلی باز شده‌اند. پاک‌سازی چرخهٔ عمر زیرعامل، cron، و ACP همچنان زبانه‌های ردیابی‌شدهٔ صریح خود را در پایان نشست می‌بندد؛ نشست‌های اصلی زبانه‌های فعال را قابل استفادهٔ دوباره نگه می‌دارند، سپس زبانه‌های ردیابی‌شدهٔ بیکار یا اضافی را در پس‌زمینه می‌بندند.

</Accordion>

<Accordion title="SSRF policy">

- پیمایش مرورگر و بازکردن زبانه پیش از پیمایش با محافظ SSRF بررسی می‌شوند و سپس با بهترین تلاش روی URL نهایی `http(s)` دوباره بررسی می‌شوند.
- در حالت سخت‌گیرانهٔ SSRF، کشف نقطهٔ پایانی CDP راه‌دور و کاوش‌های `/json/version` (`cdpUrl`) نیز بررسی می‌شوند.
- متغیرهای محیطی Gateway/ارائه‌دهنده شامل `HTTP_PROXY`، `HTTPS_PROXY`، `ALL_PROXY`، و `NO_PROXY` به‌طور خودکار مرورگر مدیریت‌شدهٔ OpenClaw را از پروکسی عبور نمی‌دهند. Chrome مدیریت‌شده به‌طور پیش‌فرض مستقیم راه‌اندازی می‌شود تا تنظیمات پروکسی ارائه‌دهنده بررسی‌های SSRF مرورگر را تضعیف نکند.
- برای عبور خود مرورگر مدیریت‌شده از پروکسی، پرچم‌های صریح پروکسی Chrome را از طریق `browser.extraArgs` ارسال کنید، مانند `--proxy-server=...` یا `--proxy-pac-url=...`. حالت سخت‌گیرانهٔ SSRF مسیر‌دهی صریح پروکسی مرورگر را مسدود می‌کند مگر اینکه دسترسی مرورگر به شبکهٔ خصوصی عمداً فعال شده باشد.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` به‌طور پیش‌فرض خاموش است؛ فقط وقتی دسترسی مرورگر به شبکهٔ خصوصی عمداً مورد اعتماد است آن را فعال کنید.
- `browser.ssrfPolicy.allowPrivateNetwork` همچنان به‌عنوان نام مستعار قدیمی پشتیبانی می‌شود.

</Accordion>

<Accordion title="Profile behavior">

- `attachOnly: true` یعنی هرگز مرورگر محلی را اجرا نکن؛ فقط اگر یکی از قبل در حال اجراست به آن متصل شو.
- `headless` می‌تواند به‌صورت سراسری یا برای هر پروفایل مدیریت‌شدهٔ محلی تنظیم شود. مقدارهای مخصوص هر پروفایل، `browser.headless` را بازنویسی می‌کنند؛ بنابراین یک پروفایل اجراشدهٔ محلی می‌تواند headless بماند، در حالی که پروفایل دیگری قابل مشاهده باقی بماند.
- `POST /start?headless=true` و `openclaw browser start --headless` برای پروفایل‌های مدیریت‌شدهٔ محلی، اجرای headless یک‌باره درخواست می‌کنند، بدون اینکه `browser.headless` یا پیکربندی پروفایل بازنویسی شود. پروفایل‌های نشست موجود، فقط-اتصال، و CDP راه‌دور این بازنویسی را رد می‌کنند، چون OpenClaw این فرایندهای مرورگر را اجرا نمی‌کند.
- روی میزبان‌های Linux بدون `DISPLAY` یا `WAYLAND_DISPLAY`، وقتی نه محیط و نه پیکربندی پروفایل/سراسری به‌صراحت حالت headed را انتخاب نکرده باشند، پروفایل‌های مدیریت‌شدهٔ محلی به‌طور خودکار به‌صورت headless پیش‌فرض می‌شوند. `openclaw browser status --json` مقدار `headlessSource` را به‌صورت `env`، `profile`، `config`، `request`، `linux-display-fallback`، یا `default` گزارش می‌کند.
- `OPENCLAW_BROWSER_HEADLESS=1` اجرای مدیریت‌شدهٔ محلی را برای فرایند فعلی به‌اجبار headless می‌کند. `OPENCLAW_BROWSER_HEADLESS=0` برای شروع‌های معمولی حالت headed را اجباری می‌کند و روی میزبان‌های Linux بدون سرور نمایش، خطایی قابل اقدام برمی‌گرداند؛ یک درخواست صریح `start --headless` همچنان برای همان اجرای واحد اولویت دارد.
- `executablePath` می‌تواند به‌صورت سراسری یا برای هر پروفایل مدیریت‌شدهٔ محلی تنظیم شود. مقدارهای مخصوص هر پروفایل، `browser.executablePath` را بازنویسی می‌کنند؛ بنابراین پروفایل‌های مدیریت‌شدهٔ متفاوت می‌توانند مرورگرهای متفاوت مبتنی بر Chromium را اجرا کنند. هر دو فرم، `~` را برای پوشهٔ خانهٔ سیستم‌عامل شما می‌پذیرند.
- `color` (در سطح بالا و برای هر پروفایل) رابط کاربری مرورگر را رنگ‌آمیزی می‌کند تا بتوانید ببینید کدام پروفایل فعال است.
- پروفایل پیش‌فرض `openclaw` است (مدیریت‌شدهٔ مستقل). برای انتخاب مرورگر کاربر واردشده، از `defaultProfile: "user"` استفاده کنید.
- ترتیب تشخیص خودکار: مرورگر پیش‌فرض سیستم اگر مبتنی بر Chromium باشد؛ در غیر این صورت Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` به‌جای CDP خام، از Chrome DevTools MCP استفاده می‌کند. برای آن درایور `cdpUrl` تنظیم نکنید.
- وقتی یک پروفایل نشست موجود باید به یک پروفایل کاربری غیرپیش‌فرض Chromium (Brave، Edge، و غیره) متصل شود، `browser.profiles.<name>.userDataDir` را تنظیم کنید. این مسیر نیز `~` را برای پوشهٔ خانهٔ سیستم‌عامل شما می‌پذیرد.

</Accordion>

</AccordionGroup>

## استفاده از Brave یا مرورگر دیگری مبتنی بر Chromium

اگر مرورگر **پیش‌فرض سیستم** شما مبتنی بر Chromium باشد (Chrome/Brave/Edge/etc)،
OpenClaw به‌طور خودکار از آن استفاده می‌کند. برای بازنویسی تشخیص خودکار،
`browser.executablePath` را تنظیم کنید. مقدارهای `executablePath` در سطح بالا
و برای هر پروفایل، `~` را برای پوشهٔ خانهٔ سیستم‌عامل شما می‌پذیرند:

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

`executablePath` مخصوص هر پروفایل فقط بر پروفایل‌های مدیریت‌شدهٔ محلی اثر می‌گذارد که OpenClaw
آن‌ها را اجرا می‌کند. پروفایل‌های `existing-session` در عوض به مرورگری که از قبل در حال اجراست
متصل می‌شوند، و پروفایل‌های CDP راه‌دور از مرورگر پشت `cdpUrl` استفاده می‌کنند.

## کنترل محلی در برابر راه‌دور

- **کنترل محلی (پیش‌فرض):** Gateway سرویس کنترل local loopback را شروع می‌کند و می‌تواند یک مرورگر محلی اجرا کند.
- **کنترل راه‌دور (میزبان Node):** روی دستگاهی که مرورگر را دارد یک میزبان Node اجرا کنید؛ Gateway کنش‌های مرورگر را به آن proxy می‌کند.
- **CDP راه‌دور:** برای اتصال به یک مرورگر راه‌دور مبتنی بر Chromium، `browser.profiles.<name>.cdpUrl` (یا `browser.cdpUrl`) را تنظیم کنید. در این حالت، OpenClaw مرورگر محلی اجرا نخواهد کرد.
- برای سرویس‌های CDP مدیریت‌شدهٔ بیرونی روی loopback (برای مثال Browserless در Docker منتشرشده روی `127.0.0.1`)، `attachOnly: true` را نیز تنظیم کنید. CDP روی loopback بدون `attachOnly` به‌عنوان پروفایل مرورگر محلی مدیریت‌شده توسط OpenClaw در نظر گرفته می‌شود.
- `headless` فقط بر پروفایل‌های مدیریت‌شدهٔ محلی اثر می‌گذارد که OpenClaw اجرا می‌کند. این گزینه مرورگرهای نشست موجود یا CDP راه‌دور را دوباره راه‌اندازی یا تغییر نمی‌دهد.
- `executablePath` از همان قاعدهٔ پروفایل مدیریت‌شدهٔ محلی پیروی می‌کند. تغییر آن روی یک پروفایل مدیریت‌شدهٔ محلی در حال اجرا، آن پروفایل را برای راه‌اندازی دوباره/همگام‌سازی علامت‌گذاری می‌کند تا اجرای بعدی از باینری جدید استفاده کند.

رفتار توقف بسته به حالت پروفایل متفاوت است:

- پروفایل‌های مدیریت‌شدهٔ محلی: `openclaw browser stop` فرایند مرورگری را متوقف می‌کند که OpenClaw اجرا کرده است
- پروفایل‌های فقط-اتصال و CDP راه‌دور: `openclaw browser stop` نشست کنترل فعال را می‌بندد و بازنویسی‌های شبیه‌سازی Playwright/CDP (viewport، scheme رنگ، locale، timezone، حالت offline، و وضعیت‌های مشابه) را آزاد می‌کند، حتی اگر هیچ فرایند مرورگری توسط OpenClaw اجرا نشده باشد

URLهای CDP راه‌دور می‌توانند شامل احراز هویت باشند:

- توکن‌های query (برای مثال، `https://provider.example?token=<token>`)
- احراز هویت HTTP Basic (برای مثال، `https://user:pass@provider.example`)

OpenClaw هنگام فراخوانی endpointهای `/json/*` و هنگام اتصال به WebSocket مربوط به CDP،
احراز هویت را حفظ می‌کند. برای توکن‌ها، به‌جای commit کردن آن‌ها در فایل‌های پیکربندی،
از متغیرهای محیطی یا مدیرهای secrets استفاده کنید.

## proxy مرورگر Node (پیش‌فرض بدون پیکربندی)

اگر روی دستگاهی که مرورگر شما را دارد یک **میزبان Node** اجرا کنید، OpenClaw می‌تواند
فراخوانی‌های ابزار مرورگر را بدون هیچ پیکربندی اضافی مرورگر، به‌طور خودکار به آن Node
مسیردهی کند. این مسیر پیش‌فرض برای Gatewayهای راه‌دور است.

نکته‌ها:

- میزبان Node سرور کنترل مرورگر محلی خود را از طریق یک **دستور proxy** ارائه می‌کند.
- پروفایل‌ها از پیکربندی `browser.profiles` خود Node می‌آیند (همانند حالت محلی).
- `nodeHost.browserProxy.allowProfiles` اختیاری است. برای رفتار legacy/پیش‌فرض آن را خالی بگذارید: همهٔ پروفایل‌های پیکربندی‌شده از طریق proxy قابل دسترسی می‌مانند، از جمله مسیرهای ایجاد/حذف پروفایل.
- اگر `nodeHost.browserProxy.allowProfiles` را تنظیم کنید، OpenClaw آن را به‌عنوان مرز حداقل دسترسی در نظر می‌گیرد: فقط پروفایل‌های allowlist‌شده می‌توانند هدف قرار گیرند، و مسیرهای پایدار ایجاد/حذف پروفایل روی سطح proxy مسدود می‌شوند.
- اگر آن را نمی‌خواهید، غیرفعالش کنید:
  - روی Node: `nodeHost.browserProxy.enabled=false`
  - روی gateway: `gateway.nodes.browser.mode="off"`

## Browserless (CDP راه‌دور میزبانی‌شده)

[Browserless](https://browserless.io) یک سرویس میزبانی‌شدهٔ Chromium است که URLهای اتصال
CDP را روی HTTPS و WebSocket ارائه می‌کند. OpenClaw می‌تواند از هر دو فرم استفاده کند، اما
برای یک پروفایل مرورگر راه‌دور، ساده‌ترین گزینه URL مستقیم WebSocket از مستندات اتصال Browserless است.

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

نکته‌ها:

- `<BROWSERLESS_API_KEY>` را با توکن واقعی Browserless خود جایگزین کنید.
- endpoint منطقه‌ای را انتخاب کنید که با حساب Browserless شما مطابقت دارد (مستندات آن‌ها را ببینید).
- اگر Browserless یک URL پایهٔ HTTPS به شما بدهد، می‌توانید آن را برای اتصال مستقیم CDP به `wss://` تبدیل کنید، یا URL مربوط به HTTPS را نگه دارید و اجازه دهید OpenClaw `/json/version` را کشف کند.

### Browserless Docker روی همان میزبان

وقتی Browserless به‌صورت self-hosted در Docker اجرا می‌شود و OpenClaw روی میزبان اجرا می‌شود، با Browserless مانند یک سرویس CDP مدیریت‌شدهٔ بیرونی رفتار کنید:

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

نشانی موجود در `browser.profiles.browserless.cdpUrl` باید از فرایند
OpenClaw قابل دسترسی باشد. Browserless همچنین باید endpoint قابل دسترسی متناظر را تبلیغ کند؛
مقدار Browserless `EXTERNAL` را به همان پایهٔ WebSocket عمومی-برای-OpenClaw تنظیم کنید، مانند
`ws://127.0.0.1:3000`، `ws://browserless:3000`، یا یک نشانی شبکهٔ خصوصی پایدار Docker.
اگر `/json/version` مقدار `webSocketDebuggerUrl` را برگرداند که به نشانی‌ای اشاره می‌کند که
OpenClaw نمی‌تواند به آن برسد، HTTP مربوط به CDP ممکن است سالم به‌نظر برسد، در حالی که اتصال
WebSocket همچنان شکست می‌خورد.

برای یک پروفایل Browserless روی loopback، `attachOnly` را تنظیم‌نشده رها نکنید. بدون
`attachOnly`، OpenClaw پورت loopback را به‌عنوان یک پروفایل مرورگر مدیریت‌شدهٔ محلی
در نظر می‌گیرد و ممکن است گزارش کند که پورت در حال استفاده است اما متعلق به OpenClaw نیست.

## ارائه‌دهندگان CDP مستقیم WebSocket

برخی سرویس‌های مرورگر میزبانی‌شده، به‌جای کشف استاندارد CDP مبتنی بر HTTP (`/json/version`)،
یک endpoint **مستقیم WebSocket** ارائه می‌کنند. OpenClaw سه شکل URL مربوط به CDP را می‌پذیرد
و راهبرد اتصال درست را به‌طور خودکار انتخاب می‌کند:

- **کشف HTTP(S)** - `http://host[:port]` یا `https://host[:port]`.
  OpenClaw برای کشف URL اشکال‌زدای WebSocket، `/json/version` را فراخوانی می‌کند و سپس
  متصل می‌شود. هیچ fallback WebSocket وجود ندارد.
- **endpointهای مستقیم WebSocket** - `ws://host[:port]/devtools/<kind>/<id>` یا
  `wss://...` با یک مسیر `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw مستقیماً از طریق handshake مربوط به WebSocket متصل می‌شود و
  `/json/version` را کاملاً رد می‌کند.
- **ریشه‌های WebSocket خام** - `ws://host[:port]` یا `wss://host[:port]` بدون مسیر
  `/devtools/...` (مثلاً [Browserless](https://browserless.io)،
  [Browserbase](https://www.browserbase.com)). OpenClaw ابتدا کشف HTTP
  `/json/version` را امتحان می‌کند (با normalise کردن scheme به `http`/`https`)؛
  اگر کشف مقدار `webSocketDebuggerUrl` برگرداند، از آن استفاده می‌شود، در غیر این صورت OpenClaw
  به handshake مستقیم WebSocket در ریشهٔ خام fallback می‌کند. اگر endpoint تبلیغ‌شدهٔ
  WebSocket handshake مربوط به CDP را رد کند اما ریشهٔ خام پیکربندی‌شده آن را بپذیرد،
  OpenClaw به همان ریشه نیز fallback می‌کند. این کار اجازه می‌دهد یک `ws://` خام
  که به Chrome محلی اشاره می‌کند همچنان متصل شود، چون Chrome فقط upgradeهای WebSocket را
  روی مسیر خاص هر target از `/json/version` می‌پذیرد، در حالی که ارائه‌دهندگان میزبانی‌شده
  همچنان می‌توانند وقتی endpoint کشف آن‌ها URL کوتاه‌عمری تبلیغ می‌کند که برای Playwright CDP
  مناسب نیست، از endpoint ریشهٔ WebSocket خود استفاده کنند.

### Browserbase

[Browserbase](https://www.browserbase.com) یک پلتفرم ابری برای اجرای مرورگرهای
headless با حل داخلی CAPTCHA، حالت stealth، و proxyهای residential است.

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

نکته‌ها:

- [ثبت‌نام کنید](https://www.browserbase.com/sign-up) و **API Key** خود را
  از [داشبورد Overview](https://www.browserbase.com/overview) کپی کنید.
- `<BROWSERBASE_API_KEY>` را با کلید API واقعی Browserbase خود جایگزین کنید.
- Browserbase هنگام اتصال WebSocket به‌طور خودکار یک نشست مرورگر ایجاد می‌کند، بنابراین
  مرحلهٔ دستی ایجاد نشست لازم نیست.
- tier رایگان اجازهٔ یک نشست همزمان و یک ساعت مرورگر در ماه را می‌دهد.
  برای محدودیت‌های طرح‌های پولی، [pricing](https://www.browserbase.com/pricing) را ببینید.
- برای مرجع کامل API، راهنماهای SDK، و نمونه‌های یکپارچه‌سازی، [مستندات Browserbase](https://docs.browserbase.com) را ببینید.

## امنیت

ایده‌های کلیدی:

- کنترل مرورگر فقط loopback است؛ جریان‌های دسترسی از طریق احراز هویت Gateway یا جفت‌سازی Node انجام می‌شوند.
- API HTTP مرورگر loopback مستقل فقط از **احراز هویت با راز مشترک** استفاده می‌کند:
  احراز هویت bearer با توکن gateway، `x-openclaw-password`، یا احراز هویت HTTP Basic با
  گذرواژه gateway پیکربندی‌شده.
- سرآیندهای هویت Tailscale Serve و `gateway.auth.mode: "trusted-proxy"`
  این API مرورگر loopback مستقل را **احراز هویت نمی‌کنند**.
- اگر کنترل مرورگر فعال باشد و هیچ احراز هویت با راز مشترکی پیکربندی نشده باشد، OpenClaw
  برای همان آغازبه‌کار یک توکن Gateway فقط زمان اجرا تولید می‌کند. اگر کلاینت‌ها به یک راز پایدار در میان
  راه‌اندازی‌های مجدد نیاز دارند، `gateway.auth.token`، `gateway.auth.password`، `OPENCLAW_GATEWAY_TOKEN`، یا
  `OPENCLAW_GATEWAY_PASSWORD` را به‌صراحت پیکربندی کنید.
- وقتی `gateway.auth.mode` از قبل `password`، `none`، یا `trusted-proxy` باشد، OpenClaw
  آن توکن را به‌صورت خودکار تولید **نمی‌کند**.
- Gateway و هر میزبان Node را روی یک شبکه خصوصی (Tailscale) نگه دارید؛ از در معرض عموم قرار دادن آن‌ها پرهیز کنید.
- با URLها/توکن‌های CDP راه دور مانند رازها رفتار کنید؛ env varها یا یک مدیر رازها را ترجیح دهید.

نکات CDP راه دور:

- در صورت امکان، endpointهای رمزنگاری‌شده (HTTPS یا WSS) و توکن‌های کوتاه‌عمر را ترجیح دهید.
- از قراردادن مستقیم توکن‌های بلندعمر در فایل‌های پیکربندی خودداری کنید.

## پروفایل‌ها (چندمرورگری)

OpenClaw از چندین پروفایل نام‌دار (پیکربندی‌های مسیریابی) پشتیبانی می‌کند. پروفایل‌ها می‌توانند این‌ها باشند:

- **مدیریت‌شده توسط openclaw**: یک نمونه مرورگر اختصاصی مبتنی بر Chromium با دایرکتوری داده کاربر و پورت CDP خودش
- **راه دور**: یک URL صریح CDP (مرورگر مبتنی بر Chromium که جای دیگری اجرا می‌شود)
- **نشست موجود**: پروفایل Chrome موجود شما از طریق اتصال خودکار Chrome DevTools MCP

پیش‌فرض‌ها:

- اگر پروفایل `openclaw` وجود نداشته باشد، به‌صورت خودکار ساخته می‌شود.
- پروفایل `user` برای اتصال نشست موجود Chrome MCP به‌صورت داخلی وجود دارد.
- پروفایل‌های نشست موجود، فراتر از `user`، اختیاری هستند؛ آن‌ها را با `--driver existing-session` بسازید.
- پورت‌های CDP محلی به‌صورت پیش‌فرض از **18800-18899** تخصیص داده می‌شوند.
- حذف یک پروفایل، دایرکتوری داده محلی آن را به Trash منتقل می‌کند.

همه endpointهای کنترل `?profile=<name>` را می‌پذیرند؛ CLI از `--browser-profile` استفاده می‌کند.

## نشست موجود از طریق Chrome DevTools MCP

OpenClaw همچنین می‌تواند از طریق سرور رسمی Chrome DevTools MCP به یک پروفایل مرورگر مبتنی بر Chromium در حال اجرا
متصل شود. این کار از تب‌ها و وضعیت ورود
از قبل باز در آن پروفایل مرورگر دوباره استفاده می‌کند.

منابع رسمی پیش‌زمینه و راه‌اندازی:

- [Chrome for Developers: استفاده از Chrome DevTools MCP با نشست مرورگر شما](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [README مربوط به Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

پروفایل داخلی:

- `user`

اختیاری: اگر نام، رنگ، یا دایرکتوری داده مرورگر متفاوتی می‌خواهید، پروفایل نشست موجود سفارشی خودتان را بسازید.

رفتار پیش‌فرض:

- پروفایل داخلی `user` از اتصال خودکار Chrome MCP استفاده می‌کند که پروفایل پیش‌فرض محلی Google Chrome را هدف می‌گیرد.

برای Brave، Edge، Chromium، یا یک پروفایل غیرپیش‌فرض Chrome از `userDataDir` استفاده کنید.
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

1. صفحه inspect آن مرورگر را برای اشکال‌زدایی راه دور باز کنید.
2. اشکال‌زدایی راه دور را فعال کنید.
3. مرورگر را در حال اجرا نگه دارید و وقتی OpenClaw متصل می‌شود، prompt اتصال را تأیید کنید.

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

موفقیت چه شکلی است:

- `status` مقدار `driver: existing-session` را نشان می‌دهد
- `status` مقدار `transport: chrome-mcp` را نشان می‌دهد
- `status` مقدار `running: true` را نشان می‌دهد
- `tabs` تب‌های مرورگر از قبل باز شما را فهرست می‌کند
- `snapshot` از تب زنده انتخاب‌شده ref برمی‌گرداند

اگر اتصال کار نکرد چه چیزهایی را بررسی کنید:

- مرورگر هدفِ مبتنی بر Chromium نسخه `144+` است
- اشکال‌زدایی راه دور در صفحه inspect آن مرورگر فعال است
- مرورگر prompt رضایت اتصال را نشان داده و شما آن را پذیرفته‌اید
- `openclaw doctor` پیکربندی قدیمی مرورگر مبتنی بر extension را migrate می‌کند و بررسی می‌کند که
  Chrome برای پروفایل‌های پیش‌فرض اتصال خودکار به‌صورت محلی نصب شده باشد، اما نمی‌تواند
  اشکال‌زدایی راه دور سمت مرورگر را برای شما فعال کند

استفاده عامل:

- وقتی به وضعیت مرورگر واردشده کاربر نیاز دارید، از `profile="user"` استفاده کنید.
- اگر از یک پروفایل نشست موجود سفارشی استفاده می‌کنید، همان نام پروفایل صریح را ارسال کنید.
- این حالت را فقط وقتی انتخاب کنید که کاربر پشت رایانه باشد تا prompt اتصال را تأیید کند.
- Gateway یا میزبان Node می‌تواند `npx chrome-devtools-mcp@latest --autoConnect` را spawn کند

یادداشت‌ها:

- این مسیر از پروفایل ایزوله `openclaw` پرریسک‌تر است، چون می‌تواند
  داخل نشست مرورگر واردشده شما عمل کند.
- OpenClaw مرورگر را برای این driver اجرا نمی‌کند؛ فقط متصل می‌شود.
- OpenClaw در اینجا از جریان رسمی `--autoConnect` مربوط به Chrome DevTools MCP استفاده می‌کند. اگر
  `userDataDir` تنظیم شده باشد، برای هدف‌گیری آن دایرکتوری داده کاربر عبور داده می‌شود.
- نشست موجود می‌تواند روی میزبان انتخاب‌شده یا از طریق یک Node مرورگر متصل، attach شود. اگر Chrome جای دیگری است و هیچ Node مرورگری متصل نیست، در عوض از CDP راه دور یا میزبان Node استفاده کنید.

### اجرای سفارشی Chrome MCP

وقتی جریان پیش‌فرض `npx chrome-devtools-mcp@latest` چیزی نیست که می‌خواهید (میزبان‌های آفلاین،
نسخه‌های pinشده، باینری‌های vendored)، سرور Chrome DevTools MCP ایجادشده را برای هر پروفایل override کنید:

| فیلد        | کاری که انجام می‌دهد                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | اجرایی‌ای که به‌جای `npx` spawn می‌شود. همان‌طور که هست resolve می‌شود؛ مسیرهای مطلق رعایت می‌شوند.                                          |
| `mcpArgs`    | آرایه آرگومان که عیناً به `mcpCommand` ارسال می‌شود. آرگومان‌های پیش‌فرض `chrome-devtools-mcp@latest --autoConnect` را جایگزین می‌کند. |

وقتی `cdpUrl` روی یک پروفایل نشست موجود تنظیم شده باشد، OpenClaw
`--autoConnect` را رد می‌کند و endpoint را به‌صورت خودکار به Chrome MCP forward می‌کند:

- `http(s)://...` → `--browserUrl <url>` (endpoint کشف HTTP مربوط به DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (WebSocket مستقیم CDP).

پرچم‌های endpoint و `userDataDir` را نمی‌توان با هم ترکیب کرد: وقتی `cdpUrl` تنظیم شده باشد،
`userDataDir` برای اجرای Chrome MCP نادیده گرفته می‌شود، چون Chrome MCP به
مرورگر در حال اجرای پشت endpoint attach می‌شود، نه اینکه یک دایرکتوری
پروفایل را باز کند.

<Accordion title="محدودیت‌های ویژگی نشست موجود">

در مقایسه با پروفایل مدیریت‌شده `openclaw`، driverهای نشست موجود محدودتر هستند:

- **اسکرین‌شات‌ها** - کپچرهای صفحه و کپچرهای عنصر با `--ref` کار می‌کنند؛ selectorهای CSS با `--element` کار نمی‌کنند. `--full-page` نمی‌تواند با `--ref` یا `--element` ترکیب شود. Playwright برای اسکرین‌شات‌های صفحه یا عنصر مبتنی بر ref لازم نیست.
- **کنش‌ها** - `click`، `type`، `hover`، `scrollIntoView`، `drag`، و `select` به refهای snapshot نیاز دارند (بدون selectorهای CSS). `click-coords` روی مختصات viewport قابل مشاهده کلیک می‌کند و به ref snapshot نیاز ندارد. `click` فقط دکمه چپ است. `type` از `slowly=true` پشتیبانی نمی‌کند؛ از `fill` یا `press` استفاده کنید. `press` از `delayMs` پشتیبانی نمی‌کند. `type`، `hover`، `scrollIntoView`، `drag`، `select`، `fill`، و `evaluate` از timeoutهای هر فراخوانی پشتیبانی نمی‌کنند. `select` یک مقدار واحد می‌پذیرد.
- **انتظار / آپلود / دیالوگ** - `wait --url` از الگوهای دقیق، زیررشته، و glob پشتیبانی می‌کند؛ `wait --load networkidle` پشتیبانی نمی‌شود. hookهای آپلود به `ref` یا `inputRef` نیاز دارند، هر بار یک فایل، بدون CSS `element`. hookهای دیالوگ از overrideهای timeout پشتیبانی نمی‌کنند.
- **ویژگی‌های فقط مدیریت‌شده** - کنش‌های batch، خروجی PDF، رهگیری دانلود، و `responsebody` همچنان به مسیر مرورگر مدیریت‌شده نیاز دارند.

</Accordion>

## تضمین‌های ایزولاسیون

- **دایرکتوری داده کاربر اختصاصی**: هرگز به پروفایل مرورگر شخصی شما دست نمی‌زند.
- **پورت‌های اختصاصی**: از `9222` دوری می‌کند تا از برخورد با گردش‌کارهای توسعه جلوگیری شود.
- **کنترل قطعی تب**: `tabs` ابتدا `suggestedTargetId` را برمی‌گرداند، سپس
  handleهای پایدار `tabId` مانند `t1`، labelهای اختیاری، و `targetId` خام را.
  عامل‌ها باید از `suggestedTargetId` دوباره استفاده کنند؛ idهای خام برای
  اشکال‌زدایی و سازگاری در دسترس می‌مانند.

## انتخاب مرورگر

هنگام اجرای محلی، OpenClaw اولین گزینه در دسترس را انتخاب می‌کند:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

می‌توانید با `browser.executablePath` آن را override کنید.

پلتفرم‌ها:

- macOS: `/Applications` و `~/Applications` را بررسی می‌کند.
- Linux: مکان‌های رایج Chrome/Brave/Edge/Chromium زیر `/usr/bin`،
  `/snap/bin`، `/opt/google`، `/opt/brave.com`، `/usr/lib/chromium`، و
  `/usr/lib/chromium-browser`، به‌علاوه Chromium مدیریت‌شده توسط Playwright زیر
  `PLAYWRIGHT_BROWSERS_PATH` یا `~/.cache/ms-playwright` را بررسی می‌کند.
- Windows: مکان‌های نصب رایج را بررسی می‌کند.

## API کنترل (اختیاری)

برای اسکریپت‌نویسی و اشکال‌زدایی، Gateway یک **API کنترل HTTP فقط loopback**
کوچک به‌همراه CLI متناظر `openclaw browser` ارائه می‌کند (snapshotها، refها، تقویت‌کننده‌های wait،
خروجی JSON، گردش‌کارهای اشکال‌زدایی). برای مرجع کامل، [API کنترل مرورگر](/fa/tools/browser-control) را ببینید.

## عیب‌یابی

برای مشکلات خاص Linux (به‌ویژه snap Chromium)، [عیب‌یابی مرورگر](/fa/tools/browser-linux-troubleshooting) را ببینید.

برای راه‌اندازی‌های split-host با WSL2 Gateway + Windows Chrome، [عیب‌یابی WSL2 + Windows + CDP راه دور Chrome](/fa/tools/browser-wsl2-windows-remote-cdp-troubleshooting) را ببینید.

### شکست آغازبه‌کار CDP در برابر مسدودسازی SSRF ناوبری

این‌ها کلاس‌های شکست متفاوتی هستند و به مسیرهای کد متفاوتی اشاره می‌کنند.

- **شکست آغازبه‌کار یا readiness مربوط به CDP** یعنی OpenClaw نمی‌تواند تأیید کند که control plane مرورگر سالم است.
- **مسدودسازی SSRF ناوبری** یعنی control plane مرورگر سالم است، اما هدف ناوبری صفحه توسط policy رد شده است.

نمونه‌های رایج:

- شکست آغازبه‌کار یا readiness مربوط به CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` وقتی یک
    سرویس CDP خارجی loopback بدون `attachOnly: true` پیکربندی شده باشد
- مسدودسازی SSRF ناوبری:
  - جریان‌های `open`، `navigate`، snapshot، یا بازکردن تب با خطای policy مرورگر/شبکه شکست می‌خورند، در حالی که `start` و `tabs` همچنان کار می‌کنند

برای جداکردن این دو، از این توالی حداقلی استفاده کنید:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

نتایج را چگونه بخوانید:

- اگر `start` با `not reachable after start` شکست خورد، ابتدا readiness مربوط به CDP را عیب‌یابی کنید.
- اگر `start` موفق شد اما `tabs` شکست خورد، control plane همچنان ناسالم است. با این مورد به‌عنوان مشکل دسترسی‌پذیری CDP رفتار کنید، نه مشکل ناوبری صفحه.
- اگر `start` و `tabs` موفق شدند اما `open` یا `navigate` شکست خورد، control plane مرورگر بالا است و شکست در policy ناوبری یا صفحه هدف است.
- اگر `start`، `tabs`، و `open` همگی موفق شدند، مسیر پایه کنترل مرورگر مدیریت‌شده سالم است.

جزئیات مهم رفتار:

- پیکربندی مرورگر حتی وقتی `browser.ssrfPolicy` را پیکربندی نمی‌کنید، به‌صورت پیش‌فرض یک شیء policy SSRF fail-closed دارد.
- برای پروفایل مدیریت‌شده `openclaw` با local loopback، بررسی‌های سلامت CDP عمداً اعمال دسترسی‌پذیری SSRF مرورگر را برای control plane محلی خود OpenClaw رد می‌کنند.
- حفاظت ناوبری جداست. نتیجه موفق `start` یا `tabs` به این معنی نیست که هدف بعدی `open` یا `navigate` مجاز است.

راهنمایی امنیتی:

- به‌صورت پیش‌فرض، سیاست SSRF مرورگر را آسان‌گیر نکنید.
- استثناهای محدود برای میزبان مانند `hostnameAllowlist` یا `allowedHostnames` را به دسترسی گسترده به شبکه خصوصی ترجیح دهید.
- از `dangerouslyAllowPrivateNetwork: true` فقط در محیط‌های عمداً مورد اعتماد استفاده کنید که در آن‌ها دسترسی مرورگر به شبکه خصوصی لازم و بازبینی شده است.

## ابزارهای عامل + نحوه کار کنترل

عامل برای خودکارسازی مرورگر **یک ابزار** دریافت می‌کند:

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

نگاشت آن به این شکل است:

- `browser snapshot` یک درخت UI پایدار (AI یا ARIA) برمی‌گرداند.
- `browser act` از شناسه‌های `ref` در snapshot برای کلیک/تایپ/کشیدن/انتخاب استفاده می‌کند.
- `browser screenshot` پیکسل‌ها را ثبت می‌کند (کل صفحه، عنصر، یا refهای برچسب‌خورده).
- `browser doctor` آمادگی Gateway، Plugin، پروفایل، مرورگر، و تب را بررسی می‌کند.
- `browser` این موارد را می‌پذیرد:
  - `profile` برای انتخاب یک پروفایل مرورگر نام‌گذاری‌شده (openclaw، chrome، یا CDP راه‌دور).
  - `target` (`sandbox` | `host` | `node`) برای انتخاب محل اجرای مرورگر.
  - در نشست‌های sandbox شده، `target: "host"` به `agents.defaults.sandbox.browser.allowHostControl=true` نیاز دارد.
  - اگر `target` حذف شود: نشست‌های sandbox شده به‌صورت پیش‌فرض از `sandbox` استفاده می‌کنند، و نشست‌های غیر sandbox به‌صورت پیش‌فرض از `host`.
  - اگر یک node با قابلیت مرورگر متصل باشد، ابزار ممکن است به‌صورت خودکار به آن مسیریابی کند، مگر اینکه `target="host"` یا `target="node"` را ثابت کنید.

این کار عامل را قطعی نگه می‌دارد و از selectorهای شکننده جلوگیری می‌کند.

## مرتبط

- [نمای کلی ابزارها](/fa/tools) - همه ابزارهای موجود عامل
- [Sandboxing](/fa/gateway/sandboxing) - کنترل مرورگر در محیط‌های sandbox شده
- [امنیت](/fa/gateway/security) - خطرات کنترل مرورگر و سخت‌سازی
