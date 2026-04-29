---
read_when:
    - افزودن خودکارسازی مرورگر تحت کنترل عامل
    - اشکال‌زدایی از اینکه چرا openclaw با Chrome خودتان تداخل ایجاد می‌کند
    - پیاده‌سازی تنظیمات مرورگر + چرخهٔ حیات در برنامهٔ macOS
summary: سرویس یکپارچهٔ کنترل مرورگر + دستورهای عملیاتی
title: مرورگر (مدیریت‌شده توسط OpenClaw)
x-i18n:
    generated_at: "2026-04-29T23:40:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: a8f0456505f4e1711626a539a0a0c48d67ca10d4788838eb53855bc83c766d2f
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw می‌تواند یک **نمایه اختصاصی Chrome/Brave/Edge/Chromium** را اجرا کند که عامل آن را کنترل می‌کند.
این نمایه از مرورگر شخصی شما جداست و از طریق یک سرویس کنترل محلی کوچک
داخل Gateway مدیریت می‌شود (فقط loopback).

نمای مبتدی:

- آن را مثل یک **مرورگر جداگانه، فقط برای عامل** در نظر بگیرید.
- نمایه `openclaw` به نمایه مرورگر شخصی شما **دست نمی‌زند**.
- عامل می‌تواند در یک مسیر امن **زبانه باز کند، صفحه‌ها را بخواند، کلیک کند و تایپ کند**.
- نمایه داخلی `user` از طریق Chrome MCP به نشست واقعی Chrome واردشده شما متصل می‌شود.

## چه چیزی دریافت می‌کنید

- یک نمایه مرورگر جداگانه به نام **openclaw** (به‌طور پیش‌فرض با تاکید نارنجی).
- کنترل قطعی زبانه‌ها (فهرست/باز کردن/تمرکز/بستن).
- کنش‌های عامل (کلیک/تایپ/کشیدن/انتخاب)، snapshotها، screenshotها، PDFها.
- یک skill همراه `browser-automation` که وقتی Plugin مرورگر فعال است، حلقه بازیابی snapshot،
  زبانه پایدار، ارجاع منقضی‌شده و مانع دستی را به عامل‌ها آموزش می‌دهد.
- پشتیبانی اختیاری از چند نمایه (`openclaw`، `work`، `remote`، ...).

این مرورگر **مرورگر روزمره شما نیست**. این یک سطح امن و ایزوله برای
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

اگر `openclaw browser` اصلا وجود ندارد، یا عامل می‌گوید ابزار مرورگر
در دسترس نیست، به [دستور یا ابزار مرورگر گم‌شده](/fa/tools/browser#missing-browser-command-or-tool) بروید.

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

پیش‌فرض‌ها هم به `plugins.entries.browser.enabled` **و هم** به `browser.enabled=true` نیاز دارند. غیرفعال کردن فقط Plugin، CLI `openclaw browser`، روش Gateway `browser.request`، ابزار عامل و سرویس کنترل را به‌صورت یک واحد حذف می‌کند؛ پیکربندی `browser.*` شما برای جایگزین دست‌نخورده می‌ماند.

تغییرات پیکربندی مرورگر به راه‌اندازی دوباره Gateway نیاز دارند تا Plugin بتواند سرویس خود را دوباره ثبت کند.

## راهنمای عامل

نکته نمایه ابزار: `tools.profile: "coding"` شامل `web_search` و
`web_fetch` است، اما ابزار کامل `browser` را شامل نمی‌شود. اگر عامل یا یک
زیرعامل ایجادشده باید از خودکارسازی مرورگر استفاده کند، مرورگر را در مرحله
نمایه اضافه کنید:

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
پس از فیلترسازی نمایه اعمال می‌شود.

Plugin مرورگر دو سطح راهنمای عامل ارائه می‌کند:

- توضیح ابزار `browser` قرارداد فشرده همیشه‌فعال را دارد: نمایه درست را انتخاب کنید،
  ارجاع‌ها را روی همان زبانه نگه دارید، برای هدف‌گیری زبانه از `tabId`/برچسب‌ها استفاده کنید
  و برای کار چندمرحله‌ای skill مرورگر را بارگذاری کنید.
- skill همراه `browser-automation` حلقه عملیاتی طولانی‌تر را دارد:
  ابتدا وضعیت/زبانه‌ها را بررسی کنید، به زبانه‌های کار برچسب بزنید، پیش از اقدام snapshot بگیرید، پس از تغییرات UI دوباره snapshot بگیرید،
  ارجاع‌های منقضی‌شده را یک‌بار بازیابی کنید و ورود/2FA/captcha یا
  مانع‌های دوربین/میکروفون را به‌جای حدس زدن به‌عنوان اقدام دستی گزارش کنید.

Skills همراه Plugin وقتی Plugin فعال باشد در Skills در دسترس عامل فهرست می‌شوند.
دستورالعمل‌های کامل skill در صورت نیاز بارگذاری می‌شوند، بنابراین نوبت‌های معمول
هزینه کامل توکن را نمی‌پردازند.

## دستور یا ابزار مرورگر گم‌شده

اگر پس از ارتقا `openclaw browser` ناشناخته است، `browser.request` وجود ندارد، یا عامل ابزار مرورگر را ناموجود گزارش می‌کند، علت معمول یک فهرست `plugins.allow` است که `browser` را حذف کرده و هیچ بلوک پیکربندی ریشه `browser` وجود ندارد. آن را اضافه کنید:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

یک بلوک صریح ریشه `browser`، برای مثال `browser.enabled=true` یا `browser.profiles.<name>`، Plugin مرورگر همراه را حتی زیر یک `plugins.allow` محدودکننده فعال می‌کند، مطابق رفتار پیکربندی کانال. `plugins.entries.browser.enabled=true` و `tools.alsoAllow: ["browser"]` به‌تنهایی جایگزین عضویت در فهرست مجاز نمی‌شوند. حذف کامل `plugins.allow` نیز پیش‌فرض را بازیابی می‌کند.

## نمایه‌ها: `openclaw` در برابر `user`

- `openclaw`: مرورگر مدیریت‌شده و ایزوله (بدون نیاز به افزونه).
- `user`: نمایه اتصال داخلی Chrome MCP برای نشست **واقعی Chrome واردشده**
  شما.

برای فراخوانی‌های ابزار مرورگر عامل:

- پیش‌فرض: از مرورگر ایزوله `openclaw` استفاده کنید.
- وقتی نشست‌های واردشده موجود اهمیت دارند و کاربر پشت رایانه است تا هر اعلان اتصال را کلیک/تایید کند،
  `profile="user"` را ترجیح دهید.
- وقتی حالت مرورگر خاصی می‌خواهید، `profile` بازنویسی صریح است.

اگر حالت مدیریت‌شده را به‌طور پیش‌فرض می‌خواهید، `browser.defaultProfile: "openclaw"` را تنظیم کنید.

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

- سرویس کنترل به loopback روی پورتی مشتق‌شده از `gateway.port` متصل می‌شود (پیش‌فرض `18791` = gateway + 2). بازنویسی `gateway.port` یا `OPENCLAW_GATEWAY_PORT` پورت‌های مشتق‌شده را در همان خانواده جابه‌جا می‌کند.
- نمایه‌های محلی `openclaw` به‌صورت خودکار `cdpPort`/`cdpUrl` را اختصاص می‌دهند؛ این‌ها را فقط برای CDP راه‌دور تنظیم کنید. وقتی تنظیم نشده باشد، `cdpUrl` به پورت CDP محلی مدیریت‌شده پیش‌فرض می‌شود.
- `remoteCdpTimeoutMs` برای بررسی‌های دسترس‌پذیری HTTP CDP راه‌دور و `attachOnly`
  و درخواست‌های HTTP باز کردن زبانه اعمال می‌شود؛ `remoteCdpHandshakeTimeoutMs` برای
  handshakeهای WebSocket CDP آن‌ها اعمال می‌شود.
- `localLaunchTimeoutMs` بودجه زمانی برای یک فرایند Chrome مدیریت‌شده محلی است تا
  endpoint HTTP CDP خود را در معرض بگذارد. `localCdpReadyTimeoutMs` بودجه
  بعدی برای آمادگی websocket CDP پس از کشف فرایند است.
  این‌ها را روی Raspberry Pi، VPSهای ضعیف، یا سخت‌افزار قدیمی‌تر که Chromium
  کند شروع می‌شود افزایش دهید. مقدارها باید عدد صحیح مثبت تا `120000` ms باشند؛ مقدارهای
  پیکربندی نامعتبر رد می‌شوند.
- شکست‌های تکراری راه‌اندازی/آمادگی Chrome مدیریت‌شده به‌ازای هر
  نمایه circuit-break می‌شوند. پس از چند شکست متوالی، OpenClaw به‌جای اجرای Chromium در هر فراخوانی ابزار مرورگر،
  تلاش‌های راه‌اندازی تازه را کوتاه‌مدت متوقف می‌کند. مشکل شروع را برطرف کنید، اگر مرورگر لازم نیست آن را غیرفعال کنید، یا پس از تعمیر
  Gateway را دوباره راه‌اندازی کنید.
- `actionTimeoutMs` بودجه پیش‌فرض برای درخواست‌های `act` مرورگر است وقتی فراخواننده `timeoutMs` را ارسال نکند. انتقال کلاینت یک پنجره مهلت کوچک اضافه می‌کند تا انتظارهای طولانی به‌جای timeout شدن در مرز HTTP تمام شوند.
- `tabCleanup` پاک‌سازی best-effort برای زبانه‌هایی است که نشست‌های مرورگر عامل اصلی باز کرده‌اند. پاک‌سازی چرخه عمر زیرعامل، cron و ACP همچنان زبانه‌های ردیابی‌شده صریح خود را در پایان نشست می‌بندد؛ نشست‌های اصلی زبانه‌های فعال را قابل استفاده دوباره نگه می‌دارند، سپس زبانه‌های ردیابی‌شده بیکار یا اضافی را در پس‌زمینه می‌بندند.

</Accordion>

<Accordion title="SSRF policy">

- ناوبری مرورگر و باز کردن زبانه پیش از ناوبری با محافظ SSRF بررسی می‌شوند و سپس در URL نهایی `http(s)` به‌صورت best-effort دوباره بررسی می‌شوند.
- در حالت سخت‌گیرانه SSRF، کشف endpoint CDP راه‌دور و probeهای `/json/version` (`cdpUrl`) نیز بررسی می‌شوند.
- متغیرهای محیطی Gateway/ارائه‌دهنده `HTTP_PROXY`، `HTTPS_PROXY`، `ALL_PROXY` و `NO_PROXY` به‌طور خودکار مرورگر مدیریت‌شده توسط OpenClaw را proxy نمی‌کنند. Chrome مدیریت‌شده به‌طور پیش‌فرض مستقیم اجرا می‌شود تا تنظیمات proxy ارائه‌دهنده بررسی‌های SSRF مرورگر را تضعیف نکنند.
- برای proxy کردن خود مرورگر مدیریت‌شده، flagهای صریح proxy Chrome را از طریق `browser.extraArgs` ارسال کنید، مثل `--proxy-server=...` یا `--proxy-pac-url=...`. حالت سخت‌گیرانه SSRF مسیریابی صریح proxy مرورگر را مسدود می‌کند مگر اینکه دسترسی مرورگر به شبکه خصوصی عمدا فعال شده باشد.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` به‌طور پیش‌فرض خاموش است؛ فقط وقتی دسترسی مرورگر به شبکه خصوصی عمدا مورد اعتماد است فعال کنید.
- `browser.ssrfPolicy.allowPrivateNetwork` همچنان به‌عنوان نام مستعار قدیمی پشتیبانی می‌شود.

</Accordion>

<Accordion title="Profile behavior">

- `attachOnly: true` یعنی هرگز مرورگر محلی را اجرا نکن؛ فقط در صورتی متصل شو که از قبل در حال اجرا باشد.
- `headless` را می‌توان به‌صورت سراسری یا برای هر نمایهٔ مدیریت‌شدهٔ محلی تنظیم کرد. مقدارهای هر نمایه `browser.headless` را بازنویسی می‌کنند، بنابراین یک نمایهٔ اجراشدهٔ محلی می‌تواند headless بماند در حالی که نمایهٔ دیگر قابل مشاهده باشد.
- `POST /start?headless=true` و `openclaw browser start --headless` برای نمایه‌های مدیریت‌شدهٔ محلی، اجرای headless یک‌باره درخواست می‌کنند، بدون اینکه `browser.headless` یا پیکربندی نمایه را بازنویسی کنند. نمایه‌های نشست موجود، فقط-اتصال، و CDP راه‌دور این بازنویسی را رد می‌کنند، چون OpenClaw آن فرایندهای مرورگر را اجرا نمی‌کند.
- روی میزبان‌های Linux بدون `DISPLAY` یا `WAYLAND_DISPLAY`، نمایه‌های مدیریت‌شدهٔ محلی وقتی نه محیط و نه پیکربندی نمایه/سراسری به‌صراحت حالت headed را انتخاب نکرده باشند، به‌طور خودکار به headless پیش‌فرض می‌شوند. `openclaw browser status --json` مقدار `headlessSource` را به‌صورت `env`، `profile`، `config`، `request`، `linux-display-fallback`، یا `default` گزارش می‌کند.
- `OPENCLAW_BROWSER_HEADLESS=1` اجرای مدیریت‌شدهٔ محلی را برای فرایند فعلی به headless اجبار می‌کند. `OPENCLAW_BROWSER_HEADLESS=0` برای شروع‌های عادی حالت headed را اجبار می‌کند و روی میزبان‌های Linux بدون سرور نمایش، خطایی قابل اقدام برمی‌گرداند؛ درخواست صریح `start --headless` همچنان برای همان یک اجرا اولویت دارد.
- `executablePath` را می‌توان به‌صورت سراسری یا برای هر نمایهٔ مدیریت‌شدهٔ محلی تنظیم کرد. مقدارهای هر نمایه `browser.executablePath` را بازنویسی می‌کنند، بنابراین نمایه‌های مدیریت‌شدهٔ متفاوت می‌توانند مرورگرهای متفاوت مبتنی بر Chromium را اجرا کنند. هر دو شکل برای دایرکتوری خانهٔ سیستم‌عامل شما `~` را می‌پذیرند.
- `color` (در سطح بالا و برای هر نمایه) رابط کاربری مرورگر را رنگی می‌کند تا بتوانید ببینید کدام نمایه فعال است.
- نمایهٔ پیش‌فرض `openclaw` است (مستقلِ مدیریت‌شده). برای انتخاب مرورگر کاربر واردشده، از `defaultProfile: "user"` استفاده کنید.
- ترتیب تشخیص خودکار: مرورگر پیش‌فرض سیستم اگر مبتنی بر Chromium باشد؛ در غیر این صورت Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` به‌جای CDP خام، از Chrome DevTools MCP استفاده می‌کند. برای این driver مقدار `cdpUrl` تنظیم نکنید.
- وقتی یک نمایهٔ نشست موجود باید به یک نمایهٔ کاربری غیرپیش‌فرض Chromium متصل شود (Brave، Edge، و غیره)، `browser.profiles.<name>.userDataDir` را تنظیم کنید. این مسیر نیز برای دایرکتوری خانهٔ سیستم‌عامل شما `~` را می‌پذیرد.

</Accordion>

</AccordionGroup>

## استفاده از Brave یا مرورگر دیگری مبتنی بر Chromium

اگر مرورگر **پیش‌فرض سیستم** شما مبتنی بر Chromium باشد (Chrome/Brave/Edge/و غیره)،
OpenClaw به‌طور خودکار از آن استفاده می‌کند. برای بازنویسی تشخیص خودکار،
`browser.executablePath` را تنظیم کنید. مقدارهای `executablePath` در سطح بالا و برای هر نمایه، برای دایرکتوری خانهٔ سیستم‌عامل شما `~` را می‌پذیرند:

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

`executablePath` هر نمایه فقط روی نمایه‌های مدیریت‌شدهٔ محلی‌ای اثر می‌گذارد که OpenClaw
اجرا می‌کند. نمایه‌های `existing-session` در عوض به مرورگری که از قبل در حال اجراست متصل می‌شوند،
و نمایه‌های CDP راه‌دور از مرورگر پشت `cdpUrl` استفاده می‌کنند.

## کنترل محلی در برابر راه‌دور

- **کنترل محلی (پیش‌فرض):** Gateway سرویس کنترل loopback را شروع می‌کند و می‌تواند یک مرورگر محلی را اجرا کند.
- **کنترل راه‌دور (میزبان Node):** یک میزبان Node را روی دستگاهی که مرورگر را دارد اجرا کنید؛ Gateway کنش‌های مرورگر را به آن پروکسی می‌کند.
- **CDP راه‌دور:** `browser.profiles.<name>.cdpUrl` (یا `browser.cdpUrl`) را تنظیم کنید تا به یک مرورگر راه‌دور مبتنی بر Chromium متصل شود. در این حالت، OpenClaw مرورگر محلی اجرا نمی‌کند.
- برای سرویس‌های CDP مدیریت‌شدهٔ خارجی روی loopback (برای مثال Browserless در
  Docker منتشرشده روی `127.0.0.1`)، همچنین `attachOnly: true` را تنظیم کنید. CDP روی loopback
  بدون `attachOnly` به‌عنوان نمایهٔ مرورگر مدیریت‌شدهٔ محلی OpenClaw در نظر گرفته می‌شود.
- `headless` فقط روی نمایه‌های مدیریت‌شدهٔ محلی‌ای اثر می‌گذارد که OpenClaw اجرا می‌کند. مرورگرهای نشست موجود یا CDP راه‌دور را دوباره راه‌اندازی یا تغییر نمی‌دهد.
- `executablePath` از همان قاعدهٔ نمایهٔ مدیریت‌شدهٔ محلی پیروی می‌کند. تغییر آن روی یک نمایهٔ مدیریت‌شدهٔ محلی در حال اجرا، آن نمایه را برای راه‌اندازی دوباره/همگام‌سازی علامت‌گذاری می‌کند تا اجرای بعدی از باینری جدید استفاده کند.

رفتار توقف بسته به حالت نمایه متفاوت است:

- نمایه‌های مدیریت‌شدهٔ محلی: `openclaw browser stop` فرایند مرورگری را که OpenClaw اجرا کرده است متوقف می‌کند
- نمایه‌های فقط-اتصال و CDP راه‌دور: `openclaw browser stop` نشست کنترل فعال را می‌بندد و بازنویسی‌های شبیه‌سازی Playwright/CDP را آزاد می‌کند (viewport، طرح رنگ، locale، timezone، حالت offline، و وضعیت‌های مشابه)، هرچند هیچ فرایند مرورگری توسط OpenClaw اجرا نشده باشد

URLهای CDP راه‌دور می‌توانند شامل احراز هویت باشند:

- توکن‌های پرس‌وجو (مثلاً `https://provider.example?token=<token>`)
- احراز هویت HTTP Basic (مثلاً `https://user:pass@provider.example`)

OpenClaw هنگام فراخوانی endpointهای `/json/*` و هنگام اتصال
به CDP WebSocket، احراز هویت را حفظ می‌کند. برای توکن‌ها به‌جای commit کردن آن‌ها در فایل‌های پیکربندی، از متغیرهای محیطی یا مدیرهای secrets استفاده کنید.

## پروکسی مرورگر Node (پیش‌فرض بدون پیکربندی)

اگر یک **میزبان Node** را روی دستگاهی که مرورگر شما را دارد اجرا کنید، OpenClaw می‌تواند
فراخوانی‌های ابزار مرورگر را بدون هیچ پیکربندی اضافهٔ مرورگر، به‌طور خودکار به آن Node هدایت کند.
این مسیر پیش‌فرض برای gatewayهای راه‌دور است.

نکته‌ها:

- میزبان Node سرور کنترل مرورگر محلی خود را از طریق یک **فرمان پروکسی** در دسترس قرار می‌دهد.
- نمایه‌ها از پیکربندی `browser.profiles` خود Node می‌آیند (مانند محلی).
- `nodeHost.browserProxy.allowProfiles` اختیاری است. برای رفتار قدیمی/پیش‌فرض آن را خالی بگذارید: همهٔ نمایه‌های پیکربندی‌شده از طریق پروکسی در دسترس می‌مانند، از جمله مسیرهای ایجاد/حذف نمایه.
- اگر `nodeHost.browserProxy.allowProfiles` را تنظیم کنید، OpenClaw آن را مرز کمترین-دسترسی در نظر می‌گیرد: فقط نمایه‌های allowlist‌شده می‌توانند هدف قرار بگیرند، و مسیرهای پایدار ایجاد/حذف نمایه روی سطح پروکسی مسدود می‌شوند.
- اگر آن را نمی‌خواهید غیرفعال کنید:
  - روی Node: `nodeHost.browserProxy.enabled=false`
  - روی gateway: `gateway.nodes.browser.mode="off"`

## Browserless (CDP راه‌دور میزبانی‌شده)

[Browserless](https://browserless.io) یک سرویس Chromium میزبانی‌شده است که
URLهای اتصال CDP را از طریق HTTPS و WebSocket ارائه می‌کند. OpenClaw می‌تواند از هر دو شکل استفاده کند، اما
برای یک نمایهٔ مرورگر راه‌دور ساده‌ترین گزینه URL مستقیم WebSocket
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
- endpoint منطقه‌ای را انتخاب کنید که با حساب Browserless شما مطابقت دارد (مستندات آن‌ها را ببینید).
- اگر Browserless یک URL پایهٔ HTTPS به شما می‌دهد، می‌توانید آن را برای اتصال مستقیم CDP به
  `wss://` تبدیل کنید یا URL HTTPS را نگه دارید و بگذارید OpenClaw
  `/json/version` را کشف کند.

### Browserless Docker روی همان میزبان

وقتی Browserless به‌صورت self-hosted در Docker اجرا می‌شود و OpenClaw روی میزبان اجرا می‌شود، با
Browserless مثل یک سرویس CDP مدیریت‌شدهٔ خارجی رفتار کنید:

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

نشانی در `browser.profiles.browserless.cdpUrl` باید از فرایند
OpenClaw قابل دسترسی باشد. Browserless همچنین باید endpoint قابل دسترسی متناظری را advertise کند؛ مقدار `EXTERNAL` در Browserless را به همان پایهٔ WebSocket عمومی-به-OpenClaw تنظیم کنید، مانند
`ws://127.0.0.1:3000`، `ws://browserless:3000`، یا یک نشانی پایدار شبکهٔ خصوصی Docker. اگر `/json/version` مقدار `webSocketDebuggerUrl` را نشان دهد که به نشانی‌ای اشاره می‌کند که
OpenClaw نمی‌تواند به آن برسد، CDP HTTP ممکن است سالم به نظر برسد در حالی که اتصال WebSocket
هنوز شکست می‌خورد.

برای یک نمایهٔ Browserless روی loopback، `attachOnly` را تنظیم‌نشده رها نکنید. بدون
`attachOnly`، OpenClaw پورت loopback را به‌عنوان نمایهٔ مرورگر مدیریت‌شدهٔ محلی
در نظر می‌گیرد و ممکن است گزارش کند که پورت در حال استفاده است اما متعلق به OpenClaw نیست.

## ارائه‌دهندگان CDP با WebSocket مستقیم

برخی سرویس‌های مرورگر میزبانی‌شده به‌جای کشف CDP استاندارد مبتنی بر HTTP
(`/json/version`)، یک endpoint **WebSocket مستقیم** ارائه می‌کنند. OpenClaw سه
شکل URL CDP را می‌پذیرد و راهبرد اتصال درست را به‌طور خودکار انتخاب می‌کند:

- **کشف HTTP(S)** — `http://host[:port]` یا `https://host[:port]`.
  OpenClaw برای کشف URL اشکال‌زدای WebSocket، `/json/version` را فراخوانی می‌کند، سپس
  متصل می‌شود. بدون fallback برای WebSocket.
- **endpointهای WebSocket مستقیم** — `ws://host[:port]/devtools/<kind>/<id>` یا
  `wss://...` با مسیر `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw مستقیماً از طریق handshake وب‌سوکت متصل می‌شود و
  `/json/version` را کاملاً رد می‌کند.
- **ریشه‌های WebSocket ساده** — `ws://host[:port]` یا `wss://host[:port]` بدون مسیر
  `/devtools/...` (مثلاً [Browserless](https://browserless.io)،
  [Browserbase](https://www.browserbase.com)). OpenClaw ابتدا کشف HTTP
  `/json/version` را امتحان می‌کند (با normalise کردن scheme به `http`/`https`)؛
  اگر کشف یک `webSocketDebuggerUrl` برگرداند، از آن استفاده می‌شود، در غیر این صورت OpenClaw
  به handshake مستقیم WebSocket در ریشهٔ ساده fallback می‌کند. اگر endpoint
  WebSocket اعلام‌شده handshake CDP را رد کند اما ریشهٔ سادهٔ پیکربندی‌شده
  آن را بپذیرد، OpenClaw به آن ریشه نیز fallback می‌کند. این باعث می‌شود یک `ws://` ساده
  که به Chrome محلی اشاره می‌کند همچنان متصل شود، چون Chrome ارتقاهای WebSocket را فقط
  روی مسیر مشخص هر target از `/json/version` می‌پذیرد، در حالی که ارائه‌دهندگان میزبانی‌شده
  همچنان می‌توانند از endpoint ریشهٔ WebSocket خود استفاده کنند وقتی endpoint کشف آن‌ها
  URL کوتاه‌عمری را advertise می‌کند که برای CDP در Playwright مناسب نیست.

### Browserbase

[Browserbase](https://www.browserbase.com) یک پلتفرم ابری برای اجرای
مرورگرهای headless با حل CAPTCHA داخلی، حالت stealth، و پروکسی‌های residential
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
  مرحلهٔ ایجاد دستی نشست لازم نیست.
- سطح رایگان اجازهٔ یک نشست هم‌زمان و یک ساعت مرورگر در ماه را می‌دهد.
  برای محدودیت‌های طرح‌های پولی، [قیمت‌گذاری](https://www.browserbase.com/pricing) را ببینید.
- برای مرجع کامل API، راهنماهای SDK، و مثال‌های یکپارچه‌سازی، [مستندات Browserbase](https://docs.browserbase.com) را ببینید.

## امنیت

ایده‌های کلیدی:

- کنترل مرورگر فقط به loopback محدود است؛ جریان‌های دسترسی از طریق احراز هویت Gateway یا جفت‌سازی node عبور می‌کنند.
- API مستقل HTTP مرورگر loopback فقط از **احراز هویت با راز مشترک** استفاده می‌کند:
  احراز هویت حامل توکن Gateway، `x-openclaw-password`، یا احراز هویت HTTP Basic با
  رمز عبور Gateway پیکربندی‌شده.
- هدرهای هویت Tailscale Serve و `gateway.auth.mode: "trusted-proxy"`
  این API مستقل مرورگر loopback را **احراز هویت نمی‌کنند**.
- اگر کنترل مرورگر فعال باشد و هیچ احراز هویت با راز مشترکی پیکربندی نشده باشد، OpenClaw
  هنگام راه‌اندازی `gateway.auth.token` را خودکار تولید می‌کند و آن را در پیکربندی پایدار می‌سازد.
- وقتی `gateway.auth.mode` از قبل
  `password`، `none`، یا `trusted-proxy` باشد، OpenClaw آن توکن را **خودکار تولید نمی‌کند**.
- Gateway و هر میزبان node را روی یک شبکه خصوصی (Tailscale) نگه دارید؛ از در معرض عموم قرار دادن پرهیز کنید.
- URLها/توکن‌های CDP راه دور را مانند رازها در نظر بگیرید؛ متغیرهای محیطی یا مدیر رازها را ترجیح دهید.

نکته‌های CDP راه دور:

- در صورت امکان، endpointهای رمزگذاری‌شده (HTTPS یا WSS) و توکن‌های کوتاه‌عمر را ترجیح دهید.
- از جاسازی مستقیم توکن‌های بلندعمر در فایل‌های پیکربندی پرهیز کنید.

## پروفایل‌ها (چندمرورگری)

OpenClaw از چند پروفایل نام‌گذاری‌شده (پیکربندی‌های مسیریابی) پشتیبانی می‌کند. پروفایل‌ها می‌توانند این‌ها باشند:

- **مدیریت‌شده توسط openclaw**: یک نمونه اختصاصی مرورگر مبتنی بر Chromium با پوشه داده کاربر و درگاه CDP خودش
- **راه دور**: یک URL صریح CDP (مرورگر مبتنی بر Chromium که در جای دیگری اجرا می‌شود)
- **نشست موجود**: پروفایل Chrome موجود شما از طریق اتصال خودکار Chrome DevTools MCP

پیش‌فرض‌ها:

- اگر پروفایل `openclaw` وجود نداشته باشد، خودکار ایجاد می‌شود.
- پروفایل `user` برای اتصال نشست موجود Chrome MCP به‌صورت توکار وجود دارد.
- پروفایل‌های نشست موجود، فراتر از `user`، اختیاری هستند؛ آن‌ها را با `--driver existing-session` ایجاد کنید.
- درگاه‌های محلی CDP به‌طور پیش‌فرض از **18800–18899** اختصاص می‌یابند.
- حذف یک پروفایل، پوشه داده محلی آن را به Trash منتقل می‌کند.

همه endpointهای کنترل `?profile=<name>` را می‌پذیرند؛ CLI از `--browser-profile` استفاده می‌کند.

## نشست موجود از طریق Chrome DevTools MCP

OpenClaw همچنین می‌تواند از طریق
سرور رسمی Chrome DevTools MCP به یک پروفایل مرورگر مبتنی بر Chromium در حال اجرا متصل شود. این کار از تب‌ها و وضعیت ورود
که از قبل در آن پروفایل مرورگر باز هستند، دوباره استفاده می‌کند.

منابع رسمی زمینه و راه‌اندازی:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

پروفایل توکار:

- `user`

اختیاری: اگر نام، رنگ، یا پوشه داده مرورگر متفاوتی می‌خواهید، پروفایل نشست موجود سفارشی خودتان را ایجاد کنید.

رفتار پیش‌فرض:

- پروفایل توکار `user` از اتصال خودکار Chrome MCP استفاده می‌کند که
  پروفایل محلی پیش‌فرض Google Chrome را هدف می‌گیرد.

برای Brave، Edge، Chromium، یا یک پروفایل غیرپیش‌فرض Chrome از `userDataDir` استفاده کنید.
`~` به پوشه خانه سیستم‌عامل شما گسترش می‌یابد:

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
3. مرورگر را در حال اجرا نگه دارید و وقتی OpenClaw متصل می‌شود، درخواست تأیید اتصال را بپذیرید.

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

موفقیت به این شکل دیده می‌شود:

- `status` مقدار `driver: existing-session` را نشان می‌دهد
- `status` مقدار `transport: chrome-mcp` را نشان می‌دهد
- `status` مقدار `running: true` را نشان می‌دهد
- `tabs` تب‌های مرورگر شما را که از قبل باز هستند فهرست می‌کند
- `snapshot` از تب زنده انتخاب‌شده refs برمی‌گرداند

اگر اتصال کار نکرد، این موارد را بررسی کنید:

- مرورگر هدف مبتنی بر Chromium نسخه `144+` است
- اشکال‌زدایی راه دور در صفحه inspect آن مرورگر فعال است
- مرورگر نمایش داده شده و شما درخواست رضایت اتصال را پذیرفته‌اید
- `openclaw doctor` پیکربندی قدیمی مرورگر مبتنی بر plugin را مهاجرت می‌دهد و بررسی می‌کند که
  Chrome برای پروفایل‌های اتصال خودکار پیش‌فرض به‌صورت محلی نصب شده باشد، اما نمی‌تواند
  اشکال‌زدایی راه دور سمت مرورگر را برای شما فعال کند

استفاده توسط عامل:

- وقتی به وضعیت ورود مرورگر کاربر نیاز دارید، از `profile="user"` استفاده کنید.
- اگر از یک پروفایل نشست موجود سفارشی استفاده می‌کنید، همان نام پروفایل صریح را ارسال کنید.
- این حالت را فقط وقتی انتخاب کنید که کاربر پشت کامپیوتر باشد تا
  درخواست اتصال را تأیید کند.
- Gateway یا میزبان node می‌تواند `npx chrome-devtools-mcp@latest --autoConnect` را اجرا کند

یادداشت‌ها:

- این مسیر نسبت به پروفایل ایزوله `openclaw` پرریسک‌تر است، چون می‌تواند
  داخل نشست مرورگر واردشده شما عمل کند.
- OpenClaw مرورگر را برای این driver اجرا نمی‌کند؛ فقط متصل می‌شود.
- OpenClaw اینجا از جریان رسمی Chrome DevTools MCP `--autoConnect` استفاده می‌کند. اگر
  `userDataDir` تنظیم شده باشد، برای هدف گرفتن همان پوشه داده کاربر به آن پاس داده می‌شود.
- نشست موجود می‌تواند روی میزبان انتخاب‌شده یا از طریق یک
  node مرورگر متصل attach شود. اگر Chrome جای دیگری قرار دارد و هیچ node مرورگری متصل نیست، به‌جای آن از
  CDP راه دور یا یک میزبان node استفاده کنید.

### اجرای سفارشی Chrome MCP

سرور Chrome DevTools MCP اجراشده را برای هر پروفایل بازنویسی کنید، وقتی جریان پیش‌فرض
`npx chrome-devtools-mcp@latest` چیزی نیست که می‌خواهید (میزبان‌های آفلاین،
نسخه‌های pin‌شده، باینری‌های vendored):

| فیلد        | کاری که انجام می‌دهد                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | فایل اجرایی‌ای که به‌جای `npx` اجرا می‌شود. همان‌طور که هست resolve می‌شود؛ مسیرهای مطلق رعایت می‌شوند.                                          |
| `mcpArgs`    | آرایه آرگومان که عیناً به `mcpCommand` پاس داده می‌شود. آرگومان‌های پیش‌فرض `chrome-devtools-mcp@latest --autoConnect` را جایگزین می‌کند. |

وقتی `cdpUrl` روی یک پروفایل نشست موجود تنظیم شده باشد، OpenClaw
`--autoConnect` را رد می‌کند و endpoint را به‌طور خودکار به Chrome MCP ارسال می‌کند:

- `http(s)://...` → `--browserUrl <url>` (endpoint کشف HTTP در DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (CDP WebSocket مستقیم).

فلگ‌های endpoint و `userDataDir` نمی‌توانند ترکیب شوند: وقتی `cdpUrl` تنظیم شده باشد،
`userDataDir` برای اجرای Chrome MCP نادیده گرفته می‌شود، زیرا Chrome MCP به
مرورگر در حال اجرا پشت endpoint متصل می‌شود، نه اینکه یک پوشه
پروفایل را باز کند.

<Accordion title="Existing-session feature limitations">

در مقایسه با پروفایل مدیریت‌شده `openclaw`، driverهای نشست موجود محدودتر هستند:

- **اسکرین‌شات‌ها** — گرفتن تصویر صفحه و گرفتن تصویر عناصر با `--ref` کار می‌کند؛ selectorهای CSS `--element` کار نمی‌کنند. `--full-page` نمی‌تواند با `--ref` یا `--element` ترکیب شود. Playwright برای اسکرین‌شات‌های صفحه یا عنصرهای مبتنی بر ref لازم نیست.
- **کنش‌ها** — `click`، `type`، `hover`، `scrollIntoView`، `drag`، و `select` به refs اسنپ‌شات نیاز دارند (بدون selectorهای CSS). `click-coords` روی مختصات قابل‌مشاهده viewport کلیک می‌کند و به ref اسنپ‌شات نیاز ندارد. `click` فقط دکمه چپ است. `type` از `slowly=true` پشتیبانی نمی‌کند؛ از `fill` یا `press` استفاده کنید. `press` از `delayMs` پشتیبانی نمی‌کند. `type`، `hover`، `scrollIntoView`، `drag`، `select`، `fill`، و `evaluate` از timeoutهای جداگانه برای هر فراخوانی پشتیبانی نمی‌کنند. `select` یک مقدار واحد می‌پذیرد.
- **انتظار / آپلود / دیالوگ** — `wait --url` از الگوهای دقیق، زیررشته، و glob پشتیبانی می‌کند؛ `wait --load networkidle` پشتیبانی نمی‌شود. hookهای آپلود به `ref` یا `inputRef` نیاز دارند، هر بار یک فایل، بدون CSS `element`. hookهای دیالوگ از بازنویسی timeout پشتیبانی نمی‌کنند.
- **ویژگی‌های فقط مدیریت‌شده** — کنش‌های دسته‌ای، خروجی PDF، رهگیری دانلود، و `responsebody` همچنان به مسیر مرورگر مدیریت‌شده نیاز دارند.

</Accordion>

## تضمین‌های ایزوله‌سازی

- **پوشه داده کاربر اختصاصی**: هرگز به پروفایل مرورگر شخصی شما دست نمی‌زند.
- **درگاه‌های اختصاصی**: برای جلوگیری از برخورد با جریان‌های کاری توسعه، از `9222` پرهیز می‌کند.
- **کنترل تب قطعی**: `tabs` ابتدا `suggestedTargetId` را برمی‌گرداند، سپس
  handleهای پایدار `tabId` مانند `t1`، برچسب‌های اختیاری، و `targetId` خام را.
  عامل‌ها باید از `suggestedTargetId` دوباره استفاده کنند؛ شناسه‌های خام برای
  اشکال‌زدایی و سازگاری همچنان در دسترس می‌مانند.

## انتخاب مرورگر

هنگام اجرای محلی، OpenClaw نخستین مورد در دسترس را انتخاب می‌کند:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

می‌توانید با `browser.executablePath` بازنویسی کنید.

سکوها:

- macOS: مسیرهای `/Applications` و `~/Applications` را بررسی می‌کند.
- Linux: مکان‌های رایج Chrome/Brave/Edge/Chromium را زیر `/usr/bin`،
  `/snap/bin`، `/opt/google`، `/opt/brave.com`، `/usr/lib/chromium`، و
  `/usr/lib/chromium-browser` بررسی می‌کند.
- Windows: مکان‌های نصب رایج را بررسی می‌کند.

## API کنترل (اختیاری)

برای اسکریپت‌نویسی و اشکال‌زدایی، Gateway یک
**API کنترل HTTP فقط loopback** کوچک به‌همراه CLI متناظر `openclaw browser` ارائه می‌کند (اسنپ‌شات‌ها، refs، تقویت‌های wait، خروجی JSON، جریان‌های کاری اشکال‌زدایی). برای مرجع کامل، [API کنترل مرورگر](/fa/tools/browser-control) را ببینید.

## عیب‌یابی

برای مشکلات ویژه Linux (به‌خصوص snap Chromium)،
[عیب‌یابی مرورگر](/fa/tools/browser-linux-troubleshooting) را ببینید.

برای راه‌اندازی‌های میزبان جداگانه WSL2 Gateway + Windows Chrome،
[عیب‌یابی WSL2 + Windows + CDP راه دور Chrome](/fa/tools/browser-wsl2-windows-remote-cdp-troubleshooting) را ببینید.

### شکست راه‌اندازی CDP در برابر مسدودسازی SSRF پیمایش

این‌ها دسته‌های شکست متفاوتی هستند و به مسیرهای کد متفاوتی اشاره می‌کنند.

- **شکست راه‌اندازی یا آمادگی CDP** یعنی OpenClaw نمی‌تواند تأیید کند که control plane مرورگر سالم است.
- **مسدودسازی SSRF پیمایش** یعنی control plane مرورگر سالم است، اما هدف پیمایش صفحه توسط سیاست رد می‌شود.

مثال‌های رایج:

- شکست راه‌اندازی یا آمادگی CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` وقتی یک
    سرویس CDP خارجی loopback بدون `attachOnly: true` پیکربندی شده باشد
- مسدودسازی SSRF پیمایش:
  - جریان‌های `open`، `navigate`، اسنپ‌شات، یا باز کردن تب با خطای سیاست مرورگر/شبکه شکست می‌خورند، در حالی که `start` و `tabs` همچنان کار می‌کنند

برای جدا کردن این دو، از این توالی حداقلی استفاده کنید:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

روش خواندن نتایج:

- اگر `start` با `not reachable after start` شکست خورد، ابتدا آمادگی CDP را عیب‌یابی کنید.
- اگر `start` موفق شد اما `tabs` شکست خورد، control plane همچنان ناسالم است. این را مشکل دسترسی‌پذیری CDP بدانید، نه مشکل پیمایش صفحه.
- اگر `start` و `tabs` موفق شدند اما `open` یا `navigate` شکست خورد، control plane مرورگر فعال است و شکست در سیاست پیمایش یا صفحه هدف است.
- اگر `start`، `tabs`، و `open` همگی موفق شدند، مسیر پایه کنترل مرورگر مدیریت‌شده سالم است.

جزئیات رفتاری مهم:

- پیکربندی مرورگر حتی وقتی `browser.ssrfPolicy` را پیکربندی نمی‌کنید، به‌طور پیش‌فرض یک شیء سیاست SSRF fail-closed دارد.
- برای پروفایل مدیریت‌شده محلی loopback `openclaw`، بررسی‌های سلامت CDP عمداً اجرای دسترسی‌پذیری SSRF مرورگر را برای control plane محلی خود OpenClaw رد می‌کنند.
- محافظت پیمایش جدا است. نتیجه موفق `start` یا `tabs` به این معنی نیست که هدف بعدی `open` یا `navigate` مجاز است.

راهنمای امنیتی:

- به‌طور پیش‌فرض سیاست SSRF مرورگر را شل **نکنید**.
- استثناهای باریک میزبان مانند `hostnameAllowlist` یا `allowedHostnames` را به دسترسی گسترده شبکه خصوصی ترجیح دهید.
- `dangerouslyAllowPrivateNetwork: true` را فقط در محیط‌های عمداً مورد اعتماد که دسترسی مرورگر به شبکه خصوصی لازم و بازبینی‌شده است، استفاده کنید.

## ابزارهای عامل + سازوکار کنترل

عامل برای خودکارسازی مرورگر **یک ابزار** می‌گیرد:

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

نحوه نگاشت:

- `browser snapshot` یک درخت UI پایدار (AI یا ARIA) برمی‌گرداند.
- `browser act` از شناسه‌های `ref` در snapshot برای کلیک/تایپ/کشیدن/انتخاب استفاده می‌کند.
- `browser screenshot` پیکسل‌ها را ثبت می‌کند (کل صفحه، عنصر، یا refs برچسب‌دار).
- `browser doctor` آمادگی Gateway، plugin، profile، browser و tab را بررسی می‌کند.
- `browser` این موارد را می‌پذیرد:
  - `profile` برای انتخاب یک browser profile نام‌گذاری‌شده (openclaw، chrome، یا CDP راه‌دور).
  - `target` (`sandbox` | `host` | `node`) برای انتخاب محل قرارگیری مرورگر.
  - در نشست‌های sandboxed، `target: "host"` به `agents.defaults.sandbox.browser.allowHostControl=true` نیاز دارد.
  - اگر `target` حذف شود: نشست‌های sandboxed به‌طور پیش‌فرض از `sandbox` استفاده می‌کنند، و نشست‌های غیر sandbox به‌طور پیش‌فرض از `host`.
  - اگر node دارای قابلیت browser متصل باشد، ابزار ممکن است به‌صورت خودکار به آن مسیریابی شود، مگر اینکه `target="host"` یا `target="node"` را ثابت کنید.

این کار عامل را قطعی نگه می‌دارد و از selectorهای شکننده جلوگیری می‌کند.

## مرتبط

- [نمای کلی ابزارها](/fa/tools) — همه ابزارهای عاملِ در دسترس
- [Sandboxing](/fa/gateway/sandboxing) — کنترل مرورگر در محیط‌های sandboxed
- [امنیت](/fa/gateway/security) — ریسک‌های کنترل مرورگر و سخت‌سازی
