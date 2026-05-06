---
read_when:
    - افزودن خودکارسازی مرورگر کنترل‌شده توسط عامل
    - عیب‌یابی دلیل تداخل OpenClaw با Chrome خودتان
    - پیاده‌سازی تنظیمات مرورگر + چرخهٔ حیات در برنامهٔ macOS
summary: سرویس کنترل مرورگر یکپارچه + فرمان‌های اقدام
title: مرورگر (مدیریت‌شده توسط OpenClaw)
x-i18n:
    generated_at: "2026-05-06T18:03:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1c9f79b4f8b9921724130b4793584facf1bfbe2de5fb21faa54274a4294dedd0
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw می‌تواند یک **پروفایل اختصاصی Chrome/Brave/Edge/Chromium** اجرا کند که عامل آن را کنترل می‌کند.
این پروفایل از مرورگر شخصی شما جداست و از طریق یک سرویس کنترل محلی کوچک
داخل Gateway مدیریت می‌شود (فقط loopback).

نمای مبتدی:

- آن را مثل یک **مرورگر جداگانه، فقط مخصوص عامل** در نظر بگیرید.
- پروفایل `openclaw` به پروفایل مرورگر شخصی شما **دست نمی‌زند**.
- عامل می‌تواند در یک مسیر امن **تب باز کند، صفحات را بخواند، کلیک کند و تایپ کند**.
- پروفایل داخلی `user` از طریق Chrome MCP به نشست واقعی Chrome واردشده شما متصل می‌شود.

## چه چیزی دریافت می‌کنید

- یک پروفایل مرورگر جداگانه با نام **openclaw** (به‌صورت پیش‌فرض با تاکید نارنجی).
- کنترل قطعی تب‌ها (فهرست/باز کردن/تمرکز/بستن).
- کنش‌های عامل (کلیک/تایپ/کشیدن/انتخاب)، snapshotها، screenshotها، PDFها.
- یک skill همراه `browser-automation` که وقتی Plugin مرورگر فعال است، حلقه بازیابی snapshot،
  تب پایدار، مرجع منقضی، و مانع دستی را به عامل‌ها آموزش می‌دهد.
- پشتیبانی اختیاری از چند پروفایل (`openclaw`، `work`، `remote`، ...).

این مرورگر **مرورگر روزمره شما نیست**. این یک سطح امن و ایزوله برای
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

اگر پیام "Browser disabled" دریافت کردید، آن را در پیکربندی فعال کنید (پایین را ببینید) و
Gateway را دوباره راه‌اندازی کنید.

اگر `openclaw browser` به‌کلی وجود ندارد، یا عامل می‌گوید ابزار مرورگر
در دسترس نیست، به [فرمان یا ابزار مرورگر موجود نیست](/fa/tools/browser#missing-browser-command-or-tool) بروید.

## کنترل Plugin

ابزار پیش‌فرض `browser` یک Plugin همراه است. آن را غیرفعال کنید تا با Plugin دیگری جایگزین شود که همان نام ابزار `browser` را ثبت می‌کند:

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

پیش‌فرض‌ها هم به `plugins.entries.browser.enabled` **و هم** به `browser.enabled=true` نیاز دارند. غیرفعال کردن فقط Plugin، `openclaw browser` CLI، متد Gateway به نام `browser.request`، ابزار عامل، و سرویس کنترل را به‌صورت یک واحد حذف می‌کند؛ پیکربندی `browser.*` شما برای جایگزین دست‌نخورده می‌ماند.

تغییرات پیکربندی مرورگر به راه‌اندازی دوباره Gateway نیاز دارند تا Plugin بتواند سرویس خود را دوباره ثبت کند.

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

برای یک عامل واحد، از `agents.list[].tools.alsoAllow: ["browser"]` استفاده کنید.
`tools.subagents.tools.allow: ["browser"]` به‌تنهایی کافی نیست، چون سیاست زیرعامل
پس از فیلتر کردن پروفایل اعمال می‌شود.

Plugin مرورگر دو سطح راهنمایی عامل ارائه می‌کند:

- توضیح ابزار `browser` قرارداد فشرده و همیشه‌فعال را حمل می‌کند: پروفایل
  درست را انتخاب کنید، refs را روی همان تب نگه دارید، از `tabId`/برچسب‌ها برای
  هدف‌گیری تب استفاده کنید، و برای کار چندمرحله‌ای skill مرورگر را بارگذاری کنید.
- skill همراه `browser-automation` حلقه عملیاتی طولانی‌تر را حمل می‌کند:
  ابتدا وضعیت/تب‌ها را بررسی کنید، تب‌های وظیفه را برچسب بزنید، پیش از اقدام snapshot بگیرید، پس از تغییرات UI دوباره snapshot بگیرید، refs منقضی را یک‌بار بازیابی کنید، و ورود/2FA/captcha یا
  موانع دوربین/میکروفون را به‌جای حدس زدن، به‌عنوان اقدام دستی گزارش کنید.

Skills همراه Plugin وقتی Plugin فعال باشد در Skills در دسترس عامل فهرست می‌شوند.
دستورالعمل‌های کامل skill در صورت نیاز بارگذاری می‌شوند، بنابراین نوبت‌های عادی
هزینه کامل توکن را پرداخت نمی‌کنند.

## فرمان یا ابزار مرورگر موجود نیست

اگر پس از ارتقا، `openclaw browser` ناشناخته است، `browser.request` وجود ندارد، یا عامل ابزار مرورگر را در دسترس نمی‌داند، علت معمول یک فهرست `plugins.allow` است که `browser` را حذف کرده و هیچ بلوک پیکربندی ریشه‌ای `browser` وجود ندارد. آن را اضافه کنید:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

یک بلوک ریشه‌ای صریح `browser`، برای مثال `browser.enabled=true` یا `browser.profiles.<name>`، Plugin مرورگر همراه را حتی زیر یک `plugins.allow` محدودکننده فعال می‌کند و با رفتار پیکربندی کانال هم‌خوان است. `plugins.entries.browser.enabled=true` و `tools.alsoAllow: ["browser"]` به‌تنهایی جایگزین عضویت در allowlist نمی‌شوند. حذف کامل `plugins.allow` نیز پیش‌فرض را برمی‌گرداند.

## پروفایل‌ها: `openclaw` در برابر `user`

- `openclaw`: مرورگر مدیریت‌شده و ایزوله (بدون نیاز به افزونه).
- `user`: پروفایل داخلی اتصال Chrome MCP برای نشست **واقعی Chrome واردشده**
  شما.

برای فراخوانی‌های ابزار مرورگر عامل:

- پیش‌فرض: از مرورگر ایزوله `openclaw` استفاده کنید.
- وقتی نشست‌های واردشده موجود اهمیت دارند و کاربر پشت رایانه است تا هر اعلان اتصال را کلیک/تایید کند،
  `profile="user"` را ترجیح دهید.
- وقتی حالت مرورگر مشخصی می‌خواهید، `profile` بازنویسی صریح است.

اگر می‌خواهید حالت مدیریت‌شده به‌صورت پیش‌فرض باشد، `browser.defaultProfile: "openclaw"` را تنظیم کنید.

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

- سرویس کنترل روی loopback و روی پورتی مشتق‌شده از `gateway.port` bind می‌شود (پیش‌فرض `18791` = gateway + 2). بازنویسی `gateway.port` یا `OPENCLAW_GATEWAY_PORT` پورت‌های مشتق‌شده را در همان خانواده جابه‌جا می‌کند.
- پروفایل‌های محلی `openclaw` به‌صورت خودکار `cdpPort`/`cdpUrl` را اختصاص می‌دهند؛ آن‌ها را فقط برای CDP ریموت تنظیم کنید. وقتی `cdpUrl` تنظیم نشده باشد، به‌صورت پیش‌فرض روی پورت CDP محلی مدیریت‌شده قرار می‌گیرد.
- `remoteCdpTimeoutMs` برای بررسی‌های دسترسی‌پذیری CDP HTTP ریموت و `attachOnly`
  و درخواست‌های HTTP باز کردن تب اعمال می‌شود؛ `remoteCdpHandshakeTimeoutMs` برای
  handshakeهای CDP WebSocket آن‌ها اعمال می‌شود.
- `localLaunchTimeoutMs` بودجه زمانی برای یک فرایند Chrome مدیریت‌شده محلی است
  تا endpoint HTTP CDP خود را آشکار کند. `localCdpReadyTimeoutMs` بودجه
  بعدی برای آمادگی websocket CDP پس از کشف فرایند است.
  این مقادیر را روی Raspberry Pi، VPSهای رده‌پایین، یا سخت‌افزار قدیمی‌تر که Chromium
  کند شروع می‌شود افزایش دهید. مقادیر باید عدد صحیح مثبت تا `120000` ms باشند؛ مقادیر
  پیکربندی نامعتبر رد می‌شوند.
- شکست‌های تکراری راه‌اندازی/آمادگی Chrome مدیریت‌شده به‌ازای هر
  پروفایل circuit-break می‌شوند. پس از چند شکست پیاپی، OpenClaw تلاش‌های راه‌اندازی
  جدید را برای مدت کوتاهی متوقف می‌کند، به‌جای اینکه در هر فراخوانی ابزار مرورگر Chromium ایجاد کند. مشکل
  شروع را رفع کنید، اگر مرورگر لازم نیست آن را غیرفعال کنید، یا پس از تعمیر Gateway را
  دوباره راه‌اندازی کنید.
- `actionTimeoutMs` بودجه پیش‌فرض برای درخواست‌های `act` مرورگر است وقتی فراخواننده `timeoutMs` را ارسال نکند. انتقال کلاینت یک پنجره مهلت کوچک اضافه می‌کند تا انتظارهای طولانی بتوانند به‌جای timeout شدن در مرز HTTP، کامل شوند.
- `tabCleanup` پاک‌سازی best-effort برای تب‌هایی است که نشست‌های مرورگر عامل اصلی باز کرده‌اند. پاک‌سازی چرخه عمر زیرعامل، Cron، و ACP همچنان تب‌های صریحا رهگیری‌شده خود را در پایان نشست می‌بندد؛ نشست‌های اصلی تب‌های فعال را قابل استفاده دوباره نگه می‌دارند، سپس تب‌های رهگیری‌شده idle یا اضافی را در پس‌زمینه می‌بندند.

</Accordion>

<Accordion title="سیاست SSRF">

- پیمایش مرورگر و open-tab پیش از پیمایش با SSRF محافظت می‌شوند و پس از آن روی URL نهایی `http(s)` به‌صورت best-effort دوباره بررسی می‌شوند.
- در حالت سخت‌گیرانه SSRF، کشف endpoint ریموت CDP و probeهای `/json/version` (`cdpUrl`) نیز بررسی می‌شوند.
- متغیرهای محیطی Gateway/provider یعنی `HTTP_PROXY`، `HTTPS_PROXY`، `ALL_PROXY`، و `NO_PROXY` به‌صورت خودکار مرورگر مدیریت‌شده OpenClaw را proxy نمی‌کنند. Chrome مدیریت‌شده به‌صورت پیش‌فرض مستقیم اجرا می‌شود تا تنظیمات proxy ارائه‌دهنده بررسی‌های SSRF مرورگر را تضعیف نکنند.
- برای proxy کردن خود مرورگر مدیریت‌شده، flagهای صریح proxy Chrome را از طریق `browser.extraArgs` ارسال کنید، مانند `--proxy-server=...` یا `--proxy-pac-url=...`. حالت سخت‌گیرانه SSRF مسیریابی صریح proxy مرورگر را مسدود می‌کند مگر اینکه دسترسی مرورگر به شبکه خصوصی عمدا فعال شده باشد.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` به‌صورت پیش‌فرض خاموش است؛ فقط وقتی فعال کنید که دسترسی مرورگر به شبکه خصوصی عمدا مورد اعتماد است.
- `browser.ssrfPolicy.allowPrivateNetwork` همچنان به‌عنوان alias قدیمی پشتیبانی می‌شود.

</Accordion>

<Accordion title="رفتار پروفایل">

- `attachOnly: true` یعنی هرگز مرورگر محلی راه‌اندازی نشود؛ فقط اگر مرورگری از قبل در حال اجراست به آن متصل شود.
- `headless` را می‌توان به‌صورت سراسری یا برای هر پروفایل مدیریت‌شده محلی تنظیم کرد. مقادیر هر پروفایل `browser.headless` را بازنویسی می‌کنند، بنابراین یک پروفایل راه‌اندازی‌شده محلی می‌تواند headless بماند درحالی‌که پروفایل دیگر همچنان قابل‌مشاهده است.
- `POST /start?headless=true` و `openclaw browser start --headless` برای پروفایل‌های مدیریت‌شده محلی، بدون بازنویسی
  `browser.headless` یا پیکربندی پروفایل، یک راه‌اندازی headless
  یک‌باره درخواست می‌کنند. پروفایل‌های existing-session، attach-only و
  CDP راه‌دور این بازنویسی را رد می‌کنند، چون OpenClaw آن
  فرایندهای مرورگر را راه‌اندازی نمی‌کند.
- روی میزبان‌های Linux بدون `DISPLAY` یا `WAYLAND_DISPLAY`، پروفایل‌های مدیریت‌شده محلی
  وقتی نه محیط و نه پیکربندی پروفایل/سراسری صراحتا حالت headed را انتخاب نکرده باشند،
  به‌طور خودکار به‌صورت پیش‌فرض headless می‌شوند. `openclaw browser status --json`
  مقدار `headlessSource` را به‌صورت `env`، `profile`، `config`،
  `request`، `linux-display-fallback` یا `default` گزارش می‌کند.
- `OPENCLAW_BROWSER_HEADLESS=1` راه‌اندازی‌های مدیریت‌شده محلی را برای
  فرایند فعلی به headless اجبار می‌کند. `OPENCLAW_BROWSER_HEADLESS=0` حالت headed را برای شروع‌های معمولی اجبار می‌کند
  و روی میزبان‌های Linux بدون سرور نمایش، خطایی قابل‌اقدام برمی‌گرداند؛
  درخواست صریح `start --headless` همچنان برای همان یک راه‌اندازی اولویت دارد.
- `executablePath` را می‌توان به‌صورت سراسری یا برای هر پروفایل مدیریت‌شده محلی تنظیم کرد. مقادیر هر پروفایل `browser.executablePath` را بازنویسی می‌کنند، بنابراین پروفایل‌های مدیریت‌شده متفاوت می‌توانند مرورگرهای مبتنی بر Chromium متفاوتی را راه‌اندازی کنند. هر دو شکل برای دایرکتوری خانه سیستم‌عامل شما `~` را می‌پذیرند.
- `color` (در سطح بالا و برای هر پروفایل) رابط کاربری مرورگر را رنگی می‌کند تا بتوانید ببینید کدام پروفایل فعال است.
- پروفایل پیش‌فرض `openclaw` است (مدیریت‌شده مستقل). برای انتخاب مرورگر کاربر واردشده از `defaultProfile: "user"` استفاده کنید.
- ترتیب تشخیص خودکار: مرورگر پیش‌فرض سیستم اگر مبتنی بر Chromium باشد؛ در غیر این صورت Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` به‌جای CDP خام از Chrome DevTools MCP استفاده می‌کند. برای آن درایور `cdpUrl` را تنظیم نکنید.
- وقتی یک پروفایل existing-session باید به پروفایل کاربری غیرپیش‌فرض Chromium متصل شود (Brave، Edge و غیره)، `browser.profiles.<name>.userDataDir` را تنظیم کنید. این مسیر نیز برای دایرکتوری خانه سیستم‌عامل شما `~` را می‌پذیرد.

</Accordion>

</AccordionGroup>

## استفاده از Brave یا مرورگر دیگری مبتنی بر Chromium

اگر مرورگر **پیش‌فرض سیستم** شما مبتنی بر Chromium باشد (Chrome/Brave/Edge/و غیره)،
OpenClaw به‌طور خودکار از آن استفاده می‌کند. برای بازنویسی
تشخیص خودکار، `browser.executablePath` را تنظیم کنید. مقادیر `executablePath`
در سطح بالا و برای هر پروفایل، برای دایرکتوری خانه سیستم‌عامل شما `~`
را می‌پذیرند:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

یا آن را در پیکربندی، برای هر پلتفرم، تنظیم کنید:

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

`executablePath` هر پروفایل فقط روی پروفایل‌های مدیریت‌شده محلی اثر می‌گذارد که OpenClaw
راه‌اندازی می‌کند. پروفایل‌های `existing-session` در عوض به مرورگری که از قبل در حال اجراست
متصل می‌شوند، و پروفایل‌های CDP راه‌دور از مرورگر پشت `cdpUrl` استفاده می‌کنند.

## کنترل محلی در برابر راه‌دور

- **کنترل محلی (پیش‌فرض):** Gateway سرویس کنترل loopback را شروع می‌کند و می‌تواند یک مرورگر محلی راه‌اندازی کند.
- **کنترل راه‌دور (میزبان Node):** یک میزبان Node را روی دستگاهی اجرا کنید که مرورگر را دارد؛ Gateway کنش‌های مرورگر را به آن پروکسی می‌کند.
- **CDP راه‌دور:** برای اتصال به یک مرورگر راه‌دور مبتنی بر Chromium،
  `browser.profiles.<name>.cdpUrl` (یا `browser.cdpUrl`) را تنظیم کنید.
  در این حالت، OpenClaw مرورگر محلی راه‌اندازی نمی‌کند.
- برای سرویس‌های CDP مدیریت‌شده بیرونی روی loopback (برای مثال Browserless در
  Docker که روی `127.0.0.1` منتشر شده)، `attachOnly: true` را نیز تنظیم کنید. CDP روی loopback
  بدون `attachOnly` به‌عنوان پروفایل مرورگر محلی مدیریت‌شده توسط OpenClaw تلقی می‌شود.
- `headless` فقط روی پروفایل‌های مدیریت‌شده محلی اثر می‌گذارد که OpenClaw راه‌اندازی می‌کند. مرورگرهای existing-session یا CDP راه‌دور را دوباره راه‌اندازی یا تغییر نمی‌دهد.
- `executablePath` از همان قاعده پروفایل مدیریت‌شده محلی پیروی می‌کند. تغییر آن روی یک
  پروفایل مدیریت‌شده محلی در حال اجرا، آن پروفایل را برای راه‌اندازی دوباره/همگام‌سازی علامت‌گذاری می‌کند تا
  راه‌اندازی بعدی از باینری جدید استفاده کند.

رفتار توقف بسته به حالت پروفایل متفاوت است:

- پروفایل‌های مدیریت‌شده محلی: `openclaw browser stop` فرایند مرورگری را که
  OpenClaw راه‌اندازی کرده متوقف می‌کند
- پروفایل‌های attach-only و CDP راه‌دور: `openclaw browser stop` نشست کنترل فعال را می‌بندد
  و بازنویسی‌های شبیه‌سازی Playwright/CDP را آزاد می‌کند (viewport،
  طرح رنگ، locale، timezone، حالت offline و وضعیت‌های مشابه)، حتی
  با اینکه هیچ فرایند مرورگری توسط OpenClaw راه‌اندازی نشده است

URLهای CDP راه‌دور می‌توانند شامل احراز هویت باشند:

- توکن‌های Query (مانند `https://provider.example?token=<token>`)
- احراز هویت HTTP Basic (مانند `https://user:pass@provider.example`)

OpenClaw هنگام فراخوانی endpointهای `/json/*` و هنگام اتصال
به CDP WebSocket احراز هویت را حفظ می‌کند. برای توکن‌ها، به‌جای commit کردن آن‌ها در فایل‌های پیکربندی،
از متغیرهای محیطی یا مدیران secrets استفاده کنید.

## پروکسی مرورگر Node (پیش‌فرض بدون پیکربندی)

اگر یک **میزبان Node** را روی دستگاهی اجرا کنید که مرورگر شما را دارد، OpenClaw می‌تواند
فراخوانی‌های ابزار مرورگر را بدون هیچ پیکربندی اضافه مرورگر
به‌طور خودکار به آن Node مسیریابی کند. این مسیر پیش‌فرض برای gatewayهای راه‌دور است.

نکته‌ها:

- میزبان Node سرور کنترل مرورگر محلی خود را از طریق یک **فرمان پروکسی** در دسترس قرار می‌دهد.
- پروفایل‌ها از پیکربندی `browser.profiles` خود Node می‌آیند (همانند حالت محلی).
- `nodeHost.browserProxy.allowProfiles` اختیاری است. برای رفتار قدیمی/پیش‌فرض آن را خالی بگذارید: همه پروفایل‌های پیکربندی‌شده از طریق پروکسی قابل دسترس می‌مانند، از جمله مسیرهای ایجاد/حذف پروفایل.
- اگر `nodeHost.browserProxy.allowProfiles` را تنظیم کنید، OpenClaw آن را به‌عنوان مرز حداقل‌دسترسی تلقی می‌کند: فقط پروفایل‌های allowlist‌شده می‌توانند هدف قرار بگیرند، و مسیرهای ایجاد/حذف پروفایل پایدار روی سطح پروکسی مسدود می‌شوند.
- اگر آن را نمی‌خواهید غیرفعال کنید:
  - روی Node: `nodeHost.browserProxy.enabled=false`
  - روی gateway: `gateway.nodes.browser.mode="off"`

## Browserless (CDP راه‌دور میزبانی‌شده)

[Browserless](https://browserless.io) یک سرویس Chromium میزبانی‌شده است که
URLهای اتصال CDP را از طریق HTTPS و WebSocket ارائه می‌کند. OpenClaw می‌تواند از هر دو شکل استفاده کند، اما
برای یک پروفایل مرورگر راه‌دور، ساده‌ترین گزینه URL مستقیم WebSocket
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

نکته‌ها:

- `<BROWSERLESS_API_KEY>` را با توکن واقعی Browserless خود جایگزین کنید.
- endpoint ناحیه‌ای را انتخاب کنید که با حساب Browserless شما مطابقت دارد (مستندات آن‌ها را ببینید).
- اگر Browserless یک URL پایه HTTPS به شما بدهد، می‌توانید یا آن را برای اتصال مستقیم CDP
  به `wss://` تبدیل کنید، یا URL HTTPS را نگه دارید و اجازه دهید OpenClaw
  `/json/version` را کشف کند.

### Browserless Docker روی همان میزبان

وقتی Browserless به‌صورت self-hosted در Docker اجرا می‌شود و OpenClaw روی میزبان اجرا می‌شود،
Browserless را به‌عنوان یک سرویس CDP مدیریت‌شده بیرونی در نظر بگیرید:

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
OpenClaw قابل دسترس باشد. Browserless همچنین باید یک endpoint قابل‌دسترسی منطبق را اعلام کند؛
`EXTERNAL` در Browserless را به همان پایه WebSocket عمومی-به-OpenClaw تنظیم کنید، مانند
`ws://127.0.0.1:3000`، `ws://browserless:3000`، یا یک نشانی پایدار شبکه خصوصی
Docker. اگر `/json/version` مقدار `webSocketDebuggerUrl` را برگرداند که به
نشانی‌ای اشاره می‌کند که OpenClaw نمی‌تواند به آن دسترسی پیدا کند، CDP HTTP ممکن است سالم به نظر برسد در حالی که اتصال
WebSocket همچنان شکست می‌خورد.

برای یک پروفایل Browserless روی loopback، `attachOnly` را تنظیم‌نشده رها نکنید. بدون
`attachOnly`، OpenClaw پورت loopback را به‌عنوان یک پروفایل مرورگر مدیریت‌شده محلی
تلقی می‌کند و ممکن است گزارش کند که پورت در حال استفاده است اما متعلق به OpenClaw نیست.

## ارائه‌دهندگان مستقیم WebSocket CDP

برخی سرویس‌های مرورگر میزبانی‌شده به‌جای کشف استاندارد CDP مبتنی بر HTTP
(`/json/version`)، یک endpoint **مستقیم WebSocket** ارائه می‌کنند. OpenClaw سه
شکل URL CDP را می‌پذیرد و راهبرد اتصال درست را به‌طور خودکار انتخاب می‌کند:

- **کشف HTTP(S)** - `http://host[:port]` یا `https://host[:port]`.
  OpenClaw برای کشف URL اشکال‌زدایی WebSocket، `/json/version` را فراخوانی می‌کند و سپس
  متصل می‌شود. fallback برای WebSocket وجود ندارد.
- **endpointهای مستقیم WebSocket** - `ws://host[:port]/devtools/<kind>/<id>` یا
  `wss://...` با مسیر `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw مستقیما از طریق WebSocket handshake متصل می‌شود و
  `/json/version` را کاملا رد می‌کند.
- **ریشه‌های WebSocket ساده** - `ws://host[:port]` یا `wss://host[:port]` بدون
  مسیر `/devtools/...` (مانند [Browserless](https://browserless.io)،
  [Browserbase](https://www.browserbase.com)). OpenClaw ابتدا کشف HTTP
  `/json/version` را امتحان می‌کند (با نرمال‌سازی scheme به `http`/`https`)؛
  اگر کشف مقدار `webSocketDebuggerUrl` برگرداند، از آن استفاده می‌شود، وگرنه OpenClaw
  به WebSocket handshake مستقیم در ریشه ساده fallback می‌کند. اگر endpoint
  WebSocket اعلام‌شده CDP handshake را رد کند اما ریشه ساده پیکربندی‌شده
  آن را بپذیرد، OpenClaw به آن ریشه نیز fallback می‌کند. این باعث می‌شود یک `ws://` ساده
  که به Chrome محلی اشاره دارد همچنان متصل شود، چون Chrome فقط ارتقای WebSocket
  را روی مسیر خاص هر هدف از `/json/version` می‌پذیرد، در حالی که ارائه‌دهندگان میزبانی‌شده
  همچنان می‌توانند از endpoint ریشه WebSocket خود استفاده کنند، وقتی endpoint کشف آن‌ها
  URL کوتاه‌عمری را اعلام می‌کند که برای Playwright CDP مناسب نیست.

### Browserbase

[Browserbase](https://www.browserbase.com) یک پلتفرم ابری برای اجرای
مرورگرهای headless با حل داخلی CAPTCHA، حالت stealth و پروکسی‌های residential
است.

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
- Browserbase هنگام اتصال WebSocket، یک نشست مرورگر را به‌طور خودکار ایجاد می‌کند، بنابراین
  نیازی به مرحله ایجاد دستی نشست نیست.
- سطح رایگان یک نشست همزمان و یک ساعت مرورگر در ماه را مجاز می‌داند.
  برای محدودیت‌های طرح‌های پولی [pricing](https://www.browserbase.com/pricing) را ببینید.
- برای مرجع کامل API، راهنماهای SDK و مثال‌های یکپارچه‌سازی،
  [مستندات Browserbase](https://docs.browserbase.com) را ببینید.

## امنیت

ایده‌های کلیدی:

- کنترل مرورگر فقط از طریق loopback انجام می‌شود؛ جریان‌های دسترسی از طریق احراز هویت Gateway یا جفت‌سازی Node عبور می‌کنند.
- API مستقل HTTP مرورگر loopback فقط از **احراز هویت با راز مشترک** استفاده می‌کند:
  احراز هویت bearer با توکن Gateway، `x-openclaw-password`، یا HTTP Basic auth با
  گذرواژه پیکربندی‌شده Gateway.
- سرآیندهای هویت Tailscale Serve و `gateway.auth.mode: "trusted-proxy"` این API
  مستقل مرورگر loopback را **احراز هویت نمی‌کنند**.
- اگر کنترل مرورگر فعال باشد و هیچ احراز هویت راز مشترکی پیکربندی نشده باشد، OpenClaw
  برای همان راه‌اندازی یک توکن Gateway فقط-زمان-اجرا تولید می‌کند. اگر کلاینت‌ها به یک راز پایدار در میان
  راه‌اندازی‌های مجدد نیاز دارند، `gateway.auth.token`، `gateway.auth.password`، `OPENCLAW_GATEWAY_TOKEN`، یا
  `OPENCLAW_GATEWAY_PASSWORD` را به‌صورت صریح پیکربندی کنید.
- وقتی `gateway.auth.mode` از قبل `password`، `none`، یا `trusted-proxy` باشد، OpenClaw
  آن توکن را به‌صورت خودکار تولید **نمی‌کند**.
- Gateway و هر میزبان Node را روی یک شبکه خصوصی نگه دارید (Tailscale)؛ از قرار دادن آن‌ها در معرض دسترسی عمومی خودداری کنید.
- URLها/توکن‌های CDP راه‌دور را مانند رازها در نظر بگیرید؛ env vars یا مدیر رازها را ترجیح دهید.

نکته‌های CDP راه‌دور:

- هرجا ممکن است، endpointهای رمزنگاری‌شده (HTTPS یا WSS) و توکن‌های کوتاه‌عمر را ترجیح دهید.
- از قراردادن مستقیم توکن‌های بلندمدت در فایل‌های پیکربندی خودداری کنید.

## پروفایل‌ها (چندمرورگری)

OpenClaw از چندین پروفایل نام‌گذاری‌شده (پیکربندی‌های مسیریابی) پشتیبانی می‌کند. پروفایل‌ها می‌توانند این‌گونه باشند:

- **مدیریت‌شده با openclaw**: یک نمونه مرورگر اختصاصی مبتنی بر Chromium با دایرکتوری داده کاربر و پورت CDP خودش
- **راه‌دور**: یک URL صریح CDP (مرورگر مبتنی بر Chromium که جای دیگری اجرا می‌شود)
- **نشست موجود**: پروفایل Chrome موجود شما از طریق اتصال خودکار Chrome DevTools MCP

پیش‌فرض‌ها:

- اگر پروفایل `openclaw` وجود نداشته باشد، به‌صورت خودکار ساخته می‌شود.
- پروفایل `user` برای اتصال نشست موجود Chrome MCP به‌صورت توکار وجود دارد.
- پروفایل‌های نشست موجود، به‌جز `user`، نیازمند فعال‌سازی صریح هستند؛ آن‌ها را با `--driver existing-session` بسازید.
- پورت‌های محلی CDP به‌صورت پیش‌فرض از بازه **18800-18899** تخصیص داده می‌شوند.
- حذف یک پروفایل، دایرکتوری داده محلی آن را به Trash منتقل می‌کند.

همه endpointهای کنترلی `?profile=<name>` را می‌پذیرند؛ CLI از `--browser-profile` استفاده می‌کند.

## نشست موجود از طریق Chrome DevTools MCP

OpenClaw همچنین می‌تواند از طریق سرور رسمی Chrome DevTools MCP به یک پروفایل مرورگر مبتنی بر Chromium در حال اجرا
متصل شود. این مسیر تب‌ها و وضعیت ورود
از قبل باز در آن پروفایل مرورگر را دوباره استفاده می‌کند.

مراجع رسمی پیش‌زمینه و راه‌اندازی:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

پروفایل توکار:

- `user`

اختیاری: اگر نام، رنگ، یا دایرکتوری داده مرورگر متفاوتی می‌خواهید، پروفایل نشست موجود سفارشی خودتان را بسازید.

رفتار پیش‌فرض:

- پروفایل توکار `user` از اتصال خودکار Chrome MCP استفاده می‌کند که
  پروفایل محلی پیش‌فرض Google Chrome را هدف می‌گیرد.

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

1. صفحه inspect آن مرورگر را برای اشکال‌زدایی راه‌دور باز کنید.
2. اشکال‌زدایی راه‌دور را فعال کنید.
3. مرورگر را در حال اجرا نگه دارید و وقتی OpenClaw متصل می‌شود، اعلان اتصال را تأیید کنید.

صفحه‌های inspect رایج:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

آزمون دود اتصال زنده:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

موفقیت چه شکلی دارد:

- `status` مقدار `driver: existing-session` را نشان می‌دهد
- `status` مقدار `transport: chrome-mcp` را نشان می‌دهد
- `status` مقدار `running: true` را نشان می‌دهد
- `tabs` تب‌های مرورگرِ از قبل باز شما را فهرست می‌کند
- `snapshot` ارجاع‌هایی از تب زنده انتخاب‌شده برمی‌گرداند

اگر اتصال کار نمی‌کند، چه چیزهایی را بررسی کنید:

- مرورگر هدف مبتنی بر Chromium نسخه `144+` است
- اشکال‌زدایی راه‌دور در صفحه inspect همان مرورگر فعال است
- مرورگر نمایش داده شده و شما اعلان رضایت اتصال را پذیرفته‌اید
- `openclaw doctor` پیکربندی قدیمی مرورگر مبتنی بر افزونه را مهاجرت می‌دهد و بررسی می‌کند که
  Chrome برای پروفایل‌های پیش‌فرض اتصال خودکار به‌صورت محلی نصب شده باشد، اما نمی‌تواند
  اشکال‌زدایی راه‌دور سمت مرورگر را برای شما فعال کند

استفاده عامل:

- وقتی به وضعیت مرورگر واردشده کاربر نیاز دارید، از `profile="user"` استفاده کنید.
- اگر از پروفایل نشست موجود سفارشی استفاده می‌کنید، همان نام پروفایل صریح را پاس دهید.
- این حالت را فقط وقتی انتخاب کنید که کاربر پشت رایانه حضور دارد تا اعلان اتصال را تأیید کند.
- Gateway یا میزبان Node می‌تواند `npx chrome-devtools-mcp@latest --autoConnect` را اجرا کند

نکته‌ها:

- این مسیر از پروفایل ایزوله `openclaw` پرریسک‌تر است، چون می‌تواند
  داخل نشست مرورگرِ واردشده شما عمل کند.
- OpenClaw مرورگر را برای این درایور اجرا نمی‌کند؛ فقط متصل می‌شود.
- OpenClaw در اینجا از جریان رسمی Chrome DevTools MCP `--autoConnect` استفاده می‌کند. اگر
  `userDataDir` تنظیم شده باشد، برای هدف‌گرفتن همان دایرکتوری داده کاربر ارسال می‌شود.
- نشست موجود می‌تواند روی میزبان انتخاب‌شده یا از طریق یک Node مرورگر متصل، وصل شود. اگر Chrome جای دیگری قرار دارد و هیچ Node مرورگری متصل نیست، به‌جای آن از
  CDP راه‌دور یا میزبان Node استفاده کنید.

### اجرای سفارشی Chrome MCP

وقتی جریان پیش‌فرض `npx chrome-devtools-mcp@latest` چیزی نیست که می‌خواهید (میزبان‌های آفلاین،
نسخه‌های سنجاق‌شده، باینری‌های vendored)، سرور Chrome DevTools MCP اجراشده را برای هر پروفایل بازنویسی کنید:

| فیلد        | کاری که انجام می‌دهد                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | فایل اجرایی‌ای که به‌جای `npx` اجرا می‌شود. همان‌طور که هست resolve می‌شود؛ مسیرهای مطلق رعایت می‌شوند.                                          |
| `mcpArgs`    | آرایه آرگومان که عیناً به `mcpCommand` پاس داده می‌شود. آرگومان‌های پیش‌فرض `chrome-devtools-mcp@latest --autoConnect` را جایگزین می‌کند. |

وقتی `cdpUrl` روی یک پروفایل نشست موجود تنظیم شده باشد، OpenClaw از
`--autoConnect` عبور می‌کند و endpoint را به‌صورت خودکار به Chrome MCP ارسال می‌کند:

- `http(s)://...` → `--browserUrl <url>` (endpoint کشف HTTP DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (CDP WebSocket مستقیم).

فلگ‌های endpoint و `userDataDir` را نمی‌توان با هم ترکیب کرد: وقتی `cdpUrl` تنظیم شده باشد،
`userDataDir` برای اجرای Chrome MCP نادیده گرفته می‌شود، چون Chrome MCP به
مرورگر در حال اجرا پشت endpoint متصل می‌شود، نه اینکه یک دایرکتوری
پروفایل را باز کند.

<Accordion title="Existing-session feature limitations">

در مقایسه با پروفایل مدیریت‌شده `openclaw`، درایورهای نشست موجود محدودتر هستند:

- **اسکرین‌شات‌ها** - ثبت صفحه و ثبت عنصر با `--ref` کار می‌کند؛ selectorهای CSS `--element` کار نمی‌کنند. `--full-page` نمی‌تواند با `--ref` یا `--element` ترکیب شود. Playwright برای اسکرین‌شات‌های صفحه یا عنصر مبتنی بر ref لازم نیست.
- **اقدام‌ها** - `click`، `type`، `hover`، `scrollIntoView`، `drag`، و `select` به refهای snapshot نیاز دارند (بدون selectorهای CSS). `click-coords` روی مختصات viewport قابل مشاهده کلیک می‌کند و به ref snapshot نیاز ندارد. `click` فقط با دکمه چپ است. `type` از `slowly=true` پشتیبانی نمی‌کند؛ از `fill` یا `press` استفاده کنید. `press` از `delayMs` پشتیبانی نمی‌کند. `type`، `hover`، `scrollIntoView`، `drag`، `select`، `fill`، و `evaluate` از timeoutهای هر فراخوانی پشتیبانی نمی‌کنند. `select` یک مقدار واحد می‌پذیرد.
- **انتظار / بارگذاری / دیالوگ** - `wait --url` از الگوهای دقیق، زیررشته، و glob پشتیبانی می‌کند؛ `wait --load networkidle` پشتیبانی نمی‌شود. hookهای upload به `ref` یا `inputRef` نیاز دارند، هر بار یک فایل، بدون CSS `element`. hookهای dialog از بازنویسی timeout پشتیبانی نمی‌کنند.
- **قابلیت‌های فقط مدیریت‌شده** - اقدام‌های دسته‌ای، خروجی PDF، رهگیری دانلود، و `responsebody` همچنان به مسیر مرورگر مدیریت‌شده نیاز دارند.

</Accordion>

## تضمین‌های ایزولاسیون

- **دایرکتوری داده کاربر اختصاصی**: هرگز به پروفایل مرورگر شخصی شما دست نمی‌زند.
- **پورت‌های اختصاصی**: از `9222` اجتناب می‌کند تا از برخورد با گردش‌کارهای توسعه جلوگیری شود.
- **کنترل قطعی تب**: `tabs` ابتدا `suggestedTargetId` را برمی‌گرداند، سپس
  handleهای پایدار `tabId` مانند `t1`، برچسب‌های اختیاری، و `targetId` خام را.
  Agentها باید `suggestedTargetId` را دوباره استفاده کنند؛ شناسه‌های خام برای
  اشکال‌زدایی و سازگاری همچنان در دسترس می‌مانند.

## انتخاب مرورگر

هنگام اجرای محلی، OpenClaw نخستین مورد در دسترس را انتخاب می‌کند:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

می‌توانید با `browser.executablePath` بازنویسی کنید.

پلتفرم‌ها:

- macOS: مسیرهای `/Applications` و `~/Applications` را بررسی می‌کند.
- Linux: مکان‌های رایج Chrome/Brave/Edge/Chromium را زیر `/usr/bin`،
  `/snap/bin`، `/opt/google`، `/opt/brave.com`، `/usr/lib/chromium`، و
  `/usr/lib/chromium-browser` بررسی می‌کند.
- Windows: مکان‌های نصب رایج را بررسی می‌کند.

## API کنترل (اختیاری)

برای اسکریپت‌نویسی و اشکال‌زدایی، Gateway یک **API کنترل HTTP فقط-loopback**
کوچک به‌همراه CLI متناظر `openclaw browser` ارائه می‌کند (snapshotها، refها، تقویت‌کننده‌های wait،
خروجی JSON، گردش‌کارهای اشکال‌زدایی). برای مرجع کامل، [API کنترل مرورگر](/fa/tools/browser-control) را ببینید.

## عیب‌یابی

برای مشکلات ویژه Linux (به‌خصوص snap Chromium)، [عیب‌یابی مرورگر](/fa/tools/browser-linux-troubleshooting) را ببینید.

برای راه‌اندازی‌های دومیزبانه WSL2 Gateway + Windows Chrome، [عیب‌یابی WSL2 + Windows + remote Chrome CDP](/fa/tools/browser-wsl2-windows-remote-cdp-troubleshooting) را ببینید.

### شکست راه‌اندازی CDP در برابر مسدودسازی SSRF ناوبری

این‌ها کلاس‌های شکست متفاوتی هستند و به مسیرهای کد متفاوت اشاره می‌کنند.

- **شکست راه‌اندازی یا آماده‌بودن CDP** یعنی OpenClaw نمی‌تواند تأیید کند که صفحه کنترل مرورگر سالم است.
- **مسدودسازی SSRF ناوبری** یعنی صفحه کنترل مرورگر سالم است، اما یک هدف ناوبری صفحه توسط policy رد شده است.

نمونه‌های رایج:

- شکست راه‌اندازی یا آماده‌بودن CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - وقتی یک سرویس CDP خارجی loopback بدون `attachOnly: true` پیکربندی شده باشد، `Port <port> is in use for profile "<name>" but not by openclaw`
- مسدودسازی SSRF ناوبری:
  - جریان‌های `open`، `navigate`، snapshot، یا بازکردن تب با خطای policy مرورگر/شبکه شکست می‌خورند، درحالی‌که `start` و `tabs` همچنان کار می‌کنند

برای جداکردن این دو، از این توالی حداقلی استفاده کنید:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

نحوه خواندن نتایج:

- اگر `start` با `not reachable after start` شکست خورد، ابتدا آماده‌بودن CDP را عیب‌یابی کنید.
- اگر `start` موفق شد اما `tabs` شکست خورد، صفحه کنترل همچنان ناسالم است. این را یک مشکل دسترسی‌پذیری CDP در نظر بگیرید، نه مشکل ناوبری صفحه.
- اگر `start` و `tabs` موفق شدند اما `open` یا `navigate` شکست خورد، صفحه کنترل مرورگر بالا است و شکست در policy ناوبری یا صفحه هدف است.
- اگر `start`، `tabs`، و `open` همگی موفق شدند، مسیر پایه کنترل مرورگر مدیریت‌شده سالم است.

جزئیات مهم رفتار:

- پیکربندی مرورگر حتی وقتی `browser.ssrfPolicy` را پیکربندی نمی‌کنید، به‌صورت پیش‌فرض روی یک شیء policy مسدود-در-شکست SSRF قرار می‌گیرد.
- برای پروفایل مدیریت‌شده محلی loopback `openclaw`، بررسی‌های سلامت CDP عمداً اعمال دسترسی‌پذیری SSRF مرورگر را برای صفحه کنترل محلی خود OpenClaw دور می‌زنند.
- حفاظت ناوبری جدا است. موفقیت نتیجه `start` یا `tabs` به این معنا نیست که هدف بعدی `open` یا `navigate` مجاز است.

راهنمایی امنیتی:

- به‌صورت پیش‌فرض policy SSRF مرورگر را شل **نکنید**.
- استثناهای محدود میزبان مانند `hostnameAllowlist` یا `allowedHostnames` را به دسترسی گسترده شبکه خصوصی ترجیح دهید.
- از `dangerouslyAllowPrivateNetwork: true` فقط در محیط‌های عمداً مورداعتماد استفاده کنید که دسترسی مرورگر به شبکه خصوصی لازم و بازبینی‌شده است.

## ابزارهای Agent + نحوه کار کنترل

عامل برای خودکارسازی مرورگر **یک ابزار** دریافت می‌کند:

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

نحوهٔ نگاشت آن:

- `browser snapshot` یک درخت UI پایدار (AI یا ARIA) برمی‌گرداند.
- `browser act` از شناسه‌های `ref` در snapshot برای کلیک/تایپ/کشیدن/انتخاب استفاده می‌کند.
- `browser screenshot` پیکسل‌ها را ثبت می‌کند (صفحهٔ کامل، عنصر، یا ارجاع‌های برچسب‌دار).
- `browser doctor` آمادگی Gateway، Plugin، نمایه، مرورگر، و زبانه را بررسی می‌کند.
- `browser` می‌پذیرد:
  - `profile` برای انتخاب یک نمایهٔ مرورگر نام‌گذاری‌شده (openclaw، chrome، یا CDP راه دور).
  - `target` (`sandbox` | `host` | `node`) برای انتخاب محل قرارگیری مرورگر.
  - در نشست‌های sandboxed، `target: "host"` به `agents.defaults.sandbox.browser.allowHostControl=true` نیاز دارد.
  - اگر `target` حذف شود: نشست‌های sandboxed به‌طور پیش‌فرض `sandbox` هستند، نشست‌های غیر-sandbox به‌طور پیش‌فرض `host` هستند.
  - اگر یک node دارای قابلیت مرورگر متصل باشد، ابزار ممکن است به‌طور خودکار به آن مسیریابی شود، مگر اینکه `target="host"` یا `target="node"` را ثابت کنید.

این کار عامل را قطعی نگه می‌دارد و از selectorهای شکننده جلوگیری می‌کند.

## مرتبط

- [نمای کلی ابزارها](/fa/tools) - همهٔ ابزارهای عامل در دسترس
- [Sandboxing](/fa/gateway/sandboxing) - کنترل مرورگر در محیط‌های sandboxed
- [امنیت](/fa/gateway/security) - ریسک‌های کنترل مرورگر و سخت‌سازی
