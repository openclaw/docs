---
read_when:
    - افزودن خودکارسازی مرورگر تحت کنترل عامل
    - اشکال‌زدایی اینکه چرا openclaw با Chrome خودتان تداخل دارد
    - پیاده‌سازی تنظیمات مرورگر + چرخهٔ حیات در برنامهٔ macOS
summary: سرویس کنترل مرورگر یکپارچه + فرمان‌های اقدام
title: مرورگر (مدیریت‌شده توسط OpenClaw)
x-i18n:
    generated_at: "2026-06-27T18:56:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d24586c4ac1e271c24511be98e30725f4f589e9f5e703294190058bc3e6a123
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw می‌تواند یک **نمایهٔ اختصاصی Chrome/Brave/Edge/Chromium** را اجرا کند که عامل آن را کنترل می‌کند.
این نمایه از مرورگر شخصی شما جداست و از طریق یک سرویس کنترل محلی کوچک
درون Gateway مدیریت می‌شود (فقط loopback).

نمای مبتدی:

- آن را مانند یک **مرورگر جداگانه و مخصوص عامل** در نظر بگیرید.
- نمایهٔ `openclaw` به نمایهٔ مرورگر شخصی شما **دست نمی‌زند**.
- عامل می‌تواند در یک مسیر امن **زبانه باز کند، صفحه‌ها را بخواند، کلیک کند و تایپ کند**.
- نمایهٔ داخلی `user` از طریق Chrome MCP به نشست واقعی واردشدهٔ Chrome شما متصل می‌شود.

## چه چیزی دریافت می‌کنید

- یک نمایهٔ مرورگر جداگانه به نام **openclaw** (با رنگ تاکیدی نارنجی به‌صورت پیش‌فرض).
- کنترل قطعی زبانه‌ها (فهرست/باز کردن/تمرکز/بستن).
- کنش‌های عامل (کلیک/تایپ/کشیدن/انتخاب)، snapshotها، نماگرفت‌ها، PDFها.
- یک مهارت همراه `browser-automation` که وقتی Plugin مرورگر فعال باشد، حلقهٔ بازیابی
  snapshot، زبانهٔ پایدار، مرجع کهنه و مانع دستی را به عامل‌ها آموزش می‌دهد.
- پشتیبانی اختیاری از چند نمایه (`openclaw`، `work`، `remote`، ...).

این مرورگر **مرورگر روزمرهٔ** شما نیست. این یک سطح امن و ایزوله برای
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

اگر `openclaw browser` کاملاً وجود ندارد، یا عامل می‌گوید ابزار مرورگر
در دسترس نیست، به [فرمان یا ابزار مرورگرِ گم‌شده](/fa/tools/browser#missing-browser-command-or-tool) بروید.

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

پیش‌فرض‌ها هم به `plugins.entries.browser.enabled` **و هم** به `browser.enabled=true` نیاز دارند. غیرفعال کردن فقط Plugin، `openclaw browser` CLI، متد Gateway با نام `browser.request`، ابزار عامل و سرویس کنترل را یکجا حذف می‌کند؛ پیکربندی `browser.*` شما برای جایگزین دست‌نخورده می‌ماند.

تغییرات پیکربندی مرورگر به راه‌اندازی دوبارهٔ Gateway نیاز دارد تا Plugin بتواند سرویس خود را دوباره ثبت کند.

## راهنمایی عامل

نکتهٔ نمایهٔ ابزار: `tools.profile: "coding"` شامل `web_search` و
`web_fetch` است، اما ابزار کامل `browser` را شامل نمی‌شود. اگر عامل یا یک
زیرعامل ایجادشده باید از اتوماسیون مرورگر استفاده کند، مرورگر را در مرحلهٔ
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
بعد از فیلترسازی نمایه اعمال می‌شود.

Plugin مرورگر دو سطح راهنمایی عامل ارائه می‌کند:

- توضیح ابزار `browser` قرارداد فشردهٔ همیشه‌فعال را حمل می‌کند: نمایهٔ درست را انتخاب کنید،
  مراجع را روی همان زبانه نگه دارید، برای هدف‌گیری زبانه از `tabId`/برچسب‌ها استفاده کنید،
  و برای کارهای چندمرحله‌ای مهارت مرورگر را بارگذاری کنید.
- مهارت همراه `browser-automation` حلقهٔ عملیاتی طولانی‌تر را حمل می‌کند:
  ابتدا وضعیت/زبانه‌ها را بررسی کنید، زبانه‌های کار را برچسب بزنید، پیش از اقدام snapshot بگیرید،
  پس از تغییرات UI دوباره snapshot بگیرید، مراجع کهنه را یک‌بار بازیابی کنید، و موانع ورود/2FA/captcha یا
  دوربین/میکروفون را به‌جای حدس زدن به‌عنوان اقدام دستی گزارش کنید.

مهارت‌های همراه Plugin وقتی Plugin فعال باشد در Skills در دسترس عامل فهرست می‌شوند.
دستورالعمل‌های کامل مهارت بر حسب نیاز بارگذاری می‌شوند، بنابراین نوبت‌های عادی
هزینهٔ کامل توکن را نمی‌پردازند.

## فرمان یا ابزار مرورگرِ گم‌شده

اگر پس از ارتقا `openclaw browser` ناشناخته است، `browser.request` وجود ندارد، یا عامل ابزار مرورگر را در دسترس نمی‌بیند، علت معمول یک فهرست `plugins.allow` است که `browser` را حذف کرده و هیچ بلوک پیکربندی ریشهٔ `browser` هم وجود ندارد. آن را اضافه کنید:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

یک بلوک ریشهٔ صریح `browser`، برای نمونه `browser.enabled=true` یا `browser.profiles.<name>`، حتی زیر یک `plugins.allow` محدودکننده نیز Plugin مرورگر همراه را فعال می‌کند و با رفتار پیکربندی کانال همخوان است. `plugins.entries.browser.enabled=true` و `tools.alsoAllow: ["browser"]` به‌تنهایی جایگزین عضویت در allowlist نمی‌شوند. حذف کامل `plugins.allow` نیز پیش‌فرض را بازمی‌گرداند.

## نمایه‌ها: `openclaw` در برابر `user`

- `openclaw`: مرورگر مدیریت‌شده و ایزوله (بدون نیاز به افزونه).
- `user`: نمایهٔ اتصال داخلی Chrome MCP برای نشست **واقعی واردشدهٔ Chrome**
  شما.

برای فراخوانی‌های ابزار مرورگر عامل:

- پیش‌فرض: از مرورگر ایزولهٔ `openclaw` استفاده کنید.
- وقتی نشست‌های واردشدهٔ موجود اهمیت دارند و کاربر پشت رایانه است تا هر درخواست اتصال را کلیک/تأیید کند،
  `profile="user"` را ترجیح دهید.
- وقتی یک حالت مرورگر مشخص می‌خواهید، `profile` بازنویسی صریح است.

اگر می‌خواهید حالت مدیریت‌شده پیش‌فرض باشد، `browser.defaultProfile: "openclaw"` را تنظیم کنید.

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

### بینایی نماگرفت (پشتیبانی از مدل فقط‌متنی)

وقتی مدل اصلی فقط‌متنی است (بدون پشتیبانی بینایی/چندوجهی)، نماگرفت‌های مرورگر
بلوک‌های تصویری برمی‌گردانند که مدل نمی‌تواند بخواند. نماگرفت‌های مرورگر
از پیکربندی موجود درک تصویر دوباره استفاده می‌کنند، بنابراین یک مدل تصویر
که برای درک رسانه پیکربندی شده باشد می‌تواند بدون هیچ تنظیم مدل مخصوص مرورگر،
نماگرفت‌ها را به‌صورت متن توصیف کند.

```json5
{
  tools: {
    media: {
      image: {
        models: [
          { provider: "bytedance", model: "doubao-seed-2.0-pro" },
          // Add fallback candidates; first success wins
          { provider: "openai", model: "gpt-4o" },
        ],
      },
      // Shared media models also work when tagged for image support.
      // models: [{ provider: "openai", model: "gpt-4o", capabilities: ["image"] }],
    },
  },
  agents: {
    defaults: {
      // Existing image-model defaults are also honored.
      // imageModel: { primary: "openai/gpt-4o" },
    },
  },
}
```

**نحوهٔ کار:**

1. عامل `browser screenshot` را فراخوانی می‌کند → تصویر مثل همیشه روی دیسک ثبت می‌شود.
2. ابزار مرورگر از runtime موجود درک تصویر می‌پرسد آیا می‌تواند
   نماگرفت را با استفاده از مدل‌های تصویر رسانهٔ پیکربندی‌شده، مدل‌های رسانهٔ مشترک،
   پیش‌فرض‌های مدل تصویر، یا یک ارائه‌دهندهٔ تصویر مبتنی بر احراز هویت توصیف کند.
3. مدل بینایی یک توصیف متنی برمی‌گرداند که با `wrapExternalContent`
   (محافظ تزریق پرامپت) بسته‌بندی می‌شود و به‌جای بلوک تصویر
   به‌صورت بلوک متن به عامل برگردانده می‌شود.
4. اگر درک تصویر در دسترس نباشد، رد شود، یا شکست بخورد، مرورگر به
   برگرداندن بلوک تصویر اصلی بازمی‌گردد.

برای fallbackهای مدل، timeoutها، محدودیت‌های بایت، نمایه‌ها و تنظیمات درخواست ارائه‌دهنده،
از فیلدهای موجود `tools.media.image` / `tools.media.models` استفاده کنید.

اگر مدل اصلی فعال از قبل از بینایی پشتیبانی می‌کند و هیچ مدل صریحی برای
درک تصویر پیکربندی نشده باشد، OpenClaw نتیجهٔ تصویر عادی را نگه می‌دارد تا
مدل اصلی بتواند نماگرفت را مستقیماً بخواند.

<AccordionGroup>

<Accordion title="Ports and reachability">

- سرویس کنترل روی loopback و روی درگاهی مشتق‌شده از `gateway.port` متصل می‌شود (پیش‌فرض `18791` = gateway + 2). بازنویسی `gateway.port` یا `OPENCLAW_GATEWAY_PORT` درگاه‌های مشتق‌شده را در همان خانواده جابه‌جا می‌کند.
- نمایه‌های محلی `openclaw` به‌صورت خودکار `cdpPort`/`cdpUrl` را اختصاص می‌دهند؛ این‌ها را فقط برای
  نمایه‌های CDP راه‌دور یا اتصال نقطهٔ پایانی نشست موجود تنظیم کنید. وقتی `cdpUrl` تنظیم نشده باشد،
  به‌صورت پیش‌فرض به درگاه CDP محلی مدیریت‌شده اشاره می‌کند.
- `remoteCdpTimeoutMs` برای بررسی‌های دسترسی‌پذیری HTTP در CDP راه‌دور و `attachOnly`
  و درخواست‌های HTTP باز کردن زبانه اعمال می‌شود؛ `remoteCdpHandshakeTimeoutMs` برای
  دست‌دهی‌های CDP WebSocket آن‌ها اعمال می‌شود.
- `localLaunchTimeoutMs` بودجهٔ زمانی برای یک فرایند Chrome مدیریت‌شدهٔ محلی است
  تا نقطهٔ پایانی HTTP خود را در CDP ارائه کند. `localCdpReadyTimeoutMs` بودجهٔ
  بعدی برای آمادگی websocket در CDP پس از کشف فرایند است.
  روی Raspberry Pi، VPSهای ضعیف، یا سخت‌افزار قدیمی‌تر که Chromium
  کند راه‌اندازی می‌شود، این مقادیر را افزایش دهید. مقادیر باید اعداد صحیح مثبت تا `120000` ms باشند؛ مقادیر
  پیکربندی نامعتبر رد می‌شوند.
- شکست‌های تکراری راه‌اندازی/آمادگی Chrome مدیریت‌شده برای هر
  نمایه circuit-break می‌شوند. پس از چند شکست پیاپی، OpenClaw به‌جای ایجاد Chromium در هر فراخوانی ابزار مرورگر،
  تلاش‌های راه‌اندازی جدید را کوتاه‌مدت متوقف می‌کند. مشکل راه‌اندازی را رفع کنید،
  اگر مرورگر لازم نیست آن را غیرفعال کنید، یا پس از تعمیر Gateway را دوباره راه‌اندازی کنید.
- `actionTimeoutMs` بودجهٔ پیش‌فرض برای درخواست‌های `act` مرورگر است وقتی فراخواننده `timeoutMs` را ارسال نمی‌کند. انتقال کلاینت یک بازهٔ مهلت کوچک اضافه می‌کند تا انتظارهای طولانی بتوانند به‌جای timeout شدن در مرز HTTP، کامل شوند.
- `tabCleanup` پاک‌سازی best-effort برای زبانه‌هایی است که توسط نشست‌های مرورگر عامل اصلی باز شده‌اند. پاک‌سازی چرخهٔ عمر زیرعامل، cron و ACP همچنان زبانه‌های ردیابی‌شدهٔ صریح خود را در پایان نشست می‌بندد؛ نشست‌های اصلی زبانه‌های فعال را قابل استفادهٔ دوباره نگه می‌دارند، سپس زبانه‌های ردیابی‌شدهٔ بیکار یا اضافی را در پس‌زمینه می‌بندند.

</Accordion>

<Accordion title="SSRF policy">

- پیمایش مرورگر و باز کردن برگه، پیش از پیمایش در برابر SSRF محافظت می‌شوند و سپس در صورت امکان روی URL نهایی `http(s)` دوباره بررسی می‌شوند.
- در حالت سخت‌گیرانه SSRF، کشف نقطه پایانی CDP راه دور و پروب‌های `/json/version` (`cdpUrl`) نیز بررسی می‌شوند.
- متغیرهای محیطی Gateway/ارائه‌دهنده یعنی `HTTP_PROXY`، `HTTPS_PROXY`، `ALL_PROXY` و `NO_PROXY` به‌طور خودکار مرورگر مدیریت‌شده توسط OpenClaw را از پروکسی عبور نمی‌دهند. Chrome مدیریت‌شده به‌صورت پیش‌فرض مستقیم اجرا می‌شود تا تنظیمات پروکسی ارائه‌دهنده، بررسی‌های SSRF مرورگر را تضعیف نکند.
- پروب‌های آمادگی CDP محلی مدیریت‌شده توسط OpenClaw و اتصال‌های WebSocket مربوط به DevTools، برای نقطه پایانی دقیق loopback اجراشده، پروکسی شبکه مدیریت‌شده را دور می‌زنند؛ بنابراین وقتی پروکسی اپراتور خروجی loopback را مسدود می‌کند، `openclaw browser start` همچنان کار می‌کند.
- برای عبور دادن خود مرورگر مدیریت‌شده از پروکسی، پرچم‌های صریح پروکسی Chrome را از طریق `browser.extraArgs` بفرستید، مانند `--proxy-server=...` یا `--proxy-pac-url=...`. حالت سخت‌گیرانه SSRF مسیر‌دهی صریح پروکسی مرورگر را مسدود می‌کند، مگر اینکه دسترسی مرورگر به شبکه خصوصی عمداً فعال شده باشد.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` به‌صورت پیش‌فرض خاموش است؛ آن را فقط زمانی فعال کنید که دسترسی مرورگر به شبکه خصوصی عمداً مورد اعتماد باشد.
- `browser.ssrfPolicy.allowPrivateNetwork` همچنان به‌عنوان نام مستعار قدیمی پشتیبانی می‌شود.

</Accordion>

<Accordion title="رفتار پروفایل">

- `attachOnly: true` یعنی هرگز مرورگر محلی اجرا نشود؛ فقط اگر مرورگری از قبل در حال اجرا باشد به آن متصل شود.
- `headless` می‌تواند به‌صورت سراسری یا برای هر پروفایل مدیریت‌شده محلی تنظیم شود. مقدارهای مخصوص پروفایل، `browser.headless` را بازنویسی می‌کنند؛ بنابراین یک پروفایل اجراشده محلی می‌تواند headless بماند در حالی که پروفایل دیگری قابل مشاهده باشد.
- `POST /start?headless=true` و `openclaw browser start --headless` برای پروفایل‌های مدیریت‌شده محلی، یک اجرای یک‌باره headless درخواست می‌کنند، بدون اینکه `browser.headless` یا پیکربندی پروفایل را بازنویسی کنند. پروفایل‌های نشست موجود، فقط-اتصال، و CDP راه دور این بازنویسی را رد می‌کنند، چون OpenClaw آن فرایندهای مرورگر را اجرا نمی‌کند.
- روی میزبان‌های Linux بدون `DISPLAY` یا `WAYLAND_DISPLAY`، وقتی نه محیط و نه پیکربندی پروفایل/سراسری به‌صورت صریح حالت دارای رابط را انتخاب نکرده باشند، پروفایل‌های مدیریت‌شده محلی به‌طور خودکار به‌صورت headless پیش‌فرض می‌شوند. `openclaw browser status --json` مقدار `headlessSource` را به‌صورت `env`، `profile`، `config`، `request`، `linux-display-fallback` یا `default` گزارش می‌کند.
- `OPENCLAW_BROWSER_HEADLESS=1` اجراهای مدیریت‌شده محلی را برای فرایند فعلی به‌اجبار headless می‌کند. `OPENCLAW_BROWSER_HEADLESS=0` برای شروع‌های عادی حالت دارای رابط را اجباری می‌کند و روی میزبان‌های Linux بدون سرور نمایش، خطایی قابل اقدام برمی‌گرداند؛ درخواست صریح `start --headless` همچنان برای همان یک اجرا اولویت دارد.
- `executablePath` می‌تواند به‌صورت سراسری یا برای هر پروفایل مدیریت‌شده محلی تنظیم شود. مقدارهای مخصوص پروفایل، `browser.executablePath` را بازنویسی می‌کنند؛ بنابراین پروفایل‌های مدیریت‌شده مختلف می‌توانند مرورگرهای مبتنی بر Chromium متفاوتی را اجرا کنند. هر دو شکل، `~` را برای دایرکتوری خانه سیستم‌عامل شما می‌پذیرند.
- `color` (در سطح بالا و برای هر پروفایل) رابط کاربری مرورگر را رنگی می‌کند تا بتوانید ببینید کدام پروفایل فعال است.
- پروفایل پیش‌فرض `openclaw` است (مستقل و مدیریت‌شده). برای انتخاب مرورگر کاربر واردشده، از `defaultProfile: "user"` استفاده کنید.
- ترتیب تشخیص خودکار: مرورگر پیش‌فرض سیستم اگر مبتنی بر Chromium باشد؛ در غیر این صورت Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` به‌جای CDP خام از Chrome DevTools MCP استفاده می‌کند. می‌تواند از طریق اتصال خودکار Chrome MCP، یا از طریق `cdpUrl` وقتی از قبل یک نقطه پایانی DevTools برای مرورگر در حال اجرا دارید، متصل شود.
- وقتی یک پروفایل نشست موجود باید به یک پروفایل کاربری غیرپیش‌فرض Chromium (Brave، Edge و غیره) متصل شود، `browser.profiles.<name>.userDataDir` را تنظیم کنید. این مسیر نیز `~` را برای دایرکتوری خانه سیستم‌عامل شما می‌پذیرد.

</Accordion>

</AccordionGroup>

## استفاده از Brave یا مرورگر دیگری مبتنی بر Chromium

اگر مرورگر **پیش‌فرض سیستم** شما مبتنی بر Chromium باشد (Chrome/Brave/Edge/و غیره)،
OpenClaw به‌طور خودکار از آن استفاده می‌کند. برای بازنویسی
تشخیص خودکار، `browser.executablePath` را تنظیم کنید. مقدارهای `executablePath`
در سطح بالا و برای هر پروفایل، `~` را برای دایرکتوری خانه سیستم‌عامل شما می‌پذیرند:

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

`executablePath` مخصوص پروفایل فقط بر پروفایل‌های مدیریت‌شده محلی که OpenClaw
اجرا می‌کند اثر می‌گذارد. پروفایل‌های `existing-session` در عوض به مرورگری
که از قبل در حال اجرا است متصل می‌شوند، و پروفایل‌های CDP راه دور از مرورگر پشت `cdpUrl` استفاده می‌کنند.

## کنترل محلی در برابر راه دور

- **کنترل محلی (پیش‌فرض):** Gateway سرویس کنترل loopback را شروع می‌کند و می‌تواند یک مرورگر محلی اجرا کند.
- **کنترل راه دور (میزبان node):** یک میزبان node را روی دستگاهی که مرورگر را دارد اجرا کنید؛ Gateway کنش‌های مرورگر را از طریق پروکسی به آن می‌فرستد.
- **CDP راه دور:** برای اتصال به یک مرورگر راه دور مبتنی بر Chromium، `browser.profiles.<name>.cdpUrl` (یا `browser.cdpUrl`) را تنظیم کنید. در این حالت، OpenClaw مرورگر محلی اجرا نمی‌کند.
- برای سرویس‌های CDP مدیریت‌شده بیرونی روی loopback (برای مثال Browserless در
  Docker که روی `127.0.0.1` منتشر شده است)، `attachOnly: true` را نیز تنظیم کنید. CDP روی loopback
  بدون `attachOnly` به‌عنوان پروفایل مرورگر محلی مدیریت‌شده توسط OpenClaw در نظر گرفته می‌شود.
- `headless` فقط بر پروفایل‌های مدیریت‌شده محلی که OpenClaw اجرا می‌کند اثر می‌گذارد. مرورگرهای نشست موجود یا CDP راه دور را راه‌اندازی مجدد یا تغییر نمی‌دهد.
- `executablePath` از همان قاعده پروفایل مدیریت‌شده محلی پیروی می‌کند. تغییر آن روی یک پروفایل مدیریت‌شده محلی در حال اجرا، آن پروفایل را برای راه‌اندازی مجدد/همگام‌سازی علامت‌گذاری می‌کند تا اجرای بعدی از باینری جدید استفاده کند.

رفتار توقف بسته به حالت پروفایل متفاوت است:

- پروفایل‌های مدیریت‌شده محلی: `openclaw browser stop` فرایند مرورگری را که
  OpenClaw اجرا کرده است متوقف می‌کند
- پروفایل‌های فقط-اتصال و CDP راه دور: `openclaw browser stop` نشست کنترل فعال را می‌بندد و بازنویسی‌های شبیه‌سازی Playwright/CDP (viewport،
  طرح رنگ، locale، منطقه زمانی، حالت آفلاین و وضعیت‌های مشابه) را آزاد می‌کند، حتی
  اگر هیچ فرایند مرورگری توسط OpenClaw اجرا نشده باشد

URLهای CDP راه دور می‌توانند شامل احراز هویت باشند:

- توکن‌های پرس‌وجو (مثلاً `https://provider.example?token=<token>`)
- احراز هویت HTTP Basic (مثلاً `https://user:pass@provider.example`)

OpenClaw هنگام فراخوانی نقطه‌های پایانی `/json/*` و هنگام اتصال به WebSocket مربوط به CDP،
احراز هویت را حفظ می‌کند. برای توکن‌ها، به‌جای ثبت آن‌ها در فایل‌های پیکربندی، از متغیرهای محیطی یا مدیرهای secrets استفاده کنید.

## پروکسی مرورگر Node (پیش‌فرض بدون پیکربندی)

اگر یک **میزبان node** را روی دستگاهی اجرا کنید که مرورگر شما را دارد، OpenClaw می‌تواند
فراخوانی‌های ابزار مرورگر را بدون هیچ پیکربندی اضافی مرورگر، به‌صورت خودکار به آن node مسیر‌دهی کند.
این مسیر پیش‌فرض برای gatewayهای راه دور است.

نکته‌ها:

- میزبان node سرور کنترل مرورگر محلی خود را از طریق یک **فرمان پروکسی** در دسترس قرار می‌دهد.
- پروفایل‌ها از پیکربندی `browser.profiles` خود node می‌آیند (همانند حالت محلی).
- `nodeHost.browserProxy.allowProfiles` اختیاری است. برای رفتار قدیمی/پیش‌فرض، آن را خالی بگذارید: همه پروفایل‌های پیکربندی‌شده از طریق پروکسی قابل دسترسی می‌مانند، از جمله مسیرهای ایجاد/حذف پروفایل.
- اگر `nodeHost.browserProxy.allowProfiles` را تنظیم کنید، OpenClaw آن را به‌عنوان مرز حداقل‌دسترسی در نظر می‌گیرد: فقط پروفایل‌های allowlistشده می‌توانند هدف قرار بگیرند، و مسیرهای پایدار ایجاد/حذف پروفایل روی سطح پروکسی مسدود می‌شوند.
- اگر آن را نمی‌خواهید غیرفعال کنید:
  - روی node: `nodeHost.browserProxy.enabled=false`
  - روی gateway: `gateway.nodes.browser.mode="off"`

## Browserless (CDP راه دور میزبانی‌شده)

[Browserless](https://browserless.io) یک سرویس Chromium میزبانی‌شده است که
URLهای اتصال CDP را از طریق HTTPS و WebSocket ارائه می‌کند. OpenClaw می‌تواند از هر دو شکل استفاده کند، اما
برای یک پروفایل مرورگر راه دور، ساده‌ترین گزینه URL مستقیم WebSocket
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
- نقطه پایانی منطقه‌ای را انتخاب کنید که با حساب Browserless شما مطابقت دارد (مستندات آن‌ها را ببینید).
- اگر Browserless به شما یک URL پایه HTTPS می‌دهد، می‌توانید آن را برای اتصال مستقیم CDP به `wss://` تبدیل کنید یا URL HTTPS را نگه دارید و اجازه دهید OpenClaw
  `/json/version` را کشف کند.

### Browserless Docker روی همان میزبان

وقتی Browserless به‌صورت خودمیزبان در Docker اجرا می‌شود و OpenClaw روی میزبان اجرا می‌شود، با
Browserless به‌عنوان یک سرویس CDP مدیریت‌شده بیرونی رفتار کنید:

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
OpenClaw قابل دسترسی باشد. Browserless همچنین باید یک نقطه پایانی قابل دسترسی و مطابق را اعلام کند؛ مقدار `EXTERNAL` در Browserless را روی همان پایه WebSocket عمومی-برای-OpenClaw تنظیم کنید، مانند
`ws://127.0.0.1:3000`، `ws://browserless:3000`، یا یک نشانی پایدار شبکه خصوصی Docker. اگر `/json/version` مقدار `webSocketDebuggerUrl` را نشان دهد که به
نشانی‌ای اشاره می‌کند که OpenClaw نمی‌تواند به آن برسد، CDP HTTP ممکن است سالم به نظر برسد، در حالی که اتصال WebSocket
همچنان شکست می‌خورد.

برای پروفایل Browserless روی loopback، `attachOnly` را تنظیم‌نشده رها نکنید. بدون
`attachOnly`، OpenClaw پورت loopback را به‌عنوان پروفایل مرورگر مدیریت‌شده محلی
در نظر می‌گیرد و ممکن است گزارش کند که پورت در حال استفاده است اما متعلق به OpenClaw نیست.

## ارائه‌دهندگان مستقیم WebSocket CDP

برخی سرویس‌های مرورگر میزبانی‌شده به‌جای کشف استاندارد مبتنی بر HTTP مربوط به CDP
(`/json/version`)، یک نقطه پایانی **مستقیم WebSocket** ارائه می‌کنند. OpenClaw سه
شکل URL مربوط به CDP را می‌پذیرد و راهبرد اتصال مناسب را به‌طور خودکار انتخاب می‌کند:

- **کشف HTTP(S)** - `http://host[:port]` یا `https://host[:port]`.
  OpenClaw برای کشف URL اشکال‌زدای WebSocket، `/json/version` را فراخوانی می‌کند و سپس
  متصل می‌شود. بدون fallback به WebSocket.
- **نقطه‌های پایانی مستقیم WebSocket** - `ws://host[:port]/devtools/<kind>/<id>` یا
  `wss://...` با مسیر `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw مستقیماً از طریق handshake مربوط به WebSocket متصل می‌شود و
  `/json/version` را کاملاً رد می‌کند.
- **ریشه‌های ساده WebSocket** - `ws://host[:port]` یا `wss://host[:port]` بدون
  مسیر `/devtools/...` (مثلاً [Browserless](https://browserless.io)،
  [Browserbase](https://www.browserbase.com)). OpenClaw ابتدا کشف HTTP
  `/json/version` را امتحان می‌کند (با نرمال‌سازی scheme به `http`/`https`)؛
  اگر کشف، `webSocketDebuggerUrl` برگرداند از آن استفاده می‌شود، در غیر این صورت OpenClaw
  به handshake مستقیم WebSocket روی ریشه ساده fallback می‌کند. اگر نقطه پایانی
  WebSocket اعلام‌شده handshake مربوط به CDP را رد کند اما ریشه ساده پیکربندی‌شده
  آن را بپذیرد، OpenClaw به همان ریشه نیز fallback می‌کند. این باعث می‌شود یک `ws://` ساده
  که به Chrome محلی اشاره دارد همچنان متصل شود، چون Chrome فقط ارتقاهای WebSocket
  را روی مسیر خاص هر هدف از `/json/version` می‌پذیرد، در حالی که ارائه‌دهندگان میزبانی‌شده
  همچنان می‌توانند از نقطه پایانی ریشه WebSocket خود استفاده کنند وقتی نقطه پایانی کشف آن‌ها
  URL کوتاه‌عمری را اعلام می‌کند که برای Playwright CDP مناسب نیست.

`openclaw browser doctor` از همان منطق اول-کشف، سپس fallback به WebSocket
مانند اتصال زمان اجرا استفاده می‌کند؛ بنابراین URL ریشه ساده‌ای که با موفقیت متصل می‌شود،
در diagnostics به‌عنوان غیرقابل دسترس گزارش نمی‌شود.

### Browserbase

[Browserbase](https://www.browserbase.com) یک پلتفرم ابری برای اجرای
مرورگرهای headless با حل CAPTCHA داخلی، حالت stealth و پروکسی‌های مسکونی است.

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
- Browserbase هنگام اتصال WebSocket به‌صورت خودکار یک نشست مرورگر ایجاد می‌کند، بنابراین
  به مرحله ایجاد دستی نشست نیازی نیست.
- سطح رایگان اجازه یک نشست هم‌زمان و یک ساعت مرورگر در ماه را می‌دهد.
  برای محدودیت‌های طرح‌های پولی، [قیمت‌گذاری](https://www.browserbase.com/pricing) را ببینید.
- برای مرجع کامل API، راهنماهای SDK و نمونه‌های یکپارچه‌سازی، [مستندات Browserbase](https://docs.browserbase.com) را ببینید.

### Notte

[Notte](https://www.notte.cc) یک پلتفرم ابری برای اجرای مرورگرهای headless
با stealth داخلی، پراکسی‌های مسکونی و یک Gateway وب‌سوکت بومی CDP است.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "notte",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      notte: {
        cdpUrl: "wss://us-prod.notte.cc/sessions/connect?token=<NOTTE_API_KEY>",
        color: "#7C3AED",
      },
    },
  },
}
```

نکات:

- [ثبت‌نام کنید](https://console.notte.cc) و **API Key** خود را از صفحه
  تنظیمات کنسول کپی کنید.
- `<NOTTE_API_KEY>` را با کلید API واقعی Notte خود جایگزین کنید.
- Notte هنگام اتصال WebSocket به‌صورت خودکار یک نشست مرورگر ایجاد می‌کند، بنابراین به مرحله
  ایجاد دستی نشست نیازی نیست. وقتی WebSocket قطع شود، نشست از بین می‌رود.
- سطح رایگان اجازه پنج نشست هم‌زمان و ۱۰۰ ساعت مرورگر مادام‌العمر را می‌دهد.
  برای محدودیت‌های طرح‌های پولی، [قیمت‌گذاری](https://www.notte.cc/#pricing) را ببینید.
- برای مرجع کامل API، راهنماهای SDK و نمونه‌های یکپارچه‌سازی، [مستندات Notte](https://docs.notte.cc) را ببینید.

## امنیت

ایده‌های کلیدی:

- کنترل مرورگر فقط loopback است؛ دسترسی از طریق احراز هویت Gateway یا جفت‌سازی node عبور می‌کند.
- API مرورگر HTTP مستقل loopback **فقط از احراز هویت با راز مشترک** استفاده می‌کند:
  احراز هویت bearer با توکن gateway، `x-openclaw-password`، یا احراز هویت HTTP Basic با
  گذرواژه gateway پیکربندی‌شده.
- سرآیندهای هویت Tailscale Serve و `gateway.auth.mode: "trusted-proxy"` این
  API مرورگر مستقل loopback را احراز هویت نمی‌کنند.
- اگر کنترل مرورگر فعال باشد و هیچ احراز هویت راز مشترکی پیکربندی نشده باشد، OpenClaw
  برای همان راه‌اندازی یک توکن gateway فقط در زمان اجرا تولید می‌کند. اگر کلاینت‌ها به یک راز پایدار در میان
  راه‌اندازی‌های مجدد نیاز دارند، `gateway.auth.token`، `gateway.auth.password`، `OPENCLAW_GATEWAY_TOKEN` یا
  `OPENCLAW_GATEWAY_PASSWORD` را صریح پیکربندی کنید.
- وقتی `gateway.auth.mode` از قبل `password`، `none` یا `trusted-proxy` باشد،
  OpenClaw آن توکن را به‌صورت خودکار تولید نمی‌کند.
- Gateway و هر میزبان node را روی یک شبکه خصوصی (Tailscale) نگه دارید؛ از قرار دادن عمومی آن‌ها پرهیز کنید.
- URLها/توکن‌های CDP راه‌دور را مانند رازها در نظر بگیرید؛ env varها یا یک مدیر راز را ترجیح دهید.

نکات CDP راه‌دور:

- در صورت امکان، endpointهای رمزنگاری‌شده (HTTPS یا WSS) و توکن‌های کوتاه‌عمر را ترجیح دهید.
- از قراردادن مستقیم توکن‌های بلندمدت در فایل‌های پیکربندی پرهیز کنید.

## پروفایل‌ها (چندمرورگری)

OpenClaw از چند پروفایل نام‌گذاری‌شده (پیکربندی‌های مسیریابی) پشتیبانی می‌کند. پروفایل‌ها می‌توانند این‌گونه باشند:

- **مدیریت‌شده توسط openclaw**: یک نمونه مرورگر اختصاصی مبتنی بر Chromium با دایرکتوری داده کاربر و پورت CDP خودش
- **راه‌دور**: یک URL صریح CDP (مرورگر مبتنی بر Chromium که جای دیگری اجرا می‌شود)
- **نشست موجود**: پروفایل Chrome موجود شما از طریق اتصال خودکار Chrome DevTools MCP

پیش‌فرض‌ها:

- اگر پروفایل `openclaw` موجود نباشد، به‌صورت خودکار ایجاد می‌شود.
- پروفایل `user` برای اتصال به نشست موجود Chrome MCP به‌صورت داخلی وجود دارد.
- پروفایل‌های نشست موجود فراتر از `user` اختیاری هستند؛ آن‌ها را با `--driver existing-session` ایجاد کنید.
- پورت‌های CDP محلی به‌صورت پیش‌فرض از **18800-18899** تخصیص داده می‌شوند.
- حذف یک پروفایل، دایرکتوری داده محلی آن را به Trash منتقل می‌کند.

همه endpointهای کنترل `?profile=<name>` را می‌پذیرند؛ CLI از `--browser-profile` استفاده می‌کند.

## نشست موجود از طریق Chrome DevTools MCP

OpenClaw همچنین می‌تواند از طریق سرور رسمی Chrome DevTools MCP به یک پروفایل مرورگر مبتنی بر Chromium در حال اجرا
متصل شود. این کار از زبانه‌ها و وضعیت ورود
از قبل بازشده در آن پروفایل مرورگر دوباره استفاده می‌کند.

منابع رسمی پیش‌زمینه و راه‌اندازی:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

پروفایل داخلی:

- `user`

اختیاری: اگر نام، رنگ یا دایرکتوری داده مرورگر متفاوتی می‌خواهید، پروفایل نشست موجود سفارشی خودتان را ایجاد کنید.

رفتار پیش‌فرض:

- پروفایل داخلی `user` از اتصال خودکار Chrome MCP استفاده می‌کند که پروفایل محلی پیش‌فرض Google Chrome را هدف می‌گیرد.

برای Brave، Edge، Chromium یا یک پروفایل Chrome غیرپیش‌فرض از `userDataDir` استفاده کنید.
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

سپس در مرورگر مطابق:

1. صفحه inspect آن مرورگر را برای اشکال‌زدایی راه‌دور باز کنید.
2. اشکال‌زدایی راه‌دور را فعال کنید.
3. مرورگر را در حال اجرا نگه دارید و وقتی OpenClaw متصل می‌شود، اعلان تأیید اتصال را بپذیرید.

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
- `tabs` زبانه‌های مرورگر از قبل باز شما را فهرست می‌کند
- `snapshot` از زبانه زنده انتخاب‌شده refها را برمی‌گرداند

اگر اتصال کار نکرد، چه چیزهایی را بررسی کنید:

- مرورگر هدف مبتنی بر Chromium نسخه `144+` باشد
- اشکال‌زدایی راه‌دور در صفحه inspect آن مرورگر فعال باشد
- مرورگر اعلان رضایت اتصال را نشان داده باشد و شما آن را پذیرفته باشید
- اگر Chrome با یک `--remote-debugging-port` صریح شروع شده است، به‌جای تکیه بر
  اتصال خودکار Chrome MCP، `browser.profiles.<name>.cdpUrl` را روی همان endpoint DevTools تنظیم کنید
- `openclaw doctor` پیکربندی قدیمی مرورگر مبتنی بر Plugin را مهاجرت می‌دهد و بررسی می‌کند که
  Chrome برای پروفایل‌های اتصال خودکار پیش‌فرض به‌صورت محلی نصب باشد، اما نمی‌تواند
  اشکال‌زدایی راه‌دور سمت مرورگر را برای شما فعال کند

استفاده عامل:

- وقتی به وضعیت مرورگر واردشده کاربر نیاز دارید، از `profile="user"` استفاده کنید.
- اگر از یک پروفایل نشست موجود سفارشی استفاده می‌کنید، همان نام پروفایل صریح را پاس دهید.
- این حالت را فقط زمانی انتخاب کنید که کاربر پشت رایانه باشد تا اعلان اتصال را تأیید کند.
- Gateway یا میزبان node می‌تواند `npx chrome-devtools-mcp@latest --autoConnect` را spawn کند

نکات:

- این مسیر از پروفایل ایزوله `openclaw` پرریسک‌تر است، چون می‌تواند
  داخل نشست مرورگر واردشده شما عمل کند.
- OpenClaw مرورگر را برای این driver اجرا نمی‌کند؛ فقط متصل می‌شود.
- OpenClaw در اینجا از جریان رسمی Chrome DevTools MCP `--autoConnect` استفاده می‌کند. اگر
  `userDataDir` تنظیم شده باشد، برای هدف‌گیری آن دایرکتوری داده کاربر عبور داده می‌شود.
- نشست موجود می‌تواند روی میزبان انتخاب‌شده یا از طریق یک node مرورگر متصل وصل شود.
  اگر Chrome جای دیگری است و هیچ node مرورگری متصل نیست، به‌جای آن از CDP راه‌دور یا یک میزبان node استفاده کنید.

### اجرای سفارشی Chrome MCP

وقتی جریان پیش‌فرض `npx chrome-devtools-mcp@latest` چیزی نیست که می‌خواهید
(میزبان‌های آفلاین، نسخه‌های پین‌شده، باینری‌های vendored)، سرور Chrome DevTools MCP ایجادشده را برای هر پروفایل بازنویسی کنید:

| فیلد        | چه کاری انجام می‌دهد                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | فایل اجرایی برای spawn به‌جای `npx`. همان‌طور که هست resolve می‌شود؛ مسیرهای مطلق رعایت می‌شوند.                                          |
| `mcpArgs`    | آرایه آرگومان که عیناً به `mcpCommand` پاس داده می‌شود. آرگومان‌های پیش‌فرض `chrome-devtools-mcp@latest --autoConnect` را جایگزین می‌کند. |

وقتی `cdpUrl` روی یک پروفایل نشست موجود تنظیم شود، OpenClaw
`--autoConnect` را رد می‌کند و endpoint را به‌صورت خودکار به Chrome MCP فوروارد می‌کند:

- `http(s)://...` → `--browserUrl <url>` (endpoint کشف HTTP DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (وب‌سوکت مستقیم CDP).

پرچم‌های endpoint و `userDataDir` را نمی‌توان با هم ترکیب کرد: وقتی `cdpUrl` تنظیم شده باشد،
`userDataDir` برای اجرای Chrome MCP نادیده گرفته می‌شود، چون Chrome MCP به
مرورگر در حال اجرا پشت endpoint متصل می‌شود، نه اینکه یک دایرکتوری
پروفایل را باز کند.

<Accordion title="Existing-session feature limitations">

در مقایسه با پروفایل مدیریت‌شده `openclaw`، driverهای نشست موجود محدودتر هستند:

- **اسکرین‌شات‌ها** - گرفتن تصویر صفحه و گرفتن تصویر عنصر با `--ref` کار می‌کند؛ selectorهای CSS `--element` کار نمی‌کنند. `--full-page` نمی‌تواند با `--ref` یا `--element` ترکیب شود. Playwright برای اسکرین‌شات‌های صفحه یا عنصر مبتنی بر ref لازم نیست.
- **اقدام‌ها** - `click`، `type`، `hover`، `scrollIntoView`، `drag` و `select` به refهای snapshot نیاز دارند (بدون selectorهای CSS). `click-coords` روی مختصات viewport قابل‌مشاهده کلیک می‌کند و به ref snapshot نیاز ندارد. `click` فقط دکمه چپ است. `type` از `slowly=true` پشتیبانی نمی‌کند؛ از `fill` یا `press` استفاده کنید. `press` از `delayMs` پشتیبانی نمی‌کند. `type`، `hover`، `scrollIntoView`، `drag`، `select`، `fill` و `evaluate` از timeoutهای هر فراخوانی پشتیبانی نمی‌کنند. `select` یک مقدار واحد را می‌پذیرد.
- **انتظار / بارگذاری / دیالوگ** - `wait --url` از الگوهای دقیق، زیررشته و glob پشتیبانی می‌کند؛ `wait --load networkidle` روی پروفایل‌های نشست موجود پشتیبانی نمی‌شود (روی پروفایل‌های مدیریت‌شده و CDP خام/راه‌دور کار می‌کند). hookهای بارگذاری به `ref` یا `inputRef` نیاز دارند، هر بار یک فایل، بدون CSS `element`. hookهای دیالوگ از بازنویسی timeout یا `dialogId` پشتیبانی نمی‌کنند.
- **نمایانی دیالوگ** - پاسخ‌های اقدام مرورگر مدیریت‌شده وقتی یک اقدام دیالوگ modal باز کند، شامل `blockedByDialog` و `browserState.dialogs.pending` هستند؛ snapshotها نیز وضعیت دیالوگ pending را شامل می‌شوند. وقتی دیالوگی pending است، با `browser dialog --accept/--dismiss --dialog-id <id>` پاسخ دهید. دیالوگ‌هایی که بیرون از OpenClaw مدیریت شده‌اند، زیر `browserState.dialogs.recent` ظاهر می‌شوند.
- **ویژگی‌های فقط مدیریت‌شده** - اقدام‌های دسته‌ای، خروجی PDF، رهگیری دانلود و `responsebody` همچنان به مسیر مرورگر مدیریت‌شده نیاز دارند.

</Accordion>

## تضمین‌های ایزولاسیون

- **دایرکتوری داده کاربر اختصاصی**: هرگز به پروفایل مرورگر شخصی شما دست نمی‌زند.
- **پورت‌های اختصاصی**: برای جلوگیری از تداخل با گردش‌کارهای توسعه از `9222` پرهیز می‌کند.
- **کنترل قطعی زبانه**: `tabs` ابتدا `suggestedTargetId` را برمی‌گرداند، سپس
  handleهای پایدار `tabId` مانند `t1`، برچسب‌های اختیاری و `targetId` خام را.
  عامل‌ها باید از `suggestedTargetId` دوباره استفاده کنند؛ شناسه‌های خام برای
  اشکال‌زدایی و سازگاری همچنان در دسترس می‌مانند.

## انتخاب مرورگر

هنگام اجرای محلی، OpenClaw اولین مورد موجود را انتخاب می‌کند:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

می‌توانید با `browser.executablePath` بازنویسی کنید.

پلتفرم‌ها:

- macOS: `/Applications` و `~/Applications` را بررسی می‌کند.
- Linux: مکان‌های رایج Chrome/Brave/Edge/Chromium زیر `/usr/bin`،
  `/snap/bin`، `/opt/google`، `/opt/brave.com`، `/usr/lib/chromium` و
  `/usr/lib/chromium-browser`، به‌علاوه Chromium مدیریت‌شده توسط Playwright زیر
  `PLAYWRIGHT_BROWSERS_PATH` یا `~/.cache/ms-playwright` را بررسی می‌کند.
- Windows: مکان‌های نصب رایج را بررسی می‌کند.

## API کنترل (اختیاری)

برای اسکریپت‌نویسی و اشکال‌زدایی، Gateway یک **API کنترل HTTP فقط loopback**
کوچک به‌علاوه CLI متناظر `openclaw browser` را ارائه می‌کند (snapshotها، refها، قابلیت‌های wait
power-up، خروجی JSON، گردش‌کارهای اشکال‌زدایی). برای مرجع کامل،
[API کنترل مرورگر](/fa/tools/browser-control) را ببینید.

## عیب‌یابی

برای مشکلات ویژه لینوکس (به‌ویژه snap Chromium)، ببینید
[عیب‌یابی مرورگر](/fa/tools/browser-linux-troubleshooting).

برای راه‌اندازی‌های جداشده میزبان WSL2 Gateway + Windows Chrome، ببینید
[عیب‌یابی WSL2 + Windows + remote Chrome CDP](/fa/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### شکست راه‌اندازی CDP در برابر مسدودسازی SSRF ناوبری

این‌ها دسته‌های شکست متفاوتی هستند و به مسیرهای کد متفاوتی اشاره می‌کنند.

- **شکست راه‌اندازی یا آمادگی CDP** یعنی OpenClaw نمی‌تواند تأیید کند که صفحه کنترل مرورگر سالم است.
- **مسدودسازی SSRF ناوبری** یعنی صفحه کنترل مرورگر سالم است، اما مقصد ناوبری صفحه توسط سیاست رد شده است.

نمونه‌های رایج:

- شکست راه‌اندازی یا آمادگی CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` وقتی یک
    سرویس CDP خارجی local loopback بدون `attachOnly: true` پیکربندی شده باشد
- مسدودسازی SSRF ناوبری:
  - جریان‌های `open`، `navigate`، snapshot، یا بازکردن زبانه با خطای سیاست مرورگر/شبکه شکست می‌خورند، در حالی که `start` و `tabs` همچنان کار می‌کنند

برای جدا کردن این دو، از این توالی حداقلی استفاده کنید:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

نحوه خواندن نتایج:

- اگر `start` با `not reachable after start` شکست بخورد، ابتدا آمادگی CDP را عیب‌یابی کنید.
- اگر `start` موفق شود اما `tabs` شکست بخورد، صفحه کنترل همچنان ناسالم است. این را یک مشکل دسترسی‌پذیری CDP در نظر بگیرید، نه مشکل ناوبری صفحه.
- اگر `start` و `tabs` موفق شوند اما `open` یا `navigate` شکست بخورد، صفحه کنترل مرورگر فعال است و شکست در سیاست ناوبری یا صفحه مقصد است.
- اگر `start`، `tabs` و `open` همگی موفق شوند، مسیر کنترل پایه مرورگر مدیریت‌شده سالم است.

جزئیات رفتاری مهم:

- پیکربندی مرورگر حتی وقتی `browser.ssrfPolicy` را پیکربندی نمی‌کنید، به‌صورت پیش‌فرض از یک شیء سیاست SSRF با حالت fail-closed استفاده می‌کند.
- برای پروفایل مدیریت‌شده local loopback `openclaw`، بررسی‌های سلامت CDP عمداً اعمال دسترسی‌پذیری SSRF مرورگر را برای صفحه کنترل محلی خود OpenClaw نادیده می‌گیرند.
- حفاظت ناوبری جداگانه است. نتیجه موفق `start` یا `tabs` به این معنا نیست که مقصد بعدی `open` یا `navigate` مجاز است.

راهنمایی امنیتی:

- به‌صورت پیش‌فرض سیاست SSRF مرورگر را **شل نکنید**.
- استثناهای محدود میزبان مانند `hostnameAllowlist` یا `allowedHostnames` را به دسترسی گسترده شبکه خصوصی ترجیح دهید.
- از `dangerouslyAllowPrivateNetwork: true` فقط در محیط‌های عمداً مورداعتماد استفاده کنید که دسترسی مرورگر به شبکه خصوصی لازم و بازبینی شده است.

## ابزارهای عامل + نحوه کار کنترل

عامل برای خودکارسازی مرورگر **یک ابزار** دریافت می‌کند:

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

نحوه نگاشت آن:

- `browser snapshot` یک درخت UI پایدار برمی‌گرداند (AI یا ARIA).
- `browser act` از شناسه‌های `ref` در snapshot برای کلیک/تایپ/کشیدن/انتخاب استفاده می‌کند.
- `browser screenshot` پیکسل‌ها را ثبت می‌کند (کل صفحه، عنصر، یا refs برچسب‌دار).
- `browser doctor` آمادگی Gateway، Plugin، پروفایل، مرورگر، و زبانه را بررسی می‌کند.
- `browser` می‌پذیرد:
  - `profile` برای انتخاب یک پروفایل مرورگر نام‌گذاری‌شده (openclaw، chrome، یا remote CDP).
  - `target` (`sandbox` | `host` | `node`) برای انتخاب محل اجرای مرورگر.
  - در نشست‌های sandboxed، `target: "host"` به `agents.defaults.sandbox.browser.allowHostControl=true` نیاز دارد.
  - اگر `target` حذف شود: نشست‌های sandboxed به‌صورت پیش‌فرض `sandbox` هستند، نشست‌های غیر sandbox به‌صورت پیش‌فرض `host` هستند.
  - اگر یک node با قابلیت مرورگر متصل باشد، ابزار ممکن است به‌صورت خودکار به آن مسیریابی کند مگر اینکه `target="host"` یا `target="node"` را ثابت کنید.

این کار عامل را قطعی نگه می‌دارد و از انتخاب‌گرهای شکننده جلوگیری می‌کند.

## مرتبط

- [نمای کلی ابزارها](/fa/tools) - همه ابزارهای عامل موجود
- [Sandboxing](/fa/gateway/sandboxing) - کنترل مرورگر در محیط‌های sandboxed
- [امنیت](/fa/gateway/security) - خطرات کنترل مرورگر و سخت‌سازی
